import { PageTitle, Shell } from "@/components/shell";
import { Gear } from "@/components/icons";
import { salir } from "../actions";
import { MotionSwitch } from "./motion-switch";

export default function Ajustes() {
  return (
    <Shell back>
      <PageTitle icon={<Gear className="size-7" />}>ajustes</PageTitle>
      <div className="mt-8 divide-y divide-line rounded-3xl border border-line bg-surface">
        <MotionSwitch />
        <p className="px-6 py-5 text-sm leading-relaxed text-ink-soft">
          Tu jardín y lo que escribes aquí se guardan solo en este dispositivo. Nadie más los ve.
        </p>
      </div>
      <form action={salir} className="mt-auto pt-10 text-center">
        <button type="submit" className="text-sm text-ink-soft underline-offset-4 hover:text-ink hover:underline">
          cerrar tu refugio en este dispositivo
        </button>
      </form>
    </Shell>
  );
}
