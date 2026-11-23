"""Hace las texturas del celular (img/textura-<cuero>-m.jpg) a partir de las de escritorio.

texturas-3d.py ya las genera solas; esto sirve para rehacerlas sin regenerar todo:
  .venv-fotos/Scripts/python herramientas/texturas-movil.py
"""
import pathlib
from PIL import Image

root = pathlib.Path(__file__).resolve().parent.parent
for f in sorted((root / 'img').glob('textura-*.jpg')):
    if f.stem.endswith('-m'):
        continue
    im = Image.open(f).convert('RGB')
    im.resize((im.width // 2, im.height // 2), Image.LANCZOS).save(
        f.with_name(f.stem + '-m.jpg'), quality=74, optimize=True, progressive=True)
    print(f.stem)
