import { PageTitle, Shell } from "@/components/shell";
import { Bloom } from "@/components/icons";
import { Cards } from "./cards";

export default function Superpoderes() {
  return (
    <Shell back>
      <PageTitle icon={<Bloom className="size-7" />}>tus superpoderes</PageTitle>
      <Cards />
    </Shell>
  );
}
