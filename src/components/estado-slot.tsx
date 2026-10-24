import { loadEstado } from "@/lib/estado";
import type { Estado } from "@/lib/modos";
import { currentRole } from "@/lib/session";
import { EstadoChip } from "./estado";
import { JazzTile, PowerTile } from "./tiles";

async function read(): Promise<{ estado: Estado | null; failed: boolean }> {
  try {
    return { estado: await loadEstado(), failed: false };
  } catch {
    return { estado: null, failed: true };
  }
}

// The home's hero: she gets the chip to mark her mode; Brian, on a phone, gets her mode.
export async function EstadoSlot() {
  const role = await currentRole();
  if (!role) return null;
  const { estado, failed } = await read();
  return role === "jazz" ? (
    <EstadoChip initial={estado} />
  ) : (
    <JazzTile estado={estado} failed={failed} className="flex w-full max-lg:order-first lg:hidden" />
  );
}

// The wide tile: her strength of the day for her, her mode for Brian.
export async function WideTile({ className = "" }: { className?: string }) {
  if ((await currentRole()) !== "brian") return <PowerTile className={className} />;
  const { estado, failed } = await read();
  return <JazzTile estado={estado} failed={failed} className={className} />;
}
