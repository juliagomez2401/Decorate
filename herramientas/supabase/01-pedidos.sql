-- Decora.te · Paso 1: pedidos automáticos
-- Pegar entero en Supabase > SQL Editor > New query > Run. Se puede correr una sola vez.

-- Quiénes administran (Julia). Se carga en el paso del panel.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.es_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- Pedidos
create table if not exists public.pedidos (
  id          bigint generated always as identity primary key,
  creado      timestamptz not null default now(),
  estado      text not null default 'nuevo'
              check (estado in ('nuevo', 'confirmado', 'listo', 'entregado', 'cancelado')),
  nombre      text not null check (char_length(nombre) between 1 and 80),
  telefono    text not null check (char_length(telefono) between 6 and 30),
  pago        text not null check (pago in ('efectivo', 'transferencia')),
  comentarios text check (char_length(comentarios) <= 1000),
  items       jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 30),
  total_min   integer not null check (total_min >= 0),
  total_max   integer not null check (total_max >= total_min),
  cliente     uuid references auth.users (id) on delete set null
);
alter table public.pedidos enable row level security;

-- Nadie de afuera puede leer ni tocar pedidos; solo la admin (y cada cliente los suyos, para más adelante).
drop policy if exists "admin lee pedidos" on public.pedidos;
create policy "admin lee pedidos" on public.pedidos for select to authenticated using (public.es_admin());
drop policy if exists "admin cambia pedidos" on public.pedidos;
create policy "admin cambia pedidos" on public.pedidos for update to authenticated using (public.es_admin()) with check (public.es_admin());
drop policy if exists "cliente ve los suyos" on public.pedidos;
create policy "cliente ve los suyos" on public.pedidos for select to authenticated using (cliente = auth.uid());

-- La web crea pedidos solo por esta función: valida los datos y devuelve el número (DT-0001).
create or replace function public.crear_pedido(p jsonb)
returns text language plpgsql security definer set search_path = ''
as $$
declare n bigint;
begin
  insert into public.pedidos (nombre, telefono, pago, comentarios, items, total_min, total_max, cliente)
  values (
    trim(p ->> 'nombre'),
    trim(p ->> 'telefono'),
    p ->> 'pago',
    nullif(trim(coalesce(p ->> 'comentarios', '')), ''),
    p -> 'items',
    (p ->> 'total_min')::integer,
    (p ->> 'total_max')::integer,
    auth.uid()
  )
  returning id into n;
  return 'DT-' || lpad(n::text, 4, '0');
end $$;
revoke all on function public.crear_pedido(jsonb) from public;
grant execute on function public.crear_pedido(jsonb) to anon, authenticated;

-- Fotos 3D de los armados: carpeta pública (se ven solo con el link exacto, no se pueden listar).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pedidos', 'pedidos', true, 400000, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "web sube fotos de pedidos" on storage.objects;
create policy "web sube fotos de pedidos" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'pedidos');
