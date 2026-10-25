-- The purge, attacked. One transaction ending in ROLLBACK: it leaves nothing behind.
--   DB_SCHEMA=dev python db/run.py db/test/0007_purga.sql      → each line says ok or FAIL

begin;

create temp table resultado (caso text, ok boolean);

-- old (31 days) and recent (29 days) let-go things, plus a flower that must survive
insert into idea (texto, soltada_en) values ('s81 vieja', now() - interval '31 days'), ('s81 reciente', now() - interval '29 days');
insert into mision (texto, soltada_en) values ('s81 mision vieja', now() - interval '31 days');
insert into mision (texto, abierta_en, hecha_en) values ('s81 flor vieja', now() - interval '60 days', now() - interval '60 days');
insert into tablero (nombre, soltado_en) values ('s81 tablero viejo', now() - interval '31 days');
insert into item (tablero_id, tipo, archivo) select id, 'imagen', 'lienzo/img/s81-prueba.png' from tablero where nombre = 's81 tablero viejo';
insert into nota (de, para, texto, soltada_en) values ('brian', 'jazz', 's81 nota vieja', now() - interval '31 days');

create temp table borradas as select * from purgar_soltado();

insert into resultado select 'old thought purged', not exists (select 1 from idea where texto = 's81 vieja');
insert into resultado select 'recent thought kept (29 days)', exists (select 1 from idea where texto = 's81 reciente');
insert into resultado select 'old let-go mission purged', not exists (select 1 from mision where texto = 's81 mision vieja');
insert into resultado select 'a flower is never purged', exists (select 1 from mision where texto = 's81 flor vieja');
-- the purge only reaches let-go rows, and the schema refuses to let a flower go (mision_check): that is
-- what keeps her garden whole; the function's own `hecha_en is null` is a second layer no row can reach
do $$ begin
  update mision set soltada_en = now() - interval '31 days' where texto = 's81 flor vieja';
  insert into resultado values ('a flower cannot be let go', false);
exception when check_violation then
  insert into resultado values ('a flower cannot be let go', true);
end $$;
insert into resultado select 'old board and its image purged', not exists (select 1 from tablero where nombre = 's81 tablero viejo');
insert into resultado select 'its image path returned for Blob', exists (select 1 from borradas where archivo = 'lienzo/img/s81-prueba.png');
insert into resultado select 'old note purged', not exists (select 1 from nota where texto = 's81 nota vieja');
insert into resultado select 'the run is logged with counts', exists (select 1 from purga where (filas->>'idea')::int >= 1 and (filas->>'imagenes')::int >= 1);

select case when ok then 'ok   ' else 'FAIL ' end || caso as resultado from resultado;
select count(*) filter (where ok) || ' / ' || count(*) as total from resultado;

rollback;
