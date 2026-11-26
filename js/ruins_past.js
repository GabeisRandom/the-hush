'use strict';
// The Sunken Ruins, long ago (DESIGN.md 20.1b "next, the Sunken Ruins"; game/TIME.md "The Sunken Ruins (T4b)"): the first dig, the
// morning after the river flooded. TIME dresses it (time_ruins.js RUINT.DRESS.past); the land itself (the green canyon, the river, the
// palms, the fields) is TIME.land's (time_ruins_land.js). Today's dig camp, «El Viento Sur», the dig mounds and the sand-drifted temple
// top are set aside (RUINT.hideToday); here instead: the temple's top as it was, its steps showing, the door just dug free and standing
// open, a trench and the dig's spoil; the first dig's two old tents and its table; the photographer's camera on its tripod; the potter's
// wheel and kiln by the river; the flood's mud on everything low.
// The people of then (TIME's person kit): the professor who led the first dig (today's Elvira's teacher), young Elvira (a student), young
// Fermín (8), his mother the farmer, the fisherwoman of the cove, the photographer, the potter. Each language names the new ones its own
// way (RUPTXT.CAST).
// The main path (RUINT.PSTEPS): the professor tells what they found this morning («Cuando llegamos, el río ya había bajado…») and the
//   card → her question → young Elvira's two questions → the farmer, the fisherwoman and young Fermín each tell what they saw in the
//   night → you pass on to the professor what each one said («Dijo que había visto una luz en el templo»: the second card) → the temple
//   (ruins_past_dungeon.js) → the Clay Parrot (ruins_time_boss.js) → the echo → Noa.
// Side quests (QUESTS.LIST): «The flood line» (cross-time: tell the farmer how high the water had come; she carves the mark in the red
//   rock by the gully; today it's high and dry and today's Fermín knows who carved it; tomorrow it's under the sea), «Young Fermín's
//   trowel» (a memory for {mimo}, then where the river had carried it), «The first photograph» (cross-time: where had everyone stood? the
//   picture stands on today's Elvira's table, and tomorrow in the stilt camp).
const RU_PAST = (() => {
  if (typeof TIME === 'undefined' || typeof RUINT === 'undefined' || !RUINT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = RUINT, T = () => RUPTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('past');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are (checked with RUINT._.t.probe in every world)
  const AT = {
    professor: { x: 144.4, z: -15.4, yaw: 2.7 }, elvira: { x: 126.9, z: 2.6, yaw: Math.PI / 2 }, fermin: { x: 136.8, z: 27.8, yaw: 0.8 },
    farmer: { x: 129.0, z: 39.6, yaw: Math.PI }, fisher: { x: 146.0, z: 43.8, yaw: Math.PI + 0.4 }, photo: { x: 136.0, z: -13.6, yaw: 2.55 }, potter: { x: 151.0, z: 25.6, yaw: -1.2 },
  };
  const TEMPLE = RUINS.TEMPLE, DOOR = RUINS.DOOR;
  const DOORSPOT = { x: 142.0, z: -19.8 }, CAMERA = { x: 137.4, z: -14.9 }, PLATE = { x: 134.9, z: -12.6 }, TABLE = { x: 151.4, z: 13.0 }, WHEEL = { x: 150.0, z: 27.2 }, KILN = { x: 153.0, z: 27.8 };
  const TENTS = [{ x: 156.8, z: 21.0, ry: -Math.PI / 2 }, { x: 156.6, z: 13.8, ry: -Math.PI / 2 }];
  const GLINT = { x: 133.4, z: 30.9 };                       // (young Fermín's trowel, in the mud by the oasis palm)
  // the flood line: on the gully's west wall, where today's sand is dry and tomorrow's sea is over it
  const MARK = { z: 36.0, y: 2.42, look: { now: { x: 141.0, z: 36.0 }, past: { x: 141.0, z: 36.0 }, future: { x: 142.3, z: 36.2 } } };
  const C = () => T().CAST;
  const LOOK = {
    professor: { skin: '#c98e62', hair: '#5a3a26', hairdo: 'bun', dress: '#d8c8a0', vest: '#8a6440', hat: 'straw', hatColor: '#e8d9a8', glasses: true, h: 1.0 },
    elvira: { skin: '#c98e62', hair: '#3a2b26', hairdo: 'tails', dress: '#f2e3c4', vest: '#4c9a8a', hat: 'straw', hatColor: '#e8d9a8', h: 0.97 },
    fermin: { kid: true, skin: '#b07850', hair: '#2e2420', hairdo: 'short', dress: '#c98e4a', apron: '#e2574c', h: 0.62 },
    farmer: { skin: '#b07850', hair: '#2e2420', hairdo: 'bun', dress: '#6b8a4a', apron: '#e9d9b0', hat: 'scarf', hatColor: '#e2574c', prop: 'basket', h: 0.98 },
    fisher: { skin: '#8a5a3a', hair: '#1f1a18', hairdo: 'braids', dress: '#3f6a8a', vest: '#e9e0c8', hat: 'scarf', hatColor: '#f2c94c', wide: 1.05, h: 1.0 },
    photo: { skin: '#e6b48c', hair: '#8a4a2a', hairdo: 'short', dress: '#4a4f66', vest: '#c9a24a', hat: 'beret', hatColor: '#2f3f5a', stache: true, hair2: '#8a4a2a', h: 1.02 },
    potter: { skin: '#a8714a', hair: '#1f1a18', hairdo: 'bun', dress: '#c96f45', apron: '#b9956a', h: 0.98 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('past', id);

  // ------------------------------------------------------------ the dressing: one merged mesh (and its ink hull) per group
  let built = null;
  const kit = () => PAST.API.Kit();
  const STONE = '#e8c49a', STONE_D = '#d4a878', WOOD = '#8a5f3e', WOOD_D = '#5a3a24', CANVAS = '#d8c49a';
  // the temple's top as it was: its steps and base showing (no sand against it), the columns, the door just dug free, standing open
  function templeTop(k, KG) {
    const T0 = TEMPLE, y = gy(T0.x, T0.z + 3.0);
    for (let i = 0; i < 3; i++) k.box(T0.x, y + 0.12 + i * 0.18, T0.z + T0.d / 2 + 1.3 - i * 0.45, T0.w + 1.6 - i * 0.3, 0.2, 0.5, i % 2 ? STONE_D : STONE, { ink: 0.012 });
    k.box(T0.x, y + 0.3, T0.z, T0.w + 1.4, 0.6, T0.d + 1.0, STONE_D, { ink: 0.03 }).box(T0.x, y + 0.75, T0.z - 0.2, T0.w + 0.6, 0.4, T0.d + 0.4, STONE, { ink: 0.025 });
    for (let i = 0; i < 6; i++) { const x = T0.x - T0.w / 2 + 1.1 + i * (T0.w - 2.2) / 5; if (Math.abs(x - DOOR.x) < 2) continue; k.add(KG.cyl, x, y + 2.7, T0.z + T0.d / 2 - 0.4, 0.42, 3.8, 0.42, STONE, { ink: 0.025 }).add(KG.box, x, y + 4.62, T0.z + T0.d / 2 - 0.4, 1.0, 0.2, 1.0, STONE_D, { ink: 0.01 }); }
    k.box(T0.x, y + 4.8, T0.z, T0.w + 0.6, 0.6, T0.d + 0.4, '#e3b07a', { ink: 0.03 }).add(KG.box, T0.x, y + 5.15, T0.z, T0.w + 0.2, 0.12, T0.d + 0.1, '#c96f45', { ink: 0.008 });
    k.box(T0.x, y + 2.6, T0.z - 0.4, T0.w - 0.4, 4.0, T0.d - 1.2, '#d4a070', { ink: 0.02 });
    // a frieze of carved birds along the top (one of them is missing: the Clay Parrot)
    for (let i = 0; i < 9; i++) { if (i === 5) continue; const x = T0.x - T0.w / 2 + 1.2 + i * (T0.w - 2.4) / 8; k.add(KG.sphere, x, y + 4.8, T0.z + T0.d / 2 + 0.24, 0.22, 0.16, 0.06, ['#5fae4f', '#c9433a', '#4c7fd8'][i % 3], { ink: 0.004 }).add(KG.cone, x + 0.16, y + 4.8, T0.z + T0.d / 2 + 0.24, 0.05, 0.14, 0.04, '#f2c94c', { rz: -Math.PI / 2, ink: 0 }); }
    for (const s of [-1, 1]) k.box(DOOR.x + s * 1.6, y + 2.0, DOOR.z + 0.1, 0.5, 4.0, 0.7, '#e3b07a', { ink: 0.02 });
    k.box(DOOR.x, y + 4.15, DOOR.z + 0.1, 3.8, 0.5, 0.8, '#e3b07a', { ink: 0.02 });
    // the door slab, pushed aside by the water and leaning against the wall; mud at the threshold
    k.box(DOOR.x + 3.0, y + 1.6, DOOR.z + 0.7, 2.6, 3.3, 0.34, '#c99a68', { ry: 0.25, rz: 0.12, ink: 0.02 });
    for (const [dx, r] of [[-0.6, 0.18], [0, 0.22], [0.6, 0.16]]) k.add(KG.cyl, DOOR.x + 2.9 + dx, y + 2.5, DOOR.z + 0.92, r, 0.05, r, '#a8784a', { rx: Math.PI / 2, ry: 0.25, ink: 0 });
    k.add(KG.sphere, DOOR.x, y + 0.02, DOOR.z + 1.3, 1.8, 0.08, 0.9, '#6b5236', { ink: 0 });
  }
  // the trench in front of the door, the dig's tools the flood scattered, the camp of the first dig, the camera, the potter's corner
  function props(k) {
    const KG = PAST.API.KG;
    templeTop(k, KG);
    let y = gy(DOORSPOT.x, DOORSPOT.z);
    for (const s of [-1, 1]) k.box(DOORSPOT.x + s * 2.3, y + 0.08, DOORSPOT.z - 0.4, 0.14, 0.16, 3.0, WOOD, { ink: 0.006 });
    k.box(DOORSPOT.x, y + 0.03, DOORSPOT.z - 0.4, 4.4, 0.04, 3.0, '#6b5236', { ink: 0 });
    for (let i = 0; i < 6; i++) k.box(DOORSPOT.x - 1.6 + i * 0.65, y + 0.06, DOORSPOT.z - 1.9, 0.08, 0.04, 0.6, '#c9b48e', { ink: 0 });
    // a ladder against the door frame, a bucket on its side, a shovel stuck in the mud
    k.rod([DOOR.x - 1.25, y + 0.05, DOOR.z + 1.2], [DOOR.x - 1.35, y + 3.0, DOOR.z + 0.55], 0.04, '#a8743f', 0.004).rod([DOOR.x - 0.75, y + 0.05, DOOR.z + 1.2], [DOOR.x - 0.85, y + 3.0, DOOR.z + 0.55], 0.04, '#a8743f', 0.004);
    for (let i = 0; i < 6; i++) k.box(DOOR.x - 1.05, y + 0.4 + i * 0.45, DOOR.z + 1.12 - i * 0.1, 0.5, 0.05, 0.06, '#c79d6d', { ink: 0 });
    k.add(KG.cyl, 139.0, y + 0.22, -19.2, 0.22, 0.44, 0.22, '#9aa4ae', { rz: Math.PI / 2, ink: 0.008 }).rod([144.6, y - 0.1, -18.0], [145.0, y + 1.3, -17.7], 0.035, WOOD, 0.004).box(144.58, y + 0.02, -18.02, 0.24, 0.3, 0.04, '#a9b4c2', { ink: 0.004 });
    // the first dig's camp: two old canvas tents, the table with the notebooks and the lamp, a sieve on its stand, crates
    for (const Tn of TENTS) { y = gy(Tn.x, Tn.z); k.add(KG.cone4, Tn.x, y + 1.0, Tn.z, 1.6, 2.0, 1.5, CANVAS, { ry: Math.PI / 4 + Tn.ry, ink: 0.02 }); k.box(Tn.x + Math.sin(Tn.ry) * 1.08, y + 0.6, Tn.z + Math.cos(Tn.ry) * 1.08, 0.9, 1.2, 0.04, '#4a3a2a', { ry: Tn.ry, ink: 0 }); }
    y = gy(TABLE.x, TABLE.z);
    k.box(TABLE.x, y + 0.74, TABLE.z, 1.8, 0.06, 0.9, '#a87850', { ink: 0.012 });
    for (const [sx, sz] of [[-0.8, -0.38], [0.8, -0.38], [-0.8, 0.38], [0.8, 0.38]]) k.box(TABLE.x + sx, y + 0.37, TABLE.z + sz, 0.06, 0.74, 0.06, WOOD_D, { ink: 0 });
    for (let i = 0; i < 4; i++) k.box(TABLE.x - 0.5 + i * 0.12, y + 0.79 + i * 0.03, TABLE.z, 0.5, 0.03, 0.36, ['#c96f45', '#4c7fd8', '#5fae4f', '#e9d9b0'][i], { ry: i * 0.2, ink: 0.004 });
    k.add(KG.cyl, TABLE.x + 0.55, y + 0.9, TABLE.z - 0.1, 0.12, 0.26, 0.12, '#c9a24a', { ink: 0.004 }).add(KG.sphere, TABLE.x + 0.55, y + 1.1, TABLE.z - 0.1, 0.1, 0.12, 0.1, '#fff3c8', { ink: 0 });
    y = gy(153.4, 17.2); k.box(153.4, y + 0.6, 17.2, 0.9, 0.05, 0.9, '#c9b48e', { ink: 0.006 }); for (const [sx, sz] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]]) k.rod([153.4 + sx, y, 17.2 + sz], [153.4 + sx * 0.9, y + 0.6, 17.2 + sz * 0.9], 0.03, WOOD, 0);
    for (const [x, z, s] of [[154.4, 24.4, 0.7], [155.2, 25.0, 0.55]]) { y = gy(x, z); k.box(x, y + s / 2, z, s, s, s, '#b8955a', { ry: x, ink: 0.012 }); }
    // the photographer's camera on its tripod (a wooden box, a brass lens, a black cloth), the broken plate in its crate
    y = gy(CAMERA.x, CAMERA.z);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.4; k.rod([CAMERA.x + Math.cos(a) * 0.5, y, CAMERA.z + Math.sin(a) * 0.5], [CAMERA.x, y + 1.25, CAMERA.z], 0.025, WOOD, 0.004); }
    k.box(CAMERA.x, y + 1.42, CAMERA.z, 0.42, 0.36, 0.5, '#7a4f2e', { ry: 2.55, ink: 0.01 }).add(KG.cyl, CAMERA.x + Math.sin(2.55) * 0.32, y + 1.42, CAMERA.z + Math.cos(2.55) * 0.32, 0.1, 0.2, 0.1, '#c9a24a', { rx: Math.PI / 2, ry: 2.55, ink: 0.004 });
    k.box(CAMERA.x - Math.sin(2.55) * 0.3, y + 1.38, CAMERA.z - Math.cos(2.55) * 0.3, 0.5, 0.6, 0.06, '#2b2235', { ry: 2.55, ink: 0 });
    y = gy(PLATE.x, PLATE.z); k.box(PLATE.x, y + 0.2, PLATE.z, 0.6, 0.4, 0.45, '#b8955a', { ry: 0.3, ink: 0.008 }); for (let i = 0; i < 4; i++) k.box(PLATE.x - 0.15 + i * 0.1, y + 0.42, PLATE.z + (i % 2) * 0.08, 0.16, 0.02, 0.2, '#cfe3ea', { ry: i, ink: 0 });
    // the potter's wheel, her round kiln and a row of jars drying in the sun
    y = gy(WHEEL.x, WHEEL.z);
    k.add(KG.cyl, WHEEL.x, y + 0.3, WHEEL.z, 0.42, 0.6, 0.42, WOOD_D, { ink: 0.008 }).add(KG.cyl, WHEEL.x, y + 0.62, WHEEL.z, 0.45, 0.06, 0.45, '#a87850', { ink: 0.006 }).add(KG.cyl, WHEEL.x, y + 0.78, WHEEL.z, 0.18, 0.26, 0.18, '#c96f45', { ink: 0.004 });
    y = gy(KILN.x, KILN.z); k.add(KG.sphere, KILN.x, y + 0.6, KILN.z, 0.95, 1.0, 0.95, '#b4532f', { ink: 0.016 }).add(KG.cyl, KILN.x, y + 0.35, KILN.z + 0.85, 0.3, 0.5, 0.1, '#2b2235', { ink: 0 });
    for (let i = 0; i < 5; i++) { const x = 148.6 + i * 0.5, z = 24.4; y = gy(x, z); k.add(KG.sphere, x, y + 0.22, z, 0.18, 0.24, 0.18, '#c96f45', { ink: 0.006 }).add(KG.cyl, x, y + 0.46, z, 0.08, 0.08, 0.08, '#c96f45', { ink: 0 }); }
    // the flood's leftovers: mud stains low on the oasis palms, a broken branch, a lost sandal
    for (const [x, z] of [[134.6, 30.0], [135.4, 21.4], [126.4, 23.0], [127.8, 30.2]]) { y = gy(x, z); k.add(KG.cyl, x, y + 0.5, z, 0.24, 1.0, 0.24, '#6b5236', { ink: 0 }); }
    y = gy(133.0, 14.6); k.rod([131.6, y + 0.1, 14.0], [134.4, y + 0.25, 15.2], 0.08, '#6b4a30', 0.006); for (let i = 0; i < 4; i++) k.add(KG.sphere, 132.0 + i * 0.7, y + 0.3, 14.2 + i * 0.3, 0.3, 0.16, 0.24, '#5f9a46', { ink: 0.004 });
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'ru-past-' + name; const k = kit(); fn(k); k.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), solids: [] };
    // the door's dark doorway (open), and young Fermín's trowel glinting in the mud
    const y = gy(DOOR.x, DOOR.z + 1);
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 3.5), new THREE.MeshBasicMaterial({ color: '#141017' })); hole.position.set(DOOR.x, y + 1.75, DOOR.z + 0.06); hole.visible = false; hole.name = 'ru-past-doorway'; scene.add(hole); built.hole = hole;
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3c8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    gl.scale.setScalar(0.7); gl.position.set(GLINT.x, gy(GLINT.x, GLINT.z) + 0.25, GLINT.z); gl.visible = false; scene.add(gl); built.glint = gl;
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    for (const Tn of TENTS) add(Tn.x, Tn.z, 1.6);
    add(TABLE.x - 0.5, TABLE.z, 0.6); add(TABLE.x + 0.5, TABLE.z, 0.6); add(153.4, 17.2, 0.5); add(154.4, 24.4, 0.5); add(155.2, 25.0, 0.4);
    add(CAMERA.x, CAMERA.z, 0.45); add(PLATE.x, PLATE.z, 0.4); add(WHEEL.x, WHEEL.z, 0.5); add(KILN.x, KILN.z, 0.95); add(DOOR.x + 3.0, DOOR.z + 0.8, 0.9);
    WORLD.extra.push(...built.solids);
    return built;
  }
  const solidsOn = on => { if (built) built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); };
  function show(on) {
    const B = build(), s = st();
    B.props.visible = on; B.hole.visible = on;
    B.glint.visible = on && !!s.trowelAsked && !s.trowelFound;
    solidsOn(on);
  }
  let hid = [];
  function update(dt, t) {
    const B = built; if (!B) return;
    if (B.glint.visible) B.glint.material.opacity = 0.35 + 0.35 * Math.max(0, Math.sin(t * 3.2));
  }
  function late(dt) { M.showToday(dt, hid); }

  // ------------------------------------------------------------ talking to the people of then (the main path first; side quests come
  // through STORY.talkHooks below, as a little menu)
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const chats = {};
  const cycle = (id, keys) => { chats[id] = ((chats[id] || 0) + 1) % keys.length; return say1(id, keys[chats[id]]); };
  const heardN = () => M.HEARD.filter(k => st().heard && st().heard[k]).length;
  const toldN = () => M.HEARD.filter(k => st().told && st().told[k]).length;
  function talk(id) {
    const s = st(), done = !!(G().state.ch4 && G().state.ch4.echoes && G().state.ch4.echoes['ruins.past']);
    switch (id) {
      case 'professor': return !s.met ? profScene() : !s.joined ? (s.elvira && heardN() >= 3 ? joinScene() : say1('professor', 'prof.again')) : done ? cycle('professor', ['prof.done', 'prof.chat1', 'prof.chat2']) : cycle('professor', ['prof.chat1', 'prof.chat2']);
      case 'elvira': return !s.elvira ? elviraScene() : cycle('elvira', ['elvira.chat1', 'elvira.chat2']);
      case 'farmer': case 'fisher': case 'fermin': return !(s.heard && s.heard[id]) ? heardScene(id) : say1(id, id + '.chat');
      case 'photo': return cycle('photo', ['photo.1', 'photo.2']);
      case 'potter': return cycle('potter', ['potter.1', 'potter.2', 'potter.3']);
      default: return null;
    }
  }
  // the main path, 1: the professor tells what they found this morning (what had happened before), the card, her question
  async function profScene() {
    const s = st(), P = () => who('professor'); if (!P()) return;
    M.lock(true);
    try { M.frame2(P()); await wait(0.4); await M.say(P(), ln('prof.hello')); await M.demo(P(), T().DEMO['prof.demo'], T().MARKS['prof.demo']); } finally { M.lock(false); }
    await M.card(T().CARDS.plup);
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln('prof.task')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.tools, { tips: T().TIPS }); if (!r) { M.think('{professor} is waiting: when you got there, what had happened to the tools?', 4.5); return; }
    TIME.grade('rp.tools', r.letter);
    M.lock(true); try { M.frame2(P()); await M.say(P(), ln('prof.after')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('Young {elvira} is by the Wall of Days, in the old town. {farmer}, {fisher} and young {fermin} are down by the river and the cove.', 6);
  }
  // the main path, 2: young Elvira's two questions (what had happened)
  async function elviraScene() {
    const s = st(), E = () => who('elvira'); if (!E()) return;
    if (!s.met) { M.lock(true); try { M.frame2(E()); await M.say(E(), ln('elvira.chat2')); } finally { M.lock(false); } M.think('The professor of the dig is at the temple, by the trench. Start with her.', 4.5); return; }
    if (!s.elviraHi) { M.lock(true); try { M.frame2(E()); await wait(0.3); await M.say(E(), ln('elvira.hello')); s.elviraHi = true; G().save(); } finally { M.lock(false); } }
    if ((s.elviraQ || 0) < 1) {
      M.lock(true); try { M.frame2(E()); await M.say(E(), ln('elvira.q1')); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.river, { tips: T().TIPS }); if (!r) { M.think('Young {elvira} is waiting: when you arrived, was the river still high?', 4.5); return; }
      TIME.grade('rp.river', r.letter); s.elviraQ = 1; G().save();
    }
    if ((s.elviraQ || 0) < 2) {
      M.lock(true); try { M.frame2(E()); await M.say(E(), ln('elvira.q2')); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.door, { tips: T().TIPS }); if (!r) { M.think('Young {elvira} is waiting: what had happened to the door?', 4.5); return; }
      TIME.grade('rp.door', r.letter); s.elviraQ = 2; G().save();
    }
    M.lock(true); try { M.frame2(E()); await M.say(E(), ln('elvira.after')); s.elvira = true; G().save(); } finally { M.lock(false); }
    M.think(heardN() >= 3 ? 'Back to {professor}, at the temple: tell her what each one said.' : 'Now the others: what did they see last night?', 5);
  }
  // the main path, 3: each of the three tells what they saw in the night (their own words, a demonstration)
  async function heardScene(id) {
    const s = st(), P = () => who(id); if (!P()) return;
    M.lock(true);
    try { M.frame2(P(), id === 'fermin' ? -1 : 1); await wait(0.3); await M.demo(P(), T().DEMO[id + '.demo'], T().MARKS[id + '.demo']); await M.say(P(), ln(id + '.after')); (s.heard || (s.heard = {}))[id] = true; G().save(); } finally { M.lock(false); }
    const n = heardN();
    M.think(n >= 3 ? (s.elvira ? 'That’s all three. Tell {professor}, at the temple, what each one said.' : 'That’s all three. Young {elvira}, by the Wall of Days, has questions too.') : `What they saw last night (${n}/3).`, 5);
  }
  // the main path, 4: what each one said, passed on to the professor (the second card), then the way into the temple
  async function joinScene() {
    const s = st(), P = () => who('professor'); if (!P()) return;
    M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('prof.ask')); } finally { M.lock(false); }
    if (!s.saidCard) { await M.card(T().CARDS.said); s.saidCard = true; G().save(); }
    for (const [id, key] of [['farmer', 'light'], ['fisher', 'notebooks'], ['fermin', 'spoke']]) {
      if (s.told && s.told[id]) continue;
      M.lock(true); try { M.frame2(P()); await M.say(P(), ln('prof.q.' + id)); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS[key], { tips: T().TIPS }); if (!r) { M.think('{professor} is waiting: what did they say?', 4.5); return; }
      TIME.grade('rp.' + key, r.letter); (s.told || (s.told = {}))[id] = r.letter; G().save();
    }
    M.lock(true);
    try { M.frame2(P()); await M.say(P(), ln('prof.ok')); s.joined = true; TIME.flag('past', 'ruOpen', true); G().save(); } finally { M.lock(false); }
    M.think('The temple’s door is open. He went in there last night with his lamp.', 5);
  }

  // ------------------------------------------------------------ side quest: «The flood line» (the Past changes today and tomorrow)
  async function markAsk() {
    const s = st(), P = () => who('farmer'); if (!P()) return;
    M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('mark.ask')); s.markAsked = true; G().save(); } finally { M.lock(false); }
    M.think('A line of mud on the red rock in the gully, at the height the water had come… Look, then tell her.', 5.5);
  }
  async function markScene() {
    const s = st(), P = () => who('farmer'); if (!P()) return;
    if (!s.markSeen) { M.think('Look at the rocks in the gully first: the mud shows how high the water had come.', 4.5); return; }
    const r = await M.ask(T().TASKS.mark, { tips: T().TIPS }); if (!r) { M.think('{farmer} is waiting: how high had the water come?', 4); return; }
    TIME.grade('rp.mark', r.letter);
    M.lock(true);
    try {
      const wx = wallX(), y = MARK.y;
      M.shot(V(wx + 3.4, y + 0.6, MARK.z + 2.2), V(wx, y, MARK.z)); await wait(0.6);
      for (let i = 0; i < 6; i++) { snd('click'); G().w3d.fx.puff(wx + 0.2, y, MARK.z - 0.8 + i * 0.3, 4, 0.12, '#d9834f'); await wait(0.18); }
      TIME.flag('past', 'ruMark', true); TIME.refresh(); s.markDone = true; G().save();
      snd('learned'); await wait(0.6);
      const P2 = P(); M.frame2(P2); await M.say(P2, ln('mark.done'));
      G().state.coins = (G().state.coins || 0) + 8; UI.toast('+8 coins'); snd('chest');
    } finally { M.lock(false); }
    M.think('A mark carved in red rock, long ago… rock lasts. Will it still be there today?', 5);
  }
  // where the gully's west wall reaches the flood line (the rock face the mark is carved in)
  let WX = null;
  function wallX() { if (WX != null) return WX; let x = 141.2; while (x > 136 && gy(x, MARK.z) < MARK.y) x -= 0.05; return (WX = x + 0.06); }
  function markTex(kind) {
    const l = lang(), N = T().NAMES, txt = M.plainT(N.markText[l] || N.markText.en);
    return TK.canvasTex(320, 96, (c, W0, H0) => {
      c.clearRect(0, 0, W0, H0);
      const ink = kind === 'future' ? 'rgba(60,80,70,0.85)' : kind === 'now' ? 'rgba(110,50,30,0.7)' : 'rgba(110,40,20,0.95)';
      c.strokeStyle = ink; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); for (let x = 10; x <= W0 - 10; x += 6) { const y = 22 + Math.sin(x * 0.09) * 6; if (x === 10) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
      c.fillStyle = ink; c.textAlign = 'center'; c.font = '700 26px Georgia, "Microsoft YaHei", "Yu Mincho", serif'; c.fillText(txt.slice(0, 26), W0 / 2, 66);
      c.font = '700 17px Georgia, serif'; c.fillText('▲', W0 / 2, 88);
      if (kind === 'future') { c.fillStyle = 'rgba(90,120,100,0.5)'; for (let i = 0; i < 12; i++) { c.beginPath(); c.arc((i * 61) % W0, (i * 37) % H0, 5 + (i % 3) * 3, 0, TAU); c.fill(); } }
    });
  }
  function markMesh(kind) {
    const g = new THREE.Group(), x = wallX();
    if (kind === 'mud') {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.14), new THREE.MeshBasicMaterial({ color: '#6b5236', transparent: true, opacity: 0.85 }));
      m.position.set(x + 0.02, MARK.y, MARK.z); m.rotation.y = Math.PI / 2; g.add(m); g.name = 'ru-mark-mud'; return { obj: g };
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.58), new THREE.MeshBasicMaterial({ map: markTex(kind), transparent: true, depthWrite: false }));
    m.position.set(x + 0.03, MARK.y - 0.12, MARK.z); m.rotation.y = Math.PI / 2; g.add(m); g.name = 'ru-mark-' + kind;
    return { obj: g };
  }
  const markLook = w => async () => {
    const l = lang(), tx = M.plainT(T().NAMES.markText[l] || T().NAMES.markText.en);
    if (w === 'past') { M.lookAt('w.rup_mark', `{farmer}’s {w.rup_mark}, fresh from the {w.rup_chisel}: a wavy line in the red {w.rup_rock}, and «${tx}».`, 7); return; }
    if (w === 'now') {
      M.lookAt('w.rup_mark', `High on the dry red {w.rup_rock}, far above the sand, an old carved {w.rup_mark}: a wavy line, and «${tx}». There’s no river anywhere now.`, 9);
      const n = M.st('now'); if (!n.markSeen) { n.markSeen = true; G().save(); }
      return;
    }
    M.lookAt('w.rup_mark', `Down there, just under the water, the old {w.rup_mark} on the rock: «${tx}». The sea has come higher than the river ever did.`, 8);
    const f = M.st('future'); if (!f.markSeen) { f.markSeen = true; G().save(); }
  };
  TIME.effect('ruins.mark', { region: 'ruins', when: () => !!TIME.flag('past', 'ruMark'),
    show: { past: () => markMesh('past'), now: () => markMesh('now'), future: () => markMesh('future') },
    before: { past: () => markMesh('mud') },
    act: { past: { x: MARK.look.past.x, z: MARK.look.past.z, r: 1.4, label: 'Look', run: markLook('past') }, now: { x: MARK.look.now.x, z: MARK.look.now.z, r: 1.4, label: 'Look', run: markLook('now') },
      future: { x: MARK.look.future.x, z: MARK.look.future.z, r: 1.4, y: M.DECK_Y, label: 'Look', run: markLook('future') } } });
  // today: Fermín knows who carved it (his Talk; one new line: the mark, and where his «¡Cava, Fermín, cava!» comes from)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || !TIME.flag('past', 'ruMark') || it.who !== 'fermin') return null;
    return [{ label: 'The mark on the rock', run: async () => {
      const p = it.p || (RUINS.person && RUINS.person('fermin')); if (!p) return;
      M.lock(true); try { const q = { id: 'fermin', name: 'Fermín', x: p.x, y: p.y, z: p.z, top: 2.1 }; p.talking = true; M.frame2(q); await M.say(q, ln('now.fermin.mark')); const n = M.st('now'); n.ferminMark = true; G().save(); } finally { p.talking = false; M.lock(false); }
    } }];
  });

  // ------------------------------------------------------------ side quest: «Young Fermín's trowel» (a memory: {mimo} dug by the palm)
  async function trowelAsk() {
    const s = st(), P = () => who('fermin'); if (!P()) return;
    M.lock(true); try { M.frame2(P(), -1); await wait(0.3); await M.say(P(), ln('trowel.ask')); s.trowelAsked = true; G().save(); } finally { M.lock(false); }
    if (built) built.glint.visible = true;
    M.think('Something glints in the mud by the oasis palm. Tell {mimo} what it did, as a memory.', 5);
  }
  async function digScene() {
    const s = st();
    const r = await M.ask(M.memTask(T().MEM.palm), { icon: 'dig' }); if (!r) { M.think('Something glints by the palm. Tell {mimo} what it did, as a memory.', 4); return; }
    TIME.grade('rp.dig', r.letter);
    M.lock(true);
    try {
      const g = G(), y = gy(GLINT.x, GLINT.z);
      M.shot(V(GLINT.x + 2.4, y + 2.2, GLINT.z + 2.8), V(GLINT.x, y + 0.3, GLINT.z)); g.sim.mimoGo({ x: GLINT.x + 0.5, z: GLINT.z + 0.5 }, GLINT); await wait(0.9);
      for (let i = 0; i < 5; i++) { snd('dig'); g.w3d.fx.puff(GLINT.x, y + 0.2, GLINT.z, 6, 0.2, '#7a5a3a'); await wait(0.2); }
      s.trowelFound = true; if (built) built.glint.visible = false; G().save(); snd('chest'); g.sim.mimoSay('!', 1.2); await wait(0.6); g.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    UI.toast('Found: young Fermín’s little shovel!');
    M.think('Young {fermin}’s trowel! Take it back to him, by the oasis.', 5);
  }
  async function trowelGive() {
    const s = st(), P = () => who('fermin'); if (!P()) return;
    M.lock(true); try { M.frame2(P(), -1); await wait(0.3); await M.say(P(), ln('trowel.give')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.trowel, { tips: T().TIPS }); if (!r) { M.think('Young {fermin} is waiting: where was it?', 4); return; }
    TIME.grade('rp.trowel', r.letter);
    M.lock(true); try { const P2 = P(); M.frame2(P2, -1); await M.say(P2, ln('trowel.done')); s.trowelDone = true; G().state.coins = (G().state.coins || 0) + 5; UI.toast('+5 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }
  // ------------------------------------------------------------ side quest: «The first photograph» (where had everyone stood?)
  async function photoScene() {
    const s = st(), P = () => who('photo'); if (!P()) return;
    if (!s.photoAsked) {
      M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('photo.ask')); s.photoAsked = true; G().save(); } finally { M.lock(false); }
      M.think('The broken plate is in the little crate by the camera. Look at the pieces, then tell {photo}.', 5);
      return;
    }
    if (!s.plateSeen) { M.think('Look at the plate’s pieces first, in the crate by the camera.', 4); return; }
    if (!s.photo1) {
      const r = await M.ask(T().TASKS.photo1, { tips: T().TIPS }); if (!r) { M.think('{photo} is waiting: where had the professor stood?', 4); return; }
      TIME.grade('rp.photo1', r.letter); s.photo1 = r.letter; G().save();
      M.lock(true); try { M.frame2(P()); await M.say(P(), ln('photo.next')); } finally { M.lock(false); }
    }
    const r = await M.ask(T().TASKS.photo2, { tips: T().TIPS }); if (!r) { M.think('{photo} is waiting: and the quiet young man?', 4); return; }
    TIME.grade('rp.photo2', r.letter);
    M.lock(true);
    try {
      const g = G(), y = gy(CAMERA.x, CAMERA.z);
      M.shot(V(CAMERA.x - 3.0, y + 2.2, CAMERA.z + 3.6), V(DOOR.x, y + 1.6, DOOR.z)); await wait(0.7);
      snd('pip'); await wait(0.4); try { g.w3d.fx.sparkle(CAMERA.x, y + 1.5, CAMERA.z, 18, ['#ffffff', '#fff3c8']); } catch (e) { /* */ } snd('chime');
      TIME.flag('past', 'ruPhoto', true); TIME.refresh(); s.photoDone = true; G().save(); await wait(0.6);
      const P2 = P(); M.frame2(P2); await M.say(P2, ln('photo.done'));
      g.state.coins = (g.state.coins || 0) + 6; UI.toast('+6 coins'); snd('chest');
    } finally { M.lock(false); }
    M.think('The first dig’s photograph… Will it still be around today?', 5);
  }
  // the photograph: today on Elvira's table under the canopy, tomorrow on the stilt camp's post
  const PHOTO_AT = { now: { x: 147.6, z: 13.62, y: 0.98, ry: 0, look: { x: 147.4, z: 11.6 } }, future: { x: 146.0, z: 17.3, y: M.DECK_Y + 1.1, ry: 0, look: { x: 146.0, z: 18.6 } } };
  function photoTex(kind) {
    const l = lang(), title = M.plainT(T().NAMES.photoTitle[l] || T().NAMES.photoTitle.en);
    return TK.canvasTex(256, 200, (c, W0, H0) => {
      c.fillStyle = '#6b4a2e'; c.fillRect(0, 0, W0, H0); c.fillStyle = kind === 'future' ? '#a8a49a' : '#d8c8a8'; c.fillRect(14, 14, W0 - 28, H0 - 48);
      c.fillStyle = kind === 'future' ? '#6a665e' : '#7a5a3a'; c.fillRect(70, 30, 116, 92); c.fillStyle = '#2b2235'; c.fillRect(106, 70, 44, 52);
      const ppl = [[40, 120, 1], [58, 116, 1], [196, 118, 1], [214, 122, 1], [128, 126, 0.6]];
      for (const [x, y, s] of ppl) { c.fillStyle = kind === 'future' ? '#4a4640' : '#3a2a20'; c.beginPath(); c.arc(x, y - 30 * s, 8 * s, 0, TAU); c.fill(); c.fillRect(x - 8 * s, y - 22 * s, 16 * s, 26 * s); }
      c.fillStyle = '#f4efe2'; c.font = '600 15px Georgia, "Microsoft YaHei", "Yu Mincho", serif'; c.textAlign = 'center'; c.fillText(title.slice(0, 22), W0 / 2, H0 - 12);
    });
  }
  function photoMesh(w) {
    const P0 = PHOTO_AT[w], g = new THREE.Group(), m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.48), new THREE.MeshBasicMaterial({ map: photoTex(w) }));
    if (w === 'now') { m.position.set(P0.x, P0.y, P0.z); m.rotation.x = -1.1; }
    else { m.position.set(P0.x, P0.y, P0.z); }
    g.add(m); g.name = 'ru-photo-' + w; return { obj: g };
  }
  const photoLook = w => async () => {
    if (w === 'now') { M.lookAt('w.rup_photo', 'An old {w.rup_photo} in a frame on the table: the first dig, long ago, in front of the temple’s door. A young woman with a shovel, a little boy on a crate… Everyone but one: the quiet one was behind the {w.rup_camera}.', 9); const n = M.st('now'); if (!n.photoSeen) { n.photoSeen = true; G().save(); } return; }
    M.lookAt('w.rup_photo', 'The first dig’s {w.rup_photo}, nailed to a post of the stilt camp, faded by the salt. The temple’s door in it stood on dry ground.', 8);
  };
  TIME.effect('ruins.photo', { region: 'ruins', when: () => !!TIME.flag('past', 'ruPhoto'),
    show: { now: () => photoMesh('now'), future: () => photoMesh('future') },
    act: { now: { x: PHOTO_AT.now.look.x, z: PHOTO_AT.now.look.z, r: 1.3, label: 'Look', run: photoLook('now') }, future: { x: PHOTO_AT.future.look.x, z: PHOTO_AT.future.look.z, r: 1.3, y: M.DECK_Y, label: 'Look', run: photoLook('future') } } });

  // ------------------------------------------------------------ the Talk menus: side quests (the main path's scenes play straight off a Talk)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'past' || TIME.regionNow() !== 'ruins') return null;
    const s = st();
    if (it.who === 'past:farmer' && s.heard && s.heard.farmer && !s.markAsked) return [{ label: 'The flood line', sub: '◆ side quest', run: markAsk }];
    if (it.who === 'past:farmer' && s.markAsked && !s.markDone) return [{ label: 'The flood line', sub: '◆ side quest', run: markScene }];
    if (it.who === 'past:fermin' && s.heard && s.heard.fermin && !s.trowelAsked) return [{ label: 'Your trowel?', sub: '◆ side quest', run: trowelAsk }];
    if (it.who === 'past:fermin' && s.trowelFound && !s.trowelDone) return [{ label: 'Your trowel', sub: '◆ side quest', run: trowelGive }];
    if (it.who === 'past:photo' && s.met && !s.photoDone) return [{ label: 'The first photograph', sub: '◆ side quest', run: photoScene }];
    return null;
  });

  // ------------------------------------------------------------ E: the way in, and the things you can look at
  const LOOKS = [
    { id: 'w.rup_trench', at: { x: 140.6, z: -17.2 }, line: () => 'The dig’s {w.rup_trench}, full of river {w.rup_mud}. {w.rup_footprint:pl} cross it, going in through the door… and coming back out.' },
    { id: 'w.rup_notebook', at: { x: 151.4, z: 14.6 }, line: () => 'The professor’s {w.rup_notebook:pl}, back on the table, a little damp at the edges. A {w.rup_lamp} beside them, and a {w.rup_brush}.' },
    { id: 'w.rup_tent', at: { x: 154.4, z: 19.2 }, line: () => 'The first dig’s {w.rup_tent:pl}: old canvas, patched, a line of {w.rup_mud} along the bottom where the water came up.' },
    { id: 'w.rup_sieve', at: { x: 153.2, z: 18.8 }, line: () => 'A {w.rup_sieve} on its stand: they shake the {w.rup_earth} through it, looking for {w.rup_coin:pl} and {w.rup_bead:pl}… or a {w.rup_bone}.' },
    { id: 'w.rup_camera', at: { x: 138.8, z: -15.8 }, line: () => 'A big wooden {w.rup_camera} on a {w.rup_tripod}, a black cloth over its back. It’s pointed at the temple’s door.' },
    { id: 'w.rup_kiln', at: { x: 152.6, z: 25.8 }, line: () => '{potter}’s round {w.rup_kiln}, still warm, and a row of new {w.rup_bowl:pl} drying in the sun.' },
    { id: 'w.rup_frieze', at: { x: 144.6, z: -21.0 }, line: () => 'Over the door, a {w.rup_frieze} of carved birds… one of them is missing. Just a parrot-shaped gap in the stone.' },
    { id: 'w.rup_wheel', at: { x: 149.2, z: 28.2 }, line: () => '{potter}’s {w.rup_wheel}, a lump of red {w.rup_clay} on it, half a jar.' },
  ];
  function interactables() {
    const s = st(), out = [];
    out.push({ x: DOORSPOT.x, z: DOORSPOT.z, r: 1.8, label: s.joined ? 'Go in' : 'Look', run: async () => {
      if (!s.joined) { M.lookAt('w.rup_doorway', s.met ? 'The temple’s {w.rup_doorway}, dark and wet. {professor} won’t let anyone in until she knows what happened in the night.' : 'The temple’s door stands open, and a gray hum comes out of the dark. Better ask the people here first.', 5); return; }
      if (typeof RU_PTEMPLE !== 'undefined' && RU_PTEMPLE) await RU_PTEMPLE.enter();
    } });
    if (s.trowelAsked && !s.trowelFound) out.push({ x: GLINT.x + 0.6, z: GLINT.z - 0.6, r: 1.4, label: `Tell ${M.mimoName()}`, run: digScene });
    if (s.markAsked && !TIME.flag('past', 'ruMark')) out.push({ x: MARK.look.past.x, z: MARK.look.past.z, r: 1.5, label: 'Look', run: async () => { M.lookAt('w.rup_rock', 'A line of dry {w.rup_mud} across the red {w.rup_rock}, high above the path: that’s how high the water had come in the night. Just at the top of a red {w.rup_stone} set in the wall.', 7); s.markSeen = true; G().save(); } });
    if (s.photoAsked && !s.photoDone) out.push({ x: PLATE.x + 0.4, z: PLATE.z + 1.2, r: 1.3, label: 'Look', run: async () => { M.lookAt('w.rup_plate', 'The broken {w.rup_plate}: on one piece, the professor by the door; on another, the people round her… and on the last, only the corner of the {w.rup_camera}’s shadow.', 7); s.plateSeen = true; G().save(); } });
    for (const L0 of LOOKS) { if (L0.when && !L0.when()) continue; out.push({ x: L0.at.x, z: L0.at.z, r: 1.3, label: 'Look', run: async () => M.lookAt(L0.id, M.fillEn(L0.line()), 5.5) }); }
    return out;
  }
  function nextId() { const s = st(); return !s.met ? 'professor' : !s.elvira ? 'elvira' : heardN() < 3 ? 'heard' : !s.joined ? 'professor' : 'temple'; }
  const HINTS = { professor: '{mimo} points at a woman in a sun hat, by the trench at the temple.', elvira: '{mimo} points at a young woman by the Wall of Days.', temple: '{mimo} looks at the temple’s open door.',
    farmer: '{mimo} points at a woman in the fields by the cove.', fisher: '{mimo} points at a fisherwoman by her boat.', fermin: '{mimo} points at a little boy by the oasis.',
    photo: '{mimo} points at a man with a camera, in the temple court.', potter: '{mimo} points at a potter by the river.' };
  function target(id) {
    if (id === 'temple') return (typeof RU_PTEMPLE !== 'undefined' && RU_PTEMPLE && RU_PTEMPLE.inside && RU_PTEMPLE.target()) || { x: DOORSPOT.x, z: DOORSPOT.z, hint: HINTS.temple };
    if (id === 'heard') { const s = st(), n = M.HEARD.find(k => !(s.heard && s.heard[k])); if (!n) return target('professor'); id = n; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || '{mimo} points.' };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('ru_past') ? 'ru_past' : 'past');

  // ------------------------------------------------------------ the side quests (QUESTS.LIST: they start as the story reaches them)
  if (typeof QUESTS !== 'undefined') {
    const pS = s => M.sp(s), nS = s => M.sn(s);
    const pastAt = id => () => M.via('past', () => target(id));
    if (!QUESTS.LIST.some(q => q.id === 'ru.mark')) QUESTS.LIST.push({ id: 'ru.mark', kind: 'side',
      title: 'The flood line', get giver() { return M.fillEn('{farmer}, a farmer by the cove (the Sunken Ruins, long ago)'); },
      started: s => !!pS(s).markAsked,
      steps: [
        { text: 'In the Past: look at the mud on the rocks in the gully', why: 'The water left a line where it had come up to.', done: s => !!pS(s).markSeen || !!pS(s).markDone,
          target: () => M.via('past', () => ({ x: MARK.look.past.x, z: MARK.look.past.z, hint: '{mimo} points at a line of mud on the red rock.' })), hint: '{mimo} points at the red rock in the gully.' },
        { get text() { return M.fillEn('Tell {farmer} how high the water had come'); }, get why() { return M.fillEn(`What had happened in the night: ${M.sx('mark')}.`); },
          done: s => !!pS(s).markDone, target: pastAt('farmer'), hint: HINTS.farmer },
        { text: 'Today: is the mark still on the rock? Look in the gully', why: 'Carved in stone, long ago… stone lasts.',
          done: s => !!nS(s).markSeen, target: () => M.via('now', () => ({ x: MARK.look.now.x, z: MARK.look.now.z, hint: '{mimo} points high up the red rock in the gully.' })), hint: '{mimo} points at the rock in the gully.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'ru.trowel')) QUESTS.LIST.push({ id: 'ru.trowel', kind: 'side',
      get title() { return M.fillEn('Young {fermin}’s trowel'); }, get giver() { return M.fillEn('young {fermin}, by the oasis (the Sunken Ruins, long ago)'); },
      started: s => !!pS(s).trowelAsked,
      steps: [
        { text: 'In the Past: dig it out by the oasis palm (tell Mimo, as a memory)', why: 'The river carried it off. Something glints in the mud.', done: s => !!pS(s).trowelFound, target: () => M.via('past', () => ({ x: GLINT.x, z: GLINT.z, hint: '{mimo} sniffs the mud by the palm.' })), hint: '{mimo} sniffs the mud.' },
        { get text() { return M.fillEn('Give it back to young {fermin}, and tell him where it was'); }, why: 'He’s by the oasis.', done: s => !!pS(s).trowelDone, target: pastAt('fermin'), hint: HINTS.fermin },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'ru.photo')) QUESTS.LIST.push({ id: 'ru.photo', kind: 'side',
      title: 'The first photograph', get giver() { return M.fillEn('{photo}, the dig’s photographer (the Sunken Ruins, long ago)'); },
      started: s => !!pS(s).photoAsked,
      steps: [
        { get text() { return M.fillEn('In the Past: look at the broken plate, and tell {photo} where everyone had stood (2)'); }, why: 'He wants to take the picture again, exactly the same.',
          done: s => !!pS(s).photoDone, target: pastAt('photo'), hint: HINTS.photo },
        { text: 'Today: is the photograph still around? Look in the dig camp', why: 'Under the canopy, on the head archaeologist’s table…',
          done: s => !!nS(s).photoSeen, target: () => M.via('now', () => ({ x: PHOTO_AT.now.look.x, z: PHOTO_AT.now.look.z, hint: '{mimo} points at the table under the canopy.' })), hint: '{mimo} points at the canopy’s table.' },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks (TIME calls them: time.js "TIME dresses it")
  Object.assign(M.DRESS.past, {
    people: PEOPLE,
    on(api) { show(true); hid = M.hideToday(api, { past: true }); },
    off() { show(false); hid = []; },
    entered() { show(true); },
    late: (api, dt) => { if (typeof RU_PTEMPLE !== 'undefined' && RU_PTEMPLE && RU_PTEMPLE.inside) RU_PTEMPLE.late(dt); else late(dt); },
    update(api, dt, t) { update(dt, t); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, PEOPLE, who, build, show, LOOKS, MARK, wallX, PHOTO_AT, DOORSPOT,
    target: id => target(id), song: () => song(), init: () => {}, changed: () => {},
    _: { talk: id => talk(id), profScene, elviraScene, heardScene, joinScene, markAsk, markScene, trowelAsk, digScene, trowelGive, photoScene, get built() { return built; } } };
})();
