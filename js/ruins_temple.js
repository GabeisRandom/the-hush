'use strict';
// The Sunken Temple (DESIGN.md 17.1, region 7; game/REGIONS.md): the Sunken Ruins' dungeon, under the sand behind the Door of
// Days. Four halls built like the sea fort's: high up and out of sight at y = 300 (x 262; z 50 / 22 / −6 / −34, 14 × 12, at
// least 26 from every other room: game/SIDES.md), walls facing in (the camera looks in from outside), one hall at a time, and
// every action a sentence to Mimo (once a verb has worked on a thing in a hall, E repeats it). Each solved puzzle chimes
// (BFX.solved()) and the way on visibly opens, with a prompt.
//   0 the Sand Hall:        sand worms burst out of the floor (a fight: hit them when they're up, or «¡Cava!»); the stairs
//                           down are buried under a heap of sand: dig («¡Cava!»), and the steps show
//   1 the Drowned Hall:     water across the hall; the bridge is raised on the far side, its crank over there: swim («¡Nada!»),
//                           Mimo turns the crank and the bridge comes down
//   2 the Keeper's Chamber: the bell keeper's room (her bed, her basin, her comb). Three carved tiles of her morning by the
//                           sealed stairs: say what she does in each («Se levanta.» «Se lava la cara.» «Se peina.»: the
//                           reflexive, third person, after reading the Wall of Days); three right, the seal sinks
//   3 the Bell Chamber:     the bell over a pit of sand where something sleeps. Dig («¡Cava!»): the Great Worm wakes (the boss,
//                           opts.boss 'worm': ruins_battle.js), Noa's page (the Gray Marsh), then ring the bell («¡Golpea la
//                           campana!», or a call or a throw). Outside, the canyon gets its color back: the seventh bell.
//   RUINS_TEMPLE.init(game) · enter() · leave() · update(dt, t) · interactables() · target() · inside · OUTSIDE (the door)
// Progress lives in state.ruinsT; flags.ruinsFree and flags.bells = 7 when the bell rings (ruins_scenes.js's sync lifts the gray).
const RUINS_TEMPLE = (() => {
  let G = null, built = false;
  const { part, G: GEO } = TK;
  const Y0 = 300, HW = 7, HD = 6, WH = 5.8, X0 = 262;
  const ROOMS = [
    { id: 'sand', name: 'The Sand Hall', sub: 'The Sunken Temple · under the Door of Days', x: X0, z: 50 },
    { id: 'water', name: 'The Drowned Hall', sub: 'The Sunken Temple · down the stairs', x: X0, z: 22 },
    { id: 'keeper', name: 'The Keeper’s Chamber', sub: 'The Sunken Temple · the bell keeper’s room', x: X0, z: -6 },
    { id: 'bell', name: 'The Bell Chamber', sub: 'The Sunken Temple · the seventh bell', x: X0, z: -34 },
  ];
  const OUTSIDE = RUINS.OUTSIDE;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = () => G.state.ruinsT || (G.state.ruinsT = {});
  const ex = w => (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const verbs = () => ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing', 'v.climb', 'v.blow', 'v.call', 'v.dig'].filter(id => LEX.item(id));
  const has = id => !!LEX.item(id);
  const lang = () => G.state.lang || 'es';
  const cjk = l => l === 'zh' || l === 'ja';
  const plainOf = src => (cjk(lang()) && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(src, { lang: lang() }) : src);
  let inside = false, cur = -1, quick = {};
  const rooms = [];
  const Kit = () => GARDENS.Kit(), KG = () => GARDENS.GEO;
  const FIGHT_AT = { biome: 'temple', x: RUINS.TEMPLE.x, z: RUINS.TEMPLE.z };
  const solved = () => { try { if (typeof BFX !== 'undefined' && BFX.solved) BFX.solved(); else Sound.play('chest'); } catch (e) { /* (no sound) */ } };
  const unsolid = o => { if (!o) return; o.x = o.z = 1e5; };
  // the three tiles of her morning (the Wall of Days' first three carvings), and what to say about each
  const TILES = [{ key: 'getup', panel: 0 }, { key: 'wash', panel: 1 }, { key: 'comb', panel: 2 }];
  const TILE_EN = { getup: 'the bell keeper stretching by her bed, the sun coming up', wash: 'the bell keeper at the fountain, water in her hands', comb: 'the bell keeper with a long comb in her hair' };

  // ---------------------------------------------------------------- materials: sandstone in courses, a floor of flags, sand
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const stone = tex(256, 256, c => {
      const R = rng(77); c.fillStyle = '#c99a68'; c.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) { const off = (y % 2) * 26; c.fillStyle = ['#d4a676', '#c09060', '#dbb284', '#b98a5a'][(x + y * 3) % 4]; c.fillRect(x * 52 + off - 52 + 2, y * 32 + 2, 48, 28); c.fillRect(x * 52 + off + 208 - 256 + 2, y * 32 + 2, 48, 28); }
      c.fillStyle = 'rgba(120,80,40,0.25)'; for (let k = 0; k < 14; k++) { const x = R() * 240, y = R() * 200; c.fillRect(x, y, 6 + R() * 10, 2); }      // (worn carvings)
      c.fillStyle = 'rgba(226,192,136,0.5)'; for (let k = 0; k < 30; k++) { c.beginPath(); c.ellipse(R() * 256, 226 + R() * 30, 8 + R() * 22, 4 + R() * 8, 0, 0, TAU); c.fill(); }      // (sand drifted low on the wall)
      c.strokeStyle = 'rgba(90,60,30,0.35)'; c.lineWidth = 3; for (let y = 0; y <= 256; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
    }, 3, 1.4);
    const floor = tex(256, 256, c => {
      c.fillStyle = '#b8915a'; c.fillRect(0, 0, 256, 256);
      const R = rng(19); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = ['#c49c66', '#ae8650', '#cfa872', '#b48c56'][(x * 3 + y) % 4]; c.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); }
      c.fillStyle = 'rgba(233,201,141,0.35)'; for (let k = 0; k < 50; k++) c.fillRect(R() * 256, R() * 256, 3 + R() * 9, 2 + R() * 4);
    }, 3, 3);
    MAT = { stone: new THREE.MeshToonMaterial({ map: stone, gradientMap: TK.grad }), floor: new THREE.MeshToonMaterial({ map: floor, gradientMap: TK.grad }), hole: new THREE.MeshBasicMaterial({ color: '#140f0c' }),
      water: new THREE.MeshToonMaterial({ color: '#3f8fa8', gradientMap: TK.grad, transparent: true, opacity: 0.86, emissive: new THREE.Color('#0d2a34') }) };
    return MAT;
  }
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(s); return sp; };
  // a brazier on a stand: a dish of embers and a warm glow (flickers in update)
  function brazier(g, k, x, z, list) {
    k.add(KG().cyl, x, Y0 + 0.5, z, 0.12, 1.0, 0.12, '#5a4a3a', { ink: 0.01 }).add(KG().cyl, x, Y0 + 1.05, z, 0.4, 0.14, 0.4, '#3a3030', { ink: 0.012 }).add(KG().sphere, x, Y0 + 1.12, z, 0.3, 0.1, 0.3, '#f2a65a', { ink: 0 });
    const gl = glow('#ffb35a', 1.8, 0.6); gl.position.set(x, Y0 + 1.4, z); g.add(gl); list.push(gl);
  }

  // ---------------------------------------------------------------- the halls' shell: sandstone walls facing in, beams, the way back up
  function shell(R, g, room) {
    const M = mats();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, 0.4, HD * 2), M.floor); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
    [[0, -HD, 0, HW * 2], [0, HD, Math.PI, HW * 2], [-HW, 0, Math.PI / 2, HD * 2], [HW, 0, -Math.PI / 2, HD * 2]].forEach(([dx, dz, ry, w]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), M.stone); m.position.set(R.x + dx, Y0 + WH / 2, R.z + dz); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    });
    const k = Kit(), GG = KG(), RR = rng(Math.round(R.z * 7 + 101));
    for (const x of [-5.2, 5.2]) k.add(GG.cyl, R.x + x, Y0 + WH / 2, R.z - HD + 0.5, 0.42, WH, 0.42, '#d9a46a', { ink: 0.02 }).box(R.x + x, Y0 + 0.15, R.z - HD + 0.5, 1.0, 0.3, 1.0, '#b98a5a', { ink: 0.015 });
    k.box(R.x, Y0 + WH - 0.25, R.z - HD + 0.4, HW * 2 - 0.4, 0.4, 0.5, '#a87850', { ink: 0.02 });
    // sand drifted into the corners
    for (let i = 0; i < 8; i++) { const x = R.x + (RR() < 0.5 ? -1 : 1) * (HW - 0.8 - RR() * 1.4), z = R.z + (RR() < 0.5 ? -1 : 1) * (HD - 0.8 - RR() * 1.0); k.add(GG.sphere, x, Y0 + 0.05, z, 0.6 + RR() * 0.6, 0.2 + RR() * 0.2, 0.5 + RR() * 0.4, '#d9bb88', { ink: 0.008 }); }
    room.lights = [];
    brazier(g, k, R.x - 5.6, R.z + 4.4, room.lights); brazier(g, k, R.x + 5.6, R.z + 4.4, room.lights);
    k.build(g);
    // the way back up: a stair hole at the front, on the left
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), M.hole); door.rotation.x = -Math.PI / 2; door.position.set(R.x - 4.5, Y0 + 0.012, R.z + HD - 0.7); g.add(door);
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - HD - 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: R.x, z: R.z + HD + 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 },
      { obox: 1, x: R.x - HW - 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }, { obox: 1, x: R.x + HW + 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 },
      { x: R.x - 5.6, z: R.z + 4.4, r: 0.45 }, { x: R.x + 5.6, z: R.z + 4.4, r: 0.45 }]);
    WORLD.addPlatforms([{ box: [R.x - HW, R.x + HW, R.z - HD, R.z + HD], top: Y0 }]);
  }
  // a doorway in the back wall (dark), its steps going down into it
  function doorway(g, R, x, w = 1.8, h = 2.6) {
    const d = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mats().hole); d.position.set(x, Y0 + h / 2, R.z - HD + 0.03); g.add(d);
    const k = Kit(); k.box(x, Y0 + h + 0.2, R.z - HD + 0.2, w + 0.7, 0.4, 0.4, '#a87850', { ink: 0.015 }); for (const s of [-1, 1]) k.box(x + s * (w / 2 + 0.18), Y0 + h / 2, R.z - HD + 0.2, 0.36, h, 0.4, '#b98a5a', { ink: 0.015 }); k.build(g);
    return d;
  }

  // ---------------------------------------------------------------- build the four halls (on first entry)
  function build() {
    if (built) return; built = true;
    const scene = G.w3d.scene, GG = KG();
    ROOMS.forEach((R, i) => { const g = new THREE.Group(); g.visible = false; g.ri = i; scene.add(g); rooms[i] = { R, g }; shell(R, g, rooms[i]); });
    // 0 · the Sand Hall: the stairs down at the back, buried under a heap of sand that poured in through a crack above
    {
      const room = rooms[0], R = room.R, g = room.g, k = Kit();
      room.stairs = { x: R.x + 1.6, z: R.z - HD + 0.4 };
      doorway(g, R, room.stairs.x, 2.0, 2.6);
      for (let i = 0; i < 4; i++) k.box(room.stairs.x, Y0 + 0.12 + i * 0.18, R.z - HD + 1.5 - i * 0.3, 1.8, 0.24, 0.3, '#a87850', { ink: 0.01 });
      // the crack in the ceiling with a trickle of sand, broken columns, a toppled statue's head
      k.box(R.x + 1.6, Y0 + WH - 0.05, R.z - 3.0, 1.2, 0.1, 0.3, '#2a1f1a', { ry: 0.4, ink: 0 });
      k.add(GG.cyl, R.x - 3.2, Y0 + 0.9, R.z - 2.6, 0.45, 1.8, 0.45, '#d9a46a', { ink: 0.02 }).add(GG.cyl, R.x - 2.4, Y0 + 0.4, R.z - 1.4, 0.4, 1.4, 0.4, '#c99a68', { rz: Math.PI / 2, ry: 0.4, ink: 0.02 });
      k.add(GG.sphere, R.x + 4.4, Y0 + 0.7, R.z + 0.6, 0.8, 0.85, 0.75, '#d99460', { ry: -0.8, ink: 0.025 }).box(R.x + 4.0, Y0 + 0.6, R.z + 1.1, 0.25, 0.45, 0.3, '#c98e5a', { ry: -0.8, ink: 0.01 });
      k.build(g);
      WORLD.extra.push({ x: R.x - 3.2, z: R.z - 2.6, r: 0.5 }, { obox: 1, x: R.x - 2.4, z: R.z - 1.4, hw: 0.75, hd: 0.45, rot: 0.4 }, { x: R.x + 4.4, z: R.z + 0.6, r: 0.9 });
      const heap = grp(g, room.stairs.x, Y0, R.z - HD + 1.6), hk = Kit(), RR = rng(3);
      hk.add(GG.sphere, 0, 0.2, 0, 2.2, 1.9, 1.6, '#e2c088', { ink: 0.025 });
      for (let i = 0; i < 5; i++) { const a = RR() * TAU; hk.add(GG.sphere, Math.cos(a) * 1.4, 0.4 + RR() * 0.6, Math.sin(a) * 0.9 + 0.4, 0.8 + RR() * 0.5, 0.6 + RR() * 0.3, 0.7, RR() < 0.5 ? '#e2c088' : '#cfa86c', { ink: 0.015 }); }
      hk.build(heap); room.heap = heap;
      room.heapSolid = { obox: 1, x: room.stairs.x, z: R.z - HD + 1.6, hw: 2.0, hd: 1.4, rot: 0 }; WORLD.extra.push(room.heapSolid);
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, WH - 2.4, 6), new THREE.MeshBasicMaterial({ color: '#e9cf98', transparent: true, opacity: 0.7 })); tr.position.set(R.x + 1.6, Y0 + 2.4 + (WH - 2.4) / 2, R.z - 3.0); g.add(tr); room.trickle = tr;
    }
    // 1 · the Drowned Hall: water across the middle; the bridge raised on the far side, its crank on a ledge over there
    {
      const room = rooms[1], R = room.R, g = room.g, k = Kit();
      room.pool = { x: R.x, z: R.z - 1.2, w: HW * 2 - 0.4, d: 3.4 };
      const water = new THREE.Mesh(new THREE.PlaneGeometry(room.pool.w, room.pool.d), mats().water); water.rotation.x = -Math.PI / 2; water.position.set(room.pool.x, Y0 + 0.04, room.pool.z); g.add(water); room.water = water;
      for (const s of [-1, 1]) k.box(room.pool.x, Y0 + 0.1, room.pool.z + s * (room.pool.d / 2 + 0.12), room.pool.w, 0.2, 0.24, '#a87850', { ink: 0.01 });
      room.waterSolid = { obox: 1, x: room.pool.x, z: room.pool.z, hw: room.pool.w / 2, hd: room.pool.d / 2, rot: 0 }; WORLD.extra.push(room.waterSolid);
      // the bridge: a stone slab hinged on the far bank, standing up until the crank lets it down
      room.bridgeX = R.x + 1.2;
      const br = grp(g, room.bridgeX, Y0 + 0.1, room.pool.z - room.pool.d / 2), bk = Kit();
      bk.box(0, 0, room.pool.d / 2, 1.8, 0.2, room.pool.d + 0.2, '#c99a68', { ink: 0.02 }); for (const s of [-1, 1]) bk.box(s * 0.85, 0.2, room.pool.d / 2, 0.1, 0.3, room.pool.d + 0.2, '#a87850', { ink: 0.008 });
      bk.build(br); br.rotation.x = -1.35; room.bridge = br;
      // the crank on the far side, and the doorway down beyond it
      room.crank = { x: R.x + 4.6, z: R.z - 3.9 };
      k.box(room.crank.x, Y0 + 0.5, room.crank.z, 1.2, 1.0, 1.0, '#b98a5a', { ink: 0.015 });
      const cg = grp(g, room.crank.x, Y0 + 1.1, room.crank.z), ck = Kit(); ck.add(GG.cyl, 0, 0, 0, 0.32, 0.1, 0.32, '#5a4a3a', { rx: Math.PI / 2, ink: 0.01 }).box(0.22, 0.1, 0.06, 0.08, 0.5, 0.08, '#8a6440', { ink: 0.006 }); ck.build(cg); room.crankG = cg;
      room.stairs = { x: R.x - 1.4, z: R.z - HD + 0.4 };
      doorway(g, R, room.stairs.x, 1.8, 2.5);
      // a carved fish frieze along the walls, reeds in the water
      for (let i = 0; i < 9; i++) k.add(GG.cyl6, R.x - 6 + i * 1.5, Y0 + 0.3, room.pool.z + (i % 2 ? 1.2 : -1.3), 0.03, 0.7, 0.03, '#7a9a4a', { ink: 0 });
      for (let i = 0; i < 6; i++) k.add(GG.sphere, R.x - 5 + i * 2, Y0 + 3.6, R.z - HD + 0.12, 0.35, 0.16, 0.02, '#a87850', { ink: 0.006 });
      k.build(g);
    }
    // 2 · the Keeper's Chamber: her bed, her basin, her comb on a shelf; the three tiles of her morning; the sealed stairs
    {
      const room = rooms[2], R = room.R, g = room.g, k = Kit();
      k.box(R.x - 4.6, Y0 + 0.35, R.z + 1.6, 1.6, 0.5, 2.8, '#8a6440', { ink: 0.015 }).box(R.x - 4.6, Y0 + 0.65, R.z + 1.6, 1.4, 0.16, 2.6, '#e9e0c8', { ink: 0.008 }).box(R.x - 4.6, Y0 + 0.78, R.z + 0.55, 1.0, 0.18, 0.5, '#f4efe2', { ink: 0.006 });
      k.add(GG.cyl, R.x + 4.8, Y0 + 0.5, R.z + 2.0, 0.55, 0.3, 0.55, '#9aa4ae', { ink: 0.012 }).add(GG.cyl6, R.x + 4.8, Y0 + 0.2, R.z + 2.0, 0.12, 0.4, 0.12, '#5a4a3a', { ink: 0 }).add(GG.cyl, R.x + 4.8, Y0 + 0.62, R.z + 2.0, 0.45, 0.02, 0.45, '#7fc4dc', { ink: 0 });
      k.box(R.x + 5.4, Y0 + 1.4, R.z - 0.2, 0.5, 0.08, 1.6, '#8a6440', { ink: 0.01 }).box(R.x + 5.4, Y0 + 1.5, R.z - 0.4, 0.3, 0.06, 0.12, '#d9a24a', { ink: 0.004 });
      k.box(R.x - 5.2, Y0 + 0.45, R.z - 1.4, 1.0, 0.9, 1.4, '#7a5434', { ink: 0.015 }).box(R.x - 5.2, Y0 + 0.92, R.z - 1.4, 1.04, 0.08, 1.44, '#5a3a24', { ink: 0.01 });
      k.build(g);
      WORLD.extra.push({ obox: 1, x: R.x - 4.6, z: R.z + 1.6, hw: 0.85, hd: 1.45, rot: 0 }, { x: R.x + 4.8, z: R.z + 2.0, r: 0.6 }, { obox: 1, x: R.x - 5.2, z: R.z - 1.4, hw: 0.55, hd: 0.75, rot: 0 });
      // the tiles on the back wall (her morning: up with the sun, the fountain, her comb)
      room.tiles = TILES.map((T0, i) => {
        const x = R.x - 4.2 + i * 2.8, cv = document.createElement('canvas'); cv.width = 256; cv.height = 320;
        RUINS.drawPanel(cv.getContext('2d'), T0.panel, 256, 320);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.1), new THREE.MeshToonMaterial({ map: new THREE.CanvasTexture(cv), gradientMap: TK.grad, emissive: new THREE.Color('#000000') }));
        m.position.set(x, Y0 + 2.2, R.z - HD + 0.05); g.add(m);
        const gl = glow('#ffd166', 2.6, 0); gl.position.set(x, Y0 + 2.2, R.z - HD + 0.3); g.add(gl);
        return { key: T0.key, x, z: R.z - HD + 1.6, mesh: m, glow: gl };
      });
      room.stairs = { x: R.x + 4.6, z: R.z - HD + 0.4 };
      doorway(g, R, room.stairs.x, 1.6, 2.4);
      const seal = grp(g, room.stairs.x, Y0, R.z - HD + 0.28), sk = Kit(); sk.box(0, 1.25, 0, 1.8, 2.5, 0.3, '#b8844e', { ink: 0.02 }); sk.add(GG.cyl, 0, 1.6, 0.17, 0.35, 0.05, 0.35, '#8f6a3a', { rx: Math.PI / 2, ink: 0.006 }); sk.build(seal); room.seal = seal;
      room.sealSolid = { obox: 1, x: room.stairs.x, z: R.z - HD + 0.5, hw: 0.95, hd: 0.3, rot: 0 }; WORLD.extra.push(room.sealSolid);
    }
    // 3 · the Bell Chamber: the bell on its beam, a pit of sand under it where the Great Worm sleeps, Noa's page after
    {
      const room = rooms[3], R = room.R, g = room.g, k = Kit();
      const bx = R.x, bz = R.z - 3.2;
      for (const s of [-1, 1]) k.add(GG.cyl6, bx + s * 1.8, Y0 + 2.3, bz, 0.2, 4.6, 0.2, '#6b4a30', { ink: 0.02 });
      k.box(bx, Y0 + 4.6, bz, 4.2, 0.36, 0.44, '#5a3a24', { ink: 0.02 });
      k.build(g);
      WORLD.extra.push({ obox: 1, x: bx, z: bz, hw: 2.1, hd: 0.5, rot: 0 });
      const piv = grp(g, bx, Y0 + 4.45, bz), bell = new THREE.Group(); piv.add(bell);
      const lp = [[0.9, -1.95], [0.86, -1.82], [0.58, -1.2], [0.44, -0.4], [0.25, 0]].map(([x, y]) => new THREE.Vector2(x, y));
      const bellMat = new THREE.MeshToonMaterial({ color: '#8f8c9a', gradientMap: TK.grad });
      const bm = new THREE.Mesh(new THREE.LatheGeometry(lp, 24), bellMat); bm.castShadow = true; bell.add(bm);
      bell.add(part(GEO.sphere, '#5f5c6a', [0, -1.88, 0], [0.16, 0.16, 0.16], { ink: 0.01 }));
      room.bell = { piv, bell, mat: bellMat, x: bx, z: bz, swing: 0 };
      // the pit: a wide mound of sand in front of the bell (the boss under it: a model from ruins_battle.js, asleep, mostly buried)
      room.pit = { x: R.x - 0.4, z: R.z + 0.4 };
      const pitG = grp(g, room.pit.x, Y0, room.pit.z), pk = Kit(); pk.add(KG().sphere, 0, 0.05, 0, 2.4, 0.6, 1.9, '#e2c088', { ink: 0.02 }); pk.build(pitG); room.pitMesh = pitG;
      let boss = null;
      if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) { try { boss = BATTLE.buildFoe('worm', 'yellow', { size: 'big', mood: 'asleep' }); } catch (e) { console.warn('[ruins temple] boss model', e); boss = null; } }
      if (boss) { boss.scale.setScalar(2.2); boss.position.set(room.pit.x, Y0 - 1.6, room.pit.z); boss.rotation.y = 0.3; g.add(boss); }
      room.boss = boss; room.bossSolid = { x: room.pit.x, z: room.pit.z, r: 2.0 }; WORLD.extra.push(room.bossSolid);
      // Noa's page (it flutters down after the fight)
      room.page = grp(g, R.x + 4.6, Y0, R.z + 1.8); room.page.visible = false;
      room.page.add(part(GEO.box, '#8a5f3e', [0, 0.65, 0], [0.16, 1.3, 0.16], { ink: 0 }));
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ color: '#fffaf0', side: THREE.DoubleSide })); sheet.position.set(0, 1.05, 0.1); sheet.rotation.z = 0.08; room.page.add(sheet);
      const pg = glow('#fff3b0', 1.3, 0.5); pg.position.set(0, 1.05, 0.15); room.page.add(pg); room.pageGlow = pg;
    }
    applyState();
  }
  // after a load: each hall as the saved progress says
  function applyState() {
    const st = S(), r0 = rooms[0], r1 = rooms[1], r2 = rooms[2], r3 = rooms[3];
    if (st.stairs) { r0.heap.visible = false; unsolid(r0.heapSolid); r0.trickle.visible = false; }
    if (st.bridge) { r1.bridge.rotation.x = 0; r1.crankG.rotation.z = Math.PI * 3; bridgeOpen(); }
    (st.tiles || []).forEach(k => { const T0 = r2.tiles.find(t => t.key === k); if (T0) lightTile(T0); });
    if (st.seal) { r2.seal.position.y = Y0 - 2.6; unsolid(r2.sealSolid); }
    if (st.boss) { if (r3.boss) r3.boss.visible = false; unsolid(r3.bossSolid); r3.page.visible = !st.page; r3.pitMesh.scale.y = 0.4; }
    if (st.bell) r3.bell.mat.color.set('#e6b54a');
  }
  // the bridge down: the water's solid splits round it, so you walk across on the slab
  function bridgeOpen() {
    const r1 = rooms[1], P0 = r1.pool, bx = r1.bridgeX, left = (bx - 0.95) - (P0.x - P0.w / 2), right = (P0.x + P0.w / 2) - (bx + 0.95);
    unsolid(r1.waterSolid);
    WORLD.extra.push({ obox: 1, x: P0.x - P0.w / 2 + left / 2, z: P0.z, hw: left / 2, hd: P0.d / 2, rot: 0 }, { obox: 1, x: bx + 0.95 + right / 2, z: P0.z, hw: right / 2, hd: P0.d / 2, rot: 0 });
  }
  function lightTile(T0) { T0.lit = true; T0.mesh.material.emissive.set('#4a3510'); }

  // ---------------------------------------------------------------- telling Mimo (the verb is the key, as in the fort)
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${G.state.mimoName} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  // t: { kind, verb (or verbs), icon, title, hint, right(verb), at() }
  async function tell(t) {
    const ok = (t.verbs || [t.verb]).filter(has);
    let verb = quick[t.kind] || null, ms = 0;
    if (!verb) {
      const r = await UI.command({ name: G.state.mimoName, icon: t.icon, title: t.title, verbs: verbs(), answer: ok[0] });
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
    const say = s => STORY.think(s, 3.5);
    if (verb === 'v.jump') { M.hop = { t: 0 }; Sound.play('jump'); say('{mimo} hops up and down. Nothing happens.'); }
    else if (verb === 'v.hit') { Sound.play('hit'); M.sad = 1.2; say('{mimo} bonks it. Ouch! Old sandstone is hard.'); }
    else if (verb === 'v.throw') { Sound.play('whiff'); say('{mimo} throws a pebble at it. Clack. Nothing.'); }
    else if (verb === 'v.push') { Sound.play('land', 6); say('{mimo} pushes with all its might. It doesn’t budge.'); }
    else if (verb === 'v.swim') say('{mimo} looks for water to swim in. Not here.');
    else if (verb === 'v.sing') { Sound.play('sing'); say('{mimo} sings. The temple echoes… but nothing changes.'); }
    else if (verb === 'v.blow') { Sound.play('blow'); say('{mimo} blows. A little sand flies up… and settles again.'); }
    else if (verb === 'v.climb') say('{mimo} looks for something to climb. Not here.');
    else if (verb === 'v.call') { Sound.play('chirp'); say('{mimo} calls. Its voice echoes down the halls… but nothing changes.'); }
    else if (verb === 'v.dig') say('{mimo} paws at the stone floor. Stone isn’t sand!');
    else if (verb === 'v.eat') say('{mimo} sniffs it… and decides it isn’t food.');
    G.sim.mimoGo(null, null);
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
  // Mimo digs, here (the same paws as outdoors)
  async function dig(at, look, sec) { if (RUINS.mimoDig) return RUINS.mimoDig(at, look, sec); }

  // ---------------------------------------------------------------- what you can press E on, hall by hall
  function interactables() {
    const list = [], st = S(), room = rooms[cur]; if (!room) return list;
    const R = room.R, name = G.state.mimoName, y = Y0;
    const say = kind => (quick[kind] ? `«${ex(LEX.form(quick[kind]))}»` : `Tell ${name}`);
    list.push({ x: R.x - 4.5, z: R.z + HD - 0.9, y, r: 1.6, label: cur === 0 ? 'Leave the temple' : 'Go back up', run: () => (cur === 0 ? leave() : go(cur - 1, 'below')) });
    if (cur === 0) {
      if (!st.stairs) list.push({ x: room.stairs.x, z: room.stairs.z + 3.4, y, r: 2.6, label: say('heap'), run: () => tell({ kind: 'heap', verb: 'v.dig', icon: 'dig', at: () => ({ x: room.stairs.x, z: room.stairs.z + 2.2 }),
        title: `A heap of sand has poured in through a crack, right over the stairs down. What should ${name} do?`, hint: 'Fermín showed {mimo} what to do with sand…', right: digHeap }) });
      else list.push({ x: room.stairs.x, z: room.stairs.z + 1.6, y, r: 2.0, label: 'Go down the stairs', run: () => go(1) });
    }
    if (cur === 1) {
      if (!st.bridge) list.push({ x: room.pool.x - 2, z: room.pool.z + room.pool.d / 2 + 0.8, y, r: 2.8, label: say('pool'), run: () => tell({ kind: 'pool', verb: 'v.swim', icon: 'swim', at: () => ({ x: room.pool.x, z: room.pool.z + room.pool.d / 2 }),
        title: `Water fills the middle of the hall. On the far side the bridge stands up on end, and its crank is over there too. What should ${name} do?`, hint: 'Lalo, at the lake, showed {mimo} how to cross water…', right: swimCrank }) });
      else list.push({ x: room.stairs.x, z: room.stairs.z + 1.6, y, r: 2.0, label: 'Go down the stairs', run: () => go(2) });
    }
    if (cur === 2) {
      if (!st.seal) for (const T0 of room.tiles) if (!T0.lit) list.push({ x: T0.x, z: T0.z, y, r: 1.5, label: 'Say what she does', run: () => tileScene(T0) });
      if (st.seal) list.push({ x: room.stairs.x, z: room.stairs.z + 1.6, y, r: 2.0, label: 'Go down the stairs', run: () => go(3) });
    }
    if (cur === 3) {
      if (!st.boss) list.push({ x: room.pit.x + 1.2, z: room.pit.z + 2.6, y, r: 2.8, label: say('pit'), run: () => tell({ kind: 'pit', verbs: ['v.dig', 'v.hit', 'v.call', 'v.sing', 'v.blow', 'v.throw'], icon: 'dig', at: () => room.pit,
        title: `A pit of sand lies under the bell. Something big is breathing under it… What should ${name} do?`, hint: 'Something is asleep under that sand…', right: wakeBoss }) });
      else if (!st.page) list.push({ x: room.page.position.x, z: room.page.position.z + 0.6, y, r: 2.0, label: 'Read', run: readPage });
      else if (!st.bell) list.push({ x: room.bell.x, z: room.bell.z + 2.2, y, r: 2.8, label: say('bell'), run: () => tell({ kind: 'bell', verbs: ['v.hit', 'v.call', 'v.throw'], icon: 'bell', at: () => ({ x: room.bell.x, z: room.bell.z + 1.4 }),
        title: `The temple’s bell hangs silent over the pit. What should ${name} do?`, hint: 'A bell rings when something strikes it…', right: ringBell }) });
    }
    return list;
  }
  // where the compass points inside: the next thing to do in this hall
  function target() {
    const st = S(), room = rooms[cur]; if (!room) return null;
    const at = (o, hint) => (o ? { x: o.x, z: o.z, hint } : null);
    if (cur === 0) return !st.stairs ? at({ x: room.stairs.x, z: room.stairs.z + 1.6 }, '{mimo} points at the heap of sand over the stairs.') : at(room.stairs, '{mimo} points down the stairs!');
    if (cur === 1) return !st.bridge ? at(room.crank, '{mimo} looks across the water at the crank.') : at(room.stairs, '{mimo} points down the stairs!');
    if (cur === 2) { if (!st.seal) { const T0 = room.tiles.find(t => !t.lit); return at(T0, '{mimo} points at a carved tile: what is she doing?'); } return at(room.stairs, '{mimo} points down the stairs!'); }
    if (cur === 3) return !st.boss ? at(room.pit, '{mimo} stares at the pit of sand. It’s breathing…') : !st.page ? at(room.page.position, '{mimo} points at the page.') : at(room.bell, '{mimo} looks up at the bell.');
    return null;
  }

  // ---------------------------------------------------------------- the actions
  async function digHeap() {
    const room = rooms[0], st = S(), R = room.R, at = { x: room.stairs.x + 0.4, z: room.stairs.z + 3.4 };
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x + 1.4, Y0 + 4.2, R.z + 6.4), look: V(room.stairs.x, Y0 + 1.0, room.stairs.z + 1.4), dur: 0.8 };
    await dig(at, { x: room.stairs.x, z: room.stairs.z + 1.6 }, 2.2);
    Sound.play('poof');
    await tween(1.4, k => { room.heap.scale.set(1 + k * 0.2, Math.max(0.02, 1 - k), 1 + k * 0.2); room.trickle.material.opacity = 0.7 * (1 - k); });
    room.heap.visible = false; room.trickle.visible = false; unsolid(room.heapSolid); solved();
    st.stairs = true; G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    UI.toast('The sand is gone: stairs go down, deeper into the temple!');
  }
  async function swimCrank() {
    const room = rooms[1], st = S(), M = G.sim.mimo, root = G.cast.mimo.root, C0 = room.crank, R = room.R, P0 = room.pool;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x - 0.8, Y0 + 4.4, R.z + 6.8), look: V(R.x + 2.4, Y0 + 0.6, R.z - 2.0), dur: 0.8 };
    const sx = P0.x + 2.4, sz = P0.z + P0.d / 2 + 0.4;
    G.sim.mimoGo({ x: sx, z: sz + 0.4 }, C0); await wait(0.6);
    M.hidden = true; Sound.play('jump');
    const p0 = root.position.clone(), wy = Y0 + 0.02, end = { x: C0.x - 0.6, z: P0.z - P0.d / 2 - 0.3 };
    await tween(1.5, k => { root.position.set(lerp(p0.x, end.x, k), wy - 0.1 + Math.sin(k * 24) * 0.04, lerp(p0.z, end.z, k)); root.rotation.set(0.35, Math.atan2(end.x - p0.x, end.z - p0.z), 0); if (Math.random() < 0.25) G.w3d.fx.puff(root.position.x, wy + 0.05, root.position.z, 2, 0.12, '#dff2fb'); });
    root.rotation.set(0, 0, 0);
    await tween(0.4, k => { root.position.set(lerp(end.x, C0.x - 0.5, k), lerp(wy, Y0 + 1.0, k) + Math.sin(k * Math.PI) * 0.4, lerp(end.z, C0.z + 0.5, k)); });
    Sound.play('pip'); Sound.play('gears');
    await tween(1.4, k => { room.crankG.rotation.z = k * Math.PI * 3; room.bridge.rotation.x = lerp(-1.35, 0, k * k); });
    Sound.play('land', 8); G.w3d.fx.puff(room.bridgeX, Y0 + 0.2, P0.z, 10, 0.3, '#dff2fb');
    bridgeOpen(); solved();
    // back over the bridge
    const back = { x: room.bridgeX + 0.6, z: P0.z + P0.d / 2 + 0.8 };
    await tween(0.9, k => { root.position.set(lerp(C0.x - 0.5, back.x, k), Y0 + Math.sin(k * Math.PI) * 0.6, lerp(C0.z + 0.5, back.z, k)); });
    M.x = back.x; M.z = back.z; M.y = M.ry = Y0; M.hidden = false; Sound.play('land', 4);
    st.bridge = true; G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    UI.toast('The bridge comes down over the water. The way on is open!');
  }
  // a tile of her morning: say what she does (third person, like the Wall of Days)
  async function tileScene(T0) {
    const st = S(), l = lang(), room = rooms[2];
    const fr = (RUINS.ROUT_FRAME[l] || RUINS.ROUT_FRAME.es)[1], frame = cjk(l) && typeof CJK !== 'undefined' ? CJK.plain(fr, { lang: l }) : fr;
    const r = await UI.command({ name: G.state.mimoName, icon: 'temple', title: `A carved tile: ${TILE_EN[T0.key]}. What does she do? Say it, like the Wall of Days.`, verbs: [],
      placeholder: 'say what she does…', hint: `About her, like the Wall: ${frame} (? shows an example)`, model: plainOf(RUINS.routineModel(T0.key, l, 3)), modelEn: RUINS.ROUT_EN3[T0.key] });
    if (!r || r.cancelled) return;
    const g = RUINS.gradeRoutine(r.text, l, { person: 3, want: T0.key });
    if (!g.key) { Sound.play('wrong'); STORY.think(`The tile stays dark. Say what she does: ${frame} (? shows an example)`, 5.5); return; }
    if (g.wrongPerson) { Sound.play('wrong'); STORY.think(g.slips[0] ? g.slips[0].why : 'That’s you! Say what SHE does.', 5.5); return; }
    if (g.key !== T0.key) { Sound.play('wrong'); STORY.think(`Look again: in this one she’s… ${TILE_EN[T0.key].replace(/^the bell keeper /, '')}.`, 5); return; }
    UI.toast(`${g.letter} · ${g.reason}`);
    Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    lightTile(T0); Sound.play('chime'); G.w3d.fx.sparkle(T0.x, Y0 + 2.2, T0.z - 1.2, 14, ['#ffd166', '#fff3a0']);
    st.tiles = (st.tiles || []).concat(T0.key); G.save();
    if (room.tiles.every(t => t.lit) && !st.seal) {
      G.sim.lock = 1;
      G.cam.override = { pos: V(room.R.x + 2.6, Y0 + 3.4, room.R.z + 5.6), look: V(room.stairs.x, Y0 + 1.4, room.stairs.z), dur: 0.8 };
      await wait(0.6); Sound.play('gears');
      await tween(1.8, k => { room.seal.position.y = Y0 - k * 2.6; });
      unsolid(room.sealSolid); solved();
      st.seal = true; G.cam.override = null; G.sim.lock = 0; G.save();
      UI.toast('Her whole morning: the seal sinks, and the stairs go down to the bell!');
    }
  }
  async function wakeBoss(verb) {
    const room = rooms[3], st = S(), R = room.R, b = room.boss;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x + 2.4, Y0 + 3.6, R.z + 6.4), look: V(room.pit.x, Y0 + 1.4, room.pit.z), dur: 0.8 };
    if (verb === 'v.dig') await dig({ x: room.pit.x + 1.2, z: room.pit.z + 2.2 }, room.pit, 1.6);
    else { G.sim.mimoGo({ x: room.pit.x + 1.2, z: room.pit.z + 2.4 }, room.pit); await wait(0.6); Sound.play(verb === 'v.sing' ? 'sing' : verb === 'v.blow' ? 'blow' : verb === 'v.call' ? 'chirp' : 'hit'); await wait(0.4); }
    // the sand heaves, and up it comes
    Sound.play('screech'); G.w3d.fx.puff(room.pit.x, Y0 + 0.4, room.pit.z, 20, 0.5, '#e2c088');
    if (b) { b.userData.mood = 'alert'; await tween(1.0, k => { b.position.y = lerp(Y0 - 1.6, Y0 - 0.2, k); b.rotation.z = Math.sin(k * 30) * 0.04; }); }
    const worm = { id: 'worm', name: RUINS.nameOf('worm'), x: room.pit.x, y: Y0 + 2.6, z: room.pit.z, top: 3.8 };
    await RUINS.sayT(worm, RUINS.LINES['k.wake']);
    await STORY.you('Under the sand nothing touches it… so dig it out, {mimo}! And hit it when it comes up!');
    G.cam.override = null; G.sim.lock = 0;
    const r = await G.fight({ boss: 'worm', foes: [{ kind: 'worm', color: 'yellow', size: 'big', giant: 2, hp: 30 }, { kind: 'worm', color: 'red', size: 'small' }, { kind: 'worm', color: 'green', size: 'small' }], place: FIGHT_AT });
    if (!r || r.outcome !== 'win') {
      if (b) { b.userData.mood = 'asleep'; b.position.y = Y0 - 1.6; }
      STORY.think(r && r.outcome === 'lose' ? 'Ouch… The Great Worm sinks back into its pit and starts snoring. Catch your breath, then try again.' : 'The Great Worm sinks back into its pit.', 5);
      return;
    }
    st.boss = true;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x + 2.4, Y0 + 3.6, R.z + 6.4), look: V(room.pit.x, Y0 + 1.4, room.pit.z), dur: 0.01 };
    if (b) b.userData.mood = 'happy';
    await RUINS.sayT(worm, RUINS.LINES['k.after']);
    // down it goes, deep under the temple, and the pit settles
    Sound.play('swoosh');
    await tween(1.2, k => { if (b) { b.position.y = lerp(Y0 - 0.2, Y0 - 3.4, k); b.rotation.y += 0.05; } room.pitMesh.scale.y = lerp(1, 0.4, k); });
    if (b) b.visible = false; unsolid(room.bossSolid);
    G.w3d.fx.puff(room.pit.x, Y0 + 0.4, room.pit.z, 16, 0.4, '#e2c088'); Sound.play('learned');
    await wait(0.4);
    room.page.visible = true; Sound.play('page');
    G.cam.override = null; G.sim.lock = 0;
    await STORY.you('Something fluttered down from the beam. A page from Noa’s notebook!');
    G.save();
  }
  async function readPage() {
    const room = rooms[3], st = S();
    Sound.play('page');
    await UI.page('page.ruins', LEX.item('w.temple') ? 'w.temple' : 'w.bell');
    st.page = true; room.page.visible = false;
    if (!G.state.pages.includes('page.ruins')) G.state.pages.push('page.ruins');
    await STORY.you('The Gray Marsh, at the foot of the Old Tower… We’re coming, Noa. First: the {w.bell}.');
    G.save();
  }
  async function ringBell(verb) {
    const room = rooms[3], bl = room.bell, st = S(), M = G.sim.mimo;
    G.sim.lock = 1;
    G.cam.override = { pos: V(bl.x + 4.2, Y0 + 2.8, bl.z + 6.0), look: V(bl.x, Y0 + 2.6, bl.z), dur: 0.8 };
    if (verb === 'v.throw') {
      G.sim.mimoGo({ x: bl.x + 0.6, z: bl.z + 3.0 }, bl); await wait(0.7);
      const ball = part(GEO.sphere, '#e2c088', [0, 0, 0], [0.12, 0.1, 0.1], { ink: 0.01 }); G.w3d.scene.add(ball);
      const p0 = V(M.x, Y0 + 0.9, M.z), p1 = V(bl.x, Y0 + 3.0, bl.z + 0.3);
      M.hop = { t: 0 }; Sound.play('whiff');
      await tween(0.5, k => { ball.position.set(lerp(p0.x, p1.x, k), lerp(p0.y, p1.y, k) + Math.sin(k * Math.PI) * 1.2, lerp(p0.z, p1.z, k)); });
      G.w3d.scene.remove(ball);
    } else if (verb === 'v.call') { G.sim.mimoGo({ x: bl.x + 0.6, z: bl.z + 2.6 }, bl); await wait(0.6); Sound.play('chirp'); await wait(0.4); }
    else {
      G.sim.mimoGo({ x: bl.x + 0.5, z: bl.z + 1.5 }, bl); await wait(0.6);
      await mimoArc({ x: bl.x + 0.4, z: bl.z + 0.8 }, Y0 + 2.4, 0.6);
      Sound.play('hit');
    }
    bl.mat.color.set('#e6b54a');
    for (let k = 0; k < 3; k++) { Sound.play('bigbell'); bl.swing = 0.4; G.w3d.fx.sparkle(bl.x, Y0 + 3.0, bl.z + 0.4, 18, ['#ffd166', '#fff3a0', '#ffffff']); await wait(1.0); }
    if (verb !== 'v.call' && verb !== 'v.throw') await mimoLand();
    st.bell = true;
    await wait(0.4);
    G.cam.override = null; G.sim.lock = 0;
    await finale();
  }
  // outside again: the bell rings out through the sand, the canyon gets its color back: the seventh bell of eight
  async function finale() {
    await UI.fade(1, 700);
    hideAll(); inside = false; G.w3d.setInterior(null);
    const f = G.state.flags;
    f.ruinsFree = true; f.bells = Math.max(7, f.bells || 0);
    if (RUINS.sync) RUINS.sync(true);
    const D = RUINS.DOOR, B0 = RUINS.built;
    teleport(OUTSIDE.x, OUTSIDE.z + 1.6, 0);
    if (B0) for (const p of B0.people) p.look = { x: D.x, z: D.z };
    G.sim.lock = 1;
    G.cam.override = { pos: V(D.x + 7, 7.5, D.z + 16), look: V(D.x, 4, D.z - 2), dur: 0.01 };
    G.cam.snap(0, 0.3, 9);
    await UI.fade(0, 900);
    for (let k = 0; k < 6; k++) { Sound.play('bigbell'); if (k > 1) Sound.play('chime'); G.w3d.fx.sparkle(D.x + (Math.random() - 0.5) * 8, 4 + Math.random() * 3, D.z - 1, 14, ['#ffd166', '#fff3a0']); await wait(1.0); }
    await UI.chapter('The seventh bell', '7 of 8 · the Sunken Ruins ring again');
    G.cam.override = null; G.sim.lock = 0;
    if (B0) for (const p of B0.people) p.look = null;
    await STORY.you('Listen… the bell rings all through the canyon, right up through the sand! Seven bells down, one to go. Let’s tell Elvira.');
    G.save();
  }

  // ---------------------------------------------------------------- moving between halls, in and out
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + 1.1; M.z = z + 0.8; M.hidden = false; M.wander = null; M.station = null; M.look = null; G.sim.snap();
  }
  function show(i) { rooms.forEach((r, k) => { r.g.visible = k === i; }); cur = i; quick = {}; if (RUINS._ && RUINS._.S && RUINS._.S().quickDig && LEX.taught('v.dig')) quick.heap = quick.pit = 'v.dig'; }
  function hideAll() { rooms.forEach(r => { r.g.visible = false; }); cur = -1; quick = {}; }
  async function enter() {
    build();
    await UI.fade(1, 450);
    inside = true; G.w3d.setInterior({ fog: '#3a2c24', near: 14, far: 42 });
    show(0); const R = ROOMS[0]; teleport(R.x - 4.5, R.z + 3.6, Math.PI); G.cam.snap(Math.PI, 0.66, 10.5);
    await UI.fade(0, 450);
    const st = S();
    if (!st.seen0) {
      st.seen0 = true; UI.chapter('The Sunken Temple', 'The Sunken Ruins · the bell is at the very bottom');
      if (!st.ambush0) {
        await wait(1.2);
        Sound.play('screech'); G.w3d.fx.puff(R.x + 0.6, Y0 + 0.3, R.z - 0.6, 14, 0.4, '#e2c088');
        await STORY.you('Sand worms! Hit them when they come up, {mimo}… or dig them out!');
        const r = await G.fight({ foes: [{ kind: 'worm', color: 'yellow', size: 'small' }, { kind: 'worm', color: 'blue', size: 'small' }, { kind: 'hushling', color: 'red', size: 'small' }], place: FIGHT_AT });
        if (r && r.outcome === 'win') st.ambush0 = true;
        else { st.seen0 = false; await leave(); return; }
        STORY.think('The stairs down must be under that heap of sand… a crack above keeps pouring more in.', 4.5);
      }
    }
    G.save();
  }
  async function leave() {
    await UI.fade(1, 450);
    hideAll(); inside = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z + 0.6, 0); G.cam.snap(0, 0.28, 8.5);
    await UI.fade(0, 450);
  }
  async function go(i, from = 'above') {
    await UI.fade(1, 350);
    show(i);
    const R = ROOMS[i], room = rooms[i];
    if (from === 'below') {          // back up from the hall below: arrive by its stairs
      const at = { x: room.stairs.x - 0.4, z: room.stairs.z + 1.8 };
      teleport(at.x, at.z, 0);
    } else teleport(R.x - 4.5, R.z + 3.6, Math.PI);
    G.cam.snap(Math.PI, 0.66, 10.5);
    await UI.fade(0, 350);
    const st = S();
    if (!st['seen' + i]) {
      st['seen' + i] = true; UI.chapter(R.name, R.sub);
      if (i === 1) STORY.think('Water across the whole hall… and the bridge is up on the far side, by that crank.', 4.5);
      if (i === 2) STORY.think('Her bed, her basin, her comb… and three carved tiles by the sealed stairs. Her morning!', 5);
      if (i === 3) STORY.think('The bell! And under it, a pit of sand… that’s breathing.', 4.5);
    }
    G.save();
  }

  // ---------------------------------------------------------------- per frame (while inside)
  function update(dt, t) {
    if (!inside || cur < 0) return;
    const room = rooms[cur];
    if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    if (room.lights) room.lights.forEach((l, i) => { l.material.opacity = 0.5 + 0.15 * Math.sin(t * 9 + i * 2.3) + 0.08 * Math.sin(t * 23 + i); });
    if (cur === 0 && room.trickle.visible) room.trickle.material.opacity = 0.6 + 0.1 * Math.sin(t * 6);
    if (cur === 1 && room.water) room.water.material.opacity = 0.82 + Math.sin(t * 1.4) * 0.04;
    if (cur === 2) for (const T0 of room.tiles) T0.glow.material.opacity = T0.lit ? 0.3 + 0.12 * Math.sin(t * 2.5 + T0.x) : 0;
    if (cur === 3) {
      const bl = room.bell; bl.swing = damp(bl.swing, 0, 1.0, dt); bl.piv.rotation.x = Math.sin(t * 3.4) * bl.swing;
      if (room.boss && room.boss.visible && room.boss.userData.animate) room.boss.userData.animate(dt, t, 0);
      if (room.page.visible) room.pageGlow.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
    }
  }
  function init(game) { G = game; }
  return { init, enter, leave, update, interactables, target, ROOMS, OUTSIDE, TILES,
    get inside() { return inside; }, get room() { return cur; }, _: { S, build, go, show, rooms, digHeap, swimCrank, tileScene, wakeBoss, readPage, ringBell, finale } };
})();
