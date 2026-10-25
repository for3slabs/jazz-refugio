"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { dejarNota, marcarNotasVistas, type NotaState } from "../actions";
import { Abrir } from "./plegado";

// `para`: the one the note is for. Closed it is one line, «＋ dejarle una nota a Brian»; a tap opens
// the box, and leaving the note closes it again with its confirmation.
export function Composer({ para = "Jazz" }: { para?: string }) {
  const [state, action, pending] = useActionState<NotaState, FormData>(dejarNota, { ok: false, error: null });
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    form.current?.reset();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing follows the server's answer
    setAbierto(false);
    setAviso(true);
    const id = setTimeout(() => setAviso(false), 2800);
    return () => clearTimeout(id);
  }, [state]);

  if (!abierto)
    return (
      <>
        <Abrir onClick={() => setAbierto(true)}>dejarle una nota a {para}</Abrir>
        {aviso && (
          <p role="status" className="rise mt-2 text-sm text-ink-soft">
            guardada. ya la puede ver.
          </p>
        )}
      </>
    );

  return (
    <form ref={form} action={action} className="rise mt-8 space-y-3 rounded-3xl border border-line bg-surface p-5">
      <label htmlFor="texto" className="font-semibold">
        una nota para {para}
      </label>
      <textarea
        id="texto"
        name="texto"
        rows={4}
        maxLength={2000}
        required
        autoFocus
        placeholder="lo que quieras que encuentre al entrar…"
        className="block w-full resize-y rounded-2xl border border-line bg-canvas px-4 py-3 text-lg leading-relaxed text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-ink-soft">
          {state.error}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="press rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft hover:text-ink"
          >
            cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="press whitespace-nowrap rounded-full bg-accent px-5 py-2.5 font-medium text-accent-ink disabled:opacity-60"
          >
            {pending ? "guardando…" : "dejar nota"}
          </button>
        </div>
      </div>
    </form>
  );
}

// Opening «notas» is what reading means: the door on the home stops glowing — on every device.
export function MarkSeen() {
  useEffect(() => {
    void marcarNotasVistas();
  }, []);
  return null;
}
