import { cookies } from "next/headers";
import { COOKIE, type Role, verifyToken } from "./token";

// The proxy already guards every page; private data is checked again where it is read
// or written, so a matcher change can never expose it on its own.
export async function currentRole(): Promise<Role | null> {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}
