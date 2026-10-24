import { loadEstado } from "@/lib/estado";
import { loadMisiones } from "@/lib/misiones";
import { loadRegalados } from "@/lib/personajes";
import type { Estado } from "@/lib/modos";
import { currentRole } from "@/lib/session";
import { EstadoOrb } from "./estado";
import { Orb } from "./orb";
import { JazzTile, PowerTile } from "./tiles";

async function read(): Promise<{ estado: Estado | null; failed: boolean }> {
  try {
    return { estado: await loadEstado(), failed: false };
  } catch {
    return { estado: null, failed: true };
  }
}

// The home's orb: hers to mark her mode; for Brian it wears her mode's colour, and on a
// phone her mode's tile (with what helps) sits above it.
export async function EstadoSlot({ className = "" }: { className?: string }) {
  const role = await currentRole();
  if (!role) return <Orb className={className} />;
  const { estado, failed } = await read();
  if (role === "jazz") {
    // A failed read leaves her collection with what her browser knows — never an error card.
    const [m, regalados] = await Promise.all([loadMisiones(), loadRegalados()]).catch(() => [null, []] as const);
    return <EstadoOrb initial={estado} coleccion={{ misiones: m?.total ?? 0, regalados: [...regalados] }} className={className} />;
  }
  return (
    <>
      <JazzTile estado={estado} failed={failed} className="flex w-full max-lg:order-first lg:hidden" />
      <Orb modo={estado?.modo ?? null} className={className} />
    </>
  );
}

// The wide tile: her strength of the day for her, her mode for Brian.
export async function WideTile({ className = "" }: { className?: string }) {
  if ((await currentRole()) !== "brian") return <PowerTile className={className} />;
  const { estado, failed } = await read();
  return <JazzTile estado={estado} failed={failed} className={className} />;
}
