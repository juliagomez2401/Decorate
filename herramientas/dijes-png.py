"""Dijes del portafuego, a partir de la foto de Julia (foto dijes/*.jpeg, todos sobre papel blanco).

Para cada dije genera:
  - img/dije-<id>.png  (300x300, fondo transparente): la foto recortada, para las tarjetas y como textura del 3D
  - js/dijes-formas.js: el contorno de cada dije (y sus huecos), para armar el modelo 3D (pieza de metal
    con volumen) en js/pieza3d.js. Las coordenadas van de 0 a 1 en el mismo cuadro que el png.

Cómo se recorta: el metal tiene textura y brillos (cambia mucho de un pixel a otro) y el papel y la sombra
son lisos. Se arma un "puntaje de metal" con eso, se umbraliza con histéresis, se rellenan los brillos
chicos y se dejan vacíos los huecos que son papel (calados y el agujero de colgar). El borde se suaviza
a doble resolución para que no quede serruchado.
Uso: .venv-fotos/Scripts/python.exe herramientas/dijes-png.py [--ver salida.jpg]"""
import pathlib, sys, glob, json
import numpy as np
from PIL import Image, ImageOps, ImageDraw
from scipy import ndimage as ndi
from skimage import color, measure, morphology, filters

ROOT = pathlib.Path(__file__).resolve().parent.parent
# zonas que se borran a mano (la muesca en V de abajo del ginkgo), en coordenadas de la tarjeta
BORRAR = {'ginkgo': [[(0.465, 1.0), (0.515, 0.83), (0.575, 1.0)]]}
PELAR = {'ginkgo', 'margarita', 'flor-calada'}
CALADOS = {'rama', 'flor', 'flor-calada', 'girasol', 'margarita'}
NOMBRES = ['hoja', 'flor-piedra', 'girasol', 'flor', 'rama', 'ala', 'leopardo', 'ginkgo', 'margarita', 'hoja-larga', 'estrella', 'pluma', 'flor-calada']
ALTO_HOJA_CM = 3.2   # la hoja grande mide unos 3,2 cm de alto: da la escala de todos
LADO = 300
# umbrales del puntaje de metal (bajo, alto) y del papel de los huecos; se pueden ajustar por dije
UMB = {'_': (0.9, 1.9)}

src = sorted(glob.glob(str(ROOT / 'foto dijes' / '*.jpeg')))[0]
im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
rgb = np.asarray(im).astype(float) / 255
lab = color.rgb2lab(rgb); L = lab[..., 0]; croma = np.hypot(lab[..., 1], lab[..., 2])

# papel: promedio de los pixeles lisos y claros de alrededor (no se ensucia con el dije)
m1 = ndi.uniform_filter(L, 5); tex = np.sqrt(np.maximum(ndi.uniform_filter(L * L, 5) - m1 * m1, 0))
liso = (tex < 3) & (L > 70) & (croma < 10)
w = ndi.gaussian_filter(liso.astype(float), 40); papel = ndi.gaussian_filter(np.where(liso, L, 0), 40) / np.maximum(w, 1e-3)
grad = filters.sobel(ndi.gaussian_filter(L, 0.8))
# ubicar cada dije (aproximado): más oscuro que el papel o con color, dentro de la zona del papel
zona = ndi.binary_fill_holes(ndi.binary_closing((L > 68) & (croma < 14), iterations=8))
zona = ndi.binary_erosion(zona, iterations=25)
aprox = (((papel - L) > 12) | (croma > 16) | ((L - papel) > 12)) & zona
aprox = morphology.closing(morphology.opening(aprox, morphology.disk(1)), morphology.disk(5))
lab_ = measure.label(aprox)
props = [r for r in measure.regionprops(lab_) if r.area > 1500]
props.sort(key=lambda r: r.centroid[0])
filas, fila = [], []
for r in props:
    if fila and r.centroid[0] - np.mean([q.centroid[0] for q in fila]) > 110: filas.append(fila); fila = []
    fila.append(r)
filas.append(fila)
orden = [r for f in filas for r in sorted(f, key=lambda q: q.centroid[1])]
print(len(orden), 'dijes')

if '--ver' in sys.argv:
    v = im.copy(); d = ImageDraw.Draw(v)
    for i, r in enumerate(orden):
        y0, x0, y1, x1 = r.bbox; d.rectangle((x0, y0, x1, y1), outline=(255, 0, 0), width=3); d.text((x0, y0 - 14), str(i + 1), fill=(255, 0, 0))
    v.save(sys.argv[-1]); sys.exit()

escala = None
formas = {}
for i, r in enumerate(orden):
    nombre = NOMBRES[i]
    y0, x0, y1, x1 = r.bbox; y0, x0 = max(0, y0 - 14), max(0, x0 - 14); y1, x1 = y1 + 14, x1 + 14
    G, Lc, Pc, Tc = grad[y0:y1, x0:x1], L[y0:y1, x0:x1], papel[y0:y1, x0:x1], tex[y0:y1, x0:x1]
    # borde del metal: gradiente fuerte; se engorda un pixel para que no haya fugas
    muro = ndi.binary_dilation(G > 7.5, iterations=1)
    libre = measure.label(~muro, connectivity=1)
    borde = np.zeros(libre.shape, bool); borde[[0, -1], :] = True; borde[:, [0, -1]] = True
    fondo_ids = set(np.unique(libre[borde & (libre > 0)]))
    # huecos (agujero de colgar, calados): regiones libres de papel limpio adentro del dije
    papel_limpio = (np.abs(Lc - Pc) < 13) & (Tc < 4.5)
    for q in measure.regionprops(libre):
        if q.label in fondo_ids: continue
        zonaq = libre == q.label
        if q.area >= 10 and papel_limpio[zonaq].mean() > 0.5: fondo_ids.add(q.label)
    sil = ~np.isin(libre, list(fondo_ids))
    # el muro engordado se devuelve: un pixel de borde de cada lado
    sil = morphology.opening(sil, morphology.disk(1))
    l2 = measure.label(sil)
    sil = l2 == max(measure.regionprops(l2), key=lambda q: q.area).label
    # agujeros chiquitos (el de colgar) que el borde engordado tapó: papel limpio adentro, lejos del borde fuerte
    ys_, xs_ = np.nonzero(sil); arriba = ys_.min() + 0.26 * (ys_.max() - ys_.min())
    ok = lambda q: nombre in CALADOS or q.centroid[0] < arriba   # en los lisos, solo el agujero de colgar
    cand = sil & papel_limpio & (np.abs(Lc - Pc) < 9) & ~(G > 7.5)
    lc = measure.label(cand); hubo = False
    for q in measure.regionprops(lc):
        if q.area >= 8 and ok(q): sil &= ~ndi.binary_dilation(lc == q.label, iterations=1); hubo = hubo or q.centroid[0] < arriba
    if not hubo:
        # el agujero de colgar no apareció: se busca el pedazo de papel más limpio en la parte de arriba
        zona_a = np.zeros_like(sil); zona_a[:int(arriba) + 1] = True
        c2 = sil & zona_a & (np.abs(Lc - Pc) < 16) & (Tc < 6) & ~(G > 9)
        l3 = measure.label(c2); rs = [q for q in measure.regionprops(l3) if q.area >= 4]
        if rs:
            q = max(rs, key=lambda q: q.area); sil &= ~ndi.binary_dilation(l3 == q.label, iterations=1)
    # pelar desde afuera lo que es papel o sombra (liso, sin color): los huecos entre pétalos y muescas
    if nombre in PELAR:
        # sombra en los rincones (más oscura que el papel pero lisa, sin el borde fuerte del metal) o papel
        Gs = ndi.gaussian_filter(G, 0.7)
        pap = ((((Pc - Lc) > 6) & ((Pc - Lc) < 34) & (Gs < 4)) | ((np.abs(Lc - Pc) < 7) & (Gs < 5))) & (croma[y0:y1, x0:x1] < 10)
        for _ in range(8):
            afuera = ndi.binary_dilation(~sil, iterations=1) & sil
            come = afuera & pap
            if not come.any(): break
            sil &= ~come
        sil = morphology.opening(sil, morphology.disk(2))
        l2 = measure.label(sil); sil = l2 == max(measure.regionprops(l2), key=lambda q: q.area).label
    # el muro engordado deja una línea de papel alrededor: se saca un pixel de todo el borde (también el de los huecos)
    sil = ndi.binary_erosion(sil, iterations=1)
    # borde suave: a doble resolución, desenfocado y vuelto a cortar en 0,5
    big = np.asarray(Image.fromarray((sil * 255).astype(np.uint8)).resize((sil.shape[1] * 2, sil.shape[0] * 2), Image.BILINEAR)).astype(float) / 255
    big = ndi.gaussian_filter(big, 1.3)
    alfa = np.clip((big - 0.5) * 3 + 0.5, 0, 1)
    pieza = im.crop((x0, y0, x1, y1)).resize((sil.shape[1] * 2, sil.shape[0] * 2), Image.LANCZOS)
    pieza.putalpha(Image.fromarray((alfa * 255).astype(np.uint8)))
    ys, xs = np.nonzero(alfa > 0.5); bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
    pieza = pieza.crop((bx0, by0, bx1 + 1, by1 + 1)); masc = (alfa > 0.5)[by0:by1 + 1, bx0:bx1 + 1]
    lado = int(max(pieza.width, pieza.height) * 1.04)
    ox, oy = (lado - pieza.width) // 2, (lado - pieza.height) // 2
    out = Image.new('RGBA', (lado, lado), (0, 0, 0, 0)); out.paste(pieza, (ox, oy), pieza)
    borrar = None
    if nombre in BORRAR:
        borrar = Image.new('L', (lado, lado), 0)
        for poli in BORRAR[nombre]: ImageDraw.Draw(borrar).polygon([(x * lado, y * lado) for x, y in poli], fill=255)
        bb = np.asarray(borrar) > 0; arr0 = np.asarray(out).copy(); arr0[bb, 3] = 0; out = Image.fromarray(arr0, 'RGBA')
    # el color del metal se estira hacia afuera por debajo de la transparencia (así el borde del 3D no toma papel)
    arr = np.asarray(out).copy(); opaco = arr[..., 3] >= 235
    _, (iy, ix) = ndi.distance_transform_edt(~opaco, return_indices=True)
    arr[..., :3] = arr[iy, ix, :3]
    out = Image.fromarray(arr, 'RGBA')
    out.resize((LADO, LADO), Image.LANCZOS).save(ROOT / 'img' / f'dije-{nombre}.png', optimize=True)
    # contorno para el 3D, en el mismo cuadro del png (0..1, y para arriba)
    cuadro = np.zeros((lado, lado)); cuadro[oy:oy + masc.shape[0], ox:ox + masc.shape[1]] = masc
    if borrar is not None: cuadro[np.asarray(borrar) > 0] = 0
    cuadro = ndi.gaussian_filter(ndi.binary_erosion(cuadro > 0.5, iterations=2).astype(float), 1.0)  # apenas adentro del borde
    cs = measure.find_contours(np.pad(cuadro, 2), 0.5)
    polis = []
    for c in cs:
        c = measure.approximate_polygon(c - 2, tolerance=0.9)
        if len(c) < 6: continue
        pts = [[round(float(p[1]) / lado, 4), round(1 - float(p[0]) / lado, 4)] for p in c]
        area = 0.5 * sum(pts[k][0] * pts[k - 1][1] - pts[k - 1][0] * pts[k][1] for k in range(len(pts)))
        polis.append((abs(area), pts))
    polis.sort(key=lambda t: -t[0])
    exterior = polis[0][1]
    huecos = [p for a, p in polis[1:] if a > 0.0004]
    alto_px = (by1 - by0) / 2   # en pixeles de la foto original
    if nombre == 'hoja': escala = ALTO_HOJA_CM / alto_px
    formas[nombre] = {'lado_px': lado / 2, 'contorno': exterior, 'huecos': huecos}
    print(nombre, len(exterior), 'puntos,', len(huecos), 'huecos')

for k, v in formas.items():
    v['cm'] = round(v.pop('lado_px') * escala, 3)   # cuánto mide el cuadro del png, en cm
(ROOT / 'js' / 'dijes-formas.js').write_text('/* Generado por herramientas/dijes-png.py. No editar a mano. */\nwindow.DT_DIJES_FORMAS = ' + json.dumps(formas, separators=(',', ':')) + ';\n', encoding='utf-8')
print('listo')
