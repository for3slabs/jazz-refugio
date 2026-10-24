import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Greeting } from "./greeting";
import { ArrowLeft, Gear } from "./icons";
import { ThemeToggle } from "./theme-toggle";

// The frame every screen shares: a quiet top bar, then one readable column — or, for the
// home on a wide screen, the whole width for the bento.
export function Shell({ children, back = false, wide = false }: { children: ReactNode; back?: boolean; wide?: boolean }) {
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full flex-col px-5 pb-8 pt-5 sm:px-8 ${
        wide ? "max-w-md lg:max-w-6xl" : "max-w-md lg:max-w-xl lg:pt-10"
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
          <p className="t-label text-ink-soft">
            hola
            <Suspense>
              <Greeting />
            </Suspense>
          </p>
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
      <main className="flex flex-1 flex-col">{children}</main>
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
