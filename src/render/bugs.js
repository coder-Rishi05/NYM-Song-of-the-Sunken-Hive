// Enemy silhouettes. Each type has a distinct shape language and eye colour.
import { TAU, clamp } from '../core/math.js';

const TYPES = {
  crawlid:   { eye: '#ffb45e', shell: '#2a3342', dark: '#171d28', rim: 'rgba(150,180,220,0.35)' },
  buzzer:    { eye: '#8ff0ff', shell: '#2b3b46', dark: '#16232b', rim: 'rgba(140,220,240,0.35)' },
  sporeling: { eye: '#b7ffd9', shell: '#2c4a3f', dark: '#16261f', rim: 'rgba(150,230,200,0.3)' },
  ramshell:  { eye: '#ff7a5c', shell: '#3a2b34', dark: '#1c141a', rim: 'rgba(230,150,140,0.32)' },
  maskfly:   { eye: '#ffd28a', shell: '#3a3a44', dark: '#1d1d24', rim: 'rgba(220,210,190,0.3)' },
  silkdrop:  { eye: '#c9b6ff', shell: '#2f2a44', dark: '#181426', rim: 'rgba(190,170,240,0.32)' },
  blowfly:   { eye: '#ff9b6a', shell: '#3a2a24', dark: '#1d1411', rim: 'rgba(240,160,120,0.32)' },
  bulwark:   { eye: '#9fb8d8', shell: '#333c4a', dark: '#1a2029', rim: 'rgba(170,200,230,0.3)' },
  chorister: { eye: '#e2d0ff', shell: '#33294a', dark: '#191325', rim: 'rgba(210,190,255,0.35)' },
  husk:      { eye: '#ff5a5a', shell: '#20242e', dark: '#101319', rim: 'rgba(200,160,160,0.3)' },
};

export function drawBug(ctx, e, time) {
  const cfg = TYPES[e.type] || TYPES.crawlid;
  if (e.hidden) return;
  const bob = e.fly ? Math.sin(time * 4 + e.anim) * 3 : 0;

  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h + bob);

  // shadow
  if (!e.fly) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#00040a';
    ctx.beginPath();
    ctx.ellipse(0, 2, e.w * 0.55, 4, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  ctx.scale(e.facing || 1, 1);
  ctx.scale(1.1, 1.1);

  if (e.telegraph > 0 && Math.sin(time * 24) > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffb45e';
    ctx.beginPath();
    ctx.ellipse(0, -e.h * 0.45, e.w * 0.7, e.h * 0.65, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  const fn = DRAW[e.type] || DRAW.crawlid;
  fn(ctx, e, cfg, time);

  if (e.hitFlash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(0.85, e.hitFlash * 7);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, -e.h * 0.48, e.w * 0.6, e.h * 0.55, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  if (e.shielded && e.shieldFlash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(0.8, e.shieldFlash * 6);
    ctx.strokeStyle = '#a8d8ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(e.w * 0.45, -e.h * 0.5, e.w * 0.7, -1.2, 1.2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function legs(ctx, count, topY, bottomY, spread, phase, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1) - 0.5) * 2;
    const x = t * spread;
    const swing = Math.sin(phase + i * 1.3) * 2.2;
    ctx.moveTo(x * 0.6, topY);
    ctx.lineTo(x + swing, bottomY);
  }
  ctx.stroke();
}

function eye(ctx, x, y, r, color, glow = true) {
  if (glow) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function shell(ctx, cx, cy, rx, ry, rot, fill, rim) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, rot, 0, TAU);
  ctx.fill();
  if (rim) {
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rot, Math.PI * 0.9, Math.PI * 1.9);
    ctx.stroke();
  }
}

const DRAW = {
  crawlid(ctx, e, c, time) {
    const step = Math.sin(time * 8 + e.anim) * 3;
    legs(ctx, 4, -10, 0, 12, time * 9 + e.anim, c.dark);
    shell(ctx, 0, -11, 16, 11, 0, c.shell, c.rim);
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.ellipse(0, -15, 10, 5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = c.rim;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(8, -14);
    ctx.stroke();
    ctx.globalAlpha = 1;
    eye(ctx, 5, -12, 2.1, c.eye);
    eye(ctx, -2, -13, 1.4, c.eye, false);
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, -14);
    ctx.quadraticCurveTo(19, -18 + step, 22, -13);
    ctx.stroke();
  },

  buzzer(ctx, e, c, time) {
    const flap = Math.sin(time * 34 + e.anim) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#cfefff';
    ctx.beginPath();
    ctx.ellipse(-5, -22 + flap * 3, 10, 4, -0.5, 0, TAU);
    ctx.ellipse(5, -22 - flap * 3, 10, 4, 0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -18);
    ctx.lineTo(-7, -10);
    ctx.moveTo(2, -18);
    ctx.lineTo(6, -10);
    ctx.stroke();
    shell(ctx, 0, -20, 9, 7, 0, c.shell, c.rim);
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.ellipse(0, -25, 5, 3.4, 0, 0, TAU);
    ctx.fill();
    eye(ctx, 4, -20, 1.8, c.eye);
    eye(ctx, -2, -21, 1.4, c.eye);
    ctx.strokeStyle = c.rim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, -18);
    ctx.lineTo(-12, -21);
    ctx.stroke();
  },

  sporeling(ctx, e, c, time) {
    const puff = e.castT > 0 ? Math.sin(e.castT * 40) * 2 : 0;
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(0, -12);
    ctx.stroke();
    ctx.fillStyle = c.shell;
    ctx.beginPath();
    ctx.ellipse(0, -18 - puff, 17, 12 + puff * 0.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.ellipse(0, -12, 13, 5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = c.rim;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + e.anim;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 9, -19 + Math.sin(a) * 5, 2, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    eye(ctx, -4, -15, 1.5, c.eye);
    eye(ctx, 4, -15, 1.5, c.eye, false);
  },

  ramshell(ctx, e, c, time) {
    const shake = e.telegraph > 0 ? Math.sin(time * 60) * 2 : 0;
    ctx.translate(shake, 0);
    legs(ctx, 4, -12, 0, 16, time * 12 + e.anim, c.dark);
    shell(ctx, 0, -17, 24, 16, 0, c.shell, c.rim);
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.moveTo(10, -30);
    ctx.lineTo(26, -34);
    ctx.lineTo(16, -20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = c.rim;
    ctx.globalAlpha = 0.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(0, -17, 18 + i * 3, -Math.PI * 0.85, -Math.PI * 0.15);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    eye(ctx, 12, -20, 2.4, c.eye);
    eye(ctx, 4, -23, 1.5, c.eye, false);
    ctx.fillStyle = '#e8d9c8';
    ctx.beginPath();
    ctx.moveTo(14, -16);
    ctx.lineTo(20, -12);
    ctx.lineTo(13, -10);
    ctx.closePath();
    ctx.fill();
  },

  maskfly(ctx, e, c, time) {
    if (e.burrowed) {
      ctx.fillStyle = '#1a1f28';
      ctx.beginPath();
      ctx.ellipse(0, -3, 14, 5, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = c.rim;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(Math.sin(time * 2 + i) * 8, -6 - i, 1.5, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      return;
    }
    const flap = Math.sin(time * 26 + e.anim) * 0.4;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#e8dfc8';
    ctx.beginPath();
    ctx.ellipse(-8, -16 + flap * 2, 11, 5, -0.4, 0, TAU);
    ctx.ellipse(8, -16 - flap * 2, 11, 5, 0.4, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = c.shell;
    ctx.beginPath();
    ctx.ellipse(0, -16, 15, 9, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d9d2c1';
    ctx.beginPath();
    ctx.ellipse(0, -15, 10, 5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.ellipse(-4, -15, 2, 2.8, 0, 0, TAU);
    ctx.ellipse(4, -15, 2, 2.8, 0, 0, TAU);
    ctx.fill();
    eye(ctx, 0, -12, 1.2, c.eye, false);
  },

  silkdrop(ctx, e, c, time) {
    if (e.threadTop != null) {
      ctx.strokeStyle = 'rgba(210,225,245,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -e.h);
      ctx.lineTo(0, -e.threadTop);
      ctx.stroke();
    }
    const sway = Math.sin(time * 3 + e.anim) * 3;
    ctx.fillStyle = c.shell;
    ctx.beginPath();
    ctx.moveTo(0 + sway, 0);
    ctx.quadraticCurveTo(-11 + sway, -8, -7, -18);
    ctx.quadraticCurveTo(0, -24, 7, -18);
    ctx.quadraticCurveTo(11 + sway, -8, sway, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = c.rim;
    ctx.lineWidth = 1;
    ctx.stroke();
    legs(ctx, 4, -14, -4, 8, time * 6 + e.anim, c.dark);
    eye(ctx, -3, -14, 1.6, c.eye);
    eye(ctx, 3, -14, 1.6, c.eye);
  },

  blowfly(ctx, e, c, time) {
    const fuse = e.fuseT > 0 ? Math.abs(Math.sin(time * 28)) : 0;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ffd0a0';
    ctx.beginPath();
    ctx.ellipse(-8, -20, 9, 4, -0.5, 0, TAU);
    ctx.ellipse(8, -20, 9, 4, 0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
    shell(ctx, 0, -17, 12, 11, 0, c.shell, c.rim);
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.ellipse(0, -22, 7, 5, 0, 0, TAU);
    ctx.fill();
    if (e.fuseT > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.4 + fuse * 0.5;
      ctx.fillStyle = '#ff6a3a';
      ctx.beginPath();
      ctx.arc(0, -17, 13 + fuse * 3, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    eye(ctx, 4, -22, 2, c.eye);
    eye(ctx, -3, -22, 2, c.eye);
  },

  bulwark(ctx, e, c, time) {
    legs(ctx, 4, -14, 0, 12, time * 5 + e.anim, c.dark);
    shell(ctx, 0, -18, 14, 15, 0, c.shell, c.rim);
    // shield
    ctx.save();
    ctx.translate(10, -19);
    ctx.fillStyle = '#46536a';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + Math.PI / 6;
      const x = Math.cos(a) * 12;
      const y = Math.sin(a) * 17;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8ba4c4';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#1a2029';
    ctx.beginPath();
    ctx.ellipse(-2, 5, 3.4, 5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    eye(ctx, -3, -21, 1.8, c.eye);
    eye(ctx, -8, -19, 1.2, c.eye, false);
  },

  chorister(ctx, e, c, time) {
    const flap = Math.sin(time * 12 + e.anim) * 0.45;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#a48ad0';
    ctx.beginPath();
    ctx.ellipse(-14, -22 + flap * 4, 15, 8, -0.5, 0, TAU);
    ctx.ellipse(14, -22 - flap * 4, 15, 8, 0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = c.rim;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-22, -20);
    ctx.lineTo(-10, -26);
    ctx.moveTo(22, -20);
    ctx.lineTo(10, -26);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.shell;
    ctx.beginPath();
    ctx.ellipse(0, -20, 7, 13, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8ddff';
    ctx.beginPath();
    ctx.ellipse(0, -26, 4.5, 4, 0, 0, TAU);
    ctx.fill();
    eye(ctx, -1.5, -26, 1.1, c.eye, false);
    eye(ctx, 2, -26, 1.1, c.eye, false);
    if (e.castT > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = c.eye;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, -20, 16 + Math.sin(time * 10) * 3, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  },

  husk(ctx, e, c, time) {
    const walk = e.state === 'walk' ? Math.sin(time * 9 + e.anim) * 4 : 0;
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2, -12);
    ctx.lineTo(-3 + walk, 0);
    ctx.moveTo(3, -12);
    ctx.lineTo(4 - walk, 0);
    ctx.stroke();
    ctx.fillStyle = c.shell;
    ctx.beginPath();
    ctx.moveTo(-9, -33);
    ctx.quadraticCurveTo(-14, -18, -12, -4);
    ctx.lineTo(-3, -2);
    ctx.lineTo(0, -8);
    ctx.lineTo(4, -2);
    ctx.lineTo(12, -5);
    ctx.quadraticCurveTo(14, -20, 8, -33);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2a2a';
    ctx.beginPath();
    ctx.ellipse(0, -39, 8, 8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    ctx.ellipse(-3, -39, 1.7, 2.6, -0.2, 0, TAU);
    ctx.ellipse(3, -39, 1.7, 2.6, 0.2, 0, TAU);
    ctx.fill();
    eye(ctx, 0, -38, 1, c.eye);
    // blade
    ctx.strokeStyle = 'rgba(220,210,210,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -28);
    ctx.lineTo(24, -32);
    ctx.stroke();
  },
};

export { TYPES as BUG_TYPES };
