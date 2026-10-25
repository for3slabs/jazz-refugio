import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Letter } from "@/components/icons";
import { Tabs } from "@/components/tabs";
import { loadMisiones } from "@/lib/misiones";
import { formatDate, loadDejadas, loadNotes } from "@/lib/notes";
import { vistaDe } from "@/lib/presente";
import { hayParaAbrir, loadDados, loadRegalos, vistaDeJazz } from "@/lib/regalos";
import { currentRole } from "@/lib/session";
import type { Role } from "@/lib/token";
import { borrarNota } from "../actions";
import { Composer, MarkSeen } from "./composer";
import { EntreLosDos } from "./presente";
import { RegaloForm } from "./regalo-form";
import { Regalos } from "./regalos";
import { ObjetosBrian } from "./objetos";
import { loadRegalados } from "@/lib/mascota";

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

// Notes and gifts between the two, both ways — a dot on «regalos» when one is ready for whoever
// is looking.
async function Content({ searchParams }: { searchParams: Search }) {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  const { v } = await searchParams;
  const [regalos, m] = await Promise.all([loadRegalos(role), loadMisiones()]).catch(() => [null, null] as const);
  // her garden opens her gifts; his open right away
  const total = role === "jazz" ? (m?.total ?? 0) : 0;
  const tabs = (
    <Tabs
      label="de Brian"
      current={v === "regalos" || v === "presente" ? v : "notas"}
      items={[
        { key: "notas", href: "/brian", label: "notas" },
        { key: "regalos", href: "/brian?v=regalos", label: "regalos", dot: !!regalos && hayParaAbrir(regalos, total) },
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
        <h2 className="t-label mt-8 text-ink-soft">para ti</h2>
        <Regalos {...vistaDeJazz(regalos, total)} de={role === "jazz" ? "Brian" : "Jazz"} />
        <RegaloForm
          regalos={await loadDados(role).catch(() => [])}
          total={role === "brian" ? (m?.total ?? 0) : 0}
          para={role === "jazz" ? "Brian" : "Jazz"}
        />
        {role === "brian" && <ObjetosBrian regalados={await loadRegalados().catch(() => [])} />}
      </>
    );
  }

  return (
    <>
      {tabs}
      <Notes role={role} />
    </>
  );
}

// Notes both ways: what the other left for you, and what you left — with whether it was seen.
async function Notes({ role }: { role: Role }) {
  const otro = role === "jazz" ? "Brian" : "Jazz";
  const [notes, dejadas] = await Promise.all([loadNotes(role), loadDejadas(role)]);
  return (
    <>
      <Composer para={otro} />
      <MarkSeen />

      <h2 className="t-label mt-10 text-ink-soft">para ti</h2>
      {notes.length === 0 ? (
        <p className="rise mt-3 text-pretty text-lg leading-relaxed text-ink-soft">
          {`Aquí van a aparecer las notas que ${otro} te deje. Vuelve cuando quieras.`}
        </p>
      ) : (
        <ol className="mt-3 space-y-4">
          {notes.map((n, i) => (
            <li key={n.id} className="rise rounded-3xl border border-line bg-surface p-6" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
              <p className="t-label text-accent">{formatDate(n.at)}</p>
              <p className="mt-3 whitespace-pre-line text-pretty text-lg leading-relaxed">{n.texto}</p>
            </li>
          ))}
        </ol>
      )}

      {dejadas.length > 0 && (
        <>
          <h2 className="t-label mt-10 text-ink-soft">las que dejaste</h2>
          <ol className="mt-3 space-y-4">
            {dejadas.map((n) => (
              <li key={n.id} className="rounded-3xl border border-dashed border-line bg-surface/60 p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="t-label text-ink-soft">
                    {formatDate(n.at)}
                    {n.visto && <span className="ml-3 text-accent">✓ visto</span>}
                  </p>
                  <form action={borrarNota}>
                    <input type="hidden" name="id" value={n.id} />
                    <button type="submit" className="text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                      borrar
                    </button>
                  </form>
                </div>
                <p className="mt-3 whitespace-pre-line text-pretty text-lg leading-relaxed text-ink-soft">{n.texto}</p>
              </li>
            ))}
          </ol>
        </>
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
