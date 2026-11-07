// Boot + fixed timestep loop.
import { FIXED_DT, MAX_STEPS, DEBUG, AUTOSTART, START_ROOM } from './config.js';
import { Input } from './core/input.js';
import { Game } from './game/game.js';
import { audio } from './core/audio.js';

const canvas = document.getElementById('game');
const input = new Input(window);
const game = new Game(canvas, input);

// Handy for manual debugging from the devtools console.
window.__nym = game;

const boot = document.getElementById('boot');
let booted = false;

function dismissBoot() {
  if (booted) return;
  booted = true;
  audio.init();
  if (window.__nym && window.__nym.mode === 'title') {
    audio.startZone('title');
  }
  if (boot) {
    boot.classList.add('hidden');
    // Ensure the overlay completely yields all pointer events to canvas
    boot.style.pointerEvents = 'none';
  }
}

window.addEventListener('pointerdown', dismissBoot, { passive: true });
window.addEventListener('touchstart', dismissBoot, { passive: true });
window.addEventListener('keydown', dismissBoot);
window.addEventListener('gamepadconnected', dismissBoot);

// Straight into the game for ?play / ?room URLs, no click needed.
if (AUTOSTART || START_ROOM) {
  requestAnimationFrame(dismissBoot);
}

let last = performance.now();
let acc = 0;

function frame(now) {
  const raw = (now - last) / 1000;
  last = now;
  acc += Math.min(0.2, Math.max(0, raw));

  input.pollPad();
  let steps = 0;
  while (acc >= FIXED_DT && steps < MAX_STEPS) {
    game.update(FIXED_DT);
    input.endStep();
    acc -= FIXED_DT;
    steps += 1;
  }
  if (steps === MAX_STEPS) acc = 0;

  game.draw();
  if (DEBUG && game.fps < 30) {
    // (debug HUD already shows fps; this keeps the loop honest)
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame((now) => {
  last = now;
  requestAnimationFrame(frame);
});

document.addEventListener('visibilitychange', () => {
  last = performance.now();
  acc = 0;
  if (document.hidden) {
    audio.pauseBGM();
    if (audio.ctx && audio.ctx.state === 'running') {
      audio.ctx.suspend().catch(() => {});
    }
  } else {
    if (window.__nym && window.__nym.mode !== 'paused') {
      audio.resumeBGM();
    }
    if (audio.ctx && audio.ctx.state === 'suspended') {
      audio.ctx.resume().catch(() => {});
    }
  }
});

window.addEventListener('blur', () => {
  audio.pauseBGM();
});

window.addEventListener('focus', () => {
  if (window.__nym && window.__nym.mode !== 'paused') {
    audio.resumeBGM();
  }
});
