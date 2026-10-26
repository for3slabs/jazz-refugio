import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Gift } from "@/components/icons";
import { loadMisiones } from "@/lib/misiones";
import { loadDados, loadRegalos, vistaDeJazz } from "@/lib/regalos";
import { currentRole } from "@/lib/session";
import { loadRegalados } from "@/lib/mascota";
import { salir } from "../actions";
import { Regalos } from "./regalos";

// «regalos» is the one thing between the two that stays in her refuge (Brian, 2026-10-25: «es su
// lugar seguro de ella … nada rastro mío y de comunicación», and then «esa función de regalos sí
// déjala»): letters and coupons both ways, wrapped. No notes, no shared question, no «seen».
export default function RegalosPage() {
  return (
    <Suspense
      fallback={
        <Shell back menu={false}>
          <PageTitle icon={<Gift className="size-7" />}>regalos</PageTitle>
          <RegalosSkeleton />
        </Shell>
      }
    >
      <Marco />
    </Suspense>
  );
}

// Brian's word opens only this page: no doors to her places, and his own way out.
async function Marco() {
  const suya = (await currentRole()) === "jazz";
  return (
    <Shell back menu={suya}>
      <PageTitle icon={<Gift className="size-7" />}>regalos</PageTitle>
      <Suspense fallback={<RegalosSkeleton />}>
        <Content />
      </Suspense>
      {!suya && (
        <form action={salir} className="mt-6 flex justify-center">
          <button type="submit" className="press rounded-full px-4 py-2 text-sm text-ink-soft hover:text-ink">
            salir
          </button>
        </form>
      )}
    </Shell>
  );
}

async function Content() {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  const otro = role === "jazz" ? "Brian" : "Jazz";
  // her missions open her gifts; they are read only for her session, never for his
  const [regalos, m] = await Promise.all([loadRegalos(role), role === "jazz" ? loadMisiones() : null]).catch(() => [null, null] as const);
  if (!regalos) return <p className="mt-6 text-pretty text-lg text-ink-soft">No pude leer los regalos. Vuelve a abrir en un momento.</p>;
  // her garden opens her gifts; his open right away
  const total = role === "jazz" ? (m?.total ?? 0) : 0;
  // what was given and, for Brian, the pet objects — together, not one after the other
  const [dados, regalados] = await Promise.all([
    loadDados(role).catch(() => []),
    role === "brian" ? loadRegalados().catch(() => []) : null,
  ]);
  return (
    <>
      <p className="mt-2 text-pretty text-ink-soft">
        {role === "jazz" ? "cupones y cartas · algunos esperan tus misiones" : "cupones y cartas · los tuyos esperan sus misiones"}
      </p>
      <Regalos
        {...vistaDeJazz(regalos, total)}
        de={otro}
        // whether the other one opened it is never shown: what she does in her refuge is hers
        dados={dados.map((r) => ({ ...r, abierto: null }))}
        regalados={regalados}
      />
      {/* room under the last line, so the assistant's floating button never sits on it */}
      <div aria-hidden className="h-16" />
    </>
  );
}

function RegalosSkeleton() {
  return (
    <div className="mt-8 grid grid-cols-2 gap-4" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl bg-accent-soft/60" />
      ))}
    </div>
  );
}
