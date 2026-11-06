// Capture screenshots of several URLs through CDP. Dev-only helper.
import fs from 'node:fs';

const shots = [
  { name: 'title', url: 'http://127.0.0.1:5173/', wait: 2500 },
  { name: 'moltguard', url: 'http://127.0.0.1:5173/?room=cistern_04', wait: 2600 },
  { name: 'warden', url: 'http://127.0.0.1:5173/?room=reliquary_03', wait: 2600 },
  { name: 'choir', url: 'http://127.0.0.1:5173/?room=choir_03', wait: 3200 },
  { name: 'ember', url: 'http://127.0.0.1:5173/?room=ember_02', wait: 1800 },
  { name: 'sporefall', url: 'http://127.0.0.1:5173/?room=sporefall_02', wait: 1800 },
  { name: 'market', url: 'http://127.0.0.1:5173/?room=rootway_03', wait: 1800 },
];

const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let nextId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((resolve) => {
  const id = ++nextId; pending.set(id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });

const dir = 'C:/Users/DELL/AppData/Local/Temp/opencode';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const s of shots) {
  await send('Page.navigate', { url: s.url });
  await sleep(s.wait);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const file = `${dir}/nym-${s.name}.png`;
  fs.writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
  console.log(s.name, '->', file);
}
ws.close();
