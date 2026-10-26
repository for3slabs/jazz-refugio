/* down · undoes 0016: the purge goes back to 0007's function, which does not touch `deseo`. */

begin;

-- Returns the Blob paths of the images it removed, so the caller deletes those files too.
create or replace function purgar_soltado() returns table (archivo text) language plpgsql as $$
declare
  corte timestamptz := now() - interval '30 days';
  archivos text[];
  n jsonb := '{}';
  c int;
begin
  select coalesce(array_agg(i.archivo), '{}') into archivos
  from item i join tablero t on t.id = i.tablero_id
  where i.archivo is not null and (i.soltado_en < corte or t.soltado_en < corte);

  delete from item where soltado_en < corte or tablero_id in (select id from tablero where soltado_en < corte);
  get diagnostics c = row_count; n := n || jsonb_build_object('item', c);
  delete from tablero where soltado_en < corte;
  get diagnostics c = row_count; n := n || jsonb_build_object('tablero', c);
  delete from mision where soltada_en < corte and hecha_en is null;      -- a flower is never purged
  get diagnostics c = row_count; n := n || jsonb_build_object('mision', c);
  delete from paso where soltado_en < corte;
  get diagnostics c = row_count; n := n || jsonb_build_object('paso', c);
  delete from meta where soltada_en < corte;                             -- its steps go with it
  get diagnostics c = row_count; n := n || jsonb_build_object('meta', c);
  delete from idea where soltada_en < corte;
  get diagnostics c = row_count; n := n || jsonb_build_object('idea', c);
  delete from nota where soltada_en < corte;                             -- its «seen» go with it
  get diagnostics c = row_count; n := n || jsonb_build_object('nota', c);
  delete from regalo where soltado_en < corte;
  get diagnostics c = row_count; n := n || jsonb_build_object('regalo', c);
  delete from libro where soltado_en < corte;
  get diagnostics c = row_count; n := n || jsonb_build_object('libro', c);
  delete from aprendizaje where soltado_en < corte;
  get diagnostics c = row_count; n := n || jsonb_build_object('aprendizaje', c);
  delete from viaje where soltado_en < corte;
  get diagnostics c = row_count; n := n || jsonb_build_object('viaje', c);

  insert into purga (filas) values (n || jsonb_build_object('imagenes', cardinality(archivos)));
  return query select unnest(archivos);
end $$;

update migracion set version = -16, aplicada_en = now() where version = 16;   -- «16, undone»: the record stays

commit;
