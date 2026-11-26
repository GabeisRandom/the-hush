'use strict';
// LAKE_FROGS (P7b, playtest 7: "u might have to force more frogs into the mirror lake area because i can just avoid them with no
// problem and they seem kinda crucial for learning left, middle, and right").
//   • Frog groups where you have to pass (into WORLD.L.roamers, before main.js reads them): the road down to the river and the
//     raft, the road on into Remanso, and the main pier, the way to Marina's house and the ferry. They see you from 10 m (other
//     foes: 7) and hop after you faster (3.4 against 2.6); the one on the pier keeps to the boards (main.js updateFoes reads
//     home.spot / chase / yAt / canGo). Most are look-alikes, so you have to say which one. The region's first four groups see
//     farther and chase faster too.
//   • One frog fight on the road west that the main path can't skip: the first time you walk it after the first bell (the band
//     x −96…−88 runs across the whole meadow), three frogs that look the same hop onto the road in front of you. Each says which
//     one it is, whole in the language with the words marked («¡Yo soy la de la izquierda!», «Eu sou o da esquerda!», «Ich bin
//     der Linke!», «我是左边的！», «わたしは左のカエル！»), hopping as it does; then you say what it means. The fight asks you to
//     say which one (tier 2 at least, so battle/flow.js's own lesson first has the coach teach Mimo «izquierda», «medio» and
//     «derecha»). Won: the road is clear for good (state.flags.frogRoad). Run from or lost: the frogs wait on the road.
//     From then on every lake fight with look-alike frogs asks the same (not the bosses or the time worlds).
//   LAKE_FROGS.GROUPS · ROAD · SAY / MARKS · road() (state, tests) · check() → [problems]
const LAKE_FROGS = (() => {
  const WATER = -0.4, LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const ok = (x, z) => typeof WORLD !== 'undefined' && WORLD.groundAt(x, z, 1.2) > WATER + 0.3;     // dry land, or a deck over the water
  const roomy = (x, z) => ok(x, z) && ok(x + 0.45, z) && ok(x - 0.45, z) && ok(x, z + 0.45) && ok(x, z - 0.45);   // (and not on the very edge of a boardwalk)
  // ------------------------------------------------------------ the groups on the paths
  const F = c => ({ kind: 'frog', color: c });
  const GROUPS = [
    { id: 'raftRoad', x: -105, z: -149, foes: [F('blue'), F('blue')], spot: 10, chase: 3.4 },                    // the road down to the river and the raft
    { id: 'roadIn', x: -131, z: -150.4, foes: [F('yellow'), F('yellow'), F('green')], spot: 10, chase: 3.4 },     // the road on from the river into Remanso (not in the village, where you stay a while: up close each frog is ~100 draw calls)
    { id: 'pier', x: -175, z: -152, deck: true, foes: [F('green'), F('green'), F('green')], spot: 9, chase: 3.2 }, // the main pier: to Marina's and the ferry
  ].map(g => Object.assign({ area: 'lake', biome: 'lake', frogs: true, canGo: roomy }, g, g.deck ? { yAt: (x, z) => WORLD.groundAt(x, z, 1.2) } : {}));
  if (typeof WORLD !== 'undefined' && WORLD.L && Array.isArray(WORLD.L.roamers)) {
    for (const r of WORLD.L.roamers) if (r.area === 'lake' && r.foes.some(f => f.kind === 'frog')) { r.spot = r.spot || 9.5; r.chase = r.chase || 3.2; if (!r.canGo) r.canGo = ok; }
    for (const g of GROUPS) if (!WORLD.L.roamers.some(r => r.id === g.id && r.frogs)) WORLD.L.roamers.push(g);
  }

  // ------------------------------------------------------------ the fight on the road: what the frogs say
  const SAY = {
    left: { en: 'I’m the one on the left!', es: '¡Yo soy la de la izquierda!', pt: 'Eu sou o da esquerda!', de: 'Ich bin der Linke!',
      zh: '[我|wǒ] [是|shì] [左边|zuǒ biān] [的|de] ！', ja: 'わたし は [左|ひだり] の カエル ！' },
    middle: { en: 'I’m the one in the middle!', es: '¡Yo soy la del medio!', pt: 'Eu sou o do meio!', de: 'Ich bin der in der Mitte!',
      zh: '[我|wǒ] [是|shì] [中间|zhōng jiān] [的|de] ！', ja: 'わたし は [真|ま]ん[中|なか] の カエル ！' },
    right: { en: 'And I’m the one on the right!', es: '¡Y yo soy la de la derecha!', pt: 'E eu sou o da direita!', de: 'Und ich bin der Rechte!',
      zh: '[我|wǒ] [是|shì] [右边|yòu biān] [的|de] ！', ja: 'わたし は [右|みぎ] の カエル ！' },
    which: { en: 'Which one of us? Ribbit!', es: '¿Cuál de nosotras? ¡Croac!', pt: 'Qual de nós? Croac!', de: 'Welcher von uns? Quak!',
      zh: '[哪|nǎ] [一|yī] [只|zhī] ？ [呱|guā] [呱|guā] ！', ja: 'どれ が どれ ？ ケロケロ ！' },
  };
  const MARKS = {
    left: { es: [['la de la izquierda', 'the one on the left']], pt: [['o da esquerda', 'the one on the left']], de: [['der Linke', 'the one on the left']],
      zh: [['[左边|zuǒ biān] [的|de]', 'the one on the left']], ja: [['[左|ひだり] の', 'on the left']] },
    middle: { es: [['la del medio', 'the one in the middle']], pt: [['o do meio', 'the one in the middle']], de: [['der in der Mitte', 'the one in the middle']],
      zh: [['[中间|zhōng jiān] [的|de]', 'the one in the middle']], ja: [['[真|ま]ん[中|なか] の', 'in the middle']] },
    right: { es: [['la de la derecha', 'the one on the right']], pt: [['o da direita', 'the one on the right']], de: [['der Rechte', 'the one on the right']],
      zh: [['[右边|yòu biān] [的|de]', 'the one on the right']], ja: [['[右|みぎ] の', 'on the right']] },
    which: { es: [['Cuál', 'which one']], pt: [['Qual', 'which one']], de: [['Welcher', 'which one']], zh: [['[哪|nǎ] [一|yī] [只|zhī]', 'which one']], ja: [['どれ', 'which one']] },
  };
  // the three phrases in your line after it (what they mean), in the save's script
  const PHRASE = { es: ['la de la izquierda', 'la del medio', 'la de la derecha'], pt: ['o da esquerda', 'o do meio', 'o da direita'], de: ['der Linke', 'der in der Mitte', 'der Rechte'],
    zh: ['[左边|zuǒ biān] [的|de]', '[中间|zhōng jiān] [的|de]', '[右边|yòu biān] [的|de]'], ja: ['[左|ひだり] の カエル', '[真|ま]ん[中|なか] の カエル', '[右|みぎ] の カエル'] };
  const NAME = { es: 'Rana', pt: 'Sapo', de: 'Frosch', zh: 'Frog', ja: 'Frog' };
  const ROAD = { x0: -96, x1: -88, color: 'green' };

  let G = null;
  const L = () => (typeof UI !== 'undefined' && UI.lang) || 'es';
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK && CJK.isCJK(L());
  const plain = s => (isC() ? CJK.plain(s, { lang: L(), cap: false }) : s);
  const S = () => (G && G.state) || null;
  const now = () => typeof TIME === 'undefined' || !TIME.world || TIME.world() === 'now';
  const roomNow = () => !!(G && G.indoorMod && G.indoorMod());

  // ------------------------------------------------------------ the three frogs on the road (built the first time they're needed)
  const R = { frogs: null, on: false, C: null, right: null, hop: [0, 0, 0], t: 0, landed: 0 };
  function build() {
    if (R.frogs || !G || typeof BATTLE === 'undefined' || !BATTLE.buildFoe) return !!R.frogs;
    R.frogs = [0, 1, 2].map(() => { const m = BATTLE.buildFoe('frog', ROAD.color, { size: 'small' }); m.visible = false; G.w3d.scene.add(m); return m; });
    return true;
  }
  const spotOf = k => ({ x: R.C.x + R.right.x * (k - 1) * 1.35, z: R.C.z + R.right.z * (k - 1) * 1.35 });
  function show(on) { R.on = on; if (R.frogs) R.frogs.forEach(m => { m.visible = on; }); }
  // every frame (STORY.update runs every frame, scenes too): the frogs bob, hop in, hop when they speak, face you
  function tick(dt) {
    if (!R.on || !R.frogs || !G) return;
    R.t += dt; R.landed = Math.min(1, R.landed + dt * 1.6);
    const Y = G.sim.you;
    R.frogs.forEach((m, k) => {
      const p = spotOf(k), from = { x: p.x + R.right.x * (k - 1) * 4, z: p.z + R.right.z * (k - 1) * 4 - (k === 1 ? 3 : 0) };
      const e = Math.min(1, R.landed * 1.25 - k * 0.15), u = Math.max(0, e), x = from.x + (p.x - from.x) * u, z = from.z + (p.z - from.z) * u;
      R.hop[k] = Math.max(0, R.hop[k] - dt);
      const y = WORLD.groundAt(x, z, 1.2) + Math.sin(Math.PI * u) * (u < 1 ? 1.1 : 0) + Math.sin(Math.PI * R.hop[k] / 0.5) * 0.55 * (R.hop[k] > 0 ? 1 : 0);
      m.position.set(x, y, z); m.rotation.y = Math.atan2(Y.x - x, Y.z - z);
      if (m.userData.animate) { m.userData.mood = 'alert'; m.userData.animate(dt, R.t + k * 0.7, R.hop[k] > 0 || u < 1 ? 2 : 0); }
    });
  }
  const hop = k => { R.hop[k] = 0.5; try { Sound.play('jump'); } catch (e) { /* */ } };

  // ------------------------------------------------------------ the scene, then the fight
  let forceTier = 0;
  async function roadScene() {
    const s = S(); if (!s || !build()) return;
    const sim = G.sim, Y = sim.you, cam = G.cam;
    // ahead of you, the way you're walking: west to the river from Alba, east back to it
    const dir = Y.x >= (ROAD.x0 + ROAD.x1) / 2 ? -1 : 1, f = { x: dir, z: 0 };
    R.right = { x: 0, z: dir };                          // (your right as the camera sees it, facing f: west → north (−z), east → south)
    R.C = { x: Y.x + f.x * 4.6, z: Y.z };
    R.landed = 0; R.hop = [0, 0, 0]; show(true);
    sim.lock = 1;
    // (the meadow's own frogs give the three the stage: they hop off for a while, main.js roamerBeaten, so no fight follows this one)
    WORLD.L.roamers.forEach((r, i) => { if (r.area === 'lake' && Math.hypot(r.x - Y.x, r.z - Y.z) < 22 && G.roamerBeaten) G.roamerBeaten(i); });
    const look = { x: R.C.x, z: R.C.z }, gy = WORLD.groundAt(R.C.x, R.C.z, 1.2);
    // (from behind you and up high, looking over your head: the screen's left is your left, and you hide none of them)
    cam.override = { pos: new THREE.Vector3(Y.x - f.x * 3.6, gy + 5.0, Y.z - f.z * 3.6 + 0.01), look: new THREE.Vector3(look.x, gy + 0.3, look.z), dur: 0.9 };
    sim.mimoGo(null, look);
    try { Sound.play('poof'); } catch (e) { /* */ }
    await STORY.wait(1.3);
    const l = L(), demo = !s.flags.frogRoadSeen;
    if (demo) {
      const name = NAME[l] || 'Frog';
      for (const [k, key] of [[0, 'left'], [1, 'middle'], [2, 'right']]) {
        const p = spotOf(k), at = { x: p.x, z: p.z, y: WORLD.groundAt(p.x, p.z, 1.2), top: 0.9, name };
        sim.mimoGo(null, p); hop(k);
        await STORY.demoLine(at, SAY[key], MARKS[key]);
      }
      [0, 1, 2].forEach(hop);
      const c = spotOf(1);
      await STORY.demoLine({ x: c.x, z: c.z, y: WORLD.groundAt(c.x, c.z, 1.2), top: 0.9, name }, SAY.which, MARKS.which);
      const P = PHRASE[l] || PHRASE.es;
      sim.mimoGo(null);
      await STORY.you(`«${plain(P[0])}», «${plain(P[1])}», «${plain(P[2])}»: the one on the left, in the middle, on the right! They all look the same, so I'll tell {mimo} where the one I mean is.`);
      s.flags.frogRoadSeen = true;
    } else await STORY.you('The three frogs again, all the same. Left, middle, right: say where the one you mean is!');
    cam.override = null; sim.lock = 0;
    // the fight: three look-alikes, so you have to say which one (tier 2 at least: the coach's lesson first teaches the words)
    forceTier = 2;
    let r = null;
    try { r = await G.fight({ foes: [0, 1, 2].map(() => ({ kind: 'frog', color: ROAD.color, size: 'small' })), place: { x: R.C.x, z: R.C.z, biome: 'lake' } }); }
    finally { forceTier = 0; }
    const out = r && r.outcome;
    if (out === 'win') {
      s.flags.frogRoad = true; show(false);
      if (typeof UI !== 'undefined') UI.toast('The frogs hop away! The road to the river is clear.');
      if (G.save) G.save();
      return;
    }
    if (out === 'lose') {               // (as the story's own fights: you come to by Rosa's stall, with every heart; the frogs wait)
      show(false);
      await UI.fade(1, 400); G.respawn(); await UI.fade(0, 500);
    } else {                            // ran: a few steps back the way you came; they're still on the road
      Y.x = dir < 0 ? ROAD.x1 + 2.5 : ROAD.x0 - 2.5; sim.snap(); show(false);
      if (typeof UI !== 'undefined') UI.toast('The three frogs still block the road. Tell Mimo which one!');
    }
    s.flags.z_frogroad = false;          // (walk on, and they hop out again)
    if (G.save) G.save();
  }
  // ------------------------------------------------------------ setup
  // two or more frogs that look the same (one color, one size): only a place tells them apart
  const lookAlikes = o => { const fr = ((o && o.foes) || []).filter(f => f && f.kind === 'frog'); return fr.some((f, i) => fr.findIndex(g => g.color === f.color && (g.size || 'small') === (f.size || 'small')) !== i); };
  function wrapStart() {
    if (typeof BATTLE === 'undefined' || !BATTLE.start || BATTLE.start._frogs) return;
    const s0 = BATTLE.start;
    BATTLE.start = function (opts = {}) {
      // the road fight, and after it every lake fight with look-alike frogs: you say which one (tier 2 at least; the coach teaches
      // any place word Mimo doesn't know yet)
      const s = S(), lake = !!(opts && !opts.boss && !opts.realm && opts.place && opts.place.biome === 'lake' && lookAlikes(opts) && s && s.flags.frogRoadSeen);
      if ((forceTier || lake) && opts && !opts.practice && !opts.tutorial) { const t = typeof LEX !== 'undefined' && LEX.tier ? LEX.tier() : 1; opts = Object.assign({}, opts, { tier: Math.max(forceTier || 2, t) }); }
      return s0.call(this, opts);
    };
    BATTLE.start._frogs = true;
  }
  if (typeof STORY !== 'undefined') {
    if (STORY.init && !STORY.init._frogs) { const i0 = STORY.init; STORY.init = function (game) { G = game; wrapStart(); return i0.apply(this, arguments); }; STORY.init._frogs = true; }
    if (STORY.update && !STORY.update._frogs) { const u0 = STORY.update; STORY.update = function (dt) { try { tick(dt); } catch (e) { console.error('[frogs]', e); R.on = false; } return u0.apply(this, arguments); }; STORY.update._frogs = true; }
    const zones = STORY._test && STORY._test.zones;
    if (zones && !zones.some(z => z.id === 'frogroad')) zones.push({ id: 'frogroad', scene: true,
      test: (x, z) => { const s = S(); return !!s && !!s.flags.millFree && !s.flags.frogRoad && x > ROAD.x0 && x < ROAD.x1 && z > -175 && z < -125 && now() && !roomNow(); },
      run: () => STORY.run(roadScene) });
  }

  // ------------------------------------------------------------ checks (tests)
  function check() {
    const bad = [];
    for (const k of Object.keys(SAY)) for (const l of LANGS.concat('en')) if (!SAY[k][l]) bad.push(`SAY.${k}.${l} missing`);
    for (const k of Object.keys(MARKS)) for (const l of LANGS) {
      const m = MARKS[k][l]; if (!m || !m.length) { bad.push(`MARKS.${k}.${l} missing`); continue; }
      for (const [w] of m) {
        const line = SAY[k][l];
        if (l === 'zh' || l === 'ja') { const toks = w.split(' '); if (!toks.every(t => line.includes(t))) bad.push(`MARKS.${k}.${l}: «${w}» not in the line`); }
        else if (!line.toLowerCase().includes(w.toLowerCase())) bad.push(`MARKS.${k}.${l}: «${w}» not in the line`);
      }
    }
    for (const l of LANGS) if (!PHRASE[l] || PHRASE[l].length !== 3) bad.push(`PHRASE.${l}`);
    if (typeof CJK !== 'undefined' && CJK.validate) for (const k of Object.keys(SAY)) for (const l of ['zh', 'ja']) { try { const p = CJK.validate(SAY[k][l]); if (p && p.length) bad.push(`SAY.${k}.${l}: ${p.join('; ')}`); } catch (e) { bad.push(`SAY.${k}.${l}: ${e.message}`); } }
    if (typeof WORLD !== 'undefined') for (const g of GROUPS) if (!ok(g.x, g.z)) bad.push(`group ${g.id}: not on walkable ground`);
    return bad;
  }
  return { GROUPS, ROAD, SAY, MARKS, PHRASE, check, road: () => ({ on: R.on, C: R.C, flags: S() ? { won: !!S().flags.frogRoad, seen: !!S().flags.frogRoadSeen } : null }), _: { roadScene, tick, show, get forceTier() { return forceTier; } } };
})();
