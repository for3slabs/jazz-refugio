-- 0011 · two boards cannot share a name (Brian, 2026-10-25), ignoring case and outer spaces. Only
-- among the boards she has: one she let go does not block the name, and recovering it while another
-- uses the name is refused with a sentence (lib/db.ts · UNICOS).
-- A slow tap had created two empty «Bra» in the same minute: before the index, every repeated name
-- keeps its OLDEST board and the newer ones are let go — recoverable for 30 days, nothing deleted.
-- Rollback: 0011_tablero_nombre_unico.down.sql.

begin;

update tablero t set soltado_en = now()
where t.soltado_en is null
  and exists (
    select 1 from tablero o
    where o.soltado_en is null and o.id <> t.id
      and lower(btrim(o.nombre)) = lower(btrim(t.nombre))
      and (o.creado, o.id) < (t.creado, t.id)
  );

create unique index if not exists tablero_nombre_unico on tablero (lower(btrim(nombre))) where soltado_en is null;

insert into migracion (version) values (11);

commit;
