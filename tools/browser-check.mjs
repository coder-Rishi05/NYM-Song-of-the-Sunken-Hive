// Drives headless Chrome over CDP for a smoke test. Dev-only helper.
// Usage: node tools/browser-check.mjs [url] [outPng] [seconds] [sweep]
import fs from 'node:fs';

const url = process.argv[2] || 'http://127.0.0.1:5173/?play&debug=1';
const out = process.argv[3] || 'C:/Users/DELL/AppData/Local/Temp/opencode/nym-shot.png';
const seconds = Number(process.argv[4] || 3);
const sweep = process.argv[5] === 'sweep';

const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = list.find((t) => t.type === 'page');
if (!page) throw new Error('no chrome page target — launch chrome with --remote-debugging-port=9222');

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let nextId = 0;
const pending = new Map();
const errors = [];
const logs = [];

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    errors.push(d.exception?.description || d.text || 'exception');
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    const text = msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ');
    logs.push(`[${msg.params.type}] ${text}`);
    if (msg.params.type === 'error') errors.push(text);
  }
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    errors.push(msg.params.entry.text);
  }
};

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++nextId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
});
await send('Page.navigate', { url });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(seconds * 1000);

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.result?.exceptionDetails) {
    errors.push(res.result.exceptionDetails.exception?.description || 'eval failed');
    return null;
  }
  return res.result?.result?.value;
}

async function key(type, code, keyName, vk) {
  await send('Input.dispatchKeyEvent', {
    type, code, key: keyName, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk,
  });
}

// Advance through the intro dialogue (Enter). Dialogue accepts confirm.
for (let i = 0; i < 8; i++) {
  const mode = await evaluate('window.__nym && window.__nym.mode');
  if (mode !== 'dialogue') break;
  await key('rawKeyDown', 'Enter', 'Enter', 13);
  await key('keyUp', 'Enter', 'Enter', 13);
  await sleep(280);
}

let sweepResult = null;
if (sweep) {
  sweepResult = await evaluate(`(async () => {
    const g = window.__nym;
    const out = [];
    for (const id of g.roomIds) {
      g.debugStart(id);
      await new Promise((r) => setTimeout(r, 160));
      out.push({
        id, room: g.roomId, mode: g.mode,
        enemies: g.enemies.length,
        boss: g.boss ? g.boss.type : null,
        props: g.props.length,
        exits: g.room ? g.room.exits.length : 0,
        px: g.room ? g.room.pxW + 'x' + g.room.pxH : '',
      });
    }
    g.debugStart('cradle_01');
    await new Promise((r) => setTimeout(r, 300));
    return out;
  })()`);
}

// Move right and jump for a few seconds so physics/collision/particles run.
await key('rawKeyDown', 'KeyD', 'd', 68);
for (let i = 0; i < 4; i++) {
  await sleep(420);
  await key('rawKeyDown', 'Space', ' ', 32);
  await sleep(110);
  await key('keyUp', 'Space', ' ', 32);
}
await sleep(900);
await key('keyUp', 'KeyD', 'd', 68);
await sleep(500);

const state = await evaluate(`(() => {
  const g = window.__nym;
  if (!g) return { error: 'window.__nym missing' };
  const p = g.player;
  return {
    mode: g.mode,
    room: g.roomId,
    fps: g.fps,
    enemies: g.enemies.length,
    boss: g.boss && g.boss.type,
    shards: g.shards,
    player: p ? { x: Math.round(p.x), y: Math.round(p.y), hp: p.hp, onGround: p.onGround, abilities: [...p.abilities] } : null,
    props: g.props.length,
    exits: g.room ? g.room.exits.length : 0,
    canvas: [g.canvas.width, g.canvas.height],
  };
})()`);

const shot = await send('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));

console.log(JSON.stringify({
  state,
  sweep: sweepResult ? sweepResult.map((r) => `${r.id}:${r.enemies}e/${r.props}p/${r.exits}x${r.boss ? '/' + r.boss : ''}`) : null,
  sweepRaw: sweepResult,
  errors,
  logs: logs.slice(-20),
  screenshot: out,
}, null, 2));
ws.close();
