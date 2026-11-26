'use strict';
// The great greenhouse, tomorrow (DESIGN.md 20 "T3a"): four glass halls at y 300, z −150, x −430 / −404 / −378 / −352, on MOLMILL's
// room kit reskinned by GDKIT (gardens_past_dungeon.js) as a clouded, cracked glasshouse: dead plants, gray thorns, hedge animals
// gone gray. Lola, grown up, follows with her lamp and shows each hall (a demonstration); everything here moves only when it's asked
// nicely, and {mimo}'s moves are plans (MOLT.planTask, tomorrow's tense).
//   0 the Broken Panes: the gray hedge rabbit blocks the gap: «¿Podrías dejarnos pasar, por favor?»; a big flowerpot in front of
//     the next door: «{mimo} empujará la maceta»
//   1 the Dry Fountain: an ambush of gray Hushlings (the Future's tense), then a wish: «Me encantaría oír la fuente otra vez»
//   2 the Thorn Corridor: the proud hedge bear (formal: «Señor oso, ¿podría apartarse, por favor?»); the latch up the thorny wall:
//     «{mimo} trepará por la enredadera»
//   3 the Gray Dome: the Thorn Warden (gardens_time_boss.js), Elio's echo; outside, the gardens' color comes back
const GD_FHOUSE = (() => {
  if (typeof MOLMILL === 'undefined' || typeof GARDT === 'undefined' || !GARDT || typeof GDKIT === 'undefined' || !GDKIT) return null;
  const M = GARDT, T = () => GFTXT, X = [-430, -404, -378, -352], Z = -150, KIT = GDKIT;
  const st = () => { const s = M.st('future'); return s.house || (s.house = {}); };
  const fS = () => M.st('future');
  const lang = () => M.lang();
  const lolaLook = { skin: '#f0c7a0', hair: '#8a4a2a', hairdo: 'braids', dress: '#ff8fb1', vest: '#4a4566', prop: 'lantern', h: 0.98 };
  const nm = id => M.nameOf(T().CAST[id]);
  let K = null;
  const OUT = { x: M.DOOR.x, z: M.DOOR.z - 1.9, yaw: Math.PI };

  // a plan for {mimo} (tomorrow's tense)
  async function plan(kind) {
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const task = M.planTask(T().PLAN[kind]); if (!task) return null;
    const r = await M.ask(task, { icon: kind === 'vine' ? 'climb' : 'push' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('gd.plan.' + kind, r.letter); }
    return r;
  }
  async function politely(taskKey) {
    const r = await M.ask(T().TASKS[taskKey], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('Nothing moves. Ask nicely.', 4); return null; }
    TIME.grade('gd.fhouse.' + taskKey, r.letter); return r;
  }
  const floorsUp = i => { const p = fS(); p.floors = Math.max(p.floors || 0, Math.min(3, i + 1)); };
  function greenUp(A0) { if (A0) A0.k = 1; }

  // ---------------------------------------------------------- the rooms
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, i = room.i;
    KIT.glassShell(room, api, 'future', k);
    room.gm = KIT.grayMat(1);
    const pk = PAST.API.Kit(); KIT.planters(room, api, 'future', pk);
    room.door = KIT.backDoor(room, api, 'future'); KIT.hideLadder(room);
    room.lola = api.person(room, lolaLook, i === 3 ? { x: R.x - 3.6, z: R.z + 3.4, yaw: 2.6 } : { x: R.x + 3.6, z: R.z + 3.4, yaw: -2.4 }, nm('lola'));
    // gray thorns creeping over the glass, cracks in the panes
    for (let j = 0; j < 10; j++) { const x = R.x - 6 + j * 1.3, y0 = Y0 + 0.5 + (j % 3) * 0.7; k.rod([x, y0, R.z - KIT.HD + 0.2], [x + 0.6, y0 + 1.2, R.z - KIT.HD + 0.2], 0.04, '#5a5666', 0.004).add(KG.cone, x + 0.3, y0 + 0.6, R.z - KIT.HD + 0.26, 0.04, 0.16, 0.04, '#4a4656', { rx: Math.PI / 2, ink: 0 }); }
    for (let j = 0; j < 4; j++) k.add(KG.cone4, R.x - 5 + j * 3.2, Y0 + 2.6 + (j % 2), R.z - KIT.HD + 0.1, 0.3, 0.7, 0.01, '#2a2830', { rz: 0.4 + j, ink: 0 });
    if (i === 0) {
      room.wall = KIT.hedgeWall(room, api, -1.2, R.x, 1.8, k, 'future');
      room.rabbit = KIT.hedgeAnimal(room, api, { x: R.x, z: R.z - 1.2, yaw: 0 }, 'rabbit');
      room.pot = { x: room.way ? room.way.x + 0.2 : R.x - 4.4, z: R.z - KIT.HD + 1.2 };
      room.potG = new THREE.Group(); const kp = PAST.API.Kit(); kp.add(KG.cyl, 0, 0.55, 0, 0.75, 1.1, 0.75, '#8a6a5a', { ink: 0.012 }).add(KG.cyl, 0, 1.12, 0, 0.8, 0.1, 0.8, '#7a5a4a', { ink: 0.008 }).rod([0, 1.1, 0], [0.2, 1.8, 0.1], 0.03, '#7a7060', 0);
      kp.build(room.potG); room.potG.position.set(room.pot.x, Y0, room.pot.z); room.g.add(room.potG);
      room.potSolid = { x: room.pot.x, z: room.pot.z, r: 0.8 }; WORLD.extra.push(room.potSolid);
    }
    if (i === 1) {
      room.fount = KIT.fountain(room, api, { x: R.x + 0.6, z: R.z - 1.0 }, 'future');
    }
    if (i === 2) {
      room.wall = KIT.hedgeWall(room, api, -0.6, R.x + 2.2, 2.4, k, 'future');
      room.bear = KIT.hedgeAnimal(room, api, { x: R.x + 2.2, z: R.z - 0.6, yaw: 0 }, 'bear');
      room.vine = { x: room.way ? room.way.x + 1.6 : R.x - 3, z: R.z - KIT.HD + 0.4 };
      for (let j = 0; j < 9; j++) pk.add(KG.sphere, room.vine.x + Math.sin(j * 1.3) * 0.25, Y0 + 0.4 + j * 0.42, room.vine.z, 0.2, 0.16, 0.08, ['#6d7a5e', '#7d8a6a'][j % 2], { rz: j, ink: 0.004 });
      pk.rod([room.vine.x, Y0, room.vine.z + 0.05], [room.vine.x + 0.2, Y0 + 4.0, room.vine.z + 0.05], 0.04, '#5a5a4a', 0.004);
    }
    if (i === 3) {
      // the dome: thorny gray growth round the middle bed, where the Warden waits
      room.bed = { x: R.x, z: R.z - 1.6 };
      k.add(KG.cyl, room.bed.x, Y0 + 0.3, room.bed.z, 2.2, 0.6, 2.2, '#8f8a86', { ink: 0.012 }).add(KG.cyl, room.bed.x, Y0 + 0.62, room.bed.z, 2.0, 0.04, 2.0, '#3e3834', { ink: 0 });
      room.thorns = new THREE.Group(); room.g.add(room.thorns);
      const kt = PAST.API.Kit(), rn = (() => { let q = 41; return () => ((q = (q * 16807) % 2147483647) / 2147483647); })();
      for (let j = 0; j < 26; j++) { const a = rn() * TAU, r0 = 0.6 + rn() * 1.4, x = room.bed.x + Math.cos(a) * r0, z = room.bed.z + Math.sin(a) * r0; kt.rod([x, Y0 + 0.6, z], [x + Math.cos(a) * 0.6, Y0 + 1.6 + rn() * 1.8, z + Math.sin(a) * 0.6], 0.06, '#5a5666', 0.006).add(KG.cone, x + Math.cos(a) * 0.4, Y0 + 1.3 + rn(), z + Math.sin(a) * 0.4, 0.05, 0.2, 0.05, '#4a4656', { rz: a, ink: 0 }); }
      kt.build(room.thorns);
      room.bloomSolid = { x: room.bed.x, z: room.bed.z, r: 2.3 }; WORLD.extra.push(room.bloomSolid);
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#cfe6ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.orb.scale.setScalar(1.4); room.orb.position.set(room.bed.x, Y0 + 2.4, room.bed.z); room.g.add(room.orb);
    }
    pk.build(room.g, { mat: room.gm.m });
    k.build(room.g);
  }
  function moveAside(A0, room, dx, instant) {
    if (!A0) return;
    A0.solid.x = 1e5; if (room.wall) { /* (the gap is free once the animal steps out of it) */ }
    if (instant) A0.g.position.x += dx; else A0.slide = { from: A0.g.position.x, to: A0.g.position.x + dx, t: 0 };
    A0.k = 0; A0.gm.u.uGray.value = 0;
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.rabbit) moveAside(r0.rabbit, r0, 2.2, true);
    if (s.pot) { r0.potG.position.x += 1.8; r0.potSolid.x = 1e5; }
    if (s.fountain) { r1.fount.on = true; r1.fount.water.visible = true; r1.gm.u.uGray.value = 0; }
    if (s.bear) moveAside(r2.bear, r2, -2.6, true);
    if (s.boss) { r3.thorns.visible = false; r3.gm.u.uGray.value = 0; }
    if (s.done0) r0.gm.u.uGray.value = 0;
    if (s.done2) r2.gm.u.uGray.value = 0;
    api.rooms.forEach(KIT.hideLadder);
  }

  // ---------------------------------------------------------- the rooms' deeds
  async function demoLola(room, key) { const P = room.lola; if (!P) return; M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
  async function rabbitTask(room) {
    const s = st(); const r = await politely('rabbit'); if (!r) return;
    const G = K.G, A0 = room.rabbit;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 2.6, K.Y0 + 2.6, room.R.z + 3.6), K.V(A0.g.position.x, K.Y0 + 1.0, A0.g.position.z)); await K.wait(0.4);
      A0.k = 0; Sound.play('chime'); G.w3d.fx.sparkle(A0.g.position.x, K.Y0 + 1.4, A0.g.position.z, 16, ['#9ff5b8', '#5fae4f']); await K.wait(0.6);
      moveAside(A0, room, 2.2, false); Sound.play('jump'); s.rabbit = true; G.save(); await K.wait(0.9);
    } finally { M.lock(false); }
    M.think(`The rabbit hops aside, ears up. A big flowerpot blocks the door at the back. Tell {mimo} its plan: ${M.sx('plan')}.`, 6);
  }
  async function potTask(room) {
    const s = st(); const r = await plan('pot'); if (!r) return;
    const G = K.G, p = room.pot;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: p.x - 1.2, z: p.z + 0.6 }, p); await K.wait(0.8); Sound.play('push');
      await K.tween(0.8, kk => { room.potG.position.x = p.x + 1.8 * kk; }); room.potSolid.x = 1e5; Sound.play('land', 8);
      s.pot = true; room.gm.u.uGray.value = 0.5; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    floorsUp(0); await K.floorDone(0);
    M.think('The door at the back opens. Lola lifts her lamp: the next hall.', 4);
  }
  async function fountainTask(room) {
    const s = st(); const r = await politely('fountain'); if (!r) return;
    const G = K.G, f = room.fount;
    M.lock(true);
    try {
      M.shot(K.V(f.g.position.x + 3.2, K.Y0 + 3.0, f.g.position.z + 4.4), K.V(f.g.position.x, K.Y0 + 0.8, f.g.position.z)); await K.wait(0.4);
      f.on = true; f.water.visible = true; Sound.play('splash'); G.w3d.fx.sparkle(f.g.position.x, K.Y0 + 1.2, f.g.position.z, 20, ['#bff0ff', '#ffffff']);
      room.colorT = 1; s.fountain = true; G.save(); await K.wait(1.2);
    } finally { M.lock(false); }
    floorsUp(1); await K.floorDone(1);
    UI.toast('A wish, said out loud… and the fountain sings again!');
  }
  async function bearTask(room) {
    const s = st(); const r = await politely('bear'); if (!r) return;
    const G = K.G, A0 = room.bear;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x - 1.6, K.Y0 + 3.0, room.R.z + 4.2), K.V(A0.g.position.x, K.Y0 + 1.6, A0.g.position.z)); await K.wait(0.4);
      A0.k = 0; Sound.play('chime'); G.w3d.fx.sparkle(A0.g.position.x, K.Y0 + 2.0, A0.g.position.z, 18, ['#9ff5b8', '#5fae4f']); await K.wait(0.6);
      moveAside(A0, room, -2.6, false); Sound.play('land', 10); s.bear = true; G.save(); await K.wait(0.9);
    } finally { M.lock(false); }
    M.think(`The bear bows and steps aside. The latch is high up the thorny wall. Tell {mimo} its plan.`, 5.5);
  }
  async function vineTask(room) {
    const s = st(); const r = await plan('vine'); if (!r) return;
    const G = K.G, v = room.vine;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: v.x, z: v.z + 0.9 }, v); await K.wait(0.8); Sound.play('climb');
      await K.mimoArc({ x: v.x, z: v.z + 0.3 }, K.Y0 + 3.4, 0.9); Sound.play('click'); await K.wait(0.3);
      await K.mimoLand(); s.vine = true; room.colorT = 1; G.save();
    } finally { M.lock(false); }
    floorsUp(2); await K.floorDone(2);
  }
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.5, K.Y0 + 3.0, room.R.z + 3.6), K.V(room.bed.x, K.Y0 + 1.6, room.bed.z)); await K.wait(0.6); await M.you('The thorns in the middle stir… and stand up. Something made of thorns, with eyes.'); } finally { M.lock(false); }
    const r = typeof GDBOSS !== 'undefined' ? await GDBOSS.fightWarden() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then ask again. Politely!' : 'The thorns settle back, rustling.', 4); return; }
    s.boss = true;
    M.lock(true);
    try {
      room.thorns.visible = false; room.colorT = 1; G.w3d.fx.puff(room.bed.x, K.Y0 + 1.4, room.bed.z, 22, 0.5, '#b8b6c4'); Sound.play('chime');
      await K.wait(1.0);
      await K.tween(1.4, kk => { room.orb.material.opacity = kk * 0.95; room.orb.position.y = K.Y0 + 2.4 + kk * 1.2; room.orb.scale.setScalar(1.0 + kk * 0.8); });
      await M.you('A man’s voice… gentle, a little shy, as if asking for something he wanted for a long time.');
      const letter = typeof GDBOSS !== 'undefined' ? GDBOSS.letter('future') : 'B';
      await CH4.give('gardens', 'future', letter);
      await K.tween(0.8, kk => { room.orb.material.opacity = 0.95 * (1 - kk); room.orb.position.y = K.Y0 + 3.6 + kk * 2; });
      const P = room.lola; if (P) { M.frame2(P.api); await M.say(P.api, T().LINES['lola.end']); }
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true;
    if (typeof GD_FUT !== 'undefined' && GD_FUT) GD_FUT.freed(); else TIME.flag('future', 'gdFree', true);
    await K.leave({ slow: true, then: async () => { const G = K.G; G.cam.override = { pos: K.V(OUT.x + 4.4, 4.2, OUT.z - 9.0), look: K.V(198, 1.2, -72) }; G.cam.snap(OUT.yaw, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      await K.wait(0.8);
      for (let j = 0; j < 10; j++) { G.w3d.fx.sparkle(186 + Math.random() * 26, 1.0 + Math.random() * 2, -82 + Math.random() * 22, 6, ['#ffd166', '#9ff5b8', '#ff9fc4']); await K.wait(0.12); }
      const F = typeof GD_FUT !== 'undefined' && GD_FUT ? GD_FUT.who('flora') : null;
      if (F) { M.frame2(F); await M.say(F, T().LINES['flora.free']); fS().chatF = true; }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('The gardens are in color again. Noa is waiting at the time crack on the green.', 5.5);
    G.save();
  }

  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().PLAN[kind].model || {})[lang()] || '', lang()))}»` : `Tell ${name}`);
    if (room.lola) out.push({ x: room.lola.api.x - 0.6, z: room.lola.api.z - 0.6, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { await M.say(room.lola.api, T().LINES[s.boss ? 'lola.end' : 'lola.in']); } finally { M.lock(false); } } });
    const look = (x, z, id, line) => out.push({ x, z, r: 1.2, label: 'Look', run: async () => M.lookAt(id, line, 5) });
    if (i === 0) {
      look(room.R.x - 5.2, room.R.z + 1.8, 'w.gd_broken', 'The panes are {w.gd_broken}, and the {w.gd_fog} drifts in through the cracks.');
      if (!s.rabbit) out.push({ x: room.R.x, z: room.R.z + 0.6, r: 1.8, label: 'Ask', run: () => rabbitTask(room) });
      else { look(room.rabbit.g.position.x + 0.2, room.R.z + 0.4, 'w.gd_rabbit', 'The hedge {w.gd_rabbit}, green again, its {w.gd_ears} up.'); if (!s.pot) out.push({ x: room.pot.x + 0.6, z: room.pot.z + 1.6, r: 1.6, label: sayQ('pot'), run: () => potTask(room) }); }
    }
    if (i === 1) {
      look(room.R.x + 5.0, room.R.z - 3.0, 'w.gd_dry', 'The planters are {w.gd_dry} as dust.');
      if (!s.fountain) out.push({ x: room.fount.g.position.x, z: room.fount.g.position.z + 2.4, r: 1.8, label: 'Wish', run: () => fountainTask(room) });
    }
    if (i === 2) {
      if (!s.bear) out.push({ x: room.bear.g.position.x - 0.4, z: room.R.z + 0.9, r: 1.8, label: 'Ask', run: () => bearTask(room) });
      else { look(room.bear.g.position.x, room.R.z + 0.7, 'w.gd_bear', 'The hedge {w.gd_bear}, green and proud, bowing a little.'); if (!s.vine) out.push({ x: room.vine.x, z: room.vine.z + 1.4, r: 1.6, label: sayQ('vine'), run: () => vineTask(room) }); }
    }
    if (i === 3) {
      if (!s.boss) out.push({ x: room.bed.x, z: room.bed.z + 3.0, r: 2.2, label: 'Face the thorns', run: () => bossScene(room) });
      else if (!s.done3) out.push({ x: room.bed.x, z: room.bed.z + 3.0, r: 2.2, label: 'Go out', run: finale });
      look(room.R.x + 4.6, room.R.z + 2.6, 'w.gd_thorn', s.boss ? 'Only a few dry {w.gd_thorn:pl} left, curled up like old ribbons.' : 'Gray {w.gd_thorn:pl}, thick as rope, all round the middle.');
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!s.rabbit) return { x: room.rabbit.g.position.x, z: room.rabbit.g.position.z, hint: '{mimo} looks at the gray hedge rabbit in the gap.' }; if (!s.pot) return { x: room.pot.x, z: room.pot.z, hint: '{mimo} looks at the big flowerpot by the door.' }; }
    if (i === 1 && !s.fountain) return { x: room.fount.g.position.x, z: room.fount.g.position.z, hint: '{mimo} looks at the dry fountain.' };
    if (i === 2) { if (!s.bear) return { x: room.bear.g.position.x, z: room.bear.g.position.z, hint: '{mimo} looks up at the gray hedge bear.' }; if (!s.vine) return { x: room.vine.x, z: room.vine.z, hint: '{mimo} looks up the thorny vine at the latch.' }; }
    if (i === 3 && !s.boss) return { x: room.bed.x, z: room.bed.z, hint: '{mimo} stares at the thorns in the middle.' };
    return null;
  }
  async function onFirst(room) {
    const P = room.lola, i = room.i, s = st();
    if (i === 0) { await K.wait(0.8); if (P) { M.lock(true); try { M.frame2(P.api); await M.say(P.api, T().LINES['lola.in']); } finally { M.lock(false); } } }
    if (i === 1 && !s.ambush) {
      await K.wait(1.0);
      await M.you('Gray Hushlings tangled in the thorns! Tomorrow, {mimo} follows plans: tell it what it will do.');
      const r = await TIME.fight({ foes: [{ kind: 'hushling', color: 'green', size: 'small' }, { kind: 'hushling', color: 'red', size: 'small' }, { kind: 'hushling', color: 'blue', size: 'small' }], place: { x: 198, z: -72 } });
      if (!r || r.outcome !== 'win') return false;
      s.ambush = true; K.G.save();
    }
    const key = ['d.r0', 'd.r1', 'd.r2', 'd.r3'][i];
    if (P && key) { await K.wait(0.6); await demoLola(room, key); }
    if (i === 0) M.think('Ask the rabbit, nicely, to let you pass.', 4.5);
    if (i === 1) M.think('The fountain is dry. Say your wish out loud.', 4.5);
    if (i === 2) M.think('The proud old bear. Ask it very politely: «usted», «Sie», «o senhor».', 5);
    if (i === 3) M.think('Something waits in the thorns. Face it, and stay polite.', 4.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.lola) K.animate(room.lola, dt, t);
    KIT.hideLadder(room);
    if (room.door) { const want = st()['done' + room.i] ? -1.7 : 0; room.door.rotation.y += (want - room.door.rotation.y) * Math.min(1, dt * 3); }
    if (room.colorT != null && room.gm) { room.colorT = Math.max(0, room.colorT - dt * 0.6); room.gm.u.uGray.value = Math.min(room.gm.u.uGray.value, room.colorT); if (room.colorT <= 0) room.colorT = null; }
    for (const A0 of [room.rabbit, room.bear]) {
      if (!A0) continue;
      A0.gm.u.uGray.value += ((A0.k ? 1 : 0) - A0.gm.u.uGray.value) * Math.min(1, dt * 2);
      if (A0.slide) { A0.slide.t = Math.min(1, A0.slide.t + dt * 1.4); A0.g.position.x = lerp(A0.slide.from, A0.slide.to, A0.slide.t); A0.body.position.y = Math.sin(A0.slide.t * Math.PI * 3) * 0.25; if (A0.slide.t >= 1) { A0.slide = null; A0.body.position.y = 0; } }
      else A0.body.rotation.z = A0.k ? 0 : Math.sin(t * 1.6 + A0.ph) * 0.03;
      if (A0.ears) A0.ears.forEach((e, j) => { e.rotation.z = (j ? 1 : -1) * (A0.k ? 0.6 : 0.1 + Math.sin(t * 3) * 0.05); });
    }
    if (room.fount && room.fount.on) { room.fount.spray.material.opacity = 0.42 + 0.12 * Math.sin(t * 6); }
    if (room.thorns && room.thorns.visible) room.thorns.rotation.y = Math.sin(t * 0.4) * 0.05;
    // Lola's lamp: a warm glow round her in the dark halls
    if (room.lola && !room.glow) { room.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd9a0', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })); room.glow.scale.setScalar(2.6); room.g.add(room.glow); }
    if (room.glow) { room.glow.position.set(room.lola.api.x + 0.3, K.Y0 + 0.8, room.lola.api.z + 0.2); room.glow.material.opacity = 0.42 + 0.08 * Math.sin(t * 7); }
  }
  // the greenhouse tomorrow: the Future's drained screen, a little color back as each hall is helped
  function late(dt) {
    const s = st(), n = ['done0', 'done1', 'done2', 'done3'].filter(k0 => s[k0]).length;
    if (TIME.look) TIME.look.apply('future', dt, Math.min(1, 0.2 + n * 0.16));
  }
  const MOD = MOLMILL.make({
    name: 'gardens-future-house', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: OUT, state: st,
    tint: { planks: ['#7a6a62', '#6f625c', '#837268'], joint: '#4a4044', wall: '#8f9a9e', wall2: '#86919a', skirt: '#8a8680', skirt2: '#7a7670', trim: '#a8a6ae', window: '#8f9a9e', beam: '#a8a6ae', puff: '#b8b6c4', dust: true },
    interior: { fog: GDKIT.PAL.future.fog, near: 14, far: 48 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('gd_future_house') ? 'gd_future_house' : null),
  });
  const ints0 = MOD.interactables;
  MOD.interactables = () => ints0().map(it => (it.label === 'Leave the mill' ? Object.assign({}, it, { label: 'Leave the greenhouse' }) : it.label === 'Climb' ? Object.assign({}, it, { label: 'Next hall' }) : it.label === 'Go down' ? Object.assign({}, it, { label: 'Back' }) : it));
  return Object.assign(MOD, { finale, OUT });
})();
