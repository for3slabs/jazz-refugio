-- 0018 · her word, changed by her (Brian, 2026-11-06: «Jazz quiere cambiar su contraseña»). Until
-- she changes it, the word in Vercel (REFUGIO_CLAVE) opens her place; once she does, this row is the
-- only one that does. Stored as scrypt (salt + hash), never the word itself. Only her word lives
-- here: Brian's stays in Vercel.
-- Rollback: 0018_palabra.down.sql (she goes back to the word in Vercel).

begin;

create table palabra (
  persona persona primary key check (persona = 'jazz'),
  hash    text not null check (hash ~ '^scrypt\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{43}$'),
  cambiada timestamptz not null default now()
);

insert into migracion (version) values (18);

commit;
