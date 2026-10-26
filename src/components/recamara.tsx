import type { ReactNode } from "react";

// «tus deseos» as her bedroom at night, in the comic style of her beach, library and airport (Brian,
// 2026-10-25: «algo más íntimo… su recámara… el gato en el balcón pensando, de noche… el escritorio
// con un libro donde apunte sus deseos… una paloma llega a su balcón»). The balcony doors are open
// onto a sleeping city under the moon; her cat sits out there thinking; on the desk, the book of her
// wishes under a warm lamp; above it a framed picture of her own beach; and when Brian sends
// her a wish, a dove lands on the railing with a little alert. Vector code; no blue anywhere.

const INK = "oklch(0.2 0.06 315)";
export const W_RECAMARA = 390;
export const H_RECAMARA = 560;
const W = W_RECAMARA;
const H = H_RECAMARA;

export const BALCON = { x: 292, y: 470 };
const PALOMA = { x: 352, y: 426 };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

// the city asleep below: buildings, a few windows still lit
const CIUDAD = (() => {
  const r = rng(5);
  const out: { x: number; w: number; h: number; luces: { x: number; y: number }[] }[] = [];
  for (let x = 196; x < 384; ) {
    const w = 18 + Math.floor(r() * 18);
    const h = 40 + Math.floor(r() * 70);
    const luces: { x: number; y: number }[] = [];
    for (let fy = 0; fy < h - 12; fy += 11)
      for (let fx = 4; fx < w - 6; fx += 8) if (r() < 0.22) luces.push({ x: x + fx, y: 418 - h + 6 + fy });
    out.push({ x, w, h, luces });
    x += w + 2;
  }
  return out;
})();

const ESTRELLAS = [
  [214, 196],
  [246, 168],
  [300, 186],
  [356, 172],
  [228, 240],
  [338, 230],
  [272, 214],
];

export function Recamara({
  deseos,
  paloma = false,
  vuela = 0,
  onLibro,
  onPaloma,
  cielo = 0,
  className = "",
  children,
}: {
  deseos: number;
  paloma?: boolean;
  vuela?: number;
  onLibro?: () => void;
  onPaloma?: () => void;
  cielo?: number;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <svg
      viewBox={`0 ${-cielo} ${W} ${H + cielo}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      role="img"
      aria-label={`tu recámara de noche: ${deseos} ${deseos === 1 ? "deseo" : "deseos"} en tu libro`}
    >
      <defs>
        <pattern id="rec-trama" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="3.5" cy="3.5" r="1.2" fill={INK} opacity={0.3} />
        </pattern>
        <radialGradient id="rec-luz">
          <stop offset="0" stopColor="oklch(0.92 0.13 85)" stopOpacity="0.7" />
          <stop offset="1" stopColor="oklch(0.92 0.13 85)" stopOpacity="0" />
        </radialGradient>
        <clipPath id="rec-marco">
          <rect y={-cielo} width={W} height={H + cielo} rx={cielo ? 0 : 22} />
        </clipPath>
        <clipPath id="rec-puerta">
          <rect x="190" y="150" width="190" height="270" />
        </clipPath>
      </defs>
      <g clipPath="url(#rec-marco)">
        {/* her room's wall at night, a soft dotted wallpaper */}
        <rect y={-cielo} width={W} height={H + cielo} fill="oklch(0.34 0.09 318)" />
        <rect y={-cielo} width={W} height={430 + cielo} fill="url(#rec-trama)" opacity={0.5} />
        {/* the open balcony doors: the night, the moon, the sleeping city */}
        <g clipPath="url(#rec-puerta)">
          <rect x="190" y="150" width="190" height="270" fill="oklch(0.24 0.1 308)" />
          <path d="M190 300 Q 285 288 380 300 V 420 H190Z" fill="oklch(0.3 0.13 310)" />
          <path d="M190 360 Q 285 352 380 362 V 420 H190Z" fill="oklch(0.4 0.15 330)" />
          <circle cx="330" cy="200" r="20" fill="oklch(0.95 0.08 92)" stroke={INK} strokeWidth={2} />
          <circle cx="340" cy="193" r="17" fill="oklch(0.24 0.1 308)" />
          {ESTRELLAS.map(([x, y]) => (
            <path key={`${x}${y}`} d={`M${x} ${y - 4} l 1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2z`} fill="oklch(0.95 0.08 92)" className="vela" />
          ))}
          {CIUDAD.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={418 - b.h} width={b.w} height={b.h} fill="oklch(0.22 0.06 315)" stroke={INK} strokeWidth={1.4} />
              {b.luces.map((l, j) => (
                <rect key={j} x={l.x} y={l.y} width="4" height="5" fill="oklch(0.88 0.14 85)" />
              ))}
            </g>
          ))}
        </g>
        <rect x="190" y="150" width="190" height="270" fill="none" stroke={INK} strokeWidth={5} />
        <path d="M285 150 V 420" stroke={INK} strokeWidth={3} opacity={0.5} />
        {/* fairy lights across the top of the doors */}
        <path d="M186 158 Q 236 178 285 160 Q 334 178 384 158" fill="none" stroke={INK} strokeWidth={1.4} />
        {[200, 222, 246, 270, 300, 324, 348, 372].map((x, i) => (
          <circle key={x} cx={x} cy={164 + (i % 2) * 6} r="3.4" fill="oklch(0.9 0.14 85)" stroke={INK} strokeWidth={1} className="vela" style={{ animationDelay: `${i * 0.4}s` }} />
        ))}
        {/* pink curtains tied back */}
        <path d="M184 146 C 196 240 176 330 196 430 L 178 430 C 168 330 182 240 172 146Z" fill="oklch(0.62 0.17 345)" stroke={INK} strokeWidth={2.2} />
        <path d="M386 146 C 374 240 394 330 374 430 L 392 430 V 146Z" fill="oklch(0.62 0.17 345)" stroke={INK} strokeWidth={2.2} />
        {/* the balcony: floor and railing */}
        <rect x="186" y="420" width="204" height="52" fill="oklch(0.45 0.06 320)" stroke={INK} strokeWidth={2.4} />
        <path d="M190 416 H 390" stroke={INK} strokeWidth={4} />
        {Array.from({ length: 10 }, (_, j) => (
          <path key={j} d={`M${198 + j * 20} 418 V 470`} stroke={INK} strokeWidth={2.2} />
        ))}
        <path d="M188 470 H 390" stroke={INK} strokeWidth={4} />
        {/* on her wall, a framed picture of her own sunset beach — her room holds only her things */}
        <g transform="translate(40 240)" stroke={INK} strokeLinejoin="round">
          <rect x="-6" y="-6" width="112" height="92" rx="3" fill="oklch(0.6 0.09 60)" strokeWidth={3} />
          <rect x="0" y="0" width="100" height="80" fill="oklch(0.36 0.15 308)" strokeWidth={1.6} />
          <path d="M0 28 Q 50 22 100 30 V 80 H0Z" fill="oklch(0.5 0.2 330)" stroke="none" />
          <path d="M0 44 Q 50 40 100 46 V 80 H0Z" fill="oklch(0.7 0.16 30)" stroke="none" />
          <circle cx="50" cy="50" r="13" fill="oklch(0.92 0.13 92)" strokeWidth={1.4} />
          <rect x="0" y="52" width="100" height="14" fill="oklch(0.42 0.15 315)" strokeWidth={1.2} />
          <path d="M0 66 Q 50 60 100 68 V 80 H0Z" fill="oklch(0.82 0.08 65)" strokeWidth={1.2} />
          {[14, 30, 46, 64, 82].map((x, i) => (
            <circle key={x} cx={x} cy={72 + (i % 2) * 3} r="3" fill={i % 2 ? "oklch(0.74 0.17 345)" : "oklch(0.66 0.21 312)"} strokeWidth={0.8} />
          ))}
        </g>
        {/* the floor of her room, a round rug */}
        <rect y="472" width={W} height={H - 472} fill="oklch(0.4 0.07 40)" />
        <rect x="0" y="420" width="186" height="52" fill="oklch(0.42 0.07 40)" />
        <path d="M0 420 H 186" stroke={INK} strokeWidth={3} />
        <rect y="420" width={W} height={H - 420} fill="url(#rec-trama)" opacity={0.25} />
        <ellipse cx="110" cy="520" rx="96" ry="22" fill="oklch(0.55 0.15 330)" stroke={INK} strokeWidth={2.2} />
        {/* the desk with its lamp and the book of her wishes */}
        <g stroke={INK} strokeLinejoin="round">
          <path d="M34 432 V 540 M146 432 V 540" strokeWidth={8} strokeLinecap="round" />
          <path d="M34 432 V 540 M146 432 V 540" stroke="oklch(0.52 0.08 45)" strokeWidth={4.5} strokeLinecap="round" />
          <rect x="18" y="420" width="144" height="13" rx="3" fill="oklch(0.58 0.09 50)" strokeWidth={2.6} />
          {/* the lamp */}
          <circle cx="44" cy="380" r="40" fill="url(#rec-luz)" stroke="none" />
          <path d="M40 420 V 386" strokeWidth={3} />
          <path d="M28 386 L 34 366 H 54 L 60 386Z" fill="oklch(0.85 0.12 75)" strokeWidth={2.2} />
          <rect x="32" y="416" width="16" height="5" rx="2" fill="oklch(0.5 0.06 320)" strokeWidth={1.6} />
        </g>
        <g onClick={onLibro} style={onLibro ? { cursor: "pointer" } : undefined} role={onLibro ? "button" : undefined} aria-label={onLibro ? `tu libro de deseos: ${deseos}` : undefined}>
          <circle cx="104" cy="408" r="30" fill="url(#rec-luz)" />
          <g transform="translate(104 416) rotate(-6) scale(1.9)" stroke={INK} strokeLinejoin="round">
            <path d="M-17 0 L -16 -9 Q -8 -12 0 -8 Q 8 -12 16 -9 L 17 0 Q 8 -3 0 0 Q -8 -3 -17 0Z" fill="oklch(0.5 0.19 345)" strokeWidth={1.4} />
            <path d="M-15 -2 L -14.5 -9 Q -7 -11.5 0 -8 L 0 -1 Q -7 -4 -15 -2Z M15 -2 L 14.5 -9 Q 7 -11.5 0 -8 L 0 -1 Q 7 -4 15 -2Z" fill="oklch(0.96 0.025 85)" strokeWidth={1} />
            <path d="M-6 -6.5 a 1.6 1.6 0 0 1 3 0 a 1.6 1.6 0 0 1 3 0 q 0 2 -3 3.6 q -3 -1.6 -3 -3.6z" fill="oklch(0.65 0.2 345)" strokeWidth={0.5} />
            <path d="M3 -6 q 4 -1.5 9 0 M3 -4 q 4 -1.5 8 0" stroke={INK} strokeWidth={0.6} opacity={0.5} fill="none" />
          </g>
          {deseos > 0 && (
            <g transform="translate(140 382)">
              <circle r="10" fill="oklch(0.92 0.13 92)" stroke={INK} strokeWidth={2} />
              <text textAnchor="middle" dy="3.5" fontSize="10" fontWeight="800" fill={INK}>
                {deseos}
              </text>
            </g>
          )}
        </g>
        {/* her cat out on the balcony, thinking */}
        {children}
        {/* the dove Brian sends: lands on the railing with a little alert; tapping it opens the wish */}
        {paloma && (
          <g
            key={vuela}
            className="paloma"
            onClick={onPaloma}
            style={onPaloma ? { cursor: "pointer" } : undefined}
            role={onPaloma ? "button" : undefined}
            aria-label={onPaloma ? "una paloma trae un deseo" : undefined}
          >
            <g transform={`translate(${PALOMA.x} ${PALOMA.y})`} stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
              <rect x="-26" y="-50" width="52" height="56" fill="transparent" stroke="none" />
              <path d="M-16 -4 C -18 -18 -4 -24 6 -18 C 14 -14 16 -6 12 0 C 4 4 -10 4 -16 -4Z" fill="oklch(0.97 0.01 330)" />
              <path d="M-4 -14 C 4 -24 16 -22 18 -14 C 10 -14 4 -10 -2 -8Z" fill="oklch(0.92 0.02 330)" />
              <circle cx="10" cy="-20" r="7" fill="oklch(0.97 0.01 330)" />
              <circle cx="12" cy="-21" r="1.4" fill={INK} stroke="none" />
              <path d="M16 -19 l 6 1.5 -6 1.5z" fill="oklch(0.8 0.13 70)" strokeWidth={1.2} />
              <path d="M-16 -4 l -8 3 7 2z" fill="oklch(0.92 0.02 330)" />
              <path d="M-2 2 v 4 M4 2 v 4" stroke="oklch(0.65 0.18 20)" strokeWidth={2} />
              {/* a little envelope in its beak */}
              <rect x="19" y="-20" width="11" height="8" rx="1" fill="oklch(0.95 0.03 330)" strokeWidth={1.2} />
              <path d="M19 -20 l 5.5 4.5 5.5 -4.5" fill="none" strokeWidth={1} />
              {/* the alert */}
              <g transform="translate(-2 -40)" className="vela">
                <circle r="9" fill="oklch(0.92 0.13 92)" />
                <text textAnchor="middle" dy="4" fontSize="12" fontWeight="900" fill={INK} stroke="none">
                  !
                </text>
              </g>
            </g>
          </g>
        )}
      </g>
      {!cielo && <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="21" fill="none" stroke={INK} strokeWidth={3} />}
    </svg>
  );
}

// A thought bubble over her cat: little rising circles and a cloud with a star in it.
export function Pensamiento() {
  return (
    <g stroke={INK} strokeWidth={1.6} fill="oklch(0.97 0.02 330)" className="vela">
      <circle cx="18" cy="-74" r="3" />
      <circle cx="26" cy="-86" r="4.5" />
      <path d="M22 -100 q 0 -14 14 -14 q 4 -10 16 -7 q 10 -6 18 3 q 12 0 12 12 q 0 12 -14 12 h -32 q -14 0 -14 -6z" />
      <path d="M50 -108 l 2 4.5 5 1 -3.6 3.4 1 5 -4.4 -2.4 -4.4 2.4 1 -5 -3.6 -3.4 5 -1z" fill="oklch(0.92 0.13 92)" strokeWidth={1.2} />
    </g>
  );
}
