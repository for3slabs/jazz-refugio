import { get, put } from "@vercel/blob";

export type Note = { id: string; texto: string; at: number };

// Brian's notes are personal, so they never live in the repo: one private JSON file in
// the project's Vercel Blob store (BLOB_READ_WRITE_TOKEN). Only Brian writes, so a
// read-modify-write of the whole list is enough — there is no second writer to race.
// Production and everything else (local runs, previews) never share a file.
const PATH = process.env.VERCEL_ENV === "production" ? "notas/notas.json" : "notas/dev.json";
export const MAX_NOTE = 2000;

function parse(raw: string): Note[] {
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.filter(
      (n): n is Note =>
        typeof n?.id === "string" && typeof n?.texto === "string" && typeof n?.at === "number" && n.texto.trim() !== "",
    );
  } catch {
    return [];
  }
}

export async function loadNotes(): Promise<Note[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  // useCache: false — a note Brian just wrote must show at once, not after the CDN expires.
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res?.stream) return [];
  const list = parse(await new Response(res.stream).text());
  return list.sort((a, b) => b.at - a.at);
}

async function save(list: Note[]) {
  await put(PATH, JSON.stringify(list), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export async function addNote(texto: string): Promise<Note> {
  const note = { id: crypto.randomUUID(), texto, at: Date.now() };
  await save([note, ...(await loadNotes())]);
  return note;
}

export async function removeNote(id: string) {
  await save((await loadNotes()).filter((n) => n.id !== id));
}

const fmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "America/Mexico_City" });
export const formatDate = (at: number) => fmt.format(at);
