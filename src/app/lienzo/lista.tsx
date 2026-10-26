"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deshacerTablero } from "@/app/actions";
import { Palette, Plus, Undo } from "@/components/icons";
import { type Item, type Tablero, MAX_TABLEROS, imgSrc } from "@/lib/tablero";

// Her boards as covers — the image she chose, or her first things — so she knows which is which at
// a glance. Shaped like «misiones» (Brian, 2026-10-25): a section title, creating FIRST (the first
// card, not a field after every board), and every card the same height with one line under it.
export function Lista({
  tableros,
  soltado = null,
}: {
  tableros: Tablero[];
  soltado?: { id: string; nombre: string } | null;
}) {
  const router = useRouter();
  const [deshecho, setDeshecho] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold">{"tus tableros"}</h2>
      <p className="mt-0.5 text-pretty text-sm text-ink-soft">
        {"imágenes, colores, notas y dibujos"}
      </p>
      <div className="mt-3">
      {soltado && !deshecho && !tableros.some((t) => t.id === soltado.id) && (
        <p role="status" className="rise mb-5 flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-surface px-5 py-3">
          <span className="min-w-0 flex-1 text-pretty">
            «{soltado.nombre}» se fue <span className="text-ink-soft">· se puede recuperar 30 días</span>
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await deshacerTablero(soltado.id);
                if (!r.ok) return setError(r.error);
                setDeshecho(true);
                router.replace("/lienzo");
              })
            }
            className="press inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-50"
          >
            <Undo className="size-4" />
            deshacer
          </button>
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <>
          <li>
            <Nuevo lleno={tableros.length >= MAX_TABLEROS} />
          </li>
        </>
        {tableros.map((t, i) => (
          <li key={t.id} className="rise" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
            <Link
              href={`/lienzo/${t.id}`}
              className="press group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface hover:border-accent/60"
            >
              <Portada t={t} />
              <span className="block px-3.5 py-3">
                <span className="block truncate font-medium">{t.nombre}</span>
                <span className="mt-0.5 block truncate text-xs text-ink-soft">
                  {t.items.length === 1 ? "1 cosa" : `${t.items.length} cosas`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      </div>

      {error && <p className="mt-2 text-sm text-ink-soft">{error}</p>}
    </div>
  );
}

// The cover follows what the board holds, never empty squares: the image she chose, or one thing
// filling it, two side by side, one large beside two, four in a grid; an empty board, a soft palette.
function Portada({ t }: { t: Tablero }) {
  const elegida = t.portada ? t.items.find((x) => x.id === t.portada) : undefined;
  const cosas = elegida ? [elegida] : t.items.slice(0, 4);
  if (cosas.length === 0)
    return (
      <span className="grid aspect-square place-items-center bg-surface-2 text-ink-soft/50">
        <Palette className="size-8" />
      </span>
    );
  const forma =
    cosas.length === 1
      ? "grid-cols-1"
      : cosas.length === 2
        ? "grid-cols-2"
        : cosas.length === 3
          ? "grid-cols-2 grid-rows-2 [&>*:first-child]:row-span-2"
          : "grid-cols-2 grid-rows-2";
  return (
    // overflow + min-h-0 on the cells: a 400 px image must not stretch the square (it did — rows of 302 and 363 px)
    <span className={`grid aspect-square gap-0.5 overflow-hidden bg-line/40 *:min-h-0 *:min-w-0 ${forma}`}>
      {cosas.map((it) => (
        <Cosa key={it.id} it={it} />
      ))}
    </span>
  );
}

// Each kind in a cover cell: images and drawings from her store, a liga by its page's own image
// (or its site), a doc by its type — never through the image route, which only serves images
// (a doc or liga there answered 404 and showed a broken image).
function Cosa({ it }: { it: Item }) {
  if (it.tipo === "color") return <span className="block size-full" style={{ background: it.color }} />;
  if (it.tipo === "nota")
    return <span className="block size-full overflow-hidden bg-surface-2 p-2 text-[0.6875rem] leading-tight text-ink-soft">{it.texto}</span>;
  if (it.tipo === "enlace")
    return it.enlace?.imagen ? (
      // eslint-disable-next-line @next/next/no-img-element -- any site's image; next/image would need every host listed
      <img src={it.enlace.imagen} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full object-cover" />
    ) : (
      <span className="grid size-full place-items-center bg-surface-2 p-2 text-center text-[0.6875rem] text-ink-soft">{it.enlace?.sitio ?? "liga"}</span>
    );
  if (it.tipo === "doc")
    return (
      <span className="grid size-full place-items-center bg-surface-2">
        <span className="rounded-lg bg-accent-soft px-2 py-1 text-[0.625rem] font-bold text-accent">
          {it.nombre?.includes(".") ? it.nombre.split(".").pop()!.slice(0, 5).toUpperCase() : "DOC"}
        </span>
      </span>
    );
  return <Image src={imgSrc(it)} alt="" width={400} height={400} unoptimized className="size-full object-cover" />;
}

// The first card: «＋ nuevo tablero». It opens its own small screen to name the board — no field
// squeezed into the card (Brian, 2026-10-25) — and from there she lands inside it to fill it.
function Nuevo({ lleno }: { lleno: boolean }) {
  const caja = "flex h-full min-h-56 flex-col rounded-2xl border border-dashed border-line";
  if (lleno)
    return (
      <p className={`${caja} justify-center p-4 text-pretty text-sm text-ink-soft`}>
        Tienes {MAX_TABLEROS} tableros: suelta uno para empezar otro.
      </p>
    );
  return (
    <Link href="/lienzo/nuevo" className={`press ${caja} items-center justify-center gap-2 text-ink-soft hover:border-accent/60 hover:text-ink`}>
      <Plus className="size-7 text-accent" />
      <span className="text-sm font-medium">nuevo tablero</span>
    </Link>
  );
}
