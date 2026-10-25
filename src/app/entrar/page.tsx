import { Orb } from "@/components/orb";
import { Door } from "./door";

export default function Entrar() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-10 px-6 py-12">
      <Orb className="orb-idle size-28" />
      <div className="space-y-2 text-center">
        <h1 className="t-display text-4xl ">tu refugio</h1>
        <p className="text-ink-soft">un lugar para volver</p>
      </div>
      <Door />
    </div>
  );
}
