'use strict';
// Port Brisa, tomorrow (DESIGN.md 20.1b "T4a"): the harbor if nobody speaks up, empty and gray. TIME dresses it (time_port.js
//   PORTT.DRESS.future): today's big ship and the boats at anchor gone (PORTT.holesOn), the fort boat gone, no gulls, gray tarps over
//   the market stalls, a «closed» sign on the ticket window, a «Departures: none» board, a rusted anchor, barnacles and seaweed on the
//   quay, puddles, the fort boat half sunk at the ferry pier, a gray seal over the harbor office's door, gray motes. Today's people are
//   hidden; seven of them stand here older, frozen gray (TIME's look: 'future' with k(api): the color comes back as they wake).
// The main path (PORTT.FSTEPS): Marino, grown up, the only one still talking, wishes out loud («Ojalá que vuelvan las gaviotas…») and
//   the card → four frozen harbor folk, each waiting for someone to wish them something: Dora («Ojalá que vuelvan los barcos»), old
//   Quino («Quiero que tu barco vuelva»), Tere («Espero que tu barca navegue otra vez»), Wei («Ojalá que la gente coma tu sopa otra
//   vez») → the office's seal cracks → the harbor office tomorrow (port_future_dungeon.js) → the Gray Albatross (port_time_boss.js) →
//   the echo → the harbor heals, La Golondrina comes home → Noa.
// Side quests: «A wish from tomorrow» (cross-time: grown-up Marino's wish, «Ojalá que otro niño aprenda a llamar a las gaviotas»; tell
//   today's Marino word for word, and he teaches little Pía to call the gulls today: she stands with him, gulls overhead; tomorrow
//   grown-up Pía calls a whole flock back over the harbor), «Soup for everyone» (Wei's first customers: two wishes), «Miso» (an
//   optional wake: Yuki's cat comes back when {mimo} calls him, a wish: «Quiero que {mimo} llame a Miso»). Eloy is an optional wake.
const PT_FUT = (() => {
  if (typeof TIME === 'undefined' || typeof PORTT === 'undefined' || !PORTT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = PORTT, T = () => PTFTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('future');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are
  const AT = {
    marino: { x: -232.4, z: -80.2, yaw: -Math.PI / 2 }, dora: { x: -230.2, z: -98.2, yaw: -Math.PI / 2 }, quino: { x: -234.0, z: -71.6, yaw: -Math.PI / 2 },
    tere: { x: -234.2, z: -85.0, yaw: -1.9 }, wei: { x: -210.6, z: -99.2, yaw: 0 }, yuki: { x: -231.0, z: -66.2, yaw: -2.2 }, eloy: { x: -231.4, z: -90.4, yaw: 0.2 },
  };
  const WAKE = M.WAKE, ALL = ['dora', 'quino', 'tere', 'wei', 'yuki', 'eloy'];
  const DOOR = { x: -227.55, z: -95.15, spot: { x: -228.9, z: -95.15 } };
  const BOARD = { x: -234.2, z: -77.0 }, ANCHOR = { x: -229.4, z: -84.2 }, KIOSK = { x: -231.4, z: -91.6 }, BOAT = { x: -252.6, z: -89.6 };
  const PIA = { now: { x: -171.9, z: -81.0, yaw: Math.PI / 2 }, future: { x: -234.6, z: -101.8, yaw: -Math.PI / 2 } };
  const C = () => T().CAST;
  const LOOK = {
    marino: { skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#4cb0d8', vest: '#3f4f66', hat: 'cap', hatColor: '#e2574c', h: 1.02 },
    dora: { skin: '#a8714a', hair: '#d8d4cc', hairdo: 'bun', dress: '#2f3f6a', vest: '#f2c94c', hat: 'flat', hatColor: '#2f3f6a', glasses: true, prop: 'cane', h: 0.95 },
    quino: { skin: '#a8714a', hair: '#f4f0ea', hairdo: 'bald', beard: true, stache: true, hair2: '#f4f0ea', dress: '#2f3f6a', vest: '#3f3a4a', hat: 'flat', hatColor: '#2f3f6a', prop: 'cane', wide: 1.12, h: 0.94 },
    tere: { skin: '#c98e62', hair: '#bdb6ae', hairdo: 'bun', dress: '#f2c94c', vest: '#3f5f7a', hat: 'scarf', hatColor: '#c9433a', h: 0.98 },
    wei: { skin: '#efc29a', hair: '#d8d4cc', hairdo: 'short', dress: '#fbf8f0', apron: '#e2574c', hat: 'scarf', hatColor: '#fbf8f0', glasses: true, wide: 1.15, h: 1.0 },
    yuki: { skin: '#f0c7a0', hair: '#e8e4dc', hairdo: 'bun', dress: '#4c7fd8', shawl: '#e2574c', glasses: true, prop: 'cane', h: 0.94 },
    eloy: { skin: '#e6b48c', hair: '#bdb6ae', hairdo: 'short', stache: true, hair2: '#bdb6ae', dress: '#f4efe2', vest: '#2f3f6a', hat: 'cap', hatColor: '#2f3f6a', h: 1.0 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('future', id);
  const woke = id => !!(st().woke && st().woke[id]);
  const wokeN = (list = ALL) => list.filter(woke).length;
  const free = () => !!TIME.flag('future', 'pbFree');

  // ------------------------------------------------------------ the color comes back as they wake (0.12 gray … 1 healed)
  function k() { return Math.min(1, 0.12 + 0.5 * wokeN() / ALL.length + (free() ? 0.55 : 0)); }
  // the frozen: each person's own material, gray until woken (uGray 1 → 0 as they wake): the gardens' way
  const FROZEN = {};
  function frozenMat(P) {
    const id = P.def.id; if (FROZEN[id]) return FROZEN[id];
    const body = P.body.children[0]; if (!body || !body.material) return null;
    const m = body.material.clone(), u = { uGray: { value: woke(id) ? 0 : 1 } };
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = u.uGray;
      sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.86, l * 0.95), uGray); }');
    };
    m.customProgramCacheKey = () => 'pbFrozen';
    body.material = m;
    return (FROZEN[id] = { m, u });
  }
  function dressPeople() {
    const list = TIME.people && TIME.people.all['port:future']; if (!list) return;
    for (const P of list) { if (P.def.id === 'marino') continue; const F = frozenMat(P); if (F && F.tw == null) F.u.uGray.value = woke(P.def.id) ? 0 : 1; }
  }

  // ------------------------------------------------------------ the dressing: tarps, signs, rust, barnacles, the gray seal, the half-sunk boat
  let built = null;
  const kit = () => PAST.API.Kit();
  const rnd = seed => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };
  function props(kk) {
    const KG = PAST.API.KG, R = rnd(41), Y = 0.6;
    // gray tarps over the plaza's market stalls and over the shells stall
    for (const [x, z] of [[-219.2, -80.2], [-209.4, -79.6], [-219.2, -93.0]]) { kk.box(x, Y + 2.62, z, 2.7, 0.06, 1.8, '#8a8690', { rx: 0.05, ink: 0.008 }); for (const s of [-1, 1]) kk.box(x + s * 1.3, Y + 1.8, z, 0.06, 1.6, 1.7, '#7f7b86', { ink: 0.004 }); }
    // the rusted anchor (the same one, long ago, stood here new), barnacles along the quay's edge, seaweed strands, puddles
    kk.rod([ANCHOR.x, Y + 0.05, ANCHOR.z], [ANCHOR.x + 0.1, Y + 1.3, ANCHOR.z], 0.07, '#8a5a3a', 0.006).box(ANCHOR.x + 0.08, Y + 1.15, ANCHOR.z, 0.5, 0.07, 0.07, '#8a5a3a', { ink: 0.004 });
    kk.add(KG.torus, ANCHOR.x, Y + 0.2, ANCHOR.z, 0.42, 0.42, 0.8, '#7a4a30', { rz: Math.PI, ink: 0.004 });
    for (let i = 0; i < 30; i++) { const z = -116 + i * 1.6 + R() * 0.8; kk.add(KG.ball6, -236.15, Y + 0.02 - R() * 0.3, z, 0.07 + R() * 0.05, 0.05, 0.07, '#d8d4c8', { ink: 0 }); }
    for (let i = 0; i < 9; i++) { const x = -235.6 + R() * 0.8, z = -112 + i * 5.5; kk.add(KG.sphere, x, Y + 0.02, z, 0.6 + R() * 0.5, 0.02, 0.18, '#5a6a5a', { ry: R() * 3, ink: 0 }); }
    for (let i = 0; i < 7; i++) { const x = -232 + R() * 18, z = -112 + R() * 44; if (Math.abs(x + 214.2) < 3 && Math.abs(z + 86.5) < 3) continue; kk.add(KG.cyl, x, Y + 0.005, z, 0.7 + R() * 0.6, 0.01, 0.5 + R() * 0.4, '#6a7078', { ry: R() * 3, ink: 0 }); }
    // the departures board (its words are a canvas, below), on two posts
    kk.rod([BOARD.x, Y, BOARD.z - 0.6], [BOARD.x, Y + 1.8, BOARD.z - 0.6], 0.05, '#6b6560', 0.006).rod([BOARD.x, Y, BOARD.z + 0.6], [BOARD.x, Y + 1.8, BOARD.z + 0.6], 0.05, '#6b6560', 0.006);
    // the fort boat, half sunk at the ferry pier: gray, tilted, its stripe faded
    kk.box(BOAT.x, -0.75, BOAT.z, 3.6, 0.7, 1.7, '#9a9890', { rz: 0.32, rx: 0.12, ink: 0.012 }).box(BOAT.x - 0.7, -0.25, BOAT.z, 1.2, 0.8, 1.2, '#a8a29a', { rz: 0.32, rx: 0.12, ink: 0.01 });
    // dark gaps in the piers' boards, and a broken railing on the long pier
    for (const [x, z] of [[-241.6, -105.6], [-246.2, -106.6], [-243.8, -86.0], [-249.6, -87.2], [-240.2, -71.6], [-252.6, -70.4]]) kk.box(x, 0.76, z, 0.9, 0.02, 0.5, '#2b2830', { ry: R() * 0.4, ink: 0 });
    // a «closed» board nailed across the ticket window (its word is a canvas), cobwebs in the corners
    kk.box(KIOSK.x, Y + 1.25, KIOSK.z + 0.02, 1.6, 0.14, 0.05, '#7a7670', { rz: 0.25, ink: 0.004 }).box(KIOSK.x, Y + 1.25, KIOSK.z + 0.02, 1.6, 0.14, 0.05, '#7a7670', { rz: -0.25, ink: 0.004 });
    // dead leaves and dust drifts in the plaza
    for (let i = 0; i < 8; i++) { const x = -214.2 + Math.cos(i * 1.4) * 6, z = -86.5 + Math.sin(i * 1.4) * 9; kk.add(KG.ball6, x, Y + 0.05, z, 0.6 + R() * 0.4, 0.1, 0.4, ['#8a7f6e', '#7a746a', '#948a7a'][i % 3], { ry: R() * 6, ink: 0 }); }
  }
  function signTex(text, w = 256, h = 120, gray = true) {
    return TK.canvasTex(w, h, (c, W0, H0) => {
      c.fillStyle = gray ? '#a8a4ae' : '#f4efe2'; c.fillRect(0, 0, W0, H0); c.strokeStyle = gray ? '#4a4656' : '#2f3f6a'; c.lineWidth = 8; c.strokeRect(4, 4, W0 - 8, H0 - 8);
      c.fillStyle = gray ? '#3a3640' : '#2f3f6a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 30px Georgia, "Microsoft YaHei", "Yu Mincho", serif'; c.fillText(String(text).slice(0, 22), W0 / 2, H0 / 2 + 2);
    });
  }
  function boardG() {
    const l = lang(), N = T().NAMES, g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: signTex(M.plainT(N.board[l] || N.board.en), 256, 128), side: THREE.DoubleSide }));
    m.position.set(BOARD.x + 0.04, 0.6 + 1.45, BOARD.z); m.rotation.y = Math.PI / 2; g.add(m);
    const c2 = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.34), new THREE.MeshBasicMaterial({ map: signTex(M.plainT(N.closed[l] || N.closed.en), 200, 90) }));
    c2.position.set(KIOSK.x, 0.6 + 1.6, KIOSK.z + 0.06); g.add(c2);
    g.name = 'pb-fut-signs'; return g;
  }
  // the gray seal over the harbor office's door (it cracks once the four are awake)
  function sealG() {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, y = 0.6;
    k.add(KG.cyl, 0, 1.2, 0, 1.05, 0.06, 1.25, '#8a8692', { rz: Math.PI / 2, ink: 0.01 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; k.rod([-0.04, 1.2, 0], [-0.04, 1.2 + Math.sin(a) * 1.05, Math.cos(a) * 1.2], 0.03, '#5a5666', 0); }
    k.build(g); g.position.set(DOOR.x - 0.05, y, DOOR.z); g.name = 'pb-fut-seal';
    return g;
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'pb-fut-' + name; const kk = kit(); fn(kk); kk.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), signs: boardG(), seal: sealG(), solids: [] };
    scene.add(built.signs); built.signs.visible = false; scene.add(built.seal); built.seal.visible = false;
    // drifting gray motes over the harbor
    const n = 80, pos = new Float32Array(n * 3), seed = [], R = rnd(77);
    for (let i = 0; i < n; i++) seed.push({ x: -250 + R() * 80, z: -116 + R() * 70, y: 0.4 + R() * 7, ph: R() * 6.3, sp: 0.2 + R() * 0.4 });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: TK.sparkTex, color: '#c8c6d2', size: 0.34, transparent: true, opacity: 0.5, depthWrite: false }));
    pts.frustumCulled = false; pts.visible = false; pts.name = 'pb-fut-dust'; scene.add(pts); built.dust = { pts, pos, seed };
    // home again, once the harbor is free: La Golondrina, old and freshly painted, and two sailing boats
    if (typeof PT_PAST !== 'undefined' && PT_PAST && PT_PAST.makeShip) { built.ship = PT_PAST.makeShip({ gray: 0, sailsUp: true, hull: '#3f5f7a', stripe: '#f4efe2', sail: '#efe8da', flag: '#f2c94c', y: -0.25 }); built.ship.g.name = 'pb-fut-ship'; built.ship.g.visible = false; scene.add(built.ship.g); }
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    add(ANCHOR.x, ANCHOR.z, 0.35); add(BOARD.x, BOARD.z - 0.6, 0.12); add(BOARD.x, BOARD.z + 0.6, 0.12);
    WORLD.extra.push(...built.solids);
    return built;
  }
  const solidsOn = on => { if (!built) return; built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); };
  function show(on) {
    const B = build(), s = st(), fr = free();
    B.props.visible = on && !fr; B.signs.visible = on && !fr; B.dust.pts.visible = on;
    B.seal.visible = on && !s.open && !fr;
    if (B.ship) B.ship.g.visible = on && fr;
    solidsOn(on && !fr);
  }
  let hid = [];
  function gullMeshes() { const Bp = M.B(); return Bp ? Bp.group.children.filter(c => c.isInstancedMesh) : []; }
  function late(dt) {
    const B = built; if (!B) return;
    M.showToday(dt, hid);
    // the gulls come back over the harbor tomorrow too, once today's Marino has taught Pía (they were set aside at the start)
    if (TIME.flag('now', 'pbGulls')) gullMeshes().forEach(m => { m.visible = true; });
    const list = TIME.people && TIME.people.all['port:future'];
    if (list) for (const P of list) { if (P.def.id === 'marino' || woke(P.def.id)) continue; P.g.rotation.y = P.api.yaw; P.body.position.y = 0; P.body.rotation.z = 0; }
    for (const F of Object.values(FROZEN)) if (F.tw != null) { F.tw = Math.max(0, F.tw - dt * 0.7); F.u.uGray.value = F.tw; if (F.tw <= 0) F.tw = null; }
    const t = G().w3d.time.value, D = B.dust, kk = k();
    if (D.pts.visible) { D.pts.material.opacity = 0.5 * (1 - kk * 0.85); D.seed.forEach((p, i) => { D.pos[i * 3] = p.x + Math.sin(t * p.sp + p.ph) * 1.4; D.pos[i * 3 + 1] = p.y + Math.sin(t * p.sp * 0.6 + p.ph) * 0.6; D.pos[i * 3 + 2] = p.z + Math.cos(t * p.sp * 0.8 + p.ph) * 1.4; }); D.pts.geometry.attributes.position.needsUpdate = true; }
    if (B.ship && B.ship.g.visible) { B.ship.g.rotation.x = Math.sin(t * 0.7) * 0.012; B.ship.g.position.y = -0.25 + Math.sin(t * 0.9) * 0.04; }
  }

  // ------------------------------------------------------------ talking to the people of tomorrow
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const chats = {};
  const cycle = (id, keys) => { chats[id] = ((chats[id] || 0) + 1) % keys.length; return say1(id, keys[chats[id]]); };
  function talk(id) {
    const s = st();
    if (id === 'marino') return !s.met ? marinoScene() : free() ? (TIME.flag('now', 'pbGulls') && !s.gullSaid ? (s.gullSaid = true, say1('marino', 'marino.gulls')) : cycle('marino', ['marino.free', 'marino.chat1', 'marino.chat2']))
      : WAKE.every(woke) ? say1('marino', 'marino.open') : cycle('marino', ['marino.again', 'marino.chat1', 'marino.chat2']);
    if (!woke(id)) return wakeScene(id);
    if (id === 'dora') return TIME.flag('past', 'pbShip') && !s.bookSaid ? (s.bookSaid = true, say1('dora', 'dora.book')) : say1('dora', 'dora.chat');
    if (id === 'quino') return TIME.flag('past', 'pbPlaque') && !s.plaqueSaid ? (s.plaqueSaid = true, say1('quino', 'quino.plaque')) : say1('quino', 'quino.chat');
    return say1(id, id + '.chat');
  }
  // the main path, 1: Marino wishes out loud, the card
  async function marinoScene() {
    const s = st(), K = () => who('marino'); if (!K()) return;
    M.lock(true);
    try { M.frame2(K()); await wait(0.4); await M.say(K(), ln('marino.hello')); await M.demo(K(), T().DEMO['marino.demo'], T().MARKS['marino.demo']); } finally { M.lock(false); }
    await M.card(T().CARDS.wish, true);
    M.lock(true); try { M.frame2(K()); await M.say(K(), ln('marino.task')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('Gray people all along the quay, each frozen waiting. Say a wish for them.', 5.5);
  }
  // the main path, 2: a frozen harbor folk; a wish wakes them
  async function wakeScene(id) {
    const s = st(), p = who(id); if (!p) return;
    M.lock(true); try { M.frame2(p); await wait(0.3); await M.hushed(p, ln(id + '.frozen')); } finally { M.lock(false); }
    if (!s.met) { M.think('Gray, frozen… as if waiting for something. Someone on the quay is still talking. Ask him.', 5.5); return; }
    const r = await M.ask(T().TASKS[id], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('Still gray. A wish would wake them.', 4); return; }
    TIME.grade('pf.wake.' + id, r.letter);
    s.woke = s.woke || {}; s.woke[id] = r.letter; G().save();
    await wakeUp(id);
    if (WAKE.every(woke) && !s.open) await openScene();
  }
  async function wakeUp(id) {
    const g = G(), P = M.person('future', id), F = P && frozenMat(P);
    M.lock(true);
    try {
      if (F) F.tw = 1;
      snd('learned'); if (P) g.w3d.fx.sparkle(P.api.x, (P.api.y || 0) + 1.3, P.api.z, 22, ['#ffd166', '#9fd0e8', '#f6efe0']);
      await wait(1.2);
      const p = who(id); M.frame2(p); await M.say(p, ln(id + '.awake'));
    } finally { M.lock(false); }
  }
  // the main path, 3: all four awake: the office's gray seal cracks
  async function openScene() {
    const s = st(), g = G(), B = build();
    M.lock(true);
    try {
      const K = who('marino'); if (K) { M.frame2(K); await M.say(K, ln('marino.open')); }
      M.shot(V(DOOR.x - 6.0, 2.8, DOOR.z + 3.2), V(DOOR.x, 1.6, DOOR.z)); await wait(0.8);
      snd('crunch'); g.w3d.fx.puff(DOOR.x - 0.4, 1.8, DOOR.z, 18, 0.5, '#b8b6c4');
      await STORY.tween(0.8, kk => { B.seal.scale.set(1, 1 - kk * 0.95, 1 - kk * 0.95); });
      B.seal.visible = false; B.seal.scale.set(1, 1, 1);
      s.open = true; g.save(); snd('chime'); await wait(0.6);
    } finally { M.lock(false); }
    M.think('The harbor office’s door is open. The beacon is up on its roof.', 5);
  }
  // the dungeon's finale: the harbor is free (the color, the ship home)
  function freed() { TIME.flag('future', 'pbFree', true); TIME.refresh(); show(true); }

  // ------------------------------------------------------------ side quest: «A wish from tomorrow» (the Future changes today)
  async function gullsAsk() {
    const s = st(), R = () => who('marino'); if (!R()) return;
    M.lock(true);
    try { M.frame2(R()); await wait(0.3); await M.say(R(), ln('gulls.ask')); await M.demo(R(), T().DEMO['gulls.demo'], T().MARKS['gulls.demo']); s.wished = true; TIME.flag('future', 'pbWish', true); G().save(); } finally { M.lock(false); }
    M.think('A wish from tomorrow, word for word. Today’s Marino, inside the city gate, should hear it.', 5.5);
  }
  async function gullsToday(Mp) {
    const r = await M.ask(T().TASKS.gullwish, { tips: T().TIPS }); if (!r) return;
    TIME.grade('pf.gulls', r.letter);
    const p = { id: 'marino', name: 'Marino', x: Mp.x, y: Mp.y, z: Mp.z, top: 1.85 };
    M.lock(true);
    try {
      Mp.talking = true; M.frame2(p); await M.say(p, ln('now.marino.wish'));
      TIME.flag('now', 'pbGulls', true); TIME.refresh(); M.st('now').taught = true; G().save();
      M.shot(V(PIA.now.x + 4.0, 3.0, PIA.now.z + 4.4), V(PIA.now.x, 1.4, PIA.now.z), 1.0); await wait(1.0);
      G().w3d.fx.sparkle(PIA.now.x, 2.2, PIA.now.z, 16, ['#ffffff', '#9fd0e8', '#f2c94c']); snd('chime'); await wait(0.8);
      M.frame2(p); await M.say(p, ln('now.marino.taught'));
    } finally { Mp.talking = false; M.lock(false); }
    M.think('Little Pía, learning to call the gulls today… What will that change tomorrow?', 5);
  }
  // today: Pía stands with Marino, three gulls wheel over them, a little chalk sign; tomorrow: Pía grown up, a flock over the harbor
  function gullSprites(n, cx, cz, r0, y0) {
    const tex = TK.canvasTex(64, 64, c => { c.translate(32, 34); c.fillStyle = '#ffffff'; c.strokeStyle = '#2b2235'; c.lineWidth = 3; c.beginPath(); c.moveTo(-28, -2); c.quadraticCurveTo(-14, -14, 0, 0); c.quadraticCurveTo(14, -14, 28, -2); c.quadraticCurveTo(14, -6, 0, 6); c.quadraticCurveTo(-14, -6, -28, -2); c.fill(); c.stroke(); });
    const out = [];
    for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.setScalar(0.55); out.push({ s, ph: i * (TAU / n), r: r0 + (i % 3) * 0.8, y: y0 + (i % 4) * 0.5, cx, cz }); }
    return out;
  }
  function piaMesh(w) {
    const g = new THREE.Group(), at = PIA[w], look = w === 'now' ? { kid: true, skin: '#f0c7a0', hair: '#c9a24a', hairdo: 'tails', ribbon: '#b9a2ff', dress: '#b9a2ff', h: 0.7 }
      : { skin: '#f0c7a0', hair: '#c9a24a', hairdo: 'tails', ribbon: '#b9a2ff', dress: '#b9a2ff', vest: '#4cb0d8', hat: 'cap', hatColor: '#e2574c', h: 0.98 };
    const { k: pk } = PAST.API.personKit(look), body = new THREE.Group(); pk.build(body);
    const pg = new THREE.Group(); pg.add(body); pg.scale.setScalar(look.h); pg.position.set(at.x, gy(at.x, at.z), at.z); pg.rotation.y = at.yaw; g.add(pg);
    const birds = gullSprites(w === 'now' ? 3 : 12, w === 'now' ? at.x - 0.6 : -240, w === 'now' ? at.z : -92, w === 'now' ? 1.4 : 8, w === 'now' ? 3.6 : 5.5);
    birds.forEach(b => g.add(b.s));
    if (w === 'now') {
      const l = lang(), N = T().NAMES.gullsign, sg = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.32), new THREE.MeshBasicMaterial({ map: signTex(M.plainT(N[l] || N.en), 220, 100, false) }));
      const kk = kit(); kk.rod([at.x + 0.6, gy(at.x, at.z), at.z + 0.9], [at.x + 0.6, gy(at.x, at.z) + 0.9, at.z + 0.9], 0.03, '#8a6440', 0.004); kk.build(g);
      sg.position.set(at.x + 0.6, gy(at.x, at.z) + 1.05, at.z + 0.92); g.add(sg);
    }
    g.name = 'pb-pia-' + w;
    return { obj: g, solids: [{ x: at.x, z: at.z, r: 0.35 }],
      update(dt, t) { pg.rotation.y = at.yaw + Math.sin(t * 0.8) * 0.15; birds.forEach(b => { b.ph += dt * (w === 'now' ? 1.4 : 0.5); b.s.position.set(b.cx + Math.cos(b.ph) * b.r, b.y + Math.sin(b.ph * 2.2) * 0.3, b.cz + Math.sin(b.ph) * b.r * 0.8); b.s.material.rotation = Math.sin(t * 10 + b.ph) * 0.2; }); } };
  }
  // (today's Pía, a kid of today's port, stands with Marino once he's teaching her: she's moved there while the effect shows)
  let piaHome = null;
  function movePia(on) {
    const Bp = M.B(), p = Bp && Bp.people && Bp.people.find(q => q.id === 'f3'); if (!p) return;
    if (on && !piaHome) { piaHome = { x: p.x, z: p.z, yaw: p.baseYaw }; p.root.visible = false; }
    else if (!on && piaHome) { p.root.visible = true; piaHome = null; }
  }
  const piaLook = w => async () => {
    if (w === 'now') { M.lookAt('w.pf_teach', 'Marino is teaching little Pía to call the gulls. «¡Así, Pía!» Three gulls are already wheeling over her head.', 6); const n = M.st('now'); if (!n.piaSeen) { n.piaSeen = true; G().save(); } return; }
    const P = { id: 'pia', name: M.nameOf(C().pia), x: PIA.future.x, y: gy(PIA.future.x, PIA.future.z), z: PIA.future.z, top: 2.1 };
    M.lock(true); try { M.frame2(P); await M.say(P, ln('pia.chat')); } finally { M.lock(false); }
    const f = st(); if (!f.piaSeen) { f.piaSeen = true; G().save(); }
  };
  TIME.effect('port.gulls', { region: 'port', when: () => !!TIME.flag('now', 'pbGulls'),
    show: { now: () => Object.assign(piaMesh('now'), { on: v => movePia(v) }), future: () => piaMesh('future') },
    act: { now: { x: PIA.now.x + 1.2, z: PIA.now.z - 1.0, r: 1.3, label: 'Look', run: piaLook('now') }, future: { x: PIA.future.x + 1.2, z: PIA.future.z + 0.4, r: 1.6, label: 'Talk', run: piaLook('future') } } });
  // today: Marino hears the wish (his Talk has no story id here: he's matched by where he stands)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || !TIME.flag('future', 'pbWish')) return null;
    const Bp = M.B(), Mp = Bp && Bp.people && Bp.people.find(p => p.id === 'nico'); if (!Mp || Math.hypot(it.x - Mp.x, it.z - Mp.z) > 0.8) return null;
    if (!TIME.flag('now', 'pbGulls')) return [{ label: 'A wish from tomorrow', sub: '◆ side quest', run: () => gullsToday(Mp) }];
    return [{ label: 'The gull school', run: async () => { M.lock(true); try { Mp.talking = true; await M.say({ id: 'marino', name: 'Marino', x: Mp.x, y: Mp.y, z: Mp.z, top: 1.85 }, ln('now.marino.taught')); } finally { Mp.talking = false; M.lock(false); } } }];
  });

  // ------------------------------------------------------------ side quest: «Soup for everyone» (Wei's first customers: two wishes)
  async function soupScene() {
    const s = st(), W0 = () => who('wei'); if (!W0()) return;
    if (!s.soupAsked) { M.lock(true); try { M.frame2(W0()); await wait(0.3); await M.demo(W0(), T().DEMO['soup.demo'], T().MARKS['soup.demo']); await M.say(W0(), ln('soup.ask')); s.soupAsked = true; G().save(); } finally { M.lock(false); } }
    for (const key of ['soup1', 'soup2']) {
      if ((s.soup || {})[key]) continue;
      const r = await M.ask(T().TASKS[key], { tips: T().TIPS }); if (!r) { M.think('{wei} is waiting, ladle in hand: a kind wish for his customers?', 4); return; }
      TIME.grade('pf.' + key, r.letter); (s.soup || (s.soup = {}))[key] = r.letter; G().save();
      if (key === 'soup1') { M.lock(true); try { M.frame2(W0()); await M.say(W0(), ln('soup.next')); } finally { M.lock(false); } }
    }
    M.lock(true); try { const W2 = W0(); M.frame2(W2); await M.say(W2, ln('soup.done')); s.soupDone = true; G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }
  // ------------------------------------------------------------ side quest: «Miso» (wake Yuki; a wish for {mimo}: call the cat)
  let cat = null;
  function catG() {
    if (cat) return cat;
    const g = new THREE.Group(), kk = kit(), KG = PAST.API.KG;
    kk.add(KG.sphere, 0, 0.22, 0, 0.2, 0.17, 0.3, '#f29a3a', { ink: 0.01 }).add(KG.sphere, 0, 0.42, -0.26, 0.15, 0.14, 0.14, '#f29a3a', { ink: 0.01 });
    for (const s of [-1, 1]) kk.add(KG.cone, s * 0.08, 0.56, -0.26, 0.05, 0.1, 0.04, '#f29a3a', { ink: 0.004 }).add(KG.sphere, s * 0.1, 0.4, -0.4, 0.09, 0.01, 0.01, '#f4efe2', { ink: 0 });
    kk.rod([0, 0.24, 0.28], [0.1, 0.5, 0.45], 0.035, '#e0843a', 0.004);
    kk.build(g); g.name = 'pb-fut-miso'; g.visible = false; G().w3d.scene.add(g);
    return (cat = g);
  }
  async function misoScene() {
    const s = st(), Y0 = () => who('yuki'); if (!Y0()) return;
    if (!s.misoAsked) { M.lock(true); try { M.frame2(Y0()); await wait(0.3); await M.say(Y0(), ln('miso.ask')); await M.demo(Y0(), T().DEMO['miso.demo'], T().MARKS['miso.demo']); s.misoAsked = true; G().save(); } finally { M.lock(false); } }
    const r = await M.ask(M.wishTask(T().MOVES.miso), { icon: 'call', tips: T().TIPS }); if (!r) { M.think('{yuki} is waiting. Tell {mimo} what you want it to do.', 4); return; }
    TIME.grade('pf.miso', r.letter);
    M.lock(true);
    try {
      const g = G(), Yk = Y0(), c = catG(); g.sim.mimoSay('♪', 1.2); snd('pip'); await wait(0.8);
      c.visible = true; const from = { x: -226.0, z: -56.0 }, to = { x: Yk.x + 0.7, z: Yk.z + 0.5 };
      M.shot(V(Yk.x + 3.4, 2.4, Yk.z + 3.6), V(Yk.x + 0.4, 0.8, Yk.z + 0.4), 1.0);
      await STORY.tween(1.6, kk => { c.position.set(from.x + (to.x - from.x) * kk, gy(from.x, from.z) + Math.abs(Math.sin(kk * 12)) * 0.12, from.z + (to.z - from.z) * kk); c.rotation.y = Math.atan2(to.x - from.x, to.z - from.z) + Math.PI; });
      s.misoDone = true; G().save(); snd('chime'); g.w3d.fx.sparkle(to.x, 1.0, to.z, 12, ['#f29a3a', '#ffffff']);
      M.frame2(Y0()); await M.say(Y0(), ln('yuki.miso'));
      G().state.coins = (G().state.coins || 0) + 5; UI.toast('+5 coins'); snd('chest');
    } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ the Talk menus (tomorrow)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'future' || TIME.regionNow() !== 'port') return null;
    const s = st(), out = [];
    if (it.who === 'future:marino' && s.met && !s.wished) out.push({ label: 'Why did the gulls leave?', sub: '◆ side quest', run: gullsAsk });
    if (it.who === 'future:wei' && woke('wei') && !s.soupDone) out.push({ label: 'Soup for everyone', sub: '◆ side quest', run: soupScene });
    if (it.who === 'future:yuki' && woke('yuki') && !s.misoDone) out.push({ label: 'Miso', sub: '◆ side quest', run: misoScene });
    return out.length ? out : null;
  });

  // ------------------------------------------------------------ E, the compass
  const LOOKS = [
    { id: 'w.pf_timetable', at: { x: -233.0, z: -77.0 }, when: () => !free(), line: () => { const l = lang(), N = T().NAMES.board; return `A {w.pf_timetable} board on the quay: «${M.plainT(N[l] || N.en)}». Someone has written it every morning, for years.`; } },
    { id: 'w.pf_rust', at: { x: -228.4, z: -83.0 }, line: () => 'An old {w.pb_anchor}, red with {w.pf_rust}. It stood here new, long ago.' },
    { id: 'w.pf_barnacle', at: { x: -235.4, z: -92.0 }, line: () => '{w.pf_barnacle:pl} all along the edge of the quay, and long strands of {w.pb_seaweed}. Nobody has scrubbed it in years.' },
    { id: 'w.pf_puddle', at: { x: -223.6, z: -86.0 }, when: () => !free(), line: () => 'Gray {w.pf_puddle:pl} in the plaza. They don’t reflect the sky. Just gray.' },
    { id: 'w.pf_empty', at: { x: -235.6, z: -100.0 }, line: () => (free() ? 'Sails on the {w.pf_horizon}! The ships are coming home.' : 'The bay is {w.pf_empty}. Not one boat, not one {w.gull}, all the way to the {w.pf_horizon}.') },
    { id: 'w.pf_closed', at: { x: -232.8, z: -89.8 }, when: () => !free(), line: () => 'The ticket window is boarded up: «{w.pf_closed}». A {w.ticket} curls in the dust.' },
    { id: 'w.pf_abandoned', at: { x: -235.8, z: -84.6 }, line: () => (free() ? 'Tere’s old boat, still half sunk. She’s already measuring planks for a new one.' : 'Tere’s fort boat, half sunk by the pier, {w.pf_abandoned}. Gray water fills it.') },
    { id: 'w.pf_frozen', at: { x: -219.2, z: -82.0 }, when: () => !free(), line: () => 'The market stalls, under gray tarps. {w.pf_dust} on everything. Nobody has sold a thing here in years.' },
    { id: 'w.pf_beacon', at: { x: -226.4, z: -101.6 }, line: () => (free() ? 'Up on the office’s roof, the {w.pf_beacon} shines out over the sea.' : 'Up on the harbor office’s roof, the {w.pf_beacon} is dark. Something sits on it… something with wings.') },
  ];
  function interactables() {
    const s = st(), out = [];
    out.push({ x: DOOR.spot.x, z: DOOR.spot.z, r: 1.8, label: s.open || free() ? 'Go in' : 'Look', run: async () => {
      if (!s.open && !free()) { M.lookAt('w.pf_seal', 'The harbor office’s door, under a gray {w.pf_seal}. It won’t open… not for anyone.', 4.5); return; }
      if (typeof PT_FOFFICE !== 'undefined' && PT_FOFFICE) await PT_FOFFICE.enter();
    } });
    for (const L0 of LOOKS) { if (L0.when && !L0.when()) continue; out.push({ x: L0.at.x, z: L0.at.z, r: 1.3, label: 'Look', run: async () => M.lookAt(L0.id, L0.line(), 5.5) }); }
    return out;
  }
  const HINTS = { marino: '{mimo} points at someone on the quay… the only one with any color.', office: '{mimo} looks at the white harbor office’s door.',
    dora: '{mimo} points at an old woman by the harbor office.', quino: '{mimo} points at an old sailor at the long pier.', tere: '{mimo} points at a woman by the ferry pier.',
    wei: '{mimo} points at a cook at a cold soup cart, in the plaza.', yuki: '{mimo} points at an old lady on the promenade.', eloy: '{mimo} points at a man at the ticket window.' };
  function target(id) {
    if (id === 'office') return (typeof PT_FOFFICE !== 'undefined' && PT_FOFFICE && PT_FOFFICE.inside && PT_FOFFICE.target()) || { x: DOOR.spot.x, z: DOOR.spot.z, hint: HINTS.office };
    if (id === 'frozen') { const n = WAKE.find(k0 => !woke(k0)); if (!n) return target('office'); id = n; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || '{mimo} points.' };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  function nextId() { const s = st(); return !s.met ? 'marino' : !WAKE.every(woke) ? 'frozen' : 'office'; }
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('pb_future') ? 'pb_future' : 'future');

  // ------------------------------------------------------------ the side quests (QUESTS.LIST)
  if (typeof QUESTS !== 'undefined') {
    const fS = s => M.sf(s), nS = s => M.sn(s);
    const futAt = id => () => M.via('future', () => target(id));
    if (!QUESTS.LIST.some(q => q.id === 'pf.gulls')) QUESTS.LIST.push({ id: 'pf.gulls', kind: 'side',
      title: 'A wish from tomorrow', get giver() { return M.fillEn('{marino}, grown up (Port Brisa, tomorrow)'); },
      started: s => !!fS(s).wished,
      steps: [
        { text: 'Today: tell Marino the wish from tomorrow, word for word', get why() { return M.fillEn(`He’s just inside the city gate. «${M.plainT(M.fillMimo((T().TASKS.gullwish.model || {})[lang()] || ''))}»`); },
          done: s => !!nS(s).taught, target: () => M.via('now', () => { const Bp = M.B(), p = Bp && Bp.people.find(q => q.id === 'nico'); return p ? { x: p.x, z: p.z, hint: '{mimo} points at Marino, by the city gate.' } : null; }), hint: '{mimo} points at Marino, by the city gate.' },
        { text: 'Tomorrow: are the gulls back? Look on the quay', why: 'A wish from tomorrow, carried back to today… what did it change?',
          done: s => !!fS(s).piaSeen, target: () => M.via('future', () => ({ x: PIA.future.x, z: PIA.future.z, hint: '{mimo} looks up: gulls!' })), hint: '{mimo} looks up: gulls!' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'pf.soup')) QUESTS.LIST.push({ id: 'pf.soup', kind: 'side',
      title: 'Soup for everyone', get giver() { return M.fillEn('{wei}, the soup cook (Port Brisa, tomorrow)'); },
      started: s => !!fS(s).soupAsked,
      steps: [{ get text() { return M.fillEn('In the Future: say two kind wishes to {wei}’s first customers'); }, get why() { return M.fillEn(`A wish, for them: ${M.sx('wish')}.`); }, done: s => !!fS(s).soupDone, target: futAt('wei'), hint: HINTS.wei }] });
    if (!QUESTS.LIST.some(q => q.id === 'pf.miso')) QUESTS.LIST.push({ id: 'pf.miso', kind: 'side',
      title: 'Miso', get giver() { return M.fillEn('{yuki}, on the promenade (Port Brisa, tomorrow)'); },
      started: s => !!fS(s).misoAsked,
      steps: [{ get text() { return M.fillEn('In the Future: tell {mimo} what you want it to do: call the cat'); }, get why() { return M.fillEn(`A wish for {mimo}: ${M.sx('mwish')}.`); }, done: s => !!fS(s).misoDone, target: futAt('yuki'), hint: HINTS.yuki }] });
  }

  // ------------------------------------------------------------ the dressing's hooks
  Object.assign(M.DRESS.future, {
    k: () => k(),
    people: PEOPLE,
    on(api) { show(true); hid = M.hideToday(api, { future: true }); dressPeople(); M.holesOn(true); try { const Bp = M.B(); if (Bp && Bp.setBell) Bp.setBell(false); } catch (e) { /* */ } if (st().misoDone) catG().visible = true; else if (cat) cat.visible = false; },
    off() { show(false); hid = []; if (cat) cat.visible = false; },
    entered() { show(true); dressPeople(); M.holesOn(true); },
    late: (api, dt) => { if (typeof PT_FOFFICE !== 'undefined' && PT_FOFFICE && PT_FOFFICE.inside) PT_FOFFICE.late(dt); else late(dt); },
    update(api, dt, t) { dressPeople(); if (cat && cat.visible) { const Yk = who('yuki'); if (Yk) { cat.position.set(Yk.x + 0.7, gy(Yk.x, Yk.z), Yk.z + 0.5); cat.rotation.y = Math.sin(t * 0.6) * 0.4; } } },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, PEOPLE, who, k, build, show, LOOKS, freed, DOOR,
    target: id => target(id), song: () => song(), init: () => {}, changed: () => {},
    _: { talk: id => talk(id), marinoScene, wakeScene, openScene, gullsAsk, gullsToday, soupScene, misoScene, get built() { return built; } } };
})();
