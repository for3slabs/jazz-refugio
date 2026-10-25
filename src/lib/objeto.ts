// Her pet's wardrobe — shared by the server and her screen. Not personal: the same objects for
// anyone. Which ones she has comes from her garden or from Brian (lib/mascota.ts); what the cat
// wears and its name are hers, in the private Blob store.
// `flores`: the garden size at which it arrives on its own (0 = from the start).

export const categorias = ["cabeza", "cuerpo", "cuello"] as const;
export type Categoria = (typeof categorias)[number];

export const objetos = [
  { id: "mono", nombre: "moño rosa", categoria: "cuello", flores: 0 },
  { id: "sombrero", nombre: "sombrero de mariachi", categoria: "cabeza", flores: 5 },
  { id: "mandil", nombre: "mandil lila", categoria: "cuerpo", flores: 10 },
  { id: "gorro-chef", nombre: "gorro de chef", categoria: "cabeza", flores: 15 },
] as const;

export type ObjetoId = (typeof objetos)[number]["id"];
export type Puestos = Partial<Record<Categoria, ObjetoId>>;
export type Mascota = { nombre: string; puestos: Puestos };
export type Regalado = { id: ObjetoId; at: number };

export const MAX_NOMBRE_MASCOTA = 20;
export const NOMBRE_INICIAL = "michi";

export const isObjeto = (v: unknown): v is ObjetoId => objetos.some((o) => o.id === v);
export const objetoDe = (id: ObjetoId) => objetos.find((o) => o.id === id)!;

// Only a real object, in its own category — anything else is dropped.
export function limpiarPuestos(v: unknown): Puestos {
  const out: Puestos = {};
  if (!v || typeof v !== "object") return out;
  for (const c of categorias) {
    const id = (v as Record<string, unknown>)[c];
    if (isObjeto(id) && objetoDe(id).categoria === c) out[c] = id;
  }
  return out;
}

export type Estante = { id: ObjetoId; nombre: string; categoria: Categoria; tiene: boolean; como: string };

// The shop: every object, with whether she has it and how it came (or comes).
export function estante(flores: number, regalados: Regalado[]): Estante[] {
  return objetos.map((o) => {
    const regalo = regalados.some((r) => r.id === o.id);
    const porJardin = flores >= o.flores;
    return {
      id: o.id,
      nombre: o.nombre,
      categoria: o.categoria,
      tiene: porJardin || regalo,
      como:
        o.flores === 0
          ? "desde el inicio"
          : porJardin
            ? `llegó con tus ${o.flores} flores`
            : regalo
              ? "un regalo de Brian"
              : `llega con ${o.flores} flores`,
    };
  });
}
