# tu refugio

A small, calm web app to come back to: when the mind drifts, one button brings it back in
under a minute — breathe, pick the smallest next step, start a short timer — and rewards the
return with a flower in a garden that only grows.

Built with Next.js 16 (App Router, Cache Components) and Tailwind CSS 4.

## Screens

| Route | What it does |
|---|---|
| `/` | the orb, the one big button, today's line, a running timer if there is one |
| `/volver` | three steps: breathe (~30 s) → the smallest next step → 10 or 25 min timer + reward |
| `/superpoderes` | five strength cards, swipeable |
| `/brian` | notes left for the owner of this place — written right there by Brian, shown at once |
| `/tu` | the garden: one flower per return, never reset |
| `/ajustes` | less motion, sign out of this device |
| `/entrar` | the door: a single passphrase |

## Design

Neon Noir by default (a light «calm» theme is opt-in), one type family (Bricolage Grotesque: display,
label and body voices), glow only on the orb, depth from two surface steps instead of shadows.
⛔ No blue in any shade: `npm run check:palette` (run by `npm run build`) fails if any color in `src/`
sits at OKLCH hue 200–300°, if a theme token leaves 305–345°, or if a text pair drops under 4.5:1.

## Privacy by design

- **Every page is behind a passphrase** (`src/proxy.ts`). The access cookie is an HMAC-signed
  expiry (`src/lib/token.ts`), `httpOnly`, 180 days.
- **Two roles, one door.** Jazz's word opens her place; Brian's word also lets him write and delete
  notes. The role is inside the signed cookie, and every write checks it again on the server.
- **No personal content lives in this repository.** Notes are one private file in a Vercel Blob store
  (`src/lib/notes.ts`), read without the CDN cache so a new one shows at once; the garden, the timer
  and the theme stay in the visitor's own browser (`src/lib/local.ts`).
- A note she has not opened makes the «mensajes» door glow (`/api/ultima` returns only its time).
- Pages are marked `noindex`.

## Configuration

| Variable | Meaning |
|---|---|
| `REFUGIO_CLAVE` | Jazz's passphrase (case, accents and extra spaces are ignored) |
| `REFUGIO_CLAVE_BRIAN` | Brian's passphrase — same door, can also write notes |
| `REFUGIO_SECRETO` | random string, ≥ 32 characters, signs the access cookie — changing it signs everyone out |
| `BLOB_READ_WRITE_TOKEN` | the private Blob store (set by `vercel blob create-store`); production writes `notas/notas.json`, anything else `notas/dev.json` |

Without `REFUGIO_CLAVE` and `REFUGIO_SECRETO` nobody can get in — it fails closed.

## Deploy

`.github/workflows/ci.yml` runs lint + a real build on every PR and on `main`; on `main` it also deploys
to Vercel once the `VERCEL_TOKEN` secret exists (until then it says so and skips).

## Run it

```bash
npm install
cp .env.example .env.local   # then fill the values
npm run dev
```

⚠️ After editing `src/app/globals.css`, an incremental `next build` may keep the previous CSS.
Move `.next` away before a build you are going to judge visually.
