"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { marcarEstado } from "@/app/actions";
import { type Estado, type ModoId, modos, vigente } from "@/lib/modos";
import { ultimoModo } from "@/lib/local";
import { Focus, Ideas, Linked, Rest, Sparkle, Start, Waves } from "./icons";
import type { Puestos } from "@/lib/objeto";
import { GatoEnEsfera } from "./mascota/en-esfera";
import { Orb } from "./orb";

export const modoIcon: Record<ModoId, (p: { className?: string }) => React.ReactElement> = {
  hiperfoco: Focus,
  conectada: Linked,
  "mil ideas": Ideas,
  saturada: Waves,
  recargando: Rest,
  "no arranco": Start,
};

// Minutes since she marked it — refreshed while the page stays open, and the mode
// disappears here too once its 12 h are up, not only on the next load.
export function useNow(every = 30_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, every);
    return () => clearInterval(id);
  }, [every]);
  return now;
}

export function since(at: number, now: number) {
  const min = Math.floor((now - at) / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h`;
}

type Msg = { text: string; ok: boolean };

// The home's orb is hers: her pet on the colour of her mode, and the small chip on its upper
// right says which one — no icon, no minutes, so the orb itself carries the news. One tap: the chip
// opens the sheet, a mode closes it, and the orb has already changed before the server
// answers. If saving fails it goes back and says so.
export function EstadoOrb({
  initial,
  puestos,
  className = "",
}: {
  initial: Estado | null;
  puestos: Puestos;
  className?: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(initial);
  const [, start] = useTransition();
  const [msg, setMsg] = useState<Msg | null>(null);
  const sheet = useRef<HTMLDialogElement>(null);
  const now = useNow();
  const current = now ? vigente(optimistic, now) : optimistic;

  // Her device remembers the mode the server says, so the next load is born in its colour.
  useEffect(() => ultimoModo.set(current), [current]);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(id);
  }, [msg]);

  function pick(modo: ModoId | null) {
    sheet.current?.close();
    start(async () => {
      setOptimistic(modo ? { modo, at: Date.now() } : null);
      const r = await marcarEstado(modo);
      setMsg(r.ok ? { text: modo ? "listo, Brian lo sabrá" : "listo, lo quité", ok: true } : { text: r.error ?? "", ok: false });
    });
  }

  return (
    <Orb modo={current?.modo ?? null} className={className}>
      {/* Her pet lives in the orb: its body opens the wardrobe. Her mode floats above it as the
          cat's thought — a bubble with two beads trailing down to its head (Brian, 2026-10-25). */}
      <GatoEnEsfera modo={current?.modo ?? null} puestos={puestos} href="/mascota" />
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => sheet.current?.showModal()}
        className="pensamiento press absolute bottom-full left-[52%] z-10 mb-2 whitespace-nowrap rounded-[1.4rem] px-4 py-2 text-sm font-semibold"
      >
        <span aria-hidden className="pensamiento absolute left-3 top-full mt-0.5 size-2.5 rounded-full" />
        <span aria-hidden className="pensamiento absolute left-0.5 top-full mt-4 size-1.5 rounded-full" />
        {current ? current.modo : "¿cómo estás?"}
      </button>

      {/* Under the orb, out of the flow: the confirmation never pushes the button around. */}
      <p role="status" className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-sm text-ink-soft">
        {msg && (
          <span key={msg.text} className="rise inline-flex items-center gap-1.5">
            {msg.text}
            {msg.ok && <Sparkle className="size-3.5 text-accent" />}
          </span>
        )}
      </p>

      <dialog
        ref={sheet}
        aria-labelledby="estado-titulo"
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="sheet m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-[1.75rem] border border-b-0 border-line bg-surface p-0 text-ink backdrop:bg-transparent sm:mx-auto sm:max-w-md lg:m-auto lg:rounded-[1.75rem] lg:border-b"
      >
        <div className="px-6 pb-8 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="estado-titulo" className="t-label text-ink-soft">
                ¿cómo está tu mente?
              </h2>
              <p className="mt-2 text-pretty text-ink-soft">Brian lo verá. Se borra solo en 12 h.</p>
            </div>
            <button
              type="button"
              onClick={() => sheet.current?.close()}
              className="press t-label -mr-2 rounded-full px-2 py-2 text-ink-soft hover:text-ink"
            >
              cerrar
            </button>
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-3">
            {modos.map((m) => {
              const M = modoIcon[m.id];
              const on = current?.modo === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => pick(m.id)}
                    className={`press flex h-full w-full flex-col items-start gap-3 rounded-2xl border p-4 text-left ${
                      on ? "border-accent bg-accent-soft" : "border-line bg-surface-2 hover:border-accent/60"
                    }`}
                  >
                    <M className="size-5 text-accent" />
                    <span>
                      <span className="block font-semibold">{m.id}</span>
                      <span className={`block text-sm leading-snug ${on ? "text-ink" : "text-ink-soft"}`}>{m.ella}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {current && (
              <li className="grid place-items-center">
                <button
                  type="button"
                  onClick={() => pick(null)}
                  className="press t-label rounded-full px-4 py-3 text-ink-soft underline-offset-4 hover:text-ink hover:underline"
                >
                  quitar
                </button>
              </li>
            )}
          </ul>
        </div>
      </dialog>
    </Orb>
  );
}

// Brian's screen: no chip, but the same memory, so his home is born in her colour too.
export function ModoSync({ estado }: { estado: Estado | null }) {
  useEffect(() => ultimoModo.set(estado), [estado]);
  return null;
}
