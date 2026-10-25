import { get, put } from "@vercel/blob";
import {
  type Mascota,
  MAX_NOMBRE_MASCOTA,
  NOMBRE_INICIAL,
  type ObjetoId,
  type Regalado,
  isObjeto,
  limpiarPuestos,
} from "./objeto";

// Her pet: its name and what it wears, and the objects Brian gave her. Personal, so they live
// in the private Blob store, never in the repo. Only she dresses it; only Brian gives.
const prod = process.env.VERCEL_ENV === "production";
const PATH = prod ? "mascota/mascota.json" : "mascota/dev.json";
const REGALOS = prod ? "mascota/regalados.json" : "mascota/regalados-dev.json";
// The 2D characters Brian could give before the pet existed: each one is now its object.
const LEGADO = prod ? "personajes/regalados.json" : "personajes/dev.json";
const DEL_LEGADO: Record<string, ObjetoId> = { mariachi: "sombrero", chef: "gorro-chef" };

const INICIAL: Mascota = { nombre: NOMBRE_INICIAL, puestos: { cuello: "mono" } };

async function read(path: string): Promise<unknown> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const res = await get(path, { access: "private", useCache: false });
  if (!res?.stream) return null;
  try {
    return JSON.parse(await new Response(res.stream).text());
  } catch (cause) {
    throw new Error(`${PATH} is unreadable: refusing to treat it as empty`, { cause });
  }
}

async function write(path: string, value: unknown) {
  await put(path, JSON.stringify(value), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export const limpiarNombre = (v: unknown) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE_MASCOTA) : "";

export async function loadMascota(): Promise<Mascota> {
  const d = (await read(PATH)) as Partial<Mascota> | null;
  if (!d) return INICIAL;
  return { nombre: limpiarNombre(d.nombre) || NOMBRE_INICIAL, puestos: limpiarPuestos(d.puestos) };
}

export async function saveMascota(m: Mascota) {
  await write(PATH, { nombre: limpiarNombre(m.nombre) || NOMBRE_INICIAL, puestos: limpiarPuestos(m.puestos) });
}

export async function loadRegalados(): Promise<Regalado[]> {
  const [nuevos, viejos] = await Promise.all([read(REGALOS), read(LEGADO)]);
  const list: Regalado[] = Array.isArray(nuevos) ? nuevos.filter((r) => isObjeto(r?.id) && typeof r?.at === "number") : [];
  if (Array.isArray(viejos)) {
    for (const r of viejos) {
      const id = DEL_LEGADO[r?.id];
      if (id && !list.some((x) => x.id === id)) list.push({ id, at: typeof r.at === "number" ? r.at : Date.now() });
    }
  }
  return list;
}

export async function regalar(id: ObjetoId) {
  const list = await loadRegalados();
  if (list.some((r) => r.id === id)) return;
  await write(REGALOS, [...list, { id, at: Date.now() }]);
}
