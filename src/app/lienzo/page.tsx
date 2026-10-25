import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Palette } from "@/components/icons";
import { loadTableros, tableroSoltado, visibles } from "@/lib/lienzo";
import { currentRole } from "@/lib/session";
import { Lista } from "./lista";

export default function Lienzo({ searchParams }: PageProps<"/lienzo">) {
  return (
    <Shell back>
      <PageTitle icon={<Palette className="size-7" />}>inspiración</PageTitle>
      <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-3xl bg-accent-soft/60" aria-hidden />}>
        <Boards searchParams={searchParams} />
      </Suspense>
    </Shell>
  );
}

async function Boards({ searchParams }: { searchParams: PageProps<"/lienzo">["searchParams"] }) {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  const list = visibles(await loadTableros(), role);
  // a board she just let go: offered back with «deshacer» (it stays recoverable for 30 days)
  const { soltado } = await searchParams;
  const recien = role === "jazz" && typeof soltado === "string" ? await tableroSoltado(soltado).catch(() => null) : null;
  return <Lista tableros={list} isBrian={role === "brian"} soltado={recien} />;
}
