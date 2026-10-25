// What a mission is — shared by the server (storage) and her screen (the board).

// `origen`: the goal step this mission came from (block pendientes), if any.
// `estado`: how it is going, marked by her — none is just waiting. `empezada`: the first time she
// marked it «haciendo», so the history can say how long it took.
export type EstadoMision = "haciendo" | "atorada";
export const ESTADOS_MISION: EstadoMision[] = ["haciendo", "atorada"];
export type Mision = {
  id: string;
  texto: string;
  at: number;
  origen?: { meta: string; paso: string };
  estado?: EstadoMision;
  empezada?: number;
};
export type Hecha = Mision & { hecha: number };
// `vueltas`: her «volver» flowers — the garden is `total` + `vueltas`.
export type Misiones = { abiertas: Mision[]; hechas: Hecha[]; total: number; mejorDia: number; vueltas: number };

export const MAX_ABIERTAS = 3;
export const MAX_TEXTO = 80;

// Her day, not the server's: «hechas hoy» empties at midnight in her time zone.
const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" });
export const diaDe = (at: number) => day.format(at);
