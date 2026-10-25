import { get, put } from "@vercel/blob";
import type { Abierto, Envuelto, Regalo, Tipo } from "./regalo";

// Brian's letters and coupons for her. Personal, so they live in the private Blob store,
// never in the repo. Brian creates and deletes; she opens and uses. A wrapped gift's text
// leaves the server only when she opens it — a surprise that can leak is not a surprise.
const PATH = process.env.VERCEL_ENV === "production" ? "regalos/regalos.json" : "regalos/dev.json";

const str = (v: unknown): v is string => typeof v === "string";
const num = (v: unknown): v is number => typeof v === "number";

function parse(raw: string): Regalo[] {
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) throw new Error("not a list");
    return list.filter(
      (r: Regalo) =>
        str(r?.id) &&
        (r.tipo === "cupon" || r.tipo === "carta") &&
        str(r.titulo) &&
        str(r.texto) &&
        num(r.at) &&
        num(r.desde) &&
        (r.abierto === null || num(r.abierto)) &&
        (r.usado === null || num(r.usado)),
    );
  } catch (cause) {
    throw new Error(`${PATH} is unreadable: refusing to treat it as empty`, { cause });
  }
}

export async function loadRegalos(): Promise<Regalo[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res?.stream) return [];
  return parse(await new Response(res.stream).text());
}

async function save(list: Regalo[]) {
  await put(PATH, JSON.stringify(list), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

const pick = ({ id, tipo, titulo, texto, abierto, usado }: Regalo): Abierto => ({ id, tipo, titulo, texto, abierto, usado });

// What her screen may know: wrapped ones as a count of missions left, opened ones whole.
export function vistaDeJazz(list: Regalo[], total: number): { envueltos: Envuelto[]; abiertos: Abierto[] } {
  return {
    envueltos: list.filter((r) => !r.abierto).map((r) => ({ id: r.id, faltan: Math.max(0, r.desde - total) })),
    abiertos: list.filter((r) => r.abierto).sort((a, b) => b.abierto! - a.abierto!).map(pick),
  };
}

export const hayParaAbrir = (list: Regalo[], total: number) => list.some((r) => !r.abierto && total >= r.desde);

export async function crear(tipo: Tipo, titulo: string, texto: string, desde: number) {
  const list = await loadRegalos();
  list.unshift({ id: crypto.randomUUID(), tipo, titulo, texto, at: Date.now(), desde, abierto: null, usado: null });
  await save(list);
}

export async function borrar(id: string) {
  await save((await loadRegalos()).filter((r) => r.id !== id));
}

// Opens it if its missions are done, and only then returns its content.
export async function abrir(id: string, total: number): Promise<Abierto | null> {
  const list = await loadRegalos();
  const r = list.find((x) => x.id === id);
  if (!r || total < r.desde) return null;
  if (!r.abierto) {
    r.abierto = Date.now();
    await save(list);
  }
  return pick(r);
}

export async function usar(id: string) {
  const list = await loadRegalos();
  const r = list.find((x) => x.id === id);
  if (!r || r.tipo !== "cupon" || !r.abierto || r.usado) return;
  r.usado = Date.now();
  await save(list);
}
