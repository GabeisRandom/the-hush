'use strict';
// The frogs' grotto under the little island, long ago (DESIGN.md 18.10 "T2a"): four rooms at y 300, z −300, x −430 / −404 / −378 /
// −352, on MOLMILL's room kit (molinar_past_mill.js: inward walls, the way up through a trapdoor, «Climb»), dressed as mossy stone,
// reeds and water. Young Bartolo, the ferryman's boy, sneaks in after you and asks what you did, room by room; {mimo} moves only in
// memories, and its verbs are irregular («{mimo} puso…», «fue…», «dijo…»).
//   0 the Reed Gate: a channel of black water across the floor; «{mimo} puso la piedra en el hueco» makes a stepping stone;
//     Bartolo: «¿Tuviste miedo?» → «No, no tuve miedo»
//   1 the Echo Hall (where the boy hid: a scrap of red wool): an ambush of look-alike frogs (the Past's tense, say which one); an iron
//     gate bolted from the other side: «{mimo} fue por el túnel»; Bartolo: «¿Pudiste pasar?» → «Sí, pude pasar»
//   2 the Pond of Three Frogs: one has the key in its mouth: «{mimo} fue a la rana del medio» (left / middle / right, the lake's
//     own rule); Bartolo: «¿Trajiste la llave?» → «Sí, traje la llave»
//   3 the Frog King's Throne: the guard lets only frogs through («{mimo} dijo "¡croac!"»), the Frog King (lake_time_boss.js), Elio's
//     echo, Bartolo: «¿Qué le dijiste al rey?» → «Le dije la verdad»; then outside at dusk, the man on the shore turns round.
const LK_PGROT = (() => {
  if (typeof MOLMILL === 'undefined' || typeof LAKET === 'undefined' || !LAKET) return null;
  const M = LAKET, T = () => LPTXT, X = [-430, -404, -378, -352], Z = -300;
  const st = () => { const s = M.st('past'); return s.grot || (s.grot = {}); };
  const pS = () => M.st('past');
  const lang = () => M.lang();
  const bartoloLook = { kid: true, skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#5a86b8', hat: 'cap', hatColor: '#e8e2d6', h: 0.74 };
  const nm = id => M.nameOf(T().CAST[id]);
  let K = null;
  const OUT = { x: M.DOOR.x + 0.9, z: M.DOOR.z - 0.7, yaw: Math.atan2(M.BAR.a.x - M.DOOR.x, M.BAR.a.z - M.DOOR.z) };

  // ---------------------------------------------------------- Bartolo's question at the end of each room: the 2nd person, shown; then
  // your answer about yourself (the 1st); the room holds once it's said
  async function askBartolo(i, key) {
    const room = K.rooms[i], P = room.bart;
    if (P) { M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().LOGQ[key], T().LOGQ_MARKS[key]); } finally { M.lock(false); } }
    const r = await M.ask(T().TASKS[key], { tips: T().TIPS });
    if (!r) { M.think('{bartolo} is still waiting for your answer.', 4); return false; }
    TIME.grade('lk.grot.' + key, r.letter);
    Sound.play('review');
    const p = pS(); p.floors = Math.max(p.floors || 0, Math.min(3, i + 1));
    return true;
  }
  // a memory for {mimo} (the first time, the card about memories with irregular verbs)
  async function memory(kind) {
    const s = st(), p = pS();
    if (!p.memCard) { p.memCard = true; await M.card(T().CARDS.mimo); }
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const r = await M.ask(T().MEM[kind], { icon: T().MEM[kind].icon || 'push', tips: T().TIPS });
    if (r) { K.quick[kind] = r.letter; TIME.grade('lk.mem.' + kind, r.letter); }
    void s; return r;
  }

  // ---------------------------------------------------------- the rooms
  function reeds(k, R, Y0) { for (let i = 0; i < 18; i++) { const side = i % 2 ? 1 : -1, x = R.x + side * (6.2 - (i % 3) * 0.3), z = R.z - 5 + (i * 0.61) % 10; k.rod([x, Y0, z], [x + side * 0.1, Y0 + 1.2 + (i % 4) * 0.25, z], 0.03, '#8a9a4a', 0).add(PAST.API.KG.cone, x + side * 0.1, Y0 + 1.3 + (i % 4) * 0.25, z, 0.05, 0.22, 0.05, '#7a5a32', { ink: 0 }); } }
  function frogModel(room, x, z, color, yaw) {
    let f = null;
    if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) { try { f = BATTLE.buildFoe('frog', color || 'green', { size: 'small' }); } catch (e) { f = null; } }
    if (!f) { f = new THREE.Group(); f.add(TK.part(TK.G.sphere, '#5aa04a', [0, 0.35, 0], [0.45, 0.35, 0.45], { ink: 0.02 })); f.userData = {}; }
    f.position.set(x, K.Y0, z); f.rotation.y = yaw || 0; room.g.add(f); return f;
  }
  function crownMesh() {
    const g = new THREE.Group(), k = PAST.API.Kit(), KG = PAST.API.KG;
    k.add(KG.cyl, 0, 0, 0, 0.26, 0.16, 0.26, '#f2c14e', { ink: 0.008 });
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; k.add(KG.cone4, Math.cos(a) * 0.2, 0.16, Math.sin(a) * 0.2, 0.07, 0.18, 0.07, '#f2c14e', { ink: 0.006 }); }
    k.add(KG.ball6, 0.24, 0.02, 0, 0.05, 0.05, 0.05, '#e0503f', { ink: 0 }); k.build(g); return g;
  }
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, i = room.i;
    M.caveShell(room, api, 'past', k);      // (the kit's plaster walls, beams and windows: rock here)
    reeds(k, R, Y0);
    for (const [dx, dz, s] of [[-5.8, 4.2, 0.7], [5.6, -3.6, 0.9], [-5.4, -4.4, 0.6], [5.9, 3.8, 0.5]]) k.add(KG.sphere, R.x + dx, Y0 + s * 0.5, R.z + dz, s, s * 0.8, s, '#6f786a', { ink: 0.012 });
    // the grotto's rock: boulders banked against the walls, stalactites, moss, a drip pool, a shaft of watery light
    for (let j = 0; j < 9; j++) { const side = j % 3, x = side === 0 ? R.x - 6.5 : side === 1 ? R.x + 6.5 : R.x - 5 + (j % 5) * 2.5, z = side === 2 ? R.z - 5.6 : R.z - 4.5 + j * 1.1, s = 0.9 + (j % 4) * 0.35;
      k.add(KG.sphere, x, Y0 + s * 0.55, z, s * 1.1, s * 1.4, s, j % 2 ? '#5e6a5c' : '#687466', { ry: j, ink: 0.014 }); }
    for (let j = 0; j < 7; j++) k.add(KG.cone, R.x - 5 + j * 1.7, Y0 + 5.1, R.z - 3.5 + (j % 3) * 2.8, 0.22, 0.9 + (j % 3) * 0.3, 0.22, '#5a6458', { rx: Math.PI, ink: 0.008 });
    for (let j = 0; j < 6; j++) k.box(R.x - 6.6 + (j % 2) * 13.2, Y0 + 3.6 - (j % 3) * 0.4, R.z - 3 + j * 1.3, 0.08, 1.1, 0.6, '#5f7a3a', { ink: 0 });
    k.add(KG.cyl, R.x + 4.4, Y0 + 0.012, R.z - 4.2, 0.9, 0.02, 0.7, '#2e4a48', { ink: 0 });
    room.bart = api.person(room, bartoloLook, i === 0 ? { x: R.x + 4.2, z: R.z + 3.0, yaw: -2.4 } : i === 3 ? { x: R.x - 4.6, z: R.z + 3.2, yaw: 2.5 } : { x: R.x + 4.6, z: R.z + 2.6, yaw: -2.5 }, nm('bartolo'));
    if (i === 0) {
      // the channel of black water across the room (the way up is beyond it), the flat stone by the wall
      room.chan = { z: R.z - 0.6 };
      k.box(R.x, Y0 + 0.01, room.chan.z, 14, 0.02, 1.7, '#16201f', { ink: 0 }).box(R.x, Y0 + 0.02, room.chan.z, 14, 0.01, 1.3, '#23413e', { ink: 0 });
      room.chanSolids = [{ obox: 1, x: R.x - 4.2, z: room.chan.z, hw: 2.8, hd: 0.85, rot: 0 }, { obox: 1, x: R.x + 4.2, z: room.chan.z, hw: 2.8, hd: 0.85, rot: 0 }, { obox: 1, x: R.x, z: room.chan.z, hw: 1.45, hd: 0.85, rot: 0 }];
      WORLD.extra.push(...room.chanSolids);
      room.stone = { x: R.x - 3.2, z: R.z + 2.4 };
      room.stoneG = new THREE.Group(); room.stoneG.position.set(room.stone.x, Y0, room.stone.z); room.g.add(room.stoneG);
      const ks = PAST.API.Kit(); ks.add(KG.cyl, 0, 0.14, 0, 0.75, 0.28, 0.6, '#9a9488', { ink: 0.012 }); ks.build(room.stoneG);
      room.stoneSolid = { x: room.stone.x, z: room.stone.z, r: 0.7 }; WORLD.extra.push(room.stoneSolid);
    }
    if (i === 1) {
      // the iron gate across the back of the hall, bolted on the far side; the tiny tunnel by it; the boy's red wool on a ledge
      room.gateZ = R.z - 1.4;
      room.gateG = new THREE.Group(); room.gateG.position.set(R.x - 7, Y0, room.gateZ); room.g.add(room.gateG);
      const kg = PAST.API.Kit(); for (let j = 0; j <= 22; j++) kg.box(j * 0.62 + 0.18, 1.6, 0, 0.07, 3.2, 0.07, '#3b3f48', { ink: 0.006 }); kg.box(7, 3.1, 0, 14, 0.12, 0.1, '#3b3f48', { ink: 0.006 }).box(7, 0.4, 0, 14, 0.1, 0.1, '#3b3f48', { ink: 0.006 }); kg.build(room.gateG);
      room.gateSolid = { obox: 1, x: R.x, z: room.gateZ, hw: 7, hd: 0.3, rot: 0 }; WORLD.extra.push(room.gateSolid);
      room.tunnel = { x: R.x + 5.2, z: room.gateZ + 0.4 };
      k.add(KG.half, R.x + 5.2, Y0, room.gateZ - 0.1, 0.55, 0.55, 0.3, '#121614', { rx: -Math.PI / 2, ink: 0 }).add(KG.sphere, R.x + 5.2, Y0 + 0.6, room.gateZ - 0.2, 0.9, 0.7, 0.4, '#5f685c', { ink: 0.01 });
      room.wool = { x: R.x - 5.6, z: R.z + 0.8 };
      k.box(room.wool.x, Y0 + 1.1, room.wool.z, 0.6, 0.12, 0.5, '#6f786a').add(KG.sphere, room.wool.x + 0.1, Y0 + 1.2, room.wool.z, 0.1, 0.05, 0.08, '#d0403a', { ink: 0.004 });
    }
    if (i === 2) {
      // the pond, three lily pads in a row (left / middle / right as you face them), a frog on each; one has the key in its mouth
      k.add(KG.cyl, R.x, Y0 + 0.01, R.z - 1.6, 5.4, 0.02, 2.6, '#2f5f68', { ink: 0 });
      room.pads = { left: { x: R.x - 2.6, z: R.z - 1.6 }, middle: { x: R.x, z: R.z - 1.6 }, right: { x: R.x + 2.6, z: R.z - 1.6 } };
      for (const p of Object.values(room.pads)) k.add(KG.cyl, p.x, Y0 + 0.04, p.z, 0.9, 0.04, 0.9, '#4f9a4a', { ink: 0.006 });
      room.pondSolid = { obox: 1, x: R.x, z: R.z - 1.6, hw: 5.2, hd: 1.4, rot: 0 }; WORLD.extra.push(room.pondSolid);
      room.frogs = {}; for (const [kk, p] of Object.entries(room.pads)) room.frogs[kk] = frogModel(room, p.x, p.z, 'green', 0);
      room.glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff2a8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); room.glint.scale.setScalar(0.7); room.g.add(room.glint);
      room.keyG = new THREE.Group(); const kk2 = PAST.API.Kit(); kk2.add(KG.torus, 0, 0.12, 0, 0.1, 0.1, 0.1, '#f2c14e', { ink: 0.004 }).box(0.18, 0.12, 0, 0.26, 0.04, 0.04, '#f2c14e', { ink: 0.004 }); kk2.build(room.keyG); room.keyG.visible = false; room.g.add(room.keyG);
      // the door at the back: locked (a padlock) until the key comes
      room.lock = new THREE.Group(); const kl = PAST.API.Kit(); kl.box(0, 0, 0, 0.36, 0.3, 0.12, '#a07a30').add(KG.torus, 0, 0.2, 0, 0.12, 0.12, 0.12, '#8a8f99', { ink: 0.004 }); kl.build(room.lock); room.lock.position.set(R.x - 4.6, Y0 + 1.6, R.z - 5.6); room.g.add(room.lock);
    }
    if (i === 3) {
      // the guard at the throne room's narrows, the throne (a great stone pad), the king on it, two look-alike guards beside him
      room.guard = { x: R.x + 2.0, z: R.z + 1.6 };
      room.guardG = frogModel(room, room.guard.x, room.guard.z, 'blue', -0.8);
      room.narrow = { obox: 1, x: R.x, z: R.z + 0.6, hw: 7, hd: 0.25, rot: 0 }; WORLD.extra.push(room.narrow);
      k.box(R.x - 4.0, Y0 + 0.6, R.z + 0.6, 6, 1.2, 0.5, '#5f685c').box(R.x + 4.6, Y0 + 0.6, R.z + 0.6, 4.8, 1.2, 0.5, '#5f685c');
      room.throne = { x: R.x, z: R.z - 3.4 };
      k.add(KG.cyl, room.throne.x, Y0 + 0.3, room.throne.z, 1.6, 0.6, 1.6, '#7a8a6a').add(KG.cyl, room.throne.x, Y0 + 0.62, room.throne.z, 1.4, 0.05, 1.4, '#4f9a4a', { ink: 0 })
        .box(room.throne.x, Y0 + 1.6, room.throne.z - 1.3, 2.4, 2.2, 0.3, '#6f7a5a');
      room.king = frogModel(room, room.throne.x, room.throne.z, 'green', 0); room.king.scale.multiplyScalar(1.55); room.king.position.y = Y0 + 0.62;
      const cr = crownMesh(); cr.position.set(0, 0.74, 0.12); room.king.add(cr); room.crown = cr;
      room.kingGuards = [frogModel(room, room.throne.x - 2.4, room.throne.z + 0.4, 'green', 0.3), frogModel(room, room.throne.x + 2.4, room.throne.z + 0.4, 'green', -0.3)];
      room.kingSolid = { x: room.throne.x, z: room.throne.z, r: 1.7 }; WORLD.extra.push(room.kingSolid);
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffe6a8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.orb.scale.setScalar(1.4); room.orb.position.set(room.throne.x, Y0 + 1.4, room.throne.z); room.g.add(room.orb);
    }
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.stone) setStone(r0, true);
    if (s.tunnel) openGate(r1, true);
    if (s.key) { r2.lock.visible = false; }
    if (s.guard) { r3.guardG.position.x = r3.guard.x + 2.2; r3.narrow.x = 1e5; }
    if (s.boss) { r3.king.visible = false; r3.kingGuards.forEach(g => { g.visible = false; }); r3.kingSolid.x = 1e5; }
    if (!s.keyPos) s.keyPos = ['left', 'middle', 'right'][Math.floor(Math.random() * 3)];
  }
  function setStone(room, instant) {
    const c = room.chan, x = room.R.x, z = c.z; room.chanSolids[2].x = 1e5; room.stoneSolid.x = 1e5;
    if (instant) room.stoneG.position.set(x, K.Y0 - 0.12, z);
  }
  function openGate(room, instant) { room.gateSolid.x = 1e5; if (instant) room.gateG.rotation.y = -1.3; }

  // ---------------------------------------------------------- the rooms' deeds
  async function pushStone(room) {
    const s = st(); const r = await memory('stone'); if (!r) return;
    const G = K.G, Mm = G.sim.mimo, o = room.stone, x1 = room.R.x, z1 = room.chan.z;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: o.x, z: o.z + 1.2 }, o); await K.wait(0.7); Mm.hop = { t: 0 }; Sound.play('land', 8);
      await K.tween(0.9, k => { room.stoneG.position.set(lerp(o.x, x1, k), K.Y0 - 0.12 * k + Math.sin(k * Math.PI) * 0.2, lerp(o.z, z1, k)); room.stoneG.rotation.y = k * 2; });
      setStone(room, true); Sound.play('land', 12); G.w3d.fx.puff(x1, K.Y0 + 0.2, z1, 12, 0.3, '#9fc8c0'); s.stone = true; G.save();
      G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    UI.toast('A stepping stone! Now you can cross.');
    if (await askBartolo(0, 'fear')) await K.floorDone(0);
  }
  async function tunnel(room) {
    const s = st(); const r = await memory('tunnel'); if (!r) return;
    const G = K.G, Mm = G.sim.mimo, tn = room.tunnel;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: tn.x, z: tn.z + 0.6 }, tn); await K.wait(0.8); Sound.play('climb');
      Mm.hidden = true; await K.wait(0.8);
      await K.mimoArc({ x: tn.x - 1.2, z: room.gateZ - 1.0 }, K.Y0 + 0.2, 0.5); Sound.play('click');
      await K.tween(0.7, k => { room.gateG.rotation.y = -1.3 * k; }); openGate(room, false); Sound.play('wood');
      await K.mimoLand(); s.tunnel = true; G.save();
    } finally { M.lock(false); }
    UI.toast('The gate is open!');
    if (await askBartolo(1, 'pass')) await K.floorDone(1);
  }
  // which frog has the key: graded here (the verb, and the right place); a wrong frog splashes
  function frogCheck(text, lg) {
    const F = T().FROG, s = st(), want = s.keyPos || 'middle', verb = F.verb[lg], has = (t, it) => M0has(t, it, lg);
    const okVerb = Array.isArray(verb) ? verb.every(v => has(text, v)) : has(text, verb);
    const pos = ['left', 'middle', 'right'].find(p => (F.pos[lg][p] || []).some(w => has(text, w)));
    if (okVerb && pos === want) return { ok: true, letter: 'S', kind: 'right', why: 'Just right!' };
    if (okVerb && pos && pos !== want) return { ok: false, kind: 'wrongFrog', pos, why: '' };
    if (okVerb && !pos) return { ok: false, kind: 'which', why: 'Which one? Say where it sits: left, middle or right.' };
    if ((F.pres[lg] || []).some(w => has(text, w))) return { ok: false, kind: 'pres', why: `That’s now. In the Past, {mimo} only moves in memories: «${M.plainT(M.fillMimo(F.model[want][lg] || '', lg))}».` };
    return { ok: false, kind: 'none' };
  }
  const M0has = (t, it, lg) => MOLT.has(t, it, lg);
  async function frogTask(room) {
    const s = st(), F = T().FROG, want = s.keyPos || 'middle';
    const task = { title: F.title, frame: F.frame, chips: F.chips, model: F.model[want] };
    const r = await M.ask(task, { icon: 'swim', tips: T().TIPS, check: frogCheck, onMiss: async g => {
      if (g.kind !== 'wrongFrog') return;
      const G = K.G, f = room.frogs[g.pos], p = room.pads[g.pos];
      G.w3d.fx.puff(p.x, K.Y0 + 0.2, p.z, 14, 0.35, '#cfe8f0'); Sound.play('croak');
      if (f && f.userData) f.userData.mood = 'alert';
      M.think(M.fillEn(F.wrong.en), 4.5);
    } });
    if (!r) return;
    TIME.grade('lk.mem.frog', r.letter);
    const G = K.G, p = room.pads[want], f = room.frogs[want];
    M.lock(true);
    try {
      G.sim.mimoGo({ x: p.x, z: p.z + 1.6 }, p); await K.wait(0.7); Sound.play('jump');
      await K.mimoArc({ x: p.x + 0.4, z: p.z + 0.5 }, K.Y0 + 0.1, 0.6);
      if (f && f.userData) f.userData.mood = 'happy'; Sound.play('croak'); await K.wait(0.5);
      room.keyG.visible = true; room.keyG.position.set(p.x, K.Y0 + 0.3, p.z + 0.3); G.w3d.fx.sparkle(p.x, K.Y0 + 0.6, p.z, 14, ['#fff3a0', '#ffd166']); Sound.play('learned');
      await K.mimoLand(); room.keyG.visible = false;
      await K.tween(0.6, k => { room.lock.position.y = K.Y0 + 1.6 - k * 1.5; room.lock.rotation.z = k * 1.2; }); room.lock.visible = false; Sound.play('click');
      s.key = true; G.save();
    } finally { M.lock(false); }
    UI.toast('The key! The door at the back is unlocked.');
    if (await askBartolo(2, 'key')) await K.floorDone(2);
  }
  async function guardTask(room) {
    const s = st(); const r = await memory('croak'); if (!r) return;
    const G = K.G;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 0.5, K.Y0 + 2.4, room.R.z + 5.2), K.V(room.guard.x, K.Y0 + 0.6, room.guard.z));
      G.sim.mimoSay('♪', 1.2); Sound.play('croak'); await K.wait(0.8);
      await K.tween(0.6, k => { room.guardG.position.x = room.guard.x + 2.2 * k; room.guardG.position.y = K.Y0 + Math.sin(k * Math.PI) * 0.5; });
      room.narrow.x = 1e5; s.guard = true; G.save(); Sound.play('chime');
    } finally { M.lock(false); }
    M.think('The guard hops aside, bowing. The king is on his throne… with two guards that look just like him, apart from the crown.', 6);
  }
  // the throne: the Frog King (the fight), Elio's echo, Bartolo's last question, outside at dusk
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.5, K.Y0 + 3.0, room.R.z + 3.2), K.V(room.throne.x, K.Y0 + 1.0, room.throne.z)); await K.wait(0.6); await M.you('The Frog King, puffed up on his throne… and something glows in his throat.'); } finally { M.lock(false); }
    const r = typeof LKBOSS !== 'undefined' ? await LKBOSS.fightKing() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Tell it as a memory!' : 'The Frog King settles back on his throne, croaking.', 4); return; }
    s.boss = true; room.kingSolid.x = 1e5;
    M.lock(true);
    try {
      room.kingGuards.forEach(g => { g.visible = false; }); G.w3d.fx.puff(room.throne.x, K.Y0 + 0.9, room.throne.z, 16, 0.4, '#cfe8c0');
      room.orb.position.set(room.throne.x, K.Y0 + 1.2, room.throne.z);
      await K.tween(1.4, k => { room.orb.material.opacity = k * 0.95; room.orb.position.y = K.Y0 + 1.2 + k * 1.2; room.orb.scale.setScalar(1.0 + k * 0.8); });
      Sound.play('chime'); await K.wait(0.4);
      await M.you('A boy’s voice… small, hoarse, as if from far away. Calling for someone.');
      const letter = typeof LKBOSS !== 'undefined' ? LKBOSS.letter('past') : 'B';
      await CH4.give('lake', 'past', letter);
      await K.tween(0.8, k => { room.orb.material.opacity = 0.95 * (1 - k); room.orb.position.y = K.Y0 + 2.4 + k * 2; });
      room.king.visible = false;
    } finally { M.lock(false); }
    G.save();
    if (await askBartolo(3, 'told')) await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true;
    if (typeof LK_PAST !== 'undefined' && LK_PAST) LK_PAST.freedScene();
    M.teach('echo.scene');
    await K.leave({ slow: true, then: async () => {
      if (typeof LK_PAST !== 'undefined' && LK_PAST) LK_PAST.show(true);
      const G = K.G; G.cam.override = { pos: K.V(OUT.x + 1.2, 3.2, OUT.z + 1.6), look: K.V(-160.6, 1.4, -148.6) }; G.cam.snap(OUT.yaw, 0.3, 9);
    } });
    const G = K.G;
    M.lock(true);
    try {
      await K.wait(0.6);
      const D = typeof LK_PAST !== 'undefined' && LK_PAST ? LK_PAST.who('dad') : null;
      if (D) await M.say(D, T().LINES['dad.after']);
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Elio’s call to his dad is free. Noa is waiting at the time crack in Remanso’s square.', 5.5);
    G.save();
  }

  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().MEM[kind].model || {})[lang()] || '', lang()))}»` : `Tell ${name}`);
    if (room.bart) out.push({ x: room.bart.api.x - 0.6, z: room.bart.api.z - 0.6, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { await M.say(room.bart.api, T().LINES[s.boss ? 'bartolo.after' : 'bartolo.hello']); } finally { M.lock(false); } } });
    if (i === 0) { if (!s.stone) out.push({ x: room.stone.x + 0.2, z: room.stone.z + 1.2, r: 1.6, label: sayQ('stone'), run: () => pushStone(room) }); else if (!s.done0) out.push({ x: room.bart.api.x - 0.6, z: room.bart.api.z - 0.6, r: 1.6, label: 'Answer', run: async () => { if (await askBartolo(0, 'fear')) await K.floorDone(0); } }); }
    if (i === 1) {
      out.push({ x: room.wool.x + 1.0, z: room.wool.z, r: 1.4, label: 'Look', run: async () => M.look(T().LOOKS['look.wool']) });
      if (!s.tunnel) { out.push({ x: room.tunnel.x, z: room.tunnel.z + 0.8, r: 1.5, label: sayQ('tunnel'), run: () => tunnel(room) }); out.push({ x: room.R.x - 1.5, z: room.gateZ + 0.9, r: 1.3, label: 'Look', run: async () => M.look(T().LOOKS['look.gate']) }); }
      else if (!s.done1) out.push({ x: room.bart.api.x - 0.6, z: room.bart.api.z - 0.6, r: 1.6, label: 'Answer', run: async () => { if (await askBartolo(1, 'pass')) await K.floorDone(1); } });
    }
    if (i === 2) {
      if (!s.key) out.push({ x: room.R.x, z: room.R.z + 0.6, r: 2.2, label: `Tell ${name}`, run: () => frogTask(room) });
      else if (!s.done2) out.push({ x: room.bart.api.x - 0.6, z: room.bart.api.z - 0.6, r: 1.6, label: 'Answer', run: async () => { if (await askBartolo(2, 'key')) await K.floorDone(2); } });
    }
    if (i === 3) {
      if (!s.guard) out.push({ x: room.guard.x - 0.4, z: room.guard.z + 1.3, r: 1.7, label: sayQ('croak'), run: () => guardTask(room) });
      else if (!s.boss) out.push({ x: room.throne.x, z: room.throne.z + 2.6, r: 2.4, label: 'Face the king', run: () => bossScene(room) });
      else if (!s.done3) out.push({ x: room.bart.api.x - 0.6, z: room.bart.api.z - 0.6, r: 1.6, label: 'Answer', run: async () => { if (await askBartolo(3, 'told')) await finale(); } });
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i, B = room.bart && room.bart.api;
    if (i === 0) { if (!s.stone) return { x: room.stone.x, z: room.stone.z, hint: '{mimo} sniffs a flat stone. It would fit in the water channel.' }; if (!s.done0) return { x: B.x, z: B.z, hint: '{mimo} looks at {bartolo}: he asked you something.' }; }
    if (i === 1) { if (!s.tunnel) return { x: room.tunnel.x, z: room.tunnel.z, hint: '{mimo} peers into the tiny tunnel by the gate.' }; if (!s.done1) return { x: B.x, z: B.z, hint: '{mimo} looks at {bartolo}.' }; }
    if (i === 2) { if (!s.key) return { x: room.R.x, z: room.R.z - 1.6, hint: '{mimo} watches the three frogs. One of them glints.' }; if (!s.done2) return { x: B.x, z: B.z, hint: '{mimo} looks at {bartolo}.' }; }
    if (i === 3) { if (!s.guard) return { x: room.guard.x, z: room.guard.z, hint: '{mimo} eyes the frog guard.' }; if (!s.boss) return { x: room.throne.x, z: room.throne.z, hint: '{mimo} stares at the Frog King.' }; if (!s.done3) return { x: B.x, z: B.z, hint: '{mimo} looks at {bartolo}.' }; }
    return null;
  }
  async function onFirst(room) {
    const P = room.bart, i = room.i;
    if (i === 1 && !st().ambush) {
      await K.wait(1.0);
      await M.you('Frogs in the dark! They all look alike… In here it’s a memory: say which one, and what {mimo} did.');
      const r = await TIME.fight({ foes: [{ kind: 'frog', color: 'yellow', size: 'small' }, { kind: 'frog', color: 'yellow', size: 'small' }, { kind: 'frog', color: 'yellow', size: 'small' }], place: { x: -190, z: -146, biome: 'lake' } });
      if (!r || r.outcome !== 'win') return false;
      st().ambush = true; K.G.save();
    }
    const key = ['d.r0', 'd.r1', 'd.r2', 'd.r3'][i];
    if (P && key) { await K.wait(i === 1 ? 0.6 : 1.2); M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
    if (i === 0) M.think(`A channel of black water, and a flat stone. Tell {mimo} what it did with the stone, as a memory: ${M.sx('mem')}.`, 6);
    if (i === 2) M.think('Three frogs, three pads. Watch for the glint, then tell {mimo} which one it went to.', 5.5);
    if (i === 3) {
      const R = room.R, G = K.G, gp = { id: 'guard', name: M.nameOf(T().NAMES.boss) === '' ? '…' : '🐸', x: room.guard.x, y: K.Y0, z: room.guard.z, top: 0.9, talking: false };
      M.lock(true); try { M.shot(K.V(R.x + 1.5, K.Y0 + 2.2, R.z + 5.0), K.V(room.guard.x, K.Y0 + 0.5, room.guard.z)); await K.wait(0.4); Sound.play('croak'); await M.demo(gp, T().DEMO['d.guard'], T().MARKS['d.guard']); } finally { M.lock(false); G.cam.override = null; }
      M.think('Only frogs may pass… Tell {mimo} what it said, as a memory.', 5);
    }
    return true;
  }
  let glT = 0;
  function update(room, dt, t) {
    if (room.bart) K.animate(room.bart, dt, t);
    for (const f of [...Object.values(room.frogs || {}), room.guardG, room.king, ...(room.kingGuards || [])]) if (f && f.visible && f.userData && f.userData.animate) f.userData.animate(dt, t, 0);
    if (room.i === 2 && room.glint) {
      const s = st(), p = room.pads[s.keyPos || 'middle'];
      glT += dt; const on = !s.key && (glT % 3.2) < 0.5;
      room.glint.position.set(p.x, K.Y0 + 0.55, p.z + 0.35); room.glint.material.opacity = on ? 0.9 * Math.sin(((glT % 3.2) / 0.5) * Math.PI) : 0;
    }
    if (room.i === 3 && room.king && room.king.visible) { room.king.rotation.y = Math.sin(t * 0.7) * 0.25; if (room.crown) room.crown.rotation.y = Math.sin(t * 2) * 0.1; }
  }
  // the grotto's own look: the old photograph's sepia over the picture (the Past's sky dome stays hidden in here)
  function late() {
    const cv = document.getElementById('gl');
    if (cv && !document.body.classList.contains('in-battle')) cv.style.filter = 'sepia(0.3) saturate(1.12) hue-rotate(-4deg) contrast(1.03)';
    if (typeof PAST !== 'undefined' && PAST._ && PAST._.W && PAST._.W.sky) PAST._.W.sky.visible = false;
  }
  const MOD = MOLMILL.make({
    name: 'lake-past-grotto', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: OUT, state: st,
    tint: { planks: ['#7d8478', '#757c70', '#80877a'], joint: '#3f463c', wall: '#5f6a5a', wall2: '#566250', stones: true, skirt: '#47523f', skirt2: '#3f4a38', trim: '#353d30', window: '#5f9a94', beam: '#3e4838', puff: '#9fc8c0' },
    interior: { fog: '#24362e', near: 18, far: 52 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('lk_past_grot') ? 'lk_past_grot' : null),
  });
  // (the kit names its first room's way out for the mill: here it's the grotto)
  const ints0 = MOD.interactables;
  MOD.interactables = () => ints0().map(it => (it.label === 'Leave the mill' ? Object.assign({}, it, { label: 'Leave the grotto' }) : it));
  return Object.assign(MOD, { finale, askBartolo, OUT });
})();
