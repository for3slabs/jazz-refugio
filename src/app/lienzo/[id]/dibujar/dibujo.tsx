"use client";

import { getStroke } from "perfect-freehand";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Close, Undo } from "@/components/icons";
import { MAX_LADO } from "@/lib/tablero";
import { enPalabras, upload } from "../board";

type Stroke = { pts: number[][]; color: string; size: number; erase: boolean; pen: boolean };

// A sketchbook page: always light paper, whatever the theme — like the real thing.
const PAPEL = "#fbf7fc";
// Her starting colours; any other one is a tap away on the picker (her work, her colours).
const COLORES = ["#2b1b33", "#7b2cbf", "#b5179e", "#e85d75", "#e9a23b", "#6a994e"];
const GROSORES = [4, 9, 18];

function paint(ctx: CanvasRenderingContext2D, s: Stroke) {
  const outline = getStroke(s.pts, {
    size: s.erase ? s.size * 2.5 : s.size,
    thinning: s.erase ? 0 : 0.6,
    smoothing: 0.5,
    streamline: 0.45,
    simulatePressure: !s.pen,
    last: true,
  });
  if (!outline.length) return;
  const path = new Path2D();
  path.moveTo(outline[0][0], outline[0][1]);
  for (const [x, y] of outline.slice(1)) path.lineTo(x, y);
  path.closePath();
  ctx.globalCompositeOperation = s.erase ? "destination-out" : "source-over";
  ctx.fillStyle = s.color;
  ctx.fill(path);
}

// Full screen, finger or stylus: the line follows the pen's pressure. Undo, redo, eraser,
// three sizes, her colours. Saving drops the drawing on the board she came from.
export function Dibujo({ tablero, nombre }: { tablero: string; nombre: string }) {
  const router = useRouter();
  const canvas = useRef<HTMLCanvasElement>(null);
  const cur = useRef<Stroke | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [color, setColor] = useState(COLORES[1]);
  const [size, setSize] = useState(GROSORES[1]);
  const [erase, setErase] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const draw = useCallback(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    for (const s of strokes) paint(ctx, s);
    if (cur.current) paint(ctx, cur.current);
  }, [strokes]);

  // The canvas matches its box at the screen's pixel density, and redraws when it changes.
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, [draw]);

  const undo = useCallback(() => {
    setStrokes((s) => {
      if (!s.length) return s;
      setRedo((r) => [...r, s[s.length - 1]]);
      return s.slice(0, -1);
    });
  }, []);
  const again = useCallback(() => {
    setRedo((r) => {
      if (!r.length) return r;
      setStrokes((s) => [...s, r[r.length - 1]]);
      return r.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) again();
      else undo();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [undo, again]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top, e.pressure || 0.5];
  }

  async function save() {
    const c = canvas.current;
    if (!c || !strokes.length) return;
    setSaving(true);
    try {
      const k = Math.min(1, MAX_LADO / Math.max(c.width, c.height));
      const out = document.createElement("canvas");
      out.width = Math.round(c.width * k);
      out.height = Math.round(c.height * k);
      const o = out.getContext("2d")!;
      o.fillStyle = PAPEL;
      o.fillRect(0, 0, out.width, out.height);
      o.drawImage(c, 0, 0, out.width, out.height);
      const blob = await new Promise<Blob | null>((r) => out.toBlob(r, "image/webp", 0.9));
      if (!blob) throw new Error("no se pudo codificar");
      await upload(tablero, "dibujo", blob, out.width, out.height);
      router.push(`/lienzo/${tablero}`);
      router.refresh();
    } catch (e) {
      setMsg(enPalabras(e, "No se pudo guardar el dibujo. Inténtalo otra vez."));
      setSaving(false);
    }
  }

  function leave() {
    if (strokes.length && !window.confirm("¿Salir sin guardar el dibujo?")) return;
    router.push(`/lienzo/${tablero}`);
  }

  const tool = "press grid size-10 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink disabled:opacity-40";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex h-14 items-center gap-1 px-3">
        <button type="button" onClick={leave} aria-label="salir" className={tool}>
          <Close className="size-5" />
        </button>
        <p className="t-label ml-1 min-w-0 flex-1 truncate text-ink-soft">{nombre}</p>
        <button type="button" onClick={undo} disabled={!strokes.length} aria-label="deshacer" className={tool}>
          <Undo className="size-5" />
        </button>
        <button type="button" onClick={again} disabled={!redo.length} aria-label="rehacer" className={tool}>
          <Undo className="size-5 -scale-x-100" />
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!strokes.length || saving}
          className="press ml-2 rounded-full bg-accent px-5 py-2 font-semibold text-accent-ink disabled:opacity-50"
        >
          {saving ? "guardando…" : "guardar"}
        </button>
      </header>

      <div className="relative mx-3 flex-1 overflow-hidden rounded-2xl border border-line" style={{ background: PAPEL }}>
        <canvas
          ref={canvas}
          aria-label="lienzo para dibujar"
          className="block size-full touch-none"
          style={{ cursor: "crosshair" }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            cur.current = { pts: [point(e)], color, size, erase, pen: e.pointerType === "pen" };
            draw();
          }}
          onPointerMove={(e) => {
            if (!cur.current) return;
            for (const ev of e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]) {
              const r = e.currentTarget.getBoundingClientRect();
              cur.current.pts.push([ev.clientX - r.left, ev.clientY - r.top, ev.pressure || 0.5]);
            }
            draw();
          }}
          onPointerUp={() => {
            const s = cur.current;
            cur.current = null;
            if (s) {
              setStrokes((l) => [...l, s]);
              setRedo([]);
            }
          }}
          onPointerCancel={() => {
            cur.current = null;
            draw();
          }}
        />
        {msg && <p className="absolute inset-x-0 top-3 text-center text-sm text-[#2b1b33]">{msg}</p>}
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 px-3 py-4">
        <div className="flex items-center gap-1" role="group" aria-label="grosor">
          {GROSORES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSize(g)}
              aria-label={`grosor ${g}`}
              aria-pressed={size === g}
              className={`press grid size-10 place-items-center rounded-full ${size === g ? "bg-accent-soft" : "hover:bg-surface-2"}`}
            >
              <span className="rounded-full bg-ink" style={{ width: g / 1.6 + 3, height: g / 1.6 + 3 }} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5" role="group" aria-label="color">
          {COLORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                setErase(false);
              }}
              aria-label={`color ${c}`}
              aria-pressed={!erase && color === c}
              className={`press size-8 rounded-full border-2 ${!erase && color === c ? "border-ink" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setErase(false);
            }}
            aria-label="otro color"
            className="size-8 cursor-pointer rounded-full border border-line bg-transparent"
          />
        </div>
        <button
          type="button"
          onClick={() => setErase((v) => !v)}
          aria-pressed={erase}
          className={`press rounded-full border px-4 py-2 text-sm font-semibold ${erase ? "border-accent bg-accent-soft text-ink" : "border-line text-ink-soft hover:text-ink"}`}
        >
          goma
        </button>
      </footer>
    </div>
  );
}
