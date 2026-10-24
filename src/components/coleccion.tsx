"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { moments } from "@/lib/local";
import type { ModoId } from "@/lib/modos";
import { type Regalado, type Tenido, sprite, suyos } from "@/lib/personaje";
import { Bloom } from "./icons";

export type ColeccionData = { misiones: number; regalados: Regalado[] };

// Her characters, behind the orb: tap it and the cards come out, one at a time. Each card is
// the cat on the colour of her mode, wearing the face of that mode — so the card changes as
// she does. Only the ones she has; a new one simply appears.
export function Coleccion({ data, modo }: { data: ColeccionData; modo: ModoId | null }) {
  const sheet = useRef<HTMLDialogElement>(null);
  const rail = useRef<HTMLUListElement>(null);
  const [state, setState] = useState<{ flores: number; tenidos: Tenido[] } | null>(null);
  const [at, setAt] = useState(0);

  function open() {
    // The garden counts the times she came back (her browser) and the missions (synced).
    const flores = moments.all().length + data.misiones;
    setState({ flores, tenidos: suyos(flores, data.regalados) });
    setAt(0);
    sheet.current?.showModal();
    rail.current?.scrollTo({ left: 0 });
  }

  function onScroll() {
    const el = rail.current;
    if (el) setAt(Math.round(el.scrollLeft / el.clientWidth));
  }

  const go = (i: number) => rail.current?.scrollTo({ left: i * rail.current.clientWidth, behavior: "smooth" });

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label="tus personajes"
        onClick={open}
        className="absolute inset-0 rounded-full"
      />

      <dialog
        ref={sheet}
        aria-labelledby="coleccion-titulo"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="sheet m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[1.75rem] border border-b-0 border-line bg-surface p-0 text-ink backdrop:bg-transparent sm:mx-auto sm:max-w-md lg:m-auto lg:rounded-[1.75rem] lg:border-b"
      >
        <div className="pb-7 pt-6">
          <div className="flex items-center justify-between gap-4 px-6">
            <h2 id="coleccion-titulo" className="t-label text-ink-soft">
              tus personajes
            </h2>
            <button
              type="button"
              onClick={() => sheet.current?.close()}
              className="press t-label -mr-2 rounded-full px-2 py-2 text-ink-soft hover:text-ink"
            >
              cerrar
            </button>
          </div>

          {state && (
            <>
              <ul
                ref={rail}
                onScroll={onScroll}
                className="mt-5 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {state.tenidos.map((p, i) => (
                  <li key={p.id} className="w-full shrink-0 snap-center px-6">
                    <Carta p={p} modo={modo} flores={state.flores} priority={i === 0} />
                  </li>
                ))}
              </ul>

              {state.tenidos.length > 1 && (
                <div className="mt-5 flex justify-center gap-2">
                  {state.tenidos.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-label={p.nombre}
                      aria-current={i === at}
                      onClick={() => go(i)}
                      className={`size-2.5 rounded-full transition-colors ${i === at ? "bg-accent" : "bg-line"}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </dialog>
    </>
  );
}

function Carta({ p, modo, flores, priority }: { p: Tenido; modo: ModoId | null; flores: number; priority: boolean }) {
  return (
    <article className="rounded-[1.75rem] border border-line bg-surface-2 p-3">
      <h3 className="t-display px-2 pb-3 pt-1 text-2xl">{p.nombre}</h3>
      <div className="orb-tint carta-arte relative aspect-square overflow-hidden rounded-[1.25rem]" data-modo={modo ?? undefined}>
        <Image
          src={sprite(p.id, modo)}
          alt={`${p.nombre}, ${modo ?? "contento"}`}
          fill
          sizes="(max-width: 448px) 80vw, 360px"
          priority={priority}
          className="object-contain p-[9%]"
        />
        {modo && (
          <span className="orb-chip absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold">{modo}</span>
        )}
      </div>
      <p className="flex items-center justify-between gap-3 px-2 pb-1 pt-3 text-sm text-ink-soft">
        <span>{p.como}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <Bloom className="size-4 text-accent" />
          {flores} {flores === 1 ? "flor" : "flores"}
        </span>
      </p>
    </article>
  );
}
