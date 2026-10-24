import { NextResponse } from "next/server";
import { agregar, subir } from "@/lib/lienzo";
import { MAX_BYTES, MAX_LADO } from "@/lib/tablero";
import { currentRole } from "@/lib/session";

const TYPES = ["image/webp", "image/png", "image/jpeg"];

// An image or a drawing for one of her boards. A route, not a server action: a server
// action's body is capped at 1 MB and a drawing can be bigger. Resized on her device first.
export async function POST(req: Request) {
  if ((await currentRole()) !== "jazz") return NextResponse.json({ error: "Esto es solo de Jazz." }, { status: 403 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const tablero = String(form?.get("tablero") ?? "");
  const tipo = form?.get("tipo") === "dibujo" ? "dibujo" : "imagen";
  const w = Math.min(MAX_LADO, Math.max(1, Math.round(Number(form?.get("w")) || 1)));
  const h = Math.min(MAX_LADO, Math.max(1, Math.round(Number(form?.get("h")) || 1)));
  if (!(file instanceof Blob) || !tablero) return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });
  if (!TYPES.includes(file.type)) return NextResponse.json({ error: "Ese formato no se puede subir." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "La imagen pesa demasiado." }, { status: 413 });
  try {
    const path = await subir(file, file.type);
    const err = await agregar(tablero, { tipo, path, w, h });
    if (err) return NextResponse.json({ error: err }, { status: 409 });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar. Inténtalo otra vez." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
