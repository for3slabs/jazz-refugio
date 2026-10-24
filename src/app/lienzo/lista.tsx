"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { nuevoTablero } from "@/app/actions";
import { type Tablero, MAX_NOMBRE, MAX_TABLEROS, imgSrc } from "@/lib/tablero";

// Her boards as covers: the first four things on each, so she knows which is which at a glance.
export function Lista({ tableros, isBrian }: { tableros: Tablero[]; isBrian: boolean }) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function create(e: React.FormEvent) {
    e.preventDefault();
    const n = nombre.trim();
    if (!n) return;
    start(async () => {
      const r = await nuevoTablero(n);
      if (r.ok) setNombre("");
      else setError(r.error);
    });
  }

  return (
    <div className="mt-6">
      {tableros.length === 0 && (
        <p className="text-pretty text-lg leading-relaxed text-ink-soft">
          {isBrian
            ? "Jazz no ha compartido ningún tablero todavía. Cuando lo haga, aparecerá aquí."
            : "Tus tableros de ideas: imágenes, colores, notas y lo que dibujes. Empieza uno."}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tableros.map((t, i) => {
          const cover = t.items.slice(0, 4);
          return (
            <li key={t.id} className="rise" style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}>
              <Link
                href={`/lienzo/${t.id}`}
                className="press group block overflow-hidden rounded-3xl border border-line bg-surface hover:border-accent/60"
              >
                <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-0.5 bg-line/40">
                  {Array.from({ length: 4 }, (_, k) => {
                    const it = cover[k];
                    if (!it) return <div key={k} className="bg-surface-2" />;
                    if (it.tipo === "color") return <div key={k} style={{ background: it.color }} />;
                    if (it.tipo === "nota")
                      return (
                        <div key={k} className="overflow-hidden bg-surface-2 p-2 text-[0.6rem] leading-tight text-ink-soft">
                          {it.texto}
                        </div>
                      );
                    return (
                      <Image key={k} src={imgSrc(it)} alt="" width={200} height={200} unoptimized className="size-full object-cover" />
                    );
                  })}
                </div>
                <div className="p-4">
                  <p className="truncate font-semibold">{t.nombre}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {t.items.length === 1 ? "1 cosa" : `${t.items.length} cosas`}
                    {!isBrian && t.compartido && " · compartido"}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {!isBrian &&
        (tableros.length >= MAX_TABLEROS ? (
          <p className="mt-4 text-ink-soft">Tienes {MAX_TABLEROS} tableros. Borra uno para empezar otro.</p>
        ) : (
          <form onSubmit={create} className="mt-5 flex items-center gap-2 rounded-full border border-dashed border-line bg-surface p-1.5 pl-5">
            <label htmlFor="tablero" className="sr-only">
              nombre del tablero
            </label>
            <input
              id="tablero"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setError(null);
              }}
              maxLength={MAX_NOMBRE}
              placeholder="nuevo tablero…"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-2 text-lg placeholder:text-ink-soft focus:outline-none"
            />
            <button
              type="submit"
              disabled={!nombre.trim() || pending}
              className="press shrink-0 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50"
            >
              crear
            </button>
          </form>
        ))}
      {error && <p className="mt-2 text-sm text-ink-soft">{error}</p>}
    </div>
  );
}
