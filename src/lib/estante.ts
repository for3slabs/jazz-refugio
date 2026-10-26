// Her collections — shared by the server (storage) and the screens.

export type EstadoLibro = "leyendo" | "quiero" | "leido";
export type EstadoViaje = "fui" | "quiero";
export type Libro = { id: string; titulo: string; autor: string; estado: EstadoLibro; nota: string; at: number };
export type Aprendido = { id: string; titulo: string; donde: string; nota: string; at: number };
// `desde`/`hasta`: ISO days (yyyy-mm-dd) from the calendar, or null; `cuando`: the free text the
// first trips were written with. `enlace`: optional link.
export type Viaje = {
  id: string;
  lugar: string;
  cuando: string;
  estado: EstadoViaje;
  nota: string;
  at: number;
  desde: string | null;
  hasta: string | null;
  enlace: string;
};
export type Coleccion = { libros: Libro[]; aprendido: Aprendido[]; viajes: Viaje[] };


export const MAX_TITULO = 80;
export const MAX_NOTA = 280;
export const MAX_POR_LISTA = 300;

// A spine's colour from its title: same title, same spine — always inside the app's band.
export function lomo(titulo: string) {
  let h = 0;
  for (const c of titulo) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const hue = 305 + (h % 41);
  // 0.50–0.74: never so dark that a spine disappears into the canvas
  const l = 0.5 + ((h >> 6) % 25) / 100;
  return { background: `oklch(${l.toFixed(2)} 0.14 ${hue})`, width: 26 + (titulo.length % 5) * 4, light: l > 0.62 };
}
