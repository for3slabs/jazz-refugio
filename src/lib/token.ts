// The access token is `<expiry>.<signature>`: an HMAC of the expiry with REFUGIO_SECRETO.
// Shared by the proxy (every request) and the pages that read private content.

export const COOKIE = "refugio";
export const MAX_AGE_S = 60 * 60 * 24 * 180; // 180 days: she should not have to log in again

const enc = new TextEncoder();

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function secret(): string | null {
  const s = process.env.REFUGIO_SECRETO;
  // Fail closed: no secret, or a short one, means nobody gets in.
  return s && s.length >= 32 ? s : null;
}

export async function issueToken(now = Date.now()): Promise<string | null> {
  const s = secret();
  if (!s) return null;
  const exp = Math.floor(now / 1000) + MAX_AGE_S;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(s), enc.encode(`refugio.${exp}`));
  return `${exp}.${Buffer.from(sig).toString("base64url")}`;
}

export async function verifyToken(token: string | undefined, now = Date.now()): Promise<boolean> {
  const s = secret();
  if (!s || !token) return false;
  const [expRaw, sigRaw, ...rest] = token.split(".");
  if (!expRaw || !sigRaw || rest.length) return false;
  const exp = Number(expRaw);
  if (!Number.isInteger(exp) || exp * 1000 <= now) return false;
  // subtle.verify compares in constant time.
  return crypto.subtle.verify(
    "HMAC",
    await hmacKey(s),
    Buffer.from(sigRaw, "base64url"),
    enc.encode(`refugio.${exp}`),
  );
}
