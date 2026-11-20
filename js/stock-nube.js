/* Decora.te · stock en vivo desde Supabase (lo que Julia cambia en el panel).
   Se pide apenas carga la página; mientras tanto, y si Supabase no responde, se usa la copia de js/stock.js.
   Solo se leen las piezas disponibles y sin costos (lo limitan las reglas de la base). */
(function () {
  var URL_ = 'https://tptuqviwbztmqsymgvgm.supabase.co';
  var KEY = 'sb_publishable_7bzfhpKaQ5iBORWqX96Cfg_HpNDTeok';
  var COLS = 'id,cat,sub,name,fotos,portada,hover,min,max,desde,confirmar,largo,talle';
  var num = function (v) { return v != null && /^\d+$/.test(String(v)) ? Number(v) : v; };   // '79' → 79; los links quedan
  var pedido = typeof fetch === 'function' ? fetch(URL_ + '/rest/v1/stock?select=' + COLS + '&order=orden.asc', { headers: { apikey: KEY } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (rows) {
      if (!Array.isArray(rows)) return;
      window.DT_STOCK = rows.map(function (s) {
        s.fotos = (s.fotos || []).map(num); s.portada = num(s.portada); s.hover = num(s.hover);
        if (!s.portada) delete s.portada; if (!s.hover) s.hover = null;
        return s;
      });
      window.DT_STOCK_EN_VIVO = true;
    })
    .catch(function () { /* sin conexión o sin tabla todavía: queda la copia */ }) : Promise.resolve();
  // a lo sumo 3 segundos de espera; después sigue con la copia
  window.DT_STOCK_LISTO = Promise.race([pedido, new Promise(function (ok) { setTimeout(ok, 3000); })]);
})();
