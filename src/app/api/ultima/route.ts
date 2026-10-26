import { NextResponse } from "next/server";
import { loadMisiones } from "@/lib/misiones";
import { hayParaAbrir, loadRegalos } from "@/lib/regalos";
import { currentRole } from "@/lib/session";

// What makes the «regalos» door glow, for whoever is looking: a gift ready to open. Read on the
// server, so it is the same on every device. Never any text.
export async function GET() {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const regalo = await Promise.all([loadRegalos(role), role === "jazz" ? loadMisiones() : null])
    .then(([list, m]) => hayParaAbrir(list, m?.total ?? 0))
    .catch(() => false);
  return NextResponse.json({ regalo }, { headers: { "cache-control": "no-store" } });
}
