import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { frase, sql } from "./db";

// Her two helpers. They run only when she taps them, see only what that button says it sends,
// and answer with a proposal — nothing is kept unless she accepts it. The model call lives here
// alone, so moving to For3s OS later (block agentes, D-2) touches this file and nothing else.
const MODEL = "claude-haiku-5-5"; // Brian's choice: small and cheap (block agentes, D-3)

const SYSTEM = `Ayudas a una diseñadora gráfica creativa, curiosa y de mente rápida a organizar su día.
Hablas en español de México, cálido y breve, como una amiga que la admira.
Partes siempre de sus fortalezas: hiperfoco, ojo para el detalle, ideas que conectan.
Nunca suenas clínica, correctiva ni condescendiente, y nunca mencionas diagnósticos ni etiquetas.
Lo pequeño y concreto es mejor que lo grande y vago: cada paso empieza con un verbo y cabe en una línea.`;

export type Resultado<T> = { ok: true; data: T } | { ok: false; error: string };

const NO_LISTO = "Los ayudantes todavía no están listos. Avísale a Brian.";

// The daily count — the only thing this block stores: one row per use, never what she asked.
// Counted before the call, and the DB caps it at 20 a day under a lock, so a burst of taps
// cannot slip past.
async function contar(): Promise<boolean> {
  try {
    await sql()`insert into uso_ayudante (persona) values ('jazz')`;
    return true;
  } catch (e) {
    if (frase(e)) return false;
    throw e;
  }
}

async function pedir<S extends z.ZodType>(esquema: S, prompt: string): Promise<Resultado<z.infer<S>>> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, error: NO_LISTO };
  if (!(await contar())) return { ok: false, error: "Por hoy ya pediste bastante ayuda. Mañana seguimos." };
  try {
    const client = new Anthropic();
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM,
      output_config: { effort: "low", format: zodOutputFormat(esquema) },
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal") return { ok: false, error: "Esta vez no pude ayudarte con eso." };
    if (!response.parsed_output) return { ok: false, error: "No me salió bien la respuesta. Inténtalo otra vez." };
    return { ok: true, data: response.parsed_output };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return { ok: false, error: NO_LISTO };
    if (error instanceof Anthropic.RateLimitError) return { ok: false, error: "Estoy un poco saturado. Inténtalo en un momento." };
    return { ok: false, error: "No pude conectarme. Inténtalo en un momento." };
  }
}

const Pasos = z.object({ pasos: z.array(z.string()).describe("de 3 a 6 pasos pequeños, en orden") });

// «Pártelo en pasos»: the goal's title and the steps it already has — nothing else.
export async function partirEnPasos(meta: string, existentes: string[]) {
  const ya = existentes.length ? `\nYa tiene estos pasos (no los repitas):\n${existentes.map((p) => `- ${p}`).join("\n")}` : "";
  const r = await pedir(
    Pasos,
    `Su meta: «${meta}».${ya}\nPropón de 3 a 6 pasos pequeños y concretos que la acerquen, en orden. Cada uno de menos de 80 caracteres.`,
  );
  if (!r.ok) return r;
  const pasos = r.data.pasos.map((p) => p.trim().slice(0, 80)).filter(Boolean).slice(0, 6);
  return pasos.length ? ({ ok: true, data: pasos } as const) : ({ ok: false, error: "No se me ocurrieron pasos esta vez." } as const);
}

const Inicio = z.object({
  opcion: z.number().int().describe("el número de la opción elegida, tal como aparece en la lista"),
  porque: z.string().describe("una sola frase cálida de por qué empezar por ahí"),
});

// «¿Por dónde empiezo?»: her open missions, the next step of each goal and her mode. The answer
// is the NUMBER of one of her own options, so it can only point at something she already has.
export async function porDondeEmpiezo(opciones: string[], modo: string | null) {
  if (!opciones.length) return { ok: false, error: "No hay nada abierto todavía. Agrega una misión primero." } as const;
  const lista = opciones.map((o, i) => `${i + 1}. ${o}`).join("\n");
  const estado = modo ? `Ahora mismo su mente está en modo «${modo}».` : "No marcó cómo está su mente.";
  const r = await pedir(
    Inicio,
    `${estado}\nSus opciones:\n${lista}\nElige UNA para empezar. Si está saturada o recargando, elige la más pequeña. Si está en hiperfoco, la que más la atrape.`,
  );
  if (!r.ok) return r;
  const i = r.data.opcion - 1;
  if (!Number.isInteger(i) || i < 0 || i >= opciones.length) return { ok: false, error: "No me salió bien la respuesta. Inténtalo otra vez." } as const;
  return { ok: true, data: { empieza: opciones[i], porque: r.data.porque.trim().slice(0, 240) } } as const;
}
