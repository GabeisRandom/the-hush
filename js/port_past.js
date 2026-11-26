'use strict';
// Port Brisa, long ago (DESIGN.md 20.1b "T4a"): the port in its busiest years, years after the concert, the sea fort brand new. TIME
// dresses it (time_port.js PORTT.DRESS.past): La Golondrina, a three-master gray and silent at the long pier (today's big ship and the
// boats at anchor are hidden by PORTT.holesOn), little sailing boats at the piers, a wooden cargo crane and stacks of cargo on the
// quay, the fishmonger's stall with fish on ice, nets, bunting over the promenade, new flags and a scaffold on the sea fort, the
// stonemason's bench by the beach. Today's people, the fort boat, Yuki's cat and the travelers' cases are hidden (PORTT.hideToday).
// The people of then (TIME's person kit): the harbor master (young Dora's mother), young Dora (today's harbor master), the
// fishmonger, the old fisherman, young Quino (today's boatman), young Abel the lamplighter (today's bridge keeper), the stonemason.
// Each language names its own (PTPTXT.CAST).
// The main path (PORTT.PSTEPS): the harbor master tells how La Golondrina came in («Anteayer yo estaba contando los barcos cuando
//   llegó La Golondrina…») and the card → young Dora's questions («El chico estaba cargando cajas cuando llegó la niebla»,
//   «Estabas buscando conchas») → the fishmonger, the fisherman and young Quino each tell what was going on aboard → «Los marineros
//   estaban cantando cuando llegó la niebla» → aboard La Golondrina (port_past_dungeon.js) → the Fog Octopus (port_time_boss.js) →
//   the echo → Noa.
// Side quests (QUESTS.LIST): «The storm plaque» (cross-time: tell the stonemason the story of the storm; today the plaque stands by
//   the beach and old Rui knows it, tomorrow it's worn gray and old Quino keeps it), «Young Dora's spyglass», «The sardine thief».
const PT_PAST = (() => {
  if (typeof TIME === 'undefined' || typeof PORTT === 'undefined' || !PORTT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = PORTT, T = () => PTPTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('past');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are (checked with PORTT._.t.probe in every world)
  const AT = {
    master: { x: -230.0, z: -99.0, yaw: -Math.PI / 2 }, dora: { x: -231.2, z: -88.8, yaw: -2.4 }, fishmonger: { x: -231.4, z: -74.8, yaw: -Math.PI / 2 },
    fisher: { x: -231.2, z: -104.4, yaw: -1.9 }, quino: { x: -231.0, z: -70.4, yaw: -Math.PI / 2 }, abel: { x: -230.4, z: -108.8, yaw: -1.2 }, mason: { x: -225.2, z: -60.8, yaw: 2.6 },
  };
  const SHIP = { x: -248.5, z: -66.2 }, PLANK = { x: -245.3, z: -70.6 }, STALL = { x: -233.2, z: -74.2 }, NETS = { x: -233.0, z: -104.9 }, CRANE = { x: -234.6, z: -96.2 };
  const CARGO = { x: -233.0, z: -97.6 }, BOLLARD = { x: -235.4, z: -77.4 }, BENCH = { x: -227.0, z: -59.4 }, DIG = { x: -229.8, z: -53.2 }, ANCHOR = { x: -229.4, z: -84.2 };
  const PLAQUE = { now: { x: -228.0, z: -58.4, ry: Math.PI / 2, look: { x: -226.6, z: -58.4 } } };     // (today and tomorrow: a stone by the beach, facing the city)
  const FORT = { x: -272, z: -86.5 };
  const C = () => T().CAST;
  const LOOK = {
    master: { skin: '#a8714a', hair: '#1f1a18', hairdo: 'bun', dress: '#2f3f6a', vest: '#f2c94c', hat: 'flat', hatColor: '#2f3f6a', h: 1.0 },
    dora: { kid: true, skin: '#a8714a', hair: '#1f1a18', hairdo: 'tails', ribbon: '#f2c94c', dress: '#4c7fd8', apron: '#f4efe2', h: 0.68 },
    fishmonger: { skin: '#e6b48c', hair: '#8a4a2a', hairdo: 'bun', dress: '#5f8a9a', apron: '#f4efe2', hat: 'scarf', hatColor: '#e2574c', wide: 1.1, h: 0.98 },
    fisher: { skin: '#c98e62', hair: '#e8e4dc', hairdo: 'bald', beard: true, stache: true, hair2: '#e8e4dc', dress: '#3f5f7a', vest: '#c9a24a', hat: 'flat', hatColor: '#3f4f66', h: 0.98 },
    quino: { skin: '#a8714a', hair: '#2e2420', hairdo: 'short', dress: '#f4efe2', vest: '#2f3f6a', hat: 'cap', hatColor: '#2f3f6a', h: 1.02 },
    abel: { skin: '#e6b48c', hair: '#5a3a26', hairdo: 'short', dress: '#6b7f5a', vest: '#4a5a6a', hat: 'flat', hatColor: '#5a6a7a', prop: 'lantern', stache: true, hair2: '#5a3a26', h: 1.0 },
    mason: { skin: '#efc29a', hair: '#5a3a26', hairdo: 'short', dress: '#b9ab94', apron: '#8a6440', hat: 'cap', hatColor: '#c9b48e', beard: true, hair2: '#5a3a26', wide: 1.15, h: 1.02 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('past', id);

  // ------------------------------------------------------------ La Golondrina: a three-master, gray until the moment plays on (a
  // material that drains to gray: uGray 1 → 0). Also tomorrow's (port_future.js): home again, old but freshly painted.
  function grayMat(start) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad }), u = { uGray: { value: start } };
    m.onBeforeCompile = sh => { sh.uniforms.uGray = u.uGray; sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.86, l * 0.92), uGray); }'); };
    m.customProgramCacheKey = () => 'pbShipGray';
    return { m, u };
  }
  function makeShip(o = {}) {
    const g = new THREE.Group(), k = PAST.API.Kit(), KG = PAST.API.KG, gm = grayMat(o.gray != null ? o.gray : 1);
    const HULL = o.hull || '#6b4428', STRIPE = o.stripe || '#f2c94c', SAIL = o.sail || '#f6efe0', WOOD = '#8a5a3a';
    // the hull: a long box with a rounded bow (−x), the waterline stripe, a raised stern castle (+x)
    k.box(0, 0.55, 0, 11.4, 1.7, 3.4, HULL, { ink: 0.02 }).box(0, 1.42, 0, 11.6, 0.12, 3.5, STRIPE, { ink: 0.008 }).box(0, -0.15, 0, 11.0, 0.4, 3.1, '#3a2a20', { ink: 0.008 });
    k.add(KG.cone, -6.7, 0.65, 0, 1.6, 2.4, 1.0, HULL, { rz: Math.PI / 2, ink: 0.02 }).add(KG.cone, -6.7, 1.42, 0, 1.68, 2.5, 1.04, STRIPE, { rz: Math.PI / 2, ink: 0 });
    k.box(4.6, 2.05, 0, 2.6, 1.3, 3.3, HULL, { ink: 0.016 }).box(4.6, 2.75, 0, 2.8, 0.12, 3.4, STRIPE, { ink: 0.008 });
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) k.add(KG.cyl, 4.0 + (i % 2) * 1.1, 2.1, s * 1.68, 0.16, 0.05, 0.16, '#f6e7a8', { rx: Math.PI / 2, ink: 0.004 });      // (the cabin's portholes)
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) k.add(KG.cyl, -4.4 + i * 1.5, 0.75, s * 1.72, 0.14, 0.04, 0.14, '#2b2235', { rx: Math.PI / 2, ink: 0 });
    // the deck's rail
    for (const s of [-1, 1]) k.box(-0.8, 1.68, s * 1.62, 10.4, 0.1, 0.08, WOOD, { ink: 0.006 });
    for (let i = 0; i < 9; i++) for (const s of [-1, 1]) k.box(-5.6 + i * 1.2, 1.55, s * 1.62, 0.07, 0.3, 0.07, WOOD, { ink: 0 });
    // the bowsprit and the figurehead (a swallow)
    k.rod([-6.4, 1.6, 0], [-9.6, 2.6, 0], 0.08, WOOD, 0.006);
    k.add(KG.sphere, -7.7, 1.25, 0, 0.42, 0.24, 0.2, '#2f3f6a', { rz: 0.4, ink: 0.008 }).add(KG.cone, -8.05, 1.37, 0, 0.08, 0.22, 0.06, '#f2a03a', { rz: Math.PI / 2, ink: 0.004 });
    for (const s of [-1, 1]) k.add(KG.sphere, -7.5, 1.3, s * 0.24, 0.36, 0.06, 0.2, '#2f3f6a', { rx: s * 0.6, ink: 0.004 });
    // three masts with yards; the sails (half up, or furled)
    const sailY = o.sailsUp ? 1 : 0.5;
    for (const [x, h] of [[-3.6, 8.2], [0.4, 9.2], [3.4, 7.0]]) {
      k.add(KG.cyl6, x, 1.6 + h / 2, 0, 0.13, h, 0.13, WOOD, { ink: 0.01 });
      for (const yy of [0.5, 0.78]) { k.add(KG.cyl, x, 1.6 + h * yy, 0, 0.06, 3.0 * (1.15 - yy * 0.5), 0.06, WOOD, { rx: Math.PI / 2, ink: 0.004 }); }
      k.box(x + 0.05, 1.6 + h * (0.5 + 0.14 * sailY) - 0.4 * (1 - sailY), 0, 0.06, h * 0.26 * sailY + 0.25, 2.4 * (1.15 - 0.5 * 0.5), SAIL, { ink: 0.008 });
      k.box(x + 0.05, 1.6 + h * (0.78 + 0.1 * sailY) - 0.3 * (1 - sailY), 0, 0.06, h * 0.18 * sailY + 0.2, 2.0 * (1.15 - 0.78 * 0.5), SAIL, { ink: 0.008 });
      k.rod([x, 1.6 + h, 0], [x + (x < 0 ? -2.6 : 2.4), 1.7, 0], 0.02, '#4a3a30', 0);
    }
    // the little flag on the mainmast
    k.box(0.75, 1.6 + 9.2 + 0.25, 0, 0.7, 0.4, 0.03, o.flag || '#e2574c', { ink: 0.004 });
    k.build(g, { mat: gm.m });
    g.position.set(SHIP.x, o.y != null ? o.y : -0.25, SHIP.z);
    return { g, gm };
  }

  // ------------------------------------------------------------ the dressing: one merged mesh (and its ink hull) per group
  let built = null;
  const kit = () => PAST.API.Kit();
  function sailboat(k, x, z, ry, col, sail) {
    const c = Math.cos(ry), s = Math.sin(ry), at = (dx, dz) => [x + dx * c + dz * s, z - dx * s + dz * c], y = -0.45, KG = PAST.API.KG;
    const [hx, hz] = at(0, 0);
    k.box(hx, y + 0.3, hz, 3.0, 0.5, 1.1, col, { ry, ink: 0.012 }).box(hx, y + 0.56, hz, 3.1, 0.06, 1.16, '#f4efe2', { ry, ink: 0.004 });
    const [bx, bz] = at(-1.7, 0); k.add(KG.cone, bx, y + 0.3, bz, 0.5, 0.6, 0.35, col, { ry, rz: Math.PI / 2, ink: 0.01 });
    const [mx, mz] = at(0.2, 0); k.rod([mx, y + 0.55, mz], [mx, y + 3.6, mz], 0.05, '#6b4a30', 0.006);
    k.add(KG.cone4, mx, y + 2.2, mz, 0.06, 2.6, 1.2, sail, { ry: ry + Math.PI / 2, ink: 0.006 });
  }
  function props(k) {
    const KG = PAST.API.KG;
    // little fishing boats with sails at the fish pier and the ferry pier (today's rowboats are hidden)
    sailboat(k, -244.6, -109.8, 0.3, '#4c7fd8', '#f6efe0'); sailboat(k, -248.8, -102.6, -0.2, '#e2574c', '#f2e4c4'); sailboat(k, -247.4, -90.6, 0.15, '#5fb257', '#f6efe0'); sailboat(k, -253.6, -82.6, 0.5, '#f2c94c', '#efe6d6');
    // the wooden cargo crane on the quay: a post, a jib out over the water, a rope and a crate hanging
    let y = gy(CRANE.x, CRANE.z);
    k.box(CRANE.x, y + 0.25, CRANE.z, 1.3, 0.5, 1.3, '#8a6440', { ink: 0.012 }).add(KG.cyl6, CRANE.x, y + 2.6, CRANE.z, 0.16, 4.8, 0.16, '#8a6440', { ink: 0.01 });
    k.rod([CRANE.x, y + 4.6, CRANE.z], [CRANE.x - 4.2, y + 5.4, CRANE.z + 0.2], 0.09, '#8a6440', 0.008).rod([CRANE.x, y + 2.4, CRANE.z], [CRANE.x - 2.6, y + 5.0, CRANE.z + 0.1], 0.06, '#8a6440', 0.006);
    k.rod([CRANE.x - 4.1, y + 5.4, CRANE.z + 0.2], [CRANE.x - 4.1, y + 2.2, CRANE.z + 0.2], 0.02, '#4a3a30', 0).box(CRANE.x - 4.1, y + 1.85, CRANE.z + 0.2, 0.8, 0.7, 0.8, '#b8955a', { ry: 0.3, ink: 0.01 });
    k.add(KG.cyl, CRANE.x + 0.55, y + 1.2, CRANE.z, 0.25, 0.5, 0.25, '#6b4a30', { rx: Math.PI / 2, ink: 0.006 });
    // cargo on the quay: crates, sacks, barrels
    y = gy(CARGO.x, CARGO.z);
    for (let i = 0; i < 5; i++) k.box(CARGO.x - 0.5 + (i % 3) * 0.75, y + 0.35 + (i > 2 ? 0.7 : 0), CARGO.z + (i > 2 ? 0.1 : 0), 0.7, 0.7, 0.7, i % 2 ? '#b8955a' : '#c9a46a', { ry: i * 0.2, ink: 0.01 });
    for (let i = 0; i < 3; i++) k.add(KG.sphere, CARGO.x + 1.4, y + 0.28 + i * 0.36, CARGO.z - 0.5 + i * 0.1, 0.42, 0.24, 0.32, '#d8c8a0', { ry: i, ink: 0.008 });
    for (let i = 0; i < 2; i++) k.add(KG.cyl, CARGO.x - 1.4, y + 0.45, CARGO.z - 0.4 + i * 0.85, 0.38, 0.9, 0.38, '#8a5a3a', { ink: 0.01 });
    // the fishmonger's stall: a table, fish on ice, a scale, a sign
    y = gy(STALL.x, STALL.z);
    k.box(STALL.x, y + 0.75, STALL.z, 1.0, 0.08, 2.1, '#a8743f', { ink: 0.01 });
    for (const [dx, dz] of [[-0.4, -0.95], [0.4, -0.95], [-0.4, 0.95], [0.4, 0.95]]) k.box(STALL.x + dx, y + 0.37, STALL.z + dz, 0.07, 0.74, 0.07, '#6b4a30', { ink: 0 });
    k.box(STALL.x, y + 0.83, STALL.z - 0.4, 0.8, 0.08, 0.9, '#e4f2f6', { ink: 0.004 });
    for (let i = 0; i < 7; i++) k.add(KG.sphere, STALL.x - 0.25 + (i % 2) * 0.35, y + 0.9, STALL.z - 0.75 + i * 0.12, 0.2, 0.06, 0.07, ['#c9d3dc', '#aab6c2', '#d9a27a'][i % 3], { ry: 0.3 + i * 0.4, ink: 0.004 });
    k.add(KG.cyl, STALL.x, y + 0.86, STALL.z + 0.6, 0.12, 0.12, 0.12, '#c9a24a', { ink: 0.004 }).box(STALL.x, y + 1.05, STALL.z + 0.6, 0.5, 0.03, 0.03, '#c9a24a', { ink: 0 })
      .add(KG.cyl, STALL.x - 0.22, y + 0.98, STALL.z + 0.6, 0.12, 0.02, 0.12, '#c9a24a', { ink: 0 }).add(KG.cyl, STALL.x + 0.22, y + 0.98, STALL.z + 0.6, 0.12, 0.02, 0.12, '#c9a24a', { ink: 0 });
    k.add(KG.cyl6, STALL.x - 0.5, y + 1.3, STALL.z + 1.0, 0.03, 1.3, 0.03, '#6b4a30', { ink: 0 }).box(STALL.x - 0.5, y + 1.95, STALL.z + 1.0, 0.04, 0.4, 0.9, '#f4efe2', { ink: 0.004 });
    // the fisherman's nets in a heap, floats and a basket
    y = gy(NETS.x, NETS.z);
    k.add(KG.sphere, NETS.x, y + 0.2, NETS.z, 0.9, 0.3, 0.7, '#7a8a6a', { ink: 0.008 }).add(KG.sphere, NETS.x + 0.5, y + 0.35, NETS.z + 0.2, 0.5, 0.25, 0.4, '#8a9a7a', { ink: 0.006 });
    for (let i = 0; i < 6; i++) k.add(KG.ball6, NETS.x - 0.6 + i * 0.25, y + 0.45, NETS.z + Math.sin(i) * 0.3, 0.08, 0.08, 0.08, i % 2 ? '#f2a03a' : '#f4efe2', { ink: 0 });
    // the boy's bollard (where he sat every evening), and an old anchor against the wall
    y = gy(BOLLARD.x, BOLLARD.z);
    k.add(KG.cyl, BOLLARD.x, y + 0.35, BOLLARD.z, 0.26, 0.7, 0.26, '#3a3046', { ink: 0.01 }).add(KG.cyl, BOLLARD.x, y + 0.72, BOLLARD.z, 0.32, 0.08, 0.32, '#3a3046', { ink: 0.006 });
    y = gy(ANCHOR.x, ANCHOR.z);
    k.rod([ANCHOR.x, y + 0.05, ANCHOR.z], [ANCHOR.x + 0.1, y + 1.3, ANCHOR.z], 0.07, '#4a5a6a', 0.006).box(ANCHOR.x + 0.08, y + 1.15, ANCHOR.z, 0.5, 0.07, 0.07, '#4a5a6a', { ink: 0.004 });
    k.add(KG.torus, ANCHOR.x, y + 0.2, ANCHOR.z, 0.42, 0.42, 0.8, '#4a5a6a', { rz: Math.PI, ink: 0.004 });
    // bunting over the promenade, lamp post to quay pole
    for (const z of [-105, -87, -78]) {
      const x0 = -228.6, x1 = -235.9, y0 = 0.6; k.add(KG.cyl6, x1, y0 + 2.0, z, 0.05, 4.0, 0.05, '#6b4a30', { ink: 0 });
      for (let i = 0; i <= 8; i++) { const u = i / 8, x = x0 + (x1 - x0) * u, yy = y0 + 3.5 - Math.sin(u * Math.PI) * 0.45; k.add(KG.cone4, x, yy - 0.12, z, 0.14, 0.26, 0.02, ['#e2574c', '#f2c94c', '#4c7fd8', '#5fb257'][i % 4], { rx: Math.PI, ink: 0 }); }
      k.rod([x0, y0 + 3.55, z], [x1, y0 + 3.55, z], 0.008, '#4a3a30', 0);
    }
    // the stonemason's bench by the beach (the slab on it is the 'port.plaque' effect), his chisel and hammer
    y = gy(BENCH.x, BENCH.z);
    k.box(BENCH.x, y + 0.5, BENCH.z, 1.4, 0.1, 0.8, '#a8743f', { ink: 0.01 });
    for (const [dx, dz] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) k.box(BENCH.x + dx, y + 0.25, BENCH.z + dz, 0.08, 0.5, 0.08, '#6b4a30', { ink: 0 });
    k.box(BENCH.x + 0.55, y + 0.58, BENCH.z + 0.28, 0.3, 0.05, 0.05, '#8a8a90', { ink: 0 }).box(BENCH.x + 0.45, y + 0.58, BENCH.z - 0.25, 0.08, 0.06, 0.3, '#6b4a30', { ink: 0 });
    for (let i = 0; i < 3; i++) k.box(BENCH.x - 1.2 + i * 0.3, y + 0.15, BENCH.z + 0.8, 0.5, 0.3, 0.4, '#c9c2b6', { ry: i, ink: 0.008 });
    // the sea fort, brand new: flags on the tower and the walls, a scaffold up its north side
    const fy = 0.95;
    for (const [dx, dz, h, c] of [[0, 0, 13.4, '#e2574c'], [4.2, -3.0, 5.6, '#f2c94c'], [4.2, 3.0, 5.6, '#4c7fd8'], [-4.4, 2.6, 5.2, '#5fb257']]) {
      k.add(KG.cyl6, FORT.x + dx, fy + h - 0.9, FORT.z + dz, 0.05, 1.8, 0.05, '#6b4a30', { ink: 0 }).box(FORT.x + dx + 0.45, fy + h - 0.3, FORT.z + dz, 0.9, 0.5, 0.03, c, { ink: 0.004 });
    }
    for (let i = 0; i < 3; i++) for (const dx of [-1.2, 1.2]) k.rod([FORT.x + dx, fy + i * 2.6, FORT.z - 2.6], [FORT.x + dx, fy + (i + 1) * 2.6, FORT.z - 2.6], 0.05, '#a8743f', 0.004);
    for (let i = 1; i <= 3; i++) k.box(FORT.x, fy + i * 2.6, FORT.z - 2.7, 2.8, 0.08, 0.6, '#c79d6d', { ink: 0.004 });
  }
  // the gray fog round La Golondrina (until the moment plays on), and young Dora's spyglass glinting in the sand
  function fogPuffs() {
    const tex = TK.canvasTex(64, 64, c => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(196,194,204,0.9)'); g.addColorStop(1, 'rgba(196,194,204,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }), out = [];
    for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(mat); s.position.set(SHIP.x - 7 + (i % 7) * 2.2, 1.2 + (i % 3) * 1.4, SHIP.z + (i < 7 ? -2.2 : 2.0)); s.scale.setScalar(3.4 + (i % 4) * 0.6); s.userData.a = i * 0.9; s.visible = false; G().w3d.scene.add(s); out.push(s); }
    return out;
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'pb-past-' + name; const k = kit(); fn(k); k.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), ship: makeShip({ gray: TIME.flag('past', 'pbShip') ? 0 : 1, sailsUp: false }), fog: fogPuffs(), solids: [] };
    built.ship.g.name = 'pb-past-ship'; built.ship.g.visible = false; scene.add(built.ship.g);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3c8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    gl.scale.setScalar(0.7); gl.position.set(DIG.x, gy(DIG.x, DIG.z) + 0.25, DIG.z); gl.visible = false; scene.add(gl); built.glint = gl;
    // the sardine thief (a little orange cat, by the stall)
    const cat = new THREE.Group(), kc = kit(), KG = PAST.API.KG;
    kc.add(KG.sphere, 0, 0.22, 0, 0.18, 0.15, 0.28, '#f29a3a', { ink: 0.01 }).add(KG.sphere, 0, 0.4, -0.24, 0.13, 0.12, 0.12, '#f29a3a', { ink: 0.01 });
    for (const s of [-1, 1]) kc.add(KG.cone, s * 0.07, 0.53, -0.24, 0.04, 0.09, 0.03, '#f29a3a', { ink: 0.004 });
    kc.rod([0, 0.24, 0.26], [0, 0.45, 0.42], 0.03, '#e0843a', 0.004).add(KG.sphere, 0, 0.36, -0.38, 0.14, 0.04, 0.05, '#c9d3dc', { ink: 0.004 });
    kc.build(cat); cat.visible = false; cat.name = 'pb-past-cat'; scene.add(cat); built.cat = cat;
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    add(CRANE.x, CRANE.z, 0.8); add(CARGO.x, CARGO.z, 1.2); add(CARGO.x + 1.4, CARGO.z - 0.3, 0.5); add(CARGO.x - 1.4, CARGO.z, 0.5); add(STALL.x, STALL.z - 0.6, 0.55); add(STALL.x, STALL.z + 0.6, 0.55);
    add(NETS.x, NETS.z, 0.8); add(BOLLARD.x, BOLLARD.z, 0.3); add(ANCHOR.x, ANCHOR.z, 0.35); add(BENCH.x, BENCH.z, 0.8);
    WORLD.extra.push(...built.solids);
    return built;
  }
  const solidsOn = on => { if (built) built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); };
  function show(on) {
    const B = build(), s = st();
    B.props.visible = on; B.ship.g.visible = on;
    B.fog.forEach(f => { f.visible = on && !TIME.flag('past', 'pbShip'); });
    B.glint.visible = on && !!s.spyAsked && !s.spyFound;
    B.cat.visible = false;
    solidsOn(on);
  }
  let hid = [];
  function update(dt, t) {
    const B = built; if (!B) return;
    const freed = !!TIME.flag('past', 'pbShip'), want = freed ? 0 : 1, u = B.ship.gm.u.uGray;
    u.value += (want - u.value) * Math.min(1, dt * 0.8);
    B.ship.g.rotation.x = Math.sin(t * 0.7) * 0.012; B.ship.g.position.y = -0.25 + Math.sin(t * 0.9) * 0.04;
    for (const f of B.fog) { f.visible = B.props.visible && !freed; if (f.visible) f.position.y += Math.sin(t * 0.5 + f.userData.a) * 0.003; }
    if (B.glint.visible) { B.glint.material.opacity = 0.35 + 0.35 * Math.max(0, Math.sin(t * 3.2)); }
  }
  function late(dt) { M.showToday(dt, hid); }

  // ------------------------------------------------------------ talking to the people of then (the main path first; side quests come
  // through STORY.talkHooks below, as a little menu)
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const chats = {};
  const cycle = (id, keys) => { chats[id] = ((chats[id] || 0) + 1) % keys.length; return say1(id, keys[chats[id]]); };
  const heardN = () => M.HEARD.filter(k => st().heard && st().heard[k]).length;
  function talk(id) {
    const s = st(), done = !!TIME.flag('past', 'pbShip');
    switch (id) {
      case 'master': return !s.met ? masterScene() : !s.joined ? (s.dora && heardN() >= 3 ? sailorsAsk() : say1('master', 'master.again')) : done ? cycle('master', ['master.done', 'master.chat1', 'master.chat2']) : cycle('master', ['master.ok', 'master.chat1', 'master.chat2']);
      case 'dora': return !s.dora ? doraScene() : cycle('dora', ['dora.chat1', 'dora.chat2', 'dora.after']);
      case 'fishmonger': case 'fisher': case 'quino': return !(s.heard && s.heard[id]) ? heardScene(id) : say1(id, id + '.chat');
      case 'abel': return cycle('abel', ['abel.1', 'abel.2', 'abel.3']);
      case 'mason': return cycle('mason', ['mason.1', 'mason.2']);
      default: return null;
    }
  }
  // the main path, 1: the harbor master tells how La Golondrina came in (a story: what was going on, what came), the card, the task
  async function masterScene() {
    const s = st(), B = () => who('master'); if (!B()) return;
    M.lock(true);
    try { M.frame2(B()); await wait(0.4); await M.say(B(), ln('master.hello')); await M.demo(B(), T().DEMO['master.demo'], T().MARKS['master.demo']); } finally { M.lock(false); }
    await M.card(T().CARDS.story);
    M.lock(true); try { M.frame2(B()); await M.say(B(), ln('master.task')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('Young {dora} is on the promenade, by the ferry pier. The fishmonger, the old fisherman and young {quino} are along the quay.', 5.5);
  }
  // the main path, 2: young Dora's questions: what was the boy doing? and what was she doing?
  async function doraScene() {
    const s = st(), K = () => who('dora'); if (!K()) return;
    if (!s.doraDemo) {
      M.lock(true); try { M.frame2(K()); await wait(0.3); await M.say(K(), ln('dora.hello')); await M.demo(K(), T().DEMO['dora.demo'], T().MARKS['dora.demo']); s.doraDemo = true; G().save(); } finally { M.lock(false); }
    }
    if ((s.doraQ || 0) < 1) {
      M.lock(true); try { M.frame2(K()); await M.say(K(), ln('dora.q1')); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.boy, { tips: T().TIPS }); if (!r) { M.think('Young {dora} is waiting: what was the boy doing when the fog came?', 4.5); return; }
      TIME.grade('pb.boy', r.letter); s.doraQ = 1; G().save();
    }
    if ((s.doraQ || 0) < 2) {
      M.lock(true); try { M.frame2(K()); await M.say(K(), ln('dora.q2')); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.you, { tips: T().TIPS }); if (!r) { M.think('Young {dora} is waiting: and what was she doing?', 4.5); return; }
      TIME.grade('pb.you', r.letter); s.doraQ = 2; G().save();
    }
    M.lock(true); try { M.frame2(K()); await M.say(K(), ln('dora.after')); s.dora = true; G().save(); } finally { M.lock(false); }
    M.think(heardN() >= 3 ? 'Back to {master}, by the white office: tell her what the sailors were doing.' : 'Now the others along the quay: what was going on aboard?', 5);
  }
  // the main path, 3: each of the three tells what was going on aboard
  async function heardScene(id) {
    const s = st(), P = () => who(id); if (!P()) return;
    M.lock(true);
    try { M.frame2(P(), id === 'quino' ? -1 : 1); await wait(0.3); await M.demo(P(), T().DEMO[id + '.demo'], T().MARKS[id + '.demo']); await M.say(P(), ln(id + '.after')); (s.heard || (s.heard = {}))[id] = true; G().save(); } finally { M.lock(false); }
    const n = heardN();
    M.think(n >= 3 ? (s.dora ? 'That’s all three. Tell {master}, by the white office, what the sailors were doing.' : 'That’s all three. Young {dora}, on the promenade, followed the quiet boy everywhere.') : `What was going on aboard (${n}/3).`, 5);
  }
  // the main path, 4: «¿Qué estaban haciendo los marineros…?» → «Estaban cantando cuando llegó la niebla»
  async function sailorsAsk() {
    const s = st(), B = () => who('master'); if (!B()) return;
    M.lock(true); try { M.frame2(B()); await wait(0.3); await M.say(B(), ln('master.ask')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.sailors, { tips: T().TIPS }); if (!r) { M.think('{master} is waiting: what were the sailors doing when the fog came?', 4.5); return; }
    TIME.grade('pb.sailors', r.letter);
    M.lock(true); try { M.frame2(B()); await M.say(B(), ln('master.ok')); s.joined = true; G().save(); } finally { M.lock(false); }
    M.think('The gangplank at the long pier is clear now. Aboard, every moment stopped when the fog came.', 5);
  }

  // ------------------------------------------------------------ side quest: «The storm plaque» (the Past changes today and tomorrow)
  async function plaqueAsk() {
    const s = st(), P = () => who('fisher'); if (!P()) return;
    M.lock(true); try { M.frame2(P()); await wait(0.3); await M.say(P(), ln('plaque.ask')); await M.demo(P(), T().DEMO['plaque.demo'], T().MARKS['plaque.demo']); s.plaqueAsked = true; G().save(); } finally { M.lock(false); }
    M.think('{mason} is at his bench by the beach. Tell him the story, for the plaque.', 5);
  }
  async function plaqueScene() {
    const s = st(), P = () => who('mason'); if (!P()) return;
    for (const [k, key] of [['storm', 'pb.storm'], ['lamps', 'pb.lamps']]) {
      if ((s.plaque || {})[k]) continue;
      const r = await M.ask(T().TASKS[k], { tips: T().TIPS, icon: 'star' }); if (!r) { M.think('{mason} is waiting, chisel in hand: how does the story go?', 4.5); return; }
      TIME.grade(key, r.letter); (s.plaque || (s.plaque = {}))[k] = r.letter; G().save();
      if (k === 'storm') { M.lock(true); try { M.frame2(P()); await M.say(P(), ln('plaque.next')); } finally { M.lock(false); } }
    }
    M.lock(true);
    try {
      const y = gy(BENCH.x, BENCH.z);
      M.shot(V(BENCH.x + 2.2, y + 2.0, BENCH.z - 2.4), V(BENCH.x, y + 0.7, BENCH.z)); await wait(0.6);
      for (let i = 0; i < 6; i++) { snd('click'); G().w3d.fx.puff(BENCH.x, y + 0.8, BENCH.z, 4, 0.12, '#c9c2b6'); await wait(0.18); }
      TIME.flag('past', 'pbPlaque', true); TIME.refresh(); s.plaqueDone = true; G().save();
      snd('learned'); await wait(0.6);
      const P2 = P(); M.frame2(P2); await M.say(P2, ln('plaque.done'));
      G().state.coins = (G().state.coins || 0) + 8; UI.toast('+8 coins'); snd('chest');
    } finally { M.lock(false); }
    M.think('A story carved in stone, by the beach… Will it still be there today?', 5);
  }
  // the plaque: long ago on the bench (blank, then carved), today a stone by the beach, tomorrow worn gray
  function plaqueTex(kind) {
    const l = lang(), N = T().NAMES, title = M.plainT(N.plaqueTitle[l] || N.plaqueTitle.en), body = kind === 'blank' ? '' : M.plainT(N.plaqueText[l] || N.plaqueText.en);
    return TK.canvasTex(320, 220, (c, W0, H0) => {
      const gray = kind === 'future';
      c.fillStyle = gray ? '#8f8c92' : '#cfc8b8'; c.fillRect(0, 0, W0, H0);
      c.strokeStyle = gray ? '#6a6670' : '#9a9282'; c.lineWidth = 10; c.strokeRect(5, 5, W0 - 10, H0 - 10);
      if (kind === 'blank') return;
      c.fillStyle = gray ? '#4a4650' : '#3a3428'; c.textAlign = 'center'; c.font = '700 22px Georgia, "Microsoft YaHei", "Yu Mincho", serif'; c.fillText(title.slice(0, 30), W0 / 2, 40);
      c.font = '15px Georgia, "Microsoft YaHei", "Yu Mincho", serif';
      const lines = [], cjk = /[぀-ヿ一-鿿]/.test(body), max = cjk ? 15 : 34;
      if (cjk) { for (let i = 0; i < body.length; i += max) lines.push(body.slice(i, i + max)); }
      else { let cur = ''; for (const w of body.split(' ')) { if ((cur + ' ' + w).trim().length > max) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; } if (cur.trim()) lines.push(cur.trim()); }
      lines.slice(0, 7).forEach((s, i) => c.fillText(s, W0 / 2, 72 + i * 21));
      if (gray) { c.fillStyle = 'rgba(120,130,120,0.5)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc((i * 71) % W0, (i * 53) % H0, 6 + (i % 4) * 3, 0, TAU); c.fill(); } }
    });
  }
  function plaqueMesh(w) {
    const g = new THREE.Group(), kind = w === 'future' ? 'future' : w === 'blank' ? 'blank' : 'now';
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.76), new THREE.MeshBasicMaterial({ map: plaqueTex(kind) }));
    if (w === 'past' || w === 'blank') { const y = gy(BENCH.x, BENCH.z); m.position.set(BENCH.x, y + 0.57, BENCH.z); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.PI; g.add(m); g.name = 'pb-plaque-' + w; return { obj: g }; }
    // today and tomorrow: set upright on a stone plinth by the beach, facing the city (east)
    const P0 = PLAQUE.now, y = gy(P0.x, P0.z), k = kit(), stone = w === 'future' ? '#7f7a80' : '#b9b2a6';
    k.box(P0.x, y + 0.35, P0.z, 0.5, 0.7, 1.5, stone, { ink: 0.01 }).box(P0.x - 0.05, y + 1.1, P0.z, 0.22, 0.95, 1.32, stone, { ink: 0.01 });
    if (w === 'future') for (let i = 0; i < 6; i++) k.add(PAST.API.KG.ball6, P0.x + 0.15, y + 0.55 + (i % 3) * 0.25, P0.z - 0.6 + i * 0.22, 0.06, 0.05, 0.06, '#d8d4c8', { ink: 0 });
    k.build(g);
    m.position.set(P0.x + 0.07, y + 1.1, P0.z); m.rotation.y = P0.ry; g.add(m); g.name = 'pb-plaque-' + w;
    return { obj: g, solids: [{ x: P0.x, z: P0.z, r: 0.6 }] };
  }
  const plaqueLook = w => async () => {
    const l = lang(), N = T().NAMES, tx = M.plainT(N.plaqueText[l] || N.plaqueText.en);
    if (w === 'past') { M.lookAt('w.pb_plaque', `{mason}’s new {w.pb_plaque}, the letters fresh from the {w.pb_chisel}: «${tx}»`, 8); return; }
    if (w === 'now') {
      M.lookAt('w.pb_plaque', `An old stone {w.pb_plaque} by the beach, smooth from the salt wind: «${tx}» Somebody carved it long ago, the winter of a great {w.pb_storm}.`, 9);
      const n = M.st('now'); if (!n.plaqueSeen) { n.plaqueSeen = true; G().save(); }
      return;
    }
    M.lookAt('w.pb_plaque', `The same {w.pb_plaque}, worn gray, barnacles on its foot… but you can still read it: «${tx}»`, 8);
    const f = M.st('future'); if (!f.plaqueSeen) { f.plaqueSeen = true; G().save(); }
  };
  TIME.effect('port.plaque', { region: 'port', when: () => !!TIME.flag('past', 'pbPlaque'),
    show: { past: () => plaqueMesh('past'), now: () => plaqueMesh('now'), future: () => plaqueMesh('future') },
    before: { past: () => plaqueMesh('blank') },
    act: { past: { x: BENCH.x + 0.4, z: BENCH.z + 1.2, r: 1.2, label: 'Look', run: plaqueLook('past') }, now: { x: PLAQUE.now.look.x, z: PLAQUE.now.look.z, r: 1.3, label: 'Look', run: plaqueLook('now') },
      future: { x: PLAQUE.now.look.x, z: PLAQUE.now.look.z, r: 1.3, label: 'Look', run: plaqueLook('future') } } });
  // today: old Rui (port.js) knows the story (his Talk has no id: he's matched by where he stands)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || !TIME.flag('past', 'pbPlaque') || it.who) return null;
    const B = M.B(), R = B && B.people && B.people.find(p => p.id === 'rui'); if (!R || Math.hypot(it.x - R.x, it.z - R.z) > 0.8) return null;
    return [{ label: 'The storm plaque', run: async () => { M.lock(true); try { R.talking = true; const p = { id: 'rui', name: 'Rui', x: R.x, y: R.y, z: R.z, top: 2.15 }; M.frame2(p); await M.say(p, ln('now.rui.plaque')); const n = M.st('now'); n.ruiPlaque = true; G().save(); } finally { R.talking = false; M.lock(false); } } }];
  });

  // ------------------------------------------------------------ side quest: «Young Dora's spyglass» (a memory: {mimo} dug in the sand)
  async function spyAsk() {
    const s = st(), K = () => who('dora'); if (!K()) return;
    M.lock(true); try { M.frame2(K()); await wait(0.3); await M.say(K(), ln('spy.ask')); await M.demo(K(), T().DEMO['spy.demo'], T().MARKS['spy.demo']); s.spyAsked = true; G().save(); } finally { M.lock(false); }
    if (built) built.glint.visible = true;
    M.think('Something glints in the sand on the beach. Tell {mimo} what it did, as a memory.', 5);
  }
  async function digScene() {
    const s = st();
    const r = await M.ask(M.memTask(T().MEM.dig), { icon: 'dig' }); if (!r) { M.think('Something glints in the sand. Tell {mimo} what it did, as a memory.', 4); return; }
    TIME.grade('pb.dig', r.letter);
    M.lock(true);
    try {
      const g = G(), y = gy(DIG.x, DIG.z);
      M.shot(V(DIG.x + 2.4, y + 2.2, DIG.z - 2.8), V(DIG.x, y + 0.3, DIG.z)); g.sim.mimoGo({ x: DIG.x + 0.5, z: DIG.z - 0.5 }, DIG); await wait(0.9);
      for (let i = 0; i < 5; i++) { snd('dig'); g.w3d.fx.puff(DIG.x, y + 0.2, DIG.z, 6, 0.2, '#e9d9a8'); await wait(0.2); }
      s.spyFound = true; if (built) built.glint.visible = false; G().save(); snd('chest'); g.sim.mimoSay('!', 1.2); await wait(0.6); g.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    UI.toast('Found: young Dora’s spyglass!');
    M.think('Young {dora}’s spyglass! Take it back to her, on the promenade.', 5);
  }
  async function spyGive() {
    const s = st(), K = () => who('dora'); if (!K()) return;
    M.lock(true); try { M.frame2(K()); await wait(0.3); await M.say(K(), ln('spy.found')); s.spyDone = true; G().state.coins = (G().state.coins || 0) + 5; UI.toast('+5 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }
  // ------------------------------------------------------------ side quest: «The sardine thief» (tell young Quino what happened)
  async function catScene() {
    const s = st(), F = () => who('fishmonger'); if (!F()) return;
    M.lock(true);
    try {
      const B = build(), y = gy(STALL.x, STALL.z), F2 = F();
      M.frame2(F2); await wait(0.3);
      B.cat.visible = true; B.cat.position.set(STALL.x - 0.2, y + 0.82, STALL.z - 0.5); B.cat.rotation.y = 0.5;
      await M.say(F2, ln('fishmonger.chat'));
      snd('swoosh');
      await STORY.tween(1.1, k => { B.cat.position.set(STALL.x - 0.2 - k * 5.5, y + 0.82 * (1 - Math.min(1, k * 3)) + Math.sin(Math.min(1, k * 3) * Math.PI) * 0.4, STALL.z - 0.5 + k * 6); B.cat.rotation.y = 2.4; });
      B.cat.visible = false;
      await M.demo(F2, T().DEMO['cat.demo'], T().MARKS['cat.demo']);
      await M.say(F2, ln('cat.ask')); s.catAsked = true; G().save();
    } finally { M.lock(false); }
    M.think('Young {quino} is by the long pier. Tell him what happened.', 4.5);
  }
  async function catTell() {
    const s = st(), Q = () => who('quino'); if (!Q()) return;
    M.lock(true); try { M.frame2(Q(), -1); await wait(0.3); await M.say(Q(), ln('quino.cat')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.cat, { tips: T().TIPS }); if (!r) { M.think('Young {quino} is waiting: what happened to his sardine?', 4); return; }
    TIME.grade('pb.cat', r.letter);
    M.lock(true); try { const Q2 = Q(); M.frame2(Q2, -1); await M.say(Q2, ln('cat.done')); s.catDone = true; G().state.coins = (G().state.coins || 0) + 4; UI.toast('+4 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ the Talk menus: side quests (the main path's scenes play straight off a Talk)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'past' || TIME.regionNow() !== 'port') return null;
    const s = st();
    if (it.who === 'past:fisher' && s.heard && s.heard.fisher && !s.plaqueAsked) return [{ label: 'The storm plaque', sub: '◆ side quest', run: plaqueAsk }];
    if (it.who === 'past:mason' && s.plaqueAsked && !s.plaqueDone) return [{ label: 'The storm plaque', sub: '◆ side quest', run: plaqueScene }];
    if (it.who === 'past:dora' && s.dora && !s.spyAsked) return [{ label: 'Your spyglass?', sub: '◆ side quest', run: spyAsk }];
    if (it.who === 'past:dora' && s.spyFound && !s.spyDone) return [{ label: 'Your spyglass', sub: '◆ side quest', run: spyGive }];
    if (it.who === 'past:fishmonger' && s.heard && s.heard.fishmonger && !s.catAsked) return [{ label: 'The sardine thief', sub: '◆ side quest', run: catScene }];
    if (it.who === 'past:quino' && s.catAsked && !s.catDone) return [{ label: 'Your sardine', sub: '◆ side quest', run: catTell }];
    return null;
  });

  // ------------------------------------------------------------ E: the way aboard, and the things you can look at
  const LOOKS = [
    { id: 'w.pb_sailship', at: { x: -238.2, z: -68.0 }, line: () => (TIME.flag('past', 'pbShip') ? '{ship}, a three-master, her {w.pb_sail:pl} white again. Her crew is singing on deck.' : '{ship}: a three-master, gray from her {w.pb_mast:pl} to her keel, wrapped in {w.pb_fog}. Not a sound aboard.') },
    { id: 'w.pb_figurehead', at: { x: -253.0, z: -69.4 }, line: () => 'Her {w.pb_figurehead}: a blue {w.pb_swallow}, wings back, flying ahead of the ship.' },
    { id: 'w.pb_crane', at: { x: -233.2, z: -95.0 }, line: () => 'A wooden cargo {w.pb_crane}. A {w.pb_crate} hangs from its rope, halfway between the quay and a ship.' },
    { id: 'w.pb_cargo', at: { x: -231.8, z: -96.6 }, line: () => 'Stacks of {w.pb_cargo}: {w.pb_crate:pl}, {w.pb_sack:pl} of flour, {w.pb_barrel:pl} of oil. Ready to load.' },
    { id: 'w.pb_ice', at: { x: -232.2, z: -73.0 }, line: () => '{fishmonger}’s stall: {w.pb_sardine:pl} and a {w.pb_tuna} on {w.pb_ice}, and a brass {w.pb_scale}.' },
    { id: 'w.pb_net', at: { x: -232.4, z: -103.2 }, line: () => 'A heap of fishing {w.pb_net:pl}, still wet, with orange floats. Someone was mending them.' },
    { id: 'w.pb_bollard', at: { x: -234.4, z: -78.6 }, line: () => 'An iron {w.pb_bollard} by the water. {dora} says the quiet boy sat here every evening, watching the ships come in.' },
    { id: 'w.pb_anchor', at: { x: -228.4, z: -83.0 }, line: () => 'A big new {w.pb_anchor}, black iron, waiting for a ship. Too heavy for anyone to move.' },
    { id: 'w.pb_flag', at: { x: -235.4, z: -86.6 }, line: () => 'Out on its islet, the {w.fort} is brand new: fresh stone, a scaffold still up its side, new {w.pb_flag:pl} in the {w.pb_wind}.' },
    { id: 'w.pb_seaweed', at: { x: -224.4, z: -55.6 }, line: () => '{w.pb_seaweed} drying on the sand, and {w.pb_shell:pl}, pink and white.' },
    { id: 'w.pb_lamp', at: { x: -229.8, z: -106.8 }, line: () => 'One of the quay’s {w.pb_lamp:pl}, its glass polished. {abel} lights them every evening.' },
  ];
  function interactables() {
    const s = st(), out = [];
    out.push({ x: PLANK.x, z: PLANK.z, r: 1.8, y: 0.75, label: s.joined ? 'Go aboard' : 'Look', run: async () => {
      if (!s.joined) { M.lookAt('w.pb_gangplank', s.met ? 'The {w.pb_gangplank} is gray and cold, like stone. The fog won’t let anyone up.' : 'A gray ship at the long pier, wrapped in fog. Its {w.pb_gangplank} won’t let anyone up.', 4.5); return; }
      if (typeof PT_PSHIP !== 'undefined' && PT_PSHIP) await PT_PSHIP.enter();
    } });
    if (s.spyAsked && !s.spyFound) out.push({ x: DIG.x + 0.6, z: DIG.z - 0.6, r: 1.4, label: `Tell ${M.mimoName()}`, run: digScene });
    for (const L0 of LOOKS) { if (L0.when && !L0.when()) continue; out.push({ x: L0.at.x, z: L0.at.z, r: 1.3, label: 'Look', run: async () => M.lookAt(L0.id, L0.line(), 5.5) }); }
    return out;
  }
  function nextId() { const s = st(); return !s.met ? 'master' : !s.dora ? 'dora' : heardN() < 3 ? 'heard' : !s.joined ? 'master' : 'ship'; }
  const HINTS = { master: '{mimo} points at a woman in a navy coat, by the white harbor office.', dora: '{mimo} points at a little girl on the promenade.', ship: '{mimo} looks at the gray ship at the long pier.',
    fishmonger: '{mimo} points at a fish stall on the promenade.', fisher: '{mimo} points at an old fisherman by his nets.', quino: '{mimo} points at a young sailor by the long pier.',
    abel: '{mimo} points at a man with a lantern.', mason: '{mimo} points at a stonemason by the beach.' };
  function target(id) {
    if (id === 'ship') return (typeof PT_PSHIP !== 'undefined' && PT_PSHIP && PT_PSHIP.inside && PT_PSHIP.target()) || { x: PLANK.x, z: PLANK.z, hint: HINTS.ship };
    if (id === 'heard') { const s = st(), n = M.HEARD.find(k => !(s.heard && s.heard[k])); if (!n) return target('master'); id = n; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || '{mimo} points.' };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('pb_past') ? 'pb_past' : 'past');

  // ------------------------------------------------------------ the side quests (QUESTS.LIST: they start as the story reaches them)
  if (typeof QUESTS !== 'undefined') {
    const pS = s => M.sp(s), nS = s => M.sn(s);
    const pastAt = id => () => M.via('past', () => target(id));
    if (!QUESTS.LIST.some(q => q.id === 'pb.plaque')) QUESTS.LIST.push({ id: 'pb.plaque', kind: 'side',
      title: 'The storm plaque', get giver() { return M.fillEn('{fisher}, an old fisherman (Port Brisa, long ago)'); },
      started: s => !!pS(s).plaqueAsked,
      steps: [
        { get text() { return M.fillEn('In the Past: tell {mason} the story of the storm, for the plaque (2)'); }, get why() { return M.fillEn(`What was going on, and what the boy did: ${M.sx('plaque')}.`); },
          done: s => !!pS(s).plaqueDone, target: pastAt('mason'), hint: HINTS.mason },
        { text: 'Today: is the plaque still there? Look by the beach', why: 'A story carved in stone, long ago… stone lasts.',
          done: s => !!nS(s).plaqueSeen, target: () => M.via('now', () => ({ x: PLAQUE.now.look.x, z: PLAQUE.now.look.z, hint: '{mimo} points at an old stone by the beach.' })), hint: '{mimo} points at an old stone by the beach.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'pb.spyglass')) QUESTS.LIST.push({ id: 'pb.spyglass', kind: 'side',
      get title() { return M.fillEn('Young {dora}’s spyglass'); }, get giver() { return M.fillEn('young {dora}, on the promenade (Port Brisa, long ago)'); },
      started: s => !!pS(s).spyAsked,
      steps: [
        { text: 'In the Past: dig it up on the beach (tell Mimo, as a memory)', why: 'It fell in the sand. Something glints there.', done: s => !!pS(s).spyFound, target: () => M.via('past', () => ({ x: DIG.x, z: DIG.z, hint: '{mimo} sniffs the sand. Something glints.' })), hint: '{mimo} sniffs the sand.' },
        { get text() { return M.fillEn('Give it back to young {dora}'); }, why: 'She’s on the promenade.', done: s => !!pS(s).spyDone, target: pastAt('dora'), hint: HINTS.dora },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'pb.cat')) QUESTS.LIST.push({ id: 'pb.cat', kind: 'side',
      title: 'The sardine thief', get giver() { return M.fillEn('{fishmonger}, the fishmonger (Port Brisa, long ago)'); },
      started: s => !!pS(s).catAsked,
      steps: [
        { get text() { return M.fillEn('In the Past: tell young {quino} what happened to his sardine'); }, get why() { return M.fillEn('What was going on, and what the cat did, all in one story.'); },
          done: s => !!pS(s).catDone, target: pastAt('quino'), hint: HINTS.quino },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks (TIME calls them: time.js "TIME dresses it")
  Object.assign(M.DRESS.past, {
    people: PEOPLE,
    on(api) { show(true); hid = M.hideToday(api); M.holesOn(true); },
    off() { show(false); hid = []; },
    entered() { show(true); M.holesOn(true); },
    late: (api, dt) => { if (typeof PT_PSHIP !== 'undefined' && PT_PSHIP && PT_PSHIP.inside) PT_PSHIP.late(dt); else late(dt); },
    update(api, dt, t) { update(dt, t); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, PEOPLE, who, build, show, LOOKS, PLAQUE, SHIP, PLANK, makeShip, grayMat,
    target: id => target(id), song: () => song(), init: () => {}, changed: () => {},
    _: { talk: id => talk(id), masterScene, doraScene, heardScene, sailorsAsk, plaqueAsk, plaqueScene, spyAsk, digScene, spyGive, catScene, catTell, get built() { return built; } } };
})();
