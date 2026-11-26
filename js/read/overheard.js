'use strict';
// OVERHEARD: townsfolk chatting (DESIGN.md 15.4). Pairs of Alba's own people (town.js G.town.people, by id) talk at natural
// speed in two voices. Stand near (not too near: closer than 3 they turn to greet you) and press E «Listen». The words are off
// at first (a button shows them), then a question. Some talks carry a fact you can use (content: fact: { id, note }); the
// first one, the library's clock (facts.clock), opens a hiding place in the library (library.js clockLook, and the side quest
// «Noa's hiding place» below).
// No claims: the pairs already stand together; the listen spot is the content's `spot`, or worked out 3.7 off their line.
//   OVERHEARD.init(game) · .outdoor(dt, t, you) (READ.update) · .listen(talk) · .mapMarks(dpr) · ._ (tests)

const OVERHEARD = (() => {
  let G = null, speaking = null, active = null;
  const on = () => READ.on('overheard');
  const byId = id => (G && G.town && G.town.people ? G.town.people.find(p => p.id === id) : null);
  const pairOf = t => (t.pair || []).map(byId);
  const spots = {};
  function spotOf(t) {
    if (t.spot) return t.spot;
    if (spots[t.id]) return spots[t.id];
    const [a, b] = pairOf(t); if (!a || !b) return null;
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
    const nx = -dz / L, nz = dx / L, P = TOWN.layout && TOWN.layout.plaza ? TOWN.layout.plaza : { x: -10, z: -146 };
    const s = (P.x - mx) * nx + (P.z - mz) * nz > 0 ? 1 : -1;                                  // (the side toward the plaza)
    return (spots[t.id] = { x: mx + nx * 3.7 * s, z: mz + nz * 3.7 * s });
  }
  // the talks you can listen to right now: both people there, awake (not hushed), the town drawn
  function ready() {
    if (!G || !on() || !G.state.flags.hatched || (G.indoors && G.indoors())) return [];
    const town = G.town && G.town.group; if (town && !town.visible) return [];
    return READ.list('overheard').filter(t => { const [a, b] = pairOf(t); return a && b && !a.hushed && !b.hushed; });
  }
  // one Listen per pair: the first talk you haven't heard, else the next one round
  function choiceFor(list, pairKey) {
    const st = READ.S().talks, mine = list.filter(t => t.pair.join('+') === pairKey);
    return mine.find(t => !st[t.id]) || mine[(Object.values(st).reduce((n, r) => n + (r.n || 0), 0)) % mine.length];
  }
  const PROVIDER = {
    interactables() {
      const list = ready(); if (!list.length) return [];
      const Y = G.sim.you, out = [], seen = new Set();
      for (const t of list) {
        const key = t.pair.join('+'); if (seen.has(key)) continue; seen.add(key);
        const sp = spotOf(t); if (!sp || Math.abs(sp.x - Y.x) > 6 || Math.abs(sp.z - Y.z) > 6) continue;
        const pick = choiceFor(list, key);
        out.push({ x: sp.x, z: sp.z, r: 2.4, label: READ.S().talks[pick.id] ? 'Listen again' : 'Listen', run: () => listen(pick) });
      }
      return out;
    },
  };
  // a camera on the pair, from where you stand: aimed below their feet, so the two of them sit in the top half of the screen,
  // above the docked panel
  function frame(t) {
    const [a, b] = pairOf(t), Y = G.sim.you; if (!a || !b) return null;
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, dx = Y.x - mx, dz = Y.z - mz, L = Math.hypot(dx, dz) || 1;
    const GY = (TOWN.GY || 0.25);
    return { pos: new THREE.Vector3(mx + dx / L * 6.4 + dz / L * 3.2, GY + 2.6, mz + dz / L * 6.4 - dx / L * 3.2), look: new THREE.Vector3(mx, GY + 0.35, mz), dur: 0.8, back: 0.8 };
  }
  async function listen(t) {
    if (!t || active) return null;
    active = t;
    const [a, b] = pairOf(t);
    const names = {}; for (const p of [a, b]) if (p) names[p.id] = p.name;
    const was = G.sim.lock; G.sim.lock = 1;
    const shot = frame(t); if (shot) G.cam.override = shot;
    for (const p of [a, b]) if (p) p.listening = true;
    let res = null;
    try {
      res = await READER.listen(t, { dock: true, station: 'Overheard', icon: '👂', names, onLine: (i, l) => { speaking = l ? l.who : null; } });
    } finally {
      speaking = null; active = null; G.cam.override = null; G.sim.lock = was;
      for (const p of [a, b]) if (p) p.listening = false;
    }
    const r = READ.record('talks', t.id, { t: Date.now() }); r.n = (r.n || 0) + 1;
    if (res && res.grades) r.grades = (r.grades || []).concat(res.grades.filter(Boolean)).slice(-8);
    if (t.fact && !READ.S().facts[t.fact.id]) {
      READ.S().facts[t.fact.id] = true;
      if (t.fact.think) STORY.think(READ.fill(t.fact.think), 6);
      if (t.fact.note) UI.toast('In your journal: ' + t.fact.note);
    }
    READ.save();
    return res;
  }
  // while they talk: the speaker's mouth and body move (town.js reads _S.talkSolo), and neither turns away
  function outdoor(dt) {
    if (!speaking || !active) return;
    const p = byId(speaking); if (p && p._S) p._S.talkSolo = 1;
  }
  // the mini-map: a small ear by each pair you haven't listened to yet
  const MARK = {};
  function mapMarks(dpr) {
    const list = ready(); if (!list.length) return [];
    const k = String(dpr);
    if (!MARK[k]) {
      const cv = document.createElement('canvas'), s = 14; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = '#fff3b0'; c.strokeStyle = '#2b2235'; c.lineWidth = 1.1; c.beginPath(); c.arc(7, 7, 6, 0, Math.PI * 2); c.fill(); c.stroke();
      c.font = '700 9px "Segoe UI", sans-serif'; c.fillStyle = '#2b2235'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('…', 7, 6.5);
      MARK[k] = cv;
    }
    const st = READ.S().talks, out = [], seen = new Set();
    for (const t of list) { const key = t.pair.join('+'); if (seen.has(key) || st[t.id]) continue; seen.add(key); const [a, b] = pairOf(t); out.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 - 1.1, img: MARK[k] }); }
    return out;
  }
  // the fact's use: a small side quest to look behind the library's clock (library.js does the looking)
  function quest() {
    const f = s => (s.read && s.read.facts) || {}, lib = s => (s.read && s.read.lib) || {};
    const at = () => {
      if (typeof LIBRARY === 'undefined') return null;
      if (LIBRARY.inside) { const R = LIBRARY.ROOM_AT, S = LIBRARY.SPOT.clockAt; return { x: R.x + S.x, z: R.z + S.z }; }
      const o = LIBRARY._.OUT; return o && !o.broken ? o.door : null;
    };
    return {
      id: 'read-clock', kind: 'side',
      get title() { return 'Noa’s hiding place'; },
      get giver() { return 'something you overheard by the pond'; },
      started: s => !!f(s).clock && READ.on('books'),
      steps: [{ text: 'Look behind the big clock in Alba’s library', why: 'Emil says Noa hid a “treasure” behind the library’s old clock, for whoever came looking.', done: s => !!lib(s).note, target: at, hint: '{mimo} points at the library: the big clock!' }],
      story: [{ when: s => !!lib(s).note, text: 'Behind the old clock was a note from Noa, left for you.' }],
    };
  }
  function init(game) {
    G = game;
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'read-clock')) QUESTS.LIST.push(quest());
  }
  return { init, outdoor, listen, mapMarks, _: { spotOf, pairOf, ready, frame, get speaking() { return speaking; }, quest } };
})();
