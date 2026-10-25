import { timingSafeEqual } from "node:crypto";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { hayBase, sql } from "@/lib/db";

// Once a day (vercel.json), what was let go more than 30 days ago is deleted for real: ESQUEMA.md
// element 2, block base-de-datos D-9. The only /api without the cookie — Vercel calls it with
// `Bearer $CRON_SECRET`, and with no secret configured it refuses everyone. The DB deletes the rows
// and returns the paths of the images it removed; their files are deleted inside the same
// transaction, so a Blob failure rolls the rows back and tomorrow's run tries again — never a
// file left behind with nothing pointing at it.
function autorizado(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!autorizado(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hayBase()) return NextResponse.json({ error: "no database" }, { status: 503 });
  const imagenes = await sql().begin(async (tx) => {
    const filas = await tx<{ archivo: string }[]>`select archivo from purgar_soltado()`;
    const archivos = filas.map((f) => f.archivo);
    if (archivos.length) await del(archivos);
    return archivos.length;
  });
  return NextResponse.json({ imagenes }, { headers: { "cache-control": "no-store" } });
}
