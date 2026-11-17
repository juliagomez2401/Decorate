/* =========================================================
   Decora.te — tienda: piezas, producto, carrito y adelantos del inicio
   ========================================================= */
(() => {
  'use strict';
  const D = window.DT;
  const S = window.DTSite;
  if (!D || !S) return;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const { money, range, esc, Cart } = S;
  const prod = (id) => D.productos.find((p) => p.id === id);

  /* ---------------- precios de un producto ---------------- */
  function fromPrice(p) {
    if (p.base) return { min: p.base, max: p.base };
    const g = p.opciones[0];
    const ps = g.items.map((i) => i.price);
    return { min: Math.min(...ps), max: Math.max(...ps) };
  }
  const fromText = (p) => { const r = fromPrice(p); return r.min === r.max ? money(r.min) : 'Desde ' + money(r.min); };
  function priceFor(p, sel) {
    let min = p.base || 0, max = p.base || 0;
    p.opciones.forEach((g) => { const it = g.items.find((i) => i.id === sel[g.key]); if (it) { min += it.price; max += it.max != null ? it.max : it.price; } });
    return { min, max };
  }

  /* ---------------- tarjetas ---------------- */
  function card(p, extra = '') {
    const a = p.fotos[0], b = p.fotos[1];
    const media = a
      ? `<img src="img/${a}-sm.jpg" srcset="img/${a}-sm.jpg 800w, img/${a}.jpg 1600w" sizes="(min-width: 900px) 34vw, 50vw" alt="${esc(p.alts[0])}" loading="lazy"${p.pos && p.pos[0] ? ` style="object-position:${p.pos[0]}"` : ''}>${b ? `<img class="card__alt" src="img/${b}-sm.jpg" alt="" loading="lazy">` : ''}`
      : `<span class="placeholder">${esc(p.placeholder)}</span>`;
    return `<article class="card ${extra}">
      <a class="card__media" href="producto.html?p=${p.id}" data-cursor="Ver" aria-label="${esc(p.name)}">${media}</a>
      <div>
        <h3 class="card__name"><a href="producto.html?p=${p.id}">${esc(p.name)}</a></h3>
        <p class="card__meta"><span>${esc(p.line)}</span><b>${fromText(p)}</b></p>
      </div>
    </article>`;
  }
  const beltCard = () => `<article class="card card--wide">
      <a class="card__media" href="arma.html?p=cinto" data-cursor="Armar"><img src="img/cinto-cebra-bordo-sm.jpg" srcset="img/cinto-cebra-bordo-sm.jpg 800w, img/cinto-cebra-bordo.jpg 1600w" sizes="100vw" alt="Cinto ancho de cebra y bordó con hebilla trabajada" loading="lazy" style="object-position:50% 40%"><img class="card__alt" src="img/cinto-turquesa-sm.jpg" alt="" loading="lazy"></a>
      <div>
        <h3 class="card__name"><a href="arma.html?p=cinto">Cinto a medida</a></h3>
        <p class="card__meta"><span>Elegís cueros, hebilla y unión</span><b>Desde ${money(D.tipos[0].min)}</b></p>
      </div>
    </article>`;

  const grid = $('[data-catalog]');
  if (grid) grid.innerHTML = beltCard() + D.productos.map((p) => card(p)).join('');

  const home = $('[data-cards-home]');
  if (home) {
    const isFour = home.classList.contains('cards--four');
    const belt = `<article class="card">
      <a class="card__media" href="arma.html?p=cinto" data-cursor="Armar"><img src="img/cinto-blanco-sm.jpg" alt="Cinto blanco con tachas y hebilla dorada" loading="lazy" style="object-position:50% 45%"><img class="card__alt" src="img/cinto-turquesa-sm.jpg" alt="" loading="lazy"></a>
      <div><h3 class="card__name"><a href="arma.html?p=cinto">Cinto a medida</a></h3><p class="card__meta"><span>Para usar</span><b>Desde ${money(D.tipos[0].min)}</b></p></div>
    </article>`;
    home.innerHTML = (isFour ? belt : '') + ['porta-lentes', 'tarjetero', 'pulsera'].map((id) => card(prod(id))).join('');
  }

  /* ---------------- fila de categorías chicas (inicio) ---------------- */
  const row = $('[data-cat-row]');
  if (row) {
    row.innerHTML = D.categorias.map((c) => `
      <a class="tile" href="${c.href}">
        <span class="tile__img">${c.foto ? `<img src="img/${c.foto}-sm.jpg" alt="" loading="lazy" style="object-position:${c.pos || '50% 50%'}">` : '<span class="tile__empty">Foto<br>pendiente</span>'}</span>
        <span class="tile__name">${esc(c.name)}</span>
        <span class="tile__price">Desde ${money(c.desde)}</span>
      </a>`).join('') + `
      <a class="tile tile--make" href="arma.html?p=cinto">
        <span class="tile__img"><span class="tile__swatches">${D.cueros.slice(0, 4).map((c) => `<i style="background-image:url(img/cuero-${c.id}-sm.jpg)"></i>`).join('')}</span></span>
        <span class="tile__name">Armá el tuyo</span>
        <span class="tile__price">A tu medida</span>
      </a>`;
  }

  /* ---------------- categorías (inicio) ---------------- */
  const cats = $('[data-cats]');
  if (cats) {
    cats.innerHTML = D.categorias.map((c, i) => `
      <a class="cat ${i === 0 ? 'cat--main' : ''}" href="${c.href}" data-cursor="Ver">
        <span class="cat__media">${c.foto ? `<img src="img/${c.foto}-sm.jpg" srcset="img/${c.foto}-sm.jpg 1000w, img/${c.foto}.jpg 2000w" sizes="(min-width: 900px) ${i === 0 ? 50 : 25}vw, ${i === 0 ? 100 : 50}vw" alt="" loading="lazy" style="object-position:${c.pos || '50% 50%'}">` : '<span class="placeholder placeholder--dark">[PLACEHOLDER] Foto</span>'}</span>
        <span class="cat__txt"><b>${esc(c.name)}</b><small>Desde ${money(c.desde)}</small></span>
      </a>`).join('') + `
      <a class="cat cat--make" href="#armar">
        <span class="cat__txt"><small>Personalizá</small><b>Armá el tuyo</b><span class="cat__swatches">${D.cueros.slice(0, 6).map((c) => `<i style="background-image:url(img/cuero-${c.id}-sm.jpg)"></i>`).join('')}</span></span>
      </a>`;
  }

  /* ---------------- tira de cueros ---------------- */
  const strip = $('[data-leathers-strip]');
  if (strip) {
    const item = (c) => `<figure class="lstrip__item"><span style="background-image:url(img/cuero-${c.id}-sm.jpg)"></span><figcaption>${esc(c.name)}</figcaption></figure>`;
    strip.innerHTML = `<div class="lstrip"><div class="lstrip__track">${D.cueros.map(item).join('')}${D.cueros.map(item).join('')}</div></div>`;
  }

  /* =========================================================
     STOCK: categorías y piezas reales (js/stock.js)
     ========================================================= */
  const STOCK = window.DT_STOCK || [];
  const cat = (id) => D.categorias.find((c) => c.id === id);
  const stockPrice = (s) => (s.desde ? `Desde ${money(s.min)}` : range(s.min, s.max));
  const img = (f, sm = true) => `img/${f}${sm ? '-sm' : ''}.jpg`;
  // ?v=…: subirlo cuando se cambian fotos con el mismo nombre, así el navegador no muestra las viejas
  const FOTOS_V = '3';
  const stockImg = (n, sm = true) => `img/stock/${n}${sm ? '-sm' : ''}.jpg?v=${FOTOS_V}`;

  function itemCard(s) {
    const a = s.portada || s.fotos[0], b = s.hover;
    return `<a class="item" href="producto.html?id=${s.id}">
      <span class="item__img"><img src="${stockImg(a)}" alt="${esc(s.name)}" loading="lazy">${b ? `<img class="item__alt" src="${stockImg(b)}" alt="" loading="lazy">` : ''}<span class="item__tag">Pieza única</span></span>
      <span class="item__name">${esc(s.name)}</span>
      <span class="item__price">${stockPrice(s)}</span>
    </a>`;
  }
  // Tarjeta "Armá el tuyo": misma forma que las fotos de su categoría (los llaveros son verticales)
  const VERTICALES = ['llaveros', 'porta-lentes', 'portafuegos'];
  const gridClass = (id) => 'shop__grid' + (VERTICALES.includes(id) ? ' shop__grid--vert' : '');
  function customCard(c) {
    if (!c.custom) return '';
    const ar = VERTICALES.includes(c.id) ? '898 / 1600' : '760 / 427';
    return `<a class="item item--custom" href="${c.custom.href}" style="--ar:${ar}">
      <span class="mk">
        <small class="mk__tag">A medida</small>
        <b class="mk__title">${esc(c.custom.label)}</b>
        <span class="mk__txt">${esc(c.custom.txt)} Desde ${money(c.desde)}.</span>
        <span class="mk__foot"><i class="mk__sw">${D.cueros.slice(0, 5).map((x) => `<em style="background-image:url(img/cuero-${x.id}-sm.jpg)"></em>`).join('')}</i><span class="mk__go">Personalizar</span></span>
      </span>
    </a>`;
  }

  // La foto que aparece al pasar el mouse solo se usa si tiene la misma forma que la portada
  // (si una es horizontal y la otra vertical, se vería recortada y rara).
  function fixHover(root = document) {
    $$('.item__alt', root).forEach((alt) => {
      const main = alt.parentElement.querySelector('img:not(.item__alt)');
      const check = () => {
        if (!main.naturalWidth || !alt.naturalWidth) return;
        const r1 = main.naturalWidth / main.naturalHeight, r2 = alt.naturalWidth / alt.naturalHeight;
        if (Math.abs(r1 - r2) / r1 > 0.12) alt.remove();
      };
      [main, alt].forEach((im) => { if (im.complete) check(); else im.addEventListener('load', check, { once: true }); });
    });
  }
  document.addEventListener('DOMContentLoaded', () => fixHover());

  /* ---------------- vitrina de categorías en movimiento (inicio) ---------------- */
  const show = $('[data-showcase]');
  if (show) {
    const card = (c, i) => `
      <a class="sc sc--${i % 3}" href="${c.href}" draggable="false">
        <span class="sc__img"><img src="img/${c.foto}-sm.jpg" alt="" draggable="false"></span>
        <span class="sc__txt"><b>${esc(c.name)}</b><small>Desde ${money(c.desde)}</small></span>
      </a>`;
    const make = `
      <a class="sc sc--make" href="arma.html?p=cinto" draggable="false">
        <span class="sc__img sc__img--make"><span>${D.cueros.slice(0, 9).map((x) => `<i style="background-image:url(img/cuero-${x.id}-sm.jpg)"></i>`).join('')}</span></span>
        <span class="sc__txt"><b>Armá el tuyo</b><small>A tu medida</small></span>
      </a>`;
    const set = D.categorias.map(card).join('') + make;
    show.innerHTML = `<div class="showcase__row">${set}</div><div class="showcase__row" aria-hidden="true">${set}</div>`;
    $$('.showcase__row[aria-hidden] a', show).forEach((a) => a.setAttribute('tabindex', '-1'));

    // se mueve solo, más rápido al scrollear, más lento con el mouse encima; se puede arrastrar
    let pos = 0, speed = 0.45, target = 0.45, boost = 0, lastY = window.scrollY, dragging = false, dragX = 0, dragPos = 0, moved = 0, idleUntil = 0;
    const rowW = () => show.firstElementChild.offsetWidth;
    window.addEventListener('scroll', () => { const y = window.scrollY; boost = Math.min(6, boost + Math.abs(y - lastY) * 0.05); lastY = y; }, { passive: true });
    show.addEventListener('mouseenter', () => { target = 0.12; });
    show.addEventListener('mouseleave', () => { target = 0.45; });
    show.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; dragX = e.clientX; dragPos = pos; show.classList.add('is-drag'); show.setPointerCapture(e.pointerId); });
    show.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - dragX; moved = Math.max(moved, Math.abs(dx)); pos = dragPos + dx; });
    const end = () => { if (!dragging) return; dragging = false; show.classList.remove('is-drag'); idleUntil = performance.now() + 1200; };
    show.addEventListener('pointerup', end);
    show.addEventListener('pointercancel', end);
    show.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    const tick = (now) => {
      speed += (target - speed) * 0.05;
      boost *= 0.93;
      if (!dragging && now > idleUntil) pos -= speed + boost;
      const W = rowW();
      if (W) { while (pos <= -W) pos += W; while (pos > 0) pos -= W; }
      show.style.setProperty('--x', `${pos}px`);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------------- fila de piezas en stock (inicio) ---------------- */
  const stockRow = $('[data-stock-row]');
  if (stockRow) {
    const elegidas = ['d6', 't2', 'pu2', 'f2'];  // todas horizontales, para que la fila quede pareja
    const lista = elegidas.map((id) => STOCK.find((s) => s.id === id)).filter(Boolean);
    stockRow.innerHTML = lista.map(itemCard).join('');
  }

  /* ---------------- Armá el tuyo (inicio): cueros + categorías a medida ---------------- */
  const mtoGrid = $('[data-mto-grid]');
  if (mtoGrid) {
    const sw = $('[data-mto-cueros]');
    if (sw) sw.innerHTML = D.cueros.map((c) => `<li><img src="img/cuero-${c.id}-sm.jpg" alt="" loading="lazy" width="600" height="600"><span>${esc(c.name)}</span></li>`).join('');
    // fotos apaisadas para que todas las tarjetas tengan la misma forma
    const fotos = { cintos: 'stock/44', tarjeteros: 'stock/26', 'porta-lentes': 'inicio-portalentes', portafuegos: 'inicio-portafuego', llaveros: 'inicio-llavero', pulseras: 'stock/1044', collares: 'stock/1005' };
    mtoGrid.innerHTML = D.categorias.map((c, i) => {
      const f = fotos[c.id] || c.foto;
      const main = i === 0;
      return `<a class="mto__card${main ? ' mto__card--main' : ''} mto__card--${c.id}" href="${c.custom.href}" data-fade>
        <span class="mto__img"><img src="img/${f}${main ? '' : '-sm'}.jpg" alt="${esc(c.name)} hechos a mano" loading="lazy"></span>
        <span class="mto__info">
          <span class="mto__tag">A medida</span>
          <b class="mto__name">${esc(c.custom.label)}</b>
          <span class="mto__desc">${esc(c.custom.txt)}</span>
          <span class="mto__price">Desde ${money(c.desde)}</span>
          ${main ? '<span class="btn btn--cream mto__go">Empezar</span>' : '<span class="mto__link">Personalizar</span>'}
        </span>
      </a>`;
    }).join('');
  }

  /* ---------------- página de categoría (tienda.html?c=…&s=…) ---------------- */
  const shop = $('[data-shop]');
  if (shop) {
    const grid = $('[data-shop-grid]', shop);
    const tabs = $('[data-shop-cats]', shop);
    const subsEl = $('[data-shop-subs]', shop);
    function renderShop() {
      const qs = new URLSearchParams(location.search);
      const c = cat(qs.get('c'));
      const sub = qs.get('s');
      tabs.innerHTML = `<a href="tienda.html" ${!c ? 'aria-current="page"' : ''}>Todo</a>` + D.categorias.map((x) => `<a href="${x.href}" ${c && c.id === x.id ? 'aria-current="page"' : ''}>${esc(x.name)}</a>`).join('');
      subsEl.innerHTML = '';
      if (c) {
        document.title = `${c.name} · Decora.te`;
        let items = STOCK.filter((s) => s.cat === c.id);
        $('[data-shop-title]', shop).textContent = c.name;
        if (c.subs) {
          subsEl.innerHTML = `<a href="${c.href}" ${!sub ? 'aria-current="page"' : ''}>Todos</a>` + c.subs.map((s) => `<a href="${c.href}&s=${s.id}" ${sub === s.id ? 'aria-current="page"' : ''}>${esc(s.name)}</a>`).join('');
          if (sub) items = items.filter((s) => s.sub === sub);
        }
        const subName = sub && c.subs ? c.subs.find((s) => s.id === sub) : null;
        $('[data-shop-count]', shop).textContent = items.length
          ? `${items.length} ${items.length === 1 ? 'pieza' : 'piezas'} en stock${subName ? ' · ' + subName.name.toLowerCase() : ''}`
          : 'Por ahora sin stock: se hacen a pedido.';
        grid.className = gridClass(c.id);
        grid.innerHTML = items.map(itemCard).join('') + customCard(c);
      } else {
        document.title = 'Tienda · Decora.te';
        $('[data-shop-title]', shop).textContent = 'Tienda';
        $('[data-shop-count]', shop).textContent = `${STOCK.length} piezas únicas en stock`;
        grid.className = 'shop__groups';
        grid.innerHTML = D.categorias.map((x) => {
          const its = STOCK.filter((s) => s.cat === x.id);
          return `<section class="shop__group">
            <div class="shop__group-head"><h2>${esc(x.name)}</h2><a class="link" href="${x.href}">Ver ${its.length ? 'todos' : 'más'}</a></div>
            <div class="${gridClass(x.id)} shop__grid--todo">${its.slice(0, 2).map(itemCard).join('')}${customCard(x)}</div>
          </section>`;
        }).join('');
      }
      fixHover(shop);
      const cur = tabs.querySelector('[aria-current]');
      if (cur) tabs.scrollTo({ left: cur.offsetLeft - 20, behavior: 'smooth' });
    }
    renderShop();

    // cambiar de categoría sin recargar la página: se desvanece, cambia y vuelve a aparecer
    const body = [grid, subsEl, $('.shop__head', shop)];
    let busy = false;
    function swap(push, href) {
      if (busy) return;
      busy = true;
      if (push) history.pushState(null, '', href);
      body.forEach((e) => e.classList.add('is-swapping'));
      setTimeout(() => {
        renderShop();
        if (window.scrollY > 0) { if (S.lenis) S.lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); }
        setTimeout(() => { body.forEach((e) => e.classList.remove('is-swapping')); busy = false; }, 30);
      }, 180);
    }
    shop.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="tienda.html"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      if (a.getAttribute('href') === location.pathname.split('/').pop() + location.search) return;
      swap(true, a.getAttribute('href'));
    });
    window.addEventListener('popstate', () => swap(false));
  }

  /* ---------------- fotos en pantalla completa con zoom ---------------- */
  function openLightbox(srcs, start, alt) {
    let i = start, zoom = false;
    const lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Fotos de ' + alt);
    lb.innerHTML = `<div class="lb__stage"><img class="lb__img" alt="${esc(alt)}"></div>
      <button type="button" class="lb__close">Cerrar</button>
      <div class="lb__bar"><span class="lb__count"></span><span class="lb__hint">Tocá la foto para acercar · tocá afuera para volver</span></div>
      ${srcs.length > 1 ? '<button type="button" class="lb__side lb__side--prev" aria-label="Foto anterior"><span class="lb__arrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button><button type="button" class="lb__side lb__side--next" aria-label="Foto siguiente"><span class="lb__arrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>' : ''}`;
    document.body.appendChild(lb);
    const img = lb.querySelector('.lb__img'), count = lb.querySelector('.lb__count');
    const set = (k) => { i = (k + srcs.length) % srcs.length; zoom = false; img.classList.toggle('is-zoom', false); img.style.transformOrigin = ''; img.src = srcs[i]; count.textContent = srcs.length > 1 ? `${i + 1} / ${srcs.length}` : ''; };
    set(i);
    if (S.lenis) S.lenis.stop();
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => lb.classList.add('is-open'));
    const key = (e) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') set(i + 1); if (e.key === 'ArrowLeft') set(i - 1); };
    function close() {
      lb.classList.toggle('is-open', false);
      document.documentElement.style.overflow = '';
      if (S.lenis) S.lenis.start();
      document.removeEventListener('keydown', key);
      setTimeout(() => lb.parentNode && lb.parentNode.removeChild(lb), 300);
    }
    document.addEventListener('keydown', key);
    const aim = (e) => { const r = img.getBoundingClientRect(); img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; };
    img.addEventListener('click', (e) => { zoom = !zoom; aim(e); img.classList.toggle('is-zoom', zoom); });
    img.addEventListener('pointermove', (e) => { if (zoom) aim(e); });
    lb.addEventListener('click', (e) => {
      if (e.target.closest('.lb__close')) close();
      else if (e.target.closest('.lb__side--prev')) set(i - 1);
      else if (e.target.closest('.lb__side--next')) set(i + 1);
      else if (!e.target.closest('.lb__img, .lb__bar')) close();  // tocar afuera de la foto vuelve a la pieza
    });
    // deslizar con el dedo para cambiar de foto
    let x0 = null;
    lb.addEventListener('touchstart', (e) => { if (!zoom) x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) set(i + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  /* ---------------- página de una pieza en stock (producto.html?id=…) ---------------- */
  const pdpEl = $('[data-product]');
  const stockId = new URLSearchParams(location.search).get('id');
  if (pdpEl && stockId) {
    const s = STOCK.find((x) => x.id === stockId);
    if (!s) {
      pdpEl.innerHTML = `<div class="wrap" style="padding:calc(var(--top) + 80px) var(--gutter) 120px"><h1 class="display display--md">No encontramos esa pieza</h1><p style="margin:20px 0 30px" class="muted">Puede que ya no esté en stock.</p><a class="btn" href="tienda.html">Ver la tienda</a></div>`;
    } else {
      const c = cat(s.cat);
      document.title = `${s.name} · Decora.te`;
      const subName = s.sub && c.subs ? c.subs.find((x) => x.id === s.sub).name : '';
      const shots = s.fotos.map((n, i) => `<figure class="pdp__shot${i ? '' : ' is-on'}" data-shot="${i}"><img src="${stockImg(n, i > 0)}" srcset="${stockImg(n)} 760w, ${stockImg(n, false)} 1600w" sizes="(min-width: 900px) 56vw, 100vw" alt="${esc(s.name)}${i ? '' : ''}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></figure>`).join('');
      const related = STOCK.filter((x) => x.cat === s.cat && x.id !== s.id).slice(0, 4);
      const thumbs = s.fotos.length > 1 ? `<div class="pdp__thumbs">${s.fotos.map((n, i) => `<button type="button" class="${i ? '' : 'is-on'}" data-thumb="${i}" aria-label="Ver foto ${i + 1}"><img src="${stockImg(n)}" alt="" loading="lazy"></button>`).join('')}</div>` : '';
      const ask = S.wa(`Hola Decora.te! Me interesa: ${s.name} (código ${s.id.toUpperCase()}).`);
      pdpEl.innerHTML = `
        <div class="wrap pdp">
          <div class="pdp__media${s.fotos.length > 1 ? ' has-thumbs' : ''}">
            ${thumbs}
            <div class="pdp__gallery" data-gallery>${shots}</div>
            ${s.fotos.length > 1 ? `<div class="pdp__dots" aria-hidden="true">${s.fotos.map((_, i) => `<span class="${i ? '' : 'is-on'}"></span>`).join('')}</div>` : ''}
          </div>
          <div class="pdp__info">
            <p class="eyebrow"><a href="tienda.html">Tienda</a> · <a href="${c.href}">${esc(c.name)}</a>${subName ? ` · <a href="${c.href}&s=${s.sub}">${esc(subName)}</a>` : ''}</p>
            <h1 class="pdp__name">${esc(s.name)}</h1>
            <p class="pdp__price">${stockPrice(s)}</p>
            ${s.confirmar ? '<p class="pdp__note"><span class="placeholder">[PLACEHOLDER] Precio exacto de esta pieza a confirmar</span></p>' : ''}
            <p class="pdp__stock"><span></span>Pieza única · en stock</p>
            <div class="pdp__buy pdp__buy--one" data-buy>
              <button type="button" class="btn" data-add-stock>Agregar al carrito</button>
            </div>
            <p class="added" data-added aria-live="polite"></p>
            <a class="link" href="${ask}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
            ${c.custom ? `<a class="pdp__custom" href="${c.custom.href}"><small>¿Lo querés en otro cuero?</small><b>${esc(c.custom.label)}</b></a>` : ''}
            <ul class="pdp__notes">
              <li><span>Código</span><span>${s.id.toUpperCase()}</span></li>
              <li><span>Medidas</span><span class="placeholder">[PLACEHOLDER] Medidas de la pieza</span></li>
              <li><span>Elaboración</span><span>Hecho a mano</span></li>
              <li><span>Pago</span><span>Efectivo o transferencia</span></li>
            </ul>
          </div>
        </div>
        ${related.length ? `<section class="sec sec--tight">
          <div class="wrap">
            <div class="shop__group-head"><h2>Más ${esc(c.name.toLowerCase())}</h2><a class="link" href="${c.href}">Ver todos</a></div>
            <div class="${gridClass(c.id)} shop__grid--rel4">${related.map(itemCard).join('')}</div>
          </div>
        </section>` : ''}
        <div class="pdp-bar" data-pdp-bar aria-hidden="true">
          <div><span class="pdp-bar__name">${esc(s.name)}</span><span class="pdp-bar__price">${stockPrice(s)}</span></div>
          <button type="button" class="btn" data-add-stock tabindex="-1">Agregar al carrito</button>
        </div>`;
      pdpEl.addEventListener('click', (e) => {
        if (!e.target.closest('[data-add-stock]')) return;
        const already = Cart.items.some((i) => i.key === 'stock|' + s.id);
        if (already) { $('[data-added]', pdpEl).textContent = 'Ya está en tu carrito.'; S.openDrawer(); return; }
        Cart.add({ key: 'stock|' + s.id, kind: 'stock', id: s.id, name: s.name, detail: ['Pieza única', 'Código ' + s.id.toUpperCase()].concat(s.confirmar ? ['Precio a confirmar'] : []), min: s.min, max: s.max, confirmar: s.confirmar, foto: 'stock/' + (s.portada || s.fotos[0]), qty: 1 });
        $('[data-added]', pdpEl).textContent = 'Agregado al carrito.';
        S.openDrawer();
      });
      const gal = $('[data-gallery]', pdpEl);
      const dots = $$('.pdp__dots span', pdpEl);
      if (gal && dots.length) gal.addEventListener('scroll', () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); dots.forEach((d, k) => d.classList.toggle('is-on', k === i)); }, { passive: true });
      fixHover(pdpEl);

      // compu: miniaturas al costado, una foto grande por vez
      const shotsEl = $$('[data-shot]', pdpEl), thumbsEl = $$('[data-thumb]', pdpEl);
      const show = (i) => { shotsEl.forEach((f, k) => f.classList.toggle('is-on', k === i)); thumbsEl.forEach((t, k) => t.classList.toggle('is-on', k === i)); };
      pdpEl.addEventListener('click', (e) => { const t = e.target.closest('[data-thumb]'); if (t) show(+t.dataset.thumb); });

      // al tocar una foto se abre en pantalla completa, con zoom
      const fotos = s.fotos.map((n) => stockImg(n, false));
      pdpEl.addEventListener('click', (e) => {
        const f = e.target.closest('[data-shot]');
        if (f) openLightbox(fotos, +f.dataset.shot, s.name);
      });

      // celular: barra fija con el precio y el botón cuando el botón principal ya no se ve
      const bar = $('[data-pdp-bar]', pdpEl), buy = $('[data-buy]', pdpEl);
      if (bar && buy && 'IntersectionObserver' in window) {
        new IntersectionObserver(([en]) => {
          const on = !en.isIntersecting && en.boundingClientRect.top < 0;
          bar.classList.toggle('is-on', on); bar.setAttribute('aria-hidden', String(!on));
          document.documentElement.classList.toggle('has-pdp-bar', on);
        }).observe(buy);
      }
    }
  }

  /* ---------------- producto a medida (producto.html?p=…) ---------------- */
  const pdp = stockId ? null : $('[data-product]');
  if (pdp) {
    const id = new URLSearchParams(location.search).get('p');
    const p = prod(id);
    if (!p) {
      pdp.innerHTML = `<div class="wrap" style="padding:calc(var(--top) + 80px) var(--gutter) 120px"><h1 class="display display--md">No encontramos esa pieza</h1><p style="margin:20px 0 30px" class="muted">Puede que el enlace esté incompleto.</p><a class="btn" href="tienda.html">Ver la tienda</a></div>`;
    } else {
      document.title = `${p.name} · Decora.te`;
      const sel = {};
      p.opciones.forEach((g) => { sel[g.key] = g.items[0].id; });
      let leather = null;
      let qty = 1;
      const shots = p.fotos.length
        ? p.fotos.map((f, i) => `<figure class="pdp__shot"><img src="img/${f}${i ? '-sm' : ''}.jpg" srcset="img/${f}-sm.jpg 800w, img/${f}.jpg 1600w" sizes="(min-width: 900px) 56vw, 100vw" alt="${esc(p.alts[i] || p.name)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}${p.pos && p.pos[i] ? ` style="object-position:${p.pos[i]}"` : ''}></figure>`).join('')
        : `<figure class="pdp__shot"><span class="placeholder">${esc(p.placeholder)}</span></figure>`;
      pdp.innerHTML = `
        <div class="wrap pdp">
          <div class="pdp__media${s.fotos.length > 1 ? ' has-thumbs' : ''}">
            ${thumbs}
            <div class="pdp__gallery" data-gallery>${shots}</div>
            ${p.fotos.length > 1 ? `<div class="pdp__dots" aria-hidden="true">${p.fotos.map((_, i) => `<span class="${i ? '' : 'is-on'}"></span>`).join('')}</div>` : ''}
          </div>
          <div class="pdp__info">
            <p class="eyebrow"><a href="tienda.html">Tienda</a> · ${esc(p.line)}</p>
            <h1 class="pdp__name">${esc(p.name)}</h1>
            <p class="pdp__price" data-price aria-live="polite"></p>
            <p class="pdp__desc">${esc(p.desc)}</p>
            ${p.opciones.map((g) => `<fieldset class="pdp__group"><legend>${esc(g.label)}</legend><div class="choices">${g.items.map((it) => `<button type="button" class="choice" data-opt="${g.key}" data-id="${it.id}" aria-pressed="${sel[g.key] === it.id}">${esc(it.name)} <small>${it.note || (g.key === p.opciones[0].key && !p.base ? money(it.price) : (it.price ? '+' + money(it.price) : ''))}</small></button>`).join('')}</div></fieldset>`).join('')}
            ${p.cuero ? `<fieldset class="pdp__group"><legend>Cuero</legend>
              <div class="leathers">
                <button type="button" class="leather leather--none" data-leather="" aria-pressed="true">Lo<br>charlamos</button>
                ${D.cueros.map((c) => `<button type="button" class="leather" data-leather="${c.id}" aria-pressed="false" aria-label="${esc(c.name)}" title="${esc(c.name)}" style="background-image:url(img/cuero-${c.id}-sm.jpg)"></button>`).join('')}
              </div>
              <p class="pdp__leather-name" data-leather-name>Elegí uno o lo definimos por WhatsApp.</p>
            </fieldset>` : ''}
            <div class="pdp__buy">
              <div class="qty" aria-label="Cantidad"><button type="button" data-q="-1" aria-label="Restar uno">–</button><span data-qty>1</span><button type="button" data-q="1" aria-label="Sumar uno">+</button></div>
              <button type="button" class="btn" data-add>Agregar al carrito</button>
            </div>
            <p class="added" data-added aria-live="polite"></p>
            <a class="link" data-ask href="#" target="_blank" rel="noopener">Consultar por WhatsApp</a>
            <ul class="pdp__notes">
              <li><span>Elaboración</span><span>Hecho a mano, a pedido</span></li>
              <li><span>Anticipación</span><span>72 horas</span></li>
              <li><span>Pago</span><span>Efectivo o transferencia</span></li>
            </ul>
          </div>
        </div>
        <section class="sec sec--tight">
          <div class="wrap">
            <div class="head-row"><p class="eyebrow">También en cuero</p><h2 class="display display--md" data-split>Otras piezas</h2></div>
            <div class="cards cards--home" data-stagger>${D.productos.filter((x) => x.id !== p.id).slice(0, 3).map((x) => card(x)).join('')}</div>
          </div>
        </section>`;

      const priceEl = $('[data-price]', pdp);
      const ask = $('[data-ask]', pdp);
      const detail = () => {
        const d = p.opciones.map((g) => g.items.find((i) => i.id === sel[g.key])).filter((it) => it && !(it.price === 0 && it.id === 'no')).map((it) => it.name);
        const c = D.cueros.find((x) => x.id === leather);
        d.push(c ? 'Cuero ' + c.name.toLowerCase() : 'Cuero a definir');
        return d;
      };
      const update = () => {
        const r = priceFor(p, sel);
        priceEl.textContent = range(r.min * qty, r.max * qty);
        $('[data-qty]', pdp).textContent = qty;
        ask.href = S.wa(`Hola Decora.te! Quería consultar por: ${p.name} (${detail().join(', ')}).`);
      };
      update();

      pdp.addEventListener('click', (e) => {
        const o = e.target.closest('[data-opt]');
        if (o) { sel[o.dataset.opt] = o.dataset.id; $$(`[data-opt="${o.dataset.opt}"]`, pdp).forEach((b) => b.setAttribute('aria-pressed', b === o)); update(); return; }
        const l = e.target.closest('[data-leather]');
        if (l) {
          leather = l.dataset.leather || null;
          $$('[data-leather]', pdp).forEach((b) => b.setAttribute('aria-pressed', b === l));
          const c = D.cueros.find((x) => x.id === leather);
          $('[data-leather-name]', pdp).textContent = c ? c.name : 'Elegí uno o lo definimos por WhatsApp.';
          update();
          return;
        }
        const qb = e.target.closest('[data-q]');
        if (qb) { qty = Math.max(1, Math.min(20, qty + Number(qb.dataset.q))); update(); return; }
        if (e.target.closest('[data-add]')) {
          const r = priceFor(p, sel);
          Cart.add({ key: [p.id, ...Object.values(sel), leather || ''].join('|'), kind: 'producto', id: p.id, name: p.name, detail: detail(), min: r.min, max: r.max, foto: p.fotos[0] || null, swatch: leather, qty });
          $('[data-added]', pdp).textContent = 'Agregado al carrito.';
          S.openDrawer();
        }
      });

      const gal = $('[data-gallery]', pdp);
      const dots = $$('.pdp__dots span', pdp);
      if (gal && dots.length) gal.addEventListener('scroll', () => { const i = Math.round(gal.scrollLeft / gal.clientWidth); dots.forEach((d, k) => d.classList.toggle('is-on', k === i)); }, { passive: true });
    }
  }

  /* ---------------- carrito / finalizar compra ---------------- */
  const co = $('[data-checkout]');
  if (co) {
    const itemsBox = $('[data-co-items]', co);
    const formBox = $('[data-co-form]', co);
    const st = { nombre: '', pago: '', nota: '' };
    const PAGO = { efectivo: 'Efectivo', transferencia: 'Transferencia bancaria' };

    const orderCode = () => {
      const d = new Date();
      return `DT-${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    };
    // el mensaje que le llega a Decora.te por WhatsApp: ordenado para leerlo de un vistazo
    // (en WhatsApp, *texto* sale en negrita)
    function msg(code) {
      const t = Cart.total();
      const link = (id) => new URL(`producto.html?id=${id}`, location.href).href;
      const lines = [`*Pedido ${code}*`, `Nombre: ${st.nombre.trim()}`, `Pago: ${PAGO[st.pago]}`, ''];
      Cart.items.forEach((it, i) => {
        const precio = range(it.min * it.qty, it.max * it.qty);
        if (it.kind === 'stock') {
          lines.push(`*${i + 1}. ${it.name}*`, `Pieza en stock · código ${String(it.id).toUpperCase()} · ${precio}`, link(it.id));
        } else {
          lines.push(`*${i + 1}. ${it.qty > 1 ? it.qty + ' x ' : ''}${it.name}*`);
          it.detail.forEach((d) => lines.push(`- ${d}`));
          lines.push(precio);
        }
        lines.push('');
      });
      lines.push(`*Total estimado: ${range(t.min, t.max)}*`);
      if (Cart.items.some((i) => i.min !== i.max || i.confirmar)) lines.push('Hay precios a confirmar.');
      if (st.nota.trim()) lines.push('', `Comentarios: ${st.nota.trim()}`);
      return lines.join('\n');
    }

    function renderItems() {
      const n = Cart.count();
      const cnt = $('[data-co-count]', co);
      if (cnt) cnt.textContent = n ? `${n} ${n === 1 ? 'pieza' : 'piezas'}` : '';
      if (!Cart.items.length) {
        itemsBox.innerHTML = `<div class="co__empty"><p>Tu carrito está vacío.</p><div><a class="link" href="tienda.html">Ver la tienda</a><a class="link" href="arma.html?p=cinto">Armá el tuyo</a></div></div>`;
        formBox.hidden = true;
        return;
      }
      formBox.hidden = false;
      itemsBox.innerHTML = `<h2 class="co__h">Tu pedido</h2><ul class="co__list">${Cart.items.map((it) => {
        const img = it.img3d ? `<img src="${it.img3d}" alt="">` : it.foto ? `<img src="img/${it.foto}-sm.jpg" alt="" loading="lazy">` : (it.swatch ? `<span class="ci__swatch" style="background-image:url(img/cuero-${it.swatch}-sm.jpg)"></span>` : '<span class="ci__empty"></span>');
        return `<li class="coi" data-uid="${it.uid}">
          <div class="coi__media">${img}</div>
          <div class="coi__body">
            <p class="coi__name">${esc(it.name)}</p>
            ${it.detail.length ? `<p class="coi__detail">${it.detail.map(esc).join(' · ')}</p>` : ''}
            <div class="coi__row">
              <div class="qty" aria-label="Cantidad"><button type="button" data-qty="-1" aria-label="Restar uno">–</button><span>${it.qty}</span><button type="button" data-qty="1" aria-label="Sumar uno">+</button></div>
              <button type="button" class="coi__remove" data-remove>Quitar</button>
            </div>
          </div>
          <span class="coi__price">${range(it.min * it.qty, it.max * it.qty)}</span>
        </li>`;
      }).join('')}</ul>`;
      const t = Cart.total();
      $('[data-co-sub]', co).textContent = range(t.min, t.max);
      $('[data-co-var]', co).hidden = !Cart.items.some((x) => x.min !== x.max);
    }

    formBox.innerHTML = `
      <h2 class="co__h">Tus datos</h2>
      <div class="field"><label for="c-nombre">Nombre</label><input id="c-nombre" data-f="nombre" autocomplete="name" required><p class="field__err" data-err="nombre"></p></div>
      <fieldset class="field co__pay"><legend>¿Cómo pagás?</legend>
        <div class="co__opts">
          <label class="co__opt"><input type="radio" name="pago" value="efectivo" data-f="pago"><span>Efectivo</span></label>
          <label class="co__opt"><input type="radio" name="pago" value="transferencia" data-f="pago"><span>Transferencia</span></label>
        </div>
        <p class="field__err" data-err="pago"></p>
      </fieldset>
      <div class="field"><label for="c-nota">Comentarios (opcional)</label><textarea id="c-nota" data-f="nota" rows="2" placeholder="Medidas, para cuándo lo necesitás…"></textarea></div>
      <div class="co__total"><span>Total estimado</span><strong data-co-sub></strong></div>
      <p class="co__var" data-co-var hidden>Las piezas a medida tienen precio en rango: el final te lo confirmamos por WhatsApp.</p>
      <button type="button" class="btn btn--wide co__send" data-co-send>Enviar pedido por WhatsApp</button>
      <ol class="co__steps">
        <li>Se abre WhatsApp con tu pedido ya escrito.</li>
        <li>Te confirmamos precio y fecha. Trabajamos con 72 horas de anticipación.</li>
        <li>Pagás en efectivo o por transferencia. No se cobra nada en la web.</li>
      </ol>`;

    co.addEventListener('input', (e) => {
      const f = e.target.dataset.f;
      if (!f) return;
      st[f] = e.target.value;
      const err = $(`[data-err="${f}"]`, co);
      if (err) err.textContent = '';
      e.target.removeAttribute('aria-invalid');
    });
    co.addEventListener('click', (e) => {
      const row = e.target.closest('.coi');
      if (row && e.target.closest('[data-qty]')) { const it = Cart.items.find((i) => i.uid === row.dataset.uid); if (it) Cart.setQty(it.uid, it.qty + Number(e.target.closest('[data-qty]').dataset.qty)); return; }
      if (row && e.target.closest('[data-remove]')) { Cart.remove(row.dataset.uid); return; }
      if (e.target.closest('[data-co-send]')) {
        const errs = {};
        if (!st.nombre.trim()) errs.nombre = 'Contanos tu nombre.';
        if (!st.pago) errs.pago = 'Elegí cómo pagás.';
        Object.entries(errs).forEach(([k, v]) => { $(`[data-err="${k}"]`, co).textContent = v; });
        if (errs.nombre) $('#c-nombre').setAttribute('aria-invalid', 'true');
        if (Object.keys(errs).length) { S.scrollToEl(formBox, -100); return; }
        const code = orderCode();
        const url = S.wa(msg(code));
        window.open(url, '_blank', 'noopener');
        co.querySelector('.co__grid').innerHTML = `<div class="co__done">
          <p class="co__code">Pedido ${code}</p>
          <h2>Tu pedido se abrió en WhatsApp</h2>
          <p>Envialo desde ahí y te respondemos para confirmar. Si no se abrió, tocá el botón.</p>
          <a class="btn btn--wide" href="${url}" target="_blank" rel="noopener">Abrir WhatsApp de nuevo</a>
          <button type="button" class="btn btn--ghost btn--wide" data-co-clear>Ya lo envié, vaciar carrito</button>
        </div>`;
        window.scrollTo(0, 0);
      }
      if (e.target.closest('[data-co-clear]')) { Cart.clear(); location.href = 'index.html'; }
    });
    document.addEventListener('carrito', renderItems);
    renderItems();
  }

  /* ---------------- adelanto del armador en el inicio ---------------- */
  const teaser = $('[data-teaser]');
  if (teaser && window.DTBelt) {
    const COMBOS = [
      { tipo: 'decorativo', cueros: ['cebra', 'bordo'], hebilla: 'rellena', union: 'remaches', deco: 'no' },
      { tipo: 'funcional', cueros: ['croco-chocolate'], hebilla: 'normal', union: 'ninguna', deco: 'si' },
      { tipo: 'decorativo', cueros: ['leopardo', 'azul-charol', 'plateado'], hebilla: 'pedreria', union: 'argollas', deco: 'no' },
      { tipo: 'funcional', cueros: ['rojo', 'croco-turquesa'], hebilla: 'normal', union: 'trenzado', deco: 'no' },
    ];
    const belt = window.DTBelt.create(teaser, { reduced: !S.motion });
    const chips = $('[data-teaser-chips]');
    const cap = $('[data-teaser-caption]');
    let i = 0, timer = null, started = false;
    const show = (k, redraw) => {
      const c = COMBOS[k];
      belt.update(c, { redraw });
      if (chips) chips.innerHTML = c.cueros.map((id) => `<span class="is-on" style="background-image:url(img/cuero-${id}-sm.jpg)" title="${esc(D.cueros.find((x) => x.id === id).name)}"></span>`).join('');
      if (cap) {
        const t = D.tipos.find((x) => x.id === c.tipo);
        cap.textContent = `${t.name} · ${c.cueros.map((id) => D.cueros.find((x) => x.id === id).name).join(' + ')}`;
      }
    };
    show(0, false);
    const start = () => {
      if (started) return;
      started = true;
      show(0, true);
      timer = setInterval(() => { i = (i + 1) % COMBOS.length; show(i, false); }, 3400);
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { if (en.isIntersecting) start(); else if (started) { clearInterval(timer); started = false; } }, { threshold: 0.35 }).observe(teaser);
    else start();
  }
})();
