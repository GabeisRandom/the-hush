'use strict';
// The Gray Marsh (DESIGN.md 14.1, region 8; 17.1): the woods at the Old Tower's feet, where the Hush is thickest. Past the Old
// Quarter, the old north road's chained gate (cemetery.js) opens once seven bells ring. Bruno is waiting there ("I'm coming
// with you this time"), and from the other side a lantern bobs out of the mist: Lucero, the lamplighter of Candil, unlocks it.
// The road goes down into a gray, misty basin of black water, dead willows and reeds, with the tower on its crag at the far end.
//   · A wall of Hush fog lies across the road. Lucero lifts her lantern and tells it «¡Ilumina!»: Mimo learns the verb by watching
//     (light: «ilumina / ilumina / leucht», 照亮, 照らして), then lights the fog away.
//   · The boardwalk to Candil is broken in three places. Lucero calls «¡Salten!» to you and Bruno (jump, you two), then
//     «¡Saltemos!» (let's jump) as you all jump; at the last gap you say it («¡Saltemos!»): commands to several people at once.
//   · Candil, the lamplighters' hamlet on its island, is hushed: everyone gray and stuck mid-task. Tell each pair what to do,
//     together: the twins and their stuck punt («¡Empujen!»), the kids skipping stones («¡Lancen!»), grandma Nieves and Marisol
//     at the shrine («¡Canten!»). Then the great lantern, everyone together: «¡Iluminemos!». Candil's color comes back.
//   · The pilgrims' causeway to the drowned chapel: light its four stone lanterns («¡Ilumina!») while shadows prowl (battle:
//     shadow versions of every kind; say which kind each one is, or light it first). The chapel's door is stuck in the mud:
//     «¡Empujemos!». Inside (marsh_chapel.js: CHAPEL), the eighth bell. Noa's page: the tower's door is open.
//   · Report to Lucero; the fog round the tower's path lifts, and the camera shows the Old Tower's door.
// The Old Tower itself (its door, steps and yard) is another file's: this one leaves YARD clear and shapes the ground to it.
//
// One global, MARSH, shaped like PEAKS:
//   plain data, ready before world.js: layout, landmarks, hush, roamers, open(state), ground(x, z, h), playDist(x, z),
//     keepClear(x, z, pad), bareAt(x, z), pathAt(x, z), tint(x, z, color, slope, h), mistAt(x, z), scatter(W), areaAt(x, z),
//     songAt(x, z), drawMap(ctx, o), roamOk(area, state)
//   MARSH.build(scene, { terrainAt }) → { colliders, platforms, moving, group, people, update(dt, t, you|null), objects, stats() }
//   the game side: init(game), interactables(), target(), wayIn(), tick(), sync(); state in state.marsh; flags: marsh (past the
//     gate), marshBruno, lucero, marshFog, bwJump, candil (all three pairs), marshLantern, marshLamps, chapelOpen, marshFree
//     (CHAPEL's finale: bells → 8), luceroEighth (the report)
// Several people at once (team.js TEAM: «¡Salten!» to you all, «¡Saltemos!» all of us, you too): the scenes here (the boardwalk,
// Candil's pairs, the great lantern, the chapel's door) and the chapel's (marsh_chapel.js) grade them with TEAM.read. In battle,
// marsh_battle.js has ONE small parse hook on P.parse: with Bruno on the field as an ally (G.fight coach: { name: 'Bruno', ally:
// true }: the marsh's roamers, the chapel, Bruno's drill), TEAM.strip turns a «you all» / «let's» command into the one form and
// marks its clauses team (Bruno strikes too; «let's» adds a stone from you; G.stats.team counts them). It steps aside for the
// general team-orders mechanic (battle/tactics.js skill C) as soon as that is on: BATTLE._.teamOrders set, or a whole-turn
// reader with k 'C' in BATTLE._.tac.whole while _.tac.on('C'). Shadows («say what it is, or light it»): marsh_battle.js too.
// Needs THREE (r128), core.js, toonkit.js, lexicon.js, icons.js and caves.js (its Kit) at load; UI, STORY, WORLD, Sound at run time.

const MARSH = (() => {
  const INK = '#2b2235';

  // ================================================================ the gate: when the region opens
  // The north road opens once the seventh bell has rung (the Sunken Ruins: flags.ruinsFree, or seven bells)
  const RUINS_FLAG = 'ruinsFree';
  const open = s => !!(s && s.flags && (s.flags[RUINS_FLAG] || (s.flags.bells || 0) >= 7));

  // ================================================================ the layout (pure data)
  function spline(pts, per = 6) {          // Catmull-Rom, as world.js smooths its roads
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }
  // a smoothed line with arc lengths: near(x, z) → { d, s, ux, uz }; at(s) → { x, z, ux, uz }
  function Line(pts, per = 6) {
    const P = spline(pts, per), S = [0];
    for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const len = S[S.length - 1];
    function near(x, z) {
      let best = 1e9, bs = 0, ux = 1, uz = 0;
      if (x < x0 - 30 || x > x1 + 30 || z < z0 - 30 || z > z1 + 30) return { d: 1e9, s: 0, ux, uz };
      for (let i = 0; i < P.length - 1; i++) {
        const ax = P[i][0], az = P[i][1], dx = P[i + 1][0] - ax, dz = P[i + 1][1] - az, l2 = dx * dx + dz * dz;
        const t = l2 ? clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1) : 0, d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
        if (d < best) { best = d; bs = S[i] + t * (S[i + 1] - S[i]); const l = Math.sqrt(l2) || 1; ux = dx / l; uz = dz / l; }
      }
      return { d: best, s: bs, ux, uz };
    }
    function at(s) {
      s = clamp(s, 0, len); let i = 1; while (i < P.length - 1 && S[i] < s) i++;
      const [ax, az] = P[i - 1], [bx, bz] = P[i], l = (S[i] - S[i - 1]) || 1, t = (s - S[i - 1]) / l;
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, ux: (bx - ax) / l, uz: (bz - az) / l };
    }
    return { pts, P, S, len, near, at, bb: { x0, x1, z0, z1 } };
  }
  // the Old Tower (world.js L.tower: main.js stands the skyline tower there, at y 6, ×2.3) and the ground round it
  const TOWER = { x: 14, z: -405 };
  const TY = 6.0, FLOOR = 0.42;
  // the road in: on from the end of the old north road past its gate (cemetery.js 'beyond', (14.7, −272)), down into the marsh
  const ROAD = Line([[14.7, -272], [15.6, -279], [14.6, -287], [11.6, -295], [7.4, -301.5], [3.4, -305.8], [0.6, -308.4]]);
  // the boardwalk to Candil over deep black water, broken in three places (gaps at these fractions of its length)
  const BW = { ax: 0.6, az: -308.4, bx: -6.4, bz: -323.2, w: 2.3, gaps: [0.27, 0.5, 0.73], gapW: 1.8 };
  BW.len = Math.hypot(BW.bx - BW.ax, BW.bz - BW.az); BW.ux = (BW.bx - BW.ax) / BW.len; BW.uz = (BW.bz - BW.az) / BW.len;
  const bwAt = t => ({ x: BW.ax + (BW.bx - BW.ax) * t, z: BW.az + (BW.bz - BW.az) * t });
  function bwInfo(x, z) { const t = clamp(((x - BW.ax) * BW.ux + (z - BW.az) * BW.uz) / BW.len, 0, 1), p = bwAt(t); return { d: Math.hypot(x - p.x, z - p.z), t }; }
  // Candil, the lamplighters' hamlet, on its island; the great lantern in the middle
  const CANDIL = { x: -14, z: -334, r: 12.4 };
  const LANTERN = { x: -14, z: -334.4 };
  // the pilgrims' causeway north-west to the drowned chapel, and its four stone lanterns
  const CAUSE = Line([[-20.4, -343.2], [-25.6, -350.4], [-30.8, -357.4], [-35.4, -363.8], [-39.4, -368.6]]);
  // the drowned chapel, standing in the black water (front: its door, toward the causeway's end; local +z)
  const CHAPEL = { x: -45.4, z: -377.6, w: 9.0, d: 13.0, rot: 0.6 };
  const CH_DOOR = { x: CHAPEL.x + Math.sin(CHAPEL.rot) * (CHAPEL.d / 2), z: CHAPEL.z + Math.cos(CHAPEL.rot) * (CHAPEL.d / 2) };
  // the path up to the Old Tower's yard (the tower's own file builds what's there: its door, steps, the yard itself)
  const TPATH = Line([[-4.4, -343.4], [-0.8, -351.6], [3.8, -360.0], [8.2, -368.4], [11.4, -376.0], [13.2, -381.4]]);
  const YARD = { x: 14, z: -386, r: 9.5 };
  // the fog banks: across the road in (Mimo lights it away), at the causeway's foot (the great lantern lifts it), round the
  // tower's path (the eighth bell lifts it)
  const FOG1 = { x: 9.6, z: -298.6, r: 4.4 };
  const FOG2 = { x: -22.6, z: -345.8, r: 3.2 };
  const FOGT = { x: 3.4, z: -358.4, r: 4.6 };
  // the stone lanterns along the causeway (by arc length), each with the fog it holds back just beyond it
  const LAMP_S = [3.6, 11.4, 19.6, 27.6];
  const LAMPS = LAMP_S.map((s, i) => { const p = CAUSE.at(s), side = i % 2 ? 1 : -1, nx = -p.uz, nz = p.ux; return { i, s, x: p.x + nx * side * 2.3, z: p.z + nz * side * 2.3, fog: CAUSE.at(Math.min(CAUSE.len - 1.5, s + 3.4)) }; });
  // the people's places in Candil (and the scenes' spots)
  const SPOT = {
    gateS: { x: 7.6, z: -251.0 }, gateN: { x: 11.6, z: -261.8 }, brunoGate: { x: 6.2, z: -252.6, yaw: 2.8 }, luceroGate: { x: 11.2, z: -262.6, yaw: -2.7 },
    fogFront: { x: 12.4, z: -293.0 }, fogWatch: { x: 13.2, z: -290.4 }, luceroFog: { x: 11.0, z: -294.4, yaw: -2.5 },
    bwStart: { x: 1.6, z: -306.6 }, bwEnd: { x: -7.4, z: -325.6 },
    lucero: { x: -10.6, z: -331.6, yaw: 2.4 }, brunoCandil: { x: -8.4, z: -327.8, yaw: 3.4 },
    twins: [{ x: -24.6, z: -330.2, yaw: -1.35 }, { x: -24.9, z: -332.2, yaw: -1.4 }], punt: { x: -28.0, z: -331.2, rot: 0.15 },
    kids: [{ x: -2.7, z: -332.4, yaw: 1.3 }, { x: -2.4, z: -335.0, yaw: 1.55 }], skip: { x: 2.4, z: -333.6 },
    singers: [{ x: -12.6, z: -343.0, yaw: Math.PI }, { x: -15.4, z: -342.8, yaw: Math.PI }], shrine: { x: -14.0, z: -345.6 },
    lanternFront: { x: -14.0, z: -330.8 }, causeFoot: { x: -20.0, z: -342.2 }, jetty: { x: -40.6, z: -370.2 },
    chapelDoor: { x: CH_DOOR.x + 0.4, z: CH_DOOR.z + 1.6 }, towerPath: { x: -3.6, z: -345.4 }, towerView: { x: 6.4, z: -366.0 },
    brunoTower: { x: 9.4, z: -372.4, yaw: 3.6 }, luceroTower: { x: 7.0, z: -370.0, yaw: 3.4 },
  };
  // the people (es / pt names that read in every language; g: the gender their own words agree with)
  const LUCERO = { id: 'lucero', name: 'Lucero', g: 'f', look: { coat: '#e2a93a', pants: '#3f4a5a', skin: '#c98e62', hair: '#2e2420', hat: '#6b4a30', scarf: '#c9453a', boots: '#3a3036', braid: true } };
  const FOLK = [
    { id: 'tadeo', name: 'Tadeo', g: 'm', pair: 'twins', look: { coat: '#4f7a8a', pants: '#3a3d4a', skin: '#d9a27a', hair: '#3a2b26', cap: '#5a6f4a', boots: '#3a3036' } },
    { id: 'ramiro', name: 'Ramiro', g: 'm', pair: 'twins', look: { coat: '#8a5a4a', pants: '#3a3d4a', skin: '#d9a27a', hair: '#3a2b26', cap: '#5a6f4a', boots: '#3a3036' } },
    { id: 'lolo', name: 'Lolo', g: 'm', pair: 'kids', kid: true, look: { coat: '#5fa05a', pants: '#4a4f66', skin: '#efc29a', hair: '#6b3b25', boots: '#3a3036' } },
    { id: 'mati', name: 'Mati', g: 'f', pair: 'kids', kid: true, look: { coat: '#e0743c', pants: '#4a4566', skin: '#a8714a', hair: '#1f1a18', boots: '#3a3036', bun: true } },
    { id: 'nieves', name: 'Nieves', g: 'f', pair: 'singers', old: true, look: { coat: '#6a5a8a', pants: '#3f3a4a', skin: '#e6b48c', hair: '#ece6dc', scarf: '#d9c08a', bun: true, shawl: '#7a5a8a' } },
    { id: 'marisol', name: 'Marisol', g: 'f', pair: 'singers', look: { coat: '#3e7fb0', pants: '#3f3a4a', skin: '#c98e62', hair: '#5a3020', scarf: '#f2e6c9', braid: true } },
  ];
  // the three tasks in Candil: who, the verb that does it, and what they're stuck doing
  const PAIRS = [
    { id: 'twins', who: ['tadeo', 'ramiro'], verb: 'v.push', icon: 'push', pose: 'push' },
    { id: 'kids', who: ['lolo', 'mati'], verb: 'v.throw', icon: 'throw', pose: 'throw' },
    { id: 'singers', who: ['nieves', 'marisol'], verb: 'v.sing', icon: 'sing', pose: 'sing' },
  ];
  // the stilt huts round Candil (front = local +z, toward the lantern); w × d, floors for the camera's blockers
  const B = (id, x, z, w, d, rot, kind, floors = 1) => ({ id, x, z, w, d, rot, kind, floors });
  const HUTS = [
    B('lamp', -5.0, -340.8, 4.4, 3.6, -2.2, 'lamp'),            // Lucero's: the lamplighters' hut (lantern poles by the door)
    B('twins', -22.6, -325.6, 4.2, 3.4, 2.3, 'hut'),
    B('nieves', -22.4, -341.6, 4.4, 3.6, 0.95, 'hut'),
    B('kids', -9.4, -323.4, 4.0, 3.4, Math.PI - 0.35, 'hut'),
  ];
  const frontOf = (b, out = 0) => ({ x: b.x + Math.sin(b.rot) * (b.d / 2 + out), z: b.z + Math.cos(b.rot) * (b.d / 2 + out), yaw: b.rot });
  // the shadows on the marsh (they show up as the way opens); every fight is in the marsh arena with Bruno at your side
  const ally = () => (typeof MARSH !== 'undefined' && MARSH.allyOn && MARSH.allyOn() ? { name: 'Bruno' } : null);
  const S_ = (kind, color, size) => ({ kind, color, size: size || 'small', shadow: true });
  const ROAMERS_BASE = [
    { x: 4.6, z: -303.8, area: 'marshRoad', foes: [S_('moth', 'blue'), S_('beetle', 'red')] },
    { x: -27.6, z: -352.6, area: 'marshCause', foes: [S_('frog', 'green'), S_('bat', 'yellow')] },
    { x: -35.0, z: -362.4, area: 'marshCause', foes: [S_('armadillo', 'red'), S_('hushling', 'blue')] },
    { x: 1.4, z: -354.6, area: 'marshPath', foes: [S_('bee', 'yellow'), S_('snowball', 'green')] },
    { x: -1.8, z: -347.0, area: 'marshPath', foes: [S_('hushling', 'red', 'big'), S_('moth', 'green')] },
  ];
  // (Port Brisa's crabs and the Sunken Ruins' worms, when their files are in: their shadows too)
  function roamers() {
    const out = ROAMERS_BASE.map(r => Object.assign({ biome: 'marsh', ally }, r));
    if (typeof PORT !== 'undefined') out.push({ x: 7.8, z: -366.2, area: 'marshPath', biome: 'marsh', ally, foes: [S_('crab', 'red'), S_('frog', 'blue')] });
    if (typeof RUINS !== 'undefined') out.push({ x: -31.4, z: -357.8, area: 'marshCause', biome: 'marsh', ally, foes: [S_('worm', 'yellow'), S_('beetle', 'green')] });
    return out;
  }
  // the gray: the road in (lifts with the fog), Candil (the great lantern), the causeway and the chapel, the tower's path (the
  // eighth bell), and the whole basin, lighter (the eighth bell too)
  const HUSH = [
    { x: 9.0, z: -300.0, r: 15, a: 0.82, marshRoad: true },
    { x: -14.0, z: -334.0, r: 19, a: 0.84, marshCandil: true },
    { x: -33.0, z: -362.0, r: 19, a: 0.8, marshCause: true },
    { x: 6.0, z: -370.0, r: 21, a: 0.86, marshTower: true },
    { x: -16.0, z: -352.0, r: 54, a: 0.42, marshAll: true },
  ];
  const REGION = { x0: -96, x1: 40, zS: -262, zN: -440 };     // where this file shapes the basin (the east range runs further)

  // ================================================================ the ground (world.js rawHeight, playDist, grass, scatter)
  // the basin: a union of ellipses, cut into the hills north of the old map's edge. < 0 inside (roughly, units)
  const LOBES = [{ x: 7, z: -296, rx: 22, rz: 30 }, { x: -18, z: -336, rx: 38, rz: 28 }, { x: -18, z: -374, rx: 40, rz: 24 }, { x: 13, z: -390, rx: 26, rz: 30 }];
  function basinDist(x, z) {
    let d = 1e9;
    for (const o of LOBES) {
      const e = Math.hypot((x - o.x) / o.rx, (z - o.z) / o.rz), R = e > 1e-6 ? Math.hypot(x - o.x, z - o.z) / e : Math.min(o.rx, o.rz);
      d = Math.min(d, R * (e - 1));
    }
    return d;
  }
  // a little tussock or two out in the water (reeds grow on them)
  const TUSSOCKS = [{ x: -3.4, z: -318.0, r: 1.8 }, { x: 6.2, z: -318.6, r: 2.2 }, { x: -30.6, z: -321.0, r: 2.4 }, { x: -36.4, z: -340.0, r: 2.6 }, { x: 1.6, z: -341.0, r: 1.8 },
    { x: -46.0, z: -357.0, r: 2.6 }, { x: -24.6, z: -366.4, r: 2.2 }, { x: -10.6, z: -362.0, r: 2.8 }, { x: -54.0, z: -366.0, r: 2.0 }, { x: -6.0, z: -378.0, r: 2.4 },
    { x: 14.0, z: -326.0, r: 2.4 }, { x: 18.0, z: -308.0, r: 1.6 }];
  // each piece of dry ground: its distance (< 0 on it) and its height there
  function landBits(x, z, hin) {
    const out = [];
    const r = ROAD.near(x, z); if (r.d < 12) out.push([r.d - 2.7, lerp(hin, FLOOR + 0.2, smoothstep(2, 22, r.s))]);
    const c = Math.hypot(x - CANDIL.x, z - CANDIL.z); if (c < CANDIL.r + 12) out.push([c - CANDIL.r, FLOOR + 0.16 + 0.12 * (1 - smoothstep(0, CANDIL.r, c))]);
    const k = CAUSE.near(x, z); if (k.d < 12) out.push([k.d - 1.9, FLOOR + 0.22]);
    const t = TPATH.near(x, z); if (t.d < 14) out.push([t.d - 2.5, lerp(FLOOR + 0.2, TY, smoothstep(13, TPATH.len, t.s))]);
    for (const q of TUSSOCKS) { const d = Math.hypot(x - q.x, z - q.z); if (d < q.r + 8) out.push([d - q.r, FLOOR - 0.05]); }
    return out;
  }
  const noise = (x, z) => 0.5 * Math.sin(x * 0.23 + 1.1) * Math.sin(z * 0.19 + 0.4) + 0.3 * Math.sin(x * 0.61 - z * 0.47);
  // the ground inside the basin: dry ground where you walk, then a shallow wadeable margin, then deep black water
  function marshH(x, z, hin) {
    const bits = landBits(x, z, hin);
    let dl = 1e9, sw = 0, sy = 0;
    for (const [d, y] of bits) { dl = Math.min(dl, d); const k = 1 - smoothstep(-0.6, 2.4, d); if (k > 0) { sw += k * k; sy += k * k * y; } }
    const landY = sw > 0 ? sy / sw : FLOOR;
    // (near the gate it's a dry meadow, not water: the wet begins further in)
    const wet = smoothstep(-285, -295, z);
    let h;
    if (dl <= 0) h = landY;
    else if (dl < 2.4) h = lerp(landY, -0.74, smoothstep(0, 2.4, dl));
    else h = lerp(-0.74, -1.95, smoothstep(2.4, 6, dl));
    if (dl > 0) h = lerp(lerp(landY, FLOOR + 0.15 + 0.2 * noise(x, z), smoothstep(0, 4, dl)), h, wet);
    // the boardwalk's water is deep all the way across (no wading round its gaps)
    const bw = bwInfo(x, z);
    if (bw.t > 0.1 && bw.t < 0.9 && bw.d < 4.2) h = Math.min(h, lerp(-1.95, h, smoothstep(2.6, 4.2, bw.d)));
    return h;
  }
  // the ridge east of the basin: the quarry's mountains carried on north (caves.js and peaks.js stop at z −312), so the land
  // north of them is mountains, not a cliff down to the plain
  function ridge(x, z) {
    if (x < 22 || z > -288) return 0;
    const k = smoothstep(22, 46, x) * smoothstep(-288, -306, z);
    return k * (16 + 7 * Math.sin(x * 0.07 + 0.4) * Math.cos(z * 0.05) + 4 * Math.sin(x * 0.19 - z * 0.13) + 9 * smoothstep(60, 120, x));
  }
  // world.js rawHeight, after the map's edge has raised the north into hills (h): the basin cut into them, the tower's rise
  function ground(x, z, h) {
    if (z > -262) return h;
    h = Math.max(h, ridge(x, z));
    if (x < REGION.x0 - 20 || x > REGION.x1 + 30 || z < REGION.zN - 10) return h;
    const dB = basinDist(x, z);
    if (dB > 6) return h;
    const inner = marshH(x, z, h);
    h = lerp(inner, h, smoothstep(-5, 6, dB));
    // the tower's rise: the crag stands on it at TY; its yard (south of the crag) is flat at TY too
    const td = Math.hypot(x - TOWER.x, z - TOWER.z);
    if (td < 34) h = lerp(h, Math.max(h, TY + (td < 18 ? 0.2 : 0)), 1 - smoothstep(24, 34, td));
    const yd = Math.hypot(x - YARD.x, z - YARD.z);
    if (yd < YARD.r + 8) h = lerp(h, TY, 1 - smoothstep(YARD.r, YARD.r + 8, yd));
    return h;
  }
  // world.js playDist: how far you are from anywhere you're meant to be (negative inside). The rim's woods are past 12
  function playDist(x, z) {
    if (z > -262 || x < REGION.x0 - 40 || x > REGION.x1 + 40 || z < REGION.zN - 20) return 1e9;
    const dB = basinDist(x, z);
    if (dB > 0) return 7 + dB * 1.2;
    let dl = 1e9; for (const [d] of landBits(x, z, FLOOR)) dl = Math.min(dl, d - 2.4);      // (the shallow margin can be waded)
    dl = Math.min(dl, bwInfo(x, z).d - 1.2, Math.hypot(x - YARD.x, z - YARD.z) - YARD.r, Math.hypot(x - CH_DOOR.x, z - CH_DOOR.z) - 4);
    if (z > -290) dl = Math.min(dl, ROAD.near(x, z).d - 8);       // (the dry meadow by the gate, before the water begins)
    return dl;
  }
  // world.js open(): no trees, rocks or flowers where you walk, nor by this file's things
  const KEEP = [];
  function keepClear(x, z, pad = 0) {
    if (z > -262 || x < REGION.x0 - 20 || x > REGION.x1 + 20) return false;
    if (ROAD.near(x, z).d < 3.6 + pad || CAUSE.near(x, z).d < 2.8 + pad || TPATH.near(x, z).d < 3.4 + pad) return true;
    if (Math.hypot(x - CANDIL.x, z - CANDIL.z) < CANDIL.r + 1 + pad || bwInfo(x, z).d < 2 + pad || Math.hypot(x - YARD.x, z - YARD.z) < YARD.r + 2 + pad) return true;
    for (const c of KEEP) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true;
    return false;
  }
  // world.js townBare: no grass on the paths, the island's trodden earth, the causeway's stones (0..1)
  function bareAt(x, z) {
    if (z > -268 || x < REGION.x0 || x > REGION.x1) return 0;
    let a = Math.max(1 - smoothstep(1.2, 2.1, ROAD.near(x, z).d), 1 - smoothstep(1.4, 2.0, CAUSE.near(x, z).d), 1 - smoothstep(1.3, 2.2, TPATH.near(x, z).d));
    const c = Math.hypot(x - CANDIL.x, z - CANDIL.z); a = Math.max(a, 0.8 * (1 - smoothstep(CANDIL.r - 4, CANDIL.r - 1, c)));
    if (Math.hypot(x - YARD.x, z - YARD.z) < YARD.r + 2) a = Math.max(a, 0.7);
    return clamp(a, 0, 1);
  }
  // world.js's path mask (the ground's tan color): the road in and the tower's path (the causeway is stone: tint, below)
  function pathAt(x, z) {
    if (z > -268 || x < REGION.x0 || x > REGION.x1) return 0;
    return 0.8 * Math.max(1 - smoothstep(1.0, 1.9, ROAD.near(x, z).d), 1 - smoothstep(1.1, 2.0, TPATH.near(x, z).d));
  }
  // world3d.js's terrain tint: peat and moss in the basin, the causeway's flagstones, gray rock on the ridge
  const MUD = new THREE.Color('#5d6450'), PEAT = new THREE.Color('#3f4536'), MOSS = new THREE.Color('#58704a'), FLAG = new THREE.Color('#8c8a80'), RIDGE = new THREE.Color('#7d786c'), _c = new THREE.Color();
  function tint(x, z, c, sl = 0, h = 0) {
    if (z > -268) return;
    const r = ridge(x, z);
    if (r > 2) { _c.copy(c).lerp(RIDGE, smoothstep(6, 16, r) * 0.7); c.copy(_c); }
    if (x < REGION.x0 - 4 || x > REGION.x1 + 4 || z < REGION.zN) return;
    const dB = basinDist(x, z); if (dB > 3) return;
    const k = 1 - smoothstep(-2, 3, dB);
    _c.copy(MUD).lerp(MOSS, 0.5 + 0.5 * Math.sin(x * 0.31 + Math.cos(z * 0.27) * 2)).lerp(PEAT, smoothstep(FLOOR + 0.1, -0.5, h));
    _c.lerp(FLAG, 1 - smoothstep(1.3, 1.9, CAUSE.near(x, z).d));
    c.lerp(_c, k * 0.82);
  }
  // world3d.js's fog: the marsh mist (0..1), thickest down in the basin; thinner once the marsh is freed (live.freed, the game side)
  const live = { freed: 0 };
  function mistAt(x, z) {
    if (z > -270 || x < REGION.x0 - 10 || x > REGION.x1 + 10) return 0;
    return smoothstep(-272, -292, z) * (1 - smoothstep(-3, 10, basinDist(x, z))) * (1 - 0.6 * live.freed);
  }
  // the world's trees north of the old map's edge (world.js keeps its own scatter where it always was): dense pines and gray
  // dead trees round the basin's rim (they're its walls), and sparse woods on the hills beyond, out to the new edge.
  // W: { addTree, treeNear, terrainAt, L }
  function scatter(W) {
    const R = rng(8080408), L = W.L, T = W.terrainAt;
    const skipOuter = (x, z) => Math.hypot(x - TOWER.x, z - TOWER.z) < 32 || (typeof CAVES !== 'undefined' && CAVES.noOuterTree && CAVES.noOuterTree(x, z)) || (typeof PEAKS !== 'undefined' && PEAKS.noOuterTree && PEAKS.noOuterTree(x, z));
    let rim = 0, far = 0;
    for (let n = 0; n < 42000 && rim < 1500; n++) {
      const x = lerp(REGION.x0 - 24, REGION.x1 + 8, R()), z = lerp(-292, REGION.zN + 2, R());
      const dB = basinDist(x, z); if (dB < 1.5 || dB > 26 || ridge(x, z) > 9) continue;
      if (keepClear(x, z, 1) || T(x, z) < L.water + 0.3 || Math.hypot(x - TOWER.x, z - TOWER.z) < 24) continue;
      const spacing = lerp(2.4, 1.8, smoothstep(2, 12, dB));
      if (R() > smoothstep(0.5, 6, dB) || W.treeNear(x, z, spacing)) continue;
      const r = R();
      W.addTree({ x, z, s: 0.9 + R() * 0.6, kind: r < 0.62 ? 'pine' : 'round', seed: R(), wall: true }); rim++;
    }
    for (let n = 0; n < 16000 && far < 900; n++) {
      const x = lerp(L.minX + 6, L.maxX - 6, R()), z = lerp(-296, L.minZ + 4, R());
      if (skipOuter(x, z) || basinDist(x, z) < 22 || ridge(x, z) > 8 || T(x, z) < L.water + 0.4 || W.treeNear(x, z, 5.5)) continue;
      W.addTree({ x, z, s: 1.0 + R() * 0.8, kind: R() < 0.6 ? 'pine' : 'round', seed: R(), wall: true, far: true }); far++;
    }
    return { rim, far };
  }
  // the mini-map's area names
  const AREAS = { road: { id: 'marshroad', name: 'The Old North Road', color: '#7a7f6a' }, marsh: { id: 'graymarsh', name: 'The Gray Marsh', color: '#6b7466' },
    candil: { id: 'candil', name: 'Candil', color: '#c99a3a' }, chapel: { id: 'chapel', name: 'The Drowned Chapel', color: '#5f6a86' }, tower: { id: 'oldtower', name: 'The Old Tower', color: '#5e5873' } };
  function areaAt(x, z) {
    if (z > -268 || x < REGION.x0 || x > REGION.x1 + 10 || z < REGION.zN) return null;
    if (basinDist(x, z) > 4) return null;
    if (Math.hypot(x - TOWER.x, z - TOWER.z) < 30) return AREAS.tower;
    if (Math.hypot(x - CANDIL.x, z - CANDIL.z) < CANDIL.r + 3) return AREAS.candil;
    if (Math.hypot(x - CHAPEL.x, z - CHAPEL.z) < 13) return AREAS.chapel;
    if (z > -298 && ROAD.near(x, z).d < 10) return AREAS.road;
    return AREAS.marsh;
  }
  // the music: the marsh's own song ('marsh', marsh_chapel.js has the chapel's; the forest's when there's none)
  function songAt(x, z) {
    const a = areaAt(x, z); if (!a) return null;
    if (typeof CHAPEL_D !== 'undefined' && CHAPEL_D.inside) return null;
    return typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('marsh') ? 'marsh' : 'forest';
  }
  // the regions' foes: a group shows up once its part of the marsh is open (main.js updateFoes)
  function roamOk(area, s) {
    const f = (s && s.flags) || {};
    if (area === 'marshRoad') return !!f.marshFog;
    if (area === 'marshCause') return !!f.marshLantern;
    if (area === 'marshPath') return !!f.marshLantern;
    return open(s);
  }
  // the mini-map's picture (minimap.js drawLand, in world units): the boardwalk, Candil's roofs, the causeway, the chapel
  function drawMap(c, o = {}) {
    const PX = o.PX || 0.33, INKC = o.INK || INK;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    const line = (P, w, col, edge) => { c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]); if (edge) { c.strokeStyle = edge; c.lineWidth = w + 1; c.stroke(); } c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
    line(ROAD.P, 2.6, '#e8d9b6', 'rgba(86,66,38,0.6)');
    line(TPATH.P, 2.4, '#e1cfa6', 'rgba(86,66,38,0.55)');
    line(CAUSE.P, 2.4, '#cfcabd', 'rgba(60,58,70,0.6)');
    // the boardwalk (planks, with its gaps)
    c.strokeStyle = '#94673c'; c.lineWidth = 1.7;
    let t0 = 0; for (const g of BW.gaps.concat([1.2])) { const a = bwAt(t0), b = bwAt(Math.min(1, g - BW.gapW / BW.len / 2)); c.beginPath(); c.moveTo(a.x, a.z); c.lineTo(b.x, b.z); c.stroke(); t0 = g + BW.gapW / BW.len / 2; }
    // Candil's ground and roofs, the lantern
    c.fillStyle = '#c9b48a'; c.strokeStyle = 'rgba(86,66,38,0.55)'; c.lineWidth = 1.2 * PX; c.beginPath(); c.arc(CANDIL.x, CANDIL.z, CANDIL.r - 0.6, 0, TAU); c.fill(); c.stroke();
    const roof = (b, col) => { c.save(); c.translate(b.x, b.z); c.rotate(-(b.rot || 0)); c.fillStyle = col; c.strokeStyle = INKC; c.lineWidth = 1.3 * PX; c.beginPath(); c.rect(-b.w / 2 - 0.3, -b.d / 2 - 0.3, b.w + 0.6, b.d + 0.6); c.fill(); c.stroke(); c.restore(); };
    HUTS.forEach(b => roof(b, b.kind === 'lamp' ? '#b8742a' : '#7d6a58'));
    c.fillStyle = '#ffd166'; c.strokeStyle = INKC; c.lineWidth = 1.2 * PX; c.beginPath(); c.arc(LANTERN.x, LANTERN.z, 0.9, 0, TAU); c.fill(); c.stroke();
    // the chapel: a stone nave and its leaning belfry
    roof(CHAPEL, '#6f6a7e');
    c.fillStyle = '#4d4763'; c.beginPath(); c.arc(CHAPEL.x - Math.sin(CHAPEL.rot) * 4.4, CHAPEL.z - Math.cos(CHAPEL.rot) * 4.4, 2.0, 0, TAU); c.fill(); c.stroke();
    // the stone lanterns
    c.fillStyle = '#e8e2d0'; for (const L of LAMPS) { c.beginPath(); c.arc(L.x, L.z, 0.55, 0, TAU); c.fill(); c.stroke(); }
    c.restore();
  }

  // ================================================================ (the rest: words, lines, the build, the game side)
  return {
    layout: { buildings: HUTS.concat([Object.assign({ id: 'chapel', kind: 'chapel', floors: 3 }, CHAPEL)]), road: ROAD.pts, boardwalk: BW, candil: CANDIL, cause: CAUSE.pts, tpath: TPATH.pts, chapel: CHAPEL, yard: YARD, tower: TOWER },
    landmarks: Object.assign({ candil: { x: CANDIL.x, z: CANDIL.z }, lantern: LANTERN, chapel: { x: CHAPEL.x, z: CHAPEL.z }, chapelDoor: CH_DOOR, yard: YARD, tower: TOWER, fog: FOG1, gate: SPOT.gateN }, SPOT),
    hush: HUSH, get roamers() { return roamers(); }, open, RUINS_FLAG, roamOk, live,
    // the old north road's gate (cemetery.js's landmarks; null when it isn't there)
    northGate: () => (typeof CEMETERY !== 'undefined' && CEMETERY && ((CEMETERY.landmarks && CEMETERY.landmarks.northGate) || (CEMETERY.SPOT && CEMETERY.SPOT.northGate) || (CEMETERY._ && CEMETERY._.SPOT && CEMETERY._.SPOT.northGate))) || null,
    ground, playDist, keepClear, bareAt, pathAt, tint, mistAt, scatter, areaAt, songAt, drawMap, basinDist, landBits, marshH, ridge, bwInfo, bwAt, frontOf,
    ROAD, CAUSE, TPATH, BW, CANDIL, LANTERN, CHAPEL, CH_DOOR, YARD, TOWER, TY, FLOOR, FOG1, FOG2, FOGT, LAMPS, SPOT, LUCERO, FOLK, PAIRS, HUTS, KEEP, REGION, AREAS, TUSSOCKS, spline, Line,
  };
})();

// ================================================================ words, icons and lines (registered at load)
(() => {
  const C = MARSH;
  // the region's words: light (the verb key: Lucero shows it with her lantern), and fog, shadow, chapel
  const LIGHT = { id: 'v.light', kind: 'verb', es: 'ilumina', pt: 'ilumina', de: 'leucht', zh: '[照亮|zhào liàng]', ja: '[照|て]らして', en: 'light (up)', icon: 'light',
    alt: { es: ['alumbra', 'ilumine', 'ilumínalo', 'alumbre'], pt: ['ilumine', 'acende', 'acenda'], de: ['leuchte', 'leuchtet', 'leuchten'], zh: ['[照|zhào]', '[点亮|diǎn liàng]'], ja: ['[照|て]らせ', '[照|て]らす', '[光|ひか]って'] } };
  const NEW_WORDS = [
    { id: 'w.fog', es: 'niebla', pt: 'névoa', de: 'Nebel', zh: '[雾|wù]', ja: '[霧|きり]', en: 'fog', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'nieblas', pt: 'névoas', de: 'Nebel', zh: '[雾|wù]', ja: '[霧|きり]' }, icon: 'fog', alt: { pt: ['neblina'] } },
    { id: 'w.shadow', es: 'sombra', pt: 'sombra', de: 'Schatten', zh: '[影子|yǐng zi]', ja: '[影|かげ]', en: 'shadow', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'sombras', pt: 'sombras', de: 'Schatten', zh: '[影子|yǐng zi]', ja: '[影|かげ]' }, icon: 'shadow' },
    { id: 'w.chapel', es: 'capilla', pt: 'capela', de: 'Kapelle', zh: '[教堂|jiào táng]', ja: '[礼拝堂|れいはいどう]', en: 'chapel', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'capillas', pt: 'capelas', de: 'Kapellen', zh: '[教堂|jiào táng]', ja: '[礼拝堂|れいはいどう]' }, icon: 'chapel' },
  ];
  // other files' words that have no zh / ja yet (filled in only when missing)
  const CJK_FILL = { 'w.candle': { zh: '[蜡烛|là zhú]', ja: 'ろうそく' }, 'w.bell': { zh: '[钟|zhōng]', ja: '[鐘|かね]' } };
  function registerWords() {
    if (typeof LEX === 'undefined') return;
    LEX.register(NEW_WORDS.filter(w => !LEX.item(w.id)));
    const it = LEX.item('v.light');
    if (!it) LEX.register([LIGHT]);
    else { it.icon = it.icon || 'light'; it.alt = it.alt || {}; for (const l of Object.keys(LIGHT.alt)) it.alt[l] = Array.from(new Set([...(it.alt[l] || []), ...LIGHT.alt[l]])); for (const l of ['zh', 'ja']) if (!it[l]) it[l] = LIGHT[l]; }
    for (const [id, f] of Object.entries(CJK_FILL)) { const w = LEX.item(id); if (w) for (const l of ['zh', 'ja']) if (!w[l]) w[l] = f[l]; }
  }
  registerWords();
  // icons (ICONS.add: drawn twice, pass 0 the paper border, pass 1 colors and ink, in a 100 × 100 box)
  if (typeof ICONS !== 'undefined') {
    ICONS.add('light', (c, p, h) => {      // a lantern, shining
      if (p) { const g = c.createRadialGradient(0, 4, 4, 0, 4, 40); g.addColorStop(0, 'rgba(255,226,120,0.9)'); g.addColorStop(1, 'rgba(255,226,120,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 4, 40, 0, TAU); c.fill(); }
      h.shape(c, p, h.rr(-14, -16, 28, 34, 5), '#ffe27a'); h.shape(c, p, h.rr(-18, -22, 36, 7, 3), '#5a4a3a'); h.shape(c, p, h.rr(-18, 17, 36, 7, 3), '#5a4a3a');
      h.shape(c, p, h.ell(0, -30, 7, 6), '#5a4a3a');
      if (p) { c.strokeStyle = h.INK; c.lineWidth = 2.4; for (const x of [-7, 7]) { c.beginPath(); c.moveTo(x, -15); c.lineTo(x, 17); c.stroke(); } h.dot(c, 0, 3, 5, '#ff9a3a'); }
    });
    ICONS.add('fog', (c, p, h) => { h.shape(c, p, h.ell(-12, 8, 24, 13), '#c9c8d4'); h.shape(c, p, h.ell(12, 0, 22, 14), '#b9b8c6'); h.shape(c, p, h.ell(0, -14, 18, 11), '#d6d5e0'); });
    ICONS.add('shadow', (c, p, h) => {     // a dark shape with two glowing eyes
      h.shape(c, p, h.ell(0, 8, 26, 22), '#3a3550'); h.shape(c, p, h.poly([[-20, -6], [-12, -30], [-4, -10]]), '#3a3550'); h.shape(c, p, h.poly([[20, -6], [12, -30], [4, -10]]), '#3a3550');
      if (p) { h.dot(c, -8, 4, 4, '#fff3a0'); h.dot(c, 8, 4, 4, '#fff3a0'); }
    });
    ICONS.add('chapel', (c, p, h) => {     // a little stone chapel with a belfry
      h.shape(c, p, h.rr(-26, -2, 40, 30, 2), '#b4ad9c'); h.shape(c, p, h.poly([[-30, 0], [-6, -20], [18, 0]]), '#6f6a7e');
      h.shape(c, p, h.rr(14, -30, 14, 58, 2), '#a39b8f'); h.shape(c, p, h.poly([[12, -28], [21, -42], [30, -28]]), '#5e5873');
      if (p) { h.shape(c, p, h.rr(-12, 12, 10, 16, 4), '#3a3036'); h.dot(c, 21, -20, 3, '#e6b84a'); }
    });
  }

  // ---------------------------------------------------------------- lines: T(en, es, pt, de, zh, ja). The en is the weave's (slots).
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const ML = {
    // Lucero, the lamplighter of Candil (a teen, bright and brave): «tú / ustedes», «você / vocês», «du / ihr»; casual in ja
    'l.gate1': T('Voices? Real voices! Wait, wait: I’ve got the key!', '¿Voces? ¡Voces de verdad! ¡Esperen, esperen, tengo la llave!', 'Vozes? Vozes de verdade! Esperem, esperem, eu tenho a chave!', 'Stimmen? Echte Stimmen! Wartet, wartet, ich habe den Schlüssel!',
      '[声音|shēng yīn] ？ [真|zhēn] [的|de] [声音|shēng yīn] ！ [你们|nǐ men] [等等|děng deng] ， [我|wǒ] [有|yǒu] [钥匙|yào shi] ！', '[声|こえ] ？ [本物|ほんもの] の [声|こえ] だ ！ [待|ま]って 、 かぎ が ある よ ！'),
    'l.gate2': T('I’m Lucero, the lamplighter of Candil. Since the {w.bell:pl} went quiet, nobody comes up this road.', 'Soy Lucero, la farolera de Candil. Desde que se callaron las campanas, nadie viene por este camino.',
      'Eu sou a Lucero, a acendedora de lampiões de Candil. Desde que os sinos se calaram, ninguém vem por esta estrada.', 'Ich bin Lucero, die Laternenanzünderin von Candil. Seit die Glocken schweigen, kommt niemand mehr diesen Weg.',
      '[我|wǒ] [叫|jiào] [卢塞罗|Lú sài luó] ， [是|shì] [灯村|Dēng cūn] [的|de] [点灯人|diǎn dēng rén] 。 [钟|zhōng] [不|bù] [响|xiǎng] [以后|yǐ hòu] ， [没有|méi yǒu] [人|rén] [走|zǒu] [这|zhè] [条|tiáo] [路|lù] [了|le] 。',
      'わたし は ルセロ 。 カンディル の [明|あ]かり [番|ばん] だ よ 。 [鐘|かね] が [鳴|な]らなく なって から 、 だれ も この [道|みち] を [来|こ]ない の 。'),
    'l.gate3': T('The last {w.bell}? It’s in the drowned {w.chapel}, deep in the marsh. But there’s Hush everywhere… and {w.shadow:pl}. Come: I’ll light the way.',
      '¿La última campana? Está en la capilla ahogada, en lo hondo de la ciénaga. Pero hay Silencio por todas partes… y sombras. Vengan: yo les ilumino el camino.',
      'O último sino? Fica na capela afogada, no fundo do pântano. Mas tem Silêncio por todo lado… e sombras. Venham: eu ilumino o caminho.',
      'Die letzte Glocke? Die ist in der versunkenen Kapelle, tief im Moor. Aber überall ist Stille… und Schatten. Kommt: Ich leuchte euch den Weg.',
      '[最后|zuì hòu] [一|yī] [口|kǒu] [钟|zhōng] ？ [在|zài] [沼泽|zhǎo zé] [深处|shēn chù] [沉没|chén mò] [的|de] [教堂|jiào táng] [里|lǐ] 。 [可是|kě shì] [到处|dào chù] [都|dōu] [是|shì] [寂静|Jì jìng] … [还有|hái yǒu] [影子|yǐng zi] 。 [来|lái] [吧|ba] ， [我|wǒ] [给|gěi] [你们|nǐ men] [照|zhào] [路|lù] 。',
      '[最後|さいご] の [鐘|かね] ？ [沼|ぬま] の [奥|おく] の 、 [沈|しず]んだ [礼拝堂|れいはいどう] に ある よ 。 でも 、 どこ も [静寂|せいじゃく] だらけ … それ に [影|かげ] も 。 おいで 。 [道|みち] を [照|て]らして あげる 。'),
    'l.fog1': T('The Hush {w.fog}. Every day it’s thicker. Watch.', 'La niebla del Silencio. Cada día está más espesa. Miren.', 'A névoa do Silêncio. Cada dia está mais grossa. Olhem.', 'Der Nebel der Stille. Jeden Tag wird er dicker. Schaut mal.',
      '[寂静|Jì jìng] [的|de] [雾|wù] 。 [一天|yī tiān] [比|bǐ] [一天|yī tiān] [浓|nóng] 。 [你们|nǐ men] [看|kàn] 。', '[静寂|せいじゃく] の [霧|きり] だ よ 。 [毎日|まいにち] 、 [濃|こ]く なる 。 [見|み]て て 。'),
    'l.fog2': T('It learns fast! My little lantern is too small for this wall… But you shine when you hear a word, don’t you?', '¡Qué rápido aprende! Mi farolito es muy chico para esta pared… Pero tú brillas cuando oyes una palabra, ¿verdad?',
      'Que rápido aprende! A minha lanterninha é pequena demais pra essa parede… Mas você brilha quando ouve uma palavra, né?', 'Wie schnell es lernt! Meine Laterne ist zu klein für diese Wand… Aber du leuchtest, wenn du ein Wort hörst, oder?',
      '[学|xué] [得|de] [真|zhēn] [快|kuài] ！ [我|wǒ] [的|de] [小|xiǎo] [灯|dēng] [太|tài] [小|xiǎo] [了|le] … [可是|kě shì] [你|nǐ] [一|yī] [听到|tīng dào] [词|cí] [就|jiù] [会|huì] [发光|fā guāng] ， [对|duì] [吧|ba] ？',
      '[覚|おぼ]える の 、 [早|はや]い ね ！ わたし の ランタン は [小|ちい]さ すぎる … でも 、 きみ は [言葉|ことば] を [聞|き]く と [光|ひか]る ん でしょ ？'),
    'l.fog3': T('Look at that! You lit up the whole road! Come on, Candil isn’t far.', '¡Miren eso! ¡Iluminaste todo el camino! Vengan, Candil no está lejos.', 'Olhem só! Você iluminou o caminho todo! Venham, Candil não fica longe.', 'Seht euch das an! Du hast den ganzen Weg erleuchtet! Kommt, Candil ist nicht weit.',
      '[你们|nǐ men] [看|kàn] ！ [整条|zhěng tiáo] [路|lù] [都|dōu] [亮|liàng] [了|le] ！ [来|lái] ， [灯村|Dēng cūn] [不|bù] [远|yuǎn] [了|le] 。', '[見|み]て ！ [道|みち] が ぜんぶ [明|あか]るく なった ！ おいで 、 カンディル は もう すぐ だ よ 。'),
    'l.bw1': T('The old boardwalk. It’s broken in three places. Watch me!', 'La pasarela vieja. Está rota en tres partes. ¡Mírenme!', 'A passarela velha. Está quebrada em três lugares. Olhem pra mim!', 'Der alte Steg. Er ist an drei Stellen kaputt. Schaut her!',
      '[旧|jiù] [木栈道|mù zhàn dào] 。 [断|duàn] [了|le] [三|sān] [处|chù] 。 [你们|nǐ men] [看|kàn] [我|wǒ] ！', '[古|ふる]い [板|いた] の [道|みち] 。 [三|みっ]つ の ところ で [切|き]れて る 。 [見|み]て て ！'),
    'l.bw3': T('Last one! Now you say it: all of us, at the same time!', '¡La última! Ahora dilo tú: ¡todos a la vez!', 'A última! Agora fala você: todo mundo ao mesmo tempo!', 'Die letzte! Jetzt sagst du es: alle zusammen!',
      '[最后|zuì hòu] [一个|yī gè] ！ [这次|zhè cì] [你|nǐ] [来|lái] [说|shuō] ： [大家|dà jiā] [一起|yī qǐ] ！', '[最後|さいご] だ よ ！ [今度|こんど] は きみ が [言|い]って 。 みんな いっしょ に ！'),
    'l.bwYou': T('Hey, you’re still over there! «{T:jump:you}» is just for us two. With you too, it’s «{T:jump:we}»', '¡Eh, te quedaste ahí! «Salten» es solo para nosotros dos. Contigo también: «¡Saltemos!»', 'Ei, você ficou aí! «Pulem» é só pra nós dois. Com você também: «Vamos pular!»', 'He, du bist noch drüben! «Springt» heißt nur wir zwei. Mit dir zusammen: «Springen wir!»',
      '[喂|wèi] ， [你|nǐ] [还|hái] [在|zài] [那边|nà biān] ！ “ [你们|nǐ men] [跳|tiào] ” [只|zhǐ] [说|shuō] [我们|wǒ men] [两|liǎng] [个|gè] 。 [你|nǐ] [也|yě] [来|lái] ： “ [我们|wǒ men] [一起|yī qǐ] [跳|tiào] [吧|ba] ！ ”',
      'あれ 、 まだ そっち に いる ！ 「 ふたり とも 、 [跳|と]んで 」 は わたしたち だけ 。 きみ も なら 、 「 [跳|と]ぼう ！ 」'),
    'l.bwOne': T('Ha! Only {mimo} jumped. All of us together: «{T:jump:we}»', '¡Ja! Solo saltó {mimo}. A la vez: «¡Saltemos!»', 'Ha! Só {mimo} pulou. Todo mundo junto: «Vamos pular!»', 'Ha! Nur {mimo} ist gesprungen. Alle zusammen: «Springen wir!»',
      '[哈|hā] ！ [只有|zhǐ yǒu] {mimo} [跳|tiào] [了|le] 。 [大家|dà jiā] [一起|yī qǐ] ： “ [我们|wǒ men] [一起|yī qǐ] [跳|tiào] [吧|ba] ！ ”', 'あはは ！ {mimo} だけ [跳|と]んだ 。 みんな で なら 、 「 [跳|と]ぼう ！ 」'),
    'l.bwDone': T('We made it! I’ll ask the twins to put new planks in. Candil’s right there.', '¡Lo logramos! Les pido a los gemelos que pongan tablas nuevas. Candil está ahí mismo.', 'Conseguimos! Vou pedir pros gêmeos colocarem tábuas novas. Candil é logo ali.', 'Geschafft! Ich bitte die Zwillinge, neue Bretter hinzulegen. Candil ist gleich da.',
      '[成功|chéng gōng] [了|le] ！ [我|wǒ] [会|huì] [请|qǐng] [双胞胎|shuāng bāo tāi] [铺|pū] [新|xīn] [木板|mù bǎn] 。 [灯村|Dēng cūn] [就|jiù] [在|zài] [前面|qián miàn] 。', 'やった ！ ふたご に [新|あたら]しい [板|いた] を たのむ ね 。 カンディル は すぐ そこ だ よ 。'),
    'l.candil1': T('Here we are: Candil. Everyone’s… gray. The Hush caught them in the middle of their work. They can’t talk. But they can still hear!', 'Ya llegamos: Candil. Todos están… grises. El Silencio los atrapó en medio del trabajo. No pueden hablar. ¡Pero todavía oyen!',
      'Chegamos: Candil. Está todo mundo… cinza. O Silêncio pegou eles no meio do trabalho. Eles não falam. Mas ainda escutam!', 'Da sind wir: Candil. Alle sind… grau. Die Stille hat sie mitten in der Arbeit erwischt. Sie können nicht sprechen. Aber sie hören noch!',
      '[到|dào] [了|le] ： [灯村|Dēng cūn] 。 [大家|dà jiā] [都|dōu] … [变成|biàn chéng] [灰色|huī sè] [了|le] 。 [他们|tā men] [干活|gàn huó] [的|de] [时候|shí hou] [被|bèi] [寂静|Jì jìng] [抓住|zhuā zhù] [了|le] 。 [他们|tā men] [不能|bù néng] [说话|shuō huà] ， [可是|kě shì] [还|hái] [听得见|tīng de jiàn] ！',
      '[着|つ]いた よ 。 カンディル だ 。 みんな … [灰色|はいいろ] 。 [仕事|しごと] の [途中|とちゅう] で 、 [静寂|せいじゃく] に つかまった の 。 [話|はな]せない けど 、 まだ [聞|き]こえる ！'),
    'l.candil2': T('Tell each pair what to do, both at once, like I told you two on the boardwalk. Each pair is stuck in the middle of something.', 'Díganle a cada pareja qué hacer, a las dos personas a la vez, como yo a ustedes en la pasarela. Cada pareja se quedó a medias.',
      'Digam pra cada dupla o que fazer, as duas pessoas ao mesmo tempo, como eu fiz com vocês na passarela. Cada dupla ficou pela metade.', 'Sagt jedem Paar, was es tun soll, beiden auf einmal, so wie ich es euch auf dem Steg gesagt habe. Jedes Paar ist mittendrin stecken geblieben.',
      '[告诉|gào su] [每|měi] [一|yī] [对|duì] [人|rén] [该|gāi] [做|zuò] [什么|shén me] ， [两个|liǎng gè] [人|rén] [一起|yī qǐ] ， [就|jiù] [像|xiàng] [我|wǒ] [在|zài] [木栈道|mù zhàn dào] [上|shàng] [对|duì] [你们|nǐ men] [说|shuō] [的|de] 。',
      'ふたり ずつ 、 [何|なに] を する か [言|い]って あげて 。 [板|いた] の [道|みち] で わたし が ふたり に [言|い]った みたい に ね 。'),
    'l.candil3': T('Everyone’s back! Now the great lantern. It needs all of us, every night.', '¡Volvieron todos! Ahora, el gran farol. Necesita a todo el mundo, cada noche.', 'Todo mundo voltou! Agora, o grande lampião. Ele precisa de todo mundo, toda noite.', 'Alle sind wieder da! Jetzt die große Laterne. Sie braucht uns alle, jeden Abend.',
      '[大家|dà jiā] [都|dōu] [回来|huí lái] [了|le] ！ [现在|xiàn zài] [是|shì] [大|dà] [灯|dēng] 。 [每天|měi tiān] [晚上|wǎn shang] [都|dōu] [要|yào] [大家|dà jiā] [一起|yī qǐ] 。', 'みんな [戻|もど]った ！ [次|つぎ] は [大|おお]きな ランタン 。 [毎晩|まいばん] 、 みんな で [灯|とも]す の 。'),
    'l.lit': T('Candil is shining again! Look: the {w.fog} on the causeway is going. The drowned {w.chapel} is that way.', '¡Candil brilla otra vez! Miren: la niebla del camino de piedra se va. La capilla ahogada está por allí.', 'Candil brilha de novo! Olhem: a névoa do caminho de pedra está indo embora. A capela afogada fica pra lá.', 'Candil leuchtet wieder! Schaut: Der Nebel auf dem Steinweg verschwindet. Die versunkene Kapelle ist dort drüben.',
      '[灯村|Dēng cūn] [又|yòu] [亮|liàng] [了|le] ！ [你们|nǐ men] [看|kàn] ： [石|shí] [路|lù] [上|shàng] [的|de] [雾|wù] [散|sàn] [了|le] 。 [沉没|chén mò] [的|de] [教堂|jiào táng] [在|zài] [那边|nà biān] 。', 'カンディル が また [光|ひか]って る ！ [見|み]て 、 [石|いし] の [道|みち] の [霧|きり] が [消|き]えて いく 。 [沈|しず]んだ [礼拝堂|れいはいどう] は あっち だ よ 。'),
    'l.lamps': T('The pilgrims’ lanterns. Light each one, and the {w.fog} lets you by. And mind the {w.shadow:pl}!', 'Los faroles de los peregrinos. Ilumina cada uno, y la niebla te deja pasar. ¡Y cuidado con las sombras!', 'As lanternas dos peregrinos. Ilumina cada uma, e a névoa deixa você passar. E cuidado com as sombras!', 'Die Laternen der Pilger. Leucht jede an, dann lässt dich der Nebel durch. Und pass auf die Schatten auf!',
      '[朝圣者|cháo shèng zhě] [的|de] [石|shí] [灯|dēng] 。 [每|měi] [一|yī] [盏|zhǎn] [都|dōu] [照亮|zhào liàng] ， [雾|wù] [就|jiù] [会|huì] [让|ràng] [路|lù] 。 [小心|xiǎo xīn] [影子|yǐng zi] ！', '[巡礼|じゅんれい] の [石灯籠|いしどうろう] だ よ 。 [一|ひと]つ ずつ [照|て]らせば 、 [霧|きり] が [道|みち] を あける 。 [影|かげ] に [気|き] を つけて ！'),
    'l.door': T('Stuck in the mud, like Nieves said. One alone can’t do it.', 'Atascada en el barro, como dijo Nieves. Una persona sola no puede.', 'Presa na lama, como a Nieves disse. Uma pessoa sozinha não consegue.', 'Im Schlamm stecken geblieben, wie Nieves gesagt hat. Allein schafft das keiner.',
      '[跟|gēn] [涅韦斯|Niè wéi sī] [说|shuō] [的|de] [一样|yī yàng] ， [门|mén] [卡|qiǎ] [在|zài] [泥|ní] [里|lǐ] [了|le] 。 [一个|yī gè] [人|rén] [推|tuī] [不|bù] [动|dòng] 。', 'ネベス さん の [言|い]った とおり 、 どろ に はまって る 。 ひとり じゃ むり だ よ 。'),
    'l.doorOpen': T('It’s open! It’s dark in there… and wet. I’m coming with you.', '¡Está abierta! Ahí dentro está oscuro… y mojado. Voy con ustedes.', 'Abriu! Lá dentro está escuro… e molhado. Eu vou com vocês.', 'Sie ist offen! Da drin ist es dunkel… und nass. Ich komme mit.',
      '[开|kāi] [了|le] ！ [里面|lǐ miàn] [又|yòu] [黑|hēi] [又|yòu] [湿|shī] … [我|wǒ] [跟|gēn] [你们|nǐ men] [一起|yī qǐ] [去|qù] 。', '[開|あ]いた ！ [中|なか] は [暗|くら]くて … ぬれて る 。 わたし も [行|い]く よ 。'),
    'l.chat': T('Every evening I light every lantern in Candil. And now we’ve got our voices back!', 'Cada tarde enciendo todos los faroles de Candil. ¡Y ahora volvieron nuestras voces!', 'Toda tarde eu acendo todos os lampiões de Candil. E agora as nossas vozes voltaram!', 'Jeden Abend zünde ich alle Laternen in Candil an. Und jetzt sind unsere Stimmen wieder da!',
      '[每天|měi tiān] [傍晚|bàng wǎn] ， [我|wǒ] [点亮|diǎn liàng] [灯村|Dēng cūn] [所有|suǒ yǒu] [的|de] [灯|dēng] 。 [现在|xiàn zài] [我们|wǒ men] [的|de] [声音|shēng yīn] [也|yě] [回来|huí lái] [了|le] ！', '[毎晩|まいばん] 、 カンディル の ランタン を ぜんぶ [灯|とも]す の 。 それ に 、 みんな の [声|こえ] も [戻|もど]った ！'),
    'l.after': T('The eighth {w.bell}… and look at the {w.tower} up there. Go carefully. Candil will keep a light on for you.', 'La octava campana… y mira la torre allá arriba. Ve con cuidado. En Candil te dejamos una luz encendida.',
      'O oitavo sino… e olha a torre lá em cima. Vai com cuidado. Em Candil a gente deixa uma luz acesa pra você.', 'Die achte Glocke… und schau dir den Turm da oben an. Pass auf dich auf. In Candil lassen wir dir ein Licht an.',
      '[第八|dì bā] [口|kǒu] [钟|zhōng] … [你|nǐ] [看|kàn] [上面|shàng miàn] [那|nà] [座|zuò] [塔|tǎ] 。 [小心|xiǎo xīn] [点|diǎn] 。 [灯村|Dēng cūn] [会|huì] [为|wèi] [你|nǐ] [留|liú] [一|yī] [盏|zhǎn] [灯|dēng] 。', '[八|やっ]つ [目|め] の [鐘|かね] … それ に 、 [上|うえ] の [塔|とう] を [見|み]て 。 [気|き] を つけて ね 。 カンディル で [明|あ]かり を つけて [待|ま]って る よ 。'),
    // the report: back at Candil after the eighth bell
    'l.rep1': T('You rang it! The eighth {w.bell}! Listen… the whole marsh is waking up.', '¡La tocaste! ¡La octava campana! Escucha… toda la ciénaga se despierta.', 'Você tocou! O oitavo sino! Escuta… o pântano inteiro está acordando.', 'Du hast sie geläutet! Die achte Glocke! Hör mal… das ganze Moor wacht auf.',
      '[你|nǐ] [敲响|qiāo xiǎng] [了|le] ！ [第八|dì bā] [口|kǒu] [钟|zhōng] ！ [你|nǐ] [听|tīng] … [整个|zhěng gè] [沼泽|zhǎo zé] [都|dōu] [醒|xǐng] [了|le] 。', '[鳴|な]らした ね ！ [八|やっ]つ [目|め] の [鐘|かね] ！ [聞|き]いて … [沼|ぬま] ぜんぶ が [目|め] を [覚|さ]まして る 。'),
    'l.rep2': T('And look, up there: the old {w.tower}’s door. It’s open! For the first time since the Hush.', 'Y mira, allá arriba: la puerta de la torre vieja. ¡Está abierta! Por primera vez desde el Silencio.', 'E olha, lá em cima: a porta da torre velha. Está aberta! Pela primeira vez desde o Silêncio.', 'Und schau, da oben: die Tür des alten Turms. Sie ist offen! Zum ersten Mal seit der Stille.',
      '[你|nǐ] [看|kàn] [上面|shàng miàn] ： [古塔|gǔ tǎ] [的|de] [门|mén] 。 [开|kāi] [了|le] ！ [寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [这|zhè] [是|shì] [第一|dì yī] [次|cì] 。', 'それ に 、 [上|うえ] を [見|み]て 。 [古|ふる]い [塔|とう] の [扉|とびら] 。 [開|あ]いて る ！ [静寂|せいじゃく] が [来|き]て から 、 はじめて だ よ 。'),
    // the people of Candil once their words come back
    'p.twins': T('It moved! Ramiro, we can talk again! Thank you, thank you!', '¡Se movió! ¡Ramiro, podemos hablar otra vez! ¡Gracias, gracias!', 'Mexeu! Ramiro, a gente pode falar de novo! Obrigado, obrigado!', 'Es hat sich bewegt! Ramiro, wir können wieder reden! Danke, danke!',
      '[动|dòng] [了|le] ！ [拉米罗|Lā mǐ luó] ， [我们|wǒ men] [又|yòu] [能|néng] [说话|shuō huà] [了|le] ！ [谢谢|xiè xie] ， [谢谢|xiè xie] ！', '[動|うご]いた ！ ラミロ 、 また [話|はな]せる ぞ ！ ありがとう 、 ありがとう ！'),
    'p.kids': T('Four skips! No, five! We were stuck forever! Thanks!', '¡Cuatro saltos! ¡No, cinco! ¡Estábamos atascados para siempre! ¡Gracias!', 'Quatro pulos! Não, cinco! A gente estava preso pra sempre! Valeu!', 'Vier Hüpfer! Nein, fünf! Wir waren ewig festgefroren! Danke!',
      '[跳|tiào] [了|le] [四|sì] [下|xià] ！ [不|bù] ， [五|wǔ] [下|xià] ！ [我们|wǒ men] [卡|qiǎ] [了|le] [好|hǎo] [久|jiǔ] ！ [谢谢|xiè xie] ！', '[四回|よんかい] はねた ！ ちがう 、 [五回|ごかい] ！ ずっと [止|と]まって た ！ ありがとう ！'),
    'p.singers': T('Our evening song… I remember it again. I rang the {w.chapel}’s {w.bell} every night, you know. Its door sticks in the mud: it takes everyone to open it.',
      'Nuestra canción de la tarde… otra vez la recuerdo. Yo tocaba la campana de la capilla cada noche, ¿sabes? Su puerta se atasca en el barro: hace falta todo el mundo para abrirla.',
      'A nossa canção da tarde… eu lembro de novo. Eu tocava o sino da capela toda noite, sabia? A porta dela emperra na lama: precisa de todo mundo pra abrir.',
      'Unser Abendlied… jetzt weiß ich es wieder. Ich habe jeden Abend die Glocke der Kapelle geläutet, weißt du? Ihre Tür steckt im Schlamm fest: Es braucht alle, um sie zu öffnen.',
      '[我们|wǒ men] [的|de] [晚歌|wǎn gē] … [我|wǒ] [又|yòu] [想起来|xiǎng qǐ lái] [了|le] 。 [你|nǐ] [知道|zhī dào] [吗|ma] ？ [我|wǒ] [以前|yǐ qián] [每天|měi tiān] [晚上|wǎn shang] [敲|qiāo] [教堂|jiào táng] [的|de] [钟|zhōng] 。 [它|tā] [的|de] [门|mén] [卡|qiǎ] [在|zài] [泥|ní] [里|lǐ] ， [要|yào] [大家|dà jiā] [一起|yī qǐ] [才|cái] [能|néng] [打开|dǎ kāi] 。',
      'わたしたち の [夕方|ゆうがた] の [歌|うた] … また [思|おも]い[出|だ]した よ 。 わたし は [毎晩|まいばん] 、 [礼拝堂|れいはいどう] の [鐘|かね] を [鳴|な]らして いた の よ 。 あそこ の [扉|とびら] は どろ に はまる から 、 みんな で [開|あ]けない と ね 。'),
    'p.twinsChat': T('We pole the punt across the marsh every day. Without words it just sat there.', 'Llevamos el bote por la ciénaga todos los días. Sin palabras, se quedó ahí parado.', 'A gente leva o barco pelo pântano todo dia. Sem palavras, ele ficou parado.', 'Wir staken jeden Tag den Kahn durchs Moor. Ohne Worte lag er nur da.',
      '[我们|wǒ men] [每天|měi tiān] [撑|chēng] [船|chuán] [穿过|chuān guò] [沼泽|zhǎo zé] 。 [没有|méi yǒu] [话|huà] ， [船|chuán] [就|jiù] [一直|yī zhí] [停|tíng] [在|zài] [那里|nà lǐ] 。', '[毎日|まいにち] 、 [舟|ふね] で [沼|ぬま] を [渡|わた]る ん だ 。 [言葉|ことば] が ない と 、 [舟|ふね] も [止|と]まった まま さ 。'),
    'p.kidsChat': T('Want to play shadows? With a lantern and your hands you can make any animal!', '¿Juegas a las sombras? ¡Con un farol y las manos puedes hacer cualquier animal!', 'Quer brincar de sombras? Com uma lanterna e as mãos dá pra fazer qualquer bicho!', 'Spielst du Schattenspiel? Mit einer Laterne und den Händen kann man jedes Tier machen!',
      '[玩|wán] [影子|yǐng zi] [游戏|yóu xì] [吗|ma] ？ [用|yòng] [一|yī] [盏|zhǎn] [灯|dēng] [和|hé] [手|shǒu] ， [什么|shén me] [动物|dòng wù] [都|dōu] [能|néng] [做|zuò] [出来|chū lái] ！', '[影絵|かげえ] で [遊|あそ]ぶ ？ ランタン と [手|て] で 、 どんな [動物|どうぶつ] でも [作|つく]れる よ ！'),
    'p.singersChat': T('Every evening we sang, and the {w.bell} answered from the {w.chapel}. Like the whole marsh singing along.', 'Cada tarde cantábamos, y la campana respondía desde la capilla. Como si toda la ciénaga cantara con nosotras.',
      'Toda tarde a gente cantava, e o sino respondia lá da capela. Como se o pântano inteiro cantasse junto.', 'Jeden Abend haben wir gesungen, und die Glocke hat aus der Kapelle geantwortet. Als ob das ganze Moor mitsingt.',
      '[以前|yǐ qián] [每天|měi tiān] [傍晚|bàng wǎn] [我们|wǒ men] [唱歌|chàng gē] ， [教堂|jiào táng] [的|de] [钟|zhōng] [就|jiù] [回应|huí yìng] 。 [好像|hǎo xiàng] [整个|zhěng gè] [沼泽|zhǎo zé] [都|dōu] [在|zài] [唱|chàng] 。', '[毎晩|まいばん] [歌|うた]う と 、 [礼拝堂|れいはいどう] の [鐘|かね] が [答|こた]えて くれた 。 [沼|ぬま] ぜんぶ が いっしょ に [歌|うた]う みたい に ね 。'),
  };
  // what the hushed pairs still mumble: their surviving words, in the language (the command box's title shows them)
  const HUSHED = {
    twins: T('*push*… no… not *alone*… *both*… *together*…', '*empuja*… no… *solo* no… los *dos*… *juntos*…', '*empurra*… não… *sozinho* não… os *dois*… *juntos*…', '*schieb*… nein… nicht *allein*… *beide*… *zusammen*…',
      '*[推|tuī]* … [不|bù] … [一个人|yī gè rén] *[不行|bù xíng]* … *[两个|liǎng gè]* … *[一起|yī qǐ]* …', '*[押|お]して* … ちがう … ひとり じゃ *だめ* … *ふたり* … *いっしょ* …'),
    kids: T('*stone*… *throw*… *both* of us… *far*…', '*piedra*… *lanza*… los *dos*… *lejos*…', '*pedra*… *joga*… nós *dois*… *longe*…', '*Stein*… *wirf*… wir *beide*… *weit*…',
      '*[石头|shí tou]* … *[扔|rēng]* … [我们|wǒ men] *[两个|liǎng gè]* … *[远|yuǎn]* …', '*[石|いし]* … *[投|な]げて* … *ふたり* で … *[遠|とお]く* …'),
    singers: T('*song*… *sing*… the *two* of us… every *night*…', '*canción*… *canta*… las *dos*… cada *noche*…', '*canção*… *canta*… nós *duas*… toda *noite*…', '*Lied*… *sing*… wir *zwei*… jeden *Abend*…',
      '*[歌|gē]* … *[唱|chàng]* … [我们|wǒ men] *[两个|liǎng gè]* … [每天|měi tiān] *[晚上|wǎn shang]* …', '*[歌|うた]* … *[歌|うた]って* … *ふたり* で … *[毎晩|まいばん]* …'),
  };
  // demonstrations (DESIGN.md 16, REGIONS.md 1: heard in use before you're asked): lines.js LINES, said through STORY.demoAt
  const L1 = (es, pt, de, zh, ja, en) => ({ es: [es], pt: [pt], de: [de], zh: [zh], ja: [ja], en: [en] });
  const DEMOS = {
    'marsh.demo.light': L1('¡Ilumina, farolito, ilumina! ¿Ven? Le digo «ilumina», y brilla.', 'Ilumina, lanterninha, ilumina! Viram? Eu digo «ilumina», e ela brilha.', 'Leucht, kleine Laterne, leucht! Seht ihr? Ich sage «leucht», und sie leuchtet.',
      '[照亮|zhào liàng] ， [小|xiǎo] [灯|dēng] ， [照亮|zhào liàng] ！ [你们|nǐ men] [看|kàn] ， [我|wǒ] [一|yī] [说|shuō] “ [照亮|zhào liàng] ” ， [它|tā] [就|jiù] [亮|liàng] [了|le] 。', '[照|て]らして 、 ランタン 、 [照|て]らして ！ ほら 、 「 [照|て]らして 」 って [言|い]う と 、 [光|ひか]る の 。',
      'Light up, little lantern, light up! See? I say «light up», and it shines.'),
    'marsh.demo.you': L1('¡Ahora ustedes! ¡Salten, ustedes dos! ¡Vamos, salten!', 'Agora vocês! Pulem, vocês! Vai, pulem!', 'Jetzt ihr! Springt, ihr zwei! Los, springt!',
      '[该|gāi] [你们|nǐ men] [了|le] ！ [你们|nǐ men] [跳|tiào] ！ [快|kuài] ， [跳|tiào] ！', '[次|つぎ] は ふたり ！ ふたり とも 、 [跳|と]んで ！ ほら 、 [跳|と]んで ！', 'Your turn! Jump, you two! Come on, jump!'),
    'marsh.demo.we': L1('Esta es más ancha. ¡Saltemos a la vez! Uno, dos… ¡tres!', 'Essa é mais larga. Vamos pular ao mesmo tempo! Um, dois… três!', 'Die hier ist breiter. Springen wir zusammen! Eins, zwei… drei!',
      '[这个|zhè ge] [更|gèng] [宽|kuān] 。 [我们|wǒ men] [一起|yī qǐ] [跳|tiào] [吧|ba] ！ [一|yī] 、 [二|èr] … [三|sān] ！', 'こっち は [広|ひろ]い よ 。 いっしょ に [跳|と]ぼう ！ いち 、 に の … さん ！', 'This one’s wider. Let’s jump together! One, two… three!'),
    'marsh.demo.lantern': L1('¡Iluminemos! Así lo encendemos cada noche: ¡iluminemos!', 'Vamos iluminar! É assim que a gente acende toda noite: vamos iluminar!', 'Leuchten wir! So zünden wir sie jeden Abend an: Leuchten wir!',
      '[我们|wǒ men] [一起|yī qǐ] [照亮|zhào liàng] [吧|ba] ！ [我们|wǒ men] [每天|měi tiān] [晚上|wǎn shang] [都|dōu] [这样|zhè yàng] [点灯|diǎn dēng] 。', 'いっしょ に [照|て]らそう ！ [毎晩|まいばん] 、 こう やって [灯|とも]す の 。', 'Let’s light it up! That’s how we light it every night: let’s light it up!'),
  };
  // Bruno's lines in the marsh (lines.js keys: STORY.say('bruno', key))
  const BRUNO = {
    'marsh.b.gate': L1('¡Siete campanas! Las oí desde Alba. El viejo camino del norte… Esta vez voy contigo.', 'Sete sinos! Eu ouvi lá de Alba. A velha estrada do norte… Dessa vez eu vou com você.', 'Sieben Glocken! Ich habe sie bis nach Alba gehört. Die alte Nordstraße… Diesmal komme ich mit.',
      '[七|qī] [口|kǒu] [钟|zhōng] ！ [我|wǒ] [在|zài] [阿尔巴|Ā ěr bā] [都|dōu] [听到|tīng dào] [了|le] 。 [北边|běi biān] [的|de] [老路|lǎo lù] … [这次|zhè cì] [我|wǒ] [跟|gēn] [你|nǐ] [一起|yī qǐ] [去|qù] 。', '[七|なな]つ の [鐘|かね] です ！ アルバ まで [聞|き]こえました よ 。 [北|きた] の [古|ふる]い [道|みち] … [今度|こんど] は [私|わたし] も [行|い]きます 。',
      'Seven {w.bell:pl}! I heard them all the way from Alba. The old north road… This time I’m coming with you.'),
    'marsh.b.gate2': L1('Vamos a la torre vieja. La última campana tiene que estar por aquí.', 'A gente vai pra torre velha. O último sino tem que estar por aqui.', 'Wir wollen zum alten Turm. Die letzte Glocke muss hier irgendwo sein.',
      '[我们|wǒ men] [要|yào] [去|qù] [古塔|gǔ tǎ] 。 [最后|zuì hòu] [一|yī] [口|kǒu] [钟|zhōng] [一定|yī dìng] [在|zài] [这|zhè] [附近|fù jìn] 。', '[私|わたし]たち は [古|ふる]い [塔|とう] へ [行|い]きます 。 [最後|さいご] の [鐘|かね] は 、 この [辺|あた]り の はず です 。',
      'We’re going to the old {w.tower}. The last {w.bell} has to be around here.'),
    'marsh.b.candil': L1('Ve sin miedo. Yo vigilo el pueblo. Si aparecen sombras, ahí estaré.', 'Pode ir sem medo. Eu cuido da vila. Se aparecerem sombras, eu vou estar lá.', 'Geh nur. Ich passe auf das Dorf auf. Wenn Schatten kommen, bin ich da.',
      '[你|nǐ] [放心|fàng xīn] [去|qù] [吧|ba] 。 [我|wǒ] [守着|shǒu zhe] [村子|cūn zi] 。 [影子|yǐng zi] [来|lái] [了|le] ， [我|wǒ] [就|jiù] [在|zài] 。', 'どうぞ 、 [安心|あんしん] して [行|い]って ください 。 [村|むら] は [私|わたし] が [守|まも]ります 。 [影|かげ] が [出|で]たら 、 すぐ [行|い]きます 。',
      'Go on, don’t worry. I’ll keep watch over the village. If {w.shadow:pl} show up, I’ll be there.'),
    'marsh.b.report': L1('Ocho campanas. Estoy orgulloso de ti. Vamos a ver qué hay en esa torre.', 'Oito sinos. Estou orgulhoso de você. Vamos ver o que tem naquela torre.', 'Acht Glocken. Ich bin stolz auf dich. Mal sehen, was in diesem Turm ist.',
      '[八|bā] [口|kǒu] [钟|zhōng] 。 [我|wǒ] [为|wèi] [你|nǐ] [骄傲|jiāo ào] 。 [我们|wǒ men] [去|qù] [看看|kàn kan] [那|nà] [座|zuò] [塔|tǎ] [里|lǐ] [有|yǒu] [什么|shén me] 。', '[八|やっ]つ の [鐘|かね] 。 [誇|ほこ]り に [思|おも]います よ 。 あの [塔|とう] に [何|なに] が ある か 、 [見|み]に [行|い]きましょう 。',
      'Eight {w.bell:pl}. I’m proud of you. Let’s see what’s in that {w.tower}.'),
    'marsh.b.drill': L1('¿Practicamos movimientos en equipo? Dime: «¡Salten!» y saltamos Mimo y yo. «¡Saltemos!», y vamos todos.', 'Vamos treinar golpes em equipe? Me diz: «Pulem!» e eu e o Mimo pulamos. «Vamos pular!», e vamos todos.', 'Üben wir Teamzüge? Sag: «Springt!», dann springen Mimo und ich. «Springen wir!», dann alle.',
      '[练|liàn] [练|liàn] [团队|tuán duì] [招式|zhāo shì] [吗|ma] ？ [你|nǐ] [说|shuō] “ [你们|nǐ men] [跳|tiào] ” ， [我|wǒ] [和|hé] [米莫|Mǐ mò] [就|jiù] [跳|tiào] 。 [说|shuō] “ [我们|wǒ men] [一起|yī qǐ] [跳|tiào] [吧|ba] ” ， [大家|dà jiā] [一起|yī qǐ] [跳|tiào] 。', 'チーム の [技|わざ] を [練習|れんしゅう] しましょう か ？ 「 ふたり とも 、 [跳|と]んで 」 なら 、 ミモ と [私|わたし] が [跳|と]びます 。 「 [跳|と]ぼう 」 なら 、 みんな で 。',
      'Shall we practice team moves? Say «Jump, you two!» and {mimo} and I jump. «Let’s jump!», and we all go.'),
  };
  if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(Object.assign({}, DEMOS, BRUNO))) if (!LINES[k]) LINES[k] = v;
  // the people's names in zh / ja (CJK.md's table; speakers show these in a zh / ja game)
  const NAME_CJ = {
    Lucero: { zh: '[卢塞罗|Lú sài luó]', ja: 'ルセロ' }, Tadeo: { zh: '[塔德奥|Tǎ dé ào]', ja: 'タデオ' }, Ramiro: { zh: '[拉米罗|Lā mǐ luó]', ja: 'ラミロ' },
    Lolo: { zh: '[洛洛|Luò luò]', ja: 'ロロ' }, Mati: { zh: '[马蒂|Mǎ dì]', ja: 'マティ' }, Nieves: { zh: '[涅韦斯|Niè wéi sī] [奶奶|nǎi nai]', ja: 'ネベス さん' }, Marisol: { zh: '[玛丽索尔|Mǎ lì suǒ ěr]', ja: 'マリソル' },
    Candil: { zh: '[灯村|Dēng cūn]', ja: 'カンディル' },
  };
  if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['ルセロ', 'タデオ', 'ラミロ', 'ロロ', 'マティ', 'ネベス', 'マリソル', 'カンディル']);
  // (zh / ja: the dictionary that reads what you type learns these words)
  if (typeof CJK !== 'undefined' && CJK.addSource) {
    const all = [LIGHT.zh, LIGHT.ja, ...LIGHT.alt.zh, ...LIGHT.alt.ja];
    for (const w of NEW_WORDS) all.push(w.zh, w.ja);
    for (const t of Object.values(ML).concat(Object.values(HUSHED))) all.push(t.zh, t.ja);
    for (const t of Object.values(Object.assign({}, DEMOS, BRUNO))) all.push(t.zh[0], t.ja[0]);
    for (const n of Object.values(NAME_CJ)) all.push(n.zh);
    for (const s of all) if (s) { try { CJK.addSource(String(s).replace(/\*/g, '')); } catch (e) { /* (the engine may not take every string) */ } }
  }
  Object.assign(C, { registerWords, ML, HUSHED, DEMOS, BRUNO, NAME_CJ, LIGHT, NEW_WORDS });
})();

// ================================================================ the build: the gate's leaves, the fog, the boardwalk, Candil, the causeway, the chapel
(() => {
  const C = MARSH, { toon } = TK, INK = '#2b2235';
  const { ROAD, CAUSE, TPATH, BW, CANDIL, LANTERN, CHAPEL, CH_DOOR, YARD, TOWER, TY, FOG1, FOG2, FOGT, LAMPS, SPOT, LUCERO, FOLK, HUTS, KEEP } = C;
  // keep world.js's scatter off this file's things (plain data: this runs before world.js)
  HUTS.forEach(b => KEEP.push({ x: b.x, z: b.z, r: Math.hypot(b.w, b.d) / 2 + 1.5 }));
  LAMPS.forEach(L => KEEP.push({ x: L.x, z: L.z, r: 1.4 }));
  KEEP.push({ x: CHAPEL.x, z: CHAPEL.z, r: 9 }, { x: SPOT.punt.x, z: SPOT.punt.z, r: 3 });
  const DECK = 0.62;                        // the boardwalk's, the dock's and the jetty's planks
  const WOOD = ['#6f5a46', '#7a6450', '#665241'], GRAYW = '#8a8378', STONE = '#8f8a80', IRON = '#2f2c36', REED = ['#8a8a5a', '#7a7d52', '#9a9564'];
  // ---------------------------------------------------------------- materials: the Kit's look, but a building the camera's inside goes
  // all at once (TK.camCut, as the towns do: windows, frames, the ink outlines too)
  let MATS = null;
  function mats() {
    if (MATS) return MATS;
    const CC = TK.camCut;
    const cut = (m, key) => {
      m.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, CC.U);
        sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = 'varying vec3 vWP;\n' + CC.decl + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + CC.test);
      };
      m.customProgramCacheKey = () => 'marshcut' + key;
    };
    const vc = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad, vertexColors: true }); cut(vc, 'v');
    const hull = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }); cut(hull, 'h');
    MATS = { vc, hull };
    return MATS;
  }
  // a Kit built with the cut materials (for the huts and the chapel)
  function buildCut(k, parent, o = {}) { const M = mats(), out = k.build(parent, Object.assign({ mat: M.vc }, o)); if (out[1]) out[1].material = M.hull; return out; }
  const toWorld = (b, lx, lz) => { const c = Math.cos(b.rot), s = Math.sin(b.rot); return { x: b.x + lx * c + lz * s, z: b.z - lx * s + lz * c }; };

  // ---------------------------------------------------------------- fog: soft puffs in one draw call (points sized in the world, drifting)
  const FOGV = `attribute float aSize; attribute float aPh; uniform float uTime; uniform float uScale; uniform float uK; varying float vA;
    void main() { vec3 p = position; p.x += sin(uTime * 0.31 + aPh) * 0.6; p.y += sin(uTime * 0.43 + aPh * 2.1) * 0.25; p.z += cos(uTime * 0.27 + aPh) * 0.5;
      p.y += (1.0 - uK) * 2.5;
      vec4 mv = modelViewMatrix * vec4(p, 1.0); float d = -mv.z;
      gl_PointSize = aSize * uScale / max(d, 0.5);
      vA = uK * smoothstep(0.8, 3.5, d) * (1.0 - smoothstep(70.0, 130.0, d));
      gl_Position = projectionMatrix * mv; }`;
  const FOGF = `uniform sampler2D uTex; uniform vec3 uColor; uniform float uOpacity; varying float vA;
    void main() { float a = texture2D(uTex, gl_PointCoord).a * uOpacity * vA; if (a < 0.01) discard; gl_FragColor = vec4(uColor, a); }`;
  const fogU = { uTime: { value: 0 }, uScale: { value: 400 } };
  function puffs(parent, list, o = {}) {
    const n = list.length, pos = new Float32Array(n * 3), size = new Float32Array(n), ph = new Float32Array(n);
    list.forEach((p, i) => { pos.set([p.x, p.y, p.z], i * 3); size[i] = p.s; ph[i] = p.ph; });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); geo.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
    const mat = new THREE.ShaderMaterial({ uniforms: { uTime: fogU.uTime, uScale: fogU.uScale, uK: { value: 1 }, uTex: { value: TK.glowTex }, uColor: { value: new THREE.Color(o.color || '#c4c3cf') }, uOpacity: { value: o.opacity || 0.8 } },
      vertexShader: FOGV, fragmentShader: FOGF, transparent: true, depthWrite: false, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 3; parent.add(pts);
    return { pts, mat, k: 1, kT: 1 };
  }
  // a bank of Hush fog across a way (cx, cz), facing along (ux, uz); with solids across it until it's lifted
  function fogBank(parent, cx, cz, ux, uz, half, y, R, n = 34) {
    const nx = -uz, nz = ux, list = [];
    for (let i = 0; i < n; i++) { const t = (R() - 0.5) * 2 * (half + 2.5), a = (R() - 0.5) * 3.6; list.push({ x: cx + nx * t + ux * a, y: y + 0.4 + R() * 3.4, z: cz + nz * t + uz * a, s: 3.6 + R() * 3.4, ph: R() * 9 }); }
    const F = puffs(parent, list, { color: '#bdbcc9', opacity: 0.92 });
    F.solids = [];
    for (let t = -half; t <= half + 0.01; t += 0.9) { const s = { x: cx + nx * t, z: cz + nz * t, r: 0.62, id: 'marsh-fog' }; s.x0 = s.x; s.z0 = s.z; F.solids.push(s); }
    F.set = on => { F.kT = on ? 1 : 0; F.solids.forEach(s => { s.x = on ? s.x0 : 1e5; s.z = on ? s.z0 : 1e5; }); };
    F.cx = cx; F.cz = cz;
    return F;
  }

  // ---------------------------------------------------------------- the gate's two iron leaves (cemetery.js leaves them to this file)
  function gateLeaves(group) {
    const N = C.northGate(); if (!N) return null;
    const rot = Math.atan2(-(N.ux || 0.28), -(N.uz || -0.96)), y = WORLD.terrainAt(N.x, N.z);
    const g = new THREE.Group(); g.position.set(N.x, y, N.z); g.rotation.y = rot; group.add(g);
    const G = CAVES.GEO, leaves = [];
    for (const side of [-1, 1]) {
      const hinge = new THREE.Group(); hinge.position.x = side * 1.72; g.add(hinge);
      const k = CAVES.Kit();
      for (let x = 0.07; x <= 1.66; x += 0.2) { k.add(G.cyl6, -side * x, 1.22, 0, 0.035, 2.45, 0.035, IRON, { ink: 0 }).add(G.cone, -side * x, 2.5, 0, 0.06, 0.16, 0.06, IRON, { ink: 0 }); }
      for (const yy of [0.35, 1.3, 2.25]) k.box(-side * 0.85, yy, 0, 1.72, 0.07, 0.07, IRON, { ink: 0.005 });
      k.box(-side * 1.66, 1.2, 0.02, 0.06, 2.3, 0.1, IRON, { ink: 0.005 });
      k.build(hinge, { shadow: true });
      leaves.push({ hinge, side });
    }
    // the chain and its padlock (they fall when the gate opens)
    const chain = new THREE.Group(); g.add(chain);
    const ck = CAVES.Kit(); for (let i = 0; i < 8; i++) ck.add(new THREE.TorusGeometry(1, 0.28, 5, 10), -0.5 + i * 0.14, 1.32 - Math.sin(i / 7 * Math.PI) * 0.22, 0.1, 0.07, 0.07, 0.07, '#5a5a62', { ry: i % 2 ? Math.PI / 2 : 0, ink: 0 });
    ck.box(0, 1.0, 0.14, 0.24, 0.28, 0.1, '#4a4a52', { ink: 0.01 }); ck.build(chain, { shadow: false });
    const solid = { obox: 1, x: N.x, z: N.z, hw: 1.75, hd: 0.22, rot, id: 'marsh-gate' }; solid.x0 = solid.x; solid.z0 = solid.z;
    const S = { g, leaves, chain, solid, k: 0, kT: 0 };
    S.set = (open, instant) => { S.kT = open ? 1 : 0; if (instant) S.k = S.kT; solid.x = open ? 1e5 : solid.x0; solid.z = open ? 1e5 : solid.z0; chain.visible = !open; };
    S.step = dt => { S.k = damp(S.k, S.kT, 1.6, dt); for (const L of leaves) L.hinge.rotation.y = L.side < 0 ? S.k * 1.75 : -S.k * 1.75; };
    S.front = { x: N.x + (N.ux || 0) * 2.4, z: N.z + (N.uz || 0) * 2.4 };
    return S;
  }

  // ---------------------------------------------------------------- people: marsh clothes (rain capes, wide hats, boots), posed
  const POSE = {
    idle: { arms: [[0.1, 0.18], [0.1, 0.18]] }, push: { arms: [[1.35, 0.15], [1.35, 0.15]], lean: 0.35 }, throw: { arms: [[0.3, 0.3], [2.6, -0.2]], lean: -0.1 },
    sing: { arms: [[0.7, 0.75], [0.7, 0.75]], up: true }, lantern: { arms: [[0.15, 0.2], [1.25, 0.05]] }, happy: { arms: [[0.15, 0.25], [2.9, -0.55]] },
    cheer: { arms: [[2.8, 0.5], [2.8, 0.5]] }, point: { arms: [[0.15, 0.2], [1.6, 0.0]] }, hands: { arms: [[0.95, -0.45], [0.95, -0.45]] },
  };
  const grayOf = hex => { const c = new THREE.Color(hex), l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; c.lerp(new THREE.Color(l * 0.88, l * 0.88, l * 0.96), 0.9); c.setRGB(Math.min(1, c.r), Math.min(1, c.g), Math.min(1, c.b)); return '#' + c.getHexString(); };
  const _e = new THREE.Euler();
  function personKits(def, pose, gray) {
    const G = CAVES.GEO, L = def.look, col = h => (gray ? grayOf(h) : h), body = CAVES.Kit(), head = CAVES.Kit(), P = POSE[pose] || POSE.idle;
    for (const s of [-1, 1]) { body.add(G.cyl, s * 0.12, 0.3, 0, 0.09, 0.56, 0.09, col(L.pants), { ink: 0.02 }); body.add(G.cyl, s * 0.12, 0.14, 0.02, 0.105, 0.28, 0.115, col(L.boots || '#3a3036'), { ink: 0.02 }); }
    // a rain cape: wider at the hem
    body.add(new THREE.CylinderGeometry(0.85, 1, 1, 10), 0, 0.86, 0, 0.29, 0.74, 0.27, col(L.coat), { ink: 0.025 });
    for (let i = 0; i < 3; i++) body.add(G.sphere, 0, 0.74 + i * 0.16, 0.275, 0.03, 0.03, 0.02, col('#3a2b26'), { ink: 0 });
    if (L.scarf) body.add(G.cyl, 0, 1.2, 0, 0.26, 0.12, 0.24, col(L.scarf), { ink: 0.015 });
    if (L.shawl) body.add(new THREE.CylinderGeometry(0.75, 1, 1, 10), 0, 1.08, 0, 0.36, 0.3, 0.34, col(L.shawl), { ink: 0.015 });
    const hands = [];
    [-1, 1].forEach((s, i) => {
      const [fwd, out] = P.arms[i];
      _e.set(-fwd, 0, s * out); const dir = new THREE.Vector3(0, -1, 0).applyEuler(_e);
      const sh = [s * 0.31, 1.12, 0], hand = [sh[0] + dir.x * 0.44, sh[1] + dir.y * 0.44, sh[2] + dir.z * 0.44];
      body.rod(G.cyl, sh, hand, 0.075, col(L.coat));
      body.add(G.sphere, hand[0], hand[1], hand[2], 0.075, 0.075, 0.075, col(L.skin), { ink: 0.015 });
      hands.push(hand);
    });
    if (pose === 'throw') body.add(G.sphere, hands[1][0], hands[1][1] + 0.08, hands[1][2], 0.07, 0.04, 0.06, col('#9a958c'), { ink: 0.008 });     // a flat stone
    head.add(G.sphere, 0, 0.22, 0, 0.25, 0.25, 0.24, col(L.skin), { ink: 0.025 });
    head.add(G.half, 0, 0.22, -0.02, 0.26, 0.25, 0.25, col(L.hair), { rx: -0.35, ink: 0.015 });
    if (L.bun) head.add(G.sphere, 0, 0.32, -0.25, 0.11, 0.11, 0.11, col(L.hair), { ink: 0.015 });
    if (L.braid) for (let i = 0; i < 3; i++) head.add(G.sphere, 0.05, 0.1 - i * 0.12, -0.22 - i * 0.02, 0.07, 0.075, 0.07, col(L.hair), { ink: 0.012 });
    if (L.hat) head.add(G.cyl, 0, 0.42, 0, 0.42, 0.04, 0.42, col(L.hat), { ink: 0.015 }).add(G.cyl, 0, 0.53, 0, 0.21, 0.22, 0.21, col(L.hat), { ink: 0.015 }).add(G.cyl, 0, 0.47, 0, 0.215, 0.05, 0.215, col('#c9453a'), { ink: 0 });
    if (L.cap) head.add(G.half, 0, 0.36, 0, 0.27, 0.17, 0.27, col(L.cap), { ink: 0.02 }).box(0, 0.37, 0.24, 0.3, 0.03, 0.16, col(L.cap), { ink: 0.01 });
    for (const s of [-1, 1]) head.add(G.sphere, s * 0.09, P.up ? 0.27 : 0.24, 0.215, 0.032, gray ? 0.018 : 0.048, 0.02, INK, { ink: 0 });
    if (P.up) head.add(G.sphere, 0, 0.11, 0.225, 0.05, 0.045, 0.02, INK, { ink: 0 });      // (singing: an open mouth)
    else head.box(0, 0.11, 0.225, 0.08, 0.016, 0.01, INK, { ink: 0 });
    head.add(G.sphere, 0, 0.17, 0.245, 0.035, 0.03, 0.03, col(L.skin), { ink: 0 });
    return { body, head, P, hands };
  }
  // a person: { id, name, x, z, y, top, hushed, talking, root, body, head, … }; set(pose, gray) rebuilds the look
  function makePerson(def, group, o = {}) {
    const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group();
    root.add(body); body.add(head); group.add(root);
    const p = { id: def.id, name: def.name, def, x: o.x, z: o.z, y: o.y !== undefined ? o.y : WORLD.terrainAt(o.x, o.z), top: def.kid ? 1.75 : 2.15, yaw: o.yaw || 0, baseYaw: o.yaw || 0,
      hushed: !!o.gray, talking: false, root, body, head, pose: o.pose || 'idle', meshes: [], t: Math.random() * 9, kid: !!def.kid, lines: null };
    p.set = (pose, gray) => {
      p.pose = pose; p.hushed = !!gray;
      for (const m of p.meshes) { m.parent.remove(m); m.geometry.dispose(); }
      const K = personKits(def, pose, gray);
      p.meshes = K.body.build(body).concat(K.head.build(head));
      head.position.set(0, 1.18, 0); p.P = K.P; p.hands = K.hands;
      if (p.prop) p.prop.place();
    };
    p.set(p.pose, p.hushed);
    root.scale.setScalar(def.kid ? 0.76 : def.old ? 0.95 : 1);
    return p;
  }
  function animatePerson(p, dt, t, you) {
    p.t += dt;
    if (p.hushed) { p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw; p.body.rotation.set(p.P && p.P.lean ? p.P.lean : 0, 0, 0); p.head.rotation.set(0, 0, 0); return; }
    const near = you && Math.hypot(you.x - p.x, you.z - p.z) < 6.5;
    const want = p.look ? Math.atan2(p.look.x - p.x, p.look.z - p.z) : near && !p.busy ? Math.atan2(you.x - p.x, you.z - p.z) : p.baseYaw;
    p.yaw = dampAngle(p.yaw, want, 4, dt);
    const bob = p.talking ? Math.abs(Math.sin(p.t * 13)) * 0.035 : p.pose === 'happy' || p.pose === 'cheer' ? Math.abs(Math.sin(p.t * 6)) * 0.08 : 0;
    p.root.position.set(p.x, p.y + bob + (p.jumpY || 0), p.z); p.root.rotation.y = p.yaw;
    p.body.rotation.x = (p.P && p.P.lean ? p.P.lean : 0) + Math.sin(p.t * 1.3) * 0.015; p.body.rotation.z = Math.sin(p.t * 1.1 + p.x) * 0.02;
    p.head.rotation.y = Math.sin(p.t * 0.5 + p.z) * 0.08; p.head.rotation.x = p.pose === 'sing' ? -0.3 + Math.sin(p.t * 2) * 0.05 : 0;
  }
  // Lucero's lamplighter's pole: a long pole, a hook, and a little lantern that glows (and flares when she says «¡Ilumina!»)
  function lanternPole(p) {
    const g = new THREE.Group(), k = CAVES.Kit(), G = CAVES.GEO;
    k.add(G.cyl6, 0, 1.0, 0, 0.03, 2.2, 0.03, '#6b4a30', { ink: 0.006 }).add(G.cyl6, 0.12, 2.1, 0, 0.018, 0.3, 0.018, IRON, { rz: -0.9, ink: 0 });
    k.box(0.22, 1.86, 0, 0.17, 0.22, 0.17, '#3a3036', { ink: 0.008 }).box(0.22, 1.86, 0, 0.13, 0.17, 0.18, '#ffe27a', { ink: 0 }).add(G.cone, 0.22, 2.02, 0, 0.12, 0.1, 0.12, '#3a3036', { ink: 0.006 });
    k.build(g, { shadow: false });
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd77a', transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.set(0.22, 1.86, 0); glow.scale.setScalar(1.3); g.add(glow);
    p.body.add(g);
    const P = { g, glow, flare: 0, place() { const h = p.hands ? p.hands[1] : [0.3, 1.0, 0.3]; g.position.set(h[0], h[1] - 0.95, h[2]); g.rotation.set(0.25, 0, -0.1); } };
    return P;
  }

  // ---------------------------------------------------------------- props
  // a stilt hut: posts, a plank floor, weathered walls, a steep reed roof, a door with steps, a round window, a lantern by the door
  function hut(k, b) {
    const G = CAVES.GEO, w = b.w, d = b.d, y0 = WORLD.terrainAt(b.x, b.z), st = 0.85, H = 2.3, R = rng(Math.round(b.x * 13 - b.z * 7));
    k.at(b.x, y0, b.z, b.rot);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.add(G.cyl6, sx * (w / 2 - 0.2), st / 2 - 0.3, sz * (d / 2 - 0.2), 0.12, st + 0.6, 0.12, '#5a4a3a', { ink: 0.012 });
    k.box(0, st, 0, w + 0.3, 0.14, d + 0.3, WOOD[1], { ink: 0.015 });
    k.box(0, st + H / 2, 0, w, H, d, b.kind === 'lamp' ? '#9a8a6a' : GRAYW, { ink: 0.025 });
    for (let i = 0; i < 5; i++) k.box(-w / 2 + 0.4 + i * (w - 0.8) / 4, st + H / 2, d / 2 + 0.03, 0.05, H, 0.03, '#6a5f52', { ink: 0 });
    const top = st + H, rise = 1.6;
    for (const s of [-1, 1]) k.box(s * (w / 4 + 0.05), top + rise / 2, 0, w / 2 + 0.75, 0.22, d + 0.9, R() < 0.5 ? '#8a8259' : '#7d7650', { rz: -s * Math.atan2(rise, w / 2), ink: 0.02 });
    for (const s of [-1, 1]) k.add(G.tri, 0, top, s * (d / 2), w / 2, rise, 1, GRAYW, { ink: 0 });
    k.box(0, st + 1.0, d / 2 + 0.06, 0.9, 1.75, 0.1, '#4a3a2e', { ink: 0.02 }).box(0.3, st + 1.0, d / 2 + 0.13, 0.08, 0.08, 0.05, '#c9a24a', { ink: 0 });
    for (let i = 0; i < 3; i++) k.box(0, st - 0.2 - i * 0.22, d / 2 + 0.35 + i * 0.28, 1.0, 0.08, 0.3, WOOD[i % 3], { ink: 0.01 });
    k.add(G.cyl, -w * 0.3, st + 1.45, d / 2 + 0.04, 0.32, 0.06, 0.32, '#2f3a3a', { rx: Math.PI / 2, ink: 0.015 });
    k.box(w * 0.32, st + 1.75, d / 2 + 0.25, 0.2, 0.26, 0.2, '#3a3036', { ink: 0.01 }).box(w * 0.32, st + 1.75, d / 2 + 0.25, 0.15, 0.2, 0.21, '#d9c27a', { ink: 0 });
    if (b.kind === 'lamp') { for (let i = 0; i < 3; i++) k.add(G.cyl6, w / 2 + 0.2 + i * 0.12, 1.5, d / 2 - 0.6 + i * 0.25, 0.03, 3.0, 0.03, '#6b4a30', { rz: -0.15, ink: 0.005 }); k.box(-w / 2 - 0.05, st + 1.8, 0, 0.06, 0.5, 0.7, '#e2a93a', { ink: 0.01 }); }
    else { for (let i = 0; i < 4; i++) k.box(-w / 2 - 0.05, st + 0.8 + i * 0.25, -0.3 + (i % 2) * 0.2, 0.04, 0.02, 1.4, '#5f5a4a', { ink: 0 }); }     // a net drying on the side
    k.free();
  }
  // the great lantern in the middle of Candil: a stone column, an iron lantern on top (its panes glow once it's lit)
  function greatLantern(group) {
    const k = CAVES.Kit(), G = CAVES.GEO, L = LANTERN, y = WORLD.terrainAt(L.x, L.z);
    k.at(L.x, y, L.z, 0.2);
    k.add(G.cyl, 0, 0.2, 0, 0.75, 0.4, 0.75, STONE, { ink: 0.02 }).add(G.cyl6, 0, 1.6, 0, 0.32, 2.6, 0.32, '#9a958a', { ink: 0.02 }).add(G.cyl, 0, 2.95, 0, 0.5, 0.18, 0.5, STONE, { ink: 0.015 });
    for (const s of [-1, 1]) for (const t of [-1, 1]) k.add(G.cyl6, s * 0.36, 3.55, t * 0.36, 0.04, 1.1, 0.04, IRON, { ink: 0 });
    k.add(G.cone, 0, 4.35, 0, 0.62, 0.5, 0.62, IRON, { ink: 0.02 }).add(G.sphere, 0, 4.66, 0, 0.1, 0.1, 0.1, IRON, { ink: 0.01 });
    k.free(); k.build(group);
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.66, 1.0, 0.66), new THREE.MeshBasicMaterial({ color: '#4a4a52' })); pane.position.set(L.x, y + 3.55, L.z); group.add(pane);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd77a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.position.set(L.x, y + 3.6, L.z); glow.scale.setScalar(7); group.add(glow);
    return { pane, glow, k: 0, kT: 0, y };
  }
  // a stone lantern (a pillar and a little house of stone, open on four sides); its flame lights up with «¡Ilumina!»
  function stoneLantern(k, group, L) {
    const G = CAVES.GEO, y = WORLD.terrainAt(L.x, L.z);
    k.at(L.x, y, L.z, L.i * 0.7);
    k.box(0, 0.12, 0, 0.7, 0.24, 0.7, STONE, { ink: 0.015 }).add(G.cyl6, 0, 0.75, 0, 0.17, 1.1, 0.17, '#9a958a', { ink: 0.015 }).box(0, 1.36, 0, 0.62, 0.12, 0.62, STONE, { ink: 0.012 });
    for (const s of [-1, 1]) for (const t of [-1, 1]) k.box(s * 0.24, 1.62, t * 0.24, 0.09, 0.42, 0.09, STONE, { ink: 0.008 });
    k.add(G.cone, 0, 2.02, 0, 0.5, 0.42, 0.5, '#7d786c', { ink: 0.015 }); k.add(G.sphere, 0.18, 0.4, 0.2, 0.12, 0.18, 0.12, '#5f7a4a', { ink: 0 });     // (moss)
    k.free();
    const flame = new THREE.Group(); flame.position.set(L.x, y + 1.6, L.z); group.add(flame);
    const core = new THREE.Mesh(CAVES.GEO.sphere, new THREE.MeshBasicMaterial({ color: '#ffe9a0' })); core.scale.set(0.09, 0.16, 0.09); flame.add(core);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffcf6a', transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.setScalar(3.2); flame.add(glow);
    flame.visible = false;
    return { flame, core, glow, y };
  }
  // the drowned chapel, standing in the black water: thick stone walls, a broken roof, a leaning belfry with its silent bell
  function chapel(group) {
    const k = CAVES.Kit(), G = CAVES.GEO, b = CHAPEL, w = b.w, d = b.d, yw = -2.2, H = 7.6, R = rng(77);
    const SW = ['#8f8a80', '#857f75', '#9a958a'];
    k.at(b.x, 0, b.z, b.rot);
    // the walls (rising from under the water), with the door, its arch and a round window on the front
    for (const s of [-1, 1]) k.box(s * (w / 2), yw + H / 2, 0, 0.6, H, d, SW[(s + 1) / 2 | 0], { ink: 0.025 });
    k.box(0, yw + H / 2, -d / 2, w + 0.6, H, 0.6, SW[2], { ink: 0.025 });
    for (const s of [-1, 1]) k.box(s * (w / 4 + 0.55), yw + H / 2, d / 2, w / 2 - 1.1, H, 0.6, SW[0], { ink: 0.025 });
    k.box(0, yw + H - 1.3, d / 2, 2.2, 2.6, 0.6, SW[1], { ink: 0.02 });
    k.box(0, 0.62 + 1.25, d / 2 + 0.22, 1.7, 2.5, 0.12, '#3d332c', { ink: 0.02 }).add(G.half, 0, 0.62 + 2.5, d / 2 + 0.22, 0.85, 0.7, 0.07, '#3d332c', { rx: Math.PI / 2, ink: 0.015 });
    k.add(G.cyl, 0, 4.4, d / 2 + 0.31, 0.75, 0.06, 0.75, '#4a5a7a', { rx: Math.PI / 2, ink: 0.02 }).add(G.cyl, 0, 4.4, d / 2 + 0.34, 0.5, 0.06, 0.5, '#7fa0c8', { rx: Math.PI / 2, ink: 0 });
    for (const s of [-1, 1]) for (const z of [-3.5, 0, 3.5]) k.box(s * (w / 2 + 0.31), 2.7, z, 0.05, 1.9, 0.9, '#2f3a40', { ink: 0.01 });
    // the gable and a roof half fallen in
    k.add(G.tri, 0, yw + H, d / 2, w / 2 + 0.3, 2.6, 0.6, SW[2], { ink: 0 });
    k.box(-w / 4 - 0.1, yw + H + 1.25, 0.6, w / 2 + 0.8, 0.26, d - 1.2, '#5e5873', { rz: 0.53, ink: 0.02 });
    k.box(w / 4 + 0.1, yw + H + 1.0, 2.6, w / 2 + 0.6, 0.26, d * 0.42, '#5e5873', { rz: -0.62, ink: 0.02 });
    for (let i = 0; i < 4; i++) k.box(w / 4 + 0.3, yw + H + 0.6 - i * 0.2, -1.6 - i * 1.0, 0.18, 0.18, w * 0.6, '#5a4a3a', { rz: -0.5 + i * 0.12, rx: 0.2, ink: 0.01 });
    // moss and ivy, the water line's stain
    for (let i = 0; i < 16; i++) { const s = R() < 0.5 ? -1 : 1, z = (R() - 0.5) * d; k.add(G.sphere, s * (w / 2 + 0.32), 0.2 + R() * 4, z, 0.06, 0.3 + R() * 0.5, 0.4 + R() * 0.5, R() < 0.5 ? '#5f7a4a' : '#4f6a3e', { ink: 0 }); }
    k.box(0, 0.05, 0, w + 0.66, 0.5, d + 0.66, '#5a5a4e', { ink: 0 });
    k.free();
    const out = buildCut(k, group);
    // the belfry: a square tower behind it, leaning; the bell inside, its arches open
    const bel = new THREE.Group(), back = toWorld(b, 0.6, -d / 2 - 1.7); bel.position.set(back.x, 0, back.z); bel.rotation.set(0.06, b.rot, -0.07); group.add(bel);
    const bk = CAVES.Kit();
    bk.box(0, yw + 6.3, 0, 3.0, 12.6, 3.0, SW[1], { ink: 0.025 }).box(0, yw + 12.9, 0, 3.4, 0.4, 3.4, SW[2], { ink: 0.02 }).add(G.cone, 0, yw + 14.3, 0, 2.3, 2.6, 2.3, '#4d4763', { ry: Math.PI / 4, ink: 0.02 });
    for (const [x, z, ry] of [[0, 1.52, 0], [0, -1.52, 0], [1.52, 0, Math.PI / 2], [-1.52, 0, Math.PI / 2]]) bk.box(x, yw + 11.2, z, 1.4, 2.0, 0.08, '#2a2830', { ry, ink: 0 });
    buildCut(bk, bel);
    const bellPiv = new THREE.Group(); bellPiv.position.set(0, yw + 12.2, 0); bel.add(bellPiv);
    const bellK = CAVES.Kit(); bellK.add(new THREE.CylinderGeometry(0.35, 0.75, 1.1, 14), 0, -0.6, 0, 1, 1, 1, '#8a7a4a', { ink: 0.015 }).add(G.sphere, 0, -1.2, 0, 0.13, 0.13, 0.13, '#5a4a2a', { ink: 0.008 }); bellK.build(bellPiv, { shadow: false });
    // the jetty from the causeway's end to the door
    const jk = CAVES.Kit(), a = CAUSE.at(CAUSE.len), door = { x: CH_DOOR.x, z: CH_DOOR.z }, jl = Math.hypot(door.x - a.x, door.z - a.z), jy = Math.atan2(door.x - a.x, door.z - a.z);
    jk.at((a.x + door.x) / 2, 0, (a.z + door.z) / 2, jy);
    for (let i = 0; i < Math.ceil(jl / 0.5); i++) jk.box(0, DECK, -jl / 2 + 0.25 + i * 0.5, 2.2, 0.1, 0.46, WOOD[i % 3], { ink: 0.008 });
    for (const s of [-1, 1]) for (let z = -jl / 2; z <= jl / 2; z += 1.6) jk.add(CAVES.GEO.cyl6, s * 1.0, -0.4, z, 0.08, 2.2, 0.08, '#4a3a2e', { ink: 0.008 });
    jk.free(); jk.build(group);
    return { meshes: out, bell: bellPiv, bel, jetty: { seg: [a.x, a.z, door.x + (a.x - door.x) * 0.06, door.z + (a.z - door.z) * 0.06], w: 2.2, y: [DECK, DECK] } };
  }
  // the boardwalk to Candil: posts and planks, broken in three places (planks for the gaps come once you've crossed)
  function boardwalk(group) {
    const k = CAVES.Kit(), G = CAVES.GEO, gk = CAVES.Kit(), R = rng(31), gw = BW.gapW / BW.len, yaw = Math.atan2(BW.ux, BW.uz);
    const spans = []; let t0 = 0;
    for (const g of BW.gaps) { spans.push([t0, g - gw / 2]); t0 = g + gw / 2; }
    spans.push([t0, 1]);
    const plat = [], gaps = [];
    for (const [a, b] of spans) {
      const A = C.bwAt(a), Bp = C.bwAt(b), n = Math.round((b - a) * BW.len / 0.42);
      for (let i = 0; i < n; i++) { const t = a + (b - a) * (i + 0.5) / n, p = C.bwAt(t); k.at(p.x, DECK, p.z, yaw); k.box((R() - 0.5) * 0.08, 0, 0, BW.w, 0.1, 0.38, WOOD[i % 3], { ry: (R() - 0.5) * 0.04, ink: 0.008 }); k.free(); }
      for (let i = 0; i <= Math.round((b - a) * BW.len / 1.7); i++) { const t = a + (b - a) * i / Math.max(1, Math.round((b - a) * BW.len / 1.7)), p = C.bwAt(t); for (const s of [-1, 1]) k.add(G.cyl6, p.x - BW.uz * s * (BW.w / 2 - 0.1), -0.6, p.z + BW.ux * s * (BW.w / 2 - 0.1), 0.09, 2.6, 0.09, '#4a3a2e', { ink: 0.008 }); }
      plat.push({ seg: [A.x, A.z, Bp.x, Bp.z], w: BW.w, y: [DECK, DECK] });
    }
    for (const g of BW.gaps) {
      const A = C.bwAt(g - gw / 2 - 0.01), Bp = C.bwAt(g + gw / 2 + 0.01), p = C.bwAt(g);
      for (let i = 0; i < 5; i++) { gk.at(p.x + BW.ux * (i - 2) * 0.36, DECK + 0.02, p.z + BW.uz * (i - 2) * 0.36, yaw); gk.box(0, 0, 0, BW.w * 0.9, 0.1, 0.32, '#a07a52', { ink: 0.008 }); gk.free(); }
      gaps.push({ seg: [A.x, A.z, Bp.x, Bp.z], w: BW.w, y: [-9, -9] });
    }
    k.build(group);
    const gapG = new THREE.Group(); group.add(gapG); gk.build(gapG); gapG.visible = false;
    return { plat, gaps, gapG };
  }
  // the dock on Candil's west side, and the twins' punt (stuck on the mud until they push it off)
  function dock(group) {
    const k = CAVES.Kit(), G = CAVES.GEO, a = { x: -25.4, z: -333.8 }, b = { x: -32.0, z: -333.2 }, yaw = Math.atan2(b.x - a.x, b.z - a.z), len = Math.hypot(b.x - a.x, b.z - a.z);
    for (let i = 0; i < Math.round(len / 0.45); i++) { const t = (i + 0.5) / Math.round(len / 0.45); k.at(lerp(a.x, b.x, t), DECK, lerp(a.z, b.z, t), yaw); k.box(0, 0, 0, 2.0, 0.1, 0.4, WOOD[i % 3], { ink: 0.008 }); k.free(); }
    for (let t = 0; t <= 1.01; t += 0.33) for (const s of [-1, 1]) k.add(G.cyl6, lerp(a.x, b.x, t) - Math.cos(yaw) * s * 0.9, -0.5, lerp(a.z, b.z, t) + Math.sin(yaw) * s * 0.9, 0.08, 2.4, 0.08, '#4a3a2e', { ink: 0.008 });
    k.build(group);
    const punt = new THREE.Group(); group.add(punt);
    const pk = CAVES.Kit();
    pk.box(0, 0.12, 0, 1.3, 0.24, 3.6, '#6a5240', { ink: 0.02 }).box(0, 0.28, 0, 1.18, 0.1, 3.4, '#5a4434', { ink: 0 });
    for (const s of [-1, 1]) pk.box(s * 0.62, 0.36, 0, 0.1, 0.3, 3.5, '#7a6048', { ink: 0.01 });
    pk.add(G.cyl6, 0.3, 0.55, 0.2, 0.03, 2.8, 0.03, '#8a6a4a', { rx: 0.25, rz: 0.3, ink: 0.004 }).box(-0.2, 0.4, 1.2, 0.6, 0.2, 0.5, '#4a5a6a', { ink: 0.01 });
    pk.build(punt);
    const P = { g: punt, k: 0, kT: 0, from: { x: SPOT.punt.x, z: SPOT.punt.z, y: 0.42, rot: SPOT.punt.rot, tilt: 0.12 }, to: { x: -29.6, z: -335.8, y: -0.35, rot: 1.5, tilt: 0 } };
    P.apply = () => { const e = P.k * P.k * (3 - 2 * P.k), A = P.from, Bq = P.to; punt.position.set(lerp(A.x, Bq.x, e), lerp(A.y, Bq.y, e), lerp(A.z, Bq.z, e)); punt.rotation.set(lerp(A.tilt, Bq.tilt, e), lerp(A.rot, Bq.rot, e), 0); };
    P.apply();
    return { plat: { seg: [a.x, a.z, b.x, b.z], w: 2.0, y: [DECK, DECK] }, punt: P };
  }
  // reeds, dead willows and mossy stumps round the shores and on the tussocks (one mesh each)
  function marshPlants(group) {
    const k = CAVES.Kit(), G = CAVES.GEO, R = rng(5150), tk = CAVES.Kit();
    const W = WORLD, wat = W.L.water;
    let n = 0;
    for (let tries = 0; tries < 9000 && n < 520; tries++) {
      const x = lerp(-62, 26, R()), z = lerp(-292, -392, R()), h = W.terrainAt(x, z);
      if (h < wat - 0.55 || h > wat + 0.55 || C.keepClear(x, z, 0.4) || C.basinDist(x, z) > -1) continue;
      for (let j = 0; j < 4; j++) { const rx = x + (R() - 0.5) * 0.7, rz = z + (R() - 0.5) * 0.7, rh = 0.9 + R() * 1.0; k.add(G.cone, rx, W.terrainAt(rx, rz) + rh / 2 - 0.1, rz, 0.04, rh, 0.04, REED[(R() * 3) | 0], { rx: (R() - 0.5) * 0.25, rz: (R() - 0.5) * 0.25, ink: 0 }); }
      if (R() < 0.3) k.add(G.cyl6, x, W.terrainAt(x, z) + 1.1, z, 0.05, 0.3, 0.05, '#6a4a2e', { ink: 0 });     // (a bulrush head)
      n++;
    }
    // dead willows: a crooked trunk, bare branches, gray moss hanging
    const trees = [];
    for (let tries = 0; tries < 4000 && trees.length < 34; tries++) {
      const x = lerp(-66, 28, R()), z = lerp(-288, -396, R()), h = W.terrainAt(x, z);
      if (h < wat + 0.05 || C.keepClear(x, z, 1.5) || C.basinDist(x, z) > 0 || trees.some(t => Math.hypot(t.x - x, t.z - z) < 6)) continue;
      trees.push({ x, z, y: h });
    }
    for (const t of trees) {
      const s = 0.9 + R() * 0.5, lean = (R() - 0.5) * 0.3;
      tk.at(t.x, t.y, t.z, R() * TAU);
      tk.add(G.cyl6, 0, 1.4 * s, 0, 0.22 * s, 2.8 * s, 0.22 * s, '#5a5048', { rz: lean, ink: 0.015 });
      for (let i = 0; i < 4; i++) { const a = i * 1.7 + R(), y = (2.0 + i * 0.35) * s; tk.rod(G.cyl6, [0, y, 0], [Math.cos(a) * 1.3 * s, y + 0.6 * s, Math.sin(a) * 1.3 * s], 0.06 * s, '#5a5048', 0.008); tk.add(G.cone, Math.cos(a) * 1.2 * s, y - 0.1, Math.sin(a) * 1.2 * s, 0.09, -(0.8 + R() * 0.7) * s, 0.09, '#8f9488', { ink: 0 }); }
      tk.free();
    }
    k.build(group, { shadow: false }); tk.build(group);
    return { trees };
  }
  // the dark water over the basin's pools (the world's own water is the lake's blue)
  function water(group) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(150, 180, 1, 1), new THREE.MeshToonMaterial({ color: '#2f3d38', gradientMap: TK.grad, transparent: true, opacity: 0.94 }));
    m.rotation.x = -Math.PI / 2; m.position.set(-16, WORLD.L.water + 0.035, -346); m.receiveShadow = true; group.add(m);
    return m;
  }

  // ================================================================ build
  function build(scene, env = {}) {
    const group = new THREE.Group(); group.name = 'marsh'; scene.add(group);
    const near = new THREE.Group(); near.name = 'marsh-candil'; group.add(near);
    const colliders = [], moving = [], platforms = [];
    const R = rng(4242);
    const gate = gateLeaves(group); if (gate) moving.push(gate.solid);
    // the fog banks: across the road in, the causeway's foot, round the tower's path, and one past each stone lantern
    const rIn = ROAD.near(FOG1.x, FOG1.z), fog1 = fogBank(group, FOG1.x, FOG1.z, rIn.ux, rIn.uz, 3.8, WORLD.terrainAt(FOG1.x, FOG1.z), R);
    const cF = CAUSE.near(FOG2.x, FOG2.z), fog2 = fogBank(group, FOG2.x, FOG2.z, cF.ux, cF.uz, 2.6, WORLD.terrainAt(FOG2.x, FOG2.z), R, 26);
    const tF = TPATH.near(FOGT.x, FOGT.z), fogT = fogBank(group, FOGT.x, FOGT.z, tF.ux, tF.uz, 3.6, WORLD.terrainAt(FOGT.x, FOGT.z), R);
    const lampFog = LAMPS.map(L => { const f = L.fog; return fogBank(group, f.x, f.z, f.ux, f.uz, 2.4, WORLD.terrainAt(f.x, f.z), R, 22); });
    [fog1, fog2, fogT, ...lampFog].forEach(f => moving.push(...f.solids));
    // the ground mist over the water, and wisps (each set one draw call)
    const mistList = [], wispList = [];
    for (let i = 0; i < 70; i++) { const x = lerp(-60, 24, R()), z = lerp(-296, -392, R()); if (C.basinDist(x, z) > -2) { i--; continue; } mistList.push({ x, y: WORLD.L.water + 0.4 + R() * 0.8, z, s: 6 + R() * 6, ph: R() * 9 }); }
    for (let i = 0; i < 46; i++) { const x = lerp(-56, 20, R()), z = lerp(-300, -390, R()); if (C.basinDist(x, z) > -3) { i--; continue; } wispList.push({ x, y: 0.6 + R() * 2.2, z, s: 0.5 + R() * 0.5, ph: R() * 9 }); }
    const mist = puffs(group, mistList, { color: '#b3b8b0', opacity: 0.42 });
    const wisps = puffs(group, wispList, { color: '#d8f0a8', opacity: 0.9, add: true });
    // the water, the plants and willows
    const wat = water(group);
    const plants = marshPlants(group);
    plants.trees.forEach(t => colliders.push({ x: t.x, z: t.z, r: 0.45 }));
    // the boardwalk
    const bw = boardwalk(group); platforms.push(...bw.plat, ...bw.gaps);
    // Candil: the huts, the great lantern, the dock and the punt, the shrine, the little lanterns, a pile of flat stones
    const hk = CAVES.Kit();
    HUTS.forEach(b => hut(hk, b));
    buildCut(hk, near);
    HUTS.forEach(b => colliders.push({ obox: 1, x: b.x, z: b.z, hw: b.w / 2 + 0.2, hd: b.d / 2 + 0.2, rot: b.rot }));
    const lantern = greatLantern(near); colliders.push({ x: LANTERN.x, z: LANTERN.z, r: 0.8 });
    const dk = dock(near); platforms.push(dk.plat);
    const puntSolid = { obox: 1, x: SPOT.punt.x, z: SPOT.punt.z, hw: 0.7, hd: 1.85, rot: SPOT.punt.rot, id: 'marsh-punt' }; puntSolid.x0 = puntSolid.x; puntSolid.z0 = puntSolid.z; moving.push(puntSolid);
    const pk = CAVES.Kit(), G = CAVES.GEO;
    { const s = SPOT.shrine, y = WORLD.terrainAt(s.x, s.z); pk.at(s.x, y, s.z, Math.PI); pk.box(0, 0.6, 0, 1.3, 1.2, 0.7, STONE, { ink: 0.02 }).add(G.half, 0, 1.2, 0, 0.66, 0.5, 0.36, STONE, { ink: 0.015 }).box(0, 0.75, 0.3, 0.6, 0.65, 0.1, '#3a3036', { ink: 0 }); pk.add(G.cyl, 0, 0.62, 0.22, 0.06, 0.18, 0.06, '#f2ead8', { ink: 0 }); pk.add(G.cone, 0, 1.05, 0.25, 0.1, -0.16, 0.1, '#c9a24a', { ink: 0.005 }); pk.free(); colliders.push({ x: s.x, z: s.z, r: 0.75 }); }
    const smallLamps = [];
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.5, x = CANDIL.x + Math.cos(a) * (CANDIL.r - 1.6), z = CANDIL.z + Math.sin(a) * (CANDIL.r - 1.6); if (HUTS.some(b => Math.hypot(b.x - x, b.z - z) < 3.6)) continue; const y = WORLD.terrainAt(x, z); pk.add(G.cyl6, x, y + 0.9, z, 0.06, 1.8, 0.06, '#5a4a3a', { ink: 0.008 }).box(x, y + 1.85, z, 0.2, 0.26, 0.2, '#3a3036', { ink: 0.008 }); colliders.push({ x, z, r: 0.15 }); smallLamps.push({ x, y: y + 1.85, z }); }
    { const s = SPOT.skip, y = WORLD.terrainAt(-3.6, -334.2); for (let i = 0; i < 6; i++) pk.add(G.sphere, -3.9 + (i % 3) * 0.2, y + 0.06 + Math.floor(i / 3) * 0.06, -334.0 + (i % 2) * 0.15, 0.13, 0.04, 0.1, '#9a958c', { ink: 0.005 }); void s; }
    pk.build(near);
    const lampsLit = smallLamps.map(L => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd77a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); sp.position.set(L.x, L.y, L.z); sp.scale.setScalar(1.6); near.add(sp); return sp; });
    // the causeway's stone lanterns
    const sk = CAVES.Kit(), causeG = new THREE.Group(); group.add(causeG);
    const stones = LAMPS.map(L => stoneLantern(sk, causeG, L)); sk.build(causeG);
    LAMPS.forEach(L => colliders.push({ x: L.x, z: L.z, r: 0.42 }));
    // the chapel, its jetty; its walls are solid (the door's the way in)
    const ch = chapel(group);
    platforms.push(ch.jetty);
    colliders.push({ obox: 1, x: CHAPEL.x, z: CHAPEL.z, hw: CHAPEL.w / 2 + 0.4, hd: CHAPEL.d / 2 + 0.3, rot: CHAPEL.rot });
    // the Old Tower's crag: solid, so you can't walk into its rocks (its own file builds the way up to the door)
    colliders.push({ x: TOWER.x, z: TOWER.z, r: 13.2 });
    // the people of Candil (gray until they hear what to do), and Lucero
    const people = [];
    const PAIRS = C.PAIRS;
    const homes = { tadeo: SPOT.twins[0], ramiro: SPOT.twins[1], lolo: SPOT.kids[0], mati: SPOT.kids[1], nieves: SPOT.singers[0], marisol: SPOT.singers[1] };
    for (const d of FOLK) {
      const h = homes[d.id], pair = PAIRS.find(q => q.id === d.pair), p = makePerson(d, near, { x: h.x, z: h.z, yaw: h.yaw, pose: pair.pose, gray: true });
      p.pair = d.pair; p.villager = true; p.home = h; people.push(p);
    }
    const luc = makePerson(LUCERO, group, { x: SPOT.luceroGate.x, z: SPOT.luceroGate.z, yaw: SPOT.luceroGate.yaw, pose: 'lantern' }); luc.story = true; people.push(luc);
    luc.prop = lanternPole(luc); luc.prop.place();
    // ---------------------------------------------------------------- live state
    const S = { lantern: 0 };
    const fogs = { road: fog1, cause: fog2, tower: fogT, lamps: lampFog };
    function setFog(f, on, instant) { f.set(on); if (instant) f.k = f.kT; f.pts.visible = f.k > 0.01 || on; }
    function setGaps(fixed) { bw.gapG.visible = !!fixed; bw.gaps.forEach(g => { g.y[0] = g.y[1] = fixed ? DECK : -9; }); }
    function setPunt(free, instant) { dk.punt.kT = free ? 1 : 0; if (instant) { dk.punt.k = dk.punt.kT; dk.punt.apply(); } puntSolid.x = free ? 1e5 : puntSolid.x0; puntSolid.z = free ? 1e5 : puntSolid.z0; }
    function setLantern(lit, instant) { lantern.kT = lit ? 1 : 0; if (instant) lantern.k = lantern.kT; }
    function setLamp(i, lit) { if (stones[i]) stones[i].flame.visible = !!lit; }
    function setBell(swing) { ch.bellSwing = swing; }
    function placeLucero(at, y) { luc.x = at.x; luc.z = at.z; luc.y = y !== undefined ? y : WORLD.terrainAt(at.x, at.z); if (at.yaw !== undefined) luc.baseYaw = luc.yaw = at.yaw; }
    function update(dt, t, you) {
      const Y = you || { x: 0, z: 0, y: 0 };
      const d0 = Math.hypot(Y.x + 12, Y.z + 340);
      group.visible = !!you && (d0 < 150 || Math.hypot(Y.x - 9, Y.z + 255) < 60);      // (from the Old Quarter on; not from Alba: 45 draw calls saved there)
      if (!group.visible) return;
      near.visible = Math.hypot(Y.x - CANDIL.x, Y.z - CANDIL.z) < 130;
      fogU.uTime.value = t;
      const cam = G0 && G0.w3d && G0.w3d.camera;
      if (cam) fogU.uScale.value = (innerHeight || 768) * 0.5 * cam.projectionMatrix.elements[5];
      for (const f of [fog1, fog2, fogT, ...lampFog]) { f.k = damp(f.k, f.kT, 0.9, dt); f.mat.uniforms.uK.value = f.k; f.pts.visible = f.k > 0.01; }
      mist.mat.uniforms.uK.value = 1 - 0.55 * C.live.freed;
      wisps.mat.uniforms.uK.value = 0.6 + 0.4 * Math.sin(t * 1.7);
      if (gate) gate.step(dt);
      dk.punt.k = damp(dk.punt.k, dk.punt.kT, 0.8, dt); dk.punt.apply();
      if (dk.punt.k > 0.98) dk.punt.g.position.y += Math.sin(t * 1.4) * 0.03;
      lantern.k = damp(lantern.k, lantern.kT, 1.4, dt);
      lantern.pane.material.color.set(lantern.k > 0.5 ? '#ffe9a0' : '#4a4a52'); lantern.glow.material.opacity = lantern.k * (0.75 + 0.1 * Math.sin(t * 7));
      lampsLit.forEach((sp, i) => { sp.material.opacity = lantern.k * (0.6 + 0.12 * Math.sin(t * 5 + i)); });
      stones.forEach((s, i) => { if (!s.flame.visible) return; const f = 1 + 0.12 * Math.sin(t * 11 + i) + 0.06 * Math.sin(t * 23 + i * 2); s.core.scale.set(0.09 * f, 0.16 * f, 0.09 * f); s.glow.material.opacity = 0.6 + 0.12 * Math.sin(t * 7 + i); });
      ch.bellSwing = damp(ch.bellSwing || 0, 0, 0.5, dt); ch.bell.rotation.x = Math.sin(t * 3.0) * (ch.bellSwing || 0);
      if (luc.prop) { luc.prop.flare = damp(luc.prop.flare, 0, 1.2, dt); luc.prop.glow.scale.setScalar(1.3 + luc.prop.flare * 4); luc.prop.glow.material.opacity = 0.55 + luc.prop.flare * 0.45 + 0.05 * Math.sin(t * 9); }
      for (const p of people) { if (p.story || near.visible) animatePerson(p, dt, t, you); }
    }
    const stats = () => { let tris = 0, calls = 0; group.traverse(o => { if (o.visible === false) return; if (o.isMesh || o.isSprite || o.isPoints) { calls++; if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } }); return { tris: Math.round(tris), meshes: calls, colliders: colliders.length, people: people.length }; };
    return {
      colliders, platforms, moving, group, people, update, stats,
      objects: { near, gate, fogs, mist, wisps, water: wat, plants, boardwalk: bw, lantern, dock: dk, stones, chapel: ch, lucero: luc },
      setFog, setGaps, setPunt, setLantern, setLamp, setBell, placeLucero, lucero: luc,
      makePerson: (d, o) => makePerson(d, group, o), person: id => people.find(p => p.id === id) || null,
      get state() { return S; },
    };
  }
  let G0 = null;
  Object.assign(C, { build, POSE, personKits, makePerson, animatePerson, grayOf, puffs, mats, buildCut, toWorld, DECK, bindGame(g) { G0 = g; }, gateLeaves: true });
})();

// ================================================================ the game side: the gate, Lucero, the fog, the boardwalk, Candil, the lanterns, the door
(() => {
  const C = MARSH, SPOT = C.SPOT, V = (x, y, z) => new THREE.Vector3(x, y, z);
  let G = null, B = null, synced = '', curCool = 15, brunoAt = null;
  const S = () => { const s = G.state; s.marsh = s.marsh || {}; s.marsh.told = s.marsh.told || {}; s.marsh.lamps = s.marsh.lamps || [false, false, false, false]; return s.marsh; };
  const F = () => G.state.flags;
  const name = () => G.state.mimoName || 'Mimo';
  const lang = () => G.state.lang || 'es';
  // the old north road's gate (cemetery.js; a fallback when its spots aren't there)
  const gateN = () => C.northGate() || { x: 9, z: -255 };
  const cjk = l => l === 'zh' || l === 'ja';
  const plainOf = src => (cjk(lang()) && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(src, { lang: lang() }) : src);
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const ex = w => (lang() === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const lock = on => { G.sim.lock = on ? 1 : 0; };
  // every verb Mimo might know by now (the regions' verbs only when their files are in)
  const verbs = () => ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing', 'v.climb', 'v.blow', 'v.call', 'v.dig', 'v.light'].filter(id => LEX.item(id));
  const person = id => (B ? B.person(id) : null);
  const luc = () => (B ? B.lucero : null);
  const allyOn = () => !!(G && F().marshBruno);
  const nameCJ = n => { const N = C.NAME_CJ[n]; return N && cjk(lang()) && typeof CJK !== 'undefined' ? CJK.plain(N[lang()], { lang: lang() }) : n; };
  // someone says a line from the region's table, mixed by the weave (STORY.sayInline: never all one language, DESIGN.md 16)
  // (in an English line, {T:jump:we} is that command in the language you're learning: «¡Saltemos!», the form it's about)
  const fillT = s => String(s).replace(/\{T:([a-z]+):(one|you|we)\}/g, (m, v, per) => plainOf(TEAM.model('v.' + v, per, lang())));
  function sayT(p, key) {
    const T = C.ML[key]; if (!p || !T) return Promise.resolve();
    p.lines = { en: fillT(T.en || ''), [lang()]: T[lang()] || '' };
    if (!p.name0) p.name0 = p.name;
    p.name = nameCJ(p.name0);
    return STORY.sayInline(p);
  }
  // a demonstration (a lines.js key): the language, with the new word glossed (STORY.demoAt; the lead's rule)
  function demo(p, key) { if (!p) return Promise.resolve(); if (!p.name0) p.name0 = p.name; return STORY.demoAt(p, key, nameCJ(p.name0)); }
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${name()} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  // Mimo shines: it lights up like a little sun (its glow, a big halo, sparkles), and the light reaches `at`
  let halo = null;
  async function mimoShine(at, sec = 1.4) {
    const M = G.sim.mimo;
    if (at) G.sim.mimoGo(null, at);
    if (!halo) { halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff1b0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); G.w3d.scene.add(halo); }
    Sound.play('chime'); M.happy = 1.4; M.glow = 1;
    await tween(sec, k => {
      const s = Math.sin(Math.PI * Math.min(1, k * 1.4)) * (k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3);
      halo.position.set(M.x, M.ry + 0.6, M.z); halo.scale.setScalar(2 + s * 14); halo.material.opacity = Math.max(0, s) * 0.85; M.glow = 1;
      if (Math.random() < 0.3) G.w3d.fx.sparkle(M.x, M.ry + 0.7, M.z, 2, ['#fff3a0', '#ffffff']);
    });
    halo.material.opacity = 0;
  }
  const liftPatch = (tag, instant) => { const i = WORLD.L.hush.findIndex(h => h[tag]); if (i >= 0 && WORLD.L.hush[i].a > 0.001) G.w3d.liftHush(i, instant); };
  // the story's Bruno (sim npc 'bruno'): placed where the marsh's story has him; a jump of his across a gap
  function brunoNpc() { return G.sim.npc('bruno'); }
  function placeBruno(at, puff) {
    const Bn = brunoNpc(); if (!Bn || !at) return;
    Bn.x = at.x; Bn.z = at.z; Bn.y = G.sim.ground(at.x, at.z); if (at.yaw !== undefined) Bn.baseYaw = Bn.yaw = at.yaw; Bn.look = null;
    const solid = WORLD.extra.find(c => c.npc === 'bruno'); if (solid) { solid.x = Bn.x; solid.z = Bn.z; }
    if (puff) G.w3d.fx.puff(Bn.x, Bn.y, Bn.z, 6, 0.25);
    brunoAt = at;
  }
  // where Bruno is, by the story (null: not the marsh's business yet, he's in Alba)
  function brunoSpot() {
    const f = F();
    if (!C.open(G.state)) return null;
    if (!f.marsh) return SPOT.brunoGate;
    if (!f.marshFog) return { x: SPOT.fogWatch.x - 1.6, z: SPOT.fogWatch.z + 1.2, yaw: Math.PI };
    if (!f.bwJump) return { x: SPOT.bwStart.x + 1.6, z: SPOT.bwStart.z + 1.0, yaw: Math.PI + 0.4 };
    if (f.chapelOpen && !f.marshFree) return { x: SPOT.jetty.x - 0.4, z: SPOT.jetty.z + 1.6, yaw: 3.8 };     // (with Lucero by the chapel, while you're in there)
    return SPOT.brunoCandil;
  }
  function luceroSpot() {
    const f = F();
    if (!f.marsh) return { x: 12.6, z: -266.4, yaw: Math.PI, hidden: true };
    if (!f.marshFog) return SPOT.luceroFog;
    if (!f.bwJump) return { x: SPOT.bwStart.x - 0.4, z: SPOT.bwStart.z - 0.8, yaw: Math.PI + 0.45 };
    if (f.chapelOpen && !f.marshFree) return { x: SPOT.jetty.x + 1.2, z: SPOT.jetty.z + 0.8, yaw: 3.8 };
    return SPOT.lucero;
  }
  // a person (or you, or Bruno) jumps from a to b (an arc), the deck under them at both ends
  async function hop(st, a, b, sec = 0.62, h = 1.3) {
    const ya = WORLD.groundAt(a.x, a.z), yb = WORLD.groundAt(b.x, b.z);
    Sound.play('jump');
    await tween(sec, k => { st.x = lerp(a.x, b.x, k); st.z = lerp(a.z, b.z, k); const y = lerp(ya, yb, k) + Math.sin(Math.PI * k) * h; if ('ry' in st) { st.y = st.ry = y; } else if ('jumpY' in st || st.root) { st.y = lerp(ya, yb, k); st.jumpY = Math.sin(Math.PI * k) * h; } else st.y = y; });
    if (st.root) st.jumpY = 0;
    Sound.play('land', 6);
  }
  async function hopYou(a, b) {
    const Y = G.sim.you, M = G.sim.mimo; Y.yaw = Math.atan2(b.x - a.x, b.z - a.z);
    const pm = hop(Y, a, b, 0.66, 1.4);
    M.station = null; M.hop = { x0: M.x, z0: M.z, x1: b.x + 0.8, z1: b.z + 0.6, y0: M.y, y1: WORLD.groundAt(b.x + 0.8, b.z + 0.6), t: 0, dur: 0.7, h: 1.2 };
    await pm; Y.x = b.x; Y.z = b.z; G.sim.snap(); Y.onGround = true;
  }
  async function hopBruno(a, b) { const Bn = brunoNpc(); if (!Bn) return; await hop(Bn, a, b, 0.6, 1.2); Bn.y = G.sim.ground(b.x, b.z); placeBruno({ x: b.x, z: b.z, yaw: Bn.yaw }); }
  // the gap's two sides on the boardwalk (i: 0, 1, 2)
  const gapSides = i => { const g = C.BW.gaps[i], w = C.BW.gapW / C.BW.len; return { a: C.bwAt(g - w / 2 - 0.09), b: C.bwAt(g + w / 2 + 0.09) }; };
  const side = (p, s) => ({ x: p.x - C.BW.uz * s, z: p.z + C.BW.ux * s });

  // ---------------------------------------------------------------- the scenes
  // the gate: Bruno is waiting; a lantern bobs out of the mist on the other side, and Lucero unlocks it
  async function gateScene() {
    const f = F(), L = luc(), Bn = brunoNpc(); if (!L || f.marsh) return;
    lock(true);
    const g = B.objects.gate, N = gateN();
    G.cam.override = { pos: V(N.x + 2.4, WORLD.terrainAt(N.x, N.z) + 2.6, N.z + 7.6), look: V(N.x + 1.4, WORLD.terrainAt(N.x, N.z) + 1.5, N.z - 4), dur: 0.9 };
    if (Bn) Bn.look = G.sim.you;
    await STORY.say('bruno', 'marsh.b.gate');
    await STORY.you('The gate’s still chained… and past it everything’s gray. Noa came this way, didn’t she?');
    // a light in the mist: Lucero comes down the road with her lantern
    C.live.lucero = true; L.root.visible = true;
    const from = { x: 13.6, z: -270 }, to = SPOT.luceroGate;
    L.x = from.x; L.z = from.z; L.y = WORLD.terrainAt(from.x, from.z);
    await tween(1.6, k => { L.x = lerp(from.x, to.x, k); L.z = lerp(from.z, to.z, k); L.y = WORLD.terrainAt(L.x, L.z); L.yaw = Math.atan2(to.x - from.x, to.z - from.z); if (L.prop) L.prop.flare = 0.3; });
    L.baseYaw = L.yaw = Math.atan2(N.x - L.x, N.z - L.z);
    await sayT(L, 'l.gate1');
    Sound.play('click'); await wait(0.3); Sound.play('wood');
    if (g) g.set(true);
    await wait(1.0);
    await sayT(L, 'l.gate2');
    await STORY.say('bruno', 'marsh.b.gate2');
    await sayT(L, 'l.gate3');
    f.marsh = true; f.lucero = true; f.marshBruno = true; G.save();
    G.cam.override = null;
    await UI.fade(1, 400);
    B.placeLucero(SPOT.luceroFog); placeBruno(brunoSpot());
    await UI.fade(0, 400);
    lock(false);
    await UI.chapter('The Gray Marsh', 'Chapter 1 · The eighth bell');
    STORY.think('Lucero went on down the road. A wall of gray {w.fog} is waiting there…', 5);
  }
  // the fog bank: Lucero shows the word on her lantern; Mimo learns it by watching (DESIGN.md 13.1, 16)
  async function fogScene() {
    const f = F(), L = luc(); if (!L || f.marshFog) return;
    S().fogSeen = true;
    lock(true);
    const fy = WORLD.terrainAt(C.FOG1.x, C.FOG1.z), shot = { pos: V(SPOT.fogWatch.x + 4.2, fy + 2.6, SPOT.fogWatch.z + 3.6), look: V(C.FOG1.x, fy + 1.6, C.FOG1.z), dur: 0.9 };
    G.cam.override = shot;
    await sayT(L, 'l.fog1');
    if (!LEX.taught('v.light')) {
      STORY.introduce('v.light');
      L.set('lantern', false); L.prop.flare = 1; Sound.play('chime');
      const fg = B.objects.fogs.road; fg.kT = 0.55;
      await demo(L, 'marsh.demo.light');
      fg.kT = 1;
      await STORY.youWord('«', STORY.wordPart('v.light'), '»… she says it to her lantern, and it shines!');
      G.cam.override = null; lock(false);
      const r = await STORY.teachWord('v.light', { spot: { x: SPOT.fogWatch.x, z: SPOT.fogWatch.z }, look: { x: L.x, z: L.z }, title: `${name()} is watching Lucero and her lantern. What does she tell it?` });
      if (r && r.ok) { L.prop.flare = 0.8; await sayT(L, 'l.fog2'); }
    } else { G.cam.override = null; lock(false); await sayT(L, 'l.fog2'); }
    G.save();
  }
  // tell Mimo what to do at the fog («¡Ilumina!»): it lights the whole road
  async function fogTell() {
    const f = F(), st = S(), M = G.sim.mimo;
    if (!st.fogSeen && !LEX.taught('v.light')) return fogScene();
    let verb = st.quickLight ? 'v.light' : null, ms = 3000;
    if (!verb) {
      const r = await UI.command({ name: name(), icon: 'fog', title: `A wall of gray Hush fog fills the road, too thick to walk through. What should ${name()} do?`, verbs: verbs(), answer: 'v.light' });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); M.tiltT = 1.4; STORY.think(LEX.taught('v.light') ? '{mimo} tilts its head. What did Lucero tell her lantern?' : '{mimo} looks at the fog… then at Lucero and her lantern.', 5); return; }
      verb = r.verb; ms = r.ms;
    }
    if (verb !== 'v.light') {
      if (LEX.taught(verb)) LEX.attempt(verb, { ok: true, hints: 0, ms, mode: 'command' });
      G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
      const say = s => STORY.think(s, 4);
      if (verb === 'v.blow') { Sound.play('blow'); say('{mimo} blows and blows. The fog swirls… and settles right back. This fog is the Hush’s own.'); }
      else if (verb === 'v.push') say('{mimo} pushes into the fog… and comes back out, gray and shivering.');
      else if (verb === 'v.jump') { M.hop = { t: 0 }; say('{mimo} hops into the fog. You can’t see it anymore! It hops back out, scared.'); }
      else if (verb === 'v.sing') { Sound.play('sing'); say('{mimo} sings. The fog swallows the song.'); }
      else say('{mimo} tries… but the fog doesn’t care.');
      return;
    }
    learnUse('v.light', ms); st.quickLight = true;
    lock(true);
    const fy = WORLD.terrainAt(C.FOG1.x, C.FOG1.z);
    G.cam.override = { pos: V(SPOT.fogFront.x + 5, fy + 3.6, SPOT.fogFront.z + 5.4), look: V(C.FOG1.x, fy + 1.4, C.FOG1.z), dur: 0.9 };
    G.sim.mimoGo({ x: SPOT.fogFront.x - 0.6, z: SPOT.fogFront.z - 1.6 }, C.FOG1);
    await wait(0.6);
    const ps = mimoShine(C.FOG1, 1.8);
    await wait(0.5);
    B.setFog(B.objects.fogs.road, false);
    liftPatch('marshRoad', false);
    await ps;
    f.marshFog = true; G.save();
    G.cam.override = null; lock(false); G.sim.mimoGo(null, null);
    const L = luc(); if (L) { L.prop.flare = 1; await sayT(L, 'l.fog3'); }
    await UI.fade(1, 350); B.placeLucero(luceroSpot()); placeBruno(brunoSpot()); await UI.fade(0, 350);
  }
  // the boardwalk: Lucero jumps the first gap and calls «¡Salten!» to you and Bruno; at the second, «¡Saltemos!»; the third is yours
  async function boardwalkScene() {
    const f = F(), st = S(), L = luc(); if (!L || f.bwJump || st.bwDemo) return;
    lock(true);
    const g0 = gapSides(0), g1 = gapSides(1), y = C.DECK;
    G.cam.override = { pos: V(g0.a.x + 6.0, y + 4.2, g0.a.z + 3.4), look: V(g1.a.x, y + 0.8, g1.a.z), dur: 1.0 };
    await sayT(L, 'l.bw1');
    // she walks to the first gap, and jumps it
    const lA = side(g0.a, 0.5), lB = side(g0.b, 0.5);
    await tween(0.8, k => { L.x = lerp(L.x, lA.x, k); L.z = lerp(L.z, lA.z, k); L.y = y; });
    L.yaw = Math.atan2(C.BW.ux, C.BW.uz); await hop(L, lA, lB);
    L.yaw = L.baseYaw = Math.atan2(-C.BW.ux, -C.BW.uz);
    // you and Bruno walk up to it
    const Y = G.sim.you, yA = side(g0.a, -0.4), yB = side(g0.b, -0.4), bA = side(g0.a, 0.6), bB = side(g0.b, 0.6);
    Y.x = yA.x - C.BW.ux * 0.4; Y.z = yA.z - C.BW.uz * 0.4; G.sim.snap(); placeBruno(Object.assign({ yaw: Math.atan2(C.BW.ux, C.BW.uz) }, { x: bA.x - C.BW.ux * 0.6, z: bA.z - C.BW.uz * 0.6 }));
    await demo(L, 'marsh.demo.you');
    await Promise.all([hopYou(yA, yB), wait(0.15).then(() => hopBruno(bA, bB))]);
    // the second, wider gap: all together
    const yA2 = side(g1.a, -0.4), yB2 = side(g1.b, -0.4), lA2 = side(g1.a, 0.6), lB2 = side(g1.b, 0.6), bA2 = side(g1.a, 0.1), bB2 = side(g1.b, 0.1);
    await tween(0.9, k => { Y.x = lerp(yB.x, yA2.x, k); Y.z = lerp(yB.z, yA2.z, k); Y.y = Y.ry = y; L.x = lerp(lB.x, lA2.x, k); L.z = lerp(lB.z, lA2.z, k); });
    G.sim.snap(); placeBruno({ x: bA2.x - C.BW.ux * 0.7, z: bA2.z - C.BW.uz * 0.7, yaw: Math.atan2(C.BW.ux, C.BW.uz) });
    G.cam.override = { pos: V(g1.a.x + 5.4, y + 3.6, g1.a.z + 2.4), look: V(g1.b.x, y + 0.9, g1.b.z), dur: 0.9 };
    await demo(L, 'marsh.demo.we');
    L.yaw = Math.atan2(C.BW.ux, C.BW.uz);
    await Promise.all([hopYou(yA2, yB2), hop(L, lA2, lB2), wait(0.1).then(() => hopBruno(bA2, bB2))]);
    // what that was: «salta» for one, «salten» for you all, «saltemos» for all of us
    const fm = TEAM.forms('v.jump', lang()), pl = s => (cjk(lang()) ? s : s);
    G.cam.override = null;
    await STORY.youWord('«', STORY.wordPart(null, pl(fm.you[0]), 'jump (you all)'), '»: Lucero says it to two or more of us.');
    await STORY.youWord('«', STORY.wordPart(null, pl(fm.we[0]), 'let’s jump'), '»: when we all jump, me too!');
    st.bwDemo = true; G.save();
    await sayT(L, 'l.bw3');
    lock(false);
  }
  // the last gap: you say it. «¡Saltemos!»: everyone jumps; «¡Salten!»: Lucero and Bruno jump, and you're left behind; «¡Salta!»: Mimo
  async function bwTell() {
    const f = F(), L = luc(); if (!L || f.bwJump) return;
    const l = lang(), g2 = gapSides(2), y = C.DECK;
    const r = await UI.command({ name: name(), icon: 'jump', title: 'The last gap. Lucero, Bruno and {mimo} are ready. Tell everyone to jump, you too!'.replace('{mimo}', name()), verbs: [], placeholder: 'tell everyone…',
      hint: `All of us: ${plainOf(TEAM.frame('we', l))} (? shows an example)`, model: plainOf(TEAM.model('v.jump', 'we', l)), modelEn: 'Let’s jump!' });
    if (!r || r.cancelled) return;
    const g = TEAM.read(r.text, l, { want: 'we', verb: 'v.jump' });
    const Y = G.sim.you, yA = side(g2.a, -0.4), yB = side(g2.b, -0.4), lA = side(g2.a, 0.6), lB = side(g2.b, 0.6), bA = side(g2.a, 0.1), bB = side(g2.b, 0.1);
    if (!g.verb) { G.sim.mimoSay('…?', 1.4); STORY.think('Nobody moves. Tell everyone to jump, you too… (? shows an example)', 5); return; }
    if (g.verb !== 'v.jump') { STORY.think(`Everyone looks at the gap… then at you. That’s not jumping! (${plainOf(TEAM.frame('we', l))})`, 5); return; }
    lock(true);
    Y.x = yA.x - C.BW.ux * 0.4; Y.z = yA.z - C.BW.uz * 0.4; G.sim.snap();
    L.x = lA.x - C.BW.ux * 0.4; L.z = lA.z - C.BW.uz * 0.4; placeBruno({ x: bA.x - C.BW.ux * 0.7, z: bA.z - C.BW.uz * 0.7, yaw: Math.atan2(C.BW.ux, C.BW.uz) });
    G.cam.override = { pos: V(g2.a.x + 5.4, y + 3.6, g2.a.z + 2.6), look: V(g2.b.x, y + 0.9, g2.b.z), dur: 0.7 };
    if (g.person === 'one') {
      const M = G.sim.mimo; M.station = null; M.hop = { x0: M.x, z0: M.z, x1: g2.b.x, z1: g2.b.z, y0: M.y, y1: y, t: 0, dur: 0.6, h: 1.2 };
      await wait(1.0); M.hop = { x0: g2.b.x, z0: g2.b.z, x1: yA.x + 0.6, z1: yA.z + 0.4, y0: y, y1: y, t: 0, dur: 0.6, h: 1.2 }; await wait(0.8);
      await sayT(L, 'l.bwOne'); G.cam.override = null; lock(false); return;
    }
    if (g.person === 'you') {
      L.yaw = Math.atan2(C.BW.ux, C.BW.uz);
      await Promise.all([hop(L, lA, lB), wait(0.1).then(() => hopBruno(bA, bB))]);
      L.yaw = Math.atan2(-C.BW.ux, -C.BW.uz);
      await sayT(L, 'l.bwYou');
      await Promise.all([hop(L, lB, lA), wait(0.1).then(() => hopBruno(bB, bA))]);
      G.cam.override = null; lock(false); return;
    }
    UI.toast(`${g.letter} · ${g.reason}`); Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    if (g.letter !== 'S' && g.canon) STORY.think(`«${plainOf(g.canon)}»`, 3);
    L.yaw = Math.atan2(C.BW.ux, C.BW.uz);
    await Promise.all([hopYou(yA, yB), hop(L, lA, lB), wait(0.1).then(() => hopBruno(bA, bB))]);
    f.bwJump = true; S().bw = g.letter; G.save();
    B.setGaps(true);
    G.cam.override = null;
    await sayT(L, 'l.bwDone');
    await UI.fade(1, 350); B.placeLucero(luceroSpot()); placeBruno(brunoSpot()); await UI.fade(0, 350);
    lock(false);
  }
  // Candil: everyone gray; Lucero explains (they still hear: tell each pair what to do, both at once)
  async function arriveCandil() {
    const f = F(), L = luc(); if (!L) return;
    f.candil = true; G.save();
    await UI.chapter('Candil', 'The Gray Marsh · the lamplighters’ village');
    lock(true);
    G.cam.override = { pos: V(C.CANDIL.x + 9, 7.5, C.CANDIL.z + 12), look: V(C.CANDIL.x, 1.4, C.CANDIL.z - 2), dur: 1.2 };
    await sayT(L, 'l.candil1');
    await sayT(L, 'l.candil2');
    G.cam.override = null; lock(false);
    G.sim.mimo.scared = 2;
  }
  const pairDone = id => !!S().told[id];
  const pairsDone = () => C.PAIRS.filter(p => pairDone(p.id)).length;
  const DOING = { twins: 'pushing their punt off the mud', kids: 'about to skip stones over the water', singers: 'at the shrine, their mouths open in a song' };
  const FOLKNAME = { twins: ['Tadeo', 'Ramiro'], kids: ['Lolo', 'Mati'], singers: ['Nieves', 'Marisol'] };
  // a pair stuck in the middle of something: tell them both what to do («¡Empujen!», «¡Lancen!», «¡Canten!»), graded S–D
  async function pairTell(pair) {
    if (pairDone(pair.id)) return pairChat(pair);
    if (!F().candil) return arriveCandil();
    const l = lang(), hs = C.HUSHED[pair.id], words = plainOf(String(hs[l] || hs.en)).replace(/\*/g, '');
    const nm = FOLKNAME[pair.id].map(nameCJ).join(' & ');
    const r = await UI.command({ name: name(), icon: pair.icon, title: `${nm}, frozen ${DOING[pair.id]}. They mumble: «${words}» Tell them both what to do!`, verbs: [], placeholder: 'tell them both…',
      hint: `Like Lucero on the boardwalk, to two or more: ${plainOf(TEAM.frame('you', l))} (? shows an example)`, model: plainOf(TEAM.model(pair.verb, 'you', l)), modelEn: { 'v.push': 'Push, both of you!', 'v.throw': 'Throw, both of you!', 'v.sing': 'Sing, both of you!' }[pair.verb] });
    if (!r || r.cancelled) return;
    const g = TEAM.read(r.text, l, { want: 'you', verb: pair.verb });
    const ps = pair.who.map(person);
    if (!g.verb) { Sound.play('wrong'); G.sim.mimoSay('…?', 1.4); STORY.think('They don’t move. Tell them both what to do… (? shows an example)', 5); return; }
    if (g.verb !== pair.verb) { Sound.play('wrong'); ps.forEach(p => { if (p) p.root.rotation.z = 0.05; }); STORY.think(`They twitch… but that’s not what they were doing. Look again: they were ${DOING[pair.id]}.`, 5); return; }
    if (g.person === 'one') { Sound.play('wrong'); STORY.think(`Only ${nm.split(' & ')[0]} twitches… then stops. There are two of them! To two or more: ${plainOf(TEAM.frame('you', l))}`, 6); return; }
    if (g.person === 'we') { Sound.play('wrong'); STORY.think(`That means you’d do it too… but it’s their job, not yours. Tell them: ${plainOf(TEAM.frame('you', l))}`, 6); return; }
    // right: they hear it, and their words come back
    UI.toast(`${g.letter} · ${g.reason}`); Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    if (g.letter !== 'S' && g.canon) STORY.think(`«${plainOf(g.canon)}»`, 3);
    lock(true);
    const c = { x: (ps[0].x + ps[1].x) / 2, z: (ps[0].z + ps[1].z) / 2 }, Y = G.sim.you;
    G.cam.override = { pos: V(c.x + (Y.x - c.x) * 0.5 + 3.4, 3.4, c.z + (Y.z - c.z) * 0.5 + 3.4), look: V(c.x, 1.2, c.z), dur: 0.8 };
    for (const p of ps) { p.set(pair.pose, false); G.w3d.fx.sparkle(p.x, p.y + 1.3, p.z, 16, ['#ffd166', '#fff3a0']); }
    Sound.play('learned');
    await wait(0.4);
    if (pair.id === 'twins') { Sound.play('land', 10); B.setPunt(true); await wait(1.4); }
    if (pair.id === 'kids') { for (let i = 0; i < 5; i++) { Sound.play('drip'); G.w3d.fx.puff(C.SPOT.skip.x + i * 1.6, WORLD.L.water + 0.1, C.SPOT.skip.z - i * 0.3, 3, 0.12, '#dfe9e6'); await wait(0.22); } }
    if (pair.id === 'singers') { Sound.play('sing'); await wait(1.2); }
    S().told[pair.id] = g.letter; G.save();
    for (const p of ps) p.set('happy', false);
    await sayT(ps[0], 'p.' + pair.id);
    G.cam.override = null; lock(false);
    for (const p of ps) setTimeout(() => { if (!p.hushed) p.set('idle', false); }, 2400);
    if (pairsDone() >= 3) await allAwake();
  }
  async function pairChat(pair) { const p = person(pair.who[0]); return sayT(p, 'p.' + pair.id + 'Chat'); }
  async function allAwake() {
    const L = luc(); if (!L) return;
    F().marshPairs = true; G.save();
    lock(true);
    G.cam.override = { pos: V(C.LANTERN.x + 4.5, 3.8, C.LANTERN.z + 6.5), look: V(C.LANTERN.x, 2.8, C.LANTERN.z), dur: 1.0 };
    await sayT(L, 'l.candil3');
    await demo(L, 'marsh.demo.lantern');
    G.cam.override = null; lock(false);
  }
  // the great lantern, all together («¡Iluminemos!»): Candil's color comes back, the causeway's fog goes
  async function lanternTell() {
    const f = F(), L = luc(); if (f.marshLantern) return sayT(L, 'l.chat');
    if (!f.marshPairs) { STORY.think('The great lantern is cold. First, the people of Candil: they’re still gray.', 4.5); return; }
    const l = lang();
    const r = await UI.command({ name: name(), icon: 'light', title: 'Candil’s great lantern. Everyone is here, lanterns ready: Lucero, the twins, the kids, Nieves and Marisol, {mimo}… and you. Say it, all together!'.replace('{mimo}', name()),
      verbs: [], placeholder: 'everyone, together…', hint: `All of us, you too: ${plainOf(TEAM.frame('we', l))} (? shows an example)`, model: plainOf(TEAM.model('v.light', 'we', l)), modelEn: 'Let’s light it up!' });
    if (!r || r.cancelled) return;
    const g = TEAM.read(r.text, l, { want: 'we', verb: 'v.light' });
    if (!g.verb) { Sound.play('wrong'); STORY.think('Everyone waits… Say it like Lucero did, all of us together. (? shows an example)', 5); return; }
    if (g.verb !== 'v.light') { Sound.play('wrong'); STORY.think('Everyone looks at you, puzzled. It’s a lantern: what does it need? (Lucero said it: ? shows it)', 5); return; }
    if (g.person === 'one') { learnUse('v.light'); await mimoShine(C.LANTERN, 1.0); STORY.think('{mimo} shines… but the great lantern only flickers. It needs everyone, you too!', 5); return; }
    if (g.person === 'you') { Sound.play('chime'); if (L.prop) L.prop.flare = 1; STORY.think('Everyone raises their lantern… but you didn’t include yourself! The great lantern needs all of us.', 5.5); return; }
    UI.toast(`${g.letter} · ${g.reason}`); Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    if (g.letter !== 'S' && g.canon) STORY.think(`«${plainOf(g.canon)}»`, 3);
    learnUse('v.light');
    lock(true);
    G.cam.override = { pos: V(C.LANTERN.x + 8, 5.5, C.LANTERN.z + 10), look: V(C.LANTERN.x, 2.6, C.LANTERN.z), dur: 0.9 };
    if (L.prop) L.prop.flare = 1;
    for (const p of B.people) if (p.villager) p.set('cheer', false);
    const ps = mimoShine(C.LANTERN, 2.0);
    await wait(0.8);
    B.setLantern(true); Sound.play('fanfare');
    liftPatch('marshCandil', false);
    B.setFog(B.objects.fogs.cause, false);
    await ps;
    f.marshLantern = true; S().lantern = g.letter; G.save();
    await wait(0.8);
    for (const p of B.people) if (p.villager) p.set('idle', false);
    G.cam.override = { pos: V(C.CANDIL.x - 4, 6.5, C.CANDIL.z - 2), look: V(C.FOG2.x - 6, 1.2, C.FOG2.z - 8), dur: 1.2 };
    await sayT(L, 'l.lit');
    G.cam.override = null; lock(false);
    await sayT(L, 'l.lamps');
  }
  // a stone lantern on the causeway: «¡Ilumina!» (once Mimo's done it, E repeats it); its fog lifts
  async function lampTell(i) {
    const st = S(), Lp = C.LAMPS[i];
    if (st.lamps[i]) return;
    if (i > 0 && !st.lamps[i - 1]) { STORY.think('The one before it first: the fog still blocks the way.', 3.5); return; }
    let verb = st.quickLamp ? 'v.light' : null, ms = 2500;
    if (!verb) {
      const r = await UI.command({ name: name(), icon: 'light', title: `An old stone lantern by the causeway, cold and dark. Past it, the gray fog closes the way. What should ${name()} do?`, verbs: verbs(), answer: 'v.light' });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); STORY.think('{mimo} looks at the dark lantern. How did it clear the fog on the road?', 4.5); return; }
      verb = r.verb; ms = r.ms;
      if (verb !== 'v.light') { if (LEX.taught(verb)) LEX.attempt(verb, { ok: true, hints: 0, ms, mode: 'command' }); G.sim.mimoSay(ex(LEX.form(verb)), 1.4); STORY.think('{mimo} tries… The lantern stays dark.', 3.5); return; }
    }
    learnUse('v.light', ms); st.quickLamp = true;
    lock(true);
    G.sim.mimoGo({ x: Lp.x + 0.8, z: Lp.z + 0.8 }, Lp); await wait(0.5);
    const ps = mimoShine(Lp, 1.2);
    await wait(0.5);
    B.setLamp(i, true); Sound.play('chime');
    B.setFog(B.objects.fogs.lamps[i], false);
    await ps;
    st.lamps[i] = true; G.save();
    lock(false); G.sim.mimoGo(null, null);
    const n = st.lamps.filter(Boolean).length;
    if (n >= C.LAMPS.length) { F().marshLamps = true; G.save(); STORY.think('All four lanterns are lit! The drowned {w.chapel} is right there, at the end of the causeway.', 5); }
    else UI.toast(`Lanterns lit: ${n}/${C.LAMPS.length}`);
  }
  // the chapel's door, stuck in the mud: everyone pushes («¡Empujemos!»)
  async function doorTell() {
    const f = F(), L = luc();
    if (f.chapelOpen) { if (typeof CHAPEL_D !== 'undefined' && CHAPEL_D.enter) return CHAPEL_D.enter(); STORY.think('The door is open. Stairs go down into dark water… (coming soon!)', 4); return; }
    if (!f.marshLamps) { STORY.think('The fog is too thick here: the lanterns on the causeway first.', 4); return; }
    const l = lang(), d = C.CH_DOOR;
    if (!S().doorSeen) {
      S().doorSeen = true;
      lock(true);
      await UI.fade(1, 300);
      B.placeLucero({ x: SPOT.chapelDoor.x + 1.2, z: SPOT.chapelDoor.z + 0.4, yaw: Math.atan2(d.x - SPOT.chapelDoor.x, d.z - SPOT.chapelDoor.z) }, C.DECK);
      placeBruno({ x: SPOT.chapelDoor.x - 1.0, z: SPOT.chapelDoor.z + 0.6, yaw: Math.atan2(d.x - SPOT.chapelDoor.x, d.z - SPOT.chapelDoor.z) });
      await UI.fade(0, 300);
      await sayT(L, 'l.door');
      lock(false);
    }
    const r = await UI.command({ name: name(), icon: 'push', title: 'The chapel’s heavy door is stuck in the mud. Lucero and Bruno are with you, ready to push. Say it: all of you, you too!', verbs: [], placeholder: 'everyone, together…',
      hint: `All of us: ${plainOf(TEAM.frame('we', l))} (? shows an example)`, model: plainOf(TEAM.model('v.push', 'we', l)), modelEn: 'Let’s push!' });
    if (!r || r.cancelled) return;
    const g = TEAM.read(r.text, l, { want: 'we', verb: 'v.push' });
    if (!g.verb) { Sound.play('wrong'); STORY.think('Nobody moves. All of you, together… (? shows an example)', 4); return; }
    if (g.verb !== 'v.push') { Sound.play('wrong'); STORY.think('The door doesn’t care about that. It’s stuck: it needs a good shove.', 4); return; }
    if (g.person === 'one') { Sound.play('land', 6); STORY.think('{mimo} pushes all alone… the door doesn’t budge. It needs everyone, you too!', 5); return; }
    if (g.person === 'you') { Sound.play('land', 8); STORY.think('Lucero and Bruno push… it creaks, but it needs you too!', 5); return; }
    UI.toast(`${g.letter} · ${g.reason}`); Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    if (g.letter !== 'S' && g.canon) STORY.think(`«${plainOf(g.canon)}»`, 3);
    learnUse('v.push');
    lock(true);
    G.cam.override = { pos: V(d.x + 4.6, 3.2, d.z + 5.2), look: V(d.x, 1.6, d.z), dur: 0.8 };
    for (let k = 0; k < 3; k++) { Sound.play('land', 8 + k * 3); G.sim.mimo.hop = { t: 0 }; await wait(0.45); }
    Sound.play('wood'); G.w3d.fx.puff(d.x, 0.7, d.z + 0.4, 14, 0.35, '#8a8370');
    f.chapelOpen = true; S().door = g.letter; G.save();
    await wait(0.6);
    G.cam.override = null;
    await sayT(L, 'l.doorOpen');
    lock(false);
  }
  // after the eighth bell: report to Lucero (DESIGN.md 16): she shows you the Old Tower's door, open
  async function reportScene() {
    const f = F(), L = luc(); if (!L) return;
    lock(true);
    const Y = G.sim.you;
    G.cam.override = { pos: V(L.x + (Y.x - L.x) * 0.5 + 3.0, L.y + 2.4, L.z + (Y.z - L.z) * 0.5 + 3.4), look: V((L.x + Y.x) / 2, L.y + 1.2, (L.z + Y.z) / 2), dur: 0.8 };
    await STORY.you('Lucero! The eighth {w.bell}… it’s ringing!');
    await sayT(L, 'l.rep1');
    // the Old Tower: up on its crag, its door
    const T = C.TOWER;
    G.cam.override = { pos: V(T.x - 6, C.TY + 9, T.z + 44), look: V(T.x, C.TY + 13, T.z + 4), dur: 1.6 };
    await wait(1.2);
    await sayT(L, 'l.rep2');
    f.luceroEighth = true; G.save();
    G.cam.override = { pos: V(L.x + 3.2, L.y + 2.4, L.z + 3.8), look: V(L.x, L.y + 1.2, L.z), dur: 1.0 };
    await STORY.say('bruno', 'marsh.b.report');
    await sayT(L, 'l.after');
    G.cam.override = null; lock(false);
    G.save();
  }
  async function luceroTalk() {
    const f = F();
    if (!f.marsh) return;
    if (QUESTS.reportDue && QUESTS.reportDue('lucero')) return reportScene();
    if (!f.marshFog) return S().fogSeen ? sayT(luc(), 'l.fog2') : fogScene();
    if (!f.bwJump) return S().bwDemo ? sayT(luc(), 'l.bw3') : boardwalkScene();
    if (!f.candil) return arriveCandil();
    if (!f.marshPairs) return sayT(luc(), 'l.candil2');
    if (!f.marshLantern) return demo(luc(), 'marsh.demo.lantern');
    if (!f.marshFree) return sayT(luc(), 'l.lamps');
    return sayT(luc(), 'l.after');
  }
  async function brunoTalk() {
    const f = F();
    if (!f.marsh) return gateScene();
    if (f.bwJump && f.candil && typeof C.drill === 'function') return C.drill();
    return STORY.say('bruno', f.bwJump ? 'marsh.b.candil' : 'marsh.b.gate2');
  }

  // ---------------------------------------------------------------- what you can press E on (outdoors, in the region)
  function interactables() {
    if (!G || !B) return [];
    const f = F(), list = [], Y = G.sim.you, st = S();
    if (Y.z > -240 || Y.x < -80 || Y.x > 40) return list;
    const open = C.open(G.state);
    const Bn = brunoNpc(), L = luc();
    if (open && Bn && brunoAt && Math.hypot(Bn.x - brunoAt.x, Bn.z - brunoAt.z) < 2) list.push({ x: Bn.x, z: Bn.z, r: 2.6, label: f.marsh ? 'Talk' : 'Talk', run: brunoTalk });
    if (open && L && L.root.visible && f.marsh) list.push({ x: L.x, z: L.z, y: L.y, r: 2.6, label: QUESTS.reportDue && QUESTS.reportDue('lucero') ? 'Report' : 'Talk', run: luceroTalk });
    if (!open) return list;
    if (f.marsh && !f.marshFog) list.push({ x: SPOT.fogFront.x, z: SPOT.fogFront.z, r: 3.4, label: st.quickLight ? `«${ex(LEX.form('v.light'))}»` : `Tell ${name()}`, run: fogTell });
    if (f.marshFog && !f.bwJump && st.bwDemo) { const g2 = gapSides(2); list.push({ x: g2.a.x - C.BW.ux * 0.6, z: g2.a.z - C.BW.uz * 0.6, y: C.DECK, r: 2.6, label: 'Tell everyone', run: bwTell }); }
    if (f.candil && Math.hypot(Y.x - C.CANDIL.x, Y.z - C.CANDIL.z) < C.CANDIL.r + 6) {
      for (const pair of C.PAIRS) for (const id of pair.who) { const p = person(id); if (p) list.push({ x: p.x, z: p.z, y: p.y, r: 2.2, label: pairDone(pair.id) ? 'Talk' : 'Tell them', run: () => pairTell(pair) }); }
      list.push({ x: SPOT.lanternFront.x, z: SPOT.lanternFront.z, r: 2.6, label: f.marshLantern ? 'Look' : f.marshPairs ? 'Light it, together' : 'Look', run: lanternTell });
    }
    if (f.marshLantern) C.LAMPS.forEach((Lp, i) => { if (!st.lamps[i] && Math.hypot(Y.x - Lp.x, Y.z - Lp.z) < 5) list.push({ x: Lp.x, z: Lp.z, r: 2.8, label: st.quickLamp ? `«${ex(LEX.form('v.light'))}»` : `Tell ${name()}`, run: () => lampTell(i) }); });
    if (f.marshLantern && Math.hypot(Y.x - SPOT.chapelDoor.x, Y.z - SPOT.chapelDoor.z) < 6) list.push({ x: SPOT.chapelDoor.x, z: SPOT.chapelDoor.z, y: C.DECK, r: 2.6, label: f.chapelOpen ? 'Go in' : f.marshLamps ? 'Push, together' : 'Look', run: doorTell });
    if (C.sides) for (const it of C.sides.interactables(Y)) list.push(it);
    return list;
  }
  // where the compass points: the next thing to do here
  function target() {
    const f = F(), st = S(), Y = G.sim.you;
    if (!f.marsh) return wayIn();
    const L = luc();
    if (!f.marshFog) return st.fogSeen || LEX.taught('v.light') ? SPOT.fogFront : (L ? { x: L.x, z: L.z } : SPOT.fogFront);
    if (!f.bwJump) { if (!st.bwDemo) return L ? { x: L.x, z: L.z } : SPOT.bwStart; const g2 = gapSides(2); return { x: g2.a.x, z: g2.a.z }; }
    if (!f.candil) return L ? { x: L.x, z: L.z } : C.CANDIL;
    if (!f.marshPairs) { const left = C.PAIRS.filter(p => !pairDone(p.id)).map(p => person(p.who[0])).filter(Boolean); return left.length ? left.reduce((b, p) => (!b || Math.hypot(p.x - Y.x, p.z - Y.z) < Math.hypot(b.x - Y.x, b.z - Y.z) ? p : b), null) : SPOT.lanternFront; }
    if (!f.marshLantern) return SPOT.lanternFront;
    if (!f.marshLamps) { const i = st.lamps.findIndex(v => !v); return C.LAMPS[Math.max(0, i)]; }
    if (!f.marshFree) return SPOT.chapelDoor;
    return L ? { x: L.x, z: L.z } : SPOT.lucero;
  }
  // the way here: out of Alba's north gate, through the Old Quarter, the old north road's gate past the theater
  function wayIn() {
    const Y = G.sim.you, N = gateN();
    if (Y.z > -190) return { x: -10, z: -195 };
    if (Y.z > -228) return { x: -8, z: -229 };
    return { x: N.x, z: N.z + 2 };
  }

  // ---------------------------------------------------------------- every frame (story hooks): arrivals, a word to teach
  function tick(dt, Y) {
    if (!G || !B) return;
    const f = F(), st = S();
    curCool -= dt;
    if (!C.open(G.state)) return;
    // the gate (Bruno waiting there), the fog (Lucero's lantern), the boardwalk, Candil
    if (!f.marsh) { const N = gateN(); if (Math.hypot(Y.x - N.x, Y.z - N.z) < 7.5) { STORY.run(gateScene); return; } }
    if (f.marsh && !f.marshFog && !st.fogSeen && Math.hypot(Y.x - SPOT.fogFront.x, Y.z - SPOT.fogFront.z) < 7) { STORY.run(fogScene); return; }
    if (f.marshFog && !f.bwJump && !st.bwDemo && Math.hypot(Y.x - SPOT.bwStart.x, Y.z - SPOT.bwStart.z) < 4.5) { STORY.run(boardwalkScene); return; }
    if (f.bwJump && !f.candil && Math.hypot(Y.x - C.CANDIL.x, Y.z - C.CANDIL.z) < C.CANDIL.r + 1) { STORY.run(arriveCandil); return; }
    // a word Mimo's curious about here (seen, not taught yet): the fog, a shadow, the chapel
    if (curCool <= 0 && Y.speed < 6 && LEX.mayIntroduce && LEX.mayIntroduce()) {
      curCool = 4;
      for (const [id, at, need] of [['w.fog', SPOT.fogFront, !f.marshFog], ['w.chapel', SPOT.chapelDoor, f.marshLantern], ['w.shadow', C.LAMPS[1], f.marshLantern]]) {
        if (!need || !at || !LEX.item(id) || LEX.taught(id) || !LEX.seen(id) || Math.hypot(Y.x - at.x, Y.z - at.z) > 9) continue;
        curCool = 60; STORY.run(() => STORY.teachWord(id, { spot: { x: at.x + (Y.x - at.x) * 0.4, z: at.z + (Y.z - at.z) * 0.4 }, look: at })); return;
      }
    }
  }
  // the look of things follows the save: the gate, the fog banks, the gaps' planks, the pairs, the punt, the great lantern, the
  // stone lanterns, the color, Bruno and Lucero
  function sync() {
    if (!G || !B) return;
    const f = F(), st = S(), open = C.open(G.state);
    const key = [open, !!f.marsh, !!f.marshFog, !!f.bwJump, !!f.candil, Object.keys(st.told).sort().join(','), !!f.marshLantern, st.lamps.join(','), !!f.chapelOpen, !!f.marshFree, !!f.luceroEighth, G.state.lang].join('|');
    if (key === synced) return;
    const first = !synced;
    synced = key;
    if (B.objects.gate) B.objects.gate.set(!!f.marsh, first);
    B.setFog(B.objects.fogs.road, !f.marshFog, first);
    B.setFog(B.objects.fogs.cause, !f.marshLantern, first);
    B.setFog(B.objects.fogs.tower, !f.marshFree, first);
    B.objects.fogs.lamps.forEach((fg, i) => B.setFog(fg, !st.lamps[i], first));
    st.lamps.forEach((v, i) => B.setLamp(i, v));
    B.setGaps(!!f.bwJump);
    B.setPunt(!!st.told.twins, first);
    B.setLantern(!!f.marshLantern, first);
    for (const pair of C.PAIRS) for (const id of pair.who) { const p = person(id); if (!p) continue; const done = !!st.told[pair.id]; if (p.hushed === done || first) p.set(done ? 'idle' : pair.pose, !done); }
    if (f.marshFog) liftPatch('marshRoad', first);
    if (f.marshLantern) liftPatch('marshCandil', first);
    if (f.marshFree) { liftPatch('marshCause', first); liftPatch('marshTower', first); liftPatch('marshAll', first); }
    C.live.freed = f.marshFree ? 1 : 0;
    const L = luc();
    if (L) { const at = luceroSpot(); L.root.visible = open && !at.hidden; if (first || !STORY.busy) B.placeLucero(at, at.y); }
    if (open) { const at = brunoSpot(); if (at) placeBruno(at); }
  }

  // ---------------------------------------------------------------- the module's hooks
  function init(game) {
    G = game; B = game.marsh || null;
    C.registerWords();
    C.bindGame(game);
    if (B) {     // (the build's per-frame update gets the sync)
      const up0 = B.update;
      B.update = (dt, t, you) => { sync(); up0(dt, t, you); };
      if (WORLD.L.tower && (Math.abs(WORLD.L.tower.x - C.TOWER.x) > 0.5 || Math.abs(WORLD.L.tower.z - C.TOWER.z) > 0.5)) console.warn('[marsh] the Old Tower moved: marsh.js TOWER is', C.TOWER, 'world.js says', WORLD.L.tower);
    }
    if (STORY.extra) STORY.extra.push({ interactables, tick });
  }
  Object.assign(C, { init, interactables, target, wayIn, tick, sync, sayT, demo, person, luc, mimoShine, learnUse, liftPatch, allyOn, placeBruno, brunoSpot, luceroSpot,
    gateOpen: () => !!(G && F().marsh), gateBusy: () => !!(G && STORY.busy && C.open(G.state) && !F().marsh),
    _: { S, gateScene, fogScene, fogTell, boardwalkScene, bwTell, arriveCandil, pairTell, allAwake, lanternTell, lampTell, doorTell, reportScene, luceroTalk, brunoTalk, gapSides, hopYou } });
  Object.defineProperty(C, 'G', { get: () => G, configurable: true });
  Object.defineProperty(C, 'built', { get: () => B, configurable: true });
})();
