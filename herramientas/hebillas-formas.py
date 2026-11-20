# Genera js/hebillas-formas.js: la silueta de cada hebilla (contorno y huecos), sacada de la transparencia de
# img/hebilla-*.png. Con eso el 3D arma la hebilla con la forma exacta de la foto y le pone la foto encima
# (igual que los dijes), en vez de dibujarla con formas simples.
# Uso: .venv-fotos/Scripts/python.exe herramientas/hebillas-formas.py
import json, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure

ROOT = pathlib.Path(__file__).resolve().parent.parent
# las fotos donde la púa no apunta a la derecha: cuánto girarlas (en grados, a la izquierda) para que el cinto
# pase de costado como en las demás
GIRO = {}   # las fotos ya están con la púa apuntando a la derecha (la ovalada bronce y la rectangular se giraron)

formas = {}
for p in sorted((ROOT / 'img').glob('hebilla-*.png')):
    nombre = p.stem.replace('hebilla-', '')
    a = np.asarray(Image.open(p).convert('RGBA'))[..., 3].astype(float) / 255
    lado = a.shape[0]
    m = ndi.binary_opening(a > 0.5, iterations=1)
    suave = ndi.gaussian_filter(m.astype(float), 0.7)
    cs = measure.find_contours(np.pad(suave, 2), 0.5)
    polis = []
    for c in cs:
        c = measure.approximate_polygon(c - 2, tolerance=0.7)
        if len(c) < 5: continue
        pts = [[round(float(q[1]) / lado, 4), round(1 - float(q[0]) / lado, 4)] for q in c]
        area = 0.5 * sum(pts[k][0] * pts[k - 1][1] - pts[k - 1][0] * pts[k][1] for k in range(len(pts)))
        polis.append((abs(area), pts))
    polis.sort(key=lambda t: -t[0])
    exterior = polis[0][1]
    huecos = [q for ar, q in polis[1:] if ar > 0.0006]
    ys, xs = np.nonzero(m)
    caja = [round(xs.min() / lado, 4), round(1 - (ys.max() + 1) / lado, 4), round((xs.max() + 1) / lado, 4), round(1 - ys.min() / lado, 4)]
    formas[nombre] = {'contorno': exterior, 'huecos': huecos, 'caja': caja, 'giro': GIRO.get(nombre, 0)}
    print(nombre, len(exterior), 'puntos,', len(huecos), 'huecos')

(ROOT / 'js' / 'hebillas-formas.js').write_text('/* Generado por herramientas/hebillas-formas.py. No editar a mano. */\nwindow.DT_HEBILLAS_FORMAS = ' + json.dumps(formas, separators=(',', ':')) + ';\n', encoding='utf-8')
print('listo')
