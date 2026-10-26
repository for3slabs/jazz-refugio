"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { dejarNota, marcarNotasVistas, type NotaState } from "../actions";
import { Plus } from "@/components/icons";

// Under the «papelitos», a blank one: «＋ escribirle un papelito a Brian». A tap opens the box in
// its place; leaving the note closes it with its confirmation.
// `para`: the one the note is for.
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
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="press mt-5 flex min-h-14 w-full items-center gap-3 rounded-xl border border-dashed border-line px-4 text-left text-ink-soft hover:border-accent/60 hover:text-ink"
      >
        <Plus className="size-5 shrink-0 text-accent" />
        {aviso ? <span className="rise">guardada. ya la puede ver.</span> : `escribirle un papelito a ${para}`}
      </button>
    );

  return (
    <form ref={form} action={action} className="rise mt-5 space-y-3 rounded-xl border border-line bg-surface p-4">
      <label htmlFor="texto" className="sr-only">
        una nota para {para}
      </label>
      <textarea
        id="texto"
        name="texto"
        rows={3}
        maxLength={2000}
        required
        autoFocus
        placeholder={`lo que quieras que ${para} encuentre al entrar…`}
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
