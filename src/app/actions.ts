"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, MAX_AGE_S, issueToken } from "@/lib/token";

// Forgiving on purpose: case, accents and extra spaces do not matter — a wrong
// accent should never lock her out of her own place.
function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const digest = (s: string) => createHash("sha256").update(normalize(s)).digest();

export type EntrarState = { error: string | null };

export async function entrar(_: EntrarState, form: FormData): Promise<EntrarState> {
  const expected = process.env.REFUGIO_CLAVE;
  const token = await issueToken();
  if (!expected || !token) return { error: "Tu lienzo todavía no está listo. Avísale a Brian." };

  const given = String(form.get("clave") ?? "");
  if (!timingSafeEqual(digest(given), digest(expected))) {
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
