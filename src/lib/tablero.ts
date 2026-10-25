// What a board is — shared by the server (storage) and her screens.

export type Tipo = "imagen" | "dibujo" | "color" | "nota" | "doc" | "enlace";
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
  // doc: any file she keeps here — its name, type and size (the file is private, like images)
  nombre?: string;
  mime?: string;
  bytes?: number;
  // enlace («liga»): any web address, with the preview its page declared when she added it
  enlace?: { url: string; titulo: string | null; imagen: string | null; sitio: string | null };
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
export const MAX_DOC = 10 * 1024 * 1024; // a «doc» goes straight from her device to Blob: functions cap bodies at 4.5 MB

export const isHex = (c: unknown): c is string => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
export const imgSrc = (item: Pick<Item, "id">) => `/api/lienzo/img/${item.id}`;
export const docSrc = (item: Pick<Item, "id">) => `/api/lienzo/doc/${item.id}`;
