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
import { Apartados, caja } from "./plegado";
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
// «notas» a conversation in one box, «regalos» cards like inspiración's boards, «la pregunta» one
// big card. A dot on «regalos» when one is ready for whoever is looking.
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
    notas: `notas cortas entre ${otro} y tú · se quedan aquí`,
    regalos: role === "jazz" ? "cupones y cartas que se abren con tus misiones" : "cupones y cartas entre Jazz y tú",
    presente: `una al día · la de ${otro} se abre cuando contestes`,
  };
  const tabs = (
    <Apartados
      current={current}
      sub={subs[current]}
      items={[
        { key: "notas", href: "/brian", label: "notas" },
        { key: "regalos", href: "/brian?v=regalos", label: "regalos", dot: !!regalos && hayParaAbrir(regalos, total) },
        { key: "presente", href: "/brian?v=presente", label: "la pregunta" },
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

// Notes both ways in ONE conversation, newest first: the other one's on the left, yours on the
// right with whether they were seen — and «＋ escribirle» as the last row, like «＋ nueva meta».
async function Notes({ role }: { role: Role }) {
  const otro = role === "jazz" ? "Brian" : "Jazz";
  const [notes, dejadas] = await Promise.all([loadNotes(role), loadDejadas(role)]);
  const conversacion = [
    ...notes.map((n) => ({ ...n, mia: false, visto: false })),
    ...dejadas.map((n) => ({ ...n, mia: true, visto: !!n.visto })),
  ].sort((a, b) => b.at - a.at);
  return (
    <>
      <MarkSeen />
      <ol className={`mt-3 ${caja}`}>
        {conversacion.map((n, i) => (
          <li
            key={n.id}
            className={`rise flex flex-col py-3.5 ${n.mia ? "items-end pl-1 pr-4 text-right" : "items-start pl-4 pr-10"}`}
            style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
          >
            {/* one line that reads left to right on both sides: who · when · seen — and yours can go */}
            <div className={`flex items-center gap-2 text-sm ${n.mia ? "w-full justify-end" : ""}`}>
              {n.mia && (
                <form action={borrarNota} className="-my-2 mr-auto">
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    aria-label="borrar esta nota"
                    className="press grid size-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
                  >
                    <Trash className="size-4" />
                  </button>
                </form>
              )}
              <span className={`font-semibold ${n.mia ? "text-ink-soft" : "text-accent"}`}>{n.mia ? "tú" : otro}</span>
              <span className="text-ink-soft">· {formatDate(n.at)}</span>
              {n.mia && n.visto && <span className="font-semibold text-accent">· ✓ la vio</span>}
            </div>
            <p className={`mt-1 whitespace-pre-line text-pretty text-lg leading-relaxed ${n.mia ? "text-ink-soft" : ""}`}>{n.texto}</p>
          </li>
        ))}
        <li>
          <Composer para={otro} />
        </li>
      </ol>
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
