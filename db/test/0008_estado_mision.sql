-- Mission states, attacked. One transaction ending in ROLLBACK: it leaves nothing behind.
--   DB_SCHEMA=dev python db/run.py db/test/0008_estado_mision.sql   → each line says ok or FAIL
-- The updates are the app's own (src/lib/misiones.ts · marcarEstadoMision).

begin;

create temp table resultado (caso text, ok boolean);

-- room under the limit of 3: whatever is open in this schema is let go, inside this transaction only
update mision set soltada_en = now() where hecha_en is null and soltada_en is null;
insert into mision (texto) values ('s83 prueba estado');

-- «haciendo» starts the clock
update mision set estado = 'haciendo',
  empezada_en = case when 'haciendo'::text = 'haciendo' then coalesce(empezada_en, now() - interval '10 minutes') else empezada_en end
  where texto = 's83 prueba estado' and hecha_en is null and soltada_en is null;
insert into resultado select '«haciendo» starts the clock', exists (select 1 from mision where texto = 's83 prueba estado' and estado = 'haciendo' and empezada_en is not null);

-- «atorada» and back to «haciendo» never move the clock
create temp table reloj as select empezada_en from mision where texto = 's83 prueba estado';
update mision set estado = 'atorada' where texto = 's83 prueba estado';
update mision set estado = 'haciendo', empezada_en = coalesce(empezada_en, now()) where texto = 's83 prueba estado';
insert into resultado select 'the clock keeps its first start', (select empezada_en from mision where texto = 's83 prueba estado') = (select empezada_en from reloj);

-- clearing the state keeps the clock too
update mision set estado = null where texto = 's83 prueba estado';
insert into resultado select 'clearing the state keeps the start', exists (select 1 from mision where texto = 's83 prueba estado' and estado is null and empezada_en is not null);

-- a state that does not exist is refused by the database itself
do $$
begin
  update mision set estado = 'perdida' where texto = 's83 prueba estado';
  insert into resultado values ('an unknown state is refused', false);
exception when check_violation then
  insert into resultado values ('an unknown state is refused', true);
end $$;

-- a completed mission no longer takes a state (the app's where clause)
update mision set hecha_en = now() where texto = 's83 prueba estado';
with m as (update mision set estado = 'atorada' where texto = 's83 prueba estado' and hecha_en is null and soltada_en is null returning id)
insert into resultado select 'a done mission takes no state', not exists (select 1 from m);
insert into resultado select 'its duration can be read', (select hecha_en - empezada_en from mision where texto = 's83 prueba estado') >= interval '9 minutes';

select case when ok then 'ok   ' else 'FAIL ' end || caso as resultado from resultado;
select count(*) filter (where ok) || ' / ' || count(*) as total from resultado;

rollback;
