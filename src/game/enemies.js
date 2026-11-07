import { TILE } from '../config.js';
import { clamp, sign, dist } from '../core/math.js';
import { moveBody, hasFloorAhead, pointSolid } from '../world/room.js';
import { drawBug } from '../render/bugs.js';
import { audio } from '../core/audio.js';

export const ENEMY_DEFS = {
  crawlid:   { w: 34, h: 20, hp: 10, dmg: 1, speed: 52, shards: 5, gravity: true,  name: 'Crawlid' },
  buzzer:    { w: 24, h: 24, hp: 10, dmg: 1, speed: 95, shards: 6, gravity: false, name: 'Buzzer' },
  sporeling: { w: 32, h: 28, hp: 10, dmg: 1, speed: 0,  shards: 7, gravity: true,  name: 'Sporeling' },
  ramshell:  { w: 46, h: 36, hp: 15, dmg: 1, speed: 130, shards: 12, gravity: true, name: 'Ramshell' },
  maskfly:   { w: 30, h: 24, hp: 10, dmg: 1, speed: 140, shards: 6, gravity: true, name: 'Maskfly' },
  silkdrop:  { w: 26, h: 30, hp: 10, dmg: 1, speed: 320, shards: 8, gravity: true, name: 'Silkdrop' },
  blowfly:   { w: 26, h: 26, hp: 10, dmg: 1, speed: 110, shards: 5, gravity: false, name: 'Blowfly' },
  bulwark:   { w: 36, h: 46, hp: 15, dmg: 1, speed: 36, shards: 14, gravity: true, name: 'Bulwark' },
  chorister: { w: 34, h: 42, hp: 15, dmg: 1, speed: 70, shards: 12, gravity: false, name: 'Chorister' },
  husk:      { w: 28, h: 44, hp: 20, dmg: 2, speed: 96, shards: 15, gravity: true, name: 'Husk Knight' },
};

const GRAVITY = 1900;

export class Enemy {
  constructor(type, x, bottom, room) {
    const def = ENEMY_DEFS[type];
    if (!def) throw new Error('Unknown enemy: ' + type);
    this.type = type;
    this.def = def;
    this.dmg = def.dmg;
    this.w = def.w;
    this.h = def.h;
    this.x = x - this.w / 2;
    this.y = bottom - this.h;
    this.spawnX = this.x;
    this.spawnY = this.y;
    this.room = room;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.fly = !def.gravity;
    this.onGround = false;
    this.onWallL = false;
    this.onWallR = false;
    this.hitFlash = 0;
    this.telegraph = 0;
    this.stun = 0;
    this.dead = false;
    this.state = 'idle';
    this.timer = Math.random() * 0.8;
    this.anim = Math.random() * 10;
    this.castT = 0;
    this.cooldown = 0.6 + Math.random();
    this.burrowed = false;
    this.hidden = false;
    this.fuseT = 0;
    this.shielded = type === 'bulwark';
    this.shieldFlash = 0;
    this.threadTop = 0;
    this.anchorY = this.y;
    this.phase = Math.random() * Math.PI * 2;
    this.dropTimer = 0;
    this.active = false;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get bottom() { return this.y + this.h; }

  update(dt, game) {
    if (this.dead) return;
    this.anim += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.telegraph = Math.max(0, this.telegraph - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.shieldFlash = Math.max(0, this.shieldFlash - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.castT = Math.max(0, this.castT - dt);

    if (this.stun <= 0) {
      const fn = BEHAVIORS[this.type];
      if (fn) fn(this, dt, game);
    } else {
      this.vx *= 1 - 4 * dt;
    }

    if (this.fly) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.x < 8) { this.x = 8; this.vx = Math.abs(this.vx); }
      if (this.x + this.w > game.room.pxW - 8) { this.x = game.room.pxW - 8 - this.w; this.vx = -Math.abs(this.vx); }
    } else {
      this.vy = Math.min(950, this.vy + GRAVITY * dt);
      moveBody(this, game.room, dt);
      if (this.onGround) this.vy = 0;
    }

    if (this.y > game.room.pxH + 200) this.dead = true;
    // face the player when idle-ish
    if (!this.fly && this.stun <= 0 && Math.abs(this.vx) < 20) {
      this.facing = game.player.cx > this.cx ? 1 : -1;
    }
  }

  hurt(amount, fromX, game, opts = {}) {
    if (this.dead) return 0;
    let dmg = amount;
    if (this.burrowed) {
      this.burrowed = false;
      this.state = 'leap';
    }

    if (this.shielded) {
      const fromFront = (fromX < this.cx && this.facing < 0) || (fromX > this.cx && this.facing > 0);
      if (fromFront && !opts.behind) {
        dmg = 1;
        this.shieldFlash = 0.3;
        this.vx = 0;
        audio.sfx('hit');
        game.particles.burst(
          this.x + (this.facing > 0 ? this.w : 0),
          this.y + this.h * 0.5,
          { count: 5, speed: 90, color: '#a8d8ff', size: 2, life: 0.28, additive: true }
        );
        this.hp -= dmg;
        if (this.hp <= 0) this.die(game);
        return dmg;
      }
    }

    this.hp -= dmg;
    this.hitFlash = 0.14;
    this.telegraph = 0;
    if (!this.def.gravity || this.type === 'silkdrop' || this.type === 'maskfly') {
      this.vx = sign(fromX - this.cx) * 140;
      this.vy = Math.min(this.vy, -110);
    } else if (this.type !== 'ramshell' || this.state !== 'charge') {
      this.vx = sign(fromX - this.cx) * 170;
    }
    if (this.type === 'maskfly') this.burrowed = false;
    this.stun = Math.max(this.stun, 0.12);
    audio.sfx('hit');

    if (this.hp <= 0) this.die(game);
    return dmg;
  }

  die(game) {
    if (this.dead) return;
    this.dead = true;
    game.onEnemyKilled(this);
  }

  draw(ctx, time) {
    drawBug(ctx, this, time);
  }
}

export function createEnemy(type, cx, bottom, room) {
  const e = new Enemy(type, cx, bottom, room);
  if (type === 'maskfly') {
    e.burrowed = true;
    e.state = 'burrow';
  }
  if (type === 'silkdrop') {
    e.threadTop = -e.y - 30;
    e.state = 'hang';
  }
  if (type === 'buzzer') {
    e.anchorY = e.y;
    e.state = 'hover';
  }
  if (type === 'chorister') {
    e.anchorY = e.y;
    e.state = 'float';
  }
  if (type === 'blowfly') {
    e.anchorY = e.y;
  }
  return e;
}

const BEHAVIORS = {
  crawlid(e, dt, game) {
    e.vx = e.facing * e.def.speed;
    if (e.onGround && !hasFloorAhead(game.room, e.cx, e.bottom, e.facing)) {
      e.facing *= -1;
      e.vx = e.facing * e.def.speed;
    }
    if (e.onWallL || e.onWallR) {
      e.facing *= -1;
      e.vx = e.facing * e.def.speed;
    }
    if (e.timer > 0) e.timer -= dt;
    else if (e.cooldown <= 0 && dist(e.cx, e.cy, game.player.cx, game.player.cy) < 120) {
      if (e.onGround) {
        e.vy = -260;
        e.cooldown = 1.6;
      }
    }
  },

  buzzer(e, dt, game) {
    const p = game.player;
    e.phase += dt * 3;
    const dx = p.cx - e.cx;
    const dy = p.cy - e.cy;
    const d = Math.hypot(dx, dy);
    if (e.state === 'hover') {
      e.vx = Math.sin(e.phase) * 34;
      e.vy = Math.cos(e.phase * 0.7) * 22;
      if (d < 300 && e.cooldown <= 0) {
        e.state = 'wind';
        e.timer = 0.45;
        e.telegraph = 0.45;
        e.facing = sign(dx) || 1;
      }
    } else if (e.state === 'wind') {
      e.vx *= 0.9;
      e.vy *= 0.9;
      e.timer -= dt;
      if (e.timer <= 0) {
        e.state = 'dive';
        e.timer = 0.8;
        const a = Math.atan2(dy, dx);
        e.vx = Math.cos(a) * 340;
        e.vy = Math.sin(a) * 340;
        e.facing = sign(dx) || 1;
      }
    } else if (e.state === 'dive') {
      e.timer -= dt;
      if (e.timer <= 0) {
        e.state = 'hover';
        e.vx *= 0.2;
        e.vy *= 0.2;
        e.cooldown = 1.2;
      }
    }
    e.y = clamp(e.y, 8, game.room.pxH - e.h - 8);
  },

  sporeling(e, dt, game) {
    e.vx = 0;
    const p = game.player;
    if (e.cooldown <= 0 && Math.abs(p.cx - e.cx) < 520) {
      e.cooldown = 2.5;
      e.castT = 0.5;
      e.telegraph = 0.5;
      e.facing = sign(p.cx - e.cx) || 1;
      const dx = p.cx - e.cx;
      const dy = p.cy - e.cy;
      const time = clamp(Math.abs(dx) / 190, 0.5, 1.6);
      game.spawnProjectile({
        type: 'spore',
        x: e.cx,
        y: e.y + 4,
        vx: dx / time,
        vy: dy / time - 0.5 * 700 * time,
        gravity: 700,
        r: 6,
        damage: 1,
        life: 2.6,
        color: '#9fe8b8',
      });
    }
  },

  ramshell(e, dt, game) {
    const p = game.player;
    if (e.state === 'idle') {
      e.vx *= 1 - 4 * dt;
      e.facing = sign(p.cx - e.cx) || e.facing;
      if (e.cooldown <= 0 && Math.abs(p.cx - e.cx) < 360 && Math.abs(p.cy - e.cy) < 160) {
        e.state = 'telegraph';
        e.timer = 0.55;
        e.telegraph = 0.55;
      }
    } else if (e.state === 'telegraph') {
      e.timer -= dt;
      e.vx = 0;
      if (e.timer <= 0) {
        e.state = 'charge';
        e.timer = 1.35;
        e.vx = e.facing * 390;
        audio.sfx('dash');
      }
    } else if (e.state === 'charge') {
      e.timer -= dt;
      e.vx = e.facing * 390;
      if (e.timer <= 0) {
        e.state = 'idle';
        e.cooldown = 1.1;
      }
      if (e.onWallL || e.onWallR) {
        e.state = 'stun';
        e.timer = 0.85;
        e.vx = -e.facing * 40;
        e.telegraph = 0;
        game.camera.addShake(5);
        audio.sfx('slam');
        game.particles.burst(e.cx, e.cy, { count: 10, speed: 150, color: '#c9b4a8', size: 3, life: 0.5, gravity: 300, additive: false });
      }
    } else if (e.state === 'stun') {
      e.timer -= dt;
      e.vx *= 1 - 6 * dt;
      if (e.timer <= 0) {
        e.state = 'idle';
        e.cooldown = 0.9;
      }
    }
  },

  maskfly(e, dt, game) {
    const p = game.player;
    if (e.burrowed) {
      e.vx = 0;
      if (Math.abs(p.cx - e.cx) < 150 && p.y + p.h > e.y - 20) {
        e.burrowed = false;
        e.state = 'leap';
        e.vy = -430;
        e.vx = sign(p.cx - e.cx) * 120;
        game.particles.dust(e.cx, e.bottom, 0, '#8f9bad');
        audio.sfx('slash');
      }
      return;
    }
    if (e.onGround) {
      e.vx *= 0.85;
      if (e.cooldown <= 0) {
        e.vy = -300;
        e.vx = sign(p.cx - e.cx) * 180;
        e.cooldown = 1.4;
        e.facing = sign(p.cx - e.cx) || 1;
      }
    }
  },

  silkdrop(e, dt, game) {
    const p = game.player;
    if (e.state === 'hang') {
      e.vx = 0;
      e.vy = 0;
      e.y = e.spawnY;
      if (Math.abs(p.cx - e.cx) < 150 || (p.y > e.y && Math.abs(p.cx - e.cx) < 260)) {
        e.state = 'drop';
        e.vy = 520;
        e.telegraph = 0.2;
      }
    } else if (e.state === 'drop') {
      if (e.onGround) {
        e.state = 'rest';
        e.timer = 0.9;
        e.vy = 0;
        game.particles.dust(e.cx, e.bottom, 0);
      }
    } else if (e.state === 'rest') {
      e.timer -= dt;
      e.vx *= 1 - 5 * dt;
      if (e.timer <= 0) {
        e.state = 'hang';
        e.y = e.spawnY;
        e.vy = 0;
      }
    }
  },

  blowfly(e, dt, game) {
    const p = game.player;
    const dx = p.cx - e.cx;
    const dy = p.cy - e.cy;
    const d = Math.hypot(dx, dy);
    if (e.fuseT > 0) {
      e.fuseT -= dt;
      e.vx *= 1 - 3 * dt;
      e.vy *= 1 - 3 * dt;
      if (e.fuseT <= 0) {
        game.explode(e.cx, e.cy, 68, 1, '#ff9b6a');
        e.dead = true;
        game.onEnemyKilled(e, true);
      }
      return;
    }
    if (d < 260) {
      e.vx += (dx / (d || 1)) * 90 * dt;
      e.vy += (dy / (d || 1)) * 90 * dt;
      if (d < 90) {
        e.fuseT = 0.55;
        e.telegraph = 0.55;
      }
    } else {
      e.vx = Math.sin(e.anim * 1.4) * 30;
      e.vy = Math.cos(e.anim * 1.1) * 24;
    }
    e.vx = clamp(e.vx, -140, 140);
    e.vy = clamp(e.vy, -140, 140);
    e.facing = sign(dx) || e.facing;
  },

  bulwark(e, dt, game) {
    const p = game.player;
    e.facing = sign(p.cx - e.cx) || e.facing;
    if (e.cooldown <= 0 && Math.abs(p.cx - e.cx) < 240) {
      e.vx = e.facing * e.def.speed * 1.4;
    } else {
      e.vx = e.facing * e.def.speed * 0.4;
    }
    if (e.onWallL || e.onWallR) e.vx = 0;
  },

  chorister(e, dt, game) {
    const p = game.player;
    e.phase += dt * 1.6;
    const dx = p.cx - e.cx;
    const distX = Math.abs(dx);
    const targetX = p.cx - sign(dx) * 170;
    e.vx = clamp((targetX - e.cx) * 0.8, -70, 70);
    e.vy = Math.sin(e.phase) * 26 + (p.cy - 120 - e.cy) * 0.35;
    e.facing = sign(dx) || e.facing;
    if (e.cooldown <= 0 && distX < 460) {
      e.cooldown = 2.9;
      e.castT = 0.65;
      e.telegraph = 0.65;
      for (let i = 0; i < 3; i++) {
        game.spawnProjectile({
          type: 'note',
          x: e.cx,
          y: e.cy,
          vx: sign(dx) * (90 + i * 20),
          vy: -80 + i * 55,
          r: 7,
          damage: 1,
          life: 4.2,
          homing: 0.9,
          color: '#d8c4ff',
        });
      }
    }
  },

  husk(e, dt, game) {
    const p = game.player;
    const dx = p.cx - e.cx;
    e.facing = sign(dx) || e.facing;
    if (e.state === 'idle') {
      e.vx *= 1 - 5 * dt;
      if (e.cooldown <= 0 && Math.abs(dx) < 280 && Math.abs(p.cy - e.cy) < 90) {
        e.state = 'telegraph';
        e.timer = 0.4;
        e.telegraph = 0.4;
      }
    } else if (e.state === 'telegraph') {
      e.timer -= dt;
      e.vx = 0;
      if (e.timer <= 0) {
        e.state = 'slash';
        e.timer = 0.22;
        e.vx = e.facing * 260;
        game.spawnProjectile({
          type: 'enemySlash',
          x: e.cx + e.facing * 34,
          y: e.y + e.h * 0.45,
          vx: 0,
          vy: 0,
          r: 26,
          damage: 2,
          life: 0.22,
          color: '#ff8a8a',
        });
      }
    } else if (e.state === 'slash') {
      e.timer -= dt;
      e.vx *= 1 - 6 * dt;
      if (e.timer <= 0) {
        e.state = 'idle';
        e.cooldown = 1.3;
      }
    }
  },
};
