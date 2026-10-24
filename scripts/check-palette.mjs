#!/usr/bin/env node
// check-palette — the two promises of the palette, measured on every build:
//   1. Jazz does not like blue in any shade: no color in src/ may sit in the blue band
//      (OKLCH hue 200–300°), and every chromatic theme token sits at 305–345°.
//   2. Every text pair stays readable: contrast ≥ 4.5:1 in both themes.
// Exit 0 = both hold · 1 = a violation (each one is printed).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BLUE = [200, 300];
const TOKEN_HUE = [305, 345];
const CHROMA_FLOOR = 0.02; // below this a color reads as neutral; its hue means nothing

function files(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(css|tsx?|mjs)$/.test(n) ? [p] : [];
  });
}

function hexToOklch(hex) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [R, G, B] = [r, g, b].map(lin);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(a, bb), ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360];
}

function luminance([L, C, H]) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const R = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const G = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const B = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

const contrast = (x, y) => {
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};

const errors = [];
const OKLCH = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/g;

for (const f of files("src")) {
  const text = readFileSync(f, "utf8");
  for (const m of text.matchAll(OKLCH)) {
    const [, C, H] = m.slice(1).map(Number);
    if (C >= CHROMA_FLOOR && H >= BLUE[0] && H <= BLUE[1]) errors.push(`${f}: ${m[0]}) is in the blue band (${H}°)`);
  }
  for (const m of text.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
    const [, C, H] = hexToOklch(m[0]);
    if (C >= CHROMA_FLOOR && H >= BLUE[0] && H <= BLUE[1]) errors.push(`${f}: ${m[0]} is in the blue band (${H.toFixed(0)}°)`);
  }
}

// The theme tokens, read from the two blocks of globals.css.
const css = readFileSync("src/app/globals.css", "utf8");
const block = (selector) => {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/g)].map((m) => [m[1], m.slice(2).map(Number)]),
  );
};
const themes = { "neon noir": block(":root {"), calma: block(':root[data-theme="light"] {') };

const PAIRS = [
  ["ink", "canvas"], ["ink", "surface"], ["ink-soft", "canvas"], ["ink-soft", "surface"],
  ["accent", "canvas"], ["accent", "surface"], ["accent-ink", "accent"], ["ink", "accent-soft"],
  ["accent", "accent-soft"], ["ink-soft", "surface-2"], ["ink", "surface-2"],
];

for (const [name, t] of Object.entries(themes)) {
  if (Object.keys(t).length < 10) errors.push(`theme "${name}": only ${Object.keys(t).length} tokens read — the reader missed the block`);
  for (const [k, [, C, H]] of Object.entries(t)) {
    if (C >= CHROMA_FLOOR && (H < TOKEN_HUE[0] || H > TOKEN_HUE[1])) errors.push(`theme "${name}": --${k} hue ${H}° is outside ${TOKEN_HUE.join("–")}°`);
  }
  for (const [fg, bg] of PAIRS) {
    if (!t[fg] || !t[bg]) { errors.push(`theme "${name}": missing --${fg} or --${bg}`); continue; }
    const r = contrast(t[fg], t[bg]);
    console.log(`${name.padEnd(10)} ${fg.padEnd(11)} on ${bg.padEnd(11)} ${r.toFixed(2).padStart(5)} ${r >= 4.5 ? "✅" : "🔴"}`);
    if (r < 4.5) errors.push(`theme "${name}": --${fg} on --${bg} is ${r.toFixed(2)}:1, under 4.5`);
  }
}

// «me estoy desviando» in each mode's colour: its text must read on it too.
const MODE_BTN = /data-modo="([^"]+)"\]\) > \.desvio \{ --btn: oklch\(([\d.]+) ([\d.]+) ([\d.]+)\); --btn-ink: oklch\(([\d.]+) ([\d.]+) ([\d.]+)\);/g;
const modeButtons = [...css.matchAll(MODE_BTN)];
if (modeButtons.length !== 6) errors.push(`mode buttons: read ${modeButtons.length}, expected 6 — the reader missed a rule`);
for (const m of modeButtons) {
  const [bg, fg] = [m.slice(2, 5).map(Number), m.slice(5, 8).map(Number)];
  const r = contrast(fg, bg);
  console.log(`modo       ${m[1].padEnd(11)} button     ${r.toFixed(2).padStart(5)} ${r >= 4.5 ? "✅" : "🔴"}`);
  if (r < 4.5) errors.push(`mode "${m[1]}": button text is ${r.toFixed(2)}:1, under 4.5`);
}

if (errors.length) {
  console.error(`\n🔴 ${errors.length} violation(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log("\n✅ no blue anywhere in src/, every token at 305–345°, every text pair ≥ 4.5:1 (mode buttons included)");
