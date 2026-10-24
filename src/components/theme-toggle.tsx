"use client";

import { useEffect, useState } from "react";
import { prefs, type Theme } from "@/lib/local";
import { Moon, Sun } from "./icons";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved theme only exists in the browser
  useEffect(() => setTheme(prefs.theme()), []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "modo claro" : "modo oscuro"}
      onClick={() => {
        prefs.setTheme(next);
        setTheme(next);
      }}
      className="grid size-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-accent-soft hover:text-ink"
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
