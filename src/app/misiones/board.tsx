"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { cumplirMision, nuevaMision, soltarMision } from "@/app/actions";
import { Confetti } from "@/components/confetti";
import { Flower } from "@/components/flower";
import { Check } from "@/components/icons";
import { type Hecha, type Mision, MAX_ABIERTAS, MAX_TEXTO } from "@/lib/mision";

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
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [party, setParty] = useState(0);
  const full = view.abiertas.length >= MAX_ABIERTAS;

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(id);
  }, [msg]);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || full) return;
    setTexto("");
    start(async () => {
      change({ kind: "add", m: { id: `nueva-${Date.now()}`, texto: t, at: Date.now() } });
      const r = await nuevaMision(t);
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
      const r = await cumplirMision(id);
      if (!r.ok) setMsg({ text: r.error ?? "", ok: false });
    });
  }

  function drop(id: string) {
    start(async () => {
      change({ kind: "drop", id });
      const r = await soltarMision(id);
      if (!r.ok) setMsg({ text: r.error ?? "", ok: false });
    });
  }

  return (
    <div className="relative mt-8">
      {party > 0 && <Confetti key={party} />}

      <p role="status" className="min-h-6 text-sm text-ink-soft">
        {msg && (
          <span key={msg.text + party} className="rise inline-flex items-center gap-2">
            {msg.ok && <Flower n={total + view.hoy.length} className="size-5" />}
            {msg.text}
          </span>
        )}
      </p>

      <ul className="mt-2 space-y-3">
        {view.abiertas.map((m, i) => (
          <li
            key={m.id}
            className="rise flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 pr-5"
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
            <p className="flex-1 text-pretty text-lg leading-snug">{m.texto}</p>
            <button
              type="button"
              onClick={() => drop(m.id)}
              className="press t-label shrink-0 rounded-full px-2 py-2 text-ink-soft hover:text-ink"
            >
              soltar
            </button>
          </li>
        ))}
      </ul>

      {full ? (
        <p className="mt-4 text-pretty text-ink-soft">Tienes 3 abiertas. Termina una primero.</p>
      ) : (
        <form onSubmit={add} className="mt-4 flex items-center gap-2 rounded-full border border-dashed border-line bg-surface p-1.5 pl-5">
          <label htmlFor="nueva" className="sr-only">
            nueva misión
          </label>
          <input
            id="nueva"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={MAX_TEXTO}
            placeholder={view.abiertas.length === 0 ? "¿qué vas a hacer hoy?" : "nueva misión"}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-2 text-lg placeholder:text-ink-soft focus:outline-none"
          />
          <button
            type="submit"
            disabled={!texto.trim()}
            className="press shrink-0 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50"
          >
            agregar
          </button>
        </form>
      )}

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
