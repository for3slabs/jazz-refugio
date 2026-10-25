"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { abrirRegalo, usarCupon } from "../actions";
import { Confetti } from "@/components/confetti";
import { Gift } from "@/components/icons";
import { type Abierto, type Envuelto, misionesWord } from "@/lib/regalo";
import { Plegado } from "./plegado";

const when = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "America/Mexico_City" });

// Her gifts: wrapped ones show only how many missions are left — their content is still on
// the server. Opening one asks the server for it and bursts into flowers; the ones already
// opened wait folded under «abiertos · N».
// `de`: who left them — Brian on her screen, Jazz on his.
export function Regalos({ envueltos, abiertos, de = "Brian" }: { envueltos: Envuelto[]; abiertos: Abierto[]; de?: string }) {
  const [list, markUsed] = useOptimistic(abiertos, (l: Abierto[], id: string) =>
    l.map((r) => (r.id === id ? { ...r, usado: Date.now() } : r)),
  );
  const [, start] = useTransition();
  const [opening, setOpening] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Abierto | null>(null);
  const [party, setParty] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(id);
  }, [msg]);

  function open(id: string) {
    setOpening(id);
    start(async () => {
      const r = await abrirRegalo(id);
      setOpening(null);
      if (r.ok && r.regalo) {
        setParty((p) => p + 1);
        setReveal(r.regalo);
      } else setMsg(r.error);
    });
  }

  function use(id: string) {
    start(async () => {
      markUsed(id);
      const r = await usarCupon(id);
      setMsg(r.ok ? `listo, ${de} lo sabrá` : r.error);
    });
  }

  const shown = reveal ? list.find((r) => r.id === reveal.id) ?? reveal : null;

  return (
    <div className="relative">
      {party > 0 && <Confetti key={party} />}
      {/* only when there is something to say — an empty line here pushed the gifts down */}
      {msg && (
        <p role="status" className="mt-3 text-sm text-ink-soft">
          <span key={msg} className="rise inline-block">
            {msg}
          </span>
        </p>
      )}

      {shown && (
        <div className="rise mt-4">
          <p className="text-sm font-semibold text-accent">acabas de abrir</p>
          <div className="mt-3">
            <Card r={shown} onUse={use} de={de} big />
          </div>
        </div>
      )}

      {envueltos.length === 0 && list.length === 0 && !shown && (
        <p className="rise mt-4 text-pretty text-lg leading-relaxed text-ink-soft">
          Cuando {de} te deje un regalo, aparece aquí.
        </p>
      )}

      {/* nothing new, but there are opened ones below: say so, or the title sits over nothing */}
      {envueltos.length === 0 && list.length > 0 && !shown && (
        <p className="rise mt-4 text-pretty text-ink-soft">Nada nuevo por ahora.</p>
      )}

      {envueltos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {envueltos.map((g, i) => {
            const listo = g.faltan === 0;
            return (
              <li key={g.id} className="rise" style={{ animationDelay: `${Math.min(i, 5) * 60}ms` }}>
                <button
                  type="button"
                  disabled={!listo || opening !== null}
                  onClick={() => open(g.id)}
                  className={`press flex h-full w-full flex-col items-center gap-3 rounded-3xl border p-5 text-center ${
                    listo ? "border-accent/60 bg-surface hover:bg-surface-2" : "border-dashed border-line bg-surface/60"
                  }`}
                >
                  <Gift
                    className={`size-12 text-accent ${opening === g.id ? "animate-bounce" : ""} ${listo ? "" : "opacity-50"}`}
                  />
                  <span className="text-pretty font-semibold">un regalo para ti</span>
                  <span className={`text-sm ${listo ? "t-label text-accent" : "text-ink-soft"}`}>
                    {opening === g.id ? "abriendo…" : listo ? "abrir" : `se abre después de ${misionesWord(g.faltan)}`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {list.filter((r) => r.id !== shown?.id).length > 0 && (
        <Plegado titulo="abiertos" n={list.filter((r) => r.id !== shown?.id).length}>
          <ul className="space-y-3">
            {list
              .filter((r) => r.id !== shown?.id)
              .map((r) => (
                <li key={r.id}>
                  <Card r={r} onUse={use} de={de} />
                </li>
              ))}
          </ul>
        </Plegado>
      )}
    </div>
  );
}

function Card({ r, onUse, de, big = false }: { r: Abierto; onUse: (id: string) => void; de: string; big?: boolean }) {
  return (
    <article className={`rounded-3xl border bg-surface p-6 ${big ? "border-accent/60" : "border-line"}`}>
      <p className="t-label text-accent">{r.tipo === "cupon" ? "cupón" : "carta"}</p>
      <h3 className={`mt-2 text-pretty font-semibold leading-snug ${big ? "t-display text-3xl" : "text-xl"}`}>{r.titulo}</h3>
      {r.texto && <p className="mt-3 whitespace-pre-line text-pretty text-lg leading-relaxed text-ink-soft">{r.texto}</p>}
      {r.tipo === "cupon" && (
        <div className="mt-5 flex justify-end">
          {r.usado ? (
            <span className="t-label text-ink-soft">usado el {when.format(r.usado)}</span>
          ) : (
            <button
              type="button"
              onClick={() => onUse(r.id)}
              className="press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink"
            >
              usar cupón <span className="font-normal opacity-80">({de} lo sabrá)</span>
            </button>
          )}
        </div>
      )}
    </article>
  );
}
