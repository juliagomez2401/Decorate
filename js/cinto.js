/* =========================================================
   Decora.te — dibujo del cinto (SVG)
   Un cinto abierto apoyado en curva suave: hebilla, pasador,
   cueros reales como textura, pespunte, uniones, tachas y agujeros.
   Uso: const b = DTBelt.create(contenedor); b.update({ tipo, cueros, hebilla, union, deco });
   ========================================================= */
window.DTBelt = (() => {
  let uid = 0;
  const GLOSS = { 'azul-charol': 0.28, plateado: 0.22, 'croco-turquesa': 0.12, 'croco-chocolate': 0.1 };

  // dos composiciones: apaisada (compu) y alta (celular)
  // cada composición es una cadena de curvas (inicio, control, control, fin)
  const LAYOUTS = {
    wide: {
      vb: [1000, 560],
      p: [
        [[95, 330], [215, 120], [410, 110], [510, 285]],
        [[510, 285], [610, 460], [790, 500], [925, 255]],
      ],
      w: { funcional: 44, decorativo: 82 },
    },
    tall: {
      vb: [1000, 900],
      p: [
        [[170, 700], [60, 420], [260, 160], [500, 250]],
        [[500, 250], [760, 345], [960, 560], [800, 760]],
      ],
      w: { funcional: 64, decorativo: 118 },
    },
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const f = (n) => Math.round(n * 10) / 10;

  function bezier(P, t) {
    const u = 1 - t;
    const x = u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0];
    const y = u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1];
    return [x, y];
  }

  // muestreo por longitud de arco
  function buildPath(chain) {
    const N = 400;
    const pts = [];
    let len = 0;
    let prev = bezier(chain[0], 0);
    pts.push({ x: prev[0], y: prev[1], s: 0 });
    chain.forEach((P) => {
      for (let i = 1; i <= N; i++) {
        const q = bezier(P, i / N);
        len += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
        pts.push({ x: q[0], y: q[1], s: len });
        prev = q;
      }
    });
    const at = (s) => {
      s = Math.max(0, Math.min(len, s));
      let lo = 0, hi = pts.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m].s < s) lo = m; else hi = m; }
      const a = pts[lo], b = pts[hi];
      const t = b.s === a.s ? 0 : (s - a.s) / (b.s - a.s);
      let tx = b.x - a.x, ty = b.y - a.y;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), tx, ty, nx: -ty, ny: tx, ang: Math.atan2(ty, tx) * 180 / Math.PI };
    };
    return { len, at };
  }

  /* contorno de un tramo [a,b] con ancho w; si tip>0 termina en punta redondeada */
  function bandPoints(path, a, b, w, tip, step = 5) {
    const L = [], R = [];
    const n = Math.max(2, Math.ceil((b - a) / step));
    for (let i = 0; i <= n; i++) {
      const p = path.at(a + (b - a) * i / n);
      L.push([p.x + p.nx * w / 2, p.y + p.ny * w / 2]);
      R.push([p.x - p.nx * w / 2, p.y - p.ny * w / 2]);
    }
    const T = [];
    if (tip > 0) {
      const e = path.at(b);
      for (let i = 1; i < 24; i++) {
        const phi = Math.PI * i / 24;
        const along = Math.pow(Math.sin(phi), 0.75) * tip;
        const across = Math.cos(phi) * w / 2;
        T.push([e.x + e.tx * along + e.nx * across, e.y + e.ty * along + e.ny * across]);
      }
    }
    return { L, R, T };
  }
  const closed = ({ L, R, T }) => 'M' + L.concat(T, R.slice().reverse()).map((q) => f(q[0]) + ' ' + f(q[1])).join('L') + 'Z';
  const open = (arr) => 'M' + arr.map((q) => f(q[0]) + ' ' + f(q[1])).join('L');

  function star(r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return 'M' + pts.map((q) => f(q[0]) + ' ' + f(q[1])).join('L') + 'Z';
  }

  /* ---------------- hebillas (coordenadas locales, centro 0,0) ---------------- */
  function buckle(kind, w, id) {
    const H = w * 1.36;
    const t = Math.max(5, w * 0.11);
    if (kind === 'rellena') {
      const rx = w * 0.62, ry = H * 0.56;
      const rays = Array.from({ length: 16 }, (_, i) => {
        const a = i * Math.PI / 8;
        return `M${f(Math.cos(a) * rx * 0.36)} ${f(Math.sin(a) * ry * 0.36)}L${f(Math.cos(a) * rx * 0.7)} ${f(Math.sin(a) * ry * 0.7)}`;
      }).join('');
      return `
        <ellipse cx="0" cy="${f(w * 0.05)}" rx="${f(rx)}" ry="${f(ry)}" fill="rgba(30,18,10,.35)"/>
        <ellipse cx="0" cy="0" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${id}-plate)" stroke="#6b4c22" stroke-width="1.2"/>
        <ellipse cx="0" cy="0" rx="${f(rx * 0.9)}" ry="${f(ry * 0.9)}" fill="none" stroke="#f3e2b4" stroke-width="${f(t * 0.32)}" stroke-dasharray="1.5 ${f(t * 0.42)}" stroke-linecap="round" opacity=".9"/>
        <ellipse cx="0" cy="0" rx="${f(rx * 0.78)}" ry="${f(ry * 0.78)}" fill="none" stroke="#6b4c22" stroke-width="1" opacity=".55"/>
        <path d="${rays}" stroke="#7a5828" stroke-width="1.1" opacity=".55"/>
        <ellipse cx="0" cy="0" rx="${f(rx * 0.3)}" ry="${f(ry * 0.3)}" fill="url(#${id}-brass)" stroke="#5c421c" stroke-width="1"/>
        <ellipse cx="${f(-rx * 0.08)}" cy="${f(-ry * 0.1)}" rx="${f(rx * 0.12)}" ry="${f(ry * 0.08)}" fill="#fff8e2" opacity=".7"/>`;
    }
    const W = w * 0.8;
    const stones = kind === 'pedreria';
    const tt = stones ? t * 1.5 : t;
    let gems = '';
    if (stones) {
      const r = tt * 0.32;
      const xs = [], ys = [];
      const nx = Math.max(2, Math.round(W / (r * 3))), ny = Math.max(3, Math.round(H / (r * 3)));
      for (let i = 0; i <= nx; i++) xs.push(-W / 2 + W * i / nx);
      for (let j = 0; j <= ny; j++) ys.push(-H / 2 + H * j / ny);
      const spots = [];
      xs.forEach((x) => { spots.push([x, -H / 2], [x, H / 2]); });
      ys.slice(1, -1).forEach((y) => { spots.push([-W / 2, y], [W / 2, y]); });
      gems = spots.map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${id}-gem)" stroke="#8f969c" stroke-width=".6"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.28)}" fill="#fff"/>`).join('');
    }
    return `
      <rect x="${f(-W / 2 + 2)}" y="${f(-H / 2 + w * 0.06)}" width="${f(W)}" height="${f(H)}" rx="${f(H * 0.13)}" fill="none" stroke="rgba(30,18,10,.32)" stroke-width="${f(tt)}"/>
      <rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" rx="${f(H * 0.13)}" fill="none" stroke="url(#${id}-brass)" stroke-width="${f(tt)}"/>
      <rect x="${f(-W / 2 + tt / 2)}" y="${f(-H / 2 + tt / 2)}" width="${f(W - tt)}" height="${f(H - tt)}" rx="${f(H * 0.09)}" fill="none" stroke="rgba(60,38,14,.35)" stroke-width="1"/>
      ${gems}
      <rect x="${f(-W / 2 - t * 0.7)}" y="${f(-H * 0.34)}" width="${f(t * 1.4)}" height="${f(H * 0.68)}" rx="${f(t * 0.7)}" fill="url(#${id}-brass)" stroke="#6b4c22" stroke-width=".8"/>
      <path d="M${f(-W / 2)} ${f(-t * 0.34)}L${f(W / 2 + tt * 0.25)} ${f(-t * 0.2)}Q${f(W / 2 + tt * 0.75)} 0 ${f(W / 2 + tt * 0.25)} ${f(t * 0.2)}L${f(-W / 2)} ${f(t * 0.34)}Z" fill="url(#${id}-brass)" stroke="#6b4c22" stroke-width=".8"/>`;
  }

  function create(host, opts = {}) {
    const id = 'dtb' + (++uid);
    const reduced = !!opts.reduced;
    host.innerHTML = `
      <svg class="beltsvg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Vista previa del cinto">
        <defs>
          <linearGradient id="${id}-brass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#f7e9c2"/><stop offset=".28" stop-color="#d2ae6c"/><stop offset=".55" stop-color="#8a6630"/><stop offset=".8" stop-color="#e3c78a"/><stop offset="1" stop-color="#a47f43"/>
          </linearGradient>
          <radialGradient id="${id}-plate" cx=".38" cy=".32" r=".8">
            <stop offset="0" stop-color="#f6e6bb"/><stop offset=".5" stop-color="#c49f5e"/><stop offset="1" stop-color="#6c4f25"/>
          </radialGradient>
          <radialGradient id="${id}-gem" cx=".35" cy=".3" r=".8">
            <stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e3e8ec"/><stop offset="1" stop-color="#9aa3aa"/>
          </radialGradient>
          <radialGradient id="${id}-rivet" cx=".35" cy=".3" r=".75">
            <stop offset="0" stop-color="#fff5d8"/><stop offset=".45" stop-color="#d1b071"/><stop offset="1" stop-color="#6e5126"/>
          </radialGradient>
          <linearGradient id="${id}-empty" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#e2d6c3"/><stop offset="1" stop-color="#d4c6b0"/>
          </linearGradient>
          <filter id="${id}-shadow" x="-10%" y="-30%" width="120%" height="170%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="9"/>
            <feOffset dy="16" result="b1"/>
            <feComponentTransfer in="b1" result="s1"><feFuncA type="linear" slope=".3"/></feComponentTransfer>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.6"/>
            <feOffset dy="2.5" result="b2"/>
            <feComponentTransfer in="b2" result="s2"><feFuncA type="linear" slope=".38"/></feComponentTransfer>
            <feMerge><feMergeNode in="s1"/><feMergeNode in="s2"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="${id}-soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>
          <mask id="${id}-reveal" maskUnits="userSpaceOnUse"><path class="beltsvg__reveal" fill="none" stroke="#fff" stroke-linecap="round"/></mask>
        </defs>
        <g class="beltsvg__all" mask="url(#${id}-reveal)"><g filter="url(#${id}-shadow)" class="beltsvg__body"></g></g>
      </svg>`;
    const svg = host.firstElementChild;
    const body = svg.querySelector('.beltsvg__body');
    const reveal = svg.querySelector('.beltsvg__reveal');

    let layout = null;
    let path = null;
    let state = { tipo: null, cueros: [], hebilla: null, union: null, deco: null };
    let prevCueros = [];
    let w = null;
    let raf = 0;

    function pickLayout() {
      const narrow = host.clientWidth && host.clientWidth / Math.max(1, host.clientHeight || host.clientWidth) < 1.25;
      const next = narrow ? LAYOUTS.tall : LAYOUTS.wide;
      if (next !== layout) {
        layout = next;
        path = buildPath(layout.p);
        svg.setAttribute('viewBox', `0 0 ${layout.vb[0]} ${layout.vb[1]}`);
        w = null;
        return true;
      }
      return false;
    }

    function targetW() { return layout.w[state.tipo || 'funcional'] * (state.tipo ? 1 : 0.95); }

    function draw() {
      const bw = w * 0.9; // ancho que ocupa la hebilla a lo largo
      const tipLen = w * 0.8;
      const end = path.len - tipLen;
      const n = Math.max(1, state.cueros.length);
      const startS = bw * 0.9;
      const segLen = (end - startS) / n;
      const bounds = [0];
      for (let i = 1; i < n; i++) bounds.push(startS + segLen * i);
      bounds.push(end);
      const gap = state.union === 'argollas' && n > 1 ? w * 0.36 : 0;
      const empty = !state.cueros.length;

      let defs = '';
      let segs = '';
      let stitches = '';
      let clip = '';
      let edges = '';

      for (let i = 0; i < n; i++) {
        const a = i === 0 ? 0 : bounds[i] + gap / 2;
        const b = i === n - 1 ? end : bounds[i + 1] - gap / 2;
        const isLast = i === n - 1;
        const pts = bandPoints(path, a, b, w, isLast ? tipLen : 0);
        const d = closed(pts);
        clip += `<path d="${d}"/>`;
        edges += `<path d="${d}" fill="none" stroke="#22150d" stroke-opacity=".55" stroke-width="2"/>`;
        const cid = state.cueros[i];
        let fill = `url(#${id}-empty)`;
        if (cid) {
          // textura en mosaico espejado para que no se noten cortes, alineada con el tramo
          const mid = path.at((a + b) / 2);
          const T = w * 2;
          const pid = `${id}-p${i}`;
          defs += `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${f(T * 2)}" height="${f(T * 2)}" patternTransform="translate(${f(mid.x)} ${f(mid.y)}) rotate(${f(mid.ang)})">
              <image href="img/cuero-${cid}.jpg" width="${f(T)}" height="${f(T)}" preserveAspectRatio="xMidYMid slice"/>
              <image href="img/cuero-${cid}.jpg" width="${f(T)}" height="${f(T)}" preserveAspectRatio="xMidYMid slice" transform="translate(${f(T * 2)} 0) scale(-1 1)"/>
              <image href="img/cuero-${cid}.jpg" width="${f(T)}" height="${f(T)}" preserveAspectRatio="xMidYMid slice" transform="translate(0 ${f(T * 2)}) scale(1 -1)"/>
              <image href="img/cuero-${cid}.jpg" width="${f(T)}" height="${f(T)}" preserveAspectRatio="xMidYMid slice" transform="translate(${f(T * 2)} ${f(T * 2)}) scale(-1 -1)"/>
            </pattern>`;
          fill = `url(#${pid})`;
        }
        const changed = cid && prevCueros[i] !== cid;
        segs += `<path class="beltsvg__seg${changed ? ' is-new' : ''}" d="${d}" fill="${fill}"/>`;
        if (cid && GLOSS[cid]) {
          const g = bandPoints(path, a + w * 0.1, b - (isLast ? 0 : w * 0.1), w * 0.22, 0);
          // brillo corrido hacia el borde de arriba
          const shift = (arr) => arr.map((q, k) => { const p = path.at(a + w * 0.1 + (b - a - w * 0.2) * k / (arr.length - 1)); return [q[0] - p.nx * w * 0.18, q[1] - p.ny * w * 0.18]; });
          segs += `<path d="${closed({ L: shift(g.L), R: shift(g.R), T: [] })}" fill="#fff" opacity="${GLOSS[cid]}" filter="url(#${id}-soft)"/>`;
        }
        // pespunte de cada pieza
        const inset = Math.max(5, w * 0.12);
        const m0 = i === 0 ? bw * 0.55 : w * 0.14;
        const m1 = isLast ? 0 : w * 0.14;
        const sp = bandPoints(path, a + m0, b - m1, w - inset * 2, isLast ? tipLen - inset * 1.1 : 0);
        const strokeCol = empty ? 'rgba(28,20,16,.28)' : 'rgba(255,244,224,.62)';
        const dash = `${f(Math.max(4, w * 0.09))} ${f(Math.max(3, w * 0.06))}`;
        if (isLast) stitches += `<path d="${open(sp.L.concat(sp.T, sp.R.slice().reverse()))}" fill="none" stroke="${strokeCol}" stroke-width="1.6" stroke-dasharray="${dash}"/>`;
        else stitches += `<path d="${open(sp.L)}" fill="none" stroke="${strokeCol}" stroke-width="1.6" stroke-dasharray="${dash}"/><path d="${open(sp.R)}" fill="none" stroke="${strokeCol}" stroke-width="1.6" stroke-dasharray="${dash}"/>`;
      }

      // luz y sombra: volumen del cuero
      const full = bandPoints(path, 0, end, w, tipLen);
      const up = bandPoints(path, 0, end, w * 0.5, 0);
      const toEdge = (arr, sign) => arr.map((q, k) => { const p = path.at(end * k / (arr.length - 1)); return [q[0] + sign * p.nx * w * 0.3, q[1] + sign * p.ny * w * 0.3]; });
      defs += `<clipPath id="${id}-clip">${clip}</clipPath>`;
      const shade = `
        <g clip-path="url(#${id}-clip)">
          <path d="${closed({ L: toEdge(up.L, -1), R: toEdge(up.R, -1), T: [] })}" fill="#fff" opacity=".1" filter="url(#${id}-soft)"/>
          <path d="${closed({ L: toEdge(up.L, 1), R: toEdge(up.R, 1), T: [] })}" fill="#000" opacity=".2" filter="url(#${id}-soft)"/>
        </g>`;

      // uniones
      let seams = '';
      if (n > 1 && state.union && state.union !== 'ninguna') {
        for (let i = 1; i < n; i++) {
          const p = path.at(bounds[i]);
          let g = '';
          if (state.union === 'remaches') {
            const r = Math.max(4.5, w * 0.075);
            const ys = w > 90 ? [-w * 0.3, 0, w * 0.3] : [-w * 0.22, w * 0.22];
            g = `<path d="M0 ${f(-w / 2)}V${f(w / 2)}" stroke="rgba(0,0,0,.45)" stroke-width="2"/><path d="M1.6 ${f(-w / 2)}V${f(w / 2)}" stroke="rgba(255,255,255,.18)" stroke-width="1"/>`
              + ys.map((y) => `<circle cx="${f(w * 0.16)}" cy="${f(y + 1.5)}" r="${f(r)}" fill="rgba(0,0,0,.35)"/><circle cx="${f(w * 0.16)}" cy="${f(y)}" r="${f(r)}" fill="url(#${id}-rivet)" stroke="#5e4420" stroke-width=".7"/>`).join('');
          } else if (state.union === 'argollas') {
            const rx = w * 0.2, ry = w * 0.52, sw = Math.max(4, w * 0.085);
            g = `<ellipse cx="1.5" cy="3" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="rgba(25,15,8,.35)" stroke-width="${f(sw)}"/>
                 <ellipse cx="0" cy="0" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="url(#${id}-brass)" stroke-width="${f(sw)}"/>`;
          } else if (state.union === 'trenzado') {
            const d = w * 0.36;
            const k = w > 90 ? 5 : 3;
            const h = w / k;
            let lace = `<rect x="${f(-d / 2)}" y="${f(-w / 2)}" width="${f(d)}" height="${f(w)}" fill="rgba(20,12,6,.28)"/>`;
            for (let j = 0; j < k; j++) {
              const y0 = -w / 2 + h * j + h * 0.12, y1 = y0 + h * 0.76;
              lace += `<path d="M${f(-d * 0.36)} ${f(y0)}L${f(d * 0.36)} ${f(y1)}M${f(d * 0.36)} ${f(y0)}L${f(-d * 0.36)} ${f(y1)}" stroke="rgba(0,0,0,.35)" stroke-width="${f(w * 0.075)}" stroke-linecap="round" transform="translate(0 1.4)"/>
                       <path d="M${f(-d * 0.36)} ${f(y0)}L${f(d * 0.36)} ${f(y1)}M${f(d * 0.36)} ${f(y0)}L${f(-d * 0.36)} ${f(y1)}" stroke="#d8c29c" stroke-width="${f(w * 0.065)}" stroke-linecap="round"/>`;
            }
            g = lace;
          }
          seams += `<g class="beltsvg__seam" transform="translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.ang)})">${g}</g>`;
        }
      }

      // agujeros cerca de la punta
      let holes = '';
      const hr = Math.max(3.4, Math.min(w * 0.075, 7));
      for (let i = 0; i < 5; i++) {
        const p = path.at(end - w * 0.3 - i * w * 0.5);
        holes += `<ellipse cx="${f(p.x)}" cy="${f(p.y + 0.8)}" rx="${f(hr)}" ry="${f(hr)}" fill="rgba(255,240,220,.22)"/><circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(hr)}" fill="#140b06"/>`;
      }

      // tachas
      let studs = '';
      if (state.deco === 'si') {
        const from = bw + w * 1.0, to = end - w * 3.0;
        const avoid = bounds.slice(1, -1);
        const rows = w > 90 ? [-w * 0.24, w * 0.24] : [0];
        const step = w > 90 ? w * 0.62 : w * 0.85;
        rows.forEach((off, ri) => {
          for (let s = from + (ri ? step / 2 : 0); s < to; s += step) {
            if (avoid.some((b) => Math.abs(b - s) < w * 0.45)) continue;
            const p = path.at(s);
            const r = w > 90 ? w * 0.1 : w * 0.15;
            const x = p.x + p.nx * off, y = p.y + p.ny * off;
            studs += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(p.ang)})"><path d="${star(r)}" fill="rgba(0,0,0,.35)" transform="translate(0 1.6)"/><path class="beltsvg__stud" d="${star(r)}" fill="url(#${id}-brass)" stroke="#6b4c22" stroke-width=".6"/></g>`;
          }
        });
      }

      // pasador (presilla) y hebilla
      const kp = path.at(bw + w * 0.45);
      const keeper = `<g transform="translate(${f(kp.x)} ${f(kp.y)}) rotate(${f(kp.ang)})">
          <rect x="${f(-w * 0.15 + 1)}" y="${f(-w * 0.56 + 3)}" width="${f(w * 0.3)}" height="${f(w * 1.12)}" rx="${f(w * 0.06)}" fill="rgba(0,0,0,.3)"/>
          <rect x="${f(-w * 0.15)}" y="${f(-w * 0.56)}" width="${f(w * 0.3)}" height="${f(w * 1.12)}" rx="${f(w * 0.06)}" fill="${state.cueros[0] ? `url(#${id}-p0)` : `url(#${id}-empty)`}" stroke="#22150d" stroke-opacity=".6" stroke-width="1.5"/>
          <rect x="${f(-w * 0.15)}" y="${f(-w * 0.56)}" width="${f(w * 0.3)}" height="${f(w * 1.12)}" rx="${f(w * 0.06)}" fill="rgba(0,0,0,.18)"/>
        </g>`;
      const bp = path.at(bw * 0.42);
      const bk = `<g class="beltsvg__buckle${state.hebilla ? '' : ' is-ghost'}" transform="translate(${f(bp.x)} ${f(bp.y)}) rotate(${f(bp.ang)})">${buckle(state.hebilla || 'normal', w, id)}</g>`;

      body.innerHTML = `<defs>${defs}</defs>${segs}${shade}${edges}${stitches}${seams}${holes}${studs}${keeper}${bk}`;
      prevCueros = state.cueros.slice();

      // trazo de la máscara que "dibuja" el cinto
      const c = [];
      for (let i = 0; i <= 60; i++) { const p = path.at(path.len * i / 60); c.push([p.x, p.y]); }
      reveal.setAttribute('d', open(c));
      reveal.setAttribute('stroke-width', f(w * 4));
    }

    function animateW() {
      cancelAnimationFrame(raf);
      const from = w == null ? targetW() : w;
      const to = targetW();
      if (reduced || Math.abs(from - to) < 0.5) { w = to; draw(); return; }
      const t0 = performance.now();
      const dur = 750;
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - k, 4);
        w = from + (to - from) * e;
        draw();
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    let revealAnim = null;
    function drawIn() {
      if (reduced || !reveal.animate) return;
      const L = path.len + 400;
      reveal.style.strokeDasharray = `${L} ${L}`;
      if (revealAnim) revealAnim.cancel();
      revealAnim = reveal.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 1800, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'forwards' });
      revealAnim.onfinish = () => { reveal.style.strokeDasharray = 'none'; revealAnim.cancel(); revealAnim = null; };
    }

    function update(next, { redraw = false } = {}) {
      const prevTipo = state.tipo;
      state = { ...state, ...next, cueros: (next.cueros || state.cueros).slice() };
      if (w == null) { w = targetW(); draw(); return; }
      if (state.tipo !== prevTipo) animateW();
      else draw();
      if (redraw) drawIn();
    }

    pickLayout();
    w = targetW();
    draw();
    reveal.style.strokeDasharray = 'none';

    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { if (pickLayout()) { w = targetW(); draw(); reveal.style.strokeDasharray = 'none'; } }).observe(host);
    }

    return { update, drawIn, get state() { return state; } };
  }

  return { create };
})();
