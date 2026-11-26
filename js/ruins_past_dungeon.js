'use strict';
// The temple, the day it was first opened (DESIGN.md 20.1b "next, the Sunken Ruins"; game/TIME.md "The Sunken Ruins (T4b)"): four
// rooms at y 300, z 0, x −430 / −404 / −378 / −352, on MOLMILL's room kit (molinar_past_mill.js), reskinned here as the temple's
// sandstone halls (RUKIT below: walls of dressed stone in courses, a floor of flags, painted friezes; the kit's windows hidden). The
// kit's trapdoor and ladder are the dig's own ladders, going up through the temple to its roof. The kit itself is untouched.
// The quiet young man went in last night with his lamp. Young Elvira follows you and shows what's left in each hall (a demonstration);
// you work out what had happened before you came, then tell {mimo} what it did, as a memory.
//   0 the Hall of Steps: river mud over the floor, his footprints going in: «Alguien ya había entrado»; the trapdoor's rope is buried
//     in the mud: «{mimo} cavó en el barro»
//   1 the Painted Hall: a mud-worm ambush (the Past's tense), then his note: «Escribió que el loro repetía todo mal»; a fallen statue
//     under the trapdoor: «{mimo} empujó la estatua»
//   2 the Lamp Room: his lamp on the window's sill, still warm, the river below: «Había dejado su lámpara aquí»; a gap in the floor
//     between you and the trapdoor: «{mimo} saltó sobre las piedras»
//   3 the Roof Terrace, open to the sky: the Clay Parrot (ruins_time_boss.js), Elio's echo; outside, the professor
const RU_PTEMPLE = (() => {
  if (typeof MOLMILL === 'undefined' || typeof RUINT === 'undefined' || !RUINT) return null;
  const M = RUINT, T = () => RUPTXT, X = [-430, -404, -378, -352], Z = 0;
  const HW = MOLMILL.HW, HD = MOLMILL.HD, WH = MOLMILL.WH;
  const st = () => { const s = M.st('past'); return s.temple || (s.temple = {}); };
  const pS = () => M.st('past');
  const lang = () => M.lang();
  const elviraLook = { skin: '#c98e62', hair: '#3a2b26', hairdo: 'tails', dress: '#f2e3c4', vest: '#4c9a8a', hat: 'straw', hatColor: '#e8d9a8', h: 0.97 };
  const nm = id => M.nameOf(T().CAST[id]);
  let K = null;
  const OUT = { x: 142.0, z: -19.0, yaw: 0 };

  // ---------------------------------------------------------- the halls' look: dressed sandstone, friezes, the kit's windows hidden
  function stoneShell(room, api, k, roof) {
    for (const m of room.g.children.slice()) {
      if (!m.isMesh || !m.geometry) continue;
      const ty = m.geometry.type, p = m.geometry.parameters || {};
      if (ty === 'BoxGeometry') continue;
      if (ty === 'PlaneGeometry' && Math.abs(p.height - WH) < 0.01) { if (roof) m.visible = false; continue; }
      if (ty === 'PlaneGeometry' && Math.abs(p.width - 2.2) < 0.01 && Math.abs(p.height - 1.2) < 0.01) continue;      // (the way out)
      m.visible = false;
    }
    const R = room.R, Y0 = api.Y0, KG = PAST.API.KG;
    if (roof) {
      // the roof terrace: a low parapet all round, the temple's carved birds on it, the sky and the green canyon beyond
      k.box(R.x, Y0 + 0.45, R.z - HD + 0.2, HW * 2, 0.9, 0.35, '#e3b07a', { ink: 0.012 });
      for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.18), Y0 + 0.45, R.z, 0.35, 0.9, HD * 2, '#e3b07a', { ink: 0.012 });
      for (let i = 0; i < 7; i++) k.add(KG.cyl, R.x - HW + 1 + i * 2, Y0 + 1.0, R.z - HD + 0.2, 0.2, 0.2, 0.2, '#d4a070', { ink: 0.004 });
      return;
    }
    // dressed stone pilasters up the walls, a carved band under the ceiling, little lamp niches
    for (let x = -HW + 1.5; x <= HW - 1.5; x += 3) k.box(R.x + x, Y0 + WH / 2, R.z - HD + 0.15, 0.5, WH, 0.24, '#d4a070', { ink: 0.006 });
    for (let z = -HD + 2; z <= HD - 2; z += 4) for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.12), Y0 + WH / 2, R.z + z, 0.24, WH, 0.5, '#d4a070', { ink: 0.006 });
    k.box(R.x, Y0 + WH - 0.35, R.z - HD + 0.18, HW * 2, 0.3, 0.2, '#c96f45', { ink: 0.004 });
    for (let i = 0; i < 5; i++) k.add(KG.sphere, R.x - 5 + i * 2.5, Y0 + WH - 0.35, R.z - HD + 0.3, 0.2, 0.14, 0.06, ['#5fae4f', '#4c7fd8', '#f2c94c'][i % 3], { ink: 0.002 });
  }
  // a wall painting on the back wall (a canvas): birds, people carrying jars to the river, a bell
  let PAINT = null;
  function paintTex() {
    if (PAINT) return PAINT;
    PAINT = TK.canvasTex(512, 200, c => {
      c.fillStyle = '#e8c690'; c.fillRect(0, 0, 512, 200);
      c.fillStyle = '#4c8fbf'; c.beginPath(); c.moveTo(0, 160); for (let x = 0; x <= 512; x += 16) c.lineTo(x, 160 + Math.sin(x * 0.05) * 6); c.lineTo(512, 200); c.lineTo(0, 200); c.fill();
      const person = (x, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, 80, 10, 0, TAU); c.fill(); c.fillRect(x - 9, 92, 18, 44); c.fillStyle = '#c96f45'; c.beginPath(); c.ellipse(x + 14, 98, 9, 12, 0, 0, TAU); c.fill(); };
      for (let i = 0; i < 5; i++) person(60 + i * 90, ['#7a4a2a', '#5a3a26', '#8a5a3a'][i % 3]);
      const bird = (x, y, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, 14, 9, -0.3, 0, TAU); c.fill(); c.fillStyle = '#f2c94c'; c.beginPath(); c.moveTo(x + 12, y - 4); c.lineTo(x + 22, y - 1); c.lineTo(x + 12, y + 2); c.fill(); };
      bird(120, 30, '#5fae4f'); bird(260, 22, '#c9433a'); bird(400, 34, '#4c7fd8');
      c.strokeStyle = '#7a4a2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(470, 30); c.quadraticCurveTo(452, 40, 452, 66); c.lineTo(488, 66); c.quadraticCurveTo(488, 40, 470, 30); c.stroke();
    });
    return PAINT;
  }
  // the roof terrace's backdrop: a blue sky, the red canyon walls, green below
  let SKY = null;
  function skyTex() {
    if (SKY) return SKY;
    SKY = TK.canvasTex(512, 256, c => {
      const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#8fd0f0'); g.addColorStop(0.6, '#e8f4f0'); g.addColorStop(1, '#f6e8c8'); c.fillStyle = g; c.fillRect(0, 0, 512, 256);
      c.fillStyle = '#c8643c'; c.beginPath(); c.moveTo(0, 256); c.lineTo(0, 90); c.lineTo(60, 70); c.lineTo(120, 110); c.lineTo(150, 170); c.lineTo(150, 256); c.fill();
      c.beginPath(); c.moveTo(512, 256); c.lineTo(512, 80); c.lineTo(440, 66); c.lineTo(390, 120); c.lineTo(370, 180); c.lineTo(370, 256); c.fill();
      c.fillStyle = '#5f9a46'; c.fillRect(0, 210, 512, 46); c.fillStyle = '#4c8fbf'; c.beginPath(); c.moveTo(200, 256); c.quadraticCurveTo(260, 215, 300, 256); c.fill();
      for (const [x, y] of [[180, 190], [330, 186], [250, 200]]) { c.fillStyle = '#8a6040'; c.fillRect(x - 3, y, 6, 30); c.fillStyle = '#4f9a45'; c.beginPath(); c.ellipse(x, y, 22, 8, 0, 0, TAU); c.fill(); }
    });
    return SKY;
  }
  // the room's things drawn on a shared material, so they can drain to gray (the parrot) and fill back
  function grayMat(start = 1) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad }), u = { uGray: { value: start } };
    m.onBeforeCompile = sh => { sh.uniforms.uGray = u.uGray; sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.86, l * 0.92), uGray); }'); };
    m.customProgramCacheKey = () => 'ruPRoomGray';
    return { m, u };
  }
  // a memory for {mimo} (the first time, the Past's card about memories, from Chapter 2)
  async function memory(kind) {
    const s = st();
    if (!s.memCard && typeof PAST_SC !== 'undefined' && PAST_SC._ && PAST_SC._.card) { s.memCard = true; try { await PAST_SC._.card('memory'); } catch (e) { /* */ } }
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const task = M.memTask(T().MEM[kind]); if (!task) return null;
    const r = await M.ask(task, { icon: kind === 'mud' ? 'dig' : kind === 'statue' ? 'push' : 'jump' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('rp.mem.' + kind, r.letter); }
    return r;
  }
  const floorsUp = i => { const p = pS(); p.floors = Math.max(p.floors || 0, Math.min(3, i + 1)); };

  // ---------------------------------------------------------- the rooms
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, i = room.i;
    stoneShell(room, api, k, i === 3);
    room.elvira = api.person(room, elviraLook, i === 3 ? { x: R.x + 4.6, z: R.z + 3.4, yaw: -2.6 } : { x: R.x + 3.8, z: R.z + 3.4, yaw: -2.4 }, nm('elvira'));
    const up = room.up || { x: R.x - 4.6, z: R.z - 3.6 };
    if (i === 0) {
      // river mud over the floor, a line of footprints to the trapdoor's corner, the rope's end buried in a heap of mud
      for (let j = 0; j < 7; j++) k.add(KG.sphere, R.x - 4 + j * 1.4, Y0 + 0.02, R.z + 1.2 - (j % 3) * 1.4, 1.3, 0.05, 0.9, '#6b5236', { ry: j, ink: 0 });
      room.prints = [];
      for (let j = 0; j < 8; j++) { const t = j / 7, x = lerp(R.x + 1.0, up.x + 0.6, t), z = lerp(R.z + 4.6, up.z + 1.2, t) + (j % 2 ? 0.25 : -0.25); k.add(KG.sphere, x, Y0 + 0.07, z, 0.12, 0.02, 0.2, '#3a2a20', { ry: Math.atan2(up.x - R.x, up.z - R.z), ink: 0 }); }
      room.heap = { x: up.x + 1.4, z: up.z + 1.6 };
      room.heapG = new THREE.Group(); room.g.add(room.heapG);
      const kh = PAST.API.Kit(); kh.add(KG.sphere, room.heap.x, Y0 + 0.1, room.heap.z, 1.0, 0.5, 0.8, '#6b5236', { ink: 0.01 }).add(KG.sphere, room.heap.x + 0.4, Y0 + 0.25, room.heap.z - 0.2, 0.5, 0.3, 0.4, '#7a5a3a', { ink: 0.006 }); kh.build(room.heapG);
      room.rope = new THREE.Group(); room.g.add(room.rope);
      const kr = PAST.API.Kit(); kr.rod([up.x + 0.2, Y0 + WH - 0.3, up.z], [room.heap.x - 0.3, Y0 + 0.3, room.heap.z], 0.04, '#c9b48e', 0.004); kr.build(room.rope); room.rope.visible = false;
      room.heapSolid = { x: room.heap.x, z: room.heap.z, r: 0.8 }; WORLD.extra.push(room.heapSolid);
      // a fallen beam, and the steps the room is named for (three, up to a ledge on the right)
      k.box(R.x + 2.4, Y0 + 0.2, R.z - 3.2, 3.6, 0.3, 0.34, '#8a5f3e', { ry: 0.5, ink: 0.008 });
      for (let j = 0; j < 3; j++) k.box(R.x + 5.4, Y0 + 0.15 + j * 0.3, R.z - 4.6 + j * 0.6, 2.2, 0.3, 0.6, j % 2 ? '#d4a070' : '#e3b98a', { ink: 0.008 });
    }
    if (i === 1) {
      // the painted wall, the young man's note pinned under it, a fallen statue under the trapdoor
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 3.5), new THREE.MeshToonMaterial({ map: paintTex(), gradientMap: TK.grad })); pm.position.set(R.x + 1.0, Y0 + 2.6, R.z - HD + 0.06); room.g.add(pm);
      room.note = { x: R.x + 1.2, z: R.z - HD + 0.6 };
      k.box(room.note.x, Y0 + 1.05, R.z - HD + 0.1, 0.42, 0.3, 0.02, '#f4efe2', { rz: 0.08, ink: 0.004 });
      room.statueAt = { x: up.x + 0.6, z: up.z + 1.4 };
      room.statue = new THREE.Group(); room.statue.position.set(room.statueAt.x, Y0, room.statueAt.z); room.g.add(room.statue);
      const ks = PAST.API.Kit(); ks.box(0, 0.32, 0, 1.6, 0.6, 0.6, '#c9a07a', { ry: 0.4, ink: 0.012 }).add(KG.sphere, 0.9, 0.38, 0.35, 0.3, 0.3, 0.3, '#c9a07a', { ink: 0.008 }).box(-0.4, 0.62, 0, 0.4, 0.2, 0.5, '#b8844e', { ry: 0.4, ink: 0.004 }); ks.build(room.statue);
      room.statueSolid = { x: room.statueAt.x, z: room.statueAt.z, r: 0.9 }; WORLD.extra.push(room.statueSolid);
      for (let j = 0; j < 4; j++) k.add(KG.sphere, R.x - 1 + j * 1.6, Y0 + 0.02, R.z + 2.0 - (j % 2), 0.9, 0.04, 0.6, '#6b5236', { ink: 0 });
    }
    if (i === 2) {
      // the window over the river (a painted view), his lamp on the sill, his seat, a gap in the floor with stones in it
      const view = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ map: skyTex() })); view.position.set(R.x + 2.6, Y0 + 2.6, R.z - HD + 0.05); room.g.add(view);
      k.box(R.x + 2.6, Y0 + 1.75, R.z - HD + 0.3, 2.8, 0.14, 0.5, '#d4a070', { ink: 0.008 });
      for (const s of [-1, 1]) k.box(R.x + 2.6 + s * 1.3, Y0 + 2.6, R.z - HD + 0.15, 0.2, 1.8, 0.3, '#c99a68', { ink: 0.004 });
      room.lampAt = { x: R.x + 2.2, z: R.z - HD + 0.4 };
      k.add(KG.cyl, room.lampAt.x, Y0 + 1.95, room.lampAt.z, 0.1, 0.24, 0.1, '#c9a24a', { ink: 0.004 });
      room.lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd27a', transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })); room.lampGlow.scale.setScalar(1.2); room.lampGlow.position.set(room.lampAt.x, Y0 + 2.1, room.lampAt.z); room.g.add(room.lampGlow);
      k.box(R.x + 2.8, Y0 + 0.25, R.z - HD + 1.3, 1.6, 0.5, 0.6, '#d4a070', { ink: 0.008 });
      room.gap = { x: up.x + 1.8, z: up.z + 2.2 };
      const pit = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), new THREE.MeshBasicMaterial({ color: '#1a1410' })); pit.rotation.x = -Math.PI / 2; pit.position.set(room.gap.x, Y0 + 0.015, room.gap.z); room.g.add(pit);
      for (let j = 0; j < 3; j++) k.add(KG.cyl, room.gap.x - 1.2 + j * 1.2, Y0 + 0.02, room.gap.z + (j % 2 ? 0.3 : -0.2), 0.35, 0.06, 0.3, '#b8b0a0', { ink: 0.006 });
      room.gapSolids = [{ x: room.gap.x - 0.9, z: room.gap.z, r: 0.95 }, { x: room.gap.x + 0.9, z: room.gap.z, r: 0.95 }]; WORLD.extra.push(...room.gapSolids);
    }
    if (i === 3) {
      // the roof terrace: the sky beyond, the parrot's perch with the gray clay parrot on it
      const bd = new THREE.Mesh(new THREE.PlaneGeometry(26, 13), new THREE.MeshBasicMaterial({ map: skyTex(), fog: false })); bd.position.set(R.x, Y0 + 4.0, R.z - HD - 5); room.g.add(bd);
      room.perch = { x: R.x, z: R.z - 2.6 };
      room.gm = grayMat(1);
      room.bird = new THREE.Group(); room.bird.position.set(room.perch.x, Y0, room.perch.z); room.g.add(room.bird);
      const kb = PAST.API.Kit(); kb.add(KG.cyl, 0, 0.6, 0, 0.6, 1.2, 0.6, '#d4a070', { ink: 0.012 });
      kb.add(KG.sphere, 0, 1.8, 0, 0.55, 0.7, 0.5, '#5fae4f', { ink: 0.012 }).add(KG.sphere, 0, 2.55, 0.1, 0.38, 0.36, 0.36, '#5fae4f', { ink: 0.01 }).add(KG.cone, 0, 2.5, 0.46, 0.12, 0.3, 0.14, '#f2c94c', { rx: Math.PI / 2 + 0.6, ink: 0.006 });
      for (const s of [-1, 1]) kb.add(KG.sphere, s * 0.5, 1.85, -0.05, 0.16, 0.5, 0.3, '#c9433a', { rz: s * 0.3, ink: 0.006 }).add(KG.ball6, s * 0.16, 2.62, 0.38, 0.06, 0.07, 0.04, '#2b2235', { ink: 0 });
      kb.add(KG.cone, 0, 1.3, -0.4, 0.2, 0.8, 0.12, '#4c7fd8', { rx: -0.6, ink: 0.006 });
      kb.build(room.bird, { mat: room.gm.m });
      room.birdSolid = { x: room.perch.x, z: room.perch.z, r: 0.9 }; WORLD.extra.push(room.birdSolid);
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3c8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); room.orb.scale.setScalar(1.0); room.orb.position.set(room.perch.x, Y0 + 2.2, room.perch.z); room.g.add(room.orb);
    }
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.mud) { r0.heapG.visible = false; r0.heapSolid.x = 1e5; r0.rope.visible = true; }
    if (s.statue) { r1.statue.position.x = r1.statueAt.x + 2.6; r1.statueSolid.x = r1.statueAt.x + 2.6; }
    if (s.stones) { r2.gapSolids.forEach(c => { c.x = 1e5; }); }
    if (s.boss) { r3.gm.u.uGray.value = 0; r3.birdSolid.x = 1e5; r3.bird.visible = false; }
  }

  // ---------------------------------------------------------- the rooms' deeds
  async function demoElvira(room, key) { const P = room.elvira; if (!P) return; M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
  async function tell(room, taskKey) {
    const r = await M.ask(T().TASKS[taskKey], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('Young {elvira} is waiting. What had happened here before you came?', 4); return null; }
    TIME.grade('rp.temple.' + taskKey, r.letter); return r;
  }
  async function stepsTask(room) {
    const s = st(); const r = await tell(room, 'r0'); if (!r) return;
    M.lock(true);
    try { const P = room.elvira; s.steps = true; K.G.save(); if (P) { M.frame2(P.api); await M.say(P.api, ln('elvira.r0done')); } } finally { M.lock(false); }
    M.think(`The trapdoor’s rope is buried in the mud. Tell {mimo} what it did, as a memory: ${M.sx('mem')}.`, 6);
  }
  async function mudTask(room) {
    const s = st(); const r = await memory('mud'); if (!r) return;
    const G = K.G, h = room.heap;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: h.x + 0.9, z: h.z + 0.9 }, h); await K.wait(0.8);
      for (let j = 0; j < 5; j++) { Sound.play('dig'); G.w3d.fx.puff(h.x, K.Y0 + 0.3, h.z, 6, 0.22, '#7a5a3a'); await K.wait(0.2); }
      room.heapG.visible = false; room.heapSolid.x = 1e5; room.rope.visible = true; Sound.play('chest'); s.mud = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    floorsUp(0); await K.floorDone(0);
    M.think('{mimo} pulls the rope free: the trapdoor drops open, and a ladder with it.', 4);
  }
  async function noteTask(room) {
    const s = st(); const r = await tell(room, 'r1'); if (!r) return;
    M.lock(true);
    try { const P = room.elvira; s.note = true; K.G.save(); if (P) { M.frame2(P.api); await M.say(P.api, ln('elvira.r1done')); } } finally { M.lock(false); }
    M.think('A fallen statue lies under the trapdoor. Tell {mimo} what it did, as a memory.', 5);
  }
  async function statueTask(room) {
    const s = st(); const r = await memory('statue'); if (!r) return;
    const G = K.G, c = room.statueAt;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: c.x - 1.2, z: c.z + 0.8 }, c); await K.wait(0.8); Sound.play('push');
      await K.tween(0.9, kk => { room.statue.position.x = c.x + kk * 2.6; }); room.statueSolid.x = c.x + 2.6; Sound.play('land', 6);
      s.statue = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    floorsUp(1); await K.floorDone(1);
  }
  async function lampTask(room) {
    const s = st(); const r = await tell(room, 'r2'); if (!r) return;
    M.lock(true);
    try { const P = room.elvira; s.lamp = true; K.G.save(); if (P) { M.frame2(P.api); await M.say(P.api, ln('elvira.r2done')); } } finally { M.lock(false); }
    M.think('The trapdoor is across a gap in the floor. Tell {mimo} what it did, as a memory.', 5);
  }
  async function stonesTask(room) {
    const s = st(); const r = await memory('stones'); if (!r) return;
    const G = K.G, gp = room.gap;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: gp.x - 2.6, z: gp.z + 1.2 }, gp); await K.wait(0.7);
      for (let j = 0; j < 3; j++) { Sound.play('jump'); await K.mimoArc({ x: gp.x - 1.2 + j * 1.2, z: gp.z }, K.Y0 + 0.1, 0.4); }
      Sound.play('click'); room.gapSolids.forEach(c => { c.x = 1e5; }); await K.wait(0.3); await K.mimoLand(); s.stones = true; G.save();
    } finally { M.lock(false); }
    floorsUp(2); await K.floorDone(2);
    M.think('{mimo} pulls the trapdoor’s rope from the other side. The last ladder goes up to the roof.', 5);
  }
  const ln = key => T().LINES[key] || ROOM_LINES[key];
  // (young Elvira's lines in the halls, after each thing is worked out)
  const L = M.L;
  const ROOM_LINES = {
    'elvira.in': L('So this is where he went with his lamp… Look at the floor: the river got in here too.', 'Así que aquí entró con su lámpara… Mira el suelo: el río también entró aquí.', 'Então foi aqui que ele entrou com a lamparina… Olha o chão: o rio também entrou aqui.',
      'Hier ist er also mit seiner Lampe hineingegangen … Schau auf den Boden: Der Fluss ist auch hier hereingekommen.', '[原来|yuán lái] [他|tā] [提|tí] [着|zhe] [灯|dēng] [进|jìn] [了|le] [这里|zhè lǐ] … [你|nǐ] [看|kàn] [地上|dì shang] ： [河水|hé shuǐ] [也|yě] [流|liú] [进来|jìn lai] [了|le] 。',
      'ランプ を [持|も]って 、 ここ に [入|はい]った ん だ … [床|ゆか] を [見|み]て 。 [川|かわ] の [水|みず] も ここ まで [来|き]た の ね 。'),
    'elvira.r0done': L('Yes. He had come in before us, and he had gone up. Let’s follow him.', 'Sí. Él había entrado antes que nosotros, y había subido. Vamos tras él.', 'Isso. Ele tinha entrado antes da gente, e tinha subido. Vamos atrás dele.',
      'Ja. Er war vor uns hereingekommen, und er war hinaufgestiegen. Gehen wir ihm nach.', '[对|duì] 。 [他|tā] [比|bǐ] [我们|wǒ men] [先|xiān] [进来|jìn lai] ， [还|hái] [爬|pá] [上去|shàng qu] [了|le] 。 [我们|wǒ men] [跟|gēn] [上|shàng] [去|qù] 。',
      'そう 。 [彼|かれ] は わたし たち より [先|さき] に [入|はい]って 、 [上|うえ] に [行|い]って いた 。 [追|お]いかけよう 。'),
    'elvira.r1done': L('A parrot that repeats everything wrong… He never said a word to us, but he wrote this down. He must have heard it.', 'Un loro que lo repite todo mal… A nosotros nunca nos dijo ni una palabra, pero esto lo escribió. Lo tuvo que oír.',
      'Um papagaio que repete tudo errado… Pra gente ele nunca disse uma palavra, mas isto ele escreveu. Ele deve ter ouvido.', 'Ein Papagei, der alles falsch nachspricht … Zu uns hat er nie ein Wort gesagt, aber das hat er aufgeschrieben. Er muss ihn gehört haben.',
      '[一|yī] [只|zhī] [什么|shén me] [话|huà] [都|dōu] [学|xué] [错|cuò] [的|de] [鹦鹉|yīng wǔ] … [他|tā] [从来|cóng lái] [没|méi] [跟|gēn] [我们|wǒ men] [说|shuō] [过|guò] [话|huà] ， [可是|kě shì] [他|tā] [把|bǎ] [这个|zhè ge] [写|xiě] [下来|xià lai] [了|le] 。 [他|tā] [一定|yī dìng] [听到|tīng dào] [了|le] 。',
      'なんでも [間違|まちが]えて まねする オウム … わたし たち に は [一言|ひとこと] も [言|い]わなかった けど 、 これ は [書|か]いた の ね 。 [聞|き]いた ん だ わ 。'),
    'elvira.r2done': L('He sat here, by the window, and watched the river. All night, maybe. And then… then he went up.', 'Se sentó aquí, junto a la ventana, a mirar el río. Toda la noche, quizá. Y luego… luego subió.',
      'Ele sentou aqui, perto da janela, e ficou olhando o rio. A noite toda, talvez. E depois… depois ele subiu.', 'Er hat hier am Fenster gesessen und auf den Fluss geschaut. Vielleicht die ganze Nacht. Und dann … dann ist er hinaufgestiegen.',
      '[他|tā] [坐|zuò] [在|zài] [这里|zhè lǐ] ， [窗|chuāng] [边|biān] ， [看|kàn] [着|zhe] [河|hé] 。 [也许|yě xǔ] [看|kàn] [了|le] [一整夜|yī zhěng yè] 。 [然后|rán hòu] … [然后|rán hòu] [他|tā] [上去|shàng qu] [了|le] 。',
      'ここ 、 [窓|まど] の そば に [座|すわ]って 、 [川|かわ] を [見|み]て いた の ね 。 [一晩中|ひとばんじゅう] かも 。 それ から … [上|うえ] へ [行|い]った 。'),
    'elvira.top': L('Look, up on the pedestal: a parrot of clay, from the frieze over the door! It’s… it’s moving!', '¡Mira, en el pedestal: un loro de barro, el del friso de la puerta! ¡Se… se está moviendo!', 'Olha, no pedestal: um papagaio de barro, o do friso da porta! Ele… ele está se mexendo!',
      'Schau, auf dem Sockel: ein Papagei aus Lehm, der vom Fries über der Tür! Er … er bewegt sich!', '[你|nǐ] [看|kàn] [台座|tái zuò] [上|shang] ： [一|yī] [只|zhī] [泥|ní] [鹦鹉|yīng wǔ] ， [就是|jiù shì] [门|mén] [上|shang] [浮雕|fú diāo] [少|shǎo] [的|de] [那|nà] [只|zhī] ！ [它|tā] … [它|tā] [在|zài] [动|dòng] ！',
      '[見|み]て 、 [台|だい] の [上|うえ] ！ [戸|と] の [上|うえ] の [浮|う]き[彫|ぼ]り に いなかった 、 [泥|どろ] の オウム ！ [動|うご]いて る ！'),
    'elvira.end': L('His voice… he had a voice all along. I’ll write this down, word for word. The earth keeps everything, but I want to keep this myself.', 'Su voz… siempre tuvo voz. Voy a escribir esto, palabra por palabra. La tierra lo guarda todo, pero esto quiero guardarlo yo.',
      'A voz dele… ele sempre teve voz. Vou escrever isto, palavra por palavra. A terra guarda tudo, mas isto eu quero guardar eu mesma.', 'Seine Stimme … er hatte die ganze Zeit eine Stimme. Ich schreibe das auf, Wort für Wort. Die Erde bewahrt alles, aber das will ich selbst bewahren.',
      '[他|tā] [的|de] [声音|shēng yīn] … [他|tā] [一直|yī zhí] [都|dōu] [有|yǒu] [声音|shēng yīn] 。 [我|wǒ] [要|yào] [一|yī] [字|zì] [一|yī] [句|jù] [地|de] [写|xiě] [下来|xià lai] 。 [土地|tǔ dì] [会|huì] [保存|bǎo cún] [一切|yī qiè] ， [可是|kě shì] [这个|zhè ge] [我|wǒ] [想|xiǎng] [自己|zì jǐ] [保存|bǎo cún] 。',
      '[彼|かれ] の [声|こえ] … ずっと [声|こえ] が あった ん だ 。 [一言|ひとこと] [一言|ひとこと] 、 [書|か]き[留|と]めて おく 。 [土|つち] は なんでも [守|まも]って くれる けど 、 これ は わたし が [守|まも]りたい 。'),
  };
  // the roof: the Clay Parrot (the fight), Elio's echo, then down and out to the court
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.6, K.Y0 + 3.0, room.R.z + 3.8), K.V(room.perch.x, K.Y0 + 1.8, room.perch.z)); await K.wait(0.6); const P = room.elvira; if (P) { M.frame2(P.api); await M.say(P.api, ln('elvira.top')); } } finally { M.lock(false); }
    const r = typeof RUBOSS !== 'undefined' ? await RUBOSS.fightParrot() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Tell it as a memory!' : 'The clay parrot ruffles its feathers on its perch. «Squawk!»', 4); return; }
    s.boss = true;
    M.lock(true);
    try {
      room.gm.u.uGray.value = 0; G.w3d.fx.sparkle(room.perch.x, K.Y0 + 2.2, room.perch.z, 26, ['#5fae4f', '#c9433a', '#f2c94c']); Sound.play('chime');
      await K.wait(0.8);
      await K.tween(1.0, kk => { room.bird.position.y = K.Y0 + kk * 2.5; room.bird.rotation.y = kk * 3; room.bird.scale.setScalar(1 - kk * 0.4); });
      room.bird.visible = false; room.birdSolid.x = 1e5;
      await K.tween(1.4, kk => { room.orb.material.opacity = kk * 0.95; room.orb.position.y = K.Y0 + 2.2 + kk * 1.0; room.orb.scale.setScalar(1.0 + kk * 0.8); });
      await M.you('A young man’s voice, whispering to the river… slowly, the way you say something for the first time in years.');
      const letter = typeof RUBOSS !== 'undefined' ? RUBOSS.letter('past') : 'B';
      await CH4.give('ruins', 'past', letter);
      await K.tween(0.8, kk => { room.orb.material.opacity = 0.95 * (1 - kk); room.orb.position.y = K.Y0 + 3.2 + kk * 2; });
      const P = room.elvira; if (P) { M.frame2(P.api); await M.say(P.api, ln('elvira.end')); }
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true; G0().save();
    await K.leave({ slow: true, then: async () => { const G = K.G; G.cam.override = { pos: K.V(OUT.x - 5.0, 4.6, OUT.z + 6.0), look: K.V(142.0, 3.0, -24.0) }; G.cam.snap(OUT.yaw, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      await K.wait(1.0);
      for (let j = 0; j < 6; j++) { G.w3d.fx.sparkle(142 + (Math.random() - 0.5) * 10, 4.5 + Math.random() * 2, -24.6, 6, ['#5fae4f', '#c9433a', '#f2c94c']); await K.wait(0.12); }
      const D = typeof RU_PAST !== 'undefined' && RU_PAST ? RU_PAST.who('professor') : null;
      if (D) { M.frame2(D); await M.say(D, T().LINES['prof.done']); }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Elio’s words are free. Noa is waiting at the time crack by the beach.', 5.5);
    G.save();
  }
  const G0 = () => K.G;

  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().MEM[kind].model || {})[lang()] || '', lang()))}»` : `Tell ${name}`);
    if (room.elvira) out.push({ x: room.elvira.api.x - 0.6, z: room.elvira.api.z - 0.6, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { await M.say(room.elvira.api, ln(s.boss ? 'elvira.end' : 'elvira.in')); } finally { M.lock(false); } } });
    const look = (x, z, id, line) => out.push({ x, z, r: 1.2, label: 'Look', run: async () => M.lookAt(id, line, 5) });
    if (room.intro) return out;          // (a room's first moments: young Elvira's demonstration, the ambush, before anything to do)
    if (i === 0) {
      look(room.R.x + 5.0, room.R.z - 2.8, 'w.rup_footprint', 'Bare {w.rup_footprint:pl} in the river {w.rup_mud}, a man’s, going to the trapdoor’s corner. None coming back down here.');
      if (!s.steps) out.push({ x: room.R.x + 1.2, z: room.R.z + 3.0, r: 1.8, label: 'Tell', run: () => stepsTask(room) });
      else if (!s.mud) out.push({ x: room.heap.x + 1.0, z: room.heap.z + 1.2, r: 1.6, label: sayQ('mud'), run: () => mudTask(room) });
    }
    if (i === 1) {
      look(room.R.x - 2.6, room.R.z - HD + 1.6, 'w.rup_painting', 'A {w.rup_painting}: people carrying jars to the river, three birds over them… and a bell.');
      if (!s.note) out.push({ x: room.note.x, z: room.note.z + 1.4, r: 1.6, label: 'Read', run: () => noteTask(room) });
      else if (!s.statue) out.push({ x: room.statueAt.x + 1.2, z: room.statueAt.z + 1.4, r: 1.6, label: sayQ('statue'), run: () => statueTask(room) });
    }
    if (i === 2) {
      look(room.R.x + 3.8, room.R.z - HD + 1.8, 'w.rup_window', 'From the {w.rup_window}: the {w.rup_river} below, the palms, the fields by the cove. You can see the whole canyon from here.');
      if (!s.lamp) out.push({ x: room.lampAt.x, z: room.lampAt.z + 1.6, r: 1.6, label: 'Look', run: () => lampTask(room) });
      else if (!s.stones) out.push({ x: room.gap.x - 2.4, z: room.gap.z + 1.4, r: 1.6, label: sayQ('stones'), run: () => stonesTask(room) });
    }
    if (i === 3) {
      look(room.R.x + 5.4, room.R.z - HD + 1.2, 'w.rup_terrace', 'The {w.rup_terrace} on the temple’s roof: the green canyon all round, the river shining, the red walls.');
      if (!s.boss) out.push({ x: room.perch.x, z: room.perch.z + 2.6, r: 2.2, label: 'Face the parrot', run: () => bossScene(room) });
      else if (!s.done3) out.push({ x: room.perch.x, z: room.perch.z + 2.6, r: 2.2, label: 'Go down', run: finale });
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!s.steps) return { x: room.R.x + 1.2, z: room.R.z + 3.0, hint: '{mimo} sniffs the footprints in the mud.' }; if (!s.mud) return { x: room.heap.x, z: room.heap.z, hint: '{mimo} paws at the heap of mud under the rope.' }; }
    if (i === 1) { if (!s.note) return { x: room.note.x, z: room.note.z, hint: '{mimo} points at a note pinned under the painting.' }; if (!s.statue) return { x: room.statueAt.x, z: room.statueAt.z, hint: '{mimo} pushes at the fallen statue. Too heavy… now.' }; }
    if (i === 2) { if (!s.lamp) return { x: room.lampAt.x, z: room.lampAt.z, hint: '{mimo} looks at the lamp on the window sill.' }; if (!s.stones) return { x: room.gap.x, z: room.gap.z, hint: '{mimo} looks across the gap at the stones.' }; }
    if (i === 3 && !s.boss) return { x: room.perch.x, z: room.perch.z, hint: '{mimo} stares at the clay parrot on its perch.' };
    return null;
  }
  // (while a room's first moments play, its tasks wait: room.intro; teach before ask)
  async function onFirst(room) { room.intro = true; try { return await onFirst0(room); } finally { room.intro = false; } }
  async function onFirst0(room) {
    const P = room.elvira, i = room.i, s = st();
    if (i === 0) { await K.wait(0.8); if (P) { M.lock(true); try { M.frame2(P.api); await M.say(P.api, ln('elvira.in')); } finally { M.lock(false); } } }
    if (i === 1 && !s.ambush) {
      await K.wait(1.0);
      await M.you('Mud worms burst out of the wet floor! In here it’s a memory: tell what {mimo} did.');
      const r = await TIME.fight({ foes: [{ kind: 'worm', color: 'yellow', size: 'small' }, { kind: 'worm', color: 'red', size: 'small' }], place: { x: 142, z: -24, biome: 'temple' } });
      if (!r || r.outcome !== 'win') return false;
      s.ambush = true; K.G.save();
    }
    const key = ['d.r0', 'd.r1', 'd.r2', null][i];
    if (P && key) { await K.wait(0.6); await demoElvira(room, key); }
    if (i === 0) M.think(`Footprints in the mud. What had happened before you came? ${M.sx('plup')}.`, 6);
    if (i === 1) M.think('Read his note, and pass on what he wrote.', 5);
    if (i === 2) M.think('His lamp, still warm. What had he done?', 5);
    if (i === 3) M.think('Something on the pedestal is watching you. Face it.', 4.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.elvira) K.animate(room.elvira, dt, t);
    if (room.lampGlow) room.lampGlow.material.opacity = st().lamp ? 0.35 + 0.1 * Math.sin(t * 2) : 0.55 + 0.15 * Math.sin(t * 3);
    if (room.bird && room.bird.visible && !st().boss) { room.bird.rotation.y = Math.sin(t * 0.9) * 0.4; room.bird.position.y = K.Y0 + Math.abs(Math.sin(t * 2.2)) * 0.06; }
  }
  // the temple's own look: the old photograph's sepia over the picture (the Past's sky dome stays hidden in here)
  function late() {
    const cv = document.getElementById('gl');
    if (cv && !document.body.classList.contains('in-battle')) cv.style.filter = 'sepia(0.3) saturate(1.12) hue-rotate(-6deg) contrast(1.03)';
    if (typeof PAST !== 'undefined' && PAST._ && PAST._.W && PAST._.W.sky) PAST._.W.sky.visible = false;
  }
  const MOD = MOLMILL.make({
    name: 'ruins-past-temple', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: OUT, state: st,
    tint: { planks: ['#d9b07a', '#cfa46c', '#e0b884'], joint: '#a8784a', wall: '#e3b98a', wall2: '#d4a878', skirt: '#c99a68', skirt2: '#b8844e', trim: '#8a5a3a', window: '#bfe4f0', beam: '#a8743f', puff: '#e2c088', stones: true },
    interior: { fog: '#c9a070', near: 20, far: 60 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('ru_past_temple') ? 'ru_past_temple' : null),
  });
  // (the kit names its ways for the mill: here they're the temple's; and a climb waits for a «Task complete» stamp to finish, so the
  // next hall's title card never lands on top of it)
  const stampUp = () => { const e = document.getElementById('qstamp'); return !!(e && e.classList.contains('on')); };
  const afterStamp = run => async () => { for (let i = 0; i < 25 && stampUp(); i++) await STORY.wait(0.2); return run(); };
  const ints0 = MOD.interactables;
  MOD.interactables = () => ints0().map(it => (it.label === 'Leave the mill' ? Object.assign({}, it, { label: 'Leave the temple' }) : it.label === 'Climb' ? Object.assign({}, it, { run: afterStamp(it.run) }) : it));
  return Object.assign(MOD, { finale, OUT, ROOM_LINES });
})();
