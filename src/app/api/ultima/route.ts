import { NextResponse } from "next/server";
import { loadMisiones } from "@/lib/misiones";
import { loadNotes } from "@/lib/notes";
import { hayParaAbrir, loadRegalos } from "@/lib/regalos";
import { currentRole } from "@/lib/session";

// What makes the «de Brian» door glow: the time of the newest note (she compares it with
// what she last saw) and, for her, whether a gift is ready to open. Never any text.
export async function GET() {
  const role = await currentRole();
  if (!role) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [newest] = await loadNotes();
  let regalo = false;
  if (role === "jazz") {
    const [list, m] = await Promise.all([loadRegalos(), loadMisiones()]).catch(() => [[], null] as const);
    regalo = hayParaAbrir([...list], m?.total ?? 0);
  }
  return NextResponse.json({ at: newest?.at ?? null, regalo }, { headers: { "cache-control": "no-store" } });
}
