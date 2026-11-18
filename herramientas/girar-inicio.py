"""Da vuelta (180°) las fotos del inicio del estuche de lentes y del portafuego, que estaban al revés.
Toma las originales de herramientas/originales-inicio/ y deja el resultado en img/.
Uso: .venv-fotos/Scripts/python.exe herramientas/girar-inicio.py"""
import pathlib
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
for nombre in ['inicio-portalentes-sm.jpg', 'inicio-portafuego-sm.jpg']:
    im = Image.open(ROOT / 'herramientas' / 'originales-inicio' / nombre).convert('RGB')
    im.rotate(180).save(ROOT / 'img' / nombre, quality=88)
print('ok')
