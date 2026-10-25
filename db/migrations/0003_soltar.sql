-- 0003 · the app never deletes a row (the critical gate refused a DELETE in estado.ts, rightly):
--   · a body part can be empty — taking an object off leaves the row, with nothing on it
--   · a goal step and a canvas item can be let go (`soltado_en`), like everything else
--   · the step and item limits stop counting what was let go
-- limites() is copied from 0001, the last migration that defined it; only those two counts change.
-- Rollback: 0003_soltar.down.sql.

begin;

alter table puesto alter column objeto_id drop not null;
alter table paso add column soltado_en timestamptz;
alter table item add column soltado_en timestamptz;

create or replace function limites() returns trigger language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtext(tg_table_name));
  case tg_table_name
    when 'mision' then
      if new.hecha_en is null and new.soltada_en is null then
        perform limite('mision', (select count(*) from mision where hecha_en is null and soltada_en is null), 3,
          'Ya tienes 3 misiones para hoy.');
      end if;
    when 'meta' then
      perform limite('meta', (select count(*) from meta m where m.soltada_en is null
        and not (exists (select 1 from paso p where p.meta_id = m.id)
                 and not exists (select 1 from paso p where p.meta_id = m.id and p.hecho_en is null))), 5,
        'Ya tienes 5 metas. Termina o suelta una primero.');
    when 'paso' then
      perform limite('paso', (select count(*) from paso where meta_id = new.meta_id and soltado_en is null), 12,
        'Una meta tiene hasta 12 pasos.');
    when 'idea' then
      perform limite('idea', (select count(*) from idea where soltada_en is null and paso_a is null), 40,
        'Ya hay 40 cosas en tu mente. Suelta alguna primero.');
    when 'tablero' then
      perform limite('tablero', (select count(*) from tablero where soltado_en is null), 12,
        'Tienes 12 tableros. Borra uno primero.');
    when 'item' then
      perform limite('item', (select count(*) from item where tablero_id = new.tablero_id and soltado_en is null), 60,
        'Un tablero guarda hasta 60 cosas.');
    when 'libro' then
      perform limite('libro', (select count(*) from libro where de = new.de and soltado_en is null), 300,
        'Esa lista ya tiene 300.');
    when 'aprendizaje' then
      perform limite('aprendizaje', (select count(*) from aprendizaje where de = new.de and soltado_en is null), 300,
        'Esa lista ya tiene 300.');
    when 'viaje' then
      perform limite('viaje', (select count(*) from viaje where de = new.de and soltado_en is null), 300,
        'Esa lista ya tiene 300.');
    when 'uso_ayudante' then
      perform limite('uso_ayudante', (select count(*) from uso_ayudante
        where persona = new.persona
          and (en at time zone 'America/Mexico_City')::date = (now() at time zone 'America/Mexico_City')::date), 20,
        'Por hoy ya pediste bastante ayuda. Mañana seguimos.');
  end case;
  return new;
end $$;

insert into migracion (version) values (3);

commit;
