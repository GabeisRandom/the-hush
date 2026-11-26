'use strict';
// The harbor office tomorrow (DESIGN.md 20.1b "T4a"): four rooms at y 300, z −30, x −430 / −404 / −378 / −352, on MOLMILL's room kit
// (molinar_past_mill.js), going up floor by floor like the kit's mill (its trapdoors and ladders), dressed as the old office gone gray:
// dust, cobwebs, shelves of logbooks nobody wrote in. Marino comes with you; up here, {mimo}'s moves are wishes too («Quiero que
// {mimo} empuje el armario»: PORTT.wishTask, the subjunctive), and the way up opens with a wish said out loud.
//   0 the Logbook Room: a heavy cabinet stands under the hatch: «Quiero que {mimo} empuje el armario»; the hatch is sealed gray:
//     «Ojalá que se abra la escotilla»
//   1 the Radio Room: an ambush of gray Hushlings (the Future's tense), then the silent radio: «Ojalá que alguien nos oiga» (a voice
//     answers from the fog: a ship that can't see the harbor)
//   2 the Lamp Room: the great lamp, dirty and cold, up on its stand: «Quiero que {mimo} suba a la lámpara»; «Espero que la luz vuelva»
//     (it flickers… but something on the roof is sitting on the light)
//   3 the Roof: the Gray Albatross on the beacon (port_time_boss.js), Elio's echo; the light reaches the sea, the ships answer, and
//     the harbor's color comes back (PT_FUT.freed)
const PT_FOFFICE = (() => {
  if (typeof MOLMILL === 'undefined' || typeof PORTT === 'undefined' || !PORTT) return null;
  const M = PORTT, T = () => PTFTXT, X = [-430, -404, -378, -352], Z = -30;
  const HW = MOLMILL.HW, HD = MOLMILL.HD, WH = MOLMILL.WH;
  const st = () => { const s = M.st('future'); return s.office || (s.office = {}); };
  const fS = () => M.st('future');
  const lang = () => M.lang();
  const marLook = { skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#4cb0d8', vest: '#3f4f66', hat: 'cap', hatColor: '#e2574c', h: 1.02 };
  const nm = id => M.nameOf(T().CAST[id]);
  let K = null;
  const OUT = { x: -229.4, z: -95.15, yaw: -Math.PI / 2 };

  // a wish for {mimo} (the subjunctive): PORTT.wishTask
  async function wishMove(kind) {
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const r = await M.ask(M.wishTask(T().MOVES[kind]), { icon: kind === 'lens' ? 'climb' : 'push', tips: T().TIPS });
    if (r) { K.quick[kind] = r.letter; TIME.grade('pf.move.' + kind, r.letter); }
    return r;
  }
  async function wishFor(taskKey) {
    const r = await M.ask(T().TASKS[taskKey], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('Nothing changes up here without a wish. Say one out loud.', 4); return null; }
    TIME.grade('pf.office.' + taskKey, r.letter); return r;
  }
  const floorsUp = i => { const f = fS(); f.floors = Math.max(f.floors || 0, Math.min(3, i + 1)); };
  let FOGWALL = null;
  const fogWall = () => FOGWALL || (FOGWALL = new THREE.MeshBasicMaterial({ color: '#8e8c98' }));      // (front side only, like the kit's walls)

  // ---------------------------------------------------------- the rooms
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, i = room.i;
    room.mar = api.person(room, marLook, i === 3 ? { x: R.x - 3.8, z: R.z + 3.4, yaw: 2.6 } : { x: R.x + 3.4, z: R.z + 3.2, yaw: -2.4 }, nm('marino'));
    // cobwebs in the corners, dust on the floor (every room)
    for (const [sx, sz] of [[-1, -1], [1, -1]]) k.box(R.x + sx * (HW - 0.6), Y0 + WH - 0.5, R.z + sz * (HD - 0.25), 0.9, 0.7, 0.02, '#c8c4d0', { ry: sx * 0.6, ink: 0 });
    for (let j = 0; j < 5; j++) k.add(KG.ball6, R.x - 5 + j * 2.4, Y0 + 0.02, R.z + 1.5 - (j % 2) * 3, 0.8, 0.02, 0.5, '#9a96a0', { ry: j, ink: 0 });
    if (i === 0) {
      // shelves of gray logbooks along the back wall, a counter, the cabinet under the hatch, the gray seal on the hatch
      for (let s = 0; s < 3; s++) { k.box(R.x + 1.8, Y0 + 0.8 + s * 1.1, R.z - HD + 0.35, 6.4, 0.08, 0.55, '#7a6a5e', { ink: 0.006 }); for (let b = 0; b < 16; b++) k.box(R.x - 1.2 + b * 0.38, Y0 + 1.1 + s * 1.1, R.z - HD + 0.38, 0.28, 0.5, 0.4, ['#6a6470', '#7a7480', '#5e5a66'][b % 3], { ink: 0.002 }); }
      k.box(R.x + 1.6, Y0 + 0.55, R.z + 0.4, 3.2, 1.1, 0.8, '#7a6a5e', { ink: 0.012 }).box(R.x + 1.6, Y0 + 1.12, R.z + 0.4, 3.4, 0.06, 0.95, '#8a7a6e', { ink: 0 });
      room.cab = new THREE.Group(); const kc = PAST.API.Kit(); kc.box(0, 1.2, 0, 1.6, 2.4, 0.9, '#6a5e56', { ink: 0.012 }).box(0, 1.2, 0.46, 0.04, 2.2, 0.02, '#3a3438', { ink: 0 }).box(0.3, 1.2, 0.47, 0.08, 0.2, 0.04, '#9a8a6a', { ink: 0 }); kc.build(room.cab);
      room.cabAt = { x: room.up.x, z: room.up.z - 0.2 }; room.cab.position.set(room.cabAt.x, Y0, room.cabAt.z); room.g.add(room.cab);
      room.cabSolid = { x: room.cabAt.x, z: room.cabAt.z, r: 0.9 }; WORLD.extra.push(room.cabSolid);
      room.book = new THREE.Group(); const kb = PAST.API.Kit(); kb.box(0, 0.05, 0, 0.6, 0.08, 0.45, '#5e5a66', { ink: 0.006 }).box(0.02, 0.1, 0, 0.56, 0.02, 0.42, '#e8e4dc', { ink: 0 }); kb.build(room.book);
      room.book.position.set(room.cabAt.x + 0.4, Y0, room.cabAt.z + 1.0); room.book.rotation.y = 0.5; room.book.visible = false; room.g.add(room.book);
      room.seal = new THREE.Mesh(new THREE.CircleGeometry(1.0, 20), new THREE.MeshBasicMaterial({ color: '#7f7b8a', transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
      room.seal.rotation.x = Math.PI / 2; room.seal.position.set(room.way.x, Y0 + WH - 0.2, room.way.z); room.g.add(room.seal);
    }
    if (i === 1) {
      // the radio desk: a big gray set with dials, a microphone, a chair, a wall map, an antenna cable up through the ceiling
      room.radio = { x: R.x - 1.6, z: R.z - HD + 1.2 };
      k.box(room.radio.x, Y0 + 0.4, room.radio.z, 2.4, 0.8, 1.0, '#6a6470', { ink: 0.012 }).box(room.radio.x, Y0 + 1.25, room.radio.z - 0.15, 1.8, 0.9, 0.6, '#5a5662', { ink: 0.012 });
      for (let j = 0; j < 4; j++) k.add(KG.cyl, room.radio.x - 0.6 + j * 0.4, Y0 + 1.35, room.radio.z + 0.16, 0.09, 0.04, 0.09, '#c9c4b8', { rx: Math.PI / 2, ink: 0.004 });
      k.box(room.radio.x + 0.5, Y0 + 1.0, room.radio.z + 0.18, 0.5, 0.25, 0.02, '#9fbf9a', { ink: 0 }).rod([room.radio.x - 0.4, Y0 + 0.82, room.radio.z + 0.3], [room.radio.x - 0.5, Y0 + 1.1, room.radio.z + 0.45], 0.02, '#3a3640', 0);
      k.add(KG.sphere, room.radio.x - 0.5, Y0 + 1.12, room.radio.z + 0.47, 0.07, 0.09, 0.07, '#3a3640', { ink: 0 });
      k.rod([room.radio.x + 0.8, Y0 + 1.7, room.radio.z - 0.3], [room.radio.x + 0.8, Y0 + WH, room.radio.z - 0.3], 0.03, '#3a3640', 0);
      k.box(R.x + 3.4, Y0 + 2.6, R.z - HD + 0.1, 2.6, 1.6, 0.03, '#b8b4a8', { ink: 0.004 });
      room.glowR = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#9fe8b0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); room.glowR.scale.setScalar(1.6); room.glowR.position.set(room.radio.x + 0.5, Y0 + 1.1, room.radio.z + 0.3); room.g.add(room.glowR);
    }
    if (i === 2) {
      // the great lamp on its stand, up high: a brass frame, a big glass lens; a ladder of iron rungs up the stand
      room.lamp = { x: R.x + 0.6, z: R.z - 2.6 };
      k.add(KG.cyl, room.lamp.x, Y0 + 1.1, room.lamp.z, 0.9, 2.2, 0.9, '#7a7680', { ink: 0.012 }).add(KG.cyl, room.lamp.x, Y0 + 2.25, room.lamp.z, 1.3, 0.1, 1.3, '#8a7a5a', { ink: 0.008 });
      k.add(KG.cyl, room.lamp.x, Y0 + 3.0, room.lamp.z, 0.75, 1.4, 0.75, '#a8b0b8', { ink: 0.01 }).add(KG.cyl, room.lamp.x, Y0 + 3.75, room.lamp.z, 0.85, 0.12, 0.85, '#8a7a5a', { ink: 0.006 }).add(KG.half, room.lamp.x, Y0 + 3.8, room.lamp.z, 0.6, 0.4, 0.6, '#8a7a5a', { ink: 0.008 });
      for (let j = 0; j < 5; j++) k.box(room.lamp.x + 0.95, Y0 + 0.3 + j * 0.42, room.lamp.z, 0.06, 0.06, 0.5, '#5a5662', { ink: 0 });
      room.glowL = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff1b8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); room.glowL.scale.setScalar(3.2); room.glowL.position.set(room.lamp.x, Y0 + 3.0, room.lamp.z); room.g.add(room.glowL);
      room.dirt = []; for (let j = 0; j < 8; j++) { const a = j / 8 * TAU; const d = new THREE.Mesh(new THREE.CircleGeometry(0.18, 8), new THREE.MeshBasicMaterial({ color: '#5a5660', transparent: true, opacity: 0.8 })); d.position.set(room.lamp.x + Math.cos(a) * 0.77, Y0 + 2.8 + (j % 3) * 0.3, room.lamp.z + Math.sin(a) * 0.77); d.lookAt(room.lamp.x + Math.cos(a) * 3, Y0 + 2.8 + (j % 3) * 0.3, room.lamp.z + Math.sin(a) * 3); room.g.add(d); room.dirt.push(d); }
      room.lampSolid = { x: room.lamp.x, z: room.lamp.z, r: 1.3 }; WORLD.extra.push(room.lampSolid);
    }
    if (i === 3) {
      // the roof, out in the fog: the walls turned to fog, a parapet, the beacon on its stand, the albatross sitting on it
      for (const m of room.g.children) if (m.isMesh && m.geometry && m.geometry.type === 'PlaneGeometry' && Math.abs((m.geometry.parameters || {}).height - WH) < 0.01) m.material = fogWall();
      k.box(R.x, Y0 + 0.5, R.z - HD + 0.2, HW * 2, 1.0, 0.3, '#9a96a0', { ink: 0.01 });
      for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.15), Y0 + 0.5, R.z, 0.3, 1.0, HD * 2, '#9a96a0', { ink: 0.01 });
      room.beacon = { x: R.x, z: R.z - 2.2 };
      k.add(KG.cyl, room.beacon.x, Y0 + 0.8, room.beacon.z, 1.0, 1.6, 1.0, '#8a8690', { ink: 0.012 }).add(KG.cyl, room.beacon.x, Y0 + 2.1, room.beacon.z, 0.7, 1.0, 0.7, '#c8d0d8', { ink: 0.01 }).add(KG.half, room.beacon.x, Y0 + 2.6, room.beacon.z, 0.75, 0.5, 0.75, '#6a6470', { ink: 0.008 });
      k.add(KG.cyl6, R.x + 4.6, Y0 + 2.4, R.z - 3.6, 0.06, 4.8, 0.06, '#7a7680', { ink: 0 }).box(R.x + 5.1, Y0 + 4.4, R.z - 3.6, 1.0, 0.6, 0.03, '#6a7a8a', { ink: 0.004 });
      room.bossSolid = { x: room.beacon.x, z: room.beacon.z, r: 1.8 }; WORLD.extra.push(room.bossSolid);
      if (typeof PTBOSS !== 'undefined' && PTBOSS.albaModel) { const h = PTBOSS.albaModel(); room.bird = h.root; room.birdH = h; h.root.position.set(room.beacon.x, Y0 + 2.6, room.beacon.z); h.root.scale.setScalar(0.85); room.g.add(h.root); }
      room.glowB = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff1b8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); room.glowB.scale.setScalar(6); room.glowB.position.set(room.beacon.x, Y0 + 2.2, room.beacon.z); room.g.add(room.glowB);
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffe6a8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); room.orb.scale.setScalar(1.4); room.orb.position.set(room.beacon.x, Y0 + 2.4, room.beacon.z); room.g.add(room.orb);
    }
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.shelf) { r0.cab.position.x = r0.cabAt.x + 2.2; r0.cabSolid.x = r0.cabAt.x + 2.2; r0.book.visible = true; }
    if (s.done0) r0.seal.visible = false;
    if (s.radio) r1.glowR.material.opacity = 0.55;
    if (s.climb) r2.dirt.forEach(d => { d.visible = false; });
    if (s.lamp) r2.glowL.material.opacity = 0.7;
    if (s.boss) { r3.glowB.material.opacity = 0.9; if (r3.bird) r3.bird.visible = false; r3.bossSolid.x = 1e5; }
  }

  // ---------------------------------------------------------- the rooms' deeds
  async function demoMar(room, key) { const P = room.mar; if (!P) return; M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
  async function cabTask(room) {
    const s = st(); const r = await wishMove('shelf'); if (!r) return;
    const G = K.G, c = room.cabAt;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: c.x - 1.0, z: c.z + 1.0 }, c); await K.wait(0.8); Sound.play('push');
      await K.tween(1.0, kk => { room.cab.position.x = c.x + kk * 2.2; }); room.cabSolid.x = c.x + 2.2; Sound.play('wood');
      room.book.visible = true; s.shelf = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    M.think('A logbook fell from the cabinet. And the hatch above is sealed gray. Say a wish for it.', 5);
  }
  async function hatchTask(room) {
    const s = st(); const r = await wishFor('hatch'); if (!r) return;
    const G = K.G;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x - 1.0, K.Y0 + 2.4, room.R.z + 2.6), K.V(room.way.x, K.Y0 + WH - 0.4, room.way.z)); await K.wait(0.4);
      Sound.play('crunch'); G.w3d.fx.puff(room.way.x, K.Y0 + WH - 0.5, room.way.z, 14, 0.4, '#b8b6c4');
      await K.tween(0.6, kk => { room.seal.material.opacity = 0.85 * (1 - kk); room.seal.scale.setScalar(1 + kk * 0.4); }); room.seal.visible = false;
      const P = room.mar; if (P) { M.frame2(P.api); await M.say(P.api, T().LINES['marino.r0']); }
    } finally { M.lock(false); }
    floorsUp(0); await K.floorDone(0);
  }
  async function radioTask(room) {
    const s = st(); const r = await wishFor('radio'); if (!r) return;
    const G = K.G, rd = room.radio;
    M.lock(true);
    try {
      M.shot(K.V(rd.x + 3.0, K.Y0 + 2.2, rd.z + 4.0), K.V(rd.x, K.Y0 + 1.2, rd.z)); await K.wait(0.4);
      room.glowR.material.opacity = 0.55; G.w3d.fx.sparkle(rd.x + 0.5, K.Y0 + 1.3, rd.z + 0.3, 12, ['#9fe8b0', '#ffffff']); Sound.play('tick'); await K.wait(0.6);
      const voice = { id: 'radio', name: '📻', x: rd.x, y: K.Y0, z: rd.z, top: 1.9, talking: false };
      await M.hushed(voice, T().LINES['radio.voice']);
      s.radio = true; G.save();
      const P = room.mar; if (P) { M.frame2(P.api); await M.say(P.api, T().LINES['marino.radio']); }
    } finally { M.lock(false); }
    floorsUp(1); await K.floorDone(1);
  }
  async function climbTask(room) {
    const s = st(); const r = await wishMove('lens'); if (!r) return;
    const G = K.G, l = room.lamp;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: l.x + 1.4, z: l.z + 1.0 }, l); await K.wait(0.8); Sound.play('climb');
      await K.mimoArc({ x: l.x + 0.9, z: l.z + 0.2 }, K.Y0 + 2.4, 0.9);
      for (const d of room.dirt) { d.visible = false; G.w3d.fx.sparkle(d.position.x, d.position.y, d.position.z, 4, ['#ffffff', '#fff1b8']); Sound.play('pip'); await K.wait(0.12); }
      await K.mimoLand(); s.climb = true; G.save();
    } finally { M.lock(false); }
    M.think('The great lamp is clean. Now say what you hope for its light.', 4.5);
  }
  async function lampTask(room) {
    const s = st(); const r = await wishFor('lamp'); if (!r) return;
    const G = K.G, l = room.lamp;
    M.lock(true);
    try {
      M.shot(K.V(l.x + 3.4, K.Y0 + 3.0, l.z + 4.4), K.V(l.x, K.Y0 + 2.8, l.z)); await K.wait(0.4);
      for (let j = 0; j < 4; j++) { room.glowL.material.opacity = j % 2 ? 0.2 : 0.8; Sound.play('tick'); await K.wait(0.25); }
      room.glowL.material.opacity = 0.7; s.lamp = true; G.save(); Sound.play('chime');
      await K.tween(0.8, kk => { room.glowL.material.opacity = 0.7 - Math.sin(kk * Math.PI) * 0.5; });
      const P = room.mar; if (P) { M.frame2(P.api); await M.say(P.api, T().LINES['marino.r2']); }
    } finally { M.lock(false); }
    floorsUp(2); await K.floorDone(2);
  }
  // the roof: the Gray Albatross (the fight), Elio's echo, the light reaches the sea
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.8, K.Y0 + 3.2, room.R.z + 4.0), K.V(room.beacon.x, K.Y0 + 3.0, room.beacon.z)); await K.wait(0.6); await M.you('A huge gray bird sits on the beacon, its wings spread over the light… and something under its wing hums like a man’s voice.'); } finally { M.lock(false); }
    const r = typeof PTBOSS !== 'undefined' ? await PTBOSS.fightAlbatross() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Plans, then wishes!' : 'The gray bird folds its wings back over the light.', 4); return; }
    s.boss = true;
    M.lock(true);
    try {
      if (room.bird) { const b = room.bird; await K.tween(1.4, kk => { b.position.y = K.Y0 + 2.6 + kk * 6; b.position.z = room.beacon.z - kk * 8; }); b.visible = false; }
      room.bossSolid.x = 1e5;
      await K.tween(1.0, kk => { room.glowB.material.opacity = kk * 0.9; room.glowB.scale.setScalar(6 + kk * 4); }); Sound.play('chime');
      G.w3d.fx.sparkle(room.beacon.x, K.Y0 + 2.6, room.beacon.z, 26, ['#fff1b8', '#9fd0e8', '#ffffff']);
      await K.wait(0.8);
      await K.tween(1.4, kk => { room.orb.material.opacity = kk * 0.95; room.orb.position.y = K.Y0 + 2.4 + kk * 1.0; room.orb.scale.setScalar(1.0 + kk * 0.8); });
      await M.you('A man’s voice, warm and a little rough… the voice of someone who finally learned to say it.');
      const letter = typeof PTBOSS !== 'undefined' ? PTBOSS.letter('future') : 'B';
      await CH4.give('port', 'future', letter);
      await K.tween(0.8, kk => { room.orb.material.opacity = 0.95 * (1 - kk); room.orb.position.y = K.Y0 + 3.4 + kk * 2; });
      const P = room.mar; if (P) { M.frame2(P.api); await M.say(P.api, T().LINES['marino.end']); }
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true;
    if (typeof PT_FUT !== 'undefined' && PT_FUT) PT_FUT.freed(); else TIME.flag('future', 'pbFree', true);
    await K.leave({ slow: true, then: async () => { const G = K.G; G.cam.override = { pos: K.V(OUT.x - 3.0, 4.6, OUT.z + 10.0), look: K.V(-248.5, 2.0, -70.0) }; G.cam.snap(OUT.yaw, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      await K.wait(1.0);
      for (let j = 0; j < 8; j++) { G.w3d.fx.sparkle(-248.5 + (Math.random() - 0.5) * 9, 2 + Math.random() * 5, -66.2, 6, ['#ffd166', '#9fd0e8', '#f6efe0']); await K.wait(0.12); }
      const D = typeof PT_FUT !== 'undefined' && PT_FUT ? PT_FUT.who('marino') : null;
      if (D) { M.frame2(D); await M.say(D, T().LINES['marino.free']); }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Elio’s words are free. Noa is waiting at the time crack in the plaza.', 5.5);
    G.save();
  }

  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().MOVES[kind].model || {})[lang()] || '', lang()))}»` : `Tell ${name}`);
    if (room.mar) out.push({ x: room.mar.api.x - 0.6, z: room.mar.api.z - 0.6, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { await M.say(room.mar.api, T().LINES[s.boss ? 'marino.end' : 'marino.in']); } finally { M.lock(false); } } });
    const look = (x, z, id, line) => out.push({ x, z, r: 1.2, label: 'Look', run: async () => M.lookAt(id, line, 5) });
    if (room.intro) return out;          // (a room's first moments: Marino's demonstration, the ambush, before anything to do)
    if (i === 0) {
      look(room.R.x + 1.8, room.R.z - HD + 1.6, 'w.pf_logbook', 'Shelves of {w.pf_logbook:pl}, one for every year. The last ones are thin.');
      if (!s.shelf) out.push({ x: room.cabAt.x + 1.0, z: room.cabAt.z + 1.6, r: 1.7, label: sayQ('shelf'), run: () => cabTask(room) });
      else {
        look(room.book.position.x + 0.6, room.book.position.z + 0.6, 'w.pf_last', 'The {w.pf_last} logbook, open on the floor. Every line says the same: no ship today.');
        if (!s.done0) out.push({ x: room.way.x + 0.8, z: room.way.z + 2.4, r: 1.8, label: 'Wish', run: () => hatchTask(room) });
      }
    }
    if (i === 1) {
      look(room.R.x + 3.4, room.R.z - HD + 1.2, 'w.pf_signal', 'A map of the coast, pins where the ships used to {w.pf_signal}. All the pins are gray.');
      if (!s.radio) out.push({ x: room.radio.x + 0.2, z: room.radio.z + 1.8, r: 1.8, label: 'Wish', run: () => radioTask(room) });
      else look(room.radio.x + 1.6, room.radio.z + 1.4, 'w.pf_radio', 'The {w.pf_radio} hums, a little green light on. Somewhere out there, someone heard.');
    }
    if (i === 2) {
      if (!s.climb) out.push({ x: room.lamp.x + 1.6, z: room.lamp.z + 1.8, r: 1.8, label: sayQ('lens'), run: () => climbTask(room) });
      else if (!s.lamp) out.push({ x: room.lamp.x + 0.2, z: room.lamp.z + 2.4, r: 1.8, label: 'Wish', run: () => lampTask(room) });
      else look(room.lamp.x - 1.4, room.lamp.z + 1.8, 'w.pf_lens', 'The great {w.pf_lens}, clean and warm. Its light shakes, as if something above it is moving.');
    }
    if (i === 3) {
      look(room.R.x - 4.6, room.R.z + 1.4, 'w.pf_horizon', 'Gray fog all round, down to the {w.pf_horizon}. Somewhere in it, ships are waiting.');
      if (!s.boss) out.push({ x: room.beacon.x, z: room.beacon.z + 3.0, r: 2.2, label: 'Face the bird', run: () => bossScene(room) });
      else if (!s.done3) out.push({ x: room.beacon.x, z: room.beacon.z + 3.0, r: 2.2, label: 'Go down', run: finale });
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!s.shelf) return { x: room.cabAt.x, z: room.cabAt.z, hint: '{mimo} leans on the heavy cabinet.' }; if (!s.done0) return { x: room.way.x, z: room.way.z, hint: '{mimo} looks up at the gray seal on the hatch.' }; }
    if (i === 1 && !s.radio) return { x: room.radio.x, z: room.radio.z, hint: '{mimo} taps the silent radio.' };
    if (i === 2) { if (!s.climb) return { x: room.lamp.x, z: room.lamp.z, hint: '{mimo} looks up at the dirty lamp.' }; if (!s.lamp) return { x: room.lamp.x, z: room.lamp.z, hint: '{mimo} looks at the cold lamp.' }; }
    if (i === 3 && !s.boss) return { x: room.beacon.x, z: room.beacon.z, hint: '{mimo} stares at the gray bird on the beacon.' };
    return null;
  }
  // (while a room's first moments play, its tasks wait: room.intro; teach before ask)
  async function onFirst(room) { room.intro = true; try { return await onFirst0(room); } finally { room.intro = false; } }
  async function onFirst0(room) {
    const P = room.mar, i = room.i, s = st();
    if (i === 0) { await K.wait(0.8); if (P) { M.lock(true); try { M.frame2(P.api); await M.say(P.api, T().LINES['marino.in']); } finally { M.lock(false); } } }
    if (i === 1 && !s.ambush) {
      await K.wait(1.0);
      await M.you('Gray Hushlings in the dark radio room! Tomorrow, tell {mimo} its plans.');
      const r = await TIME.fight({ foes: [{ kind: 'hushling', color: 'white', size: 'small' }, { kind: 'hushling', color: 'blue', size: 'small' }, { kind: 'hushling', color: 'white', size: 'small' }], place: { x: -214, z: -86 } });
      if (!r || r.outcome !== 'win') return false;
      s.ambush = true; K.G.save();
    }
    const key = ['d.r0', 'd.r1', 'd.r2', null][i];
    if (P && key) { await K.wait(0.6); await demoMar(room, key); }
    if (i === 0) M.think(`A cabinet under the hatch, and a gray seal on it. Tell {mimo} what you want it to do: ${M.sx('mwish')}.`, 6);
    if (i === 1) M.think('The radio is silent. Say a wish into it.', 4.5);
    if (i === 2) M.think('The great lamp is dirty and cold, up on its stand. Tell {mimo} what you want it to do.', 5);
    if (i === 3) M.think('The beacon, and the bird on it. Face it.', 4.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.mar) K.animate(room.mar, dt, t);
    if (room.bird && room.bird.visible && room.birdH) { const h = room.birdH; (h.wings || []).forEach((w, j) => { w.rotation.z = (j ? -1 : 1) * (Math.sin(t * 1.4) * 0.15 - 0.1); }); h.body.position.y = Math.sin(t * 1.1) * 0.06; }
    if (room.glowB && st().boss) room.glowB.material.opacity = 0.75 + 0.15 * Math.sin(t * 2.4);
    if (room.glowR && st().radio) room.glowR.material.opacity = 0.45 + 0.15 * Math.sin(t * 5);
  }
  // the office's own look: tomorrow's drained gray, the color coming back floor by floor
  function late(dt) {
    const s = st(), n = ['done0', 'done1', 'done2', 'done3'].filter(k0 => s[k0]).length;
    if (TIME.look) TIME.look.apply('future', dt, Math.min(1, 0.2 + n * 0.16));
  }
  const MOD = MOLMILL.make({
    name: 'port-future-office', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: OUT, state: st,
    tint: { planks: ['#7a7672', '#6f6b68', '#837e7a'], joint: '#4a4644', wall: '#a8b0b8', wall2: '#9aa2aa', skirt: '#5f6f86', skirt2: '#526276', trim: '#8a929a', window: '#8f9aa4', beam: '#8a929a', puff: '#b8b6c4', dust: true },
    interior: { fog: '#6a6872', near: 14, far: 48 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('pb_future_office') ? 'pb_future_office' : null),
  });
  // (the kit names its ways for the mill: here they're the office's)
  const ints0 = MOD.interactables;
  MOD.interactables = () => ints0().map(it => (it.label === 'Leave the mill' ? Object.assign({}, it, { label: 'Leave the office' }) : it.label === 'Climb' ? Object.assign({}, it, { label: 'Climb up' }) : it));
  return Object.assign(MOD, { finale, OUT });
})();
