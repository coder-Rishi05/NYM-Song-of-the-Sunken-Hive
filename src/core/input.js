// Keyboard + gamepad input with per-tick edge detection.
const KEYMAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  Space: 'jump',
  KeyK: 'jump',
  KeyJ: 'attack',
  ShiftLeft: 'dash',
  ShiftRight: 'dash',
  KeyL: 'dash',
  KeyI: 'focus',
  KeyU: 'cast',
  KeyE: 'interact',
  Tab: 'map',
  Escape: 'pause',
  KeyP: 'pause',
  Enter: 'confirm',
  Backspace: 'cancel',
  NumpadEnter: 'confirm',
};

const PADMAP = {
  0: 'jump',
  1: 'cast',
  2: 'attack',
  3: 'focus',
  4: 'interact',
  5: 'dash',
  6: 'dash',
  8: 'map',
  9: 'pause',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
};

const PREVENT = new Set([
  'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab',
]);

export class Input {
  constructor(target = window) {
    this.keys = new Set();
    this.pressed = new Set();
    this.downCodes = new Set();
    this.padKeys = new Set();
    this.padPressed = new Set();
    this.padPrev = [];
    this.gestureHandlers = [];

    target.addEventListener('keydown', (e) => {
      if (PREVENT.has(e.code)) e.preventDefault();
      this.gestureHandlers.forEach((fn) => fn());
      const action = KEYMAP[e.code];
      if (!action) return;
      if (e.repeat) return;
      this.downCodes.add(e.code);
      this.keys.add(action);
      this.pressed.add(action);
    });

    target.addEventListener('keyup', (e) => {
      const action = KEYMAP[e.code];
      this.downCodes.delete(e.code);
      if (!action) return;
      let stillHeld = false;
      for (const code of this.downCodes) {
        if (KEYMAP[code] === action) stillHeld = true;
      }
      if (!stillHeld) this.keys.delete(action);
    });

    target.addEventListener('blur', () => {
      this.downCodes.clear();
      this.keys.clear();
      this.pressed.clear();
    });
  }

  onGesture(fn) {
    this.gestureHandlers.push(fn);
  }

  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = pads && pads[0];
    this.padKeys.clear();
    if (!pad) {
      this.padPressed.clear();
      this.padPrev = [];
      return;
    }

    const axis = pad.axes[0] || 0;
    const axisY = pad.axes[1] || 0;
    const dead = 0.35;
    if (axis < -dead) this.padKeys.add('left');
    if (axis > dead) this.padKeys.add('right');
    if (axisY < -dead) this.padKeys.add('up');
    if (axisY > dead) this.padKeys.add('down');

    for (let i = 0; i < pad.buttons.length; i++) {
      const btn = pad.buttons[i];
      const down = btn && btn.pressed;
      const action = PADMAP[i];
      if (!action) continue;
      if (down) {
        this.padKeys.add(action);
        if (!this.padPrev[i]) this.padPressed.add(action);
      }
      this.padPrev[i] = !!down;
    }
  }

  isDown(action) {
    return this.keys.has(action) || this.padKeys.has(action);
  }

  wasPressed(action) {
    return this.pressed.has(action) || this.padPressed.has(action);
  }

  axisX() {
    let x = 0;
    if (this.isDown('left')) x -= 1;
    if (this.isDown('right')) x += 1;
    return x;
  }

  axisY() {
    let y = 0;
    if (this.isDown('up')) y -= 1;
    if (this.isDown('down')) y += 1;
    return y;
  }

  anyPressed() {
    return this.pressed.size > 0 || this.padPressed.size > 0;
  }

  endStep() {
    this.pressed.clear();
    this.padPressed.clear();
  }
}
