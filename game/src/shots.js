// The screenshot scenes behind ?shot=1|2|3|4. Each one stages a fixed tableau
// from the real rules — a real position, real cones, a real alarm value — and
// freezes the world, so the frame a headless browser captures is the same
// frame every time and is exactly what a player would see mid-heist.

import { TILE } from './config.js';
import { SCREEN_PLAY, SCREEN_TITLE, loadLevel } from './world.js';

function place(world, tileX, tileY) {
  return { x: tileX * TILE + TILE / 2, y: tileY * TILE + TILE / 2 };
}

function takeLoot(world, kind, count) {
  let taken = 0;
  for (const item of world.parsed.loot) {
    if (taken >= count) break;
    if (item.kind === kind && !item.taken) {
      item.taken = true;
      taken += 1;
    }
  }
  return taken;
}

/** Stage the named scene and return the screen to draw over it. */
export function stageShot(name, world) {
  loadLevel(world, 0);
  world.frozen = true;
  if (name === '2') {
    world.screen = SCREEN_TITLE;
    return SCREEN_TITLE;
  }
  if (name === '3') {
    // Spotted: the thief is inside a camera cone, the alarm is at 78% and a
    // guard is running them down.
    world.screen = SCREEN_PLAY;
    const spot = place(world, 15, 5);
    world.player.x = spot.x;
    world.player.y = spot.y;
    world.player.facing = Math.PI;
    world.alarm = 78;
    world.lootValue = 1700;
    world.score = 1700;
    world.empCharges = 1;
    takeLoot(world, 'gem', 2);
    world.parsed.loot.find((item) => item.kind === 'painting').taken = true;
    const guard = world.guards[0];
    const gp = place(world, 13, 5);
    guard.x = gp.x;
    guard.y = gp.y;
    guard.facing = 0;
    guard.chasing = true;
    const guard2 = world.guards[1];
    const gp2 = place(world, 17, 8);
    guard2.x = gp2.x;
    guard2.y = gp2.y;
    guard2.facing = -Math.PI / 2;
    world.message = 'Spotted! Break line of sight!';
    world.messageTime = 999;
    return SCREEN_PLAY;
  }
  if (name === '4') {
    // The getaway: every case cracked, the exit open, the thief on the door.
    world.screen = SCREEN_PLAY;
    for (const item of world.parsed.loot) item.taken = true;
    world.lootValue = 4900;
    world.score = 4900;
    world.alarm = 12;
    world.empCharges = 0;
    const exit = place(world, 8, 10);
    world.player.x = exit.x;
    world.player.y = exit.y;
    world.player.facing = Math.PI / 2;
    const guard = world.guards[0];
    const gp = place(world, 5, 2);
    guard.x = gp.x;
    guard.y = gp.y;
    guard.facing = Math.PI / 2;
    world.message = 'Exit open — go, go, go!';
    world.messageTime = 999;
    return SCREEN_PLAY;
  }
  // Shot 1, the cover: mid-heist. The thief is cracking the Crown Jewels
  // while a guard's cone sweeps a tile away and a camera watches the hall.
  world.screen = SCREEN_PLAY;
  const spot = place(world, 9, 9);
  world.player.x = spot.x;
  world.player.y = spot.y;
  world.player.facing = Math.PI / 2;
  world.alarm = 32;
  world.lootValue = 800;
  world.score = 800;
  world.empCharges = 2;
  world.timeSeconds = 74;
  takeLoot(world, 'gem', 2);
  const crown = world.parsed.loot.find((item) => item.kind === 'crown');
  world.channelTarget = crown;
  crown.channel = 0.9;
  const guard = world.guards[0];
  const gp = place(world, 12, 7);
  guard.x = gp.x;
  guard.y = gp.y;
  guard.facing = Math.PI * 0.75;
  const guard2 = world.guards[1];
  const gp2 = place(world, 4, 9);
  guard2.x = gp2.x;
  guard2.y = gp2.y;
  guard2.facing = 0;
  world.message = 'Cracking the Crown Jewels…';
  world.messageTime = 999;
  return SCREEN_PLAY;
}
