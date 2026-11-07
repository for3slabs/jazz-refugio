import { after } from "next/server";
import webpush from "web-push";
import { hayBase, sql } from "./db";
import type { Role } from "./token";

// Notifications on their phones (Web Push), only about gifts (Brian, 2026-11-06): a gift for you,
// yours was opened, yours was accepted, one of yours can be opened now. A phone asks for them with
// «recibir avisos»; its subscription is a row in `aviso` (0019) until it says no more (`baja_en`).
// The VAPID keys live in Vercel: the public one also reaches the browser (NEXT_PUBLIC_…), the
// private one never does. A notification never says what a gift holds — the lock screen is not
// the place to open it.

export const nombre = (r: Role) => (r === "jazz" ? "Jazz" : "Brian");
export const otro = (r: Role): Role => (r === "jazz" ? "brian" : "jazz");

export type Suscripcion = { endpoint: string; keys: { p256dh: string; auth: string } };
export type Aviso = { title: string; body: string; url?: string; tag?: string };

function listo(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv || !hayBase()) return false;
  webpush.setVapidDetails("https://jazz-refugio.vercel.app", pub, priv);
  return true;
}

export const esSuscripcion = (v: unknown): v is Suscripcion => {
  const s = v as Suscripcion;
  return (
    !!s &&
    typeof s.endpoint === "string" &&
    s.endpoint.startsWith("https://") &&
    s.endpoint.length <= 1000 &&
    typeof s.keys?.p256dh === "string" &&
    typeof s.keys?.auth === "string"
  );
};

export async function guardarSuscripcion(persona: Role, s: Suscripcion) {
  // the same phone subscribing again, or changing hands, keeps one row: the latest owner
  await sql()`
    insert into aviso (endpoint, persona, p256dh, auth)
    values (${s.endpoint}, ${persona}, ${s.keys.p256dh}, ${s.keys.auth})
    on conflict (endpoint) do update
      set persona = excluded.persona, p256dh = excluded.p256dh, auth = excluded.auth, baja_en = null`;
}

export async function quitarSuscripcion(persona: Role, endpoint: string) {
  await sql()`update aviso set baja_en = now() where endpoint = ${endpoint} and persona = ${persona}`;
}

// Sends to every phone of `persona` after the answer has left: opening a gift never waits for a
// push service. Never throws — a notification that fails must not undo the gift that caused it.
export function avisar(persona: Role, aviso: Aviso) {
  const send = () => enviar(persona, aviso);
  try {
    after(send);
  } catch {
    void send(); // outside a request (a script): just send it
  }
}

// A phone its push service no longer knows (404/410) is marked gone.
async function enviar(persona: Role, aviso: Aviso) {
  try {
    if (!listo()) return;
    const subs = await sql()<{ endpoint: string; p256dh: string; auth: string }[]>`
      select endpoint, p256dh, auth from aviso where persona = ${persona} and baja_en is null`;
    const payload = JSON.stringify({ url: "/regalos", ...aviso });
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
            TTL: 60 * 60 * 24 * 3,
            urgency: "normal",
          });
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await sql()`update aviso set baja_en = now() where endpoint = ${s.endpoint}`;
        }
      }),
    );
  } catch {}
}
