"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MAX_NOTE, addNote, removeNote } from "@/lib/notes";
import { currentRole } from "@/lib/session";
import { COOKIE, MAX_AGE_S, type Role, issueToken } from "@/lib/token";

// Forgiving on purpose: case, accents and extra spaces do not matter — a wrong
// accent should never lock her out of her own place.
function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const digest = (s: string) => createHash("sha256").update(normalize(s)).digest();
const matches = (given: Buffer, expected: string | undefined) =>
  !!expected && timingSafeEqual(given, digest(expected));

export type EntrarState = { error: string | null };

export async function entrar(_: EntrarState, form: FormData): Promise<EntrarState> {
  if (!process.env.REFUGIO_CLAVE || !process.env.REFUGIO_SECRETO) {
    return { error: "Tu lienzo todavía no está listo. Avísale a Brian." };
  }

  const given = digest(String(form.get("clave") ?? ""));
  // Both words are always compared, so the time taken never says which one was close.
  const isJazz = matches(given, process.env.REFUGIO_CLAVE);
  const isBrian = matches(given, process.env.REFUGIO_CLAVE_BRIAN);
  const role: Role | null = isBrian ? "brian" : isJazz ? "jazz" : null;

  const token = role && (await issueToken(role));
  if (!token) {
    await new Promise((r) => setTimeout(r, 700)); // slows down guessing
    return { error: "Esa no es. Inténtalo otra vez, con calma." };
  }

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
  redirect("/");
}

export async function salir() {
  (await cookies()).delete(COOKIE);
  redirect("/entrar");
}

export type NotaState = { ok: boolean; error: string | null };

export async function dejarNota(_: NotaState, form: FormData): Promise<NotaState> {
  if ((await currentRole()) !== "brian") return { ok: false, error: "Solo Brian puede dejar notas aquí." };
  const texto = String(form.get("texto") ?? "").trim();
  if (!texto) return { ok: false, error: "Escribe algo primero." };
  if (texto.length > MAX_NOTE) return { ok: false, error: `Máximo ${MAX_NOTE} caracteres.` };
  try {
    await addNote(texto);
  } catch {
    return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo en un momento." };
  }
  refresh();
  return { ok: true, error: null };
}

export async function borrarNota(form: FormData) {
  if ((await currentRole()) !== "brian") return;
  const id = String(form.get("id") ?? "");
  if (id) await removeNote(id);
  refresh();
}
