"""Hebillas y dijes recortados de las fotos sobre cartulina naranja (fotos nuevas hebillas dijes/, nov. 2026).

El naranja no se parece a ningún metal: se separa por color (tono y saturación). La sombra sobre la cartulina es
del mismo tono, más oscura: se suma al fondo si está pegada a él. Los huecos (adentro de los aros, los calados,
el agujero de colgar) son cartulina: quedan vacíos solos.

Genera:
  - img/hebilla-<id>.png e img/dije-<id>.png (400x400, fondo transparente)
  - js/dijes-formas.js (contorno y huecos de cada dije, y cuánto mide en cm, para el 3D)
Después correr herramientas/hebillas-formas.py y herramientas/generar-cueros-datos.py.
Uso: .venv-fotos/Scripts/python.exe herramientas/recortar-naranja.py [--comparar=carpeta]
"""
import json, pathlib, sys
import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage as ndi
from skimage import color, measure, morphology

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'fotos nuevas hebillas dijes'
LADO = 400
VER = next((a.split('=', 1)[1] for a in sys.argv if a.startswith('--comparar=')), None)

# dónde está cada pieza: foto y un punto (en la foto achicada a 1600 px de ancho) dentro de su recuadro
HEBILLAS = {
    'redonda-bronce': (1, (1203, 320)), 'rectangular-dorada': (1, (340, 733)), 'oval-bronce': (1, (1197, 868)),
    'redonda-plateada-ancha': (2, (381, 477)), 'redonda-plateada-fina': (2, (1251, 420)), 'doble-plateada': (2, (876, 820)),
    'oval-labrada': (3, (322, 385)), 'flor-bronce': (3, (787, 380)), 'rosa-bronce': (3, (1298, 420)),
    'cuadrada-remaches': (3, (542, 882)), 'redonda-guarda': (3, (1043, 862)),
    'oval-repujada': (4, None),   # puesta en un cinto azul: se recorta aparte
}
# todos los dijes de la misma foto: misma escala y misma luz (la hoja larga no está: queda el recorte anterior)
DIJES = {
    'leopardo': (270, 135), 'estrella': (497, 140), 'girasol': (862, 138), 'ala': (1262, 172), 'pluma': (1397, 160),
    'hoja': (637, 370), 'flor': (825, 360), 'rama': (274, 378), 'ginkgo': (1204, 425), 'flor-piedra': (1369, 410),
    'margarita': (449, 643), 'flor-calada': (630, 625),
}
FOTO_DIJES = 13
# piezas plateadas: se les saca el reflejo naranja (todos los dijes menos el leopardo, que es dorado)
PLATA = {'doble-plateada', 'redonda-plateada-ancha', 'redonda-plateada-fina', 'oval-labrada',
         'estrella', 'girasol', 'ala', 'pluma', 'hoja', 'flor', 'rama', 'ginkgo', 'flor-piedra', 'margarita', 'flor-calada'}
ALTO_HOJA_CM = 3.2   # la hoja grande mide unos 3,2 cm de alto: da la escala de todos
# hebillas de contorno convexo: el borde de afuera se rehace con su envolvente (sin mordiscos por reflejos)
# pegadas al borde del cuaderno: dónde está la hebilla, marcado a mano (en la foto achicada a 1600 px)
A_MANO = {
    'oval-bronce': lambda x, y: ((x - 1197.5) / 312) ** 2 + ((y - 852.8) / 199) ** 2 <= 1,   # un óvalo
    'oval-labrada': lambda x, y: y >= 166,                                                    # arriba, los espirales
    'oval-repujada': lambda x, y: ((x - 595) / 318) ** 2 + ((y - 828) / 381) ** 2 <= 1,         # arriba, el cinto azul
}
CONVEXAS = {'redonda-bronce', 'rectangular-dorada', 'oval-bronce', 'redonda-plateada-ancha', 'redonda-plateada-fina',
            'doble-plateada', 'oval-labrada', 'cuadrada-remaches', 'redonda-guarda', 'oval-repujada'}


def abrir(n):
    return ImageOps.exif_transpose(Image.open(SRC / f'image{n:05d}.jpeg')).convert('RGB')


def tono_croma(lab):
    return np.degrees(np.arctan2(lab[..., 2], lab[..., 1])), np.hypot(lab[..., 1], lab[..., 2])


def naranja(lab, debil=False):
    t, c = tono_croma(lab)
    return ((c > 10) & (t > 12) & (t < 70)) if debil else ((c > 26) & (t > 18) & (t < 64))


def piezas(foto):
    """Recuadros (en px de la foto entera) de lo que no es cartulina, como en la hoja de control."""
    im = abrir(foto); k = 1600 / max(im.size)
    sm = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    lab = color.rgb2lab(np.asarray(sm).astype(float) / 255); nar = naranja(lab)
    papel = ndi.binary_fill_holes(morphology.closing(nar, morphology.disk(15)))
    lb = measure.label(papel); papel = ndi.binary_fill_holes(lb == max(measure.regionprops(lb), key=lambda r: r.area).label)
    obj = ndi.binary_erosion(papel, iterations=12) & morphology.closing(morphology.opening(papel & ~nar, morphology.disk(2)), morphology.disk(3))
    return im, k, [r for r in measure.regionprops(measure.label(obj)) if r.area > 400]


def elegir(rs, k, punto):
    x, y = punto
    dentro = [r for r in rs if r.bbox[0] <= y <= r.bbox[2] and r.bbox[1] <= x <= r.bbox[3]]
    r = max(dentro, key=lambda r: r.area)
    y0, x0, y1, x1 = r.bbox
    return [int(v / k) for v in (x0, y0, x1, y1)]


def mascara(rgb, nombre, recorte=None):
    lab = color.rgb2lab(rgb)
    fuerte, debil = naranja(lab), naranja(lab, True) & (lab[..., 0] > 28)   # lo muy oscuro (barras negras) no es sombra
    if nombre == 'oval-repujada':
        # el cuero azul del cinto también es fondo
        azul = (lab[..., 2] < -8) | ((lab[..., 2] < 4) & (lab[..., 0] < 45) & (lab[..., 1] < 6))
        fuerte |= azul & (lab[..., 0] < 55); debil |= azul
    # el metal espeja la cartulina, pero tiene borde: la cartulina es lisa. Se avanza desde afuera solo por lo
    # naranja y liso (la sombra incluida), y se frena en el borde del metal
    sm = lambda c: ndi.gaussian_filter(lab[..., c], 1.2)
    grad = np.hypot(*np.gradient(sm(0))) + 1.4 * (np.hypot(*np.gradient(sm(1))) + np.hypot(*np.gradient(sm(2))))
    liso = grad < np.percentile(grad[fuerte], 85) * 1.6 if fuerte.any() else grad < 3
    pasa = (fuerte | debil) & liso
    borde = np.zeros_like(fuerte); borde[[0, -1], :] = True; borde[:, [0, -1]] = True
    semilla = borde & pasa
    # huecos (adentro de los aros, calados, agujero de colgar): manchas de cartulina lisa y del color del papel
    papel = np.median(lab[fuerte & liso], axis=0) if (fuerte & liso).any() else np.array([55, 40, 40])
    cerca = np.sqrt(((lab[..., 1:] - papel[1:]) ** 2).sum(-1)) < 14
    lp = measure.label(fuerte & liso & cerca)
    minimo = max(25, rgb.shape[0] * rgb.shape[1] * 0.00012)
    for r in measure.regionprops(lp):
        if r.area > minimo: semilla |= lp == r.label
    fondo = morphology.reconstruction(semilla.astype(np.uint8), pasa.astype(np.uint8)).astype(bool)
    # el canto que queda pegado (naranja fuerte) y la sombra de la pieza sobre la cartulina (mismo tono, más
    # oscura) se pelan desde afuera
    t, c = tono_croma(lab)
    tp = np.degrees(np.arctan2(papel[2], papel[1]))
    sombra = (c > 12) & (np.abs(t - tp) < 12) & (lab[..., 0] < papel[0] - 2)
    for _ in range(8):
        orilla = ndi.binary_dilation(fondo) & ~fondo & (fuerte | sombra)
        if not orilla.any(): break
        fondo |= orilla
    m = ~fondo
    m = morphology.opening(m, morphology.disk(2))
    lb = measure.label(m)
    m = lb == max(measure.regionprops(lb), key=lambda r: r.area).label
    # brillos chicos que quedaron como agujeros: se rellenan
    hh = ndi.binary_fill_holes(m) & ~m; lh = measure.label(hh)
    for r in measure.regionprops(lh):
        if r.area < m.sum() * 0.004: m |= lh == r.label
    if recorte is not None:
        # marcado a mano: solo lo que queda adentro (sin los espirales ni la madera del cuaderno)
        m &= recorte
        lb = measure.label(m); m = lb == max(measure.regionprops(lb), key=lambda q: q.area).label
    if nombre in CONVEXAS:
        afuera = ndi.binary_erosion(morphology.convex_hull_image(morphology.opening(m, morphology.disk(6))), iterations=1)
        huecos = ndi.binary_fill_holes(m) & ~m
        m = afuera & ~huecos
    return morphology.closing(m, morphology.disk(1))


def recortar(im, caja, nombre):
    x0, y0, x1, y1 = caja; pad = int(0.06 * max(x1 - x0, y1 - y0)) + 10
    x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)
    c = im.crop((x0, y0, x1, y1))
    rgb = np.asarray(c).astype(float) / 255
    recorte = None
    if nombre in A_MANO:
        # de coordenadas de la foto achicada (1600 px de ancho) a las de este recorte
        k = 1600 / max(im.size); yy, xx = np.mgrid[:rgb.shape[0], :rgb.shape[1]]
        recorte = A_MANO[nombre]((xx + x0) * k, (yy + y0) * k)
    m = mascara(rgb, nombre, recorte)
    if nombre == 'oval-repujada':
        # solo el óvalo: la parte de abajo del recorte (arriba queda el cuero)
        lb = measure.label(m); m = lb == max(measure.regionprops(lb), key=lambda r: r.area).label
        m = ndi.binary_erosion(morphology.convex_hull_image(m), iterations=1)
    # halo: en el borde (afuera y en los huecos) queda una línea con el reflejo naranja de la cartulina; se pela
    lab = color.rgb2lab(rgb); t, cr = tono_croma(lab)
    for _ in range(2):
        orilla = m & ~ndi.binary_erosion(m)
        m &= ~(orilla & (cr > 14) & (t > 10) & (t < 70))
    # la plata espeja la cartulina naranja: se le saca el color (queda gris) y se aclara un poco
    if nombre in PLATA:
        L = 100 * (np.clip(lab[..., 0], 0, 100) / 100) ** (0.8 if nombre in HEBILLAS else 0.62)   # los dijes, más oscuros en la foto
        lab2 = np.dstack([L, lab[..., 1] * 0.12, lab[..., 2] * 0.12 + 1.5])
        rgb = np.clip(color.lab2rgb(lab2), 0, 1)
    ys, xs = np.nonzero(m)
    by0, by1, bx0, bx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    # borde suave; los pixeles del borde toman el color del metal de adentro (sin el reflejo naranja)
    alfa = ndi.gaussian_filter(m.astype(float), 1.0)
    alfa = np.clip((alfa - 0.5) * 2.2 + 0.5, 0, 1)
    nucleo = ndi.binary_erosion(m, iterations=3)
    _, (iy, ix) = ndi.distance_transform_edt(~nucleo, return_indices=True)
    arr = (rgb * 255).astype(np.uint8)
    arr = np.where(nucleo[..., None], arr, arr[iy, ix])
    rgba = np.dstack([arr, (alfa * 255).astype(np.uint8)])[by0:by1, bx0:bx1]
    alto_px = by1 - by0
    lado = int(max(rgba.shape[0], rgba.shape[1]) * 1.04)
    lienzo = np.zeros((lado, lado, 4), np.uint8)
    oy, ox = (lado - rgba.shape[0]) // 2, (lado - rgba.shape[1]) // 2
    lienzo[oy:oy + rgba.shape[0], ox:ox + rgba.shape[1]] = rgba
    # el color se estira también debajo de lo transparente (el borde del 3D no toma negro)
    op = lienzo[..., 3] > 200
    _, (iy, ix) = ndi.distance_transform_edt(~op, return_indices=True)
    lienzo[..., :3] = lienzo[iy, ix, :3]
    out = Image.fromarray(lienzo, 'RGBA').resize((LADO, LADO), Image.LANCZOS)
    return out, lado, alto_px, Image.fromarray((np.asarray(c)), 'RGB')


def contorno(png):
    a = np.asarray(png)[..., 3] > 127
    a = ndi.gaussian_filter(ndi.binary_erosion(a, iterations=2).astype(float), 1.0)
    polis = []
    for cc in measure.find_contours(np.pad(a, 2), 0.5):
        cc = measure.approximate_polygon(cc - 2, tolerance=0.9)
        if len(cc) < 6: continue
        pts = [[round(float(p[1]) / LADO, 4), round(1 - float(p[0]) / LADO, 4)] for p in cc]
        area = 0.5 * sum(pts[k][0] * pts[k - 1][1] - pts[k - 1][0] * pts[k][1] for k in range(len(pts)))
        polis.append((abs(area), pts))
    polis.sort(key=lambda t: -t[0])
    return polis[0][1], [p for ar, p in polis[1:] if ar > 0.0004]


def guardar_comparacion(nombre, foto, png):
    if not VER: return
    S = 360; par = Image.new('RGB', (S * 2 + 10, S), (40, 70, 60))
    f = foto.copy(); f.thumbnail((S, S)); par.paste(f, ((S - f.width) // 2, (S - f.height) // 2))
    p = png.resize((S, S), Image.LANCZOS); par.paste(p, (S + 10, 0), p)
    par.save(pathlib.Path(VER) / f'{nombre}.png')


cache = {}
def foto_piezas(n):
    if n not in cache: cache[n] = piezas(n)
    return cache[n]


for nombre, (foto, punto) in HEBILLAS.items():
    if punto is None:
        im = abrir(foto); caja = [0, int(im.height * 0.33), im.width, im.height]
    else:
        im, k, rs = foto_piezas(foto); caja = elegir(rs, k, punto)
    png, _, _, crudo = recortar(im, caja, nombre)
    png.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG).save(ROOT / 'img' / f'hebilla-{nombre}.png', optimize=True)
    guardar_comparacion('hebilla-' + nombre, crudo, png)
    print('hebilla', nombre, (ROOT / 'img' / f'hebilla-{nombre}.png').stat().st_size // 1024, 'KB')

im, k, rs = foto_piezas(FOTO_DIJES)
formas, escala = {}, None
# las formas de los dijes que no se rehacen (la hoja larga) se conservan
viejas = (ROOT / 'js' / 'dijes-formas.js').read_text(encoding='utf-8')
viejas = json.loads(viejas[viejas.index('{'):viejas.rindex('}') + 1])
for nombre, punto in DIJES.items():
    png, lado, alto_px, crudo = recortar(im, elegir(rs, k, punto), nombre)
    png.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG).save(ROOT / 'img' / f'dije-{nombre}.png', optimize=True)
    guardar_comparacion('dije-' + nombre, crudo, png)
    ext, huecos = contorno(png)
    formas[nombre] = {'contorno': ext, 'huecos': huecos, 'lado_px': lado}
    if nombre == 'hoja': escala = ALTO_HOJA_CM / alto_px
    print('dije', nombre, len(ext), 'puntos,', len(huecos), 'huecos')
for v in formas.values():
    v['cm'] = round(v.pop('lado_px') * escala, 3)
for n, v in viejas.items():
    if n not in formas: formas[n] = v
(ROOT / 'js' / 'dijes-formas.js').write_text('/* Generado por herramientas/recortar-naranja.py (y dijes-png.py para la hoja larga). No editar a mano. */\nwindow.DT_DIJES_FORMAS = ' + json.dumps(formas, separators=(',', ':')) + ';\n', encoding='utf-8')
print('listo')
