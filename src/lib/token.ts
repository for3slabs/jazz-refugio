// The access token is `<expiry>.<role>.<signature>`: an HMAC of expiry + role with
// REFUGIO_SECRETO. Shared by the proxy (every request) and the server code that reads
// or writes private content.

export const COOKIE = "refugio";
export const MAX_AGE_S = 60 * 60 * 24 * 180; // 180 days: she should not have to log in again

// jazz opens her place; brian's word opens only «regalos» (the proxy keeps him there).
export type Role = "jazz" | "brian";
const ROLES: readonly Role[] = ["jazz", "brian"];

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

export async function issueToken(role: Role, now = Date.now()): Promise<string | null> {
  const s = secret();
  if (!s) return null;
  const exp = Math.floor(now / 1000) + MAX_AGE_S;
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(s), enc.encode(`refugio.${exp}.${role}`));
  return `${exp}.${role}.${Buffer.from(sig).toString("base64url")}`;
}

export async function verifyToken(token: string | undefined, now = Date.now()): Promise<Role | null> {
  const s = secret();
  if (!s || !token) return null;
  const [expRaw, role, sigRaw, ...rest] = token.split(".");
  if (!expRaw || !sigRaw || rest.length || !ROLES.includes(role as Role)) return null;
  const exp = Number(expRaw);
  if (!Number.isInteger(exp) || exp * 1000 <= now) return null;
  // subtle.verify compares in constant time; the role is inside the signed text.
  const ok = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(s),
    Buffer.from(sigRaw, "base64url"),
    enc.encode(`refugio.${exp}.${role}`),
  );
  return ok ? (role as Role) : null;
}
