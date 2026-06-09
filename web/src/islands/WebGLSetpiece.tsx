/**
 * WebGLSetpiece.tsx — R3F/Three.js procedural drafting-grid / blueprint lattice
 * WebGL set-piece (Story 5.1, AC2).
 *
 * MOUNT STRATEGY (NFR-1 critical):
 * This island is NEVER hydrated via `client:load` or `client:visible`. Instead,
 * the home page dynamically `import()`s this module only after the first real user
 * scroll/interaction, inside `onMotionAllowed()`. Lighthouse's no-interaction trace
 * on `/` therefore NEVER fetches this chunk → the 256KB script budget stays green.
 *
 * The island renders:
 *   - A fixed `<canvas>` (`position: fixed`, `pointer-events: none`, `aria-hidden`)
 *     behind the scene content, visible ONLY on `/`.
 *   - The procedural drafting-grid/blueprint lattice in cream/ink/navy.
 *   - The Draco-compressed GLB geometry loaded via DRACOLoader.
 *   - The KTX2/ETC1S/BasisLZ texture (`grid-texture.ktx2`) loaded via KTX2Loader
 *     with the Basis transcoder served from `/cinematic/` (AC2 asset pipeline).
 *   - A camera that smoothly follows the `--cinematic-camera-t` CSS variable
 *     (set by the GSAP camera-path controller) for the dolly effect.
 *
 * NFR-2 (reduced motion): this entire file is only imported inside `onMotionAllowed`
 * — it is NEVER loaded under prefers-reduced-motion. No per-component matchMedia.
 *
 * NFR-1 (isolation): this island exists ONLY on `/`. The build-output.test.ts
 * asserts the three/R3F chunk is referenced by NO other route.
 *
 * GRACEFUL DEGRADATION (AC2 "not supported" path):
 * If WebGL context creation fails (GPU blocklist, disabled in browser settings,
 * headless/corporate environments), the static still poster must remain visible —
 * the user must NOT see a blank canvas. This is handled via:
 *   1. `probeWebGLSupport()` (exported) — a quick canvas-probe BEFORE mounting R3F.
 *   2. `onWebGLReady` callback prop — bootstrap.ts receives confirmation only
 *      AFTER the first successful frame render. Until then the still stays.
 *   3. `WebGLErrorBoundary` — catches any React/R3F/three render-time error and
 *      calls `onWebGLFailed` so the still is restored; no uncaught rejection thrown.
 */

import React, { Component, useEffect, useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RepeatWrapping } from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Mesh, Texture as ThreeTexture } from 'three';

// ─── WebGL support probe ──────────────────────────────────────────────────────

/**
 * Probes whether the browser can create a WebGL context.
 * Returns `true` if WebGL is available; `false` if the context cannot be created
 * (GPU blocklist, browser setting, headless/corporate env, etc.).
 *
 * Creates a temporary canvas, tries to get a WebGL2 then WebGL1 context, and
 * immediately discards it — no resources are leaked.
 *
 * Exported so bootstrap.ts can call this BEFORE mounting R3F, avoiding a blank
 * canvas + uncaught error on devices where WebGL is blocked.
 */
export function probeWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl');
    if (!gl) return false;
    // Lose the context immediately so we don't hold GPU resources.
    const loseExt = (gl as WebGLRenderingContext).getExtension?.('WEBGL_lose_context');
    loseExt?.loseContext();
    return true;
  } catch {
    return false;
  }
}

// ─── Error boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  onError: (err: Error) => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Error boundary around the R3F <Canvas>. Catches any render-time error thrown
 * by three.js / @react-three/fiber (context failure, shader error, loader 404,
 * etc.) and calls `onError` so the caller (bootstrap.ts) can restore the static
 * still poster. Without this, the error becomes an uncaught promise rejection
 * visible in the console and the still stays hidden (AC2 violation).
 */
class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    // Notify the bootstrap so it can restore the still poster.
    this.props.onError(error);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Render nothing — the static still poster remains visible behind us.
      return null;
    }
    return this.props.children;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface GridMeshProps {
  glb: GLTF;
  gridTexture: ThreeTexture;
  onFirstFrame?: () => void;
}

// ─── Inner components ─────────────────────────────────────────────────────────

/**
 * The drafting-grid mesh — reads the Draco-compressed GLB and applies the
 * grid paper texture. Camera dolly is driven by the CSS variable
 * `--cinematic-camera-t` (set by the GSAP scroll controller).
 *
 * Calls `onFirstFrame` on the very first render frame so the bootstrap knows
 * WebGL actually succeeded and can safely hide the static still poster.
 */
function GridMesh({ glb, gridTexture, onFirstFrame }: GridMeshProps): React.ReactElement | null {
  const meshRef = useRef<Mesh>(null);
  const firedFirstFrame = useRef(false);

  // Configure the texture.
  gridTexture.wrapS = RepeatWrapping;
  gridTexture.wrapT = RepeatWrapping;
  gridTexture.repeat.set(4, 4);

  useFrame(({ camera }) => {
    // On the very first rendered frame, notify the caller that WebGL succeeded.
    if (!firedFirstFrame.current) {
      firedFirstFrame.current = true;
      onFirstFrame?.();
    }
    // Read the CSS variable for the camera dolly position (0 = top, 1 = bottom).
    const rawT = getComputedStyle(document.documentElement)
      .getPropertyValue('--cinematic-camera-t')
      .trim();
    const t = parseFloat(rawT) || 0;

    // Subtle camera dolly: fly from z=5 (top) to z=2 (bottom) as the user scrolls.
    // Y stays near 1.5 (slightly above the grid). X drifts gently.
    const targetZ = 5 - t * 3;
    const targetY = 1.5 - t * 0.5;
    const targetX = Math.sin(t * Math.PI) * 0.3;

    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  // Extract the first mesh from the GLB scene.
  const firstMesh = glb.scene.children[0] as Mesh | undefined;
  if (!firstMesh) return null;

  return (
    <primitive ref={meshRef} object={glb.scene} rotation={[-Math.PI * 0.1, 0.2, 0]} scale={1.8} />
  );
}

interface CinematicSceneProps {
  onFirstFrame?: () => void;
}

/**
 * Inner canvas scene — loads the Draco GLB + KTX2/ETC1S grid texture and renders
 * them. Ambient + directional lighting create the blueprint-room feel.
 *
 * AC2 asset pipeline:
 *   Geometry: /cinematic/drafting-grid.glb (Draco-compressed) → DRACOLoader
 *   Texture:  /cinematic/grid-texture.ktx2 (ETC1S/BasisLZ KTX2) → KTX2Loader
 *             with Basis transcoder at /cinematic/basis_transcoder.{js,wasm}
 */
function CinematicScene({ onFirstFrame }: CinematicSceneProps): React.ReactElement {
  const { gl } = useThree();

  const glb = useLoader(GLTFLoader, '/cinematic/drafting-grid.glb', (loader) => {
    // Configure DRACOLoader for Draco-compressed geometry (AC2).
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/cinematic/');
    (loader as GLTFLoader).setDRACOLoader(dracoLoader);
  }) as GLTF;

  // AC2: load the KTX2/ETC1S texture via KTX2Loader (not TextureLoader / PNG).
  // The extensions callback configures the cached loader instance with the
  // transcoder path and GPU format support detection.
  const gridTexture = useLoader(
    KTX2Loader,
    '/cinematic/grid-texture.ktx2',
    (loader: KTX2Loader) => {
      // Point to the Basis transcoder assets (basis_transcoder.js + .wasm)
      // served from web/public/cinematic/ (copied there by build-cinematic-assets.ts).
      loader.setTranscoderPath('/cinematic/');
      // detectSupport queries the GPU for compressed format support
      // (ASTC, ETC, S3TC, etc.) so the transcoder picks the optimal target.
      loader.detectSupport(gl);
    },
  ) as ThreeTexture;

  return (
    <>
      {/* Blueprint ambient: cream-tinted very soft light + navy directional accent. */}
      <ambientLight color="#f6f0e6" intensity={0.7} />
      <directionalLight color="#1e3a5f" intensity={0.5} position={[3, 5, 2]} castShadow={false} />
      <directionalLight
        color="#ede7d8"
        intensity={0.3}
        position={[-2, -3, -4]}
        castShadow={false}
      />
      <GridMesh glb={glb} gridTexture={gridTexture} onFirstFrame={onFirstFrame} />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export interface WebGLSetpieceProps {
  /**
   * Called after the FIRST successful WebGL frame render.
   * bootstrap.ts uses this to safely fade/remove the static still poster ONLY
   * after confirming the WebGL canvas is actually rendering. Until this fires,
   * the still remains visible (AC2 graceful degradation).
   */
  onWebGLReady?: () => void;
  /**
   * Called if the R3F/three init fails at render time (context creation failure,
   * shader error, loader 404, etc.). bootstrap.ts restores the static still
   * poster visibility when this fires so the user sees something, not a blank area.
   * No uncaught promise rejection is thrown — the error boundary absorbs it.
   */
  onWebGLFailed?: (err: Error) => void;
}

/**
 * The WebGL set-piece React component. This component mounts a fixed R3F canvas
 * on `/` and renders the procedural drafting-grid/blueprint lattice.
 *
 * Mount strategy: dynamically imported by the home cinematic bootstrap AFTER the
 * first user scroll/interaction. NEVER use `client:load` or `client:visible` with
 * this island — see module docblock.
 *
 * Graceful degradation: wraps the R3F canvas in a WebGLErrorBoundary so any
 * context/render failure calls `onWebGLFailed` rather than throwing an uncaught
 * promise rejection. The static still poster (rendered in index.astro) stays
 * visible until `onWebGLReady` fires from the first successful frame.
 */
export function WebGLSetpiece({
  onWebGLReady,
  onWebGLFailed,
}: WebGLSetpieceProps): React.ReactElement {
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  // Ensure the canvas wrapper is properly layered as a fixed decorative background.
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    el.setAttribute('aria-hidden', 'true');
    el.style.pointerEvents = 'none';
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.zIndex = '-1'; // behind scene content
  }, []);

  return (
    <div
      ref={canvasWrapRef}
      id="webgl-setpiece"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <WebGLErrorBoundary
        onError={
          onWebGLFailed ??
          (() => {
            /* noop if not provided */
          })
        }
      >
        <Canvas
          camera={{ position: [0, 1.5, 5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
          aria-hidden={true}
        >
          <React.Suspense fallback={null}>
            <CinematicScene onFirstFrame={onWebGLReady} />
          </React.Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}

export default WebGLSetpiece;
