-- 0001 · the whole app moves from one JSON file per feature (Vercel Blob) to Postgres.
-- Design and every behaviour decision: Mente/docs/jazz/base-de-datos/ESQUEMA.md (Brian, 2026-10-24).
-- Every limit below is the one the app already enforces (src/lib/*.ts); the DB now enforces it too,
-- so two devices writing at once can no longer slip past it. Rollback: 0001_init.down.sql.

begin;

create type persona as enum ('jazz', 'brian');
create type categoria as enum ('cabeza', 'cuerpo', 'cuello');
create type modo as enum ('hiperfoco', 'conectada', 'mil ideas', 'saturada', 'recargando', 'no arranco');

-- Counting limits take a per-table lock first: without it, two inserts at once both count N-1.
create function limite(tabla text, n bigint, tope int, frase text) returns void language plpgsql as $$
begin
  if n > tope then
    raise exception '%', frase using errcode = 'check_violation';
  end if;
end $$;

------------------------------------------------------------------------------------------------
-- 1 · the pet + her mood
------------------------------------------------------------------------------------------------

-- The catalogue: a new object is a row and its .glb, not a deploy.
create table objeto (
  id                 text primary key check (id ~ '^[a-z0-9-]{1,30}$'),
  nombre             text not null check (char_length(nombre) between 1 and 40),
  categoria          categoria not null,
  flores_para_llegar int check (flores_para_llegar >= 0),           -- null = only as a gift
  modelo_3d          text,
  activo             boolean not null default true,
  orden              int not null default 0,
  unique (id, categoria)
);

-- What she has. Stored, never computed: an arrived object stays, with when and how.
create table inventario (
  objeto_id text primary key references objeto (id),
  origen    text not null check (origen in ('inicio', 'jardin', 'regalo')),
  llego_en  timestamptz not null default now()
);

create table mascota (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null check (char_length(nombre) between 1 and 20),
  creada_en timestamptz not null default now()
);

-- What it wears: one per body part; it must be hers and of that body part.
create table puesto (
  mascota_id uuid not null references mascota (id) on delete cascade,
  categoria  categoria not null,
  objeto_id  text not null references inventario (objeto_id),
  primary key (mascota_id, categoria),
  foreign key (objeto_id, categoria) references objeto (id, categoria)
);

-- Her mood: the current one only, on purpose (no history — she must not feel watched).
create table estado_actual (
  persona persona primary key default 'jazz' check (persona = 'jazz'),
  modo    modo not null,
  desde   timestamptz not null default now(),
  vence   timestamptz not null default now() + interval '12 hours'
);

------------------------------------------------------------------------------------------------
-- 2 · today and later
------------------------------------------------------------------------------------------------

create table idea (
  id         uuid primary key default gen_random_uuid(),
  texto      text not null check (char_length(texto) between 1 and 80),
  anotada_en timestamptz not null default now(),
  paso_a     text check (paso_a in ('mision', 'meta')),          -- what it became, if anything
  soltada_en timestamptz                                          -- hidden; «undo» for 30 days
);

create table meta (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null check (char_length(titulo) between 1 and 80),
  para       date,                                                -- her calendar day, never an hour
  creada_en  timestamptz not null default now(),
  soltada_en timestamptz
);

create table paso (
  id       uuid primary key default gen_random_uuid(),
  meta_id  uuid not null references meta (id) on delete cascade,
  texto    text not null check (char_length(texto) between 1 and 80),
  orden    int not null default 0,
  hecho_en timestamptz
);

-- Every completed mission is a flower: the garden is their count, so it can no longer be lost.
create table mision (
  id         uuid primary key default gen_random_uuid(),
  texto      text not null check (char_length(texto) between 1 and 80),
  paso_id    uuid references paso (id) on delete set null,
  abierta_en timestamptz not null default now(),
  hecha_en   timestamptz,
  soltada_en timestamptz,
  check (hecha_en is null or soltada_en is null)
);
-- «in today» is not a flag: a step is in today when one open mission points at it — at most one.
create unique index mision_un_paso_abierto on mision (paso_id)
  where paso_id is not null and hecha_en is null and soltada_en is null;
create index mision_hechas on mision (hecha_en) where hecha_en is not null;

-- Completing a mission that came from a step completes the step, in the same transaction.
create function mision_cumple_paso() returns trigger language plpgsql as $$
begin
  if new.paso_id is not null and new.hecha_en is not null and old.hecha_en is null then
    update paso set hecho_en = new.hecha_en where id = new.paso_id and hecho_en is null;
  end if;
  return new;
end $$;
create trigger mision_cumple_paso after update of hecha_en on mision
  for each row execute function mision_cumple_paso();

-- The flowers counted before this table existed (Blob kept only a number). Added once.
create table jardin_inicial (
  persona persona primary key default 'jazz' check (persona = 'jazz'),
  flores  int not null check (flores >= 0)
);

create view jardin as
  select (select count(*) from mision where hecha_en is not null)
       + coalesce((select flores from jardin_inicial where persona = 'jazz'), 0) as flores;

------------------------------------------------------------------------------------------------
-- 3 · the canvas
------------------------------------------------------------------------------------------------

create type tipo_item as enum ('imagen', 'dibujo', 'color', 'nota');

create table tablero (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null check (char_length(nombre) between 1 and 40),
  descripcion     text not null default '' check (char_length(descripcion) <= 280),
  portada_item_id uuid,
  compartido      boolean not null default false,
  orden           int not null default 0,
  creado          timestamptz not null default now(),
  editado         timestamptz not null default now(),
  soltado_en      timestamptz
);

create table item (
  id         uuid primary key default gen_random_uuid(),
  tablero_id uuid not null references tablero (id) on delete cascade,
  tipo       tipo_item not null,
  archivo    text,                                                -- its path in Blob (images stay there)
  color      text check (color ~ '^#[0-9a-fA-F]{6}$'),
  texto      text check (char_length(texto) between 1 and 280),
  orden      int not null default 0,
  creado     timestamptz not null default now(),
  unique (id, tablero_id),
  check (
    (tipo in ('imagen', 'dibujo') and archivo is not null and color is null and texto is null) or
    (tipo = 'color' and color is not null and archivo is null and texto is null) or
    (tipo = 'nota' and texto is not null and archivo is null and color is null)
  )
);

-- The cover is an image or drawing of THIS board.
alter table tablero add constraint tablero_portada
  foreign key (portada_item_id, id) references item (id, tablero_id) on delete set null (portada_item_id);
create function portada_es_imagen() returns trigger language plpgsql as $$
begin
  if new.portada_item_id is not null and
     (select tipo from item where id = new.portada_item_id) not in ('imagen', 'dibujo') then
    raise exception 'La portada tiene que ser una imagen del tablero.' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger portada_es_imagen before insert or update of portada_item_id on tablero
  for each row execute function portada_es_imagen();

------------------------------------------------------------------------------------------------
-- 4 + 5 · notes and gifts between the two
------------------------------------------------------------------------------------------------

create table nota (
  id         uuid primary key default gen_random_uuid(),
  de         persona not null,
  para       persona not null,
  texto      text not null check (char_length(texto) between 1 and 2000),
  creada     timestamptz not null default now(),
  editada    timestamptz,
  soltada_en timestamptz,
  check (de <> para),
  unique (id, para)
);

-- «seen», the same on every device; only the one it was for can have seen it.
create table lectura (
  nota_id uuid not null,
  persona persona not null,
  vista_en timestamptz not null default now(),
  primary key (nota_id, persona),
  foreign key (nota_id, persona) references nota (id, para) on delete cascade
);

create type tipo_regalo as enum ('carta', 'cupon');

create table regalo (
  id                 uuid primary key default gen_random_uuid(),
  de                 persona not null,
  para               persona not null,
  tipo               tipo_regalo not null,
  titulo             text not null check (char_length(titulo) between 1 and 60),
  texto              text not null check (char_length(texto) between 1 and 600),
  se_abre_con_flores int not null default 0 check (se_abre_con_flores >= 0),
  creado             timestamptz not null default now(),
  abierto_en         timestamptz,
  usado_en           timestamptz,
  soltado_en         timestamptz,
  check (de <> para),
  -- only Jazz has a garden: a gift for Brian opens right away
  check (para = 'jazz' or se_abre_con_flores = 0),
  check (usado_en is null or (tipo = 'cupon' and abierto_en is not null))
);

------------------------------------------------------------------------------------------------
-- 6 · presente
------------------------------------------------------------------------------------------------

-- The album of the question of the day, kept forever. One answer per person per day.
create table respuesta (
  dia     date not null,
  persona persona not null,
  texto   text not null check (char_length(texto) between 1 and 500),
  creada  timestamptz not null default now(),
  primary key (dia, persona)
);

create table presencia (
  persona persona primary key,
  hasta   timestamptz not null
);

------------------------------------------------------------------------------------------------
-- 7 · the collection, both ways
------------------------------------------------------------------------------------------------

create type estado_libro as enum ('quiero', 'leyendo', 'leido');
create type estado_viaje as enum ('quiero', 'fui');

-- `regalo_id`: the gift that fulfilled a wish — shown only to whoever gave it.
create table libro (
  id         uuid primary key default gen_random_uuid(),
  de         persona not null,
  titulo     text not null check (char_length(titulo) between 1 and 80),
  autor      text not null default '' check (char_length(autor) <= 80),
  nota       text not null default '' check (char_length(nota) <= 280),
  estado     estado_libro not null default 'quiero',
  regalo_id  uuid references regalo (id) on delete set null,
  creado     timestamptz not null default now(),
  soltado_en timestamptz
);

create table aprendizaje (
  id         uuid primary key default gen_random_uuid(),
  de         persona not null,
  titulo     text not null check (char_length(titulo) between 1 and 80),
  donde      text not null default '' check (char_length(donde) <= 80),
  nota       text not null default '' check (char_length(nota) <= 280),
  creado     timestamptz not null default now(),
  soltado_en timestamptz
);

create table viaje (
  id         uuid primary key default gen_random_uuid(),
  de         persona not null,
  lugar      text not null check (char_length(lugar) between 1 and 80),
  cuando     text not null default '' check (char_length(cuando) <= 80),
  nota       text not null default '' check (char_length(nota) <= 280),
  estado     estado_viaje not null default 'quiero',
  regalo_id  uuid references regalo (id) on delete set null,
  creado     timestamptz not null default now(),
  soltado_en timestamptz
);

------------------------------------------------------------------------------------------------
-- 8 · the helpers' usage — one row per use, never what she asked
------------------------------------------------------------------------------------------------

create table uso_ayudante (
  id      bigint generated always as identity primary key,
  persona persona not null default 'jazz',
  en      timestamptz not null default now()
);

------------------------------------------------------------------------------------------------
-- the limits, counted under a lock (3 · 5 · 12 · 40 · 12 · 60 · 300 · 20 a day)
------------------------------------------------------------------------------------------------

create function limites() returns trigger language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtext(tg_table_name));
  case tg_table_name
    when 'mision' then
      if new.hecha_en is null and new.soltada_en is null then
        perform limite('mision', (select count(*) from mision where hecha_en is null and soltada_en is null), 3,
          'Ya tienes 3 misiones para hoy.');
      end if;
    when 'meta' then
      perform limite('meta', (select count(*) from meta m where m.soltada_en is null
        and not (exists (select 1 from paso p where p.meta_id = m.id)
                 and not exists (select 1 from paso p where p.meta_id = m.id and p.hecho_en is null))), 5,
        'Ya tienes 5 metas. Termina o suelta una primero.');
    when 'paso' then
      perform limite('paso', (select count(*) from paso where meta_id = new.meta_id), 12,
        'Una meta tiene hasta 12 pasos.');
    when 'idea' then
      perform limite('idea', (select count(*) from idea where soltada_en is null and paso_a is null), 40,
        'Ya hay 40 cosas en tu mente. Suelta alguna primero.');
    when 'tablero' then
      perform limite('tablero', (select count(*) from tablero where soltado_en is null), 12,
        'Tienes 12 tableros. Borra uno primero.');
    when 'item' then
      perform limite('item', (select count(*) from item where tablero_id = new.tablero_id), 60,
        'Un tablero guarda hasta 60 cosas.');
    when 'libro' then
      perform limite('libro', (select count(*) from libro where de = new.de and soltado_en is null), 300,
        'Esa lista ya tiene 300.');
    when 'aprendizaje' then
      perform limite('aprendizaje', (select count(*) from aprendizaje where de = new.de and soltado_en is null), 300,
        'Esa lista ya tiene 300.');
    when 'viaje' then
      perform limite('viaje', (select count(*) from viaje where de = new.de and soltado_en is null), 300,
        'Esa lista ya tiene 300.');
    when 'uso_ayudante' then
      perform limite('uso_ayudante', (select count(*) from uso_ayudante
        where persona = new.persona
          and (en at time zone 'America/Mexico_City')::date = (now() at time zone 'America/Mexico_City')::date), 20,
        'Por hoy ya pediste bastante ayuda. Mañana seguimos.');
  end case;
  return new;
end $$;

create trigger limites after insert on mision for each row execute function limites();
create trigger limites_reabrir after update of soltada_en, hecha_en on mision
  for each row when (new.hecha_en is null and new.soltada_en is null) execute function limites();
create trigger limites after insert on meta for each row execute function limites();
create trigger limites_reabrir after update of soltada_en on meta
  for each row when (new.soltada_en is null) execute function limites();
create trigger limites after insert on paso for each row execute function limites();
create trigger limites after insert on idea for each row execute function limites();
create trigger limites_reabrir after update of soltada_en, paso_a on idea
  for each row when (new.soltada_en is null and new.paso_a is null) execute function limites();
create trigger limites after insert on tablero for each row execute function limites();
create trigger limites_reabrir after update of soltado_en on tablero
  for each row when (new.soltado_en is null) execute function limites();
create trigger limites after insert on item for each row execute function limites();
create trigger limites after insert on libro for each row execute function limites();
create trigger limites after insert on aprendizaje for each row execute function limites();
create trigger limites after insert on viaje for each row execute function limites();
create trigger limites after insert on uso_ayudante for each row execute function limites();

------------------------------------------------------------------------------------------------
-- the catalogue of today (src/lib/objeto.ts), now data
------------------------------------------------------------------------------------------------

insert into objeto (id, nombre, categoria, flores_para_llegar, orden) values
  ('mono',       'moño rosa',            'cuello', 0,  0),
  ('sombrero',   'sombrero de mariachi', 'cabeza', 5,  1),
  ('mandil',     'mandil lila',          'cuerpo', 10, 2),
  ('gorro-chef', 'gorro de chef',        'cabeza', 15, 3);

create table migracion (version int primary key, aplicada_en timestamptz not null default now());
insert into migracion (version) values (1);

commit;
