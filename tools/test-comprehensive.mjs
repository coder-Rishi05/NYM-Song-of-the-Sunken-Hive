import { Game } from '../src/game/game.js';
import { Input, DEFAULT_KEYMAP } from '../src/core/input.js';
import { ROOM_LIST, ROOMS } from '../src/data/rooms.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

console.log('=== 1. Testing Keyboard & Mouse Controls ===');
assert(DEFAULT_KEYMAP.attack.includes('KeyA'), 'KeyA is mapped to attack');
assert(DEFAULT_KEYMAP.dash.includes('KeyD'), 'KeyD is mapped to dash');
assert(DEFAULT_KEYMAP.focus.includes('KeyH'), 'KeyH is mapped to heal/focus');
assert(DEFAULT_KEYMAP.cast.includes('KeyC'), 'KeyC is mapped to cast');
assert(DEFAULT_KEYMAP.attackList.includes('KeyQ'), 'KeyQ is mapped to attackList');
assert(DEFAULT_KEYMAP.timer.includes('KeyT'), 'KeyT is mapped to speedrun timer');
assert(!DEFAULT_KEYMAP.left.includes('KeyA'), 'KeyA is NOT in left');
assert(!DEFAULT_KEYMAP.right.includes('KeyD'), 'KeyD is NOT in right');

// Setup mock window & canvas
globalThis.location = { search: '' };
globalThis.window = {
  addEventListener: () => {},
  innerWidth: 1280,
  innerHeight: 720,
  matchMedia: () => ({ matches: false }),
};
globalThis.document = { querySelector: () => ({ getContext: () => ({}) }) };
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const canvas = {
  getContext: () => ({
    save: () => {}, restore: () => {}, beginPath: () => {}, closePath: () => {},
    moveTo: () => {}, lineTo: () => {}, arc: () => {}, fill: () => {}, stroke: () => {},
    clearRect: () => {}, fillRect: () => {}, strokeRect: () => {}, measureText: () => ({ width: 50 }),
    fillText: () => {}, strokeText: () => {}, setTransform: () => {}, resetTransform: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
  }),
  style: {},
  width: 1280,
  height: 720,
  addEventListener: () => {},
  removeEventListener: () => {},
};

const input = new Input(globalThis.window);
const game = new Game(canvas, input);
game.startNewGame();

// Test Mouse buttons
input.mousePressed.add('attack');
input.mouseKeys.add('attack');
assert(input.wasPressed('attack'), 'Mouse left click triggers attack wasPressed');
assert(input.isDown('attack'), 'Mouse left click triggers attack isDown');
input.mousePressed.add('dash');
input.mouseKeys.add('dash');
assert(input.wasPressed('dash'), 'Mouse right click triggers dash wasPressed');

console.log('\n=== 2. Testing Room Transitions & Spawn Positions ===');
assert(game.roomId === 'cradle_01', 'Initial room is cradle_01');
const initX = game.player.x;
game.loadRoom('cradle_02', 'west');
assert(game.roomId === 'cradle_02', 'Entered cradle_02 from west entrance');
assert(game.player.facing === 1, 'Player is facing right (1) on west entrance');
assert(game.player.x < 150, 'Player spawned at west (left) edge');

game.loadRoom('cradle_01', 'east');
assert(game.roomId === 'cradle_01', 'Entered cradle_01 from east entrance');
assert(game.player.facing === -1, 'Player is facing left (-1) on east entrance');
assert(game.player.x > 1000, 'Player spawned at east (right) edge');

console.log('\n=== 3. Testing Spike Pogo Bounce ===');
game.loadRoom('ember_01', 'start');
const spike = game.room.spikeRects[0];
game.player.x = spike.x;
game.player.y = spike.y - game.player.h + 5;
game.player.vy = 200;
game.player.attackDir = 'down';
game.player.attackT = 0.2;
game.updateCombat();
assert(game.player.vy === -430, 'Downward slash on spike bounces player upward (-430 px/s)');

console.log('\n=== 4. Testing Water Slowdown ===');
game.loadRoom('cistern_01', 'start');
game.player.x = 6 * 32;
game.player.y = 650;
game.player.vx = 200;
game.player.update(0.016, game);
assert(game.player.inWater === true, 'Player detects water immersion');
assert(game.player.vx < 150, 'Water tiles apply drag and slow player down');

console.log('\n=== 5. Testing Mask Shards Count ===');
let shards = [];
for (const r of ROOM_LIST) {
  for (const p of r.entities || []) {
    if (p.t === 'maskShard') shards.push({ room: r.id, id: p.id });
  }
}
assert(shards.length === 3, `World contains exactly 3 Mask Shards (found: ${shards.length})`);

console.log('\n=== 6. Testing UI Overlays & Speedrun Timer ===');
assert(game.showAttackList === false, 'Attack list starts closed');
input.pressed.add('attackList');
game.updatePlaying(0.016);
assert(game.showAttackList === true, 'Pressing Q opens attack list');
input.pressed.delete('attackList');
input.pressed.add('attackList');
game.updatePlaying(0.016);
assert(game.showAttackList === false, 'Pressing Q again closes attack list');
input.pressed.delete('attackList');

assert(game.showTimer === false, 'Speedrun timer starts hidden');
input.pressed.add('timer');
game.updatePlaying(0.016);
assert(game.showTimer === true, 'Pressing T toggles speedrun timer ON');
input.pressed.delete('timer');
input.pressed.add('timer');
game.updatePlaying(0.016);
assert(game.showTimer === false, 'Pressing T toggles speedrun timer OFF');
input.pressed.delete('timer');

console.log('\n=== 7. Testing Mobile Controls Screen Detection ===');
assert(game.touch.shouldShow() === false, 'Touch virtual buttons are HIDDEN on desktop/laptop');

console.log('\nALL 7 SYSTEM AUDIT TESTS PASSED WITH 0 ERRORS!');
