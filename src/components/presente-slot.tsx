import Link from "next/link";
import { brianPresente } from "@/lib/presente";
import { currentRole } from "@/lib/session";

// On her home, while Brian marked «aquí estoy»: he is there, she can write — no need to ask.
export async function PresenteSlot() {
  if ((await currentRole()) !== "jazz") return null;
  if (!(await brianPresente().catch(() => false))) return null;
  return (
    <Link
      href="/brian?v=presente"
      className="press rise flex w-full max-w-sm items-center gap-3 rounded-3xl border border-line bg-surface px-5 py-4 text-left hover:border-accent/60 order-first"
    >
      <span className="relative grid size-3 shrink-0 place-items-center" aria-hidden>
        <span className="absolute size-3 animate-ping rounded-full bg-accent opacity-50" />
        <span className="size-2.5 rounded-full bg-accent" />
      </span>
      <span className="flex-1 text-pretty text-lg leading-snug">
        <span className="font-semibold">Brian</span> está presente ahora
      </span>
      <span className="t-label text-accent">escribirle</span>
    </Link>
  );
}
