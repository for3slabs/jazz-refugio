import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Letter } from "@/components/icons";
import { Tabs } from "@/components/tabs";
import { loadMisiones } from "@/lib/misiones";
import { formatDate, loadNotes } from "@/lib/notes";
import { vistaDe } from "@/lib/presente";
import { hayParaAbrir, loadRegalos, vistaDeJazz } from "@/lib/regalos";
import { currentRole } from "@/lib/session";
import { borrarNota } from "../actions";
import { Composer, MarkSeen } from "./composer";
import { EntreLosDos } from "./presente";
import { RegaloForm } from "./regalo-form";
import { Regalos } from "./regalos";
import { PersonajesBrian } from "./personajes";
import { loadRegalados } from "@/lib/personajes";

type Search = Promise<{ v?: string }>;

export default function DeBrian({ searchParams }: { searchParams: Search }) {
  return (
    <Shell back>
      <PageTitle icon={<Letter className="size-7" />}>de Brian</PageTitle>
      <Suspense fallback={<NotesSkeleton />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </Shell>
  );
}

// Two tabs: his notes, and his gifts — a dot on «regalos» when one is ready for her.
async function Content({ searchParams }: { searchParams: Search }) {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  const { v } = await searchParams;
  const [regalos, m] = await Promise.all([loadRegalos(), loadMisiones()]).catch(() => [null, null] as const);
  const total = m?.total ?? 0;
  const tabs = (
    <Tabs
      label="de Brian"
      current={v === "regalos" || v === "presente" ? v : "notas"}
      items={[
        { key: "notas", href: "/brian", label: "notas" },
        { key: "regalos", href: "/brian?v=regalos", label: "regalos", dot: role === "jazz" && !!regalos && hayParaAbrir(regalos, total) },
        { key: "presente", href: "/brian?v=presente", label: "entre los dos" },
      ]}
    />
  );

  if (v === "presente") {
    const vista = await vistaDe(role).catch(() => null);
    return (
      <>
        {tabs}
        {vista ? (
          <EntreLosDos vista={vista} isBrian={role === "brian"} />
        ) : (
          <p className="mt-10 text-pretty text-lg text-ink-soft">No pude leer esta parte. Vuelve a abrir en un momento.</p>
        )}
      </>
    );
  }

  if (v === "regalos") {
    if (!regalos) {
      return (
        <>
          {tabs}
          <p className="mt-10 text-pretty text-lg text-ink-soft">No pude leer los regalos. Vuelve a abrir en un momento.</p>
        </>
      );
    }
    return (
      <>
        {tabs}
        {role === "brian" ? (
          <>
            <RegaloForm regalos={regalos} total={total} />
            <PersonajesBrian regalados={await loadRegalados().catch(() => [])} />
          </>
        ) : (
          <Regalos {...vistaDeJazz(regalos, total)} />
        )}
      </>
    );
  }

  return (
    <>
      {tabs}
      <Notes isBrian={role === "brian"} />
    </>
  );
}

async function Notes({ isBrian }: { isBrian: boolean }) {
  const notes = await loadNotes();
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
