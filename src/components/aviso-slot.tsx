import { diasHasta, terminada } from "@/lib/pendiente";
import { loadPendientes } from "@/lib/pendientes";
import { currentRole } from "@/lib/session";
import { AvisoView } from "./aviso";

// The nearest dated goal within 3 days, for her only. A past date never shows: a goal
// that slipped just stays in «más adelante», it is not announced as late.
export async function AvisoSlot() {
  if ((await currentRole()) !== "jazz") return null;
  const p = await loadPendientes().catch(() => null);
  const near = (p?.metas ?? [])
    .filter((m) => m.para && !terminada(m))
    .map((m) => ({ m, d: diasHasta(m.para!) }))
    .filter(({ d }) => d >= 0 && d <= 3)
    .sort((a, b) => a.d - b.d)[0];
  return near ? <AvisoView id={near.m.id} titulo={near.m.titulo} para={near.m.para!} /> : null;
}
