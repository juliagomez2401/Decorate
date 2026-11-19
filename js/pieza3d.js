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
  // cómo refleja la luz cada familia de cuero (la familia viene de js/datos.js)
  const FAMILIA = {
    pelo: { rough: 0.85, bump: 0.05 },
    liso: { rough: 0.55, bump: 0.08, clear: 0.2 },
    lavado: { rough: 0.35, bump: 0.1, clear: 0.45 },
    charol: { rough: 0.12, bump: 0.02, clear: 1 },
    metal: { rough: 0.32, bump: 0.06, metal: 0.3, clear: 0.3 },
    gamuza: { rough: 0.97, bump: 0.03 },
    croco: { rough: 0.45, bump: 0.2, clear: 0.2, tile: 6.5 },
    'croco-metal': { rough: 0.32, bump: 0.2, metal: 0.3, clear: 0.3, tile: 6.5 },
    reptil: { rough: 0.5, bump: 0.15, clear: 0.1, tile: 6.5 },
  };
  const CUERO = {};
  ((window.DT && window.DT.cueros) || []).forEach((c) => { CUERO[c.id] = FAMILIA[c.familia] || FAMILIA.liso; });
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
      // la textura ya viene continua y con la luz pareja (herramientas/texturas-3d.py)
      cv.getContext('2d').drawImage(img, 0, 0, 1024, 1024);
      cv.dataset.ok = '1';
      tex.needsUpdate = true; bump.needsUpdate = true;
      listeners.forEach((fn) => fn());
    };
    // abriendo la web como archivo (doble clic) el navegador no deja usar fotos sueltas en 3D:
    // ahí se usan las muestras que vienen dentro de js/cueros-datos.js
    img.src = (window.DT_CUEROS_B64 && window.DT_CUEROS_B64[id]) || `img/textura-${id}.jpg?v=2`;
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
    oro: new T.MeshStandardMaterial({ color: 0xe0b84e, metalness: 1, roughness: 0.2 }),
    oroViejo: new T.MeshStandardMaterial({ color: 0xa08a4e, metalness: 1, roughness: 0.34 }),
    plomo: new T.MeshStandardMaterial({ color: 0x67625f, metalness: 1, roughness: 0.3 }),
    cobre: new T.MeshStandardMaterial({ color: 0x8e5f3c, metalness: 1, roughness: 0.32 }),
    hilo: new T.MeshStandardMaterial({ color: 0xefe2c6, roughness: 0.9 }),
    hiloOscuro: new T.MeshStandardMaterial({ color: 0x2b1d15, roughness: 0.9 }),
    tiento: new T.MeshStandardMaterial({ color: 0x7a4f2e, roughness: 0.7 }),
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
      const u = o.u0 + (o.u1 - o.u0) * i / N, n0 = o.normal(u), tl = o.tilt ? o.tilt(u) : 0, up = V(0, Math.cos(tl), 0).addScaledVector(n0, -Math.sin(tl)), n = n0.clone().multiplyScalar(Math.cos(tl)).add(V(0, Math.sin(tl), 0)), h = o.height(u) / 2, t = o.thick / 2, yo = o.yoff ? o.yoff(u) : 0;
      const b = P[i].clone().addScaledVector(V(0, 1, 0), yo);
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
  const studGeo = (r) => { const g = new T.SphereGeometry(r, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2); g.rotateX(Math.PI / 2); g.scale(1, 1, 0.42); return g; };
  // la parte de atrás de una tacha o remache: el disquito que se ve del otro lado del cuero
  const revesGeo = (r) => { const g = new T.CylinderGeometry(r, r, 0.05, 18); g.rotateX(Math.PI / 2); return g; };
  // tachas, remaches o estrellas que atraviesan el cuero: adelante la pieza y atrás su revés.
  // grosor: lo que hay entre la cara de afuera y la de adentro (número o función de cada punto)
  function pasa(geo, mat, list, grosor, rb) {
    const g = new T.Group(); g.add(many(geo, mat, list));
    const atras = list.map((it) => { const gr = typeof grosor === 'function' ? grosor(it) : grosor; return { p: it.p.clone().addScaledVector(it.n, -gr), n: it.n.clone().negate() }; });
    g.add(many(revesGeo(rb), mat, atras));
    return g;
  }
  const stitchGeo = (len) => { const g = new T.CylinderGeometry(0.045, 0.045, len, 6); g.rotateZ(Math.PI / 2); return g; };
  // puntadas a lo largo de una lista de puntos {p, n} (n: hacia afuera de la cara)
  function stitchesAlong(pts, mat, gap = 0.55, grosor = 0.05) {
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
    const geo = new T.CylinderGeometry(grosor, grosor, gap * 0.62, 6);
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

  // metal elegido para remaches, argollas y tachas
  const metalDe = (id, def = MAT.bronce) => ({ plata: MAT.plata, dorado: MAT.oro, 'oro-viejo': MAT.oroViejo, plomo: MAT.plomo, cobre: MAT.cobre }[id] || def);
  // estrella de metal de cinco puntas, con volumen, mirando a +z
  const starGeo = (r) => {
    const s = new T.Shape();
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; if (i) s.lineTo(Math.cos(a) * q, Math.sin(a) * q); else s.moveTo(Math.cos(a) * q, Math.sin(a) * q); }
    s.closePath();
    return new T.ExtrudeGeometry(s, { depth: r * 0.1, bevelEnabled: true, bevelThickness: r * 0.14, bevelSize: r * 0.07, bevelSegments: 2 });
  };
  // la textura del cuero sigue al tamaño real de la pieza (1 muestra = TILE cm)
  const uvPos = (geo) => { const q = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < q.count; i++) uv.setXY(i, (q.getX(i) + q.getZ(i)) / TILE, q.getY(i) / TILE); uv.needsUpdate = true; return geo; };
  // flecos: tiras finas de cuero que cuelgan desde cada punto {p, n}
  function flecos(puntos, largo, ancho, mat) {
    const g = new T.Group(), geo = uvPos((() => { const b = new T.BoxGeometry(ancho, largo, 0.07, 1, 6, 1); b.translate(0, -largo / 2, 0); return b; })());
    puntos.forEach(({ p, n }, k) => { const f = new T.Mesh(geo, mat); f.position.copy(p); f.lookAt(p.clone().add(V(n.x, 0, n.z))); f.rotateZ((((k * 37) % 11) - 5) * 0.01); g.add(f); });
    return g;
  }
  // trenza de tres tientos planos a lo largo de un recorrido (center(u), normal(u)), de ancho "ancho"
  function trenza(center, normal, u0, u1, ancho, mat, largo) {
    const g = new T.Group(), cruces = Math.max(3, Math.round(largo / (ancho * 0.75))), N = cruces * 14;
    const w = ancho * 0.42, t = Math.min(0.14, ancho * 0.06), amp = ancho * 0.3, prof = Math.min(0.22, ancho * 0.07);
    for (let k = 0; k < 3; k++) {
      const P = [], Nn = [];
      for (let i = 0; i <= N; i++) {
        const tt = i / N, u = u0 + (u1 - u0) * tt, ph = tt * cruces * Math.PI + k * Math.PI * 2 / 3;
        P.push(center(u).add(V(0, Math.sin(ph) * amp, 0)).addScaledVector(normal(u), Math.sin(2 * ph) * prof)); Nn.push(normal(u));
      }
      // cinta plana: ancho w sobre la superficie, espesor t
      const pos = [], uv = [], idx = []; let L = 0;
      for (let i = 0; i <= N; i++) {
        const tg = P[Math.min(N, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize(), side = tg.clone().cross(Nn[i]).normalize();
        if (i) L += P[i].distanceTo(P[i - 1]);
        [[-1, 1], [1, 1], [1, -1], [-1, -1]].forEach(([a1, b1]) => { const q = P[i].clone().addScaledVector(side, a1 * w / 2).addScaledVector(Nn[i], b1 * t / 2); pos.push(q.x, q.y, q.z); uv.push(L / TILE, (a1 + 1) * w / 2 / TILE); });
        if (i) for (let f = 0; f < 4; f++) { const a0 = (i - 1) * 4 + f, a1 = (i - 1) * 4 + ((f + 1) % 4), b0 = a0 + 4, b2 = a1 + 4; idx.push(a0, b0, a1, a1, b0, b2); }
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      g.add(new T.Mesh(geo, mat));
    }
    return g;
  }

  // dije: foto recortada sobre un plano (cada dije tiene su forma; se carga una vez)
  const dijeCache = {};
  function dijeTex(id) {
    // abierta como archivo (doble clic), el 3D no puede leer fotos sueltas: se usa la copia de js/cueros-datos.js
    const src = (window.DT_DIJES_B64 && window.DT_DIJES_B64[id]) || `img/dije-${id}.png?v=3`;
    const tex = new T.TextureLoader().load(src, () => listeners.forEach((fn) => fn()));
    tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
    return tex;
  }
  // dije en 3D: una pieza de metal con la forma recortada de la foto (contorno y huecos de js/dijes-formas.js),
  // con espesor y bisel; la foto va de textura y de relieve, así se ven los grabados.
  function dijeModelo(id) {
    const F = window.DT_DIJES_FORMAS && window.DT_DIJES_FORMAS[id];
    if (!dijeCache[id]) {
      const tex = dijeTex(id);
      dijeCache[id] = new T.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: 0.02, metalness: 0.45, roughness: 0.38, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.28, side: T.DoubleSide });
    }
    const mat = dijeCache[id];
    if (!F) return new T.Mesh(new T.PlaneGeometry(2.6, 2.6), mat); // por las dudas, si falta la forma
    if (!dijeCache['geo-' + id]) {
      const v2 = (q) => new T.Vector2(q[0], q[1]);
      const sh = new T.Shape(F.contorno.map(v2));
      F.huecos.forEach((h) => sh.holes.push(new T.Path(h.map(v2))));
      const cm = F.cm, e = 0.09 / cm, bev = 0.03 / cm;   // espesor y bisel en cm, pasados a la escala del cuadro
      const geo = new T.ExtrudeGeometry(sh, { depth: e, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.6, bevelSegments: 2, curveSegments: 4 });
      geo.translate(-0.5, -0.5, -e / 2); geo.scale(cm, cm, cm); geo.computeVertexNormals();
      dijeCache['geo-' + id] = geo;
    }
    // el canto (el espesor del dije) va en metal liso: plateado, o dorado en el leopardo
    return new T.Mesh(dijeCache['geo-' + id], [mat, id === 'leopardo' ? MAT.oro : MAT.plata]);
  }

  // borde de una pieza con esquinas redondeadas: y en x (dir -1: borde de abajo, +1: de arriba)
  const esquina = (x, half, r, yEdge, dir) => { const dx = Math.min(r, Math.max(0, Math.abs(x) - (half - r))); return yEdge - dir * (r - Math.sqrt(Math.max(0, r * r - dx * dx))); };
  // lámina de cuero fina que se puede curvar: entre x0 y x1, de bot(x) a top(x), con su altura z(x, y);
  // dos caras con el cuero y el canto alrededor. Sirve para tarjeteros, estuches y fundas.
  function lamina(o) {
    const nu = o.nu || 40, nv = o.nv || 30, pos = [], uv = [], idx = [], groups = [];
    const P = (i, j, side) => { const x = o.x0 + (o.x1 - o.x0) * i / nu, y0 = o.bot(x), y1 = o.top(x), y = y0 + (y1 - y0) * j / nv; return [x, y, o.z(x, y) + side * o.t / 2]; };
    [1, -1].forEach((side, f) => {
      const base = pos.length / 3, start = idx.length;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = P(i, j, side); pos.push(...q); uv.push(q[0] / TILE, q[1] / TILE); }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; if (f) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
      groups.push([start, idx.length - start, 0]);
    });
    const ring = []; for (let i = 0; i <= nu; i++) ring.push([i, 0]); for (let j = 1; j <= nv; j++) ring.push([nu, j]); for (let i = nu - 1; i >= 0; i--) ring.push([i, nv]); for (let j = nv - 1; j >= 0; j--) ring.push([0, j]);
    const base = pos.length / 3, start = idx.length;
    ring.forEach(([i, j]) => { pos.push(...P(i, j, 1), ...P(i, j, -1)); uv.push(0, 0, 0, 0.02); });
    for (let k = 0; k < ring.length - 1; k++) { const a = base + k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    groups.push([start, idx.length - start, 1]);
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    groups.forEach(([a, c, mm]) => geo.addGroup(a, c, mm)); geo.computeVertexNormals();
    return new T.Mesh(geo, [o.mat, MAT.canto]);
  }

  // tiento enlazado por el borde de una tira (pulsera, collar): de frente se ven solo las puntas, que
  // abrazan el canto; el tramo largo cruza por atrás. punto(u, dy, lado, out) da {p, n} sobre la cara
  // de afuera (lado 1) o de adentro (lado -1); ambos: por los dos bordes o solo por el de arriba.
  function tientoEnlazado(g, punto, us, H, ambos, mat, thick) {
    const w = Math.min(0.3, H * 0.22), ang = 0.62, lf = Math.min(0.5, H * 0.28), lb = (H / 2) / Math.cos(ang) + 0.08;
    const gF = uvPos(new T.BoxGeometry(w, lf, 0.08)), gB = uvPos(new T.BoxGeometry(w, lb, 0.08)), gC = uvPos(new T.BoxGeometry(w, 0.13, thick + 0.16));
    const fr = [], at = [], ca = [];
    us.forEach((u) => (ambos ? [1, -1] : [1]).forEach((k) => {
      fr.push({ ...punto(u, k * (H / 2 - lf * 0.42), 1, 0.04), spin: k * ang });
      ca.push({ ...punto(u, k * (H / 2 + 0.02), 1, -thick / 2) });
      at.push({ ...punto(u, k * H / 4, -1, 0.04), spin: -k * ang });
    }));
    g.add(many(gF, mat, fr)); g.add(many(gC, mat, ca)); g.add(many(gB, mat, at));
  }
  // puntos parejos que siguen el borde de una forma, a "ins" cm hacia adentro, cada "sep" cm
  function bordeForma(shape, ins, sep, evitar) {
    const poly = shape.getPoints(240);
    const inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };
    const dBorde = (x, y) => { let d = 1e9; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], vx = b.x - a.x, vy = b.y - a.y, t = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy || 1))); d = Math.min(d, Math.hypot(x - a.x - t * vx, y - a.y - t * vy)); } return d; };
    const len = shape.getLength(), n = Math.max(8, Math.round(len / (sep * 0.25))), out = [];
    for (let i = 0; i < n; i++) {
      const tt = i / n, q = shape.getPointAt(tt), r = shape.getPointAt((tt + 0.002) % 1);
      let nx = -(r.y - q.y), ny = r.x - q.x; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      if (!inside(q.x + nx * ins, q.y + ny * ins)) { nx = -nx; ny = -ny; }
      const x = q.x + nx * ins, y = q.y + ny * ins;
      if (!inside(x, y) || dBorde(x, y) < ins * 0.8) continue;
      if (evitar && Math.hypot(x - evitar[0], y - evitar[1]) < 0.95) continue;
      if (out.every(([a, b]) => Math.hypot(a - x, b - y) > sep * 0.92)) out.push([x, y]);
    }
    return out;
  }
  // tiento enlazado alrededor de una forma plana (llavero): punta de frente, canto y punta atrás
  function tientoForma(g, shape, z, t, mat, evitar) {
    const poly = shape.getPoints(240), len = shape.getLength(), n = Math.max(10, Math.round(len / 0.6)), w = 0.24, lf = 0.42;
    const inside = (x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; };
    const gF = uvPos(new T.BoxGeometry(w, lf, 0.07)), gC = uvPos(new T.BoxGeometry(w, 0.12, t + 0.14)), fr = [], ca = [];
    for (let i = 0; i < n; i++) {
      const tt = i / n, q = shape.getPointAt(tt), r = shape.getPointAt((tt + 0.002) % 1);
      let nx = -(r.y - q.y), ny = r.x - q.x; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      if (!inside(q.x + nx * 0.3, q.y + ny * 0.3)) { nx = -nx; ny = -ny; }
      if (evitar && Math.hypot(q.x - evitar[0], q.y - evitar[1]) < 0.7) continue;
      const spin = Math.atan2(ny, nx) - Math.PI / 2 + 0.35, cx = q.x + nx * lf * 0.45, cy = q.y + ny * lf * 0.45;
      [1, -1].forEach((k) => fr.push({ p: V(cx, cy, z(cx, cy) + k * (t / 2 + 0.035)), n: V(0, 0, 1), spin }));
      ca.push({ p: V(q.x, q.y, z(q.x, q.y)), n: V(0, 0, 1), spin: spin - 0.35 });
    }
    g.add(many(gF, mat, fr)); g.add(many(gC, mat, ca));
  }

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
    // cruzada: adelante baja en diagonal (más alta de un lado), como la bordó con cebra
    cruzada: (dx) => { const a = Math.abs(dx), t = ss(18, 32, a), c = -0.22 * Math.max(-13, Math.min(13, dx)) * (1 - t), h = mix(4, STRAP, t); return [c + h, c - h]; },
    funcional: () => [1.9, -1.9],
  };
  // dónde se cortan las zonas (cortes en diagonal, paralelos, como en las fajas reales)
  const CORTE = { recta: 12, asimetrica: 10, mono: 8.5, cruzada: 11, funcional: 15.5 };
  const PEND = 0.42, ONDA = 2.2; // ONDA: alto de cada onda del corte ondulado (cm)

  // tamaño de la argolla según el alto del cinto en ese corte; gw: medio ancho del hueco; th: media altura de la lengüeta
  function argollaMedidas(F, xc) { const [t, b] = F(xc(0)), half = (t - b) / 2, R = Math.min(2.6, half * 0.6); return { R, gw: R + 1.1, th: Math.min(1.1, half * 0.32) }; }

  // flecos: de qué lado (k: +1 izquierda de quien lo usa) y entre qué distancias al centro (cm)
  const flecosRango = (st, forma) => { const d0 = CORTE[forma] + 0.9; return { k: st.lado === 'derecha' ? -1 : 1, d0, d1: d0 + (st.tramo === 'largo' ? 22 : 12) }; };
  const BROCHES = 14; // cierre con broches: al costado (izquierda de quien lo usa, el que se ve de frente)
  // soles: en el segundo cuero, repartidos parejo desde el corte hasta atrás de todo (incluido el del medio de atrás)
  const solesPos = (st, L, forma) => { const d0 = CORTE[forma] + 3.5, n = Math.max(1, Math.round((L / 2 - d0) / 11)), paso = (L / 2 - d0) / n, out = []; for (let i = 0; i < n; i++) out.push(d0 + i * paso, -(d0 + i * paso)); out.push(L / 2, -L / 2); return out; };
  // dibuja un sol cosido (rayos de hilo desde el centro)
  function sol(g, x, y, R, K, color) {
    g.strokeStyle = color; g.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = R * (i % 2 ? 0.62 : 1); g.lineWidth = 0.1 * K; g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.14, y + Math.sin(a) * R * 0.14); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
    g.fillStyle = color; g.beginPath(); g.arc(x, y, R * 0.1, 0, Math.PI * 2); g.fill();
  }

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
    // corte ondulado: la pieza del centro avanza con ondas sobre la de al lado (un remache en cada onda)
    const onda = (y) => (st.union === 'ondulada' ? 0.6 * Math.abs(Math.sin(Math.PI * y / ONDA)) : 0);
    const xL = (y) => -a + PEND * y - onda(y), xR = (y) => a + PEND * y + onda(y), xD = (y) => a + 4.6 + PEND * y;
    const zona = (x0, x1) => { const p = new Path2D(), n = 80; for (let i = 0; i <= n; i++) { const y = HM / 2 - HM * i / n; i ? p.lineTo(px(x1(y)), py(y)) : p.moveTo(px(x1(y)), py(y)); } for (let i = n; i >= 0; i--) { const y = HM / 2 - HM * i / n; p.lineTo(px(x0(y)), py(y)); } p.closePath(); return p; };
    const linea = (xc) => { const p = new Path2D(), n = 80; for (let i = 0; i <= n; i++) { const y = HM / 2 - HM * i / n; i ? p.lineTo(px(xc(y)), py(y)) : p.moveTo(px(xc(y)), py(y)); } return p; };
    const lejos = (k) => () => k;
    const combo = st.combo || 'solo';
    const zonas = [];
    // alternado: cada cuero dos veces (adelante y atrás el principal; los costados, el otro)
    const xL2 = (y) => -(L / 2 - a) + PEND * y, xR2 = (y) => (L / 2 - a) + PEND * y;
    if (combo === 'solo') zonas.push([lejos(-L), lejos(L), st.cuero]);
    else if (combo === 'alternado') zonas.push([lejos(-L), xL2, st.cuero], [xL2, xL, st.cuero2], [xL, xR, st.cuero], [xR, xR2, st.cuero2], [xR2, lejos(L), st.cuero]);
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
    // con un solo cuero también se puede cortar y unir (para que se vea la unión)
    const unido = st.union && st.union !== 'ninguna';
    const cortes = combo === 'solo' ? (unido ? [xL, xR] : []) : combo === 'detalle' ? [xL, xR, xD] : combo === 'alternado' ? [xL2, xL, xR, xR2] : [xL, xR];
    if (st.union === 'trenzado') {
      cortes.forEach((xc) => {
        for (let y = -HM / 2; y <= HM / 2; y += 1.1) {
          const x = xc(y), d = 0.75;
          g.strokeStyle = '#efe2c6'; g.lineWidth = 0.22 * K; g.lineCap = 'round';
          g.beginPath(); g.moveTo(px(x - d), py(y + 0.35)); g.lineTo(px(x + d), py(y - 0.35)); g.stroke();
          g.fillStyle = 'rgba(20,12,8,.8)'; [-d, d].forEach((o) => { g.beginPath(); g.arc(px(x + o), py(y), 0.14 * K, 0, Math.PI * 2); g.fill(); });
        }
      });
    } else cortes.forEach((xc) => { g.strokeStyle = st.union === 'ondulada' ? 'rgba(25,15,10,.85)' : 'rgba(25,15,10,.55)'; g.lineWidth = (st.union === 'ondulada' ? 0.3 : 0.12) * K; g.stroke(linea(xc)); });
    // acordonada: ojalillos a los dos lados del corte y un tiento cruzado entre ellos
    if (st.union === 'acordonada') {
      cortes.forEach((xc) => {
        const [t, b] = F(xc(0)), ys = []; for (let y = t - 0.9; y >= b + 0.8; y -= 1.15) ys.push(y);
        g.strokeStyle = '#3a2416'; g.lineWidth = 0.24 * K; g.lineCap = 'round';
        ys.forEach((y, i) => { if (!i) return; const y1 = ys[i - 1], o = 0.75; g.beginPath(); g.moveTo(px(xc(y1) - o), py(y1)); g.lineTo(px(xc(y) + o), py(y)); g.moveTo(px(xc(y1) + o), py(y1)); g.lineTo(px(xc(y) - o), py(y)); g.stroke(); });
      });
    }
    // soles cosidos
    if (st.deco === 'soles') { const fun = forma === 'funcional', R = fun ? 1.3 : 2.4, col = ['cebra', 'plateado', 'blanco', 'vaca', 'leopardo'].includes(st.cuero) ? '#3b2a1f' : '#e6d3a8'; solesPos(st, L, forma).forEach((d) => { const [t, b] = F(d); sol(g, px(d), py((t + b) / 2), R * K, K, col); }); }
    // tiento por el borde: puntadas en diagonal que abrazan el canto de arriba y el de abajo
    if (st.deco === 'tiento') {
      g.strokeStyle = '#d7bf96'; g.lineWidth = 0.22 * K; g.lineCap = 'round';
      for (let d = -L / 2 + 1; d <= L / 2 - 1; d += 0.65) { const [t, b] = F(d); g.beginPath(); g.moveTo(px(d - 0.2), py(t + 0.1)); g.lineTo(px(d + 0.25), py(t - 0.6)); g.moveTo(px(d - 0.2), py(b - 0.1)); g.lineTo(px(d + 0.25), py(b + 0.6)); g.stroke(); }
    }
    // flecos: agujeros por el borde de abajo, de donde salen las tiras
    if (st.deco === 'flecos') { const f = flecosRango(st, forma); g.fillStyle = '#140c08'; for (let d = f.d0; d <= f.d1; d += 0.9) { const dx = f.k * d, [, b] = F(dx); g.beginPath(); g.arc(px(dx), py(b + 0.55), 0.13 * K, 0, Math.PI * 2); g.fill(); } }
    // cierre con broches: la punta que se superpone, con su sombra
    if (st.cierre === 'broches' && forma !== 'funcional') { const [t, b] = F(BROCHES); g.fillStyle = 'rgba(20,12,8,.35)'; g.fillRect(px(BROCHES - 2.6), py(t), 0.25 * K, (t - b) * K); g.strokeStyle = 'rgba(25,15,10,.85)'; g.lineWidth = 0.3 * K; g.beginPath(); g.moveTo(px(BROCHES - 2.4), py(t)); g.lineTo(px(BROCHES - 2.4), py(b)); g.stroke(); }
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
    // argollas: en cada corte el cuero se abre y cada lado termina en una lengüeta que abraza la argolla
    if (st.union === 'argollas') {
      cortes.forEach((xc) => {
        const a = argollaMedidas(F, xc), x0 = xc(0);
        const hueco = new Path2D();
        hueco.moveTo(px(xc(HM / 2) - a.gw), 0); hueco.lineTo(px(xc(HM / 2) + a.gw), 0); hueco.lineTo(px(xc(-HM / 2) + a.gw), H); hueco.lineTo(px(xc(-HM / 2) - a.gw), H); hueco.closePath();
        const resto = new Path2D(); resto.rect(0, 0, W, H);
        [[x0 - a.gw - 1, x0 - a.R + 0.1], [x0 + a.R - 0.1, x0 + a.gw + 1]].forEach(([u0, u1]) => resto.rect(px(u0), py(a.th), (u1 - u0) * K, 2 * a.th * K));
        g.save(); g.clip(resto, 'evenodd');
        g.save(); g.clip(sil); g.strokeStyle = 'rgba(35,22,15,.9)'; g.lineWidth = 0.5 * K; g.stroke(hueco); g.restore();
        g.globalCompositeOperation = 'destination-out'; g.fill(hueco);
        g.restore();
      });
    }
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
    // uniones en 3D: remaches y argollas sobre cada corte (en el metal elegido)
    const mt = metalDe(st.metal);
    m.cortes.forEach((xc) => {
      const [t, b] = m.F(xc(0));
      if (st.union === 'remaches') g.add(pasa(studGeo(deco ? 0.4 : 0.3), mt, [1 / 3, 2 / 3].map((f) => { let y = b + (t - b) * f; const [t2, b2] = m.F(xc(y)); y = b2 + (t2 - b2) * f; return { p: at(xc(y), y, 0.02), n: nrm(xc(y)) }; }), thick + 0.07, 0.22));
      // ondulada: un remache en el medio de cada onda, sobre la pieza del centro
      if (st.union === 'ondulada') { const lado = xc(0) < 0 ? 1 : -1, list = []; for (let y = ONDA / 2; y < t - 0.4; y += ONDA) [y, -y].forEach((yy) => { if (yy > b + 0.4) list.push({ p: at(xc(yy) + lado * 0.6, yy, 0.02), n: nrm(xc(yy)) }); }); g.add(pasa(studGeo(0.3), mt, list, thick + 0.07, 0.2)); }
      // acordonada: ojalillos de metal
      if (st.union === 'acordonada') { const list = []; for (let y = t - 0.9; y >= b + 0.8; y -= 1.15) [-0.75, 0.75].forEach((o) => list.push({ p: at(xc(y) + o, y, 0.03), n: nrm(xc(y)) })); g.add(many(new T.TorusGeometry(0.2, 0.07, 8, 20), mt, list)); }
      // grapas: tres puentes de metal cruzando el corte
      if (st.union === 'grapas') { const h = (t - b) / 2, geo = new T.BoxGeometry(1.5, 0.34, 0.16); g.add(many(geo, mt, [-0.45, 0, 0.45].map((f) => { const y = (t + b) / 2 + f * h; return { p: at(xc(y), y, 0.08), n: nrm(xc(y)) }; }))); }
      if (st.union === 'argollas') {
        const a = argollaMedidas(m.F, xc), x0 = xc(0);
        const ring = torus(a.R, Math.max(0.2, a.R * 0.11), mt); ring.position.copy(at(x0, 0, 0.05)); ring.lookAt(ring.position.clone().add(nrm(x0))); g.add(ring);
        // remache que cierra cada lengüeta
        g.add(pasa(studGeo(0.3), mt, [-1, 1].map((k) => ({ p: at(x0 + k * (a.R + 0.45), 0, 0.02), n: nrm(x0 + k * (a.R + 0.45)) })), thick + 0.07, 0.2));
      }
    });
    // decoración (siempre en todo el cinto): tachas arriba y abajo, en el medio o en zigzag
    if (['tachas', 'tachas-medio', 'zigzag'].includes(st.deco)) {
      const list = [], fun = !deco, off = fun ? 0.72 : 1.15;
      // libre: ni sobre la hebilla y su doblez, ni sobre los agujeros, ni sobre el pasador
      const libre = (dx) => Math.abs(dx) > (fun ? 4.8 : 3.8) && !(fun && dx > 1.8 && dx < 8.4) && !(fun && dx > -7.2 && dx < -4.6) && !(st.cierre === 'broches' && Math.abs(dx - BROCHES) < 3.2);
      if (st.deco === 'tachas') for (let dx = -L / 2 + 1.5; dx <= L / 2 - 1.5; dx += 1.5) { if (!libre(dx)) continue; const [t, b] = m.F(dx); list.push({ p: at(dx, t - off), n: nrm(dx) }, { p: at(dx, b + off), n: nrm(dx) }); }
      if (st.deco === 'tachas-medio') for (let dx = -L / 2 + 1.5; dx <= L / 2 - 1.5; dx += 1.3) { if (!libre(dx)) continue; const [t, b] = m.F(dx); list.push({ p: at(dx, (t + b) / 2), n: nrm(dx) }); }
      if (st.deco === 'zigzag') { let k = 0; for (let dx = -L / 2 + 1.5; dx <= L / 2 - 1.5; dx += 1.05) { if (!libre(dx)) continue; const [t, b] = m.F(dx), c = (t + b) / 2, amp = (t - b) / 2 - off; list.push({ p: at(dx, c + [amp, 0, -amp, 0][k % 4]), n: nrm(dx) }); k++; } }
      g.add(pasa(studGeo(deco ? 0.4 : 0.28), mt, list, thick + 0.07, deco ? 0.24 : 0.17));
    }
    // flecos de 40 cm que salen de los agujeros del borde de abajo, de un solo costado
    if (st.deco === 'flecos' && st.cuero) {
      const f = flecosRango(st, m.forma), pts = [];
      for (let d = f.d0; d <= f.d1; d += 0.9) { const dx = f.k * d, [, b] = m.F(dx); [-0.12, 0.12].forEach((o) => pts.push({ p: at(dx + o, b + 0.55, 0.06), n: nrm(dx) })); }
      g.add(flecos(pts, 40, 0.32, leather(st.cuero2 || st.cuero)));
    }
    // cierre con broches al costado (faja sin hebilla)
    const conBroches = deco && st.cierre === 'broches';
    if (conBroches) {
      const [t, b] = m.F(BROCHES), h = (t - b) / 2, c = (t + b) / 2;
      const geo = new T.CylinderGeometry(0.5, 0.5, 0.22, 24); geo.rotateX(Math.PI / 2);
      g.add(many(geo, metalDe(st.metalCierre, mt), [-0.55, 0, 0.55].map((f) => ({ p: at(BROCHES - 1.3, c + f * h, 0.1), n: nrm(BROCHES - 1.3) }))));
    }
    // funcional: dos remaches donde se dobla el cuero de la hebilla, y el pasador
    if (!deco && st.cuero) {
      if (st.hebilla) g.add(pasa(studGeo(0.3), mt, [-3.3, -4.4].map((dx) => ({ p: at(dx, 0, 0.02), n: nrm(dx) })), thick + 0.07, 0.2));
      const k0 = 0.5 - 6.4 / L, k1 = 0.5 - 5.5 / L;
      g.add(band({ u0: k0, u1: k1, center, normal, height: () => 4.6, thick: thick + 0.5, mat: leather(st.cuero), closed: false, n: 6 }));
    }
    // hebilla adelante al medio
    if (st.hebilla && !conBroches) {
      const [t, b] = m.F(0), alto = deco ? (m.forma === 'mono' ? 7 : Math.min(9.2, (t - b) * 0.95)) : 4.9;
      const hb = hebilla(st.hebilla, alto); hb.position.copy(at(0, 0, 0.35)); g.add(hb);
      // faja: dos remaches al lado de la hebilla, donde se dobla el cuero
      if (deco) { const dx = alto * 0.62 + 1.2; g.add(pasa(studGeo(0.36), mt, [-1, 1].map((k) => ({ p: at(dx, (t + b) / 2 + k * 1.1, 0.02), n: nrm(dx) })), thick + 0.07, 0.22)); }
    }
    g.rotation.y = -0.35;
    return { group: g, pitch: -0.02 };
  };

  const hebillaMat = {};
  function hebilla(id, H) {
    const hb = ((window.DT && window.DT.hebillas) || []).find((x) => x.id === id) || { tipo: 'marco', forma: 'rect', metal: 'bronce' };
    // el color de cada hebilla sale de su foto (envejecida, no plata ni oro de catálogo)
    const mat = hb.color ? (hebillaMat[hb.id] || (hebillaMat[hb.id] = (() => { const mm = new T.MeshStandardMaterial({ color: hb.color, metalness: 0.9, roughness: hb.metal === 'oro' ? 0.3 : 0.42 }); mm.color.convertSRGBToLinear(); return mm; })()))
      : hb.metal === 'plata' ? MAT.plata : hb.metal === 'oro' ? MAT.oro : MAT.bronce;
    const g = new T.Group();
    const ext = (shape, depth, bev) => new T.Mesh(new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 48 }), mat);
    const ellipse = (rx, ry) => { const sh = new T.Shape(); sh.absellipse(0, 0, rx, ry, 0, Math.PI * 2); return sh; };
    const holeEllipse = (rx, ry) => { const ph = new T.Path(); ph.absellipse(0, 0, rx, ry, 0, Math.PI * 2, true); return ph; };
    if (hb.tipo === 'rellena') {
      if (hb.forma === 'cuadrada') {
        g.add(ext(roundedRect(H * 0.9, H * 0.9, H * 0.04), 0.35, 0.2));
        const list = [];
        for (let k = 0; k < 4; k++) for (let q = 0; q < 4; q++) { const t = -0.4 + q * 0.8 / 3; const pts = [[t, -0.4], [t, 0.4], [-0.4, t], [0.4, t]][k]; list.push({ p: V(pts[0] * H, pts[1] * H, 0.62), n: V(0, 0, 1) }); }
        g.add(many(new T.SphereGeometry(H * 0.03, 10, 8), mat, list));
      } else if (hb.forma === 'flor') {
        const sh = new T.Shape(), N = 12;
        for (let k = 0; k <= N * 8; k++) { const a = k / (N * 8) * Math.PI * 2; const r = H * (0.42 + 0.07 * Math.cos(a * N)); if (k === 0) sh.moveTo(r * Math.cos(a), r * Math.sin(a)); else sh.lineTo(r * Math.cos(a), r * Math.sin(a)); }
        g.add(ext(sh, 0.35, 0.3));
        const r1 = torus(H * 0.28, 0.1, mat); r1.position.z = 0.7; g.add(r1);
        const dome = new T.Mesh(new T.SphereGeometry(H * 0.15, 24, 16), mat); dome.scale.z = 0.6; dome.position.z = 0.7; g.add(dome);
      } else {
        const rx = hb.forma === 'oval' ? H * 0.38 : H * 0.44, ry = H * 0.46;
        g.add(ext(ellipse(rx, ry), 0.35, 0.3));
        const r1 = torus(1, 0.1, mat); r1.scale.set(rx * 0.78, ry * 0.78, 1); r1.position.z = 0.7; g.add(r1);
        if (hb.forma === 'oval') for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; const ray = new T.Mesh(new T.BoxGeometry(H * 0.18, 0.08, 0.08), mat); ray.position.set(Math.cos(a) * rx * 0.4, Math.sin(a) * ry * 0.4, 0.72); ray.rotation.z = a; g.add(ray); }
      }
      return g;
    }
    // marco con púa
    let frame, w;
    if (hb.forma === 'rect') { w = H * 0.8; frame = roundedRect(w, H, H * 0.1); frame.holes.push(roundedRect(w - H * 0.2, H - H * 0.3, H * 0.05)); }
    else { const rx = hb.forma === 'oval' ? H * 0.62 : H * 0.48, ry = H * 0.48, t = hb.id.includes('fina') ? H * 0.07 : hb.id.includes('ancha') ? H * 0.16 : H * 0.1; w = rx * 2; frame = ellipse(rx, ry); frame.holes.push(holeEllipse(rx - t, ry - t)); }
    g.add(ext(frame, 0.3, hb.id === 'oval-labrada' ? 0.24 : 0.16));
    const bar = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, H * 0.92, 12), mat); bar.position.z = 0.25; g.add(bar);
    const puas = hb.id === 'doble-plateada' ? [-H * 0.18, H * 0.18] : [0];
    puas.forEach((y) => { const tongue = new T.Mesh(new T.BoxGeometry(w * 0.48, 0.24, 0.2), mat); tongue.position.set(w * 0.22, y, 0.45); g.add(tongue); });
    return g;
  }

  // tarjetero de tres compartimientos escalonados: atrás el más alto, el del medio (franja o V,
  // a veces en otro cuero) y adelante el más bajo; como los que hace Decora.te
  // tarjetero: cuero fino. Atrás la pieza más alta; adelante, la del medio (franja, V o diagonal, a veces en
  // otro cuero) y la de adelante. Las de adelante están cosidas a la de atrás por los costados y abajo, y se
  // abomban hacia arriba: entre la de atrás y la del medio queda el bolsillo grande, para billetes.
  M.tarjetero = (st) => {
    const g = new T.Group(), W = 10, HB = 7.2, yb = -HB / 2, x0 = -W / 2, x1 = W / 2, r = 0.6, t = 0.09;
    const m1 = leather(st.cuero), m2 = st.cuero2 ? leather(st.cuero2) : (st.detalle && st.detalle !== 'no' ? MAT.vacio : m1);
    const diag = st.detalle === 'diagonal', v = st.detalle === 'v', caida = 2.3, vh = 1.8;
    const yM = yb + (diag ? 6.1 : 5.7), yF = yb + (diag ? 4.9 : 4.4);
    const bot = (x) => esquina(x, W / 2, r, yb, -1);
    const borde = (top, tipo) => (x) => {
      if (tipo === 'diag') return top - caida * (x - x0) / W;
      if (tipo === 'v') return top - vh * Math.max(0, 1 - Math.abs(x) / 2.6);
      if (tipo === 'luna') return top - (Math.abs(x) < 1.9 ? Math.sqrt(1.9 * 1.9 - x * x) : 0);
      return top;
    };
    const topM = borde(yM, diag ? 'diag' : v ? 'v' : 'recto'), topF = borde(yF, diag ? 'diag' : v ? 'v' : st.detalle === 'franja' ? 'recto' : 'luna');
    // abombado: nada en los costados y abajo (cosido), más arriba al centro (la boca del bolsillo)
    const panza = (x, y, top, k) => k * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / (W / 2), 4)), 0.8) * Math.pow(Math.max(0, (y - yb) / (top - yb)), 1.7);
    g.add(lamina({ x0, x1, bot, top: (x) => esquina(x, W / 2, r, HB / 2, 1), z: () => 0, t, mat: m1 }));
    // atrás de todo, otra pieza entera: entre las dos queda el bolsillo grande para billetes, con la boca arriba de todo
    const topA = (x) => esquina(x, W / 2, r, HB / 2 - 0.25, 1);
    const zA = (x, y) => -(t + 0.02) - panza(x, y, topA(x), 1.3);
    g.add(lamina({ x0, x1, bot, top: topA, z: zA, t, mat: m1 }));
    const zM = (x, y) => t + 0.02 + panza(x, y, topM(x), 1.05);
    const zF = (x, y) => zM(x, y) + t + 0.02 + panza(x, y, topF(x), 0.18);
    g.add(lamina({ x0, x1, bot, top: topM, z: zM, t, mat: m2 }));
    g.add(lamina({ x0, x1, bot, top: topF, z: zF, t, mat: m1 }));
    if (st.cuero) {
      // costura a mano, fina: costados (atravesando las tres piezas) y abajo
      const hilo = hiloPara(st.cuero), sobre = (zf, xx, y) => ({ p: V(xx, y, zf(xx, y) + t / 2 + 0.02), n: V(0, 0, 1) }), G = 0.42, GR = 0.03;
      [x0 + 0.38, x1 - 0.38].forEach((xx) => {
        g.add(stitchesAlong([sobre(() => 0, xx, HB / 2 - 0.5), sobre(() => 0, xx, topM(xx) + 0.15)], hilo, G, GR));
        // costura del bolsillo de atrás (se ve dando vuelta el tarjetero)
        g.add(stitchesAlong([{ p: V(xx, topA(xx) - 0.3, zA(xx, topA(xx) - 0.3) - t / 2 - 0.02), n: V(0, 0, -1) }, { p: V(xx, yb + 0.4, zA(xx, yb + 0.4) - t / 2 - 0.02), n: V(0, 0, -1) }], hilo, G, GR));
        g.add(stitchesAlong([sobre(zM, xx, topM(xx) - 0.3), sobre(zM, xx, topF(xx) + 0.1)], hilo, G, GR));
      });
      const pts = []; pts.push(sobre(zF, x0 + 0.38, topF(x0 + 0.38) - 0.3)); for (let xx = x0 + 0.38; xx <= x1 - 0.38 + 1e-6; xx += 0.5) pts.push(sobre(zF, xx, bot(xx) + 0.38)); pts.push(sobre(zF, x1 - 0.38, topF(x1 - 0.38) - 0.3));
      g.add(stitchesAlong(pts, hilo, G, GR));
    }
    return { group: g, pitch: 0.5, yaw: -0.45 };
  };

  // estuche de lentes: funda blanda de dos caras cosidas por los costados y abajo, con la boca arriba en
  // diagonal (más alta del lado del mosquetón) y apenas abierta; las esquinas de abajo, redondeadas
  M['porta-lentes'] = (st) => {
    const g = new T.Group(), W = 8.4, H = 17.4, x0 = -W / 2, x1 = W / 2, r = 1.3, t = 0.12, m = leather(st.cuero);
    const bot = (x) => esquina(x, W / 2, r, -H / 2, -1), top = (x) => H / 2 - 1.3 * (x - x0) / W;
    const tapa = st.modelo === 'con-tapa';
    // con tapa, la boca se cierra arriba (la tapa la cubre); sin tapa queda apenas abierta
    const cierra = (x, y) => (tapa ? 1 - ss(top(x) - 3.2, top(x), y) * 0.85 : 1);
    const panza = (x, y) => 0.8 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / (W / 2), 2.2)), 0.6) * Math.pow(Math.min(1, Math.max(0, (y - bot(x)) / 3)), 0.7) * cierra(x, y);
    const zf = (x, y) => t / 2 + 0.02 + panza(x, y), zb = (x, y) => -zf(x, y);
    g.add(lamina({ x0, x1, bot, top, z: zb, t, mat: m, nu: 34, nv: 46 }));
    g.add(lamina({ x0, x1, bot, top, z: zf, t, mat: m, nu: 34, nv: 46 }));
    // dos cueros: abajo de un corte en diagonal con una onda suave, el segundo cuero (adelante)
    if (st.combo === 'diagonal') {
      const corte = (x) => -3.2 + 3.6 * (x - x0) / W + 0.7 * Math.sin(Math.PI * (x - x0) / W * 2);
      const m2 = st.cuero2 ? leather(st.cuero2) : MAT.vacio;
      g.add(lamina({ x0, x1, bot, top: corte, z: (x, y) => zf(x, y) + t + 0.01, t: 0.07, mat: m2, nu: 34, nv: 20 }));
    }
    if (tapa) {
      // tapa: el cuero de atrás sigue por arriba (doblez redondo) y cae sobre el frente; borde con costura y broche
      const tb = (x) => top(x) - 5.6 - 1.0 * Math.pow(1 - Math.abs(x) / (W / 2), 1.5);
      const zt = (x, y) => zf(x, y) + t + 0.1 + 0.32 * Math.pow(Math.max(0, (y - tb(x)) / (top(x) - tb(x))), 2);
      g.add(lamina({ x0, x1, bot: tb, top: (x) => top(x) + 0.02, z: zt, t: 0.13, mat: m, nu: 30, nv: 16 }));
      const pts = []; for (let x = x0; x <= x1 + 1e-6; x += 0.4) pts.push(V(x, top(x) + 0.03, (zt(x, top(x)) + zb(x, top(x))) / 2));
      const r0 = Math.max(0.18, (zt(0, top(0)) - zb(0, top(0))) / 2);
      g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, r0, 10, false), m));
      const borde = []; for (let x = x0 + 0.6; x <= x1 - 0.6 + 1e-6; x += 0.3) borde.push({ p: V(x, tb(x) + 0.45, zt(x, tb(x) + 0.45) + 0.08), n: V(0, 0, 1) });
      g.add(stitchesAlong(borde, hiloPara(st.cuero), 0.42, 0.035));
      const snap = new T.Mesh(studGeo(0.5), MAT.plata); snap.position.set(0, tb(0) + 1.2, zt(0, tb(0) + 1.2) + 0.08); g.add(snap);
    }
    const sobre = (x, y, out = 0.03) => ({ p: V(x, y, zf(x, y) + t / 2 + out), n: V(0, 0, 1) });
    const tope = (x) => (tapa ? top(x) - 6.8 : top(x) - 0.5);
    if (st.cuero && st.union !== 'tiento') {
      const pts = [sobre(x0 + 0.45, tope(x0 + 0.45))]; for (let x = x0 + 0.45; x <= x1 - 0.45 + 1e-6; x += 0.4) pts.push(sobre(x, bot(x) + 0.45)); pts.push(sobre(x1 - 0.45, tope(x1 - 0.45)));
      g.add(stitchesAlong(pts, hiloPara(st.cuero), 0.45, 0.035));
    }
    if (st.union === 'tiento') {
      // tiento que abraza el canto: puntadas anchas y en diagonal por los costados y abajo, de los dos lados
      const mt = st.cuero2 && st.combo !== 'diagonal' ? leather(st.cuero2) : MAT.tiento, geo = new T.BoxGeometry(0.3, 1.0, 0.08), list = [];
      [1, -1].forEach((k) => {
        const z = (x, y) => k * (zf(x, y) + t / 2 + 0.04), n = V(0, 0, k);
        for (let y = -H / 2 + 1.6; y <= tope(x0) ; y += 0.85) list.push({ p: V(x0 + 0.32, y, z(x0 + 0.32, y)), n, spin: 0.7 });
        for (let y = -H / 2 + 1.6; y <= tope(x1); y += 0.85) list.push({ p: V(x1 - 0.32, y, z(x1 - 0.32, y)), n, spin: -0.7 });
        for (let x = x0 + 1.4; x <= x1 - 1.3; x += 0.85) list.push({ p: V(x, bot(x) + 0.32, z(x, bot(x) + 0.32)), n, spin: Math.PI / 2 + 0.7 });
      });
      g.add(many(geo, mt, list));
    }
    // tachas en L (costado del mosquetón y abajo) o alrededor (costados y abajo; arriba nunca)
    if (st.deco === 'l' || st.deco === 'alrededor') {
      const list = [], m0 = 0.95, techo = tope(x0) - 0.6;
      for (let y = -H / 2 + m0 + 0.3; y <= techo; y += 1.1) list.push(sobre(x0 + m0, y, 0));
      for (let x = x0 + m0 + 1.1; x <= x1 - m0 - 0.5; x += 1.1) list.push(sobre(x, bot(x) + m0, 0));
      if (st.deco === 'alrededor') for (let y = -H / 2 + m0 + 0.3; y <= tope(x1) - 0.6; y += 1.1) list.push(sobre(x1 - m0, y, 0));
      g.add(pasa(studGeo(0.27), metalDe(st.metal, MAT.bronce), list, (it) => 2 * it.p.z, 0.18));
    }
    // mosquetón en la esquina alta (pasa por un ojalillo)
    const ey = eyelet(0.32, MAT.plata); ey.position.set(x0 + 0.9, top(x0 + 0.9) - 0.8, zf(x0 + 0.9, top(x0) - 0.8) + t); g.add(ey);
    const ring = torus(0.75, 0.1, MAT.plata); ring.position.set(x0 + 0.9, top(x0) + 0.25, 0.1); ring.rotation.y = Math.PI / 2; g.add(ring);
    const cl = clasp(1.5, MAT.plata); cl.position.set(x0 + 0.9, top(x0) + 1.7, 0.1); g.add(cl);
    if (st.conDije === 'si') {
      // el dije cuelga de la argolla del mosquetón, por delante del estuche
      const dj = dijeModelo(st.dije || 'estrella'), al = ((window.DT_DIJES_FORMAS || {})[st.dije] || { cm: 2.6 }).cm;
      const aro = torus(0.25, 0.05, MAT.plata); aro.position.set(x0 + 0.9, top(x0) + 0.05, zf(x0 + 0.9, top(x0) - 0.5) + 0.35); g.add(aro);
      // con tapa, la tapa queda más afuera: el dije va delante de ella
      const zd = zf(x0 + 0.9, top(x0) - 1.5) + (tapa ? 1.0 : 0.45);
      aro.position.z = zd - 0.1;
      dj.position.set(x0 + 0.9, top(x0) + 0.15 - al * 0.47, zd); dj.rotation.y = 0.3; g.add(dj);
    }
    return { group: g, pitch: 0.12, yaw: -0.4 };
  };

  // portafuego: funda chica de cuero blando, doblada de un costado y cerrada del otro y abajo
  // (cosida o con remaches), con la boca arriba; ojalillo y mosquetón en la esquina
  M.portafuego = (st) => {
    const g = new T.Group(), grande = st.tamano === 'grande', W = 3.8, H = grande ? 7.6 : 6.2, x0 = -W / 2, x1 = W / 2, r = 0.45, t = 0.12, m = leather(st.cuero);
    const bot = (x) => esquina(x, W / 2, r, -H / 2, -1), top = () => H / 2;
    // el lado del doblez (izquierda) es redondeado; el de la costura, plano
    const panza = (x, y) => 0.6 * Math.pow(Math.max(0, 1 - Math.pow((x - x0) / W * 2 - 1, 2)), 0.5) * Math.pow(Math.min(1, Math.max(0, (y - bot(x)) / 1.6)), 0.6) * (x < 0 ? 1 : Math.pow(Math.max(0, (x1 - x) / x1), 0.5));
    const zf = (x, y) => t / 2 + 0.02 + panza(x, y), zb = (x, y) => -zf(x, y);
    g.add(lamina({ x0, x1, bot, top, z: zb, t, mat: m, nu: 24, nv: 30 }));
    g.add(lamina({ x0, x1, bot, top, z: zf, t, mat: m, nu: 24, nv: 30 }));
    // doblez: un medio tubo une las dos caras por la izquierda
    const tubo = new T.Mesh(new T.CylinderGeometry(zf(x0, 0), zf(x0, 0), H - 0.4, 16, 1, true, Math.PI, Math.PI), m); tubo.position.set(x0, 0.2, 0); g.add(tubo);
    const sobre = (x, y, out = 0.02) => ({ p: V(x, y, zf(x, y) + t / 2 + out), n: V(0, 0, 1) });
    const mt = metalDe(st.metal, MAT.bronce);
    if (st.cuero) {
      const pts = [sobre(x1 - 0.35, H / 2 - 0.4), sobre(x1 - 0.35, -H / 2 + 0.35), sobre(x0 + 0.4, -H / 2 + 0.35)];
      g.add(stitchesAlong(pts, hiloPara(st.cuero), 0.4, 0.03));
    }
    // decoración: estrellas o remaches, en columna al medio, en L (la esquina de abajo, del lado contrario al
    // dije) o en dos filas verticales al costado
    if (['estrellas', 'remaches', 'estrellas-remaches'].includes(st.deco)) {
      const list = [], ub = st.ubicacion || 'columna', yb = -H / 2 + 0.6, xa = x0 + 0.6;
      if (ub === 'costados') [xa, x1 - 0.6].forEach((x) => { for (let y = yb + 0.1; y <= H / 2 - 1.1; y += 0.85) list.push(sobre(x, y)); });
      if (ub === 'columna') { const paso = (H - 2.6) / 2; for (let i = 0; i < 3; i++) list.push(sobre(-0.2, H / 2 - 1.3 - i * paso)); }
      if (ub === 'L') { for (let y = yb; y <= yb + H * 0.6; y += 0.8) list.push(sobre(xa, y)); for (let x = xa + 0.8; x <= x1 - 0.9; x += 0.8) list.push(sobre(x, yb)); }
      if (ub === 'filas') [xa, xa + 0.75].forEach((x) => { for (let y = yb + 0.1; y <= H / 2 - 0.8; y += 0.85) list.push(sobre(x, y)); });
      const chico = ub !== 'columna', est = [], rem = [];
      list.forEach((q, i) => (st.deco === 'estrellas' || (st.deco === 'estrellas-remaches' && i % 2 === 0) ? est : rem).push(q));
      if (est.length) g.add(pasa(starGeo(chico ? 0.34 : 0.45), mt, est, (it) => 2 * it.p.z, 0.12));
      if (rem.length) g.add(pasa(studGeo(chico ? 0.2 : 0.26), mt, rem, (it) => 2 * it.p.z, 0.14));
    }
    // ojalillo en la esquina; una argolla lo atraviesa y de ella cuelga el mosquetón
    const ex = x1 - 0.6, ey0 = H / 2 - 0.6, ez = zf(ex, ey0) + t;
    const ey = eyelet(0.28, MAT.bronce); ey.position.set(ex, ey0, ez); g.add(ey);
    const argolla = torus(0.62, 0.08, MAT.bronce); argolla.position.set(ex, ey0 + 0.45, 0); argolla.rotation.y = Math.PI / 2; g.add(argolla);
    const cl = clasp(1.0, MAT.bronce); cl.position.set(ex, ey0 + 0.45 + 0.62 + 0.55 + 0.05, 0); g.add(cl);
    if (st.conDije === 'si') {
      // el dije elegido (foto recortada) cuelga de la misma argolla, por delante
      const dj = dijeModelo(st.dije || 'estrella'), alto = ((window.DT_DIJES_FORMAS || {})[st.dije] || { cm: 2.6 }).cm;
      // cuelga de la argolla: el agujero de colgar del dije queda arriba, a la altura del ojalillo; apenas girado
      dj.position.set(ex, ey0 + 0.35 - alto * 0.47, ez + 0.3); dj.rotation.y = 0.35; dj.rotation.z = 0.05; g.add(dj);
      const aro = torus(0.25, 0.05, MAT.plata); aro.position.set(ex, ey0 + 0.25, ez + 0.2); g.add(aro);
    }
    if (st.flecos === 'si') {
      const pts = []; for (let x = x0 + 0.3; x <= x1 - 0.25; x += 0.4) pts.push({ p: V(x, -H / 2 + 0.3, zf(x, -H / 2 + 0.3) - 0.02), n: V(0, 0, 1) });
      g.add(flecos(pts, 15, 0.28, m));
    }
    return { group: g, pitch: 0.1, yaw: -0.45 };
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
  // pieza de cuero fino con cualquier forma (estrella, corazón, luna…): dos caras con el cuero recortado
  // (la textura lleva la forma en la transparencia), el canto alrededor y una curva suave, como cuero real
  function laminaForma(shape, t, id, curva) {
    const g = new T.Group(), pts = shape.getPoints(160);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; pts.forEach((q) => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
    const w = x1 - x0, h = y1 - y0, K = 640 / Math.max(w, h), cv = document.createElement('canvas'); cv.width = Math.ceil(w * K); cv.height = Math.ceil(h * K);
    const c = cv.getContext('2d'), path = new Path2D(); pts.forEach((q, i) => (i ? path.lineTo((q.x - x0) * K, (y1 - q.y) * K) : path.moveTo((q.x - x0) * K, (y1 - q.y) * K))); path.closePath();
    const src = id && leatherTex(id).cv, fam = CUERO[id] || {};
    if (src && src.dataset.ok) { const pat = c.createPattern(src, 'repeat'), sc = K * (fam.tile || TILE) / 1024; if (pat.setTransform) pat.setTransform(new DOMMatrix([sc, 0, 0, sc, 0, 0])); c.fillStyle = pat; } else c.fillStyle = id ? '#9b8569' : '#cbbca3';
    c.fill(path);
    c.strokeStyle = 'rgba(30,18,12,.55)'; c.lineWidth = 0.09 * K; c.stroke(path); // canto oscurecido
    const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
    const mat = new T.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: T.DoubleSide, roughness: fam.rough != null ? fam.rough : 0.6, metalness: fam.metal || 0 });
    [1, -1].forEach((side) => {
      const geo = new T.PlaneGeometry(w, h, 48, 48); geo.translate(x0 + w / 2, y0 + h / 2, 0);
      const q = geo.attributes.position; for (let i = 0; i < q.count; i++) q.setZ(i, curva(q.getX(i), q.getY(i)) + side * t / 2);
      geo.computeVertexNormals(); g.add(new T.Mesh(geo, mat));
    });
    // canto: una tira alrededor de la forma, entre las dos caras
    const pos = [], idx = [];
    pts.concat([pts[0]]).forEach((q, i) => { const z = curva(q.x, q.y); pos.push(q.x, q.y, z + t / 2, q.x, q.y, z - t / 2); if (i) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } });
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    g.add(new T.Mesh(geo, MAT.canto));
    return g;
  }
  // una forma del llavero (cuero fino, decoración y ojalillo)
  function formaLlavero(f, st) {
    const g = new T.Group(), t = 0.2;
    const curva = (x, y) => 0.05 * x * x - 0.035 * y * y * 0.6 + 0.04 * x; // apenas abombado, como dos cueros pegados
    g.add(laminaForma(f.s, t, st.cuero, curva));
    const z = (x, y) => curva(x, y) + t / 2;
    const trenzado = st.trenzado === 'si';
    if (trenzado) tientoForma(g, f.s, curva, t, st.cuero2 ? leather(st.cuero2) : MAT.tiento, f.top);
    if (st.deco === 'tachas' || st.deco === 'estrellas') {
      // siguen el borde de la forma, parejas y lejos del ojalillo (más adentro si lleva tiento)
      const est = st.deco === 'estrellas', pts = bordeForma(f.s, trenzado ? 0.95 : 0.6, est ? 1.2 : 0.95, f.top);
      g.add(pasa(est ? starGeo(0.32) : studGeo(0.24), metalDe(st.metal, MAT.bronce), pts.map(([x, y]) => ({ p: V(x, y, z(x, y)), n: V(0, 0, 1) })), t + 0.05, 0.15));
    }
    const ey = eyelet(0.3, MAT.plata); ey.position.set(f.top[0], f.top[1], z(f.top[0], f.top[1])); g.add(ey);
    return g;
  }
  M.llavero = (st) => {
    const g = new T.Group(), d = 0.36;
    if (st.forma === 'estrellas') {
      // tres estrellas de distintos tamaños, cada una con su cadena, a la misma argolla
      const P0 = V(0, 7.6, 0);
      [[0, 0, 1], [3.9, 2.6, 0.62], [-3.5, 3.2, 0.46]].forEach(([x, y, k]) => {
        const f = FORMAS.estrella(), e = formaLlavero(f, st); e.scale.setScalar(k); e.position.set(x, y, 0); g.add(e);
        const tp = V(x + f.top[0] * k, y + f.top[1] * k, 0), dir = tp.clone().sub(P0), size = 0.36, n = Math.max(2, Math.round(dir.length() / (size * 1.45)));
        const ch = chain(n, size, MAT.plata); ch.position.copy(P0); ch.rotation.z = Math.atan2(dir.x, -dir.y); g.add(ch);
      });
      const cl = clasp(1.1, MAT.plata); cl.position.set(0, P0.y + 0.9, 0); g.add(cl);
      return { group: g, pitch: 0.08, yaw: -0.4 };
    }
    if (st.forma === 'dos-estrellas') {
      // dos estrellas: la grande cuelga del mosquetón y la chica cuelga de una punta de abajo de la grande
      const f = FORMAS.estrella(); g.add(formaLlavero(f, st));
      const pa = 306 * Math.PI / 180, px0 = Math.cos(pa) * 2.55, py0 = Math.sin(pa) * 2.55;   // ojalillo en la punta de abajo
      const ey2 = eyelet(0.24, MAT.plata); ey2.position.set(px0, py0, 0.3); g.add(ey2);
      const k = 0.55, f2 = FORMAS.estrella(), chica = formaLlavero(f2, st); chica.scale.setScalar(k);
      const ch2 = chain(2, 0.3, MAT.plata); ch2.position.set(px0, py0 - 0.35, 0); g.add(ch2);
      chica.position.set(px0 - f2.top[0] * k, py0 - 1.25 - f2.top[1] * k, 0); g.add(chica);
      const [tx, ty] = f.top;
      const ch = chain(4, 0.42, MAT.plata); ch.position.set(tx, ty + 0.75 + 0.42 * 4.4, 0); g.add(ch);
      const cl = clasp(1.1, MAT.plata); cl.position.set(tx, ty + 0.75 + 0.42 * 6 + 0.6, 0); g.add(cl);
      return { group: g, pitch: 0.08, yaw: -0.4 };
    }
    const f = (FORMAS[st.forma] || FORMAS.estrella)();
    g.add(formaLlavero(f, st));
    const [tx, ty] = f.top;
    const ch = chain(4, 0.42, MAT.plata); ch.position.set(tx, ty + 0.75 + 0.42 * 4.4, 0); g.add(ch);
    const cl = clasp(1.1, MAT.plata); cl.position.set(tx, ty + 0.75 + 0.42 * 6 + 0.6, 0); g.add(cl);
    return { group: g, pitch: 0.08, yaw: -0.5 };
  };

  // una fila de decoración de metal: tachas, estrellas o estrellas y tachas intercaladas;
  // cant: '5' (cinco repartidas parejo) o 'toda' (de punta a punta, cada "paso")
  function decoFila(g, deco, cant, u0, u1, paso, en, rT, rE, mat, grosor = 0.22) {
    const us = [];
    if (cant === '5') for (let i = 0; i < 5; i++) us.push(u0 + (u1 - u0) * (i + 0.5) / 5);
    else for (let u = u0; u <= u1 + 1e-6; u += paso) us.push(u);
    const se = [], sr = [];
    us.forEach((u, i) => { const p = en(u); if (deco === 'estrellas' || (deco === 'estrellas-tachas' && i % 2 === 0)) se.push(p); else sr.push(p); });
    if (se.length) g.add(pasa(starGeo(rE), mat, se, grosor, rE * 0.3));
    if (sr.length) g.add(pasa(studGeo(rT), mat, sr, grosor, rT * 0.65));
  }

  // pulsera: tira de cuero derecha (sin inclinar) que da la vuelta y cierra con broche; la trenzada lleva
  // un tiento enlazado por los dos bordes, como las de Decora.te
  M.pulsera = (st) => {
    const g = new T.Group(), trenzada = st.modelo === 'trenzada', H = ({ '1-3': 1.3, intermedia: 3, 5: 5 }[st.ancho] || 3), m = leather(st.cuero), R = 3.05, thick = 0.2, turns = 1.08;
    // apenas ovalada (como la muñeca) y con una ondita en la altura: el cuero no queda perfecto
    const center = (u) => { const a = u * Math.PI * 2 * turns, r = R * (1 + 0.07 * Math.cos(2 * a)) + 0.24 * u; return V(r * Math.sin(a), 0.07 * Math.sin(3 * a + 0.6), r * Math.cos(a) * 0.93); };
    const normal = (u) => { const d = center(u + 0.002).sub(center(u - 0.002)); return V(-d.z, 0, d.x).normalize(); };
    const tilt = () => -0.07;   // un poco más abierta abajo, como un puño
    const cara = (u, dy, out) => { const tl = tilt(u), n = normal(u).multiplyScalar(Math.cos(tl)).add(V(0, Math.sin(tl), 0)), up = V(0, Math.cos(tl), 0).addScaledVector(normal(u), -Math.sin(tl)); return { p: center(u).addScaledVector(n, thick / 2 + out).addScaledVector(up, dy), n }; };
    const alto = (u) => H * (1 - 0.42 * Math.pow(ss(0.955, 1, u), 1.4)) * (1 - 0.25 * Math.pow(ss(0.03, 0, u), 1.4));   // puntas redondeadas
    g.add(band({ u0: 0, u1: 1, center, normal, height: alto, thick, tilt, mat: m, closed: false, n: 300 }));
    // broche donde se superponen las puntas
    const uS = 0.965, ps = center(uS).addScaledVector(normal(uS), thick / 2 + 0.05);
    const snap = new T.Mesh(new T.CylinderGeometry(Math.min(0.55, H * 0.3), Math.min(0.55, H * 0.3), 0.22, 24), MAT.plata); snap.position.copy(ps); snap.quaternion.setFromUnitVectors(V(0, 1, 0), normal(uS)); g.add(snap);
    // punto sobre la cara de afuera (lado 1) o la de adentro (lado -1)
    const punto = (u, dy, lado, out) => { const tl = tilt(u), n = normal(u).multiplyScalar(Math.cos(tl)).add(V(0, Math.sin(tl), 0)), up = V(0, Math.cos(tl), 0).addScaledVector(normal(u), -Math.sin(tl)); return { p: center(u).addScaledVector(n, lado * (thick / 2 + out)).addScaledVector(up, dy), n: n.clone().multiplyScalar(lado) }; };
    if (trenzada) {
      // tiento enlazado por los dos bordes: de frente se ven las puntas; cruza por adentro
      const largo = Math.PI * 2 * R * turns, paso = Math.max(0.55, Math.min(0.85, H * 0.32)) / largo, us = [];
      for (let u = 0.02; u <= 0.94; u += paso) us.push(u);
      tientoEnlazado(g, punto, us, H, true, st.cuero2 ? leather(st.cuero2) : MAT.tiento, thick);
    } else if (st.cuero && H >= 3) {
      [-1, 1].forEach((sgn) => { const pts = []; for (let u = 0.02; u <= 0.93; u += 0.006) pts.push(cara(u, sgn * (H / 2 - 0.35), 0.02)); g.add(stitchesAlong(pts, hiloPara(st.cuero), 0.38, 0.035)); });
    }
    const largoP = Math.PI * 2 * R * turns, U0 = 0.48;   // U0: el frente
    const fina = H < 2, rT = fina ? 0.15 : 0.22, rE = fina ? 0.24 : 0.36;   // tachas y estrellas, chicas
    if (['tachas', 'estrellas', 'estrellas-tachas'].includes(st.deco)) {
      const en = (u) => cara(u, 0, 0), sep = (st.deco === 'tachas' ? 2 * rT : 2 * rE) + (fina ? 0.45 : 0.6);
      decoFila(g, st.deco, st.cantidad || 'toda', 0.04, 0.92, sep / largoP, en, rT, rE, metalDe(st.metal, MAT.plata), thick + 0.06);
    }
    if (st.deco === 'azar') {
      // estrellas y tachas sueltas por toda la pulsera: nunca encimadas (hay una distancia mínima) y con
      // separaciones distintas entre sí; siempre las mismas, para que no cambien al girar
      let sd = 11; const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280), se = [], sr = [], pts = [];
      const largoT = largoP * 0.88, alto = Math.max(0, H - (fina ? 0.7 : 1.3)), minD = fina ? 1.3 : 1.6, n = Math.round(fina ? 8 : 6 + H * 1.3);
      for (let k = 0; k < 400 && pts.length < n; k++) {
        const x = rnd() * largoT, y = (rnd() - 0.5) * alto;
        if (pts.every(([a2, b2]) => Math.hypot(a2 - x, b2 - y) > minD * (0.9 + rnd() * 0.6))) pts.push([x, y]);
      }
      pts.forEach(([x, y], i) => { const q = cara(0.04 + x / largoP, y, 0); (i % 3 === 1 ? se : sr).push(q); });
      g.add(pasa(starGeo(rE), metalDe(st.metal, MAT.plata), se, thick + 0.06, rE * 0.3)); g.add(pasa(studGeo(rT), metalDe(st.metal, MAT.plata), sr, thick + 0.06, rT * 0.65));
    }
    if (st.deco === 'sol') {
      const Rs = H * 0.44, px = 512, K = px / (2 * Rs), cv = document.createElement('canvas'); cv.width = cv.height = px;
      const col = ['cebra', 'plateado', 'blanco', 'vaca', 'leopardo'].includes(st.cuero) ? '#3b2a1f' : '#e6d3a8';
      sol(cv.getContext('2d'), px / 2, px / 2, Rs * K * 0.96, K * 0.55, col);
      const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding;
      const N = 24, pos = [], uv = [], idx = [], du = Rs / largoP;
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const q = cara(U0 - du + 2 * du * i / N, -Rs + 2 * Rs * j / N, 0.012).p; pos.push(q.x, q.y, q.z); uv.push(i / N, j / N); }
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const k = j * (N + 1) + i; idx.push(k, k + 1, k + N + 1, k + 1, k + N + 2, k + N + 1); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      g.add(new T.Mesh(geo, new T.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.25, roughness: 0.85, side: T.DoubleSide, depthWrite: false })));
    }
    // el broche queda atrás
    g.rotation.y = Math.PI * 1.05;
    return { group: g, pitch: 0.2 };
  };

  M.collar = (st) => {
    const g = new T.Group(), H = st.ancho === 'grueso' ? 2.6 : 1.3, m = leather(st.cuero), SZ = 0.86;
    const prof = [[0, 10], [4.8, 9.8], [5.05, 7.5], [5.0, 3.5], [5.4, 1.2], [6.6, -0.4], [8.4, -1.4], [8.8, -2], [0, -2]];
    const neck = new T.Mesh(new T.LatheGeometry(prof.map(([r, y]) => new T.Vector2(r, y)), 64), MAT.maniqui); neck.scale.z = SZ; g.add(neck);
    const rx = 5.45, rz = 5.45 * SZ + 0.05, y0 = 5;
    // cae un poco adelante (el cuero pesa) y se separa del cuello abajo
    const center = (u) => { const a = -Math.PI + 0.22 + u * (Math.PI * 2 - 0.44), cae = 0.6 * Math.pow(Math.cos(Math.PI * (u - 0.5)), 2), ab = 1 + 0.035 * Math.pow(Math.cos(Math.PI * (u - 0.5)), 2); return V(rx * ab * Math.sin(a), y0 - cae, rz * ab * Math.cos(a)); };
    const normal = (u) => { const a = -Math.PI + 0.22 + u * (Math.PI * 2 - 0.44); return V(Math.sin(a) / rx, 0, Math.cos(a) / rz).normalize(); };
    const thick = 0.18;
    const tilt = (u) => -0.16 * Math.pow(Math.cos(Math.PI * (u - 0.5)), 2);   // adelante se acuesta sobre el pecho
    const alto = (u) => H * (1 - 0.45 * Math.max(ss(0.07, 0, u), ss(0.93, 1, u)));   // las puntas se afinan hacia los cordones
    g.add(band({ u0: 0, u1: 1, center, normal, height: alto, thick, tilt, mat: m, closed: false, n: 220 }));
    // trenzado: un tiento de otro cuero que cruza el collar; de los dos lados forma V (">"), de un lado pasa solo por el borde de arriba
    const trenzado = st.trenzado === 'uno' || st.trenzado === 'ambos';
    if (trenzado) {
      const punto = (u, dy, lado, out) => { const tl = tilt(u), n = normal(u).multiplyScalar(Math.cos(tl)).add(V(0, Math.sin(tl), 0)), up = V(0, Math.cos(tl), 0).addScaledVector(normal(u), -Math.sin(tl)); return { p: center(u).addScaledVector(n, lado * (thick / 2 + out)).addScaledVector(up, dy * alto(u) / H), n: n.clone().multiplyScalar(lado) }; };
      const us = []; for (let u = 0.04; u <= 0.96; u += 1.0 / 32) us.push(u);
      tientoEnlazado(g, punto, us, H, st.trenzado === 'ambos', st.cuero2 ? leather(st.cuero2) : MAT.tiento, thick);
    }
    // cordones atrás
    [0, 1].forEach((u) => { const p = center(u); const c = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 4, 8), leather(st.cuero) === MAT.vacio ? MAT.canto : leather(st.cuero)); c.position.copy(p).add(V(u ? -0.3 : 0.3, -2, -0.3)); c.rotation.z = u ? 0.15 : -0.15; g.add(c); });
    if (st.cuero && !trenzado) {
      [-1, 1].forEach((sgn) => { const pts = []; for (let u = 0.04; u <= 0.96; u += 0.008) { const tl = tilt(u), n = normal(u).multiplyScalar(Math.cos(tl)).add(V(0, Math.sin(tl), 0)), up = V(0, Math.cos(tl), 0).addScaledVector(normal(u), -Math.sin(tl)); pts.push({ p: center(u).addScaledVector(n, thick / 2 + 0.02).addScaledVector(up, sgn * (alto(u) / 2 - 0.22)), n }); } g.add(stitchesAlong(pts, hiloPara(st.cuero), 0.36, 0.035)); });
    }
    // decoración: cinco adelante o en todo el collar
    if (st.deco && st.deco !== 'no') {
      const en = (u) => { const tl = tilt(u), n = normal(u).multiplyScalar(Math.cos(tl)).add(V(0, Math.sin(tl), 0)); return { p: center(u).addScaledVector(n, thick / 2), n }; }, toda = st.cantidad === 'toda';
      decoFila(g, st.deco, st.cantidad || '5', toda ? 0.08 : 0.32, toda ? 0.92 : 0.68, 0.034, en, Math.min(0.3, H * 0.24), Math.min(0.48, H * 0.36), metalDe(st.metal, MAT.plata), thick + 0.06);
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
    sc.background = new T.Color(0x5c5c5c);
    const panel = (w, h, x, y, z, c) => { const p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); p.position.set(x, y, z); p.lookAt(0, 0, 0); sc.add(p); };
    // luz de estudio neutra (blanca y grises): el cuero se ve del color de la foto, sin teñirse
    panel(10, 6, 0, 9, 4, 0xffffff); panel(6, 8, -9, 2, 3, 0xbdbdbd); panel(6, 8, 9, 3, -2, 0xdedede); panel(20, 6, 0, -8, 0, 0x2a2a2a);
    const t = pm.fromScene(sc, 0.04).texture; pm.dispose();
    return t;
  }

  function create(host) {
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.LinearToneMapping; renderer.toneMappingExposure = 0.6; // calibrado: el cuero sale del mismo color que en la foto (medido cuero por cuero)
    host.innerHTML = ''; host.appendChild(renderer.domElement);
    renderer.domElement.className = 'p3d';
    const scene = new T.Scene(); scene.environment = entorno(renderer);
    const camera = new T.PerspectiveCamera(28, 1, 0.1, 1000);
    scene.add(new T.HemisphereLight(0xffffff, 0x6e6a66, 0.6));
    const key = new T.DirectionalLight(0xffffff, 1.3); key.position.set(4, 6, 7); scene.add(key);
    const rim = new T.DirectionalLight(0xffffff, 0.7); rim.position.set(-6, 3, -5); scene.add(rim);
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
    el.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; vel = dx * 0.008; yaw += vel; pitch = Math.max(-0.9, Math.min(1.25, pitch + dy * 0.004)); idle = 0; dirty = true; });
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

    // foto de la pieza tal como se ve ahora, sobre fondo crema (va al carrito y al pedido)
    function snapshot(size = 520) {
      if (!model) return null;
      pivot.rotation.set(pitch, yaw, 0);
      renderer.render(scene, camera);
      const src = renderer.domElement, out = document.createElement('canvas');
      const k = size / Math.max(src.width, src.height);
      out.width = Math.round(src.width * k); out.height = Math.round(src.height * k);
      const g = out.getContext('2d');
      g.fillStyle = '#f2ebdf'; g.fillRect(0, 0, out.width, out.height);
      g.drawImage(src, 0, 0, out.width, out.height);
      try { return out.toDataURL('image/jpeg', 0.8); } catch (e) { return null; }
    }

    return { update, el, snapshot };
  }

  return { create, formas: Object.keys(FORMAS) };
})();
