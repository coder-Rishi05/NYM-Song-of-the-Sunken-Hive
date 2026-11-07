// Aggressive stress test of all entities, enemies, bosses, props, and combat systems
import assert from 'node:assert';
import { Game } from '../src/game/game.js';
import { Input } from '../src/core/input.js';
import { createEnemy, ENEMY_DEFS } from '../src/game/enemies.js';
import { createBoss, BOSS_DEFS } from '../src/game/bosses.js';
import { FIXED_DT } from '../src/config.js';

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

console.log('=== Stress Testing All Enemies, Bosses, and Systems ===');

const canvas = new MockCanvas();
const game = new Game(canvas, new Input());
globalThis.window.__nym = game;
game.loadRoom('cradle_01', 'start', { fresh: true });

// 1. Test every enemy type
const enemyTypes = Object.keys(ENEMY_DEFS);
console.log(`Testing ${enemyTypes.length} enemy types...`);

for (const type of enemyTypes) {
  process.stdout.write(`  Enemy: ${type}... `);
  const enemy = createEnemy(type, 300, 400, game.room);
  assert(enemy, `Failed to create enemy ${type}`);
  
  // Update AI for 180 frames (3 seconds)
  for (let i = 0; i < 180; i++) {
    enemy.update(FIXED_DT, game);
  }
  
  // Render enemy
  enemy.draw(game.ctx, 1.0);
  
  // Hurt enemy
  enemy.hurt(5, game.player.x, game);
  
  // Kill enemy (striking from unshielded angle)
  enemy.hurt(999, enemy.cx + (enemy.facing > 0 ? -100 : 100), game, { behind: true });
  assert(enemy.dead, `Enemy ${type} should be dead after lethal damage`);
  
  console.log('OK');
}

// 2. Test every boss type
const bossTypes = Object.keys(BOSS_DEFS);
console.log(`Testing ${bossTypes.length} boss types...`);

for (const type of bossTypes) {
  process.stdout.write(`  Boss: ${type}... `);
  const boss = createBoss(type, 400, 500, game);
  assert(boss, `Failed to create boss ${type}`);
  
  // Run boss intro and attack updates
  for (let i = 0; i < 300; i++) {
    boss.update(FIXED_DT, game);
  }
  
  // Render boss
  boss.draw(game.ctx, 1.0);
  
  // Trigger damage and phase changes
  boss.hurt(50, boss.cx, game);
  for (let i = 0; i < 60; i++) boss.update(FIXED_DT, game);
  boss.hurt(100, boss.cx, game);
  for (let i = 0; i < 60; i++) boss.update(FIXED_DT, game);
  
  // Lethal damage
  boss.hurt(999, boss.cx, game);
  assert(boss.dead, `Boss ${type} should be dead`);
  
  console.log('OK');
}

// 3. Test all player combat moves
console.log('Testing Player combat actions...');
game.player.abilities.add('dash');
game.player.abilities.add('spell');

// Attack side
game.input.pressed.add('attack');
game.update(FIXED_DT);
game.input.endStep();

// Dash
game.input.pressed.add('dash');
game.update(FIXED_DT);
game.input.endStep();

// Cast ranged projectile
game.input.pressed.add('cast');
game.update(FIXED_DT);
game.input.endStep();

for (let i = 0; i < 30; i++) game.update(FIXED_DT);
game.draw();
console.log('PASS: Combat actions verified');

console.log('\nALL ENTITY & BOSS STRESS TESTS PASSED WITH 0 ERRORS!');
