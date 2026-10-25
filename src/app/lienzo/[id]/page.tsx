import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { PREFIX, loadTableros, visibles } from "@/lib/lienzo";
import { currentRole } from "@/lib/session";
import { Board } from "./board";

type Params = Promise<{ id: string }>;

export default function TableroPage({ params }: { params: Params }) {
  return (
    <Shell back wide>
      <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-3xl bg-accent-soft/60" aria-hidden />}>
        <Content params={params} />
      </Suspense>
    </Shell>
  );
}

async function Content({ params }: { params: Params }) {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  const { id } = await params;
  // Brian reaches a board only if she shared it — otherwise it does not exist for him.
  const t = visibles(await loadTableros(), role).find((x) => x.id === id);
  if (!t) notFound();
  return <Board tablero={t} isBrian={role === "brian"} docs={`${PREFIX}/doc`} />;
}
