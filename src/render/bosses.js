// Boss rigs. Bigger, layered silhouettes with readable telegraphs and
// original, hand-built shapes: a squat guard, an upright warden, a floating choir.
import { TAU } from '../core/math.js';

const EMBER = '#ffb45e';
const EMBER_HOT = '#ff5a3c';

export function drawMoltguard(ctx, b, time) {
  const shake = b.telegraph > 0 ? Math.sin(time * 55) * 2.4 : 0;
  const moving = Math.abs(b.vx) > 20;
  const hot = b.hp < b.maxHp * 0.5;
  ctx.save();
  ctx.translate(b.x + b.w / 2 + shake, b.y + b.h);

  shadow(ctx, b.w * 0.64, 7);
  ctx.scale(b.facing, 1);

  // ---- six jointed legs ----
  ctx.lineCap = 'round';
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i++) {
      const hipX = side * (16 + i * 7);
      const hipY = -20 - i * 5;
      const swing = Math.sin(time * (moving ? 9 : 4) + i * 1.6 + (side > 0 ? 1.4 : 0)) * (moving ? 4 : 1.2);
      const kneeX = hipX + side * (16 + i * 4);
      const kneeY = -12 + i * 2;
      const footX = kneeX + side * 4 + swing;
      ctx.strokeStyle = '#171018';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, 0);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(190,150,150,0.16)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.stroke();
    }
  }

  // ---- domed carapace ----
  const g = ctx.createLinearGradient(-28, -52, 30, -6);
  g.addColorStop(0, '#453039');
  g.addColorStop(0.55, '#2a1b24');
  g.addColorStop(1, '#150e15');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -28, 37, 27, 0, 0, TAU);
  ctx.fill();

  // overlapping plates
  ctx.strokeStyle = 'rgba(235,190,170,0.2)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, -28, 31 - i * 8, -Math.PI * 0.92, Math.PI * 0.92);
    ctx.stroke();
  }
  // rim light along the shell
  ctx.strokeStyle = 'rgba(255,190,150,0.4)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, -28, 36, -Math.PI * 1.05, -Math.PI * 0.1);
  ctx.stroke();

  // glowing core seam
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.35 + Math.sin(time * 3) * 0.1;
  ctx.strokeStyle = hot ? EMBER_HOT : EMBER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-30, -34);
  ctx.lineTo(-12, -30);
  ctx.lineTo(-18, -20);
  ctx.lineTo(2, -16);
  ctx.stroke();
  ctx.restore();

  // ---- head plate ----
  ctx.fillStyle = '#160f17';
  ctx.beginPath();
  ctx.ellipse(21, -30, 15, 18, 0.15, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,150,120,0.4)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(21, -30, 15, 18, 0.15, -Math.PI * 0.9, Math.PI * 0.5);
  ctx.stroke();

  // mandibles
  ctx.strokeStyle = '#6b4a4f';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(31, -22);
  ctx.quadraticCurveTo(42, -18, 38, -8);
  ctx.moveTo(30, -26);
  ctx.quadraticCurveTo(40, -26, 44, -18);
  ctx.stroke();

  // crest horns
  ctx.fillStyle = '#5b3d44';
  ctx.beginPath();
  ctx.moveTo(6, -50);
  ctx.lineTo(26, -68);
  ctx.lineTo(20, -42);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, -52);
  ctx.lineTo(6, -72);
  ctx.lineTo(14, -48);
  ctx.closePath();
  ctx.fill();

  const eyeColor = hot ? EMBER_HOT : EMBER;
  eye(ctx, 25, -36, 2.8, eyeColor);
  eye(ctx, 17, -30, 1.9, eyeColor);
  eye(ctx, 28, -25, 1.6, eyeColor);
  eye(ctx, 19, -40, 1.5, eyeColor);

  // exposed weak seam once armor breaks
  if (hot) {
    ctx.strokeStyle = 'rgba(255,120,90,0.7)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-34, -36);
    ctx.lineTo(-20, -32);
    ctx.lineTo(-26, -22);
    ctx.lineTo(-8, -18);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawWardenMolt(ctx, b, time) {
  const shake = b.telegraph > 0 ? Math.sin(time * 50) * 3 : 0;
  const phase = b.phaseIndex;
  const hot = phase >= 2;
  ctx.save();
  ctx.translate(b.x + b.w / 2 + shake, b.y + b.h);

  shadow(ctx, b.w * 0.7, 10);
  ctx.scale(b.facing, 1);

  // ---- tattered mantle behind the body ----
  ctx.fillStyle = '#120c16';
  ctx.beginPath();
  ctx.moveTo(-20, -84);
  ctx.quadraticCurveTo(-58, -62, -52, -12);
  ctx.lineTo(-38, -20);
  ctx.lineTo(-30, -4);
  ctx.lineTo(-18, -16);
  ctx.lineTo(-6, -2);
  ctx.lineTo(4, -16);
  ctx.lineTo(18, -4);
  ctx.lineTo(26, -20);
  ctx.lineTo(44, -12);
  ctx.quadraticCurveTo(52, -62, 20, -84);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hot ? 'rgba(255,110,100,0.35)' : 'rgba(210,180,170,0.18)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // ---- legs ----
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    const swing = Math.sin(time * (Math.abs(b.vx) > 30 ? 7 : 3) + (s > 0 ? 1.6 : 0)) * (Math.abs(b.vx) > 30 ? 4 : 1.2);
    ctx.strokeStyle = '#120c14';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(s * 14, -40);
    ctx.lineTo(s * 20, -20);
    ctx.lineTo(s * (16 + swing), -1);
    ctx.stroke();
    // greave highlight
    ctx.strokeStyle = 'rgba(200,170,170,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s * 14, -40);
    ctx.lineTo(s * 20, -20);
    ctx.stroke();
    // clawed foot
    ctx.fillStyle = '#1d1320';
    ctx.beginPath();
    ctx.ellipse(s * (16 + swing), -3, 9, 4, 0, 0, TAU);
    ctx.fill();
  }

  // ---- torso ----
  const torso = ctx.createLinearGradient(-34, -80, 30, -24);
  torso.addColorStop(0, hot ? '#5a2630' : '#3b2a36');
  torso.addColorStop(0.55, '#251823');
  torso.addColorStop(1, '#120c13');
  ctx.fillStyle = torso;
  ctx.beginPath();
  ctx.moveTo(-30, -72);
  ctx.quadraticCurveTo(-40, -52, -26, -34);
  ctx.lineTo(-18, -28);
  ctx.lineTo(0, -32);
  ctx.lineTo(18, -28);
  ctx.lineTo(26, -34);
  ctx.quadraticCurveTo(40, -52, 30, -72);
  ctx.quadraticCurveTo(0, -86, -30, -72);
  ctx.closePath();
  ctx.fill();

  // chest plate ridges
  ctx.strokeStyle = hot ? 'rgba(255,120,110,0.4)' : 'rgba(220,190,180,0.22)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-20, -66);
  ctx.quadraticCurveTo(0, -58, 20, -66);
  ctx.moveTo(-16, -54);
  ctx.quadraticCurveTo(0, -48, 16, -54);
  ctx.stroke();

  // glowing ember heart
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 0.4 + Math.sin(time * (hot ? 7 : 4)) * 0.12;
  const core = ctx.createRadialGradient(0, -50, 0, 0, -50, 22);
  core.addColorStop(0, hot ? `rgba(255,90,80,${0.5 + pulse * 0.3})` : `rgba(255,180,94,${0.4 + pulse * 0.3})`);
  core.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, -50, 22, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = hot ? '#ff6a5a' : EMBER;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-7, -58);
  ctx.lineTo(-1, -52);
  ctx.lineTo(-5, -45);
  ctx.lineTo(2, -40);
  ctx.stroke();
  ctx.restore();

  // ---- shoulders ----
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#2a1b28';
    ctx.beginPath();
    ctx.ellipse(s * 32, -68, 16, 13, s * 0.3, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(230,190,180,0.22)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(s * 32, -68, 16, 13, s * 0.3, Math.PI, TAU);
    ctx.stroke();
    // spikes on pauldron
    ctx.fillStyle = '#4a343c';
    ctx.beginPath();
    ctx.moveTo(s * 36, -76);
    ctx.lineTo(s * 48, -88);
    ctx.lineTo(s * 42, -70);
    ctx.closePath();
    ctx.fill();
  }

  // ---- arms ----
  ctx.strokeStyle = '#160f19';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-30, -62);
  ctx.quadraticCurveTo(-42, -44, -38, -26);
  ctx.moveTo(30, -62);
  ctx.quadraticCurveTo(42, -46, 40, -30);
  ctx.stroke();
  // hooked claws
  ctx.strokeStyle = '#6b4a4f';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-38, -26);
  ctx.quadraticCurveTo(-46, -18, -40, -10);
  ctx.moveTo(40, -30);
  ctx.quadraticCurveTo(50, -20, 44, -10);
  ctx.stroke();

  // ---- head / helm ----
  ctx.fillStyle = '#1a1119';
  ctx.beginPath();
  ctx.ellipse(0, -84, 16, 18, 0, 0, TAU);
  ctx.fill();
  // helm rim
  ctx.strokeStyle = 'rgba(230,190,180,0.28)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, -84, 16, 18, 0, Math.PI * 0.9, Math.PI * 2.1);
  ctx.stroke();

  // crown horns
  ctx.fillStyle = '#5c4148';
  ctx.beginPath();
  ctx.moveTo(-8, -98);
  ctx.quadraticCurveTo(-34, -116, -46, -110);
  ctx.quadraticCurveTo(-26, -104, -12, -90);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, -98);
  ctx.quadraticCurveTo(34, -116, 46, -110);
  ctx.quadraticCurveTo(26, -104, 12, -90);
  ctx.closePath();
  ctx.fill();

  // mandibles
  ctx.strokeStyle = '#6b4a4f';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-8, -76);
  ctx.quadraticCurveTo(-14, -66, -8, -60);
  ctx.moveTo(8, -76);
  ctx.quadraticCurveTo(14, -66, 8, -60);
  ctx.stroke();

  const eyeColor = hot ? EMBER_HOT : EMBER;
  eye(ctx, -6, -86, 2.6, eyeColor);
  eye(ctx, 6, -86, 2.6, eyeColor);
  eye(ctx, 0, -78, 1.8, eyeColor);
  eye(ctx, -10, -79, 1.4, eyeColor);
  eye(ctx, 10, -79, 1.4, eyeColor);

  // crown sigil
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.3 + Math.sin(time * 2.4) * 0.1;
  ctx.strokeStyle = hot ? '#ff8a7a' : '#ffd0a0';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -84, 23, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -84, 27, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

export function drawChoirMother(ctx, b, time) {
  const phase = b.phaseIndex;
  const hot = phase >= 2;
  const float = Math.sin(time * 1.1) * 5;
  ctx.save();
  ctx.translate(b.x + b.w / 2, b.y + b.h + float);

  // ---- halo ----
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(0, -72, 4, 0, -72, 120);
  halo.addColorStop(0, hot ? 'rgba(255,150,200,0.2)' : 'rgba(190,160,255,0.17)');
  halo.addColorStop(1, 'rgba(190,160,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, -72, 120, 0, TAU);
  ctx.fill();
  ctx.restore();

  // ---- wings: ragged moth wings with eyespots ----
  const flap = Math.sin(time * 3.2) * 0.14;
  const wingColor = hot ? 'rgba(190,90,130,0.42)' : 'rgba(150,125,205,0.36)';
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.fillStyle = wingColor;
    ctx.beginPath();
    ctx.moveTo(8 * s, -80);
    ctx.quadraticCurveTo(70 * s, -122, 104 * s, -66);
    ctx.quadraticCurveTo(82 * s, -50, 88 * s, -8);
    ctx.quadraticCurveTo(56 * s, -32, 40 * s, -30);
    ctx.quadraticCurveTo(26 * s, -42, 8 * s, -44);
    ctx.closePath();
    ctx.fill();
    // torn notches (dark bites out of the wing)
    ctx.fillStyle = 'rgba(8,6,14,0.55)';
    ctx.beginPath();
    ctx.arc(92 * s, -22, 8, 0, TAU);
    ctx.arc(74 * s, -100, 6, 0, TAU);
    ctx.fill();
    ctx.restore();

    // veins
    ctx.save();
    ctx.strokeStyle = 'rgba(240,230,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10 * s, -78);
    ctx.quadraticCurveTo(62 * s, -104, 96 * s, -64);
    ctx.moveTo(14 * s, -66);
    ctx.quadraticCurveTo(56 * s, -74, 80 * s, -34);
    ctx.moveTo(18 * s, -56);
    ctx.quadraticCurveTo(46 * s, -52, 62 * s, -22);
    ctx.stroke();
    // eyespot
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5 + Math.sin(time * 2 + s) * 0.15;
    ctx.strokeStyle = hot ? 'rgba(255,120,170,0.7)' : 'rgba(220,190,255,0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(70 * s, -50, 7, 10, s * 0.3, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = hot ? 'rgba(255,110,150,0.35)' : 'rgba(190,150,255,0.3)';
    ctx.beginPath();
    ctx.arc(70 * s, -50, 3, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // ---- trailing gown, stretched and torn ----
  const gown = ctx.createLinearGradient(0, -50, 0, 0);
  gown.addColorStop(0, '#241733');
  gown.addColorStop(1, '#0c0812');
  ctx.fillStyle = gown;
  ctx.beginPath();
  ctx.moveTo(-20, -48);
  ctx.quadraticCurveTo(-34, -18, -28, 0);
  ctx.lineTo(-16, -8);
  ctx.lineTo(-8, 2);
  ctx.lineTo(0, -12);
  ctx.lineTo(8, 2);
  ctx.lineTo(16, -8);
  ctx.lineTo(28, 0);
  ctx.quadraticCurveTo(34, -18, 20, -48);
  ctx.closePath();
  ctx.fill();

  // hanging ribbons / tendrils that read as something wrong
  ctx.strokeStyle = hot ? 'rgba(255,120,160,0.4)' : 'rgba(180,155,220,0.35)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const sx = -20 + i * 10;
    const sway = Math.sin(time * 1.6 + i) * 4;
    ctx.moveTo(sx, -24);
    ctx.quadraticCurveTo(sx + sway, -8, sx + sway * 1.6, 12 + (i % 2) * 6);
  }
  ctx.stroke();

  // ---- torso ----
  ctx.fillStyle = '#2a1a3d';
  ctx.beginPath();
  ctx.ellipse(0, -54, 17, 21, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(220,200,255,0.2)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -54, 17, 21, 0, Math.PI * 0.9, Math.PI * 2.1);
  ctx.stroke();

  // ---- four thin arms ----
  ctx.strokeStyle = '#1a1226';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const y = -62 - i * 10;
      const sway = Math.sin(time * 2 + i * 2 + s) * 3;
      ctx.beginPath();
      ctx.moveTo(s * 12, y);
      ctx.quadraticCurveTo(s * (30 + i * 6), y + 6, s * (34 + i * 8) + sway, y + 22 + i * 6);
      ctx.stroke();
      // claw
      ctx.strokeStyle = hot ? 'rgba(255,130,170,0.6)' : 'rgba(200,180,240,0.5)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(s * (34 + i * 8) + sway, y + 22 + i * 6);
      ctx.lineTo(s * (38 + i * 8) + sway, y + 30 + i * 6);
      ctx.stroke();
      ctx.strokeStyle = '#1a1226';
      ctx.lineWidth = 3;
    }
  }

  // ---- veil behind the face ----
  ctx.fillStyle = 'rgba(18,10,28,0.9)';
  ctx.beginPath();
  ctx.moveTo(-26, -88);
  ctx.quadraticCurveTo(-40, -60, -30, -44);
  ctx.lineTo(-12, -52);
  ctx.lineTo(0, -42);
  ctx.lineTo(12, -52);
  ctx.lineTo(30, -44);
  ctx.quadraticCurveTo(40, -60, 26, -88);
  ctx.closePath();
  ctx.fill();

  // ---- elongated mask ----
  const mask = ctx.createLinearGradient(-12, -104, 10, -62);
  mask.addColorStop(0, '#efe9dd');
  mask.addColorStop(1, '#c9c1b2');
  ctx.fillStyle = mask;
  ctx.beginPath();
  ctx.ellipse(0, -84, 14, 21, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, -84, 14, 21, 0, Math.PI * 0.95, Math.PI * 1.7);
  ctx.stroke();

  // two deep eye hollows plus a row of small ones
  ctx.fillStyle = '#0e0a16';
  ctx.beginPath();
  ctx.ellipse(-5, -86, 3, 6.5, -0.14, 0, TAU);
  ctx.ellipse(5, -86, 3, 6.5, 0.14, 0, TAU);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(-6 + i * 6, -73, 1.3, 0, TAU);
    ctx.fill();
  }
  // mouth crack
  ctx.strokeStyle = 'rgba(60,40,70,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -72);
  ctx.lineTo(1.5, -66);
  ctx.lineTo(-1, -62);
  ctx.stroke();
  if (hot) {
    ctx.strokeStyle = 'rgba(255,110,150,0.75)';
    ctx.beginPath();
    ctx.moveTo(-10, -96);
    ctx.lineTo(-4, -90);
    ctx.lineTo(-8, -82);
    ctx.stroke();
  }

  // antennae crown
  ctx.strokeStyle = '#cdbfe0';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-6, -100);
  ctx.quadraticCurveTo(-22, -124, -34, -116);
  ctx.moveTo(6, -100);
  ctx.quadraticCurveTo(22, -124, 34, -116);
  ctx.moveTo(-3, -103);
  ctx.quadraticCurveTo(-10, -130, -4, -136);
  ctx.moveTo(3, -103);
  ctx.quadraticCurveTo(10, -130, 4, -136);
  ctx.stroke();
  ctx.fillStyle = '#d9ccef';
  for (const [x, y] of [[-34, -116], [34, -116], [-4, -136], [4, -136]]) {
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, TAU);
    ctx.fill();
  }

  // final phase: cracked, burning mask
  if (hot) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.3 + Math.sin(time * 6) * 0.1;
    ctx.fillStyle = '#ff5a7a';
    ctx.beginPath();
    ctx.arc(0, -84, 18, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function shadow(ctx, rx, ry) {
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#00040a';
  ctx.beginPath();
  ctx.ellipse(0, 2, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function eye(ctx, x, y, r, color) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.4, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
