import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageTitle, Shell } from "@/components/shell";
import { Star } from "@/components/icons";
import { Tabs } from "@/components/tabs";
import { loadColeccion, loadDeseos } from "@/lib/coleccion";
import { loadMisiones } from "@/lib/misiones";
import { loadVueltas } from "@/lib/vueltas";
import { loadFloresVistas } from "@/lib/jardin";
import { loadMascota } from "@/lib/mascota";
import { currentRole } from "@/lib/session";
import { Deseos } from "./deseos";
import { Garden, MasDelJardin } from "./garden";
import { Librero } from "./librero";
import { Cabecera } from "./cabecera";
import { RecamaraDeseos } from "./recamara";
import { SuLibro } from "./su-libro";
import { loadLibroDeseos } from "@/lib/deseos";
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
    // her pet walks into the garden to plant what she has not seen grow yet (0013)
    const [m, vueltas, vistas, gato] = await Promise.all([
      loadMisiones().catch(() => null),
      loadVueltas(role).catch(() => []),
      loadFloresVistas().catch(() => null),
      loadMascota().catch(() => undefined),
    ]);
    return (
      <Garden
        misiones={m?.total ?? 0}
        vueltas={vueltas}
        mejorDia={m?.mejorDia ?? 0}
        vistas={vistas}
        gato={gato}
        cabecera={
          <Cabecera titulo="tu jardín" items={items} current={vista} aside={<MasDelJardin misiones={m?.total ?? 0} vueltas={vueltas} />} />
        }
      />
    );
  }

  if (vista === "deseos") {
    // hers: her bedroom at night, the book of her wishes, the dove
    if (role === "jazz") {
      const [libro, gato] = await Promise.all([loadLibroDeseos("jazz").catch(() => []), loadMascota().catch(() => undefined)]);
      return <RecamaraDeseos libro={libro} gato={gato} cabecera={<Cabecera titulo="tus deseos" items={items} current={vista} />} />;
    }
    // his: her book of wishes (to give), the dove he sends, and her books and trips she wants
    const [d, libro] = await Promise.all([loadDeseos(otro).catch(() => null), loadLibroDeseos("brian").catch(() => [])]);
    return (
      <>
        <PageTitle icon={<Star className="size-7" />}>sus deseos</PageTitle>
        {tabs}
        <SuLibro libro={libro.map((d) => ({ ...d, visto: null }))} />
        {d ? <Deseos deseos={d} nombre={nombreOtro} /> : <p className="mt-8 text-ink-soft">No pude leerlos. Vuelve a abrir en un momento.</p>}
      </>
    );
  }

  const [c, gato] = await Promise.all([loadColeccion(role).catch(() => null), loadMascota().catch(() => undefined)]);
  // the library is a scene of its own: its title and tabs ride on its wall
  if (vista === "librero" && c) {
    return <Librero libros={c.libros} aprendido={c.aprendido} gato={gato} cabecera={<Cabecera titulo="tu librero" items={items} current={vista} />} />;
  }
  // and the airport, for her trips
  if (vista === "viajes" && c) {
    return <Viajes viajes={c.viajes} gato={gato} cabecera={<Cabecera titulo="tus viajes" items={items} current={vista} />} />;
  }
  return (
    <>
      <PageTitle icon={<Star className="size-7" />}>{vista === "librero" ? "tu librero" : "tus viajes"}</PageTitle>
      {tabs}
      {!c ? (
        <p className="mt-8 text-ink-soft">No pude leer esta parte. Vuelve a abrir en un momento.</p>
      ) : vista === "librero" ? (
        <Librero libros={c.libros} aprendido={c.aprendido} gato={gato} />
      ) : (
        <Viajes viajes={c.viajes} />
      )}
    </>
  );
}
