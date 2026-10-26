"use client";

import { type ReactNode, useEffect, useId, useRef, useState, useTransition } from "react";
import { cambiarLibro, guardarAprendido, guardarLibro, soltarDelEstante } from "@/app/actions";
import { Biblioteca, GATO_MESA, H_BIBLIO, PEDESTAL, acomodo, tapa } from "@/components/biblioteca";
import { Gato } from "@/components/gato";
import { Close, Plus } from "@/components/icons";
import { type Aprendido, type EstadoLibro, type Libro, MAX_NOTA, MAX_TITULO } from "@/lib/estante";
import { type Mascota, NOMBRE_INICIAL } from "@/lib/objeto";
import { escenario } from "./cabecera";

const ESTADOS: Record<EstadoLibro, string> = { leyendo: "leyendo", quiero: "quiero leer", leido: "leído" };
const when = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" });

type Hoja = { tipo: "libro"; id: string } | { tipo: "aprendi" } | { tipo: "nuevo-libro" } | { tipo: "nuevo-aprendi" } | null;
type Paso = { x: number; y: number; ms: number; sentado?: boolean; carga?: string | null; pluma?: boolean; alLlegar?: () => void };

const SUELO = H_BIBLIO - 12;

const quieto = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off";
const MESA_Y = GATO_MESA.y;

// Her library (Brian, 2026-10-25): the room is the shelf. Her cat sits on the table; tapping a book
// tells what she wrote about it, tapping the big book on the lectern opens what she learned. When
// a book is added — or changes state — the cat hops down, fetches it from the shelf and leaves it
// where it belongs; when she learns something, it walks to the lectern and writes it down. Without
// motion everything is simply in place.
// `otro`: who sees the wishes — Brian on her shelf, Jazz on his.
export function Librero({
  libros,
  aprendido,
  otro = "Brian",
  gato = { nombre: NOMBRE_INICIAL, puestos: {} },
  cabecera,
}: {
  libros: Libro[];
  aprendido: Aprendido[];
  otro?: string;
  gato?: Mascota;
  cabecera?: ReactNode;
}) {
  const sheet = useRef<HTMLDialogElement>(null);
  const titulo = useId();
  const [hoja, setHoja] = useState<Hoja>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // ── the cat's walks ──────────────────────────────────────────────────────────────────────
  const [pos, setPos] = useState({ x: GATO_MESA.x, y: MESA_Y });
  const [ms, setMs] = useState(0);
  const [sentado, setSentado] = useState(true);
  const [carga, setCarga] = useState<string | null>(null);
  const [pluma, setPluma] = useState(false);
  const [ocultos, setOcultos] = useState<Set<string>>(new Set());
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [vistos, setVistos] = useState(aprendido.length);
  // the walks waiting their turn: one route at a time, one step at a time
  const [rutas, setRutas] = useState<Paso[][]>([]);
  const [i, setI] = useState(0);
  const prev = useRef(new Map(libros.map((l) => [l.id, l.estado])));
  const prevAprendido = useRef(aprendido.length);

  useEffect(() => {
    const ruta = rutas[0];
    if (!ruta) return;
    const p = ruta[i];
    if (!p) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the route is over: the next one starts
      setRutas((r) => r.slice(1));
      setI(0);
      return;
    }
    setMs(p.ms);
    setPos({ x: p.x, y: p.y });
    setSentado(!!p.sentado);
    if (p.carga !== undefined) setCarga(p.carga);
    setPluma(!!p.pluma);
    const id = setTimeout(() => {
      p.alLlegar?.();
      setI((n) => n + 1);
    }, p.ms);
    return () => clearTimeout(id);
  }, [rutas, i]);

  // a book arrived or changed state: the cat fetches it from the shelf and leaves it in its place
  useEffect(() => {
    const cambiados = libros.filter((l) => prev.current.get(l.id) !== l.estado);
    prev.current = new Map(libros.map((l) => [l.id, l.estado]));
    if (cambiados.length === 0 || quieto()) return;
    const lugares = acomodo(libros);
    const nuevas: Paso[][] = [];
    for (const l of cambiados) {
      const p = lugares.get(l.id);
      if (!p) continue;
      const enMesa = p.y < MESA_Y + 20;
      const destino = { x: Math.min(Math.max(p.x + 26, 30), 300), y: enMesa ? MESA_Y : SUELO };
      nuevas.push([
        { x: 70, y: SUELO, ms: 420 },
        { x: 120, y: SUELO, ms: 520 },
        { x: 120, y: SUELO - 6, ms: 300, carga: tapa(l.titulo).color },
        { x: destino.x, y: enMesa ? SUELO : destino.y, ms: 620 },
        ...(enMesa ? [{ x: destino.x, y: destino.y, ms: 380 }] : []),
        {
          x: destino.x,
          y: destino.y,
          ms: 380,
          carga: null,
          alLlegar: () => {
            setOcultos((o) => {
              const n = new Set(o);
              n.delete(l.id);
              return n;
            });
            setNuevo(l.id);
          },
        },
        { x: GATO_MESA.x, y: MESA_Y, ms: 700, sentado: true },
      ]);
    }
    setOcultos((o) => new Set([...o, ...cambiados.map((l) => l.id)]));
    setRutas((r) => [...r, ...nuevas]);
  }, [libros]);

  // she learned something: the cat walks to the lectern and writes it in the big book
  useEffect(() => {
    const antes = prevAprendido.current;
    prevAprendido.current = aprendido.length;
    const n = aprendido.length;
    if (n <= antes || quieto()) {
      setVistos(n);
      return;
    }
    setRutas((r) => [
      ...r,
      [
        { x: 150, y: SUELO, ms: 480 },
        { x: PEDESTAL.x - 40, y: SUELO, ms: 640 },
        { x: PEDESTAL.x - 40, y: SUELO, ms: 1300, pluma: true, alLlegar: () => setVistos(n) },
        { x: GATO_MESA.x, y: MESA_Y, ms: 900, sentado: true },
      ],
    ]);
  }, [aprendido.length]);

  // ── sheets ───────────────────────────────────────────────────────────────────────────────
  function abrir(h: Hoja) {
    setMsg(null);
    setHoja(h);
    sheet.current?.showModal();
  }
  const cerrar = () => sheet.current?.close();
  const run = (op: () => Promise<{ ok: boolean; error: string | null }>, after?: () => void) =>
    start(async () => {
      const r = await op();
      if (r.ok) {
        after?.();
        cerrar();
      } else setMsg(r.error);
    });

  const libro = hoja?.tipo === "libro" ? libros.find((l) => l.id === hoja.id) : undefined;

  return (
    <div>
      {/* the room fills the screen above the doors; title, tabs and the two «＋» float on its wall */}
      <div data-escena className={`rise ${escenario}`}>
        <Biblioteca
          libros={libros}
          aprendidos={vistos}
          nuevo={nuevo}
          ocultos={ocultos}
          onLibro={(id) => abrir({ tipo: "libro", id })}
          onPedestal={() => abrir({ tipo: "aprendi" })}
          cielo={320}
          className="absolute inset-0 block h-full w-full"
        >
          <g style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transition: `transform ${ms}ms ease-in-out` }} aria-hidden>
            <g transform="scale(1.35)" className={pluma ? "gato-salto" : undefined}>
              <Gato puestos={gato.puestos} sentado={sentado} pluma={pluma} />
              {carga && (
                <g transform="translate(21 -37) rotate(-12) scale(0.7)">
                  <rect x="-15" y="-9" width="30" height="9" rx="1.5" fill={carga} stroke="oklch(0.2 0.06 315)" strokeWidth={1.6} />
                  <path d="M-13 -2.6 H 11" stroke="oklch(0.96 0.02 85)" strokeWidth={2.2} />
                </g>
              )}
            </g>
          </g>
        </Biblioteca>
        <div className="relative z-10 px-5 pt-[3.75rem] sm:px-8 lg:pt-6">
          {cabecera}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => abrir({ tipo: "nuevo-libro" })} className={botonCartel}>
              <Plus className="size-4" /> un libro
            </button>
            <button type="button" onClick={() => abrir({ tipo: "nuevo-aprendi" })} className={botonCartel}>
              <Plus className="size-4" /> algo que aprendí
            </button>
          </div>
        </div>
      </div>

      <p className="mt-3 text-pretty text-sm text-ink-soft">
        Toca un libro para leer lo que escribiste de él, o el libro grande para ver lo que aprendiste. {otro} ve tus «quiero leer» —solo
        los títulos— para regalarte.
      </p>
      <div aria-hidden className="h-16" />

      <dialog
        ref={sheet}
        aria-labelledby={titulo}
        onClose={() => setHoja(null)}
        onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
        className="sheet m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-y-auto rounded-t-[1.75rem] border border-b-0 border-line bg-surface p-0 text-ink backdrop:bg-transparent sm:mx-auto sm:max-w-md lg:m-auto lg:rounded-[1.75rem] lg:border-b"
      >
        <div className="px-6 pb-8 pt-4">
          <div className="flex justify-end">
            <button type="button" aria-label="cerrar" onClick={cerrar} className="press -mr-2 grid size-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink">
              <Close className="size-5" />
            </button>
          </div>

          {libro && (
            // the book as she described it
            <article>
              <div className="flex items-start gap-4">
                <span aria-hidden className="mt-1 h-20 w-14 shrink-0 rounded-md border-2 border-[oklch(0.2_0.06_315)]" style={{ background: tapa(libro.titulo).color }} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-accent">{ESTADOS[libro.estado]}</p>
                  <h2 id={titulo} className="t-display mt-1 text-pretty text-3xl leading-tight">
                    {libro.titulo}
                  </h2>
                  {libro.autor && <p className="mt-1 text-ink-soft">de {libro.autor}</p>}
                </div>
              </div>
              {libro.nota ? (
                <p className="mt-5 whitespace-pre-line text-pretty text-lg leading-relaxed">«{libro.nota}»</p>
              ) : (
                <p className="mt-5 text-pretty text-ink-soft">No le escribiste nada todavía.</p>
              )}
              <p className="mt-3 text-sm text-ink-soft">en tu biblioteca desde el {when.format(libro.at)}</p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {libro.estado === "quiero" && (
                  <button type="button" disabled={pending} onClick={() => run(() => cambiarLibro(libro.id, "leyendo"))} className={accion}>
                    empecé a leerlo
                  </button>
                )}
                {libro.estado === "leyendo" && (
                  <button type="button" disabled={pending} onClick={() => run(() => cambiarLibro(libro.id, "leido"))} className={accion}>
                    lo terminé
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => soltarDelEstante("libros", libro.id))}
                  className="press ml-auto rounded-full px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink"
                >
                  soltar
                </button>
              </div>
            </article>
          )}

          {hoja?.tipo === "aprendi" && (
            // the big book: everything she learned, newest first
            <section>
              <h2 id={titulo} className="t-display text-3xl">
                lo que aprendí
              </h2>
              <p className="mt-1 text-sm text-ink-soft">tu gato lo apunta en el libro grande</p>
              {aprendido.length === 0 ? (
                <p className="mt-5 text-pretty text-ink-soft">Todavía está en blanco. Lo primero que aprendas va aquí.</p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {aprendido.map((a) => (
                    <li key={a.id} className="rounded-2xl border border-line bg-surface-2/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{a.titulo}</p>
                          <p className="text-sm text-ink-soft">
                            {a.donde ? `${a.donde} · ` : ""}
                            {when.format(a.at)}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => start(async () => void (await soltarDelEstante("aprendido", a.id)))}
                          className="press shrink-0 rounded-full px-2 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
                        >
                          soltar
                        </button>
                      </div>
                      {a.nota && <p className="mt-2 text-pretty leading-relaxed">{a.nota}</p>}
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={() => setHoja({ tipo: "nuevo-aprendi" })} className={`${boton} mt-5`}>
                <Plus className="size-4 text-accent" /> algo que aprendí
              </button>
            </section>
          )}

          {(hoja?.tipo === "nuevo-libro" || hoja?.tipo === "nuevo-aprendi") && (
            <Agregar key={hoja.tipo} tipo={hoja.tipo === "nuevo-libro" ? "libro" : "aprendi"} gato={gato.nombre} titulo={titulo} pending={pending} run={run} cancel={cerrar} />
          )}

          {msg && (
            <p role="status" className="mt-3 text-sm text-ink-soft">
              {msg}
            </p>
          )}
        </div>
      </dialog>
    </div>
  );
}

// the two «＋» as comic labels on the library wall
const botonCartel =
  "press inline-flex items-center gap-1.5 rounded-lg border-[2.5px] border-[oklch(0.2_0.06_315)] bg-[oklch(0.92_0.13_92)] px-3 py-1.5 text-sm font-black text-[oklch(0.2_0.06_315)] shadow-[2px_2px_0_oklch(0.2_0.06_315)]";
const boton = "press inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-accent/60";
const accion = "press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50";
const chip = "press rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold hover:border-accent/60 disabled:opacity-50";
const field =
  "block w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-lg text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none";

// The form in the sheet: a book (title, author, where she is with it, what it is about) or
// something she learned. Saving closes the sheet and her cat takes it from there.
function Agregar({
  tipo,
  gato,
  titulo: tituloId,
  pending,
  run,
  cancel,
}: {
  tipo: "libro" | "aprendi";
  gato: string;
  titulo: string;
  pending: boolean;
  run: (op: () => Promise<{ ok: boolean; error: string | null }>) => void;
  cancel: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [extra, setExtra] = useState("");
  const [estado, setEstado] = useState<EstadoLibro>("leyendo");
  const [nota, setNota] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => (tipo === "libro" ? guardarLibro(titulo, extra, estado, nota) : guardarAprendido(titulo, extra, nota)));
      }}
    >
      <h2 id={tituloId} className="t-display text-3xl">
        {tipo === "libro" ? "un libro" : "algo que aprendí"}
      </h2>
      <p className="text-sm text-ink-soft">{tipo === "libro" ? `${gato} lo trae del estante y lo deja en su lugar` : `${gato} lo apunta en el libro grande`}</p>
      <input autoFocus required value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={MAX_TITULO} placeholder={tipo === "libro" ? "el título" : "qué aprendiste"} aria-label="título" className={field} />
      <input value={extra} onChange={(e) => setExtra(e.target.value)} maxLength={MAX_TITULO} placeholder={tipo === "libro" ? "autor · opcional" : "dónde o cómo · opcional"} aria-label={tipo === "libro" ? "autor" : "dónde"} className={field} />
      {tipo === "libro" && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="cómo vas con él">
          {(Object.keys(ESTADOS) as EstadoLibro[]).map((e) => (
            <button key={e} type="button" role="radio" aria-checked={estado === e} onClick={() => setEstado(e)} className={`${chip} ${estado === e ? "!border-accent !bg-accent-soft" : ""}`}>
              {ESTADOS[e]}
            </button>
          ))}
        </div>
      )}
      <textarea
        rows={3}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        maxLength={MAX_NOTA}
        placeholder={tipo === "libro" ? "de qué trata, o por qué lo quieres leer · opcional" : "una nota · opcional"}
        aria-label="nota"
        className={`${field} resize-y`}
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={cancel} className="press rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft hover:text-ink">
          cancelar
        </button>
        <button type="submit" disabled={!titulo.trim() || pending} className={accion}>
          {pending ? "guardando…" : "guardar"}
        </button>
      </div>
    </form>
  );
}
