-- 0002 · two things 0001 missed, found while moving the app (S81):
--   · her «volver» flowers lived only in the browser where they happened — the PC never counted
--     the phone's. Now each one is a row, uploaded once from every device, deduplicated.
--   · an image on the canvas carries its size, so the grid is laid out before it loads.
-- Rollback: 0002_vueltas.down.sql.

begin;

create table momento (
  id      uuid primary key default gen_random_uuid(),
  persona persona not null default 'jazz',
  paso    text not null check (char_length(paso) between 1 and 200),
  en      timestamptz not null default now(),
  unique (persona, en, paso)                              -- the same flower uploaded twice is one
);

alter table item add column ancho int check (ancho > 0);
alter table item add column alto int check (alto > 0);

-- The garden: completed missions + her returns + the count from before the rows existed.
create or replace view jardin as
  select (select count(*) from mision where hecha_en is not null)
       + (select count(*) from momento where persona = 'jazz')
       + coalesce((select flores from jardin_inicial where persona = 'jazz'), 0) as flores;

insert into migracion (version) values (2);

commit;
