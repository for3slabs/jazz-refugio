import Link from "next/link";

export type Tab = { key: string; href: string; label: string; dot?: boolean };

// Two views of one place, side by side — a pill that says where she is. `compact` fits it on the
// title's line.
export function Tabs({ items, current, label, compact = false }: { items: Tab[]; current: string; label: string; compact?: boolean }) {
  return (
    <nav
      aria-label={label}
      className={`inline-flex shrink-0 gap-1 rounded-full border border-line bg-surface p-1 ${compact ? "" : "mt-6 self-start"}`}
    >
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={current === t.key ? "page" : undefined}
          className={`press relative rounded-full font-semibold ${compact ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"} ${
            current === t.key ? "bg-accent text-accent-ink" : "text-ink-soft hover:text-ink"
          }`}
        >
          {t.label}
          {t.dot && (
            <>
              <span aria-hidden className="absolute right-1 top-1 size-2 rounded-full bg-accent" />
              <span className="sr-only"> (hay algo nuevo)</span>
            </>
          )}
        </Link>
      ))}
    </nav>
  );
}
