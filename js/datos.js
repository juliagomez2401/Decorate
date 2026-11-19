/* =========================================================
   Decora.te — datos del negocio
   Todo lo que es precio, contacto o catálogo vive acá.
   Precios en pesos uruguayos, tomados de la lista de precios.
   ========================================================= */
window.DT = {
  whatsapp: '59898443336',
  whatsappVisible: '098 443 336',
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
      custom: { href: 'arma.html?p=cinto', label: 'Armá tu cinto', txt: 'Elegís el tipo, los cueros, la hebilla, la unión y los flecos.' } },
    { id: 'tarjeteros', name: 'Tarjeteros', href: 'tienda.html?c=tarjeteros', foto: 'stock/5', desde: 650,
      custom: { href: 'arma.html?p=tarjetero', label: 'Armá tu tarjetero', txt: 'Tres compartimientos, el detalle en otro cuero y la unión.' } },
    { id: 'porta-lentes', name: 'Estuches de lentes', href: 'tienda.html?c=porta-lentes', foto: 'stock/50', pos: '50% 40%', desde: 550,
      custom: { href: 'arma.html?p=porta-lentes', label: 'Armá tu estuche de lentes', txt: 'Con o sin tapa, en uno o dos cueros, cosido o con tachas.' } },
    { id: 'portafuegos', name: 'Portafuegos', href: 'tienda.html?c=portafuegos', foto: 'stock/338', portada: 'stock/338', desde: 150,
      custom: { href: 'arma.html?p=portafuego', label: 'Armá tu portafuego', txt: 'Chico o grande, con decoración y flecos si querés.' } },
    { id: 'llaveros', name: 'Llaveros', href: 'tienda.html?c=llaveros', foto: 'stock/352', desde: 300,
      custom: { href: 'arma.html?p=llavero', label: 'Armá tu llavero', txt: 'Estrella, corazón, luna o varias estrellas, en el cuero que elijas.' } },
    { id: 'pulseras', name: 'Pulseras', href: 'tienda.html?c=pulseras', foto: 'pulsera', pos: '50% 60%', desde: 250,
      subs: [{ id: 'anchas', name: 'Anchas' }, { id: 'finas', name: 'Finas' }],
      custom: { href: 'arma.html?p=pulsera', label: 'Armá tu pulsera', txt: 'Lisa o trenzada, con tachas o estrellas.' } },
    { id: 'collares', name: 'Collares', href: 'tienda.html?c=collares', foto: 'collar', desde: 350,
      custom: { href: 'arma.html?p=collar', label: 'Armá tu collar', txt: 'Fino o grueso, con tiento trenzado y decoración.' } },
  ],

  /* ---------- Cintos (Armá el tuyo) ---------- */
  tipos: [
    { id: 'funcional', name: 'Funcional', desc: 'El que ajusta el pantalón. El precio varía según cuánto cuero lleva.', min: 1000, max: 1200 },
    { id: 'decorativo', name: 'Decorativo', desc: 'Ancho, para llevar sobre la ropa y armar el look.', min: 1250, max: 1250 },
  ],
  // Cueros disponibles (fotos de la dueña, nov. 2026). familia: cómo se ve en el 3D.
  cueros: [
    { id: 'cebra', name: 'Cebra', familia: 'pelo' },
    { id: 'leopardo', name: 'Leopardo', familia: 'pelo' },
    { id: 'leopardo-claro', name: 'Leopardo claro', familia: 'pelo' },
    { id: 'jaguar', name: 'Jaguar', familia: 'pelo' },
    { id: 'tigre', name: 'Tigre', familia: 'pelo' },
    { id: 'vaca', name: 'Vaca', familia: 'pelo' },
    { id: 'negro', name: 'Negro', familia: 'liso' },
    { id: 'blanco', name: 'Blanco', familia: 'liso' },
    { id: 'suela', name: 'Suela', familia: 'liso' },
    { id: 'rojo', name: 'Rojo', familia: 'liso' },
    { id: 'coral', name: 'Coral', familia: 'liso' },
    { id: 'bordo', name: 'Bordó', familia: 'liso' },
    { id: 'rosado', name: 'Rosado', familia: 'liso' },
    { id: 'rosa', name: 'Rosa', familia: 'liso' },
    { id: 'celeste', name: 'Celeste', familia: 'liso' },
    { id: 'azul', name: 'Azul', familia: 'liso' },
    { id: 'azul-marino', name: 'Azul marino', familia: 'liso' },
    { id: 'verde', name: 'Verde', familia: 'liso' },
    { id: 'negro-envejecido', name: 'Negro envejecido', familia: 'lavado' },
    { id: 'bordo-lavado', name: 'Bordó lavado', familia: 'lavado' },
    { id: 'verde-petroleo', name: 'Verde petróleo', familia: 'lavado' },
    { id: 'verde-oliva', name: 'Verde oliva', familia: 'lavado' },
    { id: 'azul-charol', name: 'Azul charol', familia: 'charol' },
    { id: 'plateado', name: 'Plateado', familia: 'metal' },
    { id: 'dorado', name: 'Dorado', familia: 'metal' },
    { id: 'bronce', name: 'Bronce', familia: 'metal' },
    { id: 'fucsia-metalizado', name: 'Fucsia metalizado', familia: 'metal' },
    { id: 'rojo-brillo', name: 'Rojo con brillo', familia: 'metal' },
    { id: 'gamuza-verde', name: 'Gamuza verde', familia: 'gamuza' },
    { id: 'gamuza-turquesa', name: 'Gamuza turquesa', familia: 'gamuza' },
    { id: 'gamuza-azul', name: 'Gamuza azul francia', familia: 'gamuza' },
    { id: 'gamuza-lila', name: 'Gamuza lila', familia: 'gamuza' },
    { id: 'croco-chocolate', name: 'Croco chocolate', familia: 'croco' },
    { id: 'croco-suela', name: 'Croco suela', familia: 'croco' },
    { id: 'croco-crema', name: 'Croco crema', familia: 'croco' },
    { id: 'croco-rojo', name: 'Croco rojo', familia: 'croco' },
    { id: 'croco-bordo', name: 'Croco bordó', familia: 'croco' },
    { id: 'croco-verde', name: 'Croco verde', familia: 'croco' },
    { id: 'croco-turquesa', name: 'Croco turquesa', familia: 'croco' },
    { id: 'croco-verde-metalizado', name: 'Croco verde metalizado', familia: 'croco-metal' },
    { id: 'lagarto-plateado', name: 'Lagarto plateado', familia: 'croco-metal' },
    { id: 'serpiente', name: 'Serpiente', familia: 'reptil' },
  ],
  // Hebillas disponibles. tipo: marco (+$50) o rellena (+$150), según la lista de precios.
  hebillas: [
    { id: 'oval-bronce', name: 'Ovalada bronce', tipo: 'marco', forma: 'oval', metal: 'bronce', color: '#7e6a51', price: 50 },
    { id: 'redonda-bronce', name: 'Redonda bronce', tipo: 'marco', forma: 'redonda', metal: 'bronce', color: '#7e7559', price: 50 },
    { id: 'rectangular-dorada', name: 'Rectangular dorada', tipo: 'marco', forma: 'rect', metal: 'oro', color: '#a7794a', price: 50 },
    { id: 'doble-plateada', name: 'Doble púa plateada', tipo: 'marco', forma: 'rect', metal: 'plata', color: '#978c85', price: 50 },
    { id: 'redonda-plateada-ancha', name: 'Redonda plateada ancha', tipo: 'marco', forma: 'redonda', metal: 'plata', color: '#979293', price: 50 },
    { id: 'redonda-plateada-fina', name: 'Redonda plateada fina', tipo: 'marco', forma: 'redonda', metal: 'plata', color: '#978f8a', price: 50 },
    { id: 'oval-labrada', name: 'Ovalada labrada plateada', tipo: 'marco', forma: 'oval', metal: 'plata', color: '#978e8a', price: 50 },
    { id: 'flor-bronce', name: 'Flor bronce', tipo: 'rellena', forma: 'flor', metal: 'bronce', color: '#7e6a50', price: 150 },
    { id: 'rosa-bronce', name: 'Rosa bronce', tipo: 'rellena', forma: 'flor', metal: 'bronce', color: '#7e6e57', price: 150 },
    { id: 'cuadrada-remaches', name: 'Cuadrada con remaches', tipo: 'rellena', forma: 'cuadrada', metal: 'bronce', color: '#7e6349', price: 150 },
    { id: 'redonda-guarda', name: 'Redonda con guarda', tipo: 'rellena', forma: 'redonda', metal: 'bronce', color: '#7e664f', price: 150 },
    { id: 'oval-repujada', name: 'Ovalada repujada', tipo: 'rellena', forma: 'oval', metal: 'bronce', color: '#7e6e5f', price: 150 },
  ],
  // uniones entre cuero y cuero (solo si el cinto lleva dos cueros)
  uniones: [
    { id: 'remaches', name: 'Remaches', desc: 'Los cueros se unen con remaches de metal.', price: 50 },
    { id: 'trenzado', name: 'Trenzado', desc: 'Unión cosida y trenzada a mano.', price: 150 },
    { id: 'ondulada', name: 'Corte ondulado', desc: 'El corte con ondas y un remache en cada una.', price: 50 },
    { id: 'acordonada', name: 'Acordonada', desc: 'Ojalillos con tiento cruzado, como un corsé.', price: 150 },
  ],
  // decoración: el funcional lleva tachas o soles en todo el largo; la faja, solo flecos
  deco: [
    { id: 'no', name: 'Sin decoración', desc: 'El cuero solo.', price: 0 },
    { id: 'tachas', name: 'Tachas arriba y abajo', desc: 'Dos filas en todo el cinto.', price: 100, tipo: 'funcional' },
    { id: 'tachas-medio', name: 'Tachas en el medio', desc: 'Una fila en todo el cinto.', price: 100, tipo: 'funcional' },
    { id: 'zigzag', name: 'Tachas en zigzag', desc: 'Una fila que sube y baja, en todo el cinto.', price: 100, tipo: 'funcional' },
    { id: 'soles', name: 'Soles cosidos', desc: 'Soles bordados con hilo en todo el cinto.', price: 100, tipo: 'funcional' },
    { id: 'flecos', name: 'Flecos', desc: 'Flecos de cuero de 40 cm, de un solo lado.', price: 200, tipo: 'decorativo' },
  ],
  // color del metal de remaches, argollas y tachas
  metales: [
    { id: 'oro-viejo', name: 'Oro viejo', desc: 'Dorado apagado, como bronce.' },
    { id: 'plomo', name: 'Plomo', desc: 'Gris oscuro.' },
    { id: 'dorado', name: 'Dorado', desc: 'Dorado brillante.' },
    { id: 'plata', name: 'Plata', desc: 'Plateado.' },
    { id: 'cobre', name: 'Cobre', desc: 'Marrón cobrizo. Solo en estrellas.', soloEstrellas: true },
  ],
  // dijes para el portafuego (foto de Julia, nov. 2026; img/dije-<id>.png)
  dijes: [
    { id: 'hoja', name: 'Hoja' }, { id: 'hoja-larga', name: 'Hoja larga' }, { id: 'pluma', name: 'Pluma' }, { id: 'ala', name: 'Ala' },
    { id: 'rama', name: 'Rama' }, { id: 'ginkgo', name: 'Ginkgo' }, { id: 'girasol', name: 'Girasol' }, { id: 'margarita', name: 'Margarita' },
    { id: 'flor', name: 'Flor' }, { id: 'flor-calada', name: 'Flor calada' }, { id: 'flor-piedra', name: 'Flor con piedra' },
    { id: 'estrella', name: 'Estrella' }, { id: 'leopardo', name: 'Leopardo dorado' },
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
      opciones: [{ key: 'ancho', label: 'Ancho', items: [{ id: '1-3', name: '1,3 cm', price: 250 }, { id: 'intermedia', name: '3 cm', price: 300 }, { id: '5', name: '5 cm', price: 350 }] }],
      cuero: true,
    },
    {
      id: 'collar', name: 'Collar', line: 'Para llevar puesto',
      fotos: ['collar'],
      alts: ['Collar de cuero rojo y turquesa trenzado'],
      desc: 'Collar de cuero, fino o más grueso, con o sin decoración.',
      opciones: [
        { key: 'ancho', label: 'Ancho', items: [{ id: '1-3', name: '1,3 cm', price: 350 }, { id: 'grueso', name: '2,6 cm', price: 450 }] },
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
