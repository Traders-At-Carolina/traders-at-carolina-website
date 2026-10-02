"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ComponentRef, type KeyboardEvent, type RefObject } from "react";
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { VolSurfacePoster } from "@/components/home/VolSurfacePoster";
import { AXIS_LABELS, CAMERA, NK, NT, SCENE, WIRE_STEP, cameraDirection, fitDistance, toX, toY, toZ } from "@/components/home/volSurfaceScene";
import { surfaceGrid, type VolParams } from "@/lib/vol-surface";

type VolSurfaceCanvasProps = {
  params: VolParams;
  /** Whether the camera director runs (off while the user is interacting, offscreen or under reduced motion). */
  animate: boolean;
  /** Azimuth the director steers toward: the angle that best shows the next market change. */
  view: number;
  label: string;
  onInteractStart: () => void;
  onInteractEnd: () => void;
};

type Controls = ComponentRef<typeof OrbitControls>;

const { halfX: X, halfZ: Z, height: H } = SCENE;

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
function Surface({ params }: Pick<VolSurfaceCanvasProps, "params">) {
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

  return (
    <>
      <mesh geometry={mesh}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.7} metalness={0} polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={4} />
      </mesh>
      <primitive object={wires} />
      <primitive object={outline} />
    </>
  );
}

const LABELS = AXIS_LABELS;

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

/** Three hairline axes meeting at the front-right corner: strike along the front, maturity along the right, vol up. */
function Axes() {
  const colors = useBrandColors();
  const axesBuf = useMemo(() => new Float32Array([-X, 0, Z, X, 0, Z, X, 0, Z, X, 0, -Z, X, 0, Z, X, H, Z]), []);
  const axes = useLines(axesBuf.length / 6, colors.black, 1, 0.45);
  useEffect(() => writeLines(axes, axesBuf), [axes, axesBuf]);
  return <primitive object={axes} />;
}

/**
 * Orbit controls locked to the fitted distance for the canvas's aspect ratio (see fitDistance), so the surface,
 * axes and titles stay in frame from every angle. OrbitControls clamps the camera to that distance on update.
 */
function FittedControls({
  controls,
  animate,
  onInteractStart,
  onInteractEnd,
}: Pick<VolSurfaceCanvasProps, "animate" | "onInteractStart" | "onInteractEnd"> & { controls: RefObject<Controls | null> }) {
  const size = useThree((s) => s.size);
  const distance = useMemo(() => fitDistance(size.width / size.height), [size.width, size.height]);
  return (
    <OrbitControls
      ref={controls}
      target={CAMERA.target}
      minDistance={distance}
      maxDistance={distance}
      enableZoom={false}
      enablePan={false}
      // Damping is for hand-dragging only: it would smear the director's per-frame angle updates.
      enableDamping={!animate}
      minAzimuthAngle={CAMERA.minAzimuth}
      maxAzimuthAngle={CAMERA.maxAzimuth}
      minPolarAngle={CAMERA.minPolar}
      maxPolarAngle={CAMERA.maxPolar}
      onStart={onInteractStart}
      onEnd={onInteractEnd}
    />
  );
}

/** Starting camera position along the default view; FittedControls pulls it to the fitted distance. */
const INITIAL_CAMERA = cameraDirection(CAMERA.azimuth, CAMERA.polar).map((d, i) => CAMERA.target[i] + d * 8) as [number, number, number];

/** Shortest signed angle from a to b. */
const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/**
 * Slowly steers the camera toward `view` with a critically damped spring (smooth start and stop, capped speed),
 * plus a gentle sway, so each market change is seen from the angle that shows it best and the camera never wanders
 * round to the back or underside.
 */
function CameraDirector({ controls, view, animate }: { controls: RefObject<Controls | null>; view: number; animate: boolean }) {
  const state = useRef({ t: 0, va: 0, vp: 0 });
  useFrame((_, delta) => {
    const c = controls.current;
    const s = state.current;
    if (!c || !animate) {
      s.va = 0;
      s.vp = 0;
      return;
    }
    const dt = Math.min(delta, 0.05);
    s.t += dt;
    const sway = Math.sin((s.t / 26) * 2 * Math.PI);
    const goalAz = view + 0.1 * sway;
    const goalPolar = CAMERA.polar + 0.04 * Math.sin((s.t / 31) * 2 * Math.PI);

    const k = 0.9;
    const maxSpeed = 0.2;
    const spring = (v: number, offset: number) => Math.max(-maxSpeed, Math.min(maxSpeed, v + (k * k * offset - 2 * k * v) * dt));
    s.va = spring(s.va, angleDelta(c.getAzimuthalAngle(), goalAz));
    s.vp = spring(s.vp, goalPolar - c.getPolarAngle());
    c.setAzimuthalAngle(c.getAzimuthalAngle() + s.va * dt);
    c.setPolarAngle(c.getPolarAngle() + s.vp * dt);
  });
  return null;
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
export default function VolSurfaceCanvas({ params, animate, view, label, onInteractStart, onInteractEnd }: VolSurfaceCanvasProps) {
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
        camera={{ fov: CAMERA.fov, position: INITIAL_CAMERA }}
        dpr={[1, 2]}
        frameloop={animate ? "always" : "demand"}
        fallback={<VolSurfacePoster params={params} />}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Lights />
        <Surface params={params} />
        <Axes />
        <FittedControls controls={controls} animate={animate} onInteractStart={onInteractStart} onInteractEnd={onInteractEnd} />
        <CameraDirector controls={controls} view={view} animate={animate} />
        <TouchScroll />
        <LabelTracker spans={labelSpans} />
      </Canvas>
      {LABELS.map(({ text }, i) => (
        <span
          key={text}
          ref={(el) => {
            labelSpans.current[i] = el;
          }}
          aria-hidden="true"
          className="pointer-events-none invisible absolute top-0 left-0 font-sans text-[11px] leading-none whitespace-nowrap text-ink-3"
        >
          {text}
        </span>
      ))}
    </div>
  );
}
