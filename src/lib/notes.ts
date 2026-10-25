import { hayBase, ms, sql } from "./db";

export type Note = { id: string; texto: string; at: number };

// Brian's notes for her: rows in Postgres, never in the repo. Removing one hides it
// (`soltada_en`), so a slip of the finger is never the end of a note.
export const MAX_NOTE = 2000;

export async function loadNotes(): Promise<Note[]> {
  if (!hayBase()) return [];
  const rows = await sql()<{ id: string; texto: string; creada: Date }[]>`
    select id, texto, creada from nota
    where de = 'brian' and para = 'jazz' and soltada_en is null
    order by creada desc`;
  return rows.map((n) => ({ id: n.id, texto: n.texto, at: ms(n.creada)! }));
}

export async function addNote(texto: string): Promise<Note> {
  const [n] = await sql()<{ id: string; creada: Date }[]>`
    insert into nota (de, para, texto) values ('brian', 'jazz', ${texto}) returning id, creada`;
  return { id: n.id, texto, at: ms(n.creada)! };
}

export async function removeNote(id: string) {
  await sql()`update nota set soltada_en = now() where id = ${id} and soltada_en is null`;
}

const fmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "America/Mexico_City" });
export const formatDate = (at: number) => fmt.format(at);
