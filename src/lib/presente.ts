import { preguntaDe } from "./content";
import { hayBase, ms, sql } from "./db";
import type { Vista } from "./entre";
import { diaDe } from "./mision";
import type { Role } from "./token";

// «Entre los dos»: the answers to the question of the day and Brian's «aquí estoy». Rows in
// Postgres, never in the repo. The other one's answer leaves the server only after you answered
// yours; one answer per person per day, which the DB enforces. The album is kept forever (Brian,
// ESQUEMA.md element 6).

type Fila = { dia: string; persona: Role; texto: string };

const otro = (role: Role): Role => (role === "jazz" ? "brian" : "jazz");

async function respuestas(): Promise<Fila[]> {
  if (!hayBase()) return [];
  return sql()<Fila[]>`select to_char(dia, 'YYYY-MM-DD') as dia, persona, texto from respuesta order by dia desc`;
}

async function hasta(): Promise<number | null> {
  if (!hayBase()) return null;
  const [p] = await sql()<{ hasta: Date }[]>`select hasta from presencia where persona = 'brian' and hasta > now()`;
  return p ? ms(p.hasta) : null;
}

// What one of them may see: today's question, their own answer, the other's only once
// they answered; the album holds only the days both answered.
export async function vistaDe(role: Role, now = Date.now()): Promise<Vista> {
  const [filas, h] = await Promise.all([respuestas(), hasta()]);
  const dia = diaDe(now);
  const de = (d: string, r: Role) => filas.find((f) => f.dia === d && f.persona === r)?.texto ?? null;
  const mia = de(dia, role);
  const dias = [...new Set(filas.map((f) => f.dia))].filter((d) => d !== dia && de(d, "jazz") && de(d, "brian"));
  return {
    hoy: { pregunta: preguntaDe(dia), mia, suya: mia ? de(dia, otro(role)) : null, otroContesto: !!de(dia, otro(role)) },
    album: dias.map((d) => ({ dia: d, pregunta: preguntaDe(d), jazz: de(d, "jazz")!, brian: de(d, "brian")! })),
    hasta: h && h > now ? h : null,
  };
}

export async function brianPresente(now = Date.now()): Promise<boolean> {
  const h = await hasta();
  return !!h && h > now;
}

export async function contestar(role: Role, texto: string): Promise<string | void> {
  const r = await sql()`
    insert into respuesta (dia, persona, texto) values (${diaDe(Date.now())}, ${role}, ${texto})
    on conflict (dia, persona) do nothing`;
  if (r.count === 0) return "Ya contestaste la de hoy.";
}

export async function marcarPresente(horas: number) {
  await sql()`
    insert into presencia (persona, hasta) values ('brian', now() + make_interval(hours => ${horas}))
    on conflict (persona) do update set hasta = excluded.hasta`;
}
