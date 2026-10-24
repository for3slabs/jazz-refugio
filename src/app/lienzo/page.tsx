import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Palette } from "@/components/icons";
import { loadTableros, visibles } from "@/lib/lienzo";
import { currentRole } from "@/lib/session";
import { Lista } from "./lista";

export default function Lienzo() {
  return (
    <Shell back>
      <PageTitle icon={<Palette className="size-7" />}>lienzo</PageTitle>
      <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-3xl bg-accent-soft/60" aria-hidden />}>
        <Boards />
      </Suspense>
    </Shell>
  );
}

async function Boards() {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  const list = visibles(await loadTableros(), role);
  return <Lista tableros={list} isBrian={role === "brian"} />;
}
