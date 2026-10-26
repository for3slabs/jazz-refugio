-- 0014 · a trip gets real dates and a link (Brian, 2026-10-25: «fechas que sea con calendario…
-- a lo mejor URL como opcional»): `desde`/`hasta` picked from a calendar, `enlace` to a place or a
-- booking. All optional; the old free-text `cuando` stays for the trips she already wrote.
-- Rollback: 0014_viaje_fechas.down.sql.

begin;

alter table viaje
  add column desde  date,
  add column hasta  date,
  add column enlace text not null default '' check (char_length(enlace) <= 500),
  add constraint viaje_fechas_en_orden check (desde is null or hasta is null or hasta >= desde);

insert into migracion (version) values (14);

commit;
