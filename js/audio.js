// Chiptune Web Audio engine: original music + sfx for a Pokemon-Red-style
// "rescue farm animals with kindness" birthday game. No copied melodies —
// everything below is original, written in the spirit of classic handheld
// RPG soundtracks. Plain script, no modules. Attaches to window.AUDIO.
//
// Every public function is safe to call before init() and safe to call
// when the Web Audio API is unavailable (it just becomes a silent no-op).
(function () {
  'use strict';

  // =====================================================================
  // Small utilities
  // =====================================================================
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  var NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  var noteFreqCache = {};
  // 'C4' -> 261.63 (C4 = MIDI 60, A4 = 440Hz = MIDI 69). Sharps '#' and flats 'b'.
  function noteFreq(name) {
    if (!name) return 0;
    if (noteFreqCache[name] !== undefined) return noteFreqCache[name];
    var m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(name);
    if (!m) { noteFreqCache[name] = 0; return 0; }
    var semis = NOTE_INDEX[m[1].toUpperCase()];
    if (semis === undefined) { noteFreqCache[name] = 0; return 0; }
    if (m[2] === '#') semis += 1; else if (m[2] === 'b') semis -= 1;
    var oct = parseInt(m[3], 10);
    var midi = (oct + 1) * 12 + semis;
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    noteFreqCache[name] = f;
    return f;
  }

  // =====================================================================
  // Tiny pattern parser
  // Tokens are "NAME:DUR" separated by whitespace. NAME is a note like
  // 'C4' / 'F#3' for melodic channels, or a drum letter (K/S/H/C/P) for the
  // drums channel. '-' or 'R' is a rest. DUR is a duration denominator
  // (1=whole,2=half,4=quarter,8=eighth,16=sixteenth,32=thirty-second) as a
  // fraction of a 4/4 bar (quarter note = 1 beat); an optional trailing '.'
  // dots the duration (x1.5). A channel pattern may be given as one string
  // or an array of bar-strings (joined with spaces) for readability.
  // =====================================================================
  function parseTrack(src) {
    if (!src) return [];
    var s = Array.isArray(src) ? src.join(' ') : src;
    var toks = s.trim().split(/\s+/).filter(Boolean);
    var events = [];
    for (var i = 0; i < toks.length; i++) {
      var tok = toks[i];
      var ci = tok.indexOf(':');
      var nm = ci === -1 ? tok : tok.slice(0, ci);
      var durTok = ci === -1 ? '4' : tok.slice(ci + 1);
      var dotted = false;
      if (durTok.charAt(durTok.length - 1) === '.') { dotted = true; durTok = durTok.slice(0, -1); }
      var denom = parseFloat(durTok);
      if (!denom || denom <= 0) denom = 4;
      var beats = (4 / denom) * (dotted ? 1.5 : 1);
      var isRest = (nm === '-' || nm === 'R' || nm === '' || nm === '.');
      events.push({ note: isRest ? null : nm, beats: beats });
    }
    return events;
  }

  function totalBeats(events) {
    var t = 0;
    for (var i = 0; i < events.length; i++) t += events[i].beats;
    return t;
  }

  // =====================================================================
  // Engine state
  // =====================================================================
  var BASE_MASTER = 0.15;
  var SCHEDULE_AHEAD = 0.1;   // seconds of lookahead
  var TICK_MS = 25;           // scheduler resolution

  var state = {
    ctx: null,
    masterGain: null, musicBus: null, streamBus: null, sfxBus: null, leadBus: null,
    drumBus: null, padBus: null,
    delaySend: null, delayNode: null, delayFeedback: null, delayWet: null,
    noiseBuffer: null,
    era: 0,
    muted: false,
    volume: 1,
    timer: null,
    playing: null,   // { id, bpm, channels: { lead:{events,loopStart,idx,cursor}, ... } }
    currentId: null
  };

  var ERA_CONFIG = [
    // 0: Game Boy (DMG) - 2 pulse + thin triangle bass + noise. Plain, boxy.
    { leadDuty: 0.50, harmDuty: 0.25, filterHz: 4600, gain: 1.00, drumBright: 0.55, pad: false },
    // 1: Game Boy Color - same 4 native channels, brighter duty cycles/filter.
    { leadDuty: 0.25, harmDuty: 0.125, filterHz: 8200, gain: 1.05, drumBright: 0.80, pad: false },
    // 2: GBA - fuller: brighter still + soft pad/chord layer + delay + richer drums.
    { leadDuty: 0.25, harmDuty: 0.50, filterHz: 12000, gain: 1.12, drumBright: 1.00, pad: true }
  ];

  // =====================================================================
  // AudioContext lifecycle
  // =====================================================================
  function ensureCtx() {
    if (state.ctx) {
      if (state.ctx.state === 'suspended' && typeof state.ctx.resume === 'function') {
        try { state.ctx.resume(); } catch (e) { /* ignore */ }
      }
      return state.ctx;
    }
    var Ctor = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
    if (!Ctor) return null;
    var ctx;
    try { ctx = new Ctor(); } catch (e) { return null; }
    try {
      buildGraph(ctx);
    } catch (e) {
      try { console.warn('AUDIO: graph build failed', e); } catch (e2) {}
      return null;
    }
    state.ctx = ctx;
    applyVolume();
    applyEraToGraph();
    return ctx;
  }

  function buildGraph(ctx) {
    var master = ctx.createGain(); master.gain.value = BASE_MASTER;
    var comp = null;
    try { comp = ctx.createDynamicsCompressor(); } catch (e) { comp = null; }
    if (comp) {
      try {
        setParam(comp.threshold, -16); setParam(comp.knee, 8); setParam(comp.ratio, 3);
        setParam(comp.attack, 0.003); setParam(comp.release, 0.25);
      } catch (e) {}
      master.connect(comp);
      comp.connect(ctx.destination);
    } else {
      master.connect(ctx.destination);
    }

    var musicBus = ctx.createGain(); musicBus.gain.value = 1;
    var sfxBus = ctx.createGain(); sfxBus.gain.value = 1;
    musicBus.connect(master);
    sfxBus.connect(master);

    // Streamed recordings run parallel to the chiptune bus: silencing one must not touch the other.
    var streamBus = ctx.createGain(); streamBus.gain.value = 1;
    streamBus.connect(master);

    var leadBus = ctx.createGain(); leadBus.gain.value = 1;
    leadBus.connect(musicBus);

    var delaySend = ctx.createGain(); delaySend.gain.value = 0;
    leadBus.connect(delaySend);

    var delayNode = null, delayFeedback = null, delayWet = null;
    try { delayNode = ctx.createDelay(1.0); } catch (e) { delayNode = null; }
    if (delayNode) {
      try { delayNode.delayTime.value = 0.19; } catch (e) {}
      delayFeedback = ctx.createGain(); delayFeedback.gain.value = 0.26;
      delayWet = ctx.createGain(); delayWet.gain.value = 0.55;
      delaySend.connect(delayNode);
      delayNode.connect(delayFeedback);
      delayFeedback.connect(delayNode);
      delayNode.connect(delayWet);
      delayWet.connect(musicBus);
    } else {
      // No delay support: fall back to a plain (dry) send.
      delaySend.connect(musicBus);
    }

    var drumBus = ctx.createGain(); drumBus.gain.value = 1;
    drumBus.connect(musicBus);

    var padBus = ctx.createGain(); padBus.gain.value = 1;
    padBus.connect(musicBus);
    padBus.connect(delaySend);

    state.masterGain = master;
    state.musicBus = musicBus;
    state.streamBus = streamBus;
    state.sfxBus = sfxBus;
    state.leadBus = leadBus;
    state.delaySend = delaySend;
    state.delayNode = delayNode;
    state.delayFeedback = delayFeedback;
    state.delayWet = delayWet;
    state.drumBus = drumBus;
    state.padBus = padBus;
  }

  function setParam(param, value, time) {
    if (!param) return;
    try {
      if (time !== undefined && typeof param.setValueAtTime === 'function') param.setValueAtTime(value, time);
      else param.value = value;
    } catch (e) { try { param.value = value; } catch (e2) {} }
  }

  function applyVolume() {
    applyStreamVolume(); // streamed tracks can sit outside masterGain
    if (!state.ctx || !state.masterGain) return;
    var v = state.muted ? 0 : BASE_MASTER * state.volume;
    var now = state.ctx.currentTime;
    try {
      if (typeof state.masterGain.gain.cancelScheduledValues === 'function') state.masterGain.gain.cancelScheduledValues(now);
      setParam(state.masterGain.gain, v, now);
    } catch (e) { setParam(state.masterGain.gain, v); }
  }

  function applyEraToGraph() {
    if (!state.ctx || !state.delaySend) return;
    var cfg = ERA_CONFIG[state.era];
    var now = state.ctx.currentTime;
    var target = cfg.pad ? 0.22 : 0;
    try {
      if (typeof state.delaySend.gain.setTargetAtTime === 'function') state.delaySend.gain.setTargetAtTime(target, now, 0.05);
      else setParam(state.delaySend.gain, target, now);
    } catch (e) { setParam(state.delaySend.gain, target); }
  }

  function getNoiseBuffer(ctx) {
    if (state.noiseBuffer) return state.noiseBuffer;
    var sr = ctx.sampleRate || 44100;
    var len = Math.max(1, Math.floor(sr * 1.0));
    var buffer;
    try { buffer = ctx.createBuffer(1, len, sr); } catch (e) { return null; }
    try {
      var data = buffer.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch (e) {}
    state.noiseBuffer = buffer;
    return buffer;
  }

  // =====================================================================
  // Pulse (duty-cycle) wave cache — one PeriodicWave per duty per context.
  // Falls back to a plain 'square' oscillator if PeriodicWave is unavailable.
  // =====================================================================
  var waveCache = null, waveCacheCtx = null;
  function getPulseWave(ctx, duty) {
    if (waveCacheCtx !== ctx) { waveCache = {}; waveCacheCtx = ctx; }
    var key = 'd' + duty;
    if (waveCache[key]) return waveCache[key];
    if (typeof ctx.createPeriodicWave !== 'function') return null;
    var n = 20;
    var real = new Float32Array(n + 1);
    var imag = new Float32Array(n + 1);
    for (var k = 1; k <= n; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    var wave = null;
    try { wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false }); } catch (e) {
      try { wave = ctx.createPeriodicWave(real, imag); } catch (e2) { wave = null; }
    }
    waveCache[key] = wave;
    return wave;
  }

  function makePulseOsc(ctx, duty) {
    var osc = ctx.createOscillator();
    var wave = getPulseWave(ctx, duty);
    if (wave) {
      try { osc.setPeriodicWave(wave); return osc; } catch (e) {}
    }
    osc.type = 'square';
    return osc;
  }

  // =====================================================================
  // Core synthesis primitives (shared by music channels and sfx)
  // =====================================================================

  // A gated melodic note: short attack, sustain, quick release before the
  // next note (the "gate" that gives chiptunes their percussive bounce).
  function playToneEvent(bus, freq, time, dur, cfg) {
    if (!freq || !bus || !state.ctx || dur <= 0) return;
    var ctx = state.ctx;
    cfg = cfg || {};
    var osc;
    if (cfg.type === 'pulse') osc = makePulseOsc(ctx, cfg.duty != null ? cfg.duty : 0.5);
    else { osc = ctx.createOscillator(); osc.type = cfg.type || 'triangle'; }
    try { osc.frequency.setValueAtTime(freq, time); } catch (e) { try { osc.frequency.value = freq; } catch (e2) {} }

    var last = osc;
    var filter = null;
    if (cfg.filterHz) {
      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      setParam(filter.frequency, cfg.filterHz, time);
      if (filter.Q) setParam(filter.Q, cfg.q != null ? cfg.q : 0.7);
      last.connect(filter);
      last = filter;
    }

    var g = ctx.createGain();
    var peak = cfg.gain != null ? cfg.gain : 0.2;
    var attack = cfg.attack != null ? cfg.attack : 0.006;
    var gateDur = Math.max(0.02, dur * (cfg.gateRatio != null ? cfg.gateRatio : 0.85));
    var release = cfg.release != null ? cfg.release : Math.max(0.015, gateDur * 0.3);
    var tA = time + attack;
    var tR0 = Math.max(tA, time + gateDur - release);
    var tEnd = time + gateDur;
    try {
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(peak, tA);
      g.gain.setValueAtTime(peak, tR0);
      g.gain.linearRampToValueAtTime(0.0001, tEnd);
    } catch (e) { setParam(g.gain, peak); }

    last.connect(g);
    g.connect(bus);
    try { osc.start(time); osc.stop(tEnd + 0.03); } catch (e) {}
  }

  // A soft detuned triad pad, used only by the GBA (era 2) layer.
  function schedulePad(rootFreq, time, dur) {
    if (!rootFreq || state.era < 2 || !state.ctx || !state.padBus) return;
    var ctx = state.ctx;
    var ratios = [1, Math.pow(2, 7 / 12), 2];
    var detunes = [-5, 4, 7];
    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    setParam(filter.frequency, 1500);
    if (filter.Q) setParam(filter.Q, 0.5);
    var g = ctx.createGain();
    g.connect(filter);
    filter.connect(state.padBus);
    var peak = 0.05, attack = 0.08;
    var release = Math.max(0.05, dur * 0.4);
    var tEnd = time + dur;
    try {
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(peak, time + attack);
      g.gain.setValueAtTime(peak, Math.max(time + attack, tEnd - release));
      g.gain.linearRampToValueAtTime(0.0001, tEnd);
    } catch (e) { setParam(g.gain, peak); }
    for (var i = 0; i < ratios.length; i++) {
      var o = ctx.createOscillator();
      o.type = 'sine';
      try { o.frequency.setValueAtTime(rootFreq * ratios[i], time); } catch (e) {}
      if (o.detune) { try { o.detune.setValueAtTime(detunes[i], time); } catch (e) {} }
      o.connect(g);
      try { o.start(time); o.stop(tEnd + 0.06); } catch (e) {}
    }
  }

  // A filtered burst of noise — the basis of every drum + several sfx.
  function noiseHit(time, dur, opts) {
    if (!state.ctx) return;
    var ctx = state.ctx;
    var buf = getNoiseBuffer(ctx);
    if (!buf) return;
    opts = opts || {};
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var filter = ctx.createBiquadFilter();
    filter.type = opts.filterType || 'highpass';
    setParam(filter.frequency, opts.filterHz != null ? opts.filterHz : 4000, time);
    if (filter.Q && opts.q != null) setParam(filter.Q, opts.q);
    var g = ctx.createGain();
    var peak = opts.gain != null ? opts.gain : 0.25;
    try {
      g.gain.setValueAtTime(peak, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + Math.max(0.02, dur));
    } catch (e) { setParam(g.gain, peak); }
    src.connect(filter); filter.connect(g); g.connect(opts.bus || state.sfxBus);
    try { src.start(time); } catch (e) {}
    try { src.stop(time + dur + 0.06); } catch (e) {}
  }

  // A tone whose pitch glides from f0 to f1 over dur — doors, warps, cries.
  function sweepTone(bus, f0, f1, time, dur, opts) {
    if (!state.ctx || !bus) return;
    var ctx = state.ctx;
    opts = opts || {};
    var osc;
    if (opts.duty != null) osc = makePulseOsc(ctx, opts.duty);
    else { osc = ctx.createOscillator(); osc.type = opts.type || 'sine'; }
    var g = ctx.createGain();
    var peak = opts.gain != null ? opts.gain : 0.22;
    var attack = opts.attack != null ? opts.attack : 0.006;
    try {
      osc.frequency.setValueAtTime(Math.max(1, f0), time);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), time + dur);
    } catch (e) {}
    try {
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(peak, time + attack);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur + attack);
    } catch (e) { setParam(g.gain, peak); }
    osc.connect(g); g.connect(bus);
    try { osc.start(time); osc.stop(time + dur + 0.08); } catch (e) {}
  }

  // A tone with an LFO-driven pitch wobble — sheep/goat/pigeon cries.
  function vibratoTone(bus, freq, time, dur, opts) {
    if (!state.ctx || !bus || !freq) return;
    var ctx = state.ctx;
    opts = opts || {};
    var osc = ctx.createOscillator();
    osc.type = opts.type || 'triangle';
    try { osc.frequency.setValueAtTime(freq, time); } catch (e) {}
    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    try { lfo.frequency.setValueAtTime(opts.rate != null ? opts.rate : 18, time); } catch (e) {}
    var depth = ctx.createGain();
    depth.gain.value = opts.depth != null ? opts.depth : 20;
    lfo.connect(depth);
    try { depth.connect(osc.frequency); } catch (e) {}
    var g = ctx.createGain();
    var peak = opts.gain != null ? opts.gain : 0.2;
    try {
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(peak, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time + dur);
    } catch (e) { setParam(g.gain, peak); }
    osc.connect(g); g.connect(bus);
    try { osc.start(time); lfo.start(time); } catch (e) {}
    try { osc.stop(time + dur + 0.05); lfo.stop(time + dur + 0.05); } catch (e) {}
  }

  // A tone with fast amplitude tremolo — the "buzz" in duck/turkey cries.
  function tremoloTone(bus, freq, time, dur, opts) {
    if (!state.ctx || !bus || !freq) return;
    var ctx = state.ctx;
    opts = opts || {};
    var osc = makePulseOsc(ctx, opts.duty != null ? opts.duty : 0.5);
    try { osc.frequency.setValueAtTime(freq, time); } catch (e) {}
    if (opts.slideTo) { try { osc.frequency.exponentialRampToValueAtTime(opts.slideTo, time + dur); } catch (e) {} }
    var trem = ctx.createOscillator();
    trem.type = 'sine';
    try { trem.frequency.setValueAtTime(opts.rate != null ? opts.rate : 32, time); } catch (e) {}
    var tremDepth = ctx.createGain();
    var peak = opts.gain != null ? opts.gain : 0.2;
    tremDepth.gain.value = peak * 0.6;
    var g = ctx.createGain();
    g.gain.value = peak * 0.4;
    trem.connect(tremDepth);
    try { tremDepth.connect(g.gain); } catch (e) {}
    try {
      g.gain.setValueAtTime(peak * 0.4, time);
    } catch (e) {}
    var env = ctx.createGain();
    try {
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(1, time + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, time + dur);
    } catch (e) { setParam(env.gain, 1); }
    osc.connect(g); g.connect(env); env.connect(bus);
    try { osc.start(time); trem.start(time); } catch (e) {}
    try { osc.stop(time + dur + 0.05); trem.stop(time + dur + 0.05); } catch (e) {}
  }

  // =====================================================================
  // Drums (noise-based, era-brightened)
  // =====================================================================
  function drumKick(time) {
    if (!state.ctx) return;
    var ctx = state.ctx, cfg = ERA_CONFIG[state.era];
    var o = ctx.createOscillator(); o.type = 'sine';
    var g = ctx.createGain();
    try {
      o.frequency.setValueAtTime(150, time);
      o.frequency.exponentialRampToValueAtTime(46, time + 0.09);
    } catch (e) {}
    try {
      g.gain.setValueAtTime(0.001, time);
      g.gain.exponentialRampToValueAtTime(0.55 * cfg.drumBright, time + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    } catch (e) { setParam(g.gain, 0.4 * cfg.drumBright); }
    o.connect(g); g.connect(state.drumBus);
    try { o.start(time); o.stop(time + 0.17); } catch (e) {}
    noiseHit(time, 0.035, { filterType: 'lowpass', filterHz: 900, gain: 0.3 * cfg.drumBright, bus: state.drumBus });
  }
  function drumSnare(time) {
    if (!state.ctx) return;
    var cfg = ERA_CONFIG[state.era];
    noiseHit(time, 0.09, { filterType: 'bandpass', filterHz: 1800, q: 0.9, gain: 0.32 * cfg.drumBright, bus: state.drumBus });
    noiseHit(time, 0.05, { filterType: 'highpass', filterHz: 3500, gain: 0.15 * cfg.drumBright, bus: state.drumBus });
  }
  function drumHat(time) {
    if (!state.ctx) return;
    var cfg = ERA_CONFIG[state.era];
    noiseHit(time, 0.03, { filterType: 'highpass', filterHz: 7500, gain: 0.14 * cfg.drumBright, bus: state.drumBus });
  }
  function drumCrash(time) {
    if (!state.ctx) return;
    if (state.era >= 2) {
      noiseHit(time, 0.4, { filterType: 'highpass', filterHz: 5000, gain: 0.22, bus: state.drumBus });
    } else {
      drumHat(time);
    }
  }
  function drumPerc(time) {
    if (!state.ctx) return;
    var ctx = state.ctx, cfg = ERA_CONFIG[state.era];
    var o = ctx.createOscillator(); o.type = 'triangle';
    var g = ctx.createGain();
    try {
      o.frequency.setValueAtTime(220, time);
      o.frequency.exponentialRampToValueAtTime(160, time + 0.08);
    } catch (e) {}
    try {
      g.gain.setValueAtTime(0.001, time);
      g.gain.exponentialRampToValueAtTime(0.28 * cfg.drumBright, time + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    } catch (e) { setParam(g.gain, 0.2 * cfg.drumBright); }
    o.connect(g); g.connect(state.drumBus);
    try { o.start(time); o.stop(time + 0.14); } catch (e) {}
  }
  function scheduleDrumEvent(letter, time) {
    switch (letter) {
      case 'K': drumKick(time); break;
      case 'S': drumSnare(time); break;
      case 'H': drumHat(time); break;
      case 'C': drumCrash(time); break;
      case 'P': drumPerc(time); break;
    }
  }

  // =====================================================================
  // Music channel role -> synthesis
  // =====================================================================
  function scheduleLeadEvent(note, time, dur) {
    var cfg = ERA_CONFIG[state.era];
    playToneEvent(state.leadBus, noteFreq(note), time, dur, {
      type: 'pulse', duty: cfg.leadDuty, gain: 0.22 * cfg.gain, filterHz: cfg.filterHz, gateRatio: 0.85
    });
  }
  function scheduleHarmEvent(note, time, dur) {
    var cfg = ERA_CONFIG[state.era];
    playToneEvent(state.musicBus, noteFreq(note), time, dur, {
      type: 'pulse', duty: cfg.harmDuty, gain: 0.13 * cfg.gain, filterHz: cfg.filterHz * 0.75, gateRatio: 0.78
    });
  }
  function scheduleBassEvent(note, time, dur) {
    var cfg = ERA_CONFIG[state.era];
    var f = noteFreq(note);
    playToneEvent(state.musicBus, f, time, dur, {
      type: 'triangle', gain: 0.20 * cfg.gain, filterHz: Math.min(cfg.filterHz, 2600), gateRatio: 0.92
    });
    if (f) schedulePad(f, time, dur);
  }
  function scheduleDrumsEvent(note, time) {
    scheduleDrumEvent(note, time);
  }
  var ROLE_FN = { lead: scheduleLeadEvent, harm: scheduleHarmEvent, bass: scheduleBassEvent, drums: scheduleDrumsEvent };
  var CHANNEL_KEYS = ['lead', 'harm', 'bass', 'drums'];

  // =====================================================================
  // Song data
  // Each song lists 4 channels: lead (pulse melody), harm (pulse
  // counter/harmony), bass (triangle), drums (noise letters:
  // K=kick S=snare H=hat C=crash P=perc -=rest). All 4/4. 'title' also has
  // a one-shot intro that plays before the loop begins. Every channel
  // within a section (intro / loop) sums to the same number of beats so
  // the loop point is seamless — see tools/audiocheck.js.
  // =====================================================================
  var SONGS = {

    // ---- title: C major, 132 bpm. Bright heroic fanfare, then an upbeat loop. ----
    title: {
      bpm: 132,
      intro: {
        lead: ['C5:4 E5:4 G5:4 C6:4', 'G5:8 G5:8 A5:8 G5:8 E5:4 D5:4'],
        harm: ['E4:4 G4:4 C5:4 E5:4', 'C4:2 C4:2'],
        bass: ['C3:2 C3:2', 'G2:2 G2:2'],
        drums: ['K:4 -:4 K:4 S:4', 'C:4 H:8 H:8 H:4 H:8 H:8']
      },
      loop: {
        lead: [
          'C5:8 E5:8 G5:8 E5:8 C5:4 E5:4', 'B4:8 D5:8 G5:8 D5:8 B4:4 G4:4',
          'A4:8 C5:8 E5:8 C5:8 A4:4 E4:4', 'F4:8 A4:8 C5:8 A4:8 F4:4 C5:4',
          'C5:4 G5:4 E5:4 C5:4', 'D5:4 G5:4 B4:4 G4:4',
          'E5:4 C5:4 A4:4 E4:4', 'F4:8 G4:8 A4:8 C5:8 D5:4 C5:4'
        ],
        harm: [
          '-:8 E4:8 -:8 G4:8 -:8 E4:8 -:8 C4:8', '-:8 D4:8 -:8 G4:8 -:8 D4:8 -:8 B3:8',
          '-:8 C4:8 -:8 E4:8 -:8 C4:8 -:8 A3:8', '-:8 A3:8 -:8 C4:8 -:8 A3:8 -:8 F3:8',
          '-:8 E4:8 -:8 G4:8 -:8 E4:8 -:8 C4:8', '-:8 D4:8 -:8 G4:8 -:8 D4:8 -:8 B3:8',
          '-:8 C4:8 -:8 E4:8 -:8 C4:8 -:8 A3:8', '-:8 A3:8 -:8 C4:8 -:8 A3:8 -:8 F3:8'
        ],
        bass: [
          'C3:2 C3:2', 'G2:2 G2:2', 'A2:2 A2:2', 'F2:2 F2:2',
          'C3:4 C3:4 E3:4 G3:4', 'G2:4 B2:4 D3:4 G2:4', 'A2:4 C3:4 E3:4 A2:4', 'F2:4 F2:4 G2:4 G2:4'
        ],
        drums: [
          'C:4 H:8 H:8 K:4 S:4', 'K:8 H:8 S:8 H:8 K:8 H:8 S:8 H:8', 'K:8 H:8 S:8 H:8 K:8 H:8 S:8 H:8', 'K:8 H:8 S:8 H:8 K:8 H:8 S:8 H:8',
          'C:4 H:8 H:8 K:4 S:4', 'K:8 H:8 S:8 H:8 K:8 H:8 S:8 H:8', 'K:8 H:8 S:8 H:8 K:8 H:8 S:8 H:8', 'K:8 H:8 S:8 H:8 K:8 K:8 S:4'
        ]
      }
    },

    // ---- pallet: F major, ~100 bpm. Gentle homely arpeggios. ----
    pallet: {
      bpm: 100,
      loop: {
        lead: [
          'F4:8 A4:8 C5:8 F5:8 C5:8 A4:8 F4:8 A4:8', 'D4:8 F4:8 A4:8 D5:8 A4:8 F4:8 D4:8 F4:8',
          'Bb3:8 D4:8 F4:8 Bb4:8 F4:8 D4:8 Bb3:8 D4:8', 'C4:8 E4:8 G4:8 C5:8 G4:8 E4:8 C4:8 E4:8',
          'F4:4 A4:4 C5:4 F5:4', 'Bb3:4 D4:4 F4:4 Bb4:4',
          'C4:4 E4:4 G4:4 C5:4', 'C5:4 A4:4 F4:2'
        ],
        harm: [
          '-:8 A4:8 -:8 C5:8 -:8 A4:8 -:8 F4:8', '-:8 F4:8 -:8 A4:8 -:8 F4:8 -:8 D4:8',
          '-:8 D4:8 -:8 F4:8 -:8 D4:8 -:8 Bb3:8', '-:8 E4:8 -:8 G4:8 -:8 E4:8 -:8 C4:8',
          '-:8 A4:8 -:8 C5:8 -:8 A4:8 -:8 F4:8', '-:8 D4:8 -:8 F4:8 -:8 D4:8 -:8 Bb3:8',
          '-:8 E4:8 -:8 G4:8 -:8 E4:8 -:8 C4:8', '-:8 C5:8 -:8 A4:8 -:2'
        ],
        bass: [
          'F2:2 F2:2', 'D2:2 D2:2', 'Bb1:2 Bb1:2', 'C2:2 C2:2',
          'F2:2 C3:2', 'Bb1:2 F2:2', 'C2:2 G2:2', 'F2:1'
        ],
        drums: [
          'K:4 -:8 H:8 -:4 H:8 H:8', 'K:4 -:8 H:8 -:4 H:8 H:8', 'K:4 -:8 H:8 -:4 H:8 H:8', 'K:4 -:8 H:8 -:4 H:8 H:8',
          'K:4 -:8 H:8 -:4 H:8 H:8', 'K:4 -:8 H:8 -:4 H:8 H:8', 'K:4 H:8 H:8 K:4 S:4', '-:1'
        ]
      }
    },

    // ---- route: D major, ~130 bpm. Upbeat marching adventure. ----
    route: {
      bpm: 130,
      loop: {
        lead: [
          'D5:4 D5:4 A4:4 D5:4', 'F#5:4 E5:4 D5:4 A4:4', 'D5:4 D5:4 A4:4 D5:4', 'E5:4 F#5:4 G5:4 F#5:4',
          'G5:4 F#5:4 E5:4 D5:4', 'B4:4 D5:4 F#5:4 A5:4', 'G5:8 F#5:8 E5:8 D5:8 E5:4 F#5:4', 'D5:4 A4:4 D5:2'
        ],
        harm: [
          'A4:4 A4:4 F#4:4 A4:4', 'D5:4 D5:4 A4:4 F#4:4', 'A4:4 A4:4 F#4:4 A4:4', 'A4:4 A4:4 B4:4 A4:4',
          'B4:4 A4:4 G4:4 F#4:4', 'D4:4 F#4:4 A4:4 D5:4', 'D5:4 D5:4 D5:4 D5:4', 'A4:4 F#4:4 D4:2'
        ],
        bass: [
          'D2:4 -:4 D2:4 -:4', 'D2:4 -:4 A1:4 -:4', 'D2:4 -:4 D2:4 -:4', 'E2:4 -:4 E2:4 -:4',
          'G2:4 -:4 G2:4 -:4', 'B1:4 -:4 B1:4 -:4', 'G2:4 -:4 A1:4 -:4', 'D2:4 -:4 D2:2'
        ],
        drums: [
          'K:4 S:4 K:4 S:4', 'K:4 S:4 K:4 S:4', 'K:4 S:4 K:4 S:4', 'K:4 S:4 K:4 S:4',
          'K:4 S:4 K:4 S:4', 'K:4 S:4 K:4 S:4', 'K:8 K:8 S:4 K:4 S:4', 'K:4 S:4 C:2'
        ]
      }
    },

    // ---- town2: Bb major, ~120 bpm. Cheerful bouncy town, slightly jazzy (swung). ----
    town2: {
      bpm: 120,
      loop: {
        lead: [
          'Bb4:4. A4:8 G4:4 F4:4', 'D4:4. Eb4:8 F4:4 G4:4', 'Bb4:4. A4:8 G4:4 F4:4', 'C5:4. Bb4:8 A4:4 G4:4',
          'F4:4. G4:8 A4:4 Bb4:4', 'D5:4. C5:8 Bb4:4 A4:4', 'G4:4. A4:8 Bb4:4 C5:4', 'Bb4:4. A4:8 F4:2'
        ],
        harm: [
          '-:8 D4:8 -:8 F4:8 -:8 D4:8 -:8 F4:8', '-:8 Bb3:8 -:8 D4:8 -:8 Bb3:8 -:8 D4:8',
          '-:8 D4:8 -:8 F4:8 -:8 D4:8 -:8 F4:8', '-:8 Eb4:8 -:8 G4:8 -:8 Eb4:8 -:8 G4:8',
          '-:8 F4:8 -:8 A4:8 -:8 F4:8 -:8 A4:8', '-:8 Bb3:8 -:8 D4:8 -:8 Bb3:8 -:8 D4:8',
          '-:8 D4:8 -:8 F4:8 -:8 D4:8 -:8 F4:8', '-:8 D4:8 -:8 F4:8 -:2'
        ],
        bass: [
          'Bb2:4 -:4 F2:4 -:4', 'G2:4 -:4 D2:4 -:4', 'Bb2:4 -:4 F2:4 -:4', 'Eb2:4 -:4 Bb1:4 -:4',
          'F2:4 -:4 C2:4 -:4', 'G2:4 -:4 D2:4 -:4', 'Eb2:4 -:4 F2:4 -:4', 'Bb1:2 Bb1:2'
        ],
        drums: [
          'K:8 H:8 S:8 H:8 -:8 H:8 S:8 H:8', 'K:8 H:8 S:8 H:8 -:8 H:8 S:8 H:8',
          'K:8 H:8 S:8 H:8 -:8 H:8 S:8 H:8', 'K:8 H:8 S:8 H:8 -:8 H:8 S:8 H:8',
          'K:8 H:8 S:8 H:8 -:8 H:8 S:8 H:8', 'K:8 H:8 S:8 H:8 -:8 H:8 S:8 H:8',
          'K:8 H:8 S:8 H:8 K:8 H:8 S:8 H:8', 'K:4 S:4 K:4 S:4'
        ]
      }
    },

    // ---- town3: A minor -> A major, ~110 bpm. Grander, a little mysterious then hopeful. ----
    town3: {
      bpm: 110,
      loop: {
        lead: [
          'A4:2 E5:2', 'G4:4 A4:4 C5:4 E5:4', 'F4:2 C5:2', 'E4:4 F4:4 G4:4 A4:4',
          'A4:2 E5:2', 'C#5:4 B4:4 A4:4 E5:4', 'F#4:4 A4:4 C#5:4 E5:4', 'A4:4 C#5:4 E5:2'
        ],
        harm: [
          'E4:2 C5:2', 'E4:4 E4:4 E4:4 C5:4', 'A3:2 A4:2', 'C4:4 C4:4 C4:4 C4:4',
          'E4:2 C5:2', 'A4:4 A4:4 A4:4 A4:4', 'A4:4 A4:4 A4:4 A4:4', 'A4:4 A4:4 A4:2'
        ],
        bass: [
          'A2:1', 'F2:1', 'C2:1', 'G2:1',
          'A2:1', 'A2:1', 'D2:1', 'A2:1'
        ],
        drums: [
          '-:1', 'P:4 -:8 -:8 P:4 -:4', '-:1', 'P:4 -:8 -:8 P:4 -:4',
          'K:4 -:4 S:4 -:4', 'K:4 -:4 S:4 -:4', 'K:4 H:8 H:8 S:4 H:8 H:8', 'C:4 H:8 H:8 S:4 K:4'
        ]
      }
    },

    // ---- wild: E minor -> E major, ~150 bpm. Quick, exciting but friendly. ----
    wild: {
      bpm: 150,
      loop: {
        lead: [
          'E5:16 G5:16 B5:16 E6:16 B5:16 G5:16 E5:16 G5:16 E5:8 -:8 -:4',
          'D5:16 F#5:16 A5:16 D6:16 A5:16 F#5:16 D5:16 F#5:16 D5:8 -:8 -:4',
          'C5:16 E5:16 G5:16 C6:16 G5:16 E5:16 C5:16 E5:16 C5:8 -:8 -:4',
          'B4:16 D5:16 F#5:16 B5:16 F#5:16 D5:16 B4:16 D5:16 B4:8 -:8 -:4',
          'E5:16 G#5:16 B5:16 E6:16 B5:16 G#5:16 E5:16 G#5:16 E5:8 -:8 -:4',
          'F#5:16 A5:16 C#6:16 F#6:16 C#6:16 A5:16 F#5:16 A5:16 F#5:8 -:8 -:4',
          'G#5:16 B5:16 D#6:16 G#6:16 D#6:16 B5:16 G#5:16 B5:16 G#5:8 -:8 -:4',
          'E5:8 G#5:8 B5:8 E6:2 -:8'
        ],
        harm: [
          'E4:4 -:4 B4:4 -:4', 'D4:4 -:4 A4:4 -:4', 'C4:4 -:4 G4:4 -:4', 'B3:4 -:4 F#4:4 -:4',
          'E4:4 -:4 B4:4 -:4', 'F#4:4 -:4 C#5:4 -:4', 'G#4:4 -:4 D#5:4 -:4', 'E4:4 B4:4 E5:2'
        ],
        bass: [
          'E2:4 E2:4 B1:4 B1:4', 'D2:4 D2:4 A1:4 A1:4', 'C2:4 C2:4 G1:4 G1:4', 'B1:4 B1:4 F#1:4 F#1:4',
          'E2:4 E2:4 B1:4 B1:4', 'F#2:4 F#2:4 C#2:4 C#2:4', 'G#1:4 G#1:4 D#2:4 D#2:4', 'E2:2 E2:2'
        ],
        drums: [
          'K:16 K:16 H:16 H:16 S:8 H:8 K:8 H:8 -:4', 'K:16 K:16 H:16 H:16 S:8 H:8 K:8 H:8 -:4',
          'K:16 K:16 H:16 H:16 S:8 H:8 K:8 H:8 -:4', 'K:16 K:16 H:16 H:16 S:8 H:8 K:8 H:8 -:4',
          'K:16 K:16 H:16 H:16 S:8 H:8 K:8 H:8 -:4', 'K:16 K:16 H:16 H:16 S:8 H:8 K:8 H:8 -:4',
          'K:16 K:16 H:16 H:16 S:8 H:8 K:8 H:8 -:4', 'K:8 S:8 K:8 S:8 C:2'
        ]
      }
    },

    // ---- trainer: D minor, ~140 bpm. Determined debate-battle theme. ----
    trainer: {
      bpm: 140,
      loop: {
        lead: [
          'D5:8 D5:8 F5:8 D5:8 A5:4 -:4', 'C5:8 C5:8 E5:8 C5:8 A4:4 -:4',
          'Bb4:8 Bb4:8 D5:8 Bb4:8 F5:4 -:4', 'A4:8 A4:8 C5:8 A4:8 E5:4 -:4',
          'D5:8 D5:8 F5:8 D5:8 A5:4 -:4', 'G4:8 G4:8 Bb4:8 G4:8 D5:4 -:4',
          'A4:8 Bb4:8 C5:8 D5:8 E5:8 F5:8 G5:4', 'F5:4 D5:4 A4:4 D5:4'
        ],
        harm: [
          'A4:8 -:8 A4:8 -:8 A4:8 -:8 A4:8 -:8', 'A4:8 -:8 A4:8 -:8 A4:8 -:8 A4:8 -:8',
          'F4:8 -:8 F4:8 -:8 F4:8 -:8 F4:8 -:8', 'E4:8 -:8 E4:8 -:8 E4:8 -:8 E4:8 -:8',
          'A4:8 -:8 A4:8 -:8 A4:8 -:8 A4:8 -:8', 'D4:8 -:8 D4:8 -:8 D4:8 -:8 D4:8 -:8',
          'A4:8 -:8 A4:8 -:8 A4:8 -:8 A4:8 -:8', 'D4:4 D4:4 D4:4 D4:4'
        ],
        bass: [
          'D2:8 D2:8 D2:8 D2:8 D2:8 D2:8 D2:8 D2:8', 'C2:8 C2:8 C2:8 C2:8 C2:8 C2:8 C2:8 C2:8',
          'Bb1:8 Bb1:8 Bb1:8 Bb1:8 Bb1:8 Bb1:8 Bb1:8 Bb1:8', 'A1:8 A1:8 A1:8 A1:8 A1:8 A1:8 A1:8 A1:8',
          'D2:8 D2:8 D2:8 D2:8 D2:8 D2:8 D2:8 D2:8', 'G1:8 G1:8 G1:8 G1:8 G1:8 G1:8 G1:8 G1:8',
          'A1:8 A1:8 A1:8 A1:8 A1:8 A1:8 A1:8 A1:8', 'D2:4 D2:4 D2:4 D2:4'
        ],
        drums: [
          'K:8 H:8 S:8 H:8 K:8 K:8 S:8 H:8', 'K:8 H:8 S:8 H:8 K:8 K:8 S:8 H:8',
          'K:8 H:8 S:8 H:8 K:8 K:8 S:8 H:8', 'K:8 H:8 S:8 H:8 K:8 K:8 S:8 H:8',
          'K:8 H:8 S:8 H:8 K:8 K:8 S:8 H:8', 'K:8 H:8 S:8 H:8 K:8 K:8 S:8 H:8',
          'K:8 H:8 S:8 H:8 K:8 K:8 S:8 H:8', 'K:4 S:4 K:4 S:4'
        ]
      }
    },

    // ---- victory: C major, ~150 bpm. Short triumphant loop. ----
    victory: {
      bpm: 150,
      loop: {
        lead: [
          'C5:8 E5:8 G5:8 C6:8 G5:4 E5:4', 'F5:8 A5:8 C6:8 F6:8 C6:4 A5:4',
          'G5:8 B5:8 D6:8 G6:8 D6:4 B5:4', 'C6:4 G5:4 E5:4 C5:4',
          'C5:8 E5:8 G5:8 C6:8 G5:4 E5:4', 'F5:8 A5:8 C6:8 F6:8 C6:4 A5:4',
          'G5:8 A5:8 B5:8 C6:8 D6:8 E6:8 F6:4', 'E6:4 C6:4 G5:4 C6:4'
        ],
        harm: [
          'E4:4 G4:4 C5:4 E5:4', 'F4:4 A4:4 C5:4 F5:4', 'G4:4 B4:4 D5:4 G5:4', 'C4:4 E4:4 G4:4 C5:4',
          'E4:4 G4:4 C5:4 E5:4', 'F4:4 A4:4 C5:4 F5:4', 'G4:4 B4:4 D5:4 G5:4', 'C4:4 E4:4 G4:2'
        ],
        bass: [
          'C3:2 C3:2', 'F2:2 F2:2', 'G2:2 G2:2', 'C3:2 C3:2',
          'C3:2 C3:2', 'F2:2 F2:2', 'G2:2 G2:2', 'C3:1'
        ],
        drums: [
          'C:4 H:8 H:8 K:4 S:4', 'K:8 H:8 S:8 H:8 K:8 H:8 S:8 H:8', 'K:8 H:8 S:8 H:8 K:8 H:8 S:8 H:8', 'K:4 S:4 K:4 S:4',
          'C:4 H:8 H:8 K:4 S:4', 'K:8 H:8 S:8 H:8 K:8 H:8 S:8 H:8', 'K:8 H:8 S:8 H:8 K:8 K:8 S:4', 'C:1'
        ]
      }
    },

    // ---- center: F major, ~66 bpm. Soft soothing lullaby loop. ----
    center: {
      bpm: 66,
      loop: {
        lead: [
          'F4:2 A4:2', 'C5:2 A4:2', 'Bb4:2 G4:2', 'F4:2 C5:2',
          'A4:2 F4:2', 'G4:2 Bb4:2', 'C5:2 A4:2', 'F4:1'
        ],
        harm: [
          '-:1', 'F4:1', '-:1', 'A4:1',
          '-:1', 'D4:1', '-:1', 'C4:1'
        ],
        bass: [
          'F2:1', 'F2:1', 'Bb1:1', 'F2:1',
          'D2:1', 'Bb1:1', 'C2:1', 'F2:1'
        ],
        drums: [
          '-:1', '-:1', '-:1', '-:1', '-:1', '-:1', '-:1', '-:1'
        ]
      }
    },

    // ---- gym: D minor (phrygian colour), ~120 bpm. Tense dramatic gym-leader theme. ----
    gym: {
      bpm: 120,
      loop: {
        lead: [
          'D5:4 -:8 Eb5:8 D5:4 -:4', 'C5:4 -:8 D5:8 C5:4 -:4',
          'D5:4 -:8 Eb5:8 D5:4 -:4', 'F5:4 -:8 Eb5:8 D5:4 -:4',
          'A4:4 -:8 Bb4:8 A4:4 -:4', 'D5:4 -:8 C5:8 Bb4:4 -:4',
          'A4:8 Bb4:8 C5:8 D5:8 Eb5:4 D5:4', 'D5:4 A4:4 D5:2'
        ],
        harm: [
          'A4:4 -:4 A4:4 -:4', 'F4:4 -:4 F4:4 -:4', 'A4:4 -:4 A4:4 -:4', 'Bb4:4 -:4 A4:4 -:4',
          'F4:4 -:4 F4:4 -:4', 'Bb4:4 -:4 A4:4 -:4', 'F4:4 -:4 F4:4 -:4', 'A4:4 -:4 A4:2'
        ],
        bass: [
          'D2:4 -:4 D2:4 -:4', 'Bb1:4 -:4 Bb1:4 -:4', 'D2:4 -:4 D2:4 -:4', 'Eb2:4 -:4 D2:4 -:4',
          'F1:4 -:4 F1:4 -:4', 'Bb1:4 -:4 A1:4 -:4', 'F1:4 -:4 F1:4 -:4', 'D2:4 -:4 D2:2'
        ],
        drums: [
          'K:4 -:8 S:8 -:4 S:4', 'K:4 -:8 S:8 -:4 S:4', 'K:4 -:8 S:8 -:4 S:4', 'K:4 -:8 S:8 K:4 S:4',
          'K:4 -:8 S:8 -:4 S:4', 'K:4 -:8 S:8 K:4 S:4', 'K:8 K:8 S:8 K:8 S:8 K:8 S:4', 'C:4 S:4 K:4 S:4'
        ]
      }
    },

    // ---- party: G major, ~120 bpm. Joyful birthday-party tune (wholly original). ----
    party: {
      bpm: 120,
      loop: {
        lead: [
          'G4:8 G4:8 A4:4 G4:4 C5:4', 'B4:2 G4:8 G4:8 A4:4',
          'G4:4 D5:4 B4:8 A4:8 G4:4', 'D5:2 -:4 B4:4',
          'G4:8 G4:8 G5:4 E5:4 C5:4', 'B4:2 A4:8 A4:8 G4:4',
          'A4:4 G4:4 D5:4 C5:4', 'B4:2 G4:2'
        ],
        harm: [
          '-:4 D4:4 -:4 D4:4', '-:4 D4:4 -:4 D4:4', '-:4 G4:4 -:4 G4:4', '-:4 D4:4 -:4 D4:4',
          '-:4 B4:4 -:4 C5:4', '-:4 D5:4 -:4 D4:4', '-:4 D4:4 -:4 D4:4', '-:4 D4:4 -:4 D4:4'
        ],
        bass: [
          'G2:2 G2:2', 'D2:2 D2:2', 'G2:2 G2:2', 'D2:2 D2:2',
          'C2:2 C2:2', 'G2:2 D2:2', 'D2:2 G2:2', 'G2:1'
        ],
        drums: [
          'K:4 H:8 H:8 S:4 H:4', 'K:4 H:8 H:8 S:4 H:4', 'K:4 H:8 H:8 S:4 H:4', 'K:4 H:8 H:8 S:4 H:4',
          'K:4 H:8 H:8 S:4 H:4', 'K:4 H:8 H:8 S:4 H:4', 'K:8 K:8 S:4 K:4 S:4', 'C:4 S:4 K:4 S:4'
        ]
      }
    },

    // ---- evolve: C major (building), ~140 bpm. Pulsing rising "growing up" loop. ----
    evolve: {
      bpm: 140,
      loop: {
        lead: [
          'C4:8 C4:8 C4:8 C4:8 C4:8 C4:8 C4:8 C4:8', 'D4:8 D4:8 D4:8 D4:8 D4:8 D4:8 D4:8 D4:8',
          'E4:8 E4:8 E4:8 E4:8 E4:8 E4:8 E4:8 E4:8', 'F4:8 F4:8 F4:8 F4:8 F4:8 F4:8 F4:8 F4:8',
          'G4:8 G4:8 G4:8 G4:8 G4:8 G4:8 G4:8 G4:8', 'A4:8 A4:8 A4:8 A4:8 A4:8 A4:8 A4:8 A4:8',
          'B4:8 B4:8 B4:8 B4:8 C5:8 C5:8 C5:8 C5:8', 'C5:4 E5:4 G5:4 C6:4'
        ],
        harm: [
          'E4:4 -:4 E4:4 -:4', 'F4:4 -:4 F4:4 -:4', 'G4:4 -:4 G4:4 -:4', 'A4:4 -:4 A4:4 -:4',
          'B4:4 -:4 B4:4 -:4', 'C5:4 -:4 C5:4 -:4', 'D5:4 -:4 E5:4 -:4', 'G4:4 C5:4 E5:2'
        ],
        bass: [
          'C2:2 C2:2', 'D2:2 D2:2', 'E2:2 E2:2', 'F2:2 F2:2',
          'G2:2 G2:2', 'A2:2 A2:2', 'B2:2 C3:2', 'C3:1'
        ],
        drums: [
          'K:4 -:4 H:4 -:4', 'K:4 -:4 H:4 -:4', 'K:4 -:4 H:4 -:4', 'K:4 H:4 -:4 H:4',
          'K:4 -:4 H:4 H:4', 'K:4 H:4 -:4 H:4', 'K:4 H:4 S:4 H:4', 'C:4 K:4 S:4 K:4'
        ]
      }
    },

    // ---- lab: C lydian, ~118 bpm. Curious, sciencey, playful. ----
    lab: {
      bpm: 118,
      loop: {
        lead: [
          'C5:8 D5:8 E5:8 F#5:8 G5:8 F#5:8 E5:8 D5:8', 'C5:4 -:8 E5:8 G5:4 -:4',
          'A4:8 B4:8 C5:8 D5:8 E5:8 D5:8 C5:8 B4:8', 'A4:4 -:8 C5:8 E5:4 -:4',
          'C5:8 D5:8 E5:8 F#5:8 G5:8 F#5:8 E5:8 D5:8', 'C5:4 -:8 A4:8 F4:4 -:4',
          'G4:8 A4:8 B4:8 C5:8 D5:8 E5:8 F#5:8 G5:8', 'E5:4 C5:4 G4:2'
        ],
        harm: [
          '-:4 G4:4 -:4 G4:4', '-:4 C4:4 -:4 C4:4', '-:4 E4:4 -:4 E4:4', '-:4 A3:4 -:4 A3:4',
          '-:4 G4:4 -:4 G4:4', '-:4 F4:4 -:4 F4:4', '-:4 D4:4 -:4 D4:4', 'C4:4 G3:4 C4:2'
        ],
        bass: [
          'C2:4 -:4 G2:4 -:4', 'C2:4 -:4 C2:4 -:4', 'A1:4 -:4 E2:4 -:4', 'F1:4 -:4 A1:4 -:4',
          'C2:4 -:4 G2:4 -:4', 'F1:4 -:4 C2:4 -:4', 'G1:4 -:4 D2:4 -:4', 'C2:1'
        ],
        drums: [
          'H:8 -:8 K:8 -:8 H:8 -:8 S:8 -:8', 'H:8 -:8 K:8 -:8 H:8 -:8 S:8 -:8',
          'H:8 -:8 K:8 -:8 H:8 -:8 S:8 -:8', 'H:8 -:8 K:8 -:8 H:8 -:8 S:8 -:8',
          'H:8 -:8 K:8 -:8 H:8 -:8 S:8 -:8', 'H:8 -:8 K:8 -:8 H:8 -:8 S:8 -:8',
          'K:8 H:8 S:8 H:8 K:8 H:8 S:8 H:8', 'K:4 S:4 C:2'
        ]
      }
    }
  };

  var songCache = {};
  function buildSong(id) {
    if (songCache[id]) return songCache[id];
    var def = SONGS[id];
    if (!def) return null;
    var result = { bpm: def.bpm, channels: {} };
    for (var i = 0; i < CHANNEL_KEYS.length; i++) {
      var key = CHANNEL_KEYS[i];
      var introSrc = def.intro && def.intro[key];
      var loopSrc = def.loop && def.loop[key];
      var introEvents = introSrc ? parseTrack(introSrc) : [];
      var loopEvents = parseTrack(loopSrc);
      result.channels[key] = { events: introEvents.concat(loopEvents), loopStart: introEvents.length };
    }
    songCache[id] = result;
    return result;
  }

  // Introspection used by tools/audiocheck.js — pure data, needs no AudioContext.
  function songChannelBeats(id) {
    var def = SONGS[id];
    if (!def) return null;
    function sumSection(section) {
      var out = {};
      for (var i = 0; i < CHANNEL_KEYS.length; i++) {
        var key = CHANNEL_KEYS[i];
        var src = section && section[key];
        out[key] = src ? totalBeats(parseTrack(src)) : 0;
      }
      return out;
    }
    return { intro: def.intro ? sumSection(def.intro) : null, loop: sumSection(def.loop) };
  }

  // =====================================================================
  // Scheduler — lookahead scheduling, no setTimeout-per-note.
  // =====================================================================
  function tick() {
    var ctx = state.ctx;
    if (!ctx || !state.playing) return;
    var secPerBeat = 60 / state.playing.bpm;
    var horizon = ctx.currentTime + SCHEDULE_AHEAD;
    var chans = state.playing.channels;
    for (var i = 0; i < CHANNEL_KEYS.length; i++) {
      var key = CHANNEL_KEYS[i];
      var ch = chans[key];
      if (!ch || !ch.events.length) continue;
      var guard = 0;
      while (ch.cursor < horizon && guard < 64) {
        guard++;
        var ev = ch.events[ch.idx];
        var dur = ev.beats * secPerBeat;
        if (ev.note != null) {
          try {
            var fn = ROLE_FN[key];
            if (fn) fn(ev.note, ch.cursor, dur);
          } catch (e) { try { console.warn('AUDIO: note schedule failed', key, e); } catch (e2) {} }
        }
        ch.cursor += dur;
        ch.idx += 1;
        if (ch.idx >= ch.events.length) ch.idx = ch.loopStart;
      }
    }
  }

  function ensureSchedulerRunning() {
    if (state.timer) return;
    state.timer = setInterval(tick, TICK_MS);
  }
  function clearScheduler() {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
  }

  function resetBusGain(bus, fadeInMs) {
    if (!state.ctx || !bus) return;
    var now = state.ctx.currentTime;
    try {
      if (typeof bus.gain.cancelScheduledValues === 'function') bus.gain.cancelScheduledValues(now);
      if (fadeInMs && fadeInMs > 0) {
        bus.gain.setValueAtTime(0.0001, now);
        bus.gain.linearRampToValueAtTime(1, now + fadeInMs / 1000);
      } else {
        bus.gain.setValueAtTime(1, now);
      }
    } catch (e) { setParam(bus.gain, 1); }
  }

  function fadeBusOut(bus, ms) {
    if (!state.ctx || !bus) return;
    var now = state.ctx.currentTime;
    try {
      var cur = (typeof bus.gain.value === 'number') ? bus.gain.value : 1;
      if (typeof bus.gain.cancelScheduledValues === 'function') bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(cur, now);
      bus.gain.linearRampToValueAtTime(0.0001, now + Math.max(0.01, ms / 1000));
    } catch (e) {}
  }

  function resetMusicBusGain(fadeInMs) { resetBusGain(state.musicBus, fadeInMs); }

  // =====================================================================
  // SFX table — short one-shots, independent of the music scheduler.
  // =====================================================================
  function sfxTone(freq, t, dur, opts) { playToneEvent(state.sfxBus, freq, t, dur, opts); }

  function sfxPickupLikeRun(t, notes, spacing, dur, opts) {
    for (var i = 0; i < notes.length; i++) sfxTone(noteFreq(notes[i]), t + i * spacing, dur, opts);
  }

  function cryDouble(t, f1, f2, dur1, dur2, gap, opts) {
    sfxTone(f1, t, dur1, opts);
    sfxTone(f2, t + gap, dur2, opts);
  }

  var SFX = {
    select: function (t) { sfxTone(noteFreq('E5'), t, 0.055, { type: 'pulse', duty: 0.5, gain: 0.16, attack: 0.002, filterHz: 6500, gateRatio: 0.9 }); },
    confirm: function (t) {
      sfxTone(noteFreq('C5'), t, 0.05, { type: 'pulse', duty: 0.5, gain: 0.17, filterHz: 6500 });
      sfxTone(noteFreq('E5'), t + 0.055, 0.09, { type: 'pulse', duty: 0.5, gain: 0.18, filterHz: 6500 });
    },
    cancel: function (t) {
      sfxTone(noteFreq('E4'), t, 0.06, { type: 'pulse', duty: 0.5, gain: 0.15, filterHz: 4500 });
      sfxTone(noteFreq('C4'), t + 0.06, 0.09, { type: 'pulse', duty: 0.5, gain: 0.15, filterHz: 4500 });
    },
    bump: function (t) {
      sfxTone(noteFreq('A2'), t, 0.09, { type: 'triangle', gain: 0.22, filterHz: 900, attack: 0.001, gateRatio: 0.7 });
      noiseHit(t, 0.05, { filterType: 'lowpass', filterHz: 500, gain: 0.16 });
    },
    door: function (t) { sweepTone(state.sfxBus, 260, 950, t, 0.22, { type: 'square', gain: 0.15 }); },
    ledge: function (t) {
      sfxTone(noteFreq('C3'), t, 0.06, { type: 'triangle', gain: 0.2, gateRatio: 0.8 });
      noiseHit(t + 0.015, 0.04, { filterType: 'bandpass', filterHz: 1200, gain: 0.14 });
    },
    pickup: function (t) { sfxPickupLikeRun(t, ['C5', 'E5', 'G5'], 0.075, 0.09, { type: 'pulse', duty: 0.5, gain: 0.18, filterHz: 6500 }); },
    heal: function (t) { sfxPickupLikeRun(t, ['C6', 'D6', 'E6', 'G6'], 0.12, 0.16, { type: 'sine', gain: 0.16, attack: 0.004, gateRatio: 0.6 }); },
    levelup: function (t) {
      sfxPickupLikeRun(t, ['C5', 'E5', 'G5'], 0.07, 0.09, { type: 'pulse', duty: 0.5, gain: 0.2, filterHz: 7000 });
      sfxTone(noteFreq('C6'), t + 0.21, 0.22, { type: 'pulse', duty: 0.5, gain: 0.22, filterHz: 7000, gateRatio: 0.9 });
    },
    save: function (t) {
      sfxTone(noteFreq('G5'), t, 0.14, { type: 'sine', gain: 0.14, attack: 0.01, gateRatio: 0.7 });
      sfxTone(noteFreq('C6'), t + 0.13, 0.2, { type: 'sine', gain: 0.14, attack: 0.01, gateRatio: 0.75 });
    },
    warp: function (t) {
      sweepTone(state.sfxBus, 850, 210, t, 0.32, { type: 'sine', gain: 0.18 });
      sweepTone(state.sfxBus, 500, 1300, t + 0.03, 0.28, { type: 'triangle', gain: 0.08 });
    },
    exclaim: function (t) {
      sfxTone(noteFreq('C6'), t, 0.09, { type: 'pulse', duty: 0.5, gain: 0.24, filterHz: 8000, attack: 0.001, gateRatio: 0.85 });
      sfxTone(noteFreq('F#6'), t + 0.005, 0.09, { type: 'pulse', duty: 0.5, gain: 0.16, filterHz: 8000, attack: 0.001, gateRatio: 0.85 });
    },
    hit: function (t) {
      noiseHit(t, 0.09, { filterType: 'lowpass', filterHz: 350, gain: 0.18 });
      sfxTone(noteFreq('E2'), t, 0.1, { type: 'triangle', gain: 0.12, gateRatio: 0.6 });
    },
    charm: function (t) {
      sfxPickupLikeRun(t, ['C6', 'D6', 'E6', 'G6', 'A6'], 0.038, 0.05, { type: 'pulse', duty: 0.125, gain: 0.12, filterHz: 9000 });
    },
    faint: function (t) {
      sfxPickupLikeRun(t, ['C5', 'A4', 'F4', 'C4'], 0.13, 0.16, { type: 'triangle', gain: 0.16, gateRatio: 0.8 });
    },
    rescue: function (t) {
      sfxPickupLikeRun(t, ['G4', 'C5', 'E5', 'G5', 'C6'], 0.1, 0.18, { type: 'sine', gain: 0.17, attack: 0.008, gateRatio: 0.85 });
    },
    beans: function (t) {
      tremoloTone(state.sfxBus, noteFreq('E4'), t, 0.15, { rate: 34, gain: 0.16, duty: 0.5 });
      sfxTone(noteFreq('A4'), t + 0.15, 0.07, { type: 'pulse', duty: 0.25, gain: 0.14, filterHz: 5000 });
    },
    cry_bunny: function (t) { sweepTone(state.sfxBus, 1250, 2000, t, 0.07, { type: 'sine', gain: 0.16 }); },
    cry_chick: function (t) { sweepTone(state.sfxBus, 1800, 2400, t, 0.09, { type: 'triangle', gain: 0.15 }); },
    cry_pig: function (t) { cryDouble(t, noteFreq('G2'), noteFreq('E2'), 0.09, 0.1, 0.11, { type: 'pulse', duty: 0.5, gain: 0.24, filterHz: 900 }); },
    cry_cow: function (t) {
      var ctx = state.ctx; if (!ctx) return;
      var o = ctx.createOscillator(); o.type = 'sawtooth';
      var filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; setParam(filt.frequency, 700);
      var g = ctx.createGain();
      try {
        o.frequency.setValueAtTime(130, t);
        o.frequency.linearRampToValueAtTime(98, t + 0.16);
        o.frequency.linearRampToValueAtTime(112, t + 0.5);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.08);
        g.gain.setValueAtTime(0.18, t + 0.38);
        g.gain.linearRampToValueAtTime(0.0001, t + 0.55);
      } catch (e) {}
      o.connect(filt); filt.connect(g); g.connect(state.sfxBus);
      try { o.start(t); o.stop(t + 0.58); } catch (e) {}
    },
    cry_sheep: function (t) { vibratoTone(state.sfxBus, noteFreq('E4'), t, 0.34, { type: 'square', rate: 22, depth: 30, gain: 0.16 }); },
    cry_goat: function (t) { vibratoTone(state.sfxBus, noteFreq('G4'), t, 0.26, { type: 'square', rate: 30, depth: 45, gain: 0.16 }); },
    cry_duck: function (t) { tremoloTone(state.sfxBus, noteFreq('B3'), t, 0.13, { rate: 40, gain: 0.2, duty: 0.5, slideTo: noteFreq('G3') }); },
    cry_goose: function (t) {
      sfxTone(noteFreq('G3'), t, 0.16, { type: 'pulse', duty: 0.5, gain: 0.2, filterHz: 1400, gateRatio: 0.85 });
      sfxTone(noteFreq('D4'), t, 0.16, { type: 'pulse', duty: 0.5, gain: 0.12, filterHz: 1400, gateRatio: 0.85 });
    },
    cry_turkey: function (t) {
      var notes = [0, 0.07, 0.14, 0.2, 0.26];
      for (var i = 0; i < notes.length; i++) tremoloTone(state.sfxBus, noteFreq('F3'), t + notes[i], 0.07, { rate: 28, gain: 0.14, duty: 0.5 });
    },
    cry_pigeon: function (t) {
      vibratoTone(state.sfxBus, noteFreq('D4'), t, 0.16, { type: 'sine', rate: 12, depth: 10, gain: 0.13 });
      vibratoTone(state.sfxBus, noteFreq('C4'), t + 0.22, 0.2, { type: 'sine', rate: 12, depth: 10, gain: 0.13 });
    },
    cake: function (t) {
      noiseHit(t, 0.03, { filterType: 'highpass', filterHz: 3000, gain: 0.12 });
      sweepTone(state.sfxBus, 320, 720, t, 0.13, { duty: 0.5, gain: 0.2 });
      vibratoTone(state.sfxBus, noteFreq('F5'), t + 0.12, 0.16, { type: 'sawtooth', rate: 26, depth: 18, gain: 0.14 });
      sweepTone(state.sfxBus, 700, 480, t + 0.27, 0.12, { duty: 0.5, gain: 0.14 });
    },
    text: function (t) { noiseHit(t, 0.012, { filterType: 'highpass', filterHz: 6500, gain: 0.05 }); }
  };

  // =====================================================================
  // Streamed tracks
  // A few songs are real recordings played from an <audio> element instead of
  // the chiptune scheduler. They are routed through musicBus when Web Audio is
  // available, so mute, volume and the era EQ apply to them like any other song.
  // `trim` is the element volume: the synthesized songs peak well below full
  // scale, so a mastered recording has to be pulled down to sit alongside them.
  // =====================================================================
  // Recordings in audio/, all normalised to -18 LUFS by tools/encode_music.sh, so a
  // single trim covers them. `restart` replays from the top instead of resuming where
  // it paused: right for battle themes, wrong for map themes you keep walking back into.
  // Every id here shadows the synthesized song of the same name, which stays as the
  // fallback for when the recording is missing or fails to load.
  var STREAM_TRIM = 1.0;
  var STREAMS = {
    intro:   { elId: 'bgm-intro',   fallback: 'title' },                   // title screen + PROF. OAT intro
    pallet:  { elId: 'bgm-pallet',  fallback: 'pallet' },                  // Pallet Town and its houses
    lab:     { elId: 'bgm-lab',     fallback: 'lab' },                     // OAT's lab
    route1:  { elId: 'bgm-route1',  fallback: 'route' },                   // Route 1
    route:   { elId: 'bgm-route',   fallback: 'route' },                   // Route 2
    town2:   { elId: 'bgm-town2',   fallback: 'town2' },                   // Verdant Town
    town3:   { elId: 'bgm-town3',   fallback: 'town3' },                   // Violet City
    center:  { elId: 'bgm-center',  fallback: 'center' },                  // SANCTUARY CENTERs
    wild:    { elId: 'bgm-wild',    fallback: 'wild',    restart: true },  // wild encounters
    trainer: { elId: 'bgm-trainer', fallback: 'trainer', restart: true },  // skeptic debates
    rival:   { elId: 'bgm-rival',   fallback: 'trainer', restart: true },  // DAVID turning up
    victory: { elId: 'bgm-victory', fallback: 'victory', restart: true },  // winning one over
    lofi:    { elId: 'bgm-lofi',    fallback: 'title' },                   // LOFI mode: the whole soundtrack
    hurry:   { elId: 'bgm-hurry',   fallback: 'lab' },                     // OAT hurrying you to the lab
    gym:     { elId: 'bgm-gym',     fallback: 'gym',     restart: true },  // the CHEF, gym leader
    gymvictory: { elId: 'bgm-gymvictory', fallback: 'victory', restart: true }  // ...and beating him
  };

  // Recorded one-shots that stand in for the synthesized sfx of the same name.
  // They run through sfxBus, so they obey mute and volume like every other sound.
  var SFX_STREAMS = {
    levelup:  { elId: 'sfx-levelup' },
    rescue:   { elId: 'sfx-obtained' },                    // an animal joins you
    item:     { elId: 'sfx-item', fallback: 'pickup' }     // you find or are given an item
  };
  var streamTrim = function (def) { return def.trim == null ? STREAM_TRIM : def.trim; };
  var streamSrc = {};       // elId -> MediaElementAudioSourceNode (one per element, forever)
  var streamWanted = null;  // id of the streamed track that should be sounding

  function elementFor(def) {
    if (!def || typeof document === 'undefined' || !document.getElementById) return null;
    var el = document.getElementById(def.elId);
    return (el && typeof el.play === 'function') ? el : null;
  }
  function streamElement(id) { return elementFor(STREAMS[id]); }

  // Feed the element through the music bus so it obeys mute, volume and the era EQ.
  function routeStream(el, def, bus) {
    if (streamSrc[def.elId] || !state.ctx || !bus) return;
    if (typeof state.ctx.createMediaElementSource !== 'function') return;
    try {
      var node = state.ctx.createMediaElementSource(el);
      node.connect(bus);
      streamSrc[def.elId] = node;
    } catch (e) { try { console.warn('AUDIO: stream routing failed', e); } catch (e2) {} }
  }

  function applyStreamVolume() {
    var defs = [];
    for (var a in STREAMS) defs.push(STREAMS[a]);
    for (var b in SFX_STREAMS) defs.push(SFX_STREAMS[b]);
    for (var i = 0; i < defs.length; i++) {
      var def = defs[i];
      var el = elementFor(def);
      if (!el) continue;
      // Routed elements are attenuated and muted by masterGain; unrouted ones
      // (no Web Audio at all) have to carry volume and mute themselves.
      var routed = !!streamSrc[def.elId];
      try {
        el.volume = routed ? streamTrim(def) : streamTrim(def) * state.volume;
        el.muted = routed ? false : state.muted;
      } catch (e) {}
    }
  }

  function fallbackSong(id, opts) {
    var fb = STREAMS[id] && STREAMS[id].fallback;
    if (fb) playSong(fb, opts); // not playMusic: a stream can shadow a song of the same id
  }

  function startStreamPlayback(el, id, opts) {
    var def = STREAMS[id];
    routeStream(el, def, state.streamBus);
    resetBusGain(state.streamBus, (opts && opts.fadeInMs) || 250);
    applyStreamVolume();
    var p = null;
    try { el.loop = true; p = el.play(); } catch (e) { p = null; }
    // Autoplay stays blocked until the first user gesture; init() retries there.
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }

  function playStream(id, opts) {
    var el = streamElement(id);
    if (!el || el.error) { fallbackSong(id, opts); return; }
    if (streamWanted === id && !el.paused) return; // idempotent, like the chiptune path
    // The recording may still fail to load; drop back to the synthesized song if it does.
    if (!el.__bgmErrorHooked) {
      el.__bgmErrorHooked = true;
      el.addEventListener('error', function () { if (streamWanted === id) { streamWanted = null; fallbackSong(id); } });
    }
    stopStream(0);  // hard cut: both share streamBus, so a fade here would leave them overlapping
    stopChiptune();
    streamWanted = id;
    state.currentId = id;
    ensureCtx(); // may be null: the element still plays on its own
    if (STREAMS[id].restart) { try { el.currentTime = 0; } catch (e) {} }
    startStreamPlayback(el, id, opts);
  }

  // Retry after a user gesture, for the very common case where autoplay was blocked.
  function resumeStream() {
    if (!streamWanted) return;
    var el = streamElement(streamWanted);
    if (!el || !el.paused) return;
    startStreamPlayback(el, streamWanted);
  }

  function stopStream(fadeMs) {
    if (!streamWanted) return;
    var id = streamWanted, el = streamElement(id);
    streamWanted = null;
    if (!el) return;
    // Pause, don't rewind: coming back from a battle should resume the track.
    var ms = fadeMs == null ? 220 : fadeMs;
    if (ms <= 0 || !state.ctx || !streamSrc[STREAMS[id].elId]) { try { el.pause(); } catch (e) {} return; }
    fadeBusOut(state.streamBus, ms);
    setTimeout(function () {
      if (streamWanted === id) return; // it started again during the fade
      try { el.pause(); } catch (e) {}
    }, ms + 40);
  }

  function playSfxStream(id) {
    var def = SFX_STREAMS[id];
    var el = elementFor(def);
    if (!el || el.error) return false;
    ensureCtx();
    routeStream(el, def, state.sfxBus);
    try {
      el.loop = false;
      el.currentTime = 0;                       // a re-trigger restarts the jingle
      applyStreamVolume();
      var p = el.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    } catch (e) { return false; }
    return true;
  }

  function stopChiptune() {
    if (!state.playing) return;
    state.playing = null;
    clearScheduler();
    fadeBusOut(state.musicBus, 120); // notes are scheduled ahead; mute the bus so they don't ring out
  }

  // =====================================================================
  // Public API
  // =====================================================================
  var AUDIO = window.AUDIO = {};

  AUDIO.init = function () { var ok = !!ensureCtx(); resumeStream(); return ok; };

  AUDIO.setEra = function (n) {
    var e = Math.max(0, Math.min(2, (n | 0)));
    state.era = e;
    applyEraToGraph();
  };

  // LOFI mode swaps the entire soundtrack for one track. Every song routes to the
  // same stream id, so it keeps playing across maps and battles without restarting.
  var lofi = false;
  AUDIO.isLofi = function () { return lofi; };
  AUDIO.setLofi = function (on) {
    lofi = !!on;
    if (lofi) playStream('lofi');
    // turning it off leaves the caller to start whatever should be playing now
  };

  AUDIO.playMusic = function (id, opts) {
    if (lofi && streamElement('lofi')) { playStream('lofi', opts); return; }
    if (STREAMS[id]) { playStream(id, opts); return; }
    playSong(id, opts);
  };

  function playSong(id, opts) {
    var ctx = ensureCtx();
    if (!ctx) return;
    var def = SONGS[id];
    if (!def) return;
    if (state.currentId === id && state.playing) return; // idempotent
    stopStream();
    var built = buildSong(id);
    if (!built) return;
    clearScheduler();
    var startAt = ctx.currentTime + 0.06;
    var channels = {};
    for (var i = 0; i < CHANNEL_KEYS.length; i++) {
      var key = CHANNEL_KEYS[i];
      var cd = built.channels[key];
      channels[key] = { events: cd.events, loopStart: cd.loopStart, idx: 0, cursor: startAt };
    }
    resetMusicBusGain(opts && opts.fadeInMs);
    state.playing = { id: id, bpm: built.bpm, channels: channels };
    state.currentId = id;
    ensureSchedulerRunning();
  }

  AUDIO.stopMusic = function (fadeMs) {
    stopStream();
    if (!state.ctx) { state.playing = null; state.currentId = null; return; }
    var ms = fadeMs != null ? fadeMs : 180;
    var now = state.ctx.currentTime;
    try {
      var g = state.musicBus.gain;
      var cur = (typeof g.value === 'number') ? g.value : 1;
      if (typeof g.cancelScheduledValues === 'function') g.cancelScheduledValues(now);
      g.setValueAtTime(cur, now);
      g.linearRampToValueAtTime(0.0001, now + Math.max(0.01, ms / 1000));
    } catch (e) {}
    state.playing = null;
    state.currentId = null;
    clearScheduler();
  };

  AUDIO.currentMusic = function () { return state.currentId || null; };

  AUDIO.sfx = function (id) {
    if (SFX_STREAMS[id]) { if (playSfxStream(id)) return; id = SFX_STREAMS[id].fallback || id; }
    var ctx = ensureCtx();
    if (!ctx) return;
    var fn = SFX[id];
    if (!fn) return;
    try { fn(ctx.currentTime + 0.001); } catch (e) { try { console.warn('AUDIO: sfx failed', id, e); } catch (e2) {} }
  };

  AUDIO.setMuted = function (b) { state.muted = !!b; applyVolume(); };
  AUDIO.isMuted = function () { return !!state.muted; };
  AUDIO.setVolume = function (v) { state.volume = clamp(v == null ? 1 : v, 0, 1); applyVolume(); };

  // Introspection helpers for tooling (audiocheck.js, audiotest.html).
  AUDIO.musicIds = function () { return Object.keys(SONGS); };
  AUDIO.streamIds = function () { return Object.keys(STREAMS); };
  AUDIO.sfxStreamIds = function () { return Object.keys(SFX_STREAMS); };
  AUDIO.sfxIds = function () { return Object.keys(SFX); };
  AUDIO._songChannelBeats = songChannelBeats;
  AUDIO._nodes = function () { return { master: state.masterGain, music: state.musicBus, stream: state.streamBus, ctx: state.ctx }; };

})();
