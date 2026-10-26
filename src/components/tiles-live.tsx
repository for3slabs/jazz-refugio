"use client";

import { useEffect, useState } from "react";
import { powerOfTheDay } from "@/lib/content";
import { type Estado, modoOf, vigente } from "@/lib/modos";
import { modoIcon, since, useNow } from "./estado";
import { Playa } from "./playa";
import { ArrowRight, Bloom, Letter, Sparkle, Star } from "./icons";

const rel = new Intl.RelativeTimeFormat("es-MX", { numeric: "auto" });
function ago(at: number) {
  const min = Math.round((at - Date.now()) / 60_000);
  if (Math.abs(min) < 60) return rel.format(min, "minute");
  const h = Math.round(min / 60);
  if (Math.abs(h) < 24) return rel.format(h, "hour");
  return rel.format(Math.round(h / 24), "day");
}

function TileHead({ icon, title, dot = false }: { icon: React.ReactNode; title: string; dot?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="t-label flex items-center gap-2 text-ink-soft">
        <span className="text-accent">{icon}</span>
        {title}
      </h2>
      {dot && (
        <span aria-label="hay algo nuevo de Brian" className="relative grid size-3 place-items-center">
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

export type NotaTile = { id: string; mia: boolean; texto: string; at: number };

export function BrianTileView({
  isBrian,
  notas,
  regalo = false,
  nuevo = false,
}: {
  isBrian: boolean;
  notas: NotaTile[];
  regalo?: boolean;
  nuevo?: boolean;
}) {
  const [unread, setUnread] = useState(false);
  const [when, setWhen] = useState<Record<string, string>>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- «hace 2 h» is measured on her clock
    setWhen(Object.fromEntries(notas.map((n) => [n.id, ago(n.at)])));
    setUnread(regalo || nuevo);
  }, [notas, regalo, nuevo]);
  const otro = isBrian ? "Jazz" : "Brian";

  return (
    <>
      <TileHead icon={<Letter className="size-4" />} title="mensajes" dot={unread} />
      {notas.length === 0 ? (
        <p className="line-clamp-4 text-pretty text-xl font-medium leading-snug">
          {isBrian ? "Cuando Jazz te deje una nota, aparecerá aquí." : "Aquí aparecerá lo que Brian te escriba."}
        </p>
      ) : (
        // the last notes both ways, newest first — a small panel of notices
        <ul className="min-h-0 flex-1 space-y-2 overflow-hidden">
          {notas.map((n) => (
            <li key={n.id} className={`rounded-xl px-3 py-2 ${n.mia ? "ml-6 bg-surface-2" : "mr-6 bg-accent-soft"}`}>
              <p className="flex items-baseline justify-between gap-2 text-xs">
                <span className={`font-semibold ${n.mia ? "text-ink-soft" : "text-accent"}`}>{n.mia ? "tú" : otro}</span>
                <span className="text-ink-soft">{when[n.id] ?? ""}</span>
              </p>
              <p className="mt-0.5 line-clamp-2 text-pretty text-sm leading-snug">{n.texto}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-end text-sm text-ink-soft">
        <Go>{isBrian ? "escribir" : "abrir"}</Go>
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

// Brian's view of her mode: what it is, since when, and what helps right now.
// A failed read says so — «no ha marcado» would be a claim the server never made.
export function JazzTileView({ estado, failed }: { estado: Estado | null; failed: boolean }) {
  const now = useNow();
  const e = now ? vigente(estado, now) : estado;
  const Icon = e ? modoIcon[e.modo] : Sparkle;

  return (
    <>
      <TileHead icon={<Icon className="size-4" />} title="jazz ahora" />
      {e ? (
        <div className="grid gap-3 xl:grid-cols-[auto_1fr] xl:items-end xl:gap-8">
          <p className="t-display text-5xl">
            {e.modo}
            {now && (
              <span className="ml-3 align-middle text-base font-medium tabular-nums text-ink-soft">
                {" "}
                {since(e.at, now) === "ahora" ? "justo ahora" : `hace ${since(e.at, now)}`}
              </span>
            )}
          </p>
          <p className="max-w-[48ch] text-pretty text-lg text-ink-soft">{modoOf(e.modo).ayuda}</p>
        </div>
      ) : (
        <p className="text-pretty text-lg text-ink-soft">
          {failed ? "No pude leer cómo está ahora. Vuelve a abrir en un momento." : "Jazz no ha marcado cómo está."}
        </p>
      )}
      <div className="mt-auto flex justify-end">
        <Go>escribirle</Go>
      </div>
    </>
  );
}
