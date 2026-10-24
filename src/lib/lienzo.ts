import { del, get, put } from "@vercel/blob";
import { type Item, type Tablero, MAX_ITEMS, MAX_TABLEROS, isHex } from "./tablero";

// Her boards. The index is one private JSON; every image or drawing is its own private blob,
// served only through `/api/lienzo/img/[id]`, which checks who asks. Brian sees a board only
// once she shares it, and never edits it. Each operation returns a sentence for her on failure.
const PREFIX = process.env.VERCEL_ENV === "production" ? "lienzo" : "lienzo-dev";
const INDEX = `${PREFIX}/tableros.json`;

const str = (v: unknown): v is string => typeof v === "string";

function parseItem(i: Item): Item | null {
  if (!str(i?.id) || typeof i.at !== "number") return null;
  if ((i.tipo === "imagen" || i.tipo === "dibujo") && str(i.path)) return i;
  if (i.tipo === "color" && isHex(i.color)) return i;
  if (i.tipo === "nota" && str(i.texto)) return i;
  return null;
}

function parse(raw: string): Tablero[] {
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .filter((t: Tablero) => str(t?.id) && str(t?.nombre) && Array.isArray(t?.items))
      .map((t: Tablero) => ({
        ...t,
        compartido: t.compartido === true,
        items: t.items.map(parseItem).filter((i): i is Item => i !== null),
      }));
  } catch {
    return [];
  }
}

export async function loadTableros(): Promise<Tablero[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  const res = await get(INDEX, { access: "private", useCache: false });
  if (!res?.stream) return [];
  return parse(await new Response(res.stream).text());
}

async function save(list: Tablero[]) {
  await put(INDEX, JSON.stringify(list), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

async function change(fn: (list: Tablero[]) => string | void | Promise<string | void>): Promise<string | void> {
  const list = await loadTableros();
  const err = await fn(list);
  if (err) return err;
  await save(list);
}

const nuevo = () => crypto.randomUUID();

export const crearTablero = (nombre: string) =>
  change((list) => {
    if (list.length >= MAX_TABLEROS) return `Tienes ${MAX_TABLEROS} tableros. Borra uno primero.`;
    list.unshift({ id: nuevo(), nombre, at: Date.now(), compartido: false, items: [] });
  });

export const borrarTablero = (id: string) =>
  change(async (list) => {
    const t = list.find((x) => x.id === id);
    if (!t) return;
    const paths = t.items.map((i) => i.path).filter(str);
    if (paths.length) await del(paths);
    list.splice(list.indexOf(t), 1);
  });

export const compartir = (id: string, si: boolean) =>
  change((list) => {
    const t = list.find((x) => x.id === id);
    if (t) t.compartido = si;
  });

export const agregar = (tableroId: string, item: Omit<Item, "id" | "at">) =>
  change((list) => {
    const t = list.find((x) => x.id === tableroId);
    if (!t) return "Ese tablero ya no está.";
    if (t.items.length >= MAX_ITEMS) return `Un tablero guarda hasta ${MAX_ITEMS} cosas.`;
    t.items.unshift({ id: nuevo(), at: Date.now(), ...item });
  });

export const quitar = (tableroId: string, itemId: string) =>
  change(async (list) => {
    const t = list.find((x) => x.id === tableroId);
    const i = t?.items.find((x) => x.id === itemId);
    if (!t || !i) return;
    if (i.path) await del(i.path);
    t.items = t.items.filter((x) => x.id !== itemId);
  });

// An uploaded image or drawing: its own private blob, named by a fresh id.
export async function subir(file: Blob, type: string): Promise<string> {
  const ext = type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : "webp";
  const path = `${PREFIX}/img/${nuevo()}.${ext}`;
  await put(path, file, { access: "private", addRandomSuffix: false, contentType: type });
  return path;
}

// Who may see an image: she always; Brian only when its board is shared.
export async function imagenPara(itemId: string, role: "jazz" | "brian") {
  for (const t of await loadTableros()) {
    const i = t.items.find((x) => x.id === itemId);
    if (i?.path && (role === "jazz" || t.compartido)) return get(i.path, { access: "private" });
  }
  return null;
}

// What each one may see of the boards.
export const visibles = (list: Tablero[], role: "jazz" | "brian") => (role === "jazz" ? list : list.filter((t) => t.compartido));
