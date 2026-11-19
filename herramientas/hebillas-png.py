"""Recorta el fondo de las fotos de hebillas (fotos/hebillas/NN-slug.jpg) y guarda
img/hebilla-<slug>.png (300x300, fondo transparente). El fondo de las fotos es una
pared clara y lisa: se separa por diferencia de color y textura con el borde.
Uso: .venv-fotos/Scripts/python.exe herramientas/hebillas-png.py [slugs]"""
import pathlib, sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from skimage import color, filters, morphology, measure

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'fotos' / 'hebillas', ROOT / 'img'


REDONDAS = {'redonda-plateada-ancha', 'redonda-plateada-fina'}  # brillos iguales al fondo: el borde de afuera se cierra en círculo


def mascara(rgb, slug=''):
    lab = color.rgb2lab(rgb)
    h, w = lab.shape[:2]
    borde = np.concatenate([lab[:20].reshape(-1, 3), lab[-20:].reshape(-1, 3), lab[:, :20].reshape(-1, 3), lab[:, -20:].reshape(-1, 3)])
    fondo = np.median(borde, axis=0)
    # el fondo varía con la luz: se compara con una versión muy suavizada del borde hacia adentro
    # las sombras son grises y algo más oscuras que la pared: la luz solo cuenta si la diferencia es grande
    dl = np.maximum(np.abs(lab[..., 0] - fondo[0]) - 22, 0)
    d = np.sqrt(((lab[..., 1:] - fondo[1:]) ** 2).sum(-1) * 2.2 + (dl * 0.9) ** 2)
    gris = lab[..., 0]
    tex = np.abs(gris - ndi.gaussian_filter(gris, 3))
    tex = ndi.gaussian_filter(tex, 4)
    tex = np.maximum(tex - np.percentile(tex, 50) * 1.5, 0)
    score = d / max(np.percentile(d, 99.5), 1) + tex / max(np.percentile(tex, 99.5), 1) * 0.9
    score = ndi.gaussian_filter(score, 1.5)
    t = filters.threshold_otsu(score)
    m = score > t * 0.8
    m &= ~(lab[..., 2] < -12)  # el cinto azul que asoma en una foto
    m = morphology.opening(m, morphology.disk(3))
    m = morphology.closing(m, morphology.disk(6))
    lab_ = measure.label(m)
    if lab_.max() == 0:
        return m
    # la pieza: la componente grande más cerca del centro
    props = sorted(measure.regionprops(lab_), key=lambda r: -r.area)
    big = [r for r in props if r.area > props[0].area * 0.25]
    cy, cx = h / 2, w / 2
    best = min(big, key=lambda r: (r.centroid[0] - cy) ** 2 + (r.centroid[1] - cx) ** 2)
    m = lab_ == best.label
    # sombra pegada al borde: gris, lisa y un poco más oscura que la pared; se saca si toca el afuera
    croma = np.sqrt(((lab[..., 1:] - fondo[1:]) ** 2).sum(-1))
    osc = fondo[0] - lab[..., 0]
    tex0 = ndi.gaussian_filter(np.abs(gris - ndi.gaussian_filter(gris, 3)), 4)
    sombra = m & (croma < 10) & (osc > 8) & (tex0 < 0.75)
    afuera = morphology.dilation(~m, morphology.disk(2))
    sl = measure.label(sombra)
    toca = set(np.unique(sl[afuera & sombra])) - {0}
    if toca:
        m &= ~np.isin(sl, list(toca))
        m = morphology.opening(m, morphology.disk(2))
        l2 = measure.label(m); r2 = max(measure.regionprops(l2), key=lambda r: r.area); m = l2 == r2.label
        best = r2
    if slug in REDONDAS:
        # el círculo sale del ancho y del borde de arriba (abajo está la sombra)
        ys, xs = np.nonzero(m)
        x0, x1, y0 = xs.min(), xs.max(), ys.min()
        R = (x1 - x0) / 2; cx_, cy_ = (x0 + x1) / 2, y0 + R
        yy, xx = np.mgrid[:h, :w]; rr = np.hypot(yy - cy_, xx - cx_)
        m &= rr <= R
        m |= (rr <= R) & (rr >= R * 0.8)  # el aro de afuera, entero
    # agujeros chicos (brillos) se rellenan; los grandes (el hueco de la hebilla) quedan
    hoyos = ndi.binary_fill_holes(m) & ~m
    hl = measure.label(hoyos)
    for r in measure.regionprops(hl):
        if r.area < best.area * 0.04:
            m[hl == r.label] = True
    return m


# el borde de afuera de cada hebilla es una forma limpia: se rehace con esa forma (así no quedan pedazos de pared
# pegados ni mordiscos), y adentro quedan solo los huecos de verdad
RECTAS = {'cuadrada-remaches', 'doble-plateada', 'rectangular-dorada'}          # contorno de pocas rectas
CURVAS = {'oval-bronce', 'oval-labrada', 'oval-repujada', 'redonda-bronce', 'redonda-guarda',
          'redonda-plateada-ancha', 'redonda-plateada-fina'}                    # contorno convexo y redondeado
# sombras que quedan adentro del aro (gris, sin color): se vacían
INTERIOR_OSCURO = {'redonda-bronce'}   # aro dorado con barra y púa negras
SOMBRA_ADENTRO = {'redonda-bronce', 'redonda-plateada-fina', 'redonda-plateada-ancha', 'oval-labrada', 'rectangular-dorada', 'doble-plateada'}


def limpiar(m, rgb, slug):
    from skimage import draw
    h, w = m.shape
    lab = color.rgb2lab(rgb)
    core = morphology.opening(m, morphology.disk(9))
    lb = measure.label(core)
    if lb.max():
        core = lb == max(measure.regionprops(lb), key=lambda r: r.area).label
    llena = ndi.binary_fill_holes(m)
    if slug in RECTAS or slug in CURVAS:
        hull = morphology.convex_hull_image(core)
        if slug in RECTAS:
            c = max(measure.find_contours(np.pad(hull, 1).astype(float), 0.5), key=len) - 1
            pol = measure.approximate_polygon(c, tolerance=7)
            afuera = np.zeros_like(m); rr, cc = draw.polygon(pol[:, 0], pol[:, 1], m.shape); afuera[rr, cc] = True
        else:
            afuera = hull
        afuera = ndi.binary_erosion(afuera, iterations=3)   # sin el halo claro del borde
    else:
        afuera = ndi.binary_erosion(ndi.binary_fill_holes(core), iterations=2)
    # huecos de verdad: los grandes de la máscara original
    huecos = llena & ~m
    hl = measure.label(huecos)
    tot = afuera.sum()
    huecos = np.isin(hl, [r.label for r in measure.regionprops(hl) if r.area > tot * 0.01])
    if slug in SOMBRA_ADENTRO and huecos.any():
        # cerca de los huecos, lo gris claro sin color es pared o sombra, no metal
        cerca = ndi.binary_dilation(huecos, iterations=40) & afuera
        # el color de la pared: el de los huecos mismos
        fondo = np.median(lab[huecos], axis=0)
        dab = np.hypot(lab[..., 1] - fondo[1], lab[..., 2] - fondo[2])
        lisa = ndi.gaussian_filter(np.abs(lab[..., 0] - ndi.gaussian_filter(lab[..., 0], 2)), 2) < 1.5
        pared = cerca & (dab < 10) & (lab[..., 0] > fondo[0] - 40) & (lab[..., 0] < fondo[0] + 15)
        if slug in {'doble-plateada', 'redonda-plateada-fina', 'redonda-plateada-ancha', 'oval-labrada'}: pared &= lisa   # el metal plateado es gris como la pared: ahí solo lo muy parejo
        pared = morphology.opening(pared, morphology.disk(3))
        pl = measure.label(pared)
        # solo lo que toca un hueco
        toca = set(np.unique(pl[ndi.binary_dilation(huecos, iterations=2)])) - {0}
        huecos |= np.isin(pl, list(toca))
        huecos = morphology.closing(huecos, morphology.disk(2))
    if slug in INTERIOR_OSCURO and huecos.any():
        # adentro del aro solo hay metal oscuro (la barra y la púa) o dorado: lo gris intermedio es sombra en la pared
        adentro = ndi.binary_dilation(morphology.convex_hull_image(huecos), iterations=4) & afuera
        croma = np.hypot(lab[..., 1], lab[..., 2])
        # la sombra también es oscura: de lo oscuro queda solo lo que tiene forma de barra recta (la barra y la púa)
        osc = lab[..., 0] < 45
        R = morphology.footprint_rectangle
        barras = morphology.opening(osc, R((160, 9))) | morphology.opening(osc, R((9, 160)))
        barras = morphology.closing(barras, R((1, 31))) | morphology.closing(barras, R((31, 1)))
        metal = morphology.closing(barras, morphology.disk(6)) | (ndi.binary_dilation(barras, iterations=14) & (croma > 12))
        huecos |= adentro & ~metal
        huecos = morphology.opening(huecos, morphology.disk(2))
    huecos = ndi.binary_dilation(huecos, iterations=1)
    m = morphology.opening(afuera & ~huecos, morphology.disk(3))   # sin hilachas ni pedacitos de pared
    lb = measure.label(m)
    return lb == max(measure.regionprops(lb), key=lambda r: r.area).label


def procesar(p):
    slug = p.stem.split('-', 1)[1]
    im = Image.open(p).convert('RGB')
    im.thumbnail((1400, 1400), Image.LANCZOS)
    rgb = np.asarray(im).astype(np.float64) / 255
    m = limpiar(mascara(rgb, slug), rgb, slug)
    a = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    a = a.point(lambda v: 0 if v < 40 else 255 if v > 215 else int((v - 40) * 255 / 175))
    rgba = im.copy(); rgba.putalpha(a)
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    lado = int(max(y1 - y0, x1 - x0) * 1.08)
    cy, cx = (y0 + y1) // 2, (x0 + x1) // 2
    lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
    lienzo.paste(rgba.crop((cx - lado // 2, cy - lado // 2, cx - lado // 2 + lado, cy - lado // 2 + lado)), (0, 0))
    # 300 px y 256 colores: liviana para el celular (unos 30 KB)
    lienzo = lienzo.resize((300, 300), Image.LANCZOS).quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    lienzo.save(OUT / f'hebilla-{slug}.png', optimize=True)
    print(slug, (OUT / f'hebilla-{slug}.png').stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    want = set(sys.argv[1:])
    for p in sorted(SRC.glob('*.jpg')):
        if not want or p.stem.split('-', 1)[1] in want:
            procesar(p)
