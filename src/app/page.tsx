import Link from "next/link";
import { Suspense } from "react";
import { Orb } from "@/components/orb";
import { Shell } from "@/components/shell";
import { Doors } from "@/components/doors";
import { DailyLine, RunningTimer } from "@/components/home-live";
import { AvisoSlot } from "@/components/aviso-slot";
import { EstadoSlot } from "@/components/estado-slot";
import { BrianTile, GardenTile, PowerTile, TileSkeleton } from "@/components/tiles";
import { Sparkle } from "@/components/icons";

// Phone: one column, the way Brian liked it. Wide screen: the same pieces as a bento —
// the orb and its button own the left, three tiles carry what lives behind each door.
// The title lives in the top bar and her mode inside the orb, so the doors fit on a phone
// without scrolling.
// The orb is the piece that gives: up to 12rem (14 on a wide screen), shrinking to 6rem when
// notes above it need the room. Its width follows its height (aspect-square); mt-11 keeps the
// room for the thought bubble that floats 8 px above it.
// On a phone the group keeps one rhythm — bubble 8 · orb 40 · button 32 · line — and the space
// left over splits evenly above and below it (Brian, 2026-10-25: «todo amontonado»).
const ORB = "orb-idle mt-11 aspect-square h-48 min-h-24 w-auto shrink lg:h-56";

export default function Home() {
  return (
    <Shell wide>
      <div className="flex min-h-0 flex-1 flex-col gap-4 py-[clamp(0.25rem,2dvh,1.5rem)] lg:grid lg:grid-cols-[1.4fr_1fr_0.85fr] lg:grid-rows-[1fr_auto] lg:py-[clamp(1rem,3dvh,2rem)]">
        <section className="lg:mat flex min-h-0 flex-1 flex-col items-center justify-center-safe py-[clamp(0.25rem,2dvh,1.5rem)] lg:gap-[clamp(1rem,3dvh,1.75rem)] lg:row-span-2 lg:rounded-[1.75rem] lg:border lg:border-line lg:bg-surface lg:px-10 lg:py-[clamp(1.5rem,5dvh,3.5rem)]">
          <div className="flex flex-col items-center gap-3 empty:hidden max-lg:mb-3">
            <Suspense>
              <AvisoSlot />
            </Suspense>
          </div>
          <Suspense fallback={<Orb className={ORB} />}>
            <EstadoSlot className={ORB} />
          </Suspense>
          <Link
            href="/volver"
            className="desvio press group inline-flex max-lg:mt-10 items-center gap-3 rounded-full px-8 py-4 text-lg font-semibold"
          >
            ayúdame a enfocarme
            <Sparkle className="size-5 transition-transform duration-500 ease-[var(--ease-out-strong)] group-hover:rotate-45" />
          </Link>
          <div className="flex flex-col items-center gap-3 max-lg:mt-8">
            <RunningTimer />
            <DailyLine />
          </div>
        </section>

        <Suspense fallback={<TileSkeleton className="hidden lg:block" />}>
          <BrianTile className="hidden lg:flex" />
        </Suspense>
        <Suspense fallback={<TileSkeleton className="hidden lg:block" />}>
          <GardenTile className="hidden lg:flex" />
        </Suspense>
        <Suspense fallback={<TileSkeleton className="hidden lg:col-span-2 lg:block" />}>
          <PowerTile className="hidden lg:col-span-2 lg:flex" />
        </Suspense>
      </div>
      {/* The same five doors on every screen — on a wide one, a row under the bento. */}
      <div className="lg:mt-2">
        <Doors />
      </div>
    </Shell>
  );
}
