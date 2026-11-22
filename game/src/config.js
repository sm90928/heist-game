// Shared tuning and palette for The Midnight Gallery, a top-down museum heist.
// One file, one job: every number the rest of the game agrees on lives here.

export const TILE = 48;
export const COLS = 20;
export const ROWS = 12;
export const HUD_HEIGHT = 64;
export const FIELD_WIDTH = COLS * TILE;
export const FIELD_HEIGHT = ROWS * TILE;
export const CANVAS_WIDTH = FIELD_WIDTH;
export const CANVAS_HEIGHT = HUD_HEIGHT + FIELD_HEIGHT;

export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  speed: 148,
  sneakSpeed: 82,
  // A sneaking thief is harder to spot: cones treat the thief as closer than
  // they are by this factor when the player holds sneak.
  sneakSpotFactor: 0.55,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  chaseSpeed: 105,
  coneRange: 175,
  coneHalfAngle: 0.56,
  // While the alarm is climbing a guard runs at the thief.
  chaseAlarm: 25,
};

export const CAMERA = {
  range: 205,
  coneHalfAngle: 0.5,
  sweepAmplitude: 0.9,
  sweepSpeed: 0.55,
};

export const ALARM = {
  guardRate: 45,
  cameraRate: 28,
  decayRate: 18,
  max: 100,
};

export const EMP = {
  chargesPerLevel: 2,
  cameraDisableSeconds: 8,
  guardFreezeSeconds: 3,
};

export const LOOT = {
  gem: { value: 400, channelSeconds: 0, label: 'Sapphire' },
  painting: { value: 900, channelSeconds: 0.8, label: 'Portrait' },
  crown: { value: 2000, channelSeconds: 1.5, label: 'Crown Jewels' },
};

export const LIVES = 3;

export const COLORS = {
  page: '#0b0e1a',
  floorA: '#232946',
  floorB: '#1d2240',
  floorEdge: '#2e3560',
  wall: '#12162b',
  wallTop: '#3a4270',
  rope: '#8c2f3d',
  ropePost: '#c9a227',
  gem: '#57c8ff',
  painting: '#f2c14e',
  crown: '#ffe066',
  player: '#e8e6df',
  playerCoat: '#1f6f5c',
  guard: '#c0392b',
  guardCone: 'rgba(255, 196, 66, 0.20)',
  guardConeEdge: 'rgba(255, 196, 66, 0.55)',
  cameraCone: 'rgba(255, 84, 84, 0.16)',
  cameraConeEdge: 'rgba(255, 84, 84, 0.5)',
  exit: '#2ecc71',
  exitLocked: '#5a6b7a',
  hud: '#0d1024',
  hudText: '#e8e6df',
  hudDim: '#9aa3c7',
  alarmLow: '#2ecc71',
  alarmMid: '#f2c14e',
  alarmHigh: '#e74c3c',
  title: '#ffe066',
};
