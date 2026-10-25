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
// The orb is the piece that gives: up to 12rem (14 on a wide screen), shrinking to 6rem when
// notes above it need the room. Its width follows its height (aspect-square); mt-12 keeps the
// room for the thought bubble that floats above it.
const ORB = "orb-idle mt-12 aspect-square h-48 min-h-24 w-auto shrink lg:h-56";

export default function Home() {
  return (
    <Shell wide>
      <div className="flex min-h-0 flex-1 flex-col gap-4 py-[clamp(0.25rem,2dvh,1.5rem)] lg:grid lg:grid-cols-[1.4fr_1fr_0.85fr] lg:grid-rows-[1fr_auto] lg:py-[clamp(1rem,3dvh,2rem)]">
        <section className="lg:mat flex min-h-0 flex-1 flex-col items-center justify-center-safe gap-[clamp(0.75rem,3.5dvh,2.25rem)] py-[clamp(0.25rem,2dvh,1.5rem)] lg:gap-[clamp(1rem,3dvh,1.75rem)] lg:row-span-2 lg:rounded-[1.75rem] lg:border lg:border-line lg:bg-surface lg:px-10 lg:py-[clamp(1.5rem,5dvh,3.5rem)]">
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
            ayúdame a enfocarme
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
