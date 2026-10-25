"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { nuevoTablero } from "@/app/actions";
import { ArrowLeft } from "@/components/icons";
import { MAX_NOMBRE } from "@/lib/tablero";

// One field and one button: the name, then straight into the board to fill it. «crear y
// llenarlo» arrives with the first letter, like every «agregar» in the app.
export function Crear() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function crear(e: React.FormEvent) {
    e.preventDefault();
    const n = nombre.trim();
    if (!n || pending) return;
    start(async () => {
      const r = await nuevoTablero(n);
      if (r.ok && r.id) router.replace(`/lienzo/${r.id}`);
      else setError(r.error ?? "No se pudo crear. Inténtalo otra vez.");
    });
  }

  return (
    <div className="mt-6">
      <Link href="/lienzo" className="press t-label -ml-2 inline-flex items-center gap-2 rounded-full px-2 py-2 text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" />
        tableros
      </Link>
      <h2 className="mt-4 text-lg font-semibold">nuevo tablero</h2>
      <p className="mt-0.5 text-pretty text-sm text-ink-soft">ponle un nombre; después lo llenas</p>
      <form onSubmit={crear} className="mt-4">
        <label htmlFor="tablero" className="sr-only">
          nombre del tablero
        </label>
        <input
          id="tablero"
          autoFocus
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setError(null);
          }}
          maxLength={MAX_NOMBRE}
          placeholder="ideas para…"
          autoComplete="off"
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 font-medium placeholder:font-normal placeholder:text-ink-soft"
        />
        {error && (
          <p role="status" className="mt-2 text-sm text-ink-soft">
            {error}
          </p>
        )}
        {nombre.trim() && (
          <button
            type="submit"
            disabled={pending}
            className="rise press mt-4 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50"
          >
            {pending ? "creando…" : "crear y llenarlo"}
          </button>
        )}
      </form>
    </div>
  );
}
