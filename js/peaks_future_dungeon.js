'use strict';
// The Ice Clock Tower, tomorrow (the Frost Peaks, DESIGN.md 20 "T3b"): the great clock's tower, frozen silent at three. Four rooms at
// y 300, z −90, x −430 / −404 / −378 / −352 (over the headland north of the far lake, where nobody walks), on Molinar's four-room kit
// (molinar_past_mill.js MOLMILL.make): going up, a trapdoor and a ladder that drops when each floor is done. Lía (fifteen, Tobías's
// apprentice) climbs with you; here nobody takes orders, not even {mimo}: give advice («{mimo}, yo que tú, soplaría la nieve») and
// make guesses about what would happen.
//   0 the Snowed-in Hall: pitch dark: «Sin luz, sería difícil subir» (Lía finds her flashlight); snow buried the ladder: advice for
//     {mimo}, «{mimo}, yo que tú, soplaría la nieve»
//   1 the Frozen Gears: snowballs (a fight in tomorrow's words: advice), then the gears, iced solid: advice for Lía, «Yo que tú,
//     encendería el calefactor». (If today's Tobías heard tomorrow's warning, the belfry's shutters kept the snow out: no ice at all.)
//   2 the Stopped Pendulum: «El reloj andaría otra vez» (what would happen if it moved), then «{mimo}, yo que tú, empujaría el péndulo»
//   3 the Cuckoo's Loft: the Gray Cuckoo (peaks_time_boss.js); Elio's echo; every clock in Escarcha starts again
const PK_FTOWER = (() => {
  if (typeof MOLMILL === 'undefined' || typeof PEAKT === 'undefined' || !PEAKT) return null;
  const M = PEAKT, T = () => PKFTXT, X = [-430, -404, -378, -352], Z = -90;
  const st = () => { const s = M.st('future'); return s.tower || (s.tower = {}); };
  const fS = () => M.st('future');
  const ln = key => T().LINES[key];
  const guideLook = { skin: '#e6b48c', hair: '#5a3020', hairdo: 'braids', dress: '#e0743c', vest: '#3f4a6a', hat: 'beret', hatColor: '#d9493b', shawl: '#ffd84a', h: 0.94 };
  const nm = id => M.nameOf(T().CAST[id]);
  const shut = () => !!TIME.flag('now', 'pkShutters');
  const LY = M.LY;
  let K = null;
  // a sentence to Lía (a what-if, a guess, advice)
  async function task(key) {
    const r = await M.ask(T().TASKS[key], { tips: T().TIPS, icon: 'star' });
    if (r) TIME.grade('pk.tower.' + key, r.letter);
    return r;
  }
  // advice for {mimo} (tomorrow it only moves on advice; said once, the same move is a quick «…» after that)
  async function advice(kind) {
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const r = await M.ask(T().advTask(T().ADVM[kind]), { icon: kind === 'push' ? 'push' : 'blow' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('pk.adv.' + kind, r.letter); }
    return r;
  }
  const floor = i => { const p = fS(); p.floors = Math.max(p.floors || 0, i + 1); };
  const blowFx = async at => { try { if (PEAKS.mimoBlow) await PEAKS.mimoBlow(at, 1.0); else Sound.play('blow'); } catch (e) { Sound.play('blow'); } };
  const ICE = () => new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad, emissive: new THREE.Color('#123848'), transparent: true, opacity: 0.86 });
  // ---------------------------------------------------------- the rooms
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG;
    room.guide = api.person(room, guideLook, room.i === 3 ? { x: R.x - 4.8, z: R.z + 3.2, yaw: 2.4 } : { x: R.x + 4.8, z: R.z + 3.4, yaw: -2.5 }, nm('lia'));
    // (frost everywhere: icicles along the top of the back wall, snow banked in the corners, rime on the beams)
    for (let i = 0; i < 12; i++) k.add(KG.cone, R.x - 6.2 + i * 1.12, Y0 + 5.2, R.z - 5.7, 0.1, -0.5 - (i * 37 % 7) * 0.1, 0.1, '#e6f4fb', { ink: 0.006 });
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.add(KG.sphere, R.x + sx * 6.3, Y0 + 0.2, R.z + sz * 5.2, 1.0, 0.55, 0.85, '#f4f8fb', { ink: 0.012 });
    if (room.i === 0) {
      // the old spiral staircase (broken, its railing creaking with ice), and the snow that buried the ladder's foot
      const sx = R.x + 3.6, sz = R.z - 3.2;
      k.add(KG.cyl6, sx, Y0 + 2.6, sz, 0.14, 5.2, 0.14, '#6a7484', { ink: 0.008 });
      for (let j = 0; j < 9; j++) { const an = j * 0.75, h = Y0 + 0.3 + j * 0.42; k.box(sx + Math.sin(an) * 0.7, h, sz + Math.cos(an) * 0.7, 1.1, 0.08, 0.42, j % 2 ? '#8a94a6' : '#7a8496', { ry: an, ink: 0.006 }); k.rod([sx + Math.sin(an) * 1.25, h, sz + Math.cos(an) * 1.25], [sx + Math.sin(an) * 1.25, h + 0.8, sz + Math.cos(an) * 1.25], 0.02, '#5f6a7a', 0); }
      for (let j = 0; j < 8; j++) { const a0 = j * 0.75, a1 = a0 + 0.75; k.rod([sx + Math.sin(a0) * 1.25, Y0 + 1.1 + j * 0.42, sz + Math.cos(a0) * 1.25], [sx + Math.sin(a1) * 1.25, Y0 + 1.1 + (j + 1) * 0.42, sz + Math.cos(a1) * 1.25], 0.03, '#cfeaf7', 0.004); }
      const f = room.way.foot;
      room.drift = new THREE.Group(); room.g.add(room.drift);
      const dk = PAST.API.Kit(); for (let i = 0; i < 8; i++) dk.add(KG.sphere, f.x + (i % 3 - 1) * 0.65, Y0 + 0.4 + (i > 4 ? 0.35 : 0), f.z + ((i >> 1) % 2 - 0.5) * 0.8, 0.8, 0.6, 0.7, i % 2 ? '#f4f8fb' : '#e2ebf3', { ink: 0.012 }); dk.build(room.drift);
      room.driftSolid = { x: f.x, z: f.z, r: 1.3 }; WORLD.extra.push(room.driftSolid);
      room.snowAt = { x: f.x + 1.6, z: f.z + 1.4 };
      room.darkAt = { x: R.x + 0.6, z: R.z + 0.8 };
      room.beam = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3c8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.beam.scale.setScalar(3.2); room.g.add(room.beam);
    }
    if (room.i === 1) {
      // the clock's gears on the back wall, iced solid; Lía's little heater by the side wall; an old trunk
      room.gears = [];
      for (const [gx, gyy, r] of [[-2.4, 2.4, 1.0], [0.4, 3.3, 0.8], [2.8, 2.2, 1.1]]) {
        const g = new THREE.Group(); g.position.set(R.x + gx, Y0 + gyy, R.z - 5.55); room.g.add(g);
        const gk = PAST.API.Kit(); gk.add(KG.cyl6, 0, 0, 0, r, 0.18, r, '#8a7a5a', { rx: Math.PI / 2, ink: 0.01 }).add(KG.cyl6, 0, 0, 0.1, r * 0.25, 0.1, r * 0.25, '#5a4a3a', { rx: Math.PI / 2, ink: 0.004 });
        for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; gk.box(Math.sin(an) * r * 1.05, Math.cos(an) * r * 1.05, 0, 0.18, 0.22, 0.16, '#8a7a5a', { rz: -an, ink: 0.004 }); }
        gk.build(g, { shadow: false }); room.gears.push({ g, r, dir: room.gears.length % 2 ? -1 : 1 });
      }
      room.ice = new THREE.Group(); room.g.add(room.ice);
      const ik = PAST.API.Kit(); for (let i = 0; i < 7; i++) ik.add(KG.ball6, R.x - 3.6 + i * 1.2, Y0 + 1.4 + (i % 3) * 0.9, R.z - 5.2, 1.0, 1.4, 0.55, i % 2 ? '#cfeaf7' : '#b6dcef', { ink: 0.012 });
      for (let i = 0; i < 8; i++) ik.add(KG.cone, R.x - 4 + i * 1.1, Y0 + 5.2, R.z - 4.9, 0.25, -1.2 - (i % 3) * 0.4, 0.25, '#dff2fb', { ink: 0.008 });
      ik.build(room.ice, { mat: ICE() });
      room.iceWall = []; for (let x = R.x - 4.2; x <= R.x + 4.2; x += 0.9) { const c = { x, z: R.z - 4.6, r: 0.6 }; room.iceWall.push(c); WORLD.extra.push(c); }
      room.heater = { x: R.x + 5.6, z: R.z - 2.6 };
      k.box(room.heater.x, Y0 + 0.45, room.heater.z, 0.7, 0.9, 0.5, '#c9453a').box(room.heater.x - 0.26, Y0 + 0.5, room.heater.z, 0.02, 0.55, 0.36, '#3a3d4a', { ink: 0 });
      for (let i = 0; i < 4; i++) k.box(room.heater.x - 0.27, Y0 + 0.3 + i * 0.12, room.heater.z, 0.02, 0.03, 0.34, '#e8b83a', { ink: 0 });
      room.heat = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ff9a4a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.heat.scale.setScalar(2.6); room.heat.position.set(room.heater.x - 0.4, Y0 + 0.8, room.heater.z); room.g.add(room.heat);
      room.gearsAt = { x: R.x + 0.4, z: R.z - 2.8 };
      room.trunk = { x: R.x - 5.2, z: R.z + 1.2 };
      k.box(room.trunk.x, Y0 + 0.35, room.trunk.z, 1.1, 0.7, 0.6, '#7a6a5a').box(room.trunk.x, Y0 + 0.72, room.trunk.z, 1.12, 0.06, 0.62, '#b8b4c0', { ink: 0 });
      WORLD.extra.push({ x: room.trunk.x, z: room.trunk.z, r: 0.6 }, { x: room.heater.x, z: room.heater.z, r: 0.45 });
    }
    if (room.i === 2) {
      // the great pendulum, hanging still from the ceiling; frost on its brass
      const p = new THREE.Group(); p.position.set(R.x, Y0 + api.WH - 0.2, R.z - 1.2); room.g.add(p);
      const pk = PAST.API.Kit(); pk.rod([0, 0, 0], [0, -3.6, 0], 0.07, '#8a7a5a', 0.006).add(KG.cyl, 0, -4.05, 0, 0.62, 0.14, 0.62, '#c9a24a', { rx: Math.PI / 2, ink: 0.01 }).add(KG.cyl, 0, -4.05, 0.08, 0.4, 0.04, 0.4, '#e8d9a8', { rx: Math.PI / 2, ink: 0 });
      pk.add(KG.sphere, 0.2, -3.7, 0.2, 0.25, 0.12, 0.18, '#eef6fb', { ink: 0.004 }); pk.build(p, { shadow: false });
      room.pend = p; room.pendSolid = { x: R.x, z: R.z - 1.2, r: 0.75 }; WORLD.extra.push(room.pendSolid);
      room.pendAt = { x: R.x + 1.8, z: R.z + 0.8 };
      // the gears it drives, high on the back wall (they turn once it swings)
      room.gears = [];
      for (const [gx, gyy, r] of [[-1.6, 3.9, 0.7], [1.2, 4.2, 0.55]]) { const g = new THREE.Group(); g.position.set(R.x + gx, Y0 + gyy, R.z - 5.55); room.g.add(g); const gk = PAST.API.Kit(); gk.add(KG.cyl6, 0, 0, 0, r, 0.16, r, '#8a7a5a', { rx: Math.PI / 2, ink: 0.008 }); for (let i = 0; i < 10; i++) { const an = i / 10 * TAU; gk.box(Math.sin(an) * r * 1.05, Math.cos(an) * r * 1.05, 0, 0.14, 0.18, 0.14, '#8a7a5a', { rz: -an, ink: 0.004 }); } gk.build(g, { shadow: false }); room.gears.push({ g, r, dir: room.gears.length % 2 ? -1 : 1 }); }
    }
    if (room.i === 3) {
      // the loft under the bells: the great clock's dial from behind, two bells overhead (their clappers still), the cuckoo's door
      k.add(KG.cyl, R.x, Y0 + 3.0, R.z - 5.7, 2.2, 0.12, 2.2, '#d8dee6', { rx: Math.PI / 2, ink: 0.012 }).add(KG.cyl6, R.x, Y0 + 3.0, R.z - 5.5, 0.22, 0.4, 0.22, '#5a4a3a', { rx: Math.PI / 2, ink: 0.006 });
      for (const sx of [-3.2, 3.2]) { k.add(KG.half, R.x + sx, Y0 + 4.7, R.z - 2.0, 0.55, -0.75, 0.55, '#c9a24a', { ink: 0.01 }).rod([R.x + sx, Y0 + 4.6, R.z - 2.0], [R.x + sx, Y0 + 3.85, R.z - 2.0], 0.03, '#5a4a3a', 0).add(KG.sphere, R.x + sx, Y0 + 3.8, R.z - 2.0, 0.1, 0.1, 0.1, '#5a4a3a', { ink: 0.004 }); }
      k.box(R.x, Y0 + 1.2, R.z - 5.5, 2.0, 2.4, 0.4, '#7a7680').box(R.x, Y0 + 1.1, R.z - 5.28, 0.9, 1.3, 0.04, '#1b130e', { ink: 0 });
      room.spot = { x: R.x, z: R.z - 3.4 };
      let ck = null; try { if (typeof PKBOSS !== 'undefined' && PKBOSS && PKBOSS.cuckooModel) { const m = PKBOSS.cuckooModel(); ck = m.root || m.g || null; if (ck) ck.scale.setScalar(1.25); } } catch (e) { ck = null; }
      if (ck) { ck.position.set(room.spot.x, Y0, room.spot.z); room.g.add(ck); }
      room.ck = ck; room.ckSolid = { x: room.spot.x, z: room.spot.z, r: 1.4 }; WORLD.extra.push(room.ckSolid);
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffe6a8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.orb.scale.setScalar(1.6); room.orb.position.set(room.spot.x, Y0 + 1.8, room.spot.z); room.g.add(room.orb);
      for (const [x, z] of [[R.x - 6.4, R.z - 4.0], [R.x + 6.4, R.z - 4.0]]) { const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#bfe4ff', transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(2.2); gl.position.set(x, Y0 + 2.9, z); room.g.add(gl); }
    }
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.r0light) r0.beam.material.opacity = 0.55;
    if (s.r0snow) { r0.drift.visible = false; r0.driftSolid.x = 1e5; }
    if (s.r1gears || shut()) { r1.ice.visible = false; r1.iceWall.forEach(c => { c.x = 1e5; }); }
    if (s.r1gears) r1.heat.material.opacity = 0.7;
    if (s.boss) { if (r3.ck) r3.ck.visible = false; r3.ckSolid.x = 1e5; }
    void r2;
  }
  const dark = () => !st().r0light;
  // ---------------------------------------------------------- the rooms' deeds
  async function lightDeed(room) {
    const s = st(); const r = await task('tw0light'); if (!r) return;
    M.lock(true);
    try {
      M.frame2(room.guide.api); await M.say(room.guide.api, ln('tw.r0c'));
      Sound.play('pip'); s.r0light = true; setLook(room); K.G.save();
      await K.tween(0.6, k => { room.beam.material.opacity = 0.55 * k; });
    } finally { M.lock(false); }
    M.think(`The ladder up is buried under the snow. Advise {mimo}: «${M.plainT(M.fillMimo((T().ADVM.blow.model || {})[M.lang()] || '', M.lang()))}»`, 6);
  }
  async function snowDeed(room) {
    const s = st(); const r = await advice('blow'); if (!r) return;
    const G = K.G, f = room.way.foot;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: f.x + 1.4, z: f.z + 1.4 }, { x: f.x, z: f.z }); await K.wait(0.7);
      await blowFx({ x: f.x, z: f.z });
      G.w3d.fx.puff(f.x, K.Y0 + 0.5, f.z, 18, 0.5, '#f4f8fb');
      await K.tween(0.6, k => { room.drift.scale.setScalar(Math.max(0.01, 1 - k)); });
      room.drift.visible = false; room.driftSolid.x = 1e5; s.r0snow = true; G.save(); G.sim.mimoGo(null, null);
      M.frame2(room.guide.api); await M.say(room.guide.api, ln('tw.r0b'));
    } finally { M.lock(false); }
    floor(0); await K.floorDone(0);
    UI.toast('The ladder is free. Up through the trapdoor!');
  }
  async function gearsDeed(room) {
    const s = st(); const r = await task('tw1heat'); if (!r) return;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 1.0, K.Y0 + 3.4, room.R.z + 4.4), K.V(room.R.x, K.Y0 + 2.4, room.R.z - 5.0));
      Sound.play('pip'); await K.tween(0.6, k => { room.heat.material.opacity = 0.7 * k; });
      Sound.play('chime'); await K.tween(1.4, k => { const sy = Math.max(0.001, 1 - k); room.ice.scale.set(1, sy, 1); room.ice.position.y = (K.Y0 + 1.5) * (1 - sy); });
      room.ice.visible = false; room.iceWall.forEach(c => { c.x = 1e5; }); s.r1gears = true; K.G.save(); Sound.play('wood');
      M.frame2(room.guide.api); await M.say(room.guide.api, ln('tw.r1b'));
    } finally { M.lock(false); }
    floor(1); await K.floorDone(1);
  }
  async function guessDeed(room) {
    const s = st(); const r = await task('tw2guess'); if (!r) return;
    s.r2guess = r.letter; K.G.save();
    M.think(`Then it needs a push. Advise {mimo}: «${M.plainT(M.fillMimo((T().ADVM.push.model || {})[M.lang()] || '', M.lang()))}»`, 5.5);
  }
  async function pushDeed(room) {
    const s = st(); const r = await advice('push'); if (!r) return;
    const G = K.G, p = { x: room.R.x, z: room.R.z - 1.2 };
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 3.4, K.Y0 + 3.0, room.R.z + 4.0), K.V(p.x, K.Y0 + 1.6, p.z));
      G.sim.mimoGo({ x: p.x + 1.2, z: p.z + 0.6 }, p); await K.wait(0.8);
      Sound.play('swoosh'); s.r2push = true; room.swingT = 0; G.save(); await K.wait(1.2); Sound.play('pip'); G.sim.mimoGo(null, null);
      M.frame2(room.guide.api); await M.say(room.guide.api, ln('tw.r2b'));
    } finally { M.lock(false); }
    floor(2); await K.floorDone(2);
  }
  // the top: the Gray Cuckoo (the fight), Elio's echo, and every clock in Escarcha starting again
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.6, K.Y0 + 3.0, room.R.z + 4.4), K.V(room.spot.x, K.Y0 + 1.6, room.spot.z)); await K.wait(0.6); M.frame2(room.guide.api); await M.say(room.guide.api, ln('tw.boss')); } finally { M.lock(false); }
    const r = typeof PKBOSS !== 'undefined' && PKBOSS ? await PKBOSS.fightCuckoo() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Advice, not orders: «{mimo}, yo que tú…»!' : 'The cuckoo shrinks back into its frozen door.', 4.5); return; }
    s.boss = true; room.ckSolid.x = 1e5;
    M.lock(true);
    try {
      try { if (typeof PKMUSIC !== 'undefined') PKMUSIC.cuckoo(); } catch (e) { /* */ }
      if (room.ck) { G.w3d.fx.puff(room.spot.x, K.Y0 + 1.6, room.spot.z, 22, 0.5, '#ffffff'); await K.wait(0.4); room.ck.visible = false; }
      await K.tween(1.4, k => { room.orb.material.opacity = k * 0.95; room.orb.position.y = K.Y0 + 1.4 + k * 1.4; room.orb.scale.setScalar(1.2 + k * 0.8); });
      Sound.play('chime'); await K.wait(0.4);
      await M.you('A man’s voice… warm, a little worried, giving everyone advice.');
      const letter = typeof PKBOSS !== 'undefined' && PKBOSS ? PKBOSS.letter('future') : 'B';
      await CH4.give('peaks', 'future', letter);
      await K.tween(0.8, k => { room.orb.material.opacity = 0.95 * (1 - k); room.orb.position.y = K.Y0 + 2.8 + k * 2; });
      M.frame2(room.guide.api); await M.say(room.guide.api, ln('tw.done'));
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true;
    try { if (typeof PK_FUT !== 'undefined' && PK_FUT && PK_FUT.freed) PK_FUT.freed(); else TIME.flag('future', 'pkFree', true); } catch (e) { console.error('[peaks] freed', e); }
    const tw = { x: 240, z: -278 };
    await K.leave({ slow: true, then: async () => { const G = K.G; G.cam.override = { pos: K.V(tw.x - 13, LY + 9, tw.z + 21), look: K.V(tw.x, LY + 11, tw.z) }; G.cam.snap(Math.PI, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      try { if (typeof PKMUSIC !== 'undefined') PKMUSIC.play('pk_cuckoo', 4); } catch (e) { /* */ }
      for (let k = 0; k < 3; k++) { Sound.play('chime'); await K.wait(0.7); }
      await (TIME._.fast.on ? Promise.resolve() : UI.chapter('The Ice Clock Tower', 'every clock running again, tomorrow'));
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Elio’s echo is free, and Escarcha’s clocks are running. Noa is waiting at the time crack inside the gate.', 6);
    G.save();
  }
  // ---------------------------------------------------------- E, room by room
  const LOOKS = [{ id: 'w.pkf_dusty', line: 'An old trunk, {w.pkf_dusty} and gray: oil cans, rags, and a ring with no keys on it.' }];
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().ADVM[kind].model || {})[M.lang()] || '', M.lang()))}»` : `Advise ${name}`);
    if (room.guide) out.push({ x: room.guide.api.x - 0.6, z: room.guide.api.z - 0.5, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { const D = T().DEMO['tw' + Math.min(2, i)]; await M.demo(room.guide.api, D, T().MARKS['tw' + Math.min(2, i)]); } finally { M.lock(false); } } });
    if (i === 0) {
      if (!s.r0light) out.push({ x: room.darkAt.x, z: room.darkAt.z, r: 2.0, label: 'The dark', run: () => lightDeed(room) });
      else if (!s.r0snow) out.push({ x: room.snowAt.x, z: room.snowAt.z, r: 1.8, label: sayQ('blow'), run: () => snowDeed(room) });
    }
    if (i === 1) {
      if (!s.r1gears && !shut() && s.ambush) out.push({ x: room.gearsAt.x, z: room.gearsAt.z, r: 2.0, label: 'The gears', run: () => gearsDeed(room) });
      out.push({ x: room.trunk.x + 0.9, z: room.trunk.z + 0.4, r: 1.2, label: 'Look', run: async () => { M.lookAt(LOOKS[0].id, LOOKS[0].line, 5); } });
    }
    if (i === 2) {
      if (!s.r2guess) out.push({ x: room.pendAt.x, z: room.pendAt.z, r: 1.9, label: 'The pendulum', run: () => guessDeed(room) });
      else if (!s.r2push) out.push({ x: room.pendAt.x, z: room.pendAt.z, r: 1.9, label: sayQ('push'), run: () => pushDeed(room) });
    }
    if (i === 3 && !s.boss) out.push({ x: room.spot.x, z: room.spot.z + 2.4, r: 2.3, label: 'Wake it', run: () => bossScene(room) });
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!s.r0light) return { x: room.darkAt.x, z: room.darkAt.z, hint: '{mimo} huddles close in the dark.' }; if (!s.r0snow) return { x: room.way.foot.x, z: room.way.foot.z, hint: '{mimo} sniffs the snow over the ladder.' }; }
    if (i === 1 && !s.r1gears && !shut()) return { x: room.gearsAt.x, z: room.gearsAt.z, hint: '{mimo} taps the ice over the gears.' };
    if (i === 2) { if (!s.r2guess || !s.r2push) return { x: room.pendAt.x, z: room.pendAt.z, hint: '{mimo} looks up at the still pendulum.' }; }
    if (i === 3 && !s.boss) return { x: room.spot.x, z: room.spot.z, hint: '{mimo} looks at the gray cuckoo, half out of its door.' };
    return null;
  }
  async function onFirst(room) {
    const s = st();
    if (room.i === 1 && !s.ambush) {
      await K.wait(1.0);
      await M.you('Snowballs tumbling down the stairs! Tomorrow, {mimo} only moves on advice: «{mimo}, yo que tú…».');
      const r = typeof PKBOSS !== 'undefined' && PKBOSS && PKBOSS.fightAdvice ? await PKBOSS.fightAdvice({ foes: [{ kind: 'snowball', color: 'blue', size: 'small' }, { kind: 'snowball', color: 'green', size: 'small' }, { kind: 'hushling', color: 'blue', size: 'small' }], place: { x: 240, z: -271.6, biome: 'snow' } })
        : await TIME.fight({ foes: [{ kind: 'snowball', color: 'blue', size: 'small' }, { kind: 'snowball', color: 'green', size: 'small' }], place: { x: 240, z: -271.6, biome: 'snow' } });
      if (!r || r.outcome !== 'win') return false;
      s.ambush = true; K.G.save();
    }
    const P = room.guide;
    if (room.i === 1 && shut()) {
      M.lock(true); try { M.frame2(P.api); await M.say(P.api, ln('tw.r1s')); } finally { M.lock(false); }
      floor(1); await K.floorDone(1);
      return true;
    }
    if (P && room.i < 3) { await K.wait(room.i === 1 ? 0.6 : 1.2); M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO['tw' + room.i], T().MARKS['tw' + room.i]); } finally { M.lock(false); } }
    if (room.i === 0) M.think('Pitch dark… Tell {lia} what climbing would be like without light.', 5.5);
    if (room.i === 1) M.think('The gears are iced solid. {lia}’s heater stands by the wall: give her advice.', 5.5);
    if (room.i === 2) M.think('The pendulum hangs still. What would happen if it moved? Tell {lia}.', 5);
    return true;
  }
  // the dungeon's own look: cold and gray (the color comes back once the cuckoo sings), dark in the hall until there's light
  let lookDark = null;
  function setLook(room) {
    const d = room && room.i === 0 && dark();
    if (d === lookDark) return; lookDark = d;
    try { K.G.w3d.setInterior(d ? { fog: '#0e141c', near: 6, far: 19 } : { fog: '#9aa8b8', near: 18, far: 54 }); } catch (e) { /* */ }
  }
  function update(room, dt, t) {
    if (room.guide) K.animate(room.guide, dt, t);
    setLook(room);
    const s = st(), Y0 = K.Y0;
    if (room.i === 0 && s.r0light && room.guide) { const a = room.guide.api; room.beam.position.set(a.x - 0.4, Y0 + 1.1, a.z - 0.6); room.beam.material.opacity = 0.45 + Math.sin(t * 7) * 0.04; }
    if (room.i === 1) {
      // (the shutters can go up today after the rooms were built: no ice then either)
      if (shut() && room.ice.visible && !s.r1gears) { room.ice.visible = false; room.iceWall.forEach(c => { c.x = 1e5; }); }
      const go = s.r1gears || shut() || s.done1;
      room.gears.forEach(G0 => { if (go) G0.g.rotation.z += dt * 0.5 * G0.dir / G0.r; });
      if (s.r1gears) room.heat.material.opacity = 0.6 + Math.sin(t * 5) * 0.08;
    }
    if (room.i === 2) {
      if (s.r2push) { room.swingT = (room.swingT || 0) + dt; const a = Math.min(1, room.swingT / 1.5) * 0.32; room.pend.rotation.z = Math.sin(t * 2.0) * a; room.gears.forEach(G0 => { G0.g.rotation.z += dt * 0.4 * G0.dir / G0.r; }); }
      else room.pend.rotation.z = 0;
    }
    if (room.i === 3 && room.ck && room.ck.visible) { room.ck.position.y = Y0 + Math.sin(t * 1.3) * 0.03; }
  }
  function late() {
    const cv = document.getElementById('gl');
    if (cv && !document.body.classList.contains('in-battle')) cv.style.filter = TIME.flag('future', 'pkFree') ? 'saturate(0.95) contrast(1.03)' : 'saturate(0.55) brightness(0.98) contrast(1.05)';
  }
  const MOD = MOLMILL.make({
    name: 'pk-fut-tower', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: { x: 240, z: -270.2, yaw: Math.PI }, state: st,
    tint: { planks: ['#8a94a6', '#7f899b', '#949eb0'], joint: '#4f586a', wall: '#d8e0ea', wall2: '#c8d2de', stones: true, skirt: '#8a94a6', skirt2: '#7a8496', trim: '#5f7590', window: '#cfe8ff', beam: '#5f7590', puff: '#f4f8fb', dust: true },
    interior: { fog: '#9aa8b8', near: 18, far: 54 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('pk_future_tower') ? 'pk_future_tower' : null),
  });
  // (the kit names its first room's way out for a mill; and its look is ours while inside)
  const it0 = MOD.interactables;
  MOD.interactables = () => it0().map(i => (i.label === 'Leave the mill' ? Object.assign({}, i, { label: 'Leave the tower' }) : i));
  const enter0 = MOD.enter, leave0 = MOD.leave;
  MOD.enter = async () => { lookDark = null; await enter0(); };
  MOD.leave = async o => { lookDark = null; await leave0(o); };
  return Object.assign(MOD, { finale, LOOKS });
})();
