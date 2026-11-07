// Verification test for room transitions, controls, mobile visibility, and attack list
globalThis.location = new URL('http://127.0.0.1:5173/?');
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false }),
};
try {
  Object.defineProperty(globalThis.navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    configurable: true,
  });
  Object.defineProperty(globalThis.navigator, 'maxTouchPoints', {
    value: 10,
    configurable: true,
  });
} catch (e) {}

const { Game } = await import('../src/game/game.js');
const { Input, DEFAULT_KEYMAP } = await import('../src/core/input.js');
const { ROOMS } = await import('../src/data/rooms.js');
const { TouchController } = await import('../src/ui/touch.js');

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL: ' + msg);
    failures++;
  } else {
    console.log('PASS: ' + msg);
  }
}

console.log('--- Testing Keymap ---');
assert(DEFAULT_KEYMAP.attack.includes('KeyA'), 'KeyA is mapped to attack');
assert(DEFAULT_KEYMAP.dash.includes('KeyD'), 'KeyD is mapped to dash');
assert(DEFAULT_KEYMAP.focus.includes('KeyH'), 'KeyH is mapped to heal/focus');
assert(DEFAULT_KEYMAP.cast.includes('KeyC'), 'KeyC is mapped to cast');
assert(DEFAULT_KEYMAP.attackList.includes('KeyQ'), 'KeyQ is mapped to attackList');
assert(!DEFAULT_KEYMAP.left.includes('KeyA'), 'KeyA is NOT in left');
assert(!DEFAULT_KEYMAP.right.includes('KeyD'), 'KeyD is NOT in right');
assert(DEFAULT_KEYMAP.left.includes('ArrowLeft'), 'ArrowLeft is in left');
assert(DEFAULT_KEYMAP.right.includes('ArrowRight'), 'ArrowRight is in right');

console.log('\n--- Testing Room Transitions ---');
const canvas = {
  width: 960,
  height: 540,
  style: {},
  getContext: () => ({
    setTransform: () => {},
    save: () => {},
    restore: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    clearRect: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fillText: () => {},
    measureText: () => ({ width: 50 }),
  }),
  addEventListener: () => {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }),
};

const input = new Input(window);
const game = new Game(canvas, input);
game.startNewGame(); // Starts at START_ROOM_ID ('cradle_01')
assert(game.roomId === 'cradle_01', 'Game loaded initial room cradle_01');
const p1X = game.player.x;
console.log('Initial cradle_01 player position x:', p1X, 'facing:', game.player.facing);

// Simulate player touching east exit to cradle_02
console.log('Simulating exit east to cradle_02...');
const eastExit = game.room.exits.find(e => e.to === 'cradle_02');
assert(eastExit != null, 'Found east exit in cradle_01');
assert(eastExit.spawn === 'west', 'East exit targets west spawn in cradle_02');

// Trigger transition
game.transition = { phase: 'out', t: 0.3, to: eastExit.to, spawn: eastExit.spawn };
game.updateTransition(0.1);

assert(game.roomId === 'cradle_02', 'Game transitioned into cradle_02');
assert(game.player.facing === 1, 'Player is facing right (facing: 1) on entering from west');
assert(game.player.x < 150, `Player entered at west/left edge (x=${game.player.x}), NOT right edge!`);

// Now from cradle_02, test exiting west back to cradle_01
console.log('Simulating exit west back to cradle_01...');
const westExit = game.room.exits.find(e => e.to === 'cradle_01');
assert(westExit != null, 'Found west exit in cradle_02');
assert(westExit.spawn === 'east', 'West exit targets east spawn in cradle_01');

game.transition = { phase: 'out', t: 0.3, to: westExit.to, spawn: westExit.spawn };
game.updateTransition(0.1);

assert(game.roomId === 'cradle_01', 'Game transitioned back to cradle_01');
assert(game.player.facing === -1, 'Player is facing left (facing: -1) on entering from east');
assert(game.player.x > 1000, `Player entered at east/right edge (x=${game.player.x}), NOT left edge!`);

console.log('\n--- Testing Attack List Toggle (Q) ---');
game.transition = null; // Ensure transition is complete
assert(!game.showAttackList, 'Attack list starts closed');
game.input.pressed.add('attackList');
game.updatePlaying(0.016);
game.input.endStep();
assert(game.showAttackList, 'Pressing Q opens attack list');

game.input.pressed.add('attackList');
game.updatePlaying(0.016);
game.input.endStep();
assert(!game.showAttackList, 'Pressing Q again closes attack list');

console.log('\n--- Testing Mobile Controls Screen Detection ---');
// In desktop node environment or desktop browser UA:
const touch = new TouchController(canvas, game.input);
assert(!touch.shouldShow(), 'Touch controls are HIDDEN on laptop/desktop screen (shouldShow === false)');

if (failures === 0) {
  console.log('\nALL CONTROL & ROOM TRANSITION TESTS PASSED!');
  process.exit(0);
} else {
  console.error(`\n${failures} TEST(S) FAILED!`);
  process.exit(1);
}
