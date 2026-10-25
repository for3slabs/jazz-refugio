import { esId, hayBase, ms, sql } from "./db";
import type { Abierto, Envuelto, Regalo, Tipo } from "./regalo";
import type { Role } from "./token";

// Letters and coupons between the two: rows in Postgres, never in the repo. Each one leaves gifts
// for the other and lets go only their own; the one it is for opens and uses it. A wrapped gift's
// text leaves the server only when it is opened — a surprise that can leak is not a surprise.
// Only Jazz has a garden: a gift for Brian opens right away (the DB checks it). ESQUEMA.md el. 5.

const otro = (r: Role): Role => (r === "jazz" ? "brian" : "jazz");

type Fila = {
  id: string;
  tipo: Tipo;
  titulo: string;
  texto: string;
  creado: Date;
  se_abre_con_flores: number;
  abierto_en: Date | null;
  usado_en: Date | null;
};

const regalo = (r: Fila): Regalo => ({
  id: r.id,
  tipo: r.tipo,
  titulo: r.titulo,
  texto: r.texto,
  at: ms(r.creado)!,
  desde: r.se_abre_con_flores,
  abierto: ms(r.abierto_en),
  usado: ms(r.usado_en),
});

// The gifts left FOR `para` (default: hers), newest first.
export async function loadRegalos(para: Role = "jazz"): Promise<Regalo[]> {
  if (!hayBase()) return [];
  const rows = await sql()<Fila[]>`
    select id, tipo, titulo, texto, creado, se_abre_con_flores, abierto_en, usado_en from regalo
    where para = ${para} and de = ${otro(para)} and soltado_en is null
    order by creado desc`;
  return rows.map(regalo);
}

// The gifts `de` left for the other one.
export async function loadDados(de: Role): Promise<Regalo[]> {
  if (!hayBase()) return [];
  const rows = await sql()<Fila[]>`
    select id, tipo, titulo, texto, creado, se_abre_con_flores, abierto_en, usado_en from regalo
    where de = ${de} and soltado_en is null
    order by creado desc`;
  return rows.map(regalo);
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

export async function crear(de: Role, tipo: Tipo, titulo: string, texto: string, desde: number) {
  await sql()`
    insert into regalo (de, para, tipo, titulo, texto, se_abre_con_flores)
    values (${de}, ${otro(de)}, ${tipo}, ${titulo}, ${texto}, ${de === "brian" ? desde : 0})`;
}

export async function borrar(de: Role, id: string) {
  if (!esId(id)) return;
  await sql()`update regalo set soltado_en = now() where id = ${id} and de = ${de}`;
}

// Opens it if its missions are done, and only then returns its content.
export async function abrir(para: Role, id: string, total: number): Promise<Abierto | null> {
  if (!esId(id)) return null;
  const [r] = await sql()<Fila[]>`
    update regalo set abierto_en = coalesce(abierto_en, now())
    where id = ${id} and para = ${para} and soltado_en is null and se_abre_con_flores <= ${total}
    returning id, tipo, titulo, texto, creado, se_abre_con_flores, abierto_en, usado_en`;
  return r ? pick(regalo(r)) : null;
}

export async function usar(para: Role, id: string) {
  if (!esId(id)) return;
  await sql()`
    update regalo set usado_en = now()
    where id = ${id} and para = ${para} and tipo = 'cupon' and abierto_en is not null and usado_en is null`;
}
