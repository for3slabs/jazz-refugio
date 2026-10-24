"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveEstado } from "@/lib/estado";
import { type Abierto, MAX_REGALO, MAX_TITULO, MAX_TRAS } from "@/lib/regalo";
import { abrir, borrar, crear, usar } from "@/lib/regalos";
import { MAX_ABIERTAS, MAX_TEXTO } from "@/lib/mision";
import { agregar, cumplir, florDePaso, loadMisiones, soltar } from "@/lib/misiones";
import {
  anotarIdea,
  marcarPaso,
  nuevaMeta,
  nuevoPaso,
  pasoDe,
  sacarIdea,
  soltarMeta,
  soltarPaso,
} from "@/lib/pendientes";
import { isModo } from "@/lib/modos";
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

export type EstadoResult = { ok: boolean; error: string | null };

// Her mode is hers: only her session marks or clears it.
export async function marcarEstado(modo: string | null): Promise<EstadoResult> {
  if ((await currentRole()) !== "jazz") return { ok: false, error: "Solo Jazz marca cómo está." };
  if (modo !== null && !isModo(modo)) return { ok: false, error: "Ese modo no existe." };
  try {
    await saveEstado(modo);
  } catch {
    return { ok: false, error: "No se pudo guardar. Inténtalo otra vez." };
  }
  refresh();
  return { ok: true, error: null };
}

// Her missions and goals are hers: only her session changes them. One wrapper says so,
// turns a failure into a sentence for her, and refreshes what she sees.
async function deJazz(op: () => Promise<string | void>): Promise<EstadoResult> {
  if ((await currentRole()) !== "jazz") return { ok: false, error: "Esto es solo de Jazz." };
  try {
    const err = await op();
    if (err) return { ok: false, error: err };
  } catch {
    return { ok: false, error: "No se pudo guardar. Inténtalo otra vez." };
  }
  refresh();
  return { ok: true, error: null };
}

function texto(t: string, max = MAX_TEXTO): string | { error: string } {
  const v = t.trim();
  if (!v) return { error: "Escribe algo primero." };
  if (v.length > max) return { error: `Máximo ${max} caracteres.` };
  return v;
}

const LLENO = "Ya tienes 3 para hoy. Termina una primero.";

export const nuevaMision = async (t: string) =>
  deJazz(async () => {
    const v = texto(t);
    if (typeof v !== "string") return v.error;
    if (!(await agregar(v))) return LLENO;
  });

// Completing a mission born from a goal step marks that step done too.
export const cumplirMision = async (id: string) =>
  deJazz(async () => {
    const m = await cumplir(id);
    if (m?.origen) await marcarPaso(m.origen.meta, m.origen.paso, "hecho");
  });

// Letting it go sends the step back to wait in its goal — nothing is lost.
export const soltarMision = async (id: string) =>
  deJazz(async () => {
    const m = await soltar(id);
    if (m?.origen) await marcarPaso(m.origen.meta, m.origen.paso, "espera");
  });

export const anotar = async (t: string) =>
  deJazz(async () => {
    const v = texto(t);
    if (typeof v !== "string") return v.error;
    return anotarIdea(v);
  });

export const soltarIdea = async (id: string) => deJazz(async () => void (await sacarIdea(id)));

export const ideaAHoy = async (id: string) =>
  deJazz(async () => {
    if ((await loadMisiones()).abiertas.length >= MAX_ABIERTAS) return LLENO;
    const idea = await sacarIdea(id);
    if (idea) await agregar(idea.texto.slice(0, MAX_TEXTO));
  });

export const ideaAMeta = async (id: string) =>
  deJazz(async () => {
    const idea = await sacarIdea(id);
    if (!idea) return;
    const err = await nuevaMeta(idea.texto.slice(0, MAX_TEXTO), null);
    if (err) {
      await anotarIdea(idea.texto); // the goal list is full: the thought goes back where it was
      return err;
    }
  });

export const crearMeta = async (t: string, para: string | null) =>
  deJazz(async () => {
    const v = texto(t);
    if (typeof v !== "string") return v.error;
    return nuevaMeta(v, para && /^\d{4}-\d{2}-\d{2}$/.test(para) ? para : null);
  });

export const borrarMeta = async (id: string) => deJazz(() => soltarMeta(id));

export const agregarPaso = async (metaId: string, t: string) =>
  deJazz(async () => {
    const v = texto(t);
    if (typeof v !== "string") return v.error;
    return nuevoPaso(metaId, v);
  });

export const borrarPaso = async (metaId: string, pasoId: string) => deJazz(() => soltarPaso(metaId, pasoId));

export const pasoAHoy = async (metaId: string, pasoId: string) =>
  deJazz(async () => {
    const paso = await pasoDe(metaId, pasoId);
    if (!paso || paso.hecho || paso.enHoy) return;
    if (!(await agregar(paso.texto, { meta: metaId, paso: pasoId }))) return LLENO;
    return marcarPaso(metaId, pasoId, "enHoy");
  });

// Done right in the goal: the step is marked and the garden still gets its flower.
export const cumplirPaso = async (metaId: string, pasoId: string) =>
  deJazz(async () => {
    const paso = await pasoDe(metaId, pasoId);
    if (!paso || paso.hecho) return;
    if (paso.enHoy) {
      // it is also waiting in «hoy»: complete that mission, which marks the step
      const m = (await loadMisiones()).abiertas.find((x) => x.origen?.paso === pasoId);
      if (m) {
        await cumplir(m.id);
        return marcarPaso(metaId, pasoId, "hecho");
      }
    }
    await florDePaso(paso.texto);
    return marcarPaso(metaId, pasoId, "hecho");
  });

// Gifts: Brian leaves and deletes them; she opens and uses them.
export type RegaloState = { ok: boolean; error: string | null };

export async function dejarRegalo(_: RegaloState, form: FormData): Promise<RegaloState> {
  if ((await currentRole()) !== "brian") return { ok: false, error: "Solo Brian deja regalos aquí." };
  const tipo = form.get("tipo") === "carta" ? "carta" : "cupon";
  const titulo = String(form.get("titulo") ?? "").trim();
  const cuerpo = String(form.get("texto") ?? "").trim();
  if (!titulo) return { ok: false, error: "Ponle un título." };
  if (titulo.length > MAX_TITULO) return { ok: false, error: `El título, máximo ${MAX_TITULO} caracteres.` };
  if (cuerpo.length > MAX_REGALO) return { ok: false, error: `El texto, máximo ${MAX_REGALO} caracteres.` };
  const tras = form.get("abre") === "tras" ? Math.min(MAX_TRAS, Math.max(1, Math.floor(Number(form.get("n")) || 1))) : 0;
  try {
    // «tras N misiones» counts from her total right now.
    const desde = tras ? (await loadMisiones()).total + tras : 0;
    await crear(tipo, titulo, cuerpo, desde);
  } catch {
    return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo en un momento." };
  }
  refresh();
  return { ok: true, error: null };
}

export async function borrarRegalo(form: FormData) {
  if ((await currentRole()) !== "brian") return;
  const id = String(form.get("id") ?? "");
  if (id) await borrar(id);
  refresh();
}

// The only way a gift's content reaches her browser: she opens it, and its missions are done.
export async function abrirRegalo(id: string): Promise<EstadoResult & { regalo: Abierto | null }> {
  if ((await currentRole()) !== "jazz") return { ok: false, error: "Esto es solo de Jazz.", regalo: null };
  try {
    const regalo = await abrir(id, (await loadMisiones()).total);
    if (!regalo) return { ok: false, error: "Este todavía no se abre.", regalo: null };
    refresh();
    return { ok: true, error: null, regalo };
  } catch {
    return { ok: false, error: "No se pudo abrir. Inténtalo otra vez.", regalo: null };
  }
}

export const usarCupon = async (id: string) => deJazz(() => usar(id));

export async function borrarNota(form: FormData) {
  if ((await currentRole()) !== "brian") return;
  const id = String(form.get("id") ?? "");
  if (id) await removeNote(id);
  refresh();
}
