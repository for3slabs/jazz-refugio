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
    return (
      <>
        <Titulo />
        <p className="rise mt-10 text-pretty text-lg text-ink-soft">Este espacio es solo de Jazz.</p>
      </>
    );
  }
  const { v, meta } = await searchParams;

  if (v === "despues") {
    const [p, m, soltado] = await Promise.all([loadPendientes(), loadMisiones(), loadSoltado("despues").catch(() => [])]);
    return (
      <>
        <Titulo vista="despues" />
        <Later mente={p.mente} metas={p.metas} abierta={meta ?? null} hoyLleno={m.abiertas.length >= MAX_ABIERTAS} />
        <LoSoltado items={soltado} />
      </>
    );
  }

  const [m, soltado] = await Promise.all([loadMisiones(), loadSoltado("hoy").catch(() => [])]);
  return (
    <>
      <Titulo vista="hoy" />
      <h2 className="mt-8 text-lg font-semibold">tus 3 misiones de hoy</h2>
      <p className="mt-0.5 text-pretty text-sm text-ink-soft">cada una que cumplas es una flor en tu jardín</p>
      <Board abiertas={m.abiertas} hoy={deHoy(m.hechas)} total={m.total} soltado={soltado} />
      {/* room under the last line, so the assistant's floating button never sits on it */}
      <div aria-hidden className="h-16" />
    </>
  );
}

// The title leads and its two views sit on the same line — one row less before her list
// (Brian, 2026-10-25: «hoy y más adelante al mismo nivel de misiones»).
function Titulo({ vista }: { vista?: "hoy" | "despues" }) {
  return (
    <PageTitle icon={<Diamond className="size-7" />} aside={vista && <Tabs vista={vista} />}>
      misiones
    </PageTitle>
  );
}

function BoardSkeleton() {
  return (
    <div className="mt-24 space-y-3" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-3xl bg-accent-soft/60" />
      ))}
    </div>
  );
}
