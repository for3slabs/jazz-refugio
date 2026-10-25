import { get, put } from "@vercel/blob";
import { type Hecha, type Mision, type Misiones, MAX_ABIERTAS, diaDe } from "./mision";

// Her missions are personal, so they live in the private Blob store, never in the repo.
// Synced on purpose: what she writes on the PC is there on her phone. Only she reads or
// writes them — Brian has no screen for them. No deadlines and nothing «overdue»: an open
// mission just waits. Each completed one is a flower; `total` only grows, like the garden.
const PATH = process.env.VERCEL_ENV === "production" ? "misiones/misiones.json" : "misiones/dev.json";
const EMPTY: Misiones = { abiertas: [], hechas: [], total: 0, mejorDia: 0 };

const isMision = (m: unknown): m is Mision =>
  typeof (m as Mision)?.id === "string" && typeof (m as Mision)?.texto === "string" && typeof (m as Mision)?.at === "number";

function parse(raw: string): Misiones {
  try {
    const d = JSON.parse(raw);
    return {
      abiertas: Array.isArray(d?.abiertas) ? d.abiertas.filter(isMision).slice(0, MAX_ABIERTAS) : [],
      // (`origen`, when present, travels with the mission untouched)
      hechas: Array.isArray(d?.hechas) ? d.hechas.filter((h: Hecha) => isMision(h) && typeof h.hecha === "number") : [],
      total: Number.isInteger(d?.total) ? d.total : 0,
      mejorDia: Number.isInteger(d?.mejorDia) ? d.mejorDia : 0,
    };
  } catch (cause) {
    throw new Error(`${PATH} is unreadable: refusing to treat it as empty`, { cause });
  }
}

export async function loadMisiones(): Promise<Misiones> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return EMPTY;
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res?.stream) return EMPTY;
  return parse(await new Response(res.stream).text());
}

async function save(m: Misiones) {
  await put(PATH, JSON.stringify(m), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

// What she completed on her today — the reward list of the board.
export const deHoy = (hechas: Hecha[], now = Date.now()) => hechas.filter((h) => diaDe(h.hecha) === diaDe(now));

// Each change re-reads and rewrites the whole file: only she writes it.
export async function agregar(texto: string, origen?: Mision["origen"]) {
  const m = await loadMisiones();
  if (m.abiertas.length >= MAX_ABIERTAS) return false;
  m.abiertas.push({ id: crypto.randomUUID(), texto, at: Date.now(), ...(origen && { origen }) });
  await save(m);
  return true;
}

// One more flower: into «hechas hoy», `total` and the best day.
function anotar(m: Misiones, mision: Mision, now: number) {
  const hoy = diaDe(now);
  // Only today's and yesterday's are kept: «hechas hoy» needs nothing older, and `total`
  // already remembers every one of them.
  m.hechas = [{ ...mision, hecha: now }, ...m.hechas].filter((h) => now - h.hecha < 2 * 86_400_000);
  m.total += 1;
  m.mejorDia = Math.max(m.mejorDia, m.hechas.filter((h) => diaDe(h.hecha) === hoy).length);
}

// Returns the mission it completed, so the caller can mark the goal step it came from.
export async function cumplir(id: string): Promise<Mision | null> {
  const m = await loadMisiones();
  const mision = m.abiertas.find((x) => x.id === id);
  if (!mision) return null;
  m.abiertas = m.abiertas.filter((x) => x.id !== id);
  anotar(m, mision, Date.now());
  await save(m);
  return mision;
}

// A goal step done right there, without passing through «hoy»: still a flower.
export async function florDePaso(texto: string) {
  const m = await loadMisiones();
  anotar(m, { id: crypto.randomUUID(), texto, at: Date.now() }, Date.now());
  await save(m);
}

export async function soltar(id: string): Promise<Mision | null> {
  const m = await loadMisiones();
  const mision = m.abiertas.find((x) => x.id === id) ?? null;
  m.abiertas = m.abiertas.filter((x) => x.id !== id);
  await save(m);
  return mision;
}
