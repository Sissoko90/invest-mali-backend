import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cone, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

// Composant Building 3D (représente une entreprise)
const Building3D: React.FC<{ position: [number, number, number]; color: string; scale?: number }> = ({ 
  position, 
  color, 
  scale = 1 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={position} scale={hovered ? scale * 1.2 : scale}>
      {/* Base du bâtiment */}
      <Box
        ref={meshRef}
        args={[1, 2, 1]}
        position={[0, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial color={hovered ? '#f59e0b' : color} />
      </Box>
      
      {/* Toit */}
      <Cone args={[0.7, 0.5, 4]} position={[0, 1.25, 0]}>
        <meshStandardMaterial color={hovered ? '#dc2626' : '#ef4444'} />
      </Cone>
      
      {/* Fenêtres */}
      <Box args={[0.2, 0.3, 0.01]} position={[-0.3, 0.2, 0.51]}>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
      <Box args={[0.2, 0.3, 0.01]} position={[0.3, 0.2, 0.51]}>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
      <Box args={[0.2, 0.3, 0.01]} position={[-0.3, -0.2, 0.51]}>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
      <Box args={[0.2, 0.3, 0.01]} position={[0.3, -0.2, 0.51]}>
        <meshStandardMaterial color="#3b82f6" />
      </Box>
    </group>
  );
};

// Composant Document 3D flottant
const FloatingDocument: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  return (
    <Box
      ref={meshRef}
      args={[0.8, 1.2, 0.05]}
      position={position}
    >
      <meshStandardMaterial color="#ffffff" />
    </Box>
  );
};

// Composant Engrenage 3D (représente le processus)
const Gear3D: React.FC<{ position: [number, number, number]; speed?: number }> = ({ 
  position, 
  speed = 1 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * speed;
    }
  });

  return (
    <Cylinder
      ref={meshRef}
      args={[0.8, 0.8, 0.2, 8]}
      position={position}
    >
      <meshStandardMaterial color="#10b981" />
    </Cylinder>
  );
};

// Composant principal de la scène 3D
const BusinessCreation3D: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  return (
    <div className="w-full h-64 rounded-xl overflow-hidden bg-gradient-to-b from-blue-50 to-blue-100">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{ background: 'linear-gradient(to bottom, #e0f2fe, #b3e5fc)' }}
      >
        {/* Éclairage */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Contrôles de caméra */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 4}
        />

        {/* Bâtiments représentant les étapes */}
        <Building3D 
          position={[-4, 0, 0]} 
          color={currentStep >= 1 ? '#10b981' : '#9ca3af'} 
          scale={currentStep === 1 ? 1.2 : 1}
        />
        <Building3D 
          position={[-2, 0, 0]} 
          color={currentStep >= 2 ? '#10b981' : '#9ca3af'} 
          scale={currentStep === 2 ? 1.2 : 1}
        />
        <Building3D 
          position={[0, 0, 0]} 
          color={currentStep >= 3 ? '#10b981' : '#9ca3af'} 
          scale={currentStep === 3 ? 1.2 : 1}
        />
        <Building3D 
          position={[2, 0, 0]} 
          color={currentStep >= 4 ? '#10b981' : '#9ca3af'} 
          scale={currentStep === 4 ? 1.2 : 1}
        />
        <Building3D 
          position={[4, 0, 0]} 
          color={currentStep >= 5 ? '#f59e0b' : '#9ca3af'} 
          scale={currentStep === 5 ? 1.2 : 1}
        />

        {/* Documents flottants */}
        <FloatingDocument position={[-3, 3, -2]} />
        <FloatingDocument position={[1, 3.5, -1]} />
        <FloatingDocument position={[3, 2.8, -2.5]} />

        {/* Engrenages représentant le processus */}
        <Gear3D position={[-1, -1.5, 1]} speed={0.5} />
        <Gear3D position={[1, -1.5, 1]} speed={-0.7} />

        {/* Texte 3D flottant */}
        <Text
          position={[0, 4, 0]}
          fontSize={0.5}
          color="#1f2937"
          anchorX="center"
          anchorY="middle"
        >
          Votre Entreprise en 3D
        </Text>

        {/* Particules flottantes */}
        {Array.from({ length: 20 }).map((_, i) => (
          <Sphere
            key={i}
            args={[0.02]}
            position={[
              (Math.random() - 0.5) * 10,
              Math.random() * 6 + 2,
              (Math.random() - 0.5) * 10
            ]}
          >
            <meshStandardMaterial color="#f59e0b" opacity={0.6} transparent />
          </Sphere>
        ))}

        {/* Sol */}
        <Box args={[20, 0.1, 10]} position={[0, -2, 0]}>
          <meshStandardMaterial color="#e5e7eb" />
        </Box>
      </Canvas>
    </div>
  );
};

export default BusinessCreation3D;
