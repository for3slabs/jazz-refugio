"use client";

import { useRef, useState } from "react";
import { powers } from "@/lib/content";
import { ArrowLeft, ArrowRight, Bloom } from "@/components/icons";

export function Cards() {
  const [i, setI] = useState(0);
  const startX = useRef<number | null>(null);
  const go = (d: number) => setI((v) => (v + d + powers.length) % powers.length);
  const p = powers[i];

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-8">
      <div
        key={i}
        className="rise touch-pan-y select-none rounded-[2rem] border border-line bg-surface p-8"
        onPointerDown={(e) => (startX.current = e.clientX)}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <div className="flex items-center justify-between text-ink-soft">
          <Bloom className="size-6 text-accent" />
          <span className="text-sm tabular-nums">
            {i + 1} / {powers.length}
          </span>
        </div>
        <h2 className="mt-6 t-display text-5xl ">{p.name}</h2>
        <p className="mt-4 text-pretty text-lg leading-relaxed">{p.what}</p>
        <div className="mt-8 rounded-2xl bg-accent-soft px-5 py-4">
          <p className="t-label text-accent">cómo usarlo hoy</p>
          <p className="mt-1.5 text-pretty">{p.today}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="anterior"
          onClick={() => go(-1)}
          className="press grid size-11 place-items-center rounded-full text-ink-soft ring-1 ring-line hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex gap-1.5">
          {powers.map((_, n) => (
            <span
              key={n}
              className={`h-1.5 rounded-full transition-all duration-300 ${n === i ? "w-5 bg-accent" : "w-1.5 bg-line"}`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="siguiente"
          onClick={() => go(1)}
          className="press grid size-11 place-items-center rounded-full text-ink-soft ring-1 ring-line hover:bg-surface-2 hover:text-ink"
        >
          <ArrowRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
