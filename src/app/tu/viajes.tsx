"use client";

import { useState, useTransition } from "react";
import { cambiarViaje, guardarViaje, soltarDelEstante } from "@/app/actions";
import { type EstadoViaje, type Viaje, MAX_NOTA, MAX_TITULO } from "@/lib/estante";

// Her trips: places she went, like postcards, and places she wants to go. No map, no count
// of what is missing — a collection that only grows.
// `otro`: who sees the wishes — Brian on her trips, Jazz on his.
export function Viajes({ viajes, otro = "Brian" }: { viajes: Viaje[]; otro?: string }) {
  const [form, setForm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fui = viajes.filter((v) => v.estado === "fui");
  const quiero = viajes.filter((v) => v.estado === "quiero");

  const run = (op: () => Promise<{ ok: boolean; error: string | null }>, after?: () => void) =>
    start(async () => {
      const r = await op();
      if (r.ok) after?.();
      else setMsg(r.error);
    });

  return (
    <div className="mt-6">
      <p className="text-sm text-ink-soft">{otro} ve tus «quiero ir» —solo los lugares— para regalarte.</p>
      <p role="status" className="min-h-6 text-sm text-ink-soft">
        {msg}
      </p>

      {viajes.length === 0 && <p className="mt-2 text-pretty text-lg text-ink-soft">Todavía no hay viajes aquí. Agrega uno donde estuviste, o uno con el que sueñas.</p>}

      {fui.length > 0 && (
        <section className="mt-4">
          <h2 className="t-label text-accent">fui · {fui.length}</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {fui.map((v, i) => (
              <li key={v.id} className="rise group relative rounded-3xl border border-line bg-surface p-4" style={{ animationDelay: `${Math.min(i, 6) * 50}ms`, rotate: `${((i * 7) % 5) - 2}deg` }}>
                <p className="text-lg font-semibold leading-snug">{v.lugar}</p>
                {v.cuando && <p className="t-label mt-1 text-ink-soft">{v.cuando}</p>}
                {v.nota && <p className="mt-2 line-clamp-4 text-pretty text-sm leading-relaxed">«{v.nota}»</p>}
                <button type="button" disabled={pending} onClick={() => run(() => soltarDelEstante("viajes", v.id))} className="press t-label mt-3 text-ink-soft hover:text-ink">
                  soltar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {quiero.length > 0 && (
        <section className="mt-8">
          <h2 className="t-label text-accent">quiero ir</h2>
          <ul className="mt-3 divide-y divide-line">
            {quiero.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{v.lugar}</p>
                  {(v.cuando || v.nota) && <p className="truncate text-sm text-ink-soft">{[v.cuando, v.nota].filter(Boolean).join(" · ")}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" disabled={pending} onClick={() => run(() => cambiarViaje(v.id, "fui"))} className="press rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm font-semibold hover:border-accent/60">
                    ¡ya fui!
                  </button>
                  <button type="button" disabled={pending} onClick={() => run(() => soltarDelEstante("viajes", v.id))} className="press t-label rounded-full px-2 py-1.5 text-ink-soft hover:text-ink">
                    soltar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {form ? (
        <Agregar pending={pending} run={run} cancel={() => setForm(false)} />
      ) : (
        <button type="button" onClick={() => setForm(true)} className="press mt-8 w-full rounded-full border border-dashed border-line px-5 py-3 text-left text-ink-soft hover:border-accent/60 hover:text-ink">
          + agregar
        </button>
      )}
    </div>
  );
}

const field = "block w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-lg text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none";
const chip = "press rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold hover:border-accent/60";

function Agregar({
  pending,
  run,
  cancel,
}: {
  pending: boolean;
  run: (op: () => Promise<{ ok: boolean; error: string | null }>, after?: () => void) => void;
  cancel: () => void;
}) {
  const [lugar, setLugar] = useState("");
  const [cuando, setCuando] = useState("");
  const [estado, setEstado] = useState<EstadoViaje>("fui");
  const [nota, setNota] = useState("");
  return (
    <form
      className="rise mt-8 space-y-3 rounded-3xl border border-dashed border-line bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => guardarViaje(lugar, cuando, estado, nota), cancel);
      }}
    >
      <div className="flex gap-2" role="radiogroup" aria-label="fui o quiero ir">
        {(["fui", "quiero"] as const).map((s) => (
          <button key={s} type="button" role="radio" aria-checked={estado === s} onClick={() => setEstado(s)} className={`${chip} ${estado === s ? "!border-accent !bg-accent-soft" : ""}`}>
            {s === "fui" ? "fui" : "quiero ir"}
          </button>
        ))}
      </div>
      <input autoFocus required value={lugar} onChange={(e) => setLugar(e.target.value)} maxLength={MAX_TITULO} placeholder="el lugar" aria-label="lugar" className={field} />
      <input value={cuando} onChange={(e) => setCuando(e.target.value)} maxLength={40} placeholder={estado === "fui" ? "cuándo · abril 2026" : "cuándo · algún día"} aria-label="cuándo" className={field} />
      <textarea rows={2} value={nota} onChange={(e) => setNota(e.target.value)} maxLength={MAX_NOTA} placeholder="una nota · opcional" aria-label="nota" className={`${field} resize-y`} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={cancel} className="press t-label rounded-full px-3 py-2 text-ink-soft hover:text-ink">
          cancelar
        </button>
        <button type="submit" disabled={!lugar.trim() || pending} className="press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50">
          {pending ? "guardando…" : "guardar"}
        </button>
      </div>
    </form>
  );
}
