// Decora.te · mapa del sitio para Google (Cloudflare Pages Function: responde en /sitemap.xml).
// Se arma en el momento: las páginas fijas más cada pieza que esté a la venta en Supabase,
// así nunca queda desactualizado cuando Julia agrega o vende una pieza desde el panel.
// La clave es la "publishable" (pública a propósito, la misma que usa la web).
const BASE = 'https://decorate.com.uy';
const SUPA = 'https://tptuqviwbztmqsymgvgm.supabase.co';
const KEY = 'sb_publishable_7bzfhpKaQ5iBORWqX96Cfg_HpNDTeok';

const CATEGORIAS = ['cintos', 'tarjeteros', 'porta-lentes', 'portafuegos', 'llaveros', 'pulseras', 'collares'];
const ARMADOR = ['cinto', 'tarjetero', 'porta-lentes', 'portafuego', 'llavero', 'pulsera', 'collar'];

const FIJAS = [
  ['/', '1.0', 'daily'],
  ['/tienda', '0.9', 'daily'],
  ...CATEGORIAS.map((c) => [`/tienda?c=${c}`, '0.8', 'daily']),
  ['/arma', '0.8', 'weekly'],
  ...ARMADOR.map((p) => [`/arma?p=${p}`, '0.7', 'monthly']),
  ['/como-comprar', '0.5', 'monthly'],
];

const url = ([ruta, prioridad, frecuencia]) =>
  `  <url><loc>${BASE}${ruta}</loc><changefreq>${frecuencia}</changefreq><priority>${prioridad}</priority></url>`;

export async function onRequest() {
  let piezas = [];
  try {
    const r = await fetch(`${SUPA}/rest/v1/stock?select=id&order=orden.asc`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    if (r.ok) piezas = await r.json();
  } catch (e) { /* si Supabase no responde, van solo las páginas fijas */ }

  const filas = FIJAS.map(url).concat(
    (Array.isArray(piezas) ? piezas : []).filter((p) => /^[a-z0-9-]+$/i.test(p.id))
      .map((p) => url([`/producto?id=${p.id}`, '0.6', 'weekly'])),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${filas.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
