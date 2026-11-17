# Recorta la pieza (quita el fondo de madera) y la pone sobre fondo tabaco con sombra suave.
# Uso: .venv-fotos\Scripts\python herramientas\fondo-tabaco.py <salida> <número> [<número> ...]
#   Toma el original fotos\**\imageNNNNN.jpeg y deja <salida>\N.jpg (1600 px) y N-sm.jpg (760 px).
import sys, pathlib
from PIL import Image, ImageOps, ImageFilter, ImageDraw
from rembg import remove, new_session

root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
nums = [int(x) for x in sys.argv[2:]]
import os
session = new_session(os.environ.get('MODELO', 'birefnet-general-lite'))

def fondo(w, h):
    # degradé radial: centro tabaco claro, bordes tabaco oscuro (mismo que la prueba)
    c1, c2 = (110, 74, 50), (52, 32, 21)
    small = Image.new('RGB', (200, int(200 * h / w)))
    px = small.load(); sw, sh = small.size
    for y in range(sh):
        for x in range(sw):
            dx = (x - sw * 0.5) / (sw * 0.8); dy = (y - sh * 0.45) / (sh * 0.7)
            t = min(1.0, (dx * dx + dy * dy) ** 0.5)
            px[x, y] = tuple(round(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
    return small.resize((w, h), Image.BICUBIC)

for n in nums:
    src = next((root / 'fotos').rglob(f'image{n:05d}.jpeg'))
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    im.thumbnail((1600, 1600), Image.LANCZOS)
    cut = remove(im, session=session, post_process_mask=True)
    a = cut.split()[3]
    w, h = im.size
    bg = fondo(w, h)
    k = w / 1600
    sombra = a.filter(ImageFilter.GaussianBlur(22 * k)).point(lambda v: int(v * 0.55))
    capa = Image.new('RGB', (w, h), (18, 10, 6))
    desp = Image.new('L', (w, h), 0); desp.paste(sombra, (int(14 * k), int(24 * k)))
    bg = Image.composite(capa, bg, desp)
    bg.paste(im, (0, 0), a)
    bg.save(out / f'{n}.jpg', quality=86, optimize=True)
    sm = bg.copy(); sm.thumbnail((760, 760), Image.LANCZOS); sm.save(out / f'{n}-sm.jpg', quality=84, optimize=True)
    print('listo', n, src.name)
