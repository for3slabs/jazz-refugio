"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { aquiEstoy, contestarPregunta } from "../actions";
import { Lock } from "@/components/icons";
import { MAX_RESPUESTA, type Vista } from "@/lib/entre";

const day = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "UTC" });
const hour = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "America/Mexico_City" });

// «entre los dos»: the question of the day, then two halves facing each other — yours to write,
// theirs sealed with a lock until you answer (Brian, 2026-10-25: it felt like «notas»; here both
// answer the SAME thing) — and, for Brian, the «aquí estoy» switch. The days both answered are dots.
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
      {msg && (
        <p role="status" className="mb-3 text-sm text-ink-soft">
          <span key={msg} className="rise inline-block">
            {msg}
          </span>
        </p>
      )}

      {/* the question alone, big — Brian loved it as it was */}
      <p className="text-sm font-semibold text-accent">la pregunta de hoy</p>
      <h2 className="t-display mt-2 text-pretty text-3xl">{hoy.pregunta}</h2>

      {/* two halves facing each other: yours and theirs, theirs sealed until you answer */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <section className="flex flex-col rounded-2xl border border-accent/50 bg-surface p-4">
          <p className="text-sm font-semibold text-accent">tú</p>
          {mia ? (
            <p className="rise mt-2 whitespace-pre-line text-pretty leading-relaxed">{mia}</p>
          ) : (
            <form onSubmit={send} className="mt-2 flex flex-1 flex-col gap-3">
              <label htmlFor="respuesta" className="sr-only">
                tu respuesta
              </label>
              <textarea
                id="respuesta"
                rows={5}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={MAX_RESPUESTA}
                placeholder="tu respuesta…"
                className="block w-full flex-1 resize-none rounded-xl border border-line bg-canvas px-3 py-2 leading-relaxed text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={!texto.trim()}
                className="press rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50"
              >
                contestar
              </button>
            </form>
          )}
        </section>

        <section
          className={`flex flex-col rounded-2xl border p-4 ${
            mia && hoy.suya ? "border-accent/50 bg-surface" : "border-dashed border-line bg-surface/60"
          }`}
        >
          <p className="text-sm font-semibold text-ink-soft">{otro}</p>
          {mia && hoy.suya ? (
            <p className="rise mt-2 whitespace-pre-line text-pretty leading-relaxed">{hoy.suya}</p>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
              <Lock className="size-7 text-accent" />
              <p className="text-pretty text-sm font-semibold">{hoy.otroContesto ? "ya contestó" : "todavía no contesta"}</p>
              <p className="text-pretty text-xs text-ink-soft">
                {mia ? (hoy.otroContesto ? "abriendo…" : "aparece aquí cuando lo haga") : "se abre cuando contestes"}
              </p>
            </div>
          )}
        </section>
      </div>

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

      {album.length > 0 && <Dias album={album} />}
    </div>
  );
}

// «días que contestaron los dos»: one dot per day, newest last, so the row reads like a calendar;
// tapping a dot shows that day's question with both answers under it.
function Dias({ album }: { album: Vista["album"] }) {
  const orden = [...album].sort((a, b) => a.dia.localeCompare(b.dia));
  const [visto, setVisto] = useState<string | null>(null);
  const r = orden.find((x) => x.dia === visto) ?? null;
  return (
    <section className="mt-10">
      <h3 className="font-semibold">días que contestaron los dos</h3>
      <p className="mt-0.5 text-sm text-ink-soft">toca uno para leerlo</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {orden.map((x) => (
          <li key={x.dia}>
            <button
              type="button"
              aria-pressed={visto === x.dia}
              aria-label={day.format(Date.parse(x.dia))}
              onClick={() => setVisto(visto === x.dia ? null : x.dia)}
              className={`press grid size-10 place-items-center rounded-full border text-xs font-semibold tabular-nums ${
                visto === x.dia ? "border-accent bg-accent text-accent-ink" : "border-accent/50 bg-accent-soft text-ink hover:border-accent"
              }`}
            >
              {new Date(Date.parse(x.dia)).getUTCDate()}
            </button>
          </li>
        ))}
      </ul>
      {r && (
        <div className="rise mt-4 rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm font-semibold text-accent">{day.format(Date.parse(r.dia))}</p>
          <p className="mt-1 font-semibold">{r.pregunta}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-pretty">
            <div>
              <p className="text-sm font-semibold text-ink-soft">Jazz</p>
              <p className="mt-0.5 whitespace-pre-line">{r.jazz}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-soft">Brian</p>
              <p className="mt-0.5 whitespace-pre-line">{r.brian}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
