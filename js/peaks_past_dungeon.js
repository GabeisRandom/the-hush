'use strict';
// The White Hollow (the Frost Peaks long ago, DESIGN.md 20 "T3b"): the ice cave under the tower's crag where a boy got lost on a snowy
// night. Four rooms at y 300, z −120, x −430 / −404 / −378 / −352 (over the hills by the far lake, where nobody walks), on the quarry's
// four-room kit (quarry_past_dungeon.js QRKIT.make), turned to ice: going down, each room's way down under a drift until it's done.
// The clockmaker of then walks with you: everything in here is that night, and each room comes back when you tell it how it was
// (the imperfect) and what happened (the preterite), in one sentence.
//   0 the Drift Mouth: «Cuando el niño entró aquí, hacía mucho viento» (the howling wind stops, his footprints glow); then a memory
//     for {mimo}: «{mimo} sopló la nieve» (the drift over the way down blows away)
//   1 the Icicle Hall: snowballs (a fight in the Past's tense), then «Cuando el niño pasó, los carámbanos eran pequeños» (they shrink back)
//   2 the Frozen Falls: «{mimo} saltó al otro lado» (Mimo jumps the chasm and finds the boy's red mitten), then «El puente estaba
//     entero cuando el niño lo cruzó» (the ice bridge comes back)
//   3 the Owl's Hollow: the Blizzard Owl (peaks_time_boss.js); Elio's echo; the clockmaker finds the boy (a memory)
const PK_PCAVE = (() => {
  if (typeof QRKIT === 'undefined' || typeof PEAKT === 'undefined' || !PEAKT) return null;
  const M = PEAKT, T = () => PKPTXT, X = [-430, -404, -378, -352], Z = -120;
  const st = () => { const s = M.st('past'); return s.cave || (s.cave = {}); };
  const pS = () => M.st('past');
  const ln = key => T().LINES[key];
  const guideLook = { skin: '#e6b48c', hair: '#8a7a6e', hairdo: 'bun', dress: '#5a4a6a', apron: '#8a5a3a', glasses: true, hat: 'scarf', hatColor: '#c9453a', prop: 'lantern', h: 1.0 };
  const nm = id => M.nameOf(T().CAST[id]);
  let K = null;
  // a sentence told to the cave (both pasts): the memory comes back
  async function story(key) {
    const r = await M.ask(T().TASKS[key], { tips: T().TIPS, icon: 'star' });
    if (r) TIME.grade('pk.cave.' + key, r.letter);
    return r;
  }
  // a memory: Mimo's move, told in the past (the first time, the Past's card for Mimo, from Chapter 2)
  async function memory(kind) {
    const s = st();
    if (!s.memCard && typeof PAST_SC !== 'undefined' && PAST_SC._ && PAST_SC._.card) { s.memCard = true; try { await PAST_SC._.card('memory'); } catch (e) { /* */ } }
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const r = await M.ask(M.memTask(T().MEM[kind]), { icon: kind === 'jump' ? 'jump' : 'blow' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('pk.mem.' + kind, r.letter); }
    return r;
  }
  const floor = i => { const p = pS(); p.floors = Math.max(p.floors || 0, i + 1); };
  const blowFx = async at => { try { if (PEAKS.mimoBlow) await PEAKS.mimoBlow(at, 1.0); else Sound.play('blow'); } catch (e) { Sound.play('blow'); } };
  // ---------------------------------------------------------- the rooms
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG;
    room.guide = api.person(room, guideLook, room.i === 3 ? { x: R.x - 4.8, z: R.z + 3.2, yaw: 2.4 } : { x: R.x + 4.8, z: R.z + 3.4, yaw: -2.5 }, nm('master'));
    // (frost on every wall: icicles along the top of the back wall, snow banked in the corners)
    for (let i = 0; i < 12; i++) k.add(KG.cone, R.x - 6.2 + i * 1.12, Y0 + 4.9, R.z - 5.7, 0.12, -0.6 - (i * 37 % 7) * 0.12, 0.12, '#e6f4fb', { ink: 0.006 });
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.add(KG.sphere, R.x + sx * 6.3, Y0 + 0.2, R.z + sz * 5.2, 1.1, 0.6, 0.9, '#f4f8fb', { ink: 0.012 });
    if (room.i === 0) {
      // the drift over the way down (it blows away with Mimo's memory), the boy's footprints to it (they glow once the wind stops)
      const w = room.way;
      room.drift = new THREE.Group(); room.g.add(room.drift);
      const dk = PAST.API.Kit(); for (let i = 0; i < 7; i++) dk.add(KG.sphere, w.x + (i % 3 - 1) * 0.6, Y0 + 0.35 + (i > 3 ? 0.3 : 0), w.z + ((i >> 1) % 2 - 0.5) * 0.7, 0.75, 0.55, 0.65, i % 2 ? '#f4f8fb' : '#e2ebf3', { ink: 0.012 }); dk.build(room.drift);
      room.driftSolid = { x: w.x, z: w.z, r: 1.3 }; WORLD.extra.push(room.driftSolid);
      room.prints = [];
      for (let i = 0; i < 8; i++) { const t = i / 7, x = lerp(R.x + 0.4, w.x + 0.9, t), z = lerp(R.z + 4.6, w.z + 0.9, t); const gl = api.glow('#ffe6a8', 0.55, 0); gl.position.set(x + (i % 2 ? 0.14 : -0.14), Y0 + 0.08, z); room.g.add(gl); room.prints.push(gl); k.add(KG.sphere, x + (i % 2 ? 0.14 : -0.14), Y0 + 0.02, z, 0.08, 0.01, 0.12, '#9aa6b4', { ink: 0 }); }
      // the wind: snow driving across the room until the cave remembers
      room.wind = [];
      for (let i = 0; i < 26; i++) { const sp = api.glow('#ffffff', 0.18 + (i % 3) * 0.08, 0.8); sp.material.blending = THREE.NormalBlending; sp.position.set(R.x, Y0 + 1, R.z); room.g.add(sp); room.wind.push({ sp, ph: i * 0.77, h: 0.4 + (i * 53 % 30) / 10, z: (i * 31 % 100) / 100 }); }
      room.windAt = { x: R.x + 1.0, z: R.z + 0.6 };
    }
    if (room.i === 1) {
      // a wall of great icicles across the room's middle (they shrink back as the cave remembers how small they were)
      room.icicles = new THREE.Group(); room.g.add(room.icicles);
      const ik = PAST.API.Kit(); for (let i = 0; i < 11; i++) { const x = R.x - 6.0 + i * 1.2; ik.add(KG.cone, x, Y0 + 5.0, R.z - 0.6, 0.42, -4.6 + (i % 3) * 0.5, 0.42, i % 2 ? '#cfeaf7' : '#b6dcef', { ink: 0.012 }); ik.add(KG.cone, x + 0.6, Y0, R.z - 0.2, 0.3, 1.6 + (i % 2) * 0.6, 0.3, '#dff2fb', { ink: 0.01 }); }
      ik.build(room.icicles, { mat: new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad, emissive: new THREE.Color('#123848') }) });
      room.wall = []; for (let x = R.x - api.HW + 0.5; x < R.x + api.HW; x += 0.8) { const c = { x, z: R.z - 0.5, r: 0.55 }; room.wall.push(c); WORLD.extra.push(c); }
      room.iceAt = { x: R.x + 1.2, z: R.z + 1.6 };
    }
    if (room.i === 2) {
      // a chasm across the room, a frozen waterfall on the back wall; the ice bridge (gone until remembered); the boy's red mitten
      // on the far side (Mimo jumps over for it)
      const cz = R.z - 0.4;
      const ch = new THREE.Mesh(new THREE.PlaneGeometry(api.HW * 2, 1.7), api.mats().hole); ch.rotation.x = -Math.PI / 2; ch.position.set(R.x, Y0 + 0.02, cz); room.g.add(ch);
      for (let i = 0; i < 9; i++) k.add(KG.cyl6, R.x - 2.2 + i * 0.55, Y0 + 2.6, R.z - 5.75, 0.3 + (i % 2) * 0.1, 5.2, 0.18, i % 2 ? '#cfeaf7' : '#a9d3ea', { ink: 0.006 });
      room.bridge = new THREE.Group(); room.g.add(room.bridge);
      const bk = PAST.API.Kit(); for (let j = 0; j < 6; j++) bk.box(R.x + 2.6, Y0 + 0.08, cz - 0.9 + j * 0.36, 1.6, 0.1, 0.3, j % 2 ? '#dff2fb' : '#cfeaf7', { ink: 0.008 }); bk.build(room.bridge); room.bridge.visible = false;
      room.bridgeAt = { x: R.x + 2.6, z: cz + 2.0 };
      room.gap = []; for (let x = R.x - api.HW + 0.5; x < R.x + api.HW; x += 0.8) { const c = { x, z: cz, r: 0.6 }; room.gap.push(c); WORLD.extra.push(c); }
      room.mitten = new THREE.Group(); room.g.add(room.mitten);
      const mk = PAST.API.Kit(); mk.add(KG.sphere, R.x - 3.4, Y0 + 0.12, cz - 2.2, 0.18, 0.08, 0.24, '#c9453a', { ink: 0.008 }).add(KG.sphere, R.x - 3.26, Y0 + 0.12, cz - 2.02, 0.07, 0.06, 0.09, '#c9453a', { ink: 0.006 }); mk.build(room.mitten);
      room.jumpAt = { x: R.x - 3.2, z: cz + 1.9 };
    }
    if (room.i === 3) {
      // the owl's den: a great nest of ice and twigs; the Blizzard Owl asleep in a swirl of its own snow
      room.spot = { x: R.x + 1.0, z: R.z - 2.2 };
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; k.add(KG.ball6, room.spot.x + Math.cos(a) * 1.9, Y0 + 0.25, room.spot.z + Math.sin(a) * 1.5, 0.5, 0.35, 0.4, i % 2 ? '#e2ebf3' : '#8a6a4a', { ry: a, ink: 0.01 }); }
      let owl = null; try { if (typeof PKBOSS !== 'undefined' && PKBOSS && PKBOSS.owlModel) { owl = PKBOSS.owlModel().root; owl.scale.setScalar(1.35); } } catch (e) { owl = null; }
      if (owl) { owl.position.set(room.spot.x, Y0 + 0.35, room.spot.z); room.g.add(owl); }
      room.owl = owl; room.owlSolid = { x: room.spot.x, z: room.spot.z, r: 1.9 }; WORLD.extra.push(room.owlSolid);
      room.swirl = []; for (let i = 0; i < 18; i++) { const sp = api.glow('#ffffff', 0.25 + (i % 3) * 0.1, 0.75); sp.material.blending = THREE.NormalBlending; room.g.add(sp); room.swirl.push({ sp, ph: i / 18 * TAU, h: 0.5 + (i % 5) * 0.6 }); }
      room.orb = api.glow('#ffe6a8', 1.6, 0); room.orb.position.set(room.spot.x, Y0 + 1.6, room.spot.z); room.g.add(room.orb);
      // the memory: the boy curled up by the nest, and a lantern coming (shown only at the end, as silhouettes of light)
      room.boy = new THREE.Group(); room.g.add(room.boy); room.boy.visible = false;
      const by = PAST.API.Kit(); by.add(KG.sphere, room.spot.x - 2.4, Y0 + 0.35, room.spot.z + 1.4, 0.38, 0.32, 0.3, '#d8e4f0', { ink: 0.01 }).add(KG.sphere, room.spot.x - 2.6, Y0 + 0.62, room.spot.z + 1.5, 0.2, 0.2, 0.2, '#d8e4f0', { ink: 0.01 }).add(KG.half, room.spot.x - 2.6, Y0 + 0.74, room.spot.z + 1.5, 0.2, 0.14, 0.2, '#c9453a', { ink: 0.008 });
      by.build(room.boy, { mat: new THREE.MeshBasicMaterial({ color: '#ffffff', vertexColors: true, transparent: true, opacity: 0.6 }), hull: false, shadow: false });
      room.lamp = api.glow('#ffd27a', 2.4, 0); room.lamp.position.set(R.x - 5.6, Y0 + 1.2, R.z + 4.4); room.g.add(room.lamp);
      for (const [x, z] of [[R.x - 6.4, R.z - 4.0], [R.x + 6.4, R.z - 4.0]]) { const gl = api.glow('#bfe4ff', 2.2, 0.5); gl.position.set(x, Y0 + 2.9, z); room.g.add(gl); }
    }
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.r0story) { r0.wind.forEach(w => { w.sp.visible = false; }); r0.prints.forEach(gl => { gl.material.opacity = 0.8; }); }
    if (s.r0snow) { r0.drift.visible = false; r0.driftSolid.x = 1e5; }
    if (s.r1story) { r1.icicles.visible = false; r1.wall.forEach(c => { c.x = 1e5; }); }
    if (s.r2jump) { r2.mitten.visible = false; }
    if (s.r2bridge) { r2.bridge.visible = true; r2.gap.forEach(c => { if (Math.abs(c.x - (r2.R.x + 2.6)) < 1.0) c.x = 1e5; }); }
    if (s.boss) { if (r3.owl) r3.owl.visible = false; r3.owlSolid.x = 1e5; r3.swirl.forEach(o => { o.sp.visible = false; }); }
  }
  const isDark = room => room.i === 0 && !st().r0story;
  // ---------------------------------------------------------- the rooms' deeds
  async function windDeed(room) {
    const s = st(); const r = await story('r0'); if (!r) return;
    M.lock(true);
    try {
      await K.tween(1.2, k => { room.wind.forEach(w => { w.sp.material.opacity = 0.8 * (1 - k); }); });
      room.wind.forEach(w => { w.sp.visible = false; }); s.r0story = true; K.dark(); K.G.save();
      for (const gl of room.prints) { Sound.play('pip'); await K.tween(0.15, k => { gl.material.opacity = k * 0.8; }); }
      M.frame2(room.guide.api); await M.say(room.guide.api, ln('cave.r0'));
    } finally { M.lock(false); }
    M.think(`The footprints end at a {w.pkp_snowdrift}. Tell {mimo} what it did, as a memory: ${M.sx('mem')}.`, 6);
  }
  async function snowDeed(room) {
    const s = st(); const r = await memory('snow'); if (!r) return;
    const G = K.G, w = room.way;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: w.x + 1.4, z: w.z + 1.4 }, { x: w.x, z: w.z }); await K.wait(0.7);
      await blowFx({ x: w.x, z: w.z });
      G.w3d.fx.puff(w.x, K.Y0 + 0.5, w.z, 18, 0.5, '#f4f8fb');
      await K.tween(0.6, k => { room.drift.scale.setScalar(Math.max(0.01, 1 - k)); });
      room.drift.visible = false; room.driftSolid.x = 1e5; s.r0snow = true; G.save(); G.sim.mimoGo(null, null);
      M.frame2(room.guide.api); await M.say(room.guide.api, ln('cave.r0b'));
    } finally { M.lock(false); }
    floor(0); await K.floorDone(0);
    UI.toast('The drift is gone. The way down is open!');
  }
  async function iceDeed(room) {
    const s = st(); const r = await story('r1'); if (!r) return;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 1.0, K.Y0 + 3.4, room.R.z + 4.4), K.V(room.R.x, K.Y0 + 1.8, room.R.z - 0.6));
      // (they shrink back toward the middle of the room, small as they were that year, and melt away)
      Sound.play('chime'); await K.tween(1.4, k => { const sy = Math.max(0.001, 1 - k); room.icicles.scale.set(1, sy, 1); room.icicles.position.y = (K.Y0 + 2.5) * (1 - sy); });
      room.icicles.visible = false; room.wall.forEach(c => { c.x = 1e5; }); s.r1story = true; K.G.save(); Sound.play('crunch');
      M.frame2(room.guide.api); await M.say(room.guide.api, ln('cave.r1'));
    } finally { M.lock(false); }
    floor(1); await K.floorDone(1);
  }
  async function jumpDeed(room) {
    const s = st(); const r = await memory('jump'); if (!r) return;
    const G = K.G, to = { x: room.R.x - 3.2, z: room.R.z - 2.4 };
    M.lock(true);
    try {
      M.shot(K.V(room.R.x - 1.0, K.Y0 + 3.6, room.R.z + 4.6), K.V(to.x, K.Y0 + 0.4, to.z));
      G.sim.mimoGo({ x: to.x, z: room.R.z + 1.0 }, to); await K.wait(0.6);
      const Mm = G.sim.mimo, root = G.cast.mimo.root, p0 = root.position.clone(); Mm.hidden = true; Sound.play('jump');
      await K.tween(0.55, k => { root.position.set(lerp(p0.x, to.x, k), lerp(p0.y, K.Y0, k) + Math.sin(k * Math.PI) * 1.6, lerp(p0.z, to.z, k)); });
      Sound.play('land', 4); room.mitten.visible = false; Sound.play('pip'); await K.wait(0.5);
      await K.tween(0.55, k => { root.position.set(lerp(to.x, p0.x, k), lerp(K.Y0, p0.y, k) + Math.sin(k * Math.PI) * 1.6, lerp(to.z, p0.z, k)); });
      Mm.x = p0.x; Mm.z = p0.z; Mm.hidden = false; s.r2jump = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    UI.toast('{mimo} brought back a small red mitten.'.replace('{mimo}', M.mimoName()));
    M.think('A child’s red mitten… he crossed here. But how? The ice bridge is broken. How was it, that night?', 5.5);
  }
  async function bridgeDeed(room) {
    const s = st(); const r = await story('r2'); if (!r) return;
    M.lock(true);
    try {
      M.shot(K.V(room.bridgeAt.x + 3.2, K.Y0 + 3.2, room.bridgeAt.z + 3.0), K.V(room.bridgeAt.x, K.Y0, room.bridgeAt.z - 2.0));
      room.bridge.visible = true; room.bridge.children.forEach(m => { m.scale.set(1, 1, 0.001); });
      await K.tween(1.0, k => { room.bridge.children.forEach(m => { m.scale.set(1, 1, Math.max(0.001, k)); }); });
      room.gap.forEach(c => { if (Math.abs(c.x - room.bridgeAt.x) < 1.0) c.x = 1e5; }); Sound.play('chime');
      s.r2bridge = true; K.G.save();
      M.frame2(room.guide.api); await M.say(room.guide.api, ln('cave.r2')); await M.say(room.guide.api, ln('cave.r2b'));
    } finally { M.lock(false); }
    floor(2); await K.floorDone(2);
  }
  // the bottom: the Blizzard Owl (the fight), Elio's echo, the memory of the clockmaker finding the boy
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.6, K.Y0 + 3.0, room.R.z + 4.4), K.V(room.spot.x, K.Y0 + 1.6, room.spot.z)); await K.wait(0.6); M.frame2(room.guide.api); await M.say(room.guide.api, ln('cave.boss')); } finally { M.lock(false); }
    const r = typeof PKBOSS !== 'undefined' && PKBOSS ? await PKBOSS.fightOwl() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Tell it as a memory: «{mimo} sopló…»!' : 'The owl settles back into its storm, muttering.', 4.5); return; }
    s.boss = true; room.owlSolid.x = 1e5;
    M.lock(true);
    try {
      if (room.owl) { G.w3d.fx.puff(room.spot.x, K.Y0 + 1.6, room.spot.z, 22, 0.5, '#ffffff'); await K.wait(0.4); room.owl.visible = false; }
      room.swirl.forEach(o => { o.sp.visible = false; });
      await K.tween(1.4, k => { room.orb.material.opacity = k * 0.95; room.orb.position.y = K.Y0 + 1.2 + k * 1.4; room.orb.scale.setScalar(1.2 + k * 0.8); });
      Sound.play('chime'); await K.wait(0.4);
      await M.you('A boy’s voice… small, cold, and then, all at once, warm.');
      const letter = typeof PKBOSS !== 'undefined' && PKBOSS ? PKBOSS.letter('past') : 'B';
      await CH4.give('peaks', 'past', letter);
      await K.tween(0.8, k => { room.orb.material.opacity = 0.95 * (1 - k); room.orb.position.y = K.Y0 + 2.6 + k * 2; });
      // the memory: the boy curled by the nest; a lantern comes through the dark and stops beside him
      room.boy.visible = true; M.shot(K.V(room.R.x - 1.0, K.Y0 + 2.8, room.R.z + 4.6), K.V(room.spot.x - 2.4, K.Y0 + 0.6, room.spot.z + 1.4), 1.2); await K.wait(0.8);
      const L0 = { x: room.R.x - 5.6, z: room.R.z + 4.4 }, L1 = { x: room.spot.x - 1.8, z: room.spot.z + 1.9 };
      await K.tween(1.6, k => { room.lamp.material.opacity = Math.min(0.9, k * 2); room.lamp.position.set(lerp(L0.x, L1.x, k), K.Y0 + 1.2, lerp(L0.z, L1.z, k)); });
      Sound.play('chime'); await K.wait(0.6);
      M.frame2(room.guide.api); await M.say(room.guide.api, ln('master.done'));
      await K.tween(1.0, k => { room.lamp.material.opacity = 0.9 * (1 - k); room.boy.children.forEach(m => { if (m.material) m.material.opacity = 0.6 * (1 - k); }); });
      room.boy.visible = false;
      await M.say(room.guide.api, ln('cave.done'));
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true;
    TIME.flag('past', 'pkCave', true); TIME.refresh();
    await K.leave({ slow: true, then: async () => { const G = K.G, c = M.CAVE; G.cam.override = { pos: K.V(c.x - 9, 12, c.z + 12), look: K.V(c.x - 4, 6, c.z + 4) }; G.cam.snap(0, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      for (let k = 0; k < 3; k++) { Sound.play('chime'); await K.wait(0.7); }
      await (TIME._.fast.on ? Promise.resolve() : UI.chapter('The White Hollow', 'the storm over, long ago'));
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Elio’s echo is free. Noa is waiting at the time crack inside the gate.', 5.5);
    G.save();
  }
  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().MEM[kind].model || {})[M.lang()] || '', M.lang()))}»` : `Tell ${name}`);
    if (room.guide) out.push({ x: room.guide.api.x - 0.6, z: room.guide.api.z - 0.5, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { await M.demo(room.guide.api, T().DEMO['cave' + i], T().MARKS['cave' + i]); } finally { M.lock(false); } } });
    if (i === 0) {
      if (!s.r0story) out.push({ x: room.windAt.x, z: room.windAt.z, r: 1.9, label: 'The wind', run: () => windDeed(room) });
      else if (!s.r0snow) out.push({ x: room.way.x + 1.4, z: room.way.z + 1.4, r: 1.8, label: sayQ('snow'), run: () => snowDeed(room) });
    }
    if (i === 1 && !s.r1story) out.push({ x: room.iceAt.x, z: room.iceAt.z, r: 1.9, label: 'The icicles', run: () => iceDeed(room) });
    if (i === 2) {
      if (!s.r2jump) out.push({ x: room.jumpAt.x, z: room.jumpAt.z, r: 1.8, label: sayQ('jump'), run: () => jumpDeed(room) });
      else if (!s.r2bridge) out.push({ x: room.bridgeAt.x, z: room.bridgeAt.z, r: 1.8, label: 'The ice bridge', run: () => bridgeDeed(room) });
    }
    if (i === 3 && !s.boss) out.push({ x: room.spot.x, z: room.spot.z + 2.6, r: 2.4, label: 'Wake it', run: () => bossScene(room) });
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!s.r0story) return { x: room.windAt.x, z: room.windAt.z, hint: '{mimo} squints into the howling wind.' }; if (!s.r0snow) return { x: room.way.x, z: room.way.z, hint: '{mimo} sniffs the drift where the footprints end.' }; }
    if (i === 1 && !s.r1story) return { x: room.iceAt.x, z: room.iceAt.z, hint: '{mimo} looks up at the wall of icicles.' };
    if (i === 2) { if (!s.r2jump) return { x: room.jumpAt.x, z: room.jumpAt.z, hint: '{mimo} spots something red across the chasm.' }; if (!s.r2bridge) return { x: room.bridgeAt.x, z: room.bridgeAt.z, hint: '{mimo} looks at the broken ice bridge.' }; }
    if (i === 3 && !s.boss) return { x: room.spot.x, z: room.spot.z, hint: '{mimo} looks at the great white owl in its storm.' };
    return null;
  }
  async function onFirst(room) {
    if (room.i === 1 && !st().ambush) {
      await K.wait(1.0);
      await M.you('Snowballs rolling out of the dark! In here, it’s all a memory: tell {mimo} what it did.');
      const opts = { foes: [{ kind: 'snowball', color: 'blue', size: 'small' }, { kind: 'snowball', color: 'red', size: 'small' }, { kind: 'moth', color: 'yellow', size: 'small' }], place: { x: M.CAVE.x, z: M.CAVE.z, biome: 'cave' } };
      const r = typeof PKBOSS !== 'undefined' && PKBOSS && PKBOSS.fightMemories ? await PKBOSS.fightMemories(opts) : await TIME.fight(opts);
      if (!r || r.outcome !== 'win') return false;
      st().ambush = true; K.G.save();
    }
    const P = room.guide;
    if (P) { await K.wait(room.i === 1 ? 0.6 : 1.2); M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO['cave' + room.i], T().MARKS['cave' + room.i]); } finally { M.lock(false); } }
    if (room.i === 0) M.think(`The wind howls in here, like that night. Tell the cave how it was: ${M.sx('story')}.`, 6);
    if (room.i === 2) M.think('A chasm, a broken ice bridge… and something small and red on the far side. {mimo} could jump it, as a memory.', 5.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.guide) K.animate(room.guide, dt, t);
    const Y0 = K.Y0, R = room.R;
    if (room.i === 0 && !st().r0story) room.wind.forEach(w => { const k = ((t * 0.55 + w.ph) % 2) / 2; w.sp.position.set(R.x + 7 - k * 14, Y0 + w.h + Math.sin(t * 3 + w.ph) * 0.3, R.z - 5 + w.z * 10); });
    if (room.i === 3 && room.owl && room.owl.visible) {
      room.swirl.forEach(o => { const a = o.ph + t * 1.4; o.sp.position.set(room.spot.x + Math.cos(a) * 2.2, Y0 + o.h + Math.sin(t * 2 + o.ph) * 0.2, room.spot.z + Math.sin(a) * 1.8); });
      try { if (typeof PKBOSS !== 'undefined' && PKBOSS && PKBOSS.poseOwlIdle) PKBOSS.poseOwlIdle(room.owl, t); } catch (e) { /* */ }
    }
  }
  // the dungeon's own look: the old photograph's sepia over the picture, lighter on the ice (the Past's sky dome stays hidden in here)
  function late() {
    const cv = document.getElementById('gl');
    if (cv && !document.body.classList.contains('in-battle')) cv.style.filter = 'sepia(0.26) saturate(1.08) contrast(1.04)';
    if (typeof PAST !== 'undefined' && PAST._ && PAST._.W && PAST._.W.sky) PAST._.W.sky.visible = false;
  }
  const MOD = QRKIT.make({
    name: 'pk-past-cave', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: { x: M.CAVE.look.x + 0.6, z: M.CAVE.look.z + 0.9, yaw: 2.4 }, state: st,
    tint: { rock: ['#d6e6f0', '#c2d9e8', '#e2eef5', '#b2cee0'], floor: '#e8f0f6', floorA: '#f4f8fb', floorB: '#d5e3ee', beam: '#9cc7de', beam2: '#86b4cf', rubble: ['#eef3f8', '#dbe8f1', '#c9d8e4'], puff: '#f4f8fb', seed: 17 },
    interior: { fog: '#a8c0d0', near: 18, far: 56 }, dark: { fog: '#16202a', near: 7, far: 19 }, isDark: room => isDark(room),
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('pk_past_cave') ? 'pk_past_cave' : null),
  });
  // (the kit names its first room's way out for a mine)
  const it0 = MOD.interactables;
  MOD.interactables = () => it0().map(i => (i.label === 'Leave the mine' ? Object.assign({}, i, { label: 'Leave the cave' }) : i));
  return Object.assign(MOD, { finale });
})();
