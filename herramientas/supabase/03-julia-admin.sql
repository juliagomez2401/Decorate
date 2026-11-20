-- Decora.te · Paso 3: quiénes administran el panel (Julia y Santiago)
-- Antes: en Supabase > Authentication > Users > "Add user" > "Send invitation", una vez por cada mail
-- (a cada uno le llega un mail y elige su propia contraseña; nadie más la sabe).
-- Después: poner los dos mails abajo y correr esto en SQL Editor. Se puede correr de nuevo para sumar a alguien más.

insert into public.admins (user_id)
select id from auth.users
where email in ('MAIL-DE-JULIA@ejemplo.com', 'MAIL-DE-SANTIAGO@ejemplo.com')
on conflict do nothing;

-- Para comprobar: tienen que aparecer los dos mails
select u.email from public.admins a join auth.users u on u.id = a.user_id;

-- Para sacarle el acceso a alguien (cambiar el mail y correr solo esta línea):
-- delete from public.admins where user_id = (select id from auth.users where email = 'MAIL@ejemplo.com');
