/* =========================================================
   Decora.te — lo común a todas las páginas
   Cabecera, menú, carrito, pie, entrada, transiciones y animaciones.
   ========================================================= */
(() => {
  'use strict';
  const D = window.DT;
  const html = document.documentElement;
  const page = html.dataset.page || '';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const money = (n) => '$' + Math.round(n).toLocaleString('es-UY');
  const range = (min, max) => (min === max ? money(min) : `${money(min)} a ${money(max)}`);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- movimiento ---------------- */
  // las animaciones están siempre activadas (pedido de la dueña)
  const motion = true;
  html.classList.add('force-motion');
  html.classList.remove('no-motion');
  try { localStorage.removeItem('dt-motion'); } catch (e) { /* sin almacenamiento */ }
  const hasGsap = !!(window.gsap && window.ScrollTrigger) && motion;
  if (hasGsap) { html.classList.add('has-motion'); gsap.registerPlugin(ScrollTrigger); }
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------- carrito (se guarda en este navegador) ---------------- */
  const KEY = 'decorate-carrito';
  const Cart = {
    items: [],
    load() { try { this.items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { this.items = []; } },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.items)); } catch (e) {} document.dispatchEvent(new CustomEvent('carrito')); },
    add(item) {
      const same = this.items.find((i) => i.key === item.key);
      if (same) same.qty += item.qty || 1;
      else this.items.push({ ...item, qty: item.qty || 1, uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) });
      this.save();
    },
    remove(uid) { this.items = this.items.filter((i) => i.uid !== uid); this.save(); },
    setQty(uid, q) { const it = this.items.find((i) => i.uid === uid); if (!it) return; it.qty = Math.max(1, Math.min(it.kind === 'stock' ? 1 : 20, q)); this.save(); }, // las piezas en stock son únicas
    clear() { this.items = []; this.save(); },
    count() { return this.items.reduce((a, i) => a + i.qty, 0); },
    total() { return this.items.reduce((a, i) => ({ min: a.min + i.min * i.qty, max: a.max + i.max * i.qty }), { min: 0, max: 0 }); },
  };
  Cart.load();
  window.addEventListener('storage', (e) => { if (e.key === KEY) { Cart.load(); document.dispatchEvent(new CustomEvent('carrito')); } });

  /* ---------------- estructura común ---------------- */
  const MORE = [
    { href: 'arma.html', label: 'Armá el tuyo', id: 'armar' },
    { href: 'como-comprar.html', label: 'Cómo comprar', id: 'como' },
  ];
  const BUSCA_FOTO = { cintos: 'stock/74', tarjeteros: 'stock/6', 'porta-lentes': 'stock/54', portafuegos: 'stock/343', llaveros: 'stock/355', pulseras: 'stock/1028', collares: 'stock/1006' };
  const wa = (text) => `https://wa.me/${D.whatsapp}${text ? '?text=' + encodeURIComponent(text) : ''}`;
  const ICON = {
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 8h13l-1 12.5h-11z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M15.2 15.2 20 20" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  // flecha para volver: en todas las páginas menos el inicio
  const enInicio = html.dataset.page === 'inicio';
  // armando una pieza (arma.html?p=…), la flecha vuelve a «¿Qué querés armar?»
  const armandoPieza = html.dataset.page === 'armar' && /[?&]p=/.test(location.search);
  const volverA = armandoPieza ? 'arma.html' : { piezas: 'tienda.html' }[html.dataset.page] || 'index.html';

  document.body.insertAdjacentHTML('afterbegin', `
    <a class="skip" href="#contenido">Saltar al contenido</a>
    <div class="bar" aria-label="Avisos"><div class="bar__msgs">${D.avisos.map((t, i) => `<span class="${i ? '' : 'is-on'}">${esc(t)}</span>`).join('')}</div></div>
    <header class="hd" data-header>
      <div class="hd__start">
        ${enInicio ? '' : `<a class="hd__icon hd__back" href="${volverA}" data-back aria-label="Volver">${ICON.back}</a>`}
        <button class="hd__menu-txt" type="button" aria-expanded="false" aria-controls="menu" data-menu-btn>Menú</button>
      </div>
      <a class="hd__logo" href="index.html" aria-label="Decora.te, inicio"><img class="logo-img" src="img/logo-claro.png" alt="Decora.te" width="900" height="180"></a>
      <div class="hd__end">
        <button class="hd__icon" type="button" data-search-open aria-label="Buscar" aria-expanded="false" aria-controls="buscar">${ICON.search}</button>
        <button class="hd__icon hd__cart" type="button" data-cart-open aria-label="Abrir carrito">${ICON.bag}<span class="hd__count" data-cart-count>0</span></button>
      </div>
    </header>
    ${html.dataset.page === 'tienda' ? '' : `<nav class="catbar" aria-label="Categorías"><div class="catbar__in"><a class="catbar__tienda" href="tienda.html">Tienda</a>${D.categorias.map((c) => `<a href="${c.href}">${esc(c.name)}</a>`).join('')}</div></nav>`}

    <div class="search" id="buscar" data-search aria-hidden="true">
      <div class="search__veil" data-search-close></div>
      <div class="search__panel" role="dialog" aria-label="Buscar">
        <div class="wrap search__row">
          ${ICON.search}
          <input type="search" placeholder="Buscar cintos, estuches de lentes, cueros…" aria-label="Buscar en la tienda" data-search-input autocomplete="off">
          <button type="button" class="hd__icon" data-search-close aria-label="Cerrar búsqueda">${ICON.close}</button>
        </div>
        <div class="wrap search__results" data-search-results></div>
      </div>
    </div>

    <div class="menu" id="menu" data-menu aria-hidden="true">
      <div class="menu__veil" data-menu-close></div>
      <nav class="menu__panel" aria-label="Principal">
        <div class="menu__head">
          <a class="menu__logo" href="index.html" aria-label="Inicio"><img class="logo-img" src="img/logo-claro.png" alt="Decora.te" width="900" height="180"></a>
          <button type="button" class="hd__icon" data-menu-close aria-label="Cerrar menú">${ICON.close}</button>
        </div>
        <p class="menu__label">Tienda</p>
        <ul class="menu__list">
          ${D.categorias.map((c) => `<li><a href="${c.href}"><span class="menu__name">${esc(c.name)}</span><small data-desde-cat="${c.id}">Desde ${money(c.desde)}</small></a></li>`).join('')}
        </ul>
        <a class="menu__all" href="tienda.html">Ver toda la tienda</a>
        <div class="menu__make">
          <p class="menu__label">A medida</p>
          <p class="menu__make-txt">Cualquier pieza se puede hacer en el cuero que elijas.</p>
          <ul class="menu__make-list">
            ${D.categorias.filter((c) => c.custom).sort((a, b) => (a.id === 'porta-lentes') - (b.id === 'porta-lentes')).map((c) => `<li><a href="${c.custom.href}">${esc(c.custom.label.replace(/^Armá tu (.)/, (m, l) => l.toUpperCase()))}</a></li>`).join('')}
          </ul>
        </div>
        <div class="menu__foot">
          <div class="menu__foot-fila">${MORE.filter((n) => n.id !== 'armar').map((n) => `<a href="${n.href}" ${n.id === page ? 'aria-current="page"' : ''}>${n.label}</a>`).join('')}</div>
          <div class="menu__foot-fila"><a href="https://www.instagram.com/${D.instagram}/" target="_blank" rel="noopener">Instagram</a><a href="${wa()}" target="_blank" rel="noopener">WhatsApp</a></div>
        </div>
      </nav>
    </div>

    <div class="drawer" data-drawer aria-hidden="true">
      <div class="drawer__veil" data-drawer-close></div>
      <aside class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header class="drawer__head">
          <h2 id="drawer-title">Tu carrito <span data-cart-count-txt></span></h2>
          <button type="button" class="drawer__close" data-drawer-close>Cerrar</button>
        </header>
        <div class="drawer__list" data-drawer-list></div>
        <footer class="drawer__foot" data-drawer-foot></footer>
      </aside>
    </div>
  `);

  const year = new Date().getFullYear();
  const main = $('main');
  if (main && !main.id) main.id = 'contenido';
  document.body.insertAdjacentHTML('beforeend', `
    <footer class="ft">
      <div class="wrap">
        <div class="ft__grid ft__grid--3">
          <div class="ft__col" data-fade>
            <span class="ft__label">Contacto</span>
            <a href="${wa()}" target="_blank" rel="noopener">WhatsApp ${D.whatsappVisible}</a>
            <a href="https://www.instagram.com/${D.instagram}/" target="_blank" rel="noopener">Instagram @${D.instagram}</a>
          </div>
          <div class="ft__col" data-fade>
            <span class="ft__label">Ayuda</span>
            <a href="como-comprar.html">Cómo comprar</a>
          </div>
          <div class="ft__col" data-fade>
            <span class="ft__label">Pagos</span>
            <div class="ft__pay">${D.pagos.map((p) => `<span>${esc(p)}</span>`).join('')}</div>
          </div>
        </div>
        <div class="ft__mark" aria-hidden="true"><img class="logo-img" src="img/logo-claro.png" alt="" width="900" height="180"></div>
        <div class="ft__legal">
          <span>© ${year} Decora.te Accesorios</span>
          <span>Hecho a mano en Uruguay</span>
        </div>
      </div>
    </footer>
    <a class="wa-float" href="${wa('Hola Decora.te! Quería hacer una consulta.')}" target="_blank" rel="noopener" aria-label="Escribinos por WhatsApp" title="Escribinos por WhatsApp">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>
    </a>`);

  // franja superior: mensajes que se turnan
  (() => {
    const msgs = $$('.bar__msgs span');
    if (msgs.length < 2) return;
    let i = 0;
    setInterval(() => {
      msgs[i].classList.remove('is-on'); msgs[i].classList.add('is-off');
      const prev = msgs[i];
      setTimeout(() => prev.classList.remove('is-off'), 900);
      i = (i + 1) % msgs.length;
      msgs[i].classList.add('is-on');
    }, 4200);
  })();


  /* ---------------- scroll suave ---------------- */
  let lenis = null;
  if (window.Lenis && motion) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const lock = (on) => { if (lenis) on ? lenis.stop() : lenis.start(); document.body.style.overflow = on ? 'hidden' : ''; };
  const scrollToEl = (el, offset = 0) => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset, duration: 1.4, easing: (x) => 1 - Math.pow(1 - x, 4) });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: motion ? 'smooth' : 'auto' });
  };

  /* ---------------- franja de categorías: marca la actual ---------------- */
  const catActual = new URLSearchParams(location.search).get('c');
  if (catActual) $$('.catbar a').forEach((a) => { if (a.getAttribute('href').endsWith('c=' + catActual)) a.setAttribute('aria-current', 'page'); });

  /* ---------------- volver ---------------- */
  const backBtn = $('[data-back]');
  if (backBtn) backBtn.addEventListener('click', (e) => {
    if (armandoPieza) return;   // va siempre a elegir qué armar (no a la página anterior)
    let mismoSitio = false;
    try { mismoSitio = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch (_) {}
    if (mismoSitio && history.length > 1) { e.preventDefault(); history.back(); }
  });

  /* ---------------- cabecera ---------------- */
  // la cabecera queda siempre visible; solo suma una sombra suave al bajar
  const header = $('[data-header]');
  let ticking = false;
  const onScroll = () => { header.classList.toggle('is-scrolled', window.scrollY > 8); ticking = false; };
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------------- menú lateral ---------------- */
  const menu = $('[data-menu]');
  const menuBtn = $('[data-menu-btn]');
  const openMenu = () => {
    closeDrawer(); closeSearch();
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    html.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    lock(true);
  };
  function closeMenu() {
    if (!menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    html.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    lock(false);
  }
  menuBtn.addEventListener('click', () => (menu.classList.contains('is-open') ? closeMenu() : openMenu()));
  $$('[data-menu-close]', menu).forEach((b) => b.addEventListener('click', closeMenu));

  /* ---------------- buscador ---------------- */
  const search = $('[data-search]');
  const sInput = $('[data-search-input]');
  const sResults = $('[data-search-results]');
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // una foto de la web ('stock/79', 'cinto-blanco') o un link (fotos subidas desde el panel)
  const fotoSrc = (f, sm = true) => (/^https?:/.test(f) ? f : `img/${f}${sm ? '-sm' : ''}.jpg`);
  const fotoStock = (n) => (/^https?:/.test(n) ? n : 'stock/' + n);
  const indice = () => [

    // foto de una pieza de cada categoría que no se repite con las del inicio ni con las de la tienda
    ...D.categorias.map((c) => ({ title: c.name, kind: 'Categoría', href: c.href, img: BUSCA_FOTO[c.id] || c.foto })),
    ...(window.DT_STOCK || []).map((s) => { const c = D.categorias.find((x) => x.id === s.cat); return { title: s.name, kind: `${c ? c.name : ''} · en stock`, href: `producto.html?id=${s.id}`, img: fotoStock(s.portada || s.fotos[0]), extra: `${s.sub || ''} ${s.id}` }; }),
    ...D.productos.map((p) => ({ title: `${p.name} a medida`, kind: 'A tu medida', href: `arma.html?p=${p.id}`, img: p.fotos[0], extra: p.desc })),
    ...D.cueros.map((c) => ({ title: `Cuero ${c.name.toLowerCase()}`, kind: 'Cuero', href: 'arma.html', swatch: c.id })),
    { title: 'Armá el tuyo', kind: 'Personalizá', href: 'arma.html', img: 'taller-mesa', extra: 'personalizar a medida cinto' },
    { title: 'Cómo comprar', kind: 'Ayuda', href: 'como-comprar.html', extra: 'pago transferencia efectivo' },
  ];
  function runSearch() {
    const q = norm(sInput.value.trim());
    if (!q) { sResults.innerHTML = `<p class="search__hint">Probá con <button type="button" data-q="cinto">cinto</button>, <button type="button" data-q="estuche de lentes">estuche de lentes</button> o <button type="button" data-q="cebra">cebra</button>.</p>`; return; }
    const words = q.split(/\s+/);
    const hits = indice().filter((it) => { const hay = norm(`${it.title} ${it.kind} ${it.extra || ''}`); return words.every((w) => hay.includes(w)); }).slice(0, 8);
    sResults.innerHTML = hits.length
      ? `<ul class="search__list">${hits.map((h) => `<li><a href="${h.href}"><span class="search__thumb" style="${h.img ? `background-image:url(${fotoSrc(h.img)})` : h.swatch ? `background-image:url(img/cuero-${h.swatch}-sm.jpg)` : ''}"></span><span><b>${esc(h.title)}</b><small>${esc(h.kind)}</small></span></a></li>`).join('')}</ul>`
      : `<p class="search__hint">No encontramos "${esc(sInput.value.trim())}". Escribinos por <a href="${wa(`Hola Decora.te! Estoy buscando: ${sInput.value.trim()}`)}" target="_blank" rel="noopener">WhatsApp</a> y lo vemos.</p>`;
  }
  function openSearch() {
    closeMenu(); closeDrawer();
    search.classList.add('is-open');
    search.setAttribute('aria-hidden', 'false');
    $('[data-search-open]').setAttribute('aria-expanded', 'true');
    runSearch();
    setTimeout(() => sInput.focus({ preventScroll: true }), 60);
  }
  function closeSearch() {
    if (!search.classList.contains('is-open')) return;
    search.classList.remove('is-open');
    search.setAttribute('aria-hidden', 'true');
    $('[data-search-open]').setAttribute('aria-expanded', 'false');
  }
  $('[data-search-open]').addEventListener('click', () => (search.classList.contains('is-open') ? closeSearch() : openSearch()));
  $$('[data-search-close]', search).forEach((b) => b.addEventListener('click', closeSearch));
  sInput.addEventListener('input', runSearch);
  sResults.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) { sInput.value = b.dataset.q; runSearch(); sInput.focus(); } });

  /* ---------------- carrito lateral ---------------- */
  const drawer = $('[data-drawer]');
  const list = $('[data-drawer-list]');
  const foot = $('[data-drawer-foot]');
  function itemHTML(it, compact) {
    const img = it.img3d ? `<img src="${it.img3d}" alt="">` : it.foto ? `<img src="${fotoSrc(it.foto)}" alt="" loading="lazy">` : (it.swatch ? `<span class="ci__swatch" style="background-image:url(img/cuero-${it.swatch}-sm.jpg)"></span>` : '<span class="ci__empty"></span>');
    return `<li class="ci" data-uid="${it.uid}">
      <div class="ci__media">${img}</div>
      <div class="ci__body">
        <p class="ci__name">${esc(it.name)}</p>
        <p class="ci__detail">${it.detail.map(esc).join(' · ')}</p>
        <div class="ci__row">
          <div class="qty" aria-label="Cantidad">
            <button type="button" data-qty="-1" aria-label="Restar uno">–</button><span>${it.qty}</span><button type="button" data-qty="1" aria-label="Sumar uno">+</button>
          </div>
          <span class="ci__price">${range(it.min * it.qty, it.max * it.qty)}</span>
        </div>
        ${compact ? '' : ''}<button type="button" class="ci__remove" data-remove>Quitar</button>
      </div>
    </li>`;
  }
  function renderDrawer() {
    const n = Cart.count();
    $$('[data-cart-count]').forEach((c) => { c.textContent = n; c.classList.toggle('is-on', n > 0); });
    $('[data-cart-count-txt]').textContent = n ? `(${n})` : '';
    $('[data-cart-open]').setAttribute('aria-label', `Abrir carrito, ${n} ${n === 1 ? 'pieza' : 'piezas'}`);
    if (!Cart.items.length) {
      list.innerHTML = `<div class="drawer__empty"><p>Todavía no agregaste nada.</p><a class="link" href="tienda.html">Ver la tienda</a><a class="link" href="arma.html">Armá el tuyo</a></div>`;
      foot.innerHTML = '';
      return;
    }
    list.innerHTML = `<ul>${Cart.items.map((it) => itemHTML(it)).join('')}</ul>`;
    const t = Cart.total();
    foot.innerHTML = `
      <div class="drawer__total"><span>Subtotal</span><strong>${range(t.min, t.max)}</strong></div>
      <p class="drawer__note">No se cobra nada en la web: pagás en efectivo o por transferencia.</p>
      <a class="btn" href="carrito.html">Finalizar compra</a>
      <button type="button" class="link drawer__keep" data-drawer-close>Seguir mirando</button>`;
  }
  const openDrawer = () => {
    closeMenu(); closeSearch();
    renderDrawer();
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    lock(true);
    setTimeout(() => { const c = $('.drawer__close', drawer); if (c) c.focus({ preventScroll: true }); }, 50);
  };
  function closeDrawer() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    lock(false);
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); openDrawer(); return; }
    if (e.target.closest('[data-drawer-close]')) { closeDrawer(); return; }
    const row = e.target.closest('.ci');
    if (row && e.target.closest('[data-qty]')) { const it = Cart.items.find((i) => i.uid === row.dataset.uid); if (it) Cart.setQty(it.uid, it.qty + Number(e.target.closest('[data-qty]').dataset.qty)); return; }
    if (row && e.target.closest('[data-remove]')) { Cart.remove(row.dataset.uid); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); closeDrawer(); closeSearch(); } });
  document.addEventListener('carrito', renderDrawer);
  renderDrawer();

  /* ---------------- enlaces dentro de la misma página: bajan suave ---------------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
    const t = url.hash.length > 1 && $(url.hash);
    e.preventDefault();
    closeMenu(); closeSearch();
    if (t) scrollToEl(t, -20);
  });
  // sin pantalla de entrada ni telón entre páginas: todo aparece de una
  const introDone = Promise.resolve();

  /* ---------------- hero con cambio de foto ---------------- */
  function hero() {
    const root = $('[data-hero]');
    if (!root) return;
    const src = $$('.hero__src figure', root);
    const panesWrap = $('.hero__panes', root);
    const counter = $('[data-hero-current]', root);
    const totalEl = $('[data-hero-total]', root);
    const barsWrap = $('.hero__bars', root);
    const DUR = 6000;
    const TRANS = 1800;
    let timer = null;
    let idx = 0;
    let groups = [];
    let panes = [];
    const mq = window.matchMedia('(min-width: 900px)');

    function build() {
      clearTimeout(timer);
      idx = 0;
      const nPanes = mq.matches ? 2 : 1;
      groups = Array.from({ length: Math.ceil(src.length / nPanes) }, (_, g) => src.slice(g * nPanes, g * nPanes + nPanes));
      panesWrap.innerHTML = '';
      panes = Array.from({ length: nPanes }, (_, p) => {
        const pane = document.createElement('div');
        pane.className = 'hero__pane';
        groups.forEach((grp, g) => {
          const fig = grp[p].cloneNode(true);
          fig.className = 'hero__slide' + (g === 0 ? ' is-active' : '');
          const img = $('img', fig);
          if (g === 0) { img.loading = 'eager'; img.fetchPriority = 'high'; }
          pane.appendChild(fig);
        });
        panesWrap.appendChild(pane);
        return pane;
      });
      totalEl.textContent = String(groups.length).padStart(2, '0');
      barsWrap.innerHTML = groups.map(() => '<span class="hero__bar"><i></i></span>').join('');
      root.style.setProperty('--hero-dur', DUR / 1000 + 's');
      setBars(0);
      counter.textContent = '01';
      loop();
    }
    function setBars(n) {
      const bars = $$('.hero__bar', barsWrap);
      bars.forEach((b, i) => { b.classList.remove('is-active', 'is-done'); if (i < n) b.classList.add('is-done'); });
      void barsWrap.offsetWidth;
      bars[n].classList.add('is-active');
    }
    function go(n) {
      panes.forEach((pane, p) => {
        const slides = $$('.hero__slide', pane);
        const prev = slides[idx], next = slides[n];
        setTimeout(() => {
          prev.classList.remove('is-active');
          prev.classList.add('is-leaving');
          next.classList.add('is-entering');
          setTimeout(() => { next.classList.remove('is-entering'); next.classList.add('is-active'); prev.classList.remove('is-leaving'); }, TRANS);
        }, p * 260);
      });
      idx = n;
      counter.textContent = String(n + 1).padStart(2, '0');
      setBars(n);
    }
    function loop() { clearTimeout(timer); timer = setTimeout(() => { go((idx + 1) % groups.length); loop(); }, DUR); }
    build();
    mq.addEventListener('change', build);
    document.addEventListener('visibilitychange', () => (document.hidden ? clearTimeout(timer) : loop()));
  }
  hero();

  /* ---------------- carruseles: progreso y arrastre ---------------- */
  function bindRail(rail) {
    const bar = rail.parentElement.querySelector('[data-rail-progress]') || $(`[data-rail-progress="${rail.dataset.rail}"]`);
    const update = () => {
      if (!bar) return;
      const max = rail.scrollWidth - rail.clientWidth;
      const p = max > 0 ? rail.scrollLeft / max : 0;
      const vis = Math.max(0.12, Math.min(1, rail.clientWidth / rail.scrollWidth));
      bar.style.transform = `scaleX(${vis + p * (1 - vis)})`;
    };
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    let down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
    window.addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 6) { moved = true; rail.classList.add('is-drag'); } rail.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', () => { if (!down) return; down = false; setTimeout(() => rail.classList.remove('is-drag'), 0); });
    rail.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  }
  $$('[data-rail]').forEach(bindRail);


  /* ---------------- animaciones al scrollear ---------------- */
  function splitWords(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const o = document.createElement('span'); o.className = 'split-word';
            const i = document.createElement('span'); i.textContent = p;
            o.appendChild(i); frag.appendChild(o);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && !child.classList.contains('split-word')) walk(child);
      });
    };
    walk(el);
    return $$('.split-word > span', el);
  }

  function animations() {
    if (!hasGsap) {
      // sin GSAP: aparición simple con IntersectionObserver
      if (motion && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
        $$('[data-fade], [data-reveal]').forEach((el) => io.observe(el));
      }
      return;
    }

    // Títulos palabra por palabra
    $$('[data-split]').forEach((el) => {
      const words = splitWords(el);
      const inHero = el.closest('[data-hero], [data-page-hero]');
      gsap.set(words, { yPercent: 118, rotate: 4, transformOrigin: '0 100%' });
      const tw = { yPercent: 0, rotate: 0, duration: 1.6, ease: 'expo.out', stagger: 0.045 };
      if (inHero) introDone.then(() => gsap.to(words, { ...tw, duration: 1.8, stagger: 0.06, delay: 0.25 }));
      else gsap.to(words, { ...tw, scrollTrigger: { trigger: el, start: 'top bottom', toggleActions: 'play none none none' } });
    });

    $$('[data-fade]').forEach((el) => {
      const inHero = el.closest('[data-hero], [data-page-hero]');
      const tw = { opacity: 1, y: 0, duration: 1.5, ease: 'power3.out' };
      gsap.set(el, { opacity: 0, y: 34 });
      if (inHero) introDone.then(() => gsap.to(el, { ...tw, delay: 0.6 }));
      else gsap.to(el, { ...tw, scrollTrigger: { trigger: el, start: 'top bottom', toggleActions: 'play none none none' } });
    });

    $$('[data-reveal]').forEach((el) => {
      const img = $('img', el);
      const dir = el.dataset.reveal || 'up';
      const from = { up: 'inset(100% 0% 0% 0%)', down: 'inset(0% 0% 100% 0%)', left: 'inset(0% 100% 0% 0%)', right: 'inset(0% 0% 0% 100%)' }[dir] || 'inset(100% 0% 0% 0%)';
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top bottom', toggleActions: 'play none none none' } });
      tl.fromTo(el, { clipPath: from }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut' });
      if (img) tl.fromTo(img, { scale: 1.4 }, { scale: 1, duration: 2.4, ease: 'expo.out' }, 0.1);
    });

    // Fotos con profundidad
    $$('[data-parallax]').forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 12;
      const target = $('img', el) || el;
      gsap.set(target, { scale: 1 + amt / 60 });
      gsap.fromTo(target, { yPercent: -amt / 2 }, { yPercent: amt / 2, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Elementos que flotan a otra velocidad
    $$('[data-speed]').forEach((el) => {
      const s = parseFloat(el.dataset.speed);
      gsap.fromTo(el, { y: () => s * 120 }, { y: () => -s * 120, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1, invalidateOnRefresh: true } });
    });

    // Foto que se abre a pantalla completa
    $$('[data-zoom]').forEach((sec) => {
      const frame = $('.zoom__frame', sec);
      const img = $('img', frame);
      const txt = $$('.zoom__text > *', sec);
      const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: '+=120%', scrub: 1, pin: true, anticipatePin: 1, refreshPriority: -1 } });
      tl.fromTo(frame, { clipPath: () => (window.innerWidth < 700 ? 'inset(22% 12% 22% 12%)' : 'inset(18% 30% 18% 30%)') }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: 1 })
        .fromTo(img, { scale: 1.35 }, { scale: 1, ease: 'none', duration: 1 }, 0)
        .fromTo(txt, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out' }, 0.45);
    });

    // Texto en movimiento continuo, se acelera con el scroll
    $$('[data-marquee]').forEach((el) => {
      const track = $('.marquee__track', el);
      track.innerHTML += track.innerHTML;
      const dir = el.dataset.marquee === 'right' ? 1 : -1;
      let x = 0, boost = 0;
      const w = () => track.scrollWidth / 2;
      ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onUpdate: (s) => { boost = Math.min(8, Math.abs(s.getVelocity()) / 220); } });
      gsap.ticker.add(() => {
        x += dir * (0.5 + boost);
        boost *= 0.94;
        const W = w();
        if (x <= -W) x += W;
        if (x > 0) x -= W;
        track.style.transform = `translate3d(${x}px,0,0)`;
      });
    });

    // Escalonados
    $$('[data-stagger]').forEach((el) => {
      gsap.from(el.children, { y: 60, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top bottom', toggleActions: 'play none none none' } });
    });

    // Líneas que se dibujan
    $$('[data-line]').forEach((el) => {
      gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0 50%', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top bottom', toggleActions: 'play none none none' } });
    });

    // Recorridos horizontales fijados (solo compu)
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      $$('[data-hscroll]').forEach((sec) => {
        const track = $('[data-hscroll-track]', sec);
        const bar = $('[data-hscroll-progress]', sec);
        const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const tween = gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: {
            trigger: sec, start: 'top top', end: () => '+=' + dist(), scrub: 1, pin: true, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: (s) => { if (bar) bar.style.transform = `scaleX(${0.12 + s.progress * 0.88})`; },
          },
        });
        $$('[data-hscroll-img]', track).forEach((box) => {
          const img = $('img', box);
          gsap.set(img, { scale: 1.22 });
          gsap.fromTo(img, { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { containerAnimation: tween, trigger: box, start: 'left right', end: 'right left', scrub: true } });
        });
        $$('[data-hscroll-rise]', track).forEach((box) => {
          gsap.fromTo(box, { y: 80, opacity: 0.2 }, { y: 0, opacity: 1, ease: 'power2.out', scrollTrigger: { containerAnimation: tween, trigger: box, start: 'left 95%', end: 'left 60%', scrub: true } });
        });
      });
    });

    // Hero: entrada y salida con calma
    const hr = $('[data-hero]');
    if (hr) {
      gsap.set('.hero__panes', { scale: 1.14 });
      introDone.then(() => gsap.to('.hero__panes', { scale: 1, duration: 2.6, ease: 'expo.out' }));
      gsap.to('.hero__content', { yPercent: -35, opacity: 0, ease: 'none', scrollTrigger: { trigger: hr, start: 'top top', end: 'bottom 25%', scrub: true } });
      gsap.to('.hero__panes', { yPercent: 16, ease: 'none', scrollTrigger: { trigger: hr, start: 'top top', end: 'bottom top', scrub: true } });
    }
    const ph = $('[data-page-hero] [data-page-hero-img]');
    if (ph) {
      gsap.fromTo(ph, { scale: 1.18 }, { scale: 1, duration: 2.4, ease: 'expo.out' });
      gsap.to(ph, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: ph.closest('[data-page-hero]'), start: 'top top', end: 'bottom top', scrub: true } });
    }

    // los fijados se calculan en orden de aparición en la página
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    window.addEventListener('load', () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
  }
  // se corre cuando ya terminaron todos los scripts (la tienda y el armador agregan contenido antes)
  const runAnimations = () => {
    if (!location.hash) window.scrollTo(0, 0);
    try { animations(); } catch (err) { console.error('animaciones', err && err.stack); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runAnimations);
  else setTimeout(runAnimations, 0);

  /* ---------------- barras que se deslizan de costado (categorías, piezas del armador) ----------------
     en el celular no todos saben que se pueden deslizar: la primera vez de cada visita se corren un poco
     solas y vuelven; el degradado del borde se va cuando se llega al final */
  const pista = () => {
    const barras = Array.from(document.querySelectorAll('.catbar__in, .arma-otros'));
    const borde = (b) => { const fin = b.scrollLeft + b.clientWidth >= b.scrollWidth - 4; (b.closest('.catbar') || b).classList.toggle('al-final', fin); };
    barras.forEach((b) => { borde(b); b.addEventListener('scroll', () => borde(b), { passive: true }); });
    if (window.innerWidth >= 900 || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    let ya = false; try { ya = sessionStorage.getItem('decorate-pista') === '1'; sessionStorage.setItem('decorate-pista', '1'); } catch (e) { /* sin almacenamiento */ }
    if (ya) return;
    barras.filter((b) => b.scrollWidth > b.clientWidth + 10).forEach((b, i) => {
      setTimeout(() => { b.scrollTo({ left: Math.min(90, b.scrollWidth - b.clientWidth), behavior: 'smooth' }); setTimeout(() => b.scrollTo({ left: 0, behavior: 'smooth' }), 900); }, 1300 + i * 500);
    });
  };
  // la barra del armador se llena un poco después: se espera a que la página termine de cargar
  if (document.readyState === 'complete') setTimeout(pista, 50); else window.addEventListener('load', pista);

  /* ---------------- utilidades para las otras páginas ---------------- */
  window.DTSite = { Cart, money, range, esc, wa, motion, hasGsap, lenis, scrollToEl, openDrawer, introDone, fine, fotoSrc, fotoStock };

  // precios del panel (Supabase): el menú se armó antes de que llegaran
  (window.DT_STOCK_LISTO || Promise.resolve()).then(() => {
    document.querySelectorAll('[data-desde-cat]').forEach((el) => {
      const c = D.categorias.find((x) => x.id === el.dataset.desdeCat);
      if (c) el.textContent = 'Desde ' + money(c.desde);
    });
  });
  document.dispatchEvent(new CustomEvent('dtsite'));
})();
