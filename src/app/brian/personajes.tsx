import Image from "next/image";
import { personajes, sprite, type Regalado } from "@/lib/personaje";
import { regalarPersonaje } from "../actions";

// Brian's side of her characters: give one now instead of waiting for her garden. He never
// sees her garden, so «ya lo tiene» is not his to know — a gift she already has changes nothing.
export function PersonajesBrian({ regalados }: { regalados: Regalado[] }) {
  const porRegalar = personajes.filter((p) => p.flores > 0);
  return (
    <section className="mt-12">
      <h2 className="t-label text-accent">regálale un personaje</h2>
      <p className="mt-2 text-pretty text-sm text-ink-soft">
        Le llegan solos cuando su jardín crece. Si se lo regalas, aparece hoy entre sus personajes.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3">
        {porRegalar.map((p) => {
          const dado = regalados.some((r) => r.id === p.id);
          return (
            <li key={p.id} className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-4">
              <div className="carta-arte relative aspect-square w-full overflow-hidden rounded-xl">
                <Image src={sprite(p.id, null)} alt={p.nombre} fill sizes="160px" className="object-contain p-[12%]" />
              </div>
              <p className="font-semibold">{p.nombre}</p>
              {dado ? (
                <p className="t-label text-ink-soft">se lo regalaste</p>
              ) : (
                <form action={regalarPersonaje}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="press t-label rounded-full bg-accent px-4 py-2.5 text-accent-ink">
                    regalárselo
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
