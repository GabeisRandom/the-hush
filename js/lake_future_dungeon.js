'use strict';
// The drowned grotto under the little island, tomorrow (DESIGN.md 18.10 "T2a"): four rooms at y 300, z −270, x −430 / −404 / −378 /
// −352, on MOLMILL's room kit (molinar_past_mill.js), dressed gray and drowned: the lake came in, then drained away, and left mud,
// a sunken rowboat, a silent pool, a dry throne. Lalo (grown up, with his lamp) follows you in and asks what you will do, room by
// room; your promise about yourself cracks the gray seal over the way up. {mimo} follows plans here, and their verbs are
// irregular («{mimo} pondrá…», «saldrá…», «hará…»).
//   0 the Gray Mud: a pit of gray mud across the floor; «{mimo} pondrá la tabla sobre el barro»; Lalo: «¿Tendrás miedo?» →
//     «No, no tendré miedo»
//   1 the Sunken Boat: an ambush of gray look-alike frogs (the Future's tense: plans and predictions); the old rowboat wedged in the
//     rock, its hatch shut from inside: «{mimo} saldrá por la ventana»; Lalo: «¿Podrás pasar?» → «Sí, podré pasar»
//   2 the Silent Pool: too deep to wade; «{mimo} hará un puente con los juncos»; Lalo: «¿Dirás su nombre?» → «Sí, diré su nombre»
//   3 the Dry Throne: the Gray Toad (lake_time_boss.js: say where it will jump, then answer its dark predictions with promises),
//     Elio's echo (a man's voice), Lalo: «¿Qué harás?»; then outside the lake moves again, and its color comes back.
const LK_FGROT = (() => {
  if (typeof MOLMILL === 'undefined' || typeof LAKET === 'undefined' || !LAKET) return null;
  const M = LAKET, T = () => LFTXT, X = [-430, -404, -378, -352], Z = -270;
  const st = () => { const s = M.st('future'); return s.grot || (s.grot = {}); };
  const fS = () => M.st('future');
  const lang = () => M.lang();
  const laloLook = { skin: '#b07a52', hair: '#2e2420', hairdo: 'short', dress: '#e0603c', vest: '#2f6f8a', hat: 'cap', hatColor: '#e8403a', prop: 'lantern', h: 1.0 };
  const nm = id => M.nameOf(T().CAST[id]);
  let K = null;
  const OUT = { x: M.DOOR.x + 0.9, z: M.DOOR.z - 0.7, yaw: Math.atan2(M.BAR.a.x - M.DOOR.x, M.BAR.a.z - M.DOOR.z) };

  // ---------------------------------------------------------- Lalo's question at the end of each room: the 2nd person, shown; then
  // your answer about yourself (the 1st), a promise; it cracks the gray seal over the way up
  async function askLalo(i, key) {
    const room = K.rooms[i], P = room.lalo;
    if (P) { M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().SEALQ[key], T().SEALQ_MARKS[key]); } finally { M.lock(false); } }
    const r = await M.ask(T().TASKS[key], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('{lalo} is still waiting for your answer.', 4); return false; }
    TIME.grade('lk.fgrot.' + key, r.letter);
    Sound.play('review');
    if (room.seal && room.seal.visible) await crackSeal(room);
    const f = fS(); f.floors = Math.max(f.floors || 0, Math.min(3, i + 1));
    return true;
  }
  async function crackSeal(room) {
    M.lock(true);
    try {
      Sound.play('crack'); K.G.w3d.fx.puff(room.seal.position.x, room.seal.position.y - 0.3, room.seal.position.z, 14, 0.4, '#c8c6d2');
      await K.tween(0.5, kk => { room.seal.material.opacity = 0.88 * (1 - kk); }); room.seal.visible = false; Sound.play('chime');
    } finally { M.lock(false); }
  }
  // a plan for {mimo} (the first time, the card about plans); E repeats a plan that worked here
  async function plan(kind) {
    const f = fS();
    if (!f.planCard) { f.planCard = true; await M.card(T().CARDS.plan, true); }
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const P = T().PLAN[kind], r = await M.ask(P, { icon: P.icon || 'push', tips: T().TIPS, hint: 'A plan: {mimo} does it once you say it.' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('lk.plan.' + kind, r.letter); }
    return r;
  }

  // ---------------------------------------------------------- the rooms
  function frogModel(room, x, z, color, yaw, size) {
    let f = null;
    if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) { try { f = BATTLE.buildFoe('frog', color || 'white', { size: size || 'small' }); } catch (e) { f = null; } }
    if (!f) { f = new THREE.Group(); f.add(TK.part(TK.G.sphere, '#8f8c98', [0, 0.35, 0], [0.45, 0.35, 0.45], { ink: 0.02 })); f.userData = {}; }
    f.position.set(x, K.Y0, z); f.rotation.y = yaw || 0; room.g.add(f); return f;
  }
  // gray it all (the Gray Toad: the old Frog King, gone gray)
  function grayIt(o) {
    o.traverse(n => {
      if (!n.isMesh || !n.material || !n.material.color) return;
      n.material = n.material.clone(); const c = n.material.color, l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15;
      if (l > 0.08) c.setRGB(l * 0.82, l * 0.82, l * 0.9);
    });
    return o;
  }
  function deadReeds(k, R, Y0) { for (let i = 0; i < 16; i++) { const side = i % 2 ? 1 : -1, x = R.x + side * (6.2 - (i % 3) * 0.3), z = R.z - 5 + (i * 0.67) % 10; k.rod([x, Y0, z], [x + side * 0.25, Y0 + 0.7 + (i % 4) * 0.2, z + 0.1], 0.025, '#8a877e', 0); } }
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, i = room.i;
    M.caveShell(room, api, 'future', k);    // (the kit's plaster walls, beams and windows: rock here)
    deadReeds(k, R, Y0);
    // the drowned rock: gray boulders banked on the walls, dry stalactites, a tide line of old weed, cracked mud patches, a dead fish
    for (let j = 0; j < 9; j++) { const side = j % 3, x = side === 0 ? R.x - 6.5 : side === 1 ? R.x + 6.5 : R.x - 5 + (j % 5) * 2.5, z = side === 2 ? R.z - 5.6 : R.z - 4.5 + j * 1.1, s = 0.9 + (j % 4) * 0.35;
      k.add(KG.sphere, x, Y0 + s * 0.55, z, s * 1.1, s * 1.4, s, j % 2 ? '#6e6b74' : '#79767f', { ry: j, ink: 0.014 }); }
    for (let j = 0; j < 7; j++) k.add(KG.cone, R.x - 5 + j * 1.7, Y0 + 5.1, R.z - 3.5 + (j % 3) * 2.8, 0.2, 0.8 + (j % 3) * 0.3, 0.2, '#6a6770', { rx: Math.PI, ink: 0.008 });
    for (let j = 0; j < 8; j++) k.box(R.x - 6.62 + (j % 2) * 13.24, Y0 + 2.1 + (j % 3) * 0.05, R.z - 4.5 + j * 1.25, 0.04, 0.12, 1.0, '#5d6a52', { ink: 0 });
    for (const [dx, dz, s] of [[-3.6, 4.2, 1.2], [3.2, 4.4, 0.9], [-5.0, -1.6, 0.8], [4.8, -3.2, 1.0]]) k.add(KG.sphere, R.x + dx, Y0 + 0.008, R.z + dz, s, 0.01, s * 0.7, '#8a8790', { ry: dx, ink: 0 });
    if (i !== 3) k.add(KG.sphere, R.x + 2.2, Y0 + 0.06, R.z + 4.6, 0.32, 0.08, 0.12, '#a9a6b0', { ry: 0.4, ink: 0.006 });
    room.lalo = api.person(room, laloLook, i === 0 ? { x: R.x + 4.2, z: R.z + 3.0, yaw: -2.4 } : i === 3 ? { x: R.x - 4.6, z: R.z + 3.2, yaw: 2.5 } : { x: R.x + 4.6, z: R.z + 2.6, yaw: -2.5 }, nm('lalo'));
    // the gray seal over the way up (the kit's trapdoor is at the north-west corner): a promise cracks it
    if (i < 3) {
      room.seal = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ color: '#8a8896', transparent: true, opacity: 0.88, side: THREE.DoubleSide }));
      room.seal.rotation.x = Math.PI / 2; room.seal.position.set(R.x - 4.6, Y0 + api.WH - 0.2, R.z - 4.6); room.g.add(room.seal);
    }
    if (i === 0) {
      // the pit of gray mud across the room (the way up is beyond it), the old plank leaning on a rock
      room.pit = { z: R.z - 0.6 };
      k.box(R.x, Y0 + 0.01, room.pit.z, 14, 0.02, 2.0, '#1f1c24', { ink: 0 }).box(R.x, Y0 + 0.02, room.pit.z, 14, 0.01, 1.6, '#2e2b33', { ink: 0 });
      for (const s of [-1, 1]) k.box(R.x, Y0 + 0.04, room.pit.z + s * 1.0, 14, 0.06, 0.12, '#5a5662', { ink: 0.004 });
      // wet mud: lumps, glints, a bubble or two
      for (let j = 0; j < 13; j++) k.add(KG.sphere, R.x - 6.2 + j * 1.03, Y0 + 0.03, room.pit.z + ((j * 5) % 3 - 1) * 0.42, 0.34 + (j % 3) * 0.08, 0.07, 0.24, '#3a3640', { ry: j, ink: 0 });
      for (let j = 0; j < 9; j++) k.add(KG.sphere, R.x - 5.8 + j * 1.45, Y0 + 0.05, room.pit.z + ((j * 7) % 5 - 2) * 0.25, 0.12, 0.012, 0.06, '#a8a6b4', { ry: j * 0.7, ink: 0 });
      for (const [dx, dz, s] of [[-2.1, 0.2, 0.09], [1.7, -0.3, 0.12], [4.6, 0.35, 0.08]]) k.add(KG.half, R.x + dx, Y0 + 0.04, room.pit.z + dz, s, s, s, '#4a4652', { ink: 0.004 });
      room.pitSolids = [{ obox: 1, x: R.x - 4.2, z: room.pit.z, hw: 2.8, hd: 0.95, rot: 0 }, { obox: 1, x: R.x + 4.2, z: room.pit.z, hw: 2.8, hd: 0.95, rot: 0 }, { obox: 1, x: R.x, z: room.pit.z, hw: 1.45, hd: 0.95, rot: 0 }];
      WORLD.extra.push(...room.pitSolids);
      room.plank = { x: R.x - 3.4, z: R.z + 2.6 };
      room.plankG = new THREE.Group(); room.plankG.position.set(room.plank.x, Y0, room.plank.z); room.g.add(room.plankG);
      const kp = PAST.API.Kit(); kp.box(0, 0.55, 0, 0.42, 0.07, 2.4, '#8f8578', { rx: 1.1, ink: 0.008 }).box(0, 0.55, 0.0, 0.43, 0.02, 0.2, '#6f665a', { rx: 1.1, ink: 0 }); kp.build(room.plankG);
      room.plankSolid = { x: room.plank.x, z: room.plank.z, r: 0.5 }; WORLD.extra.push(room.plankSolid);
    }
    if (i === 1) {
      // the old rowboat wedged in the rock across the back, its hatch shut from inside, a little round window up by its bow
      room.wallZ = R.z - 1.4;
      for (let j = 0; j < 7; j++) k.add(KG.sphere, R.x - 6 + j * 2, Y0 + 1.3, room.wallZ - 0.2, 1.3, 1.6, 0.8, j % 2 ? '#6e6b74' : '#77747d', { ry: j * 0.7, ink: 0.012 });
      k.add(KG.sphere, R.x, Y0 + 1.25, room.wallZ + 0.1, 3.0, 1.35, 1.05, '#6f665e', { ink: 0.014 });
      for (let j = 0; j < 4; j++) k.box(R.x, Y0 + 0.55 + j * 0.38, room.wallZ + 0.95 - Math.abs(j - 1.5) * 0.12, 5.2 - Math.abs(j - 1.5) * 0.9, 0.03, 0.04, '#5a524a', { ink: 0 });
      k.add(KG.cone, R.x + 3.0, Y0 + 1.4, room.wallZ + 0.1, 0.5, 1.1, 0.5, '#6f665e', { rz: -Math.PI / 2, ink: 0.01 });
      room.win = { x: R.x + 1.9, y: Y0 + 1.75, z: room.wallZ + 1.0 };
      k.add(KG.torus, room.win.x, room.win.y, room.win.z, 0.26, 0.26, 0.26, '#8a8f99', { ink: 0.004 }).add(KG.cyl, room.win.x, room.win.y, room.win.z - 0.04, 0.2, 0.02, 0.2, '#1c1a22', { rx: Math.PI / 2, ink: 0 });
      room.hatch = { x: R.x - 0.4, z: room.wallZ + 1.05 };
      room.hatchG = new THREE.Group(); room.hatchG.position.set(room.hatch.x - 0.55, Y0 + 0.1, room.hatch.z); room.g.add(room.hatchG);
      const kh = PAST.API.Kit(); kh.box(0.55, 0.75, 0, 1.1, 1.5, 0.08, '#5e554c', { ink: 0.008 }); for (let j = 0; j < 3; j++) kh.box(0.55, 0.3 + j * 0.45, 0.05, 1.0, 0.04, 0.02, '#4a423a', { ink: 0 }); kh.add(PAST.API.KG.ball6, 0.95, 0.75, 0.07, 0.06, 0.06, 0.04, '#8a8f99', { ink: 0 }); kh.build(room.hatchG);
      k.box(room.hatch.x, Y0 + 0.85, room.hatch.z - 0.06, 1.12, 1.52, 0.04, '#121016', { ink: 0 });
      room.wallSolids = [{ obox: 1, x: R.x - 4.2, z: room.wallZ, hw: 2.8, hd: 0.5, rot: 0 }, { obox: 1, x: R.x + 3.6, z: room.wallZ, hw: 3.4, hd: 0.5, rot: 0 }, { obox: 1, x: room.hatch.x, z: room.wallZ, hw: 0.7, hd: 0.5, rot: 0 }];
      WORLD.extra.push(...room.wallSolids);
    }
    if (i === 2) {
      // the silent pool across the room, too deep to wade, and a bundle of dry reeds by the wall
      room.pool = { z: R.z - 1.0 };
      k.add(KG.cyl, R.x, Y0 + 0.01, room.pool.z, 6.4, 0.02, 1.8, '#2a2c36', { ink: 0 }).add(KG.cyl, R.x, Y0 + 0.02, room.pool.z, 6.0, 0.01, 1.5, '#3a3d4a', { ink: 0 });
      room.poolSolids = [{ obox: 1, x: R.x - 4.0, z: room.pool.z, hw: 2.9, hd: 1.4, rot: 0 }, { obox: 1, x: R.x + 4.0, z: room.pool.z, hw: 2.9, hd: 1.4, rot: 0 }, { obox: 1, x: R.x, z: room.pool.z, hw: 1.15, hd: 1.4, rot: 0 }];
      WORLD.extra.push(...room.poolSolids);
      room.reeds = { x: R.x + 5.0, z: R.z + 1.6 };
      for (let j = 0; j < 9; j++) k.rod([room.reeds.x - 0.3 + (j % 3) * 0.3, Y0, room.reeds.z + Math.floor(j / 3) * 0.2], [room.reeds.x - 0.5 + (j % 3) * 0.5, Y0 + 1.5, room.reeds.z + Math.floor(j / 3) * 0.25 - 0.2], 0.03, '#a39f8e', 0);
      k.add(KG.torus, room.reeds.x, Y0 + 0.6, room.reeds.z + 0.2, 0.42, 0.42, 0.42, '#7a6a4a', { rx: Math.PI / 2, ink: 0 });
      room.reedSolid = { x: room.reeds.x, z: room.reeds.z + 0.2, r: 0.55 }; WORLD.extra.push(room.reedSolid);
      room.bridgeG = new THREE.Group(); room.bridgeG.position.set(R.x, Y0, room.pool.z); room.bridgeG.visible = false; room.g.add(room.bridgeG);
      const kb = PAST.API.Kit(); for (let j = 0; j < 9; j++) kb.add(KG.cyl, 0, 0.08, -1.7 + j * 0.42, 0.13, 1.6, 0.13, j % 2 ? '#b4a978' : '#a89c6a', { rz: Math.PI / 2, ink: 0.006 }); kb.box(-0.62, 0.16, 0, 0.05, 0.05, 3.6, '#7a6a4a', { ink: 0 }).box(0.62, 0.16, 0, 0.05, 0.05, 3.6, '#7a6a4a', { ink: 0 }); kb.build(room.bridgeG);
    }
    if (i === 3) {
      // the dry throne: the old pad, cracked and gray; the Gray Toad on it, huge
      room.throne = { x: R.x, z: R.z - 3.2 };
      k.add(KG.cyl, room.throne.x, Y0 + 0.3, room.throne.z, 1.8, 0.6, 1.8, '#7d7a84').add(KG.cyl, room.throne.x, Y0 + 0.62, room.throne.z, 1.6, 0.05, 1.6, '#8f8c94', { ink: 0 })
        .box(room.throne.x, Y0 + 1.6, room.throne.z - 1.5, 2.6, 2.2, 0.3, '#6f6c76');
      for (let j = 0; j < 5; j++) k.box(room.throne.x - 1.0 + j * 0.5, Y0 + 0.66, room.throne.z - 0.4 + (j % 2) * 0.6, 0.03, 0.01, 0.9, '#55525c', { ry: j, ink: 0 });
      room.toad = grayIt(frogModel(room, room.throne.x, room.throne.z, 'white', 0, 'big')); room.toad.scale.multiplyScalar(1.5); room.toad0 = room.toad.scale.x; room.toad.position.y = Y0 + 0.62;
      room.toadSolid = { x: room.throne.x, z: room.throne.z, r: 1.9 }; WORLD.extra.push(room.toadSolid);
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#d8e6ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.orb.scale.setScalar(1.4); room.orb.position.set(room.throne.x, Y0 + 1.4, room.throne.z); room.g.add(room.orb);
    }
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.plank) setPlank(r0, true);
    if (s.window) openHatch(r1, true);
    if (s.bridge) setBridge(r2, true);
    [r0, r1, r2].forEach((r, i) => { if (r.seal && s['done' + i]) r.seal.visible = false; });
    if (s.boss) { r3.toad.visible = false; r3.toadSolid.x = 1e5; }
  }
  function setPlank(room, instant) {
    room.pitSolids[2].x = 1e5; room.plankSolid.x = 1e5;
    // (the plank is built leaning, tipped 1.1 about x: tipped back, it lies flat across the pit, its middle over the mud)
    if (instant) { room.plankG.position.set(room.R.x, K.Y0 - 0.2, room.pit.z + 0.49); room.plankG.rotation.set(-1.1, 0, 0); }
  }
  function openHatch(room, instant) { room.wallSolids[2].x = 1e5; if (instant) room.hatchG.rotation.y = -1.4; }
  function setBridge(room, instant) { room.poolSolids[2].x = 1e5; room.bridgeG.visible = true; if (instant) room.bridgeG.scale.set(1, 1, 1); }

  // ---------------------------------------------------------- the rooms' deeds
  async function plankTask(room) {
    const s = st(); const r = await plan('plank'); if (!r) return;
    const G = K.G, Mm = G.sim.mimo, o = room.plank, x1 = room.R.x, z1 = room.pit.z;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: o.x + 0.3, z: o.z + 1.2 }, o); await K.wait(0.8); Mm.hop = { t: 0 }; Sound.play('wood');
      await K.tween(1.0, kk => { room.plankG.position.set(lerp(o.x, x1, kk), K.Y0 + Math.sin(kk * Math.PI) * 0.5 - 0.2 * kk, lerp(o.z, z1 + 0.49, kk)); room.plankG.rotation.x = -1.1 * kk; room.plankG.rotation.y = 0; });
      setPlank(room, true); Sound.play('land', 10); G.w3d.fx.puff(x1, K.Y0 + 0.1, z1, 12, 0.3, '#a8a4ae'); s.plank = true; G.save();
      G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    UI.toast('A plank over the mud! Now you can cross.');
    if (await askLalo(0, 'fear')) await K.floorDone(0);
  }
  async function windowTask(room) {
    const s = st(); const r = await plan('window'); if (!r) return;
    const G = K.G, Mm = G.sim.mimo, w = room.win;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: w.x, z: w.z + 0.8 }, w); await K.wait(0.8); Sound.play('jump');
      await K.mimoArc({ x: w.x, z: w.z }, w.y - 0.2, 0.5); Mm.hidden = true; Sound.play('climb'); await K.wait(0.9);
      Sound.play('click'); await K.tween(0.7, kk => { room.hatchG.rotation.y = -1.4 * kk; }); openHatch(room, false); Sound.play('wood');
      Mm.hidden = false; await K.mimoArc({ x: room.hatch.x + 0.2, z: room.hatch.z + 0.6 }, K.Y0 + 0.2, 0.4);
      await K.mimoLand(); s.window = true; G.save();
    } finally { M.lock(false); }
    UI.toast('The hatch is open! The way goes through the old boat.');
    if (await askLalo(1, 'pass')) await K.floorDone(1);
  }
  async function bridgeTask(room) {
    const s = st(); const r = await plan('bridge'); if (!r) return;
    const G = K.G, rd = room.reeds;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 4.2, K.Y0 + 3.2, room.R.z + 4.6), K.V(room.R.x, K.Y0 + 0.3, room.pool.z));
      G.sim.mimoGo({ x: rd.x - 0.6, z: rd.z + 0.9 }, rd); await K.wait(0.8); Sound.play('wood');
      G.sim.mimoGo({ x: room.R.x + 0.9, z: room.pool.z + 2.2 }, { x: room.R.x, z: room.pool.z }); await K.wait(0.9);
      room.bridgeG.visible = true; room.bridgeG.scale.set(1, 1, 0.01);
      await K.tween(1.0, kk => { room.bridgeG.scale.z = Math.max(0.01, kk); });
      setBridge(room, true); Sound.play('land', 6); G.w3d.fx.puff(room.R.x, K.Y0 + 0.2, room.pool.z, 10, 0.3, '#d8d0b0');
      s.bridge = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); G.cam.override = null; }
    UI.toast('A bridge of dry reeds!');
    if (await askLalo(2, 'name')) await K.floorDone(2);
  }
  // the throne: the Gray Toad (the fight), Elio's echo, Lalo's last question, outside as the lake moves again
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.6, K.Y0 + 3.2, room.R.z + 3.4), K.V(room.throne.x, K.Y0 + 1.1, room.throne.z)); await K.wait(0.6); await M.you('The old Frog King, gone gray and huge… and something glows faintly in his throat.'); } finally { M.lock(false); G.cam.override = null; }
    const r = typeof LKBOSS !== 'undefined' ? await LKBOSS.fightToad() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Catch your breath. Say where it will jump, then answer its predictions with promises!' : 'The Gray Toad settles back on his dry throne, croaking about tomorrow.', 4.5); return; }
    s.boss = true; room.toadSolid.x = 1e5;
    M.lock(true);
    try {
      G.w3d.fx.puff(room.throne.x, K.Y0 + 1.0, room.throne.z, 18, 0.45, '#c8c6d2');
      room.orb.position.set(room.throne.x, K.Y0 + 1.3, room.throne.z);
      await K.tween(1.4, kk => { room.orb.material.opacity = kk * 0.95; room.orb.position.y = K.Y0 + 1.3 + kk * 1.2; room.orb.scale.setScalar(1.0 + kk * 0.8); room.toad.scale.setScalar(room.toad0 * (1 - kk * 0.6)); });
      room.toad.visible = false; Sound.play('chime'); await K.wait(0.4);
      await M.you('A man’s voice… quiet, a little hoarse. Saying something to someone, the way you say a promise.');
      const letter = typeof LKBOSS !== 'undefined' ? LKBOSS.letter('future') : 'B';
      await CH4.give('lake', 'future', letter);
      await K.tween(0.8, kk => { room.orb.material.opacity = 0.95 * (1 - kk); room.orb.position.y = K.Y0 + 2.5 + kk * 2; });
    } finally { M.lock(false); }
    G.save();
    if (await askLalo(3, 'will')) await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true; const f = fS(); f.floors = Math.max(f.floors || 0, 3);
    if (typeof LK_FUT !== 'undefined' && LK_FUT) LK_FUT.freed(); else TIME.flag('future', 'lkFree', true);
    await K.leave({ slow: true, then: async () => {
      if (typeof LK_FUT !== 'undefined' && LK_FUT) LK_FUT.show(true);
      const G = K.G; G.cam.override = { pos: K.V(OUT.x + 5.5, 4.4, OUT.z - 4.0), look: K.V(-176, 0.8, -151) }; G.cam.snap(OUT.yaw, 0.3, 9);
    } });
    const G = K.G;
    M.lock(true);
    try {
      for (let j = 0; j < 2; j++) { Sound.play('chime'); await K.wait(0.8); }
      await (TIME._.fast.on || !UI.chapter ? Promise.resolve() : UI.chapter('The Mirror Lake', 'moving again, tomorrow'));
      const L0 = M.who('future', 'lalo'); if (L0) { M.frame2(L0); await M.say(L0, T().LINES['lalo.after']); }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Both of the lake’s echoes are free. Noa is waiting at the time crack in Remanso’s square.', 5.5);
    G.save();
  }

  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().PLAN[kind].model || {})[lang()] || '', lang()))}»` : `Tell ${name}`);
    const B = room.lalo && room.lalo.api, answer = (ii, key, then) => ({ x: B.x - 0.6, z: B.z - 0.6, r: 1.6, label: 'Answer', run: async () => { if (await askLalo(ii, key)) await then(); } });
    if (B) out.push({ x: B.x - 0.6, z: B.z - 0.6, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { if (s.boss) await M.say(B, T().LINES['lalo.after']); else await M.demo(B, T().DEMO['d.f' + i], T().MARKS['d.f' + i]); } finally { M.lock(false); } } });
    if (i === 0) { if (!s.plank) out.push({ x: room.plank.x + 0.3, z: room.plank.z + 1.2, r: 1.6, label: sayQ('plank'), run: () => plankTask(room) }); else if (!s.done0) out.push(answer(0, 'fear', () => K.floorDone(0))); }
    if (i === 1) {
      if (!s.window) { out.push({ x: room.win.x, z: room.win.z + 1.0, r: 1.5, label: sayQ('window'), run: () => windowTask(room) }); out.push({ x: room.hatch.x, z: room.hatch.z + 0.9, r: 1.2, label: 'Look', run: async () => M.look(T().LOOKS['look.boat']) }); }
      else if (!s.done1) out.push(answer(1, 'pass', () => K.floorDone(1)));
    }
    if (i === 2) {
      if (!s.bridge) { out.push({ x: room.reeds.x - 0.9, z: room.reeds.z + 1.0, r: 1.6, label: sayQ('bridge'), run: () => bridgeTask(room) }); out.push({ x: room.R.x, z: room.pool.z + 2.2, r: 1.3, label: 'Look', run: async () => M.think('The pool is dark and perfectly still. Too deep to wade, and nothing moves in it.', 4.5) }); }
      else if (!s.done2) out.push(answer(2, 'name', () => K.floorDone(2)));
    }
    if (i === 3) {
      if (!s.boss) out.push({ x: room.throne.x, z: room.throne.z + 2.8, r: 2.4, label: 'Face the toad', run: () => bossScene(room) });
      else if (!s.done3) out.push(answer(3, 'will', () => finale()));
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i, B = room.lalo && room.lalo.api;
    if (i === 0) { if (!s.plank) return { x: room.plank.x, z: room.plank.z, hint: '{mimo} sniffs the old plank. It would reach across the mud.' }; if (!s.done0) return { x: B.x, z: B.z, hint: '{mimo} looks at {lalo}: he asked you something.' }; }
    if (i === 1) { if (!s.window) return { x: room.win.x, z: room.win.z, hint: '{mimo} peers up at the boat’s little round window.' }; if (!s.done1) return { x: B.x, z: B.z, hint: '{mimo} looks at {lalo}.' }; }
    if (i === 2) { if (!s.bridge) return { x: room.reeds.x, z: room.reeds.z, hint: '{mimo} tugs at the dry reeds by the wall.' }; if (!s.done2) return { x: B.x, z: B.z, hint: '{mimo} looks at {lalo}.' }; }
    if (i === 3) { if (!s.boss) return { x: room.throne.x, z: room.throne.z, hint: '{mimo} stares at the Gray Toad on the dry throne.' }; if (!s.done3) return { x: B.x, z: B.z, hint: '{mimo} looks at {lalo}.' }; }
    return null;
  }
  async function onFirst(room) {
    const P = room.lalo, i = room.i;
    if (i === 1 && !st().ambush) {
      await K.wait(1.0);
      await M.you('Gray frogs in the sunken boat! In here it’s tomorrow: say where one will jump, or give {mimo} a plan.');
      const r = await TIME.fight({ foes: [{ kind: 'frog', color: 'white', size: 'small' }, { kind: 'frog', color: 'white', size: 'small' }, { kind: 'frog', color: 'white', size: 'small' }], place: { x: -190, z: -146, biome: 'lake' } });
      if (!r || r.outcome !== 'win') return false;
      st().ambush = true; K.G.save();
    }
    const key = ['d.f0', 'd.f1', 'd.f2', 'd.f3'][i];
    if (P && key) { await K.wait(i === 1 ? 0.6 : 1.2); M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
    if (i === 0) M.think(`A pit of gray mud, and an old plank. In here {mimo} follows plans: ${M.sx('plan')}.`, 6);
    if (i === 1) M.think('The hatch is shut from inside… but there’s a little round window. Tell {mimo} its plan.', 5.5);
    if (i === 2) M.think('A deep, silent pool, and dry reeds by the wall. Tell {mimo} its plan.', 5);
    if (i === 3) M.think(`The Gray Toad on his dry throne. Say where he will jump, then answer his dark predictions with promises: ${M.sx('promise')}.`, 6.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.lalo) K.animate(room.lalo, dt, t);
    if (room.toad && room.toad.visible) { if (room.toad.userData && room.toad.userData.animate) room.toad.userData.animate(dt, t, 0); room.toad.rotation.y = Math.sin(t * 0.4) * 0.15; }
    if (room.seal && room.seal.visible) room.seal.material.opacity = 0.8 + Math.sin(t * 1.6) * 0.08;
  }
  // the grotto's own look: tomorrow's gray, a little lighter once the Gray Toad stops
  function late() {
    if (typeof FUTURE !== 'undefined' && FUTURE._ && FUTURE._.tintOn) { try { FUTURE._.tintOn(true); FUTURE._.tintK(st().done3 ? 0.85 : 0.2); } catch (e) { /* */ } }
  }
  const MOD = MOLMILL.make({
    name: 'lake-future-grotto', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: OUT, state: st,
    tint: { planks: ['#8a8790', '#82808a', '#918e97'], joint: '#4a4752', wall: '#7d7a84', wall2: '#74717c', stones: true, skirt: '#5e5b66', skirt2: '#55525c', trim: '#47444e', window: '#9fa4b0', beam: '#55525c', dust: true, puff: '#c8c6d2' },
    interior: { fog: '#3a3a46', near: 16, far: 50 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('lk_future_grot') ? 'lk_future_grot' : null),
  });
  // (the kit names its first room's way out for the mill: here it's the grotto)
  const ints0 = MOD.interactables;
  MOD.interactables = () => ints0().map(it => (it.label === 'Leave the mill' ? Object.assign({}, it, { label: 'Leave the grotto' }) : it));
  return Object.assign(MOD, { finale, askLalo, OUT });
})();
