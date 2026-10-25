"use client";

import { useCallback, useEffect, useOptimistic, useState, useTransition } from "react";
import { abrirRegalo, usarCupon } from "../actions";
import { Confetti } from "@/components/confetti";
import { Gift, Plus } from "@/components/icons";
import type { Regalado } from "@/lib/objeto";
import { type Abierto, type Envuelto, type Regalo, misionesWord } from "@/lib/regalo";
import { LosQueDiste, RegaloNuevo } from "./regalo-form";

const when = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "America/Mexico_City" });

// «regalos» as cards, the way inspiración shows its boards: the first card makes one («＋ envolver
// uno», like «＋ nuevo tablero»), then the wrapped ones — their content is still on the server, they
// only say how many missions are left — then the opened ones, each a small card. Opening asks the
// server and bursts into flowers; an opened card shows big on top when tapped. What you gave folds
// under «los que diste».
// `de`: who left them — Brian on her screen, Jazz on his.
export function Regalos({
  envueltos,
  abiertos,
  de = "Brian",
  dados,
  total,
  regalados = null,
}: {
  envueltos: Envuelto[];
  abiertos: Abierto[];
  de?: string;
  dados: Regalo[];
  total: number;
  regalados?: Regalado[] | null;
}) {
  const [list, markUsed] = useOptimistic(abiertos, (l: Abierto[], id: string) =>
    l.map((r) => (r.id === id ? { ...r, usado: Date.now() } : r)),
  );
  const [, start] = useTransition();
  const [opening, setOpening] = useState<string | null>(null);
  const [grande, setGrande] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [party, setParty] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [recien, setRecien] = useState<Abierto | null>(null);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(id);
  }, [msg]);

  const cerrar = useCallback((aviso: string | null) => {
    setNuevo(false);
    if (aviso) setMsg(aviso);
  }, []);

  function open(id: string) {
    setOpening(id);
    start(async () => {
      const r = await abrirRegalo(id);
      setOpening(null);
      if (r.ok && r.regalo) {
        setParty((p) => p + 1);
        setRecien(r.regalo);
        setGrande(r.regalo.id);
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

  // the one just opened is not in the list until the server refreshes it
  const todos = recien && !list.some((r) => r.id === recien.id) ? [recien, ...list] : list;
  const shown = grande ? todos.find((r) => r.id === grande) ?? null : null;

  return (
    <div className="relative">
      {party > 0 && <Confetti key={party} />}

      {msg && (
        <p role="status" className="mt-3 text-sm text-ink-soft">
          <span key={msg} className="rise inline-block">
            {msg}
          </span>
        </p>
      )}

      {nuevo && <RegaloNuevo para={de} regalados={regalados} onClose={cerrar} />}

      {shown && (
        <div className="rise mt-4">
          <Card r={shown} onUse={use} de={de} big onClose={() => setGrande(null)} />
        </div>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {!nuevo && (
          <li>
            <button
              type="button"
              onClick={() => setNuevo(true)}
              className="press flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-ink-soft hover:border-accent/60 hover:text-ink"
            >
              <Plus className="size-7 text-accent" />
              <span className="text-sm font-medium">envolver uno</span>
            </button>
          </li>
        )}

        {envueltos.map((g, i) => {
          const listo = g.faltan === 0;
          return (
            <li key={g.id} className="rise" style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}>
              <button
                type="button"
                disabled={!listo || opening !== null}
                onClick={() => open(g.id)}
                className={`press flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center ${
                  listo ? "border-accent/60 bg-surface hover:bg-surface-2" : "border-line bg-surface/60"
                }`}
              >
                <Gift className={`size-11 text-accent ${opening === g.id ? "animate-bounce" : ""} ${listo ? "" : "opacity-50"}`} />
                <span className="text-pretty text-sm font-semibold">de {de}</span>
                <span className={`text-sm ${listo ? "font-semibold text-accent" : "text-ink-soft"}`}>
                  {opening === g.id ? "abriendo…" : listo ? "abrir" : `se abre en ${misionesWord(g.faltan)}`}
                </span>
              </button>
            </li>
          );
        })}

        {todos
          .filter((r) => r.id !== shown?.id)
          .map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setGrande(r.id)}
                className="press flex h-full min-h-44 w-full flex-col rounded-2xl border border-line bg-surface p-4 text-left hover:border-accent/60"
              >
                <span className="text-xs font-semibold text-accent">{r.tipo === "cupon" ? "cupón" : "carta"}</span>
                <span className="mt-1.5 line-clamp-3 text-pretty font-semibold leading-snug">{r.titulo}</span>
                <span className="mt-auto pt-3 text-xs text-ink-soft">
                  {r.tipo === "cupon" ? (r.usado ? `usado el ${when.format(r.usado)}` : "sin usar · tócalo") : "léela"}
                </span>
              </button>
            </li>
          ))}
      </ul>

      <LosQueDiste regalos={dados} total={total} />
    </div>
  );
}

function Card({
  r,
  onUse,
  de,
  big = false,
  onClose,
}: {
  r: Abierto;
  onUse: (id: string) => void;
  de: string;
  big?: boolean;
  onClose?: () => void;
}) {
  return (
    <article className={`rounded-3xl border bg-surface p-6 ${big ? "border-accent/60" : "border-line"}`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-accent">{r.tipo === "cupon" ? "cupón" : "carta"} de {de}</p>
        {onClose && (
          <button type="button" onClick={onClose} className="press text-sm font-medium text-ink-soft hover:text-ink">
            cerrar
          </button>
        )}
      </div>
      <h3 className={`mt-2 text-pretty font-semibold leading-snug ${big ? "t-display text-3xl" : "text-xl"}`}>{r.titulo}</h3>
      {r.texto && <p className="mt-3 whitespace-pre-line text-pretty text-lg leading-relaxed text-ink-soft">{r.texto}</p>}
      {r.tipo === "cupon" && (
        <div className="mt-5 flex justify-end">
          {r.usado ? (
            <span className="text-sm font-semibold text-ink-soft">usado el {when.format(r.usado)}</span>
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
