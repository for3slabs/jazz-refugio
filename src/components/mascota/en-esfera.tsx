"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { ModoId } from "@/lib/modos";
import type { Puestos } from "@/lib/objeto";

// three.js loads after the page, only where the cat is; until then the orb shows its colour.
const Escena = dynamic(() => import("./escena"), { ssr: false });

// Her pet inside the orb, on the colour of her mode. For her the orb is the door to its
// wardrobe; for Brian it only shows how she is.
export function GatoEnEsfera({ modo, puestos, href }: { modo: ModoId | null; puestos: Puestos; href?: string }) {
  const cat = (
    <div className="absolute inset-[3%] overflow-hidden rounded-full">
      <Escena modo={modo} puestos={puestos} interactive={false} className="absolute inset-0" />
    </div>
  );
  if (!href) return cat;
  return (
    <Link href={href} aria-label="tu mascota" className="absolute inset-0 rounded-full">
      {cat}
    </Link>
  );
}
