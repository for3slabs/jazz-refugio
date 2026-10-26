"use client";

import { useEffect, useState } from "react";
import { powerOfTheDay } from "@/lib/content";
import { Playa } from "./playa";
import { ArrowRight, Bloom, Gift, Star } from "./icons";


function TileHead({ icon, title, dot = false }: { icon: React.ReactNode; title: string; dot?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="t-label flex items-center gap-2 text-ink-soft">
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      {dot && (
        <span aria-label="hay un regalo listo" className="relative grid size-3 place-items-center">
          <span className="absolute size-3 animate-ping rounded-full bg-accent opacity-60" />
          <span className="size-2.5 rounded-full bg-accent" />
        </span>
      )}
    </div>
  );
}

function Go({ children }: { children: React.ReactNode }) {
  return (
    <span className="t-label inline-flex items-center gap-2 text-accent">
      {children}
      <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
    </span>
  );
}

// Her gifts: a warm dot and one line when one is ready, a quiet line when none is.
export function RegalosTileView({ listo }: { listo: boolean }) {
  return (
    <>
      <TileHead icon={<Gift className="size-4" />} title="regalos" dot={listo} />
      <p className="line-clamp-4 text-pretty text-xl font-medium leading-snug">
        {listo ? "Hay un regalo listo para abrir." : "Cartas y cupones envueltos. Algunos esperan tus misiones."}
      </p>
      <div className="mt-auto flex items-center justify-end text-sm text-ink-soft">
        <Go>abrir</Go>
      </div>
    </>
  );
}

// Her flowers: the times she came back (her browser) + the missions she completed (synced).
export function GardenTileView({ misiones = 0, vueltas = 0, abiertas = 0 }: { misiones?: number; vueltas?: number; abiertas?: number }) {
  const [n, setN] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the garden lives in her browser
  useEffect(() => setN(vueltas + misiones), [vueltas, misiones]);

  return (
    <>
      <TileHead icon={<Star className="size-4" />} title="tu jardín" />
      {n ? (
        // her beach as it is today, the front of it — the same scene she walks into (Brian, 2026-10-25)
        // it fills the room the tile already had — never grows it (Brian, 2026-10-25: «respeta los
        // tamaños que ya tiene»)
        // the exact room the 4×3 grid of flowers took — 1.345:1, measured against the previous home
        <div className="relative aspect-[1.345] w-full shrink-0 overflow-hidden rounded-2xl">
          <Playa flores={n} className="absolute inset-0 block h-full w-full" />
        </div>
      ) : (
        <p className="text-pretty text-ink-soft">Cada vez que vuelvas a ti o cumplas una misión, aquí crece una flor.</p>
      )}
      {abiertas > 0 && (
        <p className="text-sm text-ink-soft">
          {abiertas} {abiertas === 1 ? "misión abierta" : "misiones abiertas"}
        </p>
      )}
      <div className="mt-auto flex items-baseline justify-between">
        <p className="text-sm text-ink-soft">
          {n ? (
            <>
              <strong className="t-display text-3xl text-ink">{n}</strong> {n === 1 ? "flor" : "flores"}
            </>
          ) : (
            " "
          )}
        </p>
        <Go>ver</Go>
      </div>
    </>
  );
}

export function PowerTileView() {
  const [p, setP] = useState<ReturnType<typeof powerOfTheDay> | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- "today" is the viewer's day, not the server's
  useEffect(() => setP(powerOfTheDay()), []);

  return (
    <>
      <TileHead icon={<Bloom className="size-4" />} title="tu superpoder de hoy" />
      <div className="grid gap-3 xl:grid-cols-[auto_1fr] xl:items-end xl:gap-8">
        <p className="t-display text-5xl">{p?.name ?? " "}</p>
        <p className="max-w-[48ch] text-pretty text-ink-soft">{p?.today}</p>
      </div>
      <div className="mt-auto flex justify-end">
        <Go>los cinco</Go>
      </div>
    </>
  );
}

