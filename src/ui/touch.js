// Mobile touch controls, multi-touch tracking, and orientation detection.
import { TAU } from '../core/math.js';

export class TouchController {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.input = input;

    this.enabled = this.detectMobile();
    this.userMode = 'auto'; // 'auto' | 'always' | 'off'
    this.scale = 1.0;
    this.opacity = 0.65;

    // Active touch pointers: pointerId -> buttonId
    this.activePointers = new Map();

    // Defined virtual buttons
    this.buttons = [];
    this.layoutButtons(canvas.width, canvas.height);

    this.attachEvents();
  }

  detectMobile() {
    if (typeof window === 'undefined') return false;
    const ua = (window.navigator && window.navigator.userAgent) || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const hasCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const nav = window.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    const hasTouchPoints = nav && nav.maxTouchPoints > 0;
    
    // Desktop OS check: standard Windows, Mac, Linux desktop should not show on-screen buttons
    const isDesktopOS = /Windows NT|Macintosh|Linux x86_64/i.test(ua) && !/Mobile|Android/i.test(ua);
    if (isDesktopOS && !isMobileUA) {
      return false;
    }

    return isMobileUA || (hasCoarse && hasTouchPoints);
  }

  isPortrait() {
    if (typeof window === 'undefined') return false;
    // Check both orientation API and window dimensions
    if (window.screen && window.screen.orientation && window.screen.orientation.type) {
      if (window.screen.orientation.type.startsWith('portrait')) return true;
      if (window.screen.orientation.type.startsWith('landscape')) return false;
    }
    return window.innerHeight > window.innerWidth;
  }

  shouldShow() {
    if (this.userMode === 'always') return true;
    if (this.userMode === 'off') return false;
    return this.detectMobile();
  }

  attachEvents() {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', () => {
      this.layoutButtons(this.canvas.width, this.canvas.height);
    });

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse') return;
      if (!this.shouldShow()) return;
      const pt = this.getCanvasPoint(e);

      // 1. Check virtual HUD buttons first (in-game or overlays)
      const hit = this.findHit(pt.x, pt.y);
      if (hit) {
        this.activePointers.set(e.pointerId, hit.id);
        this.input.setVirtual(hit.action, true);
        e.preventDefault();
        return;
      }

      // 2. Direct Tap-To-Select on Menus (Title screen, Pause, Options, Controls, Attack Guide)
      if (window.__nym) {
        const game = window.__nym;
        if (game.handleMenuTouch && game.handleMenuTouch(pt.x, pt.y)) {
          e.preventDefault();
          return;
        }
      }
    };

    const onPointerMove = (e) => {
      if (e.pointerType === 'mouse') return;
      if (!this.shouldShow()) return;
      if (!this.activePointers.has(e.pointerId)) return;

      const pt = this.getCanvasPoint(e);
      const currentId = this.activePointers.get(e.pointerId);
      const hit = this.findHit(pt.x, pt.y);

      if (hit && hit.id !== currentId) {
        const oldBtn = this.buttons.find((b) => b.id === currentId);
        if (oldBtn) this.input.setVirtual(oldBtn.action, false);
        this.activePointers.set(e.pointerId, hit.id);
        this.input.setVirtual(hit.action, true);
      } else if (!hit) {
        const oldBtn = this.buttons.find((b) => b.id === currentId);
        if (oldBtn) this.input.setVirtual(oldBtn.action, false);
        this.activePointers.delete(e.pointerId);
      }
      e.preventDefault();
    };

    const onPointerUp = (e) => {
      if (e.pointerType === 'mouse') return;
      if (this.activePointers.has(e.pointerId)) {
        const btnId = this.activePointers.get(e.pointerId);
        const btn = this.buttons.find((b) => b.id === btnId);
        if (btn) this.input.setVirtual(btn.action, false);
        this.activePointers.delete(e.pointerId);
        e.preventDefault();
      }
    };

    this.canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: false });
    window.addEventListener('pointercancel', onPointerUp, { passive: false });
  }

  getCanvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  layoutButtons(W, H) {
    const s = this.scale;
    this.buttons = [];

    // Left cluster: D-Pad
    const dpadCenterX = 130 * s;
    const dpadCenterY = H - 130 * s;
    const btnSize = 44 * s;
    const dist = 54 * s;

    this.buttons.push(
      { id: 'pad_left', action: 'left', x: dpadCenterX - dist, y: dpadCenterY, r: btnSize, label: '◀' },
      { id: 'pad_right', action: 'right', x: dpadCenterX + dist, y: dpadCenterY, r: btnSize, label: '▶' },
      { id: 'pad_up', action: 'up', x: dpadCenterX, y: dpadCenterY - dist, r: btnSize, label: '▲' },
      { id: 'pad_down', action: 'down', x: dpadCenterX, y: dpadCenterY + dist, r: btnSize, label: '▼' },
    );

    // Right cluster: Action Buttons
    const actBaseX = W - 140 * s;
    const actBaseY = H - 120 * s;

    this.buttons.push(
      // Jump (Primary right thumb)
      { id: 'act_jump', action: 'jump', x: actBaseX + 50 * s, y: actBaseY, r: 42 * s, label: 'JUMP', accent: '#ffcf8a' },
      // Attack (Splinter slash)
      { id: 'act_attack', action: 'attack', x: actBaseX - 30 * s, y: actBaseY - 40 * s, r: 42 * s, label: 'ATK', accent: '#e8e2d4' },
      // Dodge / Dash
      { id: 'act_dash', action: 'dash', x: actBaseX - 100 * s, y: actBaseY + 15 * s, r: 36 * s, label: 'DASH', accent: '#a6d4ff' },
      // Focus Heal
      { id: 'act_focus', action: 'focus', x: actBaseX + 45 * s, y: actBaseY - 75 * s, r: 34 * s, label: 'HEAL', accent: '#bfeaff' },
      // Cast Spell
      { id: 'act_cast', action: 'cast', x: actBaseX - 35 * s, y: actBaseY - 110 * s, r: 34 * s, label: 'CAST', accent: '#e0b0ff' },
    );

    // Top menu helpers
    this.buttons.push(
      { id: 'top_map', action: 'map', x: 70 * s, y: 45 * s, r: 28 * s, label: 'MAP', accent: '#a0b8d8' },
      { id: 'top_pause', action: 'pause', x: W - 70 * s, y: 45 * s, r: 28 * s, label: 'PAUSE', accent: '#a0b8d8' },
    );
  }

  findHit(x, y) {
    for (const b of this.buttons) {
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy <= b.r * b.r * 1.3) {
        return b;
      }
    }
    return null;
  }

  draw(ctx, W, H, time) {
    if (!this.shouldShow()) return;

    ctx.save();
    for (const b of this.buttons) {
      const isPressed = Array.from(this.activePointers.values()).includes(b.id) || this.input.isDown(b.action);

      ctx.save();
      ctx.translate(b.x, b.y);

      // Button background
      ctx.globalAlpha = (isPressed ? 0.88 : this.opacity) * 0.82;
      ctx.fillStyle = isPressed ? '#1e283c' : '#0b101b';
      ctx.beginPath();
      ctx.arc(0, 0, b.r, 0, TAU);
      ctx.fill();

      // Border glow
      ctx.lineWidth = isPressed ? 2.6 : 1.5;
      ctx.strokeStyle = isPressed ? (b.accent || '#ffd998') : 'rgba(160, 195, 240, 0.35)';
      ctx.stroke();

      if (isPressed) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = b.accent || '#ffd998';
        ctx.beginPath();
        ctx.arc(0, 0, b.r * 0.9, 0, TAU);
        ctx.fill();
      }

      // Label text
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = isPressed ? 1.0 : this.opacity;
      ctx.fillStyle = isPressed ? '#ffffff' : (b.accent || '#d8e2f0');
      ctx.font = `bold ${Math.max(10, Math.floor(b.r * 0.38))}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, 0, 1);

      ctx.restore();
    }
    ctx.restore();
  }
}

// Fullscreen animated vector blocker when device is held in portrait
export function drawPortraitBlocker(ctx, W, H, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(5, 7, 14, 0.98)';
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = H / 2 - 30;

  // Floating ambient motes
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) {
    const seed = i * 47.3;
    const mx = (seed * 11) % W;
    const my = ((seed * 7 + time * 12) % H);
    ctx.globalAlpha = 0.15 + 0.12 * Math.sin(time * 1.5 + i);
    ctx.fillStyle = i % 2 === 0 ? '#ffcf8a' : '#90c8ff';
    ctx.beginPath();
    ctx.arc(mx, my, 1.4 + (i % 3), 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // Animated rotating smartphone graphic
  ctx.save();
  ctx.translate(cx, cy);

  // Phone rotation oscillates smoothly between portrait (0 rad) and landscape (PI/2 rad)
  const rotProgress = (Math.sin(time * 2.2) + 1) / 2; // 0 to 1
  const rotAngle = rotProgress * (Math.PI / 2);
  ctx.rotate(rotAngle);

  // Phone body outline
  const pw = 48;
  const ph = 88;
  ctx.fillStyle = '#0f1726';
  ctx.strokeStyle = '#ffcf8a';
  ctx.lineWidth = 2.4;
  ctx.shadowColor = 'rgba(255, 207, 138, 0.4)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 8);
  ctx.fill();
  ctx.stroke();

  // Screen inner
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#18243b';
  ctx.beginPath();
  ctx.roundRect(-pw / 2 + 4, -ph / 2 + 10, pw - 8, ph - 20, 4);
  ctx.fill();

  // Home indicator / speaker notch
  ctx.fillStyle = '#485e82';
  ctx.beginPath();
  ctx.arc(0, ph / 2 - 5, 2.5, 0, TAU);
  ctx.fill();
  ctx.fillRect(-6, -ph / 2 + 4, 12, 2);

  ctx.restore();

  // Curved rotation arrow
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(160, 210, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 72, -Math.PI * 0.4, Math.PI * 0.15);
  ctx.stroke();

  // Arrowhead
  const ax = Math.cos(Math.PI * 0.15) * 72;
  const ay = Math.sin(Math.PI * 0.15) * 72;
  ctx.fillStyle = '#a0d2ff';
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(ax - 8, ay - 10);
  ctx.lineTo(ax + 4, ay - 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Text messages with pulsing opacity
  const pulse = 0.85 + 0.15 * Math.sin(time * 3);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffcf8a';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText('PLEASE ROTATE YOUR DEVICE', cx, cy + 95);

  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#c0d0e8';
  ctx.font = '14px Georgia, serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('This game is designed to be played in landscape mode.', cx, cy + 128);

  ctx.globalAlpha = 0.55;
  ctx.font = '11px Georgia, serif';
  ctx.fillText('Rotate to landscape to continue your descent.', cx, cy + 152);

  ctx.restore();
}
