"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { aquiEstoy, contestarPregunta } from "../actions";
import { Lock } from "@/components/icons";
import { Plegado, caja } from "./plegado";
import { MAX_RESPUESTA, type Vista } from "@/lib/entre";

const day = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "UTC" });
const hour = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "America/Mexico_City" });

// «la pregunta»: the question of the day in one card — the other one's answer opens once you
// answer — and, for Brian, the «aquí estoy» switch. The days both answered fold below.
export function EntreLosDos({ vista, isBrian }: { vista: Vista; isBrian: boolean }) {
  const { hoy, album, hasta } = vista;
  const [mia, setMia] = useOptimistic(hoy.mia);
  const [, start] = useTransition();
  const [texto, setTexto] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const otro = isBrian ? "Jazz" : "Brian";

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(id);
  }, [msg]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    start(async () => {
      setMia(t);
      const r = await contestarPregunta(t);
      if (r.ok) setTexto("");
      else setMsg(r.error);
    });
  }

  function presente(h: number) {
    start(async () => {
      const r = await aquiEstoy(h);
      setMsg(r.ok ? (h ? `listo, Jazz ve que estás presente` : "listo, ya no apareces presente") : r.error);
    });
  }

  return (
    <div className="mt-4">
      {msg && (
        <p role="status" className="mb-3 text-sm text-ink-soft">
          <span key={msg} className="rise inline-block">
            {msg}
          </span>
        </p>
      )}

      {/* the question, the answers and the lock in ONE card — what this part is, at a glance */}
      <section className="overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="p-5">
          <p className="text-sm font-semibold text-accent">hoy</p>
          <h2 className="t-display mt-2 text-pretty text-3xl">{hoy.pregunta}</h2>
        </div>

        {mia ? (
          <div className="rise divide-y divide-dashed divide-line border-t border-line">
            <div className="p-5">
              <p className="text-sm font-semibold text-ink-soft">tú</p>
              <p className="mt-1 whitespace-pre-line text-pretty text-lg leading-relaxed">{mia}</p>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold text-ink-soft">{otro}</p>
              {hoy.suya ? (
                <p className="rise mt-1 whitespace-pre-line text-pretty text-lg leading-relaxed">{hoy.suya}</p>
              ) : (
                <p className="mt-1 text-pretty text-ink-soft">
                  {hoy.otroContesto ? "abriendo…" : `${otro} todavía no contesta. Aparecerá aquí cuando lo haga.`}
                </p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-3 border-t border-line p-5">
            <label htmlFor="respuesta" className="sr-only">
              tu respuesta
            </label>
            <textarea
              id="respuesta"
              rows={3}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={MAX_RESPUESTA}
              placeholder="tu respuesta…"
              className="block w-full resize-y rounded-2xl border border-line bg-canvas px-4 py-3 text-lg leading-relaxed text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-sm text-ink-soft">
                <Lock className="size-3.5 text-accent" />
                {hoy.otroContesto ? `${otro} ya contestó` : `la de ${otro} se abre al contestar`}
              </p>
              <button
                type="submit"
                disabled={!texto.trim()}
                className="press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50"
              >
                contestar
              </button>
            </div>
          </form>
        )}
      </section>

      {isBrian && (
        <section className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-line bg-surface px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">aquí estoy</p>
            <p className="text-pretty text-sm text-ink-soft">
              {hasta ? `Jazz ve que estás presente hasta las ${hour.format(hasta)}` : "que Jazz sepa que puede escribirte ahora"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 4].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => presente(h)}
                className="press rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-sm font-semibold hover:border-accent/60"
              >
                {h} h
              </button>
            ))}
            {hasta && (
              <button type="button" onClick={() => presente(0)} className="press rounded-full px-3 py-1.5 text-sm text-ink-soft hover:text-ink">
                ya no
              </button>
            )}
          </div>
        </section>
      )}

      {album.length > 0 && (
        <Plegado titulo="días anteriores" n={album.length}>
          <ul className={caja}>
            {album.map((r) => (
              <li key={r.dia} className="p-5">
                <p className="text-sm font-semibold text-accent">{day.format(Date.parse(r.dia))}</p>
                <p className="mt-1 font-semibold">{r.pregunta}</p>
                <dl className="mt-3 space-y-2 text-pretty">
                  <div>
                    <dt className="text-sm font-semibold text-ink-soft">Jazz</dt>
                    <dd className="mt-0.5 whitespace-pre-line">{r.jazz}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold text-ink-soft">Brian</dt>
                    <dd className="mt-0.5 whitespace-pre-line">{r.brian}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </Plegado>
      )}
    </div>
  );
}
