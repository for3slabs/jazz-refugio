import { NextResponse } from "next/server";
import { loadMisiones } from "@/lib/misiones";
import { hayNuevas } from "@/lib/notes";
import { hayParaAbrir, loadRegalos } from "@/lib/regalos";
import { currentRole } from "@/lib/session";

// What makes the «mensajes» door glow, for whoever is looking: a note the other left that they
// have not opened yet, or a gift ready to open. Read on the server, so it is the same on every
// device. Never any text.
export async function GET() {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [nuevo, regalo] = await Promise.all([
    hayNuevas(role).catch(() => false),
    Promise.all([loadRegalos(role), role === "jazz" ? loadMisiones() : null])
      .then(([list, m]) => hayParaAbrir(list, m?.total ?? 0))
      .catch(() => false),
  ]);
  return NextResponse.json({ nuevo, regalo }, { headers: { "cache-control": "no-store" } });
}
