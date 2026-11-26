'use strict';
// Molinar, tomorrow (DESIGN.md 18.6 "T1c"): the place if nobody speaks up. TIME dresses it (time_molinar.js MOLT.DRESS.future):
//   the Great Mill hushed (gray and still: molinar.js setMillHushed), its door sealed with gray, the market stalls under gray
//   tarps, gray flour dust drifting, crates stacked where the stalls were busy. Today's townsfolk are hidden (objects.folks);
//   seven of them stand here older and frozen gray, and the color comes back as you wake them (TIME's look: 'future' with
//   k(api), like Chapter 3).
// The main path (MOLT.FSTEPS): Trigo, the only one still talking, shows the future in every person («moleré, girarás, llevará,
//   jugarán, cantaremos», «la semana que viene»); promise four frozen people what they (or you, or all of you) will do; the
//   seal cracks; the silent Great Mill (molinar_future_mill.js); the Gray Miller (molinar_time_boss.js); the echo; Noa.
// Side quests: «A warning from tomorrow» (cross-time: Ciro writes «Si nadie habla, el molino se parará»; read it to today's
//   Ciro and he oils the Great Mill's gears today, which shows tomorrow too), «Dani's pinwheel» (a plan for {mimo}: «soplará»),
//   «Market day, next week» (who will bring what: the tarps come off).
const MOL_FUT = (() => {
  if (typeof TIME === 'undefined' || typeof MOLT === 'undefined' || !MOLT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = MOLT, T = () => MFTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('future');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are
  const AT = {
    trigo: { x: 236.4, z: -161.0, yaw: 2.9 }, marga: { x: 248.6, z: -169.0, yaw: -2.0 }, tomas: { x: 219.6, z: -159.6, yaw: -0.45 },
    lupe: { x: 205.9, z: -144.8, yaw: 2.1 }, ciro: { x: 206.2, z: -134.8, yaw: 2.6 }, dani: { x: 226.6, z: -144.0, yaw: -2.4 }, felix: { x: 177.6, z: -146.2, yaw: -1.87 },
  };
  const WAKE = ['marga', 'tomas', 'lupe', 'ciro'], ALL = ['marga', 'tomas', 'lupe', 'ciro', 'dani', 'felix'];
  const OIL = { x: 236.4, z: -167.9 };
  const PINWHEEL = { x: 227.6, z: -144.9 };
  const C = () => T().CAST;
  const LOOK = {
    trigo: { skin: '#e6b48c', hair: '#c98a3a', hairdo: 'short', dress: '#e8dcc4', apron: '#fdf8ee', hat: 'flat', hatColor: '#d8d0c0', h: 0.96 },
    marga: { skin: '#a8714a', hair: '#9a948e', hairdo: 'bun', dress: '#4f8a4a', apron: '#e8d9b8', hat: 'scarf', hatColor: '#e0503f' },
    tomas: { skin: '#efc29a', hair: '#d8d8d8', dress: '#f2e6d0', apron: '#ffffff', stache: true, hair2: '#d8d8d8', hat: 'flat', hatColor: '#fdf8ee' },
    lupe: { skin: '#e6b48c', hair: '#a4a09a', hairdo: 'bun', dress: '#d9603f', apron: '#fdf8ee', hat: 'scarf', hatColor: '#f2c14e', prop: 'basket' },
    ciro: { skin: '#f5cda2', hair: '#ece8e0', hairdo: 'bald', beard: true, dress: '#5a4a7a', apron: '#8a5f3e', glasses: true, prop: 'cane', h: 0.9 },
    dani: { skin: '#a8714a', hair: '#2e2420', hairdo: 'short', dress: '#4f9a5a', hat: 'cap', hatColor: '#3f6fb5', h: 0.92 },
    felix: { skin: '#8a5a3c', hair: '#d8d8d8', dress: '#3e7fb0', hat: 'cap', hatColor: '#c9443a', stache: true, hair2: '#d8d8d8', h: 1.04 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('future', id);
  const woke = id => !!(st().woke && st().woke[id]);
  const wokeN = (list = ALL) => list.filter(woke).length;

  // ------------------------------------------------------------ the color comes back as they wake (0.12 gray … 1 healed)
  function k() { const s = st(); return Math.min(1, 0.12 + 0.5 * wokeN() / ALL.length + (TIME.flag('future', 'molFree') ? 0.38 : 0)); }
  // the frozen: each person's own material, gray until woken (uGray 1 → 0 as they wake)
  const FROZEN = {};
  function frozenMat(P) {
    const id = P.def.id; if (FROZEN[id]) return FROZEN[id];
    const body = P.body.children[0]; if (!body || !body.material) return null;
    const m = body.material.clone(), u = { uGray: { value: woke(id) ? 0 : 1 } };
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = u.uGray;
      sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.86, l * 0.95), uGray); }');
    };
    m.customProgramCacheKey = () => 'molFrozen';
    body.material = m;
    return (FROZEN[id] = { m, u });
  }
  function dressPeople() {
    const list = TIME.people && TIME.people.all['molinar:future']; if (!list) return;
    for (const P of list) { if (P.def.id === 'trigo') continue; const F = frozenMat(P); if (F && !F.tw) F.u.uGray.value = woke(P.def.id) ? 0 : 1; }
  }

  // ------------------------------------------------------------ the dressing: tarps, crates, dust, the seal on the mill's door
  let built = null;
  function stallTarps(k) {
    const mol = G().molinar; if (!mol || !mol.stalls) return;
    for (const s of mol.stalls) {
      const y = gy(s.x, s.z), ry = s.yaw, c = Math.cos(ry), sn = Math.sin(ry), at = (lx, lz) => [s.x + lx * c + lz * sn, s.z - lx * sn + lz * c];
      k.box(s.x, y + 2.78, s.z, 3.3, 0.1, 1.9, '#8f8b86', { ry, rx: -0.1 });
      for (const lz of [-0.95, 0.95]) { const [px, pz] = at(0, lz); k.box(px, y + 1.9, pz, 3.2, 1.7, 0.06, '#9a968f', { ry, ink: 0.004 }); }
      for (const lx of [-1.6, 1.6]) { const [px, pz] = at(lx, 0); k.box(px, y + 2.0, pz, 0.06, 1.5, 1.8, '#86827c', { ry, ink: 0.004 }); }
      const [ox, oz] = at(1.9, 0.6); k.box(ox, y + 0.3, oz, 0.6, 0.6, 0.6, '#7e7a74', { ry: ry + 0.3 }).box(ox + 0.1, y + 0.85, oz - 0.1, 0.5, 0.5, 0.5, '#8a8680', { ry: ry - 0.2 });
    }
  }
  function props(k) {
    const KG = PAST.API.KG;
    // gray dust lying about: flat patches round the square and the mill, sacks gone gray, a fallen chair
    const R = (() => { let s = 77; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    for (let i = 0; i < 26; i++) { const a = R() * TAU, r = 3 + R() * 34, x = 214 + Math.cos(a) * r, z = -151 + Math.sin(a) * r; const [px, pz] = WORLD.pushOut(x, z, 0.8); if (Math.hypot(px - x, pz - z) > 0.01) continue; k.add(KG.sphere, x, gy(x, z) + 0.01, z, 0.9 + R() * 1.4, 0.02, 0.7 + R(), '#a8a6ae', { ry: R() * 3, ink: 0 }); }
    for (const [x, z] of [[243.6, -161.8], [233.8, -164.6], [221.4, -153.2]]) for (let j = 0; j < 3; j++) k.add(KG.sphere, x + (j - 1) * 0.6, gy(x, z) + 0.3, z + (j % 2) * 0.3, 0.32, 0.3, 0.34, '#a7a3a0', { ink: 0.01 });
    // vines up the Great Mill's plinth, a "closed" board over the inn's terrace table
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, x = 240 + Math.cos(a) * 7.7, z = -176 + Math.sin(a) * 7.7; k.add(KG.sphere, x, gy(x, z) + 0.35, z, 0.42, 0.38, 0.42, i % 3 ? '#6d7a5e' : '#7d8a6a', { ink: 0.008 }); }
    extras(k);
  }
  // ------------------------------------------------------------ what's left, up close (each has a Look: LOOKS_AT below): the notice
  // board of plans by the well, withered flowerpots, the baker's broom, a sack of seeds, a handkerchief and moss on the benches,
  // roof tiles in the street, a torn flag on the well's pole, grass between the flagstones
  const XF = {
    board: { x: 211.4, z: -150.0 }, pots: [[204.4, -156.6], [205.0, -157.0], [204.0, -157.2]], broom: { x: 221.2, z: -157.8 },
    seeds: { x: 254.6, z: -162.6 }, hanky: { x: 212.2, z: -152.8 }, moss: { x: 217.8, z: -152.8 }, tiles: { x: 236.4, z: -145.4 }, chalk: { x: 216.0, z: -142.6 },
    grass: [[225.4, -160.6], [226.6, -159.4], [227.2, -160.8], [224.8, -159.2], [226.0, -161.6]],
  };
  function extras(k) {
    const KG = PAST.API.KG, GRAY = '#9a968f', WOOD = '#7e766c', WOODD = '#625b53';
    // the notice board: two posts, a board, a few faded notes pinned on it
    { const { x, z } = XF.board, y = gy(x, z);
      for (const s of [-0.7, 0.7]) k.box(x, y + 0.9, z + s, 0.1, 1.8, 0.1, WOODD);
      k.box(x, y + 1.35, z, 0.06, 0.9, 1.6, WOOD).box(x, y + 1.86, z, 0.14, 0.06, 1.72, WOODD, { ink: 0.004 });
      for (let i = 0; i < 5; i++) k.box(x - 0.04, y + 1.12 + (i % 2) * 0.36, z - 0.55 + i * 0.27, 0.01, 0.24, 0.2, i % 2 ? '#d8d6d0' : '#c8c6c0', { rx: (i - 2) * 0.06, ink: 0 }); }
    // withered flowerpots
    for (const [x, z] of XF.pots) { const y = gy(x, z); k.add(KG.cyl, x, y + 0.17, z, 0.17, 0.34, 0.17, '#8e7f72', { ink: 0.006 }); for (let i = 0; i < 3; i++) k.rod([x, y + 0.32, z], [x + Math.cos(i * 2.1) * 0.14, y + 0.52 - i * 0.04, z + Math.sin(i * 2.1) * 0.14], 0.012, '#7a7468', 0).add(KG.ball6, x + Math.cos(i * 2.1) * 0.16, y + 0.48 - i * 0.05, z + Math.sin(i * 2.1) * 0.16, 0.04, 0.03, 0.04, '#8a8478', { ink: 0 }); }
    // the baker's broom, leaning on his stall
    { const { x, z } = XF.broom, y = gy(x, z);
      k.rod([x, y + 0.08, z + 0.2], [x - 0.22, y + 1.4, z - 0.1], 0.025, WOOD, 0.004).add(KG.cone, x + 0.02, y + 0.14, z + 0.22, 0.16, 0.3, 0.1, '#b8b2a4', { rx: 0.18, rz: -0.16, ink: 0.004 }); }
    // a sack of seeds and a rusty watering can
    { const { x, z } = XF.seeds, y = gy(x, z);
      k.add(KG.sphere, x, y + 0.34, z, 0.34, 0.36, 0.3, '#b8ae98', { ink: 0.01 }).add(KG.cyl, x, y + 0.66, z, 0.12, 0.08, 0.12, '#a39a86', { ink: 0 });
      k.add(KG.cyl, x + 0.6, y + 0.2, z + 0.3, 0.18, 0.4, 0.18, '#8a6a52', { ink: 0.006 }).rod([x + 0.6, y + 0.3, z + 0.48], [x + 0.62, y + 0.5, z + 0.82], 0.025, '#7a5a44', 0.004);
      k.add(KG.torus, x + 0.6, y + 0.44, z + 0.18, 0.12, 0.12, 0.12, '#7a5a44', { ry: Math.PI / 2, ink: 0 }); }
    // a handkerchief on one bench, moss on another (the benches round the well: seat at 0.48)
    { const { x, z } = XF.hanky, y = gy(x, z); k.box(x + 0.25, y + 0.54, z - 0.1, 0.34, 0.02, 0.3, '#d8d6d0', { ry: 0.5, ink: 0.003 }); }
    { const { x, z } = XF.moss, y = gy(x, z); for (let i = 0; i < 5; i++) k.add(KG.sphere, x - 0.6 + i * 0.3, y + 0.53, z + (i % 2 ? 0.08 : -0.06), 0.18, 0.05, 0.14, i % 2 ? '#6f8f4a' : '#7fa05a', { ink: 0 }); }
    // roof tiles fallen into the street
    { const { x, z } = XF.tiles, y = gy(x, z); for (let i = 0; i < 6; i++) k.add(KG.cyl, x + Math.cos(i * 1.3) * 0.5, y + 0.05, z + Math.sin(i * 1.7) * 0.4, 0.14, 0.42, 0.14, i % 2 ? '#a87a68' : '#9a7062', { rz: Math.PI / 2, ry: i * 0.7, ink: 0.004 }); }
    // a torn gray flag on the well's pole
    { const y = gy(215, -150); k.box(215.45, y + 5.55, -150, 0.8, 0.46, 0.02, '#a4a0a8', { ink: 0.004 }).box(215.78, y + 5.42, -150, 0.3, 0.2, 0.02, '#a4a0a8', { rz: 0.3, ink: 0 }); }
    // grass pushing up between the flagstones
    for (const [x, z] of XF.grass) { const y = gy(x, z); for (let i = 0; i < 4; i++) k.add(KG.cone, x + Math.cos(i * 1.6) * 0.12, y + 0.14, z + Math.sin(i * 1.6) * 0.12, 0.05, 0.28 + (i % 2) * 0.08, 0.05, i % 2 ? '#7f9a5a' : '#6f8a4e', { rx: Math.cos(i) * 0.25, rz: Math.sin(i) * 0.25, ink: 0 }); }
  }
  // chalk drawings on the flagstones (a plane of its own: windmills, a sun, people holding hands, half rubbed out)
  function chalkMesh() {
    const tex = TK.canvasTex(256, 256, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(240,238,232,0.75)'; c.lineWidth = 5; c.lineCap = 'round';
      const mill = (x, y, s) => { c.beginPath(); c.moveTo(x - s * 0.3, y + s); c.lineTo(x - s * 0.15, y); c.lineTo(x + s * 0.15, y); c.lineTo(x + s * 0.3, y + s); c.stroke(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * s * 0.9, y + Math.sin(a) * s * 0.9); c.stroke(); } };
      mill(70, 90, 50); mill(150, 110, 38);
      c.beginPath(); c.arc(205, 50, 22, 0, TAU); c.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(205 + Math.cos(a) * 30, 50 + Math.sin(a) * 30); c.lineTo(205 + Math.cos(a) * 40, 50 + Math.sin(a) * 40); c.stroke(); }
      for (let i = 0; i < 4; i++) { const x = 60 + i * 42, y = 200; c.beginPath(); c.arc(x, y - 22, 9, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(x, y - 13); c.lineTo(x, y + 12); c.moveTo(x - 21, y - 4); c.lineTo(x + 21, y - 4); c.moveTo(x, y + 12); c.lineTo(x - 9, y + 30); c.moveTo(x, y + 12); c.lineTo(x + 9, y + 30); c.stroke(); }
      c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,0.55)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(30 + i * 27, 60 + (i * 53) % 170, 26, 14, i, 0, TAU); c.fill(); }
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: true }));
    const { x, z } = XF.chalk; m.rotation.x = -Math.PI / 2; m.rotation.z = 0.3; m.position.set(x, gy(x, z) + 0.03, z); m.name = 'mol-fut-chalk'; m.visible = false; m.renderOrder = 1; G().w3d.scene.add(m);
    return m;
  }
  function sealMesh() {
    const tex = TK.canvasTex(128, 192, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h * 0.55, h * 0.55); g.addColorStop(0, 'rgba(120,118,132,0.95)'); g.addColorStop(1, 'rgba(70,68,80,0.85)');
      c.fillStyle = g; c.beginPath(); c.moveTo(6, h); c.lineTo(6, h * 0.42); c.quadraticCurveTo(w / 2, -h * 0.12, w - 6, h * 0.42); c.lineTo(w - 6, h); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(30,28,40,0.9)'; c.lineWidth = 4; c.stroke();
      c.strokeStyle = 'rgba(200,198,214,0.5)'; c.lineWidth = 2; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(w / 2, h * 0.62, 10 + i * 9, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.8), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.position.set(240, 0.81 + 2.2, -176 + 5.6 + 0.45); m.name = 'mol-fut-seal'; m.visible = false; G().w3d.scene.add(m);
    return m;
  }
  function dustPoints() {
    const n = 90, pos = new Float32Array(n * 3), seed = [];
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, r = 2 + Math.random() * 36; seed.push({ x: 214 + Math.cos(a) * r, z: -151 + Math.sin(a) * r, y: 0.4 + Math.random() * 7, ph: Math.random() * 6.3, sp: 0.2 + Math.random() * 0.4 }); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: TK.sparkTex, color: '#c8c6d2', size: 0.34, transparent: true, opacity: 0.55, depthWrite: false }));
    pts.frustumCulled = false; pts.visible = false; pts.name = 'mol-fut-dust'; G().w3d.scene.add(pts);
    return { pts, pos, seed };
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'mol-fut-' + name; const kk = PAST.API.Kit(); fn(kk); kk.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), tarps: mk('tarps', stallTarps), seal: sealMesh(), dust: dustPoints(), pin: pinwheel(), chalk: chalkMesh(), solids: [] };
    // solids (parked far away while the Future is off): the notice board, the sack of seeds, the flowerpots
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    add(XF.board.x, XF.board.z - 0.6, 0.3); add(XF.board.x, XF.board.z + 0.6, 0.3); add(XF.seeds.x + 0.25, XF.seeds.z + 0.15, 0.6); add(204.5, -156.9, 0.55);
    WORLD.extra.push(...built.solids);
    return built;
  }
  const solidsOn = on => { if (built) built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); };
  // Dani's pinwheel (a little stand by his corner): it spins once {mimo} blows on it
  function pinwheel() {
    const g = new THREE.Group(), y = gy(PINWHEEL.x, PINWHEEL.z); g.position.set(PINWHEEL.x, y, PINWHEEL.z); g.name = 'mol-fut-pinwheel';
    g.add(TK.part(TK.G.cyl, '#8a5f3e', [0, 0.7, 0], [0.04, 1.4, 0.04], { ink: 0.006 }));
    const head = new THREE.Group(); head.position.set(0, 1.42, 0.06); g.add(head);
    ['#e2453a', '#ffd84a', '#3f7fc9', '#5fae4f'].forEach((c, i) => head.add(TK.part(TK.G.box, c, [Math.cos(i * Math.PI / 2) * 0.17, Math.sin(i * Math.PI / 2) * 0.17, 0], [0.3, 0.16, 0.02], { rot: [0, 0, i * Math.PI / 2 + 0.4], ink: 0.004 })));
    g.visible = false; G().w3d.scene.add(g);
    return { g, head, spin: 0 };
  }
  function show(on) {
    const B = build(), s = st(), market = !!TIME.flag('future', 'molMarket');
    B.props.visible = on; B.tarps.visible = on && !market;
    B.seal.visible = on && !s.open && !TIME.flag('future', 'molFree');
    B.dust.pts.visible = on; B.pin.g.visible = on; B.chalk.visible = on;
    solidsOn(on);
  }
  // today's townsfolk's solids are parked (molinar_past.js does the same), their meshes hidden; the Great Mill hushed
  function hideToday(api) {
    const mol = G().molinar; if (!mol || !mol.objects) return;
    (mol.objects.folks || []).forEach(m => api.hide(m));
    for (const o of G().w3d.scene.children) if (o.visible && /^(read|diary|townlife|tl-|store)/i.test(o.name || '') && Math.hypot(o.position.x - 214, o.position.z + 151) < 60) api.hide(o);
  }
  const millHush = on => { const mol = G().molinar; if (mol && mol.setMillHushed) mol.setMillHushed(on, true); };
  function late(dt) {
    const B = built; if (!B) return;
    // frozen people stand still (TIME's people kit breathes and turns: undone here, after it)
    const list = TIME.people && TIME.people.all['molinar:future'];
    if (list) for (const P of list) {
      if (P.def.id === 'trigo' || woke(P.def.id)) continue;
      P.g.rotation.y = P.api.yaw; P.body.position.y = 0; P.body.rotation.z = 0;
    }
    for (const F of Object.values(FROZEN)) if (F.tw != null) { F.tw = Math.max(0, F.tw - dt * 0.7); F.u.uGray.value = F.tw; if (F.tw <= 0) F.tw = null; }
    const t = G().w3d.time.value, D = B.dust;
    if (D.pts.visible) { const kk = k(); D.pts.material.opacity = 0.55 * (1 - kk * 0.85); D.seed.forEach((p, i) => { D.pos[i * 3] = p.x + Math.sin(t * p.sp + p.ph) * 1.4; D.pos[i * 3 + 1] = p.y + Math.sin(t * p.sp * 0.6 + p.ph) * 0.6; D.pos[i * 3 + 2] = p.z + Math.cos(t * p.sp * 0.8 + p.ph) * 1.4; }); D.pts.geometry.attributes.position.needsUpdate = true; }
    const pin = B.pin; if (pin.g.visible) { pin.spin = st().pinwheel ? 7 : 0.15 * Math.sin(t); pin.head.rotation.z += dt * pin.spin; }
  }

  // ------------------------------------------------------------ talking to the people of tomorrow
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const demo1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.demo(p, T().DEMO[key], T().MARKS[key]).finally(() => M.lock(false)); };
  // each person's turn once they're awake (Trigo's once you've met): the line the story needs now opens each round, then their
  // own lines and their demonstration of tomorrow's words («d:», whole in the language, its marks glossed); saved, so it goes on
  const TURNS = {
    trigo: ['trigo.t1', 'd:trigo.demo3', 'trigo.t2', 'trigo.t3', 'd:trigo.demo4', 'trigo.t4'],
    marga: ['marga.m1', 'd:marga.demo', 'marga.m2', 'marga.m3'],
    tomas: ['tomas.t1', 'd:tomas.demo', 'tomas.t2', 'tomas.t3'],
    lupe: ['lupe.l1', 'd:lupe.demo', 'lupe.l2', 'lupe.l3'],
    ciro: ['ciro.c1', 'd:ciro.demo', 'ciro.c2', 'ciro.c3'],
    dani: ['dani.d1', 'd:dani.demo', 'dani.d2', 'dani.d3'],
    felix: ['felix.f1', 'd:felix.demo', 'felix.f2'],
  };
  // (first: said every `every` turns, once a round by default; while the town still sleeps, Trigo's direction every other turn)
  function turn(id, first, every) {
    const s = st(), T0 = s.turn || (s.turn = {}), list = TURNS[id] || [], n = T0[id] || 0; T0[id] = n + 1;
    if (first && n % (every || list.length + 1) === 0) return say1(id, first);
    const i = T0[id + '#'] || 0; T0[id + '#'] = i + 1;
    const key = list[i % list.length];
    return key.startsWith('d:') ? demo1(id, key.slice(2)) : say1(id, key);
  }
  function talk(id) {
    const s = st();
    if (id === 'trigo') return !s.met ? trigoScene() : TIME.flag('future', 'molFree') ? turn('trigo', 'trigo.after') : wokeN(WAKE) >= 4 ? turn('trigo', 'trigo.open', 2) : turn('trigo', 'trigo.again', 2);
    if (!woke(id)) return wakeScene(id);
    if (id === 'marga') return turn('marga', TIME.flag('past', 'molStone') ? 'marga.awake' : 'marga.awake0');
    if (id === 'ciro' && s.warned) return turn('ciro', 'ciro.warn');
    if (id === 'lupe' && s.market) return turn('lupe', 'lupe.planned');
    if (id === 'dani' && s.pinwheel) return turn('dani', 'dani.spin');
    return turn(id, id + '.awake');
  }
  // the main path, 1: Trigo shows the future in every person
  async function trigoScene() {
    const s = st(), Tg = who('trigo'); if (!Tg) return;
    M.lock(true);
    try {
      M.frame2(Tg); await wait(0.4);
      await M.say(Tg, ln('trigo.hello'));
      await M.demo(Tg, T().DEMO['trigo.demo1'], T().MARKS['trigo.demo1']);
      await M.demo(Tg, T().DEMO['trigo.demo2'], T().MARKS['trigo.demo2']);
    } finally { M.lock(false); }
    await M.card(T().CARDS.fut, true);
    M.lock(true); try { M.frame2(who('trigo')); await M.say(who('trigo'), ln('trigo.wake')); await M.say(who('trigo'), ln('trigo.seal')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('Gray people all over the market. Promise each of them a tomorrow.', 5);
  }
  // the main path, 2: a frozen person; a promise in tomorrow's words wakes them
  async function wakeScene(id) {
    const s = st(), p = who(id); if (!p) return;
    M.lock(true); try { M.frame2(p); await wait(0.3); await M.hushed(p, ln(id + '.frozen')); } finally { M.lock(false); }
    if (!s.met) { M.think('Gray, frozen… as if waiting for something. Someone by the Great Mill is still talking. Ask them.', 5.5); return; }
    const r = await M.ask(T().TASKS[id], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('Still gray. A promise about tomorrow would wake them.', 4); return; }
    TIME.grade('mol.wake.' + id, r.letter);
    s.woke = s.woke || {}; s.woke[id] = r.letter; G().save();
    await wakeUp(id);
    if (WAKE.every(woke) && !s.open) await sealCracks();
  }
  async function wakeUp(id) {
    const g = G(), P = M.person('future', id), F = P && frozenMat(P);
    M.lock(true);
    try {
      if (F) F.tw = 1;
      snd('learned'); if (P) g.w3d.fx.sparkle(P.api.x, (P.api.y || 0) + 1.3, P.api.z, 22, ['#ffd166', '#fff3a0', '#9ff5e8']);
      await wait(1.2);
      const p = who(id); M.frame2(p); await M.say(p, ln(id === 'marga' && !TIME.flag('past', 'molStone') ? 'marga.awake0' : id + '.awake'));
    } finally { M.lock(false); }
  }
  async function sealCracks() {
    const s = st(), B = build(), g = G();
    M.lock(true);
    try {
      M.shot(V(240 - 3.6, 3.6, -176 + 13.5), V(240, 2.6, -176 + 6.2), 1.0); await wait(1.0);
      snd('crack'); g.w3d.fx.puff(240, 2.6, -169.6, 18, 0.45, '#b8b6c4'); await wait(0.3);
      await STORY.tween(0.6, kk => { B.seal.material.opacity = 1 - kk; B.seal.scale.setScalar(1 + kk * 0.2); });
      B.seal.visible = false; B.seal.material.opacity = 1; B.seal.scale.setScalar(1); s.open = true; g.save();
      snd('chime'); await wait(0.6);
      const Tg = who('trigo'); if (Tg) { M.frame2(Tg); await M.say(Tg, ln('trigo.open')); }
    } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ side quest: «A warning from tomorrow» (the Future changes today)
  async function warnScene() {
    const s = st(), Ci = who('ciro'); if (!Ci) return;
    M.lock(true);
    try { M.frame2(Ci); await wait(0.3); await M.demo(Ci, T().DEMO.warn, T().MARKS.warn); await M.say(Ci, ln('ciro.warn')); s.warned = true; TIME.flag('future', 'molWarn', true); G().save(); } finally { M.lock(false); }
    M.think('A warning from tomorrow, word for word. Today’s Ciro, at his clock shop, should hear it.', 5.5);
  }
  async function warnToday(Cp) {
    const n = M.st('now');
    const r = await M.ask(T().TASKS.warn, { tips: T().TIPS }); if (!r) return;
    TIME.grade('mol.warn', r.letter);
    M.lock(true);
    try {
      Cp.talking = true; await M.say({ id: 'ciro', name: 'Ciro', x: Cp.x, y: Cp.y, z: Cp.z, top: 1.6 }, ln('ciro.heard'));
      TIME.flag('now', 'molOiled', true); TIME.refresh(); n.oiled = true; G().save();
      const y = gy(OIL.x, OIL.z); M.shot(V(OIL.x - 3, y + 2.4, OIL.z + 4.2), V(OIL.x + 0.8, y + 1.2, OIL.z - 1.4), 1.0); await wait(1.0);
      G().w3d.fx.sparkle(OIL.x, y + 0.5, OIL.z, 14, ['#ffd166', '#fff3a0']); snd('chime'); await wait(0.9);
    } finally { Cp.talking = false; M.lock(false); }
    M.think('The Great Mill’s gears, oiled today… What will that change tomorrow?', 5);
  }
  function oilCan(old) {
    const g = new THREE.Group(), k = PAST.API.Kit(), KG = PAST.API.KG, y = gy(OIL.x, OIL.z);
    k.add(KG.cyl, 0, y + 0.22, 0, 0.18, 0.42, 0.18, old ? '#7a6a5a' : '#c9443a').add(KG.cone, 0, y + 0.5, 0, 0.12, 0.18, 0.12, old ? '#6a5a4a' : '#b03a30')
      .rod([0.05, y + 0.52, 0], [0.42, y + 0.8, 0.0], 0.018, old ? '#5a4a3a' : '#e8c35a', 0.004).add(KG.torus, -0.05, y + 0.46, 0, 0.12, 0.12, 0.12, old ? '#5a4a3a' : '#2f3440', { ry: Math.PI / 2, ink: 0 });
    if (!old) k.box(0.55, y + 0.02, 0.3, 0.5, 0.02, 0.36, '#fdf8ee', { ry: 0.3, ink: 0.004 });
    k.build(g); g.position.set(OIL.x, 0, OIL.z); g.name = 'mol-oil-' + (old ? 'old' : 'new');
    return { obj: g, solids: [{ x: OIL.x, z: OIL.z, r: 0.3 }] };
  }
  TIME.effect('molinar.oil', { region: 'molinar', when: () => !!TIME.flag('now', 'molOiled'),
    show: { now: () => oilCan(false), future: () => oilCan(true) },
    act: { now: { x: OIL.x - 0.8, z: OIL.z + 0.6, r: 1.5, label: 'Look', run: async () => { const l = lang(), N = T().NAMES.noteNow; M.think(`A fresh oil can by the Great Mill’s door. Ciro’s note: «${M.plainT(N[l] || N.en)}»`, 5); } },
      future: { x: OIL.x - 0.8, z: OIL.z + 0.6, r: 1.5, label: 'Look', run: async () => { const l = lang(), N = T().NAMES.note; M.think(`An old oil can, rusted through. On it, in Ciro’s hand: «${M.plainT(N[l] || N.en)}». The mill’s gears were oiled, long ago.`, 6); const s = st(); if (!s.oilSeen) { s.oilSeen = true; G().save(); } } } } });

  // ------------------------------------------------------------ side quest: «Dani's pinwheel» (a plan for {mimo})
  async function pinTask() {
    const s = st();
    const r = await M.ask(M.planTask(T().PLAN.pinwheel), { icon: 'blow' }); if (!r) return;
    TIME.grade('mol.pinwheel', r.letter);
    const g = G(), sim = g.sim;
    M.lock(true);
    try {
      M.shot(V(PINWHEEL.x + 3.4, gy(PINWHEEL.x, PINWHEEL.z) + 2.2, PINWHEEL.z + 3.6), V(PINWHEEL.x, gy(PINWHEEL.x, PINWHEEL.z) + 1.2, PINWHEEL.z));
      sim.mimoGo({ x: PINWHEEL.x + 1.1, z: PINWHEEL.z + 0.9 }, PINWHEEL); await wait(0.9);
      snd('blow'); g.w3d.fx.puff(PINWHEEL.x + 0.5, gy(PINWHEEL.x, PINWHEEL.z) + 1.3, PINWHEEL.z + 0.4, 10, 0.2, '#e8f4ff');
      s.pinwheel = true; G().save(); await wait(0.8); snd('learned');
      const D = who('dani'); if (D) { M.frame2(D); await M.say(D, ln('dani.spin')); }
      sim.mimoGo(null, null);
    } finally { M.lock(false); }
  }
  TIME.spot('molinar.pinwheel', { region: 'molinar', world: 'future', x: PINWHEEL.x + 0.9, z: PINWHEEL.z + 0.8, r: 1.6, label: () => `Tell ${M.mimoName()}`,
    when: () => woke('dani') && !st().pinwheel, run: () => pinTask() });

  // ------------------------------------------------------------ side quest: «Market day, next week» (who will bring what)
  async function marketScene() {
    const s = st(), Lp = () => who('lupe');
    M.lock(true); try { M.frame2(Lp()); await wait(0.3); await M.say(Lp(), ln('lupe.plan')); } finally { M.lock(false); }
    if (!s.planBread) { const r = await M.ask(T().TASKS.bread, { tips: T().TIPS }); if (!r) return; TIME.grade('mol.bread', r.letter); s.planBread = true; G().save(); }
    const r2 = await M.ask(T().TASKS.sing, { tips: T().TIPS }); if (!r2) return;
    TIME.grade('mol.sing', r2.letter);
    M.lock(true);
    try {
      s.market = true; TIME.flag('future', 'molMarket', true); G().save(); show(true);
      snd('chime'); G().w3d.fx.sparkle(215, 3.2, -150, 30, ['#ffd166', '#e2453a', '#9ff5e8', '#fff3a0']);
      M.frame2(Lp()); await M.say(Lp(), ln('lupe.planned'));
    } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ the Talk menus (tomorrow), and today's Ciro
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'future' || TIME.regionNow() !== 'molinar') return null;
    const s = st();
    if (it.who === 'future:ciro' && woke('ciro') && !s.warned) return [{ label: 'Why did the mill stop?', sub: '◆ side quest', run: warnScene }];
    if (it.who === 'future:lupe' && woke('lupe') && !s.market) return [{ label: 'Market day', sub: '◆ side quest', run: marketScene }];
    return null;
  });
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || it.label !== 'Talk' || it.who || !TIME.flag('future', 'molWarn') || TIME.flag('now', 'molOiled')) return null;
    const mol = G().molinar, Cp = mol && mol.people && mol.people.find(p => p.id === 'ciro'); if (!Cp || Math.hypot(it.x - Cp.x, it.z - Cp.z) > 0.8) return null;
    return [{ label: 'A warning from tomorrow', sub: '◆ side quest', run: () => warnToday(Cp) }];
  });
  // (today, after: Ciro says he oiled them; he's a story NPC, so this is a menu option of its own)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || it.label !== 'Talk' || it.who || !TIME.flag('now', 'molOiled')) return null;
    const mol = G().molinar, Cp = mol && mol.people && mol.people.find(p => p.id === 'ciro'); if (!Cp || Math.hypot(it.x - Cp.x, it.z - Cp.z) > 0.8) return null;
    return [{ label: 'The Great Mill’s gears', run: async () => { M.lock(true); try { Cp.talking = true; await M.say({ id: 'ciro', name: 'Ciro', x: Cp.x, y: Cp.y, z: Cp.z, top: 1.6 }, ln('ciro.oiled')); } finally { Cp.talking = false; M.lock(false); } } }];
  });

  // ------------------------------------------------------------ E, the compass
  function interactables() {
    const s = st(), out = [];
    out.push({ x: M.DOOR.x, z: M.DOOR.z, r: 2.1, label: s.open || TIME.flag('future', 'molFree') ? 'Go in' : 'Look', run: async () => {
      if (!(s.open || TIME.flag('future', 'molFree'))) { M.think(s.met ? 'The Great Mill’s door, sealed with gray. When the town wakes up, it will crack.' : 'The Great Mill’s door is sealed with something gray and cold.', 4.5); return; }
      if (typeof MFMILL !== 'undefined') await MFMILL.enter();
    } });
    return out;
  }
  // the Looks of tomorrow (MFTXT.LOOKS), each where its thing stands; every spot at least 3 steps from a crack and clear of the
  // main path's people (MOLT._.t.probe). The notice board fills with a plan for each person who's awake.
  const LOOKS_AT = {
    sails: { x: 240.0, z: -163.2 }, ivy: { x: 249.0, z: -175.0 }, dust: { x: 230.0, z: -158.0 }, sacks: { x: 222.6, z: -154.6 }, tarps: { x: 221.6, z: -147.6 },
    empty: { x: 211.0, z: -144.0 }, closed: { x: 218.6, z: -156.6 }, grass: { x: 226.0, z: -160.0 }, moss: { x: 219.0, z: -153.6 }, pots: { x: 205.6, z: -155.6 },
    broom: { x: 222.4, z: -157.0 }, chalk: { x: 216.0, z: -144.2 }, board: { x: 210.2, z: -150.0 }, seeds: { x: 253.6, z: -162.0 }, handkerchief: { x: 211.0, z: -153.8 },
    tiles: { x: 236.0, z: -146.8 }, flag: { x: 215.0, z: -152.9 }, gate: { x: 175.0, z: -150.4 }, clock: { x: 209.8, z: -131.6 }, well: { x: 215.0, z: -147.2 },
    pinwheel: { x: 228.6, z: -146.2 },
  };
  function boardLook() {
    const L0 = T().LOOKS['look.board'], plans = ALL.filter(woke).map(id => T().BOARD[id]).filter(Boolean);
    if (!plans.length) return L0;
    return Object.assign({}, L0, { t: `A notice board by the well, with a {w.ml_list} of plans for the town: ${plans.join(' · ')}` });
  }
  for (const [k, at] of Object.entries(LOOKS_AT)) TIME.spot('molinar.future.look.' + k, { region: 'molinar', world: 'future', x: at.x, z: at.z, r: 1.5, label: 'Look',
    when: () => !(typeof MFMILL !== 'undefined' && MFMILL.inside) && !(k === 'pinwheel' && woke('dani') && !st().pinwheel),
    run: async () => M.look(k === 'board' ? boardLook() : T().LOOKS['look.' + k], k === 'board' ? 9 : 6.5) });
  const HINTS = { trigo: '{mimo} points at someone by the Great Mill: the only one with any color.', door: '{mimo} looks at the Great Mill’s door.', frozen: '{mimo} tugs your sleeve toward someone gray.',
    marga: '{mimo} points at a gray woman by an old cart.', tomas: '{mimo} points at a gray baker by a covered stall.', lupe: '{mimo} points at a gray fruit seller.', ciro: '{mimo} points at the gray old clockmaker.', dani: '{mimo} points at a gray teenager by a pinwheel.' };
  function target(id) {
    if (id === 'door') return (typeof MFMILL !== 'undefined' && MFMILL.inside && MFMILL.target()) || { x: M.DOOR.x, z: M.DOOR.z, hint: HINTS.door };
    if (id === 'frozen') { const n = WAKE.find(x => !woke(x)); if (!n) return target('trigo'); id = n; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || HINTS.frozen };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const nextId = () => { const s = st(); return !s.met ? 'trigo' : WAKE.some(x => !woke(x)) ? 'frozen' : 'door'; };
  // the area's song: 'mol_future' (molinar_time_music.js), which brings its drums in as the town wakes (it reads k())
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('mol_future') ? 'mol_future' : 'future');
  // the mill's color and sails come back for good once the Gray Miller stops (the dungeon calls this)
  function freed() { TIME.flag('future', 'molFree', true); millHush(false); show(true); TIME.refresh(); }

  // ------------------------------------------------------------ the side quests
  if (typeof QUESTS !== 'undefined') {
    const fS = s => M.sf(s), nS = s => M.sn(s);
    const futAt = id => () => M.via('future', () => target(id));
    const wk = (s, id) => !!(fS(s).woke && fS(s).woke[id]);
    if (!QUESTS.LIST.some(q => q.id === 'mol.warn')) QUESTS.LIST.push({ id: 'mol.warn', kind: 'side',
      title: 'A warning from tomorrow', giver: 'Ciro, at his clock shop (Molinar, tomorrow)',
      started: s => wk(s, 'ciro'),
      steps: [
        { text: 'In the Future: ask Ciro why the Great Mill stopped', why: 'Old Ciro is awake again. He remembers something about the mill’s gears.', done: s => !!fS(s).warned, target: futAt('ciro'), hint: HINTS.ciro },
        { text: 'Today: read Ciro the warning from tomorrow, word for word', why: 'A warning is a piece of tomorrow you bring home. Today’s Ciro is at his clock shop.',
          done: s => !!nS(s).oiled, target: () => M.via('now', () => { const mol = G().molinar, Cp = mol && mol.people && mol.people.find(p => p.id === 'ciro'); return Cp ? { x: Cp.x, z: Cp.z, hint: '{mimo} points at Ciro’s clock shop.' } : null; }), hint: '{mimo} points toward Ciro’s clock shop.' },
        { text: 'Tomorrow: look at the Great Mill’s door', why: 'The gears were oiled today… What does tomorrow look like now?', done: s => !!fS(s).oilSeen,
          target: () => M.via('future', () => ({ x: OIL.x, z: OIL.z, hint: '{mimo} sniffs something by the Great Mill’s door.' })), hint: '{mimo} sniffs something by the Great Mill’s door.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'mol.pinwheel')) QUESTS.LIST.push({ id: 'mol.pinwheel', kind: 'side',
      title: 'Dani’s pinwheel', giver: 'Dani, by the market (Molinar, tomorrow)',
      started: s => !!fS(s).met,
      steps: [
        { text: 'In the Future: wake Dani with a promise', why: 'Dani, older now, stands frozen by a pinwheel that doesn’t spin. Promise what he’ll do next week.', done: s => wk(s, 'dani'), target: futAt('dani'), hint: HINTS.dani },
        { text: 'Give the pinwheel some wind: a plan for {mimo}', get why() { return M.fillEn(`There’s no wind in tomorrow’s Molinar. Say what {mimo} will do: ${M.sx('plan')}.`); }, done: s => !!fS(s).pinwheel,
          target: () => M.via('future', () => ({ x: PINWHEEL.x, z: PINWHEEL.z, hint: '{mimo} puffs its cheeks at the pinwheel.' })), hint: '{mimo} puffs its cheeks at the pinwheel.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'mol.market')) QUESTS.LIST.push({ id: 'mol.market', kind: 'side',
      title: 'Market day, next week', giver: 'Lupe, at her fruit stall (Molinar, tomorrow)',
      started: s => wk(s, 'lupe'),
      steps: [
        { text: 'Plan the market day with Lupe: who will bring what', get why() { return M.fillEn(`Lupe wants a market day next week, like the old times. Say what each will do: ${M.sx('market')}.`); }, done: s => !!fS(s).market, target: futAt('lupe'), hint: HINTS.lupe },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks
  Object.assign(M.DRESS.future, {
    people: PEOPLE,
    k: () => k(),
    on(api) { show(true); hideToday(api); if (typeof MOL_PAST !== 'undefined' && MOL_PAST.parkToday) MOL_PAST.parkToday(true); millHush(!TIME.flag('future', 'molFree')); dressPeople(); },
    off() { show(false); if (typeof MOL_PAST !== 'undefined' && MOL_PAST.parkToday) MOL_PAST.parkToday(false); const g = G(); millHush(!(g && g.state.flags.millFree)); },
    entered() { dressPeople(); },
    late: (api, dt) => { late(dt); if (typeof MFMILL !== 'undefined' && MFMILL && MFMILL.inside) MFMILL.late(dt); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, WAKE, ALL, OIL, PINWHEEL, PEOPLE, k, woke, wokeN, target, song, freed, show, build, dressPeople, init: () => {}, changed: () => {},
    _: { talk, wakeScene, trigoScene, warnScene, warnToday, marketScene, pinTask, sealCracks, get built() { return built; } } };
})();
