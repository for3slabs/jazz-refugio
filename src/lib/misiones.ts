import { esId, frase, hayBase, ms, sql } from "./db";
import { type EstadoMision, type Hecha, type Mision, type Misiones, diaDe } from "./mision";

// Her missions: rows in Postgres, synced between her devices; only she reads or writes them.
// No deadlines and nothing «overdue»: an open mission just waits. Every completed one is kept —
// a flower with its text and date — so the garden is their count and can no longer be lost
// (Brian, ESQUEMA.md element 2). `vueltas` are her «volver» flowers, counted apart.
const EMPTY: Misiones = { abiertas: [], hechas: [], total: 0, mejorDia: 0, vueltas: 0 };

type Fila = {
  id: string;
  texto: string;
  abierta_en: Date;
  hecha_en: Date | null;
  paso_id: string | null;
  meta_id: string | null;
  estado: EstadoMision | null;
  empezada_en: Date | null;
};

const mision = (f: Fila): Mision => ({
  id: f.id,
  texto: f.texto,
  at: ms(f.abierta_en)!,
  ...(f.paso_id && f.meta_id && { origen: { meta: f.meta_id, paso: f.paso_id } }),
  ...(f.estado && { estado: f.estado }),
  ...(f.empezada_en && { empezada: ms(f.empezada_en)! }),
});

const COLUMNAS = (db: ReturnType<typeof sql>) =>
  db`m.id, m.texto, m.abierta_en, m.hecha_en, m.paso_id, p.meta_id, m.estado, m.empezada_en`;

export async function loadMisiones(): Promise<Misiones> {
  if (!hayBase()) return EMPTY;
  const db = sql();
  const [abiertas, hechas, [cuenta]] = await Promise.all([
    db<Fila[]>`select ${COLUMNAS(db)} from mision m left join paso p on p.id = m.paso_id
               where m.hecha_en is null and m.soltada_en is null order by m.abierta_en`,
    // only today's and yesterday's: «hechas hoy» needs nothing older
    db<Fila[]>`select ${COLUMNAS(db)} from mision m left join paso p on p.id = m.paso_id
               where m.hecha_en > now() - interval '2 days' order by m.hecha_en desc`,
    db<{ total: number; mejor: number; vueltas: number }[]>`
      select
        (select count(*) from mision where hecha_en is not null)::int
          + coalesce((select flores from jardin_inicial where persona = 'jazz'), 0) as total,
        greatest(
          coalesce((select mejor_dia from jardin_inicial where persona = 'jazz'), 0),
          coalesce((select max(n) from (select count(*) as n from mision where hecha_en is not null
                    group by (hecha_en at time zone 'America/Mexico_City')::date) d), 0)
        )::int as mejor,
        (select count(*) from momento where persona = 'jazz')::int as vueltas`,
  ]);
  return {
    abiertas: abiertas.map(mision),
    hechas: hechas.map((f): Hecha => ({ ...mision(f), hecha: ms(f.hecha_en)! })),
    total: cuenta.total,
    mejorDia: cuenta.mejor,
    vueltas: cuenta.vueltas,
  };
}

// What she completed on her today — the reward list of the board.
export const deHoy = (hechas: Hecha[], now = Date.now()) => hechas.filter((h) => diaDe(h.hecha) === diaDe(now));

// The DB keeps the 3 open under a lock: a full day comes back as `false`; otherwise its real id,
// which the board needs when she taps a mission before the server's answer arrived.
export async function agregar(texto: string, origen?: Mision["origen"]): Promise<string | false> {
  try {
    const [m] = await sql()<{ id: string }[]>`
      insert into mision (texto, paso_id) values (${texto}, ${origen?.paso ?? null}) returning id`;
    return m.id;
  } catch (e) {
    if (frase(e)) return false;
    throw e;
  }
}

async function cambiar(id: string, set: "hecha" | "soltada"): Promise<Mision | null> {
  if (!esId(id)) return null;
  const db = sql();
  const col = set === "hecha" ? db`hecha_en` : db`soltada_en`;
  const [f] = await db<Fila[]>`
    with m as (
      update mision set ${col} = now()
      where id = ${id} and hecha_en is null and soltada_en is null
      returning *
    )
    select ${COLUMNAS(db)} from m left join paso p on p.id = m.paso_id`;
  return f ? mision(f) : null;
}

// Returns the mission it completed; the DB marks the goal step it came from in the same step.
export const cumplir = (id: string) => cambiar(id, "hecha");

// A goal step done right there, without passing through «hoy»: still a flower.
export async function florDePaso(texto: string) {
  await sql()`insert into mision (texto, abierta_en, hecha_en) values (${texto}, now(), now())`;
}

// Letting it go hides it; the step it carried goes back to waiting on its own.
export const soltar = (id: string) => cambiar(id, "soltada");

// How an open mission is going; null clears it back to waiting. The first «haciendo» starts its
// clock and later marks never move it. False when the mission is no longer open.
export async function marcarEstadoMision(id: string, estado: EstadoMision | null): Promise<boolean> {
  if (!esId(id)) return false;
  const rows = await sql()`
    update mision
    set estado = ${estado},
        empezada_en = case when ${estado}::text = 'haciendo' then coalesce(empezada_en, now()) else empezada_en end
    where id = ${id} and hecha_en is null and soltada_en is null
    returning id`;
  return rows.length > 0;
}
