import type postgres from "postgres";
import { hayBase, ms, sql } from "./db";
import {
  type Mascota,
  MAX_NOMBRE_MASCOTA,
  NOMBRE_INICIAL,
  type Puestos,
  type Regalado,
  categorias,
  limpiarPuestos,
  type ObjetoId,
} from "./objeto";

// Her pet: its name, what it wears, and what she has. Rows in Postgres (ESQUEMA.md element 1):
// an object that arrives — from the start, from her garden, or as Brian's gift — is stored with
// when and how, and stays. What it wears must be hers and of that body part; the DB checks both.
// Only she dresses it; only Brian gives.

const INICIAL: Mascota = { nombre: NOMBRE_INICIAL, puestos: { cuello: "mono" } };

export const limpiarNombre = (v: unknown) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, MAX_NOMBRE_MASCOTA) : "";

// What her garden has brought so far becomes hers for good — written, never recomputed.
async function llegadas(db: postgres.Sql | postgres.TransactionSql) {
  await db`
    insert into inventario (objeto_id, origen)
    select o.id, case when o.flores_para_llegar = 0 then 'inicio' else 'jardin' end
    from objeto o, jardin j
    where o.activo and o.flores_para_llegar is not null and o.flores_para_llegar <= j.flores
    on conflict (objeto_id) do nothing`;
}

export async function loadMascota(): Promise<Mascota> {
  if (!hayBase()) return INICIAL;
  const db = sql();
  await llegadas(db);
  const [m] = await db<{ id: string; nombre: string }[]>`select id, nombre from mascota order by creada_en limit 1`;
  if (!m) return INICIAL;
  const puestos = await db<{ categoria: string; objeto_id: ObjetoId }[]>`
    select categoria, objeto_id from puesto where mascota_id = ${m.id} and objeto_id is not null`;
  return {
    nombre: limpiarNombre(m.nombre) || NOMBRE_INICIAL,
    puestos: limpiarPuestos(Object.fromEntries(puestos.map((p) => [p.categoria, p.objeto_id]))),
  };
}

// One transaction: the name, and every body part — worn if she has it, empty otherwise.
export async function saveMascota(m: Mascota) {
  const nombre = limpiarNombre(m.nombre) || NOMBRE_INICIAL;
  const puestos: Puestos = limpiarPuestos(m.puestos);
  await sql().begin(async (tx) => {
    await llegadas(tx);
    let [row] = await tx<{ id: string }[]>`select id from mascota order by creada_en limit 1`;
    if (row) await tx`update mascota set nombre = ${nombre} where id = ${row.id}`;
    else [row] = await tx<{ id: string }[]>`insert into mascota (nombre) values (${nombre}) returning id`;
    for (const c of categorias) {
      const id = puestos[c] ?? null;
      await tx`
        insert into puesto (mascota_id, categoria, objeto_id)
        values (${row.id}, ${c}, (select objeto_id from inventario where objeto_id = ${id}))
        on conflict (mascota_id, categoria) do update set objeto_id = excluded.objeto_id`;
    }
  });
}

// The objects Brian gave her.
export async function loadRegalados(): Promise<Regalado[]> {
  if (!hayBase()) return [];
  const rows = await sql()<{ objeto_id: ObjetoId; llego_en: Date }[]>`
    select objeto_id, llego_en from inventario where origen = 'regalo' order by llego_en`;
  return rows.map((r) => ({ id: r.objeto_id, at: ms(r.llego_en)! }));
}

export async function regalar(id: ObjetoId) {
  await sql()`insert into inventario (objeto_id, origen) values (${id}, 'regalo') on conflict (objeto_id) do nothing`;
}
