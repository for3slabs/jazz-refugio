-- Unique board names, attacked. One transaction ending in ROLLBACK: it leaves nothing behind.
--   DB_SCHEMA=dev python db/run.py db/test/0011_tablero_nombre_unico.sql   → each line says ok or FAIL

begin;

create temp table resultado (caso text, ok boolean);

update tablero set soltado_en = now() where soltado_en is null;   -- a clean slate, this transaction only

insert into tablero (nombre) values ('s83 Sala');
insert into resultado select 'a first board takes the name', exists (select 1 from tablero where nombre = 's83 Sala' and soltado_en is null);

do $$
begin
  insert into tablero (nombre) values ('  s83 sala ');
  insert into resultado values ('the same name (other case, spaces) is refused', false);
exception when unique_violation then
  insert into resultado values ('the same name (other case, spaces) is refused', true);
end $$;

do $$
begin
  insert into tablero (nombre) values ('s83 Otra');
  update tablero set nombre = 'S83 SALA' where nombre = 's83 Otra';
  insert into resultado values ('renaming onto a used name is refused', false);
exception when unique_violation then
  insert into resultado values ('renaming onto a used name is refused', true);
end $$;

update tablero set soltado_en = now() where nombre = 's83 Sala';
insert into tablero (nombre) values ('s83 Sala');
insert into resultado select 'a let-go board frees its name', (select count(*) from tablero where nombre = 's83 Sala') = 2;

do $$
begin
  update tablero set soltado_en = null where nombre = 's83 Sala' and soltado_en is not null;
  insert into resultado values ('recovering onto a used name is refused', false);
exception when unique_violation then
  insert into resultado values ('recovering onto a used name is refused', true);
end $$;

insert into resultado select 'the refusal names its index', exists (
  select 1 from pg_indexes where indexname = 'tablero_nombre_unico' and schemaname = current_schema());

select case when ok then 'ok   ' else 'FAIL ' end || caso as resultado from resultado;
select count(*) filter (where ok) || ' / ' || count(*) as total from resultado;

rollback;
