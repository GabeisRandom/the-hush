'use strict';
// The Mirror Lake, long ago (DESIGN.md 18.10 "T2a"): Remanso about 40 years back, the winter after the concert. TIME dresses it
// (time_lake.js LAKET.DRESS.past): the lake is low (the water plane drops, and a dry sandbar runs from the end of the main pier to a
// little island with the frogs' grotto in it: what the lake covers today), the ferryman's newer ferry, a reed hut, a heron on
// the mud, the boat builder's bench in the making. Today's villagers (one instanced rig) are set aside, their solids parked.
// The people of then (TIME's person kit): the ferryman (Bartolo's father) and young Bartolo on the ferry dock, the net mender on the
// beach, young Pepe fishing off the pier, young Marina on the dry shore, the boat builder by his shed, and Elio's dad on the shore.
// The main path (LAKET.PSTEPS): the ferryman tells what happened (irregular preterites, the 3rd person) and asks how YOU came
// («Vine a pie»); three people of then each tell a piece and ask you one thing («No, no estuve», «No fui», «Dije "¡Hola!"»); the
// ferryman sends you over the dry sandbar; the frogs' grotto (lake_past_dungeon.js); the Frog King (lake_time_boss.js); the echo;
// report to Noa.
// Side quests (QUESTS.LIST): «The waiting bench» (cross-time: it stands by the beach today and tomorrow), «Young Marina's shells»,
// «Young Bartolo's oar».
const LK_PAST = (() => {
  if (typeof TIME === 'undefined' || typeof LAKET === 'undefined' || !LAKET) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = LAKET, T = () => LPTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('past');
  const wait = s => STORY.wait(s);
  const DECK = 0.55;

  // ------------------------------------------------------------ where things are (checked with LAKET._.t.probe in every world)
  const AT = {
    ferryman: { x: -188.8, z: -149.6, yaw: -2.2, y: DECK }, bartolo: { x: -185.6, z: -154.6, yaw: -1.4, y: DECK },
    mender: { x: -159.0, z: -145.6, yaw: -1.2 }, pepe: { x: -172.0, z: -151.0, yaw: 0, y: DECK },
    marina: { x: -160.6, z: -166.0, yaw: -1.9 }, builder: { x: -155.8, z: -161.0, yaw: -1.0 }, dad: { x: -160.6, z: -148.6, yaw: -1.31 },
  };
  const BENCH = { x: -158.8, z: -158.2, yaw: -Math.PI / 2 };       // by the water, looking west to the island (today, tomorrow too)
  const PLANKS = { x: -152.0, z: -160.0 };                         // the planks, by the boat builder's shed
  const SHELLS = [{ x: -162.8, z: -164.4 }, { x: -163.2, z: -168.4 }, { x: -161.8, z: -171.2 }];
  const OAR = { x: -163.8, z: -151.4, spot: { x: -163.8, z: -152.2 } };   // under the main pier, by its south edge
  const HUT = { x: -159.8, z: -135.6 };
  const HERON = { x: -190.4, z: -147.4 };
  const SPOTS = { heron: { x: -191.0, z: -145.6 }, tadpoles: { x: -196.2, z: -142.2 }, prints: { x: -187.6, z: -147.9 }, arch: { x: -201.8, z: -141.8 }, hut: { x: -157.8, z: -136.8 },
    post: { x: -181.6, z: -153.0 }, bucket: { x: -175.0, z: -150.9 }, basket: { x: -163.4, z: -163.8 }, tar: { x: -151.8, z: -162.2 }, paint: { x: -190.2, z: -154.4 }, pole: { x: -184.6, z: -148.8 }, frost: { x: -177.0, z: -152.6 } };
  const FERRY = { x: -193.9, z: -152 };

  // ------------------------------------------------------------ the people of then (TIME's person kit; their Talk runs below)
  const C = () => T().CAST;
  const LOOK = {
    ferryman: { skin: '#c98e62', hair: '#3a2b26', dress: '#3f5f7a', vest: '#d9d2c0', hat: 'cap', hatColor: '#e8e2d6', stache: true, hair2: '#3a2b26', h: 1.04 },
    bartolo: { kid: true, skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#5a86b8', hat: 'cap', hatColor: '#e8e2d6', h: 0.74 },
    mender: { skin: '#a8714a', hair: '#4a2f27', hairdo: 'bun', dress: '#b8563c', apron: '#e8e2d6', hat: 'scarf', hatColor: '#3f6fb5', shawl: '#7a5a3a' },
    pepe: { skin: '#f5cda2', hair: '#6b4a2e', hairdo: 'short', dress: '#e6b84a', vest: '#3f5f7a', hat: 'straw', h: 0.98 },
    marina: { kid: true, skin: '#a8714a', hair: '#3a2b26', hairdo: 'braids', dress: '#2f8f8a', apron: '#f2c94c', h: 0.7 },
    builder: { skin: '#8a5a3c', hair: '#2e2420', hairdo: 'short', dress: '#8a5f3e', apron: '#c9a66b', hat: 'cap', hatColor: '#2f6f6a', stache: true, hair2: '#2e2420', h: 1.05 },
    dad: { skin: '#e6b48c', hair: '#5a3a26', hairdo: 'short', dress: '#5a5a66', shawl: '#c9443a', h: 1.06 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('past', id);

  // ------------------------------------------------------------ the dressing: one merged mesh (and its ink hull) per group
  let built = null;
  const kit = () => PAST.API.Kit();
  function ferryMesh(k, o = {}) {
    const KG = PAST.API.KG, x = FERRY.x, z = FERRY.z, y = -0.4, hull = o.hull || '#3f6fb5', top = o.top || '#f4efe4', deck = o.deck || '#c9a170';
    k.box(x, y + 0.05, z, 6.4, 0.55, 3.2, hull).box(x, y + 0.36, z, 6.2, 0.08, 3.0, deck, { ink: 0.006 });
    for (const s of [-1, 1]) k.box(x, y + 0.62, z + s * 1.5, 6.2, 0.1, 0.1, top, { ink: 0.006 });
    for (const s of [-1, 1]) for (let i = -2; i <= 2; i++) k.box(x + i * 1.45, y + 0.5, z + s * 1.5, 0.08, 0.3, 0.08, top, { ink: 0 });
    k.box(x + 2.6, y + 0.05, z, 0.3, 0.58, 3.25, top, { ink: 0.006 }).box(x - 2.6, y + 0.05, z, 0.3, 0.58, 3.25, top, { ink: 0.006 });
    k.rod([x - 2.2, y + 0.4, z - 1.1], [x - 2.2, y + 2.0, z - 1.1], 0.06, '#8a5f3e', 0.008).add(KG.cyl, x - 2.2, y + 2.05, z - 1.1, 0.14, 0.2, 0.14, '#d9a03a', { ink: 0.006 });
  }
  function hutMesh(k) {
    const KG = PAST.API.KG, x = HUT.x, z = HUT.z, y = gy(x, z);
    k.box(x, y + 0.8, z, 2.6, 1.6, 2.0, '#b09a6a').add(KG.cone4, x, y + 2.05, z, 2.1, 1.0, 1.7, '#c8b070', { ry: Math.PI / 4 }).box(x + 1.31, y + 0.65, z, 0.04, 1.2, 0.7, '#3a2a20', { ink: 0 });
    for (let i = 0; i < 4; i++) k.box(x - 0.6 + i * 0.4, y + 2.2 - i * 0.05, z + 0.2, 0.36, 0.02, 0.9, '#6b8a8a', { ry: 0.3, ink: 0 });
  }
  function heronMesh(k) {
    const KG = PAST.API.KG, x = HERON.x, z = HERON.z, y = -0.95;
    for (const s of [-0.08, 0.08]) k.rod([x + s, y, z], [x + s, y + 0.75, z], 0.02, '#c9a050', 0);
    k.add(KG.sphere, x, y + 0.95, z, 0.22, 0.24, 0.38, '#a9b3bf', { rx: 0.3 }).rod([x, y + 1.05, z + 0.25], [x, y + 1.45, z + 0.32], 0.05, '#a9b3bf', 0.006)
      .add(KG.sphere, x, y + 1.5, z + 0.36, 0.09, 0.08, 0.11, '#c9d2dc').add(KG.cone, x, y + 1.49, z + 0.53, 0.025, 0.25, 0.025, '#e0b040', { rx: Math.PI / 2, ink: 0 });
  }
  function props(k) {
    const KG = PAST.API.KG;
    ferryMesh(k); hutMesh(k); heronMesh(k);
    // the mooring post at the end of the pier, the ferryman's pole leaning on it, frost on the boards
    k.add(KG.cyl, -182.4, DECK + 0.45, -153.4, 0.16, 1.0, 0.16, '#6b4a2e').rod([-184.4, DECK, -148.4], [-184.9, DECK + 2.6, -149.0], 0.04, '#a07a4a', 0.006);
    for (let i = 0; i < 5; i++) k.box(-178.5 + i * 0.7, DECK + 0.012, -152.6 + (i % 2) * 0.4, 0.5, 0.01, 0.3, '#eef4f8', { ry: i, ink: 0 });
    // Pepe's bucket, Marina's shell house and basket, the tar pot by the shed
    k.add(KG.cyl, -175.0, DECK + 0.18, -150.9, 0.2, 0.36, 0.2, '#8a8f99').add(KG.sphere, -175.0, DECK + 0.34, -150.9, 0.17, 0.05, 0.17, '#cfd8e0', { ink: 0 });
    { const x = -161.6, z = -166.8, y = gy(x, z); for (let i = 0; i < 9; i++) k.add(KG.half, x + (i % 3) * 0.16 - 0.16, y + Math.floor(i / 3) * 0.1, z + ((i * 7) % 3) * 0.12, 0.09, 0.07, 0.11, i % 2 ? '#f4d9c6' : '#fff4e8', { ink: 0.004 }); }
    { const x = SPOTS.basket.x - 0.8, z = SPOTS.basket.z - 0.6, y = gy(x, z); k.add(KG.cyl, x, y + 0.12, z, 0.24, 0.24, 0.24, '#b08a52', { rz: 1.3 }); }
    { const x = -151.2, z = -162.8, y = gy(x, z); k.add(KG.cyl, x, y + 0.25, z, 0.28, 0.5, 0.28, '#2b2622').add(KG.sphere, x, y + 0.5, z, 0.25, 0.04, 0.25, '#111014', { ink: 0 }); }
    // the planks for the bench, by the shed
    { const y = gy(PLANKS.x, PLANKS.z); for (let i = 0; i < 4; i++) k.box(PLANKS.x, y + 0.08 + i * 0.1, PLANKS.z + (i % 2) * 0.05, 2.2, 0.08, 0.32, '#c79d6d', { ry: 0.2 + i * 0.03 }); }
    // footprints out along the sandbar, and the tadpoles' puddle near the island
    for (let i = 0; i < 9; i++) { const t = 0.12 + i * 0.075, x = M.BAR.a.x + (M.BAR.b.x - M.BAR.a.x) * t + (i % 2 ? 0.25 : -0.25), z = M.BAR.a.z + (M.BAR.b.z - M.BAR.a.z) * t; k.add(KG.sphere, x, 0.5 - t * 0.08 + 0.01, z, 0.08, 0.01, 0.13, '#9a845c', { ry: -0.9, ink: 0 }); }
    k.add(KG.sphere, -196.2, 0.44, -142.6, 0.8, 0.02, 0.5, '#6fa0b8', { ry: 0.6, ink: 0 });
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, g = new THREE.Group(); g.name = 'lake-past-props'; const k = kit(); props(k); k.build(g); g.visible = false; scene.add(g);
    built = { props: g, solids: [] };
    const add = (x, z, r) => built.solids.push({ x: A.OFF, z: A.OFF, _x: x, _z: z, r, time: true });
    add(HUT.x, HUT.z, 1.5); add(-182.4, -153.4, 0.25); add(-151.2, -162.8, 0.35); add(PLANKS.x, PLANKS.z, 0.9);
    WORLD.extra.push(...built.solids);
    return built;
  }
  const solidsOn = on => { if (built) built.solids.forEach(c => { c.x = on ? c._x : A.OFF; c.z = on ? c._z : A.OFF; }); };
  function show(on) { const B = build(); B.props.visible = on; solidsOn(on); shellGlints(on, 0); }

  // ------------------------------------------------------------ talking to the people of then (the main path first; side quests come
  // through STORY.talkHooks below, as a little menu)
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const asked = id => !!(st().asked && st().asked[id]);
  const askedN = () => ['mender', 'pepe', 'marina'].filter(asked).length;
  const freed = () => typeof CH4 !== 'undefined' && CH4.got('lake', 'past');
  function talk(id) {
    const s = st();
    switch (id) {
      case 'ferryman': return !s.met ? ferrymanScene() : askedN() >= 3 && !s.sent ? sendScene() : say1('ferryman', freed() ? 'ferryman.after' : s.sent ? 'ferryman.again' : 'ferryman.son');
      case 'bartolo': return say1('bartolo', freed() ? 'bartolo.after' : 'bartolo.hello');
      case 'mender': return !asked('mender') ? askScene('mender') : say1('mender', freed() ? 'mender.after' : 'mender.hello');
      case 'pepe': return !asked('pepe') ? askScene('pepe') : say1('pepe', freed() ? 'pepe.after' : 'pepe.hello');
      case 'marina': return !asked('marina') ? askScene('marina') : say1('marina', s.shellsDone ? 'marina.after' : 'marina.hello');
      case 'builder': return say1('builder', TIME.flag('past', 'lkBench') ? 'builder.done' : 'builder.hello');
      case 'dad': { const k = freed() ? 'dad.after' : ['dad.1', 'dad.2', 'dad.3'][(s.dadN = ((s.dadN || 0) + 1) % 3)]; return say1('dad', k); }
      default: return null;
    }
  }
  // the main path, 1: the ferryman tells what happened (3rd person), then asks how you came (1st person)
  async function ferrymanScene() {
    const s = st(), F = () => who('ferryman'); if (!F()) return;
    if (!s.demo) {
      M.lock(true);
      try { M.frame2(F()); await wait(0.4); await M.say(F(), ln('ferryman.hello')); await M.demo(F(), T().DEMO['d.ferry'], T().MARKS['d.ferry']); } finally { M.lock(false); }
      await M.card(T().CARDS.irr); s.demo = true; G().save();
    }
    M.lock(true); try { M.frame2(F()); await M.demo(F(), T().DEMO['q.ferry'], T().MARKS['q.ferry']); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.came, { tips: T().TIPS });
    if (!r) { M.think('{ferryman} is still waiting: how did you come to the lake? (Talk to him again.)', 5); return; }
    TIME.grade('lk.came', r.letter);
    M.lock(true); try { M.frame2(F()); await M.say(F(), ln('ferryman.ask')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('Three people of then saw the boy: the net mender on the beach, young Pepe on the pier, little Marina on the dry shore.', 6);
  }
  // the main path, 2: each of three people tells a piece, then asks you one thing
  const ASK = { mender: ['d.mender', 'q.mender', 'here', 'mender.hello'], pepe: ['d.pepe', 'q.pepe', 'went', 'pepe.hello'], marina: ['d.marina', 'q.marina', 'said', 'marina.hello'] };
  async function askScene(id) {
    const s = st(), P = () => who(id), [dk, qk, tk, hk] = ASK[id]; if (!P()) return;
    if (!s.met) return say1(id, hk);
    M.lock(true);
    try { M.frame2(P()); await wait(0.3); if (!(s.heard && s.heard[id])) { await M.say(P(), ln(hk)); await M.demo(P(), T().DEMO[dk], T().MARKS[dk]); (s.heard || (s.heard = {}))[id] = true; G().save(); } await M.demo(P(), T().DEMO[qk], T().MARKS[qk]); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS[tk], { tips: T().TIPS });
    if (!r) { M.think('Still waiting for your answer. (Talk to them again.)', 4); return; }
    TIME.grade('lk.ask.' + id, r.letter);
    (s.asked || (s.asked = {}))[id] = r.letter; G().save();
    snd('review');
    if (askedN() >= 3) M.think('That’s all three. Back to {ferryman}, at the ferry dock.', 5);
    else M.think(`${askedN()} of 3. Who else saw the boy?`, 3.5);
  }
  async function sendScene() {
    const s = st(), F = who('ferryman'); if (!F) return;
    M.lock(true); try { M.frame2(F); await M.say(F, ln('ferryman.go')); s.sent = true; G().save(); } finally { M.lock(false); }
    M.think('The sandbar starts at the end of the main pier. The little island, and its grotto, are at the other end.', 5.5);
  }

  // ------------------------------------------------------------ side quest: «The waiting bench» (the Past changes today and tomorrow)
  async function benchScene() {
    const s = st(), B = who('builder'); if (!B) return;
    M.lock(true);
    try { M.frame2(B); await wait(0.3); await M.demo(B, T().DEMO['d.bench'], T().MARKS['d.bench']); await M.say(B, ln('builder.ask')); s.benchAsked = true; G().save(); } finally { M.lock(false); }
    M.think('The planks are by the shed. Tell {mimo} what it did with them, as a memory.', 5);
  }
  async function planksTask() {
    const s = st();
    if (!s.planks) {
      if (!s.memCard) { s.memCard = true; await M.card(T().CARDS.mimo); }
      const r = await M.ask(T().MEM.planks, { icon: 'push', tips: T().TIPS }); if (!r) return;
      TIME.grade('lk.mem.planks', r.letter);
      const g = G(), sim = g.sim, y = gy(PLANKS.x, PLANKS.z);
      M.lock(true);
      try {
        M.shot(V(PLANKS.x - 3.6, y + 2.6, PLANKS.z + 3.4), V((PLANKS.x + BENCH.x) / 2, y + 0.6, (PLANKS.z + BENCH.z) / 2));
        sim.mimoGo({ x: PLANKS.x - 0.8, z: PLANKS.z + 0.6 }, PLANKS); await wait(0.9); snd('wood');
        sim.mimoGo({ x: BENCH.x + 0.9, z: BENCH.z + 0.4 }, BENCH); await wait(1.2); snd('land', 6);
        g.w3d.fx.puff(BENCH.x, gy(BENCH.x, BENCH.z) + 0.3, BENCH.z, 8, 0.2, '#d8cdb6');
        s.planks = true; G().save(); await wait(0.4); sim.mimoGo(null, null);
      } finally { M.lock(false); }
    }
    const B = () => who('builder'); if (!B()) return;
    M.lock(true); try { M.frame2(B()); await M.demo(B(), T().DEMO['q.bench'], T().MARKS['q.bench']); } finally { M.lock(false); }
    const r2 = await M.ask(T().TASKS.bench, { tips: T().TIPS }); if (!r2) { M.think('{builder} is waiting for your answer.', 4); return; }
    TIME.grade('lk.bench', r2.letter);
    M.lock(true);
    try {
      M.frame2(B()); await M.say(B(), ln('builder.carve'));
      snd('wood'); await wait(0.3); snd('wood');
      TIME.flag('past', 'lkBench', true); TIME.refresh(); s.benchDone = true;
      G().w3d.fx.sparkle(BENCH.x, gy(BENCH.x, BENCH.z) + 0.8, BENCH.z, 16, ['#fff3a0', '#ffd7a0']); snd('learned');
      await M.say(B(), ln('builder.done'));
      G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); G().save();
    } finally { M.lock(false); }
    M.think('A bench by the water, built long ago… Does it still stand today?', 5);
  }
  // the bench: being built (long ago, before), built (long ago), old and polished (today), gray (tomorrow)
  function benchMesh(kind) {
    const g = new THREE.Group(), k = kit(), y = gy(BENCH.x, BENCH.z), c = Math.cos(BENCH.yaw), s = Math.sin(BENCH.yaw), at = (lx, lz) => [BENCH.x + lx * c + lz * s, BENCH.z - lx * s + lz * c];
    const wood = kind === 'future' ? '#8d8a92' : kind === 'now' ? '#9a7048' : '#c79d6d', leg = kind === 'future' ? '#76737c' : '#6b4a2e';
    for (const lx of [-0.8, 0.8]) for (const lz of [-0.22, 0.22]) { const [px, pz] = at(lx, lz); k.box(px, y + 0.22, pz, 0.1, 0.44, 0.1, leg, { ry: BENCH.yaw }); }
    if (kind !== 'building') {
      const [sx, sz] = at(0, 0); k.box(sx, y + 0.47, sz, 2.0, 0.08, 0.6, wood, { ry: BENCH.yaw });
      const [bx, bz] = at(0, -0.32); k.box(bx, y + 0.82, bz, 2.0, 0.42, 0.07, wood, { ry: BENCH.yaw });
      for (const lx of [-0.8, 0.8]) { const [px, pz] = at(lx, -0.3); k.box(px, y + 0.62, pz, 0.08, 0.5, 0.08, leg, { ry: BENCH.yaw }); }
      const [tx, tz] = at(0, -0.36); k.box(tx, y + 0.86, tz, 1.1, 0.12, 0.012, kind === 'future' ? '#5e5b66' : '#4a3424', { ry: BENCH.yaw, ink: 0 });
      if (kind === 'now') k.box(sx, y + 0.515, sz, 0.8, 0.006, 0.4, '#b08a5e', { ry: BENCH.yaw, ink: 0 });
    } else { const [tx, tz] = at(0.3, 0.8); k.box(tx, y + 0.05, tz, 0.9, 0.1, 0.3, '#c79d6d', { ry: BENCH.yaw + 0.4 }); }
    k.build(g); g.name = 'lake-bench-' + kind;
    return { obj: g, solids: [{ x: at(-0.5, 0)[0], z: at(-0.5, 0)[1], r: 0.5 }, { x: at(0.5, 0)[0], z: at(0.5, 0)[1], r: 0.5 }] };
  }
  const carving = () => { const l = lang(), N = T().NAMES.carving; return M.plainT(N[l] || N.en); };
  const BENCH_LOOK = { x: BENCH.x + 1.3, z: BENCH.z + 0.2, r: 1.6 };
  TIME.effect('lake.bench', { region: 'lake', when: () => !!TIME.flag('past', 'lkBench'),
    before: { past: () => benchMesh('building') },
    show: { past: () => benchMesh('past'), now: () => benchMesh('now'), future: () => benchMesh('future') },
    act: { past: Object.assign({ label: 'Look', run: async () => M.think(`The new bench, smelling of fresh wood. Carved in its back: «${carving()}».`, 5) }, BENCH_LOOK),
      now: Object.assign({ label: 'Look', run: async () => { M.think(`An old bench by the water, polished smooth by years of sitting. Carved in its back: «${carving()}». A boat builder made it long ago, for a man who waited every evening.`, 7.5); const n = M.st('now'); if (!n.bench) { n.bench = true; G().save(); } } }, BENCH_LOOK),
      future: Object.assign({ label: 'Look', run: async () => M.think(`The same bench, gray now, but still standing. «${carving()}». Someone still waits here, it seems.`, 6) }, BENCH_LOOK) } });
  TIME.spot('lake.planks', { region: 'lake', world: 'past', x: PLANKS.x - 1.3, z: PLANKS.z + 0.5, r: 1.7, label: () => (st().planks ? 'Talk to the builder' : `Tell ${M.mimoName()}`),
    when: () => !!st().benchAsked && !TIME.flag('past', 'lkBench'), run: () => planksTask() });

  // ------------------------------------------------------------ side quest: «Young Marina's shells» (three on the dry mud; how many)
  const shellsN = () => (st().shells || []).filter(Boolean).length;
  async function shellsScene() {
    const s = st(), K = who('marina'); if (!K) return;
    M.lock(true); try { M.frame2(K); await wait(0.3); await M.demo(K, T().DEMO['d.shells'], T().MARKS['d.shells']); s.shellsAsked = true; s.shells = s.shells || [false, false, false]; G().save(); } finally { M.lock(false); }
    M.think('Three shells somewhere on the dry mud by the shore. Look for something pink glinting.', 5);
  }
  async function shellPick(i) {
    const s = st(), m = SHELLS[i]; s.shells = s.shells || [false, false, false]; if (s.shells[i]) return;
    s.shells[i] = true; snd('pip'); G().w3d.fx.sparkle(m.x, gy(m.x, m.z) + 0.3, m.z, 10, ['#ffd1dc', '#fff3c8']);
    UI.toast(`A shell! (${shellsN()}/3)`); G().save();
    if (shellsN() >= 3) M.think('All three! Back to {marina}.', 4);
  }
  SHELLS.forEach((m, i) => TIME.spot('lake.shell' + i, { region: 'lake', world: 'past', x: m.x, z: m.z, r: 1.5, label: 'Pick up',
    when: () => !!st().shellsAsked && !(st().shells || [])[i], run: async () => shellPick(i) }));
  async function shellsEnd() {
    const s = st(), K = () => who('marina'); if (!K()) return;
    M.lock(true); try { M.frame2(K()); await M.demo(K(), T().DEMO['q.shells'], T().MARKS['q.shells']); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.shells, { tips: T().TIPS }); if (!r) return;
    TIME.grade('lk.shells', r.letter);
    M.lock(true); try { M.frame2(K()); await M.say(K(), ln('marina.after')); s.shellsDone = true; G().state.coins = (G().state.coins || 0) + 4; UI.toast('+4 coins'); G().save(); } finally { M.lock(false); }
  }
  let shellMesh = null;
  function shellGlints(on, t) {
    if (!shellMesh) { if (!on) return; shellMesh = SHELLS.map(m => { const o = TK.part(TK.G.sphere, '#ffc9d6', [m.x, gy(m.x, m.z) + 0.08, m.z], [0.12, 0.06, 0.1], { ink: 0.006 }); o.visible = false; G().w3d.scene.add(o); return o; }); }
    const s = st();
    shellMesh.forEach((o, i) => { o.visible = on && !!s.shellsAsked && !(s.shells || [])[i]; if (o.visible) o.scale.setScalar(1 + 0.18 * Math.sin(t * 5 + i)); });
  }

  // ------------------------------------------------------------ side quest: «Young Bartolo's oar» (a memory, then where it went)
  async function oarScene() {
    const s = st(), Bt = who('bartolo'); if (!Bt) return;
    M.lock(true); try { M.frame2(Bt); await wait(0.3); await M.say(Bt, ln('bartolo.oarLost')); s.oarAsked = true; G().save(); } finally { M.lock(false); }
    M.think('It fell off the main pier… Stand on the pier, and tell {mimo} what it did, as a memory.', 5);
  }
  async function oarTask() {
    const s = st();
    if (!s.oarGot) {
      if (!s.memCard) { s.memCard = true; await M.card(T().CARDS.mimo); }
      const r = await M.ask(T().MEM.oar, { icon: 'swim', tips: T().TIPS }); if (!r) return;
      TIME.grade('lk.mem.oar', r.letter);
      const g = G(), sim = g.sim, Mm = sim.mimo;
      M.lock(true);
      try {
        M.shot(V(OAR.x + 3.2, 2.6, OAR.z + 3.6), V(OAR.x, -0.4, OAR.z));
        sim.mimoGo({ x: OAR.spot.x + 0.6, z: OAR.spot.z }, OAR); await wait(0.6);
        Mm.hop = { t: 0 }; snd('jump'); await wait(0.3); g.w3d.fx.puff(OAR.x, -0.9, OAR.z, 12, 0.3, '#e9f6f3'); snd('poof'); await wait(1.0);
        g.w3d.fx.sparkle(OAR.x, -0.4, OAR.z, 12, ['#fff3c8', '#9ff5e8']); snd('learned');
        s.oarGot = true; G().save(); await wait(0.5); sim.mimoGo(null, null);
      } finally { M.lock(false); }
    }
    const Bt = () => who('bartolo'); if (!Bt()) return;
    M.lock(true); try { M.frame2(Bt()); await M.demo(Bt(), T().DEMO['q.oar'], T().MARKS['q.oar']); } finally { M.lock(false); }
    const r2 = await M.ask(T().TASKS.oarWhere, { tips: T().TIPS }); if (!r2) { M.think('{bartolo} is waiting: where did it go?', 4); return; }
    TIME.grade('lk.oar', r2.letter);
    M.lock(true); try { M.frame2(Bt()); await M.say(Bt(), ln('bartolo.oarThanks')); s.oarDone = true; G().state.coins = (G().state.coins || 0) + 4; UI.toast('+4 coins'); G().save(); } finally { M.lock(false); }
  }
  TIME.spot('lake.oar', { region: 'lake', world: 'past', x: OAR.spot.x, z: OAR.spot.z, r: 1.6, label: () => (st().oarGot ? 'Give it back' : `Tell ${M.mimoName()}`),
    when: () => !!st().oarAsked && !st().oarDone, run: () => (st().oarGot ? oarTask() : oarTask()) });

  // ------------------------------------------------------------ things to look at (each word said aloud and glossed)
  const LOOKS_AT = ['heron', 'tadpoles', 'prints', 'arch', 'hut', 'post', 'bucket', 'basket', 'tar', 'paint', 'pole', 'frost'];
  LOOKS_AT.forEach(k => TIME.spot('lake.look.' + k, { region: 'lake', world: 'past', x: SPOTS[k].x, z: SPOTS[k].z, r: 1.5, label: 'Look', run: async () => M.look(T().LOOKS['look.' + k]) }));

  // ------------------------------------------------------------ the Talk menus: side quests (the main path's scenes play straight off a Talk)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'past' || TIME.regionNow() !== 'lake') return null;
    const s = st();
    if (it.who === 'past:builder' && s.met && !TIME.flag('past', 'lkBench')) return [{ label: 'The bench', sub: '◆ side quest', run: () => (s.benchAsked ? planksTask() : benchScene()) }];
    if (it.who === 'past:marina' && asked('marina') && !s.shellsDone) return [{ label: 'The shells', sub: '◆ side quest', run: () => (!s.shellsAsked ? shellsScene() : shellsN() >= 3 ? shellsEnd() : (M.think(`${shellsN()} of 3 shells so far. They’re on the dry mud by the shore.`, 4), null)) }];
    if (it.who === 'past:bartolo' && s.met && !s.oarDone) return [{ label: 'Your oar', sub: '◆ side quest', run: () => (s.oarAsked ? oarTask() : oarScene()) }];
    return null;
  });
  // today: Vicente by his slipway knows who built the bench (his Talk has no id: he's matched by where he stands)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || !TIME.open('lake') || !TIME.flag('past', 'lkBench') || it.label !== 'Talk' || (it.who && it.who !== 'vicente')) return null;
    const lk = G().lake, V0 = lk && lk.people && lk.people.find(p => p.id === 'vicente'); if (!V0 || Math.hypot(it.x - V0.x, it.z - V0.z) > 0.8) return null;
    return [{ label: 'The old bench', run: async () => { M.lock(true); try { V0.talking = true; await M.say({ id: 'vicente', name: 'Vicente', x: V0.x, y: V0.y, z: V0.z, top: 1.6 }, T().LINES['vicente.bench']); } finally { V0.talking = false; M.lock(false); } } }];
  });

  // ------------------------------------------------------------ E, the compass, every frame
  function interactables() {
    const s = st(), out = [];
    out.push({ x: M.DOOR.x, z: M.DOOR.z, r: 1.9, label: s.sent || freed() ? 'Go in' : 'Look', run: async () => {
      if (!(s.sent || freed())) { M.think('The grotto’s mouth. Frogs croak inside… The ferryman at the dock knows something about it.', 4.5); return; }
      if (typeof LK_PGROT !== 'undefined' && LK_PGROT) await LK_PGROT.enter();
    } });
    return out;
  }
  function nextId() { const s = st(); return !s.met ? 'ferryman' : askedN() < 3 ? 'asked' : !s.sent ? 'ferryman' : 'door'; }
  const HINTS = { ferryman: '{mimo} points at the ferryman, out on the ferry dock.', door: '{mimo} looks out along the sandbar, at the little island’s grotto.',
    mender: '{mimo} points at the woman mending nets on the beach.', pepe: '{mimo} points at the young fisherman on the pier.', marina: '{mimo} points at the little girl on the dry shore.',
    builder: '{mimo} points at the boat builder by his shed.', bartolo: '{mimo} points at the ferryman’s boy.', planks: '{mimo} sniffs the planks by the shed.', shell: '{mimo} sniffs the mud. Something pink!', oar: '{mimo} peers over the edge of the pier.' };
  function target(id) {
    if (id === 'door') return (typeof LK_PGROT !== 'undefined' && LK_PGROT && LK_PGROT.inside && LK_PGROT.target()) || { x: M.DOOR.x, z: M.DOOR.z, hint: HINTS.door };
    if (id === 'asked') { const n = ['mender', 'pepe', 'marina'].find(k => !asked(k)); return n ? target(n) : target('ferryman'); }
    if (id === 'planks') return { x: PLANKS.x, z: PLANKS.z, hint: HINTS.planks };
    if (id === 'oar') return { x: OAR.spot.x, z: OAR.spot.z, hint: HINTS.oar };
    if (id === 'shell') { const i = (st().shells || []).findIndex(f => !f); const m = SHELLS[i < 0 ? 0 : i]; return { x: m.x, z: m.z, hint: HINTS.shell }; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || '{mimo} points.' };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('lk_past') ? 'lk_past' : 'past');
  // after the Frog King: the grotto calls this (the frogs go quiet; the dad on the shore stops and turns)
  function freedScene() { TIME.flag('past', 'lkFree', true); TIME.refresh(); G().save(); }

  // ------------------------------------------------------------ the side quests (QUESTS.LIST: they start as the story reaches them)
  if (typeof QUESTS !== 'undefined') {
    const pS = s => M.sp(s), nS = s => M.sn(s);
    const pastAt = id => () => M.via('past', () => target(id));
    if (!QUESTS.LIST.some(q => q.id === 'lk.bench')) QUESTS.LIST.push({ id: 'lk.bench', kind: 'side',
      get title() { return M.fillEn('The waiting bench'); }, get giver() { return M.fillEn('{builder}, the boat builder, by his shed (the Mirror Lake, long ago)'); },
      started: s => !!pS(s).met,
      steps: [
        { get text() { return M.fillEn('In the Past: help {builder} build a bench by the water'); },
          get why() { return M.fillEn(`A man waits on the shore every evening, standing up. {builder} is building him a bench. Tell {mimo} as a memory what it did with the planks (${M.sx('mem')}), then tell {builder} what you did.`); },
          done: s => !!(s.worlds && s.worlds.flags && s.worlds.flags.past && s.worlds.flags.past.lkBench), target: () => M.via('past', () => (pS(G().state).benchAsked ? target('planks') : target('builder'))), hint: HINTS.builder },
        { text: 'Today: look at the old bench by Remanso’s beach', why: 'A bench by the water, built long ago… Does it still stand today?',
          done: s => !!nS(s).bench, target: () => M.via('now', () => ({ x: BENCH.x, z: BENCH.z, hint: '{mimo} points at an old bench by the water.' })), hint: '{mimo} points at an old bench by the water.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'lk.shells')) QUESTS.LIST.push({ id: 'lk.shells', kind: 'side',
      get title() { return M.fillEn('{marina}’s shells'); }, get giver() { return M.fillEn('{marina}, on the dry shore (the Mirror Lake, long ago)'); },
      started: s => !!(pS(s).asked && pS(s).asked.marina),
      steps: [
        { get text() { return M.fillEn('In the Past: ask {marina} what’s wrong'); }, why: 'Little Marina, who will be the village head one day, looks upset.', done: s => !!pS(s).shellsAsked, target: pastAt('marina'), hint: HINTS.marina },
        { text: 'Find the three shells on the dry mud ({n}/3)', n: s => (pS(s).shells || []).filter(Boolean).length, why: 'Look for something pink glinting by the shore.',
          done: s => (pS(s).shells || []).filter(Boolean).length >= 3, target: pastAt('shell'), hint: HINTS.shell },
        { get text() { return M.fillEn('Tell {marina} about the shells'); }, get why() { return M.fillEn(`About yourself, in the past: ${M.sx('came')}…`); }, done: s => !!pS(s).shellsDone, target: pastAt('marina'), hint: HINTS.marina },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'lk.oar')) QUESTS.LIST.push({ id: 'lk.oar', kind: 'side',
      get title() { return M.fillEn('{bartolo}’s oar'); }, get giver() { return M.fillEn('{bartolo}, the ferryman’s boy (the Mirror Lake, long ago)'); },
      started: s => !!pS(s).met,
      steps: [
        { get text() { return M.fillEn('In the Past: talk to {bartolo} on the ferry dock'); }, why: 'The ferryman’s boy looks like he lost something.', done: s => !!pS(s).oarAsked, target: pastAt('bartolo'), hint: HINTS.bartolo },
        { get text() { return M.fillEn('Get the oar back: tell {mimo}, then tell {bartolo} where it went'); }, why: 'It fell off the main pier. In the Past, {mimo} only moves in memories.',
          done: s => !!pS(s).oarDone, target: () => M.via('past', () => (pS(G().state).oarGot ? target('bartolo') : target('oar'))), hint: HINTS.oar },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks (TIME calls them: time.js "TIME dresses it")
  Object.assign(M.DRESS.past, {
    people: PEOPLE,
    on(api) { show(true); M.landOn('past'); M.hideToday(api, { boats: false }); M.parkToday(true); M.liftPeople('past', PEOPLE.map(p => ({ id: p.id, at: p.at }))); },
    off() { show(false); M.landOn(null); M.parkToday(false); },
    entered() { show(true); M.landOn('past'); M.liftPeople('past', PEOPLE.map(p => ({ id: p.id, at: p.at }))); },
    late: (api, dt) => { M.showLake(dt); if (typeof LK_PGROT !== 'undefined' && LK_PGROT && LK_PGROT.inside) LK_PGROT.late(dt); },
    update(api, dt, t) { shellGlints(true, t); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, BENCH, PLANKS, SHELLS, OAR, PEOPLE, who, build, show, target: id => target(id), song: () => song(), init: () => {}, changed: () => {}, freedScene, askedN,
    _: { talk: id => talk(id), ferrymanScene, askScene, sendScene, benchScene, planksTask, shellsScene, shellsEnd, oarScene, oarTask, get built() { return built; } } };
})();
