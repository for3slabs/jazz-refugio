import type { Deseos as D } from "@/lib/estante";

// Brian's view: only what she wishes — a book to read, a place to go — never her notes.
export function Deseos({ deseos }: { deseos: D }) {
  return (
    <div className="mt-6 space-y-10">
      <p className="text-pretty text-ink-soft">Lo que Jazz quiere leer y a dónde quiere ir. Ella sabe que lo ves, para regalarle.</p>
      <section>
        <h2 className="t-label text-accent">quiere leer</h2>
        {deseos.libros.length ? (
          <ul className="mt-3 divide-y divide-line">
            {deseos.libros.map((l) => (
              <li key={l.id} className="py-3">
                <p className="font-semibold">{l.titulo}</p>
                {l.autor && <p className="text-sm text-ink-soft">{l.autor}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-ink-soft">Nada por ahora.</p>
        )}
      </section>
      <section>
        <h2 className="t-label text-accent">quiere ir</h2>
        {deseos.viajes.length ? (
          <ul className="mt-3 divide-y divide-line">
            {deseos.viajes.map((v) => (
              <li key={v.id} className="flex items-baseline justify-between gap-4 py-3">
                <p className="font-semibold">{v.lugar}</p>
                {v.cuando && <p className="text-sm text-ink-soft">{v.cuando}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-ink-soft">Nada por ahora.</p>
        )}
      </section>
    </div>
  );
}
