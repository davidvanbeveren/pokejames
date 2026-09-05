// Headless environment: loads the whole game in Node with a fake DOM/canvas so logic can be linted and play-tested.
// Usage: const { loadGame } = require('./headless'); const W = loadGame(); W.G.tick(10) ...
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

function fakeCtx() {
  const noop = () => {};
  return new Proxy({ createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), measureText: () => ({ width: 0 }) },
    { get: (t, k) => (k in t ? t[k] : (typeof k === 'string' ? noop : undefined)), set: () => true });
}
function fakeCanvas() { return { width: 0, height: 0, style: {}, getContext: () => fakeCtx(), addEventListener: () => {}, setAttribute: () => {} }; }

function loadGame(opts) {
  opts = opts || {};
  const store = {};
  const listeners = {};
  const el = (id) => id === 'screen' ? fakeCanvas() : { hidden: false, clientWidth: 800, clientHeight: 600, style: {}, setAttribute: () => {}, classList: { add: () => {}, remove: () => {} } };
  const window = {
    innerWidth: 800, innerHeight: 600, addEventListener: (k, f) => { (listeners[k] = listeners[k] || []).push(f); }, removeEventListener: () => {},
    requestAnimationFrame: () => 0, setInterval: () => 0, setTimeout: (f, ms) => 0, clearInterval: () => {}, performance: { now: () => Date.now() },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    document: { hidden: false, visibilityState: 'visible', getElementById: el, querySelectorAll: () => [], createElement: (t) => t === 'canvas' ? fakeCanvas() : { style: {} }, body: { setAttribute: () => {} }, addEventListener: () => {} },
    console: opts.quiet ? { log: () => {}, warn: (...a) => { (window.__warnings = window.__warnings || []).push(a.join(' ')); }, error: (...a) => { (window.__errors = window.__errors || []).push(a.join(' ')); } } : console,
    Math, JSON, Object, Array, Set, Map, Number, String, Boolean, Date, RegExp, Error, Proxy, Uint8ClampedArray, Symbol, Promise, parseInt, parseFloat, isNaN, isFinite,
    KeyboardEvent: function () {},
  };
  window.window = window; window.self = window; window.globalThis = window;
  window.__warnings = []; window.__errors = [];
  const ctx = vm.createContext(window);
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1].split('?')[0]);
  const loaded = [], missing = [];
  for (const f of files) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) { missing.push(f); continue; }
    try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f }); loaded.push(f); }
    catch (e) { throw new Error(`failed loading ${f}: ${e.stack}`); }
  }
  // fire the load handler (boot)
  for (const f of (listeners.load || [])) f();
  window.__loaded = loaded; window.__missing = missing;
  return window;
}
module.exports = { loadGame, ROOT };
