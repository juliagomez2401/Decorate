# Genera las texturas del 3D (img/textura-<id>.jpg) a partir de las fotos originales de cada cuero.
#  - Tamaño real: PXCM px por cm (el tamaño de la imagen dice cuántos cm cubre). Cada foto se lleva a su escala real (FOTO_CM: cuánto mide
#    de ancho la foto), así las escamas del croco o las rayas de la cebra quedan del tamaño que tienen en el cuero.
#  - Sin repetirse: pelo y lisos usan la foto entera (no un recorte chico); croco y reptil se tejen juntando muchos
#    pedazos distintos de la foto, cosidos por donde menos se nota. Al final se hace continua (los bordes empalman).
#  - La luz se empareja apenas (sin lavar el color) y los brillos fuertes de la foto se bajan (el 3D pone los suyos).
# Uso: .venv-fotos/Scripts/python.exe herramientas/texturas-3d.py [id ...]
import json, sys, pathlib, re
import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import gaussian_filter, grey_opening

root = pathlib.Path(__file__).resolve().parent.parent
info = json.load(open(root / 'herramientas' / 'cueros-hebillas.json', encoding='utf-8'))['cueros']
datos = (root / 'js' / 'datos.js').read_text(encoding='utf-8')
familia = dict(re.findall(r"\{ id: '([a-z0-9-]+)', name: '[^']*', familia: '([a-z-]+)' \}", datos))

PXCM = 96                # px por cm en todas las texturas (igual que en js/pieza3d.js): el tamaño en cm sale del tamaño de la imagen
S = 2400                 # px de las texturas tejidas (25 cm)
TEJIDOS = {'croco', 'croco-metal'}
A_LO_LARGO = {'pelo', 'reptil', 'liso', 'lavado', 'charol', 'metal', 'gamuza'}   # franjas de toda la altura de la foto, una al lado de la otra (no se repite a lo largo del cinto)
LARGO_CM = 40

# cuánto mide de ancho cada foto (cm), contando escamas, manchas o rayas (escamas de croco de 1 a 1,5 cm)
FOTO_CM = {
    # medido contra las piezas de Julia: en un tarjetero de croco de 10 cm entran unas 10 escamas a lo ancho;
    # en un portafuego de cebra de 4 cm, unas 4 rayas; en una pulsera de leopardo de 5 cm, 3 o 4 manchas
    'cebra': 15, 'tigre': 15, 'leopardo': 15, 'leopardo-claro': 14, 'jaguar': 14, 'vaca': 22, 'serpiente': 14,
    'croco-verde': 12, 'croco-turquesa': 12, 'croco-verde-metalizado': 15, 'lagarto-plateado': 12,
    'croco-suela': 9, 'croco-chocolate': 10, 'croco-bordo': 8, 'croco-rojo': 7, 'croco-crema': 8,
}
POR_DEFECTO_CM = 16
# tamaño de cada pedazo (cm): grande en los de pelo, para que las rayas y manchas sigan enteras
PEDAZO = {'pelo': 11, 'reptil': 7, 'croco': 5, 'croco-metal': 5}
POR_DEFECTO_PEDAZO = 8
# cuánto se empareja la luz (1 = todo)
PAREJO = {'pelo': 0.5, 'croco': 1.0, 'croco-metal': 0.9, 'reptil': 0.85, 'liso': 0.85, 'lavado': 0.7, 'charol': 0.6, 'metal': 0.55, 'gamuza': 0.85}
CENTRO = {'blanco': (0.5, 0.0), 'bordo-lavado': (0.5, 0.0)}   # zona útil de la foto: arriba de todo (la de blanco tiene algo abajo)
RECORTE = {'bordo-lavado': (0.95, 0.45)}   # foto vertical: solo la mitad de arriba está en foco
LISOS = {'liso', 'lavado', 'charol', 'metal', 'gamuza'}



def movil(im, destino):
    """versión para el celular: la mitad de px por cm (PXCM / 2), más liviana"""
    im.resize((max(1, im.width // 2), max(1, im.height // 2)), Image.LANCZOS).save(
        destino, quality=74, optimize=True, progressive=True)

def nitidez(g):
    lap = np.abs(g - gaussian_filter(g, 1.5))
    return gaussian_filter(lap, 8)


def fuente(n, slug, fam):
    """La foto a escala real (PXCM px por cm), recortada a la zona en foco."""
    im = Image.open(root / 'fotos' / 'cueros' / f'{n}-{slug}.jpg'); im = ImageOps.exif_transpose(im).convert('RGB')
    cm = FOTO_CM.get(slug, POR_DEFECTO_CM)
    w = max(64, int(round(cm * PXCM)))
    h = int(round(im.height * w / im.width))
    # se achica en dos pasos (mejor calidad)
    im = im.reduce(2).resize((w, h), Image.LANCZOS)
    a = np.asarray(im, dtype=np.float32) / 255
    # recorte a lo que está en foco: se descartan los bordes borrosos
    nt = nitidez(a.mean(-1))
    # en los lisos se deja afuera más foto: arriba o abajo suelen estar fuera de foco (el bordó lavado se veía difuminado)
    fw, fh = (0.92, 0.92) if fam in TEJIDOS else (0.9, 0.95) if fam in ('pelo', 'reptil') else (0.9, 0.7)   # croco: más foto (hay que juntar pedazos distintos)
    if slug in RECORTE: fw, fh = RECORTE[slug]
    if slug in CENTRO:
        cx, cy = CENTRO[slug]
    else:
        best = None
        for cy in np.linspace(fh / 2, 1 - fh / 2, 5):
            for cx in np.linspace(fw / 2, 1 - fw / 2, 5):
                v = nt[int((cy - fh / 2) * h):int((cy + fh / 2) * h), int((cx - fw / 2) * w):int((cx + fw / 2) * w)]
                sc = v.mean() + 0.6 * np.percentile(v, 15)
                if best is None or sc > best[0]: best = (sc, cx, cy)
        _, cx, cy = best
    cy, cx = min(max(cy, fh / 2), 1 - fh / 2), min(max(cx, fw / 2), 1 - fw / 2)
    y0, x0 = int((cy - fh / 2) * h), int((cx - fw / 2) * w)
    return a[y0:y0 + int(fh * h), x0:x0 + int(fw * w)]


Y = np.array([0.299, 0.587, 0.114], dtype=np.float32)
COLOR_PLANO = {'liso', 'lavado', 'gamuza'}


def parejo(a, k, fam):
    """Empareja la luz grande de la foto (sombras y brillos de cómo estaba apoyado el cuero), sin lavar el color."""
    lum = a @ Y
    if fam in COLOR_PLANO:
        # cueros de un color: el color es el de la parte sin reflejos (los reflejos de la foto le suman blanco
        # y lo lavan); encima va el grano de la foto y apenas las manchas grandes (en el lavado, un poco más)
        lo, hi = (30, 70) if np.median(lum) > 0.6 else (5, 35)   # en los claros (blanco, celeste) el reflejo casi no cambia el color
        q = (lum > np.percentile(lum, lo)) & (lum < np.percentile(lum, hi))
        sel = a[q]; cr = sel.max(-1) - sel.min(-1)
        # los más puros de color (el reflejo le saca color); en el lavado no: ahí los más puros son brillos del grano
        base = sel.mean(0) if fam == 'lavado' else sel[cr >= np.median(cr)].mean(0)
        low = gaussian_filter(lum, 0.6 * PXCM, mode='reflect')
        grano = (lum / np.maximum(low, 0.02)) ** 0.8
        manchas = (low / np.median(low)) ** (0.35 if fam == 'lavado' else 0.15)
        return np.clip(base[None, None, :] * (grano * manchas)[..., None], 0, 1)
    sig = (1.3 if fam in TEJIDOS else max(a.shape[:2]) / 5 / PXCM) * PXCM
    if fam in TEJIDOS:
        # escamas: se empareja cada canal (luz y tono), así los pedazos de la foto empalman sin manchones
        low = np.stack([gaussian_filter(a[..., c], sig, mode='reflect') for c in range(3)], -1)
        out = a * (np.median(a.reshape(-1, 3), 0) / np.maximum(low, 0.02)) ** k
    else:
        low = gaussian_filter(lum, sig, mode='reflect')
        out = a * ((np.median(lum) / np.maximum(low, 0.02)) ** k)[..., None]
    if fam in LISOS or fam in TEJIDOS:
        # brillos de la foto (reflejos blancos): se bajan. En el croco solo las manchas de reflejo,
        # no las líneas claras entre escamas (finas: no pasan la apertura)
        l2 = out @ Y
        med = gaussian_filter(l2, 12, mode='reflect')
        exceso = np.maximum(l2 - med * (1.02 if fam in TEJIDOS else 1.08), 0)
        if fam in TEJIDOS: exceso = grey_opening(exceso, size=(6, 6))
        out = out - (exceso * (1.0 if fam in TEJIDOS else 0.85))[..., None] * (out / np.maximum(l2, 0.02)[..., None])
    return np.clip(out, 0, 1)


def corte(err):
    # camino de arriba a abajo con la menor diferencia acumulada (una columna por fila)
    h, w = err.shape
    c = err.copy()
    for i in range(1, h):
        prev = c[i - 1]
        c[i] += np.minimum(prev, np.minimum(np.r_[np.inf, prev[:-1]], np.r_[prev[1:], np.inf]))
    path = np.zeros(h, dtype=int); path[-1] = int(np.argmin(c[-1]))
    for i in range(h - 2, -1, -1):
        j = path[i + 1]; lo, hi = max(0, j - 1), min(w, j + 2)
        path[i] = lo + int(np.argmin(c[i, lo:hi]))
    return path


def tejer(src, N, P, rng):
    """Image quilting: llena N x N con pedazos P x P de src, cada uno elegido para que empalme con lo que ya hay."""
    O = max(8, P // 3)
    paso = P - O
    hs, ws = src.shape[:2]
    out = np.zeros((N + P, N + P, 3), np.float32)
    lleno = np.zeros((N + P, N + P), bool)
    ys = range(0, N, paso)
    xs = range(0, N, paso)
    for y in ys:
        for x in xs:
            cand = np.stack([rng.integers(0, hs - P + 1, 500), rng.integers(0, ws - P + 1, 500)], -1)
            if y == 0 and x == 0:
                cy, cx = cand[0]
            else:
                err = np.zeros(len(cand), np.float32)
                for i, (cy, cx) in enumerate(cand):
                    p = src[cy:cy + P, cx:cx + P]
                    if x: err[i] += ((p[::2, :O:2] - out[y:y + P:2, x:x + O:2]) ** 2).sum()
                    if y: err[i] += ((p[:O:2, ::2] - out[y:y + O:2, x:x + P:2]) ** 2).sum()
                ok = np.flatnonzero(err <= err.min() * 1.06 + 1e-6)
                cy, cx = cand[rng.choice(ok)]
            p = src[cy:cy + P, cx:cx + P]
            m = np.ones((P, P), np.float32)
            if x:
                path = corte(((p[:, :O] - out[y:y + P, x:x + O]) ** 2).sum(-1))
                m[:, :O] = np.minimum(m[:, :O], (np.arange(O)[None, :] >= path[:, None]))
            if y:
                path = corte(((p[:O, :] - out[y:y + O, x:x + P]) ** 2).sum(-1).T)
                m[:O, :] = np.minimum(m[:O, :], (np.arange(O)[:, None] >= path[None, :]))
            m = gaussian_filter(m, 1.2)
            old = lleno[y:y + P, x:x + P]
            m = np.where(old, m, 1.0)[..., None]
            out[y:y + P, x:x + P] = p * m + out[y:y + P, x:x + P] * (1 - m)
            lleno[y:y + P, x:x + P] = True
    return out[:N, :N]


def tejer_largo(src, Wout, P, rng):
    """Franjas de toda la altura de la foto, una al lado de la otra: cada una se elige para que las rayas o manchas
    sigan en la unión, y se cose por el camino de menor diferencia. Así la tira es larga sin repetir un recorte.
    Las franjas salen de la foto tal cual o dada vuelta de arriba a abajo (más variedad), y no se repite una que ya se usó."""
    O = P // 3
    variantes = [src, src[::-1, :]]   # espejada de izquierda a derecha no: queda simétrica, como caleidoscopio
    hs, ws = src.shape[:2]
    out = np.zeros((hs, Wout + P, 3), np.float32)
    c0 = int(rng.integers(0, ws - P + 1)); out[:, :P] = src[:, c0:c0 + P]
    usadas = [(0, c0)]
    x = P - O
    cands = [(v, c) for v in range(2) for c in range(0, ws - P + 1, 4)]
    while x < Wout:
        err = np.array([((variantes[v][::2, c:c + O:2] - out[::2, x:x + O:2]) ** 2).sum() for v, c in cands])
        # castigo a lo ya usado (misma variante y cerca), así no se ve el mismo pedazo dos veces
        for k, (v, c) in enumerate(cands):
            if any(v == uv and abs(c - uc) < P * 0.8 for uv, uc in usadas): err[k] *= 3
        ok = np.flatnonzero(err <= err.min() * 1.1 + 1e-6)
        v, c = cands[int(rng.choice(ok))]
        p = variantes[v][:, c:c + P]
        path = corte(((p[:, :O] - out[:, x:x + O]) ** 2).sum(-1))
        m = (np.arange(O)[None, :] >= path[:, None]).astype(np.float32)
        m = gaussian_filter(m, (0, 0.15 * PXCM))
        out[:, x:x + O] = p[:, :O] * m[..., None] + out[:, x:x + O] * (1 - m[..., None])
        out[:, x + O:x + P] = p[:, O:]
        usadas.append((v, c)); x += P - O
    return out[:, :Wout]


def empalme_x(b, ov):
    # las ov columnas de más (lo que sigue a la derecha) se cosen al borde izquierdo por el camino de menor diferencia
    w = b.shape[1] - ov
    L, R = b[:, w:], b[:, :ov]
    path = corte(((L - R) ** 2).sum(-1))
    m = (np.arange(ov)[None, :] >= path[:, None]).astype(np.float32)
    m = gaussian_filter(m, (0, 0.25 * PXCM))   # unión suave (si es seca, en el pelo se ve un escalón)
    out = b[:, :w].copy()
    out[:, :ov] = L * (1 - m[..., None]) + R * m[..., None]
    return out


def continua(a, f=0.12, fy=None):
    a = empalme_x(a, int(a.shape[1] * f))
    a = empalme_x(a.transpose(1, 0, 2), int(a.shape[0] * (fy or f)))
    return a.transpose(1, 0, 2)


if __name__ == '__main__':
    solo = set(sys.argv[1:])
    for n, (slug, name) in info.items():
        if n == '14' or (solo and slug not in solo):
            continue
        fam = familia.get(slug, 'liso')
        src = parejo(fuente(n, slug, fam), PAREJO.get(fam, 0.7), fam)
        if slug in ('plateado', 'lagarto-plateado'):
            # la foto tiene reflejos marrones: se pasa a gris frío para que en el 3D se vea plata
            g = src @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
            src = np.clip(np.stack([g * 0.97, g * 1.0, g * 1.06], -1) * 1.08, 0, 1)
        if fam in TEJIDOS:
            # escamas: se teje una textura grande con pedazos de la foto (no se repite)
            P = int(min(PEDAZO.get(fam, POR_DEFECTO_PEDAZO) * PXCM, src.shape[0] * 0.8, src.shape[1] * 0.8))
            out = continua(tejer(src, int(S * 1.15), P, np.random.default_rng(int(n))), 0.15 / 1.15)
        elif fam in A_LO_LARGO:
            # pelo, reptil y lisos: tira de LARGO_CM sin repetir, con las rayas y manchas enteras
            P = int(src.shape[1] * 0.3)
            W = int(LARGO_CM * PXCM * 1.12)
            out = continua(tejer_largo(src, W, P, np.random.default_rng(int(n))), 0.11, 0.3)
        else:
            # lisos: la foto entera, a tamaño real, con los bordes empalmados
            out = continua(src)
        im_out = Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))
        for intento in range(5):   # en Windows el archivo puede estar abierto un instante (servidor local, antivirus)
            try:
                im_out.save(root / 'img' / f'textura-{slug}.jpg', quality=80, optimize=True, progressive=True)
                movil(im_out, root / 'img' / f'textura-{slug}-m.jpg'); break
            except OSError:
                import time; time.sleep(1.5)
        print(slug, fam, out.shape[:2], flush=True)
