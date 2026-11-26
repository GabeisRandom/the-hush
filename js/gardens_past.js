'use strict';
// The Bloom Gardens, long ago (DESIGN.md 20 "T3a"): the valley about 40 years back, the summer after the concert, the great greenhouse
// brand new. TIME dresses it (time_gardens.js GARDT.DRESS.past): a red ribbon and an opening banner at the greenhouse's door, a
// scaffold where the glazier still fixes panes, new pots and a watering can, the painter's easel, a burnt hive stand by the hives, a
// rose arch, a little stone statue, seed packets on a crate, a snail and a ladybug; butterflies round the flowers. Today's people, the
// show's entries and the judges' things are hidden (GARDT.hideToday); the flower fields, the bees and the clear glass stay.
// The people of then (TIME's person kit): the old head gardener, young Melisa (today's head beekeeper), her mother the beekeeper, the
// glazier who built the greenhouse, a painter, young Tomasa and young Polo. Each language names its own (GPTXT.CAST).
// The main path (GARDT.PSTEPS): the gardener describes how the greenhouse was inside (the imperfect for descriptions) and the card →
//   young Melisa's remembering game («¿Cómo era?» → «Era muy callado», «Tenía una gorra roja») → the glazier, the beekeeper and the
//   painter each describe the inside (demonstrations) → «El invernadero estaba lleno de flores» → the new greenhouse
//   (gardens_past_dungeon.js) → the Faded Bloom (gardens_time_boss.js) → the echo → Noa.
// Side quests (QUESTS.LIST): «The painter's picture» (cross-time: describe how it all was this morning; today the painting hangs by the
//   greenhouse door, tomorrow faded, and old Melisa uses it to remember the colors), «Young Polo's kite», «The bees' old hive».
const GD_PAST = (() => {
  if (typeof TIME === 'undefined' || typeof GARDT === 'undefined' || !GARDT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = GARDT, T = () => GPTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('past');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are (checked with GARDT._.t.probe in every world)
  const AT = {
    gardener: { x: 201.0, z: -64.2, yaw: -2.6 }, melisa: { x: 213.4, z: -73.6, yaw: -1.6 }, keeper: { x: 217.2, z: -72.8, yaw: -1.7 },
    glazier: { x: 205.5, z: -57.0, yaw: -1.4 }, painter: { x: 187.8, z: -72.2, yaw: 0.6 }, tomasa: { x: 213.2, z: -61.0, yaw: 1.5 }, polo: { x: 186.0, z: -66.0, yaw: -2.2 },
  };
  const EASEL = { x: 189.0, z: -71.0 }, POTS = { x: 205.2, z: -61.6 }, SKEP = { x: 211.6, z: -66.6 }, SCAF = { x: 205.5, z: -57.0 }, KITE = { x: 203.4, z: -56.6 };
  const POLES = [{ x: 194.6, z: -61.2 }, { x: 201.4, z: -61.2 }], CRATE = { x: 209.4, z: -77.6 }, STATUE = { x: 192.6, z: -80.6 }, ARCH = { x: 186.6, z: -80.2 };
  const SNAIL = { x: 180.4, z: -64.8 }, BUG = { x: 179.4, z: -59.0 }, BENCH = { x: 214.6, z: -84.6 };
  const PAINT = { now: { x: 192.6, z: -62.4, ry: -Math.PI / 2, look: { x: 191.0, z: -62.6 } }, past: { x: EASEL.x, z: EASEL.z } };      // (today and tomorrow: facing west, by the lane's mouth)
  const C = () => T().CAST;
  const LOOK = {
    gardener: { skin: '#e6b48c', hair: '#ece8e0', hairdo: 'bald', beard: true, stache: true, hair2: '#ece8e0', dress: '#5f8a4a', apron: '#8a6440', hat: 'straw', hatColor: '#4f8a4a', prop: 'basket', h: 0.98 },
    melisa: { kid: true, skin: '#d9a27a', hair: '#3a2b26', hairdo: 'tails', ribbon: '#f2c94c', dress: '#f2d16b', apron: '#f4efe2', h: 0.7 },
    keeper: { skin: '#d9a27a', hair: '#3a2b26', hairdo: 'bun', dress: '#f4efe2', vest: '#e8b83a', hat: 'straw', hatColor: '#f4efe2', h: 1.0 },
    glazier: { skin: '#c98e62', hair: '#5a3a26', hairdo: 'short', dress: '#4f6f8a', apron: '#c9b48e', hat: 'cap', hatColor: '#3d5a7a', glasses: true, stache: true, hair2: '#5a3a26', h: 1.02 },
    painter: { skin: '#efc29a', hair: '#8a4a2a', hairdo: 'braids', dress: '#9b7fd0', apron: '#fbf6ee', hat: 'beret', hatColor: '#e2574c', h: 0.97 },
    tomasa: { skin: '#efc29a', hair: '#8a5a3a', hairdo: 'bun', dress: '#c9643f', shawl: '#f2c94c', hat: 'straw', hatColor: '#f2c94c', h: 0.98 },
    polo: { kid: true, skin: '#a8714a', hair: '#2e2420', hairdo: 'short', dress: '#4c7fd8', vest: '#f4efe2', hat: 'cap', hatColor: '#5fb257', h: 0.72 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('past', id);

  // ------------------------------------------------------------ the dressing: one merged mesh (and its ink hull) per group
  let built = null;
  const kit = () => PAST.API.Kit();
  function props(k) {
    const KG = PAST.API.KG;
    // the opening banner's two poles (the banner itself is a canvas plane, below), and a red ribbon with a bow across the door
    for (const p of POLES) { const y = gy(p.x, p.z); k.rod([p.x, y, p.z], [p.x, y + 4.4, p.z], 0.07, '#f4efe2', 0.01).add(KG.ball6, p.x, y + 4.5, p.z, 0.12, 0.12, 0.12, '#e6b54a', { ink: 0.008 }); }
    let y = gy(198, -60.7);
    k.box(198, y + 1.4, -60.7, 2.4, 0.12, 0.04, '#d9434f', { ink: 0.006 }).add(KG.ball6, 197.8, y + 1.42, -60.75, 0.16, 0.12, 0.06, '#d9434f', { ink: 0.006 }).add(KG.ball6, 198.2, y + 1.42, -60.75, 0.16, 0.12, 0.06, '#d9434f', { ink: 0.006 });
    // the glazier's scaffold against the greenhouse's east wall (he stands on its plank)
    y = gy(SCAF.x, SCAF.z);
    for (const [dx, dz] of [[-0.45, -0.9], [-0.45, 0.9], [0.55, -0.9], [0.55, 0.9]]) k.rod([SCAF.x + dx, y, SCAF.z + dz], [SCAF.x + dx, y + 1.6, SCAF.z + dz], 0.05, '#a8743f', 0.008);
    k.box(SCAF.x + 0.05, y + 1.5, SCAF.z, 1.2, 0.08, 2.0, '#c79d6d', { ink: 0.01 });
    for (const dz of [-0.9, 0.9]) k.rod([SCAF.x - 0.45, y + 0.2, SCAF.z + dz], [SCAF.x + 0.55, y + 1.3, SCAF.z + dz], 0.03, '#8a6440', 0.006);
    k.box(SCAF.x + 0.3, y + 1.62, SCAF.z + 0.6, 0.5, 0.04, 0.4, '#cfeef5', { ink: 0.004 });     // (a new pane, waiting)
    // new pots stacked by the door, and the watering can
    y = gy(POTS.x, POTS.z);
    for (let i = 0; i < 5; i++) k.add(KG.cyl, POTS.x + (i % 3) * 0.36 - 0.36, y + 0.16 + (i > 2 ? 0.32 : 0), POTS.z + (i > 2 ? 0.1 : 0), 0.17, 0.3, 0.17, '#c9643f', { ink: 0.008 });
    k.add(KG.cyl, POTS.x + 0.7, y + 0.2, POTS.z - 0.5, 0.2, 0.36, 0.16, '#5f8a9a', { ink: 0.01 }).rod([POTS.x + 0.86, y + 0.3, POTS.z - 0.5], [POTS.x + 1.2, y + 0.5, POTS.z - 0.5], 0.03, '#5f8a9a', 0.006)
      .add(KG.cone, POTS.x + 1.24, y + 0.52, POTS.z - 0.5, 0.06, 0.08, 0.06, '#5f8a9a', { rz: -Math.PI / 2, ink: 0.004 });
    // the painter's easel (the canvas is the 'gardens.painting' effect)
    y = gy(EASEL.x, EASEL.z);
    k.rod([EASEL.x - 0.35, y, EASEL.z + 0.15], [EASEL.x, y + 1.9, EASEL.z], 0.03, '#8a6440', 0.006).rod([EASEL.x + 0.35, y, EASEL.z + 0.15], [EASEL.x, y + 1.9, EASEL.z], 0.03, '#8a6440', 0.006)
      .rod([EASEL.x, y, EASEL.z - 0.4], [EASEL.x, y + 1.7, EASEL.z], 0.03, '#8a6440', 0.006).box(EASEL.x, y + 0.95, EASEL.z + 0.06, 0.8, 0.05, 0.08, '#8a6440', { ink: 0.004 });
    k.box(EASEL.x + 0.6, y + 0.4, EASEL.z + 0.3, 0.4, 0.05, 0.3, '#f4efe2', { ink: 0.004 });
    for (let i = 0; i < 4; i++) k.add(KG.ball6, EASEL.x + 0.48 + i * 0.08, y + 0.44, EASEL.z + 0.3, 0.03, 0.015, 0.03, ['#d9434f', '#f2c94c', '#4c7fd8', '#5fae4f'][i], { ink: 0 });
    // the rose arch over the west path, the little stone statue on the green's edge
    y = gy(ARCH.x, ARCH.z);
    for (const dz of [-1.1, 1.1]) k.rod([ARCH.x, y, ARCH.z + dz], [ARCH.x, y + 2.2, ARCH.z + dz], 0.06, '#f4efe2', 0.008);
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI, zz = ARCH.z - Math.cos(a) * 1.1, yy = y + 2.2 + Math.sin(a) * 0.7; k.add(TK.G.ico1, ARCH.x, yy, zz, 0.2, 0.18, 0.2, ['#4f9a45', '#5fae4f'][i % 2], { ink: 0.008 }); if (i % 2) k.add(KG.ball6, ARCH.x - 0.12, yy + 0.08, zz, 0.08, 0.08, 0.06, i % 4 === 1 ? '#d9434f' : '#ff8fb1', { ink: 0.004 }); }
    y = gy(STATUE.x, STATUE.z);
    k.add(KG.cyl, STATUE.x, y + 0.3, STATUE.z, 0.45, 0.6, 0.45, '#b9b2a6').add(KG.body, STATUE.x, y + 0.6, STATUE.z, 0.6, 0.9, 0.6, '#c9c2b6', { ink: 0.012 }).add(KG.sphere, STATUE.x, y + 1.62, STATUE.z, 0.17, 0.17, 0.17, '#c9c2b6')
      .add(KG.cyl, STATUE.x + 0.3, y + 1.1, STATUE.z + 0.2, 0.1, 0.18, 0.08, '#c9c2b6', { rz: -0.8, ink: 0.006 });
    // seed packets on a crate, a snail on its stone, a ladybug on a leaf by the fruit tree, a rake against the bench
    y = gy(CRATE.x, CRATE.z);
    k.box(CRATE.x, y + 0.3, CRATE.z, 0.7, 0.6, 0.55, '#a8703f', { ry: 0.3 });
    for (let i = 0; i < 4; i++) k.box(CRATE.x - 0.2 + i * 0.14, y + 0.66, CRATE.z, 0.12, 0.16, 0.02, ['#f2c94c', '#ff8fb1', '#9b7fd0', '#e2574c'][i], { ry: 0.3, rx: -0.3, ink: 0.003 });
    y = gy(SNAIL.x, SNAIL.z);
    k.add(KG.sphere, SNAIL.x, y + 0.12, SNAIL.z, 0.35, 0.16, 0.3, '#8f8a80').add(KG.sphere, SNAIL.x + 0.05, y + 0.36, SNAIL.z, 0.1, 0.1, 0.06, '#c98a4a', { ink: 0.006 }).add(KG.sphere, SNAIL.x + 0.15, y + 0.29, SNAIL.z, 0.08, 0.04, 0.04, '#c9b48e', { ink: 0.004 });
    y = gy(BUG.x, BUG.z);
    k.add(KG.sphere, BUG.x, y + 1.0, BUG.z, 0.3, 0.04, 0.18, '#5fae4f', { rz: 0.3, ink: 0.006 }).add(KG.half, BUG.x + 0.05, y + 1.05, BUG.z, 0.06, 0.04, 0.05, '#d9434f', { ink: 0.004 });
    k.rod([BENCH.x - 1.0, gy(BENCH.x, BENCH.z), BENCH.z + 0.5], [BENCH.x - 0.6, gy(BENCH.x, BENCH.z) + 1.5, BENCH.z + 0.3], 0.03, '#8a6440', 0.006);
    k.box(BENCH.x - 0.6, gy(BENCH.x, BENCH.z) + 1.5, BENCH.z + 0.3, 0.4, 0.05, 0.08, '#6b4a30', { ink: 0.004 });
  }
  // the burnt hive stand (a charred frame) and, once the old hive is remembered, the new straw skep on it
  function skepG() {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, y = gy(SKEP.x, SKEP.z); g.position.set(SKEP.x, y, SKEP.z);
    for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) k.box(dx, 0.3, dz, 0.07, 0.6, 0.07, '#3a2e28', { ink: 0.006 });
    k.box(0, 0.62, 0, 0.8, 0.06, 0.8, '#4a3a30', { ink: 0.008 });
    const burnt = new THREE.Group(), kb = kit(); kb.add(KG.half, 0, 0.66, 0, 0.36, 0.3, 0.36, '#2f2a28', { ink: 0.008 }); kb.build(burnt);
    const skep = new THREE.Group(), ks = kit();
    for (let i = 0; i < 6; i++) ks.add(KG.torus, 0, 0.7 + i * 0.1, 0, 0.38 - i * 0.05, 0.38 - i * 0.05, 0.6, i % 2 ? '#e8c46a' : '#d9b25a', { rx: Math.PI / 2, ink: 0.004 });
    ks.add(KG.half, 0, 1.25, 0, 0.12, 0.08, 0.12, '#d9b25a', { ink: 0.004 }).add(KG.ball6, 0.3, 0.72, 0.1, 0.07, 0.05, 0.02, '#2b2235', { ink: 0 });
    ks.build(skep); skep.visible = false;
    k.build(g); g.add(burnt); g.add(skep); g.name = 'gd-past-skep';
    return { g, burnt, skep };
  }
  // Polo's kite, caught on the greenhouse roof (yellow, a long blue tail with bows)
  function kiteG() {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG;
    k.add(KG.cone4, 0, 0, 0, 0.45, 0.8, 0.06, '#f2c94c', { rz: 0, ink: 0.01 }).add(KG.cone4, 0, -0.52, 0, 0.45, 0.25, 0.06, '#f2c94c', { rx: Math.PI, ink: 0.01 });
    for (let i = 0; i < 6; i++) { k.rod([0.05 * Math.sin(i), -0.6 - i * 0.22, 0.02], [0.05 * Math.sin(i + 1), -0.82 - i * 0.22, 0.02], 0.012, '#4c7fd8', 0); if (i % 2) k.add(KG.cone4, 0.05 * Math.sin(i), -0.72 - i * 0.22, 0.02, 0.07, 0.05, 0.02, '#4c7fd8', { rz: Math.PI / 2, ink: 0 }); }
    k.build(g); g.name = 'gd-past-kite';
    return g;
  }
  function bannerTex() {
    const l = lang(), N = T().NAMES.banner, tx = M.plainT(N[l] || N.en);
    return TK.canvasTex(512, 96, (c, W0, H0) => {
      c.fillStyle = '#fbf6ee'; c.fillRect(0, 0, W0, H0); c.fillStyle = '#d9434f'; c.fillRect(0, 0, W0, 10); c.fillRect(0, H0 - 10, W0, 10);
      c.fillStyle = '#4f8a6a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 34px Georgia, "Microsoft YaHei", "Yu Mincho", serif'; c.fillText(tx.slice(0, 32), W0 / 2, H0 / 2 + 2);
    });
  }
  // butterflies round the flowers (sprites: a few loops)
  function butterflies() {
    const tex = TK.canvasTex(64, 64, c => { c.translate(32, 32); c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(-11, -6, 11, 9, -0.5, 0, TAU); c.ellipse(11, -6, 11, 9, 0.5, 0, TAU); c.ellipse(-8, 9, 7, 6, 0.4, 0, TAU); c.ellipse(8, 9, 7, 6, -0.4, 0, TAU); c.fill(); c.fillStyle = '#2b2235'; c.fillRect(-2, -12, 4, 26); });
    const out = [], homes = [[184.2, -62.6], [180.0, -72.0], [217.6, -58.8], [209.6, -86.6], [198.0, -64.0], [176.4, -62.4]], cols = ['#ffd166', '#9db8ff', '#ff9fc4', '#f4efe2', '#b9a2ff', '#ffb36b'];
    for (let i = 0; i < 12; i++) { const h = homes[i % homes.length], s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: cols[i % cols.length], transparent: true, depthWrite: false })); s.scale.setScalar(0.32); s.visible = false; G().w3d.scene.add(s); out.push({ s, hx: h[0], hz: h[1], ph: i * 1.7, r: 1.6 + (i % 3) * 0.7, y: gy(h[0], h[1]) + 1.1 + (i % 4) * 0.25 }); }
    return out;
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'gd-past-' + name; const k = kit(); fn(k); k.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), skep: skepG(), kite: kiteG(), bflies: butterflies(), solids: [] };
    scene.add(built.skep.g); built.skep.g.visible = false;
    built.kite.position.set(KITE.x, gy(KITE.x, KITE.z) + 4.9, KITE.z); built.kite.rotation.set(0.3, -0.4, 0.5); scene.add(built.kite); built.kite.visible = false;
    // the opening banner between its poles (facing the green, north)
    const b = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.0), new THREE.MeshBasicMaterial({ map: bannerTex(), side: THREE.DoubleSide }));
    b.position.set((POLES[0].x + POLES[1].x) / 2, gy(198, -61.2) + 3.9, -61.25); b.rotation.y = Math.PI; b.visible = false; b.name = 'gd-past-banner'; scene.add(b); built.banner = b;
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    for (const p of POLES) add(p.x, p.z, 0.15);
    add(SCAF.x, SCAF.z, 0.9); add(POTS.x, POTS.z, 0.6); add(EASEL.x, EASEL.z, 0.45); add(SKEP.x, SKEP.z, 0.5); add(STATUE.x, STATUE.z, 0.5); add(CRATE.x, CRATE.z, 0.45);
    add(ARCH.x, ARCH.z - 1.1, 0.12); add(ARCH.x, ARCH.z + 1.1, 0.12); add(SNAIL.x, SNAIL.z, 0.3);
    WORLD.extra.push(...built.solids);
    return built;
  }
  const solidsOn = on => { if (built) built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); };
  function show(on) {
    const B = build(), s = st();
    B.props.visible = on; B.skep.g.visible = on; B.banner.visible = on; B.kite.visible = on && !s.kiteDone;
    B.skep.skep.visible = !!s.hiveDone; B.skep.burnt.visible = !s.hiveDone;
    B.bflies.forEach(o => { o.s.visible = on; });
    solidsOn(on);
  }
  let hid = [];
  function update(dt, t) {
    const B = built; if (!B) return;
    // butterflies: little loops round their flowers
    for (const o of B.bflies) { o.ph += dt * 0.9; o.s.position.set(o.hx + Math.cos(o.ph) * o.r * Math.sin(o.ph * 0.31), o.y + Math.sin(o.ph * 2.1) * 0.3, o.hz + Math.sin(o.ph * 1.2) * o.r * 0.7); o.s.material.rotation = Math.sin(t * 22 + o.ph) * 0.25; o.s.scale.set(0.32 * (0.6 + 0.4 * Math.abs(Math.sin(t * 14 + o.ph))), 0.32, 1); }
    if (B.kite.visible) B.kite.rotation.z = 0.5 + Math.sin(t * 1.7) * 0.08;
    // the glazier stands up on his scaffold's plank
    const Gz = M.person('past', 'glazier'); if (Gz) { const y = gy(SCAF.x, SCAF.z) + 1.55; Gz.g.position.y = y; Gz.api.y = y; }
  }
  function late(dt) { M.showToday(dt, hid); }

  // ------------------------------------------------------------ talking to the people of then (the main path first; side quests come
  // through STORY.talkHooks below, as a little menu)
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const chats = {};
  const cycle = (id, keys) => { chats[id] = ((chats[id] || 0) + 1) % keys.length; return say1(id, keys[chats[id]]); };
  const heardN = () => M.HEARD.filter(k => st().heard && st().heard[k]).length;
  function talk(id) {
    const s = st(), done = !!TIME.flag('past', 'gdHouse');
    switch (id) {
      case 'gardener': return !s.met ? gardenerScene() : !s.joined ? (s.melisa && heardN() >= 3 ? insideAsk() : say1('gardener', 'gardener.again')) : done ? cycle('gardener', ['gardener.done', 'gardener.chat1', 'gardener.chat2']) : cycle('gardener', ['gardener.ok', 'gardener.chat1', 'gardener.chat2']);
      case 'melisa': return !s.melisa ? melisaScene() : cycle('melisa', ['melisa.chat1', 'melisa.chat2', 'melisa.after']);
      case 'glazier': case 'keeper': case 'painter': return !(s.heard && s.heard[id]) ? heardScene(id) : say1(id, id + '.chat');
      case 'tomasa': return cycle('tomasa', ['tomasa.1', 'tomasa.2', 'tomasa.3']);
      case 'polo': return s.kiteDone ? cycle('polo', ['polo.1', 'polo.after']) : say1('polo', 'polo.1');
      default: return null;
    }
  }
  // the main path, 1: the gardener describes how the greenhouse was (the imperfect for descriptions), the card, the task
  async function gardenerScene() {
    const s = st(), B = () => who('gardener'); if (!B()) return;
    M.lock(true);
    try { M.frame2(B()); await wait(0.4); await M.say(B(), ln('gardener.hello')); await M.demo(B(), T().DEMO['gardener.demo'], T().MARKS['gardener.demo']); } finally { M.lock(false); }
    await M.card(T().CARDS.desc);
    M.lock(true); try { M.frame2(B()); await M.say(B(), ln('gardener.task')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('Young {melisa} is by the beehives. The glazier, the beekeeper and the painter are around the gardens.', 5.5);
  }
  // the main path, 2: young Melisa's remembering game: what was the boy like? what did he wear?
  async function melisaScene() {
    const s = st(), K = () => who('melisa'); if (!K()) return;
    if (!s.melisaDemo) {
      M.lock(true); try { M.frame2(K()); await wait(0.3); await M.say(K(), ln('melisa.hello')); await M.demo(K(), T().DEMO['melisa.demo'], T().MARKS['melisa.demo']); s.melisaDemo = true; G().save(); } finally { M.lock(false); }
    }
    if ((s.melisaQ || 0) < 1) {
      M.lock(true); try { M.frame2(K()); await M.say(K(), ln('melisa.q1')); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.quiet, { tips: T().TIPS }); if (!r) { M.think('Young {melisa} is waiting: what was the boy like?', 4.5); return; }
      TIME.grade('gd.quiet', r.letter); s.melisaQ = 1; G().save();
    }
    if ((s.melisaQ || 0) < 2) {
      M.lock(true); try { M.frame2(K()); await M.say(K(), ln('melisa.q2')); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.cap, { tips: T().TIPS }); if (!r) { M.think('Young {melisa} is waiting: what did he wear on his head?', 4.5); return; }
      TIME.grade('gd.cap', r.letter); s.melisaQ = 2; G().save();
    }
    M.lock(true); try { M.frame2(K()); await M.say(K(), ln('melisa.after')); s.melisa = true; G().save(); } finally { M.lock(false); }
    M.think(heardN() >= 3 ? 'Back to {gardener}, by the greenhouse: tell him what it was like inside.' : 'Now the others: what was the greenhouse like inside?', 5);
  }
  // the main path, 3: each of the three describes the inside
  async function heardScene(id) {
    const s = st(), P = () => who(id); if (!P()) return;
    M.lock(true);
    try { M.frame2(P(), id === 'painter' ? -1 : 1); await wait(0.3); await M.demo(P(), T().DEMO[id + '.demo'], T().MARKS[id + '.demo']); await M.say(P(), ln(id + '.after')); (s.heard || (s.heard = {}))[id] = true; G().save(); } finally { M.lock(false); }
    const n = heardN();
    M.think(n >= 3 ? (s.melisa ? 'That’s all three. Tell {gardener}, by the greenhouse, what it was like inside.' : 'That’s all three. Young {melisa}, by the hives, remembers the quiet boy.') : `What the inside was like (${n}/3).`, 5);
  }
  // the main path, 4: «¿Cómo era el invernadero por dentro?» → «Estaba lleno de flores»
  async function insideAsk() {
    const s = st(), B = () => who('gardener'); if (!B()) return;
    M.lock(true); try { M.frame2(B()); await wait(0.3); await M.say(B(), ln('gardener.ask')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.inside, { tips: T().TIPS }); if (!r) { M.think('{gardener} is waiting: what was the greenhouse like inside?', 4.5); return; }
    TIME.grade('gd.inside', r.letter);
    M.lock(true); try { M.frame2(B()); await M.say(B(), ln('gardener.ok')); s.joined = true; G().save(); } finally { M.lock(false); }
    M.think('The greenhouse door is open. Inside, every hall forgot how it looked.', 5);
  }

  // ------------------------------------------------------------ side quest: «The painter's picture» (the Past changes today and tomorrow)
  async function paintScene() {
    const s = st(), P = () => who('painter'); if (!P()) return;
    if (!s.paintAsked) {
      M.lock(true); try { M.frame2(P(), -1); await wait(0.3); await M.say(P(), ln('paint.ask')); await M.demo(P(), T().DEMO['paint.demo'], T().MARKS['paint.demo']); s.paintAsked = true; G().save(); } finally { M.lock(false); }
    }
    for (const [k, key] of [['sky', 'gd.sky'], ['roses', 'gd.roses'], ['dometop', 'gd.dometop']]) {
      if ((s.paint || {})[k]) continue;
      const r = await M.ask(T().TASKS[k], { tips: T().TIPS, icon: 'star' }); if (!r) { M.think('{painter} is waiting, brush in hand: how was it all this morning?', 4.5); return; }
      TIME.grade(key, r.letter); (s.paint || (s.paint = {}))[k] = r.letter; G().save();
      if (k !== 'dometop') { M.lock(true); try { M.frame2(P(), -1); await M.say(P(), ln('paint.next')); } finally { M.lock(false); } }
    }
    M.lock(true);
    try {
      const E = EASEL, y = gy(E.x, E.z);
      M.shot(V(E.x - 1.8, y + 2.0, E.z - 2.6), V(E.x, y + 1.3, E.z)); await wait(0.6);
      TIME.flag('past', 'gdPaint', true); TIME.refresh(); s.paintDone = true; G().save();
      G().w3d.fx.sparkle(E.x, y + 1.4, E.z, 18, ['#ffd166', '#9db8ff', '#ff9fc4', '#5fae4f']); snd('learned'); await wait(1.0);
      const P2 = P(); M.frame2(P2, -1); await M.say(P2, ln('paint.done'));
      G().state.coins = (G().state.coins || 0) + 8; UI.toast('+8 coins'); snd('chest');
    } finally { M.lock(false); }
    M.think('A painting of the gardens as they were… Will anyone keep it?', 5);
  }
  // the painting: long ago on the easel (gray and half-done before you help), today framed by the greenhouse door, tomorrow faded
  function paintTex(kind) {
    const l = lang(), N = T().NAMES, title = M.plainT(N.painting[l] || N.painting.en), ded = M.plainT(N.dedication[l] || N.dedication.en);
    return TK.canvasTex(256, 200, (c, W0, H0) => {
      const gray = kind === 'future', half = kind === 'half', g = (h, k = 0.62) => { if (!gray) return h; const co = new THREE.Color(h), v = co.r * 0.3 + co.g * 0.55 + co.b * 0.15; return '#' + co.lerp(new THREE.Color(v * 0.9, v * 0.9, v * 0.95), k).getHexString(); };
      c.fillStyle = g('#f4ead2'); c.fillRect(0, 0, W0, H0);
      c.fillStyle = half ? '#d8d4cc' : g('#8fc4ee'); c.fillRect(10, 10, W0 - 20, 80);
      if (!half) { c.fillStyle = g('#ffffff'); for (const [x, y] of [[60, 34], [170, 28], [120, 52]]) { c.beginPath(); c.ellipse(x, y, 22, 9, 0, 0, TAU); c.fill(); } }
      c.fillStyle = half ? '#bdb8b0' : g('#7fb45a'); c.fillRect(10, 90, W0 - 20, 96);
      c.fillStyle = half ? '#e0ddd6' : g('#f4f8f8'); c.beginPath(); c.ellipse(128, 104, 46, 26, 0, Math.PI, 0); c.fill(); c.fillRect(82, 104, 92, 34);
      if (!half) { for (let i = 0; i < 26; i++) { c.fillStyle = g(['#d9434f', '#f2c94c', '#ff8fb1', '#9b7fd0'][i % 4]); c.beginPath(); c.arc(18 + (i * 37) % 220, 150 + (i * 13) % 30, 4, 0, TAU); c.fill(); } }
      c.strokeStyle = g('#6b4a30'); c.lineWidth = 8; c.strokeRect(4, 4, W0 - 8, H0 - 8);
      if (!half) { c.fillStyle = g('#3a2a20'); c.textAlign = 'center'; c.font = '700 13px Georgia, "Microsoft YaHei", "Yu Mincho", serif'; c.fillText(title.slice(0, 34), W0 / 2, H0 - 22); c.font = 'italic 10px Georgia, "Microsoft YaHei", "Yu Mincho", serif'; c.fillText(ded.slice(0, 44), W0 / 2, H0 - 10); }
    });
  }
  function paintingMesh(w) {
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ map: paintTex(w === 'future' ? 'future' : w === 'half' ? 'half' : 'now') });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), mat);
    if (w === 'past' || w === 'half') { const y = gy(EASEL.x, EASEL.z); m.position.set(EASEL.x, y + 1.38, EASEL.z + 0.04); m.rotation.x = -0.12; m.rotation.y = Math.PI; g.add(m); g.name = 'gd-paint-' + w; return { obj: g }; }
    // today and tomorrow: framed, on a little wooden stand by the greenhouse door
    const P0 = PAINT.now, y = gy(P0.x, P0.z), k = kit(), wood = w === 'future' ? '#7a7670' : '#8a6440';
    k.rod([P0.x, y, P0.z - 0.4], [P0.x, y + 1.3, P0.z - 0.4], 0.04, wood, 0.006).rod([P0.x, y, P0.z + 0.4], [P0.x, y + 1.3, P0.z + 0.4], 0.04, wood, 0.006);
    k.box(P0.x + 0.02, y + 1.62, P0.z, 0.06, 0.86, 1.06, w === 'future' ? '#6b6560' : '#b08a3a', { ink: 0.008 });
    k.build(g);
    m.position.set(P0.x - 0.03, y + 1.62, P0.z); m.rotation.y = P0.ry; g.add(m); g.name = 'gd-paint-' + w;
    return { obj: g, solids: [{ x: P0.x, z: P0.z, r: 0.45 }] };
  }
  const paintLook = w => async () => {
    const l = lang(), D = T().NAMES.dedication, d = M.plainT(D[l] || D.en);
    if (w === 'past') { M.lookAt('w.gd_painting', `{painter}’s {w.gd_painting} on her {w.gd_easel}, her {w.gd_brush} still wet: the gardens as they were this morning. In the corner: «${d}».`, 7); return; }
    if (w === 'now') {
      M.lookAt('w.gd_painting', `An old {w.gd_painting} by the greenhouse door: the gardens long ago, bright as the day it was painted. In the corner: «${d}». Melisa says a friend of her mother’s painted it, the summer she was little.`, 8.5);
      const n = M.st('now'); if (!n.paintSeen) { n.paintSeen = true; G().save(); }
      return;
    }
    M.lookAt('w.gd_painting', `The same {w.gd_painting}, faded gray… but you can still tell the colors of then. «${d}». Somebody kept it all these years.`, 7);
    const f = M.st('future'); if (!f.paintSeen) { f.paintSeen = true; G().save(); }
  };
  TIME.effect('gardens.painting', { region: 'gardens', when: () => !!TIME.flag('past', 'gdPaint'),
    show: { past: () => paintingMesh('past'), now: () => paintingMesh('now'), future: () => paintingMesh('future') },
    before: { past: () => paintingMesh('half') },
    act: { past: { x: 190.2, z: -70.0, r: 1.3, label: 'Look', run: paintLook('past') }, now: { x: PAINT.now.look.x, z: PAINT.now.look.z, r: 1.3, label: 'Look', run: paintLook('now') },
      future: { x: PAINT.now.look.x, z: PAINT.now.look.z, r: 1.3, label: 'Look', run: paintLook('future') } } });

  // ------------------------------------------------------------ side quest: «Young Polo's kite» (the glazier spots it from his scaffold)
  async function kiteAsk() {
    const s = st(), P = () => who('polo'); if (!P()) return;
    M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('polo.2')); await M.demo(P(), T().DEMO['kite.demo'], T().MARKS['kite.demo']); s.kiteAsked = true; G().save(); } finally { M.lock(false); }
    M.think('{glazier} is up on his scaffold by the greenhouse. From there, he might see the kite.', 5);
  }
  async function kiteScene() {
    const s = st(), Gz = () => who('glazier'); if (!Gz()) return;
    M.lock(true); try { M.frame2(Gz()); await wait(0.3); await M.say(Gz(), ln('kite.ask')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.kite, { tips: T().TIPS }); if (!r) { M.think('{glazier} is waiting: what was the kite like?', 4); return; }
    TIME.grade('gd.kite', r.letter);
    M.lock(true);
    try {
      const B = build(), y0 = gy(KITE.x, KITE.z) + 4.9;
      M.shot(V(KITE.x + 4, y0 - 0.8, KITE.z - 6), V(KITE.x, y0 - 1.0, KITE.z)); await wait(0.5);
      const G2 = Gz(); await M.say(G2, ln('kite.found'));
      const P = who('polo'), to = P ? { x: P.x, z: P.z } : { x: 186, z: -66 };
      await STORY.tween(1.6, k => { B.kite.position.set(lerp(KITE.x, to.x, k), y0 + Math.sin(k * Math.PI) * 1.6 - k * (y0 - gy(to.x, to.z) - 1.4), lerp(KITE.z, to.z, k)); B.kite.rotation.y = k * 6; });
      s.kiteDone = true; B.kite.visible = false; G().save(); snd('chime');
      if (P) { M.frame2(P); await M.say(P, ln('polo.after')); }
      G().state.coins = (G().state.coins || 0) + 5; UI.toast('+5 coins'); snd('chest');
    } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ side quest: «The bees' old hive» (the beekeeper; young Melisa remembers it)
  async function hiveAsk() {
    const s = st(), K = () => who('keeper'); if (!K()) return;
    M.lock(true); try { M.frame2(K()); await wait(0.3); await M.say(K(), ln('hive.ask')); await M.say(K(), ln('hive.who')); s.hiveAsked = true; G().save(); } finally { M.lock(false); }
    M.think('Young {melisa} is right there. Ask her about the old hive.', 4.5);
  }
  async function hiveMelisa() {
    const s = st(), K = () => who('melisa'); if (!K()) return;
    M.lock(true); try { M.frame2(K()); await wait(0.3); await M.demo(K(), T().DEMO['skep.demo'], T().MARKS['skep.demo']); s.hiveKnown = true; G().save(); } finally { M.lock(false); }
    M.think('Round, and made of straw… Tell {keeper}.', 4);
  }
  async function hiveScene() {
    const s = st(), K = () => who('keeper'); if (!K()) return;
    const r = await M.ask(T().TASKS.skep, { tips: T().TIPS }); if (!r) { M.think('{keeper} is waiting: what was the old hive like?', 4); return; }
    TIME.grade('gd.skep', r.letter);
    M.lock(true);
    try {
      const B = build(), y = gy(SKEP.x, SKEP.z);
      M.shot(V(SKEP.x - 3.2, y + 2.2, SKEP.z - 3.0), V(SKEP.x, y + 0.9, SKEP.z)); await wait(0.5);
      B.skep.burnt.visible = false; B.skep.skep.visible = true; G().w3d.fx.puff(SKEP.x, y + 0.9, SKEP.z, 12, 0.3, '#e8c46a'); snd('wood');
      s.hiveDone = true; G().save(); await wait(0.6);
      for (let i = 0; i < 6; i++) { G().w3d.fx.sparkle(SKEP.x + (Math.random() - 0.5), y + 1.0 + Math.random(), SKEP.z + (Math.random() - 0.5), 4, ['#f2c94c', '#2b2235']); await wait(0.15); }
      const K2 = K(); M.frame2(K2); await M.say(K2, ln('hive.done'));
      G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); snd('chest');
    } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ the Talk menus: side quests (the main path's scenes play straight off a Talk)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'past' || TIME.regionNow() !== 'gardens') return null;
    const s = st();
    if (it.who === 'past:painter' && s.heard && s.heard.painter && !s.paintDone) return [{ label: 'The painter’s picture', sub: '◆ side quest', run: paintScene }];
    if (it.who === 'past:polo' && s.met && !s.kiteDone && !s.kiteAsked) return [{ label: 'The lost kite', sub: '◆ side quest', run: kiteAsk }];
    if (it.who === 'past:glazier' && s.kiteAsked && !s.kiteDone && s.heard && s.heard.glazier) return [{ label: 'Polo’s kite', sub: '◆ side quest', run: kiteScene }];
    if (it.who === 'past:keeper' && s.heard && s.heard.keeper && !s.hiveDone) return [{ label: 'The old hive', sub: '◆ side quest', run: s.hiveKnown ? hiveScene : hiveAsk }];
    if (it.who === 'past:melisa' && s.melisa && s.hiveAsked && !s.hiveKnown) return [{ label: 'The old hive', sub: '◆ side quest', run: hiveMelisa }];
    return null;
  });

  // ------------------------------------------------------------ E: the greenhouse's door, and the things you can look at
  const LOOKS = [
    { id: 'w.gd_ribbon', at: { x: 195.2, z: -63.4 }, line: () => { const l = lang(), N = T().NAMES.banner; return `A red {w.gd_ribbon} across the door, and a banner: «${M.plainT(N[l] || N.en)}». The {w.greenhouse} opened this {w.gd_summer}.`; } },
    { id: 'w.gd_wateringcan', at: { x: 205.0, z: -62.8 }, line: () => 'New {w.gd_pot:pl}, stacked by the door, and a small {w.gd_wateringcan}. Someone used it every day.' },
    { id: 'w.gd_easel', at: { x: 190.2, z: -70.0 }, when: () => !TIME.flag('past', 'gdPaint'), line: () => '{painter}’s {w.gd_easel}. The {w.gd_painting} on it is only half done, and gray.' },
    { id: 'w.gd_skep', at: { x: 211.0, z: -67.6 }, line: () => (st().hiveDone ? 'A {w.gd_skep}, round as a loaf, on its stand. The {w.bee:pl} are back.' : 'A hive stand, black from a fire. Whatever hive was here burned in the spring.') },
    { id: 'w.gd_kite', at: { x: 204.8, z: -66.0 }, line: () => (st().kiteDone ? 'The greenhouse {w.gd_roof}, all glass and white frames.' : 'Something yellow is caught on the greenhouse {w.gd_roof}: a {w.gd_kite}, with a long blue {w.gd_tail}.') },
    { id: 'w.gd_snail', at: { x: 181.4, z: -65.6 }, line: () => 'A {w.gd_snail} on a warm {w.gd_stone}, in no hurry at all.' },
    { id: 'w.gd_ladybug', at: { x: 180.2, z: -59.6 }, line: () => 'A {w.gd_ladybug} on a big {w.gd_leaf}. Red, with black dots.' },
    { id: 'w.gd_seed', at: { x: 209.0, z: -78.6 }, line: () => 'Little packets of {w.gd_seed:pl} on a crate: roses, sunflowers, lavender. Each one drawn by hand.' },
    { id: 'w.gd_statue', at: { x: 193.4, z: -81.6 }, line: () => 'A little stone {w.gd_statue}: a girl pouring water from a jar. Moss on her shoulders already.' },
    { id: 'w.gd_arch', at: { x: 187.6, z: -79.0 }, line: () => 'A white {w.gd_arch} over the path, covered in climbing {w.rose:pl}. It smells sweet.' },
    { id: 'w.qr_bench', at: { x: 213.0, z: -83.2 }, line: () => 'A wooden bench by the cottage door, a {w.gd_rake} leaning on it. Young {melisa} says the boy’s {w.gd_cap} was here, one morning.' },
  ];
  function interactables() {
    const s = st(), out = [];
    out.push({ x: M.DOOR.x, z: M.DOOR.z - 0.3, r: 2.0, label: s.joined ? 'Go in' : 'Look', run: async () => {
      if (!s.joined) { M.lookAt('w.greenhouse', s.met ? 'The new {w.greenhouse}’s door. Through the {w.gd_glass}, everything inside is gray.' : 'The brand-new great {w.greenhouse}. Its {w.gd_glass} shines… but inside, it looks gray.', 4.5); return; }
      if (typeof GD_PHOUSE !== 'undefined' && GD_PHOUSE) await GD_PHOUSE.enter();
    } });
    for (const L0 of LOOKS) { if (L0.when && !L0.when()) continue; out.push({ x: L0.at.x, z: L0.at.z, r: 1.3, label: 'Look', run: async () => M.lookAt(L0.id, L0.line(), 5.5) }); }
    return out;
  }
  function nextId() { const s = st(); return !s.met ? 'gardener' : !s.melisa ? 'melisa' : heardN() < 3 ? 'heard' : !s.joined ? 'gardener' : 'door'; }
  const HINTS = { gardener: '{mimo} points at an old man in a straw hat, by the greenhouse.', melisa: '{mimo} points at a little girl by the beehives.', door: '{mimo} looks at the greenhouse door.',
    glazier: '{mimo} points at a man up on a scaffold, by the greenhouse.', keeper: '{mimo} points at the beekeeper, by the hives.', painter: '{mimo} points at a painter at her easel, on the green.',
    tomasa: '{mimo} points at a young woman by the sunflowers.', polo: '{mimo} points at a sneezing boy by the roses.' };
  function target(id) {
    if (id === 'door') return (typeof GD_PHOUSE !== 'undefined' && GD_PHOUSE && GD_PHOUSE.inside && GD_PHOUSE.target()) || { x: M.DOOR.x, z: M.DOOR.z, hint: HINTS.door };
    if (id === 'heard') { const s = st(), n = M.HEARD.find(k => !(s.heard && s.heard[k])); if (!n) return target('gardener'); id = n; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || '{mimo} points.' };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('gd_past') ? 'gd_past' : 'past');

  // ------------------------------------------------------------ the side quests (QUESTS.LIST: they start as the story reaches them)
  if (typeof QUESTS !== 'undefined') {
    const pS = s => M.sp(s), nS = s => M.sn(s);
    const pastAt = id => () => M.via('past', () => target(id));
    if (!QUESTS.LIST.some(q => q.id === 'gd.paint')) QUESTS.LIST.push({ id: 'gd.paint', kind: 'side',
      get title() { return M.fillEn('{painter}’s picture'); }, get giver() { return M.fillEn('{painter}, a painter (the Bloom Gardens, long ago)'); },
      started: s => !!(pS(s).heard && pS(s).heard.painter),
      steps: [
        { get text() { return M.fillEn('In the Past: describe for {painter} how it all was this morning (3)'); }, get why() { return M.fillEn(`The light changed before she could finish. Describe it as it was: ${M.sx('paint')}.`); },
          done: s => !!pS(s).paintDone, target: pastAt('painter'), hint: HINTS.painter },
        { text: 'Today: is the painting still there? Look by the great greenhouse’s door', why: 'A painting made long ago… somebody may have kept it.',
          done: s => !!nS(s).paintSeen, target: () => M.via('now', () => ({ x: PAINT.now.look.x, z: PAINT.now.look.z, hint: '{mimo} points at a frame by the greenhouse door.' })), hint: '{mimo} points at a frame by the greenhouse door.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'gd.kite')) QUESTS.LIST.push({ id: 'gd.kite', kind: 'side',
      get title() { return M.fillEn('Young {polo}’s kite'); }, get giver() { return M.fillEn('young {polo}, by the roses (the Bloom Gardens, long ago)'); },
      started: s => !!pS(s).kiteAsked,
      steps: [
        { get text() { return M.fillEn('In the Past: describe the kite to {glazier}, up on his scaffold'); }, why: 'From up there he can see the whole roof. What was the kite like?',
          done: s => !!pS(s).kiteDone, target: pastAt('glazier'), hint: HINTS.glazier },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'gd.hive')) QUESTS.LIST.push({ id: 'gd.hive', kind: 'side',
      title: 'The bees’ old hive', get giver() { return M.fillEn('{keeper}, the beekeeper (the Bloom Gardens, long ago)'); },
      started: s => !!pS(s).hiveAsked,
      steps: [
        { get text() { return M.fillEn('In the Past: ask young {melisa} what the old hive was like'); }, why: 'She spent every day by it.', done: s => !!pS(s).hiveKnown, target: pastAt('melisa'), hint: HINTS.melisa },
        { get text() { return M.fillEn('Describe the old hive to {keeper}'); }, why: 'What it was like, long ago: the imperfect.', done: s => !!pS(s).hiveDone, target: pastAt('keeper'), hint: HINTS.keeper },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks (TIME calls them: time.js "TIME dresses it")
  Object.assign(M.DRESS.past, {
    people: PEOPLE,
    on(api) { show(true); hid = M.hideToday(api); },
    off() { show(false); hid = []; },
    entered() { show(true); },
    late: (api, dt) => { if (typeof GD_PHOUSE !== 'undefined' && GD_PHOUSE && GD_PHOUSE.inside) GD_PHOUSE.late(dt); else late(dt); },
    update(api, dt, t) { update(dt, t); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, PEOPLE, who, build, show, LOOKS, PAINT,
    target: id => target(id), song: () => song(), init: () => {}, changed: () => {},
    _: { talk: id => talk(id), gardenerScene, melisaScene, heardScene, insideAsk, paintScene, kiteAsk, kiteScene, hiveAsk, hiveMelisa, hiveScene, get built() { return built; } } };
})();
