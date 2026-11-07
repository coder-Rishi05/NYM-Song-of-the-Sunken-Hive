import { makeRoom } from './roomBuilder.js';

// ---------------------------------------------------------------------------
// 1. CRADLE OF ASH
// ---------------------------------------------------------------------------
const cradle = [
  makeRoom({
    id: 'cradle_01', name: 'Cradle of Ash', zone: 'cradle', map: [0, 4], w: 40, h: 24,
    platforms: [[10, 18, 5], [20, 16, 6], [31, 18, 4]],
    enemies: [{ t: 'crawlid', x: 15, y: 19 }, { t: 'crawlid', x: 30, y: 19 }],
    props: [
      { t: 'tablet', x: 8, y: 19, text: 'The lamp is out. The song has stopped.\nGo down, little husk. Go down.' },
      { t: 'lamp', x: 4, y: 19 },
    ],
    doors: { east: { to: 'cradle_02' } },
  }),
  makeRoom({
    id: 'cradle_02', name: 'Ashfall Passage', zone: 'cradle', map: [1, 4], w: 40, h: 24,
    platforms: [[7, 18, 6], [17, 16, 5], [27, 18, 7]],
    enemies: [
      { t: 'crawlid', x: 12, y: 19 },
      { t: 'crawlid', x: 31, y: 19 },
      { t: 'buzzer', x: 22, y: 13 },
    ],
    props: [{ t: 'lamp', x: 20, y: 19 }],
    doors: { west: { to: 'cradle_01' }, east: { to: 'cradle_03' } },
  }),
  makeRoom({
    id: 'cradle_03', name: 'The Kindling Rest', zone: 'cradle', map: [2, 4], w: 40, h: 24,
    platforms: [[8, 18, 5], [28, 18, 5]],
    enemies: [{ t: 'crawlid', x: 33, y: 19 }],
    props: [
      { t: 'bench', x: 20, y: 19 },
      { t: 'lamp', x: 13, y: 19 },
      { t: 'lamp', x: 27, y: 19 },
    ],
    spawns: { bench: { x: 20, y: 20 } },
    doors: { west: { to: 'cradle_02' }, east: { to: 'cradle_04' } },
  }),
  makeRoom({
    id: 'cradle_04', name: 'Rootward Door', zone: 'cradle', map: [3, 4], w: 40, h: 24,
    platforms: [[8, 18, 4], [18, 16, 6], [30, 18, 5]],
    enemies: [{ t: 'crawlid', x: 14, y: 19 }, { t: 'buzzer', x: 26, y: 12 }],
    props: [{ t: 'tablet', x: 34, y: 19, text: 'Beyond this door the roots remember\neverything the hive has forgotten.' }],
    doors: { west: { to: 'cradle_03' }, east: { to: 'rootway_01' } },
  }),
];

// ---------------------------------------------------------------------------
// 2. THE ROOTWAY
// ---------------------------------------------------------------------------
const rootway = [
  makeRoom({
    id: 'rootway_01', name: 'The Rootway', zone: 'rootway', map: [4, 4], w: 40, h: 24,
    platforms: [[7, 18, 4], [15, 15, 5], [25, 17, 4], [33, 14, 5]],
    enemies: [{ t: 'buzzer', x: 20, y: 11 }, { t: 'crawlid', x: 34, y: 19 }],
    props: [{ t: 'lamp', x: 6, y: 19 }],
    doors: { west: { to: 'cradle_04' }, east: { to: 'rootway_02' } },
  }),
  makeRoom({
    id: 'rootway_02', name: 'Rootway Hollow', zone: 'rootway', map: [5, 4], w: 40, h: 24,
    platforms: [[7, 18, 5], [18, 16, 6], [29, 18, 6]],
    enemies: [
      { t: 'crawlid', x: 13, y: 19 },
      { t: 'maskfly', x: 24, y: 19 },
      { t: 'maskfly', x: 32, y: 19 },
    ],
    doors: { west: { to: 'rootway_01' }, east: { to: 'rootway_03' } },
  }),
  makeRoom({
    id: 'rootway_03', name: 'Hollowmarket', zone: 'rootway', map: [6, 4], w: 46, h: 24,
    platforms: [[8, 18, 5], [18, 15, 6], [30, 18, 5], [38, 15, 5]],
    enemies: [],
    props: [
      { t: 'bench', x: 12, y: 19 },
      { t: 'vendor', x: 24, y: 19, name: 'The Merchant' },
      {
        t: 'npc', x: 33, y: 19, name: 'The Watcher',
        lines: [
          'You are late, little husk. The lamp has been dark for a hundred years.',
          'The Warden still keeps the Reliquary. The Choir Mother still sings below.',
          'Find the four old gifts. Then go where the song is loudest.',
        ],
      },
      { t: 'lamp', x: 18, y: 19 },
      { t: 'lamp', x: 40, y: 19 },
    ],
    spawns: { bench: { x: 12, y: 20 }, shortcut: { x: 44, y: 20 }, descent: { x: 41, y: 20 } },
    holes: [[38, 20, 2, 2]],
    exits: [
      { x: 38, y: 21, w: 2, h: 2, to: 'rootway_04', spawn: 'west', need: 'dash' },
    ],
    doors: { west: { to: 'rootway_02' }, east: { to: 'rootway_05' } },
  }),
  makeRoom({
    id: 'rootway_04', name: 'The Long Descent', zone: 'rootway', map: [6, 5], w: 40, h: 28,
    floor: 24,
    platforms: [[8, 22, 5], [17, 20, 5], [26, 18, 5], [32, 15, 4]],
    enemies: [{ t: 'buzzer', x: 16, y: 12 }, { t: 'crawlid', x: 30, y: 23 }],
    props: [{ t: 'lamp', x: 5, y: 23 }],
    doors: { west: { to: 'rootway_03', spawn: 'descent' }, east: { to: 'cistern_01' } },
  }),
  makeRoom({
    id: 'rootway_05', name: 'Rootway Terrace', zone: 'rootway', map: [7, 4], w: 40, h: 24,
    platforms: [[6, 18, 5], [16, 15, 6], [27, 17, 5], [34, 14, 4]],
    enemies: [
      { t: 'husk', x: 22, y: 19 },
      { t: 'buzzer', x: 12, y: 11 },
      { t: 'crawlid', x: 35, y: 19 },
    ],
    doors: { west: { to: 'rootway_03' }, east: { to: 'rootway_06' } },
  }),
  makeRoom({
    id: 'rootway_06', name: 'The Sealed Gate', zone: 'rootway', map: [8, 4], w: 40, h: 24,
    platforms: [[8, 18, 5], [18, 15, 6], [29, 18, 5]],
    enemies: [
      { t: 'ramshell', x: 26, y: 19 },
      { t: 'sporeling', x: 14, y: 19 },
    ],
    props: [{ t: 'lamp', x: 6, y: 19 }],
    doors: { west: { to: 'rootway_05' }, east: { to: 'sporefall_01' } },
  }),
];

// ---------------------------------------------------------------------------
// 3. SPOREFALL HOLLOWS
// ---------------------------------------------------------------------------
const sporefall = [
  makeRoom({
    id: 'sporefall_01', name: 'Sporefall Hollows', zone: 'sporefall', map: [9, 4], w: 40, h: 26,
    floor: 22,
    platforms: [[8, 20, 5], [16, 17, 6], [28, 20, 6]],
    enemies: [
      { t: 'sporeling', x: 12, y: 21 },
      { t: 'buzzer', x: 25, y: 13 },
      { t: 'crawlid', x: 33, y: 21 },
    ],
    props: [{ t: 'lamp', x: 5, y: 21 }],
    doors: { west: { to: 'rootway_06' }, east: { to: 'sporefall_02' } },
  }),
  makeRoom({
    id: 'sporefall_02', name: 'Glowcap Gallery', zone: 'sporefall', map: [10, 4], w: 40, h: 26,
    floor: 22,
    platforms: [[6, 19, 4], [14, 16, 6], [26, 19, 5], [34, 15, 4]],
    enemies: [
      { t: 'maskfly', x: 20, y: 21 },
      { t: 'sporeling', x: 31, y: 21 },
      { t: 'silkdrop', x: 18, y: 10 },
    ],
    doors: { west: { to: 'sporefall_01' }, east: { to: 'sporefall_03' } },
  }),
  makeRoom({
    id: 'sporefall_03', name: 'Mycelial Stair', zone: 'sporefall', map: [11, 4], w: 40, h: 28,
    floor: 24,
    platforms: [[8, 22, 5], [17, 19, 6], [27, 16, 5], [32, 22, 5]],
    enemies: [
      { t: 'buzzer', x: 14, y: 13 },
      { t: 'ramshell', x: 30, y: 23 },
      { t: 'buzzer', x: 24, y: 9 },
    ],
    doors: { west: { to: 'sporefall_02' }, east: { to: 'sporefall_04' } },
  }),
  makeRoom({
    id: 'sporefall_04', name: 'Spore Drift', zone: 'sporefall', map: [12, 4], w: 40, h: 24,
    platforms: [[8, 18, 5], [18, 15, 7], [29, 18, 5]],
    enemies: [
      { t: 'sporeling', x: 15, y: 19 },
      { t: 'maskfly', x: 25, y: 19 },
      { t: 'buzzer', x: 11, y: 10 },
      { t: 'crawlid', x: 35, y: 19 },
    ],
    props: [
      { t: 'maskShard', x: 29, y: 17, id: 'sporefall04_mask' },
    ],
    doors: { west: { to: 'sporefall_03' }, east: { to: 'sporefall_05' } },
  }),
  makeRoom({
    id: 'sporefall_05', name: 'The Skitter Shrine', zone: 'sporefall', map: [13, 4], w: 40, h: 24,
    platforms: [[8, 18, 5], [20, 16, 6], [31, 18, 4]],
    enemies: [{ t: 'sporeling', x: 32, y: 19 }],
    props: [
      { t: 'dash', x: 20, y: 19 },
      { t: 'tablet', x: 10, y: 19, text: 'The first gift is motion.\nStrike the air, and the air will carry you.' },
      { t: 'lamp', x: 6, y: 19 },
    ],
    doors: {
      west: { to: 'sporefall_04' },
      east: { to: 'rootway_03', spawn: 'shortcut' },
    },
  }),
];

// ---------------------------------------------------------------------------
// 4. DROWNED CISTERN
// ---------------------------------------------------------------------------
const cistern = [
  makeRoom({
    id: 'cistern_01', name: 'Drowned Cistern', zone: 'cistern', map: [6, 6], w: 40, h: 26,
    floor: 22,
    platforms: [[8, 19, 5], [18, 16, 6], [28, 19, 5]],
    water: [[4, 21, 8, 1]],
    enemies: [
      { t: 'silkdrop', x: 18, y: 8 },
      { t: 'silkdrop', x: 30, y: 9 },
      { t: 'crawlid', x: 13, y: 21 },
    ],
    props: [{ t: 'lamp', x: 5, y: 21 }],
    doors: { west: { to: 'rootway_04' }, east: { to: 'cistern_02' } },
  }),
  makeRoom({
    id: 'cistern_02', name: 'The Weeping Wall', zone: 'cistern', map: [7, 6], w: 40, h: 26,
    floor: 22,
    platforms: [[6, 19, 4], [14, 16, 5], [24, 18, 4], [32, 15, 4]],
    water: [[6, 21, 28, 1]],
    enemies: [
      { t: 'silkdrop', x: 16, y: 8 },
      { t: 'sporeling', x: 26, y: 21 },
      { t: 'crawlid', x: 34, y: 21 },
    ],
    props: [
      { t: 'cling', x: 30, y: 21 },
      { t: 'tablet', x: 12, y: 21, text: 'The second gift is patience.\nHold to the wall. The wall will hold you.' },
    ],
    doors: { west: { to: 'cistern_01' }, east: { to: 'cistern_03' } },
  }),
  makeRoom({
    id: 'cistern_03', name: 'Flooded Archive', zone: 'cistern', map: [8, 6], w: 44, h: 28,
    floor: 24,
    platforms: [[8, 21, 4], [16, 18, 5], [24, 21, 4], [32, 18, 5], [38, 15, 4], [39, 21, 3], [41, 18, 2], [39, 15, 3]],
    water: [[5, 23, 30, 1]],
    enemies: [
      { t: 'silkdrop', x: 20, y: 9 },
      { t: 'silkdrop', x: 28, y: 8 },
      { t: 'buzzer', x: 34, y: 12 },
    ],
    props: [
      { t: 'maskShard', x: 39, y: 14, id: 'cistern03_mask' },
      { t: 'bench', x: 7, y: 23 },
      { t: 'tablet', x: 10, y: 23, text: 'The archive drowned before the lamp went out.\nSome truths sank with it.' },
    ],
    spawns: { bench: { x: 7, y: 24 } },
    exits: [
      { x: 41, y: 13, w: 2, h: 2, to: 'vault_01', spawn: 'west', need: 'spell' },
    ],
    doors: { west: { to: 'cistern_02' }, east: { to: 'cistern_04' } },
  }),
  makeRoom({
    id: 'cistern_04', name: "The Moltguard's Pool", zone: 'cistern', map: [9, 6], w: 46, h: 24,
    platforms: [[6, 15, 4], [36, 15, 4]],
    water: [[4, 19, 38, 1]],
    boss: { type: 'moltguard', x: 30, y: 19 },
    bosses: ['moltguard'],
    doors: { west: { to: 'cistern_03' }, east: { to: 'cistern_05' } },
  }),
  makeRoom({
    id: 'cistern_05', name: 'Cistern Overflow', zone: 'cistern', map: [10, 6], w: 44, h: 28,
    floor: 24,
    platforms: [[7, 22, 4], [15, 20, 4], [23, 18, 4], [31, 16, 4], [38, 13, 4]],
    water: [[4, 23, 36, 1]],
    enemies: [
      { t: 'buzzer', x: 18, y: 11 },
      { t: 'silkdrop', x: 26, y: 9 },
      { t: 'crawlid', x: 12, y: 23 },
    ],
    exits: [
      { x: 6, y: 24, w: 2, h: 1, to: 'rootway_03', spawn: 'shortcut' },
    ],
    holes: [[6, 24, 2, 1]],
    doors: {
      west: { to: 'cistern_04' },
      east: { to: 'ember_01', need: 'cling' },
    },
  }),
];

// ---------------------------------------------------------------------------
// 5. EMBER WARRENS
// ---------------------------------------------------------------------------
const ember = [
  makeRoom({
    id: 'ember_01', name: 'Ember Warrens', zone: 'ember', map: [11, 6], w: 40, h: 24,
    platforms: [[8, 18, 4], [18, 15, 5], [30, 18, 5]],
    spikes: [[14, 19, 4], [26, 19, 5]],
    enemies: [
      { t: 'blowfly', x: 20, y: 10 },
      { t: 'ramshell', x: 35, y: 19 },
    ],
    props: [{ t: 'lamp', x: 5, y: 19 }],
    doors: { west: { to: 'cistern_05' }, east: { to: 'ember_02' } },
  }),
  makeRoom({
    id: 'ember_02', name: 'The Cinder Nest', zone: 'ember', map: [12, 6], w: 40, h: 26,
    floor: 22,
    platforms: [[6, 19, 4], [14, 16, 5], [24, 19, 5], [32, 16, 4]],
    spikes: [[26, 21, 3]],
    enemies: [
      { t: 'blowfly', x: 16, y: 10 },
      { t: 'bulwark', x: 32, y: 21 },
      { t: 'buzzer', x: 10, y: 12 },
    ],
    props: [
      { t: 'wing', x: 20, y: 21 },
      { t: 'tablet', x: 10, y: 21, text: 'The third gift is defiance.\nThe ground is a suggestion. Refuse it twice.' },
    ],
    doors: { west: { to: 'ember_01' }, east: { to: 'ember_03' } },
  }),
  makeRoom({
    id: 'ember_03', name: 'Ash-Choked Vault', zone: 'ember', map: [13, 6], w: 44, h: 28,
    floor: 24,
    platforms: [[8, 21, 5], [17, 18, 5], [27, 21, 5], [34, 18, 5]],
    spikes: [[30, 23, 7]],
    enemies: [
      { t: 'chorister', x: 26, y: 10 },
      { t: 'blowfly', x: 12, y: 11 },
      { t: 'husk', x: 38, y: 23 },
    ],
    props: [
      { t: 'spell', x: 12, y: 23 },
      { t: 'lamp', x: 5, y: 23 },
    ],
    doors: { west: { to: 'ember_02' }, east: { to: 'ember_04' } },
  }),
  makeRoom({
    id: 'ember_04', name: 'Ember Gate', zone: 'ember', map: [14, 6], w: 40, h: 24,
    platforms: [[8, 18, 5], [20, 16, 6], [32, 18, 4]],
    spikes: [[14, 19, 3]],
    enemies: [
      { t: 'bulwark', x: 28, y: 19 },
      { t: 'ramshell', x: 36, y: 19 },
      { t: 'blowfly', x: 20, y: 9 },
    ],
    doors: { west: { to: 'ember_03' }, east: { to: 'reliquary_01', need: 'wing' } },
  }),
];

// ---------------------------------------------------------------------------
// 6. FROZEN RELIQUARY
// ---------------------------------------------------------------------------
const reliquary = [
  makeRoom({
    id: 'reliquary_01', name: 'Frozen Reliquary', zone: 'reliquary', map: [15, 6], w: 40, h: 24,
    platforms: [[8, 18, 4], [18, 15, 5], [28, 18, 5]],
    spikes: [[22, 19, 4]],
    enemies: [
      { t: 'chorister', x: 16, y: 9 },
      { t: 'husk', x: 31, y: 19 },
    ],
    props: [
      { t: 'npc', x: 10, y: 19, name: 'The Last Chorister', lines: [
        'I cannot sing anymore. The Mother sings for all of us now.',
        'The Warden will not let you pass. It has forgotten why it guards the door.',
      ] },
      { t: 'bench', x: 25, y: 19 },
      { t: 'lamp', x: 5, y: 19 },
    ],
    spawns: { bench: { x: 25, y: 20 } },
    doors: { west: { to: 'ember_04' }, east: { to: 'reliquary_02' } },
  }),
  makeRoom({
    id: 'reliquary_02', name: 'Hall of Silent Knights', zone: 'reliquary', map: [16, 6], w: 48, h: 26,
    floor: 22,
    platforms: [[8, 19, 4], [18, 16, 5], [28, 19, 4], [38, 16, 5]],
    spikes: [[22, 21, 4], [34, 21, 4]],
    enemies: [
      { t: 'husk', x: 16, y: 21 },
      { t: 'husk', x: 30, y: 21 },
      { t: 'bulwark', x: 42, y: 21 },
      { t: 'chorister', x: 24, y: 9 },
    ],
    props: [
      { t: 'tablet', x: 6, y: 21, text: 'Four gifts. Four doors. One lamp.\nThe old rhyme is shorter than the grief it carries.' },
      { t: 'maskShard', x: 28, y: 18, id: 'reliquary02_mask' },
    ],
    doors: { west: { to: 'reliquary_01' }, east: { to: 'reliquary_03' } },
  }),
  makeRoom({
    id: 'reliquary_03', name: "The Warden's Court", zone: 'reliquary', map: [17, 6], w: 48, h: 26,
    floor: 22,
    platforms: [[6, 16, 4], [38, 16, 4]],
    boss: { type: 'warden', x: 34, y: 21 },
    doors: {
      west: { to: 'reliquary_02' },
      east: { to: 'choir_01', need: 'flag:boss_warden' },
    },
    props: [{ t: 'lamp', x: 4, y: 21 }],
  }),
];

// ---------------------------------------------------------------------------
// 7. THE CHOIR DEEP
// ---------------------------------------------------------------------------
const choir = [
  makeRoom({
    id: 'choir_01', name: 'The Choir Deep', zone: 'choir', map: [18, 6], w: 40, h: 28,
    floor: 24,
    platforms: [[8, 22, 5], [18, 19, 6], [28, 22, 5]],
    enemies: [
      { t: 'chorister', x: 16, y: 10 },
      { t: 'chorister', x: 30, y: 12 },
      { t: 'silkdrop', x: 24, y: 9 },
    ],
    props: [
      { t: 'tablet', x: 6, y: 23, text: 'Do not listen too closely.\nThe Mother sings the Molt to sleep, and the song is wearing thin.' },
      { t: 'bench', x: 32, y: 23 },
      { t: 'lamp', x: 4, y: 23 },
    ],
    spawns: { bench: { x: 32, y: 24 } },
    doors: { west: { to: 'reliquary_03' }, east: { to: 'choir_02' } },
  }),
  makeRoom({
    id: 'choir_02', name: 'Stair of Voices', zone: 'choir', map: [18, 7], w: 40, h: 30,
    floor: 26,
    platforms: [[10, 24, 5], [20, 21, 6], [30, 18, 5], [22, 14, 4]],
    enemies: [
      { t: 'chorister', x: 18, y: 12 },
      { t: 'chorister', x: 32, y: 14 },
      { t: 'husk', x: 26, y: 25 },
    ],
    doors: { west: { to: 'choir_01' }, east: { to: 'choir_03' } },
  }),
  makeRoom({
    id: 'choir_03', name: 'The Heart Lamp', zone: 'choir', map: [19, 7], w: 48, h: 28,
    floor: 24,
    platforms: [[7, 20, 6], [21, 17, 6], [35, 20, 6]],
    boss: { type: 'choir', x: 24, y: 18 },
    doors: { west: { to: 'choir_02' } },
    props: [{ t: 'lamp', x: 4, y: 23 }],
  }),
];

// ---------------------------------------------------------------------------
// 8. SILENT VAULT (secret)
// ---------------------------------------------------------------------------
const vault = [
  makeRoom({
    id: 'vault_01', name: 'Silent Vault', zone: 'vault', map: [5, 7], w: 36, h: 24,
    platforms: [[7, 18, 5], [16, 15, 6], [26, 18, 5]],
    enemies: [
      { t: 'bulwark', x: 28, y: 19 },
      { t: 'maskfly', x: 20, y: 19 },
    ],
    props: [{ t: 'lamp', x: 4, y: 19 }],
    doors: { west: { to: 'cistern_03', spawn: 'start' }, east: { to: 'vault_02' } },
    spawns: { west: { x: 2, y: 20 } },
  }),
  makeRoom({
    id: 'vault_02', name: 'Vault of the Moth', zone: 'vault', map: [5, 8], w: 36, h: 24,
    platforms: [[8, 18, 4], [18, 15, 5], [27, 18, 4]],
    enemies: [],
    props: [
      { t: 'charm', x: 20, y: 19, id: 'charm_ember' },
      { t: 'grub', x: 12, y: 19, id: 'grub_vault' },
      { t: 'tablet', x: 8, y: 19, text: 'A gift from a moth who chose to stay.\nWarmth is a kind of courage.' },
    ],
    doors: { west: { to: 'vault_01' } },
  }),
];

export const ROOMS = {};
for (const room of [...cradle, ...rootway, ...sporefall, ...cistern, ...ember, ...reliquary, ...choir, ...vault]) {
  ROOMS[room.id] = room;
}
export const ROOM_LIST = Object.values(ROOMS);
export const START_ROOM_ID = 'cradle_01';
