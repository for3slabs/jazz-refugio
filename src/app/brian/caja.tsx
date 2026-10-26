import { useId } from "react";

// A wrapped box drawn in her colors — striped paper in the accent and its pink, a ribbon and a
// bow — so a gift looks like a gift and not like a row of text (Brian, 2026-10-25: «no se siente
// como regalo»). `quieta`: still waiting for missions, softer; `abierta`: the lid lifted, empty.
export function Caja({ className = "", quieta = false, abierta = false }: { className?: string; quieta?: boolean; abierta?: boolean }) {
  const id = useId();
  const papel = `papel-${id}`;
  return (
    <svg viewBox="0 0 100 92" aria-hidden className={`${className} ${quieta ? "opacity-55" : ""}`}>
      <defs>
        <pattern id={papel} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="12" height="12" fill="var(--accent)" />
          <rect width="5" height="12" fill="var(--spark)" opacity="0.55" />
        </pattern>
      </defs>
      {/* body */}
      <rect x="14" y="40" width="72" height="48" rx="5" fill={`url(#${papel})`} />
      <rect x="45" y="40" width="10" height="48" fill="var(--ink)" opacity="0.9" />
      {/* lid — lifted and tilted once opened */}
      <g transform={abierta ? "translate(-6 -16) rotate(-14 50 34)" : undefined}>
        <rect x="9" y="27" width="82" height="15" rx="4" fill={`url(#${papel})`} />
        <rect x="45" y="27" width="10" height="15" fill="var(--ink)" opacity="0.9" />
        {!abierta && (
          <>
            {/* the bow */}
            <path d="M50 27c-6-12-22-16-24-7-2 8 12 9 24 7Z" fill="var(--ink)" opacity="0.9" />
            <path d="M50 27c6-12 22-16 24-7 2 8-12 9-24 7Z" fill="var(--ink)" opacity="0.9" />
            <circle cx="50" cy="26" r="4" fill="var(--spark)" />
          </>
        )}
      </g>
    </svg>
  );
}
