'use strict';
// The Future («el Mañana»), Chapter 3 (DESIGN.md 13.2, 17.2b; game/REGIONS.md): Alba as it will be if nobody speaks up. Not a
// second Alba: the real one, re-dressed while you're there. It's a room in main.js's sense (FUTURE.inside), so every other
// region, the town's people, town life and the language characters hide themselves, and only the realm's things answer E.
//   The look: the screen drained of color (an overlay's backdrop filter, so battles stay in color), a low gray fog, no birds;
//   weeds in the streets, ivy up the walls, dead leaves, rubble and thorns at the gates (the realm's edge), the dry fountain,
//   the festival's rotten banner, the cracked bell; the townsfolk frozen gray where they stood. Color comes back as you speak
//   (S().k, 0.12 → 1).
//   The people: Noa's echo (older, pale gold), Nico, Rosa, Tito, Marta and Bruno (frozen until you promise them a tomorrow),
//   a gray crowd of statues (the rest of Alba, all woken by the bell), the Great Silence over the bell tower.
//   The story and the tasks: future_scenes.js (FSCN). The words and graders: future_text.js (FTXT). Songs: future_music.js.
//   The arena and the boss's bestiary line: future_battle.js.
// Entry: FUTURE.enter() (the Past's last scene calls it, flags.pastDone). A save made in the realm comes back into it on load
// (flags.futureIn). The end: flags.futureDone, back in today's Alba, «Continuará…», and Chapter 4 is coming soon.
//   FUTURE.init(game) · enter(o) · leave(o) · update(dt, t) · interactables() · target() · song() · inside · OUTSIDE · spot(id)
//   Test hooks: FUTURE._.t (go(step) puts the save at a step and enters; see future_scenes.js).
const FUTURE = (() => {
  let G = null, built = false, inside = false, B = null;
  const { part, G: GEO } = TK;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = () => G.state.future || (G.state.future = { woke: {} });
  const F = () => G.state.flags;
  const lang = () => (G && G.state && G.state.lang) || 'es';
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const GY = (typeof TOWN !== 'undefined' && TOWN.GY) || 0.25;
  const gy = (x, z) => (typeof WORLD !== 'undefined' ? WORLD.terrainAt(x, z) : GY);
  const CEN = { x: -10, z: -150 }, EDGE = 45.5;

  // ------------------------------------------------------------ where things are (town.js's landmarks)
  const tower = () => ((typeof TOWN !== 'undefined' && TOWN.layout.buildings.find(b => b.kind === 'tower')) || { x: -26, z: -166, w: 3.6 });
  const SPOT = {
    arrive: { x: -9, z: -110.5, yaw: Math.PI },          // inside the south gate, looking up the main street
    noaGate: { x: -7.4, z: -115.6, yaw: 0.2 },
    noaPlaza: { x: -10.6, z: -139.6, yaw: Math.PI },      // the fountain's south side, facing it
    nico: { x: -7.5, z: -143.4, yaw: -2.6 },
    rosa: { x: -20.6, z: -129.4, yaw: 2.6 },
    tito: { x: -6.2, z: -149.6, yaw: -0.6 },
    marta: { x: 3.0, z: -155.0, yaw: 3.1 },
    bruno: { x: -24.4, z: -155.2, yaw: 2.2 },
    yardGate: { x: -21.0, z: -152.2 },
    noaYard: { x: -19.8, z: -156.6, yaw: -1.6 },
    noaTower: { x: -19.4, z: -158.4, yaw: -2.2 },
    towerFoot: { x: -26.0, z: -160.6 },
  };
  const doorAt = () => { const t = tower(); return { x: t.x, z: t.z + t.w / 2 + 0.05, yaw: 0 }; };
  const bellAt = () => { const t = tower(); return { x: t.x, y: gy(t.x, t.z) + 10.75, z: t.z }; };
  const OUTSIDE = { x: -10, z: -138.5, yaw: Math.PI };       // (saved in the realm: you come back into it from the plaza)

  // ------------------------------------------------------------ materials
  const tmat = (c, o = {}) => new THREE.MeshToonMaterial(Object.assign({ color: new THREE.Color(c), gradientMap: TK.grad }, o));
  const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); return sp; };
  const lum = c => c.r * 0.3 + c.g * 0.55 + c.b * 0.15;
  const grayCol = c => { const l = lum(c); return c.clone().lerp(new THREE.Color(l * 0.84, l * 0.84, l * 0.93), 0.9); };

  // ------------------------------------------------------------ people: the story's villager models, their colors their own
  // (ACTORS.villager shares materials by color, so each person gets its own copies: gray while frozen, its colors as it wakes)
  const PRE = {
    f_rosa: { dress: '#8a4f7d', apron: '#fbf6ee', skin: '#efc29a', hair: '#f6f4fa', hat: 'straw', glasses: true, bun: true, eyes: 'happy', h: 0.96 },
    f_nico: { dress: '#e0743c', apron: null, skin: '#f0c7a0', hair: '#6b3b25', hat: 'cap', glasses: false, bun: false, eyes: 'open', h: 0.97 },
    f_marta: { dress: '#f2e6d0', apron: '#ffffff', skin: '#e6b48c', hair: '#c9c4cf', hat: 'chef', glasses: false, bun: false, eyes: 'open', h: 1.04, wide: 1.15 },
    f_bruno: { dress: '#3f6f9a', apron: null, skin: '#c98e62', hair: '#dedbe4', hat: 'band', glasses: false, bun: false, eyes: 'open', h: 1.12, wide: 1.24 },
    f_tito: { dress: '#c9553f', apron: null, skin: '#8a5a3c', hair: '#d8d4dc', hat: null, glasses: false, bun: false, eyes: 'open', h: 1.0 },
    // the crowd (statues, all woken by the bell)
    c1: { dress: '#4f8a4a', apron: '#fdf8ee', skin: '#e6b48c', hair: '#8a8790', hat: null, eyes: 'open', h: 1.0 },
    c2: { dress: '#d97aa0', apron: '#fdf8ee', skin: '#f0c7a0', hair: '#6b3b25', hat: 'straw', eyes: 'happy', bun: true, h: 0.98 },
    c3: { dress: '#7a5ab0', apron: null, skin: '#f5cda2', hair: '#f4f1ea', hat: null, glasses: true, bun: true, eyes: 'open', h: 0.9 },
    c4: { dress: '#3f6f9a', apron: null, skin: '#c98e62', hair: '#2e2420', hat: 'cap', eyes: 'open', h: 1.06 },
    c5: { dress: '#e6b84a', apron: null, skin: '#a8714a', hair: '#2e2420', hat: 'straw', eyes: 'open', h: 1.02 },
    c6: { dress: '#e86a9a', apron: null, skin: '#efc29a', hair: '#2e2420', hat: null, eyes: 'open', bun: true, h: 0.74 },
    c7: { dress: '#4f9a5a', apron: null, skin: '#f5cda2', hair: '#e0b060', hat: 'cap', eyes: 'open', h: 0.72 },
    c8: { dress: '#b0563a', apron: null, skin: '#dcae86', hair: '#2e2420', hat: 'straw', eyes: 'open', h: 1.0 },
  };
  function ownColors(root) {
    const list = [];
    root.traverse(o => {
      if (!o.isMesh || !o.material || o.material.side === THREE.BackSide || !o.material.isMeshToonMaterial) return;
      const m0 = o.material, m = m0.clone(); m.onBeforeCompile = m0.onBeforeCompile; m.customProgramCacheKey = m0.customProgramCacheKey;
      o.material = m; list.push({ m, c: m0.color.clone(), g: grayCol(m0.color) });
    });
    return list;
  }
  // a guitar for Tito (hung in front of him, so it moves with his body)
  function guitar() {
    const g = new THREE.Group();
    g.add(part(GEO.sphere, '#b8743f', [0, 0, 0], [0.2, 0.24, 0.07], { ink: 0.01 }));
    g.add(part(GEO.sphere, '#b8743f', [0, 0.2, 0], [0.15, 0.17, 0.065], { ink: 0.01 }));
    g.add(part(GEO.cyl, '#2b2235', [0, 0.04, 0.065], [0.06, 0.01, 0.06], { ink: 0, rot: [Math.PI / 2, 0, 0] }));
    g.add(part(GEO.box, '#6b4a2f', [0, 0.52, 0], [0.05, 0.5, 0.03], { ink: 0.008 }));
    g.add(part(GEO.box, '#4a3020', [0, 0.8, 0], [0.08, 0.1, 0.035], { ink: 0.008 }));
    g.rotation.set(0.15, 0, 0.9); g.position.set(0.02, 0.5, 0.33);
    return g;
  }
  // a ball for Nico (flat: the Hush let the air out of it)
  function ball() { const m = part(GEO.sphere, '#f4efe4', [0.0, 0.08, 0.4], [0.15, 0.1, 0.15], { ink: 0.01 }); return m; }
  function person(id, preset, at, extra) {
    const v = ACTORS.villager(preset);
    if (extra === 'guitar') { v.guitar = guitar(); v.body.add(v.guitar); }
    if (extra === 'ball') v.body.add(ball());
    const cols = ownColors(v.root);
    const p = { id, name: FTXT.WHO[id] || id, v, cols, x: at.x, z: at.z, yaw: at.yaw || 0, y: gy(at.x, at.z), top: 1.55 * (PRE[preset] && PRE[preset].h || 1), talking: false, k: 0, kT: 0, wave: 0, pose: 'frozen', t: Math.random() * 9 };
    v.root.position.set(p.x, p.y, p.z); v.root.rotation.y = p.yaw;
    B.people.add(v.root);
    setColor(p, 0, true);
    return p;
  }
  function setColor(p, k, now) { p.kT = k; if (now) p.k = k; p.cols.forEach(c => { c.m.color.copy(c.g).lerp(c.c, p.k); }); }
  // a frozen pose: arms out mid-gesture, a slight lean, the head down (each person their own)
  const FROZEN = {
    nico: v => { v.arms[0].rotation.set(-1.0, 0, 0.4); v.arms[1].rotation.set(-1.1, 0, -0.4); v.body.rotation.x = 0.12; v.head.rotation.x = 0.3; },
    rosa: v => { v.arms[0].rotation.set(-1.3, 0, 0.3); v.arms[1].rotation.set(-0.6, 0, -0.2); v.head.rotation.x = 0.25; },
    tito: v => { v.arms[0].rotation.set(-1.2, 0, 0.6); v.arms[1].rotation.set(-1.0, 0, -0.9); v.head.rotation.x = 0.35; },
    marta: v => { v.arms[0].rotation.set(-1.5, 0, 0.2); v.arms[1].rotation.set(-1.5, 0, -0.2); v.body.rotation.x = 0.1; v.head.rotation.x = 0.2; },
    bruno: v => { v.arms[0].rotation.set(-2.4, 0, 0.3); v.arms[1].rotation.set(-0.4, 0, -0.5); v.body.rotation.z = 0.08; },
  };

  // ------------------------------------------------------------ Noa's echo: older, pale gold, a long coat (an echo from tomorrow)
  function echoNoa() {
    const M = new THREE.MeshBasicMaterial({ color: '#ffe2a8', transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending });
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 18);
    body.add(new THREE.Mesh(lathe([[0, 0], [0.34, 0.02], [0.33, 0.25], [0.25, 0.7], [0.2, 0.92], [0.09, 1.0], [0, 1.01]]), M));     // the long coat
    const head = new THREE.Group(); head.position.y = 1.02; body.add(head);
    const hm = new THREE.Mesh(GEO.sphere, M); hm.scale.set(0.25, 0.26, 0.24); hm.position.y = 0.2; head.add(hm);
    const bun = new THREE.Mesh(GEO.sphere, M); bun.scale.set(0.12, 0.11, 0.11); bun.position.set(0, 0.2, -0.26); head.add(bun);      // her hair up now, a low knot
    const clip = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: '#ffd84a', transparent: true, opacity: 0.85, depthWrite: false })); clip.scale.set(0.08, 0.03, 0.03); clip.position.set(0.17, 0.34, 0.03); clip.rotation.z = 0.5; head.add(clip);
    const arms = [-1, 1].map(s => { const sh = new THREE.Group(); sh.position.set(s * 0.23, 0.88, 0.03); body.add(sh); const a = new THREE.Mesh(GEO.cyl, M); a.scale.set(0.065, 0.36, 0.065); a.position.y = -0.18; sh.add(a); return sh; });
    // her notebook, under her arm
    const book = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: '#ffcf7a', transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })); book.scale.set(0.2, 0.26, 0.04); book.position.set(-0.27, 0.6, 0.06); book.rotation.z = 0.2; body.add(book);
    const halo = glow('#ffd88a', 2.8, 0.42); halo.position.y = 0.95; root.add(halo);
    root.scale.setScalar(1.16);
    return { root, body, head, arms, halo, M, k: 1, kT: 1, talk: 0, x: 0, z: 0, y: 0, top: 1.95, name: 'Noa', talking: false, pose: 'idle', show: true };
  }

  // ------------------------------------------------------------ the Great Silence (over the bell tower, once the door opens)
  // a huge hood of gray fog over the tower: a cloak that frays into mist at the bottom, a dark face, two pale eyes
  function silenceModel() {
    const g = new THREE.Group();
    const cloak = new THREE.MeshToonMaterial({ color: '#77738c', gradientMap: TK.grad, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
    const prof = [[0.05, 7.6], [0.9, 7.2], [1.7, 6.3], [2.2, 5.0], [2.6, 3.4], [3.1, 1.6], [3.6, 0.2]];
    const cg = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 28), cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i), k = 1 + Math.sin(Math.atan2(x, z) * 6) * 0.07 * (1 - y / 7.6); cp.setX(i, x * k); cp.setZ(i, z * k); }
    cg.computeVertexNormals();
    const body = new THREE.Mesh(cg, cloak); g.add(body);
    const ink = new THREE.Mesh(cg, TK.outlineMat(0.06)); g.add(ink);
    const face = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#0c0912' })); face.scale.set(1.15, 1.3, 0.5); face.position.set(0, 4.9, 1.75); g.add(face);
    const eyes = [-1, 1].map(s => { const e = glow('#e6f0ff', 2.3, 1); e.position.set(s * 0.45, 5.05, 2.45); e.material.depthTest = false; e.renderOrder = 3; g.add(e); return e; });
    const fog = [];
    for (let i = 0; i < 26; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: i % 2 ? '#8e8aa2' : '#a6a2b8', transparent: true, opacity: 0.6, depthWrite: false }));
      const a = (i / 26) * TAU, r = 2.6 + (i % 4) * 0.6; sp.scale.setScalar(2.8 + (i % 3)); sp.position.set(Math.cos(a) * r, -0.4 + (i % 5) * 0.7, Math.sin(a) * r); g.add(sp); fog.push({ sp, a, r, y: sp.position.y, ph: i * 0.7 });
    }
    g.visible = false; g.rotation.order = 'YXZ'; g.rotation.x = 0.42;       // (it leans over the plaza: its face toward you)
    return { g, body, eyes, fog, cloak, k: 0, kT: 0, rise: 0, riseT: 0 };
  }

  // ------------------------------------------------------------ the cracked bell (the town's own is hidden while you're here)
  function crackedBell() {
    const at = bellAt(), g = new THREE.Group(); g.position.set(at.x, at.y, at.z);
    const mat = tmat('#8d8577', { emissive: new THREE.Color('#000000') });
    const geo = new THREE.LatheGeometry([[0, 0.05], [0.18, 0.04], [0.28, -0.1], [0.33, -0.45], [0.44, -0.78], [0.6, -0.95], [0.62, -1.0], [0, -1.0]].map(([x, y]) => new THREE.Vector2(x, y)), 26);
    const bell = part(geo, null, [0, 0, 0], null, { mat, ink: 0.02 }); g.add(bell);
    g.add(part(GEO.cyl, '#3a3036', [0, 0.1, 0], [0.5, 0.08, 0.08], { ink: 0.01, rot: [0, 0, Math.PI / 2] }));
    g.add(part(GEO.sphere, '#5a554f', [0, -0.92, 0], [0.11, 0.11, 0.11], { ink: 0.01 }));
    // the crack: a dark zigzag down its south face
    const crack = new THREE.Group(); g.add(crack);
    const cm = new THREE.MeshBasicMaterial({ color: '#1a1622' });
    [[0.02, -0.12, 0.3, -0.18], [0.07, -0.3, 0.32, 0.35], [0.0, -0.5, 0.38, -0.3], [0.08, -0.7, 0.47, 0.4], [0.02, -0.88, 0.57, -0.25]].forEach(([x, y, z, rz]) => { const m = new THREE.Mesh(GEO.box, cm); m.scale.set(0.03, 0.22, 0.02); m.position.set(x, y, z); m.rotation.set(-0.25, 0, rz); crack.add(m); });
    g.rotation.z = 0.12;
    const gl = glow('#ffd36b', 3.6, 0); gl.position.y = -0.5; g.add(gl);
    return { g, mat, crack, gl, swing: 0 };
  }

  // ------------------------------------------------------------ the overgrowth: weeds, ivy, dead leaves (instanced: a draw call each)
  const inBuilding = (x, z, pad = 0.4) => (typeof TOWN !== 'undefined' ? TOWN.layout.buildings : []).some(b => { const c = Math.cos(b.rot || 0), s = Math.sin(b.rot || 0), dx = x - b.x, dz = z - b.z, lx = dx * c - dz * s, lz = dx * s + dz * c; return Math.abs(lx) < b.w / 2 + pad && Math.abs(lz) < b.d / 2 + pad; });
  function instanced(geo, mat, list, parent, name) {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)), m = new THREE.Matrix4(), c = new THREE.Color();
    list.forEach((o, i) => { im.setMatrixAt(i, o.m); im.setColorAt(i, c.set(o.c)); });
    im.count = list.length; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = false; im.receiveShadow = true; im.name = name; parent.add(im); return im;
  }
  function buildGrowth(root) {
    const R = rng(2077), weeds = [], leaves = [], ivy = [];
    // weeds: tufts in the streets' cracks, round the plaza, against every wall
    // (thin blades in a little fan; soft-lit, so they read as grass, not spikes)
    const blade = new THREE.ConeGeometry(1, 1, 4, 1, true);
    const weedGeo = TK.merge([[0, 0.42, 0, 0.1], [0.06, 0.34, 0.03, -0.35], [-0.05, 0.3, -0.03, 0.4], [0.03, 0.26, -0.06, -0.15], [-0.04, 0.36, 0.05, 0.2]].map(([x, h, z, tilt]) => ({ geo: blade, m: TK.M4(x, h / 2, z, 0.028, h, 0.028, 0, tilt, -tilt * 0.6), color: '#ffffff' })));
    for (let n = 0, tries = 0; n < 650 && tries < 8000; tries++) {
      const a = R() * TAU, r = Math.sqrt(R()) * 42, x = CEN.x + Math.cos(a) * r, z = CEN.z + Math.sin(a) * r;
      if (inBuilding(x, z, 0.15)) continue;
      const wall = inBuilding(x, z, 0.9), plaza = Math.hypot(x + 10, z + 146) < 10.5, paved = TOWN.pavedAt && TOWN.pavedAt(x, z) > 0.5;
      if (!wall && plaza && R() < 0.7) continue;                 // (the plaza mostly bare: weeds in its cracks, round its edge)
      if (!wall && !paved && R() < 0.5) continue;                 // (more in the streets' cracks and along the walls)
      const s = (wall ? 1.1 : 0.7) + R() * 0.8;
      for (let j = 0; j < (wall ? 3 : 1 + (R() < 0.4 ? 1 : 0)); j++) { const ox = (R() - 0.5) * 0.5, oz = (R() - 0.5) * 0.5; weeds.push({ m: TK.M4(x + ox, gy(x, z) + 0.01, z + oz, s, s * (wall ? 1.5 : 1), s, R() * TAU), c: ['#8b9672', '#7f8a66', '#97a07c', '#87906c', '#79845f'][(n + j) % 5] }); }
      n++;
    }
    const wmat = new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide });
    B.weeds = instanced(weedGeo, wmat, weeds, root, 'future-weeds');
    // ivy: leafy clumps up every building's walls and over the eaves
    const leaf = new THREE.IcosahedronGeometry(1, 0);
    for (const b of (typeof TOWN !== 'undefined' ? TOWN.layout.buildings : [])) {
      const c = Math.cos(b.rot || 0), s = Math.sin(b.rot || 0), H = b.kind === 'tower' ? 9 : (b.floors || 1) * 2.6 + 0.4, y0 = gy(b.x, b.z);
      const faces = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [fx, fz] of faces) {
        // a creeper climbing from the ground: leaves up a wandering line, flat against the wall
        const n = 7 + Math.floor(R() * 7), half = fx ? b.d / 2 : b.w / 2;
        let col = R() * 1.6 - 0.8, wy = y0 + 0.15;
        for (let i = 0; i < n; i++) {
          col = clamp(col + (R() - 0.5) * 0.35, -0.94, 0.94); wy += 0.18 + R() * 0.32; if (wy > y0 + H) break;
          const lx = fx ? fx * (b.w / 2 + 0.05) : col * half, lz = fz ? fz * (b.d / 2 + 0.05) : col * half;
          const x = b.x + lx * c + lz * s, z = b.z - lx * s + lz * c, sc = 0.16 + R() * 0.2;
          ivy.push({ m: TK.M4(x, wy, z, sc * (fx ? 0.3 : 1.25), sc * 1.2, sc * (fx ? 1.25 : 0.3), (b.rot || 0) + R() * 0.3, R() * 0.5, R() * 0.5), c: ['#6f8562', '#647a58', '#7a8e6b', '#5d7152'][i % 4] });
          if (R() < 0.6) ivy.push({ m: TK.M4(x + (fz ? (R() - 0.5) * 0.5 : 0), wy - 0.1, z + (fx ? (R() - 0.5) * 0.5 : 0), sc * (fx ? 0.25 : 0.9), sc * 0.9, sc * (fx ? 0.9 : 0.25), R() * 3), c: '#71866a' });
        }
      }
    }
    B.ivy = instanced(leaf, new THREE.MeshLambertMaterial({ color: '#ffffff' }), ivy, root, 'future-ivy');
    // dead leaves blown into the corners and across the plaza
    const lg = new THREE.PlaneGeometry(0.22, 0.16); lg.rotateX(-Math.PI / 2);
    for (let n = 0; n < 380; n++) { const a = R() * TAU, r = Math.sqrt(R()) * 40, x = CEN.x + Math.cos(a) * r, z = CEN.z + Math.sin(a) * r; if (inBuilding(x, z, 0.05)) continue; leaves.push({ m: TK.M4(x, gy(x, z) + 0.035 + R() * 0.01, z, 0.8 + R() * 0.9, 1, 0.8 + R() * 0.9, R() * TAU), c: ['#8a7660', '#7a6a58', '#9a8670', '#6d6152'][n % 4] }); }
    const lmat = new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide });
    B.leaves = instanced(lg, lmat, leaves, root, 'future-leaves');
  }

  // ------------------------------------------------------------ rubble, thorns at the gates, the dry fountain's moss, the banner
  function buildRuin(root) {
    const pcs = [], pcsN = [], R = rng(1977);
    let into = pcs;
    const add = (geo, x, y, z, sx, sy, sz, color, ry = 0, rx = 0, rz = 0) => into.push({ geo, m: TK.M4(x, y, z, sx, sy, sz, ry, rx, rz), color });
    // thorn thickets and rubble across each way out (the realm ends at the town's edge). The north gate's is a mesh of its own:
    // Chapter 4 opens it (FUTURE._.northOpen, alba_future.js: the road to the old theater in the Old Quarter)
    const gates = [[-9, -103.5, 0], [37, -150, Math.PI / 2], [-56, -150, Math.PI / 2], [-10, -196, 0]];
    for (const [gx, gz, rot] of gates) {
      into = gz === -196 ? pcsN : pcs;
      for (let i = 0; i < 26; i++) {
        const u = (i / 25 - 0.5) * 9, x = gx + Math.cos(rot) * u + (R() - 0.5) * 1.2, z = gz - Math.sin(rot) * u + (R() - 0.5) * 1.2, y = gy(x, z);
        add(GEO.ico0, x, y + 0.5 + R() * 0.6, z, 0.7 + R() * 0.6, 0.6 + R() * 0.9, 0.7 + R() * 0.6, ['#4e4a52', '#5b5560', '#433f48'][i % 3], R() * 3, R() * 2, R() * 2);
        for (let k = 0; k < 3; k++) add(GEO.cone, x + (R() - 0.5), y + 0.9 + R() * 0.8, z + (R() - 0.5), 0.05, 0.5 + R() * 0.4, 0.05, '#3a3640', R() * 3, (R() - 0.5) * 2, (R() - 0.5) * 2);
        if (i % 4 === 0) add(GEO.box, x, y + 0.2, z, 0.6 + R() * 0.5, 0.35, 0.45 + R() * 0.4, '#8a8478', R() * 3, 0, (R() - 0.5) * 0.4);
      }
    }
    into = pcs;
    // a broken cart in the main street, crates, planks, a fallen signboard
    { const x = -6.8, z = -124.5, y = gy(x, z); add(GEO.box, x, y + 0.55, z, 1.4, 0.35, 2.1, '#7d6a58', 0.4, 0, 0.25); add(GEO.cyl, x - 0.75, y + 0.38, z - 0.3, 0.42, 0.08, 0.42, '#5d4e42', 0.4, 0, Math.PI / 2); add(GEO.cyl, x + 0.2, y + 0.06, z + 0.9, 0.42, 0.08, 0.42, '#5d4e42', 0.4, Math.PI / 2 - 0.1, 0); }
    [[-14.5, -127.2], [-17.2, -133.6], [6.2, -151.6], [-2.6, -158.8], [-30.4, -150.8], [12.8, -145.2], [-13.6, -176.4]].forEach(([x, z], i) => { const y = gy(x, z), s = 0.55 + R() * 0.25; add(GEO.box, x, y + s / 2, z, s, s, s, ['#8a7460', '#7a6858', '#93806a'][i % 3], R() * 2, 0, i % 2 ? 0.3 : 0); if (i % 2) add(GEO.box, x + 0.5, y + 0.05, z + 0.3, 1.6, 0.08, 0.22, '#7f6c5a', R() * 3); });
    // the plaza: the fountain gone dry and mossy, cracks of weeds round it
    { const x = -10, z = -146, y = gy(x, z); for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; add(GEO.sphere, x + Math.cos(a) * 2.35, y + 0.62, z + Math.sin(a) * 2.35, 0.32 + R() * 0.2, 0.12, 0.3 + R() * 0.15, i % 2 ? '#5f6b52' : '#6a7459'); } add(GEO.cyl, x, y + 0.36, z, 2.0, 0.05, 2.0, '#6d6a66'); }
    // the bell tower: vines hanging down its corners, a cracked step
    { const t = tower(), y = gy(t.x, t.z); for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let k = 0; k < 6; k++) add(GEO.cyl, t.x + sx * (t.w / 2 + 0.05), y + 2.0 + k * 1.3, t.z + sz * (t.w / 2 + 0.05), 0.05, 1.5, 0.05, '#4c5e43', 0, (R() - 0.5) * 0.4, (R() - 0.5) * 0.4); }
    // the seal on the bell tower's door: gray Hush, thick as felt (it melts when the door opens)
    const pieces = new THREE.Mesh(TK.merge(pcs), tmat('#ffffff', { vertexColors: true })); pieces.castShadow = true; pieces.receiveShadow = true; pieces.name = 'future-ruin'; root.add(pieces);
    const thornN = new THREE.Mesh(TK.merge(pcsN), pieces.material); thornN.castShadow = true; thornN.receiveShadow = true; thornN.name = 'future-thorns-north'; root.add(thornN); B.thornN = thornN;
    const d = doorAt(), seal = new THREE.Group(); seal.position.set(d.x, gy(d.x, d.z), d.z + 0.12); root.add(seal);
    for (let i = 0; i < 9; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: i % 2 ? '#8f8aa3' : '#a29db4', transparent: true, opacity: 0.95, depthWrite: false })); sp.position.set((i % 3 - 1) * 0.55, 0.5 + Math.floor(i / 3) * 0.7, 0.1); sp.scale.setScalar(1.35); seal.add(sp); }
    B.seal = seal;
    // the festival's banner, faded and torn, across the plaza's north side
    B.banner = buildBanner(root);
  }
  function bannerTex() {
    const l = lang(), cv = document.createElement('canvas'); cv.width = 1024; cv.height = 192;
    const c = cv.getContext('2d'); c.fillStyle = '#d9cdb8'; c.fillRect(0, 0, 1024, 192);
    for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(90,80,70,${0.05 + Math.random() * 0.1})`; c.fillRect(Math.random() * 1024, Math.random() * 192, 3 + Math.random() * 30, 2 + Math.random() * 8); }
    c.fillStyle = '#9b4b3c'; c.fillRect(0, 0, 1024, 16); c.fillRect(0, 176, 1024, 16);
    const font = l === 'zh' || l === 'ja' ? '"Noto Sans SC","Microsoft YaHei","Yu Gothic",sans-serif' : 'Georgia, serif';
    c.fillStyle = '#7a3b30'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 64px ${font}`;
    c.fillText(FTXT.plain(FTXT.pick(FTXT.NAMES.banner, l), l), 512, 74);
    c.font = `italic 36px ${font}`; c.fillStyle = '#5a4a40'; c.fillText('« ' + FTXT.plain(FTXT.pick(FTXT.NAMES.motto, l), l) + ' »', 512, 140);
    // torn: bites out of the bottom edge
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 9; i++) { c.beginPath(); const x = 60 + i * 115 + Math.random() * 40; c.moveTo(x, 192); c.lineTo(x + 14, 150 + Math.random() * 30); c.lineTo(x + 30, 192); c.fill(); }
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  function buildBanner(root) {
    const a = { x: -17.2, z: -155.6 }, b = { x: -2.8, z: -155.6 }, g = new THREE.Group(); root.add(g);
    for (const p of [a, b]) g.add(part(GEO.cyl, '#5c5048', [p.x, gy(p.x, p.z) + 1.9, p.z], [0.09, 3.8, 0.09], { ink: 0.01 }));
    const mat = new THREE.MeshLambertMaterial({ map: bannerTex(), transparent: true, side: THREE.DoubleSide, alphaTest: 0.1 });
    const geo = new THREE.PlaneGeometry(12.6, 1.6, 24, 1), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), u = x / 6.3; p.setY(i, p.getY(i) - (1 - u * u) * 0.55); p.setZ(i, Math.sin(u * 3.1) * 0.08); }
    geo.computeVertexNormals();
    const cloth = new THREE.Mesh(geo, mat); cloth.position.set((a.x + b.x) / 2, gy(a.x, a.z) + 3.2, a.z); cloth.rotation.z = 0.05; g.add(cloth);
    return { g, cloth, mat, at: { x: (a.x + b.x) / 2, z: a.z + 0.8 }, lang: lang() };
  }
  // gray motes drifting through town (the Hush in the air)
  function buildMotes(root) {
    const n = 140, pos = new Float32Array(n * 3), R = rng(5), seeds = [];
    for (let i = 0; i < n; i++) { const a = R() * TAU, r = Math.sqrt(R()) * 40; seeds.push({ x: CEN.x + Math.cos(a) * r, z: CEN.z + Math.sin(a) * r, y: 0.4 + R() * 6, ph: R() * 9 }); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: TK.glowTex, color: '#b8b4c8', size: 0.35, transparent: true, opacity: 0.55, depthWrite: false }));
    pts.frustumCulled = false; root.add(pts);
    return { pts, pos, seeds };
  }
  // the realm's edge: a ring of solids just outside the gates (parked far away unless you're in the realm)
  function buildEdge() {
    const list = [], n = Math.ceil(TAU * EDGE / 1.5);
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; list.push({ x: CEN.x + Math.cos(a) * EDGE, z: CEN.z + Math.sin(a) * EDGE, r: 1.0, future: true }); }
    list.forEach(c => { c._x = c.x; c.x = 1e5; c.north = Math.abs(c._x + 10) < 4.6 && c.z < -190; });       // (north: the gap the north gate's road opens in Chapter 4)
    WORLD.addSolids(list);
    return list;
  }
  let northOpen = false;
  const edgeOn = on => { if (B && B.edge) B.edge.forEach(c => { c.x = on && !(northOpen && c.north) ? c._x : 1e5; }); };
  // Chapter 4 (alba_future.js): the north gate's thorns gone and its gap in the edge open, so the road leads to the Old Quarter
  function setNorth(on) { northOpen = !!on; if (!B) return northOpen; if (B.thornN) B.thornN.visible = !northOpen; edgeOn(inside); return northOpen; }

  // ------------------------------------------------------------ build it (the first time you go in: nobody else pays for it)
  function build() {
    if (built) return B;
    built = true;
    Object.keys(PRE).forEach(k => { if (!ACTORS.PRESETS[k]) ACTORS.PRESETS[k] = PRE[k]; });
    const root = new THREE.Group(); root.name = 'future'; root.visible = false; G.w3d.scene.add(root);
    B = { root, people: new THREE.Group(), byId: {}, crowd: [] };
    root.add(B.people);
    try { buildGrowth(root); } catch (e) { console.error('[future] growth', e); }
    try { buildRuin(root); } catch (e) { console.error('[future] ruin', e); }
    try { B.motes = buildMotes(root); } catch (e) { console.error('[future] motes', e); }
    try { B.bell = crackedBell(); root.add(B.bell.g); } catch (e) { console.error('[future] bell', e); }
    try { B.sil = silenceModel(); const t = tower(); B.sil.g.position.set(t.x, gy(t.x, t.z) + 9.5, t.z - 0.5); root.add(B.sil.g); } catch (e) { console.error('[future] silence', e); }
    B.noa = echoNoa(); root.add(B.noa.root);
    // the five who can be woken
    [['nico', 'f_nico', 'ball'], ['rosa', 'f_rosa'], ['tito', 'f_tito', 'guitar'], ['marta', 'f_marta'], ['bruno', 'f_bruno']].forEach(([id, pre, extra]) => {
      const p = person(id, pre, SPOT[id], extra); B.byId[id] = p; if (FROZEN[id]) FROZEN[id](p.v);
    });
    // the crowd: the rest of Alba, frozen where they stood (one merged statue mesh; the bell gives them their colors back)
    try { buildCrowd(root); } catch (e) { console.error('[future] crowd', e); }
    // Bruno's practice dummies, knocked flat
    { const k = [], y = gy(-27.5, -156.4); [[-27.6, -156.6, 0.4], [-28.8, -154.4, 2.0], [-26.4, -158.6, 1.2]].forEach(([x, z, r]) => { k.push({ geo: GEO.cyl, m: TK.M4(x, gy(x, z) + 0.2, z, 0.18, 1.4, 0.18, r, Math.PI / 2, 0), color: '#b08a5a' }, { geo: GEO.sphere, m: TK.M4(x + Math.sin(r) * 0.8, gy(x, z) + 0.22, z + Math.cos(r) * 0.8, 0.26, 0.24, 0.26), color: '#d8b878' }); });
      const m = new THREE.Mesh(TK.merge(k), tmat('#ffffff', { vertexColors: true })); m.castShadow = true; root.add(m); B.dummies = m; void y; }
    B.edge = buildEdge();
    if (B.thornN) B.thornN.visible = !northOpen;
    // the five people's solids (parked unless you're here)
    B.solids = ['nico', 'rosa', 'tito', 'marta', 'bruno'].map(id => { const p = B.byId[id]; return { x: 1e5, z: 1e5, _x: p.x, _z: p.z, r: 0.45, future: true }; });
    WORLD.extra.push(...B.solids);
    return B;
  }
  const CROWD = [
    { pre: 'c1', x: -6.2, z: -130.0, yaw: 0.0, arms: [-0.9, -0.2] }, { pre: 'c3', x: -11.4, z: -126.6, yaw: 3.0, arms: [-0.5, -0.5] },     // Hugo with his broom, old Clara
    { pre: 'c2', x: 14.2, z: -146.2, yaw: -1.6, arms: [-1.2, -0.3] }, { pre: 'c5', x: 17.6, z: -149.6, yaw: 1.4, arms: [-0.4, -1.2] },    // the market street
    { pre: 'c4', x: -32.6, z: -148.0, yaw: 1.5, arms: [-1.4, -1.4] }, { pre: 'c8', x: -6.9, z: -118.0, yaw: 0.6, arms: [-0.8, -0.3] },    // the west street, Ana by the inn
    { pre: 'c6', x: -18.6, z: -140.8, yaw: 0.8, arms: [-2.4, -0.3] }, { pre: 'c7', x: -16.8, z: -142.6, yaw: -2.2, arms: [-0.3, -2.2] },  // Lola and Max, mid-chase
    { pre: 'c3', x: -16.2, z: -152.4, yaw: 1.2, arms: [-0.6, -0.6] }, { pre: 'c5', x: 2.1, z: -177.0, yaw: 1.6, arms: [-1.0, -1.0] },   // old Otto by the plaza, Emil at the dry pond (on its bank: alba_future.js can fill it again)
    { pre: 'c1', x: -14.6, z: -181.2, yaw: 0.2, arms: [-1.6, -0.2] }, { pre: 'c2', x: 2.2, z: -136.8, yaw: -2.6, arms: [-0.3, -0.9] },    // the school's teacher, Vera
  ];
  function buildCrowd(root) {
    const pcs = [], hull = [], tmp = new THREE.Group(); G.w3d.scene.add(tmp);
    for (const d of CROWD) {
      const v = ACTORS.villager(d.pre); tmp.add(v.root);
      v.root.position.set(d.x, gy(d.x, d.z) - (d.seat ? 0.22 : 0), d.z); v.root.rotation.y = d.yaw;
      v.arms[0].rotation.set(d.arms[0], 0, 0.3); v.arms[1].rotation.set(d.arms[1], 0, -0.3); v.head.rotation.x = 0.28; v.body.rotation.x = 0.06;
      v.root.updateMatrixWorld(true);
      v.root.traverse(o => {
        if (!o.isMesh || !o.geometry) return;
        if (o.material && o.material.side === THREE.BackSide) hull.push({ geo: o.geometry, m: o.matrixWorld.clone(), color: '#2b2235' });
        else if (o.material && o.material.color && !o.material.transparent) pcs.push({ geo: o.geometry, m: o.matrixWorld.clone(), color: '#' + o.material.color.getHexString() });
      });
      tmp.remove(v.root);
    }
    G.w3d.scene.remove(tmp);
    const geo = TK.merge(pcs), col = geo.attributes.color, orig = col.array.slice(), gray = col.array.slice();
    for (let i = 0; i < gray.length; i += 3) { const c = grayCol(new THREE.Color(orig[i], orig[i + 1], orig[i + 2])); gray[i] = c.r; gray[i + 1] = c.g; gray[i + 2] = c.b; }
    col.array.set(gray); col.needsUpdate = true;
    const mesh = new THREE.Mesh(geo, tmat('#ffffff', { vertexColors: true })); mesh.castShadow = true; mesh.name = 'future-crowd'; root.add(mesh);
    const hm = new THREE.Mesh(TK.merge(hull), TK.outlineMat(0.02)); hm.name = 'future-crowd-ink'; root.add(hm);
    B.crowd = { mesh, hm, col, orig, gray, k: 0, kT: 0 };
    B.crowdSolids = CROWD.map(d => ({ x: 1e5, z: 1e5, _x: d.x, _z: d.z, r: 0.42, future: true }));
    WORLD.extra.push(...B.crowdSolids);
  }

  // ------------------------------------------------------------ the present, hidden while you're in tomorrow (and back after)
  let hidden = null;
  function presentOn(on) {
    const T = G.town;
    if (!on && !hidden) {
      hidden = [];
      const hide = o => { if (o) { hidden.push([o, o.visible]); o.visible = false; } };
      if (T && T.objects) { (T.objects.folks || []).forEach(hide); hide(T.objects.basket); }
      if (T && T.group) {
        const smoke = T.group.getObjectByName('town-smoke');
        T.group.traverse(o => { if (o.name === 'town-drops' || o.name === 'town-water' || (smoke && o.isInstancedMesh && o.geometry === smoke.geometry)) hide(o); });
      }
      for (const id of Object.keys(G.cast.npcs || {})) hide(G.cast.npcs[id].root);
      // the story's people step out of the way (their solids and Talk prompts with them), the way past.js parks them
      parked = {};
      for (const id of Object.keys(G.cast.npcs || {})) { const n = G.sim.npc(id); if (n) { parked[id] = { x: n.x, z: n.z }; n.x = 1e5 + 4 * Object.keys(parked).length; n.z = 1e5; } }
      // the side modules' groups (town life, the language characters) and their bits drawn straight into the scene
      for (const k of ['townlife', 'minigames', 'domino', 'phonk', 'adolf', 'romance', 'cards', 'newyear', 'muertos', 'matsuri', 'carnaval', 'weihnacht', 'lucha', 'familia', 'shogi', 'doener']) { const m = G[k]; if (m && m.group) hide(m.group); }
      for (const o of G.w3d.scene.children) if (o.isObject3D && o !== B.root && /^(?:grandma|anime|school|read|library|signs|tactics|yard|radio|diary|baile)/i.test(o.name || '') && o.visible) hide(o);
    } else if (on && hidden) {
      hidden.forEach(([o, v]) => { o.visible = v; }); hidden = null;
      for (const [id, p] of Object.entries(parked || {})) { const n = G.sim.npc(id); if (n) { n.x = p.x; n.z = p.z; } }
      parked = null;
    }
  }
  let parked = null;
  const solidsOn = on => { if (!B) return; edgeOn(on); B.solids.concat(B.crowdSolids || []).forEach(c => { c.x = on ? c._x : 1e5; c.z = on ? c._z : 1e5; }); };

  // the color drained from the screen: an overlay's backdrop filter (above the world, under every panel; never in a battle)
  let tintEl = null, tintKey = '';
  function tintOn(on) {
    if (!tintEl) {
      const st = document.createElement('style');
      st.textContent = '#future-tint{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:0;transition:opacity .9s;background:radial-gradient(ellipse at center,rgba(70,66,92,0) 48%,rgba(40,37,58,.4) 100%)}'
        + 'body.in-battle #future-tint,body.on-title #future-tint{display:none}';
      document.head.appendChild(st);
      tintEl = document.createElement('div'); tintEl.id = 'future-tint';
      const hf = document.getElementById('hushfx'); if (hf && hf.parentNode) hf.parentNode.insertBefore(tintEl, hf.nextSibling); else document.body.appendChild(tintEl);
    }
    tintEl.style.opacity = on ? 1 : 0;
  }
  function tintK(k) {
    if (!tintEl) return;
    const key = k.toFixed(2); if (key === tintKey) return; tintKey = key;
    const f = `saturate(${(0.08 + 0.92 * Math.pow(k, 1.6)).toFixed(2)}) contrast(${(1.06 - 0.06 * k).toFixed(2)}) brightness(${(0.92 + 0.08 * k).toFixed(2)})`;
    tintEl.style.backdropFilter = f; tintEl.style.webkitBackdropFilter = f;
    tintEl.style.background = k > 0.98 ? 'none' : '';
  }

  // ------------------------------------------------------------ in and out
  const teleport = (x, z, yaw) => { const Yu = G.sim.you, Mm = G.sim.mimo; Yu.x = x; Yu.z = z; if (yaw !== undefined) Yu.yaw = yaw; Mm.x = x + 1.1; Mm.z = z + 0.8; Mm.hidden = false; Mm.wander = null; Mm.station = null; Mm.look = null; G.sim.snap(); G.cam.snap(yaw !== undefined ? yaw : G.cam.yaw, 0.28, 8.5); };
  let entering = false;
  const api = {};
  // o: { at: a spot to land on (else the gate the first time, the plaza after), quick: a short fade, scene: false (no arrival),
  //      noFade: no fade of its own (time.js's crack trip has its own veil, and a save loaded here comes straight back) }
  async function enter(o = {}) {
    if (!G || inside || entering) return;
    entering = true;
    try {
      build();
      const fd = document.getElementById('fade'), bg0 = fd ? fd.style.background : '';
      if (fd && !o.noFade) fd.style.background = '#f3efff';
      if (!o.noFade) await UI.fade(1, o.quick ? 250 : 800);
      // (another realm still in: it hands over. PAST.exitTo('future') if it has one, else its leave(); its note is cleared)
      const other = G.indoorMod && G.indoorMod();
      if (other && other !== api) {
        try { if (typeof other.exitTo === 'function') await other.exitTo('future'); else if (typeof other.leave === 'function') await other.leave({ quiet: true, to: 'future' }); } catch (e) { console.warn('[future] handing over', e); }
        STORY.think(' ', 0.01); G.sim.lock = 0;
      }
      if (!o.quick) snd('swoosh');
      inside = true; F().futureIn = true; F().futureOpen = true;
      try { const TB = BATTLE._.tense; if (TB && TB.unlock && !(G.state.tbOpen && G.state.tbOpen.Gf)) TB.unlock('Gf'); } catch (e) { /* (no time battles yet) */ }
      presentOn(false); B.root.visible = true; solidsOn(true); tintOn(true); G.fx.birds = 0;
      applyState();
      const at = o.at || (S().arrived ? OUTSIDE : SPOT.arrive);
      teleport(at.x, at.z, at.yaw);
      G.save();
      if (!o.noFade) { await STORY.wait(0.1); await UI.fade(0, o.quick ? 350 : 1100); if (fd) fd.style.background = bg0; }
      if (o.scene !== false && typeof FSCN !== 'undefined') {
        const sc = !S().arrived ? FSCN.arrive : null;
        if (sc) { if (STORY.busy) await sc(); else STORY.run(sc); }
      }
    } finally { entering = false; }
  }
  // o: { to: where to land in today's Alba (the plaza by default), quick, noFade (time.js: its own veil) }
  async function leave(o = {}) {
    if (!inside) return;
    const fd = document.getElementById('fade'), bg0 = fd ? fd.style.background : '';
    if (fd && !o.noFade) fd.style.background = '#f3efff';
    if (!o.noFade) await UI.fade(1, o.quick ? 250 : 900);
    inside = false; F().futureIn = false;
    B.root.visible = false; solidsOn(false); tintOn(false); presentOn(true); G.fx.birds = null; G.fx.hush = 0;
    if (typeof CEMETERY !== 'undefined' && CEMETERY.era && CEMETERY.era !== 'now' && CEMETERY.setEra) { try { CEMETERY.setEra('now'); } catch (e) { /* */ } }
    const to = o.to || { x: -10, z: -138.5, yaw: Math.PI };
    teleport(to.x, to.z, to.yaw);
    G.save();
    if (!o.noFade) { await STORY.wait(0.1); await UI.fade(0, o.quick ? 350 : 1100); if (fd) fd.style.background = bg0; }
  }

  // ------------------------------------------------------------ the save's progress, put into the world
  // S(): { arrived, demo (Nico, the card), woke: { nico, rosa, tito, marta, bruno }, rep (the report), yard (Bruno's fight),
  //        cond (the wish shown), door, out (the Silence out), trap ('S'…), boss, rang, end, k (the color, 0.12 → 1) }
  const woken = id => !!(S().woke && S().woke[id]);
  function colorGoal() {
    const s = S(), w = ['nico', 'rosa', 'tito', 'marta', 'bruno'].filter(woken).length;
    return s.rang ? 1 : clamp(0.1 + w * 0.04 + (s.yard ? 0.03 : 0) + (s.door ? 0.03 : 0) + (s.boss ? 0.05 : 0), 0.1, 0.45);
  }
  function applyState() {
    if (!B) return;
    const s = S();
    for (const id of Object.keys(B.byId)) {
      const p = B.byId[id], w = woken(id), at = SPOT[id];
      p.x = at.x; p.z = at.z; p.yaw = at.yaw || 0; p.y = gy(at.x, at.z); p.v.root.position.set(p.x, p.y, p.z); p.v.root.rotation.y = p.yaw;
      setColor(p, w ? 1 : 0, true); p.pose = w ? 'idle' : 'frozen'; if (!w && FROZEN[id]) FROZEN[id](p.v);
    }
    if (s.yard && typeof FSCN !== 'undefined' && FSCN.gather) FSCN.gather();      // (after Bruno's yard, everyone you woke is at the bell tower)
    B.seal.visible = !s.door;
    B.sil.g.visible = !!s.out && !s.boss; B.sil.rise = B.sil.riseT = s.out ? 1 : 0;
    B.bell.crack.visible = !s.rang; B.bell.mat.color.set(s.rang ? '#e2b44a' : '#8d8577'); B.bell.mat.emissive.set(s.rang ? '#3a2a08' : '#000000');
    if (B.crowd) { B.crowd.k = B.crowd.kT = s.rang ? 1 : 0; crowdColor(B.crowd.k); }
    placeNoa(noaSpot());
    S().k = s.k === undefined ? colorGoal() : s.k;
  }
  function crowdColor(k) { const C = B.crowd, a = C.col.array; for (let i = 0; i < a.length; i++) a[i] = C.gray[i] + (C.orig[i] - C.gray[i]) * k; C.col.needsUpdate = true; }
  // where Noa's echo waits: the gate, the plaza, Bruno's yard, the bell tower (and by its clock at the end)
  function noaSpot() {
    const s = S();
    if (!s.arrived) return SPOT.noaGate;
    if (!s.rep) return SPOT.noaPlaza;
    if (!s.yard) return SPOT.noaYard;
    return SPOT.noaTower;
  }
  function placeNoa(at) { const N = B.noa; N.x = at.x; N.z = at.z; N.y = gy(at.x, at.z); N.root.position.set(N.x, N.y, N.z); N.root.rotation.y = at.yaw || 0; }

  // ------------------------------------------------------------ per frame (main.js: while you're inside)
  let lights = null, lastLang = null;
  const FOG_G = new THREE.Color('#a3a1ae');
  function update(dt, t) {
    if (!inside || !B) return;
    const s = S(), Y = G.sim.you;
    if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    // the color comes back as you speak
    s.k = damp(s.k === undefined ? 0.12 : s.k, colorGoal(), 0.8, dt);
    const k = s.k; tintK(k);
    // the fog: low and gray (the town's edge and the world past it stay hidden); the light dimmer
    const fog = G.w3d.scene.fog; fog.color.lerp(FOG_G, 0.8 * (1 - k * 0.7)); fog.near = lerp(12, 40, k); fog.far = lerp(92, 210, k);
    if (!lights) lights = G.w3d.scene.children.filter(o => o.isLight && (o.isHemisphereLight || o.isDirectionalLight));
    lights.forEach(l => { l.intensity *= lerp(0.8, 1, k); });
    G.fx.birds = s.rang ? 0.5 : 0;
    if (lang() !== lastLang) { lastLang = lang(); if (B.banner && B.banner.lang !== lastLang) { B.banner.mat.map = bannerTex(); B.banner.mat.needsUpdate = true; B.banner.lang = lastLang; } }
    // people: the frozen stand still (a shiver now and then); the woken breathe, look at you, talk
    for (const id of Object.keys(B.byId)) {
      const p = B.byId[id]; p.t += dt;
      if (p.k !== p.kT) { p.k = damp(p.k, p.kT, 1.6, dt); if (Math.abs(p.k - p.kT) < 0.004) p.k = p.kT; setColor(p, p.kT); }
      if (p.pose === 'frozen') { p.v.root.position.set(p.x + (Math.sin(p.t * 37) > 0.97 ? 0.01 : 0), p.y, p.z); continue; }
      const dx = Y.x - p.x, dz = Y.z - p.z, near = Math.hypot(dx, dz) < 5;
      const N = { x: p.x, y: p.y, z: p.z, yaw: p.yaw, talk: p.talking ? 1 : 0, wave: p.wave > 0, walking: false };
      if (near || p.talking) p.yaw = dampAngle(p.yaw, Math.atan2(dx, dz), 4, dt);
      p.wave = Math.max(0, p.wave - dt);
      ACTORS.animateVillager(p.v, N, dt, t);
      if (p.v.guitar) p.v.arms[1].rotation.set(-1.0 + Math.sin(t * 8) * 0.15 * (p.strum || 0), 0, -0.9);
      p.v.head.rotation.x = 0; p.v.body.rotation.x = 0;
    }
    // Noa's echo: a slow float, a warm flicker; she turns to you
    { const N = B.noa, dx = Y.x - N.x, dz = Y.z - N.z; N.body.position.y = 0.06 + Math.sin(t * 1.5) * 0.05; N.root.rotation.y = dampAngle(N.root.rotation.y, Math.atan2(dx, dz), 3, dt);
      const cam = G.w3d.camera.position, near = smoothstep(1.5, 6, Math.hypot(cam.x - N.x, cam.z - N.z));     // (softer up close: additive light piles up)
      N.M.opacity = (0.3 + 0.06 * Math.sin(t * 2.3)) * (0.45 + 0.55 * near) * (N.show ? 1 : 0); N.halo.material.opacity = (0.3 + 0.08 * Math.sin(t * 1.7)) * (0.3 + 0.7 * near) * (N.show ? 1 : 0); N.root.visible = N.show;
      N.arms[1].rotation.set(N.talking ? -0.6 + Math.sin(t * 6) * 0.25 : -0.25, 0, -0.15); N.arms[0].rotation.set(-0.5, 0, 0.35); }
    // the crowd's colors (the bell)
    if (B.crowd && B.crowd.k !== B.crowd.kT) { B.crowd.k = Math.min(B.crowd.kT, B.crowd.k + dt * 0.5); crowdColor(B.crowd.k); }
    // the Great Silence: it breathes over the tower, its fog circling; it rises out of the belfry, and fades when beaten
    { const Sl = B.sil; if (Sl.g.visible) { Sl.rise = damp(Sl.rise, Sl.riseT, 1.2, dt); const tw = tower(); Sl.g.position.y = gy(tw.x, tw.z) + lerp(9.5, 16.5, Sl.rise) + Math.sin(t * 0.7) * 0.35; Sl.g.scale.setScalar(lerp(0.2, 1.25, Sl.rise) * (1 + Math.sin(t * 1.1) * 0.02));
      Sl.g.rotation.y = Math.atan2(Y.x - Sl.g.position.x, Y.z - Sl.g.position.z) * 0.6;
      Sl.fog.forEach(f => { const a = f.a + t * 0.25; f.sp.position.set(Math.cos(a) * f.r, f.y + Math.sin(t * 0.8 + f.ph) * 0.3, Math.sin(a) * f.r); });
      Sl.eyes.forEach((e, i) => { e.material.opacity = 0.75 + 0.2 * Math.sin(t * 2 + i); }); } }
    // the bell: it swings once it's rung
    { const Bl = B.bell; Bl.swing = damp(Bl.swing, 0, 0.6, dt); Bl.g.rotation.z = (s.rang ? 0 : 0.12) + Math.sin(t * 3.2) * Bl.swing * 0.35; Bl.gl.material.opacity = s.rang ? 0.35 + 0.15 * Math.sin(t * 2) : 0; }
    // the seal on the door breathes; the motes drift
    if (B.seal.visible) B.seal.children.forEach((sp, i) => { sp.material.opacity = 0.8 + 0.15 * Math.sin(t * 1.3 + i); sp.scale.setScalar(1.3 + Math.sin(t * 0.9 + i) * 0.08); });
    if (B.motes) { const M = B.motes; M.pts.material.opacity = 0.55 * (1 - k); for (let i = 0; i < M.seeds.length; i++) { const m = M.seeds[i]; M.pos[i * 3] = m.x + Math.sin(t * 0.2 + m.ph) * 1.2; M.pos[i * 3 + 1] = gy(m.x, m.z) + m.y + Math.sin(t * 0.33 + m.ph * 2) * 0.5; M.pos[i * 3 + 2] = m.z + Math.cos(t * 0.17 + m.ph) * 1.2; } M.pts.geometry.attributes.position.needsUpdate = true; }
    // the five's solids follow them (they don't move, but a woken one may be sent somewhere by a scene)
    B.solids.forEach((c, i) => { const p = B.byId[['nico', 'rosa', 'tito', 'marta', 'bruno'][i]]; c._x = p.x; c._z = p.z; c.x = p.x; c.z = p.z; });
    if (typeof FSCN !== 'undefined' && FSCN.tick) { try { FSCN.tick(dt, t); } catch (e) { console.error('[future] tick', e); } }
  }

  // ------------------------------------------------------------ what you can press E on (only the realm's things: it's a room)
  const ready = () => typeof FSCN !== 'undefined';
  function interactables() {
    if (!inside || !B || !ready()) return [];
    const s = S(), list = [], y = undefined;
    const N = B.noa;
    if (N.show) list.push({ x: N.x, z: N.z, r: 2.6, y, label: QUESTS.reportDue && QUESTS.reportDue('noa_f') ? 'Report' : 'Talk', run: () => FSCN.noa() });
    for (const id of ['nico', 'rosa', 'tito', 'marta', 'bruno']) {
      const p = B.byId[id], w = woken(id);
      const open = id === 'nico' ? false : id === 'bruno' ? !!s.rep : !!s.demo;
      if (w) list.push({ x: p.x, z: p.z, r: 2.3, y, label: 'Talk', who: 'future:' + id, p, run: () => FSCN.chat(id) });      // (who: for STORY.talkHooks; time_alba.js adds its puzzle)
      else if (open) list.push({ x: p.x, z: p.z, r: 2.4, y, label: 'Promise', run: () => FSCN.promise(id) });
      else list.push({ x: p.x, z: p.z, r: 2.0, y, label: 'Look', run: () => FSCN.look(id) });
    }
    if (B.banner) list.push({ x: B.banner.at.x, z: B.banner.at.z, r: 2.2, y, label: 'Read', run: () => FSCN.banner() });
    const d = doorAt();
    if (!s.door) list.push({ x: d.x, z: d.z + 1.2, r: 2.2, y, label: s.yard ? 'Wish' : 'Look', run: () => FSCN.door() });
    else if (!s.boss) list.push({ x: SPOT.towerFoot.x, z: SPOT.towerFoot.z, r: 2.8, y, label: s.trap ? 'Face it' : 'Set a trap', run: () => FSCN.silence() });
    else if (!s.rang) list.push({ x: SPOT.towerFoot.x, z: SPOT.towerFoot.z, r: 3.0, y, label: 'Say it, all together', run: () => FSCN.ring() });
    // the time cracks, the cross-time puzzles and their things (time.js)
    if (typeof TIME !== 'undefined' && TIME.interactables) { try { list.push(...TIME.interactables()); } catch (e) { console.error('[future] time', e); } }
    return list;
  }
  // the next thing to do (the compass, the minimap and Mimo's Q)
  function target() {
    if (!B) return null;
    const s = S(), Y = G.sim.you, n = noaSpot();
    if (!s.demo) return { x: n.x, z: n.z, hint: '{mimo} points at a pale, glowing figure. Noa?!' };
    const left = ['rosa', 'tito', 'marta'].filter(id => !woken(id));
    if (left.length) { const p = left.map(id => B.byId[id]).sort((a, b) => Math.hypot(a.x - Y.x, a.z - Y.z) - Math.hypot(b.x - Y.x, b.z - Y.z))[0]; return { x: p.x, z: p.z, hint: `{mimo} tugs you toward ${p.name}, gray and still. Promise them a tomorrow!` }; }
    if (!s.rep) return { x: B.noa.x, z: B.noa.z, hint: '{mimo} looks at Noa’s echo by the fountain. Tell her!' };
    if (!s.yard) { const p = B.byId.bruno; return { x: p.x, z: p.z, hint: '{mimo} points at Bruno’s yard, by the bell tower.' }; }
    const d = doorAt();
    if (!s.door) return { x: d.x, z: d.z + 1.0, hint: '{mimo} stares at the bell tower’s sealed door.' };
    if (!s.rang) return { x: SPOT.towerFoot.x, z: SPOT.towerFoot.z, hint: s.boss ? '{mimo} looks up at the cracked bell. Everyone’s gathering!' : '{mimo}’s ears go flat. The Great Silence, over the tower!' };
    return { x: B.noa.x, z: B.noa.z, hint: '{mimo} points at Noa, by the tower’s clock.' };
  }
  const has = n => typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(n);
  function song() { const s = S(); return s.door && !s.rang && has('future_bell') ? 'future_bell' : has('future') ? 'future' : 'village'; }
  // the minimap's area tab while you're here (minimap.js asks)
  const AREA = { id: 'future', name: 'Alba · tomorrow', color: '#6f6b84' };
  const areaAt = (x, z) => {
    if (inside && typeof ALBA_FUT_HALL !== 'undefined' && ALBA_FUT_HALL.inside && ALBA_FUT_HALL.area) { const a = ALBA_FUT_HALL.area(); if (a) return a; }     // (the old theater's rooms, the bakery, the new library: alba_future_hall.js)
    return inside && Math.hypot(x - CEN.x, z - CEN.z) < EDGE + 8 ? AREA : null;
  };
  const spot = id => (id === 'door' ? doorAt() : id === 'bell' ? bellAt() : id === 'noa' && B ? { x: B.noa.x, z: B.noa.z } : B && B.byId[id] ? { x: B.byId[id].x, z: B.byId[id].z } : SPOT[id] || null);

  // ------------------------------------------------------------ init; a save made in tomorrow goes back into it; Chapter 4's note
  let stateWas = null, soonShown = false, resumeT = 0;
  function outdoorTick(dt) {
    if (!G || inside || entering) return;
    if (G.state !== stateWas) { stateWas = G.state; soonShown = false; resumeT = 1.2; }
    const f = F();
    if (f.futureIn && !f.futureDone) { if ((resumeT -= dt) <= 0) { resumeT = 5; enter({ quick: true, scene: false }).then(() => { if (typeof FSCN !== 'undefined' && FSCN.resumed) STORY.run(FSCN.resumed); }); } return; }
    // (the "Chapter 4 · coming soon" card shows only when Chapter 4 isn't loaded)
    if (f.futureDone && !soonShown && typeof FSCN !== 'undefined' && typeof CH4 === 'undefined') { soonShown = true; setTimeout(() => { if (!STORY.busy && !inside) STORY.run(FSCN.soonCard); }, 1400); }
  }
  function init(game) {
    G = game;
    if (typeof STORY !== 'undefined' && STORY.extra) STORY.extra.push({ interactables: () => [], tick: dt => outdoorTick(dt) });
    try { if (typeof FSCN !== 'undefined' && FSCN.init) FSCN.init(game); } catch (e) { console.error('[future] scenes', e); }
  }

  Object.assign(api, {
    init, enter, leave, update, interactables, target, song, spot, areaAt, OUTSIDE, SPOT,
    _: { S, F, B: () => B, build, applyState, presentOn, solidsOn, tintOn, tintK, teleport, setColor, woken, colorGoal, placeNoa, noaSpot, doorAt, bellAt, tower, gy, crowdColor, lang,
      northOpen: setNorth, get north() { return northOpen; } },     // (Chapter 4, alba_future.js: the road north to the old theater)
  });
  Object.defineProperty(api, 'inside', { get: () => inside });
  return api;
})();

// ============================================================ the main quest: Chapter 3, the Future (a wrap of QUESTS.init, the
// way oldtower.js adds its steps; these go at the end). A step the Past left as a "coming soon" placeholder for the Future is
// taken out, and the Old Tower's "Into the Past (coming soon!)" counts as done once the Past is (flags.pastDone).
(() => {
  if (typeof QUESTS === 'undefined') return;
  const init0 = QUESTS.init;
  QUESTS.init = function (game) { init0.call(this, game); try { addFuture(game); } catch (e) { console.error('[quests: future]', e); } };
  function addFuture(G) {
    const main = QUESTS.LIST.find(q => q.id === 'main'); if (!main || main.steps.some(s => s.future)) return;
    for (const st of main.steps) if (typeof st.text === 'string' && /coming soon/i.test(st.text) && /\bpast\b/i.test(st.text)) { const d0 = st.done; st.done = s => !!s.flags.pastDone || !!s.flags.futureIn || !!s.flags.futureDone || d0(s); }
    for (let i = main.steps.length - 1; i >= 0; i--) { const t = main.steps[i].text; if (typeof t === 'string' && /coming soon/i.test(t) && /future/i.test(t)) main.steps.splice(i, 1); }
    const fs = s => s.future || {}, woke = (s, ids) => ids.filter(id => fs(s).woke && fs(s).woke[id]).length;
    const tg = () => (FUTURE.inside ? FUTURE.target() : null);
    const done = test => s => !!s.flags.futureDone || test(s);
    main.steps.push(
      { future: true, text: 'Alba, tomorrow: follow Noa’s echo to the plaza',
        why: 'The {w.clock} flung you forward: this is Alba as it will be if nobody speaks up. Gray, silent, overgrown. A pale echo of Noa, older, is waiting for you.',
        done: done(s => !!fs(s).demo), target: tg, hint: '{mimo} points at a pale, glowing figure. Noa?!' },
      { future: true, text: 'Wake the plaza with a promise ({n}/3)', n: s => woke(s, ['rosa', 'tito', 'marta']),
        why: 'Rosa, Tito and Marta are frozen round the plaza. Noa showed you how to reach them: say what WILL happen, a plan, a promise, in tomorrow’s words.',
        done: done(s => woke(s, ['rosa', 'tito', 'marta']) >= 3), target: tg, hint: '{mimo} tugs you toward someone gray and still. Promise them a tomorrow!' },
      { future: true, report: 'noa_f', text: '💬 Report to Noa by the dry fountain',
        why: 'Three voices are back. Noa’s echo is waiting by the fountain: she knows what comes next.',
        done: done(s => !!fs(s).rep), target: tg, hint: '{mimo} looks at Noa’s echo by the fountain.' },
      { future: true, text: 'Wake Bruno at his yard, and fight with tomorrow’s words',
        why: 'Bruno is frozen in his yard by the bell tower, and Hushlings nest there. Wake him, and he’ll show {mimo} how to fight here: say what WILL happen.',
        done: done(s => !!fs(s).yard), target: tg, hint: '{mimo} points at Bruno’s yard, by the bell tower.' },
      { future: true, text: 'Open the bell tower: tell the Silence what you would like',
        why: 'The bell tower’s door is sealed with Hush, and it swallows promises. But it can’t swallow a wish: say what you WOULD like.',
        done: done(s => !!fs(s).door), target: tg, hint: '{mimo} stares at the bell tower’s sealed door.' },
      { future: true, text: 'The Great Silence: set a trap, then face it',
        why: 'Everything the hooded figure never said has grown huge over the bell tower. It will come down on you: set a trap first. «If it comes down, {mimo} will hit it.»',
        done: done(s => !!fs(s).boss), target: tg, hint: '{mimo}’s ears go flat. The Great Silence, over the tower!' },
      { future: true, text: 'Ring the cracked bell, all together',
        why: 'The {w.bell} is free, but cracked. Everyone you woke is gathering at the tower. Say the plan with them, all together.',
        done: done(s => !!fs(s).rang), target: tg, hint: '{mimo} looks up at the cracked {w.bell}. Everyone’s gathering!' },
      { future: true, report: 'noa_f', text: '💬 Report to Noa by the tower’s clock',
        why: 'Alba is loud again, even here, tomorrow. Noa’s echo is waiting by the bell tower’s clock.',
        done: s => !!s.flags.futureDone, target: tg, hint: '{mimo} points at Noa, by the tower’s clock.' },
      { future: true, text: 'Chapter 4: the source of the Hush (coming soon!)',
        why: 'Noa is still trapped in the great {w.clock} at the top of the Old {w.tower}. The Hush began with one voice that went quiet: the hooded figure’s. Chapter 4 is coming soon.',
        done: () => false, target: () => (typeof OLDTOWER !== 'undefined' && OLDTOWER.doorSpot ? OLDTOWER.doorSpot() : null), hint: '{mimo} looks north, toward the Old {w.tower}.' });
    main.story.push(
      { when: s => !!fs(s).arrived, text: 'The {w.clock} flung you forward, into tomorrow: Alba, if nobody speaks up. Gray, overgrown and silent, the {w.bell:pl} cracked, everyone frozen. An echo of Noa, older, was waiting.' },
      { when: s => !!fs(s).rep, text: 'Promises woke them: «Mañana…». Rosa, Tito and Marta got their words back, one tomorrow at a time.' },
      { when: s => !!fs(s).door, text: 'Bruno taught {mimo} to fight in tomorrow’s words. Then a wish, not a promise, broke the seal on the bell tower’s door.' },
      { when: s => !!fs(s).rang, text: 'You beat the Great Silence, and all together you rang the cracked {w.bell}. All eight answered. Alba planned its Festival of Voices again.' },
      { when: s => !!s.flags.futureDone, text: 'Noa’s echo showed you a drawing: the hooded figure, young, at the Festival of Voices. «Every voice counts… his too.» The Hush began with his voice going quiet. Then the clock brought you home, to today.' });
  }
})();
