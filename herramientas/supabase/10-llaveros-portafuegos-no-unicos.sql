-- Decora.te · paso 10: llaveros y portafuegos tampoco son piezas únicas (como pulseras y collares).
-- Un pedido ya no los reserva: siguen a la venta hasta marcarlos «Agotada» en el panel.
-- Correr una vez en Supabase: SQL Editor > New query > pegar todo > Run.

create or replace function public.crear_pedido(p jsonb)
returns text language plpgsql security definer set search_path = ''
as $$
declare n bigint;
begin
  insert into public.pedidos (nombre, telefono, pago, comentarios, items, total_min, total_max, cliente)
  values (
    trim(p ->> 'nombre'), trim(p ->> 'telefono'), p ->> 'pago',
    nullif(trim(coalesce(p ->> 'comentarios', '')), ''),
    p -> 'items', (p ->> 'total_min')::integer, (p ->> 'total_max')::integer, auth.uid()
  )
  returning id into n;
  update public.stock s set estado = 'reservada', pedido_id = n
  where s.estado = 'disponible' and s.cat not in ('pulseras', 'collares', 'llaveros', 'portafuegos')
    and s.id in (select i ->> 'id' from jsonb_array_elements(p -> 'items') i where i ->> 'tipo' = 'stock');
  return 'DT-' || lpad(n::text, 4, '0');
end $$;
revoke all on function public.crear_pedido(jsonb) from public;
grant execute on function public.crear_pedido(jsonb) to anon, authenticated;

create or replace function public.pedido_mueve_stock()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.estado = 'cancelado' and old.estado <> 'cancelado' then
    update public.stock set estado = 'disponible', pedido_id = null where pedido_id = new.id and estado = 'reservada';
  elsif new.estado = 'entregado' and old.estado <> 'entregado' then
    update public.stock set estado = 'vendida', vendido_el = current_date where pedido_id = new.id;
  elsif old.estado = 'cancelado' and new.estado <> 'cancelado' then
    -- si se des-cancela, las piezas únicas que sigan libres vuelven a reservarse
    update public.stock s set estado = 'reservada', pedido_id = new.id
    where s.estado = 'disponible' and s.cat not in ('pulseras', 'collares', 'llaveros', 'portafuegos')
      and s.id in (select i ->> 'id' from jsonb_array_elements(new.items) i where i ->> 'tipo' = 'stock');
  end if;
  return new;
end $$;

-- los llaveros y portafuegos que hayan quedado reservados por un pedido vuelven a la venta
update public.stock set estado = 'disponible', pedido_id = null where cat in ('llaveros', 'portafuegos') and estado = 'reservada';
