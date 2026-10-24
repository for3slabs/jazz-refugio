import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { loadTableros } from "@/lib/lienzo";
import { currentRole } from "@/lib/session";
import { Dibujo } from "./dibujo";

type Params = Promise<{ id: string }>;

export default function Dibujar({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-canvas" aria-hidden />}>
      <Content params={params} />
    </Suspense>
  );
}

// Only she draws, and only on a board that exists.
async function Content({ params }: { params: Params }) {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  const { id } = await params;
  if (role !== "jazz") redirect(`/lienzo/${id}`);
  const t = (await loadTableros()).find((x) => x.id === id);
  if (!t) notFound();
  return <Dibujo tablero={t.id} nombre={t.nombre} />;
}
