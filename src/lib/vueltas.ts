import { hayBase, ms, sql } from "./db";
import type { Moment } from "./local";
import type { Role } from "./token";

// Her «volver» flowers: each time she came back and named a step. They used to live only in the
// browser where they happened — the PC never counted the phone's. Now each one is a row; the
// ones a browser kept are uploaded once from it, and the same flower uploaded twice is one
// (block base-de-datos, migration 0002).

const MAX_PASO = 200;

export async function loadVueltas(role: Role): Promise<Moment[]> {
  if (!hayBase()) return [];
  const rows = await sql()<{ en: Date; paso: string }[]>`
    select en, paso from momento where persona = ${role} order by en`;
  return rows.map((r) => ({ at: ms(r.en)!, step: r.paso }));
}

// Returns how many she has now.
export async function anotarVuelta(role: Role, paso: string): Promise<number> {
  const db = sql();
  await db`insert into momento (persona, paso) values (${role}, ${paso.slice(0, MAX_PASO) || "volver"})`;
  const [c] = await db<{ n: number }[]>`select count(*)::int as n from momento where persona = ${role}`;
  return c.n;
}

export async function subirVueltas(role: Role, list: Moment[]): Promise<number> {
  const filas = list
    .filter((m) => Number.isFinite(m?.at) && typeof m?.step === "string")
    .slice(0, 5000)
    .map((m) => ({ persona: role, paso: m.step.trim().slice(0, MAX_PASO) || "volver", en: new Date(m.at) }));
  if (!filas.length) return 0;
  const r = await sql()`
    insert into momento ${sql()(filas, "persona", "paso", "en")}
    on conflict (persona, en, paso) do nothing`;
  return r.count;
}
