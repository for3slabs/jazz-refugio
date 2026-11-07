-- 0019 · gifts that answer back (Brian, 2026-11-06: «la intención es que los dos nos volvamos más
-- cercanos»). Inside «regalos» only, the one who gave sees what became of it — opened, accepted, the
-- reaction — and can still fix it while it is wrapped. This undoes the «no seen» of 0017 for gifts
-- alone; nothing else of hers reaches Brian.
--   aceptado_en / reaccion : the one it is for accepts it, with one of five reactions
--   editado_en             : the giver changed it while it was still wrapped
--   avisado_listo_en       : her phone was told «ya puedes abrir uno» — once per gift
--   aviso                  : the phones that asked for notifications (Web Push subscriptions)
-- Rollback: 0019_regalos_cercanos.down.sql.

begin;

alter table regalo
  add column aceptado_en      timestamptz,
  add column reaccion         text,
  add column editado_en       timestamptz,
  add column avisado_listo_en timestamptz;

-- a gift that opened right away never waited: nothing to announce for it
update regalo set avisado_listo_en = creado where se_abre_con_flores = 0;

-- a coupon used before today was accepted when it was used
update regalo set aceptado_en = usado_en where usado_en is not null;

alter table regalo
  add constraint regalo_acepta_abierto check (aceptado_en is null or abierto_en is not null),
  add constraint regalo_reaccion check (reaccion is null or (aceptado_en is not null and reaccion in ('💜', '🥰', '😍', '😂', '🤗'))),
  add constraint regalo_usa_aceptado check (usado_en is null or aceptado_en is not null);

-- What she read never changes under her: once opened, title and text are fixed.
create function regalo_fijo_al_abrir() returns trigger language plpgsql as $$
begin
  if old.abierto_en is not null and (new.titulo <> old.titulo or new.texto <> old.texto or new.tipo <> old.tipo) then
    raise exception 'Ya lo abrió: no se puede cambiar.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger regalo_fijo_al_abrir before update on regalo
  for each row execute function regalo_fijo_al_abrir();

create table aviso (
  endpoint text primary key check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  persona  persona not null,
  p256dh   text not null check (char_length(p256dh) between 40 and 200),
  auth     text not null check (char_length(auth) between 10 and 100),
  creado   timestamptz not null default now(),
  baja_en  timestamptz          -- the phone said no more (or its push service forgot it): never sent to again
);

insert into migracion (version) values (19);

commit;
