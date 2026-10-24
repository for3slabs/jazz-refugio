import { Suspense } from "react";
import { PageTitle, Shell } from "@/components/shell";
import { Star } from "@/components/icons";
import { loadMisiones } from "@/lib/misiones";
import { currentRole } from "@/lib/session";
import { Garden } from "./garden";

export default function Tu() {
  return (
    <Shell back>
      <PageTitle icon={<Star className="size-7" />}>tu jardín</PageTitle>
      <Suspense>
        <WithMissions />
      </Suspense>
    </Shell>
  );
}

// Her completed missions are flowers too; they are read only for her session.
async function WithMissions() {
  const m = (await currentRole()) === "jazz" ? await loadMisiones().catch(() => null) : null;
  return <Garden misiones={m?.total ?? 0} mejorDia={m?.mejorDia ?? 0} />;
}
