// frontend/src/components/PersonaCard3D.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

const PersonaCard3D = ({ persona, position, onClick, isHovered, onHover }) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;

    const targetZ = isHovered ? 4.2 : 0;
    const currentZ = groupRef.current.position.z;
    groupRef.current.position.z = currentZ * 0.88 + targetZ * 0.12;

    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.1 + position[0]) * 0.16;
    
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.45) * (isHovered ? 0.20 : 0.08);
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.32) * 0.045;
  });

  const baseGlow = isHovered ? '#FF1F3A' : '#C0262E';
  const intenseGlow = isHovered ? '#FF4D6B' : '#8B1A2B';

  return (
    <group 
      ref={groupRef} 
      position={[position[0], position[1], 0]}
    >
      <mesh
        onClick={onClick}
        onPointerOver={() => onHover?.(true)}
        onPointerOut={() => onHover?.(false)}
      >
        <planeGeometry args={[4.4, 6.2]} />
        <meshStandardMaterial 
          color="#0F0F17"
          metalness={0.45}
          roughness={0.55}
          emissive={baseGlow}
          emissiveIntensity={isHovered ? 0.92 : 0.28}
        />
      </mesh>

      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[4.1, 5.9]} />
        <meshBasicMaterial 
          color={intenseGlow}
          transparent 
          opacity={isHovered ? 0.48 : 0.12}
        />
      </mesh>

      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[4.7, 6.5]} />
        <meshBasicMaterial 
          color={baseGlow} 
          transparent 
          opacity={isHovered ? 0.58 : 0.18} 
        />
      </mesh>

      <Html 
        position={[0, 0.6, 0.06]} 
        style={{ pointerEvents: 'auto', width: '380px' }}
        transform
        occlude
      >
        <div 
          className="persona-card-content"
          onMouseEnter={() => onHover?.(true)}
          onMouseLeave={() => onHover?.(false)}
          onClick={onClick}
        >
          <div className="persona-image-container">
            <img 
              src={persona.image || '/default-avatar.png'} 
              alt={persona.name}
              className="persona-image"
            />
          </div>
          <h2 className="persona-name">{persona.name}</h2>
          <p className="persona-description">{persona.description}</p>
          
          {persona.creativeContext && (
            <div className="persona-tag">
              {persona.creativeContext.replace('_', ' ').toUpperCase()}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

export default PersonaCard3D;
