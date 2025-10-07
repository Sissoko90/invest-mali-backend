import React, { useRef, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere, Cone, Cylinder, Plane } from '@react-three/drei';
import * as THREE from 'three';

// Composant Building 3D moderne pour la homepage
const ModernBuilding3D: React.FC<{ 
  position: [number, number, number]; 
  color: string; 
  scale?: number;
  label?: string;
}> = ({ position, color, scale = 1, label }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <group position={position} scale={hovered ? scale * 1.1 : scale}>
      {/* Bâtiment principal */}
      <Box
        ref={meshRef}
        args={[1.2, 3, 1.2]}
        position={[0, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={hovered ? '#f59e0b' : color} 
          metalness={0.3}
          roughness={0.4}
        />
      </Box>
      
      {/* Toit moderne */}
      <Box args={[1.4, 0.2, 1.4]} position={[0, 1.6, 0]}>
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
      </Box>
      
      {/* Fenêtres modernes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Box 
          key={i}
          args={[0.3, 0.4, 0.02]} 
          position={[
            (i % 2 === 0 ? -0.4 : 0.4), 
            0.8 - Math.floor(i / 2) * 0.6, 
            0.61
          ]}
        >
          <meshStandardMaterial 
            color={hovered ? '#60a5fa' : '#3b82f6'} 
            emissive="#1e40af"
            emissiveIntensity={0.2}
          />
        </Box>
      ))}

      {/* Label flottant */}
      {label && (
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.3}
          color="#1f2937"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
};

// Composant Entrepreneur 3D (personnage stylisé)
const Entrepreneur3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Corps */}
      <Cylinder args={[0.3, 0.4, 1.2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1f2937" />
      </Cylinder>
      
      {/* Tête */}
      <Sphere args={[0.25]} position={[0, 0.8, 0]}>
        <meshStandardMaterial color="#fbbf24" />
      </Sphere>
      
      {/* Ordinateur portable */}
      <Box args={[0.4, 0.3, 0.05]} position={[0.5, 0.2, 0]}>
        <meshStandardMaterial color="#374151" />
      </Box>
      
      {/* Écran */}
      <Box args={[0.35, 0.25, 0.02]} position={[0.5, 0.35, 0.04]}>
        <meshStandardMaterial color="#60a5fa" emissive="#1e40af" emissiveIntensity={0.3} />
      </Box>
    </group>
  );
};

// Composant Document volant avec effet papier
const FlyingDocument3D: React.FC<{ 
  position: [number, number, number];
  rotation?: [number, number, number];
}> = ({ position, rotation = [0, 0, 0] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = rotation[0] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      meshRef.current.rotation.z = rotation[2] + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  return (
    <Box
      ref={meshRef}
      args={[0.6, 0.8, 0.02]}
      position={position}
      rotation={rotation}
    >
      <meshStandardMaterial 
        color="#ffffff" 
        transparent 
        opacity={0.9}
        side={THREE.DoubleSide}
      />
    </Box>
  );
};

// Composant Engrenage pour le processus
const ProcessGear3D: React.FC<{ 
  position: [number, number, number]; 
  speed?: number;
  size?: number;
}> = ({ position, speed = 1, size = 0.6 }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * speed;
    }
  });

  return (
    <Cylinder
      ref={meshRef}
      args={[size, size, 0.15, 8]}
      position={position}
    >
      <meshStandardMaterial 
        color="#10b981" 
        metalness={0.7}
        roughness={0.3}
      />
    </Cylinder>
  );
};

// Composant de fallback pour le chargement
const LoadingFallback: React.FC = () => (
  <div className="w-full h-96 flex items-center justify-center bg-gradient-to-b from-blue-50 to-emerald-50 rounded-2xl">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mali-emerald mx-auto mb-4"></div>
      <p className="text-mali-dark font-medium">Chargement de l'expérience 3D...</p>
    </div>
  </div>
);

// Composant de test simple pour vérifier le rendu 3D
const Simple3DTest: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <group>
      <Box ref={meshRef} args={[2, 2, 2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#10b981" />
      </Box>
      <Sphere args={[1]} position={[-3, 0, 0]}>
        <meshStandardMaterial color="#f59e0b" />
      </Sphere>
      <Cylinder args={[1, 1, 2]} position={[3, 0, 0]}>
        <meshStandardMaterial color="#3b82f6" />
      </Cylinder>
    </group>
  );
};

// Composant CSS 3D alternatif (plus fiable que Three.js)
const CSS3DScene: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (sceneRef.current) {
        const rect = sceneRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculer la position relative du curseur (-1 à 1)
        const x = (e.clientX - centerX) / (rect.width / 2);
        const y = (e.clientY - centerY) / (rect.height / 2);
        
        setMousePosition({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
      }
    };

    const handleMouseLeave = () => {
      setMousePosition({ x: 0, y: 0 });
    };

    if (sceneRef.current) {
      sceneRef.current.addEventListener('mousemove', handleMouseMove);
      sceneRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (sceneRef.current) {
        sceneRef.current.removeEventListener('mousemove', handleMouseMove);
        sceneRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  // Calculer les rotations basées sur la position de la souris
  const rotateX = mousePosition.y * 15; // Rotation verticale max 15°
  const rotateY = mousePosition.x * 25; // Rotation horizontale max 25°

  return (
    <div 
      ref={sceneRef}
      className="w-full h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 via-emerald-50 to-purple-50 relative cursor-pointer"
      style={{ perspective: '1000px' }}
    >
      {/* Titre principal avec effet 3D */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <h2 className="text-4xl font-bold text-mali-dark text-center mb-2 transform-gpu perspective-1000">
          <span className="inline-block animate-pulse bg-gradient-to-r from-mali-emerald to-mali-gold bg-clip-text text-transparent">
            InvestMali 3D
          </span>
        </h2>
        <p className="text-lg text-gray-600 text-center">
          Votre entreprise en 24 heures
        </p>
      </div>

      {/* Bâtiments 3D en CSS */}
      <div className="absolute inset-0 flex items-center justify-center perspective-1000">
        <div 
          className="relative w-full max-w-4xl h-64 transform-gpu transition-transform duration-300 ease-out"
          style={{
            transform: `rotateX(${-rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          
          {/* Bâtiment 1 - Création 24h */}
          <div className="absolute left-8 bottom-16 w-16 h-32 bg-gradient-to-t from-mali-emerald to-mali-emerald/80 rounded-t-lg shadow-2xl transform-gpu animate-bounce" 
               style={{ 
                 animationDelay: '0s',
                 transform: 'rotateX(10deg) rotateY(-15deg)',
                 boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)'
               }}>
            <div className="absolute top-2 left-2 right-2 h-6 bg-white/20 rounded"></div>
            <div className="absolute top-10 left-2 right-2 h-6 bg-white/20 rounded"></div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-mali-dark whitespace-nowrap">
              Création 24h
            </div>
          </div>

          {/* Bâtiment 2 - Paiement sécurisé */}
          <div className="absolute left-32 bottom-20 w-20 h-28 bg-gradient-to-t from-mali-gold to-mali-gold/80 rounded-t-lg shadow-2xl transform-gpu animate-bounce"
               style={{ 
                 animationDelay: '0.5s',
                 transform: 'rotateX(10deg) rotateY(5deg)',
                 boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)'
               }}>
            <div className="absolute top-2 left-2 right-2 h-4 bg-white/20 rounded"></div>
            <div className="absolute top-8 left-2 right-2 h-4 bg-white/20 rounded"></div>
            <div className="absolute top-14 left-2 right-2 h-4 bg-white/20 rounded"></div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-mali-dark whitespace-nowrap">
              Paiement sécurisé
            </div>
          </div>

          {/* Bâtiment 3 - Support 24/7 */}
          <div className="absolute right-32 bottom-18 w-18 h-36 bg-gradient-to-t from-purple-600 to-purple-500 rounded-t-lg shadow-2xl transform-gpu animate-bounce"
               style={{ 
                 animationDelay: '1s',
                 transform: 'rotateX(10deg) rotateY(15deg)',
                 boxShadow: '0 20px 40px rgba(147, 51, 234, 0.3)'
               }}>
            <div className="absolute top-2 left-2 right-2 h-5 bg-white/20 rounded"></div>
            <div className="absolute top-9 left-2 right-2 h-5 bg-white/20 rounded"></div>
            <div className="absolute top-16 left-2 right-2 h-5 bg-white/20 rounded"></div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-mali-dark whitespace-nowrap">
              Support 24/7
            </div>
          </div>

          {/* Bâtiment 4 - Innovation */}
          <div className="absolute right-8 bottom-12 w-14 h-40 bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg shadow-2xl transform-gpu animate-bounce"
               style={{ 
                 animationDelay: '1.5s',
                 transform: 'rotateX(10deg) rotateY(25deg)',
                 boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)'
               }}>
            <div className="absolute top-2 left-2 right-2 h-4 bg-white/20 rounded"></div>
            <div className="absolute top-8 left-2 right-2 h-4 bg-white/20 rounded"></div>
            <div className="absolute top-14 left-2 right-2 h-4 bg-white/20 rounded"></div>
            <div className="absolute top-20 left-2 right-2 h-4 bg-white/20 rounded"></div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-mali-dark whitespace-nowrap">
              Innovation
            </div>
          </div>

          {/* Entrepreneurs stylisés */}
          <div className="absolute left-20 bottom-4 w-8 h-12 bg-gradient-to-t from-gray-700 to-gray-600 rounded-t-full shadow-lg animate-pulse">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-400 rounded-full"></div>
          </div>
          
          <div className="absolute right-20 bottom-4 w-8 h-12 bg-gradient-to-t from-gray-700 to-gray-600 rounded-t-full shadow-lg animate-pulse" style={{ animationDelay: '1s' }}>
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-yellow-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Documents volants avec interaction curseur */}
      <div 
        className="absolute top-16 left-16 w-8 h-10 bg-white shadow-lg rounded transform-gpu animate-float transition-transform duration-300 ease-out" 
        style={{ 
          animation: 'float 3s ease-in-out infinite',
          transform: `rotateX(${20 + rotateX * 0.5}deg) rotateZ(${15 + rotateY * 0.3}deg) translateZ(${mousePosition.x * 10}px)`
        }}>
      </div>
      
      <div 
        className="absolute top-24 right-20 w-6 h-8 bg-white shadow-lg rounded transform-gpu animate-float transition-transform duration-300 ease-out" 
        style={{ 
          animation: 'float 4s ease-in-out infinite reverse',
          animationDelay: '1s',
          transform: `rotateX(${-15 + rotateX * 0.3}deg) rotateZ(${-10 - rotateY * 0.4}deg) translateZ(${-mousePosition.x * 8}px)`
        }}>
      </div>

      {/* Engrenages CSS avec interaction curseur */}
      <div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(-50%) rotateX(${rotateX * 0.5}deg) rotateY(${rotateY * 0.8}deg) translateZ(${mousePosition.y * 15}px)`
        }}
      >
        <div className="relative">
          <div 
            className="w-12 h-12 border-4 border-mali-emerald rounded-full animate-spin" 
            style={{ 
              animationDuration: `${3 - Math.abs(mousePosition.x) * 1}s`,
              transform: `scale(${1 + Math.abs(mousePosition.x) * 0.2})`
            }}
          >
            <div className="absolute inset-2 border-2 border-mali-emerald rounded-full"></div>
          </div>
          <div 
            className="absolute -right-8 top-2 w-8 h-8 border-4 border-mali-gold rounded-full animate-spin" 
            style={{ 
              animationDuration: `${2 - Math.abs(mousePosition.y) * 0.5}s`, 
              animationDirection: 'reverse',
              transform: `scale(${1 + Math.abs(mousePosition.y) * 0.3})`
            }}
          >
            <div className="absolute inset-1 border-2 border-mali-gold rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Particules flottantes avec interaction curseur */}
      {Array.from({ length: 15 }).map((_, i) => {
        const baseLeft = Math.random() * 100;
        const baseTop = Math.random() * 100;
        const offsetX = (mousePosition.x * 20 * (i % 2 === 0 ? 1 : -1));
        const offsetY = (mousePosition.y * 15 * (i % 3 === 0 ? 1 : -1));
        
        return (
          <div
            key={i}
            className="absolute w-2 h-2 bg-mali-emerald rounded-full opacity-60 animate-pulse transition-all duration-500 ease-out"
            style={{
              left: `calc(${baseLeft}% + ${offsetX}px)`,
              top: `calc(${baseTop}% + ${offsetY}px)`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              transform: `scale(${1 + Math.abs(mousePosition.x + mousePosition.y) * 0.5})`,
              opacity: 0.6 + Math.abs(mousePosition.x * mousePosition.y) * 0.4
            }}
          />
        );
      })}

      {/* Styles CSS personnalisés intégrés */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotateX(20deg); }
            50% { transform: translateY(-10px) rotateX(25deg); }
          }
          .perspective-1000 {
            perspective: 1000px;
          }
          .transform-gpu {
            transform-style: preserve-3d;
          }
        `
      }} />
    </div>
  );
};

// Composant principal de la scène 3D pour la homepage
const Homepage3D: React.FC = () => {
  const [use3D, setUse3D] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Test WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      console.warn('WebGL not supported, using CSS 3D fallback');
      setUse3D(false);
    }
    
    // Simuler un délai de chargement puis basculer vers CSS 3D si Three.js ne charge pas
    const timeout = setTimeout(() => {
      setLoading(false);
      setUse3D(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  // Si WebGL n'est pas supporté ou si le chargement échoue, utiliser CSS 3D
  if (!use3D || !loading) {
    return <CSS3DScene />;
  }

  // Tentative de chargement Three.js avec fallback rapide
  return (
    <div className="w-full h-96 rounded-2xl overflow-hidden bg-gradient-to-b from-blue-50 to-emerald-50">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 2, 8], fov: 60 }}
          style={{ 
            background: 'linear-gradient(135deg, #e0f2fe 0%, #ecfdf5 100%)',
            width: '100%',
            height: '100%'
          }}
          onCreated={() => setLoading(false)}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <OrbitControls enableZoom={true} enablePan={true} autoRotate autoRotateSpeed={1} />
          <Simple3DTest />
          <Text position={[0, 3, 0]} fontSize={1} color="#1f2937" anchorX="center" anchorY="middle">
            InvestMali 3D
          </Text>
          <Text position={[0, 2, 0]} fontSize={0.5} color="#6b7280" anchorX="center" anchorY="middle">
            Votre entreprise en 24h
          </Text>
        </Canvas>
      </Suspense>
    </div>
  );
};

export default Homepage3D;
