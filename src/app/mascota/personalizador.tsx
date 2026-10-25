"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";
import { guardarMascota } from "@/app/actions";
import { Sparkle } from "@/components/icons";
import { moments } from "@/lib/local";
import type { ModoId } from "@/lib/modos";
import {
  type Categoria,
  type Estante,
  type Mascota,
  MAX_NOMBRE_MASCOTA,
  type ObjetoId,
  type Puestos,
  type Regalado,
  categorias,
  estante,
} from "@/lib/objeto";

const Escena = dynamic(() => import("@/components/mascota/escena"), { ssr: false });

// Her pet's wardrobe, like dressing a character in a game: the cat turns under her finger, its
// name is hers to write, and every object shows — the ones she has to try on at once, the ones
// still coming with how they arrive. Nothing is kept until she taps «guardar» (top right).
export function Personalizador({
  mascota,
  regalados,
  misiones,
  modo,
}: {
  mascota: Mascota;
  regalados: Regalado[];
  misiones: number;
  modo: ModoId | null;
}) {
  const [nombre, setNombre] = useState(mascota.nombre);
  const [puestos, setPuestos] = useState<Puestos>(mascota.puestos);
  const [cat, setCat] = useState<Categoria>("cabeza");
  const [items, setItems] = useState<Estante[] | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    // the garden counts the times she came back (her browser) and her missions (synced)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- her flowers live on her device
    setItems(estante(moments.all().length + misiones, regalados));
  }, [misiones, regalados]);

  const dirty = nombre.trim() !== mascota.nombre || JSON.stringify(puestos) !== JSON.stringify(mascota.puestos);

  function ponerse(id: ObjetoId | null) {
    setPuestos((p) => {
      const next = { ...p };
      if (id) next[cat] = id;
      else delete next[cat];
      return next;
    });
  }

  function guardar() {
    start(async () => {
      const r = await guardarMascota(nombre, puestos);
      setMsg(r.ok ? { text: "guardado", ok: true } : { text: r.error ?? "", ok: false });
    });
  }

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(id);
  }, [msg]);

  return (
    <div className="mt-4 flex flex-col gap-5">
      <div
        className="orb-tint carta-arte relative mx-auto aspect-square w-[min(100%,24rem,42dvh)] overflow-hidden rounded-[1.75rem]"
        data-modo={modo ?? undefined}
      >
        <Escena modo={modo} puestos={puestos} className="absolute inset-0" />
        {/* top right of the stage, as in the sketch: only there when something changed */}
        {dirty && (
          <button
            type="button"
            onClick={guardar}
            disabled={pending || !nombre.trim()}
            className="press rise absolute right-3 top-3 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink shadow-lg disabled:opacity-60"
          >
            {pending ? "guardando…" : "guardar"}
          </button>
        )}
      </div>

      <p role="status" className="-my-3 h-5 text-center text-sm text-ink-soft">
        {msg && (
          <span key={msg.text} className="rise inline-flex items-center gap-1.5">
            {msg.text}
            {msg.ok && <Sparkle className="size-3.5 text-accent" />}
          </span>
        )}
      </p>

      <label className="group mx-auto flex items-center gap-2">
        <span className="sr-only">su nombre</span>
        <input
          value={nombre}
          maxLength={MAX_NOMBRE_MASCOTA}
          onChange={(e) => setNombre(e.target.value)}
          className="nombre-mascota t-display w-[11ch] border-b-2 border-transparent bg-transparent text-center text-3xl outline-none focus:border-accent"
        />
        <Pencil className="size-5 text-ink-soft group-focus-within:text-accent" />
      </label>

      <div role="tablist" aria-label="partes" className="flex justify-center gap-2">
        {categorias.map((c) => (
          <button
            key={c}
            role="tab"
            type="button"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={`press t-label rounded-full px-4 py-2.5 ${cat === c ? "bg-accent text-accent-ink" : "text-ink-soft hover:text-ink"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {items && (
        <ul className="grid grid-cols-3 gap-3">
          <li>
            <Tile on={!puestos[cat]} onClick={() => ponerse(null)} icon={<Nada />} nombre="nada" como="sin nada aquí" tiene />
          </li>
          {items
            .filter((o) => o.categoria === cat)
            .map((o) => (
              <li key={o.id}>
                <Tile
                  on={puestos[cat] === o.id}
                  onClick={() => o.tiene && ponerse(o.id)}
                  icon={<ObjetoIcon id={o.id} />}
                  nombre={o.nombre}
                  como={o.como}
                  tiene={o.tiene}
                />
              </li>
            ))}
        </ul>
      )}

    </div>
  );
}

function Tile({
  on,
  onClick,
  icon,
  nombre,
  como,
  tiene,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  nombre: string;
  como: string;
  tiene: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-disabled={!tiene}
      onClick={onClick}
      className={`press flex h-full w-full flex-col items-center gap-2 rounded-2xl border p-3 text-center ${
        on ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-accent/60"
      } ${tiene ? "" : "cursor-default opacity-55"}`}
    >
      <span className={`grid size-14 place-items-center ${tiene ? "text-accent" : "text-ink-soft"}`}>{icon}</span>
      <span className="text-sm font-semibold leading-tight">{nombre}</span>
      <span className="text-xs leading-snug text-ink-soft">{on ? "puesto" : como}</span>
    </button>
  );
}

// Drawn icons for each object — the same hand as the rest of the app's icons.
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function ObjetoIcon({ id }: { id: ObjetoId }) {
  if (id === "sombrero")
    return (
      <svg viewBox="0 0 48 48" className="size-12" {...base}>
        <ellipse cx="24" cy="31" rx="20" ry="5.5" />
        <path d="M15 30c1-9 3.5-15 9-15s8 6 9 15" />
        <path d="M15.6 26.5c5.6 1.6 11.2 1.6 16.8 0" />
      </svg>
    );
  if (id === "gorro-chef")
    return (
      <svg viewBox="0 0 48 48" className="size-12" {...base}>
        <path d="M15 27c-4-1-6-4-6-7.5a6.5 6.5 0 0 1 9.5-5.8A7 7 0 0 1 24 10a7 7 0 0 1 5.5 3.7A6.5 6.5 0 0 1 39 19.5c0 3.5-2 6.5-6 7.5" />
        <path d="M15 27v8h18v-8" />
        <path d="M15 31h18" />
      </svg>
    );
  if (id === "mandil")
    return (
      <svg viewBox="0 0 48 48" className="size-12" {...base}>
        <path d="M18 9h12v8l7 4v15a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V21l7-4Z" />
        <path d="M19 27h10v6H19z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 48 48" className="size-12" {...base}>
      <path d="M21 24 9 16v16Z" />
      <path d="M27 24l12-8v16Z" />
      <circle cx="24" cy="24" r="3.2" />
    </svg>
  );
}

function Nada() {
  return (
    <svg viewBox="0 0 48 48" className="size-10" {...base}>
      <circle cx="24" cy="24" r="12" />
      <path d="m15.5 32.5 17-17" />
    </svg>
  );
}

function Pencil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden>
      <path d="M4 20h4L19 9l-4-4L4 16Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}
