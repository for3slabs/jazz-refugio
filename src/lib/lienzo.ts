import { get, put } from "@vercel/blob";
import { frase, hayBase, ms, sql } from "./db";
import { type Item, type Tablero, type Tipo } from "./tablero";

// Her boards: rows in Postgres (ESQUEMA.md element 3). Every image or drawing is still its own
// private blob — a DB is not for heavy files — served only through `/api/lienzo/img/[id]`, which
// checks who asks. Brian sees a board only once she shares it, and never edits it. Letting a
// board or a thing go hides it and keeps its file, so «undo» can bring it back. Each operation
// returns a sentence for her on failure.
const PREFIX = process.env.VERCEL_ENV === "production" ? "lienzo" : "lienzo-dev";

type FilaItem = {
  id: string;
  tablero_id: string;
  tipo: Tipo;
  archivo: string | null;
  ancho: number | null;
  alto: number | null;
  color: string | null;
  texto: string | null;
  creado: Date;
};

const item = (i: FilaItem): Item => ({
  id: i.id,
  tipo: i.tipo,
  at: ms(i.creado)!,
  ...(i.archivo && { path: i.archivo }),
  ...(i.ancho && { w: i.ancho }),
  ...(i.alto && { h: i.alto }),
  ...(i.color && { color: i.color }),
  ...(i.texto && { texto: i.texto }),
});

export async function loadTableros(): Promise<Tablero[]> {
  if (!hayBase()) return [];
  const db = sql();
  const [tableros, items] = await Promise.all([
    db<{ id: string; nombre: string; creado: Date; compartido: boolean }[]>`
      select id, nombre, creado, compartido from tablero where soltado_en is null order by orden, creado desc`,
    db<FilaItem[]>`
      select i.id, i.tablero_id, i.tipo, i.archivo, i.ancho, i.alto, i.color, i.texto, i.creado
      from item i join tablero t on t.id = i.tablero_id
      where i.soltado_en is null and t.soltado_en is null order by i.orden, i.creado desc`,
  ]);
  return tableros.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    at: ms(t.creado)!,
    compartido: t.compartido,
    items: items.filter((i) => i.tablero_id === t.id).map(item),
  }));
}

async function con(op: () => Promise<unknown>): Promise<string | void> {
  try {
    await op();
  } catch (e) {
    const f = frase(e);
    if (f) return f;
    throw e;
  }
}

export const crearTablero = (nombre: string) => con(() => sql()`insert into tablero (nombre) values (${nombre})`);

export async function borrarTablero(id: string): Promise<string | void> {
  await sql()`update tablero set soltado_en = now() where id = ${id} and soltado_en is null`;
}

export async function compartir(id: string, si: boolean): Promise<string | void> {
  await sql()`update tablero set compartido = ${si}, editado = now() where id = ${id}`;
}

export async function agregar(tableroId: string, nuevo: Omit<Item, "id" | "at">): Promise<string | void> {
  const [t] = await sql()`select 1 from tablero where id = ${tableroId} and soltado_en is null`;
  if (!t) return "Ese tablero ya no está.";
  return con(
    () => sql()`
      insert into item (tablero_id, tipo, archivo, ancho, alto, color, texto)
      values (${tableroId}, ${nuevo.tipo}, ${nuevo.path ?? null}, ${nuevo.w ?? null}, ${nuevo.h ?? null},
              ${nuevo.color ?? null}, ${nuevo.texto ?? null})`,
  );
}

export async function quitar(tableroId: string, itemId: string): Promise<string | void> {
  await sql()`update item set soltado_en = now() where id = ${itemId} and tablero_id = ${tableroId} and soltado_en is null`;
}

// An uploaded image or drawing: its own private blob, named by a fresh id.
export async function subir(file: Blob, type: string): Promise<string> {
  const ext = type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : "webp";
  const path = `${PREFIX}/img/${crypto.randomUUID()}.${ext}`;
  await put(path, file, { access: "private", addRandomSuffix: false, contentType: type });
  return path;
}

// Who may see an image: she always; Brian only when its board is shared.
export async function imagenPara(itemId: string, role: "jazz" | "brian") {
  const [i] = await sql()<{ archivo: string }[]>`
    select i.archivo from item i join tablero t on t.id = i.tablero_id
    where i.id = ${itemId} and i.archivo is not null and i.soltado_en is null and t.soltado_en is null
      and (${role} = 'jazz' or t.compartido)`;
  return i ? get(i.archivo, { access: "private" }) : null;
}

// What each one may see of the boards.
export const visibles = (list: Tablero[], role: "jazz" | "brian") => (role === "jazz" ? list : list.filter((t) => t.compartido));
