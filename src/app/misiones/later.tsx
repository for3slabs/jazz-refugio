"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import {
  type EstadoResult,
  agregarPaso,
  anotar,
  borrarMeta,
  borrarPaso,
  crearMeta,
  cumplirPaso,
  ideaAHoy,
  ideaAMeta,
  pasoAHoy,
  soltarIdea,
} from "@/app/actions";
import { Confetti } from "@/components/confetti";
import { Flower } from "@/components/flower";
import { ArrowLeft, ArrowRight, Check, More } from "@/components/icons";
import { MAX_TEXTO } from "@/lib/mision";
import { PartirEnPasos } from "./ayudantes";
import { type Idea, type Meta, MAX_METAS, MAX_PASOS, cuando, siguiente, terminada } from "@/lib/pendiente";

type View = { mente: Idea[]; metas: Meta[] };
type Change =
  | { k: "idea+"; i: Idea }
  | { k: "idea-"; id: string }
  | { k: "meta+"; m: Meta }
  | { k: "meta-"; id: string }
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

// «Más adelante»: what does not fit in today. A thought captured in one tap, goals with only
// their next step in view, and every step one tap from «hoy». Changes show at once; a failed
// save puts things back and says so.
export function Later({ mente, metas, abierta, hoyLleno }: View & { abierta: string | null; hoyLleno: boolean }) {
  const [view, change] = useOptimistic<View, Change>({ mente, metas }, apply);
  const [, start] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [party, setParty] = useState(0);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(id);
  }, [msg]);

  function run(c: Change | null, op: () => Promise<EstadoResult>, ok?: string) {
    start(async () => {
      if (c) change(c);
      const r = await op();
      if (!r.ok) setMsg({ text: r.error ?? "", ok: false });
      else if (ok) setMsg({ text: ok, ok: true });
    });
  }

  function celebrate(text: string) {
    setParty((p) => p + 1);
    setMsg({ text, ok: true });
  }

  const meta = abierta ? view.metas.find((m) => m.id === abierta) : undefined;

  return (
    <div className="relative mt-6">
      {party > 0 && <Confetti key={party} />}
      <p role="status" className="min-h-6 text-sm text-ink-soft">
        {msg && (
          <span key={msg.text + party} className="rise inline-flex items-center gap-2">
            {msg.ok && party > 0 && <Flower n={party + 3} className="size-5" />}
            {msg.text}
          </span>
        )}
      </p>
      {meta ? (
        <Goal meta={meta} hoyLleno={hoyLleno} run={run} celebrate={celebrate} />
      ) : (
        <List view={view} hoyLleno={hoyLleno} run={run} />
      )}
    </div>
  );
}

type Run = (c: Change | null, op: () => Promise<EstadoResult>, ok?: string) => void;

function Dots({ meta }: { meta: Meta }) {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {meta.pasos.map((p) => (
        <span key={p.id} className={`size-2 rounded-full ${p.hecho ? "bg-accent" : "border border-ink-soft/60"}`} />
      ))}
    </span>
  );
}

function List({ view, hoyLleno, run }: { view: View; hoyLleno: boolean; run: Run }) {
  const [idea, setIdea] = useState("");
  const [menu, setMenu] = useState<string | null>(null);
  const [nueva, setNueva] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [para, setPara] = useState("");
  const activas = view.metas.filter((m) => !terminada(m));
  const hechas = view.metas.filter(terminada);

  function capture(e: React.FormEvent) {
    e.preventDefault();
    const t = idea.trim();
    if (!t) return;
    setIdea("");
    run({ k: "idea+", i: { id: tmp(), texto: t, at: Date.now() } }, () => anotar(t));
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    const t = titulo.trim();
    if (!t) return;
    setTitulo("");
    setPara("");
    setNueva(false);
    run({ k: "meta+", m: { id: tmp(), titulo: t, para: para || null, at: Date.now(), pasos: [] } }, () => crearMeta(t, para || null));
  }

  return (
    <>
      <section>
        <h2 className="t-label text-accent">en tu mente</h2>
        <form onSubmit={capture} className="mt-3 flex items-center gap-2 rounded-full border border-dashed border-line bg-surface p-1.5 pl-5">
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
            className="min-w-0 flex-1 bg-transparent py-2 text-lg placeholder:text-ink-soft focus:outline-none"
          />
          <button
            type="submit"
            disabled={!idea.trim()}
            className="press shrink-0 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50"
          >
            anotar
          </button>
        </form>
        {view.mente.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {view.mente.map((i) => (
              <li key={i.id} className="py-2">
                <div className="flex items-center gap-3">
                  <p className="flex-1 text-pretty">{i.texto}</p>
                  <button
                    type="button"
                    aria-expanded={menu === i.id}
                    aria-label={`opciones: ${i.texto}`}
                    onClick={() => setMenu(menu === i.id ? null : i.id)}
                    className="press grid size-9 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
                  >
                    <More className="size-5" />
                  </button>
                </div>
                {menu === i.id && (
                  <div className="rise mt-2 flex flex-wrap gap-2">
                    <Chip
                      disabled={hoyLleno}
                      onClick={() => run({ k: "idea-", id: i.id }, () => ideaAHoy(i.id), "listo, está en hoy")}
                    >
                      {hoyLleno ? "hoy está lleno" : "a hoy"}
                    </Chip>
                    <Chip
                      disabled={activas.length >= MAX_METAS}
                      onClick={() => run({ k: "idea-", id: i.id }, () => ideaAMeta(i.id), "listo, ahora es una meta")}
                    >
                      hacerla meta
                    </Chip>
                    <Chip onClick={() => run({ k: "idea-", id: i.id }, () => soltarIdea(i.id))}>soltar</Chip>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 border-t border-dashed border-line pt-6">
        <h2 className="t-label text-accent">metas</h2>
        <ul className="mt-3 space-y-3">
          {activas.map((m, i) => {
            const next = siguiente(m);
            return (
              <li key={m.id} className="rise" style={{ animationDelay: `${Math.min(i, 4) * 50}ms` }}>
                <Link
                  href={`/misiones?v=despues&meta=${m.id}`}
                  className="press group block rounded-3xl border border-line bg-surface p-5 hover:border-accent/60 hover:bg-surface-2"
                >
                  <p className="text-pretty text-lg font-semibold leading-snug">{m.titulo}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
                    {m.pasos.length > 0 ? <Dots meta={m} /> : "sin pasos todavía"}
                    {m.para && <span>· {cuando(m.para)}</span>}
                  </p>
                  {next && (
                    <p className="mt-3 flex items-center gap-2 text-ink-soft">
                      <ArrowRight className="size-4 shrink-0 text-accent" />
                      <span className="text-pretty">{next.texto}</span>
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {activas.length >= MAX_METAS ? (
          <p className="mt-4 text-pretty text-ink-soft">Tienes {MAX_METAS} metas. Termina o suelta una primero.</p>
        ) : nueva ? (
          <form onSubmit={create} className="rise mt-4 space-y-3 rounded-3xl border border-dashed border-line bg-surface p-5">
            <label className="block">
              <span className="t-label text-ink-soft">la meta</span>
              <input
                autoFocus
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={MAX_TEXTO}
                placeholder="el portafolio nuevo"
                className="mt-2 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-lg placeholder:text-ink-soft"
              />
            </label>
            <label className="block">
              <span className="t-label text-ink-soft">para cuándo · opcional</span>
              <input
                type="date"
                value={para}
                onChange={(e) => setPara(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-lg [color-scheme:dark] [:root[data-theme=light]_&]:[color-scheme:light]"
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setNueva(false)} className="press t-label rounded-full px-3 py-2 text-ink-soft hover:text-ink">
                cancelar
              </button>
              <button
                type="submit"
                disabled={!titulo.trim()}
                className="press rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50"
              >
                crear
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setNueva(true)}
            className="press mt-4 w-full rounded-full border border-dashed border-line px-5 py-3 text-left text-ink-soft hover:border-accent/60 hover:text-ink"
          >
            + nueva meta
          </button>
        )}

        {hechas.length > 0 && (
          <details className="mt-8">
            <summary className="t-label cursor-pointer text-ink-soft">cumplidas · {hechas.length}</summary>
            <ul className="mt-3 space-y-2">
              {hechas.map((m) => (
                <li key={m.id} className="flex items-center gap-3 text-ink-soft">
                  <Check className="size-4 shrink-0 text-accent" />
                  {m.titulo}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </>
  );
}

function Chip({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="press rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-sm hover:border-accent/60 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Goal({ meta, hoyLleno, run, celebrate }: { meta: Meta; hoyLleno: boolean; run: Run; celebrate: (t: string) => void }) {
  const [paso, setPaso] = useState("");
  const [seguro, setSeguro] = useState(false);
  const next = siguiente(meta);
  const hechos = meta.pasos.filter((p) => p.hecho).length;
  const done = terminada(meta);

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
      <Link href="/misiones?v=despues" className="press t-label -ml-2 inline-flex items-center gap-2 rounded-full px-2 py-2 text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" />
        metas
      </Link>
      <h2 className="t-display mt-3 text-3xl">{meta.titulo}</h2>
      {meta.para && <p className="mt-2 text-ink-soft">para {cuando(meta.para)}</p>}
      {meta.pasos.length > 0 && (
        <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
          <Dots meta={meta} />
          {hechos} de {meta.pasos.length} {meta.pasos.length === 1 ? "paso" : "pasos"}
        </p>
      )}

      {next && (
        <div className="mt-6 rounded-3xl border border-accent/60 bg-surface p-5">
          <p className="t-label text-accent">lo siguiente</p>
          <div className="mt-3 flex items-center gap-4">
            <CheckButton label={next.texto} onClick={() => complete(next.id)} />
            <p className="flex-1 text-pretty text-lg font-medium leading-snug">{next.texto}</p>
          </div>
          <div className="mt-4 flex justify-end">
            {next.enHoy ? (
              <span className="t-label text-ink-soft">ya está en hoy</span>
            ) : (
              <button
                type="button"
                disabled={hoyLleno}
                onClick={() =>
                  run({ k: "paso", meta: meta.id, id: next.id, to: "enHoy" }, () => pasoAHoy(meta.id, next.id), "listo, está en hoy")
                }
                className="press inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50"
              >
                {hoyLleno ? (
                  "hoy está lleno"
                ) : (
                  <>
                    <ArrowRight className="size-4" />
                    hoy
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {done && (
        <p className="rise mt-6 rounded-3xl border border-line bg-surface p-5 text-pretty text-lg">
          Cumpliste todos los pasos. Esta meta ya es parte de tu jardín.
        </p>
      )}

      {meta.pasos.length > 0 && (
        <ul className="mt-6 space-y-1">
          {meta.pasos.map((p) =>
            p.id === next?.id ? null : (
              <li key={p.id} className="flex items-center gap-3 py-1.5">
                {p.hecho ? (
                  <Check className="size-5 shrink-0 text-accent" />
                ) : (
                  <CheckButton small label={p.texto} onClick={() => complete(p.id)} />
                )}
                <span className={`flex-1 text-pretty ${p.hecho ? "text-ink-soft" : ""}`}>{p.texto}</span>
                {p.enHoy && <span className="t-label text-ink-soft">en hoy</span>}
                {!p.hecho && !p.enHoy && (
                  <button
                    type="button"
                    onClick={() => run({ k: "paso", meta: meta.id, id: p.id, to: "fuera" }, () => borrarPaso(meta.id, p.id))}
                    className="press t-label rounded-full px-2 py-1 text-ink-soft hover:text-ink"
                  >
                    soltar
                  </button>
                )}
              </li>
            ),
          )}
        </ul>
      )}

      {meta.pasos.length < MAX_PASOS && (
        <form onSubmit={add} className="mt-5 flex items-center gap-2 rounded-full border border-dashed border-line bg-surface p-1.5 pl-5">
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
            className="min-w-0 flex-1 bg-transparent py-2 text-lg placeholder:text-ink-soft focus:outline-none"
          />
          <button
            type="submit"
            disabled={!paso.trim()}
            className="press shrink-0 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink disabled:opacity-50"
          >
            agregar
          </button>
        </form>
      )}

      {meta.pasos.length < MAX_PASOS && !done && <PartirEnPasos key={meta.pasos.length} metaId={meta.id} />}

      <div className="mt-10 border-t border-dashed border-line pt-5">
        {seguro ? (
          <p className="flex flex-wrap items-center gap-3 text-ink-soft">
            ¿La sueltas? Sus pasos se van con ella.
            <Link
              href="/misiones?v=despues"
              onClick={() => run({ k: "meta-", id: meta.id }, () => borrarMeta(meta.id))}
              className="press t-label rounded-full border border-line px-3 py-1.5 text-ink hover:border-accent/60"
            >
              sí, soltarla
            </Link>
            <button type="button" onClick={() => setSeguro(false)} className="press t-label px-2 py-1.5 hover:text-ink">
              no
            </button>
          </p>
        ) : (
          <button type="button" onClick={() => setSeguro(true)} className="press t-label rounded-full px-2 py-1.5 text-ink-soft hover:text-ink">
            soltar esta meta
          </button>
        )}
      </div>
    </div>
  );
}

function CheckButton({ label, onClick, small = false }: { label: string; onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`cumplir: ${label}`}
      className={`press group grid shrink-0 place-items-center rounded-full border-2 border-accent/70 hover:bg-accent-soft ${
        small ? "size-7" : "size-11"
      }`}
    >
      <Check className={`text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${small ? "size-3.5" : "size-5"}`} />
    </button>
  );
}
