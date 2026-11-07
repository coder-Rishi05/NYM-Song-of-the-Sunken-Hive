import { clamp, sign, dist, TAU } from '../core/math.js';
import { moveBody, pointSolid } from '../world/room.js';
import { audio } from '../core/audio.js';
import { drawMoltguard, drawWardenMolt, drawChoirMother } from '../render/bosses.js';

export const BOSS_DEFS = {
  moltguard: {
    name: 'Moltguard, the First Molt',
    hp: 130, w: 76, h: 58, dmg: 1, gravity: true,
    flag: 'boss_moltguard', music: 'boss',
  },
  warden: {
    name: 'Warden Molt',
    hp: 220, w: 104, h: 96, dmg: 1, gravity: true,
    flag: 'boss_warden', music: 'boss',
  },
  choir: {
    name: 'The Choir Mother',
    hp: 260, w: 80, h: 112, dmg: 1, gravity: false,
    flag: 'boss_choir', music: 'boss',
  },
};

const GRAVITY = 1950;

export class Boss {
  constructor(type, x, bottom, game) {
    const def = BOSS_DEFS[type];
    this.type = type;
    this.def = def;
    this.w = def.w;
    this.h = def.h;
    this.x = x - this.w / 2;
    this.y = bottom - this.h;
    this.spawnX = this.x;
    this.spawnY = this.y;
    this.vx = 0;
    this.vy = 0;
    this.facing = -1;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.dmg = def.dmg;
    this.dead = false;
    this.hitFlash = 0;
    this.telegraph = 0;
    this.state = 'intro';
    this.timer = type === 'choir' ? 2.2 : 1.6;
    this.cooldown = 1.2;
    this.phaseIndex = 0;
    this.phaseThresholds = type === 'choir' ? [0.66, 0.33] : [0.65, 0.3];
    this.anim = Math.random() * 10;
    this.summoned = false;
    this.shockDone = false;
    this.sprayCount = 0;
    this.sprayTimer = 0;
    this.flash = 0;
    this.overlay = 0;
    this.startX = this.x;
    this.startY = this.y;
    this.hitCooldown = 0;
    this.active = true;
    this.deathTimer = 0;
    this.introDone = false;
    this.teleported = false;
    this.dropTimer = 0;
    this.aura = 0;
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get bottom() { return this.y + this.h; }

  update(dt, game) {
    if (this.dead) return;
    this.anim += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.telegraph = Math.max(0, this.telegraph - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);

    if (this.hp <= 0) {
      this.die(game);
      return;
    }

    const behavior = this.type === 'choir' ? updateChoir : this.type === 'warden' ? updateWarden : updateMoltguard;
    behavior(this, dt, game);
  }

  hurt(amount, fromX, game, opts = {}) {
    if (this.dead || this.state === 'intro' || this.state === 'dying') return 0;
    this.hp -= amount;
    this.hitFlash = 0.12;
    this.flash = 0.4;
    game.gainSoul(5);
    game.camera.addShake(3);
    audio.sfx('hit');
    game.particles.burst(fromX, this.cy, {
      count: 8, speed: 130, color: '#ffe0b0', size: 2.4, life: 0.35, additive: true,
    });

    for (let i = 0; i < this.phaseThresholds.length; i++) {
      if (this.phaseIndex === i && this.hp / this.maxHp <= this.phaseThresholds[i]) {
        this.enterPhase(i + 1, game);
      }
    }

    if (this.hp <= 0) this.die(game);
    return amount;
  }

  enterPhase(index, game) {
    this.phaseIndex = index;
    this.telegraph = 1.0;
    game.camera.addShake(13);
    game.flash = 0.8;
    audio.sfx('roar');
    game.toast(index === 2 ? 'The air grows cold...' : 'It sheds its shell...', 2.2);
    game.particles.burst(this.cx, this.cy, {
      count: 30, speed: 240, color: '#ffb45e', size: 3.4, life: 0.9,
      gravity: 250, additive: true,
    });
    if (this.type === 'warden' && index === 1 && !this.summoned) {
      this.summoned = true;
      game.spawnEnemyAt('crawlid', this.cx - 150, this.bottom);
      game.spawnEnemyAt('crawlid', this.cx + 150, this.bottom);
    }
  }

  die(game) {
    if (this.dead) return;
    this.dead = true;
    this.state = 'dying';
    this.deathTimer = 2.4;
    this.vx = 0;
    audio.sfx('roar');
    game.camera.addShake(16);
    game.flash = 1;
    game.particles.burst(this.cx, this.cy, {
      count: 60, speed: 320, color: '#ffcf8a', size: 4, life: 1.4,
      gravity: 260, additive: true,
    });
    game.particles.burst(this.cx, this.cy, {
      count: 30, speed: 180, color: '#9ecbff', size: 3, life: 1.8,
      gravity: -40, additive: true,
    });
    game.onBossDefeated(this);
  }

  draw(ctx, time) {
    if (this.dead && this.state !== 'dying') return;
    const alpha = this.state === 'dying' ? clamp(this.deathTimer / 2.4, 0, 1) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (this.type === 'choir') drawChoirMother(ctx, this, time);
    else if (this.type === 'warden') drawWardenMolt(ctx, this, time);
    else drawMoltguard(ctx, this, time);

    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(0.6, this.hitFlash * 4);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(this.cx, this.cy, this.w * 0.55, this.h * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Moltguard
// ---------------------------------------------------------------------------
function updateMoltguard(b, dt, game) {
  const p = game.player;
  b.facing = sign(p.cx - b.cx) || b.facing;

  if (b.state === 'intro') {
    b.timer -= dt;
    b.vx = 0;
    if (b.timer <= 0) {
      b.state = 'idle';
      b.introDone = true;
    }
    return;
  }

  if (b.state === 'idle') {
    b.vx *= 1 - 5 * dt;
    if (b.cooldown > 0) return;
    const dx = p.cx - b.cx;
    const d = Math.abs(dx);
    if (d < 130) {
      b.state = 'swipe';
      b.timer = 0.5;
      b.telegraph = 0.4;
      b.vx = 0;
    } else if (d < 320 && Math.random() < 0.55) {
      b.state = 'slamWind';
      b.timer = 0.5;
      b.telegraph = 0.5;
    } else {
      b.state = 'charge';
      b.telegraph = 0.55;
      b.timer = 1.2;
      b.vx = 0;
      b.shockDone = false;
    }
  } else if (b.state === 'swipe') {
    b.timer -= dt;
    b.vx = 0;
    if (b.timer <= 0) {
      game.spawnProjectile({
        type: 'enemySlash', x: b.cx + b.facing * 40, y: b.cy, r: 44,
        damage: 1, life: 0.3, color: '#ff9b6a',
      });
      game.camera.addShake(5);
      audio.sfx('slam');
      b.state = 'recover';
      b.timer = 0.55;
      b.cooldown = 1.0;
    }
  } else if (b.state === 'charge') {
    b.timer -= dt;
    if (b.timer > 0.65) {
      b.vx = 0;
    } else {
      b.vx = b.facing * (b.phaseIndex > 0 ? 460 : 400);
      if (b.onWallL || b.onWallR) {
        b.state = 'stun';
        b.timer = 1.1;
        b.vx = -b.facing * 60;
        game.camera.addShake(9);
        audio.sfx('slam');
        game.particles.burst(b.cx, b.cy, { count: 14, speed: 180, color: '#c9b4a8', size: 3.4, life: 0.6, gravity: 300 });
      }
    }
    if (b.timer <= 0) {
      b.state = 'idle';
      b.cooldown = 0.8;
    }
  } else if (b.state === 'slamWind') {
    b.timer -= dt;
    b.vx = 0;
    if (b.timer <= 0) {
      b.state = 'slamAir';
      b.vy = -640;
      b.vx = clamp((p.cx - b.cx) * 1.2, -330, 330);
      b.shockDone = false;
    }
  } else if (b.state === 'slamAir') {
    if (b.onGround) {
      b.state = 'recover';
      b.timer = 0.7;
      b.cooldown = 1.1;
      b.vx = 0;
      game.camera.addShake(12);
      audio.sfx('slam');
      game.particles.burst(b.cx, b.bottom - 6, {
        count: 24, speed: 240, color: '#c9b4a8', size: 3.6, life: 0.7,
        gravity: 500, additive: false,
      });
      for (const s of [-1, 1]) {
        game.spawnProjectile({
          type: 'wave', x: b.cx, y: b.bottom - 14, vx: s * 260, vy: 0, r: 18,
          damage: 1, life: 1.5, ghost: true, color: '#ffb45e',
        });
      }
    }
  } else if (b.state === 'stun') {
    b.timer -= dt;
    b.vx *= 1 - 6 * dt;
    if (b.timer <= 0) {
      b.state = 'idle';
      b.cooldown = 0.7;
    }
  } else if (b.state === 'recover') {
    b.timer -= dt;
    b.vx *= 1 - 6 * dt;
    if (b.timer <= 0) b.state = 'idle';
  }

  b.vy = Math.min(900, b.vy + GRAVITY * dt);
  moveBody(b, game.room, dt);
  if (b.onGround) b.vy = 0;
}

// ---------------------------------------------------------------------------
// Warden Molt
// ---------------------------------------------------------------------------
function updateWarden(b, dt, game) {
  const p = game.player;
  b.facing = sign(p.cx - b.cx) || b.facing;

  if (b.state === 'intro') {
    b.timer -= dt;
    b.vx = 0;
    if (b.timer <= 0) {
      b.state = 'idle';
      b.cooldown = 0.9;
      b.introDone = true;
    }
    return;
  }
  if (b.state === 'dying') {
    b.deathTimer -= dt;
    b.vx *= 1 - 3 * dt;
    b.vy = Math.min(900, b.vy + GRAVITY * dt);
    moveBody(b, game.room, dt);
    return;
  }

  const d = Math.abs(p.cx - b.cx);
  const enraged = b.phaseIndex >= 2;

  if (b.state === 'idle') {
    if (d > 90) b.vx = b.facing * (enraged ? 90 : 55);
    else b.vx *= 1 - 5 * dt;
    if (b.cooldown <= 0) {
      const roll = Math.random();
      if (d < 220 || roll < 0.34) {
        b.state = 'slamWind';
        b.timer = 0.55;
        b.telegraph = 0.55;
      } else if (roll < 0.68) {
        b.state = 'chargeWind';
        b.timer = 0.6;
        b.telegraph = 0.6;
      } else {
        b.state = 'sprayWind';
        b.timer = 0.55;
        b.telegraph = 0.55;
        b.sprayCount = b.phaseIndex >= 1 ? 3 : 2;
        b.sprayTimer = 0.4;
      }
    }
  } else if (b.state === 'slamWind') {
    b.timer -= dt;
    b.vx = 0;
    if (b.timer <= 0) {
      b.state = 'slamAir';
      b.vy = -760;
      b.vx = clamp((p.cx - b.cx) * 1.6, -420, 420);
    }
  } else if (b.state === 'slamAir') {
    if (b.onGround) {
      b.state = 'recover';
      b.timer = 0.85;
      b.cooldown = 1.0;
      b.vx = 0;
      game.camera.addShake(15);
      audio.sfx('slam');
      game.particles.burst(b.cx, b.bottom - 6, {
        count: 34, speed: 280, color: '#c9b4a8', size: 4, life: 0.8,
        gravity: 520, additive: false,
      });
      for (const s of [-1, 1]) {
        game.spawnProjectile({
          type: 'wave', x: b.cx, y: b.bottom - 16, vx: s * 320, vy: 0, r: 20,
          damage: 1, life: 1.4, ghost: true, color: '#ffb45e',
        });
      }
      if (b.phaseIndex >= 1) {
        for (let i = 0; i < 3; i++) {
          game.spawnProjectile({
            type: 'spike', x: p.cx + (i - 1) * 90, y: 30, vx: 0, vy: 200,
            gravity: 900, r: 9, damage: 1, life: 3, color: '#d8c4ff',
          });
        }
      }
    }
  } else if (b.state === 'chargeWind') {
    b.timer -= dt;
    b.vx = 0;
    if (b.timer <= 0) {
      b.state = 'charge';
      b.timer = b.phaseIndex >= 1 ? 1.1 : 1.25;
      b.vx = b.facing * (enraged ? 560 : 500);
      b.shockDone = false;
    }
  } else if (b.state === 'charge') {
    b.timer -= dt;
    b.vx = b.facing * (enraged ? 560 : 500);
    if (b.onWallL || b.onWallR || b.timer <= 0) {
      b.state = 'stun';
      b.timer = 1.0;
      b.vx = -b.facing * 80;
      b.vy = -120;
      game.camera.addShake(12);
      audio.sfx('slam');
    }
  } else if (b.state === 'stun') {
    b.timer -= dt;
    b.vx *= 1 - 6 * dt;
    if (b.timer <= 0) {
      b.state = 'idle';
      b.cooldown = 0.8;
    }
  } else if (b.state === 'sprayWind') {
    b.timer -= dt;
    b.vx = 0;
    if (b.timer <= 0) {
      b.state = 'spray';
      b.timer = 0.9;
      b.sprayTimer = 0.15;
    }
  } else if (b.state === 'spray') {
    b.timer -= dt;
    b.vx = 0;
    b.sprayTimer -= dt;
    if (b.sprayTimer <= 0 && b.sprayCount > 0) {
      b.sprayCount -= 1;
      b.sprayTimer = 0.26;
      for (let i = 0; i < 5; i++) {
        const a = -0.5 + (i / 4) * 1.0;
        const speed = 300 + Math.random() * 70;
        game.spawnProjectile({
          type: 'glob',
          x: b.cx + b.facing * 30,
          y: b.cy - 20,
          vx: Math.cos(a) * speed * b.facing + b.facing * 40,
          vy: Math.sin(a) * speed - 60,
          gravity: 500,
          r: 8,
          damage: 1,
          life: 3,
          color: '#d08a6a',
        });
      }
      audio.sfx('slash');
    }
    if (b.timer <= 0) {
      b.state = 'idle';
      b.cooldown = 1.0;
    }
  } else if (b.state === 'recover') {
    b.timer -= dt;
    b.vx *= 1 - 6 * dt;
    if (b.timer <= 0) b.state = 'idle';
  }

  b.vy = Math.min(1000, b.vy + GRAVITY * dt);
  moveBody(b, game.room, dt);
  if (b.onGround) b.vy = 0;
  b.x = clamp(b.x, 40, game.room.pxW - b.w - 40);
}

// ---------------------------------------------------------------------------
// Choir Mother
// ---------------------------------------------------------------------------
function updateChoir(b, dt, game) {
  const p = game.player;
  b.aura = 0.5 + Math.sin(b.anim * 2) * 0.5;

  if (b.state === 'intro') {
    b.timer -= dt;
    b.y = b.startY + Math.sin(b.anim * 1.6) * 8;
    if (b.timer <= 0) {
      b.state = 'float';
      b.introDone = true;
      b.cooldown = 1.0;
    }
    return;
  }
  if (b.state === 'dying') {
    b.deathTimer -= dt;
    b.y += Math.sin(b.anim * 2) * 0.5;
    return;
  }

  const enraged = b.phaseIndex >= 2;
  const px = p.cx;
  const targetX = clamp(px, 160, game.room.pxW - 160);
  const targetY = 150 + Math.sin(b.anim * 0.9) * 40;

  if (b.state === 'float') {
    b.x += (targetX - b.cx) * 0.55 * dt;
    b.y += (targetY - b.y) * 0.7 * dt;
    b.facing = sign(px - b.cx) || b.facing;
    if (b.cooldown <= 0) {
      const roll = Math.random();
      if (roll < 0.33) {
        b.state = 'fanWind';
        b.timer = 0.6;
        b.telegraph = 0.6;
      } else if (roll < 0.62) {
        b.state = 'diveWind';
        b.timer = 0.7;
        b.telegraph = 0.7;
      } else if (roll < 0.84 || b.phaseIndex === 0) {
        b.state = 'rainWind';
        b.timer = 0.6;
        b.telegraph = 0.6;
      } else {
        b.state = 'teleport';
        b.timer = 0.35;
        b.teleported = false;
      }
    }
  } else if (b.state === 'fanWind') {
    b.timer -= dt;
    if (b.timer <= 0) {
      const count = b.phaseIndex >= 1 ? 6 : 5;
      for (let i = 0; i < count; i++) {
        const a = Math.PI * 0.25 + (i / (count - 1)) * Math.PI * 0.5;
        game.spawnProjectile({
          type: 'note',
          x: b.cx,
          y: b.cy,
          vx: Math.cos(a) * 210,
          vy: Math.sin(a) * 210,
          r: 7,
          damage: 1,
          life: 5,
          homing: 1.4,
          color: '#d8c4ff',
        });
      }
      audio.sfx('spell');
      b.state = 'float';
      b.cooldown = enraged ? 1.0 : 1.6;
    }
  } else if (b.state === 'diveWind') {
    b.timer -= dt;
    b.y -= 40 * dt;
    if (b.timer <= 0) {
      b.state = 'dive';
      b.timer = 0.75;
      const a = Math.atan2(p.cy - b.cy, p.cx - b.cx);
      b.vx = Math.cos(a) * 720;
      b.vy = Math.sin(a) * 720;
      game.camera.addShake(4);
    }
  } else if (b.state === 'dive') {
    b.timer -= dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.timer <= 0 || b.x < 40 || b.x + b.w > game.room.pxW - 40 || b.y < 40) {
      b.state = 'float';
      b.cooldown = 0.9;
      b.vx = 0;
      b.vy = 0;
    }
  } else if (b.state === 'rainWind') {
    b.timer -= dt;
    if (b.timer <= 0) {
      const count = b.phaseIndex >= 1 ? 9 : 7;
      for (let i = 0; i < count; i++) {
        game.spawnProjectile({
          type: 'spike',
          x: 80 + Math.random() * (game.room.pxW - 160),
          y: 20,
          vx: 0,
          vy: 260 + Math.random() * 120,
          gravity: 620,
          r: 9,
          damage: 1,
          life: 3.4,
          color: '#cbb4ff',
        });
      }
      b.state = 'float';
      b.cooldown = enraged ? 1.0 : 1.7;
    }
  } else if (b.state === 'teleport') {
    b.timer -= dt;
    if (b.timer <= 0 && !b.teleported) {
      b.teleported = true;
      b.x = 120 + Math.random() * (game.room.pxW - 240);
      b.y = 110 + Math.random() * 120;
      game.particles.burst(b.cx, b.cy, {
        count: 20, speed: 140, color: '#cbb4ff', size: 2.6, life: 0.5, additive: true,
      });
      b.timer = 0.4;
    }
    if (b.timer <= 0 && b.teleported) {
      b.state = 'float';
      b.cooldown = 0.7;
      b.teleported = false;
      if (b.phaseIndex >= 2) {
        // radial burst on arrival
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          game.spawnProjectile({
            type: 'note', x: b.cx, y: b.cy,
            vx: Math.cos(a) * 230, vy: Math.sin(a) * 230,
            r: 7, damage: 1, life: 4, homing: 1.0, color: '#e0b4ff',
          });
        }
      }
    }
  } else if (b.state === 'recover') {
    b.timer -= dt;
    if (b.timer <= 0) b.state = 'float';
  }

  b.x = clamp(b.x, 30, game.room.pxW - b.w - 30);
  b.y = clamp(b.y, 30, game.room.pxH - b.h - 130);
}

export function createBoss(type, x, bottom, game) {
  return new Boss(type, x, bottom, game);
}
