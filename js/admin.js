/* Decora.te · panel de Julia (admin.html)
   Entra con su mail y contraseña (Supabase Auth). Lo que puede ver y cambiar lo limitan las reglas de la base
   (herramientas/supabase/*.sql): solo una cuenta que esté en la tabla admins lee y cambia pedidos.
   La clave de acá es la "publishable" (pública a propósito). Nunca poner la secret / service_role. */
(function () {
  'use strict';
  const URL_ = 'https://tptuqviwbztmqsymgvgm.supabase.co';
  const KEY = 'sb_publishable_7bzfhpKaQ5iBORWqX96Cfg_HpNDTeok';
  const SES = 'decorate-panel-sesion';
  const AQUI = location.origin + location.pathname;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => (n == null || n === '' ? '—' : '$' + Number(n).toLocaleString('es-UY'));
  const rango = (a, b) => (a === b ? money(a) : `${money(a)} a ${money(b)}`);
  const codigo = (id) => 'DT-' + String(id).padStart(4, '0');
  const hoy = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const fecha = (s, conHora) => {
    if (!s) return '';
    const d = new Date(s.length === 10 ? s + 'T12:00:00' : s);
    const f = d.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
    return conHora ? `${f}, ${d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}` : f;
  };

  const ESTADOS = [
    { id: 'nuevo', nombre: 'Nuevo' },
    { id: 'confirmado', nombre: 'Confirmado' },
    { id: 'en_produccion', nombre: 'En producción' },
    { id: 'listo', nombre: 'Listo' },
    { id: 'entregado', nombre: 'Entregado' },
    { id: 'cancelado', nombre: 'Cancelado' },
  ];
  const estadoNombre = (id) => (ESTADOS.find((e) => e.id === id) || {}).nombre || id;
  const ORIGENES = ['web', 'whatsapp', 'instagram', 'en persona', 'otro'];
  const MEDIOS = [['efectivo', 'Efectivo'], ['transferencia', 'Transferencia'], ['otro', 'Otro']];

  /* ---------------- sesión (Supabase Auth, sin librerías) ---------------- */
  let ses = null;
  try { ses = JSON.parse(localStorage.getItem(SES) || 'null'); } catch (e) { ses = null; }
  const guardar = (s) => {
    ses = s ? { access_token: s.access_token, refresh_token: s.refresh_token, vence: Date.now() + (s.expires_in || 3600) * 1000 - 60000 } : null;
    try { if (ses) localStorage.setItem(SES, JSON.stringify(ses)); else localStorage.removeItem(SES); } catch (e) { /* sin almacenamiento */ }
  };

  async function auth(path, body) {
    const r = await fetch(`${URL_}/auth/v1/${path}`, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error_description || j.msg || j.message || r.status), { status: r.status, codigo: j.error_code || j.error });
    return j;
  }
  async function token() {
    if (!ses) return null;
    if (Date.now() > ses.vence) {
      try { guardar(await auth('token?grant_type=refresh_token', { refresh_token: ses.refresh_token })); } catch (e) { guardar(null); return null; }
    }
    return ses.access_token;
  }

  // pedidos a la base, con la sesión de Julia
  async function api(path, opt = {}) {
    const t = await token();
    if (!t) { mostrar('entrar'); throw new Error('Se cerró la sesión. Entrá de nuevo.'); }
    const r = await fetch(`${URL_}/rest/v1/${path}`, {
      ...opt, headers: { apikey: KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(opt.headers || {}) },
    });
    if (r.status === 401) { guardar(null); mostrar('entrar'); throw new Error('Se cerró la sesión. Entrá de nuevo.'); }
    const txt = await r.text();
    if (!r.ok) throw new Error(`No se pudo guardar (${r.status}). ${txt.slice(0, 160)}`);
    return txt ? JSON.parse(txt) : null;
  }

  /* ---------------- vistas ---------------- */
  const SECCIONES = ['pedidos', 'tienda', 'precios'];
  function mostrar(v) {
    $$('[data-vista]').forEach((el) => { el.hidden = el.dataset.vista !== v; });
    document.body.dataset.vista = v;
    const adentro = SECCIONES.includes(v);
    $('[data-salir]').hidden = !(adentro || v === 'sin-permiso');
    $('[data-nav]').hidden = !adentro;
    $$('[data-ir]').forEach((b) => b.setAttribute('aria-current', b.dataset.ir === v ? 'page' : 'false'));
  }
  let avisoT;
  function aviso(txt, error) {
    const a = $('[data-aviso]'); a.textContent = txt; a.classList.toggle('es-error', !!error); a.classList.add('is-on');
    clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.remove('is-on'), error ? 6000 : 2600);
  }
  const errorDe = (e) => {
    const m = String(e.message || e);
    if (/invalid login|invalid_credentials/i.test(m)) return 'El mail o la contraseña no coinciden.';
    if (/rate limit|too many|over_email_send_rate/i.test(m)) return 'Se mandaron demasiados mails seguidos. Esperá una hora y probá de nuevo.';
    if (/not confirmed/i.test(m)) return 'Esta cuenta todavía no está activada: abrí el link del mail de invitación.';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'No hay conexión. Probá de nuevo.';
    return m;
  };

  // entrar
  $('[data-form-entrar]').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = ev.target, err = $('[data-err]', f), b = $('button[type=submit]', f);
    err.textContent = ''; b.disabled = true; b.textContent = 'Entrando…';
    try {
      guardar(await auth('token?grant_type=password', { email: f.email.value.trim(), password: f.pass.value }));
      f.pass.value = '';
      await arrancar();
    } catch (e) { err.textContent = errorDe(e); }
    b.disabled = false; b.textContent = 'Entrar';
  });
  // me olvidé: le llega un mail con un link para elegir otra
  $('[data-olvide]').addEventListener('click', async () => {
    const f = $('[data-form-entrar]'), err = $('[data-err]', f), mail = f.email.value.trim();
    if (!mail) { err.textContent = 'Escribí tu mail arriba y tocá de nuevo.'; f.email.focus(); return; }
    try {
      await auth(`recover?redirect_to=${encodeURIComponent(AQUI)}`, { email: mail });
      err.textContent = ''; aviso('Te mandamos un mail con un link para elegir otra contraseña.');
    } catch (e) { err.textContent = errorDe(e); }
  });
  // elegir contraseña
  $('[data-form-clave]').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = ev.target, err = $('[data-err]', f);
    if (f.pass.value !== f.pass2.value) { err.textContent = 'Las dos no son iguales.'; return; }
    try {
      const t = await token();
      const r = await fetch(`${URL_}/auth/v1/user`, { method: 'PUT', headers: { apikey: KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: f.pass.value }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.msg || j.message || r.status); }
      f.reset(); aviso('Listo, ya tenés tu contraseña.');
      await arrancar();
    } catch (e) { err.textContent = /should be different|same_password/i.test(String(e.message)) ? 'Tiene que ser distinta de la anterior.' : /weak|at least/i.test(String(e.message)) ? 'Es muy corta: usá al menos 8 letras o números.' : errorDe(e); }
  });
  $('[data-salir]').addEventListener('click', async () => {
    const t = ses && ses.access_token;
    guardar(null);
    if (t) fetch(`${URL_}/auth/v1/logout`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${t}` } }).catch(() => {});
    mostrar('entrar');
  });


  /* =========================================================
     PEDIDOS
     ========================================================= */
  let pedidos = [], filtro = 'curso', busca = '';

  async function cargar() {
    pedidos = await api('pedidos?select=*&order=creado.desc&limit=500');
    pintar();
  }

  const activo = (p) => !['entregado', 'cancelado'].includes(p.estado);
  const total = (p) => (p.precio_final != null ? money(p.precio_final) : p.total_min === p.total_max ? money(p.total_min) : `${money(p.total_min)}–${money(p.total_max).slice(1)}`);
  const debe = (p) => p.estado !== 'cancelado' && p.precio_final != null && (p.cobrado || 0) < p.precio_final;
  const enSemana = (p) => p.entrega && p.entrega <= new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  // "hoy", "ayer" o la fecha
  const cuando = (s) => {
    if (!s) return '';
    const d = new Date(s), h = new Date(); h.setHours(0, 0, 0, 0);
    const dias = Math.round((h - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
    return dias === 0 ? 'hoy' : dias === 1 ? 'ayer' : fecha(s);
  };
  const diaEntrega = (s) => new Date(s + 'T12:00:00').toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');

  // en curso: agrupados por lo que hay que hacer
  const GRUPOS_PED = [['nuevo', 'Nuevos, para confirmar'], ['confirmado', 'Confirmados'], ['en_produccion', 'En producción'], ['listo', 'Listos para entregar']];

  function filaPedido(p, conEstado) {
    const foto = (p.items || []).map((i) => i.foto).find(Boolean);
    const que = (p.items || []).map((i) => (i.cantidad > 1 ? i.cantidad + ' × ' : '') + i.nombre).join(' · ');
    const meta = [
      conEstado ? `<span class="es-estado">${estadoNombre(p.estado)}</span>` : '',
      codigo(p.id), cuando(p.creado),
      p.origen !== 'web' ? esc(p.origen) : '',
      p.entrega && activo(p) ? 'entrega ' + diaEntrega(p.entrega) : '',
      debe(p) ? '<span class="es-alerta">sin cobrar</span>' : '',
    ].filter(Boolean).join(' · ');
    return `<button class="pn-pedido pn-pedido--${p.estado}" type="button" data-abrir="${p.id}">
      <span class="pn-pedido__img">${foto ? `<img src="${esc(foto)}" alt="" loading="lazy">` : ''}</span>
      <span class="pn-pedido__txt">
        <span class="pn-pedido__nombre">${esc(p.nombre)}</span>
        <span class="pn-pedido__que">${esc(que)}</span>
        <span class="pn-pedido__meta">${meta}</span>
      </span>
      <span class="pn-pedido__total">${total(p)}</span>
    </button>`;
  }

  function pintar() {
    const act = pedidos.filter(activo);
    const nuevos = pedidos.filter((p) => p.estado === 'nuevo').length;
    const porCobrar = act.filter(debe).reduce((s, p) => s + p.precio_final - (p.cobrado || 0), 0);
    const semana = act.filter(enSemana).length;
    $('[data-nav-nuevos]').textContent = nuevos || '';
    $('[data-resumen]').innerHTML = act.length ? [
      nuevos ? `<b>${nuevos}</b> ${nuevos === 1 ? 'nuevo' : 'nuevos'}` : '',
      `<b>${act.length}</b> en curso`,
      semana ? `<b>${semana}</b> para entregar esta semana` : '',
      porCobrar ? `<span class="es-alerta"><b>${money(porCobrar)}</b> por cobrar</span>` : '',
    ].filter(Boolean).join(' · ') : 'No hay pedidos en curso.';

    const entregados = pedidos.filter((p) => p.estado === 'entregado');
    $('[data-tabs]').innerHTML = [['curso', 'En curso', act.length], ['entregados', 'Entregados', entregados.length], ['todos', 'Todos', pedidos.length]]
      .map(([id, n, c]) => `<button type="button" role="tab" aria-selected="${filtro === id}" data-tab="${id}">${n}<small>${c}</small></button>`).join('');

    const q = busca.toLowerCase().replace(/\s+/g, '');
    const coincide = (p) => !q || `${codigo(p.id)}${p.nombre}${p.telefono}`.toLowerCase().replace(/\s+/g, '').includes(q);
    const vacio = (t) => `<p class="pn-vacio">${t}</p>`;
    const caja = $('[data-lista]');
    if (filtro === 'curso' && !q) {
      caja.innerHTML = act.length ? GRUPOS_PED.map(([id, n]) => {
        const ps = act.filter((p) => p.estado === id); if (!ps.length) return '';
        return `<div class="pn-grupo pn-grupo--${id}"><h2 class="pn-grupo__t">${n} <small>${ps.length}</small></h2><div class="pn-lista">${ps.map((p) => filaPedido(p, false)).join('')}</div></div>`;
      }).join('') : vacio(pedidos.length ? 'No hay pedidos en curso.' : 'Todavía no entró ningún pedido.');
    } else {
      const base = filtro === 'curso' ? act : filtro === 'entregados' ? entregados : pedidos;
      const lista = base.filter(coincide);
      caja.innerHTML = lista.length ? `<div class="pn-lista pn-grupo">${lista.map((p) => filaPedido(p, true)).join('')}</div>` : vacio(q ? 'No encontramos ese pedido.' : 'No hay pedidos acá.');
    }
  }

  $('[data-tabs]').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { filtro = b.dataset.tab; pintar(); } });
  $('[data-buscar]').addEventListener('input', (e) => { busca = e.target.value; pintar(); });
  $('[data-lista]').addEventListener('click', (e) => { const b = e.target.closest('[data-abrir]'); if (b) abrir(+b.dataset.abrir); });
  $('[data-nuevo]').addEventListener('click', () => nuevo());

  /* ---------------- hoja (detalle) ---------------- */
  const hoja = $('[data-hoja]'), cuerpo = $('[data-hoja-cuerpo]');
  function abrirHoja(html) { cuerpo.innerHTML = html; hoja.hidden = false; document.body.classList.add('sin-scroll'); hoja.querySelector('.pn-hoja__in').scrollTop = 0; }
  function cerrarHoja() { hoja.hidden = true; document.body.classList.remove('sin-scroll'); }
  $$('[data-cerrar]', hoja).forEach((b) => b.addEventListener('click', cerrarHoja));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !hoja.hidden) cerrarHoja(); });

  // teléfono de Uruguay a WhatsApp: 098 443 336 → 59898443336
  const waNum = (t) => { let d = String(t || '').replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.startsWith('0')) d = '598' + d.slice(1); else if (d.length === 8 && d.startsWith('9')) d = '598' + d; return d; };

  const PASOS = ESTADOS.filter((e) => e.id !== 'cancelado');
  const CORTO = { en_produccion: 'En producción' };

  function abrir(id) {
    const p = pedidos.find((x) => x.id === id); if (!p) return;
    const items = (p.items || []).map((i) => `
      <li class="pn-item">
        ${i.foto ? `<a class="pn-item__img" href="${esc(i.foto)}" target="_blank" rel="noopener"><img src="${esc(i.foto)}" alt="${esc(i.nombre)}"></a>` : '<span class="pn-item__img"></span>'}
        <div>
          <b>${i.cantidad > 1 ? i.cantidad + ' × ' : ''}${esc(i.nombre)}</b>
          ${(i.detalle || []).length ? `<ul class="pn-item__det">${i.detalle.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
          <small>${[i.tipo === 'stock' ? 'Pieza en stock' : i.tipo === 'manual' ? '' : 'A medida', i.min != null ? rango(i.min, i.max) : '', i.link ? `<a href="${esc(i.link)}" target="_blank" rel="noopener">ver en la web</a>` : ''].filter(Boolean).join(' · ')}</small>
        </div>
      </li>`).join('');
    const tel = waNum(p.telefono);
    const msg = encodeURIComponent(`Hola ${p.nombre.split(' ')[0]}, te escribo de Decora.te por tu pedido ${codigo(p.id)}.`);
    const idx = PASOS.findIndex((e) => e.id === p.estado);
    abrirHoja(`
      <p class="pn-hoja__cod">${codigo(p.id)} · ${fecha(p.creado, true)}${p.origen !== 'web' ? ' · por ' + esc(p.origen) : ''}</p>
      <h2 id="hoja-t">${esc(p.nombre)}</h2>
      <div class="pn-cliente">
        <div class="pn-cliente__datos">${p.telefono ? `<span>${esc(p.telefono)}</span>` : '<span>Sin teléfono</span>'}<span>Paga con ${esc(p.pago)}</span></div>
        ${p.telefono ? `<a class="pn-btn pn-btn--borde pn-btn--ancho" href="https://wa.me/${tel}?text=${msg}" target="_blank" rel="noopener">Escribirle por WhatsApp</a>` : ''}
        ${p.comentarios ? `<p class="pn-coment"><b>Comentario</b>${esc(p.comentarios)}</p>` : ''}
      </div>
      ${p.estado === 'cancelado' ? '<p class="pn-cancelado">Este pedido está cancelado. Tocá un paso de abajo para reactivarlo.</p>' : ''}

      <div class="pn-bloque" style="margin-top:8px">
        <h3 class="pn-bloque__t">Estado</h3>
        <div class="pn-pasos" data-estados>${PASOS.map((e, i) => `<button type="button" data-estado="${e.id}" class="${i < idx ? 'hecho' : ''}${i === idx ? ' actual' : ''}" aria-pressed="${i === idx}">${CORTO[e.id] || e.nombre}</button>`).join('')}</div>
      </div>

      <div class="pn-bloque">
        <h3 class="pn-bloque__t">Lo que pidió</h3>
        <ul class="pn-items">${items}</ul>
        <p class="pn-estimado">Total estimado en la web: <b>${rango(p.total_min, p.total_max)}</b></p>
      </div>

      <form data-form-pedido>
        <div class="pn-bloque">
          <h3 class="pn-bloque__t">Precio y entrega</h3>
          <div class="pn-campos">
            <label>Precio acordado <input type="number" name="precio_final" min="0" step="10" inputmode="numeric" value="${p.precio_final ?? ''}" placeholder="${p.total_min === p.total_max ? p.total_min : ''}"></label>
            <label>Fecha de entrega <input type="date" name="entrega" value="${p.entrega || ''}"></label>
          </div>
        </div>
        <div class="pn-bloque">
          <h3 class="pn-bloque__t">Cobro</h3>
          <div class="pn-cobro">
            <div class="pn-cobro__estado" data-cobro-estado></div>
            <label>Cobrado ($) <input type="number" name="cobrado" min="0" step="10" inputmode="numeric" value="${p.cobrado ?? ''}"></label>
            <label>Cómo <select name="cobro_medio"><option value="">—</option>${MEDIOS.map(([v, n]) => `<option value="${v}" ${p.cobro_medio === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label class="pn-ancho">Cuándo <input type="date" name="cobrado_el" value="${p.cobrado_el || ''}"></label>
          </div>
        </div>
        <div class="pn-bloque">
          <label>Notas (solo las ves vos) <textarea name="notas" rows="3" placeholder="Ej.: quiere el cuero un poco más oscuro">${esc(p.notas || '')}</textarea></label>
        </div>
        <div class="pn-pie">
          <button class="pn-btn" type="submit">Guardar</button>
          <div class="pn-pie__links">
            ${p.estado !== 'cancelado' ? '<button class="pn-link" type="button" data-cancelar>Cancelar pedido</button>' : ''}
            <button class="pn-link pn-link--peligro" type="button" data-borrar>Borrar</button>
          </div>
        </div>
      </form>`);

    const f = $('[data-form-pedido]', cuerpo);
    // cuánto falta cobrar, al día con lo que se escribe
    const estadoCobro = () => {
      const precio = num(f.precio_final.value), cob = num(f.cobrado.value) || 0, caja = $('[data-cobro-estado]', cuerpo);
      if (!precio) { caja.innerHTML = '<span>Poné el precio acordado para ver cuánto falta.</span>'; return; }
      const falta = precio - cob;
      caja.innerHTML = falta > 0
        ? `<span class="es-alerta">Falta cobrar ${money(falta)}</span><button class="pn-link" type="button" data-cobrar-todo>Cobrado todo, hoy</button>`
        : '<span class="es-ok">Cobrado</span>';
    };
    estadoCobro(); f.addEventListener('input', estadoCobro);
    cuerpo.addEventListener('click', (e) => {
      if (!e.target.closest('[data-cobrar-todo]')) return;
      const precio = f.precio_final.value || (p.total_min === p.total_max ? p.total_min : '');
      if (!precio) { aviso('Primero poné el precio acordado.', true); f.precio_final.focus(); return; }
      f.precio_final.value = precio; f.cobrado.value = precio; f.cobrado_el.value = hoy();
      if (!f.cobro_medio.value) f.cobro_medio.value = p.pago === 'efectivo' ? 'efectivo' : 'transferencia';
      estadoCobro();
    });
    f.addEventListener('submit', async (ev) => { ev.preventDefault(); await guardarPedido(p, datosDe(f)); });
    $('[data-estados]', cuerpo).addEventListener('click', async (e) => {
      const b = e.target.closest('[data-estado]'); if (!b || b.dataset.estado === p.estado) return;
      const nuevoEstado = b.dataset.estado, datos = datosDe(f);
      // se cobra todo antes de producir: avisa si no está cobrado
      if (['en_produccion', 'listo', 'entregado'].includes(nuevoEstado) && !(datos.cobrado > 0)
        && !confirm('Este pedido todavía no figura cobrado. ¿Lo pasás igual a «' + estadoNombre(nuevoEstado) + '»?')) return;
      await guardarPedido(p, { ...datos, estado: nuevoEstado });
    });
    const cancelar = $('[data-cancelar]', cuerpo);
    if (cancelar) cancelar.addEventListener('click', async () => { if (confirm('¿Cancelar este pedido?')) await guardarPedido(p, { ...datosDe(f), estado: 'cancelado' }); });
    $('[data-borrar]', cuerpo).addEventListener('click', async () => {
      if (!confirm(`¿Borrar el pedido ${codigo(p.id)} de ${p.nombre}? No se puede deshacer. Si no se hace, mejor cancelalo.`)) return;
      try {
        await api(`stock?pedido_id=eq.${p.id}&estado=eq.reservada`, { method: 'PATCH', body: JSON.stringify({ estado: 'disponible', pedido_id: null }) });
        await api(`pedidos?id=eq.${p.id}`, { method: 'DELETE' }); pedidos = pedidos.filter((x) => x.id !== p.id); cerrarHoja(); pintar(); aviso('Pedido borrado. Si tenía piezas de la tienda, volvieron a la venta.');
      }
      catch (e) { aviso(errorDe(e), true); }
    });
  }

  const num = (v) => (v === '' || v == null ? null : Math.round(Number(v)));
  function datosDe(f) {
    return {
      precio_final: num(f.precio_final.value), entrega: f.entrega.value || null,
      cobrado: num(f.cobrado.value), cobro_medio: f.cobro_medio.value || null, cobrado_el: f.cobrado_el.value || null,
      notas: f.notas.value.trim() || null,
    };
  }

  async function guardarPedido(p, datos) {
    try {
      const [r] = await api(`pedidos?id=eq.${p.id}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(datos) });
      Object.assign(p, r); pintar(); abrir(p.id); aviso('Guardado.');
    } catch (e) { aviso(errorDe(e), true); }
  }

  /* ---------------- cargar un pedido a mano (los que llegan por WhatsApp, Instagram o en persona) ---------------- */
  function nuevo() {
    abrirHoja(`
      <p class="pn-hoja__cod">Pedido nuevo</p>
      <h2 id="hoja-t">Cargar un pedido</h2>
      <p class="pn-hoja__sub">Para los que te llegan por WhatsApp, Instagram o en persona: así queda todo en un solo lugar.</p>
      <form data-form-nuevo>
        <div class="pn-bloque">
          <div class="pn-campos">
            <label class="pn-ancho">Nombre <input name="nombre" required maxlength="80"></label>
            <label>Teléfono <input name="telefono" inputmode="tel" maxlength="30" placeholder="09…"></label>
            <label>Por dónde llegó <select name="origen">${ORIGENES.filter((o) => o !== 'web').map((o) => `<option value="${o}">${o[0].toUpperCase() + o.slice(1)}</option>`).join('')}</select></label>
            <label class="pn-ancho">Qué pidió (una pieza por renglón) <textarea name="items" rows="3" required placeholder="Cinto faja cebra con hebilla flor&#10;Tarjetero suela"></textarea></label>
            <label>Precio acordado <input type="number" name="precio" min="0" step="10" inputmode="numeric" required></label>
            <label>Va a pagar con <select name="pago"><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option></select></label>
            <label class="pn-ancho">Fecha de entrega <input type="date" name="entrega"></label>
            <label class="pn-ancho">Notas <textarea name="notas" rows="2"></textarea></label>
          </div>
        </div>
        <div class="pn-pie"><button class="pn-btn" type="submit">Guardar pedido</button></div>
      </form>`);
    $('[data-form-nuevo]', cuerpo).addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = ev.target, precio = num(f.precio.value);
      const items = f.items.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 30).map((s) => ({ tipo: 'manual', nombre: s, cantidad: 1, detalle: [] }));
      if (!items.length) { aviso('Escribí qué pidió.', true); return; }
      try {
        const [r] = await api('pedidos', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({
          nombre: f.nombre.value.trim(), telefono: f.telefono.value.trim(), origen: f.origen.value, pago: f.pago.value,
          items, total_min: precio, total_max: precio, precio_final: precio, estado: 'confirmado',
          entrega: f.entrega.value || null, notas: f.notas.value.trim() || null,
        }) });
        pedidos.unshift(r); filtro = 'curso'; pintar(); abrir(r.id); aviso('Pedido cargado: ' + codigo(r.id) + '.');
      } catch (e) { aviso(errorDe(e), true); }
    });
  }

  /* =========================================================
     TIENDA: piezas únicas. Costo de cada pieza = materiales × su precio + otros gastos
     ========================================================= */
  const TALLES_PULSERA = [['XS', '13 a 14,5 cm'], ['S', '14,5 a 16 cm'], ['M', '16 a 17,5 cm'], ['L', '17,5 a 19 cm'], ['XL', '19 a 21 cm']];
  const CATS = [['cintos', 'Cintos'], ['tarjeteros', 'Tarjeteros'], ['porta-lentes', 'Estuches de lentes'], ['portafuegos', 'Portafuegos'], ['llaveros', 'Llaveros'], ['pulseras', 'Pulseras'], ['collares', 'Collares']];
  const SUBS = { cintos: [['decorativos', 'Decorativos'], ['funcionales', 'Funcionales']], pulseras: [['anchas', 'Anchas'], ['finas', 'Finas']] };
  const PREFIJO = { cintos: 'c', tarjeteros: 't', 'porta-lentes': 'p', portafuegos: 'pf', llaveros: 'l', pulseras: 'pu', collares: 'co' };
  const ESTADOS_ST = [['disponible', 'A la venta'], ['reservada', 'Reservada'], ['vendida', 'Vendida'], ['oculta', 'Oculta']];
  const GRUPOS = [['cuero', 'Cuero'], ['hebilla', 'Hebillas'], ['herraje', 'Herrajes'], ['dije', 'Dijes'], ['otro', 'Otros']];
  const catNombre = (id) => (CATS.find((c) => c[0] === id) || [, id])[1];
  const estadoSt = (id) => (ESTADOS_ST.find((e) => e[0] === id) || [, id])[1];
  const fotoUrl = (f, sm = true) => (/^https?:/.test(String(f)) ? f : `img/stock/${f}${sm ? '-sm' : ''}.jpg`);
  const pesos = (n) => money(Math.round(n));
  const precioPieza = (p) => `${p.desde ? 'desde ' : ''}${money(p.min)}${p.max > p.min ? '–' + money(p.max).slice(1) : ''}`;

  let stock = [], materiales = [], cueros = [], fSt = 'disponible', fCat = '';
  // "cuero:cebra" = el cuero por su nombre: cuesta lo que su grupo (retazo, intermedio…)
  const mat = (id) => {
    if (String(id).startsWith('cuero:')) { const c = cueros.find((x) => 'cuero:' + x.id === id); const g = c && c.grupo && materiales.find((m) => m.id === c.grupo); return g ? { ...g, id, nombre: c.nombre } : null; }
    return materiales.find((m) => m.id === id);
  };
  const costoDe = (p) => (p.materiales || []).reduce((s, x) => s + (mat(x.m) ? Number(mat(x.m).costo) * Number(x.c) : 0), 0) + (p.costo_extra || 0);

  async function cargarStock() {
    [stock, materiales, cueros] = await Promise.all([api('stock?select=*&order=orden.asc'), api('materiales?select=*&order=orden.asc'),
      api('cueros?select=*&order=orden.asc').catch(() => [])]);   // sin el SQL del paso 5 todavía: sin lista de cueros
  }

  function pintarStock() {
    const cuenta = (id) => stock.filter((p) => p.estado === id).length;
    const disp = cuenta('disponible'), res = cuenta('reservada'), vend = cuenta('vendida');
    $('[data-st-resumen]').innerHTML = [`<b>${disp}</b> a la venta`, res ? `<b>${res}</b> ${res === 1 ? 'reservada' : 'reservadas'}` : '', vend ? `<b>${vend}</b> ${vend === 1 ? 'vendida' : 'vendidas'}` : ''].filter(Boolean).join(' · ');
    const enEstado = stock.filter((p) => fSt === 'todas' || p.estado === fSt);
    $('[data-st-cats]').innerHTML = [['', 'Todas'], ...CATS].map(([id, n]) => {
      const c = enEstado.filter((p) => !id || p.cat === id).length;
      return c || !id || fCat === id ? `<button type="button" role="tab" aria-selected="${fCat === id}" data-st-cat="${id}">${n}<small>${c}</small></button>` : '';
    }).join('');
    const sel = $('[data-st-estado]');
    sel.innerHTML = [...ESTADOS_ST, ['todas', 'Todas']].map(([id, n]) => `<option value="${id}" ${fSt === id ? 'selected' : ''}>${n} (${id === 'todas' ? stock.length : cuenta(id)})</option>`).join('');
    const lista = enEstado.filter((p) => !fCat || p.cat === fCat);
    $('[data-st-lista]').innerHTML = lista.length ? lista.map((p) => `
      <button class="pn-pieza${['vendida', 'oculta'].includes(p.estado) ? ' pn-pieza--apagada' : ''}" type="button" data-pieza="${esc(p.id)}">
        <span class="pn-pieza__img">${p.fotos && p.fotos.length ? `<img src="${esc(fotoUrl(p.portada || p.fotos[0]))}" alt="" loading="lazy">` : ''}${p.estado !== 'disponible' ? `<span class="pn-pieza__estado pn-pieza__estado--${p.estado}">${estadoSt(p.estado)}</span>` : ''}</span>
        <span class="pn-pieza__n">${esc(p.name)}</span>
        <span class="pn-pieza__p">${precioPieza(p)}<small>${esc(p.id.toUpperCase())}</small></span>
      </button>`).join('') : '<p class="pn-vacio" style="grid-column:1/-1">No hay piezas acá.</p>';
  }
  $('[data-st-cats]').addEventListener('click', (e) => { const b = e.target.closest('[data-st-cat]'); if (b) { fCat = b.dataset.stCat; pintarStock(); } });
  $('[data-st-estado]').addEventListener('change', (e) => { fSt = e.target.value; pintarStock(); });
  $('[data-st-lista]').addEventListener('click', (e) => { const b = e.target.closest('[data-pieza]'); if (b) abrirPieza(stock.find((p) => p.id === b.dataset.pieza)); });
  $('[data-pieza-nueva]').addEventListener('click', () => abrirPieza(null));

  // ---- ficha de una pieza (o una nueva)
  function opcionesMat(sel) {
    const porNombre = cueros.length ? `<optgroup label="Cuero, por nombre">${cueros.map((c) => { const m = mat('cuero:' + c.id); return `<option value="cuero:${esc(c.id)}" ${'cuero:' + c.id === sel ? 'selected' : ''}>${esc(c.nombre)}${m ? ` (${money(m.costo)} / m²)` : ' (sin grupo)'}</option>`; }).join('')}</optgroup>` : '';
    return porNombre + GRUPOS.map(([g, n]) => `<optgroup label="${n}">${materiales.filter((m) => m.grupo === g).map((m) => `<option value="${esc(m.id)}" ${m.id === sel ? 'selected' : ''}>${esc(m.nombre)} (${money(m.costo)} / ${esc(m.unidad)})</option>`).join('')}</optgroup>`).join('');
  }
  const filaMat = (x = { m: 'cuero-retazo', c: '' }) => `<div class="pn-mat" data-mat-fila>
      <select name="m" aria-label="Material">${opcionesMat(x.m)}</select>
      <input name="c" type="number" step="any" min="0" inputmode="decimal" value="${x.c}" aria-label="Cantidad">
      <span class="pn-mat__sub" data-sub></span>
      <button type="button" class="pn-mat__x" data-quitar aria-label="Quitar">×</button>
    </div>`;

  function abrirPieza(p) {
    const nueva = !p;
    p = p || { id: '', cat: fCat || 'cintos', sub: null, name: '', fotos: [], portada: null, min: '', max: '', desde: false, confirmar: false, largo: null, talle: null, estado: 'disponible', materiales: [], costo_extra: 0, notas: '' };
    const fotos = [...(p.fotos || [])];
    abrirHoja(`
      <p class="pn-hoja__cod">${nueva ? 'Pieza nueva' : esc(p.id.toUpperCase()) + ' · ' + catNombre(p.cat)}</p>
      <h2 id="hoja-t">${nueva ? 'Agregar una pieza' : esc(p.name)}</h2>
      <div class="pn-bloque">
        <div class="pn-fotos" data-fotos></div>
        <p class="pn-ayuda">La primera es la portada de la tienda. Tocá otra foto para ponerla primera.</p>
      </div>
      <form data-form-pieza>
        <div class="pn-bloque">
          <div class="pn-campos">
            <label class="pn-ancho">Nombre <input name="name" required maxlength="90" value="${esc(p.name)}"></label>
            <label>Categoría <select name="cat">${CATS.map(([id, n]) => `<option value="${id}" ${p.cat === id ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label>Tipo <select name="sub" data-sub-sel></select></label>
            <label data-solo-cinto>Largo (cm) <input name="largo" type="number" min="0" step="1" inputmode="numeric" value="${p.largo ?? ''}"></label>
            <label data-solo-cinto>Talle <input name="talle" type="number" readonly value="${p.cat === 'cintos' ? p.talle ?? '' : ''}" tabindex="-1" placeholder="sale del largo"></label>
            <label data-solo-pulsera class="pn-ancho">Talle <select name="talle_p"><option value="">Sin talle</option>${TALLES_PULSERA.map(([t, cm]) => `<option value="${t}" ${p.talle === t ? 'selected' : ''}>${t} (${cm})</option>`).join('')}</select></label>
          </div>
        </div>
        <div class="pn-bloque">
          <h3 class="pn-bloque__t">Precio</h3>
          <div class="pn-campos">
            <label>Precio <input name="min" type="number" min="0" step="10" inputmode="numeric" required value="${p.min}"></label>
            <label>Hasta (si es un rango) <input name="max" type="number" min="0" step="10" inputmode="numeric" value="${p.max > p.min ? p.max : ''}"></label>
            <label class="pn-check pn-ancho"><input type="checkbox" name="desde" ${p.desde ? 'checked' : ''}> Mostrar «desde» antes del precio</label>
            <label class="pn-check pn-ancho"><input type="checkbox" name="confirmar" ${p.confirmar ? 'checked' : ''}> Precio a confirmar por WhatsApp</label>
          </div>
        </div>
        <div class="pn-bloque">
          <h3 class="pn-bloque__t">Estado</h3>
          <div class="pn-seg" role="radiogroup">${ESTADOS_ST.map(([id, n]) => `<label><input type="radio" name="estado" value="${id}" ${p.estado === id ? 'checked' : ''}><span>${n}</span></label>`).join('')}</div>
        </div>
        <details class="pn-costos" data-costos>
          <summary><h3 class="pn-bloque__t">Costo y ganancia</h3><span class="pn-costos__res" data-costo></span></summary>
          <div class="pn-costos__in">
            <div class="pn-mat__cab"><span>Material</span><span>Cantidad</span><span style="text-align:right">Costo</span><span></span></div>
            <div data-mats>${(p.materiales || []).map(filaMat).join('')}</div>
            <div class="pn-costos__fila">
              <button class="pn-link" type="button" data-mat-mas>Agregar material</button>
              <label>Otros gastos ($) <input name="costo_extra" type="number" min="0" step="1" inputmode="numeric" value="${p.costo_extra || 0}"></label>
            </div>
          </div>
        </details>
        <div class="pn-bloque">
          <label>Notas (solo las ves vos) <textarea name="notas" rows="2">${esc(p.notas || '')}</textarea></label>
        </div>
        <div class="pn-pie">
          <button class="pn-btn" type="submit">${nueva ? 'Agregar a la tienda' : 'Guardar'}</button>
          ${nueva ? '' : '<div class="pn-pie__links"><button class="pn-link pn-link--peligro" type="button" data-borrar-pieza>Borrar pieza</button></div>'}
        </div>
      </form>`);
    const f = $('[data-form-pieza]', cuerpo);
    const subSel = () => {
      const subs = SUBS[f.cat.value] || [];
      f.sub.innerHTML = subs.length ? subs.map(([id, n]) => `<option value="${id}" ${p.sub === id ? 'selected' : ''}>${n}</option>`).join('') : '<option value="">—</option>';
      f.sub.closest('label').hidden = !subs.length;
      $$('[data-solo-cinto]', f).forEach((el) => { el.hidden = f.cat.value !== 'cintos'; });
      $$('[data-solo-pulsera]', f).forEach((el) => { el.hidden = f.cat.value !== 'pulseras'; });
    };
    subSel(); f.cat.addEventListener('change', subSel);
    f.largo.addEventListener('input', () => { f.talle.value = f.largo.value ? 5 * Math.round(f.largo.value / 5) : ''; });

    const leerMats = () => $$('[data-mat-fila]', f).map((r) => ({ m: r.querySelector('[name=m]').value, c: Number(r.querySelector('[name=c]').value) || 0 })).filter((x) => x.c > 0);
    const recalcular = () => {
      $$('[data-mat-fila]', f).forEach((r) => {
        const m = mat(r.querySelector('[name=m]').value), c = Number(r.querySelector('[name=c]').value) || 0;
        r.querySelector('[data-sub]').textContent = m && c ? pesos(m.costo * c) : '';
      });
      const mats = leerMats(), costo = costoDe({ materiales: mats, costo_extra: Number(f.costo_extra.value) || 0 }), precio = Number(f.min.value) || 0;
      $('[data-costo]', f).innerHTML = !mats.length && !costo ? '<span class="pn-sin">Sin materiales cargados</span>'
        : `Costo <b>${pesos(costo)}</b>${precio ? ` · ganás <b>${pesos(precio - costo)}</b> (${Math.round((precio - costo) / precio * 100)}%)` : ''}`;
    };
    f.addEventListener('input', recalcular); f.addEventListener('change', recalcular);
    $('[data-mat-mas]', f).addEventListener('click', () => { $('[data-mats]', f).insertAdjacentHTML('beforeend', filaMat()); recalcular(); });
    $('[data-mats]', f).addEventListener('click', (e) => { if (e.target.closest('[data-quitar]')) { e.target.closest('[data-mat-fila]').remove(); recalcular(); } });
    recalcular();

    // fotos: subir (se achican a 1600 px), elegir la primera, quitar
    const pintarFotos = () => {
      $('[data-fotos]', cuerpo).innerHTML = fotos.map((x, i) => `<div class="pn-foto${i ? '' : ' es-primera'}"><button type="button" data-primera="${i}" aria-label="Poner primera"><img src="${esc(fotoUrl(x))}" alt=""></button><button type="button" class="pn-foto__x" data-quitar-foto="${i}" aria-label="Quitar foto">×</button></div>`).join('')
        + '<label class="pn-subir">Subir fotos<input type="file" accept="image/*" multiple data-subir hidden></label>';
    };
    pintarFotos();
    $('[data-fotos]', cuerpo).addEventListener('click', (e) => {
      const a = e.target.closest('[data-primera]'), q = e.target.closest('[data-quitar-foto]');
      if (q) { fotos.splice(+q.dataset.quitarFoto, 1); pintarFotos(); }
      else if (a) { const [x] = fotos.splice(+a.dataset.primera, 1); fotos.unshift(x); pintarFotos(); }
    });
    $('[data-fotos]', cuerpo).addEventListener('change', async (e) => {
      if (!e.target.matches('[data-subir]')) return;
      const files = Array.from(e.target.files || []); e.target.value = '';
      for (const file of files) {
        try { aviso('Subiendo foto…'); fotos.push(await subirFotoStock(file)); pintarFotos(); aviso('Foto subida.'); }
        catch (err) { aviso('No se pudo subir la foto. ' + errorDe(err), true); }
      }
    });

    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const min = num(f.min.value), max = Math.max(min, num(f.max.value) || 0);
      if (!fotos.length && !confirm('La pieza no tiene fotos. ¿Guardar igual?')) return;
      const datos = {
        name: f.name.value.trim(), cat: f.cat.value, sub: (SUBS[f.cat.value] ? f.sub.value : null) || null,
        min, max, desde: f.desde.checked, confirmar: f.confirmar.checked,
        largo: f.cat.value === 'cintos' ? num(f.largo.value) : null, talle: f.cat.value === 'cintos' ? (num(f.talle.value) ? String(num(f.talle.value)) : null) : f.cat.value === 'pulseras' ? f.talle_p.value || null : null,
        estado: f.estado.value, materiales: leerMats(), costo_extra: num(f.costo_extra.value) || 0, notas: f.notas.value.trim() || null,
        fotos: fotos.map(String), portada: fotos.length ? String(fotos[0]) : null, hover: fotos.length > 1 && p.hover && fotos.map(String).includes(String(p.hover)) ? String(p.hover) : null,
      };
      try {
        if (nueva) {
          const pre = PREFIJO[datos.cat] || 'x';
          const usados = stock.filter((x) => x.id.startsWith(pre) && /^\d+$/.test(x.id.slice(pre.length))).map((x) => +x.id.slice(pre.length));
          datos.id = pre + (Math.max(0, ...usados) + 1);
          datos.orden = Math.max(0, ...stock.map((x) => x.orden || 0)) + 10;
          const [r] = await api('stock', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(datos) });
          stock.push(r); aviso('Pieza agregada: ' + r.id.toUpperCase() + '. Ya está en la tienda.');
          abrirPieza(r);
        } else {
          const [r] = await api(`stock?id=eq.${encodeURIComponent(p.id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(datos) });
          Object.assign(p, r); aviso('Guardado.'); abrirPieza(p);
        }
        pintarStock();
      } catch (err) { aviso(errorDe(err), true); }
    });
    const borrar = $('[data-borrar-pieza]', cuerpo);
    if (borrar) borrar.addEventListener('click', async () => {
      if (!confirm(`¿Borrar «${p.name}»? No se puede deshacer. Si se vendió, mejor marcala «Vendida» (así queda para las cuentas).`)) return;
      try { await api(`stock?id=eq.${encodeURIComponent(p.id)}`, { method: 'DELETE' }); stock = stock.filter((x) => x.id !== p.id); cerrarHoja(); pintarStock(); aviso('Pieza borrada.'); }
      catch (err) { aviso(errorDe(err), true); }
    });
  }

  // achica la foto en el celular (1600 px, jpeg) y la sube a la carpeta "stock" de Supabase
  async function subirFotoStock(file) {
    const img = await new Promise((ok, mal) => { const u = URL.createObjectURL(file), i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = u; });
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    const blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', 0.85));
    const path = `${new Date().toISOString().slice(0, 7)}/${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}.jpg`;
    const t = await token();
    const r = await fetch(`${URL_}/storage/v1/object/stock/${path}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${t}`, 'Content-Type': 'image/jpeg' }, body: blob });
    if (!r.ok) throw new Error(`(${r.status}) ${(await r.text()).slice(0, 120)}`);
    return `${URL_}/storage/v1/object/public/stock/${path}`;
  }

  /* =========================================================
     PRECIOS Y COSTOS: lo que cobrás (armador) y lo que te cuesta (materiales). Se guarda solo al cambiar.
     ========================================================= */
  const GRUPOS_PR = [['cinto', 'Cintos a medida', 'El precio base. Lo de abajo (hebilla, unión, decoración) se suma.'], ['hebilla', 'Hebillas', 'Lo que se suma al cinto según la hebilla.'],
    ['union', 'Uniones', 'Cuando el cinto lleva dos cueros.'], ['deco', 'Decoración del cinto', ''], ['pieza', 'Las demás piezas', 'El «desde» de cada categoría en la web se calcula solo, con el más barato.']];
  let precios = [], pcVista = 'cobras';
  async function cargarPrecios() { [precios] = await Promise.all([api('precios?select=*&order=orden.asc'), cargarStock()]); }

  const marcar = (fila) => { fila.classList.remove('guardado'); void fila.offsetWidth; fila.classList.add('guardado'); };

  // foto de una hebilla o un dije a partir de su id (hebilla:flor-bronce, hebilla-flor-bronce, dije-ala…)
  const fotoDe = (id) => { const m = String(id).match(/^(hebilla|dije)[:-](.+)$/); return m ? `img/${m[1]}-${m[2]}.png` : ''; };
  const imgDe = (id) => { const f = fotoDe(id); return f ? `<span class="pn-mini"><img src="${f}" alt="" loading="lazy" onerror="this.parentNode.remove()"></span>` : ''; };

  function pintarPrecios() {
    $('[data-pr-lista]').innerHTML = `<div class="pn-pc">${GRUPOS_PR.map(([g, n, sub]) => {
      const ps = precios.filter((x) => x.grupo === g); if (!ps.length) return '';
      if (g === 'hebilla') return `<div class="pn-pc-grupo pn-pc-grupo--tiles"><h2>${n}</h2>${sub ? `<p>${sub}</p>` : ''}<div class="pn-tiles">${ps.map((x) => `
        <div class="pn-tile" data-pr="${esc(x.id)}">
          <span class="pn-tile__img">${fotoDe(x.id) ? `<img src="${fotoDe(x.id)}" alt="" loading="lazy">` : ''}</span>
          <span class="pn-tile__n">${esc(x.nombre)}</span>
          <label class="pn-monto">$ <input name="precio" type="number" step="1" min="0" inputmode="numeric" value="${x.precio}" aria-label="Precio de ${esc(x.nombre)}"></label>
        </div>`).join('')}</div></div>`;
      return `<div class="pn-pc-grupo"><h2>${n}</h2>${sub ? `<p>${sub}</p>` : ''}<div class="pn-tabla">${ps.map((x) => `
        <div class="pn-fila" data-pr="${esc(x.id)}">
          <span class="pn-fila__n">${esc(x.nombre)}</span>
          <span class="pn-fila__vals">
            <label class="pn-monto">$ <input name="precio" type="number" step="1" min="0" inputmode="numeric" value="${x.precio}" aria-label="Precio de ${esc(x.nombre)}"></label>
            ${x.precio_max != null ? `<label class="pn-monto"><small>a</small> $ <input name="precio_max" type="number" step="1" min="0" inputmode="numeric" value="${x.precio_max}" aria-label="Precio máximo de ${esc(x.nombre)}"></label>` : ''}
          </span>
        </div>`).join('')}</div></div>`;
    }).join('')}</div>` || '<p class="pn-vacio">No hay precios cargados.</p>';
  }
  $('[data-pr-lista]').addEventListener('change', async (e) => {
    const fila = e.target.closest('[data-pr]'); if (!fila) return;
    const x = precios.find((r) => r.id === fila.dataset.pr), pr = $('[name=precio]', fila), mx = $('[name=precio_max]', fila);
    if (pr.value === '') { pr.value = x.precio; return; }
    const datos = { precio: Math.round(Number(pr.value)) || 0 };
    if (mx) datos.precio_max = Math.max(datos.precio, Math.round(Number(mx.value)) || datos.precio);
    try {
      const [r] = await api(`precios?id=eq.${encodeURIComponent(x.id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(datos) });
      Object.assign(x, r); if (mx) mx.value = x.precio_max; marcar(fila);
      aviso(`${x.nombre}: ${x.precio_max != null && x.precio_max !== x.precio ? rango(x.precio, x.precio_max) : money(x.precio)}. Ya se ve en la web.`);
    } catch (err) { aviso(errorDe(err), true); }
  });

  function pintarMateriales() {
    const gruposCuero = materiales.filter((m) => m.grupo === 'cuero');
    const nombreGrupo = (m) => m.nombre.replace(/^Cuero /i, '').replace(/[()]/g, '').replace(/^./, (l) => l.toUpperCase());
    const sinGrupo = cueros.filter((c) => !c.grupo).length;
    const fila = (m) => `
      <div class="pn-fila pn-fila--mat${fotoDe(m.id) ? ' pn-fila--foto' : ''}" data-mat="${esc(m.id)}">
        ${imgDe(m.id)}
        <input class="pn-fila__nombre" name="nombre" value="${esc(m.nombre)}" aria-label="Nombre">
        <label class="pn-monto">$ <input name="costo" type="number" step="any" min="0" inputmode="decimal" value="${Number(m.costo)}" aria-label="Costo de ${esc(m.nombre)}"> <small>/ ${esc(m.unidad)}</small></label>
        <input class="pn-fila__nota" name="nota" value="${esc(m.nota || '')}" placeholder="Nota" aria-label="Nota">
      </div>`;
    const lista = GRUPOS.map(([g, n]) => {
      const ms = materiales.filter((m) => m.grupo === g); if (!ms.length) return '';
      return `<div class="pn-pc-grupo"><h2>${n}</h2>${g === 'cuero' ? '<p>Precio por m² de cada grupo. Abajo, en «Cada cuero», elegís a qué grupo va cada uno.</p>' : ''}<div class="pn-tabla">${ms.map(fila).join('')}</div></div>`;
    }).join('');
    const cuerosHtml = cueros.length ? `<div class="pn-pc-grupo"><h2>Cada cuero</h2><p>A qué grupo pertenece cada cuero${sinGrupo ? ` · <span class="pn-sin">${sinGrupo} sin definir</span>` : ''}.</p>
      <div class="pn-cueros">${cueros.map((c) => `
        <label class="pn-cuero${c.grupo ? '' : ' sin-grupo'}">
          <span class="pn-cuero__img" style="background-image:url(img/cuero-${esc(c.id)}-sm.jpg)"></span>
          <span class="pn-cuero__txt">${esc(c.nombre)}
            <select data-cuero="${esc(c.id)}" aria-label="Grupo de ${esc(c.nombre)}"><option value="">Sin definir</option>${gruposCuero.map((m) => `<option value="${esc(m.id)}" ${m.id === c.grupo ? 'selected' : ''}>${esc(nombreGrupo(m))} · ${money(m.costo)}/m²</option>`).join('')}</select>
          </span>
        </label>`).join('')}</div></div>` : '';
    // los materiales en columnas; cada cuero, a lo ancho abajo
    $('[data-mat-lista]').innerHTML = `<div class="pn-pc">${lista}</div>` + cuerosHtml.replace('class="pn-pc-grupo"', 'class="pn-pc-grupo pn-pc-grupo--ancho"');
  }
  $('[data-mat-lista]').addEventListener('change', async (e) => {
    const sel = e.target.closest('[data-cuero]');
    if (sel) {
      const c = cueros.find((x) => x.id === sel.dataset.cuero);
      try {
        await api(`cueros?id=eq.${encodeURIComponent(c.id)}`, { method: 'PATCH', body: JSON.stringify({ grupo: sel.value || null }) });
        c.grupo = sel.value || null; sel.closest('.pn-cuero').classList.toggle('sin-grupo', !c.grupo); aviso(`${c.nombre}: guardado.`);
      } catch (err) { aviso(errorDe(err), true); }
      return;
    }
    const fila = e.target.closest('[data-mat]'); if (!fila) return;
    const m = materiales.find((x) => x.id === fila.dataset.mat), nombre = $('[name=nombre]', fila).value.trim();
    if (!nombre) { $('[name=nombre]', fila).value = m.nombre; return; }
    try {
      const [r] = await api(`materiales?id=eq.${encodeURIComponent(m.id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ nombre, costo: Number($('[name=costo]', fila).value) || 0, nota: $('[name=nota]', fila).value.trim() || null }) });
      Object.assign(m, r); marcar(fila); aviso(`${m.nombre}: guardado. Los costos se recalcularon.`);
    } catch (err) { aviso(errorDe(err), true); }
  });
  $('[data-mat-nuevo]').addEventListener('click', () => {
    abrirHoja(`<p class="pn-hoja__cod">Precios y costos</p><h2 id="hoja-t">Agregar material</h2>
      <form data-form-mat>
        <div class="pn-bloque">
          <div class="pn-campos">
            <label class="pn-ancho">Nombre <input name="nombre" required placeholder="Ej.: Hebilla ovalada chica"></label>
            <label>Tipo <select name="grupo">${GRUPOS.map(([g, n]) => `<option value="${g}">${n}</option>`).join('')}</select></label>
            <label>Se cuenta por <select name="unidad"><option value="unidad">unidad</option><option value="m²">m²</option><option value="metro">metro</option><option value="kg">kg</option></select></label>
            <label>Costo ($) <input name="costo" type="number" step="any" min="0" required></label>
            <label>Nota <input name="nota" placeholder="Opcional"></label>
          </div>
        </div>
        <div class="pn-pie"><button class="pn-btn" type="submit">Agregar</button></div>
      </form>`);
    $('[data-form-mat]', cuerpo).addEventListener('submit', async (ev) => {
      ev.preventDefault(); const f = ev.target;
      const id = f.grupo.value + '-' + f.nombre.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      try {
        const [r] = await api('materiales', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ id, nombre: f.nombre.value.trim(), grupo: f.grupo.value, unidad: f.unidad.value, costo: Number(f.costo.value) || 0, nota: f.nota.value.trim() || null, orden: 1000 }) });
        materiales.push(r); cerrarHoja(); pintarMateriales(); aviso('Material agregado.');
      } catch (err) { aviso(errorDe(err), true); }
    });
  });
  $('[data-pc-tabs]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-pc]'); if (!b) return;
    pcVista = b.dataset.pc;
    $$('[data-pc]').forEach((x) => x.setAttribute('aria-selected', x === b));
    $$('[data-pc-vista]').forEach((v) => { v.hidden = v.dataset.pcVista !== pcVista; });
  });

  /* ---------------- secciones (se recuerda en la dirección: #tienda, #precios) ---------------- */
  async function ir(v) {
    if (!SECCIONES.includes(v)) v = 'pedidos';
    mostrar(v); window.scrollTo(0, 0);
    if (location.hash.slice(1) !== (v === 'pedidos' ? '' : v)) history.replaceState(null, '', v === 'pedidos' ? location.pathname : '#' + v);
    try {
      if (v === 'pedidos') await cargar();
      else if (v === 'tienda') { await cargarStock(); pintarStock(); }
      else { await cargarPrecios(); pintarPrecios(); pintarMateriales(); }
    } catch (err) {
      aviso(/42P01|does not exist|404/.test(String(err.message)) ? (v === 'precios' ? 'Falta correr en Supabase el SQL del paso 6 (06-precios.sql).' : 'Falta correr en Supabase el SQL del paso 4 (04-stock.sql).') : errorDe(err), true);
    }
  }
  $('[data-nav]').addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b) ir(b.dataset.ir); });

  /* ---------------- arranque ---------------- */
  async function arrancar() {
    if (!(await token())) { mostrar('entrar'); return; }
    let esAdmin = false;
    try { esAdmin = await api('rpc/es_admin', { method: 'POST', body: '{}' }); } catch (e) { aviso(errorDe(e), true); mostrar('entrar'); return; }
    if (!esAdmin) { mostrar('sin-permiso'); return; }
    const v = location.hash.slice(1);
    await ir(SECCIONES.includes(v) ? v : 'pedidos');
    // el número de pedidos nuevos en el menú, aunque se entre por otra sección
    if (v && v !== 'pedidos') api('pedidos?select=id&estado=eq.nuevo').then((r) => { $('[data-nav-nuevos]').textContent = r.length || ''; }).catch(() => {});
  }

  // vuelve del mail (invitación o "me olvidé"): la sesión viene en el link; se pide elegir contraseña
  const h = new URLSearchParams(location.hash.slice(1));
  if (h.get('access_token')) {
    guardar({ access_token: h.get('access_token'), refresh_token: h.get('refresh_token'), expires_in: +h.get('expires_in') || 3600 });
    history.replaceState(null, '', location.pathname);
    if (['invite', 'recovery', 'signup'].includes(h.get('type'))) mostrar('clave'); else arrancar();
  } else if (h.get('error_description')) {
    history.replaceState(null, '', location.pathname);
    mostrar('entrar');
    $('[data-form-entrar] [data-err]').textContent = /expired/i.test(h.get('error_description')) ? 'El link del mail ya venció. Tocá «Me olvidé la contraseña» para recibir otro.' : h.get('error_description');
  } else arrancar();

  // al volver a la pestaña, se actualiza la lista (por si entró un pedido)
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('[data-vista="pedidos"]').hidden && hoja.hidden) cargar().catch(() => {}); });
})();
