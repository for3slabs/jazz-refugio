import { loadEstado } from "@/lib/estado";
import { loadMascota } from "@/lib/mascota";
import { currentRole } from "@/lib/session";
import { EstadoOrb } from "./estado";
import { GatoEnEsfera } from "./mascota/en-esfera";
import { Orb } from "./orb";

// The home's orb: hers to mark her mode. Her mode is hers alone — it is read only for her
// session; on Brian's screen the orb is neutral, with her pet in it (Brian, 2026-10-25: «es su
// lugar seguro, no el mío, ni ver qué está haciendo»).
export async function EstadoSlot({ className = "" }: { className?: string }) {
  const role = await currentRole();
  if (!role) return <Orb className={className} />;
  // A failed read still shows the pet — as it starts, never an error in the orb.
  const { puestos } = await loadMascota().catch(() => ({ puestos: { cuello: "mono" as const } }));
  if (role !== "jazz")
    return (
      <Orb className={className}>
        <GatoEnEsfera modo={null} puestos={puestos} />
      </Orb>
    );
  const estado = await loadEstado().catch(() => null);
  return <EstadoOrb initial={estado} puestos={puestos} className={className} />;
}
