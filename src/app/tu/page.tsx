import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Star } from "@/components/icons";
import { Tabs } from "@/components/tabs";
import { loadColeccion, loadDeseos } from "@/lib/coleccion";
import { loadMisiones } from "@/lib/misiones";
import { loadVueltas } from "@/lib/vueltas";
import { currentRole } from "@/lib/session";
import { Deseos } from "./deseos";
import { Garden } from "./garden";
import { Librero } from "./librero";
import { Viajes } from "./viajes";

type Search = Promise<{ v?: string }>;

export default function Tu({ searchParams }: { searchParams: Search }) {
  return (
    <Shell back>
      <Suspense>
        <Content searchParams={searchParams} />
      </Suspense>
    </Shell>
  );
}

// Each one's own space. Hers: the garden, her shelf, her trips, and his wishes. His: her wishes,
// his shelf and his trips. The other one's wishes carry «ya se lo regalé», seen only by the giver.
async function Content({ searchParams }: { searchParams: Search }) {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  const otro = role === "jazz" ? "brian" : "jazz";
  const nombreOtro = role === "jazz" ? "Brian" : "Jazz";
  const { v } = await searchParams;

  const items =
    role === "jazz"
      ? [
          { key: "jardin", href: "/tu", label: "jardín" },
          { key: "librero", href: "/tu?v=librero", label: "librero" },
          { key: "viajes", href: "/tu?v=viajes", label: "viajes" },
          // «deseos», not «sus deseos»: four tabs fit one line on a phone; the title says whose
          { key: "deseos", href: "/tu?v=deseos", label: "deseos" },
        ]
      : [
          { key: "deseos", href: "/tu", label: "sus deseos" },
          { key: "librero", href: "/tu?v=librero", label: "tu librero" },
          { key: "viajes", href: "/tu?v=viajes", label: "tus viajes" },
        ];
  const vista = items.some((i) => i.key === v) ? v! : items[0].key;
  const tabs = <Tabs label="colecciones" current={vista} items={items} />;

  if (vista === "jardin") {
    const [m, vueltas] = await Promise.all([loadMisiones().catch(() => null), loadVueltas(role).catch(() => [])]);
    return (
      <>
        <PageTitle icon={<Star className="size-7" />}>tu jardín</PageTitle>
        {tabs}
        <Garden misiones={m?.total ?? 0} vueltas={vueltas} mejorDia={m?.mejorDia ?? 0} />
      </>
    );
  }

  if (vista === "deseos") {
    const d = await loadDeseos(otro).catch(() => null);
    return (
      <>
        <PageTitle icon={<Star className="size-7" />}>sus deseos</PageTitle>
        {tabs}
        {d ? <Deseos deseos={d} nombre={nombreOtro} /> : <p className="mt-8 text-ink-soft">No pude leerlos. Vuelve a abrir en un momento.</p>}
      </>
    );
  }

  const c = await loadColeccion(role).catch(() => null);
  return (
    <>
      <PageTitle icon={<Star className="size-7" />}>{vista === "librero" ? "tu librero" : "tus viajes"}</PageTitle>
      {tabs}
      {!c ? (
        <p className="mt-8 text-ink-soft">No pude leer esta parte. Vuelve a abrir en un momento.</p>
      ) : vista === "librero" ? (
        <Librero libros={c.libros} aprendido={c.aprendido} otro={nombreOtro} />
      ) : (
        <Viajes viajes={c.viajes} otro={nombreOtro} />
      )}
    </>
  );
}
