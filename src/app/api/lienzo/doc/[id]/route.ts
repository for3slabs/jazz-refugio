import { NextResponse } from "next/server";
import { docPara } from "@/lib/lienzo";
import { currentRole } from "@/lib/session";

// Her docs never have a public URL: this route streams one only to her, or to Brian when its board
// is shared, with its own name. PDFs, images, audio and video open in the browser; anything else
// downloads (SVG and HTML too). Ids are never reused, so the browser may keep it.
// SVG is an image that can carry script: opened here it would run with the viewer's session, so it
// always downloads.
const EN_LINEA = /^(application\/pdf|image\/(png|jpe?g|gif|webp|avif)|audio\/|video\/|text\/plain)/;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const role = await currentRole();
  if (!role) return new NextResponse(null, { status: 401 });
  const d = await docPara((await params).id, role).catch(() => null);
  if (!d || d.res.statusCode !== 200) return new NextResponse(null, { status: 404 });
  const tipo = d.mime || d.res.blob.contentType || "application/octet-stream";
  const nombre = encodeURIComponent(d.nombre);
  return new NextResponse(d.res.stream, {
    headers: {
      "content-type": tipo,
      "content-disposition": `${EN_LINEA.test(tipo) ? "inline" : "attachment"}; filename*=UTF-8''${nombre}`,
      "x-content-type-options": "nosniff",
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
}
