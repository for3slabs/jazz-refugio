import { hayBase, ms, sql } from "./db";
import type { Role } from "./token";
import type { Deseo } from "./deseo";

export { MAX_DESCRIPCION_DESEO, MAX_DESEO, type Deseo } from "./deseo";

const esId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

export async function loadLibroDeseos(quien: Role): Promise<Deseo[]> {
  if (!hayBase()) return [];
  const rows = await sql()<
    { id: string; de: Role; titulo: string; descripcion: string; enlace: string; creado: Date; visto_en: Date | null; regalado_en: Date | null }[]
  >`select id, de, titulo, descripcion, enlace, creado, visto_en, regalado_en
    from deseo where para = 'jazz' and soltado_en is null order by creado desc`;
  return rows.map((r) => ({
    id: r.id,
    de: r.de,
    titulo: r.titulo,
    descripcion: r.descripcion,
    enlace: r.enlace,
    at: ms(r.creado)!,
    visto: ms(r.visto_en),
    regalado: quien === "brian" ? ms(r.regalado_en) : null,
  }));
}

export async function crearDeseo(de: Role, titulo: string, descripcion: string, enlace: string) {
  await sql()`insert into deseo (de, titulo, descripcion, enlace) values (${de}, ${titulo}, ${descripcion}, ${enlace})`;
}

// She opened the dove: Brian's wish is seen (only hers to mark).
export async function verDeseo(id: string) {
  if (!esId(id)) return;
  await sql()`update deseo set visto_en = coalesce(visto_en, now()) where id = ${id} and de = 'brian' and para = 'jazz'`;
}

// «ya se lo regalé»: Brian's mark on HER wishes.
export async function regalarDeseo(id: string, si: boolean) {
  if (!esId(id)) return;
  await sql()`update deseo set regalado_en = ${si ? sql()`now()` : null} where id = ${id} and de = 'jazz'`;
}

// Each one lets go only of what they wrote.
export async function soltarDeseo(de: Role, id: string) {
  if (!esId(id)) return;
  await sql()`update deseo set soltado_en = now() where id = ${id} and de = ${de}`;
}
