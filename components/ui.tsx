"use client"
import { formatTime } from "../utils/helpers"

export default function GameUI({
  gameState,
  setGameState,
  playerName,
  setPlayerName,
  joinGame,
  players,
  isHost,
  isConnected,
  health,
  shield,
  score,
  currentLevel,
  timeRemaining,
  notifications,
  inventory,
  activeWeapon,
  setActiveWeapon,
  controlsLocked,
  handleCanvasClick,
  changeLevel,
  resetGame,
}) {
  return (
    <>
      {/* Main Menu */}
      {gameState === "menu" && (
        <MainMenu playerName={playerName} setPlayerName={setPlayerName} joinGame={joinGame} isConnected={isConnected} />
      )}

      {/* HUD during gameplay */}
      {gameState === "playing" && (
        <GameplayHUD
          health={health}
          shield={shield}
          score={score}
          currentLevel={currentLevel}
          timeRemaining={timeRemaining}
          notifications={notifications}
          inventory={inventory}
          activeWeapon={activeWeapon}
          setActiveWeapon={setActiveWeapon}
          players={players}
          controlsLocked={controlsLocked}
          handleCanvasClick={handleCanvasClick}
        />
      )}

      {/* Pause Menu */}
      {gameState === "paused" && <PauseMenu setGameState={setGameState} isHost={isHost} resetGame={resetGame} />}

      {/* Level Complete */}
      {gameState === "levelComplete" && (
        <LevelComplete score={score} currentLevel={currentLevel} isHost={isHost} changeLevel={changeLevel} />
      )}

      {/* Game Over */}
      {gameState === "gameOver" && <GameOver score={score} setGameState={setGameState} />}
    </>
  )
}

function MainMenu({ playerName, setPlayerName, joinGame, isConnected }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
      <h1 className="text-5xl font-bold text-white mb-8">CYBER ASSAULT</h1>
      <p className="text-xl text-gray-300 mb-8 max-w-md text-center">
        Join the multiplayer arena and battle against other players!
      </p>

      <div className="bg-gray-800 p-6 rounded-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Join The Battle</h2>

        <div className="mb-6">
          <label htmlFor="playerName" className="block text-gray-300 mb-2">
            Your Name:
          </label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your player name"
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {!isConnected && (
          <div className="mb-4 p-3 bg-red-900/50 rounded-md text-red-200 text-sm">
            Connecting to server... Please wait.
          </div>
        )}

        <button
          onClick={joinGame}
          className={`w-full px-6 py-3 ${
            !playerName || !isConnected ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          } text-white font-bold rounded-md transition-colors`}
          disabled={!playerName || !isConnected}
        >
          Join Game
        </button>
      </div>
    </div>
  )
}

function GameplayHUD({
  health,
  shield,
  score,
  currentLevel,
  timeRemaining,
  notifications,
  inventory,
  activeWeapon,
  setActiveWeapon,
  players,
  controlsLocked,
  handleCanvasClick,
}) {
  return (
    <>
      {/* HUD */}
      <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-4 py-2 rounded-md flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span>Score: {score}</span>
          <span className="ml-4">Level: {currentLevel + 1}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span>Health: </span>
            <div className="w-32 h-4 bg-gray-700 ml-2 rounded-sm overflow-hidden">
              <div className="h-full bg-red-600" style={{ width: `${Math.max(0, Math.min(health, 100))}%` }} />
            </div>
          </div>
          <span className="ml-2">{health}</span>
        </div>
        {shield > 0 && (
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span>Shield: </span>
              <div className="w-32 h-4 bg-gray-700 ml-2 rounded-sm overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.max(0, Math.min(shield, 100))}%` }} />
              </div>
            </div>
            <span className="ml-2">{shield}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span>Time: {formatTime(timeRemaining)}</span>
        </div>

        <div className="text-xs mt-1 pt-1 border-t border-gray-600">
          <span>Players Online: {Object.keys(players).length}</span>
        </div>
      </div>

      {/* Player list */}
      <div className="absolute top-4 right-4 z-10 bg-black/50 text-white px-4 py-2 rounded-md max-w-xs">
        <h3 className="text-sm font-bold mb-1">Players</h3>
        <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
          {Object.values(players).map((player) => (
            <li key={player.id} className="flex justify-between">
              <span>
                {player.name} {player.isHost ? "(Host)" : ""}
              </span>
              <span className={player.health > 30 ? "text-green-400" : "text-red-400"}>{player.health}/100</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Weapon info */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/50 text-white px-4 py-2 rounded-md">
        <div className="flex justify-between items-center">
          <span>{inventory[activeWeapon]?.name || "No weapon"}</span>
          <span className="ml-4">
            {inventory[activeWeapon]?.ammo || 0}/{inventory[activeWeapon]?.maxAmmo || 0}
          </span>
        </div>
      </div>

      {/* Weapon selection */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/50 text-white px-4 py-2 rounded-md">
        <div className="flex gap-2">
          {Object.keys(inventory).map(
            (weapon) =>
              inventory[weapon] && (
                <button
                  key={weapon}
                  onClick={() => setActiveWeapon(weapon)}
                  className={`px-3 py-1 rounded ${activeWeapon === weapon ? "bg-red-600" : "bg-gray-700"}`}
                >
                  {weapon.charAt(0).toUpperCase() + weapon.slice(1)}
                </button>
              ),
          )}
        </div>
      </div>

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div className="w-4 h-4">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="8" fill="none" stroke="white" strokeWidth="2" />
            <line x1="25" y1="50" x2="75" y2="50" stroke="white" strokeWidth="2" />
            <line x1="50" y1="25" x2="50" y2="75" stroke="white" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Notifications */}
      <div className="absolute top-4 right-48 z-10 flex flex-col gap-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-2 rounded-md text-white ${
              notification.type === "success"
                ? "bg-green-600"
                : notification.type === "error"
                  ? "bg-red-600"
                  : "bg-blue-600"
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Click to play overlay - only shown when controls are not locked */}
      {!controlsLocked && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/70 z-20 cursor-pointer"
          onClick={handleCanvasClick}
        >
          <div className="bg-black/80 p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Click to Play</h2>
            <p className="text-gray-300">Click anywhere to start the game and enable mouse controls.</p>
            <p className="text-gray-400 mt-4 text-sm">
              Controls: WASD to move, Mouse to look, Left Click to shoot, R to reload, 1-3 for weapons, ESC to pause
            </p>
          </div>
        </div>
      )}
    </>
  )
}

function PauseMenu({ setGameState, isHost, resetGame }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
      <h2 className="text-4xl font-bold text-white mb-8">PAUSED</h2>
      <div className="flex flex-col gap-4">
        <button
          onClick={() => {
            setGameState("playing")
            setTimeout(() => {
              if (document.exitPointerLock) {
                document.exitPointerLock()
              }
            }, 100)
          }}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors"
        >
          Resume
        </button>

        {isHost && (
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-yellow-600 text-white font-bold rounded-md hover:bg-yellow-700 transition-colors"
          >
            Reset Game
          </button>
        )}

        <button
          onClick={() => setGameState("menu")}
          className="px-6 py-3 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition-colors"
        >
          Quit
        </button>
      </div>
    </div>
  )
}

function LevelComplete({ score, currentLevel, isHost, changeLevel }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
      <h2 className="text-4xl font-bold text-white mb-4">LEVEL COMPLETE!</h2>
      <p className="text-xl text-gray-300 mb-8">Score: {score}</p>

      {isHost ? (
        <button
          onClick={() => changeLevel(currentLevel + 1)}
          className="px-6 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors"
        >
          Next Level
        </button>
      ) : (
        <p className="text-gray-300">Waiting for host to start next level...</p>
      )}
    </div>
  )
}

function GameOver({ score, setGameState }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
      <h2 className="text-4xl font-bold text-white mb-4">GAME OVER</h2>
      <p className="text-xl text-gray-300 mb-8">Final Score: {score}</p>
      <button
        onClick={() => setGameState("menu")}
        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors"
      >
        Main Menu
      </button>
    </div>
  )
}

