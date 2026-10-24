import { cookies } from "next/headers";
import { connection } from "next/server";
import { COOKIE, type Role, verifyToken } from "./token";

// The proxy already guards every page; private data is checked again where it is read
// or written, so a matcher change can never expose it on its own.
// connection(): the answer depends on the clock (the token expires), so it is computed
// per request — never inside a prefetch prerender, where Next refuses Date.now().
export async function currentRole(): Promise<Role | null> {
  await connection();
  return verifyToken((await cookies()).get(COOKIE)?.value);
}
