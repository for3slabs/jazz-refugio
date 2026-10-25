-- 0008 · how a mission is going: «haciendo» or «atorada», marked by her on the row; null is just
-- waiting. `empezada_en` is the first time she marked it «haciendo» — the history shows how long it
-- took (hecha_en − empezada_en). Brian, 2026-10-25: «cada tarea debe tener estados… y tiempo».
-- Rollback: 0008_estado_mision.down.sql.

begin;

alter table mision add column if not exists estado text check (estado in ('haciendo', 'atorada'));
alter table mision add column if not exists empezada_en timestamptz;

insert into migracion (version) values (8);

commit;
