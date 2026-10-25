-- A goal's description, attacked. One transaction ending in ROLLBACK: it leaves nothing behind.
--   DB_SCHEMA=dev python db/run.py db/test/0009_descripcion_meta.sql   → each line says ok or FAIL
-- The writes are the app's own (src/lib/pendientes.ts · nuevaMeta, editarMeta).

begin;

create temp table resultado (caso text, ok boolean);

-- room under the limit of goals: whatever is open in this schema is let go, inside this transaction only
update meta set soltada_en = now() where soltada_en is null;

insert into meta (titulo, para, descripcion) values ('s83 meta', null, 'con Ana, algo de miedo');
insert into resultado select 'a goal keeps its description', exists (select 1 from meta where titulo = 's83 meta' and descripcion = 'con Ana, algo de miedo');

insert into meta (titulo) values ('s83 sin descripcion');
insert into resultado select 'the description is optional', exists (select 1 from meta where titulo = 's83 sin descripcion' and descripcion is null);

update meta set titulo = 's83 meta editada', descripcion = null, para = '2026-11-01' where titulo = 's83 meta' and soltada_en is null;
insert into resultado select 'editing changes name, date and clears the description',
  exists (select 1 from meta where titulo = 's83 meta editada' and descripcion is null and para = '2026-11-01');

do $$
begin
  update meta set descripcion = repeat('x', 161) where titulo = 's83 meta editada';
  insert into resultado values ('a description over 160 is refused', false);
exception when check_violation then
  insert into resultado values ('a description over 160 is refused', true);
end $$;

do $$
begin
  update meta set descripcion = '' where titulo = 's83 meta editada';
  insert into resultado values ('an empty description is refused (null means none)', false);
exception when check_violation then
  insert into resultado values ('an empty description is refused (null means none)', true);
end $$;

select case when ok then 'ok   ' else 'FAIL ' end || caso as resultado from resultado;
select count(*) filter (where ok) || ' / ' || count(*) as total from resultado;

rollback;
