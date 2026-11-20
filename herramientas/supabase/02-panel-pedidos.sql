-- Decora.te · Paso 2: panel de pedidos de Julia
-- Pegar entero en Supabase > SQL Editor > New query > Run. Se puede correr más de una vez.

-- 1) Estados: se suma "en producción"
alter table public.pedidos drop constraint if exists pedidos_estado_check;
alter table public.pedidos add constraint pedidos_estado_check
  check (estado in ('nuevo', 'confirmado', 'en_produccion', 'listo', 'entregado', 'cancelado'));

-- 2) Lo que Julia completa en cada pedido
alter table public.pedidos
  add column if not exists precio_final integer check (precio_final >= 0),       -- el precio que se acordó
  add column if not exists cobrado      integer check (cobrado >= 0),            -- cuánto se cobró (todo junto, antes de producir)
  add column if not exists cobrado_el   date,
  add column if not exists cobro_medio  text check (cobro_medio in ('efectivo', 'transferencia', 'otro')),
  add column if not exists entrega      date,                                     -- para cuándo
  add column if not exists notas        text check (char_length(notas) <= 2000),  -- notas internas (el cliente no las ve)
  add column if not exists origen       text not null default 'web'
                                        check (origen in ('web', 'whatsapp', 'instagram', 'en persona', 'otro')),
  add column if not exists actualizado  timestamptz not null default now();

-- los pedidos cargados a mano pueden no tener teléfono
alter table public.pedidos drop constraint if exists pedidos_telefono_check;
alter table public.pedidos add constraint pedidos_telefono_check check (char_length(telefono) <= 30);

-- cada cambio guarda la hora
create or replace function public.pedidos_tocado()
returns trigger language plpgsql set search_path = ''
as $$ begin new.actualizado := now(); return new; end $$;
drop trigger if exists pedidos_tocado on public.pedidos;
create trigger pedidos_tocado before update on public.pedidos for each row execute function public.pedidos_tocado();

-- 3) Julia (y solo ella) también puede cargar pedidos a mano y borrarlos
drop policy if exists "admin carga pedidos" on public.pedidos;
create policy "admin carga pedidos" on public.pedidos for insert to authenticated with check (public.es_admin());
drop policy if exists "admin borra pedidos" on public.pedidos;
create policy "admin borra pedidos" on public.pedidos for delete to authenticated using (public.es_admin());

grant select, insert, update, delete on public.pedidos to authenticated;

-- 4) Para que el panel sepa si quien entró es admin
grant execute on function public.es_admin() to authenticated;
