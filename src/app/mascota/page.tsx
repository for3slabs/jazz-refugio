import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { loadEstado } from "@/lib/estado";
import { loadMascota, loadRegalados } from "@/lib/mascota";
import { loadMisiones } from "@/lib/misiones";
import { NOMBRE_INICIAL } from "@/lib/objeto";
import { currentRole } from "@/lib/session";
import { Personalizador } from "./personalizador";

export default function Mascota() {
  return (
    <Shell back>
      <Suspense>
        <Content />
      </Suspense>
    </Shell>
  );
}

// Her pet is hers to dress; Brian gives objects from his side («de Brian» › regalos).
async function Content() {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  if (role === "brian") redirect("/brian?v=regalos");
  const [mascota, regalados, m, estado] = await Promise.all([
    loadMascota().catch(() => ({ nombre: NOMBRE_INICIAL, puestos: {} })),
    loadRegalados().catch(() => []),
    loadMisiones().catch(() => null),
    loadEstado().catch(() => null),
  ]);
  return <Personalizador mascota={mascota} regalados={regalados} misiones={(m?.total ?? 0) + (m?.vueltas ?? 0)} modo={estado?.modo ?? null} />;
}
