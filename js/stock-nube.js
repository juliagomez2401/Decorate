/* Decora.te · stock y precios en vivo desde Supabase (lo que Julia cambia en el panel).
   Se piden apenas carga la página; mientras tanto, y si Supabase no responde, se usa lo de js/stock.js y js/datos.js.
   Del stock solo se leen las piezas disponibles y sin costos (lo limitan las reglas de la base). */
(function () {
  var URL_ = 'https://tptuqviwbztmqsymgvgm.supabase.co';
  var KEY = 'sb_publishable_7bzfhpKaQ5iBORWqX96Cfg_HpNDTeok';
  var COLS = 'id,cat,sub,name,fotos,portada,hover,min,max,desde,confirmar,largo,talle';
  var num = function (v) { return v != null && /^\d+$/.test(String(v)) ? Number(v) : v; };   // '79' → 79; los links quedan
  var traer = function (path) {
    return fetch(URL_ + '/rest/v1/' + path, { headers: { apikey: KEY } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  };
  if (typeof fetch !== 'function') { window.DT_STOCK_LISTO = Promise.resolve(); return; }

  var stock = traer('stock?select=' + COLS + '&order=orden.asc')
    .then(function (rows) {
      if (!Array.isArray(rows)) return;
      window.DT_STOCK = rows.map(function (s) {
        s.fotos = (s.fotos || []).map(num); s.portada = num(s.portada); s.hover = num(s.hover);
        if (!s.portada) delete s.portada; if (!s.hover) s.hover = null;
        return s;
      });
      window.DT_STOCK_EN_VIVO = true;
    })
    .catch(function () { /* sin conexión o sin tabla todavía: queda la copia */ });

  // precios del armador: cada fila dice a qué precio de js/datos.js reemplaza
  var precios = traer('precios?select=id,precio,precio_max')
    .then(function (rows) {
      var D = window.DT;
      if (!D || !Array.isArray(rows) || !rows.length) return;
      var find = function (l, id) { return (l || []).filter(function (x) { return x.id === id; })[0]; };
      rows.forEach(function (r) {
        var k = r.id.split(':'), p = Number(r.precio), max = r.precio_max != null ? Number(r.precio_max) : null, o;
        if (k[0] === 'tipo' && (o = find(D.tipos, k[1]))) { o.min = p; o.max = max != null ? max : p; }
        else if (k[0] === 'hebilla' && (o = find(D.hebillas, k[1]))) o.price = p;
        else if (k[0] === 'union' && (o = find(D.uniones, k[1]))) o.price = p;
        else if (k[0] === 'deco' && (o = find(D.deco, k[1]))) o.price = p;
        else if (k[0] === 'prod' && (o = find(D.productos, k[1]))) {
          if (k.length === 2) o.base = p;
          else {
            var g = find((o.opciones || []).map(function (x) { return { id: x.key, items: x.items }; }), k[2]);
            var it = g && find(g.items, k[3]);
            if (it) { it.price = p; if (it.max != null || max != null) it.max = max != null ? max : p; if (it.note) it.note = '+$' + p + (it.max !== p ? ' a $' + it.max : ''); }
          }
        }
      });
      // el "desde" de cada categoría es lo más barato que se puede armar
      var PIEZA = { tarjeteros: 'tarjetero', 'porta-lentes': 'porta-lentes', portafuegos: 'portafuego', llaveros: 'llavero', pulseras: 'pulsera', collares: 'collar' };
      (D.categorias || []).forEach(function (c) {
        if (c.id === 'cintos') { c.desde = Math.min.apply(null, D.tipos.map(function (t) { return t.min; })); return; }
        var pr = find(D.productos, PIEZA[c.id]); if (!pr) return;
        if (pr.base) c.desde = pr.base;
        else if (pr.opciones && pr.opciones[0]) c.desde = Math.min.apply(null, pr.opciones[0].items.map(function (i) { return i.price; }));
      });
      window.DT_PRECIOS_EN_VIVO = true;
    })
    .catch(function () { /* quedan los de js/datos.js */ });

  // a lo sumo 3 segundos de espera; después sigue con la copia
  window.DT_STOCK_LISTO = Promise.race([Promise.all([stock, precios]), new Promise(function (ok) { setTimeout(ok, 3000); })]);
})();
