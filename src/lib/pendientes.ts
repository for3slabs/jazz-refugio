import { get, put } from "@vercel/blob";
import { type Idea, type Meta, type Paso, type Pendientes, MAX_MENTE, MAX_METAS, MAX_PASOS, terminada } from "./pendiente";

// What does not fit in today: her captured thoughts and her goals. Personal, so it lives in
// the private Blob store, synced between her devices; only she reads or writes it.
// Every operation returns an error sentence for her, or nothing when it worked.
const PATH = process.env.VERCEL_ENV === "production" ? "pendientes/pendientes.json" : "pendientes/dev.json";
const EMPTY: Pendientes = { mente: [], metas: [] };

const str = (v: unknown): v is string => typeof v === "string";
const isIdea = (i: Idea) => str(i?.id) && str(i?.texto) && typeof i?.at === "number";
const isPaso = (p: Paso) => str(p?.id) && str(p?.texto) && (p.hecho === null || typeof p.hecho === "number");

function parse(raw: string): Pendientes {
  try {
    const d = JSON.parse(raw);
    return {
      mente: Array.isArray(d?.mente) ? d.mente.filter(isIdea) : [],
      metas: Array.isArray(d?.metas)
        ? d.metas
            .filter((m: Meta) => str(m?.id) && str(m?.titulo) && Array.isArray(m?.pasos))
            .map((m: Meta) => ({
              ...m,
              para: str(m.para) ? m.para : null,
              pasos: m.pasos.filter(isPaso).map((p) => ({ ...p, enHoy: p.enHoy === true })),
            }))
        : [],
    };
  } catch {
    return EMPTY;
  }
}

export async function loadPendientes(): Promise<Pendientes> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return EMPTY;
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res?.stream) return EMPTY;
  return parse(await new Response(res.stream).text());
}

async function save(p: Pendientes) {
  await put(PATH, JSON.stringify(p), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

// Read, change, write — only she writes, so there is no second writer to race.
async function change(fn: (p: Pendientes) => string | void): Promise<string | void> {
  const p = await loadPendientes();
  const err = fn(p);
  if (err) return err;
  await save(p);
}

const activas = (p: Pendientes) => p.metas.filter((m) => !terminada(m)).length;
const meta = (p: Pendientes, id: string) => p.metas.find((m) => m.id === id);
const nuevo = () => crypto.randomUUID();

export const anotarIdea = (texto: string) =>
  change((p) => {
    if (p.mente.length >= MAX_MENTE) return `Ya hay ${MAX_MENTE} cosas en tu mente. Suelta alguna primero.`;
    p.mente.unshift({ id: nuevo(), texto, at: Date.now() });
  });

// Returns the thought it removed, so the caller can turn it into a mission or a goal.
export async function sacarIdea(id: string): Promise<Idea | null> {
  let sacada: Idea | null = null;
  await change((p) => {
    sacada = p.mente.find((i) => i.id === id) ?? null;
    p.mente = p.mente.filter((i) => i.id !== id);
  });
  return sacada;
}

export const nuevaMeta = (titulo: string, para: string | null) =>
  change((p) => {
    if (activas(p) >= MAX_METAS) return `Ya tienes ${MAX_METAS} metas. Termina o suelta una primero.`;
    p.metas.unshift({ id: nuevo(), titulo, para, at: Date.now(), pasos: [] });
  });

export const soltarMeta = (id: string) =>
  change((p) => {
    p.metas = p.metas.filter((m) => m.id !== id);
  });

export const nuevoPaso = (metaId: string, texto: string) =>
  change((p) => {
    const m = meta(p, metaId);
    if (!m) return "Esa meta ya no está.";
    if (m.pasos.length >= MAX_PASOS) return `Una meta tiene hasta ${MAX_PASOS} pasos.`;
    m.pasos.push({ id: nuevo(), texto, hecho: null, enHoy: false });
  });

export const soltarPaso = (metaId: string, pasoId: string) =>
  change((p) => {
    const m = meta(p, metaId);
    if (m) m.pasos = m.pasos.filter((x) => x.id !== pasoId);
  });

// A step's life: waiting → «en hoy» (a mission carries it) → done. Letting the mission go
// brings the step back to waiting; completing it — here or as a mission — marks it done.
export const marcarPaso = (metaId: string, pasoId: string, estado: "hecho" | "enHoy" | "espera") =>
  change((p) => {
    const paso = meta(p, metaId)?.pasos.find((x) => x.id === pasoId);
    if (!paso) return "Ese paso ya no está.";
    paso.hecho = estado === "hecho" ? Date.now() : null;
    paso.enHoy = estado === "enHoy";
  });

export async function pasoDe(metaId: string, pasoId: string): Promise<Paso | null> {
  return meta(await loadPendientes(), metaId)?.pasos.find((x) => x.id === pasoId) ?? null;
}
