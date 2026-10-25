"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import {
  agregarColor,
  agregarNota,
  compartirTablero,
  editarTablero,
  moverEnTablero,
  portadaDelTablero,
  quitarDelTablero,
  soltarTablero,
} from "@/app/actions";
import { ArrowLeft, ArrowRight, Close, Pencil, Star } from "@/components/icons";
import { type Item, type Tablero, MAX_DESCRIPCION, MAX_LADO, MAX_NOMBRE, MAX_NOTA, imgSrc } from "@/lib/tablero";

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
export function Board({ tablero, isBrian }: { tablero: Tablero; isBrian: boolean }) {
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
  const [panel, setPanel] = useState<"color" | "nota" | null>(null);
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

  function run(op: () => Promise<{ ok: boolean; error: string | null }>, after?: () => void) {
    start(async () => {
      const r = await op();
      if (!r.ok) setMsg(r.error);
      else after?.();
    });
  }

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
      {editando ? (
        <form
          className="rise mt-3 space-y-3 rounded-3xl border border-line bg-surface p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => editarTablero(tablero.id, nombre, descripcion), () => {
              setEditando(false);
              router.refresh();
            });
          }}
        >
          <label className="block">
            <span className="t-label text-ink-soft">nombre</span>
            <input
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={MAX_NOMBRE}
              className="mt-1 block w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-lg focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="t-label text-ink-soft">descripción</span>
            <textarea
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={MAX_DESCRIPCION}
              placeholder="de qué va este tablero…"
              className="mt-1 block w-full resize-y rounded-2xl border border-line bg-canvas px-4 py-3 placeholder:text-ink-soft/70 focus:border-accent focus:outline-none"
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
              className="press t-label rounded-full px-4 py-2.5 text-ink-soft hover:text-ink"
            >
              cancelar
            </button>
            <button type="submit" disabled={!nombre.trim()} className="press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50">
              guardar
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="mt-3 flex items-start gap-3">
            <h1 className="t-display min-w-0 flex-1 text-4xl [overflow-wrap:anywhere]">{tablero.nombre}</h1>
            {!isBrian && (
              <button type="button" onClick={() => setEditando(true)} aria-label="editar nombre y descripción" className="press mt-1 grid size-10 shrink-0 place-items-center rounded-full border border-line text-ink-soft hover:border-accent/60 hover:text-ink">
                <Pencil className="size-4" />
              </button>
            )}
          </div>
          {tablero.descripcion ? (
            <p className="mt-2 max-w-prose whitespace-pre-line text-pretty text-lg leading-relaxed text-ink-soft">{tablero.descripcion}</p>
          ) : (
            !isBrian && (
              <button type="button" onClick={() => setEditando(true)} className="press t-label -ml-2 mt-1 rounded-full px-2 py-1.5 text-ink-soft hover:text-ink">
                + añadir descripción
              </button>
            )
          )}
        </>
      )}
      {isBrian && <p className="mt-2 text-ink-soft">Jazz lo compartió contigo. Solo puedes verlo.</p>}

      {!isBrian && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => file.current?.click()} className={chip}>
            + imagen
          </button>
          <button type="button" onClick={() => setPanel(panel === "color" ? null : "color")} aria-expanded={panel === "color"} className={chip}>
            + color
          </button>
          <button type="button" onClick={() => setPanel(panel === "nota" ? null : "nota")} aria-expanded={panel === "nota"} className={chip}>
            + nota
          </button>
          <Link href={`/lienzo/${tablero.id}/dibujar`} className={`${chip} inline-flex items-center gap-2 !border-accent/60`}>
            <Pencil className="size-4 text-accent" />
            dibujar
          </Link>
          {items.length > 1 && (
            <button type="button" onClick={() => setOrdenando(!ordenando)} aria-pressed={ordenando} className={`${chip} ${ordenando ? "!border-accent bg-accent-soft" : ""}`}>
              {ordenando ? "listo" : "ordenar"}
            </button>
          )}
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
        </div>
      )}

      {panel === "color" && (
        <form
          className="rise mt-3 flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-surface p-4"
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
          <button type="submit" className="press ml-auto rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink">
            agregar
          </button>
        </form>
      )}

      {panel === "nota" && (
        <form
          className="rise mt-3 space-y-3 rounded-3xl border border-line bg-surface p-4"
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
            className="block w-full resize-y rounded-2xl border border-line bg-canvas px-4 py-3 text-lg placeholder:text-ink-soft/70 focus:border-accent focus:outline-none"
          />
          <div className="flex justify-end">
            <button type="submit" disabled={!nota.trim()} className="press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50">
              agregar
            </button>
          </div>
        </form>
      )}

      <p role="status" className="mt-3 min-h-6 text-sm text-ink-soft">
        {subiendo ?? msg}
      </p>

      {drag && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-3xl border-2 border-dashed border-accent bg-canvas/80">
          <p className="t-label text-accent">suelta para agregar</p>
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-6 text-pretty text-lg text-ink-soft">
          {isBrian ? "Este tablero está vacío por ahora." : "Un tablero vacío es un buen comienzo. Agrega una imagen, un color o dibuja algo."}
        </p>
      ) : (
        <ul className="mt-2 columns-2 gap-3 sm:columns-3 lg:columns-4">
          {items.map((it, i) => (
            <li key={it.id} className="group relative mb-3 break-inside-avoid">
              <Tile it={it} />
              {portada === it.id && !ordenando && (
                <span className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-accent text-accent-ink shadow-sm" title="portada" aria-label="portada">
                  <Star className="size-4" />
                </span>
              )}
              {!isBrian && ordenando && (
                <div className="absolute inset-x-2 bottom-2 flex justify-between">
                  {([-1, 1] as const).map((paso) => (
                    <button
                      key={paso}
                      type="button"
                      disabled={(paso === -1 && i === 0) || (paso === 1 && i === items.length - 1)}
                      onClick={() => start(async () => {
                        cambiar({ mover: it.id, paso });
                        const r = await moverEnTablero(tablero.id, it.id, paso);
                        if (!r.ok) setMsg(r.error);
                      })}
                      aria-label={paso === -1 ? "mover antes" : "mover después"}
                      className="press grid size-9 place-items-center rounded-full bg-canvas/90 text-ink shadow-sm disabled:opacity-30"
                    >
                      {paso === -1 ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                    </button>
                  ))}
                </div>
              )}
              {!isBrian && !ordenando && (it.tipo === "imagen" || it.tipo === "dibujo") && portada !== it.id && (
                <button
                  type="button"
                  onClick={() => start(async () => {
                    setPortada(it.id);
                    const r = await portadaDelTablero(tablero.id, it.id);
                    setMsg(r.ok ? "listo, es la portada" : r.error);
                  })}
                  aria-label="usar como portada"
                  className="press absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-canvas/85 text-ink-soft opacity-100 hover:text-accent sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <Star className="size-4" />
                </button>
              )}
              {!isBrian && !ordenando && (
                <button
                  type="button"
                  onClick={() => start(async () => {
                    cambiar({ quitar: it.id });
                    const r = await quitarDelTablero(tablero.id, it.id);
                    if (!r.ok) setMsg(r.error);
                  })}
                  aria-label="quitar"
                  className="press absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-canvas/85 text-ink-soft opacity-100 hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <Close className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isBrian && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-line pt-5">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={compartido}
              onChange={(e) => {
                const si = e.target.checked;
                start(async () => {
                  setCompartido(si);
                  const r = await compartirTablero(tablero.id, si);
                  setMsg(r.ok ? (si ? "listo, Brian puede verlo" : "listo, ya es solo tuyo") : r.error);
                });
              }}
              className="size-5 accent-[var(--accent)]"
            />
            <span>compartir con Brian <span className="text-ink-soft">(solo verlo)</span></span>
          </label>
          {seguro ? (
            <p className="flex items-center gap-3 text-ink-soft">
              ¿Lo borras? Podrás deshacerlo.
              <button
                type="button"
                onClick={() => run(() => soltarTablero(tablero.id), () => router.push(`/lienzo?soltado=${tablero.id}`))}
                className="press t-label rounded-full border border-line px-3 py-1.5 text-ink hover:border-accent/60"
              >
                sí, borrar
              </button>
              <button type="button" onClick={() => setSeguro(false)} className="press t-label px-2 py-1.5 hover:text-ink">
                no
              </button>
            </p>
          ) : (
            <button type="button" onClick={() => setSeguro(true)} className="press t-label rounded-full px-2 py-1.5 text-ink-soft hover:text-ink">
              borrar tablero
            </button>
          )}
        </div>
      )}
    </div>
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
    return <p className="whitespace-pre-line rounded-2xl border border-line bg-surface p-4 pr-11 text-pretty leading-relaxed">«{it.texto}»</p>;
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
