-- 0013 · how many of her flowers she has already SEEN grow. Opening her garden plants the ones
-- she has not seen yet in front of her — her cat brings them — and then this number catches up,
-- so the animation plays once per flower on any device (Brian, 2026-10-25). It only goes up.
-- Rollback: 0013_flores_vistas.down.sql.

begin;

alter table jardin_inicial add column flores_vistas int not null default 0 check (flores_vistas >= 0);

insert into migracion (version) values (13);

commit;
