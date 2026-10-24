import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Bloom, Gear, Letter, Star } from "./icons";
import { ThemeToggle } from "./theme-toggle";

// The frame every screen shares: a quiet top bar and a single column.
export function Shell({ children, back = false }: { children: ReactNode; back?: boolean }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-8 pt-6">
      <header className="flex h-10 items-center justify-between">
        {back ? (
          <Link
            href="/"
            className="-ml-2 inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            inicio
          </Link>
        ) : (
          <p className="font-display text-lg tracking-tight">
            hola, <span className="text-accent">Jazz</span>
          </p>
        )}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/ajustes"
            aria-label="ajustes"
            className="grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
          >
            <Gear className="size-5" />
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

const doors = [
  { href: "/superpoderes", label: "tus superpoderes", Icon: Bloom },
  { href: "/brian", label: "de Brian", Icon: Letter },
  { href: "/tu", label: "tú", Icon: Star },
];

export function Doors() {
  return (
    <nav className="grid grid-cols-3 border-t border-line pt-5">
      {doors.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col items-center gap-2 rounded-2xl py-2 text-xs text-ink-soft transition-colors hover:text-ink"
        >
          <Icon className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:text-accent" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function Orb({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div aria-hidden className={`relative ${className}`} style={style}>
      <div className="orb-halo absolute -inset-[45%] rounded-full" />
      <div className="orb absolute inset-0 rounded-full" />
    </div>
  );
}
