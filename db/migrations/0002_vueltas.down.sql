/* down · undoes 0002 without destroying anything: `momento` moves to its own schema with its rows,
   the garden view goes back to 0001's. The two size columns of `item` stay — nullable, unused by
   0001, and removing them would lose the sizes. */

begin;

create or replace view jardin as
  select (select count(*) from mision where hecha_en is not null)
       + coalesce((select flores from jardin_inicial where persona = 'jazz'), 0) as flores;

do $$
declare
  destino text := 'descartado_0002_' || to_char(now(), 'YYYYMMDD_HH24MISS');
begin
  execute format('create schema %I', destino);
  execute format('alter table public.momento set schema %I', destino);
end $$;

update migracion set version = -2, aplicada_en = now() where version = 2;   -- «2, undone»: the record stays

commit;
