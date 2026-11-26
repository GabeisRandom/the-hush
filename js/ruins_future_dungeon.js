'use strict';
// The sunken temple, tomorrow (DESIGN.md 20.1b "next, the Sunken Ruins"; game/TIME.md "The Sunken Ruins (T4b)"): four rooms at y 300,
// z 30, x −430 / −404 / −378 / −352, on MOLMILL's room kit (molinar_past_mill.js), reskinned as the temple's halls half under the sea
// (wet green stone, a band of weed at the high-water line, barnacles; the kit's windows hidden). The sea comes and goes in every hall:
// a water plane that breathes up and down with the tide. Tula follows you with her lantern, and some things only work at the right
// moment: you tie {mimo}'s plan to it («Cuando baje el agua, {mimo} nadará por el arco»), the tide turns, and {mimo} does it.
//   0 the Tide Hall: the way on is through an arch half under the water: «{mimo} nadará por el arco» when the water goes down
//   1 the Drowned Library: a Hushling ambush (the Future's tense), Tula's fear (the ceiling!: «No creo que se caiga»), then a wooden
//     shelf lying under the trapdoor that floats at high tide: «Cuando suba el agua, {mimo} empujará la estantería»
//   2 the Bell Shaft: Tula's fear (the bell is broken!: «Dudo que esté rota»), then the rope to the bell, out of reach at high tide:
//     «Cuando baje el agua, {mimo} trepará por la cuerda»
//   3 the Moray's Den, under the bell: the Gray Moray (ruins_time_boss.js), Elio's echo; outside, an island rises out of the sea
const RU_FTEMPLE = (() => {
  if (typeof MOLMILL === 'undefined' || typeof RUINT === 'undefined' || !RUINT) return null;
  const M = RUINT, T = () => RUFTXT, X = [-430, -404, -378, -352], Z = 30;
  const HW = MOLMILL.HW, HD = MOLMILL.HD, WH = MOLMILL.WH;
  const st = () => { const s = M.st('future'); return s.temple || (s.temple = {}); };
  const fS = () => M.st('future');
  const lang = () => M.lang();
  const tulaLook = { skin: '#d9a27a', hair: '#3a2b26', hairdo: 'tails', dress: '#e2574c', vest: '#4c7fd8', hat: 'straw', hatColor: '#e8d9a8', h: 1.0 };
  const nm = id => M.nameOf(T().CAST[id]);
  let K = null;
  const OUT = { x: 142.0, z: -18.4, yaw: 0 };
  const LOW = 0.08, HIGH = 0.72;

  // ---------------------------------------------------------- the halls' look: wet green stone, weed at the high-water line, barnacles
  function wetShell(room, api, k, den) {
    for (const m of room.g.children.slice()) {
      if (!m.isMesh || !m.geometry) continue;
      const ty = m.geometry.type, p = m.geometry.parameters || {};
      if (ty === 'BoxGeometry') continue;
      if (ty === 'PlaneGeometry' && Math.abs(p.height - WH) < 0.01) continue;
      if (ty === 'PlaneGeometry' && Math.abs(p.width - 2.2) < 0.01 && Math.abs(p.height - 1.2) < 0.01) continue;      // (the way out)
      m.visible = false;
    }
    const R = room.R, Y0 = api.Y0, KG = PAST.API.KG;
    for (let x = -HW + 1.5; x <= HW - 1.5; x += 3) k.box(R.x + x, Y0 + WH / 2, R.z - HD + 0.15, 0.5, WH, 0.24, '#7f978c', { ink: 0.006 });
    for (let z = -HD + 2; z <= HD - 2; z += 4) for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.12), Y0 + WH / 2, R.z + z, 0.24, WH, 0.5, '#7f978c', { ink: 0.006 });
    // the weed line at high water, barnacles under it, a carved band under the ceiling
    k.box(R.x, Y0 + HIGH + 0.06, R.z - HD + 0.1, HW * 2, 0.16, 0.06, '#3f6a4a', { ink: 0 });
    for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.05), Y0 + HIGH + 0.06, R.z, 0.06, 0.16, HD * 2, '#3f6a4a', { ink: 0 });
    for (let i = 0; i < 16; i++) k.add(KG.ball6, R.x - HW + 0.7 + i * 0.85, Y0 + 0.25 + (i % 3) * 0.12, R.z - HD + 0.12, 0.06, 0.05, 0.03, '#d8d4c8', { ink: 0 });
    k.box(R.x, Y0 + WH - 0.35, R.z - HD + 0.18, HW * 2, 0.3, 0.2, den ? '#6f7f78' : '#5f7f70', { ink: 0.004 });
  }
  // the sea in the hall: one plane per room on one shared material, its height the tide
  let WMAT = null;
  function water(room, api) {
    if (!WMAT) {
      const tex = TK.canvasTex(256, 256, c => {
        c.fillStyle = '#7fc4c8'; c.fillRect(0, 0, 256, 256);
        c.strokeStyle = 'rgba(235,250,250,0.55)'; c.lineWidth = 3;
        for (let i = 0; i < 14; i++) { const y = 10 + i * 18; c.beginPath(); for (let x = 0; x <= 256; x += 8) { const yy = y + Math.sin(x * 0.07 + i) * 4; if (x === 0) c.moveTo(x, yy); else c.lineTo(x, yy); } c.stroke(); }
      });
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 2.5);
      WMAT = new THREE.MeshBasicMaterial({ map: tex, color: '#9fdce0', transparent: true, opacity: 0.62, depthWrite: false });
    }
    const w = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2 - 0.1, HD * 2 - 0.1), WMAT); w.rotation.x = -Math.PI / 2; w.position.set(room.R.x, api.Y0 + LOW, room.R.z); w.renderOrder = 2; room.g.add(w);
    room.water = w; room.tide = 0.5; room.tideTo = null;
  }
  const levelOf = tide => LOW + (HIGH - LOW) * tide;
  // the tide turns: low (0) or high (1), and stays there for {mimo}'s plan
  async function turnTide(room, to, secs = 2.2) {
    room.tideTo = to; const from = room.tide;
    Sound.play('swoosh');
    await K.tween(secs, kk => { room.tide = from + (to - from) * kk * kk * (3 - 2 * kk); });
    room.tide = to;
  }
  // a gray material for the bell (it drains to gray and fills back with bronze)
  function grayMat(start = 1) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad }), u = { uGray: { value: start } };
    m.onBeforeCompile = sh => { sh.uniforms.uGray = u.uGray; sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.84, l * 0.86, l * 0.9), uGray); }'); };
    m.customProgramCacheKey = () => 'ruFRoomGray';
    return { m, u };
  }
  const floorsUp = i => { const p = fS(); p.floors = Math.max(p.floors || 0, Math.min(3, i + 1)); };

  // ---------------------------------------------------------- the rooms
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, i = room.i;
    wetShell(room, api, k, i === 3);
    water(room, api);
    room.tula = api.person(room, tulaLook, { x: R.x + 3.8, z: R.z + 3.4, yaw: -2.4 }, nm('tula'));
    const up = room.up || { x: R.x - 4.6, z: R.z - 3.6 };
    if (i === 0) {
      // the arch in the back wall, half under the water; a tide pool with a hermit crab; a mosaic on the floor
      room.arch = { x: R.x + 2.4, z: R.z - HD + 0.3 };
      for (const s of [-1, 1]) k.box(room.arch.x + s * 0.75, Y0 + 0.65, room.arch.z, 0.4, 1.3, 0.5, '#9aaa9e', { ink: 0.01 });
      k.box(room.arch.x, Y0 + 1.42, room.arch.z, 1.9, 0.34, 0.5, '#9aaa9e', { ink: 0.01 });
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.25), new THREE.MeshBasicMaterial({ color: '#0e1618' })); hole.position.set(room.arch.x, Y0 + 0.62, R.z - HD + 0.06); room.g.add(hole);
      room.pool = { x: R.x - 2.2, z: R.z + 2.0 };
      const pd = new THREE.Mesh(new THREE.CircleGeometry(0.9, 18), new THREE.MeshBasicMaterial({ color: '#21403f' })); pd.rotation.x = -Math.PI / 2; pd.position.set(room.pool.x, Y0 + 0.012, room.pool.z); room.g.add(pd);
      k.add(KG.cone, room.pool.x + 0.3, Y0 + 0.1, room.pool.z + 0.2, 0.12, 0.2, 0.12, '#e8c49a', { rx: 1.2, ink: 0.004 });
      room.mosaic = { x: R.x - 0.6, z: R.z - 1.0 };
      for (let a = 0; a < 5; a++) for (let b = 0; b < 4; b++) k.box(room.mosaic.x - 1.0 + a * 0.5, Y0 + 0.01, room.mosaic.z - 0.75 + b * 0.5, 0.46, 0.02, 0.46, ['#4c7fd8', '#e8d9b0', '#2f6f9a', '#c9a24a'][(a + b) % 4], { ink: 0 });
    }
    if (i === 1) {
      // shelves of scrolls along the walls, niches, a leak in the ceiling; a big wooden shelf lying under the trapdoor
      for (let j = 0; j < 3; j++) {
        const x = R.x + 1.2 + j * 1.9;
        k.box(x, Y0 + 1.3, R.z - HD + 0.45, 1.6, 2.6, 0.5, '#6b5236', { ink: 0.01 });
        for (let q = 0; q < 4; q++) for (let s = 0; s < 4; s++) k.add(KG.cyl, x - 0.55 + s * 0.36, Y0 + 0.55 + q * 0.6, R.z - HD + 0.55, 0.07, 0.3, 0.07, s % 2 ? '#e8d9b0' : '#d4c08a', { rz: Math.PI / 2, ink: 0 });
      }
      for (const z of [-1.6, 1.6]) { k.box(R.x + HW - 0.3, Y0 + 1.8, R.z + z, 0.2, 0.9, 0.7, '#3a4a44', { ink: 0 }); k.add(KG.cyl, R.x + HW - 0.45, Y0 + 1.5, R.z + z, 0.08, 0.3, 0.08, '#e8d9b0', { rz: Math.PI / 2, ink: 0 }); }
      room.shelfAt = { x: up.x + 0.8, z: up.z + 1.6 };
      room.shelf = new THREE.Group(); room.shelf.position.set(room.shelfAt.x, Y0, room.shelfAt.z); room.g.add(room.shelf);
      const ks = PAST.API.Kit(); ks.box(0, 0.3, 0, 2.2, 0.5, 0.9, '#7a5a3a', { ry: 0.3, ink: 0.012 }); for (let s = 0; s < 3; s++) ks.box(-0.7 + s * 0.7, 0.58, 0, 0.08, 0.08, 0.84, '#5a3a24', { ry: 0.3, ink: 0 }); ks.build(room.shelf);
      room.shelfSolid = { x: room.shelfAt.x, z: room.shelfAt.z, r: 1.0 }; WORLD.extra.push(room.shelfSolid);
      room.drip = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#9fd8e8', transparent: true, opacity: 0.7, depthWrite: false })); room.drip.scale.setScalar(0.18); room.drip.position.set(R.x - 1.0, Y0 + WH - 0.4, R.z + 0.6); room.g.add(room.drip);
      k.box(R.x - 1.0, Y0 + 0.01, R.z + 0.6, 0.6, 0.02, 0.6, '#2b3a36', { ink: 0 });
    }
    if (i === 2) {
      // the shaft: carvings up the walls, the rope from the trapdoor down into the water (its end floats out at high tide)
      for (let j = 0; j < 4; j++) k.box(R.x - 1.5 + j * 1.6, Y0 + 2.6, R.z - HD + 0.22, 1.1, 1.3, 0.06, '#6f8a7e', { ink: 0.004 });
      for (let j = 0; j < 6; j++) k.add(KG.sphere, R.x - 1.6 + j * 0.9, Y0 + 3.6, R.z - HD + 0.26, 0.2, 0.2, 0.05, '#8aa298', { ink: 0.002 });
      room.ropeTop = { x: up.x + 0.3, z: up.z + 0.2 };
      room.rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6), new THREE.MeshToonMaterial({ color: '#c9b48e', gradientMap: TK.grad })); room.g.add(room.rope);
      room.ropeEnd = { wall: { x: up.x + 0.5, z: up.z + 0.6 }, mid: { x: R.x - 0.4, z: R.z + 0.4 } };
      const fishT = TK.canvasTex(64, 32, c => { c.fillStyle = '#c9d8a8'; c.beginPath(); c.moveTo(6, 16); c.quadraticCurveTo(30, 4, 58, 14); c.quadraticCurveTo(30, 26, 6, 16); c.fill(); });
      room.eel = new THREE.Sprite(new THREE.SpriteMaterial({ map: fishT, transparent: true, depthWrite: false, opacity: 0.6 })); room.eel.scale.set(1.2, 0.5, 1); room.g.add(room.eel);
    }
    if (i === 3) {
      // the den under the bell: a round pool, holes in the back wall, the bronze bell hanging from the ceiling (gray), a stone altar
      room.pool = { x: R.x, z: R.z - 1.2 };
      const pd = new THREE.Mesh(new THREE.CircleGeometry(2.4, 28), new THREE.MeshBasicMaterial({ color: '#173234' })); pd.rotation.x = -Math.PI / 2; pd.position.set(room.pool.x, Y0 + 0.012, room.pool.z); room.g.add(pd);
      for (let j = 0; j < 5; j++) { const h = new THREE.Mesh(new THREE.CircleGeometry(0.42, 14), new THREE.MeshBasicMaterial({ color: '#0e1618' })); h.position.set(R.x - 4 + j * 2, Y0 + 0.55 + (j % 2) * 0.5, R.z - HD + 0.07); room.g.add(h); }
      room.gm = grayMat(1);
      room.bell = new THREE.Group(); room.bell.position.set(R.x, Y0 + 3.0, room.pool.z); room.g.add(room.bell);
      const kb = PAST.API.Kit(); kb.add(KG.cone, 0, 0.2, 0, 1.1, 1.6, 1.1, '#b07a3a', { ink: 0.016 }).add(KG.sphere, 0, 1.0, 0, 0.5, 0.35, 0.5, '#b07a3a', { ink: 0.01 }).add(KG.torus, 0, -0.55, 0, 1.12, 1.12, 0.1, '#8a5a2a', { rx: Math.PI / 2, ink: 0 });
      kb.add(KG.sphere, 0, -0.7, 0, 0.22, 0.22, 0.22, '#6b4a2a', { ink: 0.004 }); kb.build(room.bell, { mat: room.gm.m });
      k.rod([R.x, Y0 + 4.2, room.pool.z], [R.x, Y0 + WH, room.pool.z], 0.06, '#5a4a3a', 0.004);
      room.altar = { x: R.x - 4.4, z: R.z + 1.6 };
      k.box(room.altar.x, Y0 + 0.45, room.altar.z, 1.4, 0.9, 0.8, '#9aaa9e', { ink: 0.012 }).box(room.altar.x, Y0 + 0.94, room.altar.z, 1.6, 0.1, 0.95, '#aab8ae', { ink: 0.006 });
      room.altarSolid = { x: room.altar.x, z: room.altar.z, r: 0.85 }; WORLD.extra.push(room.altarSolid);
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3c8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); room.orb.scale.setScalar(1.0); room.orb.position.set(R.x, Y0 + 1.6, room.pool.z); room.g.add(room.orb);
      room.poolSolid = { x: room.pool.x, z: room.pool.z, r: 2.2 }; WORLD.extra.push(room.poolSolid);
    }
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.shelf) { r1.shelf.position.x = r1.shelfAt.x + 2.6; r1.shelfSolid.x = r1.shelfAt.x + 2.6; }
    if (s.boss) { r3.gm.u.uGray.value = 0; }
    void r0; void r2;
  }

  // ---------------------------------------------------------- the rooms' deeds
  const ln = key => T().LINES[key] || ROOM_LINES[key];
  async function sayTula(room, key) { const P = room.tula; if (!P) return; M.lock(true); try { M.frame2(P.api); await M.say(P.api, ln(key)); } finally { M.lock(false); } }
  async function demoTula(room, key) { const P = room.tula; if (!P) return; M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
  // {mimo}'s plan, tied to its moment (RUINT.whenTask); said once per visit, after that a «♪» does it
  async function plan(kind) {
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const task = M.whenTask(T().PLAN[kind]); if (!task) return null;
    const r = await M.ask(task, { icon: kind === 'arch' ? 'swim' : kind === 'shelf' ? 'push' : 'climb' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('rf.plan.' + kind, r.letter); }
    return r;
  }
  // Tula's fears, doubted out loud
  async function fearTask(room, key, ok) {
    const s = st();
    const r = await M.ask(T().TASKS[key], { tips: T().DTIPS, icon: 'star' });
    if (!r) { M.think('{tula} is still scared. Doubt the fear, out loud.', 4); return null; }
    TIME.grade('rf.temple.' + key, r.letter); s[key === 'r1fear' ? 'fear1' : 'fear2'] = r.letter; K.G.save();
    await sayTula(room, ok);
    return r;
  }
  async function archTask(room) {
    const s = st(); const r = await plan('arch'); if (!r) { M.think('The arch is under the water. Tell {mimo} what it will do… and when.', 4.5); return; }
    const G = K.G, a = room.arch;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 0.4, K.Y0 + 2.4, room.R.z + 2.6), K.V(a.x, K.Y0 + 0.6, a.z));
      await turnTide(room, 0, 2.4); await K.wait(0.3);
      Sound.play('jump'); await K.mimoArc({ x: a.x, z: a.z + 0.4 }, K.Y0 + 0.1, 0.7); Sound.play('splash');
      G.w3d.fx.puff(a.x, K.Y0 + 0.2, a.z + 0.5, 10, 0.25, '#cfe3ea'); G.cast.mimo.root.visible = false;
      await K.wait(1.0); Sound.play('click'); await K.wait(0.3);
      s.arch = true; G.save();
    } finally { G.cast.mimo.root.visible = true; M.lock(false); }
    floorsUp(0); await K.floorDone(0);
    M.lock(true); try { await K.mimoLand(); } finally { M.lock(false); }
    await sayTula(room, 'tula.r0done');
    room.tideTo = null;
  }
  async function shelfTask(room) {
    const s = st(); const r = await plan('shelf'); if (!r) { M.think('The shelf is too heavy… now. Tell {mimo} what it will do, and when.', 4.5); return; }
    const G = K.G, c = room.shelfAt;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 0.6, K.Y0 + 2.6, room.R.z + 2.8), K.V(c.x, K.Y0 + 0.4, c.z));
      await turnTide(room, 1, 2.4);
      await K.tween(0.8, kk => { room.shelf.position.y = K.Y0 + kk * (HIGH - 0.2); });
      G.sim.mimoGo({ x: c.x - 1.5, z: c.z + 0.8 }, c); await K.wait(0.8); Sound.play('push');
      await K.tween(1.0, kk => { room.shelf.position.x = c.x + kk * 2.6; room.shelf.rotation.y = kk * 0.4; }); room.shelfSolid.x = c.x + 2.6;
      s.shelf = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    floorsUp(1); await K.floorDone(1);
    await sayTula(room, 'tula.r1done');
    room.tideTo = null;
  }
  async function ropeTask(room) {
    const s = st(); const r = await plan('rope'); if (!r) { M.think('The rope’s end floats out of reach. Tell {mimo} what it will do, and when.', 4.5); return; }
    const G = K.G, e = room.ropeEnd.wall;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 1.2, K.Y0 + 2.8, room.R.z + 3.0), K.V(room.ropeTop.x, K.Y0 + 2.2, room.ropeTop.z));
      await turnTide(room, 0, 2.4); await K.wait(0.4);
      Sound.play('jump'); await K.mimoArc({ x: e.x, z: e.z }, K.Y0 + 0.5, 0.6);
      for (let j = 0; j < 4; j++) { Sound.play('pip'); await K.mimoArc({ x: e.x - j * 0.05, z: e.z - j * 0.1 }, K.Y0 + 1.2 + j * 0.95, 0.35); }
      Sound.play('click'); s.rope = true; G.save();
    } finally { M.lock(false); }
    floorsUp(2); await K.floorDone(2);
    M.lock(true); try { await K.mimoLand(); } finally { M.lock(false); }
    await sayTula(room, 'tula.r2done');
    room.tideTo = null;
  }
  // (Tula's lines in the halls, after each thing is done)
  const L = M.L;
  const ROOM_LINES = {
    'tula.r0done': L('The water went down, and {mimo} swam right through! I would never have thought of the tide… it was there all along.', '¡Bajó el agua y {mimo} pasó nadando! Nunca habría pensado en la marea… y estaba ahí todo el tiempo.',
      'A água baixou e o {mimo} passou nadando! Eu nunca teria pensado na maré… e ela estava ali o tempo todo.', 'Das Wasser ist gesunken, und {mimo} ist einfach durchgeschwommen! An die Flut hätte ich nie gedacht … dabei war sie die ganze Zeit da.',
      '[水|shuǐ] [退|tuì] [了|le] ， {mimo} [就|jiù] [游|yóu] [过去|guò qu] [了|le] ！ [我|wǒ] [从来|cóng lái] [没|méi] [想到|xiǎng dào] [潮水|cháo shuǐ] … [它|tā] [一直|yī zhí] [都|dōu] [在|zài] [这里|zhè lǐ] 。',
      '[水|みず] が [引|ひ]いて 、 {mimo} が [泳|およ]いで [通|とお]った ！ [潮|しお] の こと なんて [考|かんが]えなかった … ずっと そこ に あった のに 。'),
    'tula.r1done': L('It floated, just like I said! Well… just like you said. Up we go.', '¡Flotó, como yo decía! Bueno… como decías tú. Arriba.', 'Boiou, como eu disse! Quer dizer… como você disse. Vamos subir.', 'Es ist geschwommen, wie ich gesagt habe! Na ja … wie du gesagt hast. Nach oben.',
      '[它|tā] [浮|fú] [起来|qǐ lai] [了|le] ， [跟|gēn] [我|wǒ] [说|shuō] [的|de] [一样|yī yàng] ！ [不|bù] [对|duì] ， [是|shì] [跟|gēn] [你|nǐ] [说|shuō] [的|de] [一样|yī yàng] 。 [上去|shàng qu] [吧|ba] 。', '[言|い]った とおり 、 [浮|う]いた ！ … あなた が [言|い]った とおり ね 。 [上|うえ] へ [行|い]こう 。'),
    'tula.r2done': L('The bell is right above us now. I can hear something down in the water… breathing.', 'La campana está justo encima. Oigo algo ahí abajo, en el agua… que respira.', 'O sino está bem em cima da gente. Estou ouvindo alguma coisa lá embaixo, na água… respirando.',
      'Die Glocke ist jetzt direkt über uns. Ich höre etwas da unten im Wasser … atmen.', '[钟|zhōng] [就|jiù] [在|zài] [我们|wǒ men] [头|tóu] [上|shang] 。 [我|wǒ] [听到|tīng dào] [水|shuǐ] [里|lǐ] [有|yǒu] [东西|dōng xi] … [在|zài] [呼吸|hū xī] 。',
      '[鐘|かね] は もう すぐ [上|うえ] よ 。 [水|みず] の [中|なか] で [何|なに] か が … [息|いき] を して いる 。'),
  };
  // the den: the Gray Moray (the fight), Elio's echo, then out to the landing: an island rises out of the sea
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.6, K.Y0 + 3.0, room.R.z + 3.8), K.V(room.pool.x, K.Y0 + 1.2, room.pool.z)); await K.wait(0.6); await sayTula(room, 'tula.r3'); } finally { M.lock(false); }
    const r = typeof RUBOSS !== 'undefined' && RUBOSS.fightMoray ? await RUBOSS.fightMoray() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Tie the plan to its moment!' : 'Something gray slips back into its hole. «Grrr…»', 4); return; }
    s.boss = true;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x - 2.2, K.Y0 + 2.2, room.R.z + 3.6), K.V(room.R.x, K.Y0 + 3.0, room.pool.z));
      await K.tween(1.2, kk => { room.gm.u.uGray.value = 1 - kk; room.bell.rotation.z = Math.sin(kk * 9) * 0.18 * (1 - kk); });
      Sound.play('chime'); try { Sound.play('bell'); } catch (e) { /* */ }
      G.w3d.fx.sparkle(room.R.x, K.Y0 + 3.0, room.pool.z, 26, ['#e8b04a', '#fff3c8', '#9fd8e8']); await K.wait(0.8);
      await K.tween(1.4, kk => { room.orb.material.opacity = kk * 0.95; room.orb.position.y = K.Y0 + 1.6 + kk * 1.0; room.orb.scale.setScalar(1.0 + kk * 0.8); });
      await M.you('A man’s voice, older now, saying it twice: the fear, and then the other way around… steady.');
      const letter = typeof RUBOSS !== 'undefined' ? RUBOSS.letter('future') : 'B';
      await CH4.give('ruins', 'future', letter);
      await K.tween(0.8, kk => { room.orb.material.opacity = 0.95 * (1 - kk); room.orb.position.y = K.Y0 + 2.6 + kk * 2; });
      await sayTula(room, 'tula.end');
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true; K.G.save();
    if (typeof RU_FUT !== 'undefined' && RU_FUT && RU_FUT.freed) RU_FUT.freed();
    const I = M.ISLE || { x: 134.0, z: 9.2 };
    await K.leave({ slow: true, then: async () => { const G = K.G; G.cam.override = { pos: K.V(I.x + 9.0, 7.0, I.z - 10.0), look: K.V(I.x, 3.4, I.z) }; G.cam.snap(OUT.yaw, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      await K.wait(1.0);
      for (let j = 0; j < 6; j++) { G.w3d.fx.sparkle(I.x + (Math.random() - 0.5) * 6, 3.6 + Math.random() * 1.5, I.z + (Math.random() - 0.5) * 5, 6, ['#6aa84a', '#ffd84a', '#9fd8e8']); await K.wait(0.15); }
      Sound.play('chime'); await K.wait(1.2);
    } finally { G.cam.override = null; M.lock(false); }
    M.think('An island rose out of the sea, green, with a spring on it. Elio’s words are free: Noa is waiting at the time crack by the beach.', 6);
    G.save();
  }

  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().PLAN[kind].model || {})[lang()] || '', lang()))}»` : `Tell ${name}`);
    if (room.tula) out.push({ x: room.tula.api.x - 0.6, z: room.tula.api.z - 0.6, r: 1.4, label: 'Talk', run: () => sayTula(room, s.boss ? 'tula.end' : 'tula.in') });
    const look = (x, z, id, line) => out.push({ x, z, r: 1.2, label: 'Look', run: async () => M.lookAt(id, line, 5.5) });
    if (room.intro) return out;          // (a room's first moments: Tula's fear, her demonstration, the ambush, before anything to do)
    if (i === 0) {
      look(room.pool.x + 0.8, room.pool.z + 0.9, 'w.ruf_tidepool', 'A {w.ruf_tidepool} in the floor. A {w.ruf_hermitcrab} drags its shell across it, and {w.ruf_bubble:pl} rise from a crack.');
      look(room.mosaic.x + 0.2, room.mosaic.z + 1.4, 'w.ruf_mosaic', 'A {w.ruf_mosaic} on the floor, blue and gold {w.ruf_tile:pl} under the water: fish, waves… a bell.');
      if (!s.arch) out.push({ x: room.arch.x - 0.4, z: room.arch.z + 2.0, r: 1.8, label: sayQ('arch'), run: () => archTask(room) });
    }
    if (i === 1) {
      look(room.R.x + 3.0, room.R.z - HD + 1.6, 'w.ruf_scroll', 'Shelf after shelf of {w.ruf_scroll:pl}, swollen with water. A {w.ruf_manuscript} in a {w.ruf_niche} up high is still dry.');
      look(room.R.x - 1.0, room.R.z + 1.6, 'w.ruf_leak', 'A {w.ruf_leak} in the ceiling: drip… drip… into a {w.ruf_drain} in the floor. The temple has been {w.ruf_humid} for years.');
      if (!s.shelf) out.push({ x: room.shelfAt.x + 1.4, z: room.shelfAt.z + 1.4, r: 1.6, label: sayQ('shelf'), run: () => shelfTask(room) });
    }
    if (i === 2) {
      look(room.R.x + 1.6, room.R.z - HD + 1.6, 'w.ruf_carving', '{w.ruf_carving}: a bell, a river, people carrying jars… the same story as the Painted Hall, long ago. The {w.ruf_height} of the shaft makes you dizzy.');
      look(room.R.x + 0.6, room.R.z + 1.8, 'w.ruf_eel', 'An {w.ruf_eel} winds through the water at your feet, and a tiny {w.ruf_seahorse} holds on to a weed with its tail.');
      if (!s.rope) out.push({ x: room.ropeEnd.wall.x + 1.2, z: room.ropeEnd.wall.z + 1.4, r: 1.6, label: sayQ('rope'), run: () => ropeTask(room) });
    }
    if (i === 3) {
      look(room.altar.x + 1.2, room.altar.z + 0.6, 'w.ruf_altar', 'A stone {w.ruf_altar} under the bell, worn smooth by the water. {w.ruf_coral} grows on one corner, and a {w.ruf_lobster} hides under it.');
      look(room.R.x + 3.4, room.R.z + 1.2, 'w.ruf_bronze', s.boss ? 'The bell is {w.ruf_bronze} again, warm and gold. It hums when the water touches it.' : 'The {w.ruf_bronze} bell hangs over the pool, gray, silent. Something lives in the holes behind it.');
      if (!s.boss) out.push({ x: room.pool.x + 0.6, z: room.pool.z + 3.2, r: 2.0, label: 'Face the moray', run: () => bossScene(room) });
      else if (!s.done3) out.push({ x: room.pool.x + 0.6, z: room.pool.z + 3.2, r: 2.0, label: 'Go out', run: finale });
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0 && !s.arch) return { x: room.arch.x, z: room.arch.z + 1.2, hint: '{mimo} looks at the arch, half under the water.' };
    if (i === 1 && !s.shelf) return { x: room.shelfAt.x, z: room.shelfAt.z, hint: '{mimo} pushes at the wooden shelf. Too heavy… now.' };
    if (i === 2 && !s.rope) return { x: room.ropeEnd.wall.x, z: room.ropeEnd.wall.z, hint: '{mimo} looks up the rope to the bell.' };
    if (i === 3 && !s.boss) return { x: room.pool.x, z: room.pool.z + 2.4, hint: '{mimo} stares at the holes behind the pool. Something gray…' };
    return null;
  }
  // (while a room's first moments play, its tasks wait: room.intro; teach before ask)
  async function onFirst(room) { room.intro = true; try { return await onFirst0(room); } finally { room.intro = false; } }
  async function onFirst0(room) {
    const i = room.i, s = st();
    await K.wait(0.7);
    if (i === 0) { await sayTula(room, 'tula.in'); await K.wait(0.3); await demoTula(room, 'd.r0'); M.think(`The arch is under the water. Tell {mimo} what it will do, and when: ${M.sx('mwhen')}.`, 6); }
    if (i === 1) {
      if (!s.ambush) {
        await M.you('Gray Hushlings burst out of the water! In here it’s tomorrow: say what {mimo} will do.');
        const r = await TIME.fight({ foes: [{ kind: 'hushling', color: 'blue', size: 'small' }, { kind: 'hushling', color: 'white', size: 'small' }], place: { x: 142, z: -18, biome: 'flooded' } });
        if (!r || r.outcome !== 'win') return false;
        s.ambush = true; K.G.save();
      }
      if (!s.fear1) { await sayTula(room, 'tula.r1fear'); if (!(await fearTask(room, 'r1fear', 'tula.r1ok'))) return true; }
      await demoTula(room, 'd.r1'); M.think('The wooden shelf floats at high tide. Tell {mimo} what it will do, and when.', 5);
    }
    if (i === 2) {
      if (!s.fear2) { await sayTula(room, 'tula.r2fear'); if (!(await fearTask(room, 'r2fear', 'tula.r2ok'))) return true; }
      await demoTula(room, 'd.r2'); M.think('The rope’s end floats out of reach at high tide. Tell {mimo} what it will do, and when.', 5);
    }
    if (i === 3) M.think('Something gray lives in the holes under the bell. Face it.', 4.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.tula) K.animate(room.tula, dt, t);
    // the tide breathes in and out, unless a plan is holding it
    if (room.water) {
      if (room.tideTo == null) room.tide += ((Math.sin(t * 0.45 + room.i) + 1) / 2 - room.tide) * Math.min(1, dt * 0.6);
      room.water.position.y = K.Y0 + levelOf(room.tide);
    }
    if (room.shelf && st().shelf) room.shelf.position.y = K.Y0 + Math.max(0, levelOf(room.tide) - 0.2);          // (pushed aside, it floats with the tide)
    if (room.drip) { const f = (t * 0.7) % 1; room.drip.position.y = K.Y0 + WH - 0.4 - f * (WH - 0.4); room.drip.material.opacity = 0.7 * (1 - f * 0.6); }
    if (room.rope) {
      const top = room.ropeTop, e = st().rope ? room.ropeEnd.wall : { x: lerp(room.ropeEnd.wall.x, room.ropeEnd.mid.x, room.tide), z: lerp(room.ropeEnd.wall.z, room.ropeEnd.mid.z, room.tide) };
      const a = K.V(top.x, K.Y0 + WH - 0.2, top.z), b = K.V(e.x, K.Y0 + levelOf(room.tide), e.z), mid = a.clone().add(b).multiplyScalar(0.5), d = b.clone().sub(a);
      room.rope.position.copy(mid); room.rope.scale.set(1, d.length(), 1); room.rope.quaternion.setFromUnitVectors(K.V(0, 1, 0), d.normalize());
    }
    if (room.eel) { room.eel.position.set(room.R.x + Math.sin(t * 0.5) * 3, K.Y0 + levelOf(room.tide) - 0.12, room.R.z + 1.0 + Math.cos(t * 0.4) * 1.5); room.eel.material.rotation = Math.cos(t * 0.5) > 0 ? 0 : Math.PI; }
    if (room.bell && !st().boss) room.bell.rotation.z = Math.sin(t * 0.7) * 0.02;
  }
  // the sunken temple's own look: tomorrow's gray, the color coming back hall by hall
  function late(dt) {
    const s = st(), n = ['done0', 'done1', 'done2', 'done3'].filter(k0 => s[k0]).length;
    if (TIME.look) TIME.look.apply('future', dt, Math.min(1, 0.42 + n * 0.14));
    if (WMAT && WMAT.map) { WMAT.map.offset.x = (WMAT.map.offset.x + dt * 0.02) % 1; WMAT.map.offset.y = (WMAT.map.offset.y + dt * 0.012) % 1; }
  }
  const MOD = MOLMILL.make({
    name: 'ruins-future-temple', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: OUT, state: st,
    tint: { planks: ['#6f7f78', '#66766f', '#788882'], joint: '#3f4a46', wall: '#8fa69a', wall2: '#829a8e', skirt: '#4f6a5e', skirt2: '#445e52', trim: '#5f7068', window: '#8fa6a0', beam: '#5f7068', puff: '#cfe3ea', stones: true },
    interior: { fog: '#4f6a6a', near: 16, far: 52 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('ru_future_temple') ? 'ru_future_temple' : null),
  });
  // (the kit names its ways for the mill: here they're the temple's; and a climb waits for a «Task complete» stamp to finish)
  const stampUp = () => { const e = document.getElementById('qstamp'); return !!(e && e.classList.contains('on')); };
  const afterStamp = run => async () => { for (let i = 0; i < 25 && stampUp(); i++) await STORY.wait(0.2); return run(); };
  const ints0 = MOD.interactables;
  MOD.interactables = () => ints0().map(it => (it.label === 'Leave the mill' ? Object.assign({}, it, { label: 'Leave the temple' }) : it.label === 'Climb' ? Object.assign({}, it, { run: afterStamp(it.run) }) : it));
  return Object.assign(MOD, { finale, OUT, ROOM_LINES });
})();
