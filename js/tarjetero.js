/* =========================================================
   Decora.te — dibujo del tarjetero (SVG con volumen)
   Panel de atrás, una tarjeta asomando, bolsillo de adelante con
   el cuero real como textura, detalle opcional (franja o V) en un
   segundo cuero, pespunte y tachas.
   Uso: const t = DTTarjetero.create(contenedor); t.update({ cuero, detalle, cuero2, tachas });
   ========================================================= */
window.DTTarjetero = (() => {
  let uid = 0;
  const GLOSS = { 'azul-charol': 0.3, plateado: 0.24, 'croco-turquesa': 0.12, 'croco-chocolate': 0.1 };
  // color del hilo según el cuero, para que el pespunte se lea
  const HILO = { cebra: '#3a2a20', plateado: '#5b5b5b', vaca: '#4a3324', leopardo: '#3a2a20' };

  // medidas del tarjetero dentro del viewBox (600 x 430)
  const X = 130, W = 340, TOP_BACK = 92, TOP_FRONT = 150, BOTTOM = 338, R = 16;

  function create(host) {
    const id = 'tj' + (++uid);
    host.innerHTML = `<div class="pz3d"><svg class="pz3d__svg" viewBox="0 0 600 430" role="img" aria-label="Vista del tarjetero">
      <defs>
        <linearGradient id="${id}-vol" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/>
          <stop offset=".75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/>
        </linearGradient>
        <linearGradient id="${id}-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".12" stop-color="#000" stop-opacity="0"/>
          <stop offset=".88" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/>
        </linearGradient>
        <radialGradient id="${id}-stud" cx=".38" cy=".32" r=".75">
          <stop offset="0" stop-color="#fbf0cf"/><stop offset=".45" stop-color="#c9a464"/><stop offset="1" stop-color="#6a4c22"/>
        </radialGradient>
        <linearGradient id="${id}-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f6efe2"/><stop offset="1" stop-color="#e2d6c2"/>
        </linearGradient>
        <filter id="${id}-shadow" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
        <filter id="${id}-soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="4"/></filter>
        <g id="${id}-pats"></g>
      </defs>
      <g class="pz3d__body"></g>
    </svg></div>`;
    const svg = host.querySelector('svg');
    const body = svg.querySelector('.pz3d__body');
    const pats = svg.querySelector(`#${id}-pats`);

    const pattern = (pid, cuero, size = 560) =>
      `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${size}" height="${size}"><image href="img/cuero-${cuero}.jpg" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"/></pattern>`;

    // contorno del bolsillo de adelante: arriba con media luna para sacar las tarjetas
    function frontPath(detalle) {
      const y = TOP_FRONT, b = BOTTOM, x2 = X + W, cx = X + W / 2;
      const top = detalle === 'v'
        ? `M${X} ${y + R} Q${X} ${y} ${X + R} ${y} L${x2 - R} ${y} Q${x2} ${y} ${x2} ${y + R}`
        : `M${X} ${y + R} Q${X} ${y} ${X + R} ${y} L${cx - 62} ${y} C${cx - 40} ${y} ${cx - 34} ${y + 26} ${cx} ${y + 26} C${cx + 34} ${y + 26} ${cx + 40} ${y} ${cx + 62} ${y} L${x2 - R} ${y} Q${x2} ${y} ${x2} ${y + R}`;
      return `${top} L${x2} ${b - R} Q${x2} ${b} ${x2 - R} ${b} L${X + R} ${b} Q${X} ${b} ${X} ${b - R} Z`;
    }
    const backPath = () => {
      const y = TOP_BACK, b = BOTTOM, x2 = X + W;
      return `M${X} ${y + R} Q${X} ${y} ${X + R} ${y} L${x2 - R} ${y} Q${x2} ${y} ${x2} ${y + R} L${x2} ${b - R} Q${x2} ${b} ${x2 - R} ${b} L${X + R} ${b} Q${X} ${b} ${X} ${b - R} Z`;
    };
    // pespunte: costados y abajo del bolsillo, a 11 px del borde
    const stitchPath = () => {
      const i = 11, y = TOP_FRONT + 8, b = BOTTOM - i, x1 = X + i, x2 = X + W - i;
      return `M${x1} ${y} L${x1} ${b - 6} Q${x1} ${b} ${x1 + 6} ${b} L${x2 - 6} ${b} Q${x2} ${b} ${x2} ${b - 6} L${x2} ${y}`;
    };
    function studs() {
      const out = [];
      const i = 24, x1 = X + i, x2 = X + W - i, y1 = TOP_FRONT + 26, y2 = BOTTOM - i;
      const step = 27;
      for (let y = y1; y <= y2 + 1; y += step) { out.push([x1, y], [x2, y]); }
      const n = Math.round((x2 - x1) / step);
      for (let k = 1; k < n; k++) out.push([x1 + (x2 - x1) * k / n, y2]);
      return out.map(([x, y]) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><circle r="6.4" fill="#000" opacity=".25" cx="1.4" cy="2"/><circle r="6" fill="url(#${id}-stud)"/><circle r="2" cx="-1.8" cy="-2" fill="#fff8e3" opacity=".8"/></g>`).join('');
    }
    function detail(d, fill) {
      const cx = X + W / 2, y = TOP_FRONT;
      if (d === 'franja') {
        const y1 = y + 58, h = 30;
        return `<rect x="${X}" y="${y1}" width="${W}" height="${h}" fill="${fill}"/>
          <rect x="${X}" y="${y1}" width="${W}" height="${h}" fill="url(#${id}-vol)" opacity=".5"/>
          <path d="M${X + 6} ${y1 + 5}H${X + W - 6}M${X + 6} ${y1 + h - 5}H${X + W - 6}" stroke="#f3e6cf" stroke-opacity=".55" stroke-width="1.4" stroke-dasharray="5 4" fill="none"/>`;
      }
      if (d === 'v') {
        const o = 120, t = 34, dep = 92;
        const pts = `${cx - o},${y} ${cx},${y + dep} ${cx + o},${y} ${cx + o - t * 1.25},${y} ${cx},${y + dep - t} ${cx - o + t * 1.25},${y}`;
        return `<polygon points="${pts}" fill="${fill}"/>
          <polyline points="${cx - o + 8},${y + 4} ${cx},${y + dep - 8} ${cx + o - 8},${y + 4}" fill="none" stroke="#f3e6cf" stroke-opacity=".5" stroke-width="1.3" stroke-dasharray="5 4"/>`;
      }
      return '';
    }

    function update(st) {
      const has = !!st.cuero;
      const p1 = `${id}-c1`, p2 = `${id}-c2`;
      pats.innerHTML = (has ? pattern(p1, st.cuero) : '') + (st.cuero2 ? pattern(p2, st.cuero2, 420) : '');
      const main = has ? `url(#${p1})` : '#d8ccb8';
      const second = st.cuero2 ? `url(#${p2})` : (st.detalle && st.detalle !== 'no' ? '#bfae94' : null);
      const hilo = (has && HILO[st.cuero]) || '#efe2c8';
      const gloss = has && GLOSS[st.cuero] ? `<ellipse cx="${X + W * 0.36}" cy="${TOP_FRONT + 46}" rx="${W * 0.34}" ry="36" fill="#fff" opacity="${GLOSS[st.cuero]}" filter="url(#${id}-soft)"/>` : '';
      body.innerHTML = `
        <ellipse cx="${X + W / 2 + 10}" cy="${BOTTOM + 22}" rx="${W * 0.55}" ry="22" fill="#2a1c12" opacity=".35" filter="url(#${id}-shadow)"/>
        <g class="pz3d__back">
          <path d="${backPath()}" transform="translate(0 7)" fill="#1c1410" opacity=".35"/>
          <path d="${backPath()}" fill="${main}"/>
          <path d="${backPath()}" fill="#120c08" opacity=".38"/>
          <path d="${backPath()}" fill="url(#${id}-side)"/>
        </g>
        <g class="pz3d__card">
          <rect x="${X + 52}" y="${TOP_BACK - 34}" width="${W - 104}" height="150" rx="9" fill="url(#${id}-card)"/>
          <rect x="${X + 52}" y="${TOP_BACK - 34}" width="${W - 104}" height="150" rx="9" fill="none" stroke="#b9a98f" stroke-opacity=".6"/>
          <rect x="${X + 74}" y="${TOP_BACK - 14}" width="54" height="8" rx="4" fill="#b9a98f" opacity=".55"/>
          <rect x="${X + 74}" y="${TOP_BACK + 2}" width="96" height="5" rx="2.5" fill="#b9a98f" opacity=".35"/>
        </g>
        <g class="pz3d__front">
          <path d="${frontPath(st.detalle)}" transform="translate(0 6)" fill="#120c08" opacity=".55"/>
          <path d="${frontPath(st.detalle)}" fill="${main}" ${has ? '' : 'stroke="#a8977c" stroke-dasharray="6 5" stroke-width="1.5"'}/>
          <clipPath id="${id}-clip"><path d="${frontPath(st.detalle)}"/></clipPath>
          <g clip-path="url(#${id}-clip)">${second ? detail(st.detalle, second) : ''}${gloss}</g>
          <path d="${frontPath(st.detalle)}" fill="url(#${id}-vol)"/>
          <path d="${frontPath(st.detalle)}" fill="url(#${id}-side)"/>
          <path d="${stitchPath()}" fill="none" stroke="${hilo}" stroke-opacity="${has ? '.8' : '.5'}" stroke-width="1.6" stroke-dasharray="6 5" stroke-linecap="round"/>
          ${st.tachas === 'si' ? studs() : ''}
          <path d="${frontPath(st.detalle)}" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="1.2"/>
        </g>`;
    }

    return { update, svg };
  }
  return { create };
})();
