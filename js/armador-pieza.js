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

  /* ----- cada pieza: pasos, opciones y precio ----- */
  const PIEZAS = {
    cinto: {
      nombre: 'Cinto', titulo: 'Armá tu cinto', bajada: 'Elegís el tipo, la forma, cómo se combinan los cueros, la hebilla y el detalle final. Lo ves con el cuero real y sabés cuánto sale antes de pedirlo.',
      state: { tipo: null, forma: null, cuero: null, combo: null, cuero2: null, cuero3: null, hebilla: null, union: null, deco: null, cintura: '' },
      precio: (st) => { const t = find(D.tipos, st.tipo); if (!t) return { min: D.tipos[0].min, max: D.tipos[1].max }; let x = 0; [[D.hebillas, st.hebilla], [D.uniones, st.union], [D.deco, st.deco]].forEach(([l, id]) => { const o = find(l, id); if (o) x += o.price; }); return { min: t.min + x, max: t.max + x }; },
      pasos: [
        { key: 'tipo', label: 'Tipo', titulo: '¿Qué cinto buscás?', hint: 'El funcional ajusta el pantalón; la faja es ancha y va sobre la ropa.', opciones: () => D.tipos.map((t) => ({ ...t, name: t.id === 'decorativo' ? 'Faja (decorativo)' : t.name, etiqueta: S.range(t.min, t.max) })) },
        { key: 'forma', label: 'Forma', titulo: 'La forma', hint: 'Las mismas formas de las fajas que ya hicimos.', si: (st) => st.tipo === 'decorativo', opciones: () => [
          { id: 'recta', name: 'Recta', desc: 'Pareja adelante y se angosta hacia atrás.' },
          { id: 'asimetrica', name: 'Asimétrica', desc: 'Un costado sube más ancho.' },
          { id: 'mono', name: 'Moño', desc: 'Angosta al medio, con la hebilla, y ancha a los costados.' }] },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'El cuero principal', hint: 'Es el del centro, donde va la hebilla.' },
        { key: 'combo', label: 'Combinación', titulo: '¿Lo combinamos con otro cuero?', hint: 'Así se combinan los cueros en nuestras fajas.', si: (st) => st.tipo === 'decorativo', opciones: () => [
          { id: 'solo', name: 'Un solo cuero', desc: 'Toda la faja en el cuero principal.' },
          { id: 'costados', name: 'Con los costados en otro cuero', desc: 'El centro en el principal y los costados en otro, con cortes en diagonal.' },
          { id: 'detalle', name: 'Costados y un detalle', desc: 'Además, una franja cruzada al lado de la hebilla en un tercer cuero.' }] },
        { key: 'cuero2', label: 'Costados', tipo: 'cuero', titulo: 'El cuero de los costados', hint: 'Elegí uno que contraste con el principal.', si: (st) => st.combo === 'costados' || st.combo === 'detalle', excluir: 'cuero' },
        { key: 'cuero3', label: 'Detalle', tipo: 'cuero', titulo: 'El cuero del detalle', hint: 'La franja cruzada al lado de la hebilla.', si: (st) => st.combo === 'detalle', excluir: 'cuero' },
        { key: 'hebilla', label: 'Hebilla', titulo: 'La hebilla', hint: 'Las que tenemos en el taller. Las de marco suman $50 y las rellenas $150.', fotos: true, opciones: () => D.hebillas.map((o) => ({ ...o, etiqueta: plus(o.price) })) },
        { key: 'union', label: 'Unión', titulo: 'La unión', hint: 'Cómo se unen los cueros en los cortes.', si: (st) => st.combo === 'costados' || st.combo === 'detalle', opciones: () => D.uniones.filter((o) => !o.onlySingle).map((o) => ({ ...o, etiqueta: plus(o.price) })) },
        { key: 'deco', label: 'Terminación', titulo: 'El detalle final', hint: 'Opcional.', opciones: () => D.deco.map((o) => ({ ...o, etiqueta: plus(o.price) })) },
      ],
      campos: [{ key: 'cintura', label: 'Cintura en cm (opcional)', num: true }],
      describir: (st) => [
        find(D.tipos, st.tipo) && (st.tipo === 'decorativo' ? 'Faja' + (st.forma ? ' ' + { recta: 'recta', asimetrica: 'asimétrica', mono: 'moño' }[st.forma] : '') : 'Cinto funcional'),
        st.cuero && cueroName(st.cuero) + (st.cuero2 ? ', costados en ' + cueroName(st.cuero2).toLowerCase() : '') + (st.cuero3 ? ', detalle en ' + cueroName(st.cuero3).toLowerCase() : ''),
        find(D.hebillas, st.hebilla) && 'Hebilla ' + find(D.hebillas, st.hebilla).name.toLowerCase(),
        st.union && st.union !== 'ninguna' && 'Unión ' + find(D.uniones, st.union).name.toLowerCase(),
        st.deco === 'si' && 'Con decoración', st.cintura.trim() && `Cintura ${st.cintura.trim()} cm`].filter(Boolean),
      nota: (st) => (st.tipo === 'funcional' ? 'En el cinto funcional, el precio final depende del cuero.' : ''),
    },
    tarjetero: {
      nombre: 'Tarjetero', titulo: 'Armá tu tarjetero', bajada: 'Elegís el cuero, el detalle y si lleva tachas. Lo ves con el cuero real y sabés cuánto sale antes de pedirlo.',
      state: { cuero: null, detalle: null, cuero2: null, tachas: null },
      precio: () => ({ min: 650, max: 650 }), notaPrecio: '[PLACEHOLDER] Confirmar si el detalle o las tachas cambian el precio.',
      pasos: [
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'Es el cuero de todo el tarjetero.' },
        { key: 'detalle', label: 'Detalle', titulo: 'El detalle', hint: 'Una franja o una V en otro cuero, o liso.', opciones: () => [{ id: 'no', name: 'Liso', desc: 'Un solo cuero, con la media luna para sacar las tarjetas.' }, { id: 'franja', name: 'Franja', desc: 'Una franja recta en otro cuero.' }, { id: 'v', name: 'V', desc: 'Una V en otro cuero.' }] },
        { key: 'cuero2', label: 'Cuero del detalle', tipo: 'cuero', titulo: 'El cuero del detalle', hint: 'Elegí uno distinto para que se note.', si: (st) => st.detalle && st.detalle !== 'no', excluir: 'cuero' },
        { key: 'tachas', label: 'Tachas', titulo: '¿Con tachas?', hint: 'Por los costados y abajo del bolsillo.', opciones: () => TACHAS },
      ],
      describir: (st) => [st.cuero && cueroName(st.cuero), st.detalle === 'franja' && 'Franja' + (st.cuero2 ? ' en ' + cueroName(st.cuero2).toLowerCase() : ''), st.detalle === 'v' && 'V' + (st.cuero2 ? ' en ' + cueroName(st.cuero2).toLowerCase() : ''), st.tachas === 'si' && 'Con tachas'].filter(Boolean),
    },
    'porta-lentes': {
      nombre: 'Estuche de lentes', titulo: 'Armá tu estuche de lentes', bajada: 'Con o sin tapa, en el cuero que elijas, con mosquetón para colgar.',
      state: { modelo: null, cuero: null, tachas: null },
      precio: (st) => { const o = find(opts('porta-lentes', 'modelo'), st.modelo); return o ? { min: o.price, max: o.price } : { min: 550, max: 650 }; }, notaPrecio: NOTA_TACHAS,
      pasos: [
        { key: 'modelo', label: 'Modelo', titulo: '¿Con o sin tapa?', hint: 'La tapa cierra con un broche.', opciones: () => opts('porta-lentes', 'modelo').map((o) => ({ ...o, desc: o.id === 'con-tapa' ? 'Tapa que cubre la boca del estuche.' : 'Abierto arriba, el lente entra y sale fácil.', etiqueta: money(o.price) })) },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'Es el cuero de todo el estuche.' },
        { key: 'tachas', label: 'Tachas', titulo: '¿Con tachas?', hint: 'Por los costados y abajo.', opciones: () => TACHAS },
      ],
      describir: (st) => [st.modelo && find(opts('porta-lentes', 'modelo'), st.modelo).name, st.cuero && cueroName(st.cuero), st.tachas === 'si' && 'Con tachas'].filter(Boolean),
    },
    portafuego: {
      nombre: 'Portafuego', titulo: 'Armá tu portafuego', bajada: 'Funda de cuero para el encendedor, con mosquetón para colgar. En dos tamaños.',
      state: { tamano: null, cuero: null, tachas: null },
      precio: (st) => { const o = find(opts('portafuego', 'tamano'), st.tamano); return o ? { min: o.price, max: o.price } : { min: 150, max: 200 }; }, notaPrecio: NOTA_TACHAS,
      pasos: [
        { key: 'tamano', label: 'Tamaño', titulo: 'El tamaño', hint: 'Según el encendedor que uses.', opciones: () => opts('portafuego', 'tamano').map((o) => ({ ...o, desc: o.id === 'grande' ? 'Para encendedores grandes.' : 'Para encendedores chicos.', etiqueta: money(o.price) })) },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'Es el cuero de toda la funda.' },
        { key: 'tachas', label: 'Tachas', titulo: '¿Con tachas?', hint: 'Por un costado y abajo.', opciones: () => TACHAS },
      ],
      describir: (st) => [st.tamano && 'Tamaño ' + find(opts('portafuego', 'tamano'), st.tamano).name.toLowerCase(), st.cuero && cueroName(st.cuero), st.tachas === 'si' && 'Con tachas'].filter(Boolean),
    },
    llavero: {
      nombre: 'Llavero', titulo: 'Armá tu llavero', bajada: 'Elegís la forma, el cuero y si lleva tachas.',
      state: { forma: null, cuero: null, tachas: null },
      precio: () => ({ min: 300, max: 300 }), notaPrecio: '[PLACEHOLDER] Confirmar si todas las formas tienen el mismo precio.',
      pasos: [
        { key: 'forma', label: 'Forma', titulo: 'La forma', hint: 'Las que ya hicimos.', opciones: () => [{ id: 'estrella', name: 'Estrella' }, { id: 'corazon', name: 'Corazón' }, { id: 'luna', name: 'Luna' }, { id: 'rayo', name: 'Rayo' }, { id: 'gota', name: 'Gota' }].map((o) => ({ ...o, desc: '' })) },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'De los dos lados.' },
        { key: 'tachas', label: 'Tachas', titulo: '¿Con tachas?', hint: 'Siguiendo el borde de la forma.', opciones: () => TACHAS },
      ],
      describir: (st) => [st.forma && 'Forma ' + st.forma.replace('corazon', 'corazón'), st.cuero && cueroName(st.cuero), st.tachas === 'si' && 'Con tachas'].filter(Boolean),
    },
    pulsera: {
      nombre: 'Pulsera', titulo: 'Armá tu pulsera', bajada: 'Tres anchos, de la más fina a la de 5 cm, con broche.',
      state: { ancho: null, cuero: null, tachas: null },
      precio: (st) => { const o = find(opts('pulsera', 'ancho'), st.ancho); return o ? { min: o.price, max: o.price } : { min: 250, max: 350 }; }, notaPrecio: NOTA_TACHAS,
      pasos: [
        { key: 'ancho', label: 'Ancho', titulo: 'El ancho', hint: 'El precio cambia según el ancho.', opciones: () => opts('pulsera', 'ancho').map((o) => ({ ...o, desc: { '1-3': 'Fina.', intermedia: 'Ni fina ni ancha.', 5: 'Ancha, tipo puño.' }[o.id] || '', etiqueta: money(o.price) })) },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'Es el cuero de toda la pulsera.' },
        { key: 'tachas', label: 'Tachas', titulo: '¿Con tachas?', hint: 'Una o dos filas, según el ancho.', opciones: () => TACHAS },
      ],
      describir: (st) => [st.ancho && 'Ancho ' + find(opts('pulsera', 'ancho'), st.ancho).name.toLowerCase(), st.cuero && cueroName(st.cuero), st.tachas === 'si' && 'Con tachas'].filter(Boolean),
    },
    collar: {
      nombre: 'Collar', titulo: 'Armá tu collar', bajada: 'Fino o más grueso, con o sin decoración, atado con cordón.',
      state: { ancho: null, cuero: null, deco: null },
      precio: (st) => { const a = find(opts('collar', 'ancho'), st.ancho), d = find(opts('collar', 'deco'), st.deco); const b = a ? a.price : 350; return { min: b + (d ? d.price : 0), max: (a ? a.price : 450) + (d ? (d.max != null ? d.max : d.price) : 0) }; },
      pasos: [
        { key: 'ancho', label: 'Ancho', titulo: 'El ancho', hint: 'El precio cambia según el ancho.', opciones: () => opts('collar', 'ancho').map((o) => ({ ...o, desc: o.id === 'grueso' ? 'Más ancho, tipo gargantilla.' : 'Fino, 1,3 cm.', etiqueta: money(o.price) })) },
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'Es el cuero de todo el collar.' },
        { key: 'deco', label: 'Decoración', titulo: 'La decoración', hint: 'Tachas de metal adelante.', opciones: () => opts('collar', 'deco').map((o) => ({ ...o, desc: o.price ? 'Tachas de metal adelante.' : 'El cuero solo, con el pespunte.', etiqueta: o.note || plus(o.price) })) },
      ],
      describir: (st) => [st.ancho && 'Ancho ' + find(opts('collar', 'ancho'), st.ancho).name.toLowerCase(), st.cuero && cueroName(st.cuero), st.deco === 'si' && 'Con decoración'].filter(Boolean),
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
  const hebillaCard = (key, o) => `<button type="button" class="hcard" data-group="${key}" data-id="${o.id}" aria-pressed="${state[key] === o.id}"><span class="hcard__img"><img src="img/hebilla-${o.id}.jpg" alt="" loading="lazy" width="400" height="400"></span><span class="hcard__name">${esc(o.name)}</span><span class="hcard__price">${o.etiqueta}</span></button>`;
  const elegido = () => { const p = pasos()[state.step]; if (!p) return ''; if (p.tipo === 'cueros') return state.cueros.map(cueroName).join(' + '); if (p.tipo === 'cuero') return cueroName(state[p.key]); return ''; };
  const selLine = () => `<p class="step__sel" data-sel>${elegido() ? 'Elegiste: <b>' + esc(elegido()) + '</b>' : 'Tocá una muestra para verla en la pieza.'}</p>`;

  const detailList = () => P.describir(state).concat(state.nota.trim() ? [`Nota: ${state.nota.trim()}`] : []);
  const waText = () => [`*Pedido a medida: ${P.nombre.toLowerCase()}*`, '', ...detailList().map((x) => '- ' + x), '', `*Total estimado: ${priceText()}*`].join('\n');

  function renderBody() {
    const p = pasos()[state.step];
    let h = '';
    if (p.tipo === 'cueros') {
      h = `<h2 class="step__title">${p.titulo}</h2><p class="step__hint">${p.hint}</p>
        <div class="swatches">${D.cueros.map((c) => { const k = state.cueros.indexOf(c.id); return swatch('cueros', c, k > -1, k > -1 ? k + 1 : ''); }).join('')}</div>
        ${selLine()}<p class="step__msg" data-msg aria-live="polite"></p>`;
    } else if (p.tipo === 'cuero') {
      const lista = D.cueros.filter((c) => !p.excluir || c.id !== state[p.excluir]);
      h = `<h2 class="step__title">${p.titulo}</h2><p class="step__hint">${p.hint}</p>
        <div class="swatches">${lista.map((c) => swatch(p.key, c, state[p.key] === c.id, state[p.key] === c.id ? '✓' : '')).join('')}</div>
        ${selLine()}`;
    } else if (p.fotos) {
      h = `<h2 class="step__title">${p.titulo}</h2><p class="step__hint">${p.hint}</p>
        <div class="hcards">${p.opciones(state).map((o) => hebillaCard(p.key, o)).join('')}</div>`;
    } else if (p.opciones) {
      h = `<h2 class="step__title">${p.titulo}</h2><p class="step__hint">${p.hint}</p>
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
    if (['tipo', 'combo', 'detalle'].includes(group)) limpiarDesde(state.step);
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

  // la barra con Atrás, el total y Siguiente queda siempre fija abajo
})();
