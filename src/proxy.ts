import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE, verifyToken } from "@/lib/token";

// Every page sits behind the passphrase; only the door itself and static files are open — and the
// daily purge, which Vercel's cron calls with its own secret instead of a cookie (api/cron/purga).
// Her refuge is hers (Brian, 2026-10-25: «es su lugar seguro de ella … nada rastro mío»): Brian's
// word opens «regalos» — to wrap gifts for her and open hers — and every other page sends him back
// there, so nothing else of hers is ever on his screen.
const DE_BRIAN = /^\/(regalos(\/|$)|api\/ultima$)/;

export async function proxy(request: NextRequest) {
  const role = await verifyToken(request.cookies.get(COOKIE)?.value);
  if (role === "jazz") return NextResponse.next();
  if (role === "brian") {
    if (DE_BRIAN.test(request.nextUrl.pathname)) return NextResponse.next();
    if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/regalos", request.url));
  }
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/entrar", request.url));
}

export const config = {
  matcher: [
    "/((?!entrar|api/cron/purga$|_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$).*)",
  ],
};
