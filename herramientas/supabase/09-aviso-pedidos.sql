-- Decora.te · paso 9: cuando entra un pedido por la web, te llega una notificación al celular que dice «Pedido nuevo».
-- Usa ntfy (app gratis, sin cuenta). El aviso no lleva ningún dato del cliente: eso se ve en el panel.
-- El nombre de tu canal se guarda solo en Supabase, en una tabla que la web no puede leer.
-- Nunca escribas el nombre del canal en este archivo: va en el paso B, directo en Supabase.
--
-- Paso A (una vez): pegar todo este archivo en Supabase > SQL Editor > New query > Run.
--
-- Paso B (una vez): en otra consulta, poné el nombre de tu canal donde dice CANAL y corré:
--   insert into public.avisos (id, ntfy_tema) values (1, 'CANAL')
--   on conflict (id) do update set ntfy_tema = excluded.ntfy_tema;
--
-- Para probar (te tiene que llegar la notificación):
--   select net.http_post('https://ntfy.sh/', jsonb_build_object('topic', ntfy_tema, 'title', 'Decora.te', 'message', 'Prueba del aviso')) from public.avisos;
--
-- Para apagar los avisos: delete from public.avisos;

create extension if not exists pg_net;

drop table if exists public.avisos;   -- (por si quedó la versión anterior, con WhatsApp)
create table public.avisos (
  id        integer primary key default 1 check (id = 1),
  ntfy_tema text not null   -- el nombre del canal al que te suscribiste en la app ntfy
);
alter table public.avisos enable row level security;   -- sin reglas: nadie la lee desde la web ni desde el panel
revoke all on public.avisos from anon, authenticated;

create or replace function public.avisar_pedido()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare tema text;
begin
  select ntfy_tema into tema from public.avisos where id = 1;
  if tema is null then return new; end if;
  perform net.http_post(
    url := 'https://ntfy.sh/',
    body := jsonb_build_object('topic', tema, 'title', 'Decora.te', 'message', 'Pedido nuevo', 'click', 'https://admin.decorate.com.uy', 'priority', 4),
    timeout_milliseconds := 10000
  );
  return new;
exception when others then
  return new;   -- si el aviso falla, el pedido se guarda igual
end $$;

drop trigger if exists avisar_pedido on public.pedidos;
create trigger avisar_pedido after insert on public.pedidos
  for each row when (new.origen = 'web') execute function public.avisar_pedido();
