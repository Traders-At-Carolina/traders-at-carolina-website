"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ComponentRef, type KeyboardEvent, type RefObject } from "react";
import * as THREE from "three";
import { VolSurfacePoster } from "@/components/home/VolSurfacePoster";
import { CAMERA, NK, NT, SCENE, kFromX, tFromZ, toX, toY, toZ } from "@/components/home/volSurfaceScene";
import { impliedVol, surfaceGrid, type VolParams } from "@/lib/vol-surface";

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

/** Brand colors read from the design tokens (00 §4), so the 3D scene never hard-codes hex. */
function useBrandColors() {
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string, fallback: string) => new THREE.Color(css.getPropertyValue(name).trim() || fallback);
    const navy = token("--color-navy", "#233265");
    const bone = token("--color-bone", "#ebeae4");
    const black = token("--color-black", "#000000");
    return { navy, bone, black, low: bone.clone().lerp(navy, 0.6), high: navy.clone().lerp(black, 0.2) };
  }, []);
}

/** Wire-gridded surface mesh; geometry is allocated once and rewritten in place as params change. */
function Surface({ params, onHover }: Pick<VolSurfaceCanvasProps, "params" | "onHover">) {
  const invalidate = useThree((s) => s.invalidate);
  const colors = useBrandColors();

  const { mesh, lines, values } = useMemo(() => {
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

    // Grid lines every other row and column, as line segments.
    const segments = Math.ceil(NT / 2) * (NK - 1) + Math.ceil(NK / 2) * (NT - 1);
    const lines = new THREE.BufferGeometry();
    lines.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segments * 6), 3));
    return { mesh, lines, values: new Float32Array(NK * NT) };
  }, []);

  useEffect(
    () => () => {
      mesh.dispose();
      lines.dispose();
    },
    [mesh, lines],
  );

  useEffect(() => {
    const { min, max } = surfaceGrid(params, NK, NT, values);
    const pos = mesh.getAttribute("position") as THREE.BufferAttribute;
    const col = mesh.getAttribute("color") as THREE.BufferAttribute;
    const tint = new THREE.Color();
    for (let iT = 0; iT < NT; iT++) {
      for (let ik = 0; ik < NK; ik++) {
        const i = iT * NK + ik;
        pos.setXYZ(i, toX(ik), toY(values[i]), toZ(iT));
        tint.lerpColors(colors.low, colors.high, max > min ? (values[i] - min) / (max - min) : 0.5);
        col.setXYZ(i, tint.r, tint.g, tint.b);
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    mesh.computeVertexNormals();
    mesh.computeBoundingSphere();

    const lp = lines.getAttribute("position") as THREE.BufferAttribute;
    let s = 0;
    const lift = 0.004;
    const seg = (a: number, b: number, ak: number, aT: number, bk: number, bT: number) => {
      lp.setXYZ(s++, toX(ak), toY(values[a]) + lift, toZ(aT));
      lp.setXYZ(s++, toX(bk), toY(values[b]) + lift, toZ(bT));
    };
    for (let iT = 0; iT < NT; iT += 2) for (let ik = 0; ik < NK - 1; ik++) seg(iT * NK + ik, iT * NK + ik + 1, ik, iT, ik + 1, iT);
    for (let ik = 0; ik < NK; ik += 2) for (let iT = 0; iT < NT - 1; iT++) seg(iT * NK + ik, (iT + 1) * NK + ik, ik, iT, ik, iT + 1);
    lp.needsUpdate = true;
    lines.computeBoundingSphere();
    invalidate();
  }, [params, mesh, lines, values, colors, invalidate]);

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    const k = kFromX(event.point.x);
    const T = tFromZ(event.point.z);
    onHover({ moneyness: Math.exp(k), maturity: T, vol: impliedVol(k, T, params) });
  }

  return (
    <>
      <mesh geometry={mesh} onPointerMove={handlePointerMove} onPointerOut={() => onHover(null)}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.9} metalness={0} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <lineSegments geometry={lines}>
        <lineBasicMaterial color={colors.bone} transparent opacity={0.55} />
      </lineSegments>
    </>
  );
}

const { halfX: X, halfZ: Z, height: H, volMax: VOL_MAX } = SCENE;

/** Axis labels: plain spans positioned each rendered frame (no extra React roots). */
const LABELS: { text: string; at: [number, number, number] }[] = [
  { text: "Strike K/S →", at: [0.4, 0, Z + 0.3] },
  { text: "Maturity →", at: [-X - 0.35, 0, 0] },
  { text: "Implied vol", at: [-X, H + 0.2, -Z] },
  { text: `${Math.round(VOL_MAX * 100)}%`, at: [-X - 0.22, H, -Z] },
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

/** Floor grid and three axes: the "figure" frame around the surface. */
function Axes() {
  const colors = useBrandColors();
  const x = X;
  const z = Z;
  const h = H;

  const { floor, axes } = useMemo(() => {
    const f: number[] = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const fx = -x + (2 * x * i) / n;
      const fz = -z + (2 * z * i) / n;
      f.push(fx, 0, -z, fx, 0, z, -x, 0, fz, x, 0, fz);
    }
    const floor = new THREE.BufferGeometry();
    floor.setAttribute("position", new THREE.Float32BufferAttribute(f, 3));
    // Strike axis along the front edge, maturity along the left edge, vol up the back-left corner.
    const axes = new THREE.BufferGeometry();
    axes.setAttribute("position", new THREE.Float32BufferAttribute([-x, 0, z, x, 0, z, -x, 0, z, -x, 0, -z, -x, 0, -z, -x, h, -z], 3));
    return { floor, axes };
  }, [x, z, h]);

  return (
    <>
      <lineSegments geometry={floor}>
        <lineBasicMaterial color={colors.navy} transparent opacity={0.14} />
      </lineSegments>
      <lineSegments geometry={axes}>
        <lineBasicMaterial color={colors.black} transparent opacity={0.45} />
      </lineSegments>
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
        camera={{ position: CAMERA.position, fov: CAMERA.fov }}
        dpr={[1, 2]}
        frameloop={autoRotate ? "always" : "demand"}
        fallback={<VolSurfacePoster params={params} />}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} />
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
      {LABELS.map(({ text }, i) => (
        <span
          key={text}
          ref={(el) => {
            labelSpans.current[i] = el;
          }}
          aria-hidden="true"
          className="pointer-events-none invisible absolute top-0 left-0 font-sans text-[11px] leading-none whitespace-nowrap text-ink-3 tabular"
        >
          {text}
        </span>
      ))}
    </div>
  );
}
