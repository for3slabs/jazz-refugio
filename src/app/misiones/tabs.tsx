"use client";

import { useState } from "react";
import { PageTitle } from "@/components/shell";
import { Diamond } from "@/components/icons";

type Vista = "hoy" | "despues";

const vistas = {
  hoy: { href: "/misiones", label: "hoy" },
  despues: { href: "/misiones?v=despues", label: "más adelante" },
} as const;

// Today and later as ONE switch on the title's line: it says where she is, and a tap flips it to
// the other view — one word on screen instead of two (Brian, 2026-10-25: «solo texto… que se
// entienda como un switch»). Both views arrive with the page, so the flip is instant: no trip to
// the server (it used to wait for one on every tap — «se tarda mucho en reaccionar»). The address
// follows, so a reload lands in the same view.
export function Vistas({ inicial, hoy, despues }: { inicial: Vista; hoy: React.ReactNode; despues: React.ReactNode }) {
  const [vista, setVista] = useState<Vista>(inicial);
  const otra: Vista = vista === "hoy" ? "despues" : "hoy";

  function flip() {
    setVista(otra);
    window.history.replaceState(null, "", vistas[otra].href);
  }

  return (
    <>
      <PageTitle
        icon={<Diamond className="size-7" />}
        aside={
          <button
            type="button"
            role="switch"
            aria-checked={vista === "despues"}
            aria-label={`${vistas[vista].label} · cambiar a ${vistas[otra].label}`}
            onClick={flip}
            className="press group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface py-1.5 pl-2 pr-2.5 text-xs font-semibold hover:border-accent/60"
          >
            <span aria-hidden className="relative h-4 w-6 rounded-full bg-accent-soft">
              <span
                className={`absolute left-0.5 top-0.5 size-3 rounded-full bg-accent transition-transform duration-200 ease-[var(--ease-out-strong)] ${
                  vista === "despues" ? "translate-x-2" : "translate-x-0"
                }`}
              />
            </span>
            {vistas[vista].label}
          </button>
        }
      >
        misiones
      </PageTitle>
      {/* both stay mounted, so each keeps what she was typing when she flips */}
      <div hidden={vista !== "hoy"}>{hoy}</div>
      <div hidden={vista !== "despues"}>{despues}</div>
    </>
  );
}
