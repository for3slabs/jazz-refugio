// The modes her mind can be in — what she reads when she picks one, and what Brian
// reads about how to be there for her. Not personal: the same words for anyone.

export const modos = [
  { id: "hiperfoco", ella: "estoy metida en algo", ayuda: "No la interrumpas; escríbele después." },
  { id: "conectada", ella: "con ganas de platicar", ayuda: "Buen momento para escribirle." },
  { id: "mil ideas", ella: "mi mente va rapidísimo", ayuda: "Escúchala, no le pidas orden." },
  { id: "saturada", ella: "demasiado a la vez", ayuda: "Algo corto y cálido, sin pedirle nada." },
  { id: "recargando", ella: "necesito bajar el ritmo", ayuda: "Déjala descansar." },
  { id: "no arranco", ella: "quiero hacer algo y no arranco", ayuda: "Ofrécele empezar juntos algo pequeño." },
] as const;

export type ModoId = (typeof modos)[number]["id"];
export type Estado = { modo: ModoId; at: number };

// A mode fades on its own: yesterday's «saturada» read as today's would be false.
export const EXPIRA_MS = 12 * 60 * 60 * 1000;

export const isModo = (v: unknown): v is ModoId => modos.some((m) => m.id === v);
export const modoOf = (id: ModoId) => modos.find((m) => m.id === id)!;
export const vigente = (e: Estado | null, now = Date.now()): Estado | null =>
  e && now - e.at < EXPIRA_MS ? e : null;
