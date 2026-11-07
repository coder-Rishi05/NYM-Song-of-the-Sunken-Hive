import assert from 'node:assert';
import { ROOMS, ROOM_LIST } from '../src/data/rooms.js';
import { Game } from '../src/game/game.js';
import { Input } from '../src/core/input.js';

console.log('Testing all exits and transitions across the entire hive map...');

const canvas = {
  style: {},
  width: 1280,
  height: 720,
  addEventListener() {},
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
  getContext() {
    const fn = () => {};
    const grad = { addColorStop: fn };
    return {
      setTransform: fn, clearRect: fn, save: fn, restore: fn, beginPath: fn, moveTo: fn, lineTo: fn,
      quadraticCurveTo: fn, bezierCurveTo: fn, arc: fn, rect: fn, roundRect: fn, closePath: fn,
      stroke: fn, fill: fn, fillRect: fn, strokeRect: fn, fillText: fn, strokeText: fn,
      measureText: () => ({ width: 50 }), createLinearGradient: () => grad, createRadialGradient: () => grad,
      drawImage: fn, clip: fn, scale: fn, translate: fn, rotate: fn,
    };
  }
};
globalThis.window = {
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  addEventListener() {}, removeEventListener() {}, matchMedia() { return { matches: false }; }
};
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

const game = new Game(canvas, new Input());
globalThis.window.__nym = game;

let totalExits = 0;
let errors = [];

for (const room of ROOM_LIST) {
  for (const ex of room.exits || []) {
    totalExits++;
    const targetRoom = ROOMS[ex.to];
    if (!targetRoom) {
      errors.push(`Room ${room.id} exit to "${ex.to}" does not exist!`);
      continue;
    }
    const spawnName = ex.spawn || 'start';
    // Test triggering the transition
    try {
      game.loadRoom(room.id, 'start', { fresh: true });
      // Simulate player standing on exit
      game.player.x = ex.x * 32;
      game.player.y = ex.y * 32;
      game.exitCooldown = 0;
      game.checkExits();
      if (game.transition) {
        // Complete transition
        game.transition.t = 0.3;
        game.updateTransition(0.35);
        // Verify target room loaded
        assert.strictEqual(game.roomId, ex.to);
        assert(!isNaN(game.player.x));
        assert(!isNaN(game.player.y));
        // Verify render works in target room
        game.draw();
      }
    } catch (err) {
      errors.push(`Transition from ${room.id} to ${ex.to} (spawn: ${spawnName}) failed: ${err.message}`);
    }
  }
}

console.log(`Tested ${totalExits} exits. Errors: ${errors.length}`);
if (errors.length) {
  console.error(errors);
  process.exit(1);
} else {
  console.log('ALL EXITS & TRANSITIONS PASSED CLEANLY!');
}
