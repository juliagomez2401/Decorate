/* =========================================================
   Decora.te — Armá el tuyo (todas las piezas)
   Pasos, vista 3D en vivo con el cuero real, precio y pedido
   (carrito o WhatsApp). La pieza sale de arma.html?p=…
   ========================================================= */
(() => {
  'use strict';
  const D = window.DT;
  const S = window.DTSite;
  const builder = document.querySelector('[data-pieza]');
  if (!builder || !S) return;
  const $ = (s, c = builder) => c.querySelector(s);
  const $$ = (s, c = builder) => Array.from(c.querySelectorAll(s));
  const { money, esc } = S;
  const find = (list, id) => (list || []).find((x) => x.id === id);
  const cueroName = (id) => (find(D.cueros, id) || {}).name || '';
  const prod = (id) => D.productos.find((p) => p.id === id) || {};
  const opts = (pid, key) => ((prod(pid).opciones || []).find((o) => o.key === key) || {}).items || [];
  const plus = (n) => (n ? '+' + money(n) : 'Incluido');
  const TACHAS = [{ id: 'no', name: 'Sin tachas', desc: 'Solo el pespunte.' }, { id: 'si', name: 'Con tachas', desc: 'Tachas de metal por el borde.' }];
  const NOTA_TACHAS = '[PLACEHOLDER] Confirmar si las tachas cambian el precio.';
  // conEstrellas(st): si lleva estrellas, también se ofrece cobre (solo existe en estrellas)
  const METAL = (cuando, conEstrellas = () => false) => ({ key: 'metal', label: 'Metal', titulo: 'El color del metal', hint: 'De los remaches, las tachas y los detalles de metal.', si: cuando, opciones: (st) => D.metales.filter((o) => !o.soloEstrellas || conEstrellas(st)).map((o) => ({ ...o, etiqueta: 'Incluido' })) });
  const metalTxt = (st) => st.metal && 'Metal ' + find(D.metales, st.metal).name.toLowerCase();
  const nombre = (lista, id) => (find(lista, id) || {}).name || '';

  const TRAMO = [{ id: 'corto', name: '12 cm', desc: 'Desde donde se juntan los cueros.' }, { id: 'largo', name: '22 cm', desc: 'Desde donde se juntan los cueros, más hacia atrás.' }];
  const UBIC_PF = [{ id: 'columna', name: 'En columna', desc: 'Tres en el medio del frente.' }, { id: 'L', name: 'En L', desc: 'En la esquina de abajo, del lado contrario al dije.' }, { id: 'filas', name: 'En dos filas', desc: 'Dos filas verticales juntas, en un costado.' }, { id: 'costados', name: 'Una fila en cada costado', desc: 'Dos filas verticales, una a cada lado.' }];
  const DECO_LENTES = [{ id: 'no', name: 'Sin tachas', desc: '' }, { id: 'l', name: 'Tachas en L', desc: 'Por el costado del mosquetón y abajo.' }, { id: 'alrededor', name: 'Tachas alrededor', desc: 'Por los dos costados y abajo.' }];
  const DECO_PF = [
    { id: 'no', name: 'Sin decoración', desc: 'El cuero solo.' }, { id: 'estrellas', name: 'Estrellas', desc: 'Estrellas de metal.' },
    { id: 'remaches', name: 'Remaches', desc: 'Remaches de metal.' }, { id: 'estrellas-remaches', name: 'Estrellas y remaches', desc: 'Intercalados.' }];
  const CANTIDAD = [{ id: '5', name: 'Cinco', desc: 'Repartidas parejo en todo el largo.' }, { id: 'toda', name: 'En toda la pulsera', desc: 'Una fila de punta a punta.' }];
  const CANTIDAD_COLLAR = [{ id: '5', name: 'Cinco', desc: 'Repartidas parejo adelante.' }, { id: 'toda', name: 'En todo el collar', desc: 'Una fila de punta a punta.' }];
  const DECO_METAL = [
    { id: 'no', name: 'Sin decoración', desc: 'El cuero solo.' }, { id: 'tachas', name: 'Tachas', desc: 'Tachas redondas de metal.' },
    { id: 'estrellas', name: 'Estrellas', desc: 'Estrellas de metal.' }, { id: 'estrellas-tachas', name: 'Estrellas y tachas', desc: 'Intercaladas.' }];

  /* ----- cada pieza: pasos, opciones y precio ----- */
  const PIEZAS = {
    cinto: {
      nombre: 'Cinto', titulo: 'Armá tu cinto', bajada: 'Elegís el tipo, la forma, cómo se combinan los cueros, la hebilla y el detalle final. Lo ves con el cuero real y sabés cuánto sale antes de pedirlo.',
      state: { tipo: null, forma: null, cuero: null, combo: null, union: null, cuero2: null, cierre: null, hebilla: null, deco: null, lado: null, tramo: null, metal: null, metalCierre: null, cintura: '' },
      precio: (st) => { const t = find(D.tipos, st.tipo); if (!t) return { min: D.tipos[0].min, max: D.tipos[1].max }; let x = 0; [[D.hebillas, st.hebilla], [D.uniones, st.union], [D.deco, st.deco]].forEach(([l, id]) => { const o = find(l, id); if (o) x += o.price; }); return { min: t.min + x, max: t.max + x }; },
      pasos: [
        { key: 'tipo', label: 'Tipo', titulo: '¿Qué cinto buscás?', hint: 'El funcional ajusta el pantalón; la faja es ancha y va sobre la ropa.', opciones: () => D.tipos.map((t) => ({ ...t, name: t.id === 'decorativo' ? 'Faja (decorativo)' : t.name, etiqueta: S.range(t.min, t.max) })) },
        { key: 'forma', label: 'Forma', titulo: 'La forma', hint: 'Las mismas formas de las fajas que ya hicimos.', si: (st) => st.tipo === 'decorativo', opciones: () => [
          { id: 'recta', name: 'Recta', desc: 'Pareja adelante y se angosta hacia atrás.' },
          { id: 'asimetrica', name: 'Asimétrica', desc: 'Un costado sube más ancho.' },
          { id: 'mono', name: 'Moño', desc: 'Angosta al medio, con la hebilla, y ancha a los costados.' },
          { id: 'cruzada', name: 'Cruzada', desc: 'Adelante cruza en diagonal, más alta de un lado.' }] },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'El cuero principal', hint: 'Es el de adelante, donde va la hebilla.' },
        { key: 'combo', label: 'Cueros', titulo: '¿Uno o dos cueros?', hint: 'Así se combinan los cueros en nuestros cintos.', opciones: (st) => [
          { id: 'solo', name: 'Un solo cuero', desc: st.tipo === 'funcional' ? 'Todo el cinto en el cuero principal.' : 'Toda la faja en el cuero principal.' },
          { id: 'costados', name: 'Dos cueros', desc: st.tipo === 'funcional' ? 'Adelante el principal; a los costados, lejos de la hebilla y los agujeros, el otro.' : 'Adelante el principal y los costados en otro, con cortes en diagonal.' }].concat(st.tipo === 'decorativo' ? [{ id: 'alternado', name: 'Dos cueros alternados', desc: 'Cada uno se repite dos veces: adelante y atrás el principal, a los costados el otro.' }] : []) },
        { key: 'union', label: 'Unión', titulo: 'La unión', hint: 'Cómo se unen los dos cueros.', si: (st) => st.combo === 'costados' || st.combo === 'alternado', opciones: () => D.uniones.map((o) => ({ ...o, etiqueta: plus(o.price) })) },
        { key: 'cuero2', label: 'Segundo cuero', tipo: 'cuero', titulo: 'El segundo cuero', hint: 'Elegí uno que contraste con el principal.', si: (st) => st.combo === 'costados' || st.combo === 'alternado', excluir: 'cuero' },
        { key: 'cierre', label: 'Cierre', titulo: '¿Cómo cierra?', hint: 'Con hebilla adelante o con broches al costado.', si: (st) => st.tipo === 'decorativo', opciones: () => [
          { id: 'hebilla', name: 'Hebilla adelante', desc: 'Elegís la hebilla en el paso que sigue.' },
          { id: 'broches', name: 'Broches al costado', desc: 'Sin hebilla: cierra al costado con tres broches.' }] },
        { key: 'hebilla', label: 'Hebilla', si: (st) => !(st.tipo === 'decorativo' && st.cierre === 'broches'), titulo: 'La hebilla', hint: 'Las que tenemos en el taller. Las de marco suman $50 y las rellenas $150.', fotos: 'hebilla', opciones: () => D.hebillas.map((o) => ({ ...o, etiqueta: plus(o.price) })) },
        { key: 'deco', label: 'Decoración', titulo: 'La decoración', hint: (st) => (st.tipo === 'decorativo' ? 'En la faja, la decoración son los flecos.' : 'Siempre en todo el cinto.'), opciones: (st) => D.deco.filter((o) => !o.tipo || o.tipo === st.tipo).map((o) => ({ ...o, etiqueta: plus(o.price) })) },
        { key: 'lado', label: 'Lado', titulo: '¿De qué lado los flecos?', hint: 'Salen del borde de abajo, desde donde se juntan los cueros hacia atrás.', si: (st) => st.deco === 'flecos', opciones: () => [{ id: 'izquierda', name: 'Izquierda', desc: 'Del lado izquierdo de quien lo usa.' }, { id: 'derecha', name: 'Derecha', desc: 'Del lado derecho de quien lo usa.' }] },
        { key: 'tramo', label: 'Largo', titulo: '¿Cuánto ocupan los flecos?', hint: 'Empiezan donde se juntan los cueros y siguen hacia atrás.', si: (st) => st.deco === 'flecos', opciones: () => TRAMO },
        METAL((st) => ['remaches', 'ondulada', 'acordonada'].includes(st.union) || ['tachas', 'tachas-medio', 'zigzag'].includes(st.deco)),
        { key: 'metalCierre', label: 'Broches', titulo: 'El color de los broches', hint: 'Los tres broches del costado.', si: (st) => st.tipo === 'decorativo' && st.cierre === 'broches', opciones: () => D.metales.filter((o) => !o.soloEstrellas).map((o) => ({ ...o, etiqueta: 'Incluido' })) },
      ],
      campos: [{ key: 'cintura', label: 'Cintura en cm (opcional)', num: true }],
      describir: (st) => [
        find(D.tipos, st.tipo) && (st.tipo === 'decorativo' ? 'Faja' + (st.forma ? ' ' + { recta: 'recta', asimetrica: 'asimétrica', mono: 'moño', cruzada: 'cruzada' }[st.forma] : '') : 'Cinto funcional'),
        st.cuero && cueroName(st.cuero) + (st.cuero2 ? (st.combo === 'alternado' ? ' alternado con ' : ' con ') + cueroName(st.cuero2).toLowerCase() : ''),
        st.cierre === 'broches' && 'Cierra con broches al costado' + (st.metalCierre ? ' (' + nombre(D.metales, st.metalCierre).toLowerCase() + ')' : ''),
        find(D.hebillas, st.hebilla) && 'Hebilla ' + find(D.hebillas, st.hebilla).name.toLowerCase(),
        st.union && st.union !== 'ninguna' && 'Unión ' + find(D.uniones, st.union).name.toLowerCase(),
        st.deco && st.deco !== 'no' && nombre(D.deco, st.deco) + (st.deco === 'flecos' ? ' de 40 cm' + (st.lado ? ' a la ' + st.lado : '') + (st.tramo ? ', ' + nombre(TRAMO, st.tramo).toLowerCase() : '') : ''), metalTxt(st), st.cintura.trim() && `Cintura ${st.cintura.trim()} cm`].filter(Boolean),
      nota: (st) => (st.tipo === 'funcional' ? 'En el cinto funcional, el precio final depende del cuero.' : ''),
    },
    tarjetero: {
      nombre: 'Tarjetero', titulo: 'Armá tu tarjetero', bajada: 'Arriba, el compartimiento grande para billetes; adelante, dos escalonados para tarjetas. Elegís el cuero y el detalle. Siempre cosido a mano.',
      state: { cuero: null, detalle: null, cuero2: null },
      precio: () => ({ min: 650, max: 650 }), notaPrecio: '[PLACEHOLDER] Confirmar si el detalle cambia el precio.',
      pasos: [
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'Es el cuero de todo el tarjetero.' },
        { key: 'detalle', label: 'Detalle', titulo: 'El detalle', hint: 'El compartimiento del medio puede ir en otro cuero.', opciones: () => [
          { id: 'no', name: 'Liso', desc: 'Los tres compartimientos en el mismo cuero, con media luna adelante.' },
          { id: 'franja', name: 'Franja', desc: 'El compartimiento del medio es una franja recta en otro cuero.' },
          { id: 'v', name: 'V', desc: 'El del medio y el de adelante cortados en V; el del medio en otro cuero.' },
          { id: 'diagonal', name: 'Franja en diagonal', desc: 'El del medio y el de adelante cortados en diagonal; el del medio en otro cuero.' }] },
        { key: 'cuero2', label: 'Cuero del detalle', tipo: 'cuero', titulo: 'El cuero del detalle', hint: 'Elegí uno distinto para que se note.', si: (st) => st.detalle && st.detalle !== 'no', excluir: 'cuero' },
      ],
      describir: (st) => [st.cuero && cueroName(st.cuero), st.detalle === 'franja' && 'Franja' + (st.cuero2 ? ' en ' + cueroName(st.cuero2).toLowerCase() : ''), st.detalle === 'v' && 'V' + (st.cuero2 ? ' en ' + cueroName(st.cuero2).toLowerCase() : ''), st.detalle === 'diagonal' && 'Franja en diagonal' + (st.cuero2 ? ' en ' + cueroName(st.cuero2).toLowerCase() : ''), 'Cosido a mano'].filter(Boolean),
    },
    'porta-lentes': {
      nombre: 'Estuche de lentes', titulo: 'Armá tu estuche de lentes', bajada: 'Con o sin tapa, en uno o dos cueros, con mosquetón para colgar.',
      state: { modelo: null, cuero: null, combo: null, cuero2: null, union: null, deco: null, metal: null, conDije: null, dije: null },
      precio: (st) => { const o = find(opts('porta-lentes', 'modelo'), st.modelo); return o ? { min: o.price, max: o.price } : { min: 550, max: 650 }; },
      pasos: [
        { key: 'modelo', label: 'Modelo', titulo: '¿Con o sin tapa?', hint: 'La tapa cierra con un broche.', opciones: () => opts('porta-lentes', 'modelo').map((o) => ({ ...o, desc: o.id === 'con-tapa' ? 'Tapa que cubre la boca del estuche.' : 'Abierto arriba, el lente entra y sale fácil.', etiqueta: money(o.price) })) },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'Es el cuero principal del estuche.' },
        { key: 'combo', label: 'Combinación', titulo: '¿Lo combinamos con otro cuero?', hint: 'Con un corte en diagonal.', opciones: () => [
          { id: 'solo', name: 'Un solo cuero', desc: 'Todo el estuche en el cuero principal.' },
          { id: 'diagonal', name: 'Dos cueros', desc: 'Un corte en diagonal, con una onda suave: abajo, otro cuero.' }] },
        { key: 'cuero2', label: 'Segundo cuero', tipo: 'cuero', titulo: 'El segundo cuero', hint: 'El de abajo del corte en diagonal.', si: (st) => st.combo === 'diagonal', excluir: 'cuero' },
        { key: 'union', label: 'Unión', titulo: '¿Cómo lo unimos?', hint: 'Por los costados y abajo.', opciones: () => [
          { id: 'hilo', name: 'Cosido con hilo', desc: 'Costura a mano con hilo.' },
          { id: 'tiento', name: 'Cosido con tiento', desc: 'Tiento de cuero pasado por el borde.' }] },
        { key: 'deco', label: 'Tachas', titulo: '¿Con tachas?', hint: 'Arriba nunca: ahí está la boca.', opciones: () => DECO_LENTES },
        METAL((st) => st.deco === 'l' || st.deco === 'alrededor'),
        { key: 'conDije', label: 'Dije', titulo: '¿Con dije?', hint: 'Un dije colgando de la argolla del mosquetón.', opciones: () => [{ id: 'no', name: 'Sin dije', desc: '' }, { id: 'si', name: 'Con dije', desc: 'Lo elegís en el paso que sigue.' }] },
        { key: 'dije', label: 'Cuál', titulo: 'El dije', hint: 'Los que tenemos en el taller.', fotos: 'dije', si: (st) => st.conDije === 'si', opciones: () => D.dijes.map((o) => ({ ...o, etiqueta: 'Incluido' })) },
      ],
      describir: (st) => [st.modelo && find(opts('porta-lentes', 'modelo'), st.modelo).name, st.cuero && cueroName(st.cuero) + (st.cuero2 ? ' con ' + cueroName(st.cuero2).toLowerCase() + ' en diagonal' : ''), st.union && { hilo: 'Cosido con hilo', tiento: 'Cosido con tiento' }[st.union], st.deco && st.deco !== 'no' && nombre(DECO_LENTES, st.deco), metalTxt(st), st.conDije === 'si' && 'Dije' + (st.dije ? ' ' + nombre(D.dijes, st.dije).toLowerCase() : '')].filter(Boolean),
    },
    portafuego: {
      nombre: 'Portafuego', titulo: 'Armá tu portafuego', bajada: 'Funda de cuero para el encendedor, con mosquetón para colgar. En dos tamaños.',
      state: { tamano: null, cuero: null, deco: null, ubicacion: null, metal: null, conDije: null, dije: null, flecos: null },
      precio: (st) => { const o = find(opts('portafuego', 'tamano'), st.tamano); return o ? { min: o.price, max: o.price } : { min: 150, max: 200 }; },
      pasos: [
        { key: 'tamano', label: 'Tamaño', titulo: 'El tamaño', hint: 'Según el encendedor que uses.', opciones: () => opts('portafuego', 'tamano').map((o) => ({ ...o, desc: o.id === 'grande' ? 'Para encendedores grandes.' : 'Para encendedores chicos.', etiqueta: money(o.price) })) },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'Es el cuero de toda la funda.' },
        { key: 'deco', label: 'Decoración', titulo: 'La decoración', hint: 'En el frente de la funda.', opciones: () => DECO_PF },
        { key: 'ubicacion', label: 'Dónde', titulo: (st) => ({ estrellas: '¿Dónde van las estrellas?', remaches: '¿Dónde van los remaches?' }[st.deco] || '¿Dónde van?'), hint: 'Mirá cómo queda en la vista.', si: (st) => st.deco && st.deco !== 'no', opciones: () => UBIC_PF },
        METAL((st) => st.deco && st.deco !== 'no', (st) => st.deco === 'estrellas' || st.deco === 'estrellas-remaches'),
        { key: 'conDije', label: 'Dije', titulo: '¿Con dije?', hint: 'Un dije colgando de la argolla del mosquetón.', opciones: () => [{ id: 'no', name: 'Sin dije', desc: '' }, { id: 'si', name: 'Con dije', desc: 'Lo elegís en el paso que sigue.' }] },
        { key: 'dije', label: 'Cuál', titulo: 'El dije', hint: 'Los que tenemos en el taller.', fotos: 'dije', si: (st) => st.conDije === 'si', opciones: () => D.dijes.map((o) => ({ ...o, etiqueta: 'Incluido' })) },
        { key: 'flecos', label: 'Flecos', titulo: '¿Con flecos?', hint: 'Flecos de cuero colgando abajo.', opciones: () => [{ id: 'no', name: 'Sin flecos', desc: '' }, { id: 'si', name: 'Con flecos', desc: 'De 15 cm, en el mismo cuero.' }] },
      ],
      describir: (st) => [st.tamano && 'Tamaño ' + find(opts('portafuego', 'tamano'), st.tamano).name.toLowerCase(), st.cuero && cueroName(st.cuero), st.deco && st.deco !== 'no' && nombre(DECO_PF, st.deco) + (st.ubicacion ? ' ' + nombre(UBIC_PF, st.ubicacion).replace(/^En/, 'en') : ''), metalTxt(st), st.conDije === 'si' && 'Dije' + (st.dije ? ' ' + nombre(D.dijes, st.dije).toLowerCase() : ''), st.flecos === 'si' && 'Con flecos de 15 cm'].filter(Boolean),
    },
    llavero: {
      nombre: 'Llavero', titulo: 'Armá tu llavero', bajada: 'Elegís la forma, el cuero y si lleva tachas o estrellas.',
      state: { forma: null, cuero: null, trenzado: null, cuero2: null, deco: null, metal: null },
      precio: () => ({ min: 300, max: 300 }), notaPrecio: '[PLACEHOLDER] Confirmar si todas las formas tienen el mismo precio.',
      pasos: [
        { key: 'forma', label: 'Forma', titulo: 'La forma', hint: 'Las que ya hicimos.', opciones: () => [{ id: 'estrella', name: 'Estrella' }, { id: 'estrellas', name: 'Varias estrellas', desc: 'Tres estrellas de distintos tamaños en la misma argolla.' }, { id: 'dos-estrellas', name: 'Dos estrellas', desc: 'La chica cuelga de la grande, que cuelga del mosquetón.' }, { id: 'corazon', name: 'Corazón' }, { id: 'luna', name: 'Luna' }, { id: 'rayo', name: 'Rayo' }, { id: 'gota', name: 'Gota' }].map((o) => ({ desc: '', ...o })) },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'De los dos lados.' },
        { key: 'trenzado', label: 'Trenzado', titulo: '¿Trenzado?', hint: 'Un tiento de cuero enlazado por todo el borde.', opciones: () => [{ id: 'no', name: 'Sin trenzado', desc: '' }, { id: 'si', name: 'Trenzado', desc: 'Tiento por el borde; el color lo elegís en el paso que sigue.' }] },
        { key: 'cuero2', label: 'Tiento', tipo: 'cuero', titulo: 'El cuero del tiento', hint: 'Queda lindo en un color que contraste.', si: (st) => st.trenzado === 'si', excluir: 'cuero' },
        { key: 'deco', label: 'Decoración', titulo: 'La decoración', hint: 'Siguiendo el borde de la forma.', opciones: () => [{ id: 'no', name: 'Sin decoración', desc: 'El cuero solo.' }, { id: 'tachas', name: 'Tachas', desc: 'Tachas de metal.' }, { id: 'estrellas', name: 'Estrellas', desc: 'Estrellas de metal.' }] },
        METAL((st) => st.deco === 'tachas' || st.deco === 'estrellas', (st) => st.deco === 'estrellas'),
      ],
      describir: (st) => [st.forma && ({ estrellas: 'Varias estrellas', 'dos-estrellas': 'Dos estrellas' }[st.forma] || 'Forma ' + st.forma.replace('corazon', 'corazón')), st.cuero && cueroName(st.cuero), st.trenzado === 'si' && 'Trenzado' + (st.cuero2 ? ' con tiento ' + cueroName(st.cuero2).toLowerCase() : ''), st.deco === 'tachas' && 'Con tachas', st.deco === 'estrellas' && 'Con estrellas', metalTxt(st)].filter(Boolean),
    },
    pulsera: {
      nombre: 'Pulsera', titulo: 'Armá tu pulsera', bajada: 'Lisa o con tiento trenzado por los bordes, con tachas, estrellas o las dos.',
      state: { modelo: null, ancho: null, cuero: null, cuero2: null, deco: null, cantidad: null, metal: null },
      precio: (st) => { const o = find(opts('pulsera', 'ancho'), st.ancho); return o ? { min: o.price, max: o.price } : { min: 250, max: 350 }; }, notaPrecio: NOTA_TACHAS,
      pasos: [
        { key: 'modelo', label: 'Modelo', titulo: '¿Lisa o trenzada?', hint: 'La trenzada lleva un tiento de cuero enlazado por los dos bordes.', opciones: () => [
          { id: 'lisa', name: 'Lisa', desc: 'Tira de cuero con broche.', etiqueta: 'Desde ' + money(250) },
          { id: 'trenzada', name: 'Trenzada', desc: 'Con tiento por los bordes.', etiqueta: 'Desde ' + money(250) }] },
        { key: 'ancho', label: 'Ancho', titulo: 'El ancho', hint: 'El precio cambia según el ancho.', opciones: () => opts('pulsera', 'ancho').map((o) => ({ ...o, desc: { '1-3': 'Fina.', intermedia: 'Ni fina ni ancha.', 5: 'Ancha, tipo puño.' }[o.id] || '', etiqueta: money(o.price) })) },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'Es el cuero de toda la pulsera.' },
        { key: 'cuero2', label: 'Tiento', tipo: 'cuero', titulo: 'El cuero del tiento', hint: 'Queda lindo en un color que contraste.', si: (st) => st.modelo === 'trenzada', excluir: 'cuero' },
        { key: 'deco', label: 'Decoración', titulo: 'La decoración', hint: 'De metal, o un sol cosido.', opciones: (st) => DECO_METAL.concat(st.modelo === 'lisa' && st.ancho && st.ancho !== '1-3' ? [{ id: 'sol', name: 'Un sol cosido', desc: 'Bordado con hilo, adelante.' }] : [], [{ id: 'azar', name: 'Estrellas y tachas sueltas', desc: 'Al azar, en toda la pulsera.' }]) },
        { key: 'cantidad', label: 'Cantidad', titulo: '¿Cuántas?', hint: 'Siempre ubicadas en forma pareja.', si: (st) => ['tachas', 'estrellas', 'estrellas-tachas'].includes(st.deco), opciones: () => CANTIDAD },
        METAL((st) => ['tachas', 'estrellas', 'estrellas-tachas', 'azar'].includes(st.deco), (st) => ['estrellas', 'estrellas-tachas', 'azar'].includes(st.deco)),
      ],
      describir: (st) => [st.modelo === 'trenzada' && 'Trenzada' + (st.cuero2 ? ' con tiento ' + cueroName(st.cuero2).toLowerCase() : ''), st.ancho && 'Ancho ' + find(opts('pulsera', 'ancho'), st.ancho).name.toLowerCase(), st.cuero && cueroName(st.cuero), st.deco && st.deco !== 'no' && ({ sol: 'Un sol cosido', azar: 'Estrellas y tachas sueltas' }[st.deco] || nombre(DECO_METAL, st.deco) + (st.cantidad ? ': ' + nombre(CANTIDAD, st.cantidad).toLowerCase() : '')), metalTxt(st)].filter(Boolean),
    },
    collar: {
      nombre: 'Collar', titulo: 'Armá tu collar', bajada: 'Fino o más grueso, con trenzado y decoración a elección, atado con cordón.',
      state: { ancho: null, cuero: null, trenzado: null, cuero2: null, deco: null, cantidad: null, metal: null },
      precio: (st) => { const a = find(opts('collar', 'ancho'), st.ancho), si = find(opts('collar', 'deco'), 'si'), con = st.deco && st.deco !== 'no'; return { min: (a ? a.price : 350) + (con ? si.price : 0), max: (a ? a.price : 450) + (con ? si.max : 0) }; },
      pasos: [
        { key: 'ancho', label: 'Ancho', titulo: 'El ancho', hint: 'El precio cambia según el ancho.', opciones: () => opts('collar', 'ancho').map((o) => ({ ...o, desc: o.id === 'grueso' ? 'Más ancho, tipo gargantilla.' : 'Fino, 1,3 cm.', etiqueta: money(o.price) })) },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'Es el cuero de todo el collar.' },
        { key: 'trenzado', label: 'Trenzado', titulo: '¿Con trenzado?', hint: 'Un tiento de cuero que se cruza sobre el collar.', opciones: () => [
          { id: 'no', name: 'Sin trenzado', desc: 'El cuero solo.' }, { id: 'uno', name: 'De un lado', desc: 'El tiento pasa por un solo borde.' }, { id: 'ambos', name: 'De los dos lados', desc: 'El tiento cruza de borde a borde, en V.' }] },
        { key: 'cuero2', label: 'Tiento', tipo: 'cuero', titulo: 'El cuero del tiento', hint: 'Queda lindo en un color que contraste.', si: (st) => st.trenzado === 'uno' || st.trenzado === 'ambos', excluir: 'cuero' },
        { key: 'deco', label: 'Decoración', titulo: 'La decoración', hint: 'De metal.', opciones: () => DECO_METAL.map((o) => ({ ...o, etiqueta: o.id === 'no' ? 'Incluido' : '+' + money(50) + ' a ' + money(100) })) },
        { key: 'cantidad', label: 'Cantidad', titulo: '¿Cuántas?', hint: 'Siempre ubicadas en forma pareja.', si: (st) => st.deco && st.deco !== 'no', opciones: () => CANTIDAD_COLLAR },
        METAL((st) => st.deco && st.deco !== 'no', (st) => st.deco === 'estrellas' || st.deco === 'estrellas-tachas'),
      ],
      describir: (st) => [st.ancho && 'Ancho ' + find(opts('collar', 'ancho'), st.ancho).name.toLowerCase(), st.cuero && cueroName(st.cuero), st.trenzado === 'uno' && 'Trenzado de un lado' + (st.cuero2 ? ' en ' + cueroName(st.cuero2).toLowerCase() : ''), st.trenzado === 'ambos' && 'Trenzado de los dos lados' + (st.cuero2 ? ' en ' + cueroName(st.cuero2).toLowerCase() : ''), st.deco && st.deco !== 'no' && nombre(DECO_METAL, st.deco) + (st.cantidad ? ': ' + nombre(CANTIDAD_COLLAR, st.cantidad).toLowerCase() : ''), metalTxt(st)].filter(Boolean),
    },
  };

  const qs = new URLSearchParams(location.search);
  const pid = PIEZAS[qs.get('p')] ? qs.get('p') : 'cinto';
  const P = PIEZAS[pid];
  const state = Object.assign({ step: 0, nota: '' }, JSON.parse(JSON.stringify(P.state)));
  if (pid === 'cinto' && find(D.tipos, qs.get('tipo'))) { state.tipo = qs.get('tipo'); state.step = 1; }

  // textos de la página
  document.title = `${P.titulo} · Decora.te`;
  $('[data-arma-title]').textContent = P.titulo;
  $('[data-arma-lead]').textContent = P.bajada;
  const otros = $('[data-arma-otros]');
  if (otros) otros.innerHTML = Object.entries(PIEZAS).map(([id, x]) => `<a href="arma.html?p=${id}" ${id === pid ? 'aria-current="page"' : ''}>${esc(x.nombre)}</a>`).join('');

  const pasos = () => P.pasos.filter((p) => !p.si || p.si(state)).concat([{ key: 'pedido', label: 'Listo' }]);
  const el = {
    steps: $('[data-steps]'), body: $('[data-step-body]'), caption: $('[data-stage-caption]'),
    stage: $('[data-stage]'), totals: $$('[data-total]'), prev: $('[data-prev]'), next: $('[data-next]'), nextBar: $('[data-next-bar]'), prevBar: $('[data-prev-bar]'),
  };
  const view = window.DT3D ? window.DT3D.create($('[data-draw]')) : null;

  const priceText = () => { const p = P.precio(state); return S.range(p.min, p.max); };
  const ready = (p) => (p.key === 'pedido' ? true : p.tipo === 'cueros' ? state.cueros.length > 0 : !!state[p.key]);
  const maxReachable = () => { const L = pasos(); let i = 0; while (i < L.length - 1 && ready(L[i])) i++; return i; };

  function renderDraw() {
    if (view) view.update(pid, state);
    const d = P.describir(state);
    el.caption.textContent = d.length ? d.join(' · ') : 'Arrastrá para girarlo';
  }
  function renderSteps() {
    const L = pasos(), reach = maxReachable();
    el.steps.innerHTML = L.map((s, i) => {
      const cls = [i === state.step ? 'is-current' : '', i !== state.step && ready(s) && i <= reach ? 'is-done' : ''].join(' ');
      return `<li><button type="button" class="${cls}" data-goto="${i}" ${i > reach ? 'disabled' : ''} ${i === state.step ? 'aria-current="step"' : ''}><span>${String(i + 1).padStart(2, '0')}</span>${s.label}</button></li>`;
    }).join('');
  }
  const optRow = (key, o) => `
    <button type="button" class="opt opt--plain" data-group="${key}" data-id="${o.id}" aria-pressed="${state[key] === o.id}">
      <span class="opt__name">${esc(o.name)}${o.desc ? `<span class="opt__desc">${esc(o.desc)}</span>` : ''}</span>
      <span class="opt__price">${o.etiqueta || 'Incluido'}</span>
    </button>`;
  const swatch = (key, c, sel, badge) => `<button type="button" class="swatch" data-group="${key}" data-id="${c.id}" aria-pressed="${sel}" title="${esc(c.name)}" aria-label="${esc(c.name)}"><span class="swatch__img"><img src="img/cuero-${c.id}-sm.jpg" alt="" loading="lazy" width="160" height="160"><span class="swatch__badge">${badge}</span></span></button>`;
  const hebillaCard = (key, o, pre = 'hebilla') => `<button type="button" class="hcard" data-group="${key}" data-id="${o.id}" aria-pressed="${state[key] === o.id}"><span class="hcard__img"><img src="img/${pre}-${o.id}.png?v=5" alt="" loading="lazy" width="300" height="300"></span><span class="hcard__name">${esc(o.name)}</span><span class="hcard__price">${o.etiqueta}</span></button>`;
  const elegido = () => { const p = pasos()[state.step]; if (!p) return ''; if (p.tipo === 'cueros') return state.cueros.map(cueroName).join(' + '); if (p.tipo === 'cuero') return cueroName(state[p.key]); return ''; };
  const selLine = () => `<p class="step__sel" data-sel>${elegido() ? 'Elegiste: <b>' + esc(elegido()) + '</b>' : 'Tocá una muestra para verla en la pieza.'}</p>`;

  const detailList = () => P.describir(state).concat(state.nota.trim() ? [`Nota: ${state.nota.trim()}`] : []);
  const waText = () => [`*Pedido a medida: ${P.nombre.toLowerCase()}*`, '', ...detailList().map((x) => '- ' + x), '', `*Total estimado: ${priceText()}*`].join('\n');

  function renderBody() {
    const p = pasos()[state.step];
    let h = '';
    if (p.tipo === 'cueros') {
      h = `<h2 class="step__title">${typeof p.titulo === 'function' ? p.titulo(state) : p.titulo}</h2><p class="step__hint">${typeof p.hint === 'function' ? p.hint(state) : p.hint}</p>
        <div class="swatches">${D.cueros.map((c) => { const k = state.cueros.indexOf(c.id); return swatch('cueros', c, k > -1, k > -1 ? k + 1 : ''); }).join('')}</div>
        ${selLine()}<p class="step__msg" data-msg aria-live="polite"></p>`;
    } else if (p.tipo === 'cuero') {
      const lista = D.cueros.filter((c) => !p.excluir || c.id !== state[p.excluir]);
      h = `<h2 class="step__title">${typeof p.titulo === 'function' ? p.titulo(state) : p.titulo}</h2><p class="step__hint">${typeof p.hint === 'function' ? p.hint(state) : p.hint}</p>
        <div class="swatches">${lista.map((c) => swatch(p.key, c, state[p.key] === c.id, state[p.key] === c.id ? '✓' : '')).join('')}</div>
        ${selLine()}`;
    } else if (p.fotos) {
      h = `<h2 class="step__title">${typeof p.titulo === 'function' ? p.titulo(state) : p.titulo}</h2><p class="step__hint">${typeof p.hint === 'function' ? p.hint(state) : p.hint}</p>
        <div class="hcards">${p.opciones(state).map((o) => hebillaCard(p.key, o, p.fotos)).join('')}</div>`;
    } else if (p.opciones) {
      h = `<h2 class="step__title">${typeof p.titulo === 'function' ? p.titulo(state) : p.titulo}</h2><p class="step__hint">${typeof p.hint === 'function' ? p.hint(state) : p.hint}</p>
        <div class="opts">${p.opciones(state).map((o) => optRow(p.key, o)).join('')}</div>`;
    } else {
      const filas = P.pasos.filter((x) => !x.si || x.si(state)).map((x) => {
        const v = x.tipo === 'cueros' ? state.cueros.map(cueroName).join(', ') : x.tipo === 'cuero' ? cueroName(state[x.key]) : ((x.opciones(state).find((o) => o.id === state[x.key]) || {}).name || '');
        return `<li><span>${x.label}</span><span>${esc(v)}</span></li>`;
      }).join('');
      const nota = [P.notaPrecio, P.nota && P.nota(state)].filter(Boolean);
      h = `<h2 class="step__title">Tu ${P.nombre.toLowerCase()}</h2><p class="step__hint">Sumalo al carrito con el resto de tu pedido, o mandalo solo por WhatsApp.</p>
        <ul class="summary">${filas}<li><span>Total estimado</span><span><strong>${priceText()}</strong></span></li></ul>
        ${nota.map((n) => (n.startsWith('[') ? `<p class="step__note"><span class="placeholder">${esc(n)}</span></p>` : `<p class="step__hint">${esc(n)}</p>`)).join('')}
        <div class="fields">
          ${(P.campos || []).map((c) => `<div class="field"><label for="b-${c.key}">${c.label}</label><input id="b-${c.key}" data-field="${c.key}" ${c.num ? 'inputmode="numeric"' : ''} value="${esc(state[c.key])}"></div>`).join('')}
          <div class="field field--wide"><label for="b-nota">Comentarios (opcional)</label><textarea id="b-nota" data-field="nota" rows="2">${esc(state.nota)}</textarea></div>
        </div>
        <div class="actions">
          <button type="button" class="btn btn--wide" data-add>Agregar al carrito</button>
          <a class="btn btn--ghost btn--wide" data-send href="#" target="_blank" rel="noopener">Pedir solo este por WhatsApp</a>
        </div>
        <p class="added" data-added aria-live="polite"></p>
        <p class="send-note">Trabajamos con 72 horas de anticipación. Pagás en efectivo o por transferencia bancaria.</p>`;
    }
    el.body.innerHTML = `<div class="step__in">${h}</div>`;
    const send = $('[data-send]');
    if (send) send.href = S.wa(waText());
  }
  function renderNav() {
    const L = pasos(), last = state.step === L.length - 1;
    el.prev.disabled = state.step === 0;
    el.next.disabled = !ready(L[state.step]);
    el.next.style.visibility = last ? 'hidden' : '';
    el.nextBar.textContent = last ? 'Agregar al carrito' : 'Siguiente';
    el.nextBar.disabled = !last && !ready(L[state.step]);
    el.prevBar.disabled = state.step === 0;
    el.totals.forEach((t) => { t.textContent = priceText(); });
  }
  function render(full = true) { renderDraw(); renderSteps(); if (full) renderBody(); renderNav(); }

  // al volver atrás se borra lo que se había elegido en los pasos de adelante
  function limpiarDesde(i) {
    pasos().slice(i + 1).forEach((p) => { if (p.key === 'pedido') return; if (p.tipo === 'cueros') state.cueros = []; else state[p.key] = P.state[p.key] === '' ? '' : null; });
    // pasos que dejan de existir (por ejemplo, la unión si ahora es un solo cuero)
    P.pasos.forEach((p) => { if (p.si && !p.si(state) && p.tipo !== 'cueros') state[p.key] = null; });
  }
  function goStep(i) {
    if (i < 0 || i > pasos().length - 1 || i > maxReachable()) return;
    if (i < state.step) limpiarDesde(i);
    state.step = i;
    render();
    // la página no se mueve; solo si el paso quedó arriba, fuera de la vista, se sube hasta él
    const panel = $('.builder__panel');
    const offset = window.innerWidth < 900 ? el.stage.offsetHeight + 20 : 120;
    if (panel.getBoundingClientRect().top < offset - 40) S.scrollToEl(panel, -offset);
  }
  function addToCart() {
    const p = P.precio(state);
    S.Cart.add({
      key: pid + '|' + JSON.stringify(state),
      kind: pid === 'cinto' ? 'cinto' : 'pieza', name: pid === 'cinto' ? (state.tipo === 'decorativo' ? 'Faja a medida' : 'Cinto funcional a medida') : `${P.nombre} a medida`,
      detail: detailList(), min: p.min, max: p.max, swatch: state.cuero || (state.cueros || [])[0], foto: null, img3d: view && view.snapshot ? view.snapshot(400) : null,
    });
    const msg = $('[data-added]');
    if (msg) msg.textContent = 'Agregado al carrito.';
    S.openDrawer();
  }

  builder.addEventListener('click', (e) => {
    const go = e.target.closest('[data-goto]');
    if (go) { goStep(+go.dataset.goto); return; }
    if (e.target.closest('[data-add]')) { addToCart(); return; }
    const opt = e.target.closest('[data-group]');
    if (!opt) return;
    const { group, id } = opt.dataset;
    if (group === 'cueros') {
      const k = state.cueros.indexOf(id), msg = $('[data-msg]');
      if (k > -1) state.cueros.splice(k, 1);
      else if (state.cueros.length >= D.maxCueros) { if (msg) msg.textContent = `Podés elegir hasta ${D.maxCueros} cueros. Sacá uno para cambiarlo.`; return; }
      else state.cueros.push(id);
      if (msg) msg.textContent = '';
      if (state.union === 'ninguna' && state.cueros.length > 1) state.union = null;
      $$('.swatch').forEach((s) => { const p = state.cueros.indexOf(s.dataset.id); s.setAttribute('aria-pressed', p > -1); $('.swatch__badge', s).textContent = p > -1 ? p + 1 : ''; });
      const sl = $('[data-sel]'); if (sl) sl.outerHTML = selLine();
      render(false);
      return;
    }
    state[group] = id;
    if (group === 'detalle' && id === 'no') state.cuero2 = null;
    if (group === 'cuero' && state.cuero2 === id) state.cuero2 = null;
    $$(`[data-group="${group}"]`).forEach((o) => { o.setAttribute('aria-pressed', o.dataset.id === id); const b = o.querySelector('.swatch__badge'); if (b) b.textContent = o.dataset.id === id ? '✓' : ''; });
    const sl = $('[data-sel]'); if (sl) sl.outerHTML = selLine();
    // si cambia algo que muestra u oculta pasos (tipo, combinación), se limpian los de adelante
    if (['tipo', 'combo', 'detalle', 'modelo', 'union', 'deco', 'tachas', 'trenzado', 'cierre', 'conDije', 'ancho'].includes(group)) limpiarDesde(state.step);
    render(false);
  });
  builder.addEventListener('input', (e) => {
    const f = e.target.dataset.field;
    if (!f) return;
    state[f] = e.target.value;
    const send = $('[data-send]');
    if (send) send.href = S.wa(waText());
  });
  el.prev.addEventListener('click', () => goStep(state.step - 1));
  el.next.addEventListener('click', () => goStep(state.step + 1));
  el.nextBar.addEventListener('click', () => (state.step === pasos().length - 1 ? addToCart() : goStep(state.step + 1)));
  el.prevBar.addEventListener('click', () => goStep(state.step - 1));

  render(true);

  // guía "¿Cómo se usa?": abierta la primera vez que alguien entra; después queda cerrada
  const guia = document.querySelector('[data-guia]');
  if (guia) {
    const txt = guia.querySelector('[data-guia-txt]'), KEY = 'decorate-guia-vista';
    let vista = false; try { vista = localStorage.getItem(KEY) === '1'; } catch (e) { /* sin almacenamiento */ }
    guia.open = !vista;
    const marcar = () => { txt.textContent = guia.open ? 'Cerrar' : 'Ver'; };
    marcar();
    guia.addEventListener('toggle', () => { marcar(); if (!guia.open) { try { localStorage.setItem(KEY, '1'); } catch (e) { /* nada */ } } });
    // al elegir la primera opción, se da por vista
    builder.addEventListener('click', (e) => { if (e.target.closest('[data-group]')) { try { localStorage.setItem(KEY, '1'); } catch (er) { /* nada */ } } });
  }

  // la barra con Atrás, el total y Siguiente queda siempre fija abajo
})();
