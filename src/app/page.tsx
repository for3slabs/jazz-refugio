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
// The title lives in the top bar and her mode inside the orb, so the doors fit on a phone
// without scrolling.
const ORB = "orb-idle size-48 short:size-44 lg:size-56";

export default function Home() {
  return (
    <Shell wide>
      <div className="flex flex-1 flex-col gap-4 py-6 short:py-2 lg:grid lg:grid-cols-[1.4fr_1fr_0.85fr] lg:grid-rows-[1fr_auto] lg:py-8">
        <section className="lg:mat flex flex-1 flex-col items-center justify-center gap-9 py-6 short:gap-6 short:py-1 lg:gap-7 lg:row-span-2 lg:rounded-[1.75rem] lg:border lg:border-line lg:bg-surface lg:px-10 lg:py-14">
          <Suspense>
            <PresenteSlot />
          </Suspense>
          <Suspense>
            <AvisoSlot />
          </Suspense>
          <Suspense fallback={<Orb className={ORB} />}>
            <EstadoSlot className={ORB} />
          </Suspense>
          <Link
            href="/volver"
            className="desvio press group inline-flex items-center gap-3 rounded-full px-8 py-4 text-lg font-semibold"
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
