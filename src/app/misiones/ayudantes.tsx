"use client";

import { useState, useTransition } from "react";
import { guardarPasos, proponerPasos } from "@/app/actions";
import { Sparkle } from "@/components/icons";
import { MAX_TEXTO } from "@/lib/mision";

// «Pártelo en pasos» for a goal (block agentes); «¿por dónde empiezo?» lives in the assistant
// (asistente.tsx). Each says what it sends before she taps it, and each
// answer is only a proposal: steps are kept only if she ticks them.
const boton =
  "press inline-flex items-center gap-2 rounded-full border border-accent/60 bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50";

export function PartirEnPasos({ metaId }: { metaId: string }) {
  const [pending, start] = useTransition();
  const [pasos, setPasos] = useState<{ texto: string; si: boolean }[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function pedir() {
    setMsg(null);
    start(async () => {
      const r = await proponerPasos(metaId);
      if (r.ok) setPasos(r.pasos.map((texto) => ({ texto, si: true })));
      else setMsg(r.error);
    });
  }

  function guardar() {
    const elegidos = (pasos ?? []).filter((p) => p.si && p.texto.trim()).map((p) => p.texto);
    start(async () => {
      const r = await guardarPasos(metaId, elegidos);
      if (r.ok) setPasos(null);
      setMsg(r.ok ? "listo, ya están en tu meta" : r.error);
    });
  }

  const n = pasos?.filter((p) => p.si && p.texto.trim()).length ?? 0;

  return (
    <div className="mt-5">
      {!pasos ? (
        <>
          <button type="button" onClick={pedir} disabled={pending} className={boton}>
            <Sparkle className="size-4 text-accent" />
            {pending ? "pensando…" : "pártelo en pasos"}
          </button>
          <p className="mt-2 text-xs text-ink-soft">Envía a Claude, la IA de Anthropic: el título de esta meta y sus pasos.</p>
        </>
      ) : (
        <div className="rise rounded-3xl border border-accent/60 bg-surface p-5">
          <p className="t-label inline-flex items-center gap-2 text-accent">
            <Sparkle className="size-3.5" /> te propongo estos pasos
          </p>
          <ul className="mt-3 space-y-2">
            {pasos.map((p, i) => (
              <li key={i} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={p.si}
                  onChange={(e) => setPasos(pasos.map((x, j) => (j === i ? { ...x, si: e.target.checked } : x)))}
                  aria-label={`guardar: ${p.texto}`}
                  className="size-5 shrink-0 accent-[var(--accent)]"
                />
                <input
                  value={p.texto}
                  onChange={(e) => setPasos(pasos.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))}
                  maxLength={MAX_TEXTO}
                  aria-label={`paso ${i + 1}`}
                  className={`min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1.5 hover:border-line focus:border-accent focus:outline-none ${p.si ? "" : "text-ink-soft line-through"}`}
                />
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setPasos(null)} className="press t-label rounded-full px-3 py-2 text-ink-soft hover:text-ink">
              descartar
            </button>
            <button type="button" onClick={guardar} disabled={!n || pending} className="press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50">
              {pending ? "guardando…" : `guardar ${n}`}
            </button>
          </div>
        </div>
      )}
      {msg && <p role="status" className="mt-2 text-sm text-ink-soft">{msg}</p>}
    </div>
  );
}
