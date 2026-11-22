// Keyboard and mouse for the heist. One file, one job: turn events into input.
// Keys move the thief; a click sets a walk target; Shift sneaks; Space fires EMP.

import { HUD_HEIGHT } from './config.js';

export function createInput(canvas) {
  const input = {
    left: false,
    right: false,
    up: false,
    down: false,
    sneak: false,
    emp: false,
    target: null,
    advance: false,
  };
  const keys = new Set();
  const KEYMAP = {
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
  };

  function sync() {
    input.left = keys.has('left');
    input.right = keys.has('right');
    input.up = keys.has('up');
    input.down = keys.has('down');
    input.sneak = keys.has('sneak');
  }

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Shift') keys.add('sneak');
    else if (event.key === ' ' || event.key === 'e' || event.key === 'E') {
      if (!event.repeat) input.emp = true;
      event.preventDefault();
    } else if (event.key === 'Enter') {
      input.advance = true;
    } else if (KEYMAP[event.key]) {
      keys.add(KEYMAP[event.key]);
      event.preventDefault();
    }
    sync();
  });
  window.addEventListener('keyup', (event) => {
    if (event.key === 'Shift') keys.delete('sneak');
    else if (KEYMAP[event.key]) keys.delete(KEYMAP[event.key]);
    sync();
  });
  window.addEventListener('blur', () => {
    keys.clear();
    sync();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    if (y < HUD_HEIGHT) {
      input.advance = true;
      return;
    }
    input.target = { x, y: y - HUD_HEIGHT };
    input.advance = true;
  });

  return input;
}
