import { TILE } from '../config.js';

/**
 * Compact room authoring: the builder produces the ASCII grid that the runtime
 * parses, so hand-written maps stay short and cannot get their wall widths
 * wrong.
 *
 * cfg:
 *   id, name, zone, map:[x,y], w, h, floor
 *   platforms: [[x, y, length, '='|'#']]
 *   blocks:    [[x, y, w, h]]
 *   spikes:    [[x, y, length]]
 *   water:     [[x, y, w, h]]
 *   doors:     { west:{to,spawn,need}, east:{...} }
 *   exits:     [{ x,y,w,h,to,spawn,need }]   (extra arches)
 *   enemies:   [{ t, x, y }]                  y = tile row whose bottom edge is ground
 *   props:     [{ t, x, y, ...data }]
 *   boss:      { type, x, y }
 */
export function makeRoom(cfg) {
  const w = cfg.w ?? 40;
  const h = cfg.h ?? 24;
  const floor = cfg.floor ?? h - 4;
  const grid = Array.from({ length: h }, () => Array(w).fill('.'));

  for (let x = 0; x < w; x++) grid[0][x] = '#';
  for (let y = 0; y < h; y++) {
    grid[y][0] = '#';
    grid[y][w - 1] = '#';
  }
  for (let y = floor; y < h; y++) {
    for (let x = 0; x < w; x++) grid[y][x] = '#';
  }

  for (const [x, y, bw, bh] of cfg.blocks || []) {
    for (let yy = y; yy < y + bh; yy++) {
      for (let xx = x; xx < x + bw; xx++) {
        if (yy > 0 && yy < h && xx > 0 && xx < w) grid[yy][xx] = '#';
      }
    }
  }

  for (const [x, y, len, type = '='] of cfg.platforms || []) {
    for (let i = 0; i < len; i++) {
      if (y > 0 && y < h && x + i > 0 && x + i < w) grid[y][x + i] = type;
    }
  }

  for (const [x, y, len] of cfg.spikes || []) {
    for (let i = 0; i < len; i++) {
      if (y > 0 && y < h && x + i > 0 && x + i < w) grid[y][x + i] = '^';
    }
  }

  for (const [x, y, ww, hh] of cfg.water || []) {
    for (let yy = y; yy < y + hh; yy++) {
      for (let xx = x; xx < x + ww; xx++) {
        if (yy > 0 && yy < h && xx > 0 && xx < w && grid[yy][xx] === '.') grid[yy][xx] = '~';
      }
    }
  }

  // Holes carve through floors so a room can hide a drop or a shaft.
  for (const [x, y, ww, hh] of cfg.holes || []) {
    for (let yy = y; yy < y + hh; yy++) {
      for (let xx = x; xx < x + ww; xx++) {
        if (yy > 0 && yy < h && xx > 0 && xx < w) grid[yy][xx] = '.';
      }
    }
  }

  const exits = [];
  const doors = cfg.doors || {};
  const carve = (side) => {
    for (let y = floor - 3; y < floor; y++) {
      if (side === 'west') grid[y][0] = '.';
      else grid[y][w - 1] = '.';
    }
  };
  if (doors.west) {
    carve('west');
    exits.push({
      x: 0, y: floor - 3, w: 1, h: 3,
      to: doors.west.to, spawn: doors.west.spawn || 'west', need: doors.west.need,
    });
  }
  if (doors.east) {
    carve('east');
    exits.push({
      x: w - 1, y: floor - 3, w: 1, h: 3,
      to: doors.east.to, spawn: doors.east.spawn || 'east', need: doors.east.need,
    });
  }
  for (const ex of cfg.exits || []) exits.push(ex);

  const spawns = {
    start: { x: 3, y: floor },
    west: { x: 2, y: floor },
    east: { x: w - 3, y: floor },
    ...(cfg.spawns || {}),
  };

  return {
    id: cfg.id,
    name: cfg.name || cfg.id,
    zone: cfg.zone || 'rootway',
    w,
    h,
    floor,
    map: cfg.map || [0, 0],
    music: cfg.music,
    rows: grid.map((row) => row.join('')),
    enemies: [],
    enemySpawns: (cfg.enemies || []).map((e) => ({ ...e })),
    entities: (cfg.props || []).map((p) => ({ ...p })),
    exits,
    spawns,
    boss: cfg.boss,
    intro: cfg.intro,
  };
}

export const tileCenter = (tx) => (tx + 0.5) * TILE;
