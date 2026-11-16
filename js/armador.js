/* =========================================================
   Decora.te — Armá el tuyo
   ========================================================= */
(() => {
  'use strict';
  const D = window.DT;
  const S = window.DTSite;
  const builder = document.querySelector('[data-builder]');
  if (!builder || !S || !window.DTBelt) return;
  const $ = (s, c = builder) => c.querySelector(s);
  const $$ = (s, c = builder) => Array.from(c.querySelectorAll(s));
  const { money, esc } = S;
  const find = (list, id) => list.find((x) => x.id === id);

  const STEPS = [
    { key: 'tipo', label: 'Tipo' },
    { key: 'cueros', label: 'Cuero' },
    { key: 'hebilla', label: 'Hebilla' },
    { key: 'union', label: 'Unión' },
    { key: 'deco', label: 'Detalle' },
    { key: 'pedido', label: 'Listo' },
  ];
  const state = { step: 0, tipo: null, cueros: [], hebilla: null, union: null, deco: null, cintura: '', nota: '' };
  const q = new URLSearchParams(location.search).get('tipo');
  if (find(D.tipos, q)) { state.tipo = q; state.step = 1; }

  // íconos chicos para las opciones
  document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1e2b8"/><stop offset=".35" stop-color="#c7a467"/><stop offset=".6" stop-color="#8d6c37"/><stop offset="1" stop-color="#e0c88f"/></linearGradient>
    <radialGradient id="brassPlate" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#f3e4bd"/><stop offset=".55" stop-color="#bf9c5f"/><stop offset="1" stop-color="#6f5228"/></radialGradient></defs></svg>`);
  const ICON = {
    buckle: {
      normal: '<svg viewBox="0 0 70 90"><rect x="10" y="6" width="44" height="78" rx="9" fill="none" stroke="url(#brass)" stroke-width="8"/><rect x="4" y="22" width="10" height="46" rx="5" fill="url(#brass)"/><path d="M10 42h50l4 3-4 3H10z" fill="url(#brass)"/></svg>',
      rellena: '<svg viewBox="0 0 70 90"><ellipse cx="35" cy="45" rx="30" ry="41" fill="url(#brassPlate)"/><ellipse cx="35" cy="45" rx="25" ry="35" fill="none" stroke="#f3e2b4" stroke-width="2" stroke-dasharray="1 3"/><ellipse cx="35" cy="45" rx="10" ry="14" fill="url(#brass)" stroke="#6f5228" stroke-width="1"/></svg>',
      pedreria: '<svg viewBox="0 0 70 90"><rect x="10" y="6" width="46" height="78" rx="6" fill="none" stroke="url(#brass)" stroke-width="11"/><g fill="#f7f4ef" stroke="#9aa0a6" stroke-width=".8">' + [14, 28, 42, 56, 70].map((y) => `<circle cx="10" cy="${y}" r="3.6"/><circle cx="56" cy="${y}" r="3.6"/>`).join('') + '<circle cx="24" cy="6" r="3.6"/><circle cx="42" cy="6" r="3.6"/><circle cx="24" cy="84" r="3.6"/><circle cx="42" cy="84" r="3.6"/></g><path d="M10 42h50l4 3-4 3H10z" fill="url(#brass)"/></svg>',
    },
    tipo: {
      funcional: '<svg viewBox="0 0 56 44"><rect x="2" y="17" width="52" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="42" cy="22" r="1.3" fill="currentColor"/><circle cx="47" cy="22" r="1.3" fill="currentColor"/></svg>',
      decorativo: '<svg viewBox="0 0 56 44"><rect x="2" y="8" width="52" height="28" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 12h44M6 32h44" stroke="currentColor" stroke-width=".6" stroke-dasharray="2 2"/></svg>',
    },
    union: {
      ninguna: '<svg viewBox="0 0 56 44"><rect x="2" y="15" width="52" height="14" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
      remaches: '<svg viewBox="0 0 56 44"><rect x="2" y="15" width="52" height="14" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M28 15v14" stroke="currentColor" stroke-width=".8"/><circle cx="31" cy="19" r="2" fill="currentColor"/><circle cx="31" cy="25" r="2" fill="currentColor"/></svg>',
      argollas: '<svg viewBox="0 0 56 44"><rect x="2" y="15" width="18" height="14" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="36" y="15" width="18" height="14" fill="none" stroke="currentColor" stroke-width="1.2"/><ellipse cx="28" cy="22" rx="5" ry="9" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
      trenzado: '<svg viewBox="0 0 56 44"><rect x="2" y="15" width="52" height="14" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M25 15l6 4.7-6 4.6 6 4.7M31 15l-6 4.7 6 4.6-6 4.7" fill="none" stroke="currentColor" stroke-width="1"/></svg>',
    },
    deco: {
      no: '<svg viewBox="0 0 56 44"><rect x="2" y="15" width="52" height="14" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
      si: '<svg viewBox="0 0 56 44"><rect x="2" y="15" width="52" height="14" fill="none" stroke="currentColor" stroke-width="1.2"/>' + [13, 28, 43].map((x) => `<path transform="translate(${x} 22) scale(.32)" d="M0-10 2.9-3.1 10-3.1 4.3 1.3 6.5 8.1 0 4 -6.5 8.1 -4.3 1.3 -10-3.1 -2.9-3.1Z" fill="currentColor"/>`).join('') + '</svg>',
    },
  };

  const el = {
    steps: $('[data-steps]'), body: $('[data-step-body]'), caption: $('[data-stage-caption]'),
    stage: $('[data-stage]'), totals: $$('[data-total]'), prev: $('[data-prev]'), next: $('[data-next]'),
    nextBar: $('[data-next-bar]'),
  };
  const belt = window.DTBelt.create($('[data-belt]'), { reduced: !S.motion });

  /* ----- precio ----- */
  function price() {
    const t = find(D.tipos, state.tipo);
    if (!t) return null;
    let extra = 0;
    [[D.hebillas, state.hebilla], [D.uniones, state.union], [D.deco, state.deco]].forEach(([l, id]) => { const o = find(l, id); if (o) extra += o.price; });
    return { min: t.min + extra, max: t.max + extra };
  }
  const priceText = () => { const p = price(); return p ? S.range(p.min, p.max) : '—'; };
  const plus = (n) => (n ? '+' + money(n) : 'Incluido');

  function stepReady(i) {
    switch (STEPS[i].key) {
      case 'tipo': return !!state.tipo;
      case 'cueros': return state.cueros.length > 0;
      case 'hebilla': return !!state.hebilla;
      case 'union': return !!state.union;
      case 'deco': return !!state.deco;
      default: return true;
    }
  }
  const maxReachable = () => { let i = 0; while (i < STEPS.length - 1 && stepReady(i)) i++; return i; };

  function describe() {
    const parts = [];
    const t = find(D.tipos, state.tipo); if (t) parts.push(t.name);
    if (state.cueros.length) parts.push(state.cueros.map((id) => find(D.cueros, id).name).join(' + '));
    const h = find(D.hebillas, state.hebilla); if (h) parts.push('Hebilla ' + h.name.toLowerCase());
    const u = find(D.uniones, state.union); if (u && u.id !== 'ninguna') parts.push(u.name);
    if (state.deco === 'si') parts.push('Con decoración');
    return parts;
  }

  function renderBelt(redraw) {
    belt.update({ tipo: state.tipo, cueros: state.cueros, hebilla: state.hebilla, union: state.union, deco: state.deco }, { redraw });
    const p = describe();
    el.caption.textContent = p.length ? p.join(' · ') : 'Elegí un tipo de cinto para empezar';
  }

  function renderSteps() {
    const reach = maxReachable();
    el.steps.innerHTML = STEPS.map((s, i) => {
      const cls = [i === state.step ? 'is-current' : '', i !== state.step && stepReady(i) && i <= reach ? 'is-done' : ''].join(' ');
      return `<li><button type="button" class="${cls}" data-goto="${i}" ${i > reach ? 'disabled' : ''} ${i === state.step ? 'aria-current="step"' : ''}><span>${String(i + 1).padStart(2, '0')}</span>${s.label}</button></li>`;
    }).join('');
  }

  const optRow = (group, o, sel, label, icon) => `
    <button type="button" class="opt" data-group="${group}" data-id="${o.id}" aria-pressed="${sel}">
      <span class="opt__icon" aria-hidden="true">${icon || ''}</span>
      <span class="opt__name">${o.name}<span class="opt__desc">${o.desc}</span></span>
      <span class="opt__price">${label}</span>
    </button>`;

  function detailList() {
    const h = find(D.hebillas, state.hebilla), u = find(D.uniones, state.union), d = find(D.deco, state.deco);
    return [
      state.cueros.map((id) => find(D.cueros, id).name).join(' + '),
      h ? 'Hebilla ' + h.name.toLowerCase() : '',
      u ? (u.id === 'ninguna' ? 'Sin unión' : 'Unión ' + u.name.toLowerCase()) : '',
      d && d.price ? 'Con decoración' : '',
      state.cintura.trim() ? `Cintura ${state.cintura.trim()} cm` : '',
      state.nota.trim() ? `Nota: ${state.nota.trim()}` : '',
    ].filter(Boolean);
  }

  function waText() {
    const t = find(D.tipos, state.tipo);
    const lines = ['Hola Decora.te! Quiero encargar este cinto:', '', `• Cinto ${t.name.toLowerCase()}`, ...detailList().map((x) => '• ' + x), '', `Total estimado: ${priceText()}`];
    if (state.tipo === 'funcional') lines.push('(sé que el precio final depende del cuero)');
    return lines.join('\n');
  }

  function renderBody() {
    const key = STEPS[state.step].key;
    let h = '';
    if (key === 'tipo') {
      h = `<h2 class="step__title">¿Qué cinto buscás?</h2><p class="step__hint">El precio base cambia según el tipo.</p>
        <div class="opts">${D.tipos.map((o) => optRow('tipo', o, state.tipo === o.id, S.range(o.min, o.max), ICON.tipo[o.id])).join('')}</div>`;
    } else if (key === 'cueros') {
      h = `<h2 class="step__title">Elegí los cueros</h2><p class="step__hint">Hasta ${D.maxCueros}. Se ubican en el cinto en el orden en que los elegís.</p>
        <div class="swatches">${D.cueros.map((c) => {
          const pos = state.cueros.indexOf(c.id);
          return `<button type="button" class="swatch" data-group="cuero" data-id="${c.id}" aria-pressed="${pos > -1}"><span class="swatch__img"><img src="img/cuero-${c.id}.jpg" alt="" loading="lazy"><span class="swatch__badge">${pos > -1 ? pos + 1 : ''}</span></span><span class="swatch__name">${c.name}</span></button>`;
        }).join('')}</div>
        <p class="step__msg" data-msg aria-live="polite"></p>
        <p class="step__note"><span class="placeholder">[PLACEHOLDER] Confirmar qué cueros hay disponibles. Las muestras son recortes de piezas reales de Decora.te.</span></p>`;
    } else if (key === 'hebilla') {
      h = `<h2 class="step__title">La hebilla</h2><p class="step__hint">Se suma al precio base.</p>
        <div class="opts">${D.hebillas.map((o) => optRow('hebilla', o, state.hebilla === o.id, plus(o.price), ICON.buckle[o.id])).join('')}</div>`;
    } else if (key === 'union') {
      const single = state.cueros.length === 1;
      h = `<h2 class="step__title">La unión</h2><p class="step__hint">${single ? 'Elegiste un solo cuero: podés dejarlo sin unión.' : 'Cómo se unen los cueros entre sí.'}</p>
        <div class="opts">${D.uniones.filter((o) => !o.onlySingle || single).map((o) => optRow('union', o, state.union === o.id, plus(o.price), ICON.union[o.id])).join('')}</div>`;
    } else if (key === 'deco') {
      h = `<h2 class="step__title">El detalle final</h2><p class="step__hint">Opcional.</p>
        <div class="opts">${D.deco.map((o) => optRow('deco', o, state.deco === o.id, plus(o.price), ICON.deco[o.id])).join('')}</div>`;
    } else {
      const t = find(D.tipos, state.tipo), hb = find(D.hebillas, state.hebilla), u = find(D.uniones, state.union), d = find(D.deco, state.deco);
      h = `<h2 class="step__title">Tu cinto</h2><p class="step__hint">Sumalo al carrito con el resto de tu pedido, o mandalo solo por WhatsApp.</p>
        <ul class="summary">
          <li><span>Tipo</span><span>${t.name} · ${S.range(t.min, t.max)}</span></li>
          <li><span>Cueros</span><span>${state.cueros.map((id) => find(D.cueros, id).name).join(', ')}</span></li>
          <li><span>Hebilla</span><span>${hb.name} · ${plus(hb.price)}</span></li>
          <li><span>Unión</span><span>${u.name} · ${plus(u.price)}</span></li>
          <li><span>Decoración</span><span>${d.price ? 'Sí · ' + plus(d.price) : 'No'}</span></li>
          <li><span>Total estimado</span><span><strong>${priceText()}</strong></span></li>
        </ul>
        <div class="fields">
          <div class="field"><label for="b-cintura">Cintura en cm (opcional)</label><input id="b-cintura" data-field="cintura" inputmode="numeric" value="${esc(state.cintura)}"></div>
          <div class="field field--wide"><label for="b-nota">Comentarios (opcional)</label><textarea id="b-nota" data-field="nota" rows="2">${esc(state.nota)}</textarea></div>
        </div>
        <div class="actions">
          <button type="button" class="btn btn--wide" data-add>Agregar al carrito</button>
          <a class="btn btn--ghost btn--wide" data-send href="#" target="_blank" rel="noopener">Pedir solo este por WhatsApp</a>
        </div>
        <p class="added" data-added aria-live="polite"></p>
        <p class="send-note">Trabajamos con 72 horas de anticipación. Pagás en efectivo o por transferencia bancaria.${state.tipo === 'funcional' ? ' En el cinto funcional, el precio final depende del cuero.' : ''}</p>`;
    }
    el.body.innerHTML = `<div class="step__in">${h}</div>`;
    const send = $('[data-send]');
    if (send) send.href = S.wa(waText());
  }

  function renderNav() {
    const last = state.step === STEPS.length - 1;
    el.prev.disabled = state.step === 0;
    el.next.disabled = !stepReady(state.step);
    el.next.style.visibility = last ? 'hidden' : '';
    el.nextBar.textContent = last ? 'Agregar al carrito' : 'Siguiente';
    el.nextBar.disabled = !last && !stepReady(state.step);
    const txt = priceText();
    el.totals.forEach((t) => { t.textContent = txt; });
  }

  function render(full = true, redraw = false) {
    renderBelt(redraw);
    renderSteps();
    if (full) renderBody();
    renderNav();
  }

  function goStep(i) {
    if (i < 0 || i > STEPS.length - 1 || i > maxReachable()) return;
    state.step = i;
    render();
    const panel = $('.builder__panel');
    const top = panel.getBoundingClientRect().top;
    const offset = window.innerWidth < 900 ? el.stage.offsetHeight + 20 : 120;
    if (top < offset - 10 || top > window.innerHeight * 0.6) S.scrollToEl(panel, -offset);
  }

  function addToCart() {
    const t = find(D.tipos, state.tipo);
    const p = price();
    const detail = detailList();
    S.Cart.add({
      key: 'cinto|' + [state.tipo, ...state.cueros, state.hebilla, state.union, state.deco, state.cintura, state.nota].join('|'),
      kind: 'cinto', name: `Cinto ${t.name.toLowerCase()}`, detail, min: p.min, max: p.max,
      swatch: state.cueros[0], foto: null,
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
    if (group === 'cuero') {
      const pos = state.cueros.indexOf(id);
      const msg = $('[data-msg]');
      if (pos > -1) state.cueros.splice(pos, 1);
      else if (state.cueros.length >= D.maxCueros) { if (msg) msg.textContent = `Podés elegir hasta ${D.maxCueros} cueros. Sacá uno para cambiarlo.`; return; }
      else state.cueros.push(id);
      if (msg) msg.textContent = '';
      if (state.union === 'ninguna' && state.cueros.length > 1) state.union = null;
      $$('.swatch').forEach((s) => { const p = state.cueros.indexOf(s.dataset.id); s.setAttribute('aria-pressed', p > -1); $('.swatch__badge', s).textContent = p > -1 ? p + 1 : ''; });
      render(false);
      return;
    }
    const first = !state.tipo && group === 'tipo';
    state[group] = id;
    $$(`.opt[data-group="${group}"]`).forEach((o) => o.setAttribute('aria-pressed', o.dataset.id === id));
    render(false, first);
    // avanza solo después de elegir, con una pausa para ver el cambio
    if (group !== 'cuero') setTimeout(() => { if (STEPS[state.step].key === group && stepReady(state.step)) goStep(state.step + 1); }, 650);
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
  el.nextBar.addEventListener('click', () => (state.step === STEPS.length - 1 ? addToCart() : goStep(state.step + 1)));

  render(true, true);

  // inclinación sutil con el mouse
  if (S.fine && S.motion) {
    const svg = el.stage.querySelector('.beltsvg');
    el.stage.addEventListener('pointermove', (e) => {
      const r = el.stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      svg.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg)`;
    });
    el.stage.addEventListener('pointerleave', () => { svg.style.transform = ''; });
  }

  // barra inferior del celular: visible mientras se arma
  const bar = $('[data-bar]');
  const grid = $('.builder__grid');
  if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => bar.classList.toggle('is-on', en.isIntersecting), { rootMargin: '0px 0px -20% 0px' }).observe(grid);
  else bar.classList.add('is-on');
})();
