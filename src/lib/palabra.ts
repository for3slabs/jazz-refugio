import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { hayBase, sql } from "./db";

// Her word. Until she changes it from «ajustes», the one in Vercel (REFUGIO_CLAVE) opens her place;
// once she does, the scrypt hash in `palabra` (0018) is the only one that does. Brian's stays in
// Vercel and opens only «regalos».

const scrypt = promisify(scryptCb) as (p: string, salt: Buffer, len: number) => Promise<Buffer>;

export const MIN_PALABRA = 4;
export const MAX_PALABRA = 100;

// Forgiving on purpose: case, accents and extra spaces do not matter — a wrong
// accent should never lock her out of her own place.
export function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const digest = (s: string) => createHash("sha256").update(normalize(s)).digest();

// constant-time comparison with a word kept in an env var
export const igualA = (given: string, expected: string | undefined) =>
  !!expected && timingSafeEqual(digest(given), digest(expected));

async function cifrar(palabra: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(normalize(palabra), salt, 32);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

async function coincide(palabra: string, guardada: string) {
  const [, salt, hash] = guardada.split("$");
  const esperado = Buffer.from(hash, "base64url");
  const dado = await scrypt(normalize(palabra), Buffer.from(salt, "base64url"), esperado.length);
  return timingSafeEqual(dado, esperado);
}

// The hash she chose, or null while the word in Vercel still rules. A failed read throws: the
// caller refuses, it never falls back to the old word.
async function guardada(): Promise<string | null> {
  if (!hayBase()) return null;
  const [row] = await sql()<{ hash: string }[]>`select hash from palabra where persona = 'jazz'`;
  return row?.hash ?? null;
}

export async function esLaDeJazz(palabra: string): Promise<boolean> {
  const g = await guardada();
  return g ? coincide(palabra, g) : igualA(palabra, process.env.REFUGIO_CLAVE);
}

export async function guardarLaDeJazz(palabra: string) {
  const hash = await cifrar(palabra);
  await sql()`
    insert into palabra (persona, hash) values ('jazz', ${hash})
    on conflict (persona) do update set hash = excluded.hash, cambiada = now()`;
}
