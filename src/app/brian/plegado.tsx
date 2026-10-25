import { Chevron, Plus } from "@/components/icons";

// One quiet line with its count — «las que dejaste · 2» — folded, like «historial» in misiones:
// the page stays light and she knows there is more inside (Brian, 2026-10-25).
export function Plegado({ titulo, n, children }: { titulo: string; n: number; children: React.ReactNode }) {
  return (
    <details className="group mt-8">
      <summary className="press flex cursor-pointer list-none items-center gap-2 rounded-2xl py-2 [&::-webkit-details-marker]:hidden">
        <span className="font-semibold">{titulo}</span>
        <span className="text-sm tabular-nums text-ink-soft">· {n}</span>
        <Chevron className="ml-auto size-5 text-ink-soft transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

// The title of what is FOR whoever is looking, the way misiones titles «tus 3 misiones de hoy».
export function Encabezado({ titulo, sub }: { titulo: string; sub: string }) {
  return (
    <>
      <h2 className="mt-8 text-lg font-semibold">{titulo}</h2>
      <p className="mt-0.5 text-pretty text-sm text-ink-soft">{sub}</p>
    </>
  );
}

// «＋ dejarle una nota a Brian»: writing is one tap away, not a form that greets her on arrival.
export function Abrir({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press mt-8 flex min-h-14 w-full items-center gap-3 rounded-2xl border border-dashed border-line px-4 text-left text-ink-soft hover:border-accent/60 hover:text-ink"
    >
      <Plus className="size-5 shrink-0 text-accent" />
      {children}
    </button>
  );
}
