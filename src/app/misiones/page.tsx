import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Diamond } from "@/components/icons";
import { MAX_ABIERTAS } from "@/lib/mision";
import { deHoy, loadMisiones } from "@/lib/misiones";
import { loadPendientes } from "@/lib/pendientes";
import { currentRole } from "@/lib/session";
import { loadSoltado } from "@/lib/soltado";
import { Board } from "./board";
import { Later } from "./later";
import { Vistas } from "./tabs";

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

  // Both views load together, so the switch flips between them without a trip to the server.
  const [m, p, soltadoHoy, soltadoDespues] = await Promise.all([
    loadMisiones(),
    loadPendientes(),
    loadSoltado("hoy").catch(() => []),
    loadSoltado("despues").catch(() => []),
  ]);
  return (
    <Vistas
      inicial={v === "despues" ? "despues" : "hoy"}
      hoy={
        <>
          <h2 className="mt-8 text-lg font-semibold">tus 3 misiones de hoy</h2>
          <p className="mt-0.5 text-pretty text-sm text-ink-soft">cada una que cumplas es una flor en tu jardín</p>
          <Board abiertas={m.abiertas} hoy={deHoy(m.hechas)} total={m.total} soltado={soltadoHoy} />
          {/* room under the last line, so the assistant's floating button never sits on it */}
          <div aria-hidden className="h-16" />
        </>
      }
      despues={
        <Later
          mente={p.mente}
          metas={p.metas}
          abierta={meta ?? null}
          hoyLleno={m.abiertas.length >= MAX_ABIERTAS}
          soltado={soltadoDespues}
        />
      }
    />
  );
}

// The title alone, for whoever is not Jazz.
function Titulo() {
  return <PageTitle icon={<Diamond className="size-7" />}>misiones</PageTitle>;
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
