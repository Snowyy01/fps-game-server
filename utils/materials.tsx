import * as THREE from "three"

export function getMaterials() {
  // Instead of loading textures, use solid colors
  const groundMaterial = new THREE.MeshStandardMaterial({ color: "#3a7e4c" })
  const wallMaterial = new THREE.MeshStandardMaterial({ color: "#8B4513" })
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: "#555555",
    metalness: 0.8,
    roughness: 0.2,
  })

  return {
    groundMaterial,
    wallMaterial,
    metalMaterial,
  }
}

