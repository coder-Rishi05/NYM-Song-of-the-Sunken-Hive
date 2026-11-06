import { TILE, VIEW_W, VIEW_H } from '../config.js';
import { RNG } from '../core/rng.js';
import { clamp } from '../core/math.js';
import { paletteFor } from '../render/palette.js';

const ENEMY_CHARS = {
  c: 'crawlid',
  b: 'buzzer',
  s: 'sporeling',
  r: 'ramshell',
  m: 'maskfly',
  k: 'silkdrop',
  f: 'blowfly',
  u: 'bulwark',
  h: 'chorister',
  n: 'husk',
};

const PROP_CHARS = {
  B: 'bench',
  V: 'vendor',
  N: 'npc',
  T: 'tablet',
  '1': 'maskShard',
  '2': 'soulVessel',
  '3': 'charm',
  '4': 'grub',
  L: 'lamp',
};

export function buildRoom(def) {
  const rows = def.rows.map((r) => r.padEnd(def.w, '.').slice(0, def.w));
  const w = def.w;
  const h = rows.length;

  const solid = new Uint8Array(w * h);
  const oneWay = new Uint8Array(w * h);
  const spike = new Uint8Array(w * h);
  const water = new Uint8Array(w * h);
  const enemies = [];
  const props = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      const i = y * w + x;
      if (ch === '#') solid[i] = 1;
      else if (ch === '=') oneWay[i] = 1;
      else if (ch === '^') spike[i] = 1;
      else if (ch === '~') water[i] = 1;

      if (ENEMY_CHARS[ch]) {
        enemies.push({
          type: ENEMY_CHARS[ch],
          cx: (x + 0.5) * TILE,
          bottom: (y + 1) * TILE,
          tx: x,
          ty: y,
        });
      }
      if (PROP_CHARS[ch]) {
        props.push({
          type: PROP_CHARS[ch],
          cx: (x + 0.5) * TILE,
          bottom: (y + 1) * TILE,
          tx: x,
          ty: y,
          id: `${def.id}:${PROP_CHARS[ch]}:${x}:${y}`,
        });
      }
    }
  }

  for (const ent of def.enemySpawns || []) {
    enemies.push({
      type: ent.type || ent.t,
      cx: ((ent.x ?? 1) + 0.5) * TILE,
      bottom: ((ent.y ?? 1) + 1) * TILE,
      tx: ent.x,
      ty: ent.y,
    });
  }

  for (const ent of def.entities || []) {
    const px = (ent.x + 0.5) * TILE;
    const py = (ent.y + 1) * TILE;
    props.push({
      type: ent.t,
      cx: px,
      bottom: py,
      tx: ent.x,
      ty: ent.y,
      id: ent.id || `${def.id}:${ent.t}:${ent.x}:${ent.y}`,
      ...ent,
    });
  }

  const room = {
    ...def,
    rows,
    w,
    h,
    pxW: w * TILE,
    pxH: h * TILE,
    solid,
    oneWay,
    spike,
    water,
    enemies,
    props,
    exits: (def.exits || []).map((e) => ({
      ...e,
      px: e.x * TILE,
      py: e.y * TILE,
      pw: e.w * TILE,
      ph: e.h * TILE,
    })),
    spawns: def.spawns || {},
    spikeRects: [],
    palette: paletteFor(def.zone),
    time: 0,
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (spike[y * w + x]) {
        room.spikeRects.push({
          x: x * TILE + 3,
          y: y * TILE + TILE * 0.42,
          w: TILE - 6,
          h: TILE * 0.58,
        });
      }
    }
  }

  return room;
}

export function inRoom(room, tx, ty) {
  return tx >= 0 && ty >= 0 && tx < room.w && ty < room.h;
}

export function solidAt(room, tx, ty) {
  if (tx < 0 || tx >= room.w || ty < 0) return true;
  if (ty >= room.h) return false;
  return room.solid[ty * room.w + tx] === 1;
}

export function oneWayAt(room, tx, ty) {
  if (tx < 0 || tx >= room.w || ty < 0 || ty >= room.h) return false;
  return room.oneWay[ty * room.w + tx] === 1;
}

export function pointSolid(room, px, py) {
  return solidAt(room, Math.floor(px / TILE), Math.floor(py / TILE));
}

export function rectHitsSolid(room, r) {
  const x0 = Math.floor(r.x / TILE);
  const x1 = Math.floor((r.x + r.w) / TILE);
  const y0 = Math.floor(r.y / TILE);
  const y1 = Math.floor((r.y + r.h) / TILE);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (solidAt(room, x, y)) return true;
    }
  }
  return false;
}

function moveX(body, room, dx) {
  if (dx === 0) return;
  body.x += dx;
  const y0 = Math.floor((body.y + 2) / TILE);
  const y1 = Math.floor((body.y + body.h - 2) / TILE);
  if (dx > 0) {
    const tx = Math.floor((body.x + body.w) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      if (solidAt(room, tx, ty)) {
        body.x = tx * TILE - body.w - 0.01;
        body.vx = 0;
        body.onWallR = true;
        break;
      }
    }
  } else {
    const tx = Math.floor(body.x / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      if (solidAt(room, tx, ty)) {
        body.x = (tx + 1) * TILE + 0.01;
        body.vx = 0;
        body.onWallL = true;
        break;
      }
    }
  }
  body.x = clamp(body.x, 0, room.pxW - body.w);
}

function moveY(body, room, dy) {
  if (dy === 0) return;
  const prevBottom = body.y + body.h;
  body.y += dy;
  const x0 = Math.floor((body.x + 2) / TILE);
  const x1 = Math.floor((body.x + body.w - 2) / TILE);

  if (dy > 0) {
    const ty = Math.floor((body.y + body.h) / TILE);
    for (let tx = x0; tx <= x1; tx++) {
      if (solidAt(room, tx, ty)) {
        body.y = ty * TILE - body.h - 0.001;
        body.vy = 0;
        body.onGround = true;
        break;
      }
      const top = ty * TILE;
      if (
        body.dropTimer <= 0 &&
        oneWayAt(room, tx, ty) &&
        prevBottom <= top + 1.5
      ) {
        body.y = top - body.h - 0.001;
        body.vy = 0;
        body.onGround = true;
        break;
      }
    }
  } else {
    const ty = Math.floor(body.y / TILE);
    for (let tx = x0; tx <= x1; tx++) {
      if (solidAt(room, tx, ty)) {
        body.y = (ty + 1) * TILE + 0.001;
        body.vy = 0;
        break;
      }
    }
  }

  if (body.y < 0) {
    body.y = 0;
    if (body.vy < 0) body.vy = 0;
  }
}

export function moveBody(body, room, dt, opts = {}) {
  body.onGround = false;
  body.onWallL = false;
  body.onWallR = false;
  if (body.dropTimer === undefined) body.dropTimer = 0;
  if (body.dropTimer > 0) body.dropTimer -= dt;

  const totalX = (body.vx || 0) * dt;
  const totalY = (body.vy || 0) * dt;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(totalX), Math.abs(totalY)) / 7));
  for (let i = 0; i < steps; i++) {
    moveX(body, room, totalX / steps);
    moveY(body, room, totalY / steps);
  }
  clearOneWay(body);
  return body;
}

// If we finished the tick standing on a one-way platform, mark it so
// callers can implement drop-through.
function clearOneWay(body) {
  // placeholder hook kept for future drop-through support
}

export function hasFloorAhead(room, x, bottom, dir) {
  const tx = Math.floor((x + dir * 22) / TILE);
  const ty = Math.floor((bottom + 6) / TILE);
  return solidAt(room, tx, ty) || oneWayAt(room, tx, ty);
}

export function playerSpawn(room, name) {
  const s = room.spawns[name] || room.spawns.start || room.spawns.default;
  if (!s) return { x: room.pxW / 2, y: room.pxH - 4 * TILE };
  if (Array.isArray(s)) return { x: s[0] * TILE + TILE / 2, y: s[1] * TILE };
  return { x: s.x * TILE + TILE / 2, y: s.y * TILE };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function renderTerrain(ctx, room, time) {
  const pal = room.palette;
  const T = TILE;
  const W = room.w;
  const H = room.h;
  const solid = room.solid;

  // ---- rock mass -------------------------------------------------------
  // Collect horizontal runs so we can both fill and later clip cheaply.
  const runs = [];
  for (let y = 0; y < H; y++) {
    let run = -1;
    for (let x = 0; x <= W; x++) {
      const on = x < W && solid[y * W + x] === 1;
      if (on && run < 0) run = x;
      if (!on && run >= 0) {
        runs.push([run, y, x - run]);
        run = -1;
      }
    }
  }

  ctx.fillStyle = pal.terrain;
  for (const [x, y, w] of runs) ctx.fillRect(x * T, y * T, w * T, T);

  // Depth: darken the body of the rock toward the bottom of the room.
  if (runs.length) {
    ctx.save();
    ctx.beginPath();
    for (const [x, y, w] of runs) ctx.rect(x * T, y * T, w * T, T);
    ctx.clip();
    const depth = ctx.createLinearGradient(0, 0, 0, room.pxH);
    depth.addColorStop(0, 'rgba(0,0,0,0)');
    depth.addColorStop(0.7, 'rgba(0,0,0,0.22)');
    depth.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = depth;
    ctx.fillRect(0, 0, room.pxW, room.pxH);
    ctx.restore();
  }

  // ---- exposed faces ---------------------------------------------------
  const surfaces = [];
  const sides = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!solid[i]) continue;
      if (y === 0 || !solid[i - W]) surfaces.push([x, y]);
      const openL = x > 0 && !solid[i - 1];
      const openR = x < W - 1 && !solid[i + 1];
      if (openL) sides.push([x, y, -1]);
      if (openR) sides.push([x, y, 1]);
    }
  }

  // Rock lip just under the rim: a soft lit band, then the bright edge.
  ctx.fillStyle = hexA(pal.terrainTop, 0.1);
  for (const [x, y] of surfaces) ctx.fillRect(x * T, y * T + 2, T, 7);

  // Continuous bright rim: filled bands tile edge-to-edge (no dashes).
  ctx.fillStyle = pal.terrainTop;
  for (const [x, y] of surfaces) ctx.fillRect(x * T, y * T, T, 2.5);
  ctx.fillStyle = hexA(pal.terrainEdge, 0.85);
  for (const [x, y] of surfaces) ctx.fillRect(x * T, y * T + 1.5, T, 1);

  // Vertical faces get a cooler, dimmer rim so shafts read clearly.
  ctx.fillStyle = hexA(pal.terrainEdge, 0.5);
  for (const [x, y, dir] of sides) {
    ctx.fillRect(dir < 0 ? x * T : (x + 1) * T - 1.5, y * T + 2, 1.5, T - 2);
  }

  // ---- surface detail: moss tufts, drips, pebbles ----------------------
  const rng = new RNG(room.id + ':rock');
  ctx.lineCap = 'round';
  for (const [x, y] of surfaces) {
    const px = x * T;
    const py = y * T;
    const roll = rng.next();
    if (roll < 0.34) {
      // hanging moss strands
      const n = 2 + ((rng.next() * 3) | 0);
      ctx.strokeStyle = hexA(pal.terrainEdge, 0.42 + rng.next() * 0.2);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const sx = px + 3 + rng.next() * (T - 6);
        const len = 3 + rng.next() * 7;
        ctx.moveTo(sx, py + 2);
        ctx.quadraticCurveTo(sx + 1.5, py + 2 + len * 0.6, sx - 1, py + 2 + len);
      }
      ctx.stroke();
    } else if (roll < 0.5) {
      // a low pebble jutting up
      ctx.fillStyle = hexA(pal.terrainTop, 0.55);
      const sx = px + 4 + rng.next() * (T - 12);
      ctx.beginPath();
      ctx.ellipse(sx, py + 1, 3.2, 2.2, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
  }

  // Internal cracks / strata.
  ctx.strokeStyle = hexA(pal.terrainEdge, 0.2);
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 110; i++) {
    const x = rng.float(room.pxW, 0);
    const y = rng.float(room.pxH, 0);
    if (!pointSolid(room, x, y)) continue;
    const len = rng.float(24, 6);
    ctx.moveTo(x, y);
    ctx.lineTo(x + rng.float(9, -9), y + len);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';

  // ---- one-way platform slabs -----------------------------------------
  for (let y = 0; y < H; y++) {
    let run = -1;
    for (let x = 0; x <= W; x++) {
      const on = x < W && room.oneWay[y * W + x] === 1;
      if (on && run < 0) run = x;
      if (!on && run >= 0) {
        drawPlatformSlab(ctx, pal, run * T, y * T, (x - run) * T);
        run = -1;
      }
    }
  }

  // ---- spikes ----------------------------------------------------------
  for (const s of room.spikeRects) {
    const count = Math.max(2, Math.round(s.w / 12));
    const step = s.w / count;
    // base bar so the row reads as anchored
    ctx.fillStyle = hexA(pal.terrainEdge, 0.35);
    ctx.fillRect(s.x, s.y + s.h - 3, s.w, 3);
    for (let i = 0; i < count; i++) {
      const sx = s.x + i * step;
      ctx.fillStyle = '#0b0e14';
      ctx.beginPath();
      ctx.moveTo(sx, s.y + s.h);
      ctx.lineTo(sx + step / 2, s.y - 3);
      ctx.lineTo(sx + step, s.y + s.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = hexA(pal.terrainEdge, 0.9);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + step * 0.2, s.y + s.h - 1);
      ctx.lineTo(sx + step / 2, s.y - 2);
      ctx.stroke();
      ctx.strokeStyle = hexA(pal.light, 0.35);
      ctx.beginPath();
      ctx.moveTo(sx + step * 0.42, s.y + s.h - 2);
      ctx.lineTo(sx + step / 2, s.y + 1);
      ctx.stroke();
    }
  }

  // ---- water -----------------------------------------------------------
  for (let y = 0; y < H; y++) {
    let run = -1;
    for (let x = 0; x <= W; x++) {
      const on = x < W && room.water[y * W + x] === 1;
      if (on && run < 0) run = x;
      if (!on && run >= 0) {
        const px = run * T;
        const pw = (x - run) * T;
        const py = y * T;
        const topOnly = y === 0 || !room.water[(y - 1) * W + run];
        const deep = 1 - Math.min(1, y / Math.max(1, H));
        ctx.fillStyle = hexA(pal.water, 0.34 + 0.16 * deep);
        ctx.fillRect(px, py, pw, T);
        // faint caustic ripples
        ctx.strokeStyle = hexA(pal.light, 0.08);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let xx = 4; xx < pw; xx += 16) {
          const yy = py + T * 0.55 + Math.sin(time * 1.6 + (px + xx) * 0.06) * 2;
          ctx.moveTo(px + xx, yy);
          ctx.lineTo(px + xx + 8, yy);
        }
        ctx.stroke();
        if (topOnly) {
          ctx.fillStyle = hexA(pal.light, 0.06);
          ctx.fillRect(px, py, pw, 4);
          ctx.strokeStyle = hexA(pal.glow, 0.4);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          for (let xx = 0; xx <= pw; xx += 6) {
            const yy = py + 1 + Math.sin(time * 2 + (px + xx) * 0.05) * 2;
            if (xx === 0) ctx.moveTo(px + xx, yy);
            else ctx.lineTo(px + xx, yy);
          }
          ctx.stroke();
        }
        run = -1;
      }
    }
  }
}

function drawPlatformSlab(ctx, pal, x, y, w) {
  const top = y + 1;
  // soft drop shadow under the slab
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + 2, top + 10, w - 4, 4);

  // slab body, rounded
  ctx.fillStyle = pal.terrain;
  roundRectPath(ctx, x, top, w, 9, 3);
  ctx.fill();

  // inner shade along the underside for thickness
  ctx.fillStyle = hexA('#000000', 0.35);
  ctx.fillRect(x + 2, top + 7, w - 4, 2);

  // bright top edge + warm highlight
  ctx.fillStyle = pal.terrainTop;
  ctx.fillRect(x + 1, top, w - 2, 2.5);
  ctx.fillStyle = hexA(pal.terrainEdge, 0.9);
  ctx.fillRect(x + 1, top + 1.8, w - 2, 1);

  // end caps
  ctx.fillStyle = hexA(pal.terrainEdge, 0.55);
  ctx.fillRect(x + 0.5, top + 1, 1.5, 7);
  ctx.fillRect(x + w - 2, top + 1, 1.5, 7);

  // rivets / wear marks
  ctx.fillStyle = hexA(pal.terrainEdge, 0.4);
  for (let i = 10; i < w - 6; i += 22) {
    ctx.fillRect(x + i, top + 4.5, 2, 2);
  }
}

export function drawExits(ctx, room, time, unlocked) {
  const pal = room.palette;
  for (const e of room.exits) {
    const cx = e.px + e.pw / 2;
    const cy = e.py + e.ph / 2;
    const locked = e.need && !unlocked(e.need);

    // arch glow
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(e.pw, e.ph) * 0.9);
    g.addColorStop(0, hexA(pal.light, locked ? 0.05 : 0.16));
    g.addColorStop(1, hexA(pal.light, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - 80, cy - 100, 160, 200);

    ctx.strokeStyle = locked ? hexA('#c2456a', 0.45) : hexA(pal.light, 0.3);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(e.px + 2, e.py + e.ph);
    ctx.lineTo(e.px + 2, e.py + 10);
    ctx.quadraticCurveTo(cx, e.py - 8, e.px + e.pw - 2, e.py + 10);
    ctx.lineTo(e.px + e.pw - 2, e.py + e.ph);
    ctx.stroke();

    if (locked) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = '#c2456a';
      ctx.lineWidth = 1.4;
      const r = 11;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = '#c2456a';
      ctx.fill();
      ctx.restore();
    }
  }
}

export function clampToRoom(room, body) {
  body.x = clamp(body.x, 0, room.pxW - body.w);
  body.y = clamp(body.y, 0, room.pxH - body.h);
}

export function hexA(hex, a) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
