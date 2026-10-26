"use client";

import { useCallback, useEffect, useOptimistic, useState, useTransition } from "react";
import { abrirRegalo, borrarRegalo, usarCupon } from "../actions";
import { Confetti } from "@/components/confetti";
import { Plus, Trash } from "@/components/icons";
import type { Regalado } from "@/lib/objeto";
import { type Abierto, type Envuelto, type Regalo, misionesWord } from "@/lib/regalo";
import { Caja } from "./caja";
import { RegaloNuevo } from "./regalo-form";

const when = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "America/Mexico_City" });

// What became of a gift you gave, in words — on its box's tag. Never whether it was opened: what
// she does in her refuge is hers (Brian, 2026-10-25); a coupon used is one she asked for.
function etiqueta(r: Regalo, total: number) {
  if (r.usado) return `usó tu cupón el ${when.format(r.usado)}`;
  if (total >= r.desde) return "ya lo puede abrir";
  return `envuelto · en ${misionesWord(r.desde - total)}`;
}

// «regalos» as wrapped boxes, nothing folded away (Brian, 2026-10-25: «ocultarlo siendo un regalo
// no está chido»). Two shelves: «para ti» — boxes that wait for missions or nudge when ready; the
// opened ones become cards, big when tapped — and «para Brian»: «＋ envolver uno» first, then every
// box you gave with its tag saying what became of it. Wrapped content stays on the server until
// opened.
// `de`: who gives to whoever is looking — Brian on her screen, Jazz on his.
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
      setMsg(r.ok ? "listo, que lo disfrutes" : r.error);
    });
  }

  // the one just opened is not in the list until the server refreshes it
  const todos = recien && !list.some((r) => r.id === recien.id) ? [recien, ...list] : list;
  const shown = grande ? todos.find((r) => r.id === grande) ?? null : null;
  const abiertosVisibles = todos.filter((r) => r.id !== shown?.id);
  const nada = envueltos.length === 0 && todos.length === 0;

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

      {/* ── para ti ── */}
      <h3 className="mt-6 font-semibold">para ti</h3>
      {shown && (
        <div className="rise mt-3">
          <Card r={shown} onUse={use} de={de} onClose={() => setGrande(null)} />
        </div>
      )}
      {nada ? (
        <p className="mt-2 text-pretty text-ink-soft">Cuando {de} te envuelva algo, aparece aquí.</p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {envueltos.map((g, i) => {
            const listo = g.faltan === 0;
            return (
              <li key={g.id} className="rise" style={{ animationDelay: `${Math.min(i, 5) * 40}ms` }}>
                <button
                  type="button"
                  disabled={!listo || opening !== null}
                  onClick={() => open(g.id)}
                  className={`press flex h-full w-full flex-col items-center gap-2 rounded-2xl border p-4 text-center ${
                    listo ? "border-accent/60 bg-surface hover:bg-surface-2" : "border-line bg-surface/60"
                  }`}
                >
                  <Caja quieta={!listo} className={`w-24 ${listo ? "wiggle" : ""} ${opening === g.id ? "animate-bounce" : ""}`} />
                  <span className="text-sm text-ink-soft">de {de}</span>
                  <span className={`text-sm ${listo ? "font-semibold text-accent" : "text-ink-soft"}`}>
                    {opening === g.id ? "abriendo…" : listo ? "¡ábrelo!" : `se abre en ${misionesWord(g.faltan)}`}
                  </span>
                </button>
              </li>
            );
          })}
          {abiertosVisibles.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setGrande(r.id)}
                className="press flex h-full min-h-40 w-full flex-col rounded-2xl border border-line bg-surface p-4 text-left hover:border-accent/60"
              >
                <span className="text-xs font-semibold text-accent">
                  {r.tipo === "cupon" ? "cupón" : "carta"} de {de}
                </span>
                <span className="mt-1.5 line-clamp-3 text-pretty font-semibold leading-snug">{r.titulo}</span>
                <span className="mt-auto pt-3 text-xs text-ink-soft">
                  {r.tipo === "cupon" ? (r.usado ? `usado el ${when.format(r.usado)}` : "sin usar · tócalo") : "léela"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── para el otro ── */}
      <h3 className="mt-10 font-semibold">para {de}</h3>
      {nuevo && <RegaloNuevo para={de} regalados={regalados} onClose={cerrar} />}
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {!nuevo && (
          <li>
            <button
              type="button"
              onClick={() => setNuevo(true)}
              className="press flex h-full min-h-48 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-ink-soft hover:border-accent/60 hover:text-ink"
            >
              <Plus className="size-7 text-accent" />
              <span className="text-sm font-medium">envolver uno</span>
            </button>
          </li>
        )}
        {dados.map((r) => (
          <li key={r.id} className="relative flex h-full min-h-48 flex-col items-center gap-2 rounded-2xl border border-line bg-surface p-4 pt-3 text-center">
            <Caja abierta={!!r.abierto} className="w-20" />
            <span className="line-clamp-2 text-pretty text-sm font-semibold leading-snug">{r.titulo}</span>
            <span className="text-xs text-ink-soft">{etiqueta(r, total)}</span>
            <form action={borrarRegalo} className="absolute right-1 top-1">
              <input type="hidden" name="id" value={r.id} />
              <button
                type="submit"
                aria-label={`borrar «${r.titulo}»`}
                className="press grid size-9 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
              >
                <Trash className="size-4" />
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Card({ r, onUse, de, onClose }: { r: Abierto; onUse: (id: string) => void; de: string; onClose: () => void }) {
  return (
    <article className="rounded-3xl border border-accent/60 bg-surface p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-accent">
          {r.tipo === "cupon" ? "cupón" : "carta"} de {de}
        </p>
        <button type="button" onClick={onClose} className="press text-sm font-medium text-ink-soft hover:text-ink">
          cerrar
        </button>
      </div>
      <h3 className="t-display mt-2 text-pretty text-3xl leading-snug">{r.titulo}</h3>
      {r.texto && <p className="mt-3 whitespace-pre-line text-pretty text-lg leading-relaxed text-ink-soft">{r.texto}</p>}
      {r.tipo === "cupon" && (
        <div className="mt-5 flex justify-end">
          {r.usado ? (
            <span className="text-sm font-semibold text-ink-soft">usado el {when.format(r.usado)}</span>
          ) : (
            <button type="button" onClick={() => onUse(r.id)} className="press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink">
              usar cupón
            </button>
          )}
        </div>
      )}
    </article>
  );
}
