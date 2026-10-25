/* down · undoes 0003 without destroying anything: limites() goes back to 0001's body. The new
   columns stay (nullable; dropping them would lose what was let go), and a puesto left empty keeps
   its empty row. */

begin;

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
      perform limite('paso', (select count(*) from paso where meta_id = new.meta_id), 12,
        'Una meta tiene hasta 12 pasos.');
    when 'idea' then
      perform limite('idea', (select count(*) from idea where soltada_en is null and paso_a is null), 40,
        'Ya hay 40 cosas en tu mente. Suelta alguna primero.');
    when 'tablero' then
      perform limite('tablero', (select count(*) from tablero where soltado_en is null), 12,
        'Tienes 12 tableros. Borra uno primero.');
    when 'item' then
      perform limite('item', (select count(*) from item where tablero_id = new.tablero_id), 60,
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

update migracion set version = -3, aplicada_en = now() where version = 3;   -- «3, undone»: the record stays

commit;
