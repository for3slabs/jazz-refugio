"use client";

import { useState, useTransition } from "react";
import { recuperarSoltado } from "@/app/actions";
import { Undo } from "@/components/icons";
import type { Soltado } from "@/lib/soltado";

const hace = (en: number) => {
  const d = Math.floor((Date.now() - en) / 86_400_000);
  return d === 0 ? "hoy" : d === 1 ? "ayer" : `hace ${d} días`;
};

const marca: Record<Soltado["tipo"], string> = { mision: "○", idea: "«»", meta: "◇", paso: "·" };

// «lo que soltaste»: closed by default, only when there is something, the last 30 days.
// Recovering puts it back where it was; a full list says so in her words and changes nothing.
// `bare`: no fold of its own — a section inside a fold that already holds it («historial»).
export function LoSoltado({ items, bare = false }: { items: Soltado[]; bare?: boolean }) {
  const [, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [fuera, setFuera] = useState<string[]>([]);
  const visibles = items.filter((s) => !fuera.includes(s.id));
  // the last one recovered still says so — an empty list must not swallow her confirmation
  if (visibles.length === 0)
    return msg ? (
      <p role="status" className="rise mt-12 text-sm text-ink-soft">
        {msg}
      </p>
    ) : null;
  const lista = (
    <>
      {msg && (
        <p role="status" className="mt-3 text-sm text-ink-soft">
          {msg}
        </p>
      )}
      {/* bare: the same light rows as «hoy cumpliste» above it — text, when, and a quiet «recuperar» */}
      <ul className={bare ? "mt-2 space-y-1 border-l border-line pl-4" : "mt-3 space-y-2"}>
        {visibles.map((s) => (
          <li
            key={s.tipo + s.id}
            className={bare ? "flex items-center gap-3" : "flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3"}
          >
            {!bare && (
              <span aria-hidden className="w-5 shrink-0 text-center text-ink-soft">
                {marca[s.tipo]}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className={`block truncate ${bare ? "text-sm" : ""}`}>
                {s.tipo === "meta" ? `meta: ${s.texto}` : s.texto}
              </span>
              <span className={`block truncate text-ink-soft ${bare ? "text-xs" : "text-sm"}`}>
                {hace(s.en)}
                {s.meta && ` · de «${s.meta}»`}
              </span>
            </span>
            <button
              type="button"
              onClick={() =>
                start(async () => {
                  const r = await recuperarSoltado(s.tipo, s.id);
                  if (r.ok) setFuera((f) => [...f, s.id]);
                  setMsg(r.ok ? "listo, volvió a su lugar" : r.error);
                })
              }
              className={
                bare
                  ? "press inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-2 text-xs font-medium text-ink-soft hover:text-ink"
                  : "press inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-accent/60"
              }
            >
              <Undo className={bare ? "size-3.5" : "size-4"} />
              recuperar
            </button>
          </li>
        ))}
      </ul>
    </>
  );
  if (bare)
    return (
      <section className="mt-6">
        <h3 className="text-sm font-semibold">lo que soltaste · {visibles.length}</h3>
        {lista}
      </section>
    );
  return (
    <details className="group mt-12 border-t border-dashed border-line pt-5">
      <summary className="press t-label inline-flex cursor-pointer list-none items-center gap-2 rounded-full px-2 py-1.5 text-ink-soft hover:text-ink">
        <span className="transition-transform group-open:rotate-90">▸</span>
        lo que soltaste ({visibles.length})
      </summary>
      {lista}
    </details>
  );
}
