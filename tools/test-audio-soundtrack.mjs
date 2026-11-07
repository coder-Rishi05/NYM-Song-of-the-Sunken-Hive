// Automated unit test for the Little Nightmares-style background soundtrack and silence-on-stop engine
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { audio } from '../src/core/audio.js';

console.log('=== Testing Little Nightmares BGM Soundtrack & Stop-on-Pause Engine ===');

// 1. Verify Audio Files Exist on Disk
const tracks = [
  'assets/audio/bgm_title.mp3',
  'assets/audio/bgm_ambient.mp3',
  'assets/audio/bgm_cistern.mp3',
];

for (const t of tracks) {
  const p = path.resolve(t);
  assert.strictEqual(fs.existsSync(p), true, `Track file must exist: ${t}`);
  const stat = fs.statSync(p);
  assert.strictEqual(stat.size > 100000, true, `Track file must be valid non-empty audio: ${t} (${stat.size} bytes)`);
  console.log(`PASS: Found audio asset ${t} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
}

// 2. Mock Web Audio & Audio Element Environment
class MockAudio {
  constructor(src) {
    this.src = src;
    this.paused = true;
    this.volume = 1;
    this.loop = false;
    this.currentTime = 0;
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

class MockGain {
  constructor() {
    this.gain = {
      value: 1,
      setValueAtTime() {},
      setTargetAtTime(val) { this.value = val; },
    };
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
  createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  resume() { this.state = 'running'; return Promise.resolve(); }
}

globalThis.window = {
  AudioContext: MockAudioContext,
};
globalThis.Audio = MockAudio;

// 3. Initialize Audio Engine
const initOk = audio.init();
assert.strictEqual(initOk, true, 'Audio engine must initialize in browser window');
console.log('PASS: AudioEngine initialized');

// 4. Test Zone BGM playback
audio.startZone('title');
assert.strictEqual(audio.zone, 'title', 'Active zone must be title');
assert.strictEqual(audio.currentTrackSrc, 'assets/audio/bgm_title.mp3', 'Title BGM must play bgm_title.mp3');
assert.strictEqual(audio.bgmAudio.paused, false, 'BGM audio element must be playing');
console.log('PASS: Title screen starts Little Nightmares music box track (bgm_title.mp3)');

// 5. Test Immediate Silence when Game is Paused or Stopped
audio.update(0.1, 'paused');
assert.strictEqual(audio.isPaused, true, 'isPaused must be true when game is paused');
assert.strictEqual(audio.bgmAudio.paused, true, 'BGM must immediately pause and produce zero sound when paused');
console.log('PASS: Pausing the game immediately stops all BGM playback (complete silence)');

// 6. Test Resuming when Unpaused
audio.update(0.1, 'playing');
assert.strictEqual(audio.isPaused, false, 'isPaused must be false when game resumes');
assert.strictEqual(audio.bgmAudio.paused, false, 'BGM must resume playing when returning to game');
console.log('PASS: Resuming the game resumes BGM playback');

// 7. Test Biome Switching
audio.startZone('rootway');
assert.strictEqual(audio.zone, 'rootway', 'Active zone must switch to rootway');
assert.strictEqual(audio.currentTrackSrc, 'assets/audio/bgm_ambient.mp3', 'Rootway must play bgm_ambient.mp3');

audio.startZone('cistern');
assert.strictEqual(audio.zone, 'cistern', 'Active zone must switch to cistern');
assert.strictEqual(audio.currentTrackSrc, 'assets/audio/bgm_cistern.mp3', 'Cistern must play bgm_cistern.mp3');
console.log('PASS: Biome switching seamlessly transitions between high-quality tracks');

// 8. Test stopBGM
audio.stopBGM();
assert.strictEqual(audio.bgmAudio.paused, true, 'stopBGM must pause audio element');
assert.strictEqual(audio.currentTrackSrc, null, 'stopBGM must clear current track source');
console.log('PASS: stopBGM completely silences and resets audio');

console.log('\nALL 8 BGM TESTS PASSED WITH 0 ERRORS!');
