"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { type RegaloState, dejarRegalo, regalarObjeto } from "../actions";
import { objetos, type Regalado } from "@/lib/objeto";
import { MAX_REGALO, MAX_TITULO, MAX_TRAS } from "@/lib/regalo";

type Tipo = "cupon" | "carta" | "mascota";
const nombres: Record<Tipo, string> = { cupon: "cupón", carta: "carta", mascota: "para su mascota" };

// Leave a letter or a coupon for the other one — for her: now, or after some of her missions —
// and, for Brian, something for her pet. Opened by the first card of «regalos», «＋ envolver uno»;
// leaving the gift (or «cancelar») closes it again and `onClose` carries what to say.
// `regalados`: the pet objects Brian already gave — null on her screen, where the pet is not a gift.
export function RegaloNuevo({
  para = "Jazz",
  regalados = null,
  onClose,
}: {
  para?: string;
  regalados?: Regalado[] | null;
  onClose: (aviso: string | null) => void;
}) {
  const [state, action, pending] = useActionState<RegaloState, FormData>(dejarRegalo, { ok: false, error: null });
  const [tipo, setTipo] = useState<Tipo>("cupon");
  const [abre, setAbre] = useState<"ya" | "tras">("ya");

  // A gift left closes the panel: the next one starts from a fresh panel, «se abre» included.
  useEffect(() => {
    if (state.ok) onClose("listo. ya lo ve envuelto.");
  }, [state, onClose]);

  const field =
    "block w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-lg text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none";
  const tipos: Tipo[] = regalados ? ["cupon", "carta", "mascota"] : ["cupon", "carta"];

  return (
    <div className="rise mt-4 space-y-4 rounded-3xl border border-accent/40 bg-surface p-5">
      <p className="font-semibold">un regalo para {para}</p>
      <div role="radiogroup" aria-label="tipo" className="flex flex-wrap gap-2">
        {tipos.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tipo === t}
            onClick={() => setTipo(t)}
            className={`press rounded-full border px-4 py-2 text-sm font-semibold ${
              tipo === t ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-soft hover:text-ink"
            }`}
          >
            {nombres[t]}
          </button>
        ))}
      </div>

      {tipo === "mascota" && regalados ? (
        <ParaSuMascota
          regalados={regalados}
          onDone={(nombre) => onClose(`listo. ${nombre} ya es suyo.`)}
          onCancel={() => onClose(null)}
        />
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="tipo" value={tipo} />
          <input
            name="titulo"
            required
            autoFocus
            maxLength={MAX_TITULO}
            placeholder={tipo === "cupon" ? "vale por un café conmigo" : "el título de tu carta"}
            aria-label="título"
            className={field}
          />
          <textarea
            name="texto"
            rows={3}
            required
            maxLength={MAX_REGALO}
            placeholder="lo que quieras decirle con él…"
            aria-label="texto"
            className={`${field} resize-y leading-relaxed`}
          />
          {para === "Jazz" && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-ink-soft">se abre</legend>
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
              {state.error}
            </p>
            <Botones pending={pending} onCancel={() => onClose(null)} label="dejar regalo" />
          </div>
        </form>
      )}
    </div>
  );
}

function Botones({
  pending,
  onCancel,
  label,
  listo = true,
}: {
  pending: boolean;
  onCancel: () => void;
  label: string;
  listo?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" onClick={onCancel} className="press rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft hover:text-ink">
        cancelar
      </button>
      <button
        type="submit"
        disabled={pending || !listo}
        className="press whitespace-nowrap rounded-full bg-accent px-5 py-2.5 font-medium text-accent-ink disabled:opacity-60"
      >
        {pending ? "guardando…" : label}
      </button>
    </div>
  );
}

// Brian's side of her pet: give an object now instead of waiting for her garden. He never sees
// her garden, so «ya lo tiene» is not his to know — a gift she already has changes nothing.
function ParaSuMascota({
  regalados,
  onDone,
  onCancel,
}: {
  regalados: Regalado[];
  onDone: (nombre: string) => void;
  onCancel: () => void;
}) {
  const porRegalar = objetos.filter((o) => o.flores > 0);
  const [elegido, setElegido] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const o = porRegalar.find((x) => x.id === elegido);
    if (!o) return;
    const f = new FormData();
    f.set("id", o.id);
    start(async () => {
      await regalarObjeto(f);
      onDone(o.nombre);
    });
  }

  return (
    <form onSubmit={send} className="space-y-4">
      <p className="text-pretty text-sm text-ink-soft">Le llegan solos cuando su jardín crece. Si se lo regalas, puede ponérselo hoy.</p>
      <ul role="radiogroup" aria-label="qué le regalas" className="grid grid-cols-2 gap-2">
        {porRegalar.map((o) => {
          const dado = regalados.some((r) => r.id === o.id);
          return (
            <li key={o.id}>
              <button
                type="button"
                role="radio"
                aria-checked={elegido === o.id}
                disabled={dado}
                onClick={() => setElegido(o.id)}
                className={`press flex h-full w-full flex-col items-start gap-1 rounded-2xl border p-3 text-left disabled:opacity-50 ${
                  elegido === o.id ? "border-accent bg-accent-soft" : "border-line hover:border-accent/60"
                }`}
              >
                <span className="font-semibold">{o.nombre}</span>
                <span className="text-xs text-ink-soft">{dado ? "ya se lo regalaste" : `o con ${o.flores} flores`}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex justify-end">
        <Botones pending={pending} listo={!!elegido} onCancel={onCancel} label="regalárselo" />
      </div>
    </form>
  );
}
