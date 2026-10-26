"use client";

import Link from "next/link";
import { useId, useRef } from "react";
import { Close, More } from "@/components/icons";
import { Logros } from "@/components/logros";
import { Playa } from "@/components/playa";
import type { Moment } from "@/lib/local";

const when = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// Her garden is a beach at sunset where every flower she earned grows into the landscape — the
// times she came back and the missions she completed, read on the server, the same on every
// device. The count rides on the panel as a comic caption; what each flower came from waits
// behind «⋯» next to the title (Brian, 2026-10-25). The garden only grows.
export function Garden({ misiones = 0, vueltas: list = [], mejorDia = 0 }: { misiones?: number; vueltas?: Moment[]; mejorDia?: number }) {
  const flores = list.length + misiones;
  return (
    <div className="mt-6">
      <div className="rise relative">
        <Playa flores={flores} className="block h-auto w-full" />
        <p className="absolute left-3.5 top-3.5 -rotate-2 border-[3px] border-[oklch(0.2_0.06_315)] bg-[oklch(0.92_0.13_92)] px-3 pb-1.5 pt-1 font-black text-[oklch(0.2_0.06_315)] shadow-[3px_3px_0_oklch(0.2_0.06_315)]">
          {flores === 0 ? (
            <span className="text-base">tu jardín te espera</span>
          ) : (
            <>
              <span className="t-display text-3xl">{flores}</span> <span className="text-base">{flores === 1 ? "flor" : "flores"}</span>
            </>
          )}
        </p>
      </div>

      {flores === 0 && (
        <div className="mt-6 space-y-4">
          <p className="text-pretty text-lg leading-relaxed text-ink-soft">
            Cada vez que vuelvas a ti o cumplas una misión, nace una flor en tu playa. Nunca se marchita y nunca empieza de cero.
          </p>
          <Link href="/volver" className="press inline-block rounded-full bg-accent px-6 py-3 font-medium text-accent-ink">
            plantar la primera
          </Link>
        </div>
      )}

      <Logros counts={{ vueltas: list.length, misiones, mejorDia }} />
      <div aria-hidden className="h-16" />
    </div>
  );
}

// «⋯» beside the title: where her flowers came from, and what she did each time she came back.
// Tucked away on purpose — the beach is what she sees first.
export function MasDelJardin({ misiones = 0, vueltas: list = [] }: { misiones?: number; vueltas?: Moment[] }) {
  const sheet = useRef<HTMLDialogElement>(null);
  const titulo = useId();
  const recent = [...list].reverse().slice(0, 8);
  // only what grew: a «0» here would be a count of what did not happen
  const de = [
    list.length > 0 && `${list.length} ${list.length === 1 ? "vez que volviste a ti" : "veces que volviste a ti"}`,
    misiones > 0 && `${misiones} ${misiones === 1 ? "misión cumplida" : "misiones cumplidas"}`,
  ].filter(Boolean);
  if (de.length === 0) return null;
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label="de dónde salieron tus flores"
        onClick={() => sheet.current?.showModal()}
        className="press grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-soft hover:text-ink"
      >
        <More className="size-5" />
      </button>
      <dialog
        ref={sheet}
        aria-labelledby={titulo}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="sheet m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-[1.75rem] border border-b-0 border-line bg-surface p-0 text-ink backdrop:bg-transparent sm:mx-auto sm:max-w-md lg:m-auto lg:rounded-[1.75rem] lg:border-b"
      >
        <div className="px-6 pb-8 pt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titulo} className="text-lg font-semibold">
              de dónde salieron tus flores
            </h2>
            <button
              type="button"
              aria-label="cerrar"
              onClick={() => sheet.current?.close()}
              className="press -mr-2 grid size-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              <Close className="size-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-ink-soft">{de.join(" · ")}</p>
          {recent.length > 0 && (
            <>
              <h3 className="mt-6 font-semibold">lo que hiciste al volver</h3>
              <ul className="mt-2 divide-y divide-line">
                {recent.map((m) => (
                  <li key={m.at} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="text-pretty">{m.step}</span>
                    <span className="shrink-0 text-xs text-ink-soft">{when.format(m.at)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
