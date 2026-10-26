import Link from "next/link";
import { loadMisiones } from "@/lib/misiones";
import { loadVueltas } from "@/lib/vueltas";
import { hayNuevas, loadDejadas, loadNotes } from "@/lib/notes";
import { hayParaAbrir, loadRegalos } from "@/lib/regalos";
import { currentRole } from "@/lib/session";
import { BrianTileView, GardenTileView, PowerTileView } from "./tiles-live";

const tile =
  "press group flex-col gap-6 rounded-[1.75rem] border border-line bg-surface p-6 hover:border-accent/60 hover:bg-surface-2";

// The last notes between the two, both ways, like a little panel of notices (Brian, 2026-10-25) —
// and whether one is new; read on the server, the same on every device. A gift ready to open
// lights the tile too.
export async function BrianTile({ className = "" }: { className?: string }) {
  const role = await currentRole();
  const [suyas, mias] = role ? await Promise.all([loadNotes(role).catch(() => []), loadDejadas(role).catch(() => [])]) : [[], []];
  const notas = [...suyas.map((n) => ({ id: n.id, mia: false, texto: n.texto.slice(0, 160), at: n.at })), ...mias.map((n) => ({ id: n.id, mia: true, texto: n.texto.slice(0, 160), at: n.at }))]
    .sort((a, b) => b.at - a.at)
    .slice(0, 3);
  const nuevo = role ? await hayNuevas(role).catch(() => false) : false;
  const regalo =
    !!role &&
    (await Promise.all([loadRegalos(role), role === "jazz" ? loadMisiones() : null])
      .then(([list, m]) => hayParaAbrir(list, m?.total ?? 0))
      .catch(() => false));
  return (
    <Link href="/brian" className={`${tile} ${className}`}>
      <BrianTileView
        isBrian={role === "brian"}
        regalo={regalo}
        nuevo={nuevo}
        notas={notas}
      />
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
