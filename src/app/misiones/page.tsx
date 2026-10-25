import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Diamond } from "@/components/icons";
import { MAX_ABIERTAS } from "@/lib/mision";
import { deHoy, loadMisiones } from "@/lib/misiones";
import { loadPendientes } from "@/lib/pendientes";
import { currentRole } from "@/lib/session";
import { loadSoltado } from "@/lib/soltado";
import { LoSoltado } from "@/components/soltado";
import { Board } from "./board";
import { Later } from "./later";
import { Tabs } from "./tabs";

type Search = Promise<{ v?: string; meta?: string }>;

export default function Misiones({ searchParams }: { searchParams: Search }) {
  return (
    <Shell back>
      <PageTitle icon={<Diamond className="size-7" />}>misiones</PageTitle>
      <Suspense fallback={<BoardSkeleton />}>
        <Missions searchParams={searchParams} />
      </Suspense>
    </Shell>
  );
}

async function Missions({ searchParams }: { searchParams: Search }) {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  // Her missions and goals are hers: Brian has no screen for them (misiones D-3, pendientes D-2).
  if (role !== "jazz") {
    return <p className="rise mt-10 text-pretty text-lg text-ink-soft">Este espacio es solo de Jazz.</p>;
  }
  const { v, meta } = await searchParams;

  if (v === "despues") {
    const [p, m, soltado] = await Promise.all([loadPendientes(), loadMisiones(), loadSoltado("despues").catch(() => [])]);
    return (
      <>
        <Tabs vista="despues" />
        <Later mente={p.mente} metas={p.metas} abierta={meta ?? null} hoyLleno={m.abiertas.length >= MAX_ABIERTAS} />
        <LoSoltado items={soltado} />
      </>
    );
  }

  const [m, soltado] = await Promise.all([loadMisiones(), loadSoltado("hoy").catch(() => [])]);
  return (
    <>
      <Tabs vista="hoy" />
      <p className="mt-5 text-pretty text-lg text-ink-soft">Máximo 3 a la vez. Cada una que cumplas es una flor.</p>
      <Board abiertas={m.abiertas} hoy={deHoy(m.hechas)} total={m.total} />
      <LoSoltado items={soltado} />
    </>
  );
}

function BoardSkeleton() {
  return (
    <div className="mt-8 space-y-3" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-3xl bg-accent-soft/60" />
      ))}
    </div>
  );
}
