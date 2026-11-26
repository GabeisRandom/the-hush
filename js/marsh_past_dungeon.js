'use strict';
// The Lantern House long ago (game/TIME.md §25 "The Gray Marsh (T4c)"): four floors at y 300, z −334, x −326 / −300 / −274 / −248, on
// MOLMILL's room kit (molinar_past_mill.js), reskinned here as the lamplighters' round tower in Candil (stone walls in courses, warm
// plank floors, the kit's trapdoors and ladders going up; the kit itself is untouched). The morning after Lantern Night the gray is in
// here too, drinking the light. Little Marisol follows you up; on each floor you tell what happened there, with every past in its
// place, then tell {mimo} what it did, as a memory.
//   0 the Oil Store: barrels, oil cans, a funnel, rags; wet footprints up the steps: «Mientras la niebla entraba, él subió la
//     escalera» (the imperfect going on, the preterite cutting in); a barrel rolled across the ladder's foot: «{mimo} empujó el barril»
//   1 the Wick Room: a moth ambush (the Past's tense), then a page from his notebook: «Escribió que había aprendido a encender la luz»
//     (passed on, stepped back); a knot of fog on the hatch: «{mimo} sopló la niebla»
//   2 the Lens Gallery: the great mirror lens, gray: «Antes, la lente brillaba toda la noche» (the imperfect of every night); «{mimo}
//     iluminó la lente»: a little light comes back, and the way up opens
//   3 the Lantern Room: the great lantern under its iron dome, and round it the Lantern Moth (marsh_time_boss.js); Elio's echo; the
//     great lantern lit again; outside, the old lamplighter
const MH_PHOUSE = (() => {
  if (typeof MOLMILL === 'undefined' || typeof MARSHT === 'undefined' || !MARSHT) return null;
  const M = MARSHT, T = () => MHPTXT, X = [-326, -300, -274, -248], Z = -334;
  const HW = MOLMILL.HW, HD = MOLMILL.HD, WH = MOLMILL.WH;
  const st = () => { const s = M.st('past'); return s.house || (s.house = {}); };
  const pS = () => M.st('past');
  const lang = () => M.lang();
  const marisolLook = { kid: true, skin: '#c98e62', hair: '#5a3020', hairdo: 'braids', dress: '#f2c94c', apron: '#f2e6c9', h: 0.62 };
  const nm = id => M.nameOf(T().CAST[id]);
  const ln = key => T().LINES[key];
  let K = null;
  const OUT = () => { const D = typeof MH_PAST !== 'undefined' && MH_PAST ? MH_PAST.DOORSPOT : { x: -11.9, z: -331.3 }; return { x: D.x, z: D.z + 0.2, yaw: 0.6 }; };

  // ---------------------------------------------------------- the floors' look: stone in courses, a stone band, little oil-lamp niches
  function shellUp(room, api, k, top) {
    for (const m of room.g.children.slice()) {
      if (!m.isMesh || !m.geometry) continue;
      const ty = m.geometry.type, p = m.geometry.parameters || {};
      if (top && ty === 'PlaneGeometry' && Math.abs(p.width - 1.3) < 0.01 && Math.abs(p.height - 1.5) < 0.01) m.visible = false;      // (the lantern room: its own windows all round)
    }
    const R = room.R, Y0 = api.Y0, KG = PAST.API.KG;
    for (let x = -HW + 1.5; x <= HW - 1.5; x += 3) k.box(R.x + x, Y0 + WH / 2, R.z - HD + 0.15, 0.4, WH, 0.2, '#b8a48a', { ink: 0.006 });
    k.box(R.x, Y0 + WH - 0.35, R.z - HD + 0.16, HW * 2, 0.26, 0.18, '#a8906a', { ink: 0.004 });
    for (const s of [-1, 1]) { const x = R.x + s * (HW - 0.3); k.box(x, Y0 + 2.2, R.z - 1.0, 0.3, 0.5, 0.5, '#3a3036', { ink: 0.004 }); k.add(KG.cyl, x, Y0 + 2.15, R.z - 1.0, 0.08, 0.16, 0.08, '#c9a24a', { ink: 0 }); }
  }
  // the lantern room's windows: the lake all round (a painted view), morning light
  let VIEW = null;
  function viewTex() {
    if (VIEW) return VIEW;
    VIEW = TK.canvasTex(512, 256, c => {
      const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#9fd0ea'); g.addColorStop(0.55, '#f2ead6'); g.addColorStop(1, '#e8dcc0'); c.fillStyle = g; c.fillRect(0, 0, 512, 256);
      c.fillStyle = '#6fb0c4'; c.fillRect(0, 150, 512, 106);
      c.fillStyle = '#5f9a46'; c.beginPath(); c.moveTo(0, 150); for (let x = 0; x <= 512; x += 32) c.lineTo(x, 136 + Math.sin(x * 0.03) * 8); c.lineTo(512, 150); c.fill();
      c.fillStyle = '#7a7484'; c.fillRect(392, 46, 26, 96); c.fillStyle = '#5e5873'; c.beginPath(); c.moveTo(386, 48); c.lineTo(405, 18); c.lineTo(424, 48); c.fill();
      c.fillStyle = 'rgba(150,148,166,0.55)'; for (let i = 0; i < 10; i++) { c.beginPath(); c.ellipse(250 + i * 15, 150 - i * 10, 22, 9, 0, 0, TAU); c.fill(); }
      const LC = ['#f2c94c', '#e2574c', '#4c7fd8', '#5fae4f']; for (let i = 0; i < 9; i++) { c.fillStyle = LC[i % 4]; c.fillRect(40 + i * 48, 190 + (i % 3) * 14, 8, 8); }
    });
    return VIEW;
  }
  // a material that drains to gray (the moth's dust on everything up top) and fills back
  function grayMat(start = 1) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad }), u = { uGray: { value: start } };
    m.onBeforeCompile = sh => { sh.uniforms.uGray = u.uGray; sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.86, l * 0.92), uGray); }'); };
    m.customProgramCacheKey = () => 'mhPRoomGray';
    return { m, u };
  }
  // a memory for {mimo} (the first time, the Past's card about memories, from Chapter 2)
  async function memory(kind) {
    const s = st();
    if (!s.memCard && typeof PAST_SC !== 'undefined' && PAST_SC._ && PAST_SC._.card) { s.memCard = true; try { await PAST_SC._.card('memory'); } catch (e) { /* */ } }
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const task = M.memTask(T().MEM[kind]); if (!task) return null;
    const r = await M.ask(task, { icon: kind === 'barrel' ? 'push' : kind === 'blow' ? 'blow' : 'light' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('mp.mem.' + kind, r.letter); }
    return r;
  }
  const floorsUp = i => { const p = pS(); p.floors = Math.max(p.floors || 0, Math.min(3, i + 1)); };
  // a little fog that lies on a floor (puffs in one draw call), thinned as the light comes back
  function fogPatch(room, x, z, n, rr, h) {
    const list = [], R = rng(Math.round(x * 7 + z * 3));
    for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()) * rr; list.push({ x: x + Math.cos(a) * d, y: K.Y0 + 0.2 + R() * h, z: z + Math.sin(a) * d, s: 1.6 + R() * 1.8, ph: R() * 9 }); }
    if (!MARSH.puffs) return null;
    const g = new THREE.Group(); room.g.add(g);
    return MARSH.puffs(g, list, { color: '#a8a6b4', opacity: 0.55 });
  }

  // ---------------------------------------------------------- the rooms
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, i = room.i;
    shellUp(room, api, k, i === 3);
    room.marisol = api.person(room, marisolLook, i === 3 ? { x: R.x + 4.8, z: R.z + 3.4, yaw: -2.6 } : { x: R.x + 3.8, z: R.z + 3.4, yaw: -2.4 }, nm('marisol'));
    const up = room.up || { x: R.x - 4.6, z: R.z - 3.6 };
    if (i === 0) {
      // the oil store: barrels along the back, oil cans, a funnel, rags; wet footprints up three stone steps to the ladder's corner
      for (let j = 0; j < 4; j++) k.add(KG.cyl, R.x + 1.0 + j * 1.3, Y0 + 0.55, R.z - HD + 0.9, 0.5, 1.1, 0.5, j % 2 ? '#8a5f3e' : '#7a5034', { ink: 0.012 }).add(KG.cyl, R.x + 1.0 + j * 1.3, Y0 + 0.55, R.z - HD + 0.9, 0.52, 0.08, 0.52, '#3a3036', { ink: 0 });
      for (let j = 0; j < 3; j++) k.box(R.x + 5.4, Y0 + 0.3, R.z - 1.0 + j * 0.7, 0.42, 0.6, 0.32, '#5a6a7a', { ink: 0.008 });
      k.add(KG.cone, R.x + 5.4, Y0 + 0.75, R.z - 1.7, 0.2, -0.3, 0.2, '#9aa4ae', { ink: 0.004 });
      for (let j = 0; j < 3; j++) k.box(R.x - 1.2 + j * 0.5, Y0 + 0.03, R.z + 2.6 + (j % 2) * 0.3, 0.5, 0.04, 0.4, ['#c9b48e', '#a8906a', '#e8dcc4'][j], { ry: j, ink: 0 });
      for (let j = 0; j < 3; j++) k.box(up.x + 1.8, Y0 + 0.1 + j * 0.2, up.z + 2.2 - j * 0.5, 1.6, 0.2, 0.5, j % 2 ? '#a8906a' : '#b8a48a', { ink: 0.006 });
      for (let j = 0; j < 7; j++) { const t = j / 6, x = lerp(R.x + 1.4, up.x + 0.8, t), z = lerp(R.z + 4.4, up.z + 1.4, t) + (j % 2 ? 0.22 : -0.22); k.add(KG.sphere, x, Y0 + 0.05 + (t > 0.6 ? 0.2 : 0), z, 0.11, 0.02, 0.19, '#4a5a66', { ry: Math.atan2(up.x - R.x, up.z - R.z), ink: 0 }); }
      room.prints = { x: R.x + 1.2, z: R.z + 3.0 };
      room.barrelAt = { x: up.x + 1.2, z: up.z + 1.6 };
      room.barrel = new THREE.Group(); room.barrel.position.set(room.barrelAt.x, Y0, room.barrelAt.z); room.g.add(room.barrel);
      const kb = PAST.API.Kit(); kb.add(KG.cyl, 0, 0.5, 0, 0.5, 1.0, 0.5, '#8a5f3e', { rz: Math.PI / 2, ink: 0.012 }).add(KG.cyl, 0, 0.5, 0, 0.52, 0.08, 0.52, '#3a3036', { rz: Math.PI / 2, ink: 0 }); kb.build(room.barrel);
      room.barrelSolid = { x: room.barrelAt.x, z: room.barrelAt.z, r: 0.85 }; WORLD.extra.push(room.barrelSolid);
      room.fog = fogPatch(room, R.x - 1.0, R.z + 1.0, 22, 4.0, 0.6);
    }
    if (i === 1) {
      // the wick room: a workbench with cotton, string and wicks hanging to dry; his notebook's page on the bench; fog on the hatch
      k.box(R.x + 1.6, Y0 + 0.85, R.z - HD + 1.0, 4.4, 0.12, 1.0, '#8a6440', { ink: 0.012 });
      for (const s of [-1, 1]) for (const dz of [-0.4, 0.4]) k.box(R.x + 1.6 + s * 2.0, Y0 + 0.42, R.z - HD + 1.0 + dz, 0.1, 0.84, 0.1, '#5a3a24', { ink: 0 });
      for (let j = 0; j < 9; j++) k.rod([R.x - 1.4 + j * 0.6, Y0 + 3.0, R.z - HD + 0.4], [R.x - 1.4 + j * 0.6, Y0 + 2.2, R.z - HD + 0.4], 0.025, '#f2ead8', 0);
      k.rod([R.x - 1.8, Y0 + 3.0, R.z - HD + 0.4], [R.x + 4.0, Y0 + 3.0, R.z - HD + 0.4], 0.02, '#c9b48e', 0);
      k.add(KG.sphere, R.x + 0.4, Y0 + 1.0, R.z - HD + 1.0, 0.3, 0.18, 0.24, '#f4f0e6', { ink: 0.004 }).add(KG.cyl, R.x + 2.8, Y0 + 1.0, R.z - HD + 1.0, 0.16, 0.18, 0.16, '#c9b48e', { ink: 0.004 });
      room.page = { x: R.x + 1.6, z: R.z - HD + 1.0 };
      k.box(room.page.x, Y0 + 0.93, room.page.z, 0.36, 0.02, 0.48, '#f4efe2', { ry: 0.2, ink: 0.004 });
      room.fogUp = { x: up.x + 0.4, z: up.z + 0.9 };
      room.fog = fogPatch(room, up.x + 0.4, up.z + 0.4, 18, 1.6, 2.0);
    }
    if (i === 2) {
      // the lens gallery: the great mirror lens on its stand in the middle, a balcony door to the lake, cloths on the sill
      room.lensAt = { x: R.x - 0.4, z: R.z - 1.0 };
      room.lens = new THREE.Group(); room.lens.position.set(room.lensAt.x, Y0, room.lensAt.z); room.g.add(room.lens);
      room.gm = grayMat(1);
      const kl = PAST.API.Kit(); kl.add(KG.cyl, 0, 0.6, 0, 0.5, 1.2, 0.5, '#8a6440', { ink: 0.012 }).add(KG.torus, 0, 2.0, 0, 1.0, 1.0, 0.1, '#c9a24a', { ink: 0.01 }).add(KG.cyl, 0, 2.0, 0, 0.95, 0.12, 0.95, '#cfe8f0', { rx: Math.PI / 2, ink: 0.004 });
      kl.build(room.lens, { mat: room.gm.m });
      room.lensSolid = { x: room.lensAt.x, z: room.lensAt.z, r: 0.9 }; WORLD.extra.push(room.lensSolid);
      room.beam = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffe9a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); room.beam.scale.setScalar(3.2); room.beam.position.set(room.lensAt.x, Y0 + 2.0, room.lensAt.z + 0.1); room.g.add(room.beam);
      k.box(R.x + 3.6, Y0 + 1.75, R.z - HD + 0.3, 2.6, 0.14, 0.5, '#b8a48a', { ink: 0.008 });
      for (let j = 0; j < 3; j++) k.box(R.x + 2.8 + j * 0.6, Y0 + 1.86, R.z - HD + 0.3, 0.46, 0.06, 0.36, ['#e8dcc4', '#c9453a', '#f4efe2'][j], { ink: 0 });
      room.fog = fogPatch(room, room.lensAt.x, room.lensAt.z, 20, 2.4, 2.2);
    }
    if (i === 3) {
      // the lantern room: windows all round (the lake in them), the great lantern on its pedestal in the middle, soot on the panes
      for (const [dx, dz, ry, w] of [[0, -HD + 0.04, 0, 12.6], [-HW + 0.04, 0, Math.PI / 2, 10.6], [HW - 0.04, 0, -Math.PI / 2, 10.6]]) { const v = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.2), new THREE.MeshBasicMaterial({ map: viewTex() })); v.position.set(R.x + dx, Y0 + 2.6, R.z + dz); v.rotation.y = ry; room.g.add(v); }
      room.lampAt = { x: R.x, z: R.z - 1.4 };
      room.gm = grayMat(1);
      room.lamp = new THREE.Group(); room.lamp.position.set(room.lampAt.x, Y0, room.lampAt.z); room.g.add(room.lamp);
      const kl = PAST.API.Kit(); kl.add(KG.cyl, 0, 0.5, 0, 0.9, 1.0, 0.9, '#b8a48a', { ink: 0.012 });
      for (let j = 0; j < 8; j++) { const a = j / 8 * TAU; kl.add(KG.cyl6, Math.sin(a) * 0.8, 1.9, Math.cos(a) * 0.8, 0.05, 1.8, 0.05, '#3a3036', { ink: 0 }); }
      kl.add(KG.cyl, 0, 1.9, 0, 0.76, 1.7, 0.76, '#e8dcc0', { ink: 0.006 }).add(KG.cone, 0, 3.1, 0, 1.0, 0.7, 1.0, '#3a3036', { ink: 0.014 });
      kl.build(room.lamp, { mat: room.gm.m });
      room.lampSolid = { x: room.lampAt.x, z: room.lampAt.z, r: 1.1 }; WORLD.extra.push(room.lampSolid);
      room.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd77a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); room.glow.scale.setScalar(5.5); room.glow.position.set(room.lampAt.x, Y0 + 1.9, room.lampAt.z); room.g.add(room.glow);
      // the moth, folded round the lantern (the fight builds its own; this one only waits)
      room.moth = new THREE.Group(); room.moth.position.set(room.lampAt.x, Y0 + 2.4, room.lampAt.z + 0.85); room.g.add(room.moth);
      const km = PAST.API.Kit(); km.add(KG.sphere, 0, 0, 0, 0.32, 0.5, 0.32, '#9a968e', { ink: 0.01 });
      for (const s of [-1, 1]) km.add(KG.sphere, s * 0.8, 0.2, -0.1, 0.9, 0.7, 0.08, '#8a8680', { rz: s * 0.4, ink: 0.01 }).add(KG.sphere, s * 0.6, -0.4, -0.1, 0.55, 0.45, 0.07, '#7d7a74', { rz: s * 0.7, ink: 0.008 });
      km.build(room.moth, { mat: room.gm.m });
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3c8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); room.orb.scale.setScalar(1.0); room.orb.position.set(room.lampAt.x, Y0 + 2.4, room.lampAt.z + 0.8); room.g.add(room.orb);
      room.fog = fogPatch(room, R.x, R.z, 26, 5, 2.6);
    }
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.barrel) { r0.barrel.position.x = r0.barrelAt.x + 2.4; r0.barrel.position.z = r0.barrelAt.z + 0.8; r0.barrelSolid.x = r0.barrelAt.x + 2.4; r0.barrelSolid.z = r0.barrelAt.z + 0.8; }
    if (s.blow && r1.fog && r1.fog.pts) r1.fog.pts.visible = false;
    if (s.lens) { r2.gm.u.uGray.value = 0; r2.beam.material.opacity = 0.6; if (r2.fog && r2.fog.pts) r2.fog.pts.visible = false; }
    if (s.boss) { r3.gm.u.uGray.value = 0; r3.moth.visible = false; r3.glow.material.opacity = 0.85; if (r3.fog && r3.fog.pts) r3.fog.pts.visible = false; }
  }

  // ---------------------------------------------------------- the floors' deeds
  async function demoMarisol(room, key) { const P = room.marisol; if (!P) return; M.lock(true); try { M.frame2(P.api, -1); await M.demo(P.api, T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
  async function sayMarisol(room, key) { const P = room.marisol; if (!P) return; M.lock(true); try { M.frame2(P.api, -1); await M.say(P.api, ln(key)); } finally { M.lock(false); } }
  async function tell(room, taskKey) {
    const r = await M.ask(T().TASKS[taskKey], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('Little {marisol} is waiting. What happened here?', 4); return null; }
    TIME.grade('mp.house.' + taskKey, r.letter); return r;
  }
  async function printsTask(room) {
    const s = st(); const r = await tell(room, 'r0'); if (!r) return;
    s.r0 = true; K.G.save(); await sayMarisol(room, 'house.r0done');
    M.think(`An oil barrel has rolled across the ladder’s foot. Tell {mimo} what it did, as a memory: ${M.sx('mem')}.`, 6);
  }
  async function barrelTask(room) {
    const s = st(); const r = await memory('barrel'); if (!r) return;
    const G = K.G, c = room.barrelAt;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: c.x - 1.2, z: c.z + 0.6 }, c); await K.wait(0.8); Sound.play('wood');
      await K.tween(0.9, kk => { room.barrel.position.x = c.x + kk * 2.4; room.barrel.position.z = c.z + kk * 0.8; room.barrel.rotation.y = kk * 2; });
      room.barrelSolid.x = c.x + 2.4; room.barrelSolid.z = c.z + 0.8; Sound.play('land', 6);
      s.barrel = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    floorsUp(0); await K.floorDone(0);
    M.think('The ladder’s free. Up, after his light.', 4);
  }
  async function pageTask(room) {
    const s = st(); const r = await tell(room, 'r1'); if (!r) return;
    s.r1 = true; K.G.save(); await sayMarisol(room, 'house.r1done');
    M.think('A knot of fog sits on the hatch. Tell {mimo} what it did, as a memory.', 5);
  }
  async function blowTask(room) {
    const s = st(); const r = await memory('blow'); if (!r) return;
    const G = K.G, c = room.fogUp;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: c.x + 1.0, z: c.z + 1.0 }, c); await K.wait(0.8);
      for (let j = 0; j < 4; j++) { Sound.play('swoosh'); G.w3d.fx.puff(c.x, K.Y0 + 1.6 + j * 0.3, c.z, 8, 0.3, '#c8c6d0'); await K.wait(0.25); }
      if (room.fog && room.fog.pts) room.fog.pts.visible = false;
      s.blow = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    floorsUp(1); await K.floorDone(1);
  }
  async function lensTask(room) {
    const s = st(); const r = await tell(room, 'r2'); if (!r) return;
    s.r2 = true; K.G.save();
    M.think('The lens is gray with fog. Tell {mimo} what it did, as a memory.', 5);
  }
  async function lightTask(room) {
    const s = st(); const r = await memory('lens'); if (!r) return;
    const G = K.G, c = room.lensAt;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: c.x + 1.2, z: c.z + 1.2 }, c); await K.wait(0.8); Sound.play('chime');
      await K.tween(1.2, kk => { room.gm.u.uGray.value = 1 - kk; room.beam.material.opacity = kk * 0.6; });
      if (room.fog && room.fog.pts) room.fog.pts.visible = false;
      G.w3d.fx.sparkle(c.x, K.Y0 + 2.0, c.z, 18, ['#fff3c8', '#ffd77a']);
      s.lens = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    await sayMarisol(room, 'house.r2done');
    floorsUp(2); await K.floorDone(2);
  }
  // the top: the Lantern Moth (the fight), Elio's echo, the great lantern lit again, then down and out to the old lamplighter
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.6, K.Y0 + 3.2, room.R.z + 3.8), K.V(room.lampAt.x, K.Y0 + 2.2, room.lampAt.z)); await K.wait(0.6); await sayMarisol(room, 'house.top'); } finally { M.lock(false); }
    const r = typeof MHBOSS !== 'undefined' ? await MHBOSS.fightMoth() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Tell it as a memory!' : 'The gray moth folds its wings round the lantern again.', 4); return; }
    s.boss = true;
    M.lock(true);
    try {
      room.moth.visible = false; G.w3d.fx.sparkle(room.lampAt.x, K.Y0 + 2.4, room.lampAt.z, 26, ['#f2c94c', '#e8a03a', '#fff3c8']); Sound.play('chime');
      await K.tween(1.2, kk => { room.gm.u.uGray.value = 1 - kk; room.glow.material.opacity = kk * 0.85; });
      if (room.fog && room.fog.pts) room.fog.pts.visible = false;
      await K.tween(1.4, kk => { room.orb.material.opacity = kk * 0.95; room.orb.position.y = K.Y0 + 2.4 + kk * 1.0; room.orb.scale.setScalar(1.0 + kk * 0.8); });
      await M.you('A young man’s voice, very quiet, as if from far away… the words he had written for Lantern Night.');
      const letter = typeof MHBOSS !== 'undefined' ? MHBOSS.letter('past') : 'B';
      await CH4.give('marsh', 'past', letter);
      await K.tween(0.8, kk => { room.orb.material.opacity = 0.95 * (1 - kk); room.orb.position.y = K.Y0 + 3.4 + kk * 2; });
      await sayMarisol(room, 'house.end');
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true; K.G.save();
    const O = OUT();
    await K.leave({ slow: true, then: async () => { const G = K.G; G.cam.override = { pos: K.V(O.x + 4.0, 5.2, O.z + 7.0), look: K.V(MARSH.LANTERN.x, 10.0, MARSH.LANTERN.z) }; G.cam.snap(O.yaw, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      await K.wait(1.0);
      for (let j = 0; j < 6; j++) { G.w3d.fx.sparkle(MARSH.LANTERN.x + (Math.random() - 0.5) * 3, 11 + Math.random() * 1.5, MARSH.LANTERN.z, 6, ['#ffd77a', '#fff3c8']); await K.wait(0.12); }
      const D = typeof MH_PAST !== 'undefined' && MH_PAST ? MH_PAST.who('luz') : null;
      if (D) { M.frame2(D); await M.say(D, T().LINES['luz.done']); }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Elio’s words are free. Noa is waiting at the time crack on Candil’s south shore.', 5.5);
    G.save();
  }

  // ---------------------------------------------------------- E, floor by floor
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().MEM[kind].model || {})[lang()] || '', lang()))}»` : `Tell ${name}`);
    if (room.marisol) out.push({ x: room.marisol.api.x - 0.6, z: room.marisol.api.z - 0.6, r: 1.4, label: 'Talk', run: () => sayMarisol(room, s.boss ? 'house.end' : 'house.in') });
    const look = (x, z, id, line) => out.push({ x, z, r: 1.2, label: 'Look', run: async () => M.lookAt(id, line, 5.5) });
    if (room.intro) return out;          // (a floor's first moments: Marisol's demonstration, the ambush, before anything to do)
    if (i === 0) {
      look(room.R.x + 2.6, room.R.z - HD + 1.8, 'w.pkp_barrel', 'Barrels of {w.ml_oil} along the wall, a {w.mhp_funnel}, a pile of {w.mhp_rag:pl}. Every lamp in Candil drinks from here.');
      look(room.R.x + 5.4, room.R.z - 0.2, 'w.mhp_oilcan', 'A row of {w.mhp_oilcan:pl}, all filled for {w.mhp_lanternnight}. One is missing.');
      if (!s.r0) out.push({ x: room.prints.x, z: room.prints.z, r: 1.8, label: 'Tell', run: () => printsTask(room) });
      else if (!s.barrel) out.push({ x: room.barrelAt.x + 1.0, z: room.barrelAt.z + 1.4, r: 1.6, label: sayQ('barrel'), run: () => barrelTask(room) });
    }
    if (i === 1) {
      look(room.R.x - 0.4, room.R.z - HD + 1.6, 'w.mhp_workshop', 'The lamplighters’ {w.mhp_workshop}: {w.mhp_cotton}, a ball of {w.mhp_string}, a new {w.pkp_wick} for every lamp, hanging up to dry.');
      if (!s.r1) out.push({ x: room.page.x, z: room.page.z + 1.4, r: 1.6, label: 'Read', run: () => pageTask(room) });
      else if (!s.blow) out.push({ x: room.fogUp.x + 1.2, z: room.fogUp.z + 1.2, r: 1.6, label: sayQ('blow'), run: () => blowTask(room) });
    }
    if (i === 2) {
      look(room.R.x + 3.6, room.R.z - HD + 1.4, 'w.mhp_sill', 'On the {w.mhp_sill}: soft {w.mhp_cloth:pl} for polishing the lens. From the window, the {w.mhp_balcony} and the {w.lf_lake} below.');
      if (!s.r2) out.push({ x: room.lensAt.x, z: room.lensAt.z + 1.6, r: 1.6, label: 'Look', run: () => lensTask(room) });
      else if (!s.lens) out.push({ x: room.lensAt.x + 1.2, z: room.lensAt.z + 1.4, r: 1.6, label: sayQ('lens'), run: () => lightTask(room) });
    }
    if (i === 3) {
      look(room.R.x + 5.0, room.R.z - HD + 1.2, 'w.mhp_soot', '{w.mhp_soot} on the panes, and gray {w.mhp_mothdust} on everything. The {w.mhp_iron} frame is cold.');
      if (!s.boss) out.push({ x: room.lampAt.x, z: room.lampAt.z + 2.6, r: 2.2, label: 'Face the moth', run: () => bossScene(room) });
      else if (!s.done3) out.push({ x: room.lampAt.x, z: room.lampAt.z + 2.6, r: 2.2, label: 'Go down', run: finale });
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!s.r0) return { x: room.prints.x, z: room.prints.z, hint: '{mimo} sniffs the wet footprints.' }; if (!s.barrel) return { x: room.barrelAt.x, z: room.barrelAt.z, hint: '{mimo} pushes at the barrel. Too heavy… now.' }; }
    if (i === 1) { if (!s.r1) return { x: room.page.x, z: room.page.z, hint: '{mimo} points at a page on the workbench.' }; if (!s.blow) return { x: room.fogUp.x, z: room.fogUp.z, hint: '{mimo} looks at the fog on the hatch.' }; }
    if (i === 2) { if (!s.r2) return { x: room.lensAt.x, z: room.lensAt.z, hint: '{mimo} looks at the great lens, gray with fog.' }; if (!s.lens) return { x: room.lensAt.x, z: room.lensAt.z, hint: '{mimo} glows a little, looking at the lens.' }; }
    if (i === 3 && !s.boss) return { x: room.lampAt.x, z: room.lampAt.z, hint: '{mimo} stares at the gray wings folded round the lantern.' };
    return null;
  }
  // (while a floor's first moments play, its tasks wait: room.intro; teach before ask)
  async function onFirst(room) { room.intro = true; try { return await onFirst0(room); } finally { room.intro = false; } }
  async function onFirst0(room) {
    const i = room.i, s = st();
    if (i === 0) { await K.wait(0.8); await sayMarisol(room, 'house.in'); }
    if (i === 1 && !s.ambush) {
      await K.wait(1.0);
      await M.you('Gray moths come down off the drying wicks! In here it’s a memory: tell what {mimo} did.');
      const r = await TIME.fight({ foes: [{ kind: 'moth', color: 'blue', size: 'small' }, { kind: 'moth', color: 'yellow', size: 'small' }], place: { x: -14, z: -330, biome: 'lanternlake' } });
      if (!r || r.outcome !== 'win') return false;
      s.ambush = true; K.G.save();
    }
    const key = ['d.r0', 'd.r1', 'd.r2', null][i];
    if (key) { await K.wait(0.6); await demoMarisol(room, key); }
    if (i === 0) M.think(`Wet footprints on the steps. What happened while the fog was coming in? ${M.sx('story')}.`, 6);
    if (i === 1) M.think('Read his page, and pass on what he wrote.', 5);
    if (i === 2) M.think('The great lens. What did it use to do, every night?', 5);
    if (i === 3) M.think('Something gray is folded round the great lantern. Face it.', 4.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.marisol) K.animate(room.marisol, dt, t);
    if (room.beam && room.beam.material.opacity > 0.05) room.beam.material.opacity = 0.5 + 0.1 * Math.sin(t * 2);
    if (room.moth && room.moth.visible && !st().boss) { room.moth.rotation.y = Math.sin(t * 0.7) * 0.3; room.moth.children.forEach(c => { c.scale.x = 1 + Math.sin(t * 3) * 0.05; }); }
    if (room.glow && st().boss) room.glow.material.opacity = 0.75 + 0.1 * Math.sin(t * 6);
  }
  // the house's own look: the old photograph's sepia over the picture (the Past's sky dome stays hidden in here)
  function late() {
    const cv = document.getElementById('gl');
    if (cv && !document.body.classList.contains('in-battle')) cv.style.filter = 'sepia(0.3) saturate(1.12) hue-rotate(-6deg) contrast(1.03)';
    if (typeof PAST !== 'undefined' && PAST._ && PAST._.W && PAST._.W.sky) PAST._.W.sky.visible = false;
  }
  const MOD = MOLMILL.make({
    name: 'marsh-past-house', ROOMS: X.map((x, i) => ({ x, z: Z, get name() { return T().ROOMS[i].name; }, get sub() { return T().ROOMS[i].sub; } })),
    get OUTSIDE() { return OUT(); }, state: st,
    tint: { planks: ['#c99a64', '#bb8a55', '#c69560'], joint: '#7a5434', wall: '#d8ccb4', wall2: '#c9bca2', skirt: '#a8906a', skirt2: '#98805c', trim: '#6b4a30', window: '#d8f0f8', beam: '#5a3a24', puff: '#d8ccb4', stones: true },
    interior: { fog: '#b8ae9a', near: 18, far: 56 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('mh_past_house') ? 'mh_past_house' : null),
  });
  // (the kit names its ways for the mill: here they're the Lantern House's; a climb waits for a «Task complete» stamp to finish)
  const stampUp = () => { const e = document.getElementById('qstamp'); return !!(e && e.classList.contains('on')); };
  const afterStamp = run => async () => { for (let i = 0; i < 25 && stampUp(); i++) await STORY.wait(0.2); return run(); };
  const ints0 = MOD.interactables;
  MOD.interactables = () => ints0().map(it => (it.label === 'Leave the mill' ? Object.assign({}, it, { label: 'Go out' }) : it.label === 'Climb' ? Object.assign({}, it, { run: afterStamp(it.run) }) : it));
  return Object.assign(MOD, { finale });
})();
