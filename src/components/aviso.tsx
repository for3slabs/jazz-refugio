"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { avisoHoyNo } from "@/lib/local";
import { cuando } from "@/lib/pendiente";

const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" });

// A soft note that stays: a goal with a date in the next 3 days. It never rings, never counts
// down, never turns red — and «hoy no» puts it away until tomorrow, on this device.
export function AvisoView({ id, titulo, para }: { id: string; titulo: string; para: string }) {
  const [show, setShow] = useState(false);
  const [when, setWhen] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- «today» and «hoy no» live on her device
    setWhen(cuando(para));
    setShow(avisoHoyNo.get() !== day.format(Date.now()));
  }, [para]);
  if (!show) return null;

  return (
    <aside className="rise w-full max-w-sm rounded-3xl border border-line bg-surface p-5 text-left order-first">
      <p className="text-pretty text-lg leading-snug">
        <span className="font-semibold">{titulo}</span> es {when}. ¿Un paso hoy?
      </p>
      <div className="mt-3 flex items-center gap-4">
        <Link href={`/misiones?v=despues&meta=${id}`} className="press t-label text-accent">
          ver
        </Link>
        <button
          type="button"
          onClick={() => {
            avisoHoyNo.set(day.format(Date.now()));
            setShow(false);
          }}
          className="press t-label text-ink-soft hover:text-ink"
        >
          hoy no
        </button>
      </div>
    </aside>
  );
}
