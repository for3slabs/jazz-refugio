"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { floresVistas } from "@/app/actions";
import { Close, More } from "@/components/icons";
import { Logros } from "@/components/logros";
import { Gato } from "@/components/gato";
import { H_PLAYA, Playa, SLOTS, W_PLAYA } from "@/components/playa";
import type { Moment } from "@/lib/local";
import { botonComic, escenario } from "./cabecera";
import { type Mascota, NOMBRE_INICIAL } from "@/lib/objeto";

const when = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// Her garden is a beach at sunset where every flower she earned grows into the landscape — the
// times she came back and the missions she completed, read on the server, the same on every
// device. The count rides on the panel as a comic caption; what each flower came from waits
// behind «⋯» next to the title (Brian, 2026-10-25). The garden only grows.
// `vistas`: how many she has already watched grow — the rest her cat plants in front of her.
// `gato`: her pet — its name and what it wears. `vistas` null means the count could not be read: everything shows, nothing plays.
export function Garden({
  misiones = 0,
  vueltas: list = [],
  mejorDia = 0,
  vistas = null,
  gato = { nombre: NOMBRE_INICIAL, puestos: {} },
  cabecera,
}: {
  misiones?: number;
  vueltas?: Moment[];
  mejorDia?: number;
  vistas?: number | null;
  gato?: Mascota;
  cabecera?: ReactNode;
}) {
  const flores = list.length + misiones;
  return (
    <div>
      {/* Next keeps this page alive, hidden, after she leaves it: coming back with more flowers must
          start the planting over, not resume the old one (Brian, 2026-10-25: «ver mi jardín» showed
          no cat until a reload). A new count is a new garden. */}
      <JardinVivo key={`${flores}:${vistas}`} flores={flores} vistas={vistas} gato={gato} cabecera={cabecera} />

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

      {/* under the beach, still on its sand: her stickers */}
      <div className="suelo">
        <Logros counts={{ vueltas: list.length, misiones, mejorDia }} />
      </div>
      <div aria-hidden className="h-16" />
    </div>
  );
}

const INICIO = { x: -40, y: H_PLAYA - 40 };

// The flowers she has not seen yet are planted in front of her (Brian, 2026-10-25: «así ella siente
// que está participando… vamos a activar su TDAH»): her cat walks in, hops left to right from place
// to place, a flower sprouts at each one while the caption counts up, then it sits and leaves.
// Tapping the cat makes it jump. Once done, the server learns they were seen, so it plays once per
// flower on any device. Without motion everything is simply there.
// The beach fills the whole screen above the doors (Brian, 2026-10-25: «que no tenga que hacer
// scroll… que entre a otro lugar»): the title and tabs float on its sky, the flowers sit just
// above the doors.
function JardinVivo({ flores, vistas, gato, cabecera }: { flores: number; vistas: number | null; gato: Mascota; cabecera?: ReactNode }) {
  const ya = Math.min(vistas ?? flores, flores);
  // the new ones, left to right, so the cat walks across the beach instead of zigzagging
  const [nuevas] = useState(() =>
    SLOTS.slice(ya, Math.min(flores, SLOTS.length))
      .map((s) => s.i)
      .sort((a, b) => SLOTS[a].x - SLOTS[b].x),
  );
  const [k, setK] = useState(0);
  const [fase, setFase] = useState<"espera" | "plantando" | "listo" | "saliendo" | "fuera">(nuevas.length ? "espera" : "fuera");
  const [pos, setPos] = useState(INICIO);
  const [brinco, setBrinco] = useState(0);
  const avisado = useRef(false);
  // a step per flower: a handful take their time, many go quicker — about four seconds in all
  const paso = Math.max(140, Math.min(520, 3600 / Math.max(1, nuevas.length)));

  useEffect(() => {
    if (fase !== "espera") return;
    const quieto =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off";
    if (quieto) {
      // without motion the planting is simply done: everything shows, and it counts as seen
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the motion setting is a browser-only fact
      setK(nuevas.length);
      setFase("fuera");
      if (vistas !== null) void floresVistas(flores);
      return;
    }
    const id = setTimeout(() => setFase("plantando"), 700);
    return () => clearTimeout(id);
  }, [fase, nuevas.length, flores, vistas]);

  useEffect(() => {
    if (fase !== "plantando") return;
    if (k >= nuevas.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the last flower is in: the cat rests
      setFase("listo");
      return;
    }
    const s = SLOTS[nuevas[k]];
    // walk to the place, then the flower sprouts behind its paws
    setPos({ x: s.x - 22, y: s.y + 6 });
    const id = setTimeout(() => setK((n) => n + 1), paso * 0.75);
    return () => clearTimeout(id);
  }, [fase, k, nuevas, paso]);

  useEffect(() => {
    if (fase !== "listo") return;
    if (!avisado.current && vistas !== null) {
      avisado.current = true;
      void floresVistas(flores);
    }
    // it rests a moment among its flowers, then walks off to the right
    const id = setTimeout(() => {
      setPos({ x: W_PLAYA + 60, y: H_PLAYA - 30 });
      setFase("saliendo");
    }, 1600);
    return () => clearTimeout(id);
  }, [fase, flores, vistas]);

  useEffect(() => {
    if (fase !== "saliendo") return;
    const id = setTimeout(() => setFase("fuera"), 1500);
    return () => clearTimeout(id);
  }, [fase]);

  const mostrar = [...SLOTS.slice(0, ya).map((s) => s.i), ...nuevas.slice(0, k)];
  const cuenta = ya + k;
  const enEscena = fase === "plantando" || fase === "listo" || fase === "saliendo";

  return (
    <div data-escena="playa" className={`rise ${escenario}`}>
      <Playa flores={flores} mostrar={mostrar} nuevas={new Set(nuevas)} cielo={320} className="absolute inset-0 block h-full w-full">
        {enEscena && (
          <g
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              transition: `transform ${fase === "saliendo" ? 1400 : paso * 0.7}ms ease-in-out`,
            }}
          >
            <g
              key={brinco}
              className={brinco ? "gato-brinco" : fase === "plantando" ? "gato-salto" : undefined}
              onClick={() => setBrinco((b) => b + 1)}
              style={{ cursor: "pointer" }}
            >
              {/* a larger, invisible target: a cat is small under a finger */}
              <g transform="scale(1.35)">
                <rect x="-26" y="-60" width="52" height="62" fill="transparent" />
                <Gato conFlor={fase === "plantando" && k < nuevas.length} puestos={gato.puestos} />
              </g>
            </g>
          </g>
        )}
      </Playa>

      <div className="relative z-10 px-5 pt-[3.75rem] sm:px-8 lg:pt-6">
        {cabecera}
      </div>
      <p className="absolute left-5 top-[12.25rem] z-10 -rotate-2 border-[3px] sm:left-8 lg:top-[9rem] border-[oklch(0.2_0.06_315)] bg-[oklch(0.92_0.13_92)] px-3 pb-1.5 pt-1 font-black text-[oklch(0.2_0.06_315)] shadow-[3px_3px_0_oklch(0.2_0.06_315)]">
        {flores === 0 ? (
          <span className="text-base">tu jardín te espera</span>
        ) : (
          <>
            <span key={cuenta} className={`t-display inline-block text-3xl ${k > 0 ? "cuenta-sube" : ""}`}>
              {cuenta}
            </span>{" "}
            <span className="text-base">{cuenta === 1 ? "flor" : "flores"}</span>
          </>
        )}
      </p>

      {/* what the cat is up to, in a comic speech bubble */}
      {nuevas.length > 0 && (fase === "plantando" || fase === "listo") && (
        <p
          role="status"
          className="rise absolute right-5 top-[12.5rem] z-10 max-w-[55%] sm:right-8 lg:top-[9.25rem] rounded-2xl border-[3px] border-[oklch(0.2_0.06_315)] bg-[oklch(0.97_0.015_330)] px-3 py-1.5 text-sm font-bold text-[oklch(0.2_0.06_315)]"
        >
          {fase === "listo"
            ? "¡listas! 🌸"
            : `${gato.nombre} trae ${nuevas.length === 1 ? "una flor nueva" : `${nuevas.length} flores nuevas`}`}
        </p>
      )}
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
        className={botonComic}
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
