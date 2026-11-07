// Keyboard, Mouse, Touch, and Gamepad input with customizable bindings and edge detection.
const STORAGE_KEY = 'nym.controls.v2';

export const DEFAULT_KEYMAP = {
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'KeyK'],
  attack: ['KeyA', 'KeyJ'],
  dash: ['KeyD', 'ShiftLeft', 'ShiftRight', 'KeyL'],
  focus: ['KeyH', 'KeyF'],
  cast: ['KeyC', 'KeyU'],
  attackList: ['KeyQ'],
  interact: ['KeyE'],
  map: ['Tab', 'KeyM'],
  pause: ['Escape', 'KeyP'],
  timer: ['KeyT'],
  confirm: ['Enter', 'NumpadEnter', 'Space'],
  cancel: ['Backspace', 'Escape'],
};

export const ACTION_LABELS = {
  left: 'Move Left',
  right: 'Move Right',
  up: 'Look Up / Aim',
  down: 'Look Down / Aim',
  jump: 'Jump [Space]',
  attack: 'Melee Attack [A]',
  dash: 'Skitter Dash [D]',
  focus: 'Focus Heal [H]',
  cast: 'Cast Wisp Bolt [C]',
  attackList: 'Attack List [Q]',
  interact: 'Interact / Rest [E]',
  map: 'View Hive Map [M / Tab]',
  pause: 'Pause / Options [Esc]',
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

const PREVENT_KEYS = new Set([
  'Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab',
]);

export class Input {
  constructor(target = window) {
    this.target = target;
    this.keys = new Set();
    this.pressed = new Set();
    this.downCodes = new Set();

    this.mouseKeys = new Set();
    this.mousePressed = new Set();

    this.touchKeys = new Set();
    this.touchPressed = new Set();

    this.padKeys = new Set();
    this.padPressed = new Set();
    this.padPrev = [];

    this.gestureHandlers = [];
    this.rebindingAction = null;
    this.rebindCallback = null;

    this.loadBindings();
    this.attachEvents(target);
  }

  loadBindings() {
    this.bindings = {};
    for (const [action, keys] of Object.entries(DEFAULT_KEYMAP)) {
      this.bindings[action] = [...keys];
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('nym.controls.v1');
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          for (const [action, keys] of Object.entries(saved)) {
            if (Array.isArray(keys) && keys.length) {
              this.bindings[action] = keys;
            }
          }
        }
      } catch {
        /* use defaults */
      }
    }
    this.buildLookup();
  }

  saveBindings() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bindings));
      } catch {
        /* ignore */
      }
    }
  }

  buildLookup() {
    this.codeToAction = new Map();
    for (const [action, keys] of Object.entries(this.bindings)) {
      for (const code of keys) {
        if (!this.codeToAction.has(code)) {
          this.codeToAction.set(code, []);
        }
        this.codeToAction.get(code).push(action);
      }
    }
  }

  resetBindings() {
    for (const [action, keys] of Object.entries(DEFAULT_KEYMAP)) {
      this.bindings[action] = [...keys];
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.buildLookup();
  }

  rebind(action, newCode) {
    if (!this.bindings[action]) return;
    // Remove code from any other non-movement action to prevent conflicts
    for (const act of Object.keys(this.bindings)) {
      this.bindings[act] = this.bindings[act].filter((c) => c !== newCode);
    }
    this.bindings[action] = [newCode];
    this.saveBindings();
    this.buildLookup();
  }

  getBindingLabel(action) {
    const keys = this.bindings[action];
    if (!keys || !keys.length) return 'None';
    return keys
      .map((k) => k.replace(/^Key/, '').replace(/^Arrow/, ''))
      .join(' / ');
  }

  startRebind(action, onDone) {
    this.rebindingAction = action;
    this.rebindCallback = onDone;
  }

  cancelRebind() {
    this.rebindingAction = null;
    this.rebindCallback = null;
  }

  attachEvents(target) {
    target.addEventListener('keydown', (e) => {
      this.notifyGesture();
      if (this.rebindingAction) {
        if (e.code !== 'Escape') {
          this.rebind(this.rebindingAction, e.code);
        }
        const cb = this.rebindCallback;
        this.rebindingAction = null;
        this.rebindCallback = null;
        e.preventDefault();
        if (cb) cb();
        return;
      }

      if (PREVENT_KEYS.has(e.code)) e.preventDefault();
      if (e.repeat) return;

      const actions = this.codeToAction.get(e.code);
      if (!actions) return;

      this.downCodes.add(e.code);
      for (const act of actions) {
        this.keys.add(act);
        this.pressed.add(act);
      }
    });

    target.addEventListener('keyup', (e) => {
      this.downCodes.delete(e.code);
      const actions = this.codeToAction.get(e.code);
      if (!actions) return;

      for (const act of actions) {
        // Only release action if no other key mapped to this action is still down
        let stillDown = false;
        const mappedKeys = this.bindings[act] || [];
        for (const k of mappedKeys) {
          if (this.downCodes.has(k)) {
            stillDown = true;
            break;
          }
        }
        if (!stillDown) {
          this.keys.delete(act);
        }
      }
    });

    // Mouse button integration (Left Click = Attack, Right Click = Dash/Cast)
    target.addEventListener('pointerdown', (e) => {
      this.notifyGesture();
      if (e.pointerType === 'mouse') {
        if (window.__nym && window.__nym.isMenuMode && window.__nym.isMenuMode()) {
          return;
        }
        if (e.button === 0) {
          // Left click: attack
          this.mouseKeys.add('attack');
          this.mousePressed.add('attack');
        } else if (e.button === 2) {
          // Right click: dodge/dash (or cast if Shift held)
          const act = e.shiftKey ? 'cast' : 'dash';
          this.mouseKeys.add(act);
          this.mousePressed.add(act);
        }
      }
    });

    target.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse') {
        if (e.button === 0) {
          this.mouseKeys.delete('attack');
        } else if (e.button === 2) {
          this.mouseKeys.delete('dash');
          this.mouseKeys.delete('cast');
        }
      }
    });

    target.addEventListener('contextmenu', (e) => {
      // Prevent browser context menu on right click so combat remains smooth
      e.preventDefault();
    });

    target.addEventListener('blur', () => {
      this.downCodes.clear();
      this.keys.clear();
      this.pressed.clear();
      this.mouseKeys.clear();
      this.mousePressed.clear();
      this.touchKeys.clear();
      this.touchPressed.clear();
    });
  }

  onGesture(fn) {
    this.gestureHandlers.push(fn);
  }

  notifyGesture() {
    for (const fn of this.gestureHandlers) fn();
  }

  // Virtual touch controls interface
  setVirtual(action, isDown) {
    if (isDown) {
      if (!this.touchKeys.has(action)) {
        this.touchPressed.add(action);
      }
      this.touchKeys.add(action);
    } else {
      this.touchKeys.delete(action);
    }
  }

  pollPad() {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
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
    return (
      this.keys.has(action) ||
      this.mouseKeys.has(action) ||
      this.touchKeys.has(action) ||
      this.padKeys.has(action)
    );
  }

  wasPressed(action) {
    return (
      this.pressed.has(action) ||
      this.mousePressed.has(action) ||
      this.touchPressed.has(action) ||
      this.padPressed.has(action)
    );
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
    return (
      this.pressed.size > 0 ||
      this.mousePressed.size > 0 ||
      this.touchPressed.size > 0 ||
      this.padPressed.size > 0
    );
  }

  endStep() {
    this.pressed.clear();
    this.mousePressed.clear();
    this.touchPressed.clear();
    this.padPressed.clear();
  }
}
