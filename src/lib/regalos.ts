import type postgres from "postgres";
import { esId, hayBase, ms, sql } from "./db";
import { avisar, nombre, otro } from "./avisos";
import type { Abierto, Envuelto, Reaccion, Regalo, Tipo } from "./regalo";
import type { Role } from "./token";

// Letters and coupons between the two: rows in Postgres, never in the repo. Each one leaves gifts
// for the other, fixes them while they are wrapped, and lets go only their own; the one it is for
// opens, accepts (with a reaction) and, a coupon, uses it — and the giver sees each step and gets
// a notification (0019, Brian 2026-11-06: «que los dos nos volvamos más cercanos»). A wrapped
// gift's text leaves the server only when it is opened — a surprise that can leak is not a
// surprise. Only Jazz has a garden: a gift for Brian opens right away (the DB checks it).

type Fila = {
  id: string;
  tipo: Tipo;
  titulo: string;
  texto: string;
  creado: Date;
  se_abre_con_flores: number;
  abierto_en: Date | null;
  aceptado_en: Date | null;
  reaccion: Reaccion | null;
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
  aceptado: ms(r.aceptado_en),
  reaccion: r.reaccion,
  usado: ms(r.usado_en),
});

const COLS = (db: postgres.Sql) => db`id, tipo, titulo, texto, creado, se_abre_con_flores, abierto_en, aceptado_en, reaccion, usado_en`;

// The gifts left FOR `para` (default: hers), newest first.
export async function loadRegalos(para: Role = "jazz"): Promise<Regalo[]> {
  if (!hayBase()) return [];
  const db = sql();
  const rows = await db<Fila[]>`
    select ${COLS(db)} from regalo
    where para = ${para} and de = ${otro(para)} and soltado_en is null
    order by creado desc`;
  return rows.map(regalo);
}

// The gifts `de` left for the other one.
export async function loadDados(de: Role): Promise<Regalo[]> {
  if (!hayBase()) return [];
  const db = sql();
  const rows = await db<Fila[]>`
    select ${COLS(db)} from regalo
    where de = ${de} and soltado_en is null
    order by creado desc`;
  return rows.map(regalo);
}

const pick = ({ id, tipo, titulo, texto, abierto, aceptado, reaccion, usado }: Regalo): Abierto => ({
  id, tipo, titulo, texto, abierto, aceptado, reaccion, usado,
});

// What her screen may know: wrapped ones as a count of missions left, opened ones whole.
export function vistaDeJazz(list: Regalo[], total: number): { envueltos: Envuelto[]; abiertos: Abierto[] } {
  return {
    envueltos: list.filter((r) => !r.abierto).map((r) => ({ id: r.id, faltan: Math.max(0, r.desde - total) })),
    abiertos: list.filter((r) => r.abierto).sort((a, b) => b.abierto! - a.abierto!).map(pick),
  };
}

export const hayParaAbrir = (list: Regalo[], total: number) => list.some((r) => !r.abierto && total >= r.desde);

export async function crear(de: Role, tipo: Tipo, titulo: string, texto: string, desde: number, total = 0) {
  const flores = de === "brian" ? desde : 0;
  await sql()`
    insert into regalo (de, para, tipo, titulo, texto, se_abre_con_flores, avisado_listo_en)
    values (${de}, ${otro(de)}, ${tipo}, ${titulo}, ${texto}, ${flores}, ${flores > total ? null : new Date()})`;
  avisar(otro(de), {
    title: "un regalo para ti 🎁",
    body: `${nombre(de)} te envolvió algo. ${flores > total ? "Se abre con tus misiones." : "Ya lo puedes abrir."}`,
    tag: "regalo-nuevo",
  });
}

// The giver fixes it — only while it is still wrapped (the DB refuses it once opened, 0019).
// Returns false when it was already opened (or is not theirs).
export async function editar(de: Role, id: string, tipo: Tipo, titulo: string, texto: string): Promise<boolean> {
  if (!esId(id)) return false;
  const rows = await sql()`
    update regalo set tipo = ${tipo}, titulo = ${titulo}, texto = ${texto}, editado_en = now()
    where id = ${id} and de = ${de} and abierto_en is null and soltado_en is null
    returning id`;
  return rows.length > 0;
}

export async function borrar(de: Role, id: string) {
  if (!esId(id)) return;
  await sql()`update regalo set soltado_en = now() where id = ${id} and de = ${de}`;
}

// Opens it if its missions are done, and only then returns its content. The first opening tells
// the giver.
export async function abrir(para: Role, id: string, total: number): Promise<Abierto | null> {
  if (!esId(id)) return null;
  const db = sql();
  const [nuevo] = await db<Fila[]>`
    update regalo set abierto_en = now()
    where id = ${id} and para = ${para} and soltado_en is null and se_abre_con_flores <= ${total} and abierto_en is null
    returning ${COLS(db)}`;
  if (nuevo) {
    avisar(otro(para), { title: "abrieron tu regalo", body: `${nombre(para)} abrió «${nuevo.titulo}».`, tag: `regalo-${id}` });
    return pick(regalo(nuevo));
  }
  const [ya] = await db<Fila[]>`
    select ${COLS(db)} from regalo
    where id = ${id} and para = ${para} and soltado_en is null and abierto_en is not null`;
  return ya ? pick(regalo(ya)) : null;
}

// «acepto», with a reaction. Accepting again only changes the reaction, and does not notify again.
export async function aceptar(para: Role, id: string, reaccion: Reaccion): Promise<boolean> {
  if (!esId(id)) return false;
  const db = sql();
  const [antes] = await db<{ aceptado_en: Date | null; titulo: string }[]>`
    select aceptado_en, titulo from regalo
    where id = ${id} and para = ${para} and soltado_en is null and abierto_en is not null`;
  if (!antes) return false;
  await db`
    update regalo set aceptado_en = coalesce(aceptado_en, now()), reaccion = ${reaccion}
    where id = ${id} and para = ${para} and abierto_en is not null`;
  if (!antes.aceptado_en) {
    avisar(otro(para), { title: `${nombre(para)} aceptó tu regalo ${reaccion}`, body: `«${antes.titulo}»`, tag: `regalo-${id}` });
  }
  return true;
}

// Using a coupon accepts it too, if it was not yet.
export async function usar(para: Role, id: string) {
  if (!esId(id)) return;
  await sql()`
    update regalo set usado_en = now(), aceptado_en = coalesce(aceptado_en, now()), reaccion = coalesce(reaccion, '💜')
    where id = ${id} and para = ${para} and tipo = 'cupon' and abierto_en is not null and usado_en is null`;
}

// Her missions reached a gift's: «ya puedes abrir uno», once per gift.
export async function avisarListos(total: number) {
  if (!hayBase()) return;
  const listos = await sql()`
    update regalo set avisado_listo_en = now()
    where para = 'jazz' and soltado_en is null and abierto_en is null and avisado_listo_en is null
      and se_abre_con_flores > 0 and se_abre_con_flores <= ${total}
    returning id`;
  if (listos.length) {
    avisar("jazz", { title: "ya puedes abrir un regalo 🎁", body: "Tus misiones lo abrieron.", tag: "regalo-listo" });
  }
}
