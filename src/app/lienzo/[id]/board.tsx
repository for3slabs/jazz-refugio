"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { upload as subirDirecto } from "@vercel/blob/client";
import {
  agregarColor,
  agregarLiga,
  agregarNota,
  compartirTablero,
  editarTablero,
  moverEnTablero,
  portadaDelTablero,
  quitarDelTablero,
  registrarDoc,
  soltarTablero,
} from "@/app/actions";
import { ArrowLeft, ArrowRight, Close, Pencil, Plus, Star, Trash } from "@/components/icons";
import { type Item, type Tablero, MAX_DESCRIPCION, MAX_DOC, MAX_LADO, MAX_NOMBRE, MAX_NOTA, docSrc, imgSrc } from "@/lib/tablero";

// Shrunk on her device before it travels: 1600 px on the long side, WebP where the browser
// can encode it (Safari falls back to PNG, which the server also takes).
async function shrink(file: File) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX_LADO / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k));
  const h = Math.max(1, Math.round(bmp.height * k));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.85));
  if (!blob) throw new Error("no se pudo codificar");
  return { blob, w, h };
}

export async function upload(tablero: string, tipo: "imagen" | "dibujo", blob: Blob, w: number, h: number) {
  const form = new FormData();
  form.set("tablero", tablero);
  form.set("tipo", tipo);
  form.set("w", String(w));
  form.set("h", String(h));
  form.set("file", blob);
  const res = await fetch("/api/lienzo/subir", { method: "POST", body: form });
  if (!res.ok) throw new Subida(((await res.json().catch(() => null)) as { error?: string } | null)?.error ?? "No se pudo subir.");
}

// A failure the server explained in her words — every other one (the browser's own, in
// English) becomes a plain Spanish sentence.
class Subida extends Error {}
export const enPalabras = (e: unknown, otro: string) => (e instanceof Subida ? e.message : otro);

// One board: an inspiration wall that settles into columns. She adds images (or drags them
// in), colours, notes and drawings; Brian, on a board she shared, only looks.
// `docs`: the Blob folder for her docs, chosen by the server (the upload route only allows that one).
export function Board({ tablero, isBrian, docs: carpetaDocs }: { tablero: Tablero; isBrian: boolean; docs: string }) {
  const router = useRouter();
  // what she sees changes at once; the server's answer follows
  const [items, cambiar] = useOptimistic(tablero.items, (l: Item[], a: { quitar: string } | { mover: string; paso: -1 | 1 }) => {
    if ("quitar" in a) return l.filter((i) => i.id !== a.quitar);
    const i = l.findIndex((x) => x.id === a.mover);
    const j = i + a.paso;
    if (i < 0 || j < 0 || j >= l.length) return l;
    const n = [...l];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  const [portada, setPortada] = useOptimistic(tablero.portada);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(tablero.nombre);
  const [descripcion, setDescripcion] = useState(tablero.descripcion);
  const [ordenando, setOrdenando] = useState(false);
  const [compartido, setCompartido] = useOptimistic(tablero.compartido);
  const [, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [panel, setPanel] = useState<"color" | "nota" | "liga" | null>(null);
  const [liga, setLiga] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const hoja = useRef<HTMLDialogElement>(null);
  const docs = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState("#9d4edd");
  const [nota, setNota] = useState("");
  const [seguro, setSeguro] = useState(false);
  const [drag, setDrag] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(id);
  }, [msg]);

  async function addFiles(list: FileList | File[]) {
    const files = [...list].filter((f) => f.type.startsWith("image/"));
    for (let i = 0; i < files.length; i++) {
      setSubiendo(files.length > 1 ? `subiendo ${i + 1} de ${files.length}…` : "subiendo…");
      try {
        const { blob, w, h } = await shrink(files[i]);
        await upload(tablero.id, "imagen", blob, w, h);
      } catch (e) {
        setMsg(enPalabras(e, "Esa imagen no se pudo leer. Prueba con otra."));
        break;
      }
    }
    setSubiendo(null);
    router.refresh();
  }

  // A doc goes straight from her device to the private store (up to 10 MB), then joins the board.
  async function addDocs(list: FileList) {
    const files = [...list];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.size > MAX_DOC) {
        setMsg(`«${f.name}» pesa más de 10 MB.`);
        continue;
      }
      setSubiendo(files.length > 1 ? `subiendo ${i + 1} de ${files.length}…` : `subiendo «${f.name}»…`);
      try {
        const limpio = f.name.replace(/[^\w.\-]+/g, "-").slice(-80) || "doc";
        const b = await subirDirecto(`${carpetaDocs}/${limpio}`, f, { access: "private", handleUploadUrl: "/api/lienzo/doc/subir" });
        const r = await registrarDoc(tablero.id, b.pathname, f.name, f.type);
        if (!r.ok) setMsg(r.error);
      } catch {
        setMsg(`«${f.name}» no se pudo subir. Inténtalo otra vez.`);
      }
    }
    setSubiendo(null);
    router.refresh();
  }

  function run(op: () => Promise<{ ok: boolean; error: string | null }>, after?: () => void) {
    start(async () => {
      const r = await op();
      if (!r.ok) setMsg(r.error);
      else after?.();
    });
  }

  const elegir = (que: "imagen" | "color" | "nota" | "doc" | "liga") => {
    hoja.current?.close();
    if (que === "imagen") file.current?.click();
    else if (que === "doc") docs.current?.click();
    else setPanel(que);
  };
  const actual = abierto ? items.find((x) => x.id === abierto) : undefined;

  return (
    <div
      className="relative mt-6"
      onDragOver={(e) => {
        if (isBrian) return;
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        if (isBrian) return;
        e.preventDefault();
        setDrag(false);
        void addFiles(e.dataTransfer.files);
      }}
    >
      <Link href="/lienzo" className="press t-label -ml-2 inline-flex items-center gap-2 rounded-full px-2 py-2 text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" />
        tableros
      </Link>

      {/* Like a goal in «misiones» (Brian, 2026-10-25): the name with its pencil and its trash can
          beside it, the description under it, and sharing as a switch — nothing hidden at the bottom. */}
      {editando ? (
        <form
          className="rise mt-3 space-y-3 rounded-2xl border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => editarTablero(tablero.id, nombre, descripcion), () => {
              setEditando(false);
              router.refresh();
            });
          }}
        >
          <label className="block">
            <span className="sr-only">nombre</span>
            <input
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={MAX_NOMBRE}
              className="block w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 font-medium focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="sr-only">descripción</span>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={MAX_DESCRIPCION}
              placeholder="de qué va este tablero · opcional"
              className="block w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm placeholder:text-ink-soft focus:border-accent focus:outline-none"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setNombre(tablero.nombre);
                setDescripcion(tablero.descripcion);
                setEditando(false);
              }}
              className="press rounded-full px-3 py-2 text-sm text-ink-soft hover:text-ink"
            >
              cancelar
            </button>
            <button type="submit" disabled={!nombre.trim()} className="press rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50">
              guardar
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="mt-2 flex items-start gap-1">
            <h1 className="t-display min-w-0 flex-1 text-3xl [overflow-wrap:anywhere]">{tablero.nombre}</h1>
            {!isBrian && (
              <>
                <button
                  type="button"
                  onClick={() => setEditando(true)}
                  aria-label="editar nombre y descripción"
                  className="press grid size-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSeguro(!seguro)}
                  aria-expanded={seguro}
                  aria-label="borrar el tablero"
                  className="press -mr-2 grid size-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
                >
                  <Trash className="size-4" />
                </button>
              </>
            )}
          </div>
          {seguro && (
            <div className="rise mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
              <p className="mr-auto text-pretty text-ink-soft">¿Lo borras? Podrás deshacerlo 30 días.</p>
              <button type="button" onClick={() => setSeguro(false)} className="press rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink">
                no
              </button>
              <button
                type="button"
                onClick={() => run(() => soltarTablero(tablero.id), () => router.push(`/lienzo?soltado=${tablero.id}`))}
                className="press rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-accent/60"
              >
                sí, borrar
              </button>
            </div>
          )}
          {tablero.descripcion && <p className="mt-1 max-w-prose whitespace-pre-line text-pretty text-sm text-ink-soft">{tablero.descripcion}</p>}
        </>
      )}
      {isBrian && <p className="mt-2 text-sm text-ink-soft">Jazz lo compartió contigo. Solo puedes verlo.</p>}

      {!isBrian && (
        <button
          type="button"
          role="switch"
          aria-checked={compartido}
          onClick={() => {
            const si = !compartido;
            start(async () => {
              setCompartido(si);
              const r = await compartirTablero(tablero.id, si);
              setMsg(r.ok ? (si ? "listo, Brian puede verlo" : "listo, ya es solo tuyo") : r.error);
            });
          }}
          className="press mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pl-2 pr-3 text-xs font-semibold hover:border-accent/60"
        >
          <span aria-hidden className="relative h-4 w-6 rounded-full bg-accent-soft">
            <span
              className={`absolute left-0.5 top-0.5 size-3 rounded-full transition-transform duration-200 ease-[var(--ease-out-strong)] ${
                compartido ? "translate-x-2 bg-accent" : "translate-x-0 bg-ink-soft/60"
              }`}
            />
          </span>
          {compartido ? "compartido con Brian" : "solo tuyo"}
        </button>
      )}

      {!isBrian && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => hoja.current?.showModal()} className="press inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
            <Plus className="size-4" />
            agregar
          </button>
          {/* no prefetch: it fired two extra function calls the moment a board appeared (measured) */}
          <Link href={`/lienzo/${tablero.id}/dibujar`} prefetch={false} className={`${chip} inline-flex items-center gap-2 !border-accent/60`}>
            <Pencil className="size-4 text-accent" />
            dibujar
          </Link>
          <input
            ref={file}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={docs}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) void addDocs(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {panel === "color" && (
        <form
          className="rise mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => agregarColor(tablero.id, color), () => setPanel(null));
          }}
        >
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="color" className="size-12 cursor-pointer rounded-xl border border-line bg-transparent" />
          <input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="código del color"
            maxLength={7}
            className="w-28 rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-sm uppercase"
          />
          <button type="button" onClick={() => setPanel(null)} className="press ml-auto rounded-full px-3 py-2 text-sm text-ink-soft hover:text-ink">
            cancelar
          </button>
          <button type="submit" className="press rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink">
            agregar
          </button>
        </form>
      )}

      {panel === "nota" && (
        <form
          className="rise mt-3 space-y-3 rounded-2xl border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => agregarNota(tablero.id, nota), () => {
              setNota("");
              setPanel(null);
            });
          }}
        >
          <textarea
            autoFocus
            rows={3}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={MAX_NOTA}
            placeholder="una idea, una frase, una referencia…"
            aria-label="nota"
            className="block w-full resize-y rounded-xl border border-line bg-canvas px-4 py-3 placeholder:text-ink-soft/70 focus:border-accent focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPanel(null)} className="press rounded-full px-3 py-2 text-sm text-ink-soft hover:text-ink">
              cancelar
            </button>
            <button type="submit" disabled={!nota.trim()} className="press rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50">
              agregar
            </button>
          </div>
        </form>
      )}

      {panel === "liga" && (
        <form
          className="rise mt-3 space-y-3 rounded-2xl border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => agregarLiga(tablero.id, liga), () => {
              setLiga("");
              setPanel(null);
            });
          }}
        >
          {/* text with a URL keyboard: type="url" would silently refuse «pinterest.com» without https:// */}
          <input
            autoFocus
            type="text"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            value={liga}
            onChange={(e) => setLiga(e.target.value)}
            maxLength={500}
            placeholder="pega una liga: pinterest, behance, figma…"
            aria-label="liga"
            className="block w-full rounded-xl border border-line bg-canvas px-4 py-3 placeholder:text-ink-soft/70 focus:border-accent focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setPanel(null)} className="press rounded-full px-3 py-2 text-sm text-ink-soft hover:text-ink">
              cancelar
            </button>
            <button type="submit" disabled={!liga.trim()} className="press rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50">
              agregar
            </button>
          </div>
        </form>
      )}

      {(subiendo ?? msg) && (
        <p role="status" className="mt-3 text-sm text-ink-soft">
          {subiendo ?? msg}
        </p>
      )}

      {drag && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-3xl border-2 border-dashed border-accent bg-canvas/80">
          <p className="t-label text-accent">suelta para agregar</p>
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-6 text-pretty text-ink-soft">
          {isBrian ? "Este tablero está vacío por ahora." : "Un tablero vacío es un buen comienzo: agrega algo o dibuja."}
        </p>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-ink-soft">{items.length === 1 ? "1 cosa" : `${items.length} cosas`}</p>
            {!isBrian && items.length > 1 && (
              <button
                type="button"
                onClick={() => setOrdenando(!ordenando)}
                aria-pressed={ordenando}
                className={`press rounded-full px-3 py-1.5 text-xs font-semibold ${ordenando ? "bg-accent-soft text-ink" : "text-ink-soft hover:text-ink"}`}
              >
                {ordenando ? "listo" : "ordenar"}
              </button>
            )}
          </div>
          {/* nothing on top of the things: a tap opens one big, and its actions live there */}
          <ul className="mt-2 columns-2 gap-3 sm:columns-3 lg:columns-4">
            {items.map((it, i) => (
              <li key={it.id} className="relative mb-3 break-inside-avoid">
                <button
                  type="button"
                  disabled={ordenando}
                  onClick={() => setAbierto(it.id)}
                  aria-label={`abrir ${etiqueta(it)}`}
                  className="press block w-full text-left disabled:cursor-default"
                >
                  <Tile it={it} />
                </button>
                {portada === it.id && !ordenando && (
                  <span className="pointer-events-none absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-accent text-accent-ink shadow-sm" aria-label="portada">
                    <Star className="size-3.5" />
                  </span>
                )}
                {!isBrian && ordenando && (
                  <div className="absolute inset-x-2 bottom-2 flex justify-between">
                    {([-1, 1] as const).map((paso) => (
                      <button
                        key={paso}
                        type="button"
                        disabled={(paso === -1 && i === 0) || (paso === 1 && i === items.length - 1)}
                        onClick={() =>
                          start(async () => {
                            cambiar({ mover: it.id, paso });
                            const r = await moverEnTablero(tablero.id, it.id, paso);
                            if (!r.ok) setMsg(r.error);
                          })
                        }
                        aria-label={paso === -1 ? "mover antes" : "mover después"}
                        className="press grid size-9 place-items-center rounded-full bg-canvas/90 text-ink shadow-sm disabled:opacity-30"
                      >
                        {paso === -1 ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* «＋ agregar»: one entry, five kinds */}
      <dialog
        ref={hoja}
        aria-label="agregar al tablero"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="sheet m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-[1.75rem] border border-b-0 border-line bg-surface p-0 text-ink backdrop:bg-transparent sm:mx-auto sm:max-w-md lg:m-auto lg:rounded-[1.75rem] lg:border-b"
      >
        <div className="px-6 pb-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">agregar</h2>
            <button type="button" aria-label="cerrar" onClick={() => hoja.current?.close()} className="press -mr-2 grid size-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink">
              <Close className="size-5" />
            </button>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {(
              [
                ["imagen", "de tu galería"],
                ["color", "un tono que te guste"],
                ["nota", "una idea en palabras"],
                ["doc", "cualquier archivo, hasta 10 MB"],
                ["liga", "una página web"],
              ] as const
            ).map(([k, sub]) => (
              <li key={k}>
                <button type="button" onClick={() => elegir(k)} className="press flex h-full w-full flex-col items-start gap-1 rounded-2xl border border-line bg-surface-2 p-4 text-left hover:border-accent/60">
                  <span className="font-semibold">{k}</span>
                  <span className="text-xs text-ink-soft">{sub}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>

      {actual && (
        <Visor
          it={actual}
          esPortada={portada === actual.id}
          isBrian={isBrian}
          cerrar={() => setAbierto(null)}
          portada={() => {
            const nueva = portada === actual.id ? null : actual.id;
            start(async () => {
              setPortada(nueva);
              const r = await portadaDelTablero(tablero.id, nueva);
              setMsg(r.ok ? (nueva ? "listo, es la portada" : "listo, ya no es la portada") : r.error);
            });
          }}
          quitar={() => {
            setAbierto(null);
            start(async () => {
              cambiar({ quitar: actual.id });
              const r = await quitarDelTablero(tablero.id, actual.id);
              if (!r.ok) setMsg(r.error);
            });
          }}
        />
      )}
    </div>
  );
}

const etiqueta = (it: Item) =>
  it.tipo === "nota" ? "la nota" : it.tipo === "color" ? `el color ${it.color}` : it.tipo === "doc" ? `«${it.nombre}»` : it.tipo === "enlace" ? `la liga ${it.enlace?.sitio ?? ""}` : it.tipo === "dibujo" ? "el dibujo" : "la imagen";

const peso = (b?: number) => (!b ? "" : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);
const extension = (n?: string) => (n?.includes(".") ? n.split(".").pop()!.slice(0, 5).toUpperCase() : "DOC");

// One thing, big, over the board: the image or drawing whole, the note to read, the colour with
// its code, the doc and the liga with «abrir». Its actions live here: ☆ portada (a tap marks it,
// another unmarks it — images and drawings only) and «quitar».
function Visor({
  it,
  esPortada,
  isBrian,
  cerrar,
  portada,
  quitar,
}: {
  it: Item;
  esPortada: boolean;
  isBrian: boolean;
  cerrar: () => void;
  portada: () => void;
  quitar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const imagen = it.tipo === "imagen" || it.tipo === "dibujo";
  return (
    <dialog
      ref={ref}
      aria-label={etiqueta(it)}
      onClose={cerrar}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-canvas/95 p-0 text-ink backdrop:bg-canvas/80"
    >
      <div className="mx-auto flex h-full max-w-3xl flex-col px-4 pb-6 pt-4">
        <div className="flex items-center justify-end">
          <button type="button" aria-label="cerrar" onClick={() => ref.current?.close()} className="press grid size-11 place-items-center rounded-full bg-surface text-ink hover:bg-surface-2">
            <Close className="size-5" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center py-4">
          {imagen && (
            <Image
              src={imgSrc(it)}
              alt={etiqueta(it)}
              width={it.w ?? 1200}
              height={it.h ?? 900}
              unoptimized
              priority
              className={`max-h-full w-auto max-w-full rounded-2xl object-contain ${it.tipo === "dibujo" ? "bg-[#fbf7fc]" : ""}`}
            />
          )}
          {it.tipo === "nota" && <p className="max-w-prose whitespace-pre-line text-pretty text-2xl leading-relaxed">«{it.texto}»</p>}
          {it.tipo === "color" && (
            <div className="w-full max-w-sm">
              <div className="aspect-square w-full rounded-3xl border border-line" style={{ background: it.color }} />
              <p className="mt-3 text-center font-mono text-lg uppercase">{it.color}</p>
            </div>
          )}
          {it.tipo === "doc" && (
            <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 text-center">
              <p className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent-soft text-sm font-bold text-accent">{extension(it.nombre)}</p>
              <p className="mt-4 break-words font-semibold">{it.nombre}</p>
              <p className="mt-1 text-sm text-ink-soft">{peso(it.bytes)}</p>
              <a href={docSrc(it)} target="_blank" rel="noopener noreferrer" className="press mt-5 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
                abrir
              </a>
            </div>
          )}
          {it.tipo === "enlace" && it.enlace && (
            <a href={it.enlace.url} target="_blank" rel="noopener noreferrer" className="press block w-full max-w-md overflow-hidden rounded-3xl border border-line bg-surface">
              {it.enlace.imagen && (
                // eslint-disable-next-line @next/next/no-img-element -- any site's image; next/image would need every host listed
                <img src={it.enlace.imagen} alt="" referrerPolicy="no-referrer" className="aspect-video w-full object-cover" />
              )}
              <span className="block p-4">
                {it.enlace.titulo && <span className="block font-semibold">{it.enlace.titulo}</span>}
                <span className="mt-0.5 block text-sm text-ink-soft">{it.enlace.sitio ?? it.enlace.url}</span>
                <span className="mt-3 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">abrir</span>
              </span>
            </a>
          )}
        </div>
        {!isBrian && (
          <div className="flex items-center justify-center gap-3">
            {imagen && (
              <button
                type="button"
                onClick={portada}
                aria-pressed={esPortada}
                className={`press inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold ${esPortada ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface hover:border-accent/60"}`}
              >
                <Star className="size-4" />
                {esPortada ? "es la portada" : "usar de portada"}
              </button>
            )}
            <button type="button" onClick={quitar} className="press inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-accent/60">
              <Trash className="size-4" />
              quitar
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}

const chip = "press rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold hover:border-accent/60";

function Tile({ it }: { it: Item }) {
  if (it.tipo === "color")
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="aspect-[4/3]" style={{ background: it.color }} />
        <p className="px-3 py-2 font-mono text-xs uppercase text-ink-soft">{it.color}</p>
      </div>
    );
  if (it.tipo === "nota")
    return <p className="whitespace-pre-line rounded-2xl border border-line bg-surface p-4 text-pretty leading-relaxed">«{it.texto}»</p>;
  if (it.tipo === "doc")
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-[0.625rem] font-bold text-accent">{extension(it.nombre)}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{it.nombre}</span>
          <span className="block text-xs text-ink-soft">{peso(it.bytes)}</span>
        </span>
      </div>
    );
  if (it.tipo === "enlace" && it.enlace)
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {it.enlace.imagen && (
          // eslint-disable-next-line @next/next/no-img-element -- any site's image; next/image would need every host listed
          <img src={it.enlace.imagen} alt="" loading="lazy" referrerPolicy="no-referrer" className="aspect-video w-full bg-surface-2 object-cover" />
        )}
        <span className="block px-3 py-2">
          {it.enlace.titulo && <span className="block truncate text-sm font-medium">{it.enlace.titulo}</span>}
          <span className="flex items-center gap-1 text-xs text-ink-soft">
            <ArrowRight className="size-3 shrink-0 -rotate-45" />
            <span className="truncate">{it.enlace.sitio ?? it.enlace.url}</span>
          </span>
        </span>
      </div>
    );
  return (
    <Image
      src={imgSrc(it)}
      alt={it.tipo === "dibujo" ? "un dibujo tuyo" : ""}
      width={it.w ?? 800}
      height={it.h ?? 600}
      unoptimized
      className={`h-auto w-full rounded-2xl border border-line ${it.tipo === "dibujo" ? "bg-[#fbf7fc]" : "bg-surface-2"}`}
    />
  );
}
