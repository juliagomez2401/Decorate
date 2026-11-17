/* =========================================================
   Decora.te — Armá tu pieza (tarjetero, y después el resto)
   Mismo recorrido que el cinto: pasos, dibujo en vivo con el
   cuero real, precio y pedido (carrito o WhatsApp).
   La página indica qué pieza arma con <section data-pieza="…">.
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
  const find = (list, id) => list.find((x) => x.id === id);
  const cueroName = (id) => (find(D.cueros, id) || {}).name || '';

  const ICON = {
    detalle: {
      no: '<svg viewBox="0 0 56 44"><rect x="8" y="8" width="40" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
      franja: '<svg viewBox="0 0 56 44"><rect x="8" y="8" width="40" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="8" y="16" width="40" height="7" fill="currentColor" opacity=".55"/></svg>',
      v: '<svg viewBox="0 0 56 44"><rect x="8" y="8" width="40" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M14 8l14 14 14-14h-6l-8 8-8-8z" fill="currentColor" opacity=".55"/></svg>',
    },
    tachas: {
      no: '<svg viewBox="0 0 56 44"><rect x="8" y="8" width="40" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
      si: '<svg viewBox="0 0 56 44"><rect x="8" y="8" width="40" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="1.2"/>' + [14, 21, 28, 35, 42].map((x) => `<circle cx="${x}" cy="31" r="1.8" fill="currentColor"/>`).join('') + [16, 23].map((y) => `<circle cx="14" cy="${y}" r="1.8" fill="currentColor"/><circle cx="42" cy="${y}" r="1.8" fill="currentColor"/>`).join('') + '</svg>',
    },
  };

  /* ----- cada pieza: pasos, opciones y precio ----- */
  const PIEZAS = {
    tarjetero: {
      nombre: 'Tarjetero',
      dibujo: () => window.DTTarjetero,
      precio: () => ({ min: 650, max: 650 }),
      notaPrecio: '[PLACEHOLDER] Confirmar si el detalle o las tachas cambian el precio.',
      state: { cuero: null, detalle: null, cuero2: null, tachas: null },
      pasos: [
        { key: 'cuero', label: 'Cuero', tipo: 'cuero', titulo: 'Elegí el cuero', hint: 'Es el cuero de todo el tarjetero.' },
        {
          key: 'detalle', label: 'Detalle', titulo: 'El detalle', hint: 'Una franja o una V en otro cuero, o liso.',
          opciones: [
            { id: 'no', name: 'Liso', desc: 'Un solo cuero, con la media luna para sacar las tarjetas.' },
            { id: 'franja', name: 'Franja', desc: 'Una franja recta en otro cuero.' },
            { id: 'v', name: 'V', desc: 'Una V en otro cuero, como en los tarjeteros de la tienda.' },
          ],
        },
        { key: 'cuero2', label: 'Cuero del detalle', tipo: 'cuero', titulo: 'El cuero del detalle', hint: 'Elegí uno distinto al del tarjetero para que se note.', si: (st) => st.detalle && st.detalle !== 'no', excluir: 'cuero' },
        {
          key: 'tachas', label: 'Tachas', titulo: '¿Con tachas?', hint: 'Tachas de metal por el borde del bolsillo.',
          opciones: [
            { id: 'no', name: 'Sin tachas', desc: 'Solo el pespunte.' },
            { id: 'si', name: 'Con tachas', desc: 'Por los costados y abajo.' },
          ],
        },
      ],
      describir: (st) => [
        st.cuero && cueroName(st.cuero),
        st.detalle === 'franja' && 'Franja' + (st.cuero2 ? ' en ' + cueroName(st.cuero2).toLowerCase() : ''),
        st.detalle === 'v' && 'V' + (st.cuero2 ? ' en ' + cueroName(st.cuero2).toLowerCase() : ''),
        st.tachas === 'si' && 'Con tachas',
      ].filter(Boolean),
    },
  };

  const P = PIEZAS[builder.dataset.pieza];
  if (!P || !P.dibujo()) return;
  const state = Object.assign({ step: 0, nota: '' }, P.state);
  const pasos = () => P.pasos.filter((p) => !p.si || p.si(state)).concat([{ key: 'pedido', label: 'Listo' }]);

  const el = {
    steps: $('[data-steps]'), body: $('[data-step-body]'), caption: $('[data-stage-caption]'),
    stage: $('[data-stage]'), totals: $$('[data-total]'), prev: $('[data-prev]'), next: $('[data-next]'),
    nextBar: $('[data-next-bar]'),
  };
  const dibujo = P.dibujo().create($('[data-draw]'));

  const priceText = () => { const p = P.precio(state); return S.range(p.min, p.max); };
  const ready = (p) => p.key === 'pedido' || !!state[p.key];
  const maxReachable = () => { const L = pasos(); let i = 0; while (i < L.length - 1 && ready(L[i])) i++; return i; };

  function renderDraw() {
    dibujo.update(state);
    const d = P.describir(state);
    el.caption.textContent = d.length ? d.join(' · ') : 'Elegí el cuero para empezar';
  }
  function renderSteps() {
    const L = pasos(), reach = maxReachable();
    el.steps.innerHTML = L.map((s, i) => {
      const cls = [i === state.step ? 'is-current' : '', i !== state.step && ready(s) && i <= reach ? 'is-done' : ''].join(' ');
      return `<li><button type="button" class="${cls}" data-goto="${i}" ${i > reach ? 'disabled' : ''} ${i === state.step ? 'aria-current="step"' : ''}><span>${String(i + 1).padStart(2, '0')}</span>${s.label}</button></li>`;
    }).join('');
  }
  const optRow = (group, o, icon) => `
    <button type="button" class="opt" data-group="${group}" data-id="${o.id}" aria-pressed="${state[group] === o.id}">
      <span class="opt__icon" aria-hidden="true">${icon || ''}</span>
      <span class="opt__name">${o.name}<span class="opt__desc">${o.desc}</span></span>
      <span class="opt__price">Incluido</span>
    </button>`;

  function detailList() {
    return P.describir(state).concat(state.nota.trim() ? [`Nota: ${state.nota.trim()}`] : []);
  }
  const waText = () => [`Hola Decora.te! Quiero encargar este ${P.nombre.toLowerCase()}:`, '', ...detailList().map((x) => '• ' + x), '', `Total estimado: ${priceText()}`].join('\n');

  function renderBody() {
    const p = pasos()[state.step];
    let h = '';
    if (p.tipo === 'cuero') {
      const lista = D.cueros.filter((c) => !p.excluir || c.id !== state[p.excluir]);
      h = `<h2 class="step__title">${p.titulo}</h2><p class="step__hint">${p.hint}</p>
        <div class="swatches">${lista.map((c) => `<button type="button" class="swatch" data-group="${p.key}" data-id="${c.id}" aria-pressed="${state[p.key] === c.id}"><span class="swatch__img"><img src="img/cuero-${c.id}.jpg" alt="" loading="lazy"><span class="swatch__badge">${state[p.key] === c.id ? '✓' : ''}</span></span><span class="swatch__name">${c.name}</span></button>`).join('')}</div>
        <p class="step__note"><span class="placeholder">[PLACEHOLDER] Confirmar qué cueros hay disponibles. Las muestras son recortes de piezas reales de Decora.te.</span></p>`;
    } else if (p.opciones) {
      h = `<h2 class="step__title">${p.titulo}</h2><p class="step__hint">${p.hint}</p>
        <div class="opts">${p.opciones.map((o) => optRow(p.key, o, (ICON[p.key] || {})[o.id])).join('')}</div>`;
    } else {
      h = `<h2 class="step__title">Tu ${P.nombre.toLowerCase()}</h2><p class="step__hint">Sumalo al carrito con el resto de tu pedido, o mandalo solo por WhatsApp.</p>
        <ul class="summary">
          ${P.pasos.filter((x) => !x.si || x.si(state)).map((x) => {
            const v = x.tipo === 'cuero' ? cueroName(state[x.key]) : (find(x.opciones, state[x.key]) || {}).name;
            return `<li><span>${x.label}</span><span>${esc(v || '')}</span></li>`;
          }).join('')}
          <li><span>Total estimado</span><span><strong>${priceText()}</strong></span></li>
        </ul>
        ${P.notaPrecio ? `<p class="step__note"><span class="placeholder">${P.notaPrecio}</span></p>` : ''}
        <div class="fields"><div class="field field--wide"><label for="b-nota">Comentarios (opcional)</label><textarea id="b-nota" data-field="nota" rows="2">${esc(state.nota)}</textarea></div></div>
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
    el.totals.forEach((t) => { t.textContent = priceText(); });
  }
  function render(full = true) { renderDraw(); renderSteps(); if (full) renderBody(); renderNav(); }

  function goStep(i) {
    if (i < 0 || i > pasos().length - 1 || i > maxReachable()) return;
    state.step = i;
    render();
    const panel = $('.builder__panel');
    const top = panel.getBoundingClientRect().top;
    const offset = window.innerWidth < 900 ? el.stage.offsetHeight + 20 : 120;
    if (top < offset - 10 || top > window.innerHeight * 0.6) S.scrollToEl(panel, -offset);
  }
  function addToCart() {
    const p = P.precio(state);
    S.Cart.add({
      key: builder.dataset.pieza + '|' + P.pasos.map((x) => state[x.key]).concat(state.nota).join('|'),
      kind: 'pieza', name: `${P.nombre} a medida`, detail: detailList(), min: p.min, max: p.max,
      swatch: state.cuero, foto: null,
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
    state[group] = id;
    if (group === 'detalle' && id === 'no') state.cuero2 = null;
    if (group === 'cuero' && state.cuero2 === id) state.cuero2 = null;
    $$(`[data-group="${group}"]`).forEach((o) => {
      o.setAttribute('aria-pressed', o.dataset.id === id);
      const b = o.querySelector('.swatch__badge'); if (b) b.textContent = o.dataset.id === id ? '✓' : '';
    });
    render(false);
    setTimeout(() => { const cur = pasos()[state.step]; if (cur && cur.key === group && ready(cur)) goStep(state.step + 1); }, 650);
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

  render(true);

  // volumen: se inclina con el mouse (o el dedo) y se mueve suave cuando está quieto
  const pz = el.stage.querySelector('.pz3d');
  el.stage.addEventListener('pointermove', (e) => {
    const r = el.stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    pz.classList.add('is-hold');
    pz.style.setProperty('--rx', `${(14 - y * 18).toFixed(2)}deg`);
    pz.style.setProperty('--ry', `${(x * 30).toFixed(2)}deg`);
  });
  el.stage.addEventListener('pointerleave', () => { pz.classList.remove('is-hold'); pz.style.removeProperty('--rx'); pz.style.removeProperty('--ry'); });

  const bar = $('[data-bar]');
  const grid = $('.builder__grid');
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => bar.classList.toggle('is-on', en.isIntersecting), { rootMargin: '0px 0px -20% 0px' }).observe(grid);
  else bar.classList.add('is-on');
})();
