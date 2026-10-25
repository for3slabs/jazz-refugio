import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Palette } from "@/components/icons";
import { currentRole } from "@/lib/session";
import { Crear } from "./crear";

// Creating a board is its own small screen: she names it, and lands inside it to fill it. No field
// squeezed into a card, and no empty board left behind if she changes her mind (Brian, 2026-10-25).
export default function NuevoTablero() {
  return (
    <Shell back>
      <PageTitle icon={<Palette className="size-7" />}>inspiración</PageTitle>
      <Suspense>
        <Content />
      </Suspense>
    </Shell>
  );
}

async function Content() {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  // her boards are hers to make; Brian only sees the ones she shares
  if (role !== "jazz") redirect("/lienzo");
  return <Crear />;
}
