import Link from "next/link";
import { loadMisiones } from "@/lib/misiones";
import { loadNotes } from "@/lib/notes";
import { hayParaAbrir, loadRegalos } from "@/lib/regalos";
import { currentRole } from "@/lib/session";
import type { Estado } from "@/lib/modos";
import { BrianTileView, GardenTileView, JazzTileView, PowerTileView } from "./tiles-live";

const tile =
  "press group flex-col gap-6 rounded-[1.75rem] border border-line bg-surface p-6 hover:border-accent/60 hover:bg-surface-2";

// What the newest note says, read on the server; whether she has seen it is hers (browser).
export async function BrianTile({ className = "" }: { className?: string }) {
  const role = await currentRole();
  const [newest] = role ? await loadNotes() : [];
  // a gift ready to open lights the tile too — for her only
  const regalo =
    role === "jazz" &&
    (await Promise.all([loadRegalos(), loadMisiones()])
      .then(([list, m]) => hayParaAbrir(list, m.total))
      .catch(() => false));
  return (
    <Link href="/brian" className={`${tile} ${className}`}>
      <BrianTileView
        isBrian={role === "brian"}
        regalo={regalo}
        at={newest?.at ?? null}
        preview={newest ? newest.texto.slice(0, 180) : null}
      />
    </Link>
  );
}

// Her missions are read only for her session; on Brian's screen the tile counts his browser.
export async function GardenTile({ className = "" }: { className?: string }) {
  const m = (await currentRole()) === "jazz" ? await loadMisiones().catch(() => null) : null;
  return (
    <Link href="/tu" className={`${tile} ${className}`}>
      <GardenTileView misiones={m?.total ?? 0} abiertas={m?.abiertas.length ?? 0} />
    </Link>
  );
}

export function PowerTile({ className = "" }: { className?: string }) {
  return (
    <Link href="/superpoderes" className={`${tile} ${className}`}>
      <PowerTileView />
    </Link>
  );
}

// Her mode, for Brian — it leads to «de Brian», where he can write to her.
export function JazzTile({ estado, failed, className = "" }: { estado: Estado | null; failed: boolean; className?: string }) {
  return (
    <Link href="/brian" className={`${tile} ${className}`}>
      <JazzTileView estado={estado} failed={failed} />
    </Link>
  );
}

export function TileSkeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`min-h-56 animate-pulse rounded-[1.75rem] bg-surface ${className}`} />;
}
