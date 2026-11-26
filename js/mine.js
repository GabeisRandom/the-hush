'use strict';
// The mine (DESIGN.md 14.1, region 3): the Quarry Caves' dungeon, under the mountain behind the miners' camp. Four small
// rooms, one per level, built like the Great Mill's (mill.js): high up and out of sight at y = 300, walls facing inward (the
// camera looks in from outside, like a dollhouse), one room at a time, and every action a sentence to Mimo («tell Mimo»;
// once a verb has worked on a thing in a room, E repeats it). It's dark down here: «¡canta!» wakes the crystals near Mimo,
// and the room lights up; the song wakes hushed things too.
//   0 the Dark Gallery:  sing the big crystal awake (the room lights up), push the minecart: it rolls down the rails and
//                        smashes the boarded-up passage («¡canta!», «¡empuja!»)
//   1 the Echo Hall:     echo bats jump you (a fight); Mimo hops up onto the ledge and kicks the rope ladder down («¡salta!»)
//   2 the Crystal Pool:  hit the gray crust off the shore crystal («¡golpea!»), swim out to the islet («¡nada!»), sing:
//                        every crystal in reach lights, and the crystal gate opens («¡canta!»). Chepe, a lost miner asleep
//                        in the corner, wakes up hushed: say how he is («Está perdido») and his words come back
//   3 the Gong Hall:     the giant echo bat sleeps upside down over the gong; sing it awake («¡canta!»), beat it (a boss
//                        fight), read Noa's page (she went on to the Bloom Gardens), and strike the gong yourself («¡golpea
//                        el gong!», or throw a stone at it): the third bell. Outside, the camp's lamps and fire light up.
//   MINE.init(game) · enter() · leave() · update(dt, t) · interactables() · target() · inside · OUTSIDE (the mouth: saves put you there)
// Progress lives in state.mine; flags.caveFree and flags.bells = 3 when the gong rings.
const MINE = (() => {
  let G = null, built = false;
  const { part, G: GEO } = TK;
  const Y0 = 300, HW = 7, HD = 6, WH = 5.2, INK = '#2b2235';
  const ROOMS = [
    { id: 'gallery', name: 'The Dark Gallery', sub: 'The mine · level 1', x: 176, z: 56 },
    { id: 'echo', name: 'The Echo Hall', sub: 'The mine · level 2', x: 176, z: 28 },
    { id: 'pool', name: 'The Crystal Pool', sub: 'The mine · level 3', x: 176, z: 0 },
    { id: 'gong', name: 'The Gong Hall', sub: 'The mine · the bottom', x: 176, z: -28 },
  ];
  const OUTSIDE = { x: 88, z: -276.0, yaw: 0 };
  const VERBS = ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing'];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = () => G.state.mine || (G.state.mine = {});
  const ex = w => (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  let inside = false, cur = -1, quick = {}, lightK = 0.3, lightT = 0.3, lamp = null, lights = null, hemiCol = null;
  const rooms = [];

  // ------------------------------------------------------------ materials: rock in bands, timber, the floor
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const rock = tex(256, 256, c => {
      const R = rng(9);
      ['#5f564d', '#6a6157', '#554d45', '#71675c'].forEach((col, i) => { c.fillStyle = col; c.fillRect(0, i * 64, 256, 64); });
      for (let k = 0; k < 90; k++) { c.fillStyle = `rgba(${R() < 0.5 ? '255,240,220' : '20,14,10'},${0.05 + R() * 0.08})`; const w = 12 + R() * 40; c.fillRect(R() * 256, R() * 256, w, 3 + R() * 6); }
      c.strokeStyle = 'rgba(20,14,10,0.35)'; c.lineWidth = 2; for (let k = 0; k < 14; k++) { c.beginPath(); const x = R() * 256, y = R() * 256; c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 40, y + 10 + R() * 30); c.stroke(); }
    }, 3, 1.2);
    const floor = tex(256, 256, c => {
      const R = rng(3); c.fillStyle = '#4f463d'; c.fillRect(0, 0, 256, 256);
      for (let k = 0; k < 160; k++) { c.fillStyle = R() < 0.5 ? '#5b5147' : '#463e36'; const s = 4 + R() * 14; c.beginPath(); c.ellipse(R() * 256, R() * 256, s, s * 0.7, R() * 3, 0, TAU); c.fill(); }
    }, 3, 3);
    MAT = { rock: new THREE.MeshToonMaterial({ map: rock, gradientMap: TK.grad }), floor: new THREE.MeshToonMaterial({ map: floor, gradientMap: TK.grad }), hole: new THREE.MeshBasicMaterial({ color: '#0b0910' }),
      water: new THREE.MeshToonMaterial({ color: '#2f6f8a', gradientMap: TK.grad, transparent: true, opacity: 0.88, emissive: new THREE.Color('#0d2a36') }),
      crystal: () => new THREE.MeshToonMaterial({ color: '#4a4658', gradientMap: TK.grad, emissive: new THREE.Color('#000000') }) };
    return MAT;
  }
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const glowTex = TK.glowTex;
  // (no depth test: a glow sits low by the floor and the walls, and they would cut its soft circle into a lit square)
  const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: o, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(s); sp.renderOrder = 2; return sp; };

  // ------------------------------------------------------------ the rooms' shell: rock walls facing in, timber frames, the floor
  function shell(R, g) {
    const M = mats();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, 0.4, HD * 2), M.floor); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
    [[0, -HD, 0, HW * 2], [0, HD, Math.PI, HW * 2], [-HW, 0, Math.PI / 2, HD * 2], [HW, 0, -Math.PI / 2, HD * 2]].forEach(([dx, dz, ry, w]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), M.rock); m.position.set(R.x + dx, Y0 + WH / 2, R.z + dz); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    });
    // timber frames along the back and the sides (none in front: the camera looks in through that wall)
    const k = CAVES.Kit(), GG = CAVES.GEO;
    for (const x of [-4.6, 0, 4.6]) { for (const s of [-1, 1]) k.add(GG.cyl6, R.x + x + s * 1.3, Y0 + 2.2, R.z - HD + 0.35, 0.16, 4.4, 0.16, '#6b4a30', { ink: 0.02 }); k.box(R.x + x, Y0 + 4.35, R.z - HD + 0.35, 3.0, 0.3, 0.32, '#6b4a30', { ink: 0.02 }); }
    for (const s of [-1, 1]) for (const z of [-2.5, 2.5]) { k.add(GG.cyl6, R.x + s * (HW - 0.35), Y0 + 2.2, R.z + z, 0.16, 4.4, 0.16, '#6b4a30', { ink: 0.02 }); }
    for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.35), Y0 + 4.35, R.z, 0.32, 0.3, HD * 2 - 0.6, '#5a3a24', { ink: 0.02 });
    // rubble in the corners, stalactites from the top of the back wall
    const RR = rng(Math.round(R.z * 7 + 99));
    for (let i = 0; i < 10; i++) { const x = R.x + (RR() < 0.5 ? -1 : 1) * (HW - 0.8 - RR() * 1.2), z = R.z + (RR() < 0.5 ? -1 : 1) * (HD - 0.8 - RR() * 1.0), s = 0.25 + RR() * 0.4; k.add(GG.ico, x, Y0 + s * 0.3, z, s * 1.2, s * 0.8, s, ['#6a6157', '#5f564d', '#71675c'][i % 3], { ry: RR() * 6, ink: 0.015 }); }
    for (let i = 0; i < 9; i++) k.add(GG.cone, R.x - HW + 1 + i * 1.5 + RR() * 0.5, Y0 + WH - 0.5, R.z - HD + 0.5 + RR() * 0.6, 0.18, -0.9 - RR() * 0.8, 0.18, '#5f564d', { ink: 0.012 });
    k.build(g);
    // the way back up: a dark opening at the front, by the left
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), M.hole); door.rotation.x = -Math.PI / 2; door.position.set(R.x - 4.5, Y0 + 0.012, R.z + HD - 0.7); g.add(door);
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - HD - 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: R.x, z: R.z + HD + 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 },
      { obox: 1, x: R.x - HW - 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }, { obox: 1, x: R.x + HW + 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }]);
    WORLD.addPlatforms([{ box: [R.x - HW, R.x + HW, R.z - HD, R.z + HD], top: Y0 }]);
  }
  // a cluster of crystals with its own material (dark until lit) and a glow
  function crystals(parent, x, z, h, y = Y0) {
    const k = CAVES.Kit(), GG = CAVES.GEO, R = rng(Math.round(x * 13 + z * 7));
    const cols = ['#9b8fd8', '#7fe0d8', '#c9a2ff', '#8fd0ff'];
    k.add(GG.oct, x, y + h * 0.45, z, 0.24, h * 0.55, 0.24, cols[(R() * 4) | 0], { rz: (R() - 0.5) * 0.4, ink: 0.015 });
    for (let i = 0; i < 4; i++) { const a = R() * TAU, hh = h * (0.35 + R() * 0.35); k.add(GG.oct, x + Math.cos(a) * 0.32, y + hh * 0.4, z + Math.sin(a) * 0.26, 0.14, hh * 0.5, 0.14, cols[(R() * 4) | 0], { rz: Math.cos(a) * 0.5, rx: Math.sin(a) * 0.5, ink: 0.012 }); }
    const mat = new THREE.MeshToonMaterial({ color: '#4a4658', vertexColors: true, gradientMap: TK.grad, emissive: new THREE.Color('#000000') });
    k.build(parent, { mat });
    const gl = glow('#a99cff', 2.2 + h * 1.2); gl.position.set(x, y + h * 0.55, z); parent.add(gl);
    return { x, z, h, mat, gl, lit: 0, litT: 0 };
  }
  function litStep(c, dt, t) {
    c.lit = damp(c.lit, c.litT, 2.4, dt);
    const L = c.lit;
    c.mat.color.setRGB(lerp(0.29, 1, L), lerp(0.27, 1, L), lerp(0.35, 1, L));
    c.mat.emissive.setRGB(0.24 * L, 0.18 * L, 0.45 * L).multiplyScalar(0.8 + 0.25 * Math.sin(t * 2.4 + c.x));
    c.gl.material.opacity = L * (0.6 + 0.2 * Math.sin(t * 2 + c.z));
  }
  // a hanging bat (decor): a little dark body with folded wings, swaying
  function hangingBat(parent, x, z, s = 1) {
    const g = grp(parent, x, Y0 + WH - 0.35, z), k = CAVES.Kit(), GG = CAVES.GEO;
    k.add(GG.sphere, 0, -0.22 * s, 0, 0.16 * s, 0.2 * s, 0.14 * s, '#4f4866', { ink: 0.012 }).add(GG.cyl6, 0, -0.03 * s, 0, 0.02, 0.1 * s, 0.02, '#3a3550', { ink: 0 });
    for (const sd of [-1, 1]) { k.add(GG.sphere, sd * 0.12 * s, -0.24 * s, 0, 0.06 * s, 0.2 * s, 0.1 * s, '#3a3550', { rz: sd * 0.25, ink: 0.01 }); k.add(GG.cone, sd * 0.07 * s, -0.43 * s, 0, 0.05 * s, -0.1 * s, 0.03 * s, '#6a5f88', { ink: 0 }); }
    k.build(g, { shadow: false });
    return g;
  }

  // ------------------------------------------------------------ build the four rooms (on first entry)
  function build() {
    if (built) return; built = true;
    const scene = G.w3d.scene, C = CAVES, k0 = C.Kit, GG = C.GEO;
    ROOMS.forEach((R, i) => { const g = new THREE.Group(); g.visible = false; scene.add(g); shell(R, g); rooms[i] = { R, g, crystals: [], bats: [] }; });
    // 0 · the Dark Gallery: rails from the front to a boarded-up passage at the back, the minecart, the big crystal
    {
      const room = rooms[0], R = room.R, g = room.g, k = k0();
      const rx = R.x + 2.4;
      for (let z = R.z + 5.2; z > R.z - HD + 0.6; z -= 0.75) k.box(rx, Y0 + 0.05, z, 1.5, 0.1, 0.28, '#6b4a30', { ink: 0 });
      for (const o of [-0.5, 0.5]) k.box(rx + o, Y0 + 0.16, R.z - 0.2, 0.08, 0.1, HD * 2 - 1.2, '#7d8590', { ink: 0.012 });
      k.box(R.x - 4.6, Y0 + 0.5, R.z - 1.4, 1.2, 1.0, 1.2, '#b07a48', { ink: 0.02 }).box(R.x - 5.4, Y0 + 0.4, R.z + 1.6, 0.9, 0.8, 0.9, '#a8703f', { ry: 0.4, ink: 0.02 });
      k.build(g);
      // the passage at the back, boarded up
      const pass = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), mats().hole); pass.position.set(rx, Y0 + 1.7, R.z - HD + 0.03); g.add(pass);
      const boards = grp(g, rx, Y0, R.z - HD + 0.3), bk = k0();
      for (let i = 0; i < 4; i++) bk.box(0, 0.6 + i * 0.75, 0, 2.8, 0.32, 0.12, i % 2 ? '#9a6440' : '#8a5636', { rz: (i % 2 ? 1 : -1) * 0.12, ink: 0.015 });
      bk.build(boards); room.boards = boards;
      room.boardsSolid = { x: rx, z: R.z - HD + 0.6, r: 1.3 }; WORLD.extra.push(room.boardsSolid);
      // the minecart
      const cart = grp(g, rx, Y0, R.z + 3.4), ck = k0();
      ck.box(0, 0.75, 0, 1.0, 0.72, 1.35, '#5d6470', { ink: 0.025 }).box(0, 1.13, 0, 1.08, 0.08, 1.43, '#454b55', { ink: 0.015 });
      for (const sx of [-0.52, 0.52]) for (const sz of [-0.4, 0.4]) ck.add(GG.cyl, sx, 0.32, sz, 0.2, 0.12, 0.2, '#3a3d44', { rz: Math.PI / 2, ink: 0.012 });
      for (let i = 0; i < 5; i++) ck.add(GG.ico, (i % 3 - 1) * 0.28, 1.17, i > 2 ? 0.25 : -0.25, 0.22, 0.18, 0.2, i % 2 ? '#9a958c' : '#8a8478', { ry: i, ink: 0.012 });
      ck.build(cart); room.cart = { g: cart, x: rx, z: R.z + 3.4, solid: { x: rx, z: R.z + 3.4, r: 0.85, id: 'mine-cart' } }; WORLD.extra.push(room.cart.solid);
      // the big crystal on its rock (it lights the whole room), small ones round the walls
      const ped = k0(); ped.add(GG.ico, R.x - 2.2, Y0 + 0.35, R.z - 2.0, 1.0, 0.6, 0.9, '#5f564d', { ink: 0.02 }); ped.build(g);
      room.big = crystals(g, R.x - 2.2, R.z - 2.0, 2.0, Y0 + 0.55);
      room.crystals.push(room.big, crystals(g, R.x - 6.2, R.z - 4.6, 1.0), crystals(g, R.x + 6.0, R.z - 4.4, 1.2), crystals(g, R.x - 6.2, R.z + 3.4, 0.8), crystals(g, R.x + 5.8, R.z + 0.6, 0.9));
      WORLD.extra.push({ x: R.x - 2.2, z: R.z - 2.0, r: 1.1 });
    }
    // 1 · the Echo Hall: bats hanging from the ceiling, a high ledge with the rope ladder coiled on it, the shaft down
    {
      const room = rooms[1], R = room.R, g = room.g, k = k0();
      room.ledge = { x: R.x + 4.6, y: Y0 + 1.9, z: R.z - 3.2 };
      k.box(room.ledge.x, Y0 + 0.95, room.ledge.z, 3.4, 1.9, 2.6, '#5f564d', { ink: 0.025 }).box(room.ledge.x, Y0 + 1.95, room.ledge.z, 3.5, 0.12, 2.7, '#6a6157', { ink: 0.015 });
      for (let i = 0; i < 3; i++) k.box(room.ledge.x - 2.15 + i * 0.05, Y0 + 0.3 + i * 0.5, room.ledge.z + 1.0 - i * 0.2, 0.9, 0.3, 0.9, '#5f564d', { ink: 0.015 });
      k.build(g);
      WORLD.extra.push({ obox: 1, x: room.ledge.x, z: room.ledge.z, hw: 1.7, hd: 1.3, rot: 0 });
      // the shaft in the floor (the way down), with the ladder coiled up on the ledge until Mimo kicks it down
      room.down = { x: R.x + 1.6, z: R.z - 3.4 };
      const shaft = new THREE.Mesh(new THREE.CircleGeometry(1.1, 20), mats().hole); shaft.rotation.x = -Math.PI / 2; shaft.position.set(room.down.x, Y0 + 0.015, room.down.z); g.add(shaft);
      const rim = k0(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; rim.add(GG.ico, room.down.x + Math.cos(a) * 1.25, Y0 + 0.12, room.down.z + Math.sin(a) * 1.25, 0.28, 0.18, 0.24, '#6a6157', { ry: a, ink: 0.012 }); } rim.build(g);
      WORLD.extra.push(room.shaftSolid = { x: room.down.x, z: room.down.z, r: 1.0 });
      const coil = grp(g, room.ledge.x - 0.6, room.ledge.y + 0.08, room.ledge.z + 0.4), ck = k0();
      for (let i = 0; i < 4; i++) ck.add(GG.cyl, 0, 0.06 + i * 0.09, 0, 0.34 - i * 0.04, 0.07, 0.34 - i * 0.04, i % 2 ? '#c9a66b' : '#a8864f', { ink: 0.008 });
      ck.build(coil); room.coil = coil;
      // (it hangs from the shaft's far rim down into the dark: only its top shows, hooked over the edge; it unrolls downward)
      const ladder = grp(g, room.down.x, Y0 + 0.7, room.down.z - 0.8), lk = k0();
      for (const s of [-0.35, 0.35]) lk.add(GG.cyl6, s, -1.2, 0, 0.035, 2.4, 0.035, '#c9a66b', { ink: 0 });
      for (let i = 0; i < 4; i++) lk.box(0, -0.25 - i * 0.55, 0, 0.75, 0.07, 0.1, '#8d6a46', { ink: 0.008 });
      for (const s of [-0.35, 0.35]) lk.box(s, 0.02, -0.14, 0.08, 0.08, 0.32, '#7d8590', { ink: 0.006 });
      lk.build(ladder); ladder.rotation.x = -0.2; ladder.visible = false; room.ladder = ladder;
      room.bats = [[-3.5, -3.8], [-1.6, -4.4], [0.8, -3.9], [-5.2, -2.2], [2.6, -4.6]].map(([x, z], i) => hangingBat(g, R.x + x, R.z + z, 0.9 + (i % 2) * 0.2));
      room.crystals.push(crystals(g, R.x - 6.2, R.z + 1.5, 0.9), crystals(g, R.x + 6.2, R.z + 2.6, 1.0));
    }
    // 2 · the Crystal Pool: the pool, the islet, three crystals (one under a gray crust), the crystal gate, Chepe asleep
    {
      const room = rooms[2], R = room.R, g = room.g, k = k0();
      room.pool = { x: R.x + 0.6, z: R.z - 1.8, rx: 4.6, rz: 2.8 };
      const water = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mats().water); water.rotation.x = -Math.PI / 2; water.scale.set(room.pool.rx, room.pool.rz, 1); water.position.set(room.pool.x, Y0 + 0.03, room.pool.z); g.add(water); room.water = water;
      for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU; k.add(GG.ico, room.pool.x + Math.cos(a) * (room.pool.rx + 0.15), Y0 + 0.1, room.pool.z + Math.sin(a) * (room.pool.rz + 0.15), 0.32, 0.18, 0.26, i % 2 ? '#6a6157' : '#5f564d', { ry: a, ink: 0.012 }); }
      room.islet = { x: room.pool.x + 1.2, z: room.pool.z - 0.6 };
      k.add(GG.ico, room.islet.x, Y0 + 0.18, room.islet.z, 0.9, 0.35, 0.8, '#6a6157', { ink: 0.02 });
      // the crystal gate (the way down), in the east wall
      room.gate = { x: R.x + HW - 0.4, z: R.z + 2.4 };
      const gh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.0), mats().hole); gh.position.set(R.x + HW - 0.02, Y0 + 1.5, room.gate.z); gh.rotation.y = -Math.PI / 2; g.add(gh);
      k.build(g);
      WORLD.extra.push({ obox: 1, x: room.pool.x, z: room.pool.z, hw: room.pool.rx * 0.82, hd: room.pool.rz * 0.8, rot: 0 });
      const gate = grp(g, room.gate.x, Y0, room.gate.z), gk = k0();
      for (let i = 0; i < 5; i++) gk.add(GG.oct, 0, 0.9 + (i % 2) * 0.5, -0.9 + i * 0.45, 0.22, 1.1 + (i % 3) * 0.3, 0.22, i % 2 ? '#7d7a8c' : '#8d8a9a', { rz: 0, rx: (i - 2) * 0.12, ink: 0.015 });
      gk.build(gate); room.gateG = gate;
      room.gateSolid = { x: room.gate.x - 0.2, z: room.gate.z, r: 1.3 }; WORLD.extra.push(room.gateSolid);
      room.A = crystals(g, R.x - 4.2, R.z + 2.6, 1.3); room.B = crystals(g, room.islet.x, room.islet.z, 1.1, Y0 + 0.3); room.Cc = crystals(g, R.x + 3.6, R.z - HD + 0.6, 1.6);
      room.crystals.push(room.A, room.B, room.Cc);
      // the gray crust over the shore crystal
      const crust = grp(g, R.x - 4.2, Y0, R.z + 2.6), ck = k0();
      for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; ck.add(GG.ico, Math.cos(a) * 0.35, 0.4 + (i % 3) * 0.35, Math.sin(a) * 0.3, 0.38, 0.42, 0.34, i % 2 ? '#8d8a9a' : '#9895a6', { ry: a, ink: 0.015 }); }
      ck.add(GG.ico, 0, 1.3, 0, 0.42, 0.38, 0.4, '#83808f', { ink: 0.015 });
      ck.build(crust); room.crust = crust;
      WORLD.extra.push({ x: R.x - 4.2, z: R.z + 2.6, r: 0.9 });
      // Chepe, asleep (gray), slumped on a rock in the corner
      room.chepe = CAVES.built && CAVES.built.makePerson ? CAVES.built.makePerson(Object.assign({}, CAVES.CHEPE, { seat: true }), { pose: 'tired', gray: true, hushed: true }) : null;
      if (room.chepe) {
        const p = room.chepe; scene.remove(p.root); g.add(p.root);
        p.x = R.x + 5.0; p.z = R.z + 4.0; p.y = Y0; p.baseYaw = p.yaw = -2.4; p.asleep = true;
        const sk = k0(); sk.add(GG.ico, p.x, Y0 + 0.2, p.z, 0.44, 0.32, 0.4, '#5f564d', { ink: 0.015 }); sk.build(g);
        room.chepeSolid = { x: p.x, z: p.z, r: 0.5 }; WORLD.extra.push(room.chepeSolid);
      }
    }
    // 3 · the Gong Hall: the great gong in its frame at the back, the giant bat asleep upside down above it
    {
      const room = rooms[3], R = room.R, g = room.g, k = k0();
      const gx = R.x, gz = R.z - 3.2;
      for (const s of [-1, 1]) k.add(GG.cyl6, gx + s * 2.3, Y0 + 2.0, gz, 0.2, 4.0, 0.2, '#6b4a30', { ink: 0.025 });
      k.box(gx, Y0 + 4.05, gz, 5.2, 0.38, 0.42, '#6b4a30', { ink: 0.025 }).box(gx, Y0 + 0.15, gz, 5.4, 0.3, 1.2, '#5a3a24', { ink: 0.02 });
      for (const s of [-1, 1]) k.box(gx + s * 2.3, Y0 + 0.5, gz + 0.5, 0.3, 1.0, 0.9, '#5a3a24', { rx: 0.5, ink: 0.015 });
      k.build(g);
      WORLD.extra.push({ obox: 1, x: gx, z: gz, hw: 2.7, hd: 0.7, rot: 0 });
      const piv = grp(g, gx, Y0 + 3.85, gz + 0.05);
      const gong = new THREE.Group(); piv.add(gong);
      gong.add(part(new THREE.CylinderGeometry(1.45, 1.45, 0.12, 36), '#d9a43c', [0, -1.75, 0], null, { rot: [Math.PI / 2, 0, 0], ink: 0.03 }));
      gong.add(part(new THREE.CylinderGeometry(0.55, 0.55, 0.16, 28), '#b8862e', [0, -1.75, 0.02], null, { rot: [Math.PI / 2, 0, 0], ink: 0 }));
      gong.add(part(new THREE.TorusGeometry(1.2, 0.05, 6, 36), '#f2c96a', [0, -1.75, 0.07], null, { ink: 0 }));
      for (const s of [-1, 1]) gong.add(part(GEO.cyl, '#3a2a20', [s * 0.8, -0.15, 0], [0.025, 0.4, 0.025], { rot: [0, 0, s * 0.6], ink: 0 }));
      room.gong = { piv, gong, x: gx, z: gz, swing: 0, shake: 0 };
      const gongGlow = glow('#ffd27a', 5.5); gongGlow.position.set(gx, Y0 + 2.1, gz + 0.3); g.add(gongGlow); room.gongGlow = gongGlow;
      // the giant echo bat, hanging upside down over the gong, wings folded (BATTLE's model if there is one)
      let boss = null;
      if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) { try { boss = BATTLE.buildFoe('bat', 'red', { size: 'big' }); boss.scale.multiplyScalar(2.2); boss.userData.mood = 'asleep'; } catch (e) { console.warn('[mine] boss model', e); boss = null; } }
      if (!boss) { boss = hangingBat(g, 0, 0, 3.2); g.remove(boss); }
      const hang = grp(g, gx + 0.2, Y0 + WH - 0.36, gz + 1.4); hang.add(boss); boss.rotation.x = Math.PI; boss.position.y = 0;
      // it hangs from a beam across the top: settle its sleeping pose, then lift it till its feet grip the beam
      if (boss.userData.animate) for (let i = 0; i < 30; i++) boss.userData.animate(1 / 30, i / 30, 0);
      room.bossInnerY = boss.children[0] ? boss.children[0].position.y : 0;
      hang.updateMatrixWorld(true);
      { const bb = new THREE.Box3().setFromObject(boss); boss.position.y += hang.position.y - bb.max.y; }
      room.bossRest = { hy: hang.position.y, by: boss.position.y };
      { const bk = k0(); bk.box(R.x, Y0 + WH - 0.18, gz + 1.4, HW * 2 - 0.3, 0.34, 0.4, '#5a3a24', { ink: 0.02 }); bk.build(g); }
      room.boss = boss; room.hang = hang;
      room.bossSolid = { x: gx, z: gz + 1.6, r: 1.2 };
      room.page = grp(g, gx - 3.2, Y0, gz + 2.4); room.page.visible = false;
      room.page.add(part(GEO.box, '#8a5f3e', [0, 0.65, 0], [0.16, 1.3, 0.16], { ink: 0 }));
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ color: '#fffaf0', side: THREE.DoubleSide })); sheet.position.set(0, 1.05, 0.1); sheet.rotation.z = 0.08; room.page.add(sheet);
      const pg = glow('#fff3b0', 1.3, 0.5); pg.position.set(0, 1.05, 0.15); room.page.add(pg); room.pageGlow = pg;
      room.crystals.push(crystals(g, R.x - 6.0, R.z - 4.4, 1.4), crystals(g, R.x + 6.0, R.z - 4.4, 1.4), crystals(g, R.x - 6.2, R.z + 2.6, 1.0), crystals(g, R.x + 6.2, R.z + 2.0, 1.1));
    }
    // your lamp: a warm glow that goes where you go, inside
    lamp = glow('#ffd59a', 4.2, 0.55); scene.add(lamp); lamp.visible = false;
    applyState();
  }
  // after a load: each room as the saved progress says
  function applyState() {
    const st = S(), r0 = rooms[0], r1 = rooms[1], r2 = rooms[2], r3 = rooms[3];
    if (st.lit0) r0.crystals.forEach(c => { c.litT = c.lit = 1; });
    if (st.cart) { placeCart(r0.R.z - HD + 1.6); r0.boards.visible = false; unsolid(r0.boardsSolid); }
    if (st.ladder) { r1.coil.visible = false; r1.ladder.visible = true; }
    if (st.crust) { r2.crust.visible = false; }
    if (st.swim) { /* Mimo comes back to you on load */ }
    if (st.lit2) { r2.crystals.forEach(c => { c.litT = c.lit = 1; }); r2.gateG.visible = false; unsolid(r2.gateSolid); }
    if (r2.chepe) { const helped = !!(G.state.caves && G.state.caves.chepe); r2.chepe.root.visible = !helped; if (helped) unsolid(r2.chepeSolid); else if (st.lit2) wakeChepe(true); }
    if (st.boss) { if (r3.boss) r3.boss.visible = false; r3.crystals.forEach(c => { c.litT = c.lit = 1; }); r3.page.visible = !st.page; }
    r1.crystals.forEach(c => { c.litT = c.lit = st.ambush ? 1 : 0; });
  }
  const unsolid = o => { if (!o) return; const s = o.solid || o; s.x = s.z = 1e5; };
  function placeCart(z) { const c = rooms[0].cart; c.z = z; c.g.position.z = z; c.solid.z = z; }

  // ------------------------------------------------------------ telling Mimo (the verb is the key; mill.js's way)
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${G.state.mimoName} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  // t: { kind, verb (or verbs: [the ones that work]), icon, title, hint, right(verb), at() }
  async function tell(t) {
    const ok = t.verbs || [t.verb];
    let verb = quick[t.kind] || null, ms = 0;
    if (!verb) {
      const r = await UI.command({ name: G.state.mimoName, icon: t.icon, title: t.title, verbs: VERBS, answer: ok[0] });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); G.sim.mimo.tiltT = 1.4; STORY.think('{mimo} tilts its head. ' + t.hint, 4.5); return; }
      verb = r.verb; ms = r.ms;
      if (ok.includes(verb)) quick[t.kind] = verb;
    }
    if (ok.includes(verb) || LEX.taught(verb)) learnUse(verb, ms);
    if (!ok.includes(verb)) { await wrong(t, verb); return; }
    await t.right(verb);
  }
  async function wrong(t, verb) {
    const M = G.sim.mimo, at = t.at ? t.at() : { x: G.sim.you.x, z: G.sim.you.z };
    G.sim.mimoGo({ x: at.x + 1.1, z: at.z + 1.1 }, at); await wait(0.6);
    const say = (s) => STORY.think(s, 3.5);
    if (verb === 'v.jump') { M.hop = { t: 0 }; Sound.play('jump'); say('{mimo} hops up and down. Nothing happens.'); }
    else if (verb === 'v.hit') { Sound.play('hit'); M.sad = 1.2; say('{mimo} bonks it. Ouch! Nothing moves.'); }
    else if (verb === 'v.throw') { Sound.play('whiff'); say('{mimo} throws a pebble at it. Plink. Nothing.'); }
    else if (verb === 'v.push') { Sound.play('land', 6); say('{mimo} pushes with all its might. It doesn’t budge.'); }
    else if (verb === 'v.swim') say('{mimo} looks for water to swim in. Not here.');
    else if (verb === 'v.sing') { await sing(1.2); say('{mimo} sings. The notes echo around the cave… but nothing changes here.'); }
    else if (verb === 'v.eat') say('{mimo} sniffs it… and decides it’s not food.');
    G.sim.mimoGo(null, null);
  }
  // Mimo sings: notes, its voice; the crystals within reach (r) light up, and the room with them
  async function sing(sec = 2.0, reach = 0) {
    const M = G.sim.mimo, room = rooms[cur];
    G.sim.mimoSay('♪ ' + LEX.form('v.sing') + ' ♪', sec); Sound.play('sing'); M.happy = sec; M.glow = 1;
    const lit = [];
    if (reach > 0 && room) for (const c of room.crystals) if (!c.blocked && c.litT < 1 && Math.hypot(c.x - M.x, c.z - M.z) < reach) { c.litT = 1; lit.push(c); }
    if (lit.length) Sound.play('chime');
    for (let t = 0; t < sec; t += 0.2) { if (CAVES.built) CAVES.built.note(M.x + (Math.random() - 0.5) * 0.5, M.ry + 1.1, M.z + (Math.random() - 0.5) * 0.5, Math.random() < 0.5 ? '#7ff7ea' : '#fff3a0'); await wait(0.2); }
    return lit;
  }
  async function mimoArc(to, y1, dur = 0.7) {
    const M = G.sim.mimo, root = G.cast.mimo.root, p0 = root.position.clone();
    M.hidden = true;
    await tween(dur, k => { root.position.set(lerp(p0.x, to.x, k), lerp(p0.y, y1, k) + Math.sin(k * Math.PI) * 1.3, lerp(p0.z, to.z, k)); });
    Sound.play('pip');
  }
  async function mimoLand() {
    const M = G.sim.mimo, Y = G.sim.you, root = G.cast.mimo.root, p0 = root.position.clone(), to = { x: Y.x + 1.1, z: Y.z + 0.6 };
    await tween(0.55, k => { root.position.set(lerp(p0.x, to.x, k), lerp(p0.y, Y0, k) + Math.sin(k * Math.PI) * 0.8, lerp(p0.z, to.z, k)); });
    M.x = to.x; M.z = to.z; M.y = M.ry = Y0; M.hidden = false; M.land = 0; Sound.play('land', 4);
  }

  // ------------------------------------------------------------ what you can press E on, room by room
  function interactables() {
    const list = [], st = S(), room = rooms[cur]; if (!room) return list;
    const R = room.R, name = G.state.mimoName;
    const say = kind => (quick[kind] ? `«${ex(LEX.form(quick[kind]))}»` : `Tell ${name}`);
    list.push({ x: R.x - 4.5, z: R.z + HD - 0.9, r: 1.6, label: cur === 0 ? 'Leave the mine' : 'Go back up', run: () => (cur === 0 ? leave() : go(cur - 1, 'below')) });
    if (cur === 0) {
      if (!st.lit0) list.push({ x: room.big.x, z: room.big.z + 1.6, r: 2.6, label: say('big'), run: () => tell({ kind: 'big', verb: 'v.sing', icon: 'crystal', at: () => room.big,
        title: `It’s pitch dark. Only a big crystal glows a little, very faintly. What should ${name} do?`, hint: 'The crystals at the mine’s mouth woke up to a voice…', right: lightGallery }) });
      else if (!st.cart) list.push({ x: room.cart.x, z: room.cart.z + 1.4, r: 2.4, label: say('cart'), run: () => tell({ kind: 'cart', verb: 'v.push', icon: 'push', at: () => room.cart,
        title: `A full minecart on the rails, and the rails run right into the boarded-up passage. What should ${name} do?`, hint: 'The cart is heavy… but it’s on rails.', right: rollCart }) });
      if (st.cart) list.push({ x: room.cart.x, z: R.z - HD + 1.0, r: 2.0, label: 'Go down the passage', run: () => go(1) });
    }
    if (cur === 1) {
      if (!st.ladder) list.push({ x: room.ledge.x - 2.2, z: room.ledge.z + 1.6, r: 2.4, label: say('ledge'), run: () => tell({ kind: 'ledge', verb: 'v.jump', icon: 'jump', at: () => ({ x: room.ledge.x - 1.8, z: room.ledge.z + 1.4 }),
        title: `The rope ladder down the shaft is coiled up on a high ledge. What should ${name} do?`, hint: 'The ledge isn’t that high, for someone bouncy…', right: kickLadder }) });
      else list.push({ x: room.down.x, z: room.down.z + 1.4, r: 2.2, label: 'Climb down the ladder', run: () => go(2) });
      if (!st.ladder) list.push({ x: room.down.x, z: room.down.z + 1.4, r: 1.6, label: 'Look', run: async () => STORY.think('A shaft in the floor, going down into the dark. No ladder…', 3.5) });
    }
    if (cur === 2) {
      if (!st.crust) list.push({ x: room.A.x + 1.2, z: room.A.z + 0.6, r: 2.2, label: say('crust'), run: () => tell({ kind: 'crust', verb: 'v.hit', icon: 'hit', at: () => room.A,
        title: `A crystal, crusted over with gray Hush stone. What should ${name} do?`, hint: 'The crust looks brittle. One good whack…', right: breakCrust }) });
      if (!st.swim) list.push({ x: room.pool.x - 1.0, z: room.pool.z + room.pool.rz + 1.2, r: 2.6, label: say('pool'), run: () => tell({ kind: 'pool', verb: 'v.swim', icon: 'swim', at: () => ({ x: room.pool.x, z: room.pool.z + room.pool.rz }),
        title: `A crystal stands on a little islet in the dark water. What should ${name} do?`, hint: 'Lalo, at the lake, showed {mimo} how to cross water…', right: swimOut }) });
      if (!st.lit2) list.push({ x: room.pool.x + 1.6, z: room.pool.z + room.pool.rz + 1.2, r: 2.6, label: say('sing2'), run: () => tell({ kind: 'sing2', verb: 'v.sing', icon: 'sing', at: () => ({ x: G.sim.mimo.x, z: G.sim.mimo.z }),
        title: `Three dark crystals: on the shore, on the islet, and high on the far wall. What should ${name} do?`, hint: 'The crystals listen to a voice…', right: singPool }) });
      if (st.lit2) list.push({ x: room.gate.x - 1.2, z: room.gate.z, r: 2.2, label: 'Go through the crystal gate', run: () => go(3) });
      const p = room.chepe;
      if (p && p.root.visible && !p.asleep) list.push({ x: p.x, z: p.z, r: 2.3, label: 'Help', run: chepeTalk });
      else if (p && p.root.visible) list.push({ x: p.x, z: p.z, r: 2.3, label: 'Look', run: async () => STORY.think('A miner, gray, slumped asleep on a rock in the cold corner. The Hush has him. Maybe a song would wake him…', 4.5) });
    }
    if (cur === 3) {
      if (!st.boss) list.push({ x: room.gong.x, z: room.gong.z + 3.2, r: 3.0, label: say('wake'), run: () => tell({ kind: 'wake', verb: 'v.sing', icon: 'sing', at: () => ({ x: room.gong.x, z: room.gong.z + 2.4 }),
        title: `A giant bat hangs asleep over the gong, wings wrapped tight. Nobody can reach the gong past it. What should ${name} do?`, hint: 'A song wakes hushed things…', right: wakeBoss }) });
      else if (!st.page) list.push({ x: room.page.position.x, z: room.page.position.z + 0.6, r: 2.0, label: 'Read', run: readPage });
      else if (!st.gong) list.push({ x: room.gong.x, z: room.gong.z + 2.4, r: 2.8, label: say('gong'), run: () => tell({ kind: 'gong', verbs: ['v.hit', 'v.throw'], icon: 'gong', at: () => ({ x: room.gong.x, z: room.gong.z + 1.6 }),
        title: `The great gong hangs silent. What should ${name} do?`, hint: 'A gong rings when something strikes it…', right: ringGong }) });
    }
    return list;
  }
  // where the compass points inside: the next thing to do in this room
  function target() {
    const st = S(), room = rooms[cur]; if (!room) return null;
    const at = (o, hint) => (o ? { x: o.x, z: o.z, hint } : null);
    if (cur === 0) return !st.lit0 ? at(room.big, '{mimo} points at the faint glow in the dark.') : !st.cart ? at(room.cart, '{mimo} points at the minecart on the rails.') : at({ x: room.cart.x, z: room.R.z - HD + 1 }, '{mimo} points at the broken boards: the way on!');
    if (cur === 1) return !st.ladder ? at({ x: room.ledge.x - 2, z: room.ledge.z + 1.4 }, '{mimo} looks up at the ledge.') : at(room.down, '{mimo} points down the shaft.');
    if (cur === 2) {
      const p = room.chepe;
      if (!st.crust) return at(room.A, '{mimo} points at the crusty gray crystal.');
      if (!st.swim) return at({ x: room.pool.x, z: room.pool.z + room.pool.rz + 1 }, '{mimo} looks at the islet in the water.');
      if (!st.lit2) return at({ x: room.pool.x + 1.6, z: room.pool.z + room.pool.rz + 1 }, '{mimo} hums a little. The crystals are listening.');
      if (p && p.root.visible && !p.asleep) return at(p, '{mimo} points at the miner in the corner.');
      return at({ x: room.gate.x - 1, z: room.gate.z }, '{mimo} points at the open crystal gate.');
    }
    if (cur === 3) return !st.boss ? at({ x: room.gong.x, z: room.gong.z + 2.4 }, '{mimo} stares up at the giant bat.') : !st.page ? at(room.page.position, '{mimo} points at the page.') : at({ x: room.gong.x, z: room.gong.z + 1.6 }, '{mimo} looks at the gong.');
    return null;
  }

  // ------------------------------------------------------------ the actions
  async function lightGallery() {
    const room = rooms[0], st = S();
    G.sim.mimoGo({ x: room.big.x + 0.9, z: room.big.z + 1.4 }, room.big); await wait(0.7);
    G.sim.lock = 1;
    await sing(2.2, 30);
    lightT = 1; st.lit0 = true; G.save();
    await wait(0.8);
    G.sim.lock = 0; G.sim.mimoGo(null, null);
    await STORY.you('The whole gallery lit up! There’s a minecart on the rails… and the rails run into those boards.');
  }
  async function rollCart() {
    const room = rooms[0], c = room.cart, M = G.sim.mimo, st = S();
    G.sim.lock = 1;
    G.sim.mimoGo({ x: c.x, z: c.z + 1.4 }, c); await wait(0.7);
    for (let k = 0; k < 2; k++) { Sound.play('land', 8 + k * 3); M.hop = { t: 0 }; await tween(0.3, u => { c.g.position.z = c.z - Math.sin(u * Math.PI) * 0.15; }); await wait(0.15); }
    const z0 = c.z, z1 = room.R.z - HD + 1.6;
    Sound.play('swoosh');
    await tween(1.3, u => { const e = u * u; placeCart(lerp(z0, z1, e)); c.g.rotation.x = Math.sin(u * 30) * 0.02; if (Math.random() < 0.3) G.w3d.fx.puff(c.x + (Math.random() - 0.5), Y0 + 0.1, c.g.position.z + 0.6, 1, 0.12, '#b9b0a0'); });
    Sound.play('hit'); Sound.play('crack'); G.w3d.fx.puff(c.x, Y0 + 1.2, room.R.z - HD + 0.6, 22, 0.4, '#b07a48');
    await tween(0.35, u => { room.boards.position.y = Y0 + u * 0.4; room.boards.rotation.x = -u * 1.2; room.boards.scale.setScalar(1 - u); });
    room.boards.visible = false; unsolid(room.boardsSolid);
    st.cart = true; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    UI.toast('Crash! The passage is open.');
  }
  async function kickLadder() {
    const room = rooms[1], L = room.ledge, st = S();
    G.sim.mimoGo({ x: L.x - 2.3, z: L.z + 1.2 }, L); await wait(0.6);
    await mimoArc({ x: L.x - 0.9, z: L.z + 0.2 }, L.y + 0.08, 0.6);
    Sound.play('land', 8);
    await wait(0.3);
    Sound.play('swoosh'); room.coil.visible = false; room.ladder.visible = true; room.ladder.scale.y = 0.05;
    await tween(0.7, k => { room.ladder.scale.y = lerp(0.05, 1, k * k); });
    Sound.play('wood');
    await wait(0.3); await mimoLand();
    st.ladder = true; G.save();
    UI.toast('The rope ladder unrolls down the shaft!');
  }
  async function breakCrust() {
    const room = rooms[2], M = G.sim.mimo, st = S(), a = room.A;
    G.sim.mimoGo({ x: a.x + 1.1, z: a.z + 0.7 }, a); await wait(0.6);
    M.hop = { t: 0 }; Sound.play('hit'); await wait(0.25);
    Sound.play('crack'); G.w3d.fx.puff(a.x, Y0 + 0.8, a.z, 16, 0.35, '#9895a6');
    await tween(0.3, k => room.crust.scale.setScalar(1 - k));
    room.crust.visible = false; st.crust = true; G.sim.mimoGo(null, null); G.save();
    STORY.think('The gray crust shattered. The crystal under it is dark… but it’s free.', 4);
  }
  async function swimOut() {
    const room = rooms[2], M = G.sim.mimo, root = G.cast.mimo.root, st = S(), I = room.islet;
    G.sim.lock = 1;
    const sx = room.pool.x - 0.6, sz = room.pool.z + room.pool.rz + 0.4;
    G.sim.mimoGo({ x: sx, z: sz + 0.6 }, I); await wait(0.6);
    M.hidden = true; Sound.play('jump');
    const p0 = root.position.clone(), wy = Y0 + 0.02;
    await tween(1.6, k => { root.position.set(lerp(p0.x, I.x - 0.4, k), wy - 0.12 + Math.sin(k * 26) * 0.04, lerp(p0.z, I.z + 0.5, k)); root.rotation.set(0.35, Math.atan2(I.x - p0.x, I.z - p0.z), 0); if (Math.random() < 0.25) G.w3d.fx.puff(root.position.x, wy + 0.05, root.position.z, 2, 0.12, '#cfe9f2'); });
    root.rotation.set(0, 0, 0);
    root.position.set(I.x - 0.4, Y0 + 0.5, I.z + 0.4); Sound.play('land', 5);
    st.swim = true; room.mimoOnIsle = true; G.sim.lock = 0; G.save();
    STORY.think('{mimo} climbs out onto the islet and shakes itself dry. It’s right next to the crystal there.', 4);
  }
  async function singPool() {
    const room = rooms[2], st = S(), M = G.sim.mimo, root = G.cast.mimo.root;
    room.A.blocked = !st.crust;
    // Mimo sings from where it is: on the islet (a swim away), or by you on the shore
    let lit;
    if (room.mimoOnIsle) {
      const real = { x: M.x, z: M.z }; M.x = root.position.x; M.z = root.position.z;
      G.sim.mimoSay('♪ ' + LEX.form('v.sing') + ' ♪', 2.2); Sound.play('sing');
      lit = room.crystals.filter(c => !c.blocked && c.litT < 1 && Math.hypot(c.x - M.x, c.z - M.z) < 9.0);     // (from the islet, over the water, the song reaches the whole cave)
      lit.forEach(c => { c.litT = 1; }); if (lit.length) Sound.play('chime');
      for (let t = 0; t < 2.2; t += 0.2) { if (CAVES.built) CAVES.built.note(root.position.x, Y0 + 1.5, root.position.z, '#7ff7ea'); await wait(0.2); }
      M.x = real.x; M.z = real.z;
    } else lit = await sing(2.0, 5.0);
    const all = room.crystals.every(c => c.litT >= 1);
    if (!all) {
      quick.sing2 = null;
      const why = !st.crust ? 'The crusted crystal stays dark under its gray shell.' : !room.mimoOnIsle ? '{mimo}’s voice doesn’t carry across the water to the far crystals.' : 'Not every crystal heard it…';
      STORY.think((lit.length ? 'Some crystals lit up! ' : '') + why, 4.5); return;
    }
    G.sim.lock = 1;
    await wait(0.6);
    Sound.play('chime'); Sound.play('crack');
    const gt = room.gateG;
    await tween(1.0, k => { gt.scale.y = 1 - k * 0.95; gt.position.y = Y0 - k * 0.3; });
    gt.visible = false; unsolid(room.gateSolid);
    st.lit2 = true;
    if (room.mimoOnIsle) { root.position.set(room.islet.x - 0.4, Y0 + 0.5, room.islet.z + 0.4); await swimBack(); }
    G.sim.lock = 0; G.save();
    UI.toast('The crystal gate opens!');
    await wakeChepe();
  }
  async function swimBack() {
    const room = rooms[2], M = G.sim.mimo, root = G.cast.mimo.root, Y = G.sim.you, p0 = root.position.clone(), to = { x: Y.x + 1.0, z: Y.z + 0.4 };
    await tween(1.2, k => { root.position.set(lerp(p0.x, to.x, k), Y0 - 0.1 + Math.sin(k * Math.PI) * 0.15, lerp(p0.z, to.z, k)); if (Math.random() < 0.2) G.w3d.fx.puff(root.position.x, Y0 + 0.05, root.position.z, 2, 0.12, '#cfe9f2'); });
    M.x = to.x; M.z = to.z; M.y = M.ry = Y0; M.hidden = false; room.mimoOnIsle = false; Sound.play('land', 4);
  }
  // Chepe wakes up (gray, half-hushed): say how he is, and his words come back
  async function wakeChepe(instant) {
    const room = rooms[2], p = room.chepe; if (!p || !p.root.visible) return;
    p.asleep = false; p.head.rotation.set(0, 0, 0); if (p.set) p.set('lost', true);       // (awake: still sitting, looking around, lost)
    if (instant) return;
    Sound.play('whimper'); G.w3d.fx.sparkle(p.x, p.y + 1.2, p.z, 10, ['#d9d1e2', '#ffffff']);
    await wait(0.4);
    await STORY.you('Someone’s there, in the corner… a miner! The song woke him up.');
  }
  async function chepeTalk() {
    const room = rooms[2], p = room.chepe, d = CAVES.CHEPE, l = G.state.lang, L = CAVES.MINER_LINES.chepe;
    await CAVES.sayT(p, L.hushed, { hush: true, full: true });      // (DESIGN.md 16: the word the Hush left, «perdido», in the language with "lost" under it)
    const r = await UI.command({ name: G.state.mimoName, icon: 'miner', title: `How is ${d.name}? Say it, and he’ll get his words back.`, verbs: [], placeholder: 'say how he is…',
      hint: 'A whole sentence: how is he? (? shows an example)', model: (l === 'zh' || l === 'ja') && typeof CJK !== 'undefined' ? CJK.plain(CAVES.modelOf('lost', 'm', l), { lang: l }) : CAVES.modelOf('lost', 'm', l), modelEn: 'He’s lost.' });
    if (!r || r.cancelled) return;
    const g = CAVES.gradeHelp(r.text, l, d);
    if (!g.state || g.state !== 'lost') { Sound.play('wrong'); STORY.think(g.state ? `${d.name} shakes his head, and looks around the dark cave. That’s not it… where is he? Does he know?` : `Look at ${d.name}: he keeps looking around, as if he doesn’t know where he is…`, 5); return; }
    UI.toast(`${g.letter} · ${g.reason}`); Sound.play(g.letter === 'S' ? 'chest' : 'review');
    const st = G.state.caves || (G.state.caves = {}); st.chepe = g.letter;
    CAVES.restore(p);
    await wait(0.4);
    await CAVES.sayT(p, L.back, { full: true });
    await STORY.you('Go back up to the camp, Chepe. Cande is waiting. We’ll ring the {w.gong}!');
    await tween(0.6, k => { p.root.scale.setScalar(1 - k); });
    p.root.visible = false; p.root.scale.setScalar(1); unsolid(room.chepeSolid);
    G.save();
  }
  async function wakeBoss() {
    const room = rooms[3], st = S(), R = room.R;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x - 3.8, Y0 + 2.8, R.z + 4.6), look: V(room.gong.x, Y0 + 3.4, room.gong.z + 1), dur: 0.8 };
    G.sim.mimoGo({ x: room.gong.x + 0.8, z: room.gong.z + 3.0 }, { x: room.gong.x, z: room.gong.z }); await wait(0.6);
    await sing(2.2, 30);
    // it wakes: shakes, screeches, drops and spreads its wings
    Sound.play('screech');
    const b = room.boss, h = room.hang;
    if (b && b.userData) b.userData.mood = 'alert';
    await tween(0.5, k => { h.rotation.z = Math.sin(k * Math.PI * 6) * 0.12; });
    const rest = room.bossRest || { hy: h.position.y, by: b.position.y };
    await tween(0.6, k => { b.rotation.x = Math.PI * (1 - k); b.position.y = rest.by * (1 - k); h.position.y = lerp(rest.hy, Y0 + 0.3, k); });     // (it drops, flips upright and hovers by the gong)
    Sound.play('screech'); G.w3d.fx.puff(h.position.x, Y0 + 2.4, h.position.z, 14, 0.4, '#8c84a6');
    await STORY.you('It’s awake… and it’s HUGE! Careful, {mimo}: bats repeat whatever you say. Never say the same thing twice!');
    G.cam.override = null; G.sim.lock = 0;
    const r = await G.fight({ foes: [{ kind: 'bat', color: 'red', size: 'big', giant: 2, hp: 26 }, { kind: 'bat', color: 'yellow', size: 'small' }, { kind: 'bat', color: 'green', size: 'small' }], place: { biome: 'cave', x: 88, z: -280 } });
    if (!r || r.outcome !== 'win') {
      await tween(0.4, k => { h.position.y = lerp(Y0 + 0.3, rest.hy, k); b.position.y = rest.by * k; b.rotation.x = Math.PI * k; });
      if (b && b.userData) b.userData.mood = 'asleep';
      STORY.think(r && r.outcome === 'lose' ? 'Ouch… The giant bat flaps back up and folds its wings. Catch your breath, then try again.' : 'The giant bat flaps back up over the gong and wraps itself in its wings.', 5);
      return;
    }
    st.boss = true; if (b) b.visible = false;
    G.w3d.fx.puff(h.position.x, Y0 + 2.4, h.position.z, 20, 0.5, '#c8c6d8'); Sound.play('learned');
    room.crystals.forEach(c => { c.litT = 1; }); lightT = 1;
    await wait(0.5);
    room.page.visible = true; Sound.play('page');
    await STORY.you('Something fluttered down from the dark. A page from Noa’s notebook!');
    G.save();
  }
  async function readPage() {
    const room = rooms[3], st = S();
    Sound.play('page');
    await UI.page('page.caves', 'w.flower');
    st.page = true; room.page.visible = false;
    if (!G.state.pages.includes('page.caves')) G.state.pages.push('page.caves');
    await STORY.you('Noa went on to the Bloom Gardens… We’re right behind you, Noa. First: the {w.gong}!');
    G.save();
  }
  async function ringGong(verb) {
    const room = rooms[3], gg = room.gong, st = S(), M = G.sim.mimo;
    G.sim.lock = 1;
    G.cam.override = { pos: V(gg.x + 4.2, Y0 + 2.6, gg.z + 6.0), look: V(gg.x, Y0 + 2.2, gg.z), dur: 0.8 };
    if (verb === 'v.throw') {
      G.sim.mimoGo({ x: gg.x + 0.6, z: gg.z + 3.2 }, gg); await wait(0.7);
      const pebble = part(GEO.ico1, '#a3a196', [0, 0, 0], [0.16, 0.14, 0.15], { ink: 0.01 }); G.w3d.scene.add(pebble);
      const p0 = V(M.x, Y0 + 0.9, M.z), p1 = V(gg.x, Y0 + 2.1, gg.z + 0.2);
      M.hop = { t: 0 }; Sound.play('whiff');
      await tween(0.5, k => { pebble.position.set(lerp(p0.x, p1.x, k), lerp(p0.y, p1.y, k) + Math.sin(k * Math.PI) * 1.2, lerp(p0.z, p1.z, k)); pebble.rotation.x += 0.4; });
      G.w3d.scene.remove(pebble);
    } else {
      G.sim.mimoGo({ x: gg.x + 0.5, z: gg.z + 1.6 }, gg); await wait(0.6);
      await mimoArc({ x: gg.x + 0.4, z: gg.z + 0.7 }, Y0 + 1.4, 0.6);
      Sound.play('hit');
    }
    for (let k = 0; k < 3; k++) { Sound.play('gong'); gg.swing = 0.35; gg.shake = 1; G.w3d.fx.sparkle(gg.x, Y0 + 2.2, gg.z + 0.4, 18, ['#ffd166', '#fff3a0', '#ffffff']); await wait(1.0); }
    if (verb !== 'v.throw') await mimoLand();
    st.gong = true;
    await wait(0.4);
    G.cam.override = null; G.sim.lock = 0;
    await finale();
  }
  // outside again: the camp lights up, the miners cheer, and the third bell of eight has rung
  async function finale() {
    await UI.fade(1, 700);
    hideAll(); inside = false; G.w3d.setInterior(null); if (lamp) lamp.visible = false;
    teleport(OUTSIDE.x, OUTSIDE.z + 3, 0);
    const f = G.state.flags;
    f.caveFree = true; f.bells = Math.max(3, f.bells || 0);
    const B = CAVES.built;
    if (B) { B.setCamp(true); B.setCrystals(true, true); }
    const hi = WORLD.L.hush.findIndex(h => h.caves); if (hi >= 0) G.w3d.liftHush(hi);
    if (B) for (const p of B.people) { if (p.miner && !p.hidden) { p.look = { x: OUTSIDE.x, z: OUTSIDE.z + 3 }; } }
    G.sim.lock = 1;
    G.cam.override = { pos: V(OUTSIDE.x - 10, CAVES.CAMP.y + 7, OUTSIDE.z + 16), look: V(88, CAVES.CAMP.y + 3, -272) };
    G.cam.snap(0, 0.3, 9);
    await UI.fade(0, 900);
    for (let k = 0; k < 4; k++) { Sound.play('gong'); await wait(1.0); }
    await UI.chapter('The third bell', '3 of 8 · The Quarry Caves sing again');
    G.cam.override = null; G.sim.lock = 0;
    if (B) for (const p of B.people) p.look = null;
    await STORY.you('Listen… the whole {w.mountain} is ringing! Three bells down, five to go. Let’s tell Cande.');
    G.save();
  }

  // ------------------------------------------------------------ moving between rooms, in and out
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    // (a wander spot or station left in the room behind would make Mimo «poof» straight back there: sim.js jumps it to its goal)
    Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + 1.1; M.z = z + 0.8; M.hidden = false; M.wander = null; M.station = null; G.sim.snap();
  }
  function show(i) {
    rooms.forEach((r, k) => { r.g.visible = k === i; }); cur = i; quick = {};
    if (rooms[2]) { rooms[2].mimoOnIsle = false; if (!S().lit2) S().swim = false; }      // (Mimo comes back with you: it has to swim out again)
    const room = rooms[i]; lightT = room && room.crystals.some(c => c.litT >= 1) ? 1 : 0.25; lightK = lightT;
  }
  function hideAll() { rooms.forEach(r => { r.g.visible = false; }); cur = -1; quick = {}; }
  async function enter() {
    build();
    await UI.fade(1, 450);
    inside = true; G.w3d.setInterior({ fog: '#0d0b14', near: 12, far: 34 });
    show(0); const R = ROOMS[0]; teleport(R.x - 4.5, R.z + 3.6, Math.PI); G.cam.snap(Math.PI, 0.66, 10.5);
    if (lamp) lamp.visible = true;
    await UI.fade(0, 450);
    if (!S().seen0) { S().seen0 = true; UI.chapter('The mine', 'The Quarry Caves · the gong is at the very bottom'); STORY.think('It’s so dark down here… just one faint glow, somewhere in the middle.', 5); }
    G.save();
  }
  async function leave() {
    await UI.fade(1, 450);
    hideAll(); inside = false; G.w3d.setInterior(null); if (lamp) lamp.visible = false;
    teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw); G.cam.snap(0, 0.28, 8.5);
    await UI.fade(0, 450);
  }
  async function go(i, from = 'above') {
    await UI.fade(1, 350);
    show(i);
    const R = ROOMS[i], room = rooms[i];
    if (from === 'below') {           // back up from the room below: arrive by its way down
      const at = i === 0 ? { x: room.cart.x, z: R.z - HD + 2.4 } : i === 1 ? { x: room.down.x - 1.4, z: room.down.z + 1.8 } : { x: room.gate.x - 2.2, z: room.gate.z };
      teleport(at.x, at.z, 0);
    } else teleport(R.x - 4.5, R.z + 3.6, Math.PI);
    G.cam.snap(Math.PI, 0.66, 10.5);
    await UI.fade(0, 350);
    const st = S();
    if (!st['seen' + i]) {
      st['seen' + i] = true; UI.chapter(R.name, R.sub);
      if (i === 1 && !st.ambush) {        // the Echo Hall: the bats on the ceiling come down at you
        await wait(1.2);
        Sound.play('screech');
        await STORY.you('Bats! They’re coming down from the ceiling! Remember, {mimo}: never the same thing twice…');
        const r = await G.fight({ foes: [{ kind: 'bat', color: 'blue', size: 'small' }, { kind: 'bat', color: 'red', size: 'small' }, { kind: 'hushling', color: 'green', size: 'small' }], place: { biome: 'cave', x: 88, z: -280 } });
        if (r && r.outcome === 'win') { st.ambush = true; room.crystals.forEach(c => { c.litT = 1; }); lightT = 1; }
        else { st['seen' + i] = false; await go(i - 1, 'below'); return; }
        STORY.think('The rope ladder down the shaft is coiled up on that high ledge…', 5);
      }
      if (i === 2) STORY.think('Water, and three dark crystals: one on the shore under a gray crust, one on the islet, one high on the far wall.', 6);
      if (i === 3) STORY.think('The Gong Hall. Something huge is hanging over the gong…', 4);
    }
    G.save();
  }

  // ------------------------------------------------------------ per frame (while inside)
  function update(dt, t) {
    if (!inside || cur < 0) return;
    const room = rooms[cur], st = S();
    if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    // the dark: the scene's lights dimmed (world3d sets them every frame; this runs after it), warmer when the crystals glow
    if (!lights) { lights = G.w3d.scene.children.filter(o => o.isLight && (o.isHemisphereLight || o.isDirectionalLight)); hemiCol = lights.map(l => l.color.clone()); }
    lightK = damp(lightK, lightT, 1.6, dt);
    lights.forEach((l, i) => { l.intensity *= lerp(0.22, 0.9, lightK); l.color.copy(hemiCol[i]).lerp(new THREE.Color('#b7a8ff'), 0.25 * lightK); });
    if (lamp) { const Y = G.sim.you; lamp.position.set(Y.x, Y.ry + 1.4, Y.z); lamp.material.opacity = 0.5 * (1 - lightK * 0.6); }
    room.crystals.forEach(c => litStep(c, dt, t));
    if (cur === 1) room.bats.forEach((b, i) => { b.rotation.z = Math.sin(t * 1.3 + i) * 0.12; });
    if (cur === 2) {
      if (room.water) room.water.material.emissive.setRGB(0.05 + 0.1 * lightK, 0.16 + 0.12 * lightK, 0.21 + 0.1 * lightK);
      const p = room.chepe;
      if (p && p.root.visible) { if (p.asleep) { p.root.position.set(p.x, p.y, p.z); p.root.rotation.set(0, p.yaw, 0); p.head.rotation.set(0.5 + Math.sin(t * 1.6) * 0.04, 0, 0.18); } else { p.root.rotation.set(0, p.yaw, 0); p.y = Y0; animateChepe(p, dt, t); } }
    }
    if (cur === 3) {
      const gg = room.gong; gg.swing = damp(gg.swing, 0, 1.2, dt); gg.shake = damp(gg.shake, 0, 2.5, dt);
      gg.piv.rotation.x = Math.sin(t * 4) * gg.swing; gg.gong.position.x = Math.sin(t * 60) * 0.03 * gg.shake;
      room.gongGlow.material.opacity = 0.2 * lightK + 0.6 * gg.shake;
      if (room.boss && room.boss.visible && room.boss.userData.animate) {
        room.boss.userData.animate(dt, t, 0);
        if (room.boss.userData.mood === 'asleep' && room.boss.children[0]) room.boss.children[0].position.y = room.bossInnerY;     // (asleep on its beam: no hover bob)
      }
      if (room.page.visible) room.pageGlow.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
    }
  }
  function animateChepe(p, dt, t) {
    const Y = G.sim.you, near = Math.hypot(Y.x - p.x, Y.z - p.z) < 6;
    p.yaw = dampAngle(p.yaw, near ? Math.atan2(Y.x - p.x, Y.z - p.z) : p.baseYaw, 4, dt);
    p.root.position.set(p.x, p.y + (p.talking ? Math.abs(Math.sin(t * 13)) * 0.03 : 0), p.z); p.root.rotation.y = p.yaw;
    p.head.rotation.y = p.gray ? Math.sin(t * 0.9) * 0.6 : 0;
  }

  return {
    init(game) { G = game; },
    enter, leave, update, interactables, target, ROOMS, OUTSIDE,
    get inside() { return inside; }, get room() { return cur; },
    _: { rooms, go, S, build, applyState, sing, finale, wakeBoss, ringGong, singPool, lightGallery, rollCart, kickLadder, breakCrust, swimOut, chepeTalk },
  };
})();
