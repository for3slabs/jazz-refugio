import { Suspense } from "react";
import { Shell } from "@/components/shell";
import { currentRole } from "@/lib/session";
import { loadVueltas } from "@/lib/vueltas";
import { contarFlores } from "@/lib/jardin";
import { Flow } from "./flow";

export default function Volver() {
  return (
    <Shell back menu={false}>
      <Suspense fallback={<Flow />}>
        <Content />
      </Suspense>
    </Shell>
  );
}

// How many flowers her garden has, read on the server: the number «ya son N» starts from is the
// one «tu jardín» shows — returns AND missions for her (it said 3 while the garden held 11).
async function Content() {
  const role = await currentRole();
  const vueltas =
    role === "jazz"
      ? await contarFlores().catch(() => 0)
      : role
        ? (await loadVueltas(role).catch(() => [])).length
        : 0;
  return <Flow vueltas={vueltas} />;
}
