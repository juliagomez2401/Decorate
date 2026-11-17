/* =========================================================
   Decora.te — piezas en 3D (three.js)
   Un motor para todas las piezas a medida: cinto (faja o funcional,
   sobre un maniquí), tarjetero, estuche de lentes, portafuego,
   llavero, pulsera y collar. El cuero es la foto real de cada
   muestra, hecha continua (sin uniones) y con relieve.
   Uso: const v = DT3D.create(contenedor); v.update('tarjetero', estado);
   Medidas de los modelos en centímetros.
   ========================================================= */
window.DT3D = (() => {
  'use strict';
  const T = window.THREE;
  if (!T) return null;
  const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
  const TILE = 11; // cm que ocupa una muestra de cuero (la textura se hace continua, sin uniones)

  /* ---------------- cueros ---------------- */
  // rugosidad, relieve, brillo; los de pelo (cebra, leopardo, vaca) son mates
  const CUERO = {
    cebra: { rough: 0.82, bump: 0.06 }, leopardo: { rough: 0.82, bump: 0.06 }, vaca: { rough: 0.82, bump: 0.06 },
    'croco-chocolate': { rough: 0.5, bump: 0.2, clear: 0.12, tile: 6.5 }, 'croco-turquesa': { rough: 0.5, bump: 0.2, clear: 0.12, tile: 6.5 },
    bordo: { rough: 0.5, bump: 0.08, clear: 0.2 }, rojo: { rough: 0.5, bump: 0.08, clear: 0.2 },
    'azul-charol': { rough: 0.12, bump: 0.02, clear: 1 }, 'azul-lavado': { rough: 0.72, bump: 0.08 },
    plateado: { rough: 0.32, bump: 0.06, metal: 0.6 },
  };
  const listeners = new Set();
  const texCache = {}, matCache = {};
  function leatherTex(id) {
    if (texCache[id]) return texCache[id];
    const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
    const tex = new T.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
    const bump = new T.CanvasTexture(cv); bump.wrapS = bump.wrapT = T.RepeatWrapping;
    // escala propia de cada cuero (el croco tiene escamas más chicas que lo que entra en una muestra)
    const rep = TILE / ((CUERO[id] || {}).tile || TILE); tex.repeat.set(rep, rep); bump.repeat.set(rep, rep);
    const img = new Image();
    img.onload = () => {
      // textura continua: abajo la foto corrida a la mitad (sus bordes empalman), arriba la foto
      // original que se desvanece hacia los bordes. Así se repite sin cortes y sin efecto espejo.
      const S = 1024, h = S / 2, g = cv.getContext('2d');
      [[-h, -h], [h, -h], [-h, h], [h, h]].forEach(([x, y]) => g.drawImage(img, x, y, S, S));
      const top = document.createElement('canvas'); top.width = top.height = S;
      const t = top.getContext('2d');
      t.drawImage(img, 0, 0, S, S);
      t.globalCompositeOperation = 'destination-in';
      const gx = t.createLinearGradient(0, 0, S, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.28, '#000'); gx.addColorStop(0.72, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)');
      t.fillStyle = gx; t.fillRect(0, 0, S, S);
      const gy = t.createLinearGradient(0, 0, 0, S); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.28, '#000'); gy.addColorStop(0.72, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
      t.fillStyle = gy; t.fillRect(0, 0, S, S);
      g.drawImage(top, 0, 0);
      cv.dataset.ok = '1';
      tex.needsUpdate = true; bump.needsUpdate = true;
      listeners.forEach((fn) => fn());
    };
    // abriendo la web como archivo (doble clic) el navegador no deja usar fotos sueltas en 3D:
    // ahí se usan las muestras que vienen dentro de js/cueros-datos.js
    img.src = (window.DT_CUEROS_B64 && window.DT_CUEROS_B64[id]) || `img/cuero-${id}.jpg`;
    return (texCache[id] = { tex, bump, cv });
  }
  function leather(id) {
    if (!id) return MAT.vacio;
    if (matCache[id]) return matCache[id];
    const p = CUERO[id] || { rough: 0.6, bump: 0.08 };
    const t = leatherTex(id);
    return (matCache[id] = new T.MeshPhysicalMaterial({
      map: t.tex, bumpMap: t.bump, bumpScale: p.bump, roughness: p.rough, metalness: p.metal || 0,
      clearcoat: p.clear || 0, clearcoatRoughness: 0.25, side: T.DoubleSide,
    }));
  }
  const MAT = {
    vacio: new T.MeshStandardMaterial({ color: 0xcbbca3, roughness: 0.85, side: T.DoubleSide }),
    canto: new T.MeshStandardMaterial({ color: 0x3b2a1f, roughness: 0.75, side: T.DoubleSide }),
    bronce: new T.MeshStandardMaterial({ color: 0xc7a160, metalness: 1, roughness: 0.28 }),
    plata: new T.MeshStandardMaterial({ color: 0xd2d2d6, metalness: 1, roughness: 0.22 }),
    hilo: new T.MeshStandardMaterial({ color: 0xefe2c6, roughness: 0.9 }),
    hiloOscuro: new T.MeshStandardMaterial({ color: 0x2b1d15, roughness: 0.9 }),
    piedra: new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0.1, clearcoat: 1, reflectivity: 1 }),
    maniqui: new T.MeshStandardMaterial({ color: 0x8a6f55, roughness: 0.97 }),
    tarjeta: new T.MeshStandardMaterial({ color: 0xf3ecdf, roughness: 0.6 }),
    oscuro: new T.MeshStandardMaterial({ color: 0x1a120d, roughness: 0.9 }),
    plastico: new T.MeshStandardMaterial({ color: 0x2c2c30, roughness: 0.35 }),
  };
  // los colores se escriben como se ven (sRGB); three.js los necesita en lineal
  Object.values(MAT).forEach((m) => m.color && m.color.convertSRGBToLinear());
  const hiloPara = (id) => (['cebra', 'plateado', 'vaca', 'leopardo', 'azul-lavado'].includes(id) ? MAT.hiloOscuro : MAT.hilo);

  /* ---------------- ayudas de geometría ---------------- */
  function scaleUV(geo, s, ox = 0, oy = 0) {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + ox) / s, (uv.getY(i) + oy) / s);
    uv.needsUpdate = true;
    return geo;
  }
  function roundedRect(w, h, r, cx = 0, cy = 0) {
    const s = new T.Shape(), x = cx - w / 2, y = cy - h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // pieza plana de cuero (caras con la textura, canto oscuro)
  function slab(shape, depth, mat, bevel = 0.06) {
    const geo = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 32 });
    scaleUV(geo, TILE);
    geo.translate(0, 0, -depth / 2);
    return new T.Mesh(geo, [mat, MAT.canto]);
  }
  // banda de cuero que sigue un recorrido (cintos, pulseras, collares)
  function band(o) {
    const N = o.n || 220, P = [], L = [0];
    for (let i = 0; i <= N; i++) { P.push(o.center(o.u0 + (o.u1 - o.u0) * i / N)); if (i) L.push(L[i - 1] + P[i].distanceTo(P[i - 1])); }
    const pos = [], uv = [], idx = [], groups = [];
    const ring = (i) => {
      const u = o.u0 + (o.u1 - o.u0) * i / N, n = o.normal(u), up = V(0, 1, 0), h = o.height(u) / 2, t = o.thick / 2, yo = o.yoff ? o.yoff(u) : 0;
      const b = P[i].clone().addScaledVector(up, yo);
      return { p: [b.clone().addScaledVector(n, t).addScaledVector(up, h), b.clone().addScaledVector(n, t).addScaledVector(up, -h), b.clone().addScaledVector(n, -t).addScaledVector(up, -h), b.clone().addScaledVector(n, -t).addScaledVector(up, h)], h, yo };
    };
    const R = []; for (let i = 0; i <= N; i++) R.push(ring(i));
    const strip = (a, b, vA, vB, group) => {
      const start = idx.length, base = pos.length / 3;
      for (let i = 0; i <= N; i++) {
        const A = R[i].p[a], B = R[i].p[b];
        pos.push(A.x, A.y, A.z, B.x, B.y, B.z);
        uv.push((L[i] + (o.uOff || 0)) / TILE, vA(R[i]) / TILE, (L[i] + (o.uOff || 0)) / TILE, vB(R[i]) / TILE);
        if (i) { const k = base + (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      groups.push([start, idx.length - start, group]);
    };
    strip(0, 1, (r) => r.yo + r.h, (r) => r.yo - r.h, 0);  // cara de afuera
    strip(3, 2, (r) => r.yo + r.h, (r) => r.yo - r.h, 0);  // cara de adentro
    strip(1, 2, () => 0, () => 0.05, 1); strip(3, 0, () => 0, () => 0.05, 1); // cantos
    if (!o.closed) {
      [0, N].forEach((i) => {
        const base = pos.length / 3, start = idx.length;
        R[i].p.forEach((q) => { pos.push(q.x, q.y, q.z); uv.push(0, 0); });
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        groups.push([start, 6, 1]);
      });
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    groups.forEach(([s, c, m]) => geo.addGroup(s, c, m));
    geo.computeVertexNormals();
    return new T.Mesh(geo, [o.mat, MAT.canto]);
  }
  // muchas piezas chicas iguales (tachas, puntadas)
  function many(geo, mat, list) {
    const m = new T.InstancedMesh(geo, mat, Math.max(1, list.length));
    const o = new T.Object3D(), z = V(0, 0, 1);
    list.forEach((it, k) => {
      o.position.copy(it.p);
      o.quaternion.setFromUnitVectors(z, it.n.clone().normalize());
      if (it.spin) o.rotateZ(it.spin);
      o.scale.setScalar(it.s || 1);
      o.updateMatrix(); m.setMatrixAt(k, o.matrix);
    });
    if (!list.length) m.count = 0;
    return m;
  }
  const studGeo = (r) => { const g = new T.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2); g.rotateX(Math.PI / 2); return g; };
  const stitchGeo = (len) => { const g = new T.CylinderGeometry(0.045, 0.045, len, 6); g.rotateZ(Math.PI / 2); return g; };
  // puntadas a lo largo de una lista de puntos {p, n} (n: hacia afuera de la cara)
  function stitchesAlong(pts, mat, gap = 0.55) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], d = b.p.clone().sub(a.p), len = d.length();
      if (len < 0.01) continue;
      const steps = Math.max(1, Math.floor(len / gap));
      for (let k = 0; k < steps; k++) {
        const p = a.p.clone().addScaledVector(d, (k + 0.5) / steps);
        out.push({ p, n: a.n, dir: d.clone().normalize() });
      }
    }
    const geo = new T.CylinderGeometry(0.05, 0.05, gap * 0.62, 6);
    const m = new T.InstancedMesh(geo, mat, Math.max(1, out.length));
    const o = new T.Object3D(), y = V(0, 1, 0);
    out.forEach((it, k) => { o.position.copy(it.p); o.quaternion.setFromUnitVectors(y, it.dir); o.updateMatrix(); m.setMatrixAt(k, o.matrix); });
    if (!out.length) m.count = 0;
    return m;
  }
  // puntos dentro del borde de una forma, a "ins" cm del borde, cada "gap" cm
  function insetPoints(shape, ins, gap) {
    const poly = shape.getPoints(160);
    const inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };
    const len = shape.getLength(), n = Math.max(6, Math.floor(len / gap)), out = [];
    for (let i = 0; i < n; i++) {
      const t = i / n, p = shape.getPointAt(t), q = shape.getPointAt((t + 0.002) % 1);
      let nx = -(q.y - p.y), ny = q.x - p.x; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      if (!inside(p.x + nx * ins, p.y + ny * ins)) { nx = -nx; ny = -ny; }
      const x = p.x + nx * ins, y = p.y + ny * ins;
      if (inside(x, y)) out.push([x, y]);
    }
    return out;
  }
  // herrajes
  function torus(R, r, mat) { return new T.Mesh(new T.TorusGeometry(R, r, 14, 48), mat); }
  function chain(links, size, mat) {
    const g = new T.Group();
    for (let i = 0; i < links; i++) {
      const l = torus(size, size * 0.22, mat); l.scale.set(0.62, 1, 1);
      l.position.y = -i * size * 1.45; if (i % 2) l.rotation.y = Math.PI / 2;
      g.add(l);
    }
    return g;
  }
  function clasp(size, mat) { // mosquetón
    const g = new T.Group();
    const body = torus(size, size * 0.2, mat); body.scale.set(0.55, 1, 1); body.position.y = size * 1.1; g.add(body);
    const gate = new T.Mesh(new T.CylinderGeometry(size * 0.12, size * 0.12, size * 1.1, 10), mat); gate.position.set(size * 0.48, size * 1.05, 0); gate.rotation.z = 0.12; g.add(gate);
    const sw = new T.Mesh(new T.CylinderGeometry(size * 0.22, size * 0.22, size * 0.5, 14), mat); sw.position.y = -size * 0.05; g.add(sw);
    const ring = torus(size * 0.42, size * 0.1, mat); ring.position.y = -size * 0.55; g.add(ring);
    return g;
  }
  function eyelet(r, mat) { const m = torus(r, r * 0.32, mat); return m; }

  /* ---------------- modelos ---------------- */
  const M = {};

  // maniquí: torso de modista, cortado arriba y abajo
  function maniqui(scaleZ, yMin, yMax) {
    const inner = []; for (let y = yMin; y <= yMax + 0.01; y += 1) inner.push([torsoR(y), y]);
    const prof = [[0, yMin], ...inner, [0, yMax]];
    const geo = new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r, y)), 72);
    geo.scale(1, 1, scaleZ);
    return new T.Mesh(geo, MAT.maniqui);
  }
  const torsoR = (y) => { const prof = [[-17, 15.6], [-12, 15.4], [-7, 14.6], [-3, 13.4], [0, 12.7], [3, 12.9], [7, 13.8], [11, 14.6], [14, 14.8]]; for (let i = 1; i < prof.length; i++) if (y <= prof[i][0]) { const [y0, r0] = prof[i - 1], [y1, r1] = prof[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return 14.8; };

  /* ----- cinto: la faja se pinta como un molde plano (zonas de cuero, cortes en diagonal,
     pespunte, canto) y después se envuelve alrededor del maniquí ----- */
  // forma de la faja: borde de arriba y de abajo (cm) según la distancia al centro de adelante
  const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const STRAP = 2.2; // media altura de la tira de atrás
  const FORMAS_FAJA = {
    // recta: pareja adelante y se angosta hacia atrás (como las de cebra a los costados)
    recta: (dx) => { const a = Math.abs(dx), t = ss(19, 33, a); return [mix(5, STRAP, t), -mix(5, STRAP, t)]; },
    // asimétrica: un costado sube más ancho (como las de dorado y chocolate)
    asimetrica: (dx) => {
      if (dx < 0) { const t = ss(17, 31, -dx); return [mix(4.3, STRAP, t), -mix(4.3, STRAP, t)]; }
      const up = ss(0, 14, dx), t = ss(17, 34, dx);
      return [mix(4.3 + 3.6 * up, STRAP, t), -mix(4.3 + 1.1 * up, STRAP, t)];
    },
    // moño: angosta al medio con la hebilla y ancha a los costados (como la plateada)
    mono: (dx) => { const a = Math.abs(dx), w = ss(3, 13, a), t = ss(16, 32, a); return [mix(mix(2.7, 6.6, w), STRAP, t), -mix(mix(2.7, 6.6, w), STRAP, t)]; },
    funcional: () => [1.9, -1.9],
  };
  // dónde se cortan las zonas (cortes en diagonal, paralelos, como en las fajas reales)
  const CORTE = { recta: 12, asimetrica: 10, mono: 8.5, funcional: 12 };
  const PEND = 0.42;

  function fajaMolde(st, L) {
    const forma = st.tipo === 'funcional' ? 'funcional' : (st.forma || 'recta');
    const F = FORMAS_FAJA[forma];
    const HM = forma === 'funcional' ? 4.4 : 16;   // alto del molde (cm)
    const K = Math.floor(4096 / L);                 // px por cm
    const W = Math.round(L * K), H = Math.round(HM * K);
    const px = (dx) => (dx + L / 2) * K, py = (y) => (HM / 2 - y) * K;
    const color = document.createElement('canvas'), rough = document.createElement('canvas'), metal = document.createElement('canvas');
    [color, rough, metal].forEach((c) => { c.width = W; c.height = H; });
    const g = color.getContext('2d'), gr = rough.getContext('2d'), gm = metal.getContext('2d');
    gm.fillStyle = '#000'; gm.fillRect(0, 0, W, H);
    // silueta
    const sil = new Path2D(); const N = 400;
    for (let i = 0; i <= N; i++) { const dx = -L / 2 + L * i / N; const [t] = F(dx); i ? sil.lineTo(px(dx), py(t)) : sil.moveTo(px(dx), py(t)); }
    for (let i = N; i >= 0; i--) { const dx = -L / 2 + L * i / N; const [, b] = F(dx); sil.lineTo(px(dx), py(b)); }
    sil.closePath();
    // zonas: principal al centro; costados; detalle cruzado al lado de la hebilla
    const a = CORTE[forma];
    const xL = (y) => -a + PEND * y, xR = (y) => a + PEND * y, xD = (y) => a + 4.6 + PEND * y;
    const zona = (x0, x1) => { const p = new Path2D(); p.moveTo(px(x0(HM / 2)), 0); p.lineTo(px(x1(HM / 2)), 0); p.lineTo(px(x1(-HM / 2)), H); p.lineTo(px(x0(-HM / 2)), H); p.closePath(); return p; };
    const lejos = (k) => () => k;
    const combo = forma === 'funcional' ? 'solo' : (st.combo || 'solo');
    const zonas = [];
    if (combo === 'solo') zonas.push([lejos(-L), lejos(L), st.cuero]);
    else {
      zonas.push([lejos(-L), xL, st.cuero2], [xL, xR, st.cuero]);
      if (combo === 'detalle') zonas.push([xR, xD, st.cuero3], [xD, lejos(L), st.cuero2]);
      else zonas.push([xR, lejos(L), st.cuero2]);
    }
    g.save(); g.clip(sil); gr.save(); gr.clip(sil); gm.save(); gm.clip(sil);
    zonas.forEach(([x0, x1, id]) => {
      const p = zona(x0, x1), c = CUERO[id] || {};
      const src = id && leatherTex(id).cv;
      if (src && src.dataset.ok) {
        const pat = g.createPattern(src, 'repeat'), s = K * (c.tile || TILE) / 1024;
        if (pat.setTransform) pat.setTransform(new DOMMatrix([s, 0, 0, s, 0, 0]));
        g.fillStyle = pat;
      } else g.fillStyle = id ? '#9b8569' : '#cbbca3';
      g.fill(p);
      const r = Math.round(255 * (id ? (c.rough != null ? c.rough : 0.6) : 0.85)); gr.fillStyle = `rgb(${r},${r},${r})`; gr.fill(p);
      if (c.metal) { gm.fillStyle = `rgb(${Math.round(255 * c.metal)},0,0)`; gm.fill(p); }
    });
    // uniones dibujadas: trenzado cruzado a lo largo de cada corte
    const cortes = combo === 'solo' ? [] : (combo === 'detalle' ? [xL, xR, xD] : [xL, xR]);
    if (st.union === 'trenzado') {
      cortes.forEach((xc) => {
        for (let y = -HM / 2; y <= HM / 2; y += 1.1) {
          const x = xc(y), d = 0.75;
          g.strokeStyle = '#efe2c6'; g.lineWidth = 0.22 * K; g.lineCap = 'round';
          g.beginPath(); g.moveTo(px(x - d), py(y + 0.35)); g.lineTo(px(x + d), py(y - 0.35)); g.stroke();
          g.fillStyle = 'rgba(20,12,8,.8)'; [-d, d].forEach((o) => { g.beginPath(); g.arc(px(x + o), py(y), 0.14 * K, 0, Math.PI * 2); g.fill(); });
        }
      });
    } else cortes.forEach((xc) => { g.strokeStyle = 'rgba(25,15,10,.55)'; g.lineWidth = 0.12 * K; g.beginPath(); g.moveTo(px(xc(HM / 2)), 0); g.lineTo(px(xc(-HM / 2)), H); g.stroke(); });
    // pespunte por los bordes
    const hilo = ['cebra', 'plateado', 'vaca', 'leopardo', 'azul-lavado'].includes(st.cuero) ? '#2b1d15' : '#efe2c6';
    g.strokeStyle = hilo; g.lineWidth = 0.13 * K; g.setLineDash([0.42 * K, 0.3 * K]);
    [0, 1].forEach((k) => { g.beginPath(); for (let i = 0; i <= N; i++) { const dx = -L / 2 + L * i / N; const y = F(dx)[k] + (k ? 0.55 : -0.55); i ? g.lineTo(px(dx), py(y)) : g.moveTo(px(dx), py(y)); } g.stroke(); });
    g.setLineDash([]);
    // agujeros del cinto funcional
    if (forma === 'funcional') { g.fillStyle = '#140c08'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(px(2.6 + k * 1.15), py(0), 0.2 * K, 0.26 * K, 0, 0, Math.PI * 2); g.fill(); } }
    g.restore(); gr.restore(); gm.restore();
    // canto: borde oscuro fino
    g.save(); g.clip(sil); g.strokeStyle = 'rgba(35,22,15,.9)'; g.lineWidth = 0.5 * K; g.stroke(sil); g.restore();
    return { color, rough, metal, HM, F, cortes, combo, forma };
  }

  M.cinto = (st) => {
    const g = new T.Group(), SZ = 0.76;
    const deco = st.tipo !== 'funcional';
    g.add(deco ? maniqui(SZ, -10, 9) : maniqui(SZ, -16, 1));
    const y0 = deco ? 0 : -9;
    let r = 0; for (let y = y0 - 8; y <= y0 + 8; y += 0.5) r = Math.max(r, torsoR(y));
    if (!deco) { r = 0; for (let y = y0 - 2.5; y <= y0 + 2.5; y += 0.5) r = Math.max(r, torsoR(y)); }
    const rx = r + 0.35, rz = r * SZ + 0.35, thick = 0.38;
    const ang = (u) => -Math.PI + u * Math.PI * 2;
    const center = (u) => V(rx * Math.sin(ang(u)), y0, rz * Math.cos(ang(u)));
    const normal = (u) => V(Math.sin(ang(u)) / rx, 0, Math.cos(ang(u)) / rz).normalize();
    // largo real del contorno
    let L = 0; for (let i = 1; i <= 400; i++) L += center(i / 400).distanceTo(center((i - 1) / 400));
    const m = fajaMolde(st, L);
    // banda: dos caras (afuera y adentro) con el molde; la forma sale de la transparencia
    const N = 360, pos = [], uv = [], idx = [];
    [thick / 2, -thick / 2].forEach((off, face) => {
      const base = pos.length / 3;
      for (let i = 0; i <= N; i++) {
        const u = i / N, c = center(u), n = normal(u);
        [m.HM / 2, -m.HM / 2].forEach((y, k) => { const p = c.clone().addScaledVector(n, off).add(V(0, y, 0)); pos.push(p.x, p.y, p.z); uv.push(u, k ? 0 : 1); });
        if (i) { const q = base + (i - 1) * 2; face ? idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3) : idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      }
    });
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const tex = new T.CanvasTexture(m.color); tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
    const mat = new T.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 0.04, roughnessMap: new T.CanvasTexture(m.rough), metalnessMap: new T.CanvasTexture(m.metal), metalness: 1, roughness: 1, alphaTest: 0.5, transparent: false, side: T.DoubleSide });
    g.add(new T.Mesh(geo, mat));
    // de (dx, y) del molde a un punto 3D sobre la faja
    const at = (dx, y, out = 0) => { const u = 0.5 + dx / L; return center(u).add(V(0, y, 0)).addScaledVector(normal(u), thick / 2 + out); };
    const nrm = (dx) => normal(0.5 + dx / L);
    // uniones en 3D: remaches y argollas sobre cada corte
    m.cortes.forEach((xc) => {
      const [t, b] = m.F(xc(0));
      if (st.union === 'remaches') g.add(many(studGeo(0.4), MAT.bronce, [t * 0.45, b * 0.45].map((y) => ({ p: at(xc(y), y, 0.02), n: nrm(xc(y)) }))));
      if (st.union === 'argollas') { const ring = torus(Math.min(1.5, (t - b) * 0.2), 0.22, MAT.bronce); ring.position.copy(at(xc(0), 0, 0.25)); ring.lookAt(ring.position.clone().add(nrm(xc(0)))); g.add(ring); }
    });
    // decoración: tachas por arriba y abajo de la zona del centro
    if (st.deco === 'si') {
      const list = [], a = CORTE[m.forma];
      for (let dx = -a + 1.2; dx <= a - 1.2; dx += 1.5) {
        if (Math.abs(dx) < 3.8) continue;
        const [t, b] = m.F(dx); list.push({ p: at(dx, t - 1.15), n: nrm(dx) }, { p: at(dx, b + 1.15), n: nrm(dx) });
      }
      g.add(many(studGeo(deco ? 0.4 : 0.28), MAT.bronce, list));
    }
    // funcional: pasador
    if (!deco && st.cuero) {
      const k0 = 0.5 - 4.2 / L, k1 = 0.5 - 3.3 / L;
      g.add(band({ u0: k0, u1: k1, center, normal, height: () => 4.6, thick: thick + 0.5, mat: leather(st.cuero), closed: false, n: 6 }));
    }
    // hebilla adelante al medio
    if (st.hebilla) {
      const [t, b] = m.F(0), alto = deco ? (m.forma === 'mono' ? 7 : Math.min(9.2, (t - b) * 0.95)) : 4.9;
      const hb = hebilla(st.hebilla, alto); hb.position.copy(at(0, 0, 0.35)); g.add(hb);
    }
    g.rotation.y = -0.35;
    return { group: g, pitch: -0.02 };
  };

  function hebilla(tipo, H) {
    const g = new T.Group();
    if (tipo === 'rellena') {
      const s = new T.Shape(); s.absellipse(0, 0, H * 0.46, H * 0.56, 0, Math.PI * 2);
      const geo = new T.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.3, bevelSize: 0.3, bevelSegments: 4, curveSegments: 48 });
      g.add(new T.Mesh(geo, MAT.bronce));
      const r1 = torus(H * 0.36, 0.12, MAT.bronce); r1.scale.set(1, 1.2, 1); r1.position.z = 0.7; g.add(r1);
      const dome = new T.Mesh(new T.SphereGeometry(H * 0.13, 24, 16), MAT.bronce); dome.scale.z = 0.5; dome.position.z = 0.7; g.add(dome);
      for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const ray = new T.Mesh(new T.BoxGeometry(H * 0.16, 0.08, 0.08), MAT.bronce); ray.position.set(Math.cos(a) * H * 0.24, Math.sin(a) * H * 0.29, 0.72); ray.rotation.z = a; g.add(ray); }
      return g;
    }
    const w = H * 0.72, frame = roundedRect(w, H, H * 0.12), hole = roundedRect(w - H * 0.22, H - H * 0.22, H * 0.06);
    frame.holes.push(hole);
    const geo = new T.ExtrudeGeometry(frame, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.16, bevelSegments: 4, curveSegments: 24 });
    g.add(new T.Mesh(geo, MAT.bronce));
    const bar = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, w * 0.98, 12), MAT.bronce); bar.rotation.z = Math.PI / 2; bar.position.z = 0.3; g.add(bar);
    const tongue = new T.Mesh(new T.BoxGeometry(w * 0.5, 0.26, 0.2), MAT.bronce); tongue.position.set(w * 0.22, 0, 0.45); g.add(tongue);
    if (tipo === 'pedreria') {
      const list = []; const inner = H * 0.055;
      for (let t = 0; t < 1; t += 1 / 26) { const p = frame.getPointAt(t); list.push({ p: V(p.x * 0.9, p.y * 0.9, 0.62), n: V(0, 0, 1) }); }
      void inner;
      const sg = new T.SphereGeometry(H * 0.045, 16, 10); sg.scale(1, 1, 0.7);
      g.add(many(sg, MAT.piedra, list));
    }
    return g;
  }

  M.tarjetero = (st) => {
    const g = new T.Group(), W = 10, HB = 7, HF = 5.6, d = 0.2;
    const m1 = leather(st.cuero), m2 = st.cuero2 ? leather(st.cuero2) : (st.detalle && st.detalle !== 'no' ? MAT.vacio : null);
    const back = slab(roundedRect(W, HB, 0.7), d, m1); g.add(back);
    const card = new T.Mesh(new T.BoxGeometry(8.4, 5.4, 0.06), MAT.tarjeta); card.position.set(0, HB / 2 - 2.7 - 0.3, 0.2); g.add(card);
    const stripe = new T.Mesh(new T.BoxGeometry(8.4, 0.9, 0.065), (() => { const m = new T.MeshStandardMaterial({ color: 0x8f6440, roughness: 0.5 }); m.color.convertSRGBToLinear(); return m; })()); stripe.position.copy(card.position).add(V(0, 1.4, 0.001)); g.add(stripe);
    const topF = -HB / 2 + HF;
    const front = new T.Shape(), x0 = -W / 2, x1 = W / 2, yb = -HB / 2, r = 0.7;
    front.moveTo(x0 + r, yb); front.lineTo(x1 - r, yb); front.quadraticCurveTo(x1, yb, x1, yb + r); front.lineTo(x1, topF);
    if (st.detalle === 'v') front.lineTo(x0, topF);
    else { front.lineTo(1.9, topF); front.absarc(0, topF, 1.9, 0, Math.PI, true); front.lineTo(x0, topF); }
    front.lineTo(x0, yb + r); front.quadraticCurveTo(x0, yb, x0 + r, yb);
    const fr = slab(front, d, m1); fr.position.z = 0.42; g.add(fr);
    const fz = 0.42 + d / 2 + 0.06;
    if (m2 && st.detalle === 'franja') { const f = slab(roundedRect(W, 1.3, 0.01, 0, topF - 1.75), 0.05, m2, 0.01); f.position.z = fz + 0.03; g.add(f); }
    if (m2 && st.detalle === 'v') {
      const s = new T.Shape(); s.moveTo(-4, topF); s.lineTo(0, topF - 3.2); s.lineTo(4, topF); s.lineTo(2.6, topF); s.lineTo(0, topF - 2.05); s.lineTo(-2.6, topF); s.lineTo(-4, topF);
      const v = slab(s, 0.05, m2, 0.01); v.position.z = fz + 0.03; g.add(v);
    }
    if (st.cuero) {
      const pts = [[x0 + 0.45, topF - 0.3], [x0 + 0.45, yb + 0.45], [x1 - 0.45, yb + 0.45], [x1 - 0.45, topF - 0.3]].map(([x, y]) => ({ p: V(x, y, fz + 0.05), n: V(0, 0, 1) }));
      g.add(stitchesAlong(pts, hiloPara(st.cuero), 0.5));
    }
    if (st.tachas === 'si') {
      const list = [];
      for (let y = yb + 0.95; y <= topF - 0.6; y += 1.0) list.push({ p: V(x0 + 0.95, y, fz), n: V(0, 0, 1) }, { p: V(x1 - 0.95, y, fz), n: V(0, 0, 1) });
      for (let x = x0 + 1.95; x <= x1 - 1.9; x += 1.0) list.push({ p: V(x, yb + 0.95, fz), n: V(0, 0, 1) });
      g.add(many(studGeo(0.3), MAT.bronce, list));
    }
    return { group: g, pitch: 0.18, yaw: -0.45 };
  };

  M['porta-lentes'] = (st) => {
    const g = new T.Group(), W = 8, H = 17, m = leather(st.cuero);
    const body = slab(roundedRect(W, H, 1.6), 1.1, m, 0.38); g.add(body);
    const z = 0.55 + 0.38;
    const slot = new T.Mesh(new T.BoxGeometry(W - 1.6, 0.28, 1.2), MAT.oscuro); slot.position.set(0, H / 2 - 0.05, 0); g.add(slot);
    if (st.modelo === 'con-tapa') {
      const s = new T.Shape(); s.moveTo(-W / 2, H / 2); s.lineTo(W / 2, H / 2); s.lineTo(W / 2, H / 2 - 3.6); s.quadraticCurveTo(W / 2, H / 2 - 5.6, 0, H / 2 - 6.4); s.quadraticCurveTo(-W / 2, H / 2 - 5.6, -W / 2, H / 2 - 3.6); s.lineTo(-W / 2, H / 2);
      const flap = slab(s, 0.18, m, 0.05); flap.position.z = z + 0.12; g.add(flap);
      const snap = new T.Mesh(studGeo(0.55), MAT.plata); snap.position.set(0, H / 2 - 5.5, z + 0.3); g.add(snap);
    }
    if (st.cuero) {
      const pts = [[-W / 2 + 0.5, H / 2 - 0.6], [-W / 2 + 0.5, -H / 2 + 0.5], [W / 2 - 0.5, -H / 2 + 0.5], [W / 2 - 0.5, H / 2 - 0.6]].map(([x, y]) => ({ p: V(x, y, z + 0.02), n: V(0, 0, 1) }));
      g.add(stitchesAlong(pts, hiloPara(st.cuero), 0.5));
    }
    if (st.tachas === 'si') {
      const list = []; const top = st.modelo === 'con-tapa' ? H / 2 - 6.6 : H / 2 - 1.1;
      for (let y = -H / 2 + 1.1; y <= top; y += 1.15) list.push({ p: V(-W / 2 + 1.05, y, z), n: V(0, 0, 1) }, { p: V(W / 2 - 1.05, y, z), n: V(0, 0, 1) });
      for (let x = -W / 2 + 2.2; x <= W / 2 - 2.1; x += 1.15) list.push({ p: V(x, -H / 2 + 1.1, z), n: V(0, 0, 1) });
      g.add(many(studGeo(0.3), MAT.bronce, list));
    }
    // tira con argolla y mosquetón arriba a la izquierda
    const tab = slab(roundedRect(1.4, 3.2, 0.6), 0.16, m, 0.04); tab.position.set(-W / 2 + 1.2, H / 2 + 0.9, 0.2); g.add(tab);
    const ey = eyelet(0.42, MAT.plata); ey.position.set(-W / 2 + 1.2, H / 2 + 1.7, 0.32); g.add(ey);
    const ring = torus(0.85, 0.12, MAT.plata); ring.position.set(-W / 2 + 1.2, H / 2 + 2.8, 0.3); ring.rotation.y = Math.PI / 2; g.add(ring);
    const cl = clasp(1.6, MAT.plata); cl.position.set(-W / 2 + 1.2, H / 2 + 4.3, 0.3); g.add(cl);
    return { group: g, pitch: 0.12, yaw: -0.4 };
  };

  M.portafuego = (st) => {
    const g = new T.Group(), grande = st.tamano === 'grande', W = 3.4, H = grande ? 7.2 : 5.6, m = leather(st.cuero);
    const lh = H + 1.6;
    const lighter = new T.Mesh(new T.BoxGeometry(2.4, lh, 1.25), MAT.plastico); lighter.position.y = 0.8; g.add(lighter);
    const cap = new T.Mesh(new T.BoxGeometry(2.45, 1.3, 1.3), MAT.plata); cap.position.y = 0.8 + lh / 2 + 0.55; g.add(cap);
    const wheel = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.5, 20), MAT.plata); wheel.rotation.z = Math.PI / 2; wheel.position.set(0.55, cap.position.y + 0.75, 0); g.add(wheel);
    const sleeve = slab(roundedRect(W, H, 0.5), 1.45, m, 0.12); g.add(sleeve);
    const z = 0.73 + 0.12;
    if (st.cuero) {
      const pts = [[-W / 2 + 0.35, H / 2 - 0.35], [-W / 2 + 0.35, -H / 2 + 0.35], [W / 2 - 0.35, -H / 2 + 0.35]].map(([x, y]) => ({ p: V(x, y, z + 0.02), n: V(0, 0, 1) }));
      g.add(stitchesAlong(pts, hiloPara(st.cuero), 0.42));
    }
    if (st.tachas === 'si') {
      const list = [];
      for (let y = H / 2 - 0.75; y >= -H / 2 + 0.7; y -= 0.85) list.push({ p: V(W / 2 - 0.65, y, z), n: V(0, 0, 1) });
      for (let x = W / 2 - 1.5; x >= -W / 2 + 0.65; x -= 0.85) list.push({ p: V(x, -H / 2 + 0.65, z), n: V(0, 0, 1) });
      g.add(many(studGeo(0.24), MAT.bronce, list));
    }
    const ey = eyelet(0.3, MAT.bronce); ey.position.set(W / 2 - 0.55, H / 2 - 0.55, z); g.add(ey);
    const ch = chain(3, 0.45, MAT.bronce); ch.position.set(W / 2 - 0.55, H / 2 + 0.55, z - 0.1); g.add(ch);
    const cl = clasp(1.0, MAT.bronce); cl.position.set(W / 2 - 0.55, H / 2 + 1.8 + 0.45 * 3, z - 0.1); g.add(cl);
    // el portafuego sube un poco para que el encendedor asome arriba
    g.children.forEach((c) => { if (c !== lighter && c !== cap && c !== wheel) c.position.y += 0; });
    return { group: g, pitch: 0.1, yaw: -0.5 };
  };

  const FORMAS = {
    estrella: () => { const s = new T.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 1.45 : 3.3; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) s.lineTo(x, y); else s.moveTo(x, y); } s.closePath();
      // tachas como en los llaveros reales: una en cada punta y un anillo al medio
      const studs = []; for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + i * 2 * Math.PI / 5; studs.push([Math.cos(a) * (i ? 2.05 : 1.75), Math.sin(a) * (i ? 2.05 : 1.75)], [Math.cos(a + Math.PI / 5) * 0.95, Math.sin(a + Math.PI / 5) * 0.95]); }
      return { s, top: [0, 2.72], studs }; },
    corazon: () => { const s = new T.Shape(); s.moveTo(0, -3); s.bezierCurveTo(-1.2, -2, -3.4, -0.6, -3.2, 1.1); s.bezierCurveTo(-3.0, 2.6, -1.1, 3.2, 0, 1.8); s.bezierCurveTo(1.1, 3.2, 3.0, 2.6, 3.2, 1.1); s.bezierCurveTo(3.4, -0.6, 1.2, -2, 0, -3); return { s, top: [0, 1.25] }; },
    luna: () => {
      const s = new T.Shape(), R1 = 3.1, R2 = 2.55, cx = 1.35, cy = 0.75, pts = [];
      for (let i = 0; i < 160; i++) { const a = i / 160 * Math.PI * 2, x = Math.cos(a) * R1, y = Math.sin(a) * R1; if (Math.hypot(x - cx, y - cy) > R2) pts.push([x, y, a]); }
      // ordenar el arco de afuera empezando después del corte
      let k = 0; for (let i = 1; i < pts.length; i++) if (pts[i][2] - pts[i - 1][2] > 0.1) k = i;
      const outer = pts.slice(k).concat(pts.slice(0, k));
      const inner = []; for (let i = 0; i < 160; i++) { const a = i / 160 * Math.PI * 2, x = cx + Math.cos(a) * R2, y = cy + Math.sin(a) * R2; if (Math.hypot(x, y) < R1) inner.push([x, y, a]); }
      let j = 0; for (let i = 1; i < inner.length; i++) if (inner[i][2] - inner[i - 1][2] > 0.1) j = i;
      const inn = inner.slice(j).concat(inner.slice(0, j)).reverse();
      outer.concat(inn).forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
      s.closePath();
      return { s, top: [-0.9, 2.6] };
    },
    rayo: () => { const s = new T.Shape(); [[-0.6, 3.4], [1.9, 3.4], [0.6, 0.6], [2.2, 0.6], [-1.4, -3.6], [-0.3, -0.4], [-1.9, -0.4]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); return { s, top: [0.65, 2.75] }; },
    gota: () => { const s = new T.Shape(); s.moveTo(0, 3.6); s.bezierCurveTo(0.6, 2.2, 2.4, 0.4, 2.4, -1.2); s.bezierCurveTo(2.4, -2.7, 1.3, -3.6, 0, -3.6); s.bezierCurveTo(-1.3, -3.6, -2.4, -2.7, -2.4, -1.2); s.bezierCurveTo(-2.4, 0.4, -0.6, 2.2, 0, 3.6); return { s, top: [0, 2.5] }; },
  };
  M.llavero = (st) => {
    const g = new T.Group(), f = (FORMAS[st.forma] || FORMAS.estrella)(), m = leather(st.cuero), d = 0.36;
    const body = slab(f.s, d, m, 0.07); g.add(body);
    const z = d / 2 + 0.07;
    if (st.tachas === 'si') {
      // separadas de a ~1 cm y lejos del ojalillo
      const pts = f.studs || insetPoints(f.s, 0.62, 0.55).reduce((acc, q) => (acc.every((o) => Math.hypot(o[0] - q[0], o[1] - q[1]) > 1.0) ? acc.concat([q]) : acc), []);
      const list = pts.filter(([x, y]) => Math.hypot(x - f.top[0], y - f.top[1]) > 0.8).map(([x, y]) => ({ p: V(x, y, z), n: V(0, 0, 1) }));
      g.add(many(studGeo(0.26), MAT.bronce, list));
    }
    const [tx, ty] = f.top;
    const ey = eyelet(0.3, MAT.plata); ey.position.set(tx, ty, z); g.add(ey);
    const ch = chain(4, 0.42, MAT.plata); ch.position.set(tx, ty + 0.75 + 0.42 * 4.4, 0); g.add(ch);
    const cl = clasp(1.1, MAT.plata); cl.position.set(tx, ty + 0.75 + 0.42 * 6 + 0.6, 0); g.add(cl);
    return { group: g, pitch: 0.08, yaw: -0.5 };
  };

  M.pulsera = (st) => {
    const g = new T.Group(), H = { '1-3': 1.3, intermedia: 3, 5: 5 }[st.ancho] || 3, m = leather(st.cuero), R = 3.05, thick = 0.26;
    const turns = 1.12;
    const center = (u) => { const a = u * Math.PI * 2 * turns, r = R + 0.3 * u; return V(r * Math.sin(a), 0, r * Math.cos(a)); };
    const normal = (u) => { const a = u * Math.PI * 2 * turns; return V(Math.sin(a), 0, Math.cos(a)); };
    g.add(band({ u0: 0, u1: 1, center, normal, height: () => H, thick, mat: m, closed: false, n: 260 }));
    // broche donde se superponen las puntas
    const uS = 0.965, ps = center(uS).addScaledVector(normal(uS), thick / 2 + 0.05);
    const snap = new T.Mesh(new T.CylinderGeometry(Math.min(0.55, H * 0.3), Math.min(0.55, H * 0.3), 0.22, 24), MAT.plata); snap.position.copy(ps); snap.quaternion.setFromUnitVectors(V(0, 1, 0), normal(uS)); g.add(snap);
    if (st.cuero && H >= 3) {
      [-1, 1].forEach((sgn) => { const pts = []; for (let u = 0.02; u <= 0.93; u += 0.006) pts.push({ p: center(u).addScaledVector(normal(u), thick / 2 + 0.02).add(V(0, sgn * (H / 2 - 0.35), 0)), n: normal(u) }); g.add(stitchesAlong(pts, hiloPara(st.cuero), 0.38)); });
    }
    if (st.tachas === 'si') {
      const list = []; const rows = H >= 3 ? [-H / 4, H / 4] : [0];
      for (let u = 0.04; u <= 0.9; u += 0.045) rows.forEach((dy) => list.push({ p: center(u).addScaledVector(normal(u), thick / 2).add(V(0, dy, 0)), n: normal(u) }));
      g.add(many(studGeo(Math.min(0.32, H * 0.22)), MAT.plata, list));
    }
    g.rotation.y = Math.PI * 0.15;
    const w = new T.Group(); w.add(g); w.rotation.x = 0.32;
    return { group: w, pitch: 0.05 };
  };

  M.collar = (st) => {
    const g = new T.Group(), H = st.ancho === 'grueso' ? 2.6 : 1.3, m = leather(st.cuero), SZ = 0.86;
    const prof = [[0, 10], [4.8, 9.8], [5.05, 7.5], [5.0, 3.5], [5.4, 1.2], [6.6, -0.4], [8.4, -1.4], [8.8, -2], [0, -2]];
    const neck = new T.Mesh(new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r, y)), 64), MAT.maniqui); neck.scale.z = SZ; g.add(neck);
    const rx = 5.45, rz = 5.45 * SZ + 0.05, y0 = 5;
    const center = (u) => { const a = -Math.PI + 0.22 + u * (Math.PI * 2 - 0.44); return V(rx * Math.sin(a), y0, rz * Math.cos(a)); };
    const normal = (u) => { const a = -Math.PI + 0.22 + u * (Math.PI * 2 - 0.44); return V(Math.sin(a) / rx, 0, Math.cos(a) / rz).normalize(); };
    const thick = 0.24;
    g.add(band({ u0: 0, u1: 1, center, normal, height: () => H, thick, mat: m, closed: false, n: 200 }));
    // cordones atrás
    [0, 1].forEach((u) => { const p = center(u); const c = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 4, 8), leather(st.cuero) === MAT.vacio ? MAT.canto : leather(st.cuero)); c.position.copy(p).add(V(u ? -0.3 : 0.3, -2, -0.3)); c.rotation.z = u ? 0.15 : -0.15; g.add(c); });
    if (st.cuero) {
      [-1, 1].forEach((sgn) => { const pts = []; for (let u = 0.04; u <= 0.96; u += 0.008) pts.push({ p: center(u).addScaledVector(normal(u), thick / 2 + 0.02).add(V(0, sgn * (H / 2 - 0.22), 0)), n: normal(u) }); g.add(stitchesAlong(pts, hiloPara(st.cuero), 0.36)); });
    }
    if (st.deco === 'si') {
      const list = []; for (let u = 0.25; u <= 0.75; u += 0.032) list.push({ p: center(u).addScaledVector(normal(u), thick / 2), n: normal(u) });
      g.add(many(studGeo(Math.min(0.36, H * 0.3)), MAT.plata, list));
    }
    g.rotation.y = -0.3;
    return { group: g, pitch: 0.06 };
  };

  /* ---------------- escena ---------------- */
  function sombra() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const c = cv.getContext('2d'), gr = c.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(40,24,14,.42)'); gr.addColorStop(1, 'rgba(40,24,14,0)');
    c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
    const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    return m;
  }
  function entorno(renderer) {
    const pm = new T.PMREMGenerator(renderer), sc = new T.Scene();
    sc.background = new T.Color(0x5a4636);
    const panel = (w, h, x, y, z, c) => { const p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); p.position.set(x, y, z); p.lookAt(0, 0, 0); sc.add(p); };
    panel(10, 6, 0, 9, 4, 0xfff4e2); panel(6, 8, -9, 2, 3, 0xc9b49a); panel(6, 8, 9, 3, -2, 0xe8d6bd); panel(20, 6, 0, -8, 0, 0x2b1d14);
    const t = pm.fromScene(sc, 0.04).texture; pm.dispose();
    return t;
  }

  function create(host) {
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.LinearToneMapping; renderer.toneMappingExposure = 0.95; // colores fieles al cuero real
    host.innerHTML = ''; host.appendChild(renderer.domElement);
    renderer.domElement.className = 'p3d';
    const scene = new T.Scene(); scene.environment = entorno(renderer);
    const camera = new T.PerspectiveCamera(28, 1, 0.1, 1000);
    scene.add(new T.HemisphereLight(0xfff5e8, 0x3d2619, 0.55));
    const key = new T.DirectionalLight(0xfff0dc, 1.6); key.position.set(4, 6, 7); scene.add(key);
    const rim = new T.DirectionalLight(0xffe2c0, 0.7); rim.position.set(-6, 3, -5); scene.add(rim);
    const shadow = sombra(); scene.add(shadow);
    const pivot = new T.Group(); scene.add(pivot);
    let model = null, yaw = 0, pitch = 0.1, baseYaw = 0, dragging = false, lastX = 0, lastY = 0, idle = 0, vel = 0, dirty = true;
    let lastId = null, lastSt = null, pend = 0;
    const invalidate = () => { dirty = true; clearTimeout(pend); pend = setTimeout(() => { if (lastId) update(lastId, lastSt); }, 30); };
    listeners.add(invalidate);

    function fit() {
      const box = new T.Box3().setFromObject(pivot), sph = box.getBoundingSphere(new T.Sphere());
      const dist = sph.radius / Math.sin(T.MathUtils.degToRad(camera.fov / 2)) * (camera.aspect < 1 ? 1.02 / camera.aspect : 1.02);
      camera.position.set(sph.center.x, sph.center.y + sph.radius * 0.18, sph.center.z + dist);
      camera.lookAt(sph.center);
      shadow.position.set(sph.center.x, box.min.y - 0.05, sph.center.z);
      shadow.scale.setScalar(sph.radius * 2.2);
    }
    function disposeTree(o) { o.traverse((c) => { if (c.geometry) c.geometry.dispose(); }); }
    function update(id, st) {
      const build = M[id]; if (!build) return;
      lastId = id; lastSt = JSON.parse(JSON.stringify(st || {}));
      const r = build(lastSt);
      if (model) { pivot.remove(model); disposeTree(model); }
      model = r.group; pivot.add(model);
      // centrar el modelo en el eje de giro, así al girarlo no se sale del cuadro
      const c = new T.Box3().setFromObject(model).getCenter(V()); model.position.sub(c);
      if (r.yaw !== undefined && baseYaw === 0 && yaw === 0) { yaw = r.yaw; }
      pitch = r.pitch || 0.1;
      pivot.rotation.set(0, 0, 0); fit(); dirty = true;
    }
    function resize() {
      const w = host.clientWidth || 300, h = host.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (model) fit(); dirty = true;
    }
    new ResizeObserver(resize).observe(host); resize();

    // girar arrastrando (mouse o dedo); sola, despacio, cuando nadie la toca
    const el = renderer.domElement;
    el.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; vel = 0; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; vel = dx * 0.008; yaw += vel; pitch = Math.max(-0.35, Math.min(0.6, pitch + dy * 0.004)); idle = 0; dirty = true; });
    const up = () => { dragging = false; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);

    let visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(host);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = performance.now();
    (function loop(now) {
      requestAnimationFrame(loop);
      const dt = Math.min(50, now - last); last = now;
      if (!visible) return;
      if (!dragging) {
        idle += dt;
        if (Math.abs(vel) > 0.0005) { yaw += vel; vel *= 0.93; dirty = true; }
        else if (idle > 2500 && !reduce) { yaw += dt * 0.00018; dirty = true; }
      }
      if (!dirty) return;
      pivot.rotation.set(pitch, yaw, 0);
      renderer.render(scene, camera); dirty = false;
    })(last);

    return { update, el };
  }

  return { create, formas: Object.keys(FORMAS) };
})();
