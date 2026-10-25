import { esId, frase, hayBase, ms, sql } from "./db";

// What she let go in the last 30 days, and the way back (Brian, ESQUEMA.md element 2: «soltar se
// puede deshacer»). Nothing here deletes: letting go only ever hid it. The limits still hold on the
// way back — 3 for today, 5 goals, 12 steps, 40 thoughts — and their sentences come from the DB.

export type Tipo = "mision" | "idea" | "meta" | "paso";
export type Soltado = { tipo: Tipo; id: string; texto: string; en: number; meta?: string };

const DIAS = 30;

type Fila = { tipo: Tipo; id: string; texto: string; en: Date; meta: string | null };

export async function loadSoltado(vista: "hoy" | "despues"): Promise<Soltado[]> {
  if (!hayBase()) return [];
  const db = sql();
  const rows =
    vista === "hoy"
      ? await db<Fila[]>`
          select 'mision' as tipo, id, texto, soltada_en as en, null as meta from mision
          where soltada_en > now() - make_interval(days => ${DIAS})
          order by soltada_en desc limit 30`
      : await db<Fila[]>`
          select * from (
            select 'idea' as tipo, id, texto, soltada_en as en, null as meta from idea
            where paso_a is null and soltada_en > now() - make_interval(days => ${DIAS})
            union all
            select 'meta', id, titulo, soltada_en, null from meta
            where soltada_en > now() - make_interval(days => ${DIAS})
            union all
            select 'paso', p.id, p.texto, p.soltado_en, m.titulo from paso p join meta m on m.id = p.meta_id
            where p.soltado_en > now() - make_interval(days => ${DIAS})
          ) s order by en desc limit 30`;
  return rows.map((r) => ({ tipo: r.tipo, id: r.id, texto: r.texto, en: ms(r.en)!, ...(r.meta && { meta: r.meta }) }));
}

export async function recuperar(tipo: Tipo, id: string): Promise<string | void> {
  if (!esId(id)) return "Eso ya no se puede recuperar.";
  const db = sql();
  try {
    const r =
      tipo === "mision"
        ? await db`update mision set soltada_en = null where id = ${id} and hecha_en is null and soltada_en > now() - make_interval(days => ${DIAS})`
        : tipo === "idea"
          ? await db`update idea set soltada_en = null where id = ${id} and paso_a is null and soltada_en > now() - make_interval(days => ${DIAS})`
          : tipo === "meta"
            ? await db`update meta set soltada_en = null where id = ${id} and soltada_en > now() - make_interval(days => ${DIAS})`
            : await db`update paso set soltado_en = null where id = ${id} and soltado_en > now() - make_interval(days => ${DIAS})`;
    if (r.count === 0) return "Eso ya no se puede recuperar.";
  } catch (e) {
    const f = frase(e);
    if (f) return f;
    // the step's mission is still open in «hoy»: one open mission per step
    if ((e as { code?: string })?.code === "23505") return "Eso ya está en hoy.";
    throw e;
  }
}
