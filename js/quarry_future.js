'use strict';
// The Quarry Caves, tomorrow (DESIGN.md 18.10 "T2b"): the miners' camp if nobody speaks up. TIME dresses it (time_quarry.js
//   QUART.DRESS.future): the mine abandoned and half fallen in (rubble in its mouth), the cabins boarded up, weeds through the
//   rails, gray dust drifting, the lamps out and the fire cold, the crystals dark. Today's camp people, props and Pío's cage are
//   hidden; six of them stand here older, frozen gray (TIME's look: 'future' with k(api): the color comes back as they wake).
// The main path (QUART.FSTEPS): old Cande, the only one still talking, shows the future of guessing («¿Dónde estarán todos?
//   Estarán en el pueblo… ¿Qué hora será? Serán las ocho») → four frozen miners, each frozen on a question nobody can answer:
//   guess for them, with a clue nearby (Lucho: «Estarán en el pueblo», Maite: «Estará en la mina», Paco: «Serán las ocho»,
//   Rocío: «Habrá cartas») → together they clear the mine's mouth → the collapsed deep mine (quarry_future_dungeon.js) → the Gray
//   Mole (quarry_time_boss.js) → Chepe and the echo → Noa.
// Side quests: «A warning from tomorrow» (cross-time: Rocío knows why the mine fell; read her warning to today's Cande, and she
//   props the beam today: a new prop at the mine's mouth, and tomorrow the old prop still holds and the way in stays open),
//   «Three letters» (guess who each one is from: «Será de Lucho»), «Old Efraín's Sunday» (an optional wake: «Será domingo»).
const QR_FUT = (() => {
  if (typeof TIME === 'undefined' || typeof QUART === 'undefined' || !QUART) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = QUART, T = () => QFTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('future');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are
  const AT = {
    cande: { x: 83.6, z: -264.4, yaw: 1.2 }, lucho: { x: 97.4, z: -256.2, yaw: -2.0 }, maite: { x: 91.4, z: -273.4, yaw: -0.6 },
    paco: { x: 88.6, z: -264.0, yaw: -2.4 }, rocio: { x: 77.8, z: -266.6, yaw: 1.4 }, efrain: { x: 101.2, z: -263.4, yaw: -1.7 },
    chepe: { x: 85.8, z: -262.0, yaw: 2.5 },       // (only once he's home: TIME.flag('future', 'qrFree'))
  };
  const WAKE = ['lucho', 'maite', 'paco', 'rocio'], ALL = ['lucho', 'maite', 'paco', 'rocio', 'efrain'];
  const MAILBOX = { x: 76.4, z: -265.6 }, TICKET = { x: 99.5, z: -257.7 }, CAL = { x: 103.46, z: -269.0 }, HELMET = { x: 89.6, z: -276.4 }, CLOCK = { x: 100.78, z: -254.7 };   // (the calendar between the bunkhouse's door and window; the clock on the canteen's front, between its door and the song sheet's spot (101.0, −255.8))
  const CAGE = { x: 73.9, z: -262.5 }, PROP = { x: 88, z: -279.6 };
  const C = () => T().CAST;
  const LOOK = {
    cande: { skin: '#c98e62', hair: '#d8d4cc', hairdo: 'bun', dress: '#c9453a', vest: '#3f4a5a', hat: 'cap', hatColor: '#f4efe2', prop: 'cane', h: 0.98 },
    lucho: { skin: '#f0c7a0', hair: '#d8d8d8', hairdo: 'short', dress: '#5f9a4a', vest: '#4f4436', hat: 'cap', hatColor: '#d9783a', stache: true, hair2: '#d8d8d8', wide: 1.15 },
    maite: { skin: '#efc29a', hair: '#bdb6ae', hairdo: 'bun', dress: '#b84a7a', vest: '#3c4a5a', hat: 'cap', hatColor: '#e8b83a', prop: 'lantern' },
    paco: { skin: '#e6b48c', hair: '#e8e4dc', hairdo: 'short', dress: '#c45a3c', vest: '#4a4f66', hat: 'cap', hatColor: '#e8b83a', glasses: true, h: 0.97 },
    rocio: { skin: '#c98e62', hair: '#b8b2ac', hairdo: 'braids', dress: '#3e7fb0', vest: '#4a4566', hat: 'scarf', hatColor: '#e8b83a' },
    efrain: { skin: '#c98e62', hair: '#f4f0ea', hairdo: 'bald', beard: true, dress: '#8a6a4a', vest: '#3e5a7a', prop: 'cane', h: 0.9 },
    chepe: { skin: '#e6b48c', hair: '#8a8580', hairdo: 'short', dress: '#6a7a8a', vest: '#4a4436', hat: 'cap', hatColor: '#e8b83a', stache: true, hair2: '#8a8580' },
  };
  const propped = () => !!TIME.flag('now', 'qrPropped');
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('future', id);
  const woke = id => !!(st().woke && st().woke[id]);
  const wokeN = (list = ALL) => list.filter(woke).length;

  // ------------------------------------------------------------ the color comes back as they wake (0.12 gray … 1 healed)
  function k() { return Math.min(1, 0.12 + 0.5 * wokeN() / ALL.length + (TIME.flag('future', 'qrFree') ? 0.38 : 0)); }
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
    m.customProgramCacheKey = () => 'qrFrozen';
    body.material = m;
    return (FROZEN[id] = { m, u });
  }
  function dressPeople() {
    const list = TIME.people && TIME.people.all['quarry:future']; if (!list) return;
    for (const P of list) { if (P.def.id === 'cande' || P.def.id === 'chepe') continue; const F = frozenMat(P); if (F && F.tw == null) F.u.uGray.value = woke(P.def.id) ? 0 : 1; }
  }

  // ------------------------------------------------------------ the dressing: boards, rubble, weeds, dust; the clues
  let built = null;
  const kit = () => PAST.API.Kit();
  function boards(k, x, z, ry) {
    const c = Math.cos(ry), s = Math.sin(ry), y = gy(x, z);
    for (const [h, rz] of [[0.7, 0.35], [1.5, -0.35], [1.1, 0]]) k.box(x + s * 0.05, y + h, z + c * 0.05, 1.8, 0.2, 0.06, '#8f8a84', { ry, rz, ink: 0.008 });
  }
  function props(k) {
    const KG = PAST.API.KG;
    // boarded doors (caves.js's cabins: each door at w·0.2 along its front): the office (east), the bunkhouse (west), the canteen
    boards(k, 73.1, -268.48, Math.PI / 2); boards(k, 103.44, -267.08, -Math.PI / 2); boards(k, 100.43, -253.77, -1.92);
    // weeds between the rails and round the camp, gray-green
    const R = (() => { let s = 31; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    for (let i = 0; i < 40; i++) { const a = R() * TAU, r = 3 + R() * 15, x = 88 + Math.cos(a) * r * 1.3, z = -266 + Math.sin(a) * r; const [px, pz] = WORLD.pushOut(x, z, 0.6); if (Math.hypot(px - x, pz - z) > 0.01) continue; const y = gy(x, z); for (let j = 0; j < 3; j++) k.add(KG.cone4, x + (j - 1) * 0.12, y + 0.18, z + (j % 2) * 0.1, 0.06, 0.36 + R() * 0.2, 0.06, j % 2 ? '#6d7a5e' : '#7d8a6a', { rz: (j - 1) * 0.3, ink: 0 }); }
    // the mailbox (its flag up), the bus ticket on a canteen table, the calendar on the bunkhouse wall, the stopped clock
    let y = gy(MAILBOX.x, MAILBOX.z);
    k.rod([MAILBOX.x, y, MAILBOX.z], [MAILBOX.x, y + 1.0, MAILBOX.z], 0.05, '#6b6560', 0.008).box(MAILBOX.x, y + 1.15, MAILBOX.z, 0.32, 0.3, 0.5, '#7a7680').box(MAILBOX.x + 0.18, y + 1.32, MAILBOX.z - 0.1, 0.02, 0.24, 0.08, '#c9453a', { ink: 0.004 });
    k.box(TICKET.x, gy(TICKET.x, TICKET.z) + 0.925, TICKET.z, 0.22, 0.01, 0.12, '#f4efe2', { ry: 0.4, ink: 0.003 });
    y = gy(CAL.x, CAL.z); k.box(CAL.x, y + 1.8, CAL.z, 0.04, 0.6, 0.46, '#e8e0cc', { ink: 0.006 }).box(CAL.x - 0.03, y + 1.9, CAL.z, 0.02, 0.14, 0.18, '#c9453a', { ink: 0 });
    // (its face flat on the wall: the wall faces (−0.94, −0.34), as the song sheet's spot does)
    y = gy(CLOCK.x, CLOCK.z); k.add(KG.cyl, CLOCK.x, y + 2.55, CLOCK.z, 0.3, 0.06, 0.3, '#d8d4cc', { rz: Math.PI / 2, ry: -0.35 }).box(CLOCK.x - 0.05, y + 2.62, CLOCK.z - 0.02, 0.02, 0.16, 0.02, '#2b2235', { ry: -0.35, ink: 0 });
    // Chepe's helmet by the mine's mouth, and his footprints going in
    y = gy(HELMET.x, HELMET.z); k.add(KG.half, HELMET.x, y + 0.02, HELMET.z, 0.2, 0.16, 0.2, '#e8b83a', { rx: 0.4, ink: 0.008 });
    for (let i = 0; i < 6; i++) { const z = -272.6 - i * 0.9, x = 89.0 - i * 0.12 + (i % 2) * 0.22; k.add(KG.sphere, x, gy(x, z) + 0.01, z, 0.1, 0.01, 0.16, '#5a5660', { ink: 0 }); }
    // cobwebs (gray rags) on the lamp posts, a rusted tipped cart's load of rubble
    for (const [x, z] of [[80.6, -258.6], [95.2, -260.6], [79.6, -272.6], [92.6, -272.8], [100.6, -272.4]]) k.box(x + 0.25, gy(x, z) + 2.0, z, 0.5, 0.3, 0.02, '#b8b4c0', { rz: 0.4, ink: 0 });
  }
  function rubbleMesh() {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, R = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    for (let i = 0; i < 16; i++) { const s = 0.35 + R() * 0.5, x = (R() - 0.5) * 3.4, z = (R() - 0.5) * 1.2, y = s * 0.45 + (i > 9 ? 0.6 : 0); k.add(KG.ball6, x, y, z, s * 1.3, s * 0.9, s, ['#8f8a80', '#7d7366', '#9a958c'][i % 3], { ry: R() * 6, ink: 0.015 }); }
    k.rod([-1.9, 0.4, 0.2], [1.6, 1.3, -0.3], 0.18, '#6b6560', 0.012);
    k.build(g); g.position.set(88, gy(88, -278.6), -278.6); g.name = 'qr-fut-rubble';
    return g;
  }
  function dustPoints() {
    const n = 70, pos = new Float32Array(n * 3), seed = [];
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, r = 2 + Math.random() * 18; seed.push({ x: 88 + Math.cos(a) * r * 1.3, z: -266 + Math.sin(a) * r * 0.8, y: 0.4 + Math.random() * 6, ph: Math.random() * 6.3, sp: 0.2 + Math.random() * 0.4 }); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: TK.sparkTex, color: '#c8c6d2', size: 0.34, transparent: true, opacity: 0.55, depthWrite: false }));
    pts.frustumCulled = false; pts.visible = false; pts.name = 'qr-fut-dust'; G().w3d.scene.add(pts);
    return { pts, pos, seed };
  }
  // Pío III, old Cande's canary: gray and silent until the camp wakes
  function canary() {
    const g = new THREE.Group(), y = gy(CAGE.x, CAGE.z); g.position.set(CAGE.x, y + 2.42, CAGE.z); g.name = 'qr-fut-canary';
    const k = kit(), KG = PAST.API.KG;
    k.add(KG.cyl, 0, -0.62, 0, 0.26, 0.05, 0.26, '#8f8a80', { ink: 0.012 }).add(KG.half, 0, -0.08, 0, 0.26, 0.2, 0.26, '#8f8a80', { ink: 0.012 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; k.add(KG.cyl6, Math.cos(a) * 0.25, -0.34, Math.sin(a) * 0.25, 0.012, 0.56, 0.012, '#9a958c', { ink: 0 }); }
    k.add(KG.cyl6, 0, 0.18, 0, 0.012, 0.36, 0.012, '#5a5660', { ink: 0 }).add(KG.cyl6, 0, -0.38, 0, 0.015, 0.44, 0.015, '#6b6560', { rz: Math.PI / 2, ink: 0 });
    k.build(g, { shadow: false });
    const bird = (col) => { const b = new THREE.Group(); b.position.set(0, -0.33, 0); g.add(b); const kb = kit(); kb.add(KG.sphere, 0, 0.07, 0, 0.075, 0.07, 0.09, col, { ink: 0.01 }).add(KG.sphere, 0, 0.15, 0.06, 0.055, 0.055, 0.055, col, { ink: 0.01 }).add(KG.cone, 0, 0.15, 0.12, 0.018, 0.045, 0.018, '#e8843a', { rx: Math.PI / 2, ink: 0 }); for (const s of [-1, 1]) kb.add(KG.ball6, s * 0.028, 0.165, 0.105, 0.009, 0.012, 0.008, '#2b2235', { ink: 0 }); kb.build(b, { shadow: false }); return b; };
    return { g, gray: bird('#a8a4ae'), gold: bird('#f6d32a'), sing: 0, hop: 0, next: 2 };
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'qr-fut-' + name; const kk = kit(); fn(kk); kk.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), rubble: rubbleMesh(), dust: dustPoints(), bird: canary(), solids: [] };
    scene.add(built.rubble); built.rubble.visible = false; scene.add(built.bird.g); built.bird.g.visible = false;
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    add(MAILBOX.x, MAILBOX.z, 0.3);
    built.rubbleSolids = [{ x: OFF, z: OFF, _x: 86.8, _z: -278.4, r: 0.9, time: true }, { x: OFF, z: OFF, _x: 88.4, _z: -278.6, r: 0.9, time: true }, { x: OFF, z: OFF, _x: 89.6, _z: -278.3, r: 0.8, time: true }];
    WORLD.extra.push(...built.solids, ...built.rubbleSolids);
    return built;
  }
  const solidsOn = on => { if (!built) return; built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); const r = on && !st().open && !propped(); built.rubbleSolids.forEach(c => { c.x = r ? c._x : OFF; c.z = r ? c._z : OFF; }); };
  function show(on) {
    const B = build(), s = st();
    B.props.visible = on; B.dust.pts.visible = on; B.bird.g.visible = on;
    // (the rubble: none at all if today's Cande propped the beam; pushed aside once the miners cleared the mouth)
    B.rubble.visible = on && !propped(); B.rubble.scale.set(1, s.open ? 0.35 : 1, 1); B.rubble.position.x = s.open ? 85.4 : 88;
    solidsOn(on);
  }
  // today's camp (caves.js): its people, their props, Pío's cage; the lamps out, the fire cold, the crystals dark (unless freed)
  function hideToday(api) {
    const B = typeof CAVES !== 'undefined' && CAVES.built; if (!B) return;
    (B.people || []).forEach(p => api.hide(p.root));
    try { (CAVES._.propsOn || []).forEach(o => api.hide(o.g)); } catch (e) { /* */ }
    if (B.objects) {
      if (B.objects.bird) api.hide(B.objects.bird.cage);
      if (!TIME.flag('future', 'qrFree')) { (B.objects.lampGlows || []).forEach(g => api.hide(g)); api.hide(B.objects.fire); (B.objects.crystalGlows || []).forEach(g => api.hide(g)); }
    }
    for (const o of G().w3d.scene.children) if (o.visible && /^(read|diary|townlife|tl-|store)/i.test(o.name || '') && Math.hypot(o.position.x - 88, o.position.z + 266) < 45) api.hide(o);
  }
  function late(dt) {
    const B = built; if (!B) return;
    const list = TIME.people && TIME.people.all['quarry:future'];
    if (list) for (const P of list) {
      if (P.def.id === 'chepe') { const on = !!TIME.flag('future', 'qrFree'); if (P.g.visible !== on) { P.g.visible = on; P.solid.x = on ? P.solid._x : OFF; P.solid.z = on ? P.solid._z : OFF; } continue; }
      if (P.def.id === 'cande' || woke(P.def.id)) continue; P.g.rotation.y = P.api.yaw; P.body.position.y = 0; P.body.rotation.z = 0;
    }
    for (const F of Object.values(FROZEN)) if (F.tw != null) { F.tw = Math.max(0, F.tw - dt * 0.7); F.u.uGray.value = F.tw; if (F.tw <= 0) F.tw = null; }
    const t = G().w3d.time.value, D = B.dust, kk = k();
    if (D.pts.visible) { D.pts.material.opacity = 0.55 * (1 - kk * 0.85); D.seed.forEach((p, i) => { D.pos[i * 3] = p.x + Math.sin(t * p.sp + p.ph) * 1.4; D.pos[i * 3 + 1] = p.y + Math.sin(t * p.sp * 0.6 + p.ph) * 0.6; D.pos[i * 3 + 2] = p.z + Math.cos(t * p.sp * 0.8 + p.ph) * 1.4; }); D.pts.geometry.attributes.position.needsUpdate = true; }
    // today's things the camp of tomorrow doesn't have: the crystals stay dark, Pío stays quiet
    const CB = typeof CAVES !== 'undefined' && CAVES.built;
    if (CB && CB.objects) { if (CB.objects.bird) { CB.objects.bird.next = 6; CB.objects.bird.sing = 0; } if (!TIME.flag('future', 'qrFree') && CB.objects.crystalMat) { CB.objects.crystalMat.color.setRGB(0.29, 0.27, 0.35); CB.objects.crystalMat.emissive.setRGB(0, 0, 0); } }
    // Pío III: gray and still until the camp is free, then gold and singing
    const bd = B.bird, free = !!TIME.flag('future', 'qrFree');
    bd.gray.visible = !free; bd.gold.visible = free;
    if (free) { bd.next -= dt; bd.hop = Math.max(0, bd.hop - dt * 3); if (bd.next <= 0) { bd.next = 2.4 + Math.random() * 3; bd.hop = 1; bd.sing = 1.4; } if (bd.sing > 0) { bd.sing -= dt; if (Math.random() < dt * 5) note(CAGE.x + 0.1, gy(CAGE.x, CAGE.z) + 2.3, CAGE.z + 0.1, '#fff3a0'); } bd.gold.position.y = -0.33 + Math.sin(bd.hop * Math.PI) * 0.06; }
  }
  const note = (x, y, z, c) => { try { const B = CAVES.built; if (B && B.note) B.note(x, y, z, c); } catch (e) { /* */ } };

  // ------------------------------------------------------------ talking to the people of tomorrow
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  function talk(id) {
    const s = st();
    if (id === 'chepe') return say1('chepe', 'chepe.home');
    if (id === 'cande') return !s.met ? candeScene() : TIME.flag('future', 'qrFree') ? (TIME.flag('past', 'qrSong') && !s.candeSong ? (s.candeSong = true, say1('cande', 'cande.song')) : say1('cande', 'cande.after')) : wokeN(WAKE) >= 4 ? say1('cande', 'cande.chepe') : say1('cande', 'cande.again');
    if (!woke(id)) return wakeScene(id);
    if (id === 'efrain' && TIME.flag('past', 'qrSong')) return say1('efrain', 'efrain.song');
    return say1(id, id + '.chat');
  }
  // the main path, 1: old Cande shows the future of guessing, the card
  async function candeScene() {
    const s = st(), K = () => who('cande'); if (!K()) return;
    M.lock(true);
    try { M.frame2(K()); await wait(0.4); await M.say(K(), ln('cande.hello')); await M.demo(K(), T().DEMO['cande.demo'], T().MARKS['cande.demo']); } finally { M.lock(false); }
    await M.card(T().CARDS.guess, true);
    M.lock(true); try { M.frame2(K()); await M.say(K(), ln('cande.wake')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('Gray miners all over the camp, each frozen on a question. Look for a clue near each one, and guess.', 5.5);
  }
  // the main path, 2: a frozen miner; a guess in tomorrow's words wakes them
  async function wakeScene(id) {
    const s = st(), p = who(id); if (!p) return;
    M.lock(true); try { M.frame2(p); await wait(0.3); await M.hushed(p, ln(id + '.frozen')); } finally { M.lock(false); }
    if (!s.met) { M.think('Gray, frozen… as if waiting for an answer. Someone by the fire pit is still talking. Ask her.', 5.5); return; }
    const r = await M.ask(T().TASKS[id], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('Still gray. A guess would wake them: look around for a clue.', 4); return; }
    TIME.grade('qr.wake.' + id, r.letter);
    s.woke = s.woke || {}; s.woke[id] = r.letter; G().save();
    await wakeUp(id);
    if (WAKE.every(woke) && !s.open) await openScene();
  }
  async function wakeUp(id) {
    const g = G(), P = M.person('future', id), F = P && frozenMat(P);
    M.lock(true);
    try {
      if (F) F.tw = 1;
      snd('learned'); if (P) g.w3d.fx.sparkle(P.api.x, (P.api.y || 0) + 1.3, P.api.z, 22, ['#ffd166', '#fff3a0', '#9ff5e8']);
      await wait(1.2);
      const p = who(id); M.frame2(p); await M.say(p, ln(id + '.awake'));
      if (id === 'efrain') { st().efrainDone = true; g.state.coins = (g.state.coins || 0) + 5; UI.toast('+5 coins'); if (TIME.flag('past', 'qrSong')) { try { if (typeof QRMUSIC !== 'undefined') QRMUSIC.play('qr_minersong', 8); } catch (e) { /* */ } await M.say(p, ln('efrain.song')); } g.save(); }
    } finally { M.lock(false); }
  }
  // the main path, 3: all four awake: together they clear the mine's mouth
  async function openScene() {
    const s = st(), g = G(), B = build();
    M.lock(true);
    try {
      const K = who('cande'); if (K) { M.frame2(K); await M.say(K, ln(propped() ? 'cande.openP' : 'cande.open')); }
      if (!propped()) {
        M.shot(V(84.4, 3.6, -270.2), V(88, 1.2, -278.4), 1.0); await wait(0.8);
        snd('crunch'); g.w3d.fx.puff(88, 1.0, -278.4, 18, 0.5, '#b8b6c4');
        await STORY.tween(0.8, kk => { B.rubble.scale.set(1, 1 - kk * 0.65, 1); B.rubble.position.x = 88 - kk * 2.6; });
      }
      s.open = true; solidsOn(true); g.save(); snd('chime'); await wait(0.6);
    } finally { M.lock(false); }
    M.think('The mine’s mouth is open. Chepe is somewhere down there: guess well.', 5);
  }

  // ------------------------------------------------------------ side quest: «A warning from tomorrow» (the Future changes today)
  async function warnScene() {
    const s = st(), R = () => who('rocio'); if (!R()) return;
    M.lock(true);
    try { M.frame2(R()); await wait(0.3); await M.say(R(), ln('rocio.awake')); await M.say(R(), ln('rocio.warn')); await M.demo(R(), T().DEMO.warn, T().MARKS.warn); s.warned = true; TIME.flag('future', 'qrWarn', true); G().save(); } finally { M.lock(false); }
    M.think('A warning from tomorrow, word for word. Today’s Cande, at her office, should hear it.', 5.5);
  }
  async function warnToday(Cp) {
    const r = await M.ask(T().TASKS.warn, { tips: T().TIPS }); if (!r) return;
    TIME.grade('qr.warn', r.letter);
    M.lock(true);
    try {
      Cp.talking = true; await M.say({ id: 'cande', name: 'Cande', x: Cp.x, y: Cp.y, z: Cp.z, top: 2.1 }, ln('now.cande.warn'));
      TIME.flag('now', 'qrPropped', true); TIME.refresh(); M.st('now').propped = true; G().save();
      const y = gy(PROP.x, PROP.z); M.shot(V(PROP.x + 4.2, y + 2.8, PROP.z + 5.6), V(PROP.x, y + 2.0, PROP.z), 1.0); await wait(1.0);
      G().w3d.fx.sparkle(PROP.x, y + 2.6, PROP.z, 16, ['#ffd166', '#fff3a0']); snd('wood'); snd('chime'); await wait(0.9);
    } finally { Cp.talking = false; M.lock(false); }
    M.think('The beam at the mine’s mouth, propped today… What will that change tomorrow?', 5);
  }
  function propMesh(old) {
    const g = new THREE.Group(), k = kit(), y = gy(PROP.x, PROP.z), wood = old ? '#8a8680' : '#c9965a', wood2 = old ? '#7a7670' : '#a8743f';
    for (const s of [-1, 1]) k.box(PROP.x + s * 1.5, y + 1.6, PROP.z, 0.26, 3.2, 0.26, wood).box(PROP.x + s * 1.5, y + 0.08, PROP.z, 0.5, 0.16, 0.5, wood2, { ink: 0.006 });
    k.box(PROP.x, y + 3.3, PROP.z, 3.5, 0.3, 0.32, wood2);
    for (const s of [-1, 1]) k.rod([PROP.x + s * 1.5, y + 2.4, PROP.z], [PROP.x + s * 0.6, y + 3.2, PROP.z], 0.07, wood, 0.008);
    if (!old) k.box(PROP.x + 1.5, y + 1.4, PROP.z + 0.15, 0.3, 0.2, 0.01, '#f4efe2', { ink: 0.003 });
    k.build(g); g.name = 'qr-prop-' + (old ? 'old' : 'new');
    return { obj: g, solids: [{ x: PROP.x - 1.5, z: PROP.z, r: 0.25 }, { x: PROP.x + 1.5, z: PROP.z, r: 0.25 }] };
  }
  const LOOKSAT = { x: 91.6, z: -278.2 };
  TIME.effect('quarry.prop', { region: 'quarry', when: () => !!TIME.flag('now', 'qrPropped'),
    show: { now: () => propMesh(false), future: () => propMesh(true) },
    act: { now: { x: LOOKSAT.x, z: LOOKSAT.z, r: 1.3, label: 'Look', run: async () => { const l = lang(), N = T().NAMES.propNote; M.lookAt('w.qr_prop', `A new {w.qr_prop} under the {w.qr_beam} at the mine’s mouth. A note on it: «${M.plainT(N[l] || N.en)}»`, 6); } },
      future: { x: LOOKSAT.x, z: LOOKSAT.z, r: 1.3, label: 'Look', run: async () => { const l = lang(), N = T().NAMES.propNote; M.lookAt('w.qr_prop', `An old {w.qr_prop}, gray with years, still holding the {w.qr_beam}. A faded note: «${M.plainT(N[l] || N.en)}». It held.`, 6.5); const s = st(); if (!s.propSeen) { s.propSeen = true; G().save(); } } } } });
  // today: Cande hears the warning (her Talk has no id: she's matched by where she stands)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || it.label !== 'Talk' || it.who || !TIME.flag('future', 'qrWarn')) return null;
    const B = typeof CAVES !== 'undefined' && CAVES.built, Cp = B && B.people && B.people.find(p => p.id === 'cande'); if (!Cp || Math.hypot(it.x - Cp.x, it.z - Cp.z) > 0.8) return null;
    if (!TIME.flag('now', 'qrPropped')) return [{ label: 'A warning from tomorrow', sub: '◆ side quest', run: () => warnToday(Cp) }];
    return [{ label: 'The beam', run: async () => { M.lock(true); try { Cp.talking = true; await M.say({ id: 'cande', name: 'Cande', x: Cp.x, y: Cp.y, z: Cp.z, top: 2.1 }, ln('now.cande.propped')); } finally { Cp.talking = false; M.lock(false); } } }];
  });

  // ------------------------------------------------------------ side quest: «Three letters» (Rocío's mailbox)
  const LETTER_CLUE = ['A letter with a fishing rod drawn in the corner.', 'A letter covered in crayon flowers, in a child’s hand.', 'A letter with a little map: an X deep in the mine.'];
  async function lettersScene() {
    const s = st(), R = () => who('rocio'); if (!R()) return;
    if (!s.lettersAsked) { M.lock(true); try { M.frame2(R()); await wait(0.3); await M.say(R(), ln('rocio.letters')); s.lettersAsked = true; G().save(); } finally { M.lock(false); } }
    s.letters = s.letters || [];
    for (let i = 0; i < 3; i++) {
      if (s.letters[i]) continue;
      M.lookAt('w.qr_envelope', LETTER_CLUE[i], 5);
      const r = await M.ask(T().TASKS['letter' + (i + 1)], { tips: T().TIPS }); if (!r) { M.think('Rocío is waiting: who will the letters be from?', 4); return; }
      TIME.grade('qr.letter' + (i + 1), r.letter); s.letters[i] = r.letter; G().save();
    }
    M.lock(true); try { const R2 = R(); M.frame2(R2); await M.say(R2, ln('rocio.thanks')); s.lettersDone = true; G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ the Talk menus (tomorrow)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'future' || TIME.regionNow() !== 'quarry') return null;
    const s = st(), out = [];
    if (it.who === 'future:rocio' && woke('rocio')) {
      if (!s.warned) out.push({ label: 'Why did the mine fall?', sub: '◆ side quest', run: warnScene });
      if (!s.lettersDone) out.push({ label: 'The letters', sub: '◆ side quest', run: lettersScene });
    }
    return out.length ? out : null;
  });

  // ------------------------------------------------------------ E, the compass
  const LOOKS = [
    { id: 'w.qr_bus', at: { x: 98.4, z: -258.8 }, line: () => { const l = lang(), N = T().NAMES.ticket; return `An old {w.qr_bus} ticket on the table: «${M.plainT(N[l] || N.en)}».`; } },
    { id: 'w.qr_footprint', at: { x: 90.4, z: -275.4 }, line: () => 'A miner’s helmet in the dust, and {w.qr_footprint:pl} going into the mine. Fresh ones.' },
    { id: 'w.clock', at: { x: 99.56, z: -255.15 }, line: () => 'The canteen’s {w.clock} stopped long ago. Nobody knows the time up here.' },
    { id: 'w.qr_mailbox', at: { x: 76.6, z: -264.4 }, line: () => 'An old {w.qr_mailbox}. Its little red flag is up: there’s something inside.' },
    { id: 'w.qr_calendar', at: { x: 102.2, z: -269.0 }, line: () => { const l = lang(), N = T().NAMES.calendar; return `A {w.qr_calendar} on the bunkhouse wall, still turned to today: «${M.plainT(N[l] || N.en)}».`; } },
    { id: 'w.qr_plank', at: { x: 74.4, z: -268.4 }, line: () => '{w.qr_plank:pl} nailed across the office door. {w.qr_closed}, for years.' },
    { id: 'w.qr_weeds', at: { x: 86.2, z: -259.2 }, line: () => '{w.qr_weeds} through the rails, and {w.qr_rust} on every wheel. Nobody has pushed a cart in years.' },
    { id: 'w.qr_cage', at: { x: 74.8, z: -261.4 }, line: () => (TIME.flag('future', 'qrFree') ? 'Pío III hops in his cage, singing. The miners’ song, if you listen.' : 'A {w.qr_cage} on the porch. Inside, a little gray canary: Pío III. He doesn’t sing.'),
      after: () => { if (TIME.flag('future', 'qrFree') && TIME.flag('past', 'qrSong')) { try { if (typeof QRMUSIC !== 'undefined') QRMUSIC.play('qr_pio', 6); } catch (e) { /* */ } } } },
  ];
  function interactables() {
    const s = st(), out = [], free = TIME.flag('future', 'qrFree');
    out.push({ x: M.MOUTH.x, z: M.MOUTH.z + 0.4, r: 2.1, label: s.open || free ? 'Go in' : 'Look', run: async () => {
      if (!(s.open || free)) {
        if (propped()) M.lookAt('w.qr_prop', 'The old {w.qr_prop} held: the mine’s mouth is open. But it’s pitch dark down there, and nobody goes in alone. Wake the miners first.', 5.5);
        else M.lookAt('w.qr_rubble', s.met ? '{w.qr_rubble} fills the mine’s mouth. When the miners wake, they’ll clear it together.' : 'The mine’s mouth, half fallen in. {w.qr_rubble} and a broken {w.qr_beam}.', 5);
        return;
      }
      if (typeof QFDEEP !== 'undefined' && QFDEEP) await QFDEEP.enter();
    } });
    for (const L0 of LOOKS) out.push({ x: L0.at.x, z: L0.at.z, r: 1.2, label: 'Look', run: async () => { M.lookAt(L0.id, L0.line(), 5.5); if (L0.after) L0.after(); } });
    return out;
  }
  const HINTS = { cande: '{mimo} points at someone by the fire pit: the only one with any color.', door: '{mimo} looks at the mine’s mouth.', frozen: '{mimo} tugs your sleeve toward someone gray.',
    lucho: '{mimo} points at a gray miner by the canteen’s tables.', maite: '{mimo} points at a gray miner with a lamp, by the mine’s mouth.', paco: '{mimo} points at a gray miner by the cold fire.',
    rocio: '{mimo} points at a gray miner by the mailbox.', efrain: '{mimo} points at a very old miner on a bench.' };
  function target(id) {
    if (id === 'door') return (typeof QFDEEP !== 'undefined' && QFDEEP && QFDEEP.inside && QFDEEP.target()) || { x: M.MOUTH.x, z: M.MOUTH.z, hint: HINTS.door };
    if (id === 'frozen') { const n = WAKE.find(x => !woke(x)); if (!n) return target('door'); id = n; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || HINTS.frozen };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const nextId = () => { const s = st(); return !s.met ? 'cande' : WAKE.some(x => !woke(x)) ? 'frozen' : 'door'; };
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('qr_future') ? 'qr_future' : 'future');
  // the camp's color and lamps come back for good once Chepe is home (the dungeon calls this)
  function freed() {
    TIME.flag('future', 'qrFree', true);
    const B = typeof CAVES !== 'undefined' && CAVES.built;
    if (B && B.objects) { (B.objects.lampGlows || []).forEach(g => { g.visible = true; }); if (B.objects.fire) B.objects.fire.visible = true; (B.objects.crystalGlows || []).forEach(g => { g.visible = true; }); }
    show(true); TIME.refresh();
  }

  // ------------------------------------------------------------ the side quests
  if (typeof QUESTS !== 'undefined') {
    const fS = s => M.sf(s), nS = s => M.sn(s);
    const futAt = id => () => M.via('future', () => target(id));
    const wk = (s, id) => !!(fS(s).woke && fS(s).woke[id]);
    if (!QUESTS.LIST.some(q => q.id === 'qr.warn')) QUESTS.LIST.push({ id: 'qr.warn', kind: 'side',
      title: 'A warning from tomorrow', giver: 'Rocío, by the mailbox (the Quarry Caves, tomorrow)',
      started: s => wk(s, 'rocio'),
      steps: [
        { text: 'In the Future: ask Rocío why the mine fell', why: 'Old Rocío is awake again. She knows what happened to the mine’s mouth.', done: s => !!fS(s).warned, target: futAt('rocio'), hint: HINTS.rocio },
        { text: 'Today: tell Cande the warning from tomorrow, word for word', why: 'A warning is a piece of tomorrow you bring home. Today’s Cande is at her office.',
          done: s => !!nS(s).propped, target: () => M.via('now', () => { const B = typeof CAVES !== 'undefined' && CAVES.built, Cp = B && B.people.find(p => p.id === 'cande'); return Cp ? { x: Cp.x, z: Cp.z, hint: '{mimo} points at Cande, by her office.' } : null; }), hint: '{mimo} points toward Cande’s office.' },
        { text: 'Tomorrow: look at the mine’s mouth', why: 'The beam was propped today… What does tomorrow look like now?', done: s => !!fS(s).propSeen,
          target: () => M.via('future', () => ({ x: LOOKSAT.x, z: LOOKSAT.z, hint: '{mimo} sniffs something by the mine’s mouth.' })), hint: '{mimo} sniffs something by the mine’s mouth.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'qr.letters')) QUESTS.LIST.push({ id: 'qr.letters', kind: 'side',
      title: 'Three letters', giver: 'Rocío, by the mailbox (the Quarry Caves, tomorrow)',
      started: s => wk(s, 'rocio'),
      steps: [
        { get text() { return 'Guess who each letter is from (' + ((fS(G().state).letters || []).filter(Boolean).length) + '/3)'; }, get why() { return M.fillEn(`No names on them, only clues. Guess: ${M.sx('guess')}.`); },
          done: s => !!fS(s).lettersDone, target: futAt('rocio'), hint: HINTS.rocio },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'qr.day')) QUESTS.LIST.push({ id: 'qr.day', kind: 'side',
      title: 'Old Efraín’s Sunday', giver: 'Efraín, on a bench by the bunkhouse (the Quarry Caves, tomorrow)',
      started: s => !!fS(s).met,
      steps: [
        { text: 'In the Future: wake old Efraín: what day will it be?', why: 'He froze wondering what day it was. There’s a calendar on the bunkhouse wall.', done: s => wk(s, 'efrain'), target: futAt('efrain'), hint: HINTS.efrain },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks
  Object.assign(M.DRESS.future, {
    people: PEOPLE,
    k: () => k(),
    on(api) { show(true); hideToday(api); dressPeople(); },
    off() { show(false); },
    entered() { dressPeople(); },
    late: (api, dt) => { late(dt); if (typeof QFDEEP !== 'undefined' && QFDEEP && QFDEEP.inside) QFDEEP.late(dt); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, WAKE, ALL, PEOPLE, PROP, k, woke, wokeN, who, target, song, freed, show, build, dressPeople, LOOKS, init: () => {}, changed: () => {},
    _: { talk, wakeScene, candeScene, openScene, warnScene, warnToday, lettersScene, get built() { return built; } } };
})();
