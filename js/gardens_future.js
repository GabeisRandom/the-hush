'use strict';
// The Bloom Gardens, tomorrow (DESIGN.md 20 "T3a"): the valley if nobody speaks up. TIME dresses it (time_gardens.js
//   GARDT.DRESS.future): the flower fields wilted to gray stalks, the bees gone, the greenhouse's glass clouded and cracked, gray
//   thorns over its door and a «closed» sign, the show's tables under a tarp, cobwebs on the marquee, drifts of dead leaves, a dry
//   tap and its bucket, Bento's empty tea table, Dalia's seedling trays, a tarnished trophy. Today's people and the show's things
//   are hidden; six of them stand here older, frozen gray (TIME's look: 'future' with k(api): the color comes back as they wake).
// The main path (GARDT.FSTEPS): Flora, grown up, the only one still talking, shows how to ask gently («¿Podría…?», «Querría…», «Me
//   encantaría…») → four frozen gardeners, each holding what the greenhouse needs: ask Tomasa for the key («¿Podría darme la llave,
//   por favor?»), tell Polo what you'd like («Querría las tijeras»), tell Lola what you'd like to do («Me gustaría entrar en el
//   invernadero»), and say your wish to Melisa («Me encantaría oír las abejas otra vez») → together they cut the thorns from the
//   door → the greenhouse tomorrow (gardens_future_dungeon.js) → the Thorn Warden (gardens_time_boss.js) → the echo → Noa.
// Side quests: «A warning from tomorrow» (cross-time: old Melisa knows why the bees left; tell today's Melisa, and she plants new
//   lavender today: a young bed by the hives, and tomorrow the same bed grown wide, the bees still here), «Bento's tea table»
//   (order politely, three times), «Dalia's seeds» (an optional wake: ask her for seeds, and they sprout).
const GD_FUT = (() => {
  if (typeof TIME === 'undefined' || typeof GARDT === 'undefined' || !GARDT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = GARDT, T = () => GFTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('future');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are
  const AT = {
    flora: { x: 201.8, z: -80.6, yaw: Math.PI }, melisa: { x: 216.4, z: -72.8, yaw: -Math.PI / 2 }, tomasa: { x: 213.0, z: -61.2, yaw: 1.6 },
    polo: { x: 186.4, z: -66.4, yaw: -2.2 }, lola: { x: 202.2, z: -63.4, yaw: -2.8 }, bento: { x: 184.4, z: -76.8, yaw: Math.PI / 2 }, dalia: { x: 187.4, z: -60.2, yaw: 2.6 },
  };
  const WAKE = M.WAKE, ALL = ['tomasa', 'polo', 'lola', 'melisa', 'bento', 'dalia'];
  const TEA = { x: 185.7, z: -76.8 }, TRAYS = { x: 186.0, z: -61.6 }, TAP = { x: 205.4, z: -67.0 }, TROPHY = { x: 191.0, z: -76.6 };
  const LAV = { x: 211.0, z: -64.4, sign: { x: 209.4, z: -63.6 }, look: { x: 209.8, z: -65.4 } };
  const C = () => T().CAST;
  const LOOK = {
    flora: { skin: '#c98e62', hair: '#1f1a18', hairdo: 'tails', dress: '#5fa86a', vest: '#4a4f66', hat: 'straw', hatColor: '#4c7fd8', h: 1.0 },
    melisa: { skin: '#d9a27a', hair: '#d8d4cc', hairdo: 'bun', dress: '#f2d16b', apron: '#f4efe2', shawl: '#c9a24a', glasses: true, prop: 'cane', h: 0.96 },
    tomasa: { skin: '#efc29a', hair: '#f4f0ea', hairdo: 'bun', dress: '#7a5a8a', shawl: '#c9643f', hat: 'straw', hatColor: '#f2c94c', prop: 'cane', glasses: true, h: 0.9 },
    polo: { skin: '#a8714a', hair: '#d8d4cc', hairdo: 'bald', stache: true, hair2: '#d8d4cc', dress: '#4c7fd8', vest: '#3f3a4a', hat: 'cap', hatColor: '#5fb257', wide: 1.12, h: 1.0 },
    lola: { skin: '#f0c7a0', hair: '#8a4a2a', hairdo: 'braids', dress: '#ff8fb1', vest: '#4a4566', prop: 'lantern', h: 0.98 },
    bento: { skin: '#c98e62', hair: '#bdb6ae', hairdo: 'short', beard: true, hair2: '#bdb6ae', dress: '#f4efe2', apron: '#e8e0cf', hat: 'straw', hatColor: '#f4efe2', h: 1.0 },
    dalia: { skin: '#efc29a', hair: '#c9a24a', hairdo: 'tails', dress: '#e8e0cf', vest: '#5fb257', hat: 'scarf', hatColor: '#9b7fd0', prop: 'basket', h: 0.98 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('future', id);
  const woke = id => !!(st().woke && st().woke[id]);
  const wokeN = (list = ALL) => list.filter(woke).length;
  const free = () => !!TIME.flag('future', 'gdFree');

  // ------------------------------------------------------------ the color comes back as they wake (0.12 gray … 1 healed)
  function k() { return Math.min(1, 0.12 + 0.5 * wokeN() / ALL.length + (free() ? 0.55 : 0)); }
  // the frozen: each person's own material, gray until woken (uGray 1 → 0 as they wake): molinar_future.js's way
  const FROZEN = {};
  function frozenMat(P) {
    const id = P.def.id; if (FROZEN[id]) return FROZEN[id];
    const body = P.body.children[0]; if (!body || !body.material) return null;
    const m = body.material.clone(), u = { uGray: { value: woke(id) ? 0 : 1 } };
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = u.uGray;
      sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.86, l * 0.95), uGray); }');
    };
    m.customProgramCacheKey = () => 'gdFrozen';
    body.material = m;
    return (FROZEN[id] = { m, u });
  }
  function dressPeople() {
    const list = TIME.people && TIME.people.all['gardens:future']; if (!list) return;
    for (const P of list) { if (P.def.id === 'flora') continue; const F = frozenMat(P); if (F && F.tw == null) F.u.uGray.value = woke(P.def.id) ? 0 : 1; }
  }

  // ------------------------------------------------------------ the dressing: wilted stalks, thorns, tarps, leaves, the gray glass
  let built = null;
  const kit = () => PAST.API.Kit();
  const rnd = seed => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
  function stalks(k) {
    const KG = PAST.API.KG, Ga = GARDENS, R = rnd(71);
    for (const f of Ga.FIELDS || []) {
      const c = Math.cos(f.rot), s = Math.sin(f.rot), step = 0.9;
      for (let lx = -f.hw + 0.4; lx < f.hw; lx += step) for (let lz = -f.hd + 0.4; lz < f.hd; lz += step) {
        const x = f.x + lx * c + lz * s + (R() - 0.5) * 0.3, z = f.z - lx * s + lz * c + (R() - 0.5) * 0.3, y = gy(x, z), h = f.kind === 'sunflower' ? 1.5 : 0.7;
        k.rod([x, y, z], [x + (R() - 0.5) * 0.3, y + h, z + (R() - 0.5) * 0.3], f.kind === 'sunflower' ? 0.04 : 0.025, R() < 0.5 ? '#8a8270' : '#9a9080', 0);
        if (f.kind === 'sunflower') k.add(KG.cyl, x + 0.15, y + h - 0.15, z, 0.22, 0.05, 0.22, '#6f6658', { rx: 2.4, ink: 0.006 });
        else if (R() < 0.5) k.add(KG.ball6, x, y + h * 0.7, z, 0.07, 0.05, 0.07, '#7a7060', { ink: 0 });
      }
    }
  }
  function props(k) {
    const KG = PAST.API.KG, R = rnd(13), Ga = GARDENS;
    stalks(k);
    // a gray tarp over each judging table, a tarnished trophy on the first
    for (const t of Ga.TABLES || []) { const y = gy(t.x, t.z); k.box(t.x, y + 0.86, t.z, 2.5, 0.06, 1.3, '#8a8690', { ry: -t.rot, ink: 0.01 }); for (const s of [-1, 1]) k.box(t.x + Math.cos(t.rot) * s * 1.22, y + 0.5, t.z - Math.sin(t.rot) * s * 1.22, 0.06, 0.72, 1.2, '#7f7b86', { ry: -t.rot, ink: 0.006 }); }
    let y = gy(TROPHY.x, TROPHY.z);
    k.add(KG.cyl, TROPHY.x, y + 0.92, TROPHY.z, 0.12, 0.06, 0.12, '#8a7a4a', { ink: 0.006 }).add(KG.cyl, TROPHY.x, y + 1.02, TROPHY.z, 0.04, 0.16, 0.04, '#8a7a4a', { ink: 0.004 }).add(KG.half, TROPHY.x, y + 1.24, TROPHY.z, 0.16, -0.16, 0.16, '#9a8a5a', { ink: 0.006 });
    // torn gray flaps and cobwebs on the marquee, cobwebs on the cottages' corners
    for (let i = 0; i < 6; i++) { const x = 192.4 + i * 2.2; k.box(x, gy(x, -70.5) + 2.0, -70.5, 0.5, 0.9, 0.02, '#6a6670', { rz: (R() - 0.5) * 0.6, ink: 0.004 }); }
    for (const [x, z, yy] of [[191.9, -70.4, 2.5], [204.1, -70.4, 2.5], [186.6, -82.8, 2.2], [214.0, -81.4, 2.2], [219.6, -78.4, 2.2]]) k.box(x, gy(x, z) + yy, z, 0.6, 0.45, 0.02, '#c8c4d0', { rz: 0.5, ink: 0 });
    // drifts of dead leaves round the green
    for (let i = 0; i < 9; i++) { const x = 196 + Math.cos(i * 1.3) * 9 + (R() - 0.5) * 3, z = -76 + Math.sin(i * 1.3) * 6; k.add(KG.ball6, x, gy(x, z) + 0.06, z, 0.6 + R() * 0.4, 0.12, 0.45, ['#8a6f52', '#7a6a5a', '#94806a'][i % 3], { ry: R() * 6, ink: 0 }); }
    k.add(KG.ball6, 206.0, gy(206, -83.2) + 0.08, -83.2, 1.1, 0.16, 0.8, '#8a6f52', { ink: 0 });
    // the dry tap on its post, a bucket under it
    y = gy(TAP.x, TAP.z);
    k.rod([TAP.x, y, TAP.z], [TAP.x, y + 1.0, TAP.z], 0.05, '#6b6560', 0.006).box(TAP.x + 0.12, y + 0.96, TAP.z, 0.24, 0.06, 0.06, '#7a7680', { ink: 0.004 }).add(KG.cyl, TAP.x + 0.24, y + 0.88, TAP.z, 0.03, 0.1, 0.03, '#7a7680', { ink: 0 })
      .add(KG.cyl, TAP.x + 0.24, y + 0.18, TAP.z, 0.22, 0.36, 0.22, '#6f7a86', { ink: 0.008 });
    // Bento's tea table: a teapot, cups, an empty tray, a little sign
    y = gy(TEA.x, TEA.z);
    k.box(TEA.x, y + 0.72, TEA.z, 1.0, 0.06, 0.9, '#a8743f', { ink: 0.01 }); for (const [dx, dz] of [[-0.42, -0.36], [0.42, -0.36], [-0.42, 0.36], [0.42, 0.36]]) k.box(TEA.x + dx, y + 0.36, TEA.z + dz, 0.06, 0.72, 0.06, '#8a5a3a', { ink: 0.004 });
    k.add(KG.sphere, TEA.x - 0.2, y + 0.88, TEA.z, 0.16, 0.14, 0.16, '#e8e4dc', { ink: 0.008 }).add(KG.cone, TEA.x - 0.02, y + 0.9, TEA.z, 0.03, 0.12, 0.03, '#e8e4dc', { rz: -1.2, ink: 0.004 });
    for (const dz of [-0.25, 0.25]) k.add(KG.cyl, TEA.x + 0.25, y + 0.8, TEA.z + dz, 0.07, 0.09, 0.07, '#f4efe2', { ink: 0.004 });
    k.box(TEA.x + 0.05, y + 0.76, TEA.z + 0.3, 0.5, 0.02, 0.3, '#c9b48e', { ink: 0.003 });
    // Dalia's seedling trays (bare until her seeds are planted)
    y = gy(TRAYS.x, TRAYS.z);
    for (let i = 0; i < 3; i++) k.box(TRAYS.x + i * 0.55 - 0.55, y + 0.08, TRAYS.z, 0.5, 0.16, 0.4, '#6b5a4a', { ink: 0.006 }).box(TRAYS.x + i * 0.55 - 0.55, y + 0.17, TRAYS.z, 0.44, 0.02, 0.34, '#4a3a30', { ink: 0 });
  }
  // gray thorns over the greenhouse door (cut away once the four are awake), and the «closed» sign on them
  function thornsG() {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, D = M.DOOR, y = gy(D.x, D.z), z = -60.75, R = rnd(5);
    for (let i = 0; i < 22; i++) { const a = R() * Math.PI, x = D.x + Math.cos(a) * 1.3, yy = y + 0.2 + Math.sin(a) * 2.4 * R(); k.rod([D.x + (R() - 0.5) * 2.2, y, z], [x, yy, z - 0.1], 0.05, i % 2 ? '#6f6b7a' : '#5a5666', 0.008); k.add(KG.cone, x, yy, z - 0.15, 0.05, 0.2, 0.05, '#4a4656', { rz: a, ink: 0 }); }
    k.build(g); g.name = 'gd-fut-thorns';
    const l = lang(), N = T().NAMES.closed, tx = M.plainT(N[l] || N.en);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.36), new THREE.MeshBasicMaterial({ map: TK.canvasTex(256, 100, (c, W0, H0) => { c.fillStyle = '#a8a4ae'; c.fillRect(0, 0, W0, H0); c.strokeStyle = '#4a4656'; c.lineWidth = 8; c.strokeRect(4, 4, W0 - 8, H0 - 8); c.fillStyle = '#3a3640'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 40px Georgia, "Microsoft YaHei", "Yu Mincho", serif'; c.fillText(tx.slice(0, 14), W0 / 2, H0 / 2); }) }));
    sign.position.set(D.x, y + 1.7, z - 0.2); sign.rotation.y = Math.PI; sign.rotation.z = 0.08; g.add(sign);
    return g;
  }
  // the clouded glass: the gardens' own panes, drawn gray and half opaque (one mesh sharing their geometry)
  function grayGlass() {
    const B = G().gardens, src = B && B.objects && B.objects.glass; if (!src) return null;
    const m = new THREE.Mesh(src.geometry, new THREE.MeshToonMaterial({ color: '#8f9aa0', gradientMap: TK.grad, transparent: true, opacity: 0.62, depthWrite: false, side: THREE.DoubleSide }));
    m.renderOrder = 3; m.name = 'gd-fut-glass'; m.visible = false; G().w3d.scene.add(m);
    // broken panes on the little glasshouse: dark jagged holes
    const k = kit(), KG = PAST.API.KG, g = new THREE.Group(); g.name = 'gd-fut-holes';
    for (const [x, yy, z] of [[186.8, 1.6, -58.7], [189.6, 1.2, -58.72], [195.2, 2.4, -60.66], [200.8, 1.4, -60.66]]) k.add(KG.cone4, x, gy(x, z) + yy, z, 0.35, 0.6, 0.02, '#2a2830', { rz: 0.4, ink: 0 });
    k.build(g); g.visible = false; G().w3d.scene.add(g);
    return { m, holes: g };
  }
  // Dalia's sprouts, once her seeds are planted
  function sproutsG() {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, y = gy(TRAYS.x, TRAYS.z);
    for (let i = 0; i < 12; i++) { const x = TRAYS.x - 0.75 + (i % 6) * 0.3, z = TRAYS.z - 0.1 + Math.floor(i / 6) * 0.2; k.rod([x, y + 0.18, z], [x, y + 0.34, z], 0.012, '#5fae4f', 0).add(KG.ball6, x + 0.03, y + 0.35, z, 0.04, 0.015, 0.025, '#6fbf5a', { ink: 0 }); }
    k.build(g); g.name = 'gd-fut-sprouts'; g.visible = false; G().w3d.scene.add(g); return g;
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'gd-fut-' + name; const kk = kit(); fn(kk); kk.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), thorns: thornsG(), glass: grayGlass(), sprouts: sproutsG(), solids: [] };
    scene.add(built.thorns); built.thorns.visible = false;
    // drifting gray fog motes over the valley
    const n = 70, pos = new Float32Array(n * 3), seed = [], R = rnd(99);
    for (let i = 0; i < n; i++) { const a = R() * TAU, r = 2 + R() * 22; seed.push({ x: 198 + Math.cos(a) * r * 1.4, z: -71 + Math.sin(a) * r * 0.8, y: 0.4 + R() * 6, ph: R() * 6.3, sp: 0.2 + R() * 0.4 }); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: TK.sparkTex, color: '#c8c6d2', size: 0.34, transparent: true, opacity: 0.5, depthWrite: false }));
    pts.frustumCulled = false; pts.visible = false; pts.name = 'gd-fut-dust'; scene.add(pts); built.dust = { pts, pos, seed };
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    add(TEA.x, TEA.z, 0.55); add(TAP.x, TAP.z, 0.25); add(TRAYS.x, TRAYS.z, 0.55);
    built.doorSolid = { x: OFF, z: OFF, _x: M.DOOR.x, _z: -60.4, r: 1.1, time: true };
    WORLD.extra.push(...built.solids, built.doorSolid);
    return built;
  }
  const solidsOn = on => { if (!built) return; built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); const d = on && !st().open && !free(); built.doorSolid.x = d ? built.doorSolid._x : OFF; built.doorSolid.z = d ? built.doorSolid._z : OFF; };
  function show(on) {
    const B = build(), s = st();
    B.props.visible = on; B.dust.pts.visible = on; B.thorns.visible = on && !s.open && !free();
    if (B.glass) { B.glass.m.visible = on && !free(); B.glass.holes.visible = on && !free(); }
    B.sprouts.visible = on && !!s.seedsDone;
    solidsOn(on);
  }
  let hid = [];
  function late(dt) {
    const B = built; if (!B) return;
    M.showToday(dt, hid);
    // healed: the gardens' own glass and bees come back (they were set aside at the start)
    if (free()) { const O = G().gardens && G().gardens.objects; if (O) { if (O.glass) O.glass.visible = true; (O.bees || []).forEach(b => { b.s.visible = true; }); (O.flowers || []).forEach(im => { im.visible = true; }); } if (B.props.visible) B.props.visible = false; }
    const list = TIME.people && TIME.people.all['gardens:future'];
    if (list) for (const P of list) { if (P.def.id === 'flora' || woke(P.def.id)) continue; P.g.rotation.y = P.api.yaw; P.body.position.y = 0; P.body.rotation.z = 0; }
    for (const F of Object.values(FROZEN)) if (F.tw != null) { F.tw = Math.max(0, F.tw - dt * 0.7); F.u.uGray.value = F.tw; if (F.tw <= 0) F.tw = null; }
    const t = G().w3d.time.value, D = B.dust, kk = k();
    if (D.pts.visible) { D.pts.material.opacity = 0.5 * (1 - kk * 0.85); D.seed.forEach((p, i) => { D.pos[i * 3] = p.x + Math.sin(t * p.sp + p.ph) * 1.4; D.pos[i * 3 + 1] = p.y + Math.sin(t * p.sp * 0.6 + p.ph) * 0.6; D.pos[i * 3 + 2] = p.z + Math.cos(t * p.sp * 0.8 + p.ph) * 1.4; }); D.pts.geometry.attributes.position.needsUpdate = true; }
  }

  // ------------------------------------------------------------ talking to the people of tomorrow
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  function talk(id) {
    const s = st();
    if (id === 'flora') return !s.met ? floraScene() : free() ? say1('flora', s.chatF ? 'flora.chat1' : (s.chatF = true, 'flora.free')) : WAKE.every(woke) ? say1('flora', 'flora.chat1') : say1('flora', 'flora.again');
    if (!woke(id)) return wakeScene(id);
    if (id === 'melisa') return TIME.flag('now', 'gdLavender') && !s.lavSaid ? (s.lavSaid = true, say1('melisa', 'melisa.lavender')) : TIME.flag('past', 'gdPaint') && !s.paintSaid ? (s.paintSaid = true, say1('melisa', 'melisa.painting')) : say1('melisa', 'melisa.chat');
    if (id === 'bento') return say1('bento', 'bento.chat');
    if (id === 'dalia') return say1('dalia', 'dalia.chat');
    return say1(id, id + '.chat');
  }
  // the main path, 1: Flora shows how to ask gently, the card
  async function floraScene() {
    const s = st(), K = () => who('flora'); if (!K()) return;
    M.lock(true);
    try { M.frame2(K()); await wait(0.4); await M.say(K(), ln('flora.hello')); await M.demo(K(), T().DEMO['flora.demo'], T().MARKS['flora.demo']); } finally { M.lock(false); }
    await M.card(T().CARDS.polite, true);
    M.lock(true); try { M.frame2(K()); await M.say(K(), ln('flora.task')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('Gray gardeners all over the valley, each frozen waiting for something. Ask them nicely, or say a wish.', 5.5);
  }
  // the main path, 2: a frozen gardener; a gentle request or a wish wakes them
  const TASK_OF = { tomasa: 'tomasa', polo: 'polo', lola: 'lola', melisa: 'melisa', bento: 'tea1', dalia: 'seeds' };
  async function wakeScene(id) {
    const s = st(), p = who(id); if (!p) return;
    M.lock(true); try { M.frame2(p); await wait(0.3); await M.hushed(p, ln(id + '.frozen')); } finally { M.lock(false); }
    if (!s.met) { M.think('Gray, frozen… as if waiting for something. Someone on the green is still talking. Ask her.', 5.5); return; }
    if (id === 'bento' && !s.teaDemo) { const F = who('flora'); M.lock(true); try { if (F) { M.frame2(F); await M.demo(F, T().DEMO['tea.demo'], T().MARKS['tea.demo']); } s.teaDemo = true; } finally { M.lock(false); } }
    const r = await M.ask(T().TASKS[TASK_OF[id]], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('Still gray. A kind word would wake them.', 4); return; }
    TIME.grade('gd.wake.' + id, r.letter);
    s.woke = s.woke || {}; s.woke[id] = r.letter; G().save();
    await wakeUp(id);
    if (id === 'bento') await teaMore();
    if (id === 'dalia') await plantSeeds();
    if (WAKE.every(woke) && !s.open) await openScene();
  }
  async function wakeUp(id) {
    const g = G(), P = M.person('future', id), F = P && frozenMat(P);
    M.lock(true);
    try {
      if (F) F.tw = 1;
      snd('learned'); if (P) g.w3d.fx.sparkle(P.api.x, (P.api.y || 0) + 1.3, P.api.z, 22, ['#ffd166', '#ff9fc4', '#9ff5b8']);
      await wait(1.2);
      const p = who(id); M.frame2(p); await M.say(p, ln(id + '.awake'));
    } finally { M.lock(false); }
  }
  // the main path, 3: all four awake: together they cut the thorns from the greenhouse door
  async function openScene() {
    const s = st(), g = G(), B = build();
    M.lock(true);
    try {
      const K = who('flora'); if (K) { M.frame2(K); await M.say(K, ln('flora.open')); }
      const D = M.DOOR, y = gy(D.x, D.z);
      M.shot(V(D.x + 3.2, y + 2.6, D.z - 6.0), V(D.x, y + 1.4, D.z)); await wait(0.8);
      snd('crunch'); g.w3d.fx.puff(D.x, y + 1.2, D.z - 0.4, 18, 0.5, '#b8b6c4');
      await STORY.tween(0.8, kk => { B.thorns.scale.set(1, 1 - kk * 0.95, 1); });
      B.thorns.visible = false; B.thorns.scale.set(1, 1, 1);
      s.open = true; solidsOn(true); g.save(); snd('chime'); await wait(0.6);
    } finally { M.lock(false); }
    M.think('The greenhouse door is open. Inside, it’s dark, and full of thorns. Ask nicely.', 5);
  }

  // ------------------------------------------------------------ side quest: «A warning from tomorrow» (the Future changes today)
  async function warnScene() {
    const s = st(), R = () => who('melisa'); if (!R()) return;
    M.lock(true);
    try { M.frame2(R()); await wait(0.3); await M.say(R(), ln('warn.ask')); await M.demo(R(), T().DEMO['warn.demo'], T().MARKS['warn.demo']); s.warned = true; TIME.flag('future', 'gdWarn', true); G().save(); } finally { M.lock(false); }
    M.think('A warning from tomorrow, word for word. Today’s Melisa, on the green, should hear it.', 5.5);
  }
  async function warnToday(Mp) {
    const r = await M.ask(T().TASKS.warn, { tips: T().TIPS }); if (!r) return;
    TIME.grade('gd.warn', r.letter);
    M.lock(true);
    try {
      Mp.talking = true; await M.say({ id: 'melisa', name: 'Melisa', x: Mp.x, y: Mp.y, z: Mp.z, top: 2.1 }, ln('now.melisa.warn'));
      TIME.flag('now', 'gdLavender', true); TIME.refresh(); M.st('now').planted = true; G().save();
      const y = gy(LAV.x, LAV.z); M.shot(V(LAV.x - 4.2, y + 3.0, LAV.z - 5.0), V(LAV.x, y + 0.6, LAV.z), 1.0); await wait(1.0);
      G().w3d.fx.sparkle(LAV.x, y + 0.8, LAV.z, 18, ['#b9a2ff', '#9b7fd0', '#f2c94c']); snd('wood'); snd('chime'); await wait(0.9);
    } finally { Mp.talking = false; M.lock(false); }
    M.think('New lavender by the hives, planted today… What will that change tomorrow?', 5);
  }
  function lavenderMesh(grown) {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, R = rnd(grown ? 31 : 17);
    for (let i = 0; i < (grown ? 30 : 14); i++) {
      const x = LAV.x - 1.4 + R() * 2.8, z = LAV.z - 0.8 + R() * 1.6, y = gy(x, z), s = grown ? 0.9 + R() * 0.5 : 0.45 + R() * 0.2;
      k.add(KG.cone, x, y + 0.3 * s, z, 0.22 * s, 0.7 * s, 0.22 * s, grown ? '#8a9a86' : '#7e9a7a', { ink: 0.004 }).add(KG.cone, x, y + 0.78 * s, z, 0.12 * s, 0.4 * s, 0.12 * s, grown ? '#a79bc0' : '#9b7fd0', { ink: 0.004 });
    }
    const sy = gy(LAV.sign.x, LAV.sign.z);
    k.rod([LAV.sign.x, sy, LAV.sign.z], [LAV.sign.x, sy + 0.9, LAV.sign.z], 0.04, grown ? '#7a7670' : '#8a6440', 0.006).box(LAV.sign.x, sy + 0.95, LAV.sign.z, 0.6, 0.3, 0.04, grown ? '#a8a4ae' : '#f4ead2', { ry: -0.4, ink: 0.006 });
    k.build(g); g.name = 'gd-lavender-' + (grown ? 'future' : 'now');
    // a few bees round it (sprites)
    const bees = [];
    if (grown || true) {
      const tex = TK.canvasTex(64, 64, c => { c.translate(32, 34); c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(-9, -11, 9, 6, -0.5, 0, TAU); c.ellipse(9, -11, 9, 6, 0.5, 0, TAU); c.fill(); c.fillStyle = '#f2c94c'; c.strokeStyle = '#2b2235'; c.lineWidth = 4; c.beginPath(); c.ellipse(0, 0, 13, 10, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#2b2235'; c.fillRect(-4, -9, 4, 18); c.fillRect(5, -8, 3, 16); });
      for (let i = 0; i < (grown ? 6 : 3); i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.setScalar(0.22); g.add(s); bees.push({ s, ph: i * 1.9 }); }
    }
    return { obj: g, solids: [{ x: LAV.x, z: LAV.z, r: 1.0 }, { x: LAV.sign.x, z: LAV.sign.z, r: 0.15 }],
      update(dt, t) { for (const b of bees) { b.ph += dt * 1.2; b.s.position.set(LAV.x + Math.cos(b.ph) * 1.4 * Math.sin(b.ph * 0.4), gy(LAV.x, LAV.z) + 0.9 + Math.sin(b.ph * 2.3) * 0.2, LAV.z + Math.sin(b.ph * 1.3) * 0.7); } } };
  }
  const lavLook = w => async () => {
    const l = lang(), N = T().NAMES.lavender, tx = M.plainT(N[l] || N.en);
    if (w === 'now') { M.lookAt('w.lavender', `Young {w.lavender}, just planted by the hives. A little sign: «${tx}».`, 6); return; }
    M.lookAt('w.lavender', `A wide bed of {w.lavender}, grown thick over the years, still humming with {w.bee:pl}. The faded sign: «${tx}». Someone planted it in time.`, 7);
    const f = st(); if (!f.lavSeen) { f.lavSeen = true; G().save(); }
  };
  TIME.effect('gardens.lavender', { region: 'gardens', when: () => !!TIME.flag('now', 'gdLavender'),
    show: { now: () => lavenderMesh(false), future: () => lavenderMesh(true) },
    act: { now: { x: LAV.look.x, z: LAV.look.z, r: 1.3, label: 'Look', run: lavLook('now') }, future: { x: LAV.look.x, z: LAV.look.z, r: 1.3, label: 'Look', run: lavLook('future') } } });
  // today: Melisa hears the warning (her Talk has no id: she's matched by where she stands)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || (it.label !== 'Talk' && it.label !== 'Report') || it.who || !TIME.flag('future', 'gdWarn')) return null;
    const B = G().gardens, Mp = B && B.people && B.people.find(p => p.id === 'melisa'); if (!Mp || Math.hypot(it.x - Mp.x, it.z - Mp.z) > 0.8) return null;
    if (!TIME.flag('now', 'gdLavender')) return [{ label: 'A warning from tomorrow', sub: '◆ side quest', run: () => warnToday(Mp) }];
    return [{ label: 'The new lavender', run: async () => { M.lock(true); try { Mp.talking = true; await M.say({ id: 'melisa', name: 'Melisa', x: Mp.x, y: Mp.y, z: Mp.z, top: 2.1 }, ln('now.melisa.planted')); } finally { Mp.talking = false; M.lock(false); } } }];
  });

  // ------------------------------------------------------------ side quest: «Bento's tea table» (the first order wakes him; two more)
  async function teaMore() {
    const s = st(), B = () => who('bento'); if (!B()) return;
    for (const [key, line] of [['tea2', 'tea.flora'], ['tea3', 'tea.tomasa']]) {
      if ((s.tea || {})[key]) continue;
      M.lock(true); try { M.frame2(B()); await M.say(B(), ln(line)); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS[key], { tips: T().TIPS }); if (!r) { M.think('{bento} is waiting for the next order.', 4); return; }
      TIME.grade('gd.' + key, r.letter); (s.tea || (s.tea = {}))[key] = r.letter; G().save();
    }
    M.lock(true); try { const B2 = B(); M.frame2(B2); await M.say(B2, ln('tea.done')); s.teaDone = true; G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }
  // ------------------------------------------------------------ side quest: «Dalia's seeds» (her seeds, planted, sprout at once)
  async function plantSeeds() {
    const s = st(), B = build(), g = G();
    M.lock(true);
    try {
      const y = gy(TRAYS.x, TRAYS.z); M.shot(V(TRAYS.x - 2.6, y + 2.2, TRAYS.z - 3.0), V(TRAYS.x, y + 0.3, TRAYS.z));
      g.sim.mimoGo({ x: TRAYS.x - 0.4, z: TRAYS.z - 0.9 }, TRAYS); await wait(0.9); snd('pip');
      s.seedsDone = true; B.sprouts.visible = true; g.w3d.fx.sparkle(TRAYS.x, y + 0.4, TRAYS.z, 14, ['#9ff5b8', '#5fae4f']); snd('learned'); await wait(0.8);
      const D = who('dalia'); if (D) { M.frame2(D); await M.say(D, ln('dalia.planted')); }
      g.state.coins = (g.state.coins || 0) + 5; UI.toast('+5 coins'); g.save(); g.sim.mimoGo(null, null);
    } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ the Talk menus (tomorrow)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'future' || TIME.regionNow() !== 'gardens') return null;
    const s = st(), out = [];
    if (it.who === 'future:melisa' && woke('melisa') && !s.warned) out.push({ label: 'Why did the bees leave?', sub: '◆ side quest', run: warnScene });
    if (it.who === 'future:bento' && woke('bento') && !s.teaDone) out.push({ label: 'Order', sub: '◆ side quest', run: teaMore });
    return out.length ? out : null;
  });

  // ------------------------------------------------------------ E, the compass
  const LOOKS = [
    { id: 'w.gd_wilted', at: { x: 215.6, z: -56.4 }, line: () => 'The {w.sunflower:pl} hang their heads, {w.gd_wilted} and gray. Nobody has watered them in years.' },
    { id: 'w.gd_cobweb', at: { x: 191.0, z: -71.2 }, line: () => 'The show’s tent, torn, with {w.gd_cobweb:pl} in every corner. A {w.gd_spider} sleeps in one.' },
    { id: 'w.gd_tarp', at: { x: 198.0, z: -79.4 }, line: () => 'A gray {w.gd_tarp} over the judging tables. No show this year. No show for many years.' },
    { id: 'w.gd_fallenleaves', at: { x: 206.4, z: -82.0 }, line: () => 'Drifts of {w.gd_fallenleaves} on the green. They crackle like old paper.' },
    { id: 'w.gd_empty', at: { x: 213.0, z: -68.8 }, line: () => (TIME.flag('now', 'gdLavender') ? 'The hives hum softly. Some {w.bee:pl} stayed: the lavender kept them.' : 'The hives are {w.gd_empty}. Not one {w.bee}. Not one sound.') },
    { id: 'w.gd_broken', at: { x: 185.2, z: -57.4 }, line: () => (free() ? 'The little glasshouse shines again.' : 'The little glasshouse: its {w.gd_glass} is {w.gd_broken} and clouded gray.') },
    { id: 'w.gd_tap', at: { x: 205.2, z: -65.8 }, line: () => 'A {w.gd_tap} on a post, and a {w.gd_bucket} under it. {w.gd_dry}. Not one drop.' },
    { id: 'w.gd_teapot', at: { x: 187.2, z: -77.6 }, line: () => 'A {w.gd_teapot} and two {w.gd_cup:pl} on a little table, a sign: «Tea · Cake · Honey». Cold.' },
    { id: 'w.gd_seedling', at: { x: 185.6, z: -62.9 }, line: () => (st().seedsDone ? 'Dalia’s trays: little green {w.gd_sprout:pl}, already!' : 'Trays of {w.gd_soil} for {w.gd_seedling:pl}… all empty.') },
    { id: 'w.gd_trophy', at: { x: 191.0, z: -78.2 }, line: () => 'A tarnished {w.gd_trophy} on the first table. «Best sunflower», it says, under the dust.' },
    { id: 'w.gd_hummingbird', at: { x: 183.4, z: -70.6 }, when: () => free(), line: () => 'A {w.gd_hummingbird}, back already, darting over the {w.lavender}.' },
  ];
  function interactables() {
    const s = st(), out = [];
    out.push({ x: M.DOOR.x, z: M.DOOR.z - 0.3, r: 2.0, label: s.open || free() ? 'Go in' : 'Look', run: async () => {
      if (!(s.open || free())) { M.lookAt('w.gd_thorn', s.met ? 'Gray {w.gd_thorn:pl} over the greenhouse door, and a {w.gd_sign}: «closed». Tomasa has the key, Polo the shears… if they wake.' : 'The great greenhouse, its door grown over with gray {w.gd_thorn:pl}. A {w.gd_sign} on them: «closed».', 5.5); return; }
      if (typeof GD_FHOUSE !== 'undefined' && GD_FHOUSE) await GD_FHOUSE.enter();
    } });
    for (const L0 of LOOKS) { if (L0.when && !L0.when()) continue; out.push({ x: L0.at.x, z: L0.at.z, r: 1.2, label: 'Look', run: async () => M.lookAt(L0.id, L0.line(), 5.5) }); }
    return out;
  }
  const HINTS = { flora: '{mimo} points at someone on the green: the only one with any color.', door: '{mimo} looks at the greenhouse door.', frozen: '{mimo} tugs your sleeve toward someone gray.',
    tomasa: '{mimo} points at a gray old woman by the dead sunflowers.', polo: '{mimo} points at a gray man by the dry roses.', lola: '{mimo} points at a gray young woman with a lamp, by the greenhouse.',
    melisa: '{mimo} points at a gray beekeeper by the silent hives.', bento: '{mimo} points at a gray man at a little tea table.', dalia: '{mimo} points at a gray woman by the seedling trays.' };
  function target(id) {
    if (id === 'door') return (typeof GD_FHOUSE !== 'undefined' && GD_FHOUSE && GD_FHOUSE.inside && GD_FHOUSE.target()) || { x: M.DOOR.x, z: M.DOOR.z, hint: HINTS.door };
    if (id === 'frozen') { const n = WAKE.find(x => !woke(x)); if (!n) return target('door'); id = n; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || HINTS.frozen };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const nextId = () => { const s = st(); return !s.met ? 'flora' : WAKE.some(x => !woke(x)) ? 'frozen' : 'door'; };
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('gd_future') ? 'gd_future' : 'future');
  // the gardens' color, glass and bees come back for good once the Warden lets go (the dungeon calls this)
  function freed() { TIME.flag('future', 'gdFree', true); show(true); TIME.refresh(); }

  // ------------------------------------------------------------ the side quests
  if (typeof QUESTS !== 'undefined') {
    const fS = s => M.sf(s), nS = s => M.sn(s);
    const futAt = id => () => M.via('future', () => target(id));
    const wk = (s, id) => !!(fS(s).woke && fS(s).woke[id]);
    if (!QUESTS.LIST.some(q => q.id === 'gd.warn')) QUESTS.LIST.push({ id: 'gd.warn', kind: 'side',
      title: 'A warning from tomorrow', giver: 'Melisa, by the silent hives (the Bloom Gardens, tomorrow)',
      started: s => wk(s, 'melisa'),
      steps: [
        { text: 'In the Future: ask old Melisa why the bees left', why: 'Melisa is awake again. She knows why the hives went silent.', done: s => !!fS(s).warned, target: futAt('melisa'), hint: HINTS.melisa },
        { text: 'Today: tell Melisa the warning from tomorrow, word for word', why: 'A warning is a piece of tomorrow you bring home. Today’s Melisa is on the green.',
          done: s => !!nS(s).planted, target: () => M.via('now', () => { const B = G() && G().gardens, Mp = B && B.people.find(p => p.id === 'melisa'); return Mp ? { x: Mp.x, z: Mp.z, hint: '{mimo} points at Melisa, on the green.' } : null; }), hint: '{mimo} points toward the green.' },
        { text: 'Tomorrow: look at the hives', why: 'The lavender was planted today… What does tomorrow look like now?', done: s => !!fS(s).lavSeen,
          target: () => M.via('future', () => ({ x: LAV.look.x, z: LAV.look.z, hint: '{mimo} sniffs something purple by the hives.' })), hint: '{mimo} sniffs something purple by the hives.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'gd.tea')) QUESTS.LIST.push({ id: 'gd.tea', kind: 'side',
      title: 'Bento’s tea table', giver: 'Bento, at his tea table (the Bloom Gardens, tomorrow)',
      started: s => !!fS(s).met,
      steps: [
        { get text() { const t = fS(G().state).tea || {}; return 'Order politely at Bento’s table (' + ((wk(G().state, 'bento') ? 1 : 0) + ['tea2', 'tea3'].filter(k0 => t[k0]).length) + '/3)'; }, get why() { return M.fillEn(`He froze waiting for a customer. Order like at the old shows: ${M.sx('polite')}.`); },
          done: s => !!fS(s).teaDone, target: futAt('bento'), hint: HINTS.bento },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'gd.seeds')) QUESTS.LIST.push({ id: 'gd.seeds', kind: 'side',
      title: 'Dalia’s seeds', giver: 'Dalia, by her seedling trays (the Bloom Gardens, tomorrow)',
      started: s => !!fS(s).met,
      steps: [
        { text: 'In the Future: ask Dalia for some seeds, politely', why: 'She froze holding a handful of seeds, as if waiting for someone to ask.', done: s => !!fS(s).seedsDone, target: futAt('dalia'), hint: HINTS.dalia },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks
  Object.assign(M.DRESS.future, {
    people: PEOPLE,
    k: () => k(),
    on(api) { show(true); hid = M.hideToday(api, { future: !free() }); dressPeople(); },
    off() { show(false); hid = []; },
    entered() { dressPeople(); },
    late: (api, dt) => { if (typeof GD_FHOUSE !== 'undefined' && GD_FHOUSE && GD_FHOUSE.inside) GD_FHOUSE.late(dt); else late(dt); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, WAKE, ALL, PEOPLE, LAV, k, woke, wokeN, who, target, song, freed, show, build, dressPeople, LOOKS, init: () => {}, changed: () => {},
    _: { talk, wakeScene, floraScene, openScene, warnScene, warnToday, teaMore, plantSeeds, get built() { return built; } } };
})();
