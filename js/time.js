'use strict';
// TIME: three worlds, like A Link Between Worlds (DESIGN.md 18). Every place exists now, in the Past (about 40 years ago, warm
// sepia) and in the Future (gray, if nobody speaks up). Time cracks in each region step you between them, and what you do in one
// world can change what you find in another. The contract for the region helpers is game/TIME.md; Alba's worlds, its cracks and
// its two cross-time puzzles are time_alba.js (the worked example).
//   TIME.world()                         'now' | 'past' | 'future' (where you are)
//   TIME.go(world, { region, at })       step across (a short trip through a crack), then save
//   TIME.region(id, def)                 a region's three dressings, its songs, grammar and reach (TIME.md "A region")
//   TIME.crack(id, { region, x, z, worlds, gate })   a shimmering tear with an E prompt and a minimap mark
//   TIME.flag(world, key, value?)        per-world state · TIME.grade(id, letter?) · TIME.state(region, world)
//   TIME.effect(id, { region, when, show: { past, now, future }, before, act })   what one world's deeds change elsewhere
//   TIME.spot(id, { region, world, x, z, r, label, run, when, who })   something to press E on in one world
//   TIME.rules(world?) · TIME.realm() · TIME.fight(opts) · TIME.song() · TIME.look (the shared grades)
// It's also a room in main.js's sense (TIME.inside) for a region whose other world has no room module of its own; Alba's Past
// and Future are past.js and future.js, which stay rooms themselves (TIME follows them: world() reads them).
// State: state.worlds { world, region, at, flags: { now, past, future }, grades, seen, r: { region: { now, past, future } } };
// the play time per language band: state.bandTime { es: { A0: seconds, … } } (shown on the journal's "My <language>" page).
const TIME = (() => {
  let G = null;
  const WORLDS = ['now', 'past', 'future'];
  const OFF = 1e5;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const lang = () => (G && G.state && G.state.lang) || 'es';
  const isC = () => lang() === 'zh' || lang() === 'ja';
  const plainT = s => (isC() && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: lang() }) : String(s || ''));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const gy = (x, z) => (typeof WORLD !== 'undefined' ? WORLD.terrainAt(x, z) : 0);

  // ------------------------------------------------------------ the rules of each world (DESIGN.md 18.1, 18.2)
  // tense: what every command and answer is told in there; realm: what game.fight gets (battle/timebattle.js, battle idea G);
  // ladder: the slow ramp, one small step per region (TIME.md "The grammar"); name: the world in each language
  const L6 = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const RULES = {
    now: { id: 'now', tense: 'present', realm: null, ladder: ['pres'], en: 'today', title: 'Today',
      name: L6('Today', 'el Hoy', 'o Hoje', 'das Heute', '[今天|jīn tiān]', '[今日|きょう]'),
      col: ['#8fe8b8', '#2f9a8a'] },
    past: { id: 'past', tense: 'past', realm: 'past', ladder: ['pret', 'impf', 'contrast'], en: 'the Past', title: 'The Past',
      name: L6('the Past', 'el Ayer', 'o Ontem', 'das Gestern', '[昨天|zuó tiān]', '[昨日|きのう]'),
      col: ['#ffd166', '#a8683a'] },
    future: { id: 'future', tense: 'future', realm: 'future', ladder: ['fut', 'cond', 'subj'], en: 'the Future', title: 'The Future',
      name: L6('the Future', 'el Mañana', 'o Amanhã', 'das Morgen', '[明天|míng tiān]', '[明日|あした]'),
      col: ['#9db8ff', '#7a4fd8'] },
  };
  // the grammar steps a region's world can teach (TIME.md: one small step per region, never a jump)
  const STEPS = {
    pres: 'the present', pret: 'the preterite: what happened (saltó, tocó)', impf: 'the imperfect: how it was (estaba, tenía)',
    contrast: 'preterite against imperfect in one story (cuando llegué, llovía)', fut: 'the future: plans and promises (saltará, vamos a…)',
    pred: 'predictions (atacará por arriba)', cond: 'the conditional: wishes and traps (me gustaría…, si baja…)',
    subj: 'the subjunctive at B2: wishes and doubts (ojalá que…, no creo que…)',
  };
  const rules = w => RULES[w || world()] || RULES.now;
  const wName = (w, l) => { const R = RULES[w]; if (!R) return ''; const t = R.name[l || lang()] || R.name.en; return l === 'en' ? t : plainT(t); };

  // ------------------------------------------------------------ the save's part
  const W = () => {
    const s = G.state, o = s.worlds || (s.worlds = {});
    if (!o.world) o.world = 'now';
    o.flags = o.flags || {}; WORLDS.forEach(w => { o.flags[w] = o.flags[w] || {}; });
    o.grades = o.grades || {}; o.seen = o.seen || {}; o.r = o.r || {};
    return o;
  };
  let dirty = true;          // (effects to put into the world again: a flag changed, a world changed, a save loaded)
  function flag(w, key, value) {
    if (!G) return undefined;
    const F = W().flags, o = F[w] || (F[w] = {});
    if (value === undefined) return o[key];
    if (o[key] !== value) { o[key] = value; dirty = true; }
    return value;
  }
  // a letter S–D for a cross-time task (kept, the best one wins)
  function grade(id, letter) {
    if (!G) return null;
    const g = W().grades;
    if (letter === undefined) return g[id] || null;
    if (!g[id] || 'SABCD'.indexOf(letter) < 'SABCD'.indexOf(g[id])) g[id] = letter;
    return g[id];
  }
  // a region's own progress in one world (anything it likes: TIME.state('molinar', 'past').mill = true)
  function state(region, w) { const r = W().r, o = r[region] || (r[region] = {}); return o[w] || (o[w] = {}); }
  const seen = (key, v) => { if (!G) return false; const s = W().seen; if (v === undefined) return !!s[key]; s[key] = v; return v; };

  // ------------------------------------------------------------ regions
  // def: { name: { now, past, future } (the minimap's tab), color: { past, future }, center: { x, z }, radius, inside(x, z),
  //        open(state) (its cracks open: default after the Future chapter, flags.futureDone), grammar: { past: [...], future: [...] },
  //        songs: { past, future } (a song name or a function), dress: { past: Dressing, future: Dressing }, spawn: { past, future } }
  // Dressing: { room (a module whose .inside is this world here: past.js, future.js), on(api, at), off(api, to), restore(api, at),
  //   entered(api), left(api), update(api, dt, t), late(api, dt), interactables(api), target(api), song(api), dots(api),
  //   people: [ … ] (TIME builds and shows them: TIME.md "People"), look: 'past' | 'future' | false (the shared grade), edge: line }
  const REGIONS = {};
  function region(id, def) {
    const R = Object.assign({ id, name: {}, color: {}, center: { x: 0, z: 0 }, radius: 40, grammar: {}, songs: {}, dress: {}, spawn: {} }, def);
    if (!R.inside) R.inside = (x, z) => Math.hypot(x - R.center.x, z - R.center.z) < R.radius;
    if (!R.open) R.open = s => !!(s && s.flags && s.flags.futureDone);
    REGIONS[id] = R; dirty = true;
    return R;
  }
  const regionOpen = id => { const R = REGIONS[id]; try { return !!(R && G && R.open(G.state)); } catch (e) { return false; } };
  // the region you're in (in the present: by its reach; in another world: the one whose dressing is on)
  function regionAt(x, z) { for (const R of Object.values(REGIONS)) { try { if (R.inside(x, z)) return R.id; } catch (e) { /* */ } } return null; }
  // the grammar a region's world teaches (its own steps, else the world's first step)
  const step = (rid, w) => { const R = REGIONS[rid], g = R && R.grammar && R.grammar[w]; return g && g.length ? g : [rules(w).ladder[0]]; };

  // ------------------------------------------------------------ where you are: a room module of a region (past.js, future.js),
  // or TIME's own dressing of a region (live)
  const live = { world: 'now', region: null };
  function legacy() {
    for (const R of Object.values(REGIONS)) for (const w of ['past', 'future']) { const d = R.dress[w]; if (d && d.room && d.room.inside) return { world: w, region: R.id, d }; }
    return null;
  }
  function world() { if (!G) return 'now'; const L = legacy(); return L ? L.world : live.world; }
  function regionNow() { const L = legacy(); return L ? L.region : live.world !== 'now' ? live.region : null; }
  const dressNow = () => { const w = world(), R = REGIONS[regionNow()]; return w !== 'now' && R ? R.dress[w] || null : null; };

  // ------------------------------------------------------------ cracks
  // def: { region, x, z, worlds: ['now', 'past'] (a link) or all three (you pick), gate(state) (its own test, on top of the
  //        region's open), y (a height, for a crack up a stair), r (how near for E: 1.9) }
  const CRACKS = {};
  function crack(id, def) { CRACKS[id] = Object.assign({ id, worlds: ['now', 'past'], r: 1.9 }, def); dirty = true; return CRACKS[id]; }
  const crackOpen = c => { try { return regionOpen(c.region) && (!c.gate || !!c.gate(G.state)); } catch (e) { return false; } };
  // shown in this world: open, one of its worlds, and in another world only in the region you're in
  const crackOn = (c, w) => !!G && c.worlds.includes(w) && crackOpen(c) && (w === 'now' || regionNow() === c.region);

  // ------------------------------------------------------------ effects: one world's deeds, seen in the others
  // def: { region, when(state) → bool, show: { past, now, future }, before: { past, now, future }, act: { past, now, future } }
  //   show[w] / before[w]: (api) → a THREE.Object3D, or { obj, solids: [{ x, z, r }], update(dt, t), on(visible) }: built the
  //   first time it's needed, shown only in that world (show while `when` holds, before while it doesn't). act[w]: an interactable
  //   ({ x, z, r, label, run }) or (state) → one, while it holds there. Applied on every world change and load (and when a flag
  //   changes: TIME.refresh() forces it).
  const EFFECTS = {};
  function effect(id, def) { EFFECTS[id] = Object.assign({ id, show: {}, before: {}, act: {}, built: {} }, def); dirty = true; return EFFECTS[id]; }
  function buildPiece(make) {
    let r = null;
    try { r = make(API); } catch (e) { console.error('[time] effect build', e); return null; }
    if (!r) return null;
    const P = r.isObject3D ? { obj: r } : r;
    P.solids = (P.solids || []).map(c => Object.assign({ _x: c.x, _z: c.z, time: true }, c, { x: OFF, z: OFF }));
    if (P.solids.length) WORLD.extra.push(...P.solids);
    if (P.obj && !P.obj.parent) G.w3d.scene.add(P.obj);
    if (P.obj) P.obj.visible = false;
    P.was = false;
    return P;
  }
  function applyEffects() {
    if (!G) return;
    const w = world(), s = G.state, rid = regionNow();
    for (const E of Object.values(EFFECTS)) {
      // (in another world only the region you're in is dressed, so another region's effects stay hidden there; today shows them all)
      const here = w === 'now' || !E.region || E.region === rid;
      let on = false; try { on = !!E.when(s); } catch (e) { on = false; }
      E.on = on;
      for (const ww of WORLDS) for (const kind of ['show', 'before']) {
        const make = E[kind] && E[kind][ww]; if (!make) continue;
        const want = ww === w && here && (kind === 'show' ? on : !on), key = kind + ':' + ww;
        if (want && !E.built[key]) E.built[key] = buildPiece(make) || { obj: null, solids: [], dead: true };
        const P = E.built[key]; if (!P || P.dead) continue;
        if (P.obj) P.obj.visible = want;
        P.solids.forEach(c => { c.x = want ? c._x : OFF; c.z = want ? c._z : OFF; });
        if (P.on && want !== P.was) { try { P.on(want); } catch (e) { console.error('[time] effect on', e); } }
        P.was = want;
      }
    }
    dirty = false;
  }
  const refresh = () => { dirty = true; if (G) applyEffects(); };

  // ------------------------------------------------------------ spots: things to press E on in one world (a puzzle's start, a prop)
  // def: { region, world, x, z (numbers or functions), r, y, label (or a function), run, when(state), who (for STORY.talkHooks) }
  const SPOTS = {};
  function spot(id, def) { SPOTS[id] = Object.assign({ id, r: 2.2 }, def); return SPOTS[id]; }
  const val = (v, ...a) => (typeof v === 'function' ? v(...a) : v);

  // the api a region's hooks and effects get
  const API = {
    get G() { return G; }, V, gy, snd, lang, isC, plainT, esc, OFF, RULES, STEPS,
    world: () => world(), region: () => regionNow(), flag: (...a) => flag(...a), grade: (...a) => grade(...a), state: (...a) => state(...a),
    refresh: () => refresh(),
  };

  return {
    WORLDS, RULES, STEPS, REGIONS, CRACKS, EFFECTS, SPOTS, API,
    world, regionNow, regionAt, rules, step, wName, flag, grade, state, seen, region, crack, effect, spot, refresh,
    realm: () => rules().realm,
    open: id => regionOpen(id),
    // (the rest is added below: go, the room, the look, the clock…)
    _: { W, live, legacy, dressNow, crackOn, crackOpen, applyEffects, buildPiece, val, get G() { return G; }, set G(g) { G = g; }, get dirty() { return dirty; }, set dirty(v) { dirty = !!v; } },
  };
})();

// ============================================================ going across: the trip through a crack, the room, every frame
(() => {
  const T = TIME, _ = T._, A = T.API, OFF = A.OFF, V = A.V, snd = A.snd, gy = A.gy;
  const G = () => _.G, live = _.live;
  let busy = false;
  const fast = { on: false };      // (tests: a hidden tab throttles timers; the trip happens at once)
  const sleep = ms => (fast.on ? Promise.resolve() : new Promise(r => setTimeout(r, ms)));
  const lock = on => { const g = G(); if (g) g.sim.lock = on ? 1 : 0; };

  // ------------------------------------------------------------ the trip's look: a swirl in the colors of where you're going
  function css() {
    if (document.getElementById('time-css')) return;
    const s = document.createElement('style'); s.id = 'time-css';
    s.textContent = `#time-veil { position: fixed; inset: 0; z-index: 57; pointer-events: none; opacity: 0; overflow: hidden; }
#time-veil .sw { position: absolute; left: 50%; top: 50%; width: 240vmax; height: 240vmax; margin: -120vmax 0 0 -120vmax; border-radius: 50%; animation: timeSpin 2.4s linear infinite; }
@keyframes timeSpin { to { transform: rotate(360deg); } }
#time-cap { position: fixed; left: 50%; top: 22%; transform: translate(-50%, -50%); z-index: 13; pointer-events: none; text-align: center; opacity: 0; transition: opacity .6s; }
#time-cap.on { opacity: 1; }
#time-cap .t { font: 800 30px Georgia, "Yu Mincho", "Microsoft YaHei", serif; color: #fffaf0; text-shadow: 0 2px 0 #2b2235, 0 0 14px rgba(43,34,53,.55); }
#time-cap .s { margin-top: 2px; font: 700 15px Bahnschrift, "Segoe UI", sans-serif; color: #fffaf0; text-shadow: 0 1px 0 #2b2235; letter-spacing: .06em; opacity: .9; }
body.in-battle #time-cap, body.on-title #time-cap { display: none; }`;
    document.head.appendChild(s);
  }
  function veil(on, to, ms) {
    css();
    let el = document.getElementById('time-veil');
    if (!el) { el = document.createElement('div'); el.id = 'time-veil'; el.innerHTML = '<div class="sw"></div>'; document.body.appendChild(el); }
    const [c0, c1] = (T.RULES[to] || T.RULES.now).col;
    el.querySelector('.sw').style.background = `radial-gradient(circle, #ffffff 0%, ${c0} 9%, transparent 30%), repeating-conic-gradient(from 0deg, ${c0} 0deg 14deg, ${c1} 14deg 30deg)`;
    if (fast.on) { el.style.transition = 'none'; el.style.opacity = on ? '1' : '0'; return Promise.resolve(); }
    el.style.transition = `opacity ${ms}ms ease-${on ? 'in' : 'out'}`; void el.offsetWidth; el.style.opacity = on ? '1' : '0';
    return sleep(ms + 30);
  }
  // the world's name as you land: «el Ayer», with the English under it (a name, not a line: it's the place's sign)
  function caption(to, rid) {
    css();
    let el = document.getElementById('time-cap');
    if (!el) { el = document.createElement('div'); el.id = 'time-cap'; document.body.appendChild(el); }
    const R = T.REGIONS[rid], place = (R && R.name && R.name[to]) || '', l = A.lang();
    const nm = T.wName(to, l), html = isCJ() && typeof CJK !== 'undefined' ? CJK.html((T.RULES[to].name[l] || ''), { lang: l }) : A.esc(nm);
    el.innerHTML = `<div class="t">«${html}»</div><div class="s">${A.esc(place || T.RULES[to].title)}</div>`;
    el.classList.add('on');
    clearTimeout(caption._t); caption._t = setTimeout(() => el.classList.remove('on'), 2600);
  }
  const isCJ = () => A.isC();

  // ------------------------------------------------------------ putting a region's world on, and taking it off
  // (a room module of its own, like past.js and future.js, does its own work in its on / off; for the rest, TIME is the room)
  function teleport(at) {
    const g = G(), Y = g.sim.you, M = g.sim.mimo;
    Y.x = at.x; Y.z = at.z; if (at.yaw !== undefined) Y.yaw = at.yaw;
    M.x = at.x + 1.1; M.z = at.z + 0.8; M.hidden = false; M.wander = null; M.station = null; M.look = null;
    g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
  }
  const hidden = [];
  A.hide = o => { if (o && o.visible) { hidden.push(o); o.visible = false; } };
  A.unhide = () => { while (hidden.length) { const o = hidden.pop(); if (o) o.visible = true; } };
  A.teleport = at => teleport(at);
  async function dressOn(R, w, at, quiet) {
    const d = R.dress[w];
    if (d.room) { await d.on(A, at, { quiet }); return; }
    if (T.people) T.people.build(R, w);
    live.world = w; live.region = R.id;
    if (d.on) await d.on(A, at, { quiet });
    if (T.people) T.people.show(R, w, true);
    if (T.land && T.land.on) { try { T.land.on(R.id, w); } catch (e) { console.error('[time] land on', e); } }     // (the world's own land, time_land.js: before you're put down, so you land on it)
    if (at) teleport(at);
    lastOk = at ? { x: at.x, z: at.z } : null;
  }
  async function dressOff(R, w, to) {
    const d = R.dress[w];
    if (d.room) { await d.off(A, to); return; }
    if (d.off) { try { await d.off(A, to); } catch (e) { console.error('[time] off', e); } }
    if (T.land && T.land.off) { try { T.land.off(); } catch (e) { console.error('[time] land off', e); } }
    if (T.people) T.people.show(R, w, false);
    if (T.look) T.look.off();
    A.unhide();
    live.world = 'now'; live.region = null;
  }

  // ------------------------------------------------------------ TIME.go: step across, through a crack (a short trip), then save
  // o: { region (default: the one you're in), at: { x, z, yaw } (where you land: default where you stand), quick, quiet (no
  //      caption), from (the crack) }
  async function go(to, o = {}) {
    const g = G();
    if (!g || busy || !T.RULES[to]) return false;
    const from = T.world(); if (to === from) return false;
    const Y = g.sim.you, rid = o.region || T.regionNow() || T.regionAt(Y.x, Y.z), R = T.REGIONS[rid];
    if (!R || (to !== 'now' && !R.dress[to])) { console.warn('[time] no', to, 'for', rid); return false; }
    const at = o.at || { x: Y.x, z: Y.z, yaw: Y.yaw };
    busy = true;
    try {
      lock(true);
      g.sim.mimo.scared = 0; snd('swoosh'); if (!fast.on) setTimeout(() => snd('tick'), 160);
      await veil(true, to, o.quick ? 260 : 560);
      const fromR = T.REGIONS[T.regionNow()] || R;
      if (from !== 'now') await dressOff(fromR, from, to === 'now' ? at : null);
      if (to !== 'now') await dressOn(R, to, at); else teleport(at);
      const s = _.W(); s.world = to; s.region = to === 'now' ? null : rid; s.at = to === 'now' ? null : { x: at.x, z: at.z, yaw: at.yaw };
      _.applyEffects();
      await sleep(160);
      snd('chime');
      await veil(false, to, o.quick ? 360 : 820);
      lock(false);
      if (!o.quiet) caption(to, rid);
      g.save();
      return true;
    } catch (e) { console.error('[time] go', e); lock(false); return false; }
    finally { busy = false; }
  }

  // ------------------------------------------------------------ the cracks, drawn: a shimmering tear, its glow, a ring on the ground
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  // (a torn shape, pinched at the ends, with a ragged ink rim like everything else drawn in the game; inside, the other world's
  // colors swirl round a bright core)
  const FS = `uniform float uT; uniform vec3 uA; uniform vec3 uB; uniform float uK; varying vec2 vUv;
    void main(){
      vec2 p = vUv * 2.0 - 1.0;
      float pinch = 1.0 - 0.62 * p.y * p.y;
      vec2 q = vec2(p.x / max(pinch, 0.06), p.y);
      float r = length(q), a = atan(q.y, q.x);
      float edge = 0.82 + 0.04 * sin(a * 7.0 + uT * 1.3) + 0.03 * sin(a * 13.0 - uT * 2.1) + 0.018 * sin(a * 23.0 + uT * 3.3);
      float m = 1.0 - smoothstep(edge - 0.035, edge, r);
      float ink = smoothstep(edge - 0.13, edge - 0.07, r);
      float sw = smoothstep(0.25, 0.75, 0.5 + 0.5 * sin(a * 2.0 + r * 11.0 - uT * 2.2));
      vec3 col = mix(uB, uA, sw);
      col = mix(col, vec3(1.0, 0.99, 0.94), (1.0 - smoothstep(0.0, 0.34, r)) * 0.9);
      col = mix(col, vec3(0.17, 0.13, 0.21), ink);
      gl_FragColor = vec4(col, m * uK);
    }`;
  // the colors of where a crack leads, from here: one world, or two (a three-way crack)
  function colsOf(c, w) {
    const o = c.worlds.filter(x => x !== w).map(x => T.RULES[x].col);
    return o.length === 1 ? o[0] : [o[0][0], o[1][1]];
  }
  const VIS = {};          // crack id → { g, plane, mat, glow, ring, motes, key }
  function crackMesh(c) {
    if (VIS[c.id]) return VIS[c.id];
    const g = new THREE.Group(); g.name = 'time-crack-' + c.id;
    const mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color('#ffe6a8') }, uB: { value: new THREE.Color('#ff9f4a') }, uK: { value: 0 } } });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.7), mat); plane.position.y = 1.45; plane.renderOrder = 4; g.add(plane);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffe6a8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    glow.scale.set(3.4, 4.2, 1); glow.position.y = 1.45; g.add(glow);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.15, 40), new THREE.MeshBasicMaterial({ color: '#ffe6a8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
    // sparks drifting round it (one Points: one draw)
    const motes = [], mpos = new Float32Array(8 * 3), mgeo = new THREE.BufferGeometry(); mgeo.setAttribute('position', new THREE.BufferAttribute(mpos, 3));
    for (let i = 0; i < 8; i++) motes.push({ a: i / 8 * Math.PI * 2, r: 0.7 + (i % 3) * 0.18, y: 0.3 + (i % 4) * 0.6, ph: i * 1.3 });
    const pts = new THREE.Points(mgeo, new THREE.PointsMaterial({ map: TK.sparkTex, color: '#fff3c8', size: 0.2, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.frustumCulled = false; g.add(pts);
    g.position.set(c.x, c.y !== undefined ? c.y : gy(c.x, c.z), c.z); g.visible = false;
    G().w3d.scene.add(g);
    return (VIS[c.id] = { g, plane, mat, glow, ring, motes, pts, mpos, k: 0, key: '' });
  }
  function drawCracks(dt, t) {
    const g = G(), w = T.world(), cam = g.w3d.camera.position;
    for (const c of Object.values(T.CRACKS)) {
      const on = _.crackOn(c, w) && Math.hypot(c.x - cam.x, c.z - cam.z) < 140;
      if (!on && !VIS[c.id]) continue;
      const M = crackMesh(c);
      M.k = on ? Math.min(1, M.k + dt * 1.5) : 0;
      M.g.visible = on;
      if (!on) continue;
      const key = w + c.id; if (M.key !== key) { M.key = key; const [a, b] = colsOf(c, w); M.mat.uniforms.uA.value.set(a); M.mat.uniforms.uB.value.set(b); M.glow.material.color.set(a); M.ring.material.color.set(b); }
      const camD = Math.hypot(c.x - cam.x, c.z - cam.z);     // (it fades away when the camera's right up against it, as the trees do)
      M.mat.uniforms.uT.value = t; M.mat.uniforms.uK.value = M.k * (0.85 + 0.15 * Math.sin(t * 2.1 + c.x)) * smoothstep(1.6, 4.2, camD);
      M.plane.rotation.y = Math.atan2(cam.x - c.x, cam.z - c.z);
      M.plane.scale.set(1 + 0.04 * Math.sin(t * 3.3), 1 + 0.03 * Math.sin(t * 2.7 + 1), 1);
      M.glow.material.opacity = M.k * (0.28 + 0.08 * Math.sin(t * 1.9));
      M.ring.material.opacity = M.k * (0.22 + 0.1 * Math.sin(t * 2.4)); M.ring.rotation.z = t * 0.4;
      M.motes.forEach((m, i) => { const a = m.a + t * (0.6 + (i % 3) * 0.2); M.mpos[i * 3] = Math.cos(a) * m.r; M.mpos[i * 3 + 1] = m.y + Math.sin(t * 1.3 + m.ph) * 0.25; M.mpos[i * 3 + 2] = Math.sin(a) * m.r; });
      M.pts.geometry.attributes.position.needsUpdate = true; M.pts.material.opacity = M.k * (0.55 + 0.25 * Math.sin(t * 3));
    }
  }
  // the minimap's mark: a little tear in the crack's colors (minimap.js asks: TIME.mapMarks(dpr))
  const MARK = {};
  function markImg(cols, dpr) {
    const key = cols.join() + dpr; if (MARK[key]) return MARK[key];
    const s = Math.round(18 * dpr), cv = document.createElement('canvas'); cv.width = cv.height = s; const c = cv.getContext('2d');
    c.translate(s / 2, s / 2); c.scale(dpr, dpr);
    const gr = c.createRadialGradient(0, 0, 0.5, 0, 0, 7); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, cols[0]); gr.addColorStop(1, cols[1]);
    c.fillStyle = gr; c.strokeStyle = '#2b2235'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(0, -7.5); c.quadraticCurveTo(5.2, 0, 0, 7.5); c.quadraticCurveTo(-5.2, 0, 0, -7.5); c.closePath(); c.fill(); c.stroke();
    return (MARK[key] = cv);
  }
  function mapMarks(dpr) {
    const g = G(); if (!g) return [];
    const w = T.world(), out = [];
    for (const c of Object.values(T.CRACKS)) if (_.crackOn(c, w)) out.push({ x: c.x, z: c.z, img: markImg(colsOf(c, w), dpr), crack: c.id });
    return out;
  }

  // ------------------------------------------------------------ what you can press E on, in the world you're in
  function crackLabel(c, w) {
    const o = c.worlds.filter(x => x !== w);
    if (o.length > 1) return 'Step through the time crack';
    return o[0] === 'now' ? 'Step back to today' : o[0] === 'past' ? 'Step into the Past' : 'Step into the Future';
  }
  async function useCrack(c) {
    const g = G(), w = T.world(), others = c.worlds.filter(x => x !== w);
    let to = others[0];
    if (others.length > 1) {
      lock(true);
      const SUB = { now: 'Today, as you know it', past: 'About 40 years ago: everything is told in the past', future: 'If nobody speaks up: everything is told in tomorrow’s words' };
      const pick = await UI.choose('A time crack', others.map(o => ({ label: `${T.RULES[o].title} · «${T.wName(o)}»`, sub: SUB[o], value: o })));
      lock(false);
      if (!pick) return;
      to = pick;
    }
    const Y = g.sim.you, dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1;
    await go(to, { region: c.region, at: { x: c.x + dx / d * 1.5, z: c.z + dz / d * 1.5, yaw: Math.atan2(dx, dz) }, from: c });
  }
  function interactables() {
    const g = G(); if (!g || busy) return [];
    const w = T.world(), out = [], Y = g.sim.you, rid = T.regionNow(), s = g.state;
    for (const c of Object.values(T.CRACKS)) if (Math.abs(c.x - Y.x) < 9 && Math.abs(c.z - Y.z) < 9 && _.crackOn(c, w)) out.push({ x: c.x, z: c.z, r: c.r, y: c.y, label: crackLabel(c, w), run: () => useCrack(c), crack: c.id });
    for (const S of Object.values(T.SPOTS)) {
      if (S.world !== w || (w !== 'now' && S.region && S.region !== rid)) continue;
      try {
        if (S.when && !S.when(s)) continue;
        const x = _.val(S.x), z = _.val(S.z); if (x == null || z == null) continue;
        out.push({ x, z, r: _.val(S.r) || 2.2, y: _.val(S.y), label: _.val(S.label) || 'Look', who: S.who, p: _.val(S.p), run: S.run, spot: S.id });
      } catch (e) { console.error('[time] spot', S.id, e); }
    }
    for (const E of Object.values(T.EFFECTS)) {
      const a = E.act && E.act[w]; if (!a || (w !== 'now' && E.region && E.region !== rid)) continue;
      try { if (!E.when(s)) continue; const it = typeof a === 'function' ? a(s) : a; if (it) out.push(Object.assign({ r: 2.2, label: 'Look' }, it)); } catch (e) { /* */ }
    }
    if (T.people) out.push(...T.people.talk(w, rid));
    const D = _.dressNow();
    if (D && !D.room && D.interactables) { try { out.push(...D.interactables(A)); } catch (e) { console.error('[time] dress interactables', e); } }
    return out;
  }

  // ------------------------------------------------------------ every frame (main.js, before the render)
  let stateRef = null, wWas = 'now', rWas = null, restoring = null, lastOk = null, edgeT = 0, clockT = 0;
  function onLoad() {
    _.dirty = true;
    if (live.world !== 'now') { const R = T.REGIONS[live.region]; if (R && R.dress[live.world]) dressOff(R, live.world, null).catch(e => console.error('[time] off', e)); }
    live.world = 'now'; live.region = null;
    const s = _.W(), w = s.world, R = T.REGIONS[s.region];
    restoring = w !== 'now' && R && R.dress[w] ? { w, R, at: s.at, n: 0, started: false } : null;
    if (!restoring) { s.world = T.world(); }
  }
  function tryRestore() {
    const { w, R, at } = restoring, d = R.dress[w];
    if (d.room ? d.room.inside : (live.world === w && live.region === R.id)) { restoring = null; return; }
    if (!restoring.started) {
      restoring.started = true;
      let r = null;
      try { r = d.restore ? d.restore(A, at) : null; } catch (e) { console.error('[time] restore', e); }
      if (r !== 'self' && !d.room && !(live.world === w)) dressOn(R, w, at, true).catch(e => console.error('[time] restore', e));
      return;
    }
    if (++restoring.n > 600) { console.warn('[time] gave up restoring', w, R.id); restoring = null; }
  }
  function worldChanged(fw, fr, tw, tr) {
    _.dirty = true;
    const R0 = T.REGIONS[fr], R1 = T.REGIONS[tr];
    if (fw !== 'now' && R0 && R0.dress[fw] && R0.dress[fw].left) { try { R0.dress[fw].left(A); } catch (e) { console.error('[time] left', e); } }
    if (tw !== 'now' && R1 && R1.dress[tw] && R1.dress[tw].entered) { try { R1.dress[tw].entered(A); } catch (e) { console.error('[time] entered', e); } }
    for (const R of Object.values(T.REGIONS)) if (R.changed) { try { R.changed(A, fw, tw); } catch (e) { console.error('[time] changed', e); } }
  }
  function late(dt) {
    const g = G(); if (!g || !g.state) return;
    if (g.state !== stateRef) { stateRef = g.state; onLoad(); }
    if (restoring) tryRestore();
    const w = T.world(), rid = T.regionNow(), s = _.W(), t = g.w3d.time.value;
    if (w !== wWas || rid !== rWas) { const a = wWas, b = rWas; wWas = w; rWas = rid; worldChanged(a, b, w, rid); }
    if (!restoring) { s.world = w; s.region = w === 'now' ? null : rid; }
    if (w !== 'now' && !busy) {      // (where you'll come back to: in the world, not in a room floating over it)
      const room = g.indoorMod && g.indoorMod(), D = _.dressNow();
      if (!room || room === TIME || (D && D.room === room)) { const Y = g.sim.you; s.at = { x: +Y.x.toFixed(2), z: +Y.z.toFixed(2), yaw: +Y.yaw.toFixed(3) }; }
    }
    if (_.dirty) _.applyEffects();
    for (const E of Object.values(T.EFFECTS)) for (const P of Object.values(E.built)) if (P && P.update && P.obj && P.obj.visible) { try { P.update(dt, t); } catch (e) { console.error('[time] effect update', e); P.update = null; } }
    try { drawCracks(dt, t); } catch (e) { console.error('[time] cracks', e); }
    if (live.world !== 'now' && T.look) { const R = T.REGIONS[live.region], d = R && R.dress[live.world]; if (d && d.look) T.look.apply(d.look, dt); if (d && d.late) { try { d.late(A, dt); } catch (e) { console.error('[time] late', e); } } }
    for (const R of Object.values(T.REGIONS)) if (R.tick) { try { R.tick(A, dt); } catch (e) { console.error('[time] tick', R.id, e); R.tick = null; } }
    if (T.land && T.land.late) { try { T.land.late(dt); } catch (e) { console.error('[time] land late', e); } }     // (time_land.js: after the dressing's own, so its water level wins)
  }

  // ------------------------------------------------------------ the room (main.js ROOMS): another world of a region with no
  // room module of its own. It keeps you inside the region's reach (its edge), like the memory's edge in past.js.
  const EDGE = { past: 'The memory ends here… Let’s stay where it happened.', future: 'Past here, tomorrow’s fog is too thick to see. Let’s turn back.' };
  function update(dt, t) {
    const g = G(); if (!g || live.world === 'now') return;
    const R = T.REGIONS[live.region], d = R && R.dress[live.world]; if (!R || !d) return;
    const Y = g.sim.you;
    if (!busy && !g.sim.lock) {
      if (R.inside(Y.x, Y.z)) lastOk = { x: Y.x, z: Y.z };
      else if (lastOk) { Y.x = lastOk.x; Y.z = lastOk.z; if ((edgeT -= dt) <= 0) { edgeT = 7; STORY.think(d.edge || EDGE[live.world], 4); } }
    }
    if (d.update) { try { d.update(A, dt, t); } catch (e) { console.error('[time] update', e); d.update = null; } }
    if (T.people) T.people.animate(R, live.world, dt, t);
  }
  function target() { const D = _.dressNow(); return D && D.target ? D.target(A) : null; }
  function song() {
    const g = G(), w = T.world(); if (!g || w === 'now') return null;
    const room = g.indoorMod && g.indoorMod(), D = _.dressNow();
    if (room && room !== TIME && !(D && D.room === room) && typeof room.song === 'function') { try { const s = room.song(); if (s) return s; } catch (e) { /* */ } }     // (a dungeon of this world: its own song)
    const R = T.REGIONS[T.regionNow()], so = R && R.songs && R.songs[w];
    let name = null; try { name = typeof so === 'function' ? so() : so; } catch (e) { name = null; }
    return name || (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(w) ? w : 'village');
  }
  function areaAt(x, z) {
    if (live.world === 'now') return null;
    const R = T.REGIONS[live.region]; if (!R) return null;
    return { id: R.id + '-' + live.world, name: (R.name && R.name[live.world]) || T.RULES[live.world].title, color: (R.color && R.color[live.world]) || (live.world === 'past' ? '#c98a3a' : '#6f6b84') };
  }
  // a fight in this world's tense (battle/timebattle.js, idea G); the Past's battles keep its sepia
  async function fight(opts = {}) {
    const g = G(), realm = T.realm(), cv = document.getElementById('gl');
    // (a fight that names no arena takes the land's here, time_land.js: Molinar's dust bowl tomorrow, the gardens' dunes…)
    const lb = T.land && T.land.arena ? T.land.arena() : null;
    if (lb && !opts.biome && !(opts.place && opts.place.biome)) opts = Object.assign({}, opts, { place: Object.assign({}, opts.place || {}, { biome: lb }) });
    const tick = realm === 'past' ? setInterval(() => { if (cv && document.body.classList.contains('in-battle')) cv.style.filter = 'sepia(0.42) saturate(1.18) contrast(1.03)'; }, 120) : null;
    try { return await g.fight(Object.assign(realm ? { realm } : {}, opts)); } finally { if (tick) { clearInterval(tick); if (cv) cv.style.filter = ''; } }
  }

  Object.assign(T, {
    go, interactables, late, update, target, song, areaAt, fight, mapMarks, useCrack,
    curiosities: () => [],
    savedAt: w => { const g = G(); if (!g) return null; const s = _.W(); return s.world === w && s.at ? s.at : null; },
  });
  // (getters: Object.assign would copy their values once)
  Object.defineProperties(T, {
    inside: { get: () => live.world !== 'now' && !!live.region, configurable: true },
    OUTSIDE: { get: () => { const g = G(), Y = g && g.sim.you; return Y ? { x: Y.x, z: Y.z, yaw: Y.yaw } : { x: -10, z: -140, yaw: Math.PI }; }, configurable: true },
    busy: { get: () => busy, configurable: true },
  });
  Object.assign(_, { fast, veil, caption, teleport, dressOn, dressOff, drawCracks, VIS, crackLabel, colsOf, onLoad: () => onLoad() });      // (onLoad: tests, as if the save had just been loaded)
  Object.defineProperty(_, 'restoring', { get: () => restoring, configurable: true });
})();

// ============================================================ the shared looks, the people of another world, the clock, init
(() => {
  const T = TIME, _ = T._, A = T.API, OFF = A.OFF;
  const G = () => _.G;

  // ------------------------------------------------------------ the look of each world, shared with past.js and future.js
  // (Alba's own Past and Future do this themselves; a region TIME dresses gets the same: dress.look = 'past' | 'future')
  //   the Past: past.js's light (a warm sky of its own, the hour's palette, the old photograph's sepia over the picture)
  //   the Future: future.js's drained screen (its overlay's backdrop filter), a low gray fog, dimmer light, no birds
  const FOG_G = new THREE.Color('#a3a1ae');
  let lookOn = null, lights = null;
  T.look = {
    apply(kind, dt, k) {
      const g = G(); if (!g) return;
      if (kind === 'past' && typeof PAST !== 'undefined' && PAST._) { try { PAST._.build(); PAST._.applyLight(dt, 1); } catch (e) { console.error('[time] past look', e); } }
      if (kind === 'future' && typeof FUTURE !== 'undefined' && FUTURE._) {
        const D = _.dressNow(), kk = k != null ? k : D && D.k ? D.k(A) : 0.3;
        try { FUTURE._.tintOn(true); FUTURE._.tintK(kk); } catch (e) { /* */ }
        const fog = g.w3d.scene.fog; fog.color.lerp(FOG_G, 0.8 * (1 - kk * 0.7)); fog.near = lerp(12, 40, kk); fog.far = lerp(92, 210, kk);
        if (!lights) lights = g.w3d.scene.children.filter(o => o.isLight && (o.isHemisphereLight || o.isDirectionalLight));
        lights.forEach(l => { l.intensity *= lerp(0.8, 1, kk); });
        g.fx.birds = kk > 0.9 ? 0.5 : 0;
      }
      lookOn = kind;
    },
    off() {
      const g = G();
      if (lookOn === 'past' && typeof PAST !== 'undefined' && PAST._ && PAST._.restoreLight) { try { PAST._.restoreLight(); } catch (e) { /* */ } }
      if (lookOn === 'future' && typeof FUTURE !== 'undefined' && FUTURE._) { try { FUTURE._.tintOn(false); } catch (e) { /* */ } if (g) g.fx.birds = null; }
      lookOn = null;
    },
    get on() { return lookOn; },
  };

  // ------------------------------------------------------------ the people of another world (a region TIME dresses)
  // dress.people: [{ id, name ('Inés' or { es, pt, de, zh, ja, en }), look (past.js's person look: skin, hair, hairdo, dress,
  //   apron, hat…, kid, h), at: { x, z, yaw }, lines: [{ en, es, pt, de, zh, ja }, …] (said in turn, mixed by the weave), run
  //   (a Talk of their own, instead of the lines) }]. They stand where they're put, breathe, turn to you, and talk.
  const PPL = {};          // 'region:world' → [{ def, g, body, api, solid, n }]
  const nameOf = def => { const n = def.name, l = A.lang(); if (!n) return ''; if (typeof n === 'string') return n; return A.plainT(n[l] || n.en || ''); };
  T.people = {
    build(R, w) {
      const key = R.id + ':' + w, d = R.dress[w]; if (PPL[key] || !d || !d.people || !d.people.length) return;
      if (typeof PAST === 'undefined' || !PAST.API || !PAST.API.personKit) return;
      const g0 = G(), list = PPL[key] = [];
      for (const def of d.people) {
        try {
          const look = def.look || {}, { k, top } = PAST.API.personKit(look), g = new THREE.Group(), body = new THREE.Group(); g.add(body); k.build(body);
          const h = look.h || (look.kid ? 0.78 : 1); g.scale.setScalar(h);
          const at = def.at, y = A.gy(at.x, at.z);
          g.position.set(at.x, y, at.z); g.rotation.y = at.yaw || 0; g.visible = false; g.name = 'time-person-' + def.id; g0.w3d.scene.add(g);
          const api = { id: def.id, name: nameOf(def), x: at.x, y, z: at.z, top: top * h + 0.1, talking: false, yaw: at.yaw || 0 };
          const solid = { x: OFF, z: OFF, _x: at.x, _z: at.z, r: look.kid ? 0.32 : 0.4, time: true }; WORLD.extra.push(solid);
          list.push({ def, g, body, api, solid, n: 0, ph: (def.id.length * 1.37) % 6.28 });
        } catch (e) { console.error('[time] person', def && def.id, e); }
      }
    },
    show(R, w, on) { (PPL[R.id + ':' + w] || []).forEach(P => { P.g.visible = on; P.solid.x = on ? P.solid._x : OFF; P.solid.z = on ? P.solid._z : OFF; if (on) P.api.name = nameOf(P.def); }); },
    talk(w, rid) {
      const list = PPL[rid + ':' + w]; if (!list || w === 'now') return [];
      return list.filter(P => P.g.visible).map(P => ({ x: P.api.x, z: P.api.z, r: 2.3, label: 'Talk', who: w + ':' + P.def.id, p: P.api, run: () => T.people.say(P) }));
    },
    say(P) {
      if (P.def.run) return P.def.run(A, P.api);
      const L = P.def.lines || []; if (!L.length) return null;
      const T0 = L[P.n++ % L.length], l = A.lang();
      P.api.lines = { en: T0.en || '', [l]: T0[l] || '' };
      return STORY.sayInline(P.api);
    },
    animate(R, w, dt, t) {
      const g = G(), Y = g.sim.you;
      for (const P of PPL[R.id + ':' + w] || []) {
        if (!P.g.visible) continue;
        const a = P.api, near = Math.hypot(Y.x - a.x, Y.z - a.z) < 4.5;
        P.body.position.y = a.talking ? Math.abs(Math.sin(t * 12 + P.ph)) * 0.05 : 0;
        P.body.rotation.z = Math.sin(t * 1.2 + P.ph) * 0.03;
        P.g.rotation.y = dampAngle(P.g.rotation.y, near || a.talking ? Math.atan2(Y.x - a.x, Y.z - a.z) : a.yaw, 4, dt);
      }
    },
    dots(w, rid) { return (PPL[rid + ':' + w] || []).filter(P => P.g.visible).map(P => ({ x: P.api.x, z: P.api.z })); },
    get all() { return PPL; },
  };
  // where the minimap draws this world's people (a region with a room of its own gives its own: dress.dots(api))
  T.dots = () => {
    const w = T.world(), rid = T.regionNow(); if (w === 'now' || !rid) return [];
    const D = _.dressNow(); let out = [];
    if (D && D.dots) { try { out = D.dots(A) || []; } catch (e) { out = []; } }
    return out.concat(T.people.dots(w, rid));
  };

  // ------------------------------------------------------------ play time per language band (DESIGN.md 18.2: the 300–500-hour goal)
  // Counted while you play (not on the title, not with the window hidden, not after 3 minutes with no key, click or step), in
  // state.bandTime[lang][band], the band being DICT.bands()'s overall estimate (checked every 20 s).
  const B5 = ['A0', 'A1', 'A2', 'B1', 'B2'];
  let lastInput = performance.now(), band = null, bandT = 0;
  if (typeof addEventListener === 'function') ['keydown', 'pointerdown', 'pointermove', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { lastInput = performance.now(); }, { passive: true, capture: true }));
  function bandNow() {
    try { if (typeof DICT !== 'undefined' && DICT.ready && DICT.ready()) { const b = DICT.bands(); return B5[Math.max(0, Math.min(4, b.overall | 0))]; } } catch (e) { /* */ }
    return band || 'A0';
  }
  function clock(dt) {
    const g = G(); if (!g || !g.state || !g.state.flags || !g.state.flags.hatched) return;
    if (document.hidden || document.body.classList.contains('on-title')) return;
    const Y = g.sim && g.sim.you; if (Y && Y.speed > 0.2) lastInput = performance.now();
    if (performance.now() - lastInput > 180000) return;
    if ((bandT -= dt) <= 0 || !band) { bandT = 20; band = bandNow(); }
    const l = g.state.lang || 'es', B = g.state.bandTime || (g.state.bandTime = {}), o = B[l] || (B[l] = {});
    o[band] = (o[band] || 0) + Math.min(dt, 0.25);
  }
  const fmt = s => { const m = Math.floor((s || 0) / 60); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
  const LANG_EN = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  function bandHTML() {
    const g = G(); if (!g) return '';
    const l = g.state.lang || 'es', o = (g.state.bandTime || {})[l] || {}, cur = bandNow();
    const total = B5.reduce((a, b) => a + (o[b] || 0), 0), toB1 = B5.slice(0, 3).reduce((a, b) => a + (o[b] || 0), 0);
    const max = Math.max(1, ...B5.map(b => o[b] || 0));
    let h = `<div class="mt"><h4 class="ph-h">Hours at each level</h4>`;
    for (const b of B5) {
      const s = o[b] || 0; if (!s && b !== cur) continue;
      h += `<div class="mt-row"><span class="k">${b}</span><span class="b ${s ? '' : 'none'}">${b}</span><span class="mt-bar"><i style="width:${Math.round(s / max * 100)}%"></i></span><span class="d">${fmt(s)} of active play${b === cur ? ' · <b>your level now</b>' : ''}</span></div>`;
    }
    const pct = Math.min(100, Math.round(toB1 / (300 * 3600) * 100));
    h += `<p class="note">Going from A0 to B1 usually takes 300–500 hours. You’ve had ${fmt(total)} of active play in ${A.esc(LANG_EN[l] || l)} counted at each level (${fmt(toB1)} before B1: about ${pct}% of the 300-hour low end). Active play only counts while you’re playing: not on the title screen, and not after three minutes away from the keys, so it can be less than the time played at the top. (The levels follow the estimate as it was then.)</p></div>`;
    return h;
  }
  function wrapMeter() {
    if (typeof METER === 'undefined' || !METER.TABS) return false;
    const tab = METER.TABS.find(t => t.id === 'talk-level'); if (!tab) return false;
    if (tab._time) return true;
    const h0 = tab.html;
    tab.html = function () { let h = ''; try { h = h0.apply(this, arguments); } catch (e) { console.error('[time] meter', e); } try { h += bandHTML(); } catch (e) { console.error('[time] band page', e); } return h; };
    tab._time = true;
    return true;
  }

  // ------------------------------------------------------------ init (main.js, after FUTURE.init)
  function init(game) {
    _.G = game;
    // today's cracks, the effects' things and the spots to press E on: outdoors, through STORY.extra (in the Past and the Future,
    // past.js and future.js list them themselves; in a world TIME dresses, the room does)
    if (typeof STORY !== 'undefined' && STORY.extra) STORY.extra.push({ interactables: () => (T.world() === 'now' ? T.interactables() : []) });
    if (!wrapMeter()) setTimeout(wrapMeter, 0);
    for (const R of Object.values(T.REGIONS)) if (R.init) { try { R.init(A); } catch (e) { console.error('[time] init', R.id, e); } }
  }
  T.init = init;
  T.clock = clock;
  T.bandNow = bandNow;
  Object.assign(_, { bandHTML, wrapMeter, fmt, lastInputAt: () => lastInput });
})();
