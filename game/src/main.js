// Bootstrap and game loop for The Midnight Gallery. One file, one job: wire
// the world, the input, the sound and the renderer together, and run the loop.
// With ?shot=N in the URL the game stages a frozen screenshot scene instead.

import { CANVAS_HEIGHT, CANVAS_WIDTH, STEP } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { render } from './render.js';
import { EVENT_ALARM, EVENT_CAUGHT, EVENT_EMP, EVENT_ESCAPED, EVENT_PICKUP, SCREEN_CAUGHT, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, createWorld, loadLevel, resetGame, stepWorld } from './world.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const world = createWorld();
const input = createInput(canvas);
const audio = createAudio();
const status = document.getElementById('status');

resetGame(world);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot, world);
} else {
  loadLevel(world, 0);
  world.screen = SCREEN_TITLE;
}

function announce(text) {
  if (status) status.textContent = text;
}

function advanceScreen() {
  if (world.screen === SCREEN_TITLE) {
    loadLevel(world, 0);
    world.screen = SCREEN_PLAY;
    world.message = `${world.level.name} — get $${world.level.requiredLoot.toLocaleString()} and get out`;
    world.messageTime = 3;
    announce('The heist begins. Get the loot and reach the exit.');
  } else if (world.screen === SCREEN_CAUGHT) {
    loadLevel(world, world.levelIndex);
    world.screen = SCREEN_PLAY;
    announce('Back in the gallery. Stay out of the cones.');
  } else if (world.screen === SCREEN_WIN || world.screen === SCREEN_OVER) {
    resetGame(world);
    loadLevel(world, 0);
    world.screen = SCREEN_TITLE;
    announce('The Midnight Gallery. Press Enter to begin.');
  }
}

function playEvents(events) {
  if (events & EVENT_PICKUP) audio.pickup();
  if (events & EVENT_ALARM) audio.alarm();
  if (events & EVENT_EMP) audio.emp();
  if (events & EVENT_CAUGHT) {
    audio.caught();
    announce(world.screen === SCREEN_OVER ? 'Out of lives. The crew is done.' : 'Caught! The alarm hit 100 percent.');
  }
  if (events & EVENT_ESCAPED) {
    audio.escaped();
    announce(world.screen === SCREEN_WIN ? 'Clean getaway! Every gallery robbed.' : 'Escaped to the next gallery.');
  }
}

let last = performance.now();
let accumulator = 0;

function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  if (input.advance) {
    input.advance = false;
    if (world.screen !== SCREEN_PLAY) advanceScreen();
  }
  if (!world.frozen && world.screen === SCREEN_PLAY) {
    accumulator += elapsed;
    while (accumulator >= STEP) {
      const events = stepWorld(world, input, STEP);
      playEvents(events);
      input.emp = false;
      accumulator -= STEP;
    }
  } else {
    input.emp = false;
  }
  render(ctx, world);
  requestAnimationFrame(frame);
}

announce('The Midnight Gallery. Press Enter to begin the heist.');
render(ctx, world);
requestAnimationFrame(frame);
