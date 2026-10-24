// What a gift is — shared by the server (storage) and the two screens.

export type Tipo = "cupon" | "carta";
// `desde`: her mission total at which it can be opened (0 = right away).
export type Regalo = {
  id: string;
  tipo: Tipo;
  titulo: string;
  texto: string;
  at: number;
  desde: number;
  abierto: number | null;
  usado: number | null;
};

// Her screen gets wrapped gifts WITHOUT their content — only how many missions are left.
export type Envuelto = { id: string; faltan: number };
export type Abierto = Pick<Regalo, "id" | "tipo" | "titulo" | "texto" | "abierto" | "usado">;

export const MAX_TITULO = 60;
export const MAX_REGALO = 600;
export const MAX_TRAS = 10;

export const misionesWord = (n: number) => (n === 1 ? "1 misión" : `${n} misiones`);
