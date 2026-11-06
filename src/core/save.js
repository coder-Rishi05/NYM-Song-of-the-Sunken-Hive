// Versioned localStorage persistence. All reads are defensive: a broken save
// must never prevent the game from booting.
const SAVE_PREFIX = 'nym.save.v1.';
const SETTINGS_KEY = 'nym.settings.v1';

export const SAVE_VERSION = 1;

export function readSave(slot = 1) {
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + slot);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== SAVE_VERSION) return null;
    return normalizeSave(data);
  } catch {
    return null;
  }
}

export function writeSave(slot, data) {
  try {
    const payload = { ...data, v: SAVE_VERSION, savedAt: Date.now() };
    localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function deleteSave(slot = 1) {
  try {
    localStorage.removeItem(SAVE_PREFIX + slot);
  } catch {
    /* ignore */
  }
}

export function hasSave(slot = 1) {
  return !!readSave(slot);
}

export function normalizeSave(data) {
  return {
    v: SAVE_VERSION,
    slot: data.slot || 1,
    room: typeof data.room === 'string' ? data.room : 'cradle_01',
    spawn: typeof data.spawn === 'string' ? data.spawn : 'start',
    bench: typeof data.bench === 'string' ? data.bench : 'cradle_03',
    benchSpawn: typeof data.benchSpawn === 'string' ? data.benchSpawn : 'bench',
    hp: Number.isFinite(data.hp) ? data.hp : 5,
    maxHp: Number.isFinite(data.maxHp) ? data.maxHp : 5,
    soul: Number.isFinite(data.soul) ? data.soul : 0,
    maxSoul: Number.isFinite(data.maxSoul) ? data.maxSoul : 99,
    shards: Number.isFinite(data.shards) ? data.shards : 0,
    abilities: Array.isArray(data.abilities) ? data.abilities : [],
    items: Array.isArray(data.items) ? data.items : [],
    flags: data.flags && typeof data.flags === 'object' ? data.flags : {},
    visited: Array.isArray(data.visited) ? data.visited : [],
    playtime: Number.isFinite(data.playtime) ? data.playtime : 0,
    deaths: Number.isFinite(data.deaths) ? data.deaths : 0,
    kills: Number.isFinite(data.kills) ? data.kills : 0,
  };
}

export function newSave() {
  return normalizeSave({
    room: 'cradle_01',
    bench: 'cradle_03',
    benchSpawn: 'bench',
    hp: 5,
    maxHp: 5,
    soul: 0,
    maxSoul: 99,
    shards: 0,
    abilities: [],
    items: [],
    flags: {},
    visited: ['cradle_01'],
    playtime: 0,
    deaths: 0,
    kills: 0,
  });
}

export function readSettings() {
  const defaults = {
    master: 0.8,
    music: 0.55,
    sfx: 0.8,
    shake: 1,
    flashes: 1,
    damageNumbers: 0,
  };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return defaults;
  }
}

export function writeSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
