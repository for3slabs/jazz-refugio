"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { type PalabraState, cambiarPalabra } from "../actions";
import { Sparkle } from "@/components/icons";

// «cambiar tu palabra»: folded until she opens it — the one she has now, the new one, and the new
// one again, so a slip of the finger never locks her out. The eye shows what she typed.
function Campo({ name, label, ver }: { name: string; label: string; ver: boolean }) {
  return (
    <label className="block">
      <span className="text-sm text-ink-soft">{label}</span>
      <input
        name={name}
        type={ver ? "text" : "password"}
        required
        autoComplete={name === "ahora" ? "current-password" : "new-password"}
        autoCapitalize="none"
        spellCheck={false}
        className="mt-1 w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
    </label>
  );
}

export function CambiarPalabra() {
  const [state, action, pending] = useActionState<PalabraState, FormData>(cambiarPalabra, { ok: false, error: null });
  const [ver, setVer] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  return (
    <details className="group px-6 py-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span>
          <span className="block">cambiar tu palabra</span>
          <span className="text-sm text-ink-soft">la que usas para entrar</span>
        </span>
        <span aria-hidden className="text-ink-soft transition-transform group-open:rotate-180">
          ⌄
        </span>
      </summary>
      <form ref={form} action={action} className="mt-5 space-y-4">
        <Campo name="ahora" label="tu palabra de ahora" ver={ver} />
        <Campo name="nueva" label="tu palabra nueva" ver={ver} />
        <Campo name="otra" label="repítela" ver={ver} />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={ver} onChange={(e) => setVer(e.target.checked)} className="accent-accent" />
          ver lo que escribo
        </label>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="press rounded-full bg-accent px-6 py-2.5 font-semibold text-accent-ink disabled:opacity-60"
          >
            {pending ? "guardando…" : "guardar"}
          </button>
          <p role="status" className="text-sm">
            {state.ok && (
              <span className="inline-flex items-center gap-1.5 text-ink-soft">
                listo, desde ahora entras con la nueva <Sparkle className="size-3.5 text-accent" />
              </span>
            )}
            {state.error && <span className="text-ink">{state.error}</span>}
          </p>
        </div>
      </form>
    </details>
  );
}
