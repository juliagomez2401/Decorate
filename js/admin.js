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
  function mostrar(v) {
    $$('[data-vista]').forEach((el) => { el.hidden = el.dataset.vista !== v; });
    $('[data-salir]').hidden = !(v === 'pedidos' || v === 'sin-permiso');
  }
  let avisoT;
  function aviso(txt, error) {
    const a = $('[data-aviso]'); a.textContent = txt; a.classList.toggle('es-error', !!error); a.classList.add('is-on');
    clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.remove('is-on'), error ? 6000 : 2600);
  }
  const errorDe = (e) => {
    const m = String(e.message || e);
    if (/invalid login|invalid_credentials/i.test(m)) return 'El mail o la contraseña no coinciden.';
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

  /* ---------------- pedidos ---------------- */
  let pedidos = [], filtro = 'activos', busca = '';

  async function cargar() {
    pedidos = await api('pedidos?select=*&order=creado.desc&limit=500');
    pintar();
  }

  const activo = (p) => !['entregado', 'cancelado'].includes(p.estado);
  const total = (p) => (p.precio_final != null ? money(p.precio_final) : rango(p.total_min, p.total_max));
  const debe = (p) => p.estado !== 'cancelado' && p.precio_final != null && (p.cobrado || 0) < p.precio_final;

  function pintar() {
    // resumen de arriba
    const act = pedidos.filter(activo);
    const nuevos = pedidos.filter((p) => p.estado === 'nuevo').length;
    const porCobrar = act.filter(debe).reduce((s, p) => s + p.precio_final - (p.cobrado || 0), 0);
    const proximas = act.filter((p) => p.entrega && p.entrega <= new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)).length;
    $('[data-resumen]').innerHTML = `
      <div><b>${nuevos}</b><span>nuevos sin ver</span></div>
      <div><b>${act.length}</b><span>en curso</span></div>
      <div><b>${proximas}</b><span>para entregar esta semana</span></div>
      <div><b>${money(porCobrar)}</b><span>por cobrar</span></div>`;
    // pestañas
    const cuenta = (id) => (id === 'activos' ? act.length : id === 'todos' ? pedidos.length : pedidos.filter((p) => p.estado === id).length);
    $('[data-tabs]').innerHTML = [['activos', 'En curso'], ...ESTADOS.map((e) => [e.id, e.nombre]), ['todos', 'Todos']]
      .map(([id, n]) => `<button type="button" role="tab" aria-selected="${filtro === id}" data-tab="${id}">${n} <small>${cuenta(id)}</small></button>`).join('');
    // lista
    const q = busca.toLowerCase().replace(/\s+/g, '');
    const lista = pedidos.filter((p) => (filtro === 'todos' ? true : filtro === 'activos' ? activo(p) : p.estado === filtro))
      .filter((p) => !q || `${codigo(p.id)}${p.nombre}${p.telefono}`.toLowerCase().replace(/\s+/g, '').includes(q));
    $('[data-lista]').innerHTML = lista.length ? lista.map((p) => {
      const foto = (p.items || []).map((i) => i.foto).find(Boolean);
      const que = (p.items || []).map((i) => (i.cantidad > 1 ? i.cantidad + ' × ' : '') + i.nombre).join(' · ');
      return `<button class="ad-fila ad-fila--${p.estado}" type="button" data-abrir="${p.id}">
        <span class="ad-fila__img">${foto ? `<img src="${esc(foto)}" alt="" loading="lazy">` : ''}</span>
        <span class="ad-fila__txt">
          <span class="ad-fila__arriba"><b>${esc(p.nombre)}</b><small>${codigo(p.id)} · ${fecha(p.creado)}${p.origen !== 'web' ? ' · ' + esc(p.origen) : ''}</small></span>
          <span class="ad-fila__que">${esc(que)}</span>
          <span class="ad-fila__abajo">
            <span class="ad-chip ad-chip--${p.estado}">${estadoNombre(p.estado)}</span>
            ${p.entrega ? `<span class="ad-dato">Entrega ${fecha(p.entrega)}</span>` : ''}
            ${p.estado !== 'cancelado' ? (debe(p) ? '<span class="ad-dato ad-dato--debe">Sin cobrar</span>' : p.cobrado ? '<span class="ad-dato ad-dato--ok">Cobrado</span>' : '') : ''}
          </span>
        </span>
        <span class="ad-fila__total">${total(p)}</span>
      </button>`;
    }).join('') : `<p class="ad-vacio">${pedidos.length ? 'No hay pedidos acá.' : 'Todavía no entró ningún pedido.'}</p>`;
  }

  $('[data-tabs]').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { filtro = b.dataset.tab; pintar(); } });
  $('[data-buscar]').addEventListener('input', (e) => { busca = e.target.value; pintar(); });
  $('[data-lista]').addEventListener('click', (e) => { const b = e.target.closest('[data-abrir]'); if (b) abrir(+b.dataset.abrir); });
  $('[data-nuevo]').addEventListener('click', () => nuevo());

  /* ---------------- hoja de detalle ---------------- */
  const hoja = $('[data-hoja]'), cuerpo = $('[data-hoja-cuerpo]');
  let abierto = null;
  function abrirHoja(html) { cuerpo.innerHTML = html; hoja.hidden = false; document.body.classList.add('sin-scroll'); hoja.querySelector('.ad-hoja__in').scrollTop = 0; }
  function cerrarHoja() { hoja.hidden = true; document.body.classList.remove('sin-scroll'); abierto = null; }
  $$('[data-cerrar]', hoja).forEach((b) => b.addEventListener('click', cerrarHoja));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !hoja.hidden) cerrarHoja(); });

  // teléfono de Uruguay a WhatsApp: 098 443 336 → 59898443336
  const waNum = (t) => { let d = String(t || '').replace(/\D/g, ''); if (d.startsWith('00')) d = d.slice(2); if (d.startsWith('0')) d = '598' + d.slice(1); else if (d.length === 8 && d.startsWith('9')) d = '598' + d; return d; };

  function abrir(id) {
    const p = pedidos.find((x) => x.id === id); if (!p) return;
    abierto = p;
    const items = (p.items || []).map((i) => `
      <li class="ad-item">
        ${i.foto ? `<a class="ad-item__img" href="${esc(i.foto)}" target="_blank" rel="noopener"><img src="${esc(i.foto)}" alt="${esc(i.nombre)}"></a>` : '<span class="ad-item__img"></span>'}
        <div>
          <b>${i.cantidad > 1 ? i.cantidad + ' × ' : ''}${esc(i.nombre)}</b>
          ${(i.detalle || []).length ? `<ul class="ad-item__det">${i.detalle.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
          <small>${i.tipo === 'stock' ? 'Pieza en stock' : i.tipo === 'manual' ? '' : 'A medida'}${i.min != null ? ' · ' + rango(i.min, i.max) : ''}${i.link ? ` · <a href="${esc(i.link)}" target="_blank" rel="noopener">ver en la web</a>` : ''}</small>
        </div>
      </li>`).join('');
    const tel = waNum(p.telefono);
    const msg = encodeURIComponent(`Hola ${p.nombre.split(' ')[0]}, te escribo de Decora.te por tu pedido ${codigo(p.id)}.`);
    abrirHoja(`
      <p class="ad-hoja__cod">${codigo(p.id)} · ${fecha(p.creado, true)}${p.origen !== 'web' ? ' · cargado a mano (' + esc(p.origen) + ')' : ''}</p>
      <h2 id="hoja-t">${esc(p.nombre)}</h2>
      <div class="ad-cliente">
        ${p.telefono ? `<span>${esc(p.telefono)}</span><a class="ad-btn ad-btn--wa" href="https://wa.me/${tel}?text=${msg}" target="_blank" rel="noopener">Escribirle por WhatsApp</a>` : '<span>Sin teléfono</span>'}
        <span>Paga con ${esc(p.pago)}</span>
      </div>
      ${p.comentarios ? `<p class="ad-coment"><b>Comentario del cliente:</b> ${esc(p.comentarios)}</p>` : ''}

      <h3>Estado</h3>
      <div class="ad-estados" data-estados>${ESTADOS.map((e) => `<button type="button" class="ad-chip ad-chip--${e.id}" data-estado="${e.id}" aria-pressed="${p.estado === e.id}">${e.nombre}</button>`).join('')}</div>

      <h3>Lo que pidió</h3>
      <ul class="ad-items">${items}</ul>
      <p class="ad-estimado">Total estimado en la web: <b>${rango(p.total_min, p.total_max)}</b></p>

      <form class="ad-campos" data-form-pedido>
        <label>Precio acordado <input type="number" name="precio_final" min="0" step="10" inputmode="numeric" value="${p.precio_final ?? ''}" placeholder="${p.total_min === p.total_max ? p.total_min : ''}"></label>
        <label>Fecha de entrega <input type="date" name="entrega" value="${p.entrega || ''}"></label>
        <fieldset class="ad-cobro">
          <legend>Cobro</legend>
          <div class="ad-cobro__fila">
            <label>Cobrado <input type="number" name="cobrado" min="0" step="10" inputmode="numeric" value="${p.cobrado ?? ''}"></label>
            <label>Cómo <select name="cobro_medio"><option value="">—</option>${MEDIOS.map(([v, n]) => `<option value="${v}" ${p.cobro_medio === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label>Cuándo <input type="date" name="cobrado_el" value="${p.cobrado_el || ''}"></label>
          </div>
          <button class="ad-link" type="button" data-cobrar-todo>Cobrado todo, hoy</button>
        </fieldset>
        <label class="ad-notas">Notas (solo las ves vos) <textarea name="notas" rows="3" placeholder="Ej.: quiere el cuero un poco más oscuro">${esc(p.notas || '')}</textarea></label>
        <div class="ad-acciones">
          <button class="ad-btn" type="submit">Guardar</button>
          <button class="ad-link ad-link--peligro" type="button" data-borrar>Borrar pedido</button>
        </div>
      </form>`);

    const f = $('[data-form-pedido]', cuerpo);
    $('[data-cobrar-todo]', cuerpo).addEventListener('click', () => {
      const precio = f.precio_final.value || (p.total_min === p.total_max ? p.total_min : '');
      if (!precio) { aviso('Primero poné el precio acordado.', true); f.precio_final.focus(); return; }
      f.precio_final.value = precio; f.cobrado.value = precio; f.cobrado_el.value = hoy();
      if (!f.cobro_medio.value) f.cobro_medio.value = p.pago === 'efectivo' ? 'efectivo' : 'transferencia';
    });
    f.addEventListener('submit', async (ev) => { ev.preventDefault(); await guardarPedido(p, datosDe(f)); });
    $('[data-estados]', cuerpo).addEventListener('click', async (e) => {
      const b = e.target.closest('[data-estado]'); if (!b || b.dataset.estado === p.estado) return;
      const nuevoEstado = b.dataset.estado, datos = datosDe(f);
      // se cobra todo antes de producir: avisa si no está cobrado
      if (['en_produccion', 'listo', 'entregado'].includes(nuevoEstado) && !(datos.cobrado > 0)
        && !confirm('Este pedido todavía no figura cobrado. ¿Lo pasás igual a «' + estadoNombre(nuevoEstado) + '»?')) return;
      if (nuevoEstado === 'cancelado' && !confirm('¿Cancelar este pedido?')) return;
      await guardarPedido(p, { ...datos, estado: nuevoEstado });
    });
    $('[data-borrar]', cuerpo).addEventListener('click', async () => {
      if (!confirm(`¿Borrar el pedido ${codigo(p.id)} de ${p.nombre}? No se puede deshacer. Si no se hace, mejor marcalo «Cancelado».`)) return;
      try { await api(`pedidos?id=eq.${p.id}`, { method: 'DELETE' }); pedidos = pedidos.filter((x) => x.id !== p.id); cerrarHoja(); pintar(); aviso('Pedido borrado.'); }
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
      <h2 id="hoja-t">Cargar un pedido</h2>
      <p class="ad-hoja__sub">Para los que te llegan por WhatsApp, Instagram o en persona: así queda todo en un solo lugar.</p>
      <form class="ad-campos" data-form-nuevo>
        <label>Nombre <input name="nombre" required maxlength="80"></label>
        <label>Teléfono <input name="telefono" inputmode="tel" maxlength="30" placeholder="09…"></label>
        <label>Por dónde llegó <select name="origen">${ORIGENES.filter((o) => o !== 'web').map((o) => `<option value="${o}">${o[0].toUpperCase() + o.slice(1)}</option>`).join('')}</select></label>
        <label class="ad-notas">Qué pidió (una pieza por renglón) <textarea name="items" rows="3" required placeholder="Cinto faja cebra con hebilla flor&#10;Tarjetero suela"></textarea></label>
        <label>Precio acordado <input type="number" name="precio" min="0" step="10" inputmode="numeric" required></label>
        <label>Va a pagar con <select name="pago"><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option></select></label>
        <label>Fecha de entrega <input type="date" name="entrega"></label>
        <label class="ad-notas">Notas <textarea name="notas" rows="2"></textarea></label>
        <div class="ad-acciones"><button class="ad-btn" type="submit">Guardar pedido</button></div>
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
        pedidos.unshift(r); filtro = 'activos'; pintar(); abrir(r.id); aviso('Pedido cargado: ' + codigo(r.id) + '.');
      } catch (e) { aviso(errorDe(e), true); }
    });
  }

  /* ---------------- arranque ---------------- */
  async function arrancar() {
    if (!(await token())) { mostrar('entrar'); return; }
    let esAdmin = false;
    try { esAdmin = await api('rpc/es_admin', { method: 'POST', body: '{}' }); } catch (e) { aviso(errorDe(e), true); mostrar('entrar'); return; }
    if (!esAdmin) { mostrar('sin-permiso'); return; }
    mostrar('pedidos');
    try { await cargar(); } catch (e) { aviso(errorDe(e), true); }
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
