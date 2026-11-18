/* Decora.te · conexión con Supabase (pedidos, y más adelante cuentas y panel).
   La URL y la clave "publishable" son públicas a propósito: lo que se puede hacer
   con ellas lo limitan las reglas de la base (ver herramientas/supabase/*.sql).
   Nunca poner acá la clave secret / service_role. */
(function () {
  const URL_ = 'https://tptuqviwbztmqsymgvgm.supabase.co';
  const KEY = 'sb_publishable_7bzfhpKaQ5iBORWqX96Cfg_HpNDTeok';
  const H = { apikey: KEY };

  async function ok(r) {
    if (r.ok) return r;
    let t = ''; try { t = await r.text(); } catch (e) { /* nada */ }
    throw new Error(`${r.status} ${t}`.slice(0, 300));
  }

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

  // sube una foto (dataURL jpeg) y devuelve su link público
  async function subirFoto(dataUrl) {
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${new Date().toISOString().slice(0, 7)}/${uid()}.jpg`;
    await ok(await fetch(`${URL_}/storage/v1/object/pedidos/${path}`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'image/jpeg' }, body: blob,
    }));
    return `${URL_}/storage/v1/object/public/pedidos/${path}`;
  }

  // guarda el pedido y devuelve su número (DT-0001)
  async function crearPedido(p) {
    const r = await ok(await fetch(`${URL_}/rest/v1/rpc/crear_pedido`, {
      method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ p }),
    }));
    return r.json();
  }

  window.DTNube = { subirFoto, crearPedido };
})();
