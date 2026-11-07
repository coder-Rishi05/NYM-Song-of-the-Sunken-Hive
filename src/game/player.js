import { TILE, VIEW_H } from '../config.js';
import { TAU, clamp, approach, damp } from '../core/math.js';
import { moveBody, pointSolid, rectHitsSolid } from '../world/room.js';
import { audio } from '../core/audio.js';
import { drawNym } from '../render/nym.js';

export const PLAYER_W = 22;
export const PLAYER_H = 42;

const RUN_SPEED = 232;
const ACCEL = 2900;
const FRICTION = 3400;
const JUMP_VEL = -640;
const GRAVITY = 1950;
const MAX_FALL = 940;
const DASH_SPEED = 720;
const DASH_TIME = 0.15;
const DASH_CD = 0.42;

export class Player {
  constructor(x, y, save) {
    this.w = PLAYER_W;
    this.h = PLAYER_H;
    this.x = x - this.w / 2;
    this.y = y - this.h;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.onGround = false;
    this.onWallL = false;
    this.onWallR = false;
    this.wallDir = 0;

    this.coyote = 0;
    this.jumpBuffer = 0;
    this.jumpsLeft = 1;
    this.dropTimer = 0;
    this.runPhase = 0;
    this.lookY = 0;

    this.dashing = false;
    this.dashT = 0;
    this.dashCd = 0;
    this.dashDir = 1;
    this.ghostTimer = 0;

    this.attackT = 0;
    this.attackMax = 0.28;
    this.attackDir = 'side';
    this.attackId = 0;
    this.hitTargets = new Set();
    this.attackHit = false;

    this.castT = 0;
    this.focusing = false;
    this.focusT = 0;
    this.soulGlow = 0;

    this.iFrames = 0;
    this.state = 'idle';
    this.dead = false;
    this.deathT = 0;

    this.hp = save.hp;
    this.maxHp = save.maxHp;
    this.soul = save.soul;
    this.maxSoul = save.maxSoul;
    this.abilities = new Set(save.abilities || []);

    this.safeX = this.x;
    this.safeY = this.y;
    this.safeTimer = 0;
  }

  has(ability) {
    return this.abilities.has(ability);
  }

  get cx() {
    return this.x + this.w / 2;
  }

  get cy() {
    return this.y + this.h / 2;
  }

  get themeMode() {
    if (this.dead) return 'dead';
    if (this.dashing) return 'dash';
    if (this.focusing) return 'focus';
    if (this.iFrames > 0.85) return 'hurt';
    if (!this.onGround) return this.vy < 0 ? 'jump' : 'fall';
    if (Math.abs(this.vx) > 18) return 'run';
    return 'idle';
  }

  update(dt, game) {
    if (this.dead) {
      this.deathT += dt;
      this.vy += GRAVITY * dt;
      moveBody(this, game.room, dt);
      return;
    }

    const input = game.input;
    const uiLock = game.mode !== 'playing';

    this.iFrames = Math.max(0, this.iFrames - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.castT = Math.max(0, this.castT - dt);
    this.attackT = Math.max(0, this.attackT - dt);
    this.soulGlow = clamp(this.soul / this.maxSoul, 0, 1);

    let moveX = uiLock ? 0 : input.axisX();
    let moveY = uiLock ? 0 : input.axisY();

    if (this.focusing) moveX = 0;

    // ---- dash ----------------------------------------------------------
    if (
      !uiLock &&
      input.wasPressed('dash') &&
      this.dashCd <= 0 &&
      this.castT <= 0
    ) {
      this.dashing = true;
      this.dashT = DASH_TIME;
      this.dashCd = DASH_CD;
      this.dashDir = moveX !== 0 ? Math.sign(moveX) : this.facing;
      this.facing = this.dashDir;
      this.vy = 0;
      this.ghostTimer = 0;
      audio.sfx('dash');
      game.particles.burst(this.x + this.w / 2, this.y + this.h / 2, {
        count: 14, speed: 140, color: '#cfe6ff', size: 2.8, life: 0.35,
        shape: 'spark', angle: this.dashDir > 0 ? Math.PI : 0, spread: 0.9,
        additive: true,
      });
      game.camera.addShake(2.5);
    }

    if (this.dashing) {
      this.dashT -= dt;
      this.vx = this.dashDir * DASH_SPEED;
      this.vy = 0;
      this.ghostTimer -= dt;
      if (this.ghostTimer <= 0) {
        this.ghostTimer = 0.03;
        game.spawnGhost(this.x + this.w / 2, this.y + this.h);
      }
      if (this.dashT <= 0) {
        this.dashing = false;
        this.vx = this.dashDir * RUN_SPEED * 0.8;
      }
    } else {
      // ---- horizontal ------------------------------------------------
      const target = moveX * RUN_SPEED;
      if (moveX !== 0) {
        this.vx = approach(this.vx, target, ACCEL * dt);
        this.facing = moveX;
      } else {
        this.vx = approach(this.vx, 0, FRICTION * dt);
      }

      // ---- gravity ---------------------------------------------------
      if (!this.onGround) {
        this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt);
      }

      // ---- wall cling -------------------------------------------------
      this.wallDir = 0;
      if (this.has('cling') && !this.onGround && this.vy > 0) {
        const wallLeft = pointSolid(game.room, this.x - 3, this.y + this.h * 0.55);
        const wallRight = pointSolid(game.room, this.x + this.w + 3, this.y + this.h * 0.55);
        if ((wallLeft && moveX < 0) || (wallRight && moveX > 0)) {
          this.wallDir = wallLeft ? -1 : 1;
          this.vy = Math.min(this.vy, 135);
          this.jumpsLeft = 1;
          if (Math.random() < 0.25) {
            game.particles.spawn({
              x: this.x + (wallLeft ? 0 : this.w),
              y: this.y + this.h * 0.5,
              vx: -this.wallDir * 20,
              vy: -20 - Math.random() * 20,
              life: 0.3,
              size: 1.6,
              color: '#b9cfe8',
              additive: false,
              alpha: 0.5,
            });
          }
        }
      }

      // ---- jump ------------------------------------------------------
      if (!uiLock && input.wasPressed('jump')) this.jumpBuffer = 0.13;
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      this.coyote = this.onGround ? 0.1 : Math.max(0, this.coyote - dt);

      if (this.jumpBuffer > 0) {
        if (this.wallDir !== 0 && !this.onGround) {
          this.vy = JUMP_VEL * 0.92;
          this.vx = -this.wallDir * 280;
          this.facing = -this.wallDir;
          this.jumpBuffer = 0;
          this.coyote = 0;
          this.jumpsLeft = 1;
          audio.sfx('jump');
          game.particles.dust(this.x + this.w / 2, this.y + this.h * 0.6, -this.wallDir);
        } else if (this.coyote > 0) {
          this.vy = JUMP_VEL;
          this.onGround = false;
          this.coyote = 0;
          this.jumpBuffer = 0;
          this.jumpsLeft = this.has('wing') ? 1 : 0;
          audio.sfx('jump');
          game.particles.dust(this.x + this.w / 2, this.y + this.h, 0);
        } else if (this.jumpsLeft > 0 && this.has('wing')) {
          this.vy = JUMP_VEL * 0.82;
          this.jumpsLeft -= 1;
          this.jumpBuffer = 0;
          audio.sfx('doublejump');
          game.particles.burst(this.x + this.w / 2, this.y + this.h * 0.7, {
            count: 12, speed: 90, color: '#cfe6ff', size: 2, life: 0.45,
            shape: 'spark', angle: Math.PI / 2, spread: 1.4,
          });
        }
      }

      // variable jump height
      if (!uiLock && !input.isDown('jump') && this.vy < -180) this.vy *= 0.82;

      // drop through one-way platforms
      if (!uiLock && input.isDown('down') && input.wasPressed('jump') && this.onGround) {
        const below = game.room.oneWay[
          Math.floor((this.y + this.h + 4) / TILE) * game.room.w +
          Math.floor((this.x + this.w / 2) / TILE)
        ];
        if (below) {
          this.dropTimer = 0.18;
          this.y += 3;
          this.jumpBuffer = 0;
        }
      }
    }

    // ---- attack --------------------------------------------------------
    if (!uiLock && input.wasPressed('attack') && this.attackT <= 0 && !this.focusing && this.castT <= 0) {
      this.attackT = this.attackMax;
      this.attackId += 1;
      this.hitTargets.clear();
      this.attackHit = false;
      if (moveY < 0) this.attackDir = 'up';
      else if (moveY > 0 && !this.onGround) this.attackDir = 'down';
      else this.attackDir = 'side';
      audio.sfx('slash');
    }

    // ---- focus ---------------------------------------------------------
    const holdingFocus = !uiLock && input.isDown('focus');
    if (holdingFocus && this.onGround && this.soul >= 33 && !this.dashing) {
      this.focusing = true;
      this.focusT += dt;
      this.vx = approach(this.vx, 0, FRICTION * 2 * dt);
      if (this.focusT >= 0.9) {
        this.focusT = 0;
        this.soul -= 33;
        this.hp = Math.min(this.maxHp, this.hp + 1);
        audio.sfx('heal');
        game.camera.addShake(1.5);
        game.particles.burst(this.x + this.w / 2, this.y + this.h * 0.65, {
          count: 18, speed: 80, color: '#bff0ff', size: 2.4, life: 0.7,
          shape: 'dot', additive: true, gravity: -40,
        });
        game.toast('+1 mask', 0.8);
      }
      if (Math.random() < 0.5) {
        game.particles.spawn({
          x: this.x + this.w / 2 + (Math.random() - 0.5) * 46,
          y: this.y + this.h * 0.55 + (Math.random() - 0.5) * 40,
          vx: 0, vy: 0,
          life: 0.4, size: 1.8, color: '#bfeaff',
          shape: 'dot', additive: true,
        });
      }
    } else {
      this.focusing = false;
      this.focusT = 0;
    }

    // ---- cast / range attack ------------------------------------------
    if (!uiLock && input.wasPressed('cast') && this.castT <= 0) {
      const soulCost = this.has('spell') ? 25 : 0; // Spell costs soul, basic ranged dart is free
      if (this.has('spell') && this.soul < soulCost) {
        // If spell unlocked but insufficient soul, fall back or block
      } else {
        if (this.has('spell')) this.soul -= soulCost;
        this.castT = 0.28;
        const dir = moveY < 0 ? 'up' : 'side';
        game.spawnWisp(this.x + this.w / 2, this.y + this.h * 0.55, dir, this.facing, this.has('spell'));
        audio.sfx('spell');
      }
    }

    // ---- movement integration -----------------------------------------
    if (!this.dashing) {
      // Check water tile immersion
      if (game.room && game.room.water) {
        const cx = Math.floor((this.x + this.w / 2) / TILE);
        const cy = Math.floor((this.y + this.h * 0.75) / TILE);
        if (cx >= 0 && cx < game.room.w && cy >= 0 && cy < game.room.h) {
          if (game.room.water[cy * game.room.w + cx] === 1) {
            this.vx *= 0.78;
            this.vy = Math.min(this.vy, 280);
            if (!this.inWater) {
              this.inWater = true;
              audio.sfx('dash');
              game.particles.burst(this.x + this.w / 2, this.y + this.h, {
                count: 8, speed: 60, color: '#88d0ff', size: 2.2, life: 0.3,
                shape: 'dot', additive: true,
              });
            }
          } else {
            this.inWater = false;
          }
        } else {
          this.inWater = false;
        }
      }
      moveBody(this, game.room, dt);
    } else {
      this.onGround = false;
      this.onWallL = false;
      this.onWallR = false;
      moveBody(this, game.room, dt);
    }

    if (this.onGround && !this.dashing) {
      this.jumpsLeft = this.has('wing') ? 1 : 0;
    }

    if (Math.abs(this.vx) > 12 && this.onGround) this.runPhase += dt * Math.abs(this.vx) * 0.055;
    else this.runPhase += dt * 1.4;

    const targetLook = uiLock ? 0 : moveY * 70;
    this.lookY = damp(this.lookY, targetLook, 6, dt);

    // safe respawn point
    this.safeTimer -= dt;
    if (this.onGround && this.safeTimer <= 0 && !rectHitsSolid(game.room, this)) {
      this.safeX = this.x;
      this.safeY = this.y;
      this.safeTimer = 0.35;
    }

    // state label for audio/visuals
    this.state = this.themeMode;
  }

  attackRect() {
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h * 0.42;
    if (this.attackDir === 'up') {
      return { x: cx - 30, y: cy - 62, w: 60, h: 66 };
    }
    if (this.attackDir === 'down') {
      return { x: cx - 26, y: cy + 14, w: 52, h: 60 };
    }
    return {
      x: this.facing > 0 ? cx + 2 : cx - 66,
      y: cy - 26,
      w: 64,
      h: 60,
    };
  }

  attackActive() {
    return this.attackT > this.attackMax * 0.2 && this.attackT < this.attackMax * 0.78;
  }

  nailDamage(game) {
    let dmg = 5;
    if (game.hasItem('nail')) dmg += 3;
    if (game.hasItem('charm_ember')) dmg += 2;
    return dmg;
  }

  hurt(amount, fromX, game) {
    if (this.iFrames > 0 || this.dead) return false;
    this.hp -= amount;
    this.iFrames = 1.25;
    this.state = 'hurt';
    this.focusing = false;
    this.focusT = 0;
    if (this.soul >= 33) this.soul = Math.max(0, this.soul - 33);
    const dir = this.x + this.w / 2 < fromX ? -1 : 1;
    this.vx = dir * 300;
    this.vy = -250;
    this.dashing = false;
    this.dashT = 0;
    game.camera.addShake(9);
    game.hitstop = 0.06;
    game.flash = 1;
    audio.sfx('hurt');
    game.particles.burst(this.x + this.w / 2, this.y + this.h * 0.5, {
      count: 14, speed: 170, color: '#ff6a6a', size: 2.6, life: 0.5,
      shape: 'spark', gravity: 260, additive: true,
    });
    if (this.hp <= 0) this.die(game);
    return true;
  }

  die(game) {
    if (this.dead) return;
    this.dead = true;
    this.hp = 0;
    this.deathT = 0;
    this.state = 'dead';
    this.vy = -220;
    audio.sfx('death');
    game.camera.addShake(14);
    game.onPlayerDeath();
  }

  heal(amount = 1) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  restore() {
    this.hp = this.maxHp;
    this.soul = this.maxSoul;
  }

  draw(ctx, time) {
    drawNym(ctx, this, time);
  }
}
