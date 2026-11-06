# Shipped-Artifact Verification Log — NYM

This document logs automated acceptance testing and Chrome DevTools Protocol (CDP) verification runs against the shipped build.

---

## Acceptance Criteria Status (Milestone M12)

- [x] **Zero Build Dependencies**: Runs directly from vanilla ES modules in standard modern browsers.
- [x] **Full Traversal (Start → Ending)**: 32 rooms and all 3 bosses beatable with clean transitions.
- [x] **Ability Gating**: Skitter Dash, Cling, Wingbeat, and Wisp Bolt accurately gate progression routes.
- [x] **State Persistence**: 3 save slots, bench respawn checkpoints, collected flags, and item inventories persist in `localStorage`.
- [x] **Audio Subsystem**: Web Audio synthesizer initialises cleanly upon user interaction; zero clicks/pops; independent master/music/sfx gain busses.
- [x] **Performance Target**: Solid 60 FPS under fixed 60Hz delta accumulator; offscreen room canvas caching active.

---

## Automated Test Suites

### 1. Headless Content & Room Geometry Suite (`tools/validate.mjs`)
- **Execution**: `node tools/validate.mjs`
- **Coverage**:
  - Validates all 32 room geometry arrays (`w`, `h`, solid tile consistency).
  - Checks every exit rectangle for valid bounds and non-solid entryways.
  - Verifies unique placement of ability gifts (`dash`, `cling`, `wing`, `spell`).
  - Confirms boss configuration integrity (`moltguard`, `warden`, `choir`).
  - Headless mock render tests for `drawNym`, `drawBug`, `drawMoltguard`, `drawProp`, and `drawHUD`.
- **Result**: `0 errors, 2 expected non-reciprocal shortcut warnings` (intentional one-way hub shortcuts).

### 2. End-to-End CDP Logic Smoke Test (`tools/game-logic-check.mjs`)
- **Execution**: Run over loopback CDP (`http://127.0.0.1:9222`) against live browser instance.
- **Verification Vector**:
  1. **Bench Save & Healing**: Interacting with bench at `cradle_03` writes save data and restores player HP to 5.
  2. **Merchant Purchasing**: Buying Map from merchant in `rootway_03` deducts 120 shards and sets `flags['shop:map']`.
  3. **Ability Pickup**: Collecting Skitter Dash in `sporefall_05` grants ability and displays dialogue.
  4. **Boss Combat & Sealing**: Defeating Warden Molt sets `boss_warden` flag, unsealing the door to `choir_01`.
  5. **Final Boss & Ending**: Defeating Choir Mother in `choir_02` triggers the ending cutscene mode (`ending`).
  6. **Death & Respawn**: Player death triggers death overlay, increments death counter, and respawns player at last saved bench.
- **CDP Run Output**:
  ```json
  {
    "benchFound": true,
    "benchSaved": true,
    "benchHealed": true,
    "shopOpen": true,
    "boughtMap": true,
    "gotDash": true,
    "giftDialogue": true,
    "wardenSpawned": true,
    "wardenDoorSealedBefore": true,
    "wardenFlag": true,
    "wardenGone": true,
    "wardenDoorOpen": true,
    "doorTransition": "choir_01",
    "choirSpawned": true,
    "endingMode": "ending",
    "deathMode": "dead",
    "respawnRoom": "cradle_03",
    "respawnHp": 5,
    "deaths": 1,
    "errors": []
  }
  ```
- **Console Exceptions**: 0
