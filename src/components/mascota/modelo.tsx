"use client";

import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Puestos } from "@/lib/objeto";

// Her pet, sculpted in Blender (v7, Brian's reference: standing, big head, the peach ear, a paw
// waving) and exported as one Draco-compressed .glb (scripts/mascota-3d/michi.py → exporta.py).
// Its wardrobe travels inside as switchable pieces — acc-mono, acc-sombrero, acc-gorro-chef,
// acc-mandil — shown by what she put on. The decoder is served by the app itself (/draco/).
const URL = "/mascota/michi.glb";
const ROPA: Record<string, (p: Puestos) => boolean> = {
  "acc-mono": (p) => p.cuello === "mono",
  "acc-sombrero": (p) => p.cabeza === "sombrero",
  "acc-gorro-chef": (p) => p.cabeza === "gorro-chef",
  "acc-mandil": (p) => p.cuerpo === "mandil",
};

export function Modelo({ puestos }: { puestos: Puestos }) {
  const gltf = useLoader(GLTFLoader, URL, (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    loader.setDRACOLoader(draco);
  });
  // one copy per canvas, its pieces of clothing switched on or off
  const escena = useMemo(() => {
    const s = gltf.scene.clone(true);
    s.traverse((o) => {
      const regla = ROPA[o.name];
      if (regla) o.visible = regla(puestos);
    });
    return s;
  }, [gltf, puestos]);
  return <primitive object={escena} />;
}
