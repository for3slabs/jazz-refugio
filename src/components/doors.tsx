"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { notesSeen } from "@/lib/local";
import { Diamond, Letter, Palette, Star } from "./icons";

// Her three places, then «tú» set apart: it is about her, not something she does (Brian, 2026-10-24).
// «superpoderes» left the doors — on a wide screen its tile still opens it.
const doors = [
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
    // one row on every screen: three doors, a quiet divider, then «tú»
    <nav className="grid grid-cols-[1fr_1fr_1fr_auto_1fr] items-center gap-x-1 border-t border-dashed border-line pt-5 sm:gap-x-3">
      {doors.map(({ href, label, Icon }, i) => {
        const glow = unread && href === "/brian";
        const door = (
          <Link
            key={href}
            href={href}
            className={`press group t-label flex min-w-0 flex-col items-center gap-2.5 rounded-2xl py-2 text-center whitespace-nowrap hover:text-ink ${
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
        return i === doors.length - 1 ? (
          <Fragment key={href}>
            <span aria-hidden className="mx-1 h-9 w-px self-center bg-line sm:mx-3" />
            {door}
          </Fragment>
        ) : (
          door
        );
      })}
    </nav>
  );
}
