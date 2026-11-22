// The heist simulation: state, movement, collision, vision cones, alarm, loot.
// One file, one job: given inputs, advance the world one fixed step at a time.

import { ALARM, CAMERA, COLS, EMP, GUARD, LOOT, LIVES, PLAYER, ROWS, STEP, TILE } from './config.js';
import { LEVELS } from './levels.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_CAUGHT = 2;
export const EVENT_ESCAPED = 4;
export const EVENT_EMP = 8;
export const EVENT_ALARM = 16;

function tileAt(level, col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return '#';
  return level.map[row][col];
}

export function isWall(level, col, row) {
  return tileAt(level, col, row) === '#';
}

/** True when the circle at (x, y) with radius r overlaps any wall tile. */
export function hitsWall(level, x, y, r) {
  const c0 = Math.floor((x - r) / TILE);
  const c1 = Math.floor((x + r) / TILE);
  const r0 = Math.floor((y - r) / TILE);
  const r1 = Math.floor((y + r) / TILE);
  for (let row = r0; row <= r1; row += 1) {
    for (let col = c0; col <= c1; col += 1) {
      if (!isWall(level, col, row)) continue;
      const wx = Math.max(col * TILE, Math.min(x, (col + 1) * TILE));
      const wy = Math.max(row * TILE, Math.min(y, (row + 1) * TILE));
      const dx = x - wx;
      const dy = y - wy;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  return false;
}

/** Move a circle with wall sliding: try x, then y, keeping each axis that fits. */
function moveCircle(level, body, dx, dy) {
  const nx = body.x + dx;
  if (!hitsWall(level, nx, body.y, body.radius)) body.x = nx;
  const ny = body.y + dy;
  if (!hitsWall(level, body.x, ny, body.radius)) body.y = ny;
}

/** Line of sight between two points, sampled so walls block vision. */
export function hasLineOfSight(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const col = Math.floor((x0 + dx * t) / TILE);
    const row = Math.floor((y0 + dy * t) / TILE);
    if (isWall(level, col, row)) return false;
  }
  return true;
}

function angleTo(x0, y0, x1, y1) {
  return Math.atan2(y1 - y0, x1 - x0);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Is the thief inside this cone (range, half-angle, line of sight)? */
export function inCone(level, ox, oy, facing, range, halfAngle, tx, ty, spotFactor) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range * spotFactor + 26) return false;
  if (Math.abs(angleDiff(angleTo(ox, oy, tx, ty), facing)) > halfAngle) return false;
  return hasLineOfSight(level, ox, oy, tx, ty);
}

function parseLevel(def) {
  const walls = [];
  const loot = [];
  let start = { x: TILE * 1.5, y: TILE * 1.5 };
  let exit = { x: TILE * 8.5, y: TILE * 11.5 };
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const ch = def.map[row][col];
      const cx = col * TILE + TILE / 2;
      const cy = row * TILE + TILE / 2;
      if (ch === '#') walls.push({ col, row });
      else if (ch === 'S') start = { x: cx, y: cy };
      else if (ch === 'E') exit = { x: cx, y: cy };
      else if (ch === 'D') loot.push({ kind: 'gem', x: cx, y: cy, taken: false, channel: 0 });
      else if (ch === 'P') loot.push({ kind: 'painting', x: cx, y: cy, taken: false, channel: 0 });
      else if (ch === 'C') loot.push({ kind: 'crown', x: cx, y: cy, taken: false, channel: 0 });
    }
  }
  return { walls, loot, start, exit };
}

function makeGuards(def) {
  return def.guards.map((g) => {
    const [c0, r0] = g.waypoints[0];
    return {
      waypoints: g.waypoints.map(([c, r]) => ({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 })),
      index: 0,
      x: c0 * TILE + TILE / 2,
      y: r0 * TILE + TILE / 2,
      radius: GUARD.radius,
      facing: 0,
      frozen: 0,
      chasing: false,
    };
  });
}

function makeCameras(def) {
  return def.cameras.map((c) => ({
    x: c.tile[0] * TILE + TILE / 2,
    y: c.tile[1] * TILE + TILE / 2,
    baseAngle: c.angle,
    angle: c.angle,
    phase: Math.random() * Math.PI * 2,
    disabled: 0,
  }));
}

export function createWorld() {
  return {
    levelIndex: 0,
    level: LEVELS[0],
    parsed: null,
    guards: [],
    cameras: [],
    player: { x: 0, y: 0, radius: PLAYER.radius, facing: 0 },
    lootTaken: 0,
    lootValue: 0,
    alarm: 0,
    empCharges: EMP.chargesPerLevel,
    empFlash: 0,
    lives: LIVES,
    score: 0,
    timeSeconds: 0,
    screen: SCREEN_TITLE,
    best: 0,
    message: '',
    messageTime: 0,
    channelTarget: null,
    caughtFlash: 0,
  };
}

export function loadLevel(world, index) {
  const def = LEVELS[index];
  world.levelIndex = index;
  world.level = def;
  world.parsed = parseLevel(def);
  world.guards = makeGuards(def);
  world.cameras = makeCameras(def);
  world.player.x = world.parsed.start.x;
  world.player.y = world.parsed.start.y;
  world.player.facing = 0;
  world.lootTaken = 0;
  world.lootValue = 0;
  world.alarm = 0;
  world.empCharges = EMP.chargesPerLevel;
  world.empFlash = 0;
  world.channelTarget = null;
  world.message = '';
  world.messageTime = 0;
}

export function resetGame(world) {
  world.score = 0;
  world.timeSeconds = 0;
  world.lives = LIVES;
  loadLevel(world, 0);
  world.screen = SCREEN_TITLE;
}

export function levelTotalLoot(def) {
  return def.map.join('').split('').reduce((sum, ch) => {
    if (ch === 'D') return sum + LOOT.gem.value;
    if (ch === 'P') return sum + LOOT.painting.value;
    if (ch === 'C') return sum + LOOT.crown.value;
    return sum;
  }, 0);
}

function nearestLoot(world) {
  let bestItem = null;
  let bestDist = Infinity;
  for (const item of world.parsed.loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - world.player.x, item.y - world.player.y);
    if (d < bestDist) {
      bestDist = d;
      bestItem = item;
    }
  }
  return { item: bestItem, dist: bestDist };
}

function useEmp(world) {
  if (world.empCharges <= 0 || world.screen !== SCREEN_PLAY) return EVENT_NONE;
  world.empCharges -= 1;
  for (const cam of world.cameras) cam.disabled = EMP.cameraDisableSeconds;
  for (const guard of world.guards) guard.frozen = EMP.guardFreezeSeconds;
  world.empFlash = 0.6;
  world.message = 'EMP burst — cameras down!';
  world.messageTime = 2;
  return EVENT_EMP;
}

/**
 * Advance the world one fixed step. `input` carries the held keys, a click
 * target, sneak and an emp request. Returns an event bitmask for sounds.
 */
export function stepWorld(world, input, dt) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  let events = EVENT_NONE;
  world.timeSeconds += dt;
  if (world.messageTime > 0) world.messageTime -= dt;
  if (world.empFlash > 0) world.empFlash -= dt;
  if (world.caughtFlash > 0) world.caughtFlash -= dt;

  if (input.emp) events |= useEmp(world);

  // --- player movement: keys win over a click target ---
  const p = world.player;
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx === 0 && my === 0 && input.target) {
    const dx = input.target.x - p.x;
    const dy = input.target.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 6) {
      mx = dx / d;
      my = dy / d;
    } else {
      input.target = null;
    }
  }
  const moving = mx !== 0 || my !== 0;
  if (moving) {
    const len = Math.hypot(mx, my) || 1;
    const speed = input.sneak ? PLAYER.sneakSpeed : PLAYER.speed;
    p.facing = Math.atan2(my / len, mx / len);
    moveCircle(world.level, p, (mx / len) * speed * dt, (my / len) * speed * dt);
  }

  // --- loot: walk over gems, stand by paintings and the crown to crack them ---
  const { item, dist } = nearestLoot(world);
  const channelSeconds = item ? LOOT[item.kind].channelSeconds : 0;
  if (item && dist < TILE * 0.85) {
    if (channelSeconds === 0) {
      item.taken = true;
      world.lootTaken += 1;
      world.lootValue += LOOT[item.kind].value;
      world.score += LOOT[item.kind].value;
      world.message = `+ $${LOOT[item.kind].value} ${LOOT[item.kind].label}`;
      world.messageTime = 1.4;
      events |= EVENT_PICKUP;
    } else if (world.channelTarget === item) {
      item.channel += dt;
      if (item.channel >= channelSeconds) {
        item.taken = true;
        world.lootTaken += 1;
        world.lootValue += LOOT[item.kind].value;
        world.score += LOOT[item.kind].value;
        world.message = `+ $${LOOT[item.kind].value} ${LOOT[item.kind].label}`;
        world.messageTime = 1.4;
        world.channelTarget = null;
        events |= EVENT_PICKUP;
      }
    } else {
      world.channelTarget = item;
      item.channel = 0;
    }
  } else if (world.channelTarget && (!item || world.channelTarget !== item)) {
    world.channelTarget.channel = 0;
    world.channelTarget = null;
  }

  // --- guards patrol, or chase when the alarm is already climbing ---
  const spotFactor = input.sneak ? PLAYER.sneakSpotFactor : 1;
  let seenByGuard = false;
  let seenByCamera = false;
  for (const guard of world.guards) {
    if (guard.frozen > 0) {
      guard.frozen -= dt;
      guard.chasing = false;
    } else if (world.alarm >= GUARD.chaseAlarm && hasLineOfSight(world.level, guard.x, guard.y, p.x, p.y)) {
      guard.chasing = true;
      const d = Math.hypot(p.x - guard.x, p.y - guard.y);
      if (d > 4) {
        guard.facing = angleTo(guard.x, guard.y, p.x, p.y);
        moveCircle(world.level, guard, Math.cos(guard.facing) * GUARD.chaseSpeed * dt, Math.sin(guard.facing) * GUARD.chaseSpeed * dt);
      }
    } else {
      guard.chasing = false;
      const target = guard.waypoints[guard.index];
      const dx = target.x - guard.x;
      const dy = target.y - guard.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) {
        guard.index = (guard.index + 1) % guard.waypoints.length;
      } else {
        guard.facing = Math.atan2(dy, dx);
        moveCircle(world.level, guard, (dx / d) * GUARD.patrolSpeed * dt, (dy / d) * GUARD.patrolSpeed * dt);
      }
    }
    if (guard.frozen <= 0 && inCone(world.level, guard.x, guard.y, guard.facing, GUARD.coneRange, GUARD.coneHalfAngle, p.x, p.y, spotFactor)) {
      seenByGuard = true;
    }
    // A guard that bumps into the thief catches them on the spot.
    if (Math.hypot(p.x - guard.x, p.y - guard.y) < p.radius + guard.radius - 2) {
      world.alarm = ALARM.max;
    }
  }

  // --- cameras sweep; an EMP holds them dark ---
  for (const cam of world.cameras) {
    if (cam.disabled > 0) {
      cam.disabled -= dt;
      continue;
    }
    cam.phase += dt * CAMERA.sweepSpeed;
    cam.angle = cam.baseAngle + Math.sin(cam.phase) * CAMERA.sweepAmplitude;
    if (inCone(world.level, cam.x, cam.y, cam.angle, CAMERA.range, CAMERA.coneHalfAngle, p.x, p.y, spotFactor)) {
      seenByCamera = true;
    }
  }

  // --- the alarm climbs while seen, drains while hidden ---
  const before = world.alarm;
  if (seenByGuard) world.alarm += ALARM.guardRate * dt;
  else if (seenByCamera) world.alarm += ALARM.cameraRate * dt;
  else world.alarm -= ALARM.decayRate * dt;
  world.alarm = Math.max(0, Math.min(ALARM.max, world.alarm));
  if (before < 50 && world.alarm >= 50) events |= EVENT_ALARM;

  if (world.alarm >= ALARM.max) {
    world.lives -= 1;
    world.caughtFlash = 0.8;
    if (world.lives <= 0) {
      world.screen = SCREEN_OVER;
      world.best = Math.max(world.best, world.score);
    } else {
      world.screen = SCREEN_CAUGHT;
    }
    return events | EVENT_CAUGHT;
  }

  // --- the exit opens once enough loot is bagged ---
  const exitOpen = world.lootValue >= world.level.requiredLoot;
  const exit = world.parsed.exit;
  if (exitOpen && Math.hypot(p.x - exit.x, p.y - exit.y) < TILE * 0.6) {
    const timeBonus = Math.max(0, Math.round(1200 - world.timeSeconds * 4));
    world.score += timeBonus;
    if (world.levelIndex + 1 >= LEVELS.length) {
      world.screen = SCREEN_WIN;
      world.best = Math.max(world.best, world.score);
    } else {
      loadLevel(world, world.levelIndex + 1);
      world.message = `${world.level.name} — get $${world.level.requiredLoot.toLocaleString()} and get out`;
      world.messageTime = 3;
    }
    return events | EVENT_ESCAPED;
  }
  return events;
}

export { STEP };
