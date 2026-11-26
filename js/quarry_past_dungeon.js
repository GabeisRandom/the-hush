'use strict';
// The Quarry Caves' two time dungeons share one kit (QRKIT.make): four rock rooms floating at y 300 (mine.js's way: a floor,
// rock walls facing inward so the camera looks in like a dollhouse, timber frames), visited one at a time, going DOWN: each
// room's shaft is boarded over until the room is done, then the boards fly off and a ladder shows ("Climb down"); the front
// of the first room leads back out to the mine's mouth, the others back up. Dark rooms are dark (a near, black fog) until lit.
// Progress in TIME.state('quarry', world).deep. Each world brings its own props, puzzles and people (cfg.build / interactables /
// target / update / onFirst).
//   QPDEEP (this file): the old deep gallery, long ago, before the cave-in (rooms at y 300, z −240, x −430 / −404 / −378 / −352)
//     0 the Lamp Gallery: tell the gallery what the lamplighter did every morning (the imperfect: the lamps light), then tell
//       {mimo} what it did with the cart, as a memory (it rolls and breaks the boards over the shaft)
//     1 the Singing Hall: echo bats (a fight in the Past's tense); tell the gallery what the echo always did (it answers again)
//     2 the Crystal Seam: {mimo} sang to the crystals (a memory: they light); the miners crossed the rope bridge every day
//       (it comes back, plank by plank)
//     3 the Deep Face: Grandma Echo (quarry_time_boss.js); Elio's echo; the gallery sings again
//   QFDEEP (quarry_future_dungeon.js): the collapsed deep mine, tomorrow.
const QRKIT = (() => {
  const Y0 = 300, HW = 7, HD = 6, WH = 5.2;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  let ARROW = null;
  function arrowTex() {
    if (ARROW) return ARROW;
    ARROW = TK.canvasTex(128, 160, c => {
      c.lineJoin = 'round';
      const path = () => { c.beginPath(); c.moveTo(64, 116); c.lineTo(118, 56); c.lineTo(86, 56); c.lineTo(86, 14); c.lineTo(42, 14); c.lineTo(42, 56); c.lineTo(10, 56); c.closePath(); };
      path(); c.lineWidth = 14; c.strokeStyle = '#2b2235'; c.stroke(); c.fillStyle = '#9ff5e8'; c.fill();
      c.font = '900 30px "Trebuchet MS", sans-serif'; c.textAlign = 'center'; c.lineWidth = 8; c.strokeText('Down', 64, 150); c.fillStyle = '#fffaf0'; c.fillText('Down', 64, 150);
    });
    return ARROW;
  }
  function make(cfg) {
    let G = null, inside = false, cur = -1, built = false;
    const rooms = cfg.ROOMS.map((R, i) => ({ i, R: { x: R.x, z: R.z }, name: R.name, sub: R.sub, g: null, way: null, up: null }));
    const S = () => cfg.state();
    const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
    const fastOn = () => !!(TIME._ && TIME._.fast && TIME._.fast.on);
    const UIfade = (to, ms) => { if (fastOn()) { const el = document.getElementById('fade'); if (el) { el.style.transition = 'none'; el.style.opacity = to; } return Promise.resolve(); } return UI.fade(to, ms); };
    const UIchapter = (a, b) => (fastOn() ? (UI.toast(a + ' · ' + b), Promise.resolve()) : UI.chapter(a, b));
    const chime = () => { if (!(typeof BFX !== 'undefined' && BFX.solved && BFX.solved())) Sound.play('chest'); };
    // ---------------------------------------------------------- the rooms' shell: rock in bands, timber frames, rubble, stalactites
    let MAT = null;
    function mats() {
      if (MAT) return MAT;
      const T0 = cfg.tint || {}, tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
      const rock = tex(256, 256, c => {
        const R = rng(T0.seed || 9), B = T0.rock || ['#5f564d', '#6a6157', '#554d45', '#71675c'];
        B.forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * 64, 256, 64); });
        for (let k = 0; k < 90; k++) { c.fillStyle = `rgba(${R() < 0.5 ? '255,240,220' : '20,14,10'},${0.05 + R() * 0.08})`; const w = 12 + R() * 40; c.fillRect(R() * 256, R() * 256, w, 3 + R() * 6); }
        c.strokeStyle = 'rgba(20,14,10,0.35)'; c.lineWidth = 2; for (let k = 0; k < 14; k++) { c.beginPath(); const x = R() * 256, y = R() * 256; c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 40, y + 10 + R() * 30); c.stroke(); }
        if (T0.dust) { c.fillStyle = 'rgba(190,188,200,0.3)'; for (let k = 0; k < 30; k++) c.fillRect((k * 89) % 256, (k * 47) % 256, 30, 8); }
      }, 3, 1.2);
      const floor = tex(256, 256, c => {
        const R = rng(3); c.fillStyle = T0.floor || '#4f463d'; c.fillRect(0, 0, 256, 256);
        for (let k = 0; k < 160; k++) { c.fillStyle = R() < 0.5 ? (T0.floorA || '#5b5147') : (T0.floorB || '#463e36'); const s = 4 + R() * 14; c.beginPath(); c.ellipse(R() * 256, R() * 256, s, s * 0.7, R() * 3, 0, TAU); c.fill(); }
      }, 3, 3);
      MAT = { rock: new THREE.MeshToonMaterial({ map: rock, gradientMap: TK.grad }), floor: new THREE.MeshToonMaterial({ map: floor, gradientMap: TK.grad }), hole: new THREE.MeshBasicMaterial({ color: '#0b0910' }) };
      return MAT;
    }
    function shell(room) {
      const M = mats(), R = room.R, g = room.g, T0 = cfg.tint || {};
      const floor = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, 0.4, HD * 2), M.floor); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
      [[0, -HD, 0, HW * 2], [0, HD, Math.PI, HW * 2], [-HW, 0, Math.PI / 2, HD * 2], [HW, 0, -Math.PI / 2, HD * 2]].forEach(([dx, dz, ry, w]) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), M.rock); m.position.set(R.x + dx, Y0 + WH / 2, R.z + dz); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
      });
      const k = PAST.API.Kit(), KG = PAST.API.KG, wood = T0.beam || '#6b4a30', wood2 = T0.beam2 || '#5a3a24';
      for (const x of [-4.6, 0, 4.6]) { for (const s of [-1, 1]) k.add(KG.cyl6, R.x + x + s * 1.3, Y0 + 2.2, R.z - HD + 0.35, 0.16, 4.4, 0.16, wood, { ink: 0.02 }); k.box(R.x + x, Y0 + 4.35, R.z - HD + 0.35, 3.0, 0.3, 0.32, wood, { ink: 0.02 }); }
      for (const s of [-1, 1]) for (const z of [-2.5, 2.5]) k.add(KG.cyl6, R.x + s * (HW - 0.35), Y0 + 2.2, R.z + z, 0.16, 4.4, 0.16, wood, { ink: 0.02 });
      for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.35), Y0 + 4.35, R.z, 0.32, 0.3, HD * 2 - 0.6, wood2, { ink: 0.02 });
      const RR = rng(Math.round(R.x * 3 + R.z * 7 + 99)), rk = T0.rubble || ['#6a6157', '#5f564d', '#71675c'];
      for (let i = 0; i < 10; i++) { const x = R.x + (RR() < 0.5 ? -1 : 1) * (HW - 0.8 - RR() * 1.2), z = R.z + (RR() < 0.5 ? -1 : 1) * (HD - 0.8 - RR() * 1.0), s = 0.25 + RR() * 0.4; k.add(KG.ball6, x, Y0 + s * 0.3, z, s * 1.2, s * 0.8, s, rk[i % 3], { ry: RR() * 6, ink: 0.015 }); }
      for (let i = 0; i < 9; i++) k.add(KG.cone, R.x - HW + 1 + i * 1.5 + RR() * 0.5, Y0 + WH - 0.5, R.z - HD + 0.5 + RR() * 0.6, 0.18, -0.9 - RR() * 0.8, 0.18, rk[1], { ink: 0.012 });
      k.build(g, { shadow: false });
      const door = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), M.hole); door.rotation.x = -Math.PI / 2; door.position.set(R.x, Y0 + 0.012, R.z + HD - 0.6); g.add(door);
      WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - HD - 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: R.x, z: R.z + HD + 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 },
        { obox: 1, x: R.x - HW - 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }, { obox: 1, x: R.x + HW + 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }]);
      WORLD.addPlatforms([{ box: [R.x - HW, R.x + HW, R.z - HD, R.z + HD], top: Y0 }]);
    }
    // ---------------------------------------------------------- the way down: a shaft in the floor, boarded over until the room's done
    function wayDown(room, x, z) {
      const g = room.g;
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.95, 20), mats().hole); hole.rotation.x = -Math.PI / 2; hole.position.set(x, Y0 + 0.015, z); g.add(hole);
      const kr = PAST.API.Kit(), KG = PAST.API.KG;
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; kr.add(KG.ball6, x + Math.cos(a) * 1.05, Y0 + 0.08, z + Math.sin(a) * 1.05, 0.22, 0.14, 0.2, '#5f564d', { ink: 0.01 }); }
      for (const s of [-0.35, 0.35]) kr.box(x + s, Y0 + 0.5, z - 0.45, 0.08, 1.2, 0.08, '#a8743f', { ink: 0.01 });
      for (let j = 0; j < 2; j++) kr.box(x, Y0 + 0.4 + j * 0.45, z - 0.45, 0.72, 0.07, 0.08, '#c79d6d', { ink: 0.006 });
      kr.build(g, { shadow: false });
      const boards = new THREE.Group(); boards.position.set(x, Y0, z); g.add(boards);
      const kb = PAST.API.Kit(); for (let i = 0; i < 4; i++) kb.box(0, 0.06 + i * 0.012, -0.75 + i * 0.5, 2.4, 0.08, 0.42, i % 2 ? '#9a6440' : '#8a5636', { ry: (i % 2 ? 0.08 : -0.06), ink: 0.012 }); kb.build(boards, { shadow: false });
      const arrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex(), transparent: true, depthWrite: false, depthTest: false }));
      arrow.scale.set(0.95, 1.2, 1); arrow.position.set(x, Y0 + 2.1, z + 0.2); arrow.visible = false; arrow.renderOrder = 5; g.add(arrow);
      room.way = { boards, hole, arrow, x, z, open: false };
      room.up = { x: x + 1.4, z: z + 1.0 };
    }
    async function openWay(room, instant) {
      const w = room && room.way; if (!w || w.open) return; w.open = true;
      if (instant) { w.boards.visible = false; w.arrow.visible = true; return; }
      chime(); Sound.play('wood');
      await tween(0.6, k => { w.boards.children.forEach((m, i) => { m.position.y = k * 1.2 + i * 0.05; m.rotation.z = k * (i % 2 ? 1.2 : -1.2); }); w.boards.position.x = w.x + k * 1.6; });
      w.boards.visible = false; Sound.play('land', 11); G.w3d.fx.puff(w.x, Y0 + 0.1, w.z, 12, 0.32, (cfg.tint || {}).puff || '#cfc4b0');
      w.arrow.visible = true;
    }
    // ---------------------------------------------------------- moving between rooms, in and out
    function teleport(x, z, yaw) { const Y = G.sim.you, Mm = G.sim.mimo; Y.x = x; Y.z = z; Y.yaw = yaw; Mm.x = x + 1.1; Mm.z = z + 0.8; Mm.hidden = false; Mm.wander = null; Mm.station = null; G.sim.snap(); }
    function show(i) { rooms.forEach((r, k) => { if (r.g) r.g.visible = k === i; }); cur = i; quick = {}; dark(); }
    function hideAll() { rooms.forEach(r => { if (r.g) r.g.visible = false; }); cur = -1; quick = {}; }
    // a room's light: dark rooms get a near black fog (you see Mimo and the lit things), lit ones the cfg's interior
    function dark() { if (!inside || cur < 0) return; const lit = !cfg.isDark || !cfg.isDark(rooms[cur], api); G.w3d.setInterior(lit ? (cfg.interior || { fog: '#2a1f1a', near: 18, far: 52 }) : (cfg.dark || { fog: '#08070b', near: 7, far: 19 })); }
    function build() {
      if (built) return; built = true;
      rooms.forEach(room => {
        room.g = new THREE.Group(); room.g.name = cfg.name + '-room' + room.i; room.g.visible = false; G.w3d.scene.add(room.g); shell(room);
        // (the shaft down: the back left corner, unless the world puts it elsewhere: cfg.wayAt(room) → { x, z } relative to the room)
        if (room.i < rooms.length - 1) { const w = (cfg.wayAt && cfg.wayAt(room)) || { x: -4.6, z: -3.6 }; wayDown(room, room.R.x + w.x, room.R.z + w.z); }
        try { cfg.build(room, api); } catch (e) { console.error('[' + cfg.name + '] build', e); }
      });
      applyState();
    }
    function applyState() { const st = S(); rooms.forEach(room => { if (st['done' + room.i]) openWay(room, true); }); if (cfg.applyState) { try { cfg.applyState(api); } catch (e) { console.error('[' + cfg.name + '] state', e); } } }
    async function enter() {
      build();
      await UIfade(1, 450);
      inside = true; G.w3d.setInterior(cfg.interior || { fog: '#2a1f1a', near: 18, far: 52 });
      show(0); const R = rooms[0].R; teleport(R.x, R.z + 4.4, Math.PI); G.cam.snap(Math.PI, 0.62, 10.5);
      await UIfade(0, 450);
      await first(0);
      G.save();
    }
    async function leave(o = {}) {
      await UIfade(1, 450);
      hideAll(); inside = false; G.w3d.setInterior(null);
      const O = cfg.OUTSIDE; teleport(O.x, O.z, O.yaw); G.cam.snap(O.yaw, 0.28, 8.5);
      if (o.then) { try { await o.then(); } catch (e) { console.error('[' + cfg.name + '] leave', e); } }
      await UIfade(0, o.slow ? 900 : 450);
    }
    async function go(i, from = 'above') {
      await UIfade(1, 350);
      show(i);
      const R = rooms[i].R, room = rooms[i];
      if (from === 'below') { teleport(room.up.x, room.up.z, Math.PI * 0.75); G.cam.snap(Math.PI * 0.75, 0.62, 10.5); }
      else { teleport(R.x, R.z + 4.4, Math.PI); G.cam.snap(Math.PI, 0.62, 10.5); }
      await UIfade(0, 350);
      await first(i);
      G.save();
    }
    async function first(i) {
      const st = S(), room = rooms[i];
      if (st['seen' + i]) return;
      st['seen' + i] = true; UIchapter(room.name, room.sub);
      if (cfg.onFirst) { try { const ok = await cfg.onFirst(room, api); if (ok === false) { st['seen' + i] = false; if (i > 0) await go(i - 1, 'below'); else await leave(); } } catch (e) { console.error('[' + cfg.name + '] first', e); } }
    }
    async function floorDone(i) { const st = S(); if (st['done' + i]) return; st['done' + i] = true; await openWay(rooms[i]); if (cfg.onDone) { try { cfg.onDone(i, api); } catch (e) { /* */ } } G.save(); }
    // ---------------------------------------------------------- E, the compass, every frame
    let quick = {};
    function interactables() {
      const list = [], room = rooms[cur]; if (!room) return list;
      const R = room.R, st = S();
      list.push({ x: R.x, z: R.z + HD - 0.9, r: 1.7, label: cur === 0 ? 'Leave the mine' : 'Climb back up', run: () => (cur === 0 ? leave() : go(cur - 1, 'below')) });
      if (st['done' + cur] && room.way && room.way.open && cur < rooms.length - 1) list.push({ x: room.way.x, z: room.way.z, r: 2.0, label: 'Climb down', run: () => go(cur + 1) });
      try { list.push(...(cfg.interactables(room, api) || [])); } catch (e) { console.error('[' + cfg.name + '] interactables', e); }
      return list;
    }
    function target() {
      const room = rooms[cur]; if (!room) return null;
      let t = null; try { t = cfg.target(room, api); } catch (e) { t = null; }
      if (t) return t;
      if (S()['done' + cur] && cur < rooms.length - 1) return { x: room.way.x, z: room.way.z, hint: '{mimo} points down the shaft.' };
      return null;
    }
    function update(dt, t) {
      if (!inside || cur < 0) return;
      if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }
      const room = rooms[cur];
      if (room.way && room.way.arrow.visible) room.way.arrow.position.y = Y0 + 2.1 + Math.sin(t * 3) * 0.15;
      if (cfg.update) { try { cfg.update(room, dt, t, api); } catch (e) { console.error('[' + cfg.name + '] update', e); cfg.update = null; } }
    }
    function late(dt) { if (inside && cfg.late) { try { cfg.late(dt, api); } catch (e) { /* */ } } }
    // a person in a room: the person kit (one mesh and its hull), standing, breathing, turning to you
    function person(room, look, at, name) {
      const { k, top } = PAST.API.personKit(look), g = new THREE.Group(), body = new THREE.Group(); g.add(body); k.build(body);
      const h = look.h || (look.kid ? 0.78 : 1); g.scale.setScalar(h);
      g.position.set(at.x, Y0, at.z); g.rotation.y = at.yaw || 0; room.g.add(g);
      const solid = { x: at.x, z: at.z, r: 0.4 }; WORLD.extra.push(solid);
      return { g, body, solid, api: { id: name, name, x: at.x, y: Y0, z: at.z, top: top * h + 0.1, talking: false, yaw: at.yaw || 0 }, ph: Math.random() * 6 };
    }
    function animate(P, dt, t) {
      if (!P || !P.g.visible) return;
      const Y = G.sim.you, a = P.api, near = Math.hypot(Y.x - a.x, Y.z - a.z) < 4.5;
      P.body.position.y = a.talking ? Math.abs(Math.sin(t * 12 + P.ph)) * 0.05 : 0;
      P.body.rotation.z = Math.sin(t * 1.2 + P.ph) * 0.03;
      P.g.rotation.y = dampAngle(P.g.rotation.y, near || a.talking ? Math.atan2(Y.x - a.x, Y.z - a.z) : a.yaw, 4, dt);
    }
    const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(s); sp.renderOrder = 2; return sp; };
    const api = { get G() { return G; }, rooms, S, Y0, HW, HD, WH, V, wait, tween, chime, floorDone, openWay, leave, go, teleport, person, animate, glow, dark, mats,
      get quick() { return quick; }, get cur() { return cur; }, get inside() { return inside; } };
    return {
      init(game) { G = game; },
      enter, leave, update, late, interactables, target, ROOMS: rooms, OUTSIDE: cfg.OUTSIDE,
      song: () => (cfg.song ? cfg.song(api) : null),
      get inside() { return inside; }, get room() { return cur; },
      curiosities: () => [],
      _: { api, build, applyState, go, floorDone, openWay, rooms, show },
    };
  }
  return { make, Y0, HW, HD, WH };
})();

// ============================================================ the old deep gallery (long ago, before the cave-in)
const QPDEEP = (() => {
  if (typeof QRKIT === 'undefined' || typeof QUART === 'undefined' || !QUART) return null;
  const M = QUART, T = () => QPTXT, X = [-430, -404, -378, -352], Z = -240;
  const st = () => { const s = M.st('past'); return s.deep || (s.deep = {}); };
  const pS = () => M.st('past');
  const ln = key => T().LINES[key];
  const efLook = { skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#8a6a4a', vest: '#3e5a7a', hat: 'cap', hatColor: '#e8b83a', prop: 'lantern', h: 1.0 };
  const nm = id => M.nameOf(T().CAST[id]);
  let K = null;
  // a habit told to the gallery (the imperfect): the memory comes back
  async function habit(key) {
    const r = await M.ask(T().TASKS[key], { tips: T().TIPS, icon: 'star' });
    if (r) TIME.grade('qr.deep.' + key, r.letter);
    return r;
  }
  // a memory: Mimo's move, told in the past (the first time, the Past's card for Mimo, from Chapter 2)
  async function memory(kind) {
    const s = st();
    if (!s.memCard && typeof PAST_SC !== 'undefined' && PAST_SC._ && PAST_SC._.card) { s.memCard = true; try { await PAST_SC._.card('memory'); } catch (e) { /* */ } }
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const r = await M.ask(M.memTask(T().MEM[kind]), { icon: kind === 'cart' ? 'push' : 'sing' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('qr.mem.' + kind, r.letter); }
    return r;
  }
  const floor = i => { const p = pS(); p.floors = Math.max(p.floors || 0, i + 1); };
  // ---------------------------------------------------------- the rooms
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG;
    room.ef = api.person(room, efLook, room.i === 3 ? { x: R.x - 4.6, z: R.z + 3.0, yaw: 2.4 } : { x: R.x + 4.6, z: R.z + 3.2, yaw: -2.5 }, nm('efrain'));
    if (room.i === 0) {
      // lamps on hooks round the walls (dark until the gallery remembers), rails to the shaft, the cart on them
      room.lamps = [[R.x - 5.6, R.z - 5.5], [R.x - 1.6, R.z - 5.5], [R.x + 2.4, R.z - 5.5], [R.x - 6.6, R.z + 0.8], [R.x + 6.6, R.z - 1.0]].map(([x, z]) => {
        k.box(x, Y0 + 3.0, z, 0.24, 0.3, 0.24, '#3d3a3a').box(x, Y0 + 2.86, z, 0.18, 0.2, 0.18, '#f6e7a8', { ink: 0 });
        const gl = api.glow('#ffd27a', 2.6); gl.position.set(x, Y0 + 2.9, z); room.g.add(gl); return gl;
      });
      for (let z = R.z + 5.2; z > R.z - 3.0; z -= 0.75) k.box(R.x - 4.6, Y0 + 0.05, z, 1.4, 0.1, 0.26, '#6b4a30', { ink: 0 });
      for (const o of [-0.45, 0.45]) k.box(R.x - 4.6 + o, Y0 + 0.15, R.z + 1.2, 0.08, 0.1, 8.0, '#7d8590', { ink: 0.01 });
      room.lampAt = { x: R.x - 1.6, z: R.z - 4.4 };
      room.cart = new THREE.Group(); room.cart.position.set(R.x - 4.6, Y0, R.z + 2.6); room.g.add(room.cart);
      const ck = PAST.API.Kit(); ck.box(0, 0.72, 0, 0.95, 0.66, 1.3, '#5d6470').box(0, 1.08, 0, 1.02, 0.07, 1.37, '#454b55', { ink: 0.01 });
      for (const sx of [-0.5, 0.5]) for (const sz of [-0.38, 0.38]) ck.add(KG.cyl, sx, 0.3, sz, 0.19, 0.11, 0.19, '#3a3d44', { rz: Math.PI / 2, ink: 0.01 });
      for (let i = 0; i < 5; i++) ck.add(KG.ball6, (i % 3 - 1) * 0.28, 1.15, i > 2 ? 0.25 : -0.25, 0.22, 0.17, 0.2, i % 2 ? '#9a958c' : '#8a8478', { ink: 0.01 });
      ck.build(room.cart); room.cartSolid = { x: R.x - 4.6, z: R.z + 2.6, r: 0.85 }; WORLD.extra.push(room.cartSolid);
    }
    if (room.i === 1) {
      // the echo wall: a hollow in the rock, carved round like an open mouth, with the miners' marks over it
      room.wall = { x: R.x + 1.0, z: R.z - 5.2 };
      k.add(KG.cyl, R.x + 1.0, Y0 + 2.0, R.z - 5.85, 1.4, 0.3, 1.6, '#3a3230', { rx: Math.PI / 2, ink: 0.02 });
      for (let i = 0; i < 6; i++) k.box(R.x - 1.0 + i * 0.4, Y0 + 3.9, R.z - 5.9, 0.06, 0.4, 0.04, '#e8dcc4', { rz: (i % 2 ? 0.3 : -0.3), ink: 0 });
      room.whisper = api.glow('#a99cff', 3.4); room.whisper.position.set(R.x + 1.0, Y0 + 2.0, R.z - 5.4); room.g.add(room.whisper);
      for (const [x, z] of [[R.x - 5.6, R.z - 5.0], [R.x + 5.8, R.z - 3.6], [R.x - 6.4, R.z + 2.0]]) { k.box(x, Y0 + 3.0, z, 0.24, 0.3, 0.24, '#3d3a3a').box(x, Y0 + 2.86, z, 0.18, 0.2, 0.18, '#f6e7a8', { ink: 0 }); const gl = api.glow('#ffd27a', 2.4, 0.7); gl.position.set(x, Y0 + 2.9, z); room.g.add(gl); }
    }
    if (room.i === 2) {
      // a chasm across the room, the rope bridge's posts (its planks gone), crystals in the seam (dark until sung to)
      const cz = R.z - 0.4;
      const ch = new THREE.Mesh(new THREE.PlaneGeometry(HW2(), 1.6), K.mats().hole); ch.rotation.x = -Math.PI / 2; ch.position.set(R.x, Y0 + 0.02, cz); room.g.add(ch);
      for (const s of [-1, 1]) for (const dx of [-0.7, 0.7]) k.add(KG.cyl6, R.x + 2.4 + dx, Y0 + 0.7, cz + s * 1.05, 0.08, 1.4, 0.08, '#6b4a30', { ink: 0.01 });
      room.planks = new THREE.Group(); room.g.add(room.planks);
      const pk = PAST.API.Kit(); for (let j = 0; j < 6; j++) pk.box(R.x + 2.4, Y0 + 0.08, cz - 0.9 + j * 0.36, 1.5, 0.08, 0.28, j % 2 ? '#a8743f' : '#9a6440', { ink: 0.008 }); pk.build(room.planks); room.planks.visible = false;
      room.bridgeAt = { x: R.x + 2.4, z: cz + 1.9 };
      room.gap = []; for (let x = R.x - api.HW + 0.5; x < R.x + api.HW; x += 0.8) { const c = { x, z: cz, r: 0.55 }; room.gap.push(c); WORLD.extra.push(c); }
      room.crystals = [[R.x - 4.4, R.z + 2.6, 1.6], [R.x - 2.0, R.z + 3.4, 1.1], [R.x + 5.6, R.z + 1.8, 1.3], [R.x - 5.8, R.z - 3.4, 1.0], [R.x + 4.2, R.z - 4.6, 1.2]].map(([x, z, h]) => crystals(room, x, z, h));
      room.crystalAt = { x: R.x - 3.0, z: R.z + 1.8 };
    }
    if (room.i === 3) {
      // the deep face: a cracked beam across the ceiling, and Grandma Echo hanging from it
      k.box(R.x, Y0 + 4.6, R.z - 1.4, 11.0, 0.42, 0.42, '#6b4a30');
      for (const s of [-1, 1]) k.box(R.x + s * 5.4, Y0 + 2.3, R.z - 1.4, 0.42, 4.6, 0.42, '#6b4a30');
      k.box(R.x - 1.2, Y0 + 4.38, R.z - 1.18, 1.6, 0.04, 0.02, '#1b130e', { rz: 0.15, ink: 0 }).box(R.x - 0.2, Y0 + 4.42, R.z - 1.18, 1.0, 0.03, 0.02, '#1b130e', { rz: -0.1, ink: 0 });
      room.beamAt = { x: R.x - 1.2, z: R.z + 1.2 };
      room.spot = { x: R.x + 1.2, z: R.z - 1.6 };
      let bat = null;
      if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) { try { bat = BATTLE.buildFoe('bat', 'white', { size: 'big', mood: 'asleep' }); bat.scale.multiplyScalar(1.7); } catch (e) { bat = null; } }
      if (bat) { bat.position.set(room.spot.x, Y0 + 4.35, room.spot.z); bat.rotation.x = Math.PI; room.g.add(bat); }
      room.bat = bat; room.batSolid = { x: room.spot.x, z: room.spot.z, r: 1.2 }; WORLD.extra.push(room.batSolid);
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffe6a8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.orb.scale.setScalar(1.6); room.orb.position.set(room.spot.x, Y0 + 1.6, room.spot.z); room.g.add(room.orb);
      for (const [x, z] of [[R.x - 6.4, R.z - 4.0], [R.x + 6.4, R.z - 4.0]]) { const gl = api.glow('#ffd27a', 2.2, 0.6); gl.position.set(x, Y0 + 2.9, z); room.g.add(gl); }
    }
    k.build(room.g);
  }
  const HW2 = () => QRKIT.HW * 2;
  function crystals(room, x, z, h) {
    const Y0 = K.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, R = rng(Math.round(x * 13 + z * 7)), cols = ['#9b8fd8', '#7fe0d8', '#c9a2ff', '#8fd0ff'];
    k.add(KG.cone4, x, Y0 + h * 0.45, z, 0.24, h, 0.24, cols[(R() * 4) | 0], { rz: (R() - 0.5) * 0.4, ink: 0.015 });
    for (let i = 0; i < 3; i++) { const a = R() * TAU, hh = h * (0.35 + R() * 0.35); k.add(KG.cone4, x + Math.cos(a) * 0.32, Y0 + hh * 0.4, z + Math.sin(a) * 0.26, 0.14, hh, 0.14, cols[(R() * 4) | 0], { rz: Math.cos(a) * 0.5, rx: Math.sin(a) * 0.5, ink: 0.012 }); }
    const mat = new THREE.MeshToonMaterial({ color: '#4a4658', vertexColors: true, gradientMap: TK.grad, emissive: new THREE.Color('#000000') });
    k.build(room.g, { mat, hull: true, shadow: false });
    const gl = K.glow('#a99cff', 2.2 + h * 1.2); gl.position.set(x, Y0 + h * 0.55, z); room.g.add(gl);
    return { x, z, h, mat, gl, lit: 0, litT: 0 };
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.cart) { r0.cart.position.set(r0.R.x - 4.6, api.Y0, r0.R.z - 2.4); r0.cartSolid.x = r0.R.x - 4.6; r0.cartSolid.z = r0.R.z - 2.2; }
    if (s.sang) r2.crystals.forEach(c => { c.litT = 1; c.lit = 1; });
    if (s.bridge) { r2.planks.visible = true; r2.gap.forEach(c => { if (Math.abs(c.x - (r2.R.x + 2.4)) < 1.0) { c.x = 1e5; } }); }
    if (s.boss) { if (r3.bat) r3.bat.visible = false; r3.batSolid.x = 1e5; }
  }
  const isDark = room => (room.i === 0 && !st().lamps) || (room.i === 2 && !st().sang);
  // ---------------------------------------------------------- the floors' deeds
  async function lampsDeed(room) {
    const s = st(); const r = await habit('lamps'); if (!r) return;
    M.lock(true);
    try {
      for (const gl of room.lamps) { await K.wait(0.25); Sound.play('pip'); await K.tween(0.25, k => { gl.material.opacity = k * 0.9; }); }
      s.lamps = true; K.dark(); K.G.save();
      M.frame2(room.ef.api); await M.say(room.ef.api, ln('deep.lamps'));
    } finally { M.lock(false); }
    M.think(`The cart sits on the rails, by the boarded shaft. Tell {mimo} what it did with it, as a memory: ${M.sx('mem')}.`, 6);
  }
  async function cartDeed(room) {
    const s = st(); const r = await memory('cart'); if (!r) return;
    const G = K.G, c = room.cart;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: c.position.x, z: c.position.z + 1.4 }, { x: c.position.x, z: c.position.z }); await K.wait(0.7); G.sim.mimo.hop = { t: 0 }; Sound.play('land', 8);
      const z0 = c.position.z; Sound.play('gears');
      await K.tween(0.9, k => { c.position.z = lerp(z0, room.R.z - 2.4, k * k); });
      Sound.play('crunch'); G.w3d.fx.puff(room.way.x, K.Y0 + 0.4, room.way.z, 14, 0.4, '#cfc4b0');
      s.cart = true; room.cartSolid.x = room.R.x - 4.6; room.cartSolid.z = room.R.z - 2.2; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    floor(0); await K.floorDone(0);
    UI.toast('The boards are gone. The way down is open!');
  }
  async function echoDeed(room) {
    const s = st(); const r = await habit('echo'); if (!r) return;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 1.0, K.Y0 + 2.8, room.R.z + 1.6), K.V(room.wall.x, K.Y0 + 2.0, room.wall.z));
      for (let i = 0; i < 3; i++) { Sound.play('chime'); await K.tween(0.4, k => { room.whisper.material.opacity = Math.sin(k * Math.PI) * 0.9; }); }
      s.echo = true; K.G.save();
      M.frame2(room.ef.api); await M.say(room.ef.api, ln('deep.echo'));
    } finally { M.lock(false); }
    floor(1); await K.floorDone(1);
  }
  async function singDeed(room) {
    const s = st(); const r = await memory('crystals'); if (!r) return;
    const G = K.G;
    M.lock(true);
    try {
      G.sim.mimoGo(room.crystalAt, room.crystalAt); await K.wait(0.7);
      try { if (CAVES.mimoSing) await CAVES.mimoSing(1.8); else Sound.play('sing'); } catch (e) { /* */ }
      room.crystals.forEach(c => { c.litT = 1; }); s.sang = true; K.dark(); G.save(); Sound.play('learned'); await K.wait(0.8); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    M.think('The seam is lit. Across the chasm, the rope bridge’s posts… its planks are gone. How did the miners cross?', 5.5);
  }
  async function bridgeDeed(room) {
    const s = st(); const r = await habit('bridge'); if (!r) return;
    M.lock(true);
    try {
      M.shot(K.V(room.bridgeAt.x + 3.2, K.Y0 + 3.2, room.bridgeAt.z + 3.0), K.V(room.bridgeAt.x, K.Y0, room.bridgeAt.z - 1.8));
      room.planks.visible = true; room.planks.children.forEach(m => { m.scale.set(1, 1, 0.001); });
      await K.tween(1.0, k => { room.planks.children.forEach(m => { m.scale.set(1, 1, Math.max(0.001, k)); }); });
      room.gap.forEach(c => { if (Math.abs(c.x - room.bridgeAt.x) < 1.0) c.x = 1e5; }); Sound.play('wood');
      s.bridge = true; K.G.save();
      M.frame2(room.ef.api); await M.say(room.ef.api, ln('deep.bridge'));
    } finally { M.lock(false); }
    floor(2); await K.floorDone(2);
  }
  // the bottom: Grandma Echo (the fight), Elio's echo, the gallery sings again
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.6, K.Y0 + 3.0, room.R.z + 4.4), K.V(room.spot.x, K.Y0 + 2.2, room.spot.z)); await K.wait(0.6); await M.you('An old white bat, hanging from the cracked beam, fast asleep… and something in her glows, humming like a voice.'); } finally { M.lock(false); }
    const r = typeof QRBOSS !== 'undefined' && QRBOSS ? await QRBOSS.fightEcho() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Tell it as a memory, and vary your words!' : 'She settles back on the beam, muttering.', 4.5); return; }
    s.boss = true; room.batSolid.x = 1e5;
    M.lock(true);
    try {
      if (room.bat) { G.w3d.fx.puff(room.spot.x, K.Y0 + 1.6, room.spot.z, 18, 0.45, '#e8e4f4'); await K.wait(0.4); room.bat.visible = false; }
      await K.tween(1.4, k => { room.orb.material.opacity = k * 0.95; room.orb.position.y = K.Y0 + 1.2 + k * 1.4; room.orb.scale.setScalar(1.2 + k * 0.8); });
      Sound.play('chime'); await K.wait(0.4);
      await M.you('A boy’s voice… soft, and a little sad. What he never sang here.');
      const letter = typeof QRBOSS !== 'undefined' && QRBOSS ? QRBOSS.letter('past') : 'B';
      await CH4.give('quarry', 'past', letter);
      await K.tween(0.8, k => { room.orb.material.opacity = 0.95 * (1 - k); room.orb.position.y = K.Y0 + 2.6 + k * 2; });
      M.frame2(room.ef.api); await M.say(room.ef.api, ln('deep.done'));
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true;
    TIME.flag('past', 'qrDeep', true); TIME.refresh();
    await K.leave({ slow: true, then: async () => { const G = K.G; G.cam.override = { pos: K.V(88 - 10, 9, -276.6 + 15), look: K.V(88, 2.5, -272) }; G.cam.snap(0, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      for (let k = 0; k < 3; k++) { Sound.play('chime'); await K.wait(0.8); }
      try { if (typeof QRMUSIC !== 'undefined') QRMUSIC.play('qr_chorus', 7); } catch (e) { /* */ }
      await (TIME._.fast.on ? Promise.resolve() : UI.chapter('The old deep gallery', 'singing again, long ago'));
      const B = typeof QR_PAST !== 'undefined' && QR_PAST ? QR_PAST.who('boss') : null;
      if (B) { M.frame2(B); await M.say(B, ln('boss.done')); }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Elio’s echo is free. Noa is waiting at the time crack by the camp’s entrance.', 5.5);
    G.save();
  }
  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().MEM[kind].model || {})[M.lang()] || '', M.lang()))}»` : `Tell ${name}`);
    if (room.ef) out.push({ x: room.ef.api.x - 0.6, z: room.ef.api.z - 0.5, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { await M.demo(room.ef.api, T().DEMO['deep' + i], T().MARKS['deep' + i]); } finally { M.lock(false); } } });
    if (i === 0) {
      if (!s.lamps) out.push({ x: room.lampAt.x, z: room.lampAt.z, r: 1.8, label: 'The lamps', run: () => lampsDeed(room) });
      else if (!s.cart) out.push({ x: room.cart.position.x + 1.3, z: room.cart.position.z, r: 1.7, label: sayQ('cart'), run: () => cartDeed(room) });
    }
    if (i === 1 && !s.echo) out.push({ x: room.wall.x, z: room.wall.z + 1.2, r: 1.8, label: 'The echo wall', run: () => echoDeed(room) });
    if (i === 2) {
      if (!s.sang) out.push({ x: room.crystalAt.x, z: room.crystalAt.z, r: 1.8, label: sayQ('crystals'), run: () => singDeed(room) });
      else if (!s.bridge) out.push({ x: room.bridgeAt.x, z: room.bridgeAt.z, r: 1.8, label: 'The rope bridge', run: () => bridgeDeed(room) });
    }
    if (i === 3) {
      if (!s.boss) out.push({ x: room.spot.x, z: room.spot.z + 2.2, r: 2.4, label: 'Wake her', run: () => bossScene(room) });
      out.push({ x: room.beamAt.x, z: room.beamAt.z, r: 1.3, label: 'Look', run: async () => { M.lock(true); try { M.frame2(room.ef.api); await M.say(room.ef.api, ln('deep.crack')); } finally { M.lock(false); } } });
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!s.lamps) return { x: room.lampAt.x, z: room.lampAt.z, hint: '{mimo} looks at the dark lamps on the wall.' }; if (!s.cart) return { x: room.cart.position.x, z: room.cart.position.z, hint: '{mimo} sniffs the cart on the rails.' }; }
    if (i === 1 && !s.echo) return { x: room.wall.x, z: room.wall.z, hint: '{mimo} listens at the hollow in the wall.' };
    if (i === 2) { if (!s.sang) return { x: room.crystalAt.x, z: room.crystalAt.z, hint: '{mimo} looks at the dark crystals.' }; if (!s.bridge) return { x: room.bridgeAt.x, z: room.bridgeAt.z, hint: '{mimo} looks at the bridge’s bare posts.' }; }
    if (i === 3 && !s.boss) return { x: room.spot.x, z: room.spot.z, hint: '{mimo} looks up at the old bat on the beam.' };
    return null;
  }
  async function onFirst(room) {
    if (room.i === 1 && !st().ambush) {
      await K.wait(1.0);
      await M.you('Echo bats in the dark! In here, it’s all a memory: tell {mimo} what it did.');
      const r = await TIME.fight({ foes: [{ kind: 'bat', color: 'blue', size: 'small' }, { kind: 'bat', color: 'yellow', size: 'small' }, { kind: 'hushling', color: 'green', size: 'small' }], place: { x: 88, z: -276, biome: 'cave' } });
      if (!r || r.outcome !== 'win') return false;
      st().ambush = true; K.G.save();
    }
    const P = room.ef;
    if (P) { await K.wait(room.i === 1 ? 0.6 : 1.2); M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO['deep' + room.i], T().MARKS['deep' + room.i]); } finally { M.lock(false); } }
    if (room.i === 0) M.think(`It’s dark: the gallery has forgotten. Tell it how it used to be: ${M.sx('habit')}.`, 6);
    if (room.i === 2) M.think('Dark crystals, a chasm, a bridge with no planks. First, light: {mimo} sings, as a memory.', 5.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.ef) K.animate(room.ef, dt, t);
    if (room.i === 2) room.crystals.forEach(c => { c.lit = damp(c.lit, c.litT, 2.4, dt); const L = c.lit; c.mat.color.setRGB(lerp(0.29, 1, L), lerp(0.27, 1, L), lerp(0.35, 1, L)); c.mat.emissive.setRGB(0.24 * L, 0.18 * L, 0.45 * L).multiplyScalar(0.8 + 0.25 * Math.sin(t * 2.4 + c.x)); c.gl.material.opacity = L * (0.6 + 0.2 * Math.sin(t * 2 + c.z)); });
    if (room.i === 0 && st().lamps) room.lamps.forEach((gl, i) => { gl.material.opacity = 0.8 + 0.1 * Math.sin(t * 7 + i * 2); });
    if (room.i === 3 && room.bat && room.bat.visible) { room.bat.rotation.z = Math.sin(t * 0.8) * 0.08; if (room.bat.userData.animate) room.bat.userData.animate(dt, t, 0); }
  }
  // the dungeon's own look: the old photograph's sepia over the picture (the Past's sky dome stays hidden in here)
  function late() {
    const cv = document.getElementById('gl');
    if (cv && !document.body.classList.contains('in-battle')) cv.style.filter = 'sepia(0.32) saturate(1.12) hue-rotate(-6deg) contrast(1.04)';
    if (typeof PAST !== 'undefined' && PAST._ && PAST._.W && PAST._.W.sky) PAST._.W.sky.visible = false;
  }
  const MOD = QRKIT.make({
    name: 'qr-past-deep', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: { x: 88, z: -273.8, yaw: 0 }, state: st, tint: { rock: ['#6a5a48', '#76654f', '#5e5040', '#7d6b55'], floor: '#54483a', floorA: '#605244', floorB: '#4a3f33', beam: '#7a5434', puff: '#d8c8a8', seed: 11 },
    interior: { fog: '#3a2a1c', near: 18, far: 54 }, dark: { fog: '#09070a', near: 7, far: 19 }, isDark: room => isDark(room),
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('qr_past_deep') ? 'qr_past_deep' : null),
  });
  return Object.assign(MOD, { finale });
})();
