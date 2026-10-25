import { hayBase, ms, sql } from "./db";
import { type Estado, type ModoId, vigente } from "./modos";

// Her current mode is personal: one row in Postgres, never in the repo. Only the current one is
// kept — no history, on purpose: a record of her moods would make her feel watched (Brian,
// ESQUEMA.md element 1). Only she writes it. Clearing it makes it expire now; nothing is deleted.

export async function loadEstado(): Promise<Estado | null> {
  if (!hayBase()) return null;
  const [e] = await sql()<{ modo: ModoId; desde: Date }[]>`
    select modo, desde from estado_actual where persona = 'jazz' and vence > now()`;
  return vigente(e ? { modo: e.modo, at: ms(e.desde)! } : null);
}

export async function saveEstado(modo: ModoId | null): Promise<Estado | null> {
  if (!modo) {
    await sql()`update estado_actual set vence = now() where persona = 'jazz'`;
    return null;
  }
  const [e] = await sql()<{ desde: Date }[]>`
    insert into estado_actual (persona, modo, desde, vence) values ('jazz', ${modo}, now(), now() + interval '12 hours')
    on conflict (persona) do update set modo = excluded.modo, desde = excluded.desde, vence = excluded.vence
    returning desde`;
  return { modo, at: ms(e.desde)! };
}
