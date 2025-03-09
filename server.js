const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Add a basic route handler for the root path
app.get('/', (req, res) => {
  res.send('FPS Game Server is running!');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Game state
const players = {};
const gameState = {
  enemies: [],
  powerUps: [],
  weaponPickups: [],
  currentLevel: 0,
  score: 0
};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle player joining
  socket.on('join_game', (playerData) => {
    console.log(`Player joined: ${playerData.name}`);
    
    // Add player to the game
    players[socket.id] = {
      id: socket.id,
      name: playerData.name,
      position: [0, 1.6, 0],
      rotation: [0, 0, 0],
      health: 100,
      shield: 0,
      weapon: 'pistol',
      score: 0,
      isHost: Object.keys(players).length === 0 // First player is host
    };

    // Send current game state to the new player
    socket.emit('game_state', {
      players,
      gameState,
      yourId: socket.id
    });

    // Notify all players about the new player
    io.emit('player_joined', { 
      id: socket.id, 
      player: players[socket.id] 
    });
  });

  // Handle player movement
  socket.on('player_move', (data) => {
    if (players[socket.id]) {
      players[socket.id].position = data.position;
      players[socket.id].rotation = data.rotation;
      
      // Broadcast player position to all other players
      socket.broadcast.emit('player_moved', {
        id: socket.id,
        position: data.position,
        rotation: data.rotation
      });
    }
  });

  // Handle player shooting
  socket.on('player_shoot', (data) => {
    if (players[socket.id]) {
      // Broadcast shooting event to all other players
      socket.broadcast.emit('player_shot', {
        id: socket.id,
        position: data.position,
        direction: data.direction,
        weapon: data.weapon
      });
    }
  });

  // Handle player hit
  socket.on('player_hit', (data) => {
    if (players[data.targetId]) {
      const damage = data.damage || 10;
      
      // Apply damage to the target player
      if (players[data.targetId].shield > 0) {
        const remainingDamage = Math.max(0, damage - players[data.targetId].shield);
        players[data.targetId].shield = Math.max(0, players[data.targetId].shield - damage);
        
        if (remainingDamage > 0) {
          players[data.targetId].health = Math.max(0, players[data.targetId].health - remainingDamage);
        }
      } else {
        players[data.targetId].health = Math.max(0, players[data.targetId].health - damage);
      }

      // Notify all players about the hit
      io.emit('player_was_hit', {
        targetId: data.targetId,
        attackerId: socket.id,
        damage: damage,
        health: players[data.targetId].health,
        shield: players[data.targetId].shield
      });

      // Check if player died
      if (players[data.targetId].health <= 0) {
        io.emit('player_died', {
          targetId: data.targetId,
          attackerId: socket.id
        });
        
        // Respawn player after 5 seconds
        setTimeout(() => {
          if (players[data.targetId]) {
            players[data.targetId].health = 100;
            players[data.targetId].shield = 0;
            players[data.targetId].position = [
              (Math.random() - 0.5) * 40,
              1.6,
              (Math.random() - 0.5) * 40
            ];
            
            io.emit('player_respawned', {
              id: data.targetId,
              position: players[data.targetId].position,
              health: 100,
              shield: 0
            });
          }
        }, 5000);
      }
    }
  });

  // Handle player disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Remove player from the game
    if (players[socket.id]) {
      const wasHost = players[socket.id].isHost;
      delete players[socket.id];
      
      // Notify all players about the disconnection
      io.emit('player_left', { id: socket.id });
      
      // If the host left, assign a new host
      if (wasHost && Object.keys(players).length > 0) {
        const newHostId = Object.keys(players)[0];
        players[newHostId].isHost = true;
        io.emit('new_host', { id: newHostId });
      }
    }
  });

  // Host can change level
  socket.on('change_level', (data) => {
    if (players[socket.id] && players[socket.id].isHost) {
      gameState.currentLevel = data.level;
      io.emit('level_changed', { level: data.level });
    }
  });

  // Host can reset game
  socket.on('reset_game', () => {
    if (players[socket.id] && players[socket.id].isHost) {
      gameState.score = 0;
      
      // Reset all players
      Object.keys(players).forEach(id => {
        players[id].health = 100;
        players[id].shield = 0;
        players[id].score = 0;
        players[id].position = [
          (Math.random() - 0.5) * 10,
          1.6,
          (Math.random() - 0.5) * 10
        ];
      });
      
      io.emit('game_reset', { players, gameState });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});