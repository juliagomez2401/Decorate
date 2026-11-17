# Genera js/cueros-datos.js: las muestras de cuero (img/cuero-*.jpg) metidas dentro del JS.
# Solo se usa cuando la web se abre como archivo (doble clic), porque así el navegador
# no deja que el 3D lea las fotos sueltas. En internet no se carga.
# Uso: python herramientas/generar-cueros-datos.py
import base64, json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
d = {p.stem.replace('cuero-', ''): 'data:image/jpeg;base64,' + base64.b64encode(p.read_bytes()).decode() for p in sorted((root / 'img').glob('cuero-*.jpg'))}
(root / 'js' / 'cueros-datos.js').write_text('/* Generado por herramientas/generar-cueros-datos.py. No editar a mano. */\nwindow.DT_CUEROS_B64 = ' + json.dumps(d) + ';\n', encoding='utf-8')
print(len(d), 'cueros')
