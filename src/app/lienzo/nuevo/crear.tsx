"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { crearYAbrirTablero } from "@/app/actions";
import { ArrowLeft, Check } from "@/components/icons";
import { MAX_NOMBRE } from "@/lib/tablero";

const chip = "rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold"; // the board's own chips

// One screen, not two (Brian, 2026-10-25): a new board already looks like a board — «← tableros»,
// its name where the title goes, its buttons waiting — and naming it brings the real board in the
// same trip (the server answers the save with the board). A ref guards the save: a slow tap that
// landed twice made two «Bra».
export function Crear() {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const enviando = useRef(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    const n = nombre.trim();
    if (!n || enviando.current) return;
    enviando.current = true;
    setGuardando(true);
    // on success this never returns: the server redirects to the new board
    const r = await crearYAbrirTablero(n);
    setError(r.error ?? "No se pudo crear. Inténtalo otra vez.");
    setGuardando(false);
    enviando.current = false;
  }

  return (
    <div className="mt-6">
      <Link href="/lienzo" className="press t-label -ml-2 inline-flex items-center gap-2 rounded-full px-2 py-2 text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" />
        tableros
      </Link>
      <form onSubmit={crear} className="mt-3 flex items-start gap-3">
        <label htmlFor="tablero" className="sr-only">
          nombre del tablero
        </label>
        <input
          id="tablero"
          autoFocus
          value={nombre}
          readOnly={guardando}
          onChange={(e) => {
            setNombre(e.target.value);
            setError(null);
          }}
          maxLength={MAX_NOMBRE}
          placeholder="nombre del tablero"
          autoComplete="off"
          enterKeyHint="done"
          style={{ boxShadow: "none" }}
          className="t-display min-w-0 flex-1 bg-transparent text-4xl placeholder:text-ink-soft/40 focus:outline-none"
        />
        {nombre.trim() && (
          <button
            type="submit"
            disabled={guardando}
            aria-label="crear el tablero"
            className="rise press mt-1 grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink disabled:opacity-60"
          >
            <Check className="size-5" />
          </button>
        )}
      </form>
      <p role="status" className="mt-2 text-sm text-ink-soft">
        {error ?? (guardando ? "creándolo…" : "ponle nombre y empieza a llenarlo")}
      </p>

      {/* its buttons are already here, waiting for the name */}
      <div aria-hidden className="mt-5 flex flex-wrap gap-2 opacity-40">
        <span className={chip}>+ imagen</span>
        <span className={chip}>+ color</span>
        <span className={chip}>+ nota</span>
        <span className={`${chip} !border-accent/60`}>dibujar</span>
      </div>
    </div>
  );
}
