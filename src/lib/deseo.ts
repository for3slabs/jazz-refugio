import type { Role } from "./token";

// A wish's shape and limits — shared by the server and her screen (no database here).
export const MAX_DESEO = 80;
export const MAX_DESCRIPCION_DESEO = 500;

// A wish in her book (0015): hers, or one Brian sent her. `visto`: when she opened one Brian sent
// (until then a dove waits on her balcony). `regalado`: Brian's «ya se lo regalé» — only on his
// screen; hers never reads it, so the surprise holds.
export type Deseo = {
  id: string;
  de: Role;
  titulo: string;
  descripcion: string;
  enlace: string;
  at: number;
  visto: number | null;
  regalado: number | null;
};

