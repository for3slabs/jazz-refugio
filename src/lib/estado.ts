import { get, put } from "@vercel/blob";
import { type Estado, type ModoId, isModo, vigente } from "./modos";

// Her current mode is personal, so it lives next to Brian's notes in the private Blob
// store, never in the repo. Only the current one is kept — no history, on purpose: a
// record of her moods would make her feel watched. Only she writes it.
const PATH = process.env.VERCEL_ENV === "production" ? "estado/estado.json" : "estado/dev.json";

function parse(raw: string): Estado | null {
  try {
    const e = JSON.parse(raw);
    return isModo(e?.modo) && typeof e?.at === "number" ? { modo: e.modo, at: e.at } : null;
  } catch {
    return null;
  }
}

export async function loadEstado(): Promise<Estado | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res?.stream) return null;
  return vigente(parse(await new Response(res.stream).text()));
}

// null clears it: the file then holds `null`, which reads back as «no mode».
export async function saveEstado(modo: ModoId | null): Promise<Estado | null> {
  const estado = modo ? { modo, at: Date.now() } : null;
  await put(PATH, JSON.stringify(estado), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
  return estado;
}
