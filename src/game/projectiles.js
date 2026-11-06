import { TAU, clamp, rectsOverlap } from '../core/math.js';
import { pointSolid } from '../world/room.js';
import { hexA } from '../world/room.js';

export class Projectiles {
  constructor() {
    this.list = [];
  }

  clear() {
    this.list.length = 0;
  }

  spawn(opts) {
    const p = {
      x: 0, y: 0, vx: 0, vy: 0, r: 6, damage: 1,
      life: 3, gravity: 0, homing: 0, friendly: false,
      color: '#ffffff', type: 'orb', dead: false, speed: 0,
      ...opts,
    };
    if (opts.speed === undefined) p.speed = Math.hypot(p.vx, p.vy);
    this.list.push(p);
    return p;
  }

  update(dt, game) {
    const room = game.room;
    const player = game.player;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0 || p.dead) {
        this.list.splice(i, 1);
        continue;
      }

      if (p.homing > 0 && !p.friendly && player && !player.dead) {
        const dx = player.x + player.w / 2 - p.x;
        const dy = player.y + player.h / 2 - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const k = clamp(p.homing * dt, 0, 1);
        p.vx += ((dx / d) * p.speed - p.vx) * k;
        p.vy += ((dy / d) * p.speed - p.vy) * k;
      }
      if (p.gravity) p.vy += p.gravity * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (!p.ghost && pointSolid(room, p.x, p.y)) {
        this.impact(game, p);
        this.list.splice(i, 1);
        continue;
      }
      if (p.y > room.pxH + 100 || p.y < -200 || p.x < -100 || p.x > room.pxW + 100) {
        this.list.splice(i, 1);
        continue;
      }

      if (p.friendly) {
        const targets = game.allEnemies();
        let hit = false;
        for (const e of targets) {
          if (!e || e.dead) continue;
          if (rectsOverlap(pRect(p), { x: e.x, y: e.y, w: e.w, h: e.h })) {
            const before = e.hp;
            e.hurt(p.damage, p.x, game, {});
            game.gainSoul(4);
            game.particles.burst(p.x, p.y, {
              count: 8, speed: 110, color: p.color, size: 2.4, life: 0.35, additive: true,
            });
            hit = true;
            break;
          }
        }
        if (hit && !p.pierce) {
          this.list.splice(i, 1);
          continue;
        }
      } else if (player && !player.dead) {
        if (rectsOverlap(pRect(p), { x: player.x, y: player.y, w: player.w, h: player.h })) {
          if (player.hurt(p.damage, p.x, game)) {
            this.list.splice(i, 1);
            continue;
          }
        }
      }

      if (p.type === 'wisp' && Math.random() < 0.6) {
        game.particles.spawn({
          x: p.x + (Math.random() - 0.5) * 6,
          y: p.y + (Math.random() - 0.5) * 6,
          vx: -p.vx * 0.08,
          vy: -p.vy * 0.08,
          life: 0.28, size: 2.2, color: p.color, additive: true,
        });
      }
    }
  }

  impact(game, p) {
    game.particles.burst(p.x, p.y, {
      count: 6, speed: 100, color: p.color, size: 2, life: 0.3, additive: true,
    });
  }

  draw(ctx, time) {
    for (const p of this.list) {
      ctx.save();
      ctx.translate(p.x, p.y);
      const pulse = 0.8 + Math.sin(time * 12 + p.x) * 0.2;

      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 4.2);
      g.addColorStop(0, hexA(p.color, 0.4));
      g.addColorStop(1, hexA(p.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 4.2, 0, TAU);
      ctx.fill();

      ctx.globalCompositeOperation = 'lighter';
      if (p.type === 'note') {
        ctx.rotate(Math.sin(time * 4 + p.y * 0.01) * 0.3);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0.4, Math.PI * 1.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.r * 0.9, -p.r * 0.4);
        ctx.lineTo(p.r * 0.9, -p.r * 1.8);
        ctx.stroke();
      } else if (p.type === 'wave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, -0.4, Math.PI + 0.4);
        ctx.stroke();
      } else if (p.type === 'spike') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.r * 2);
        ctx.lineTo(p.r * 0.8, p.r);
        ctx.lineTo(-p.r * 0.8, p.r);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'enemySlash') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, -1, 1);
        ctx.stroke();
      } else if (p.type === 'glob') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, Math.sin(time * 8) * 1.5, p.r, p.r * 1.15, 0, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.r * pulse, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 2.1, 0, TAU);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

function pRect(p) {
  return { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 };
}
