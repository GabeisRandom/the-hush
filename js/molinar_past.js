'use strict';
// Molinar, long ago (DESIGN.md 18.6 "T1c"): the place, about 40 years back. TIME dresses it (time_molinar.js MOLT.DRESS.past):
//   the Great Mill being built (scaffolding round the tower, its sails still lying in the forecourt, a hoist, the builders' stones
//   and their plans table), the market twice the size (four more stalls, bunting across the square), Marga's grandmother with
//   the first cart, and the clockmaker who taught Ciro, with young Ciro at his door. Today's townsfolk, animals and Marga's farm
//   cart are hidden (they're all one instanced rig, molinar.js objects.folks), and so is the Great Mill's rotor until it's built.
// The people of then (TIME's person kit: one mesh and one hull each): the miller's family who fed young Elio (the miller, his
//   wife, their kid: today's miller, Trigo's grandpa), the head builder and a young builder, Fina (Marga's grandmother), the
//   master clockmaker and young Ciro.
// The main path (MOLT.PSTEPS): the miller's wife remembers the quiet boy (the 1st / 2nd person past, «ayer, anoche»: «¿Comiste
//   ayer?» → «Sí, comí»); the head builder asks two things before you can help («¿Trabajaste ayer?», «¿Subiste la colina?»); the
//   Great Mill being built (molinar_past_mill.js); the first armadillo (molinar_time_boss.js); the echo; report to Noa.
// Side quests (QUESTS.LIST): «The little millstone» (cross-time: set it by the plinth, and today it's the wheel that mends
//   Marga's cart), «Young Ciro's little wheel» (the master's lesson: oil the gears every week), «Brosio's marbles».
const MOL_PAST = (() => {
  if (typeof TIME === 'undefined' || typeof MOLT === 'undefined' || !MOLT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = MOLT, T = () => MPTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('past');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are (checked with MOLT._.t.probe in every world)
  const AT = {
    wife: { x: 241.4, z: -162.2, yaw: -1.0 }, miller: { x: 244.6, z: -160.6, yaw: -1.3 }, kid: { x: 229.8, z: -160.4, yaw: 1.2 },
    builder: { x: 236.6, z: -160.9, yaw: -2.6 }, helper: { x: 245.4, z: -166.8, yaw: -2.2 }, fina: { x: 224.0, z: -156.4, yaw: -2.4 },
    master: { x: 207.6, z: -136.6, yaw: 2.6 }, ciro: { x: 205.2, z: -137.6, yaw: 2.2 },
  };
  const TABLE = { x: 235.0, z: -162.4 };            // the plans table, beside the head builder
  const STONE0 = { x: 249.4, z: -169.4 }, STONE1 = { x: 249.2, z: -172.6 };     // the little millstone: where it lies, where it's set
  const CART_NOW = { x: 250.8, z: -171.2 };         // today: Marga's old cart (her grandmother's), where the little stone was set
  const FCART = { x: 225.9, z: -155.0 };            // then: Fina's new cart, by the market
  const AWNING = { x: 206.9, z: -145.3, y: 2.75, at: { x: 209.4, z: -146.6 } };   // young Ciro's little wheel, bounced onto the fruit stall's awning
  const MARBLES = [{ x: 218.6, z: -153.6 }, { x: 209.9, z: -152.6 }, { x: 220.6, z: -144.2 }];
  const GM = { x: 240, z: -176 };

  // ------------------------------------------------------------ the people of then (TIME's person kit; their Talk runs below)
  const C = () => T().CAST;
  const LOOK = {
    wife: { skin: '#e6b48c', hair: '#5a3a26', hairdo: 'bun', dress: '#8a5f3e', apron: '#fdf8ee', hat: 'scarf', hatColor: '#d0663f', prop: 'basket' },
    miller: { skin: '#efc29a', hair: '#3a2b26', dress: '#e8dcc4', apron: '#fdf8ee', hat: 'flat', hatColor: '#d8d0c0', stache: true, hair2: '#3a2b26', h: 1.04 },
    kid: { kid: true, skin: '#e6b48c', hair: '#3a2b26', hairdo: 'short', dress: '#4f7fc9', vest: '#e8d4b0', hat: 'cap', hatColor: '#d9a03a', h: 0.74 },
    builder: { skin: '#c98e62', hair: '#2e2420', hairdo: 'braids', dress: '#7a5a3a', vest: '#d9a03a', hat: 'straw', hatColor: '#c9443a', h: 1.02 },
    helper: { skin: '#f0c7a0', hair: '#8a4a2a', hairdo: 'short', dress: '#5a86b8', vest: '#8a5f3e', hat: 'cap', hatColor: '#4f8a4a', h: 0.98 },
    fina: { skin: '#a8714a', hair: '#2e2420', hairdo: 'bun', dress: '#4f8a4a', apron: '#e8d9b8', hat: 'scarf', hatColor: '#e0503f' },
    master: { skin: '#efc29a', hair: '#e8e4dc', hairdo: 'bald', beard: true, dress: '#3f3a5a', apron: '#8a5f3e', glasses: true, h: 0.98 },
    ciro: { skin: '#f5cda2', hair: '#5a3a26', hairdo: 'short', dress: '#5a4a7a', apron: '#8a5f3e', h: 0.96 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: (api, p) => talk(id, p) }));
  const P = id => M.person('past', id);
  const who = id => M.who('past', id);

  // ------------------------------------------------------------ the dressing: one merged mesh (and its ink hull) per group
  let built = null;
  const COL = { pole: '#8a5f3e', plank: '#c09160', rope: '#d8c8a0', stone: '#c9bda4', stoneD: '#a89a82', cloth: '#f3ead6', wood: '#a0683c', woodD: '#6b4a2e', iron: '#2f3440' };
  function kit() { return PAST.API.Kit(); }
  function scaffold(k) {
    const R = 7.95, top = 15.2, n = 12, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.13; if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.45) continue; pts.push(a); }
    const P0 = a => [GM.x + Math.cos(a) * R, GM.z + Math.sin(a) * R];
    for (const a of pts) { const [x, z] = P0(a), y = gy(x, z); k.rod([x, y - 0.1, z], [x, y + top, z], 0.11, COL.pole, 0.012); }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length]; if (Math.abs(b - a) > 1.2 && b > a) continue;     // (no ledger across the door's gap)
      const [x0, z0] = P0(a), [x1, z1] = P0(b), y0 = gy(x0, z0);
      for (const h of [6.0, 9.6, 13.2]) { k.rod([x0, y0 + h, z0], [x1, y0 + h, z1], 0.08, COL.pole, 0.01); const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, rr = Math.atan2(x1 - x0, z1 - z0); k.box(mx - Math.sin(rr + Math.PI / 2) * 0.35, y0 + h + 0.1, mz - Math.cos(rr + Math.PI / 2) * 0.35, 0.7, 0.07, Math.hypot(x1 - x0, z1 - z0) * 0.98, COL.plank, { ry: rr, ink: 0.006 }); }
      if (i % 2 === 0) k.rod([x0, y0 + 6.0, z0], [x1, y0 + 9.6, z1], 0.05, COL.pole, 0.008);
    }
    // a ladder up the east side, and a pulley at the top with its rope hanging down
    const la = 0.13 + 0 * TAU, [lx, lz] = [GM.x + R + 0.5, GM.z - 0.6];
    for (const s of [-0.32, 0.32]) k.rod([lx, gy(lx, lz), lz + s], [lx, gy(lx, lz) + 9.6, lz + s], 0.05, COL.woodD, 0.008);
    for (let j = 0; j < 16; j++) k.box(lx, gy(lx, lz) + 0.45 + j * 0.58, lz, 0.06, 0.06, 0.66, COL.plank, { ink: 0 });
    k.add(PAST.API.KG.cyl, GM.x + R * 0.7, top - 0.3, GM.z + R * 0.7, 0.4, 0.14, 0.4, COL.woodD, { rx: Math.PI / 2 });
    k.rod([GM.x + R * 0.7, top - 0.4, GM.z + R * 0.7], [GM.x + R * 0.7 + 0.2, 1.2, GM.z + R * 0.7 + 0.2], 0.025, COL.rope, 0);
    void la;
  }
  function sailFrames(k) {
    // two of the four sails, lying on trestles east of the forecourt, waiting to be raised
    for (const [cx, cz, ry] of [[251.4, -168.6, 0.12], [253.2, -173.8, -0.1]]) {
      const y = gy(cx, cz) + 0.45, Lg = 8.6;
      k.box(cx, y, cz, 0.22, 0.2, Lg, COL.wood, { ry });
      for (let j = 0; j < 9; j++) { const t = -Lg / 2 + 0.6 + j * (Lg - 1.2) / 8; k.box(cx + Math.sin(ry) * t + Math.cos(ry) * 0.75, y + 0.03, cz + Math.cos(ry) * t - Math.sin(ry) * 0.75, 1.5, 0.06, 0.08, COL.woodD, { ry, ink: 0.004 }); }
      k.box(cx + Math.cos(ry) * 0.75, y + 0.06, cz - Math.sin(ry) * 0.75, 1.3, 0.02, Lg - 1.4, COL.cloth, { ry, ink: 0.004 });
      for (const s of [-1, 1]) { const tx = cx + Math.sin(ry) * s * Lg * 0.35, tz = cz + Math.cos(ry) * s * Lg * 0.35; k.box(tx, y / 2, tz, 1.4, y, 0.12, COL.woodD, { ry: ry + Math.PI / 2 }); }
    }
  }
  function props(k) {
    const KG = PAST.API.KG;
    // the builders' stones and timber, stacked east of the forecourt
    const sx = 250.6, sz = -163.2, y0 = gy(sx, sz);
    [[0, 0, 0, 1.6, 0.8, 1.2], [1.7, 0, 0.3, 1.5, 0.8, 1.1], [-1.6, 0, -0.2, 1.4, 0.8, 1.2], [0.8, 0.8, 0.1, 1.5, 0.75, 1.1], [-0.8, 0.8, 0.1, 1.4, 0.75, 1.1], [0, 1.55, 0.1, 1.5, 0.7, 1.0],
      [0.4, 0, 2.2, 1.6, 0.8, 1.1], [-1.4, 0, 2.3, 1.3, 0.7, 1.1], [1.9, 0, -2.0, 1.4, 0.8, 1.2], [0.2, 0, -2.2, 1.5, 0.8, 1.1]]
      .forEach(([x, y, z, w, h, d], i) => k.box(sx + x, y0 + y + h / 2, sz + z, w, h, d, i % 3 ? COL.stone : COL.stoneD, { ry: (i % 4) * 0.05 }));
    for (let j = 0; j < 5; j++) k.box(sx + 0.4, y0 + 0.12 + j * 0.2, sz + 3.6 + (j % 2) * 0.05, 4.2, 0.18, 0.24, COL.wood, { ry: 0.04 * j });
    // the plans table: a trestle, a big sheet with the mill drawn on it, stones holding its corners
    const ty = gy(TABLE.x, TABLE.z);
    k.box(TABLE.x, ty + 0.86, TABLE.z, 1.9, 0.07, 1.0, COL.wood, { ry: 0.25 }).box(TABLE.x, ty + 0.91, TABLE.z, 1.7, 0.012, 0.86, '#e9f0f6', { ry: 0.25, ink: 0.004 });
    for (const s of [-0.7, 0.7]) k.box(TABLE.x + Math.cos(0.25) * s, ty + 0.42, TABLE.z - Math.sin(0.25) * s, 0.08, 0.84, 0.9, COL.woodD, { ry: 0.25 });
    for (const [dx, dz] of [[-0.75, -0.35], [0.75, 0.35], [-0.7, 0.36]]) k.add(KG.ball6, TABLE.x + dx, ty + 0.95, TABLE.z + dz, 0.07, 0.05, 0.07, COL.stoneD, { ink: 0 });
    for (const [dx, dz, w] of [[0, 0, 0.5], [0.25, -0.05, 0.02]]) k.box(TABLE.x + dx, ty + 0.92, TABLE.z + dz, w, 0.004, 0.62, '#3f6fb5', { ry: 0.25, ink: 0 });
    // the hoist: an A-frame with a wheel, a rope, and a millstone hanging from it
    const hx = 227.6, hz = -174.6, hy = gy(hx, hz);
    for (const s of [-1, 1]) { k.rod([hx - 1.3, hy, hz + s * 0.9], [hx, hy + 5.6, hz], 0.12, COL.pole, 0.012); k.rod([hx + 1.3, hy, hz + s * 0.9], [hx, hy + 5.6, hz], 0.12, COL.pole, 0.012); }
    k.add(KG.cyl, hx, hy + 5.4, hz, 0.55, 0.16, 0.55, COL.woodD, { rx: Math.PI / 2 }).rod([hx, hy + 5.2, hz + 0.1], [hx, hy + 2.3, hz + 0.1], 0.025, COL.rope, 0);
    k.add(KG.cyl, hx, hy + 1.95, hz + 0.1, 0.85, 0.38, 0.85, '#c9c1b0', { rx: Math.PI / 2 - 0.1 }).add(KG.cyl, hx, hy + 1.95, hz + 0.1, 0.16, 0.42, 0.16, '#8f8878', { rx: Math.PI / 2 - 0.1, ink: 0 });
    // the market, twice the size: four more stalls round the square, facing the well
    const STALLS = [[226.8, -150.0, '#d9a03a'], [203.2, -150.0, '#3f8f6a'], [215.4, -138.4, '#b84a7a'], [215.0, -162.2, '#5a86b8']];
    for (const [x, z, c] of STALLS) stall(k, x, z, Math.atan2(215 - x, -150 - z), c);
    // Fina's new cart: bright wood, red wheels, sacks of wheat
    cart(k, FCART.x, FCART.z, -0.9, { wheel: '#c9443a', body: '#b07a48', load: true });
    // bunting over the square, lamp to lamp (red, gold, blue, green, white)
    bunting(k, [202, -146.8], [228, -153.2]); bunting(k, [218.2, -137], [212.2, -163.1]);
    extras(k);
  }
  // ------------------------------------------------------------ the town of then, up close (each has a Look: LOOKS_AT below):
  // the builders' yard west of the plinth, the canteen kitchen by the mill's door, the market's goods, the clock shop's bench
  const XP = {
    tripod: { x: 235.4, z: -167.3 }, table: { x: 237.9, z: -167.1 }, lamp: { x: 243.2, z: -167.4 },
    barrow: { x: 226.0, z: -172.4 }, tub: { x: 230.4, z: -177.8 }, crate: { x: 226.2, z: -179.0 },
    bench: { x: 211.0, z: -134.8 }, dial: { x: 211.8, z: -129.6 },
  };
  function extras(k) {
    const KG = PAST.API.KG;
    // the canteen kitchen: a cauldron on a tripod over a fire, a table with the bread dough, a jug of milk and the potatoes
    { const { x, z } = XP.tripod, y = gy(x, z);
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.4; k.rod([x + Math.cos(a) * 0.75, y, z + Math.sin(a) * 0.75], [x, y + 1.55, z], 0.035, COL.woodD, 0.006); }
      k.rod([x, y + 1.5, z], [x, y + 0.95, z], 0.012, COL.iron, 0);
      k.add(KG.half, x, y + 0.62, z, 0.42, -0.38, 0.42, COL.iron, { ink: 0.01 }).add(KG.cyl, x, y + 0.64, z, 0.4, 0.05, 0.4, '#e8b85a', { ink: 0 });
      k.rod([x - 0.38, y + 0.66, z], [x + 0.62, y + 1.0, z + 0.1], 0.02, '#c9c1b0', 0.004).add(KG.ball6, x + 0.66, y + 1.02, z + 0.11, 0.07, 0.04, 0.07, '#c9c1b0', { ink: 0 });
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; k.rod([x + Math.cos(a) * 0.4, y + 0.05, z + Math.sin(a) * 0.4], [x - Math.cos(a) * 0.2, y + 0.12, z - Math.sin(a) * 0.2], 0.06, '#6b4a2e', 0.006); }
      k.add(KG.cone, x, y + 0.24, z, 0.2, 0.36, 0.2, '#f2a13a', { ink: 0 }).add(KG.cone, x + 0.08, y + 0.2, z - 0.05, 0.12, 0.24, 0.12, '#ffd84a', { ink: 0 });
      for (let j = 0; j < 4; j++) k.box(x - 1.15, y + 0.1 + j * 0.15, z + 0.3 - (j % 2) * 0.12, 0.16, 0.14, 0.7, j % 2 ? COL.wood : COL.woodD, { ry: 0.1 * j, ink: 0.004 }); }
    { const { x, z } = XP.table, y = gy(x, z);
      k.box(x, y + 0.82, z, 1.6, 0.07, 0.75, COL.plank).box(x, y + 0.86, z, 1.5, 0.01, 0.65, '#f3ead6', { ink: 0 });
      for (const [dx, dz] of [[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]]) k.box(x + dx, y + 0.4, z + dz, 0.07, 0.8, 0.07, COL.woodD, { ink: 0.004 });
      k.add(KG.sphere, x - 0.35, y + 0.95, z, 0.3, 0.13, 0.24, '#f0dcb0', { ink: 0.006 }).box(x - 0.35, y + 1.04, z, 0.5, 0.02, 0.42, '#fdf8ee', { ry: 0.2, ink: 0.004 });
      k.add(KG.cyl, x + 0.3, y + 1.02, z - 0.1, 0.11, 0.3, 0.11, '#c98a5a', { ink: 0.006 }).add(KG.cyl, x + 0.3, y + 1.18, z - 0.1, 0.08, 0.04, 0.08, '#fdf8ee', { ink: 0 });
      k.add(KG.cyl, x + 0.48, y + 0.12, z + 0.55, 0.26, 0.24, 0.26, '#a0683c', { ink: 0.006 });
      for (let i = 0; i < 6; i++) k.add(KG.ball6, x + 0.38 + (i % 3) * 0.1, y + 0.27 + (i > 2 ? 0.06 : 0), z + 0.48 + (i % 2) * 0.12, 0.08, 0.07, 0.08, i === 5 ? '#e8d9a0' : '#c9a05a', { ink: 0 }); }
    // the lamp post by the mill's door, a horseshoe nailed under the lamp
    { const { x, z } = XP.lamp, y = gy(x, z);
      k.box(x, y + 1.1, z, 0.12, 2.2, 0.12, COL.woodD).box(x, y + 2.15, z + 0.25, 0.06, 0.06, 0.5, COL.iron, { ink: 0 });
      k.box(x, y + 1.88, z + 0.48, 0.2, 0.26, 0.2, '#ffe9a8', { ink: 0.006 }).add(KG.cone4, x, y + 2.08, z + 0.48, 0.17, 0.14, 0.17, COL.iron, { ry: Math.PI / 4, ink: 0 });
      k.add(KG.torus, x, y + 1.3, z + 0.08, 0.13, 0.15, 0.13, '#8f8878', { rz: Math.PI, ink: 0 }); }
    // the builders' yard: a wheelbarrow of bricks, a tub of mortar with its trowel, a crate of tools
    { const { x, z } = XP.barrow, y = gy(x, z);
      k.box(x, y + 0.55, z, 0.75, 0.32, 1.0, COL.wood).add(KG.cyl, x, y + 0.24, z - 0.62, 0.24, 0.08, 0.24, COL.woodD, { rz: Math.PI / 2 });
      for (const s of [-1, 1]) { k.rod([x + s * 0.3, y + 0.5, z + 0.3], [x + s * 0.32, y + 0.62, z + 1.05], 0.03, COL.woodD, 0.004); k.box(x + s * 0.28, y + 0.22, z + 0.35, 0.05, 0.44, 0.05, COL.woodD, { ink: 0 }); }
      for (let i = 0; i < 6; i++) k.box(x - 0.16 + (i % 2) * 0.32, y + 0.76 + (i >> 1 & 1) * 0.12, z - 0.3 + (i >> 1) * 0.22, 0.28, 0.1, 0.14, i % 3 ? '#c0563c' : '#b04a34', { ry: 0.05 * i, ink: 0.003 }); }
    { const { x, z } = XP.tub, y = gy(x, z);
      k.add(KG.cyl, x, y + 0.24, z, 0.5, 0.48, 0.5, COL.woodD).add(KG.cyl, x, y + 0.46, z, 0.44, 0.03, 0.44, '#9a968f', { ink: 0 });
      k.box(x + 0.12, y + 0.6, z + 0.08, 0.16, 0.02, 0.24, '#c9c1b0', { rx: 0.9, ink: 0.003 }).rod([x + 0.12, y + 0.62, z + 0.2], [x + 0.12, y + 0.86, z + 0.32], 0.02, COL.wood, 0.003); }
    { const { x, z } = XP.crate, y = gy(x, z);
      k.box(x, y + 0.3, z, 0.8, 0.6, 0.6, COL.wood).box(x, y + 0.61, z, 0.82, 0.03, 0.62, COL.woodD, { ink: 0 });
      k.add(KG.cyl, x - 0.15, y + 0.72, z, 0.09, 0.26, 0.09, '#a0683c', { rz: Math.PI / 2 }).rod([x - 0.15, y + 0.7, z], [x - 0.15, y + 0.67, z + 0.42], 0.025, COL.wood, 0.003);
      k.box(x + 0.22, y + 0.66, z - 0.05, 0.05, 0.04, 0.34, '#8f8878', { ry: 0.3, ink: 0.003 }).rod([x + 0.3, y + 0.64, z + 0.2], [x + 0.3, y + 0.2, z + 0.32], 0.008, COL.rope, 0).add(KG.cone, x + 0.3, y + 0.15, z + 0.33, 0.04, 0.09, 0.04, '#8f8878', { rx: Math.PI, ink: 0 }); }
    // the market's goods: brass scales on the north stall, a basket of eggs on the west one, sacks of flour by the south one
    const onStall = (sx, sz, lx, lz) => { const ry = Math.atan2(215 - sx, -150 - sz), c = Math.cos(ry), s = Math.sin(ry); return [sx + lx * c + lz * s, sz - lx * s + lz * c, gy(sx, sz) + 0.97]; };
    { const [x, z, y] = onStall(215.4, -138.4, -0.75, 0.15);
      k.box(x, y + 0.2, z, 0.04, 0.4, 0.04, '#d9a03a', { ink: 0 }).box(x, y + 0.4, z, 0.6, 0.03, 0.03, '#d9a03a', { ry: 0.05, ink: 0.003 });
      for (const d of [-0.28, 0.28]) k.add(KG.cyl, x + d, y + 0.18, z, 0.13, 0.02, 0.13, '#e8b84a', { ink: 0.003 }).rod([x + d, y + 0.39, z], [x + d, y + 0.19, z], 0.004, '#6b4a2e', 0);
      k.add(KG.ball6, x + 0.28, y + 0.24, z, 0.09, 0.06, 0.09, '#f2c14e', { ink: 0 }); }
    { const [x, z, y] = onStall(203.2, -150.0, 0.75, 0.1);
      k.add(KG.cyl, x, y + 0.07, z, 0.24, 0.14, 0.24, '#b07a48', { ink: 0.005 });
      for (let i = 0; i < 7; i++) k.add(KG.ball6, x + Math.cos(i * 0.9) * 0.12 * (i ? 1 : 0), y + 0.17, z + Math.sin(i * 0.9) * 0.12 * (i ? 1 : 0), 0.06, 0.08, 0.06, i % 2 ? '#e8c9a0' : '#c98a5a', { ink: 0 }); }
    for (const [lx, lz] of [[1.35, 1.0], [1.85, 0.8], [1.6, 1.45]]) { const [x, z] = onStall(215.0, -162.2, lx, lz), y = gy(x, z); k.add(KG.sphere, x, y + 0.32, z, 0.3, 0.32, 0.26, '#f3ead6', { ink: 0.01 }); }
    // the clock shop's workbench (its back board holds a cuckoo clock), and the master's sundial by the street
    { const { x, z } = XP.bench, y = gy(x, z);
      k.box(x, y + 0.86, z, 0.7, 0.07, 1.9, COL.wood);
      for (const [dx, dz] of [[-0.28, -0.85], [0.28, -0.85], [-0.28, 0.85], [0.28, 0.85]]) k.box(x + dx, y + 0.42, z + dz, 0.07, 0.84, 0.07, COL.woodD, { ink: 0.004 });
      k.box(x - 0.36, y + 1.4, z, 0.06, 1.1, 1.9, COL.plank, { ink: 0.005 });
      k.box(x, y + 0.92, z - 0.5, 0.36, 0.04, 0.26, COL.woodD, { ink: 0.003 });
      for (let i = 0; i < 8; i++) k.add(KG.cyl, x - 0.12 + (i % 4) * 0.08, y + 0.95, z - 0.58 + (i >> 2) * 0.12, 0.015, 0.03, 0.015, '#c9c1b0', { ink: 0 });
      k.add(KG.torus, x + 0.12, y + 0.92, z - 0.05, 0.09, 0.09, 0.09, '#2f3440', { rx: Math.PI / 2, ink: 0 }).rod([x + 0.12, y + 0.91, z + 0.04], [x + 0.14, y + 0.91, z + 0.24], 0.015, COL.woodD, 0);
      for (const d of [-0.012, 0.012]) k.rod([x + 0.05 + d, y + 0.91, z + 0.3], [x + 0.05 + d * 3, y + 0.91, z + 0.52], 0.006, '#8f8878', 0);
      k.add(KG.cyl, x + 0.18, y + 1.0, z + 0.6, 0.08, 0.2, 0.08, '#c9443a', { ink: 0.004 }).add(KG.cone, x + 0.18, y + 1.13, z + 0.6, 0.06, 0.07, 0.06, '#b03a30', { ink: 0 }).rod([x + 0.2, y + 1.14, z + 0.6], [x + 0.36, y + 1.24, z + 0.6], 0.008, '#e8c35a', 0);
      const cy = y + 1.55, cz = z - 0.45, cx = x - 0.3;
      k.box(cx + 0.06, cy, cz, 0.12, 0.44, 0.36, '#8a5f3e').add(KG.cone4, cx + 0.06, cy + 0.32, cz, 0.3, 0.22, 0.24, '#6b4a2e', { ry: Math.PI / 4 });
      k.add(KG.cyl, cx + 0.13, cy + 0.04, cz, 0.12, 0.02, 0.12, '#fdf8ee', { rz: Math.PI / 2, ink: 0 }).add(KG.ball6, cx + 0.17, cy + 0.2, cz, 0.05, 0.05, 0.05, '#e8c35a', { ink: 0 });
      k.rod([cx + 0.13, cy - 0.2, cz - 0.06], [cx + 0.13, cy - 0.55, cz - 0.06], 0.006, '#e8c35a', 0).add(KG.cone, cx + 0.13, cy - 0.6, cz - 0.06, 0.04, 0.1, 0.04, '#e8c35a', { rx: Math.PI, ink: 0 }); }
    { const { x, z } = XP.dial, y = gy(x, z);
      k.add(KG.cyl, x, y + 0.45, z, 0.22, 0.9, 0.22, COL.stone).add(KG.cyl, x, y + 0.93, z, 0.42, 0.06, 0.42, COL.stoneD);
      k.box(x, y + 1.06, z, 0.03, 0.2, 0.32, '#8f8878', { ink: 0.003 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI + Math.PI; k.box(x + Math.cos(a) * 0.32, y + 0.965, z + Math.sin(a) * 0.32, 0.02, 0.01, 0.07, '#5a4a3a', { ry: -a, ink: 0 }); } }
  }
  function stall(k, x, z, ry, awn) {
    const y = gy(x, z), c = Math.cos(ry), s = Math.sin(ry), at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
    const [cx, cz] = at(0, 0);
    k.box(cx, y + 0.45, cz, 2.8, 0.9, 1.2, '#a0683c', { ry }).box(cx, y + 0.93, cz, 2.9, 0.07, 1.3, '#c09160', { ry, ink: 0.006 });
    for (const lx of [-1.35, 1.35]) for (const lz of [-0.55, 0.55]) { const [px, pz] = at(lx, lz); k.box(px, y + 1.3, pz, 0.09, 2.6, 0.09, '#6b4a2e', { ry, ink: 0.006 }); }
    for (let i = 0; i < 6; i++) { const [px, pz] = at(-1.25 + i * 0.5, 0.15); k.box(px, y + 2.62, pz, 0.5, 0.06, 1.7, i % 2 ? '#fff4e4' : awn, { ry, rx: -0.22, ink: 0.004 }); }
    const goods = ['#e2453a', '#f2c14e', '#9cc24e', '#e8a050', '#fdf8ee'];
    for (let i = 0; i < 6; i++) { const [px, pz] = at(-1.1 + i * 0.44, -0.2 + (i % 2) * 0.3); k.add(PAST.API.KG.ball6, px, y + 1.05, pz, 0.15, 0.13, 0.15, goods[(i + Math.round(x)) % goods.length], { ink: 0.006 }); }
  }
  function cart(k, x, z, ry, o = {}) {
    const KG = PAST.API.KG, y = gy(x, z), c = Math.cos(ry), s = Math.sin(ry), at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
    const [bx, bz] = at(0, 0);
    if (!o.broken) k.box(bx, y + 0.95, bz, 1.4, 0.12, 2.0, o.body || '#b07a48', { ry });
    else k.box(bx, y + 0.72, bz, 1.4, 0.12, 2.0, o.body || '#8a6a4a', { ry, rz: 0.3 });
    const tilt = o.broken ? 0.3 : 0, lift = o.broken ? -0.23 : 0;
    for (const lx of [-0.68, 0.68]) { const [px, pz] = at(lx, 0); k.box(px, y + 1.18 + (lx < 0 ? lift : 0), pz, 0.08, 0.42, 2.0, o.side || '#8a5f3e', { ry, rz: tilt * 0.5 }); }
    for (const lz of [-0.95, 0.95]) { const [px, pz] = at(0, lz); k.box(px, y + 1.18, pz, 1.36, 0.42, 0.08, o.side || '#8a5f3e', { ry, rz: tilt }); }
    // the handles, out the back
    for (const lx of [-0.5, 0.5]) { const [p0x, p0z] = at(lx, -0.95), [p1x, p1z] = at(lx * 1.1, -2.1); k.rod([p0x, y + 1.0, p0z], [p1x, y + 0.75, p1z], 0.05, '#6b4a2e', 0.008); }
    // the wheels: wood with red rims, or the stone one, or one of them split and lying flat
    for (const side of [-1, 1]) {
      const [wx, wz] = at(side * 0.84, 0.15);
      const stoneW = o.stone && side > 0, brokenW = o.broken && side < 0;
      if (brokenW) { k.add(KG.half, wx - side * 0.5 * c, y + 0.05, wz + side * 0.5 * s, 0.5, 0.06, 0.5, '#8a6a4a', { ry }); k.add(KG.half, wx - side * 0.9 * c, y + 0.05, wz + side * 0.9 * s, 0.45, 0.06, 0.45, '#7d5f42', { ry: ry + 1.2 }); continue; }
      if (stoneW) { k.add(KG.cyl, wx, y + 0.55, wz, 0.56, 0.24, 0.56, o.stoneCol || '#c9c1b0', { ry, rz: Math.PI / 2 }); k.add(KG.cyl, wx + side * 0.13 * c, y + 0.55, wz - side * 0.13 * s, 0.12, 0.05, 0.12, '#8f8878', { ry, rz: Math.PI / 2, ink: 0 }); continue; }
      k.add(KG.cyl, wx, y + 0.55, wz, 0.55, 0.12, 0.55, o.wheel || '#8a5f3e', { ry, rz: Math.PI / 2 });
      for (let i = 0; i < 4; i++) k.box(wx + side * 0.07 * c, y + 0.55, wz - side * 0.07 * s, 0.04, 0.95, 0.07, '#5a3a24', { ry, rx: i * Math.PI / 4, ink: 0 });
    }
    if (o.load) for (let i = 0; i < 4; i++) { const [px, pz] = at(-0.35 + (i % 2) * 0.7, -0.45 + (i >> 1) * 0.9); k.add(KG.sphere, px, y + 1.35, pz, 0.36, 0.32, 0.38, '#efe6d2', { ink: 0.012 }); }
  }
  function bunting(k, a, b) {
    const KG = PAST.API.KG, ya = gy(a[0], a[1]) + 3.4, yb = gy(b[0], b[1]) + 3.4, n = 26, COLS = ['#e2453a', '#ffd84a', '#3f7fc9', '#5fae4f', '#fdf8ee'];
    const P0 = t => [lerp(a[0], b[0], t), lerp(ya, yb, t) + 0.35 - Math.sin(t * Math.PI) * 0.9, lerp(a[1], b[1], t)];
    for (let i = 0; i < n; i++) { const p = P0(i / n), q = P0((i + 1) / n); k.rod(p, q, 0.012, COL.rope, 0); }
    const ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
    for (let i = 1; i < n; i++) { const p = P0(i / n); k.add(KG.cone4, p[0], p[1] - 0.2, p[2], 0.17, 0.34, 0.03, COLS[i % COLS.length], { ry: ry + Math.PI / 2, rx: Math.PI, ink: 0.004 }); }
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'mol-past-' + name; const k = kit(); fn(k); k.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), scaffold: mk('scaffold', scaffold), sails: mk('sails', sailFrames), solids: [] };
    // solids: the plans table, the stone heap, Fina's cart, the hoist's feet, the new stalls, the sail trestles
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    add(TABLE.x, TABLE.z, 0.8); add(FCART.x, FCART.z, 1.1); add(227.6, -174.6, 1.0);
    for (const [x, z] of [[226.8, -150.0], [203.2, -150.0], [215.4, -138.4], [215.0, -162.2]]) add(x, z, 1.35);
    for (const [x, z] of [[251.4, -168.6], [253.2, -173.8]]) { add(x, z - 3, 0.6); add(x, z, 0.6); add(x, z + 3, 0.6); }
    // (the town of then, up close: the kitchen, the lamp post, the builders' yard, the workbench, the sundial)
    add(XP.tripod.x, XP.tripod.z, 0.55); add(XP.table.x - 0.45, XP.table.z, 0.45); add(XP.table.x + 0.45, XP.table.z, 0.45); add(XP.lamp.x, XP.lamp.z, 0.2);
    add(XP.barrow.x, XP.barrow.z, 0.6); add(XP.tub.x, XP.tub.z, 0.55); add(XP.crate.x, XP.crate.z, 0.5);
    add(XP.bench.x, XP.bench.z - 0.55, 0.45); add(XP.bench.x, XP.bench.z + 0.55, 0.45); add(XP.dial.x, XP.dial.z, 0.4);
    WORLD.extra.push(...built.solids);
    return built;
  }
  const solidsOn = on => { if (built) built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); };
  // today's townsfolk's own solids (the stall keepers, Ciro, Félix…) are parked while you're in another world
  const parked = [];
  function parkToday(on) {
    const mol = G().molinar; if (!mol) return;
    if (on) { for (const c of mol.colliders || []) if (c.npc && c.x < OFF / 2) { parked.push([c, c.x, c.z]); c.x = OFF; c.z = OFF; } }
    else { while (parked.length) { const [c, x, z] = parked.pop(); c.x = x; c.z = z; } }
  }
  function hideToday(api) {
    const mol = G().molinar; if (!mol || !mol.objects) return;
    (mol.objects.folks || []).forEach(m => api.hide(m));
    // (the side modules' things drawn straight into the scene near here: Noa's diary post by the gate, the corner store's sign)
    for (const o of G().w3d.scene.children) if (o.visible && /^(read|diary|townlife|tl-|store)/i.test(o.name || '') && Math.hypot(o.position.x - 214, o.position.z + 151) < 60) api.hide(o);
  }
  // the Great Mill's sails aren't up yet: its rotor (one instance of molinar.js's sails) is drawn at nothing until the mill is built
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  function late() {
    const mol = G().molinar; if (!mol || !mol._dev || TIME.flag('past', 'molBuilt')) return;
    const sails = mol.objects && mol.objects.sails, rot = mol._dev.rotors; if (!sails || !rot) return;
    const i = rot.findIndex(r => r.great); if (i < 0) return;
    sails.setMatrixAt(i, ZERO); sails.instanceMatrix.needsUpdate = true;
  }
  function show(on) {
    const B = build();
    B.props.visible = on; const building = on && !TIME.flag('past', 'molBuilt');
    B.scaffold.visible = building; B.sails.visible = building;
    solidsOn(on);
  }

  // ------------------------------------------------------------ talking to the people of then (the main path first; side quests
  // come through STORY.talkHooks below, as a little menu)
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const demo1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.demo(p, T().DEMO[key], T().MARKS[key]).finally(() => M.lock(false)); };
  // each person's turn, once the main path has passed them: their lines in order, and their demonstration of the town's own words
  // («d:» a demonstration, whole in the language, its marks glossed); where they are in it is saved, so it goes on after a reload
  const TURNS = {
    wife: ['wife.k1', 'd:wife.demo2', 'wife.k2', 'wife.k3', 'wife.k4'],
    miller: ['miller.hello', 'miller.m1', 'd:miller.demo', 'miller.more', 'miller.m2', 'miller.m3'],
    kid: ['kid.hello', 'kid.k1', 'kid.k2', 'kid.k3'],
    builder: ['builder.b1', 'd:builder.demo', 'builder.b2', 'builder.b3'],
    helper: ['helper.hello', 'helper.h1', 'd:helper.demo2', 'helper.h2', 'helper.h3'],
    fina: ['fina.hello', 'fina.market', 'fina.f1', 'd:fina.demo', 'fina.f2', 'fina.f3', 'fina.f4'],
    master: ['master.m1', 'd:master.demo', 'master.m2', 'master.m3', 'master.m4'],
    ciro: ['ciro.hello', 'ciro.c1', 'ciro.c2', 'ciro.c3', 'ciro.c4', 'ciro.c5'],
  };
  // first: the line the story needs now (where to go next, or the news), said every `every` turns (once a round by default)
  function turn(id, first, every) {
    const s = st(), T0 = s.turn || (s.turn = {}), list = TURNS[id] || [], n = T0[id] || 0; T0[id] = n + 1;
    if (first && n % (every || list.length + 1) === 0) return say1(id, first);
    const i = T0[id + '#'] || 0; T0[id + '#'] = i + 1;
    const key = list[i % list.length];
    return key.startsWith('d:') ? demo1(id, key.slice(2)) : say1(id, key);
  }
  async function talk(id) {
    const s = st(), echo = typeof CH4 !== 'undefined' && CH4.got('molinar', 'past'), built = TIME.flag('past', 'molBuilt');
    switch (id) {
      case 'wife': return !s.met ? wifeScene() : !s.joined ? say1('wife', 'wife.again') : turn('wife', echo ? 'wife.after' : null);
      case 'builder': return !s.met ? say1('builder', 'builder.hello') : !s.joined ? builderScene() : built ? turn('builder', 'builder.done') : turn('builder', 'builder.again', 2);
      case 'helper': return s.helperDemo ? turn('helper') : helperDemo();
      case 'miller': return turn('miller');
      case 'kid': return s.marblesAsked && !s.marblesDone && marblesN() >= 3 ? marblesEnd() : turn('kid');
      case 'fina': return TIME.flag('past', 'molStone') && !s.finaStone ? finaStone() : turn('fina');
      case 'master': return turn('master', s.wheelDone ? 'master.oil' : 'master.hello');
      case 'ciro': return turn('ciro');
      default: return null;
    }
  }
  function giveBread() { const g = G(); g.state.bag = g.state.bag || {}; g.state.bag['w.bread'] = (g.state.bag['w.bread'] || 0) + 1; UI.toast(`+1 ${typeof LEX !== 'undefined' && LEX.item('w.bread') ? (lang() === 'zh' || lang() === 'ja' ? A.plainT(LEX.src('w.bread')) : LEX.form('w.bread')) : 'bread'} in your bag`); snd('chest'); }
  // the main path, 1: the miller's wife remembers the quiet boy («Anoche preparé sopa… ¿Comiste ayer?» → «Sí, comí»)
  async function wifeScene() {
    const s = st(), W = who('wife'); if (!W) return;
    if (!s.demo) {
      M.lock(true);
      try { M.frame2(W); await wait(0.4); await M.say(W, ln('wife.hello')); await M.demo(W, T().DEMO['wife.demo'], T().MARKS['wife.demo']); } finally { M.lock(false); }
      await M.card(T().CARDS.me); s.demo = true; G().save();
    }
    const r = await M.ask(T().TASKS.ate, { tips: T().TIPS, title: T().TASKS.ate.title });
    if (!r) { M.think('{wife} is still waiting: did you eat yesterday? (Talk to her again.)', 5); return; }
    TIME.grade('mol.ate', r.letter);
    M.lock(true);
    try {
      const W2 = who('wife'); M.frame2(W2);
      await M.say(W2, ln('wife.yes')); giveBread();
      await M.say(W2, ln('wife.boy')); await M.say(W2, ln('wife.mill'));
      s.met = true; G().save();
    } finally { M.lock(false); }
    M.think('{builder}, the head builder, is by the plans table. She decides who goes into the mill.', 5.5);
  }
  // the young builder shows what you'll be asked («¡Ayer trabajé todo el día! Y subí la escalera diez veces.»)
  async function helperDemo() {
    const s = st(), H = who('helper'); if (!H) return;
    M.lock(true);
    try { M.frame2(H, -1); await wait(0.3); await M.demo(H, T().DEMO['helper.demo'], T().MARKS['helper.demo']); s.helperDemo = true; G().save(); } finally { M.lock(false); }
  }
  // the main path, 2: the head builder's two questions, answered about yourself
  async function builderScene() {
    const s = st();
    if (!s.helperDemo) await helperDemo();
    const B = () => who('builder');
    M.lock(true); try { M.frame2(B()); await wait(0.3); await M.say(B(), ln('builder.hello')); } finally { M.lock(false); }
    if ((s.asked || 0) < 1) {
      M.lock(true); try { M.frame2(B()); await M.demo(B(), ln('builder.q1'), T().MARKS['builder.q1']); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.worked, { tips: T().TIPS }); if (!r) { M.think('{builder} is waiting: did you work yesterday?', 4.5); return; }
      TIME.grade('mol.worked', r.letter); s.asked = 1; G().save();
    }
    if ((s.asked || 0) < 2) {
      M.lock(true); try { M.frame2(B()); await M.demo(B(), ln('builder.q2'), T().MARKS['builder.q2']); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.climbed, { tips: T().TIPS }); if (!r) { M.think('{builder} is waiting: did you climb the hill to come here?', 4.5); return; }
      TIME.grade('mol.climbed', r.letter); s.asked = 2; G().save();
    }
    M.lock(true); try { M.frame2(B()); await M.say(B(), ln('builder.ok')); s.joined = true; G().save(); } finally { M.lock(false); }
    M.think('The Great Mill’s door is open now. Inside, {mimo} only moves in memories.', 5);
  }

  // ------------------------------------------------------------ side quest: «The little millstone» (the Past changes today and tomorrow)
  async function stoneScene() {
    const s = st(), B = who('builder'); if (!B) return;
    M.lock(true);
    try { M.frame2(B); await wait(0.3); await M.demo(B, T().DEMO['stone.demo'], T().MARKS['stone.demo']); await M.say(B, ln('stone.ask')); s.stoneAsked = true; G().save(); } finally { M.lock(false); }
    M.think('The little millstone lies east of the forecourt. Tell {mimo} what it did with it, as a memory.', 5.5);
  }
  async function stoneTask() {
    const s = st();
    if (!TIME.flag('past', 'molStone')) {
      const r = await M.ask(M.memTask(T().MEM.spare), { icon: 'push' }); if (!r) return;
      TIME.grade('mol.spare', r.letter);
      await mimoPushes(STONE0, STONE1);
    }
    const B = who('builder'); if (!B) return;
    M.lock(true); try { M.frame2(B); await M.demo(B, T().LOGQ.stone, T().LOGQ_MARKS.stone); } finally { M.lock(false); }
    const r2 = await M.ask(T().TASKS.stone, { tips: T().TIPS }); if (!r2) { M.think('{builder} is still waiting for your answer.', 4); return; }
    TIME.grade('mol.stone', r2.letter); s.stoneTold = true; G().save();
    M.think('Set by the Great Mill, long ago… {fina}, with the new cart, might like to know.', 5);
  }
  // Mimo, in the memory: it pushes, and the stone rolls along to its spot by the plinth
  async function mimoPushes(a, b) {
    const g = G(), sim = g.sim, Mm = sim.mimo, y = gy(a.x, a.z);
    M.lock(true);
    try {
      M.shot(V(a.x - 4.2, y + 2.6, a.z + 3.8), V((a.x + b.x) / 2, y + 0.8, (a.z + b.z) / 2));
      sim.mimoGo({ x: a.x + (a.x - b.x) * 0.35, z: a.z + (a.z - b.z) * 0.35 }, b); await wait(0.9);
      Mm.hop = { t: 0 }; snd('land', 9); g.w3d.fx.puff(a.x, y + 0.3, a.z, 8, 0.24, '#d8cdb6');
      TIME.flag('past', 'molStone', true); TIME.refresh();
      const E = TIME.EFFECTS['molinar.stone'], Pc = E && E.built['show:past'];
      if (Pc && Pc.obj) { const o = Pc.obj; await STORY.tween(1.0, k => { o.position.set((a.x - b.x) * (1 - k), 0, (a.z - b.z) * (1 - k)); o.rotation.y = k * 2.2; }); o.position.set(0, 0, 0); }
      snd('land', 12); g.w3d.fx.puff(b.x, y + 0.2, b.z, 10, 0.3, '#d8cdb6'); g.w3d.fx.sparkle(b.x, y + 0.9, b.z, 14, ['#fff3a0', '#ffd7a0']); snd('learned');
      await wait(0.6); sim.mimoGo(null, null);
    } finally { M.lock(false); }
  }
  async function finaStone() {
    const s = st(); M.lock(true);
    try { const F = who('fina'); M.frame2(F); await M.say(F, ln('fina.stone')); s.finaStone = true; G().save(); } finally { M.lock(false); }
    M.think('A spare millstone, by the Great Mill… What stands there today?', 5);
  }
  // the pieces: the little millstone (then, lying; then, set by the plinth), Marga's old cart (today: broken, or mended with it;
  // tomorrow: the same, older and gray)
  function stoneMesh(at, lying) {
    const g = new THREE.Group(), k = kit(), y = gy(at.x, at.z), KG = PAST.API.KG;
    if (lying) k.add(KG.cyl, 0, y + 0.15, 0, 0.62, 0.28, 0.62, '#c9c1b0').add(KG.cyl, 0, y + 0.31, 0, 0.13, 0.05, 0.13, '#8f8878', { ink: 0 });
    else k.add(KG.cyl, 0, y + 0.6, 0, 0.62, 0.28, 0.62, '#c9c1b0', { rx: Math.PI / 2 - 0.12 }).add(KG.cyl, 0, y + 0.6, 0.05, 0.13, 0.3, 0.13, '#8f8878', { rx: Math.PI / 2 - 0.12, ink: 0 });
    k.build(g); const o = new THREE.Group(); o.position.set(at.x, 0, at.z); o.add(g); o.name = 'mol-past-stone';
    return { obj: o, solids: [{ x: at.x, z: at.z, r: 0.6 }] };
  }
  function cartMesh(kind) {
    const g = new THREE.Group(), k = kit(), x = CART_NOW.x, z = CART_NOW.z, ry = 0.35;
    const old = kind === 'old' || kind === 'oldBroken', broken = kind === 'broken' || kind === 'oldBroken';
    cart(k, x, z, ry, { broken, stone: !broken, body: old ? '#9a8f84' : '#a0683c', side: old ? '#857a70' : '#8a5f3e', wheel: old ? '#7a7068' : '#8a5f3e', stoneCol: old ? '#a8a49c' : '#c9c1b0', load: !old && !broken });
    k.build(g); g.name = 'mol-cart-' + kind;
    return { obj: g, solids: [{ x, z, r: 1.15 }] };
  }
  const LOOKS = {
    broken: 'Marga’s old cart, the one her grandmother built. One wheel lies split in two beside it. There’s no wheel like it anywhere.',
    mended: 'Marga’s old cart, rolling again! One of its wheels is a little millstone, worn smooth. Set by the Great Mill long ago… for a day like this.',
    old: 'The same cart, older still, its stone wheel gray with dust. It still rolls.',
    oldBroken: 'An old cart, gray, one wheel split in two. It hasn’t moved in years.',
    stone: 'The little millstone, by the plinth. «Useful one day», {builder} said.',
  };
  TIME.effect('molinar.stone', { region: 'molinar', when: () => !!TIME.flag('past', 'molStone'),
    before: { past: () => stoneMesh(STONE0, true), now: () => cartMesh('broken'), future: () => cartMesh('oldBroken') },
    show: { past: () => stoneMesh(STONE1, false), now: () => cartMesh('mended'), future: () => cartMesh('old') },
    act: { past: { x: STONE1.x - 1.2, z: STONE1.z + 0.6, r: 1.8, label: 'Look', run: async () => M.think(LOOKS.stone, 4.5) },
      now: { x: CART_NOW.x - 1.4, z: CART_NOW.z + 1.0, r: 2.2, label: 'Look', run: async () => { M.think(LOOKS.mended, 6.5); const n = M.st('now'); if (!n.cart) { n.cart = true; G().save(); } } },
      future: { x: CART_NOW.x - 1.4, z: CART_NOW.z + 1.0, r: 2.0, label: 'Look', run: async () => M.think(LOOKS.old, 5) } } });
  // (while it's still broken: a Look today and tomorrow)
  TIME.spot('molinar.cartBroken', { region: 'molinar', world: 'now', x: CART_NOW.x - 1.4, z: CART_NOW.z + 1.0, r: 2.2, label: 'Look', when: () => TIME.open('molinar') && !TIME.flag('past', 'molStone'), run: async () => M.think(LOOKS.broken, 6) });
  TIME.spot('molinar.cartBrokenF', { region: 'molinar', world: 'future', x: CART_NOW.x - 1.4, z: CART_NOW.z + 1.0, r: 2.0, label: 'Look', when: () => !TIME.flag('past', 'molStone'), run: async () => M.think(LOOKS.oldBroken, 5) });
  TIME.spot('molinar.stone', { region: 'molinar', world: 'past', x: STONE0.x - 1.1, z: STONE0.z + 0.6, r: 1.9, label: () => `Tell ${M.mimoName()}`,
    when: () => !!st().stoneAsked && !st().stoneTold, run: () => stoneTask() });

  // ------------------------------------------------------------ side quest: «Young Ciro’s little wheel» (the master's lesson)
  async function wheelScene() {
    const s = st(), Ms = who('master'), Ci = who('ciro'); if (!Ms || !Ci) return;
    M.lock(true);
    try {
      M.frame2(Ms); await wait(0.3); await M.demo(Ms, T().DEMO['wheel.demo'], T().MARKS['wheel.demo']);
      M.frame2(Ci, -1); await M.say(Ci, ln('ciro.lost')); s.wheelAsked = true; G().save();
    } finally { M.lock(false); }
    M.think('Something glints up on the fruit stall’s awning. Tell {mimo} what it did, as a memory.', 5.5);
  }
  async function wheelTask() {
    const s = st();
    if (!s.wheelGot) {
      const r = await M.ask(M.memTask(T().MEM.awning), { icon: 'jump' }); if (!r) return;
      TIME.grade('mol.awning', r.letter);
      const g = G(), sim = g.sim, Mm = sim.mimo, a = AWNING;
      M.lock(true);
      try {
        M.shot(V(a.at.x + 3.2, gy(a.x, a.z) + 3.2, a.at.z + 3.2), V(a.x, a.y, a.z));
        sim.mimoGo({ x: a.at.x, z: a.at.z }, a); await wait(0.8);
        Mm.hop = { t: 0 }; snd('jump'); await wait(0.4);
        g.w3d.fx.sparkle(a.x, a.y + 0.2, a.z, 16, ['#ffe08a', '#fff3c8']); snd('learned');
        s.wheelGot = true; G().save(); await wait(0.6); sim.mimoGo(null, null);
      } finally { M.lock(false); }
    }
    const Ms = who('master'); if (!Ms) return;
    M.lock(true); try { M.frame2(Ms); await M.demo(Ms, T().LOGQ.wheel, T().LOGQ_MARKS.wheel); } finally { M.lock(false); }
    const r2 = await M.ask(T().TASKS.wheel, { tips: T().TIPS }); if (!r2) { M.think('{master} is waiting for your answer.', 4); return; }
    TIME.grade('mol.wheel', r2.letter);
    M.lock(true);
    try { const M2 = who('master'); M.frame2(M2); await M.say(M2, ln('master.oil')); s.wheelDone = true; TIME.flag('past', 'molWheel', true); G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); G().save(); } finally { M.lock(false); }
  }
  TIME.spot('molinar.awning', { region: 'molinar', world: 'past', x: AWNING.at.x, z: AWNING.at.z, r: 1.9, label: () => (st().wheelGot ? 'Give it back' : `Tell ${M.mimoName()}`),
    when: () => !!st().wheelAsked && !st().wheelDone, run: () => wheelTask() });

  // ------------------------------------------------------------ side quest: «Brosio's marbles» (three in the market; then how many)
  const marblesN = () => (st().marbles || []).filter(Boolean).length;
  async function marblesScene() {
    const s = st(), K = who('kid'); if (!K) return;
    M.lock(true); try { M.frame2(K); await wait(0.3); await M.demo(K, T().DEMO['marbles.demo'], T().MARKS['marbles.demo']); s.marblesAsked = true; s.marbles = s.marbles || [false, false, false]; G().save(); } finally { M.lock(false); }
    M.think('Three marbles somewhere in the market. Look for something glinting on the ground.', 5);
  }
  async function marblePick(i) {
    const s = st(), m = MARBLES[i]; s.marbles = s.marbles || [false, false, false]; if (s.marbles[i]) return;
    s.marbles[i] = true; snd('pip'); G().w3d.fx.sparkle(m.x, gy(m.x, m.z) + 0.3, m.z, 10, ['#9fd0ff', '#fff3c8']);
    UI.toast(`A marble! (${marblesN()}/3)`); G().save();
    if (marblesN() >= 3) M.think('All three! Back to {kid}, by the Great Mill.', 4.5);
  }
  MARBLES.forEach((m, i) => TIME.spot('molinar.marble' + i, { region: 'molinar', world: 'past', x: m.x, z: m.z, r: 1.6, label: 'Pick up',
    when: () => !!st().marblesAsked && !(st().marbles || [])[i], run: async () => marblePick(i) }));
  async function marblesEnd() {
    const s = st(), K = who('kid'); if (!K) return;
    const r = await M.ask(T().TASKS.marbles, { tips: T().TIPS }); if (!r) return;
    TIME.grade('mol.marbles', r.letter);
    M.lock(true); try { const K2 = who('kid'); M.frame2(K2); await M.say(K2, ln('kid.thanks')); s.marblesDone = true; G().state.coins = (G().state.coins || 0) + 4; UI.toast('+4 coins'); G().save(); } finally { M.lock(false); }
  }
  let marbleMesh = null;
  function marbleGlints(on, t) {
    if (!marbleMesh) {
      marbleMesh = MARBLES.map(m => { const o = TK.part(TK.G.sphere, '#5a9fe0', [m.x, gy(m.x, m.z) + 0.09, m.z], [0.09, 0.09, 0.09], { ink: 0.006 }); o.visible = false; G().w3d.scene.add(o); return o; });
    }
    const s = st();
    marbleMesh.forEach((o, i) => { o.visible = on && !!s.marblesAsked && !(s.marbles || [])[i]; if (o.visible) o.scale.setScalar(0.09 * (1 + 0.15 * Math.sin(t * 5 + i))); });
  }

  // ------------------------------------------------------------ the Talk menus: side quests (the main path's scenes play straight off a Talk)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'past' || TIME.regionNow() !== 'molinar') return null;
    const s = st();
    if (it.who === 'past:builder' && s.joined) return !s.stoneTold ? [{ label: 'The little millstone', sub: '◆ side quest', run: () => (s.stoneAsked ? stoneTask() : stoneScene()) }] : null;
    if (it.who === 'past:ciro' && !s.wheelDone) return [{ label: 'The little wheel', sub: '◆ side quest', run: () => (s.wheelAsked ? wheelTask() : wheelScene()) }];
    if (it.who === 'past:master' && s.wheelAsked && !s.wheelDone) return [{ label: 'The little wheel', sub: '◆ side quest', run: () => wheelTask() }];
    if (it.who === 'past:kid' && s.met && !s.marblesAsked) return [{ label: 'The marbles', sub: '◆ side quest', run: marblesScene }];
    return null;
  });
  // today: Marga at her farm knows about her grandmother's cart (her Talk has no id: she's matched by where she stands)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || !TIME.open('molinar') || it.label !== 'Talk' || it.who) return null;
    const mol = G().molinar, F = mol && mol.people && mol.people.find(p => p.id === 'farmer'); if (!F || Math.hypot(it.x - F.x, it.z - F.z) > 0.8) return null;
    const mended = !!TIME.flag('past', 'molStone'), n = M.st('now');
    return [{ label: 'Grandma’s old cart', sub: mended && !n.marga ? '◆ side quest' : '', run: async () => {
      M.lock(true); try { F.talking = true; await M.say({ id: 'farmer', name: 'Marga', x: F.x, y: F.y, z: F.z, top: 1.6 }, MFTXT.LINES[mended ? 'marga.mended' : 'marga.broken']); } finally { F.talking = false; M.lock(false); }
      if (mended && !n.marga) { n.marga = true; G().save(); } } }];
  });

  // ------------------------------------------------------------ E, the compass, every frame
  function interactables() {
    const s = st(), out = [];
    out.push({ x: M.DOOR.x, z: M.DOOR.z, r: 2.1, label: s.joined ? 'Go in' : 'Look', run: async () => {
      if (!s.joined) { M.think(s.met ? 'The Great Mill’s door. {builder}, by the plans table, decides who goes in.' : 'The Great Mill’s door, half-built. Builders bustle all around it.', 4.5); return; }
      if (typeof MPMILL !== 'undefined') await MPMILL.enter();
    } });
    out.push({ x: TABLE.x - 0.6, z: TABLE.z + 1.0, r: 1.5, label: 'Look', run: async () => M.look(T().LOOKS['look.plans']) });
    out.push({ x: FCART.x + 1.2, z: FCART.z + 1.0, r: 1.5, label: 'Look', run: async () => M.look(T().LOOKS['look.cart']) });
    return out;
  }
  // the Looks of then (MPTXT.LOOKS), each where its thing stands: the word, said aloud and glossed, then what it is. Every spot is
  // at least 3 steps from a crack and clear of the main path's people (checked with MOLT._.t.probe)
  const LOOKS_AT = {
    scaffold: { x: 233.0, z: -171.8 }, pulley: { x: 228.0, z: -172.0 }, wheelbarrow: { x: 226.2, z: -171.0 }, mortar: { x: 230.4, z: -176.4 }, tools: { x: 226.4, z: -177.6 },
    blocks: { x: 253.0, z: -163.2 }, timber: { x: 252.6, z: -160.4 }, sails: { x: 255.0, z: -170.2 },
    cauldron: { x: 235.2, z: -165.8 }, dough: { x: 237.8, z: -165.8 }, oillamp: { x: 243.0, z: -165.9 },
    bunting: { x: 219.4, z: -145.8 }, awning: { x: 209.4, z: -143.6 }, well: { x: 215.0, z: -147.2 }, stall: { x: 228.6, z: -147.6 },
    eggs: { x: 205.4, z: -150.8 }, scales: { x: 215.4, z: -140.6 }, flour: { x: 215.0, z: -160.2 },
    grandclock: { x: 209.8, z: -131.6 }, workbench: { x: 212.2, z: -135.6 }, cuckoo: { x: 212.2, z: -133.6 }, sundial: { x: 212.6, z: -130.6 },
  };
  for (const [k, at] of Object.entries(LOOKS_AT)) TIME.spot('molinar.past.look.' + k, { region: 'molinar', world: 'past', x: at.x, z: at.z, r: 1.5, label: 'Look',
    when: () => !(typeof MPMILL !== 'undefined' && MPMILL.inside), run: async () => M.look(T().LOOKS['look.' + k]) });
  function nextId() { const s = st(); return !s.met ? 'wife' : !s.joined ? 'builder' : 'door'; }
  const HINTS = { wife: '{mimo} points at the woman with a basket of bread, by the Great Mill.', builder: '{mimo} points at the head builder, by the plans table.',
    door: '{mimo} looks at the Great Mill’s door.', fina: '{mimo} points at the woman with the new cart, by the market.', kid: '{mimo} points at the miller’s kid.',
    ciro: '{mimo} points at the young apprentice at the clock shop.', master: '{mimo} points at the old clockmaker.', stone: '{mimo} sniffs the little millstone east of the forecourt.',
    awning: '{mimo} looks up at the fruit stall’s awning.', marble: '{mimo} sniffs the ground. Something glints!' };
  function target(id) {
    if (id === 'door') return (typeof MPMILL !== 'undefined' && MPMILL.inside && MPMILL.target()) || { x: M.DOOR.x, z: M.DOOR.z, hint: HINTS.door };
    if (id === 'stone') return { x: STONE0.x, z: STONE0.z, hint: HINTS.stone };
    if (id === 'awning') return { x: AWNING.at.x, z: AWNING.at.z, hint: HINTS.awning };
    if (id === 'marble') { const i = (st().marbles || []).findIndex(f => !f); const m = MARBLES[i < 0 ? 0 : i]; return { x: m.x, z: m.z, hint: HINTS.marble }; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || '{mimo} points.' };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  function update(dt, t) { marbleGlints(true, t); }
  // (the marbles' glints only show in the Past)
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('mol_past') ? 'mol_past' : 'past');
  function init() { /* (everything builds the first time the Past is put on) */ }
  // (the marbles hide when the Past is taken off)
  const offMarbles = () => { if (marbleMesh) marbleMesh.forEach(o => { o.visible = false; }); };

  // ------------------------------------------------------------ the side quests (QUESTS.LIST: they start as the story reaches them)
  if (typeof QUESTS !== 'undefined') {
    const pS = s => M.sp(s), nS = s => M.sn(s);
    const seen = s => !!(s && s.worlds && s.worlds.seen && s.worlds.seen['molinar.noa']);
    const pastAt = id => () => M.via('past', () => target(id));
    if (!QUESTS.LIST.some(q => q.id === 'mol.stone')) QUESTS.LIST.push({ id: 'mol.stone', kind: 'side',
      get title() { return M.fillEn('The little millstone'); }, get giver() { return M.fillEn('{builder}, the head builder, by the Great Mill (Molinar, long ago)'); },
      started: s => !!pS(s).joined,
      steps: [
        { get text() { return M.fillEn('In the Past: help {builder} set the little millstone by the Great Mill'); },
          get why() { return M.fillEn('{builder} cut a millstone too small for the mill. Push it by the plinth, out of the way: tell {mimo} as a memory, then tell her what you did.'); },
          done: s => !!pS(s).stoneTold, target: () => M.via('past', () => (pS(G().state).stoneAsked ? target('stone') : target('builder'))), hint: HINTS.stone },
        { get text() { return M.fillEn('Tell {fina}, by the market, about the round stone'); }, get why() { return M.fillEn('{fina} built the first cart in Molinar. A round stone the size of a wheel… she’ll want to know.'); },
          done: s => !!pS(s).finaStone, target: pastAt('fina'), hint: HINTS.fina },
        { text: 'Today: look at Marga’s old cart by the Great Mill', why: 'A millstone set long ago… What stands by the Great Mill today?',
          done: s => !!nS(s).cart, target: () => M.via('now', () => ({ x: CART_NOW.x, z: CART_NOW.z, hint: '{mimo} points at an old cart by the Great Mill.' })), hint: '{mimo} points at an old cart by the Great Mill.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'mol.wheel')) QUESTS.LIST.push({ id: 'mol.wheel', kind: 'side',
      get title() { return M.fillEn('Young {ciro}’s little wheel'); }, get giver() { return M.fillEn('{ciro}, the apprentice, at the clock shop (Molinar, long ago)'); },
      started: s => seen(s),
      steps: [
        { get text() { return M.fillEn('In the Past: talk to {ciro}, the clockmaker’s apprentice'); }, why: 'Ciro, the clockmaker you know, was an apprentice once. His master is strict.',
          done: s => !!pS(s).wheelAsked, target: pastAt('ciro'), hint: HINTS.ciro },
        { get text() { return M.fillEn('Get the little wheel back: tell {mimo}, then answer {master}'); }, why: 'A little wheel bounced up onto the fruit stall’s awning. In the Past, {mimo} only moves in memories.',
          done: s => !!pS(s).wheelDone, target: () => M.via('past', () => (pS(G().state).wheelGot ? target('master') : target('awning'))), hint: HINTS.awning },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'mol.marbles')) QUESTS.LIST.push({ id: 'mol.marbles', kind: 'side',
      get title() { return M.fillEn('{kid}’s marbles'); }, get giver() { return M.fillEn('{kid}, the miller’s kid (Molinar, long ago)'); },
      started: s => !!pS(s).met,
      steps: [
        { get text() { return M.fillEn('In the Past: talk to {kid}, by the Great Mill'); }, why: 'The miller’s kid looks upset.', done: s => !!pS(s).marblesAsked, target: pastAt('kid'), hint: HINTS.kid },
        { text: 'Find the three marbles in the market ({n}/3)', n: s => (pS(s).marbles || []).filter(Boolean).length, why: 'Look for something blue glinting on the ground.',
          done: s => (pS(s).marbles || []).filter(Boolean).length >= 3, target: pastAt('marble'), hint: HINTS.marble },
        { get text() { return M.fillEn('Tell {kid} how many you found'); }, get why() { return M.fillEn(`About yourself, in the past: ${M.sx('found')}`); }, done: s => !!pS(s).marblesDone, target: pastAt('kid'), hint: HINTS.kid },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks (TIME calls them: time.js "TIME dresses it")
  Object.assign(M.DRESS.past, {
    people: PEOPLE,
    on(api) { show(true); hideToday(api); parkToday(true); },
    off() { show(false); parkToday(false); offMarbles(); },
    entered() { show(true); },
    late: (api, dt) => { late(); if (typeof MPMILL !== 'undefined' && MPMILL && MPMILL.inside) MPMILL.late(dt); },
    update(api, dt, t) { update(dt, t); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, TABLE, STONE0, STONE1, CART_NOW, FCART, AWNING, MARBLES, GM, PEOPLE, P, who, build, show, cart, kit, late, parkToday,
    target: id => target(id), song: () => song(), init: (g, api) => init(g, api), changed: () => {},
    _: { talk: id => talk(id), get built() { return built; } } };
})();
