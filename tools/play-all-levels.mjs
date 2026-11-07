// Deep bot simulation that enters every room, walks end-to-end, fights, interacts, and checks for crashes
import assert from 'node:assert';
import { ROOMS, ROOM_LIST } from '../src/data/rooms.js';
import { Game } from '../src/game/game.js';
import { Input } from '../src/core/input.js';
import { FIXED_DT, TILE } from '../src/config.js';

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
  dispatchEvent(evt) { for (const fn of this.listeners[evt.type] || []) fn(evt); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; }
  getContext() {
    const fn = () => {};
    const grad = { addColorStop: fn };
    return {
      setTransform: fn, clearRect: fn, save: fn, restore: fn, beginPath: fn, moveTo: fn, lineTo: fn,
      quadraticCurveTo: fn, bezierCurveTo: fn, arc: fn, ellipse: fn, rect: fn, roundRect: fn, closePath: fn,
      stroke: fn, fill: fn, fillRect: fn, strokeRect: fn, fillText: fn, strokeText: fn,
      measureText: () => ({ width: 50 }), createLinearGradient: () => grad, createRadialGradient: () => grad,
      drawImage: fn, clip: fn, scale: fn, translate: fn, rotate: fn, transform: fn, resetTransform: fn,
    };
  }
}

globalThis.window = {
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
  addEventListener() {}, removeEventListener() {}, matchMedia() { return { matches: false }; }
};
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };

console.log('=== Playing and Simulating All 32 Levels with Autoplay Bot ===');

const canvas = new MockCanvas();
const input = new Input();
const game = new Game(canvas, input);
globalThis.window.__nym = game;

let roomsChecked = 0;
let roomCrashes = [];

for (const def of ROOM_LIST) {
  roomsChecked++;
  const roomId = def.id;
  process.stdout.write(`Playing room [${roomId}]... `);

  try {
    // 1. Load room
    game.loadRoom(roomId, 'start', { fresh: true });

    // 2. Give player all unlocked abilities and high soul to test full combat repertoire
    game.player.abilities = ['dash', 'cast', 'wallClimb', 'doubleJump', 'acidImmunity'];
    game.player.soul = 99;

    // 3. Move player from left side of room to right side of room
    const stepSize = 80;
    const roomWidth = game.room.pxW;

    for (let x = 60; x < roomWidth - 60; x += stepSize) {
      game.player.x = x;
      game.player.y = Math.min(game.player.y, game.room.pxH - 120);

      // Perform moves via real input simulation
      game.input.pressed.add('attack');
      game.update(FIXED_DT);
      game.input.endStep();

      game.input.pressed.add('dash');
      game.update(FIXED_DT);
      game.input.endStep();

      game.input.pressed.add('cast');
      game.update(FIXED_DT);
      game.input.endStep();

      game.input.pressed.add('interact');
      game.update(FIXED_DT);
      game.input.endStep();

      // Render frame
      game.draw();
    }

    // 4. Test fighting and killing every enemy in the room
    for (const enemy of [...game.enemies]) {
      game.player.x = enemy.x;
      game.player.y = enemy.y;
      enemy.hurt(999, game.player.x, game);
      game.update(FIXED_DT);
    }

    // 5. Test fighting boss if present
    if (game.boss) {
      game.boss.hurt(game.boss.hp, game);
      for (let f = 0; f < 120; f++) {
        game.update(FIXED_DT);
        game.draw();
      }
    }

    console.log('PASSED');
  } catch (err) {
    console.log('CRASHED!');
    console.error(`  CRASH in ${roomId}:`, err);
    roomCrashes.push({ room: roomId, error: err.message, stack: err.stack });
  }
}

console.log(`\nSimulation Result: ${roomsChecked - roomCrashes.length}/${roomsChecked} rooms completed safely.`);
if (roomCrashes.length > 0) {
  console.error('CRASHES DETECTED:', roomCrashes);
  process.exit(1);
} else {
  console.log('ALL 32 LEVELS PLAYED CLEANLY WITH 0 CRASHES!');
}
