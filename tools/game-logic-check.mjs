// End-to-end logic smoke test against the live page. Dev-only helper.
// Usage: node tools/game-logic-check.mjs
const list = await (await fetch('http://127.0.0.1:9222/json/list')).json();
const page = list.find((t) => t.type === 'page');
if (!page) throw new Error('no chrome page target');

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

let nextId = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    errors.push(d.exception?.description || d.text || 'exception');
  }
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
    errors.push(msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' '));
  }
};
const send = (method, params = {}) => new Promise((resolve) => {
  const id = ++nextId;
  pending.set(id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: 'http://127.0.0.1:5173/?play&debug=1' });
await new Promise((r) => setTimeout(r, 2500));

// clear the intro dialogue first
async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (res.result?.exceptionDetails) {
    errors.push(res.result.exceptionDetails.exception?.description || 'eval failed');
    return { __evalError: true };
  }
  return res.result?.result?.value;
}

const result = await evaluate(`(async () => {
  const g = window.__nym;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const out = {};
  g.mode = 'playing';
  g.dialogue = null;

  // ---- 1. bench saves and heals -----------------------------------------
  g.debugStart('cradle_03');
  await wait(500);
  const bench = g.props.find((p) => p.type === 'bench');
  out.benchFound = !!bench;
  g.player.hp = 2;
  g.interact(bench);
  out.benchSaved = g.saveData.bench === 'cradle_03' && g.saveData.benchSpawn === 'bench';
  out.benchHealed = g.player.hp === g.player.maxHp;

  // ---- 2. merchant purchase ---------------------------------------------
  g.debugStart('rootway_03');
  await wait(500);
  g.shards = 999;
  g.openShop();
  out.shopOpen = g.mode === 'shop' && g.shop.items.length === 5;
  const mapItem = g.shop.items.find((i) => i.id === 'map');
  g.shop.index = g.shop.items.indexOf(mapItem);
  const before = g.shards;
  g.input.pressed.add('confirm');
  await wait(120);
  out.boughtMap = !!g.flags['shop:map'] && g.flags.mapBought === true && g.shards === before - mapItem.price;

  // ---- 3. gift pickup ----------------------------------------------------
  g.debugStart('sporefall_05');
  await wait(400);
  g.player.abilities.clear();
  const dash = g.props.find((p) => p.type === 'dash');
  dash.taken = false;
  delete g.flags['taken:' + dash.id];
  g.player.x = dash.x - g.player.w / 2;
  g.player.y = dash.y - g.player.h;
  g.autoCollect();
  out.gotDash = g.player.abilities.has('dash');
  out.giftDialogue = g.mode === 'dialogue';
  g.mode = 'playing';
  g.dialogue = null;

  // ---- 4. warden: kill, flag, sealed door, transition --------------------
  g.debugStart('reliquary_03');
  await wait(2000);
  out.wardenSpawned = g.boss && g.boss.type === 'warden';
  out.wardenDoorSealedBefore = g.unlocked('flag:boss_warden') === false;
  g.boss.hurt(99999, g.boss.cx + 10, g);
  await wait(2600);
  out.wardenFlag = !!g.flags.boss_warden;
  out.wardenGone = g.boss === null;
  out.wardenDoorOpen = g.unlocked('flag:boss_warden') === true;

  const east = g.room.exits.find((e) => e.to === 'choir_01');
  g.player.x = east.px + east.pw / 2 - g.player.w / 2;
  g.player.y = east.py + east.ph - g.player.h;
  g.exitCooldown = 0;
  g.transition = null;
  g.checkExits();
  await wait(900);
  out.doorTransition = g.roomId;

  // ---- 5. choir: kill and reach the ending ------------------------------
  g.debugStart('choir_03');
  await wait(2700);
  out.choirSpawned = g.boss && g.boss.type === 'choir';
  g.boss.hurt(99999, g.boss.cx + 10, g);
  await wait(4400);
  out.endingMode = g.mode;

  // ---- 6. death returns to the last bench --------------------------------
  g.debugStart('cradle_03');
  await wait(500);
  g.interact(g.props.find((p) => p.type === 'bench'));
  g.loadRoom('rootway_01', 'start');
  await wait(700);
  g.player.hurt(99, g.player.cx + 1, g);
  out.deathMode = g.mode;
  await wait(2400);
  out.respawnRoom = g.roomId;
  out.respawnHp = g.player.hp;
  out.deaths = g.deaths;

  return out;
})()`);

console.log(JSON.stringify({ result, errors }, null, 2));
ws.close();
