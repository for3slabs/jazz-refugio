// Cut a 3x2 character sheet into six transparent sprites.
// The paper is removed by a flood fill from the border over light, low-saturation pixels,
// so the cat's cream fill (enclosed by its outline) survives.
// usage: node scripts/cutout-personaje.mjs personajes-src/<id>.jpg public/personajes/<id> hiperfoco,conectada,mil-ideas,saturada,recargando,no-arranco
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [sheet, outDir, namesArg] = process.argv.slice(2);
const names = namesArg.split(",");

(async () => {
  const { data, info } = await sharp(sheet).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const bg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    return Math.min(r, g, b) > 212 && Math.max(r, g, b) - Math.min(r, g, b) < 20;
  };
  const seen = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!bg(p * 4)) continue;
    data[p * 4 + 3] = 0;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W);
    if (y < H - 1) stack.push(p + W);
  }
  // Eat the JPEG halo: twice, a light pixel touching transparency becomes transparent too.
  for (let pass = 0; pass < 2; pass++) {
    const clear = [];
    for (let p = 0; p < W * H; p++) {
      if (data[p * 4 + 3] === 0) continue;
      const x = p % W, y = (p / W) | 0;
      const near = (x > 0 && data[(p - 1) * 4 + 3] === 0) || (x < W - 1 && data[(p + 1) * 4 + 3] === 0) ||
        (y > 0 && data[(p - W) * 4 + 3] === 0) || (y < H - 1 && data[(p + W) * 4 + 3] === 0);
      if (near && Math.min(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]) > 185) clear.push(p);
    }
    for (const p of clear) data[p * 4 + 3] = 0;
  }
  const cut = sharp(data, { raw: { width: W, height: H, channels: 4 } });
  const full = await cut.png().toBuffer();
  fs.mkdirSync(outDir, { recursive: true });
  const cw = Math.floor(W / 3), ch = Math.floor(H / 2);
  for (let i = 0; i < 6; i++) {
    const left = (i % 3) * cw, top = Math.floor(i / 3) * ch;
    const raw = await sharp(full).extract({ left, top, width: cw, height: ch }).png().toBuffer();
    const cell = await sharp(raw).trim({ threshold: 1 }).toBuffer(); // trim in its own pipeline: sharp trims before it extracts
    const out = path.join(outDir, `${names[i]}.webp`);
    await sharp(cell).resize({ width: 420, height: 420, fit: "inside", withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 100 }).toFile(out);
    const m = await sharp(out).metadata();
    console.log(out, `${m.width}x${m.height}`, fs.statSync(out).size, "bytes");
  }
})();
