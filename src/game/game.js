import { VIEW_W, VIEW_H, TILE, SAVE_SLOT, DEBUG, START_ROOM, AUTOSTART } from '../config.js';
import { clamp, lerp, sign, dist, TAU, formatTime, rectsOverlap, rand } from '../core/math.js';
import { audio } from '../core/audio.js';
import {
  readSave, writeSave, newSave, readSettings, writeSettings,
} from '../core/save.js';
import { Particles } from '../render/particles.js';
import { Camera } from '../render/camera.js';
import { drawBackdrop, drawForeground } from '../render/backdrop.js';
import { drawProp } from '../render/props.js';
import { hexA } from '../world/room.js';
import { buildRoom, playerSpawn, renderTerrain, drawExits } from '../world/room.js';
import { ROOMS, ROOM_LIST, START_ROOM_ID } from '../data/rooms.js';
import { Player } from './player.js';
import { createEnemy, ENEMY_DEFS } from './enemies.js';
import { Projectiles } from './projectiles.js';
import { createBoss, BOSS_DEFS } from './bosses.js';
import {
  drawHUD, drawTitle, drawPause, drawMapScreen, drawDialogue, drawShop,
  drawDeath, drawEnding, drawOptions, drawControls, drawVignette, drawDebug, drawTransition,
  drawPrompt, drawAttackList,
} from '../ui/ui.js';
import { TouchController, drawPortraitBlocker } from '../ui/touch.js';

const SHOP_ITEMS = [
  { id: 'map', name: "Warden's Map", price: 120, desc: 'Reveals the shape of the hive.' },
  { id: 'nail', name: 'Honed Splinter', price: 450, desc: '+3 blade damage.' },
  { id: 'maskshard', name: 'Mask Shard', price: 300, desc: 'A piece of a brighter face.' },
  { id: 'soulvessel', name: 'Soul Vessel', price: 250, desc: '+20 soul capacity.' },
  { id: 'charm_ember', name: 'Ember Heart', price: 350, desc: '+2 damage. Warmth lingers.' },
];

const ABILITY_NAMES = {
  dash: 'Skitter Dash',
  cling: 'Cling',
  wing: 'Wingbeat',
  spell: 'Wisp Bolt',
};

const ABILITY_LINES = {
  dash: 'The first gift is motion.\nPress L / Shift to dash.',
  cling: 'The second gift is patience.\nPress toward a wall to cling, then jump.',
  wing: 'The third gift is defiance.\nPress jump again in the air.',
  spell: 'The fourth gift is voice.\nPress U to cast, spending soul.',
};

export class Game {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.dpr = 1;
    this.time = 0;
    this.fps = 60;
    this.fpsAcc = 0;
    this.fpsFrames = 0;

    this.mode = 'title';
    this.settings = readSettings();
    this.saveData = null;
    this.flags = {};
    this.items = [];
    this.shards = 0;
    this.player = null;
    this.room = null;
    this.roomId = null;
    this.enemies = [];
    this.boss = null;
    this.bossDeathT = 0;
    this.endTimer = 0;
    this.props = [];
    this.pickups = [];
    this.ghosts = [];
    this.damageNumbers = [];
    this.particles = new Particles();
    this.projectiles = new Projectiles();
    this.camera = new Camera();
    this.prompt = null;
    this.toastText = '';
    this.toastT = 0;
    this.roomToastT = 0;
    this.roomToast = '';
    this.hitstop = 0;
    this.flash = 0;
    this.exitCooldown = 0;
    this.deathTimer = 0;
    this.playtime = 0;
    this.deaths = 0;
    this.kills = 0;
    this.transition = null;
    this.showAttackList = false;
    this.showTimer = false;
    this.god = false;
    this.titleIndex = 0;
    this.pauseIndex = 0;
    this.optionIndex = 0;
    this.controlsIndex = 0;
    this.touch = new TouchController(canvas, input);
    this.dialogue = null;
    this.shop = null;
    this.endingT = 0;
    this.loadingTitle = true;
    this.saveData = readSave(SAVE_SLOT);
    this.roomIds = ROOM_LIST.map((r) => r.id);

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
    input.onGesture(() => {
      audio.init();
      if (this.mode === 'title') audio.startZone('title');
    });
    audio.applySettings(this.settings);
    this.setupPointerEvents();

    if (DEBUG) this.installDebugKeys();
    if (START_ROOM) this.debugStart(START_ROOM);
    else if (AUTOSTART) this.startNewGame();
  }

  resize() {
    const pad = 0;
    const availW = window.innerWidth - pad;
    const availH = window.innerHeight - pad;
    const scale = Math.min(availW / VIEW_W, availH / VIEW_H);
    const cssW = Math.floor(VIEW_W * scale);
    const cssH = Math.floor(VIEW_H * scale);
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(VIEW_W * this.dpr);
    this.canvas.height = Math.floor(VIEW_H * this.dpr);
    if (this.touch) {
      this.touch.layoutButtons(VIEW_W, VIEW_H);
    }
  }

  installDebugKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F2') {
        const idx = ROOM_LIST.findIndex((r) => r.id === this.roomId);
        const next = ROOM_LIST[(idx + 1) % ROOM_LIST.length];
        this.debugStart(next.id);
      } else if (e.code === 'F3') {
        this.god = !this.god;
        this.toast(this.god ? 'god mode on' : 'god mode off', 1.2);
      } else if (e.code === 'F4') {
        if (this.player) {
          this.player.hp = this.player.maxHp;
          this.player.soul = this.player.maxSoul;
        }
      } else if (e.code === 'F5') {
        if (this.player) this.player.hp = Math.max(0, this.player.hp - 1);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Boot / save
  // -------------------------------------------------------------------------
  buildSaveData() {
    const p = this.player;
    return {
      v: 1,
      slot: SAVE_SLOT,
      room: this.roomId || 'cradle_01',
      spawn: 'start',
      bench: (this.saveData && this.saveData.bench) || 'cradle_01',
      benchSpawn: (this.saveData && this.saveData.benchSpawn) || 'start',
      hp: p ? p.hp : 5,
      maxHp: p ? p.maxHp : 5,
      soul: p ? p.soul : 0,
      maxSoul: p ? p.maxSoul : 99,
      shards: this.shards,
      abilities: p ? [...p.abilities] : [],
      items: [...this.items],
      flags: this.flags,
      visited: ROOM_LIST.filter((r) => this.flags['visited:' + r.id]).map((r) => r.id),
      playtime: this.playtime,
      deaths: this.deaths,
      kills: this.kills,
    };
  }

  saveToBench(prop) {
    const data = this.buildSaveData();
    data.bench = this.roomId;
    data.benchSpawn = this.room.spawns.bench ? 'bench' : 'start';
    data.room = this.roomId;
    data.hp = this.player.maxHp;
    this.player.heal(99);
    this.player.soul = this.player.maxSoul;
    data.hp = this.player.hp;
    data.soul = this.player.soul;
    this.saveData = data;
    writeSave(SAVE_SLOT, data);
    this.toast('Rested. The hive remembers you.', 2.4);
  }

  startNewGame() {
    this.flags = {};
    this.items = [];
    this.shards = 0;
    this.playtime = 0;
    this.deaths = 0;
    this.kills = 0;
    this.saveData = newSave();
    this.saveData.bench = 'cradle_01';
    this.saveData.benchSpawn = 'start';
    this.player = null;
    this.loadRoom(START_ROOM_ID, 'start', { fresh: true });
    this.mode = 'playing';
    this.loadingTitle = false;
    this.showDialogue(
      [
        'The lamp is out.\nThe song has stopped.',
        'Go down, little husk.\nGo down and bring back the light.',
      ],
      'A hundred years after the last song',
      null
    );
  }

  continueGame() {
    const save = readSave(SAVE_SLOT);
    if (!save) {
      this.startNewGame();
      return;
    }
    this.saveData = save;
    this.flags = save.flags || {};
    this.items = save.items || [];
    this.shards = save.shards || 0;
    this.playtime = save.playtime || 0;
    this.deaths = save.deaths || 0;
    this.kills = save.kills || 0;
    this.player = null;
    const room = save.bench || 'cradle_01';
    const spawn = save.benchSpawn || 'start';
    this.loadRoom(room, spawn, { fresh: true, fromSave: true });
    this.mode = 'playing';
    this.loadingTitle = false;
  }

  debugStart(roomId) {
    if (!ROOMS[roomId]) return;
    this.flags = {};
    this.items = ['nail', 'charm_ember'];
    this.shards = 999;
    this.playtime = 0;
    this.player = null;
    this.saveData = newSave();
    this.saveData.bench = roomId;
    this.loadRoom(roomId, 'start', { fresh: true, debugAll: true });
    this.mode = 'playing';
    this.loadingTitle = false;
  }

  // -------------------------------------------------------------------------
  // Rooms
  // -------------------------------------------------------------------------
  loadRoom(id, spawnName = 'start', opts = {}) {
    const def = ROOMS[id];
    if (!def) {
      console.error('Missing room', id);
      return;
    }
    this.room = buildRoom(def);
    this.roomId = id;
    this.flags['visited:' + id] = true;
    this.transition = null;
    this.showAttackList = false;
    this.exitCooldown = 0.5;
    this.projectiles.clear();
    this.particles.clear();
    this.ghosts = [];
    this.pickups = [];
    this.boss = null;
    this.bossDeathT = 0;
    this.prompt = null;
    this.dialogue = null;
    this.shop = null;

    const pos = playerSpawn(this.room, spawnName);
    if (!this.player || opts.fresh) {
      const base = this.saveData || newSave();
      this.player = new Player(pos.x, pos.y, {
        hp: base.hp,
        maxHp: base.maxHp,
        soul: base.soul,
        maxSoul: base.maxSoul,
        abilities: base.abilities || [],
      });
      if (opts.debugAll) {
        for (const a of ['dash', 'cling', 'wing', 'spell']) this.player.abilities.add(a);
      }
      if (opts.fromSave) {
        this.player.hp = base.hp;
        this.player.maxHp = base.maxHp;
        this.player.soul = base.soul;
        this.player.maxSoul = base.maxSoul;
      }
    } else {
      this.player.x = pos.x - this.player.w / 2;
      this.player.y = pos.y - this.player.h;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.onGround = false;
      this.player.dashing = false;
      this.player.dashT = 0;
      this.player.attackT = 0;
      this.player.focusing = false;
      this.player.focusT = 0;
      this.player.iFrames = Math.max(this.player.iFrames, 0.35);
      this.player.safeX = this.player.x;
      this.player.safeY = this.player.y;
    }

    if (spawnName === 'east') {
      this.player.facing = -1;
    } else if (spawnName === 'west' || spawnName === 'start') {
      this.player.facing = 1;
    }

    this.props = this.room.props.map((p) => ({
      ...p,
      x: p.cx,
      y: p.bottom,
      taken: !!this.flags['taken:' + p.id] || this.abilityAlreadyOwned(p.type),
    }));

    if (def.boss && !this.flags[BOSS_DEFS[def.boss.type].flag]) {
      const bx = (def.boss.x + 0.5) * TILE;
      const by = (def.boss.y + 1) * TILE;
      this.boss = createBoss(def.boss.type, bx, by, this);
      audio.startZone('boss');
      audio.setBoss(true);
    } else {
      audio.startZone(this.room.music || this.room.zone);
      audio.setBoss(false);
    }

    this.enemies = [];
    for (const spawn of this.room.enemies) {
      this.enemies.push(createEnemy(spawn.type, spawn.cx, spawn.bottom, this.room));
    }

    this.camera.setToTarget(
      { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h, facing: this.player.facing },
      { w: this.room.pxW, h: this.room.pxH },
      true
    );
    this.roomToast = this.room.name;
    this.roomToastT = 3.2;
    this.flash = 0.5;
  }

  abilityAlreadyOwned(type) {
    if (!this.player) return false;
    return !!ABILITY_NAMES[type] && this.player.abilities.has(type);
  }

  unlocked(need) {
    if (!need) return true;
    if (need.startsWith('flag:')) return !!this.flags[need.slice(5)];
    return !!(this.player && this.player.abilities.has(need));
  }

  needLabel(need) {
    if (need.startsWith('flag:')) return 'a memory';
    return ABILITY_NAMES[need] || 'something';
  }

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------
  update(dt) {
    this.time += dt;
    this.fpsAcc += dt;
    this.fpsFrames += 1;
    if (this.fpsAcc >= 0.5) {
      this.fps = Math.round(this.fpsFrames / this.fpsAcc);
      this.fpsAcc = 0;
      this.fpsFrames = 0;
    }

    this.toastT = Math.max(0, this.toastT - dt);
    this.roomToastT = Math.max(0, this.roomToastT - dt);
    this.exitCooldown = Math.max(0, this.exitCooldown - dt);
    this.flash = Math.max(0, this.flash - dt * 2.4);

    if (this.hitstop > 0) {
      this.hitstop -= dt;
      this.particles.update(dt * 0.3);
      return;
    }

    // Freeze update while in mobile portrait mode
    if (this.touch && this.touch.detectMobile() && this.touch.isPortrait()) {
      return;
    }

    // Update audio engine continuously across all modes (title, paused, playing)
    audio.update(dt, this.mode);

    switch (this.mode) {
      case 'title': this.updateTitle(dt); break;
      case 'options': this.updateOptions(dt, 'title'); break;
      case 'optionsPause': this.updateOptions(dt, 'paused'); break;
      case 'controls': this.updateControls(dt, 'title'); break;
      case 'controlsPause': this.updateControls(dt, 'paused'); break;
      case 'playing': this.updatePlaying(dt); break;
      case 'paused': this.updatePause(dt); break;
      case 'map': this.updateMap(dt); break;
      case 'dialogue': this.updateDialogue(dt); break;
      case 'shop': this.updateShop(dt); break;
      case 'dead': this.updateDead(dt); break;
      case 'ending': this.updateEnding(dt); break;
      default: break;
    }
  }

  updateTitle(dt) {
    if (audio.zone !== 'title') {
      audio.startZone('title');
    }
    const input = this.input;
    const hasSave = !!readSave(SAVE_SLOT);
    const labels = this.titleLabels(hasSave);
    const items = labels.length;
    if (input.wasPressed('up')) {
      this.titleIndex = (this.titleIndex + items - 1) % items;
      audio.sfx('menu');
    }
    if (input.wasPressed('down')) {
      this.titleIndex = (this.titleIndex + 1) % items;
      audio.sfx('menu');
    }
    if (input.wasPressed('confirm') || input.wasPressed('jump')) {
      audio.sfx('select');
      const label = labels[clamp(this.titleIndex, 0, labels.length - 1)];
      if (label === 'New Game') this.startNewGame();
      else if (label === 'Continue') this.continueGame();
      else if (label === 'Controls') {
        this.mode = 'controls';
        this.controlsIndex = 0;
      } else this.mode = 'options';
    }
  }

  titleLabels(hasSave) {
    return hasSave ? ['Continue', 'New Game', 'Controls', 'Options'] : ['New Game', 'Controls', 'Options'];
  }

  titleLabel(hasSave) {
    const labels = this.titleLabels(hasSave);
    return labels[clamp(this.titleIndex, 0, labels.length - 1)];
  }

  isMenuMode() {
    return (
      this.mode !== 'playing' ||
      this.showAttackList ||
      (this.touch && this.touch.detectMobile() && this.touch.isPortrait())
    );
  }

  setupPointerEvents() {
    const getCoords = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: 0, y: 0 };
      return {
        x: (e.clientX - rect.left) * (VIEW_W / rect.width),
        y: (e.clientY - rect.top) * (VIEW_H / rect.height),
      };
    };

    this.canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse') {
        const pt = getCoords(e);
        this.handleMenuHover(pt.x, pt.y);
      }
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.isMenuMode()) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const pt = getCoords(e);
        if (this.handleMenuTouch(pt.x, pt.y)) {
          e.preventDefault();
        }
      }
    });

    this.canvas.addEventListener('pointerleave', () => {
      this.canvas.style.cursor = 'default';
    });
  }

  handleMenuHover(x, y) {
    if (this.mode === 'title') {
      const hasSave = !!readSave(SAVE_SLOT);
      const labels = this.titleLabels(hasSave);
      const startY = 410;
      for (let i = 0; i < labels.length; i++) {
        const itemY = startY + i * 42;
        if (Math.abs(x - VIEW_W / 2) < 160 && Math.abs(y - (itemY - 7)) < 20) {
          if (this.titleIndex !== i) {
            this.titleIndex = i;
          }
          this.canvas.style.cursor = 'pointer';
          return true;
        }
      }
      this.canvas.style.cursor = 'default';
      return false;
    }

    if (this.mode === 'paused') {
      const items = ['Resume', 'Map', 'Controls', 'Options', 'Quit to Title'];
      for (let i = 0; i < items.length; i++) {
        const itemY = 260 + i * 44;
        if (Math.abs(x - VIEW_W / 2) < 150 && Math.abs(y - (itemY - 6)) < 20) {
          if (this.pauseIndex !== i) {
            this.pauseIndex = i;
          }
          this.canvas.style.cursor = 'pointer';
          return true;
        }
      }
      this.canvas.style.cursor = 'default';
      return false;
    }

    if (this.mode === 'controls' || this.mode === 'controlsPause') {
      const pw = 680;
      for (let i = 0; i < 15; i++) {
        const rowY = 154 + i * 26;
        if (x > VIEW_W / 2 - pw / 2 && x < VIEW_W / 2 + pw / 2 && Math.abs(y - (rowY - 5)) < 13) {
          if (this.controlsIndex !== i) {
            this.controlsIndex = i;
          }
          this.canvas.style.cursor = 'pointer';
          return true;
        }
      }
      this.canvas.style.cursor = 'default';
      return false;
    }

    if (this.mode === 'options' || this.mode === 'optionsPause') {
      for (let i = 0; i < 6; i++) {
        const rowY = 295 + i * 38;
        if (Math.abs(x - VIEW_W / 2) < 260 && Math.abs(y - (rowY - 5)) < 16) {
          if (this.optionIndex !== i) {
            this.optionIndex = i;
          }
          this.canvas.style.cursor = 'pointer';
          return true;
        }
      }
      this.canvas.style.cursor = 'default';
      return false;
    }

    if (this.mode === 'dialogue' || this.mode === 'map' || this.showAttackList) {
      this.canvas.style.cursor = 'pointer';
      return true;
    }

    if (this.mode === 'playing') {
      this.canvas.style.cursor = 'crosshair';
      return false;
    }

    this.canvas.style.cursor = 'default';
    return false;
  }

  // -------------------------------------------------------------------------
  // Direct click / touch handler for menus (Title, Controls, Options, Pause, Guides)
  // -------------------------------------------------------------------------
  handleMenuTouch(x, y) {
    // 1. Title Menu: click/tap directly on Continue, New Game, Controls, Options
    if (this.mode === 'title') {
      const hasSave = !!readSave(SAVE_SLOT);
      const labels = this.titleLabels(hasSave);
      const startY = 410;
      for (let i = 0; i < labels.length; i++) {
        const itemY = startY + i * 42;
        // Check tap/click hit within horizontal span around center
        if (Math.abs(x - VIEW_W / 2) < 160 && Math.abs(y - (itemY - 7)) < 20) {
          this.titleIndex = i;
          audio.sfx('select');
          const label = labels[i];
          if (label === 'New Game') this.startNewGame();
          else if (label === 'Continue') this.continueGame();
          else if (label === 'Controls') {
            this.mode = 'controls';
            this.controlsIndex = 0;
          } else if (label === 'Options') {
            this.mode = 'options';
            this.optionIndex = 0;
          }
          return true;
        }
      }
      return false;
    }

    // 2. Pause Menu: click/tap directly on options
    if (this.mode === 'paused') {
      const items = ['Resume', 'Map', 'Controls', 'Options', 'Quit to Title'];
      for (let i = 0; i < items.length; i++) {
        const itemY = 260 + i * 44;
        if (Math.abs(x - VIEW_W / 2) < 150 && Math.abs(y - (itemY - 6)) < 20) {
          this.pauseIndex = i;
          audio.sfx('select');
          if (i === 0) this.mode = 'playing';
          else if (i === 1) this.mode = 'map';
          else if (i === 2) {
            this.mode = 'controlsPause';
            this.controlsIndex = 0;
          } else if (i === 3) {
            this.mode = 'optionsPause';
            this.optionIndex = 0;
          } else {
            this.saveData = this.buildSaveData();
            writeSave(SAVE_SLOT, this.saveData);
            this.mode = 'title';
            this.loadingTitle = true;
            audio.setBoss(false);
            audio.startZone('title');
          }
          return true;
        }
      }
      return false;
    }

    // 3. Controls Screen
    if (this.mode === 'controls' || this.mode === 'controlsPause') {
      const backMode = this.mode === 'controls' ? 'title' : 'paused';
      const pw = 680;
      const actions = ['left', 'right', 'up', 'down', 'jump', 'attack', 'dash', 'focus', 'cast', 'attackList', 'map'];
      for (let i = 0; i < 15; i++) {
        const rowY = 154 + i * 26;
        if (x > VIEW_W / 2 - pw / 2 && x < VIEW_W / 2 + pw / 2 && Math.abs(y - (rowY - 5)) < 13) {
          this.controlsIndex = i;
          audio.sfx('select');
          if (i < actions.length) {
            this.input.startRebind(actions[i]);
          } else if (i === 11) {
            if (this.touch.userMode === 'auto') this.touch.userMode = 'always';
            else if (this.touch.userMode === 'always') this.touch.userMode = 'off';
            else this.touch.userMode = 'auto';
          } else if (i === 12) {
            if (this.touch.scale === 1.0) this.touch.scale = 1.15;
            else if (this.touch.scale > 1.0) this.touch.scale = 0.85;
            else this.touch.scale = 1.0;
            this.touch.layoutButtons(VIEW_W, VIEW_H);
          } else if (i === 13) {
            this.input.resetBindings();
            this.toast('Controls reset to defaults.', 2);
          } else if (i === 14) {
            this.mode = backMode;
          }
          return true;
        }
      }
      return false;
    }

    // 4. Options Screen
    if (this.mode === 'options' || this.mode === 'optionsPause') {
      const backMode = this.mode === 'options' ? 'title' : 'paused';
      for (let i = 0; i < 6; i++) {
        const rowY = 295 + i * 38;
        if (Math.abs(x - VIEW_W / 2) < 260 && Math.abs(y - (rowY - 5)) < 16) {
          this.optionIndex = i;
          audio.sfx('menu');
          const s = this.settings;
          const barX = VIEW_W / 2 + 60;
          const barW = 150;

          if (i <= 2 && x >= barX && x <= barX + barW) {
            // Direct slider click
            const pct = Math.max(0, Math.min(1, Math.round(((x - barX) / barW) * 10) / 10));
            if (i === 0) s.master = pct;
            else if (i === 1) s.music = pct;
            else if (i === 2) s.sfx = pct;
          } else {
            if (i === 0) s.master = Math.round(((s.master + 0.2) % 1.2) * 10) / 10;
            else if (i === 1) s.music = Math.round(((s.music + 0.2) % 1.2) * 10) / 10;
            else if (i === 2) s.sfx = Math.round(((s.sfx + 0.2) % 1.2) * 10) / 10;
            else if (i === 3) s.shake = s.shake ? 0 : 1;
            else if (i === 4) s.flashes = s.flashes ? 0 : 1;
            else if (i === 5) {
              this.mode = backMode;
              audio.sfx('select');
            }
          }
          audio.applySettings(s);
          writeSettings(s);
          return true;
        }
      }
      return false;
    }

    // 5. Dialogue (advance dialogue on click/tap)
    if (this.mode === 'dialogue') {
      const d = this.dialogue;
      if (d) {
        const full = d.lines[d.index] || '';
        if (d.chars < full.length) {
          d.chars = full.length;
        } else if (d.index < d.lines.length - 1) {
          d.index += 1;
          d.chars = 0;
        } else {
          this.mode = 'playing';
          const cb = d.onDone;
          this.dialogue = null;
          if (cb) cb();
        }
        audio.sfx('select');
        return true;
      }
    }

    // 6. Map or Attack List: click/tap anywhere to dismiss
    if (this.mode === 'map') {
      this.mode = 'playing';
      audio.sfx('menu');
      return true;
    }
    if (this.showAttackList) {
      this.showAttackList = false;
      audio.sfx('menu');
      return true;
    }

    return false;
  }

  updateOptions(dt, backMode) {
    const input = this.input;
    const items = 6;
    if (input.wasPressed('up')) {
      this.optionIndex = (this.optionIndex + items - 1) % items;
      audio.sfx('menu');
    }
    if (input.wasPressed('down')) {
      this.optionIndex = (this.optionIndex + 1) % items;
      audio.sfx('menu');
    }
    const dir = input.wasPressed('right') ? 1 : input.wasPressed('left') ? -1 : 0;
    if (dir) {
      const s = this.settings;
      if (this.optionIndex === 0) s.master = clamp(Math.round((s.master + dir * 0.1) * 10) / 10, 0, 1);
      if (this.optionIndex === 1) s.music = clamp(Math.round((s.music + dir * 0.1) * 10) / 10, 0, 1);
      if (this.optionIndex === 2) s.sfx = clamp(Math.round((s.sfx + dir * 0.1) * 10) / 10, 0, 1);
      if (this.optionIndex === 3) s.shake = s.shake ? 0 : 1;
      if (this.optionIndex === 4) s.flashes = s.flashes ? 0 : 1;
      audio.applySettings(s);
      writeSettings(s);
      audio.sfx('menu');
    }
    if (input.wasPressed('confirm') || input.wasPressed('pause') || input.wasPressed('cancel')) {
      if (this.optionIndex === 5 || input.wasPressed('pause') || input.wasPressed('cancel')) {
        this.mode = backMode;
        audio.sfx('select');
      }
    }
  }

  updatePlaying(dt) {
    this.playtime += dt;
    const input = this.input;

    if (this.transition) {
      this.particles.update(dt);
      this.updateTransition(dt);
      return;
    }

    if (input.wasPressed('attackList')) {
      this.showAttackList = !this.showAttackList;
      audio.sfx('menu');
      return;
    }

    if (this.showAttackList) {
      if (
        input.wasPressed('attackList') ||
        input.wasPressed('pause') ||
        input.wasPressed('cancel') ||
        input.wasPressed('confirm') ||
        input.wasPressed('jump') ||
        input.mousePressed.has('attack') ||
        input.mousePressed.has('dash')
      ) {
        this.showAttackList = false;
        audio.sfx('menu');
        return;
      }
      this.camera.follow(this.player, { w: this.room.pxW, h: this.room.pxH }, dt);
      return;
    }

    if (input.wasPressed('pause')) {
      this.mode = 'paused';
      this.pauseIndex = 0;
      audio.sfx('select');
      return;
    }
    if (input.wasPressed('map')) {
      this.mode = 'map';
      audio.sfx('select');
      return;
    }
    if (input.wasPressed('timer')) {
      this.showTimer = !this.showTimer;
      audio.sfx('select');
      return;
    }

    this.particles.update(dt);
    this.updatePickups(dt);
    this.updatePrompt();
    this.autoCollect();

    this.player.update(dt, this);
    if (this.player.dead || this.mode !== 'playing') return;

    for (const e of this.enemies) e.update(dt, this);
    if (this.boss && this.bossDeathT <= 0) this.boss.update(dt, this);
    this.projectiles.update(dt, this);
    this.updateCombat();
    this.updateContact();
    this.updateHazards();
    this.updateGhosts(dt);
    this.updateDamageNumbers(dt);

    this.camera.follow(this.player, { w: this.room.pxW, h: this.room.pxH }, dt);

    this.enemies = this.enemies.filter((e) => !e.dead);

    if (this.boss && this.boss.dead && this.bossDeathT > 0) {
      this.bossDeathT -= dt;
      if (this.bossDeathT <= 0) this.boss = null;
    }
    if (this.endTimer > 0) {
      this.endTimer -= dt;
      if (this.endTimer <= 0) this.startEnding();
    }

    this.checkExits();
  }

  updateTransition(dt) {
    const tr = this.transition;
    tr.t += dt;
    if (tr.phase === 'out' && tr.t >= 0.28) {
      this.loadRoom(tr.to, tr.spawn);
      this.transition = { phase: 'in', t: 0 };
    } else if (tr.phase === 'in' && tr.t >= 0.32) {
      this.transition = null;
    }
  }

  updateCombat() {
    const p = this.player;
    if (!p.attackActive()) return;
    const rect = p.attackRect();
    const targets = this.allEnemies();
    for (const e of targets) {
      if (!e || e.dead || p.hitTargets.has(e)) continue;
      if (rectsOverlap(rect, { x: e.x, y: e.y, w: e.w, h: e.h })) {
        const dmg = p.nailDamage(this);
        const dealt = e.hurt(dmg, p.x + p.w / 2, this, { behind: p.attackDir !== 'side' });
        if (dealt > 0) {
          p.hitTargets.add(e);
          p.attackHit = true;
          this.gainSoul(11);
          this.hitstop = 0.045;
          this.camera.addShake(4);
          this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, {
            count: 12, speed: 180, color: '#ffe0b0', size: 2.6, life: 0.4,
            shape: 'spark', additive: true,
          });
          // Floating damage number popup
          this.spawnDamageNumber(e.x + e.w / 2, e.y, dmg);
          if (p.attackDir === 'down') {
            p.vy = -430;
            p.jumpsLeft = p.has('wing') ? 1 : 0;
            audio.sfx('pogo');
            this.camera.addShake(2);
          }
        }
      }
    }

    // Pogo on hazard spikes
    if (p.attackDir === 'down' && this.room && this.room.spikeRects) {
      for (const s of this.room.spikeRects) {
        if (rectsOverlap(rect, s)) {
          p.vy = -430;
          p.jumpsLeft = p.has('wing') ? 1 : 0;
          p.attackHit = true;
          audio.sfx('pogo');
          this.camera.addShake(2.5);
          this.particles.burst(p.x + p.w / 2, p.y + p.h, {
            count: 10, speed: 130, color: '#ffcf8a', size: 2.4, life: 0.35, shape: 'spark', additive: true,
          });
          break;
        }
      }
    }
  }

  updateContact() {
    const p = this.player;
    if (!p || p.dead) return;
    for (const e of this.allEnemies()) {
      if (!e || e.dead) continue;
      if (rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, { x: e.x, y: e.y, w: e.w, h: e.h })) {
        p.hurt(e.dmg || 1, e.x + e.w / 2, this);
        break;
      }
    }
  }

  updateHazards() {
    const p = this.player;
    if (!p || p.dead) return;

    // Void pit check (falling below bottom of room boundary)
    if (p.y > this.room.pxH + 20) {
      p.hurt(1, p.x, this);
      p.x = p.safeX != null ? p.safeX : this.room.pxW / 2;
      p.y = p.safeY != null ? p.safeY : (this.room.pxH - 4 * TILE);
      p.vx = 0;
      p.vy = 0;
      this.camera.addShake(8);
      audio.sfx('spike');
      return;
    }

    if (p.iFrames > 0) return;
    for (const s of this.room.spikeRects) {
      if (rectsOverlap({ x: p.x, y: p.y, w: p.w, h: p.h }, s)) {
        const hurt = p.hurt(1, p.x + p.w / 2 + 1, this);
        if (hurt) {
          p.x = p.safeX != null ? p.safeX : this.room.pxW / 2;
          p.y = p.safeY != null ? p.safeY : (this.room.pxH - 4 * TILE);
          p.vx = 0;
          p.vy = 0;
        }
        break;
      }
    }
  }

  updateGhosts(dt) {
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      this.ghosts[i].life -= dt;
      if (this.ghosts[i].life <= 0) this.ghosts.splice(i, 1);
    }
  }

  updatePickups(dt) {
    const p = this.player;
    if (!p) return;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const s = this.pickups[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.pickups.splice(i, 1);
        continue;
      }
      const dx = p.x + p.w / 2 - s.x;
      const dy = p.y + p.h / 2 - s.y;
      const d = Math.hypot(dx, dy);
      if (d < 130) {
        s.vx += (dx / (d || 1)) * 900 * dt;
        s.vy += (dy / (d || 1)) * 900 * dt;
      }
      s.vx *= 1 - 2 * dt;
      s.vy = s.vy * (1 - 2 * dt) + 260 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (d < 22) {
        this.shards += s.value;
        audio.sfx('shard');
        this.pickups.splice(i, 1);
      }
    }
  }

  updatePrompt() {
    const p = this.player;
    this.prompt = null;
    if (!p) return;
    for (const prop of this.props) {
      if (prop.taken) continue;
      if (!['bench', 'vendor', 'npc', 'tablet'].includes(prop.type)) continue;
      const dx = Math.abs(p.x + p.w / 2 - prop.x);
      const dy = Math.abs(p.y + p.h - prop.y);
      if (dx < 58 && dy < 70) {
        this.prompt = prop;
        break;
      }
    }
    if (this.prompt && this.input.wasPressed('interact')) {
      this.interact(this.prompt);
    }
  }

  interact(prop) {
    audio.sfx('select');
    if (prop.type === 'bench') {
      audio.sfx('bench');
      this.particles.burst(prop.x, prop.y - 30, {
        count: 22, speed: 70, color: '#cfe6ff', size: 2.2, life: 0.9,
        additive: true, gravity: -30,
      });
      this.saveToBench(prop);
      return;
    }
    if (prop.type === 'vendor') {
      this.openShop();
      return;
    }
    if (prop.type === 'npc') {
      this.showDialogue(prop.lines || ['...'], prop.name || 'A quiet bug', null);
      return;
    }
    if (prop.type === 'tablet') {
      this.showDialogue((prop.text || '...').split('\n'), '', null);
    }
  }

  // -------------------------------------------------------------------------
  // Pickups & props
  // -------------------------------------------------------------------------
  collectProp(prop) {
    if (prop.taken) return;
    prop.taken = true;
    this.flags['taken:' + prop.id] = true;

    if (prop.type === 'dash' || prop.type === 'cling' || prop.type === 'wing' || prop.type === 'spell') {
      this.player.abilities.add(prop.type);
      this.toast(ABILITY_NAMES[prop.type] + ' acquired', 2.6);
      audio.sfx('secret');
      this.particles.burst(prop.x, prop.y - 40, {
        count: 34, speed: 190, color: '#dff0ff', size: 3, life: 1.1,
        additive: true, gravity: -30,
      });
      this.camera.addShake(5);
      this.flash = 0.6;
      this.showDialogue(ABILITY_LINES[prop.type].split('\n'), 'A gift', null);
      return;
    }

    if (prop.type === 'maskShard') {
      this.items.push('maskshard');
      audio.sfx('pickup');
      const count = this.items.filter((i) => i === 'maskshard').length;
      if (count % 3 === 0) {
        this.player.maxHp += 1;
        this.player.hp = this.player.maxHp;
        this.toast('Your mask grows brighter. +1 mask', 2.6);
      } else {
        this.toast('Mask Shard (' + (count % 3) + '/3)', 2.2);
      }
      this.particles.burst(prop.x, prop.y - 30, {
        count: 20, speed: 140, color: '#f5ecd8', size: 2.6, life: 0.8, additive: true,
      });
      return;
    }
    if (prop.type === 'soulVessel') {
      this.items.push('soulvessel');
      this.player.maxSoul += 20;
      this.player.soul = this.player.maxSoul;
      audio.sfx('pickup');
      this.toast('Soul Vessel. +20 soul', 2.4);
      this.particles.burst(prop.x, prop.y - 30, {
        count: 24, speed: 150, color: '#bfeaff', size: 2.6, life: 0.9, additive: true,
      });
      return;
    }
    if (prop.type === 'charm') {
      this.items.push('charm_ember');
      audio.sfx('secret');
      this.toast('Ember Heart. Warmth clings to your blade.', 3);
      this.particles.burst(prop.x, prop.y - 30, {
        count: 30, speed: 170, color: '#ffcf8a', size: 2.8, life: 1, additive: true,
      });
      return;
    }
    if (prop.type === 'grub') {
      this.items.push('grub');
      audio.sfx('pickup');
      this.toast('A small friend, freed.', 2.2);
      this.particles.burst(prop.x, prop.y - 24, {
        count: 14, speed: 110, color: '#e8dcc0', size: 2.2, life: 0.7, additive: true,
      });
    }
  }

  autoCollect() {
    const p = this.player;
    if (!p) return;
    const rect = { x: p.x - 8, y: p.y - 8, w: p.w + 16, h: p.h + 16 };
    for (const prop of this.props) {
      if (prop.taken) continue;
      if (!['dash', 'cling', 'wing', 'spell', 'maskShard', 'soulVessel', 'charm', 'grub'].includes(prop.type)) continue;
      const r = { x: prop.x - 26, y: prop.y - 76, w: 52, h: 82 };
      if (rectsOverlap(rect, r)) this.collectProp(prop);
    }
  }

  // -------------------------------------------------------------------------
  // Combat helpers
  // -------------------------------------------------------------------------
  allEnemies() {
    const list = this.enemies.slice();
    if (this.boss && !this.boss.dead) list.push(this.boss);
    return list;
  }

  gainSoul(n) {
    if (!this.player) return;
    this.player.soul = Math.min(this.player.maxSoul, this.player.soul + n);
  }

  hasItem(id) {
    return this.items.includes(id);
  }

  onEnemyKilled(e) {
    this.kills += 1;
    this.gainSoul(8);
    const value = e.def ? e.def.shards : 5;
    this.pickups.push({
      x: e.x + e.w / 2,
      y: e.y + e.h / 2,
      vx: rand(60, -60),
      vy: rand(-40, -160),
      value,
      life: 14,
    });
    this.particles.burst(e.x + e.w / 2, e.y + e.h / 2, {
      count: 16, speed: 150, color: e.type === 'chorister' ? '#d8c4ff' : '#c9b4a8',
      size: 2.6, life: 0.6, gravity: 340, additive: false,
    });
  }

  spawnEnemyAt(type, cx, bottom) {
    if (!ENEMY_DEFS[type]) return;
    this.enemies.push(createEnemy(type, cx, bottom, this.room));
  }

  spawnProjectile(opts) {
    this.projectiles.spawn(opts);
  }

  spawnWisp(x, y, dir, facing, isUpgraded = false) {
    const speed = isUpgraded ? 520 : 440;
    const vx = dir === 'up' ? 0 : facing * speed;
    const vy = dir === 'up' ? -speed : 0;
    const damage = isUpgraded ? 16 : 8;
    const r = isUpgraded ? 9 : 6.5;
    const color = isUpgraded ? '#bfe8ff' : '#9ec5e8';
    this.projectiles.spawn({
      type: 'wisp', x, y, vx, vy, r, damage, life: 1.6,
      friendly: true, color, speed,
    });
    this.particles.burst(x, y, {
      count: isUpgraded ? 14 : 9, speed: 130, color, size: 2.4, life: 0.4, additive: true,
    });
    this.camera.addShake(isUpgraded ? 2.5 : 1.5);
  }

  explode(x, y, radius, damage, color) {
    this.camera.addShake(7);
    this.particles.burst(x, y, {
      count: 26, speed: 240, color, size: 3.4, life: 0.6, additive: true, gravity: 120,
    });
    const p = this.player;
    if (p && !p.dead) {
      if (dist(x, y, p.x + p.w / 2, p.y + p.h / 2) < radius) {
        p.hurt(damage, x, this);
      }
    }
  }

  spawnGhost(x, y) {
    this.ghosts.push({ x, y, life: 0.22, facing: this.player.facing });
  }

  spawnDamageNumber(x, y, dmg) {
    this.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 12,
      y: y - 8,
      vy: -60,
      val: dmg,
      life: 0.65,
      maxLife: 0.65,
    });
  }

  updateDamageNumbers(dt) {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.life -= dt;
      d.y += d.vy * dt;
      d.vy += 80 * dt;
      if (d.life <= 0) this.damageNumbers.splice(i, 1);
    }
  }

  drawDamageNumbers(ctx) {
    if (!this.damageNumbers.length) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px Georgia, serif';
    for (const d of this.damageNumbers) {
      const alpha = Math.min(1, d.life / (d.maxLife * 0.4));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffcf8a';
      ctx.shadowBlur = 6;
      ctx.fillText(String(d.val), d.x, d.y);
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Boss
  // -------------------------------------------------------------------------
  onBossDefeated(boss) {
    const def = BOSS_DEFS[boss.type];
    this.flags[def.flag] = true;
    this.bossDeathT = 2.2;
    audio.setBoss(false);
    this.camera.addShake(18);
    this.flash = 1;
    if (boss.type === 'moltguard') {
      this.shards += 120;
      this.player.maxSoul += 20;
      this.player.soul = this.player.maxSoul;
      this.toast('Moltguard falls. +120 shards, +20 soul', 3.4);
      this.saveData = this.buildSaveData();
      writeSave(SAVE_SLOT, this.saveData);
    } else if (boss.type === 'warden') {
      this.shards += 250;
      this.toast('The Warden falls. The eastern door opens.', 3.6);
      this.saveData = this.buildSaveData();
      writeSave(SAVE_SLOT, this.saveData);
      audio.startZone('choir');
      setTimeout(() => audio.startZone(this.room.zone), 4000);
    } else if (boss.type === 'choir') {
      this.endTimer = 3.4;
      this.toast('The song ends.', 3);
    }
  }

  startEnding() {
    this.mode = 'ending';
    this.endingT = 0;
    if (this.player) {
      this.player.heal(99);
      this.player.soul = this.player.maxSoul;
    }
    const data = this.buildSaveData();
    this.saveData = data;
    writeSave(SAVE_SLOT, data);
    audio.setBoss(false);
    audio.stopPad();
  }

  updateEnding(dt) {
    this.endingT += dt;
    this.particles.update(dt);
    if (this.endingT > 1 && this.input.wasPressed('confirm')) {
      this.mode = 'title';
      this.titleIndex = 0;
      this.loadingTitle = true;
    }
    if (this.endingT > 30) {
      this.mode = 'title';
      this.loadingTitle = true;
    }
  }

  // -------------------------------------------------------------------------
  // Menus / dialogue / shop
  // -------------------------------------------------------------------------
  updatePause(dt) {
    const input = this.input;
    const items = 5;
    if (input.wasPressed('up')) {
      this.pauseIndex = (this.pauseIndex + items - 1) % items;
      audio.sfx('menu');
    }
    if (input.wasPressed('down')) {
      this.pauseIndex = (this.pauseIndex + 1) % items;
      audio.sfx('menu');
    }
    if (input.wasPressed('pause') || input.wasPressed('cancel')) {
      this.mode = 'playing';
      return;
    }
    if (input.wasPressed('confirm')) {
      audio.sfx('select');
      if (this.pauseIndex === 0) this.mode = 'playing';
      else if (this.pauseIndex === 1) this.mode = 'map';
      else if (this.pauseIndex === 2) {
        this.mode = 'controlsPause';
        this.controlsIndex = 0;
      } else if (this.pauseIndex === 3) this.mode = 'optionsPause';
      else {
        this.saveData = this.buildSaveData();
        writeSave(SAVE_SLOT, this.saveData);
        this.mode = 'title';
        this.loadingTitle = true;
        audio.setBoss(false);
        audio.startZone('title');
      }
    }
  }

  updateControls(dt, backMode) {
    const input = this.input;
    if (input.rebindingAction) return;

    const rowCount = 15;
    if (input.wasPressed('up')) {
      this.controlsIndex = (this.controlsIndex + rowCount - 1) % rowCount;
      audio.sfx('menu');
    }
    if (input.wasPressed('down')) {
      this.controlsIndex = (this.controlsIndex + 1) % rowCount;
      audio.sfx('menu');
    }
    if (input.wasPressed('pause') || input.wasPressed('cancel')) {
      this.mode = backMode;
      audio.sfx('menu');
      return;
    }

    const actions = ['left', 'right', 'up', 'down', 'jump', 'attack', 'dash', 'focus', 'cast', 'attackList', 'map'];
    if (input.wasPressed('confirm') || input.wasPressed('jump')) {
      audio.sfx('select');
      const idx = this.controlsIndex;
      if (idx < actions.length) {
        input.startRebind(actions[idx]);
      } else if (idx === 11) {
        if (this.touch.userMode === 'auto') this.touch.userMode = 'always';
        else if (this.touch.userMode === 'always') this.touch.userMode = 'off';
        else this.touch.userMode = 'auto';
      } else if (idx === 12) {
        if (this.touch.scale === 1.0) this.touch.scale = 1.15;
        else if (this.touch.scale > 1.0) this.touch.scale = 0.85;
        else this.touch.scale = 1.0;
        this.touch.layoutButtons(VIEW_W, VIEW_H);
      } else if (idx === 13) {
        input.resetBindings();
        this.toast('Controls reset to defaults.', 2);
      } else if (idx === 14) {
        this.mode = backMode;
      }
    }
  }

  updateMap(dt) {
    if (this.input.wasPressed('map') || this.input.wasPressed('pause') || this.input.wasPressed('cancel')) {
      this.mode = 'playing';
      audio.sfx('menu');
    }
  }

  updateDialogue(dt) {
    const input = this.input;
    const d = this.dialogue;
    if (!d) {
      this.mode = 'playing';
      return;
    }
    const full = d.lines[d.index] || '';
    d.chars = Math.min(full.length, d.chars + dt * 55);
    if (input.wasPressed('confirm') || input.wasPressed('interact') || input.wasPressed('jump')) {
      if (d.chars < full.length) {
        d.chars = full.length;
      } else if (d.index < d.lines.length - 1) {
        d.index += 1;
        d.chars = 0;
      } else {
        this.mode = 'playing';
        const cb = d.onDone;
        this.dialogue = null;
        if (cb) cb();
      }
    }
  }

  showDialogue(lines, name, onDone) {
    this.dialogue = { lines: lines.slice(), name, index: 0, chars: 0, onDone };
    this.mode = 'dialogue';
  }

  openShop() {
    const available = SHOP_ITEMS.filter((it) => !this.flags['shop:' + it.id]);
    this.shop = { index: 0, items: available };
    this.mode = 'shop';
  }

  updateShop(dt) {
    const input = this.input;
    const shop = this.shop;
    if (!shop) {
      this.mode = 'playing';
      return;
    }
    if (input.wasPressed('pause') || input.wasPressed('cancel') || input.wasPressed('interact')) {
      this.mode = 'playing';
      audio.sfx('menu');
      return;
    }
    if (input.wasPressed('up') && shop.items.length) {
      shop.index = (shop.index + shop.items.length - 1) % shop.items.length;
      audio.sfx('menu');
    }
    if (input.wasPressed('down') && shop.items.length) {
      shop.index = (shop.index + 1) % shop.items.length;
      audio.sfx('menu');
    }
    if (input.wasPressed('confirm') && shop.items.length) {
      const item = shop.items[shop.index];
      if (this.shards >= item.price && !this.flags['shop:' + item.id]) {
        this.shards -= item.price;
        this.flags['shop:' + item.id] = true;
        this.buyItem(item);
        audio.sfx('secret');
      } else {
        audio.sfx('gate');
      }
    }
  }

  buyItem(item) {
    if (item.id === 'map') {
      this.flags.mapBought = true;
      this.toast("Warden's Map acquired.", 2.4);
    } else if (item.id === 'nail') {
      this.items.push('nail');
      this.toast('Honed Splinter. +3 damage.', 2.4);
    } else if (item.id === 'maskshard') {
      this.items.push('maskshard');
      const count = this.items.filter((i) => i === 'maskshard').length;
      if (count % 3 === 0) {
        this.player.maxHp += 1;
        this.player.hp = this.player.maxHp;
        this.toast('Your mask grows brighter. +1 mask.', 2.4);
      } else {
        this.toast('Mask Shard (' + (count % 3) + '/3)', 2.2);
      }
    } else if (item.id === 'soulvessel') {
      this.player.maxSoul += 20;
      this.player.soul = this.player.maxSoul;
      this.toast('Soul Vessel. +20 soul.', 2.4);
    } else if (item.id === 'charm_ember') {
      this.items.push('charm_ember');
      this.toast('Ember Heart. +2 damage.', 2.4);
    }
  }

  // -------------------------------------------------------------------------
  // Death & respawn
  // -------------------------------------------------------------------------
  onPlayerDeath() {
    this.mode = 'dead';
    this.deathTimer = 0;
    this.camera.addShake(14);
    this.flash = 0.9;
    audio.setBoss(false);
  }

  updateDead(dt) {
    this.deathTimer += dt;
    this.particles.update(dt);
    if (this.deathTimer > 1.9) {
      this.deaths += 1;
      const bench = (this.saveData && this.saveData.bench) || 'cradle_01';
      const spawn = (this.saveData && this.saveData.benchSpawn) || 'start';
      this.loadRoom(bench, spawn);
      this.player.hp = this.player.maxHp;
      this.player.soul = Math.min(this.player.maxSoul, 33);
      this.player.dead = false;
      this.player.state = 'idle';
      this.player.iFrames = 1.5;
      this.mode = 'playing';
      this.flash = 1;
      this.toast('You wake at the last bench.', 2.2);
    }
  }

  // -------------------------------------------------------------------------
  // Exits
  // -------------------------------------------------------------------------
  checkExits() {
    if (this.exitCooldown > 0 || this.transition) return;
    if (this.boss && !this.boss.dead) {
      this.toast('The arena is sealed. Defeat the foe.', 1.6);
      this.exitCooldown = 1.4;
      audio.sfx('gate');
      return;
    }
    const p = this.player;
    const rect = { x: p.x, y: p.y, w: p.w, h: p.h };
    for (const ex of this.room.exits) {
      const r = { x: ex.px, y: ex.py, w: ex.pw, h: ex.ph };
      if (rectsOverlap(rect, r)) {
        if (!this.unlocked(ex.need)) {
          this.toast(`Sealed. ${this.needLabel(ex.need)} is needed.`, 2);
          this.exitCooldown = 1.6;
          audio.sfx('gate');
          return;
        }
        this.transition = { phase: 'out', t: 0, to: ex.to, spawn: ex.spawn || 'west' };
        audio.sfx('gate');
        return;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Toast
  // -------------------------------------------------------------------------
  toast(text, duration = 2.2) {
    this.toastText = text;
    this.toastT = duration;
  }

  // -------------------------------------------------------------------------
  // Draw
  // -------------------------------------------------------------------------
  draw() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    // Orientation guard: display vector rotation prompt in mobile portrait mode
    if (this.touch && this.touch.detectMobile() && this.touch.isPortrait()) {
      drawPortraitBlocker(ctx, VIEW_W, VIEW_H, this.time);
      return;
    }

    if (this.mode === 'title' || this.mode === 'options' || this.mode === 'controls') {
      drawTitle(ctx, this);
      if (this.mode === 'options') drawOptions(ctx, this, 'title');
      if (this.mode === 'controls') drawControls(ctx, this);
      return;
    }
    if (!this.room) {
      drawTitle(ctx, this);
      return;
    }

    drawBackdrop(ctx, this.room, this.camera, this.time);

    ctx.save();
    this.camera.apply(ctx);
    renderTerrain(ctx, this.room, this.time);
    drawExits(ctx, this.room, this.time, (need) => this.unlocked(need));

    for (const prop of this.props) {
      if (prop.taken) continue;
      drawProp(ctx, prop, this.time);
    }
    this.drawPickups(ctx);
    for (const e of this.enemies) e.draw(ctx, this.time);
    if (this.boss) this.boss.draw(ctx, this.time);
    this.drawGhosts(ctx);
    if (this.player) this.player.draw(ctx, this.time);
    this.projectiles.draw(ctx, this.time);
    this.particles.draw(ctx);
    this.drawDamageNumbers(ctx);
    ctx.restore();

    drawForeground(ctx, this.room, this.camera, this.time);
    drawVignette(ctx, this);
    drawHUD(ctx, this);

    if (this.mode === 'paused') drawPause(ctx, this);
    if (this.mode === 'options' || this.mode === 'optionsPause') {
      drawOptions(ctx, this, this.mode === 'options' ? 'title' : 'paused');
    }
    if (this.mode === 'controls' || this.mode === 'controlsPause') {
      drawControls(ctx, this);
    }
    if (this.mode === 'map') drawMapScreen(ctx, this);
    if (this.mode === 'dialogue') drawDialogue(ctx, this);
    if (this.mode === 'shop') drawShop(ctx, this);
    if (this.mode === 'dead') drawDeath(ctx, this);
    if (this.mode === 'ending') drawEnding(ctx, this);

    if (this.prompt && this.mode === 'playing') drawPrompt(ctx, this, this.prompt);
    if (this.showAttackList && this.mode === 'playing') drawAttackList(ctx, this);
    if (this.transition) drawTransition(ctx, this);
    if (this.flash > 0.01 && this.settings.flashes) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(0.75, this.flash * 0.6);
      ctx.fillStyle = '#dfe9ff';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.restore();
    }

    // On-screen touch buttons for mobile
    if (this.touch && this.mode === 'playing') {
      this.touch.draw(ctx, VIEW_W, VIEW_H, this.time);
    }

    if (DEBUG) drawDebug(ctx, this);
  }

  drawPickups(ctx) {
    for (const s of this.pickups) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.globalCompositeOperation = 'lighter';
      const a = s.life < 3 ? 0.3 + 0.3 * Math.sin(this.time * 20) : 0.55;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffd9a0';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = a * 0.3;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  drawGhosts(ctx) {
    for (const g of this.ghosts) {
      ctx.save();
      ctx.globalAlpha = (g.life / 0.22) * 0.28;
      ctx.fillStyle = '#9fc4ff';
      ctx.beginPath();
      ctx.ellipse(g.x, g.y - 20, 12, 20, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}
