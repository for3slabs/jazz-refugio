# tu lienzo mental

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
| `/brian` | notes left for the owner of this place |
| `/tu` | the garden: one flower per return, never reset |
| `/ajustes` | less motion, sign out of this device |
| `/entrar` | the door: a single passphrase |

## Privacy by design

- **Every page is behind a passphrase** (`src/proxy.ts`). The access cookie is an HMAC-signed
  expiry (`src/lib/token.ts`), `httpOnly`, 180 days.
- **No personal content lives in this repository.** The notes come from an environment variable;
  the garden, the timer and the theme stay in the visitor's own browser (`src/lib/local.ts`).
- Pages are marked `noindex`.

## Configuration

| Variable | Meaning |
|---|---|
| `REFUGIO_CLAVE` | the passphrase (case, accents and extra spaces are ignored) |
| `REFUGIO_SECRETO` | random string, ≥ 32 characters, signs the access cookie — changing it signs everyone out |
| `REFUGIO_NOTAS` | JSON list of notes: `[{"fecha":"2026-10-24","texto":"…"}]` |

Without `REFUGIO_CLAVE` and `REFUGIO_SECRETO` nobody can get in — it fails closed.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill the three values
npm run dev
```

⚠️ After editing `src/app/globals.css`, an incremental `next build` may keep the previous CSS.
Move `.next` away before a build you are going to judge visually.
