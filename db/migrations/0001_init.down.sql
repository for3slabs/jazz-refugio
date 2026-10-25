/* down · undoes 0001_init.sql WITHOUT destroying anything: every table, view, function and type
   moves to a schema named `descartado_<when>`, data included. `public` is left clean, so 0001 can
   run again; the moved copy is dropped by hand only when Brian says so. */

begin;

do $$
declare
  destino text := 'descartado_' || to_char(now(), 'YYYYMMDD_HH24MISS');
  t text;
begin
  execute format('create schema %I', destino);
  execute format('alter view public.jardin set schema %I', destino);
  foreach t in array array['migracion', 'uso_ayudante', 'viaje', 'aprendizaje', 'libro', 'presencia',
    'respuesta', 'lectura', 'nota', 'regalo', 'item', 'tablero', 'jardin_inicial', 'mision', 'paso',
    'meta', 'idea', 'estado_actual', 'puesto', 'mascota', 'inventario', 'objeto'] loop
    execute format('alter table public.%I set schema %I', t, destino);
  end loop;
  foreach t in array array['limites()', 'limite(text, bigint, integer, text)', 'mision_cumple_paso()',
    'portada_es_imagen()'] loop
    execute format('alter function public.%s set schema %I', t, destino);
  end loop;
  foreach t in array array['estado_viaje', 'estado_libro', 'tipo_regalo', 'tipo_item', 'modo',
    'categoria', 'persona'] loop
    execute format('alter type public.%I set schema %I', t, destino);
  end loop;
end $$;

commit;
