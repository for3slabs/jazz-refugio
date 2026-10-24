import Link from "next/link";
import { Orb, Shell } from "@/components/shell";
import { Doors } from "@/components/doors";
import { DailyLine, RunningTimer } from "@/components/home-live";
import { Sparkle } from "@/components/icons";

export default function Home() {
  return (
    <Shell>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 py-10">
        <h1 className="text-center font-display text-4xl tracking-tight">
          tu lienzo <em className="text-accent">mental</em>
        </h1>
        <Orb className="orb-idle size-44" />

        <Link
          href="/volver"
          className="group inline-flex items-center gap-3 rounded-full bg-accent px-8 py-4 text-lg font-medium text-accent-ink shadow-[0_10px_30px_-10px_var(--accent)] transition-transform duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          me estoy desviando
          <Sparkle className="size-5 transition-transform duration-500 group-hover:rotate-45" />
        </Link>

        <RunningTimer />
        <DailyLine />
      </div>
      <Doors />
    </Shell>
  );
}
