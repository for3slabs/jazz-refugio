-- 0012 · two new things a board can hold (Brian, 2026-10-25): «doc» — any file, up to 10 MB, kept
-- private in Blob like her images, with its name and type — and «liga» — any web address, with the
-- preview its page declared (image, title, site), read once when she adds it.
-- Rollback: 0012_doc_y_liga.down.sql.

-- A new enum value cannot be used in the transaction that adds it: these two go first, on their own.
alter type tipo_item add value if not exists 'doc';
alter type tipo_item add value if not exists 'enlace';

begin;

alter table item add column if not exists nombre text check (char_length(nombre) between 1 and 200);
alter table item add column if not exists mime text check (char_length(mime) <= 120);
alter table item add column if not exists bytes int check (bytes > 0 and bytes <= 10485760);
alter table item add column if not exists url text check (char_length(url) <= 500 and url ~ '^https?://');
alter table item add column if not exists url_titulo text check (char_length(url_titulo) <= 200);
alter table item add column if not exists url_imagen text check (char_length(url_imagen) <= 1000 and url_imagen ~ '^https?://');
alter table item add column if not exists url_sitio text check (char_length(url_sitio) <= 100);

-- what each kind must carry, and nothing of the others'
alter table item drop constraint if exists item_check;
alter table item add constraint item_check check (
  (tipo in ('imagen', 'dibujo') and archivo is not null and color is null and texto is null and url is null) or
  (tipo = 'color' and color is not null and archivo is null and texto is null and url is null) or
  (tipo = 'nota' and texto is not null and archivo is null and color is null and url is null) or
  (tipo = 'doc' and archivo is not null and nombre is not null and color is null and texto is null and url is null) or
  (tipo = 'enlace' and url is not null and archivo is null and color is null and texto is null)
);

insert into migracion (version) values (12);

commit;
