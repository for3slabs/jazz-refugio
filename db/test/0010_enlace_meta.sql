-- A goal's link, attacked. One transaction ending in ROLLBACK: it leaves nothing behind.
--   DB_SCHEMA=dev python db/run.py db/test/0010_enlace_meta.sql   → each line says ok or FAIL

begin;

create temp table resultado (caso text, ok boolean);

update meta set soltada_en = now() where soltada_en is null;   -- room under the limit, this transaction only

insert into meta (titulo, url, url_titulo, url_imagen, url_sitio)
values ('s83 con enlace', 'https://www.figma.com/community', 'Figma', 'https://cdn.figma.com/x.png', 'Figma');
insert into resultado select 'a goal keeps its link and preview', exists (select 1 from meta where titulo = 's83 con enlace' and url_imagen is not null);

insert into meta (titulo, url) values ('s83 sin vista', 'https://www.behance.net/');
insert into resultado select 'a link without a preview is fine', exists (select 1 from meta where titulo = 's83 sin vista' and url_titulo is null);

do $$
begin
  insert into meta (titulo, url) values ('s83 mala', 'javascript:alert(1)');
  insert into resultado values ('a non-http link is refused', false);
exception when check_violation then
  insert into resultado values ('a non-http link is refused', true);
end $$;

do $$
begin
  insert into meta (titulo, url, url_imagen) values ('s83 imagen mala', 'https://a.com', 'data:image/png;base64,AAAA');
  insert into resultado values ('a non-http image is refused', false);
exception when check_violation then
  insert into resultado values ('a non-http image is refused', true);
end $$;

do $$
begin
  insert into meta (titulo, url) values ('s83 larga', 'https://a.com/' || repeat('x', 500));
  insert into resultado values ('a link over 500 is refused', false);
exception when check_violation then
  insert into resultado values ('a link over 500 is refused', true);
end $$;

select case when ok then 'ok   ' else 'FAIL ' end || caso as resultado from resultado;
select count(*) filter (where ok) || ' / ' || count(*) as total from resultado;

rollback;
