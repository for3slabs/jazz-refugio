"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { deseoRegalado } from "@/app/actions";
import type { Deseo } from "@/lib/deseo";
import { Nuevo } from "./recamara";

// Brian's side of her book of wishes: hers, with «ya se lo regalé» (a mark only he sees), and the
// ones he sent her, and the form that sends the next dove.
export function SuLibro({ libro }: { libro: Deseo[] }) {
  const titulo = useId();
  const [, start] = useTransition();
  const [pending, startForm] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const suyos = libro.filter((d) => d.de === "jazz");
  const mios = libro.filter((d) => d.de === "brian");
  const [marcas, marcar] = useOptimistic(
    Object.fromEntries(suyos.map((d) => [d.id, d.regalado !== null])) as Record<string, boolean>,
    (m: Record<string, boolean>, a: { id: string; si: boolean }) => ({ ...m, [a.id]: a.si }),
  );
  const toggle = (id: string, si: boolean) =>
    start(async () => {
      marcar({ id, si });
      await deseoRegalado(id, si);
    });
  const run = (op: () => Promise<{ ok: boolean; error: string | null }>) =>
    startForm(async () => {
      const r = await op();
      setMsg(r.ok ? "listo. la paloma va en camino a su balcón." : r.error);
    });

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h2 className="text-lg font-semibold">su libro de deseos</h2>
        <p className="mt-0.5 text-sm text-ink-soft">lo que Jazz desea · «ya se lo regalé» solo lo ves tú</p>
        {suyos.length === 0 ? (
          <p className="mt-3 text-ink-soft">Todavía no apunta ninguno.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {suyos.map((d) => (
              <li key={d.id} className={`flex items-start justify-between gap-4 py-3 ${marcas[d.id] ? "opacity-70" : ""}`}>
                <div className="min-w-0">
                  <p className="font-semibold">{d.titulo}</p>
                  {d.descripcion && <p className="mt-0.5 text-pretty text-sm text-ink-soft">{d.descripcion}</p>}
                  {d.enlace && (
                    <a href={d.enlace} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent underline underline-offset-4">
                      {new URL(d.enlace).hostname.replace(/^www\./, "")}
                    </a>
                  )}
                </div>
                {marcas[d.id] ? (
                  <span className="flex shrink-0 items-center gap-2 text-sm">
                    <span className="text-accent">✓ regalado</span>
                    <button type="button" onClick={() => toggle(d.id, false)} className="press px-1 text-xs text-ink-soft hover:text-ink">
                      deshacer
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => toggle(d.id, true)} className="press shrink-0 rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-accent/60">
                    ya se lo regalé
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-line bg-surface p-5">
        <Nuevo titulo={titulo} pending={pending} run={run} paraJazz />
        {msg && (
          <p role="status" className="mt-3 text-sm text-ink-soft">
            {msg}
          </p>
        )}
        {mios.length > 0 && (
          <ul className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
            {mios.map((d) => (
              <li key={d.id} className="truncate">
                {d.titulo}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
