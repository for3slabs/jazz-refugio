"use client";

import { useOptimistic, useTransition } from "react";
import { regaladoDeseo } from "@/app/actions";
import type { Deseos as D } from "@/lib/estante";

// The other one's wishes — a book to read, a place to go — never their notes. «ya se lo regalé»
// marks one as given; only the one who gives ever sees the mark (the owner's own lists never read
// it), so the surprise holds.
export function Deseos({ deseos, nombre }: { deseos: D; nombre: string }) {
  const [, start] = useTransition();
  const [marcas, marcar] = useOptimistic(
    Object.fromEntries([...deseos.libros, ...deseos.viajes].map((x) => [x.id, x.regalado !== null])) as Record<string, boolean>,
    (m: Record<string, boolean>, a: { id: string; si: boolean }) => ({ ...m, [a.id]: a.si }),
  );
  const toggle = (tipo: "libro" | "viaje", id: string, si: boolean) =>
    start(async () => {
      marcar({ id, si });
      await regaladoDeseo(tipo, id, si);
    });

  const Marca = ({ tipo, id }: { tipo: "libro" | "viaje"; id: string }) =>
    marcas[id] ? (
      <span className="flex shrink-0 items-center gap-2 text-sm">
        <span className="text-accent">✓ regalado</span>
        <button type="button" onClick={() => toggle(tipo, id, false)} className="press t-label px-1 text-ink-soft hover:text-ink">
          deshacer
        </button>
      </span>
    ) : (
      <button
        type="button"
        onClick={() => toggle(tipo, id, true)}
        className="press shrink-0 rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-accent/60"
      >
        ya se lo regalé
      </button>
    );

  return (
    <div className="mt-6 space-y-10">
      <p className="text-pretty text-ink-soft">
        Lo que {nombre} quiere leer y a dónde quiere ir. Sabe que lo ves, para regalarle. «Ya se lo regalé» solo lo ves tú.
      </p>
      <section>
        <h2 className="t-label text-accent">quiere leer</h2>
        {deseos.libros.length ? (
          <ul className="mt-3 divide-y divide-line">
            {deseos.libros.map((l) => (
              <li key={l.id} className={`flex items-center justify-between gap-4 py-3 ${marcas[l.id] ? "opacity-70" : ""}`}>
                <div className="min-w-0">
                  <p className="font-semibold">{l.titulo}</p>
                  {l.autor && <p className="text-sm text-ink-soft">{l.autor}</p>}
                </div>
                <Marca tipo="libro" id={l.id} />
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
              <li key={v.id} className={`flex items-center justify-between gap-4 py-3 ${marcas[v.id] ? "opacity-70" : ""}`}>
                <div className="min-w-0">
                  <p className="font-semibold">{v.lugar}</p>
                  {v.cuando && <p className="text-sm text-ink-soft">{v.cuando}</p>}
                </div>
                <Marca tipo="viaje" id={v.id} />
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
