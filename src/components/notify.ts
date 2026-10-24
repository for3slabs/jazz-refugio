"use client";
// notify — THE one file the app calls for every floating notice, as in Mak-tub (S65): it is the
// only file that imports Sileo, so changing the library one day touches this file alone.
// Sileo is pinned (0.1.5, one author, 0.x). Its own tones include two blues; globals.css
// repaints them from her palette ([data-sileo-viewport]), and the pill takes the colour of the text
// on the current theme, so it stands out on dark and on light alike.
import { sileo } from "sileo";

export { Toaster } from "sileo";

export type NotifyTone = "success" | "info" | "warning" | "error";
export interface NotifyInput {
  title: string;
  text?: string;
  action?: { label: string; href: string };
}

// Sileo capitalizes every word («Listo Brian»); Spanish writes a sentence.
const styles = { title: "notify-title", description: "notify-text" };

function fill(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#f6eefa";
}

export function notify(tone: NotifyTone, input: NotifyInput): void {
  sileo[tone]({
    title: input.title,
    description: input.text,
    styles,
    fill: fill(),
    button: input.action
      ? { title: input.action.label, onClick: () => window.location.assign(input.action!.href) }
      : undefined,
  });
}
