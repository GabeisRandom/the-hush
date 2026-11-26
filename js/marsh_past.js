'use strict';
// Candil long ago (DESIGN.md 21.1 "a clear lake village"; game/TIME.md §25 "The Gray Marsh (T4c)"): the morning after Lantern Night,
// when the gray that had followed the quiet young man since the concert settled over the clear lake. TIME dresses it (time_marsh.js MARSHT.DRESS.past); the land itself (the clear
// water, the green banks, the living willows, the reeds, the lilies) is TIME.land's (time_marsh_land.js). Today's people, Bruno, the
// wisps and the ground mist are set aside (MARSHT.hideToday); so are today's great lantern on its column (here the Lantern House stands
// in its place, four floors of stone with the great lantern at the top) and the drowned chapel (here it stands whole at the
// causeway's end). Here too: the lantern jetty off Candil's east shore, last night's paper lanterns floating by it, garlands, and a
// thin ribbon of gray mist from the jetty up toward the Old Tower's crag: the gray, gone up after him.
// The people of then (TIME's person kit): the old lamplighter (Lucero's grandmother, who taught the quiet young man to light the
// lamps), the mayor (Lantern Night's host), the ferryman (the twins' father), little Marisol, little Ramiro and little Tadeo (today's
// grown-ups as children), young Nieves (who rang the chapel's bell). Each language names the new ones its own way (MHPTXT.CAST).
// The main path (MARSHT.PSTEPS): the old lamplighter tells last night with every past in its place, and the card → her question → the
//   mayor, the ferryman, little Marisol and little Ramiro each tell a piece and ask you one thing (the scene, what happened, what he had
//   said, what he thought) → you tell her the whole story in four parts → her key → the Lantern House (marsh_past_dungeon.js) → the
//   Lantern Moth (marsh_time_boss.js) → the echo → Noa.
// Side quests (QUESTS.LIST): «Ramiro's note» (cross-time: say it for him in reported speech; he leaves it in a tin under a cairn by the
//   tower path; today it's rusty and today's Ramiro remembers writing it; tomorrow it's stone, unopened), «Nieves's willow» (cross-time:
//   a memory for {mimo} digs the hole; today one living willow among the dead ones; tomorrow the only tree that isn't stone),
//   «Marisol's paper lantern» (a memory for {mimo}, then the legend of Lantern Night, the imperfect of every year).
const MH_PAST = (() => {
  if (typeof TIME === 'undefined' || typeof MARSHT === 'undefined' || !MARSHT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = MARSHT, MS = MARSH, T = () => MHPTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('past');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are (checked with MARSHT._.t.probe in every world)
  const AT = {
    luz: { x: -10.2, z: -333.8, yaw: 0.9 }, mayor: { x: -3.4, z: -333.0, yaw: -1.6 }, ferry: { x: -24.2, z: -332.2, yaw: 1.5 },
    marisol: { x: -3.6, z: -336.6, yaw: -1.2 }, ramiro: { x: -20.6, z: -327.6, yaw: 2.4 }, tadeo: { x: -17.0, z: -328.4, yaw: 2.0 }, nieves: { x: -16.8, z: -343.4, yaw: -0.4 },
  };
  const HOUSE = { x: MS.LANTERN.x, z: MS.LANTERN.z, r: 2.6, ry: Math.atan2(7.6, 11.2) };
  const DOOR = { x: HOUSE.x + Math.sin(HOUSE.ry) * HOUSE.r, z: HOUSE.z + Math.cos(HOUSE.ry) * HOUSE.r };
  const DOORSPOT = { x: HOUSE.x + Math.sin(HOUSE.ry) * (HOUSE.r + 1.3), z: HOUSE.z + Math.cos(HOUSE.ry) * (HOUSE.r + 1.3) };
  const JETTY = { a: { x: -1.8, z: -334.8 }, b: { x: 4.6, z: -335.8 } };
  const LANTERN_AT = { x: 2.4, z: -337.2 };                        // (Marisol's paper lantern, bobbing under the jetty's end)
  const WILLOW = { x: -18.6, z: -345.6 };                         // (where Nieves's cutting goes in, by the causeway's foot)
  const NOTE = { x: 9.4, z: -371.4 };                             // (Ramiro's cairn, beside the tower path)
  const C = () => T().CAST;
  const LOOK = {
    luz: { skin: '#c98e62', hair: '#ece6dc', hairdo: 'bun', dress: '#b8742a', shawl: '#c9453a', hat: 'scarf', hatColor: '#6b4a30', prop: 'lantern', h: 0.94 },
    mayor: { skin: '#e6b48c', hair: '#5a3020', hairdo: 'braids', dress: '#3e7fb0', vest: '#f2e6c9', hat: 'flat', hatColor: '#2f3f5a', h: 1.0 },
    ferry: { skin: '#d9a27a', hair: '#3a2b26', hairdo: 'short', beard: true, hair2: '#3a2b26', dress: '#4f7a8a', vest: '#8a5a4a', hat: 'cap', hatColor: '#5a6f4a', wide: 1.06, h: 1.03 },
    marisol: { kid: true, skin: '#c98e62', hair: '#5a3020', hairdo: 'braids', dress: '#f2c94c', apron: '#f2e6c9', h: 0.62 },
    ramiro: { kid: true, skin: '#d9a27a', hair: '#3a2b26', hairdo: 'short', dress: '#8a5a4a', h: 0.6 },
    tadeo: { kid: true, skin: '#d9a27a', hair: '#3a2b26', hairdo: 'short', dress: '#4f7a8a', hat: 'cap', hatColor: '#5a6f4a', h: 0.6 },
    nieves: { skin: '#e6b48c', hair: '#3a2b26', hairdo: 'bun', dress: '#6a5a8a', shawl: '#d9c08a', prop: 'bell', h: 0.98 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('past', id);

  // ------------------------------------------------------------ the dressing: one merged mesh (and its ink hull) per group
  let built = null;
  const kit = () => PAST.API.Kit();
  const STONE = '#c9b8a0', STONE_D = '#b8a48a', WOOD = '#8a6440', WOOD_D = '#5a3a24', IRON = '#3a3036';
  // the Lantern House: a round stone tower, four floors, a balcony round the third, the great lantern under an iron dome at the top
  function house(k, KG) {
    const x = HOUSE.x, z = HOUSE.z, y = gy(x, z), r = HOUSE.r, ry = HOUSE.ry;
    k.add(KG.cyl, x, y + 0.25, z, r + 0.35, 0.5, r + 0.35, STONE_D, { ink: 0.02 });
    for (let f = 0; f < 4; f++) k.add(KG.cyl, x, y + 0.5 + f * 2.4 + 1.2, z, r - f * 0.12, 2.4, r - f * 0.12, f % 2 ? STONE : '#d4c4aa', { ink: 0.025 });
    for (let f = 0; f < 4; f++) k.add(KG.cyl, x, y + 0.5 + (f + 1) * 2.4, z, r - f * 0.12 + 0.08, 0.14, r - f * 0.12 + 0.08, STONE_D, { ink: 0.008 });
    // windows round each floor (dark slits), the door facing the landing
    for (let f = 0; f < 4; f++) for (let i = 0; i < 5; i++) {
      const a = ry + Math.PI * 0.4 + i * Math.PI * 0.32, rr = r - f * 0.12 + 0.02;
      k.box(x + Math.sin(a) * rr, y + 1.9 + f * 2.4, z + Math.cos(a) * rr, 0.42, 0.8, 0.08, '#2b2235', { ry: a, ink: 0 });
    }
    k.box(DOOR.x, y + 1.0, DOOR.z, 1.1, 2.0, 0.12, '#5a3a24', { ry, ink: 0.012 }).box(DOOR.x + Math.cos(ry) * 0.38, y + 1.0, DOOR.z - Math.sin(ry) * 0.38, 0.08, 0.08, 0.08, '#c9a24a', { ry, ink: 0 });
    k.add(KG.half || KG.sphere, DOOR.x, y + 2.0, DOOR.z, 0.62, 0.36, 0.1, STONE_D, { ry, ink: 0.008 });
    // the balcony round the third floor: a ring of planks and a railing
    const yb = y + 0.5 + 2 * 2.4 + 2.4;
    k.add(KG.cyl, x, yb, z, r + 0.9, 0.12, r + 0.9, WOOD, { ink: 0.012 });
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; k.add(KG.cyl6, x + Math.sin(a) * (r + 0.8), yb + 0.4, z + Math.cos(a) * (r + 0.8), 0.04, 0.8, 0.04, WOOD_D, { ink: 0 }); }
    k.add(KG.torus, x, yb + 0.8, z, r + 0.8, r + 0.8, 0.05, WOOD_D, { rx: Math.PI / 2, ink: 0 });
    // the top: a stone collar, the lantern room's iron frame, its dome and a little weathervane
    const yt = y + 0.5 + 4 * 2.4;
    k.add(KG.cyl, x, yt + 0.1, z, r - 0.2, 0.25, r - 0.2, STONE_D, { ink: 0.012 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; k.add(KG.cyl6, x + Math.sin(a) * 1.6, yt + 1.2, z + Math.cos(a) * 1.6, 0.06, 2.0, 0.06, IRON, { ink: 0 }); }
    k.add(KG.cone, x, yt + 2.75, z, 2.0, 1.2, 2.0, IRON, { ink: 0.02 }).add(KG.cyl6, x, yt + 3.6, z, 0.04, 0.8, 0.04, IRON, { ink: 0 }).box(x + 0.25, yt + 3.85, z, 0.5, 0.18, 0.02, '#c9a24a', { ink: 0 });
  }
  // the whole chapel at the causeway's end (as it was before the marsh: its roof on, its belfry straight, its bell)
  function chapel(k, KG) {
    const b = MS.CHAPEL, w = b.w, d = b.d, yw = -2.2, H = 7.6, tw = (lx, lz) => MS.toWorld ? MS.toWorld(b, lx, lz) : { x: b.x + lx * Math.cos(b.rot) + lz * Math.sin(b.rot), z: b.z - lx * Math.sin(b.rot) + lz * Math.cos(b.rot) };
    const SW = ['#d8ccb4', '#cdbfa6', '#e0d4bc'], ry = b.rot;
    const bx = (lx, ly, lz, sx, sy, sz, col, o = {}) => { const p = tw(lx, lz); k.box(p.x, ly, p.z, sx, sy, sz, col, Object.assign({ ry }, o)); };
    for (const s of [-1, 1]) bx(s * (w / 2), yw + H / 2, 0, 0.6, H, d, SW[(s + 1) / 2 | 0], { ink: 0.025 });
    bx(0, yw + H / 2, -d / 2, w + 0.6, H, 0.6, SW[2], { ink: 0.025 });
    for (const s of [-1, 1]) bx(s * (w / 4 + 0.55), yw + H / 2, d / 2, w / 2 - 1.1, H, 0.6, SW[0], { ink: 0.025 });
    bx(0, yw + H - 1.3, d / 2, 2.2, 2.6, 0.6, SW[1], { ink: 0.02 });
    bx(0, 0.62 + 1.25, d / 2 + 0.22, 1.7, 2.5, 0.12, '#6b4a30', { ink: 0.02 });
    { const p = tw(0, d / 2 + 0.31); k.add(KG.cyl, p.x, 4.4, p.z, 0.75, 0.06, 0.75, '#4a6a9a', { rx: Math.PI / 2, ry, ink: 0.02 }).add(KG.cyl, p.x + Math.sin(ry) * 0.03, 4.4, p.z + Math.cos(ry) * 0.03, 0.5, 0.06, 0.5, '#e8c04a', { rx: Math.PI / 2, ry, ink: 0 }); }
    // the roof, whole: two slopes of red tiles over the nave
    for (const s of [-1, 1]) bx(s * (w / 4 + 0.05), yw + H + 1.25, 0, w / 2 + 0.9, 0.26, d + 0.6, '#b4533a', { rz: -s * 0.55, ink: 0.02 });
    // the belfry behind it, straight, its arches open and its bell in them
    const bp = tw(0.6, -d / 2 - 1.7);
    k.box(bp.x, yw + 6.3, bp.z, 3.0, 12.6, 3.0, SW[1], { ry, ink: 0.025 }).box(bp.x, yw + 12.9, bp.z, 3.4, 0.4, 3.4, SW[2], { ry, ink: 0.02 }).add(KG.cone4 || KG.cone, bp.x, yw + 14.3, bp.z, 2.3, 2.6, 2.3, '#b4533a', { ry: ry + Math.PI / 4, ink: 0.02 });
    k.add(KG.cyl, bp.x, yw + 11.6, bp.z, 0.7, 1.0, 0.7, '#c9a24a', { ink: 0.015 });
  }
  // the lantern jetty off Candil's east shore (posts and planks), last night's paper lanterns on the water, garlands, the boats
  function props(k) {
    const KG = PAST.API.KG, W0 = WORLD.L.water;
    house(k, KG); chapel(k, KG);
    const a = JETTY.a, b = JETTY.b, l = Math.hypot(b.x - a.x, b.z - a.z), ry = Math.atan2(b.x - a.x, b.z - a.z), n = Math.round(l / 0.42);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; k.box(lerp(a.x, b.x, t), 0.62, lerp(a.z, b.z, t), 1.7, 0.1, 0.38, i % 3 ? '#a8784a' : '#9a6a40', { ry, ink: 0.006 }); }
    for (let t = 0; t <= 1.01; t += 0.25) for (const s of [-1, 1]) k.add(KG.cyl6, lerp(a.x, b.x, t) + Math.cos(ry) * s * 0.78, -0.4, lerp(a.z, b.z, t) - Math.sin(ry) * s * 0.78, 0.07, 2.2, 0.07, WOOD_D, { ink: 0.004 });
    // two lantern poles at the jetty's end, with the hooks where the lanterns hung
    for (const s of [-1, 1]) { const x = b.x + Math.cos(ry) * s * 0.8, z = b.z - Math.sin(ry) * s * 0.8; k.add(KG.cyl6, x, 1.6, z, 0.06, 2.4, 0.06, WOOD_D, { ink: 0.004 }).add(KG.cyl6, x, 2.75, z, 0.03, 0.3, 0.03, IRON, { rz: 0.9, ink: 0 }); }
    // last night's paper lanterns, adrift and dark
    const LC = ['#f2c94c', '#e2574c', '#4c7fd8', '#5fae4f', '#f4efe2', '#c96fa8'];
    const drift = [[6.2, -333.4], [7.4, -337.0], [5.0, -339.6], [8.8, -335.2], [3.4, -331.6], [9.6, -339.0], [6.6, -341.4], [1.2, -340.0]];
    drift.forEach(([x, z], i) => { k.box(x, W0 + 0.16, z, 0.36, 0.32, 0.36, LC[i % LC.length], { ry: i * 0.7, rz: (i % 2 ? 0.2 : -0.15), ink: 0.006 }).box(x, W0 + 0.34, z, 0.2, 0.05, 0.2, '#6b4a30', { ry: i * 0.7, ink: 0 }); });
    // garlands from the Lantern House to the jetty: a string with little paper flags
    const gp = [[HOUSE.x + 2.6, HOUSE.z + 1.2, 4.4], [-7.0, -333.6, 3.0], [a.x, a.z, 2.6]];
    for (let j = 0; j < gp.length - 1; j++) {
      const [x0, z0, y0] = gp[j], [x1, z1, y1] = gp[j + 1];
      for (let i = 0; i <= 10; i++) { const t = i / 10, x = lerp(x0, x1, t), z = lerp(z0, z1, t), y = lerp(y0 + gy(x0, z0), y1 + gy(x1, z1), t) - Math.sin(t * Math.PI) * 0.5; k.add(KG.cone, x, y - 0.12, z, 0.1, -0.24, 0.04, LC[(i + j) % LC.length], { ry: Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2, ink: 0 }); }
    }
    k.add(KG.cyl6, -7.0, gy(-7.0, -333.6) + 1.5, -333.6, 0.05, 3.0, 0.05, WOOD_D, { ink: 0.004 });
    // a canoe pulled up on the shore by the jetty, a basket of new paper lanterns not yet floated
    let y = gy(-2.8, -331.0); k.add(KG.sphere, -2.8, y + 0.18, -331.0, 0.36, 0.2, 1.5, '#c9643f', { ry: 0.3, ink: 0.01 });
    y = gy(-4.6, -335.6); k.add(KG.cyl, -4.6, y + 0.25, -335.6, 0.32, 0.5, 0.32, '#b8955a', { ink: 0.008 }); for (let i = 0; i < 3; i++) k.box(-4.6 + (i - 1) * 0.16, y + 0.56, -335.6, 0.14, 0.14, 0.14, LC[i], { ry: i, ink: 0 });
  }
  // the gray, gone up after him: a ribbon of mist from the jetty's end, low over the clear water, up toward the Old Tower's crag
  function grayRibbon() {
    if (!MS.puffs) return null;
    const list = [], R = rng(1177);
    const path = [[JETTY.b.x, JETTY.b.z, 0.4], [5.6, -340, 0.8], [7.2, -347, 1.2], [8.6, -354, 1.8], [9.8, -361, 2.8], [11.2, -368, 4.0], [12.4, -375, 5.6], [13.2, -381, 7.4], [13.8, -388, 9.4]];
    for (let i = 0; i < path.length - 1; i++) for (let j = 0; j < 7; j++) {
      const t = j / 7, [x0, z0, y0] = path[i], [x1, z1, y1] = path[i + 1];
      list.push({ x: lerp(x0, x1, t) + (R() - 0.5) * 2.2, y: WORLD.L.water + lerp(y0, y1, t) + R() * 0.8, z: lerp(z0, z1, t) + (R() - 0.5) * 2.2, s: 2.4 + R() * 2.8, ph: R() * 9 });
    }
    const g = new THREE.Group(); g.name = 'mh-past-grayribbon'; G().w3d.scene.add(g);
    const F = MS.puffs(g, list, { color: '#a9a8b6', opacity: 0.5 });
    g.visible = false;
    return { g, F };
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'mh-past-' + name; const k = kit(); fn(k); k.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), solids: [] };
    // the great lantern at the top of the Lantern House: its panes (dark this morning; lit once the echo's free) and its glow
    const yt = gy(HOUSE.x, HOUSE.z) + 0.5 + 4 * 2.4;
    const pane = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.7, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#5a5a66', transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    pane.position.set(HOUSE.x, yt + 1.15, HOUSE.z); pane.visible = false; scene.add(pane); built.pane = pane;
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd77a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.set(HOUSE.x, yt + 1.2, HOUSE.z); glow.scale.setScalar(9); glow.visible = false; scene.add(glow); built.glow = glow;
    // Marisol's lantern under the jetty (a soft bob), young Nieves's cutting by the causeway
    const lan = new THREE.Group(); lan.position.set(LANTERN_AT.x, WORLD.L.water + 0.14, LANTERN_AT.z); scene.add(lan); lan.visible = false;
    const kl = kit(); kl.box(0, 0, 0, 0.42, 0.36, 0.42, '#4c7fd8', { ink: 0.008 }).add(PAST.API.KG.cone, 0, 0.3, 0, 0.18, 0.2, 0.18, '#f2c94c', { ink: 0 }); kl.build(lan); built.lan = lan;
    const fog = grayRibbon(); if (fog) built.fog = fog;
    // the clear lake: today's dark water swapped for clear water (the sandy bed shows through it: time_marsh_land.js colors the bed)
    const wm = new THREE.Mesh(new THREE.PlaneGeometry(150, 180), new THREE.MeshToonMaterial({ color: '#4f9fbc', gradientMap: TK.grad, transparent: true, opacity: 0.62, depthWrite: false }));
    wm.rotation.x = -Math.PI / 2; wm.position.set(-16, WORLD.L.water + 0.035, -346); wm.receiveShadow = true; wm.visible = false; wm.name = 'mh-past-water'; scene.add(wm); built.water = wm;
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    add(HOUSE.x, HOUSE.z, HOUSE.r + 0.3); add(-2.8, -331.0, 0.5); add(-4.6, -335.6, 0.4); add(-7.0, -333.6, 0.15);
    WORLD.extra.push(...built.solids);
    return built;
  }
  const solidsOn = on => { if (built) built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); };
  const lit = () => !!(G().state.ch4 && G().state.ch4.echoes && G().state.ch4.echoes['marsh.past']);
  function show(on) {
    const Bt = build(), s = st();
    Bt.props.visible = on; Bt.pane.visible = on; Bt.glow.visible = on; Bt.water.visible = on;
    Bt.lan.visible = on && !!s.lanternAsked && !s.lanternFound;
    if (Bt.fog) Bt.fog.g.visible = on;
    solidsOn(on);
  }
  let hid = [];
  function update(dt, t) {
    const Bt = built; if (!Bt) return;
    const L0 = lit() ? 1 : 0;
    Bt.pane.material.color.set(L0 ? '#ffe9a0' : '#5a5a66'); Bt.glow.material.opacity = L0 * (0.7 + 0.1 * Math.sin(t * 6));
    if (Bt.lan.visible) Bt.lan.position.y = WORLD.L.water + 0.14 + Math.sin(t * 1.6) * 0.04;
    if (Bt.fog && Bt.fog.F && Bt.fog.F.mat) Bt.fog.F.mat.uniforms.uK.value = lit() ? 0.55 : 1;
  }
  function late(dt) { M.showToday(dt, hid); }
  // today's things that long ago aren't there yet (or aren't like that): the great lantern on its column, the drowned chapel, the stone
  // lanterns' flames (out, the morning after), the ground mist
  function hideOld(api) {
    const Mm = M.marshMeshes(), out = [];
    const hide = o => { if (o && o.visible !== false) { api.hide(o); out.push(o); } };
    (Mm.lanternMeshes || []).forEach(hide);
    hide(Mm.water);
    if (Mm.chapel) { (Mm.chapel.meshes || []).forEach(hide); hide(Mm.chapel.bel); }
    const Bm = M.B(); if (Bm && Bm.objects && Bm.objects.stones) Bm.objects.stones.forEach(s => { hide(s.flame); hide(s.core); hide(s.glow); });
    if (Bm && Bm.objects && Bm.objects.near) for (const c of Bm.objects.near.children) if (c.isSprite && c.material && c.material.map === TK.glowTex && Math.abs(c.scale.x - 1.6) < 0.01) hide(c);      // (Candil's little lamps' glow: out, the morning after)
    return out;
  }

  // ------------------------------------------------------------ talking to the people of then (the main path first; side quests come
  // through STORY.talkHooks below, as a little menu)
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const chats = {};
  const cycle = (id, keys) => { chats[id] = ((chats[id] || 0) + 1) % keys.length; return say1(id, keys[chats[id]]); };
  const heardN = () => M.HEARD.filter(k => st().heard && st().heard[k]).length;
  const done = () => lit();
  function talk(id) {
    const s = st();
    switch (id) {
      case 'luz': return !s.met ? luzScene() : !s.told ? (heardN() >= 4 ? storyScene() : say1('luz', 'luz.again')) : done() ? cycle('luz', ['luz.done', 'luz.chat1', 'luz.chat2']) : cycle('luz', ['luz.key', 'luz.chat1', 'luz.chat2']);
      case 'mayor': case 'ferry': case 'marisol': case 'ramiro':
        if (!(s.heard && s.heard[id])) return heardScene(id);
        return id === 'mayor' ? cycle('mayor', ['mayor.chat', 'mayor.chat2']) : id === 'ferry' ? say1('ferry', 'ferry.chat') : id === 'marisol' ? say1('marisol', 'marisol.chat') : say1('ramiro', s.noteDone ? 'note.placed' : 'ramiro.chat');
      case 'tadeo': return cycle('tadeo', ['tadeo.chat1', 'tadeo.chat2']);
      case 'nieves': return cycle('nieves', ['nieves.1', 'nieves.2']);
      default: return null;
    }
  }
  // the main path, 1: the old lamplighter tells last night with every past in its place, the card, her question
  async function luzScene() {
    const s = st(), P = () => who('luz'); if (!P()) return;
    M.lock(true);
    try { M.frame2(P()); await wait(0.4); await M.say(P(), ln('luz.hello')); await M.demo(P(), T().DEMO['luz.demo'], T().MARKS['luz.demo']); } finally { M.lock(false); }
    await M.card(T().CARDS.story);
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln('luz.task')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.luz1, { tips: T().TIPS }); if (!r) { M.think('{luz} is waiting: what was she doing when the lights went out?', 4.5); return; }
    TIME.grade('mp.luz', r.letter);
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln('luz.after')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('{mayor} is by the jetty, little {marisol} too. {ferry} is at the dock, little {ramiro} by the twins’ hut.', 6);
  }
  // the main path, 2: each of the four tells a piece (a demonstration) and asks you one thing
  async function heardScene(id) {
    const s = st(), P = () => who(id); if (!P()) return;
    if (!s.met) { M.lock(true); try { M.frame2(P()); await M.say(P(), ln(id === 'ramiro' ? 'ramiro.chat' : id === 'marisol' ? 'marisol.chat' : id + '.chat')); } finally { M.lock(false); } M.think('The old lamplighter, by the Lantern House in the middle of Candil… start with her.', 4.5); return; }
    M.lock(true);
    try { M.frame2(P(), id === 'ramiro' || id === 'marisol' ? -1 : 1); await wait(0.3); await M.demo(P(), T().DEMO[id + '.demo'], T().MARKS[id + '.demo']); } finally { M.lock(false); }
    if (id === 'marisol' && !s.saidCard) { await M.card(T().CARDS.said); s.saidCard = true; G().save(); }
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln(id + '.task')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS[id], { tips: T().TIPS }); if (!r) { M.think('They’re waiting for your answer.', 4); return; }
    TIME.grade('mp.' + id, r.letter);
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln(id + '.after')); (s.heard || (s.heard = {}))[id] = r.letter; G().save(); } finally { M.lock(false); }
    const n = heardN();
    M.think(n >= 4 ? 'That’s all four. Tell {luz}, at the Lantern House, the whole story.' : `What happened last night (${n}/4).`, 5);
  }
  // the main path, 3: the whole story, told back to the old lamplighter in four parts (the scene, before, what happened, what he'd said)
  async function storyScene() {
    const s = st(), P = () => who('luz'); if (!P()) return;
    M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('luz.ask')); } finally { M.lock(false); }
    const parts = ['s1', 's2', 's3', 's4'].map(k => T().TASKS[k]);
    s.storyParts = s.storyParts || [];
    const r = await M.story(parts, { tips: T().TIPS, done: s.storyParts,
      before: async i => { M.lock(true); try { M.frame2(P()); await M.say(P(), ln('luz.s' + (i + 1))); } finally { M.lock(false); } },
      onPart: async (i, r0) => { s.storyParts[i] = r0.letter; TIME.grade('mp.story' + (i + 1), r0.letter); G().save(); } });
    if (!r) { M.think('{luz} is waiting: tell her the whole story, from the beginning.', 4.5); return; }
    M.lock(true);
    try {
      M.frame2(P()); await M.say(P(), ln('luz.told')); await M.say(P(), ln('luz.told2'));
      const g = G(), tp = { x: 13.0, z: -383.0 };
      M.shot(V(HOUSE.x + 9, 8.5, HOUSE.z + 6), V(tp.x, 9.0, tp.z), 1.2); await wait(2.2);
      M.frame2(P()); await M.say(P(), ln('luz.key'));
      s.told = r.letter; TIME.flag('past', 'mhOpen', true); g.save();
      UI.toast('Got: the Lantern House’s key'); snd('chest');
    } finally { M.lock(false); }
    M.think('The Lantern House’s door, facing the landing. He went up there with the last light.', 5);
  }

  // ------------------------------------------------------------ side quest: «Ramiro's note» (the Past changes today and tomorrow)
  async function noteScene() {
    const s = st(), P = () => who('ramiro'); if (!P()) return;
    M.lock(true); try { M.frame2(P(), -1); await wait(0.3); await M.say(P(), ln('note.ask')); s.noteAsked = true; G().save(); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.note, { tips: T().TIPS }); if (!r) { M.think('Little {ramiro} is waiting, his pencil ready: «Ramiro said that…»', 4.5); return; }
    TIME.grade('mp.note', r.letter);
    M.lock(true);
    try {
      M.frame2(P(), -1); await M.say(P(), ln('note.done'));
      TIME.flag('past', 'mhNote', true); TIME.refresh(); s.noteDone = true; G().save();
      M.shot(V(NOTE.x - 4.2, gy(NOTE.x, NOTE.z) + 3.0, NOTE.z + 4.0), V(NOTE.x, gy(NOTE.x, NOTE.z) + 0.6, NOTE.z), 1.0); await wait(1.4);
      G().w3d.fx.sparkle(NOTE.x, gy(NOTE.x, NOTE.z) + 0.8, NOTE.z, 12, ['#fff3c8', '#e8e0cf']); snd('chime'); await wait(0.8);
      G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); snd('chest');
    } finally { M.lock(false); }
    M.think('A note in a tin, under a cairn by the tower path… Will it still be there today?', 5);
  }
  // the cairn: new long ago, mossy today (its tin rusty), stone tomorrow, still unopened
  function cairnMesh(w) {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, x = NOTE.x, z = NOTE.z, y = gy(x, z);
    const cols = w === 'past' ? ['#a89a88', '#9a8c7a', '#b8aa96'] : w === 'now' ? ['#7a8070', '#6f7566', '#858a78'] : ['#9a9894', '#8a8884', '#a8a6a2'];
    for (let i = 0; i < 7; i++) { const a = i * 2.4, rr = i < 4 ? 0.42 : 0.2, yy = i < 4 ? 0.16 : i < 6 ? 0.42 : 0.62; k.add(KG.sphere, x + Math.cos(a) * rr * (i < 6 ? 1 : 0), y + yy, z + Math.sin(a) * rr * (i < 6 ? 1 : 0), 0.32 - i * 0.025, 0.2, 0.28, cols[i % 3], { ry: a, ink: 0.008 }); }
    const tin = w === 'past' ? '#b8c4cc' : w === 'now' ? '#a8643a' : '#8f8d88';
    k.add(KG.cyl, x + 0.32, y + 0.1, z + 0.3, 0.12, 0.16, 0.12, tin, { ink: 0.004 });
    if (w === 'now') for (let i = 0; i < 4; i++) k.add(KG.sphere, x + Math.cos(i * 1.7) * 0.34, y + 0.3, z + Math.sin(i * 1.7) * 0.34, 0.16, 0.06, 0.12, '#5f7a4a', { ink: 0 });
    k.build(g); g.name = 'mh-note-' + w;
    return { obj: g, solids: [{ x, z, r: 0.5 }] };
  }
  const noteLook = w => async () => {
    const l = lang(), tx = M.plainT((T().NAMES.noteText[l] || T().NAMES.noteText.en));
    if (w === 'past') { M.lookAt('w.mhp_cairn', `Little {ramiro}’s {w.mhp_cairn}: flat stones, and a shiny {w.ruf_can} under them. Inside, in a child’s pencil: «${tx}»`, 7); return; }
    if (w === 'now') {
      M.lookAt('w.mhp_cairn', `An old {w.mhp_cairn} by the tower path, green with {w.ml_moss}. Under it, a rusty {w.ruf_can}… and inside, a child’s {w.rup_note}, faded: «${tx}» Nobody ever opened it.`, 9);
      const n = M.st('now'); if (!n.noteSeen) { n.noteSeen = true; G().save(); }
      return;
    }
    M.lookAt('w.mhp_cairn', `The {w.mhp_cairn} has turned to stone, and the {w.ruf_can} with it. The {w.rup_note} is still inside. Still waiting for him.`, 7);
    const f = M.st('future'); if (!f.noteSeen) { f.noteSeen = true; G().save(); }
  };
  TIME.effect('marsh.note', { region: 'marsh', when: () => !!TIME.flag('past', 'mhNote'),
    show: { past: () => cairnMesh('past'), now: () => cairnMesh('now'), future: () => cairnMesh('future') },
    act: { past: { x: NOTE.x - 1.0, z: NOTE.z + 0.6, r: 1.3, label: 'Look', run: noteLook('past') }, now: { x: NOTE.x - 1.0, z: NOTE.z + 0.6, r: 1.3, label: 'Look', run: noteLook('now') }, future: { x: NOTE.x - 1.0, z: NOTE.z + 0.6, r: 1.3, label: 'Look', run: noteLook('future') } } });

  // ------------------------------------------------------------ side quest: «Nieves's willow» (the Past changes today and tomorrow)
  async function willowAsk() {
    const s = st(), P = () => who('nieves'); if (!P()) return;
    M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('willow.ask')); s.willowAsked = true; G().save(); } finally { M.lock(false); }
    M.think('A spot by the causeway’s foot, all stones. Tell {mimo} what it did, as a memory.', 5);
  }
  async function digScene() {
    const s = st();
    const r = await M.ask(M.memTask(T().MEM.willow), { icon: 'dig' }); if (!r) { M.think('The bank is all stones. Tell {mimo} what it did, as a memory.', 4); return; }
    TIME.grade('mp.dig', r.letter);
    M.lock(true);
    try {
      const g = G(), y = gy(WILLOW.x, WILLOW.z);
      M.shot(V(WILLOW.x + 2.6, y + 2.2, WILLOW.z + 2.8), V(WILLOW.x, y + 0.3, WILLOW.z)); g.sim.mimoGo({ x: WILLOW.x + 0.6, z: WILLOW.z + 0.6 }, WILLOW); await wait(0.9);
      for (let i = 0; i < 5; i++) { snd('crunch'); g.w3d.fx.puff(WILLOW.x, y + 0.2, WILLOW.z, 6, 0.2, '#7a6a52'); await wait(0.2); }
      s.willowDug = true; G().save(); snd('chest'); g.sim.mimoSay('!', 1.2); await wait(0.6); g.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    M.think('A hole by the causeway. Tell {nieves}: she has the cutting.', 4.5);
  }
  async function willowPlant() {
    const s = st(), P = () => who('nieves'); if (!P()) return;
    M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('willow.planted')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.willow2, { tips: T().TIPS }); if (!r) { M.think('{nieves} is waiting: where did you plant it?', 4); return; }
    TIME.grade('mp.willow', r.letter);
    M.lock(true);
    try {
      M.frame2(P()); await M.say(P(), ln('willow.done'));
      TIME.flag('past', 'mhWillow', true); TIME.refresh(); s.willowDone = true; G().save();
      G().state.coins = (G().state.coins || 0) + 5; UI.toast('+5 coins'); snd('chest');
    } finally { M.lock(false); }
    M.think('A willow cutting by the causeway, long ago… Willows live a long time.', 5);
  }
  // the willow: a cutting long ago, a living weeping willow today among the dead ones, tomorrow the only tree that isn't stone
  function willowMesh(w) {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, x = WILLOW.x, z = WILLOW.z, y = gy(x, z);
    if (w === 'past') {
      k.add(KG.cyl6, x, y + 0.45, z, 0.04, 0.9, 0.04, '#7a5a3a', { ink: 0.004 });
      for (let i = 0; i < 5; i++) { const a = i * 1.26; k.add(KG.cone, x + Math.cos(a) * 0.12, y + 0.7, z + Math.sin(a) * 0.12, 0.05, -0.45, 0.05, '#7cc85a', { rx: Math.cos(a) * 0.3, rz: Math.sin(a) * 0.3, ink: 0 }); }
      k.add(KG.sphere, x, y + 0.04, z, 0.4, 0.06, 0.4, '#6b5236', { ink: 0 });
    } else {
      const s = w === 'now' ? 1.0 : 1.15, trunk = w === 'now' ? '#6b5236' : '#5a4632', leaf = w === 'now' ? ['#7cb85a', '#6aa84a', '#8cc86a'] : ['#7cc85a', '#5fae4f', '#9fd870'];
      k.add(KG.cyl6, x, y + 1.6 * s, z, 0.26 * s, 3.2 * s, 0.26 * s, trunk, { ink: 0.015 });
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, yy = (2.6 + (i % 3) * 0.35) * s; k.rod([x, yy + y, z], [x + Math.cos(a) * 1.5 * s, y + yy + 0.6 * s, z + Math.sin(a) * 1.5 * s], 0.07 * s, trunk, 0.008); for (let j = 0; j < 4; j++) k.add(KG.cone, x + Math.cos(a + j * 0.18) * (1.3 + j * 0.1) * s, y + yy + 0.2 * s, z + Math.sin(a + j * 0.18) * (1.3 + j * 0.1) * s, 0.12, -(1.4 + (j % 2) * 0.6) * s, 0.12, leaf[(i + j) % 3], { ink: 0 }); }
    }
    k.build(g); g.name = 'mh-willow-' + w;
    return { obj: g, solids: w === 'past' ? [] : [{ x, z, r: 0.4 }] };
  }
  const willowLook = w => async () => {
    if (w === 'past') { M.lookAt('w.mhp_cutting', 'Young {nieves}’s {w.tf_gd_willow} {w.mhp_cutting}, by the causeway’s foot. Five little green leaves.', 5.5); return; }
    if (w === 'now') {
      M.lookAt('w.mhp_weepingwillow', 'Among all the dead willows of the marsh, one is green: a big {w.mhp_weepingwillow} by the causeway, its branches down to the black water. Somebody planted it a long time ago.', 9);
      const n = M.st('now'); if (!n.willowSeen) { n.willowSeen = true; G().save(); }
      return;
    }
    M.lookAt('w.mhp_weepingwillow', 'Everything here is stone… except this {w.mhp_weepingwillow}. Its leaves are still green, still moving in the wind.', 8);
    const f = M.st('future'); if (!f.willowSeen) { f.willowSeen = true; G().save(); }
  };
  TIME.effect('marsh.willow', { region: 'marsh', when: () => !!TIME.flag('past', 'mhWillow'),
    show: { past: () => willowMesh('past'), now: () => willowMesh('now'), future: () => willowMesh('future') },
    act: { past: { x: WILLOW.x + 1.2, z: WILLOW.z + 0.8, r: 1.3, label: 'Look', run: willowLook('past') }, now: { x: WILLOW.x + 1.2, z: WILLOW.z + 0.8, r: 1.3, label: 'Look', run: willowLook('now') }, future: { x: WILLOW.x + 1.2, z: WILLOW.z + 0.8, r: 1.3, label: 'Look', run: willowLook('future') } } });

  // ------------------------------------------------------------ side quest: «Marisol's paper lantern» (a memory, then the legend)
  async function lanternAsk() {
    const s = st(), P = () => who('marisol'); if (!P()) return;
    M.lock(true); try { M.frame2(P(), -1); await wait(0.3); await M.say(P(), ln('lantern.ask')); s.lanternAsked = true; G().save(); } finally { M.lock(false); }
    if (built) built.lan.visible = true;
    M.think('A blue paper lantern bobs under the end of the jetty. Tell {mimo} what it did, as a memory.', 5);
  }
  async function swimScene() {
    const s = st();
    const r = await M.ask(M.memTask(T().MEM.lantern), { icon: 'swim' }); if (!r) { M.think('Marisol’s lantern bobs under the jetty. Tell {mimo} what it did, as a memory.', 4); return; }
    TIME.grade('mp.swim', r.letter);
    M.lock(true);
    try {
      const g = G(), Lp = LANTERN_AT;
      M.shot(V(Lp.x - 3.4, 2.6, Lp.z + 3.4), V(Lp.x, 0.2, Lp.z)); g.sim.mimoGo({ x: Lp.x - 0.4, z: Lp.z + 0.4 }, Lp); await wait(1.0);
      for (let i = 0; i < 3; i++) { snd('swoosh'); g.w3d.fx.puff(Lp.x, WORLD.L.water + 0.1, Lp.z, 5, 0.18, '#dfe9e6'); await wait(0.25); }
      s.lanternFound = true; if (built) built.lan.visible = false; G().save(); snd('chest'); g.sim.mimoSay('!', 1.2); await wait(0.6); g.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    UI.toast('Found: Marisol’s blue paper lantern');
    M.think('Little {marisol}’s lantern, a bit soggy. Take it back to her.', 4.5);
  }
  async function legendScene() {
    const s = st(), P = () => who('marisol'); if (!P()) return;
    M.lock(true); try { M.frame2(P(), -1); await wait(0.3); await M.say(P(), ln('lantern.legend')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.legend, { tips: T().TIPS }); if (!r) { M.think('Little {marisol} is waiting for the legend: what did people do every year?', 4); return; }
    TIME.grade('mp.legend', r.letter);
    M.lock(true); try { const P2 = P(); M.frame2(P2, -1); await M.say(P2, ln('lantern.done')); s.lanternDone = true; G().state.coins = (G().state.coins || 0) + 5; UI.toast('+5 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ the Talk menus: side quests (the main path's scenes play straight off a Talk)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'past' || TIME.regionNow() !== 'marsh') return null;
    const s = st();
    if (it.who === 'past:ramiro' && s.heard && s.heard.ramiro && !s.noteDone) return [{ label: 'A note for him', sub: '◆ side quest', run: noteScene }];
    if (it.who === 'past:nieves' && s.met && !s.willowAsked) return [{ label: 'The willow cutting', sub: '◆ side quest', run: willowAsk }];
    if (it.who === 'past:nieves' && s.willowDug && !s.willowDone) return [{ label: 'The willow cutting', sub: '◆ side quest', run: willowPlant }];
    if (it.who === 'past:marisol' && s.heard && s.heard.marisol && !s.lanternAsked) return [{ label: 'Your paper lantern?', sub: '◆ side quest', run: lanternAsk }];
    if (it.who === 'past:marisol' && s.lanternFound && !s.lanternDone) return [{ label: 'Your paper lantern', sub: '◆ side quest', run: legendScene }];
    return null;
  });
  // today: Ramiro (a grown-up twin) remembers the note, and Nieves (old now) the willow (marsh.js's people have no Talk menu of their
  // own, so these are E things next to them)
  const nowPerson = id => { const Bm = M.B(); return Bm && Bm.person ? Bm.person(id) : null; };
  async function nowSay(id, key, flag) {
    const p = nowPerson(id); if (!p) return;
    const q = { id, name: p.name || id, x: p.x, y: p.y, z: p.z, top: 2.1 };
    M.lock(true); try { p.talking = true; M.frame2(q); await M.say(q, ln(key)); const n = M.st('now'); n[flag] = true; G().save(); } finally { p.talking = false; M.lock(false); }
  }
  if (typeof STORY !== 'undefined' && STORY.extra) STORY.extra.push({ interactables() {
    const g = G(); if (!g || TIME.world() !== 'now' || !TIME.open('marsh')) return [];
    const Y = g.sim.you, out = [];
    if (Math.hypot(Y.x - MS.CANDIL.x, Y.z - MS.CANDIL.z) > MS.CANDIL.r + 8) return out;
    const r = nowPerson('ramiro'), n = nowPerson('nieves');
    if (TIME.flag('past', 'mhNote') && r) out.push({ x: r.x + 0.9, z: r.z - 0.9, r: 1.6, label: 'The note', run: () => nowSay('ramiro', 'now.ramiro.note', 'ramiroNote') });
    if (TIME.flag('past', 'mhWillow') && n) out.push({ x: n.x + 0.9, z: n.z + 0.9, r: 1.6, label: 'The willow', run: () => nowSay('nieves', 'now.nieves.willow', 'nievesWillow') });
    return out;
  } });

  // ------------------------------------------------------------ E: the way in, and the things you can look at
  const LOOKS = [
    { id: 'w.mhp_jetty', at: { x: -1.2, z: -333.2 }, line: () => 'The lantern {w.mhp_jetty}, out over the clear water. Last night everyone stood here with a {w.lf_paper_lantern}. Two empty hooks at the end, and wet {w.mhp_step:pl}.' },
    { id: 'w.lf_paper_lantern', at: { x: 0.4, z: -337.6 }, line: () => 'Every {w.lf_paper_lantern} from last night, adrift and dark: {w.mhp_tissuepaper} on {w.mhp_bamboo}, a little {w.mhp_pale} now. One for every {w.pf_wish}.' },
    { id: 'w.mhp_garland', at: { x: -6.2, z: -332.4 }, line: () => '{w.mhp_garland:pl} of paper flags from the Lantern House to the jetty, still up from {w.mhp_lanternnight}. Nobody has the heart to take them down.' },
    { id: 'w.mhp_canoe', at: { x: -3.6, z: -330.2 }, line: () => 'A red {w.mhp_canoe} pulled up on the shore, and a {w.mhp_basket} full of new ones: not one {w.lf_paper_lantern} in it ever went on the water.' },
    { id: 'w.mhp_oillamp', at: { x: -7.4, z: -339.6 }, line: () => 'The lamplighters’ hut: a row of {w.mhp_oillamp:pl} by the door, a {w.mhp_oilcan}, a long pole with a {w.qr_hook}. Everything ready for tonight… if anyone lights anything tonight.' },
    { id: 'w.mhp_stainedglass', at: { x: -39.4, z: -369.8 }, line: () => 'The pilgrims’ {w.chapel} at the causeway’s end, whole and dry, its round {w.mhp_stainedglass} window shining. The {w.mhp_pilgrim:pl} walk here every spring.' },
    { id: 'w.mhp_shootingstar', at: { x: -2.6, z: -337.8 }, line: () => 'From the jetty, the whole {w.lf_lake} is a {w.mhp_mirror}. Last night, they say, a {w.mhp_shootingstar} crossed it, right when the lights went out.' },
  ];
  function interactables() {
    const s = st(), out = [];
    out.push({ x: DOORSPOT.x, z: DOORSPOT.z, r: 1.8, label: s.told ? 'Go in' : 'Look', run: async () => {
      if (!s.told) { M.lookAt('w.mhp_lamplighter', s.met ? 'The Lantern House’s door is locked. {luz} has the key… once she knows what happened last night.' : 'The Lantern House: four floors of stone, the great lantern at the top. Its door is locked, and its light is out.', 5); return; }
      if (typeof MH_PHOUSE !== 'undefined' && MH_PHOUSE) await MH_PHOUSE.enter();
    } });
    if (s.willowAsked && !s.willowDug) out.push({ x: WILLOW.x + 0.9, z: WILLOW.z + 0.9, r: 1.5, label: `Tell ${M.mimoName()}`, run: digScene });
    if (s.lanternAsked && !s.lanternFound) out.push({ x: 0.2, z: -336.2, r: 1.6, label: `Tell ${M.mimoName()}`, run: swimScene });
    for (const L0 of LOOKS) { if (L0.when && !L0.when()) continue; out.push({ x: L0.at.x, z: L0.at.z, r: 1.3, label: 'Look', run: async () => M.lookAt(L0.id, M.fillEn(L0.line()), 6) }); }
    return out;
  }
  function nextId() { const s = st(); return !s.met ? 'luz' : heardN() < 4 ? 'heard' : !s.told ? 'luz' : 'house'; }
  const HINTS = { luz: '{mimo} points at an old woman with a lamplighter’s pole, by the tall tower in the middle of Candil.', house: '{mimo} looks at the Lantern House’s door.',
    mayor: '{mimo} points at a woman by the jetty, on the east shore.', ferry: '{mimo} points at a bearded man at the dock, on the west side.', marisol: '{mimo} points at a little girl by the jetty.',
    ramiro: '{mimo} points at a little boy sitting by the twins’ hut.', tadeo: '{mimo} points at a little boy in a cap.', nieves: '{mimo} points at a young woman by the causeway’s foot.' };
  function target(id) {
    if (id === 'house') return (typeof MH_PHOUSE !== 'undefined' && MH_PHOUSE && MH_PHOUSE.inside && MH_PHOUSE.target()) || { x: DOORSPOT.x, z: DOORSPOT.z, hint: HINTS.house };
    if (id === 'heard') { const s = st(), n = M.HEARD.find(k => !(s.heard && s.heard[k])); if (!n) return target('luz'); id = n; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || '{mimo} points.' };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('mh_past') ? 'mh_past' : 'past');

  // ------------------------------------------------------------ the side quests (QUESTS.LIST: they start as the story reaches them)
  if (typeof QUESTS !== 'undefined') {
    const pS = s => M.sp(s), nS = s => M.sn(s);
    const pastAt = id => () => M.via('past', () => target(id));
    if (!QUESTS.LIST.some(q => q.id === 'mp.note')) QUESTS.LIST.push({ id: 'mp.note', kind: 'side',
      get title() { return M.fillEn('{ramiro}’s note'); }, get giver() { return M.fillEn('little {ramiro}, by the twins’ hut (Candil, long ago)'); },
      started: s => !!pS(s).noteAsked,
      steps: [
        { get text() { return M.fillEn('In the Past: say it for little {ramiro}, so he can write it down'); }, get why() { return M.fillEn(`Passed on, it steps back: ${M.sx('note')}.`); },
          done: s => !!pS(s).noteDone, target: pastAt('ramiro'), hint: HINTS.ramiro },
        { text: 'Today: is the note still there? Look by the tower path', why: 'A tin under a cairn, long ago… did anyone ever open it?',
          done: s => !!nS(s).noteSeen, target: () => M.via('now', () => ({ x: NOTE.x - 1.0, z: NOTE.z + 0.6, hint: '{mimo} points at a mossy pile of stones by the tower path.' })), hint: '{mimo} points at the tower path.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'mp.willow')) QUESTS.LIST.push({ id: 'mp.willow', kind: 'side',
      get title() { return M.fillEn('{nieves}’s willow'); }, get giver() { return M.fillEn('young {nieves}, by the causeway (Candil, long ago)'); },
      started: s => !!pS(s).willowAsked,
      steps: [
        { text: 'In the Past: dig a hole by the causeway (tell Mimo, as a memory)', why: 'The bank is all stones.', done: s => !!pS(s).willowDug, target: () => M.via('past', () => ({ x: WILLOW.x, z: WILLOW.z, hint: '{mimo} sniffs the stony bank by the causeway.' })), hint: '{mimo} sniffs the bank.' },
        { get text() { return M.fillEn('Tell {nieves} where you planted it'); }, why: 'She has the cutting.', done: s => !!pS(s).willowDone, target: pastAt('nieves'), hint: HINTS.nieves },
        { text: 'Today: is there a willow by the causeway? Look', why: 'Willows live a long time…', done: s => !!nS(s).willowSeen, target: () => M.via('now', () => ({ x: WILLOW.x + 1.2, z: WILLOW.z + 0.8, hint: '{mimo} points at a green tree by the causeway.' })), hint: '{mimo} points by the causeway.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'mp.lantern')) QUESTS.LIST.push({ id: 'mp.lantern', kind: 'side',
      get title() { return M.fillEn('{marisol}’s paper lantern'); }, get giver() { return M.fillEn('little {marisol}, by the jetty (Candil, long ago)'); },
      started: s => !!pS(s).lanternAsked,
      steps: [
        { text: 'In the Past: fetch it from under the jetty (tell Mimo, as a memory)', why: 'It’s bobbing under the jetty’s end.', done: s => !!pS(s).lanternFound, target: () => M.via('past', () => ({ x: 0.2, z: -336.2, hint: '{mimo} points at a blue lantern under the jetty.' })), hint: '{mimo} points under the jetty.' },
        { get text() { return M.fillEn('Give it back, and tell {marisol} the legend of Lantern Night'); }, why: 'What did people do every year?', done: s => !!pS(s).lanternDone, target: pastAt('marisol'), hint: HINTS.marisol },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks (TIME calls them: time.js "TIME dresses it")
  let oldHid = [];
  Object.assign(M.DRESS.past, {
    people: PEOPLE,
    on(api) { show(true); hid = M.hideToday(api, { past: true }); oldHid = hideOld(api); hid = hid.concat(oldHid); },
    off() { show(false); hid = []; oldHid = []; },
    entered() { show(true); },
    late: (api, dt) => { if (typeof MH_PHOUSE !== 'undefined' && MH_PHOUSE && MH_PHOUSE.inside) MH_PHOUSE.late(dt); else late(dt); },
    update(api, dt, t) { update(dt, t); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, PEOPLE, who, build, show, LOOKS, HOUSE, DOORSPOT, NOTE, WILLOW, JETTY,
    target: id => target(id), song: () => song(), init: () => {}, changed: () => {},
    _: { talk: id => talk(id), luzScene, heardScene, storyScene, noteScene, willowAsk, digScene, willowPlant, lanternAsk, swimScene, legendScene, get built() { return built; } } };
})();
