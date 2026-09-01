// AudioManager — fully synthesized SFX + ambient underwater bed via the Web Audio
// API, so the game ships with ZERO audio asset files. Shared across all chapters.
//
// Respects SaveManager.soundOn. Must be resumed on first user gesture (browsers
// block audio until then) — call unlock() from a pointerdown.

import SaveManager from './SaveManager.js';

class AudioManagerClass {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambientNodes = null;
    this.unlocked = false;
  }

  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);
  }

  unlock() {
    this._ensure();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    this.unlocked = true;
  }

  get enabled() {
    return SaveManager.soundOn && !!this.ctx;
  }

  toggle() {
    SaveManager.soundOn = !SaveManager.soundOn;
    if (!SaveManager.soundOn) this.stopAmbient();
    return SaveManager.soundOn;
  }

  // --- Low-level tone helper ---
  _tone({ freq = 440, type = 'sine', dur = 0.15, gain = 0.2, slideTo = null, delay = 0 }) {
    if (!this.enabled) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise({ dur = 0.2, gain = 0.15, lp = 1200 }) {
    if (!this.enabled) return;
    const t0 = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lp;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t0);
  }

  // --- Named SFX ---
  swim()    { this._noise({ dur: 0.12, gain: 0.05, lp: 700 }); }
  dash()    { this._tone({ freq: 220, slideTo: 640, type: 'sawtooth', dur: 0.25, gain: 0.18 }); this._noise({ dur: 0.2, gain: 0.08, lp: 1800 }); }
  collect() { this._tone({ freq: 660, slideTo: 990, type: 'triangle', dur: 0.14, gain: 0.2 }); }
  scroll()  { this._tone({ freq: 523, type: 'sine', dur: 0.12, gain: 0.18 }); this._tone({ freq: 784, type: 'sine', dur: 0.18, gain: 0.16, delay: 0.1 }); }
  rescue()  { this._tone({ freq: 440, slideTo: 880, type: 'sine', dur: 0.3, gain: 0.2 }); }
  hit()     { this._tone({ freq: 200, slideTo: 90, type: 'square', dur: 0.22, gain: 0.22 }); this._noise({ dur: 0.15, gain: 0.12, lp: 900 }); }
  enemyDie(){ this._tone({ freq: 300, slideTo: 120, type: 'sawtooth', dur: 0.2, gain: 0.16 }); }
  bossHit() { this._tone({ freq: 140, slideTo: 70, type: 'square', dur: 0.28, gain: 0.24 }); }
  bossRoar(){ this._tone({ freq: 90, slideTo: 55, type: 'sawtooth', dur: 0.7, gain: 0.28 }); this._noise({ dur: 0.6, gain: 0.14, lp: 500 }); }
  win()     { [523, 659, 784, 1047].forEach((f, i) => this._tone({ freq: f, type: 'triangle', dur: 0.35, gain: 0.2, delay: i * 0.14 })); }
  lose()    { [400, 330, 260, 180].forEach((f, i) => this._tone({ freq: f, type: 'sine', dur: 0.3, gain: 0.2, delay: i * 0.16 })); }
  click()   { this._tone({ freq: 520, type: 'square', dur: 0.06, gain: 0.14 }); }

  // --- Ambient underwater bed (slow filtered pad) ---
  startAmbient() {
    if (!this.enabled || this.ambientNodes) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.value = 70;
    osc2.type = 'sine';
    osc2.frequency.value = 105;
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    g.gain.value = 0.05;
    osc.connect(g);
    osc2.connect(g);
    g.connect(lp);
    lp.connect(this.master);
    // Slow swell
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    osc.start();
    osc2.start();
    lfo.start();
    this.ambientNodes = { osc, osc2, lfo, g };
  }

  stopAmbient() {
    if (!this.ambientNodes) return;
    const { osc, osc2, lfo } = this.ambientNodes;
    try { osc.stop(); osc2.stop(); lfo.stop(); } catch (e) { /* already stopped */ }
    this.ambientNodes = null;
  }
}

const AudioManager = new AudioManagerClass();
export default AudioManager;
