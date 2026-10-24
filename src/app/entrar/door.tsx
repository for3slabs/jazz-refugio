"use client";

import { useActionState } from "react";
import { entrar, type EntrarState } from "../actions";
import { ArrowRight } from "@/components/icons";

export function Door() {
  const [state, action, pending] = useActionState<EntrarState, FormData>(entrar, { error: null });
  return (
    <form action={action} className="w-full space-y-3">
      <label htmlFor="clave" className="block text-center text-sm text-ink-soft">
        la palabra que te dio Brian
      </label>
      <div className="flex gap-2">
        <input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          className="min-w-0 flex-1 rounded-full border border-line bg-surface px-5 py-3.5 text-center text-lg text-ink focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="entrar"
          className="grid size-14 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          <ArrowRight className="size-5" />
        </button>
      </div>
      <p aria-live="polite" className="min-h-6 text-center text-sm text-accent">
        {state.error}
      </p>
    </form>
  );
}
