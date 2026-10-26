-- 0016 · the 30-day purge reaches her wishes too: a wish she let go (`deseo.soltado_en`, 0015) is
-- deleted for real after 30 days, like everything else she lets go. The function is 0007's, copied
-- whole (0007 is its only definition — measured), with one more table at the end.
-- Applying this file deletes nothing: the daily cron calls the function.
-- Rollback: 0016_purga_deseos.down.sql (puts 0007's function back).

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
  delete from deseo where soltado_en < corte;                            -- her wishes she let go (0015)
  get diagnostics c = row_count; n := n || jsonb_build_object('deseo', c);

  insert into purga (filas) values (n || jsonb_build_object('imagenes', cardinality(archivos)));
  return query select unnest(archivos);
end $$;

insert into migracion (version) values (16);

commit;
