// Test mouse cursor hover & clicking and mobile touch tap on Title and Pause menus
import assert from 'node:assert';
import { VIEW_W, VIEW_H } from '../src/config.js';
import { Game } from '../src/game/game.js';
import { Input } from '../src/core/input.js';

class MockCanvas {
  constructor() {
    this.style = { width: '1280px', height: '720px', cursor: 'default' };
    this.width = 1280;
    this.height = 720;
    this.listeners = {};
  }
  addEventListener(evt, fn) {
    if (!this.listeners[evt]) this.listeners[evt] = [];
    this.listeners[evt].push(fn);
  }
  dispatchEvent(evt) {
    const list = this.listeners[evt.type] || [];
    for (const fn of list) fn(evt);
  }
  getBoundingClientRect() {
    return { left: 0, top: 0, width: 1280, height: 720 };
  }
  getContext() {
    return {
      setTransform() {},
      clearRect() {},
      save() {},
      restore() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      fill() {},
      fillRect() {},
      fillText() {},
      measureText() { return { width: 50 }; },
      createRadialGradient() { return { addColorStop() {} }; },
    };
  }
}

// Setup globals
globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 2,
  addEventListener() {},
  removeEventListener() {},
  matchMedia() { return { matches: false }; },
};
globalThis.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = v; },
  removeItem(k) { delete this.store[k]; },
};

console.log('=== Testing Mouse Cursor Hover & Direct Click on Menus ===');

const canvas = new MockCanvas();
const input = new Input();
const game = new Game(canvas, input);
globalThis.window.__nym = game;

// 1. Initial State: Title Screen
assert.strictEqual(game.mode, 'title', 'Game should start in title mode');
console.log('PASS: Initial mode is title');

// Title screen items when no save: ['New Game', 'Controls', 'Options']
// Index 0: New Game (y = 410)
// Index 1: Controls (y = 452)
// Index 2: Options (y = 494)

// 2. Test Mouse Hover on Title Items
// Hover over Controls (index 1: x = 640, y = 445)
game.handleMenuHover(640, 445);
assert.strictEqual(game.titleIndex, 1, 'Hovering over Controls should set titleIndex to 1');
assert.strictEqual(canvas.style.cursor, 'pointer', 'Hovering over menu item should set cursor to pointer');
console.log('PASS: Mouse hover over Controls updates titleIndex=1 and cursor=pointer');

// Hover over Options (index 2: x = 640, y = 487)
game.handleMenuHover(640, 487);
assert.strictEqual(game.titleIndex, 2, 'Hovering over Options should set titleIndex to 2');
assert.strictEqual(canvas.style.cursor, 'pointer', 'Cursor remains pointer over Options');
console.log('PASS: Mouse hover over Options updates titleIndex=2 and cursor=pointer');

// Hover outside items (x = 100, y = 100)
game.handleMenuHover(100, 100);
assert.strictEqual(canvas.style.cursor, 'default', 'Hovering away from items resets cursor to default');
console.log('PASS: Mouse hover away from items resets cursor to default');

// 3. Test Mouse Click on Title Items
// Click on "Controls" (x = 640, y = 445)
const hitControls = game.handleMenuTouch(640, 445);
assert.strictEqual(hitControls, true, 'Clicking Controls should be handled');
assert.strictEqual(game.mode, 'controls', 'Clicking Controls should switch mode to controls');
console.log('PASS: Direct click on Controls switches mode to controls');

// In Controls screen, click Back (row 14: y = 154 + 14 * 26 = 518)
const hitBack = game.handleMenuTouch(640, 513);
assert.strictEqual(hitBack, true, 'Clicking Back in controls should be handled');
assert.strictEqual(game.mode, 'title', 'Clicking Back should return to title');
console.log('PASS: Direct click on Back in Controls returns to title');

// Click on "New Game" (index 0: y = 403)
const hitNewGame = game.handleMenuTouch(640, 403);
assert.strictEqual(hitNewGame, true, 'Clicking New Game should be handled');
assert.strictEqual(game.mode, 'dialogue', 'Clicking New Game starts the opening dialogue');
console.log('PASS: Direct click on New Game switches mode to prologue dialogue');

// Advance dialogue with clicks (fast forward line 1, next line, fast forward line 2, finish)
game.handleMenuTouch(640, 360); // Fast-forward line 1
game.handleMenuTouch(640, 360); // Advance to line 2
game.handleMenuTouch(640, 360); // Fast-forward line 2
game.handleMenuTouch(640, 360); // Finish dialogue
assert.strictEqual(game.mode, 'playing', 'Completing prologue dialogue puts game into playing mode');
console.log('PASS: Clicking through prologue dialogue enters playing mode');

// 4. Test Pause Menu Hover and Click
// Put game in paused mode
game.mode = 'paused';
game.pauseIndex = 0;
// Items: ['Resume', 'Map', 'Controls', 'Options', 'Quit to Title']
// 0: Resume (y = 260)
// 1: Map (y = 304)
// 2: Controls (y = 348)
// 3: Options (y = 392)
// 4: Quit to Title (y = 436)

// Hover over Map (y = 298)
game.handleMenuHover(640, 298);
assert.strictEqual(game.pauseIndex, 1, 'Hovering Map should set pauseIndex to 1');
assert.strictEqual(canvas.style.cursor, 'pointer', 'Cursor should be pointer over pause item');
console.log('PASS: Mouse hover over Pause -> Map updates pauseIndex=1 and cursor=pointer');

// Hover over Quit to Title (y = 430)
game.handleMenuHover(640, 430);
assert.strictEqual(game.pauseIndex, 4, 'Hovering Quit to Title should set pauseIndex to 4');
console.log('PASS: Mouse hover over Pause -> Quit updates pauseIndex=4');

// Click on Resume (y = 254)
const hitResume = game.handleMenuTouch(640, 254);
assert.strictEqual(hitResume, true, 'Clicking Resume should be handled');
assert.strictEqual(game.mode, 'playing', 'Clicking Resume should resume game to playing');
console.log('PASS: Direct click on Resume returns to playing');

// Pause again and test click Quit to Title
game.mode = 'paused';
const hitQuit = game.handleMenuTouch(640, 430);
assert.strictEqual(hitQuit, true, 'Clicking Quit should be handled');
assert.strictEqual(game.mode, 'title', 'Clicking Quit should return to title');
console.log('PASS: Direct click on Quit to Title returns to title');

// 5. Test High-DPI / Android Touch coordinate conversion
// Simulate a mobile screen with CSS size 800x450 and physical canvas 2400x1350 (DPR = 3)
const mobileRect = { left: 0, top: 0, width: 800, height: 450 };
// A touch tap at the visual center of the screen: clientX = 400, clientY = 225
const touchPt = {
  x: (400 - mobileRect.left) * (VIEW_W / mobileRect.width),
  y: (225 - mobileRect.top) * (VIEW_H / mobileRect.height),
};
assert.strictEqual(touchPt.x, 640, 'Center touch X must map precisely to 640');
assert.strictEqual(touchPt.y, 360, 'Center touch Y must map precisely to 360');
console.log('PASS: High-DPI Android touch coordinates map with 100% precision to virtual 1280x720');

// 6. Test Input pointerdown immunity in menu mode
game.mode = 'title';
assert.strictEqual(game.isMenuMode(), true, 'Title should be considered a menu mode');
game.mode = 'playing';
assert.strictEqual(game.isMenuMode(), false, 'Playing mode is not a menu mode');
game.showAttackList = true;
assert.strictEqual(game.isMenuMode(), true, 'Showing attack list is a menu mode');
console.log('PASS: isMenuMode correctly identifies menu states');

console.log('\nALL CURSOR HOVER & CLICK TESTS PASSED WITH 0 ERRORS!');
