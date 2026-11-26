'use strict';
// The Stone Chapel tomorrow (game/TIME.md §25 "The Gray Marsh (T4c)"): four rooms at y 300, z −306, x −326 / −300 / −274 / −248, on
// MOLMILL's room kit (molinar_past_mill.js), reskinned here as the drowned chapel turned to stone (gray flagstones, stone walls in
// courses, the kit's trapdoors and ladders going up; the kit itself is untouched). Everything inside is stone, and plans bounce off
// it; imagine a thing as something else, out loud, and {mimo} does what it would do. Lucero follows you up with the only light.
//   0 the Stone Nave: stone pews, stone candles, stone hymn books; Lucero's question («Si la capilla no fuera de piedra, oiríamos la
//     campana»); a stone door before the ladder: «Si la puerta fuera de madera, {mimo} la empujaría» (it turns to wood, and opens)
//   1 the Choir of Statues: a stone-shadow ambush (tomorrow's what-ifs), then the choir: «Si cantaran, la campana respondería» (for a
//     moment their mouths glow)
//   2 the Belfry Stair: Lucero's fear («¿Y si yo también me quedara de piedra?»: «Si te quedaras de piedra, yo te despertaría»); a
//     stone slab over the ladder: «Si la losa fuera de arena, {mimo} la soplaría»
//   3 the Stone Belfry: the stone bell, and on it the Stone Gargoyle (marsh_time_boss.js); Elio's last echo; outside, the stone comes
//     off Candil and the water comes back (MH_FUT.free)
const MH_FCHAPEL = (() => {
  if (typeof MOLMILL === 'undefined' || typeof MARSHT === 'undefined' || !MARSHT) return null;
  const M = MARSHT, T = () => MHFTXT, X = [-326, -300, -274, -248], Z = -306;
  const HW = MOLMILL.HW, HD = MOLMILL.HD, WH = MOLMILL.WH;
  const st = () => { const s = M.st('future'); return s.chapel || (s.chapel = {}); };
  const fS = () => M.st('future');
  const luceroLook = { skin: '#c98e62', hair: '#b8aca0', hairdo: 'bun', dress: '#2f4f6a', vest: '#c9a24a', shawl: '#8a3a2e', hat: 'flat', hatColor: '#3a3036', prop: 'lantern', h: 0.97 };
  const nm = id => M.nameOf(T().CAST[id]);
  const ln = key => T().LINES[key];
  let K = null;
  const OUT = () => { const D = typeof MH_FUT !== 'undefined' && MH_FUT ? MH_FUT.DOORSPOT : { x: -41.3, z: -370.6 }; return { x: D.x + 0.3, z: D.z + 0.5, yaw: 0.6 }; };
  const STONE = '#8d8a84', STONE2 = '#7d7a74', STONE3 = '#a39f97';

  // ---------------------------------------------------------- a material that can be imagined as something else: stone gray, tinted for
  // a moment (or for good) as wood, sand… (uTint / uTintK), and drained or filled (uGray)
  function imagMat() {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad }), u = { uGray: { value: 0 }, uTint: { value: new THREE.Color('#ffffff') }, uTintK: { value: 0 } };
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = u.uGray; sh.uniforms.uTint = u.uTint; sh.uniforms.uTintK = u.uTintK;
      sh.fragmentShader = 'uniform float uGray; uniform vec3 uTint; uniform float uTintK;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.9), uGray); diffuseColor.rgb = mix(diffuseColor.rgb, uTint * (0.55 + 0.6 * l), uTintK); }');
    };
    m.customProgramCacheKey = () => 'mhFRoomImag';
    return { m, u };
  }
  // the choir's statues: the person kit, all stone (the same stone as tomorrow's people, marsh_future.js)
  function statue(room, look, at) {
    const { k } = PAST.API.personKit(look), g = new THREE.Group(), body = new THREE.Group(); g.add(body); k.build(body);
    const s0 = imagMat(); s0.u.uGray.value = 1;
    body.traverse(o => { if (o.isMesh && o.material && o.material.vertexColors) o.material = s0.m; });
    g.scale.setScalar(look.h || 1); g.position.set(at.x, K.Y0, at.z); g.rotation.y = at.yaw || 0; room.g.add(g);
    const solid = { x: at.x, z: at.z, r: 0.4 }; WORLD.extra.push(solid);
    return { g, s0 };
  }
  const floorsUp = i => { const f = fS(); f.floors = Math.max(f.floors || 0, Math.min(3, i + 1)); };

  // ---------------------------------------------------------- the rooms
  function shellUp(room, k) {
    const R = room.R, Y0 = K.Y0, KG = PAST.API.KG;
    for (let x = -HW + 1.5; x <= HW - 1.5; x += 3) k.box(R.x + x, Y0 + WH / 2, R.z - HD + 0.15, 0.5, WH, 0.24, STONE2, { ink: 0.006 });
    for (let x = -HW + 1.5; x <= HW - 1.5; x += 3) k.add(KG.half || KG.sphere, R.x + x + 1.5, Y0 + WH - 0.9, R.z - HD + 0.16, 1.3, 0.8, 0.12, STONE3, { ink: 0.004 });
    k.box(R.x, Y0 + WH - 0.35, R.z - HD + 0.16, HW * 2, 0.26, 0.18, STONE2, { ink: 0.004 });
  }
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, i = room.i;
    shellUp(room, k);
    room.lucero = api.person(room, luceroLook, i === 3 ? { x: R.x + 4.8, z: R.z + 3.4, yaw: -2.6 } : { x: R.x + 3.8, z: R.z + 3.4, yaw: -2.4 }, nm('lucero'));
    room.light = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd77a', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    room.light.scale.setScalar(2.4); room.g.add(room.light);
    const up = room.up || { x: R.x - 4.6, z: R.z - 3.6 };
    if (i === 0) {
      // the nave: rows of stone pews, stone candles on stone candlesticks along the walls, a hymn book left open on a pew
      for (let row = 0; row < 3; row++) for (const s of [-1, 1]) {
        const x = R.x + s * 2.4 + 0.6, z = R.z - 1.0 + row * 1.6;
        k.box(x, Y0 + 0.45, z, 3.0, 0.14, 0.6, STONE, { ink: 0.01 }).box(x, Y0 + 0.85, z + 0.28, 3.0, 0.7, 0.1, STONE2, { ink: 0.008 });
        for (const dx of [-1.3, 1.3]) k.box(x + dx, Y0 + 0.22, z, 0.12, 0.44, 0.5, STONE2, { ink: 0 });
      }
      k.box(R.x + 3.0, Y0 + 0.55, R.z + 0.6, 0.36, 0.06, 0.26, STONE3, { ry: 0.3, ink: 0.004 });
      for (const x of [R.x + 5.6, R.x + 0.6]) { k.add(KG.cyl6, x, Y0 + 0.6, R.z - HD + 0.7, 0.12, 1.2, 0.12, STONE2, { ink: 0.004 }); for (const dz of [-0.2, 0, 0.2]) k.add(KG.cyl6, x + dz, Y0 + 1.35, R.z - HD + 0.7, 0.05, 0.3, 0.05, STONE3, { ink: 0 }); }
      room.pew = { x: R.x + 3.0, z: R.z + 0.6 };
      // the stone door before the ladder's corner (imagined as wood, it swings open)
      room.doorAt = { x: up.x + 1.5, z: up.z + 1.5 };
      room.door = new THREE.Group(); room.door.position.set(room.doorAt.x - 0.75 * Math.cos(-Math.PI / 4), Y0, room.doorAt.z + 0.75 * Math.sin(-Math.PI / 4)); room.door.rotation.y = -Math.PI / 4; room.g.add(room.door);
      room.dm = imagMat();
      const kd = PAST.API.Kit(); kd.box(0.75, 1.2, 0, 1.5, 2.4, 0.22, STONE, { ink: 0.014 }).box(1.3, 1.2, 0.14, 0.12, 0.12, 0.08, STONE3, { ink: 0 }); kd.build(room.door, { mat: room.dm.m });
      room.doorSolid = { x: room.doorAt.x, z: room.doorAt.z, r: 0.95 }; WORLD.extra.push(room.doorSolid);
    }
    if (i === 1) {
      // the choir: two rows of stone singers facing the nave, a stone lectern with the hymn book
      const looks = [{ skin: '#c98e62', hair: '#5a3020', hairdo: 'bun', dress: '#6a5a8a' }, { skin: '#e6b48c', hair: '#3a2b26', hairdo: 'short', dress: '#4f7a8a' }, { skin: '#a8714a', hair: '#1f1a18', hairdo: 'braids', dress: '#c9453a' },
        { skin: '#d9a27a', hair: '#ece6dc', hairdo: 'short', beard: true, hair2: '#ece6dc', dress: '#8a5a4a' }, { skin: '#efc29a', hair: '#6b3b25', hairdo: 'bun', dress: '#3e7fb0' }, { kid: true, skin: '#c98e62', hair: '#1f1a18', hairdo: 'short', dress: '#f2c94c', h: 0.62 }];
      room.statues = looks.map((lk, j) => statue(room, lk, { x: R.x - 3.4 + (j % 3) * 2.0, z: R.z - 2.8 + (j < 3 ? 0 : 1.6), yaw: 0 }));
      k.box(R.x + 3.4, Y0 + 0.6, R.z - 1.6, 0.6, 1.2, 0.6, STONE2, { ink: 0.01 }).box(R.x + 3.4, Y0 + 1.25, R.z - 1.6, 0.8, 0.08, 0.6, STONE3, { rx: 0.3, ink: 0.006 });
      room.choirAt = { x: R.x - 1.4, z: R.z - 0.4 };
    }
    if (i === 2) {
      // the belfry stair: stone steps winding up round a column, a railing; a stone slab lying over the way up
      k.add(KG.cyl, R.x - 1.0, Y0 + WH / 2, R.z - 1.0, 0.7, WH, 0.7, STONE2, { ink: 0.012 });
      for (let j = 0; j < 9; j++) { const a = j * 0.62, rr = 1.6; k.box(R.x - 1.0 + Math.cos(a) * rr, Y0 + 0.2 + j * 0.5, R.z - 1.0 + Math.sin(a) * rr, 1.4, 0.18, 0.7, j % 2 ? STONE : STONE3, { ry: -a, ink: 0.008 }); }
      for (let j = 0; j < 8; j++) { const a = j * 0.62 + 0.3, rr = 2.4; k.add(KG.cyl6, R.x - 1.0 + Math.cos(a) * rr, Y0 + 0.9 + j * 0.5, R.z - 1.0 + Math.sin(a) * rr, 0.04, 1.0, 0.04, STONE2, { ink: 0 }); }
      room.slabAt = { x: up.x + 1.0, z: up.z + 1.2 };
      room.slab = new THREE.Group(); room.slab.position.set(room.slabAt.x, Y0, room.slabAt.z); room.g.add(room.slab);
      room.sm = imagMat();
      const ks = PAST.API.Kit(); ks.box(0, 0.35, 0, 2.2, 0.7, 1.6, STONE, { ry: 0.4, ink: 0.014 }); for (let j = 0; j < 4; j++) ks.box(-0.6 + j * 0.4, 0.71, (j % 2 ? 0.2 : -0.2), 0.08, 0.03, 0.6, STONE2, { ry: 0.4, ink: 0 }); ks.build(room.slab, { mat: room.sm.m });
      room.slabSolid = { x: room.slabAt.x, z: room.slabAt.z, r: 1.1 }; WORLD.extra.push(room.slabSolid);
      room.rail = { x: R.x + 1.4, z: R.z - 2.6 };
    }
    if (i === 3) {
      // the belfry: arches open on the stone marsh (a painted view), the beam, the stone bell, and on it the gargoyle (waiting)
      for (const [dx, dz, ry, w] of [[0, -HD + 0.04, 0, 12.6], [-HW + 0.04, 0, Math.PI / 2, 10.6], [HW - 0.04, 0, -Math.PI / 2, 10.6]]) { const v = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.0), new THREE.MeshBasicMaterial({ map: viewTex() })); v.position.set(R.x + dx, Y0 + 2.7, R.z + dz); v.rotation.y = ry; room.g.add(v); }
      room.bellAt = { x: R.x, z: R.z - 1.2 };
      k.box(R.x, Y0 + 4.6, room.bellAt.z, 6.0, 0.36, 0.4, STONE2, { ink: 0.012 });
      for (const s of [-1, 1]) k.box(R.x + s * 2.9, Y0 + 2.3, room.bellAt.z, 0.36, 4.6, 0.4, STONE2, { ink: 0.012 });
      room.bell = new THREE.Group(); room.bell.position.set(room.bellAt.x, Y0 + 4.4, room.bellAt.z); room.g.add(room.bell);
      room.bm = imagMat(); room.bm.u.uGray.value = 0;
      const kb = PAST.API.Kit(); kb.add(KG.cone, 0, -1.2, 0, 1.25, 1.9, 1.25, STONE, { ink: 0.016 }).add(KG.sphere, 0, -0.25, 0, 0.8, 0.5, 0.8, STONE3, { ink: 0.01 }).add(KG.torus, 0, -2.1, 0, 1.25, 1.25, 0.12, STONE2, { rx: Math.PI / 2, ink: 0.006 }).add(KG.sphere, 0, -2.25, 0, 0.18, 0.22, 0.18, STONE2, { ink: 0.004 });
      kb.build(room.bell, { mat: room.bm.m });
      room.bellSolid = { x: room.bellAt.x, z: room.bellAt.z, r: 1.3 }; WORLD.extra.push(room.bellSolid);
      if (typeof MHBOSS !== 'undefined' && MHBOSS.gargModel) { try { const h = MHBOSS.gargModel(); h.root.scale.setScalar(0.55); h.root.position.set(room.bellAt.x, Y0 + 4.85, room.bellAt.z); h.root.rotation.y = 0.2; room.g.add(h.root); room.garg = h; } catch (e) { /* (no model) */ } }
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3c8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); room.orb.scale.setScalar(1.0); room.orb.position.set(room.bellAt.x, Y0 + 3.0, room.bellAt.z + 0.6); room.g.add(room.orb);
    }
    k.build(room.g);
  }
  // the belfry's arches: the marsh turned to stone all round (a painted view): a gray basin, stone trees, Candil, its great lantern lit
  let VIEW = null;
  function viewTex() {
    if (VIEW) return VIEW;
    VIEW = TK.canvasTex(512, 256, c => {
      const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#b8bcc4'); g.addColorStop(0.6, '#d8d6d0'); g.addColorStop(1, '#c8c4bc'); c.fillStyle = g; c.fillRect(0, 0, 512, 256);
      c.fillStyle = '#a8a49c'; c.fillRect(0, 160, 512, 96);
      c.strokeStyle = 'rgba(110,106,100,0.6)'; c.lineWidth = 2; for (let k = 0; k < 14; k++) { c.beginPath(); c.moveTo((k * 47) % 512, 170 + (k % 5) * 16); c.lineTo((k * 47 + 40) % 512, 180 + (k % 4) * 18); c.stroke(); }
      c.fillStyle = '#8d8a84'; for (let k = 0; k < 9; k++) { const x = 20 + k * 58; c.fillRect(x, 110, 6, 54); c.beginPath(); c.ellipse(x + 3, 104, 18, 14, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#9a968e'; c.beginPath(); c.moveTo(300, 160); c.lineTo(330, 136); c.lineTo(380, 136); c.lineTo(410, 160); c.fill();
      c.fillStyle = '#7d7a74'; c.fillRect(352, 104, 6, 34);
      c.fillStyle = '#ffe9a0'; c.beginPath(); c.arc(355, 100, 6, 0, TAU); c.fill();
    });
    return VIEW;
  }
  function applyState(api) {
    const s = st(), [r0, , r2, r3] = api.rooms;
    if (s.door) { r0.dm.u.uTint.value.set('#a8743f'); r0.dm.u.uTintK.value = 1; r0.door.rotation.y = -Math.PI / 4 - 1.5; r0.doorSolid.x = 1e5; r0.doorSolid.z = 1e5; }
    if (s.slab) { r2.slab.visible = false; r2.slabSolid.x = 1e5; r2.slabSolid.z = 1e5; }
    if (s.boss) { if (r3.garg) r3.garg.root.visible = false; r3.bm.u.uTint.value.set('#c9a24a'); r3.bm.u.uTintK.value = 0.6; }
  }

  // ---------------------------------------------------------- the floors' deeds
  async function sayLucero(room, key) { const P = room.lucero; if (!P) return; M.lock(true); try { M.frame2(P.api, -1); await M.say(P.api, ln(key)); } finally { M.lock(false); } }
  async function demoLucero(room, key) { const P = room.lucero; if (!P) return; M.lock(true); try { M.frame2(P.api, -1); await M.demo(P.api, T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
  async function imagine(room, taskKey, icon) {
    const r = await M.ask(T().TASKS[taskKey], { tips: T().TIPS, icon: icon || 'star' });
    if (!r) { M.think('{lucero} is waiting, her lantern up. Imagine it out loud: «Si…, …-ría».', 4); return null; }
    TIME.grade('mf.chapel.' + taskKey, r.letter); return r;
  }
  async function naveTask(room) {
    const s = st(); await sayLucero(room, 'chapel.r0q');
    const r = await imagine(room, 'r0'); if (!r) return;
    s.r0 = true; K.G.save(); await sayLucero(room, 'chapel.r0done');
    M.think(`A stone door before the ladder. Imagine it as wood, and tell {mimo} what it would do: ${M.sx('mif')}.`, 6);
  }
  async function doorTask(room) {
    const s = st(); const r = await imagine(room, 'door', 'push'); if (!r) return;
    const G = K.G, c = room.doorAt;
    M.lock(true);
    try {
      Sound.play('chime'); await K.tween(0.8, kk => { room.dm.u.uTint.value.set('#a8743f'); room.dm.u.uTintK.value = kk; });
      G.sim.mimoGo({ x: c.x + 1.0, z: c.z + 1.0 }, c); await K.wait(0.7); Sound.play('wood');
      await K.tween(0.9, kk => { room.door.rotation.y = -Math.PI / 4 - kk * 1.5; });
      room.doorSolid.x = 1e5; room.doorSolid.z = 1e5; Sound.play('land', 8);
      s.door = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    floorsUp(0); await K.floorDone(0);
    M.think('The way up is open. {lucero} lifts her lantern: up.', 4);
  }
  async function choirTask(room) {
    const s = st(); await sayLucero(room, 'chapel.r1q');
    const r = await imagine(room, 'r1', 'sing'); if (!r) return;
    const G = K.G;
    M.lock(true);
    try {
      Sound.play('sing');
      for (const S0 of room.statues || []) { const p = S0.g.position; G.w3d.fx.sparkle(p.x, K.Y0 + 1.7 * S0.g.scale.y, p.z + 0.3, 6, ['#fff3c8', '#ffd77a']); }
      await K.tween(0.6, kk => { (room.statues || []).forEach(S0 => { S0.s0.u.uGray.value = 1 - kk * 0.7; }); });
      await K.wait(0.6); Sound.play('bell');
      await K.tween(0.8, kk => { (room.statues || []).forEach(S0 => { S0.s0.u.uGray.value = 0.3 + kk * 0.7; }); });
      s.r1 = true; G.save();
    } finally { M.lock(false); }
    await sayLucero(room, 'chapel.r1done');
    floorsUp(1); await K.floorDone(1);
  }
  async function fearTask(room) {
    const s = st();
    const r = await imagine(room, 'r2'); if (!r) return;
    s.r2 = true; K.G.save(); await sayLucero(room, 'chapel.r2done');
    M.think('A stone slab lies over the way up. Imagine it as sand, and tell {mimo} what it would do.', 5);
  }
  async function slabTask(room) {
    const s = st(); const r = await imagine(room, 'slab', 'blow'); if (!r) return;
    const G = K.G, c = room.slabAt;
    M.lock(true);
    try {
      Sound.play('chime'); await K.tween(0.8, kk => { room.sm.u.uTint.value.set('#e8cf9a'); room.sm.u.uTintK.value = kk; });
      G.sim.mimoGo({ x: c.x + 1.4, z: c.z + 1.2 }, c); await K.wait(0.7);
      for (let j = 0; j < 5; j++) { Sound.play('blow'); G.w3d.fx.puff(c.x + (Math.random() - 0.5) * 1.2, K.Y0 + 0.5, c.z + (Math.random() - 0.5) * 0.8, 10, 0.35, '#e8cf9a'); await K.wait(0.18); }
      await K.tween(0.6, kk => { room.slab.scale.set(1, Math.max(0.01, 1 - kk), 1); });
      room.slab.visible = false; room.slabSolid.x = 1e5; room.slabSolid.z = 1e5;
      s.slab = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    floorsUp(2); await K.floorDone(2);
  }
  // the top: the Stone Gargoyle (the fight), Elio's last echo, then down and out: the stone comes off Candil
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.6, K.Y0 + 3.2, room.R.z + 3.8), K.V(room.bellAt.x, K.Y0 + 3.8, room.bellAt.z)); await K.wait(0.6); await sayLucero(room, 'chapel.top'); } finally { M.lock(false); }
    const r = typeof MHBOSS !== 'undefined' ? await MHBOSS.fightGargoyle() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Imagine it as something else!' : 'The gargoyle settles back on the stone bell.', 4); return; }
    s.boss = true;
    M.lock(true);
    try {
      if (room.garg) room.garg.root.visible = false;
      G.w3d.fx.sparkle(room.bellAt.x, K.Y0 + 4.6, room.bellAt.z, 26, ['#e8e4dc', '#fff3c8', '#bfe4ff']); Sound.play('bell');
      await K.tween(1.2, kk => { room.bm.u.uTint.value.set('#c9a24a'); room.bm.u.uTintK.value = kk * 0.6; });
      await K.tween(1.4, kk => { room.orb.material.opacity = kk * 0.95; room.orb.position.y = K.Y0 + 3.0 + kk * 1.0; room.orb.scale.setScalar(1.0 + kk * 0.8); });
      await M.you('A man’s voice, steady, from far away… as if he were on a stage, and someone laughed, and he laughed too, and kept going.');
      const letter = typeof MHBOSS !== 'undefined' ? MHBOSS.letter('future') : 'B';
      await CH4.give('marsh', 'future', letter);
      await K.tween(0.8, kk => { room.orb.material.opacity = 0.95 * (1 - kk); room.orb.position.y = K.Y0 + 4.0 + kk * 2; });
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true; K.G.save();
    if (typeof MH_FUT !== 'undefined' && MH_FUT) MH_FUT.free();
    const O = OUT(), SP = typeof MH_FUT !== 'undefined' && MH_FUT ? MH_FUT.SPRING : { x: 3.2, z: -335.0 };
    await K.leave({ slow: true, then: async () => { const G = K.G; G.cam.override = { pos: K.V(SP.x + 9.0, 5.4, SP.z + 9.0), look: K.V(SP.x, 0.0, SP.z) }; G.cam.snap(O.yaw, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      await K.wait(1.0);
      for (let j = 0; j < 6; j++) { G.w3d.fx.sparkle(SP.x + (Math.random() - 0.5) * 4, 0.2 + Math.random() * 0.8, SP.z + (Math.random() - 0.5) * 4, 6, ['#bfe4ff', '#fff3c8', '#7cc85a']); await K.wait(0.12); }
      const D = typeof MH_FUT !== 'undefined' && MH_FUT ? MH_FUT.who('lucero') : null;
      if (D) { await M.say(D, T().LINES['chapel.end']); M.frame2(D); await M.say(D, T().LINES['lucero.done']); }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Elio’s last words are free. Noa is waiting at the time crack on Candil’s south shore.', 5.5);
    G.save();
  }

  // ---------------------------------------------------------- E, floor by floor
  function interactables(room, api) {
    const s = st(), out = [], i = room.i;
    if (room.lucero) out.push({ x: room.lucero.api.x - 0.6, z: room.lucero.api.z - 0.6, r: 1.4, label: 'Talk', run: () => (i === 0 && !s.r0 ? naveTask(room) : i === 2 && !s.r2 ? fearTask(room) : sayLucero(room, s.boss ? 'chapel.end' : 'chapel.in')) });
    const look = (x, z, id, line) => out.push({ x, z, r: 1.2, label: 'Look', run: async () => M.lookAt(id, line, 5.5) });
    if (room.intro) return out;          // (a floor's first moments: Lucero's demonstration, the ambush, before anything to do)
    if (i === 0) {
      look(room.pew.x, room.pew.z + 1.0, 'w.mhf_hymnbook', 'A {w.mhf_hymnbook} left open on a {w.lp_bench}: stone pages, stone words. The {w.mhf_hymn} for evening, a little worn.');
      look(room.R.x + 0.6, room.R.z - HD + 1.6, 'w.mhf_candlestick', 'A {w.mhf_candlestick} with three {w.candle:pl}, stone to the wick. If they were wax, they’d melt…');
      look(room.R.x - 2.6, room.R.z - HD + 1.6, 'w.mhf_pulpit', 'The {w.mhf_pulpit} at the end of the {w.mhf_nave}, as if carved in {w.mhf_marble}. It was wood, once.');
      if (s.r0 && !s.door) out.push({ x: room.doorAt.x + 1.0, z: room.doorAt.z + 1.0, r: 1.6, label: 'Imagine', run: () => doorTask(room) });
    }
    if (i === 1) {
      look(room.R.x + 3.4, room.R.z - 0.8, 'w.mhf_lectern', 'A {w.mhf_lectern} on a stone {w.mhf_pedestal}, the {w.mhf_hymnbook} still open on it, at the {w.mhf_refrain}.');
      look(room.R.x - 4.8, room.R.z - 0.6, 'w.qr_choir', 'The {w.qr_choir}: every singer a {w.rup_statue}, every {w.lp_mouth} open in the middle of a {w.mhf_melody}.');
      if (!s.r1) out.push({ x: room.choirAt.x, z: room.choirAt.z + 1.2, r: 1.8, label: 'Imagine', run: () => choirTask(room) });
    }
    if (i === 2) {
      look(room.rail.x, room.rail.z + 1.0, 'w.pkf_railing', 'The stair’s {w.pkf_railing}, stone. A bell {w.rope} hangs down the middle, stiff as a stick.');
      look(room.R.x + 5.0, room.R.z - HD + 1.2, 'w.mhf_sacristy', 'The {w.mhf_sacristy}’s little door, {w.mhf_granite} now. Behind it, Lucero says, they kept the {w.candle:pl} and the {w.mhf_hymnbook:pl}.');
      if (s.r2 && !s.slab) out.push({ x: room.slabAt.x + 1.4, z: room.slabAt.z + 1.2, r: 1.7, label: 'Imagine', run: () => slabTask(room) });
    }
    if (i === 3) {
      look(room.R.x + 5.0, room.R.z - HD + 1.2, 'w.pkp_weathervane', 'Through the arch: the whole marsh, stone, and on the chapel’s roof a {w.pkp_weathervane} that hasn’t turned in years.');
      look(room.R.x - 3.4, room.R.z + 0.4, 'w.mhf_ringing', 'The stone bell’s {w.pkf_clapper} hangs still. Its {w.mhf_ringing} used to reach the far shore of the {w.lf_lake}.');
      if (!s.boss) out.push({ x: room.bellAt.x, z: room.bellAt.z + 2.6, r: 2.2, label: 'Face the gargoyle', run: () => bossScene(room) });
      else if (!s.done3) out.push({ x: room.bellAt.x, z: room.bellAt.z + 2.6, r: 2.2, label: 'Go down', run: finale });
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!s.r0) return { x: room.lucero.api.x, z: room.lucero.api.z, hint: '{mimo} looks at Lucero: she has a question.' }; if (!s.door) return { x: room.doorAt.x, z: room.doorAt.z, hint: '{mimo} knocks on the stone door. Nothing… yet.' }; }
    if (i === 1 && !s.r1) return { x: room.choirAt.x, z: room.choirAt.z, hint: '{mimo} looks at the stone singers, their mouths open.' };
    if (i === 2) { if (!s.r2) return { x: room.lucero.api.x, z: room.lucero.api.z, hint: '{mimo} looks at Lucero. She’s afraid.' }; if (!s.slab) return { x: room.slabAt.x, z: room.slabAt.z, hint: '{mimo} pushes at the stone slab. Too heavy… as stone.' }; }
    if (i === 3 && !s.boss) return { x: room.bellAt.x, z: room.bellAt.z, hint: '{mimo} stares up at the gargoyle on the stone bell.' };
    return null;
  }
  // (while a floor's first moments play, its tasks wait: room.intro; teach before ask)
  async function onFirst(room) { room.intro = true; try { return await onFirst0(room); } finally { room.intro = false; } }
  async function onFirst0(room) {
    const i = room.i, s = st();
    if (i === 0) {
      await K.wait(0.8); await sayLucero(room, 'chapel.in');
      if (!s.mifCard) { await M.card(T().CARDS.mif, true); s.mifCard = true; K.G.save(); }
      await K.wait(0.3); await demoLucero(room, 'd.r0');
      M.think('{lucero} has a question for you. Talk to her.', 4.5);
      return true;
    }
    if (i === 1 && !s.ambush) {
      await K.wait(1.0);
      await M.you('Shadows of stone come off the choir stalls! A fight, in the Future: tell {mimo} its plans.');
      const r = await TIME.fight({ foes: [{ kind: 'beetle', color: 'white', size: 'small' }, { kind: 'bat', color: 'white', size: 'small' }], place: { x: -45, z: -372, biome: 'stonewood' } });
      if (!r || r.outcome !== 'win') return false;
      s.ambush = true; K.G.save();
    }
    if (i === 1) { await K.wait(0.6); await demoLucero(room, 'd.r1'); M.think('The stone singers. If they sang… what would happen?', 5); }
    if (i === 2) { await K.wait(0.8); await sayLucero(room, 'chapel.r2in'); M.think('{lucero} is afraid. Answer her with a what-if.', 4.5); }
    if (i === 3) M.think('A gargoyle of stone, crouched on the stone bell. Face it.', 4.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.lucero) {
      K.animate(room.lucero, dt, t);
      const a = room.lucero.api; room.light.position.set(a.x + 0.35, K.Y0 + 1.25 + Math.sin(t * 2) * 0.03, a.z + 0.2); room.light.material.opacity = 0.5 + 0.08 * Math.sin(t * 5);
    }
    if (room.garg && room.garg.root.visible) { room.garg.root.rotation.y = 0.2 + Math.sin(t * 0.4) * 0.15; if (room.garg.tail) room.garg.tail.rotation.y = Math.sin(t * 1.1) * 0.2; }
  }
  // the chapel's own look: tomorrow's gray, a little color back for each floor done (the Future's sky stays as it is)
  function late(dt) {
    const s = st(), n = ['done0', 'done1', 'done2', 'done3'].filter(k0 => s[k0]).length;
    if (TIME.look) TIME.look.apply('future', dt, Math.min(1, 0.3 + n * 0.12));
  }
  const MOD = MOLMILL.make({
    name: 'marsh-future-chapel', ROOMS: X.map((x, i) => ({ x, z: Z, get name() { return T().ROOMS[i].name; }, get sub() { return T().ROOMS[i].sub; } })),
    get OUTSIDE() { return OUT(); }, state: st,
    tint: { planks: ['#8d8a84', '#85827c', '#939089'], joint: '#5f5c56', wall: '#a8a49c', wall2: '#9c988f', skirt: '#7d7a74', skirt2: '#75726c', trim: '#5f5c56', window: '#c8ccd4', beam: '#6f6c66', puff: '#b8b4ac', stones: true },
    interior: { fog: '#8a8a90', near: 16, far: 52 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('mh_future_chapel') ? 'mh_future_chapel' : null),
  });
  // (the kit names its ways for the mill: here they're the chapel's; a climb waits for a «Task complete» stamp to finish)
  const stampUp = () => { const e = document.getElementById('qstamp'); return !!(e && e.classList.contains('on')); };
  const afterStamp = run => async () => { for (let i = 0; i < 25 && stampUp(); i++) await STORY.wait(0.2); return run(); };
  const ints0 = MOD.interactables;
  MOD.interactables = () => ints0().map(it => (it.label === 'Leave the mill' ? Object.assign({}, it, { label: 'Go out' }) : it.label === 'Climb' ? Object.assign({}, it, { run: afterStamp(it.run) }) : it));
  return Object.assign(MOD, { finale });
})();
