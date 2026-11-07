import { RNG } from '../core/rng.js';
import { paletteFor } from './palette.js';
import { VIEW_W, VIEW_H } from '../config.js';

const gradientCache = new Map();

function getGradient(ctx, zone, pal) {
  if (gradientCache.has(zone)) return gradientCache.get(zone);
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, pal.sky[0]);
  g.addColorStop(0.55, pal.sky[1]);
  g.addColorStop(1, pal.sky[2]);
  gradientCache.set(zone, g);
  return g;
}

function hexPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + i * (Math.PI / 3);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// A small clump of hexagonal hive cells, used at every depth for identity.
function combCluster(ctx, pal, cx, cy, r, rng, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const cells = [[cx, cy, r]];
  const n = 3 + ((rng.next() * 4) | 0);
  for (let i = 0; i < n; i++) {
    const a = rng.angle();
    const d = r * 1.68;
    cells.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * rng.float(0.95, 0.5)]);
  }
  for (const [x, y, rr] of cells) {
    hexPath(ctx, x, y, rr);
    ctx.fillStyle = pal.far;
    ctx.fill();
    ctx.strokeStyle = hexA(pal.mid, 0.75);
    ctx.lineWidth = Math.max(1, rr * 0.075);
    ctx.stroke();
    // inner cell shadow so combs read as hollow
    hexPath(ctx, x, y, rr * 0.62);
    ctx.fillStyle = hexA('#000000', 0.35);
    ctx.fill();
  }
  ctx.restore();
}

export function drawBackdrop(ctx, room, cam, time) {
  const pal = paletteFor(room.zone);
  ctx.fillStyle = getGradient(ctx, room.zone, pal);
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const rng = new RNG(room.id + ':bg');
  const w = room.pxW;
  const h = room.pxH;

  // ---- far layer: distant hive architecture ---------------------------
  ctx.save();
  ctx.translate(-cam.x * 0.16, -cam.y * 0.12);

  // cathedral arches / broken colonnades
  ctx.fillStyle = pal.far;
  const arches = 5 + rng.int(0, 4);
  for (let i = 0; i < arches; i++) {
    const x = rng.float(w + 900, -500);
    const width = rng.float(240, 90);
    const top = rng.float(h * 0.58, h * 0.14);
    const base = h + 160;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(x - width / 2, base);
    ctx.lineTo(x - width * 0.36, top + width * 0.4);
    ctx.quadraticCurveTo(x, top - width * 0.36, x + width * 0.36, top + width * 0.4);
    ctx.lineTo(x + width / 2, base);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // comb clusters nested high in the dark
  for (let i = 0; i < 9; i++) {
    combCluster(
      ctx, pal,
      rng.float(w + 700, -350),
      rng.float(h * 0.55, h * 0.03),
      rng.float(58, 22),
      rng,
      0.5 + rng.next() * 0.22,
    );
  }

  // giant distant roots
  ctx.strokeStyle = pal.far;
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const x = rng.float(w + 700, -300);
    const top = -80;
    const len = rng.float(h * 0.9, h * 0.35);
    const sway = rng.float(180, -180);
    ctx.lineWidth = rng.float(24, 8);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.bezierCurveTo(x + sway, top + len * 0.3, x - sway * 0.6, top + len * 0.7, x + sway * 0.2, top + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ---- mid layer: pillars, combs, chains, lanterns --------------------
  ctx.save();
  ctx.translate(-cam.x * 0.5, -cam.y * 0.42);
  const midW = w + 560;

  // stone pillars holding the hive up
  const pillars = 4 + rng.int(0, 3);
  for (let i = 0; i < pillars; i++) {
    const x = rng.float(midW, -280);
    const pw = rng.float(46, 20);
    const base = h + 90;
    const top = rng.float(h * 0.3, -40);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = pal.mid;
    ctx.fillRect(x - pw / 2, top, pw, base - top);
    // capital + plinth
    ctx.fillRect(x - pw * 0.7, top, pw * 1.4, 12);
    ctx.fillRect(x - pw * 0.72, base - 18, pw * 1.44, 18);
    // faint lit edge
    ctx.fillStyle = hexA(pal.light, 0.06);
    ctx.fillRect(x - pw / 2, top + 12, 2, base - top - 30);
    ctx.globalAlpha = 1;
  }

  // hanging chains with small lanterns (no big bokeh blobs)
  const lanterns = 7 + rng.int(0, 4);
  for (let i = 0; i < lanterns; i++) {
    const x = rng.float(midW, -220);
    const y = rng.float(h * 0.4, -20);
    const len = rng.float(70, 24);
    ctx.strokeStyle = hexA(pal.mid, 0.9);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let yy = y; yy < y + len; yy += 6) {
      ctx.moveTo(x + Math.sin(yy * 0.4) * 1.4, yy);
      ctx.lineTo(x + Math.sin((yy + 3) * 0.4) * 1.4, yy + 3);
    }
    ctx.stroke();
    // lantern body
    const ly = y + len + 4;
    const g = ctx.createRadialGradient(x, ly, 0, x, ly, 26);
    g.addColorStop(0, hexA(pal.glow, 0.16));
    g.addColorStop(1, hexA(pal.glow, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, ly, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexA(pal.light, 0.5);
    ctx.beginPath();
    ctx.moveTo(x, ly - 5);
    ctx.lineTo(x + 4, ly);
    ctx.lineTo(x, ly + 5);
    ctx.lineTo(x - 4, ly);
    ctx.closePath();
    ctx.fill();
  }

  // combs clinging to the silhouettes
  for (let i = 0; i < 5; i++) {
    combCluster(
      ctx, pal,
      rng.float(midW, -260),
      rng.float(h * 0.7, h * 0.1),
      rng.float(46, 18),
      rng,
      0.7,
    );
  }

  // nearer vines
  ctx.strokeStyle = pal.mid;
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const x = rng.float(midW, -250);
    const top = -40;
    const len = rng.float(h * 0.5, h * 0.14);
    const sway = rng.float(80, -80);
    ctx.lineWidth = rng.float(6, 2);
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.bezierCurveTo(
      x + sway, top + len * 0.4,
      x - sway * 0.5, top + len * 0.75,
      x + sway * 0.3 + Math.sin(time * 0.4 + i) * 6, top + len,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ---- near silhouettes ------------------------------------------------
  ctx.save();
  ctx.translate(-cam.x * 0.8, -cam.y * 0.7);
  ctx.fillStyle = pal.near;
  for (let i = 0; i < 8; i++) {
    const x = rng.float(w + 400, -200);
    const base = h + 60;
    const height = rng.float(210, 60);
    const width = rng.float(100, 28);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(x - width, base);
    ctx.quadraticCurveTo(x - width * 0.35, base - height * 0.8, x, base - height);
    ctx.quadraticCurveTo(x + width * 0.35, base - height * 0.8, x + width, base);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // ---- ambient motes ---------------------------------------------------
  drawMotes(ctx, room, cam, time, pal);

  // ---- lighter bottom haze (rooms used to drown in it) -----------------
  const haze = ctx.createLinearGradient(0, VIEW_H * 0.68, 0, VIEW_H);
  haze.addColorStop(0, hexA(pal.fog, 0));
  haze.addColorStop(1, hexA(pal.fog, 0.55));
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // ---- biomes weather & wildlife --------------------------------------
  if (room.zone === 'sporefall' || room.zone === 'rootway') {
    drawForestLeaves(ctx, room, cam, time, pal);
    drawFireflies(ctx, room, cam, time, pal);
  } else if (room.zone === 'ember') {
    drawEmbers(ctx, room, cam, time, pal);
  } else if (room.zone === 'cistern') {
    drawWaterDrips(ctx, room, cam, time, pal);
  } else if (room.zone === 'reliquary') {
    drawSnow(ctx, room, cam, time, pal);
  } else if (room.zone === 'cradle' || room.zone === 'vault') {
    drawAshWinds(ctx, room, cam, time, pal);
  }

  if (room.zone === 'choir') drawChoirLights(ctx, room, cam, time, pal);
  drawWildlife(ctx, room, cam, time, pal);
}

// Foreground framing: roots and vines that pass in front of the knight but
// stay out of the middle of the screen so gameplay remains readable.
export function drawForeground(ctx, room, cam, time) {
  const pal = paletteFor(room.zone);
  const rng = new RNG(room.id + ':fg');
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.lineCap = 'round';

  for (let i = 0; i < 5; i++) {
    const x = rng.float(VIEW_W + 80, -40) + Math.sin(time * 0.2 + i) * 2;
    const len = rng.float(150, 46);
    const sway = rng.float(40, -40);
    const thick = rng.float(16, 5);
    ctx.strokeStyle = '#04060a';
    ctx.lineWidth = thick;
    ctx.beginPath();
    ctx.moveTo(x, -30);
    ctx.bezierCurveTo(
      x + sway, len * 0.35,
      x - sway * 0.6, len * 0.7,
      x + sway * 0.25, len,
    );
    ctx.stroke();
    // thin rim so the root does not vanish into the dark
    ctx.strokeStyle = hexA(pal.near, 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + thick * 0.35, -20);
    ctx.bezierCurveTo(
      x + sway + thick * 0.35, len * 0.35,
      x - sway * 0.6 + thick * 0.35, len * 0.7,
      x + sway * 0.25 + thick * 0.35, len,
    );
    ctx.stroke();
  }

  // corner rocks / grass framing the bottom edge
  for (const side of [0, 1]) {
    const bx = side === 0 ? -20 : VIEW_W + 20;
    const dir = side === 0 ? 1 : -1;
    ctx.fillStyle = '#05070b';
    ctx.beginPath();
    ctx.moveTo(bx, VIEW_H);
    ctx.quadraticCurveTo(bx + dir * 70, VIEW_H - 70, bx + dir * 150, VIEW_H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexA(pal.near, 0.35);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx + dir * 20, VIEW_H);
    ctx.quadraticCurveTo(bx + dir * 74, VIEW_H - 66, bx + dir * 148, VIEW_H);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMotes(ctx, room, cam, time, pal) {
  const rng = new RNG(room.id + ':motes');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const count = 24;
  for (let i = 0; i < count; i++) {
    const bx = rng.float(room.pxW, 0);
    const by = rng.float(room.pxH, 0);
    const speed = rng.float(0.5, 0.12);
    const phase = rng.float(Math.PI * 2, 0);
    const size = rng.float(2.2, 0.7);
    const x = bx - cam.x * 0.62 + Math.sin(time * speed + phase) * 26;
    const y = by - cam.y * 0.58 + Math.cos(time * speed * 0.7 + phase) * 20;
    ctx.globalAlpha = 0.14 + 0.14 * Math.sin(time * 1.4 + phase);
    ctx.fillStyle = pal.glow;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEmbers(ctx, room, cam, time, pal) {
  const rng = new RNG(room.id + ':embers');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 24; i++) {
    const bx = rng.float(room.pxW, 0);
    const by = rng.float(room.pxH, 0);
    const speed = rng.float(34, 10);
    const phase = rng.float(room.pxH, 0);
    const x = bx - cam.x * 0.7 + Math.sin(time * 0.8 + i) * 14;
    const y = ((by - cam.y * 0.65 - time * speed - phase) % room.pxH + room.pxH) % room.pxH;
    ctx.globalAlpha = 0.32 + 0.28 * Math.sin(time * 2 + i);
    ctx.fillStyle = pal.light;
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSnow(ctx, room, cam, time, pal) {
  const rng = new RNG(room.id + ':snow');
  ctx.save();
  for (let i = 0; i < 30; i++) {
    const bx = rng.float(room.pxW, 0);
    const by = rng.float(room.pxH, 0);
    const speed = rng.float(24, 8);
    const x = bx - cam.x * 0.75 + Math.sin(time * 0.5 + i) * 18;
    const y = (by - cam.y * 0.7 + time * speed) % room.pxH;
    ctx.globalAlpha = 0.16 + 0.18 * Math.sin(time + i);
    ctx.fillStyle = pal.accent;
    ctx.beginPath();
    ctx.arc(x, y, rng.float(2, 0.8), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawChoirLights(ctx, room, cam, time, pal) {
  const rng = new RNG(room.id + ':choir');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 8; i++) {
    const x = rng.float(room.pxW, 0) - cam.x * 0.5;
    const y = rng.float(room.pxH * 0.5, 40) - cam.y * 0.4 + Math.sin(time * 0.6 + i * 1.7) * 26;
    const r = 5 + Math.sin(time * 1.2 + i) * 1.6;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, hexA(pal.light, 0.16));
    g.addColorStop(1, hexA(pal.light, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexA(pal.accent, 0.8);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawForestLeaves(ctx, room, cam, time, pal) {
  const rng = new RNG(room.id + ':leaves');
  ctx.save();
  for (let i = 0; i < 24; i++) {
    const bx = rng.float(room.pxW, 0);
    const by = rng.float(room.pxH, 0);
    const speedY = rng.float(26, 12);
    const speedX = rng.float(18, 6);
    const phase = rng.float(Math.PI * 2, 0);
    const x = ((bx - cam.x * 0.72 + time * speedX + Math.sin(time * 1.5 + phase) * 24) % room.pxW + room.pxW) % room.pxW;
    const y = ((by - cam.y * 0.68 + time * speedY) % room.pxH + room.pxH) % room.pxH;
    const rot = time * 2 + phase;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = 0.45 + 0.25 * Math.sin(time * 1.2 + i);
    ctx.fillStyle = i % 3 === 0 ? '#4e7a54' : (i % 2 === 0 ? '#638f4d' : '#94a858');
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawFireflies(ctx, room, cam, time, pal) {
  const rng = new RNG(room.id + ':fireflies');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) {
    const bx = rng.float(room.pxW, 0);
    const by = rng.float(room.pxH, 0);
    const x = bx - cam.x * 0.65 + Math.sin(time * 0.8 + i * 1.3) * 36;
    const y = by - cam.y * 0.6 + Math.cos(time * 0.6 + i * 0.9) * 28;
    const glow = Math.max(0, Math.sin(time * 2.2 + i * 2.4));
    if (glow <= 0.05) continue;

    ctx.globalAlpha = glow * 0.65;
    ctx.fillStyle = i % 2 === 0 ? '#98f070' : '#ffd560';
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = glow * 0.2;
    ctx.beginPath();
    ctx.arc(x, y, 7.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWaterDrips(ctx, room, cam, time, pal) {
  const rng = new RNG(room.id + ':waterdrips');
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const x = rng.float(room.pxW - 40, 40) - cam.x * 0.7;
    const cycle = (time * rng.float(0.7, 0.35) + i * 0.7) % 2.5; // 0 to 2.5 sec
    const floorY = room.pxH - 30;

    if (cycle < 1.2) {
      // Falling drip
      const fallT = cycle / 1.2;
      const dripY = (fallT * fallT) * (floorY - 20);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#9bd0e8';
      ctx.beginPath();
      ctx.ellipse(x, dripY - cam.y * 0.7, 1.4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Impact ripple
      const rippleT = (cycle - 1.2) / 1.3;
      const r = rippleT * 22;
      ctx.globalAlpha = (1 - rippleT) * 0.45;
      ctx.strokeStyle = '#a4dcf5';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(x, floorY - cam.y * 0.7, r, r * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawAshWinds(ctx, room, cam, time, pal) {
  const rng = new RNG(room.id + ':ashwinds');
  ctx.save();
  for (let i = 0; i < 28; i++) {
    const bx = rng.float(room.pxW, 0);
    const by = rng.float(room.pxH, 0);
    const speedX = rng.float(85, 35);
    const x = ((bx - cam.x * 0.65 + time * speedX) % room.pxW + room.pxW) % room.pxW;
    const y = by - cam.y * 0.6 + Math.sin(time * 1.2 + i) * 6;

    ctx.globalAlpha = 0.22 + 0.18 * Math.sin(time * 2 + i);
    ctx.fillStyle = i % 2 === 0 ? '#d4b080' : '#8c8078';
    ctx.beginPath();
    ctx.arc(x, y, rng.float(1.6, 0.7), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWildlife(ctx, room, cam, time, pal) {
  const rng = new RNG(room.id + ':wildlife');
  ctx.save();
  const count = 3;
  for (let i = 0; i < count; i++) {
    const speed = rng.float(38, 20);
    const startX = rng.float(room.pxW + 400, -300);
    const startY = rng.float(room.pxH * 0.45, 60);
    const x = ((startX - cam.x * 0.25 - time * speed) % (room.pxW + 700) + (room.pxW + 700)) % (room.pxW + 700) - 350;
    const y = startY - cam.y * 0.2 + Math.sin(time * 0.8 + i * 2) * 22;

    const wingSpan = 8 + (i % 2) * 4;
    const wingFlap = Math.sin(time * 8 + i * 3);

    ctx.globalAlpha = 0.35;
    ctx.fillStyle = pal.far;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - wingSpan, y - wingFlap * (wingSpan * 0.7));
    ctx.lineTo(x - wingSpan * 0.6, y);
    ctx.lineTo(x, y + 2);
    ctx.lineTo(x + wingSpan * 0.6, y);
    ctx.lineTo(x + wingSpan, y - wingFlap * (wingSpan * 0.7));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function hexA(hex, a) {
  if (hex.startsWith('rgb')) return hex;
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
