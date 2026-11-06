// Headless content validation: room geometry, exits, spawns, item placement.
// Run with: node tools/validate.mjs
globalThis.location = new URL('http://127.0.0.1/?');

const { ROOM_LIST, ROOMS, START_ROOM_ID } = await import('../src/data/rooms.js');
const { buildRoom, solidAt } = await import('../src/world/room.js');
const { TILE } = await import('../src/config.js');
const { ENEMY_DEFS } = await import('../src/game/enemies.js');
const { BOSS_DEFS } = await import('../src/game/bosses.js');
const { drawNym } = await import('../src/render/nym.js');
const { drawBug } = await import('../src/render/bugs.js');
const { drawMoltguard } = await import('../src/render/bosses.js');
const { drawProp } = await import('../src/render/props.js');
const { drawHUD } = await import('../src/ui/ui.js');
const { Game } = await import('../src/game/game.js');

let errors = 0;
let warnings = 0;
const fail = (msg) => { errors++; console.error('ERR  ' + msg); };
const warn = (msg) => { warnings++; console.warn('WARN ' + msg); };

if (!ROOMS[START_ROOM_ID]) fail('start room missing: ' + START_ROOM_ID);
if (ROOM_LIST.length !== 32) warn(`room count is ${ROOM_LIST.length}, expected 32`);

const built = new Map();
for (const def of ROOM_LIST) {
  const room = buildRoom(def);
  built.set(def.id, room);

  if (room.rows.length !== room.h) fail(`${def.id}: rows ${room.rows.length} != h ${room.h}`);
  for (let y = 0; y < room.h; y++) {
    if (room.rows[y].length !== room.w) fail(`${def.id}: row ${y} length ${room.rows[y].length} != ${room.w}`);
  }

  // spawns must be on ground and inside the room
  for (const [name, s] of Object.entries(room.spawns)) {
    const px = s.x * TILE + TILE / 2;
    const py = s.y * TILE;
    if (s.x < 1 || s.x > room.w - 2) fail(`${def.id}: spawn '${name}' x=${s.x} out of bounds`);
    if (s.y < 1 || s.y > room.h) fail(`${def.id}: spawn '${name}' y=${s.y} out of bounds`);
    if (!solidAt(room, Math.floor(px / TILE), s.y) && !solidAt(room, Math.floor(px / TILE), s.y + 1)) {
      warn(`${def.id}: spawn '${name}' may be floating at ${s.x},${s.y}`);
    }
  }

  for (const ex of room.exits) {
    const target = ROOMS[ex.to];
    if (!target) {
      fail(`${def.id}: exit to missing room '${ex.to}'`);
      continue;
    }
    if (ex.spawn && !target.spawns[ex.spawn]) {
      fail(`${def.id}: exit to ${ex.to} uses missing spawn '${ex.spawn}'`);
    }
    if (ex.x < 0 || ex.x + ex.w > room.w || ex.y < 0 || ex.y + ex.h > room.h) {
      fail(`${def.id}: exit rect out of bounds`);
    }
    // exit rect must contain at least one open tile
    let open = 0;
    for (let yy = ex.y; yy < ex.y + ex.h; yy++) {
      for (let xx = ex.x; xx < ex.x + ex.w; xx++) {
        if (!solidAt(room, xx, yy)) open++;
      }
    }
    if (open === 0) fail(`${def.id}: exit to ${ex.to} is fully solid`);
    if (ex.need && !ex.need.startsWith('flag:')) {
      if (!['dash', 'cling', 'wing', 'spell'].includes(ex.need)) fail(`${def.id}: unknown gate '${ex.need}'`);
    }
  }

  for (const e of room.enemies) {
    if (!ENEMY_DEFS[e.type]) fail(`${def.id}: unknown enemy '${e.type}'`);
  }
  for (const p of room.props) {
    const known = ['bench', 'vendor', 'npc', 'tablet', 'lamp', 'maskShard', 'soulVessel', 'charm', 'grub', 'dash', 'cling', 'wing', 'spell'];
    if (!known.includes(p.type)) fail(`${def.id}: unknown prop '${p.type}'`);
    if (p.type === 'dash' || p.type === 'cling' || p.type === 'wing' || p.type === 'spell') {
      // should sit on the floor for pickup
      const below = solidAt(room, p.tx, p.ty + 1);
      if (!below) warn(`${def.id}: gift '${p.type}' is not above solid ground`);
    }
  }
  if (def.boss && !BOSS_DEFS[def.boss.type]) fail(`${def.id}: unknown boss '${def.boss.type}'`);
}

// reciprocity: every exit target should have some way back
for (const def of ROOM_LIST) {
  const room = built.get(def.id);
  for (const ex of room.exits) {
    const target = built.get(ex.to);
    if (!target) continue;
    const back = target.exits.some((e) => e.to === def.id);
    if (!back) warn(`${def.id} -> ${ex.to}: no exit back`);
  }
}

// gifts / bosses exist and are unique
const gifts = new Map();
for (const room of built.values()) {
  for (const p of room.props) {
    if (['dash', 'cling', 'wing', 'spell'].includes(p.type)) {
      if (gifts.has(p.type)) fail(`duplicate gift '${p.type}' in ${room.id} and ${gifts.get(p.type)}`);
      gifts.set(p.type, room.id);
    }
  }
}
for (const g of ['dash', 'cling', 'wing', 'spell']) {
  if (!gifts.has(g)) fail(`gift '${g}' is not placed anywhere`);
}

const bosses = ROOM_LIST.filter((r) => r.boss).map((r) => r.boss.type).sort();
if (bosses.join(',') !== 'choir,moltguard,warden') fail('boss lineup is ' + bosses.join(','));

// renderers must survive a fake-but-complete canvas context
const noop = () => {};
const ctx = new Proxy({
  canvas: { width: 1280, height: 720 },
  measureText: () => ({ width: 40 }),
  createLinearGradient: () => ({ addColorStop: noop }),
  createRadialGradient: () => ({ addColorStop: noop }),
  createPattern: () => ({}),
  getImageData: () => ({ data: [] }),
}, {
  get(target, prop) {
    if (prop in target) return target[prop];
    return noop;
  },
  set(target, prop, value) { target[prop] = value; return true; },
});

try {
  const room = built.get(START_ROOM_ID);
  const p = { x: 100, y: 500, w: 22, h: 42, facing: 1, vx: 40, vy: 0, onGround: true, dashing: false, attackT: 0.1, attackMax: 0.28, attackDir: 'side', focusing: false, runPhase: 0, dead: false, state: 'run', soulGlow: 0.4, iFrames: 0 };
  drawNym(ctx, p, 1);
  drawBug(ctx, { type: 'crawlid', x: 200, y: 560, w: 34, h: 20, facing: -1, fly: false, anim: 1, hitFlash: 0, telegraph: 0, shielded: false, shieldFlash: 0, hidden: false }, 1);
  drawMoltguard(ctx, { x: 300, y: 540, w: 76, h: 58, facing: -1, hp: 90, maxHp: 180, telegraph: 0, vx: 0, phaseIndex: 0 }, 1);
  drawProp(ctx, { type: 'bench', x: 400, y: 600 }, 1);
  const dummyGame = {
    player: { ...p, hp: 3, maxHp: 5, soul: 40, maxSoul: 99, abilities: new Set(['dash']) },
    shards: 12, time: 1, boss: null, roomToastT: 0, toastT: 0, mode: 'playing', deathTimer: 0,
  };
  drawHUD(ctx, dummyGame);
  for (const room of built.values()) {
    for (const pr of room.props) drawProp(ctx, { ...pr, x: pr.cx, y: pr.bottom }, 1);
  }
} catch (err) {
  fail('render smoke test threw: ' + err.stack);
}

if (typeof Game !== 'function') fail('Game export missing');

console.log(`\nchecked ${ROOM_LIST.length} rooms, ${ROOM_LIST.reduce((n, r) => n + (r.exits || []).length, 0)} exits`);
console.log(errors === 0 ? `OK — ${warnings} warning(s)` : `FAILED — ${errors} error(s), ${warnings} warning(s)`);
process.exitCode = errors === 0 ? 0 : 1;
