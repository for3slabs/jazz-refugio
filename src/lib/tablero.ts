// What a board is — shared by the server (storage) and her screens.

export type Tipo = "imagen" | "dibujo" | "color" | "nota";
export type Item = {
  id: string;
  tipo: Tipo;
  at: number;
  // imagen / dibujo: the private blob and its size (for the layout before it loads)
  path?: string;
  w?: number;
  h?: number;
  color?: string; // color: «#rrggbb»
  texto?: string; // nota
};
// `portada`: the image she chose as the board's cover; without one, the list shows its first four.
export type Tablero = {
  id: string;
  nombre: string;
  descripcion: string;
  portada: string | null;
  at: number;
  compartido: boolean;
  items: Item[];
};

export const MAX_TABLEROS = 12;
export const MAX_ITEMS = 60;
export const MAX_NOMBRE = 40;
export const MAX_NOTA = 280;
export const MAX_DESCRIPCION = 280;
export const MAX_LADO = 1600;
export const MAX_BYTES = 4 * 1024 * 1024;

export const isHex = (c: unknown): c is string => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
export const imgSrc = (item: Pick<Item, "id">) => `/api/lienzo/img/${item.id}`;
