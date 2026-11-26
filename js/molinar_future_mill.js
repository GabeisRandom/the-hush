'use strict';
// The silent Great Mill, tomorrow (DESIGN.md 18.6 "T1c"): MFMILL, on molinar_past_mill.js's kit (MOLMILL.make). Rooms at y 300,
// z −330, x −430 / −404 / −378 / −352. Gray Hush clogs it: in here nothing moves now, but plans still work. Tell {mimo} what it
// WILL do («{mimo} soplará el polvo»), then work the machine (the bellows, the lever, the rope) and the plan happens; the
// seals want promises in tomorrow's words, each in its person. Trigo's voice comes up a speaking tube from below.
//   0 the Gray Grain Floor: gray flour drifts over the hatch; «{mimo} soplará», the bellows; the seal: «¡Yo subiré!» (I)
//   1 the Rusted Gears: Hushlings (a fight in the Future's tense); «{mimo} empujará el engranaje», the lever; rusted solid, unless
//     today's Ciro oiled them (the warning from tomorrow): else «Mañana aceitaremos los engranajes» (we)
//   2 the Still Sails: «{mimo} trepará al mástil», the rope; the gray canvas falls; «Los molinos girarán» (they)
//   3 the Gray Millstone: the Gray Miller (molinar_time_boss.js), who stops only for promises about the town; Elio's echo
const MFMILL = (() => {
  if (typeof MOLMILL === 'undefined' || typeof MOLT === 'undefined' || !MOLT) return null;
  const M = MOLT, T = () => MFTXT, X = [-430, -404, -378, -352], Z = -330;
  const st = () => { const s = M.st('future'); return s.mill || (s.mill = {}); };
  const fS = () => M.st('future');
  const lang = () => M.lang();
  let K = null;
  const tubeP = room => ({ id: 'trigo', name: M.nameOf(T().CAST.trigo), x: room.tube.x, y: K.Y0 + 0.6, z: room.tube.z, top: 1.4, talking: false });
  async function tube(room, key) { M.lock(true); try { M.shot(K.V(room.R.x + 1.6, K.Y0 + 3.2, room.R.z + 4.0), K.V(room.tube.x, K.Y0 + 1.4, room.tube.z)); await M.demo(tubeP(room), T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
  // a plan for Mimo (the box), then the machine makes it happen; E repeats a plan that worked here
  async function plan(kind) {
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const r = await M.ask(M.planTask(T().PLAN[kind]), { icon: kind === 'dust' ? 'blow' : kind === 'cloth' ? 'climb' : 'push', hint: 'A plan: it happens when the machine moves.' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('mol.plan.' + kind, r.letter); }
    return r;
  }
  async function promise(room, key) {
    const r = await M.ask(T().TASKS[key], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('The gray waits for a promise.', 3.5); return false; }
    TIME.grade('mol.seal.' + key, r.letter); Sound.play('chime'); K.G.w3d.fx.sparkle(room.R.x, K.Y0 + 2, room.R.z - 2, 18, ['#ffd166', '#9ff5e8', '#fff3a0']);
    const f = fS(); f.floors = Math.max(f.floors || 0, room.i + 1);
    return true;
  }
  // ---------------------------------------------------------- the rooms
  function grayDune(k, x, z, s) { const KG = PAST.API.KG; k.add(KG.sphere, x, K.Y0 + 0.1, z, 1.3 * s, 0.7 * s, 1.1 * s, '#a7a5b0', { ink: 0.012 }).add(KG.sphere, x + 0.7 * s, K.Y0 + 0.05, z + 0.3, 0.8 * s, 0.4 * s, 0.7 * s, '#b4b2bc', { ink: 0.01 }); }
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG;
    // gray dust on everything, a few gray sacks, the speaking tube (brass, east wall)
    for (const [dx, dz, s] of [[-5.6, 3.4, 0.6], [5.2, 4.0, 0.5], [-1.8, 4.4, 0.4]]) grayDune(k, R.x + dx, R.z + dz, s);
    room.tube = { x: R.x + 6.5, z: R.z + 1.4 };
    k.add(KG.cyl, room.tube.x, Y0 + 1.5, room.tube.z, 0.12, 3.0, 0.12, '#b8903a').add(KG.cone, room.tube.x - 0.2, Y0 + 1.6, room.tube.z, 0.22, 0.4, 0.22, '#c9a24a', { rz: Math.PI / 2 });
    if (room.i === 0) {
      room.dunes = new THREE.Group(); room.g.add(room.dunes);
      const kd = PAST.API.Kit(); grayDune(kd, R.x - 4.4, R.z - 4.0, 1.4); grayDune(kd, R.x - 3.0, R.z - 4.8, 1.1); grayDune(kd, R.x - 5.4, R.z - 2.8, 1.0); kd.build(room.dunes);
      room.duneSolid = { x: R.x - 4.4, z: R.z - 3.8, r: 1.8 }; WORLD.extra.push(room.duneSolid);
      room.bellows = { x: R.x - 6.2, z: R.z + 1.0 };
      room.bellowsG = new THREE.Group(); room.bellowsG.position.set(room.bellows.x + 0.4, Y0 + 0.9, room.bellows.z); room.g.add(room.bellowsG);
      const kb = PAST.API.Kit(); kb.box(0, 0, 0, 0.5, 0.18, 1.1, '#6b5a4a').box(0, 0.35, 0, 0.42, 0.5, 1.0, '#7d6a58', { ink: 0.008 }).box(0, 0.62, 0, 0.5, 0.12, 1.1, '#6b5a4a').box(0, 0.3, 0.75, 0.12, 0.12, 0.5, '#5a4a3a'); kb.build(room.bellowsG);
      room.seal = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ color: '#8a8896', transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
      room.seal.rotation.x = Math.PI / 2; room.seal.position.set(R.x - 4.6, Y0 + api.WH - 0.2, R.z - 4.6); room.g.add(room.seal);
    }
    if (room.i === 1) {
      room.gears = [[R.x - 2.0, Y0 + 3.0, 1.1], [R.x + 0.4, Y0 + 2.0, 0.8], [R.x + 2.4, Y0 + 3.4, 0.7], [R.x + 4.0, Y0 + 2.2, 0.55]].map(([x, y, r], i) => {
        const g = new THREE.Group(); g.position.set(x, y, R.z - 5.8); room.g.add(g); const kg = PAST.API.Kit();
        kg.add(KG.cyl, 0, 0, 0, r, 0.22, r, i % 2 ? '#8a6a52' : '#7d5a44', { rx: Math.PI / 2 }); for (let j = 0; j < 10; j++) { const a = j / 10 * TAU; kg.box(Math.cos(a) * (r + 0.1), Math.sin(a) * (r + 0.1), 0, 0.22, 0.22, 0.2, '#6a4a38', { rz: a, ink: 0.008 }); }
        for (let j = 0; j < 4; j++) kg.add(KG.ball6, Math.cos(j * 1.7) * r * 0.6, Math.sin(j * 1.7) * r * 0.6, 0.13, 0.12, 0.12, 0.05, '#a0563a', { ink: 0 });      // (rust)
        kg.build(g); return g;
      });
      room.gear = { x: R.x + 0.4, z: R.z + 1.0 };
      room.gearG = new THREE.Group(); room.gearG.position.set(room.gear.x, Y0 + 0.2, room.gear.z); room.g.add(room.gearG);
      const kw = PAST.API.Kit(); kw.add(KG.cyl, 0, 0, 0, 1.0, 0.3, 1.0, '#7d5a44'); for (let j = 0; j < 10; j++) { const a = j / 10 * TAU; kw.box(Math.cos(a) * 1.12, 0, Math.sin(a) * 1.12, 0.26, 0.28, 0.24, '#6a4a38', { ry: -a, ink: 0.01 }); } kw.build(room.gearG);
      room.gearSolid = { x: room.gear.x, z: room.gear.z, r: 1.1 }; WORLD.extra.push(room.gearSolid);
      room.lever = { x: R.x + 6.3, z: R.z - 1.6 };
      k.box(room.lever.x, Y0 + 0.6, room.lever.z, 0.3, 1.2, 0.5, '#5a4a3a');
      room.leverG = new THREE.Group(); room.leverG.position.set(room.lever.x - 0.2, Y0 + 1.1, room.lever.z); room.g.add(room.leverG);
      const kl = PAST.API.Kit(); kl.box(0, 0.45, 0, 0.08, 0.9, 0.08, '#2f3440').add(KG.ball6, 0, 0.92, 0, 0.12, 0.12, 0.12, '#8a7f9a'); kl.build(room.leverG); room.leverG.rotation.z = 0.5;
    }
    if (room.i === 2) {
      room.mast = { x: R.x + 1.6, z: R.z - 3.0 };
      k.add(KG.cyl, room.mast.x, Y0 + 2.7, room.mast.z, 0.18, 5.4, 0.18, '#6a5e54');
      room.cloth = new THREE.Group(); room.cloth.position.set(room.mast.x, Y0 + 3.4, room.mast.z + 0.25); room.g.add(room.cloth);
      const kc = PAST.API.Kit(); kc.box(0, 0, 0, 2.6, 3.2, 0.06, '#8e8b98', { ink: 0.006 }); for (let j = 0; j < 4; j++) kc.box(-1.0 + j * 0.66, 0.2, 0.05, 0.05, 2.8, 0.04, '#6f6c7a', { ink: 0 }); kc.build(room.cloth);
      room.rope = { x: R.x - 2.6, z: R.z - 0.2 };
      k.box(room.rope.x, Y0 + 0.4, room.rope.z, 0.9, 0.8, 0.6, '#5a4a3a').add(KG.cyl, room.rope.x, Y0 + 2.8, room.rope.z, 0.03, 4.8, 0.03, '#b8b0a0', { ink: 0 });
      room.sailG = new THREE.Group(); room.sailG.position.set(R.x - 3.6, Y0 + 3.4, R.z - 6.4); room.g.add(room.sailG);
      const ks = PAST.API.Kit(); ks.box(0, 0, 0, 0.16, 4.2, 0.12, '#6a5e54'); ks.box(0, 0, 0, 4.2, 0.16, 0.12, '#6a5e54'); ks.build(room.sailG);
    }
    if (room.i === 3) {
      room.spot = { x: R.x + 0.4, z: R.z - 1.8 };
      // the gray millstone, turning, flour piling up gray round it
      k.add(KG.cyl, room.spot.x, Y0 + 0.35, room.spot.z, 1.7, 0.7, 1.7, '#8f8c98');
      grayDune(k, room.spot.x - 2.4, room.spot.z + 1.2, 0.9); grayDune(k, room.spot.x + 2.6, room.spot.z + 0.8, 0.8);
      room.stone = new THREE.Group(); room.stone.position.set(room.spot.x, Y0 + 0.95, room.spot.z); room.g.add(room.stone);
      const kt = PAST.API.Kit(); kt.add(KG.cyl, 0, 0, 0, 1.5, 0.45, 1.5, '#a09ca8').add(KG.cyl, 0, 0.05, 0, 0.3, 0.5, 0.3, '#6f6c7a', { ink: 0 }).box(1.1, 0.4, 0, 0.12, 0.8, 0.12, '#5a5662'); kt.build(room.stone);
      room.miller = typeof MOLBOSS !== 'undefined' && MOLBOSS.millerModel ? MOLBOSS.millerModel() : null;
      if (room.miller) { room.miller.root.position.set(room.spot.x - 1.9, Y0, room.spot.z + 0.6); room.miller.root.rotation.y = 0.9; room.g.add(room.miller.root); }
      room.bossSolid = { x: room.spot.x, z: room.spot.z, r: 2.4 }; WORLD.extra.push(room.bossSolid);
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#cfe0ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.orb.scale.setScalar(1.6); room.orb.position.set(room.spot.x, Y0 + 1.6, room.spot.z); room.g.add(room.orb);
    }
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.dust) { r0.dunes.visible = false; r0.duneSolid.x = 1e5; }
    if (s.done0) r0.seal.visible = false;
    if (s.gear) { r1.gearSolid.x = 1e5; r1.gearG.position.set(r1.gear.x, api.Y0 + 2.0, r1.R.z - 5.6); r1.gearG.rotation.set(Math.PI / 2, 0, 0); }
    if (s.lever) r1.leverG.rotation.z = -0.5;
    if (s.cloth) r2.cloth.visible = false;
    if (s.boss) { if (r3.miller) r3.miller.root.visible = false; r3.bossSolid.x = 1e5; }
  }
  // ---------------------------------------------------------- the floors' deeds
  async function dustTask(room) {
    const s = st(), r = await plan('dust'); if (!r) return;
    s.dustPlan = true; K.G.save(); UI.toast('The plan is set. It happens when the bellows pump!');
  }
  async function pumpBellows(room) {
    const s = st(), G = K.G;
    if (!s.dustPlan) { Sound.play('poof'); G.w3d.fx.puff(room.bellows.x + 0.8, K.Y0 + 0.9, room.bellows.z, 6, 0.2, '#c8c6d2'); M.think('The bellows wheeze… but nothing happens. Nobody planned anything.', 4); return; }
    M.lock(true);
    try {
      await K.tween(0.5, kk => { room.bellowsG.scale.y = 1 - Math.sin(kk * Math.PI) * 0.4; }); Sound.play('blow');
      G.sim.mimoGo({ x: room.R.x - 2.6, z: room.R.z - 2.2 }, room.duneSolid); await K.wait(0.7);
      Sound.play('blow'); G.w3d.fx.puff(room.R.x - 4.2, K.Y0 + 0.6, room.R.z - 3.8, 24, 0.5, '#c8c6d2');
      await K.tween(0.9, kk => { room.dunes.scale.set(1, 1 - kk, 1); }); room.dunes.visible = false; room.duneSolid.x = 1e5;
      s.dust = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    await tube(room, 'tube.seal');
    await sealTask(room);
  }
  async function sealTask(room) {
    if (!(await promise(room, 'first'))) return;
    await K.tween(0.5, kk => { room.seal.material.opacity = 0.85 * (1 - kk); }); room.seal.visible = false; Sound.play('crack');
    await K.floorDone(0);
  }
  async function gearTask(room) {
    const s = st(), r = await plan('gear'); if (!r) return;
    s.gearPlan = true; K.G.save(); UI.toast('The plan is set. It happens when the lever moves!');
  }
  async function pullLever(room) {
    const s = st(), G = K.G, oiled = !!TIME.flag('now', 'molOiled');
    M.lock(true);
    try {
      Sound.play('click'); await K.tween(0.4, kk => { room.leverG.rotation.z = lerp(0.5, -0.5, kk); }); s.lever = true;
      if (s.gearPlan && !s.gear) {
        G.sim.mimoGo({ x: room.gear.x, z: room.gear.z + 1.6 }, room.gear); await K.wait(0.6); G.sim.mimo.hop = { t: 0 }; Sound.play('land', 9);
        const p0 = room.gearG.position.clone();
        await K.tween(1.0, kk => { room.gearG.position.set(p0.x, K.Y0 + 0.2 + kk * 1.8, lerp(p0.z, room.R.z - 5.6, kk)); room.gearG.rotation.set(kk * Math.PI / 2, 0, kk * 4); });
        s.gear = true; room.gearSolid.x = 1e5; G.sim.mimoGo(null, null);
      }
      G.save();
    } finally { M.lock(false); }
    if (!s.gear) { M.think('The lever moves… and nothing else. The big gear still lies on the floor: a plan for {mimo} first.', 4.5); return; }
    if (oiled) { await tube(room, 'tube.oiled'); s.turning = true; Sound.play('gears'); const f = fS(); f.floors = Math.max(f.floors || 0, 2); await K.floorDone(1); return; }
    Sound.play('crunch'); M.think('Creak… the gears are rusted solid.', 3.5);
    await tube(room, 'tube.oil');
    if (await promise(room, 'oil')) { s.turning = true; Sound.play('gears'); await K.floorDone(1); }
  }
  async function clothTask(room) {
    const s = st(), r = await plan('cloth'); if (!r) return;
    s.clothPlan = true; K.G.save(); UI.toast('The plan is set. It happens when the rope is pulled!');
  }
  async function pullRope(room) {
    const s = st(), G = K.G;
    if (!s.clothPlan) { Sound.play('wood'); M.think('The rope won’t budge: the gray canvas is tied up the mast. A plan for {mimo} first.', 4.5); return; }
    M.lock(true);
    try {
      G.sim.mimoGo({ x: room.mast.x + 0.8, z: room.mast.z + 1.6 }, room.mast); await K.wait(0.6);
      await K.mimoArc({ x: room.mast.x + 0.3, z: room.mast.z + 0.3 }, K.Y0 + 4.6, 0.8); Sound.play('climb');
      await K.tween(0.8, kk => { room.cloth.position.y = K.Y0 + 3.4 - kk * 3.0; room.cloth.rotation.x = kk * 1.2; }); room.cloth.visible = false;
      G.w3d.fx.puff(room.mast.x, K.Y0 + 0.4, room.mast.z + 0.8, 16, 0.4, '#a7a5b0');
      await K.mimoLand(); s.cloth = true; G.save();
    } finally { M.lock(false); }
    await tube(room, 'tube.turn');
    if (await promise(room, 'turn')) { s.turn = true; Sound.play('swoosh'); await K.floorDone(2); }
  }
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x - 3.5, K.Y0 + 3.2, room.R.z + 4.5), K.V(room.spot.x, K.Y0 + 1.4, room.spot.z)); await K.wait(0.6);
      await M.you('Someone gray, grinding at a gray millstone… grinding words into dust.');
    } finally { M.lock(false); }
    const r = typeof MOLBOSS !== 'undefined' ? await MOLBOSS.fightMiller() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Catch your breath. Plans for {mimo}, then promises about the town!' : 'The stone keeps grinding.', 4); return; }
    s.boss = true; room.bossSolid.x = 1e5;
    M.lock(true);
    try {
      if (room.miller) { G.w3d.fx.puff(room.miller.root.position.x, K.Y0 + 1.2, room.miller.root.position.z, 22, 0.5, '#c8c6d2'); await K.wait(0.4); room.miller.root.visible = false; }
      room.orb.position.set(room.spot.x, K.Y0 + 1.2, room.spot.z);
      await K.tween(1.4, kk => { room.orb.material.opacity = kk * 0.95; room.orb.position.y = K.Y0 + 1.2 + kk * 1.2; room.orb.scale.setScalar(1.2 + kk * 0.8); });
      Sound.play('chime'); await K.wait(0.4);
      await M.you('A man’s voice, older… the same boy, grown up. What he still wants to say.');
      const letter = typeof MOLBOSS !== 'undefined' ? MOLBOSS.letter('future') : 'B';
      await CH4.give('molinar', 'future', letter);
      await K.tween(0.8, kk => { room.orb.material.opacity = 0.95 * (1 - kk); room.orb.position.y = K.Y0 + 2.4 + kk * 2; });
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true; const f = fS(); f.floors = Math.max(f.floors || 0, 3);
    if (typeof MOL_FUT !== 'undefined') MOL_FUT.freed(); else TIME.flag('future', 'molFree', true);
    await K.leave({ slow: true, then: async () => { const G = K.G; G.cam.override = { pos: K.V(240 - 14, 9, -163.6 + 16), look: K.V(240, 11, -176) }; G.cam.snap(0, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      for (let k = 0; k < 3; k++) { Sound.play('chime'); await K.wait(0.9); }
      await (TIME._.fast.on ? Promise.resolve() : UI.chapter('The Great Mill', 'turning again, tomorrow'));
      const Tg = M.who('future', 'trigo'); if (Tg) { M.frame2(Tg); await M.say(Tg, T().LINES['trigo.after']); }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Both of Molinar’s echoes are free. Noa is waiting at the time crack by the west gate.', 5.5);
    G.save();
  }
  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().PLAN[kind].model || {})[lang()] || '', lang()))}»` : `Tell ${name}`);
    out.push({ x: room.tube.x - 0.9, z: room.tube.z, r: 1.4, label: 'Listen', run: async () => { M.lock(true); try { await M.say(tubeP(room), T().LINES['trigo.again']); } finally { M.lock(false); } } });
    if (i === 0) {
      if (!s.dust && !s.dustPlan) out.push({ x: room.R.x - 2.6, z: room.R.z - 2.2, r: 1.8, label: sayQ('dust'), run: () => dustTask(room) });
      if (!s.dust) out.push({ x: room.bellows.x + 1.1, z: room.bellows.z, r: 1.5, label: 'Pump the bellows', run: () => pumpBellows(room) });
      else if (!s.done0) out.push({ x: room.R.x - 3.4, z: room.R.z - 3.0, r: 1.8, label: 'Answer the seal', run: () => sealTask(room) });
    }
    if (i === 1) {
      if (!s.gear && !s.gearPlan) out.push({ x: room.gear.x, z: room.gear.z + 1.5, r: 1.7, label: sayQ('gear'), run: () => gearTask(room) });
      if (!s.done1) out.push({ x: room.lever.x - 1.1, z: room.lever.z, r: 1.6, label: 'Pull the lever', run: () => pullLever(room) });
    }
    if (i === 2) {
      if (!s.cloth && !s.clothPlan) out.push({ x: room.mast.x, z: room.mast.z + 1.8, r: 1.6, label: sayQ('cloth'), run: () => clothTask(room) });
      if (!s.done2) out.push({ x: room.rope.x, z: room.rope.z + 1.1, r: 1.5, label: 'Pull the rope', run: () => pullRope(room) });
    }
    if (i === 3 && !s.boss) out.push({ x: room.spot.x, z: room.spot.z + 2.6, r: 2.6, label: 'Face him', run: () => bossScene(room) });
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0 && !s.done0) return !s.dustPlan ? { x: room.R.x - 4.2, z: room.R.z - 3.6, hint: '{mimo} sneezes at the gray flour over the hatch.' } : !s.dust ? { x: room.bellows.x, z: room.bellows.z, hint: '{mimo} points at the bellows.' } : { x: room.R.x - 4.6, z: room.R.z - 4.6, hint: '{mimo} looks up at the gray seal.' };
    if (i === 1 && !s.done1) return !s.gearPlan ? { x: room.gear.x, z: room.gear.z, hint: '{mimo} sniffs the big gear on the floor.' } : { x: room.lever.x, z: room.lever.z, hint: '{mimo} points at the lever.' };
    if (i === 2 && !s.done2) return !s.clothPlan ? { x: room.mast.x, z: room.mast.z, hint: '{mimo} looks up the mast at the gray canvas.' } : { x: room.rope.x, z: room.rope.z, hint: '{mimo} points at the rope.' };
    if (i === 3 && !s.boss) return { x: room.spot.x, z: room.spot.z, hint: '{mimo} trembles. The gray miller is grinding.' };
    return null;
  }
  async function onFirst(room) {
    if (room.i === 0) { await K.wait(1.6); await tube(room, 'room1'); }
    if (room.i === 1 && !st().ambush) {
      await K.wait(1.0);
      await M.you('Hushlings, clogging the gears! In here it’s all tomorrow: say what {mimo} will do.');
      const r = await TIME.fight({ foes: [{ kind: 'hushling', color: 'blue', size: 'small' }, { kind: 'moth', color: 'red', size: 'small' }, { kind: 'beetle', color: 'green', size: 'small' }], place: { x: 240, z: -176 } });
      if (!r || r.outcome !== 'win') return false;
      st().ambush = true; K.G.save();
      if (TIME.flag('now', 'molOiled')) M.think('These gears shine with old oil…', 3.5);
    }
    return true;
  }
  function update(room, dt, t) {
    const s = st();
    if (room.i === 1 && s.turning) room.gears.forEach((g, i) => { g.rotation.z += dt * (i % 2 ? -0.8 : 0.6) / (0.6 + i * 0.3); });
    if (room.i === 2 && s.turn) room.sailG.rotation.z += dt * 0.3;
    if (room.i === 3) { room.stone.rotation.y += dt * (s.boss ? 0 : 0.8); if (room.miller && room.miller.root.visible && typeof MOLBOSS !== 'undefined') MOLBOSS.poseMiller(room.miller, null, t, dt); }
  }
  function late() {
    if (typeof FUTURE !== 'undefined' && FUTURE._ && FUTURE._.tintOn) { try { FUTURE._.tintOn(true); FUTURE._.tintK(st().done3 ? 0.85 : 0.22); } catch (e) { /* */ } }
  }
  const MOD = MOLMILL.make({
    name: 'mol-fut-mill', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: { x: 240, z: -165.4, yaw: 0 }, state: st,
    tint: { planks: ['#9a958f', '#8f8a84', '#a19c95'], joint: '#5a5550', wall: '#c4c1c8', wall2: '#b4b1ba', skirt: '#7a7672', skirt2: '#6a6662', trim: '#55525c', beam: '#5f5a58', window: '#c8ccd8', dust: true, puff: '#c8c6d2' },
    interior: { fog: '#3c3a48', near: 14, far: 48 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('mol_future_mill') ? 'mol_future_mill' : null),
  });
  return Object.assign(MOD, { finale });
})();
