'use strict';
// Shared helpers and input for the game. Everything is a classic script (no modules), so the
// game runs by double-clicking index.html, offline.

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const smoothstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const dampAngle = (a, b, k, dt) => a + angDiff(a, b) * (1 - Math.exp(-k * dt));
const easeOutBack = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const easeInOut = t => t * t * (3 - 2 * t);
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Compare typed answers: no accents, no case, no punctuation.
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-zß\s]/g, ' ').replace(/\s+/g, ' ').trim();
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
// A language's text from a table like { en, es, pt, de, zh, ja } (strings, arrays, anything). es / pt / de: that language,
// else Spanish (as the files always did). zh / ja: that language when it's there, else the English (fb when given, else
// the table's en): never Spanish (CJK.md). l defaults to the game's language.
function pickLang(T, l, fb) {
  if (T == null) return fb;
  if (l === undefined || l === null) l = (typeof LEX !== 'undefined' && LEX.lang) || 'es';
  const v = T[l];
  if (v !== undefined && v !== null && v !== '') return v;
  if (l === 'zh' || l === 'ja') return fb !== undefined ? fb : T.en;
  return T.es;
}

// ---------------------------------------------------------------- key bindings
// What each key does. WASD moves and the arrow keys turn the camera by default; Settings (in the
// journal) can change any of them. Saved in localStorage (lrpg.keys) with a few camera options.
const KEYS = (() => {
  const DEFAULT = {
    up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'],
    camLeft: ['ArrowLeft'], camRight: ['ArrowRight'], camUp: ['ArrowUp'], camDown: ['ArrowDown'],
    zoomIn: ['Equal'], zoomOut: ['Minus'],
    run: ['ShiftLeft', 'ShiftRight'], jump: ['Space'], interact: ['KeyE', 'Enter'], look: ['KeyQ'], journal: ['Tab', 'KeyJ'],
    save: ['KeyP'],
    phone: ['KeyC'],          // (the phone's chats: js/talk/phone.js)
    cards: ['KeyF'],          // (flashcards from Mimo's words: js/flashcards.js)
    help: ['KeyH'],           // (every key, in a card: js/hud.js; the help bar says «H all keys»)
  };
  const LABEL = {
    up: 'Move forward', down: 'Move back', left: 'Move left', right: 'Move right',
    camLeft: 'Turn the camera left', camRight: 'Turn the camera right', camUp: 'Tilt the camera up', camDown: 'Tilt the camera down',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out',
    run: 'Run', jump: 'Jump', interact: 'Talk · read · use', look: 'Ask Mimo the way', journal: 'Journal & quests',
    save: 'Save the game (Ctrl+S works too)',
    phone: 'Open the phone (your chats)',
    cards: 'Flashcards (Mimo’s words)',
    help: 'Show all the keys',
  };
  const copy = o => JSON.parse(JSON.stringify(o));
  let map = copy(DEFAULT);
  const opts = { invertY: false, camSpeed: 1, minimap: true, bleep: false };     // (bleep: show swear words as f***)
  try {
    const s = JSON.parse(localStorage.getItem('lrpg.keys') || 'null');
    if (s && s.map) for (const a in DEFAULT) if (Array.isArray(s.map[a]) && s.map[a].length) map[a] = s.map[a];     // (actions added since keep their default keys)
    if (s && s.opts) Object.assign(opts, s.opts);
  } catch (e) { /* storage blocked */ }
  const save = () => { try { localStorage.setItem('lrpg.keys', JSON.stringify({ map, opts })); } catch (e) { /* storage blocked */ } };
  const NAMES = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ShiftLeft: 'Shift', ShiftRight: 'R-Shift', ControlLeft: 'Ctrl', ControlRight: 'R-Ctrl',
    AltLeft: 'Alt', AltRight: 'R-Alt', Space: 'Space', Enter: 'Enter', Tab: 'Tab', Equal: '=', Minus: '-', Comma: ',', Period: '.', Slash: '/', Semicolon: ';',
    Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Backquote: '`', Backspace: 'Backspace', CapsLock: 'Caps' };
  return {
    DEFAULT, LABEL, opts, capturing: null,
    get map() { return map; },
    // give an action this key (it leaves any other action it was on; the action keeps one other key)
    set(action, code) { for (const a in map) map[a] = map[a].filter(c => c !== code); map[action] = [code].concat(map[action]).slice(0, 2); save(); },
    reset() { map = copy(DEFAULT); opts.invertY = false; opts.camSpeed = 1; save(); },
    setOpt(k, v) { opts[k] = v; save(); },
    bound(code) { for (const a in map) if (map[a].includes(code)) return true; return false; },
    name(code) { return NAMES[code] || (code.startsWith('Key') ? code.slice(3) : code.startsWith('Digit') ? code.slice(5) : code.startsWith('Numpad') ? 'Num ' + code.slice(6) : code); },
    // the keys of an action, for help text: "E / Enter"
    keys(action) { return (map[action] || []).map(c => this.name(c)).join(' / ') || '—'; },
  };
})();

// ---------------------------------------------------------------- input
// Keyboard (through KEYS), mouse drag (camera) and gamepad. read() is called once per frame;
// "pressed" keys are edges (true only on the frame they went down).
const Input = (() => {
  const down = new Set(), hit = new Set();
  const cam = { x: 0, y: 0, zoom: 0 };
  let typing = false, drag = null, padPrev = [], lastRead = 0;
  const GAME = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];
  let saveHit = false;
  addEventListener('keydown', e => {
    if (KEYS.capturing) return;
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') { e.preventDefault(); if (!typing) saveHit = true; return; }     // (Ctrl+S saves the game, not the page)
    if (typing) return;
    if (!down.has(e.code)) hit.add(e.code);
    down.add(e.code);
    if (GAME.includes(e.code) || (KEYS.bound(e.code) && !e.ctrlKey && !e.metaKey)) e.preventDefault();
  });
  addEventListener('keyup', e => down.delete(e.code));
  addEventListener('blur', () => down.clear());
  addEventListener('pointerdown', e => { if (e.target.id === 'gl') { drag = { x: e.clientX, y: e.clientY }; } });
  addEventListener('pointermove', e => { if (drag) { cam.x += e.clientX - drag.x; cam.y += e.clientY - drag.y; drag = { x: e.clientX, y: e.clientY }; } });
  addEventListener('pointerup', () => { drag = null; });
  addEventListener('wheel', e => { if (e.target.id === 'gl') cam.zoom += Math.sign(e.deltaY); }, { passive: true });
  const k = c => down.has(c), h = c => hit.has(c);
  return {
    force: null,                     // tests: { x, y, run, jump, jumpPressed, interact }
    get typing() { return typing; },
    set typing(v) { typing = v; if (v) down.clear(); },
    read() {
      const M = KEYS.map, any = a => M[a].some(k), anyHit = a => M[a].some(h);
      let x = (any('right') ? 1 : 0) - (any('left') ? 1 : 0);
      let y = (any('up') ? 1 : 0) - (any('down') ? 1 : 0);
      let run = any('run'), jump = any('jump');
      let jumpPressed = anyHit('jump'), interact = anyHit('interact'), look = anyHit('look');
      let journal = anyHit('journal'), cancel = h('Escape'), save = anyHit('save') || saveHit; saveHit = false;
      // up/down edges, for menus and dodging in battle: the move keys, and the arrows whatever they're bound to
      let up = anyHit('up') || h('ArrowUp'), downP = anyHit('down') || h('ArrowDown');
      // the camera keys turn and tilt smoothly, the same speed at any frame rate
      const now = performance.now(), kdt = lastRead ? Math.min(0.05, (now - lastRead) / 1000) : 0; lastRead = now;
      const sp = KEYS.opts.camSpeed || 1;
      let cx = cam.x + ((any('camRight') ? 1 : 0) - (any('camLeft') ? 1 : 0)) * 400 * sp * kdt;
      let cy = cam.y + ((any('camDown') ? 1 : 0) - (any('camUp') ? 1 : 0)) * 260 * sp * kdt;
      let zoom = cam.zoom + (anyHit('zoomOut') ? 1 : 0) - (anyHit('zoomIn') ? 1 : 0);
      cam.x = cam.y = cam.zoom = 0;
      const pad = navigator.getGamepads ? [...navigator.getGamepads()].find(p => p && p.connected) : null;
      if (pad) {
        const dz = v => (Math.abs(v) < 0.18 ? 0 : v);
        const b = i => !!(pad.buttons[i] && pad.buttons[i].pressed);
        const edge = i => b(i) && !padPrev[i];
        if (dz(pad.axes[0]) || dz(pad.axes[1])) { x = dz(pad.axes[0]); y = -dz(pad.axes[1]); }
        cx += dz(pad.axes[2] || 0) * 14; cy += dz(pad.axes[3] || 0) * 10;
        run = run || b(1); jump = jump || b(0);
        jumpPressed = jumpPressed || edge(0); interact = interact || edge(2); look = look || edge(3);
        journal = journal || edge(9); cancel = cancel || edge(8);
        up = up || edge(12); downP = downP || edge(13);
        padPrev = pad.buttons.map(q => q.pressed);
      }
      const f = this.force;
      if (f) {
        x = f.x || 0; y = f.y || 0; run = !!f.run; jump = !!f.jump;
        if (f.jumpPressed) { jumpPressed = true; f.jumpPressed = false; }
        if (f.interact) { interact = true; f.interact = false; }
      }
      hit.clear();
      if (KEYS.opts.invertY) cy = -cy;
      return { x, y, run, jump, jumpPressed, interact, look, journal, cancel, save, up, down: downP, camX: cx, camY: cy, zoom };
    },
  };
})();
const NO_INPUT = { x: 0, y: 0, run: false, jump: false, jumpPressed: false, interact: false, look: false, journal: false, cancel: false, save: false, camX: 0, camY: 0, zoom: 0 };
