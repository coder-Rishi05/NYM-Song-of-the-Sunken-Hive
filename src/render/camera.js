import { clamp, damp, rand } from '../core/math.js';
import { VIEW_W, VIEW_H } from '../config.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.shake = 0;
    this.shakeMag = 0;
    this.ox = 0;
    this.oy = 0;
    this.lookX = 0;
    this.lookY = 0;
  }

  snap(bounds) {
    this.x = clamp(this.x, 0, Math.max(0, bounds.w - VIEW_W));
    this.y = clamp(this.y, 0, Math.max(0, bounds.h - VIEW_H));
  }

  setToTarget(target, bounds, instant = false) {
    const tx = target.x + target.w / 2 - VIEW_W / 2 + this.lookX;
    const ty = target.y + target.h / 2 - VIEW_H / 2 + this.lookY;
    const cx = clamp(tx, 0, Math.max(0, bounds.w - VIEW_W));
    const cy = clamp(ty, 0, Math.max(0, bounds.h - VIEW_H));
    if (bounds.w < VIEW_W) this.x = (bounds.w - VIEW_W) / 2;
    else this.x = instant ? cx : this.x;
    if (bounds.h < VIEW_H) this.y = (bounds.h - VIEW_H) / 2;
    else this.y = instant ? cy : this.y;
    if (instant) {
      this.x = bounds.w < VIEW_W ? (bounds.w - VIEW_W) / 2 : cx;
      this.y = bounds.h < VIEW_H ? (bounds.h - VIEW_H) / 2 : cy;
    }
  }

  follow(target, bounds, dt) {
    this.lookX = damp(this.lookX, target.facing * 34, 3, dt);
    this.lookY = damp(this.lookY, target.lookY || 0, 3, dt);
    const tx = target.x + target.w / 2 - VIEW_W / 2 + this.lookX;
    const ty = target.y + target.h / 2 - VIEW_H / 2 + this.lookY;

    if (bounds.w <= VIEW_W) this.x = (bounds.w - VIEW_W) / 2;
    else this.x = damp(this.x, clamp(tx, 0, bounds.w - VIEW_W), 6.5, dt);

    if (bounds.h <= VIEW_H) this.y = (bounds.h - VIEW_H) / 2;
    else this.y = damp(this.y, clamp(ty, 0, bounds.h - VIEW_H), 5.5, dt);

    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt);
      const k = this.shake;
      this.ox = rand(1, -1) * this.shakeMag * k;
      this.oy = rand(1, -1) * this.shakeMag * k;
    } else {
      this.ox = 0;
      this.oy = 0;
    }
  }

  addShake(mag) {
    this.shake = Math.max(this.shake, 0.32);
    this.shakeMag = Math.max(this.shakeMag, mag);
  }

  apply(ctx) {
    ctx.translate(-Math.round(this.x - this.ox), -Math.round(this.y - this.oy));
  }
}
