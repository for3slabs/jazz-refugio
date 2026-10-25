// What a goal and a captured thought are — shared by the server (storage) and her screen.

export type Idea = { id: string; texto: string; at: number };
export type Paso = { id: string; texto: string; hecho: number | null; enHoy: boolean };
// `descripcion`: optional, one or two lines under the name (0009); null when she wrote none.
export type Meta = { id: string; titulo: string; descripcion: string | null; para: string | null; at: number; pasos: Paso[] };
export const MAX_DESCRIPCION_META = 160;
export type Pendientes = { mente: Idea[]; metas: Meta[] };

export const MAX_METAS = 5;
export const MAX_PASOS = 12;
export const MAX_MENTE = 40;

export const terminada = (m: Meta) => m.pasos.length > 0 && m.pasos.every((p) => p.hecho);
export const siguiente = (m: Meta) => m.pasos.find((p) => !p.hecho) ?? null;

// Dates are her calendar days (YYYY-MM-DD), never instants: «para el jueves» has no hour.
const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" });
const weekday = new Intl.DateTimeFormat("es-MX", { weekday: "long", timeZone: "UTC" });
const short = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "UTC" });

export function diasHasta(para: string, now = Date.now()) {
  return Math.round((Date.parse(para) - Date.parse(day.format(now))) / 86_400_000);
}

// «hoy», «mañana», «el jueves» within a week, «el 12 de noviembre» after. A past date is
// only its date — never «hace 3 días» or «vencida».
export function cuando(para: string, now = Date.now()) {
  const d = diasHasta(para, now);
  if (d === 0) return "hoy";
  if (d === 1) return "mañana";
  if (d > 1 && d < 7) return `el ${weekday.format(Date.parse(para))}`;
  return `el ${short.format(Date.parse(para))}`;
}
