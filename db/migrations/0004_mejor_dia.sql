-- 0004 · her best day survives the move. Blob kept it as a number while the missions behind it
-- were deleted after 2 days, so it cannot be recomputed from rows: it is carried once, like
-- `jardin_inicial.flores`, and the app takes the greater of it and what the rows say.
-- Rollback: 0004_mejor_dia.down.sql.

begin;

alter table jardin_inicial add column mejor_dia int not null default 0 check (mejor_dia >= 0);

insert into migracion (version) values (4);

commit;
