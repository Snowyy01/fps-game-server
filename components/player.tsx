"use client"

import { useSphere } from "@react-three/cannon"
import { Sphere, Billboard, Text } from "@react-three/drei"
import { useRef } from "react"

export default function Player({ position, rotation, playerId, playerName, health = 100, isLocalPlayer = false }) {
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.5],
    type: isLocalPlayer ? "dynamic" : "static",
  }))

  const playerRef = useRef()

  return (
    <group ref={playerRef} position={position} rotation={rotation}>
      <Sphere ref={ref} args={[0.5, 16, 16]}>
        <meshStandardMaterial color={isLocalPlayer ? "#00aaff" : "#ff5500"} />
      </Sphere>

      {!isLocalPlayer && (
        <>
          {/* Player name */}
          <Billboard position={[0, 1.2, 0]}>
            <Text
              color="white"
              fontSize={0.5}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
            >
              {playerName}
            </Text>
          </Billboard>

          {/* Health bar */}
          <Billboard position={[0, 0.8, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1, 0.1, 0.01]} />
              <meshBasicMaterial color="#333333" />
            </mesh>
            <mesh position={[(health / 100 - 1) / 2, 0, 0.01]}>
              <boxGeometry args={[health / 100, 0.08, 0.01]} />
              <meshBasicMaterial color={health > 30 ? "#00ff00" : "#ff0000"} />
            </mesh>
          </Billboard>

          {/* Simple weapon model */}
          <mesh position={[0.3, 0, 0.5]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.5]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </>
      )}
    </group>
  )
}

