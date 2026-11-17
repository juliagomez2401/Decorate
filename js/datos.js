/* =========================================================
   Decora.te — datos del negocio
   Todo lo que es precio, contacto o catálogo vive acá.
   Precios en pesos uruguayos, tomados de la lista de precios.
   ========================================================= */
window.DT = {
  whatsapp: '59891455230',
  whatsappVisible: '091 455 230',
  instagram: 'decora___te',

  /* ---------- mensajes de la franja superior (se turnan) ---------- */
  avisos: ['Hecho a mano en Uruguay', 'Pedidos con 72 horas de anticipación'],

  /* ---------- formas de pago (dato real del Instagram) ---------- */
  pagos: ['Efectivo', 'Transferencia bancaria'],

  /* ---------- páginas de ayuda que faltan armar (paso 4) ---------- */
  ayudaPendiente: ['Cómo medir tu cintura', 'Cuidado del cuero', 'Cambios', 'Preguntas frecuentes'],

  /* ---------- categorías de la tienda ---------- */
  // Cada categoría tiene su página (tienda.html?c=…) con las piezas en stock (js/stock.js)
  // y un acceso para hacerla a medida (custom).
  categorias: [
    { id: 'cintos', name: 'Cintos', href: 'tienda.html?c=cintos', foto: 'stock/44', pos: '50% 55%', desde: 1000,
      subs: [{ id: 'decorativos', name: 'Decorativos' }, { id: 'funcionales', name: 'Funcionales' }],
      custom: { href: 'arma.html?p=cinto', label: 'Armá tu cinto', txt: 'Elegís el tipo, los cueros, la hebilla y la unión.' } },
    { id: 'tarjeteros', name: 'Tarjeteros', href: 'tienda.html?c=tarjeteros', foto: 'stock/5', desde: 650,
      custom: { href: 'arma.html?p=tarjetero', label: 'Armá tu tarjetero', txt: 'Elegís el cuero, el detalle y si lleva tachas.' } },
    { id: 'porta-lentes', name: 'Estuches de lentes', href: 'tienda.html?c=porta-lentes', foto: 'stock/50', pos: '50% 40%', desde: 550,
      custom: { href: 'arma.html?p=porta-lentes', label: 'Armá tu estuche de lentes', txt: 'Con o sin tapa, en el cuero que elijas.' } },
    { id: 'portafuegos', name: 'Portafuegos', href: 'tienda.html?c=portafuegos', foto: 'stock/338', portada: 'stock/338', desde: 150,
      custom: { href: 'arma.html?p=portafuego', label: 'Armá tu portafuego', txt: 'Chico o grande, en el cuero que elijas.' } },
    { id: 'llaveros', name: 'Llaveros', href: 'tienda.html?c=llaveros', foto: 'stock/352', desde: 300,
      custom: { href: 'arma.html?p=llavero', label: 'Armá tu llavero', txt: 'En el cuero que elijas.' } },
    { id: 'pulseras', name: 'Pulseras', href: 'tienda.html?c=pulseras', foto: 'pulsera', pos: '50% 60%', desde: 250,
      subs: [{ id: 'anchas', name: 'Anchas' }, { id: 'finas', name: 'Finas' }],
      custom: { href: 'arma.html?p=pulsera', label: 'Armá tu pulsera', txt: 'En tres anchos y en el cuero que elijas.' } },
    { id: 'collares', name: 'Collares', href: 'tienda.html?c=collares', foto: 'collar', desde: 350,
      custom: { href: 'arma.html?p=collar', label: 'Armá tu collar', txt: 'Fino o más grueso, con o sin decoración.' } },
  ],

  /* ---------- Cintos (Armá el tuyo) ---------- */
  tipos: [
    { id: 'funcional', name: 'Funcional', desc: 'El que ajusta el pantalón. El precio varía según cuánto cuero lleva.', min: 1000, max: 1200 },
    { id: 'decorativo', name: 'Decorativo', desc: 'Ancho, para llevar sobre la ropa y armar el look.', min: 1250, max: 1250 },
  ],
  // [PLACEHOLDER] Confirmar qué cueros hay disponibles. Las muestras son recortes de piezas reales.
  cueros: [
    { id: 'cebra', name: 'Cebra' },
    { id: 'leopardo', name: 'Leopardo' },
    { id: 'vaca', name: 'Vaca' },
    { id: 'croco-chocolate', name: 'Croco chocolate' },
    { id: 'croco-turquesa', name: 'Croco turquesa' },
    { id: 'bordo', name: 'Bordó' },
    { id: 'rojo', name: 'Rojo' },
    { id: 'azul-charol', name: 'Charol azul noche' },
    { id: 'azul-lavado', name: 'Azul lavado' },
    { id: 'plateado', name: 'Plateado' },
  ],
  hebillas: [
    { id: 'normal', name: 'Normal', desc: 'Marco clásico de metal.', price: 50 },
    { id: 'rellena', name: 'Rellena', desc: 'Placa de metal trabajada.', price: 150 },
    { id: 'pedreria', name: 'Pedrería', desc: 'Marco con piedras.', price: 250 },
  ],
  uniones: [
    { id: 'ninguna', name: 'Sin unión', desc: 'Un solo cuero, de punta a punta.', price: 0, onlySingle: true },
    { id: 'remaches', name: 'Remaches', desc: 'Los cueros se unen con remaches de metal.', price: 50 },
    { id: 'argollas', name: 'Argollas', desc: 'Una argolla entre cuero y cuero.', price: 100 },
    { id: 'trenzado', name: 'Trenzado', desc: 'Unión cosida y trenzada a mano.', price: 150 },
  ],
  deco: [
    { id: 'no', name: 'Sin decoración', desc: 'El cuero solo.', price: 0 },
    { id: 'si', name: 'Con decoración', desc: 'Tachas y detalles de metal.', price: 100 },
  ],
  maxCueros: 3,

  /* ---------- Piezas ---------- */
  productos: [
    {
      id: 'porta-lentes', name: 'Estuche de lentes', line: 'Para guardar',
      fotos: ['portalentes-cebra', 'portalentes-croco', 'portalentes-par', 'portalentes-leopardo', 'portalentes-chocolate'],
      pos: ['74% 50%'], // encuadre de cada foto cuando se recorta (la primera es horizontal)
      alts: ['Estuche de lentes de cebra con costura roja', 'Estuche de lentes de croco turquesa con tachas', 'Dos estuches de lentes, turquesa y bordó, con tachas', 'Estuche de lentes de leopardo con lentes de sol', 'Porta lentes chocolate con tachas doradas'],
      desc: 'Funda para lentes con mosquetón para colgar. Con o sin tapa, en el cuero que elijas.',
      opciones: [{ key: 'modelo', label: 'Modelo', items: [{ id: 'sin-tapa', name: 'Sin tapa', price: 550 }, { id: 'con-tapa', name: 'Con tapa', price: 650 }] }],
      cuero: true,
    },
    {
      id: 'tarjetero', name: 'Tarjetero', line: 'Para guardar',
      fotos: ['tarjetero-cebra', 'tarjeteros-varios', 'tarjetero-croco', 'tarjetero-turquesa'],
      alts: ['Tarjetero de cebra, bordó y negro', 'Cuatro tarjeteros con tachas en distintos cueros', 'Tarjetero de croco turquesa', 'Tarjetero turquesa con cebra'],
      desc: 'Tarjetero de cuero, liso o con tachas, en el cuero que elijas.',
      opciones: [],
      base: 650,
      cuero: true,
    },
    {
      id: 'pulsera', name: 'Pulsera', line: 'Para llevar puesto',
      fotos: ['pulsera', 'pulseras-puestas'],
      alts: ['Pulsera ancha de cuero dorado con estrella', 'Pulseras de cuero puestas'],
      desc: 'Tres anchos, de la más fina a la de 5 cm.',
      opciones: [{ key: 'ancho', label: 'Ancho', items: [{ id: '1-3', name: '1,3 cm', price: 250 }, { id: 'intermedia', name: 'Intermedia', price: 300 }, { id: '5', name: '5 cm', price: 350 }] }],
      cuero: true,
    },
    {
      id: 'collar', name: 'Collar', line: 'Para llevar puesto',
      fotos: ['collar'],
      alts: ['Collar de cuero rojo y turquesa trenzado'],
      desc: 'Collar de cuero, fino o más grueso, con o sin decoración.',
      opciones: [
        { key: 'ancho', label: 'Ancho', items: [{ id: '1-3', name: '1,3 cm', price: 350 }, { id: 'grueso', name: 'Más grueso', price: 450 }] },
        { key: 'deco', label: 'Decoración', items: [{ id: 'no', name: 'Sin decoración', price: 0 }, { id: 'si', name: 'Con decoración', price: 50, max: 100, note: '+$50 a $100' }] },
      ],
      cuero: true,
    },
    {
      id: 'llavero', name: 'Llavero', line: 'Para llevar',
      fotos: ['llaveros-estrella'],
      alts: ['Llaveros de cuero en forma de estrella con tachas'],
      desc: 'Llavero de cuero con tachas.',
      opciones: [],
      base: 300,
      cuero: true,
    },
    {
      id: 'portafuego', name: 'Portafuego', line: 'Para llevar',
      fotos: [],
      placeholder: '[PLACEHOLDER] Foto del portafuego sobre fondo neutro',
      desc: 'Funda de cuero para el encendedor, en dos tamaños.',
      opciones: [{ key: 'tamano', label: 'Tamaño', items: [{ id: 'chico', name: 'Chico', price: 150 }, { id: 'grande', name: 'Grande', price: 200 }] }],
      cuero: true,
    },
  ],
};
