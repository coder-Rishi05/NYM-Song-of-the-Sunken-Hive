// The player character rig: a small cloaked husk with a cracked porcelain mask.
import { TAU, clamp } from '../core/math.js';

const CLOAK = '#161d2b';
const CLOAK_DARK = '#0c1018';
const CLOAK_LIGHT = '#232f45';
const RIM = 'rgba(200,222,255,0.55)';
const RIM_SOFT = 'rgba(150,180,220,0.28)';
const MASK = '#e9e4d7';
const MASK_SHADE = '#c3bdad';
const EYE = '#05070b';
const SCARF = '#dbe2ee';

export function drawNym(ctx, p, time) {
  const baseX = p.x + p.w / 2;
  const baseY = p.y + p.h;
  const grounded = p.onGround;
  const speed = Math.abs(p.vx);
  const run = grounded && speed > 18 && !p.dashing;
  const bob = run ? Math.sin(p.runPhase * 2) * 1.6 : Math.sin(time * 2.4) * 0.9;
  const lean = clamp(p.vx * 0.0012, -0.14, 0.14);
  const crouch = p.focusing ? 4 : 0;
  const dashStretch = p.dashing ? 1.16 : 1;

  // soft contact shadow
  ctx.save();
  ctx.globalAlpha = grounded ? 0.45 : 0.18;
  ctx.fillStyle = '#00040a';
  ctx.beginPath();
  ctx.ellipse(baseX, baseY + 2, 17, 5, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(baseX, baseY + bob + crouch);
  if (p.dead) {
    ctx.rotate(0.85);
    ctx.globalAlpha = 0.7;
  }
  ctx.scale(p.facing * dashStretch, 1 / dashStretch);
  ctx.scale(1.08, 1.08);
  ctx.rotate(lean);

  drawScarfBack(ctx, p, time);
  drawLegs(ctx, p, run, time);
  drawCloak(ctx, p, time);
  drawHead(ctx, p, time);
  drawArm(ctx, p, time);
  if (p.attackT > 0) drawAttack(ctx, p);
  if (p.focusing) drawFocusAura(ctx, p, time);
  if (p.dashing) drawDashStreak(ctx, p);
  ctx.restore();

  if (p.iFrames > 0 && p.state === 'hurt') {
    ctx.save();
    ctx.globalAlpha = 0.28 * Math.min(1, p.iFrames * 2.2);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#ff5a5a';
    ctx.beginPath();
    ctx.ellipse(baseX, baseY - 28, 22, 28, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  if (p.soulGlow > 0.01) {
    ctx.save();
    ctx.globalAlpha = p.soulGlow * 0.25;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#bfe6ff';
    ctx.beginPath();
    ctx.arc(baseX, baseY - 34, 20, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

function drawLegs(ctx, p, run, time) {
  const t = p.runPhase;
  const stride = run ? Math.sin(t) * 6 : 0;
  ctx.strokeStyle = CLOAK_DARK;
  ctx.lineWidth = 4.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (p.onGround) {
    ctx.moveTo(-3, -13);
    ctx.lineTo(-4 + stride, -1);
    ctx.moveTo(3, -13);
    ctx.lineTo(4 - stride, -1);
  } else {
    ctx.moveTo(-3, -13);
    ctx.lineTo(-7, -5 + Math.sin(time * 6) * 1.5);
    ctx.moveTo(3, -13);
    ctx.lineTo(6, -6);
  }
  ctx.stroke();
}

function drawCloak(ctx, p, time) {
  const flow = clamp(-p.vx * 0.007, -0.5, 0.5);
  const air = p.onGround ? 0 : clamp(p.vy * 0.0012, -0.3, 0.4);
  const sway = Math.sin(time * 1.6) * 1.2 + flow * 10;
  ctx.beginPath();
  ctx.moveTo(-8, -33);
  ctx.quadraticCurveTo(-15 - flow * 4, -22, -17 + sway - air * 6, -6 + air * 4);
  ctx.quadraticCurveTo(-13, -1, -7, -2.5);
  ctx.quadraticCurveTo(-2, -7, 3, -3);
  ctx.quadraticCurveTo(9, -1.5, 14 + sway * 0.5, -5 + air * 2);
  ctx.quadraticCurveTo(15, -22, 8, -33);
  ctx.quadraticCurveTo(0, -37, -8, -33);
  ctx.closePath();
  ctx.fillStyle = CLOAK;
  ctx.fill();

  // rim light along the leading edge and back, so the cloak reads in the dark
  ctx.strokeStyle = RIM_SOFT;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(8, -33);
  ctx.quadraticCurveTo(15, -22, 14 + sway * 0.5, -5 + air * 2);
  ctx.stroke();

  ctx.strokeStyle = RIM;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-8, -33);
  ctx.quadraticCurveTo(-15 - flow * 4, -22, -17 + sway - air * 6, -6 + air * 4);
  ctx.stroke();

  // inner folds
  ctx.strokeStyle = CLOAK_LIGHT;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(-4, -30);
  ctx.quadraticCurveTo(-7, -20, -9 + sway * 0.4, -8);
  ctx.moveTo(3, -29);
  ctx.quadraticCurveTo(5, -20, 7 + sway * 0.3, -9);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // tattered hem
  ctx.strokeStyle = CLOAK_DARK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-16, -8);
  ctx.lineTo(-12, -10);
  ctx.moveTo(-8, -4);
  ctx.lineTo(-5, -8);
  ctx.moveTo(6, -6);
  ctx.lineTo(10, -9);
  ctx.stroke();

  // collar
  ctx.fillStyle = '#20283a';
  ctx.beginPath();
  ctx.moveTo(-8, -33);
  ctx.quadraticCurveTo(0, -28, 8, -33);
  ctx.quadraticCurveTo(0, -30, -8, -33);
  ctx.fill();
}

function drawScarfBack(ctx, p, time) {
  const trail = clamp(Math.abs(p.vx) * 0.025, 0, 10);
  const flutter = Math.sin(time * 5 + p.runPhase) * 5;
  ctx.fillStyle = SCARF;
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.moveTo(2, -36);
  ctx.quadraticCurveTo(-10 - trail, -38 + flutter, -24 - trail * 1.6, -30 + flutter * 1.5);
  ctx.quadraticCurveTo(-13 - trail, -30, 1, -32);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.quadraticCurveTo(-14 - trail, -30 + flutter, -29 - trail * 1.8, -20 + flutter);
  ctx.quadraticCurveTo(-14, -24, -1, -30);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawHead(ctx, p, time) {
  ctx.save();
  const tilt = clamp(p.vx * 0.0016, -0.12, 0.12) + (p.onGround ? Math.sin(time * 2.4) * 0.02 : 0.06);
  ctx.translate(0, -46);
  ctx.rotate(tilt);

  // antennae
  ctx.strokeStyle = '#b9b4a6';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  const sway = Math.sin(time * 1.7) * 1.6;
  ctx.beginPath();
  ctx.moveTo(-4, -6);
  ctx.quadraticCurveTo(-10 + sway, -16, -14 + sway, -24);
  ctx.moveTo(4, -6);
  ctx.quadraticCurveTo(9 + sway, -18, 12 + sway, -25);
  ctx.stroke();
  ctx.fillStyle = MASK;
  ctx.beginPath();
  ctx.arc(-14 + sway, -24, 1.5, 0, TAU);
  ctx.arc(12 + sway, -25, 1.5, 0, TAU);
  ctx.fill();

  // mask
  const g = ctx.createLinearGradient(-10, -12, 8, 12);
  g.addColorStop(0, MASK);
  g.addColorStop(1, MASK_SHADE);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11.2, 12.2, 0, 0, TAU);
  ctx.fill();

  // bright rim along the top-left of the mask
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11.2, 12.2, 0, Math.PI * 0.95, Math.PI * 1.75);
  ctx.stroke();

  // rim shadow
  ctx.strokeStyle = 'rgba(90,100,120,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11.2, 12.2, 0, 0.15, Math.PI - 0.15);
  ctx.stroke();

  // eye hollows
  ctx.fillStyle = EYE;
  ctx.beginPath();
  ctx.ellipse(-4.5, 0.5, 2.8, 4.5, -0.25, 0, TAU);
  ctx.ellipse(4.5, 0.5, 2.8, 4.5, 0.25, 0, TAU);
  ctx.fill();

  // crack
  ctx.strokeStyle = 'rgba(70,78,92,0.75)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(1.5, -11);
  ctx.lineTo(0.4, -7);
  ctx.lineTo(3.2, -4.2);
  ctx.lineTo(2.1, -0.5);
  ctx.stroke();

  // tiny hairline cracks
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(-7.5, -5);
  ctx.lineTo(-5.5, -2.6);
  ctx.moveTo(6.8, -7);
  ctx.lineTo(8.2, -4);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawArm(ctx, p, time) {
  ctx.strokeStyle = '#0e131d';
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(5, -30);
  ctx.lineTo(9, -21);
  ctx.stroke();

  // idle nail rests low
  if (p.attackT <= 0) {
    ctx.strokeStyle = 'rgba(232,242,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -20);
    ctx.lineTo(21, -11);
    ctx.stroke();
  }
}

function drawAttack(ctx, p) {
  const total = p.attackMax || 0.28;
  const t = 1 - p.attackT / total;
  const active = p.attackT < total * 0.78 && p.attackT > total * 0.3;
  const alpha = active ? 1 : 0.35 * (1 - Math.abs(t - 0.5) * 2);
  let ang = 0;
  if (p.attackDir === 'up') ang = -Math.PI / 2;
  else if (p.attackDir === 'down') ang = Math.PI / 2;

  ctx.save();
  ctx.translate(4, -26);
  ctx.rotate(ang);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.55 * alpha;

  // crescent slash
  const swing = -0.35 + t * 0.7;
  ctx.rotate(swing);
  ctx.beginPath();
  ctx.arc(0, 0, 46, -0.92, 0.92);
  ctx.arc(0, 0, 29, 0.92, -0.92, true);
  ctx.closePath();
  const g = ctx.createRadialGradient(0, 0, 26, 0, 0, 48);
  g.addColorStop(0, 'rgba(190,220,255,0)');
  g.addColorStop(0.6, 'rgba(210,235,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0.05)');
  ctx.fillStyle = g;
  ctx.fill();

  // leading edge
  ctx.globalAlpha = 0.9 * alpha;
  ctx.strokeStyle = '#eaf4ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 44, -0.85, 0.85);
  ctx.stroke();

  // blade
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#dde7f7';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.lineTo(43, 0);
  ctx.stroke();
  ctx.restore();
}

function drawFocusAura(ctx, p, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 0.6 + Math.sin(time * 9) * 0.2;
  ctx.globalAlpha = 0.25 * pulse;
  ctx.strokeStyle = '#bfeaff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, -30, 24 + Math.sin(time * 6) * 2, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(0, -30, 14, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawDashStreak(ctx, p) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#cfe6ff';
  for (let i = 1; i <= 3; i++) {
    ctx.globalAlpha = 0.14 / i;
    ctx.beginPath();
    ctx.ellipse(-16 * i, -26, 10, 18, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
