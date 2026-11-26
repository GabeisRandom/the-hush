'use strict';
// The collapsed deep mine, tomorrow (DESIGN.md 18.10 "T2b"): QFDEEP, on QRKIT (quarry_past_dungeon.js): four rock rooms at y 300,
// z −210, x −430 / −404 / −378 / −352, going down. Old Maite comes down with you (her lantern; she shows each room's guess first);
// nobody knows what's down here, so every lock is a guess, in the future of probability.
//   0 the Fallen Gallery: a rock fell in front of a boarded side gallery's door, unless today's Cande propped the beam (then the
//     old prop held, and Maite shows it): «{mimo} empujará la roca» (a plan); water seeps from under the door: «Detrás de la
//     puerta habrá agua»: behind it, an underground stream and the old shaft down
//   1 the Dripping Hall: gray bats (a fight, in tomorrow's words); two doors, a whistle behind one, squeaks behind the other:
//     «Chepe estará a la derecha» (guess the other side, and the bats rattle it)
//   2 the Claw Marks: claw marks, a mound of earth, Chepe's chalk note: «Será un topo»: the mound gives way to the mole's tunnel
//   3 the Deep Hollow: the Gray Mole (quarry_time_boss.js), Chepe frozen gray behind it; Elio's echo; home, and the lamps light
// Progress in TIME.state('quarry', 'future').deep: seen0…3, rubble, door0, done0, ambush, door1, done1, tunnel, done2, boss, done3.
const QFDEEP = (() => {
  if (typeof QRKIT === 'undefined' || typeof QUART === 'undefined' || !QUART) return null;
  const M = QUART, T = () => QFTXT, X = [-430, -404, -378, -352], Z = -210;
  const st = () => { const s = M.st('future'); return s.deep || (s.deep = {}); };
  const fS = () => M.st('future');
  const ln = key => T().LINES[key];
  const maLook = { skin: '#efc29a', hair: '#bdb6ae', hairdo: 'bun', dress: '#b84a7a', vest: '#3c4a5a', hat: 'cap', hatColor: '#e8b83a', prop: 'lantern' };
  const chLook = { skin: '#e6b48c', hair: '#8a8580', hairdo: 'short', dress: '#6a7a8a', vest: '#4a4436', hat: 'cap', hatColor: '#e8b83a', stache: true, hair2: '#8a8580' };
  const nm = id => M.nameOf(T().CAST[id]);
  const propped = () => !!TIME.flag('now', 'qrPropped');
  const GRAY = ['#7d7a80', '#8a868c', '#6f6c72'];
  let K = null;
  // a guess (QFTXT.TASKS), and {mimo}'s plan (Molinar's rung: «{mimo} empujará…»)
  async function guess(key, o = {}) {
    const r = await M.ask(T().TASKS[key], Object.assign({ tips: T().TIPS, icon: 'star' }, o));
    if (r) TIME.grade('qr.fdeep.' + key, r.letter);
    return r;
  }
  async function plan(kind) {
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const r = await M.ask(M.planTask(T().PLAN[kind]), { icon: 'push', hint: 'A plan: say what {mimo} will do.' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('qr.plan.' + kind, r.letter); }
    return r;
  }
  const floor = i => { const p = fS(); p.floors = Math.max(p.floors || 0, i + 1); };
  // a person's own material, gray until woken (quarry_future.js's way): returns the uniform
  function grayMat(body, on) {
    const m0 = body.children[0]; if (!m0 || !m0.material) return null;
    const m = m0.material.clone(), u = { uGray: { value: on ? 1 : 0 } };
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = u.uGray;
      sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.86, l * 0.95), uGray); }');
    };
    m.customProgramCacheKey = () => 'qrFrozen';
    m0.material = m; return u.uGray;
  }

  // ---------------------------------------------------------- the rooms' pieces (room-relative x / z)
  // a boarded wall of old gray planks from a to b, 2.3 high, with door gaps (distances along it); colliders every 0.6
  function boardWall(room, k, a, b, gaps = []) {
    const R = room.R, Y0 = K.Y0, dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len, ry = Math.atan2(-uz, ux), nx = -uz, nz = ux;
    const inGap = (t, w) => gaps.some(g => Math.abs(t - g) < w);
    for (let t = 0.18, i = 0; t < len; t += 0.36, i++) if (!inGap(t, 0.8)) k.box(R.x + a.x + ux * t, Y0 + 1.15 + (i % 3) * 0.03, R.z + a.z + uz * t, 0.34, 2.3 + (i % 2) * 0.08, 0.08, i % 2 ? '#8a8580' : '#7a756f', { ry, ink: 0.008 });
    const cuts = [0]; gaps.slice().sort((p, q) => p - q).forEach(g => cuts.push(g - 0.8, g + 0.8)); cuts.push(len);
    for (let j = 0; j < cuts.length; j += 2) {
      const t0 = cuts[j], t1 = cuts[j + 1]; if (t1 - t0 < 0.3) continue; const tm = (t0 + t1) / 2;
      for (const y of [0.55, 1.85]) k.box(R.x + a.x + ux * tm + nx * 0.07, Y0 + y, R.z + a.z + uz * tm + nz * 0.07, t1 - t0, 0.14, 0.05, '#66615c', { ry, ink: 0.006 });
    }
    for (let t = 0.3; t < len; t += 0.6) if (!inGap(t, 0.9)) { const c = { x: R.x + a.x + ux * t, z: R.z + a.z + uz * t, r: 0.42 }; WORLD.extra.push(c); }
  }
  // a plank door in a timber frame, facing the room's front (+z); it swings open toward you
  function door(room, k, x, z) {
    const R = room.R, Y0 = K.Y0, X0 = R.x + x, Z0 = R.z + z, KG = PAST.API.KG;
    for (const s of [-1, 1]) k.box(X0 + s * 0.8, Y0 + 1.25, Z0, 0.2, 2.5, 0.22, '#4a4038', { ink: 0.012 });
    k.box(X0, Y0 + 2.5, Z0, 1.9, 0.22, 0.26, '#433a33', { ink: 0.012 });
    const hinge = new THREE.Group(); hinge.position.set(X0 - 0.68, Y0, Z0 + 0.04); room.g.add(hinge);
    const kd = PAST.API.Kit();
    for (let i = 0; i < 4; i++) kd.box(0.17 + i * 0.34, 1.15, 0, 0.32, 2.28, 0.07, i % 2 ? '#6e5848' : '#634e40', { ink: 0.008 });
    for (const y of [0.5, 1.8]) kd.box(0.68, y, 0.05, 1.34, 0.14, 0.04, '#4e3e32', { ink: 0.006 });
    kd.add(KG.ball6, 1.16, 1.15, 0.08, 0.05, 0.05, 0.03, '#3a3640', { ink: 0 });
    kd.build(hinge, { shadow: false });
    const solid = { x: X0, z: Z0, r: 0.74 }; WORLD.extra.push(solid);
    return { hinge, solid, x: X0, z: Z0, open: false };
  }
  async function openDoor(d, instant) {
    if (!d || d.open) return; d.open = true; d.solid.x = 1e5;
    if (instant) { d.hinge.rotation.y = -1.9; return; }
    Sound.play('wood'); await K.tween(0.7, k => { d.hinge.rotation.y = -1.9 * (1 - Math.pow(1 - k, 3)); });
  }
  const flat = (room, w, d, color, x, z, o = {}) => {
    const m = new THREE.Mesh(o.circle ? new THREE.CircleGeometry(w, 20) : new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: o.op || 0.8, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(room.R.x + x, K.Y0 + (o.y || 0.02), room.R.z + z); room.g.add(m); return m;
  };
  // drops falling from the ceiling (a few sprites, recycled)
  function drips(room, n, spots) {
    room.drips = [];
    for (let i = 0; i < n; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#bfe0ff', transparent: true, opacity: 0.9, depthWrite: false }));
      sp.scale.setScalar(0.14); const at = spots[i % spots.length]; room.g.add(sp);
      room.drips.push({ sp, x: room.R.x + at[0], z: room.R.z + at[1], y: K.Y0 + 0.5 + Math.random() * 4, sp0: 3 + Math.random() * 2 });
    }
  }
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, i = room.i;
    room.ma = api.person(room, maLook, i === 3 ? { x: R.x - 4.6, z: R.z + 3.0, yaw: 2.4 } : { x: R.x + 4.6, z: R.z + 3.2, yaw: -2.5 }, nm('maite'));
    // fallen timbers and gray dust everywhere: it's been years
    for (const [x, z, rz, ry] of [[3.2, 4.6, 0.25, 0.3], [-5.6, 2.0, -0.2, 1.2], [5.8, -0.6, 0.3, -0.9]]) k.box(R.x + x, Y0 + 0.22, R.z + z, 2.6, 0.26, 0.26, '#6b6560', { rz, ry, ink: 0.012 });
    if (i === 0) {
      // a boarded side gallery in the back left corner: its door, water under it; behind it the stream and the shaft
      boardWall(room, k, { x: -7, z: -1.4 }, { x: -2.0, z: -1.4 }, [2.4]);
      boardWall(room, k, { x: -2.0, z: -1.4 }, { x: -2.0, z: -6 });
      room.door = door(room, k, -4.6, -1.4);
      room.puddle = flat(room, 0.5, 0, '#4f86b8', -4.6, -0.85, { circle: true, op: 0.8 });
      flat(room, 4.9, 0.7, '#4677a8', -4.55, -5.25, { op: 0.85 }); flat(room, 0.45, 0.8, '#4677a8', -4.6, -4.6, { op: 0.85 });
      drips(room, 4, [[-4.6, -0.9], [-4.2, -1.0], [-1.0, 1.0], [2.6, -2.4]]);
      // a cold lamp on a hook (Maite: «this lamp is cold»)
      k.box(R.x + 1.4, Y0 + 3.0, R.z - 5.5, 0.24, 0.3, 0.24, '#3d3a3a').box(R.x + 1.4, Y0 + 2.86, R.z - 5.5, 0.18, 0.2, 0.18, '#8a8a92', { ink: 0 });
      // the fallen rock in front of the door (not when the beam was propped today: then an old gray prop holds it)
      room.rock = new THREE.Group(); room.rock.position.set(R.x - 4.6, Y0, R.z - 0.15); room.g.add(room.rock);
      const kr = PAST.API.Kit(); kr.add(KG.ball6, 0, 0.75, 0, 1.0, 0.85, 0.9, '#7d7a80', { ry: 0.6, ink: 0.02 }).add(KG.ball6, 0.5, 0.3, 0.4, 0.4, 0.3, 0.35, '#6f6c72', { ink: 0.012 }); kr.build(room.rock);
      room.rockSolid = { x: R.x - 4.6, z: R.z - 0.15, r: 0.95 }; WORLD.extra.push(room.rockSolid);
      room.prop = new THREE.Group(); room.g.add(room.prop);
      const kp = PAST.API.Kit(); for (const s of [-1, 1]) kp.box(R.x - 4.6 + s * 1.15, Y0 + 1.4, R.z - 1.15, 0.24, 2.8, 0.24, '#8a8680', { ink: 0.01 }); kp.box(R.x - 4.6, Y0 + 2.86, R.z - 1.15, 2.7, 0.26, 0.3, '#7a7670', { ink: 0.01 });
      kp.box(R.x - 3.45, Y0 + 1.5, R.z - 1.0, 0.26, 0.18, 0.01, '#d8d4cc', { ink: 0.003 }); kp.build(room.prop);
      room.propAt = { x: R.x - 3.0, z: R.z - 0.4 };
    }
    if (i === 1) {
      // the Dripping Hall: a boarded wall across the back, two doors; bats' eyes over the left one; drips everywhere
      boardWall(room, k, { x: -7, z: -1.8 }, { x: 7, z: -1.8 }, [3.4, 10.6]);
      boardWall(room, k, { x: 0, z: -1.8 }, { x: 0, z: -6 });
      room.doorL = door(room, k, -3.6, -1.8); room.doorR = door(room, k, 3.6, -1.8);
      room.eyes = [[-4.4, 3.9, -4.6], [-3.0, 4.3, -5.2], [-2.2, 3.7, -4.0]].map(([x, y, z]) => { const g = new THREE.Group(); g.position.set(R.x + x, Y0 + y, R.z + z); for (const s of [-1, 1]) { const e = api.glow('#ffe066', 0.22, 0.9); e.position.x = s * 0.09; g.add(e); } room.g.add(g); return g; });
      drips(room, 7, [[-5.5, 2.0], [-2.0, 0.6], [1.4, 2.6], [4.0, 0.0], [-0.6, 4.0], [2.6, -0.8], [-4.4, -0.4]]);
      for (const [x, z, r] of [[-1.6, 1.4, 0.7], [2.4, 2.8, 0.5], [-4.8, 3.6, 0.45]]) flat(room, r, 0, '#5f7a94', x, z, { circle: true, op: 0.6 });
      room.guessAt = { x: R.x, z: R.z - 0.4 };
    }
    if (i === 2) {
      // the Claw Marks: a mound of earth over the shaft (the mole's tunnel), claw marks, Chepe's chalk note
      const w = room.way; if (w) { w.boards.visible = false; w.hole.visible = false; }
      const mx = R.x + 1.6, mz = R.z - 2.2;
      room.mound = new THREE.Group(); room.mound.position.set(mx, Y0, mz); room.g.add(room.mound);
      const km = PAST.API.Kit(); km.add(KG.half, 0, 0, 0, 1.55, 1.35, 1.45, '#6f6458', { ink: 0.02 });
      for (let j = 0; j < 7; j++) { const a = j / 7 * TAU; km.add(KG.ball6, Math.cos(a) * 1.6, 0.12, Math.sin(a) * 1.5, 0.28, 0.2, 0.26, j % 2 ? '#7a6e62' : '#665b50', { ink: 0.01 }); }
      km.build(room.mound);
      room.ring = new THREE.Group(); room.ring.position.set(mx, Y0, mz); room.ring.visible = false; room.g.add(room.ring);
      const kg = PAST.API.Kit(); for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; kg.add(KG.ball6, Math.cos(a) * 1.3, 0.16, Math.sin(a) * 1.25, 0.36, 0.26, 0.32, j % 2 ? '#7a6e62' : '#665b50', { ry: a, ink: 0.01 }); } kg.build(room.ring);
      room.moundSolid = { x: mx, z: mz, r: 1.5 }; WORLD.extra.push(room.moundSolid);
      room.moundAt = { x: mx, z: mz + 2.0 };
      for (const [x0, z0] of [[-4.2, -5.92], [3.4, -5.92]]) for (let j = 0; j < 3; j++) k.box(R.x + x0 + j * 0.32, Y0 + 2.1 - j * 0.1, R.z + z0, 0.07, 1.2, 0.03, '#2b2630', { rz: 0.35, ink: 0 });
      for (let j = 0; j < 3; j++) k.box(R.x - 6.92, Y0 + 1.8, R.z - 2.0 + j * 0.34, 0.03, 1.1, 0.07, '#2b2630', { rx: 0.35, ink: 0 });
      room.clawAt = { x: R.x - 3.8, z: R.z - 4.6 };
      k.box(R.x + 6.94, Y0 + 1.6, R.z - 1.0, 0.02, 0.7, 1.0, '#5a5560', { ink: 0 });
      for (let j = 0; j < 4; j++) k.box(R.x + 6.92, Y0 + 1.82 - j * 0.15, R.z - 1.0 + (j % 2) * 0.05, 0.02, 0.04, 0.8 - j * 0.1, '#f4f0e8', { ink: 0 });
      room.noteAt = { x: R.x + 5.8, z: R.z - 1.0 };
    }
    if (i === 3) {
      // the Deep Hollow: the Gray Mole's hole, the mole peeking out, and Chepe behind it, frozen gray by his broken lamp
      room.spot = { x: R.x, z: R.z - 1.2 };
      flat(room, 1.3, 0, '#0b0910', 0, -1.2, { circle: true, op: 1, y: 0.015 });
      for (let j = 0; j < 14; j++) { const a = j / 14 * TAU; k.add(KG.ball6, R.x + Math.cos(a) * 1.5, Y0 + 0.16, R.z - 1.2 + Math.sin(a) * 1.4, 0.34, 0.24, 0.3, j % 2 ? '#7a6e62' : '#665b50', { ry: a, ink: 0.01 }); }
      room.holeSolid = { x: room.spot.x, z: room.spot.z, r: 1.4 }; WORLD.extra.push(room.holeSolid);
      if (typeof QRBOSS !== 'undefined' && QRBOSS && QRBOSS.moleModel) { try { const h = QRBOSS.moleModel(); h.root.position.set(room.spot.x, Y0 - 1.0, room.spot.z); h.root.scale.setScalar(0.9); room.g.add(h.root); room.mole = h; } catch (e) { room.mole = null; } }
      room.ch = api.person(room, chLook, { x: R.x + 4.2, z: R.z - 4.0, yaw: -0.54 }, nm('chepe'));
      room.chGray = grayMat(room.ch.body, true);
      k.add(KG.cyl, R.x + 5.0, Y0 + 0.16, R.z - 3.4, 0.16, 0.3, 0.16, '#5a5660', { rz: Math.PI / 2, ink: 0.01 }).add(KG.half, R.x + 3.4, Y0 + 0.02, R.z - 3.6, 0.2, 0.16, 0.2, '#8a8680', { rx: 0.5, ink: 0.008 });
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#cfe6ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.orb.scale.setScalar(1.6); room.orb.position.set(room.spot.x, Y0 + 0.6, room.spot.z); room.g.add(room.orb);
      for (const [x, z] of [[-6.4, -4.0], [6.4, -4.4]]) { const gl = api.glow('#c8d0e0', 2.0, 0.35); gl.position.set(R.x + x, Y0 + 2.9, R.z + z); room.g.add(gl); }
    }
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    // the rock: moved aside (pushed, or never there because the beam was propped today); the prop: only when propped
    const prop = propped();
    r0.prop.visible = prop;
    if (prop) { r0.rock.visible = false; r0.rockSolid.x = 1e5; }
    else if (s.rubble) { r0.rock.visible = true; r0.rock.position.set(r0.R.x - 6.2, api.Y0, r0.R.z + 0.4); r0.rockSolid.x = r0.R.x - 6.2; r0.rockSolid.z = r0.R.z + 0.4; }
    if (s.door0) { openDoor(r0.door, true); r0.puddle.scale.setScalar(1.8); }
    if (s.door1) openDoor(r1.doorR, true);
    if (s.tunnel) { r2.mound.visible = false; r2.ring.visible = true; r2.moundSolid.x = 1e5; if (r2.way) r2.way.hole.visible = true; }
    if (s.boss) { if (r3.mole) r3.mole.root.visible = false; if (r3.chGray) r3.chGray.value = 0; }
  }
  const rockDone = () => propped() || !!st().rubble;

  // ---------------------------------------------------------- the floors' deeds
  async function rockDeed(room) {
    const s = st(); const r = await plan('rock'); if (!r) return;
    const G = K.G, rk = room.rock;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: rk.position.x + 1.4, z: rk.position.z + 0.2 }, { x: rk.position.x, z: rk.position.z }); await K.wait(0.7); G.sim.mimo.hop = { t: 0 }; Sound.play('land', 8);
      const x0 = rk.position.x, z0 = rk.position.z; Sound.play('crunch');
      await K.tween(0.9, k => { const e = k * k; rk.position.x = lerp(x0, room.R.x - 6.2, e); rk.position.z = lerp(z0, room.R.z + 0.4, e); rk.rotation.z = e * 1.4; });
      G.w3d.fx.puff(room.R.x - 6.2, K.Y0 + 0.4, room.R.z + 0.4, 12, 0.4, '#b8b6c4');
      s.rubble = true; room.rockSolid.x = room.R.x - 6.2; room.rockSolid.z = room.R.z + 0.4; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    M.think('Water seeps from under the door… What will there be behind it? Guess, in tomorrow’s words.', 5.5);
  }
  async function door0Deed(room) {
    const s = st(); const r = await guess('door0'); if (!r) return;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x - 1.6, K.Y0 + 3.4, room.R.z + 3.2), K.V(room.door.x, K.Y0 + 1.0, room.door.z - 1.6));
      await openDoor(room.door); Sound.play('blip');
      await K.tween(0.8, k => { room.puddle.scale.setScalar(1 + k * 0.8); });
      s.door0 = true; K.G.save();
      M.frame2(room.ma.api); await M.say(room.ma.api, ln('deep.door'));
    } finally { M.lock(false); }
    floor(0); await K.floorDone(0);
    UI.toast('Behind the door: the old shaft down!');
  }
  async function propLook(room) {
    M.lock(true);
    try { M.frame2(room.ma.api); await M.say(room.ma.api, ln('deep.prop')); const f = fS(); if (!f.propSeen) { f.propSeen = true; K.G.save(); } } finally { M.lock(false); }
  }
  // the Dripping Hall: listen at each door, then guess
  async function listen(room, side) {
    const G = K.G, d = side === 'left' ? room.doorL : room.doorR;
    G.sim.mimoGo({ x: d.x + 0.6, z: d.z + 1.0 }, { x: d.x, z: d.z }); await K.wait(0.5);
    if (side === 'left') { Sound.play('screech'); room.eyesFlash = 1.2; M.lookAt('w.qr_noise', 'Squeaks and flapping behind this one… {w.qr_bat:pl}, a lot of them.', 4.5); }
    else { Sound.play('chirp'); await K.wait(0.25); Sound.play('chirp'); M.lookAt('w.qr_whistle', 'Behind this one, faint and far: a little tune, like a {w.qr_whistle}. Someone’s whistling.', 4.5); }
    G.sim.mimoGo(null, null);
    st()['heard' + side] = true;
  }
  async function batsOut(room) {
    const d = room.doorL; Sound.play('screech'); room.eyesFlash = 1.6;
    await K.tween(0.5, k => { d.hinge.rotation.y = Math.sin(k * Math.PI * 6) * 0.12 * (1 - k); });
    K.G.w3d.fx.puff(d.x, K.Y0 + 1.6, d.z + 0.4, 10, 0.3, '#8a8694');
  }
  async function door1Deed(room) {
    const s = st();
    const r = await guess('chepeDoor', { onMiss: async g => { if (g.kind === 'miss') await batsOut(room); } }); if (!r) return;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 0.8, K.Y0 + 3.4, room.R.z + 3.4), K.V(room.doorR.x, K.Y0 + 1.0, room.doorR.z - 1.4));
      await openDoor(room.doorR); Sound.play('chirp');
      s.door1 = true; K.G.save();
      M.frame2(room.ma.api); await M.say(room.ma.api, ln('deep.found'));
    } finally { M.lock(false); }
    floor(1); await K.floorDone(1);
  }
  // the Claw Marks: what will it be?
  async function tunnelDeed(room) {
    const s = st(); const r = await guess('whatIs'); if (!r) return;
    const G = K.G;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x - 2.4, K.Y0 + 3.6, room.R.z + 3.6), K.V(room.mound.position.x, K.Y0 + 0.6, room.mound.position.z));
      Sound.play('scratch'); await K.tween(0.5, k => { room.mound.position.x = room.R.x + 1.6 + Math.sin(k * Math.PI * 8) * 0.06 * (1 - k); });
      Sound.play('crunch'); G.w3d.fx.puff(room.mound.position.x, K.Y0 + 0.8, room.mound.position.z, 18, 0.5, '#8a7e70');
      await K.tween(0.6, k => { room.mound.scale.set(1 + k * 0.15, Math.max(0.01, 1 - k), 1 + k * 0.15); });
      room.mound.visible = false; room.ring.visible = true; room.moundSolid.x = 1e5; if (room.way) room.way.hole.visible = true;
      s.tunnel = true; G.save();
    } finally { M.lock(false); }
    floor(2); await K.floorDone(2);
    M.think('A tunnel, straight down. Its digger is somewhere below… and so is Chepe.', 5);
  }
  // the bottom: the Gray Mole (the fight), Elio's echo, Chepe wakes, home
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.frame2(room.ma.api); await M.say(room.ma.api, ln('deep.mole')); } finally { M.lock(false); }
    const r = typeof QRBOSS !== 'undefined' && QRBOSS ? await QRBOSS.fightMole() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Watch the pebbles, and guess where it will come up!' : 'It sinks back into its hole, grumbling.', 4.5); return; }
    s.boss = true;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 0.6, K.Y0 + 3.2, room.R.z + 4.6), K.V(room.spot.x + 1.2, K.Y0 + 1.2, room.spot.z - 1.0));
      if (room.mole) { Sound.play('scratch'); await K.tween(0.7, k => { room.mole.root.position.y = K.Y0 - 1.0 - k * 2.2; }); room.mole.root.visible = false; }
      G.w3d.fx.puff(room.spot.x, K.Y0 + 0.5, room.spot.z, 14, 0.45, '#8a7e70');
      await K.tween(1.4, k => { room.orb.material.opacity = k * 0.95; room.orb.position.y = K.Y0 + 0.6 + k * 1.8; room.orb.scale.setScalar(1.2 + k * 0.8); });
      Sound.play('chime'); await K.wait(0.4);
      await M.you('A man’s voice… warm and steady, humming about tomorrow. The little voice the mole dug up.');
      const letter = typeof QRBOSS !== 'undefined' && QRBOSS ? QRBOSS.letter('future') : 'B';
      await CH4.give('quarry', 'future', letter);
      await K.tween(0.8, k => { room.orb.material.opacity = 0.95 * (1 - k); room.orb.position.y = K.Y0 + 2.4 + k * 2; });
      // Chepe: the color comes back
      Sound.play('learned'); G.w3d.fx.sparkle(room.ch.api.x, K.Y0 + 1.3, room.ch.api.z, 22, ['#ffd166', '#fff3a0', '#9ff5e8']);
      await K.tween(1.2, k => { if (room.chGray) room.chGray.value = 1 - k; });
      M.frame2(room.ch.api); await M.say(room.ch.api, ln('chepe.awake'));
      M.frame2(room.ma.api); await M.say(room.ma.api, ln('deep.done'));
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true; G0().save();
    await K.leave({ slow: true, then: async () => {
      if (typeof QR_FUT !== 'undefined' && QR_FUT && QR_FUT.freed) QR_FUT.freed(); else { TIME.flag('future', 'qrFree', true); TIME.refresh(); }
      const G = K.G; G.cam.override = { pos: K.V(88 - 10, 9, -276.6 + 15), look: K.V(88, 2.5, -272) }; G.cam.snap(0, 0.3, 9);
    } });
    const G = K.G;
    M.lock(true);
    try {
      for (let k = 0; k < 3; k++) { Sound.play('chime'); await K.wait(0.7); }
      try { if (typeof QRMUSIC !== 'undefined') QRMUSIC.play('qr_chorus', 7); } catch (e) { /* */ }
      await (TIME._.fast.on ? Promise.resolve() : UI.chapter('The miners’ camp', 'the lamps lit again, tomorrow'));
      const C = typeof QR_FUT !== 'undefined' && QR_FUT ? QR_FUT.who('cande') : null;
      if (C) { M.frame2(C); await M.say(C, ln('cande.after')); }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Both of the quarry’s echoes are free. Noa is waiting at the time crack by the camp’s entrance.', 5.5);
    G.save();
  }
  const G0 = () => K.G;

  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    if (room.ma) out.push({ x: room.ma.api.x - 0.6, z: room.ma.api.z - 0.5, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { await M.demo(room.ma.api, T().DEMO['fdeep' + i], T().MARKS['fdeep' + i]); } finally { M.lock(false); } } });
    if (i === 0) {
      if (!rockDone()) out.push({ x: room.rock.position.x + 1.4, z: room.rock.position.z + 0.6, r: 1.8, label: api.quick.rock ? `«${M.plainT(M.fillMimo((T().PLAN.rock.model || {})[M.lang()] || '', M.lang()))}»` : `Tell ${name}`, run: () => rockDeed(room) });
      else if (!s.door0) out.push({ x: room.door.x, z: room.door.z + 0.9, r: 1.6, label: 'The door', run: () => door0Deed(room) });
      if (propped()) out.push({ x: room.propAt.x, z: room.propAt.z, r: 1.1, label: 'Look', run: () => propLook(room) });
    }
    if (i === 1 && !s.door1) {
      out.push({ x: room.doorL.x, z: room.doorL.z + 1.1, r: 1.2, label: 'Listen', run: () => listen(room, 'left') });
      out.push({ x: room.doorR.x, z: room.doorR.z + 1.1, r: 1.2, label: 'Listen', run: () => listen(room, 'right') });
      out.push({ x: room.guessAt.x, z: room.guessAt.z, r: 1.5, label: 'The two doors', run: () => door1Deed(room) });
    }
    if (i === 2) {
      if (!s.tunnel) out.push({ x: room.moundAt.x, z: room.moundAt.z, r: 1.7, label: 'The mound', run: () => tunnelDeed(room) });
      out.push({ x: room.clawAt.x, z: room.clawAt.z, r: 1.4, label: 'Look', run: async () => { M.lookAt('w.qr_claw', 'Marks of a big {w.qr_claw} in the rock, wider than your hand. Something digs down here.', 5); } });
      out.push({ x: room.noteAt.x, z: room.noteAt.z, r: 1.3, label: 'Look', run: async () => { const l = M.lang(), N = T().NAMES.note; M.lookAt('w.qr_note', `Chalk on the rock, in a shaky hand: «${M.plainT(N[l] || N.en)}»`, 6); } });
    }
    if (i === 3) {
      if (!s.boss) out.push({ x: room.spot.x, z: room.spot.z + 2.2, r: 2.4, label: 'The Gray Mole', run: () => bossScene(room) });
      else out.push({ x: room.ch.api.x - 0.6, z: room.ch.api.z + 0.8, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { M.frame2(room.ch.api); await M.say(room.ch.api, ln('chepe.awake')); } finally { M.lock(false); } } });
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!rockDone()) return { x: room.rock.position.x, z: room.rock.position.z, hint: '{mimo} sniffs the fallen rock by the door.' }; if (!s.door0) return { x: room.door.x, z: room.door.z, hint: '{mimo} looks at the dripping door.' }; }
    if (i === 1 && !s.door1) return { x: room.guessAt.x, z: room.guessAt.z, hint: '{mimo} looks from one door to the other, ears up.' };
    if (i === 2 && !s.tunnel) return { x: room.moundAt.x, z: room.moundAt.z, hint: '{mimo} sniffs the mound of earth.' };
    if (i === 3 && !s.boss) return { x: room.spot.x, z: room.spot.z, hint: '{mimo} looks at the big hole… something gray peeks out.' };
    return null;
  }
  async function onFirst(room) {
    if (room.i === 1 && !st().ambush) {
      await K.wait(1.0);
      await M.you('Gray bats, out of the dark! Down here nobody knows anything: say what {mimo} will do.');
      const r = await TIME.fight({ foes: [{ kind: 'bat', color: 'blue', size: 'small' }, { kind: 'bat', color: 'white', size: 'small' }, { kind: 'hushling', color: 'green', size: 'small' }], place: { x: 88, z: -276, biome: 'cave' } });
      if (!r || r.outcome !== 'win') return false;
      st().ambush = true; K.G.save();
    }
    const P = room.ma;
    if (P) { await K.wait(room.i === 1 ? 0.6 : 1.2); M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO['fdeep' + room.i], T().MARKS['fdeep' + room.i]); } finally { M.lock(false); } }
    if (room.i === 0) {
      if (propped()) { await propLook(room); M.think('The old prop held: no rock fell here. Water seeps from under the door… What will there be behind it? Guess.', 6); }
      else M.think(`A fallen rock blocks the door. First, a plan: say what {mimo} will do («${M.plainT(M.fillMimo(T().PLAN.rock.model[M.lang()] || '', M.lang()))}»).`, 6);
    }
    if (room.i === 1) M.think('Two doors. Listen at each one, then guess where Chepe will be.', 5);
    if (room.i === 2) M.think('Claw marks, a mound of earth, a chalk note… Look around, then guess what it will be.', 5.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.ma) K.animate(room.ma, dt, t);
    if (room.ch && st().boss) K.animate(room.ch, dt, t);
    if (room.drips) for (const d of room.drips) { d.y -= dt * d.sp0; if (d.y < K.Y0 + 0.05) { d.y = K.Y0 + 4.6; } d.sp.position.set(d.x, d.y, d.z); }
    if (room.eyes) { room.eyesFlash = Math.max(0, (room.eyesFlash || 0) - dt); const on = st().door1 ? 0 : 0.35 + 0.5 * Math.min(1, room.eyesFlash || 0) + 0.15 * Math.sin(t * 1.3); room.eyes.forEach((g, j) => { g.children.forEach(e => { e.material.opacity = on * (Math.sin(t * 0.7 + j * 2.1) > -0.85 ? 1 : 0); }); g.position.y = K.Y0 + [3.9, 4.3, 3.7][j] + Math.sin(t * 2 + j) * 0.05; }); }
    if (room.i === 3 && room.mole && room.mole.root.visible) { room.mole.root.position.y = K.Y0 - 1.0 + Math.sin(t * 1.8) * 0.08; room.mole.inner.rotation.y = Math.sin(t * 1.2) * 0.3; room.mole.gl.material.opacity = 0.16 + 0.06 * Math.sin(t * 2); }
  }
  // the dungeon's own look: tomorrow's gray over the picture (the Future's tint stays off in here)
  function late() {
    const cv = document.getElementById('gl');
    // (once the Gray Mole is outguessed and Chepe wakes, the color comes back down here too)
    if (cv && !document.body.classList.contains('in-battle')) cv.style.filter = st().boss ? 'saturate(0.95) contrast(1.03)' : 'saturate(0.62) brightness(0.97) contrast(1.05)';
  }
  const MOD = QRKIT.make({
    name: 'qr-fut-deep', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: { x: 88, z: -273.8, yaw: 0 }, state: st,
    tint: { rock: ['#5f5d66', '#6a6870', '#55535c', '#716f78'], floor: '#4c4a52', floorA: '#57555e', floorB: '#43414a', beam: '#6b6560', beam2: '#5f5a55', puff: '#b8b6c4', rubble: GRAY, dust: true, seed: 23 },
    interior: { fog: '#24232b', near: 18, far: 54 },
    wayAt: room => (room.i === 1 ? { x: 3.6, z: -4.0 } : room.i === 2 ? { x: 1.6, z: -2.2 } : null),
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('qr_future_deep') ? 'qr_future_deep' : null),
  });
  return Object.assign(MOD, { finale });
})();
