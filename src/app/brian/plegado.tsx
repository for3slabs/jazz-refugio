import Link from "next/link";
import { Chevron } from "@/components/icons";

export type Apartado = { key: string; href: string; label: string; dot?: boolean };

// The three parts of «mensajes» as underlined words, the way «tus metas · en tu mente» switch in
// misiones — the tab IS the section's title, and the line under it says what that part does.
export function Apartados({ items, current, sub }: { items: Apartado[]; current: string; sub: string }) {
  return (
    <>
      <nav aria-label="mensajes" className="mt-8 flex items-end gap-6">
        {items.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={current === t.key ? "page" : undefined}
            className={`press relative -mb-px border-b-2 pb-1 text-lg font-semibold transition-colors ${
              current === t.key ? "border-accent text-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {t.label}
            {t.dot && (
              <>
                <span aria-hidden className="absolute -right-2.5 top-0.5 size-2 rounded-full bg-accent" />
                <span className="sr-only"> (hay algo nuevo)</span>
              </>
            )}
          </Link>
        ))}
      </nav>
      <p className="mt-2 text-pretty text-sm text-ink-soft">{sub}</p>
    </>
  );
}

// One quiet line with its count — «los que diste · 2» — folded, like «historial» in misiones:
// the page stays light and she knows there is more inside (Brian, 2026-10-25).
export function Plegado({ titulo, n, children }: { titulo: string; n: number; children: React.ReactNode }) {
  return (
    <details className="group mt-8">
      <summary className="press flex cursor-pointer list-none items-center gap-2 rounded-2xl py-2 [&::-webkit-details-marker]:hidden">
        <span className="font-semibold">{titulo}</span>
        <span className="text-sm tabular-nums text-ink-soft">· {n}</span>
        <Chevron className="ml-auto size-5 text-ink-soft transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

// The list as misiones draws it: one box, rows split by a line.
export const caja = "divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface";
