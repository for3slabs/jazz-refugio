import type { Puestos } from "@/lib/objeto";

// Her cat as Brian drew the reference (2026-10-25): standing up, a big round head with one peach
// ear, an open happy mouth, a small body, one paw waving and two short legs — in the beach's comic
// ink, wearing what her pet wears (bow, mariachi hat, chef's hat, apron). Its feet are at (0, 0) so
// the garden can walk it from flower to flower; the waving paw carries the next flower to plant.
// Vector code.

const INK = "oklch(0.2 0.06 315)";
const PELO = "oklch(0.97 0.02 85)";
const DURAZNO = "oklch(0.86 0.07 55)";
const ROSA = "oklch(0.8 0.1 15)";
const BOCA = "oklch(0.72 0.12 15)";

const trazo = { stroke: INK, strokeWidth: 1.6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

// `sentado`: sitting, its feet tucked forward (on the library table). `pluma`: the waving paw holds
// a quill instead of a flower — it writes what she learned in the big book. `pasaporte`: it holds
// her passport at the airport.
export function Gato({
  conFlor = false,
  puestos = {},
  sentado = false,
  pluma = false,
  pasaporte = false,
}: {
  conFlor?: boolean;
  puestos?: Puestos;
  sentado?: boolean;
  pluma?: boolean;
  pasaporte?: boolean;
}) {
  return (
    <g transform={sentado ? "translate(0 5)" : undefined}>
      {/* legs, then the body over them */}
      {!sentado && (
        <path d="M-9 -7 v4.5 q 0 3 3.5 3 q 3.5 0 3.5 -3 V -7Z M2 -7 v4.5 q 0 3 3.5 3 q 3.5 0 3.5 -3 V -7Z" fill={PELO} {...trazo} />
      )}
      <path d="M-12 -23 C -16 -13 -14.5 -5 -7 -4.5 H 7 C 14.5 -5 16 -13 12 -23Z" fill={PELO} {...trazo} />
      {puestos.cuerpo === "mandil" && (
        // the lilac apron over its belly
        <path d="M-7.5 -18 h 15 l 1 10 q -8.5 3.5 -17 0z" fill="oklch(0.78 0.11 310)" {...trazo} strokeWidth={1.6} />
      )}
      {sentado && (
        // sitting: two feet poking out in front
        <path d="M-10.5 -5 a 4.5 3 0 1 0 9 0 a 4.5 3 0 1 0 -9 0Z M1.5 -5 a 4.5 3 0 1 0 9 0 a 4.5 3 0 1 0 -9 0Z" fill={PELO} {...trazo} />
      )}
      {/* the arm at rest — the waving one is drawn after the head, so it shows */}
      <path d="M-11.5 -20 C -17 -19 -19.5 -13 -16.5 -11 C -14 -9.5 -12 -12.5 -11.8 -15" fill={PELO} {...trazo} />
      {/* ears behind the head: the left one peach */}
      <path d="M-15.5 -37 L -14 -52.5 L -3.5 -45.5Z" fill={DURAZNO} {...trazo} />
      <path d="M15.5 -37 L 14 -52.5 L 3.5 -45.5Z" fill={PELO} {...trazo} />
      {/* the head, with the peach patch spilling from that ear */}
      <ellipse cx="0" cy="-34" rx="18" ry="14.5" fill={PELO} />
      <clipPath id="gato-cabeza">
        <ellipse cx="0" cy="-34" rx="18" ry="14.5" />
      </clipPath>
      <path d="M-20 -52 C -10 -52 -2.5 -47 -2 -41 C -6 -36.5 -14 -33.5 -20 -31Z" fill={DURAZNO} clipPath="url(#gato-cabeza)" />
      <path d="M-2 -41 C -6 -36.5 -14 -33.5 -20 -31" fill="none" stroke={INK} strokeWidth={1.2} clipPath="url(#gato-cabeza)" />
      <ellipse cx="0" cy="-34" rx="18" ry="14.5" fill="none" {...trazo} />
      {/* the face: two dots, a small nose, a wide open smile */}
      <circle cx="-7" cy="-35.5" r="1.9" fill={INK} />
      <circle cx="7" cy="-35.5" r="1.9" fill={INK} />
      <path d="M-1.6 -32.2 h 3.2 l -1.6 1.6z" fill={ROSA} stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
      <path d="M-5 -29.6 Q -2.5 -28.4 0 -30.2 Q 2.5 -28.4 5 -29.6 Q 3 -24.2 0 -24.2 Q -3 -24.2 -5 -29.6Z" fill={BOCA} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
      <ellipse cx="0" cy="-25.8" rx="2.6" ry="1.4" fill={ROSA} />
      {/* the paw waving up beside the head — it holds the next flower */}
      <path d="M11.5 -20 C 17 -21 22.5 -25.5 23.5 -30 C 24.3 -33.5 20.5 -35 19 -31.5 C 17.8 -28.6 15 -26.2 12 -25" fill={PELO} {...trazo} />
      {pasaporte && (
        // her passport, held up in the waving paw: a plum booklet with a gold seal
        <g transform="translate(22 -38) rotate(-10)">
          <rect x="-7" y="-10" width="14" height="19" rx="2" fill="oklch(0.42 0.16 345)" stroke={INK} strokeWidth={1.4} />
          <circle cx="0" cy="-2" r="3.4" fill="none" stroke="oklch(0.85 0.13 85)" strokeWidth={1.1} />
          <path d="M-4 5 h 8" stroke="oklch(0.85 0.13 85)" strokeWidth={1.1} />
        </g>
      )}
      {pluma && (
        // a quill: a long feather with an ink tip
        <g transform="translate(21 -33) rotate(-28)">
          <path d="M0 0 C -3 -8 -2 -18 2 -24 C 5 -16 4 -7 0 0Z" fill="oklch(0.95 0.03 330)" stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          <path d="M0 0 L 1.5 -21" stroke={INK} strokeWidth={0.8} />
          <path d="M0 0 l -0.8 4" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        </g>
      )}
      {conFlor && (
        <g transform="translate(22 -36)">
          <path d="M0 0 L 0.5 4" stroke="oklch(0.62 0.13 135)" strokeWidth={1.6} strokeLinecap="round" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-3" rx="2" ry="3.2" transform={`rotate(${a})`} fill="oklch(0.74 0.17 345)" stroke={INK} strokeWidth={0.8} />
          ))}
          <circle r="1.7" fill="oklch(0.88 0.15 92)" stroke={INK} strokeWidth={0.8} />
        </g>
      )}
      {puestos.cuello === "mono" && (
        // the pink bow under its chin
        <g transform="translate(0 -20.5)" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" fill="oklch(0.74 0.17 350)">
          <path d="M0 0 L -6.5 -3.5 L -6.5 3.5Z" />
          <path d="M0 0 L 6.5 -3.5 L 6.5 3.5Z" />
          <circle r="1.8" />
        </g>
      )}
      {puestos.cabeza === "sombrero" && (
        // a mariachi hat: wide brim, tall crown, a magenta band
        <g transform="translate(0 -46)" stroke={INK} strokeWidth={2} strokeLinejoin="round">
          <ellipse cx="0" cy="0" rx="24" ry="5" fill="oklch(0.8 0.13 75)" />
          <path d="M-9 -1 C -9 -15 9 -15 9 -1Z" fill="oklch(0.8 0.13 75)" />
          <path d="M-8.6 -4 h 17.2" stroke="oklch(0.55 0.21 345)" strokeWidth={3} />
          <ellipse cx="0" cy="0" rx="24" ry="5" fill="none" strokeDasharray="2 3" stroke="oklch(0.55 0.21 345)" strokeWidth={1.2} />
        </g>
      )}
      {puestos.cabeza === "gorro-chef" && (
        // a chef's hat: a band and a puffy top
        <g transform="translate(0 -46)" stroke={INK} strokeWidth={2} strokeLinejoin="round" fill="oklch(0.98 0.01 330)">
          <path d="M-9 2 v -5 h 18 v 5z" />
          <path d="M-10 -3 C -17 -6 -14 -16 -7 -14 C -6 -21 6 -21 7 -14 C 14 -16 17 -6 10 -3Z" />
        </g>
      )}
    </g>
  );
}
