import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Letter, Trash } from "@/components/icons";
import { loadMisiones } from "@/lib/misiones";
import { formatDate, loadDejadas, loadNotes } from "@/lib/notes";
import { vistaDe } from "@/lib/presente";
import { hayParaAbrir, loadDados, loadRegalos, vistaDeJazz } from "@/lib/regalos";
import { currentRole } from "@/lib/session";
import type { Role } from "@/lib/token";
import { loadRegalados } from "@/lib/mascota";
import { borrarNota } from "../actions";
import { Composer, MarkSeen } from "./composer";
import { Apartados } from "./plegado";
import { EntreLosDos } from "./presente";
import { Regalos } from "./regalos";

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

// Three parts, each in the shape of what it does (Brian, 2026-10-25: «no se notan los apartados»):
// «notas» paper notes, «regalos» wrapped boxes, «entre los dos» the question with both halves
// facing each other. A dot on «regalos» when one is ready for whoever is looking.
async function Content({ searchParams }: { searchParams: Search }) {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  const { v } = await searchParams;
  const otro = role === "jazz" ? "Brian" : "Jazz";
  const [regalos, m] = await Promise.all([loadRegalos(role), loadMisiones()]).catch(() => [null, null] as const);
  // her garden opens her gifts; his open right away
  const total = role === "jazz" ? (m?.total ?? 0) : 0;
  const current = v === "regalos" || v === "presente" ? v : "notas";
  const subs = {
    notas: `déjale un papelito a ${otro} · lo encuentra al entrar`,
    regalos: role === "jazz" ? "cupones y cartas · algunos esperan tus misiones" : "cupones y cartas · los tuyos esperan sus misiones",
    presente: "una pregunta al día · los dos contestan lo mismo",
  };
  const tabs = (
    <Apartados
      current={current}
      sub={subs[current]}
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
          <p className="mt-6 text-pretty text-lg text-ink-soft">No pude leer esta parte. Vuelve a abrir en un momento.</p>
        )}
        <Aire />
      </>
    );
  }

  if (v === "regalos") {
    if (!regalos) {
      return (
        <>
          {tabs}
          <p className="mt-6 text-pretty text-lg text-ink-soft">No pude leer los regalos. Vuelve a abrir en un momento.</p>
        </>
      );
    }
    // what was given and, for Brian, the pet objects — together, not one after the other
    const [dados, regalados] = await Promise.all([
      loadDados(role).catch(() => []),
      role === "brian" ? loadRegalados().catch(() => []) : null,
    ]);
    return (
      <>
        {tabs}
        <Regalos
          {...vistaDeJazz(regalos, total)}
          de={otro}
          dados={dados}
          total={role === "brian" ? (m?.total ?? 0) : 0}
          regalados={regalados}
        />
        <Aire />
      </>
    );
  }

  return (
    <>
      {tabs}
      <Notes role={role} />
      <Aire />
    </>
  );
}

// Notes both ways as «papelitos», newest first (Brian, 2026-10-25: «la estructura se siente
// rara»): paper with a folded corner, the other one's on the left on tinted paper, yours on the
// right with «✓ la vio» and the trash — and «＋ escribirle un papelito» under them. Nothing here
// looks like «entre los dos», where both answer the same question.
async function Notes({ role }: { role: Role }) {
  const otro = role === "jazz" ? "Brian" : "Jazz";
  const [notes, dejadas] = await Promise.all([loadNotes(role), loadDejadas(role)]);
  const papelitos = [
    ...notes.map((n) => ({ ...n, mia: false, visto: false })),
    ...dejadas.map((n) => ({ ...n, mia: true, visto: !!n.visto })),
  ].sort((a, b) => b.at - a.at);
  return (
    <>
      <MarkSeen />
      {papelitos.length > 0 && (
        <ol className="mt-5 space-y-4">
          {papelitos.map((n, i) => (
            <li
              key={n.id}
              className={`rise papel relative w-fit min-w-[55%] max-w-[85%] rounded-b-xl rounded-tl-xl p-4 pr-7 ${
                n.mia ? "ml-auto rotate-[0.6deg] bg-surface-2" : "-rotate-[0.6deg] bg-accent-soft"
              }`}
              style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
            >
              <p className="text-sm">
                <span className={`font-semibold ${n.mia ? "text-ink-soft" : "text-accent"}`}>{n.mia ? "tú" : otro}</span>
                <span className="text-ink-soft"> · {formatDate(n.at)}</span>
                {n.mia && n.visto && <span className="font-semibold text-accent"> · ✓ la vio</span>}
              </p>
              <p className="mt-1.5 whitespace-pre-line text-pretty text-lg leading-relaxed">{n.texto}</p>
              {n.mia && (
                <form action={borrarNota} className="-mb-2 -mr-5 mt-1 flex justify-end">
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    aria-label="borrar esta nota"
                    className="press grid size-9 place-items-center rounded-full text-ink-soft hover:bg-surface hover:text-ink"
                  >
                    <Trash className="size-4" />
                  </button>
                </form>
              )}
            </li>
          ))}
        </ol>
      )}
      <Composer para={otro} />
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
