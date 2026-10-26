// «tu jardín» as a beach at sunset in the comic style Brian chose (2026-10-25): bold ink outlines,
// flat bands, sunburst rays and halftone dots. Every flower she earns grows INTO the landscape —
// the first ones at the front edge, across the whole beach, then climbing toward the sea — and
// slot n is always the same place, so her garden only ever grows. Vector code, never an image.
// No blue anywhere: the sea and sky sit at violet, magenta and orange hues.

const INK = "oklch(0.2 0.06 315)";
const W = 390;
const H = 560;
export const W_PLAYA = W;
export const H_PLAYA = H;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

// the top edge of the sand at x
const duna = (x: number) => 372 + 18 * Math.sin(x / 70 + 0.6) + 10 * Math.sin(x / 31);

export type Slot = { x: number; y: number; k: number; i: number };

// Every place a flower can grow, worked out once: spaced so petals touch but do not pile up,
// ordered front edge first (with a little randomness) so the garden climbs toward the sea.
export const SLOTS: Slot[] = (() => {
  const r = rng(7);
  const out: { x: number; y: number; k: number }[] = [];
  for (let guard = 0; out.length < 260 && guard < 20000; guard++) {
    const x = 14 + r() * (W - 28);
    const top = duna(x) + 10;
    const y = top + r() * (H - 18 - top);
    if (out.some((p) => Math.hypot(p.x - x, (p.y - y) * 1.5) < 21)) continue;
    out.push({ x, y, k: r() });
  }
  return out
    .map((p) => ({ ...p, orden: H - p.y + p.k * 46 }))
    .sort((a, b) => a.orden - b.orden)
    .map((p, i) => ({ x: p.x, y: p.y, k: p.k, i }));
})();

const PETALOS = [
  "oklch(0.74 0.17 345)",
  "oklch(0.66 0.21 312)",
  "oklch(0.82 0.11 350)",
  "oklch(0.76 0.15 22)",
  "oklch(0.95 0.03 330)",
  "oklch(0.6 0.22 330)",
];
const TALLO = "oklch(0.62 0.13 135)";

// `nueva`: it sprouts in front of her — grows up out of the sand with a little bounce.
function Flor({ x, y, k, i, nueva = false }: Slot & { nueva?: boolean }) {
  // nearer is bigger: the beach has depth
  const t = (y - 370) / (H - 370);
  const s = 0.85 + t * 0.95 + k * 0.2;
  const color = PETALOS[(i * 5 + Math.floor(k * 10)) % PETALOS.length];
  const n = 5 + (i % 2);
  const largo = 10 + t * 8;
  const tallo = `M0 0 Q ${(-3 + k * 6).toFixed(1)} ${(largo / 2).toFixed(1)} 0 ${largo.toFixed(1)}`;
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(2)})`}>
      <g className={nueva ? "brotar" : undefined}>
      <path d={tallo} stroke={INK} strokeWidth={3.2} fill="none" strokeLinecap="round" />
      <path d={tallo} stroke={TALLO} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <path d={`M0 ${(largo * 0.6).toFixed(1)} q 6 -4 8 -1 q -4 4 -8 1z`} fill={TALLO} stroke={INK} strokeWidth={1} />
      <g transform={`rotate(${((k - 0.5) * 30).toFixed(0)})`}>
        {Array.from({ length: n }, (_, j) => (
          <ellipse key={j} cx="0" cy="-6.2" rx="3.6" ry="6.2" transform={`rotate(${(360 / n) * j})`} fill={color} stroke={INK} strokeWidth={1.3} />
        ))}
        <circle r="3.4" fill="oklch(0.88 0.15 92)" stroke={INK} strokeWidth={1.3} />
        <circle r="1" cx="-1" cy="-1" fill={INK} opacity={0.5} />
      </g>
      </g>
    </g>
  );
}

const DUNA = (() => {
  let d = `M0 ${H} L0 ${duna(0).toFixed(1)}`;
  for (let x = 0; x <= W; x += 10) d += ` L${x} ${duna(x).toFixed(1)}`;
  return d + ` L${W} ${H}Z`;
})();

const RAYOS = Array.from({ length: 16 }, (_, j) => {
  const a1 = Math.PI + (Math.PI / 16) * j;
  const a2 = a1 + Math.PI / 32;
  const R = 460;
  const p = (a: number) => `${(195 + Math.cos(a) * R).toFixed(0)} ${(296 + Math.sin(a) * R).toFixed(0)}`;
  return `M195 296 L${p(a1)} L${p(a2)}Z`;
});

// `mostrar`: which places have a flower now (the first `flores` by default) — while her cat plants,
// the garden shows only what has grown so far. `nuevas`: the ones that sprout as she watches.
// `children`: drawn on top of the beach, inside the frame — her cat.
export function Playa({
  flores,
  mostrar,
  nuevas,
  className = "",
  children,
}: {
  flores: number;
  mostrar?: number[];
  nuevas?: Set<number>;
  className?: string;
  children?: React.ReactNode;
}) {
  // back to front, so a nearer flower overlaps the one behind it
  const crecidas = (mostrar ?? SLOTS.slice(0, Math.min(flores, SLOTS.length)).map((s) => s.i))
    .map((i) => SLOTS[i])
    .filter(Boolean)
    .sort((a, b) => a.y - b.y);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={`tu jardín en la playa, con ${flores} ${flores === 1 ? "flor" : "flores"}`}>
      <defs>
        <pattern id="playa-trama" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="3.5" cy="3.5" r="1.25" fill={INK} opacity={0.28} />
        </pattern>
        <pattern id="playa-trama-sol" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="3" cy="3" r="1.1" fill="oklch(0.7 0.18 40)" opacity={0.55} />
        </pattern>
        <clipPath id="playa-marco">
          <rect width={W} height={H} rx="22" />
        </clipPath>
      </defs>
      <g clipPath="url(#playa-marco)">
        {/* the sky in flat comic bands */}
        <rect width={W} height={H} fill="oklch(0.34 0.15 308)" />
        <path d="M0 120 Q 100 104 195 118 T 390 112 V 300 H0Z" fill="oklch(0.5 0.2 330)" />
        <path d="M0 196 Q 110 184 200 196 T 390 190 V 300 H0Z" fill="oklch(0.66 0.18 10)" />
        <path d="M0 250 Q 120 242 210 252 T 390 246 V 300 H0Z" fill="oklch(0.78 0.15 55)" />
        <rect y="120" width={W} height="180" fill="url(#playa-trama)" />
        {RAYOS.map((d) => (
          <path key={d} d={d} fill="oklch(0.86 0.12 50)" opacity={0.16} />
        ))}
        {/* the sun sinking */}
        <circle cx="195" cy="296" r="66" fill="oklch(0.82 0.16 70)" stroke={INK} strokeWidth={3} />
        <circle cx="195" cy="296" r="66" fill="url(#playa-trama-sol)" />
        <circle cx="195" cy="296" r="48" fill="oklch(0.92 0.13 92)" />
        {/* clouds and birds */}
        <path
          d="M30 150 q 6 -16 24 -12 q 8 -14 26 -6 q 16 -4 18 12 q 10 4 2 12 H34 q -12 -2 -4 -6z"
          fill="oklch(0.75 0.13 350)"
          stroke={INK}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
        <path
          d="M270 90 q 6 -14 22 -10 q 8 -12 24 -4 q 14 -3 16 10 q 9 4 1 10 H274 q -10 -2 -4 -6z"
          fill="oklch(0.62 0.17 335)"
          stroke={INK}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
        <path d="M300 170 q 6 -6 12 0 q 6 -6 12 0 M330 150 q 5 -5 10 0 q 5 -5 10 0" fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        {/* the sea: violet, never blue */}
        <rect y="296" width={W} height={H - 296} fill="oklch(0.4 0.15 315)" />
        <rect y="296" width={W} height="3" fill={INK} />
        <path d="M0 330 H390 V352 H0Z" fill="oklch(0.48 0.17 322)" />
        {Array.from({ length: 7 }, (_, j) => {
          const half = 46 - j * 5;
          return <rect key={j} x={195 - half} y={300 + j * 9} width={half * 2} height="3.4" rx="1.7" fill="oklch(0.9 0.13 88)" />;
        })}
        {Array.from({ length: 5 }, (_, j) => {
          const y = 318 + j * 13;
          return (
            <path
              key={j}
              d={`M${(j * 37) % 60} ${y} q 10 -5 20 0 M${120 + ((j * 53) % 80)} ${y + 4} q 12 -5 24 0 M${270 + ((j * 29) % 70)} ${y} q 10 -5 20 0`}
              fill="none"
              stroke={INK}
              strokeWidth={1.6}
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        })}
        {/* foam, then the sand */}
        <path d={DUNA} transform="translate(0 -9)" fill="oklch(0.95 0.03 330)" stroke={INK} strokeWidth={2.4} />
        <path d={DUNA} fill="oklch(0.82 0.08 65)" stroke={INK} strokeWidth={3} />
        <path d={DUNA} fill="url(#playa-trama)" opacity={0.45} />
        {/* a palm framing the panel */}
        <path d="M356 560 C 350 480 342 430 330 382" stroke={INK} strokeWidth={13} fill="none" strokeLinecap="round" />
        <path d="M356 560 C 350 480 342 430 330 382" stroke="oklch(0.55 0.09 50)" strokeWidth={8} fill="none" strokeLinecap="round" />
        <g transform="translate(330 380)" fill="oklch(0.55 0.13 140)" stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
          <path d="M0 0 C -30 -20 -60 -14 -78 8 C -54 -2 -30 0 0 0Z" />
          <path d="M0 0 C -14 -34 -44 -48 -66 -40 C -40 -30 -18 -18 0 0Z" />
          <path d="M0 0 C 10 -36 36 -50 60 -44 C 36 -32 16 -18 0 0Z" />
          <path d="M0 0 C 30 -16 58 -6 72 14 C 48 2 26 2 0 0Z" />
        </g>
        {crecidas.map((s) => (
          <Flor key={s.i} {...s} nueva={nuevas?.has(s.i)} />
        ))}
        {children}
      </g>
      <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="21" fill="none" stroke={INK} strokeWidth={3} />
    </svg>
  );
}
