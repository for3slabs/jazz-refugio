"use client";

import { useState, useTransition } from "react";
import { cambiarLibro, guardarAprendido, guardarLibro, soltarDelEstante } from "@/app/actions";
import { type Aprendido, type EstadoLibro, type Libro, MAX_NOTA, MAX_TITULO, lomo } from "@/lib/estante";

const SECCIONES: { estado: EstadoLibro; titulo: string }[] = [
  { estado: "leyendo", titulo: "leyendo" },
  { estado: "quiero", titulo: "quiero leer" },
  { estado: "leido", titulo: "leídos" },
];

// Her shelf: spines coloured by their title, grouped by where she is with each book.
// Tapping one opens it; nothing here counts what she has not done.
// `otro`: who sees the wishes — Brian on her shelf, Jazz on his.
export function Librero({ libros, aprendido, otro = "Brian" }: { libros: Libro[]; aprendido: Aprendido[]; otro?: string }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  const [form, setForm] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const libro = libros.find((l) => l.id === abierto);

  const run = (op: () => Promise<{ ok: boolean; error: string | null }>, after?: () => void) =>
    start(async () => {
      const r = await op();
      if (r.ok) after?.();
      else setMsg(r.error);
    });

  return (
    <div className="mt-6">
      <p className="text-sm text-ink-soft">{otro} ve tus «quiero leer» —solo los títulos— para regalarte.</p>
      <p role="status" className="min-h-6 text-sm text-ink-soft">
        {msg}
      </p>

      {libros.length === 0 && aprendido.length === 0 && (
        <p className="mt-2 text-pretty text-lg text-ink-soft">Tu librero está vacío. Agrega el libro que estás leyendo, o uno que quieras leer.</p>
      )}

      {SECCIONES.map(({ estado, titulo }) => {
        const lista = libros.filter((l) => l.estado === estado);
        if (!lista.length) return null;
        return (
          <section key={estado} className="mt-6">
            <h2 className="t-label text-accent">
              {titulo}
              {estado === "leido" && ` · ${lista.length}`}
            </h2>
            <div className="mt-3 flex flex-wrap items-end gap-1.5 border-b-4 border-line pb-0.5">
              {lista.map((l) => {
                const s = lomo(l.titulo);
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setAbierto(abierto === l.id ? null : l.id)}
                    aria-pressed={abierto === l.id}
                    aria-label={`${l.titulo}${l.autor ? `, de ${l.autor}` : ""}`}
                    className={`press h-36 rounded-t-md px-1 py-2 text-left transition-transform hover:-translate-y-1 ${abierto === l.id ? "-translate-y-2" : ""}`}
                    style={{ background: s.background, width: s.width }}
                  >
                    <span
                      className={`block h-full overflow-hidden text-xs font-semibold leading-none [writing-mode:vertical-rl] ${s.light ? "text-[#2b1b33]" : "text-[#fbf7fc]"}`}
                    >
                      {l.titulo}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {libro && (
        <article className="rise mt-5 rounded-3xl border border-line bg-surface p-5">
          <p className="t-label text-accent">{SECCIONES.find((s) => s.estado === libro.estado)?.titulo}</p>
          <h3 className="mt-2 text-xl font-semibold">{libro.titulo}</h3>
          {libro.autor && <p className="text-ink-soft">{libro.autor}</p>}
          {libro.nota && <p className="mt-3 whitespace-pre-line text-pretty leading-relaxed">«{libro.nota}»</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {libro.estado === "quiero" && (
              <button type="button" disabled={pending} onClick={() => run(() => cambiarLibro(libro.id, "leyendo"))} className={chip}>
                empecé a leerlo
              </button>
            )}
            {libro.estado === "leyendo" && (
              <button type="button" disabled={pending} onClick={() => run(() => cambiarLibro(libro.id, "leido"))} className={chip}>
                lo terminé
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => soltarDelEstante("libros", libro.id), () => setAbierto(null))}
              className="press t-label rounded-full px-3 py-2 text-ink-soft hover:text-ink"
            >
              soltar
            </button>
          </div>
        </article>
      )}

      {aprendido.length > 0 && (
        <section className="mt-8">
          <h2 className="t-label text-accent">lo que aprendí</h2>
          <ul className="mt-3 divide-y divide-line">
            {aprendido.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="font-semibold">{a.titulo}</p>
                  {a.donde && <p className="text-sm text-ink-soft">{a.donde}</p>}
                  {a.nota && <p className="mt-1 text-pretty text-ink-soft">{a.nota}</p>}
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => soltarDelEstante("aprendido", a.id))}
                  className="press t-label shrink-0 rounded-full px-2 py-1.5 text-ink-soft hover:text-ink"
                >
                  soltar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {form ? (
        <Agregar pending={pending} cancel={() => setForm(false)} run={run} />
      ) : (
        <button type="button" onClick={() => setForm(true)} className="press mt-8 w-full rounded-full border border-dashed border-line px-5 py-3 text-left text-ink-soft hover:border-accent/60 hover:text-ink">
          + agregar
        </button>
      )}
    </div>
  );
}

const chip = "press rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold hover:border-accent/60 disabled:opacity-50";
const field = "block w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-lg text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none";

function Agregar({
  pending,
  cancel,
  run,
}: {
  pending: boolean;
  cancel: () => void;
  run: (op: () => Promise<{ ok: boolean; error: string | null }>, after?: () => void) => void;
}) {
  const [tipo, setTipo] = useState<"libro" | "aprendi">("libro");
  const [titulo, setTitulo] = useState("");
  const [extra, setExtra] = useState("");
  const [estado, setEstado] = useState<EstadoLibro>("leyendo");
  const [nota, setNota] = useState("");

  return (
    <form
      className="rise mt-8 space-y-3 rounded-3xl border border-dashed border-line bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => (tipo === "libro" ? guardarLibro(titulo, extra, estado, nota) : guardarAprendido(titulo, extra, nota)), cancel);
      }}
    >
      <div className="flex gap-2" role="radiogroup" aria-label="qué agregas">
        {(["libro", "aprendi"] as const).map((t) => (
          <button key={t} type="button" role="radio" aria-checked={tipo === t} onClick={() => setTipo(t)} className={`${chip} ${tipo === t ? "!border-accent !bg-accent-soft" : ""}`}>
            {t === "libro" ? "libro" : "aprendí algo"}
          </button>
        ))}
      </div>
      <input autoFocus required value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={MAX_TITULO} placeholder={tipo === "libro" ? "el título" : "qué aprendiste"} aria-label="título" className={field} />
      <input value={extra} onChange={(e) => setExtra(e.target.value)} maxLength={MAX_TITULO} placeholder={tipo === "libro" ? "autor · opcional" : "dónde o cómo · opcional"} aria-label={tipo === "libro" ? "autor" : "dónde"} className={field} />
      {tipo === "libro" && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="estado">
          {SECCIONES.map((s) => (
            <button key={s.estado} type="button" role="radio" aria-checked={estado === s.estado} onClick={() => setEstado(s.estado)} className={`${chip} ${estado === s.estado ? "!border-accent !bg-accent-soft" : ""}`}>
              {s.titulo}
            </button>
          ))}
        </div>
      )}
      <textarea rows={2} value={nota} onChange={(e) => setNota(e.target.value)} maxLength={MAX_NOTA} placeholder="una nota · opcional" aria-label="nota" className={`${field} resize-y`} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={cancel} className="press t-label rounded-full px-3 py-2 text-ink-soft hover:text-ink">
          cancelar
        </button>
        <button type="submit" disabled={!titulo.trim() || pending} className="press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50">
          {pending ? "guardando…" : "guardar"}
        </button>
      </div>
    </form>
  );
}
