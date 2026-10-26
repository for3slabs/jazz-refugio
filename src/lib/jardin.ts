import { hayBase, sql } from "./db";

// How many of her flowers she has already seen grow (0013). The garden plants the rest in front
// of her when she opens it, then this catches up. Only Jazz has a garden.
export async function loadFloresVistas(): Promise<number> {
  if (!hayBase()) return 0;
  const [r] = await sql()<{ n: number }[]>`select flores_vistas as n from jardin_inicial where persona = 'jazz'`;
  return r?.n ?? 0;
}

// It only goes up: two devices opening the garden at once keep the larger count.
export async function verFlores(n: number) {
  await sql()`
    insert into jardin_inicial (persona, flores, flores_vistas) values ('jazz', 0, ${n})
    on conflict (persona) do update set flores_vistas = greatest(jardin_inicial.flores_vistas, excluded.flores_vistas)`;
}

// Her garden's size — the ONE count every screen shows: the times she came back, the missions she
// completed, and the flowers she brought from before. «volver» said «ya son 17» while the garden
// held 30, because it counted only the returns (Brian, 2026-10-25).
export async function contarFlores(): Promise<number> {
  if (!hayBase()) return 0;
  const [r] = await sql()<{ n: number }[]>`
    select ((select count(*) from momento where persona = 'jazz')
          + (select count(*) from mision where hecha_en is not null)
          + coalesce((select flores from jardin_inicial where persona = 'jazz'), 0))::int as n`;
  return r.n;
}
