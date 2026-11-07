# Project Plan — **NYM: Song of the Sunken Hive**

A browser-playable, 60–75 minute Metroidvania inspired by the *feel* of Hollow Knight:
lonely insect kingdom, hand-crafted caverns, nail-like melee with pogo, soul-based healing,
ability gates, a map, benches, and multi-phase bosses.

> **Status:** COMPLETED & REFINED. Core combat mechanics have been enhanced with instant forward dashing, innate ranged spectral attacks, revamped cinematic slash & arm animations, a minimalist combat guide overlay, and dynamic floating damage indicators.

---

## 1. Product Definition & Platform Support

| Item | Decision & Status |
|---|---|
| Platform | Cross-platform web: Desktop & Mobile (Chrome/Edge/Firefox/Safari/Android/iOS) |
| Laptop / Desktop Controls | Simplified keymap (`A` attack, `D` dash, `H` heal, `C` ranged cast, `Arrows` move, `Space` jump, `Q` moves guide, `T` speedrun timer, `Tab/M` map, `Esc` pause) + Mouse Left/Right Click |
| Mobile Controls | Auto-detected touch controls, virtual D-pad + action buttons strictly on mobile screens, hidden on laptop/desktop viewports |
| Resolution | 1280×720 internal canvas, letterboxed + DPR-aware, fullscreen toggle |
| Engine | Custom 2D engine on **Canvas 2D** (vanilla JS, zero dependencies, no build step) |
| Server | `server.mjs` static server (`node server.mjs` → `http://127.0.0.1:5173/`) |
| Save | `localStorage`, versioned JSON (`nym.controls.v2`), 3 save slots |
| World Content | 32 interconnected rooms, 10 enemy types, 3 bosses (Moltguard, Warden Molt, Choir Mother) |

---

## 2. Combat & Animation Improvements

### A. Core Action Updates
- **Forward Dash Available from Start:** Players can now execute Skitter Dash (`[D]` / Right Click) immediately to evade threats and weave through combat.
- **Innate Ranged Attack:** Pressing `[C]` fires a spectral projectile dart from the start of the adventure, scaling up into high-damage Wisp Bolts when the ancient spell gift is unlocked.
- **Cinematic Attack Rig & Slash Animation:**
  - Dynamic body lunging and torso recoil during strikes.
  - Articulated character arm swinging the gleaming Splinter blade along the attack angle.
  - Multi-layered crescent slash featuring radial core glow, leading edge highlight, and trailing energy streaks.
- **Minimalist Combat Guide Overlay (`[Q]`):**
  - Redesigned with a clean, low-clutter Gothic modern aesthetic.
  - Concise cards displaying move keys, descriptions, and pogo bounce tips.
- **Floating Combat Damage Numbers:** Striking enemies pops floating, fading damage numerals for clear hit feedback.

---

## 3. World & Progression Architecture

- **Zones (8 zones, 32 rooms):**
  1. *Cradle of Ash* (4 rooms) — Tutorial, intro tablet, kindling rest bench.
  2. *The Rootway* (6 rooms) — Hub, Hollowmarket merchant, Watcher NPC, one-way shortcuts.
  3. *Sporefall Hollows* (5 rooms) — Enhanced Skitter Dash shrine, Mask Shard 1.
  4. *Drowned Cistern* (5 rooms) — Cling wall-grab ability, water hazards, Moltguard mini-boss, Mask Shard 2.
  5. *Ember Warrens* (4 rooms) — Wingbeat double-jump, Wisp Bolt ranged upgrade, spike pits.
  6. *Frozen Reliquary* (3 rooms) — Mask Shard 3, Warden's Court.
  7. *The Choir Deep* (3 rooms) — Warden Molt boss, Choir Mother final boss, Heart Lamp relighting.
  8. *Silent Vault* (2 rooms) — Secret chamber with Ember Heart charm.
- **Upgrades & Collectibles:**
  - 3 Mask Shards distributed across world rooms (Sporefall, Cistern, Reliquary) giving +1 max mask expansion when collected.
  - Shop items: Honed Splinter (+3 damage), Soul Vessel (+20 soul), Warden's Map.

---

## 4. Test & Verification Suites

1. `tools/validate.mjs` — Verifies all 32 rooms and 64 room exits.
2. `tools/test-controls-rooms.mjs` — Verifies key bindings, room transition spawn positions, camera bias, and mobile UI heuristics.
3. `tools/test-comprehensive.mjs` — Validates the full suite: Spike pogo, mouse combat, water drag, 3 mask shards, speedrun timer, attack list toggle, and touch detection.
