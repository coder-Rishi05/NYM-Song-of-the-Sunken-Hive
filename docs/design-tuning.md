# Design & Tuning Constants — NYM: Song of the Sunken Hive

All gameplay parameters, collision bounding boxes, frame data, and tuning values used in the engine.

---

## 1. Player Physics & Movement

Source: [`src/game/player.js`](../src/game/player.js) & [`src/config.js`](../src/config.js)

| Parameter | Value | Notes |
|---|---|---|
| **Hitbox Width** | 22 px | Narrow profile for tight platforming |
| **Hitbox Height** | 42 px | Standing height |
| **Run Speed** | 230 px/s | Snappy, responsive base walk/run |
| **Run Acceleration** | 2,800 px/s² | High acceleration for immediate control response |
| **Friction / Deceleration** | 3,200 px/s² | Minimal slide upon releasing move keys |
| **Jump Velocity** | −540 px/s | Initial jump impulse |
| **Variable Jump Gravity Cut** | ×0.5 | Releasing jump early truncates jump height |
| **Gravity (Normal)** | 1,900 px/s² | Standard downward fall acceleration |
| **Max Fall Speed** | 900 px/s | Terminal velocity |
| **Coyote Time** | 100 ms (0.10 s) | Ledge jump tolerance window |
| **Jump Buffer** | 130 ms (0.13 s) | Pre-landing jump command queuing |
| **Dash Speed** | 720 px/s | High speed forward burst |
| **Dash Duration** | 0.15 s | Instantaneous dash burst |
| **Dash Cooldown** | 0.42 s | Delay between consecutive dashes |
| **Wall Cling Slide Speed** | 130 px/s | Slower controlled wall descent |
| **Wall Jump Impulse X / Y** | ±280 px/s / −520 px/s | Wall kick-off trajectory |

---

## 2. Combat & Soul Economy

| Action / State | Value | Description |
|---|---|---|
| **Base Mask HP** | 5 | Max HP (expandable to 7 via Mask Shards) |
| **Base Soul Pool** | 99 | Cap for spell casting and healing |
| **Splinter Attack Range** | 52 × 40 px | Hitbox extent in facing direction |
| **Splinter Base Damage** | 5 | Upgraded to 8 with *Honed Splinter* |
| **Attack Startup / Active / Cooldown** | 50 ms / 83 ms / 100 ms | Total attack cycle ≈ 0.28 s |
| **Pogo Bounce Impulse** | −420 px/s | Downward slash on enemies or hazard spikes |
| **Focus Heal Channel Time** | 0.90 s | Stand-still channel to restore 1 Mask |
| **Focus Soul Cost** | 33 Soul | Consumes 1/3 of the base Soul meter |
| **Wisp Bolt Soul Cost** | 33 Soul | Spawns high-velocity piercing bolt (12 dmg) |
| **Soul Gain per Hit** | +11 Soul | Melee strike on regular enemies |
| **Soul Gain per Boss Hit** | +5 Soul | Melee strike on bosses |
| **Soul Gain on Kill** | +8 Soul | Bonus soul upon defeating an enemy |
| **Damage Taken** | 1 Mask (2 on Husk) | Invulnerability window: 1.2 s with screen flash |

---

## 3. Enemy Roster Tuning

Source: [`src/game/enemies.js`](../src/game/enemies.js)

| Enemy | HP | Damage | Speed (px/s) | Shards Dropped | Behavior |
|---|---|---|---|---|---|
| **Crawlid** | 10 | 1 | 52 | 5 | Ground patrol, turns at ledges and walls |
| **Buzzer** | 8 | 1 | 95 | 6 | Airborne sine-wave patrol, dives when aligned |
| **Sporeling** | 12 | 1 | 0 | 7 | Stationary turret, periodically lobs twin arcing spores |
| **Ramshell** | 22 | 1 | 130 | 12 | 0.6s wind-up shake tell, high-speed charge, wall-stunned |
| **Maskfly** | 10 | 1 | 140 | 6 | Burrows underground, bursts upward when player approaches |
| **Silkdrop** | 14 | 1 | 320 | 8 | Ceiling ambusher; drops quickly on thread, retracts |
| **Blowfly** | 8 | 1 | 110 | 5 | Aggressive kamikaze flight; explodes into 3 spores |
| **Bulwark** | 30 | 1 | 36 | 14 | Heavy armored carapace; immune to front attacks (pogo/rear vulnerable) |
| **Chorister** | 18 | 1 | 70 | 12 | Floating caster; charges and unleashes 3 homing musical notes |
| **Husk Knight** | 26 | 2 | 96 | 15 | Elite warrior; 3-hit combo, dash thrust, backstep avoidance |

---

## 4. Boss Encounter Tuning

Source: [`src/game/bosses.js`](../src/game/bosses.js)

### Moltguard, the First Molt (Mini-boss)
- **Room**: `cistern_04`
- **HP**: 180 | **Damage**: 1
- **Phases**:
  - Phase 1 (100%–50%): Leaping slams, ground shockwave ripples.
  - Phase 2 (< 50%): Armor break visual, enraged leap frequency, aggressive recovery.

### Warden Molt (Mid Boss)
- **Room**: `reliquary_03`
- **HP**: 420 | **Damage**: 1–2
- **Phases**:
  - Phase 1 (100%–65%): Ground charges, heavy claw slam, ceiling glob rain.
  - Phase 2 (65%–30%): 5-projectile arc spray, feint lunges, summons Crawlids.
  - Phase 3 (30%–0%): High-speed fury charges, arena ceiling spikes, distorted musical motif.
- **Reward**: Sets `boss_warden` flag, unsealing the gates to *The Choir Deep*.

### The Choir Mother (Final Boss)
- **Room**: `choir_02`
- **HP**: 560 | **Damage**: 1–2
- **Phases**:
  - Phase 1: Floating aerial sweeps, homing chord fans.
  - Phase 2: Perch teleportation, ceiling holy spike barrage, spawns Chorister apparitions.
  - Phase 3: Arena platform collapse, 360-degree radial projectile barrage, brief vulnerability windows.
- **Reward**: Unlocks game ending sequence, credits, and post-game stats.
