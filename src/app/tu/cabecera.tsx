import Link from "next/link";
import type { ReactNode } from "react";
import { Star } from "@/components/icons";
import type { Tab } from "@/components/tabs";

const INK = "oklch(0.2 0.06 315)";

// The top of a scene page in the scene's own comic language (Brian, 2026-10-25): the title is a
// caption box, the tabs are little ink-bordered labels — the active one yellow and tilted — so her
// garden and her library read as places she walks into, not sections of a web page.
export function Cabecera({ titulo, items, current, aside }: { titulo: string; items: Tab[]; current: string; aside?: ReactNode }) {
  return (
    <div className="relative z-10">
      <div className="flex items-center justify-between gap-3">
        <h1
          className="inline-flex -rotate-1 items-center gap-2 border-[3px] bg-[oklch(0.97_0.02_330)] px-3 py-1"
          style={{ borderColor: INK, color: INK, boxShadow: `3px 3px 0 ${INK}` }}
        >
          <Star className="size-6" />
          <span className="t-display text-3xl">{titulo}</span>
        </h1>
        {aside}
      </div>
      <nav aria-label="colecciones" className="mt-4 flex flex-wrap gap-2">
        {items.map((t) => {
          const on = current === t.key;
          return (
            <Link
              key={t.key}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={`press rounded-lg border-[2.5px] px-3 py-1 text-sm font-black ${on ? "-rotate-2" : "hover:-rotate-1"}`}
              style={{
                borderColor: INK,
                color: INK,
                background: on ? "oklch(0.92 0.13 92)" : "oklch(0.97 0.02 330 / 0.88)",
                boxShadow: on ? `2px 2px 0 ${INK}` : undefined,
              }}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// «⋯» as a comic button: white, ink ring.
export const botonComic =
  "press grid size-10 shrink-0 place-items-center rounded-full border-[2.5px] border-[oklch(0.2_0.06_315)] bg-[oklch(0.97_0.02_330)] text-[oklch(0.2_0.06_315)] shadow-[2px_2px_0_oklch(0.2_0.06_315)]";

// The scene's frame: the whole screen above the doors, slid up under the floating top bar.
export const escenario = "relative -mx-5 -mt-[3.75rem] h-[calc(100dvh-4.6rem)] overflow-hidden sm:-mx-8 lg:mx-0 lg:mt-0 lg:h-[46rem] lg:rounded-[1.75rem]";
