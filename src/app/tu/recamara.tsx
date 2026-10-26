"use client";

import { type ReactNode, useEffect, useId, useRef, useState, useTransition } from "react";
import { deseoVisto, guardarDeseo, soltarElDeseo } from "@/app/actions";
import { Gato } from "@/components/gato";
import { Close, Plus } from "@/components/icons";
import { BALCON, Pensamiento, Recamara } from "@/components/recamara";
import { type Deseo, MAX_DESCRIPCION_DESEO, MAX_DESEO } from "@/lib/deseo";
import { type Mascota, NOMBRE_INICIAL } from "@/lib/objeto";
import { escenario } from "./cabecera";
import { MarcaEscena } from "@/components/marca-escena";

type Hoja = "libro" | "paloma" | "nuevo" | null;
const cuando = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", timeZone: "America/Mexico_City" });

// Her wishes, in her bedroom at night (Brian, 2026-10-25): her cat sits out on the balcony thinking;
// on the desk, under the lamp, the book where she writes what she wishes for — her room holds only
// her things (Brian, 2026-10-25: «es de ella»). When Brian sends her a wish, a dove lands
// on the railing with a little alert; she taps it, reads it, and it stays in her book «de Brian».
export function RecamaraDeseos({
  libro,
  gato = { nombre: NOMBRE_INICIAL, puestos: {} },
  cabecera,
}: {
  libro: Deseo[];
  gato?: Mascota;
  cabecera?: ReactNode;
}) {
  const sheet = useRef<HTMLDialogElement>(null);
  const titulo = useId();
  const [hoja, setHoja] = useState<Hoja>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // the wish the dove brings: the oldest one Brian sent that she has not opened
  const [leidos, setLeidos] = useState<string[]>([]);
  const porLeer = libro.filter((d) => d.de === "brian" && d.visto === null && !leidos.includes(d.id)).reverse();
  const carta = porLeer[0];
  const [abierta, setAbierta] = useState<Deseo | null>(null);
  const [vuela, setVuela] = useState(0);

  function abrir(h: Hoja) {
    setMsg(null);
    setHoja(h);
    if (!sheet.current?.open) sheet.current?.showModal();
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

  function leerPaloma() {
    if (!carta) return;
    setAbierta(carta);
    abrir("paloma");
    void deseoVisto(carta.id);
  }

  // once she closed the dove's sheet, the dove flies off (and the next one, if any, lands)
  useEffect(() => {
    if (hoja !== null || !abierta) return;
    const id = abierta.id;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing the letter sends the dove away
    setLeidos((l) => [...l, id]);
    setAbierta(null);
    setVuela((v) => v + 1);
  }, [hoja, abierta]);

  return (
    <div>
      <div data-escena="recamara" className={`rise ${escenario}`}>
      <MarcaEscena nombre="recamara" />
        <Recamara
          deseos={libro.length}
          paloma={!!carta}
          vuela={vuela}
          onLibro={() => abrir("libro")}
          onPaloma={leerPaloma}
          cielo={320}
          className="absolute inset-0 block h-full w-full"
        >
          <g transform={`translate(${BALCON.x} ${BALCON.y})`}>
            <g transform="scale(1.35)">
              <Gato puestos={gato.puestos} sentado />
            </g>
            <Pensamiento />
          </g>
        </Recamara>
        <div className="relative z-10 px-5 pt-[3.75rem] sm:px-8 lg:pt-6">
          {cabecera}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => abrir("nuevo")} className={botonCartel}>
              <Plus className="size-4" /> un deseo
            </button>
          </div>
        </div>
      </div>

      <p className="suelo mt-3 text-pretty text-sm text-ink-soft">
        Toca tu libro para ver tus deseos. Cuando llegue una paloma a tu balcón, tócala.
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

          {hoja === "libro" && (
            <section>
              <h2 id={titulo} className="t-display text-3xl">
                tu libro de deseos
              </h2>
              <p className="mt-1 text-sm text-ink-soft">{libro.length === 1 ? "un deseo" : `${libro.length} deseos`}</p>
              {libro.length === 0 ? (
                <p className="mt-5 text-pretty text-ink-soft">Todavía en blanco. Lo primero que desees va aquí.</p>
              ) : (
                <ul className="mt-5 space-y-3">
                  {libro.map((d) => (
                    <li key={d.id} className="rounded-2xl border border-line bg-surface-2/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{d.titulo}</p>
                          <p className="text-sm text-ink-soft">
                            {d.de === "brian" ? "llegó con una paloma · " : ""}
                            {cuando.format(d.at)}
                          </p>
                        </div>
                        {d.de === "jazz" && (
                          <button type="button" disabled={pending} onClick={() => run(() => soltarElDeseo(d.id))} className="press shrink-0 rounded-full px-2 py-1.5 text-xs font-medium text-ink-soft hover:text-ink">
                            soltar
                          </button>
                        )}
                      </div>
                      {d.descripcion && <p className="mt-2 whitespace-pre-line text-pretty leading-relaxed">{d.descripcion}</p>}
                      {d.enlace && (
                        <a href={d.enlace} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-sm font-semibold text-accent underline underline-offset-4">
                          {new URL(d.enlace).hostname.replace(/^www\./, "")}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={() => setHoja("nuevo")} className={`${boton} mt-5`}>
                <Plus className="size-4 text-accent" /> un deseo
              </button>
            </section>
          )}

          {hoja === "paloma" && abierta && (
            // the dove's letter: Brian's wish for her
            <article className="text-center">
              <p className="text-sm font-semibold text-accent">una paloma te trajo un deseo</p>
              <h2 id={titulo} className="t-display mt-3 text-pretty text-3xl leading-tight">
                {abierta.titulo}
              </h2>
              {abierta.descripcion && <p className="mt-4 whitespace-pre-line text-pretty text-lg leading-relaxed">{abierta.descripcion}</p>}
              {abierta.enlace && (
                <a href={abierta.enlace} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block break-all text-sm font-semibold text-accent underline underline-offset-4">
                  {new URL(abierta.enlace).hostname.replace(/^www\./, "")}
                </a>
              )}
              <p className="mt-5 text-sm text-ink-soft">se queda en tu libro de deseos</p>
            </article>
          )}

          {hoja === "nuevo" && <Nuevo titulo={titulo} pending={pending} run={run} cancel={cerrar} />}

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

const botonCartel =
  "press inline-flex items-center gap-1.5 rounded-lg border-[2.5px] border-[oklch(0.2_0.06_315)] bg-[oklch(0.92_0.13_92)] px-3 py-1.5 text-sm font-black text-[oklch(0.2_0.06_315)] shadow-[2px_2px_0_oklch(0.2_0.06_315)]";
const boton = "press inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-accent/60";
const accion = "press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50";
const field =
  "block w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-lg text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none";

// A wish: its title, what it is, a link — the last two optional. Brian's own form sends it as a dove.
export function Nuevo({
  titulo: tituloId,
  pending,
  run,
  cancel,
  paraJazz = false,
}: {
  titulo: string;
  pending: boolean;
  run: (op: () => Promise<{ ok: boolean; error: string | null }>) => void;
  cancel?: () => void;
  paraJazz?: boolean;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enlace, setEnlace] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => guardarDeseo(titulo, descripcion, enlace));
        if (paraJazz) {
          setTitulo("");
          setDescripcion("");
          setEnlace("");
        }
      }}
    >
      <h2 id={tituloId} className="t-display text-3xl">
        {paraJazz ? "mandarle un deseo" : "un deseo"}
      </h2>
      <p className="text-sm text-ink-soft">{paraJazz ? "le llega en una paloma a su balcón" : "se queda en tu libro de deseos"}</p>
      <input autoFocus={!paraJazz} required value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={MAX_DESEO} placeholder="el título" aria-label="título" className={field} />
      <textarea
        rows={3}
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        maxLength={MAX_DESCRIPCION_DESEO}
        placeholder="qué es, cómo te lo imaginas · opcional"
        aria-label="descripción"
        className={`${field} resize-y`}
      />
      <input value={enlace} onChange={(e) => setEnlace(e.target.value)} inputMode="url" maxLength={500} placeholder="una liga · opcional" aria-label="liga" className={field} />
      <div className="flex justify-end gap-2">
        {cancel && (
          <button type="button" onClick={cancel} className="press rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft hover:text-ink">
            cancelar
          </button>
        )}
        <button type="submit" disabled={!titulo.trim() || pending} className={accion}>
          {pending ? "guardando…" : paraJazz ? "mandarlo" : "guardar"}
        </button>
      </div>
    </form>
  );
}
