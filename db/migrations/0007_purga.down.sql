/* down · undoes 0007: the daily purge stops existing. What it already purged stays purged — that is
   the one-way part, by design (block base-de-datos §G D-9). The run log moves aside, not dropped. */

begin;

drop function if exists purgar_soltado();

do $$
declare
  destino text := 'descartado_0007_' || to_char(now(), 'YYYYMMDD_HH24MISS');
begin
  execute format('create schema %I', destino);
  execute format('alter table public.purga set schema %I', destino);
end $$;

update migracion set version = -7, aplicada_en = now() where version = 7;   -- «7, undone»: the record stays

commit;
