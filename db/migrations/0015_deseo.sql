-- 0015 · her book of wishes (Brian, 2026-10-25): what she wishes for — a title, what it is, a link —
-- written by her, or sent to her by Brian, which arrives as a dove on her balcony until she reads
-- it (`visto_en`). Brian marks her wishes «ya se lo regalé» (`regalado_en`), a mark only he sees.
-- Rollback: 0015_deseo.down.sql.

begin;

create table deseo (
  id          uuid primary key default gen_random_uuid(),
  de          persona not null,
  para        persona not null default 'jazz',
  titulo      text not null check (char_length(titulo) between 1 and 80),
  descripcion text not null default '' check (char_length(descripcion) <= 500),
  enlace      text not null default '' check (char_length(enlace) <= 500),
  creado      timestamptz not null default now(),
  visto_en    timestamptz,
  regalado_en timestamptz,
  soltado_en  timestamptz
);

insert into migracion (version) values (15);

commit;
