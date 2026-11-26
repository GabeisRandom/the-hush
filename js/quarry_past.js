'use strict';
// The Quarry Caves, long ago (DESIGN.md 18.10 "T2b"): the miners' camp about 40 years back, the spring after the concert, the
// mine in its best years. TIME dresses it (time_quarry.js QUART.DRESS.past): bunting across the camp, an anvil and a forge by
// the shed, a stew pot over the fire, a cart full of ore on the rails, helmets on pegs, the camp's canary of then on the office
// porch, the crate where a quiet boy sat; the miners sing as they work (notes rise over them). Today's camp people, their props
// and Pío's cage are hidden (caves.js's own rig).
// The people of then (TIME's person kit): the forewoman (today's Cande's mother), young Cande, young Efraín (the songwriter),
//   the lamplighter, the blacksmith, the cook and an old miner who tells stories. Each language names its own (QPTXT.CAST).
// The main path (QUART.PSTEPS): the forewoman shows how it used to be (the imperfect, habits) → young Cande remembers the quiet
//   boy («¿Qué hacía Elio cada tarde?» → «Escuchaba», «¿Cantaba?» → «No, nunca cantaba») → the lamplighter, the blacksmith and
//   Efraín each remember the deep gallery (demonstrations) → «Antes los mineros cantaban cada día» → the old deep gallery
//   (quarry_past_dungeon.js) → Grandma Echo (quarry_time_boss.js) → the echo → Noa.
// Side quests (QUESTS.LIST): «The miners' song» (cross-time: you write two lines of Efraín's song, in the imperfect; today Pío
//   whistles it, tomorrow it's carved over the canteen's door), «The quiet canary», «The burnt menu board».
const QR_PAST = (() => {
  if (typeof TIME === 'undefined' || typeof QUART === 'undefined' || !QUART) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = QUART, T = () => QPTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('past');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are (checked with QUART._.t.probe in every world)
  const AT = {
    boss: { x: 85.0, z: -273.2, yaw: 0.5 }, cande: { x: 75.6, z: -262.4, yaw: 1.9 }, efrain: { x: 96.2, z: -262.6, yaw: -2.0 },
    lamp: { x: 78.0, z: -270.4, yaw: 2.2 }, smith: { x: 97.6, z: -272.2, yaw: 2.4 }, cook: { x: 84.2, z: -268.2, yaw: 1.2 }, grandpa: { x: 101.6, z: -265.0, yaw: -1.6 },
  };
  const ANVIL = { x: 99.4, z: -273.6 }, FORGE = { x: 100.8, z: -275.4 }, POT = { x: 86.4, z: -266.4 }, CART = { x: 87.7, z: -263.6 };
  const HELMETS = { x: 73.6, z: -269.6 }, CRATE = { x: 76.8, z: -260.2 }, CAGE = { x: 73.9, z: -262.5 }, BOARD = { x: 96.2, z: -253.4 }, WHISTLE = { x: 92.4, z: -275.4 };
  const SHEET = { past: { x: 101.0, z: -255.8, ry: -1.92 + Math.PI, look: { x: 99.7, z: -256.1 } }, now: { x: 73.2, z: -269.0, ry: Math.PI / 2, look: { x: 74.5, z: -269.2 } } };
  const C = () => T().CAST;
  const LOOK = {
    boss: { skin: '#c98e62', hair: '#3a2b26', hairdo: 'bun', dress: '#c9453a', vest: '#3f4a5a', hat: 'cap', hatColor: '#f4efe2', h: 1.02 },
    cande: { kid: true, skin: '#c98e62', hair: '#2e2420', hairdo: 'tails', ribbon: '#e8b83a', dress: '#c9453a', apron: '#f4efe2', h: 0.72 },
    efrain: { skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#8a6a4a', vest: '#3e5a7a', hat: 'cap', hatColor: '#e8b83a', prop: 'guitar', h: 1.0 },
    lamp: { skin: '#e6b48c', hair: '#5a3a26', hairdo: 'short', dress: '#3f6f5a', vest: '#2e2420', hat: 'flat', hatColor: '#2f3440', prop: 'lantern', stache: true, hair2: '#5a3a26', h: 0.98 },
    smith: { skin: '#a8714a', hair: '#1f1a18', hairdo: 'braids', dress: '#5a4a3a', apron: '#3a2a20', hat: 'scarf', hatColor: '#e0503f', h: 1.03 },
    cook: { skin: '#efc29a', hair: '#e8e4dc', hairdo: 'bald', dress: '#f2e6d0', apron: '#ffffff', stache: true, hair2: '#e8e4dc', wide: 1.18, h: 1.0 },
    grandpa: { skin: '#d9a27a', hair: '#ece8e0', hairdo: 'bald', beard: true, dress: '#6b5a4a', vest: '#8a6a4a', hat: 'cap', hatColor: '#c9a24a', prop: 'cane', h: 0.94 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: (api, p) => talk(id, p) }));
  const who = id => M.who('past', id);

  // ------------------------------------------------------------ the dressing: one merged mesh (and its ink hull) per group
  let built = null;
  const kit = () => PAST.API.Kit();
  function bunting(k, a, b, h = 4.2) {
    const KG = PAST.API.KG, ya = gy(a[0], a[1]) + h, yb = gy(b[0], b[1]) + h, n = 30, COLS = ['#e2453a', '#ffd84a', '#e2453a', '#f4efe2'];
    const P0 = t => [lerp(a[0], b[0], t), lerp(ya, yb, t) + 0.3 - Math.sin(t * Math.PI) * 1.2, lerp(a[1], b[1], t)];
    for (let i = 0; i < n; i++) { const p = P0(i / n), q = P0((i + 1) / n); k.rod(p, q, 0.012, '#d8c8a0', 0); }
    const ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
    for (let i = 1; i < n; i++) { const p = P0(i / n); k.add(KG.cone4, p[0], p[1] - 0.2, p[2], 0.17, 0.34, 0.03, COLS[i % COLS.length], { ry: ry + Math.PI / 2, rx: Math.PI, ink: 0.004 }); }
    for (const [x, z] of [a, b]) k.rod([x, gy(x, z), z], [x, gy(x, z) + h + 0.4, z], 0.07, '#6b4a30', 0.01);
  }
  function props(k) {
    const KG = PAST.API.KG;
    // the blacksmith's anvil and forge (its fire is a glow, below)
    let y = gy(ANVIL.x, ANVIL.z);
    k.box(ANVIL.x, y + 0.3, ANVIL.z, 0.5, 0.6, 0.5, '#5a4a3a').box(ANVIL.x, y + 0.66, ANVIL.z, 0.86, 0.16, 0.36, '#3d4250').add(KG.cone, ANVIL.x + 0.55, y + 0.66, ANVIL.z, 0.12, 0.34, 0.12, '#3d4250', { rz: -Math.PI / 2, ink: 0.01 });
    y = gy(FORGE.x, FORGE.z);
    k.box(FORGE.x, y + 0.45, FORGE.z, 1.3, 0.9, 1.1, '#8f8a80').box(FORGE.x, y + 0.93, FORGE.z, 1.0, 0.08, 0.8, '#3a2a20', { ink: 0 }).box(FORGE.x + 0.2, y + 1.6, FORGE.z - 0.3, 0.4, 1.4, 0.4, '#7d7366');
    // the stew pot over the fire pit, on a tripod
    y = gy(POT.x, POT.z);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; k.rod([POT.x + Math.cos(a) * 1.1, y, POT.z + Math.sin(a) * 1.1], [POT.x, y + 1.9, POT.z], 0.05, '#4a3426', 0.008); }
    k.rod([POT.x, y + 1.9, POT.z], [POT.x, y + 1.25, POT.z], 0.015, '#2f3440', 0);
    k.add(KG.half, POT.x, y + 1.2, POT.z, 0.42, -0.42, 0.42, '#2f3440').add(KG.cyl, POT.x, y + 1.18, POT.z, 0.38, 0.02, 0.38, '#a8673a', { ink: 0 });
    // a cart full of ore on the rails
    y = gy(CART.x, CART.z);
    k.box(CART.x, y + 0.7, CART.z, 0.95, 0.66, 1.3, '#5d6470', { ry: 0.08 }).box(CART.x, y + 1.06, CART.z, 1.02, 0.07, 1.37, '#454b55', { ry: 0.08, ink: 0.01 });
    for (const sx of [-0.5, 0.5]) for (const sz of [-0.38, 0.38]) k.add(KG.cyl, CART.x + sx, y + 0.3, CART.z + sz, 0.19, 0.11, 0.19, '#3a3d44', { rz: Math.PI / 2, ink: 0.01 });
    for (let i = 0; i < 7; i++) k.add(KG.ball6, CART.x + (i % 3 - 1) * 0.28, y + 1.14 + (i > 4 ? 0.14 : 0), CART.z + ((i >> 1) % 3 - 1) * 0.34, 0.2, 0.15, 0.18, ['#9a8f80', '#c9a24a', '#8a7f70', '#7fe0d8'][i % 4], { ink: 0.01 });
    // helmets on pegs, by the office door (one small one: young Cande's)
    y = gy(HELMETS.x, HELMETS.z);
    k.box(HELMETS.x - 0.15, y + 1.5, HELMETS.z, 0.08, 0.12, 2.2, '#6b4a30', { ink: 0.008 });
    for (let i = 0; i < 5; i++) { const z = HELMETS.z - 0.85 + i * 0.42, s = i === 4 ? 0.13 : 0.17; k.add(KG.half, HELMETS.x, y + 1.36, z, s, s * 0.8, s, i === 4 ? '#e0503f' : '#e8b83a', { ink: 0.008 }); }
    // the crate where a quiet boy sat every afternoon
    y = gy(CRATE.x, CRATE.z);
    k.box(CRATE.x, y + 0.3, CRATE.z, 0.7, 0.6, 0.6, '#a8703f', { ry: 0.3 }).box(CRATE.x, y + 0.31, CRATE.z, 0.72, 0.08, 0.62, '#8a5636', { ry: 0.3, ink: 0 });
    // the camp canary's cage on the office porch, hanging from a bracket
    k.rod([CAGE.x - 0.6, gy(CAGE.x, CAGE.z) + 2.9, CAGE.z], [CAGE.x, gy(CAGE.x, CAGE.z) + 2.9, CAGE.z], 0.03, '#5a3a24', 0.006);
    // the burnt menu board by the canteen, on a post
    y = gy(BOARD.x, BOARD.z);
    k.rod([BOARD.x, y, BOARD.z], [BOARD.x, y + 1.3, BOARD.z], 0.05, '#6b4a30', 0.008).box(BOARD.x, y + 1.45, BOARD.z, 0.6, 0.42, 0.05, '#2f3a34', { ry: 1.2 }).box(BOARD.x + 0.18, y + 1.3, BOARD.z - 0.05, 0.26, 0.2, 0.06, '#1b130e', { ry: 1.2, ink: 0 });
    // the shift whistle on its post
    y = gy(WHISTLE.x, WHISTLE.z);
    k.rod([WHISTLE.x, y, WHISTLE.z], [WHISTLE.x, y + 2.4, WHISTLE.z], 0.06, '#6b4a30', 0.008).add(KG.cyl, WHISTLE.x, y + 2.5, WHISTLE.z, 0.08, 0.3, 0.08, '#c9a24a', { ink: 0.006 }).add(KG.cone, WHISTLE.x, y + 2.7, WHISTLE.z, 0.12, 0.16, 0.12, '#c9a24a', { ink: 0.006 });
    // sacks of ore by the rails, and a stack of timber for the galleries
    for (let i = 0; i < 5; i++) k.add(KG.sphere, 83.4 + (i % 3) * 0.6, gy(83.4, -258.2) + 0.32 + (i > 2 ? 0.45 : 0), -258.2 + (i % 2) * 0.4, 0.34, 0.3, 0.32, '#c8b48a', { ink: 0.012 });
    for (let j = 0; j < 4; j++) k.box(104.2, gy(104.2, -259.4) + 0.12 + j * 0.2, -259.4, 0.24, 0.18, 3.2, '#a8703f', { ry: 0.05 * j });
    // bunting across the camp: office porch to bunkhouse, tent to canteen
    bunting(k, [73.6, -264.2], [103.1, -264.2]); bunting(k, [77.6, -256.0], [99.0, -252.6], 3.8);
  }
  // the camp canary of then: a yellow bird in a brass cage (one group: it hops and sings)
  function canary() {
    const g = new THREE.Group(), y = gy(CAGE.x, CAGE.z); g.position.set(CAGE.x, y + 2.42, CAGE.z); g.name = 'qr-past-canary';
    const k = kit(), KG = PAST.API.KG;
    k.add(KG.cyl, 0, -0.62, 0, 0.26, 0.05, 0.26, '#c9a24a', { ink: 0.012 }).add(KG.half, 0, -0.08, 0, 0.26, 0.2, 0.26, '#c9a24a', { ink: 0.012 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; k.add(KG.cyl6, Math.cos(a) * 0.25, -0.34, Math.sin(a) * 0.25, 0.012, 0.56, 0.012, '#d9b45a', { ink: 0 }); }
    k.add(KG.cyl6, 0, 0.18, 0, 0.012, 0.36, 0.012, '#5a3a24', { ink: 0 }).add(KG.cyl6, 0, -0.38, 0, 0.015, 0.44, 0.015, '#8a6440', { rz: Math.PI / 2, ink: 0 });
    k.build(g, { shadow: false });
    const bird = new THREE.Group(); bird.position.set(0, -0.33, 0); g.add(bird);
    const b = kit();
    b.add(KG.sphere, 0, 0.07, 0, 0.075, 0.07, 0.09, '#f6d32a', { ink: 0.01 }).add(KG.sphere, 0, 0.15, 0.06, 0.055, 0.055, 0.055, '#f6d32a', { ink: 0.01 });
    b.add(KG.cone, 0, 0.15, 0.12, 0.018, 0.045, 0.018, '#e8843a', { rx: Math.PI / 2, ink: 0 });
    for (const s of [-1, 1]) b.add(KG.ball6, s * 0.028, 0.165, 0.105, 0.009, 0.012, 0.008, '#2b2235', { ink: 0 });
    b.build(bird, { shadow: false });
    return { g, bird, sing: 0, hop: 0, next: 2 };
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'qr-past-' + name; const k = kit(); fn(k); k.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), bird: canary(), solids: [] };
    scene.add(built.bird.g); built.bird.g.visible = false;
    // the forge's fire
    const fire = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ff9a4a', transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
    fire.scale.setScalar(1.6); fire.position.set(FORGE.x, gy(FORGE.x, FORGE.z) + 1.05, FORGE.z); fire.visible = false; scene.add(fire); built.fire = fire;
    // steam over the pot (a few soft puffs)
    built.steam = [0, 1, 2].map(i => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#f4efe2', transparent: true, opacity: 0.25, depthWrite: false })); s.scale.setScalar(0.6); s.visible = false; scene.add(s); return { s, ph: i * 2.1 }; });
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    add(ANVIL.x, ANVIL.z, 0.45); add(FORGE.x, FORGE.z, 0.75); add(CART.x, CART.z, 0.85); add(HELMETS.x - 0.1, HELMETS.z, 0.3); add(CRATE.x, CRATE.z, 0.42);
    add(BOARD.x, BOARD.z, 0.3); add(WHISTLE.x, WHISTLE.z, 0.18); add(84.0, -258.0, 0.9); add(104.2, -259.4, 0.6); add(104.2, -258.0, 0.6); add(104.2, -260.8, 0.6);
    WORLD.extra.push(...built.solids);
    return built;
  }
  const solidsOn = on => { if (built) built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); };
  // today's camp (caves.js): its people, the props Mimo carried to them, Pío's cage; the side modules' things drawn near here
  function hideToday(api) {
    const B = typeof CAVES !== 'undefined' && CAVES.built; if (!B) return;
    (B.people || []).forEach(p => api.hide(p.root));
    try { (CAVES._.propsOn || []).forEach(o => api.hide(o.g)); } catch (e) { /* */ }
    if (B.objects && B.objects.bird) api.hide(B.objects.bird.cage);
    for (const o of G().w3d.scene.children) if (o.visible && /^(read|diary|townlife|tl-|store)/i.test(o.name || '') && Math.hypot(o.position.x - 88, o.position.z + 266) < 45) api.hide(o);
  }
  function show(on) {
    const B = build();
    B.props.visible = on; B.bird.g.visible = on; B.fire.visible = on; B.steam.forEach(s => { s.s.visible = on; });
    solidsOn(on);
  }

  // ------------------------------------------------------------ the miners sing as they work: notes rise over them, now and then
  let noteT = 0;
  function update(dt, t) {
    const B = built; if (!B) return;
    // the canary hops, and (once she sings again) sings
    const bd = B.bird, s = st(); bd.next -= dt; bd.hop = Math.max(0, bd.hop - dt * 3);
    if (bd.next <= 0) { bd.next = 2.2 + Math.random() * 3; bd.hop = 1; if (s.canaryDone) bd.sing = 1.4; }
    if (bd.sing > 0) { bd.sing -= dt; if (Math.random() < dt * 5) note(CAGE.x + 0.1, gy(CAGE.x, CAGE.z) + 2.3, CAGE.z + 0.1, '#fff3a0'); }
    bd.bird.position.y = -0.33 + Math.sin(bd.hop * Math.PI) * 0.06; bd.bird.rotation.y = Math.sin(t * 0.8) * 0.7; bd.g.rotation.z = Math.sin(t * 1.2) * 0.04;
    B.fire.material.opacity = 0.55 + 0.2 * Math.sin(t * 9) + 0.1 * Math.sin(t * 17);
    B.steam.forEach(o => { const k = ((t * 0.4 + o.ph) % 1.6) / 1.6; o.s.position.set(POT.x + Math.sin(t + o.ph) * 0.15, gy(POT.x, POT.z) + 1.4 + k * 1.4, POT.z); o.s.material.opacity = 0.3 * (1 - k); o.s.scale.setScalar(0.4 + k * 0.6); });
    // the workers' song: a note over someone singing, every second or so
    if ((noteT -= dt) <= 0) {
      noteT = 0.7 + Math.random() * 0.8;
      const ids = ['boss', 'lamp', 'smith', 'cook', 'efrain'], p = who(ids[(Math.random() * ids.length) | 0]);
      if (p && !p.talking) note(p.x + (Math.random() - 0.5) * 0.4, (p.y || 0) + 2.0, p.z + (Math.random() - 0.5) * 0.4, Math.random() < 0.5 ? '#fff3a0' : '#ffd6e2');
    }
  }
  const note = (x, y, z, c) => { try { const B = CAVES.built; if (B && B.note) B.note(x, y, z, c); } catch (e) { /* */ } };
  function late() {
    // (today's Pío stays quiet while the camp of long ago is on)
    const B = typeof CAVES !== 'undefined' && CAVES.built;
    if (B && B.objects && B.objects.bird) { B.objects.bird.next = 6; B.objects.bird.sing = 0; }
  }

  // ------------------------------------------------------------ talking to the people of then (the main path first; side quests
  // come through STORY.talkHooks below, as a little menu)
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const chats = {};
  const cycle = (id, keys) => { chats[id] = ((chats[id] || 0) + 1) % keys.length; return say1(id, keys[chats[id]]); };
  const heardN = () => ['lamp', 'smith', 'efrain'].filter(k => st().heard && st().heard[k]).length;
  function talk(id) {
    const s = st();
    switch (id) {
      case 'boss': return !s.met ? bossScene() : !s.joined ? (s.cande && heardN() >= 3 ? galleryAsk() : say1('boss', 'boss.again')) : TIME.flag('past', 'qrDeep') ? cycle('boss', ['boss.done', 'boss.chat1', 'boss.chat2']) : cycle('boss', ['boss.ok', 'boss.chat1', 'boss.chat2']);
      case 'cande': return !s.cande ? candeScene() : cycle('cande', ['cande.chat1', 'cande.chat2', 'cande.after']);
      case 'lamp': case 'smith': case 'efrain': return !(s.heard && s.heard[id]) ? heardScene(id) : say1(id, id + '.chat');
      case 'cook': return cycle('cook', ['cook.hello', 'cook.chat']);
      case 'grandpa': return cycle('grandpa', ['grandpa.1', 'grandpa.2', 'grandpa.3']);
      default: return null;
    }
  }
  // the main path, 1: the forewoman shows how it used to be (the imperfect for habits), the card, the task
  async function bossScene() {
    const s = st(), B = who('boss'); if (!B) return;
    M.lock(true);
    try { M.frame2(B); await wait(0.4); await M.say(B, ln('boss.hello')); await M.demo(B, T().DEMO['boss.demo'], T().MARKS['boss.demo']); } finally { M.lock(false); }
    await M.card(T().CARDS.habit);
    M.lock(true); try { const B2 = who('boss'); M.frame2(B2); await M.say(B2, ln('boss.task')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('Young {cande} is on the office porch. The lamplighter, the blacksmith and {efrain} are around the camp.', 5.5);
  }
  // the main path, 2: young Cande's game: what did Elio do every afternoon? did he sing?
  async function candeScene() {
    const s = st(), K = () => who('cande'); if (!K()) return;
    if (!s.candeDemo) {
      M.lock(true); try { M.frame2(K()); await wait(0.3); await M.say(K(), ln('cande.hello')); await M.demo(K(), T().DEMO['cande.demo'], T().MARKS['cande.demo']); s.candeDemo = true; G().save(); } finally { M.lock(false); }
    }
    if ((s.candeQ || 0) < 1) {
      M.lock(true); try { M.frame2(K()); await M.say(K(), ln('cande.q1')); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.listened, { tips: T().TIPS }); if (!r) { M.think('Young {cande} is waiting: what did Elio do every afternoon?', 4.5); return; }
      TIME.grade('qr.listened', r.letter); s.candeQ = 1; G().save();
    }
    if ((s.candeQ || 0) < 2) {
      M.lock(true); try { M.frame2(K()); await M.say(K(), ln('cande.q2')); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.never, { tips: T().TIPS }); if (!r) { M.think('Young {cande} is waiting: did Elio sing?', 4.5); return; }
      TIME.grade('qr.never', r.letter); s.candeQ = 2; G().save();
    }
    M.lock(true); try { M.frame2(K()); await M.say(K(), ln('cande.after')); s.cande = true; G().save(); } finally { M.lock(false); }
    M.think(heardN() >= 3 ? 'Back to {boss}, by the mine’s mouth: tell her how the deep gallery used to be.' : 'Now the miners: how was the deep gallery before?', 5);
  }
  // the main path, 3: each of the three remembers the deep gallery's old days
  async function heardScene(id) {
    const s = st(), P = () => who(id); if (!P()) return;
    M.lock(true);
    try { M.frame2(P(), id === 'smith' ? -1 : 1); await wait(0.3); await M.demo(P(), T().DEMO[id + '.demo'], T().MARKS[id + '.demo']); await M.say(P(), ln(id + '.after')); (s.heard || (s.heard = {}))[id] = true; G().save(); } finally { M.lock(false); }
    const n = heardN();
    M.think(n >= 3 ? (s.cande ? 'That’s all three. Tell {boss}, by the mine’s mouth, how the deep gallery used to be.' : 'That’s all three. Young {cande}, on the office porch, remembers the quiet boy.') : `How it used to be down there (${n}/3).`, 5);
  }
  // the main path, 4: «¿Cómo era antes el fondo?» → «Antes los mineros cantaban cada día»
  async function galleryAsk() {
    const s = st(), B = () => who('boss'); if (!B()) return;
    M.lock(true); try { M.frame2(B()); await wait(0.3); await M.say(B(), ln('boss.ask')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.gallery, { tips: T().TIPS }); if (!r) { M.think('{boss} is waiting: how did the deep gallery use to be?', 4.5); return; }
    TIME.grade('qr.gallery', r.letter);
    M.lock(true); try { M.frame2(B()); await M.say(B(), ln('boss.ok')); s.joined = true; G().save(); } finally { M.lock(false); }
    M.think('The mine’s mouth is open. Down in the old deep gallery, everything is a memory.', 5);
  }

  // ------------------------------------------------------------ side quest: «The miners' song» (the Past changes today and tomorrow)
  async function songScene() {
    const s = st(), E = () => who('efrain'); if (!E()) return;
    if (!s.songAsked) {
      M.lock(true); try { M.frame2(E()); await wait(0.3); await M.say(E(), ln('song.ask')); await M.demo(E(), T().DEMO['song.demo'], T().MARKS['song.demo']); s.songAsked = true; G().save(); } finally { M.lock(false); }
    }
    if (!s.verse1) {
      const r = await M.ask(T().TASKS.verse1, { tips: T().TIPS, icon: 'sing' }); if (!r) { M.think('{efrain} is waiting for the second line of his song.', 4); return; }
      TIME.grade('qr.verse1', r.letter); s.verse1 = r.letter; G().save();
      M.lock(true); try { M.frame2(E()); await M.say(E(), ln('song.next')); } finally { M.lock(false); }
    }
    const r2 = await M.ask(T().TASKS.verse2, { tips: T().TIPS, icon: 'sing' }); if (!r2) { M.think('{efrain} is waiting for the last line of his song.', 4); return; }
    TIME.grade('qr.verse2', r2.letter); s.verse2 = r2.letter; G().save();
    M.lock(true);
    try {
      M.frame2(E()); await M.say(E(), ln('song.sing'));
      TIME.flag('past', 'qrSong', true); TIME.refresh(); s.songDone = true; G().save();
      // everyone sings it together: the song, notes over every head
      try { if (typeof QRMUSIC !== 'undefined') QRMUSIC.play('qr_minersong', 9); } catch (e) { /* */ }
      for (let k = 0; k < 14; k++) { for (const id of Object.keys(AT)) { const p = who(id); if (p && Math.random() < 0.5) note(p.x, (p.y || 0) + 2.1, p.z, k % 2 ? '#fff3a0' : '#9ff5e8'); } await wait(0.45); }
      const E2 = E(); M.frame2(E2); await M.say(E2, ln('song.thanks'));
      G().state.coins = (G().state.coins || 0) + 8; UI.toast('+8 coins'); snd('chest');
    } finally { M.lock(false); }
    M.think('The miners will sing it for years… Does anyone still sing it today? Pío, maybe?', 5.5);
  }
  // the pieces: the song's sheet (long ago: pinned on the canteen's wall; today: framed by the office door; tomorrow: carved, gray)
  function sheetMesh(w) {
    const g = new THREE.Group(), l = lang(), N = T().NAMES.song, tag = M.plainT(N[l] || N.en), sh = SHEET[w === 'future' ? 'past' : w];
    const tex = TK.canvasTex(256, 200, (c, W0, H0) => {
      const old = w === 'future';
      c.fillStyle = old ? '#8f8a86' : w === 'now' ? '#f4ead2' : '#f8f0dc'; c.fillRect(0, 0, W0, H0);
      c.strokeStyle = old ? '#4a4652' : '#6b4a30'; c.lineWidth = 10; c.strokeRect(5, 5, W0 - 10, H0 - 10);
      c.fillStyle = old ? '#3a3640' : '#3a2a20'; c.textAlign = 'center'; c.font = '700 22px Georgia, "Microsoft YaHei", "Yu Mincho", serif'; c.fillText(tag.slice(0, 22), W0 / 2, 42);
      c.font = '28px "Segoe UI Symbol", serif'; for (let i = 0; i < 4; i++) c.fillText('♪ ♫ ♪', W0 / 2, 86 + i * 30);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshBasicMaterial({ map: tex, transparent: false }));
    const y = gy(sh.x, sh.z) + (w === 'future' ? 2.6 : 1.7); m.position.set(sh.x, y, sh.z); m.rotation.y = sh.ry; g.add(m); g.name = 'qr-song-' + w;
    return { obj: g };
  }
  const songLook = w => async () => {
    const l = lang(), N = T().NAMES.songLines, text = M.plainT(N[l] || N.en);
    if (w === 'past') { M.think(`«${text}»… {efrain}’s song, pinned up for everyone to learn.`, 7); return; }
    if (w === 'now') {
      M.think(`A frame by the office door: the miners’ song, in old ink. «${text}» Pío whistles it every morning.`, 8);
      try { if (typeof QRMUSIC !== 'undefined') QRMUSIC.play('qr_pio', 6); const B = CAVES.built; if (B && B.objects.bird) B.objects.bird.sing = 4; } catch (e) { /* */ }
      const n = M.st('now'); if (!n.pio) { n.pio = true; G().save(); }
      return;
    }
    M.think(`Carved over the canteen’s door, gray with dust: «${text}». Someone kept this song for a very long time.`, 7);
    const f = M.st('future'); if (!f.songSeen) { f.songSeen = true; G().save(); }
  };
  TIME.effect('quarry.song', { region: 'quarry', when: () => !!TIME.flag('past', 'qrSong'),
    show: { past: () => sheetMesh('past'), now: () => sheetMesh('now'), future: () => sheetMesh('future') },
    act: { past: { x: SHEET.past.look.x, z: SHEET.past.look.z, r: 1.3, label: 'Look', run: songLook('past') }, now: { x: SHEET.now.look.x, z: SHEET.now.look.z, r: 1.3, label: 'Look', run: songLook('now') },
      future: { x: SHEET.past.look.x, z: SHEET.past.look.z, r: 1.3, label: 'Look', run: songLook('future') } } });
  // today: Cande knows the song (her Talk has no id: she's matched by where she stands)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || !TIME.open('quarry') || it.label !== 'Talk' || it.who || !TIME.flag('past', 'qrSong')) return null;
    const B = typeof CAVES !== 'undefined' && CAVES.built, Cp = B && B.people && B.people.find(p => p.id === 'cande'); if (!Cp || Math.hypot(it.x - Cp.x, it.z - Cp.z) > 0.8) return null;
    return [{ label: 'Pío’s song', run: async () => {
      M.lock(true);
      try { Cp.talking = true; try { if (typeof QRMUSIC !== 'undefined') QRMUSIC.play('qr_pio', 6); if (B.objects.bird) B.objects.bird.sing = 4; } catch (e) { /* */ } await M.say({ id: 'cande', name: 'Cande', x: Cp.x, y: Cp.y, z: Cp.z, top: 2.1 }, ln('now.cande')); }
      finally { Cp.talking = false; M.lock(false); }
      const n = M.st('now'); if (!n.pio) { n.pio = true; G().save(); }
    } }];
  });

  // ------------------------------------------------------------ side quest: «The quiet canary» (young Cande's)
  async function canaryScene() {
    const s = st(), K = () => who('cande'); if (!K()) return;
    if (!s.canaryTold) {
      M.lock(true); try { M.frame2(K()); await wait(0.3); await M.say(K(), ln('canary.ask')); await M.demo(K(), T().DEMO['canary.demo'], T().MARKS['canary.demo']); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.canary, { tips: T().TIPS }); if (!r) { M.think('Young {cande} is waiting: what did {canary} do every morning?', 4); return; }
      TIME.grade('qr.canary', r.letter); s.canaryTold = true; G().save();
      M.lock(true); try { M.frame2(K()); await M.say(K(), ln('canary.more')); } finally { M.lock(false); }
    }
    const r2 = await M.ask(M.memTask(T().MEM.canary), { icon: 'sing' }); if (!r2) return;
    TIME.grade('qr.canarySing', r2.letter);
    const g = G(), sim = g.sim, y = gy(CAGE.x, CAGE.z);
    M.lock(true);
    try {
      M.shot(V(CAGE.x + 3.6, y + 2.6, CAGE.z + 2.6), V(CAGE.x, y + 2.1, CAGE.z));
      sim.mimoGo({ x: CAGE.x + 1.2, z: CAGE.z + 0.9 }, CAGE); await wait(0.9);
      try { if (CAVES.mimoSing) await CAVES.mimoSing(2.0); else { snd('sing'); await wait(2); } } catch (e) { /* */ }
      s.canaryDone = true; G().save(); built.bird.sing = 3; snd('canary'); await wait(1.4);
      const K2 = K(); M.frame2(K2); await M.say(K2, ln('canary.sings'));
      g.state.coins = (g.state.coins || 0) + 5; UI.toast('+5 coins'); sim.mimoGo(null, null);
    } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ side quest: «The burnt menu board» (the cook's)
  async function menuScene() {
    const s = st(), Ck = () => who('cook'); if (!Ck()) return;
    if (!s.menuAsked) {
      M.lock(true); try { M.frame2(Ck()); await wait(0.3); await M.demo(Ck(), T().DEMO['cook.demo'], T().MARKS['cook.demo']); await M.say(Ck(), ln('cook.ask')); s.menuAsked = true; G().save(); } finally { M.lock(false); }
      M.think('A corner of the menu board is left, by the canteen. Have a look.', 5); return;
    }
    if (!s.menuSeen) { M.think('{cook} needs the board’s words. A corner of it is left by the canteen.', 4.5); return; }
    const r = await M.ask(T().TASKS.menu, { tips: T().TIPS }); if (!r) return;
    TIME.grade('qr.menu', r.letter);
    M.lock(true); try { const C2 = Ck(); M.frame2(C2); await M.say(C2, ln('cook.thanks')); s.menuDone = true; G().state.coins = (G().state.coins || 0) + 5; UI.toast('+5 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ the Talk menus: side quests (the main path's scenes play straight off a Talk)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'past' || TIME.regionNow() !== 'quarry') return null;
    const s = st();
    if (it.who === 'past:efrain' && s.heard && s.heard.efrain && !s.songDone) return [{ label: 'The miners’ song', sub: '◆ side quest', run: songScene }];
    if (it.who === 'past:cande' && s.cande && !s.canaryDone) return [{ label: `The quiet canary`, sub: '◆ side quest', run: canaryScene }];
    if (it.who === 'past:cook' && s.met && !s.menuDone) return [{ label: 'The burnt menu board', sub: '◆ side quest', run: menuScene }];
    return null;
  });

  // ------------------------------------------------------------ E: the mine's mouth, and the things you can look at
  const LOOKS = [
    { id: 'w.qr_helmet', at: { x: HELMETS.x + 1.1, z: HELMETS.z }, line: 'Yellow {w.qr_helmet:pl} on pegs, one for every miner. And one small red one: young {cande}’s.' },
    { id: 'w.qr_crate', at: { x: CRATE.x + 0.9, z: CRATE.z - 0.4 }, line: 'An old {w.qr_crate} by the office. Young {cande} says a quiet boy sat here every {w.qr_afternoon}.' },
    { id: 'w.qr_anvil', at: { x: 100.3, z: -272.3 }, line: 'The blacksmith’s {w.qr_anvil}, and the {w.qr_forge} behind it, red and humming.' },
    { id: 'w.qr_pot', at: { x: 88.9, z: -267.5 }, line: 'A big {w.qr_pot} of {w.qr_stew} on the fire. It smells of onions and long days.' },
    { id: 'w.qr_cart', at: { x: 89.4, z: -263.0 }, line: 'A {w.qr_cart} full of {w.qr_ore}, ready to roll down the {w.qr_rails}.' },
    { id: 'w.qr_flag', at: { x: 88.0, z: -259.8 }, line: 'Little {w.qr_flag:pl} strung across the camp, red and yellow. It’s a good year at the {w.qr_mine}.' },
    { id: 'w.qr_whistle', at: { x: 92.6, z: -274.0 }, line: 'The shift {w.qr_whistle}. It blows every {w.qr_morning} and every evening.' },
    { id: 'w.qr_pick', at: { x: 102.4, z: -274.9 }, line: '{w.qr_pick:pl} on a rack, their handles shiny from many hands.' },
    { id: 'w.qr_sack', at: { x: 85.4, z: -257.4 }, line: '{w.qr_sack:pl} of {w.qr_ore}, waiting for the cart to town.' },
  ];
  function interactables() {
    const s = st(), out = [];
    out.push({ x: M.MOUTH.x, z: M.MOUTH.z, r: 2.1, label: s.joined ? 'Go in' : 'Look', run: async () => {
      if (!s.joined) { M.lookAt('w.qr_mine', s.met ? 'The {w.qr_mine}’s mouth. {boss} decides who goes down to the deep {w.qr_gallery}.' : 'The {w.qr_mine}’s mouth, timbered and busy. Miners go in and out, singing.', 4.5); return; }
      if (typeof QPDEEP !== 'undefined' && QPDEEP) await QPDEEP.enter();
    } });
    for (const L0 of LOOKS) out.push({ x: L0.at.x, z: L0.at.z, r: 1.3, label: 'Look', run: async () => M.lookAt(L0.id, L0.line, 5) });
    out.push({ x: BOARD.x - 0.6, z: BOARD.z + 0.9, r: 1.3, label: 'Look', run: async () => {
      const l = lang(), N = T().NAMES.board; M.lookAt('w.qr_board', `A burnt {w.qr_board}, one corner left: «${M.plainT(N[l] || N.en)}»`, 6);
      if (s.menuAsked && !s.menuSeen) { s.menuSeen = true; G().save(); M.think('Back to {cook}, by the fire.', 3); }
    } });
    return out;
  }
  function nextId() { const s = st(); return !s.met ? 'boss' : !s.cande ? 'cande' : heardN() < 3 ? 'heard' : !s.joined ? 'boss' : 'door'; }
  const HINTS = { boss: '{mimo} points at the woman with a clipboard, by the mine’s mouth.', cande: '{mimo} points at a little girl on the office porch.', door: '{mimo} looks at the mine’s mouth.',
    lamp: '{mimo} points at the lamplighter, by a lamp post.', smith: '{mimo} points at the blacksmith, by the anvil.', efrain: '{mimo} points at a young miner with a guitar.', cook: '{mimo} points at the cook, by the stew pot.',
    board: '{mimo} sniffs a burnt board by the canteen.' };
  function target(id) {
    if (id === 'door') return (typeof QPDEEP !== 'undefined' && QPDEEP && QPDEEP.inside && QPDEEP.target()) || { x: M.MOUTH.x, z: M.MOUTH.z, hint: HINTS.door };
    if (id === 'heard') { const s = st(), n = ['lamp', 'smith', 'efrain'].find(k => !(s.heard && s.heard[k])); if (!n) return target('boss'); id = n; }
    if (id === 'board') return { x: BOARD.x, z: BOARD.z, hint: HINTS.board };
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || '{mimo} points.' };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('qr_past') ? 'qr_past' : 'past');

  // ------------------------------------------------------------ the side quests (QUESTS.LIST: they start as the story reaches them)
  if (typeof QUESTS !== 'undefined') {
    const pS = s => M.sp(s), nS = s => M.sn(s);
    const pastAt = id => () => M.via('past', () => target(id));
    if (!QUESTS.LIST.some(q => q.id === 'qr.song')) QUESTS.LIST.push({ id: 'qr.song', kind: 'side',
      get title() { return M.fillEn('{efrain}’s song'); }, get giver() { return M.fillEn('{efrain}, a young miner (the Quarry Caves, long ago)'); },
      started: s => !!(pS(s).heard && pS(s).heard.efrain),
      steps: [
        { get text() { return M.fillEn('In the Past: help {efrain} write the miners’ song (two lines)'); }, get why() { return M.fillEn(`A miners’ song tells how they lived: what they did every day. In the imperfect, about all of you: ${M.sx('habit')}.`); },
          done: s => !!pS(s).songDone, target: pastAt('efrain'), hint: HINTS.efrain },
        { text: 'Today: does anyone still sing it? Look by Cande’s office door', why: 'A song taught to the miners long ago… a canary in the camp today might know it.',
          done: s => !!nS(s).pio, target: () => M.via('now', () => ({ x: SHEET.now.look.x, z: SHEET.now.look.z, hint: '{mimo} points at a frame by the office door.' })), hint: '{mimo} points at a frame by the office door.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'qr.canary')) QUESTS.LIST.push({ id: 'qr.canary', kind: 'side',
      get title() { return M.fillEn('The quiet canary'); }, get giver() { return M.fillEn('young {cande}, on the office porch (the Quarry Caves, long ago)'); },
      started: s => !!pS(s).cande,
      steps: [
        { get text() { return M.fillEn('In the Past: tell young {cande} what {canary} used to do, then sing to her'); }, get why() { return M.fillEn(`The camp’s canary went quiet in the spring. Tell how it was, then tell {mimo} what it did, as a memory: ${M.sx('mem')}.`); },
          done: s => !!pS(s).canaryDone, target: pastAt('cande'), hint: HINTS.cande },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'qr.menu')) QUESTS.LIST.push({ id: 'qr.menu', kind: 'side',
      get title() { return M.fillEn('The burnt menu board'); }, get giver() { return M.fillEn('{cook}, by the stew pot (the Quarry Caves, long ago)'); },
      started: s => !!pS(s).met,
      steps: [
        { get text() { return M.fillEn('In the Past: talk to {cook}, the cook'); }, why: 'The cook looks worried. Something about his menu.', done: s => !!pS(s).menuAsked, target: pastAt('cook'), hint: HINTS.cook },
        { text: 'Find what’s left of the menu board, by the canteen', why: 'One corner of it is left.', done: s => !!pS(s).menuSeen, target: pastAt('board'), hint: HINTS.board },
        { get text() { return M.fillEn('Tell {cook} what the miners always ate on Mondays'); }, why: 'What they used to eat, every Monday: the imperfect.', done: s => !!pS(s).menuDone, target: pastAt('cook'), hint: HINTS.cook },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks (TIME calls them: time.js "TIME dresses it")
  Object.assign(M.DRESS.past, {
    people: PEOPLE,
    on(api) { show(true); hideToday(api); },
    off() { show(false); },
    entered() { show(true); },
    late: (api, dt) => { late(); if (typeof QPDEEP !== 'undefined' && QPDEEP && QPDEEP.inside) QPDEEP.late(dt); },
    update(api, dt, t) { update(dt, t); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, PEOPLE, who, build, show, late, SHEET, LOOKS,
    target: id => target(id), song: () => song(), init: () => {}, changed: () => {},
    _: { talk: id => talk(id), bossScene, candeScene, heardScene, galleryAsk, songScene, canaryScene, menuScene, get built() { return built; } } };
})();
