# Genera las texturas continuas del 3D (img/textura-<id>.jpg) a partir de las fotos originales de cada cuero.
#  1) empareja la luz: saca brillos y sombras grandes de la foto, para que el cuero se vea parejo
#  2) la hace continua: corre la foto a la mitad (los bordes quedan empalmados) y tapa la cruz del medio
#     con el centro de la foto original, cortando por donde menos se nota (corte de menor diferencia)
# Uso: .venv-fotos/Scripts/python.exe herramientas/texturas-3d.py [id ...]
import json, sys, pathlib, re
import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import gaussian_filter

root = pathlib.Path(__file__).resolve().parent.parent
info = json.load(open(root / 'herramientas' / 'cueros-hebillas.json', encoding='utf-8'))['cueros']
datos = (root / 'js' / 'datos.js').read_text(encoding='utf-8')
familia = dict(re.findall(r"\{ id: '([a-z0-9-]+)', name: '[^']*', familia: '([a-z-]+)' \}", datos))
S = 1024
CENTRO = {'33': (0.5, 0.32)}
# fotos con poca zona en foco: recorte más chico (parte de la foto)
TAM = {'01': 0.32}
# cuánto se empareja la luz (1 = todo). Los de pelo menos, para no lavar el dibujo.
PAREJO = {'pelo': 0.55, 'croco': 0.8, 'croco-metal': 0.85, 'reptil': 0.75}


OV = int(S * 0.2)  # franja de más que se usa para empalmar los bordes


def nitidez(im):
    # cuánto detalle hay en cada zona (las fotos pierden foco hacia los bordes)
    g = np.asarray(im.convert('L').resize((im.width // 4, im.height // 4)), dtype=np.float32)
    lap = np.abs(g - gaussian_filter(g, 1.5))
    return gaussian_filter(lap, 6)


def muestra(n, slug):
    im = ImageOps.exif_transpose(Image.open(root / 'fotos' / 'cueros' / f'{n}-{slug}.jpg')).convert('RGB')
    # recorte de la zona más nítida de la foto (así la textura no tiene partes borrosas)
    s = int(min(im.size) * TAM.get(n, 0.62))
    if n in CENTRO:
        cx, cy = CENTRO[n]
    else:
        nt = nitidez(im); best = None; q = s / 4
        for fy in np.linspace(0, 1, 9):
            for fx in np.linspace(0, 1, 9):
                x0 = fx * (im.width - s); y0 = fy * (im.height - s)
                v = nt[int(y0 / 4):int((y0 + s) / 4), int(x0 / 4):int((x0 + s) / 4)]
                sc = v.mean() + 0.6 * np.percentile(v, 20)   # que no tenga zonas flojas
                if best is None or sc > best[0]: best = (sc, (x0 + s / 2) / im.width, (y0 + s / 2) / im.height)
        _, cx, cy = best
    x = int(min(max(cx * im.width - s / 2, 0), im.width - s)); y = int(min(max(cy * im.height - s / 2, 0), im.height - s))
    T = S + OV
    return np.asarray(im.crop((x, y, x + s, y + s)).resize((T, T), Image.LANCZOS), dtype=np.float32) / 255


LISOS = {'liso', 'lavado', 'charol', 'metal', 'gamuza'}


def parejo(a, k, color, fam):
    if color:
        # cueros de un solo color: se empareja cada canal, así la luz no cambia el tono por zonas.
        # En los metalizados el brillo de la foto engaña (el 3D ya pone el reflejo): se empareja más fino
        # y se baja el contraste de las manchas grandes.
        sig = S / 18 if fam == 'metal' else S / 12
        low = np.stack([gaussian_filter(a[..., c], sig, mode='reflect') for c in range(3)], -1)
        out = a * (a.reshape(-1, 3).mean(0) / np.maximum(low, 0.02)) ** k
        if fam == 'metal':
            mid = np.stack([gaussian_filter(out[..., c], 6, mode='reflect') for c in range(3)], -1)
            out = out.reshape(-1, 3).mean(0) * 0.35 + mid * 0.65 + (out - mid) * 0.9 - out.reshape(-1, 3).mean(0) * 0 
            out = out.reshape(-1, 3).mean(0) + (out - out.reshape(-1, 3).mean(0)) * 0.7
        return np.clip(out, 0, 1)
    lum = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    low = gaussian_filter(lum, S / 6, mode='reflect')
    gain = (lum.mean() / np.maximum(low, 0.02)) ** k
    return np.clip(a * gain[..., None], 0, 1)


def corte(err):
    # camino de arriba a abajo con la menor diferencia acumulada (una columna por fila)
    h, w = err.shape
    c = err.copy()
    for i in range(1, h):
        prev = c[i - 1]
        best = np.minimum(prev, np.minimum(np.r_[np.inf, prev[:-1]], np.r_[prev[1:], np.inf]))
        c[i] += best
    path = np.zeros(h, dtype=int); path[-1] = int(np.argmin(c[-1]))
    for i in range(h - 2, -1, -1):
        j = path[i + 1]; lo, hi = max(0, j - 1), min(w, j + 2)
        path[i] = lo + int(np.argmin(c[i, lo:hi]))
    return path


def empalme_x(b):
    # b tiene S + OV columnas: las OV de más (lo que sigue a la derecha) se cosen al borde izquierdo
    # por el camino de menor diferencia, así al repetirse no hay corte
    L, R = b[:, S:S + OV], b[:, :OV]
    path = corte(((L - R) ** 2).sum(-1))
    m = (np.arange(OV)[None, :] >= path[:, None]).astype(np.float32)
    m = gaussian_filter(m, (0, 3.0))
    out = b[:, :S].copy()
    out[:, :OV] = L * (1 - m[..., None]) + R * m[..., None]
    return out


def continua(a):
    a = empalme_x(a)                       # (S+OV) x S
    a = empalme_x(a.transpose(1, 0, 2))    # S x S
    return a.transpose(1, 0, 2)


solo = set(sys.argv[1:])
for n, (slug, name) in info.items():
    if n == '14' or (solo and slug not in solo):
        continue
    fam = familia.get(slug, 'liso')
    a = parejo(muestra(n, slug), PAREJO.get(fam, 1.0), fam in LISOS, fam)
    if slug in ('plateado', 'lagarto-plateado'):
        # la foto tiene reflejos marrones: se pasa a gris frío para que en el 3D se vea plata
        g = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
        a = np.clip(np.stack([g * 0.97, g * 1.0, g * 1.06], -1) * 1.08, 0, 1)
    out = continua(a)
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(root / 'img' / f'textura-{slug}.jpg', quality=74, optimize=True, progressive=True)
    print(slug, fam)
