"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ModoId } from "@/lib/modos";
import type { Puestos } from "@/lib/objeto";

// Her pet, sculpted in Blender (v7, Brian's reference: standing, big head, the peach ear, a paw
// waving) and exported as one Draco-compressed .glb (scripts/mascota-3d/michi.py → exporta.py).
// Its wardrobe travels inside as switchable pieces — acc-mono, acc-sombrero, acc-gorro-chef,
// acc-mandil — shown by what she put on. The decoder is served by the app itself (/draco/).
//
// The .glb carries no animation and no bones: every part is a loose piece. So the cat is rigged
// here — the parts are gathered under pivots (neck, shoulders, ear roots, tail root) — and her
// mode moves it, like the first coded cat did (Brian, 2026-11-06: «tenía animación en las
// primeras versiones»): star eyes and orbiting stars for «mil ideas», swirls for «saturada»,
// closed eyes for «recargando». A change of mode glides into the next pose, never jumps.
const URL = "/mascota/michi.glb";
const ROPA: Record<string, (p: Puestos) => boolean> = {
  "acc-mono": (p) => p.cuello === "mono",
  "acc-sombrero": (p) => p.cabeza === "sombrero",
  "acc-gorro-chef": (p) => p.cabeza === "gorro-chef",
  "acc-mandil": (p) => p.cuerpo === "mandil",
};

const GOLD = "#f0c14e";
const INK = "#2a1630";

type V3 = [number, number, number];

// One pose: where each pivot sits. Arm values are turns away from the sculpted pose (the right
// paw is sculpted up, waving; -1.3 brings it down to the side).
type Pose = {
  y: number;
  sx: number;
  sy: number;
  cabX: number;
  cabY: number;
  cabZ: number;
  orejas: number; // + droops them outward, − perks them up
  ojos: number; // 1 open · 0.1 closed
  brazoDer: number;
  brazoIzq: number; // − lifts it outward, + tucks it in
  cola: number;
  colaX: number; // + lowers it behind her
};
const CAMPOS = Object.keys({
  y: 0, sx: 0, sy: 0, cabX: 0, cabY: 0, cabZ: 0, orejas: 0, ojos: 0, brazoDer: 0, brazoIzq: 0, cola: 0, colaX: 0,
} satisfies Pose) as (keyof Pose)[];

// a blink every `period` seconds: open → shut → open in 0.16 s
function blink(t: number, period: number) {
  const p = t % period;
  return p < 0.16 ? Math.abs(Math.cos((p / 0.16) * Math.PI)) * 0.9 + 0.1 : 1;
}

export function pose(modo: ModoId | null, t: number): Pose {
  const S = Math.sin;
  switch (modo) {
    case "hiperfoco": // still and absorbed: head forward, ears up, slow blinks
      return {
        y: 0, sx: 1, sy: 1 + 0.01 * S(t * 1.2),
        cabX: 0.14, cabY: 0.05 * S(t * 0.3), cabZ: 0,
        orejas: -0.14, ojos: 0.75 * blink(t, 6),
        brazoDer: -1.25, brazoIzq: 0.1, cola: 0.06 * S(t * 0.8), colaX: 0,
      };
    case "conectada": // wants to talk: waves, tilts its head, happy tail
      return {
        y: 0.05 * Math.abs(S(t * 3.4)), sx: 1, sy: 1 + 0.015 * S(t * 6.8),
        cabX: 0, cabY: 0.1 * S(t * 0.9), cabZ: 0.16 * S(t * 1.4),
        orejas: -0.05, ojos: blink(t, 3.4),
        brazoDer: 0.35 * S(t * 7), brazoIzq: -0.15 + 0.1 * S(t * 3.5), cola: 0.5 * S(t * 3), colaX: 0,
      };
    case "mil ideas": { // hops, looks everywhere, ears twitch, quick tail
      const hop = Math.max(0, S(t * 5.5));
      return {
        y: 0.14 * hop, sx: 1 - 0.02 * hop, sy: 1 + 0.04 * hop,
        cabX: -0.06, cabY: 0.45 * S(t * 2.1) + 0.1 * S(t * 7.3), cabZ: 0.08 * S(t * 3.1),
        orejas: S(t * 1.7) > 0 ? 0.18 * S(t * 11) : 0, ojos: 1,
        brazoDer: 0.3 * S(t * 10), brazoIzq: -0.4 - 0.25 * S(t * 5.5), cola: 0.6 * S(t * 8), colaX: -0.1,
      };
    }
    case "saturada": // ears down, head low, huddled, slow deep breaths
      return {
        y: 0, sx: 1.03, sy: 0.93 + 0.025 * S(t * 0.9),
        cabX: 0.24, cabY: 0, cabZ: 0.03 * S(t * 0.5),
        orejas: 0.75, ojos: 1,
        brazoDer: -1.35, brazoIzq: 0.3, cola: 0.04 * S(t * 0.6), colaX: 0.35,
      };
    case "recargando": // asleep: eyes shut, nodding, big slow breaths
      return {
        y: 0, sx: 1, sy: 1 + 0.035 * S(t * 0.8),
        cabX: 0.2 + 0.07 * S(t * 0.4), cabY: 0, cabZ: 0.14,
        orejas: 0.3, ojos: 0.1,
        brazoDer: -1.35, brazoIzq: 0.2, cola: 0.03 * S(t * 0.5), colaX: 0.2,
      };
    case "no arranco": { // crouches to start, a half hop that does not take off, the paw goes up and down
      const c = t % 3.2;
      const crouch = c < 1.4 ? S((c / 1.4) * (Math.PI / 2)) : c < 1.7 ? 1 - (c - 1.4) / 0.3 : 0;
      const hop = c >= 1.4 && c < 1.8 ? S(((c - 1.4) / 0.4) * Math.PI) : 0;
      return {
        y: 0.07 * hop, sx: 1 + 0.03 * crouch, sy: 1 - 0.08 * crouch,
        cabX: 0.08 * crouch, cabY: 0.3, cabZ: 0.12,
        orejas: 0.2, ojos: blink(t, 4.2),
        brazoDer: -1.25 + 0.9 * Math.max(0, S(t * 1.9)), brazoIzq: 0.1, cola: 0.15 * S(t * 2), colaX: 0.1,
      };
    }
    default: { // no mode: breathes, blinks, and now and then waves its paw
      const c = t % 7;
      return {
        y: 0, sx: 1, sy: 1 + 0.015 * S(t * 1.6),
        cabX: 0, cabY: 0.06 * S(t * 0.5), cabZ: 0.05 * S(t * 0.7),
        orejas: 0, ojos: blink(t, 4.2),
        brazoDer: c < 2.2 ? 0.3 * S(c * 8) * S((c / 2.2) * Math.PI) : 0, brazoIzq: 0,
        cola: 0.25 * S(t * 1.5), colaX: 0,
      };
    }
  }
}

function starShape(r: number, inner: number) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? inner : r;
    if (i) s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return s;
}

function spiral(turns: number, r: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r * t, Math.sin(a) * r * t, 0));
  }
  return new THREE.CatmullRomCurve3(pts);
}

type Rig = {
  todo: THREE.Group;
  cabeza: THREE.Group;
  ojos: THREE.Group[];
  ojoPiezas: THREE.Object3D[];
  orejaDer: THREE.Group;
  orejaIzq: THREE.Group;
  brazoDer: THREE.Group;
  brazoIzq: THREE.Group;
  cola: THREE.Group;
  ojoEstrella: THREE.Object3D[];
  ojoRemolino: THREE.Object3D[];
  estrellas: THREE.Group;
  remolinos: THREE.Group;
};

// Gathers the loose parts under pivots. Each pivot is placed in model space, the parts are
// attach()ed (their world place kept), then the pivot is attached to its parent pivot.
function rig(s: THREE.Object3D): Rig {
  const todo = new THREE.Group();
  for (const o of [...s.children]) todo.add(o);
  s.add(todo);
  s.updateMatrixWorld(true);

  const piv = (at: V3, names: string[]) => {
    const g = new THREE.Group();
    g.position.set(...at);
    todo.add(g);
    g.updateMatrixWorld(true);
    for (const n of names) {
      // GLTFLoader cleans node names («brazo-der-cap.001» arrives as «brazo-der-cap001»)
      const o = todo.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(n));
      if (!o) throw new Error(`michi.glb has no part «${n}»`);
      g.attach(o);
    }
    return g;
  };

  const gold = new THREE.MeshToonMaterial({ color: GOLD });
  const ink = new THREE.MeshBasicMaterial({ color: INK });
  const starGeo = new THREE.ExtrudeGeometry(starShape(0.12, 0.05), { depth: 0.03, bevelEnabled: false });
  const swirlGeo = new THREE.TubeGeometry(spiral(2.2, 0.11), 80, 0.014, 6, false);

  const ojos: THREE.Group[] = [];
  const ojoEstrella: THREE.Object3D[] = [];
  const ojoRemolino: THREE.Object3D[] = [];
  for (const side of [1, -1] as const) {
    const at: V3 = [0.36 * side, 1.8, 0.8];
    const g = piv(at, [`ojo-${side}`, `brillo-${side}`]);
    ojos.push(g);
    // the mode faces: drawn on the eye, hidden until her mode asks for them
    const star = new THREE.Mesh(starGeo, gold);
    star.position.set(0, 0, 0.07);
    const swirl = new THREE.Mesh(swirlGeo, ink);
    swirl.position.set(0, 0, 0.08);
    star.visible = swirl.visible = false;
    todo.add(star, swirl);
    star.position.add(new THREE.Vector3(...at));
    swirl.position.add(new THREE.Vector3(...at));
    s.updateMatrixWorld(true);
    ojoEstrella.push(star);
    ojoRemolino.push(swirl);
  }
  const ojoPiezas = ["ojo-1", "ojo--1", "brillo-1", "brillo--1"]
    .map((n) => todo.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(n)))
    .filter((o): o is THREE.Object3D => !!o);

  const orejaDer = piv([0.53, 2.23, 0.02], ["oreja-der", "oreja-der-hueco"]);
  const orejaIzq = piv([-0.53, 2.23, 0.02], ["oreja-izq", "oreja-izq-hueco"]);
  const cabeza = piv(
    [0, 1.2, 0.05],
    ["cabeza", "chapa-1", "chapa--1", "nariz", "boca", "lengua", "acc-sombrero", "acc-gorro-chef"],
  );
  s.updateMatrixWorld(true);
  for (const g of [...ojos, ...ojoEstrella, ...ojoRemolino, orejaDer, orejaIzq]) cabeza.attach(g);

  const brazoDer = piv(
    [0.55, 1.06, 0.04],
    ["brazo-der", "brazo-der-cap", "brazo-der-cap.001", "mano-der", "cojin-0", "cojin-1", "cojin-2", "dedo-0", "dedo-1", "dedo-2"],
  );
  const brazoIzq = piv([-0.55, 1.02, 0.02], ["brazo-izq", "brazo-izq-cap", "brazo-izq-cap.001", "mano-izq"]);
  const cola = piv([0.3, 0.5, -0.5], ["cola"]);

  // over the head: six stars orbit for «mil ideas», three swirls float for «saturada»
  const estrellas = new THREE.Group();
  estrellas.position.set(0, 2.95, 0);
  const smallStar = new THREE.ExtrudeGeometry(starShape(0.1, 0.04), { depth: 0.02, bevelEnabled: false });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const m = new THREE.Mesh(smallStar, gold);
    m.position.set(Math.cos(a) * 1.1, Math.sin(i * 1.7) * 0.15, Math.sin(a) * 1.1);
    estrellas.add(m);
  }
  const remolinos = new THREE.Group();
  remolinos.position.set(0, 2.95, 0);
  const bigSwirl = new THREE.TubeGeometry(spiral(1.6, 0.15), 60, 0.016, 6, false);
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(bigSwirl, ink);
    m.position.set((i - 1) * 0.55, i === 1 ? 0.12 : 0, 0.3);
    remolinos.add(m);
  }
  estrellas.visible = remolinos.visible = false;
  s.add(estrellas, remolinos);

  // fused last, once every piece sits under its pivot
  const caras = new Set([...ojoEstrella, ...ojoRemolino]);
  for (const g of [todo, cabeza, orejaDer, orejaIzq, brazoDer, brazoIzq, cola]) fundir(g, caras);
  for (const n of Object.keys(ROPA)) {
    const ropa = s.getObjectByName(n);
    if (ropa) fundir(ropa);
  }

  return {
    todo, cabeza, ojos, ojoPiezas, orejaDer, orejaIzq, brazoDer, brazoIzq, cola,
    ojoEstrella, ojoRemolino, estrellas, remolinos,
  };
}

// One draw per material inside each group that moves as one: the 53 sculpted pieces were 53 draws
// every frame (S102 audit: 41 % of a slow phone's CPU with the home open). Only the meshes that are
// direct children are fused — nested pivots keep moving on their own, and a garment stays one group
// that switches on and off. The eyes are left as they are: they blink and swap faces — and the
// faces drawn over them (`dejar`) switch on and off one by one, so they are never fused.
function fundir(g: THREE.Object3D, dejar: Set<THREE.Object3D> = new Set()) {
  g.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
  const cubos = new Map<string, THREE.Mesh[]>();
  for (const o of g.children) {
    const m = o as THREE.Mesh;
    if (!m.isMesh || Array.isArray(m.material) || dejar.has(m)) continue;
    const attrs = Object.keys(m.geometry.attributes).sort().join(",");
    const k = `${m.material.uuid}|${attrs}|${m.geometry.index ? 1 : 0}`;
    cubos.set(k, [...(cubos.get(k) ?? []), m]);
  }
  for (const piezas of cubos.values()) {
    if (piezas.length < 2) continue;
    const geos = piezas.map((m) => m.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)));
    const fundida = mergeGeometries(geos);
    for (const x of geos) x.dispose();
    if (!fundida) continue; // shapes that cannot be joined stay as they were
    const una = new THREE.Mesh(fundida, piezas[0].material);
    una.name = `${g.name || "grupo"}:${piezas.map((m) => m.name).join("+")}`.slice(0, 120);
    for (const m of piezas) g.remove(m);
    g.add(una);
  }
}

function aplicar(r: Rig, p: Pose, modo: ModoId | null) {
  r.todo.position.y = p.y;
  r.todo.scale.set(p.sx, p.sy, p.sx);
  r.cabeza.rotation.set(p.cabX, p.cabY, p.cabZ);
  for (const o of r.ojos) o.scale.y = p.ojos;
  r.orejaDer.rotation.z = -p.orejas;
  r.orejaIzq.rotation.z = p.orejas;
  r.brazoDer.rotation.z = p.brazoDer;
  r.brazoIzq.rotation.z = p.brazoIzq;
  r.cola.rotation.set(-p.colaX, p.cola, 0); // + colaX lowers it behind her (a + x turn would swing it forward)
  const star = modo === "mil ideas";
  const swirl = modo === "saturada";
  for (const o of r.ojoPiezas) o.visible = !star && !swirl;
  for (const o of r.ojoEstrella) o.visible = star;
  for (const o of r.ojoRemolino) o.visible = swirl;
  r.estrellas.visible = star;
  r.remolinos.visible = swirl;
}

type Memoria = { pose: Pose | null };

// one frame: glide toward the mode's pose — a change of mode never jumps. `still` snaps to it.
function avanzar(r: Rig, mem: Memoria, modo: ModoId | null, t: number, dt: number, still: boolean) {
  const meta = pose(modo, still ? 0 : t);
  const cur = still || !mem.pose ? { ...meta } : mem.pose;
  const k = 1 - Math.exp(-Math.min(dt, 0.1) * 8);
  if (!still) for (const c of CAMPOS) cur[c] += (meta[c] - cur[c]) * k;
  mem.pose = cur;
  aplicar(r, cur, modo);
  r.estrellas.rotation.y = still ? 0 : t * 0.6;
  r.remolinos.position.y = 2.95 + (still ? 0 : Math.sin(t * 1.4) * 0.05);
}

function vestir(escena: THREE.Object3D, puestos: Puestos) {
  escena.traverse((o) => {
    const regla = ROPA[o.name];
    if (regla) o.visible = regla(puestos);
  });
}

export function Modelo({ puestos, modo, still }: { puestos: Puestos; modo: ModoId | null; still: boolean }) {
  const gltf = useLoader(GLTFLoader, URL, (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    loader.setDRACOLoader(draco);
  });
  // one copy per canvas, rigged once
  const gato = useMemo(() => {
    const escena = gltf.scene.clone(true);
    return { escena, r: rig(escena), mem: { pose: null } as Memoria };
  }, [gltf]);

  // her clothes switch on or off without rebuilding the cat
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    vestir(gato.escena, puestos);
    invalidate();
  }, [gato, puestos, invalidate]);

  // «menos movimiento»: the cat stands still in its mode's pose — drawn once per change
  useEffect(() => {
    if (!still) return;
    avanzar(gato.r, gato.mem, modo, 0, 0, true);
    invalidate();
  }, [still, modo, gato, invalidate]);

  useFrame(({ clock }, dt) => {
    if (!still) avanzar(gato.r, gato.mem, modo, clock.elapsedTime, dt, false);
  });

  return <primitive object={gato.escena} />;
}
