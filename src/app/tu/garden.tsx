"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flower } from "@/components/flower";
import { moments, type Moment } from "@/lib/local";

const when = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function Garden() {
  const [list, setList] = useState<Moment[] | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the garden lives in her browser
  useEffect(() => setList(moments.all()), []);
  if (list === null) return null;

  if (list.length === 0) {
    return (
      <div className="rise mt-10 space-y-6">
        <p className="text-pretty text-lg leading-relaxed text-ink-soft">
          Tu jardín todavía no tiene flores. Cada vez que vuelvas a ti, crece una. Nunca se marchita y nunca empieza de
          cero.
        </p>
        <Link href="/volver" className="inline-block rounded-full bg-accent px-6 py-3 font-medium text-accent-ink">
          plantar la primera
        </Link>
      </div>
    );
  }

  const recent = [...list].reverse().slice(0, 5);
  return (
    <div className="mt-8 space-y-10">
      <div className="rise rounded-[2rem] border border-line bg-surface p-6">
        <p className="text-sm text-ink-soft">
          <strong className="t-display text-4xl text-ink">{list.length}</strong>{" "}
          {list.length === 1 ? "vez que volviste a ti" : "veces que volviste a ti"}
        </p>
        <div className="mt-5 grid grid-cols-6 gap-2">
          {list.map((_, n) => (
            <Flower key={n} n={n + 1} className="aspect-square w-full" />
          ))}
        </div>
      </div>

      <section>
        <h2 className="t-label text-accent">lo que hiciste al volver</h2>
        <ul className="mt-3 divide-y divide-line">
          {recent.map((m) => (
            <li key={m.at} className="flex items-baseline justify-between gap-4 py-3">
              <span className="text-pretty">{m.step}</span>
              <span className="shrink-0 text-xs text-ink-soft">{when.format(m.at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
