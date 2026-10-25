import { get, put } from "@vercel/blob";
import { esId, frase, hayBase, ms, sql } from "./db";
import { type Item, type Tablero, type Tipo } from "./tablero";

// Her boards: rows in Postgres (ESQUEMA.md element 3). Every image or drawing is still its own
// private blob — a DB is not for heavy files — served only through `/api/lienzo/img/[id]`, which
// checks who asks. Brian sees a board only once she shares it, and never edits it. Letting a
// board or a thing go hides it and keeps its file, so «undo» can bring it back. Each operation
// returns a sentence for her on failure.
export const PREFIX = process.env.VERCEL_ENV === "production" ? "lienzo" : "lienzo-dev";

type FilaItem = {
  id: string;
  tablero_id: string;
  tipo: Tipo;
  archivo: string | null;
  ancho: number | null;
  alto: number | null;
  color: string | null;
  texto: string | null;
  nombre: string | null;
  mime: string | null;
  bytes: number | null;
  url: string | null;
  url_titulo: string | null;
  url_imagen: string | null;
  url_sitio: string | null;
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
  ...(i.nombre && { nombre: i.nombre }),
  ...(i.mime && { mime: i.mime }),
  ...(i.bytes && { bytes: i.bytes }),
  ...(i.url && { enlace: { url: i.url, titulo: i.url_titulo, imagen: i.url_imagen, sitio: i.url_sitio } }),
});

export async function loadTableros(): Promise<Tablero[]> {
  if (!hayBase()) return [];
  const db = sql();
  const [tableros, items] = await Promise.all([
    db<{ id: string; nombre: string; descripcion: string; portada_item_id: string | null; creado: Date; compartido: boolean }[]>`
      select id, nombre, descripcion, portada_item_id, creado, compartido from tablero
      where soltado_en is null order by orden, creado desc`,
    db<FilaItem[]>`
      select i.id, i.tablero_id, i.tipo, i.archivo, i.ancho, i.alto, i.color, i.texto,
             i.nombre, i.mime, i.bytes, i.url, i.url_titulo, i.url_imagen, i.url_sitio, i.creado
      from item i join tablero t on t.id = i.tablero_id
      where i.soltado_en is null and t.soltado_en is null order by i.orden, i.creado desc`,
  ]);
  return tableros.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    descripcion: t.descripcion,
    portada: t.portada_item_id,
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

// Its id comes back so she lands inside the new board right away, ready to fill it.
export async function crearTablero(nombre: string): Promise<{ id: string } | string> {
  let id = "";
  const err = await con(async () => {
    const [t] = await sql()<{ id: string }[]>`insert into tablero (nombre) values (${nombre}) returning id`;
    id = t.id;
  });
  return err ?? { id };
}

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
      insert into item (tablero_id, tipo, archivo, ancho, alto, color, texto, nombre, mime, bytes, url, url_titulo, url_imagen, url_sitio, orden)
      values (${tableroId}, ${nuevo.tipo}, ${nuevo.path ?? null}, ${nuevo.w ?? null}, ${nuevo.h ?? null},
              ${nuevo.color ?? null}, ${nuevo.texto ?? null}, ${nuevo.nombre ?? null}, ${nuevo.mime ?? null}, ${nuevo.bytes ?? null},
              ${nuevo.enlace?.url ?? null}, ${nuevo.enlace?.titulo ?? null}, ${nuevo.enlace?.imagen ?? null}, ${nuevo.enlace?.sitio ?? null},
              -- a new thing goes first, ahead of the order she set
              (select coalesce(min(orden), 0) - 1 from item where tablero_id = ${tableroId}))`,
  );
}

export async function quitar(tableroId: string, itemId: string): Promise<string | void> {
  await sql().begin(async (tx) => {
    await tx`update item set soltado_en = now() where id = ${itemId} and tablero_id = ${tableroId} and soltado_en is null`;
    // a cover that was let go stops being the cover
    await tx`update tablero set portada_item_id = null where id = ${tableroId} and portada_item_id = ${itemId}`;
  });
}

// Her name and description; the DB keeps the lengths (40 · 280).
export async function editarTablero(id: string, nombre: string, descripcion: string): Promise<string | void> {
  try {
    const r = await sql()`
      update tablero set nombre = ${nombre}, descripcion = ${descripcion}, editado = now()
      where id = ${id} and soltado_en is null`;
    if (r.count === 0) return "Ese tablero ya no está.";
  } catch (e) {
    const f = frase(e); // a name she already uses on another board
    if (f) return f;
    throw e;
  }
}

// The cover is one of its images or drawings — the DB refuses anything else. null: back to the four.
export async function elegirPortada(id: string, itemId: string | null): Promise<string | void> {
  if (itemId && !esId(itemId)) return "Esa imagen ya no está.";
  try {
    await sql()`update tablero set portada_item_id = ${itemId}, editado = now() where id = ${id} and soltado_en is null`;
  } catch (e) {
    const f = frase(e);
    if (f) return f;
    throw e;
  }
}

// One step earlier (-1) or later (+1) in her order; the whole board is renumbered in one go.
export async function moverItem(id: string, itemId: string, paso: -1 | 1): Promise<string | void> {
  await sql().begin(async (tx) => {
    const filas = await tx<{ id: string }[]>`
      select id from item where tablero_id = ${id} and soltado_en is null order by orden, creado desc`;
    const ids = filas.map((f) => f.id);
    const i = ids.indexOf(itemId);
    const j = i + paso;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await tx`
      update item set orden = n.orden
      from (select unnest(${ids}::uuid[]) as id, generate_series(0, ${ids.length - 1}) as orden) n
      where item.id = n.id`;
  });
}

// What she let go comes back for 30 days («deshacer»); the 12-board limit still holds.
export async function restaurarTablero(id: string): Promise<string | void> {
  if (!esId(id)) return "Ese tablero ya no se puede recuperar.";
  try {
    const r = await sql()`
      update tablero set soltado_en = null
      where id = ${id} and soltado_en is not null and soltado_en > now() - interval '30 days'`;
    if (r.count === 0) return "Ese tablero ya no se puede recuperar.";
  } catch (e) {
    const f = frase(e);
    if (f) return f;
    throw e;
  }
}

export async function tableroSoltado(id: string): Promise<{ id: string; nombre: string } | null> {
  if (!hayBase() || !esId(id)) return null;
  const [t] = await sql()<{ id: string; nombre: string }[]>`
    select id, nombre from tablero where id = ${id} and soltado_en > now() - interval '30 days'`;
  return t ?? null;
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

// A doc, with what the download needs: she always; Brian only when its board is shared.
export async function docPara(itemId: string, role: "jazz" | "brian") {
  if (!esId(itemId)) return null;
  const [i] = await sql()<{ archivo: string; nombre: string; mime: string | null }[]>`
    select i.archivo, i.nombre, i.mime from item i join tablero t on t.id = i.tablero_id
    where i.id = ${itemId} and i.tipo = 'doc' and i.soltado_en is null and t.soltado_en is null
      and (${role} = 'jazz' or t.compartido)`;
  if (!i) return null;
  const res = await get(i.archivo, { access: "private" });
  return res ? { res, nombre: i.nombre, mime: i.mime } : null;
}

// What each one may see of the boards.
export const visibles = (list: Tablero[], role: "jazz" | "brian") => (role === "jazz" ? list : list.filter((t) => t.compartido));
