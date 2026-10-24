"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { aquiEstoy, contestarPregunta } from "../actions";
import { Sparkle } from "@/components/icons";
import { MAX_RESPUESTA, type Vista } from "@/lib/entre";

const day = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "UTC" });
const hour = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "America/Mexico_City" });

// «Entre los dos»: the question of the day — the other one's answer opens once you answer —
// and, for Brian, the «aquí estoy» switch. An album of the days both answered.
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
    <div className="mt-6">
      <p role="status" className="min-h-6 text-sm text-ink-soft">
        {msg && (
          <span key={msg} className="rise inline-block">
            {msg}
          </span>
        )}
      </p>

      {isBrian && (
        <section className="mb-8 rounded-3xl border border-line bg-surface p-5">
          <p className="t-label text-accent">aquí estoy</p>
          <p className="mt-2 text-pretty text-ink-soft">
            {hasta ? `Jazz ve que estás presente hasta las ${hour.format(hasta)}` : "Que Jazz sepa que puede escribirte ahora."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 2, 4].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => presente(h)}
                className="press rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold hover:border-accent/60"
              >
                {h} h
              </button>
            ))}
            {hasta && (
              <button type="button" onClick={() => presente(0)} className="press t-label rounded-full px-3 py-2 text-ink-soft hover:text-ink">
                ya no
              </button>
            )}
          </div>
        </section>
      )}

      <section>
        <p className="t-label text-accent">la pregunta de hoy</p>
        <h2 className="t-display mt-3 text-pretty text-3xl">{hoy.pregunta}</h2>

        {mia ? (
          <div className="rise mt-6 overflow-hidden rounded-3xl border border-line bg-surface">
            <div className="p-5">
              <p className="t-label text-ink-soft">tú</p>
              <p className="mt-2 whitespace-pre-line text-pretty text-lg leading-relaxed">{mia}</p>
            </div>
            <div className="border-t border-dashed border-line p-5">
              <p className="t-label text-ink-soft">{otro}</p>
              {hoy.suya ? (
                <p className="rise mt-2 whitespace-pre-line text-pretty text-lg leading-relaxed">{hoy.suya}</p>
              ) : (
                <p className="mt-2 text-pretty text-ink-soft">
                  {hoy.otroContesto ? "abriendo…" : `${otro} todavía no contesta. Aparecerá aquí cuando lo haga.`}
                </p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={send} className="mt-6 space-y-3">
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
              className="block w-full resize-y rounded-2xl border border-line bg-surface px-4 py-3 text-lg leading-relaxed text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-sm text-ink-soft">
                {hoy.otroContesto ? `${otro} ya contestó. ` : ""}La de {otro} se abre cuando contestes.
                <Sparkle className="size-3.5 text-accent" />
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

      {album.length > 0 && (
        <section className="mt-12 border-t border-dashed border-line pt-6">
          <h2 className="t-label text-ink-soft">días anteriores</h2>
          <ul className="mt-4 space-y-4">
            {album.map((r) => (
              <li key={r.dia} className="rounded-3xl border border-line bg-surface p-5">
                <p className="t-label text-accent">{day.format(Date.parse(r.dia))}</p>
                <p className="mt-2 font-semibold">{r.pregunta}</p>
                <dl className="mt-3 space-y-2 text-pretty">
                  <div>
                    <dt className="t-label text-ink-soft">Jazz</dt>
                    <dd className="mt-0.5 whitespace-pre-line">{r.jazz}</dd>
                  </div>
                  <div>
                    <dt className="t-label text-ink-soft">Brian</dt>
                    <dd className="mt-0.5 whitespace-pre-line">{r.brian}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
