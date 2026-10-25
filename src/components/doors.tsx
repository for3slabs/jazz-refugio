"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Diamond, Letter, Palette, Star } from "./icons";

// Her four places, equal — «colecciones» is a place like the others (Brian, 2026-10-25).
// «superpoderes» left the doors — on a wide screen its tile still opens it.
const doors = [
  { href: "/misiones", label: "misiones", Icon: Diamond },
  { href: "/lienzo", label: "inspiración", Icon: Palette },
  { href: "/brian", label: "mensajes", Icon: Letter },
  { href: "/tu", label: "colecciones", Icon: Star },
];

// «If I don't see it, it doesn't exist»: a note she has not read, or a gift ready to open,
// makes its door glow —
// warm, no number, no "you have unread messages".
function useUnreadNote() {
  const [unread, setUnread] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/ultima", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { nuevo?: boolean; regalo?: boolean } | null) => {
        if (alive && d) setUnread(!!d.regalo || !!d.nuevo);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return unread;
}

// A tab bar: four equal columns, lowercase labels like every other word in the app. On the
// home it closes the screen in the flow, edge to edge (a quiet row under the bento on a wide
// screen). On every other page — `bar` — it stays fixed at the bottom while the page scrolls
// under it, and the door she is in is marked (Brian, 2026-10-25: «para desplazarse más fácil»).
// The pages that hide it say so in their Shell.
export function Doors({ bar = false, path = null }: { bar?: boolean; path?: string | null }) {
  const unread = useUnreadNote();
  const nav = (
    <nav
      aria-label="secciones"
      className={
        bar
          ? "mx-auto grid max-w-md grid-cols-4 px-1 pb-3 pt-2 lg:max-w-xl"
          : "-mx-5 grid grid-cols-4 border-t border-line px-1 pb-3 pt-2 sm:-mx-8 lg:mx-0 lg:border-dashed lg:px-0 lg:pb-0 lg:pt-5"
      }
    >
      {doors.map(({ href, label, Icon }) => {
        const glow = unread && href === "/brian";
        const here = !!path && (path === href || path.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={here ? "page" : undefined}
            className={`press group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl py-2 text-center text-xs whitespace-nowrap hover:text-ink ${
              here ? "font-semibold text-accent" : glow ? "font-medium text-ink" : "font-medium text-ink-soft"
            }`}
          >
            <span className="relative">
              <Icon
                className={`size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:text-accent ${
                  glow || here ? "text-accent" : ""
                }`}
              />
              {glow && (
                <span aria-hidden className="absolute -right-1.5 -top-1 grid size-2.5 place-items-center">
                  <span className="absolute size-2.5 animate-ping rounded-full bg-accent opacity-60" />
                  <span className="size-2 rounded-full bg-accent" />
                </span>
              )}
            </span>
            {label}
            {glow && <span className="sr-only">(hay algo nuevo de Brian)</span>}
          </Link>
        );
      })}
    </nav>
  );
  if (!bar) return nav;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/90 backdrop-blur-md">{nav}</div>
  );
}

// The fixed doors with the page she is on marked. Reading the path needs a Suspense boundary, so
// the Shell wraps this and shows the same bar unmarked while it resolves.
export function CurrentDoors() {
  return <Doors bar path={usePathname()} />;
}
