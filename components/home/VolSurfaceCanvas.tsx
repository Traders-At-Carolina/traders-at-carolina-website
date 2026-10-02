"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ComponentRef, type KeyboardEvent, type RefObject } from "react";
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { VolSurfacePoster } from "@/components/home/VolSurfacePoster";
import { CAMERA, NK, NT, SCENE, WIRE_STEP, kFromX, tFromZ, toX, toY, toZ } from "@/components/home/volSurfaceScene";
import { DOMAIN, impliedVol, surfaceGrid, type VolParams } from "@/lib/vol-surface";

export type SurfaceHover = { moneyness: number; maturity: number; vol: number };

type VolSurfaceCanvasProps = {
  params: VolParams;
  autoRotate: boolean;
  label: string;
  onHover: (hover: SurfaceHover | null) => void;
  onInteractStart: () => void;
  onInteractEnd: () => void;
};

type Controls = ComponentRef<typeof OrbitControls>;

const { halfX: X, halfZ: Z, height: H, volMax: VOL_MAX } = SCENE;

/** Scene coordinates for a strike (as K/S) and a maturity (years). */
const xFromMoneyness = (m: number) => -X + ((Math.log(m) - DOMAIN.k[0]) / (DOMAIN.k[1] - DOMAIN.k[0])) * 2 * X;
const zFromMaturity = (T: number) => Z - ((T - DOMAIN.T[0]) / (DOMAIN.T[1] - DOMAIN.T[0])) * 2 * Z;

/** Brand colors read from the design tokens (00 §4), so the 3D scene never hard-codes hex. */
function useBrandColors() {
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => new THREE.Color(css.getPropertyValue(name).trim() || fallback);
    const navy = token("--color-navy", "#233265");
    const bone = token("--color-bone", "#ebeae4");
    const black = token("--color-black", "#000000");
    const white = token("--color-white", "#ffffff");
    // Three-stop ramp for implied vol: pale navy → navy → deep navy.
    const ramp = [navy.clone().lerp(bone, 0.6), navy.clone().lerp(bone, 0.2), navy.clone().lerp(black, 0.12)];
    return { navy, bone, black, white, ramp };
  }, []);
}

/** Anti-aliased, fixed-pixel-width line segments; positions can be rewritten in place every frame. */
function useLines(segments: number, color: THREE.Color, width: number, opacity: number) {
  const lines = useMemo(() => {
    const geometry = new LineSegmentsGeometry();
    geometry.setPositions(new Float32Array(segments * 6));
    const material = new LineMaterial({ color, linewidth: width, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
    const object = new LineSegments2(geometry, material);
    object.frustumCulled = false;
    // Thicker lines draw later, so the outline always lands on top of the wire grid.
    object.renderOrder = width;
    return object;
  }, [segments, color, width, opacity]);

  useEffect(
    () => () => {
      lines.geometry.dispose();
      lines.material.dispose();
    },
    [lines],
  );
  return lines;
}

/** Writes new segment endpoints into the line buffer without reallocating it. */
function writeLines(lines: LineSegments2, positions: Float32Array) {
  const start = lines.geometry.getAttribute("instanceStart") as THREE.InterleavedBufferAttribute;
  start.data.array.set(positions);
  start.data.needsUpdate = true;
}

const wireSegments = Math.ceil(NT / WIRE_STEP) * (NK - 1) + Math.ceil(NK / WIRE_STEP) * (NT - 1);
const outlineSegments = 2 * (NK - 1) + 2 * (NT - 1);

/** The surface: smooth-shaded mesh, a bone wire grid and a navy outline, all rewritten in place as params change. */
function Surface({ params, onHover }: Pick<VolSurfaceCanvasProps, "params" | "onHover">) {
  const invalidate = useThree((s) => s.invalidate);
  const colors = useBrandColors();
  const wires = useLines(wireSegments, colors.bone, 1, 0.75);
  const outline = useLines(outlineSegments, colors.ramp[2], 1.75, 1);

  const { mesh, values, wireBuf, outlineBuf } = useMemo(() => {
    const mesh = new THREE.BufferGeometry();
    mesh.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NK * NT * 3), 3));
    mesh.setAttribute("color", new THREE.BufferAttribute(new Float32Array(NK * NT * 3), 3));
    const index: number[] = [];
    for (let iT = 0; iT < NT - 1; iT++) {
      for (let ik = 0; ik < NK - 1; ik++) {
        const a = iT * NK + ik;
        index.push(a, a + NK, a + 1, a + 1, a + NK, a + NK + 1);
      }
    }
    mesh.setIndex(index);
    return {
      mesh,
      values: new Float32Array(NK * NT),
      wireBuf: new Float32Array(wireSegments * 6),
      outlineBuf: new Float32Array(outlineSegments * 6),
    };
  }, []);

  useEffect(() => () => mesh.dispose(), [mesh]);

  useEffect(() => {
    const { min, max } = surfaceGrid(params, NK, NT, values);
    const pos = mesh.getAttribute("position") as THREE.BufferAttribute;
    const col = mesh.getAttribute("color") as THREE.BufferAttribute;
    const tint = new THREE.Color();
    const [low, mid, high] = colors.ramp;
    for (let iT = 0; iT < NT; iT++) {
      for (let ik = 0; ik < NK; ik++) {
        const i = iT * NK + ik;
        pos.setXYZ(i, toX(ik), toY(values[i]), toZ(iT));
        const t = max > min ? (values[i] - min) / (max - min) : 0.5;
        if (t < 0.5) tint.lerpColors(low, mid, t * 2);
        else tint.lerpColors(mid, high, (t - 0.5) * 2);
        col.setXYZ(i, tint.r, tint.g, tint.b);
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    mesh.computeVertexNormals();
    mesh.computeBoundingSphere();

    // Lines sit a hair above the surface so they never z-fight with it; the outline sits above the wires,
    // which share its boundary rows and columns.
    let lift = 0.01;
    /** Writes the segment between grid points (ka, ta) and (kb, tb) at offset o; returns the next offset. */
    const seg = (out: Float32Array, o: number, ka: number, ta: number, kb: number, tb: number) => {
      out.set([toX(ka), toY(values[ta * NK + ka]) + lift, toZ(ta), toX(kb), toY(values[tb * NK + kb]) + lift, toZ(tb)], o);
      return o + 6;
    };
    let o = 0;
    for (let iT = 0; iT < NT; iT += WIRE_STEP) for (let ik = 0; ik < NK - 1; ik++) o = seg(wireBuf, o, ik, iT, ik + 1, iT);
    for (let ik = 0; ik < NK; ik += WIRE_STEP) for (let iT = 0; iT < NT - 1; iT++) o = seg(wireBuf, o, ik, iT, ik, iT + 1);
    writeLines(wires, wireBuf);

    o = 0;
    lift = 0.025;
    for (const iT of [0, NT - 1]) for (let ik = 0; ik < NK - 1; ik++) o = seg(outlineBuf, o, ik, iT, ik + 1, iT);
    for (const ik of [0, NK - 1]) for (let iT = 0; iT < NT - 1; iT++) o = seg(outlineBuf, o, ik, iT, ik, iT + 1);
    writeLines(outline, outlineBuf);

    invalidate();
  }, [params, mesh, values, wireBuf, outlineBuf, wires, outline, colors, invalidate]);

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    const k = kFromX(event.point.x);
    const T = tFromZ(event.point.z);
    onHover({ moneyness: Math.exp(k), maturity: T, vol: impliedVol(k, T, params) });
  }

  return (
    <>
      <mesh geometry={mesh} onPointerMove={handlePointerMove} onPointerOut={() => onHover(null)}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.7} metalness={0} polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={4} />
      </mesh>
      <primitive object={wires} />
      <primitive object={outline} />
    </>
  );
}

const STRIKE_TICKS = [0.7, 1, 1.4];
const MATURITY_TICKS = [0.5, 1, 1.5, 2];
const VOL_TICKS = [0.2, 0.4, 0.6, 0.8];
const TICK = 0.07;

type Label = { text: string; at: [number, number, number]; kind: "tick" | "title" };

/** Tick values and axis titles: plain spans positioned each rendered frame (no extra React roots). */
const LABELS: Label[] = [
  ...STRIKE_TICKS.map((m): Label => ({ text: m.toFixed(1), at: [xFromMoneyness(m), 0, Z + 0.2], kind: "tick" })),
  ...MATURITY_TICKS.map((T): Label => ({ text: `${T}y`, at: [-X - 0.22, 0, zFromMaturity(T)], kind: "tick" })),
  ...VOL_TICKS.map((v): Label => ({ text: `${Math.round(v * 100)}%`, at: [-X - 0.17, (v / VOL_MAX) * H, Z + 0.17], kind: "tick" })),
  { text: "Strike K/S", at: [0, 0, Z + 0.42], kind: "title" },
  { text: "Maturity", at: [-X - 0.5, 0, 0], kind: "title" },
  { text: "Implied vol", at: [-X, H + 0.2, Z], kind: "title" },
];

/** Projects each label's 3D anchor to the canvas and moves its span there. */
function LabelTracker({ spans }: { spans: RefObject<(HTMLSpanElement | null)[]> }) {
  const points = useMemo(() => LABELS.map(({ at }) => new THREE.Vector3(...at)), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    points.forEach((p, i) => {
      const el = spans.current[i];
      if (!el) return;
      v.copy(p).project(camera);
      el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translate(-50%, -50%)`;
      el.style.visibility = v.z < 1 ? "visible" : "hidden";
    });
  });
  return null;
}

/** Soft sky/ground fill plus a key and a rim light, all from the brand neutrals. */
function Lights() {
  const { white, bone } = useBrandColors();
  return (
    <>
      <hemisphereLight args={[white, bone, 1.25]} />
      <directionalLight position={[3, 5, 2]} intensity={1.3} />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} />
    </>
  );
}

/** Floor grid, axes with tick marks: the "figure" frame around the surface. */
function Axes() {
  const colors = useBrandColors();

  const { floorBuf, axesBuf } = useMemo(() => {
    const f: number[] = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const fx = -X + (2 * X * i) / n;
      const fz = -Z + (2 * Z * i) / n;
      f.push(fx, 0, -Z, fx, 0, Z, -X, 0, fz, X, 0, fz);
    }
    // Strike along the front edge and maturity along the left edge, meeting at the front-left corner, where the
    // vol axis rises (it faces the camera, so the surface never hides it). Plus tick marks.
    const a = [-X, 0, Z, X, 0, Z, -X, 0, Z, -X, 0, -Z, -X, 0, Z, -X, H, Z];
    for (const m of STRIKE_TICKS) a.push(xFromMoneyness(m), 0, Z, xFromMoneyness(m), 0, Z + TICK);
    for (const T of MATURITY_TICKS) a.push(-X, 0, zFromMaturity(T), -X - TICK, 0, zFromMaturity(T));
    for (const v of VOL_TICKS) a.push(-X, (v / VOL_MAX) * H, Z, -X - TICK, (v / VOL_MAX) * H, Z + TICK);
    return { floorBuf: new Float32Array(f), axesBuf: new Float32Array(a) };
  }, []);

  const floor = useLines(floorBuf.length / 6, colors.navy, 1, 0.16);
  const axes = useLines(axesBuf.length / 6, colors.black, 1.25, 0.55);
  useEffect(() => writeLines(floor, floorBuf), [floor, floorBuf]);
  useEffect(() => writeLines(axes, axesBuf), [axes, axesBuf]);

  return (
    <>
      <primitive object={floor} />
      <primitive object={axes} />
    </>
  );
}

/** Lets vertical swipes scroll the page on touch screens; horizontal drags still rotate. */
function TouchScroll() {
  const gl = useThree((s) => s.gl);
  const connected = useThree((s) => s.events.connected) as HTMLElement | undefined;
  useEffect(() => {
    const id = setTimeout(() => {
      for (const el of [gl.domElement, connected]) if (el) el.style.touchAction = "pan-y";
    });
    return () => clearTimeout(id);
  }, [gl, connected]);
  return null;
}

/** The interactive WebGL volatility surface (spec 01 §3.1). Loaded lazily by VolSurfaceFigure. */
export default function VolSurfaceCanvas({ params, autoRotate, label, onHover, onInteractStart, onInteractEnd }: VolSurfaceCanvasProps) {
  const controls = useRef<Controls>(null);
  const labelSpans = useRef<(HTMLSpanElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const c = controls.current;
    const step = { ArrowLeft: -0.2, ArrowRight: 0.2 }[event.key];
    if (!c || step === undefined) return;
    event.preventDefault();
    onInteractStart();
    c.setAzimuthalAngle(c.getAzimuthalAngle() + step);
    onInteractEnd();
  }

  return (
    <div
      role="img"
      aria-label={`${label} Use the left and right arrow keys to rotate.`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <Canvas
        flat
        camera={{ position: CAMERA.position, fov: CAMERA.fov }}
        dpr={[1, 2]}
        frameloop={autoRotate ? "always" : "demand"}
        fallback={<VolSurfacePoster params={params} />}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Lights />
        <Surface params={params} onHover={onHover} />
        <Axes />
        <OrbitControls
          ref={controls}
          target={CAMERA.target}
          enableZoom={false}
          enablePan={false}
          enableDamping
          minPolarAngle={0.55}
          maxPolarAngle={1.4}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          onStart={onInteractStart}
          onEnd={onInteractEnd}
        />
        <TouchScroll />
        <LabelTracker spans={labelSpans} />
      </Canvas>
      {LABELS.map(({ text, kind }, i) => (
        <span
          key={`${kind}-${text}`}
          ref={(el) => {
            labelSpans.current[i] = el;
          }}
          aria-hidden="true"
          className={`pointer-events-none invisible absolute top-0 left-0 font-sans leading-none whitespace-nowrap tabular ${
            kind === "title" ? "text-[11px] font-medium text-ink-2" : "text-[10px] text-ink-3"
          }`}
        >
          {text}
        </span>
      ))}
    </div>
  );
}
