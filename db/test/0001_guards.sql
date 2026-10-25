-- Every guard of 0001, attacked. One transaction ending in ROLLBACK: it leaves nothing behind.
--   python db/run.py db/test/0001_guards.sql      → each line says ok or FAIL

begin;

create temp table resultado (caso text, ok boolean);
\o /dev/null

create function pg_temp.debe_fallar(caso text, sql text) returns void language plpgsql as $$
begin
  begin
    execute sql;
    insert into resultado values (caso, false);          -- it went through: the guard is missing
  exception when others then
    insert into resultado values (caso, true);
  end;
end $$;

-- legit data first: if this fails, the schema rejects her normal day
insert into mascota (nombre) values ('michi');
insert into inventario (objeto_id, origen) values ('mono', 'inicio');
insert into puesto select id, 'cuello', 'mono' from mascota;
insert into meta (titulo) values ('portafolio');
insert into paso (meta_id, texto) select id, 'elegir 3 piezas' from meta;
insert into mision (texto, paso_id) select 'elegir 3 piezas', id from paso;
insert into mision (texto) values ('agua'), ('caminar');
insert into respuesta (dia, persona, texto) values (current_date, 'jazz', 'hola');
insert into nota (de, para, texto) values ('brian', 'jazz', 'te leo');
insert into tablero (nombre) values ('ideas');
insert into item (tablero_id, tipo, color) select id, 'color', '#b06ab3' from tablero;
insert into item (tablero_id, tipo, archivo) select id, 'imagen', 'lienzo/img/x.png' from tablero;

select pg_temp.debe_fallar('4th open mission', $q$ insert into mision (texto) values ('una más') $q$);
select pg_temp.debe_fallar('wear an object she lacks', $q$ insert into puesto select id, 'cabeza', 'sombrero' from mascota $q$);
insert into inventario (objeto_id, origen) values ('mandil', 'regalo');
select pg_temp.debe_fallar('wear it on the wrong part', $q$ insert into puesto select id, 'cabeza', 'mandil' from mascota $q$);
select pg_temp.debe_fallar('two objects on one part', $q$ insert into puesto select id, 'cuello', 'mono' from mascota $q$);
select pg_temp.debe_fallar('answer twice the same day', $q$ insert into respuesta (dia, persona, texto) values (current_date, 'jazz', 'otra') $q$);
select pg_temp.debe_fallar('a gift to oneself', $q$ insert into regalo (de, para, tipo, titulo, texto) values ('jazz', 'jazz', 'carta', 't', 'x') $q$);
select pg_temp.debe_fallar('a gift for Brian that waits for flowers', $q$ insert into regalo (de, para, tipo, titulo, texto, se_abre_con_flores) values ('jazz', 'brian', 'carta', 't', 'x', 3) $q$);
select pg_temp.debe_fallar('use a letter like a coupon', $q$ insert into regalo (de, para, tipo, titulo, texto, abierto_en, usado_en) values ('brian', 'jazz', 'carta', 't', 'x', now(), now()) $q$);
select pg_temp.debe_fallar('«seen» by the one who wrote it', $q$ insert into lectura (nota_id, persona) select id, 'brian' from nota $q$);
select pg_temp.debe_fallar('a colour as the cover', $q$ update tablero set portada_item_id = (select id from item where tipo = 'color') $q$);
insert into tablero (nombre) values ('otro');
select pg_temp.debe_fallar('a cover from another board', $q$ update tablero set portada_item_id = (select id from item where tipo = 'imagen') where nombre = 'otro' $q$);
insert into resultado select 'that attempt touched a row', count(*) = 1 from tablero where nombre = 'otro';
select pg_temp.debe_fallar('an image with no file', $q$ insert into item (tablero_id, tipo) select id, 'imagen' from tablero limit 1 $q$);
select pg_temp.debe_fallar('a mood that does not exist', $q$ insert into estado_actual (modo) values ('feliz') $q$);
select pg_temp.debe_fallar('a mood history (second row)', $q$ insert into estado_actual (persona, modo) values ('brian', 'conectada') $q$);
select pg_temp.debe_fallar('a mission of 81 characters', $q$ insert into mision (texto, soltada_en) values (repeat('a', 81), now()) $q$);

-- letting one go frees a place; undoing it past the limit is refused
update mision set soltada_en = now() where texto = 'agua';
insert into mision (texto) values ('leer');
select pg_temp.debe_fallar('undo a let-go into a full day', $q$ update mision set soltada_en = null where texto = 'agua' $q$);

-- a step in today cannot be carried by two open missions
update mision set soltada_en = now() where texto = 'leer';
select pg_temp.debe_fallar('one step, two open missions', $q$ insert into mision (texto, paso_id) select 'otra vez', id from paso $q$);

-- completing the mission completes its step, in the same transaction
update mision set hecha_en = now() where paso_id is not null;
insert into resultado select 'the step follows its mission', hecho_en is not null from paso;
insert into resultado select 'the garden counts the flower', flores = 1 from jardin;

-- the helpers' cap: 20 a day
insert into uso_ayudante (persona) select 'jazz' from generate_series(1, 20);
select pg_temp.debe_fallar('a 21st helper use today', $q$ insert into uso_ayudante (persona) values ('jazz') $q$);

-- the cover can be her image
update tablero set portada_item_id = (select id from item where tipo = 'imagen') where nombre = 'ideas';
insert into resultado select 'an image as the cover', portada_item_id is not null from tablero where nombre = 'ideas';

\o
select case when ok then 'ok   ' else 'FAIL ' end || caso as resultado from resultado;
select count(*) filter (where ok) || ' / ' || count(*) as total from resultado;

rollback;
