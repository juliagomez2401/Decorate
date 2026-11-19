# Genera js/cueros-datos.js: las texturas del 3D (img/textura-*.jpg, achicadas), los dijes del portafuego
# (img/dije-*.png) y las hebillas (img/hebilla-*.png) metidos dentro del JS. Solo se usa cuando la web se abre como archivo (doble clic),
# porque así el navegador no deja que el 3D lea las fotos sueltas. En internet no se carga.
# Uso: .venv-fotos/Scripts/python.exe herramientas/generar-cueros-datos.py
import base64, io, json, pathlib
from PIL import Image
root = pathlib.Path(__file__).resolve().parent.parent
d = {}
for p in sorted((root / 'img').glob('textura-*.jpg')):
    buf = io.BytesIO(); Image.open(p).resize((512, 512), Image.LANCZOS).save(buf, 'JPEG', quality=75)
    d[p.stem.replace('textura-', '')] = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
dj = {}
for p in sorted((root / 'img').glob('dije-*.png')):
    dj[p.stem.replace('dije-', '')] = 'data:image/png;base64,' + base64.b64encode(p.read_bytes()).decode()
hb = {}
for p in sorted((root / 'img').glob('hebilla-*.png')):
    hb[p.stem.replace('hebilla-', '')] = 'data:image/png;base64,' + base64.b64encode(p.read_bytes()).decode()
texto = ('/* Generado por herramientas/generar-cueros-datos.py. No editar a mano. */\n'
         'window.DT_CUEROS_B64 = ' + json.dumps(d) + ';\n'
         'window.DT_DIJES_B64 = ' + json.dumps(dj) + ';\n'
         'window.DT_HEBILLAS_B64 = ' + json.dumps(hb) + ';\n')
(root / 'js' / 'cueros-datos.js').write_text(texto, encoding='utf-8')
print(len(d), 'cueros,', len(dj), 'dijes,', len(hb), 'hebillas')
