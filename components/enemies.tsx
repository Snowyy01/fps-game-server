import { Box, Sphere, Billboard } from "@react-three/drei"
import { enemyTypes } from "../data/constants"

export default function Enemy({ enemy }) {
  const enemyType = enemyTypes[enemy.type]

  return (
    <group position={enemy.position}>
      {/* Enemy body based on type */}
      {enemy.type === "basic" && (
        <Sphere args={[0.5, 16, 16]} castShadow>
          <meshStandardMaterial color={enemyType.color} />
        </Sphere>
      )}

      {enemy.type === "fast" && (
        <Box args={[0.4, 0.4, 0.8]} castShadow>
          <meshStandardMaterial color={enemyType.color} />
        </Box>
      )}

      {enemy.type === "tank" && (
        <Box args={[1, 1, 1]} castShadow>
          <meshStandardMaterial color={enemyType.color} />
        </Box>
      )}

      {enemy.type === "flying" && (
        <>
          <Sphere args={[0.4, 16, 16]} castShadow>
            <meshStandardMaterial color={enemyType.color} />
          </Sphere>
          <Box position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]} args={[0.8, 0.1, 0.8]} castShadow>
            <meshStandardMaterial color={enemyType.color} />
          </Box>
        </>
      )}

      {/* Health bar */}
      <Billboard position={[0, 1, 0]}>
        <Box args={[1, 0.1, 0.1]} castShadow>
          <meshBasicMaterial color="#333" />
        </Box>
        <Box
          position={[(enemy.health / enemyTypes[enemy.type].health - 0.5) * 0.5, 0, 0]}
          args={[enemy.health / enemyTypes[enemy.type].health, 0.08, 0.08]}
          castShadow
        >
          <meshBasicMaterial color="#f00" />
        </Box>
      </Billboard>
    </group>
  )
}

