// What a mission is — shared by the server (storage) and her screen (the board).

export type Mision = { id: string; texto: string; at: number };
export type Hecha = Mision & { hecha: number };
export type Misiones = { abiertas: Mision[]; hechas: Hecha[]; total: number; mejorDia: number };

export const MAX_ABIERTAS = 3;
export const MAX_TEXTO = 80;

// Her day, not the server's: «hechas hoy» empties at midnight in her time zone.
const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" });
export const diaDe = (at: number) => day.format(at);
