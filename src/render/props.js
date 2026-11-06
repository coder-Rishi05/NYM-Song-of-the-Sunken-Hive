// Static room props and pickups, drawn in world space.
import { TAU, clamp } from '../core/math.js';
import { hexA } from '../world/room.js';

export function drawProp(ctx, prop, time) {
  if (prop.taken) return;
  const { x, y } = prop;
  const bob = Math.sin(time * 2 + x * 0.01) * 3;

  switch (prop.type) {
    case 'bench': drawBench(ctx, x, y, time); break;
    case 'vendor': drawCloaked(ctx, x, y, time, '#3b4d63', '#cfe4ff', 'vendor'); break;
    case 'npc': drawCloaked(ctx, x, y, time, '#4a3b5e', '#e2d0ff', 'npc'); break;
    case 'tablet': drawTablet(ctx, x, y, time); break;
    case 'lamp': drawLamp(ctx, x, y, time); break;
    case 'maskShard': drawMaskShard(ctx, x, y + bob, time); break;
    case 'soulVessel': drawSoulVessel(ctx, x, y + bob, time); break;
    case 'charm': drawCharm(ctx, x, y + bob, time); break;
    case 'grub': drawGrub(ctx, x, y, time); break;
    case 'dash':
    case 'cling':
    case 'wing':
    case 'spell': drawAbility(ctx, x, y, time, prop.type); break;
    default: break;
  }
}

function drawBench(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);

  // warm pool of light
  const glow = ctx.createRadialGradient(0, -24, 0, 0, -24, 92);
  glow.addColorStop(0, 'rgba(205,228,255,0.17)');
  glow.addColorStop(1, 'rgba(205,228,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-100, -120, 200, 150);

  // contact shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 1, 36, 6, 0, 0, TAU);
  ctx.fill();

  // back posts
  ctx.fillStyle = '#232d3f';
  ctx.fillRect(-29, -46, 5, 46);
  ctx.fillRect(24, -46, 5, 46);
  ctx.strokeStyle = 'rgba(190,215,255,0.3)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-28, -44);
  ctx.lineTo(-28, -2);
  ctx.moveTo(25, -44);
  ctx.lineTo(25, -2);
  ctx.stroke();

  // carved backrest with hive cells
  ctx.fillStyle = '#1a2331';
  ctx.beginPath();
  ctx.moveTo(-26, -46);
  ctx.lineTo(26, -46);
  ctx.lineTo(23, -22);
  ctx.lineTo(-23, -22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,190,230,0.22)';
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let i = -1; i <= 1; i++) {
    const cx = i * 12;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 6 + k * (Math.PI / 3);
      const px = cx + Math.cos(a) * 5.4;
      const py = -34 + Math.sin(a) * 5.4;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // seat slab
  ctx.fillStyle = '#2a374d';
  ctx.beginPath();
  ctx.moveTo(-34, -22);
  ctx.lineTo(34, -22);
  ctx.lineTo(31, -14);
  ctx.lineTo(-31, -14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(215,235,255,0.55)';
  ctx.fillRect(-33, -22, 66, 1.6);
  ctx.fillStyle = '#101620';
  ctx.fillRect(-31, -14, 62, 2.4);

  // armrests
  ctx.fillStyle = '#26324a';
  ctx.fillRect(-34, -30, 4, 10);
  ctx.fillRect(30, -30, 4, 10);
  ctx.fillStyle = 'rgba(215,235,255,0.4)';
  ctx.fillRect(-34, -30, 4, 1.4);
  ctx.fillRect(30, -30, 4, 1.4);

  // legs and feet
  ctx.fillStyle = '#1b2434';
  ctx.fillRect(-27, -14, 5, 14);
  ctx.fillRect(22, -14, 5, 14);
  ctx.fillRect(-31, -3, 12, 3);
  ctx.fillRect(19, -3, 12, 3);

  // draped cloth
  ctx.fillStyle = 'rgba(200,216,238,0.16)';
  ctx.beginPath();
  ctx.moveTo(-30, -22);
  ctx.quadraticCurveTo(-20, -12, -10, -22);
  ctx.closePath();
  ctx.fill();

  // lantern on a hooked bracket
  ctx.strokeStyle = '#5d6a82';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(32, -20);
  ctx.lineTo(32, -48);
  ctx.quadraticCurveTo(32, -52, 38, -52);
  ctx.stroke();
  const flicker = 0.72 + Math.sin(time * 9) * 0.15;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.18 * flicker;
  ctx.fillStyle = '#ffd9a0';
  ctx.beginPath();
  ctx.arc(40, -44, 30, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.75 * flicker;
  ctx.beginPath();
  ctx.moveTo(40, -49);
  ctx.lineTo(44, -44);
  ctx.lineTo(40, -39);
  ctx.lineTo(36, -44);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawCloaked(ctx, x, y, time, cloak, accent, kind) {
  ctx.save();
  ctx.translate(x, y);
  const bob = Math.sin(time * 1.6 + x) * 1;
  ctx.translate(0, bob);
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.moveTo(-13, 0);
  ctx.quadraticCurveTo(-17, -22, -8, -34);
  ctx.quadraticCurveTo(0, -40, 8, -34);
  ctx.quadraticCurveTo(17, -22, 13, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hexA(accent, 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-8, -34);
  ctx.quadraticCurveTo(-17, -22, -13, 0);
  ctx.stroke();
  ctx.fillStyle = '#0a0d13';
  ctx.beginPath();
  ctx.ellipse(0, -36, 8, 7, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(-3, -37, 1.2, 0, TAU);
  ctx.arc(3, -37, 1.2, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (kind === 'vendor') {
    ctx.fillStyle = '#2a3446';
    ctx.fillRect(-20, -12, 40, 4);
    ctx.fillStyle = '#4b5f7c';
    ctx.beginPath();
    ctx.arc(-12, -15, 2.5, 0, TAU);
    ctx.arc(0, -16, 3, 0, TAU);
    ctx.arc(12, -15, 2.5, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35 + Math.sin(time * 4) * 0.1;
    ctx.fillStyle = '#ffd9a0';
    ctx.beginPath();
    ctx.arc(-20, -26, 2.2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawTablet(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#1a202c';
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(-15, -38);
  ctx.quadraticCurveTo(0, -46, 15, -38);
  ctx.lineTo(12, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(170,200,235,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.35 + Math.sin(time * 2) * 0.1;
  ctx.strokeStyle = '#bfe0ff';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 4; i++) {
    const yy = -32 + i * 7;
    ctx.beginPath();
    ctx.moveTo(-8, yy);
    ctx.lineTo(8, yy);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

function drawLamp(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  const flick = 0.75 + Math.sin(time * 7 + x) * 0.12;
  ctx.strokeStyle = '#3f4b60';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -26);
  ctx.stroke();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.55 * flick;
  ctx.fillStyle = '#ffd69a';
  ctx.beginPath();
  ctx.arc(0, -30, 3.2, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.1 * flick;
  ctx.beginPath();
  ctx.arc(0, -30, 26, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function floatGlow(ctx, color, r, alpha = 0.3) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, hexA(color, alpha));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawMaskShard(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y - 18);
  floatGlow(ctx, '#f2ead6', 34, 0.28);
  ctx.rotate(Math.sin(time * 1.2) * 0.2);
  ctx.fillStyle = '#e8e2d2';
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(11, -6, 7, 8);
  ctx.lineTo(0, 13);
  ctx.lineTo(-7, 8);
  ctx.quadraticCurveTo(-11, -6, 0, -14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0a0c10';
  ctx.beginPath();
  ctx.ellipse(0, -1, 2.2, 3.6, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawSoulVessel(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y - 18);
  floatGlow(ctx, '#8fd8ff', 38, 0.32);
  ctx.fillStyle = '#cfeeff';
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(0, 2, 12, 15, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#bfeaff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, 2, 10, 13, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = '#e6f9ff';
  ctx.beginPath();
  ctx.arc(0, 4, 4 + Math.sin(time * 3) * 0.8, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawCharm(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y - 18);
  floatGlow(ctx, '#ffb45e', 34, 0.3);
  ctx.rotate(time * 0.8);
  ctx.fillStyle = '#e8a24a';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const r = i % 2 ? 5 : 12;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe6b8';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawGrub(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#6b7f9a';
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.ellipse(0, -10, 12, 14, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(200,225,255,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.ellipse(0, -10 + Math.sin(time * 3) * 1, 6, 8, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#1a1a20';
  ctx.beginPath();
  ctx.arc(-2, -12, 1.2, 0, TAU);
  ctx.arc(2, -12, 1.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawAbility(ctx, x, y, time, kind) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#161c28';
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-13, -22);
  ctx.lineTo(13, -22);
  ctx.lineTo(18, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(190,215,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.translate(0, -34);
  floatGlow(ctx, '#cfe6ff', 52, 0.34);
  const pulse = 0.75 + Math.sin(time * 2.4) * 0.15;
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = '#e8f4ff';
  ctx.fillStyle = '#dcecff';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  if (kind === 'dash') {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-14 + i * 3, 8 - i * 7);
      ctx.lineTo(12 + i * 2, 8 - i * 7);
      ctx.stroke();
    }
  } else if (kind === 'cling') {
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.quadraticCurveTo(-18, 0, -8, 12);
    ctx.moveTo(10, -12);
    ctx.quadraticCurveTo(18, 0, 8, 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, TAU);
    ctx.fill();
  } else if (kind === 'wing') {
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.quadraticCurveTo(-22, -4, -8, -16);
    ctx.quadraticCurveTo(-4, -4, 0, 8);
    ctx.moveTo(0, 8);
    ctx.quadraticCurveTo(22, -4, 8, -16);
    ctx.quadraticCurveTo(4, -4, 0, 8);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, TAU);
    ctx.fill();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
      ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
      ctx.stroke();
    }
  }
  ctx.restore();
}
