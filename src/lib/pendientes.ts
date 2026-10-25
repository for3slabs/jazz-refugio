import { frase, hayBase, ms, sql } from "./db";
import { MAX_TEXTO } from "./mision";
import type { Idea, Meta, Paso, Pendientes } from "./pendiente";

// What does not fit in today: her captured thoughts and her goals. Rows in Postgres, synced
// between her devices; only she reads or writes them. Every operation returns an error sentence
// for her, or nothing when it worked — the limits' sentences come from the DB, which counts
// them under a lock. A step is «en hoy» when an open mission carries it: that is read, never
// stored twice (ESQUEMA.md element 2).
const EMPTY: Pendientes = { mente: [], metas: [] };

async function con(op: () => Promise<unknown>): Promise<string | void> {
  try {
    await op();
  } catch (e) {
    const f = frase(e);
    if (f) return f;
    throw e;
  }
}

export async function loadPendientes(): Promise<Pendientes> {
  if (!hayBase()) return EMPTY;
  const db = sql();
  const [ideas, metas, pasos] = await Promise.all([
    db<{ id: string; texto: string; anotada_en: Date }[]>`
      select id, texto, anotada_en from idea where soltada_en is null and paso_a is null order by anotada_en desc`,
    db<{ id: string; titulo: string; descripcion: string | null; para: string | null; creada_en: Date }[]>`
      select id, titulo, descripcion, to_char(para, 'YYYY-MM-DD') as para, creada_en from meta
      where soltada_en is null order by creada_en desc`,
    db<{ id: string; meta_id: string; texto: string; hecho_en: Date | null; en_hoy: boolean }[]>`
      select p.id, p.meta_id, p.texto, p.hecho_en,
             exists (select 1 from mision m where m.paso_id = p.id and m.hecha_en is null and m.soltada_en is null) as en_hoy
      from paso p where p.soltado_en is null order by p.orden, p.id`,
  ]);
  return {
    mente: ideas.map((i): Idea => ({ id: i.id, texto: i.texto, at: ms(i.anotada_en)! })),
    metas: metas.map(
      (m): Meta => ({
        id: m.id,
        titulo: m.titulo,
        descripcion: m.descripcion,
        para: m.para,
        at: ms(m.creada_en)!,
        pasos: pasos
          .filter((p) => p.meta_id === m.id)
          .map((p): Paso => ({ id: p.id, texto: p.texto, hecho: ms(p.hecho_en), enHoy: p.en_hoy })),
      }),
    ),
  };
}

export const anotarIdea = (texto: string) => con(() => sql()`insert into idea (texto) values (${texto})`);

// Returns the thought it let go — hidden, not deleted.
export async function sacarIdea(id: string): Promise<Idea | null> {
  const [i] = await sql()<{ id: string; texto: string; anotada_en: Date }[]>`
    update idea set soltada_en = now() where id = ${id} and soltada_en is null and paso_a is null
    returning id, texto, anotada_en`;
  return i ? { id: i.id, texto: i.texto, at: ms(i.anotada_en)! } : null;
}

// A thought becomes a mission or a goal in ONE transaction: if today or the goals are full,
// nothing moves and the thought stays where it was (in Blob it was deleted first, then created).
export const pasarIdeaAHoy = (id: string) =>
  con(() =>
    sql().begin(async (tx) => {
      const [i] = await tx<{ texto: string }[]>`
        update idea set paso_a = 'mision' where id = ${id} and soltada_en is null and paso_a is null returning texto`;
      if (i) await tx`insert into mision (texto) values (${i.texto.slice(0, MAX_TEXTO)})`;
    }),
  );

export const pasarIdeaAMeta = (id: string) =>
  con(() =>
    sql().begin(async (tx) => {
      const [i] = await tx<{ texto: string }[]>`
        update idea set paso_a = 'meta' where id = ${id} and soltada_en is null and paso_a is null returning texto`;
      if (i) await tx`insert into meta (titulo) values (${i.texto.slice(0, MAX_TEXTO)})`;
    }),
  );

export const nuevaMeta = (titulo: string, para: string | null, descripcion: string | null = null) =>
  con(() => sql()`insert into meta (titulo, para, descripcion) values (${titulo}, ${para}, ${descripcion})`);

// Her goal's name, description and date, changed from its detail. False when it is no longer hers
// to change (let go meanwhile).
export async function editarMeta(id: string, titulo: string, descripcion: string | null, para: string | null): Promise<boolean> {
  const rows = await sql()`
    update meta set titulo = ${titulo}, descripcion = ${descripcion}, para = ${para}
    where id = ${id} and soltada_en is null returning id`;
  return rows.length > 0;
}

export async function soltarMeta(id: string): Promise<string | void> {
  await sql()`update meta set soltada_en = now() where id = ${id} and soltada_en is null`;
}

const metaViva = async (metaId: string) =>
  (await sql()`select 1 from meta where id = ${metaId} and soltada_en is null`).length > 0;

export async function nuevoPaso(metaId: string, texto: string): Promise<string | void> {
  if (!(await metaViva(metaId))) return "Esa meta ya no está.";
  return con(
    () => sql()`
      insert into paso (meta_id, texto, orden)
      values (${metaId}, ${texto}, (select coalesce(max(orden) + 1, 0) from paso where meta_id = ${metaId}))`,
  );
}

export async function soltarPaso(metaId: string, pasoId: string): Promise<string | void> {
  await sql()`update paso set soltado_en = now() where id = ${pasoId} and meta_id = ${metaId} and soltado_en is null`;
}

// A step's life: waiting → «en hoy» (a mission carries it) → done. «en hoy» lives in the
// mission, so here only done or not done is written.
export async function marcarPaso(metaId: string, pasoId: string, estado: "hecho" | "enHoy" | "espera"): Promise<string | void> {
  const r = await sql()`
    update paso set hecho_en = ${estado === "hecho" ? sql()`coalesce(hecho_en, now())` : null}
    where id = ${pasoId} and meta_id = ${metaId} and soltado_en is null`;
  if (r.count === 0) return "Ese paso ya no está.";
}

export async function pasoDe(metaId: string, pasoId: string): Promise<Paso | null> {
  const [p] = await sql()<{ id: string; texto: string; hecho_en: Date | null; en_hoy: boolean }[]>`
    select p.id, p.texto, p.hecho_en,
           exists (select 1 from mision m where m.paso_id = p.id and m.hecha_en is null and m.soltada_en is null) as en_hoy
    from paso p where p.id = ${pasoId} and p.meta_id = ${metaId} and p.soltado_en is null`;
  return p ? { id: p.id, texto: p.texto, hecho: ms(p.hecho_en), enHoy: p.en_hoy } : null;
}
