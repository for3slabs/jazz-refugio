import Link from "next/link";
import { loadMisiones } from "@/lib/misiones";
import { loadVueltas } from "@/lib/vueltas";
import { hayParaAbrir, loadRegalos } from "@/lib/regalos";
import { currentRole } from "@/lib/session";
import { GardenTileView, PowerTileView, RegalosTileView } from "./tiles-live";

const tile =
  "press group flex-col gap-6 rounded-[1.75rem] border border-line bg-surface p-6 hover:border-accent/60 hover:bg-surface-2";

// Her gifts, on the home: whether one is ready to open — read on the server, the same on every device.
export async function RegalosTile({ className = "" }: { className?: string }) {
  const role = await currentRole();
  const listo =
    !!role &&
    (await Promise.all([loadRegalos(role), role === "jazz" ? loadMisiones() : null])
      .then(([list, m]) => hayParaAbrir(list, m?.total ?? 0))
      .catch(() => false));
  return (
    <Link href="/regalos" className={`${tile} ${className}`}>
      <RegalosTileView listo={listo} />
    </Link>
  );
}

// Her missions are read only for her session; on Brian's screen the tile counts his own returns.
export async function GardenTile({ className = "" }: { className?: string }) {
  const role = await currentRole();
  const m = role === "jazz" ? await loadMisiones().catch(() => null) : null;
  const vueltas = role === "jazz" ? (m?.vueltas ?? 0) : role ? (await loadVueltas(role).catch(() => [])).length : 0;
  return (
    <Link href="/tu" className={`${tile} ${className}`}>
      <GardenTileView misiones={m?.total ?? 0} vueltas={vueltas} abiertas={m?.abiertas.length ?? 0} />
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


export function TileSkeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`min-h-56 animate-pulse rounded-[1.75rem] bg-surface ${className}`} />;
}
