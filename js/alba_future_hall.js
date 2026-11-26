'use strict';
// The old theater, tomorrow (Round T1b: Alba's Future's dungeon) and tomorrow's two little interiors (DESIGN.md 18.6; TIME.md §9).
// A room module in main.js's sense (ALBA_FUT_HALL.inside), listed in ROOMS before PAST, FUTURE and TIME, so it answers E while you're
// in here; FUTURE stays in, so the world is still tomorrow (the save keeps it, and your spot outside: OUTSIDE). Six rooms at y 300,
// built like the Drowned Chapel's (walls facing in, one room at a time), at z −390: the theater's four at x −430 / −404 / −378 /
// −352, the bakery at −326, the new library at −300 (26 apart, 30 from the rows at z −420 and −360; over the far north-west hills).
//   0 the foyer       plans happen next: «{mimo} saltará sobre la máscara» … the masks laugh first, then it lands (3: two masks,
//                     the fallen chandelier) → the stairs
//   1 the balconies   predictions: a box's mask rises or ducks; say where it will laugh from, before it does (3 boxes) → the ladder
//   2 the fly loft    «si» traps: «Si bajan, {mimo} las golpeará» before Tadeo pulls the lever; «Si el saco vuelve, {mimo} lo
//                     empujará» → the hatch down
//   3 the stage       the Laughing Gallery (alba_future_boss.js); then Elio's echo («¡Gracias, Alba!»); later the festival's night
//   4 the bakery      Nilo, the cat, the oven: ◆ «Bread for the festival» (me gustaría)
//   5 the new library Luci, Sami in the window seat, the guest book: ◆ «Sami's first words» (hablarás, nadie se reirá) and
//                     ◆ «The guest book of tomorrow» (mañana + 1st person)
// Tadeo comes in with you (he knows the theater's old plans). Every solved room chimes (BFX.solved) and its way on opens.
const ALBA_FUT_HALL = (() => {
  const AF = typeof ALBA_FUT !== 'undefined' && ALBA_FUT ? ALBA_FUT : null;
  const STUB = { inside: false, interactables: () => [], update() {}, target: () => null, song: () => null, OUTSIDE: { x: -13.5, z: -229, yaw: Math.PI }, enter() {}, leave() {}, festival() {} };
  if (!AF || typeof AFTXT === 'undefined' || typeof CAVES === 'undefined' || !CAVES.Kit) return STUB;
  const X = AFTXT, U = AF._, A = TIME.API, V = A.V, snd = A.snd, gy = A.gy;
  const G = () => A.G, lang = () => A.lang(), isCl = l => l === 'zh' || l === 'ja';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const F = U.F, setF = U.setF, S = () => U.ST();
  const esc = s => A.esc(s), plainT = s => A.plainT(s);
  const solved = () => { try { if (typeof BFX !== 'undefined' && BFX.solved) BFX.solved(); else snd('chest'); } catch (e) { /* */ } };
  const Y0 = 300;
  const ROOMS = [
    { id: 'foyer', name: 'The Foyer', sub: 'The old theater, tomorrow · the foyer', x: -430, z: -390, hw: 7, hd: 6, wh: 5.6, theater: true },
    { id: 'balc', name: 'The Balconies', sub: 'The old theater, tomorrow · the balconies', x: -404, z: -390, hw: 7, hd: 6, wh: 5.6, theater: true },
    { id: 'loft', name: 'The Fly Loft', sub: 'The old theater, tomorrow · above the stage', x: -378, z: -390, hw: 7, hd: 6, wh: 5.6, theater: true },
    { id: 'stage', name: 'The Stage', sub: 'The old theater, tomorrow · the stage', x: -352, z: -390, hw: 7, hd: 6, wh: 6.4, theater: true },
    { id: 'bakery', name: 'The Bakery', sub: 'Alba, tomorrow · Marta’s bakery', x: -326, z: -390, hw: 5.5, hd: 4.25, wh: 4.0 },
    { id: 'library', name: 'The New Library', sub: 'Alba, tomorrow · the new library', x: -300, z: -390, hw: 5.5, hd: 4.25, wh: 4.0 },
  ];
  let inside = false, cur = -1, built = false, back = null, festOn = false, entering = false;
  const rooms = [];
  const Kit = () => CAVES.Kit(), KG = () => CAVES.GEO;
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

  // ------------------------------------------------------------ a little screen work: words floating up, laughter, applause
  function css() {
    if (document.getElementById('af-css')) return;
    const s = document.createElement('style'); s.id = 'af-css';
    s.textContent = `.af-float { position: fixed; z-index: 8; pointer-events: none; transform: translate(-50%, -50%); font: 800 22px Bahnschrift, "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif; color: #e9e6ef;
  text-shadow: 0 2px 0 #2b2235, 0 0 8px rgba(43,34,53,.7); white-space: nowrap; transition: transform 1.5s ease-out, opacity 1.5s ease-in; }
.af-float.gold { color: #ffe9a8; font-size: 26px; } .af-float.small { font-size: 16px; }`;
    document.head.appendChild(s);
  }
  function screenOf(x, y, z) { const v = V(x, y, z).project(G().w3d.camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, on: v.z < 1 }; }
  function floatText(text, x, y, z, o = {}) {
    css(); const p = screenOf(x, y, z); if (!p.on) return;
    const el = document.createElement('div'); el.className = 'af-float' + (o.gold ? ' gold' : '') + (o.small ? ' small' : '');
    el.innerHTML = isCl(lang()) && typeof CJK !== 'undefined' && /\[/.test(text) ? CJK.html(text, { lang: lang() }) : esc(text);
    el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = `translate(-50%, -${150 + Math.random() * 80}%) rotate(${(Math.random() - 0.5) * 14}deg)`; el.style.opacity = '0'; });
    setTimeout(() => el.remove(), 1600);
  }
  function laughSfx(n = 1, pitch = 1) {
    const ac = Sound.ctx, out = Sound.out; if (!ac || !out || !Sound.music) return;
    for (let v = 0; v < n; v++) {
      const t0 = ac.currentTime + v * 0.09 + Math.random() * 0.3, f0 = (160 + Math.random() * 180) * pitch, syl = 4 + ((Math.random() * 3) | 0);
      for (let i = 0; i < syl; i++) {
        const t = t0 + i * (0.12 + Math.random() * 0.03), o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * (1.2 - i * 0.05), t); o.frequency.exponentialRampToValueAtTime(f0 * (0.95 - i * 0.05), t + 0.09);
        bp.type = 'bandpass'; bp.frequency.value = 750 + Math.random() * 450; bp.Q.value = 2.4;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + 0.014); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
        o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.13);
      }
    }
  }
  let NOISE = null;
  function clapSfx(n = 30, sec = 2) {
    const ac = Sound.ctx, out = Sound.out; if (!ac || !out || !Sound.music) return;
    if (!NOISE) { NOISE = ac.createBuffer(1, ac.sampleRate * 0.2, ac.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.02)); }
    for (let i = 0; i < n; i++) { const t = ac.currentTime + Math.random() * sec, s = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = NOISE; bp.type = 'bandpass'; bp.frequency.value = 1100 + Math.random() * 900; bp.Q.value = 1.2; g.gain.value = 0.06 + Math.random() * 0.05; s.connect(bp); bp.connect(g); g.connect(out); s.start(t); }
  }
  const HA = { es: '¡JA!', pt: 'HA!', de: 'HA!', zh: '[哈|hā] [哈|hā] ！', ja: 'ハハ ！', en: 'HA!' };

  // ------------------------------------------------------------ materials: the theater's red damask, its boards and tiles; warm plaster
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const damask = tex(128, 128, c => { c.fillStyle = '#7a2e34'; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(232,184,62,0.22)'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.beginPath(); c.ellipse(x * 32 + (y % 2) * 16 + 8, y * 32 + 16, 5, 9, 0, 0, TAU); c.fill(); } c.fillStyle = '#4a2a22'; c.fillRect(0, 104, 128, 24); c.fillStyle = '#c9a26a'; c.fillRect(0, 100, 128, 4); }, 4, 1.4);
    const boards = tex(128, 128, c => { c.fillStyle = '#8a5f3e'; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#7d5537' : '#93684a'; c.fillRect(0, i * 16, 128, 15); } c.fillStyle = 'rgba(40,24,16,0.4)'; for (let i = 0; i < 8; i++) c.fillRect(((i * 37) % 128), i * 16, 2, 16); }, 3, 3);
    const tiles = tex(128, 128, c => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#e8e0cc' : '#4a3f48'; c.fillRect(x * 16, y * 16, 16, 16); } }, 3, 3);
    const plaster = tex(128, 128, c => { c.fillStyle = '#f6e9cf'; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(160,120,80,0.1)'; for (let i = 0; i < 30; i++) c.fillRect((i * 53) % 128, (i * 29) % 128, 6, 3); c.fillStyle = '#c98a5a'; c.fillRect(0, 98, 128, 30); c.fillStyle = '#a86f44'; c.fillRect(0, 96, 128, 3); }, 3, 1);
    const paperB = tex(128, 128, c => { c.fillStyle = '#e8f0e4'; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(79,154,90,0.18)'; for (let y = 0; y < 8; y++) c.fillRect(0, y * 16, 128, 6); c.fillStyle = '#5a7a5e'; c.fillRect(0, 98, 128, 30); }, 3, 1);
    const wood = tex(128, 128, c => { c.fillStyle = '#b88a5a'; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#a87a4a' : '#c49464'; c.fillRect(i * 22, 0, 20, 128); } }, 3, 3);
    const toonM = map => new THREE.MeshToonMaterial({ map, gradientMap: TK.grad });
    MAT = { damask: toonM(damask), boards: toonM(boards), tiles: toonM(tiles), plaster: toonM(plaster), paperB: toonM(paperB), wood: toonM(wood), hole: new THREE.MeshBasicMaterial({ color: '#0d0c14' }) };
    return MAT;
  }
  // a room's shell: the floor, four walls facing in (the camera looks in, like a dollhouse), its solids and platform
  function shell(R, g, o = {}) {
    const M = mats();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(R.hw * 2, 0.4, R.hd * 2), o.floor || M.boards); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
    [[0, -R.hd, 0, R.hw * 2], [0, R.hd, Math.PI, R.hw * 2], [-R.hw, 0, Math.PI / 2, R.hd * 2], [R.hw, 0, -Math.PI / 2, R.hd * 2]].forEach(([dx, dz, ry, w]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, R.wh), o.wall || M.damask); m.position.set(R.x + dx, Y0 + R.wh / 2, R.z + dz); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    });
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - R.hd - 0.2, hw: R.hw + 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: R.x, z: R.z + R.hd + 0.2, hw: R.hw + 0.6, hd: 0.3, rot: 0 },
      { obox: 1, x: R.x - R.hw - 0.2, z: R.z, hw: 0.3, hd: R.hd + 0.6, rot: 0 }, { obox: 1, x: R.x + R.hw + 0.2, z: R.z, hw: 0.3, hd: R.hd + 0.6, rot: 0 }]);
    WORLD.addPlatforms([{ box: [R.x - R.hw, R.x + R.hw, R.z - R.hd, R.z + R.hd], top: Y0 }]);
    // the way out / down: a dark doorway in the floor at the front, by the left
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), M.hole); door.rotation.x = -Math.PI / 2; door.position.set(R.x - R.hw + 2.2, Y0 + 0.012, R.z + R.hd - 0.65); g.add(door);
  }
  // a mask (the Gallery's laughing face), and its cracked twin
  let CRACKED = null;
  const crackedFace = () => CRACKED || (CRACKED = TK.canvasTex(128, 128, c => {
    c.drawImage(U.laughFace().image, 0, 0); c.strokeStyle = '#2b2235'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(64, 8); c.lineTo(58, 40); c.lineTo(72, 62); c.lineTo(60, 92); c.lineTo(70, 122); c.stroke();
    c.beginPath(); c.moveTo(58, 40); c.lineTo(30, 52); c.moveTo(72, 62); c.lineTo(104, 70); c.stroke();
  }));
  function mask(parent, x, y, z, s = 1) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * s, 1.0 * s), new THREE.MeshBasicMaterial({ map: U.laughFace(), transparent: true, side: THREE.DoubleSide }));
    m.position.set(x, y, z); parent.add(m); m.userData.home = m.position.clone(); return m;
  }

  // ------------------------------------------------------------ the people in here (the person kit), and the cat
  const LOOK = {
    luci: { skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'bun', dress: '#8a5ab0', shawl: '#c9b3f0', glasses: true, h: 1.0 },
    sami: { kid: true, seat: true, skin: '#d9a87e', hair: '#2b211d', hairdo: 'tails', dress: '#3e8f8a', ribbon: '#ffd84a', h: 0.74 },
    nilo: { skin: '#f5cda2', hair: '#e0b060', hairdo: 'short', dress: '#e8d4b0', apron: '#fffaf0', hat: 'scarf', hatColor: '#f4efe4', h: 1.02 },
  };
  let TAD = null;
  const ppl = {};
  // (the kit puts people on the hills' ground; in here the floor is y 300)
  const hallPerson = (id, look, at, parent, y = Y0) => { const p = U.makePerson(id, look, at, parent); if (!p) return null; p.g.position.y = y; p.api.y = y; p.g.visible = true; return p; };
  function catModel(parent, x, y, z) {
    const g = grp(parent, x, y, z), k = Kit(), GG = KG();
    k.add(GG.sphere, 0, 0.16, 0, 0.3, 0.18, 0.22, '#e8a04a', { ink: 0.012 }).add(GG.sphere, 0.26, 0.24, 0.02, 0.15, 0.13, 0.14, '#e8a04a', { ink: 0.01 });
    k.add(GG.cone, 0.3, 0.38, -0.06, 0.05, 0.08, 0.04, '#e8a04a', { ink: 0.006 }).add(GG.cone, 0.3, 0.38, 0.1, 0.05, 0.08, 0.04, '#e8a04a', { ink: 0.006 });
    k.add(GG.cyl, -0.25, 0.1, 0.18, 0.04, 0.4, 0.04, '#d48a3a', { rx: 1.2, ry: 0.5, ink: 0.006 });
    for (let i = 0; i < 3; i++) k.box(-0.05 + i * 0.1, 0.33, 0, 0.03, 0.01, 0.2, '#c9783a', { ink: 0 });
    k.build(g); g.rotation.y = 0.6; return g;
  }

  // ------------------------------------------------------------ build the six rooms (the first time you go in)
  function build() {
    if (built) return; built = true;
    const scene = G().w3d.scene, M = mats();
    ROOMS.forEach((R, i) => { const g = new THREE.Group(); g.visible = false; g.name = 'alba-future-hall-' + R.id; scene.add(g); rooms[i] = { R, g, solids: [] };
      shell(R, g, R.theater ? (i === 0 ? { floor: M.tiles } : i === 2 ? { floor: M.boards } : {}) : i === 4 ? { wall: M.plaster, floor: M.wood } : { wall: M.paperB, floor: M.wood }); });
    const pg = new THREE.Group(); scene.add(pg); pg.visible = false;
    TAD = U.makePerson('hall-tadeo', U.LOOKS.tadeo, { x: 0, z: 0, yaw: Math.PI }, pg); TAD.group = pg; TAD.api.name = U.nameOf('tadeo');
    buildFoyer(rooms[0]); buildBalc(rooms[1]); buildLoft(rooms[2]); buildStage(rooms[3]); buildBakery(rooms[4]); buildLibrary(rooms[5]);
    applyState();
  }
  // 0 · the foyer: the grand stairs at the back, two masks over them, the fallen chandelier across their foot, the box office,
  // the cloakroom, old festival posters
  function buildFoyer(room) {
    const R = room.R, g = room.g, k = Kit(), GG = KG(), M = mats();
    for (let i = 0; i < 6; i++) k.box(R.x, Y0 + 0.13 + i * 0.26, R.z - 1.6 - i * 0.62, 4.4, 0.26 + i * 0.52, 0.62, i % 2 ? '#8a2e34' : '#9a3a3e', { ink: 0.012 });
    for (const s of [-1, 1]) { k.box(R.x + s * 2.3, Y0 + 1.6, R.z - 3.1, 0.14, 0.14, 4.2, '#c9a26a', { rx: 0.42, ink: 0.008 }); for (let j = 0; j < 5; j++) k.add(GG.cyl6, R.x + s * 2.3, Y0 + 0.6 + j * 0.3, R.z - 1.6 - j * 0.8, 0.04, 0.9, 0.04, '#c9a26a', { ink: 0 }); }
    k.box(R.x - 5.4, Y0 + 1.1, R.z + 2.9, 2.0, 2.2, 1.4, '#6b3a2a', { ink: 0.015 }).box(R.x - 5.4, Y0 + 1.35, R.z + 3.62, 1.3, 0.7, 0.04, '#cfe4f0', { ink: 0.006 }).box(R.x - 5.4, Y0 + 2.35, R.z + 3.62, 2.1, 0.32, 0.08, '#e8b83e', { ink: 0.008 });
    k.box(R.x + 6.3, Y0 + 0.55, R.z + 0.6, 0.8, 1.1, 3.4, '#6b3a2a', { ink: 0.012 }).box(R.x + 6.5, Y0 + 1.9, R.z + 0.6, 0.06, 0.05, 3.0, '#c9a26a', { ink: 0 });
    for (let j = 0; j < 4; j++) k.add(GG.cyl6, R.x + 6.5, Y0 + 1.6, R.z - 0.6 + j * 0.8, 0.12, 0.5, 0.06, ['#5a4a7a', '#7a2e34', '#3e6f5a', '#c9a26a'][j], { ink: 0.004 });     // (coats left behind, forty years)
    for (const [x, z] of [[-3.6, 0.6], [-3.6, 3.4], [3.6, 3.4]]) { k.add(GG.cyl6, R.x + x, Y0 + 0.5, R.z + z, 0.06, 1.0, 0.06, '#c9a26a', { ink: 0.006 }).add(GG.sphere, R.x + x, Y0 + 1.04, R.z + z, 0.09, 0.09, 0.09, '#e8b83e', { ink: 0.006 }); }
    k.build(g);
    // the doorway at the top of the stairs (dark until the way is free), the posters on the side walls
    const top = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.6), M.hole); top.position.set(R.x, Y0 + 2.9, R.z - R.hd + 0.03); g.add(top);
    room.posters = [[-R.hw + 0.03, -1.2, Math.PI / 2, '#c9443a'], [-R.hw + 0.03, 1.6, Math.PI / 2, '#3f7fc9'], [R.hw - 0.03, -2.6, -Math.PI / 2, '#5fae4f']].map(([dx, dz, ry, col]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), new THREE.MeshLambertMaterial({ map: U.signTex(['♪ ★ ♪', '19··'], { bg: col, ink: '#fffaf0', rim: '#e8b83e', w: 128, h: 180, fs: 22 }) }));
      m.position.set(R.x + dx, Y0 + 2.0, R.z + dz); m.rotation.y = ry; g.add(m); return { x: R.x + dx, z: R.z + dz };
    });
    // the two masks over the stairs, on chains; the chandelier, fallen
    room.masks = [-1.4, 1.4].map(dx => { const m = mask(g, R.x + dx, Y0 + 3.5, R.z - 2.9, 1.05); const ch = new THREE.Mesh(KG().cyl6, new THREE.MeshBasicMaterial({ color: '#4a4048' })); ch.scale.set(0.02, 1.6, 0.02); ch.position.set(0, 1.3, 0); m.add(ch); return m; });
    const cg = grp(g, R.x, Y0, R.z - 0.7), ck = Kit(); cg.rotation.set(0, 0.18, 0.12);
    ck.add(GG.cyl, 0, 0.32, 0, 1.6, 0.1, 1.6, '#c9a26a', { ink: 0.012 }).add(GG.cyl, 0, 0.32, 0, 1.3, 0.12, 1.3, '#3a3036', { ink: 0 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; ck.add(GG.sphere, Math.cos(a) * 1.5, 0.22, Math.sin(a) * 1.5, 0.12, 0.2, 0.12, '#e8f4ff', { ink: 0.004 }); ck.add(GG.cyl6, Math.cos(a) * 0.8, 0.4, Math.sin(a) * 0.8, 0.04, 0.04, 1.6, '#c9a26a', { ry: -a, ink: 0 }); }
    ck.build(cg); room.chandelier = cg;
    room.chSolid = { obox: 1, x: R.x, z: R.z - 0.7, hw: 2.0, hd: 0.9, rot: 0.18 };
    room.stairsSolid = { obox: 1, x: R.x, z: R.z - 3.6, hw: 2.4, hd: 2.4, rot: 0 };
    WORLD.addSolids([room.chSolid, room.stairsSolid, { obox: 1, x: R.x - 5.4, z: R.z + 2.9, hw: 1.0, hd: 0.7, rot: 0 }, { obox: 1, x: R.x + 6.3, z: R.z + 0.6, hw: 0.4, hd: 1.7, rot: 0 }]);
    room.tadeo = { x: R.x + 2.8, z: R.z + 2.4, yaw: Math.PI + 0.4 };
    room.tell = { x: R.x, z: R.z + 1.4 };
  }
  // 1 · the balconies: a walkway under three opera boxes, a mask in each; the rope ladder up to the fly loft, behind a gray cloth
  function buildBalc(room) {
    const R = room.R, g = room.g, k = Kit(), GG = KG();
    room.boxes = [-4.3, 0, 4.3].map((dx, i) => {
      const bx = R.x + dx, bz = R.z - R.hd + 0.9;
      k.box(bx, Y0 + 2.1, bz + 0.5, 3.2, 0.25, 1.6, '#6b3a2a', { ink: 0.014 });                                              // the box's floor
      k.box(bx, Y0 + 2.55, bz + 1.28, 3.2, 0.7, 0.1, '#c9a26a', { ink: 0.01 });                                              // its gilded front
      for (let j = 0; j < 7; j++) k.add(GG.cyl6, bx - 1.4 + j * 0.47, Y0 + 2.55, bz + 1.24, 0.04, 0.6, 0.04, '#e8b83e', { ink: 0 });
      for (const s of [-1, 1]) k.box(bx + s * 1.45, Y0 + 3.6, bz + 0.2, 0.4, 1.9, 0.2, '#9a2a30', { ink: 0.01 });             // its curtains
      k.box(bx, Y0 + 4.6, bz + 0.25, 3.3, 0.3, 0.25, '#7a2e34', { ink: 0.01 });
      k.add(GG.cyl6, bx, Y0 + 1.05, bz + 1.1, 0.12, 2.1, 0.12, '#c9a26a', { ink: 0.008 });                                       // the column under it
      return { x: bx, z: bz, m: mask(g, bx, Y0 + 3.05, bz + 0.6, 0.9) };
    });
    k.box(R.x, Y0 + 0.5, R.z + 2.4, R.hw * 2 - 0.6, 1.0, 0.12, '#6b3a2a', { ink: 0.01 }).box(R.x, Y0 + 1.04, R.z + 2.4, R.hw * 2 - 0.5, 0.08, 0.22, '#c9a26a', { ink: 0.006 });   // the walkway's rail, over the stalls
    for (let i = 0; i < 12; i++) k.add(GG.cyl6, R.x - 5.6 + i * 1.02, Y0 + 0.5, R.z + 2.4, 0.035, 0.95, 0.035, '#c9a26a', { ink: 0 });
    // the rope ladder (front right corner, up through the ceiling)
    room.ladder = { x: R.x + 6.0, z: R.z + 0.4 };
    for (const s of [-0.3, 0.3]) k.add(GG.cyl6, room.ladder.x + s, Y0 + 2.8, room.ladder.z, 0.03, 5.6, 0.03, '#b8a27a', { ink: 0 });
    for (let i = 0; i < 12; i++) k.box(room.ladder.x, Y0 + 0.3 + i * 0.45, room.ladder.z, 0.66, 0.05, 0.08, '#8a5f3e', { ink: 0.004 });
    k.build(g);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.2), new THREE.MeshBasicMaterial({ color: '#9a97a8', transparent: true, opacity: 0.85, side: THREE.DoubleSide })); cloth.position.set(room.ladder.x - 0.05, Y0 + 1.6, room.ladder.z + 0.3); cloth.rotation.y = -0.4; g.add(cloth); room.cloth = cloth;
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z + 2.4, hw: R.hw - 0.3, hd: 0.15, rot: 0 }, { x: room.ladder.x, z: room.ladder.z, r: 0.35 }]);
    room.tadeo = { x: R.x - 3.0, z: R.z + 4.0, yaw: Math.PI };
    room.watch = { x: R.x, z: R.z + 3.9 };
  }
  // 2 · the fly loft: catwalk planks over the dark, ropes and sandbags, the big lever, three masks roosting on a beam, the hatch down
  function buildLoft(room) {
    const R = room.R, g = room.g, k = Kit(), GG = KG();
    for (let i = 0; i < 9; i++) k.box(R.x, Y0 + 0.01, R.z - 4.8 + i * 1.2, R.hw * 2 - 0.4, 0.02, 0.06, '#1a1418', { ink: 0 });          // (the gaps between the planks)
    k.box(R.x, Y0 + 4.6, R.z - R.hd + 0.4, R.hw * 2 - 0.4, 0.35, 0.4, '#4a3a2e', { ink: 0.015 });                                         // the beam the masks roost on
    for (let i = 0; i < 7; i++) k.add(GG.cyl6, R.x - 5.2 + i * 1.7, Y0 + 3.4, R.z - 1.8 + (i % 3) * 0.9, 0.025, 4.4, 0.025, '#b8a27a', { ink: 0 });   // ropes
    room.bags = [[-3.2, -0.6], [1.8, -2.2], [4.6, 0.8]].map(([dx, dz]) => ({ x: R.x + dx, z: R.z + dz }));
    for (const b of room.bags) k.add(GG.sphere, b.x, Y0 + 2.6, b.z, 0.32, 0.45, 0.32, '#a89270', { ink: 0.012 });
    room.lever = { x: R.x - 5.2, z: R.z - 1.8 };
    k.box(room.lever.x, Y0 + 0.4, room.lever.z, 0.6, 0.8, 0.5, '#4a4048', { ink: 0.012 });
    k.box(R.x, Y0 + 5.2, R.z + R.hd - 0.5, R.hw * 2 - 0.4, 0.5, 0.5, '#9a2a30', { ink: 0.012 });                                          // the curtain, rolled up on its batten
    k.build(g);
    const lg = grp(g, room.lever.x, Y0 + 0.8, room.lever.z), lk = Kit(); lk.add(GG.cyl6, 0, 0.5, 0, 0.05, 1.0, 0.05, '#2b2235', { ink: 0.006 }).add(GG.sphere, 0, 1.02, 0, 0.12, 0.12, 0.12, '#c9443a', { ink: 0.006 }); lk.build(lg); lg.rotation.x = -0.5; room.leverG = lg;
    // the big sandbag on its rope (it drops, then swings back), the masks on the beam
    const sb = grp(g, R.x + 0.6, Y0 + 4.2, R.z - 0.4), sk = Kit(); sk.add(GG.cyl6, 0, 0.6, 0, 0.03, 1.2, 0.03, '#b8a27a', { ink: 0 }).add(GG.sphere, 0, -0.1, 0, 0.5, 0.65, 0.5, '#9a8466', { ink: 0.014 }); sk.build(sb); room.bag = sb;
    room.masks = [-3.6, 0, 3.6].map(dx => mask(g, R.x + dx, Y0 + 5.1, R.z - R.hd + 0.7, 0.8));
    room.hatch = { x: R.x + 5.0, z: R.z + 3.6 };
    const hg = grp(g, room.hatch.x, Y0 + 0.03, room.hatch.z), hk = Kit(); hk.box(0, 0, 0, 1.6, 0.06, 1.4, '#5a4232', { ink: 0.01 }).box(0, 0.04, 0, 1.2, 0.02, 0.08, '#3a3036', { ink: 0 }); hk.build(hg); room.hatchG = hg;
    WORLD.addSolids([{ obox: 1, x: room.lever.x, z: room.lever.z, hw: 0.35, hd: 0.3, rot: 0 }]);
    room.tadeo = { x: room.lever.x + 1.1, z: room.lever.z + 0.9, yaw: -2.2 };
    room.trapAt = { x: room.lever.x + 1.4, z: room.lever.z + 2.2 };
  }
  // 3 · the stage: the boards (you stand on them), the footlights at the edge, and out there the seats rising row on row, gray, a
  // laughing mask over them (the Gallery). Elio's red cap still lies by the music stand. After the fight, red velvet.
  function buildStage(room) {
    const R = room.R, g = room.g, GG = KG(), edge = R.z + 0.4;
    const k = Kit();
    k.box(R.x, Y0 - 0.25, R.z - 2.8, R.hw * 2, 0.5, 6.2, '#2a2228', { ink: 0 });                                                              // the dark stalls below the stage
    k.box(R.x, Y0 + 0.02, edge + 0.05, R.hw * 2 - 0.2, 0.06, 0.14, '#e8b83e', { ink: 0 });                                                   // the stage's gilded edge
    for (let i = -3; i <= 3; i++) k.add(GG.cyl, R.x + i * 1.9, Y0 + 0.1, edge + 0.35, 0.2, 0.2, 0.2, '#3b2a22', { ink: 0.006 });             // footlight hoods
    k.box(R.x, Y0 + R.wh - 0.5, edge, R.hw * 2, 0.9, 0.3, '#9a2a30', { ink: 0.012 }).box(R.x, Y0 + R.wh - 1.0, edge + 0.12, R.hw * 2, 0.12, 0.1, '#e8b83e', { ink: 0 });     // the valance
    for (const s of [-1, 1]) k.box(R.x + s * (R.hw - 0.5), Y0 + R.wh / 2, edge + 0.3, 0.9, R.wh, 0.4, '#9a2a30', { ink: 0.012 });          // the side drapes
    k.add(GG.cyl6, R.x + 0.4, Y0 + 0.62, R.z + 1.9, 0.035, 1.24, 0.035, '#2f3440', { ink: 0.004 }).box(R.x + 0.4, Y0 + 1.3, R.z + 1.93, 0.6, 0.42, 0.03, '#2f3440', { rx: -0.45, ink: 0.006 });   // the music stand
    k.build(g);
    // the seats, gray (and their red twin for after): four rows rising toward the back wall
    const seatK = (col, back) => { const kk = Kit(); for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) { const x = R.x - 5.6 + c * 1.4, z = R.z - 0.8 - r * 1.3, y = Y0 - 0.3 + r * 0.5; kk.box(x, y + 0.42, z, 1.0, 0.16, 0.8, col, { ink: 0.008 }).box(x, y + 0.8, z - 0.38, 1.0, 0.7, 0.12, back, { ink: 0.008 }); if (r) kk.box(x, y - 0.02, z, 1.4, 0.5, 1.3, '#2a2228', { ink: 0 }); } return kk; };
    room.grayG = grp(g, 0, 0, 0); seatK('#8d8aa0', '#7a7790').build(room.grayG);
    room.redG = grp(g, 0, 0, 0); seatK('#a82a35', '#8a2028').build(room.redG); room.redG.visible = false;
    // the Gallery's masks, over the seats (one mesh: every quad merged, one draw)
    const quads = [];
    [[-4.2, 0, 1.6], [-1.4, 1, 1.9], [1.4, 0, 1.7], [4.2, 1, 1.8], [-2.8, 2, 2.1], [2.8, 2, 2.2], [0, 3, 2.4], [-5.2, 3, 2.3], [5.2, 3, 2.3]].forEach(([dx, r, h]) => { const pg = new THREE.PlaneGeometry(0.78, 0.86); pg.translate(R.x + dx, Y0 - 0.3 + r * 0.5 + h, R.z - 0.8 - r * 1.3); quads.push(pg); });
    const mg = new THREE.BufferGeometry(), parts = quads.map(q => q.toNonIndexed());
    ['position', 'uv'].forEach(a => { const n = parts.reduce((s, p) => s + p.attributes[a].array.length, 0), arr = new Float32Array(n); let o = 0; parts.forEach(p => { arr.set(p.attributes[a].array, o); o += p.attributes[a].array.length; }); mg.setAttribute(a, new THREE.BufferAttribute(arr, a === 'uv' ? 2 : 3)); });
    room.maskMesh = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ map: U.laughFace(), transparent: true, side: THREE.DoubleSide })); g.add(room.maskMesh);
    // Elio's red cap, by the music stand (it's been there for forty years), and a light for when his words come back
    room.cap = { x: R.x + 1.1, z: R.z + 2.3 };
    const cg = grp(g, room.cap.x, Y0, room.cap.z), ck = Kit(); ck.add(GG.half, 0, 0, 0, 0.16, 0.12, 0.16, '#c9443a', { ink: 0.006 }).box(0, 0.01, 0.19, 0.2, 0.02, 0.15, '#c9443a', { ink: 0 }); ck.build(cg); cg.rotation.y = 0.5;
    room.capGlow = U.glow('#fff1c8', 2.6, 0); room.capGlow.position.set(room.cap.x, Y0 + 0.6, room.cap.z); g.add(room.capGlow);
    room.foot = [-3, -1, 1, 3].map(i => { const s = U.glow('#ffd28a', 1.4, 0.45); s.position.set(R.x + i * 1.9, Y0 + 0.35, edge + 0.3); g.add(s); return s; });
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - 2.8, hw: R.hw, hd: 3.2, rot: 0 }, { x: R.x + 0.4, z: R.z + 1.9, r: 0.25 }]);
    room.tadeo = { x: R.x - 3.4, z: R.z + 3.4, yaw: Math.PI - 0.5 };
    room.face = { x: R.x, z: R.z + 1.5 };
    room.festG = null;
  }
  // 4 · the bakery tomorrow: the counter and its glass case, shelves of loaves, the sun-powered oven, flour sacks with the cat on
  // them, a little table by the window, the chalkboard, young Marta's photo. Nilo behind the counter.
  function buildBakery(room) {
    const R = room.R, g = room.g, k = Kit(), GG = KG();
    k.box(R.x - 0.4, Y0 + 0.45, R.z - 1.2, 4.6, 0.9, 0.9, '#8a5f3e', { ink: 0.014 }).box(R.x - 0.4, Y0 + 0.94, R.z - 1.2, 4.8, 0.08, 1.0, '#e8d4b0', { ink: 0.008 });
    k.box(R.x - 1.4, Y0 + 1.2, R.z - 1.2, 1.8, 0.45, 0.7, '#cfe4f0', { ink: 0.008 });
    for (let i = 0; i < 6; i++) k.add(GG.sphere, R.x - 2.1 + i * 0.28, Y0 + 1.06, R.z - 1.2 + (i % 2) * 0.16, 0.11, 0.07, 0.11, ['#e8a04a', '#c9783a', '#f2c879', '#ff9fbf'][i % 4], { ink: 0.004 });
    for (let s = 0; s < 3; s++) { k.box(R.x, Y0 + 1.0 + s * 0.85, R.z - R.hd + 0.35, 6.4, 0.08, 0.5, '#6b4a30', { ink: 0.008 }); for (let i = 0; i < 9; i++) k.add(GG.sphere, R.x - 2.9 + i * 0.72, Y0 + 1.16 + s * 0.85, R.z - R.hd + 0.38, 0.28, 0.14, 0.18, ['#d8963a', '#c47a30', '#e8b86a'][(i + s) % 3], { ink: 0.006 }); }
    room.oven = { x: R.x - R.hw + 0.9, z: R.z - 1.4 };
    k.add(GG.half, room.oven.x, Y0, room.oven.z, 1.0, 1.4, 1.0, '#c98a5a', { ink: 0.014 }).box(room.oven.x + 0.75, Y0 + 0.55, room.oven.z, 0.3, 0.55, 0.7, '#2b2235', { ink: 0.006 });
    k.box(room.oven.x - 0.2, Y0 + 2.1, room.oven.z, 0.35, 1.4, 0.35, '#a86f44', { ink: 0.01 });
    room.sacks = { x: R.x + R.hw - 0.9, z: R.z - R.hd + 1.1 };
    for (const [dx, dz, h] of [[0, 0, 0.7], [-0.7, 0.2, 0.6], [-0.3, 0.7, 0.5]]) k.add(GG.sphere, room.sacks.x + dx, Y0 + h / 2, room.sacks.z + dz, 0.38, h / 2 + 0.06, 0.32, '#e8dcc0', { ink: 0.01 });
    room.table = { x: R.x + 3.0, z: R.z + 1.7 };
    k.add(GG.cyl, room.table.x, Y0 + 0.75, room.table.z, 0.6, 0.06, 0.6, '#b88a5a', { ink: 0.01 }).add(GG.cyl6, room.table.x, Y0 + 0.37, room.table.z, 0.06, 0.74, 0.06, '#6b4a30', { ink: 0 });
    for (const s of [-1, 1]) k.box(room.table.x + s * 0.9, Y0 + 0.45, room.table.z, 0.45, 0.08, 0.45, '#8a5f3e', { ink: 0.008 }).box(room.table.x + s * 1.1, Y0 + 0.75, room.table.z, 0.06, 0.6, 0.45, '#8a5f3e', { ink: 0.008 });
    k.build(g);
    catModel(g, room.sacks.x - 0.1, Y0 + 0.66, room.sacks.z + 0.05);
    room.chalk = { x: R.x + R.hw - 0.05, z: R.z - 0.3 };
    const cb = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), new THREE.MeshLambertMaterial({ color: '#ffffff' })); cb.position.set(room.chalk.x, Y0 + 1.7, room.chalk.z); cb.rotation.y = -Math.PI / 2; g.add(cb); room.chalkM = cb;
    room.photo = { x: R.x - 2.6, z: R.z - R.hd + 0.05 };
    const ph = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.75), new THREE.MeshLambertMaterial({ map: TK.canvasTex(96, 120, c => { c.fillStyle = '#d8c39a'; c.fillRect(0, 0, 96, 120); c.fillStyle = '#6b4a30'; c.fillRect(0, 0, 96, 6); c.fillRect(0, 114, 96, 6); c.fillStyle = '#e6b48c'; c.beginPath(); c.arc(48, 46, 18, 0, TAU); c.fill(); c.fillStyle = '#5a3a26'; c.beginPath(); c.arc(48, 38, 19, Math.PI, 0); c.fill(); c.fillStyle = '#f2e6d0'; c.fillRect(26, 66, 44, 40); c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(56, 50, 4, 0, TAU); c.fill(); }) }));
    ph.position.set(room.photo.x, Y0 + 2.9, room.photo.z); g.add(ph);
    const glowO = U.glow('#ffb86a', 1.6, 0.6); glowO.position.set(room.oven.x + 0.95, Y0 + 0.6, room.oven.z); g.add(glowO); room.ovenGlow = glowO;
    WORLD.addSolids([{ obox: 1, x: R.x - 0.4, z: R.z - 1.2, hw: 2.4, hd: 0.5, rot: 0 }, { x: room.oven.x, z: room.oven.z, r: 1.05 }, { x: room.sacks.x - 0.3, z: room.sacks.z + 0.3, r: 0.75 }, { x: room.table.x, z: room.table.z, r: 0.75 }]);
    ppl.nilo = hallPerson('nilo', LOOK.nilo, { x: R.x - 0.6, z: R.z - 2.2, yaw: 0 }, g);
    room.arrive = { x: R.x - 2.6, z: R.z + 2.8, yaw: Math.PI };
  }
  // 5 · the new library: bookcases, a reading table with a lamp, a globe, the guest book on its lectern, the window seat (Sami),
  // Luci's desk
  function buildLibrary(room) {
    const R = room.R, g = room.g, k = Kit(), GG = KG(), BOOK = ['#c9443a', '#3f7fc9', '#5fae4f', '#e8b83e', '#8a5ab0', '#e0743c', '#2f8f8a', '#f4efe4'];
    const shelf = (x, z, w, ry) => { k.at(x, Y0, z, ry); k.box(0, 1.25, 0, w, 2.5, 0.5, '#6b4a30', { ink: 0.014 }); for (let s = 0; s < 4; s++) for (let i = 0; i < Math.floor(w / 0.16); i++) k.box(-w / 2 + 0.12 + i * 0.16, 0.42 + s * 0.6, 0.12, 0.12, 0.42 + ((i * 7 + s) % 4) * 0.03, 0.3, BOOK[(i * 3 + s * 5) % BOOK.length], { ink: 0 }); k.free(); };
    shelf(R.x - 2.6, R.z - R.hd + 0.3, 3.2, 0); shelf(R.x + 1.8, R.z - R.hd + 0.3, 3.2, 0); shelf(R.x + R.hw - 0.3, R.z + 0.4, 2.6, -Math.PI / 2);
    room.table = { x: R.x - 0.4, z: R.z + 0.6 };
    k.box(room.table.x, Y0 + 0.75, room.table.z, 2.4, 0.08, 1.1, '#b88a5a', { ink: 0.01 });
    for (const [dx, dz] of [[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]]) k.add(GG.cyl6, room.table.x + dx, Y0 + 0.37, room.table.z + dz, 0.05, 0.74, 0.05, '#6b4a30', { ink: 0 });
    k.add(GG.cyl6, room.table.x + 0.7, Y0 + 1.0, room.table.z - 0.2, 0.03, 0.5, 0.03, '#2f3440', { ink: 0 }).add(GG.cone, room.table.x + 0.7, Y0 + 1.3, room.table.z - 0.2, 0.2, 0.18, 0.2, '#5fae4f', { ink: 0.006 });
    for (let i = 0; i < 3; i++) k.box(room.table.x - 0.6 + i * 0.3, Y0 + 0.82, room.table.z + 0.1, 0.22, 0.05, 0.3, BOOK[i + 2], { ry: i * 0.4, ink: 0 });
    room.globe = { x: R.x - 3.9, z: R.z + 1.9 };
    k.add(GG.cyl6, room.globe.x, Y0 + 0.45, room.globe.z, 0.05, 0.9, 0.05, '#6b4a30', { ink: 0 }).add(GG.sphere, room.globe.x, Y0 + 1.05, room.globe.z, 0.32, 0.32, 0.32, '#4f9ad8', { ink: 0.008 }).add(GG.sphere, room.globe.x + 0.1, Y0 + 1.12, room.globe.z + 0.2, 0.14, 0.12, 0.1, '#5fae4f', { ink: 0 });
    room.lectern = { x: R.x + 3.4, z: R.z + 2.0 };
    k.box(room.lectern.x, Y0 + 0.55, room.lectern.z, 0.5, 1.1, 0.4, '#6b4a30', { ink: 0.01 }).box(room.lectern.x, Y0 + 1.16, room.lectern.z, 0.7, 0.06, 0.55, '#8a5f3e', { rx: 0.35, ink: 0.008 }).box(room.lectern.x, Y0 + 1.22, room.lectern.z + 0.02, 0.6, 0.04, 0.42, '#fdf8ee', { rx: 0.35, ink: 0 });
    room.seat = { x: R.x - R.hw + 0.7, z: R.z - 1.4 };
    k.box(room.seat.x, Y0 + 0.25, room.seat.z, 0.9, 0.5, 1.8, '#8a5f3e', { ink: 0.01 }).box(room.seat.x + 0.05, Y0 + 0.55, room.seat.z, 0.8, 0.12, 1.7, '#c9443a', { ink: 0.006 });
    room.desk = { x: R.x + 1.4, z: R.z - 2.2 };
    k.box(room.desk.x, Y0 + 0.45, room.desk.z, 2.0, 0.9, 0.8, '#8a5f3e', { ink: 0.012 }).box(room.desk.x + 0.5, Y0 + 0.96, room.desk.z, 0.3, 0.12, 0.3, '#c9443a', { ink: 0.004 });
    k.add(GG.cyl, R.x - 0.2, Y0 + 0.012, R.z + 0.6, 2.6, 0.02, 1.8, '#d97a5a', { ink: 0 });
    k.build(g);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.2), new THREE.MeshBasicMaterial({ map: TK.canvasTex(128, 110, c => { const s = c.createLinearGradient(0, 0, 0, 110); s.addColorStop(0, '#9ad1f0'); s.addColorStop(1, '#e8f4ff'); c.fillStyle = s; c.fillRect(0, 0, 128, 110); c.fillStyle = '#7fbf6a'; c.fillRect(0, 80, 128, 30); c.strokeStyle = '#f4efe4'; c.lineWidth = 6; c.strokeRect(0, 0, 128, 110); c.beginPath(); c.moveTo(64, 0); c.lineTo(64, 110); c.moveTo(0, 55); c.lineTo(128, 55); c.stroke(); }) }));
    win.position.set(R.x - R.hw + 0.03, Y0 + 1.6, room.seat.z); win.rotation.y = Math.PI / 2; g.add(win);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.5), new THREE.MeshLambertMaterial({ color: '#ffffff' })); sign.position.set(R.x - 0.4, Y0 + 3.3, R.z - R.hd + 0.06); g.add(sign); room.signM = sign;
    WORLD.addSolids([{ obox: 1, x: R.x - 2.6, z: R.z - R.hd + 0.3, hw: 1.7, hd: 0.35, rot: 0 }, { obox: 1, x: R.x + 1.8, z: R.z - R.hd + 0.3, hw: 1.7, hd: 0.35, rot: 0 }, { obox: 1, x: R.x + R.hw - 0.3, z: R.z + 0.4, hw: 0.35, hd: 1.4, rot: 0 },
      { obox: 1, x: room.table.x, z: room.table.z, hw: 1.3, hd: 0.65, rot: 0 }, { x: room.globe.x, z: room.globe.z, r: 0.4 }, { x: room.lectern.x, z: room.lectern.z, r: 0.42 }, { obox: 1, x: room.seat.x, z: room.seat.z, hw: 0.5, hd: 0.95, rot: 0 }, { obox: 1, x: room.desk.x, z: room.desk.z, hw: 1.05, hd: 0.45, rot: 0 }]);
    ppl.luci = hallPerson('luci', LOOK.luci, { x: room.desk.x - 0.2, z: room.desk.z - 0.75, yaw: 0 }, g);
    ppl.sami = hallPerson('sami', LOOK.sami, { x: room.seat.x + 0.05, z: room.seat.z, yaw: Math.PI / 2 }, g, Y0 + 0.62);
    room.arrive = { x: R.x - 2.6, z: R.z + 2.8, yaw: Math.PI };
  }
  // the rooms as the save says (after a load, or the first time they're built)
  function applyState() {
    const s = S(), r0 = rooms[0], r1 = rooms[1], r2 = rooms[2], r3 = rooms[3]; if (!r0) return;
    const n = s.foyerN || 0;
    r0.masks.forEach((m, i) => { const gone = n > i; m.visible = !gone; });
    if (n >= 3) { r0.chandelier.position.set(r0.R.x - 4.6, Y0, r0.R.z - 1.2); r0.chandelier.rotation.set(0, 1.4, 0.1); Object.assign(r0.chSolid, { x: r0.R.x - 4.6, z: r0.R.z - 1.2, rot: 1.4 }); }
    r1.boxes.forEach((b, i) => { b.m.visible = !(s.balcDone && s.balcDone[i]); });
    r1.cloth.visible = !F('af.balc');
    const ln = s.loftN || 0;
    r2.masks.forEach(m => { m.visible = ln < 1; }); r2.leverG.rotation.x = ln >= 1 ? 0.6 : -0.5; r2.bag.position.y = ln >= 1 ? Y0 + 1.0 : Y0 + 4.2; r2.bag.rotation.z = 0;
    r2.hatchG.rotation.z = F('af.loft') ? -1.7 : 0;
    const won = F('af.boss'); r3.grayG.visible = !won; r3.redG.visible = won; r3.maskMesh.visible = !won;
  }

  // ------------------------------------------------------------ moving between rooms, in and out
  const isTheater = i => i >= 0 && i <= 3;
  function teleport(x, z, yaw) {
    const Y = G().sim.you, M = G().sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + 1.1; M.z = z + 0.8; M.hidden = false; M.wander = null; M.station = null; M.look = null; G().sim.snap();
  }
  function setLook(i) {
    const won = F('af.boss');
    G().w3d.setInterior(isTheater(i) ? (won || festOn ? { fog: '#2a1d24', near: 18, far: 46 } : { fog: '#3a3442', near: 13, far: 38 }) : { fog: '#f1e2c4', near: 16, far: 44 });
  }
  function placeTadeo(i) {
    if (!TAD) return;
    const room = rooms[i], on = isTheater(i) && !!room.tadeo && !(i === 3 && F('af.echoTold')) && !festOn;
    TAD.group.visible = on; TAD.g.visible = on; if (!on) return;
    const a = room.tadeo; TAD.api.x = a.x; TAD.api.z = a.z; TAD.api.y = Y0; TAD.api.yaw = a.yaw; TAD.g.position.set(a.x, Y0, a.z); TAD.g.rotation.y = a.yaw; TAD.api.name = U.nameOf('tadeo');
  }
  function show(i) { rooms.forEach((r, k) => { r.g.visible = k === i; }); cur = i; setLook(i); placeTadeo(i); }
  function hideAll() { rooms.forEach(r => { r.g.visible = false; }); cur = -1; if (TAD) TAD.group.visible = false; }
  const arriveAt = (i, from) => {
    const room = rooms[i], R = room.R;
    if (room.arrive) return room.arrive;
    if (from === 'above' && i === 0) return { x: R.x, z: R.z + 1.2, yaw: Math.PI };
    if (from === 'above' && i === 1) return { x: room.ladder.x - 1.0, z: room.ladder.z + 1.4, yaw: Math.PI };
    if (from === 'above' && i === 2) return { x: room.hatch.x - 1.2, z: room.hatch.z - 0.4, yaw: Math.PI };
    if (i === 3) return { x: R.x + 4.6, z: R.z + 4.2, yaw: Math.PI };
    return { x: R.x - R.hw + 2.2, z: R.z + R.hd - 1.6, yaw: Math.PI };
  };
  // which: a room's number or id. From tomorrow's streets: the theater's doors (0), the bakery's, the library's
  async function enter(which) {
    const i = typeof which === 'number' ? which : ROOMS.findIndex(r => r.id === which); if (i < 0 || entering) return;
    entering = true;
    try {
      build();
      const Y = G().sim.you; back = { x: Y.x, z: Y.z, yaw: Y.yaw + Math.PI };
      await UI.fade(1, 420);
      inside = true; show(i); const a = arriveAt(i); teleport(a.x, a.z, a.yaw); G().cam.snap(Math.PI, isTheater(i) ? 0.66 : 0.62, isTheater(i) ? 10.5 : 8.8);
      await UI.fade(0, 420);
      await firstVisit(i);
      G().save();
    } finally { entering = false; }
  }
  async function leave() {
    await UI.fade(1, 420);
    hideAll(); inside = false; G().w3d.setInterior(null);
    const b = back || { x: -13.5, z: -231.6, yaw: Math.PI };
    teleport(b.x, b.z, b.yaw); G().cam.snap(b.yaw, 0.28, 8.5);
    await UI.fade(0, 420);
    G().save();
  }
  async function go(i, from) {
    await UI.fade(1, 360);
    show(i); const a = arriveAt(i, from); teleport(a.x, a.z, a.yaw); G().cam.snap(Math.PI, 0.66, 10.5);
    await UI.fade(0, 360);
    await firstVisit(i);
    G().save();
  }
  async function firstVisit(i) {
    const s = S(), R = ROOMS[i], seen = s.seen || (s.seen = {});
    if (seen[R.id]) return;
    seen[R.id] = true;
    await UI.chapter(R.name, R.sub);
    U.lock(true);
    try {
      if (i === 0) { await U.say(TAD.api, 'h.foyer1'); await U.demo(TAD.api, 'd.foyer'); }
      if (i === 1) { await U.say(TAD.api, 'h.balc1'); await U.demo(TAD.api, 'd.balc'); }
      if (i === 2) { await U.say(TAD.api, 'h.loft1'); await U.demo(TAD.api, 'd.loft'); }
      if (i === 3 && !F('af.boss')) { await U.say(TAD.api, 'h.stage1'); await U.say(TAD.api, 'h.stage2'); }
      if (i === 4) { await U.sayT(ppl.nilo.api, X.CHAT.nilo[0]); setF('af.breadAsked'); }
      if (i === 5) { await U.sayT(ppl.luci.api, X.CHAT.luci[0]); setF('af.samiAsked'); setF('af.bookAsked'); STORY.think('Someone small is hiding in the window seat, behind a book…', 4.5); }
    } finally { U.lock(false); }
  }

  // ------------------------------------------------------------ 0 · the foyer: plans land after the masks' turn
  async function laughWave(masks, room) {
    const l = lang(), Y = G().sim.you;
    for (const m of masks) if (m.visible) { const p = m.getWorldPosition(new THREE.Vector3()); floatText(HA[l] || HA.en, p.x, p.y + 0.4, p.z); m.userData.laugh = 1; }
    laughSfx(3, 1.0); G().sim.mimo.scared = 1.6; snd('swoosh');
    const z0 = Y.z; await tween(0.5, k => { Y.z = z0 + Math.sin(k * Math.PI) * 0.5; });
    await wait(0.35);
  }
  async function hopTo(x, z, h = 2.6) { const M = G().sim.mimo; M.station = null; M.hop = { x0: M.x, z0: M.z, x1: x, z1: z, y0: M.y, y1: M.y, t: 0, dur: 0.55, h }; await wait(0.6); }
  async function crackMask(m) {
    m.material = m.material.clone(); m.material.map = crackedFace(); m.material.needsUpdate = true; snd('crack');
    const p = m.getWorldPosition(new THREE.Vector3()); G().w3d.fx.sparkle(p.x, p.y, p.z, 16, ['#e9e6ef', '#fff3a0']);
    const y0 = m.position.y; await tween(0.6, k => { m.position.y = y0 - k * k * 3.2; m.rotation.z = k * 1.4; });
    m.visible = false; m.position.y = y0; m.rotation.z = 0;
  }
  async function foyerTask() {
    const s = S(), room = rooms[0], R = room.R, i = s.foyerN || 0; if (i >= 3) return;
    if (i === 2 && !s.foyerTold) { U.lock(true); try { await U.say(TAD.api, 'h.foyer2'); } finally { U.lock(false); } s.foyerTold = true; }
    const r = await U.ask(['f.jump', 'f.hit', 'f.push'][i], { icon: 'star' }); if (!r) return;
    TIME.grade('af.foyer.' + i, r.letter);
    U.lock(true);
    try {
      U.shot(V(R.x + 3.0, Y0 + 3.4, R.z + 5.4), V(R.x, Y0 + 2.0, R.z - 2.0), 0.7);
      UI.toast('A plan! It lands after the masks’ turn…');
      await laughWave(room.masks.filter(m => m.visible), room);           // (their turn first…)
      if (i < 2) { const m = room.masks[i], p = m.getWorldPosition(new THREE.Vector3()); await hopTo(p.x, R.z - 1.4, 3.4); await crackMask(m); }
      else {                                                                // (…then the plan lands)
        const ch = room.chandelier; G().sim.mimoGo({ x: R.x + 1.4, z: R.z + 0.2 }, { x: R.x, z: R.z - 0.7 }); await wait(0.7);
        snd('wood'); const x0 = ch.position.x, z0 = ch.position.z, r0 = ch.rotation.y;
        await tween(1.0, k => { ch.position.x = lerp(x0, R.x - 4.6, k); ch.position.z = lerp(z0, R.z - 1.2, k); ch.rotation.y = lerp(r0, 1.4, k); });
        Object.assign(room.chSolid, { x: R.x - 4.6, z: R.z - 1.2, rot: 1.4 }); G().w3d.fx.puff(R.x - 4.6, Y0 + 0.2, R.z - 1.2, 10, 0.3, '#c9c0b0'); G().sim.mimoGo(null, null);
      }
      s.foyerN = i + 1; G().sim.mimo.scared = 0;
      if (s.foyerN >= 3) { setF('af.foyer'); solved(); await U.say(TAD.api, 'h.foyer3'); }
      G().save();
    } finally { U.lock(false); }
  }
  // ------------------------------------------------------------ 1 · the balconies: a mask shows where it'll laugh from; say it first
  async function balcTask() {
    const s = S(), room = rooms[1], R = room.R, done = s.balcDone || (s.balcDone = {}), left = [0, 1, 2].filter(i => !done[i]); if (!left.length) return;
    const i = left[Math.floor(Math.random() * left.length)], dir = Math.random() < 0.5 ? 'up' : 'down', b = room.boxes[i], m = b.m, y0 = m.userData.home.y;
    U.lock(true);
    try {
      U.shot(V(b.x + 1.2, Y0 + 2.6, R.z + 4.6), V(b.x, Y0 + 2.8, b.z), 0.6); await wait(0.5);
      snd('tick'); await tween(0.45, k => { m.position.y = y0 + (dir === 'up' ? 0.7 : -0.6) * k; m.scale.set(1 + (dir === 'down' ? 0.25 : -0.1) * k, 1 + (dir === 'up' ? 0.25 : -0.3) * k, 1); });
      if (!s.balcHinted) { s.balcHinted = true; STORY.think(dir === 'up' ? 'It rose up high… where will it laugh from?' : 'It ducked down low… where will it laugh from?', 4); }
    } finally { U.lock(false); }
    const r = await U.ask('b.pred', { icon: 'star', dir });
    const reset = () => { m.position.y = y0; m.scale.set(1, 1, 1); };
    if (!r) { reset(); return; }
    U.lock(true);
    try {
      const p = m.getWorldPosition(new THREE.Vector3());
      laughSfx(2, 1.1); floatText(HA[lang()] || HA.en, p.x, p.y + 0.3, p.z);
      if (r.g && r.g.wrongDir) {
        G().sim.mimo.scared = 2; snd('wrong'); const Y = G().sim.you, z0 = Y.z; await tween(0.5, k => { Y.z = z0 + Math.sin(k * Math.PI) * 0.7; });
        STORY.think('The laugh came from the other side… watch which way it moves, then say it.', 4.5); reset();
      } else {
        TIME.grade('af.balc.' + i, r.letter);
        UI.toast(X.FIGHT.knew.en); G().w3d.fx.sparkle(p.x, p.y, p.z, 14, ['#7ff7ea', '#fff3a0']);
        await crackMask(m); reset(); done[i] = true;
        if ([0, 1, 2].every(k => done[k])) {
          setF('af.balc'); solved(); await tween(0.8, k => { room.cloth.material.opacity = 0.85 * (1 - k); }); room.cloth.visible = false; room.cloth.material.opacity = 0.85;
          await U.say(TAD.api, 'h.balc2');
        }
      }
      G().sim.mimo.scared = 0; G().save();
    } finally { U.lock(false); }
  }
  // ------------------------------------------------------------ 2 · the fly loft: set the trap, then the lever (it springs)
  async function loftTask() {
    const s = S(), room = rooms[2], R = room.R, n = s.loftN || 0; if (n >= 2) return;
    if (n === 1 && !s.loftTold2) { U.lock(true); try { await U.say(TAD.api, 'h.loft2'); } finally { U.lock(false); } s.loftTold2 = true; }
    const r = await U.ask(n === 0 ? 'l.trap1' : 'l.trap2', { icon: 'star' }); if (!r) return;
    TIME.grade('af.loft.' + n, r.letter);
    U.lock(true);
    try {
      U.shot(V(R.x + 2.0, Y0 + 3.6, R.z + 5.6), V(R.x - 0.6, Y0 + 2.4, R.z - 1.4), 0.7);
      UI.toast(X.FIGHT.trap.en); await wait(0.6);
      const M = G().sim.mimo;
      if (n === 0) {
        snd('wood'); await tween(0.4, k => { room.leverG.rotation.x = lerp(-0.5, 0.6, k); });                   // Tadeo pulls the lever: the bag drops
        await tween(0.5, k => { room.bag.position.y = lerp(Y0 + 4.2, Y0 + 1.0, k * k); }); snd('land', 14);
        laughSfx(4, 1.1);                                                                                      // the masks swoop down… the trap springs
        for (const m of room.masks) { const y0 = m.position.y; tween(0.5, k => { m.position.y = y0 - k * 2.6; m.position.z = m.userData.home.z + k * 3.2; }); }
        await wait(0.35); G().sim.mimoSay(plainT(X.FIGHT.sprung[lang()] || X.FIGHT.sprung.en), 1.4); snd('crack');
        await hopTo(R.x, R.z - 1.2, 3.6); for (const m of room.masks) { const p = m.getWorldPosition(new THREE.Vector3()); G().w3d.fx.sparkle(p.x, p.y, p.z, 12, ['#ffb347', '#fff3a0']); m.visible = false; m.position.copy(m.userData.home); }
      } else {
        await tween(0.7, k => { room.bag.position.y = lerp(Y0 + 1.0, Y0 + 2.4, k); room.bag.position.x = lerp(R.x + 0.6, R.x - 2.0, k); room.bag.rotation.z = -0.6 * k; }); snd('swoosh');
        G().sim.mimoSay(plainT(X.FIGHT.sprung[lang()] || X.FIGHT.sprung.en), 1.4);
        await hopTo(R.x - 1.4, R.z + 0.2, 1.4); snd('land', 16); G().w3d.fx.puff(R.x - 1.8, Y0 + 2.2, R.z - 0.4, 10, 0.3, '#c9b896');
        await tween(0.6, k => { room.bag.position.x = lerp(R.x - 2.0, R.x + 0.6, k); room.bag.position.y = lerp(Y0 + 2.4, Y0 + 1.0, k); room.bag.rotation.z = -0.6 * (1 - k); });
      }
      s.loftN = n + 1; M.scared = 0;
      if (s.loftN >= 2) { setF('af.loft'); solved(); snd('wood'); await tween(0.6, k => { room.hatchG.rotation.z = -1.7 * k; }); await U.say(TAD.api, 'h.loft3'); }
      G().save();
    } finally { U.lock(false); }
  }
  // ------------------------------------------------------------ 3 · the stage: the Laughing Gallery, then Elio's echo
  async function faceGallery() {
    const s = S();
    if (!s.stageTold) { U.lock(true); try { await U.say(TAD.api, 'h.stage2'); } finally { U.lock(false); } s.stageTold = true; }
    const B = typeof ALBA_FUT_BOSS !== 'undefined' ? ALBA_FUT_BOSS : null;
    const r = B && B.fight ? await B.fight() : null;
    if (r && r.outcome === 'win') { TIME.grade('af.gallery', r.letter || 'B'); setF('af.boss'); applyState(); G().save(); await echoScene(r.letter || 'B'); }
    else { U.lock(true); try { await U.say(TAD.api, 'h.lost'); } finally { U.lock(false); } }
  }
  async function echoScene(letter) {
    const room = rooms[3], R = room.R, c = room.cap, l = lang();
    U.lock(true);
    try {
      show(3); applyState();
      U.shot(V(c.x + 2.6, Y0 + 2.2, c.z + 4.6), V(c.x, Y0 + 0.9, c.z), 0.9); await wait(0.6);
      snd('chime'); await tween(1.2, k => { room.capGlow.material.opacity = 0.9 * k; room.capGlow.scale.setScalar(2.6 + k * 1.4); });
      floatText(X.ECHO[l] || X.ECHO.en, c.x, Y0 + 1.8, c.z, { gold: true }); await wait(1.6);
      await U.say(TAD.api, 'e.tadeo');
    } finally { U.lock(false); }
    try { if (typeof CH4 !== 'undefined') await CH4.give('alba', 'future', letter); } catch (e) { console.error('[alba future] echo', e); }
    U.lock(true);
    try { await U.say(TAD.api, 'e.after'); setF('af.echoTold'); placeTadeo(3); G().save(); } finally { U.lock(false); }
    STORY.think('Tadeo ran to fetch Marta. Leave the theater: she’ll be out front.', 5);
  }
  // ------------------------------------------------------------ the Festival of Voices (alba_future.js asks for it, out front)
  const FEST_LOOK = {
    marta: { skin: '#e6b48c', hair: '#c9c4cf', hairdo: 'bun', dress: '#f2e6d0', apron: '#ffffff', h: 1.04, wide: 1.15 },
    tito: { skin: '#8a5a3c', hair: '#d8d4dc', hairdo: 'short', dress: '#c9553f', prop: 'guitar', h: 1.0 },
    nico: { skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'short', dress: '#e0743c', hat: 'cap', hatColor: '#3f7fc9', h: 0.97 },
    rosa: { skin: '#efc29a', hair: '#f6f4fa', hairdo: 'bun', dress: '#8a4f7d', apron: '#fbf6ee', hat: 'straw', glasses: true, h: 0.96, seat: true },
    bruno: { skin: '#c98e62', hair: '#dedbe4', hairdo: 'bald', beard: true, hair2: '#dedbe4', dress: '#3f6f9a', h: 1.12, wide: 1.24, seat: true },
  };
  let FEST = null;
  function festPeople(room) {
    if (FEST) return FEST;
    const R = room.R, g = grp(room.g, 0, 0, 0); g.visible = false;
    const P = (id, look, x, z, yaw, y = Y0) => { const p = hallPerson('fest-' + id, look, { x, z, yaw }, g, y); p.api.name = U.nameOf(id) !== id ? U.nameOf(id) : (id.charAt(0).toUpperCase() + id.slice(1)); return p; };
    const seatY = r => Y0 - 0.3 + r * 0.5 + 0.42;
    const seated = (id, look, c, r) => P(id, Object.assign({}, look, { seat: true }), R.x - 5.6 + c * 1.4, R.z - 0.8 - r * 1.3, 0, seatY(r) + 0.36);
    FEST = { g, on: {
      marta: P('marta', FEST_LOOK.marta, R.x - 0.6, R.z + 2.2, 0),
      tito: P('tito', FEST_LOOK.tito, R.x - 2.4, R.z + 2.0, 0.3),
      nico: P('nico', FEST_LOOK.nico, R.x + 1.8, R.z + 2.0, -0.3),
      sami: P('sami', Object.assign({}, LOOK.sami, { seat: false }), R.x + 0.8, R.z + 2.6, 0),
    }, seats: [seated('beto', U.LOOKS.beto, 2, 0), seated('sofi', U.LOOKS.sofi, 3, 0), seated('luci', LOOK.luci, 5, 0), seated('nilo', LOOK.nilo, 6, 0), seated('tadeo', U.LOOKS.tadeo, 4, 1), seated('rosa', FEST_LOOK.rosa, 2, 1), seated('bruno', FEST_LOOK.bruno, 6, 1)] };
    ['marta', 'tito', 'nico', 'sami'].forEach(id => { FEST.on[id].api.name = id === 'sami' ? U.nameOf('sami') : (typeof CJK !== 'undefined' && isCl(lang()) ? FEST.on[id].api.name : id.charAt(0).toUpperCase() + id.slice(1)); });
    const lights = [-4, -2, 0, 2, 4].map(dx => { const s0 = U.glow('#ffe2a8', 1.6, 0.55); s0.position.set(R.x + dx, Y0 + 5.4, R.z + 0.6); g.add(s0); return s0; });
    FEST.lights = lights;
    return FEST;
  }
  async function festival() {
    build(); const room = rooms[3], R = room.R, P = festPeople(room), on = P.on, l = lang();
    const Y = G().sim.you; back = { x: Y.x, z: Y.z, yaw: Y.yaw };
    await UI.fade(1, 600);
    festOn = true; inside = true; show(3); applyState(); P.g.visible = true; room.capGlow.material.opacity = 0.5;
    teleport(R.x + 4.4, R.z + 4.6, Math.PI);
    const sami = F('af.sami'); on.sami.g.visible = sami;
    U.shot(V(R.x, Y0 + 3.2, R.z + 8.6), V(R.x, Y0 + 1.5, R.z + 0.6), 0.01);
    await wait(0.2); await UI.fade(0, 700);
    U.lock(true);
    try {
      clapSfx(40, 2.2); await wait(1.4);
      U.shot(V(R.x - 0.6, Y0 + 2.2, R.z + 6.0), V(on.marta.api.x, Y0 + 1.3, on.marta.api.z), 0.8);
      await U.say(on.marta.api, 'fe.open');
      U.shot(V(R.x - 2.0, Y0 + 2.0, R.z + 5.6), V(on.tito.api.x, Y0 + 1.2, on.tito.api.z), 0.8);
      await U.say(on.tito.api, 'fe.tito');
      for (let i = 0; i < 8; i++) { const p = [on.tito, on.nico, on.marta][i % 3].api; floatText(i % 2 ? '♫' : '♪', p.x, Y0 + 2.0, p.z, { small: true }); await wait(0.45); }
      if (sami) {
        U.shot(V(on.sami.api.x + 1.4, Y0 + 1.8, on.sami.api.z + 3.4), V(on.sami.api.x, Y0 + 1.0, on.sami.api.z), 0.8);
        await U.say(on.sami.api, 'fe.sami'); clapSfx(50, 2.4); await wait(1.6);
      }
      U.shot(V(R.x, Y0 + 3.6, R.z + 8.0), V(R.x, Y0 + 1.6, R.z - 1.0), 1.0);
      await U.say(on.marta.api, 'fe.all'); clapSfx(60, 2.6);
      for (let i = 0; i < 10; i++) { const s0 = P.seats[i % P.seats.length].api; floatText(i % 2 ? '♪' : '★', s0.x, Y0 + 2.2, s0.z, { small: true }); await wait(0.25); }
      U.shot(V(on.marta.api.x + 1.6, Y0 + 2.0, on.marta.api.z + 3.6), V(on.marta.api.x, Y0 + 1.3, on.marta.api.z), 0.8);
      await U.say(on.marta.api, 'fe.marta2');
    } finally { U.lock(false); }
    await UI.fade(1, 700);
    festOn = false; P.g.visible = false; hideAll(); inside = false; G().w3d.setInterior(null);
    const a = U.ST && AF.AT ? AF.AT.forecourt : { x: -13.5, z: -229.8, yaw: Math.PI };
    teleport(a.x, a.z, a.yaw); G().cam.snap(a.yaw, 0.28, 8.5);
    await UI.fade(0, 700);
  }

  // ------------------------------------------------------------ the library and the bakery: ◆ Sami, ◆ the guest book, ◆ the bread
  async function samiScene() {
    const L0 = ppl.luci.api, Sm = ppl.sami.api;
    if (!F('af.samiDemo')) { U.lock(true); try { U.frame2(L0); await U.say(L0, 'sa.luci1'); U.frame2(Sm, -1); await U.demo(L0, 'd.sami'); setF('af.samiDemo'); } finally { U.lock(false); } }
    if (!S().sami1) {
      const r = await U.ask('sa.t1', { icon: 'star' }); if (!r) return;
      S().sami1 = r.letter; TIME.grade('af.sami1', r.letter);
      U.lock(true); try { U.frame2(Sm, -1); await U.say(Sm, 'sa.r1'); } finally { U.lock(false); }
    }
    const r2 = await U.ask('sa.t2', { icon: 'star' }); if (!r2) return;
    TIME.grade('af.sami2', r2.letter);
    U.lock(true);
    try { U.frame2(Sm, -1); G().w3d.fx.sparkle(Sm.x, Sm.y + 1.0, Sm.z, 16, ['#ffd166', '#fff3a0']); snd('learned'); await U.say(Sm, 'sa.r2'); U.frame2(L0); await U.say(L0, 'sa.luci2'); setF('af.sami'); G().state.coins = (G().state.coins || 0) + 30; UI.toast('+30 coins'); G().save(); }
    finally { U.lock(false); }
    STORY.think('Sami will be at the Festival of Voices… and Sami will talk.', 5);
  }
  async function bookScene() {
    const L0 = ppl.luci.api, s = S();
    if (!F('af.bookDemo')) {
      U.lock(true); try { U.frame2(L0); await U.say(L0, 'gb.luci1'); } finally { U.lock(false); }
      await AF.readSign('guest');
      U.lock(true); try { U.frame2(L0); await U.demo(L0, 'd.book'); setF('af.bookDemo'); } finally { U.lock(false); }
    }
    const r = await U.ask('gb.you', { icon: 'star' }); if (!r) return;
    s.bookLine = r.text; TIME.grade('af.book', r.letter);
    U.lock(true); try { U.frame2(L0); snd('page'); await U.say(L0, 'gb.luci2'); setF('af.book'); G().state.coins = (G().state.coins || 0) + 20; UI.toast('+20 coins'); G().save(); } finally { U.lock(false); }
  }
  function readGuestBook() {
    const S0 = X.SIGNS.guest, l = lang(), mine = S().bookLine;
    const lines = S0.lines.map(T => ({ text: plainT(T[l] || T.en), en: T.en })).concat(mine ? [{ text: mine, en: '(your line)' }] : []);
    if (typeof SIGNS !== 'undefined' && SIGNS.read) return SIGNS.read({ tag: S0.tag, lines });
    return null;
  }
  async function breadScene() {
    const N0 = ppl.nilo.api, room = rooms[4];
    U.lock(true); try { U.frame2(N0); await U.say(N0, 'br.nilo1'); await U.demo(N0, 'd.bread'); } finally { U.lock(false); }
    const r = await U.ask('br.you', { icon: 'bread' }); if (!r) return;
    TIME.grade('af.bread', r.letter);
    U.lock(true);
    try {
      U.frame2(N0); await U.say(N0, 'br.nilo2');
      const o = room.oven; G().w3d.fx.sparkle(o.x + 0.9, Y0 + 0.8, o.z, 18, ['#ffd166', '#ffb86a']); snd('chest');
      const st = G().state; st.bag = st.bag || {}; st.bag['w.bread'] = (st.bag['w.bread'] || 0) + 1; UI.toast('+1 bread (in your bag)');
      setF('af.bread'); G().save();
      await U.say(N0, 'br.nilo3');
    } finally { U.lock(false); }
  }

  // ------------------------------------------------------------ what you can press E on, room by room (y: the room's floor)
  function interactables() {
    const list = [], s = S(), room = rooms[cur]; if (!inside || !room || festOn) return list;
    const R = room.R, y = Y0, add = (x, z, r, label, run, o) => list.push(Object.assign({ x, z, r, y, label, run }, o || {})), out = { x: R.x - R.hw + 2.2, z: R.z + R.hd - 0.9 };
    if (TAD && TAD.g.visible) add(TAD.api.x, TAD.api.z, 1.8, 'Talk', () => tadeoTalk(), { who: 'future:tadeoIn', p: TAD.api });
    if (cur === 0) {
      add(out.x, out.z, 1.6, 'Leave the theater', leave);
      if ((s.foyerN || 0) < 3) add(room.tell.x, room.tell.z, 2.6, `Tell ${U.nameOf ? (G().state.mimoName || 'Mimo') : 'Mimo'}`, foyerTask);
      else add(R.x, R.z - 1.0, 2.2, 'Up the stairs, to the balconies', () => go(1));
      room.posters.forEach((p, i) => add(p.x + (p.x < R.x ? 0.7 : -0.7), p.z, 1.3, 'Look', async () => STORY.think(['An old poster: the Festival of Voices, forty years ago. «Every voice counts».', 'A poster for the choir, with a red-robed child in the corner.', 'A poster: «Félix Bravo at the piano». The paper is gray with dust.'][i], 5)));
      add(R.x - 5.4, R.z + 4.0, 1.4, 'Look', async () => STORY.think('The box office. A ticket still sits on the counter, for a festival forty years ago.', 4.5));
    }
    if (cur === 1) {
      add(out.x, out.z, 1.6, 'Down to the foyer', () => go(0, 'above'));
      if (!F('af.balc')) add(room.watch.x, room.watch.z, 3.0, 'Watch the boxes', balcTask);
      else add(room.ladder.x - 0.9, room.ladder.z + 1.0, 1.8, 'Climb to the fly loft', () => go(2));
    }
    if (cur === 2) {
      add(out.x, out.z, 1.6, 'Down the ladder', () => go(1, 'above'));
      if (!F('af.loft')) add(room.trapAt.x, room.trapAt.z, 2.4, (s.loftN || 0) ? 'Another trap' : 'Set a trap', loftTask);
      else add(room.hatch.x - 0.9, room.hatch.z - 0.4, 1.9, 'Down to the stage', () => go(3));
    }
    if (cur === 3) {
      add(out.x, out.z, 1.6, F('af.boss') ? 'Leave the theater' : 'Back up to the fly loft', () => (F('af.boss') ? leave() : go(2, 'above')));
      if (!F('af.boss')) add(room.face.x, room.face.z, 2.6, 'Face the Gallery', faceGallery);
      else if (!(typeof CH4 !== 'undefined' && CH4.got('alba', 'future'))) add(room.cap.x, room.cap.z + 0.6, 2.0, 'Listen', () => echoScene(TIME.grade('af.gallery') || 'B'));
      else add(room.cap.x, room.cap.z + 0.6, 1.5, 'Look', async () => STORY.think('Elio’s red cap, by the music stand. Forty years on the stage… and tonight, a festival.', 5));
    }
    if (cur === 4) {
      add(out.x, out.z, 1.6, 'Go out', leave);
      add(ppl.nilo.api.x, ppl.nilo.api.z + 1.3, 1.9, 'Talk', () => U.sayT(ppl.nilo.api, X.CHAT.nilo[(S().niloN = ((S().niloN || 0) + 1)) % X.CHAT.nilo.length]), { who: 'future:nilo', p: ppl.nilo.api });
      add(room.sacks.x - 0.9, room.sacks.z + 1.1, 1.3, 'Pet', async () => { snd('pip'); STORY.think(`${plainT(X.NAMES.cat[lang()] || X.NAMES.cat.en)}, the cat, purrs without waking up. Flour on its ears.`, 4.5); });
      add(room.chalk.x - 0.8, room.chalk.z, 1.4, 'Read', () => AF.readSign('chalk'));
      add(room.photo.x, room.photo.z + 1.0, 1.3, 'Look', async () => STORY.think('A photo: Marta, young, at a festival long ago, flour on her nose. She’s laughing… with everyone, not at anyone.', 5));
      add(room.oven.x + 1.4, room.oven.z, 1.4, 'Look', async () => STORY.think('The oven runs on sunlight now: panels on the bakery’s roof. It smells exactly like before.', 4.5));
    }
    if (cur === 5) {
      add(out.x, out.z, 1.6, 'Go out', leave);
      add(ppl.luci.api.x, ppl.luci.api.z + 1.2, 1.9, 'Talk', () => U.sayT(ppl.luci.api, X.CHAT.luci[(S().luciN = ((S().luciN || 0) + 1)) % X.CHAT.luci.length]), { who: 'future:luci', p: ppl.luci.api });
      add(ppl.sami.api.x + 1.1, ppl.sami.api.z, 1.6, 'Talk', () => U.sayT(ppl.sami.api, F('af.sami') ? X.CHAT.samiBrave[0] : X.CHAT.sami[(S().samiN = ((S().samiN || 0) + 1)) % X.CHAT.sami.length]), { who: 'future:sami', p: ppl.sami.api });
      add(room.lectern.x - 0.9, room.lectern.z, 1.4, 'Read', readGuestBook);
      add(room.globe.x + 0.8, room.globe.z, 1.2, 'Look', async () => STORY.think('A globe, spun so often that Alba’s valley is worn smooth.', 4));
    }
    return list;
  }
  async function tadeoTalk() {
    const key = cur === 0 ? ((S().foyerN || 0) >= 2 ? 'h.foyer2' : 'h.foyer1') : cur === 1 ? 'h.balc1' : cur === 2 ? ((S().loftN || 0) ? 'h.loft2' : 'h.loft1') : F('af.boss') ? 'e.after' : 'h.stage2';
    U.lock(true); try { await U.say(TAD.api, key); } finally { U.lock(false); }
  }
  // where the compass points inside
  function target() {
    const s = S(), room = rooms[cur]; if (!inside || !room) return null;
    const at = (o, hint) => (o ? { x: o.x, z: o.z, hint } : null), R = room.R;
    if (cur === 0) return (s.foyerN || 0) < 3 ? at(room.tell, '{mimo} stares up at the masks over the stairs.') : at({ x: R.x, z: R.z - 1.0 }, '{mimo} points up the stairs!');
    if (cur === 1) return !F('af.balc') ? at(room.watch, '{mimo} watches the boxes. Which mask will move?') : at(room.ladder, '{mimo} points at the rope ladder!');
    if (cur === 2) return !F('af.loft') ? at(room.trapAt, '{mimo} looks up at the masks on the beam.') : at(room.hatch, '{mimo} points down the hatch!');
    if (cur === 3) return !F('af.boss') ? at(room.face, '{mimo}’s ears go flat. The seats are laughing.') : at(room.cap, '{mimo} looks at the light by the music stand.');
    return null;
  }
  // per frame while inside: the masks breathe, the gray tint follows the rooms' progress, Tadeo turns to you
  function update(dt, t) {
    if (!inside || cur < 0) return;
    const g = G(); if (g.sim.lock && !STORY.busy) { g.sim.lock = 0; g.cam.override = null; }
    const room = rooms[cur], Y = g.sim.you;
    let k = 1;
    if (isTheater(cur) && !F('af.boss') && !festOn) k = 0.3 + 0.1 * ['af.foyer', 'af.balc', 'af.loft'].filter(F).length;
    try { if (typeof FUTURE !== 'undefined' && FUTURE._) { FUTURE._.tintOn(true); FUTURE._.tintK(k); } } catch (e) { /* */ }
    g.fx.birds = 0;
    const sway = m => { if (!m.visible) return; m.rotation.z = Math.sin(t * 2.0 + m.position.x) * 0.1 * (1 + (m.userData.laugh || 0) * 3); m.userData.laugh = Math.max(0, (m.userData.laugh || 0) - dt); };
    if (cur === 0) room.masks.forEach(sway);
    if (cur === 1) room.boxes.forEach(b => sway(b.m));
    if (cur === 2) room.masks.forEach(sway);
    if (cur === 3) { room.foot.forEach((s0, i) => { s0.material.opacity = 0.42 + 0.06 * Math.sin(t * 3.1 + i); }); if (room.maskMesh.visible) room.maskMesh.position.y = Math.sin(t * 1.4) * 0.06; if (F('af.boss')) room.capGlow.material.opacity = (CH4.got('alba', 'future') ? 0.35 : 0.8) + 0.12 * Math.sin(t * 2.2);
      if (FEST && FEST.g.visible) FEST.lights.forEach((s0, i) => { s0.material.opacity = 0.5 + 0.15 * Math.sin(t * 2.6 + i); }); }
    if (cur === 4 && room.ovenGlow) room.ovenGlow.material.opacity = 0.5 + 0.12 * Math.sin(t * 3.3);
    if (cur === 4 && room.chalkM && room.chalkKey !== lang()) { room.chalkKey = lang(); room.chalkM.material.map = U.signTex([plainT(X.SIGNS.chalk.lines[0][lang()] || ''), plainT(X.SIGNS.chalk.lines[1][lang()] || '')], { bg: '#2f3a34', ink: '#fffaf0', rim: '#8a5f3e', w: 256, h: 176, fs: 24, fs2: 22 }); room.chalkM.material.needsUpdate = true; }
    if (cur === 5 && room.signM && room.signKey !== lang()) { room.signKey = lang(); room.signM.material.map = U.signTex([plainT(X.NAMES.library[lang()] || X.NAMES.library.en)], { bg: '#3e6f5a', w: 320, h: 90, fs: 34 }); room.signM.material.needsUpdate = true; }
    // the people in here turn to you
    const turn = P => { if (!P || !P.g.visible) return; const a = P.api, near = Math.hypot(Y.x - a.x, Y.z - a.z) < 4.5; P.g.rotation.y = dampAngle(P.g.rotation.y, near || a.talking ? Math.atan2(Y.x - a.x, Y.z - a.z) : a.yaw, 4, dt); P.body.position.y = a.talking ? Math.abs(Math.sin(t * 12 + P.ph)) * 0.05 : 0; };
    if (TAD && TAD.g.visible) turn(TAD);
    if (cur === 4) turn(ppl.nilo);
    if (cur === 5) { turn(ppl.luci); if (ppl.sami.api.talking) ppl.sami.body.position.y = Math.abs(Math.sin(t * 12)) * 0.04; }
  }
  // the music in here: the theater's own song (the festival's, that night); in the bakery and the library, tomorrow's own
  const has = n => typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(n);
  const song = () => (festOn ? (has('past_fest') ? 'past_fest' : null) : isTheater(cur) ? (F('af.boss') ? (has('future') ? 'future' : null) : has('af_theater') ? 'af_theater' : null) : null);

  // ------------------------------------------------------------ Talk menus in here, and the three side quests
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !inside) return null;
    const out = [];
    if (it.who === 'future:luci') { if (!F('af.sami')) out.push({ label: 'Sami', sub: '◆ side quest', run: samiScene }); if (!F('af.book')) out.push({ label: 'The guest book', sub: '◆ side quest', run: bookScene }); }
    if (it.who === 'future:sami' && !F('af.sami')) out.push({ label: 'Tomorrow', sub: '◆ side quest', run: samiScene });
    if (it.who === 'future:nilo' && !F('af.bread')) out.push({ label: 'Bread for the festival', sub: '◆ side quest', run: breadScene });
    return out.length ? out : null;
  });
  if (typeof QUESTS !== 'undefined') {
    const fw = (s, k) => !!(s && s.worlds && s.worlds.flags && s.worlds.flags.future && s.worlds.flags.future[k]);
    const inLib = () => (inside && cur === 5 ? { x: ppl.luci.api.x, z: ppl.luci.api.z, hint: '{mimo} points at Luci, at her desk.' } : U.viaFuture(() => { const d = AF.AT && INTERIORS && INTERIORS.doors ? INTERIORS.doors(G()).find(q => q.id === 'alba-house-12') : null; return d ? { x: d.x, z: d.z, hint: '{mimo} points at the new library’s door.' } : null; }));
    const inBak = () => (inside && cur === 4 ? { x: ppl.nilo.api.x, z: ppl.nilo.api.z + 1.0, hint: '{mimo} points at Nilo, behind the counter.' } : U.viaFuture(() => { const d = INTERIORS && INTERIORS.doors ? INTERIORS.doors(G()).find(q => q.id === 'alba-bakery') : null; return d ? { x: d.x, z: d.z, hint: '{mimo} points at the bakery’s door.' } : null; }));
    const add = q => { if (!QUESTS.LIST.some(x => x.id === q.id)) QUESTS.LIST.push(q); };
    add({ id: 'af.sami', kind: 'side', title: 'Sami’s first words', giver: 'Luci, at the new library (Alba, tomorrow)', started: s => fw(s, 'af.samiAsked'), steps: [
      { text: 'Encourage Sami: tell Sami what will happen tomorrow', why: 'Sami is new in town and hasn’t said a word: at the old school, the other kids laughed. Luci showed you how: «Mañana hablarás con todos».', done: s => fw(s, 'af.sami'), target: inLib, hint: '{mimo} looks at the window seat, where Sami hides.' } ] });
    add({ id: 'af.book', kind: 'side', title: 'The guest book of tomorrow', giver: 'Luci, at the new library (Alba, tomorrow)', started: s => fw(s, 'af.bookAsked'), steps: [
      { text: 'Write your line in the library’s guest book', why: 'Everyone who visits writes one thing they’ll do tomorrow. Read a few first.', done: s => fw(s, 'af.book'), target: inLib, hint: '{mimo} points at the guest book on its lectern.' } ] });
    add({ id: 'af.bread', kind: 'side', title: 'Bread for the festival', giver: 'Nilo, at the bakery (Alba, tomorrow)', started: s => fw(s, 'af.breadAsked'), steps: [
      { text: 'Tell Nilo what you’d like for the festival', why: 'Nilo will bake something special for the Festival of Voices. What would you like? «Me gustaría…»', done: s => fw(s, 'af.bread'), target: inBak, hint: '{mimo} licks its lips. The bakery!' } ] });
  }

  // the minimap's area tab while you're in here (future.js's areaAt asks)
  const area = () => (inside && cur >= 0 ? { id: 'alba-future-' + ROOMS[cur].id, name: isTheater(cur) ? 'The old theater · tomorrow' : cur === 4 ? 'The bakery · tomorrow' : 'The new library · tomorrow', color: isTheater(cur) ? '#6f6b84' : '#a8784e' } : null);
  const api = { init() {}, enter, leave, go, update, interactables, target, song, festival, area, ROOMS,
    _: { rooms, build, applyState, show, foyerTask, balcTask, loftTask, faceGallery, echoScene, samiScene, bookScene, breadScene, festPeople, get TAD() { return TAD; }, ppl, floatText, laughSfx, clapSfx } };
  Object.defineProperties(api, {
    inside: { get: () => inside, configurable: true },
    room: { get: () => cur, configurable: true },
    OUTSIDE: { get: () => back || { x: -13.5, z: -231.6, yaw: Math.PI }, configurable: true },
  });
  return api;
})();
