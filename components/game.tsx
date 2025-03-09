"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { PointerLockControls } from "@react-three/drei"
import * as THREE from "three"

import Environment from "./environment"
import Player from "./player"
import { Bullet, Weapon, PowerUp } from "./items"
import Enemy from "./enemies"
import { levels, weapons, powerUps, enemyTypes, sounds } from "../data/constants"

export default function Game({
  gameState,
  setGameState,
  currentLevel,
  score,
  setScore,
  health,
  setHealth,
  shield,
  setShield,
  addNotification,
  activeWeapon,
  setActiveWeapon,
  inventory,
  setInventory,
  controlsLocked,
  setControlsLocked,
  players,
  playerId,
  playerName,
  updatePlayerPosition,
  playerShoot,
  playerHit,
}) {
  const controls = useRef()
  const [bullets, setBullets] = useState([])
  const [otherPlayerBullets, setOtherPlayerBullets] = useState([])
  const [enemies, setEnemies] = useState([])
  const [powerUpItems, setPowerUpItems] = useState([])
  const [weaponPickups, setWeaponPickups] = useState([])
  const [moveForward, setMoveForward] = useState(false)
  const [moveBackward, setMoveBackward] = useState(false)
  const [moveLeft, setMoveLeft] = useState(false)
  const [moveRight, setMoveRight] = useState(false)
  const [canJump, setCanJump] = useState(true)
  const [velocity, setVelocity] = useState([0, 0, 0])
  const [isReloading, setIsReloading] = useState(false)
  const [lastShot, setLastShot] = useState(0)
  const [activePowerUps, setActivePowerUps] = useState([])
  const direction = useRef(new THREE.Vector3())
  const { camera } = useThree()
  const level = levels[currentLevel]
  const [playerPosition, setPlayerPosition] = useState([0, 1.6, 0])
  const [playerRotation, setPlayerRotation] = useState([0, 0, 0])
  const [lastPositionUpdate, setLastPositionUpdate] = useState(0)

  // Handle pointer lock changes
  useEffect(() => {
    const handleLockChange = () => {
      if (document.pointerLockElement) {
        setControlsLocked(true)
      } else {
        setControlsLocked(false)
        if (gameState === "playing") {
          setGameState("paused")
        }
      }
    }

    document.addEventListener("pointerlockchange", handleLockChange)
    return () => {
      document.removeEventListener("pointerlockchange", handleLockChange)
    }
  }, [gameState, setGameState, setControlsLocked])

  // Generate initial enemies, power-ups, and weapons
  useEffect(() => {
    if (gameState === "playing") {
      // Generate enemies
      const newEnemies = []
      level.enemies.forEach((enemyGroup) => {
        const enemyType = enemyTypes[enemyGroup.type]
        for (let i = 0; i < enemyGroup.count; i++) {
          newEnemies.push({
            id: `enemy-${enemyGroup.type}-${i}`,
            type: enemyGroup.type,
            position: [
              (Math.random() - 0.5) * 40,
              enemyType.flying ? Math.random() * 5 + 2 : 1,
              (Math.random() - 0.5) * 40,
            ],
            health: enemyType.health,
            lastAttack: 0,
            state: "idle", // idle, chasing, attacking
          })
        }
      })
      setEnemies(newEnemies)

      // Generate power-ups
      const newPowerUps = []
      level.powerUps.forEach((powerUpGroup) => {
        const powerUpType = powerUps[powerUpGroup.type]
        for (let i = 0; i < powerUpGroup.count; i++) {
          newPowerUps.push({
            id: `powerup-${powerUpGroup.type}-${i}`,
            type: powerUpGroup.type,
            position: [(Math.random() - 0.5) * 40, 1, (Math.random() - 0.5) * 40],
          })
        }
      })
      setPowerUpItems(newPowerUps)

      // Generate weapon pickups (except for starting weapons)
      const newWeapons = []
      level.weapons.forEach((weaponType) => {
        if (weaponType !== "pistol" && !inventory[weaponType]) {
          newWeapons.push({
            id: `weapon-${weaponType}`,
            type: weaponType,
            position: [(Math.random() - 0.5) * 40, 1, (Math.random() - 0.5) * 40],
          })
        }
      })
      setWeaponPickups(newWeapons)
    }
  }, [gameState, currentLevel, level, inventory])

  // Handle keyboard controls
  useEffect(() => {
    if (gameState !== "playing") return

    const handleKeyDown = (e) => {
      if (gameState !== "playing" || !controlsLocked) return

      switch (e.code) {
        case "KeyW":
          setMoveForward(true)
          break
        case "KeyS":
          setMoveBackward(true)
          break
        case "KeyA":
          setMoveLeft(true)
          break
        case "KeyD":
          setMoveRight(true)
          break
        case "Space":
          if (canJump) {
            setVelocity([velocity[0], 5, velocity[2]])
            setCanJump(false)
            sounds.jump.play()
          }
          break
        case "KeyR":
          reload()
          break
        case "Digit1":
          if (inventory.pistol) setActiveWeapon("pistol")
          break
        case "Digit2":
          if (inventory.shotgun) setActiveWeapon("shotgun")
          break
        case "Digit3":
          if (inventory.rifle) setActiveWeapon("rifle")
          break
        case "Escape":
          if (document.pointerLockElement) {
            document.exitPointerLock()
          }
          break
        default:
          break
      }
    }

    const handleKeyUp = (e) => {
      if (gameState !== "playing" || !controlsLocked) return

      switch (e.code) {
        case "KeyW":
          setMoveForward(false)
          break
        case "KeyS":
          setMoveBackward(false)
          break
        case "KeyA":
          setMoveLeft(false)
          break
        case "KeyD":
          setMoveRight(false)
          break
        default:
          break
      }
    }

    const handleMouseDown = (e) => {
      if (e.button === 0 && gameState === "playing" && controlsLocked) {
        // Left mouse button
        e.preventDefault() // Prevent default behavior
        shoot()
      }
    }

    const handleWheel = (e) => {
      if (gameState !== "playing" || !controlsLocked) return

      // Weapon switching with mouse wheel
      const weaponKeys = Object.keys(inventory).filter((key) => inventory[key])
      if (weaponKeys.length <= 1) return

      const currentIndex = weaponKeys.indexOf(activeWeapon)
      let newIndex

      if (e.deltaY > 0) {
        // Scroll down - next weapon
        newIndex = (currentIndex + 1) % weaponKeys.length
      } else {
        // Scroll up - previous weapon
        newIndex = (currentIndex - 1 + weaponKeys.length) % weaponKeys.length
      }

      setActiveWeapon(weaponKeys[newIndex])
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("wheel", handleWheel)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("wheel", handleWheel)
    }
  }, [gameState, canJump, velocity, activeWeapon, inventory, isReloading, controlsLocked])

  // Reload weapon
  const reload = () => {
    if (isReloading || !inventory[activeWeapon]) return

    const weapon = weapons[activeWeapon]
    if (inventory[activeWeapon].ammo === inventory[activeWeapon].maxAmmo) return

    setIsReloading(true)
    sounds.reload.play()

    setTimeout(() => {
      setInventory((prev) => ({
        ...prev,
        [activeWeapon]: {
          ...prev[activeWeapon],
          ammo: prev[activeWeapon].maxAmmo,
        },
      }))
      setIsReloading(false)
      addNotification(`${weapon.name} reloaded`, "info")
    }, weapon.reloadTime)
  }

  // Shooting function
  const shoot = () => {
    if (
      isReloading ||
      !inventory[activeWeapon] ||
      inventory[activeWeapon].ammo <= 0 ||
      Date.now() - lastShot < weapons[activeWeapon].fireRate ||
      gameState !== "playing" ||
      !controlsLocked
    ) {
      if (inventory[activeWeapon]?.ammo <= 0 && !isReloading) {
        reload()
      }
      return
    }

    const weapon = weapons[activeWeapon]
    sounds[weapon.sound].play()
    setLastShot(Date.now())

    // Update ammo
    setInventory((prev) => ({
      ...prev,
      [activeWeapon]: {
        ...prev[activeWeapon],
        ammo: prev[activeWeapon].ammo - 1,
      },
    }))

    // Create bullets
    const bulletCount = weapon.bulletCount || 1
    const newBullets = []
    const bulletDirection = new THREE.Vector3() // Declare bulletDirection here

    for (let i = 0; i < bulletCount; i++) {
      camera.getWorldDirection(bulletDirection)

      // Add spread if weapon has it
      if (weapon.bulletSpread) {
        bulletDirection.x += (Math.random() - 0.5) * weapon.bulletSpread
        bulletDirection.y += (Math.random() - 0.5) * weapon.bulletSpread
        bulletDirection.z += (Math.random() - 0.5) * weapon.bulletSpread
        bulletDirection.normalize()
      }

      const bulletPosition = new THREE.Vector3()
      camera.getWorldPosition(bulletPosition)

      // Offset the bullet to appear from the gun
      bulletPosition.add(bulletDirection.clone().multiplyScalar(0.5))

      newBullets.push({
        id: `${Date.now()}-${i}`,
        position: [bulletPosition.x, bulletPosition.y, bulletPosition.z],
        direction: [bulletDirection.x, bulletDirection.y, bulletDirection.z],
        weapon: activeWeapon,
        damage: weapon.damage,
        createdAt: Date.now(),
        playerId: playerId, // Track which player fired the bullet
      })
    }

    setBullets((prev) => [...prev, ...newBullets])

    // Notify other players about the shot
    playerShoot(
      [camera.position.x, camera.position.y, camera.position.z],
      [bulletDirection.x, bulletDirection.y, bulletDirection.z],
      activeWeapon,
    )

    // Auto reload when empty
    if (inventory[activeWeapon].ammo <= 1 && !isReloading) {
      reload()
    }
  }

  // Handle power-up effects
  useEffect(() => {
    // Check for expired power-ups
    const now = Date.now()
    const expired = activePowerUps.filter((p) => p.expiresAt <= now)

    if (expired.length > 0) {
      // Remove expired power-ups
      setActivePowerUps((prev) => prev.filter((p) => p.expiresAt > now))

      // Notify about expired power-ups
      expired.forEach((p) => {
        addNotification(`${powerUps[p.type].name} expired`, "info")
      })
    }
  }, [activePowerUps, addNotification])

  // Update player movement, bullets, enemies, and check collisions
  useFrame((state, delta) => {
    if (gameState !== "playing" || !controlsLocked) return

    // Calculate player speed with power-ups
    let playerSpeed = 5
    const speedPowerUp = activePowerUps.find((p) => p.type === "speed")
    if (speedPowerUp) {
      playerSpeed *= powerUps.speed.value
    }

    // Update player movement
    direction.current.set(0, 0, 0)

    if (moveForward) direction.current.z -= 1
    if (moveBackward) direction.current.z += 1
    if (moveLeft) direction.current.x -= 1
    if (moveRight) direction.current.x += 1

    // Apply movement in the camera direction
    if (direction.current.length() > 0) {
      direction.current.normalize()
      direction.current.applyQuaternion(camera.quaternion)
      direction.current.y = 0 // Keep movement on the xz plane
      direction.current.multiplyScalar(playerSpeed * delta)

      camera.position.add(direction.current)
    }

    // Apply gravity
    camera.position.y += velocity[1] * delta

    // Simple ground collision
    if (camera.position.y < 1.6) {
      camera.position.y = 1.6
      setVelocity([velocity[0], 0, velocity[2]])
      setCanJump(true)
    } else {
      setVelocity([velocity[0], velocity[1] - 9.8 * delta, velocity[2]])
    }

    // Simple boundary check
    const boundarySize = 40
    if (Math.abs(camera.position.x) > boundarySize) {
      camera.position.x = Math.sign(camera.position.x) * boundarySize
    }
    if (Math.abs(camera.position.z) > boundarySize) {
      camera.position.z = Math.sign(camera.position.z) * boundarySize
    }

    // Update player position for multiplayer
    setPlayerPosition([camera.position.x, camera.position.y, camera.position.z])

    // Get camera rotation
    const rotation = new THREE.Euler().setFromQuaternion(camera.quaternion)
    setPlayerRotation([rotation.x, rotation.y, rotation.z])

    // Send position updates to server (throttled to 10 updates per second)
    if (Date.now() - lastPositionUpdate > 100) {
      updatePlayerPosition(
        [camera.position.x, camera.position.y, camera.position.z],
        [rotation.x, rotation.y, rotation.z],
      )
      setLastPositionUpdate(Date.now())
    }

    // Update bullets
    setBullets((prevBullets) => {
      return prevBullets
        .filter((bullet) => Date.now() - bullet.createdAt < 2000) // Remove bullets after 2 seconds
        .map((bullet) => {
          const weaponData = weapons[bullet.weapon]
          const speed = weaponData.bulletSpeed * delta
          return {
            ...bullet,
            position: [
              bullet.position[0] + bullet.direction[0] * speed,
              bullet.position[1] + bullet.direction[1] * speed,
              bullet.position[2] + bullet.direction[2] * speed,
            ],
          }
        })
    })

    // Update other players' bullets
    setOtherPlayerBullets((prevBullets) => {
      return prevBullets
        .filter((bullet) => Date.now() - bullet.createdAt < 2000)
        .map((bullet) => {
          const weaponData = weapons[bullet.weapon]
          const speed = weaponData.bulletSpeed * delta
          return {
            ...bullet,
            position: [
              bullet.position[0] + bullet.direction[0] * speed,
              bullet.position[1] + bullet.direction[1] * speed,
              bullet.position[2] + bullet.direction[2] * speed,
            ],
          }
        })
    })

    // Update enemies
    setEnemies((prevEnemies) => {
      return prevEnemies.map((enemy) => {
        if (enemy.health <= 0) return enemy

        const enemyType = enemyTypes[enemy.type]
        const playerPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z)
        const enemyPos = new THREE.Vector3(...enemy.position)
        const distanceToPlayer = enemyPos.distanceTo(playerPos)

        // Update enemy state based on distance to player
        let newState = enemy.state
        if (distanceToPlayer < enemyType.attackRange) {
          newState = "attacking"
        } else if (distanceToPlayer < 15) {
          newState = "chasing"
        } else {
          newState = "idle"
        }

        // Update enemy position based on state
        let newPosition = [...enemy.position]

        if (newState === "chasing") {
          // Move towards player
          const direction = new THREE.Vector3()
            .subVectors(playerPos, enemyPos)
            .normalize()
            .multiplyScalar(enemyType.speed * delta)

          // If flying enemy, allow y movement, otherwise keep on ground
          if (enemyType.flying) {
            newPosition = [
              enemy.position[0] + direction.x,
              enemy.position[1] + direction.y,
              enemy.position[2] + direction.z,
            ]
          } else {
            newPosition = [enemy.position[0] + direction.x, enemy.position[1], enemy.position[2] + direction.z]
          }
        }

        // Attack player if in range and cooldown expired
        if (newState === "attacking" && Date.now() - enemy.lastAttack > enemyType.attackRate) {
          // Apply damage to player
          const damageToDeal = enemyType.damage

          // Check if player has shield
          if (shield > 0) {
            const remainingDamage = Math.max(0, damageToDeal - shield)
            setShield((prev) => Math.max(0, prev - damageToDeal))

            if (remainingDamage > 0) {
              setHealth((prev) => Math.max(0, prev - remainingDamage))
            }
          } else {
            setHealth((prev) => Math.max(0, prev - damageToDeal))
          }

          sounds.playerDamage.play()
          addNotification(`Took ${damageToDeal} damage from ${enemy.type} enemy!`, "error")

          return {
            ...enemy,
            position: newPosition,
            state: newState,
            lastAttack: Date.now(),
          }
        }

        return {
          ...enemy,
          position: newPosition,
          state: newState,
        }
      })
    })

    // Check bullet collisions with enemies
    bullets.forEach((bullet) => {
      enemies.forEach((enemy, index) => {
        if (enemy.health <= 0) return

        const bulletPos = new THREE.Vector3(...bullet.position)
        const enemyPos = new THREE.Vector3(...enemy.position)
        const distance = bulletPos.distanceTo(enemyPos)

        if (distance < 1) {
          // Enemy hit radius
          // Calculate damage with power-ups
          let damage = bullet.damage
          const damagePowerUp = activePowerUps.find((p) => p.type === "damage")
          if (damagePowerUp) {
            damage *= powerUps.damage.value
          }

          setEnemies((prevEnemies) => {
            const newEnemies = [...prevEnemies]
            const newHealth = Math.max(0, enemy.health - damage)

            if (newHealth <= 0) {
              // Enemy defeated
              sounds.enemyDeath.play()
              setScore((prev) => prev + enemyTypes[enemy.type].points)
              addNotification(`+${enemyTypes[enemy.type].points} points`, "success")

              // Respawn enemy after delay
              setTimeout(() => {
                setEnemies((prevEnemies) => {
                  return prevEnemies.map((e) => {
                    if (e.id === enemy.id) {
                      return {
                        ...e,
                        health: enemyTypes[e.type].health,
                        position: [
                          (Math.random() - 0.5) * 40,
                          enemyTypes[e.type].flying ? Math.random() * 5 + 2 : 1,
                          (Math.random() - 0.5) * 40,
                        ],
                        state: "idle",
                      }
                    }
                    return e
                  })
                })
              }, 5000)
            } else {
              sounds.hit.play()
            }

            newEnemies[index] = {
              ...enemy,
              health: newHealth,
            }

            return newEnemies
          })

          // Remove bullet after hit
          setBullets((prev) => prev.filter((b) => b.id !== bullet.id))
        }
      })

      // Check bullet collisions with other players
      Object.values(players).forEach((player) => {
        if (player.id === playerId || player.health <= 0) return

        const bulletPos = new THREE.Vector3(...bullet.position)
        const playerPos = new THREE.Vector3(...player.position)
        const distance = bulletPos.distanceTo(playerPos)

        if (distance < 1) {
          // Player hit
          let damage = bullet.damage
          const damagePowerUp = activePowerUps.find((p) => p.type === "damage")
          if (damagePowerUp) {
            damage *= powerUps.damage.value
          }

          // Notify server about the hit
          playerHit(player.id, damage)

          // Remove bullet after hit
          setBullets((prev) => prev.filter((b) => b.id !== bullet.id))
        }
      })
    })

    // Check player collision with power-ups
    powerUpItems.forEach((powerUp, index) => {
      const playerPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z)
      const powerUpPos = new THREE.Vector3(...powerUp.position)
      const distance = powerUpPos.distanceTo(playerPos)

      if (distance < 2) {
        // Pickup radius
        // Apply power-up effect
        const powerUpData = powerUps[powerUp.type]

        if (powerUpData.effect === "health") {
          setHealth((prev) => Math.min(100, prev + powerUpData.value))
          addNotification(`+${powerUpData.value} Health`, "success")
        } else if (powerUpData.effect === "shield") {
          setShield((prev) => Math.min(100, prev + powerUpData.value))
          addNotification(`+${powerUpData.value} Shield`, "success")
        } else {
          // Timed power-ups
          setActivePowerUps((prev) => [
            ...prev.filter((p) => p.type !== powerUp.type), // Remove existing of same type
            {
              type: powerUp.type,
              startedAt: Date.now(),
              expiresAt: Date.now() + powerUpData.duration,
            },
          ])
          addNotification(`${powerUpData.name} activated for ${powerUpData.duration / 1000}s`, "success")
        }

        sounds.pickup.play()

        // Remove power-up
        setPowerUpItems((prev) => prev.filter((_, i) => i !== index))

        // Respawn power-up after delay
        setTimeout(() => {
          setPowerUpItems((prev) => [
            ...prev,
            {
              id: `powerup-${powerUp.type}-${Date.now()}`,
              type: powerUp.type,
              position: [(Math.random() - 0.5) * 40, 1, (Math.random() - 0.5) * 40],
            },
          ])
        }, 30000) // 30 seconds respawn
      }
    })

    // Check player collision with weapon pickups
    weaponPickups.forEach((weapon, index) => {
      const playerPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z)
      const weaponPos = new THREE.Vector3(...weapon.position)
      const distance = weaponPos.distanceTo(playerPos)

      if (distance < 2) {
        // Pickup radius
        // Add weapon to inventory
        setInventory((prev) => ({
          ...prev,
          [weapon.type]: {
            ammo: weapons[weapon.type].ammo,
            maxAmmo: weapons[weapon.type].maxAmmo,
          },
        }))

        // Switch to new weapon
        setActiveWeapon(weapon.type)

        sounds.pickup.play()
        addNotification(`Picked up ${weapons[weapon.type].name}`, "success")

        // Remove weapon pickup
        setWeaponPickups((prev) => prev.filter((_, i) => i !== index))
      }
    })

    // Check for game over
    if (health <= 0) {
      setGameState("gameOver")
      addNotification("You died!", "error")
    }

    // Check for level complete
    if (score >= level.targetScore) {
      setGameState("levelComplete")
    }
  })

  return (
    <>
      {gameState === "playing" && (
        <PointerLockControls
          ref={controls}
          onLock={() => setControlsLocked(true)}
          onUnlock={() => setControlsLocked(false)}
        />
      )}

      {/* Level environment */}
      <Environment level={level} />

      {/* Local player */}
      <Player position={playerPosition} playerId={playerId} playerName={playerName} isLocalPlayer={true} />

      {/* Other players */}
      {Object.values(players).map((player) => {
        if (player.id === playerId) return null
        return (
          <Player
            key={player.id}
            position={player.position || [Math.random() * 10 - 5, 1.6, Math.random() * 10 - 5]}
            rotation={player.rotation || [0, 0, 0]}
            playerId={player.id}
            playerName={player.name}
            health={player.health}
            isLocalPlayer={false}
          />
        )
      })}

      {/* Gun model */}
      {inventory[activeWeapon] && controlsLocked && <Weapon type={activeWeapon} />}

      {/* Bullets - both local and from other players */}
      {bullets.map((bullet) => (
        <Bullet key={bullet.id} position={bullet.position} />
      ))}

      {otherPlayerBullets.map((bullet) => (
        <Bullet key={bullet.id} position={bullet.position} />
      ))}

      {/* Enemies */}
      {enemies.map((enemy) => {
        if (enemy.health <= 0) return null
        return <Enemy key={enemy.id} enemy={enemy} />
      })}

      {/* Power-ups */}
      {powerUpItems.map((powerUp) => (
        <PowerUp key={powerUp.id} type={powerUp.type} position={powerUp.position} />
      ))}

      {/* Weapon pickups */}
      {weaponPickups.map((weapon) => (
        <Weapon key={weapon.id} type={weapon.type} position={weapon.position} isPickup={true} />
      ))}
    </>
  )
}

