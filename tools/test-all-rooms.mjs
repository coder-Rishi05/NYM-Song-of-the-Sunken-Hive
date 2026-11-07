// Comprehensive room and level auditor
// Loads every room, spawns player at every entrance, simulates 60 frames, and renders
import assert from 'node:assert';
import { ROOMS, ROOM_LIST } from '../src/data/rooms.js';
import { Game } from '../src/game/game.js';
import { Input } from '../src/core/input.js';
import { FIXED_DT, VIEW_W, VIEW_H } from '../src/config.js';

class MockCanvas {
  constructor() {
    this.style = { width: '1280px', height: '720px' };
    this.width = 1280;
    this.height = 720;
    this.listeners = {};
  }
  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }
  dispatchEvent(evt) {
    for (const fn of this.listeners[evt.type] || []) fn(evt);
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 1280, height: 720 };
  }
  getContext() {
    const fn = () => {};
    const grad = { addColorStop: fn };
    const ctx = {
      setTransform: fn,
      clearRect: fn,
      save: fn,
      restore: fn,
      beginPath: fn,
      moveTo: fn,
      lineTo: fn,
      quadraticCurveTo: fn,
      bezierCurveTo: fn,
      arc: fn,
      arcTo: fn,
      ellipse: fn,
      rect: fn,
      roundRect: fn,
      closePath: fn,
      stroke: fn,
      fill: fn,
      fillRect: fn,
      strokeRect: fn,
      fillText: fn,
      strokeText: fn,
      measureText: () => ({ width: 50 }),
      createLinearGradient: () => grad,
      createRadialGradient: () => grad,
      drawImage: fn,
      clip: fn,
      scale: fn,
      translate: fn,
      rotate: fn,
      transform: fn,
      resetTransform: fn,
    };
    return ctx;
  }
}

globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
  matchMedia() { return { matches: false }; },
};
globalThis.localStorage = {
  getItem() { return null; },
  setItem() {},
  removeItem() {},
};

console.log(`Auditing all ${ROOM_LIST.length} rooms in NYM: Song of the Sunken Hive...`);

const canvas = new MockCanvas();
const input = new Input();
const game = new Game(canvas, input);
globalThis.window.__nym = game;

let totalRoomsTested = 0;
let errors = [];

for (const def of ROOM_LIST) {
  const roomId = def.id;
  totalRoomsTested++;
  process.stdout.write(`Testing room [${roomId}] (zone: ${def.zone})... `);

  try {
    // 1. Verify exits target valid rooms
    for (const ex of def.exits || []) {
      if (!ROOMS[ex.to]) {
        throw new Error(`Exit in room ${roomId} targets non-existent room: ${ex.to}`);
      }
    }

    // 2. Test loading room with every declared spawn
    const spawns = Object.keys(def.spawns || { start: true });
    for (const sp of spawns) {
      game.loadRoom(roomId, sp, { fresh: true });

      assert.strictEqual(game.roomId, roomId);
      assert(!isNaN(game.player.x), `Player X is NaN in ${roomId} spawn ${sp}`);
      assert(!isNaN(game.player.y), `Player Y is NaN in ${roomId} spawn ${sp}`);

      // 3. Simulate 60 frames of gameplay
      for (let f = 0; f < 60; f++) {
        game.update(FIXED_DT);
      }

      // 4. Render the room
      game.draw();
    }

    console.log(`OK (spawns tested: ${spawns.join(', ')})`);
  } catch (err) {
    console.log(`FAILED!`);
    console.error(`  Error in room ${roomId}:`, err.message);
    errors.push({ room: roomId, error: err });
  }
}

console.log(`\nAudit Complete: ${totalRoomsTested - errors.length}/${totalRoomsTested} rooms passed.`);
if (errors.length > 0) {
  console.error(`FOUND ${errors.length} FAILING ROOMS:`, errors);
  process.exit(1);
} else {
  console.log(`ALL ROOMS PASSED SIMULATION AND RENDERING!`);
}
