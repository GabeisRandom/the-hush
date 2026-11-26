'use strict';
// Under the old theater's stage, long ago (DESIGN.md 18.6 "T1a": the dungeon) and two compact interiors of then: a room module
// in main.js's sense (ROOMS, before PAST: while you're in here it answers E, and TIME keeps the world: the save stays in the
// Past, your spot outside is kept).
//   The dungeon: four rooms at y 300, z −420, x −430 / −404 / −378 / −352 (14 × 12; over the far north-west hills, where nobody
//   walks). Every puzzle is a memory of that night: a sepia ghost of someone who was there shows it, the imperfect sets the
//   scene (the lamp «estaba encendida», the robes «eran rojas», the trapdoor «estaba abierta»), and the preterite replays the
//   deed («Mimo empujó la luna», «Mimo sopló el polvo», «Elio bajó por la escalera»). Then the prompter's box: Aurora's memory
//   corrects the whisper's lie, you correct one too, and the Prompter (alba_past_boss.js) comes out. After it, Elio's echo.
//     0 the prop room · 1 the costume racks (Félix's lost page is in the trunk) · 2 the trapdoor lift · 3 the prompter's box
//   The interiors: one slot at (−326, 300, −420), 26 from the dungeon and from the marsh chapel: Elena's bakery (x −330.4: young
//   Marta, Elena's apprentice, and Canela the cat) and the schoolroom (x −321.6: young Hugo and Tomi, and Elio's empty desk),
//   7.6 × 6.4 each. Entered from the Past through TIME.spot doors (alba_past.js).
//   APSTAGE.enter(id) · leave() · inside · OUTSIDE · interactables() · update(dt, t) · target() · song() · look() (alba_past.js
//   calls it every frame, after the Past's own light, while you're in here) · ROOMS
const APSTAGE = (() => {
  let G = null, built = false, inside = false, cur = -1, busy = false;
  const Y0 = 300;
  const ROOMS = [
    { id: 'props', kind: 'under', name: 'The prop room', sub: 'Under the stage · the props of that night', x: -430, z: -420, hw: 7, hd: 6, wh: 4.2 },
    { id: 'costumes', kind: 'under', name: 'The costume racks', sub: 'Under the stage · the choir’s robes', x: -404, z: -420, hw: 7, hd: 6, wh: 4.2 },
    { id: 'lift', kind: 'under', name: 'The trapdoor lift', sub: 'Under the stage · the way up to the boards', x: -378, z: -420, hw: 7, hd: 6, wh: 4.2 },
    { id: 'box', kind: 'under', name: 'The prompter’s box', sub: 'Under the stage · where the whisper lives', x: -352, z: -420, hw: 7, hd: 6, wh: 4.2 },
    { id: 'bakery', kind: 'home', name: 'Elena’s bakery', sub: 'The Old Quarter, long ago', x: -317.4, z: -360, hw: 3.8, hd: 3.2, wh: 3.4 },
    { id: 'school', kind: 'home', name: 'The schoolroom', sub: 'The Old Quarter, long ago', x: -308.6, z: -360, hw: 3.8, hd: 3.2, wh: 3.4 },
  ];
  const IDX = Object.fromEntries(ROOMS.map((R, i) => [R.id, i]));
  // the doors in the Past (where you come out, facing away from the door)
  const DOORS = { under: { x: -13.5, z: -233.2, yaw: 0 }, bakery: { x: -16.4, z: -213.8, yaw: Math.PI / 2 }, school: { x: -4.8, z: -205.3, yaw: -Math.PI / 2 } };
  let outside = DOORS.under;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const AP = () => TIME.state('alba', 'past');
  const lang = () => (G && G.state.lang) || 'es';
  const isC = l => l === 'zh' || l === 'ja';
  const plain = (s, l = lang()) => (isC(l) && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: l }) : String(s || ''));
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* */ } };
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const mimoName = () => (G && G.state.mimoName) || 'Mimo';
  const solved = () => { try { if (typeof BFX !== 'undefined' && BFX.solved) BFX.solved(); else snd('chest'); } catch (e) { /* */ } };
  const PA = () => PAST.API;
  const FAST = { on: false };          // (tests: a hidden tab's timers are slow: no fades, no chapter cards)
  const fade = (v, ms) => (FAST.on ? Promise.resolve() : UI.fade(v, ms));
  const rooms = [];

  // ---------------------------------------------------------------- materials: old boards, rough plaster under the stage; the homes
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const boards = (base, alt) => (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? alt : base; c.fillRect(0, i * 32, w, 30); c.fillStyle = 'rgba(40,24,16,0.25)'; c.fillRect(0, i * 32 + 30, w, 2); for (let k = 0; k < 3; k++) c.fillRect(((i * 97 + k * 61) % 256), i * 32 + 6 + k * 8, 18, 1.4); } };
    const plaster = (base, spot) => (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h); let s = 7; const R = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 60; i++) { c.fillStyle = spot; c.beginPath(); c.ellipse(R() * w, R() * h, 4 + R() * 14, 2 + R() * 7, R() * 3, 0, TAU); c.fill(); } c.fillStyle = 'rgba(30,20,16,0.28)'; c.fillRect(0, h - 26, w, 26); };
    MAT = {
      floor: new THREE.MeshToonMaterial({ map: tex(256, 256, boards('#6e5038', '#634732'), 3, 2.4), gradientMap: TK.grad }),
      wall: new THREE.MeshToonMaterial({ map: tex(256, 256, plaster('#7d6b5c', 'rgba(60,46,38,0.22)'), 3, 1.2), gradientMap: TK.grad }),
      homeFloor: new THREE.MeshToonMaterial({ map: tex(256, 256, (c, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#c46a4a' : '#d47c58'; c.fillRect(x * 32, y * 32, 31, 31); } }, 2, 1.6), gradientMap: TK.grad }),
      schoolFloor: new THREE.MeshToonMaterial({ map: tex(256, 256, boards('#9a7048', '#8d6540'), 2, 1.6), gradientMap: TK.grad }),
      bakeryWall: new THREE.MeshToonMaterial({ map: tex(256, 256, plaster('#f2dfb8', 'rgba(200,160,110,0.18)'), 2, 1), gradientMap: TK.grad }),
      schoolWall: new THREE.MeshToonMaterial({ map: tex(256, 256, plaster('#b9c9b4', 'rgba(110,130,100,0.18)'), 2, 1), gradientMap: TK.grad }),
      hole: new THREE.MeshBasicMaterial({ color: '#100c0e' }),
    };
    return MAT;
  }
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  // a room's shell: the floor, four walls (planes facing in: the camera looks in like a dollhouse), beams across the top, the
  // walls' solids and the floor's platform
  function shell(R, g, o) {
    const M = mats(), { hw, hd, wh } = R;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.4, hd * 2), o.floor || M.floor); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
    [[0, -hd, 0, hw * 2], [0, hd, Math.PI, hw * 2], [-hw, 0, Math.PI / 2, hd * 2], [hw, 0, -Math.PI / 2, hd * 2]].forEach(([dx, dz, ry, w]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, wh), o.wall || M.wall); m.position.set(R.x + dx, Y0 + wh / 2, R.z + dz); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    });
    const k = PA().Kit();
    if (R.kind === 'under') {
      for (const i of [-1.5, 0, 1.5]) k.box(R.x + i * 2.8, Y0 + wh + 0.1, R.z - 0.6, 0.22, 0.3, hd * 2 - 1.4, '#4a3426', { ink: 0.012 });      // (the stage's joists overhead; none across the front, where the camera looks in)
      k.box(R.x, Y0 + wh + 0.1, R.z - hd + 0.2, hw * 2, 0.36, 0.3, '#4a3426', { ink: 0.014 });
      for (const x of [-hw + 0.25, hw - 0.25]) for (const z of [-hd + 0.25, 0]) k.box(R.x + x, Y0 + wh / 2, R.z + z, 0.28, wh, 0.28, '#5a3e2c', { ink: 0.012 });   // (posts, at the back and the sides)
    } else {
      for (let i = -1; i <= 1; i++) k.box(R.x + i * 2.4, Y0 + wh + 0.06, R.z, 0.2, 0.22, hd * 2, '#7a5236', { ink: 0.012 });
      k.box(R.x, Y0 + 0.08, R.z - hd + 0.04, hw * 2, 0.16, 0.06, '#7a5236', { ink: 0.006 });        // (the skirting board)
    }
    k.build(g);
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - hd - 0.2, hw: hw + 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: R.x, z: R.z + hd + 0.2, hw: hw + 0.6, hd: 0.3, rot: 0 },
      { obox: 1, x: R.x - hw - 0.2, z: R.z, hw: 0.3, hd: hd + 0.6, rot: 0 }, { obox: 1, x: R.x + hw + 0.2, z: R.z, hw: 0.3, hd: hd + 0.6, rot: 0 }]);
    WORLD.addPlatforms([{ box: [R.x - hw, R.x + hw, R.z - hd, R.z + hd], top: Y0 }]);
  }
  // a dark doorway in the back wall (the way on), and the way back (a stair up, or the house's door)
  function doorway(g, x, z, w = 1.6, h = 2.3) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mats().hole); m.position.set(x, Y0 + h / 2, z + 0.03); g.add(m); return m; }
  // a person of then (the person kit: one mesh, one ink hull), or a memory of one (sepia, see-through, no ink)
  function person(parent, look, at, o = {}) {
    const { k, top } = PA().personKit(look), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    if (o.extra) o.extra(k);
    if (o.ghost) k.build(body, { mat: new THREE.MeshBasicMaterial({ vertexColors: true, color: '#ffe8c4', transparent: true, opacity: 0.55, depthWrite: false }), hull: false, shadow: false });
    else k.build(body);
    const h = look.h || (look.kid ? 0.78 : 1); g.scale.setScalar(h);
    g.position.set(at.x, Y0 + (o.dy || 0), at.z); g.rotation.y = at.yaw || 0; parent.add(g);
    const api = { id: o.id || '', name: '', x: at.x, y: Y0, z: at.z, top: top * h + 0.1, talking: false, yaw: at.yaw || 0 };
    const P = { g, body, api, look, ghost: !!o.ghost, ph: ((o.id || 'x').length * 1.37) % 6.28 };
    if (o.ghost) { const gl = PA().glow('#ffd9a0', 1.8, 0.25); gl.position.y = 0.9; g.add(gl); P.gl = gl; }
    if (!o.ghost && o.solid !== false) { P.solid = { x: at.x, z: at.z, r: look.kid ? 0.32 : 0.4 }; WORLD.addSolids([P.solid]); }
    return P;
  }
  const LOOKS_AT = {};      // room index → [{ key, x, z, r }]
  const lookAt = (i, key, x, z, r = 1.3) => (LOOKS_AT[i] || (LOOKS_AT[i] = [])).push({ key, x, z, r });

  // ---------------------------------------------------------------- the four rooms under the stage
  const LOOK_GHOSTS = {
    lorenzo: { skin: '#e6b48c', hair: '#4a3020', dress: '#6f8a4a', vest: '#a8784e', hat: 'flat', apron: '#c9a77a', h: 1.04 },
    clara: { skin: '#efc29a', hair: '#a8442e', hairdo: 'bun', dress: '#c9443a', shawl: '#f4efe0' },
    pilar: { skin: '#e6b48c', hair: '#8a6a4a', hairdo: 'tails', dress: '#3e8f8a', apron: '#fdf8ee', prop: 'bell' },
    aurora: { skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'bun', dress: '#5c4a7a', shawl: '#e8b83e', prop: 'baton', h: 1.05 },
    elio: { kid: true, skin: '#d9a87e', hair: '#2b211d', hairdo: 'short', dress: '#5c6fa8', vest: '#d8c39a', hat: 'cap', hatColor: '#d23a32', h: 0.78 },
  };
  function buildProps(room) {
    const R = room.R, g = room.g, k = PA().Kit(), KG = PA().KG, x = R.x, z = R.z;
    // the workbench, Lorenzo's hammer; the wooden horse; the paper tree; crates; a rolled backdrop; the pulley's rope
    k.box(x - 4.6, Y0 + 0.5, z - 4.7, 2.4, 0.12, 0.9, '#8a5f3e', { ink: 0.014 }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(x - 4.6 + sx * 1.05, Y0 + 0.24, z - 4.7 + sz * 0.35, 0.1, 0.48, 0.1, '#6b4a30', { ink: 0.006 });
    k.box(x - 4.2, Y0 + 0.6, z - 4.6, 0.36, 0.06, 0.08, '#5a3a24', { ink: 0.004 }).box(x - 4.04, Y0 + 0.62, z - 4.6, 0.08, 0.1, 0.14, '#6b6f78', { ink: 0.004 });
    k.box(x + 0.8, Y0 + 0.75, z - 3.9, 1.4, 0.5, 0.42, '#b8864f', { ink: 0.014 }).add(KG.sphere, x + 1.55, Y0 + 1.15, z - 3.9, 0.22, 0.26, 0.18, '#b8864f', { ink: 0.01 });
    for (const sx of [-0.5, 0.5]) for (const sz of [-0.14, 0.14]) k.box(x + 0.8 + sx, Y0 + 0.28, z - 3.9 + sz, 0.08, 0.56, 0.08, '#8a5f3e', { ink: 0.006 });
    k.add(KG.cyl, x + 0.8, Y0 + 0.04, z - 3.9, 0.8, 0.05, 0.3, '#5a3a24', { ink: 0.006 });
    k.add(KG.cone, x - 5.6, Y0 + 1.4, z + 0.8, 0.9, 1.9, 0.12, '#6f9a4a', { ink: 0.014 }).box(x - 5.6, Y0 + 0.25, z + 0.8, 0.12, 0.5, 0.12, '#8a5f3e', { ink: 0.006 });
    for (const [cx, cy, cz] of [[5.3, 0.35, 2.4], [5.3, 1.05, 2.4], [4.4, 0.35, 2.6], [5.5, 0.35, 3.4]]) k.box(x + cx, Y0 + cy, z + cz, 0.8, 0.7, 0.8, '#9a7048', { ink: 0.012 });
    k.add(KG.cyl, x - 6.3, Y0 + 0.4, z - 1.0, 0.32, 3.4, 0.32, '#c9b07a', { rx: Math.PI / 2, ink: 0.012 });
    k.rod([x + 2.5, Y0 + 4.2, z - 2.0], [x + 2.5, Y0 + 1.6, z - 2.0], 0.025, '#b8a27a', 0.004).add(KG.torus, x + 2.5, Y0 + 4.0, z - 2.0, 0.22, 0.22, 0.22, '#6b6f78', { ink: 0.006 });
    k.build(g);
    lookAt(0, 'workbench', x - 4.6, z - 3.7); lookAt(0, 'hammer', x - 4.1, z - 3.8, 0.9); lookAt(0, 'horse', x + 0.8, z - 2.9); lookAt(0, 'ptree', x - 5.0, z + 1.6);
    lookAt(0, 'crate', x + 4.4, z + 1.6); lookAt(0, 'backdrop', x - 5.6, z - 1.0); lookAt(0, 'pulley', x + 2.5, z - 1.2, 1.1);
    WORLD.addSolids([{ obox: 1, x: x - 4.6, z: z - 4.7, hw: 1.25, hd: 0.5, rot: 0 }, { obox: 1, x: x + 0.8, z: z - 3.9, hw: 0.9, hd: 0.3, rot: 0 }, { x: x - 5.6, z: z + 0.8, r: 0.6 }, { obox: 1, x: x + 5.0, z: z + 2.9, hw: 1.0, hd: 0.9, rot: 0 }, { obox: 1, x: x - 6.3, z: z - 1.0, hw: 0.4, hd: 1.8, rot: 0 }]);
    // the hanging oil lamp (the scene: «estaba encendida»)
    const lamp = grp(g, x - 1.0, Y0, z - 1.0), lk = PA().Kit();
    lk.rod([0, 4.2, 0], [0, 2.9, 0], 0.012, '#3a3036', 0).box(0, 2.82, 0, 0.3, 0.06, 0.3, '#3a3036', { ink: 0.006 }).add(KG.sphere, 0, 2.6, 0, 0.18, 0.24, 0.18, '#f6e7a8', { ink: 0.008 }).box(0, 2.36, 0, 0.26, 0.06, 0.26, '#3a3036', { ink: 0.006 });
    lk.build(lamp);
    room.lampGlow = PA().glow('#ffcf6a', 3.2, 0); room.lampGlow.position.set(0, 2.6, 0); lamp.add(room.lampGlow);
    room.lamp = { x: x - 1.0, z: z - 1.0 }; lookAt(0, 'lamp', x - 1.0, z - 0.2, 1.4);
    // the way on, and the painted moon in front of it (the deed: «Mimo empujó la luna»)
    doorway(g, x + 4.6, z - R.hd);
    const moon = grp(g, x + 4.6, Y0, z - 4.8), mk = PA().Kit();
    mk.add(KG.cyl, 0, 1.6, 0, 1.3, 0.12, 1.3, '#f2d98a', { rx: Math.PI / 2, ink: 0.02 }).add(KG.cyl, 0.35, 1.75, 0.05, 1.05, 0.1, 1.05, '#7d6b5c', { rx: Math.PI / 2, ink: 0 });
    for (const sx of [-0.5, 0.5]) mk.box(sx, 0.4, -0.15, 0.1, 0.8, 0.5, '#6b4a30', { ink: 0.008 });
    mk.build(moon); room.moon = moon; room.moonSolid = { obox: 1, x: x + 4.6, z: z - 4.9, hw: 1.4, hd: 0.35, rot: 0 }; WORLD.addSolids([room.moonSolid]);
    lookAt(0, 'moon', x + 3.0, z - 3.6, 1.3);
    room.ghost = person(g, LOOK_GHOSTS.lorenzo, { x: x - 3.4, z: z - 2.8, yaw: 0.4 }, { ghost: true, id: 'lorenzo' });
    room.people = { you: { x: x - 4.5, z: z + 3.8, yaw: Math.PI } };
  }
  function buildCostumes(room) {
    const R = room.R, g = room.g, k = PA().Kit(), KG = PA().KG, x = R.x, z = R.z;
    // the robes' rack (their own mesh: gray now, red once you've said how they were)
    k.rod([x - 5.0, Y0 + 2.0, z - 3.6], [x - 0.8, Y0 + 2.0, z - 3.6], 0.035, '#3a3036', 0.006);
    for (const sx of [-5.0, -0.8]) k.rod([x + sx, Y0, z - 3.6], [x + sx, Y0 + 2.05, z - 3.6], 0.04, '#3a3036', 0.006);
    // the trunk, the mirror, the hats, the buttons, a rack of costumes, the dress form
    k.box(x + 1.8, Y0 + 0.36, z - 3.9, 1.5, 0.72, 0.8, '#7a5236', { ink: 0.016 }).box(x + 1.8, Y0 + 0.74, z - 4.25, 1.52, 0.5, 0.08, '#6b4a30', { rx: -0.9, ink: 0.01 });
    for (const sx of [-0.55, 0.55]) k.box(x + 1.8 + sx, Y0 + 0.36, z - 3.48, 0.1, 0.74, 0.04, '#c9a24a', { ink: 0 });
    k.box(x + R.hw - 0.12, Y0 + 1.6, z - 1.0, 0.08, 1.6, 1.1, '#e8e4dc', { ink: 0.01 }); for (let i = 0; i < 6; i++) k.add(KG.ball6, x + R.hw - 0.2, Y0 + 0.9 + i * 0.28, z - 1.62, 0.06, 0.06, 0.06, '#ffe9a8', { ink: 0 });
    [['#e8b83e', 0.3], ['#3f7fc9', 0.24], ['#2b2235', 0.34], ['#c9443a', 0.22]].forEach(([c, r], i) => k.add(KG.cyl, x + 5.6, Y0 + 0.2 + i * 0.32, z + 1.8, r, 0.26, r, c, { ink: 0.008 }));
    k.add(KG.cyl, x + 1.3, Y0 + 0.86, z - 3.6, 0.14, 0.2, 0.14, '#cfe6ee', { ink: 0.006 });
    k.rod([x + 4.0, Y0 + 1.8, z + 3.6], [x + 6.2, Y0 + 1.8, z + 3.6], 0.03, '#3a3036', 0.004);
    ['#5fae4f', '#7a4fa0', '#e2453a', '#ffd84a'].forEach((c, i) => k.add(KG.robe, x + 4.3 + i * 0.6, Y0 + 0.6, z + 3.6, 0.42, 1.15, 0.3, c, { ink: 0.01 }));
    k.add(KG.robe, x - 5.6, Y0 + 0.3, z + 2.0, 0.5, 1.2, 0.42, '#c43c3c', { ink: 0.014 }).add(KG.sphere, x - 5.6, Y0 + 1.6, z + 2.0, 0.16, 0.2, 0.16, '#c9a77a', { ink: 0.008 }).rod([x - 5.6, Y0, z + 2.0], [x - 5.6, Y0 + 0.4, z + 2.0], 0.03, '#3a3036', 0.004);
    k.build(g);
    const rk = PA().Kit(), RC = [];
    for (let i = 0; i < 6; i++) { rk.add(KG.robe, x - 4.6 + i * 0.72, Y0 + 0.62, z - 3.6, 0.42, 1.3, 0.3, '#ffffff', { ink: 0.01 }); rk.add(KG.torus, x - 4.6 + i * 0.72, Y0 + 1.88, z - 3.58, 0.17, 0.17, 0.4, '#f4efe0', { rx: Math.PI / 2, ink: 0.006 }); }
    room.robeMat = TK.toon('#8f8a86', { rim: 0.2 }).clone();
    rk.build(grp(g, 0, 0, 0), { mat: room.robeMat });
    lookAt(1, 'robes', x - 2.9, z - 2.5, 1.6); lookAt(1, 'trunk', x + 1.8, z - 2.9, 1.3); lookAt(1, 'mirror', x + R.hw - 1.1, z - 1.0); lookAt(1, 'hats', x + 5.0, z + 1.4);
    lookAt(1, 'buttons', x + 0.9, z - 2.9, 0.9); lookAt(1, 'rack', x + 5.1, z + 2.8); lookAt(1, 'dressform', x - 5.0, z + 1.6);
    WORLD.addSolids([{ obox: 1, x: x - 2.9, z: z - 3.6, hw: 2.3, hd: 0.4, rot: 0 }, { obox: 1, x: x + 1.8, z: z - 3.9, hw: 0.85, hd: 0.5, rot: 0 }, { x: x + 5.6, z: z + 1.8, r: 0.4 }, { obox: 1, x: x + 5.1, z: z + 3.6, hw: 1.3, hd: 0.3, rot: 0 }, { x: x - 5.6, z: z + 2.0, r: 0.45 }]);
    // the page in the trunk (Félix's), and the way on behind a cloud of gray dust (the deed: «Mimo sopló el polvo»)
    room.page = PA().glow('#fff1c0', 0.9, 0); room.page.position.set(x + 1.8, Y0 + 0.95, z - 3.8); g.add(room.page);
    doorway(g, x + 4.6, z - R.hd);
    room.dust = []; for (let i = 0; i < 14; i++) { const s = PA().glow('#9a96a6', 1.2 + (i % 3) * 0.4, 0.8); s.material.blending = THREE.NormalBlending; s.position.set(x + 4.6 + (Math.random() - 0.5) * 2.0, Y0 + 0.4 + Math.random() * 2.2, z - 5.2 + Math.random() * 0.8); s.userData.home = s.position.clone(); g.add(s); room.dust.push(s); }
    room.dustSolid = { obox: 1, x: x + 4.6, z: z - 5.0, hw: 1.3, hd: 0.5, rot: 0 }; WORLD.addSolids([room.dustSolid]);
    room.ghost = person(g, LOOK_GHOSTS.clara, { x: x - 2.4, z: z - 1.8, yaw: 0.2 }, { ghost: true, id: 'clara' });
    room.people = { you: { x: x - 4.5, z: z + 3.8, yaw: Math.PI } };
  }
  function buildLift(room) {
    const R = room.R, g = room.g, k = PA().Kit(), KG = PA().KG, x = R.x, z = R.z;
    // the lift's platform and its rails, the ladder up the back wall to the trapdoor, the counterweights, sandbags, the crank
    k.box(x - 0.5, Y0 + 0.12, z - 2.4, 2.0, 0.24, 2.0, '#8a5f3e', { ink: 0.016 });
    for (const sx of [-1.1, 1.1]) k.box(x - 0.5 + sx, Y0 + R.wh / 2, z - 3.5, 0.16, R.wh, 0.16, '#5a3e2c', { ink: 0.01 });
    for (const s of [-1, 1]) k.rod([x - 0.5 + s * 0.35, Y0, z - R.hd + 0.35], [x - 0.5 + s * 0.35, Y0 + 3.9, z - R.hd + 0.35], 0.04, '#7a5236', 0.006);
    for (let i = 0; i < 10; i++) k.box(x - 0.5, Y0 + 0.3 + i * 0.38, z - R.hd + 0.35, 0.72, 0.05, 0.06, '#8a5f3e', { ink: 0.004 });
    for (let i = 0; i < 4; i++) k.box(x + 5.0, Y0 + 0.2 + i * 0.32, z - 4.6, 0.6, 0.28, 0.5, '#4a4650', { ink: 0.01 });
    k.rod([x + 5.0, Y0 + 1.4, z - 4.6], [x + 5.0, Y0 + 4.2, z - 4.6], 0.03, '#b8a27a', 0.004);
    for (const [sx, sz] of [[5.4, 1.4], [5.9, 1.9], [5.1, 2.1]]) k.add(KG.sphere, x + sx, Y0 + 0.22, z + sz, 0.36, 0.24, 0.28, '#c9b07a', { ink: 0.01 });
    k.add(KG.cyl, x + 3.6, Y0 + 0.6, z - 4.6, 0.12, 1.2, 0.12, '#3a3036', { ink: 0.008 }).add(KG.torus, x + 3.6, Y0 + 1.2, z - 4.4, 0.35, 0.35, 0.35, '#3a3036', { ink: 0.008 });
    k.build(g);
    // the trapdoor, high on the back wall at the ladder's top (the scene: «estaba abierta»), and the light it lets in
    room.trap = grp(g, x - 0.5, Y0 + 3.95, z - R.hd + 0.08);
    const tk = PA().Kit(); tk.box(0, 0.45, 0, 1.2, 0.9, 0.08, '#6b4a30', { ink: 0.014 }).add(KG.torus, 0, 0.3, 0.06, 0.08, 0.08, 0.08, '#3a3036', { ink: 0 }); tk.build(room.trap);
    room.trapLight = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.4), new THREE.MeshBasicMaterial({ color: '#ffe9b0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    room.trapLight.position.set(x - 0.5, Y0 + 2.2, z - R.hd + 1.0); room.trapLight.rotation.x = -0.45; g.add(room.trapLight);
    lookAt(2, 'trapdoor', x - 0.5, z - 3.6, 1.2); lookAt(2, 'ladder', x + 0.4, z - 4.6, 1.0); lookAt(2, 'lift', x - 0.5, z - 1.1, 1.2); lookAt(2, 'weight', x + 4.5, z - 3.8); lookAt(2, 'sandbags', x + 5.2, z + 1.1); lookAt(2, 'crank', x + 3.4, z - 3.8, 1.0);
    WORLD.addSolids([{ obox: 1, x: x - 0.5, z: z - 4.8, hw: 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: x + 5.0, z: z - 4.6, hw: 0.4, hd: 0.35, rot: 0 }, { x: x + 5.5, z: z + 1.8, r: 0.7 }, { x: x + 3.6, z: z - 4.6, r: 0.3 }]);
    // the low door in the back wall: shut until the memory replays (the deed: «Elio bajó por la escalera»)
    doorway(g, x + 4.6, z - R.hd, 1.3, 1.9);
    room.door = grp(g, x + 4.6 - 0.65, Y0, z - R.hd + 0.06); const dk = PA().Kit(); dk.box(0.65, 0.95, 0, 1.3, 1.9, 0.08, '#5a3e2c', { ink: 0.014 }).add(KG.torus, 1.1, 0.95, 0.06, 0.06, 0.06, 0.06, '#c9a24a', { ink: 0 }); dk.build(room.door);
    room.doorSolid = { obox: 1, x: x + 4.6, z: z - R.hd + 0.4, hw: 0.8, hd: 0.4, rot: 0 }; WORLD.addSolids([room.doorSolid]);
    room.ghost = person(g, LOOK_GHOSTS.pilar, { x: x - 3.6, z: z - 0.8, yaw: 0.6 }, { ghost: true, id: 'pilar' });
    room.elio = person(g, LOOK_GHOSTS.elio, { x: x - 0.5, z: z - R.hd + 0.7, yaw: Math.PI }, { ghost: true, id: 'elio' }); room.elio.g.visible = false;
    room.people = { you: { x: x - 4.5, z: z + 3.8, yaw: Math.PI } };
  }
  function buildBox(room) {
    const R = room.R, g = room.g, k = PA().Kit(), KG = PA().KG, x = R.x, z = R.z;
    // the curtain's hem through a slot in the back of the ceiling, the footlights' backs, scripts on a little desk, a fallen music stand
    for (let i = 0; i < 14; i++) k.box(x - 6.5 + i, Y0 + R.wh - 0.4, z - R.hd + 0.3, 0.95, 0.8, 0.12, i % 2 ? '#a32c29' : '#bf3633', { ink: 0.008 });
    for (let i = -5; i <= 5; i++) k.box(x + i * 1.1, Y0 + R.wh - 1.0, z - R.hd + 0.2, 0.4, 0.3, 0.3, '#3b2a22', { ink: 0.008 });
    k.box(x - 4.4, Y0 + 0.4, z - 1.6, 1.4, 0.08, 0.8, '#8a5f3e', { ink: 0.012 }); for (const sx of [-0.6, 0.6]) k.box(x - 4.4 + sx, Y0 + 0.2, z - 1.6, 0.08, 0.4, 0.7, '#6b4a30', { ink: 0.006 });
    for (let i = 0; i < 3; i++) k.box(x - 4.6 + i * 0.3, Y0 + 0.47 + i * 0.03, z - 1.6, 0.4, 0.04, 0.55, '#f4efe0', { ry: i * 0.3, ink: 0.004 });
    k.rod([x + 3.6, Y0 + 0.05, z - 1.0], [x + 4.6, Y0 + 0.3, z - 0.4], 0.03, '#2f3440', 0.004).box(x + 4.75, Y0 + 0.32, z - 0.3, 0.6, 0.04, 0.42, '#2f3440', { ry: 0.6, ink: 0.004 });
    k.box(x + 5.6, Y0 + 0.5, z + 2.4, 0.5, 1.0, 0.5, '#6b4a30', { ink: 0.01 }).add(KG.half, x + 5.6, Y0 + 1.02, z + 2.4, 0.12, -0.16, 0.12, '#e8b83e', { ink: 0.006 });
    k.build(g);
    lookAt(3, 'script', x - 4.4, z - 0.6, 1.2); lookAt(3, 'footlights', x - 1.5, z - 4.2, 1.2); lookAt(3, 'curtain', x + 1.8, z - 4.4, 1.2); lookAt(3, 'stand', x + 4.2, z + 0.4, 1.1); lookAt(3, 'handbell', x + 5.6, z + 3.2, 1.0);
    WORLD.addSolids([{ obox: 1, x: x - 4.4, z: z - 1.6, hw: 0.75, hd: 0.45, rot: 0 }, { x: x + 5.6, z: z + 2.4, r: 0.4 }]);
    // the prompter's shell, the gray figure in it (the boss's own model, posed here), the echo's light after
    room.shellAt = { x, z: z - 3.4 };
    try { room.boss = typeof APBOSS !== 'undefined' ? APBOSS.model() : null; } catch (e) { console.error('[alba past] prompter model', e); room.boss = null; }
    if (room.boss) { room.boss.root.position.set(x, Y0, z - 3.4); room.boss.root.scale.setScalar(1.0); g.add(room.boss.root); }
    room.shellSolid = { x, z: z - 3.4, r: 1.3 }; WORLD.addSolids([room.shellSolid]);
    lookAt(3, 'shell', x - 1.6, z - 2.0, 1.3);
    room.echo = PA().glow('#ffe2a0', 1.6, 0); room.echo.position.set(x, Y0 + 1.3, z - 2.6); g.add(room.echo);
    room.ghost = person(g, LOOK_GHOSTS.aurora, { x: x - 3.2, z: z - 0.4, yaw: 0.7 }, { ghost: true, id: 'aurora' });
    room.people = { you: { x: x - 4.5, z: z + 3.8, yaw: Math.PI } };
  }

  // ---------------------------------------------------------------- the two homes of then
  function buildBakery(room) {
    const R = room.R, g = room.g, k = PA().Kit(), KG = PA().KG, x = R.x, z = R.z;
    // the wood oven (a brick dome), the counter, bread shelves, flour sacks, the scale, an apron on a hook, the gramophone
    k.box(x - 1.6, Y0 + 0.55, z - R.hd + 0.7, 1.9, 1.1, 1.2, '#a1574a', { ink: 0.016 }).add(KG.half, x - 1.6, Y0 + 1.1, z - R.hd + 0.7, 0.95, 0.75, 0.6, '#b8664f', { ink: 0.014 });
    k.box(x - 1.6, Y0 + 0.75, z - R.hd + 1.31, 0.6, 0.45, 0.04, '#2b1a14', { ink: 0 }).add(KG.half, x - 1.6, Y0 + 0.98, z - R.hd + 1.3, 0.3, 0.18, 0.04, '#2b1a14', { ink: 0 });
    k.box(x + 1.6, Y0 + 0.5, z - 0.2, 2.0, 1.0, 0.7, '#9a6a44', { ink: 0.016 }).box(x + 1.6, Y0 + 1.02, z - 0.2, 2.1, 0.06, 0.8, '#c9a77a', { ink: 0.008 });
    for (let s = 0; s < 3; s++) { k.box(x + 2.3, Y0 + 0.7 + s * 0.6, z - R.hd + 0.3, 2.4, 0.06, 0.5, '#8a5f3e', { ink: 0.008 }); for (let i = 0; i < 5; i++) k.add(KG.sphere, x + 1.4 + i * 0.45, Y0 + 0.82 + s * 0.6, z - R.hd + 0.32, 0.18, 0.12, 0.16, ['#d9a45a', '#c98a3a', '#e0b870'][(i + s) % 3], { ink: 0.006 }); }
    for (const [sx, sz] of [[-3.1, 0.6], [-3.1, 1.4], [-2.4, 2.4]]) k.add(KG.sphere, x + sx, Y0 + 0.36, z + sz, 0.36, 0.38, 0.32, '#efe6cf', { ink: 0.01 });
    k.add(KG.cyl, x + 1.0, Y0 + 1.12, z - 0.2, 0.18, 0.04, 0.18, '#c9a24a', { ink: 0.004 }).add(KG.cyl, x + 1.0, Y0 + 1.2, z - 0.2, 0.03, 0.14, 0.03, '#c9a24a', { ink: 0 });
    k.add(KG.sphere, x - 3.6, Y0 + 1.5, z - 1.2, 0.05, 0.36, 0.26, '#f4efe0', { ink: 0.006 });
    k.box(x + 3.1, Y0 + 0.4, z + 1.8, 0.7, 0.8, 0.6, '#7a5236', { ink: 0.01 }).box(x + 3.1, Y0 + 0.92, z + 1.8, 0.44, 0.22, 0.4, '#5a3a24', { ink: 0.008 }).add(KG.cone, x + 3.0, Y0 + 1.35, z + 1.7, 0.3, 0.6, 0.3, '#d8a84a', { rx: -0.6, ink: 0.008 });
    k.add(KG.cyl, x + 3.25, Y0 + 1.06, z + 1.8, 0.2, 0.02, 0.2, '#2b2235', { ink: 0 });
    k.add(KG.cyl, x - 0.2, Y0 + 0.02, z + 1.4, 1.2, 0.02, 0.8, '#c9443a', { ink: 0 });
    k.build(g);
    room.ovenGlow = PA().glow('#ff9f4a', 1.6, 0.5); room.ovenGlow.position.set(x - 1.6, Y0 + 0.8, z - R.hd + 1.4); g.add(room.ovenGlow);
    lookAt(4, 'oven', x - 1.6, z - 1.3, 1.3); lookAt(4, 'flour', x - 2.6, z + 1.0, 1.1); lookAt(4, 'dough', x + 1.9, z + 0.6, 0.9); lookAt(4, 'pin', x + 1.3, z + 0.6, 0.8); lookAt(4, 'basket', x + 2.4, z - 1.8, 1.1);
    lookAt(4, 'scale', x + 0.8, z + 0.6, 0.8); lookAt(4, 'apron', x - 3.0, z - 1.2, 1.0); lookAt(4, 'gramophone', x + 2.6, z + 2.0, 1.0); lookAt(4, 'records', x + 3.3, z + 1.2, 0.9);
    WORLD.addSolids([{ obox: 1, x: x - 1.6, z: z - R.hd + 0.7, hw: 1.0, hd: 0.65, rot: 0 }, { obox: 1, x: x + 1.6, z: z - 0.2, hw: 1.05, hd: 0.4, rot: 0 }, { obox: 1, x: x + 2.3, z: z - R.hd + 0.3, hw: 1.25, hd: 0.3, rot: 0 }, { x: x - 2.9, z: z + 1.2, r: 0.7 }, { x: x + 3.1, z: z + 1.8, r: 0.45 }]);
    // young Marta behind the counter, Canela the cat on a flour sack
    room.marta = person(g, { kid: true, skin: '#efc29a', hair: '#8a4a2a', hairdo: 'bun', dress: '#e8d4b0', apron: '#ffffff', hat: 'scarf', hatColor: '#d0663f', h: 0.78 }, { x: x + 1.6, z: z - 1.0, yaw: 0 }, { id: 'marta' });
    room.cat = grp(g, x - 3.1, Y0 + 0.72, z + 0.6); const ck = PA().Kit();
    ck.add(KG.sphere, 0, 0.14, 0, 0.22, 0.14, 0.16, '#e08a3a', { ink: 0.008 }).add(KG.sphere, 0.2, 0.26, 0, 0.12, 0.11, 0.11, '#e08a3a', { ink: 0.008 }).add(KG.cone, 0.22, 0.4, 0.06, 0.04, 0.08, 0.04, '#e08a3a', { ink: 0.004 }).add(KG.cone, 0.22, 0.4, -0.06, 0.04, 0.08, 0.04, '#e08a3a', { ink: 0.004 });
    ck.rod([-0.2, 0.14, 0], [-0.36, 0.34, 0.06], 0.03, '#e08a3a', 0.004); ck.build(room.cat);
    lookAt(4, 'cat', x - 2.6, z + 0.2, 1.0);
    room.people = { you: { x: x - 2.4, z: z + R.hd - 0.8, yaw: Math.PI } };
    room.exit = { x: x - 2.4, z: z + R.hd - 0.35 };
  }
  function buildSchool(room) {
    const R = room.R, g = room.g, k = PA().Kit(), KG = PA().KG, x = R.x, z = R.z;
    // the blackboard (its own canvas: the rule, in the language), desks in two rows, the abacus, the globe, the map, school bags
    k.box(x, Y0 + 1.7, z - R.hd + 0.06, 3.2, 1.3, 0.06, '#7a5236', { ink: 0.012 });
    k.box(x, Y0 + 1.06, z - R.hd + 0.14, 3.1, 0.05, 0.12, '#7a5236', { ink: 0.006 }).box(x + 0.9, Y0 + 1.1, z - R.hd + 0.16, 0.12, 0.03, 0.03, '#fdf8ee', { ink: 0 });
    const desks = [[-1.8, -0.2], [0.2, -0.2], [-1.8, 1.4], [0.2, 1.4]];
    for (const [dx, dz] of desks) { k.box(x + dx, Y0 + 0.62, z + dz, 1.2, 0.06, 0.6, '#9a7048', { ink: 0.01 }); for (const sx of [-0.5, 0.5]) k.box(x + dx + sx, Y0 + 0.31, z + dz, 0.06, 0.62, 0.5, '#6b4a30', { ink: 0.004 }); k.add(KG.cyl, x + dx + 0.4, Y0 + 0.66, z + dz - 0.18, 0.05, 0.03, 0.05, '#2f4f8a', { ink: 0 }); k.box(x + dx, Y0 + 0.34, z + dz + 0.6, 1.1, 0.06, 0.36, '#8a5f3e', { ink: 0.008 }); }
    k.box(x + 2.9, Y0 + 0.9, z - 1.6, 0.9, 0.06, 0.5, '#8a5f3e', { ink: 0.008 }).box(x + 2.9, Y0 + 0.45, z - 1.6, 0.06, 0.9, 0.4, '#6b4a30', { ink: 0.004 });
    for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) k.add(KG.ball6, x + 2.62 + i * 0.1, Y0 + 1.04 + r * 0.06, z - 1.6, 0.035, 0.035, 0.035, r % 2 ? '#e8e4dc' : '#c9443a', { ink: 0 });
    k.add(KG.sphere, x + 3.2, Y0 + 1.22, z - 1.4, 0.2, 0.2, 0.2, '#3f7fc9', { ink: 0.008 }).add(KG.cyl, x + 3.2, Y0 + 0.98, z - 1.4, 0.08, 0.06, 0.08, '#6b4a30', { ink: 0.004 });
    k.box(x + R.hw - 0.06, Y0 + 1.8, z + 0.6, 0.04, 1.0, 1.4, '#efe6cf', { ink: 0.008 });
    for (let i = 0; i < 3; i++) k.box(x - 3.0 + i * 0.5, Y0 + 1.2, z + R.hd - 0.12, 0.36, 0.42, 0.16, ['#8a5f3e', '#6b4a30', '#a8784e'][i], { ink: 0.008 });
    k.build(g);
    // the window on the left wall, by Elio's desk (daylight comes in)
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.1), new THREE.MeshBasicMaterial({ color: '#f6e7c0', fog: false })); win.position.set(x - R.hw + 0.04, Y0 + 1.7, z - 0.2); win.rotation.y = Math.PI / 2; g.add(win);
    const bt = boardTex(); room.boardTex = bt; const board = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.1), new THREE.MeshBasicMaterial({ map: bt.tx })); board.position.set(x, Y0 + 1.7, z - R.hd + 0.1); g.add(board);
    lookAt(5, 'blackboard', x - 0.6, z - 1.8, 1.2); lookAt(5, 'abacus', x + 2.6, z - 0.9, 0.9); lookAt(5, 'globe', x + 3.2, z - 0.8, 0.8); lookAt(5, 'map', x + 2.9, z + 0.6, 1.0);
    lookAt(5, 'desk', x - 2.8, z - 0.2, 1.0); lookAt(5, 'inkwell', x + 0.7, z + 0.6, 0.8); lookAt(5, 'chalk', x + 1.0, z - 2.0, 0.8); lookAt(5, 'satchel', x - 2.4, z + 2.3, 0.9);
    WORLD.addSolids(desks.map(([dx, dz]) => ({ obox: 1, x: x + dx, z: z + dz + 0.2, hw: 0.65, hd: 0.55, rot: 0 })).concat([{ obox: 1, x: x + 2.9, z: z - 1.6, hw: 0.5, hd: 0.3, rot: 0 }]));
    // young Hugo (all his hair) and Tomi at their desks; the slates on the desks: Hugo's, Tomi's, and one Pili left behind
    const hair = kk => { const KG2 = PA().KG; for (const [hx, hy, hz, r] of [[0, 1.5, -0.05, 0.36], [0.24, 1.42, -0.08, 0.26], [-0.24, 1.42, -0.08, 0.26], [0.16, 1.58, 0.1, 0.22], [-0.16, 1.58, 0.1, 0.22], [0, 1.62, -0.2, 0.28]]) kk.add(KG2.sphere, hx, hy - 0.36, hz, r, r, r, '#3a2416'); };
    room.hugo = person(g, { kid: true, seat: true, skin: '#e6b48c', hair: '#3a2416', hairdo: 'short', dress: '#6f8a4a', vest: '#f4efe0', h: 0.74 }, { x: x - 1.8, z: z + 0.5, yaw: Math.PI }, { id: 'hugo', extra: hair, solid: false });
    room.tomi = person(g, { kid: true, seat: true, skin: '#c98e62', hair: '#2b211d', hairdo: 'short', dress: '#3f7fc9', h: 0.72 }, { x: x + 0.2, z: z + 0.5, yaw: Math.PI }, { id: 'tomi', solid: false });
    room.slates = { hugo: { x: x - 1.8, z: z - 0.2 }, tomi: { x: x + 0.2, z: z - 0.2 }, pili: { x: x + 0.2, z: z + 1.4 } };
    const sk = PA().Kit(); for (const s of Object.values(room.slates)) sk.box(s.x, Y0 + 0.66, s.z, 0.42, 0.02, 0.3, '#3a3f44', { ink: 0.004 }); sk.build(g);
    room.people = { you: { x: x - 2.4, z: z + R.hd - 0.8, yaw: Math.PI } };
    room.exit = { x: x - 2.4, z: z + R.hd - 0.35 };
  }
  // Julián's blackboard: the rule, in the language (APTXT.CARDS.board), chalk on slate
  function boardTex() {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 192;
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4;
    const paint = () => {
      const c = cv.getContext('2d'), l = lang(), C = APTXT.CARDS.board[l] || APTXT.CARDS.board.es;
      c.fillStyle = '#2f3a36'; c.fillRect(0, 0, 512, 192); c.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 30; i++) c.fillRect(Math.random() * 512, Math.random() * 192, 40, 2);
      c.fillStyle = '#f4f1e6'; c.textAlign = 'left'; c.textBaseline = 'middle';
      const font = isC(l) ? '"Yu Gothic UI","Microsoft YaHei",sans-serif' : '"Comic Sans MS","Segoe Print",cursive';
      c.font = `700 30px ${font}`; c.fillText(plain(l === 'es' ? 'Ayer…' : l === 'pt' ? 'Ontem…' : l === 'de' ? 'Gestern …' : l === 'zh' ? '[昨天|zuó tiān] …' : '[昨日|きのう] …', l), 22, 30);
      c.font = `600 28px ${font}`; (C.ex || []).forEach(([w], i) => c.fillText(plain(w, l), 40, 76 + i * 40));
      tx.needsUpdate = true; room5Lang = l;
    };
    paint(); return { tx, paint };
  }
  let room5Lang = null;

  // ---------------------------------------------------------------- build (first time in)
  function build() {
    if (built) return; built = true;
    const scene = G.w3d.scene, M = mats();
    ROOMS.forEach((R, i) => {
      const g = new THREE.Group(); g.name = 'alba-past-' + R.id; g.visible = false; scene.add(g);
      shell(R, g, R.id === 'bakery' ? { floor: M.homeFloor, wall: M.bakeryWall } : R.id === 'school' ? { floor: M.schoolFloor, wall: M.schoolWall } : {});
      rooms[i] = { R, g };
    });
    const B = [buildProps, buildCostumes, buildLift, buildBox, buildBakery, buildSchool];
    B.forEach((fn, i) => { try { fn(rooms[i]); } catch (e) { console.error('[alba past] build', ROOMS[i].id, e); } });
    // the way back: a stair up at the front left of each room under the stage, the house's door in the homes
    for (let i = 0; i < 4; i++) { const r = rooms[i], R = r.R, k = PA().Kit(); for (let s = 0; s < 4; s++) k.box(R.x - R.hw + 1.45 - s * 0.35, Y0 + 0.1 + s * 0.2, R.z + R.hd - 1.0, 0.35, 0.2 + s * 0.4, 1.6, s % 2 ? '#6b4a30' : '#7a5236', { ink: 0.01 }); k.build(r.g); r.exit = { x: R.x - R.hw + 2.2, z: R.z + R.hd - 1.0 }; WORLD.addSolids([{ obox: 1, x: R.x - R.hw + 0.92, z: R.z + R.hd - 1.0, hw: 0.7, hd: 0.8, rot: 0 }]); r.people.you = { x: R.x - 3.2, z: R.z + 3.4, yaw: Math.PI }; }
    for (const i of [4, 5]) { const r = rooms[i], R = r.R, k = PA().Kit(); k.box(r.exit.x, Y0 + 1.05, R.z + R.hd - 0.05, 1.0, 2.1, 0.06, i === 4 ? '#8d5733' : '#2f6f6a', { ink: 0.012 }); k.build(r.g); }
    apply();
  }
  // what the saved progress says the rooms look like (after a load, or when you come back in)
  function apply() {
    const S = AP(), r = rooms;
    if (r[0] && r[0].moon) { r[0].moon.position.x = r[0].R.x + (S.r0d ? 2.2 : 4.6); r[0].moonSolid.x = S.r0d ? 1e5 : r[0].R.x + 4.6; r[0].lampGlow.material.opacity = S.r0s ? 0.7 : 0; }
    if (r[1] && r[1].robeMat) { r[1].robeMat.color.set(S.r1s ? '#c43c3c' : '#8f8a86'); r[1].dust.forEach(s => { s.visible = !S.r1d; }); r[1].dustSolid.x = S.r1d ? 1e5 : r[1].R.x + 4.6; r[1].page.material.opacity = pageHere() ? 0.6 : 0; }
    if (r[2] && r[2].trap) { r[2].trap.rotation.x = S.r2s ? -1.5 : 0; r[2].trapLight.material.opacity = S.r2s ? 0.22 : 0; r[2].door.rotation.y = S.r2d ? -1.4 : 0; r[2].doorSolid.x = S.r2d ? 1e5 : r[2].R.x + 4.6; }
    if (r[3] && r[3].echo) { const freed = !!S.boss; if (r[3].boss) r[3].boss.root.visible = !freed; r[3].echo.material.opacity = freed && !echoGot() ? 0.8 : 0; r[3].shellSolid.x = freed ? 1e5 : r[3].R.x; }
  }
  const echoGot = () => typeof CH4 !== 'undefined' && !!CH4.got('alba', 'past');
  const pageHere = () => { const f = TIME.flag('past', 'felixPage'); return !f || f === 'asked'; };

  // ---------------------------------------------------------------- in and out, room to room
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + 1.1; M.z = z + 0.8; M.hidden = false; M.wander = null; M.station = null; M.look = null; G.sim.snap();
  }
  const FOG = { dark: { fog: '#1e1822', near: 8, far: 22 }, warm: { fog: '#2e2219', near: 13, far: 36 }, home: { fog: '#3a2c22', near: 14, far: 40 } };
  let fogNow = FOG.warm;
  function setFog() {
    const R = ROOMS[cur], S = AP();
    fogNow = !R ? FOG.warm : R.kind === 'home' ? FOG.home : (cur === 0 && !S.r0s) ? FOG.dark : FOG.warm;
    G.w3d.setInterior(fogNow);
  }
  function show(i) { rooms.forEach((r, k) => { r.g.visible = k === i; }); cur = i; setFog(); }
  function hideAll() { rooms.forEach(r => { r.g.visible = false; }); cur = -1; }
  function pastRoot(on) { try { const W = PAST._ && PAST._.W; if (W && W.root) W.root.visible = on; } catch (e) { /* */ } }
  async function enter(id) {
    if (busy || !G) return; busy = true;
    try {
      build();
      outside = id === 'bakery' ? DOORS.bakery : id === 'school' ? DOORS.school : DOORS.under;
      await fade(1, 450);
      inside = true; pastRoot(false);
      const i = id === 'bakery' ? 4 : id === 'school' ? 5 : 0;
      apply(); show(i); const p = rooms[i].people.you; teleport(p.x, p.z, p.yaw); G.cam.snap(Math.PI, i >= 4 ? 0.62 : 0.66, i >= 4 ? 8.5 : 10.5);
      if (i === 5 && room5Lang !== lang() && rooms[5].boardTex) rooms[5].boardTex.paint();
      await fade(0, 450);
      G.save();
      await arrived(i);
    } catch (e) { console.error('[alba past] enter', e); } finally { busy = false; }
  }
  async function leave() {
    if (busy) return; busy = true;
    try {
      await fade(1, 450);
      hideAll(); inside = false; G.w3d.setInterior(null); pastRoot(true);
      teleport(outside.x, outside.z, outside.yaw); G.cam.snap(outside.yaw, 0.28, 8.5);
      await fade(0, 450);
      G.save();
    } catch (e) { console.error('[alba past] leave', e); } finally { busy = false; }
  }
  async function go(i, from = 'below') {
    if (busy) return; busy = true;
    try {
      await fade(1, 350);
      apply(); show(i);
      const r = rooms[i], p = r.people.you;
      if (from === 'above') teleport(r.R.x + 4.6, r.R.z - r.R.hd + 1.6, 0); else teleport(p.x, p.z, p.yaw);
      G.cam.snap(Math.PI, 0.66, 10.5);
      await fade(0, 350);
      G.save();
      await arrived(i);
    } catch (e) { console.error('[alba past] go', e); } finally { busy = false; }
  }
  // the first time in a room: its card, and the memory (or the first word in a home)
  async function arrived(i) {
    const S = AP(), seen = S.roomSeen || (S.roomSeen = {}), R = ROOMS[i];
    if (seen[R.id]) return;
    seen[R.id] = true;
    if (FAST.on) STORY.think(R.name + ' · ' + R.sub, 3); else await UI.chapter(R.name, R.sub);
    if (typeof ALBA_PAST !== 'undefined' && ALBA_PAST.arrived) { try { await ALBA_PAST.arrived(R.id, rooms[i]); } catch (e) { console.error('[alba past] arrived', e); } }
    G.save();
  }

  // ---------------------------------------------------------------- what you can press E on, room by room (alba_past.js runs them)
  function interactables() {
    const list = [], room = rooms[cur]; if (!inside || !room || busy) return list;
    const R = room.R, y = Y0, A = typeof ALBA_PAST !== 'undefined' ? ALBA_PAST : null;
    const add = (x, z, r, label, run, extra) => list.push(Object.assign({ x, z, y, r, label, run }, extra || {}));
    if (cur < 4) add(room.exit.x, room.exit.z, 1.6, cur === 0 ? 'Go back up to the forecourt' : 'Go back', () => (cur === 0 ? leave() : go(cur - 1, 'above')));
    else add(room.exit.x, room.exit.z, 1.5, 'Go out', leave);
    // the room's things to do first (alba_past.js), then the Looks (a thing with something to do takes its Look's place: hides)
    let items = [];
    if (A && A.roomItems) { try { items = A.roomItems(R.id, room, add) || []; } catch (e) { console.error('[alba past] room items', e); } }
    const hidden = new Set(items.map(it => it.hides).filter(Boolean));
    list.push(...items);
    for (const L0 of LOOKS_AT[cur] || []) if (!hidden.has(L0.key)) add(L0.x, L0.z, L0.r, 'Look', () => (A ? A.look(L0.key) : null));
    return list;
  }
  function target() { if (!inside) return null; const A = typeof ALBA_PAST !== 'undefined' ? ALBA_PAST : null; return A && A.roomTarget ? A.roomTarget(ROOMS[cur].id, rooms[cur]) : null; }
  const song = () => (!inside ? null : ROOMS[cur] && ROOMS[cur].kind === 'home' ? 'ap_then' : 'ap_under');
  // every frame while inside (main.js: the room in charge)
  function update(dt, t) {
    if (!inside || cur < 0) return;
    if (G.sim.lock && !STORY.busy && !busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    const room = rooms[cur], R = room.R, Y = G.sim.you, M = G.sim.mimo;
    // keep Mimo (and you) in the room
    if (!M.hidden && (Math.abs(M.x - R.x) > R.hw - 0.3 || Math.abs(M.z - R.z) > R.hd - 0.3 || M.y < Y0 - 1)) { M.hop = null; M.wander = null; M.x = clamp(M.x, R.x - R.hw + 0.7, R.x + R.hw - 0.7); M.z = clamp(M.z, R.z - R.hd + 0.7, R.z + R.hd - 0.7); M.y = M.ry = Y0; }
    if (M.wander && (Math.abs(M.wander.x - R.x) > R.hw - 0.7 || Math.abs(M.wander.z - R.z) > R.hd - 0.7)) { M.wander.x = clamp(M.wander.x, R.x - R.hw + 0.8, R.x + R.hw - 0.8); M.wander.z = clamp(M.wander.z, R.z - R.hd + 0.8, R.z + R.hd - 0.8); }
    if (Y.y < Y0 - 2 || Math.abs(Y.x - R.x) > R.hw + 0.5 || Math.abs(Y.z - R.z) > R.hd + 0.5) { const p = room.people.you; teleport(p.x, p.z, p.yaw); }
    // the ghosts breathe and shimmer; the people turn to you
    for (const P of [room.ghost, room.marta, room.hugo, room.tomi, room.elio]) {
      if (!P || !P.g.visible) continue;
      const a = P.api, near = Math.hypot(Y.x - a.x, Y.z - a.z) < 4;
      P.body.position.y = a.talking ? Math.abs(Math.sin(t * 12 + P.ph)) * 0.05 : Math.sin(t * 1.6 + P.ph) * 0.015;
      if (!P.look.seat && !P.lockYaw) P.g.rotation.y = dampAngle(P.g.rotation.y, near || a.talking ? Math.atan2(Y.x - a.x, Y.z - a.z) : a.yaw, 4, dt);
      if (P.gl) P.gl.material.opacity = 0.2 + 0.08 * Math.sin(t * 2.2 + P.ph);
      if (P.ghost) P.body.children.forEach(m => { if (m.material && m.material.transparent) m.material.opacity = 0.48 + 0.08 * Math.sin(t * 2.3 + P.ph); });
    }
    if (cur === 0 && room.lampGlow.material.opacity > 0) room.lampGlow.material.opacity = 0.62 + 0.08 * Math.sin(t * 7) + 0.04 * Math.sin(t * 13);
    if (cur === 1) { room.dust.forEach((s, i) => { if (!s.visible) return; s.position.x = s.userData.home.x + Math.sin(t * 0.7 + i) * 0.25; s.position.y = s.userData.home.y + Math.sin(t * 0.9 + i * 1.7) * 0.18; }); if (room.page.material.opacity > 0) room.page.material.opacity = 0.45 + 0.2 * Math.sin(t * 3); }
    if (cur === 3) { if (room.boss && room.boss.root.visible) { try { APBOSS && room.boss && poseIdle(room.boss, t, dt); } catch (e) { /* */ } } if (room.echo.material.opacity > 0) { room.echo.material.opacity = 0.65 + 0.2 * Math.sin(t * 2.4); room.echo.position.y = Y0 + 1.3 + Math.sin(t * 1.3) * 0.12; } }
    if (cur === 4) { room.ovenGlow.material.opacity = 0.45 + 0.1 * Math.sin(t * 5) + 0.05 * Math.sin(t * 11); if (room.cat) room.cat.rotation.z = Math.sin(t * 0.8) * 0.03; }
  }
  // the Prompter in its shell, out of the fight: it breathes, the masks go round slowly, it whispers now and then
  function poseIdle(h, t, dt) {
    h.body.position.y = Math.sin(t * 1.2) * 0.04; h.f.position.z = Math.sin(t * 0.9) * 0.05; h.f.rotation.z = Math.sin(t * 0.7) * 0.04;
    h.masks.forEach((m, i) => { const a = m.userData.a + t * 0.35; m.position.set(Math.sin(a) * 1.25, 1.15 + Math.sin(t * 1.7 + i) * 0.16, Math.cos(a) * 1.25); m.lookAt(m.position.x * 3, m.position.y, m.position.z * 3 + 4); });
  }
  // every frame after the Past's own light (alba_past.js): the room's fog and no sky, the old photograph's grade kept
  function look() {
    if (!inside || !G) return;
    const sc = G.w3d.scene, f = fogNow;
    sc.fog.color.set(f.fog); sc.fog.near = f.near; sc.fog.far = f.far; if (!sc.background || !sc.background.isColor) sc.background = new THREE.Color(f.fog); else sc.background.set(f.fog);
    try { const W = PAST._ && PAST._.W; if (W && W.sky) W.sky.visible = false; } catch (e) { /* */ }
  }
  function init(game) { G = game; }

  return {
    init, enter, leave, go, update, interactables, target, song, look, apply, ROOMS, IDX, DOORS, FOG,
    get inside() { return inside; }, get room() { return cur; }, get OUTSIDE() { return outside; }, get busy() { return busy; },
    curiosities: () => [],
    setFog: k => { fogNow = FOG[k] || fogNow; if (G && inside) G.w3d.setInterior(fogNow); },
    _: { rooms, build, show, teleport, LOOKS_AT, FAST, get built() { return built; } },
  };
})();
