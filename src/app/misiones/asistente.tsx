"use client";

import { useId, useRef, useState, useTransition } from "react";
import { destrabarMision, dondeEmpiezo } from "@/app/actions";
import { Close, Sparkle } from "@/components/icons";
import type { Mision } from "@/lib/mision";

const boton =
  "press inline-flex items-center gap-2 rounded-full border border-accent/60 bg-surface px-4 py-2 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50";

// Her assistant, out of the page's way: one round button on the right, over the doors (Brian,
// 2026-10-25: «que sea un icono, como si fuera un asistente»). It opens a sheet with what it can
// do here; `alerta` lights it up when something waits for its help. Each helper inside says what
// it sends before she taps it; every answer is a proposal.
export function AsistenteBoton({ alerta = false, label, children }: { alerta?: boolean; label: string; children: React.ReactNode }) {
  const sheet = useRef<HTMLDialogElement>(null);
  // its own id: «hoy» and an open goal each mount one, and a shared id would name both sheets
  const titulo = useId();
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30">
        <div className="mx-auto flex max-w-md justify-end px-5 sm:px-8 lg:max-w-xl">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label={label}
            onClick={() => sheet.current?.showModal()}
            className="asistente press pointer-events-auto relative grid size-14 place-items-center rounded-full bg-accent text-accent-ink"
          >
            <Sparkle className="size-6" />
            {alerta && (
              <span aria-hidden className="absolute -right-0.5 -top-0.5 grid size-3.5 place-items-center">
                <span className="estado-atorada absolute size-3.5 animate-ping rounded-full opacity-60" />
                <span className="estado-atorada size-3 rounded-full ring-2 ring-canvas" />
              </span>
            )}
          </button>
        </div>
      </div>

      <dialog
        ref={sheet}
        aria-labelledby={titulo}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="sheet m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-[1.75rem] border border-b-0 border-line bg-surface p-0 text-ink backdrop:bg-transparent sm:mx-auto sm:max-w-md lg:m-auto lg:rounded-[1.75rem] lg:border-b"
      >
        <div className="px-6 pb-8 pt-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titulo} className="flex items-center gap-2 text-lg font-semibold">
              <Sparkle className="size-5 text-accent" />
              tu asistente
            </h2>
            <button
              type="button"
              aria-label="cerrar"
              onClick={() => sheet.current?.close()}
              className="press -mr-2 grid size-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              <Close className="size-5" />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}

// In «hoy»: help with a mission she marked «atorada» first (it lights up for that), then «¿por
// dónde empiezo?».
export function Asistente({ abiertas }: { abiertas: Mision[] }) {
  const atorada = abiertas.find((m) => m.estado === "atorada");
  return (
    <AsistenteBoton alerta={!!atorada} label={atorada ? "asistente: te ayuda con lo que está atorado" : "asistente"}>
      {atorada && <Destrabar key={atorada.id} mision={atorada} />}
      <Empezar />
    </AsistenteBoton>
  );
}

function Destrabar({ mision }: { mision: Mision }) {
  const [pending, start] = useTransition();
  const [pasos, setPasos] = useState<string[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  function pedir() {
    setMsg(null);
    start(async () => {
      const r = await destrabarMision(mision.id);
      if (r.ok) setPasos(r.pasos);
      else setMsg(r.error);
    });
  }
  return (
    <section className="mt-6 rounded-2xl border border-line bg-surface-2 p-4">
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <span aria-hidden className="estado-atorada size-1.5 rounded-full" />
        atorada
      </p>
      <p className="mt-1 text-pretty font-semibold leading-snug">{mision.texto}</p>
      {pasos ? (
        <ol className="rise mt-3 space-y-2">
          {pasos.map((p, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="grid size-5 shrink-0 place-items-center rounded-full border border-accent/60 text-[0.6875rem] font-semibold tabular-nums text-accent">
                {i + 1}
              </span>
              <span className="text-pretty">{p}</span>
            </li>
          ))}
        </ol>
      ) : (
        <>
          <button type="button" onClick={pedir} disabled={pending} className={`${boton} mt-3`}>
            <Sparkle className="size-4 text-accent" />
            {pending ? "pensando…" : "pártela en pasitos"}
          </button>
          <p className="mt-2 text-xs text-ink-soft">Envía a Claude, la IA de Anthropic: el texto de esta misión.</p>
        </>
      )}
      {msg && <p role="status" className="mt-2 text-sm text-ink-soft">{msg}</p>}
    </section>
  );
}

function Empezar() {
  const [pending, start] = useTransition();
  const [r, setR] = useState<{ empieza: string; porque: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  function pedir() {
    setMsg(null);
    start(async () => {
      const x = await dondeEmpiezo();
      if (x.ok && x.empieza) setR({ empieza: x.empieza, porque: x.porque ?? "" });
      else setMsg(x.error);
    });
  }
  return (
    <section className="mt-6">
      {r ? (
        <div className="rise rounded-2xl border border-accent/60 p-4">
          <p className="text-sm text-ink-soft">empieza por</p>
          <p className="mt-1 text-pretty text-lg font-semibold leading-snug">{r.empieza}</p>
          {r.porque && <p className="mt-2 text-pretty text-sm text-ink-soft">{r.porque}</p>}
        </div>
      ) : (
        <>
          <button type="button" onClick={pedir} disabled={pending} className={boton}>
            <Sparkle className="size-4 text-accent" />
            {pending ? "pensando…" : "¿por dónde empiezo?"}
          </button>
          <p className="mt-2 text-xs text-ink-soft">Envía a Claude, la IA de Anthropic: tus misiones de hoy, lo siguiente de tus metas y tu modo.</p>
        </>
      )}
      {msg && <p role="status" className="mt-2 text-sm text-ink-soft">{msg}</p>}
    </section>
  );
}
