import { loadEstado } from "@/lib/estado";
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
  return role === "jazz" ? (
    <EstadoOrb initial={estado} className={className} />
  ) : (
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
