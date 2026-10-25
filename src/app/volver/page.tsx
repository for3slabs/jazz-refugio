import { Suspense } from "react";
import { Shell } from "@/components/shell";
import { currentRole } from "@/lib/session";
import { loadVueltas } from "@/lib/vueltas";
import { Flow } from "./flow";

export default function Volver() {
  return (
    <Shell back>
      <Suspense fallback={<Flow />}>
        <Content />
      </Suspense>
    </Shell>
  );
}

// How many times she came back, read on the server: the same flower count on every device.
async function Content() {
  const role = await currentRole();
  const vueltas = role ? (await loadVueltas(role).catch(() => [])).length : 0;
  return <Flow vueltas={vueltas} />;
}
