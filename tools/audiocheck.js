// Self-check for js/audio.js. Loads the engine into a Node vm sandbox with
// a fake `window` and a fake AudioContext (every method the engine calls is
// stubbed), then exercises the full public API:
//   - init() / setEra(0..2) / playMusic(every id) / stopMusic() / sfx(every id)
//   - idempotent playMusic, safe no-ctx path, no thrown exceptions
//   - every song parses to a non-empty note list with all channels the
//     same total length (so the loop point is seamless)
//
// Run with: node tools/audiocheck.js
'use strict';

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const AUDIO_PATH = path.join(__dirname, '..', 'js', 'audio.js');
const SOURCE = fs.readFileSync(AUDIO_PATH, 'utf8');

const EXPECTED_MUSIC = ['title', 'pallet', 'route', 'town2', 'town3', 'wild', 'trainer', 'victory', 'center', 'gym', 'party', 'evolve', 'lab'];
const EXPECTED_SFX = ['select', 'confirm', 'cancel', 'bump', 'door', 'ledge', 'pickup', 'heal', 'levelup', 'save', 'warp', 'exclaim', 'hit', 'charm', 'faint', 'rescue', 'beans', 'cry_bunny', 'cry_chick', 'cry_pig', 'cry_cow', 'cry_sheep', 'cry_goat', 'cry_duck', 'cry_goose', 'cry_turkey', 'cry_pigeon', 'cake', 'text'];

function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

// ---------------------------------------------------------------------
// Fake Web Audio primitives
// ---------------------------------------------------------------------
function makeParam(v) {
  return {
    value: v,
    setValueAtTime: function (val) { this.value = val; return this; },
    linearRampToValueAtTime: function (val) { this.value = val; return this; },
    exponentialRampToValueAtTime: function (val) { this.value = val; return this; },
    cancelScheduledValues: function () { return this; },
    setTargetAtTime: function (val) { this.value = val; return this; }
  };
}
function base() { return { connect: function (dest) { return dest; }, disconnect: function () {} }; }

function createFakeCtx(problems) {
  function osc() {
    var o = Object.assign(base(), {
      type: 'sine',
      frequency: makeParam(440),
      detune: makeParam(0),
      _started: false, _stopped: false,
      setPeriodicWave: function (w) { this._wave = w; },
      start: function () {
        if (this._started) problems.push('oscillator started twice');
        this._started = true;
      },
      stop: function () {
        if (this._stopped) problems.push('oscillator stopped twice');
        this._stopped = true;
      }
    });
    return o;
  }
  function gain() { return Object.assign(base(), { gain: makeParam(1) }); }
  function filt() { return Object.assign(base(), { type: 'lowpass', frequency: makeParam(350), Q: makeParam(1), gain: makeParam(0) }); }
  function bufsrc() { return Object.assign(base(), { buffer: null, start: function () {}, stop: function () {} }); }
  function delayNode() { return Object.assign(base(), { delayTime: makeParam(0) }); }
  function comp() {
    return Object.assign(base(), {
      threshold: makeParam(-24), knee: makeParam(30), ratio: makeParam(12),
      attack: makeParam(0.003), release: makeParam(0.25)
    });
  }

  var ctx = {
    _startMs: Date.now(),
    sampleRate: 44100,
    state: 'suspended',
    destination: base(),
    createGain: gain,
    createOscillator: osc,
    createBiquadFilter: filt,
    createBufferSource: bufsrc,
    createBuffer: function (ch, len, sr) {
      var chans = [];
      for (var i = 0; i < ch; i++) chans.push(new Float32Array(len));
      return { numberOfChannels: ch, length: len, sampleRate: sr, getChannelData: function (i) { return chans[i]; } };
    },
    createDelay: delayNode,
    createPeriodicWave: function (real, imag) { return { real: real, imag: imag }; },
    createDynamicsCompressor: comp,
    resume: function () { this.state = 'running'; return Promise.resolve(); }
  };
  Object.defineProperty(ctx, 'currentTime', { get: function () { return (Date.now() - this._startMs) / 1000; } });
  return ctx;
}

// ---------------------------------------------------------------------
// Sandbox loader
// ---------------------------------------------------------------------
function loadEngine(withAudioContext) {
  var problems = [];
  var consoleErrors = [];
  var consoleWarnings = [];
  var sandbox = {};
  sandbox.window = sandbox;
  sandbox.console = {
    log: function () {},
    warn: function () { consoleWarnings.push(Array.prototype.slice.call(arguments).map(String).join(' ')); },
    error: function () { consoleErrors.push(Array.prototype.slice.call(arguments).map(String).join(' ')); }
  };
  sandbox.Math = Math;
  sandbox.Float32Array = Float32Array;
  sandbox.Object = Object;
  sandbox.Array = Array;
  sandbox.JSON = JSON;
  sandbox.Date = Date;
  sandbox.setInterval = setInterval;
  sandbox.clearInterval = clearInterval;
  sandbox.setTimeout = setTimeout;
  sandbox.clearTimeout = clearTimeout;
  if (withAudioContext) {
    sandbox.window.AudioContext = function () { return createFakeCtx(problems); };
  }
  vm.createContext(sandbox);
  vm.runInContext(SOURCE, sandbox, { filename: 'audio.js' });
  return { sandbox: sandbox, AUDIO: sandbox.window.AUDIO, problems: problems, consoleErrors: consoleErrors, consoleWarnings: consoleWarnings };
}

// ---------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------
async function main() {
  var failures = [];
  var log = [];

  function sameSet(a, b) {
    var as = a.slice().sort(), bs = b.slice().sort();
    return as.length === bs.length && as.every(function (v, i) { return v === bs[i]; });
  }

  // ---- 1. Data validation: ids present, every song's channels line up ----
  var d = loadEngine(false);
  if (!d.AUDIO) { failures.push('window.AUDIO was not defined after loading audio.js'); }
  else {
    var musicIds = d.AUDIO.musicIds();
    var sfxIds = d.AUDIO.sfxIds();
    if (!sameSet(musicIds, EXPECTED_MUSIC)) failures.push('musicIds() mismatch. got=' + JSON.stringify(musicIds.sort()) + ' expected=' + JSON.stringify(EXPECTED_MUSIC.slice().sort()));
    if (!sameSet(sfxIds, EXPECTED_SFX)) failures.push('sfxIds() mismatch. got=' + JSON.stringify(sfxIds.sort()) + ' expected=' + JSON.stringify(EXPECTED_SFX.slice().sort()));

    musicIds.forEach(function (id) {
      var info = d.AUDIO._songChannelBeats(id);
      if (!info || !info.loop) { failures.push('song "' + id + '": _songChannelBeats returned no loop data'); return; }
      function checkSection(name, sec) {
        var entries = Object.keys(sec).map(function (k) { return [k, sec[k]]; });
        var nums = entries.map(function (e) { return e[1]; });
        if (!nums.every(function (n) { return n > 0; })) {
          failures.push('song "' + id + '" section ' + name + ': a channel parsed to zero/empty notes: ' + JSON.stringify(sec));
          return;
        }
        var first = nums[0];
        var allEqual = nums.every(function (n) { return Math.abs(n - first) < 1e-9; });
        if (!allEqual) failures.push('song "' + id + '" section ' + name + ': channel beat totals differ (loop would click): ' + JSON.stringify(sec));
        else log.push('song "' + id + '" ' + name + ': ' + first + ' beats/channel OK');
      }
      checkSection('loop', info.loop);
      if (info.intro) checkSection('intro', info.intro);
    });
  }

  // ---- 2. Safe when AudioContext is unavailable ----
  var n = loadEngine(false);
  try {
    var initResult = n.AUDIO.init();
    if (initResult !== false) failures.push('init() should return a falsy value when AudioContext is unavailable');
    n.AUDIO.setEra(0); n.AUDIO.setEra(1); n.AUDIO.setEra(2); n.AUDIO.setEra(99); n.AUDIO.setEra(-5);
    n.AUDIO.playMusic('title');
    if (n.AUDIO.currentMusic() !== null) failures.push('currentMusic() should be null when AudioContext is unavailable');
    EXPECTED_SFX.forEach(function (id) { n.AUDIO.sfx(id); });
    n.AUDIO.stopMusic(100);
    n.AUDIO.setMuted(true); n.AUDIO.isMuted(); n.AUDIO.setMuted(false);
    n.AUDIO.setVolume(0.5); n.AUDIO.setVolume(2); n.AUDIO.setVolume(-1);
    log.push('no-AudioContext path: all calls safe, no exceptions');
  } catch (e) {
    failures.push('no-AudioContext path threw: ' + (e && e.stack || e));
  }
  if (n.consoleErrors.length) failures.push('no-AudioContext path logged console.error: ' + n.consoleErrors.join(' | '));

  // ---- 3. Also safe calling sfx/playMusic *before* init() with a real fake ctx available ----
  var pre = loadEngine(true);
  try {
    pre.AUDIO.sfx('select');
    pre.AUDIO.playMusic('pallet');
    if (pre.AUDIO.currentMusic() !== 'pallet') failures.push('playMusic before explicit init() should still lazily create the context and start playback');
    pre.AUDIO.stopMusic(0);
    log.push('lazy-init path (no explicit init() call): OK');
  } catch (e) {
    failures.push('lazy-init path threw: ' + (e && e.stack || e));
  }

  // ---- 4. Full run: init, every era, every song (idempotent + stop), every sfx ----
  var f = loadEngine(true);
  try {
    var ok = f.AUDIO.init();
    if (!ok) failures.push('init() should return a truthy value with a working fake AudioContext');
    f.AUDIO.init(); // must be safe to call repeatedly
    f.AUDIO.init();

    for (var eraIdx = 0; eraIdx < 3; eraIdx++) {
      f.AUDIO.setEra(eraIdx);
      for (var i = 0; i < EXPECTED_MUSIC.length; i++) {
        var id = EXPECTED_MUSIC[i];
        f.AUDIO.playMusic(id);
        f.AUDIO.playMusic(id); // idempotent: same id while playing should be a no-op
        if (f.AUDIO.currentMusic() !== id) failures.push('currentMusic() expected "' + id + '" got "' + f.AUDIO.currentMusic() + '" (era ' + eraIdx + ')');
        await wait(70); // let the lookahead scheduler actually fire and schedule notes
        f.AUDIO.stopMusic(20);
        await wait(40);
        if (f.AUDIO.currentMusic() !== null) failures.push('currentMusic() should be null after stopMusic() for "' + id + '"');
      }
      EXPECTED_SFX.forEach(function (sid) { f.AUDIO.sfx(sid); });
      await wait(30);
    }

    // switching directly from one song to another without an explicit stop
    f.AUDIO.playMusic('route');
    await wait(50);
    f.AUDIO.playMusic('gym');
    if (f.AUDIO.currentMusic() !== 'gym') failures.push('playMusic() should switch songs when a different id is requested');
    await wait(50);
    f.AUDIO.stopMusic(0);

    f.AUDIO.setMuted(true);
    if (!f.AUDIO.isMuted()) failures.push('isMuted() should reflect setMuted(true)');
    f.AUDIO.setMuted(false);
    f.AUDIO.setVolume(0.3);

    log.push('full playback run across eras 0/1/2: no exceptions');
  } catch (e) {
    failures.push('full playback run threw: ' + (e && e.stack || e));
  }
  if (f.problems.length) failures.push('fake-node misuse detected: ' + f.problems.join(' | '));
  if (f.consoleErrors.length) failures.push('console.error during full run: ' + f.consoleErrors.join(' | '));

  // ---------------------------------------------------------------------
  console.log(log.join('\n'));
  console.log('');
  if (failures.length) {
    console.log('FAIL (' + failures.length + ' problem' + (failures.length === 1 ? '' : 's') + ')');
    failures.forEach(function (msg, i) { console.log('  ' + (i + 1) + '. ' + msg); });
    process.exitCode = 1;
  } else {
    console.log('PASS: audio.js — ' + EXPECTED_MUSIC.length + ' songs, ' + EXPECTED_SFX.length + ' sfx, 3 eras, no exceptions, all loops seamless.');
    process.exitCode = 0;
  }
}

main().catch(function (e) {
  console.error('audiocheck.js crashed:', e && e.stack || e);
  process.exitCode = 1;
});
