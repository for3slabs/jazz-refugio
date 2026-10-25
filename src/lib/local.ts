// Everything she does here stays in HER browser: the garden, the moments she came back,
// the timer, her theme. Nothing is sent anywhere. Storage can be blocked (private mode),
// so every read and write survives a throw.

export type Moment = { at: number; step: string };
export type Timer = { endsAt: number; step: string };

const K = {
  moments: "refugio:moments",
  timer: "refugio:timer",
  theme: "refugio:theme",
  motion: "refugio:motion",
  notesSeen: "refugio:notes-seen",
  avisoHoyNo: "refugio:aviso-hoy-no",
  modo: "refugio:modo",
  vueltasSubidas: "refugio:vueltas-subidas",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  } catch {
    /* storage blocked: the page still works, it just forgets */
  }
}

// Her «volver» flowers used to live here only. Since the move to the DB this list is read once,
// uploaded, and kept as it was (a backup on her device); `vueltasSubidas` remembers it went up.
export const vueltasSubidas = {
  get: (): boolean => read<boolean>(K.vueltasSubidas, false),
  set: () => write(K.vueltasSubidas, true),
};

export const moments = {
  all: (): Moment[] => read<Moment[]>(K.moments, []),
  add(step: string) {
    const list = moments.all();
    list.push({ at: Date.now(), step });
    write(K.moments, list);
    return list.length;
  },
};

export const timer = {
  get: (): Timer | null => {
    const t = read<Timer | null>(K.timer, null);
    return t && t.endsAt > Date.now() ? t : null;
  },
  start: (minutes: number, step: string) =>
    write(K.timer, { endsAt: Date.now() + minutes * 60_000, step }),
  clear: () => write(K.timer, null),
};

// The time of the newest note she has opened — the home's «de Brian» door glows past it.
export const notesSeen = {
  get: (): number => read<number>(K.notesSeen, 0),
  set: (at: number) => write(K.notesSeen, at),
};

// «hoy no» on the home's soft note: the day she said it. The note comes back tomorrow.
export const avisoHoyNo = {
  get: (): string | null => read<string | null>(K.avisoHoyNo, null),
  set: (dia: string) => write(K.avisoHoyNo, JSON.stringify(dia)),
};

export type Theme = "light" | "dark";

export const prefs = {
  theme(): Theme {
    try {
      const t = localStorage.getItem(K.theme);
      if (t === "light") return t;
    } catch {}
    return "dark"; // Neon Noir is her default; light is the opt-in calm theme
  },
  setTheme(t: Theme) {
    if (t === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    write(K.theme, t === "light" ? "light" : null);
  },
  motionOff(): boolean {
    return document.documentElement.dataset.motion === "off";
  },
  setMotionOff(off: boolean) {
    if (off) document.documentElement.dataset.motion = "off";
    else delete document.documentElement.dataset.motion;
    write(K.motion, off ? "off" : null);
  },
};

// Her last mode, so the next load paints the orb in her colour before the server answers
// (read by the script in layout.tsx). The server stays the truth: every load writes it back.
export const ultimoModo = {
  set(e: { modo: string; at: number } | null) {
    write(K.modo, e);
    try {
      if (e) document.documentElement.dataset.modo = e.modo;
      else delete document.documentElement.dataset.modo;
    } catch {}
  },
};
