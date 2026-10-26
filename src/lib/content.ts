// Content that is not personal and can live in a public repo.

// One line a day, the same all day — picked by the date, so coming back shows the same one.
export const dailyLines = [
  "Tu mente va rápido. Hoy eso es una ventaja.",
  "No tienes que hacerlo todo. Solo lo siguiente.",
  "Volver también cuenta. Cada vez.",
  "Lo que a otros se les escapa, tú lo ves.",
  "Hoy basta con un paso pequeño, bien dado.",
  "Tu curiosidad no es distracción: es búsqueda.",
  "Puedes empezar mal. Empezar es lo que importa.",
  "Tu forma de pensar conecta cosas que nadie más une.",
  "Descansar no es rendirse. Es recargar.",
  "Si hoy cuesta, ve más lento. Sigue siendo avanzar.",
  "Tu intensidad es la misma que hace brillar tu trabajo.",
  "No te perdiste. Solo diste una vuelta.",
  "Una cosa a la vez. Tienes tiempo.",
  "Tu ojo para el detalle es un regalo. Úsalo hoy.",
];

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0).getTime();
  return Math.floor((date.getTime() - start) / 86_400_000);
}

export function lineOfTheDay(date = new Date()): string {
  return dailyLines[dayOfYear(date) % dailyLines.length];
}

export type Power = { name: string; what: string; today: string };

export const powers: Power[] = [
  {
    name: "hiperfoco",
    what: "Cuando algo te atrapa, entras más hondo que casi nadie. Por eso tus diseños tienen detalles que otros no ven.",
    today: "Elige UNA cosa y dale 25 minutos sin culpa.",
  },
  {
    name: "ojo para el detalle",
    what: "Ves el pixel que sobra, el tono que no encaja, la palabra que suena rara. Eso no es exigencia: es talento.",
    today: "Revisa una sola pantalla con calma y arregla lo que tu ojo encuentre.",
  },
  {
    name: "ideas que conectan",
    what: "Tu mente salta entre cosas que parecen lejanas y las une. De ahí salen las ideas que nadie esperaba.",
    today: "Anota tres ideas sueltas. No las juzgues todavía.",
  },
  {
    name: "curiosidad",
    what: "Quieres saber cómo funciona todo. Esa curiosidad es la que te hace aprender más rápido que los demás.",
    today: "Dale 10 minutos a eso que te llamó la atención. Luego vuelves.",
  },
  {
    name: "intensidad",
    what: "Sientes y vives las cosas fuerte. Esa misma energía es la que pones en lo que amas hacer.",
    today: "Pon esa energía en algo que te guste, aunque sea pequeño.",
  },
];

// One strength a day for the home tile — the same all day, a different one tomorrow.
export function powerOfTheDay(date = new Date()): Power {
  return powers[dayOfYear(date) % powers.length];
}
