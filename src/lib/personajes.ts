import { get, put } from "@vercel/blob";
import { type Regalado, isPersonaje, type PersonajeId } from "./personaje";

// The characters Brian gave her. Personal, so they live in the private Blob store, never in
// the repo. Only Brian adds; a gift is never taken back. The ones her garden unlocks are not
// stored — they are computed from the flowers on her screen.
const PATH = process.env.VERCEL_ENV === "production" ? "personajes/regalados.json" : "personajes/dev.json";

function parse(raw: string): Regalado[] {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((r) => isPersonaje(r?.id) && typeof r?.at === "number") : [];
  } catch {
    return [];
  }
}

export async function loadRegalados(): Promise<Regalado[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res?.stream) return [];
  return parse(await new Response(res.stream).text());
}

export async function regalar(id: PersonajeId): Promise<void> {
  const list = await loadRegalados();
  if (list.some((r) => r.id === id)) return;
  await put(PATH, JSON.stringify([...list, { id, at: Date.now() }]), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}
