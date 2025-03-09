export const levels = [
    {
      name: "Training Grounds",
      description: "Learn the basics of combat",
      timeLimit: 180, // seconds
      targetScore: 100,
      enemies: [
        { type: "basic", count: 5 },
        { type: "fast", count: 2 },
      ],
      powerUps: [
        { type: "health", count: 3 },
        { type: "speed", count: 1 },
      ],
      weapons: ["pistol"],
      environment: "training",
    },
    {
      name: "Urban Assault",
      description: "Clear the city of hostiles",
      timeLimit: 240,
      targetScore: 200,
      enemies: [
        { type: "basic", count: 8 },
        { type: "fast", count: 5 },
        { type: "tank", count: 1 },
      ],
      powerUps: [
        { type: "health", count: 4 },
        { type: "speed", count: 2 },
        { type: "damage", count: 1 },
      ],
      weapons: ["pistol", "shotgun"],
      environment: "urban",
    },
    {
      name: "Warehouse Siege",
      description: "Survive the warehouse ambush",
      timeLimit: 300,
      targetScore: 350,
      enemies: [
        { type: "basic", count: 10 },
        { type: "fast", count: 8 },
        { type: "tank", count: 3 },
        { type: "flying", count: 2 },
      ],
      powerUps: [
        { type: "health", count: 5 },
        { type: "speed", count: 2 },
        { type: "damage", count: 2 },
        { type: "shield", count: 1 },
      ],
      weapons: ["pistol", "shotgun", "rifle"],
      environment: "warehouse",
    },
  ]
  
  export const weapons = {
    pistol: {
      name: "Pistol",
      damage: 10,
      fireRate: 400, // ms between shots
      ammo: 12,
      maxAmmo: 12,
      reloadTime: 1000,
      bulletSpeed: 30,
      model: "pistol",
      sound: "shoot",
      position: [0.3, -0.3, -0.5],
      scale: [0.15, 0.15, 0.15],
    },
    shotgun: {
      name: "Shotgun",
      damage: 25,
      fireRate: 800,
      ammo: 6,
      maxAmmo: 6,
      reloadTime: 2000,
      bulletSpeed: 25,
      bulletCount: 5, // shotgun fires multiple pellets
      bulletSpread: 0.1,
      model: "shotgun",
      sound: "shoot",
      position: [0.3, -0.25, -0.6],
      scale: [0.2, 0.2, 0.2],
    },
    rifle: {
      name: "Assault Rifle",
      damage: 15,
      fireRate: 100,
      ammo: 30,
      maxAmmo: 30,
      reloadTime: 1500,
      bulletSpeed: 40,
      model: "rifle",
      sound: "shoot",
      position: [0.3, -0.2, -0.7],
      scale: [0.18, 0.18, 0.18],
    },
  }
  
  export const powerUps = {
    health: {
      name: "Health Pack",
      effect: "health",
      value: 50,
      duration: 0,
      model: "healthPack",
      color: "#ff0000",
    },
    speed: {
      name: "Speed Boost",
      effect: "speed",
      value: 2,
      duration: 10000,
      model: "speedBoost",
      color: "#00ff00",
    },
    damage: {
      name: "Damage Boost",
      effect: "damage",
      value: 2,
      duration: 15000,
      model: "damageBoost",
      color: "#ff9900",
    },
    shield: {
      name: "Shield",
      effect: "shield",
      value: 100,
      duration: 20000,
      model: "shield",
      color: "#0099ff",
    },
  }
  
  export const enemyTypes = {
    basic: {
      health: 30,
      damage: 10,
      speed: 2,
      attackRange: 1.5,
      attackRate: 1000,
      model: "basicEnemy",
      color: "#ff0000",
      points: 10,
    },
    fast: {
      health: 15,
      damage: 5,
      speed: 4,
      attackRange: 1.2,
      attackRate: 800,
      model: "fastEnemy",
      color: "#00ff00",
      points: 15,
    },
    tank: {
      health: 100,
      damage: 20,
      speed: 1,
      attackRange: 2,
      attackRate: 2000,
      model: "tankEnemy",
      color: "#0000ff",
      points: 30,
    },
    flying: {
      health: 20,
      damage: 15,
      speed: 3,
      attackRange: 5,
      attackRate: 1500,
      model: "flyingEnemy",
      color: "#9900ff",
      points: 20,
      flying: true,
    },
  }
  
  export const sounds = {
    shoot: { play: () => {} },
    reload: { play: () => {} },
    hit: { play: () => {} },
    pickup: { play: () => {} },
    jump: { play: () => {} },
    enemyDeath: { play: () => {} },
    playerDamage: { play: () => {} },
    music: {
      play: () => {},
      pause: () => {},
      stop: () => {},
    },
    levelComplete: { play: () => {} },
  }
  
  