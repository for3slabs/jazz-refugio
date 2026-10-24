import Link from "next/link";
import { Suspense } from "react";
import { Orb } from "@/components/orb";
import { Shell } from "@/components/shell";
import { Doors } from "@/components/doors";
import { DailyLine, RunningTimer } from "@/components/home-live";
import { AvisoSlot } from "@/components/aviso-slot";
import { PresenteSlot } from "@/components/presente-slot";
import { EstadoSlot, WideTile } from "@/components/estado-slot";
import { BrianTile, GardenTile, TileSkeleton } from "@/components/tiles";
import { Sparkle } from "@/components/icons";

// Phone: one column, the way Brian liked it. Wide screen: the same pieces as a bento —
// the orb and its button own the left, three tiles carry what lives behind each door.
// Her mode and the notes for her sit above the title on every screen, as on a phone.
export default function Home() {
  return (
    <Shell wide>
      <div className="flex flex-1 flex-col gap-4 py-6 lg:grid lg:grid-cols-[1.4fr_1fr_0.85fr] lg:grid-rows-[1fr_auto] lg:py-8">
        <section className="lg:mat flex flex-1 flex-col items-center justify-center gap-9 py-6 lg:gap-7 lg:row-span-2 lg:rounded-[1.75rem] lg:border lg:border-line lg:bg-surface lg:px-10 lg:py-14">
          <h1 className="t-display text-center text-[2.75rem] lg:text-6xl">
            tu lienzo <span className="t-narrow text-accent">mental</span>
          </h1>
          <Suspense>
            <EstadoSlot />
          </Suspense>
          <Suspense>
            <PresenteSlot />
          </Suspense>
          <Suspense>
            <AvisoSlot />
          </Suspense>
          <Orb className="orb-idle size-44 lg:size-48" />
          <Link
            href="/volver"
            className="press group inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 text-lg font-semibold text-accent-ink"
          >
            me estoy desviando
            <Sparkle className="size-5 transition-transform duration-500 ease-[var(--ease-out-strong)] group-hover:rotate-45" />
          </Link>
          <RunningTimer />
          <DailyLine />
        </section>

        <Suspense fallback={<TileSkeleton className="hidden lg:block" />}>
          <BrianTile className="hidden lg:flex" />
        </Suspense>
        <Suspense fallback={<TileSkeleton className="hidden lg:block" />}>
          <GardenTile className="hidden lg:flex" />
        </Suspense>
        <Suspense fallback={<TileSkeleton className="hidden lg:col-span-2 lg:block" />}>
          <WideTile className="hidden lg:col-span-2 lg:flex" />
        </Suspense>
      </div>
      {/* The same five doors on every screen — on a wide one, a row under the bento. */}
      <div className="lg:mt-2">
        <Doors />
      </div>
    </Shell>
  );
}
