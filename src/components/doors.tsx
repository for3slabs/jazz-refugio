"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { notesSeen } from "@/lib/local";
import { Bloom, Diamond, Letter, Palette, Star } from "./icons";

const doors = [
  { href: "/superpoderes", label: "superpoderes", Icon: Bloom },
  { href: "/misiones", label: "misiones", Icon: Diamond },
  { href: "/lienzo", label: "lienzo", Icon: Palette },
  { href: "/brian", label: "de Brian", Icon: Letter },
  { href: "/tu", label: "tú", Icon: Star },
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
      .then((d: { at: number | null; regalo?: boolean } | null) => {
        if (alive && d) setUnread(!!d.regalo || (!!d.at && d.at > notesSeen.get()));
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
    <nav className="grid grid-cols-6 gap-y-3 border-t border-dashed border-line pt-5 lg:grid-cols-5">
      {doors.map(({ href, label, Icon }, i) => {
        const glow = unread && href === "/brian";
        return (
          <Link
            key={href}
            href={href}
            // five doors: three on top and two centred below on a phone, one row on a wide screen
            className={`press group t-label col-span-2 flex flex-col items-center gap-2.5 text-center rounded-2xl py-2 hover:text-ink lg:col-span-1 ${
              i === 3 ? "col-start-2 lg:col-start-auto" : ""
            } ${
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
      })}
    </nav>
  );
}
