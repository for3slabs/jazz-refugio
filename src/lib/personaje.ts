import type { ModoId } from "./modos";

// Her characters — the same cat in different outfits, collected like player cards. Shared by
// the server and her screen. Not personal: names and pictures are the same for anyone; which
// ones she has is computed from her garden, or comes from Brian (lib/personajes.ts).
// `flores`: the garden size at which it arrives on its own (0 = from the start).
export const personajes = [
  { id: "michi", nombre: "michi", flores: 0 },
  { id: "mariachi", nombre: "michi mariachi", flores: 5 },
  { id: "chef", nombre: "michi chef", flores: 15 },
] as const;

export type PersonajeId = (typeof personajes)[number]["id"];
export type Regalado = { id: PersonajeId; at: number };

export const isPersonaje = (v: unknown): v is PersonajeId => personajes.some((p) => p.id === v);

// One drawing per mode; with no mode the cat is the happy one.
export const sprite = (id: PersonajeId, modo: ModoId | null) =>
  `/personajes/${id}/${(modo ?? "conectada").replace(" ", "-")}.webp`;

export type Tenido = { id: PersonajeId; nombre: string; como: string };

// Only the ones she HAS — never the ones still missing (the same rule as her achievements).
export function suyos(flores: number, regalados: Regalado[]): Tenido[] {
  return personajes.flatMap((p): Tenido[] => {
    const regalo = regalados.some((r) => r.id === p.id);
    if (p.flores === 0) return [{ id: p.id, nombre: p.nombre, como: "tu primer personaje" }];
    if (flores >= p.flores) return [{ id: p.id, nombre: p.nombre, como: `llegó con tus ${p.flores} flores` }];
    if (regalo) return [{ id: p.id, nombre: p.nombre, como: "un regalo de Brian" }];
    return [];
  });
}
