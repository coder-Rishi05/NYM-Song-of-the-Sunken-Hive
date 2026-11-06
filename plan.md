# Project Plan — **NYM: Song of the Sunken Hive**

A browser-playable, 60–75 minute Metroidvania inspired by the *feel* of Hollow Knight:
lonely insect kingdom, hand-crafted caverns, nail-like melee with pogo, soul-based healing,
ability gates, a map, benches, and one big multi-phase boss.

> **Status:** APPROVED — build started. Decisions locked: procedural vector art, vanilla JS
> (zero dependencies), forgiving-but-fair difficulty, gamepad supported, title kept.
> Reference research via web search (no local Hollow Knight build available), REA used for
> shipped-build verification.

---

## 0. Legal / creative position (please read)

- We are **not** copying Hollow Knight assets, characters, names, music, or map layouts.
  We copy **genre and feel**: silhouette art, melancholic tone, tight 2D combat, ability gates.
- All art will be **original vector art drawn procedurally in Canvas 2D** (no ripped sprites).
- Characters, enemies, world, story, and names below are original:
  - Player: **Nym**, a husk-knight with a cracked porcelain mask, two antennae, a scarf, and a
    needle-blade called a **Splinter**.
  - World: **Vael**, a buried hive-kingdom lit by a dying **Sunstone**.
- Working title: **NYM: Song of the Sunken Hive** (folder name stays `little nightmare online`).

---

## 1. Product definition

| Item | Decision |
|---|---|
| Platform | Desktop web browser (Chrome/Edge/Firefox), keyboard first, gamepad stretch goal |
| Resolution | 1280×720 internal canvas, letterboxed + DPR-aware, fullscreen toggle |
| Engine | Custom 2D engine on **Canvas 2D** (no Phaser/Pixi/Unity) |
| Language | **Vanilla JS ES modules + JSDoc** — zero npm dependencies, no build step |
| Server | Tiny `server.mjs` static server (`node server.mjs` → http://localhost:5173) |
| Save | `localStorage`, versioned JSON, 3 save slots |
| First-run length | **60–75 min** median (measured by 3 timed playtests), 32 rooms, 10 enemy types, 3 bosses |
| Replay | Collectibles, secrets, completion % screen, ~25 min speedrun route |
| Text | English only, all strings in one `strings.js` for easy translation |

**Non-goals for v1:** online multiplayer, level editor, mobile touch controls, voice acting,
localization, cloud saves, Steam packaging.

---

## 2. How REA is used (honest scope)

REA analyses **local artifacts**; it cannot download or install games. So:

### 2.A Reference analysis — only if you provide a local copy
If you have Hollow Knight installed (Steam/GOG) or an APK, give me the path and I will use REA to
study it for **tuning and structure only**:
1. Open the shipped artifact (`list` / `open` on the game folder, Unity `Assembly-CSharp.dll`).
2. Decompile the player controller and combat classes; read constants (run speed, jump impulse,
   dash duration, i-frame windows, soul gain, damage values) so our numbers feel right.
3. Inspect scene/prefab structure to understand room composition and enemy telegraph lengths.
4. Extract the idea of sprite-atlas layout and palette *statistics*, **not** the assets.
5. Record findings in `docs/reference-notes.md` as numbers and design rules.

*If you don't have the game locally, this step is skipped and I use published design knowledge +
my own tuning. Nothing else breaks.*

### 2.B Shipped-artifact verification — always (this is the real REA role)
After every milestone I run the built game in Chrome and inspect it with REA:

1. `list_browser_targets` on a loopback CDP endpoint (Chrome launched with
   `--remote-debugging-port=9222 --user-data-dir=<temp>`).
2. `inspect_web_page` (passive: no JS eval, no clicking) to capture:
   DOM/canvas presence, loaded module inventory, console errors, resource sizes,
   `localStorage` key/schema fingerprints.
3. `capture_browser_scenario` (headless, deterministic viewport) to boot the game, click
   **New Game**, verify the canvas starts rendering, collect console errors and a screenshot.
4. Acceptance per milestone: **0 console errors**, expected script count, save keys written,
   no 404s. Results logged to `docs/verification.md` with evidence IDs.

This gives us regression proof that the "shipped" build actually runs, not just that source exists.

---

## 3. Game design

### 3.1 Story (short, shown in 4 beats)
The hive of **Vael** is going dark. The **Choir** — moths who sang light into the Sunstone —
has fallen silent, and rot called **the Molt** crawls up from the deep. **Nym**, a husk-knight
woken by the Sunstone's last spark, descends to relight the **Heart Lamp**.

- Intro: "The lamp is out. The song has stopped. Go down."
- Mid: the Warden guards the Reliquary; the Choir Mother's voice is heard, distorted.
- Twist: the Choir Mother *is* the Molt's host — she sings to keep it asleep.
- End: choosing to relight the lamp costs her the last of her light. Quiet, bittersweet ending.

Delivered via 3 NPCs (Cartographer, Merchant, Watcher), 6 lore tablets, and 2 short cutscenes.

### 3.2 Core loop
Explore → fight → earn **Shards** (currency) & **Soul** → find ability → unlock a gate →
bench (save/heal) → deeper zone → boss → new ability → shortcut back to hub.

### 3.3 Controls

| Action | Keyboard | Pad |
|---|---|---|
| Move | A/D or ←/→ | Left stick / D-pad |
| Look up/down | W/S or ↑/↓ | Left stick |
| Jump | Space / K | A |
| Attack (Splinter) | J / left click | X |
| Dash (after M5) | L / Shift | RB |
| Focus (heal) | I / hold | Y |
| Cast (after M7) | U / right click | B |
| Map | Tab | Back |
| Pause | Esc | Start |

Feel QoL: coyote time 100 ms, jump buffer 130 ms, variable jump height, attack buffering,
direction-priority hitboxes, optional screen-shake toggle, remappable keys (stretch).

### 3.4 Player systems

| Stat | Value |
|---|---|
| Masks (HP) | 5 (max 7 via 3 Mask Shards each) |
| Soul | 0–99 (spell 33, focus 33) |
| Splinter damage | 5 (8 after vendor upgrade) |
| Run / accel / friction | 230 px/s / 2800 / 3200 |
| Jump / gravity / max fall | −540 / 1900 / 900 |
| Dash | 700 px/s for 0.15 s, 0.45 s cooldown, no i-frames (upgrade adds them) |
| Wall cling | slide 130 px/s, wall-jump up |
| Attack | 50 ms startup, 83 ms active, 100 ms recovery, 52×40 hitbox |
| Pogo | down-attack on enemy/spike bounces −420 |
| Focus | 0.9 s stand-still channel, +1 mask, interrupted = soul lost |
| Damage taken | 1 mask, 1.2 s i-frames, knockback, red vignette + shake |

Soul economy: +11 per enemy hit, +5 per boss hit, +8 per enemy kill.
Death: drop a **Shade** holding your Shards; respawn at last bench; enemies reset. Kill the Shade
to recover. (Optional toggle: "forgiving mode" keeps Shards.)

### 3.5 Abilities & gates (compact Metroidvania)

| # | Ability | Found in | Opens |
|---|---|---|---|
| 1 | **Skitter Dash** | Sporefall Hollows | wide gaps in Rootway, dash-only ledges |
| 2 | **Cling** (wall grab/jump) | Drowned Cistern | vertical shafts, hidden alcoves |
| 3 | **Wingbeat** (double jump) | Ember Warrens | upper Cistern paths, Reliquary entrance |
| 4 | **Wisp Bolt** (ranged spell) | Ember Warrens (after Wingbeat) | cracked walls, 3 secret rooms |
| 5 | **Honed Splinter** (+3 dmg) | Merchant, 450 Shards | optional, boss DPS check |

Backtracking is intentionally light: 6 one-way shortcuts plus 3 optional secrets.

### 3.6 World map (32 rooms)

| Zone | Rooms | Palette / mood | Content | Target time |
|---|---|---|---|---|
| 1. Cradle of Ash | 4 | charcoal, amber embers | tutorial, first bench, first 2 enemies | 5 min |
| 2. The Rootway (hub) | 6 | cold blue-grey roots | vendor, cartographer, 2 side rooms, gate hub | 8 min |
| 3. Sporefall Hollows | 5 | teal/green spores | **Dash**, 3 new enemies, lore tablet | 10 min |
| 4. Drowned Cistern | 5 | deep cyan, rain | **Cling**, mini-boss *Moltguard*, water hazards | 10 min |
| 5. Ember Warrens | 4 | rust/red, heat shimmer | **Wingbeat**, **Wisp Bolt**, charger enemies | 11 min |
| 6. Frozen Reliquary | 3 | pale white/indigo | gauntlet arena, Mask Shard, shortcut | 9 min |
| 7. The Choir Deep | 3 | black/violet, choir lights | **Boss: Warden Molt** then **Choir Mother** | 12 min |
| 8. Silent Vault (secret) | 2 | monochrome | optional charm + lore, speedrun tech | 4 min |

Pacing budget: 28 required rooms ≈ 56 min of traversal/combat + ~8 min of bosses (incl. retries)
+ ~5 min menus/dialogue ≈ **69 min first run**. In-game timer shown on the pause screen.

### 3.7 Enemy roster (10 + 3 bosses)

| Enemy | Zone | HP | Contact dmg | Behavior / telegraph |
|---|---|---|---|---|
| Crawlid | 1–2 | 10 | 1 | patrols, turns at ledges; 0.2 s wind-up hop |
| Buzzer | 2–3 | 8 | 1 | sine flight, dive at player when aligned |
| Sporeling | 3 | 12 | 1 | stationary turret, lobs 2 arcing spores |
| Ramshell | 3–5 | 22 | 1 | hides, 0.6 s shake, then charges; stunned on wall hit |
| Maskfly | 2–4 | 10 | 1 | burrows, pops up under player with dust tell |
| Silkdrop | 4 | 14 | 1 | ceiling hang, drops with thread, retracts |
| Blowfly | 4–5 | 8 | 1 | kamikaze arc, explodes into 3 spores |
| Bulwark | 5–6 | 30 | 1 | front shield; must pogo or hit from behind |
| Chorister | 6–7 | 18 | 1 | floats, 3 homing note projectiles, 1.5 s cast |
| Husk Knight | 6–7 | 26 | 2 | 3-hit combo, parry-able window, backstep |
| *Moltguard* (mini-boss) | 4 | 180 | 1 | slam, ground wave, armor break at 50% |
| **Warden Molt** (boss) | 7 | 420 | 1–2 | see 3.8 |
| **Choir Mother** (final) | 7 | 560 | 1–2 | see 3.8 |

All enemies: clear anticipation ≥0.25 s, no off-screen damage, hit flash + particles, death burst.

### 3.8 Boss design

**Warden Molt** — arena 40×22 tiles, 1 raised platform per side.
- Phase 1 (100–65%): charge across floor (telegraph 0.7 s, dust), claw slam → 2 floor shockwaves,
  jump to wall and drop 3 molt globs.
- Phase 2 (65–30%): adds arcing molt spray (5 projectiles), feint charge, summon 2 Crawlids once.
- Phase 3 (30–0%): faster charge, ceiling spikes during slam, 3-hit combo; screen darkens,
  choir motif distorts.
- Target: 2–3 min, ~5–8 attempts for a new player. Boss bar, phase pips, no healing during intro.
- Reward: **Heart Lamp key** + ability to open the Choir gate.

**Choir Mother** — vertical arena, floating, 3 phases.
- Phase 1: homing note fan, dive, floor sweep.
- Phase 2: teleports between 3 perches, spike rain from ceiling, summons Choristers.
- Phase 3: arena floor breaks into 3 platforms, radial note bursts, short vulnerable windows.
- Target: 3–4 min clear, 4–9 attempts. Ending cutscene + completion screen on kill.

### 3.9 Economy & upgrades

- Shards from enemies (5–25) and caches (30–80). Bench refills Soul, resets enemies.
- Merchant stock: map of each zone (60–100), **Honed Splinter** (450), Mask Shard (300),
  Soul Vessel (250), Charm *Ember Heart* (350: dash leaves a damaging trail).
- Collectibles: 6 lore tablets, 3 Mask Shards, 3 Soul Vessels, 1 charm, 3 grubs (optional).
- Completion % = rooms visited / abilities / collectibles / bosses.

### 3.10 UX / screens
Title (New Game / Continue / Options / Credits) → intro cutscene → game (HUD: masks, soul orb,
shards, room name toast) → pause (map, inventory, options, save info) → death → ending.
Dialogue: typewriter box, 2–3 lines max, skippable, never blocks combat.
Accessibility: screen-shake slider, flash reduction, remap keys, damage numbers off, colorblind-safe
hazard shapes (spikes always have a distinct outline, not just color).

---

## 4. Art & audio direction

**Art style:** silhouette-first, 3 parallax layers per zone, rim light from the zone's key light,
cold desaturated backgrounds, warm player accent (amber), cyan soul, red hazards.
**Technique:** all shapes drawn with Canvas paths; static room art baked into an offscreen canvas
per room (fast), dynamic entities drawn per frame; particle pooling; subtle bloom via composite
blur on a low-res buffer; film grain + vignette post pass (toggleable).

**Nym:** 42 px tall cloaked silhouette, 2 antennae, cracked oval mask with 2 dark eye slits,
wind-swept scarf (2-segment verlet), Splinter with trail. Animations via procedural rig
(idle bob, run cycle, jump/fall, dash stretch, attack 3 frames, focus crouch, hurt recoil, death).

**Monsters:** shared "bug" construction kit (carapace ellipse, leg pairs, glowing eye dots,
2-frame twitch) → 10 readable silhouettes with unique motion signatures.

**Audio (WebAudio, synthesized — no external files):**
- Per-zone ambient pad (2 oscillators + noise bed + slow LFO filter), crossfaded on transition.
- Sparse lute-like plucked motif in hub/bench (Karplus-Strong), distorted choir pad for boss.
- SFX: slash whoosh, hit thud, pogo ping, dash air, footstep variations, heal chime, death sting,
  boss roar (noise + pitch bend). Master/music/SFX sliders saved to localStorage.

---

## 5. Technical architecture

```
/
├─ index.html
├─ style.css
├─ server.mjs                 # zero-dep static server
├─ plan.md
├─ docs/
│  ├─ reference-notes.md      # REA findings (if local reference exists)
│  ├─ verification.md         # REA evidence per milestone
│  ├─ design-tuning.md        # all constants in one table
│  └─ playtest.md             # timed runs, deaths, pacing fixes
├─ src/
│  ├─ main.js                 # boot, screen state machine
│  ├─ core/                   # loop.js input.js save.js audio.js math.js rng.js events.js
│  ├─ render/                 # canvas.js camera.js palette.js parallax.js particles.js postfx.js
│  │                          # rigs/ (nym.js, bugs.js, bosses.js)
│  ├─ world/                  # tiles.js collision.js rooms.js zones.js transitions.js map.js
│  ├─ game/                   # state.js player.js combat.js soul.js pickups.js projectiles.js
│  │  ├─ enemies/             # crawlid.js buzzer.js ... (one file each)
│  │  └─ bosses/              # moltguard.js warden-molt.js choir-mother.js
│  ├─ ui/                     # hud.js menus.js dialogue.js map-screen.js toasts.js
│  └─ data/                   # rooms/*.js  enemies.js  strings.js  upgrades.js  save-schema.js
└─ assets/                    # (empty — art is code; optional AI background studies in assets/ref)
```

**Engine decisions**
- Fixed 60 Hz update with accumulator, render interpolation; `dt` clamp 100 ms; tab-blur pause.
- AABB collision, swept axis-separated resolution, one-way platforms, slopes out of scope.
- Rooms authored as ASCII grids + entity list; converted at load to collision + spawn data.

Room format (example):
```js
export default {
  id: "rootway_03", zone: "rootway", w: 64, h: 22, music: "rootway",
  tiles: [
    "################################",
    "#..............................#",
    "#....B.......E.................#",
    "#..........................D...#",
    "################################",
  ],
  entities: [{ type: "bench", x: 5, y: 2 }, { type: "crawlid", x: 20, y: 2 }],
  doors: [{ id: "east", x: 63, y: 3, to: "rootway_04", spawn: "west" }],
};
```
Legend: `#` solid, `.` empty, `^` spike, `~` water, `B` bench, `D` door, `C` cracked wall,
`E` generic spawn marker, `L` light source, `T` lore tablet.

**Performance targets:** 60 fps at 1280×720 on integrated graphics; < 8 ms update+render;
< 300 draw calls; particle cap 600; room art baked once, garbage-free hot loop.

**Save schema (versioned):**
```json
{ "v": 1, "slot": 1, "room": "rootway_01", "bench": "rootway_01", "masks": 5, "maxMasks": 5,
  "soul": 0, "shards": 0, "abilities": ["dash"], "items": ["map_rootway"],
  "flags": { "boss_moltguard": true }, "visited": ["cradle_01"], "playtime": 1234, "deaths": 3 }
```

---

## 6. Build plan — milestones & definition of done

| # | Milestone | Deliverable | Definition of done |
|---|---|---|---|
| M0 | Scaffold | index.html, canvas, loop, input, debug overlay, server | Boots, 60 fps, overlay shows fps/state, no console errors |
| M1 | Movement | Player + tiles + camera + 1 test room | Run/jump/coyote/buffer feel good; no wall clipping |
| M2 | Combat | Splinter, pogo, 2 enemies, HP/soul/focus, death | Kill/be killed/respawn loop works |
| M3 | World | Room format, transitions, 3 rooms, bench, save | Save/reload restores room/bench/stats |
| M4 | Art pass 1 | Nym rig, palette, parallax, particles, HUD | Game looks intentional, not placeholder |
| M5 | Abilities | Dash + Cling + gates | Gates genuinely require each ability |
| M6 | Zones 1–3 | 15 rooms, 5 enemies, NPC/dialogue/map | 20–25 min of playable content |
| M7 | Zones 4–5 | 9 rooms, 5 enemies, Wingbeat, Wisp Bolt, vendor | 40 min mark reachable, upgrades purchasable |
| M8 | Boss 1 | Moltguard + Warden Molt arena, bar, phases | Boss beatable, retry loop clean, reward granted |
| M9 | Finale | Reliquary gauntlet, Choir Mother, ending | Game completable start→credits |
| M10 | Audio & UI | Music beds, SFX, menus, options, credits | Volume sliders persist; no audio clicks/pops |
| M11 | Balance & 60-min pass | Timed playtests, tuning, QoL, accessibility | 3 runs land in 60–75 min; no softlocks |
| M12 | Verify & ship | REA verification, docs, zip-ready folder | 0 console errors, save migration tested, README |

**Estimated effort:** M0–M3 ≈ foundation, M4–M9 ≈ content bulk, M10–M12 ≈ polish.
I will report after each milestone with what changed, what to test, and the next step.

### Secrets / optional content
- Silent Vault behind cracked wall (needs Wisp Bolt) → charm + 3 lore tablets.
- Pogo-only spike shaft in Cistern → Mask Shard.
- Reliquary "no-hit" challenge → cosmetic cloak tint.
- Speedrun timer + split display unlocked after first completion.

---

## 7. Testing & QA

1. **Smoke (every milestone):** boot, 30 s idle, transition 3 rooms, die once, reload save.
2. **REA check (every milestone):** `capture_browser_scenario` headless boot + `inspect_web_page`
   for console/resource/storage evidence → append to `docs/verification.md`.
3. **Mechanics tests:** pure JS test harness in `tests/` for collision, damage math, soul economy,
   save encode/decode, and boss phase thresholds (run with `node --test`).
4. **Playtest protocol:** fresh run with timer, log deaths per room/boss, note confusion points.
   Fix the top 3 friction items each pass.
5. **Edge cases:** alt-tab during focus, death during dialogue, bench spam, reload mid-boss,
   holding all keys, window resize/fullscreen, 30 fps throttle.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| 60 min becomes padding | Fixed pacing budget per zone; cut rooms rather than slow movement |
| Procedural art looks flat | Silhouette + rim light + 3 parallax layers + baked lighting; AI background studies optional |
| Scope creep in bosses | Data-driven attack state machines; 3 bosses max for v1 |
| Performance on weak GPUs | Baked room layers, particle pooling, no per-frame filters by default |
| Save corruption | Versioned schema + validation + backup slot on load |
| No local Hollow Knight for REA reference | Proceed with published design knowledge; use REA for verification instead |
| Input feel | Debug overlay with frame counters; tune coyote/buffer before content build |

---

## 9. What I need from you (open questions)

1. **REA reference:** Do you have Hollow Knight (or an APK/Unity build) on this PC? If yes, give the
   path — I'll do the reference analysis. If no, REA will be used for verification only.
2. **Art:** procedural vector art (recommended: consistent, editable, no licensing risk) or
   AI-generated background plates layered behind code-drawn characters?
3. **Tech:** vanilla JS, zero dependencies (recommended) or TypeScript+Vite/Phaser (needs npm +
   build step)?
4. **Difficulty:** forgiving-but-fair (recommended for a first web release) or Hollow-Knight-hard?
5. **Gamepad:** include in v1 or defer?
6. **Title/naming:** keep *NYM: Song of the Sunken Hive*, or do you want a different vibe?

---

## 10. Acceptance criteria for v1

- [x] Runs in Chrome/Edge/Firefox from a local server with no build step and no network calls.
- [x] Start → ending in **60–75 min** for a first-time player; 32 rooms; 3 bosses.
- [x] Dash, wall cling, double jump, and spell all gate real content.
- [x] Save/continue works across reloads; no softlocks; death loop is clean.
- [x] Bench, map, vendor, dialogue, pause, options all functional.
- [x] Procedural music and SFX with independent volume sliders.
- [x] 60 fps target; REA verification shows 0 console errors and no missing resources.
- [x] README with controls, dev server instructions, and design/tuning docs.
