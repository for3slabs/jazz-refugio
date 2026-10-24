"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lineOfTheDay } from "@/lib/content";
import { timer, type Timer } from "@/lib/local";

// The two parts of the home that depend on HER device: today's line and a running timer.
export function DailyLine() {
  const [line, setLine] = useState<string | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- "today" is the viewer's day, not the server's
  useEffect(() => setLine(lineOfTheDay()), []);
  return (
    <p className="min-h-14 text-balance text-center text-xl font-medium leading-snug text-ink">
      {line && <span className="rise inline-block">«{line}»</span>}
    </p>
  );
}

export function useCountdown() {
  const [t, setT] = useState<Timer | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => {
      setT(timer.get());
      setNow(Date.now());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const left = t ? Math.max(0, t.endsAt - now) : 0;
  const mm = String(Math.floor(left / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60_000) / 1000)).padStart(2, "0");
  return { active: t, label: `${mm}:${ss}` };
}

export function RunningTimer() {
  const { active, label } = useCountdown();
  if (!active) return null;
  return (
    <Link
      href="/volver?paso=3"
      className="rise mx-auto flex items-center gap-3 rounded-full border border-dashed border-line bg-surface px-4 py-2 text-sm"
    >
      <span className="size-2 animate-pulse rounded-full bg-accent" />
      <span className="tabular-nums text-ink">{label}</span>
      <span className="max-w-44 truncate text-ink-soft">{active.step}</span>
    </Link>
  );
}
