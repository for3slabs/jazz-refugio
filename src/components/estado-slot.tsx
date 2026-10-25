import { loadEstado } from "@/lib/estado";
import { loadMascota } from "@/lib/mascota";
import type { Estado } from "@/lib/modos";
import { currentRole } from "@/lib/session";
import { EstadoOrb, ModoSync } from "./estado";
import { GatoEnEsfera } from "./mascota/en-esfera";
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
  // A failed read still shows the pet — as it starts, never an error in the orb.
  const { puestos } = await loadMascota().catch(() => ({ puestos: { cuello: "mono" as const } }));
  if (role === "jazz") return <EstadoOrb initial={estado} puestos={puestos} className={className} />;
  return (
    <>
      <JazzTile estado={estado} failed={failed} className="flex w-full max-lg:order-first lg:hidden" />
      <Orb modo={estado?.modo ?? null} className={className}>
        <GatoEnEsfera modo={estado?.modo ?? null} puestos={puestos} />
      </Orb>
      <ModoSync estado={estado} />
    </>
  );
}

// The wide tile: her strength of the day for her, her mode for Brian.
export async function WideTile({ className = "" }: { className?: string }) {
  if ((await currentRole()) !== "brian") return <PowerTile className={className} />;
  const { estado, failed } = await read();
  return <JazzTile estado={estado} failed={failed} className={className} />;
}
