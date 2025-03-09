"use client"

import { useMemo } from "react"
import { usePlane, useBox } from "@react-three/cannon"
import { Box } from "@react-three/drei"
import { getMaterials } from "../utils/materials"

// Ground component with physical collision
function Ground(props) {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0], ...props }))
  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={props.size} />
      <meshStandardMaterial color={props.color} />
    </mesh>
  )
}

// Obstacle box with physical collision
function ObstacleBox({ position, size, material }) {
  const [ref] = useBox(() => ({
    position,
    args: size,
    type: "static",
  }))

  return (
    <Box ref={ref} position={position} args={size} castShadow receiveShadow>
      <primitive object={material} attach="material" />
    </Box>
  )
}

export default function Environment({ level }) {
  const { wallMaterial, metalMaterial } = getMaterials()

  // Generate level environment
  const environment = useMemo(() => {
    if (level.environment === "training") {
      return {
        ground: { size: [50, 50], color: "#3a7e4c" },
        obstacles: [
          { type: "box", position: [-5, 1, -5], size: [2, 2, 2], material: wallMaterial },
          { type: "box", position: [5, 1, 5], size: [2, 2, 2], material: wallMaterial },
          { type: "box", position: [0, 0.5, -10], size: [4, 1, 1], material: wallMaterial },
        ],
      }
    } else if (level.environment === "urban") {
      return {
        ground: { size: [100, 100], color: "#555555" },
        obstacles: [
          // Buildings
          { type: "box", position: [-15, 5, -15], size: [10, 10, 10], material: wallMaterial },
          { type: "box", position: [15, 7, 15], size: [8, 14, 8], material: wallMaterial },
          { type: "box", position: [-15, 4, 15], size: [6, 8, 6], material: wallMaterial },
          { type: "box", position: [15, 3, -15], size: [5, 6, 5], material: wallMaterial },
          // Barriers
          { type: "box", position: [0, 1, -10], size: [20, 2, 1], material: metalMaterial },
          { type: "box", position: [-10, 1, 0], size: [1, 2, 20], material: metalMaterial },
          { type: "box", position: [10, 1, 0], size: [1, 2, 20], material: metalMaterial },
          // Small obstacles
          { type: "box", position: [5, 0.5, 5], size: [1, 1, 1], material: metalMaterial },
          { type: "box", position: [-5, 0.5, -5], size: [1, 1, 1], material: metalMaterial },
          { type: "box", position: [5, 0.5, -5], size: [1, 1, 1], material: metalMaterial },
          { type: "box", position: [-5, 0.5, 5], size: [1, 1, 1], material: metalMaterial },
        ],
      }
    } else if (level.environment === "warehouse") {
      return {
        ground: { size: [80, 80], color: "#333333" },
        obstacles: [
          // Warehouse walls
          { type: "box", position: [0, 10, -30], size: [60, 20, 1], material: wallMaterial },
          { type: "box", position: [0, 10, 30], size: [60, 20, 1], material: wallMaterial },
          { type: "box", position: [-30, 10, 0], size: [1, 20, 60], material: wallMaterial },
          { type: "box", position: [30, 10, 0], size: [1, 20, 60], material: wallMaterial },
          // Shelves and crates
          { type: "box", position: [-15, 2, -15], size: [10, 4, 2], material: metalMaterial },
          { type: "box", position: [-15, 2, -10], size: [10, 4, 2], material: metalMaterial },
          { type: "box", position: [-15, 2, -5], size: [10, 4, 2], material: metalMaterial },
          { type: "box", position: [15, 2, 15], size: [10, 4, 2], material: metalMaterial },
          { type: "box", position: [15, 2, 10], size: [10, 4, 2], material: metalMaterial },
          { type: "box", position: [15, 2, 5], size: [10, 4, 2], material: metalMaterial },
          // Crates
          { type: "box", position: [0, 1, 0], size: [2, 2, 2], material: metalMaterial },
          { type: "box", position: [5, 1, 5], size: [2, 2, 2], material: metalMaterial },
          { type: "box", position: [-5, 1, -5], size: [2, 2, 2], material: metalMaterial },
          { type: "box", position: [5, 1, -5], size: [2, 2, 2], material: metalMaterial },
          { type: "box", position: [-5, 1, 5], size: [2, 2, 2], material: metalMaterial },
          { type: "box", position: [10, 1, -10], size: [2, 2, 2], material: metalMaterial },
          { type: "box", position: [-10, 1, 10], size: [2, 2, 2], material: metalMaterial },
        ],
      }
    }
    return {
      ground: { size: [50, 50], color: "#3a7e4c" },
      obstacles: [],
    }
  }, [level.environment, wallMaterial, metalMaterial])

  return (
    <>
      {/* Ground with physics */}
      <Ground size={environment.ground.size} color={environment.ground.color} />

      {/* Environment obstacles with physics */}
      {environment.obstacles.map((obstacle, index) => (
        <ObstacleBox
          key={`obstacle-${index}`}
          position={obstacle.position}
          size={obstacle.size}
          material={obstacle.material}
        />
      ))}
    </>
  )
}

