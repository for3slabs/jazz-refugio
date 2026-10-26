import type { ReactNode } from "react";
import type { Libro } from "@/lib/estante";

// «tu librero» as an old library in the comic style of her beach (Brian, 2026-10-25: «como una
// biblioteca de Harry Potter»): tall shelves, an arched window onto a violet night, candles
// floating, a wooden floor. Her books lie where someone who lives in a library leaves them — the
// ones she is reading open on the table, the ones she finished piled up beside them, the ones she
// wants to read stacked on the floor, a little askew. A lectern holds the big book of what she
// learned. Vector code; no blue anywhere.

const INK = "oklch(0.2 0.06 315)";
export const W_BIBLIO = 390;
export const H_BIBLIO = 560;
const W = W_BIBLIO;
const H = H_BIBLIO;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

// a book's cover: plums, pinks, rust and ochre — the same title is always the same book
const TONOS = [310, 325, 340, 355, 15, 35, 60, 75];
export function tapa(titulo: string) {
  let h = 0;
  for (const c of titulo) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { color: `oklch(${(0.52 + ((h >> 5) % 20) / 100).toFixed(2)} 0.14 ${TONOS[h % TONOS.length]})`, k: (h % 1000) / 1000 };
}

// the shelves of the room itself: spines generated once, the backdrop she never has to fill
const ESTANTES = (() => {
  const r = rng(11);
  const out: { x: number; y: number; w: number; h: number; c: string }[] = [];
  for (const [x0, x1] of [
    [6, 108],
    [282, 384],
  ]) {
    // rows above the top are hidden in a card and show when the room fills the screen
    for (let fila = -5; fila < 6; fila++) {
      const base = 78 + fila * 56;
      let x = x0 + 3;
      while (x < x1 - 8) {
        const w = 6 + Math.floor(r() * 7);
        const h = 30 + Math.floor(r() * 16);
        if (r() < 0.08) {
          x += w; // a gap: a book someone took
          continue;
        }
        out.push({ x, y: base - h, w, h, c: `oklch(${(0.45 + r() * 0.25).toFixed(2)} 0.12 ${TONOS[Math.floor(r() * TONOS.length)]})` });
        x += w + 1;
      }
    }
  }
  return out;
})();

const VELAS = [
  { x: 70, y: 70 },
  { x: 150, y: 46 },
  { x: 236, y: 58 },
  { x: 318, y: 82 },
  { x: 196, y: 120 },
];

// where each kind of book lands: on the table (open), piled on the table's end, on the floor
export const MESA = { x: 34, y: 430, w: 222 };
export const PEDESTAL = { x: 326, y: 446 };
export const GATO_MESA = { x: 66, y: 430 };

type Puesto = { x: number; y: number; rot: number; abierto: boolean };

// Every book gets its place by its state and its order within that state: up to four open on the
// table, the finished ones stacked high at the table's end, the wanted ones in floor piles. The
// same list always draws the same mess.
export function acomodo(libros: Libro[]): Map<string, Puesto> {
  const pos = new Map<string, Puesto>();
  const leyendo = libros.filter((l) => l.estado === "leyendo");
  const leidos = libros.filter((l) => l.estado === "leido");
  const quiero = libros.filter((l) => l.estado === "quiero");
  leyendo.forEach((l, i) => {
    const { k } = tapa(l.titulo);
    // past three the open books lie on top of each other, like a desk in use
    const x = 100 + (i % 3) * 42 + (i >= 3 ? 12 : 0);
    pos.set(l.id, { x, y: MESA.y - 1 - Math.floor(i / 3) * 6, rot: (k - 0.5) * 18, abierto: true });
  });
  leidos.forEach((l, i) => {
    const { k } = tapa(l.titulo);
    const pila = Math.floor(i / 8);
    pos.set(l.id, { x: 232 - pila * 30 + (k - 0.5) * 6, y: MESA.y - 1 - (i % 8) * 12, rot: (k - 0.5) * 10, abierto: false });
  });
  quiero.forEach((l, i) => {
    const { k } = tapa(l.titulo);
    const pila = Math.floor(i / 5);
    const xs = [34, 92, 150, 206, 262];
    pos.set(l.id, { x: xs[pila % xs.length] + (k - 0.5) * 8, y: H - 12 - (i % 5) * 12, rot: (k - 0.5) * 14, abierto: false });
  });
  return pos;
}

function LibroCerrado({ color }: { color: string }) {
  return (
    <g>
      <rect x="-15" y="-9" width="30" height="9" rx="1.5" fill={color} stroke={INK} strokeWidth={1.6} />
      <path d="M-13 -2.6 H 11" stroke="oklch(0.96 0.02 85)" strokeWidth={2.2} />
      <path d="M-15 -6 h 30" stroke={INK} strokeWidth={0.7} opacity={0.4} />
    </g>
  );
}

function LibroAbierto({ color }: { color: string }) {
  return (
    <g>
      <path d="M-17 0 L -16 -9 Q -8 -12 0 -8 Q 8 -12 16 -9 L 17 0 Q 8 -3 0 0 Q -8 -3 -17 0Z" fill={color} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M-15 -2 L -14.5 -9 Q -7 -11.5 0 -8 L 0 -1 Q -7 -4 -15 -2Z M15 -2 L 14.5 -9 Q 7 -11.5 0 -8 L 0 -1 Q 7 -4 15 -2Z" fill="oklch(0.96 0.025 85)" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
      <path d="M-12 -6 q 4 -1.5 9 0 M-12 -4 q 4 -1.5 9 0 M3 -6 q 5 -1.5 9 0 M3 -4 q 5 -1.5 9 0" stroke={INK} strokeWidth={0.6} opacity={0.45} fill="none" />
    </g>
  );
}

// `nuevo`: the id of a book that just arrived — it drops into place with a bounce. `ocultos`: books
// her cat is still carrying, not drawn yet.
// `onLibro` / `onPedestal`: taps on a book or on the big book. `children`: her cat.
export function Biblioteca({
  libros,
  aprendidos,
  nuevo,
  ocultos,
  onLibro,
  onPedestal,
  cielo = 0,
  className = "",
  children,
}: {
  libros: Libro[];
  aprendidos: number;
  nuevo?: string | null;
  ocultos?: Set<string>;
  onLibro?: (id: string) => void;
  onPedestal?: () => void;
  cielo?: number;
  className?: string;
  children?: ReactNode;
}) {
  const pos = acomodo(libros);
  // back to front: the floor piles last, so they sit in front of the table's legs
  const orden = [...libros].filter((l) => pos.has(l.id) && !ocultos?.has(l.id)).sort((a, b) => pos.get(a.id)!.y - pos.get(b.id)!.y);
  return (
    <svg
      viewBox={`0 ${-cielo} ${W} ${H + cielo}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      role="img"
      aria-label={`tu biblioteca, con ${libros.length} ${libros.length === 1 ? "libro" : "libros"}`}>
      <defs>
        <pattern id="biblio-trama" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="3.5" cy="3.5" r="1.2" fill={INK} opacity={0.3} />
        </pattern>
        <radialGradient id="biblio-luz">
          <stop offset="0" stopColor="oklch(0.92 0.13 85)" stopOpacity="0.55" />
          <stop offset="1" stopColor="oklch(0.92 0.13 85)" stopOpacity="0" />
        </radialGradient>
        <clipPath id="biblio-marco">
          <rect y={-cielo} width={W} height={H + cielo} rx={cielo ? 0 : 22} />
        </clipPath>
        <clipPath id="biblio-ventana">
          <path d="M130 250 V 120 Q 130 44 195 36 Q 260 44 260 120 V 250Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#biblio-marco)">
        {/* the wall — taller when the room fills the screen, and the shelves climb with it */}
        <rect y={-cielo} width={W} height={H + cielo} fill="oklch(0.3 0.1 318)" />
        <rect y={-cielo} width={W} height={400 + cielo} fill="url(#biblio-trama)" opacity={0.6} />
        {/* the arched window onto a violet night */}
        <g clipPath="url(#biblio-ventana)">
          <rect x="120" y="30" width="150" height="230" fill="oklch(0.36 0.15 308)" />
          <path d="M120 150 Q 195 138 270 150 V 260 H120Z" fill="oklch(0.48 0.19 330)" />
          <path d="M120 210 Q 195 200 270 212 V 260 H120Z" fill="oklch(0.64 0.17 12)" />
          <circle cx="226" cy="84" r="16" fill="oklch(0.94 0.1 92)" stroke={INK} strokeWidth={2} />
          <circle cx="234" cy="78" r="14" fill="oklch(0.36 0.15 308)" />
          {[
            [150, 70],
            [176, 100],
            [158, 128],
            [208, 132],
            [246, 120],
          ].map(([x, y]) => (
            <path key={`${x}${y}`} d={`M${x} ${y - 4} l 1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2z`} fill="oklch(0.94 0.1 92)" />
          ))}
        </g>
        <path d="M130 250 V 120 Q 130 44 195 36 Q 260 44 260 120 V 250Z" fill="none" stroke={INK} strokeWidth={4} />
        <path d="M195 37 V 250 M130 150 H 260 M130 205 H 260" stroke={INK} strokeWidth={3} />
        <path d="M122 252 H 268 V 262 H 122Z" fill="oklch(0.5 0.08 45)" stroke={INK} strokeWidth={2.4} />
        {/* the shelves, full */}
        {[
          [0, 112],
          [278, 112],
        ].map(([x, w]) => (
          <rect key={x} x={x} y={cielo ? -cielo - 4 : 14} width={w} height={cielo ? 410 + cielo : 392} fill="oklch(0.42 0.08 40)" stroke={INK} strokeWidth={3} />
        ))}
        {ESTANTES.map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={b.c} stroke={INK} strokeWidth={1.1} />
        ))}
        {Array.from({ length: 11 }, (_, j) => j - 5).map((f) => (
          <g key={f}>
            <rect x="0" y={78 + f * 56} width="112" height="7" fill="oklch(0.5 0.08 45)" stroke={INK} strokeWidth={1.8} />
            <rect x="278" y={78 + f * 56} width="112" height="7" fill="oklch(0.5 0.08 45)" stroke={INK} strokeWidth={1.8} />
          </g>
        ))}
        {/* candles that float, as in the castle */}
        {VELAS.map((v, i) => (
          <g key={i} className="vela" style={{ animationDelay: `${i * 0.7}s` }} transform={`translate(${v.x} ${v.y})`}>
            <circle cy="-14" r="16" fill="url(#biblio-luz)" />
            <rect x="-4" y="-6" width="8" height="20" rx="1.5" fill="oklch(0.95 0.03 85)" stroke={INK} strokeWidth={1.6} />
            <path d="M0 -15 q 4 5 0 9 q -4 -4 0 -9z" fill="oklch(0.86 0.15 70)" stroke={INK} strokeWidth={1.1} />
          </g>
        ))}
        {/* the floor, the rug */}
        <rect y="400" width={W} height={H - 400} fill="oklch(0.42 0.07 40)" />
        {Array.from({ length: 6 }, (_, j) => (
          <path key={j} d={`M0 ${412 + j * 26} H ${W}`} stroke={INK} strokeWidth={1.2} opacity={0.5} />
        ))}
        <rect y="400" width={W} height={H - 400} fill="url(#biblio-trama)" opacity={0.35} />
        <path d="M0 400 H 390" stroke={INK} strokeWidth={3} />
        <ellipse cx="170" cy="520" rx="150" ry="30" fill="oklch(0.5 0.17 340)" stroke={INK} strokeWidth={2.4} />
        <ellipse cx="170" cy="520" rx="128" ry="22" fill="none" stroke="oklch(0.8 0.12 75)" strokeWidth={2} strokeDasharray="6 5" />
        {/* the table */}
        <path d={`M${MESA.x + 12} ${MESA.y + 12} V 540 M${MESA.x + MESA.w - 12} ${MESA.y + 12} V 540`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M${MESA.x + 12} ${MESA.y + 12} V 540 M${MESA.x + MESA.w - 12} ${MESA.y + 12} V 540`} stroke="oklch(0.48 0.08 45)" strokeWidth={5} strokeLinecap="round" />
        <rect x={MESA.x} y={MESA.y} width={MESA.w} height="14" rx="3" fill="oklch(0.55 0.09 50)" stroke={INK} strokeWidth={2.6} />
        {/* the lectern and the big book of what she learned */}
        <g
          onClick={onPedestal}
          style={onPedestal ? { cursor: "pointer" } : undefined}
          role={onPedestal ? "button" : undefined}
          aria-label={onPedestal ? `lo que aprendí: ${aprendidos}` : undefined}
        >
          <circle cx={PEDESTAL.x} cy={PEDESTAL.y - 20} r="44" fill="url(#biblio-luz)" />
          <path d={`M${PEDESTAL.x - 26} 548 H ${PEDESTAL.x + 26} L ${PEDESTAL.x + 18} 534 H ${PEDESTAL.x - 18}Z`} fill="oklch(0.62 0.04 50)" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <rect x={PEDESTAL.x - 9} y={PEDESTAL.y + 4} width="18" height="82" fill="oklch(0.66 0.04 50)" stroke={INK} strokeWidth={2.4} />
          <path d={`M${PEDESTAL.x - 30} ${PEDESTAL.y + 10} L ${PEDESTAL.x + 30} ${PEDESTAL.y - 2} L ${PEDESTAL.x + 28} ${PEDESTAL.y + 8} L ${PEDESTAL.x - 28} ${PEDESTAL.y + 20}Z`} fill="oklch(0.5 0.08 45)" stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
          <g transform={`translate(${PEDESTAL.x} ${PEDESTAL.y - 2}) rotate(-11) scale(2.1)`}>
            <LibroAbierto color="oklch(0.5 0.19 330)" />
          </g>
          <path d={`M${PEDESTAL.x - 20} ${PEDESTAL.y - 40} l 1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6z M${PEDESTAL.x + 22} ${PEDESTAL.y - 34} l 1.2 2.6 2.6 1.2 -2.6 1.2 -1.2 2.6 -1.2 -2.6 -2.6 -1.2 2.6 -1.2z`} fill="oklch(0.94 0.1 92)" className="vela" />
          {aprendidos > 0 && (
            <g transform={`translate(${PEDESTAL.x + 26} ${PEDESTAL.y - 30})`}>
              <circle r="11" fill="oklch(0.92 0.13 92)" stroke={INK} strokeWidth={2} />
              <text textAnchor="middle" dy="4" fontSize="12" fontWeight="800" fill={INK}>
                {aprendidos}
              </text>
            </g>
          )}
        </g>
        {/* her books, where she left them */}
        {orden.map((l) => {
          const p = pos.get(l.id)!;
          const { color } = tapa(l.titulo);
          return (
            <g
              key={l.id}
              transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot.toFixed(1)})`}
              onClick={onLibro ? () => onLibro(l.id) : undefined}
              style={onLibro ? { cursor: "pointer" } : undefined}
              role={onLibro ? "button" : undefined}
              aria-label={onLibro ? l.titulo : undefined}
            >
              <g transform="scale(1.35)">
                <g className={nuevo === l.id ? "brotar" : undefined}>{p.abierto ? <LibroAbierto color={color} /> : <LibroCerrado color={color} />}</g>
              </g>
            </g>
          );
        })}
        {children}
      </g>
      {!cielo && <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="21" fill="none" stroke={INK} strokeWidth={3} />}
    </svg>
  );
}
