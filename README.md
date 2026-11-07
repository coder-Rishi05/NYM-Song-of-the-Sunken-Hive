<div align="center">

# ✦ NYM: SONG OF THE SUNKEN HIVE ✦

*A dark, atmospheric 2D Metroidvania built entirely for the browser with zero external dependencies.*

[![Live Game](https://img.shields.io/badge/PLAY%20ONLINE-Vercel%20Live-brightgreen?style=for-the-badge&logo=vercel)](https://github.com/coder-Rishi05/NYM-Song-of-the-Sunken-Hive)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Desktop%20%7C%20Mobile-blue?style=for-the-badge&logo=googlechrome)](#controls--input)
[![Engine](https://img.shields.io/badge/Engine-Vanilla%20Canvas%202D-orange?style=for-the-badge&logo=html5)](#architecture--tech-stack)
[![Audio](https://img.shields.io/badge/Audio-Web%20Audio%20%2B%20BGM-purple?style=for-the-badge)](#atmospheric-audio--soundtrack)
[![License](https://img.shields.io/badge/License-MIT%20%2F%20CC0-green?style=for-the-badge)](#credits--assets)

<p align="center">
  <b>Descend as Nym, a small husk-knight bound in cracked porcelain, into the sunken kingdom of Vael to relight the dying Sunstone.</b>
</p>

---

[🎮 Play Online](#quick-start-play-locally) • [⚔️ Combat & Abilities](#combat--player-abilities) • [🗺️ World & Biomes](#world--biomes) • [🕹️ Controls](#controls--input) • [🧪 Testing Suite](#developer--verification-tools)

---

</div>

## 📜 Synopsis

> *"The lamp is out. The song has stopped.*  
> *Go down, little husk. Go down."*

In the sunken, insectoid ruins of **Vael**, an ancient fungal and chitin metropolis lies entombed beneath towering cathedral arches. The Choir Mother has succumbed to the silence, and dark abominations stir in the flooded cisterns and ember tunnels. 

Armed with a splintered needle-nail and the last spark of soul light, you must navigate labyrinthine passages, master perilous pogo leaps across spikes, acquire ancient movement gifts, and overcome towering guardians to awaken the Sunstone at the heart of the world.

---

## ✨ Key Features

* ⚔️ **Precision 2D Platforming & Combat**:
  * 3-directional melee nail strikes with 45 ms hitstop weight.
  * Downward pogo slashing to bounce off enemies and spike hazards.
  * Forward dash with ethereal shadow ghosts and invulnerability frames.
  * Piercing ranged **Wisp Bolt** soul spells with radial contact explosions.
  * Stationary **Focus Healing** powered by soul energy gathered from fallen foes.
  * In-game **Minimalist Combat Guide** HUD overlay (`Q`).

* 🌲 **Atmospheric Living Biomes & Dynamic Weather**:
  * **Forest Thicket**: Lush mossy green depths with drifting forest leaves and glowing fireflies.
  * **Glacial Reaches**: Frost-dusted stone caverns with tranquil falling snowflakes.
  * **Rootway & Sporefall**: Bioluminescent fungal caverns with creeping roots.
  * **Drowned Cistern & Ember Warrens**: Submerged aquatic waterways and fiery volcanic shafts.
  * **Sacred Choir & Reliquary**: Towering gothic halls and forgotten vaults.

* 🎵 **Little Nightmares-Inspired Ambient Soundtrack**:
  * Real CC0 background music tracks featuring eerie music box waltzes and subterranean drone textures.
  * Clean pause-muting: background music seamlessly stops during pauses and resumes on gameplay.
  * Zero-latency procedural Web Audio sound effects for slashes, footsteps, impacts, and parries.

* 📱 **Seamless Cross-Platform Controls**:
  * **Desktop**: Keyboard (WASD / Arrows) + native Mouse input (Left-Click attack, Right-Click dash).
  * **Mobile Touch**: Adaptive High-DPI touch engine with responsive virtual D-Pad, dedicated action buttons, and portrait orientation lock detection.
  * **Gamepad**: Full plug-and-play support for USB & Bluetooth Xbox, PlayStation, and generic gamepads.
  * **Direct Menu Interactivity**: Click or tap menu options directly with your mouse cursor or touchscreen.

* ⚡ **Zero Dependencies & Instant Load**:
  * Built purely with standard vanilla JavaScript ES Modules and HTML5 Canvas 2D.
  * No `node_modules`, no bundlers, no build step, no asset bloat. Starts instantly in any modern web browser.

---

## 🕹️ Controls & Input

The game adapts dynamically to your device. On mobile phones, on-screen touch controls are enabled automatically with landscape rotation guidance; on desktop browsers, touch buttons stay hidden to keep the canvas clean.

| Action | Keyboard | Mouse | Mobile Touch | Gamepad | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Move Left / Right** | `←` / `→` or `A` / `D` | — | D-Pad `◀` / `▶` | Left Stick / D-Pad | Horizontal movement |
| **Look Up / Down** | `↑` / `↓` or `W` / `S` | — | D-Pad `▲` / `▼` | Left Stick / D-Pad | Camera pan / directional slash |
| **Jump** | `Space` | — | `JUMP` Button | `A` / Cross | Variable height; coyote time (100 ms) + jump buffer (130 ms) |
| **Nail Slash** | `A` | **Left Click** | `ATK` Button | `X` / Square | 3-directional melee slash; pogo bounces off spikes and foes |
| **Dash / Dodge** | `D` | **Right Click** | `DASH` Button | `RB` / `R1` | Rapid forward burst with trailing shadow ghosts |
| **Focus (Heal)** | Hold `H` | — | Hold `HEAL` Button | Hold `Y` / Triangle | Stand motionless to channel 33 Soul and restore 1 Mask HP |
| **Cast (Wisp Bolt)** | `C` | Shift + Right Click | `CAST` Button | `B` / Circle | Fires a piercing soul dart that detonates on impact |
| **Combat Guide** | `Q` | — | — | — | Toggle in-game moves & abilities reference sheet |
| **Interact / Rest** | `E` | — | `E` Prompt | `Y` / Triangle | Rest at benches, speak to NPCs, purchase from Merchant |
| **World Map** | `Tab` or `M` | — | `MAP` Button | `Back` / `Select` | View explored zones and discovered benches |
| **Pause Menu** | `Escape` or `P` | — | `PAUSE` Button | `Start` | Pause game, manage volume, controls, and accessibility |

---

## 🗺️ World & Biomes

Explore **32 interconnected handcrafted rooms** across 8 unique atmospheric zones:

```
                                  [ Reliquary ]
                                        │
[ Forest (Thicket) ] ── [ Snow (Glacial) ] ── [ The Rootway ] ── [ Ember Warrens ]
                                                    │
                                            [ Sporefall Hollows ]
                                                    │
                                            [ Drowned Cistern ]
                                                    │
                                            [ The Choir Deep ]
                                                    │
                                            [ Sunstone Chamber ]
```

| Zone | Rooms | Atmosphere & Visual Identity | Key Encounters & Unlocks |
| :--- | :---: | :--- | :--- |
| 🌲 **The Sunken Thicket** | 2 | Lush moss-green ruins, drifting forest leaves, glowing fireflies | Tutorial tablets, Crawlid swarms |
| ❄️ **The Glacial Reaches** | 2 | Cold twilight blue, frost-capped ledges, gentle snow motes | Respite bench, Frostward Gate |
| 🌿 **The Rootway** | 6 | Dark cavern corridors, massive hanging roots, trade hub | Hollowmarket, The Watcher NPC, Merchant Shop |
| 🍄 **Sporefall Hollows** | 5 | Bioluminescent cyan spores, acid pits, toxic fungi | **Skitter Dash Ability**, Sporeling mines |
| 💧 **Drowned Cistern** | 5 | Submerged waterlogged aqueducts, dripping stalactites | **Cling (Wall Climb) Ability**, **Moltguard Mini-Boss** |
| 🔥 **Ember Warrens** | 4 | Smoldering furnace tunnels, cinder embers, magma glow | **Wingbeat (Double Jump)**, **Wisp Bolt (Spell)** |
| 🏛️ **Frozen Reliquary** | 3 | Ancient frozen monuments, shattered glass, high-tier guards | **Boss: Warden Molt** |
| 👑 **The Choir Deep** | 3 | Ethereal violet cathedral, floating choir lights | **Climactic Final Boss: The Choir Mother** |
| 🗝️ **Silent Vault** | 2 | Secret hidden chambers behind destructible masonry | Mask Shards, ancient lore tablets |

---

## ⚔️ Combat & Player Abilities

* **Directional Nail Slashes**:
  * **Side Slash**: Fast horizontal swipe dealing reliable damage.
  * **Upward Slash**: Clears aerial threats diving from above.
  * **Downward Pogo Bounce**: Striking downward against spikes or enemies propels Nym high into the air (-430 px/s velocity) and resets airborne jump counters.
* **Soul Vessel System**:
  * Hitting enemies generates soul energy.
  * Channel soul while stationary (Hold `H`) to heal damage.
* **Skitter Dash**:
  * Instant forward burst passing through hazard gaps and enemy strike zones with ethereal ghost shadows.
* **Wisp Bolt (Cast)**:
  * Fires a high-velocity piercing soul bolt that bursts on contact.
* **Wall Cling & Slide**:
  * Latch onto vertical walls and leap between parallel shafts.
* **Wingbeat (Double Jump)**:
  * Deploy ethereal spectral wings to execute a second mid-air leap.

---

## 👾 Bestiary & Guardians

### The Hive Denizens
* **Crawlid**: Low-level ground crawler; steady pacing movement; ideal for practicing nail strikes and pogo bounces.
* **Buzzer**: Erratic hovering aerial insect that swoops aggressively when you step below it.
* **Sporeling**: Camouflaged fungal mine that detonates into toxic spore bursts upon intrusion.
* **Ramshell**: Heavily armored charger that barrels forward at breakneck speed upon sighting the knight.
* **Maskfly**: Subterranean ambush hunter that burrows into the floor and leaps out when struck or approached.
* **Silkdrop**: Ceiling arachnid hanging on silk threads that drops suddenly from the dark.
* **Blowfly**: Heavy flyer that launches acid projectiles across platforms.
* **Bulwark**: Heavy shield beetle immune to frontal blows; defeat by attacking from behind or pogoing from above.
* **Chorister**: Floating specter that summons homing choir light bolts.
* **Husk Knight**: Elite sword-bearing hive sentry with multi-hit slashes and defensive backsteps.

### Towering Boss Encounters
* 🛡️ **Moltguard** *(Drowned Cistern)*: Massive armored sentinel whose colossal ground pounds unleash expanding seismic shockwaves.
* ⚔️ **Warden Molt** *(Frozen Reliquary)*: Master swordsman featuring lightning-fast teleports, lunging needle thrusts, and aerial dive plunges.
* 👑 **The Choir Mother** *(The Choir Deep)*: The ancient queen of Vael who commands floating choir light barrages, floor-wide acid floods, and multi-phase diving swarm attacks.

---

## 🚀 Quick Start (Play Locally)

The project includes a lightweight, zero-dependency HTTP static server with automatic MIME-type handling.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/coder-Rishi05/NYM-Song-of-the-Sunken-Hive.git
   cd NYM-Song-of-the-Sunken-Hive
   ```

2. **Launch the local game server**:
   ```bash
   node server.mjs
   ```

3. **Open in your browser**:
   Navigate to **[http://localhost:5173/](http://localhost:5173/)** (or `http://127.0.0.1:5173/`).

### URL Debug & Speedrun Flags
* `?play` — Skip the title screen and jump directly into gameplay.
* `?play&debug=1` — Activate the debug overlay (FPS counter, player coordinates, room ID, entity hitboxes).
* `?play&room=reliquary_03` — Warp directly to any room ID (e.g., `reliquary_03` for Warden Molt, `choir_02` for Choir Mother).

---

## 🧪 Developer & Verification Tools

The repository contains a full automated testing and simulation bot suite:

```bash
# Run the autoplay bot: Traverses and plays through all 32 levels with 0 crashes
node tools/play-all-levels.mjs

# Audit all 32 rooms: Tests spawns, tile geometry, and entity placements
node tools/test-all-rooms.mjs

# Test world exit topology: Validates all 64 doors and transitions
node tools/test-all-exits.mjs

# Entity stress tester: Tests all 10 enemies, 3 bosses, and combat repertoires
node tools/stress-test-engine.mjs

# Audio soundtrack tester: Verifies BGM loading, zone switches, and pause muting
node tools/test-audio-soundtrack.mjs

# Cursor & Touch auditor: Verifies DPI coordinate scaling, menu hovers, and direct clicks
node tools/test-menu-cursor-touch.mjs

# Static map validator: Verifies room geometry, door bindings, and items
node tools/validate.mjs
```

---

## 🏗️ Architecture & Tech Stack

```
NYM Engine Architecture
├── index.html          # Lightweight Canvas viewport & metadata
├── style.css           # High-DPI responsive layout & touch styling
├── server.mjs          # Zero-dependency local dev & static server
├── vercel.json         # Production clean URLs & no-cache headers
└── src/
    ├── config.js       # Game constants, resolution (1280x720), flags
    ├── main.js         # Game bootstrap, loop timing, visibility handler
    ├── core/           # Math, PRNG, save data, input, Web Audio engine
    ├── data/           # 32 room layouts, exits, platforms, enemies
    ├── game/           # Kinematics, player physics, enemies, bosses, combat
    ├── render/         # Procedural vector drawing: backdrops, nym, bosses, bugs
    ├── ui/             # Canvas menus, dialogues, map screen, touch controls
    └── world/          # Room collision rasterizer & entity loader
```

* **100% Vanilla ES Modules**: No Transpilation, No Webpack/Vite required.
* **Canvas 2D Procedural Rendering**: Resolution independent, mathematically rendered shapes and lighting gradients.
* **Hybrid Audio Pipeline**: Real-time Web Audio API synthesis paired with ambient CC0 soundtrack streaming.

---

## 📄 Credits & Assets

* **Game Design & Development**: Built with care using the Google Antigravity paired coding assistant.
* **Music & Audio**: Real atmospheric background compositions licensed under **Creative Commons 0 (CC0 / Public Domain)**.
* **Inspiration**: Homage to Team Cherry's *Hollow Knight* and Tarsier Studios' *Little Nightmares*.

---

<div align="center">
  <sub>NYM: Song of the Sunken Hive • Designed for the web • Playable everywhere</sub>
</div>
