import { Suspense } from "react";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { despertarBase } from "@/lib/db";
import { Shell } from "@/components/shell";
import { currentRole } from "@/lib/session";
import { Crear } from "./crear";

// A new board, in the same frame as a board: she names it here and this screen becomes the board.
// No field squeezed into a card, and no empty board left behind if she changes her mind.
export default function NuevoTablero() {
  return (
    <Shell back wide>
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
  // Neon's free compute sleeps after a few idle minutes and this screen reads nothing: wake it now,
  // after the screen is sent, so it is up by the time she has typed the name.
  after(despertarBase);
  return <Crear />;
}
