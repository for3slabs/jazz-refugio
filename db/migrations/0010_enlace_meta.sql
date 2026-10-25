-- 0010 · a goal can pin one link, and keep the page's preview read when she saved it (its image,
-- title and site) so the thumbnail never has to be fetched again (Brian, 2026-10-25: «una URL…
-- que se pueda ver una miniatura»). Only http(s); the preview fields are what the page declared.
-- Rollback: 0010_enlace_meta.down.sql.

begin;

alter table meta add column if not exists url text check (char_length(url) <= 500 and url ~ '^https?://');
alter table meta add column if not exists url_titulo text check (char_length(url_titulo) <= 200);
alter table meta add column if not exists url_imagen text check (char_length(url_imagen) <= 1000 and url_imagen ~ '^https?://');
alter table meta add column if not exists url_sitio text check (char_length(url_sitio) <= 100);

insert into migracion (version) values (10);

commit;
