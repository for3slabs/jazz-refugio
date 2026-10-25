import { objetos, type Regalado } from "@/lib/objeto";
import { regalarObjeto } from "../actions";

// Brian's side of her pet: give an object now instead of waiting for her garden. He never sees
// her garden, so «ya lo tiene» is not his to know — a gift she already has changes nothing.
export function ObjetosBrian({ regalados }: { regalados: Regalado[] }) {
  const porRegalar = objetos.filter((o) => o.flores > 0);
  return (
    <section className="mt-12">
      <h2 className="t-label text-accent">regálale algo a su mascota</h2>
      <p className="mt-2 text-pretty text-sm text-ink-soft">
        Le llegan solos cuando su jardín crece. Si se lo regalas, puede ponérselo hoy.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3">
        {porRegalar.map((o) => {
          const dado = regalados.some((r) => r.id === o.id);
          return (
            <li key={o.id} className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-center">
              <p className="font-semibold">{o.nombre}</p>
              <p className="text-xs text-ink-soft">o con {o.flores} flores</p>
              {dado ? (
                <p className="t-label text-ink-soft">se lo regalaste</p>
              ) : (
                <form action={regalarObjeto}>
                  <input type="hidden" name="id" value={o.id} />
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
