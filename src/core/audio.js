// Studio-grade background soundtrack and SFX engine.
// Uses real Little Nightmares-style ambient audio files for BGM, and zero-latency Web Audio for SFX.
import { readSettings, writeSettings } from './save.js';
import { NO_AUDIO } from '../config.js';

// Real high-quality CC0 background tracks imported for the game
const TRACKS = {
  title: 'assets/audio/bgm_title.mp3',       // Spooky Music Box Waltz (CC0) by Aureolus_Omicron
  cradle: 'assets/audio/bgm_title.mp3',      // Melancholic music box cradle theme
  forest: 'assets/audio/bgm_title.mp3',      // Lush dark forest waltz
  snow: 'assets/audio/bgm_cistern.mp3',      // Glacial frozen sanctuary
  rootway: 'assets/audio/bgm_ambient.mp3',   // Deep dark atmospheric cavern ambience
  sporefall: 'assets/audio/bgm_ambient.mp3', // Eerie organic spore caverns
  cistern: 'assets/audio/bgm_cistern.mp3',   // Cold silence / sunken flooded halls
  ember: 'assets/audio/bgm_ambient.mp3',     // Dark subterranean furnace
  reliquary: 'assets/audio/bgm_cistern.mp3', // Ancient hollow halls
  choir: 'assets/audio/bgm_cistern.mp3',     // Sacred sunken sanctuary
  vault: 'assets/audio/bgm_ambient.mp3',     // Deep forgotten vault
  boss: 'assets/audio/bgm_cistern.mp3',      // Tense encounter ambience
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;

    this.vol = { master: 0.8, music: 0.65, sfx: 0.8 };
    this.zone = null;
    this.currentTrackSrc = null;
    this.bgmAudio = null;
    this.isPaused = false;
    this.lastSettings = null;
  }

  init() {
    if (NO_AUDIO) return false;
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        this.ctx = new AC();
      } catch {
        return false;
      }

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.buildNoise();
      this.applySettings(readSettings());
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  buildNoise() {
    if (!this.ctx) return;
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
  }

  applySettings(settings) {
    this.lastSettings = settings;
    this.vol.master = settings.master;
    this.vol.music = settings.music;
    this.vol.sfx = settings.sfx;

    if (this.bgmAudio) {
      this.bgmAudio.volume = Math.max(0, Math.min(1, settings.master * settings.music));
    }

    if (this.ctx && this.masterGain && this.sfxGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(settings.master, t, 0.08);
      this.sfxGain.gain.setTargetAtTime(settings.sfx, t, 0.05);
    }
  }

  setVolumes(partial) {
    const settings = { ...(this.lastSettings || readSettings()), ...partial };
    this.applySettings(settings);
    writeSettings(settings);
  }

  // Start background music for the specified zone
  startZone(zone) {
    if (NO_AUDIO) return;
    this.init();

    const targetZone = TRACKS[zone] ? zone : 'rootway';
    const targetSrc = TRACKS[targetZone];

    if (this.zone === targetZone && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }

    this.zone = targetZone;
    this.playBGM(targetSrc);
  }

  // Play high quality background audio file
  playBGM(src) {
    if (typeof Audio === 'undefined') return;

    if (this.currentTrackSrc === src && this.bgmAudio) {
      if (this.bgmAudio.paused && !this.isPaused) {
        this.bgmAudio.volume = Math.max(0, Math.min(1, this.vol.master * this.vol.music));
        this.bgmAudio.play().catch(() => {});
      }
      return;
    }

    // Stop and unload previous track
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      } catch {}
    }

    this.currentTrackSrc = src;
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = Math.max(0, Math.min(1, this.vol.master * this.vol.music));
    this.bgmAudio = audio;

    if (!this.isPaused) {
      audio.play().catch(() => {
        // Autoplay may be restricted until first user interaction
      });
    }
  }

  // Immediately pause BGM (used when pausing game, minimizing, or switching tabs)
  pauseBGM() {
    this.isPaused = true;
    if (this.bgmAudio && !this.bgmAudio.paused) {
      try {
        this.bgmAudio.pause();
      } catch {}
    }
  }

  // Resume BGM when unpausing
  resumeBGM() {
    this.isPaused = false;
    if (this.bgmAudio && this.bgmAudio.paused) {
      this.bgmAudio.volume = Math.max(0, Math.min(1, this.vol.master * this.vol.music));
      this.bgmAudio.play().catch(() => {});
    }
  }

  // Completely stop and reset BGM
  stopBGM() {
    this.isPaused = false;
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      } catch {}
    }
    this.currentTrackSrc = null;
  }

  stopPad() {
    this.stopBGM();
  }

  setBoss(on) {
    if (on) {
      this.startZone('boss');
    }
  }

  // Step update: silences sound when game is paused or stopping
  update(dt, mode = 'playing') {
    if (mode === 'paused') {
      if (!this.isPaused) {
        this.pauseBGM();
      }
    } else {
      if (this.isPaused) {
        this.resumeBGM();
      }
    }
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
