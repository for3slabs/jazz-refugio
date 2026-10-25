import { esId, hayBase, ms, sql } from "./db";
import type { Role } from "./token";

// `visto`: when the one it was for opened «notas» after it was left (only on the notes you left).
export type Note = { id: string; texto: string; at: number; visto?: number | null };

// Notes between the two: rows in Postgres, never in the repo. Both write, neither replies in a
// thread — each note is something that arrives (Brian, ESQUEMA.md elements 4 + 5). «Seen» is a
// row too, so the door glows the same on every device. Removing one hides it; nothing is deleted.
export const MAX_NOTE = 2000;

const otro = (r: Role): Role => (r === "jazz" ? "brian" : "jazz");

// The notes left for `para`, newest first.
export async function loadNotes(para: Role = "jazz"): Promise<Note[]> {
  if (!hayBase()) return [];
  const rows = await sql()<{ id: string; texto: string; creada: Date }[]>`
    select id, texto, creada from nota
    where para = ${para} and de = ${otro(para)} and soltada_en is null
    order by creada desc`;
  return rows.map((n) => ({ id: n.id, texto: n.texto, at: ms(n.creada)! }));
}

// The notes `de` left for the other one, each with whether it was seen.
export async function loadDejadas(de: Role): Promise<Note[]> {
  if (!hayBase()) return [];
  const rows = await sql()<{ id: string; texto: string; creada: Date; vista_en: Date | null }[]>`
    select n.id, n.texto, n.creada, l.vista_en from nota n
    left join lectura l on l.nota_id = n.id and l.persona = n.para
    where n.de = ${de} and n.soltada_en is null
    order by n.creada desc`;
  return rows.map((n) => ({ id: n.id, texto: n.texto, at: ms(n.creada)!, visto: ms(n.vista_en) }));
}

export async function addNote(de: Role, texto: string): Promise<Note> {
  const [n] = await sql()<{ id: string; creada: Date }[]>`
    insert into nota (de, para, texto) values (${de}, ${otro(de)}, ${texto}) returning id, creada`;
  return { id: n.id, texto, at: ms(n.creada)! };
}

// Only your own notes can be removed.
export async function removeNote(de: Role, id: string) {
  if (!esId(id)) return;
  await sql()`update nota set soltada_en = now() where id = ${id} and de = ${de} and soltada_en is null`;
}

// Opening «notas» is what reading means.
export async function marcarVistas(role: Role) {
  await sql()`
    insert into lectura (nota_id, persona)
    select id, para from nota where para = ${role} and soltada_en is null
    on conflict (nota_id, persona) do nothing`;
}

export async function hayNuevas(role: Role): Promise<boolean> {
  if (!hayBase()) return false;
  const [r] = await sql()<{ hay: boolean }[]>`
    select exists (
      select 1 from nota n where n.para = ${role} and n.soltada_en is null
        and not exists (select 1 from lectura l where l.nota_id = n.id and l.persona = ${role})
    ) as hay`;
  return r.hay;
}

const fmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "America/Mexico_City" });
export const formatDate = (at: number) => fmt.format(at);
