import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Letter } from "@/components/icons";
import { formatDate, loadNotes } from "@/lib/notes";
import { currentRole } from "@/lib/session";
import { borrarNota } from "../actions";
import { Composer, MarkSeen } from "./composer";

export default function DeBrian() {
  return (
    <Shell back>
      <PageTitle icon={<Letter className="size-7" />}>de Brian</PageTitle>
      <Suspense fallback={<NotesSkeleton />}>
        <Notes />
      </Suspense>
    </Shell>
  );
}

async function Notes() {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  const notes = await loadNotes();
  const isBrian = role === "brian";

  return (
    <>
      {isBrian && <Composer />}
      {/* Brian reading his own notes must not mark them as seen for her. */}
      {!isBrian && <MarkSeen at={notes[0]?.at ?? null} />}

      {notes.length === 0 ? (
        <p className="rise mt-10 text-pretty text-lg leading-relaxed text-ink-soft">
          {isBrian
            ? "Todavía no le has dejado ninguna nota. La primera que escribas le aparecerá aquí al instante."
            : "Aquí van a aparecer las notas que Brian te deje. Vuelve cuando quieras: siempre habrá algo esperándote."}
        </p>
      ) : (
        <ol className="mt-8 space-y-4">
          {notes.map((n, i) => (
            <li
              key={n.id}
              className="rise rounded-3xl border border-line bg-surface p-6"
              style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="t-label text-accent">{formatDate(n.at)}</p>
                {isBrian && (
                  <form action={borrarNota}>
                    <input type="hidden" name="id" value={n.id} />
                    <button type="submit" className="text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                      borrar
                    </button>
                  </form>
                )}
              </div>
              <p className="mt-3 whitespace-pre-line text-pretty text-lg leading-relaxed">{n.texto}</p>
            </li>
          ))}
        </ol>
      )}
    </>
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
