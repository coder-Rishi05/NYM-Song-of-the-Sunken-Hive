# NYM: Song of the Sunken Hive

A browser-playable 2D Metroidvania inspired by the somber tone, tight combat, and expansive atmosphere of Hollow Knight. Descend as **Nym**, a small husk-knight with a cracked porcelain mask, into the buried kingdom of **Vael** to relight the dying Sunstone.

- **Zero dependencies**: Pure vanilla JavaScript ES modules and standard HTML5 Canvas 2D. No build step, no npm, no bundlers.
- **Procedural Vector Art**: 100% code-driven graphics rendered dynamically on canvas (no ripped sprites or external image files).
- **Synthesized Web Audio**: All ambient pads, melody motifs, boss themes, and sound effects are generated in real-time via the Web Audio API.
- **Deep Metroidvania Exploration**: 32 handcrafted rooms across 8 unique zones, 10 enemy types, 3 multi-phase bosses, 4 ability gates, shops, benches, and secrets.

---

## Quick Start (Play on Localhost)

The game is hosted on a lightweight, zero-dependency static server included in the repository.

1. **Start the local server**:
   ```bash
   node server.mjs
   ```
2. **Open in your browser**:
   **[http://localhost:5173/](http://localhost:5173/)** (or [http://127.0.0.1:5173/](http://127.0.0.1:5173/))

### URL Debug & Testing Flags
- `http://localhost:5173/?play` — Boot straight into gameplay, bypassing the title screen.
- `http://localhost:5173/?play&debug=1` — Enable debug HUD (displays FPS, player position, room ID, entity count, and hitbox bounds).
- `http://localhost:5173/?play&room=reliquary_03` — Warp directly to any room ID (e.g. `reliquary_03` for Warden Molt, `choir_02` for Choir Mother).

---

## Controls

The game supports standard keyboard, mouse, USB/Bluetooth gamepads, and **mobile touchscreen devices**. Custom keybindings can be configured in the in-game **Controls** menu.

| Action | Keyboard | Mouse | Mobile Touch | Gamepad | Description |
|---|---|---|---|---|---|
| **Move** | `←` / `→` (Arrow Keys) | — | D-Pad `◀` / `▶` | Left Stick / D-Pad | Horizontal movement |
| **Look Up / Down** | `↑` / `↓` (Arrow Keys) | — | D-Pad `▲` / `▼` | Left Stick | Camera pan / directional slash |
| **Jump** | `Space` | — | `JUMP` Button | `A` / Cross | Variable height; coyote time (100 ms) + buffer (130 ms) |
| **Attack (Splinter)** | `A` | **Left Click** | `ATK` Button | `X` / Square | 3-direction melee slash with nail bounce (**pogo**) |
| **Dash / Dodge** | `D` | **Right Click** | `DASH` Button | `RB` / `R1` | Quick horizontal burst across hazards and wide gaps |
| **Focus (Heal)** | Hold `H` | — | Hold `HEAL` Button | Hold `Y` / Triangle | Stand still to channel 33 Soul and recover 1 Mask HP |
| **Cast (Wisp Bolt)** | `C` | Shift + Right Click | `CAST` Button | `B` / Circle | Consumes 33 Soul to launch a penetrating bolt |
| **Attack List Guide** | `Q` | — | — | — | Toggle in-game moves & abilities reference sheet |
| **Interact / Rest** | `E` | — | `E` Prompt | `Y` / Triangle | Rest at benches, speak to NPCs, trade with Merchant |
| **Double Jump (Wingbeat)**| `Space` (airborne) | — | `JUMP` Button | `A` / Cross | Mid-air second jump when unlocked |
| **Map** | `Tab` or `M` | — | `MAP` Button | `Back` / `Select` | View explored zones and discovered benches |
| **Pause / Menu** | `Escape` or `P` | — | `PAUSE` Button | `Start` | Pause game, manage volume, controls, and accessibility |

> **Mobile Play:** On mobile phones, on-screen controls appear automatically. On laptop and desktop screens, mobile controls are hidden to keep the canvas clean. Portrait mode displays an animated orientation prompt; rotate your device to landscape for full gameplay. Touch button scale (Small, Medium, Large) can be adjusted in the **Controls** menu.

---

## World & Zones

1. **Cradle of Ash** (4 rooms) — Tutorial caverns, first bench, introductory enemies (*Crawlid*).
2. **The Rootway** (6 rooms) — Central hub, Cartographer, Merchant shop, interconnecting shortcuts.
3. **Sporefall Hollows** (5 rooms) — Bioluminescent fungal caverns; contains the **Skitter Dash**.
4. **Drowned Cistern** (5 rooms) — Submerged waterways; features the **Cling** ability and **Moltguard** mini-boss.
5. **Ember Warrens** (4 rooms) — Volcanic underchambers; holds the **Wingbeat** and **Wisp Bolt**.
6. **Frozen Reliquary** (3 rooms) — Cold Indigo gauntlet leading to the sealed arena of **Warden Molt**.
7. **The Choir Deep** (3 rooms) — The sacred heart of Vael; arena for the climactic **Choir Mother** final battle.
8. **Silent Vault** (2 rooms) — Secret hidden area behind cracked walls rewarding dedicated explorers with lore and charms.

---

## Developer & Verification Tools

- **Validate room geometry, exits, props, and spawns**:
  ```bash
  node tools/validate.mjs
  ```
- **Automated game logic check (via Chrome DevTools Protocol)**:
  ```bash
  node tools/game-logic-check.mjs
  ```
- **Headless visual capture tool**:
  ```bash
  node tools/browser-check.mjs
  ```

---

## Documentation

- [`plan.md`](./plan.md) — Original architectural design and milestone specification.
- [`docs/design-tuning.md`](./docs/design-tuning.md) — Physics parameters, combat frame data, soul economy, and damage tables.
- [`docs/verification.md`](./docs/verification.md) — Headless test logs, CDP evidence, and acceptance criteria verifications.
- [`docs/playtest.md`](./docs/playtest.md) — Pacing budget and speedrun / first-run routing.
- [`docs/reference-notes.md`](./docs/reference-notes.md) — Creative direction, sound design parameters, and reference notes.
