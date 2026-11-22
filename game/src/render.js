// Every pixel of The Midnight Gallery: floor, walls, cones, loot, thief, HUD
// and the title / caught / win screens. One file, one job: draw the world.

import { CAMERA, CANVAS_HEIGHT, CANVAS_WIDTH, COLORS, FIELD_HEIGHT, FIELD_WIDTH, GUARD, HUD_HEIGHT, LOOT, TILE } from './config.js';
import { SCREEN_CAUGHT, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, levelTotalLoot } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, facing, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing - halfAngle) * range, y + Math.sin(facing - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing + halfAngle) * range, y + Math.sin(facing + halfAngle) * range);
  ctx.stroke();
}

function drawFloor(ctx, level) {
  for (let row = 0; row < level.map.length; row += 1) {
    for (let col = 0; col < level.map[row].length; col += 1) {
      const x = col * TILE;
      const y = HUD_HEIGHT + row * TILE;
      const even = (col + row) % 2 === 0;
      ctx.fillStyle = even ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = COLORS.floorEdge;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
  // Warm pools of light under the display cases, so loot reads at a glance.
  for (let row = 0; row < level.map.length; row += 1) {
    for (let col = 0; col < level.map[row].length; col += 1) {
      const ch = level.map[row][col];
      if (ch !== 'D' && ch !== 'P' && ch !== 'C') continue;
      const cx = col * TILE + TILE / 2;
      const cy = HUD_HEIGHT + row * TILE + TILE / 2;
      const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, TILE * 0.9);
      glow.addColorStop(0, 'rgba(242, 193, 78, 0.28)');
      glow.addColorStop(1, 'rgba(242, 193, 78, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - TILE, cy - TILE, TILE * 2, TILE * 2);
    }
  }
}

function drawWalls(ctx, level) {
  for (let row = 0; row < level.map.length; row += 1) {
    for (let col = 0; col < level.map[row].length; col += 1) {
      if (level.map[row][col] !== '#') continue;
      const x = col * TILE;
      const y = HUD_HEIGHT + row * TILE;
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = COLORS.wallTop;
      ctx.fillRect(x, y, TILE, 5);
      ctx.strokeStyle = '#05070f';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
    }
  }
}

function drawLoot(ctx, world) {
  for (const item of world.parsed.loot) {
    if (item.taken) continue;
    const x = item.x;
    const y = HUD_HEIGHT + item.y;
    if (item.kind === 'gem') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = COLORS.gem;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.strokeStyle = '#d6f2ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-8, -8, 16, 16);
      ctx.restore();
    } else if (item.kind === 'painting') {
      ctx.fillStyle = '#5b3a1e';
      ctx.fillRect(x - 15, y - 11, 30, 22);
      ctx.fillStyle = COLORS.painting;
      ctx.fillRect(x - 12, y - 8, 24, 16);
      ctx.fillStyle = '#7a4a2b';
      ctx.beginPath();
      ctx.arc(x, y - 1, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d2c17';
      ctx.fillRect(x - 12, y + 4, 24, 4);
    } else {
      ctx.fillStyle = COLORS.crown;
      ctx.beginPath();
      ctx.moveTo(x - 13, y + 7);
      ctx.lineTo(x - 13, y - 4);
      ctx.lineTo(x - 6, y + 2);
      ctx.lineTo(x, y - 9);
      ctx.lineTo(x + 6, y + 2);
      ctx.lineTo(x + 13, y - 4);
      ctx.lineTo(x + 13, y + 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (world.channelTarget === item && item.channel > 0) {
      const need = LOOT[item.kind].channelSeconds;
      const frac = Math.min(1, item.channel / need);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x - 18, y - 26, 36, 6);
      ctx.fillStyle = COLORS.crown;
      ctx.fillRect(x - 18, y - 26, 36 * frac, 6);
    }
  }
}

function drawExit(ctx, world) {
  const exit = world.parsed.exit;
  const x = exit.x;
  const y = HUD_HEIGHT + exit.y;
  const open = world.lootValue >= world.level.requiredLoot;
  ctx.fillStyle = open ? COLORS.exit : COLORS.exitLocked;
  roundRect(ctx, x - 20, y - 20, 40, 40, 6);
  ctx.fill();
  ctx.strokeStyle = '#0b0e1a';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#0b0e1a';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT' : 'LOCK', x, y + 1);
  if (!open) {
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '11px sans-serif';
    ctx.fillText(`need $${world.level.requiredLoot.toLocaleString()}`, x, y + 32);
  }
}

function drawGuards(ctx, world) {
  for (const guard of world.guards) {
    const x = guard.x;
    const y = HUD_HEIGHT + guard.y;
    const frozen = guard.frozen > 0;
    if (!frozen) {
      drawCone(ctx, x, y, guard.facing, GUARD.coneRange, GUARD.coneHalfAngle, COLORS.guardCone, COLORS.guardConeEdge);
    }
    ctx.fillStyle = frozen ? '#7a8ba8' : COLORS.guard;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5c1410';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cap brim shows which way the guard faces.
    ctx.fillStyle = '#e8e6df';
    ctx.beginPath();
    ctx.arc(x + Math.cos(guard.facing) * 8, y + Math.sin(guard.facing) * 8, 4, 0, Math.PI * 2);
    ctx.fill();
    if (guard.chasing) {
      ctx.fillStyle = '#ff5a4e';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', x, y - 20);
    }
  }
}

function drawCameras(ctx, world) {
  for (const cam of world.cameras) {
    const x = cam.x;
    const y = HUD_HEIGHT + cam.y;
    const disabled = cam.disabled > 0;
    if (!disabled) {
      drawCone(ctx, x, y, cam.angle, CAMERA.range, CAMERA.coneHalfAngle, COLORS.cameraCone, COLORS.cameraConeEdge);
    }
    ctx.fillStyle = disabled ? '#5a6b7a' : '#e74c3c';
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0b0e1a';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#0b0e1a';
    ctx.beginPath();
    ctx.arc(x + Math.cos(cam.angle) * 5, y + Math.sin(cam.angle) * 5, 3, 0, Math.PI * 2);
    ctx.fill();
    if (disabled) {
      ctx.strokeStyle = '#e8e6df';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 5);
      ctx.lineTo(x + 5, y + 5);
      ctx.moveTo(x + 5, y - 5);
      ctx.lineTo(x - 5, y + 5);
      ctx.stroke();
    }
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  const x = p.x;
  const y = HUD_HEIGHT + p.y;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerCoat;
  ctx.beginPath();
  ctx.arc(x, y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  ctx.stroke();
  // The thief's hat brim points where they move.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(x + Math.cos(p.facing) * 9, y + Math.sin(p.facing) * 9, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0b0e1a';
  ctx.beginPath();
  ctx.arc(x - 4, y - 3, 2, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 3, 2, 0, Math.PI * 2);
  ctx.fill();
}

function alarmColor(alarm) {
  if (alarm < 40) return COLORS.alarmLow;
  if (alarm < 75) return COLORS.alarmMid;
  return COLORS.alarmHigh;
}

function drawHud(ctx, world) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.fillStyle = COLORS.title;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`◆ ${world.level.name}`, 14, 18);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '13px sans-serif';
  ctx.fillText(`Level ${world.levelIndex + 1}/3   Score $${world.score.toLocaleString()}   ${Math.floor(world.timeSeconds / 60)}:${String(Math.floor(world.timeSeconds % 60)).padStart(2, '0')}`, 14, 42);

  // Loot progress: what is bagged against what the exit needs.
  const total = levelTotalLoot(world.level);
  const barX = 330;
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px sans-serif';
  ctx.fillText(`LOOT $${world.lootValue.toLocaleString()} / $${world.level.requiredLoot.toLocaleString()}  (room $${total.toLocaleString()})`, barX, 14);
  ctx.fillStyle = '#1d2240';
  roundRect(ctx, barX, 26, 220, 12, 6);
  ctx.fill();
  ctx.fillStyle = COLORS.painting;
  roundRect(ctx, barX, 26, 220 * Math.min(1, world.lootValue / world.level.requiredLoot), 12, 6);
  ctx.fill();

  // EMP charges.
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px sans-serif';
  ctx.fillText('EMP [Space]', 580, 14);
  for (let i = 0; i < 2; i += 1) {
    ctx.fillStyle = i < world.empCharges ? '#57c8ff' : '#2a3050';
    ctx.beginPath();
    ctx.arc(592 + i * 20, 32, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Lives.
  ctx.fillStyle = COLORS.hudDim;
  ctx.fillText('Lives', 660, 14);
  ctx.fillStyle = '#e74c3c';
  ctx.font = '16px sans-serif';
  ctx.fillText('♥'.repeat(Math.max(0, world.lives)), 660, 34);

  // The alarm meter: the game's heartbeat, always visible.
  const ax = 740;
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ALARM', ax, 14);
  ctx.fillStyle = '#1d2240';
  roundRect(ctx, ax, 26, 170, 16, 8);
  ctx.fill();
  ctx.fillStyle = alarmColor(world.alarm);
  roundRect(ctx, ax, 26, 170 * (world.alarm / 100), 16, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`${Math.round(world.alarm)}%`, ax + 176, 34);
}

function drawMessage(ctx, world) {
  if (world.messageTime <= 0 || !world.message) return;
  ctx.font = 'bold 16px sans-serif';
  const w = ctx.measureText(world.message).width + 28;
  ctx.fillStyle = 'rgba(11, 14, 26, 0.85)';
  roundRect(ctx, (CANVAS_WIDTH - w) / 2, HUD_HEIGHT + 12, w, 30, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.title;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(world.message, CANVAS_WIDTH / 2, HUD_HEIGHT + 28);
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 7, 15, 0.78)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '18px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30 + i * 30);
  });
}

export function render(ctx, world) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = COLORS.page;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawFloor(ctx, world.level);
  drawExit(ctx, world);
  drawLoot(ctx, world);
  drawCameras(ctx, world);
  drawGuards(ctx, world);
  drawPlayer(ctx, world);
  drawWalls(ctx, world.level);
  drawHud(ctx, world);
  drawMessage(ctx, world);
  if (world.empFlash > 0) {
    ctx.fillStyle = `rgba(87, 200, 255, ${0.25 * (world.empFlash / 0.6)})`;
    ctx.fillRect(0, HUD_HEIGHT, FIELD_WIDTH, FIELD_HEIGHT);
  }
  if (world.screen === SCREEN_TITLE) {
    overlay(ctx, 'THE MIDNIGHT GALLERY', [
      'A top-down museum heist. Bag the loot, dodge the cones, reach the exit.',
      'Move: WASD / arrows, or click to walk · Sneak: hold Shift · EMP: Space',
      'Cameras and guards raise the alarm. At 100% the night is over.',
      '',
      'Press Enter or click to begin the heist',
    ], COLORS.title);
  } else if (world.screen === SCREEN_CAUGHT) {
    overlay(ctx, 'CAUGHT!', [
      `The alarm hit 100%. The guards have you — ${world.lives} ${world.lives === 1 ? 'life' : 'lives'} left.`,
      `Score so far: $${world.score.toLocaleString()}`,
      '',
      'Press Enter to slip back into the gallery',
    ], COLORS.alarmHigh);
  } else if (world.screen === SCREEN_WIN) {
    overlay(ctx, 'CLEAN GETAWAY!', [
      `Every gallery robbed. Final score: $${world.score.toLocaleString()}`,
      `Time: ${Math.floor(world.timeSeconds / 60)}:${String(Math.floor(world.timeSeconds % 60)).padStart(2, '0')}  ·  Best: $${Math.max(world.best, world.score).toLocaleString()}`,
      '',
      'Press Enter to run it again',
    ], COLORS.exit);
  } else if (world.screen === SCREEN_OVER) {
    overlay(ctx, 'THE CREW IS DONE', [
      `Out of lives. Final score: $${world.score.toLocaleString()}  ·  Best: $${world.best.toLocaleString()}`,
      '',
      'Press Enter to plan a new heist',
    ], COLORS.alarmHigh);
  }
}
