export const ZONE_PALETTE = {
  forest: {
    sky: ['#040d0a', '#0d261a', '#06130d'],
    far: '#0a1d14', mid: '#133224', near: '#1c4532',
    terrain: '#08140e', terrainTop: '#3e8455', terrainEdge: '#62c282',
    light: '#72f098', glow: '#a2ffbe', accent: '#d2ffe0',
    hazard: '#b8433a', fog: '#06130d', water: '#12382b',
  },
  snow: {
    sky: ['#060e1a', '#14253e', '#081424'],
    far: '#0d1d33', mid: '#162e4f', near: '#224472',
    terrain: '#0a1728', terrainTop: '#b8e2f8', terrainEdge: '#e2f4ff',
    light: '#9be2ff', glow: '#dcf4ff', accent: '#ffffff',
    hazard: '#c44860', fog: '#081424', water: '#183a54',
  },
  cradle: {
    sky: ['#090b11', '#171c27', '#0b0e15'],
    far: '#10141d', mid: '#171e2b', near: '#202939',
    terrain: '#0a0d14', terrainTop: '#4a5a73', terrainEdge: '#6a7d9c',
    light: '#e8a24a', glow: '#ffc270', accent: '#ffd9a0',
    hazard: '#b8433a', fog: '#0b0e15', water: '#1d3a4a',
  },
  rootway: {
    sky: ['#080b12', '#141a28', '#090c13'],
    far: '#0f1520', mid: '#161f2e', near: '#1e293b',
    terrain: '#090c13', terrainTop: '#4a5d78', terrainEdge: '#7089b5',
    light: '#9fc4ff', glow: '#cfe4ff', accent: '#dfeaff',
    hazard: '#a83f3f', fog: '#0a0e16', water: '#183246',
  },
  sporefall: {
    sky: ['#07110f', '#12241f', '#08100f'],
    far: '#0d1a18', mid: '#132724', near: '#1a3530',
    terrain: '#08110f', terrainTop: '#42796a', terrainEdge: '#63a892',
    light: '#6fe0c0', glow: '#a6ffe6', accent: '#c8fff2',
    hazard: '#c05a3a', fog: '#08120f', water: '#16403b',
  },
  cistern: {
    sky: ['#06101a', '#0f2131', '#071019'],
    far: '#0b1826', mid: '#112436', near: '#173146',
    terrain: '#071019', terrainTop: '#3a6c8c', terrainEdge: '#5aa4c8',
    light: '#7fd0ff', glow: '#b8e9ff', accent: '#d9f4ff',
    hazard: '#b05050', fog: '#071019', water: '#123a52',
  },
  ember: {
    sky: ['#120807', '#24100c', '#0f0706'],
    far: '#1a0d0a', mid: '#26130e', near: '#361a13',
    terrain: '#0e0706', terrainTop: '#85412f', terrainEdge: '#c06a4b',
    light: '#ff8a4a', glow: '#ffb26e', accent: '#ffd6a8',
    hazard: '#ff5a3c', fog: '#140908', water: '#3a1a12',
  },
  reliquary: {
    sky: ['#0a0c16', '#1a2033', '#0b0e18'],
    far: '#131829', mid: '#1c2438', near: '#27324a',
    terrain: '#090c14', terrainTop: '#6478a3', terrainEdge: '#9db3dd',
    light: '#dce8ff', glow: '#ffffff', accent: '#eef5ff',
    hazard: '#8a5a7a', fog: '#0b0e18', water: '#243a55',
  },
  choir: {
    sky: ['#07060d', '#160f26', '#08060e'],
    far: '#100b1c', mid: '#181029', near: '#221638',
    terrain: '#08060d', terrainTop: '#5d4689', terrainEdge: '#8f6fc7',
    light: '#c8a8ff', glow: '#e6d4ff', accent: '#f0e6ff',
    hazard: '#c2456a', fog: '#08060e', water: '#251a3d',
  },
  vault: {
    sky: ['#07090c', '#12171c', '#080a0d'],
    far: '#0d1116', mid: '#141a21', near: '#1c232c',
    terrain: '#080a0d', terrainTop: '#4c5f73', terrainEdge: '#748ba3',
    light: '#b9c7d6', glow: '#e2edf7', accent: '#f2f7fb',
    hazard: '#7a4040', fog: '#080a0d', water: '#1a2a34',
  },
};

export function paletteFor(zone) {
  return ZONE_PALETTE[zone] || ZONE_PALETTE.rootway;
}
