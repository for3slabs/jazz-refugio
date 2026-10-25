import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Letter, Trash } from "@/components/icons";
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
import { Encabezado, Plegado } from "./plegado";
import { loadRegalados } from "@/lib/mascota";

type Search = Promise<{ v?: string }>;

export default function DeBrian({ searchParams }: { searchParams: Search }) {
  return (
    <Shell back>
      <PageTitle icon={<Letter className="size-7" />}>mensajes</PageTitle>
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
      label="mensajes"
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
    const otro = role === "jazz" ? "Brian" : "Jazz";
    // what was given and, for Brian, the pet objects — together, not one after the other
    const [dados, regalados] = await Promise.all([
      loadDados(role).catch(() => []),
      role === "brian" ? loadRegalados().catch(() => []) : null,
    ]);
    return (
      <>
        {tabs}
        <Encabezado
          titulo="para ti"
          sub={role === "jazz" ? "ábrelos cuando estén listos" : "lo que Jazz te regaló"}
        />
        <Regalos {...vistaDeJazz(regalos, total)} de={otro} />
        <RegaloForm regalos={dados} total={role === "brian" ? (m?.total ?? 0) : 0} para={otro} regalados={regalados} />
        <Aire />
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

// Notes both ways: what the other left for you first, then «＋ dejarle una nota», and what you
// left folded under it — with whether it was seen.
async function Notes({ role }: { role: Role }) {
  const otro = role === "jazz" ? "Brian" : "Jazz";
  const [notes, dejadas] = await Promise.all([loadNotes(role), loadDejadas(role)]);
  return (
    <>
      <MarkSeen />
      <Encabezado titulo="para ti" sub={`lo que ${otro} te dejó`} />
      {notes.length === 0 ? (
        <p className="rise mt-4 text-pretty text-lg leading-relaxed text-ink-soft">
          {`Cuando ${otro} te deje una nota, aparece aquí.`}
        </p>
      ) : (
        <ol className="mt-4 space-y-4">
          {notes.map((n, i) => (
            <li key={n.id} className="rise rounded-3xl border border-line bg-surface p-6" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
              <p className="text-sm font-semibold text-accent">{formatDate(n.at)}</p>
              <p className="mt-2 whitespace-pre-line text-pretty text-lg leading-relaxed">{n.texto}</p>
            </li>
          ))}
        </ol>
      )}

      <Composer para={otro} />

      {dejadas.length > 0 && (
        <Plegado titulo="las que dejaste" n={dejadas.length}>
          <ol className="space-y-3">
            {dejadas.map((n) => (
              <li key={n.id} className="rounded-3xl border border-dashed border-line bg-surface/60 py-4 pl-5 pr-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-ink-soft">
                    {formatDate(n.at)}
                    {n.visto && <span className="ml-2 font-semibold text-accent">· ✓ la vio</span>}
                  </p>
                  <form action={borrarNota}>
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      aria-label="borrar esta nota"
                      className="press grid size-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
                    >
                      <Trash className="size-4" />
                    </button>
                  </form>
                </div>
                <p className="mt-1 whitespace-pre-line pr-3 text-pretty leading-relaxed text-ink-soft">{n.texto}</p>
              </li>
            ))}
          </ol>
        </Plegado>
      )}
      <Aire />
    </>
  );
}

// Room under the last line, so the assistant's floating button never sits on it.
function Aire() {
  return <div aria-hidden className="h-16" />;
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
