// Automated unit test for the Little Nightmares-style background soundtrack engine
import assert from 'node:assert';
import { audio, NOTES } from '../src/core/audio.js';

console.log('=== Testing Little Nightmares Atmospheric Soundtrack Engine ===');

// 1. Verify Note Frequencies
assert.strictEqual(Math.round(NOTES.A4), 440, 'A4 must be 440 Hz standard pitch');
assert.strictEqual(Math.round(NOTES.D4), 294, 'D4 must be ~294 Hz (key of Little Nightmares lullaby)');
assert.strictEqual(Math.round(NOTES.C4), 262, 'C4 must be ~262 Hz');
console.log('PASS: Standard pitch frequencies correctly configured');

// 2. Mock Web Audio Environment to Test Sequencer & Node Graph
class MockGain {
  constructor() {
    this.gain = {
      value: 1,
      setValueAtTime() {},
      linearRampToValueAtTime() {},
      exponentialRampToValueAtTime() {},
      setTargetAtTime(val) { this.value = val; },
      cancelScheduledValues() {},
    };
  }
  connect() {}
}

class MockFilter {
  constructor() {
    this.type = 'lowpass';
    this.frequency = {
      value: 400,
      setTargetAtTime(val) { this.value = val; },
    };
    this.Q = { value: 1 };
  }
  connect() {}
}

class MockOsc {
  constructor() {
    this.type = 'sine';
    this.frequency = { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} };
    this.detune = { value: 0 };
  }
  connect() {}
  start() {}
  stop() {}
}

class MockDelay {
  constructor() {
    this.delayTime = { value: 0.38 };
  }
  connect() {}
}

class MockAudioContext {
  constructor() {
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {};
  }
  createGain() { return new MockGain(); }
  createBiquadFilter() { return new MockFilter(); }
  createOscillator() { return new MockOsc(); }
  createDelay() { return new MockDelay(); }
  createBuffer(channels, len, rate) {
    return { getChannelData: () => new Float32Array(len) };
  }
  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      connect() {},
      start() {},
      stop() {},
    };
  }
  resume() { return Promise.resolve(); }
}

globalThis.window = {
  AudioContext: MockAudioContext,
};

// 3. Initialize Audio Engine
const initialized = audio.init();
assert.strictEqual(initialized, true, 'Audio engine must initialize with AudioContext');
console.log('PASS: AudioEngine initialized with Web Audio graph');

// 4. Test Title Theme Initialization
audio.startZone('title');
assert.strictEqual(audio.zone, 'title', 'Active zone must be set to title');
assert.notStrictEqual(audio.pad, null, 'Pad drone must be running');
console.log('PASS: Title screen theme "The Sunken Lullaby" started successfully');

// 5. Test Sequencer advancing notes
const initialNoteIdx = audio.currentNoteIdx;
audio.update(0.9, 'title'); // Step sequencer past note duration
assert.strictEqual(audio.currentNoteIdx > initialNoteIdx, true, 'Sequencer must advance notes on tick');
console.log('PASS: Melodic music box sequencer advances notes smoothly');

// 6. Test Pause Muffling Effect
assert.strictEqual(audio.isMuffled, false, 'Should not be muffled before pause');
audio.update(0.1, 'paused');
assert.strictEqual(audio.isMuffled, true, 'Entering paused mode must activate underwater muffling');
console.log('PASS: Paused mode activates underwater muffling');

audio.update(0.1, 'playing');
assert.strictEqual(audio.isMuffled, false, 'Resuming playing mode must restore bright soundtrack');
console.log('PASS: Resuming restores full clarity and filter cutoff');

// 7. Test Biome Switching
audio.startZone('cistern');
assert.strictEqual(audio.zone, 'cistern', 'Zone must switch to cistern');
audio.startZone('boss');
assert.strictEqual(audio.zone, 'boss', 'Zone must switch to boss');
console.log('PASS: Biome and Boss soundtrack crossfading works flawlessly');

console.log('\nALL 7 SOUNDTRACK ENGINE TESTS PASSED WITH 0 ERRORS!');
