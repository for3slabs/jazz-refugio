import { Shell } from "@/components/shell";
import { Star } from "@/components/icons";
import { Garden } from "./garden";

export default function Tu() {
  return (
    <Shell back>
      <div className="mt-8 flex items-center gap-3">
        <Star className="size-6 text-accent" />
        <h1 className="font-display text-3xl tracking-tight">tu jardín</h1>
      </div>
      <Garden />
    </Shell>
  );
}
