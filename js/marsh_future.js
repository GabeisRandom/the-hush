'use strict';
// Candil tomorrow (DESIGN.md 21.1; game/TIME.md §25 "The Gray Marsh (T4c)"): if nobody speaks up, the marsh turns to stone. The water is
// gone to a dry stone basin, the willows and reeds are stone (all of that is TIME.land's: time_marsh_land.js), and so is everyone in
// Candil, each on a hopeless thought («Aunque cantara, nadie me oiría»). Only Lucero still talks, about fifty now, the last
// lamplighter, with the one lantern still lit. TIME dresses it (time_marsh.js MARSHT.DRESS.future): today's people, Bruno, the wisps,
// the ground mist, the dark water and today's punt are set aside (MARSHT.hideToday + hideOld here); the great lantern on its column is
// cold (its own pane and glow here, lit once everyone imagines it together); the drowned chapel lies on the dry bed, a stone slab
// sealing its door.
// The people of tomorrow (TIME's person kit, each of stone until a what-if wakes them: a material that drains to stone gray and fills
// back): Lucero; old Marisol (at the shrine), the old twins Ramiro and Tadeo (by the dock), Lolo (by his old puppet sheet), Mati (at
// the causeway's foot), and Mati's daughter, Lucero's apprentice (by the lamplighters' hut). Statues don't turn to look at you.
// The main path (MARSHT.FSTEPS): Lucero, her demonstration, the card, her question → answer four of them with a what-if each (Tadeo
// is a side quest's) → all together: «Si encendiéramos el gran farol, la piedra se rompería» (the great lantern lights, the girl
// wakes, the chapel's seal cracks) → the Stone Chapel (marsh_future_dungeon.js) → the Stone Gargoyle (marsh_time_boss.js) → the echo
// → the stone comes off Candil (TIME.flag('future', 'mhFree'): TIME.land's heal, a spring by the jetty) → Noa.
// Side quests (QUESTS.LIST): «Old Marisol's message» (cross-time: she asks you to tell today's Nieves, word for word, «Si alguien le
//   enseñara la canción de la tarde a Mati, la campana nunca se callaría»; today Nieves starts teaching Mati at the shrine; tomorrow
//   Mati knows the song, and the stone bell rings once), «Lolo's shadows» (three what-ifs for his hand on the sheet: a bird, a fish, a
//   frog), «The twins' boat» (wake old Tadeo; once the water's back, the twins have a little boat on the spring).
const MH_FUT = (() => {
  if (typeof TIME === 'undefined' || typeof MARSHT === 'undefined' || !MARSHT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = MARSHT, MS = MARSH, T = () => MHFTXT;
  const G = () => A.G;
  const st = () => M.st('future');
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are (checked with MARSHT._.t.probe in every world)
  const AT = {
    lucero: { x: -12.2, z: -331.0, yaw: -0.4 }, marisol: { x: -15.4, z: -342.8, yaw: Math.PI },
    ramiro: { x: -24.9, z: -332.2, yaw: -1.4 }, tadeo: { x: -28.6, z: -333.6, yaw: Math.PI },
    lolo: { x: -6.24, z: -325.65, yaw: -0.35 }, mati: { x: -21.4, z: -341.6, yaw: -2.5 }, candela: { x: -7.2, z: -342.4, yaw: -2.2 },
  };
  // once the water's back, the twins stand by the new spring (TIME.land's heal: a pool at 3.2, −335.0)
  const SPRING = { x: 3.2, z: -335.0, r: 3.0 };
  const AT_FREE = { ramiro: { x: 7.4, z: -332.2, yaw: -2.0 }, tadeo: { x: 7.6, z: -337.4, yaw: -1.2 } };
  const STONED = ['marisol', 'ramiro', 'tadeo', 'lolo', 'mati', 'candela'];
  const C = () => T().CAST;
  const LOOK = {
    lucero: { skin: '#c98e62', hair: '#b8aca0', hairdo: 'bun', dress: '#2f4f6a', vest: '#c9a24a', shawl: '#8a3a2e', hat: 'flat', hatColor: '#3a3036', prop: 'lantern', h: 0.97 },
    marisol: { skin: '#c98e62', hair: '#d8d0c8', hairdo: 'braids', dress: '#3e7fb0', shawl: '#f2e6c9', h: 0.94 },
    ramiro: { skin: '#d9a27a', hair: '#cfc8c0', hairdo: 'short', beard: true, hair2: '#cfc8c0', dress: '#8a5a4a', hat: 'cap', hatColor: '#5a6f4a', h: 0.98 },
    tadeo: { skin: '#d9a27a', hair: '#cfc8c0', hairdo: 'short', beard: true, hair2: '#cfc8c0', dress: '#4f7a8a', hat: 'cap', hatColor: '#5a6f4a', h: 0.98 },
    lolo: { skin: '#efc29a', hair: '#6b3b25', hairdo: 'short', dress: '#5fa05a', vest: '#4a4f66', h: 1.0 },
    mati: { skin: '#a8714a', hair: '#1f1a18', hairdo: 'bun', dress: '#e0743c', apron: '#f2e6c9', h: 0.97 },
    candela: { kid: true, skin: '#b88058', hair: '#1f1a18', hairdo: 'braids', dress: '#f2c94c', apron: '#e0743c', prop: 'lantern', h: 0.6 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('future', id);
  const woke = id => !!(st().woke && st().woke[id]);
  const freed = () => !!TIME.flag('future', 'mhFree');
  const isStone = id => !freed() && STONED.includes(id) && !(id === 'candela' ? !!st().lit : woke(id));
  const wokeN = () => M.WAKE.filter(woke).length;

  // ------------------------------------------------------------ stone people: their own material, drained to stone gray (uGray 1) and
  // filled back with color as they wake (the kit's toon material, cloned, its own shader bit kept)
  const SM = {};          // id → { u, P }
  function stoneMat(orig, start) {
    const m = orig.clone(), u = { uGray: { value: start } }, prev = orig.onBeforeCompile;
    m.onBeforeCompile = function (sh, r) {
      if (prev) prev.call(this, sh, r);
      sh.uniforms.uGray = u.uGray;
      const code = '{ float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); vec3 sv = vec3(0.4 + l * 0.52, 0.39 + l * 0.51, 0.37 + l * 0.49); diffuseColor.rgb = mix(diffuseColor.rgb, sv, uGray); }';
      sh.fragmentShader = 'uniform float uGray;\n' + (sh.fragmentShader.includes('#include <color_fragment>') ? sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  ' + code) : sh.fragmentShader.replace('#include <lights_fragment_begin>', code + '\n#include <lights_fragment_begin>'));
    };
    m.customProgramCacheKey = () => 'mhFStone';
    return { m, u };
  }
  function petrify() {
    for (const P of (TIME.people && TIME.people.all['marsh:future']) || []) {
      const id = P.def.id; if (!STONED.includes(id) || SM[id]) continue;
      let u = null;
      P.body.traverse(o => { if (o.isMesh && o.material && o.material.vertexColors && o.material.isMeshToonMaterial) { const s0 = stoneMat(o.material, isStone(id) ? 1 : 0); o.material = s0.m; u = u || s0.u; if (s0.u !== u) s0.u.uGray = u.uGray; } });
      if (u) SM[id] = { u, P };
    }
  }
  const person = id => (TIME.people && (TIME.people.all['marsh:future'] || []).find(P => P.def.id === id)) || null;
  // a person of tomorrow moved for good (the twins to the spring, once the water's back)
  function relocate(id, at) {
    const P = person(id); if (!P) return;
    const y = gy(at.x, at.z);
    P.g.position.set(at.x, y, at.z); P.g.rotation.y = at.yaw || 0;
    Object.assign(P.api, { x: at.x, y, z: at.z, yaw: at.yaw || 0 });
    P.solid._x = at.x; P.solid._z = at.z; if (P.g.visible) { P.solid.x = at.x; P.solid.z = at.z; }
  }
  function placeAll() { if (freed()) for (const [id, at] of Object.entries(AT_FREE)) relocate(id, at); }
  // the stone lets go: dust, a crack, the color coming back
  async function wakeFx(id) {
    const S0 = SM[id], P = S0 && S0.P; if (!P) return;
    const g = G(), x = P.api.x, z = P.api.z, y = P.api.y;
    snd('crack');
    for (let i = 0; i < 4; i++) { g.w3d.fx.puff(x + (Math.random() - 0.5) * 0.5, y + 0.3 + i * 0.35, z + (Math.random() - 0.5) * 0.5, 7, 0.25, '#b8b4ac'); await wait(0.1); }
    snd('chime');
    await tween(1.2, k => { S0.u.uGray.value = 1 - k; });
    S0.u.uGray.value = 0;
    g.w3d.fx.sparkle(x, y + 1.4, z, 14, ['#fff3c8', '#ffd77a', '#bfe4ff']);
  }

  // ------------------------------------------------------------ the dressing: the great lantern's pane and glow, the chapel's seal, the
  // things the side quests put down (one merged mesh each)
  let built = null;
  const kit = () => PAST.API.Kit();
  const SEAL = (() => { const b = MS.CHAPEL, s = Math.sin(b.rot), c = Math.cos(b.rot), d = MS.CH_DOOR; return { x: d.x + s * 0.3, z: d.z + c * 0.3, ry: b.rot }; })();
  const DOORSPOT = { x: MS.SPOT.chapelDoor.x, z: MS.SPOT.chapelDoor.z };
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, KG = PAST.API.KG;
    const mk = (name, fn) => { const g = new THREE.Group(); g.name = 'mh-fut-' + name; const k = kit(); fn(k); k.build(g); g.visible = false; scene.add(g); return g; };
    built = { solids: [] };
    // the chapel's door, sealed with a stone slab (whole until the great lantern is lit; then split, leaning against the jambs)
    const Y0 = 0.62, R = SEAL.ry, cx = Math.cos(R), sx = Math.sin(R);
    built.seal = mk('seal', k => {
      k.box(SEAL.x, Y0 + 1.35, SEAL.z, 2.1, 2.7, 0.32, '#8d8a84', { ry: R, ink: 0.02 });
      for (let i = 0; i < 5; i++) k.box(SEAL.x + cx * (i - 2) * 0.36, Y0 + 2.6 - (i % 2) * 0.2, SEAL.z - sx * (i - 2) * 0.36, 0.08, 0.3, 0.34, '#7d7a74', { ry: R, ink: 0 });
    });
    built.sealOpen = mk('seal-open', k => {
      for (const s of [-1, 1]) k.box(SEAL.x + cx * s * 1.25 + sx * 0.2, Y0 + 1.2, SEAL.z - sx * s * 1.25 + cx * 0.2, 0.9, 2.4, 0.3, '#8d8a84', { ry: R, rz: s * 0.22, ink: 0.02 });
      for (let i = 0; i < 6; i++) k.add(KG.sphere, SEAL.x + cx * (i - 2.5) * 0.4 + sx * 0.9, Y0 + 0.12, SEAL.z - sx * (i - 2.5) * 0.4 + cx * 0.9, 0.22, 0.14, 0.2, i % 2 ? '#8d8a84' : '#a39f97', { ry: i, ink: 0.006 });
    });
    // the great lantern's panes (cold and gray; lit once everyone imagines it together) and its glow
    const L0 = MS.LANTERN, yl = WORLD.terrainAt(L0.x, L0.z);
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.67, 1.01, 0.67), new THREE.MeshBasicMaterial({ color: '#6a6a70' }));
    pane.position.set(L0.x, yl + 3.55, L0.z); pane.visible = false; scene.add(pane); built.pane = pane;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd77a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.set(L0.x, yl + 3.6, L0.z); glow.scale.setScalar(8); glow.visible = false; scene.add(glow); built.glow = glow;
    // Lolo's shadows: a plane over his old puppet sheet (its silhouette drawn on a canvas, moving while it flies, swims, jumps; the
    // sheet itself is marsh.js's, made the first time anyone asks for it)
    try { if (MS.sides && MS.sides.interactables) MS.sides.interactables({ x: 1e5, z: 1e5 }); } catch (e) { /* (no sheet: the plane alone) */ }
    const hut = MS.HUTS.find(b => b.id === 'kids');
    if (hut) {
      const lx = -hut.w / 2 - 1.0, lz = hut.d / 2 + 0.5, c = Math.cos(hut.rot), s = Math.sin(hut.rot);
      const f = { x: hut.x + c * lx + s * lz, z: hut.z - s * lx + c * lz }, y0 = WORLD.terrainAt(f.x, f.z);
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
      const tx = new THREE.CanvasTexture(cv);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
      m.position.set(f.x + s * 0.04, y0 + 1.3, f.z + c * 0.04); m.rotation.y = hut.rot; m.visible = false; scene.add(m);
      built.shadow = { m, cv, tx, front: { x: f.x + s * 1.7, z: f.z + c * 1.7 }, rot: hut.rot, at: f };
    }
    return built;
  }
  const lit = () => !!st().lit;
  function show(on) {
    const Bt = build();
    Bt.seal.visible = on && !lit(); Bt.sealOpen.visible = on && lit();
    Bt.pane.visible = on; Bt.glow.visible = on;
    if (Bt.shadow) Bt.shadow.m.visible = false;
  }
  let hid = [];
  function update(dt, t) {
    const Bt = built; if (!Bt) return;
    const L1 = lit() ? 1 : 0;
    Bt.pane.material.color.set(L1 ? '#ffe9a0' : '#6a6a70'); Bt.glow.material.opacity = L1 * (0.7 + 0.1 * Math.sin(t * 6));
    Bt.seal.visible = !lit(); Bt.sealOpen.visible = lit();
  }
  // statues don't breathe or turn to look at you (TIME's people kit does both: put back after it, every frame)
  function late(dt) {
    M.showToday(dt, hid);
    for (const id of STONED) {
      const S0 = SM[id]; if (!S0 || !isStone(id)) continue;
      const P = S0.P; P.g.rotation.y = P.api.yaw; P.body.position.y = 0; P.body.rotation.z = 0;
      if (S0.u.uGray.value < 1 && !waking[id]) S0.u.uGray.value = 1;
    }
  }
  const waking = {};
  // today's things that tomorrow aren't there (or aren't like that): the dark water, the lantern's lit panes, today's punt on the water,
  // the stone lanterns' flames
  function hideOld(api) {
    const Bm = M.B(), Mm = M.marshMeshes(), out = [], O = (Bm && Bm.objects) || {};
    const hide = o => { if (o && o.visible !== false) { api.hide(o); out.push(o); } };
    hide(Mm.water);
    if (O.lantern) { hide(O.lantern.pane); hide(O.lantern.glow); }
    if (O.dock && O.dock.punt && O.dock.punt.g) hide(O.dock.punt.g);
    if (O.stones) O.stones.forEach(s => { hide(s.flame); hide(s.core); hide(s.glow); });
    if (O.near) for (const c of O.near.children) if (c.isSprite && c.material && c.material.map === TK.glowTex && Math.abs(c.scale.x - 1.6) < 0.01) hide(c);      // (Candil's little lamps' glow)
    return out;
  }

  // ------------------------------------------------------------ talking to the people of tomorrow (the main path first; side quests come
  // through STORY.talkHooks below, as a little menu)
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const chats = {};
  const cycle = (id, keys) => { chats[id] = ((chats[id] || 0) + 1) % keys.length; return say1(id, keys[chats[id]]); };
  const echoDone = () => !!(G().state.ch4 && G().state.ch4.echoes && G().state.ch4.echoes['marsh.future']);
  function talk(id) {
    const s = st();
    if (id === 'lucero') {
      if (!s.met) return luceroScene();
      if (!s.lit) return wokeN() >= 4 ? litScene() : cycle('lucero', ['lucero.again', 'lucero.chat1', 'lucero.chat2']);
      if (!echoDone()) return cycle('lucero', ['lucero.chapel', 'lucero.chat1', 'lucero.chat2', 'lucero.chat3']);
      return cycle('lucero', ['lucero.done', 'lucero.chat3', 'lucero.chat1']);
    }
    if (isStone(id)) return id === 'candela' || !s.met ? stoneOnly(id) : wakeScene(id);
    if (id === 'tadeo' && freed() && !s.puntDone) return puntDone();
    const keys = [id + '.chat'].concat(ln(id + '.chat2') && (id !== 'tadeo' || freed()) ? [id + '.chat2'] : []);
    return keys.length > 1 ? cycle(id, keys) : say1(id, keys[0]);
  }
  // a statue's thought, before Lucero has shown you how to answer it
  async function stoneOnly(id) {
    await say1(id, id + '.stone');
    if (id === 'candela') M.think('A little girl of stone, with a lamplighter’s lantern. Her mother… is one of the statues too.', 5);
    else M.think('A thought, turned to stone. Lucero, by the great lantern, might know what to do.', 4.5);
  }
  // the main path, 1: Lucero, her what-ifs every night (the demonstration), the card, her question
  async function luceroScene() {
    const s = st(), P = () => who('lucero'); if (!P()) return;
    M.lock(true);
    try { M.frame2(P()); await wait(0.4); await M.say(P(), ln('lucero.hello')); await M.demo(P(), T().DEMO['lucero.demo'], T().MARKS['lucero.demo']); } finally { M.lock(false); }
    await M.card(T().CARDS.si, true);
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln('lucero.task')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.lucero1, { tips: T().TIPS }); if (!r) { M.think('{lucero} is waiting: if there were water, what would the frogs do?', 4.5); return; }
    TIME.grade('mf.lucero', r.letter);
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln('lucero.after')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('{marisol} at the shrine, {ramiro} by the dock, {lolo} by his old sheet, {mati} at the causeway’s foot. A what-if each, out loud.', 6);
  }
  // the main path, 2: a statue's hopeless thought, your what-if, the stone letting go
  async function wakeScene(id) {
    const s = st(), P = () => who(id); if (!P()) return;
    M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln(id + '.stone')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS[id], { tips: T().TIPS }); if (!r) { M.think('The stone is waiting. Imagine it out loud: «Si…, …-ría».', 4); return; }
    TIME.grade('mf.' + id, r.letter);
    (s.woke || (s.woke = {}))[id] = r.letter; G().save();
    M.lock(true);
    try {
      waking[id] = true; M.frame2(P()); await wakeFx(id); waking[id] = false;
      await M.say(P(), ln(id + '.woke'));
    } finally { waking[id] = false; M.lock(false); }
    if (id === 'tadeo') { M.think('The twins’ deal: the day the water comes back, they push the boat out together.', 5); return; }
    const n = wokeN();
    M.think(n >= 4 ? 'All four out of the stone. {lucero}, by the great lantern, has an idea.' : `Out of the stone (${n}/4).`, 5);
  }
  // the main path, 3: everyone together by the great lantern: «Si encendiéramos el gran farol, la piedra se rompería»
  async function litScene() {
    const s = st(), P = () => who('lucero'); if (!P()) return;
    const L0 = MS.LANTERN, yl = WORLD.terrainAt(L0.x, L0.z), g = G();
    M.lock(true);
    try {
      M.frame2(P()); await M.say(P(), ln('lucero.lantern'));
      M.shot(V(L0.x + 7.5, yl + 4.2, L0.z + 8.5), V(L0.x, yl + 2.6, L0.z), 1.0); await wait(1.2);
      await M.say(P(), ln('lit.ask'));
    } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.lit, { tips: T().TIPS }); if (!r) { M.think('{lucero} is waiting, and all of them with her: if we lit the great lantern…', 4.5); return; }
    TIME.grade('mf.lit', r.letter);
    M.lock(true);
    try {
      const all = { id: 'all', name: M.fillEn('Everyone'), x: L0.x, y: yl + 0.2, z: L0.z + 1.2, top: 2.6 };
      M.shot(V(L0.x + 6.5, yl + 3.6, L0.z + 7.5), V(L0.x, yl + 2.8, L0.z), 0.8); await wait(0.6);
      await M.say(all, ln('lit.chorus'));
      snd('bell');
      for (let i = 0; i < 8; i++) { g.w3d.fx.sparkle(L0.x + (Math.random() - 0.5) * 1.4, yl + 3.2 + Math.random() * 1.2, L0.z + (Math.random() - 0.5) * 1.4, 6, ['#ffd77a', '#fff3c8']); await wait(0.08); }
      s.lit = r.letter; G().save();
      const B0 = built; if (B0) { await tween(1.0, k => { B0.glow.material.opacity = k * 0.8; }); }
      // the girl by the lamplighters' hut wakes with the light
      const Cd = who('candela');
      if (Cd) { M.frame2(Cd); waking.candela = true; await wakeFx('candela'); waking.candela = false; await M.say(Cd, ln('candela.woke')); }
      snd('crack'); try { g.w3d.shake(0.25, 0.5); } catch (e) { /* (no shake here) */ }
      M.frame2(P()); await M.say(P(), ln('lucero.lit')); await M.say(P(), ln('lucero.chapel'));
    } finally { waking.candela = false; M.lock(false); }
    M.think('The chapel at the causeway’s end: its seal has cracked. {lucero} is coming with you.', 5.5);
  }
  // the side quests' scenes: old Marisol's message (asked tomorrow, told today), Lolo's shadows, the twins' boat
  async function warnAsk() {
    const s = st(); await say1('marisol', 'warn.ask'); s.warnAsked = true; G().save();
    M.think('Today, grandma {nieves} is at the shrine. Tell her old {marisol}’s message, word for word.', 5);
  }
  const nowPerson = id => { const Bm = M.B(); return Bm && Bm.person ? Bm.person(id) : null; };
  async function warnNow() {
    const s = st(), p = nowPerson('nieves'); if (!p) return;
    const q = { id: 'nieves', name: p.name || 'Nieves', x: p.x, y: p.y, z: p.z, top: 2.1 };
    M.lock(true); try { p.talking = true; M.frame2(q); await M.say(q, ln('warn.now')); } finally { p.talking = false; M.lock(false); }
    const r = await M.ask(T().TASKS.warn, { tips: T().TIPS }); if (!r) { M.think('{nieves} is listening. The message, word for word: «Si alguien le enseñara…»', 4.5); return; }
    TIME.grade('mf.warn', r.letter);
    M.lock(true); try { p.talking = true; M.frame2(q); await M.say(q, ln('warn.done')); TIME.flag('now', 'mfWarn', true); TIME.refresh(); s.warnTold = true; G().save(); } finally { p.talking = false; M.lock(false); }
    G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); snd('chest');
    M.think('Grandma {nieves} and little Mati, singing at the shrine. Tomorrow, will Mati still know it?', 5);
  }
  async function listenNow() {
    const p = nowPerson('nieves'); if (!p) return;
    const q = { id: 'nieves', name: p.name || 'Nieves', x: p.x, y: p.y, z: p.z, top: 2.1 };
    M.lock(true); try { p.talking = true; M.frame2(q); await M.say(q, ln('warn.listen')); snd('sing'); } finally { p.talking = false; M.lock(false); }
  }
  async function listenFuture() {
    const s = st(), P = who('mati'); if (!P || isStone('mati')) { M.think('{mati} is still stone. Wake her first.', 4); return; }
    M.lock(true);
    try { M.frame2(P); await M.say(P, ln('warn.future')); snd('sing'); await wait(1.2); snd('bell'); } finally { M.lock(false); }
    M.think('Far off, at the end of the causeway, the stone bell rings. Once.', 5);
    if (!s.warnHeard) { s.warnHeard = true; G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); snd('chest'); G().save(); }
  }
  // Lolo's shadows: a bird, a fish, a frog on the sheet, each answered with a what-if
  const SIL = {
    bird: (c, x, y, a) => { c.beginPath(); c.ellipse(x, y, 30, 16, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(x + 30, y - 8, 12, 0, TAU); c.fill(); c.beginPath(); c.moveTo(x + 40, y - 10); c.lineTo(x + 58, y - 5); c.lineTo(x + 40, y - 2); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x - 6, y - 4); c.quadraticCurveTo(x - 10, y - 40 * a * s - 10, x - 40, y - 46 * a * s); c.lineTo(x + 8, y - 6); c.fill(); } c.beginPath(); c.moveTo(x - 26, y); c.lineTo(x - 52, y - 14); c.lineTo(x - 50, y + 10); c.fill(); },
    fish: (c, x, y, a) => { c.beginPath(); c.ellipse(x, y, 42, 20, a * 0.2, 0, TAU); c.fill(); c.beginPath(); c.moveTo(x - 36, y); c.lineTo(x - 66, y - 22 + a * 8); c.lineTo(x - 66, y + 22 + a * 8); c.fill(); c.beginPath(); c.moveTo(x - 4, y - 16); c.lineTo(x + 10, y - 34); c.lineTo(x + 18, y - 16); c.fill(); },
    frog: (c, x, y, a) => { c.beginPath(); c.ellipse(x, y + 20, 50, 34, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x, y - 12, 38, 24, 0, 0, TAU); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.arc(x + s * 20, y - 32, 12, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + s * 48, y + 44 - a * 10, 24, 12, s * 0.3, 0, TAU); c.fill(); } },
  };
  function drawShadow(kind, px, py, a) {
    const S0 = built && built.shadow; if (!S0) return;
    const c = S0.cv.getContext('2d'); c.clearRect(0, 0, 256, 256);
    const gr = c.createRadialGradient(128, 128, 10, 128, 128, 126); gr.addColorStop(0, 'rgba(255,226,150,0.95)'); gr.addColorStop(0.7, 'rgba(255,200,110,0.55)'); gr.addColorStop(1, 'rgba(255,190,100,0)');
    c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
    if (kind && SIL[kind]) { c.fillStyle = '#2a2230'; c.strokeStyle = '#2a2230'; SIL[kind](c, px, py, a); }
    S0.tx.needsUpdate = true; S0.m.visible = true;
  }
  async function animShadow(kind) {
    const steps = 36;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps, a = Math.sin(u * Math.PI * 6);
      if (kind === 'bird') drawShadow('bird', 128 + u * 70, 150 - u * 90, a);
      else if (kind === 'fish') drawShadow('fish', 80 + u * 100, 130 + Math.sin(u * Math.PI * 4) * 16, a);
      else drawShadow('frog', 100 + u * 60, 150 - Math.abs(Math.sin(u * Math.PI * 2)) * 60, Math.abs(Math.sin(u * Math.PI * 2)));
      await wait(1.6 / steps);
    }
  }
  async function shadowGame() {
    const s = st(), P = () => who('lolo'), S0 = built && built.shadow; if (!P() || !S0) return;
    const g = G(), y0 = WORLD.terrainAt(S0.at.x, S0.at.z), fx = Math.sin(S0.rot), fz = Math.cos(S0.rot), sx = Math.cos(S0.rot), sz = -Math.sin(S0.rot);
    // (you step aside, to the sheet's other side from Lolo, so nobody stands in the light)
    const Y = g.sim.you; Y.x = S0.at.x + fx * 2.0 - sx * 1.4; Y.z = S0.at.z + fz * 2.0 - sz * 1.4; Y.yaw = S0.rot + Math.PI; g.sim.snap();
    g.cam.override = { pos: V(S0.at.x + fx * 5.5 + sx * 0.4, y0 + 2.0, S0.at.z + fz * 5.5 + sz * 0.4), look: V(S0.at.x, y0 + 1.3, S0.at.z), dur: 0.8 };
    try {
      if (!s.shadowAsked) { s.shadowAsked = true; G().save(); }
      drawShadow('bird', 128, 140, 0.4);
      M.lock(true); try { await M.say(P(), ln('shadow.ask')); } finally { M.lock(false); }
      const kinds = ['bird', 'fish', 'frog'];
      for (let i = s.shadows || 0; i < 3; i++) {
        drawShadow(kinds[i], 128, 140, 0.4); snd('pip');
        const r = await M.ask(T().TASKS['shadow' + (i + 1)], { tips: T().TIPS, icon: 'star' });
        if (!r) { M.think('{lolo} is waiting, his hands up in the light.', 4); return; }
        TIME.grade('mf.shadow' + (i + 1), r.letter);
        await animShadow(kinds[i]); snd('chest');
        s.shadows = i + 1; G().state.coins = (G().state.coins || 0) + 3; G().save();
        if (i < 2) { M.lock(true); try { await M.say(P(), ln('shadow.r' + (i + 1))); } finally { M.lock(false); } }
      }
      M.lock(true); try { await M.say(P(), ln('shadow.done')); } finally { M.lock(false); }
      s.shadowDone = true; G().state.coins = (G().state.coins || 0) + 6; UI.toast('+15 coins'); G().save();
    } finally { g.cam.override = null; if (S0) S0.m.visible = false; }
  }
  async function puntDone() {
    const s = st(); await say1('tadeo', 'punt.done');
    s.puntDone = true; G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); snd('chest'); G().save();
  }
  // the end of the main path (after the gargoyle, marsh_future_dungeon.js): the stone lets go of Candil, the water comes back
  function free() {
    TIME.flag('future', 'mhFree', true); TIME.refresh();
    placeAll();
    G().save();
  }

  // ------------------------------------------------------------ the cross-time pieces: the song circle today (old Marisol's message
  // told), Mati singing tomorrow; the twins' little boat on the spring
  function songCircle() {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, x = MS.SPOT.shrine.x, z = MS.SPOT.shrine.z + 2.6, y = gy(x, z);
    for (const s of [-1, 1]) k.add(KG.cyl, x + s * 0.9, y + 0.22, z, 0.26, 0.44, 0.26, '#8a6440', { ink: 0.008 });
    k.box(x, y + 0.03, z + 0.2, 1.2, 0.04, 0.8, '#c9453a', { ink: 0 });
    k.build(g); g.name = 'mh-songcircle';
    const notes = [];
    for (let i = 0; i < 3; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3c8', transparent: true, opacity: 0.7, depthWrite: false })); sp.scale.setScalar(0.3); sp.position.set(x, y + 1.6, z); g.add(sp); notes.push(sp); }
    return { obj: g, solids: [], update: (dt, t) => notes.forEach((n, i) => { const u = (t * 0.4 + i / 3) % 1; n.position.set(x + Math.sin(u * 6 + i) * 0.5, y + 1.2 + u * 1.4, z); n.material.opacity = 0.8 * Math.sin(u * Math.PI); }) };
  }
  TIME.effect('marsh.warn', { region: 'marsh', when: () => !!TIME.flag('now', 'mfWarn'),
    show: { now: () => songCircle() },
    act: { now: { x: MS.SPOT.shrine.x, z: MS.SPOT.shrine.z + 3.6, r: 1.4, label: 'Listen', run: listenNow },
      future: { x: AT.mati.x + 0.9, z: AT.mati.z + 0.9, r: 1.4, label: 'Listen', run: listenFuture } } });
  function littleBoat() {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG;
    k.box(0, 0.08, 0, 0.7, 0.2, 1.7, '#a8784a', { ink: 0.01 }).box(0, 0.2, 0, 0.62, 0.05, 1.6, '#8a6440', { ink: 0 });
    for (const s of [-1, 1]) k.box(s * 0.33, 0.24, 0, 0.06, 0.18, 1.6, '#7a5434', { ink: 0.004 });
    k.add(KG.cyl6, 0.1, 0.5, 0.3, 0.03, 1.2, 0.03, '#6b4a30', { rx: 0.4, ink: 0 });
    k.build(g); g.name = 'mh-littleboat';
    g.position.set(SPRING.x + 0.6, 0, SPRING.z - 0.4); g.rotation.y = 0.8;
    return { obj: g, solids: [], update: (dt, t) => { const L1 = springY(); g.position.y = (L1 === null ? gy(SPRING.x, SPRING.z) + 0.1 : L1) + Math.sin(t * 1.4) * 0.03; } };
  }
  // the spring's water level (time_marsh_land.js's heal pool), or null
  const springY = () => { try { const Lm = M.LAND; return Lm && Lm.bedY ? Lm.bedY(SPRING.x, SPRING.z) + 0.14 : null; } catch (e) { return null; } };
  TIME.effect('marsh.punt', { region: 'marsh', when: () => !!TIME.flag('future', 'mhFree'), show: { future: () => littleBoat() } });

  // ------------------------------------------------------------ the Talk menus (side quests), and today's Nieves (marsh.js's people have
  // no Talk menu of their own: an E thing next to her)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'future' || TIME.regionNow() !== 'marsh') return null;
    const s = st();
    if (it.who === 'future:marisol' && woke('marisol') && !s.warnAsked) return [{ label: 'A message for today', sub: '◆ side quest', run: warnAsk }];
    if (it.who === 'future:lolo' && woke('lolo') && !s.shadowDone) return [{ label: 'Shadows', sub: '◆ side quest', run: shadowGame }];
    return null;
  });
  if (typeof STORY !== 'undefined' && STORY.extra) STORY.extra.push({ interactables() {
    const g = G(); if (!g || TIME.world() !== 'now' || !TIME.open('marsh')) return [];
    const s = st(); if (!s.warnAsked || TIME.flag('now', 'mfWarn')) return [];
    const n = nowPerson('nieves'); if (!n) return [];
    return [{ x: n.x - 0.9, z: n.z + 0.9, r: 1.6, label: 'A message from tomorrow', run: warnNow }];
  } });

  // ------------------------------------------------------------ E: the chapel's door, the things to look at
  const LOOKS = [
    { id: 'w.ruf_altar', at: { x: -14.0, z: -344.6 }, line: () => 'The {w.ruf_altar} by the causeway, all stone: the flowers, the {w.candle:pl}, even the ribbon on the little {w.lantern}. All {w.lf_gray}.' },
    { id: 'w.mhf_brightness', at: { x: -3.4, z: -342.6 }, line: () => 'The lamplighters’ {w.mhp_oillamp:pl} by the hut’s door, stone, every one. The only {w.mhf_brightness} left in Candil is Lucero’s {w.lantern}.' },
    { id: 'w.mhf_haze', at: { x: -20.2, z: -323.8 }, line: () => 'A gray {w.mhf_haze} over the stone roofs. Not one {w.ml_tile} has moved in years; not even the wind can lift one.' },
    { id: 'w.mhf_halflight', at: { x: -16.6, z: -336.6 }, when: () => !lit(), line: () => 'The great {w.lantern} on its {w.rup_column}: cold and gray. Years of {w.mhf_halflight}, and under it, only {w.mhf_stillness}.' },
    { id: 'w.mhf_glimmer', at: { x: -16.6, z: -336.6 }, when: () => lit(), line: () => 'The great {w.lantern} is burning again. A warm {w.mhf_glimmer} on every stone roof in Candil.' },
    { id: 'w.mhf_figurine', at: { x: -11.6, z: -325.2 }, line: () => 'On a windowsill, a little stone {w.mhf_figurine} of a frog. Was it carved… or was it a real frog once?' },
    { id: 'w.mhf_sculpture', at: { x: -18.2, z: -338.6 }, line: () => 'From a few steps away they look like {w.mhf_sculpture:pl}: {w.mhf_hard}, cold, gray. But put your hand on one, and you can almost feel a {w.mhf_heartbeat}.' },
  ];
  function interactables() {
    const out = [], s = st();
    out.push({ x: DOORSPOT.x, z: DOORSPOT.z, r: 1.8, label: lit() ? 'Go in' : 'Look', run: async () => {
      if (!lit()) { M.lookAt('w.mhf_slab', s.met ? 'The chapel’s door is {w.mhf_sealed} with a stone {w.mhf_slab}. Not a crack in it… yet.' : 'The chapel, stranded on the dry stone. A stone {w.mhf_slab} seals its door.', 5); return; }
      if (typeof MH_FCHAPEL !== 'undefined' && MH_FCHAPEL) await MH_FCHAPEL.enter();
    } });
    const S0 = built && built.shadow;
    if (S0 && woke('lolo') && !s.shadowDone) out.push({ x: S0.front.x, z: S0.front.z, r: 1.6, label: 'Shadows', run: shadowGame });
    for (const L0 of LOOKS) { if (L0.when && !L0.when()) continue; out.push({ x: L0.at.x, z: L0.at.z, r: 1.3, label: 'Look', run: async () => M.lookAt(L0.id, M.fillEn(L0.line()), 6) }); }
    return out;
  }
  function nextId() { const s = st(); return !s.met ? 'lucero' : wokeN() < 4 ? 'wake' : !s.lit ? 'lucero' : 'chapel'; }
  const HINTS = { lucero: '{mimo} points at the one warm light in Candil… and someone holding it.', chapel: '{mimo} looks down the causeway at the chapel, stranded on the stone.',
    marisol: '{mimo} points at an old woman of stone at the shrine.', ramiro: '{mimo} points at an old man of stone by the dock.', tadeo: '{mimo} points at another old man of stone, by the boat.',
    lolo: '{mimo} points at a man of stone by an old sheet.', mati: '{mimo} points at a woman of stone at the causeway’s foot.', candela: '{mimo} points at a little girl of stone by the lamplighters’ hut.' };
  function target(id) {
    if (id === 'chapel') return (typeof MH_FCHAPEL !== 'undefined' && MH_FCHAPEL && MH_FCHAPEL.inside && MH_FCHAPEL.target()) || { x: DOORSPOT.x, z: DOORSPOT.z, hint: HINTS.chapel };
    if (id === 'lantern') id = 'lucero';
    if (id === 'wake') { const n = M.WAKE.find(k => !woke(k)); if (!n) return target('lucero'); id = n; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || '{mimo} points.' };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('mh_future') ? 'mh_future' : 'future');
  // how far Candil has come back (the future's song adds its layers as people wake: marsh_time_music.js)
  const wakeShare = () => (freed() ? 1 : Math.min(0.9, (wokeN() + (lit() ? 1 : 0)) / 5));

  // ------------------------------------------------------------ the side quests (QUESTS.LIST: they start as the story reaches them)
  if (typeof QUESTS !== 'undefined') {
    const fS = s => M.sf(s);
    const futAt = id => () => M.via('future', () => target(id));
    if (!QUESTS.LIST.some(q => q.id === 'mf.warn')) QUESTS.LIST.push({ id: 'mf.warn', kind: 'side',
      get title() { return M.fillEn('Old {marisol}’s message'); }, get giver() { return M.fillEn('old {marisol}, at the shrine (the Gray Marsh, tomorrow)'); },
      started: s => !!fS(s).warnAsked,
      steps: [
        { get text() { return M.fillEn('Today: tell grandma {nieves} the message, word for word'); }, get why() { return M.fillEn(`If someone taught Mati the evening song… ${M.sx('warn')}.`); },
          done: s => !!TIME.flag('now', 'mfWarn'), target: () => M.via('now', () => { const n = nowPerson('nieves'); return n ? { x: n.x - 0.9, z: n.z + 0.9, hint: '{mimo} points at grandma Nieves by the shrine.' } : null; }), hint: '{mimo} points at the shrine.' },
        { text: 'Tomorrow: listen to Mati', why: 'Does she still know the evening song?', done: s => !!fS(s).warnHeard,
          target: () => M.via('future', () => ({ x: AT.mati.x, z: AT.mati.z, hint: '{mimo} points at Mati, at the causeway’s foot.' })), hint: '{mimo} points at the causeway’s foot.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'mf.shadows')) QUESTS.LIST.push({ id: 'mf.shadows', kind: 'side',
      get title() { return M.fillEn('{lolo}’s shadows'); }, get giver() { return M.fillEn('{lolo}, by his old puppet sheet (the Gray Marsh, tomorrow)'); },
      started: s => !!fS(s).shadowAsked,
      steps: [
        { get text() { return M.fillEn('Tomorrow: tell {lolo} what his shadows would do ({n}/3)'); }, n: s => Math.min(3, fS(s).shadows || 0), why: 'A bird, a fish, a frog: a what-if for each.',
          done: s => !!fS(s).shadowDone, target: futAt('lolo'), hint: HINTS.lolo },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'mf.punt')) QUESTS.LIST.push({ id: 'mf.punt', kind: 'side',
      get title() { return M.fillEn('The twins’ boat'); }, get giver() { return M.fillEn('old {tadeo}, by the dock (the Gray Marsh, tomorrow)'); },
      started: s => !!(fS(s).woke && fS(s).woke.tadeo) || !!TIME.flag('future', 'mhFree'),
      steps: [
        { text: 'The day the water comes back… (after the Stone Gargoyle)', why: 'The twins’ deal: they push the boat out together.', done: s => !!TIME.flag('future', 'mhFree'), target: futAt('chapel'), hint: HINTS.chapel },
        { get text() { return M.fillEn('Find the twins by the new spring'); }, why: 'Water, by the jetty!', done: s => !!fS(s).puntDone,
          target: () => M.via('future', () => ({ x: AT_FREE.tadeo.x, z: AT_FREE.tadeo.z, hint: '{mimo} points at the twins by the spring.' })), hint: '{mimo} points at the spring.' },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks (TIME calls them)
  Object.assign(M.DRESS.future, {
    people: PEOPLE,
    on(api) { show(true); hid = M.hideToday(api, { past: true }).concat(hideOld(api)); petrify(); placeAll(); },
    off() { show(false); hid = []; },
    entered() { show(true); petrify(); },
    late: (api, dt) => { if (typeof MH_FCHAPEL !== 'undefined' && MH_FCHAPEL && MH_FCHAPEL.inside) MH_FCHAPEL.late(dt); else late(dt); },
    update(api, dt, t) { update(dt, t); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });
  // (the save loaded with people already woken: their color back, the statues' poses kept)
  const changed = (fw, tw) => { if (tw === 'future') { petrify(); for (const id of STONED) if (SM[id]) SM[id].u.uGray.value = isStone(id) ? 1 : 0; placeAll(); } };

  return { AT, AT_FREE, SPRING, PEOPLE, who, build, show, LOOKS, DOORSPOT, SEAL, STONED,
    target: id => target(id), song: () => song(), wakeShare, free, isStone, woke, wokeN, init: () => {}, changed,
    _: { talk: id => talk(id), luceroScene, wakeScene, litScene, warnAsk, warnNow, listenNow, listenFuture, shadowGame, puntDone, drawShadow, petrify, SM, get built() { return built; } } };
})();
