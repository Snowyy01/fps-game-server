"use client"

import { useRef, useState, useEffect, Suspense, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { Sky, Environment } from "@react-three/drei"
import { Physics } from "@react-three/cannon"
import { io, Socket } from "socket.io-client"

import Game from "./components/game"
import GameUI from "./components/ui"
import { levels } from "./data/constants"

// Quick test to verify the server URL is correct
useEffect(() => {
  console.log("Server URL:", process.env.NEXT_PUBLIC_SOCKET_SERVER);
  // Connect to the server
  const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER || "http://localhost:3001", {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
  
  newSocket.on("connect", () => {
    console.log("Connected to server");
    setIsConnected(true);
    setPlayerId(newSocket.id);
  });
  
  newSocket.on("connect_error", (error) => {
    console.error("Connection error:", error);
    setIsConnected(false);
  });
  
  Socket(newSocket);
  
  return () => {
    newSocket.disconnect();
  };
}, []);

// Sound effects (dummy implementation that doesn't actually play sounds)
const sounds = {
  shoot: { play: () => {} },
  reload: { play: () => {} },
  hit: { play: () => {} },
  pickup: { play: () => {} },
  jump: { play: () => {} },
  enemyDeath: { play: () => {} },
  playerDamage: { play: () => {} },
  playerHit: { play: () => {} },
  music: {
    play: () => {},
    pause: () => {},
    stop: () => {},
  },
  levelComplete: { play: () => {} },
}

export default function FPSGame() {
  // Game state management
  const [gameState, setGameState] = useState("menu") // menu, playing, paused, gameOver, levelComplete
  const [currentLevel, setCurrentLevel] = useState(0)
  const [score, setScore] = useState(0)
  const [health, setHealth] = useState(100)
  const [shield, setShield] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(levels[0].timeLimit)
  const [notifications, setNotifications] = useState([])
  const [activeWeapon, setActiveWeapon] = useState("pistol")
  const [inventory, setInventory] = useState({
    pistol: { ammo: 12, maxAmmo: 12 },
    shotgun: null,
    rifle: null,
  })
  const canvasRef = useRef(null)
  const [controlsLocked, setControlsLocked] = useState(false)

  // Player state
  const [playerName, setPlayerName] = useState("")
  const [playerId, setPlayerId] = useState("")
  const [players, setPlayers] = useState({})
  const [isHost, setIsHost] = useState(false)

  // Socket connection
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Add notification
  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 3000)
  }, [])

  // Initialize socket connection
  useEffect(() => {
    // Connect to the server
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER || "http://localhost:3001")

    newSocket.on("connect", () => {
      console.log("Connected to server")
      setIsConnected(true)
      setPlayerId(newSocket.id)
    })

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server")
      setIsConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  // Handle socket events
  useEffect(() => {
    if (!socket) return

    // Receive game state when joining
    socket.on("game_state", (data) => {
      setPlayers(data.players)
      setCurrentLevel(data.gameState.currentLevel)
      setScore(data.gameState.score)
      setIsHost(data.players[data.yourId].isHost)
    })

    // Handle player joining
    socket.on("player_joined", (data) => {
      setPlayers((prev) => ({
        ...prev,
        [data.id]: data.player,
      }))
      addNotification(`${data.player.name} joined the game`, "info")
    })

    // Handle player leaving
    socket.on("player_left", (data) => {
      setPlayers((prev) => {
        const newPlayers = { ...prev }
        if (newPlayers[data.id]) {
          addNotification(`${newPlayers[data.id].name} left the game`, "info")
          delete newPlayers[data.id]
        }
        return newPlayers
      })
    })

    // Handle new host assignment
    socket.on("new_host", (data) => {
      if (data.id === playerId) {
        setIsHost(true)
        addNotification("You are now the host", "success")
      }

      setPlayers((prev) => ({
        ...prev,
        [data.id]: {
          ...prev[data.id],
          isHost: true,
        },
      }))
    })

    // Handle player hit
    socket.on("player_was_hit", (data) => {
      if (data.targetId === playerId) {
        setHealth(data.health)
        setShield(data.shield)
        sounds.playerDamage.play()
        addNotification(`You were hit by ${players[data.attackerId]?.name || "another player"}!`, "error")
      } else {
        // Update other player's health in our local state
        setPlayers((prev) => ({
          ...prev,
          [data.targetId]: {
            ...prev[data.targetId],
            health: data.health,
            shield: data.shield,
          },
        }))

        if (data.attackerId === playerId) {
          sounds.playerHit.play()
          addNotification(`You hit ${players[data.targetId]?.name || "another player"}!`, "success")
        }
      }
    })

    // Handle player death
    socket.on("player_died", (data) => {
      if (data.targetId === playerId) {
        addNotification("You were eliminated!", "error")
      } else if (data.attackerId === playerId) {
        addNotification(`You eliminated ${players[data.targetId]?.name || "another player"}!`, "success")
        setScore((prev) => prev + 50) // Award points for player elimination
      } else {
        addNotification(
          `${players[data.targetId]?.name || "A player"} was eliminated by ${players[data.attackerId]?.name || "another player"}`,
          "info",
        )
      }
    })

    // Handle player respawn
    socket.on("player_respawned", (data) => {
      if (data.id === playerId) {
        setHealth(data.health)
        setShield(data.shield)
        addNotification("You respawned", "info")
      } else {
        setPlayers((prev) => ({
          ...prev,
          [data.id]: {
            ...prev[data.id],
            health: data.health,
            shield: data.shield,
            position: data.position,
          },
        }))
      }
    })

    // Handle level change
    socket.on("level_changed", (data) => {
      setCurrentLevel(data.level)
      setTimeRemaining(levels[data.level].timeLimit)
      addNotification(`Level changed to ${levels[data.level].name}`, "info")
    })

    // Handle game reset
    socket.on("game_reset", (data) => {
      setPlayers(data.players)
      setScore(data.gameState.score)
      setHealth(100)
      setShield(0)
      addNotification("Game has been reset", "info")
    })

    return () => {
      socket.off("game_state")
      socket.off("player_joined")
      socket.off("player_left")
      socket.off("new_host")
      socket.off("player_was_hit")
      socket.off("player_died")
      socket.off("player_respawned")
      socket.off("level_changed")
      socket.off("game_reset")
    }
  }, [socket, playerId, players, addNotification])

  // Timer for level time limit
  useEffect(() => {
    let timer
    if (gameState === "playing" && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setGameState("gameOver")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [gameState, timeRemaining])

  // Join the game
  const joinGame = () => {
    if (!playerName || !socket || !isConnected) {
      addNotification("Please enter a player name and ensure connection to server", "error")
      return
    }

    // Join the game via socket
    socket.emit("join_game", {
      name: playerName,
    })

    setGameState("playing")
    addNotification(`Welcome to the game, ${playerName}!`, "success")
  }

  // Change level (host only)
  const changeLevel = (level) => {
    if (!isHost || !socket) return

    socket.emit("change_level", { level })
  }

  // Reset game (host only)
  const resetGame = () => {
    if (!isHost || !socket) return

    socket.emit("reset_game")
  }

  // Handle player position updates
  const updatePlayerPosition = (position, rotation) => {
    if (!socket || !isConnected || gameState !== "playing") return

    socket.emit("player_move", {
      position,
      rotation,
    })
  }

  // Handle player shooting
  const playerShoot = (position, direction, weapon) => {
    if (!socket || !isConnected || gameState !== "playing") return

    socket.emit("player_shoot", {
      position,
      direction,
      weapon,
    })
  }

  // Handle player hit
  const playerHit = (targetId, damage) => {
    if (!socket || !isConnected || gameState !== "playing") return

    socket.emit("player_hit", {
      targetId,
      damage,
    })
  }

  // Handle click on canvas to lock pointer
  const handleCanvasClick = () => {
    if (gameState === "playing" && canvasRef.current) {
      // Request pointer lock
      const canvas = canvasRef.current
      canvas.requestPointerLock =
        canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock
      canvas.requestPointerLock()
    }
  }

  return (
    <div className="relative w-full h-screen">
      {/* Game UI components */}
      <GameUI
        gameState={gameState}
        setGameState={setGameState}
        playerName={playerName}
        setPlayerName={setPlayerName}
        joinGame={joinGame}
        players={players}
        isHost={isHost}
        isConnected={isConnected}
        health={health}
        shield={shield}
        score={score}
        currentLevel={currentLevel}
        timeRemaining={timeRemaining}
        notifications={notifications}
        inventory={inventory}
        activeWeapon={activeWeapon}
        setActiveWeapon={setActiveWeapon}
        controlsLocked={controlsLocked}
        handleCanvasClick={handleCanvasClick}
        changeLevel={changeLevel}
        resetGame={resetGame}
      />

      {/* Game Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-screen"
        onClick={handleCanvasClick}
        tabIndex={0} // Make it focusable
      >
        <Canvas shadows camera={{ fov: 75, position: [0, 1.6, 5] }}>
          <Suspense fallback={null}>
            <Physics gravity={[0, -9.8, 0]}>
              <Game
                gameState={gameState}
                setGameState={setGameState}
                currentLevel={currentLevel}
                score={score}
                setScore={setScore}
                health={health}
                setHealth={setHealth}
                shield={shield}
                setShield={setShield}
                addNotification={addNotification}
                activeWeapon={activeWeapon}
                setActiveWeapon={setActiveWeapon}
                inventory={inventory}
                setInventory={setInventory}
                controlsLocked={controlsLocked}
                setControlsLocked={setControlsLocked}
                players={players}
                playerId={playerId}
                playerName={playerName}
                updatePlayerPosition={updatePlayerPosition}
                playerShoot={playerShoot}
                playerHit={playerHit}
              />
            </Physics>
            <Sky sunPosition={[100, 10, 100]} />
            <Environment preset="sunset" />
            <ambientLight intensity={0.3} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}

function setIsConnected(arg0: boolean) {
  throw new Error("Function not implemented.")
}

function setPlayerId(id: any) {
  throw new Error("Function not implemented.")
}

