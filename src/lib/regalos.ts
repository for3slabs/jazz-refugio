import { hayBase, ms, sql } from "./db";
import type { Abierto, Envuelto, Regalo, Tipo } from "./regalo";

// Brian's letters and coupons for her: rows in Postgres, never in the repo. Brian creates and
// lets go; she opens and uses. A wrapped gift's text leaves the server only when she opens it —
// a surprise that can leak is not a surprise. The table already carries `de` and `para`, for
// gifts both ways (ESQUEMA.md element 5).

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

export async function loadRegalos(): Promise<Regalo[]> {
  if (!hayBase()) return [];
  const rows = await sql()<Fila[]>`
    select id, tipo, titulo, texto, creado, se_abre_con_flores, abierto_en, usado_en from regalo
    where de = 'brian' and para = 'jazz' and soltado_en is null
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

export async function crear(tipo: Tipo, titulo: string, texto: string, desde: number) {
  await sql()`
    insert into regalo (de, para, tipo, titulo, texto, se_abre_con_flores)
    values ('brian', 'jazz', ${tipo}, ${titulo}, ${texto}, ${desde})`;
}

export async function borrar(id: string) {
  await sql()`update regalo set soltado_en = now() where id = ${id} and de = 'brian'`;
}

// Opens it if its missions are done, and only then returns its content.
export async function abrir(id: string, total: number): Promise<Abierto | null> {
  const [r] = await sql()<Fila[]>`
    update regalo set abierto_en = coalesce(abierto_en, now())
    where id = ${id} and para = 'jazz' and soltado_en is null and se_abre_con_flores <= ${total}
    returning id, tipo, titulo, texto, creado, se_abre_con_flores, abierto_en, usado_en`;
  return r ? pick(regalo(r)) : null;
}

export async function usar(id: string) {
  await sql()`
    update regalo set usado_en = now()
    where id = ${id} and para = 'jazz' and tipo = 'cupon' and abierto_en is not null and usado_en is null`;
}
