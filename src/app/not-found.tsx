import Link from "next/link";
import { Orb } from "@/components/orb";

// What a missing page says — in her language, never the framework's English default.
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      <Orb className="orb-idle size-24" />
      <div className="space-y-2">
        <h1 className="t-display text-4xl">esto ya no está aquí</h1>
        <p className="text-pretty text-ink-soft">Quizá se borró, o no es para ti.</p>
      </div>
      <Link href="/" className="press rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink">
        volver al inicio
      </Link>
    </div>
  );
}
