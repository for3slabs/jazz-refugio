// Achievements she has EARNED — never the ones still missing: an empty box is a reminder
// of what she has not done, and this place does not keep that kind of count.
const logros = [
  { label: "primera misión", what: "La primera que cumpliste.", earned: (c: Counts) => c.misiones >= 1 },
  { label: "tres en un día", what: "Un día cumpliste tres.", earned: (c: Counts) => c.mejorDia >= 3 },
  { label: "cinco vueltas", what: "Volviste a ti cinco veces.", earned: (c: Counts) => c.vueltas >= 5 },
  { label: "diez flores", what: "Tu jardín llegó a diez.", earned: (c: Counts) => c.vueltas + c.misiones >= 10 },
  { label: "diez misiones", what: "Diez cosas hechas, una por una.", earned: (c: Counts) => c.misiones >= 10 },
];

export type Counts = { vueltas: number; misiones: number; mejorDia: number };

export function Logros({ counts }: { counts: Counts }) {
  const earned = logros.filter((l) => l.earned(counts));
  if (earned.length === 0) return null;
  return (
    <section>
      <h2 className="t-label text-accent">tus logros</h2>
      <ul className="mt-3 grid grid-cols-2 gap-3">
        {earned.map((l, i) => (
          <li
            key={l.label}
            className="rise rounded-2xl border border-line bg-surface p-4"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <p className="font-semibold">{l.label}</p>
            <p className="mt-1 text-pretty text-sm leading-snug text-ink-soft">{l.what}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
