"use client";

import { useEffect, useState } from "react";
import { powerOfTheDay } from "@/lib/content";
import { notesSeen } from "@/lib/local";
import { type Estado, modoOf, vigente } from "@/lib/modos";
import { modoIcon, since, useNow } from "./estado";
import { Flower } from "./flower";
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

export function BrianTileView({
  isBrian,
  at,
  preview,
  regalo = false,
}: {
  isBrian: boolean;
  at: number | null;
  preview: string | null;
  regalo?: boolean;
}) {
  const [unread, setUnread] = useState(false);
  const [when, setWhen] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- what she has seen lives in her browser
    if (at) setWhen(ago(at));
    if (!isBrian) setUnread(regalo || (!!at && at > notesSeen.get()));
  }, [at, isBrian, regalo]);

  return (
    <>
      <TileHead icon={<Letter className="size-4" />} title="de Brian" dot={unread} />
      <p className="line-clamp-4 text-pretty text-xl font-medium leading-snug">
        {preview ? `«${preview}»` : isBrian ? "Todavía no le dejas una nota." : "Aquí aparecerá lo que Brian te escriba."}
      </p>
      <div className="mt-auto flex items-center justify-between text-sm text-ink-soft">
        <span>{when}</span>
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
  const shown = Math.min(n ?? 0, 12);

  return (
    <>
      <TileHead icon={<Star className="size-4" />} title="tu jardín" />
      {n ? (
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: shown }, (_, i) => (
            <Flower key={i} n={n - shown + i + 1} className="aspect-square w-full" />
          ))}
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
