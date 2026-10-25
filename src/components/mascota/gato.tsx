"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ModoId } from "@/lib/modos";

// Her pet: one cat, the drawing she liked made 3D — cream fur, the peach patch over the left
// ear, cel shading and a dark outline like the ink line of the 2D sheets. Its face follows her
// mode; what it wears is a separate piece, so a new object never means drawing the cat again.
// Units: the head is about 2 wide.

export type Accesorio = "sombrero" | null;

const C = {
  fur: "#fbf3e8",
  peach: "#f4ad84",
  innerEar: "#f5bcc2",
  nose: "#ee8fa0",
  ink: "#2b1f2e",
  blush: "#f593ab",
  mouth: "#de6577",
  tongue: "#f59aa8",
  gold: "#f0c14e",
  hat: "#7044aa",
};

// Cel shading in three steps, like a flat-coloured drawing with one shadow.
const ramp = (() => {
  const t = new THREE.DataTexture(new Uint8Array([196, 186, 196, 255, 232, 228, 232, 255, 255, 255, 255, 255]), 3, 1);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();
const toon = (color: string, vertexColors = false) =>
  new THREE.MeshToonMaterial({ color: vertexColors ? "#ffffff" : color, gradientMap: ramp, vertexColors });

// The ink line: the same shape pushed out along its normals, drawn from the inside, in ink.
const outline = (thickness: number) =>
  new THREE.ShaderMaterial({
    uniforms: { t: { value: thickness }, c: { value: new THREE.Color(C.ink) } },
    vertexShader: "uniform float t; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * t, 1.0); }",
    fragmentShader: "uniform vec3 c; void main(){ gl_FragColor = vec4(c, 1.0); }",
    side: THREE.BackSide,
  });

type V3 = [number, number, number];

// A body part: the shape in toon colour plus its outline.
function Part({
  geo,
  mat,
  line = 0.022,
  position,
  rotation,
  scale,
}: {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  line?: number;
  position?: V3;
  rotation?: V3;
  scale?: V3;
}) {
  const ink = useMemo(() => outline(line), [line]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo} material={mat} />
      {line > 0 && <mesh geometry={geo} material={ink} />}
    </group>
  );
}

const HEAD = { x: 1.08, y: 0.94, z: 0.98, cy: 1.5 };
function onFace(x: number, y: number, lift = 0.01): V3 {
  const k = 1 - (x / HEAD.x) ** 2 - ((y - HEAD.cy) / HEAD.y) ** 2;
  return [x, y, Math.sqrt(Math.max(k, 0)) * HEAD.z + lift];
}

// The head, with the peach patch painted on its own vertices: an organic edge, not a tile.
function headGeometry() {
  const g = new THREE.SphereGeometry(1, 64, 48);
  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const fur = new THREE.Color(C.fur), peach = new THREE.Color(C.peach);
  const c = new THREE.Vector3(-0.62, 0.7, 0.36).normalize();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const wobble = Math.sin(Math.atan2(v.y, v.x) * 5) * 0.035 + Math.sin(v.z * 9) * 0.02;
    const col = v.dot(c) > 0.74 + wobble ? peach : fur;
    colors.set([col.r, col.g, col.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
}

function starShape(r = 0.12, inner = 0.05) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? inner : r;
    if (i) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return s;
}

function spiral(turns = 2.2, r = 0.1) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60, a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r * t, Math.sin(a) * r * t, 0));
  }
  return new THREE.CatmullRomCurve3(pts);
}

// The sombrero as one turned profile: a rounded crown and a brim that curls up at the edge.
function sombreroGeometry() {
  const p = [
    [0, 0.98], [0.26, 0.96], [0.42, 0.88], [0.5, 0.66], [0.57, 0.32], [0.63, 0.12], [0.9, 0.07], [1.2, 0.1],
    [1.42, 0.2], [1.55, 0.34], [1.6, 0.4], [1.62, 0.36], [1.52, 0.22], [1.28, 0.05], [0.95, -0.01], [0.62, 0.0],
  ]
    .reverse() // listed top to bottom for reading; turned bottom to top so the faces point outward
    .map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(p, 72);
}

const ink = new THREE.MeshBasicMaterial({ color: C.ink });

function Eye({ side, modo }: { side: 1 | -1; modo: ModoId | null }) {
  const star = useMemo(() => new THREE.ExtrudeGeometry(starShape(), { depth: 0.03, bevelEnabled: false }), []);
  const swirl = useMemo(() => new THREE.TubeGeometry(spiral(), 80, 0.013, 6, false), []);
  // closed and content: a soft «u»
  const closed = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.09, 0.02, 0), new THREE.Vector3(0, -0.09, 0.01), new THREE.Vector3(0.09, 0.02, 0)),
        24,
        0.018,
        8,
        false,
      ),
    [],
  );
  const gold = useMemo(() => toon(C.gold), []);
  const pos = onFace(0.37 * side, 1.56, 0.02);

  if (modo === "mil ideas") return <mesh geometry={star} material={gold} position={pos} />;
  if (modo === "saturada") return <mesh geometry={swirl} material={ink} position={pos} />;
  if (modo === "recargando") return <mesh geometry={closed} material={ink} position={pos} />;
  if (modo === "hiperfoco")
    return (
      <group position={pos}>
        <mesh scale={[1.8, 0.4, 0.5]} material={ink}>
          <sphereGeometry args={[0.075, 20, 12]} />
        </mesh>
        <mesh position={[0, 0.14, 0]} rotation={[0, 0, -0.35 * side]} material={ink}>
          <capsuleGeometry args={[0.016, 0.13, 4, 8]} />
        </mesh>
      </group>
    );
  const look = modo === "no arranco" ? 0.06 : 0;
  return (
    <group position={[pos[0] + look, pos[1], pos[2]]}>
      <mesh scale={[1, 1.2, 0.55]} material={ink}>
        <sphereGeometry args={[0.095, 24, 16]} />
      </mesh>
      <mesh position={[0.03, 0.045, 0.045]}>
        <sphereGeometry args={[0.028, 12, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function Mouth({ modo }: { modo: ModoId | null }) {
  const open = modo === null || modo === "conectada" || modo === "mil ideas";
  if (open)
    return (
      <group position={onFace(0, 1.27, 0.014)} rotation={[-0.25, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI]}>
          <circleGeometry args={[0.13, 28, 0, Math.PI]} />
          <meshBasicMaterial color={C.mouth} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.075, 0.002]} scale={[1, 0.6, 1]}>
          <circleGeometry args={[0.07, 20]} />
          <meshBasicMaterial color={C.tongue} />
        </mesh>
      </group>
    );
  if (modo === "recargando")
    return (
      <mesh position={onFace(0, 1.31, 0.014)} rotation={[0, 0, Math.PI]} material={ink}>
        <torusGeometry args={[0.06, 0.014, 8, 20, Math.PI]} />
      </mesh>
    );
  const frown = modo === "saturada" || modo === "no arranco";
  return frown ? (
    <mesh position={onFace(0, 1.25, 0.014)} material={ink}>
      <torusGeometry args={[0.065, 0.014, 8, 20, Math.PI]} />
    </mesh>
  ) : (
    <mesh position={onFace(0, 1.3, 0.014)} rotation={[0, 0, Math.PI / 2]} material={ink}>
      <capsuleGeometry args={[0.014, 0.1, 4, 8]} />
    </mesh>
  );
}

function Ear({ side, droop, geo }: { side: 1 | -1; droop: boolean; geo: THREE.BufferGeometry }) {
  const outer = useMemo(() => toon(side === -1 ? C.peach : C.fur), [side]);
  const inner = useMemo(() => toon(C.innerEar), []);
  return (
    <group position={[0.56 * side, 2.2, -0.02]} rotation={[0, 0, (droop ? -1.1 : -0.3) * side]}>
      <Part geo={geo} mat={outer} scale={[1, 1, 0.62]} />
      <Part geo={geo} mat={inner} line={0} position={[0, -0.03, 0.12]} scale={[0.6, 0.66, 0.3]} />
    </group>
  );
}

function Sombrero() {
  const geo = useMemo(() => sombreroGeometry(), []);
  const hat = useMemo(() => toon(C.hat), []);
  const gold = useMemo(() => toon(C.gold), []);
  return (
    <group position={[0, 2.18, 0.02]} rotation={[0.16, 0, -0.07]}>
      <Part geo={geo} mat={hat} line={0.025} />
      <mesh position={[0, 0.16, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}>
        <torusGeometry args={[0.6, 0.045, 10, 56]} />
      </mesh>
      <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold}>
        <torusGeometry args={[1.28, 0.022, 8, 72]} />
      </mesh>
    </group>
  );
}

function Aura({ modo }: { modo: ModoId | null }) {
  const ref = useRef<THREE.Group>(null);
  const star = useMemo(() => new THREE.ExtrudeGeometry(starShape(0.1, 0.04), { depth: 0.02, bevelEnabled: false }), []);
  const swirl = useMemo(() => new THREE.TubeGeometry(spiral(1.6, 0.15), 60, 0.016, 6, false), []);
  const gold = useMemo(() => toon(C.gold), []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (modo === "mil ideas") ref.current.rotation.y = clock.elapsedTime * 0.4;
    else ref.current.position.y = 2.85 + Math.sin(clock.elapsedTime * 1.4) * 0.05;
  });
  if (modo !== "mil ideas" && modo !== "saturada") return null;
  const n = modo === "mil ideas" ? 6 : 3;
  return (
    <group ref={ref} position={[0, 2.85, 0]}>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <mesh
            key={i}
            geometry={modo === "mil ideas" ? star : swirl}
            material={modo === "mil ideas" ? gold : ink}
            position={
              modo === "mil ideas"
                ? [Math.cos(a) * 1.1, Math.sin(i * 1.7) * 0.15, Math.sin(a) * 1.1]
                : [(i - 1) * 0.55, i === 1 ? 0.12 : 0, 0.3]
            }
          />
        );
      })}
    </group>
  );
}

export function Gato({ modo, accesorio }: { modo: ModoId | null; accesorio: Accesorio }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const wave = useRef<THREE.Group>(null);

  const g = useMemo(
    () => ({
      head: headGeometry(),
      ball: new THREE.SphereGeometry(1, 48, 32),
      limb: new THREE.CapsuleGeometry(1, 1, 8, 20),
      ear: new THREE.ConeGeometry(0.36, 0.62, 32),
      tail: new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.3, -0.5),
          new THREE.Vector3(0.4, 0.35, -0.8),
          new THREE.Vector3(0.7, 0.8, -0.75),
          new THREE.Vector3(0.62, 1.15, -0.55),
        ]),
        48,
        0.11,
        14,
        false,
      ),
    }),
    [],
  );
  const m = useMemo(() => ({ fur: toon(C.fur), peach: toon(C.peach), head: toon(C.fur, true), nose: toon(C.nose) }), []);

  const calm = modo === "recargando";
  const blinks = modo === null || modo === "conectada" || modo === "no arranco";

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (root.current) root.current.scale.y = 1 + Math.sin(t * (calm ? 1.1 : 2)) * 0.018;
    if (head.current) head.current.rotation.z = (modo === "no arranco" ? 0.15 : calm ? -0.12 : 0) + Math.sin(t * 0.9) * 0.03;
    if (eyes.current) eyes.current.scale.y = blinks && t % 4.2 > 4.06 ? 0.12 : 1;
    if (wave.current)
      wave.current.rotation.z =
        modo === "conectada" || modo === null ? 2.5 + Math.sin(t * 6) * 0.3 : modo === "no arranco" ? 2.7 : 0.35;
  });

  return (
    <group ref={root}>
      {/* body: a soft pear */}
      <Part geo={g.ball} mat={m.fur} position={[0, 0.62, 0]} scale={[0.66, 0.7, 0.6]} />
      {/* feet */}
      {[-1, 1].map((s) => (
        <Part key={s} geo={g.ball} mat={m.fur} position={[0.27 * s, 0.1, 0.22]} scale={[0.2, 0.15, 0.24]} />
      ))}
      {/* left paw resting in front */}
      <Part geo={g.limb} mat={m.fur} position={[-0.5, 0.62, 0.38]} rotation={[0.3, 0, 0.35]} scale={[0.14, 0.16, 0.14]} />
      {/* right arm: waves hello, or rests on the cheek when she cannot start */}
      <group ref={wave} position={[0.5, 0.86, 0.3]}>
        <Part geo={g.limb} mat={m.fur} position={[0, -0.24, 0]} scale={[0.14, 0.16, 0.14]} />
      </group>
      {/* tail with a peach tip */}
      <Part geo={g.tail} mat={m.fur} />
      <Part geo={g.ball} mat={m.peach} position={[0.62, 1.15, -0.55]} scale={[0.13, 0.13, 0.13]} />

      <group ref={head}>
        <Ear side={-1} droop={modo === "saturada"} geo={g.ear} />
        <Ear side={1} droop={modo === "saturada"} geo={g.ear} />
        <Part geo={g.head} mat={m.head} line={0.024} position={[0, HEAD.cy, 0]} scale={[HEAD.x, HEAD.y, HEAD.z]} />
        <group ref={eyes} position={[0, 1.56, 0]}>
          <group position={[0, -1.56, 0]}>
            <Eye side={-1} modo={modo} />
            <Eye side={1} modo={modo} />
          </group>
        </group>
        <Part geo={g.ball} mat={m.nose} line={0} position={onFace(0, 1.4, 0.02)} scale={[0.075, 0.055, 0.04]} />
        <Mouth modo={modo} />
        {[-1, 1].map((s) => (
          <mesh key={s} position={onFace(0.64 * s, 1.34, 0.008)} rotation={[0, 0.66 * s, 0]}>
            <circleGeometry args={[0.12, 28]} />
            <meshBasicMaterial color={C.blush} transparent opacity={modo === "saturada" ? 0.3 : 0.75} />
          </mesh>
        ))}
        {accesorio === "sombrero" && <Sombrero />}
      </group>
      <Aura modo={modo} />
    </group>
  );
}
