import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Gear } from "./icons";
import { ThemeToggle } from "./theme-toggle";

// The frame every screen shares: a quiet top bar, then one readable column — or, for the
// home on a wide screen, the whole width for the bento.
export function Shell({ children, back = false, wide = false }: { children: ReactNode; back?: boolean; wide?: boolean }) {
  return (
    <div
      className={`mx-auto flex w-full flex-col px-5 pt-5 sm:px-8 ${
        // The home is exactly one screen tall, so its orb can give room to the notes above it; on a
        // phone its tab bar closes the screen, so the frame adds no bottom padding.
        wide ? "h-dvh max-w-md lg:max-w-6xl lg:pb-8" : "min-h-dvh max-w-md pb-8 lg:max-w-xl lg:pt-10"
      }`}
    >
      <header className="flex h-10 items-center justify-between">
        {back ? (
          <Link
            href="/"
            className="press t-label -ml-2 inline-flex items-center gap-2 rounded-full px-2 py-2 text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            inicio
          </Link>
        ) : (
          <h1 className="t-display text-2xl">
            tu <span className="t-narrow text-accent">refugio</span>
          </h1>
        )}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/ajustes"
            aria-label="ajustes"
            className="press grid size-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
          >
            <Gear className="size-5" />
          </Link>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}

// A page title with its drawn icon — the heading speaks for itself, no label above it.
export function PageTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-8 flex items-center gap-3">
      <span className="text-accent">{icon}</span>
      <h1 className="t-display text-4xl">{children}</h1>
    </div>
  );
}
