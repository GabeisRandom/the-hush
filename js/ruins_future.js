'use strict';
// The Sunken Ruins, tomorrow (DESIGN.md 20.1b "next, the Sunken Ruins"; game/TIME.md "The Sunken Ruins (T4b)"): the canyon if nobody
// speaks up. TIME dresses it (time_ruins.js RUINT.DRESS.future); the sea over the canyon floor and the boardwalks over it are TIME.land's
// (time_ruins_land.js: the flood and its decks). Today's people, «El Viento Sur», the barrow and Gaspar's map are set aside
// (RUINT.hideToday); today's camp lies drowned under the water. Here instead: the archaeologists live on the boardwalks, older, frozen
// gray, each on a «when?» or a fear (TIME's look 'future' with k(): the color comes back as they wake): the stilt camp (Nadia's stove,
// Darío's hammock, Gaspar's tide table, a cistern and its pump), Tula's little museum on the landing, Salomé's diving gear in the old
// town, the temple's door half under the water.
// The main path (RUINT.FSTEPS): Tula, grown up, the only one still talking, answers every «when?» («Cuando baje la marea, iremos al
//   templo») and the card → Fermín and Nadia, frozen on a «when?»: tell them when → Tula answers a fear out loud («No creo que se
//   hunda») and the second card → Gaspar and Elvira, frozen on a fear: doubt it → the temple's door at low tide → the sunken temple
//   (ruins_future_dungeon.js) → the Gray Moray (ruins_time_boss.js) → the echo → an island rises, green, with a spring → Noa.
// Side quests (QUESTS.LIST): «The Wall of Days» (cross-time: doubt Salomé's fear; she gives you a warning for today, word for word;
//   today's Salomé makes plaster casts of every panel; tomorrow they stand dry in a case), «Darío's tales» (doubt the tall ones,
//   believe the true one), «Nadia's garden» (when will she plant? and once the island is up, when will they grow?).
const RU_FUT = (() => {
  if (typeof TIME === 'undefined' || typeof RUINT === 'undefined' || !RUINT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = RUINT, T = () => RUFTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('future');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF, DY = M.DECK_Y, WY = M.WATER_Y;

  // ------------------------------------------------------------ where things are (all on the boardwalks: RUINT.DECKS)
  const AT = {
    tula: { x: 139.8, z: 38.6, yaw: 0.4 }, fermin: { x: 144.4, z: -17.0, yaw: Math.PI }, nadia: { x: 142.4, z: 19.6, yaw: -0.6 }, elvira: { x: 146.4, z: 21.4, yaw: 2.8 },
    gaspar: { x: 149.4, z: 23.4, yaw: -1.9 }, dario: { x: 142.8, z: 25.8, yaw: 2.2 }, salome: { x: 127.4, z: 1.4, yaw: Math.PI / 2 },
  };
  const WHENS = M.WHENS, FEARS = M.FEARS, WAKE = M.WAKE, ALL = ['fermin', 'nadia', 'gaspar', 'elvira', 'dario', 'salome'];
  const DOORSPOT = { x: 142.0, z: -19.8 };
  const STOVE = { x: 141.2, z: 18.4 }, HAMMOCK = { x: 145.0, z: 26.7 }, TABLE = { x: 149.8, z: 21.6 }, GAUGE = { x: 150.9, z: 17.3 }, CISTERN = { x: 144.6, z: 17.6 };
  const MUSEUM = { x: 135.0, z: 39.0 }, BUOYP = { x: 141.2, z: 43.6 }, KAYAK = { x: 132.4, z: 40.8 }, GEAR = { x: 129.4, z: 2.8 };
  const CASTS = { now: { x: 145.2, z: 9.2 }, future: { x: 125.8, z: 3.6 } };
  const C = () => T().CAST;
  const LOOK = {
    tula: { skin: '#d9a27a', hair: '#3a2b26', hairdo: 'tails', dress: '#e2574c', vest: '#4c7fd8', hat: 'straw', hatColor: '#e8d9a8', h: 1.0 },
    fermin: { skin: '#b07850', hair: '#f4f0ea', hairdo: 'bald', beard: true, stache: true, hair2: '#f4f0ea', dress: '#c98e4a', vest: '#6b5236', hat: 'flat', hatColor: '#6b5236', prop: 'cane', wide: 1.06, h: 0.94 },
    nadia: { skin: '#a8714a', hair: '#bdb6ae', hairdo: 'bun', dress: '#c96f45', apron: '#e9d9b0', hat: 'scarf', hatColor: '#5fae4f', h: 0.97 },
    elvira: { skin: '#c98e62', hair: '#e8e4dc', hairdo: 'bun', dress: '#4c9a8a', vest: '#f2e3c4', glasses: true, prop: 'cane', h: 0.93 },
    gaspar: { skin: '#e6b48c', hair: '#a8a298', hairdo: 'short', stache: true, hair2: '#a8a298', dress: '#4a4f66', vest: '#c9a24a', glasses: true, h: 1.0 },
    dario: { skin: '#c98e62', hair: '#8a8278', hairdo: 'short', dress: '#f2c94c', vest: '#3f6a8a', hat: 'cap', hatColor: '#e2574c', h: 0.99 },
    salome: { skin: '#8a5a3a', hair: '#5a504a', hairdo: 'braids', dress: '#3f6a8a', vest: '#2b2235', h: 0.98 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('future', id);
  const woke = id => !!(st().woke && st().woke[id]);
  const wokeN = (list = ALL) => list.filter(woke).length;
  const free = () => !!TIME.flag('future', 'ruFree');

  // ------------------------------------------------------------ the color comes back as they wake (0.12 gray … 1 healed)
  function k() { return Math.min(1, 0.12 + 0.5 * wokeN() / ALL.length + (free() ? 0.55 : 0)); }
  // the frozen: each person's own material, gray until woken (uGray 1 → 0 as they wake); Tula keeps her color
  const FROZEN = {};
  function frozenMat(P) {
    const id = P.def.id; if (FROZEN[id]) return FROZEN[id];
    const body = P.body.children[0]; if (!body || !body.material) return null;
    const m = body.material.clone(), u = { uGray: { value: woke(id) ? 0 : 1 } };
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = u.uGray;
      sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.84, l * 0.86, l * 0.92), uGray); }');
    };
    m.customProgramCacheKey = () => 'ruFrozen';
    body.material = m;
    return (FROZEN[id] = { m, u });
  }
  // (TIME's person kit stands them on the canyon floor, under the sea: up onto the boardwalk)
  function dressPeople() {
    const list = TIME.people && TIME.people.all['ruins:future']; if (!list) return;
    for (const P of list) {
      if (Math.abs(P.g.position.y - DY) > 0.001) M.liftOn('future', P.def.id, DY);
      if (P.def.id === 'tula') continue;
      const F = frozenMat(P); if (F && F.tw == null) F.u.uGray.value = woke(P.def.id) ? 0 : 1;
    }
  }

  // ------------------------------------------------------------ the dressing: the stilt camp's things, Tula's museum, Salomé's gear
  let built = null;
  const kit = () => PAST.API.Kit();
  const WOOD = '#8a6040', WOOD_D = '#5a3a24', ROPE = '#c9b48e';
  function props(k0) {
    const KG = PAST.API.KG, y = DY;
    // Nadia's stove under a striped umbrella: a pot, a kettle, jars of spice and garlic on a crate
    k0.box(STOVE.x, y + 0.3, STOVE.z, 0.7, 0.6, 0.5, '#5a5a62', { ink: 0.01 }).add(KG.cyl, STOVE.x, y + 0.72, STOVE.z, 0.24, 0.26, 0.24, '#3a3a40', { ink: 0.006 });
    k0.box(STOVE.x - 0.8, y + 0.25, STOVE.z + 0.2, 0.6, 0.5, 0.5, '#b8955a', { ink: 0.008 });
    for (let i = 0; i < 3; i++) k0.add(KG.cyl, STOVE.x - 0.95 + i * 0.16, y + 0.58, STOVE.z + 0.2, 0.06, 0.14, 0.06, ['#e2b04a', '#f4efe2', '#c96f45'][i], { ink: 0 });
    k0.rod([STOVE.x + 0.5, y, STOVE.z + 0.9], [STOVE.x + 0.5, y + 2.1, STOVE.z + 0.9], 0.04, '#e8e0cf', 0.004);
    k0.add(KG.cone, STOVE.x + 0.5, y + 2.2, STOVE.z + 0.9, 1.4, 0.45, 1.4, '#e2574c', { ink: 0.01 });
    // Darío's hammock between two posts, a blanket in it
    for (const s of [-1, 1]) k0.rod([HAMMOCK.x + s * 1.3, y, HAMMOCK.z], [HAMMOCK.x + s * 1.3, y + 1.4, HAMMOCK.z], 0.06, WOOD_D, 0.006);
    for (let i = 0; i <= 8; i++) { const t = i / 8, x = HAMMOCK.x - 1.2 + t * 2.4, sag = Math.sin(t * Math.PI) * 0.45; k0.box(x, y + 1.05 - sag, HAMMOCK.z, 0.32, 0.04, 0.7, i % 2 ? '#3f6a8a' : '#f2c94c', { ink: 0 }); }
    // Gaspar's table: the tide table under a stone, a measuring tape, a lamp; his striped tide gauge in the water at the deck's edge
    k0.box(TABLE.x, y + 0.72, TABLE.z, 1.4, 0.06, 0.8, '#a87850', { ink: 0.01 });
    for (const [sx, sz] of [[-0.6, -0.32], [0.6, -0.32], [-0.6, 0.32], [0.6, 0.32]]) k0.box(TABLE.x + sx, y + 0.36, TABLE.z + sz, 0.06, 0.72, 0.06, WOOD_D, { ink: 0 });
    k0.box(TABLE.x - 0.1, y + 0.76, TABLE.z, 0.8, 0.01, 0.56, '#f4efe2', { ry: 0.1, ink: 0.002 }).add(KG.sphere, TABLE.x + 0.1, y + 0.8, TABLE.z - 0.1, 0.1, 0.06, 0.08, '#8a8692', { ink: 0 });
    k0.add(KG.cyl, TABLE.x + 0.5, y + 0.79, TABLE.z + 0.2, 0.08, 0.05, 0.08, '#f2c94c', { ink: 0 });
    for (let i = 0; i < 8; i++) k0.box(GAUGE.x, WY - 1.2 + i * 0.4, GAUGE.z, 0.12, 0.4, 0.12, i % 2 ? '#e2574c' : '#f4efe2', { ink: 0.002 });
    // the rain cistern and its hand pump
    k0.add(KG.cyl, CISTERN.x, y + 0.55, CISTERN.z, 0.5, 1.1, 0.5, '#6a7a8a', { ink: 0.012 }).add(KG.torus, CISTERN.x, y + 0.9, CISTERN.z, 0.52, 0.52, 0.06, '#4a5a6a', { rx: Math.PI / 2, ink: 0 });
    k0.box(CISTERN.x + 0.75, y + 0.5, CISTERN.z, 0.14, 1.0, 0.14, '#4a5a6a', { ink: 0.004 }).rod([CISTERN.x + 0.75, y + 1.0, CISTERN.z], [CISTERN.x + 1.15, y + 1.2, CISTERN.z], 0.03, '#4a5a6a', 0);
    // Tula's little museum on the landing: a glass case on legs, finds with labels, her wonky jar in the middle
    k0.box(MUSEUM.x, y + 0.45, MUSEUM.z, 1.6, 0.9, 0.7, '#7a5a3a', { ink: 0.012 }).box(MUSEUM.x, y + 1.1, MUSEUM.z, 1.5, 0.4, 0.6, '#cfe3ea', { ink: 0.006 });
    k0.add(KG.sphere, MUSEUM.x, y + 1.08, MUSEUM.z, 0.16, 0.2, 0.16, '#c96f45', { rz: 0.25, ink: 0.004 }).add(KG.cyl, MUSEUM.x - 0.5, y + 1.0, MUSEUM.z, 0.08, 0.1, 0.08, '#c9a24a', { ink: 0 }).add(KG.box, MUSEUM.x + 0.5, y + 0.98, MUSEUM.z, 0.2, 0.06, 0.14, '#e8e0cf', { ink: 0 });
    for (let i = 0; i < 3; i++) k0.box(MUSEUM.x - 0.5 + i * 0.5, y + 0.92, MUSEUM.z + 0.26, 0.16, 0.06, 0.01, '#f4efe2', { ink: 0 });
    // a life ring on a post, a yellow kayak tied at the landing, a water bottle in it
    k0.rod([BUOYP.x, y, BUOYP.z], [BUOYP.x, y + 1.3, BUOYP.z], 0.06, WOOD_D, 0.006).add(KG.torus, BUOYP.x, y + 1.0, BUOYP.z - 0.12, 0.32, 0.32, 0.12, '#e2574c', { ink: 0.006 });
    k0.add(KG.sphere, KAYAK.x, WY + 0.08, KAYAK.z, 0.45, 0.16, 1.5, '#f2c94c', { ink: 0.01 }).add(KG.cyl, KAYAK.x, WY + 0.22, KAYAK.z + 0.4, 0.06, 0.22, 0.06, '#8fc8e8', { ink: 0 });
    k0.rod([KAYAK.x, WY + 0.15, KAYAK.z - 1.3], [KAYAK.x + 0.8, y + 0.05, KAYAK.z - 1.6], 0.02, ROPE, 0);
    // Salomé's diving gear on a crate: a mask, a snorkel, flippers; a wetsuit drying on a line
    k0.box(GEAR.x, y + 0.25, GEAR.z, 0.7, 0.5, 0.5, '#b8955a', { ink: 0.008 }).add(KG.sphere, GEAR.x - 0.15, y + 0.55, GEAR.z, 0.16, 0.08, 0.1, '#2b2235', { ink: 0 }).rod([GEAR.x + 0.1, y + 0.5, GEAR.z], [GEAR.x + 0.2, y + 0.85, GEAR.z], 0.025, '#f2c94c', 0);
    for (const s of [-1, 1]) k0.box(GEAR.x + 0.2 + s * 0.1, y + 0.51, GEAR.z + 0.12, 0.08, 0.02, 0.36, '#4c7fd8', { ink: 0 });
    for (const s of [-1, 1]) k0.rod([GEAR.x + 1.2 + s * 0.9, y, GEAR.z + 0.6], [GEAR.x + 1.2 + s * 0.9, y + 1.6, GEAR.z + 0.6], 0.04, WOOD_D, 0.004);
    k0.box(GEAR.x + 1.2, y + 1.55, GEAR.z + 0.6, 1.8, 0.02, 0.02, ROPE, { ink: 0 }).box(GEAR.x + 1.2, y + 1.15, GEAR.z + 0.6, 0.5, 0.8, 0.06, '#2b2a33', { ink: 0.004 });
    // mussels and anemones on the stilts by the old town, a heap of driftwood by the Wall
    for (let i = 0; i < 10; i++) k0.add(KG.ball6, 124.6 + i * 1.5, WY - 0.05, -3.75, 0.08, 0.12, 0.05, i % 3 ? '#2b2a3a' : '#e87a8a', { ink: 0 });
    for (let i = 0; i < 6; i++) k0.rod([124.0 + i * 0.3, WY + 0.05, -2.4 + (i % 2) * 0.4], [124.9 + i * 0.25, WY + 0.25, -2.9 + (i % 3) * 0.3], 0.07, '#e8e0cf', 0.004);
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'ru-fut-' + name; const k0 = kit(); fn(k0); k0.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), solids: [] };
    // a jellyfish and a school of little fish under the boardwalks (sprites), and the stove's steam once Nadia is awake
    const jt = TK.canvasTex(64, 64, c => { const g = c.createRadialGradient(32, 26, 2, 32, 26, 26); g.addColorStop(0, 'rgba(255,220,240,0.9)'); g.addColorStop(1, 'rgba(255,200,230,0)'); c.fillStyle = g; c.beginPath(); c.arc(32, 28, 24, Math.PI, 0); c.fill(); c.strokeStyle = 'rgba(255,210,235,0.7)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(16 + i * 8, 30); c.quadraticCurveTo(12 + i * 8, 46, 18 + i * 8, 60); c.stroke(); } });
    const ft = TK.canvasTex(64, 32, c => { c.fillStyle = '#d8e4ec'; for (let i = 0; i < 9; i++) { const x = 6 + (i % 3) * 20 + (i > 2 ? 6 : 0), y = 6 + Math.floor(i / 3) * 9; c.beginPath(); c.ellipse(x, y, 5, 2, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x - 8, y - 2); c.lineTo(x - 8, y + 2); c.fill(); } });
    built.swim = [];
    for (const [x, z, tex, s] of [[136.4, -6.6, jt, 0.8], [131.6, 2.2, jt, 0.6], [139.6, -10.8, ft, 1.3], [143.8, 31.0, ft, 1.1]]) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.75 })); sp.scale.set(s, s * (tex === ft ? 0.5 : 1), 1); sp.position.set(x, WY - 0.35, z); sp.visible = false; sp.name = 'ru-fut-swim'; scene.add(sp); built.swim.push({ sp, x, z, ph: x * 0.3 });
    }
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    add(STOVE.x, STOVE.z, 0.45); add(STOVE.x - 0.8, STOVE.z + 0.2, 0.4); add(TABLE.x, TABLE.z, 0.6); add(CISTERN.x, CISTERN.z, 0.55); add(CISTERN.x + 0.75, CISTERN.z, 0.15);
    add(MUSEUM.x, MUSEUM.z, 0.8); add(BUOYP.x, BUOYP.z, 0.2); add(GEAR.x, GEAR.z, 0.45);
    for (const s of [-1, 1]) add(HAMMOCK.x + s * 1.3, HAMMOCK.z, 0.15);
    WORLD.extra.push(...built.solids);
    return built;
  }
  const solidsOn = on => { if (built) built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); };
  function show(on) {
    const B = build();
    B.props.visible = on; B.swim.forEach(s => { s.sp.visible = on; });
    solidsOn(on);
  }
  let hid = [];
  function late(dt) {
    M.showToday(dt, hid);
    const list = TIME.people && TIME.people.all['ruins:future'];
    if (list) for (const P of list) { if (P.def.id === 'tula' || woke(P.def.id)) continue; P.g.rotation.y = P.api.yaw; P.body.position.y = 0; P.body.rotation.z = 0; }
    for (const F of Object.values(FROZEN)) if (F.tw != null) { F.tw = Math.max(0, F.tw - dt * 0.7); F.u.uGray.value = F.tw; if (F.tw <= 0) F.tw = null; }
    if (built) { const t = G().w3d.time.value; built.swim.forEach(s => { s.sp.position.x = s.x + Math.sin(t * 0.3 + s.ph) * 1.2; s.sp.position.z = s.z + Math.cos(t * 0.25 + s.ph) * 0.8; s.sp.position.y = WY - 0.35 + Math.sin(t * 0.8 + s.ph) * 0.08; }); }
  }

  // ------------------------------------------------------------ talking to the people of tomorrow
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const chats = {};
  const cycle = (id, keys) => { chats[id] = ((chats[id] || 0) + 1) % keys.length; return say1(id, keys[chats[id]]); };
  const done = () => !!(G().state.ch4 && G().state.ch4.echoes && G().state.ch4.echoes['ruins.future']);
  function talk(id) {
    const s = st();
    if (id === 'tula') {
      if (!s.met) return tulaScene();
      if (free()) return cycle('tula', ['tula.free', 'tula.chat1', 'tula.chat2']);
      if (WHENS.every(woke) && !s.doubtCard) return doubtScene();
      if (WAKE.every(woke)) return s.open ? cycle('tula', ['tula.open', 'tula.chat1', 'tula.chat2']) : openScene();
      return cycle('tula', ['tula.again', 'tula.chat1', 'tula.chat2']);
    }
    if (id === 'dario' && !woke('dario')) return darioWake();
    if (!woke(id)) return wakeScene(id);
    if (id === 'salome') return TIME.flag('now', 'ruCasts') && !s.castsSaid ? castsDone() : say1('salome', 'salome.chat');
    return say1(id, id + '.chat');
  }
  // the main path, 1: Tula answers every «when?», the card, her question
  async function tulaScene() {
    const s = st(), P = () => who('tula'); if (!P()) return;
    M.lock(true);
    try { M.frame2(P()); await wait(0.4); await M.say(P(), ln('tula.hello')); await M.demo(P(), T().DEMO['tula.demo'], T().MARKS['tula.demo']); } finally { M.lock(false); }
    await M.card(T().CARDS.when, true);
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln('tula.task')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.tulaQ, { tips: T().TIPS }); if (!r) { M.think('{tula} is waiting: when will you look for the bell?', 4.5); return; }
    TIME.grade('rf.tula', r.letter);
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln('tula.after')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('Gray people on the boardwalks, each frozen on a question. {fermin} is by the temple’s door, {nadia} in the stilt camp.', 6);
  }
  // the main path, 3: Tula answers a fear out loud, the second card
  async function doubtScene() {
    const s = st(), P = () => who('tula'); if (!P()) return;
    M.lock(true);
    try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('tula.doubtHi')); await M.demo(P(), T().DEMO['tula.doubt'], T().MARKS['tula.doubt']); } finally { M.lock(false); }
    await M.card(T().CARDS.doubt, true);
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln('tula.afterDoubt')); s.doubtCard = true; G().save(); } finally { M.lock(false); }
    M.think('{gaspar} and {elvira}, gray in the stilt camp. Doubt their fears out loud.', 5);
  }
  // the main path, 2 and 4: someone frozen on a «when?» or a fear; the right words wake them
  async function wakeScene(id) {
    const s = st(), p = who(id); if (!p) return;
    M.lock(true); try { M.frame2(p); await wait(0.3); await M.hushed(p, ln(id + '.frozen')); } finally { M.lock(false); }
    if (!s.met) { M.think('Gray, frozen… on a question. Someone on the landing by the beach is still talking. Ask her.', 5.5); return; }
    const fear = FEARS.includes(id) || id === 'salome';
    if (fear && !s.doubtCard) { M.think(WHENS.every(woke) ? 'Frozen on a fear, not a «when?». {tula} knows how to answer a fear: ask her, on the landing.' : 'Frozen on a fear, not a «when?». First the ones who need a «when»: {fermin} and {nadia}.', 6); return; }
    M.lock(true); try { M.frame2(p); await M.say(p, ln(id + '.ask')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS[id], { tips: fear ? T().DTIPS : T().TIPS, icon: 'star' });
    if (!r) { M.think(fear ? 'Still gray. Doubt the fear, out loud, and it lets go.' : 'Still gray. Tell them when.', 4); return; }
    TIME.grade('rf.wake.' + id, r.letter);
    s.woke = s.woke || {}; s.woke[id] = r.letter; G().save();
    await wakeUp(id);
    if (id === 'salome') { await warnScene(); return; }
    const n = wokeN(WHENS), f = wokeN(FEARS);
    if (WHENS.includes(id)) M.think(n >= 2 ? 'Both have their «when». Back to {tula}, on the landing: two more froze on a fear.' : 'One «when» given. The other one is waiting too.', 5);
    else if (WAKE.every(woke) && !s.open) await openScene();
    else if (FEARS.includes(id) && f < 2) M.think('One fear doubted. One more in the stilt camp.', 4.5);
  }
  async function wakeUp(id) {
    const g = G(), P = M.person('future', id), F = P && frozenMat(P);
    M.lock(true);
    try {
      if (F) F.tw = 1;
      snd('learned'); if (P) g.w3d.fx.sparkle(P.api.x, (P.api.y || DY) + 1.3, P.api.z, 22, ['#ffd166', '#9fd0e8', '#f6efe0']);
      await wait(1.2);
      const p = who(id); M.frame2(p); await M.say(p, ln(id + '.awake'));
    } finally { M.lock(false); }
  }
  // the main path, 5: all four awake: the way in at low tide
  async function openScene() {
    const s = st(), g = G();
    M.lock(true);
    try {
      const K = who('tula'); if (K) { M.frame2(K); await M.say(K, ln('tula.open')); }
      M.shot(V(DOORSPOT.x - 5.0, DY + 2.6, DOORSPOT.z + 4.6), V(RUINS.DOOR.x, DY + 0.8, RUINS.DOOR.z)); await wait(0.8);
      snd('swoosh'); g.w3d.fx.puff(RUINS.DOOR.x, WY + 0.2, RUINS.DOOR.z + 0.6, 14, 0.4, '#cfe3ea');
      s.open = true; g.save(); snd('chime'); await wait(0.8);
    } finally { M.lock(false); g.cam.override = null; }
    M.think('Low tide: the temple’s door is open. Tula is coming with her lantern.', 5);
  }
  // the dungeon's finale: an island rises out of the sea, green, a spring on it
  function freed() { TIME.flag('future', 'ruFree', true); TIME.refresh(); show(true); }

  // ------------------------------------------------------------ side quest: «The Wall of Days» (the Future changes today)
  async function warnScene() {
    const s = st(), P = () => who('salome'); if (!P()) return;
    M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('casts.warn')); s.warned = true; TIME.flag('future', 'ruWarn', true); G().save(); } finally { M.lock(false); }
    M.think('A warning from tomorrow, word for word. Today’s Salomé is in the dig camp.', 5.5);
  }
  async function castsToday(Sp) {
    const p = { id: 'salome', name: 'Salomé', x: Sp.x, y: Sp.y, z: Sp.z, top: 1.9 };
    M.lock(true); try { Sp.talking = true; M.frame2(p); await M.say(p, ln('now.salome.hear')); } finally { Sp.talking = false; M.lock(false); }
    const r = await M.ask(T().TASKS.casts, { tips: T().TIPS }); if (!r) { M.think('Today’s Salomé is waiting: what did tomorrow’s Salomé say?', 4); return; }
    TIME.grade('rf.casts', r.letter);
    M.lock(true);
    try {
      Sp.talking = true; M.frame2(p); await M.say(p, ln('now.salome.done'));
      TIME.flag('now', 'ruCasts', true); TIME.refresh(); M.st('now').casts = true; G().save();
      const c = CASTS.now; M.shot(V(c.x + 3.2, gy(c.x, c.z) + 2.4, c.z + 3.0), V(c.x, gy(c.x, c.z) + 0.8, c.z), 1.0); await wait(1.0);
      G().w3d.fx.sparkle(c.x, gy(c.x, c.z) + 1.0, c.z, 14, ['#ffffff', '#e8e0cf']); snd('chime'); await wait(0.8);
    } finally { Sp.talking = false; M.lock(false); G().cam.override = null; }
    M.think('Plaster casts of the Wall of Days, made today… what will that change tomorrow?', 5);
  }
  async function castsDone() {
    const s = st();
    await say1('salome', 'casts.done');
    if (!s.castsSaid) { s.castsSaid = true; G().state.coins = (G().state.coins || 0) + 8; UI.toast('+8 coins'); snd('chest'); G().save(); }
  }
  // the casts: today drying on a rack by Salomé's table, tomorrow dry and safe in a case by the Wall of Days
  function castsTex(w) {
    const l = lang(), title = M.plainT(T().NAMES.castsTitle[l] || T().NAMES.castsTitle.en);
    return TK.canvasTex(256, 64, (c, W0, H0) => { c.fillStyle = w === 'now' ? '#f4efe2' : '#e8e0cf'; c.fillRect(0, 0, W0, H0); c.fillStyle = '#5a4a3a'; c.font = '600 20px Georgia, "Microsoft YaHei", "Yu Mincho", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(title.slice(0, 24), W0 / 2, H0 / 2); });
  }
  function castsMesh(w) {
    const g = new THREE.Group(), k0 = kit(), KG = PAST.API.KG, c = CASTS[w], y = w === 'now' ? gy(c.x, c.z) : DY;
    if (w === 'now') {
      for (const s of [-1, 1]) k0.rod([c.x + s * 1.0, y, c.z], [c.x + s * 1.0, y + 1.5, c.z], 0.05, WOOD, 0.004);
      k0.box(c.x, y + 1.45, c.z, 2.1, 0.05, 0.05, WOOD, { ink: 0 });
      for (let i = 0; i < 4; i++) k0.box(c.x - 0.75 + i * 0.5, y + 1.05, c.z + 0.02, 0.42, 0.6, 0.06, '#f4efe2', { ink: 0.006 });
      k0.box(c.x + 1.3, y + 0.15, c.z + 0.4, 0.5, 0.3, 0.5, '#c9c4b8', { ink: 0.006 });
    } else {
      k0.box(c.x, y + 0.45, c.z, 2.2, 0.9, 0.7, '#7a5a3a', { ink: 0.012 }).box(c.x, y + 1.15, c.z, 2.1, 0.5, 0.6, '#cfe3ea', { ink: 0.006 });
      for (let i = 0; i < 4; i++) k0.box(c.x - 0.75 + i * 0.5, y + 1.15, c.z, 0.4, 0.42, 0.05, '#efe8da', { ink: 0.004 });
      k0.add(KG.box, c.x, y + 0.72, c.z + 0.36, 0.9, 0.2, 0.02, '#f4efe2', { ink: 0 });
    }
    k0.build(g);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), new THREE.MeshBasicMaterial({ map: castsTex(w) }));
    sign.position.set(c.x, y + (w === 'now' ? 1.75 : 0.72), c.z + (w === 'now' ? 0.05 : 0.37)); g.add(sign);
    g.name = 'ru-casts-' + w;
    return { obj: g, solids: [{ x: c.x, z: c.z, r: w === 'now' ? 0.5 : 0.9 }] };
  }
  const castsLook = w => async () => {
    if (w === 'now') { M.lookAt('w.ruf_cast', 'Plaster {w.ruf_cast:pl} of the Wall of Days, drying in the sun, one {w.ruf_panel} at a time. Salomé started today.', 6); const n = M.st('now'); if (!n.castsSeen) { n.castsSeen = true; G().save(); } return; }
    M.lookAt('w.ruf_cast', 'The Wall of Days, every {w.ruf_panel} of it, in {w.ruf_plaster}: dry and safe in a case, while the real one is under the {w.sea}.', 7);
    const f = st(); if (!f.castsSeen) { f.castsSeen = true; G().save(); }
  };
  TIME.effect('ruins.casts', { region: 'ruins', when: () => !!TIME.flag('now', 'ruCasts'),
    show: { now: () => castsMesh('now'), future: () => castsMesh('future') },
    act: { now: { x: CASTS.now.x, z: CASTS.now.z + 1.2, r: 1.3, label: 'Look', run: castsLook('now') }, future: { x: CASTS.future.x, z: CASTS.future.z - 1.0, r: 1.3, y: DY, label: 'Look', run: castsLook('future') } } });
  // today: Salomé hears the warning (her Talk; one new line)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || !TIME.flag('future', 'ruWarn') || it.who !== 'salome') return null;
    const Sp = it.p || (RUINS.person && RUINS.person('salome')); if (!Sp) return null;
    if (!TIME.flag('now', 'ruCasts')) return [{ label: 'A message from tomorrow', sub: '◆ side quest', run: () => castsToday(Sp) }];
    return null;
  });

  // ------------------------------------------------------------ side quest: «Darío's tales» (doubt the tall ones, believe the true one)
  async function darioWake() {
    const s = st(), p = who('dario'); if (!p) return;
    M.lock(true); try { M.frame2(p); await wait(0.3); await M.hushed(p, ln('dario.frozen')); } finally { M.lock(false); }
    if (!s.met) { M.think('Gray, frozen mid-story… Someone on the landing by the beach is still talking. Ask her.', 5); return; }
    s.woke = s.woke || {}; s.woke.dario = 'S'; G().save();
    await wakeUp('dario');
    M.think('He dozed off in the middle of a story. Talk to him again: he has more.', 4.5);
  }
  async function talesScene() {
    const s = st(), P = () => who('dario'); if (!P()) return;
    const told = s.tales || (s.tales = {});
    for (const n of [1, 2, 3]) {
      if (told[n]) continue;
      M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('dario.tale' + n)); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS['tale' + n], { tips: T().DTIPS }); if (!r) { M.think('{dario} is waiting: do you believe it?', 4); return; }
      TIME.grade('rf.tale' + n, r.letter); told[n] = r.letter; G().save();
      if (n === 2) { M.lock(true); try { M.frame2(P()); await M.say(P(), ln('dario.tale2ok')); } finally { M.lock(false); } }
    }
    M.lock(true); try { const P2 = P(); M.frame2(P2); await M.say(P2, ln('dario.done')); s.talesDone = true; G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }
  // ------------------------------------------------------------ side quest: «Nadia's garden» (when will she plant? when will they grow?)
  async function gardenAsk() {
    const s = st(), P = () => who('nadia'); if (!P()) return;
    M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('garden.ask')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.garden1, { tips: T().TIPS }); if (!r) { M.think('{nadia} is waiting: when will she plant them?', 4); return; }
    TIME.grade('rf.garden1', r.letter);
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln('garden.next')); s.gardenAsked = r.letter; G().save(); } finally { M.lock(false); }
    M.think('No dry earth anywhere… not yet.', 4);
  }
  async function gardenGrow() {
    const s = st(), P = () => who('nadia'); if (!P()) return;
    M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('garden.free')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.garden2, { tips: T().TIPS }); if (!r) { M.think('{nadia} is waiting: when will they grow?', 4); return; }
    TIME.grade('rf.garden2', r.letter);
    M.lock(true); try { const P2 = P(); M.frame2(P2); await M.say(P2, ln('garden.done')); s.gardenDone = true; G().state.coins = (G().state.coins || 0) + 5; UI.toast('+5 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ the Talk menus (tomorrow): the side quests
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'future' || TIME.regionNow() !== 'ruins') return null;
    const s = st(), out = [];
    if (it.who === 'future:dario' && woke('dario') && !s.talesDone) out.push({ label: 'Darío’s tales', sub: '◆ side quest', run: talesScene });
    if (it.who === 'future:nadia' && woke('nadia') && !s.gardenAsked) out.push({ label: 'Your seeds?', sub: '◆ side quest', run: gardenAsk });
    if (it.who === 'future:nadia' && s.gardenAsked && free() && !s.gardenDone) out.push({ label: 'The island', sub: '◆ side quest', run: gardenGrow });
    return out.length ? out : null;
  });

  // ------------------------------------------------------------ E, the compass
  const LOOKS = [
    { id: 'w.ruf_stilthouse', at: { x: 147.4, z: 25.4 }, line: () => 'The dig camp is a village of {w.ruf_stilthouse:pl} now: tents on platforms over the {w.sea}, ladders down to the water.' },
    { id: 'w.ruf_hammock', at: { x: 145.0, z: 25.4 }, line: () => 'Darío’s {w.ruf_hammock}, strung between two posts over the water. It rocks a little with every {w.pb_wave}.' },
    { id: 'w.ruf_stove', at: { x: 140.6, z: 17.6 }, line: () => (woke('nadia') ? 'Nadia’s {w.ruf_stove}, warm again: {w.ruf_driedfish}, a jar of {w.ruf_garlic}, a tin of {w.ruf_spice}, under a striped {w.ruf_umbrella}.' : 'A cold {w.ruf_stove} under a striped {w.ruf_umbrella}. A pot of {w.ruf_driedfish} soup, a {w.ruf_can} of {w.ruf_bean:pl}, gone gray like everything else.') },
    { id: 'w.ruf_cistern', at: { x: 144.6, z: 18.6 }, line: () => 'A rain {w.ruf_cistern} and a hand {w.ruf_pump}: the only {w.ruf_freshwater} on the boardwalks.' },
    { id: 'w.ruf_tidetable', at: { x: 149.6, z: 20.6 }, line: () => 'Gaspar’s {w.ruf_tidetable}, held down with a stone: every high and {w.ruf_ebb} for years. A {w.ruf_tape} lies on top of it.' },
    { id: 'w.ruf_tidegauge', at: { x: 150.0, z: 18.0 }, line: () => 'A striped {w.ruf_tidegauge} in the water at the edge of the deck. Every year the {w.ruf_hightide} climbs one more stripe.' },
    { id: 'w.ruf_museum', at: { x: 135.0, z: 40.0 }, line: () => 'Tula’s little {w.ruf_museum}: a {w.ruf_showcase} on the boardwalk, a {w.ruf_label} under each find. In the middle, a {w.ruf_wonky} little {w.jar}.' },
    { id: 'w.ruf_lifebuoy', at: { x: 140.4, z: 42.8 }, line: () => 'A {w.ruf_lifebuoy} on a post, faded by the sun. Somebody painted a smiling fish on it.' },
    { id: 'w.ruf_kayak', at: { x: 133.6, z: 39.6 }, line: () => 'A yellow {w.ruf_kayak} tied to the landing, a {w.ruf_bottle} of water in it, its {w.ruf_cork} on a string.' },
    { id: 'w.ruf_diver', at: { x: 129.8, z: 2.0 }, line: () => 'Salomé’s gear, a {w.ruf_diver}’s: a {w.ruf_mask}, a {w.ruf_snorkel}, a pair of {w.ruf_fin:pl}, a {w.ruf_wetsuit} drying on a line.' },
    { id: 'w.ruf_anemone', at: { x: 131.4, z: -2.4 }, line: () => 'In the clear water by the Wall of Days: {w.ruf_anemone:pl} waving, a {w.ruf_sponge}, {w.ruf_clam:pl} half buried in the {w.sand}.' },
    { id: 'w.ruf_driftwood', at: { x: 125.4, z: -1.6 }, line: () => 'A heap of {w.ruf_driftwood} by the Wall, white with salt. Somebody started a little fence with it.' },
    { id: 'w.ruf_school', at: { x: 139.6, z: -8.8 }, line: () => 'Under the {w.ruf_boardwalk}, a {w.ruf_school} turns all at once, silver. A {w.ruf_jellyfish} drifts past, slow as a cloud.' },
    { id: 'w.ruf_dolphin', at: { x: 143.4, z: 32.6 }, line: () => 'Far down the canyon, toward the open {w.sea}: a {w.ruf_fin}… two! {w.ruf_dolphin:pl}, playing in the {w.pb_wave:pl}.' },
    { id: 'w.ruf_otter', at: { x: 139.4, z: 8.9 }, line: () => 'An {w.ruf_otter} floats on its back by the steps, cracking a {w.ruf_clam} on its belly. It looks very pleased with itself.' },
    { id: 'w.ruf_reflection', at: { x: 142.4, z: 13.0 }, line: () => 'The time crack shimmers over the water. Its {w.ruf_reflection} is a little late, like an echo.' },
    { id: 'w.ruf_coast', at: { x: 137.0, z: 43.2 }, line: () => 'From the landing you can see the whole {w.ruf_coast}, gray and quiet, all the way north. The {w.ruf_seashore} is where the canyon used to start.' },
  ];
  function interactables() {
    const s = st(), out = [];
    out.push({ x: DOORSPOT.x, z: DOORSPOT.z, y: DY, r: 1.8, label: s.open ? 'Go in' : 'Look', run: async () => {
      if (!s.open) { M.lookAt('w.pf_tide', s.met ? 'The temple’s door, half under the water. The {w.pf_tide} goes in and out of it. Nobody can go in like this… not with everyone frozen.' : 'The temple’s door, half under the gray water, breathing in and out with the tide.', 5); return; }
      if (typeof RU_FTEMPLE !== 'undefined' && RU_FTEMPLE) await RU_FTEMPLE.enter();
    } });
    for (const L0 of LOOKS) { if (L0.when && !L0.when()) continue; out.push({ x: L0.at.x, z: L0.at.z, y: DY, r: 1.3, label: 'Look', run: async () => M.lookAt(L0.id, M.fillEn(L0.line()), 6) }); }
    return out;
  }
  const HINTS = { tula: '{mimo} points at someone on the landing… the only one with any color.', temple: '{mimo} looks at the temple’s half-drowned door.',
    fermin: '{mimo} points at an old man by the temple’s door.', nadia: '{mimo} points at a woman by a cold stove, in the stilt camp.', elvira: '{mimo} points at an old woman with a cane, in the stilt camp.',
    gaspar: '{mimo} points at a man at a table of maps, in the stilt camp.', dario: '{mimo} points at a man by a hammock, in the stilt camp.', salome: '{mimo} points at a woman by the Wall of Days, in the old town.' };
  function target(id) {
    if (id === 'temple') return (typeof RU_FTEMPLE !== 'undefined' && RU_FTEMPLE && RU_FTEMPLE.inside && RU_FTEMPLE.target()) || { x: DOORSPOT.x, z: DOORSPOT.z, hint: HINTS.temple };
    if (id === 'whens') { const n = WHENS.find(k0 => !woke(k0)); if (!n) return target('tula'); id = n; }
    if (id === 'fears') { const n = FEARS.find(k0 => !woke(k0)); if (!n) return target(st().open ? 'temple' : 'tula'); id = n; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || '{mimo} points.' };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  function nextId() { const s = st(); return !s.met ? 'tula' : !WHENS.every(woke) ? 'whens' : !s.doubtCard ? 'tula' : !FEARS.every(woke) ? 'fears' : !s.open ? 'tula' : 'temple'; }
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('ru_future') ? 'ru_future' : 'future');

  // ------------------------------------------------------------ the side quests (QUESTS.LIST)
  const BELIEVE = { es: 'creo que suena', pt: 'acho que toca', de: 'ich glaube, dass sie läutet', zh: '[我|wǒ] [相信|xiāng xìn] [钟|zhōng] [会|huì] [响|xiǎng]', ja: '[鳴|な]る と [思|おも]います' };
  if (typeof QUESTS !== 'undefined') {
    const fS = s => M.sf(s), nS = s => M.sn(s);
    const futAt = id => () => M.via('future', () => target(id));
    if (!QUESTS.LIST.some(q => q.id === 'rf.casts')) QUESTS.LIST.push({ id: 'rf.casts', kind: 'side',
      title: 'The Wall of Days', get giver() { return M.fillEn('{salome}, by the Wall of Days (the Sunken Ruins, tomorrow)'); },
      started: s => !!(fS(s).woke && fS(s).woke.salome),
      steps: [
        { text: 'Today: tell Salomé the warning from tomorrow, word for word', get why() { return M.fillEn(`She’s in the dig camp. «${M.plainT(M.fillMimo((T().TASKS.casts.model || {})[lang()] || ''))}»`); },
          done: s => !!nS(s).casts, target: () => M.via('now', () => { const p = RUINS.person && RUINS.person('salome'); return p ? { x: p.x, z: p.z, hint: '{mimo} points at Salomé, in the dig camp.' } : null; }), hint: '{mimo} points at Salomé, in the dig camp.' },
        { text: 'Tomorrow: what happened to the Wall of Days? Look in the old town', why: 'A warning from tomorrow, carried back to today… what did it change?',
          done: s => !!fS(s).castsSeen, target: () => M.via('future', () => ({ x: CASTS.future.x, z: CASTS.future.z, hint: '{mimo} points at a glass case by the Wall of Days.' })), hint: '{mimo} points at a glass case by the Wall.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'rf.tales')) QUESTS.LIST.push({ id: 'rf.tales', kind: 'side',
      get title() { return M.fillEn('{dario}’s tales'); }, get giver() { return M.fillEn('{dario}, in the stilt camp (the Sunken Ruins, tomorrow)'); },
      started: s => !!(fS(s).woke && fS(s).woke.dario),
      steps: [{ get text() { return M.fillEn('In the Future: doubt the tall tales, believe the true one (3)'); }, get why() { return M.fillEn(`Doubt with the subjunctive, ${M.sx('doubt')}; believe with the indicative, «${M.plainT(BELIEVE[lang()] || BELIEVE.es)}».`); },
        done: s => !!fS(s).talesDone, target: futAt('dario'), hint: HINTS.dario }] });
    if (!QUESTS.LIST.some(q => q.id === 'rf.garden')) QUESTS.LIST.push({ id: 'rf.garden', kind: 'side',
      get title() { return M.fillEn('{nadia}’s garden'); }, get giver() { return M.fillEn('{nadia}, in the stilt camp (the Sunken Ruins, tomorrow)'); },
      started: s => !!fS(s).gardenAsked,
      steps: [{ get text() { return M.fillEn('Once there’s dry earth: tell {nadia} when her seeds will grow'); }, why: 'No dry earth anywhere… until something changes out there.', done: s => !!fS(s).gardenDone, target: futAt('nadia'), hint: HINTS.nadia }] });
  }

  // ------------------------------------------------------------ the dressing's hooks
  Object.assign(M.DRESS.future, {
    k: () => k(),
    people: PEOPLE,
    on(api) { show(true); hid = M.hideToday(api, { future: true }); dressPeople(); },
    off() { show(false); hid = []; },
    entered() { show(true); dressPeople(); },
    late: (api, dt) => { if (typeof RU_FTEMPLE !== 'undefined' && RU_FTEMPLE && RU_FTEMPLE.inside) RU_FTEMPLE.late(dt); else late(dt); },
    update(api, dt, t) { dressPeople(); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, PEOPLE, who, k, build, show, LOOKS, freed, DOORSPOT, CASTS,
    target: id => target(id), song: () => song(), init: () => {}, changed: () => {},
    _: { talk: id => talk(id), tulaScene, doubtScene, wakeScene, openScene, warnScene, castsToday, castsDone, darioWake, talesScene, gardenAsk, gardenGrow, get built() { return built; } } };
})();
