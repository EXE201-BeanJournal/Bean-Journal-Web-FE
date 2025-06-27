// src/components/SpinningModel.tsx
import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Group } from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

interface ModelProps {
  url: string;
  scale?: number;
  rotationSpeed?: number;
  position?: [number, number, number]; // Add position here if you want to use it
}

function Model({
  url,
  scale = 1,
  rotationSpeed = 0.01,
  position = [0, 0, 0],
}: ModelProps) {
  const meshRef = useRef<Group>(null);
  const [model, setModel] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();

    console.log("Attempting to load model from:", url);

    loader.load(
      url,
      (gltf: GLTF) => {
        console.log("Model loaded successfully:", gltf);
        setModel(gltf.scene);
        setLoading(false);
      },
      (progress: ProgressEvent) => {
        console.log(
          "Loading progress:",
          (progress.loaded / progress.total) * 100 + "%"
        );
        console.log("Progress details:", progress);
      },
      (error: unknown) => {
        console.error("Detailed error loading model:", error);
        console.error("Error type:", typeof error);
        console.error("Error constructor:", error?.constructor?.name);
        setError("Failed to load 3D model");
        setLoading(false);
      }
    );
  }, [url]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
    }
  });

  if (loading) {
    return (
      <mesh position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    );
  }

  if (error || !model) {
    return (
      <mesh position={position}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }

  return (
    <group ref={meshRef} scale={scale} position={position}>
      <primitive object={model} />
    </group>
  );
}

interface SpinningModelProps {
  modelUrl?: string; // ✅ Made optional to match default
  width?: string; // ✅ Made optional to match default
  height?: string; // ✅ Made optional to match default
  scale?: number; // ✅ Made optional to match default
  rotationSpeed?: number; // ✅ Made optional to match default
  position?: [number, number, number]; // ✅ Now actually used
  className?: string;
}

export default function SpinningModel({
  modelUrl = "/models/kasane_teto_fatass_plush.glb",
  width = "400px",
  height = "400px",
  scale = 1,
  rotationSpeed = 0.01,
  position = [0, 0, 0], // ✅ Now has default and is used
  className = "",
}: SpinningModelProps) {
  return (
    <div className={className} style={{ width, height }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <Model
          url={modelUrl}
          scale={scale}
          rotationSpeed={rotationSpeed}
          position={position} // ✅ Now passed to Model
        />
      </Canvas>
    </div>
  );
}
