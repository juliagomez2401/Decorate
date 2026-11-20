-- Decora.te · Paso 6: precios de venta del armador (Armá el tuyo), editables desde el panel.
-- Son los precios que ve cualquier cliente (no son costos). Generado desde js/datos.js, nov. 2026.
-- Pegar entero en Supabase > SQL Editor > New query > Run. Se puede correr más de una vez (no pisa lo que se cambie en el panel).

create table if not exists public.precios (
  id         text primary key,          -- tipo:funcional, hebilla:oval-bronce, prod:pulsera:ancho:5…
  grupo      text not null,             -- cinto, hebilla, union, deco, pieza
  nombre     text not null,
  precio     integer not null check (precio >= 0),
  precio_max integer check (precio_max >= 0),   -- solo si va con rango (ej.: cinto funcional 1000 a 1200)
  orden      integer not null default 0
);
alter table public.precios enable row level security;
drop policy if exists "todos leen precios" on public.precios;
create policy "todos leen precios" on public.precios for select to anon, authenticated using (true);
drop policy if exists "admin precios" on public.precios;
create policy "admin precios" on public.precios for all to authenticated using (public.es_admin()) with check (public.es_admin());
grant select on public.precios to anon;
grant select, insert, update, delete on public.precios to authenticated;

insert into public.precios (id, grupo, nombre, precio, precio_max, orden) values
('tipo:funcional', 'cinto', 'Cinto funcional', 1000, 1200, 10),
('tipo:decorativo', 'cinto', 'Cinto decorativo', 1250, null, 20),
('hebilla:oval-bronce', 'hebilla', 'Ovalada bronce', 50, null, 30),
('hebilla:redonda-bronce', 'hebilla', 'Redonda bronce', 50, null, 40),
('hebilla:rectangular-dorada', 'hebilla', 'Rectangular dorada', 50, null, 50),
('hebilla:doble-plateada', 'hebilla', 'Doble púa plateada', 50, null, 60),
('hebilla:redonda-plateada-ancha', 'hebilla', 'Redonda plateada ancha', 50, null, 70),
('hebilla:redonda-plateada-fina', 'hebilla', 'Redonda plateada fina', 50, null, 80),
('hebilla:oval-labrada', 'hebilla', 'Ovalada labrada plateada', 50, null, 90),
('hebilla:flor-bronce', 'hebilla', 'Flor bronce', 150, null, 100),
('hebilla:rosa-bronce', 'hebilla', 'Rosa bronce', 150, null, 110),
('hebilla:cuadrada-remaches', 'hebilla', 'Cuadrada con remaches', 150, null, 120),
('hebilla:redonda-guarda', 'hebilla', 'Redonda con guarda', 150, null, 130),
('hebilla:oval-repujada', 'hebilla', 'Ovalada repujada', 150, null, 140),
('union:remaches', 'union', 'Remaches', 50, null, 150),
('union:trenzado', 'union', 'Trenzado', 150, null, 160),
('union:ondulada', 'union', 'Corte ondulado', 50, null, 170),
('union:acordonada', 'union', 'Acordonada', 150, null, 180),
('deco:tachas', 'deco', 'Tachas arriba y abajo', 100, null, 190),
('deco:tachas-medio', 'deco', 'Tachas en el medio', 100, null, 200),
('deco:zigzag', 'deco', 'Tachas en zigzag', 100, null, 210),
('deco:soles', 'deco', 'Soles cosidos', 100, null, 220),
('deco:flecos', 'deco', 'Flecos', 200, null, 230),
('prod:porta-lentes:modelo:sin-tapa', 'pieza', 'Estuche de lentes · Sin tapa', 550, null, 240),
('prod:porta-lentes:modelo:con-tapa', 'pieza', 'Estuche de lentes · Con tapa', 650, null, 250),
('prod:tarjetero', 'pieza', 'Tarjetero', 650, null, 260),
('prod:pulsera:ancho:1-3', 'pieza', 'Pulsera · 1,3 cm', 250, null, 270),
('prod:pulsera:ancho:intermedia', 'pieza', 'Pulsera · 3 cm', 300, null, 280),
('prod:pulsera:ancho:5', 'pieza', 'Pulsera · 5 cm', 350, null, 290),
('prod:collar:ancho:1-3', 'pieza', 'Collar · 1,3 cm', 350, null, 300),
('prod:collar:ancho:grueso', 'pieza', 'Collar · 2,6 cm', 450, null, 310),
('prod:collar:deco:si', 'pieza', 'Collar · Con decoración (se suma)', 50, 100, 320),
('prod:llavero', 'pieza', 'Llavero', 300, null, 330),
('prod:portafuego:tamano:chico', 'pieza', 'Portafuego · Chico', 150, null, 340),
('prod:portafuego:tamano:grande', 'pieza', 'Portafuego · Grande', 200, null, 350)
on conflict (id) do nothing;
