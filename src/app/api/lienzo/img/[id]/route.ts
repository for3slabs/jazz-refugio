import { NextResponse } from "next/server";
import { imagenPara } from "@/lib/lienzo";
import { currentRole } from "@/lib/session";

// Her images never have a public URL: this route streams one only to her, or to Brian
// when its board is shared. Ids are never reused, so the browser may keep it for good.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = await currentRole();
  if (!role) return new NextResponse(null, { status: 401 });
  const res = await imagenPara((await params).id, role).catch(() => null);
  if (!res || res.statusCode !== 200) return new NextResponse(null, { status: 404 });
  return new NextResponse(res.stream, {
    headers: { "content-type": res.blob.contentType, "cache-control": "private, max-age=31536000, immutable" },
  });
}
