-- «doc» and «liga» on a board, attacked. One transaction ending in ROLLBACK: it leaves nothing behind.
--   DB_SCHEMA=dev python db/run.py db/test/0012_doc_y_liga.sql   → each line says ok or FAIL

begin;

create temp table resultado (caso text, ok boolean);

insert into tablero (nombre) values ('s83 prueba 0012');
create temp table t as select id from tablero where nombre = 's83 prueba 0012';

insert into item (tablero_id, tipo, archivo, nombre, mime, bytes)
select id, 'doc', 'lienzo-dev/doc/x.pdf', 'brief.pdf', 'application/pdf', 1234 from t;
insert into resultado select 'a doc keeps its file, name and type', exists (select 1 from item where tipo = 'doc' and nombre = 'brief.pdf');

insert into item (tablero_id, tipo, url, url_titulo, url_sitio)
select id, 'enlace', 'https://www.pinterest.com/', 'Pinterest', 'pinterest.com' from t;
insert into resultado select 'a liga keeps its address and preview', exists (select 1 from item where tipo = 'enlace' and url_sitio = 'pinterest.com');

do $$
begin
  insert into item (tablero_id, tipo, archivo) select id, 'doc', 'lienzo-dev/doc/y.bin' from t;
  insert into resultado values ('a doc without a name is refused', false);
exception when check_violation then
  insert into resultado values ('a doc without a name is refused', true);
end $$;

do $$
begin
  insert into item (tablero_id, tipo, url) select id, 'enlace', 'javascript:alert(1)' from t;
  insert into resultado values ('a non-http liga is refused', false);
exception when check_violation then
  insert into resultado values ('a non-http liga is refused', true);
end $$;

do $$
begin
  insert into item (tablero_id, tipo, archivo, nombre, bytes) select id, 'doc', 'lienzo-dev/doc/z.zip', 'grande.zip', 10485761 from t;
  insert into resultado values ('a doc over 10 MB is refused', false);
exception when check_violation then
  insert into resultado values ('a doc over 10 MB is refused', true);
end $$;

do $$
begin
  insert into item (tablero_id, tipo, color, url) select id, 'color', '#9d4edd', 'https://a.com' from t;
  insert into resultado values ('a color cannot carry a liga', false);
exception when check_violation then
  insert into resultado values ('a color cannot carry a liga', true);
end $$;

do $$
begin
  update tablero set portada_item_id = (select id from item where tipo = 'doc' and nombre = 'brief.pdf') where nombre = 's83 prueba 0012';
  insert into resultado values ('a doc cannot be the cover', false);
exception when check_violation then
  insert into resultado values ('a doc cannot be the cover', true);
end $$;

with x as (insert into item (tablero_id, tipo, archivo, ancho, alto) select id, 'imagen', 'lienzo-dev/img/a.webp', 10, 10 from t returning 1)
insert into resultado select 'an image still goes in as before', exists (select 1 from x);

select case when ok then 'ok   ' else 'FAIL ' end || caso as resultado from resultado;
select count(*) filter (where ok) || ' / ' || count(*) as total from resultado;

rollback;
