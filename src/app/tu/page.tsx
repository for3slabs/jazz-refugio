import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Star } from "@/components/icons";
import { Tabs } from "@/components/tabs";
import { deseos, loadColeccion } from "@/lib/coleccion";
import { loadMisiones } from "@/lib/misiones";
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

// Her own space: the garden, her shelf, her trips. Brian sees only her wishes, to give her gifts.
async function Content({ searchParams }: { searchParams: Search }) {
  const role = await currentRole();
  if (!role) redirect("/entrar");
  if (role === "brian") {
    const c = await loadColeccion().catch(() => null);
    return (
      <>
        <PageTitle icon={<Star className="size-7" />}>sus deseos</PageTitle>
        {c ? <Deseos deseos={deseos(c)} /> : <p className="mt-8 text-ink-soft">No pude leerlos. Vuelve a abrir en un momento.</p>}
      </>
    );
  }

  const { v } = await searchParams;
  const vista = v === "librero" || v === "viajes" ? v : "jardin";
  const tabs = (
    <Tabs
      label="tú"
      current={vista}
      items={[
        { key: "jardin", href: "/tu", label: "jardín" },
        { key: "librero", href: "/tu?v=librero", label: "librero" },
        { key: "viajes", href: "/tu?v=viajes", label: "viajes" },
      ]}
    />
  );

  if (vista === "jardin") {
    const m = await loadMisiones().catch(() => null);
    return (
      <>
        <PageTitle icon={<Star className="size-7" />}>tu jardín</PageTitle>
        {tabs}
        <Garden misiones={m?.total ?? 0} mejorDia={m?.mejorDia ?? 0} />
      </>
    );
  }

  const c = await loadColeccion().catch(() => null);
  return (
    <>
      <PageTitle icon={<Star className="size-7" />}>{vista === "librero" ? "tu librero" : "tus viajes"}</PageTitle>
      {tabs}
      {!c ? (
        <p className="mt-8 text-ink-soft">No pude leer esta parte. Vuelve a abrir en un momento.</p>
      ) : vista === "librero" ? (
        <Librero libros={c.libros} aprendido={c.aprendido} />
      ) : (
        <Viajes viajes={c.viajes} />
      )}
    </>
  );
}
