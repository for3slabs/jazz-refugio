import Link from "next/link";

// Today and later, side by side: a step moves from one to the other with «→ hoy».
export function Tabs({ vista }: { vista: "hoy" | "despues" }) {
  const tab = (v: "hoy" | "despues", label: string) => (
    <Link
      href={v === "hoy" ? "/misiones" : "/misiones?v=despues"}
      aria-current={vista === v ? "page" : undefined}
      className={`press rounded-full px-4 py-2 text-sm font-semibold ${
        vista === v ? "bg-accent text-accent-ink" : "text-ink-soft hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="vista" className="mt-6 inline-flex gap-1 self-start rounded-full border border-line bg-surface p-1">
      {tab("hoy", "hoy")}
      {tab("despues", "más adelante")}
    </nav>
  );
}
