import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Diamond } from "@/components/icons";
import { deHoy, loadMisiones } from "@/lib/misiones";
import { currentRole } from "@/lib/session";
import { Board } from "./board";

export default function Misiones() {
  return (
    <Shell back>
      <PageTitle icon={<Diamond className="size-7" />}>misiones</PageTitle>
      <p className="mt-3 text-pretty text-lg text-ink-soft">Máximo 3 a la vez. Cada una que cumplas es una flor.</p>
      <Suspense fallback={<BoardSkeleton />}>
        <Missions />
      </Suspense>
    </Shell>
  );
}

async function Missions() {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  // Her missions are hers: Brian has no screen for them (block misiones, D-3).
  if (role !== "jazz") {
    return <p className="rise mt-10 text-pretty text-lg text-ink-soft">Este espacio es solo de Jazz.</p>;
  }
  const m = await loadMisiones();
  return <Board abiertas={m.abiertas} hoy={deHoy(m.hechas)} total={m.total} />;
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
