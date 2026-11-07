// Fully synthesized atmospheric soundtrack, Little Nightmares-style music box, ambient pads, and SFX.
// 100% Web Audio synthesis. No external audio files, zero network latency.
import { readSettings, writeSettings } from './save.js';
import { NO_AUDIO } from '../config.js';

// Musical note frequencies (A4 = 440 Hz standard equal temperament)
export const NOTES = {
  // Low Bass Register
  C1: 32.70, D1: 36.71, Eb1: 38.89, E1: 41.20, F1: 43.65, G1: 49.00, A1: 55.00, Bb1: 58.27, B1: 61.74,
  C2: 65.41, D2: 73.42, Eb2: 77.78, E2: 82.41, F2: 87.31, G2: 98.00, Ab2: 103.83, A2: 110.00, Bb2: 116.54, B2: 123.47,
  // Warm Mid Register
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  // Melodic Music Box Register
  C4: 261.63, Db4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Db5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  C6: 1046.50, D6: 1174.66, Eb6: 1244.51, E6: 1318.51, F6: 1396.91, G6: 1567.98,
};

// Zone-specific musical configurations: harmonic chords, sub drone, filter, and haunting melodic phrases
const ZONE_MUSIC = {
  // Title Theme: "The Sunken Lullaby" (Key of D Minor)
  // Iconic Little Nightmares slow music box lullaby with deep breathing strings
  title: {
    subFreq: NOTES.D1,
    padChord: [NOTES.D2, NOTES.A2, NOTES.F3, NOTES.A3],
    filterCutoff: 380,
    pauseBetweenPhrases: 3.2,
    phrases: [
      // Phrase 1: The Call (melancholic 3/4 lullaby)
      [
        { n: NOTES.D4, d: 0.75, v: 0.13 },
        { n: NOTES.F4, d: 0.75, v: 0.12 },
        { n: NOTES.A4, d: 1.30, v: 0.15 },
        { n: NOTES.G4, d: 0.65, v: 0.12 },
        { n: NOTES.F4, d: 0.65, v: 0.11 },
        { n: NOTES.E4, d: 1.20, v: 0.13 },
        { n: NOTES.D4, d: 0.70, v: 0.12 },
        { n: NOTES.Db4, d: 0.70, v: 0.10 },
        { n: NOTES.D4, d: 2.20, v: 0.14 },
      ],
      // Phrase 2: The Longing (rising into high bell notes)
      [
        { n: NOTES.F4, d: 0.75, v: 0.12 },
        { n: NOTES.G4, d: 0.75, v: 0.12 },
        { n: NOTES.A4, d: 1.20, v: 0.14 },
        { n: NOTES.C5, d: 1.10, v: 0.16 },
        { n: NOTES.Bb4, d: 0.75, v: 0.13 },
        { n: NOTES.A4, d: 0.75, v: 0.12 },
        { n: NOTES.F4, d: 0.75, v: 0.11 },
        { n: NOTES.G4, d: 0.75, v: 0.12 },
        { n: NOTES.E4, d: 2.20, v: 0.13 },
      ],
      // Phrase 3: The Fragile Descent
      [
        { n: NOTES.A3, d: 0.80, v: 0.11 },
        { n: NOTES.D4, d: 0.80, v: 0.13 },
        { n: NOTES.F4, d: 0.80, v: 0.13 },
        { n: NOTES.E4, d: 0.80, v: 0.12 },
        { n: NOTES.D4, d: 0.80, v: 0.12 },
        { n: NOTES.C4, d: 0.80, v: 0.11 },
        { n: NOTES.D4, d: 2.40, v: 0.15 },
      ],
      // Phrase 4: The High Music Box Echo
      [
        { n: NOTES.D5, d: 1.10, v: 0.15 },
        { n: NOTES.C5, d: 0.85, v: 0.13 },
        { n: NOTES.Bb4, d: 0.85, v: 0.12 },
        { n: NOTES.A4, d: 1.20, v: 0.14 },
        { n: NOTES.F4, d: 0.85, v: 0.12 },
        { n: NOTES.E4, d: 0.85, v: 0.11 },
        { n: NOTES.D4, d: 2.50, v: 0.14 },
      ],
    ],
  },

  // Cradle: Soft, tender lullaby echoing through ancient stones
  cradle: {
    subFreq: NOTES.D1,
    padChord: [NOTES.D2, NOTES.A2, NOTES.F3],
    filterCutoff: 360,
    pauseBetweenPhrases: 3.5,
    phrases: [
      [
        { n: NOTES.D4, d: 0.9, v: 0.11 },
        { n: NOTES.F4, d: 0.9, v: 0.12 },
        { n: NOTES.A4, d: 1.4, v: 0.13 },
        { n: NOTES.G4, d: 0.8, v: 0.10 },
        { n: NOTES.F4, d: 0.8, v: 0.10 },
        { n: NOTES.E4, d: 1.8, v: 0.11 },
      ],
      [
        { n: NOTES.A3, d: 0.9, v: 0.10 },
        { n: NOTES.D4, d: 0.9, v: 0.11 },
        { n: NOTES.E4, d: 0.9, v: 0.10 },
        { n: NOTES.F4, d: 1.4, v: 0.12 },
        { n: NOTES.D4, d: 2.2, v: 0.13 },
      ],
    ],
  },

  // Rootway: Dark organic canopy, wandering bell arpeggios in A Minor
  rootway: {
    subFreq: NOTES.A1,
    padChord: [NOTES.A2, NOTES.E3, NOTES.C4],
    filterCutoff: 390,
    pauseBetweenPhrases: 3.0,
    phrases: [
      [
        { n: NOTES.A4, d: 0.8, v: 0.11 },
        { n: NOTES.C5, d: 0.8, v: 0.12 },
        { n: NOTES.E5, d: 1.2, v: 0.13 },
        { n: NOTES.D5, d: 0.7, v: 0.11 },
        { n: NOTES.C5, d: 0.7, v: 0.10 },
        { n: NOTES.B4, d: 0.8, v: 0.10 },
        { n: NOTES.A4, d: 2.0, v: 0.12 },
      ],
      [
        { n: NOTES.E4, d: 0.8, v: 0.10 },
        { n: NOTES.G4, d: 0.8, v: 0.11 },
        { n: NOTES.A4, d: 0.8, v: 0.11 },
        { n: NOTES.B4, d: 0.8, v: 0.11 },
        { n: NOTES.C5, d: 1.2, v: 0.13 },
        { n: NOTES.A4, d: 2.2, v: 0.12 },
      ],
    ],
  },

  // Sporefall: Ethereal glowing glockenspiel in E Minor
  sporefall: {
    subFreq: NOTES.E1,
    padChord: [NOTES.E2, NOTES.B2, NOTES.G3],
    filterCutoff: 440,
    pauseBetweenPhrases: 2.8,
    phrases: [
      [
        { n: NOTES.E5, d: 0.7, v: 0.10 },
        { n: NOTES.G5, d: 0.7, v: 0.11 },
        { n: NOTES.B5, d: 1.1, v: 0.12 },
        { n: NOTES.A5, d: 0.6, v: 0.10 },
        { n: NOTES.G5, d: 0.6, v: 0.09 },
        { n: NOTES.Fs5, d: 0.8, v: 0.10 },
        { n: NOTES.E5, d: 1.9, v: 0.11 },
      ],
      [
        { n: NOTES.B4, d: 0.8, v: 0.09 },
        { n: NOTES.D5, d: 0.8, v: 0.10 },
        { n: NOTES.E5, d: 0.8, v: 0.11 },
        { n: NOTES.G5, d: 1.2, v: 0.12 },
        { n: NOTES.Fs5, d: 0.8, v: 0.10 },
        { n: NOTES.E5, d: 2.1, v: 0.12 },
      ],
    ],
  },

  // Cistern: Deep flooded chambers, resonant glass bells in F Minor
  cistern: {
    subFreq: NOTES.F1,
    padChord: [NOTES.F2, NOTES.C3, NOTES.Ab3],
    filterCutoff: 340,
    pauseBetweenPhrases: 3.4,
    phrases: [
      [
        { n: NOTES.F4, d: 0.9, v: 0.11 },
        { n: NOTES.Ab4, d: 0.9, v: 0.12 },
        { n: NOTES.C5, d: 1.4, v: 0.13 },
        { n: NOTES.Bb4, d: 0.8, v: 0.10 },
        { n: NOTES.Ab4, d: 0.8, v: 0.10 },
        { n: NOTES.G4, d: 0.9, v: 0.10 },
        { n: NOTES.F4, d: 2.3, v: 0.12 },
      ],
      [
        { n: NOTES.C4, d: 0.9, v: 0.10 },
        { n: NOTES.F4, d: 0.9, v: 0.11 },
        { n: NOTES.Ab4, d: 0.9, v: 0.11 },
        { n: NOTES.Bb4, d: 1.3, v: 0.12 },
        { n: NOTES.C5, d: 1.1, v: 0.13 },
        { n: NOTES.F4, d: 2.4, v: 0.12 },
      ],
    ],
  },

  // Ember: Smoldering subterranean furnace, dark cello drone in C Minor
  ember: {
    subFreq: NOTES.C1,
    padChord: [NOTES.C2, NOTES.G2, NOTES.Eb3],
    filterCutoff: 370,
    pauseBetweenPhrases: 3.2,
    phrases: [
      [
        { n: NOTES.C4, d: 0.85, v: 0.11 },
        { n: NOTES.Eb4, d: 0.85, v: 0.12 },
        { n: NOTES.G4, d: 1.30, v: 0.13 },
        { n: NOTES.F4, d: 0.70, v: 0.10 },
        { n: NOTES.Eb4, d: 0.70, v: 0.10 },
        { n: NOTES.D4, d: 0.85, v: 0.10 },
        { n: NOTES.C4, d: 2.20, v: 0.12 },
      ],
      [
        { n: NOTES.G3, d: 0.90, v: 0.09 },
        { n: NOTES.C4, d: 0.90, v: 0.11 },
        { n: NOTES.D4, d: 0.90, v: 0.10 },
        { n: NOTES.Eb4, d: 1.30, v: 0.12 },
        { n: NOTES.G4, d: 0.90, v: 0.11 },
        { n: NOTES.C4, d: 2.40, v: 0.12 },
      ],
    ],
  },

  // Reliquary & Vault: Ancient sanctum, sacred bell chimes
  reliquary: {
    subFreq: NOTES.Bb1,
    padChord: [NOTES.Bb2, NOTES.F3, NOTES.D4],
    filterCutoff: 410,
    pauseBetweenPhrases: 3.0,
    phrases: [
      [
        { n: NOTES.Bb4, d: 0.85, v: 0.11 },
        { n: NOTES.D5, d: 0.85, v: 0.12 },
        { n: NOTES.F5, d: 1.30, v: 0.13 },
        { n: NOTES.Eb5, d: 0.75, v: 0.10 },
        { n: NOTES.D5, d: 0.75, v: 0.10 },
        { n: NOTES.C5, d: 0.85, v: 0.10 },
        { n: NOTES.Bb4, d: 2.20, v: 0.12 },
      ],
    ],
  },

  // Choir: Solemn, beautiful choral prayer in G Minor
  choir: {
    subFreq: NOTES.G1,
    padChord: [NOTES.G2, NOTES.D3, NOTES.Bb3, NOTES.D4],
    filterCutoff: 380,
    pauseBetweenPhrases: 2.9,
    phrases: [
      [
        { n: NOTES.G4, d: 0.90, v: 0.11 },
        { n: NOTES.Bb4, d: 0.90, v: 0.12 },
        { n: NOTES.D5, d: 1.40, v: 0.14 },
        { n: NOTES.C5, d: 0.75, v: 0.11 },
        { n: NOTES.Bb4, d: 0.75, v: 0.10 },
        { n: NOTES.A4, d: 0.90, v: 0.10 },
        { n: NOTES.G4, d: 2.40, v: 0.13 },
      ],
    ],
  },

  // Boss: Ominous driving tension, heavy cinematic pulse with striking bells
  boss: {
    subFreq: NOTES.D1,
    padChord: [NOTES.D2, NOTES.A2, NOTES.Eb3],
    filterCutoff: 520,
    pauseBetweenPhrases: 1.5,
    phrases: [
      [
        { n: NOTES.D3, d: 0.45, v: 0.15 },
        { n: NOTES.F3, d: 0.45, v: 0.14 },
        { n: NOTES.Ab3, d: 0.45, v: 0.14 },
        { n: NOTES.A3, d: 0.90, v: 0.16 },
        { n: NOTES.D4, d: 0.45, v: 0.16 },
        { n: NOTES.Eb4, d: 0.45, v: 0.15 },
        { n: NOTES.D4, d: 1.20, v: 0.16 },
      ],
    ],
  },
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.noiseBuffer = null;

    // Lush cross-feedback delay network nodes (submerged reverb tail)
    this.delayL = null;
    this.delayR = null;
    this.feedbackL = null;
    this.feedbackR = null;
    this.filterL = null;
    this.filterR = null;
    this.reverbGain = null;

    this.vol = { master: 0.8, music: 0.6, sfx: 0.8 };
    this.zone = null;
    this.pad = null;
    this.bossPad = null;
    this.lastSettings = null;
    this.isMuffled = false;

    // Melodic Sequencer State
    this.currentPhraseIdx = 0;
    this.currentNoteIdx = 0;
    this.noteTimer = 0.8;
    this.biomeAmbienceTimer = 2.0;
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
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.buildNoise();
      this.buildReverbDelay();
      this.applySettings(readSettings());
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  // Create lush stereo cross-feedback delay network for cavernous, dreamy Little Nightmares space
  buildReverbDelay() {
    if (!this.ctx || !this.musicGain) return;
    try {
      this.delayL = this.ctx.createDelay(2.0);
      this.delayR = this.ctx.createDelay(2.0);
      this.delayL.delayTime.value = 0.38; // 380ms left echo
      this.delayR.delayTime.value = 0.54; // 540ms right echo

      this.feedbackL = this.ctx.createGain();
      this.feedbackR = this.ctx.createGain();
      this.feedbackL.gain.value = 0.40;
      this.feedbackR.gain.value = 0.40;

      // Lowpass damping filter to naturally darken echoes over time
      this.filterL = this.ctx.createBiquadFilter();
      this.filterR = this.ctx.createBiquadFilter();
      this.filterL.type = 'lowpass';
      this.filterL.frequency.value = 1350;
      this.filterR.type = 'lowpass';
      this.filterR.frequency.value = 1150;

      this.reverbGain = this.ctx.createGain();
      this.reverbGain.gain.value = 0.50;

      // Cross-feedback ping-pong routing
      this.delayL.connect(this.filterL);
      this.filterL.connect(this.feedbackL);
      this.feedbackL.connect(this.delayR);
      this.filterL.connect(this.reverbGain);

      this.delayR.connect(this.filterR);
      this.filterR.connect(this.feedbackR);
      this.feedbackR.connect(this.delayL);
      this.filterR.connect(this.reverbGain);

      this.reverbGain.connect(this.musicGain);
    } catch {
      /* ignore if audio nodes unsupported */
    }
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
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(settings.master, t, 0.08);
    const musicScale = this.isMuffled ? 0.45 : 0.85;
    this.musicGain.gain.setTargetAtTime(settings.music * musicScale, t, 0.08);
    this.sfxGain.gain.setTargetAtTime(settings.sfx, t, 0.05);
  }

  setVolumes(partial) {
    const settings = { ...(this.lastSettings || readSettings()), ...partial };
    this.applySettings(settings);
    writeSettings(settings);
  }

  // Smooth underwater / muffled filter transition when pausing the game
  setMuffled(muffled) {
    if (!this.ctx || !this.musicGain) return;
    if (this.isMuffled === muffled) return;
    this.isMuffled = muffled;
    const now = this.ctx.currentTime;
    const musicVol = this.vol.music * (muffled ? 0.45 : 0.85);
    this.musicGain.gain.setTargetAtTime(musicVol, now, 0.25);

    if (this.pad && this.pad.filter) {
      const targetCutoff = muffled ? 220 : (ZONE_MUSIC[this.zone]?.filterCutoff || 380);
      this.pad.filter.frequency.setTargetAtTime(targetCutoff, now, 0.3);
    }
  }

  // Authentic Little Nightmares Music Box / Celesta Tine Pluck
  playMusicBox(freq, vol = 0.12, dur = 2.4) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    const noteGain = this.ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.linearRampToValueAtTime(vol, now + 0.008);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    // 1. Primary pure fundamental chime (sine)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;

    // 2. Soft detuned triangle for acoustic warmth & chorusing
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq;
    osc2.detune.value = 4.5;
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.32;
    osc2.connect(g2);
    g2.connect(noteGain);

    // 3. Metallic tine ping: inharmonic strike at ~4.18x frequency (Little Nightmares steel chime)
    const chime = this.ctx.createOscillator();
    chime.type = 'sine';
    chime.frequency.value = freq * 4.18;
    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(vol * 0.42, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    chime.connect(chimeGain);
    chimeGain.connect(noteGain);

    // 4. Sub-resonance for wooden music box chassis
    if (freq > 180) {
      const sub = this.ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.value = freq / 2;
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(vol * 0.20, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.min(dur, 1.2));
      sub.connect(subGain);
      subGain.connect(noteGain);
      sub.start(now);
      sub.stop(now + 1.25);
    }

    osc1.connect(noteGain);
    osc1.start(now);
    osc2.start(now);
    chime.start(now);

    const stopTime = now + dur + 0.1;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
    chime.stop(stopTime);

    // Output to direct mix
    noteGain.connect(this.musicGain);

    // Send to lush stereo delay/reverb line
    if (this.delayL && this.delayR) {
      noteGain.connect(this.delayL);
      noteGain.connect(this.delayR);
    }
  }

  startZone(zone) {
    if (!this.init()) return;
    const targetZone = ZONE_MUSIC[zone] ? zone : 'rootway';
    if (this.zone === targetZone && this.pad) return;

    this.zone = targetZone;
    this.stopPad();

    this.currentPhraseIdx = 0;
    this.currentNoteIdx = 0;
    this.noteTimer = 0.8;
    this.biomeAmbienceTimer = 1.5;

    const cfg = ZONE_MUSIC[targetZone] || ZONE_MUSIC.rootway;
    const now = this.ctx.currentTime;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 2.4);
    gain.connect(this.musicGain);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cfg.filterCutoff || 380;
    filter.Q.value = 0.8;
    filter.connect(gain);

    const nodes = [];

    // Warm, breathing minor chord voices
    for (const freq of cfg.padChord) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.22;
      osc.connect(g);
      g.connect(filter);
      osc.start(now);
      nodes.push(osc, g);
    }

    // Deep cinematic sub-bass foundation (32-55 Hz)
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = cfg.subFreq || NOTES.D1;
    const subG = this.ctx.createGain();
    subG.gain.value = 0.24;
    sub.connect(subG);
    subG.connect(filter);
    sub.start(now);
    nodes.push(sub, subG);

    // Slow, organic LFO breathing: opens and closes the lowpass filter like the chest of the hive
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.065; // ~15s breathing cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 110;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);
    nodes.push(lfo, lfoGain);

    // Subtle dark ambient air rumble
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.loop = true;
      const nf = this.ctx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.value = 240;
      nf.Q.value = 1.0;
      const ng = this.ctx.createGain();
      ng.gain.value = 0.018;
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(gain);
      noise.start(now);
      nodes.push(noise, nf, ng);
    }

    this.pad = { gain, filter, nodes, cfg };
  }

  stopPad() {
    if (!this.pad || !this.ctx) return;
    const { gain, nodes } = this.pad;
    const now = this.ctx.currentTime;
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      for (const node of nodes) {
        try {
          if (node.stop) node.stop(now + 1.3);
        } catch {
          /* already stopped */
        }
      }
    } catch {
      /* ignore */
    }
    this.pad = null;
  }

  setBoss(on) {
    if (!this.init()) return;
    if (on && !this.bossPad) {
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.14, now + 1.8);
      gain.connect(this.musicGain);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 240;
      filter.connect(gain);

      // Deep rhythmic pulse
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
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        osc.stop(now + 1.2);
        osc2.stop(now + 1.2);
      } catch {
        /* ignore */
      }
      this.bossPad = null;
    }
  }

  // Update called every game step (supports all modes: title, paused, playing)
  update(dt, mode = 'playing') {
    if (!this.ctx || !this.pad) return;

    // Handle pause mode muffling
    if (mode === 'paused') {
      this.setMuffled(true);
    } else {
      this.setMuffled(false);
    }

    // Melodic sequencer: plays smooth, memorable Little Nightmares melodies
    const cfg = this.pad.cfg;
    if (!cfg || !cfg.phrases || !cfg.phrases.length) return;

    this.noteTimer -= dt;
    if (this.noteTimer <= 0) {
      const phrases = cfg.phrases;
      const currentPhrase = phrases[this.currentPhraseIdx % phrases.length];

      if (this.currentNoteIdx < currentPhrase.length) {
        const item = currentPhrase[this.currentNoteIdx];
        this.playMusicBox(item.n, item.v || 0.12, 2.4);
        this.noteTimer = item.d || 0.8;
        this.currentNoteIdx += 1;
      } else {
        // End of phrase: natural musical breath where echoes hang in the air
        this.noteTimer = cfg.pauseBetweenPhrases || 3.0;
        this.currentNoteIdx = 0;
        this.currentPhraseIdx = (this.currentPhraseIdx + 1) % phrases.length;
      }
    }

    // Dynamic environmental audio accents
    this.biomeAmbienceTimer -= dt;
    if (this.biomeAmbienceTimer <= 0) {
      this.biomeAmbienceTimer = 2.4 + Math.random() * 2.6;
      this.playBiomeAmbience();
    }
  }

  // Subtle acoustic accents harmonized with the world
  playBiomeAmbience() {
    if (!this.ctx || !this.zone) return;
    const now = this.ctx.currentTime;
    const z = this.zone;

    if (z === 'cistern') {
      // Harmonic water droplet ping
      const f = [NOTES.C5, NOTES.F5, NOTES.Ab5, NOTES.C6][Math.floor(Math.random() * 4)];
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.75, now + 0.14);
      g.gain.setValueAtTime(0.022, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc.connect(g);
      g.connect(this.musicGain);
      if (this.delayL) g.connect(this.delayL);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (z === 'sporefall' || z === 'rootway') {
      // Distant insect hum or woodwind breath
      if (Math.random() < 0.4) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const baseF = 1600 + Math.random() * 400;
        osc.frequency.setValueAtTime(baseF, now);
        osc.frequency.exponentialRampToValueAtTime(baseF * 1.15, now + 0.08);
        g.gain.setValueAtTime(0.008, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } else if (z === 'ember') {
      // Warm ember hearth crackle
      if (this.noiseBuffer && Math.random() < 0.5) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 900 + Math.random() * 800;
        filter.Q.value = 3.5;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.015, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        src.connect(filter);
        filter.connect(g);
        g.connect(this.musicGain);
        src.start(now);
        src.stop(now + 0.09);
      }
    }
  }

  // Legacy pluck helper (maps to music box chime)
  pluck(freq, dur = 1.4, vol = 0.08) {
    this.playMusicBox(freq, vol, dur);
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
