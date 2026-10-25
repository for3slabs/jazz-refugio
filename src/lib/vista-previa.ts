import "server-only";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";

// The thumbnail of a link she pins to a goal: the page's own preview (Open Graph — the image and
// title WhatsApp shows), read once by the server when she saves, and kept with the goal.
//
// Opening any address someone types is a known door (SSRF): the server could be pointed at
// itself or at private networks. So: http(s) only, ports 80/443, every address the name resolves
// to must be public — checked inside the socket's own lookup, so a name cannot answer «public»
// to the check and «private» to the connection — redirects re-checked the same way (3 at most),
// 5 s in all, and never more than 512 KB read. Anything off returns null: the goal keeps its link,
// just without a thumbnail.

export type VistaPrevia = { titulo: string | null; imagen: string | null; sitio: string };

const LIMITE = 512 * 1024;
const TIEMPO = 5000;
const SALTOS = 3;

export const MAX_URL = 500;

// Private, loopback, link-local, shared, multicast and reserved ranges — none may be reached.
function privada(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return privada(v.slice(7)); // an IPv4 inside IPv6
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb") || v.startsWith("ff");
}

// The socket's lookup: resolves, and refuses the connection if any answer is not public.
const lookupSeguro = (host: string, options: object, cb: (err: Error | null, address: string | LookupAddress[], family?: number) => void) => {
  dnsLookup(host, { ...options, all: true }, (err, addresses) => {
    if (err) return cb(err, "");
    const lista = addresses as LookupAddress[];
    if (!lista.length || lista.some((a) => privada(a.address))) return cb(new Error("dirección no pública"), "");
    if ((options as { all?: boolean }).all) return cb(null, lista);
    cb(null, lista[0].address, lista[0].family);
  });
};

// A URL she may pin: http(s), no credentials inside, standard ports, a name or a public IP.
export function urlValida(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (u.username || u.password) return null;
  if (u.port && u.port !== "80" && u.port !== "443") return null;
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && privada(host)) return null;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return null;
  if (u.href.length > MAX_URL) return null;
  return u;
}

type Respuesta = { status: number; location: string | null; html: string | null };

function pedir(u: URL, hasta: number): Promise<Respuesta> {
  return new Promise((resolve, reject) => {
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(
      u,
      {
        method: "GET",
        lookup: lookupSeguro as never,
        headers: { "user-agent": "Mozilla/5.0 (compatible; tu-refugio/1.0; link preview)", accept: "text/html" },
        timeout: Math.max(1, hasta - Date.now()),
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          res.resume();
          return resolve({ status, location: res.headers.location ?? null, html: null });
        }
        if (status !== 200 || !String(res.headers["content-type"] ?? "").includes("text/html")) {
          res.resume();
          return resolve({ status, location: null, html: null });
        }
        let leido = 0;
        const partes: Buffer[] = [];
        res.on("data", (c: Buffer) => {
          leido += c.length;
          partes.push(c);
          // the preview lives in <head>: past the limit, stop reading and keep what arrived
          if (leido >= LIMITE) res.destroy();
        });
        res.on("close", () => resolve({ status, location: null, html: Buffer.concat(partes).subarray(0, LIMITE).toString("utf8") }));
        res.on("error", () => resolve({ status, location: null, html: Buffer.concat(partes).toString("utf8") }));
      },
    );
    req.on("timeout", () => req.destroy(new Error("tiempo")));
    req.on("error", reject);
    req.end();
  });
}

// HTML entities, named and numeric: pages write «/» as «&#47;» or «&#x2F;» inside their tags (Figma
// does), and an undecoded one breaks the image address.
const entidades: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const codigo = (n: number) => (Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "");
const limpiar = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => codigo(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => codigo(Number(d)))
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, e: string) => entidades[e])
    .replace(/\s+/g, " ")
    .trim();

function meta(html: string, nombres: string[]): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const clave = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
    if (!clave || !nombres.includes(clave)) continue;
    const valor = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (valor?.trim()) return limpiar(valor);
  }
  return null;
}

// Reads the page's preview, or null when it cannot be read safely. Never throws.
export async function vistaPrevia(url: URL): Promise<VistaPrevia | null> {
  const hasta = Date.now() + TIEMPO;
  let actual = url;
  try {
    for (let salto = 0; salto <= SALTOS; salto++) {
      const r = await pedir(actual, hasta);
      if (r.location) {
        const siguiente = urlValida(new URL(r.location, actual).href);
        if (!siguiente) return null;
        actual = siguiente;
        continue;
      }
      if (!r.html) return null;
      const fin = r.html.search(/<\/head>/i);
      const head = fin > 0 ? r.html.slice(0, fin) : r.html;
      const enTitle = /<title[^>]*>([^<]*)<\/title>/i.exec(head)?.[1];
      const titulo = meta(head, ["og:title", "twitter:title"]) ?? (enTitle ? limpiar(enTitle) : null);
      const crudo = meta(head, ["og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src"]);
      let imagen: string | null = null;
      if (crudo) {
        try {
          const i = new URL(crudo, actual);
          if (i.protocol === "https:" || i.protocol === "http:") imagen = i.href.slice(0, 1000);
        } catch {}
      }
      const sitio = (meta(head, ["og:site_name"]) ?? actual.hostname.replace(/^www\./, "")).slice(0, 100);
      return { titulo: titulo ? titulo.slice(0, 200) : null, imagen, sitio };
    }
    return null;
  } catch {
    return null;
  }
}
