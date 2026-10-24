import { Shell } from "@/components/shell";
import { Cards } from "./cards";

export default function Superpoderes() {
  return (
    <Shell back>
      <p className="mt-8 font-display text-lg text-ink-soft">tus superpoderes</p>
      <Cards />
    </Shell>
  );
}
