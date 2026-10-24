import { NextResponse } from "next/server";
import { loadNotes } from "@/lib/notes";
import { currentRole } from "@/lib/session";

// When was the newest note left? The home's «de Brian» door glows if it is newer than
// what she last saw. Only the time travels here, never the text.
export async function GET() {
  if (!(await currentRole())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [newest] = await loadNotes();
  return NextResponse.json({ at: newest?.at ?? null }, { headers: { "cache-control": "no-store" } });
}
