// What «entre los dos» shows — shared by the server (storage) and the screen.

export const MAX_RESPUESTA = 500;

export type Hoy = { pregunta: string; mia: string | null; suya: string | null; otroContesto: boolean };
export type Recuerdo = { dia: string; pregunta: string; jazz: string; brian: string };
export type Vista = { hoy: Hoy; album: Recuerdo[] };
