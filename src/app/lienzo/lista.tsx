"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deshacerTablero, nuevoTablero } from "@/app/actions";
import { Undo } from "@/components/icons";
import { type Tablero, MAX_NOMBRE, MAX_TABLEROS, imgSrc } from "@/lib/tablero";

// Her boards as covers — the image she chose, or the first four things — so she knows which is
// which at a glance.
export function Lista({
  tableros,
  isBrian,
  soltado = null,
}: {
  tableros: Tablero[];
  isBrian: boolean;
  soltado?: { id: string; nombre: string } | null;
}) {
  const router = useRouter();
  const [deshecho, setDeshecho] = useState(false);
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
      {soltado && !deshecho && !tableros.some((t) => t.id === soltado.id) && (
        <p role="status" className="rise mb-5 flex flex-wrap items-center gap-3 rounded-3xl border border-line bg-surface px-5 py-3">
          <span className="min-w-0 flex-1 text-pretty">
            «{soltado.nombre}» se fue <span className="text-ink-soft">· se puede recuperar 30 días</span>
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await deshacerTablero(soltado.id);
                if (!r.ok) return setError(r.error);
                setDeshecho(true);
                router.replace("/lienzo");
              })
            }
            className="press inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 font-semibold text-accent-ink disabled:opacity-50"
          >
            <Undo className="size-4" />
            deshacer
          </button>
        </p>
      )}
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
          const elegida = t.portada ? t.items.find((x) => x.id === t.portada) : undefined;
          return (
            <li key={t.id} className="rise" style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}>
              <Link
                href={`/lienzo/${t.id}`}
                className="press group block overflow-hidden rounded-3xl border border-line bg-surface hover:border-accent/60"
              >
                {elegida ? (
                  <Image src={imgSrc(elegida)} alt="" width={400} height={400} unoptimized className="aspect-square w-full object-cover" />
                ) : (
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
                )}
                <div className="p-4">
                  <p className="truncate font-semibold">{t.nombre}</p>
                  {t.descripcion && <p className="mt-0.5 truncate text-sm text-ink-soft">{t.descripcion}</p>}
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
