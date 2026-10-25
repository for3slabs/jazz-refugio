"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import {
  type EstadoResult,
  agregarPaso,
  anotar,
  borrarMeta,
  borrarPaso,
  crearMeta,
  cumplirPaso,
  editarLaMeta,
  ideaAHoy,
  ideaAMeta,
  pasoAHoy,
  recuperarSoltado,
  soltarIdea,
} from "@/app/actions";
import { Confetti } from "@/components/confetti";
import { Flower } from "@/components/flower";
import { ArrowLeft, ArrowRight, Check, Chevron, More, Pencil, Plus, Trash } from "@/components/icons";
import { LoSoltado } from "@/components/soltado";
import { MAX_TEXTO } from "@/lib/mision";
import { type Enlace, type Idea, type Meta, MAX_DESCRIPCION_META, MAX_METAS, MAX_PASOS, cuando, siguiente, terminada } from "@/lib/pendiente";
import type { Soltado } from "@/lib/soltado";
import { AsistenteBoton } from "./asistente";
import { PartirEnPasos } from "./ayudantes";

type View = { mente: Idea[]; metas: Meta[] };
type Change =
  | { k: "idea+"; i: Idea }
  | { k: "idea-"; id: string }
  | { k: "meta+"; m: Meta }
  | { k: "meta-"; id: string }
  | { k: "meta~"; id: string; titulo: string; descripcion: string | null; para: string | null; enlace: Enlace | null }
  | { k: "paso+"; meta: string; id: string; texto: string }
  | { k: "paso"; meta: string; id: string; to: "hecho" | "enHoy" | "fuera" };

function apply(v: View, c: Change): View {
  switch (c.k) {
    case "idea+":
      return { ...v, mente: [c.i, ...v.mente] };
    case "idea-":
      return { ...v, mente: v.mente.filter((i) => i.id !== c.id) };
    case "meta+":
      return { ...v, metas: [c.m, ...v.metas] };
    case "meta-":
      return { ...v, metas: v.metas.filter((m) => m.id !== c.id) };
    case "meta~":
      return {
        ...v,
        metas: v.metas.map((m) => (m.id === c.id ? { ...m, titulo: c.titulo, descripcion: c.descripcion, para: c.para, enlace: c.enlace } : m)),
      };
    case "paso+":
      return {
        ...v,
        metas: v.metas.map((m) =>
          m.id === c.meta ? { ...m, pasos: [...m.pasos, { id: c.id, texto: c.texto, hecho: null, enHoy: false }] } : m,
        ),
      };
    case "paso":
      return {
        ...v,
        metas: v.metas.map((m) =>
          m.id !== c.meta
            ? m
            : {
                ...m,
                pasos:
                  c.to === "fuera"
                    ? m.pasos.filter((p) => p.id !== c.id)
                    : m.pasos.map((p) =>
                        p.id !== c.id ? p : c.to === "hecho" ? { ...p, hecho: Date.now(), enHoy: false } : { ...p, enHoy: true },
                      ),
              },
        ),
      };
  }
}

const tmp = () => `nuevo-${Date.now()}`;

// What shows of a link while its preview is being read: the same link, its site, no image yet.
// The same link as before keeps the preview it already had.
function enlaceProvisional(url: string | null, antes: Enlace | null): Enlace | null {
  if (!url) return null;
  const href = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
  if (antes && antes.url === href) return antes;
  try {
    return { url: href, titulo: null, imagen: null, sitio: new URL(href).hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}
const VISIBLES_MENTE = 5;

// «Más adelante», shaped like «hoy» (Brian, 2026-10-25): her goals first — what gives the day a
// direction — then what she does not want to forget, each one compact list; what is finished or let
// go folds into «historial». A goal opens right here, without a trip to the server, and its
// assistant offers to split it into steps. Changes show at once; a failed save puts things back.
export function Later({
  mente,
  metas,
  abierta: inicial,
  hoyLleno,
  soltado,
}: View & { abierta: string | null; hoyLleno: boolean; soltado: Soltado[] }) {
  const [view, change] = useOptimistic<View, Change>({ mente, metas }, apply);
  const [, start] = useTransition();
  const [abierta, setAbierta] = useState(inicial);
  // `undo`: what she just let go, offered back for a few seconds
  const [msg, setMsg] = useState<{ text: string; ok: boolean; undo?: { tipo: "idea" | "meta" | "paso"; id: string } } | null>(null);
  const [party, setParty] = useState(0);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), msg.undo ? 8000 : 2800);
    return () => clearTimeout(id);
  }, [msg]);

  function run(c: Change | null, op: () => Promise<EstadoResult>, ok?: string, undo?: { tipo: "idea" | "meta" | "paso"; id: string; texto: string }) {
    start(async () => {
      if (c) change(c);
      const r = await op();
      if (!r.ok) setMsg({ text: r.error ?? "", ok: false });
      else if (undo) setMsg({ text: `«${undo.texto}» se soltó`, ok: true, undo: { tipo: undo.tipo, id: undo.id } });
      else if (ok) setMsg({ text: ok, ok: true });
    });
  }

  function deshacer(u: { tipo: "idea" | "meta" | "paso"; id: string }) {
    setMsg(null);
    start(async () => {
      const r = await recuperarSoltado(u.tipo, u.id);
      if (!r.ok) setMsg({ text: r.error ?? "", ok: false });
    });
  }

  function celebrate(text: string) {
    setParty((p) => p + 1);
    setMsg({ text, ok: true });
  }

  // Opening a goal is instant: the address follows, so a reload lands in the same place.
  function abrir(id: string | null) {
    setAbierta(id);
    window.history.replaceState(null, "", id ? `/misiones?v=despues&meta=${id}` : "/misiones?v=despues");
    window.scrollTo({ top: 0 });
  }

  const meta = abierta ? view.metas.find((m) => m.id === abierta) : undefined;

  return (
    <div className="relative">
      {party > 0 && <Confetti key={party} />}
      {msg && (
        <p role="status" className="mt-4 text-sm text-ink-soft">
          <span key={msg.text + party} className="rise inline-flex items-center gap-2">
            {msg.ok && party > 0 && !msg.undo && <Flower n={party + 3} className="size-5" />}
            {msg.text}
            {msg.undo && (
              <button type="button" onClick={() => deshacer(msg.undo!)} className="press rounded-full border border-line px-3 py-1 text-xs font-medium text-ink hover:border-accent/60">
                deshacer
              </button>
            )}
          </span>
        </p>
      )}
      {meta ? (
        <Goal key={meta.id} meta={meta} hoyLleno={hoyLleno} run={run} celebrate={celebrate} cerrar={() => abrir(null)} />
      ) : (
        <List view={view} hoyLleno={hoyLleno} run={run} abrir={abrir} soltado={soltado} />
      )}
    </div>
  );
}

type Run = (
  c: Change | null,
  op: () => Promise<EstadoResult>,
  ok?: string,
  undo?: { tipo: "idea" | "meta" | "paso"; id: string; texto: string },
) => void;

function Dots({ meta }: { meta: Meta }) {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {meta.pasos.map((p) => (
        <span key={p.id} className={`size-1.5 rounded-full ${p.hecho ? "bg-accent" : "border border-ink-soft/60"}`} />
      ))}
    </span>
  );
}

// «●●○○ 2 de 4 pasos · para el sáb 1 nov» — the one line that says where a goal stands.
function Estado({ meta }: { meta: Meta }) {
  const hechos = meta.pasos.filter((p) => p.hecho).length;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
      {meta.pasos.length > 0 ? (
        <>
          <Dots meta={meta} />
          {hechos} de {meta.pasos.length} {meta.pasos.length === 1 ? "paso" : "pasos"}
        </>
      ) : (
        "sin pasos todavía"
      )}
      {meta.para && <span>· para {cuando(meta.para)}</span>}
    </p>
  );
}

const lista = "divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface";
const campo = "min-w-0 flex-1 bg-transparent py-1.5 placeholder:text-ink-soft focus:outline-none";

function List({
  view,
  hoyLleno,
  run,
  abrir,
  soltado,
}: {
  view: View;
  hoyLleno: boolean;
  run: Run;
  abrir: (id: string) => void;
  soltado: Soltado[];
}) {
  const [idea, setIdea] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const [todas, setTodas] = useState(false);
  const [nueva, setNueva] = useState(false);
  const [pagina, setPagina] = useState<"metas" | "mente">("metas");
  const activas = view.metas.filter((m) => !terminada(m));
  const hechas = view.metas.filter(terminada);
  const mente = todas ? view.mente : view.mente.slice(0, VISIBLES_MENTE);

  function capture(e: React.FormEvent) {
    e.preventDefault();
    const t = idea.trim();
    if (!t) return;
    setIdea("");
    run({ k: "idea+", i: { id: tmp(), texto: t, at: Date.now() } }, () => anotar(t));
  }

  return (
    <>
      {/* Two pages side by side, like an open book: one name lit and underlined, a tap turns to
          the other — nothing stacks downwards (Brian, 2026-10-25). */}
      <div role="tablist" aria-label="más adelante" className="mt-8 flex items-end gap-6">
        {(
          [
            ["metas", "tus metas"],
            ["mente", "en tu mente"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={pagina === k}
            onClick={() => setPagina(k)}
            className={`press -mb-px border-b-2 pb-1 text-lg font-semibold transition-colors ${
              pagina === k ? "border-accent text-ink" : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-pretty text-sm text-ink-soft">{pagina === "metas" ? "lo grande, en pasos pequeños" : "lo que no quieres olvidar"}</p>

      <div role="tabpanel" hidden={pagina !== "metas"}>
        <ul className={`mt-3 ${lista}`}>
          {activas.map((m, i) => (
            <li key={m.id} className="rise" style={{ animationDelay: `${Math.min(i, 4) * 40}ms` }}>
              <button type="button" onClick={() => abrir(m.id)} className="press flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-pretty font-medium leading-snug">{m.titulo}</span>
                  {m.descripcion && <span className="mt-0.5 block truncate text-sm text-ink-soft">{m.descripcion}</span>}
                  <span className="mt-1.5 block">
                    <Estado meta={m} />
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-ink-soft" />
              </button>
            </li>
          ))}
          <li>
            {activas.length >= MAX_METAS ? (
              <p className="px-4 py-3.5 text-pretty text-sm text-ink-soft">Tienes {MAX_METAS} metas. Termina o suelta una primero.</p>
            ) : nueva ? (
              <MetaForm
                onCancel={() => setNueva(false)}
                onSave={(titulo, descripcion, para, url) => {
                  setNueva(false);
                  run(
                    { k: "meta+", m: { id: tmp(), titulo, descripcion, para, at: Date.now(), pasos: [], enlace: enlaceProvisional(url, null) } },
                    () => crearMeta(titulo, para, descripcion, url),
                  );
                }}
              />
            ) : (
              <button type="button" onClick={() => setNueva(true)} className="press flex min-h-14 w-full items-center gap-3 px-4 text-left text-ink-soft hover:bg-surface-2 hover:text-ink">
                <Plus className="size-5 text-accent" />
                nueva meta
              </button>
            )}
          </li>
        </ul>
      </div>

      <div role="tabpanel" hidden={pagina !== "mente"}>
        <ul className={`mt-3 ${lista}`}>
          <li>
            <form onSubmit={capture} className="flex min-h-14 items-center gap-3 py-2 pl-4 pr-2 focus-within:bg-surface-2">
              <label htmlFor="idea" className="sr-only">
                anotar algo
              </label>
              <input
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                maxLength={240}
                placeholder="algo para no olvidar…"
                autoComplete="off"
                style={{ boxShadow: "none" }}
                className={campo}
              />
              {idea.trim() && (
                <button type="submit" className="rise press shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
                  anotar
                </button>
              )}
            </form>
          </li>
          {mente.map((i) => (
            <li key={i.id}>
              <div className="flex min-h-12 items-center gap-3 py-1.5 pl-4 pr-1">
                <p className="flex-1 text-pretty">{i.texto}</p>
                <button
                  type="button"
                  aria-expanded={menu === i.id}
                  aria-label={`opciones: ${i.texto}`}
                  onClick={() => setMenu(menu === i.id ? null : i.id)}
                  className="press grid size-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
                >
                  <More className="size-5" />
                </button>
              </div>
              {menu === i.id && (
                <div className="rise flex flex-wrap items-center gap-2 px-4 pb-3">
                  <Chip disabled={hoyLleno} onClick={() => run({ k: "idea-", id: i.id }, () => ideaAHoy(i.id), "listo, está en hoy")}>
                    {hoyLleno ? "hoy está lleno" : "a hoy"}
                  </Chip>
                  <Chip disabled={activas.length >= MAX_METAS} onClick={() => run({ k: "idea-", id: i.id }, () => ideaAMeta(i.id), "listo, ahora es una meta")}>
                    hacerla meta
                  </Chip>
                  <button
                    type="button"
                    onClick={() => run({ k: "idea-", id: i.id }, () => soltarIdea(i.id), undefined, { tipo: "idea", id: i.id, texto: i.texto })}
                    className="press ml-auto rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
                  >
                    soltar
                  </button>
                </div>
              )}
            </li>
          ))}
          {/* a long list stays short until she asks — five, then «ver las N» */}
          {!todas && view.mente.length > VISIBLES_MENTE && (
            <li>
              <button type="button" onClick={() => setTodas(true)} className="press flex min-h-12 w-full items-center px-4 text-left text-sm text-ink-soft hover:bg-surface-2 hover:text-ink">
                ver las {view.mente.length}
              </button>
            </li>
          )}
        </ul>
      </div>

      {(hechas.length > 0 || soltado.length > 0) && <Historial hechas={hechas} soltado={soltado} />}
      {/* room under the last line, so the assistant's floating button never sits on it */}
      <div aria-hidden className="h-16" />
    </>
  );
}

// The same fold as «hoy»: one quiet line, and inside the goals she finished and what she let go.
function Historial({ hechas, soltado }: { hechas: Meta[]; soltado: Soltado[] }) {
  return (
    <details className="group mt-8">
      <summary className="press flex cursor-pointer list-none items-center gap-2.5 rounded-2xl py-2 [&::-webkit-details-marker]:hidden">
        <span className="font-semibold">historial</span>
        <Flower n={hechas.length + 1} className="size-5" />
        <Chevron className="ml-auto size-5 text-ink-soft transition-transform duration-200 group-open:rotate-180" />
      </summary>
      {hechas.length > 0 && (
        <section className="mt-3">
          <h3 className="text-sm font-semibold">metas cumplidas · {hechas.length}</h3>
          <ul className="mt-2 space-y-2 border-l border-line pl-4">
            {hechas.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <Check className="size-4 shrink-0 text-accent" />
                {m.titulo}
              </li>
            ))}
          </ul>
        </section>
      )}
      <LoSoltado items={soltado} bare />
    </details>
  );
}

// Name, a line more, a date and a link — creating a goal, or editing it from its detail.
function MetaForm({
  inicial,
  onSave,
  onCancel,
}: {
  inicial?: Meta;
  onSave: (titulo: string, descripcion: string | null, para: string | null, url: string | null) => void;
  onCancel: () => void;
}) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [para, setPara] = useState(inicial?.para ?? "");
  const [url, setUrl] = useState(inicial?.enlace?.url ?? "");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const t = titulo.trim();
        if (t) onSave(t, descripcion.trim() || null, para || null, url.trim() || null);
      }}
      className="rise space-y-3 p-4"
    >
      <label className="block">
        <span className="sr-only">la meta</span>
        <input
          autoFocus
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          maxLength={MAX_TEXTO}
          placeholder="¿qué quieres lograr?"
          className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 font-medium placeholder:font-normal placeholder:text-ink-soft"
        />
      </label>
      <label className="block">
        <span className="sr-only">descripción · opcional</span>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={MAX_DESCRIPCION_META}
          rows={2}
          placeholder="una línea más · opcional"
          className="w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm placeholder:text-ink-soft"
        />
      </label>
      <label className="block">
        <span className="sr-only">un enlace · opcional</span>
        {/* text, not type="url": the browser would silently refuse «behance.net» without https://;
            the server adds it and checks the link (lib/vista-previa) */}
        <input
          type="text"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          maxLength={500}
          placeholder="un enlace · opcional"
          autoComplete="off"
          className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm placeholder:text-ink-soft"
        />
      </label>
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm text-ink-soft">para cuándo · opcional</span>
        <input
          type="date"
          value={para}
          onChange={(e) => setPara(e.target.value)}
          className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm [color-scheme:dark] [:root[data-theme=light]_&]:[color-scheme:light]"
        />
      </label>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="press rounded-full px-3 py-2 text-sm text-ink-soft hover:text-ink">
          cancelar
        </button>
        <button type="submit" disabled={!titulo.trim()} className="press rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-ink disabled:opacity-50">
          {inicial ? "guardar" : "crear"}
        </button>
      </div>
    </form>
  );
}

function Chip({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="press rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-accent/60 hover:text-ink disabled:opacity-50"
    >
      {children}
    </button>
  );
}

// One goal, open: its name and line, where it stands, and its steps as the same list as «hoy» —
// the next one first, with «→ hoy». The assistant offers to split it into steps.
function Goal({
  meta,
  hoyLleno,
  run,
  celebrate,
  cerrar,
}: {
  meta: Meta;
  hoyLleno: boolean;
  run: Run;
  celebrate: (t: string) => void;
  cerrar: () => void;
}) {
  const [paso, setPaso] = useState("");
  const [editando, setEditando] = useState(false);
  const [seguro, setSeguro] = useState(false);
  const next = siguiente(meta);
  const done = terminada(meta);
  // the next step leads, then the rest in their order
  const pasos = next ? [next, ...meta.pasos.filter((p) => p.id !== next.id)] : meta.pasos;

  function complete(id: string) {
    const last = meta.pasos.filter((p) => !p.hecho).length === 1;
    celebrate(last ? "¡meta cumplida! una flor más" : "una flor más en tu jardín");
    run({ k: "paso", meta: meta.id, id, to: "hecho" }, () => cumplirPaso(meta.id, id));
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = paso.trim();
    if (!t) return;
    setPaso("");
    run({ k: "paso+", meta: meta.id, id: tmp(), texto: t }, () => agregarPaso(meta.id, t));
  }

  return (
    <div>
      <button type="button" onClick={cerrar} className="press t-label -ml-2 mt-6 inline-flex items-center gap-2 rounded-full px-2 py-2 text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" />
        metas
      </button>

      {editando ? (
        <div className="mt-2 rounded-2xl border border-line bg-surface">
          <MetaForm
            inicial={meta}
            onCancel={() => setEditando(false)}
            onSave={(titulo, descripcion, para, url) => {
              setEditando(false);
              run(
                { k: "meta~", id: meta.id, titulo, descripcion, para, enlace: enlaceProvisional(url, meta.enlace) },
                () => editarLaMeta(meta.id, titulo, descripcion, para, url),
                "listo, guardada",
              );
            }}
          />
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-start gap-1">
            <h2 className="flex-1 text-pretty text-2xl font-semibold leading-tight">{meta.titulo}</h2>
            <button
              type="button"
              aria-label="editar la meta"
              onClick={() => setEditando(true)}
              className="press -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              <Pencil className="size-4" />
            </button>
            {/* in sight beside the pencil (Brian, 2026-10-25: «muy escondido»); it lets the goal go,
                so «historial» can bring it back for 30 days */}
            <button
              type="button"
              aria-label="eliminar la meta"
              aria-expanded={seguro}
              onClick={() => setSeguro(!seguro)}
              className="press -mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
            >
              <Trash className="size-4" />
            </button>
          </div>
          {seguro && (
            <div className="rise mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
              <p className="mr-auto text-pretty text-ink-soft">¿La eliminas? Sus pasos se van con ella. 30 días puedes recuperarla desde historial.</p>
              <button type="button" onClick={() => setSeguro(false)} className="press rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink">
                no
              </button>
              <button
                type="button"
                onClick={() => {
                  run({ k: "meta-", id: meta.id }, () => borrarMeta(meta.id), undefined, { tipo: "meta", id: meta.id, texto: meta.titulo });
                  cerrar();
                }}
                className="press rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-accent/60"
              >
                sí, eliminar
              </button>
            </div>
          )}
          {meta.descripcion && <p className="mt-1 text-pretty text-sm text-ink-soft">{meta.descripcion}</p>}
          {meta.enlace && <TarjetaEnlace enlace={meta.enlace} />}
          <div className="mt-2">
            <Estado meta={meta} />
          </div>
        </>
      )}

      {done && (
        <p className="rise mt-5 text-pretty rounded-2xl border border-line bg-surface p-4">Cumpliste todos los pasos. Esta meta ya es parte de tu jardín.</p>
      )}

      <ul className={`mt-5 ${lista}`}>
        {pasos.map((p) => (
          <li key={p.id} className="flex min-h-14 items-center gap-3 py-2 pl-2 pr-3">
            {p.hecho ? (
              <span className="grid size-11 shrink-0 place-items-center">
                <Check className="size-5 text-accent" />
              </span>
            ) : (
              <CheckButton label={p.texto} onClick={() => complete(p.id)} />
            )}
            <span className="min-w-0 flex-1">
              {p.id === next?.id && <span className="block text-xs font-medium text-accent">lo siguiente</span>}
              <span className={`block text-pretty leading-snug ${p.hecho ? "text-ink-soft" : p.id === next?.id ? "font-medium" : ""}`}>{p.texto}</span>
            </span>
            {p.enHoy ? (
              <span className="shrink-0 text-xs text-ink-soft">en hoy</span>
            ) : p.id === next?.id ? (
              <button
                type="button"
                disabled={hoyLleno}
                onClick={() => run({ k: "paso", meta: meta.id, id: p.id, to: "enHoy" }, () => pasoAHoy(meta.id, p.id), "listo, está en hoy")}
                className="press inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-ink disabled:opacity-50"
              >
                {hoyLleno ? (
                  "hoy lleno"
                ) : (
                  <>
                    <ArrowRight className="size-3.5" />
                    hoy
                  </>
                )}
              </button>
            ) : (
              !p.hecho && (
                <button
                  type="button"
                  onClick={() => run({ k: "paso", meta: meta.id, id: p.id, to: "fuera" }, () => borrarPaso(meta.id, p.id), undefined, { tipo: "paso", id: p.id, texto: p.texto })}
                  className="press shrink-0 rounded-full px-2 py-1.5 text-xs font-medium text-ink-soft hover:text-ink"
                >
                  soltar
                </button>
              )
            )}
          </li>
        ))}
        {meta.pasos.length < MAX_PASOS && (
          <li>
            <form onSubmit={add} className="flex min-h-14 items-center gap-3 py-2 pl-4 pr-2 focus-within:bg-surface-2">
              <Plus className="size-5 shrink-0 text-accent" />
              <label htmlFor="paso" className="sr-only">
                otro paso
              </label>
              <input
                id="paso"
                value={paso}
                onChange={(e) => setPaso(e.target.value)}
                maxLength={MAX_TEXTO}
                placeholder={meta.pasos.length === 0 ? "el primer paso, pequeño" : "otro paso"}
                autoComplete="off"
                style={{ boxShadow: "none" }}
                className={campo}
              />
              {paso.trim() && (
                <button type="submit" className="rise press shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
                  agregar
                </button>
              )}
            </form>
          </li>
        )}
      </ul>

      {/* room under the last line, so the assistant's floating button never sits on it */}
      <div aria-hidden className="h-16" />
      {meta.pasos.length < MAX_PASOS && !done && (
        <AsistenteBoton label="asistente: te ayuda a partir esta meta en pasos">
          <PartirEnPasos key={meta.pasos.length} metaId={meta.id} />
        </AsistenteBoton>
      )}
    </div>
  );
}

// The pinned link, inside the goal only: the page's own image (16:9, cropped to fit) when it shares
// one, its title and site; a tap opens it in a new tab. The image loads straight from that site,
// without telling it which page asked (no referrer).
function TarjetaEnlace({ enlace }: { enlace: Enlace }) {
  const [rota, setRota] = useState(false);
  return (
    <a
      href={enlace.url}
      target="_blank"
      rel="noopener noreferrer"
      className="press group mt-3 block overflow-hidden rounded-2xl border border-line bg-surface hover:border-accent/60"
    >
      {enlace.imagen && !rota && (
        // eslint-disable-next-line @next/next/no-img-element -- any site's image, sized by CSS; next/image would need every host listed
        <img
          src={enlace.imagen}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setRota(true)}
          className="aspect-video w-full bg-surface-2 object-cover"
        />
      )}
      <span className="flex items-center gap-3 px-4 py-3">
        <span className="min-w-0 flex-1">
          {enlace.titulo && <span className="block truncate text-sm font-medium">{enlace.titulo}</span>}
          <span className="block truncate text-xs text-ink-soft">{enlace.sitio ?? enlace.url}</span>
        </span>
        <ArrowRight className="size-4 shrink-0 -rotate-45 text-ink-soft transition-colors group-hover:text-accent" />
      </span>
    </a>
  );
}

function CheckButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={`cumplir: ${label}`} className="press group grid size-11 shrink-0 place-items-center rounded-full">
      <span className="grid size-6 place-items-center rounded-full border-2 border-accent/70 transition-colors group-hover:bg-accent-soft">
        <Check className="size-3.5 text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </span>
    </button>
  );
}
