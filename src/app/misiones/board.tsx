"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { cumplirMision, nuevaMision, recuperarSoltado, soltarMision } from "@/app/actions";
import { Confetti } from "@/components/confetti";
import { Flower } from "@/components/flower";
import { Check } from "@/components/icons";
import { type Hecha, type Mision, MAX_ABIERTAS, MAX_TEXTO } from "@/lib/mision";
import { PorDondeEmpiezo } from "./ayudantes";

type View = { abiertas: Mision[]; hoy: Hecha[] };
type Change = { kind: "add"; m: Mision } | { kind: "done"; id: string } | { kind: "drop"; id: string };

function apply(v: View, c: Change): View {
  if (c.kind === "add") return { ...v, abiertas: [...v.abiertas, c.m] };
  const m = v.abiertas.find((x) => x.id === c.id);
  const abiertas = v.abiertas.filter((x) => x.id !== c.id);
  if (c.kind === "drop" || !m) return { ...v, abiertas };
  return { abiertas, hoy: [{ ...m, hecha: Date.now() }, ...v.hoy] };
}

// The loop of the day: write one, do it, tap it — the flower lands in the same second,
// before the server answers. A failed save puts things back and says so.
export function Board({ abiertas, hoy, total }: View & { total: number }) {
  const [view, change] = useOptimistic<View, Change>({ abiertas, hoy }, apply);
  const [, start] = useTransition();
  const [texto, setTexto] = useState("");
  // `undo`: the mission she just let go, offered back for a few seconds
  const [msg, setMsg] = useState<{ text: string; ok: boolean; undo?: string } | null>(null);
  const [party, setParty] = useState(0);
  const full = view.abiertas.length >= MAX_ABIERTAS;

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), msg.undo ? 8000 : 2800);
    return () => clearTimeout(id);
  }, [msg]);

  // A new mission shows at once under a temporary id; this maps it to the server's answer, so a tap
  // that comes first (complete, let go) waits for the real id instead of losing her flower.
  const reales = useRef(new Map<string, Promise<string | null>>());
  const seq = useRef(0);
  const real = async (id: string) => (id.startsWith("nueva-") ? ((await reales.current.get(id)) ?? null) : id);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || full) return;
    setTexto("");
    const tmp = `nueva-${++seq.current}`;
    const guardada = nuevaMision(t);
    reales.current.set(tmp, guardada.then((r) => r.id ?? null).catch(() => null));
    start(async () => {
      change({ kind: "add", m: { id: tmp, texto: t, at: Date.now() } });
      const r = await guardada;
      if (!r.ok) {
        setTexto(t);
        setMsg({ text: r.error ?? "", ok: false });
      }
    });
  }

  function done(id: string) {
    setParty((p) => p + 1);
    setMsg({ text: "una flor más en tu jardín", ok: true });
    start(async () => {
      change({ kind: "done", id });
      const de = await real(id);
      if (!de) return; // it never got saved — the add already said so
      const r = await cumplirMision(de);
      if (!r.ok) setMsg({ text: r.error ?? "", ok: false });
    });
  }

  function drop(id: string) {
    const texto = view.abiertas.find((m) => m.id === id)?.texto ?? "";
    start(async () => {
      change({ kind: "drop", id });
      const de = await real(id);
      if (!de) return;
      const r = await soltarMision(de);
      setMsg(r.ok ? { text: `«${texto}» se soltó`, ok: true, undo: de } : { text: r.error ?? "", ok: false });
    });
  }

  function undo(id: string) {
    setMsg(null);
    start(async () => {
      const r = await recuperarSoltado("mision", id);
      if (!r.ok) setMsg({ text: r.error ?? "", ok: false });
    });
  }

  // Three places, always in sight: the limit reads without a word. The next free one is the only
  // live field; the rest wait, dimmed. Until her first flower, the first mission says how it
  // works (Brian, 2026-10-25: «llevarla de la manita»).
  const primeraVez = total === 0 && view.hoy.length === 0;
  const libres = Math.max(0, MAX_ABIERTAS - view.abiertas.length - 1);

  return (
    <div className="relative mt-6">
      {party > 0 && <Confetti key={party} />}

      <ul className="space-y-3">
        {view.abiertas.map((m, i) => (
          <li
            key={m.id}
            className="rise flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 pr-3"
            style={{ animationDelay: `${Math.min(i, 3) * 50}ms` }}
          >
            <button
              type="button"
              onClick={() => done(m.id)}
              aria-label={`cumplir: ${m.texto}`}
              className="press group grid size-11 shrink-0 place-items-center rounded-full border-2 border-accent/70 hover:bg-accent-soft"
            >
              <Check className="size-5 text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-pretty text-lg font-medium leading-snug">{m.texto}</p>
              {primeraVez && i === 0 && <p className="mt-1 text-sm text-ink-soft">toca el círculo al terminarla</p>}
            </div>
            <button
              type="button"
              onClick={() => drop(m.id)}
              className="press t-label shrink-0 self-start rounded-full px-2 py-2 text-ink-soft hover:text-ink"
            >
              soltar
            </button>
          </li>
        ))}

        {!full && (
          <li>
            <form
              onSubmit={add}
              className="flex min-h-14 items-center gap-3 rounded-3xl border border-accent/50 bg-surface p-2 pl-4 transition-shadow focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft"
            >
              <Lugar n={view.abiertas.length + 1} activo />
              <label htmlFor="nueva" className="sr-only">
                nueva misión
              </label>
              <input
                id="nueva"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={MAX_TEXTO}
                placeholder={view.abiertas.length === 0 ? "¿qué vas a hacer primero?" : "¿y después?"}
                autoComplete="off"
                // the whole card lights up instead; the global input ring would draw a box inside it
                style={{ boxShadow: "none" }}
                className="min-w-0 flex-1 bg-transparent py-2 text-lg placeholder:text-ink-soft focus:outline-none"
              />
              {/* One thing at a time: the empty field shows its whole question, and the button
                  arrives with the first letter. Enter adds too. */}
              {texto.trim() && (
                <button
                  type="submit"
                  className="rise press shrink-0 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink"
                >
                  agregar
                </button>
              )}
            </form>
          </li>
        )}

        {Array.from({ length: libres }, (_, i) => (
          <li
            key={`libre-${i}`}
            aria-hidden
            className="flex items-center gap-3 rounded-3xl border border-dashed border-line px-4 py-3.5 text-sm text-ink-soft/70"
          >
            <Lugar n={view.abiertas.length + 2 + i} />
            libre
          </li>
        ))}
      </ul>

      {full && (
        <p className="mt-4 text-pretty text-sm text-ink-soft">Las 3 están en marcha: cuando cumplas una, se abre otro espacio.</p>
      )}

      {/* Only when there is something to say — an empty line here used to push the field down. */}
      {msg && (
        <p role="status" className="mt-4 text-sm text-ink-soft">
          <span key={msg.text + party} className="rise inline-flex items-center gap-2">
            {msg.ok && !msg.undo && <Flower n={total + view.hoy.length} className="size-5" />}
            {msg.text}
            {msg.undo && (
              <button type="button" onClick={() => undo(msg.undo!)} className="press t-label rounded-full border border-line px-3 py-1 text-ink hover:border-accent/60">
                deshacer
              </button>
            )}
          </span>
        </p>
      )}

      {view.abiertas.length > 0 && <PorDondeEmpiezo />}

      {view.hoy.length > 0 && (
        <section className="mt-10 border-t border-dashed border-line pt-6">
          <h2 className="t-label text-ink-soft">hechas hoy</h2>
          <ul className="mt-3 space-y-2">
            {view.hoy.map((h) => (
              <li key={h.id} className="flex items-center gap-3 text-ink-soft">
                <Check className="size-4 shrink-0 text-accent" />
                <span className="text-pretty">{h.texto}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// The number of a place: lit for the one she can fill now, quiet for the ones that wait.
function Lugar({ n, activo = false }: { n: number; activo?: boolean }) {
  return (
    <span
      className={`grid size-7 shrink-0 place-items-center rounded-full border text-sm font-semibold tabular-nums ${
        activo ? "border-accent/60 text-accent" : "border-line text-ink-soft/70"
      }`}
    >
      {n}
    </span>
  );
}
