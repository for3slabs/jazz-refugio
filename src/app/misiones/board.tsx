"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { cumplirMision, estadoMision, nuevaMision, recuperarSoltado, soltarMision } from "@/app/actions";
import { Confetti } from "@/components/confetti";
import { since, useNow } from "@/components/estado";
import { Flower } from "@/components/flower";
import { Check, Chevron, More } from "@/components/icons";
import { type EstadoMision, type Hecha, type Mision, MAX_ABIERTAS, MAX_TEXTO } from "@/lib/mision";
import { Asistente } from "./asistente";

type View = { abiertas: Mision[]; hoy: Hecha[] };
type Change =
  | { kind: "add"; m: Mision }
  | { kind: "done"; id: string }
  | { kind: "drop"; id: string }
  | { kind: "estado"; id: string; estado: EstadoMision | null };

function apply(v: View, c: Change): View {
  if (c.kind === "add") return { ...v, abiertas: [...v.abiertas, c.m] };
  if (c.kind === "estado") {
    return {
      ...v,
      abiertas: v.abiertas.map((m) =>
        m.id !== c.id
          ? m
          : {
              ...m,
              estado: c.estado ?? undefined,
              empezada: c.estado === "haciendo" ? (m.empezada ?? Date.now()) : m.empezada,
            },
      ),
    };
  }
  const m = v.abiertas.find((x) => x.id === c.id);
  const abiertas = v.abiertas.filter((x) => x.id !== c.id);
  if (c.kind === "drop" || !m) return { ...v, abiertas };
  return { abiertas, hoy: [{ ...m, hecha: Date.now() }, ...v.hoy] };
}

// Her day in one list: the missions she has, the one place she can fill now, the ones still free.
// One surface with rows, not three boxes — the page title leads, the list follows (Brian,
// 2026-10-25: «las misiones están muy grandes»). Each row says how it is going; the circle gives the
// flower, the ⋯ opens «haciendo · atorada · soltar» right there.
export function Board({ abiertas, hoy, total }: View & { total: number }) {
  const [view, change] = useOptimistic<View, Change>({ abiertas, hoy }, apply);
  const [, start] = useTransition();
  const [texto, setTexto] = useState("");
  const [abierta, setAbierta] = useState<string | null>(null);
  // `undo`: the mission she just let go, offered back for a few seconds
  const [msg, setMsg] = useState<{ text: string; ok: boolean; undo?: string } | null>(null);
  const [party, setParty] = useState(0);
  const now = useNow();
  const full = view.abiertas.length >= MAX_ABIERTAS;
  const primeraVez = total === 0 && view.hoy.length === 0;
  const libres = Math.max(0, MAX_ABIERTAS - view.abiertas.length - 1);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), msg.undo ? 8000 : 2800);
    return () => clearTimeout(id);
  }, [msg]);

  // A new mission shows at once under a temporary id; this maps it to the server's answer, so a tap
  // that comes first (complete, let go, a state) waits for the real id instead of losing it.
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
    setAbierta(null);
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
    setAbierta(null);
    const texto = view.abiertas.find((m) => m.id === id)?.texto ?? "";
    start(async () => {
      change({ kind: "drop", id });
      const de = await real(id);
      if (!de) return;
      const r = await soltarMision(de);
      setMsg(r.ok ? { text: `«${texto}» se soltó`, ok: true, undo: de } : { text: r.error ?? "", ok: false });
    });
  }

  // Tapping the state she already has clears it back to waiting.
  function marcar(m: Mision, estado: EstadoMision) {
    const nuevo = m.estado === estado ? null : estado;
    setAbierta(null);
    start(async () => {
      change({ kind: "estado", id: m.id, estado: nuevo });
      const de = await real(m.id);
      if (!de) return;
      const r = await estadoMision(de, nuevo);
      if (!r.ok) setMsg({ text: r.error ?? "", ok: false });
    });
  }

  function undo(id: string) {
    setMsg(null);
    start(async () => {
      const r = await recuperarSoltado("mision", id);
      if (!r.ok) setMsg({ text: r.error ?? "", ok: false });
    });
  }

  return (
    <div className="relative mt-3">
      {party > 0 && <Confetti key={party} />}

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {view.abiertas.map((m, i) => (
          <li key={m.id} className="rise" style={{ animationDelay: `${Math.min(i, 3) * 40}ms` }}>
            <div className="flex min-h-14 items-center gap-3 py-2 pl-2 pr-1">
              <button
                type="button"
                onClick={() => done(m.id)}
                aria-label={`cumplir: ${m.texto}`}
                className="press group grid size-11 shrink-0 place-items-center rounded-full"
              >
                <span className="grid size-6 place-items-center rounded-full border-2 border-accent/70 transition-colors group-hover:bg-accent-soft">
                  <Check className="size-3.5 text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-pretty font-medium leading-snug">{m.texto}</p>
                {m.estado ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
                    <span aria-hidden className={`size-1.5 rounded-full ${m.estado === "haciendo" ? "estado-haciendo" : "estado-atorada"}`} />
                    {m.estado}
                    {m.estado === "haciendo" && m.empezada && now && ` · ${since(m.empezada, now)}`}
                  </p>
                ) : (
                  primeraVez && i === 0 && <p className="mt-0.5 text-xs text-ink-soft">toca el círculo al terminarla</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setAbierta(abierta === m.id ? null : m.id)}
                aria-expanded={abierta === m.id}
                aria-label={`cómo va: ${m.texto}`}
                className="press grid size-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
              >
                <More className="size-5" />
              </button>
            </div>
            {abierta === m.id && (
              <div className="rise flex flex-wrap items-center gap-2 px-4 pb-3 pl-[3.75rem]">
                {(["haciendo", "atorada"] as const).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => marcar(m, e)}
                    aria-pressed={m.estado === e}
                    className={`press inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                      m.estado === e ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-soft hover:text-ink"
                    }`}
                  >
                    <span aria-hidden className={`size-1.5 rounded-full ${e === "haciendo" ? "estado-haciendo" : "estado-atorada"}`} />
                    {e}
                  </button>
                ))}
                {/* letting go closes it with no flower — set apart from the two states */}
                <button
                  type="button"
                  onClick={() => drop(m.id)}
                  className="press ml-auto rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
                >
                  soltar
                </button>
              </div>
            )}
          </li>
        ))}

        {!full && (
          <li>
            <form onSubmit={add} className="flex min-h-14 items-center gap-3 py-2 pl-[1.125rem] pr-2 focus-within:bg-surface-2">
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
                // the row lights up instead; the global input ring would draw a box inside the list
                style={{ boxShadow: "none" }}
                className="min-w-0 flex-1 bg-transparent py-1.5 placeholder:text-ink-soft focus:outline-none"
              />
              {/* One thing at a time: the empty field shows its whole question, and the button
                  arrives with the first letter. Enter adds too. */}
              {texto.trim() && (
                <button type="submit" className="rise press shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
                  agregar
                </button>
              )}
            </form>
          </li>
        )}

        {Array.from({ length: libres }, (_, i) => (
          <li key={`libre-${i}`} aria-hidden className="flex min-h-14 items-center gap-3 pl-[1.125rem] text-sm text-ink-soft/70">
            <Lugar n={view.abiertas.length + 2 + i} />
            libre
          </li>
        ))}
      </ul>

      {full && <p className="mt-3 text-pretty text-sm text-ink-soft">Las 3 están en marcha: cuando cumplas una, se abre otro espacio.</p>}

      {/* Only when there is something to say — an empty line here used to push the list down. */}
      {msg && (
        <p role="status" className="mt-3 text-sm text-ink-soft">
          <span key={msg.text + party} className="rise inline-flex items-center gap-2">
            {msg.ok && !msg.undo && <Flower n={total + view.hoy.length} className="size-5" />}
            {msg.text}
            {msg.undo && (
              <button type="button" onClick={() => undo(msg.undo!)} className="press rounded-full border border-line px-3 py-1 text-xs font-medium text-ink hover:border-accent/60">
                deshacer
              </button>
            )}
          </span>
        </p>
      )}

      {view.hoy.length > 0 && <Historial hoy={view.hoy} total={total} />}

      {view.abiertas.length > 0 && <Asistente abiertas={view.abiertas} />}
    </div>
  );
}

const hora = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "America/Mexico_City" });

function duracion(desde: number, hasta: number) {
  const min = Math.round((hasta - desde) / 60_000);
  if (min < 1) return "menos de 1 min";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return min % 60 ? `${h} h ${min % 60} min` : `${h} h`;
}

// What she finished today, folded into one line so it rewards without crowding; open, each one
// says when — and how long, if she marked it «haciendo» first.
function Historial({ hoy, total }: { hoy: Hecha[]; total: number }) {
  return (
    <details className="group mt-8">
      <summary className="press flex cursor-pointer list-none items-center gap-3 rounded-2xl py-2 [&::-webkit-details-marker]:hidden">
        <span className="font-semibold">hoy cumpliste {hoy.length}</span>
        <span aria-hidden className="flex -space-x-1">
          {hoy.slice(0, 5).map((h, i) => (
            <Flower key={h.id} n={total - i} className="size-5" />
          ))}
        </span>
        <Chevron className="ml-auto size-5 text-ink-soft transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <ul className="mt-2 space-y-2.5 border-l border-line pl-4">
        {hoy.map((h) => (
          <li key={h.id} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 text-pretty text-sm">{h.texto}</span>
            <span className="shrink-0 text-xs tabular-nums text-ink-soft">
              {hora.format(h.hecha)}
              {h.empezada && ` · ${duracion(h.empezada, h.hecha)}`}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

// The number of a place: lit for the one she can fill now, quiet for the ones that wait.
function Lugar({ n, activo = false }: { n: number; activo?: boolean }) {
  return (
    <span
      className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums ${
        activo ? "border-accent/60 text-accent" : "border-line text-ink-soft/70"
      }`}
    >
      {n}
    </span>
  );
}
