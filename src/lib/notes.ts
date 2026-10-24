import { cookies } from "next/headers";
import { COOKIE, verifyToken } from "./token";

export type Note = { fecha: string; texto: string };

// Brian's notes are personal, so they never live in the repo: they come from the
// REFUGIO_NOTAS environment variable, a JSON list of { fecha: "YYYY-MM-DD", texto }.
function parse(raw: string | undefined): Note[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .filter((n): n is Note => typeof n?.fecha === "string" && typeof n?.texto === "string" && n.texto.trim() !== "")
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  } catch {
    return [];
  }
}

// The proxy already guards the page; this checks again where the private data is read,
// so a matcher change can never expose it on its own.
export async function readNotes(): Promise<Note[] | null> {
  const ok = await verifyToken((await cookies()).get(COOKIE)?.value);
  if (!ok) return null;
  return parse(process.env.REFUGIO_NOTAS);
}

export function formatDate(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(d.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long" }).format(d);
}
