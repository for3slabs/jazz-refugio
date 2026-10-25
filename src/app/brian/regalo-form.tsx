"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { type RegaloState, borrarRegalo, dejarRegalo } from "../actions";
import { MAX_REGALO, MAX_TITULO, MAX_TRAS, type Regalo, misionesWord } from "@/lib/regalo";

const when = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "America/Mexico_City" });

function estado(r: Regalo, total: number) {
  if (r.usado) return `cupón usado el ${when.format(r.usado)}`;
  if (r.abierto) return `abierto el ${when.format(r.abierto)}`;
  if (total >= r.desde) return "listo para abrir";
  return `envuelto · faltan ${misionesWord(r.desde - total)}`;
}

// Leave a letter or a coupon for the other one — for her: now, or after some of her missions —
// and see what became of each one.
export function RegaloForm({ regalos, total, para = "Jazz" }: { regalos: Regalo[]; total: number; para?: string }) {
  const [state, action, pending] = useActionState<RegaloState, FormData>(dejarRegalo, { ok: false, error: null });
  const [abre, setAbre] = useState<"ya" | "tras">("ya");
  const form = useRef<HTMLFormElement>(null);

  // After a gift is left the form starts over — «se abre» included, so what shows is what is sent.
  useEffect(() => {
    if (!state.ok) return;
    form.current?.reset();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the reset above is the DOM's; this is React's half
    setAbre("ya");
  }, [state]);

  const field =
    "block w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-lg text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none";

  return (
    <>
      <form ref={form} action={action} className="mt-8 space-y-4 rounded-3xl border border-line bg-surface p-5">
        <p className="t-label text-accent">un regalo para {para}</p>
        <fieldset className="flex gap-2">
          <legend className="sr-only">tipo</legend>
          {(["cupon", "carta"] as const).map((t) => (
            <label key={t} className="press cursor-pointer">
              <input type="radio" name="tipo" value={t} defaultChecked={t === "cupon"} className="peer sr-only" />
              <span className="block rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-soft peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-accent">
                {t === "cupon" ? "cupón" : "carta"}
              </span>
            </label>
          ))}
        </fieldset>
        <input name="titulo" required maxLength={MAX_TITULO} placeholder="vale por un café conmigo" aria-label="título" className={field} />
        <textarea
          name="texto"
          rows={3}
          maxLength={MAX_REGALO}
          placeholder="lo que quieras decirle con él…"
          aria-label="texto"
          className={`${field} resize-y leading-relaxed`}
        />
        {para === "Jazz" && (
        <fieldset className="space-y-2">
          <legend className="t-label text-ink-soft">se abre</legend>
          <label className="flex items-center gap-3">
            <input type="radio" name="abre" value="ya" checked={abre === "ya"} onChange={() => setAbre("ya")} className="accent-[var(--accent)]" />
            ya
          </label>
          <label className="flex items-center gap-3">
            <input type="radio" name="abre" value="tras" checked={abre === "tras"} onChange={() => setAbre("tras")} className="accent-[var(--accent)]" />
            después de
            <input
              type="number"
              name="n"
              min={1}
              max={MAX_TRAS}
              defaultValue={3}
              disabled={abre !== "tras"}
              aria-label="cuántas misiones"
              className="w-16 rounded-xl border border-line bg-canvas px-2 py-1 text-center disabled:opacity-50"
            />
            misiones
          </label>
        </fieldset>
        )}
        <div className="flex items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-ink-soft">
            {state.error ?? (state.ok ? "listo. ya lo ve envuelto." : "")}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="press shrink-0 whitespace-nowrap rounded-full bg-accent px-5 py-2.5 font-medium text-accent-ink disabled:opacity-60"
          >
            {pending ? "guardando…" : "dejar regalo"}
          </button>
        </div>
      </form>

      {regalos.length > 0 && (
        <section className="mt-10">
          <h2 className="t-label text-ink-soft">los que diste</h2>
          <ul className="mt-3 divide-y divide-line">
            {regalos.map((r) => (
              <li key={r.id} className="flex items-baseline justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-pretty">
                    <span className="t-label mr-2 text-accent">{r.tipo === "cupon" ? "cupón" : "carta"}</span>
                    {r.titulo}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-soft">{estado(r, total)}</p>
                </div>
                <form action={borrarRegalo}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="text-xs text-ink-soft underline-offset-4 hover:text-ink hover:underline">
                    borrar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
