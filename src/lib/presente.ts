import { get, put } from "@vercel/blob";
import { preguntaDe } from "./content";
import type { Vista } from "./entre";
import { diaDe } from "./mision";
import type { Role } from "./token";

// «Entre los dos»: the answers to the question of the day and Brian's «aquí estoy».
// Personal, so they live in the private Blob store, never in the repo. The other one's
// answer leaves the server only after you answered yours, and an answer is final once sent.
const PATH = process.env.VERCEL_ENV === "production" ? "presente/presente.json" : "presente/dev.json";
const DIAS = 60;

type Respuesta = { texto: string; at: number };
type Dia = Partial<Record<Role, Respuesta>>;
type Presente = { hasta: number | null; respuestas: Record<string, Dia> };

const isResp = (r: unknown): r is Respuesta =>
  typeof (r as Respuesta)?.texto === "string" && typeof (r as Respuesta)?.at === "number";

function parse(raw: string): Presente {
  try {
    const d = JSON.parse(raw);
    const respuestas: Record<string, Dia> = {};
    for (const [dia, v] of Object.entries(d?.respuestas ?? {})) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) continue;
      const r = v as Dia;
      respuestas[dia] = { ...(isResp(r.jazz) && { jazz: r.jazz }), ...(isResp(r.brian) && { brian: r.brian }) };
    }
    return { hasta: typeof d?.hasta === "number" ? d.hasta : null, respuestas };
  } catch (cause) {
    throw new Error(`${PATH} is unreadable: refusing to treat it as empty`, { cause });
  }
}

async function load(): Promise<Presente> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { hasta: null, respuestas: {} };
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res?.stream) return { hasta: null, respuestas: {} };
  return parse(await new Response(res.stream).text());
}

async function save(p: Presente) {
  await put(PATH, JSON.stringify(p), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

const otro = (role: Role): Role => (role === "jazz" ? "brian" : "jazz");

// What one of them may see: today's question, their own answer, the other's only once
// they answered; the album holds only the days both answered.
export async function vistaDe(role: Role, now = Date.now()): Promise<Vista> {
  const p = await load();
  const dia = diaDe(now);
  const r = p.respuestas[dia] ?? {};
  const mia = r[role]?.texto ?? null;
  const album = Object.entries(p.respuestas)
    .filter(([d, v]) => d !== dia && v.jazz && v.brian)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([d, v]) => ({ dia: d, pregunta: preguntaDe(d), jazz: v.jazz!.texto, brian: v.brian!.texto }));
  return {
    hoy: { pregunta: preguntaDe(dia), mia, suya: mia ? r[otro(role)]?.texto ?? null : null, otroContesto: !!r[otro(role)] },
    album,
    hasta: p.hasta && p.hasta > now ? p.hasta : null,
  };
}

export async function brianPresente(now = Date.now()): Promise<boolean> {
  const { hasta } = await load();
  return !!hasta && hasta > now;
}

export async function contestar(role: Role, texto: string): Promise<string | void> {
  const p = await load();
  const now = Date.now();
  const dia = diaDe(now);
  const r = (p.respuestas[dia] ??= {});
  if (r[role]) return "Ya contestaste la de hoy.";
  r[role] = { texto, at: now };
  // keep the last 60 days: an album, not an archive
  const keep = Object.keys(p.respuestas).sort().slice(-DIAS);
  p.respuestas = Object.fromEntries(keep.map((d) => [d, p.respuestas[d]]));
  await save(p);
}

export async function marcarPresente(horas: number) {
  const p = await load();
  p.hasta = horas > 0 ? Date.now() + horas * 3_600_000 : null;
  await save(p);
}
