-- 0009 · a goal can say a little more than its name: an optional description, one or two lines
-- (Brian, 2026-10-25: «metas tiene el nombre y para cuándo, a lo mejor descripción»). Editable from
-- the goal's detail, like its name and date.
-- Rollback: 0009_descripcion_meta.down.sql.

begin;

alter table meta add column if not exists descripcion text check (char_length(descripcion) between 1 and 160);

insert into migracion (version) values (9);

commit;
