import { frase, hayBase, ms, sql } from "./db";
import { type Coleccion, type Deseos, type EstadoLibro, type EstadoViaje } from "./estante";

// Her books, what she learned and her trips: rows in Postgres, each with `de` so Brian can keep
// his own one day (ESQUEMA.md element 7). Only she writes hers. Brian gets her wishes only
// (`deseos`), to give her gifts. Letting one go hides it; nothing is deleted.
const EMPTY: Coleccion = { libros: [], aprendido: [], viajes: [] };
const lleno = "Esta lista ya está muy llena. Suelta algo primero.";

export async function loadColeccion(): Promise<Coleccion> {
  if (!hayBase()) return EMPTY;
  const db = sql();
  const [libros, aprendido, viajes] = await Promise.all([
    db<{ id: string; titulo: string; autor: string; nota: string; estado: EstadoLibro; creado: Date }[]>`
      select id, titulo, autor, nota, estado, creado from libro where de = 'jazz' and soltado_en is null order by creado desc`,
    db<{ id: string; titulo: string; donde: string; nota: string; creado: Date }[]>`
      select id, titulo, donde, nota, creado from aprendizaje where de = 'jazz' and soltado_en is null order by creado desc`,
    db<{ id: string; lugar: string; cuando: string; nota: string; estado: EstadoViaje; creado: Date }[]>`
      select id, lugar, cuando, nota, estado, creado from viaje where de = 'jazz' and soltado_en is null order by creado desc`,
  ]);
  return {
    libros: libros.map(({ creado, ...l }) => ({ ...l, at: ms(creado)! })),
    aprendido: aprendido.map(({ creado, ...a }) => ({ ...a, at: ms(creado)! })),
    viajes: viajes.map(({ creado, ...v }) => ({ ...v, at: ms(creado)! })),
  };
}

export const deseos = (c: Coleccion): Deseos => ({
  libros: c.libros.filter((l) => l.estado === "quiero").map(({ id, titulo, autor }) => ({ id, titulo, autor })),
  viajes: c.viajes.filter((v) => v.estado === "quiero").map(({ id, lugar, cuando }) => ({ id, lugar, cuando })),
});

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

export const agregarLibro = (titulo: string, autor: string, estado: EstadoLibro, nota: string) =>
  insertar(() => sql()`insert into libro (de, titulo, autor, estado, nota) values ('jazz', ${titulo}, ${autor}, ${estado}, ${nota})`);

export const agregarAprendido = (titulo: string, donde: string, nota: string) =>
  insertar(() => sql()`insert into aprendizaje (de, titulo, donde, nota) values ('jazz', ${titulo}, ${donde}, ${nota})`);

export const agregarViaje = (lugar: string, cuando: string, estado: EstadoViaje, nota: string) =>
  insertar(() => sql()`insert into viaje (de, lugar, cuando, estado, nota) values ('jazz', ${lugar}, ${cuando}, ${estado}, ${nota})`);

// Moving a book or a trip to its next state («lo terminé», «¡ya fui!») keeps everything else.
export async function moverLibro(id: string, estado: EstadoLibro): Promise<string | void> {
  await sql()`update libro set estado = ${estado} where id = ${id} and de = 'jazz'`;
}

export async function moverViaje(id: string, estado: EstadoViaje): Promise<string | void> {
  await sql()`update viaje set estado = ${estado} where id = ${id} and de = 'jazz'`;
}

export async function soltarDe(lista: Lista, id: string): Promise<string | void> {
  const tabla = lista === "libros" ? "libro" : lista === "aprendido" ? "aprendizaje" : "viaje";
  await sql()`update ${sql()(tabla)} set soltado_en = now() where id = ${id} and de = 'jazz'`;
}
