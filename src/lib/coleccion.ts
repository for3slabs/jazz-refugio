import { get, put } from "@vercel/blob";
import { type Coleccion, type Deseos, type EstadoLibro, type EstadoViaje, MAX_POR_LISTA } from "./estante";

// Her books, what she learned and her trips. Personal, so they live in the private Blob
// store; only she writes. Brian gets her wishes only (`deseos`), to give her gifts.
const PATH = process.env.VERCEL_ENV === "production" ? "coleccion/coleccion.json" : "coleccion/dev.json";
const EMPTY: Coleccion = { libros: [], aprendido: [], viajes: [] };

const str = (v: unknown) => (typeof v === "string" ? v : "");
const ok = (x: { id?: unknown; at?: unknown }) => typeof x?.id === "string" && typeof x?.at === "number";

function parse(raw: string): Coleccion {
  try {
    const d = JSON.parse(raw);
    const arr = (v: unknown) => (Array.isArray(v) ? v.filter(ok) : []);
    return {
      libros: arr(d?.libros).map((l) => ({
        id: l.id,
        at: l.at,
        titulo: str(l.titulo),
        autor: str(l.autor),
        nota: str(l.nota),
        estado: ["leyendo", "quiero", "leido"].includes(l.estado) ? l.estado : "quiero",
      })),
      aprendido: arr(d?.aprendido).map((a) => ({ id: a.id, at: a.at, titulo: str(a.titulo), donde: str(a.donde), nota: str(a.nota) })),
      viajes: arr(d?.viajes).map((v) => ({
        id: v.id,
        at: v.at,
        lugar: str(v.lugar),
        cuando: str(v.cuando),
        nota: str(v.nota),
        estado: v.estado === "fui" ? "fui" : "quiero",
      })),
    };
  } catch (cause) {
    throw new Error(`${PATH} is unreadable: refusing to treat it as empty`, { cause });
  }
}

export async function loadColeccion(): Promise<Coleccion> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return EMPTY;
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res?.stream) return EMPTY;
  return parse(await new Response(res.stream).text());
}

async function change(fn: (c: Coleccion) => string | void): Promise<string | void> {
  const c = await loadColeccion();
  const err = fn(c);
  if (err) return err;
  await put(PATH, JSON.stringify(c), { access: "private", allowOverwrite: true, addRandomSuffix: false, contentType: "application/json" });
}

export const deseos = (c: Coleccion): Deseos => ({
  libros: c.libros.filter((l) => l.estado === "quiero").map(({ id, titulo, autor }) => ({ id, titulo, autor })),
  viajes: c.viajes.filter((v) => v.estado === "quiero").map(({ id, lugar, cuando }) => ({ id, lugar, cuando })),
});

type Lista = keyof Coleccion;
const lleno = "Esta lista ya está muy llena. Suelta algo primero.";
const nuevo = () => ({ id: crypto.randomUUID(), at: Date.now() });

export const agregarLibro = (titulo: string, autor: string, estado: EstadoLibro, nota: string) =>
  change((c) => (c.libros.length >= MAX_POR_LISTA ? lleno : void c.libros.unshift({ ...nuevo(), titulo, autor, estado, nota })));

export const agregarAprendido = (titulo: string, donde: string, nota: string) =>
  change((c) => (c.aprendido.length >= MAX_POR_LISTA ? lleno : void c.aprendido.unshift({ ...nuevo(), titulo, donde, nota })));

export const agregarViaje = (lugar: string, cuando: string, estado: EstadoViaje, nota: string) =>
  change((c) => (c.viajes.length >= MAX_POR_LISTA ? lleno : void c.viajes.unshift({ ...nuevo(), lugar, cuando, estado, nota })));

// Moving a book or a trip to its next state («lo terminé», «¡ya fui!») keeps everything else.
export const moverLibro = (id: string, estado: EstadoLibro) =>
  change((c) => {
    const l = c.libros.find((x) => x.id === id);
    if (l) l.estado = estado;
  });

export const moverViaje = (id: string, estado: EstadoViaje) =>
  change((c) => {
    const v = c.viajes.find((x) => x.id === id);
    if (v) v.estado = estado;
  });

export const soltarDe = (lista: Lista, id: string) =>
  change((c) => {
    if (lista === "libros") c.libros = c.libros.filter((x) => x.id !== id);
    else if (lista === "aprendido") c.aprendido = c.aprendido.filter((x) => x.id !== id);
    else c.viajes = c.viajes.filter((x) => x.id !== id);
  });
