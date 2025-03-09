import { Sphere, Box, Billboard, Html } from "@react-three/drei"
import { weapons, powerUps } from "../data/constants"

export function Bullet({ position }) {
  return (
    <Sphere position={position} args={[0.05, 8, 8]} castShadow>
      <meshStandardMaterial color="yellow" emissive="orange" emissiveIntensity={2} />
    </Sphere>
  )
}

export function Weapon({ type, position = [0, 0, 0], isPickup = false }) {
  const weaponConfig = weapons[type]

  // If it's a pickup, render it differently than an equipped weapon
  if (isPickup) {
    return (
      <group position={position}>
        <Box args={[0.6, 0.3, 1.2]} castShadow>
          <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
        </Box>
        <Billboard position={[0, 1, 0]}>
          <Html>
            <div className="bg-black/70 text-white px-2 py-1 text-xs rounded whitespace-nowrap">
              {weaponConfig.name}
            </div>
          </Html>
        </Billboard>
      </group>
    )
  }

  // Equipped weapon
  return (
    <group position={weaponConfig.position} rotation={[0, Math.PI, 0]} scale={weaponConfig.scale}>
      {type === "pistol" && (
        <>
          <mesh castShadow>
            <boxGeometry args={[1, 1, 3]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, -0.5, 0.5]} castShadow>
            <boxGeometry args={[0.8, 2, 1]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </>
      )}

      {type === "shotgun" && (
        <>
          <mesh castShadow>
            <boxGeometry args={[1, 1, 5]} />
            <meshStandardMaterial color="#5c3c2e" />
          </mesh>
          <mesh position={[0, -0.6, 1]} castShadow>
            <boxGeometry args={[0.8, 2, 1.5]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 0, -2]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, 1, 8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </>
      )}

      {type === "rifle" && (
        <>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.8, 6]} />
            <meshStandardMaterial color="#444" />
          </mesh>
          <mesh position={[0, -0.7, 1]} castShadow>
            <boxGeometry args={[0.7, 2, 1]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 0.4, 2]} castShadow>
            <boxGeometry args={[0.3, 0.3, 3]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0, 0.8, 0]} castShadow>
            <boxGeometry args={[0.6, 0.3, 1]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </>
      )}
    </group>
  )
}

export function PowerUp({ type, position }) {
  const powerUpConfig = powerUps[type]

  return (
    <group position={position}>
      <Box args={[0.5, 0.5, 0.5]} castShadow>
        <meshStandardMaterial color={powerUpConfig.color} emissive={powerUpConfig.color} emissiveIntensity={0.5} />
      </Box>
      <Billboard position={[0, 1, 0]}>
        <Html>
          <div className="bg-black/70 text-white px-2 py-1 text-xs rounded whitespace-nowrap">{powerUpConfig.name}</div>
        </Html>
      </Billboard>
    </group>
  )
}

