import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { PREFIX } from "@/lib/lienzo";
import { currentRole } from "@/lib/session";
import { MAX_DOC } from "@/lib/tablero";

// A «doc» travels straight from her device to the private Blob store: a function takes at most
// 4.5 MB per request, a doc up to 10 MB. This route only hands out a short-lived permission — to
// her, for her docs folder, within the size — and the board registers the file afterwards
// (registrarDoc checks it really is there and within the limit).
export async function POST(req: Request) {
  if ((await currentRole()) !== "jazz") return NextResponse.json({ error: "Esto es solo de Jazz." }, { status: 403 });
  const body = (await req.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  try {
    const r = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`${PREFIX}/doc/`)) throw new Error("ruta no permitida");
        return { maximumSizeInBytes: MAX_DOC, addRandomSuffix: true };
      },
    });
    return NextResponse.json(r);
  } catch {
    return NextResponse.json({ error: "No se pudo preparar la subida. Inténtalo otra vez." }, { status: 400 });
  }
}
