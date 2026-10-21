import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { SRGBColorSpace, Texture } from "three";
import BookCover from "../../components/ui/BookCover.jsx";
import {resolveBookCoverUrl} from '../../components/ui/bookCoverUrl.js';

function Unavailable({ onUnavailable }) {
  const reported = useRef(false);
  useEffect(() => {
    if (!reported.current) {
      reported.current = true;
      onUnavailable?.();
    }
  }, [onUnavailable]);
  return null;
}

function ContextLifecycle({ active, onUnavailable }) {
  const { gl, invalidate } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", onUnavailable);
    return () => canvas.removeEventListener("webglcontextlost", onUnavailable);
  }, [gl, onUnavailable]);

  // A newly visible scene needs one frame, never an idle animation loop.
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  return null;
}

function BoundBook({ texture }) {
  const ratio = texture.image.naturalWidth / texture.image.naturalHeight;
  const height = Math.min(3.4, 2.35 / ratio);
  const width = height * ratio;

  return <group rotation={[0.06, 0.35, -0.07]} position={[0, 0.04, 0]}>
    {/* The binding has no invented title or artwork; only the API cover is printed. */}
    <mesh position={[0, 0, -0.16]} castShadow>
      <boxGeometry args={[width, height, 0.045]} />
      <meshStandardMaterial color="#1e3a5f" roughness={0.86} />
    </mesh>
    <mesh position={[0.025, 0, 0]} castShadow>
      <boxGeometry args={[Math.max(0.01, width - 0.08), height - 0.09, 0.27]} />
      <meshStandardMaterial color="#fff7ed" roughness={0.96} />
    </mesh>
    <mesh position={[-width / 2 + 0.025, 0, 0]} castShadow>
      <boxGeometry args={[0.05, height, 0.36]} />
      <meshStandardMaterial color="#1e3a5f" roughness={0.84} />
    </mesh>
    <mesh position={[0, 0, 0.16]} castShadow>
      <boxGeometry args={[width, height, 0.045]} />
      <meshStandardMaterial color="#1e3a5f" roughness={0.86} />
    </mesh>
    <mesh position={[0, 0, 0.184]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} transparent />
    </mesh>
    {/* Restrained page edges add scale without a dense stack of meshes. */}
    {[-0.07, 0, 0.07].map((depth) => <mesh key={depth} position={[width / 2 - 0.014, 0, depth]}>
      <boxGeometry args={[0.002, height - 0.1, 0.002]} />
      <meshStandardMaterial color="#d7c9b3" roughness={1} />
    </mesh>)}
  </group>;
}

function CoverScene({ src, livro, active, onUnavailable }) {
  const [texture, setTexture] = useState(null);
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);

  useEffect(() => () => texture?.dispose(), [texture]);

  function loadCover(event) {
    const image = event.currentTarget;
    if (!image.naturalWidth || !image.naturalHeight) {
      fail();
      return;
    }
    const cover = new Texture(image);
    cover.colorSpace = SRGBColorSpace;
    cover.needsUpdate = true;
    setTexture(cover);
  }

  if (failed) return <Unavailable onUnavailable={onUnavailable} />;

  return <div aria-hidden="true" className="pointer-events-none h-full min-h-80 w-full select-none"
    style={{ pointerEvents: "none" }}>
    <img src={src} crossOrigin="anonymous" alt="" hidden decoding="async"
      onLoad={loadCover} onError={fail} />
    {!texture && <div className="grid h-full place-items-center"><BookCover livro={livro} className="w-44 shadow-xl sm:w-52"/></div>}
    {texture && <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.1, 7], fov: 35, near: 0.1, far: 30 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      shadows
      style={{ pointerEvents: "none" }}
    >
      <ContextLifecycle active={active} onUnavailable={fail} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[-3, 5, 5]} intensity={2.1} castShadow
        shadow-mapSize-width={512} shadow-mapSize-height={512}
        shadow-camera-left={-3} shadow-camera-right={3}
        shadow-camera-top={3} shadow-camera-bottom={-3}
        shadow-normalBias={0.035} />
      <directionalLight position={[4, 1, -2]} intensity={0.6} color="#fff7ed" />
      <BoundBook texture={texture} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.87, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <shadowMaterial transparent opacity={0.13} />
      </mesh>
    </Canvas>}
  </div>;
}

export default function BookScene({ livro, active = true, onUnavailable }) {
  const image = typeof livro?.imagemUrl === "string" ? livro.imagemUrl.trim() : "";
  if (!image) return <Unavailable onUnavailable={onUnavailable} />;

  const src = resolveBookCoverUrl(image);

  // A cover change owns a fresh texture and failure state; old GPU resources are disposed.
  return <CoverScene key={src} src={src} livro={livro} active={active} onUnavailable={onUnavailable} />;
}
