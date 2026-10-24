import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { Letter } from "@/components/icons";
import { formatDate, readNotes } from "@/lib/notes";

export default function DeBrian() {
  return (
    <Shell back>
      <div className="mt-8 flex items-center gap-3">
        <Letter className="size-6 text-accent" />
        <h1 className="font-display text-3xl tracking-tight">de Brian</h1>
      </div>
      <Suspense fallback={<NotesSkeleton />}>
        <Notes />
      </Suspense>
    </Shell>
  );
}

async function Notes() {
  const notes = await readNotes();
  if (notes === null) redirect("/entrar");

  if (notes.length === 0) {
    return (
      <p className="rise mt-10 text-pretty text-lg leading-relaxed text-ink-soft">
        Aquí van a aparecer las notas que Brian te deje. Vuelve cuando quieras: siempre habrá algo esperándote.
      </p>
    );
  }

  return (
    <ol className="mt-8 space-y-4">
      {notes.map((n, i) => (
        <li
          key={`${n.fecha}-${i}`}
          className="rise rounded-3xl border border-line bg-surface p-6"
          style={{ animationDelay: `${Math.min(i, 6) * 80}ms` }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">{formatDate(n.fecha)}</p>
          <p className="mt-3 whitespace-pre-line text-pretty text-lg leading-relaxed">{n.texto}</p>
        </li>
      ))}
    </ol>
  );
}

function NotesSkeleton() {
  return (
    <div className="mt-8 space-y-4" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-3xl bg-accent-soft/60" />
      ))}
    </div>
  );
}
