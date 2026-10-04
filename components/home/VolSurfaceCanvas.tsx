"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef, type KeyboardEvent, type RefObject } from "react";
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { VolSurfacePoster } from "@/components/home/VolSurfacePoster";
import {
  AXIS_LABELS,
  CAMERA,
  NK,
  NT,
  SCENE,
  TICKS,
  WIRE_STEP,
  cameraDirection,
  fitDistance,
  kFromX,
  tFromZ,
  toX,
  toY,
  toZ,
  xFromMoneyness,
  zFromMaturity,
} from "@/components/home/volSurfaceScene";
import { DOMAIN, impliedVol, surfaceGrid, type VolParams } from "@/lib/vol-surface";

// @react-three/fiber 9.8.1 still builds its store with THREE.Clock, which three 0.186 deprecates. Dev-only noise; drop this once fiber moves to THREE.Timer.
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  const warn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].startsWith("THREE.Clock:")) return;
    warn(...args);
  };
}

type VolSurfaceCanvasProps = {
  params: VolParams;
  /** Whether the idle spin runs (off while the user is interacting, offscreen or under reduced motion). */
  animate: boolean;
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

    // "Printed figure" fill: a navy wash, deeper where implied vol is higher. Mixed into white, not bone:
    // warm bone plus navy cancels out to a neutral gray.
    const ramp = [white.clone().lerp(navy, 0.12), white.clone().lerp(navy, 0.3), white.clone().lerp(navy, 0.58)];
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
/** The at-the-money column (K/S = 1, log-moneyness 0): its line traces the ATM term structure. */
const ATM_COLUMN = (NK - 1) / 2;
/** Fill colors follow absolute implied vol (not each surface's own range), so a sell-off reads deeper than a calm market. */
const FILL_VOL = [0.12, 0.6] as const;

/** The surface: a matte navy-on-bone mesh, a navy-ink wire grid, an outline and the ATM line, rewritten in place as params change. */
/** A hovered point on the surface: log-moneyness k, maturity T, and the pointer's client position. */
type SurfacePoint = { k: number; T: number; clientX: number; clientY: number };

function Surface({ params, onHover }: Pick<VolSurfaceCanvasProps, "params"> & { onHover: (point: SurfacePoint | null) => void }) {
  const invalidate = useThree((s) => s.invalidate);
  const colors = useBrandColors();
  const wires = useLines(wireSegments, colors.navy, 1, 0.28);
  const outline = useLines(outlineSegments, colors.navy, 1.25, 0.9);
  const atm = useLines(NT - 1, colors.navy, 2.25, 1);

  const { mesh, values, wireBuf, outlineBuf, atmBuf } = useMemo(() => {
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
      atmBuf: new Float32Array((NT - 1) * 6),
    };
  }, []);

  useEffect(() => () => mesh.dispose(), [mesh]);

  useEffect(() => {
    surfaceGrid(params, NK, NT, values);
    const pos = mesh.getAttribute("position") as THREE.BufferAttribute;
    const col = mesh.getAttribute("color") as THREE.BufferAttribute;
    const tint = new THREE.Color();
    const [low, mid, high] = colors.ramp;
    for (let iT = 0; iT < NT; iT++) {
      for (let ik = 0; ik < NK; ik++) {
        const i = iT * NK + ik;
        pos.setXYZ(i, toX(ik), toY(values[i]), toZ(iT));
        const t = Math.min(1, Math.max(0, (values[i] - FILL_VOL[0]) / (FILL_VOL[1] - FILL_VOL[0])));
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

    o = 0;
    lift = 0.03;
    for (let iT = 0; iT < NT - 1; iT++) o = seg(atmBuf, o, ATM_COLUMN, iT, ATM_COLUMN, iT + 1);
    writeLines(atm, atmBuf);

    invalidate();
  }, [params, mesh, values, wireBuf, outlineBuf, atmBuf, wires, outline, atm, colors, invalidate]);

  return (
    <>
      <mesh
        geometry={mesh}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onHover({ k: kFromX(e.point.x), T: tFromZ(e.point.z), clientX: e.nativeEvent.clientX, clientY: e.nativeEvent.clientY });
        }}
        onPointerOut={() => onHover(null)}
      >
        <meshLambertMaterial vertexColors side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={4} />
      </mesh>
      <primitive object={wires} />
      <primitive object={outline} />
      <primitive object={atm} />
    </>
  );
}

const SLICE_SAMPLES = 60;

/**
 * Hover detail on the surface: a marker at the hovered point plus its two slices — the smile across strikes at that
 * maturity and the term structure across maturities at that strike — redrawn as the surface morphs.
 */
function HoverSlices({ params, at }: { params: VolParams; at: { k: number; T: number } | null }) {
  const invalidate = useThree((s) => s.invalidate);
  const colors = useBrandColors();
  const smile = useLines(SLICE_SAMPLES, colors.navy, 2, 1);
  const term = useLines(SLICE_SAMPLES, colors.navy, 2, 1);
  const marker = useRef<THREE.Mesh>(null);
  const smileBuf = useMemo(() => new Float32Array(SLICE_SAMPLES * 6), []);
  const termBuf = useMemo(() => new Float32Array(SLICE_SAMPLES * 6), []);

  useEffect(() => {
    if (at) {
      const lift = 0.035;
      const point = (k: number, T: number): [number, number, number] => [
        xFromMoneyness(Math.exp(k)),
        toY(impliedVol(k, T, params)) + lift,
        zFromMaturity(T),
      ];
      const lerp = ([a, b]: readonly [number, number], t: number) => a + (b - a) * t;
      for (let i = 0; i < SLICE_SAMPLES; i++) {
        const [t0, t1] = [i / SLICE_SAMPLES, (i + 1) / SLICE_SAMPLES];
        smileBuf.set([...point(lerp(DOMAIN.k, t0), at.T), ...point(lerp(DOMAIN.k, t1), at.T)], i * 6);
        termBuf.set([...point(at.k, lerp(DOMAIN.T, t0)), ...point(at.k, lerp(DOMAIN.T, t1))], i * 6);
      }
      writeLines(smile, smileBuf);
      writeLines(term, termBuf);
      marker.current?.position.set(...point(at.k, at.T));
    }
    invalidate();
  }, [params, at, smile, term, smileBuf, termBuf, invalidate]);

  return (
    <>
      <primitive object={smile} visible={at !== null} />
      <primitive object={term} visible={at !== null} />
      <mesh ref={marker} visible={at !== null} renderOrder={10}>
        <sphereGeometry args={[0.045, 20, 12]} />
        <meshBasicMaterial color={colors.navy} depthTest={false} />
      </mesh>
    </>
  );
}

const formatMaturity = (T: number) => (T < 1 ? `${Math.max(1, Math.round(T * 12))}M` : `${T.toFixed(1)}Y`);

/** Details for the hovered point: strike, maturity, implied vol and its spread to at-the-money. Decorative. */
function HoverTooltip({ params, hover }: { params: VolParams; hover: { k: number; T: number; x: number; y: number; flip: boolean } }) {
  const vol = impliedVol(hover.k, hover.T, params);
  const spread = (vol - impliedVol(0, hover.T, params)) * 100;
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-0 left-0 bg-bone/95 px-3 py-2 text-caption leading-snug whitespace-nowrap tabular shadow-[0_0_0_1px_var(--color-rule)]`}
      style={{ transform: `translate(${hover.x + (hover.flip ? -14 : 14)}px, ${hover.y + 14}px)${hover.flip ? " translateX(-100%)" : ""}` }}
    >
      <span className="block font-medium text-navy">σ {(vol * 100).toFixed(1)}%</span>
      <span className="block text-ink-2">
        K/S {Math.exp(hover.k).toFixed(2)} · {formatMaturity(hover.T)}
      </span>
      <span className="block text-ink-3">
        {Math.abs(spread) < 0.05 ? "At the money" : `${spread > 0 ? "+" : "−"}${Math.abs(spread).toFixed(1)} pts vs ATM`}
      </span>
    </div>
  );
}

const LABELS = AXIS_LABELS;

/** Projects each label's 3D anchor to the canvas, and moves its span there. Labels stay visible from every angle. */
function LabelTracker({ spans }: { spans: RefObject<(HTMLSpanElement | null)[]> }) {
  const points = useMemo(() => LABELS.map(({ at }) => new THREE.Vector3(...at)), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    points.forEach((p, i) => {
      const el = spans.current[i];
      if (!el) return;
      v.copy(p).project(camera);
      el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translate(-50%, -50%)`;
      // Always shown, whichever way the axis faces; only hidden if the anchor is behind the camera.
      el.style.visibility = v.z < 1 ? "visible" : "hidden";
    });
  });
  return null;
}

/** Mostly ambient (white sky, bone ground) with a soft key light: enough form to read in 3D, never gray plastic. */
function Lights() {
  const { white, bone } = useBrandColors();
  return (
    <>
      <hemisphereLight args={[white, bone, 0.95]} />
      <directionalLight position={[3, 5, 2]} intensity={0.4} />
    </>
  );
}

const TICK = 0.07;

/** Three hairline axes meeting at the front-right corner (strike along the front, maturity along the right, vol up), with tick marks. */
function Axes() {
  const colors = useBrandColors();
  const axesBuf = useMemo(() => {
    const a = [-X, 0, Z, X, 0, Z, X, 0, Z, X, 0, -Z, X, 0, Z, X, H, Z];
    for (const m of TICKS.strike) a.push(xFromMoneyness(m), 0, Z, xFromMoneyness(m), 0, Z + TICK);
    for (const { T } of TICKS.maturity) a.push(X, 0, zFromMaturity(T), X + TICK, 0, zFromMaturity(T));
    for (const v of TICKS.vol) a.push(X, toY(v), Z, X + TICK * 0.7, toY(v), Z + TICK * 0.7);
    return new Float32Array(a);
  }, []);
  const axes = useLines(axesBuf.length / 6, colors.black, 1, 0.45);
  useEffect(() => writeLines(axes, axesBuf), [axes, axesBuf]);
  return <primitive object={axes} />;
}

/** Orbit controls with free rotation in every direction; zoom and pan stay off (distance is managed by FitCamera). */
function FreeControls({
  controls,
  animate,
  onInteractStart,
  onInteractEnd,
}: Pick<VolSurfaceCanvasProps, "animate" | "onInteractStart" | "onInteractEnd"> & { controls: RefObject<Controls | null> }) {
  return (
    <OrbitControls
      ref={controls}
      target={CAMERA.target}
      enableZoom={false}
      enablePan={false}
      // Damping is for hand-dragging only: it would smear the director's per-frame angle updates.
      enableDamping={!animate}
      minPolarAngle={CAMERA.minPolar}
      maxPolarAngle={CAMERA.maxPolar}
      onStart={onInteractStart}
      onEnd={onInteractEnd}
    />
  );
}

/**
 * Each frame, eases the camera distance toward the tightest fit for the current angle and canvas aspect
 * (fitDistance), so the surface fills the figure from any viewpoint without ever clipping.
 */
function FitCamera({ controls }: { controls: RefObject<Controls | null> }) {
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const settled = useRef(false);
  useFrame((_, delta) => {
    const c = controls.current;
    if (!c) return;
    const goal = fitDistance(size.width / size.height, c.getAzimuthalAngle(), c.getPolarAngle());
    const current = c.getDistance();
    // Snap on the first frame, then ease (≈ 0.25s time constant) so distance changes never look like a zoom jump.
    const next = settled.current ? current + (goal - current) * (1 - Math.exp(-Math.min(delta, 0.05) * 4)) : goal;
    settled.current = true;
    if (Math.abs(next - current) > 1e-4) {
      c.dollyOut(current / next);
      invalidate();
    }
  });
  return null;
}

/** Starting camera position along the default view; FitCamera pulls it to the fitted distance on the first frame. */
const INITIAL_CAMERA = cameraDirection(CAMERA.azimuth, CAMERA.polar).map((d, i) => CAMERA.target[i] + d * 8) as [number, number, number];

/**
 * Idle spin: turns the camera at a constant, slow rate (azimuth increasing, so the surface turns clockwise seen
 * from above), easing up to speed after a drag, while gently settling the tilt back to the default view.
 */
function IdleSpin({ controls, animate }: { controls: RefObject<Controls | null>; animate: boolean }) {
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
    s.va += (CAMERA.spin - s.va) * (1 - Math.exp(-dt * 1.6));
    const goalPolar = CAMERA.polar + 0.04 * Math.sin((s.t / 31) * 2 * Math.PI);
    const k = 0.9;
    s.vp = Math.max(-0.2, Math.min(0.2, s.vp + (k * k * (goalPolar - c.getPolarAngle()) - 2 * k * s.vp) * dt));
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
export default function VolSurfaceCanvas({ params, animate, label, onInteractStart, onInteractEnd }: VolSurfaceCanvasProps) {
  const controls = useRef<Controls>(null);
  const labelSpans = useRef<(HTMLSpanElement | null)[]>([]);
  const wrapper = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ k: number; T: number; x: number; y: number; flip: boolean } | null>(null);
  const hovering = useRef(false);
  const [inside, setInside] = useState(false);

  // Hovering pauses the spin (like a drag) so the details hold still; it resumes 1.5s after the pointer leaves.
  const onHover = useCallback(
    (point: SurfacePoint | null) => {
      if (!point) {
        if (hovering.current) onInteractEnd();
        hovering.current = false;
        setHover(null);
        return;
      }
      if (!hovering.current) onInteractStart();
      hovering.current = true;
      const r = wrapper.current?.getBoundingClientRect();
      if (!r) return;
      const x = point.clientX - r.left;
      setHover({ k: point.k, T: point.T, x, y: point.clientY - r.top, flip: x > r.width * 0.6 });
    },
    [onInteractStart, onInteractEnd],
  );

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
      ref={wrapper}
      role="img"
      aria-label={`${label} Use the left and right arrow keys to rotate.`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setInside(true)}
      onPointerLeave={() => setInside(false)}
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
        <Surface params={params} onHover={onHover} />
        <HoverSlices params={params} at={hover} />
        <Axes />
        <FreeControls controls={controls} animate={animate} onInteractStart={onInteractStart} onInteractEnd={onInteractEnd} />
        <FitCamera controls={controls} />
        <IdleSpin controls={controls} animate={animate} />
        <TouchScroll />
        <LabelTracker spans={labelSpans} />
      </Canvas>
      {LABELS.map(({ text, kind }, i) => (
        <span
          key={text}
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
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-2 left-2 text-caption font-medium text-navy transition-opacity duration-200 motion-reduce:transition-none ${inside ? "opacity-100" : "opacity-0"}`}
      >
        Implied Vol. Graph
      </span>
      {hover ? <HoverTooltip params={params} hover={hover} /> : null}
    </div>
  );
}
