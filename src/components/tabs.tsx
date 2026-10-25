import Link from "next/link";

export type Tab = { key: string; href: string; label: string; dot?: boolean };

// Two views of one place, side by side — a pill that says where she is.
export function Tabs({ items, current, label }: { items: Tab[]; current: string; label: string }) {
  return (
    <nav aria-label={label} className="mt-6 inline-flex gap-1 self-start rounded-full border border-line bg-surface p-1">
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={current === t.key ? "page" : undefined}
          className={`press relative rounded-full px-4 py-2 text-sm font-semibold ${
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
