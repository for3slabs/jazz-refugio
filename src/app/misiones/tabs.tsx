import Link from "next/link";

const vistas = {
  hoy: { href: "/misiones", label: "hoy" },
  despues: { href: "/misiones?v=despues", label: "más adelante" },
} as const;

// Today and later as ONE switch on the title's line: it says where she is, and a tap flips it to
// the other view — one word on screen instead of two (Brian, 2026-10-25: «solo texto… que se
// entienda como un switch»). A step still moves between them with «→ hoy».
export function Tabs({ vista }: { vista: "hoy" | "despues" }) {
  const otra = vista === "hoy" ? "despues" : "hoy";
  return (
    <Link
      href={vistas[otra].href}
      aria-label={`${vistas[vista].label} · cambiar a ${vistas[otra].label}`}
      className="press group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface py-1.5 pl-2 pr-2.5 text-xs font-semibold hover:border-accent/60"
    >
      <span aria-hidden className="relative h-4 w-6 rounded-full bg-accent-soft">
        <span
          className={`absolute top-0.5 size-3 rounded-full bg-accent transition-transform duration-200 ease-[var(--ease-out-strong)] ${
            vista === "despues" ? "translate-x-2.5" : "translate-x-0.5"
          }`}
        />
      </span>
      {vistas[vista].label}
    </Link>
  );
}
