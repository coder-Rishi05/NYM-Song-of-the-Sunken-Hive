// Fully synthesized ambience, motifs and SFX. No audio files, no network.
import { readSettings, writeSettings } from './save.js';
import { NO_AUDIO } from '../config.js';

const ZONES = {
  cradle:    { root: 110.0, scale: [0, 3, 5, 7, 10], cutoff: 620, interval: [2.6, 4.8], pluck: 0.075 },
  rootway:   { root: 98.0,  scale: [0, 2, 3, 7, 10], cutoff: 540, interval: [2.2, 4.2], pluck: 0.09 },
  sporefall: { root: 130.8, scale: [0, 3, 5, 7, 10], cutoff: 820, interval: [2.0, 3.8], pluck: 0.07 },
  cistern:   { root: 87.3,  scale: [0, 2, 5, 7, 9],  cutoff: 480, interval: [3.0, 5.2], pluck: 0.085 },
  ember:     { root: 73.4,  scale: [0, 1, 5, 7, 8],  cutoff: 760, interval: [2.4, 4.4], pluck: 0.07 },
  reliquary: { root: 116.5, scale: [0, 3, 5, 8, 10], cutoff: 900, interval: [2.8, 5.0], pluck: 0.07 },
  choir:     { root: 65.4,  scale: [0, 1, 3, 5, 8],  cutoff: 420, interval: [2.0, 3.6], pluck: 0.06 },
  vault:     { root: 92.5,  scale: [0, 2, 3, 5, 7],  cutoff: 380, interval: [4.0, 6.5], pluck: 0.05 },
  boss:      { root: 61.7,  scale: [0, 1, 3, 6, 8],  cutoff: 500, interval: [1.6, 3.0], pluck: 0.05 },
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;
    this.vol = { master: 0.8, music: 0.55, sfx: 0.8 };
    this.zone = null;
    this.pad = null;
    this.bossPad = null;
    this.melodyTimer = 1.5;
    this.lastSettings = null;
  }

  init() {
    if (NO_AUDIO) return false;
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        this.ctx = new AC();
      } catch {
        return false;
      }
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.applySettings(readSettings());
      this.buildNoise();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return true;
  }

  applySettings(settings) {
    this.lastSettings = settings;
    this.vol.master = settings.master;
    this.vol.music = settings.music;
    this.vol.sfx = settings.sfx;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(settings.master, t, 0.08);
    this.musicGain.gain.setTargetAtTime(settings.music * 0.85, t, 0.08);
    this.sfxGain.gain.setTargetAtTime(settings.sfx, t, 0.05);
  }

  setVolumes(partial) {
    const settings = { ...(this.lastSettings || readSettings()), ...partial };
    this.applySettings(settings);
    writeSettings(settings);
  }

  buildNoise() {
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
  }

  startZone(zone) {
    if (!this.init()) return;
    if (this.zone === zone && this.pad) return;
    this.zone = zone;
    this.stopPad();
    this.melodyTimer = 1.2;

    const cfg = ZONES[zone] || ZONES.rootway;
    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 2.2);
    gain.connect(this.musicGain);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cfg.cutoff;
    filter.Q.value = 0.6;
    filter.connect(gain);

    const oscs = [];
    const addOsc = (freq, type, detune, vol) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      g.gain.value = vol;
      osc.connect(g);
      g.connect(filter);
      osc.start(now);
      oscs.push(osc, g);
    };
    addOsc(cfg.root, 'sine', -6, 0.35);
    addOsc(cfg.root * 2, 'triangle', 5, 0.16);
    addOsc(cfg.root * 1.5, 'sine', 0, 0.12);

    // Slow breathing filter for the cave air.
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.06 + Math.random() * 0.05;
    lfoGain.gain.value = cfg.cutoff * 0.35;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);
    oscs.push(lfo, lfoGain);

    // Airy noise bed.
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 340;
    nf.Q.value = 0.7;
    const ng = this.ctx.createGain();
    ng.gain.value = 0.05;
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(gain);
    noise.start(now);
    oscs.push(noise, nf, ng);

    this.pad = { gain, oscs, cfg };
  }

  stopPad() {
    if (!this.pad || !this.ctx) return;
    const { gain, oscs } = this.pad;
    const now = this.ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    for (const node of oscs) {
      try {
        node.stop(now + 1.2);
      } catch {
        /* already stopped */
      }
    }
    this.pad = null;
  }

  setBoss(on) {
    if (!this.init()) return;
    if (on && !this.bossPad) {
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 2);
      gain.connect(this.musicGain);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 220;
      filter.connect(gain);
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 55;
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = 27.5;
      osc.connect(filter);
      osc2.connect(filter);
      osc.start(now);
      osc2.start(now);
      this.bossPad = { gain, osc, osc2 };
    } else if (!on && this.bossPad) {
      const now = this.ctx.currentTime;
      const { gain, osc, osc2 } = this.bossPad;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      try { osc.stop(now + 1.3); osc2.stop(now + 1.3); } catch { /* ignore */ }
      this.bossPad = null;
    }
  }

  update(dt) {
    if (!this.ctx || !this.pad) return;
    this.melodyTimer -= dt;
    if (this.melodyTimer > 0) return;
    const cfg = this.pad.cfg;
    const [lo, hi] = cfg.interval;
    this.melodyTimer = lo + Math.random() * (hi - lo);

    const scale = cfg.scale;
    const semis = scale[Math.floor(Math.random() * scale.length)];
    const octave = Math.random() < 0.3 ? 2 : 1;
    const freq = cfg.root * Math.pow(2, semis / 12) * octave * 2;
    const vol = cfg.pluck * (0.7 + Math.random() * 0.5);
    this.pluck(freq, 1.6, vol);

    if (Math.random() < 0.25) {
      const f2 = freq * 1.5;
      setTimeout(() => this.pluck(f2, 1.2, vol * 0.5), 260);
    }

    // Biome dynamic environmental audio cues
    this.playBiomeAmbience();
  }

  playBiomeAmbience() {
    if (!this.ctx || !this.zone) return;
    const now = this.ctx.currentTime;
    const z = this.zone;

    if (z === 'sporefall' || z === 'rootway') {
      // Forest insect / bird chirp
      if (Math.random() < 0.35) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const baseF = 1800 + Math.random() * 600;
        osc.frequency.setValueAtTime(baseF, now);
        osc.frequency.exponentialRampToValueAtTime(baseF * 1.2, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(baseF * 0.9, now + 0.16);
        g.gain.setValueAtTime(0.012, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } else if (z === 'cistern') {
      // Water drip ping
      if (Math.random() < 0.45) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        const f = 900 + Math.random() * 400;
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 0.7, now + 0.12);
        g.gain.setValueAtTime(0.025, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.26);
      }
    } else if (z === 'ember') {
      // Ember crackle
      if (Math.random() < 0.5) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800 + Math.random() * 1200;
        filter.Q.value = 3;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.02, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        src.connect(filter);
        filter.connect(g);
        g.connect(this.musicGain);
        src.start(now);
        src.stop(now + 0.1);
      }
    } else if (z === 'reliquary') {
      // Cold wind gust
      if (Math.random() < 0.3) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, now);
        filter.frequency.linearRampToValueAtTime(540, now + 0.8);
        filter.frequency.linearRampToValueAtTime(200, now + 1.6);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.022, now + 0.7);
        g.gain.linearRampToValueAtTime(0.0001, now + 1.7);
        src.connect(filter);
        filter.connect(g);
        g.connect(this.musicGain);
        src.start(now);
        src.stop(now + 1.75);
      }
    }
  }

  pluck(freq, dur = 1.4, vol = 0.08) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  tone(freq, freq2, dur, type = 'sine', vol = 0.16, attack = 0.006) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), now);
    if (freq2 && freq2 !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq2), now + dur);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.05);
  }

  noise(dur = 0.2, vol = 0.2, freq = 1200, q = 0.8, type = 'bandpass') {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.35), now + dur);
    filter.Q.value = q;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(now);
    src.stop(now + dur + 0.05);
  }

  sfx(name) {
    if (!this.init()) return;
    switch (name) {
      case 'slash':
        this.noise(0.13, 0.24, 2600, 1.4);
        this.tone(720, 380, 0.1, 'triangle', 0.1);
        break;
      case 'hit':
        this.tone(160, 70, 0.14, 'square', 0.16);
        this.noise(0.1, 0.18, 900, 1);
        break;
      case 'pogo':
        this.tone(560, 1180, 0.12, 'sine', 0.16);
        this.noise(0.08, 0.1, 3200, 2);
        break;
      case 'jump':
        this.tone(300, 520, 0.12, 'sine', 0.08);
        break;
      case 'doublejump':
        this.tone(420, 760, 0.16, 'triangle', 0.1);
        this.noise(0.12, 0.08, 1800, 1);
        break;
      case 'land':
        this.noise(0.1, 0.12, 380, 0.8);
        break;
      case 'dash':
        this.noise(0.22, 0.2, 1700, 0.9);
        this.tone(240, 90, 0.18, 'sine', 0.06);
        break;
      case 'hurt':
        this.tone(210, 60, 0.35, 'sawtooth', 0.18);
        this.noise(0.22, 0.22, 700, 0.7);
        break;
      case 'heal':
        this.tone(523, 784, 0.5, 'sine', 0.12);
        this.tone(784, 1046, 0.7, 'sine', 0.06);
        break;
      case 'focus':
        this.tone(196, 392, 0.5, 'sine', 0.05);
        break;
      case 'spell':
        this.tone(880, 220, 0.4, 'triangle', 0.14);
        this.noise(0.3, 0.14, 2200, 1.2);
        break;
      case 'death':
        this.tone(140, 38, 1.3, 'sawtooth', 0.2);
        this.noise(1.1, 0.18, 320, 0.6);
        break;
      case 'pickup':
        this.tone(1046, 1568, 0.3, 'sine', 0.12);
        break;
      case 'shard':
        this.tone(1320, 1760, 0.1, 'sine', 0.05);
        break;
      case 'bench':
        this.tone(392, 523, 0.8, 'sine', 0.09);
        this.tone(523, 659, 1.1, 'sine', 0.05);
        break;
      case 'gate':
        this.noise(0.35, 0.15, 500, 0.8);
        this.tone(120, 80, 0.4, 'square', 0.1);
        break;
      case 'roar':
        this.tone(90, 42, 1.2, 'sawtooth', 0.25);
        this.noise(1.0, 0.2, 420, 0.6);
        break;
      case 'slam':
        this.noise(0.35, 0.3, 260, 0.7);
        this.tone(90, 40, 0.4, 'sine', 0.2);
        break;
      case 'spike':
        this.tone(1400, 300, 0.18, 'square', 0.1);
        break;
      case 'menu':
        this.tone(660, 660, 0.07, 'sine', 0.05);
        break;
      case 'select':
        this.tone(880, 1320, 0.16, 'sine', 0.08);
        break;
      case 'secret':
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => this.tone(f, f, 0.5, 'sine', 0.08), i * 120);
        });
        break;
      default:
        break;
    }
  }
}

export const audio = new AudioEngine();
