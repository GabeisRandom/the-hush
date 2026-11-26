'use strict';
// The Ice Clock Tower (DESIGN.md 14.10, region 5): the Frost Peaks' dungeon, on its ledge above Escarcha. Four rooms, one per
// floor, built like the mine's and the Great Mill's: high up and out of sight at y = 300 (a row at z −287, behind the village,
// over the peaks where nobody walks), walls facing inward (the camera looks in from outside, like a dollhouse), one room at a
// time, and every action a sentence to Mimo («tell Mimo»; once a verb has worked on a thing in a room, E repeats it).
//   0 the Fog Hall:     a frozen fog fills the hall: blow it away («¡sopla!»); push the big cog into its socket («¡empuja!»):
//                       the gears turn and the ice bars over the stairs rise
//   1 the Ice Mills:    snowballs jump you (a fight); hit the ice off the three little ice mills («¡golpea!»), then blow them
//                       round («¡sopla!»): they wind the lift up to the next floor
//   2 the Clock Face:   the great clock from inside, its minute hand fallen onto an ice floe in the meltwater: swim for it
//                       («¡nada!»), hop up and fit it back on the dial («¡salta!», or «¡trepa!» if Mimo can climb), then tell
//                       the clock its hour, the bell's: noon («Son las doce», graded S–D like the village's clocks)
//   3 the Belfry:       a giant snowball (a snowman) sits frozen round the bell; blow the snow off its face and it wakes (the
//                       boss fight), then Noa's page (she went down to Port Brisa) and you ring the bell yourself («¡golpea la
//                       campana!», or throw a snowball at it): the fifth bell. Outside, every clock in Escarcha rings.
//   ICETOWER.init(game) · enter() · leave() · update(dt, t) · interactables() · target() · inside · OUTSIDE (the door)
// Progress lives in state.tower; flags.peaksFree and flags.bells = 5 when the bell rings (peaks.js's sync lifts the gray).
const ICETOWER = (() => {
  let G = null, built = false;
  const { part, G: GEO } = TK;
  const Y0 = 300, HW = 7, HD = 6, WH = 5.6, INK = '#2b2235';
  const ROOMS = [
    { id: 'fog', name: 'The Fog Hall', sub: 'The Ice Clock Tower · 1st floor', x: 166, z: -287 },
    { id: 'mills', name: 'The Ice Mills', sub: 'The Ice Clock Tower · 2nd floor', x: 192, z: -287 },
    { id: 'dial', name: 'The Clock Face', sub: 'The Ice Clock Tower · 3rd floor', x: 218, z: -287 },
    { id: 'belfry', name: 'The Belfry', sub: 'The Ice Clock Tower · the top', x: 262, z: -287 },
  ];
  const OUTSIDE = { x: 240, z: -271.4, yaw: 0 };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = () => G.state.tower || (G.state.tower = {});
  const ex = w => (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const verbs = () => ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing', 'v.climb', 'v.blow'].filter(id => LEX.item(id));
  const has = id => !!LEX.item(id);
  let inside = false, cur = -1, quick = {};
  const rooms = [];
  const Kit = () => CAVES.Kit(), KG = () => CAVES.GEO;

  // ------------------------------------------------------------ materials: walls of ice blocks, a floor of frosted planks
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const ice = tex(256, 256, c => {
      const R = rng(41); c.fillStyle = '#bfe0ef'; c.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const off = (y % 2) * 32; c.fillStyle = ['#c9e6f2', '#b3d7ea', '#d4ecf6', '#a9d0e6'][(x + y * 3) % 4]; c.fillRect(x * 64 + off - 64 + 2, y * 64 + 2, 60, 60); c.fillRect(x * 64 + off + 192 + 2 - 256, y * 64 + 2, 60, 60); }
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2; for (let k = 0; k < 18; k++) { c.beginPath(); const x = R() * 256, y = R() * 256; c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 50, y + (R() - 0.5) * 50); c.stroke(); }
      c.strokeStyle = 'rgba(60,110,140,0.35)'; c.lineWidth = 3; for (let y = 0; y <= 256; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
    }, 3, 1.4);
    const floor = tex(256, 256, c => {
      c.fillStyle = '#8a6a52'; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#7d5f48' : '#94735a'; c.fillRect(0, i * 32, 256, 30); }
      const R = rng(7); c.fillStyle = 'rgba(240,248,252,0.55)'; for (let k = 0; k < 120; k++) { const s = 3 + R() * 10; c.beginPath(); c.ellipse(R() * 256, R() * 256, s, s * 0.6, R() * 3, 0, TAU); c.fill(); }
    }, 3, 3);
    MAT = { ice: new THREE.MeshToonMaterial({ map: ice, gradientMap: TK.grad, emissive: new THREE.Color('#14323f') }), floor: new THREE.MeshToonMaterial({ map: floor, gradientMap: TK.grad }), hole: new THREE.MeshBasicMaterial({ color: '#10202b' }),
      water: new THREE.MeshToonMaterial({ color: '#5aa9c9', gradientMap: TK.grad, transparent: true, opacity: 0.86, emissive: new THREE.Color('#103844') }) };
    return MAT;
  }
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(s); sp.renderOrder = 2; return sp; };
  const unsolid = o => { if (!o) return; const s = o.solid || o; s.x = s.z = 1e5; };

  // ------------------------------------------------------------ the rooms' shell: ice walls facing in, frosted timber, icicles
  function shell(R, g, o = {}) {
    const M = mats();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, 0.4, HD * 2), M.floor); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
    [[0, -HD, 0, HW * 2], [0, HD, Math.PI, HW * 2], [-HW, 0, Math.PI / 2, HD * 2], [HW, 0, -Math.PI / 2, HD * 2]].forEach(([dx, dz, ry, w]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), M.ice); m.position.set(R.x + dx, Y0 + WH / 2, R.z + dz); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    });
    const k = Kit(), GG = KG(), RR = rng(Math.round(R.x * 7 + 3));
    for (const x of o.noMid ? [-4.6, 4.6] : [-4.6, 0, 4.6]) k.box(R.x + x, Y0 + 2.4, R.z - HD + 0.3, 0.32, 4.8, 0.32, '#6b4a30', { ink: 0.02 });      // (no middle post in front of the great clock)
    k.box(R.x, Y0 + 4.9, R.z - HD + 0.35, HW * 2 - 0.4, 0.34, 0.4, '#5a3a24', { ink: 0.02 }).box(R.x, Y0 + 5.12, R.z - HD + 0.4, HW * 2 - 0.4, 0.14, 0.45, '#f4f8fb', { ink: 0.01 });
    for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.3), Y0 + 4.9, R.z, 0.36, 0.34, HD * 2 - 0.6, '#5a3a24', { ink: 0.02 });
    for (let i = 0; i < 22; i++) k.add(GG.cone, R.x - HW + 0.6 + i * 0.62, Y0 + 4.62, R.z - HD + 0.45 + RR() * 0.3, 0.07, -0.35 - RR() * 0.7, 0.07, '#e6f4fb', { ink: 0.006 });
    for (let i = 0; i < 10; i++) { const x = R.x + (RR() < 0.5 ? -1 : 1) * (HW - 0.8 - RR() * 1.2), z = R.z + (RR() < 0.5 ? -1 : 1) * (HD - 0.8 - RR() * 1.0), s = 0.2 + RR() * 0.35; k.add(GG.sphere, x, Y0 + s * 0.3, z, s * 1.4, s * 0.6, s * 1.2, '#f4f8fb', { ink: 0.012 }); }
    k.build(g);
    // the way back down: a hatch at the front, by the left
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), M.hole); door.rotation.x = -Math.PI / 2; door.position.set(R.x - 4.5, Y0 + 0.012, R.z + HD - 0.7); g.add(door);
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - HD - 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: R.x, z: R.z + HD + 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 },
      { obox: 1, x: R.x - HW - 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }, { obox: 1, x: R.x + HW + 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }]);
    WORLD.addPlatforms([{ box: [R.x - HW, R.x + HW, R.z - HD, R.z + HD], top: Y0 }]);
  }
  // a gear wheel (a group turning about z): teeth round a disc
  function gear(parent, x, y, z, r, col = '#c98a4a', teeth = 10) {
    const g = grp(parent, x, y, z), k = Kit(), GG = KG();
    k.add(GG.cyl, 0, 0, 0, r, 0.16, r, col, { rx: Math.PI / 2, ink: 0.015 }).add(GG.cyl, 0, 0, 0.05, r * 0.28, 0.2, r * 0.28, '#8a5f3e', { rx: Math.PI / 2, ink: 0.01 });
    for (let i = 0; i < teeth; i++) { const a = (i / teeth) * TAU; k.box(Math.sin(a) * r, Math.cos(a) * r, 0, r * 0.26, r * 0.26, 0.16, col, { rz: -a, ink: 0.01 }); }
    k.build(g, { shadow: false });
    return g;
  }
  // a little ice mill: a post, and four blades of ice that spin when Mimo blows
  function iceMill(parent, x, z, h = 1.6) {
    const g = grp(parent, x, Y0, z), k = Kit(), GG = KG();
    k.add(GG.cyl6, 0, h / 2, 0, 0.1, h, 0.1, '#6b4a30', { ink: 0.012 }).box(0, h, 0.08, 0.26, 0.26, 0.3, '#5a3a24', { ink: 0.01 });
    k.build(g);
    const hub = grp(g, 0, h, 0.26), bk = Kit();
    for (let i = 0; i < 4; i++) bk.box(Math.sin(i * Math.PI / 2) * 0.42, Math.cos(i * Math.PI / 2) * 0.42, 0, 0.16, 0.74, 0.04, '#bfe6f4', { rz: -i * Math.PI / 2, ink: 0.008 });
    bk.build(hub, { shadow: false });
    // the ice it's frozen in (until hit)
    const ice = grp(g, 0, 0, 0), ik = Kit();
    ik.add(GG.ico1 || GG.ico, 0, h * 0.75, 0.15, 0.62, h * 0.62, 0.55, '#d6eef8', { ink: 0.015 }); ik.build(ice, { shadow: false });
    return { g, hub, ice, spin: 0 };
  }
  // a big snowy fog: sprites filling the room until Mimo blows them away
  function fogBank(parent, R) {
    const list = [], RR = rng(9);
    for (let i = 0; i < 26; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: i % 2 ? '#eef5fa' : '#dde9f1', transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
      const x = R.x + (RR() - 0.5) * HW * 1.8, z = R.z + (RR() - 0.5) * HD * 1.6, y = Y0 + 0.6 + RR() * 3.0;
      sp.position.set(x, y, z); sp.scale.setScalar(3.6 + RR() * 2.8); parent.add(sp); list.push({ sp, x0: x, y0: y, z0: z, ph: RR() * 6, k: 1 });
    }
    return list;
  }

  // ------------------------------------------------------------ build the four rooms (on first entry)
  function build() {
    if (built) return; built = true;
    const scene = G.w3d.scene, GG = KG();
    ROOMS.forEach((R, i) => { const g = new THREE.Group(); g.visible = false; scene.add(g); shell(R, g, { noMid: i === 2 }); rooms[i] = { R, g, gears: [] }; });
    // 0 · the Fog Hall: the big cog lying on the floor, its socket in the back wall, gears, the ice bars over the stairs
    {
      const room = rooms[0], R = room.R, g = room.g, k = Kit();
      room.socket = { x: R.x + 1.4, z: R.z - HD + 0.32 };         // (where the cog ends up: in the socket, flat to the wall)
      room.gears.push(gear(g, R.x - 2.6, Y0 + 3.1, R.z - HD + 0.15, 1.0), gear(g, R.x - 0.9, Y0 + 3.9, R.z - HD + 0.18, 0.6, '#b8862e'), gear(g, R.x + 3.2, Y0 + 3.4, R.z - HD + 0.15, 0.85));
      const sock = new THREE.Mesh(new THREE.CircleGeometry(0.85, 20), mats().hole); sock.position.set(room.socket.x, Y0 + 1.05, R.z - HD + 0.075); g.add(sock);
      k.add(GG.cyl, room.socket.x, Y0 + 1.05, R.z - HD + 0.035, 1.02, 0.05, 1.02, '#5a3a24', { rx: Math.PI / 2, ink: 0.015 });      // (a rim round the dark hole)
      // the stairs up, in the back-right corner, rising to a doorway in the back wall, behind bars of ice
      room.stairs = { x: R.x + 5.2, z: R.z - 3.6 };
      for (let i = 0; i < 5; i++) k.box(room.stairs.x, Y0 + (i + 1) * 0.2, room.stairs.z + 0.6 - i * 0.5, 1.8, (i + 1) * 0.4, 0.5, i % 2 ? '#7d5f48' : '#8a6a52', { ink: 0.015 });
      k.build(g);
      const way = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.3), mats().hole); way.position.set(room.stairs.x, Y0 + 3.1, R.z - HD + 0.03); g.add(way);
      WORLD.extra.push({ obox: 1, x: room.stairs.x, z: room.stairs.z - 0.4, hw: 0.95, hd: 1.3, rot: 0 });
      const bars = grp(g, room.stairs.x, Y0, room.stairs.z + 1.1), bk = Kit();
      for (let i = 0; i < 5; i++) bk.add(GG.cyl6, -1.0 + i * 0.5, 1.3, 0, 0.09, 2.6, 0.09, '#cfeaf7', { ink: 0.01 });
      bk.box(0, 2.6, 0, 2.4, 0.2, 0.2, '#9cc7de', { ink: 0.01 }); bk.build(bars); room.bars = bars;
      room.barsSolid = { obox: 1, x: room.stairs.x, z: room.stairs.z + 1.1, hw: 1.3, hd: 0.25, rot: 0 }; WORLD.extra.push(room.barsSolid);
      // the cog: a big gear wheel lying on its edge by the left wall (you push it along to the socket)
      room.cog = { x: R.x - 3.6, z: R.z + 0.6 };
      const cg = grp(g, room.cog.x, Y0 + 0.95, room.cog.z), wheel = gear(cg, 0, 0, 0, 0.85, '#d9a43c', 12); wheel.rotation.y = 0;
      room.cogG = cg; room.cogSolid = { x: room.cog.x, z: room.cog.z, r: 0.9 }; WORLD.extra.push(room.cogSolid);
      room.fog = fogBank(g, R);
    }
    // 1 · the Ice Mills: three little mills frozen in ice, the lift (a wooden platform on chains) up in the far corner
    {
      const room = rooms[1], R = room.R, g = room.g, k = Kit();
      room.mills = [iceMill(g, R.x - 3.4, R.z - 2.2), iceMill(g, R.x - 1.2, R.z - 3.0, 1.9), iceMill(g, R.x + 1.0, R.z - 2.2)];
      room.lift = { x: R.x + 4.6, z: R.z - 2.4 };
      for (const s of [-1, 1]) k.add(GG.cyl6, room.lift.x + s * 0.9, Y0 + 2.8, room.lift.z, 0.035, 5.6, 0.035, '#7d8590', { ink: 0 });
      k.build(g);
      const lift = grp(g, room.lift.x, Y0 + 4.2, room.lift.z), lk = Kit();
      lk.box(0, 0.1, 0, 2.0, 0.2, 2.0, '#8a6a52', { ink: 0.02 }); for (const s of [-1, 1]) lk.box(s * 0.95, 0.5, 0, 0.08, 0.8, 2.0, '#6b4a30', { ink: 0.01 });
      lk.build(lift); room.liftG = lift;
      room.gears.push(gear(g, R.x + 2.8, Y0 + 3.6, R.z - HD + 0.15, 0.9), gear(g, R.x + 4.6, Y0 + 4.4, R.z - HD + 0.2, 0.55, '#b8862e'));
      WORLD.extra.push({ obox: 1, x: R.x - 1.2, z: R.z - 2.5, hw: 3.0, hd: 0.7, rot: 0 });
    }
    // 2 · the Clock Face: the great dial from inside (its minute hand gone), a pool of meltwater, the hand on a floe of ice
    {
      const room = rooms[2], R = room.R, g = room.g, k = Kit();
      room.dial = { x: R.x, y: Y0 + 3.05, z: R.z - HD + 0.12 };
      const dial = typeof PEAKS !== 'undefined' && PEAKS.built && PEAKS.built.clockFace ? PEAKS.built.clockFace(g, 1.5, { rim: '#5f7590', face: '#e6f2f8' }) : null;
      if (dial) { dial.g.position.set(room.dial.x, room.dial.y, room.dial.z); dial.setTime(11, 0, true); room.dialS = dial; if (dial.mm) { room.minute = dial.mm; dial.mm.visible = false; } }
      // the ledge under the dial (Mimo hops up to it)
      k.box(R.x, Y0 + 0.8, R.z - HD + 0.9, 3.4, 1.6, 1.4, '#9cc7de', { ink: 0.02 }).box(R.x, Y0 + 1.62, R.z - HD + 0.9, 3.5, 0.12, 1.5, '#f4f8fb', { ink: 0.01 });
      room.ledge = { x: R.x, y: Y0 + 1.7, z: R.z - HD + 0.9 };
      // the meltwater pool on the right, with its floe
      room.pool = { x: R.x + 3.6, z: R.z + 1.4, rx: 2.6, rz: 2.2 };
      const water = new THREE.Mesh(new THREE.CircleGeometry(1, 36), mats().water); water.rotation.x = -Math.PI / 2; water.scale.set(room.pool.rx, room.pool.rz, 1); water.position.set(room.pool.x, Y0 + 0.03, room.pool.z); g.add(water);
      for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; k.add(GG.sphere, room.pool.x + Math.cos(a) * (room.pool.rx + 0.12), Y0 + 0.08, room.pool.z + Math.sin(a) * (room.pool.rz + 0.12), 0.3, 0.12, 0.25, '#e6f4fb', { ink: 0.01 }); }
      k.build(g);
      WORLD.extra.push({ obox: 1, x: room.pool.x, z: room.pool.z, hw: room.pool.rx * 0.8, hd: room.pool.rz * 0.8, rot: 0 }, { obox: 1, x: R.x, z: R.z - HD + 0.9, hw: 1.7, hd: 0.75, rot: 0 });
      room.floe = { x: room.pool.x + 0.8, z: room.pool.z - 0.4 };
      const floe = grp(g, room.floe.x, Y0 + 0.06, room.floe.z), fk = Kit();
      fk.add(GG.cyl6, 0, 0, 0, 0.8, 0.14, 0.6, '#f4f8fb', { ink: 0.012 });
      fk.build(floe); room.floeG = floe;
      const fh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.1), new THREE.MeshBasicMaterial({ color: '#c9453a' })); fh.position.set(0.05, 0.11, 0); fh.rotation.y = 0.5; floe.add(fh); room.floeHand = fh;
      // the sign under the dial: the hour the bell rings (noon)
      room.sign = { x: R.x - 3.4, z: R.z - HD + 0.6 };
      const sk = Kit(); sk.add(GG.cyl6, room.sign.x, Y0 + 0.65, room.sign.z, 0.05, 1.3, 0.05, '#6b4a30', { ink: 0.008 }); sk.build(g);
      const cv = document.createElement('canvas'); cv.width = 320; cv.height = 104; const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4;
      const bd = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.68), new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide })); bd.position.set(room.sign.x, Y0 + 1.5, room.sign.z + 0.06); g.add(bd);
      const SIGN = { en: 'The bell rings at 12:00', es: 'La campana suena a las 12:00', pt: 'O sino toca ao meio-dia · 12:00', de: 'Die Glocke läutet um 12:00', zh: '[钟|zhōng] [声|shēng] · 12:00', ja: '[鐘|かね] · 12:00' };
      const draw = l => { const c = cv.getContext('2d'), text = pickLang(SIGN, l, SIGN.en); if (typeof SIGNS !== 'undefined') SIGNS.paint(c, 320, 104, { text, edge: '#5f7590', icon: 'clk.noon' }); tx.needsUpdate = true; };
      if (typeof SIGNS !== 'undefined' && SIGNS.board) SIGNS.board(draw); else draw('es');
      room.signText = SIGN;
      room.gears.push(gear(g, R.x - 4.6, Y0 + 3.4, R.z - HD + 0.15, 0.9), gear(g, R.x + 3.4, Y0 + 4.1, R.z - HD + 0.15, 0.7, '#b8862e'));
      // the ladder up to the belfry, in the back-right corner, frozen into a block of ice until the clock strikes twelve
      const lk2 = Kit(), lx = R.x + 5.3, lz = R.z - HD + 0.45;
      for (const s of [-0.45, 0.45]) lk2.add(GG.cyl6, lx + s, Y0 + 2.6, lz, 0.06, 5.2, 0.06, '#8a6440', { ink: 0.01 });
      for (let i = 0; i < 9; i++) lk2.box(lx, Y0 + 0.4 + i * 0.55, lz, 0.9, 0.07, 0.09, '#a57d57', { ink: 0.008 });
      lk2.build(g);
      room.ladderIce = grp(g, lx, Y0, lz + 0.3); { const ik = Kit(); ik.box(0, 1.0, 0, 1.6, 2.0, 0.9, '#cfeaf7', { ink: 0.015 }).add(GG.ico1 || GG.ico, 0.3, 2.0, 0.1, 0.6, 0.5, 0.5, '#dff2fb', { ink: 0.01 }); ik.build(room.ladderIce, { shadow: false }); }
      WORLD.extra.push({ obox: 1, x: lx, z: lz + 0.3, hw: 0.8, hd: 0.5, rot: 0 });
    }
    // 3 · the Belfry: the bell in the middle, the giant snowman frozen beside it, the way out
    {
      const room = rooms[3], R = room.R, g = room.g, k = Kit();
      const bx = R.x + 1.4, bz = R.z - 2.6;
      for (const s of [-1, 1]) k.add(GG.cyl6, bx + s * 1.6, Y0 + 2.2, bz, 0.18, 4.4, 0.18, '#6b4a30', { ink: 0.02 });
      k.box(bx, Y0 + 4.45, bz, 3.8, 0.34, 0.4, '#5a3a24', { ink: 0.02 }).box(bx, Y0 + 4.66, bz, 3.8, 0.12, 0.45, '#f4f8fb', { ink: 0.01 });
      k.build(g);
      WORLD.extra.push({ obox: 1, x: bx, z: bz, hw: 1.9, hd: 0.55, rot: 0 });
      const piv = grp(g, bx, Y0 + 4.3, bz), bell = new THREE.Group(); piv.add(bell);
      const lp = [[0.86, -1.92], [0.84, -1.8], [0.56, -1.2], [0.42, -0.4], [0.24, 0]].map(([x, y]) => new THREE.Vector2(x, y));      // (bottom up: the faces turn outward)
      bell.add(part(new THREE.LatheGeometry(lp, 24), '#e6b84a', [0, 0, 0], null, { ink: 0.03 }));
      bell.add(part(GEO.sphere, '#8a6a2a', [0, -1.85, 0], [0.16, 0.16, 0.16], { ink: 0.01 }));
      room.bell = { piv, bell, x: bx, z: bz, swing: 0 };
      room.bellIce = grp(g, bx, Y0, bz); { const ik = Kit(); ik.add(GG.ico1 || GG.ico, 0, 3.1, 0, 1.15, 1.3, 1.1, '#d6eef8', { ink: 0.02 }); ik.build(room.bellIce, { shadow: false }); }
      // the giant snowball, a snowman (BATTLE's model if there is one), asleep beside the bell
      let boss = null;
      if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) { try { boss = BATTLE.buildFoe('snowball', 'blue', { size: 'big', giant: true, mood: 'asleep' }); } catch (e) { console.warn('[icetower] boss model', e); boss = null; } }
      if (boss) { boss.scale.setScalar(2.1); boss.position.set(R.x - 2.4, Y0, R.z - 2.0); boss.rotation.y = 0.35; g.add(boss); }
      else {        // (no battle code: a plain snowman of three balls)
        boss = grp(g, R.x - 2.4, Y0, R.z - 2.0); const sk = Kit();
        sk.add(GG.sphere, 0, 0.75, 0, 0.85, 0.75, 0.8, '#eef3f8', { ink: 0.03 }).add(GG.sphere, 0, 1.75, 0, 0.62, 0.56, 0.6, '#eef3f8', { ink: 0.03 }).add(GG.sphere, 0, 2.5, 0, 0.45, 0.43, 0.44, '#eef3f8', { ink: 0.03 });
        sk.build(boss);
      }
      room.boss = boss; room.bossSolid = { x: R.x - 2.4, z: R.z - 2.0, r: 1.3 }; WORLD.extra.push(room.bossSolid);
      // a window in the back wall, behind it: the peaks, and the sea far off to the south-west (Noa's page points there)
      {
        const cv = document.createElement('canvas'); cv.width = 256; cv.height = 176; const c = cv.getContext('2d');
        const sky = c.createLinearGradient(0, 0, 0, 176); sky.addColorStop(0, '#9fc7e6'); sky.addColorStop(0.62, '#e8f3fb'); sky.addColorStop(1, '#ffffff'); c.fillStyle = sky; c.fillRect(0, 0, 256, 176);
        c.fillStyle = '#4f86b8'; c.fillRect(0, 92, 256, 22); c.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 9; i++) c.fillRect(20 + i * 26, 100 + (i % 3) * 4, 10, 2);
        const peak = (x, w, h, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - w, 176); c.lineTo(x, 176 - h); c.lineTo(x + w, 176); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - w * 0.28, 176 - h * 0.72); c.lineTo(x, 176 - h); c.lineTo(x + w * 0.28, 176 - h * 0.72); c.fill(); };
        peak(40, 70, 96, '#7d93b0'); peak(150, 90, 70, '#8aa1bd'); peak(232, 60, 104, '#6f86a3');
        const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), fog: false })); win.position.set(R.x - 2.3, Y0 + 3.4, R.z - HD + 0.03); g.add(win);
        const wk = Kit(); wk.box(R.x - 2.3, Y0 + 2.6, R.z - HD + 0.12, 2.6, 0.16, 0.24, '#6b4a30', { ink: 0.015 }).box(R.x - 2.3, Y0 + 4.2, R.z - HD + 0.12, 2.6, 0.16, 0.24, '#6b4a30', { ink: 0.015 });
        for (const s of [-1, 0, 1]) wk.box(R.x - 2.3 + s * 1.2, Y0 + 3.4, R.z - HD + 0.12, s ? 0.16 : 0.08, 1.6, s ? 0.24 : 0.12, '#6b4a30', { ink: 0.012 });
        wk.box(R.x - 2.3, Y0 + 2.72, R.z - HD + 0.3, 2.5, 0.1, 0.3, '#f4f8fb', { ink: 0.008 }); wk.build(g);
      }
      room.page = grp(g, R.x - 4.4, Y0, R.z + 1.6); room.page.visible = false;
      room.page.add(part(GEO.box, '#8a5f3e', [0, 0.65, 0], [0.16, 1.3, 0.16], { ink: 0 }));
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ color: '#fffaf0', side: THREE.DoubleSide })); sheet.position.set(0, 1.05, 0.1); sheet.rotation.z = 0.08; room.page.add(sheet);
      const pg = glow('#fff3b0', 1.3, 0.5); pg.position.set(0, 1.05, 0.15); room.page.add(pg); room.pageGlow = pg;
      room.gears.push(gear(g, R.x + 4.8, Y0 + 3.6, R.z - HD + 0.15, 0.8));
    }
    applyState();
  }
  // after a load: each room as the saved progress says
  function applyState() {
    const st = S(), r0 = rooms[0], r1 = rooms[1], r2 = rooms[2], r3 = rooms[3];
    if (st.fog) r0.fog.forEach(f => { f.k = 0; f.sp.visible = false; });
    if (st.cog) { placeCog(r0.socket.x, r0.socket.z); r0.cogG.position.y = Y0 + 1.05; r0.bars.visible = false; unsolid(r0.barsSolid); unsolid(r0.cogSolid); }
    if (st.ice) r1.mills.forEach(m => { m.ice.visible = false; });
    if (st.mills) { r1.mills.forEach(m => { m.spin = 6; }); r1.liftG.position.y = Y0 + 0.02; }
    if (st.hand && r2.floeHand) r2.floeHand.visible = false;
    if (st.fitted && r2.minute) r2.minute.visible = true;
    if (st.dial && r2.dialS) { r2.dialS.setTime(12, 0, true); r2.dialS.run = false; }
    if (st.dial && r2.ladderIce) r2.ladderIce.visible = false;
    if (st.boss) { if (r3.boss) r3.boss.visible = false; unsolid(r3.bossSolid); r3.page.visible = !st.page; r3.bellIce.visible = false; }
  }
  function placeCog(x, z) { const r = rooms[0]; r.cog.x = x; r.cog.z = z; r.cogG.position.set(x, Y0 + 0.95, z); r.cogSolid.x = x; r.cogSolid.z = z; }

  // ------------------------------------------------------------ telling Mimo (the verb is the key; the mill's way)
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${G.state.mimoName} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  // t: { kind, verb (or verbs: [the ones that work]), icon, title, hint, right(verb), at() }
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
    else if (verb === 'v.hit') { Sound.play('hit'); M.sad = 1.2; say('{mimo} bonks it. Ouch! Cold, too.'); }
    else if (verb === 'v.throw') { Sound.play('whiff'); say('{mimo} throws a snowball at it. Poof. Nothing.'); }
    else if (verb === 'v.push') { Sound.play('land', 6); say('{mimo} pushes with all its might. It doesn’t budge.'); }
    else if (verb === 'v.swim') say('{mimo} looks for water to swim in. Not here.');
    else if (verb === 'v.sing') { Sound.play('sing'); say('{mimo} sings. Pretty… but nothing changes.'); }
    else if (verb === 'v.blow') { Sound.play('blow'); say('{mimo} blows and blows. Nothing moves.'); }
    else if (verb === 'v.climb') say('{mimo} looks for something to climb. Not here.');
    else if (verb === 'v.eat') say('{mimo} licks it… and decides ice isn’t food.');
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
  async function blowAt(at, sec = 1.2) { if (typeof PEAKS !== 'undefined' && PEAKS.mimoBlow) return PEAKS.mimoBlow(at, sec); Sound.play('blow'); await wait(sec); }

  // ------------------------------------------------------------ what you can press E on, room by room
  function interactables() {
    const list = [], st = S(), room = rooms[cur]; if (!room) return list;
    const R = room.R, name = G.state.mimoName, y = Y0;
    const say = kind => (quick[kind] ? `«${ex(LEX.form(quick[kind]))}»` : `Tell ${name}`);
    list.push({ x: R.x - 4.5, z: R.z + HD - 0.9, y, r: 1.6, label: cur === 0 ? 'Leave the tower' : 'Go back down', run: () => (cur === 0 ? leave() : go(cur - 1, 'above')) });
    if (cur === 0) {
      if (!st.fog) list.push({ x: R.x - 1.0, z: R.z + 2.6, y, r: 3.0, label: say('fog'), run: () => tell({ kind: 'fog', verb: 'v.blow', icon: 'blow', at: () => ({ x: R.x, z: R.z }),
        title: `A thick, frozen fog fills the hall. You can hardly see your own hands. What should ${name} do?`, hint: 'Fog is a bit like snow… light enough to blow away?', right: blowFog }) });
      else if (!st.cog) list.push({ x: room.cog.x + 1.4, z: room.cog.z + 0.8, y, r: 2.4, label: say('cog'), run: () => tell({ kind: 'cog', verb: 'v.push', icon: 'push', at: () => room.cog,
        title: `A big golden cog lies on its edge by the wall. On the back wall there’s a round, empty socket. What should ${name} do?`, hint: 'The cog is round… it could roll, with a shove.', right: pushCog }) });
      if (st.cog) list.push({ x: room.stairs.x - 1.6, z: room.stairs.z + 0.6, y, r: 2.0, label: 'Go up the stairs', run: () => go(1) });
    }
    if (cur === 1) {
      if (!st.ice) list.push({ x: R.x - 1.2, z: R.z - 0.6, y, r: 2.6, label: say('ice'), run: () => tell({ kind: 'ice', verb: 'v.hit', icon: 'hit', at: () => ({ x: R.x - 1.2, z: R.z - 2.2 }),
        title: `Three little ice mills, frozen solid inside lumps of ice. What should ${name} do?`, hint: 'The ice around them looks brittle. One good whack…', right: breakIce }) });
      else if (!st.mills) list.push({ x: R.x - 1.2, z: R.z - 0.4, y, r: 2.6, label: say('mills'), run: () => tell({ kind: 'mills', verb: 'v.blow', icon: 'blow', at: () => ({ x: R.x - 1.2, z: R.z - 2.2 }),
        title: `The ice mills are free, but there’s no wind in here to turn them. The lift up hangs high in the corner. What should ${name} do?`, hint: 'A mill turns in the wind… and {mimo} can make wind.', right: spinMills }) });
      if (st.mills) list.push({ x: room.lift.x - 1.4, z: room.lift.z + 1.2, y, r: 2.2, label: 'Ride the lift up', run: () => go(2) });
    }
    if (cur === 2) {
      list.push({ x: room.sign.x, z: room.sign.z + 1.0, y, r: 1.6, label: 'Read', run: () => (typeof SIGNS !== 'undefined' ? SIGNS.read({ tag: 'A sign under the great clock', lines: [{ text: pickLang(room.signText, UI.lang, room.signText.en), en: room.signText.en }] }) : null) });
      if (!st.hand) list.push({ x: room.pool.x - room.pool.rx - 0.6, z: room.pool.z, y, r: 2.4, label: say('pool'), run: () => tell({ kind: 'pool', verb: 'v.swim', icon: 'swim', at: () => ({ x: room.pool.x - room.pool.rx, z: room.pool.z }),
        title: `The great clock’s minute hand has fallen onto a floe of ice, out in the meltwater. What should ${name} do?`, hint: 'Lalo, at the lake, showed {mimo} how to cross water…', right: swimFloe }) });
      else if (!st.fitted) list.push({ x: room.ledge.x, z: room.ledge.z + 1.5, y, r: 2.4, label: say('dial'), run: () => tell({ kind: 'dial', verbs: ['v.jump', 'v.climb'], icon: 'jump', at: () => ({ x: room.ledge.x, z: room.ledge.z + 1.1 }),
        title: `${name} has the minute hand. The middle of the dial is up there, above the ledge of ice. What should ${name} do?`, hint: 'The ledge isn’t that high, for someone bouncy…', right: fitHand }) });
      else if (!st.dial) list.push({ x: room.ledge.x, z: room.ledge.z + 1.6, y, r: 2.6, label: 'Set the clock', run: setDial });
      if (st.dial) list.push({ x: R.x + 5.0, z: R.z - 4.4, y, r: 2.0, label: 'Go up to the belfry', run: () => go(3) });
    }
    if (cur === 3) {
      if (!st.boss) list.push({ x: R.x - 2.4, z: R.z + 0.6, y, r: 2.8, label: say('wake'), run: () => tell({ kind: 'wake', verb: 'v.blow', icon: 'blow', at: () => ({ x: R.x - 2.4, z: R.z - 0.4 }),
        title: `A giant snowman sits frozen by the bell, under a crust of fresh snow, and the bell is sealed in ice. What should ${name} do?`, hint: 'Fresh, powdery snow… light enough to blow off?', right: wakeBoss }) });
      else if (!st.page) list.push({ x: room.page.position.x, z: room.page.position.z + 0.6, y, r: 2.0, label: 'Read', run: readPage });
      else if (!st.bell) list.push({ x: room.bell.x, z: room.bell.z + 2.2, y, r: 2.8, label: say('bell'), run: () => tell({ kind: 'bell', verbs: ['v.hit', 'v.throw'], icon: 'bell', at: () => ({ x: room.bell.x, z: room.bell.z + 1.4 }),
        title: `The workshop’s bell hangs silent. What should ${name} do?`, hint: 'A bell rings when something strikes it…', right: ringBell }) });
    }
    return list;
  }
  // where the compass points inside: the next thing to do in this room
  function target() {
    const st = S(), room = rooms[cur]; if (!room) return null;
    const at = (o, hint) => (o ? { x: o.x, z: o.z, hint } : null), R = room.R;
    if (cur === 0) return !st.fog ? at({ x: R.x, z: R.z }, '{mimo} squints into the fog.') : !st.cog ? at(room.cog, '{mimo} points at the golden cog by the wall.') : at(room.stairs, '{mimo} points up the stairs!');
    if (cur === 1) return !st.ice ? at({ x: R.x - 1.2, z: R.z - 2.2 }, '{mimo} looks at the frozen mills.') : !st.mills ? at({ x: R.x - 1.2, z: R.z - 2.2 }, '{mimo} puffs its cheeks at the mills.') : at(room.lift, '{mimo} hops onto the lift!');
    if (cur === 2) return !st.hand ? at(room.floe, '{mimo} looks at the hand on the floe.') : !st.fitted ? at(room.ledge, '{mimo} looks up at the dial.') : !st.dial ? at(room.ledge, '{mimo} looks at the dial. What time should it say? (The sign!)') : at({ x: R.x + 5, z: R.z - 4.4 }, '{mimo} points up the ladder.');
    if (cur === 3) return !st.boss ? at(room.bossSolid, '{mimo} stares up at the giant snowman.') : !st.page ? at(room.page.position, '{mimo} points at the page.') : at(room.bell, '{mimo} looks at the bell.');
    return null;
  }

  // ------------------------------------------------------------ the actions
  async function blowFog() {
    const room = rooms[0], R = room.R, st = S();
    G.sim.lock = 1;
    await blowAt({ x: R.x + 3, z: R.z - 2 }, 1.4);
    await tween(1.4, u => room.fog.forEach((f, i) => { f.k = 1 - u; f.sp.position.x = f.x0 + u * (4 + (i % 5)); f.sp.position.y = f.y0 + u * 1.2; f.sp.material.opacity = 0.85 * (1 - u); }));
    room.fog.forEach(f => { f.sp.visible = false; });
    st.fog = true; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    await STORY.you('The fog’s gone! A big golden cog on the floor… and an empty round socket in the wall over there.');
  }
  async function pushCog() {
    const room = rooms[0], st = S(), M = G.sim.mimo, c = room.cog, to = { x: room.socket.x, z: room.socket.z };
    G.sim.lock = 1;
    G.sim.mimoGo({ x: c.x - 1.0, z: c.z + 0.6 }, c); await wait(0.8);
    for (let k = 0; k < 2; k++) { Sound.play('land', 8 + k * 3); M.hop = { t: 0 }; await wait(0.3); }
    const x0 = c.x, z0 = c.z; Sound.play('snowroll');
    await tween(1.4, u => { const e = u * u * (3 - 2 * u); placeCog(lerp(x0, to.x, e), lerp(z0, to.z, e)); room.cogG.children[0].rotation.z -= 0.18; });
    await tween(0.4, u => { room.cogG.position.y = Y0 + 0.95 + u * 0.1; });
    Sound.play('gears'); Sound.play('clockset');
    room.turning = true;
    await tween(1.2, u => { room.bars.position.y = Y0 + u * 2.8; });
    room.bars.visible = false; unsolid(room.barsSolid); unsolid(room.cogSolid);
    st.cog = true; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    UI.toast('Clunk! The gears turn, and the bars of ice rise.');
  }
  async function breakIce() {
    const room = rooms[1], st = S(), M = G.sim.mimo;
    G.sim.lock = 1;
    for (const m of room.mills) {
      G.sim.mimoGo({ x: m.g.position.x + 0.6, z: m.g.position.z + 1.0 }, { x: m.g.position.x, z: m.g.position.z }); await wait(0.5);
      M.hop = { t: 0 }; Sound.play('hit'); await wait(0.2); Sound.play('crack');
      G.w3d.fx.puff(m.g.position.x, Y0 + 1.0, m.g.position.z + 0.2, 10, 0.25, '#d6eef8');
      await tween(0.25, k => m.ice.scale.setScalar(1 - k)); m.ice.visible = false;
    }
    st.ice = true; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    STORY.think('The mills are free of the ice. But there’s no wind in here to turn them…', 4.5);
  }
  async function spinMills() {
    const room = rooms[1], st = S(), R = room.R;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x - 1, Y0 + 3.6, R.z + 6.5), look: V(R.x + 0.6, Y0 + 1.6, R.z - 2.4), dur: 0.8 };
    G.sim.mimoGo({ x: R.x - 1.2, z: R.z - 0.4 }, { x: R.x - 1.2, z: R.z - 2.2 }); await wait(0.6);
    const pb = blowAt({ x: R.x - 1.2, z: R.z - 2.4 }, 1.6);
    room.mills.forEach(m => { m.spin = 14; });
    await pb;
    Sound.play('gears');
    await tween(1.6, u => { room.liftG.position.y = lerp(Y0 + 4.2, Y0 + 0.02, u); });
    Sound.play('land', 6);
    st.mills = true; G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    UI.toast('Whirr! The mills spin, and the lift comes down.');
  }
  async function swimFloe() {
    const room = rooms[2], st = S(), M = G.sim.mimo, root = G.cast.mimo.root, F = room.floe;
    G.sim.lock = 1;
    const sx = room.pool.x - room.pool.rx - 0.2, sz = room.pool.z;
    G.sim.mimoGo({ x: sx - 0.5, z: sz }, F); await wait(0.6);
    M.hidden = true; Sound.play('jump');
    const p0 = root.position.clone(), wy = Y0 + 0.02;
    await tween(1.4, k => { root.position.set(lerp(p0.x, F.x - 0.5, k), wy - 0.1 + Math.sin(k * 24) * 0.04, lerp(p0.z, F.z, k)); root.rotation.set(0.35, Math.atan2(F.x - p0.x, F.z - p0.z), 0); if (Math.random() < 0.25) G.w3d.fx.puff(root.position.x, wy + 0.05, root.position.z, 2, 0.12, '#e6f4fb'); });
    Sound.play('pip');
    if (room.floeHand) room.floeHand.visible = false;
    await tween(1.2, k => { root.position.set(lerp(F.x - 0.5, p0.x, k), wy - 0.1 + Math.sin(k * 24) * 0.04, lerp(F.z, p0.z, k)); root.rotation.set(0.35, Math.atan2(p0.x - F.x, p0.z - F.z), 0); });
    root.rotation.set(0, 0, 0);
    M.x = p0.x; M.z = p0.z; M.y = M.ry = Y0; M.hidden = false; Sound.play('land', 4);
    st.hand = true; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    STORY.think('{mimo} swam back with the minute hand in its mouth! Now… up to the dial.', 4.5);
  }
  async function fitHand() {
    const room = rooms[2], st = S(), L = room.ledge;
    G.sim.lock = 1;
    G.cam.override = { pos: V(room.dial.x + 1.2, Y0 + 3.0, room.dial.z + 8.5), look: V(room.dial.x, Y0 + 2.3, room.dial.z), dur: 0.8 };
    G.sim.mimoGo({ x: L.x + 0.6, z: L.z + 1.4 }, L); await wait(0.6);
    await mimoArc({ x: L.x, z: L.z + 0.2 }, L.y, 0.6);
    Sound.play('land', 6); await wait(0.3);
    Sound.play('clockset'); if (room.minute) room.minute.visible = true;
    G.w3d.fx.sparkle(room.dial.x, room.dial.y, room.dial.z + 0.3, 14, ['#ffd166', '#fff3a0']);
    await wait(0.5); await mimoLand();
    st.fitted = true; G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    STORY.think('The hand is back on the dial. Now: what time should the great clock say? (Read the sign!)', 5);
  }
  // the great clock: tell it its hour, the bell's (noon). Graded S–D like the village's clocks
  async function setDial() {
    const room = rooms[2];
    G.cam.override = { pos: V(room.dial.x + 1.2, Y0 + 3.0, room.dial.z + 8.5), look: V(room.dial.x, Y0 + 2.3, room.dial.z), dur: 0.8 };     // (the dial and the sign in view)
    try { await setDial1(); } finally { G.cam.override = null; }
  }
  async function setDial1() {
    const room = rooms[2], st = S(), l = G.state.lang || 'es';
    const cl = { id: 'noon', kind: 'time', h: 12, m: 0 };
    const plain = s => ((l === 'zh' || l === 'ja') && typeof CJK !== 'undefined' ? CJK.plain(s, { lang: l }) : s);
    const r = await UI.command({ name: G.state.mimoName, icon: 'clk.noon', title: 'The great clock’s hands are frozen at 11:00. The sign under it says the bell rings at 12:00. Say the time it should show!', verbs: [], placeholder: 'say the time…',
      hint: 'A whole sentence. (? shows an example)', model: plain(PEAKS.modelOf(cl, l)), modelEn: 'It’s 12:00.' });
    if (!r || r.cancelled) return;
    const g = PEAKS.gradeSet(r.text, l, cl);
    if (!g.said) { Sound.play('wrong'); G.sim.mimo.tiltT = 1.4; STORY.think('The hands don’t move. Say a time, like the sign shows it… (? shows an example)', 5); return; }
    if (!g.right) { Sound.play('wrong'); if (room.dialS) { room.dialS.spin = 0.6; room.dialS.setTime(g.said.h, g.said.m); await wait(1.4); room.dialS.setTime(11, 0); } STORY.think(`The hands spin to ${g.said.h}:${String(g.said.m).padStart(2, '0')}… and stop. The sign says 12:00.`, 5); return; }
    UI.toast(`${g.letter} · ${g.reason}`); Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    G.sim.lock = 1;
    if (room.dialS) { room.dialS.spin = 1.0; room.dialS.setTime(12, 0); }
    Sound.play('clockset'); await wait(1.2);
    for (let k = 0; k < 3; k++) { Sound.play('bell'); await wait(0.6); }
    room.turning = true;
    if (room.ladderIce) { Sound.play('crack'); G.w3d.fx.puff(room.ladderIce.position.x, Y0 + 1.2, room.ladderIce.position.z + 0.3, 14, 0.3, '#dff2fb'); await tween(0.5, k => room.ladderIce.scale.setScalar(1 - k)); room.ladderIce.visible = false; }
    st.dial = g.letter; G.sim.lock = 0; G.save();
    UI.toast('Dong! The great clock strikes twelve, and the ice on the ladder cracks away.');
  }
  async function wakeBoss() {
    const room = rooms[3], st = S(), R = room.R, b = room.boss;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x + 1.5, Y0 + 3.0, R.z + 5.6), look: V(R.x - 2.0, Y0 + 2.0, R.z - 2.0), dur: 0.8 };
    G.sim.mimoGo({ x: R.x - 1.4, z: R.z + 0.6 }, room.bossSolid); await wait(0.6);
    await blowAt(room.bossSolid, 1.4);
    if (b && b.userData) b.userData.mood = 'alert';
    Sound.play('grow');
    await tween(0.6, k => { if (b) b.rotation.z = Math.sin(k * Math.PI * 6) * 0.08; });
    G.w3d.fx.puff(R.x - 2.4, Y0 + 2.4, R.z - 2.0, 18, 0.4, '#f4f8fb');
    await STORY.you('It’s awake… and it’s growing! Quick, {mimo}: don’t let it pack on more snow!');
    G.cam.override = null; G.sim.lock = 0;
    // (the giant and one little one: snowballs grow every round they aren't hit, so three of them snowball too fast)
    const r = await G.fight({ foes: [{ kind: 'snowball', color: 'blue', size: 'big', giant: 2, hp: 24 }, { kind: 'snowball', color: 'red', size: 'small' }], place: { biome: 'snow', x: 240, z: -278 } });
    if (!r || r.outcome !== 'win') {
      if (b && b.userData) b.userData.mood = 'asleep';
      STORY.think(r && r.outcome === 'lose' ? 'Ouch… The giant snowman settles back down by the bell, cold and still. Catch your breath, then try again.' : 'The giant snowman settles back down by the bell.', 5);
      return;
    }
    st.boss = true; if (b) b.visible = false; unsolid(room.bossSolid);
    G.w3d.fx.puff(R.x - 2.4, Y0 + 2.0, R.z - 2.0, 24, 0.5, '#f4f8fb'); Sound.play('learned');
    await tween(0.6, k => { room.bellIce.scale.setScalar(1 - k); }); room.bellIce.visible = false; Sound.play('crack');
    await wait(0.4);
    room.page.visible = true; Sound.play('page');
    await STORY.you('Something fluttered down from the rafters. A page from Noa’s notebook!');
    G.save();
  }
  async function readPage() {
    const room = rooms[3], st = S();
    Sound.play('page');
    await UI.page('page.peaks', 'w.snow');
    st.page = true; room.page.visible = false;
    if (!G.state.pages.includes('page.peaks')) G.state.pages.push('page.peaks');
    await STORY.you('Noa went down to Port Brisa… by the sea. We’re right behind you, Noa! First: the {w.bell}.');
    G.save();
  }
  async function ringBell(verb) {
    const room = rooms[3], bl = room.bell, st = S(), M = G.sim.mimo;
    G.sim.lock = 1;
    G.cam.override = { pos: V(bl.x + 4.2, Y0 + 2.8, bl.z + 6.0), look: V(bl.x, Y0 + 2.6, bl.z), dur: 0.8 };
    if (verb === 'v.throw') {
      G.sim.mimoGo({ x: bl.x + 0.6, z: bl.z + 3.0 }, bl); await wait(0.7);
      const ball = part(GEO.sphere, '#f4f8fb', [0, 0, 0], [0.16, 0.16, 0.16], { ink: 0.01 }); G.w3d.scene.add(ball);
      const p0 = V(M.x, Y0 + 0.9, M.z), p1 = V(bl.x, Y0 + 3.4, bl.z + 0.3);
      M.hop = { t: 0 }; Sound.play('whiff');
      await tween(0.5, k => { ball.position.set(lerp(p0.x, p1.x, k), lerp(p0.y, p1.y, k) + Math.sin(k * Math.PI) * 1.2, lerp(p0.z, p1.z, k)); });
      G.w3d.scene.remove(ball); G.w3d.fx.puff(p1.x, p1.y, p1.z, 8, 0.2, '#f4f8fb');
    } else {
      G.sim.mimoGo({ x: bl.x + 0.5, z: bl.z + 1.5 }, bl); await wait(0.6);
      await mimoArc({ x: bl.x + 0.4, z: bl.z + 0.8 }, Y0 + 2.4, 0.6);
      Sound.play('hit');
    }
    for (let k = 0; k < 3; k++) { Sound.play('bigbell'); bl.swing = 0.4; G.w3d.fx.sparkle(bl.x, Y0 + 3.0, bl.z + 0.4, 18, ['#ffd166', '#fff3a0', '#ffffff']); await wait(1.0); }
    if (verb !== 'v.throw') await mimoLand();
    st.bell = true;
    await wait(0.4);
    G.cam.override = null; G.sim.lock = 0;
    await finale();
  }
  // outside again: every clock in Escarcha rings, the tower's clock runs, the color comes back: the fifth bell of eight
  async function finale() {
    await UI.fade(1, 700);
    hideAll(); inside = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z + 2, 0);
    const f = G.state.flags;
    f.peaksFree = true; f.bells = Math.max(5, f.bells || 0);
    const B = PEAKS.built;
    if (B && B.objects.tower) { B.objects.tower.clk.setTime(12, 0); B.objects.tower.clk.spin = 1.2; setTimeout(() => { B.objects.tower.clk.run = true; }, 1500); }
    if (PEAKS.liftPatch) PEAKS.liftPatch('peaks', false);
    if (B) for (const p of B.people) { if (p.villager || p.story) p.look = { x: PEAKS.TOWER.x, z: PEAKS.TOWER.z }; }
    G.sim.lock = 1;
    G.cam.override = { pos: V(PEAKS.VILLAGE.x - 2, PEAKS.VY + 13, PEAKS.VILLAGE.z + 18), look: V(PEAKS.TOWER.x - 8, PEAKS.LY + 10, PEAKS.TOWER.z) };
    G.cam.snap(0, 0.3, 9);
    await UI.fade(0, 900);
    for (let k = 0; k < 5; k++) { Sound.play('bigbell'); if (B) B.ringBell(); if (k > 1) Sound.play('chime'); await wait(1.0); }
    await UI.chapter('The fifth bell', '5 of 8 · The Frost Peaks tick again');
    G.cam.override = null; G.sim.lock = 0;
    if (B) for (const p of B.people) p.look = null;
    await STORY.you('Listen… every {w.clock} in Escarcha is ringing! Five bells down, three to go. Let’s tell Tobías.');
    G.save();
  }

  // ------------------------------------------------------------ moving between rooms, in and out
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    // (a wander spot or station left in the room behind would make Mimo «poof» straight back there: sim.js jumps it to its goal)
    Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + 1.1; M.z = z + 0.8; M.hidden = false; M.wander = null; M.station = null; M.look = null; G.sim.snap();
  }
  function show(i) {
    rooms.forEach((r, k) => { r.g.visible = k === i; }); cur = i; quick = {};
  }
  function hideAll() { rooms.forEach(r => { r.g.visible = false; }); cur = -1; quick = {}; }
  async function enter() {
    build();
    await UI.fade(1, 450);
    inside = true; G.w3d.setInterior({ fog: '#cfe2ee', near: 14, far: 40 });
    show(0); const R = ROOMS[0]; teleport(R.x - 4.5, R.z + 3.6, Math.PI); G.cam.snap(Math.PI, 0.66, 10.5);
    await UI.fade(0, 450);
    if (!S().seen0) { S().seen0 = true; UI.chapter('The Ice Clock Tower', 'The Frost Peaks · the bell is at the very top'); STORY.think('Brrr… a frozen fog fills the whole hall. You can hardly see.', 5); }
    G.save();
  }
  async function leave() {
    await UI.fade(1, 450);
    hideAll(); inside = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw); G.cam.snap(0, 0.28, 8.5);
    await UI.fade(0, 450);
  }
  async function go(i, from = 'below') {
    await UI.fade(1, 350);
    show(i);
    const R = ROOMS[i], room = rooms[i];
    if (from === 'above') {           // back down from the room above: arrive by its way up
      const at = i === 0 ? { x: room.stairs.x - 1.8, z: room.stairs.z + 1.4 } : i === 1 ? { x: room.lift.x - 1.6, z: room.lift.z + 1.6 } : { x: R.x + 4.2, z: R.z - 3.2 };
      teleport(at.x, at.z, 0);
    } else teleport(R.x - 4.5, R.z + 3.6, Math.PI);
    G.cam.snap(Math.PI, 0.66, 10.5);
    await UI.fade(0, 350);
    const st = S();
    if (!st['seen' + i]) {
      st['seen' + i] = true; UI.chapter(R.name, R.sub);
      if (i === 1 && !st.ambush) {        // the Ice Mills: snowballs roll out from behind the mills
        await wait(1.2);
        Sound.play('snowroll');
        await STORY.you('Snowballs! And they’re getting bigger… Hit them fast, {mimo}!');
        const r = await G.fight({ foes: [{ kind: 'snowball', color: 'green', size: 'small' }, { kind: 'snowball', color: 'red', size: 'small' }, { kind: 'hushling', color: 'blue', size: 'small' }], place: { biome: 'snow', x: 240, z: -278 } });
        if (r && r.outcome === 'win') st.ambush = true;
        else { st['seen' + i] = false; await go(i - 1, 'above'); return; }
        STORY.think('Three little ice mills, frozen in lumps of ice…', 4);
      }
      if (i === 2) STORY.think('The great clock, from inside! Its minute hand is out there on a floe of ice…', 5);
      if (i === 3) STORY.think('The belfry. The bell is sealed in ice… and something huge sits beside it.', 4.5);
    }
    G.save();
  }

  // ------------------------------------------------------------ per frame (while inside)
  function update(dt, t) {
    if (!inside || cur < 0) return;
    const room = rooms[cur];
    if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    const st = S();
    if (room.turning || (cur === 0 && st.cog) || (cur === 1 && st.mills) || (cur === 2 && st.dial)) room.gears.forEach((g, i) => { g.rotation.z += dt * (i % 2 ? -0.8 : 0.6); });
    if (cur === 0 && st.cog && room.cogG.children[0]) room.cogG.children[0].rotation.z -= dt * 0.7;        // (the cog, in its socket, turns with them)
    if (cur === 0 && room.fog) room.fog.forEach(f => { if (f.sp.visible && f.k > 0.99) { f.sp.position.x = f.x0 + Math.sin(t * 0.3 + f.ph) * 0.4; f.sp.position.y = f.y0 + Math.sin(t * 0.4 + f.ph) * 0.2; } });
    if (cur === 1) room.mills.forEach(m => { m.spin = damp(m.spin, st.mills ? 4 : 0, 0.5, dt); m.hub.rotation.z -= dt * m.spin; });
    if (cur === 2 && room.dialS) room.dialS.step(dt, t);
    if (cur === 2 && room.floeG) room.floeG.position.y = Y0 + 0.06 + Math.sin(t * 1.3) * 0.03;
    if (cur === 3) {
      const bl = room.bell; bl.swing = damp(bl.swing, 0, 1.0, dt); bl.piv.rotation.x = Math.sin(t * 3.4) * bl.swing;
      if (room.boss && room.boss.visible && room.boss.userData.animate) room.boss.userData.animate(dt, t, 0);
      if (room.page.visible) room.pageGlow.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
    }
  }

  return {
    init(game) { G = game; },
    enter, leave, update, interactables, target, ROOMS, OUTSIDE,
    get inside() { return inside; }, get room() { return cur; },
    _: { rooms, go, S, build, applyState, blowFog, pushCog, breakIce, spinMills, swimFloe, fitHand, setDial, wakeBoss, readPage, ringBell, finale },
  };
})();
