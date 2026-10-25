"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { type ModoId, modos } from "@/lib/modos";
import type { Accesorio } from "@/components/mascota/gato";

// three.js only in the browser, and only on this screen.
const Escena = dynamic(() => import("@/components/mascota/escena"), { ssr: false });

// SAMPLE for Brian's review: the 3D cat, its six faces and one hat. The mode picker here is
// only to look at every face — the real screen takes her mode from the orb.
export function Muestra() {
  const [modo, setModo] = useState<ModoId | null>(null);
  const [accesorio, setAccesorio] = useState<Accesorio>(null);
  return (
    <div className="mt-6 space-y-6">
      <div className="orb-tint carta-arte relative aspect-square w-full overflow-hidden rounded-[1.75rem]" data-modo={modo ?? undefined}>
        <Escena modo={modo} accesorio={accesorio} className="absolute inset-0" />
      </div>
      <p className="t-display text-center text-3xl">michi</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setAccesorio(accesorio ? null : "sombrero")}
          className="press t-label rounded-full bg-accent px-4 py-2.5 text-accent-ink"
        >
          {accesorio ? "quitar sombrero" : "ponerle sombrero"}
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => setModo(null)} className={`press rounded-full border px-3 py-1.5 text-sm ${modo === null ? "border-accent" : "border-line"}`}>
          sin estado
        </button>
        {modos.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModo(m.id)}
            className={`press rounded-full border px-3 py-1.5 text-sm ${modo === m.id ? "border-accent" : "border-line"}`}
          >
            {m.id}
          </button>
        ))}
      </div>
    </div>
  );
}
