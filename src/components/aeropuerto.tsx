import type { ReactNode } from "react";
import type { Viaje } from "@/lib/estante";

// «tus viajes» as an airport gate in the comic style of her beach and her library (Brian,
// 2026-10-25): a big window onto the runway at sunset where planes take off, the departures board
// that lists the places she wants to go, her cat sitting on the waiting seats with its passport in
// its paw — the passport holds the places she has been. Vector code; no blue anywhere: the sky and
// the glass sit at violet, magenta and orange.

const INK = "oklch(0.2 0.06 315)";
export const W_AERO = 390;
export const H_AERO = 560;
const W = W_AERO;
const H = H_AERO;

export const ASIENTO = { x: 196, y: 452 };
export const PASAPORTE = { x: 196 + 28, y: 452 - 50 };
const TABLERO = { x: 46, y: 18, w: 298, h: 64 };

function Avion({ escala = 1 }: { escala?: number }) {
  return (
    <g transform={`scale(${escala})`} stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
      <path d="M-30 0 C -30 -5 20 -6 30 -2 C 34 -1 34 3 30 4 C 20 7 -30 6 -30 0Z" fill="oklch(0.96 0.02 330)" />
      <path d="M-4 -1 L -14 -16 L -6 -16 L 8 -1Z" fill="oklch(0.6 0.2 340)" />
      <path d="M-4 3 L -12 14 L -5 14 L 7 3Z" fill="oklch(0.6 0.2 340)" />
      <path d="M-28 -1 L -34 -12 L -27 -12 L -22 -1Z" fill="oklch(0.6 0.2 340)" />
      {[0, 7, 14, 21].map((x) => (
        <circle key={x} cx={x - 6} cy="-0.6" r="1.4" fill="oklch(0.36 0.15 308)" strokeWidth={0.6} />
      ))}
    </g>
  );
}

// `despegues`: a counter that rises when she adds a place she wants to go — every new value sends
// one plane off the runway, across the window. `onTablero` / `onPasaporte`: taps.
export function Aeropuerto({
  quiero,
  fui,
  despegues = 0,
  sello = 0,
  onTablero,
  onPasaporte,
  cielo = 0,
  className = "",
  children,
}: {
  quiero: Viaje[];
  fui: number;
  despegues?: number;
  sello?: number;
  onTablero?: () => void;
  onPasaporte?: () => void;
  cielo?: number;
  className?: string;
  children?: ReactNode;
}) {
  const filas = quiero.slice(0, 3);
  return (
    <svg
      viewBox={`0 ${-cielo} ${W} ${H + cielo}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      role="img"
      aria-label={`tu aeropuerto: ${fui} ${fui === 1 ? "lugar" : "lugares"} en tu pasaporte, ${quiero.length} por ir`}
    >
      <defs>
        <pattern id="aero-trama" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="3.5" cy="3.5" r="1.2" fill={INK} opacity={0.28} />
        </pattern>
        <clipPath id="aero-marco">
          <rect y={-cielo} width={W} height={H + cielo} rx={cielo ? 0 : 22} />
        </clipPath>
        <clipPath id="aero-ventana">
          <rect x="18" y="96" width="354" height="250" />
        </clipPath>
      </defs>
      <g clipPath="url(#aero-marco)">
        {/* the terminal wall */}
        <rect y={-cielo} width={W} height={H + cielo} fill="oklch(0.62 0.07 320)" />
        <rect y={-cielo} width={W} height={400 + cielo} fill="url(#aero-trama)" opacity={0.45} />
        {/* the big window onto the runway at sunset */}
        <g clipPath="url(#aero-ventana)">
          <rect x="18" y="96" width="354" height="250" fill="oklch(0.36 0.15 308)" />
          <path d="M18 160 Q 195 148 372 162 V 346 H18Z" fill="oklch(0.5 0.2 330)" />
          <path d="M18 220 Q 195 210 372 222 V 346 H18Z" fill="oklch(0.66 0.18 10)" />
          <path d="M18 262 Q 195 256 372 264 V 346 H18Z" fill="oklch(0.78 0.15 55)" />
          <rect x="18" y="160" width="354" height="110" fill="url(#aero-trama)" opacity={0.5} />
          <circle cx="290" cy="276" r="34" fill="oklch(0.92 0.13 92)" stroke={INK} strokeWidth={2.4} />
          {/* hills, the control tower, the runway */}
          <path d="M18 290 Q 80 270 140 288 T 260 284 T 372 280 V 346 H18Z" fill="oklch(0.45 0.12 330)" stroke={INK} strokeWidth={2} />
          <g stroke={INK} strokeWidth={2} strokeLinejoin="round">
            <rect x="330" y="230" width="12" height="62" fill="oklch(0.7 0.05 320)" />
            <path d="M322 216 H 350 L 346 232 H 326Z" fill="oklch(0.85 0.1 85)" />
          </g>
          <path d="M18 304 H 372 V 346 H18Z" fill="oklch(0.4 0.05 320)" stroke={INK} strokeWidth={2} />
          <path d="M30 325 H 372" stroke="oklch(0.95 0.03 85)" strokeWidth={3} strokeDasharray="16 12" />
          {/* a plane waiting on the runway */}
          <g transform="translate(90 312)">
            <Avion escala={0.9} />
          </g>
          {/* the one that leaves when she adds a place she wants to go */}
          {despegues > 0 && (
            <g key={despegues} className="despegue">
              <Avion escala={1.1} />
            </g>
          )}
        </g>
        <rect x="18" y="96" width="354" height="250" fill="none" stroke={INK} strokeWidth={5} />
        <path d="M136 96 V 346 M254 96 V 346" stroke={INK} strokeWidth={4} />
        <rect x="10" y="344" width="370" height="12" fill="oklch(0.5 0.06 320)" stroke={INK} strokeWidth={2.4} />
        {/* the departures board: her wished places, the score */}
        <g
          onClick={onTablero}
          style={onTablero ? { cursor: "pointer" } : undefined}
          role={onTablero ? "button" : undefined}
          aria-label={onTablero ? `salidas: ${quiero.length} ${quiero.length === 1 ? "vuelo" : "vuelos"} que quieres tomar` : undefined}
        >
          <path d={`M${TABLERO.x + 40} 0 V ${TABLERO.y} M${TABLERO.x + TABLERO.w - 40} 0 V ${TABLERO.y}`} stroke={INK} strokeWidth={2.4} />
          <rect x={TABLERO.x} y={TABLERO.y} width={TABLERO.w} height={TABLERO.h} rx="6" fill="oklch(0.22 0.05 315)" stroke={INK} strokeWidth={3} />
          <text x={TABLERO.x + 10} y={TABLERO.y + 14} fontSize="9" fontWeight="800" letterSpacing="2" fill="oklch(0.92 0.13 92)">
            SALIDAS
          </text>
          <text x={TABLERO.x + TABLERO.w - 10} y={TABLERO.y + 14} fontSize="9" fontWeight="800" textAnchor="end" fill="oklch(0.92 0.13 92)">
            {quiero.length} {quiero.length === 1 ? "VUELO" : "VUELOS"}
          </text>
          {filas.length === 0 ? (
            <text x={TABLERO.x + 10} y={TABLERO.y + 34} fontSize="9" fontFamily="ui-monospace, monospace" fill="oklch(0.85 0.05 320)">
              — sin vuelos todavía —
            </text>
          ) : (
            filas.map((v, i) => (
              <g key={v.id} fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="700">
                <text x={TABLERO.x + 10} y={TABLERO.y + 29 + i * 12} fill="oklch(0.92 0.13 92)">
                  {`JZ ${String(101 + i)}`}
                </text>
                <text x={TABLERO.x + 52} y={TABLERO.y + 29 + i * 12} fill="oklch(0.97 0.02 330)">
                  {v.lugar.toUpperCase().slice(0, 24)}
                </text>
                <text x={TABLERO.x + TABLERO.w - 10} y={TABLERO.y + 29 + i * 12} textAnchor="end" fill="oklch(0.8 0.15 150)">
                  A TIEMPO
                </text>
              </g>
            ))
          )}
        </g>
        {/* the floor: terminal tiles */}
        <rect y="400" width={W} height={H - 400} fill="oklch(0.78 0.05 320)" />
        {Array.from({ length: 14 }, (_, j) => (
          <path key={`v${j}`} d={`M${j * 30} 400 L ${j * 30 - 40 + (j - 6) * 14} ${H}`} stroke={INK} strokeWidth={1} opacity={0.4} />
        ))}
        {Array.from({ length: 5 }, (_, j) => (
          <path key={`h${j}`} d={`M0 ${420 + j * 30 + j * j * 3} H ${W}`} stroke={INK} strokeWidth={1} opacity={0.4} />
        ))}
        <rect y="400" width={W} height={H - 400} fill="url(#aero-trama)" opacity={0.3} />
        <path d="M0 400 H 390" stroke={INK} strokeWidth={3} />
        {/* the waiting seats */}
        <g stroke={INK} strokeWidth={2.4} strokeLinejoin="round">
          <path d="M84 500 V 470 M308 500 V 470" strokeWidth={4} />
          <rect x="74" y="462" width="244" height="10" rx="3" fill="oklch(0.5 0.06 320)" />
          {[0, 1, 2].map((k) => (
            <g key={k} transform={`translate(${86 + k * 74} 0)`}>
              <rect x="0" y="404" width="66" height="46" rx="10" fill="oklch(0.55 0.2 340)" />
              <rect x="-2" y="444" width="70" height="16" rx="6" fill="oklch(0.6 0.2 340)" />
            </g>
          ))}
        </g>
        {/* a suitcase covered in stickers */}
        <g transform="translate(332 500)" stroke={INK} strokeWidth={2.2} strokeLinejoin="round">
          <path d="M-10 -46 V -54 H 10 V -46" fill="none" />
          <rect x="-22" y="-46" width="44" height="46" rx="7" fill="oklch(0.8 0.14 70)" />
          <circle cx="-8" cy="-30" r="6" fill="oklch(0.7 0.18 345)" strokeWidth={1.4} />
          <rect x="2" y="-20" width="13" height="9" rx="2" fill="oklch(0.95 0.03 330)" strokeWidth={1.4} />
          <circle cx="-14" cy="3" r="3" fill={INK} />
          <circle cx="14" cy="3" r="3" fill={INK} />
        </g>
        {/* the passport, in its paw: tapping it opens the places she has been */}
        <g
          onClick={onPasaporte}
          style={onPasaporte ? { cursor: "pointer" } : undefined}
          role={onPasaporte ? "button" : undefined}
          aria-label={onPasaporte ? `tu pasaporte: ${fui} ${fui === 1 ? "sello" : "sellos"}` : undefined}
        >
          {children}
          {fui > 0 && (
            <g transform={`translate(${PASAPORTE.x + 18} ${PASAPORTE.y - 16})`} key={sello} className={sello ? "brotar" : undefined}>
              <circle r="10" fill="oklch(0.92 0.13 92)" stroke={INK} strokeWidth={2} />
              <text textAnchor="middle" dy="3.5" fontSize="10" fontWeight="800" fill={INK}>
                {fui}
              </text>
            </g>
          )}
        </g>
      </g>
      {!cielo && <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="21" fill="none" stroke={INK} strokeWidth={3} />}
    </svg>
  );
}
