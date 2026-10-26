"use client";

import { type ReactNode, useEffect, useId, useRef, useState, useTransition } from "react";
import { cambiarViaje, guardarViaje, soltarDelEstante } from "@/app/actions";
import { ASIENTO, Aeropuerto } from "@/components/aeropuerto";
import { Gato } from "@/components/gato";
import { Close, Plus } from "@/components/icons";
import { type Viaje, MAX_NOTA, MAX_TITULO } from "@/lib/estante";
import { type Mascota, NOMBRE_INICIAL } from "@/lib/objeto";
import { escenario } from "./cabecera";
import { MarcaEscena } from "@/components/marca-escena";

type Hoja = { tipo: "pasaporte" } | { tipo: "tablero" } | { tipo: "nuevo"; estado: "fui" | "quiero" } | null;

const dia = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const diaCorto = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" });

// Her days for a trip, in words: «del 3 de marzo al 9 de marzo de 2027», or the free text the first
// trips were written with.
function fechas(v: Viaje) {
  const d = v.desde ? dia.format(new Date(`${v.desde}T00:00:00Z`)) : null;
  const h = v.hasta ? dia.format(new Date(`${v.hasta}T00:00:00Z`)) : null;
  if (d && h && d !== h) return `del ${d} al ${h}`;
  if (d) return `el ${d}`;
  return v.cuando;
}

const quieto = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off";

// Her trips as an airport gate (Brian, 2026-10-25): her cat waits on the seats with its passport
// in its paw. The passport holds the places she has been, as airport stamps; the departures board
// holds the places she wants to go. Adding a wish sends a plane off the runway; adding a place she
// went makes her cat stamp the passport.
export function Viajes({
  viajes,
  gato = { nombre: NOMBRE_INICIAL, puestos: {} },
  cabecera,
}: {
  viajes: Viaje[];
  gato?: Mascota;
  cabecera?: ReactNode;
}) {
  const sheet = useRef<HTMLDialogElement>(null);
  const titulo = useId();
  const [hoja, setHoja] = useState<Hoja>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const quiero = viajes.filter((v) => v.estado === "quiero");
  const fui = viajes.filter((v) => v.estado === "fui");

  // a new wish: a plane takes off · a new place she went: her cat stamps the passport
  const [despegues, setDespegues] = useState(0);
  const [sello, setSello] = useState(0);
  const antes = useRef({ quiero: quiero.length, fui: fui.length });
  useEffect(() => {
    const a = antes.current;
    antes.current = { quiero: quiero.length, fui: fui.length };
    if (quieto()) return;
    if (quiero.length > a.quiero) setDespegues((n) => n + 1);
    if (fui.length > a.fui) setSello((n) => n + 1);
  }, [quiero.length, fui.length]);

  function abrir(h: Hoja) {
    setMsg(null);
    setElegido(null);
    setHoja(h);
    if (!sheet.current?.open) sheet.current?.showModal();
  }
  const cerrar = () => sheet.current?.close();
  const run = (op: () => Promise<{ ok: boolean; error: string | null }>) =>
    start(async () => {
      const r = await op();
      if (r.ok) cerrar();
      else setMsg(r.error);
    });

  // the stamp or flight she tapped, shown inside the passport or the board
  const [elegido, setElegido] = useState<string | null>(null);
  const viaje = viajes.find((v) => v.id === elegido);
  const detalle = viaje && (
    <Detalle
      v={viaje}
      pending={pending}
      onFui={() => run(() => cambiarViaje(viaje.id, "fui"))}
      onSoltar={() => run(() => soltarDelEstante("viajes", viaje.id))}
      onCerrar={() => setElegido(null)}
    />
  );

  return (
    <div>
      <div data-escena="aeropuerto" className={`rise ${escenario}`}>
      <MarcaEscena nombre="aeropuerto" />
        <Aeropuerto
          quiero={quiero}
          fui={fui.length}
          despegues={despegues}
          sello={sello}
          onTablero={() => abrir({ tipo: "tablero" })}
          onPasaporte={() => abrir({ tipo: "pasaporte" })}
          cielo={320}
          className="absolute inset-0 block h-full w-full"
        >
          <g transform={`translate(${ASIENTO.x} ${ASIENTO.y})`}>
            <g key={sello} transform="scale(1.35)" className={sello ? "gato-brinco" : undefined}>
              <Gato puestos={gato.puestos} sentado pasaporte />
            </g>
          </g>
        </Aeropuerto>
        <div className="relative z-10 px-5 pt-[3.75rem] sm:px-8 lg:pt-6">
          {cabecera}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => abrir({ tipo: "nuevo", estado: "quiero" })} className={botonCartel}>
              <Plus className="size-4" /> quiero ir a…
            </button>
            <button type="button" onClick={() => abrir({ tipo: "nuevo", estado: "fui" })} className={botonCartel}>
              <Plus className="size-4" /> fui a…
            </button>
          </div>
        </div>
      </div>

      <p className="suelo mt-3 text-pretty text-sm text-ink-soft">
        Toca el pasaporte para ver tus sellos, o la pantalla de salidas para tus próximos vuelos.
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

          {hoja?.tipo === "pasaporte" && (
            // the open passport: one airport stamp per place she has been
            <section>
              <h2 id={titulo} className="t-display text-3xl">
                tu pasaporte
              </h2>
              <p className="mt-1 text-sm text-ink-soft">{fui.length === 1 ? "un sello" : `${fui.length} sellos`} · toca uno para recordarlo</p>
              {viaje?.estado === "fui" && detalle}
              {fui.length === 0 ? (
                <p className="mt-5 text-pretty text-ink-soft">Todavía sin sellos. El primer lugar al que fuiste va aquí.</p>
              ) : (
                <ul className="mt-5 grid grid-cols-2 gap-3">
                  {fui.map((v, i) => (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => setElegido(elegido === v.id ? null : v.id)}
                        aria-pressed={elegido === v.id}
                        className={`press block w-full rounded-2xl ${elegido === v.id ? "bg-[oklch(0.92_0.13_92/0.35)]" : ""}`}
                        aria-label={v.lugar}
                      >
                        <Sello v={v} i={i} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={() => abrir({ tipo: "nuevo", estado: "fui" })} className={`${boton} mt-5`}>
                <Plus className="size-4 text-accent" /> fui a…
              </button>
            </section>
          )}

          {hoja?.tipo === "tablero" && (
            // the whole departures board: every place she wants to go
            <section>
              <h2 id={titulo} className="t-display text-3xl">
                salidas
              </h2>
              <p className="mt-1 text-sm text-ink-soft">{quiero.length === 1 ? "un vuelo" : `${quiero.length} vuelos`} que quieres tomar</p>
              {viaje?.estado === "quiero" && detalle}
              {quiero.length === 0 ? (
                <p className="mt-5 text-pretty text-ink-soft">La pantalla está vacía. Agrega el primer lugar al que quieres ir y despega.</p>
              ) : (
                <ul className="mt-5 overflow-hidden rounded-xl border-[3px] border-[oklch(0.2_0.06_315)] bg-[oklch(0.22_0.05_315)] font-mono">
                  {quiero.map((v, i) => (
                    <li key={v.id} className="border-b border-[oklch(0.35_0.05_315)] last:border-0">
                      <button
                        type="button"
                        onClick={() => setElegido(elegido === v.id ? null : v.id)}
                        aria-pressed={elegido === v.id}
                        className={`press flex w-full items-center gap-3 px-3 py-3 text-left ${elegido === v.id ? "bg-[oklch(0.32_0.06_315)]" : ""}`}
                      >
                        <span className="shrink-0 text-xs font-bold text-[oklch(0.92_0.13_92)]">JZ {101 + i}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold uppercase text-[oklch(0.97_0.02_330)]">{v.lugar}</span>
                          {(v.desde || v.cuando) && (
                            <span className="block truncate text-xs text-[oklch(0.8_0.05_320)]">
                              {v.desde ? diaCorto.format(new Date(`${v.desde}T00:00:00Z`)) : v.cuando}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-[0.625rem] font-bold text-[oklch(0.8_0.15_150)]">A TIEMPO</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={() => abrir({ tipo: "nuevo", estado: "quiero" })} className={`${boton} mt-5`}>
                <Plus className="size-4 text-accent" /> quiero ir a…
              </button>
            </section>
          )}

          {hoja?.tipo === "nuevo" && <Nuevo key={hoja.estado} estado={hoja.estado} titulo={titulo} pending={pending} run={run} cancel={cerrar} gato={gato.nombre} />}

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

// One trip as she wrote it — shown inside the passport or the board, under the title, so tapping a
// stamp or a flight never takes the passport away (Brian, 2026-10-25: «le picas al sello y
// desaparece, eso no queremos»).
function Detalle({ v, pending, onFui, onSoltar, onCerrar }: { v: Viaje; pending: boolean; onFui: () => void; onSoltar: () => void; onCerrar: () => void }) {
  return (
    <article className="rise mt-4 rounded-2xl border-[2.5px] border-[oklch(0.2_0.06_315)] bg-[oklch(0.995_0.005_330)] p-4 shadow-[3px_3px_0_oklch(0.2_0.06_315)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-accent">{v.estado === "fui" ? "fuiste" : "quieres ir"}</p>
          <h3 className="t-display mt-0.5 text-pretty text-2xl leading-tight">{v.lugar}</h3>
          {fechas(v) && <p className="mt-0.5 text-sm text-ink-soft">{fechas(v)}</p>}
        </div>
        <button type="button" aria-label="cerrar este viaje" onClick={onCerrar} className="press -mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:text-ink">
          <Close className="size-4" />
        </button>
      </div>
      {v.nota ? (
        <p className="mt-3 whitespace-pre-line text-pretty leading-relaxed">«{v.nota}»</p>
      ) : (
        <p className="mt-3 text-pretty text-sm text-ink-soft">No le escribiste nada todavía.</p>
      )}
      {v.enlace && (
        <a href={v.enlace} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-sm font-semibold text-accent underline underline-offset-4">
          {new URL(v.enlace).hostname.replace(/^www\./, "")}
        </a>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {v.estado === "quiero" && (
          <button type="button" disabled={pending} onClick={onFui} className={accion}>
            ¡ya fui!
          </button>
        )}
        <button type="button" disabled={pending} onClick={onSoltar} className="press ml-auto rounded-full px-3 py-2 text-sm font-medium text-ink-soft hover:text-ink">
          soltar
        </button>
      </div>
    </article>
  );
}

// An airport stamp in its own ink: a circle, a box or a ticket, tilted, the place in capitals and its
// date — each place keeps its shape and colour.
const TINTAS = ["oklch(0.5 0.2 340)", "oklch(0.48 0.18 310)", "oklch(0.55 0.17 25)", "oklch(0.52 0.12 140)", "oklch(0.55 0.14 60)"];
function Sello({ v, i }: { v: Viaje; i: number }) {
  let h = 0;
  for (const c of v.lugar) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const tinta = TINTAS[h % TINTAS.length];
  const forma = h % 3;
  const giro = ((h >> 3) % 17) - 8;
  const fecha = v.desde ? diaCorto.format(new Date(`${v.desde}T00:00:00Z`)).toUpperCase() : v.cuando.toUpperCase().slice(0, 14);
  const lugar = v.lugar.toUpperCase();
  return (
    <svg viewBox="0 0 140 110" className="w-full" style={{ transform: `rotate(${giro + (i % 2 ? 3 : -3)}deg)` }} aria-hidden>
      {forma === 0 ? (
        <>
          <circle cx="70" cy="55" r="48" fill="none" stroke={tinta} strokeWidth={4} />
          <circle cx="70" cy="55" r="40" fill="none" stroke={tinta} strokeWidth={1.6} />
        </>
      ) : forma === 1 ? (
        <>
          <rect x="10" y="14" width="120" height="82" rx="8" fill="none" stroke={tinta} strokeWidth={4} />
          <rect x="17" y="21" width="106" height="68" rx="5" fill="none" stroke={tinta} strokeWidth={1.6} />
        </>
      ) : (
        <path d="M14 20 H 126 V 44 A 11 11 0 0 0 126 66 V 90 H 14 V 66 A 11 11 0 0 0 14 44Z" fill="none" stroke={tinta} strokeWidth={4} />
      )}
      <text x="70" y="36" textAnchor="middle" fontSize="9" fontWeight="800" letterSpacing="2" fill={tinta}>
        {v.estado === "fui" ? "LLEGADA" : "SALIDA"}
      </text>
      <text x="70" y="62" textAnchor="middle" fontSize={lugar.length > 10 ? 11 : 15} fontWeight="900" fill={tinta}>
        {lugar.slice(0, 16)}
      </text>
      {fecha && (
        <text x="70" y="80" textAnchor="middle" fontSize="9" fontWeight="700" fill={tinta}>
          {fecha}
        </text>
      )}
      <path d="M40 87 l 4 -3 4 3 4 -3 4 3" fill="none" stroke={tinta} strokeWidth={1.2} opacity={0.7} />
    </svg>
  );
}

// the two «＋» as comic labels on the terminal wall
const botonCartel =
  "press inline-flex items-center gap-1.5 rounded-lg border-[2.5px] border-[oklch(0.2_0.06_315)] bg-[oklch(0.92_0.13_92)] px-3 py-1.5 text-sm font-black text-[oklch(0.2_0.06_315)] shadow-[2px_2px_0_oklch(0.2_0.06_315)]";
const boton = "press inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold hover:border-accent/60";
const accion = "press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50";
const field =
  "block w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-lg text-ink placeholder:text-ink-soft/70 focus:border-accent focus:outline-none";

// The form: the place, its days on a calendar, a note, a link — all but the place optional.
function Nuevo({
  estado,
  titulo: tituloId,
  pending,
  run,
  cancel,
  gato,
}: {
  estado: "fui" | "quiero";
  titulo: string;
  pending: boolean;
  run: (op: () => Promise<{ ok: boolean; error: string | null }>) => void;
  cancel: () => void;
  gato: string;
}) {
  const [lugar, setLugar] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [nota, setNota] = useState("");
  const [enlace, setEnlace] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => guardarViaje(lugar, "", estado, nota, desde, hasta, enlace));
      }}
    >
      <h2 id={tituloId} className="t-display text-3xl">
        {estado === "quiero" ? "quiero ir a…" : "fui a…"}
      </h2>
      <p className="text-sm text-ink-soft">{estado === "quiero" ? "al guardarlo despega un avión" : `${gato} lo sella en tu pasaporte`}</p>
      <input autoFocus required value={lugar} onChange={(e) => setLugar(e.target.value)} maxLength={MAX_TITULO} placeholder="el lugar" aria-label="lugar" className={field} />
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm font-semibold">
          {estado === "quiero" ? "ida" : "llegué"}
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={`${field} mt-1 !text-base`} />
        </label>
        <label className="text-sm font-semibold">
          {estado === "quiero" ? "regreso" : "me fui"}
          <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className={`${field} mt-1 !text-base`} />
        </label>
      </div>
      <textarea rows={3} value={nota} onChange={(e) => setNota(e.target.value)} maxLength={MAX_NOTA} placeholder="una nota · opcional" aria-label="nota" className={`${field} resize-y`} />
      <input value={enlace} onChange={(e) => setEnlace(e.target.value)} inputMode="url" maxLength={500} placeholder="una liga · opcional" aria-label="liga" className={field} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={cancel} className="press rounded-full px-4 py-2.5 text-sm font-medium text-ink-soft hover:text-ink">
          cancelar
        </button>
        <button type="submit" disabled={!lugar.trim() || pending} className={accion}>
          {pending ? "guardando…" : "guardar"}
        </button>
      </div>
    </form>
  );
}
