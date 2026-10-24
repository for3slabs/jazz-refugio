"use client";

import { useActionState, useEffect, useRef } from "react";
import { dejarNota, type NotaState } from "../actions";
import { notesSeen } from "@/lib/local";

export function Composer() {
  const [state, action, pending] = useActionState<NotaState, FormData>(dejarNota, { ok: false, error: null });
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="mt-8 space-y-3 rounded-3xl border border-line bg-surface p-5">
      <label htmlFor="texto" className="t-label text-accent">
        una nota para Jazz
      </label>
      <textarea
        id="texto"
        name="texto"
        rows={4}
        maxLength={2000}
        required
        placeholder="lo que quieras que encuentre al entrar…"
        className="block w-full resize-y rounded-2xl border border-line bg-canvas px-4 py-3 text-lg leading-relaxed text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-ink-soft">
          {state.error ?? (state.ok ? "guardada. ya la puede ver." : "")}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 whitespace-nowrap rounded-full bg-accent px-5 py-2.5 font-medium text-accent-ink transition-transform active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "guardando…" : "dejar nota"}
        </button>
      </div>
    </form>
  );
}

// Opening this page is what "reading" means: the door on the home stops glowing.
export function MarkSeen({ at }: { at: number | null }) {
  useEffect(() => {
    if (at) notesSeen.set(at);
  }, [at]);
  return null;
}
