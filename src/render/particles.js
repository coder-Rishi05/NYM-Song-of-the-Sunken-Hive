import { rand } from '../core/math.js';

const DEFAULT = {
  x: 0, y: 0, vx: 0, vy: 0,
  life: 0.6, maxLife: 0.6,
  size: 3, endSize: 0,
  color: '#ffffff', alpha: 1,
  gravity: 0, drag: 0,
  shape: 'dot', additive: true, rotation: 0, spin: 0,
};

export class Particles {
  constructor(cap = 620) {
    this.list = [];
    this.cap = cap;
  }

  clear() {
    this.list.length = 0;
  }

  spawn(opts) {
    if (this.list.length >= this.cap) this.list.shift();
    const p = { ...DEFAULT, ...opts, maxLife: opts.life || DEFAULT.life };
    p.life = p.maxLife;
    this.list.push(p);
    return p;
  }

  burst(x, y, opts = {}) {
    const {
      count = 10, speed = 120, spread = Math.PI * 2, angle = 0,
      color = '#cfe4ff', size = 3, life = 0.6, gravity = 0, drag = 2,
      shape = 'dot', additive = true, endSize = 0,
    } = opts;
    for (let i = 0; i < count; i++) {
      const a = angle + (spread === Math.PI * 2
        ? Math.random() * Math.PI * 2
        : angle - spread / 2 + Math.random() * spread);
      const s = speed * (0.35 + Math.random() * 0.9);
      this.spawn({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life * (0.6 + Math.random() * 0.8),
        size: size * (0.6 + Math.random() * 0.9),
        endSize,
        color,
        gravity,
        drag,
        shape,
        additive,
        rotation: Math.random() * Math.PI,
        spin: rand(4, -4),
      });
    }
  }

  dust(x, y, dir = 1, color = '#8fa3bd') {
    for (let i = 0; i < 5; i++) {
      this.spawn({
        x: x + rand(8, -8),
        y: y + rand(2, -4),
        vx: dir * rand(90, 20),
        vy: rand(-10, -60),
        life: rand(0.5, 0.25),
        size: rand(4, 1.5),
        endSize: 0,
        color,
        gravity: 120,
        drag: 3,
        additive: false,
        alpha: 0.5,
      });
    }
  }

  update(dt) {
    const list = this.list;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0) {
        list.splice(i, 1);
        continue;
      }
      const d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d;
      p.vy = p.vy * d + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.spin * dt;
    }
  }

  draw(ctx) {
    const list = this.list;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      const t = p.life / p.maxLife;
      const size = Math.max(0.1, p.size + (p.endSize - p.size) * (1 - t));
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, t * p.alpha));
      if (p.additive) ctx.globalCompositeOperation = 'lighter';
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.shape === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(0.6, 2.2 * t);
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(1, size), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'spark') {
        ctx.fillRect(-size * 1.6, -size * 0.18, size * 3.2, size * 0.36);
      } else if (p.shape === 'smoke') {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'shard') {
        ctx.beginPath();
        ctx.moveTo(0, -size * 1.4);
        ctx.lineTo(size * 0.7, size * 0.8);
        ctx.lineTo(-size * 0.7, size * 0.8);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
