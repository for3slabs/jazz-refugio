import type { Puestos } from "@/lib/objeto";

// Her cat in the comic style of the beach — cream, ink outline, pink ears — drawn facing right with
// its paws at (0, 0), so the garden can walk it from flower to flower. It wears what her pet wears
// (Brian, 2026-10-25: not the 3D one — the same clothes, in the style of the flowers) and carries a
// flower in its mouth while there are more to plant. Vector code.

const INK = "oklch(0.2 0.06 315)";
const PELO = "oklch(0.93 0.045 80)";
const SOMBRA = "oklch(0.82 0.06 70)";
const ROSA = "oklch(0.8 0.11 355)";

export function Gato({ conFlor = false, mirando = 1, puestos = {} }: { conFlor?: boolean; mirando?: 1 | -1; puestos?: Puestos }) {
  return (
    <g transform={`scale(${mirando} 1)`}>
      {/* tail */}
      <path d="M-16 -14 C -30 -16 -32 -34 -22 -38" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d="M-16 -14 C -30 -16 -32 -34 -22 -38" fill="none" stroke={PELO} strokeWidth={4} strokeLinecap="round" />
      {/* body and paws */}
      <ellipse cx="-2" cy="-13" rx="17" ry="11" fill={PELO} stroke={INK} strokeWidth={2.4} />
      <path d="M-12 -4 v4 M-4 -3 v3 M6 -3 v3 M12 -4 v4" stroke={INK} strokeWidth={4.6} strokeLinecap="round" />
      <path d="M-12 -4 v4 M-4 -3 v3 M6 -3 v3 M12 -4 v4" stroke={PELO} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M-10 -18 q 6 3 12 0" fill="none" stroke={SOMBRA} strokeWidth={2.4} strokeLinecap="round" />
      {puestos.cuerpo === "mandil" && (
        // the lilac apron over its chest, with its strap
        <g stroke={INK} strokeWidth={1.8} strokeLinejoin="round">
          <path d="M2 -21 h 13 l 1 12 q -7 4 -15 0z" fill="oklch(0.78 0.11 310)" />
          <path d="M4 -14 h 9" fill="none" opacity={0.6} />
          <path d="M2 -21 q 6 -5 13 0" fill="none" />
        </g>
      )}
      {/* head */}
      <g transform="translate(13 -26)">
        <path d="M-9 -6 L -11 -19 L -2 -11Z M9 -6 L 11 -19 L 2 -11Z" fill={PELO} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M-8.6 -8 L -9.6 -15 L -4.5 -10.5Z M8.6 -8 L 9.6 -15 L 4.5 -10.5Z" fill={ROSA} />
        <circle r="11" fill={PELO} stroke={INK} strokeWidth={2.4} />
        <ellipse cx="-4" cy="-1" rx="1.7" ry="2.3" fill={INK} />
        <ellipse cx="4.5" cy="-1" rx="1.7" ry="2.3" fill={INK} />
        <circle cx="-3.5" cy="-1.8" r="0.6" fill="#fff" />
        <circle cx="5" cy="-1.8" r="0.6" fill="#fff" />
        <path d="M-0.8 2.6 l 1.3 1 1.3 -1z" fill={ROSA} stroke={INK} strokeWidth={0.8} strokeLinejoin="round" />
        <path d="M0.5 3.6 q -1.6 2 -3.2 0.6 M0.5 3.6 q 1.6 2 3.2 0.6" fill="none" stroke={INK} strokeWidth={1} strokeLinecap="round" />
        <ellipse cx="-7.5" cy="3" rx="2.2" ry="1.3" fill={ROSA} opacity={0.8} />
        <ellipse cx="8" cy="3" rx="2.2" ry="1.3" fill={ROSA} opacity={0.8} />
        {puestos.cabeza === "sombrero" && (
          // a mariachi hat: wide brim, tall crown, a magenta band
          <g transform="translate(0 -9)" stroke={INK} strokeWidth={2} strokeLinejoin="round">
            <ellipse cx="0" cy="0" rx="19" ry="4.5" fill="oklch(0.8 0.13 75)" />
            <path d="M-8 -1 C -8 -14 8 -14 8 -1Z" fill="oklch(0.8 0.13 75)" />
            <path d="M-7.6 -4 h 15.2" stroke="oklch(0.55 0.21 345)" strokeWidth={3} />
            <ellipse cx="0" cy="0" rx="19" ry="4.5" fill="none" strokeDasharray="2 3" stroke="oklch(0.55 0.21 345)" strokeWidth={1.2} />
          </g>
        )}
        {puestos.cabeza === "gorro-chef" && (
          // a chef's hat: a band and a puffy top
          <g transform="translate(0 -9)" stroke={INK} strokeWidth={2} strokeLinejoin="round" fill="oklch(0.98 0.01 330)">
            <path d="M-8 2 v -5 h 16 v 5z" />
            <path d="M-9 -3 C -15 -6 -12 -15 -6 -13 C -5 -19 5 -19 6 -13 C 12 -15 15 -6 9 -3Z" />
          </g>
        )}
        {puestos.cuello === "mono" && (
          // the pink bow under its chin
          <g transform="translate(0 11)" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" fill="oklch(0.74 0.17 350)">
            <path d="M0 0 L -7 -4 L -7 4Z" />
            <path d="M0 0 L 7 -4 L 7 4Z" />
            <circle r="2" />
          </g>
        )}
        {conFlor && (
          <g transform="translate(9 6) rotate(20)">
            <path d="M0 0 L 6 5" stroke="oklch(0.62 0.13 135)" strokeWidth={1.6} strokeLinecap="round" />
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx="0" cy="-3" rx="2" ry="3.2" transform={`rotate(${a})`} fill="oklch(0.74 0.17 345)" stroke={INK} strokeWidth={0.8} />
            ))}
            <circle r="1.7" fill="oklch(0.88 0.15 92)" stroke={INK} strokeWidth={0.8} />
          </g>
        )}
      </g>
    </g>
  );
}
