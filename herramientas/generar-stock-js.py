# Genera js/stock.js a partir de herramientas/stock.json.
# Uso: python herramientas/generar-stock-js.py
import json, pathlib, unicodedata, re

root = pathlib.Path(__file__).resolve().parent.parent
data = json.loads((root / 'herramientas' / 'stock.json').read_text(encoding='utf-8'))

# Cómo se muestra cada grupo del inventario en la tienda.
# Precios tomados de la lista de precios; donde depende de detalles que no sabemos, va el rango y "a confirmar".
GRUPOS = {
    'cintos-decorativos': {'cat': 'cintos', 'sub': 'decorativos', 'singular': 'Cinto', 'min': 1250, 'max': None, 'confirmar': True},
    'cintos-funcionales': {'cat': 'cintos', 'sub': 'funcionales', 'singular': 'Cinto', 'min': 1000, 'max': None, 'confirmar': True},
    'tarjeteros': {'cat': 'tarjeteros', 'singular': 'Tarjetero', 'min': 650, 'max': 650, 'confirmar': False},
    'porta-lentes': {'cat': 'porta-lentes', 'singular': 'Porta lentes', 'min': 550, 'max': 650, 'confirmar': True},
    'portafuegos': {'cat': 'portafuegos', 'singular': 'Portafuego', 'min': 150, 'max': 200, 'confirmar': True},
    'llaveros': {'cat': 'llaveros', 'singular': 'Llavero', 'min': 300, 'max': 300, 'confirmar': False},
}

def slug(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

items = []
for grupo in data['categorias']:
    g = GRUPOS[grupo['id']]
    for p in grupo['productos']:
        if p['id'] == 'PF0':  # foto grupal: se usa como portada de la categoría, no es una pieza
            continue
        nombre = p['nombre']
        primera = nombre.split(' ')[0].lower()
        if primera in ('faja', 'cinto', 'tarjetero'):
            titulo = nombre
        else:
            titulo = f"{g['singular']} {nombre[0].lower()}{nombre[1:]}"
        modelo = list(p.get('fotosModelo', []))
        fotos = list(p['fotos']) + modelo  # en la página de la pieza: primero el producto solo, abajo puesto
        portada = p['fotos'][0]  # en la tienda, la portada es el producto solo
        hover = modelo[0] if modelo else (p['fotos'][1] if len(p['fotos']) > 1 else None)
        items.append({
            'id': p['id'].lower(),
            'cat': g['cat'],
            'sub': g.get('sub'),
            'name': titulo,
            'fotos': fotos,
            'portada': portada,
            'hover': hover,
            'min': g['min'],
            'max': g['max'] if g['max'] is not None else g['min'],
            'desde': g['max'] is None,
            'confirmar': g['confirmar'],
            'duda': p.get('duda'),
        })

js = ('/* Generado por herramientas/generar-stock-js.py a partir de herramientas/stock.json. No editar a mano. */\n'
      'window.DT_STOCK = ' + json.dumps(items, ensure_ascii=False, indent=1) + ';\n')
(root / 'js' / 'stock.js').write_text(js, encoding='utf-8')
print(len(items), 'piezas')
