"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Diamond, Letter, Palette, Star } from "./icons";

// Her three places, then «colecciones» set apart: it is about her, not something she does (Brian, 2026-10-24).
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

export function Doors() {
  const unread = useUnreadNote();
  return (
    // On a phone, a tab bar: edge to edge, a hairline on top, four equal columns, lowercase labels
    // like every other word in the app. On a wide screen, a quiet row under the bento.
    <nav className="-mx-5 grid grid-cols-4 border-t border-line px-1 pb-3 pt-2 sm:-mx-8 lg:mx-0 lg:border-dashed lg:px-0 lg:pb-0 lg:pt-5">
      {doors.map(({ href, label, Icon }) => {
        const glow = unread && href === "/brian";
        const door = (
          <Link
            key={href}
            href={href}
            className={`press group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl py-2 text-center text-xs font-medium whitespace-nowrap hover:text-ink ${
              glow ? "text-ink" : "text-ink-soft"
            }`}
          >
            <span className="relative">
              <Icon
                className={`size-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:text-accent ${
                  glow ? "text-accent" : ""
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
        return door;
      })}
    </nav>
  );
}
