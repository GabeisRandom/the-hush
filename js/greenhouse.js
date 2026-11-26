'use strict';
// The great greenhouse (DESIGN.md 14.1, region 4): the Bloom Gardens' dungeon, at the south end of the valley. Four glass halls,
// built like the Great Mill's and the mine's rooms (mill.js, mine.js): high up and out of sight at y = 300 (over the empty
// north-west woods, clear of every other room: the houses (−272, 0), the corn hall (−255, 35), the attic (−240, 56), the
// script school (−224, −22); the mill's, the lighthouse's and the mine's are far east), walls facing inward (the camera looks in
// from outside, like a dollhouse), one hall at a time, and every action a sentence to Mimo («tell Mimo»; once a verb has
// worked on a thing in a hall, E repeats it).
//   0 the Fern House:  the door's catch is up on the gallery: Mimo climbs the vine trellis («¡trepa!») and stomps the stiff
//                      button up there («¡salta!»); a huge flowerpot blocks the doorway («¡empuja!»)
//   1 the Lily Pond:   picky bees come down at you (a fight); the way on is across the pond, where the plank bridge is tied up
//                      against the far wall: Mimo swims out to the islet for a stone («¡nada!») and knocks the bridge's
//                      catch loose with it («¡lanza!»)
//   2 the Palm House:  gray thorns round the palm («¡golpea!»), up the palm and onto the shelf to tip the watering can over
//                      the dry gray bud («¡trepa!»), then a song wakes it, and it opens off the stairs («¡canta!»)
//   3 the Dome:        the Queen Bee asleep on her honeycomb: the boss (tell her what she likes, or fight her); Noa's page
//                      (she went on to the Frost Peaks); up the vine to the bell («¡trepa!») and ring it yourself («¡golpea la
//                      campana!», or throw a stone at it): the fourth bell. Outside, the valley's color comes back.
//   GREENHOUSE.init(game) · enter() · leave() · update(dt, t) · interactables() · target() · inside · OUTSIDE (the door)
// Progress lives in state.green; flags.gardensFree and flags.bells = 4 when the bell rings.
const GREENHOUSE = (() => {
  let G = null, built = false;
  const { part, G: GEO } = TK;
  const Y0 = 300, HW = 7, HD = 6, WH = 5.4, INK = '#2b2235';
  const ROOMS = [
    { id: 'ferns', name: 'The Fern House', sub: 'The great greenhouse · the first hall', x: -250, z: -248 },
    { id: 'pond', name: 'The Lily Pond', sub: 'The great greenhouse · the water garden', x: -222, z: -248 },
    { id: 'palms', name: 'The Palm House', sub: 'The great greenhouse · under the palms', x: -222, z: -276 },
    { id: 'dome', name: 'The Dome', sub: 'The great greenhouse · the very top', x: -250, z: -276, wh: 7.6 },
  ];
  const OUTSIDE = { x: GARDENS.DOOR.x, z: GARDENS.DOOR.z - 0.6, yaw: Math.PI };
  const VERBS = ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing', 'v.climb'];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = () => G.state.green || (G.state.green = {});
  const ex = w => (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const name = () => G.state.mimoName || 'Mimo';
  let inside = false, cur = -1, quick = {}, carried = null;
  const rooms = [];

  // ------------------------------------------------------------ materials: terracotta tiles, glass walls with the garden behind
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const tiles = tex(256, 256, c => {
      const R = rng(4); c.fillStyle = '#b8664a'; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const k = R(); c.fillStyle = k < 0.33 ? '#c9744f' : k < 0.66 ? '#b86a48' : '#c27a5a'; c.fillRect(i * 32 + 1.5, j * 32 + 1.5, 29, 29); }
      c.fillStyle = 'rgba(255,240,220,0.12)'; for (let k = 0; k < 60; k++) c.fillRect(R() * 256, R() * 256, 4 + R() * 10, 2);
    }, 3, 3);
    // what you see through the glass: the sky and leafy green outside
    const garden = TK.canvasTex(256, 256, c => {
      const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#cfeef5'); g.addColorStop(0.55, '#e8f6e0'); g.addColorStop(1, '#a8d08a'); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
      const R = rng(9); for (let k = 0; k < 40; k++) { c.fillStyle = ['#7fb86a', '#5fa055', '#8fc878'][k % 3]; c.beginPath(); c.arc(R() * 256, 150 + R() * 110, 16 + R() * 26, 0, TAU); c.fill(); }
    });
    MAT = {
      floor: new THREE.MeshToonMaterial({ map: tiles, gradientMap: TK.grad }),
      glass: new THREE.MeshToonMaterial({ color: '#d9f2f6', gradientMap: TK.grad, transparent: true, opacity: 0.35, depthWrite: false }),
      garden: new THREE.MeshBasicMaterial({ map: garden, fog: false }),
      water: new THREE.MeshToonMaterial({ color: '#4f9ab0', gradientMap: TK.grad, transparent: true, opacity: 0.9, emissive: new THREE.Color('#123a44') }),
      hole: new THREE.MeshBasicMaterial({ color: '#203024' }),
    };
    return MAT;
  }
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(s); sp.renderOrder = 2; return sp; };
  const Kit = () => GARDENS.Kit(), GG = () => GARDENS.GEO;
  const LEAF = ['#4f9a45', '#5fae4f', '#478c3e', '#6abf5a'];

  // ------------------------------------------------------------ a hall's shell: tiled floor, glass walls with white frames, the garden behind
  function shell(R, g) {
    const M = mats(), wh = R.wh || WH;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, 0.4, HD * 2), M.floor); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
    [[0, -HD, 0, HW * 2], [-HW, 0, Math.PI / 2, HD * 2], [HW, 0, -Math.PI / 2, HD * 2]].forEach(([dx, dz, ry, w]) => {
      const back = new THREE.Mesh(new THREE.PlaneGeometry(w + 6, wh + 0.4), M.garden); back.position.set(R.x + dx * 1.35, Y0 + wh / 2, R.z + dz * 1.35); back.rotation.y = ry; g.add(back);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, wh), M.glass); m.position.set(R.x + dx, Y0 + wh / 2, R.z + dz); m.rotation.y = ry; m.renderOrder = 3; g.add(m);
    });
    // the roof: a glass ridge (seen from inside as a pale ceiling)
    const k = Kit(), GE = GG();
    // white iron frames on the back and the sides (none in front: the camera looks in through there)
    for (let i = 0; i <= 7; i++) { const x = R.x - HW + (i / 7) * HW * 2; k.box(x, Y0 + wh / 2, R.z - HD + 0.05, 0.1, wh, 0.1, '#f6f3ea', { ink: 0.01 }); }
    for (const y of [Y0 + 1.0, Y0 + wh - 0.1]) k.box(R.x, y, R.z - HD + 0.05, HW * 2, 0.1, 0.1, '#f6f3ea', { ink: 0.01 });
    for (const s of [-1, 1]) { for (let i = 0; i <= 5; i++) { const z = R.z - HD + (i / 5) * HD * 2; k.box(R.x + s * (HW - 0.05), Y0 + wh / 2, z, 0.1, wh, 0.1, '#f6f3ea', { ink: 0.01 }); } k.box(R.x + s * (HW - 0.05), Y0 + wh - 0.1, R.z, 0.1, 0.1, HD * 2, '#f6f3ea', { ink: 0.01 }); }
    // planters along the walls, ferns and leaves in them
    const RR = rng(Math.round(R.z * 7 + R.x * 3));
    for (let i = 0; i < 9; i++) {
      const side = i % 3, x = side === 0 ? R.x - HW + 0.7 : side === 1 ? R.x + HW - 0.7 : R.x - HW + 2 + RR() * (HW * 2 - 4), z = side === 2 ? R.z - HD + 0.7 : R.z - HD + 1.6 + RR() * (HD * 2 - 4.2);
      k.box(x, Y0 + 0.3, z, 0.9, 0.6, 0.9, '#c9643f', { ink: 0.015 });
      for (let j = 0; j < 4; j++) { const a = (j / 4) * TAU + RR(); k.add(GE.sphere, x + Math.cos(a) * 0.3, Y0 + 0.85 + RR() * 0.3, z + Math.sin(a) * 0.3, 0.42, 0.12, 0.2, LEAF[j % 4], { ry: -a, rz: 0.5, ink: 0.008 }); }
    }
    // hanging baskets of flowers from the top beam
    for (const x of [-4.5, 0, 4.5]) { k.add(GE.cyl6, R.x + x, Y0 + wh - 0.6, R.z - HD + 1.2, 0.02, 1.0, 0.02, '#8a6440', { ink: 0 }); k.add(GE.half, R.x + x, Y0 + wh - 1.15, R.z - HD + 1.2, 0.35, 0.25, 0.35, '#c9a66b', { rz: Math.PI, ink: 0.01 }); for (let j = 0; j < 4; j++) k.add(GE.sphere, R.x + x + (j - 1.5) * 0.16, Y0 + wh - 1.05, R.z - HD + 1.2 + (j % 2 ? 0.14 : -0.14), 0.09, 0.09, 0.09, ['#ff8fb1', '#f2c94c', '#e2574c', '#b9a2ff'][j], { ink: 0.005 }); }
    k.build(g);
    // the way back: a doormat by the front-left
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), new THREE.MeshToonMaterial({ color: '#8a6440', gradientMap: TK.grad })); mat.rotation.x = -Math.PI / 2; mat.position.set(R.x - 4.6, Y0 + 0.012, R.z + HD - 0.8); g.add(mat);
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - HD - 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: R.x, z: R.z + HD + 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 },
      { obox: 1, x: R.x - HW - 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }, { obox: 1, x: R.x + HW + 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }]);
    WORLD.addPlatforms([{ box: [R.x - HW, R.x + HW, R.z - HD, R.z + HD], top: Y0 }]);
  }
  // a vine climbing up something: a stalk with leaves (and a flower on top)
  function vine(k, x, z, y0, h, lean = 0) {
    const GE = GG();
    k.rod(GE.cyl6, [x, y0, z], [x + lean, y0 + h, z], 0.06, '#4f9a45', 0.01);
    for (let i = 0; i < Math.floor(h / 0.35); i++) { const a = i * 2.3, y = y0 + 0.2 + i * 0.35; k.add(GE.sphere, x + lean * (i * 0.35 / h) + Math.cos(a) * 0.14, y, z + Math.sin(a) * 0.1, 0.16, 0.05, 0.09, LEAF[i % 4], { ry: -a, rz: 0.5, ink: 0.006 }); }
  }
  const unsolid = o => { if (!o) return; o.x = o.z = 1e5; };

  // ------------------------------------------------------------ build the four halls (on first entry)
  function build() {
    if (built) return; built = true;
    const scene = G.w3d.scene, GE = GG();
    ROOMS.forEach((R, i) => { const g = new THREE.Group(); g.visible = false; scene.add(g); shell(R, g); rooms[i] = { R, g }; });
    // 0 · the Fern House: the gallery (with its stiff button) up the vine trellis, the door, and the huge flowerpot in front of it
    {
      const room = rooms[0], R = room.R, g = room.g, k = Kit();
      room.gal = { x0: R.x - HW + 0.2, x1: R.x - 1.6, z0: R.z - HD + 0.2, z1: R.z - 3.4, y: Y0 + 2.3 };
      const G0 = room.gal, gx = (G0.x0 + G0.x1) / 2, gz = (G0.z0 + G0.z1) / 2;
      k.box(gx, G0.y - 0.1, gz, G0.x1 - G0.x0, 0.2, G0.z1 - G0.z0, '#e8dcc4', { ink: 0.02 });
      for (const x of [G0.x0 + 0.3, G0.x1 - 0.2]) k.add(GE.cyl6, x, Y0 + 1.1, G0.z1 - 0.15, 0.08, 2.2, 0.08, '#f6f3ea', { ink: 0.01 });
      for (let i = 0; i <= 10; i++) k.box(G0.x0 + 0.2 + i * ((G0.x1 - G0.x0 - 0.4) / 10), G0.y + 0.35, G0.z1 - 0.05, 0.05, 0.7, 0.05, '#f6f3ea', { ink: 0.006 });
      k.box(gx, G0.y + 0.72, G0.z1 - 0.05, G0.x1 - G0.x0, 0.06, 0.08, '#f6f3ea', { ink: 0.008 });
      // the trellis up to it, at its front edge (vines and pink flowers)
      room.trel = { x: G0.x1 - 1.2, z: G0.z1 + 0.25 };
      for (let i = 0; i <= 3; i++) k.box(room.trel.x - 0.75 + i * 0.5, Y0 + 1.2, room.trel.z, 0.06, 2.4, 0.06, '#e8dcc4', { ink: 0.008 });
      for (let j = 0; j <= 4; j++) k.box(room.trel.x, Y0 + 0.2 + j * 0.5, room.trel.z, 1.6, 0.06, 0.06, '#e8dcc4', { ink: 0.008 });
      vine(k, room.trel.x - 0.5, room.trel.z + 0.05, Y0, 2.4, 0.1); vine(k, room.trel.x + 0.5, room.trel.z + 0.05, Y0, 2.2, -0.1);
      // the button up there, stiff with gray Hush crust
      room.btn = { x: G0.x0 + 1.6, z: gz };
      k.add(GE.cyl, room.btn.x, G0.y + 0.04, room.btn.z, 0.42, 0.08, 0.42, '#8d8a9a', { ink: 0.012 });
      k.build(g);
      room.btnTop = grp(g, room.btn.x, G0.y + 0.1, room.btn.z);
      room.btnTop.add(part(new THREE.SphereGeometry(0.28, 14, 7, 0, TAU, 0, Math.PI / 2), '#b9b7c6', [0, 0, 0], null, { ink: 0.015 }));
      WORLD.addSolids([{ obox: 1, x: gx, z: gz, hw: (G0.x1 - G0.x0) / 2, hd: (G0.z1 - G0.z0) / 2, rot: 0 }]);
      // the door in the back wall (glass, locked: a gray catch), and the flowerpot in front of it
      room.door = { x: R.x + 3.6, z: R.z - HD + 0.06 };
      const dk = Kit();
      dk.box(room.door.x, Y0 + 1.25, room.door.z + 0.05, 1.9, 2.5, 0.1, '#cfe6dc', { ink: 0.015 }).box(room.door.x, Y0 + 1.25, room.door.z + 0.1, 0.06, 2.5, 0.06, '#f6f3ea', { ink: 0 });
      dk.box(room.door.x, Y0 + 2.6, room.door.z + 0.05, 2.2, 0.16, 0.14, '#f6f3ea', { ink: 0.01 });
      dk.build(g);
      room.catchG = grp(g, room.door.x + 0.6, Y0 + 1.25, room.door.z + 0.16); room.catchG.add(part(GEO.box, '#7d7889', [0, 0, 0], [0.3, 0.2, 0.1], { ink: 0.01 }));
      room.doorSolid = { obox: 1, x: room.door.x, z: room.door.z + 0.3, hw: 1.0, hd: 0.3, rot: 0 }; WORLD.extra.push(room.doorSolid);
      room.pot = { x: room.door.x, z: R.z - HD + 1.9 };
      const pg = grp(g, room.pot.x, Y0, room.pot.z), pk = Kit();
      pk.add(GE.cyl, 0, 0.55, 0, 0.75, 1.1, 0.75, '#c9643f', { ink: 0.02 }).add(GE.cyl, 0, 1.12, 0, 0.82, 0.14, 0.82, '#b8563a', { ink: 0.012 }).add(GE.cyl, 0, 1.1, 0, 0.7, 0.06, 0.7, '#5a3a24', { ink: 0 });
      pk.add(GE.cyl6, 0, 2.0, 0, 0.1, 1.8, 0.1, '#8a6440', { ink: 0.01 });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; pk.add(GE.sphere, Math.cos(a) * 0.6, 2.85, Math.sin(a) * 0.6, 0.75, 0.08, 0.22, LEAF[i % 4], { ry: -a, rz: -0.35, ink: 0.008 }); }
      pk.build(pg); room.pot.g = pg;
      room.pot.solid = { x: room.pot.x, z: room.pot.z, r: 0.9 }; WORLD.extra.push(room.pot.solid);
    }
    // 1 · the Lily Pond: the pond, its lily pads, the islet with a stone, the plank bridge tied up against the far wall
    {
      const room = rooms[1], R = room.R, g = room.g, k = Kit();
      room.pond = { x: R.x + 0.4, z: R.z - 1.2, rx: 5.4, rz: 3.0 };
      const water = new THREE.Mesh(new THREE.CircleGeometry(1, 40), mats().water); water.rotation.x = -Math.PI / 2; water.scale.set(room.pond.rx, room.pond.rz, 1); water.position.set(room.pond.x, Y0 + 0.03, room.pond.z); g.add(water); room.water = water;
      for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU; k.add(GE.ico, room.pond.x + Math.cos(a) * (room.pond.rx + 0.15), Y0 + 0.1, room.pond.z + Math.sin(a) * (room.pond.rz + 0.15), 0.3, 0.16, 0.26, i % 2 ? '#a8a294' : '#9a958c', { ry: a, ink: 0.012 }); }
      const RR = rng(21);
      for (let i = 0; i < 9; i++) { const a = RR() * TAU, rr = 0.3 + RR() * 0.6, x = room.pond.x + Math.cos(a) * room.pond.rx * rr, z = room.pond.z + Math.sin(a) * room.pond.rz * rr; k.add(GE.cyl, x, Y0 + 0.06, z, 0.42, 0.03, 0.42, '#5fae4f', { ink: 0.006 }); if (i % 3 === 0) k.add(GE.sphere, x + 0.1, Y0 + 0.16, z, 0.13, 0.1, 0.13, '#ff8fb1', { ink: 0.005 }); }
      room.islet = { x: room.pond.x + 1.6, z: room.pond.z + 0.2 };
      k.add(GE.ico, room.islet.x, Y0 + 0.16, room.islet.z, 0.8, 0.3, 0.7, '#8f8a80', { ink: 0.015 });
      k.build(g);
      WORLD.extra.push({ obox: 1, x: room.pond.x, z: room.pond.z, hw: room.pond.rx * 0.85, hd: room.pond.rz * 0.82, rot: 0 });
      room.stoneG = grp(g, room.islet.x, Y0 + 0.42, room.islet.z); room.stoneG.add(part(GEO.ico1, '#a3a196', [0, 0, 0], [0.18, 0.15, 0.17], { ink: 0.01 }));
      // the exit, and the bridge tied up against the far wall (the catch holding its rope is high on the wall)
      room.exit = { x: R.x - 2.6, z: R.z - HD + 0.06 };
      const ek = Kit(); ek.box(room.exit.x, Y0 + 1.25, room.exit.z + 0.05, 1.9, 2.5, 0.1, '#cfe6dc', { ink: 0.015 }).box(room.exit.x, Y0 + 2.6, room.exit.z + 0.05, 2.2, 0.16, 0.14, '#f6f3ea', { ink: 0.01 }); ek.build(g);
      room.bridge = grp(g, room.exit.x, Y0 + 0.1, room.pond.z - room.pond.rz - 0.2);
      const bk = Kit(); for (let i = 0; i < 9; i++) bk.box(0, 0, 0.35 + i * 0.68, 1.5, 0.12, 0.6, i % 2 ? '#a57d57' : '#9a7450', { ink: 0.012 }); bk.box(-0.7, 0.05, 3.3, 0.08, 0.1, 6.4, '#6b4a30', { ink: 0.006 }).box(0.7, 0.05, 3.3, 0.08, 0.1, 6.4, '#6b4a30', { ink: 0.006 });
      bk.build(room.bridge); room.bridge.rotation.x = -Math.PI / 2 + 0.06;          // (tied up: standing against the wall)
      room.latch = { x: room.exit.x + 1.3, y: Y0 + 4.1, z: R.z - HD + 0.25 };
      room.latchG = grp(g, room.latch.x, room.latch.y, room.latch.z); room.latchG.add(part(GEO.box, '#7d7889', [0, 0, 0], [0.28, 0.4, 0.14], { ink: 0.012 }));
      room.rope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 5), new THREE.MeshToonMaterial({ color: '#c9a66b', gradientMap: TK.grad }));
      g.add(room.rope);
      const rp = (a, b) => { const d = new THREE.Vector3().subVectors(b, a); room.rope.position.copy(a).addScaledVector(d, 0.5); room.rope.scale.set(1, d.length(), 1); room.rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };
      room.setRope = on => { room.rope.visible = on; if (on) rp(V(room.latch.x, room.latch.y - 0.1, room.latch.z + 0.05), V(room.exit.x, Y0 + 6.2, room.bridge.position.z - 0.1)); };
      room.setRope(true);
    }
    // 2 · the Palm House: the palm with gray thorns round its foot, the shelf with the watering can, the gray bud at the stairs
    {
      const room = rooms[2], R = room.R, g = room.g, k = Kit();
      room.palm = { x: R.x - 3.8, z: R.z - 2.6 };
      for (let i = 0; i < 8; i++) k.add(GE.cyl6, room.palm.x + Math.sin(i * 0.6) * 0.05, Y0 + 0.3 + i * 0.5, room.palm.z, 0.22 - i * 0.012, 0.52, 0.22 - i * 0.012, i % 2 ? '#8a6440' : '#9a7450', { ink: 0.015 });
      for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; k.add(GE.sphere, room.palm.x + Math.cos(a) * 1.0, Y0 + 4.25, room.palm.z + Math.sin(a) * 1.0, 1.2, 0.07, 0.3, LEAF[i % 4], { ry: -a, rz: -0.3, ink: 0.01 }); }
      for (let i = 0; i < 3; i++) k.add(GE.sphere, room.palm.x + (i - 1) * 0.2, Y0 + 3.95, room.palm.z + 0.18, 0.14, 0.14, 0.14, '#6b4a30', { ink: 0.008 });
      // the tall shelf by it, with the watering can on top
      room.shelf = { x: R.x - 1.4, z: R.z - HD + 1.0, y: Y0 + 3.0 };
      for (const s of [-1, 1]) for (const t of [-1, 1]) k.add(GE.cyl6, room.shelf.x + s * 0.65, Y0 + 1.5, room.shelf.z + t * 0.35, 0.05, 3.0, 0.05, '#8a6440', { ink: 0.006 });
      for (const y of [Y0 + 1.0, Y0 + 2.0, room.shelf.y]) k.box(room.shelf.x, y, room.shelf.z, 1.5, 0.08, 0.85, '#a57d57', { ink: 0.01 });
      for (let i = 0; i < 3; i++) k.add(GE.cyl, room.shelf.x - 0.4 + i * 0.4, Y0 + 1.2, room.shelf.z, 0.14, 0.24, 0.14, '#c9643f', { ink: 0.006 });
      // the stairs up (a dark doorway in the back wall), and the bud's bed in front of it
      room.stairs = { x: R.x + 3.4, z: R.z - HD + 0.06 };
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.8), mats().hole); sh.position.set(room.stairs.x, Y0 + 1.4, room.stairs.z + 0.02); g.add(sh);
      for (let i = 0; i < 4; i++) k.box(room.stairs.x, Y0 + 0.12 + i * 0.24, room.stairs.z + 0.9 - i * 0.22, 1.8, 0.24, 0.3, '#c9bca8', { ink: 0.008 });
      room.bed = { x: room.stairs.x, z: R.z - HD + 2.6 };
      k.add(GE.cyl, room.bed.x, Y0 + 0.2, room.bed.z, 1.1, 0.4, 1.1, '#8a6440', { ink: 0.015 });
      k.build(g);
      WORLD.extra.push({ x: room.palm.x, z: room.palm.z, r: 0.45 }, { obox: 1, x: room.shelf.x, z: room.shelf.z, hw: 0.8, hd: 0.5, rot: 0 });
      room.canG = grp(g, room.shelf.x + 0.2, room.shelf.y + 0.05, room.shelf.z);
      { const ck = Kit(); ck.add(GE.cyl, 0, 0.22, 0, 0.2, 0.42, 0.2, '#5fa8c8', { ink: 0.01 }).rod(GE.cyl6, [0.18, 0.18, 0], [0.55, 0.4, 0], 0.035, '#5fa8c8', 0.006).add(GE.cyl, 0.58, 0.42, 0, 0.07, 0.05, 0.07, '#4f8aa8', { rz: -0.9, ink: 0 }); ck.add(GE.torus, -0.08, 0.36, 0, 0.16, 0.16, 0.16, '#4f8aa8', { rx: Math.PI / 2, ink: 0 }); ck.build(room.canG); }
      // the gray thorns round the palm's foot
      room.thorns = grp(g, room.palm.x, Y0, room.palm.z);
      { const tk = Kit(); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; tk.add(GE.ico, Math.cos(a) * 0.7, 0.3 + (i % 3) * 0.12, Math.sin(a) * 0.7, 0.32, 0.3, 0.28, i % 2 ? '#8d8a9a' : '#7d7889', { ry: a, ink: 0.012 }); tk.add(GE.cone, Math.cos(a) * 0.95, 0.55, Math.sin(a) * 0.95, 0.06, 0.35, 0.06, '#5a5666', { rz: Math.cos(a) * 1.1, rx: -Math.sin(a) * 1.1, ink: 0 }); } tk.build(room.thorns); }
      room.thornSolid = { x: room.palm.x, z: room.palm.z, r: 1.2 }; WORLD.extra.push(room.thornSolid);
      // the bud: a gray, closed flower as tall as you, petals that open (green once watered, its colors once it blooms)
      room.bud = grp(g, room.bed.x, Y0 + 0.4, room.bed.z);
      room.budMat = new THREE.MeshToonMaterial({ color: '#9a96a8', gradientMap: TK.grad, side: THREE.DoubleSide });
      room.petals = [];
      for (let i = 0; i < 6; i++) {
        const pv = new THREE.Group(); pv.rotation.y = (i / 6) * TAU; room.bud.add(pv);
        const hinge = new THREE.Group(); hinge.position.set(0, 0.1, 0.18); pv.add(hinge);
        // (no ink hull: a petal is an open shell, and from its hollow side a hull would show as a black hole)
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI, 0, Math.PI), room.budMat); m.scale.set(0.75, 1.8, 0.4); m.position.y = 1.0; m.rotation.y = -Math.PI / 2; m.castShadow = true;
        hinge.add(m); room.petals.push(hinge);
      }
      room.stem = part(GEO.cyl, '#6f8a5a', [0, 0.1, 0], [0.18, 0.4, 0.18], { ink: 0.01 }); room.bud.add(room.stem);
      room.budSolid = { x: room.bed.x, z: room.bed.z, r: 1.3 }; WORLD.extra.push(room.budSolid);
      room.water = [];
    }
    // 3 · the Dome: the honeycomb with the Queen Bee asleep on it, the bell up under the dome, the vine column up to it
    {
      const room = rooms[3], R = room.R, g = room.g, k = Kit(), wh = R.wh;
      room.comb = { x: R.x - 0.6, z: R.z - 3.0 };
      for (let i = 0; i < 14; i++) { const row = Math.floor(i / 5), col = i % 5, x = room.comb.x - 1.6 + col * 0.8 + (row % 2) * 0.4, y = Y0 + 0.45 + row * 0.7; k.add(new THREE.CylinderGeometry(0.42, 0.42, 0.7, 6), x, y, room.comb.z, 1, 1, 1, i % 3 ? '#f2c94c' : '#e6a93c', { rx: Math.PI / 2, ink: 0.012 }); }
      // the bell's beam across the dome, and the vine column up to it
      room.bell = { x: R.x + 3.2, y: Y0 + wh - 1.4, z: R.z - 2.6 };
      k.box(R.x + 2.4, Y0 + wh - 0.55, room.bell.z, 6.0, 0.3, 0.32, '#f6f3ea', { ink: 0.015 });
      room.col = { x: R.x + 5.4, z: R.z - 2.6 };
      k.add(GE.cyl6, room.col.x, Y0 + wh / 2, room.col.z, 0.16, wh, 0.16, '#f6f3ea', { ink: 0.012 });
      vine(k, room.col.x - 0.12, room.col.z + 0.1, Y0, wh - 0.6, 0.02); vine(k, room.col.x + 0.12, room.col.z - 0.1, Y0, wh - 1.2, -0.03);
      k.build(g);
      WORLD.extra.push({ obox: 1, x: room.comb.x, z: room.comb.z, hw: 2.4, hd: 0.5, rot: 0 }, { x: room.col.x, z: room.col.z, r: 0.3 });
      // the bell
      room.bellG = grp(g, room.bell.x, room.bell.y, room.bell.z);
      room.bellMat = new THREE.MeshToonMaterial({ color: '#8f8c9a', gradientMap: TK.grad, side: THREE.DoubleSide });     // (its mouth is open: seen from below, the inside shows)
      { const geo = new THREE.LatheGeometry([[0, -0.04], [0.44, -0.06], [0.46, -0.02], [0.36, 0.08], [0.3, 0.25], [0.26, 0.48], [0.16, 0.6], [0, 0.62]].map(([x, y]) => new THREE.Vector2(x * 1.6, y * 1.6)), 20);     // (bottom to top: normals out, so the ink hull stays behind it)
        const m = new THREE.Mesh(geo, room.bellMat); m.position.y = -0.9; room.bellG.add(m); const h = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })); h.scale.setScalar(1.05); h.position.y = -0.93; room.bellG.add(h);
        room.bellG.add(part(GEO.cyl, '#6b4a30', [0, 0.25, 0], [0.04, 0.5, 0.04], { ink: 0 })); }
      room.bellGlow = glow('#ffd27a', 5); room.bellGlow.position.set(room.bell.x, room.bell.y - 0.6, room.bell.z + 0.3); g.add(room.bellGlow);
      // the Queen Bee (the battle's bee, big, with a crown), asleep on her honeycomb
      let boss = null;
      if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) { try { boss = BATTLE.buildFoe('bee', 'yellow', { size: 'big' }); boss.scale.multiplyScalar(2.1); boss.userData.mood = 'asleep'; const h = boss.userData.hush && boss.userData.hush.model; if (h && h.addCrown) h.addCrown(); } catch (e) { console.warn('[greenhouse] boss model', e); boss = null; } }
      if (!boss) { boss = new THREE.Group(); boss.add(part(GEO.sphere, '#f2c94c', [0, 0.6, 0], [0.8, 0.7, 0.9], { ink: 0.03 })); }
      room.hang = grp(g, room.comb.x, Y0 + 2.6, room.comb.z + 0.5); room.hang.add(boss); room.hang.rotation.y = 0.2;
      room.boss = boss;
      room.bossSolid = { x: room.comb.x, z: room.comb.z + 1.2, r: 1.2 }; WORLD.extra.push(room.bossSolid);
      room.page = grp(g, R.x - 3.6, Y0, R.z + 0.8); room.page.visible = false;
      room.page.add(part(GEO.box, '#8a5f3e', [0, 0.65, 0], [0.16, 1.3, 0.16], { ink: 0 }));
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ color: '#fffaf0', side: THREE.DoubleSide })); sheet.position.set(0, 1.05, 0.1); sheet.rotation.z = 0.08; room.page.add(sheet);
      room.pageGlow = glow('#fff3b0', 1.3, 0.5); room.pageGlow.position.set(0, 1.05, 0.15); room.page.add(room.pageGlow);
    }
    applyState();
  }
  // after a load: each hall as the saved progress says
  function applyState() {
    const st = S(), r0 = rooms[0], r1 = rooms[1], r2 = rooms[2], r3 = rooms[3];
    if (st.button) { r0.btnTop.scale.y = 0.35; r0.btnTop.children[0].material = TK.toon('#e2574c'); r0.catchG.visible = false; }
    if (st.pot) placePot(r0.door.x + 2.2);
    if (st.button && st.pot) unsolid(r0.doorSolid);
    if (st.bridge) { r1.bridge.rotation.x = 0; r1.setRope(false); r1.latchG.visible = false; r1.stoneG.visible = false; }
    else if (st.stone) r1.stoneG.visible = false;
    if (st.thorns) { r2.thorns.visible = false; unsolid(r2.thornSolid); }
    if (st.watered) { r2.budMat.color.set('#6fae5a'); r2.canG.rotation.z = -1.6; }
    if (st.bloom) { openBud(1); r2.budMat.color.set('#ff8fb1'); unsolid(r2.budSolid); }
    if (st.boss) { r3.boss.visible = false; unsolid(r3.bossSolid); r3.page.visible = !st.page; }
    if (st.bell) { r3.bellMat.color.set('#e6b54a'); }
  }
  function placePot(x) { const p = rooms[0].pot; p.x = x; p.g.position.x = x; p.solid.x = x; }
  function openBud(k) { rooms[2].petals.forEach(h => { h.rotation.x = k * 1.15; }); }

  // ------------------------------------------------------------ telling Mimo (the verb is the key; mill.js's way)
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${name()} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  // t: { kind, verb (or verbs: [the ones that work]), icon, title, hint, right(verb), at() }
  async function tell(t) {
    const ok = t.verbs || [t.verb];
    let verb = quick[t.kind] || null, ms = 0;
    if (!verb) {
      const r = await UI.command({ name: name(), icon: t.icon, title: t.title, verbs: VERBS, answer: ok[0] });
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
    else if (verb === 'v.hit') { Sound.play('hit'); M.sad = 1.2; say('{mimo} bonks it. Ouch! Nothing moves.'); }
    else if (verb === 'v.throw') { Sound.play('whiff'); say('{mimo} throws a pebble at it. Plink. Nothing.'); }
    else if (verb === 'v.push') { Sound.play('land', 6); say('{mimo} pushes with all its might. It doesn’t budge.'); }
    else if (verb === 'v.swim') say('{mimo} looks for water to swim in. Not here.');
    else if (verb === 'v.sing') { Sound.play('sing'); say('{mimo} sings. The leaves rustle… but nothing changes here.'); }
    else if (verb === 'v.climb') { Sound.play('climb'); say('{mimo} looks for something to climb. Not here.'); }
    else if (verb === 'v.eat') say('{mimo} sniffs it… and decides it’s not food.');
    G.sim.mimoGo(null, null);
  }
  // Mimo on its own (hidden from the sim, its root moved by hand): along an arc, up a climb, back down to you
  const root = () => G.cast.mimo.root;
  async function mimoArc(to, y1, dur = 0.7, h = 1.3) {
    const M = G.sim.mimo, r = root(), p0 = r.position.clone();
    M.hidden = true;
    await tween(dur, k => { r.position.set(lerp(p0.x, to.x, k), lerp(p0.y, y1, k) + Math.sin(k * Math.PI) * h, lerp(p0.z, to.z, k)); });
    Sound.play('pip');
  }
  async function mimoClimb(x, z, y1, dur = 1.3) {
    const M = G.sim.mimo, r = root(), p0 = r.position.clone();
    M.hidden = true; Sound.play('climb');
    await tween(dur, k => { r.position.set(lerp(p0.x, x, Math.min(1, k * 4)) + Math.sin(k * 24) * 0.04, lerp(p0.y, y1, k), lerp(p0.z, z, Math.min(1, k * 4))); r.rotation.set(-0.35, 0, Math.sin(k * 24) * 0.12); });
    r.rotation.set(0, 0, 0);
  }
  async function mimoLand() {
    const M = G.sim.mimo, Y = G.sim.you, r = root(), p0 = r.position.clone(), to = { x: Y.x + 1.1, z: Y.z + 0.6 };
    await tween(0.55, k => { r.position.set(lerp(p0.x, to.x, k), lerp(p0.y, Y0, k) + Math.sin(k * Math.PI) * 0.8, lerp(p0.z, to.z, k)); });
    M.x = to.x; M.z = to.z; M.y = M.ry = Y0; M.hidden = false; M.land = 0; r.rotation.set(0, 0, 0); Sound.play('land', 4);
  }
  async function untilNear(spot, rad, max) { const M = G.sim.mimo; for (let t = 0; t < max && Math.hypot(M.x - spot.x, M.z - spot.z) > rad; t += 0.1) await wait(0.1); }

  // ------------------------------------------------------------ what you can press E on, hall by hall
  function interactables() {
    const list = [], st = S(), room = rooms[cur]; if (!room) return list;
    const R = room.R, say = kind => (quick[kind] ? `«${ex(LEX.form(quick[kind]))}»` : `Tell ${name()}`);
    list.push({ x: R.x - 4.6, z: R.z + HD - 0.9, r: 1.6, label: cur === 0 ? 'Leave the greenhouse' : 'Go back', run: () => (cur === 0 ? leave() : go(cur - 1, 'back')), y: Y0 });
    if (cur === 0) {
      if (!st.onGallery && !st.button) list.push({ x: room.trel.x, z: room.trel.z + 1.4, r: 2.4, y: Y0, label: say('trellis'), run: () => tell({ kind: 'trellis', verb: 'v.climb', icon: 'climb', at: () => room.trel,
        title: `The door’s catch is up on the gallery, and a vine trellis runs up to it. What should ${name()} do?`, hint: 'Flora went up the rose trellis at the gate…', right: climbGallery }) });
      if (st.onGallery && !st.button) list.push({ x: room.trel.x, z: room.trel.z + 1.4, r: 2.6, y: Y0, label: say('button'), run: () => tell({ kind: 'button', verb: 'v.jump', icon: 'jump', at: () => room.btn,
        title: `${name()} is up on the gallery. The big button is stiff with gray crust. What should ${name()} do?`, hint: 'It needs a good stomp, from above…', right: stompButton }) });
      if (!st.pot) list.push({ x: room.pot.x, z: room.pot.z + 1.5, r: 2.2, y: Y0, label: say('pot'), run: () => tell({ kind: 'pot', verb: 'v.push', icon: 'push', at: () => room.pot,
        title: `A huge flowerpot with a palm in it stands right in front of the door. What should ${name()} do?`, hint: 'It’s heavy… but it could slide.', right: pushPot }) });
      if (st.pot && st.button) list.push({ x: room.door.x, z: room.door.z + 1.4, r: 2.2, y: Y0, label: 'Go through the door', run: () => go(1) });
      else if (st.pot && !st.button) list.push({ x: room.door.x, z: room.door.z + 1.4, r: 1.8, y: Y0, label: 'Look', run: async () => STORY.think('The door is locked. Its catch is worked from up on the gallery.', 4) });
    }
    if (cur === 1) {
      if (!st.stone && !st.bridge) list.push({ x: room.pond.x + 1.4, z: room.pond.z + room.pond.rz + 1.2, r: 2.6, y: Y0, label: say('swim'), run: () => tell({ kind: 'swim', verb: 'v.swim', icon: 'swim', at: () => ({ x: room.pond.x, z: room.pond.z + room.pond.rz }),
        title: `There’s a stone on the little islet in the pond. What should ${name()} do?`, hint: 'Lalo, at the lake, showed {mimo} how to cross water…', right: swimForStone }) });
      if (!st.bridge) list.push({ x: room.exit.x + 0.4, z: room.pond.z + room.pond.rz + 1.2, r: 2.4, y: Y0, label: say('latch'), run: () => tell({ kind: 'latch', verbs: ['v.throw'], icon: 'throw', at: () => ({ x: room.latch.x, z: room.latch.z + 3 }),
        title: `The plank bridge is tied up against the far wall. Its rope hangs from a catch, high up. What should ${name()} do?`, hint: 'The catch is high up and across the water… something could fly there.', right: throwAtLatch }) });
      else list.push({ x: room.exit.x, z: room.pond.z + room.pond.rz + 1.0, r: 2.2, y: Y0, label: 'Cross the bridge', run: () => go(2) });
    }
    if (cur === 2) {
      if (!st.thorns) list.push({ x: room.palm.x + 1.6, z: room.palm.z + 1.4, r: 2.2, y: Y0, label: say('thorns'), run: () => tell({ kind: 'thorns', verb: 'v.hit', icon: 'hit', at: () => room.palm,
        title: `Gray thorns grow all round the palm’s foot. What should ${name()} do?`, hint: 'They look brittle. One good whack…', right: breakThorns }) });
      else if (!st.watered) list.push({ x: room.palm.x + 1.6, z: room.palm.z + 1.4, r: 2.2, y: Y0, label: say('palm'), run: () => tell({ kind: 'palm', verb: 'v.climb', icon: 'climb', at: () => room.palm,
        title: `The watering can is up on the tall shelf, next to the palm’s top. The bud by the stairs is dry and gray. What should ${name()} do?`, hint: 'The palm is tall… and easy to climb, now.', right: climbPalm }) });
      if (!st.bloom) list.push({ x: room.bed.x - 0.4, z: room.bed.z + 1.8, r: 2.2, y: Y0, label: say('bud'), run: () => tell({ kind: 'bud', verb: 'v.sing', icon: 'sing', at: () => room.bed,
        title: st.watered ? `The bud is green now, but still shut tight in front of the stairs. What should ${name()} do?` : `A huge gray flower bud, shut tight, in front of the stairs. It looks thirsty. What should ${name()} do?`, hint: 'In the mine, a song woke sleeping things…', right: singBud }) });
      else list.push({ x: room.stairs.x, z: room.stairs.z + 1.6, r: 2.0, y: Y0, label: 'Go up the stairs', run: () => go(3) });
    }
    if (cur === 3) {
      if (!st.boss) list.push({ x: room.comb.x, z: room.comb.z + 2.6, r: 3.0, y: Y0, label: 'Approach', run: wakeBoss });
      else if (!st.page) list.push({ x: room.page.position.x, z: room.page.position.z + 0.6, r: 2.0, y: Y0, label: 'Read', run: readPage });
      else if (!st.atBell) list.push({ x: room.col.x - 0.8, z: room.col.z + 1.4, r: 2.4, y: Y0, label: say('column'), run: () => tell({ kind: 'column', verb: 'v.climb', icon: 'climb', at: () => room.col,
        title: `The gardeners’ bell hangs up under the dome. A vine-wrapped column runs up to its beam. What should ${name()} do?`, hint: 'Up the vines, like at the gate…', right: climbToBell }) });
      else if (!st.bell) list.push({ x: room.col.x - 0.8, z: room.col.z + 1.4, r: 2.6, y: Y0, label: say('bell'), run: () => tell({ kind: 'bell', verbs: ['v.hit', 'v.throw'], icon: 'bell', at: () => room.bell,
        title: `${name()} is up on the beam, right by the bell. What should ${name()} do?`, hint: 'A bell rings when something strikes it…', right: ringBell }) });
    }
    return list;
  }
  // where the compass points inside: the next thing to do in this hall
  function target() {
    const st = S(), room = rooms[cur]; if (!room) return null;
    const at = (o, hint) => (o ? { x: o.x, z: o.z, hint } : null);
    if (cur === 0) return !st.pot ? at(room.pot, '{mimo} points at the huge flowerpot.') : !st.button ? at(room.trel, '{mimo} looks up at the gallery.') : at(room.door, '{mimo} points at the open door.');
    if (cur === 1) return !st.stone && !st.bridge ? at(room.islet, '{mimo} points at the stone on the islet.') : !st.bridge ? at({ x: room.latch.x, z: room.latch.z + 2 }, '{mimo} looks up at the catch on the wall.') : at({ x: room.exit.x, z: room.exit.z + 2 }, '{mimo} points over the bridge.');
    if (cur === 2) return !st.thorns ? at(room.palm, '{mimo} points at the gray thorns.') : !st.watered ? at(room.shelf, '{mimo} looks up at the watering can.') : !st.bloom ? at(room.bed, '{mimo} hums at the bud.') : at(room.stairs, '{mimo} points up the stairs.');
    if (cur === 3) return !st.boss ? at(room.comb, '{mimo} stares at the huge bee on the honeycomb.') : !st.page ? at(room.page.position, '{mimo} points at the page.') : at(room.col, '{mimo} looks up at the bell.');
    return null;
  }

  // ------------------------------------------------------------ the actions
  async function climbGallery() {
    const room = rooms[0], st = S(), T = room.trel, M = G.sim.mimo;
    G.sim.lock = 1;
    G.sim.mimoGo({ x: T.x, z: T.z + 0.8 }, T); await untilNear({ x: T.x, z: T.z + 0.8 }, 0.9, 3);
    await mimoClimb(T.x, T.z + 0.35, room.gal.y + 0.1, 1.2);
    await mimoArc({ x: T.x - 0.4, z: T.z - 0.9 }, room.gal.y, 0.4, 0.4);
    Sound.play('land', 4);
    st.onGallery = true; G.sim.lock = 0;
    M.hidden = true;
    STORY.think('{mimo} is up on the gallery, by the big gray button.', 4);
  }
  async function stompButton() {
    const room = rooms[0], st = S(), B = room.btn, r = root();
    G.sim.lock = 1;
    G.cam.override = { pos: V(room.R.x + 1.5, Y0 + 5.2, room.R.z + 4.5), look: V(B.x, room.gal.y, B.z), dur: 0.6 };
    await mimoArc({ x: B.x, z: B.z }, room.gal.y + 0.25, 0.5, 1.2);
    Sound.play('land', 10); G.w3d.fx.puff(B.x, room.gal.y + 0.2, B.z, 10, 0.3, '#b9b7c6');
    await tween(0.15, k => { room.btnTop.scale.y = 1 - k * 0.65; });
    room.btnTop.children[0].material = TK.toon('#e2574c');
    Sound.play('click'); await wait(0.3);
    Sound.play('crack'); room.catchG.visible = false; G.w3d.fx.puff(room.catchG.position.x, Y0 + 1.3, room.catchG.position.z + 0.2, 8, 0.2, '#9895a6');
    st.button = true; st.onGallery = false;
    await wait(0.4);
    await mimoLand();
    if (st.pot) unsolid(room.doorSolid);
    G.cam.override = null; G.sim.lock = 0; G.save();
    UI.toast(st.pot ? 'Click! The door unlatches.' : 'Click! The door unlatches… but the flowerpot is still in the way.');
  }
  async function pushPot() {
    const room = rooms[0], st = S(), p = room.pot, M = G.sim.mimo;
    G.sim.lock = 1;
    G.sim.mimoGo({ x: p.x - 1.4, z: p.z + 0.3 }, p); await wait(0.8);
    for (let i = 0; i < 2; i++) { Sound.play('land', 8 + i * 3); M.hop = { t: 0 }; await tween(0.28, u => { p.g.position.x = p.x + Math.sin(u * Math.PI) * 0.12; }); await wait(0.12); }
    const x0 = p.x, x1 = room.door.x + 2.2;
    Sound.play('swoosh');
    await tween(0.9, u => { placePot(lerp(x0, x1, u * u * (3 - 2 * u))); p.g.rotation.z = Math.sin(u * 20) * 0.02; });
    Sound.play('land', 9); G.w3d.fx.puff(x1, Y0 + 0.1, p.z, 10, 0.25, '#c9bca8');
    st.pot = true; if (st.button) unsolid(room.doorSolid);
    G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    UI.toast(st.button ? 'The doorway is clear, and the door is unlatched!' : 'The doorway is clear… but the door is still locked.');
  }
  async function swimForStone() {
    const room = rooms[1], st = S(), M = G.sim.mimo, r = root(), I = room.islet;
    G.sim.lock = 1;
    const sx = room.pond.x + 1.4, sz = room.pond.z + room.pond.rz + 0.5;
    G.sim.mimoGo({ x: sx, z: sz + 0.6 }, I); await wait(0.7);
    M.hidden = true; Sound.play('jump');
    const p0 = r.position.clone(), wy = Y0 + 0.02;
    await tween(1.4, k => { r.position.set(lerp(p0.x, I.x - 0.2, k), wy - 0.12 + Math.sin(k * 26) * 0.04, lerp(p0.z, I.z + 0.6, k)); r.rotation.set(0.35, Math.atan2(I.x - p0.x, I.z - p0.z), 0); if (Math.random() < 0.25) G.w3d.fx.puff(r.position.x, wy + 0.05, r.position.z, 2, 0.12, '#cfe9f2'); });
    r.rotation.set(0, 0, 0); r.position.set(I.x - 0.2, Y0 + 0.5, I.z + 0.3); Sound.play('land', 5);
    room.stoneG.visible = false; Sound.play('pip');
    carried = part(GEO.ico1, '#a3a196', [0, 0, 0], [0.16, 0.13, 0.15], { ink: 0.01 }); G.w3d.scene.add(carried);
    await wait(0.4);
    const Y = G.sim.you, p1 = r.position.clone(), to = { x: Y.x + 1.0, z: Y.z + 0.4 };
    await tween(1.2, k => { r.position.set(lerp(p1.x, to.x, k), Y0 - 0.1 + Math.sin(k * Math.PI) * 0.15, lerp(p1.z, to.z, k)); if (Math.random() < 0.2) G.w3d.fx.puff(r.position.x, Y0 + 0.05, r.position.z, 2, 0.12, '#cfe9f2'); });
    M.x = to.x; M.z = to.z; M.y = M.ry = Y0; M.hidden = false; Sound.play('land', 4);
    st.stone = true; G.sim.lock = 0; G.save();
    STORY.think('{mimo} shakes itself dry, holding up a nice round stone.', 4);
  }
  async function throwAtLatch() {
    const room = rooms[1], st = S(), M = G.sim.mimo, L = room.latch;
    if (!st.stone) { G.sim.mimoSay('…?', 1.2); STORY.think('{mimo} has nothing to throw… There’s a stone on the islet, out in the pond.', 4.5); quick.latch = null; return; }
    G.sim.lock = 1;
    G.cam.override = { pos: V(room.R.x + 2.5, Y0 + 3.2, room.R.z + 5.6), look: V(L.x - 0.8, Y0 + 2.6, L.z), dur: 0.7 };
    const stand = { x: L.x, z: room.pond.z + room.pond.rz + 0.8 };
    G.sim.mimoGo(stand, { x: L.x, z: L.z }); await untilNear(stand, 0.9, 3); await wait(0.2);
    const pebble = carried || part(GEO.ico1, '#a3a196', [0, 0, 0], [0.16, 0.13, 0.15], { ink: 0.01 }); if (!carried) G.w3d.scene.add(pebble);
    carried = null;
    const p0 = V(M.x, Y0 + 0.9, M.z), p1 = V(L.x, L.y, L.z + 0.1);
    M.hop = { t: 0 }; Sound.play('whiff');
    await tween(0.6, k => { pebble.position.set(lerp(p0.x, p1.x, k), lerp(p0.y, p1.y, k) + Math.sin(k * Math.PI) * 1.4, lerp(p0.z, p1.z, k)); pebble.rotation.x += 0.4; });
    G.w3d.scene.remove(pebble);
    Sound.play('hit'); Sound.play('crack'); G.w3d.fx.puff(L.x, L.y, L.z + 0.2, 10, 0.25, '#9895a6');
    room.latchG.visible = false; room.setRope(false);
    Sound.play('swoosh');
    await tween(0.7, k => { room.bridge.rotation.x = (-Math.PI / 2 + 0.06) * (1 - k * k); });
    Sound.play('land', 12); G.w3d.fx.puff(room.exit.x, Y0 + 0.2, room.pond.z, 16, 0.4, '#cfe9f2');
    st.bridge = true; G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    UI.toast('Splash! The bridge drops across the pond.');
  }
  async function breakThorns() {
    const room = rooms[2], M = G.sim.mimo, st = S(), p = room.palm;
    G.sim.mimoGo({ x: p.x + 1.4, z: p.z + 0.9 }, p); await wait(0.7);
    M.hop = { t: 0 }; Sound.play('hit'); await wait(0.25);
    Sound.play('crack'); G.w3d.fx.puff(p.x, Y0 + 0.6, p.z, 18, 0.35, '#9895a6');
    await tween(0.3, k => room.thorns.scale.setScalar(1 - k));
    room.thorns.visible = false; unsolid(room.thornSolid); st.thorns = true; G.sim.mimoGo(null, null); G.save();
    STORY.think('The gray thorns shattered. Now the palm’s trunk is free to climb.', 4);
  }
  async function climbPalm() {
    const room = rooms[2], st = S(), P = room.palm, Sh = room.shelf;
    G.sim.lock = 1;
    G.cam.override = { pos: V(room.R.x + 1.5, Y0 + 4.5, room.R.z + 5.5), look: V(P.x + 1, Y0 + 2.6, P.z), dur: 0.7 };
    G.sim.mimoGo({ x: P.x + 0.6, z: P.z + 0.5 }, P); await untilNear({ x: P.x + 0.6, z: P.z + 0.5 }, 0.8, 3);
    await mimoClimb(P.x + 0.3, P.z + 0.3, Y0 + 3.4, 1.4);
    // a hop over to the shelf top, and a nudge: the can tips over the bud
    await mimoArc({ x: Sh.x - 0.4, z: Sh.z }, Sh.y + 0.05, 0.5, 0.6);
    Sound.play('land', 5); await wait(0.3);
    Sound.play('pip');
    await tween(0.5, k => { room.canG.rotation.z = -1.6 * k; });
    // water pours on the bud, and it turns green
    const drops = [];
    for (let i = 0; i < 14; i++) { const d = part(GEO.sphere, '#7fd0f0', [Sh.x + 0.7, Sh.y + 0.3, Sh.z], [0.06, 0.09, 0.06], { ink: 0 }); rooms[2].g.add(d); drops.push({ d, v: V((room.bed.x - Sh.x - 0.7) * (0.9 + Math.random() * 0.3), 0.8 + Math.random(), (room.bed.z - Sh.z) * (0.9 + Math.random() * 0.3)) }); }
    Sound.play('poof');
    await tween(1.0, k => { drops.forEach((o, i) => { const u = Math.max(0, k * 1.4 - i * 0.03); o.d.position.set(Sh.x + 0.7 + o.v.x * u, Sh.y + 0.3 + o.v.y * u - 4.2 * u * u, Sh.z + o.v.z * u); o.d.visible = u < 1; }); room.budMat.color.lerp(new THREE.Color('#6fae5a'), 0.08); });
    drops.forEach(o => rooms[2].g.remove(o.d));
    room.budMat.color.set('#6fae5a'); G.w3d.fx.sparkle(room.bed.x, Y0 + 1.8, room.bed.z, 14, ['#9df0b4', '#7fd0f0']);
    st.watered = true;
    await wait(0.3);
    await mimoLand();
    G.cam.override = null; G.sim.lock = 0; G.save();
    STORY.think('Splash! The bud drank it all up, and it’s green now… but it’s still shut tight.', 4.5);
  }
  async function singBud() {
    const room = rooms[2], st = S(), M = G.sim.mimo;
    G.sim.mimoGo({ x: room.bed.x - 1.2, z: room.bed.z + 1.6 }, room.bed); await wait(0.6);
    G.sim.lock = 1;
    G.sim.mimoSay('♪ ' + LEX.form('v.sing') + ' ♪', 2.2); Sound.play('sing'); M.happy = 2; M.glow = 1;
    for (let t = 0; t < 2.0; t += 0.25) { G.w3d.fx.sparkle(M.x, M.ry + 1.1, M.z, 2, ['#7ff7ea', '#fff3a0']); await wait(0.25); }
    if (!st.watered) { G.sim.lock = 0; G.sim.mimoGo(null, null); quick.bud = null; STORY.think('The bud shivers… but it’s too dry and gray to open. It needs water first.', 4.5); return; }
    G.cam.override = { pos: V(room.bed.x - 3.5, Y0 + 3.2, room.bed.z + 5.2), look: V(room.bed.x, Y0 + 1.4, room.bed.z), dur: 0.6 };
    Sound.play('chime');
    await tween(1.4, k => { openBud(k); room.budMat.color.copy(new THREE.Color('#6fae5a').lerp(new THREE.Color('#ff8fb1'), k)); });
    G.w3d.fx.sparkle(room.bed.x, Y0 + 2.2, room.bed.z, 24, ['#ff8fb1', '#fff3a0', '#ffffff']); Sound.play('learned');
    unsolid(room.budSolid); st.bloom = true;
    await wait(0.6);
    G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    UI.toast('The bud blooms, and opens the way to the stairs!');
  }
  async function wakeBoss() {
    const room = rooms[3], st = S(), R = room.R, b = room.boss;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x - 3.4, Y0 + 3.4, R.z + 5.0), look: V(room.comb.x, Y0 + 2.6, room.comb.z), dur: 0.8 };
    await wait(0.6);
    Sound.play('buzz');
    if (b && b.userData) b.userData.mood = 'alert';
    await tween(0.6, k => { room.hang.rotation.z = Math.sin(k * Math.PI * 6) * 0.1; });
    await tween(0.6, k => { room.hang.position.y = lerp(Y0 + 2.6, Y0 + 3.3, k); room.hang.rotation.y = lerp(0.2, Math.atan2(G.sim.you.x - room.hang.position.x, G.sim.you.z - room.hang.position.z), k); });
    Sound.play('buzz'); G.w3d.fx.puff(room.hang.position.x, Y0 + 3.0, room.hang.position.z, 14, 0.4, '#f2e2a0');
    await STORY.you('The Queen Bee… and she’s HUGE! She’s picky, like the others, {mimo}. Listen to what she wants!');
    G.cam.override = null; G.sim.lock = 0;
    const r = await G.fight({ foes: [{ kind: 'bee', color: 'yellow', size: 'big', giant: 2, hp: 26, queen: true, likes: 'lavender' }, { kind: 'bee', color: 'red', size: 'small' }, { kind: 'bee', color: 'blue', size: 'small' }],
      place: { x: GARDENS.GREAT.x, z: GARDENS.GREAT.z } });
    if (!r || r.outcome !== 'win') {
      await tween(0.4, k => { room.hang.position.y = lerp(Y0 + 3.3, Y0 + 2.6, k); });
      if (b && b.userData) b.userData.mood = 'asleep';
      STORY.think(r && r.outcome === 'lose' ? 'Ouch… The Queen Bee settles back onto her honeycomb. Catch your breath, then try again.' : 'The Queen Bee buzzes back onto her honeycomb and folds her wings.', 5);
      return;
    }
    st.boss = true; if (b) b.visible = false; unsolid(room.bossSolid);
    G.w3d.fx.sparkle(room.hang.position.x, Y0 + 3.0, room.hang.position.z, 26, ['#ffd166', '#fff3a0', '#ff9bb3']); Sound.play('learned');
    await wait(0.5);
    room.page.visible = true; Sound.play('page');
    await STORY.you('She flew off, humming! And something fluttered down from the dome. A page from Noa’s notebook!');
    G.save();
  }
  async function readPage() {
    const room = rooms[3], st = S();
    Sound.play('page');
    await UI.page('page.gardens', 'w.flower');
    st.page = true; room.page.visible = false;
    if (!G.state.pages.includes('page.gardens')) G.state.pages.push('page.gardens');
    await STORY.you('Noa went on to the Frost Peaks, to an old clock workshop… We’re right behind you, Noa. First: the {w.bell}!');
    G.save();
  }
  async function climbToBell() {
    const room = rooms[3], st = S(), C = room.col;
    G.sim.lock = 1;
    G.cam.override = { pos: V(room.R.x - 1.0, Y0 + 4.2, room.R.z + 6.0), look: V(C.x - 1, Y0 + 4.0, C.z), dur: 0.7 };
    G.sim.mimoGo({ x: C.x - 0.6, z: C.z + 0.5 }, C); await untilNear({ x: C.x - 0.6, z: C.z + 0.5 }, 0.8, 3);
    await mimoClimb(C.x - 0.3, C.z + 0.25, room.bell.y + 0.6, 1.8);
    await mimoArc({ x: room.bell.x + 0.9, z: room.bell.z }, room.bell.y + 0.75, 0.5, 0.4);
    Sound.play('land', 4);
    st.atBell = true; G.cam.override = null; G.sim.lock = 0;
    STORY.think('{mimo} is up on the beam, right next to the bell!', 4);
  }
  async function ringBell(verb) {
    const room = rooms[3], st = S(), Bl = room.bell, r = root();
    G.sim.lock = 1;
    G.cam.override = { pos: V(Bl.x - 3.5, Bl.y - 0.6, Bl.z + 6.5), look: V(Bl.x, Bl.y - 0.6, Bl.z), dur: 0.7 };
    await wait(0.4);
    if (verb === 'v.throw') { Sound.play('whiff'); await wait(0.3); }
    else { await mimoArc({ x: Bl.x + 0.5, z: Bl.z + 0.3 }, Bl.y - 0.5, 0.35, 0.4); }
    for (let k = 0; k < 3; k++) {
      Sound.play('bell'); Sound.play('chime');
      room.bellMat.color.lerp(new THREE.Color('#e6b54a'), 0.5);
      G.w3d.fx.sparkle(Bl.x, Bl.y - 0.6, Bl.z + 0.3, 18, ['#ffd166', '#fff3a0', '#ffffff']);
      await tween(0.9, u => { room.bellG.rotation.z = Math.sin(u * Math.PI * 2) * 0.35 * (1 - u * 0.4); room.bellGlow.material.opacity = 0.8 * (1 - u); });
    }
    room.bellMat.color.set('#e6b54a');
    st.bell = true; st.atBell = false;
    await mimoLand();
    G.cam.override = null; G.sim.lock = 0;
    await finale();
  }
  // outside again: the valley's color comes back, the gardeners' bell rings in its cupola, and the fourth bell of eight has rung
  async function finale() {
    await UI.fade(1, 700);
    hideAll(); inside = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z - 2.5, Math.PI);
    const f = G.state.flags;
    f.gardensFree = true; f.bells = Math.max(4, f.bells || 0);
    const B = GARDENS.built;
    if (B) { B.setBell(true); B.ringBell(4); }
    const hi = WORLD.L.hush.findIndex(h => h.gardens); if (hi >= 0) G.w3d.liftHush(hi);
    if (B) for (const p of B.people) { p.look = { x: GARDENS.GREAT.x, z: GARDENS.GREAT.z }; if (p.fan || p.judge) p.set('cheer', false); }
    G.sim.lock = 1;
    G.cam.override = { pos: V(GARDENS.GREEN.x + 6, GARDENS.VALLEY.y + 8, GARDENS.GREEN.z - 14), look: V(GARDENS.GREAT.x, GARDENS.VALLEY.y + 5, GARDENS.GREAT.z) };
    G.cam.snap(Math.PI, 0.3, 9);
    await UI.fade(0, 900);
    for (let k = 0; k < 4; k++) { Sound.play('bell'); await wait(1.0); }
    await UI.chapter('The fourth bell', '4 of 8 · The Bloom Gardens bloom again');
    G.cam.override = null; G.sim.lock = 0;
    if (B) for (const p of B.people) { p.look = null; if (p.fan || p.judge) p.set('idle', false); }
    await STORY.you('Listen… the whole valley is ringing! Four bells down, four to go. Let’s tell Melisa.');
    G.save();
  }

  // ------------------------------------------------------------ moving between halls, in and out
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    // (a wander spot or station left in the room behind would make Mimo «poof» straight back there: sim.js jumps it to its goal)
    Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + 1.1; M.z = z + 0.8; M.hidden = false; M.wander = null; M.station = null; G.sim.snap();
  }
  function show(i) {
    rooms.forEach((r, k) => { r.g.visible = k === i; }); cur = i; quick = {};
    const st = S(); if (st.onGallery && !st.button) st.onGallery = false;      // (Mimo comes back down with you)
    if (st.atBell && !st.bell) st.atBell = false;
  }
  function hideAll() { rooms.forEach(r => { r.g.visible = false; }); cur = -1; quick = {}; }
  async function enter() {
    build();
    await UI.fade(1, 450);
    inside = true; G.w3d.setInterior({ fog: '#a8cf9a', near: 16, far: 46 });
    show(0); const R = ROOMS[0]; teleport(R.x - 4.5, R.z + 3.6, Math.PI); G.cam.snap(Math.PI, 0.6, 10.5);
    await UI.fade(0, 450);
    if (!S().seen0) { S().seen0 = true; UI.chapter('The great greenhouse', 'The Bloom Gardens · the bell is at the very top'); STORY.think('Warm and green in here… and so quiet. Up on the gallery, a big gray button. In front of the door, a huge flowerpot.', 6); }
    G.save();
  }
  async function leave() {
    await UI.fade(1, 450);
    hideAll(); inside = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw); G.cam.snap(Math.PI, 0.28, 8.5);
    await UI.fade(0, 450);
  }
  async function go(i, from = 'ahead') {
    await UI.fade(1, 350);
    show(i);
    const R = ROOMS[i], room = rooms[i];
    if (from === 'back') {           // back from the hall after this one: arrive by its way on
      const at = i === 0 ? { x: room.door.x - 1.4, z: room.door.z + 2.4 } : i === 1 ? { x: room.exit.x + 1.6, z: room.pond.z + room.pond.rz + 1.2 } : { x: room.stairs.x - 1.6, z: room.stairs.z + 2.6 };
      teleport(at.x, at.z, 0);
    } else teleport(R.x - 4.5, R.z + 3.6, Math.PI);
    G.cam.snap(Math.PI, 0.6, 10.5);
    await UI.fade(0, 350);
    const st = S();
    if (!st['seen' + i]) {
      st['seen' + i] = true; UI.chapter(R.name, R.sub);
      if (i === 1 && !st.ambush) {        // the Lily Pond: picky bees come buzzing down from the hanging baskets
        await wait(1.2);
        Sound.play('buzz');
        await STORY.you('Bees! Picky ones! Listen to what each one wants, {mimo}…');
        const r = await G.fight({ foes: [{ kind: 'bee', color: 'yellow', size: 'small' }, { kind: 'bee', color: 'white', size: 'small' }, { kind: 'hushling', color: 'green', size: 'small' }], place: { x: GARDENS.GREAT.x, z: GARDENS.GREAT.z } });
        if (r && r.outcome === 'win') st.ambush = true;
        else { st['seen' + i] = false; await go(i - 1, 'back'); return; }
        STORY.think('A plank bridge is tied up against the far wall… and there’s a stone on that little islet.', 5);
      }
      if (i === 2) STORY.think('Gray thorns round the palm, a watering can up on the shelf, and a huge gray bud in front of the stairs.', 6);
      if (i === 3) STORY.think('The Dome. Something enormous is asleep on that honeycomb…', 4);
    }
    G.save();
  }

  // ------------------------------------------------------------ per frame (while inside)
  function update(dt, t) {
    if (!inside || cur < 0) return;
    const room = rooms[cur], st = S();
    if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    // Mimo up on the gallery / the beam: it waits there (its root parked), till you tell it what to do or you leave
    const r = root(), M = G.sim.mimo;
    if (cur === 0 && st.onGallery && !st.button && !STORY.busy) { M.hidden = true; r.position.set(room.trel.x - 0.4, room.gal.y + Math.abs(Math.sin(t * 3)) * 0.05, room.trel.z - 0.9); r.rotation.set(0, 0, 0); }
    if (cur === 3 && st.atBell && !st.bell && !STORY.busy) { M.hidden = true; r.position.set(room.bell.x + 0.9, room.bell.y + 0.75 + Math.abs(Math.sin(t * 3)) * 0.04, room.bell.z); r.rotation.set(0, -Math.PI / 2, 0); }
    if (carried && cur === 1 && st.stone && !st.bridge) carried.position.set(M.x, M.ry + 1.05 + Math.sin(t * 6) * 0.03, M.z);
    if (cur === 1 && room.water) room.water.material.emissive.setRGB(0.05, 0.16 + 0.03 * Math.sin(t), 0.2);
    if (cur === 3) {
      if (room.boss && room.boss.visible && room.boss.userData.animate) room.boss.userData.animate(dt, t, 0);
      if (room.page.visible) room.pageGlow.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
      if (!st.bell) room.bellGlow.material.opacity = 0.15 + 0.1 * Math.sin(t * 2);
    }
  }

  // the page Noa left in the dome (UI.page reads LINES via lineFor; [text] per language)
  const PAGE = {
    es: ['Desde lo alto de la cúpula veo montañas nevadas al noreste. Melisa dice que allá arriba hay un viejo taller de relojes. Me voy para allá. ¡Voy a extrañar la miel de lavanda!'],
    pt: ['Do alto da cúpula eu vejo montanhas nevadas no nordeste. A Melisa diz que lá em cima tem uma velha oficina de relógios. Eu vou pra lá. Vou sentir falta do mel de lavanda!'],
    de: ['Von oben aus der Kuppel sehe ich verschneite Berge im Nordosten. Melisa sagt, da oben gibt es eine alte Uhrenwerkstatt. Ich gehe hin. Den Lavendelhonig werde ich vermissen!'],
    zh: ['[从|cóng] [圆顶|yuán dǐng] [上|shàng] ， [我|wǒ] [看到|kàn dào] [东北|dōng běi] [边|biān] [有|yǒu] [雪山|xuě shān] 。 [梅丽莎|Méi lì shā] [说|shuō] [山|shān] [上|shàng] [有|yǒu] [一|yī] [家|jiā] [老|lǎo] [钟表|zhōng biǎo] [工坊|gōng fáng] 。 [我|wǒ] [要|yào] [去|qù] [那里|nà lǐ] 。 [我|wǒ] [会|huì] [想念|xiǎng niàn] [薰衣草|xūn yī cǎo] [蜂蜜|fēng mì] [的|de] ！'],
    ja: ['ドーム の [上|うえ] から 、 [北東|ほくとう] に [雪山|ゆきやま] が [見|み]える 。 メリッサ に よる と 、 そこ に [古|ふる]い [時計|とけい] [工房|こうぼう] が ある らしい 。 わたし は [行|い]って みる 。 ラベンダー の はちみつ が [恋|こい]しく なる な ！'],
    en: ['From the top of the dome I can see snowy mountains to the north-east. Melisa says there’s an old clock workshop up there. I’m going. I’ll miss the lavender honey!'],
  };
  if (typeof LINES !== 'undefined' && !LINES['page.gardens']) LINES['page.gardens'] = PAGE;

  return {
    init(game) { G = game; },
    enter, leave, update, interactables, target, ROOMS, OUTSIDE,
    get inside() { return inside; }, get room() { return cur; },
    _: { rooms, go, S, build, applyState, finale, wakeBoss, ringBell, climbToBell, climbGallery, stompButton, pushPot, swimForStone, throwAtLatch, breakThorns, climbPalm, singBud, readPage, PAGE },
  };
})();
