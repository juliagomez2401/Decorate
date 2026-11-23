-- Decora.te · paso 7: el talle del stock acepta letras (pulseras XS a XL)
-- Los cintos siguen con su número (85, 90, 95...), guardado como texto.
-- Correr una vez en Supabase: SQL Editor > New query > pegar todo > Run.

alter table public.stock alter column talle type text using talle::text;

comment on column public.stock.talle is 'Cintos: de a 5 cm (85, 90...). Pulseras: XS, S, M, L o XL (contorno de muñeca).';
