"use client";

import { useId, useRef, useState } from "react";
import { Close } from "@/components/icons";

// Achievements she has EARNED — never the ones still missing: an empty box is a reminder of what
// she has not done, and this place does not keep that kind of count. Each one is a sticker, not
// text (Brian, 2026-10-25): a soft character with a thick colored outline, a little black face and
// the white cut border of a real sticker — vector code, so it stays sharp at any size. They pass
// in a carousel, so many of them keep the page clean; tapping one tells what it is.

const INK = "oklch(0.2 0.06 315)";
const BLUSH = "oklch(0.78 0.13 0)";

export type Counts = { vueltas: number; misiones: number; mejorDia: number };

function Cara({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="-7" cy="0" rx="2.6" ry="3.4" fill={INK} />
      <ellipse cx="7" cy="0" rx="2.6" ry="3.4" fill={INK} />
      <circle cx="-6.2" cy="-1.2" r="0.9" fill="#fff" />
      <circle cx="7.8" cy="-1.2" r="0.9" fill="#fff" />
      <path d="M-3 4.5 q 3 3 6 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      <ellipse cx="-12" cy="5" rx="3.2" ry="2" fill={BLUSH} opacity={0.8} />
      <ellipse cx="12" cy="5" rx="3.2" ry="2" fill={BLUSH} opacity={0.8} />
    </g>
  );
}

// the white cut border: the sticker's silhouette under everything, with a fat white stroke
function Corte({ d }: { d: string }) {
  return <path d={d} fill="#fff" stroke="#fff" strokeWidth={16} strokeLinejoin="round" />;
}

const ancho = { strokeWidth: 4, strokeLinejoin: "round" as const };

// a sprout pushing out of the ground: the first one
function Brote() {
  return (
    <>
      <Corte d="M50 92 C 26 92 20 78 26 70 C 30 64 40 64 44 66 L 44 52 C 30 54 18 44 18 30 C 32 28 44 36 46 48 C 48 34 60 22 76 22 C 78 38 66 50 54 52 L 54 66 C 58 64 70 64 74 70 C 80 78 74 92 50 92Z" />
      <path d="M26 70 C 30 64 70 64 74 70 C 80 78 74 92 50 92 C 26 92 20 78 26 70Z" fill="oklch(0.72 0.1 55)" stroke="oklch(0.55 0.12 45)" {...ancho} />
      <path d="M49 66 L 49 46" stroke="oklch(0.55 0.15 140)" strokeWidth={5} strokeLinecap="round" />
      <path d="M46 48 C 44 36 32 28 18 30 C 18 44 30 54 46 50Z" fill="oklch(0.82 0.14 135)" stroke="oklch(0.5 0.15 140)" {...ancho} />
      <path d="M52 48 C 56 34 64 22 76 22 C 78 38 66 50 52 50Z" fill="oklch(0.82 0.14 135)" stroke="oklch(0.5 0.15 140)" {...ancho} />
      <Cara x={50} y={78} s={0.85} />
    </>
  );
}

// a sun with three big rays, proud: three in one day
function Sol() {
  return (
    <>
      <Corte d="M50 14 L 58 30 C 66 30 74 36 78 44 L 94 46 L 80 58 C 80 74 66 88 50 88 C 34 88 20 74 20 58 L 6 46 L 22 44 C 26 36 34 30 42 30Z" />
      <path d="M50 14 L 60 34 L 40 34Z M6 46 L 26 42 L 24 60Z M94 46 L 74 42 L 76 60Z" fill="oklch(0.82 0.15 60)" stroke="oklch(0.62 0.17 45)" {...ancho} />
      <circle cx="50" cy="58" r="30" fill="oklch(0.92 0.13 92)" stroke="oklch(0.66 0.16 55)" strokeWidth={4.5} />
      <Cara x={50} y={58} />
    </>
  );
}

// a snail: its shell IS the turns she took back to herself
function Caracol() {
  return (
    <>
      <Corte d="M8 84 C 8 74 16 70 24 70 L 26 58 C 22 54 22 46 28 44 C 34 46 34 52 32 56 L 34 66 C 36 40 52 22 72 26 C 90 30 96 50 90 66 C 88 78 80 86 70 86Z" />
      <path d="M8 84 C 8 74 16 70 26 70 L 76 76 C 78 82 74 86 66 86 L 14 86 C 10 86 8 86 8 84Z" fill="oklch(0.86 0.08 350)" stroke="oklch(0.6 0.17 345)" {...ancho} />
      <path d="M27 70 L 28 54 M33 70 L 36 54" stroke="oklch(0.6 0.17 345)" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx="28" cy="51" r="3.6" fill="oklch(0.6 0.17 345)" />
      <circle cx="36" cy="51" r="3.6" fill="oklch(0.6 0.17 345)" />
      <circle cx="64" cy="56" r="27" fill="oklch(0.74 0.17 340)" stroke="oklch(0.5 0.2 335)" strokeWidth={4.5} />
      <path
        d="M64 56 m -4 0 a 4 4 0 1 1 4 4 a 9 9 0 1 1 9 -9 a 15 15 0 1 1 -15 -15 a 21 21 0 0 1 21 21"
        fill="none"
        stroke="oklch(0.5 0.2 335)"
        strokeWidth={3.6}
        strokeLinecap="round"
      />
      <Cara x={22} y={78} s={0.6} />
    </>
  );
}

// a flower with a face: her garden reached ten
function FlorCara() {
  return (
    <>
      <Corte d="M50 8 C 62 8 66 20 62 28 C 72 22 86 26 86 40 C 86 52 74 56 66 54 C 74 62 72 78 58 80 C 54 80 52 78 50 76 C 48 78 46 80 42 80 C 28 78 26 62 34 54 C 26 56 14 52 14 40 C 14 26 28 22 38 28 C 34 20 38 8 50 8Z" />
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={i} cx="50" cy="26" rx="13" ry="18" transform={`rotate(${i * 60} 50 46)`} fill="oklch(0.7 0.2 315)" stroke="oklch(0.45 0.2 310)" strokeWidth={4} />
      ))}
      <circle cx="50" cy="46" r="17" fill="oklch(0.9 0.14 92)" stroke="oklch(0.45 0.2 310)" strokeWidth={4} />
      <Cara x={50} y={46} s={0.8} />
    </>
  );
}

// the diamond of «misiones», sparkling: ten of them
function Diamante() {
  return (
    <>
      <Corte d="M50 8 L 90 46 L 50 90 L 10 46Z" />
      <path d="M50 10 L 88 46 L 50 88 L 12 46Z" fill="oklch(0.86 0.09 330)" stroke="oklch(0.55 0.21 325)" strokeWidth={4.5} strokeLinejoin="round" />
      <path
        d="M12 46 H88 M50 10 L 36 46 L 50 88 M50 10 L 64 46 L 50 88"
        fill="none"
        stroke="oklch(0.55 0.21 325)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        opacity={0.55}
      />
      <path d="M80 12 l 3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="oklch(0.92 0.13 92)" stroke="oklch(0.62 0.17 45)" strokeWidth={2} />
      <Cara x={50} y={54} s={0.85} />
    </>
  );
}

const logros = [
  { id: "primera-mision", nombre: "primera misión", what: "La primera misión que cumpliste. Todo empezó aquí.", Dibujo: Brote, earned: (c: Counts) => c.misiones >= 1 },
  { id: "tres-en-un-dia", nombre: "tres en un día", what: "Un día cumpliste tus tres misiones. Brillaste completa.", Dibujo: Sol, earned: (c: Counts) => c.mejorDia >= 3 },
  { id: "cinco-vueltas", nombre: "cinco vueltas", what: "Volviste a ti cinco veces. Sin prisa, como el caracol.", Dibujo: Caracol, earned: (c: Counts) => c.vueltas >= 5 },
  { id: "diez-flores", nombre: "diez flores", what: "Tu jardín llegó a diez flores, y sigue creciendo.", Dibujo: FlorCara, earned: (c: Counts) => c.vueltas + c.misiones >= 10 },
  { id: "diez-misiones", nombre: "diez misiones", what: "Diez misiones cumplidas, una por una.", Dibujo: Diamante, earned: (c: Counts) => c.misiones >= 10 },
];
type Logro = (typeof logros)[number];

const tilts = [-6, 4, -3, 7, -5];

function Sticker({ l, i, size = "size-24" }: { l: Logro; i: number; size?: string }) {
  const { Dibujo } = l;
  return (
    <svg
      viewBox="-6 -6 112 108"
      aria-hidden
      className={`${size} shrink-0 drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]`}
      style={{ transform: `rotate(${tilts[i % tilts.length]}deg)` }}
    >
      <Dibujo />
    </svg>
  );
}

export function Logros({ counts }: { counts: Counts }) {
  const sheet = useRef<HTMLDialogElement>(null);
  const titulo = useId();
  const [abierto, setAbierto] = useState<Logro | null>(null);
  const earned = logros.filter((l) => l.earned(counts));
  if (earned.length === 0) return null;
  // a few stand still in a row; more pass by in a loop (the list twice, so the seam never shows)
  const pasa = earned.length >= 4;

  function ver(l: Logro) {
    setAbierto(l);
    sheet.current?.showModal();
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">tus logros</h2>
      <div className={`carril -mx-5 mt-2 overflow-hidden ${pasa ? "" : "px-5"}`}>
        {/* while one is open the carousel waits; closing it lets it run again */}
        <ul className={`flex w-max gap-5 py-3 ${pasa ? "carril-pista" : ""} ${abierto ? "carril-quieto" : ""}`}>
          {(pasa ? [...earned, ...earned] : earned).map((l, i) => (
            <li key={`${l.id}-${i}`}>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={l.nombre}
                tabIndex={i >= earned.length ? -1 : undefined}
                aria-hidden={i >= earned.length || undefined}
                onClick={() => ver(l)}
                className="press block rounded-3xl"
              >
                <Sticker l={l} i={i} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={sheet}
        aria-labelledby={titulo}
        onClose={() => setAbierto(null)}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="sheet m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-[1.75rem] border border-b-0 border-line bg-surface p-0 text-ink backdrop:bg-transparent sm:mx-auto sm:max-w-md lg:m-auto lg:rounded-[1.75rem] lg:border-b"
      >
        <div className="px-6 pb-8 pt-4">
          <div className="flex justify-end">
            <button
              type="button"
              aria-label="cerrar"
              onClick={() => sheet.current?.close()}
              className="press -mr-2 grid size-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              <Close className="size-5" />
            </button>
          </div>
          {abierto && (
            <div className="flex flex-col items-center text-center">
              <Sticker l={abierto} i={logros.indexOf(abierto)} size="size-36" />
              <h2 id={titulo} className="t-display mt-4 text-3xl">
                {abierto.nombre}
              </h2>
              <p className="mt-2 max-w-xs text-pretty text-lg leading-relaxed text-ink-soft">{abierto.what}</p>
            </div>
          )}
        </div>
      </dialog>
    </section>
  );
}
