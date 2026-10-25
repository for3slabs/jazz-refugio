import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AsistenteGeneral } from "./asistente";
import { CurrentDoors, Doors } from "./doors";
import { ArrowLeft, Gear } from "./icons";
import { ThemeToggle } from "./theme-toggle";

// The frame every screen shares: a quiet top bar, then one readable column — or, `wide`, the
// whole width on a wide screen (the home's bento, a board). Every inner page carries the doors
// fixed at the bottom unless it says `menu={false}` — the focus flow, where a menu invites her
// to wander off (Brian, 2026-10-25). With the doors comes her assistant's button, fixed in the
// same corner of every section; a page with its own (misiones) says `asistente={false}`.
export function Shell({
  children,
  back = false,
  wide = false,
  menu = true,
  asistente = true,
}: {
  children: ReactNode;
  back?: boolean;
  wide?: boolean;
  menu?: boolean;
  asistente?: boolean;
}) {
  const home = !back;
  const bar = back && menu;
  const ayuda = bar && asistente;
  return (
    <div
      className={`mx-auto flex w-full flex-col px-5 pt-5 sm:px-8 ${
        // The home is exactly one screen tall, so its orb can give room to the notes above it; on a
        // phone its tab bar closes the screen, so the frame adds no bottom padding.
        home
          ? "h-dvh max-w-md lg:max-w-6xl lg:pb-8"
          : `min-h-dvh max-w-md ${wide ? "lg:max-w-6xl" : "lg:max-w-xl lg:pt-10"} ${
              // room under the last line for the fixed doors (~80 px) plus the usual 2 rem — and,
              // with the assistant above them, its button too
              ayuda ? "pb-44" : bar ? "pb-32" : "pb-8"
            }`
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
      {bar && (
        <Suspense fallback={<Doors bar />}>
          <CurrentDoors />
        </Suspense>
      )}
      {ayuda && <AsistenteGeneral />}
    </div>
  );
}

// A page title with its drawn icon — the heading speaks for itself, no label above it. `aside`
// sits on the same line, at the right (the views of a page), so the page starts one row shorter;
// on a phone too narrow for both it drops under the title instead of touching it.
export function PageTitle({ icon, children, aside }: { icon: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className={`mt-8 flex items-center justify-between gap-3 ${aside ? "flex-wrap gap-y-4" : ""}`}>
      <div className={`flex min-w-0 items-center ${aside ? "gap-2.5" : "gap-3"}`}>
        <span className="text-accent">{icon}</span>
        <h1 className="t-display text-4xl">{children}</h1>
      </div>
      {aside}
    </div>
  );
}
