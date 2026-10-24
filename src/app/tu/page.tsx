import { PageTitle, Shell } from "@/components/shell";
import { Star } from "@/components/icons";
import { Garden } from "./garden";

export default function Tu() {
  return (
    <Shell back>
      <PageTitle icon={<Star className="size-7" />}>tu jardín</PageTitle>
      <Garden />
    </Shell>
  );
}
