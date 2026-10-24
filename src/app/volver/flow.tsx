"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/confetti";
import { Flower } from "@/components/flower";
import { Orb } from "@/components/orb";
import { ArrowRight } from "@/components/icons";
import { useCountdown } from "@/components/home-live";
import { moments, timer } from "@/lib/local";

type Step = 1 | 2 | 3;

// Inhale 4 s, exhale 6 s, three rounds: about 30 seconds — long enough to land, short
// enough that she does not drift again while waiting.
const INHALE = 4000;
const EXHALE = 6000;
const ROUNDS = 3;

function Dots({ step }: { step: Step }) {
  return (
    <div className="flex justify-center gap-2" aria-label={`paso ${step} de 3`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-2 rounded-full transition-all duration-500 ${n <= step ? "w-6 bg-accent" : "w-2 bg-line"}`}
        />
      ))}
    </div>
  );
}

function BreathOrbLabel({ inhale, round }: { inhale: boolean; round: number }) {
  return (
    <div className="text-center" aria-live="polite">
      <p className="t-display text-2xl">{inhale ? "inhala…" : "exhala…"}</p>
      <p className="mt-1 text-sm text-ink-soft">
        {round} de {ROUNDS}
      </p>
    </div>
  );
}

export function Flow() {
  const [step, setStep] = useState<Step>(1);
  const [text, setText] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [flowers, setFlowers] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Coming from the home's running timer goes straight to it.
  useEffect(() => {
    if (new URLSearchParams(location.search).get("paso") === "3" && timer.get()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL and the timer only exist in the browser
      setFlowers(moments.all().length);
      setStep(3);
    }
  }, []);

  useEffect(() => {
    if (step === 2) inputRef.current?.focus();
  }, [step]);

  function commit() {
    const s = text.trim() || "volver a lo que estaba haciendo";
    timer.start(minutes, s);
    setFlowers(moments.add(s));
    setCelebrate(true);
    setStep(3);
  }

  return (
    <div className="flex flex-1 flex-col gap-8 pt-6">
      <Dots step={step} />

      {step === 1 && <Breathe onDone={() => setStep(2)} />}

      {step === 2 && (
        <form
          className="rise flex flex-1 flex-col justify-center gap-8"
          onSubmit={(e) => {
            e.preventDefault();
            commit();
          }}
        >
          <h1 className="text-balance t-display text-3xl leading-tight ">
            ¿qué es lo <em className="text-accent">más pequeño</em> que puedes hacer ahora?
          </h1>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ej. abrir el archivo de Figma"
            maxLength={80}
            className="w-full rounded-2xl border border-line bg-surface px-5 py-4 text-lg text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2" role="radiogroup" aria-label="cuánto tiempo">
              {[10, 25].map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={minutes === m}
                  onClick={() => setMinutes(m)}
                  className={`press rounded-full px-4 py-2 text-sm ${
                    minutes === m ? "bg-accent-soft text-ink ring-1 ring-accent" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="press inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink"
            >
              listo <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <Back
          celebrate={celebrate}
          flowers={flowers}
          again={() => {
            timer.clear();
            setText("");
            setCelebrate(false);
            setStep(2);
          }}
        />
      )}
    </div>
  );
}

// The orb grows on the inhale and shrinks on the exhale; its transition time is the breath.
function Breathe({ onDone }: { onDone: () => void }) {
  const [round, setRound] = useState(1);
  const [inhale, setInhale] = useState(false);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    let r = 1;
    const ids: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      setRound(r);
      setInhale(true);
      ids.push(
        setTimeout(() => {
          setInhale(false);
          ids.push(
            setTimeout(() => {
              if (r >= ROUNDS) return done.current();
              r += 1;
              cycle();
            }, EXHALE),
          );
        }, INHALE),
      );
    };
    ids.push(setTimeout(cycle, 600));
    return () => ids.forEach(clearTimeout);
  }, []);

  return (
    <div className="rise flex flex-1 flex-col items-center justify-center gap-10">
      <h1 className="t-display text-3xl ">respira conmigo</h1>
      <div className="grid size-64 place-items-center">
        <Orb
          className="size-64"
          style={{
            transform: `scale(${inhale ? 1 : 0.55})`,
            transition: `transform ${inhale ? INHALE : EXHALE}ms cubic-bezier(0.45, 0, 0.55, 1)`,
          }}
        />
      </div>
      <BreathOrbLabel inhale={inhale} round={round} />
      <button
        type="button"
        onClick={() => done.current()}
        className="press inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ink-soft hover:text-ink"
      >
        saltar <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function Back({ celebrate, flowers, again }: { celebrate: boolean; flowers: number; again: () => void }) {
  const { active, label } = useCountdown();
  const [seen, setSeen] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the countdown reads the clock after mount
  useEffect(() => setSeen(true), []);
  const finished = seen && !active;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 text-center">
      {celebrate && <Confetti />}

      {finished ? (
        <div className="rise space-y-3">
          <h1 className="t-display text-3xl ">lo lograste.</h1>
          <p className="text-ink-soft">el tiempo terminó. ¿otra vuelta, o un descanso?</p>
        </div>
      ) : (
        <div className="rise space-y-3">
          <h1 className="text-balance t-display text-3xl leading-tight ">
            {celebrate ? (
              <>
                <span className="block">volviste.</span>
                <span className="block">eso es lo difícil,</span>
                <span className="block text-accent">y lo hiciste.</span>
              </>
            ) : (
              "sigues aquí. vas bien."
            )}
          </h1>
        </div>
      )}

      {active && (
        <div className="rise flex w-full flex-col items-center gap-2 rounded-[1.75rem] border border-dashed border-line bg-surface px-6 py-6">
          <p className="t-display text-5xl tabular-nums ">{label}</p>
          <p className="text-ink-soft">{active.step}</p>
        </div>
      )}

      {celebrate && flowers > 0 && (
        <div className="rise flex items-center gap-3 text-sm text-ink-soft" style={{ animationDelay: "500ms" }}>
          <Flower n={flowers} className="size-9" />
          <span>
            {flowers === 1 ? (
              "la primera flor de tu jardín"
            ) : (
              <>
                +1 flor en tu jardín · ya son <strong className="font-medium text-ink">{flowers}</strong>
              </>
            )}
          </span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={again}
          className="press rounded-full px-5 py-2.5 text-sm text-ink-soft ring-1 ring-line hover:bg-surface-2 hover:text-ink"
        >
          otra vuelta
        </button>
        <Link
          href="/tu"
          className="press rounded-full bg-accent-soft px-5 py-2.5 text-sm text-ink hover:ring-1 hover:ring-accent"
        >
          ver mi jardín
        </Link>
      </div>
    </div>
  );
}
