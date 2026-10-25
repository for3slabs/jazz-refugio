"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ModoId } from "@/lib/modos";
import { type Accesorio, Gato } from "./gato";

// The stage: transparent, so the card behind it gives the colour of her mode. A drag turns the
// cat; let go and it keeps facing where she left it, swaying a little.

function Sombra() {
  // a soft round shadow on the floor, drawn once
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    r.addColorStop(0, "rgba(20,8,24,0.42)");
    r.addColorStop(1, "rgba(20,8,24,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} scale={[2.4, 1.7, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

function Giro({ angle, children }: { angle: React.RefObject<number>; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const target = angle.current + Math.sin(clock.elapsedTime * 0.5) * 0.08;
    ref.current.rotation.y += (target - ref.current.rotation.y) * 0.12;
  });
  return <group ref={ref}>{children}</group>;
}

export default function Escena({
  modo,
  accesorio,
  className = "",
  interactive = true,
}: {
  modo: ModoId | null;
  accesorio: Accesorio;
  className?: string;
  interactive?: boolean;
}) {
  const angle = useRef(-0.25);
  const drag = useRef<{ x: number; a: number } | null>(null);

  return (
    <div
      className={`touch-pan-y ${className}`}
      onPointerDown={(e) => {
        if (!interactive) return;
        drag.current = { x: e.clientX, a: angle.current };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current) angle.current = drag.current.a + (e.clientX - drag.current.x) * 0.012;
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 1.6, 7.6], fov: 30 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ camera }) => camera.lookAt(0, 1.35, 0)}
      >
        <hemisphereLight args={["#fff6ee", "#5a3a5e", 1.1]} />
        <directionalLight position={[3, 5, 6]} intensity={1.6} color="#fff3e8" />
        <directionalLight position={[-4, 3, -5]} intensity={0.9} color="#f6d9ff" />
        <Giro angle={angle}>
          <Gato modo={modo} accesorio={accesorio} />
        </Giro>
        <Sombra />
      </Canvas>
    </div>
  );
}
