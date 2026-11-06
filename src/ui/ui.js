// All screen-space UI: HUD, menus, map, dialogue, shop, title, endings.
import { VIEW_W, VIEW_H, TILE } from '../config.js';
import { clamp, formatTime, TAU, lerp, easeOutCubic } from '../core/math.js';
import { ROOM_LIST } from '../data/rooms.js';
import { hexA } from '../world/room.js';
import { audio } from '../core/audio.js';

const BONE = '#e9e5da';
const DIM = '#8b96ab';
const GOLD = '#ffcf8e';
const GLOW = '#bfe6ff';

function setFont(ctx, size, weight = 'normal', family = 'Georgia, "Times New Roman", serif') {
  ctx.font = `${weight} ${size}px ${family}`;
}

function text(ctx, str, x, y, opts = {}) {
  const {
    size = 18, color = BONE, align = 'left', baseline = 'alphabetic',
    alpha = 1, weight = 'normal', spacing = 0, glow = 0, glowColor = GLOW,
  } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  setFont(ctx, size, weight);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  if (spacing) ctx.letterSpacing = spacing + 'px';
  if (glow) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glow;
  }
  ctx.fillText(str, x, y);
  ctx.restore();
}

function wrap(ctx, str, maxWidth, size) {
  setFont(ctx, size);
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function panel(ctx, x, y, w, h, alpha = 0.82) {
  ctx.save();
  ctx.fillStyle = `rgba(5,8,14,${alpha})`;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(170,195,235,0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.restore();
}

export function drawVignette(ctx, game) {
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.9);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const bottom = ctx.createLinearGradient(0, VIEW_H - 150, 0, VIEW_H);
  bottom.addColorStop(0, 'rgba(3,5,9,0)');
  bottom.addColorStop(1, 'rgba(3,5,9,0.5)');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, VIEW_H - 150, VIEW_W, 150);

  if (game.mode === 'dead') {
    ctx.save();
    ctx.fillStyle = `rgba(80,10,18,${clamp(game.deathTimer / 2, 0, 0.45)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
export function drawHUD(ctx, game) {
  const p = game.player;
  if (!p) return;

  // masks
  const maskY = 26;
  for (let i = 0; i < p.maxHp; i++) {
    const x = 28 + i * 26;
    ctx.save();
    ctx.translate(x, maskY);
    ctx.fillStyle = i < p.hp ? '#e7e1d3' : '#1b2230';
    ctx.strokeStyle = i < p.hp ? 'rgba(255,255,255,0.25)' : 'rgba(160,180,210,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 11, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    if (i < p.hp) {
      ctx.fillStyle = '#0a0c11';
      ctx.beginPath();
      ctx.ellipse(-3.2, 0.5, 1.9, 3.1, -0.2, 0, TAU);
      ctx.ellipse(3.2, 0.5, 1.9, 3.1, 0.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // soul orb
  const ox = 44;
  const oy = VIEW_H - 54;
  const r = 19;
  ctx.save();
  ctx.beginPath();
  ctx.arc(ox, oy, r, 0, TAU);
  ctx.fillStyle = 'rgba(8,12,18,0.8)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,200,235,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  const frac = clamp(p.soul / p.maxSoul, 0, 1);
  if (frac > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(ox, oy, r - 2, 0, TAU);
    ctx.clip();
    const level = oy + r - frac * (r * 2);
    const g = ctx.createLinearGradient(0, oy + r, 0, oy - r);
    g.addColorStop(0, '#6fd0ff');
    g.addColorStop(1, '#d6f2ff');
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(ox, oy, r - 2, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#0a1622';
    ctx.fillRect(ox - r, oy - r, r * 2, level - (oy - r));
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(game.time * 3);
    ctx.fillStyle = '#9fdcff';
    ctx.beginPath();
    ctx.arc(ox, oy, r + 7, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // shards
  const sx = 80;
  const sy = VIEW_H - 26;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 6);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  text(ctx, String(game.shards), sx + 12, sy + 5, { size: 14, color: '#d8c9a8' });

  // boss bar
  if (game.boss && (game.boss.introDone || game.boss.state === 'intro')) {
    drawBossBar(ctx, game);
  }

  // room name
  if (game.roomToastT > 0) {
    const a = clamp(game.roomToastT / 1.2, 0, 1) * clamp((3.2 - game.roomToastT) / 0.4, 0, 1);
    text(ctx, game.roomToast.toUpperCase(), VIEW_W / 2, 88, {
      size: 15, color: '#c9d4e4', align: 'center', spacing: 5, alpha: a * 0.85,
    });
    ctx.save();
    ctx.globalAlpha = a * 0.35;
    ctx.strokeStyle = '#9fb8d8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(VIEW_W / 2 - 90, 96);
    ctx.lineTo(VIEW_W / 2 + 90, 96);
    ctx.stroke();
    ctx.restore();
  }

  // toast
  if (game.toastT > 0) {
    const a = clamp(game.toastT / 0.4, 0, 1);
    text(ctx, game.toastText, VIEW_W / 2, VIEW_H - 96, {
      size: 16, color: '#e4e9f2', align: 'center', alpha: a * 0.9,
    });
  }

  // hints
  text(ctx, 'TAB map    ESC pause', VIEW_W - 24, VIEW_H - 20, {
    size: 11, color: 'rgba(150,168,194,0.55)', align: 'right', spacing: 1,
  });
}

function drawBossBar(ctx, game) {
  const b = game.boss;
  const w = 540;
  const x = (VIEW_W - w) / 2;
  const y = 34;
  const frac = clamp(b.hp / b.maxHp, 0, 1);
  text(ctx, b.def.name.toUpperCase(), VIEW_W / 2, y - 8, {
    size: 13, color: '#d9c9be', align: 'center', spacing: 4,
  });
  ctx.save();
  ctx.fillStyle = 'rgba(8,8,12,0.75)';
  ctx.fillRect(x, y, w, 8);
  ctx.fillStyle = b.phaseIndex >= 2 ? '#ff5a5a' : '#c96a5a';
  ctx.fillRect(x, y, w * frac, 8);
  ctx.strokeStyle = 'rgba(200,170,160,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 7);
  // phase marks
  for (const t of b.phaseThresholds) {
    const px = x + w * t;
    ctx.strokeStyle = 'rgba(230,210,200,0.45)';
    ctx.beginPath();
    ctx.moveTo(px, y - 2);
    ctx.lineTo(px, y + 10);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawPrompt(ctx, game, prop) {
  const cam = game.camera;
  const sx = prop.x - cam.x + cam.ox;
  const sy = prop.y - cam.y + cam.oy - 78;
  if (sx < 40 || sx > VIEW_W - 40 || sy < 40 || sy > VIEW_H - 40) return;
  const pulse = 0.75 + Math.sin(game.time * 4) * 0.15;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = 'rgba(8,12,18,0.78)';
  ctx.beginPath();
  ctx.arc(sx, sy, 12, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(210,230,255,0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, 'E', sx, sy + 5, { size: 12, color: '#e8f1ff', align: 'center' });
  const label = prop.type === 'bench' ? 'Rest'
    : prop.type === 'vendor' ? 'Trade'
    : prop.type === 'npc' ? (prop.name || 'Speak')
    : 'Read';
  text(ctx, label, sx, sy + 28, { size: 12, color: '#c9d6e8', align: 'center', alpha: 0.9 });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------
export function drawTitle(ctx, game) {
  const t = game.time;
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H * 0.42, 40, VIEW_W / 2, VIEW_H * 0.45, 760);
  g.addColorStop(0, '#141b2a');
  g.addColorStop(0.55, '#090d16');
  g.addColorStop(1, '#04060a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // distant arches
  ctx.save();
  ctx.strokeStyle = 'rgba(120,150,190,0.08)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const x = 140 + i * 260;
    ctx.beginPath();
    ctx.moveTo(x, VIEW_H);
    ctx.lineTo(x, 320);
    ctx.quadraticCurveTo(x + 90, 210, x + 180, 320);
    ctx.lineTo(x + 180, VIEW_H);
    ctx.stroke();
  }
  ctx.restore();

  // motes
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    const seed = i * 137.5;
    const x = (seed * 3.1) % VIEW_W;
    const y = ((seed * 5.7 + t * (8 + (i % 7) * 3)) % VIEW_H);
    const a = 0.05 + 0.12 * Math.abs(Math.sin(t * 0.8 + i));
    ctx.globalAlpha = a;
    ctx.fillStyle = i % 5 === 0 ? GOLD : GLOW;
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (i % 3) * 0.7, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  const glow = 0.5 + Math.sin(t * 1.1) * 0.12;
  text(ctx, 'NYM', VIEW_W / 2, 260, {
    size: 118, color: '#eef2f7', align: 'center', spacing: 26, glow: 40 * glow, glowColor: 'rgba(160,195,255,0.9)',
  });
  text(ctx, 'SONG OF THE SUNKEN HIVE', VIEW_W / 2, 306, {
    size: 13, color: '#8f9cb2', align: 'center', spacing: 8,
  });
  ctx.save();
  ctx.strokeStyle = 'rgba(150,180,220,0.25)';
  ctx.beginPath();
  ctx.moveTo(VIEW_W / 2 - 170, 330);
  ctx.lineTo(VIEW_W / 2 + 170, 330);
  ctx.stroke();
  ctx.restore();

  const hasSave = !!game.saveData;
  const labels = hasSave ? ['Continue', 'New Game', 'Options'] : ['New Game', 'Options'];
  const startY = 430;
  for (let i = 0; i < labels.length; i++) {
    const y = startY + i * 44;
    const selected = i === game.titleIndex;
    if (selected) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = GLOW;
      ctx.fillRect(VIEW_W / 2 - 150, y - 24, 300, 34);
      ctx.restore();
      text(ctx, '\u2726', VIEW_W / 2 - 122, y, { size: 12, color: GOLD, align: 'center', alpha: 0.9 });
    }
    text(ctx, labels[i], VIEW_W / 2, y, {
      size: selected ? 23 : 19,
      color: selected ? '#f2f6ff' : '#9aa6ba',
      align: 'center',
      spacing: 2,
      alpha: selected ? 1 : 0.8,
    });
  }

  if (hasSave) {
    const s = game.saveData;
    text(ctx, `${formatTime(s.playtime || 0)}   ${s.deaths || 0} deaths   ${s.shards || 0} shards`, VIEW_W / 2, 590, {
      size: 12, color: 'rgba(150,168,194,0.6)', align: 'center',
    });
  }

  text(ctx, 'A / D move    SPACE jump    J attack    I focus    E interact', VIEW_W / 2, VIEW_H - 56, {
    size: 11, color: 'rgba(140,158,184,0.5)', align: 'center', spacing: 1,
  });
  text(ctx, 'inspired by the quiet places between songs', VIEW_W / 2, VIEW_H - 28, {
    size: 10, color: 'rgba(110,126,150,0.4)', align: 'center', spacing: 1,
  });
}

// ---------------------------------------------------------------------------
// Pause / options
// ---------------------------------------------------------------------------
export function drawPause(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,5,9,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();

  text(ctx, 'PAUSED', VIEW_W / 2, 180, {
    size: 34, color: BONE, align: 'center', spacing: 12,
  });
  ctx.save();
  ctx.strokeStyle = 'rgba(150,180,220,0.25)';
  ctx.beginPath();
  ctx.moveTo(VIEW_W / 2 - 130, 202);
  ctx.lineTo(VIEW_W / 2 + 130, 202);
  ctx.stroke();
  ctx.restore();

  const items = ['Resume', 'Map', 'Options', 'Quit to Title'];
  for (let i = 0; i < items.length; i++) {
    const y = 270 + i * 46;
    const sel = i === game.pauseIndex;
    if (sel) text(ctx, '\u2726', VIEW_W / 2 - 112, y, { size: 12, color: GOLD, align: 'center' });
    text(ctx, items[i], VIEW_W / 2, y, {
      size: sel ? 24 : 19, color: sel ? '#f4f7ff' : '#939fb4', align: 'center', spacing: 2,
    });
  }

  const p = game.player;
  if (p) {
    text(ctx, `MASKS ${p.hp}/${p.maxHp}     SOUL ${Math.floor(p.soul)}/${p.maxSoul}     SHARDS ${game.shards}`, VIEW_W / 2, 520, {
      size: 12, color: '#9daabc', align: 'center', spacing: 1,
    });
    const abilities = [...p.abilities].map((a) => ({ dash: 'Dash', cling: 'Cling', wing: 'Wingbeat', spell: 'Wisp' }[a] || a));
    text(ctx, `GIFTS  ${abilities.length ? abilities.join('  ·  ') : 'none yet'}`, VIEW_W / 2, 548, {
      size: 12, color: '#8b98ac', align: 'center',
    });
  }
  text(ctx, `TIME ${formatTime(game.playtime)}     DEATHS ${game.deaths}     KILLS ${game.kills}`, VIEW_W / 2, 590, {
    size: 12, color: '#7f8ca1', align: 'center', spacing: 1,
  });
  text(ctx, 'ESC resume    ENTER select', VIEW_W / 2, 640, {
    size: 11, color: 'rgba(140,158,184,0.55)', align: 'center',
  });
}

export function drawOptions(ctx, game, back) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,5,9,0.8)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();

  panel(ctx, VIEW_W / 2 - 300, 190, 600, 340, 0.9);
  text(ctx, 'OPTIONS', VIEW_W / 2, 240, { size: 26, color: BONE, align: 'center', spacing: 8 });

  const s = game.settings;
  const rows = [
    ['Master volume', s.master],
    ['Music', s.music],
    ['Sound effects', s.sfx],
    ['Screen shake', s.shake ? 'ON' : 'OFF'],
    ['Bright flashes', s.flashes ? 'ON' : 'OFF'],
    ['Back', ''],
  ];
  for (let i = 0; i < rows.length; i++) {
    const y = 295 + i * 38;
    const sel = i === game.optionIndex;
    if (sel) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = GLOW;
      ctx.fillRect(VIEW_W / 2 - 260, y - 20, 520, 30);
      ctx.restore();
      text(ctx, '\u2726', VIEW_W / 2 - 238, y, { size: 11, color: GOLD, align: 'center' });
    }
    text(ctx, rows[i][0], VIEW_W / 2 - 210, y, {
      size: 16, color: sel ? '#eef4ff' : '#9aa7ba',
    });
    const v = rows[i][1];
    if (typeof v === 'number') {
      const barW = 150;
      const bx = VIEW_W / 2 + 60;
      ctx.save();
      ctx.fillStyle = 'rgba(120,140,170,0.18)';
      ctx.fillRect(bx, y - 10, barW, 8);
      ctx.fillStyle = sel ? GLOW : '#7f8fa8';
      ctx.fillRect(bx, y - 10, barW * v, 8);
      ctx.restore();
      text(ctx, Math.round(v * 100) + '%', VIEW_W / 2 + 250, y, {
        size: 13, color: sel ? '#dce8f8' : '#7f8ca1', align: 'right',
      });
    } else if (v) {
      text(ctx, v, VIEW_W / 2 + 250, y, {
        size: 13, color: sel ? GOLD : '#7f8ca1', align: 'right', spacing: 1,
      });
    }
  }
  text(ctx, 'ARROWS adjust    ENTER / ESC back', VIEW_W / 2, 560, {
    size: 11, color: 'rgba(140,158,184,0.55)', align: 'center',
  });
}

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------
export function drawMapScreen(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,5,9,0.86)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();

  text(ctx, 'THE HIVE', VIEW_W / 2, 76, { size: 24, color: BONE, align: 'center', spacing: 10 });
  text(ctx, 'every room you have walked', VIEW_W / 2, 100, {
    size: 11, color: 'rgba(150,168,194,0.6)', align: 'center', spacing: 2,
  });

  const rooms = ROOM_LIST;
  const xs = rooms.map((r) => r.map[0]);
  const ys = rooms.map((r) => r.map[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cellW = 58;
  const cellH = 40;
  const totalW = (maxX - minX + 1) * cellW;
  const totalH = (maxY - minY + 1) * cellH;
  const ox = VIEW_W / 2 - totalW / 2 + 20;
  const oy = VIEW_H / 2 - totalH / 2 + 30;

  const pos = (room) => ({
    x: ox + (room.map[0] - minX) * cellW,
    y: oy + (room.map[1] - minY) * cellH,
  });

  // connections
  ctx.save();
  ctx.strokeStyle = 'rgba(140,170,210,0.25)';
  ctx.lineWidth = 1.2;
  const seen = new Set();
  for (const room of rooms) {
    const visited = game.flags['visited:' + room.id];
    for (const ex of room.exits) {
      const target = ROOM_LIST.find((r) => r.id === ex.to);
      if (!target) continue;
      const key = [room.id, target.id].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const tv = game.flags['visited:' + target.id];
      if (!(visited || tv || game.flags.mapBought)) continue;
      const a = pos(room);
      const b = pos(target);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  ctx.restore();

  for (const room of rooms) {
    const visited = game.flags['visited:' + room.id];
    const revealed = game.flags.mapBought;
    if (!visited && !revealed) continue;
    const { x, y } = pos(room);
    const current = room.id === game.roomId;
    ctx.save();
    if (visited) {
      ctx.fillStyle = current ? 'rgba(255,207,142,0.28)' : 'rgba(120,150,190,0.16)';
      ctx.strokeStyle = current ? '#ffcf8e' : 'rgba(160,190,230,0.5)';
    } else {
      ctx.strokeStyle = 'rgba(120,145,175,0.2)';
    }
    ctx.lineWidth = current ? 1.8 : 1;
    ctx.beginPath();
    ctx.roundRect(x - 16, y - 11, 32, 22, 3);
    if (visited) ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (visited) {
      text(ctx, room.name.split(' ')[0], x, y + 26, {
        size: 8, color: current ? '#ffd9a0' : 'rgba(190,205,225,0.65)', align: 'center',
      });
      if (room.boss && !game.flags['boss_' + (room.boss.type === 'warden' ? 'warden' : room.boss.type === 'choir' ? 'choir' : 'moltguard')]) {
        text(ctx, '\u2620', x, y + 4, { size: 10, color: 'rgba(230,150,150,0.7)', align: 'center' });
      }
    }
  }

  text(ctx, 'TAB / ESC close', VIEW_W / 2, VIEW_H - 44, {
    size: 12, color: 'rgba(150,168,194,0.6)', align: 'center',
  });
}

// ---------------------------------------------------------------------------
// Dialogue
// ---------------------------------------------------------------------------
export function drawDialogue(ctx, game) {
  const d = game.dialogue;
  if (!d) return;
  const boxX = 200;
  const boxW = VIEW_W - 400;
  const boxY = VIEW_H - 210;
  const boxH = 132;

  ctx.save();
  ctx.fillStyle = 'rgba(2,4,8,0.4)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
  panel(ctx, boxX, boxY, boxW, boxH, 0.92);

  if (d.name) {
    text(ctx, d.name.toUpperCase(), boxX + 30, boxY - 15, {
      size: 12, color: GOLD, spacing: 3, alpha: 0.9,
    });
  }

  const full = d.lines[d.index] || '';
  const shown = full.slice(0, Math.floor(d.chars));
  const lines = wrap(ctx, shown, boxW - 60, 18);
  for (let i = 0; i < lines.length; i++) {
    text(ctx, lines[i], boxX + 30, boxY + 44 + i * 26, {
      size: 18, color: '#e3e8f1',
    });
  }

  const done = d.index >= d.lines.length - 1 && d.chars >= full.length;
  text(ctx, done ? 'E  close' : 'E  continue', boxX + boxW - 30, boxY + boxH - 18, {
    size: 11, color: 'rgba(170,190,215,0.7)', align: 'right', spacing: 1,
  });
}

// ---------------------------------------------------------------------------
// Shop
// ---------------------------------------------------------------------------
export function drawShop(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,5,9,0.8)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();

  const x = 240;
  const w = VIEW_W - 480;
  panel(ctx, x, 150, w, 430, 0.94);
  text(ctx, 'THE MERCHANT', VIEW_W / 2, 196, { size: 22, color: BONE, align: 'center', spacing: 6 });
  text(ctx, 'trade shards for small mercies', VIEW_W / 2, 218, {
    size: 11, color: 'rgba(150,168,194,0.65)', align: 'center',
  });

  ctx.save();
  ctx.translate(VIEW_W - 290, 190);
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(4, 0);
  ctx.lineTo(0, 6);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  text(ctx, String(game.shards), VIEW_W - 278, 196, { size: 15, color: '#e7d6b0' });

  const shop = game.shop;
  if (!shop) return;
  if (!shop.items.length) {
    text(ctx, 'I have nothing left to sell you.', VIEW_W / 2, 330, {
      size: 17, color: '#b6c2d4', align: 'center',
    });
  }

  for (let i = 0; i < shop.items.length; i++) {
    const it = shop.items[i];
    const y = 270 + i * 58;
    const sel = i === shop.index;
    if (sel) {
      ctx.save();
      ctx.fillStyle = 'rgba(150,190,240,0.08)';
      ctx.fillRect(x + 26, y - 24, w - 52, 46);
      ctx.strokeStyle = 'rgba(255,207,142,0.4)';
      ctx.beginPath();
      ctx.moveTo(x + 26, y - 24);
      ctx.lineTo(x + 26, y + 22);
      ctx.stroke();
      ctx.restore();
    }
    text(ctx, it.name, x + 48, y - 1, {
      size: sel ? 19 : 17, color: sel ? '#f1f5ff' : '#aeb9ca',
    });
    text(ctx, it.desc, x + 48, y + 17, {
      size: 11, color: 'rgba(150,168,194,0.7)',
    });
    const afford = game.shards >= it.price;
    text(ctx, it.price + ' shards', x + w - 48, y + 4, {
      size: 13, color: afford ? (sel ? GOLD : '#c8b48c') : '#7a6262', align: 'right',
    });
  }

  text(ctx, 'ARROWS browse    ENTER buy    E / ESC leave', VIEW_W / 2, 548, {
    size: 11, color: 'rgba(150,168,194,0.6)', align: 'center', spacing: 1,
  });
}

// ---------------------------------------------------------------------------
// Death / ending
// ---------------------------------------------------------------------------
export function drawDeath(ctx, game) {
  const a = clamp(game.deathTimer / 1.4, 0, 1);
  text(ctx, 'YOU ARE BROKEN', VIEW_W / 2, VIEW_H / 2 - 10, {
    size: 38, color: `rgba(230,220,215,${0.25 + a * 0.65})`, align: 'center', spacing: 10,
  });
  text(ctx, 'the bench remembers you', VIEW_W / 2, VIEW_H / 2 + 34, {
    size: 13, color: `rgba(190,170,170,${0.15 + a * 0.45})`, align: 'center', spacing: 2,
  });
}

export function drawEnding(ctx, game) {
  const t = game.endingT;
  const fade = clamp(t / 2.5, 0, 1);
  ctx.save();
  ctx.fillStyle = `rgba(4,5,9,${0.72 * fade})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();

  const a = clamp((t - 0.8) / 2, 0, 1);
  text(ctx, 'THE LAMP BURNS AGAIN', VIEW_W / 2, VIEW_H / 2 - 40, {
    size: 30, color: `rgba(240,238,230,${a})`, align: 'center', spacing: 8,
  });
  const a2 = clamp((t - 3) / 2, 0, 1);
  text(ctx, 'The Choir Mother sleeps. The Molt is quiet.', VIEW_W / 2, VIEW_H / 2 + 6, {
    size: 15, color: `rgba(190,200,218,${a2 * 0.85})`, align: 'center',
  });
  text(ctx, 'Somewhere far above, a small light answers.', VIEW_W / 2, VIEW_H / 2 + 32, {
    size: 15, color: `rgba(190,200,218,${a2 * 0.85})`, align: 'center',
  });

  const a3 = clamp((t - 5) / 1.5, 0, 1);
  text(ctx, `TIME ${formatTime(game.playtime)}     DEATHS ${game.deaths}     KILLS ${game.kills}`, VIEW_W / 2, VIEW_H / 2 + 90, {
    size: 13, color: `rgba(200,210,226,${a3 * 0.7})`, align: 'center', spacing: 1,
  });
  const masks = game.items.filter((i) => i === 'maskshard').length;
  const grubs = game.items.filter((i) => i === 'grub').length;
  text(ctx, `MASK SHARDS ${masks}     GRUBS ${grubs}     GIFTS ${game.player ? game.player.abilities.size : 0}/4`, VIEW_W / 2, VIEW_H / 2 + 114, {
    size: 12, color: `rgba(180,192,212,${a3 * 0.6})`, align: 'center',
  });

  if (t > 7) {
    const pulse = 0.45 + Math.sin(t * 2) * 0.2;
    text(ctx, 'ENTER  return to the surface', VIEW_W / 2, VIEW_H - 80, {
      size: 12, color: `rgba(200,215,235,${pulse})`, align: 'center', spacing: 2,
    });
  }
}

// ---------------------------------------------------------------------------
// Transition / debug
// ---------------------------------------------------------------------------
export function drawTransition(ctx, game) {
  const tr = game.transition;
  let a = 0;
  if (tr.phase === 'out') a = clamp(tr.t / 0.28, 0, 1);
  else a = 1 - clamp(tr.t / 0.32, 0, 1);
  ctx.save();
  ctx.fillStyle = `rgba(2,3,6,${a})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
}

export function drawDebug(ctx, game) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(8, VIEW_H - 128, 300, 116);
  ctx.fillStyle = '#9fe8b8';
  setFont(ctx, 11, 'normal', 'Consolas, monospace');
  ctx.textAlign = 'left';
  ctx.letterSpacing = '0px';
  const p = game.player;
  const lines = [
    `fps ${game.fps}   mode ${game.mode}`,
    `room ${game.roomId}  ${game.room ? game.room.pxW + 'x' + game.room.pxH : ''}`,
    p ? `pos ${p.x.toFixed(0)},${p.y.toFixed(0)}  vy ${p.vy.toFixed(0)}  hp ${p.hp}` : 'no player',
    p ? `ground ${p.onGround}  ability ${[...p.abilities].join(',')}` : '',
    `entities ${game.enemies.length}  boss ${game.boss ? game.boss.type : '-'}  shards ${game.shards}`,
    'F2 room  F3 god  F4 heal  F5 hurt',
  ];
  lines.forEach((l, i) => ctx.fillText(l, 16, VIEW_H - 106 + i * 16));
  ctx.restore();
}
