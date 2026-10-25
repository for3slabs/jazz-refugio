-- 0006 · «ya se lo regalé»: a wish (a book, a trip) the other one already gave. Seen only by the
-- one who gave it — the owner's own views never read it, so the surprise holds (ESQUEMA.md el. 7).
-- Rollback: 0006_regalado.down.sql.

begin;

alter table libro add column regalado_en timestamptz;
alter table viaje add column regalado_en timestamptz;

insert into migracion (version) values (6);

commit;
