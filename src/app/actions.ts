"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { refresh, revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { agregarAprendido, agregarLibro, agregarViaje, marcarRegalado, moverLibro, moverViaje, soltarDe } from "@/lib/coleccion";
import { MAX_NOTA as MAX_NOTA_ESTANTE, MAX_TITULO as MAX_TITULO_ESTANTE } from "@/lib/estante";
import { partirEnPasos, porDondeEmpiezo } from "@/lib/ayudantes";
import { loadEstado, saveEstado } from "@/lib/estado";
import {
  agregar as agregarAlTablero,
  borrarTablero,
  compartir,
  crearTablero,
  editarTablero as guardarTablero,
  elegirPortada,
  moverItem,
  quitar,
  restaurarTablero,
} from "@/lib/lienzo";
import { MAX_DESCRIPCION, MAX_NOMBRE, MAX_NOTA, isHex } from "@/lib/tablero";
import { MAX_RESPUESTA } from "@/lib/entre";
import { contestar, marcarPresente } from "@/lib/presente";
import { type Abierto, MAX_REGALO, MAX_TITULO, MAX_TRAS } from "@/lib/regalo";
import { abrir, borrar, crear, usar } from "@/lib/regalos";
import { type ObjetoId, isObjeto, limpiarPuestos } from "@/lib/objeto";
import { limpiarNombre, regalar, saveMascota } from "@/lib/mascota";
import { ESTADOS_MISION, type EstadoMision, MAX_TEXTO } from "@/lib/mision";
import { type Enlace, MAX_DESCRIPCION_META, MAX_PASOS, siguiente, terminada } from "@/lib/pendiente";
import { urlValida, vistaPrevia } from "@/lib/vista-previa";
import { agregar, cumplir, florDePaso, loadMisiones, marcarEstadoMision, soltar } from "@/lib/misiones";
import {
  anotarIdea,
  loadPendientes,
  marcarPaso,
  editarMeta,
  nuevaMeta,
  nuevoPaso,
  pasarIdeaAHoy,
  pasarIdeaAMeta,
  pasoDe,
  sacarIdea,
  soltarMeta,
  soltarPaso,
} from "@/lib/pendientes";
import { isModo } from "@/lib/modos";
import { MAX_NOTE, addNote, marcarVistas, removeNote } from "@/lib/notes";
import { currentRole } from "@/lib/session";
import type { Moment } from "@/lib/local";
import { anotarVuelta, subirVueltas } from "@/lib/vueltas";
import { type Tipo as TipoSoltado, recuperar } from "@/lib/soltado";
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
    return { error: "Tu refugio todavía no está listo. Avísale a Brian." };
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

// Notes go both ways: each one leaves notes for the other (never a thread).
export async function dejarNota(_: NotaState, form: FormData): Promise<NotaState> {
  const role = await currentRole();
  if (!role) return { ok: false, error: "Entra primero." };
  const texto = String(form.get("texto") ?? "").trim();
  if (!texto) return { ok: false, error: "Escribe algo primero." };
  if (texto.length > MAX_NOTE) return { ok: false, error: `Máximo ${MAX_NOTE} caracteres.` };
  try {
    await addNote(role, texto);
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

// A return («volver»): one more flower, the same on every device. Returns how many there are.
export async function volviste(paso: string): Promise<number | null> {
  const role = await currentRole();
  if (!role) return null;
  try {
    return await anotarVuelta(role, paso.trim());
  } catch {
    return null;
  }
}

// The flowers a browser kept before the DB: uploaded once; the same one twice counts once.
export async function subirMisVueltas(list: Moment[]): Promise<boolean> {
  const role = await currentRole();
  if (!role || !Array.isArray(list)) return false;
  try {
    await subirVueltas(role, list);
    return true;
  } catch {
    return false;
  }
}

// «deshacer» / «recuperar»: what she let go in the last 30 days goes back where it was.
export const recuperarSoltado = async (tipo: TipoSoltado, id: string) =>
  deJazz(async () => (["mision", "idea", "meta", "paso"].includes(tipo) ? recuperar(tipo, id) : "Eso no existe."));

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

// Returns the mission's real id: the board shows it at once under a temporary one, and a tap that
// comes before this answer waits for it instead of sending the temporary id.
export async function nuevaMision(t: string): Promise<EstadoResult & { id?: string }> {
  let id: string | undefined;
  const r = await deJazz(async () => {
    const v = texto(t);
    if (typeof v !== "string") return v.error;
    const nueva = await agregar(v);
    if (!nueva) return LLENO;
    id = nueva;
  });
  return { ...r, ...(id && { id }) };
}

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

// How a mission is going — «haciendo», «atorada», or null to clear it. Hers only.
export const estadoMision = async (id: string, estado: EstadoMision | null) =>
  deJazz(async () => {
    if (estado !== null && !ESTADOS_MISION.includes(estado)) return "Ese estado no existe.";
    if (!(await marcarEstadoMision(id, estado))) return "Esa misión ya no está abierta.";
  });

export const anotar = async (t: string) =>
  deJazz(async () => {
    const v = texto(t);
    if (typeof v !== "string") return v.error;
    return anotarIdea(v);
  });

export const soltarIdea = async (id: string) => deJazz(async () => void (await sacarIdea(id)));

// One transaction each: if today or the goals are full, the thought stays where it was.
export const ideaAHoy = async (id: string) => deJazz(async () => ((await pasarIdeaAHoy(id)) ? LLENO : undefined));

export const ideaAMeta = async (id: string) => deJazz(() => pasarIdeaAMeta(id));

const fechaValida = (para: string | null) => (para && /^\d{4}-\d{2}-\d{2}$/.test(para) ? para : null);
const descripcionDe = (d: string | null | undefined) => (d ?? "").trim().slice(0, MAX_DESCRIPCION_META) || null;

// A link she pins: «behance.net/…» works without «https://». Its page's preview is read once, here,
// through the guarded reader; a page that does not share one still keeps the link.
async function enlaceDe(raw: string | null | undefined): Promise<Enlace | null | string> {
  const t = (raw ?? "").trim();
  if (!t) return null;
  const u = urlValida(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`);
  if (!u) return "Ese enlace no se puede usar. Revisa que sea una página web (https://…).";
  const v = await vistaPrevia(u);
  return { url: u.href, titulo: v?.titulo ?? null, imagen: v?.imagen ?? null, sitio: v?.sitio ?? u.hostname.replace(/^www\./, "") };
}

export const crearMeta = async (t: string, para: string | null, descripcion?: string | null, url?: string | null) =>
  deJazz(async () => {
    const v = texto(t);
    if (typeof v !== "string") return v.error;
    const e = await enlaceDe(url);
    if (typeof e === "string") return e;
    return nuevaMeta(v, fechaValida(para), descripcionDe(descripcion), e);
  });

// The pencil on a goal: its name, description, date and link in one save.
export const editarLaMeta = async (id: string, t: string, descripcion: string | null, para: string | null, url?: string | null) =>
  deJazz(async () => {
    const v = texto(t);
    if (typeof v !== "string") return v.error;
    const e = await enlaceDe(url);
    if (typeof e === "string") return e;
    if (!(await editarMeta(id, v, descripcionDe(descripcion), fechaValida(para), e))) return "Esa meta ya no está.";
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

// Opening «notas» is what reading means — the same on every device.
export async function marcarNotasVistas() {
  const role = await currentRole();
  if (!role) return;
  try {
    await marcarVistas(role);
  } catch {
    /* seen is a nicety: never an error on her screen */
  }
}

// Gifts go both ways: each one leaves and lets go their own; the other opens and uses them.
export type RegaloState = { ok: boolean; error: string | null };

export async function dejarRegalo(_: RegaloState, form: FormData): Promise<RegaloState> {
  const role = await currentRole();
  if (!role) return { ok: false, error: "Entra primero." };
  const tipo = form.get("tipo") === "carta" ? "carta" : "cupon";
  const titulo = String(form.get("titulo") ?? "").trim();
  const cuerpo = String(form.get("texto") ?? "").trim();
  if (!titulo) return { ok: false, error: "Ponle un título." };
  if (titulo.length > MAX_TITULO) return { ok: false, error: `El título, máximo ${MAX_TITULO} caracteres.` };
  if (cuerpo.length > MAX_REGALO) return { ok: false, error: `El texto, máximo ${MAX_REGALO} caracteres.` };
  // only her gifts can wait for missions: Brian has no garden
  const tras = role === "brian" && form.get("abre") === "tras" ? Math.min(MAX_TRAS, Math.max(1, Math.floor(Number(form.get("n")) || 1))) : 0;
  try {
    // «tras N misiones» counts from her total right now.
    const desde = tras ? (await loadMisiones()).total + tras : 0;
    await crear(role, tipo, titulo, cuerpo, desde);
  } catch {
    return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo en un momento." };
  }
  refresh();
  return { ok: true, error: null };
}

// An object from Brian for her pet: it is hers at once, whatever her garden says.
export async function regalarObjeto(form: FormData) {
  if ((await currentRole()) !== "brian") return;
  const id = form.get("id");
  if (!isObjeto(id)) return;
  await regalar(id);
  refresh();
}

// Her pet's name and what it wears. Only she dresses it. Which objects she owns is partly in
// her browser (the times she came back), so the server checks shape, not ownership.
export async function guardarMascota(nombre: string, puestos: Partial<Record<string, ObjetoId>>): Promise<EstadoResult> {
  if ((await currentRole()) !== "jazz") return { ok: false, error: "Solo Jazz viste a su mascota." };
  const limpio = limpiarNombre(nombre);
  if (!limpio) return { ok: false, error: "Ponle un nombre." };
  try {
    // a category left out wears nothing: «nada» is a choice too
    await saveMascota({ nombre: limpio, puestos: limpiarPuestos(puestos) });
  } catch {
    return { ok: false, error: "No se pudo guardar. Inténtalo de nuevo en un momento." };
  }
  refresh();
  return { ok: true, error: null };
}

export async function borrarRegalo(form: FormData) {
  const role = await currentRole();
  if (!role) return;
  const id = String(form.get("id") ?? "");
  if (id) await borrar(role, id);
  refresh();
}

// The only way a gift's content reaches a browser: the one it is for opens it (hers, once its
// missions are done; his, right away).
export async function abrirRegalo(id: string): Promise<EstadoResult & { regalo: Abierto | null }> {
  const role = await currentRole();
  if (!role) return { ok: false, error: "Entra primero.", regalo: null };
  try {
    const regalo = await abrir(role, id, role === "jazz" ? (await loadMisiones()).total : 0);
    if (!regalo) return { ok: false, error: "Este todavía no se abre.", regalo: null };
    refresh();
    return { ok: true, error: null, regalo };
  } catch {
    return { ok: false, error: "No se pudo abrir. Inténtalo otra vez.", regalo: null };
  }
}

export async function usarCupon(id: string): Promise<EstadoResult> {
  const role = await currentRole();
  if (!role) return { ok: false, error: "Entra primero." };
  try {
    await usar(role, id);
  } catch {
    return { ok: false, error: "No se pudo guardar. Inténtalo otra vez." };
  }
  refresh();
  return { ok: true, error: null };
}

// «Entre los dos»: either of them answers the question of the day; only Brian marks «aquí estoy».
export async function contestarPregunta(t: string): Promise<EstadoResult> {
  const role = await currentRole();
  if (!role) return { ok: false, error: "Entra primero." };
  const v = texto(t, MAX_RESPUESTA);
  if (typeof v !== "string") return { ok: false, error: v.error };
  try {
    const err = await contestar(role, v);
    if (err) return { ok: false, error: err };
  } catch {
    return { ok: false, error: "No se pudo guardar. Inténtalo otra vez." };
  }
  refresh();
  return { ok: true, error: null };
}

export async function aquiEstoy(horas: number): Promise<EstadoResult> {
  if ((await currentRole()) !== "brian") return { ok: false, error: "Solo Brian marca «aquí estoy»." };
  try {
    await marcarPresente([0, 1, 2, 4].includes(horas) ? horas : 0);
  } catch {
    return { ok: false, error: "No se pudo guardar. Inténtalo otra vez." };
  }
  refresh();
  return { ok: true, error: null };
}

// Her boards: only she changes them (images and drawings arrive through /api/lienzo/subir).
// The new board's id comes back: the list opens it at once, so naming it is the only step
// before filling it (Brian, 2026-10-25: «nos ahorramos un paso»).
export async function nuevoTablero(t: string): Promise<EstadoResult & { id?: string }> {
  let id: string | undefined;
  const r = await deJazz(async () => {
    const v = texto(t, MAX_NOMBRE);
    if (typeof v !== "string") return v.error;
    const c = await crearTablero(v);
    if (typeof c === "string") return c;
    id = c.id;
  });
  return { ...r, ...(id && { id }) };
}

// The create screen's one call: on success the server answers with the new board itself (a redirect
// resolved in the same request — one trip, and «atrás» returns to the list); otherwise the sentence.
// Outside deJazz on purpose: a redirect is thrown, and deJazz would turn it into «No se pudo guardar».
// It does NOT refresh the screen it leaves (deJazz would re-render «nuevo tablero» only to throw it
// away): it marks the list stale and goes straight to the board (measured: two trips stacked).
export async function crearYAbrirTablero(t: string): Promise<EstadoResult> {
  if ((await currentRole()) !== "jazz") return { ok: false, error: "Esto es solo de Jazz." };
  const v = texto(t, MAX_NOMBRE);
  if (typeof v !== "string") return { ok: false, error: v.error };
  let c: { id: string } | string;
  try {
    c = await crearTablero(v);
  } catch {
    return { ok: false, error: "No se pudo guardar. Inténtalo otra vez." };
  }
  if (typeof c === "string") return { ok: false, error: c };
  revalidatePath("/lienzo");
  redirect(`/lienzo/${c.id}`, RedirectType.replace);
}

export const soltarTablero = async (id: string) => deJazz(() => borrarTablero(id));

export const compartirTablero = async (id: string, si: boolean) => deJazz(() => compartir(id, si));

export const agregarColor = async (tablero: string, color: string) =>
  deJazz(async () => (isHex(color) ? agregarAlTablero(tablero, { tipo: "color", color: color.toLowerCase() }) : "Ese color no es válido."));

export const agregarNota = async (tablero: string, t: string) =>
  deJazz(async () => {
    const v = texto(t, MAX_NOTA);
    if (typeof v !== "string") return v.error;
    return agregarAlTablero(tablero, { tipo: "nota", texto: v });
  });

export const quitarDelTablero = async (tablero: string, item: string) => deJazz(() => quitar(tablero, item));

export const editarTablero = async (id: string, n: string, d: string) =>
  deJazz(async () => {
    const nombre = texto(n, MAX_NOMBRE);
    if (typeof nombre !== "string") return nombre.error;
    const descripcion = d.trim();
    if (descripcion.length > MAX_DESCRIPCION) return `Máximo ${MAX_DESCRIPCION} caracteres.`;
    return guardarTablero(id, nombre, descripcion);
  });

export const portadaDelTablero = async (id: string, item: string | null) => deJazz(() => elegirPortada(id, item));

export const moverEnTablero = async (id: string, item: string, paso: -1 | 1) =>
  deJazz(() => moverItem(id, item, paso === -1 ? -1 : 1));

export const deshacerTablero = async (id: string) => deJazz(() => restaurarTablero(id));

// A shelf and trips each: whoever is in writes their own. Optional fields may be empty; the rest
// are short.
async function deCadaUno(op: (role: Role) => Promise<string | void>): Promise<EstadoResult> {
  const role = await currentRole();
  if (!role) return { ok: false, error: "Entra primero." };
  try {
    const err = await op(role);
    if (err) return { ok: false, error: err };
  } catch {
    return { ok: false, error: "No se pudo guardar. Inténtalo otra vez." };
  }
  refresh();
  return { ok: true, error: null };
}
function opcional(t: string, max: number): string | { error: string } {
  const v = t.trim();
  return v.length > max ? { error: `Máximo ${max} caracteres.` } : v;
}

export const guardarLibro = async (titulo: string, autor: string, estado: string, nota: string) =>
  deCadaUno(async (role) => {
    const t = texto(titulo, MAX_TITULO_ESTANTE);
    const a = opcional(autor, MAX_TITULO_ESTANTE);
    const n = opcional(nota, MAX_NOTA_ESTANTE);
    for (const v of [t, a, n]) if (typeof v !== "string") return v.error;
    const e = estado === "leyendo" || estado === "leido" ? estado : "quiero";
    return agregarLibro(role, t as string, a as string, e, n as string);
  });

export const guardarAprendido = async (titulo: string, donde: string, nota: string) =>
  deCadaUno(async (role) => {
    const t = texto(titulo, MAX_TITULO_ESTANTE);
    const d = opcional(donde, MAX_TITULO_ESTANTE);
    const n = opcional(nota, MAX_NOTA_ESTANTE);
    for (const v of [t, d, n]) if (typeof v !== "string") return v.error;
    return agregarAprendido(role, t as string, d as string, n as string);
  });

export const guardarViaje = async (lugar: string, cuando: string, estado: string, nota: string) =>
  deCadaUno(async (role) => {
    const l = texto(lugar, MAX_TITULO_ESTANTE);
    const c = opcional(cuando, 40);
    const n = opcional(nota, MAX_NOTA_ESTANTE);
    for (const v of [l, c, n]) if (typeof v !== "string") return v.error;
    return agregarViaje(role, l as string, c as string, estado === "fui" ? "fui" : "quiero", n as string);
  });

export const cambiarLibro = async (id: string, estado: string) =>
  deCadaUno((role) => moverLibro(role, id, estado === "leyendo" || estado === "leido" ? estado : "quiero"));

export const cambiarViaje = async (id: string, estado: string) =>
  deCadaUno((role) => moverViaje(role, id, estado === "fui" ? "fui" : "quiero"));

export const soltarDelEstante = async (lista: string, id: string) =>
  deCadaUno((role) => soltarDe(role, lista === "aprendido" ? "aprendido" : lista === "viajes" ? "viajes" : "libros", id));

// «ya se lo regalé»: only on the OTHER one's wishes, and only the giver ever sees it.
export const regaladoDeseo = async (tipo: string, id: string, si: boolean) =>
  deCadaUno((role) => marcarRegalado(role === "jazz" ? "brian" : "jazz", tipo === "viaje" ? "viaje" : "libro", id, si));

// The helpers (block agentes). What they send is read here, on the server, from her own
// stores — never taken from the browser — and only her session may call them.
export async function proponerPasos(metaId: string): Promise<EstadoResult & { pasos: string[] }> {
  if ((await currentRole()) !== "jazz") return { ok: false, error: "Esto es solo de Jazz.", pasos: [] };
  const meta = (await loadPendientes()).metas.find((m) => m.id === metaId);
  if (!meta) return { ok: false, error: "Esa meta ya no está.", pasos: [] };
  const r = await partirEnPasos(meta.titulo, meta.pasos.map((p) => p.texto));
  return r.ok ? { ok: true, error: null, pasos: r.data } : { ok: false, error: r.error, pasos: [] };
}

export const guardarPasos = async (metaId: string, pasos: string[]) =>
  deJazz(async () => {
    const meta = (await loadPendientes()).metas.find((m) => m.id === metaId);
    if (!meta) return "Esa meta ya no está.";
    const limpios = pasos.map((p) => String(p).trim().slice(0, MAX_TEXTO)).filter(Boolean).slice(0, MAX_PASOS - meta.pasos.length);
    for (const p of limpios) {
      const err = await nuevoPaso(metaId, p);
      if (err) return err;
    }
  });

export async function dondeEmpiezo(): Promise<EstadoResult & { empieza: string | null; porque: string | null }> {
  const vacio = { empieza: null, porque: null };
  if ((await currentRole()) !== "jazz") return { ok: false, error: "Esto es solo de Jazz.", ...vacio };
  const [m, p, e] = await Promise.all([loadMisiones(), loadPendientes(), loadEstado().catch(() => null)]);
  const opciones = [
    ...m.abiertas.map((x) => x.texto),
    ...p.metas
      .filter((x) => !terminada(x))
      .map((x) => ({ meta: x.titulo, paso: siguiente(x) }))
      .filter((x) => x.paso && !x.paso.enHoy)
      .map((x) => `${x.paso!.texto} (de tu meta «${x.meta}»)`),
  ];
  const r = await porDondeEmpiezo(opciones, e?.modo ?? null);
  return r.ok ? { ok: true, error: null, ...r.data } : { ok: false, error: r.error, ...vacio };
}

// «Atorada»: the text of that one mission, split into small steps to get it moving — a proposal
// she reads; nothing is saved. Sends only the mission's text, as the sheet says before the tap.
export async function destrabarMision(id: string): Promise<EstadoResult & { pasos: string[] }> {
  if ((await currentRole()) !== "jazz") return { ok: false, error: "Esto es solo de Jazz.", pasos: [] };
  const m = (await loadMisiones()).abiertas.find((x) => x.id === id);
  if (!m) return { ok: false, error: "Esa misión ya no está abierta.", pasos: [] };
  const r = await partirEnPasos(m.texto, []);
  return r.ok ? { ok: true, error: null, pasos: r.data } : { ok: false, error: r.error, pasos: [] };
}

export async function borrarNota(form: FormData) {
  const role = await currentRole();
  if (!role) return;
  const id = String(form.get("id") ?? "");
  if (id) await removeNote(role, id);
  refresh();
}
