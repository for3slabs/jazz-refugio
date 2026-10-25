import { esId, frase, hayBase, ms, sql } from "./db";
import { type Coleccion, type Deseos, type EstadoLibro, type EstadoViaje } from "./estante";
import type { Role } from "./token";

// Books, what was learned and trips — one collection each (`de`), both ways (ESQUEMA.md el. 7).
// Each one writes only their own. The other sees only the wishes, to give them as gifts, and may
// mark one «ya se lo regalé» — a mark the owner's own views never read. Letting go hides.
const EMPTY: Coleccion = { libros: [], aprendido: [], viajes: [] };
const lleno = "Esta lista ya está muy llena. Suelta algo primero.";

export async function loadColeccion(de: Role = "jazz"): Promise<Coleccion> {
  if (!hayBase()) return EMPTY;
  const db = sql();
  const [libros, aprendido, viajes] = await Promise.all([
    db<{ id: string; titulo: string; autor: string; nota: string; estado: EstadoLibro; creado: Date }[]>`
      select id, titulo, autor, nota, estado, creado from libro where de = ${de} and soltado_en is null order by creado desc`,
    db<{ id: string; titulo: string; donde: string; nota: string; creado: Date }[]>`
      select id, titulo, donde, nota, creado from aprendizaje where de = ${de} and soltado_en is null order by creado desc`,
    db<{ id: string; lugar: string; cuando: string; nota: string; estado: EstadoViaje; creado: Date }[]>`
      select id, lugar, cuando, nota, estado, creado from viaje where de = ${de} and soltado_en is null order by creado desc`,
  ]);
  return {
    libros: libros.map(({ creado, ...l }) => ({ ...l, at: ms(creado)! })),
    aprendido: aprendido.map(({ creado, ...a }) => ({ ...a, at: ms(creado)! })),
    viajes: viajes.map(({ creado, ...v }) => ({ ...v, at: ms(creado)! })),
  };
}

// What `de` wishes for, with whether the other one already gave it — for the other one's eyes only.
export async function loadDeseos(de: Role): Promise<Deseos> {
  if (!hayBase()) return { libros: [], viajes: [] };
  const db = sql();
  const [libros, viajes] = await Promise.all([
    db<{ id: string; titulo: string; autor: string; regalado_en: Date | null }[]>`
      select id, titulo, autor, regalado_en from libro
      where de = ${de} and estado = 'quiero' and soltado_en is null order by regalado_en nulls first, creado desc`,
    db<{ id: string; lugar: string; cuando: string; regalado_en: Date | null }[]>`
      select id, lugar, cuando, regalado_en from viaje
      where de = ${de} and estado = 'quiero' and soltado_en is null order by regalado_en nulls first, creado desc`,
  ]);
  return {
    libros: libros.map(({ regalado_en, ...l }) => ({ ...l, regalado: ms(regalado_en) })),
    viajes: viajes.map(({ regalado_en, ...v }) => ({ ...v, regalado: ms(regalado_en) })),
  };
}

// «ya se lo regalé» on a wish of `de` (the other one), or taken back.
export async function marcarRegalado(de: Role, tipo: "libro" | "viaje", id: string, si: boolean) {
  if (!esId(id)) return;
  const tabla = sql()(tipo);
  await sql()`update ${tabla} set regalado_en = ${si ? sql()`now()` : null} where id = ${id} and de = ${de} and estado = 'quiero'`;
}

type Lista = keyof Coleccion;

// The DB counts the 300 under a lock; its sentence is the one she already knows.
async function insertar(op: () => Promise<unknown>): Promise<string | void> {
  try {
    await op();
  } catch (e) {
    if (frase(e)) return lleno;
    throw e;
  }
}

export const agregarLibro = (de: Role, titulo: string, autor: string, estado: EstadoLibro, nota: string) =>
  insertar(() => sql()`insert into libro (de, titulo, autor, estado, nota) values (${de}, ${titulo}, ${autor}, ${estado}, ${nota})`);

export const agregarAprendido = (de: Role, titulo: string, donde: string, nota: string) =>
  insertar(() => sql()`insert into aprendizaje (de, titulo, donde, nota) values (${de}, ${titulo}, ${donde}, ${nota})`);

export const agregarViaje = (de: Role, lugar: string, cuando: string, estado: EstadoViaje, nota: string) =>
  insertar(() => sql()`insert into viaje (de, lugar, cuando, estado, nota) values (${de}, ${lugar}, ${cuando}, ${estado}, ${nota})`);

// Moving a book or a trip to its next state («lo terminé», «¡ya fui!») keeps everything else.
export async function moverLibro(de: Role, id: string, estado: EstadoLibro): Promise<string | void> {
  if (!esId(id)) return;
  await sql()`update libro set estado = ${estado} where id = ${id} and de = ${de}`;
}

export async function moverViaje(de: Role, id: string, estado: EstadoViaje): Promise<string | void> {
  if (!esId(id)) return;
  await sql()`update viaje set estado = ${estado} where id = ${id} and de = ${de}`;
}

export async function soltarDe(de: Role, lista: Lista, id: string): Promise<string | void> {
  if (!esId(id)) return;
  const tabla = lista === "libros" ? "libro" : lista === "aprendido" ? "aprendizaje" : "viaje";
  await sql()`update ${sql()(tabla)} set soltado_en = now() where id = ${id} and de = ${de}`;
}
