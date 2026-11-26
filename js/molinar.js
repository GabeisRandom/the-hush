'use strict';
// Molinar and the Windmill Hills (DESIGN.md 14.2), east of Alba along the road. The hills: five white
// windmills turning on the hilltops, golden wheat that sways in waves, a farm with sheep and hay, and
// Marga pushing her cart (where Mimo learns «empuja»), up to the narrow pass where the story's boulder
// sits. Then Molinar, a whitewashed market town of mills: the market square and its stalls (the first
// shops), Ciro the clockmaker, the inn, about 25 houses, and the Great Mill, hushed (gray and still)
// until setMillHushed(false).
// One global, MOLINAR, shaped like TOWN (town.js):
//   MOLINAR.layout, .landmarks, .pavedAt(x, z), .fieldAt(x, z), .bareAt(x, z), .keepClear(x, z, pad), .distTo(x, z):
//     plain data, ready before any scene (keepClear: where world.js's own trees, rocks and flowers shouldn't go)
//   MOLINAR.build(scene, { terrainAt }) → { colliders, platforms, moving (live colliders: Marga's cart), update(dt, t, you|null),
//     people, stalls, landmarks, group, objects, setMillHushed(on), millHushed, ringBell(sec), setFade(on), stats() }
// Static things are merged by material (vertex colors) with merged ink hulls, in two groups (the hills and the
// town); the sails, the wheat and everyone who moves are instanced, so the region costs a few dozen draw calls.
// Needs THREE (r128), core.js and toonkit.js.

const MOLINAR = (() => {
  const { G } = TK;
  const GY = 0.25;                                   // the ground is flat at this height in town (world.js flattens it)
  const CEN = { x: 215, z: -150 }, RAD = 42, FLAT_R = 38, BUILD_R = 37.6;
  const SQ = { x: 215, z: -150, r: 14 };             // the market square (paved out to the house fronts, SQ_R)
  const SQ_R = 15.8;
  const DEG = Math.PI / 180;
  const P = (x, z) => ({ x, z });
  const R0 = rng(5150);
  const pick = (a, R = R0) => a[Math.floor(R() * a.length) % a.length];

  // ------------------------------------------------------------ small helpers (as in town.js)
  function segDist(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
  }
  const polyDist = (pts, x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; };
  // oriented boxes { x, z, hw, hd, rot } (rot = the mesh's rotation.y, as in world.js pushOut)
  const toWorld = (b, lx, lz) => { const c = Math.cos(b.rot), s = Math.sin(b.rot); return [b.x + lx * c + lz * s, b.z - lx * s + lz * c]; };
  const corners = b => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => toWorld(b, a * b.hw, c * b.hd));
  function obbOverlap(a, b, pad = 0) {
    const A = corners({ ...a, hw: a.hw + pad, hd: a.hd + pad }), B = corners(b);
    for (const o of [a, b]) for (const ang of [o.rot, o.rot + Math.PI / 2]) {
      const ax = Math.cos(ang), az = -Math.sin(ang);
      const pa = A.map(([x, z]) => x * ax + z * az), pb = B.map(([x, z]) => x * ax + z * az);
      if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
    }
    return true;
  }
  const rect = (x0, z0, x1, z1) => ({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, hw: (x1 - x0) / 2, hd: (z1 - z0) / 2, rot: 0 });
  const local = (b, x, z) => { const c = Math.cos(b.rot || 0), s = Math.sin(b.rot || 0); return [(x - b.x) * c - (z - b.z) * s, (x - b.x) * s + (z - b.z) * c]; };
  const boxDist = (b, x, z) => { const [lx, lz] = local(b, x, z); return Math.max(Math.abs(lx) - b.hw, Math.abs(lz) - b.hd); };
  const circleHitsObb = (c, b) => { const [lx, lz] = local(b, c.x, c.z); return Math.hypot(lx - clamp(lx, -b.hw, b.hw), lz - clamp(lz, -b.hd, b.hd)) < c.r; };
  const ring = (deg, r) => [SQ.x + Math.cos(deg * DEG) * r, SQ.z + Math.sin(deg * DEG) * r];
  const toSquare = (x, z) => Math.atan2(SQ.x - x, SQ.z - z);      // the rot that turns a front (+z) to face the square
  const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();

  // ------------------------------------------------------------ the road (drawn by world.js; we only keep clear of it)
  const ROAD_PTS = [[34, -150], [60, -147], [88, -151], [112, -152], [134, -149], [150, -150], [166, -150], [173, -150]];
  function spline(pts, per = 6) {          // Catmull-Rom, as world.js smooths its paths
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  const ROAD = spline(ROAD_PTS);
  const roadDist = (x, z) => polyDist(ROAD, x, z);
  const roadZ = x => { for (let i = 0; i < ROAD.length - 1; i++) { const [ax, az] = ROAD[i], [bx, bz] = ROAD[i + 1]; if (x >= ax && x <= bx) return lerp(az, bz, (x - ax) / Math.max(1e-6, bx - ax)); } return x < ROAD[0][0] ? ROAD[0][1] : ROAD[ROAD.length - 1][1]; };

  // ------------------------------------------------------------ the Windmill Hills (pure data)
  const HILLS = { x0: 95, x1: 168, z0: -200, z1: -105 };
  // the bumps in the real terrain (world.js): h·(1−t²)², t = dist/r. The two by the pass squeeze the road.
  const BUMPS = [
    { x: 108, z: -122, r: 14, h: 3.5 }, { x: 126, z: -186, r: 16, h: 4 }, { x: 140, z: -116, r: 12, h: 3 },
    { x: 162, z: -192, r: 14, h: 3.5 }, { x: 100, z: -178, r: 12, h: 3 },
    { x: 150, z: -133, r: 12, h: 4.5, pass: true }, { x: 150, z: -167, r: 12, h: 4.5, pass: true },
  ];
  const BOULDER = { x: 150, z: -150, r: 4 };          // the story's boulder blocks the road here: nothing of ours inside
  // a windmill on every hilltop (not the pass), each turned to look down the road toward Alba
  const MILLS = BUMPS.filter(b => !b.pass).map((b, i) => {
    const tx = b.x - 18, tz = roadZ(tx);
    return { x: b.x, z: b.z, s: [1.0, 1.06, 0.95, 1.02, 0.92][i], yaw: Math.atan2(tx - b.x, tz - b.z), speed: [0.52, 0.44, 0.58, 0.48, 0.62][i], phase: i * 0.9 };
  });
  const FARM = {
    house: { x: 111, z: -173.4, w: 7.6, d: 5.6, rot: 0.06 },
    barn: { x: 131.4, z: -175.6, w: 8.6, d: 7.2, rot: -0.05 },
    pen: { x0: 97, x1: 107.6, z0: -167.6, z1: -158.2 },
    yard: { x: 121, z: -166.6, rx: 13.0, rz: 5.6 },
    track: { x0: 119.4, x1: 133.6, z: -160, w: 2.6, a: 122.6, b: 130.4 },      // Marga's cart's axle runs from a to b
  };
  // wheat fields (rotated rectangles), well off the road
  const FIELDS = [
    { id: 'south1', x: 105.4, z: -139.2, hw: 8.2, hd: 4.0, rot: 0.04 },
    { id: 'south2', x: 128.6, z: -137.2, hw: 7.8, hd: 4.8, rot: -0.06 },
    { id: 'north1', x: 141.4, z: -162.6, hw: 4.2, hd: 4.8, rot: 0.08 },
    { id: 'east1', x: 161.4, z: -160.6, hw: 4.4, hd: 3.4, rot: -0.04 },
    { id: 'east2', x: 162.6, z: -138.6, hw: 3.8, hd: 3.2, rot: 0.05 },        // (clear of where the pushed boulder comes to rest, 157.5, −145.2)
  ];
  const SCARECROW = { x: 127.4, z: -136.4 };
  // trodden paths: the farm lane, and up to the mills. (Playtest 4: they used to stop short of the road, square-ended strips in the
  // grass beside it; now they start on the road, and world.js paints them into the ground like the road and the forest trails.)
  const HPATHS = [
    { w: 2.2, pts: [[117.3, roadZ(117.3)], [117.4, -154.4], [118.2, -157.6], [119.6, -161.0]] },
    { w: 1.6, pts: [[95.9, roadZ(95.9)], [95.8, -147.4], [96.0, -138], [100.5, -129.4], [106.0, -124.8]] },
    { w: 1.6, pts: [[116.9, roadZ(116.9)], [117.0, -147.2], [117.2, -137], [122.6, -127.6], [133, -119.6], [137.4, -117.8]] },
    { w: 1.6, pts: [[121.6, -171.4], [122.6, -178], [124.6, -183.2]] },
    { w: 1.6, pts: [[106.0, -169.0], [103.4, -172.0], [101.8, -175.4]] },
  ];
  // (world.js draws the rocky ridge across the pass itself; these are just a few stones on the slopes)
  const HROCKS = [{ x: 120.4, z: -121.6, s: 0.7 }, { x: 102.6, z: -186.4, s: 0.85 }, { x: 134.6, z: -127.8, s: 0.6 }];
  const HTREES = [
    { kind: 'big', x: 117.6, z: -175.8, s: 0.95 }, { kind: 'poplar', x: 114.8, z: -157.4, s: 1 }, { kind: 'poplar', x: 115.0, z: -160.4, s: 0.95 },
    { kind: 'poplar', x: 121.6, z: -156.2, s: 1.05 }, { kind: 'olive', x: 112.6, z: -127.0, s: 1 }, { kind: 'olive', x: 130.8, z: -127.4, s: 0.9 },
    { kind: 'olive', x: 155.6, z: -128.4, s: 1.05 }, { kind: 'olive', x: 144.6, z: -177.2, s: 0.95 },
    { kind: 'olive', x: 112.6, z: -190.6, s: 1 }, { kind: 'cypress', x: 99.2, z: -168.6, s: 1.1 }, { kind: 'olive', x: 98.0, z: -133.6, s: 0.85 },
    { kind: 'round', x: 136.0, z: -186.0, s: 0.9 },
  ];
  const HIVES = [[110.8, -130.6], [112.4, -129.9], [114.0, -130.5]];
  const SIGNPOST = { x: 97.2, z: -146.2 };

  // ------------------------------------------------------------ Molinar (pure data)
  const STREETS = [
    { id: 'west', w: 5.2, pts: [[171.0, -150], [186, -150.4], [201.6, -150.1]] },
    { id: 'east', w: 4.6, pts: [[228.6, -149.6], [242, -148.6], [254.6, -147.2]] },
    { id: 'north', w: 4.6, pts: [[215.2, -163.6], [214.4, -177], [215.6, -190.8]] },
    { id: 'south', w: 4.6, pts: [[215.0, -136.4], [215.3, -124], [213.8, -111.6]] },
    { id: 'mill', w: 4.8, pts: [[226.6, -157.6], [233.4, -161.8], [239.4, -164.6]] },
    { id: 'laneSW', w: 3.2, pts: [[190.6, -150.2], [192.2, -138], [197.2, -126], [205.2, -119.4], [213.2, -118.6]], lane: 1 },
    { id: 'laneNW', w: 3.2, pts: [[192.6, -150.3], [197.4, -162], [206, -172.6], [214.2, -174.4]], lane: 1 },
    { id: 'laneSE', w: 3.2, pts: [[215.6, -127.2], [227, -128.2], [236.6, -136.6], [242.2, -148.4]], lane: 1 },
  ];
  const streetDist = (x, z) => { let d = 1e9; for (const s of STREETS) d = Math.min(d, polyDist(s.pts, x, z) - s.w / 2); return d; };
  // the Great Mill: on a square stone plinth NE of the square; its door looks south, its sails at the square
  const GM = { x: 240, z: -176, half: 7.2, step: 7.8, towerR: 5.6, yaw: Math.atan2(SQ.x - 240, SQ.z + 176) };
  GM.fwd = [Math.sin(GM.yaw), Math.cos(GM.yaw)];
  GM.door = { x: GM.x, z: GM.z + GM.half + 0.1, yaw: 0 };                 // where you stand to enter (on the plinth's south edge)
  // the clockmaker's shop: tall and narrow, set back from the square with its own doorstep
  const CLOCK = { kind: 'clock', x: 204, z: -131, w: 6.2, d: 6.4, floors: 3 };
  CLOCK.rot = toSquare(CLOCK.x, CLOCK.z);
  { const f = [Math.sin(CLOCK.rot), Math.cos(CLOCK.rot)]; CLOCK.door = { x: CLOCK.x + f[0] * (CLOCK.d / 2 + 1.0), z: CLOCK.z + f[1] * (CLOCK.d / 2 + 1.0) }; CLOCK.fwd = f; }
  const atRing = (a, w, d) => { const [x, z] = ring(a, SQ_R + d / 2 + 0.08); return { x, z, rot: toSquare(x, z), a }; };
  const INN = { kind: 'inn', ...atRing(228, 10, 7.2), w: 10, d: 7.2, floors: 2 };
  const BAKERY = { kind: 'bakery', ...atRing(295, 8.2, 6.4), w: 8.2, d: 6.4, floors: 2 };
  const MILLHOUSES = [{ kind: 'millhouse', x: 193.6, z: -170.8, r: 2.3 }, { kind: 'millhouse', x: 237.8, z: -131.0, r: 2.3 }]
    .map(m => ({ ...m, w: 4.6, d: 4.6, rot: 0, yaw: Math.atan2(m.x - CEN.x, m.z - CEN.z) }));    // their sails look out of town
  const RING_HOUSES = [
    { a: 21.8, w: 6.6, d: 6.0, floors: 2, style: 'timber' }, { a: 45.3, w: 5.6, d: 5.6, floors: 1, style: 'cottage' },
    { a: 68.4, w: 6.4, d: 6.0, floors: 2, style: 'arcade' }, { a: 143, w: 6.6, d: 5.8, floors: 2, style: 'timber' },
    { a: 200, w: 5.0, d: 5.8, floors: 2, style: 'arcade' },
  ].map(h => ({ kind: 'house', ...atRing(h.a, h.w, h.d), ...h, ring: true }));
  const FIXED = [CLOCK, INN, BAKERY, ...MILLHOUSES];
  // the market stalls: a ring around the well, facing it; keepers stand behind (the shop system attaches here)
  const STALL_DEF = [
    { id: 'hats', a: 30, keeper: 'rita', awn: ['#3f6fb5', '#fff4e4'] }, { id: 'cheese', a: 60, keeper: 'ines', awn: ['#e6a23a', '#fff4e4'] },
    { id: 'fruit', a: 150, keeper: 'lupe', awn: ['#d9443a', '#fff4e4'] }, { id: 'sweets', a: 210, keeper: 'paco', awn: ['#e86a9a', '#fff4e4'] },
    { id: 'gray', a: 244, keeper: 'gil', awn: ['#8f8c88', '#d6d4d0'], hushed: true }, { id: 'bakery', a: 296, keeper: 'tomas', awn: ['#d0663f', '#fff4e4'] },
  ];
  const STALLS = STALL_DEF.map(s => { const [x, z] = ring(s.a, 9.4); return { ...s, x, z, rot: toSquare(x, z), w: 3, d: 1.4 }; });
  const SAIL_BOX = { x: GM.x + GM.fwd[0] * 5.6, z: GM.z + GM.fwd[1] * 5.6, hw: 10.6, hd: 1.8, rot: GM.yaw };   // where the Great Mill's sails sweep
  const PAVED = [
    { x: SQ.x, z: SQ.z, r: SQ_R, kind: 'square' }, { x: 175.4, z: -150, r: 3.6, kind: 'flag' },
    { x: GM.x, z: GM.z + GM.step + 3.0, r: 4.8, kind: 'flag' }, { x: CLOCK.door.x, z: CLOCK.door.z, r: 2.7, kind: 'flag' },
  ];
  const RESERVED = [
    { c: 1, x: SQ.x, z: SQ.z, r: SQ_R + 0.6 }, { c: 1, x: 173.5, z: -150, r: 5.2 }, { c: 1, x: GM.x, z: GM.z + GM.step + 3.0, r: 5.4 },
    { c: 1, x: CLOCK.door.x, z: CLOCK.door.z, r: 2.9 }, rect(GM.x - GM.step - 0.8, GM.z - GM.step - 0.8, GM.x + GM.step + 0.8, GM.z + GM.step + 0.8), SAIL_BOX,
    ...MILLHOUSES.map(m => ({ c: 1, x: m.x, z: m.z, r: 3.4 })),
    ...MILLHOUSES.map(m => ({ x: m.x + Math.sin(m.yaw) * 2.9, z: m.z + Math.cos(m.yaw) * 2.9, hw: 3.9, hd: 1.0, rot: m.yaw })),
    { c: 1, x: 254.6, z: -147.2, r: 3.4 }, { c: 1, x: 215.6, z: -190.8, r: 3.2 }, { c: 1, x: 213.8, z: -111.6, r: 3.2 },
  ];
  const WALLS = ['#fbf7ee', '#f8f3e8', '#fdfbf5', '#f6f0e4'];
  const BANDS = ['#3f6fb5', '#d9a03a', '#c0563c', '#4f8a4a', '#5a86b8', '#c98a2e', '#3f6fb5'];
  const ROOFS = ['#c9643f', '#d27445', '#b85a3a', '#e08a4a', '#c45a3c', '#d9824e', '#bf6a44'];
  const DOORS = ['#8d5733', '#6b4a33', '#3f6fb5', '#4f7f4a', '#a05a32', '#2f6f6a'];
  const SHUTTERS = ['#4f7f4a', '#3f6fb5', '#8a5a36', '#2f6f6a', '#b84a3a', '#c98a2e'];
  const HOUSES = RING_HOUSES.map((h, i) => {
    const R = rng(300 + i);
    return { ...h, seed: R(), wall: pick(WALLS, R), band: pick(BANDS, R), roof: pick(ROOFS, R), door: pick(DOORS, R), shutter: pick(SHUTTERS, R), street: 'square' };
  });
  const allBuildings = () => FIXED.concat(HOUSES);
  function fits(b) {
    for (const [x, z] of corners(b)) if (Math.hypot(x - CEN.x, z - CEN.z) > BUILD_R) return false;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const [x, z] = toWorld(b, (i / 2) * b.hw, (j / 2) * b.hd); if (streetDist(x, z) < 0.5) return false; }
    for (const r of RESERVED) if (r.c ? circleHitsObb(r, b) : obbOverlap(b, r)) return false;
    for (const o of allBuildings()) if (obbOverlap(b, { x: o.x, z: o.z, hw: o.w / 2, hd: o.d / 2, rot: o.rot || 0 }, 0.8)) return false;
    return true;
  }
  const PATHS = [];   // footpaths from houses set back from the street
  function nearestStreet(x, z) {
    let best = { d: 1e9 };
    for (const s of STREETS) for (let i = 0; i < s.pts.length - 1; i++) {
      const [ax, az] = s.pts[i], [bx, bz] = s.pts[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
      const t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0.02, 0.98), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz) - s.w / 2;
      if (d < best.d) best = { d, x: px, z: pz, s };
    }
    return best;
  }
  const blockedAt = (x, z, r) => allBuildings().some(o => circleHitsObb({ x, z, r }, { x: o.x, z: o.z, hw: o.w / 2, hd: o.d / 2, rot: o.rot || 0 }))
    || RESERVED.some(q => q.c ? Math.hypot(x - q.x, z - q.z) < q.r * 0.85 : circleHitsObb({ x, z, r: r * 0.5 }, q));
  const HOUSE_MAX = 25;
  function newHouse(R, b, street, o = {}) {
    const two = o.two !== undefined ? o.two : R() < 0.5;
    return { kind: 'house', x: b.x, z: b.z, w: b.hw * 2, d: b.hd * 2, rot: b.rot, floors: two ? 2 : 1, street, seed: R(),
      wall: pick(WALLS, R), band: pick(BANDS, R), roof: pick(ROOFS, R), door: pick(DOORS, R), shutter: pick(SHUTTERS, R),
      style: two ? (R() < 0.55 ? 'timber' : 'arcade') : 'cottage' };
  }
  function fillStreet(s, side, setback, R) {
    const pts = s.pts;
    for (let i = 0; i < pts.length - 1 && HOUSES.length < HOUSE_MAX; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      const nx = -uz * side, nz = ux * side, rot = Math.atan2(-nx, -nz);
      let s0 = 0.5;
      while (s0 < L - 2.5 && HOUSES.length < HOUSE_MAX) {
        let ok = false;
        for (let tries = 0; tries < 3 && !ok; tries++) {
          const w = (s.lane ? 4.6 : 5.2) + R() * (tries ? 0.8 : 2.2), d = 4.4 + R() * (s.lane ? 0.8 : 1.4), off = s.w / 2 + setback + d / 2 + R() * 0.3;
          const b = { x: ax + ux * (s0 + w / 2) + nx * off, z: az + uz * (s0 + w / 2) + nz * off, hw: w / 2, hd: d / 2, rot };
          if (fits(b)) { HOUSES.push(newHouse(R, b, s.id, { two: !s.lane && R() < 0.6 ? true : s.lane ? R() < 0.25 : false })); s0 += w + 1.0 + R() * 1.6; ok = true; }
        }
        if (!ok) s0 += 1.1;
      }
    }
  }
  {
    const R = rng(77);
    const order = [['west', 1.0], ['east', 1.0], ['north', 1.0], ['south', 1.0], ['mill', 1.2], ['laneSW', 0.8], ['laneNW', 0.8], ['laneSE', 0.8]];
    for (const [id, setback] of order) { const s = STREETS.find(q => q.id === id); fillStreet(s, 1, setback, R); fillStreet(s, -1, setback, R); }
    // then a few in the gaps, each facing its nearest street, with a footpath to its door
    for (let n = 0; n < 4000 && HOUSES.length < HOUSE_MAX; n++) {
      const a = R() * TAU, r = 16 + Math.sqrt(R()) * 21, x = CEN.x + Math.cos(a) * r, z = CEN.z + Math.sin(a) * r;
      const np = nearestStreet(x, z);
      if (np.d < 2.5 || np.d > 11) continue;
      const w = 4.6 + R() * 1.8, d = 4.4 + R() * 1.0, rot = Math.atan2(np.x - x, np.z - z);
      const b = { x, z, hw: w / 2, hd: d / 2, rot };
      if (!fits(b)) continue;
      const [dx, dz] = toWorld(b, 0, d / 2 + 0.55), L = Math.hypot(np.x - dx, np.z - dz);
      let clear = true;
      for (let t = 0.6; t < L - 0.5 && clear; t += 0.6) if (blockedAt(dx + (np.x - dx) * t / L, dz + (np.z - dz) * t / L, 0.75)) clear = false;
      if (!clear) continue;
      HOUSES.push(newHouse(R, b, 'infill', { two: R() < 0.35 }));
      PATHS.push([[dx, dz], [np.x, np.z]]);
    }
  }

  // ------------------------------------------------------------ masks for world.js: streets and squares, the wheat, anything bare
  const ellipseDist = (e, x, z) => (Math.hypot((x - e.x) / e.rx, (z - e.z) / e.rz) - 1) * Math.min(e.rx, e.rz);
  const TRACK_BOX = { x: (FARM.track.x0 + FARM.track.x1) / 2, z: FARM.track.z, hw: (FARM.track.x1 - FARM.track.x0) / 2, hd: FARM.track.w / 2, rot: 0 };
  function pavedAt(x, z) {
    let a = 0;
    if (Math.hypot(x - CEN.x, z - CEN.z) < RAD + 4) {
      for (const s of STREETS) a = Math.max(a, 1 - smoothstep(s.w / 2 - 0.25, s.w / 2 + 0.35, polyDist(s.pts, x, z)));
      for (const c of PAVED) a = Math.max(a, 1 - smoothstep(c.r - 0.25, c.r + 0.35, Math.hypot(x - c.x, z - c.z)));
      for (const [[ax, az], [bx, bz]] of PATHS) a = Math.max(a, 1 - smoothstep(0.55, 0.95, segDist(x, z, ax, az, bx, bz)));
      if (Math.abs(x - GM.x) < GM.step + 0.2 && Math.abs(z - GM.z) < GM.step + 0.2) a = 1;
    }
    if (x > HILLS.x0 - 4 && x < HILLS.x1 + 4 && z > HILLS.z0 - 4 && z < HILLS.z1 + 4) {
      a = Math.max(a, 1 - smoothstep(-0.3, 0.3, ellipseDist(FARM.yard, x, z)), 1 - smoothstep(-0.2, 0.3, boxDist(TRACK_BOX, x, z)));
      for (const p of HPATHS) a = Math.max(a, 1 - smoothstep(p.w / 2 - 0.25, p.w / 2 + 0.3, polyDist(p.pts, x, z)));
      for (const m of MILLS) a = Math.max(a, 1 - smoothstep(3.0 * m.s, 3.8 * m.s, Math.hypot(x - m.x, z - m.z)));
    }
    return a;
  }
  function fieldAt(x, z) {
    let a = 0;
    for (const f of FIELDS) a = Math.max(a, 1 - smoothstep(-0.2, 0.6, boxDist(f, x, z)));
    return a;
  }
  const HILL_BUILDINGS = [FARM.house, FARM.barn].map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d, rot: b.rot }));
  function bareAt(x, z) {        // paved, wheat, or inside a building or stall: no grass here
    let a = Math.max(pavedAt(x, z), fieldAt(x, z));
    if (a >= 1) return 1;
    const inB = b => boxDist({ x: b.x, z: b.z, hw: b.w / 2 + 0.5, hd: b.d / 2 + 0.5, rot: b.rot || 0 }, x, z) < 0;
    if (Math.hypot(x - CEN.x, z - CEN.z) < RAD + 2) {
      for (const b of FIXED.concat(HOUSES)) if (inB(b)) return 1;
      for (const s of STALLS) if (inB(s)) return 1;
    }
    for (const b of HILL_BUILDINGS) if (inB(b)) return 1;
    for (const m of MILLS) if (Math.hypot(x - m.x, z - m.z) < 2.6 * m.s) return 1;
    return a;
  }
  // Where world.js's own scatter (meadow and wall trees, rocks, flowers) should not go: the town, the Great Mill, the
  // fields and their fences, the farm, the mills and their tail poles, paths, and our own trees, hives and signs.
  // Pure data, so world.js can ask before anything is built.
  const KEEP = [
    { x: FARM.yard.x, z: FARM.yard.z - 1.6, r: 15.2 }, { box: { x: (FARM.pen.x0 + FARM.pen.x1) / 2, z: (FARM.pen.z0 + FARM.pen.z1) / 2, hw: 6.6, hd: 5.6, rot: 0 } },
    { x: 140.2, z: -173.2, r: 4.0 }, { x: 125.4, z: -170.2, r: 2.4 },                 // haystacks, bales
    ...MILLS.flatMap(m => [{ x: m.x, z: m.z, r: 4.4 * m.s }, { x: m.x - Math.sin(m.yaw) * 4.6 * m.s, z: m.z - Math.cos(m.yaw) * 4.6 * m.s, r: 2.6 * m.s }]),
    ...HTREES.map(t => ({ x: t.x, z: t.z, r: t.kind === 'big' ? 3.2 : 2.4 })), ...HIVES.map(([x, z]) => ({ x, z, r: 1.6 })),
    { x: SIGNPOST.x, z: SIGNPOST.z, r: 1.4 }, { x: SCARECROW.x, z: SCARECROW.z, r: 1.2 }, ...HROCKS.map(r => ({ x: r.x, z: r.z, r: 1.6 })),
  ];
  function keepClear(x, z, pad = 0) {
    if (x < HILLS.x0 - 12) return false;
    if (Math.hypot(x - CEN.x, z - CEN.z) < RAD + 3 + pad) return true;
    if (Math.abs(x - GM.x) < GM.step + 3 + pad && Math.abs(z - GM.z) < GM.step + 3 + pad) return true;
    for (const f of FIELDS) if (boxDist(f, x, z) < 1.3 + pad) return true;
    for (const k of KEEP) if (k.box ? boxDist(k.box, x, z) < pad : Math.hypot(x - k.x, z - k.z) < k.r + pad) return true;
    return pavedAt(x, z) > 0.05;
  }
  // how far (x, z) is from the region (0 inside the hills or the town): for showing and hiding it
  function distTo(x, z) {
    const dx = Math.max(HILLS.x0 - x, 0, x - HILLS.x1), dz = Math.max(HILLS.z0 - z, 0, z - HILLS.z1);
    return Math.min(Math.hypot(dx, dz), Math.max(0, Math.hypot(x - CEN.x, z - CEN.z) - RAD));
  }
  const LAYOUT = {
    center: CEN, radius: RAD, flat: FLAT_R, ground: GY, square: { ...SQ, paved: SQ_R }, streets: STREETS, paved: PAVED, paths: PATHS,
    buildings: FIXED.concat(HOUSES).map(b => ({ kind: b.kind, x: b.x, z: b.z, w: b.w, d: b.d, rot: b.rot || 0 })).concat(HILL_BUILDINGS.map((b, i) => ({ kind: i ? 'barn' : 'farmhouse', ...b }))),
    stalls: STALLS.map(s => ({ id: s.id, x: s.x, z: s.z, w: s.w, d: s.d, rot: s.rot })),
    greatMill: { x: GM.x, z: GM.z, half: GM.step, flatten: { x: GM.x, z: GM.z, r: 12 } },
    hills: HILLS, bumps: BUMPS, road: ROAD_PTS, boulder: BOULDER, mills: MILLS.map(m => ({ x: m.x, z: m.z, r: 2.4 * m.s, yaw: m.yaw })),
    fields: FIELDS, farm: FARM, hillPaths: HPATHS, houses: HOUSES.length,
  };

  // ------------------------------------------------------------ landmarks (where things are: story spots, camera targets)
  const LM = {
    hills: P(131, -150), pass: P(150, -150), boulder: P(BOULDER.x, BOULDER.z), signpost: P(SIGNPOST.x, SIGNPOST.z),
    farm: P(FARM.yard.x, FARM.yard.z), farmhouse: P(111.3, -169.6), barn: P(131.2, -171.0), pen: P((FARM.pen.x0 + FARM.pen.x1) / 2, (FARM.pen.z0 + FARM.pen.z1) / 2),
    cart: P((FARM.track.a + FARM.track.b) / 2, FARM.track.z), track: { x0: FARM.track.a, x1: FARM.track.b, z: FARM.track.z },
    farmerWatch: P(126.5, -154.6),                     // a spot by the road with a good view of Marga pushing her cart
    town: P(CEN.x, CEN.z), gate: P(173, -150), square: P(SQ.x, SQ.z), well: P(SQ.x, SQ.z),
    clockmaker: P(+CLOCK.door.x.toFixed(2), +CLOCK.door.z.toFixed(2)), ciro: P(+(CLOCK.door.x + CLOCK.fwd[0] * 0.1).toFixed(2), +(CLOCK.door.z + CLOCK.fwd[1] * 0.1).toFixed(2)),
    inn: P(+(INN.x + Math.sin(INN.rot) * (INN.d / 2 + 1.1)).toFixed(2), +(INN.z + Math.cos(INN.rot) * (INN.d / 2 + 1.1)).toFixed(2)),
    bakery: P(+(BAKERY.x + Math.sin(BAKERY.rot) * (BAKERY.d / 2 + 1.1)).toFixed(2), +(BAKERY.z + Math.cos(BAKERY.rot) * (BAKERY.d / 2 + 1.1)).toFixed(2)),
    greatMill: P(GM.x, GM.z), mill: P(GM.x, GM.z), millDoor: P(GM.door.x, +GM.door.z.toFixed(2)), millForecourt: P(GM.x, GM.z + GM.step + 3.0),
    eastGate: P(254.6, -147.2), northGate: P(215.6, -190.8), southGate: P(213.8, -111.6),
    mills: MILLS.map(m => P(m.x, m.z)), fields: FIELDS.map(f => P(f.x, f.z)),
  };

  // ------------------------------------------------------------ materials: the toon look of town.js (rim light, a dithered
  // fade for walls between the camera and you), plus the Great Mill's hush (its colors drain while aHush × uHush > 0)
  const U = { uTime: { value: 0 }, uFocus: { value: new THREE.Vector3(0, -1e4, 0) }, uFade: { value: 1 }, uHush: { value: 1 }, uYou: { value: new THREE.Vector3(0, -1e4, 0) } };
  function patch(o) {
    return sh => {
      const CC = o.fade && TK.camCut;        // (a house the camera's inside goes all at once: its windows, frames, doors too)
      Object.assign(sh.uniforms, U, CC ? CC.U : {}, { rimAmt: { value: o.rim || 0 } });
      let vs = 'uniform float uTime;\nvarying vec3 vWP;\n' + (o.sway ? 'attribute float aSway;\n' : '') + (o.hush ? 'attribute float aHush;\nvarying float vHush;\n' : '') + sh.vertexShader;
      if (o.sway) vs = vs.replace('#include <begin_vertex>', `#include <begin_vertex>
        { float ph = position.x * 0.35 + position.z * 0.27;
          transformed.x += sin(uTime * 1.5 + ph) * 0.11 * aSway;
          transformed.z += sin(uTime * 1.1 + ph * 1.7) * 0.08 * aSway; }`);
      if (o.hush) vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\nvHush = aHush;');
      if (o.off) vs = vs.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${TK.fl(o.off)};`);
      vs = vs.replace('#include <project_vertex>', `#include <project_vertex>
        #ifdef USE_INSTANCING
          vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
      sh.vertexShader = vs;
      let fs = 'uniform vec3 uFocus;\nuniform float uFade;\nuniform float uHush;\nuniform float rimAmt;\nvarying vec3 vWP;\n' + (o.hush ? 'varying float vHush;\n' : '') + (CC ? CC.decl : '') + sh.fragmentShader;
      if (o.fade) fs = fs.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        ${CC ? CC.test : ''}
        { // the camera, from viewMatrix: three r128 sends cameraPosition only to lit materials, so the ink hulls (basic) never faded
          vec3 camW = -vec3(dot(viewMatrix[0].xyz, viewMatrix[3].xyz), dot(viewMatrix[1].xyz, viewMatrix[3].xyz), dot(viewMatrix[2].xyz, viewMatrix[3].xyz));
          vec3 seg = uFocus - camW; float segL = max(length(seg), 0.001); vec3 dir = seg / segL;
          vec3 rel = vWP - camW; float along = dot(rel, dir); float axis = length(rel - dir * along);
          float occl = step(0.0, along) * step(along, segL - 0.9) * (1.0 - smoothstep(1.3, 2.7, axis)) * smoothstep(0.4, 1.2, vWP.y - uFocus.y + 1.5);
          float nearCam = 1.0 - smoothstep(1.5, 3.4, length(rel));
          if (uFade > 0.5 && nearCam > 0.8) discard;      // (all the way gone right by the camera: a few leftover dots read as specks)
          float fadeAmt = uFade * max(occl * 0.9, nearCam);
          if (fadeAmt > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < fadeAmt) discard; }`);
      if (o.rim) fs = fs.replace('#include <tonemapping_fragment>', 'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\ngl_FragColor.rgb += vec3(1.0, 0.95, 0.82) * rimAmt * smoothstep(0.6, 0.95, rimF);\n#include <tonemapping_fragment>');
      if (o.hush) fs = fs.replace('#include <tonemapping_fragment>', `{ float hk = vHush * uHush; float lum = dot(gl_FragColor.rgb, vec3(0.3, 0.55, 0.15));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(lum) * vec3(0.92, 0.93, 0.99), hk * 0.9); }
        #include <tonemapping_fragment>`);
      sh.fragmentShader = fs;
    };
  }
  const MATS = {};
  function toonM(o = {}) {
    const k = 't' + JSON.stringify(o);
    if (MATS[k]) return MATS[k];
    const m = new THREE.MeshToonMaterial({ color: o.color || '#ffffff', gradientMap: TK.grad, vertexColors: !!o.vc, map: o.map || null,
      emissive: new THREE.Color(o.emissive || '#000000'), transparent: !!o.opacity, opacity: o.opacity || 1, side: o.side || THREE.FrontSide });
    if (o.poly) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -o.poly; }
    m.onBeforeCompile = patch(o); m.customProgramCacheKey = () => 'mol' + k;
    return (MATS[k] = m);
  }
  function inkM(o = {}) {
    const k = 'i' + JSON.stringify(o);
    if (MATS[k]) return MATS[k];
    const m = new THREE.MeshBasicMaterial({ color: '#2b2235', side: THREE.BackSide });
    m.onBeforeCompile = patch(o); m.customProgramCacheKey = () => 'mol' + k;
    return (MATS[k] = m);
  }
  // the wheat: unlit vertex colors, swaying in waves that roll across the fields (brighter where the wind bends it), parting around you
  function wheatMat() {
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      sh.uniforms.uTime = U.uTime; sh.uniforms.uYou = U.uYou;
      sh.vertexShader = 'uniform float uTime;\nuniform vec3 uYou;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        {
          vec3 o = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float k = clamp(position.y, 0.0, 1.25), bend = k * k;
          float gust = 0.5 + 0.5 * sin(uTime * 1.25 - dot(o.xz, vec2(0.34, 0.14)));
          float flick = sin(uTime * 3.3 + o.x * 2.1 + o.z * 1.7);
          transformed.xz += vec2(0.92, 0.38) * (0.05 + 0.2 * gust + 0.03 * flick) * bend;
          transformed.y -= 0.07 * gust * bend;
          vec2 aw = o.xz - uYou.xz; float d = length(aw);
          float push = (1.0 - smoothstep(0.3, 1.25, d)) * (1.0 - step(1.8, abs(uYou.y - o.y)));
          transformed.xz += normalize(aw + 1e-4) * push * 0.6 * bend;
          transformed.y -= push * 0.32 * bend;
          vColor.rgb *= 0.86 + 0.3 * gust * k + 0.04 * flick;
        }`);
    };
    m.customProgramCacheKey = () => 'mol-wheat';
    return m;
  }

  // ------------------------------------------------------------ pieces → merged geometry, and its ink hull (as in town.js)
  const NI = new Map(), BBX = new Map();
  const ni = g => { let r = NI.get(g); if (!r) { r = g.index ? g.toNonIndexed() : g; NI.set(g, r); } return r; };
  const bbOf = g => { let r = BBX.get(g); if (!r) { g.computeBoundingBox(); r = { size: g.boundingBox.getSize(new THREE.Vector3()), ctr: g.boundingBox.getCenter(new THREE.Vector3()) }; BBX.set(g, r); } return r; };
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _c = new THREE.Color(), _m3 = new THREE.Matrix3();
  function hullMatrix(geo, m, ink) {
    const { size, ctr } = bbOf(geo); m.decompose(_p, _q, _s);
    const f = ['x', 'y', 'z'].map(k => { const L = Math.abs(size[k] * _s[k]); return L > 1e-4 ? (L + 2 * ink) / L : 1; });
    return m.clone().multiply(new THREE.Matrix4().makeTranslation(ctr.x, ctr.y, ctr.z)).multiply(new THREE.Matrix4().makeScale(f[0], f[1], f[2]))
      .multiply(new THREE.Matrix4().makeTranslation(-ctr.x, -ctr.y, -ctr.z));
  }
  // o: { hull, uv (planar world uv scale) }
  function bake(pieces, o = {}) {
    const list = o.hull ? pieces.filter(p => p.ink > 0) : pieces;
    let n = 0; for (const p of list) n += ni(p.geo).attributes.position.count;
    const pos = new Float32Array(n * 3), nor = o.hull ? null : new Float32Array(n * 3), col = o.hull ? null : new Float32Array(n * 3);
    const uv = o.uv ? new Float32Array(n * 2) : null, sw = list.some(p => p.sway) ? new Float32Array(n) : null, hu = !o.hull && list.some(p => p.hush) ? new Float32Array(n) : null;
    let at = 0;
    for (const p of list) {
      const g = ni(p.geo), PA = g.attributes.position, NA = g.attributes.normal, cnt = PA.count;
      const m = o.hull ? hullMatrix(p.geo, p.m, p.ink) : p.m;
      if (!o.hull) { _m3.getNormalMatrix(m); _c.set(p.color); }
      for (let i = 0; i < cnt; i++) {
        const j = at + i;
        _v.fromBufferAttribute(PA, i).applyMatrix4(m); pos[j * 3] = _v.x; pos[j * 3 + 1] = _v.y; pos[j * 3 + 2] = _v.z;
        if (uv) { uv[j * 2] = _v.x * o.uv; uv[j * 2 + 1] = _v.z * o.uv; }
        if (sw && p.sway) { const S = p.sway, k = clamp((_v.y - S.y0) / (S.y1 - S.y0), 0, 1); sw[j] = S.k * k * Math.sqrt(k); }
        if (hu && p.hush) hu[j] = 1;
        if (!o.hull) {
          _v.fromBufferAttribute(NA, i).applyMatrix3(_m3).normalize(); nor[j * 3] = _v.x; nor[j * 3 + 1] = _v.y; nor[j * 3 + 2] = _v.z;
          col[j * 3] = _c.r; col[j * 3 + 1] = _c.g; col[j * 3 + 2] = _c.b;
        }
      }
      at += cnt;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    if (nor) { geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
    else geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    if (sw) geo.setAttribute('aSway', new THREE.BufferAttribute(sw, 1));
    if (hu) geo.setAttribute('aHush', new THREE.BufferAttribute(hu, 1));
    geo.computeBoundingSphere();
    return geo;
  }

  // ------------------------------------------------------------ the drawing kit (town.js's), with a hush flag and raw (world-space) pieces
  const GEO = {
    box: G.box, cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
    cyl16: new THREE.CylinderGeometry(1, 1, 1, 16), cyl20: new THREE.CylinderGeometry(1, 1, 1, 20), ball: new THREE.SphereGeometry(1, 12, 8), ball6: new THREE.SphereGeometry(1, 8, 6), ball5: new THREE.SphereGeometry(1, 7, 5),
    ico0: G.ico0, ico1: G.ico1, taper: new THREE.CylinderGeometry(0.82, 1, 1, 16), taper20: new THREE.CylinderGeometry(0.8, 1, 1, 22),
    cone4: (() => { const g = new THREE.ConeGeometry(1, 1, 4); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); return g; })(),
    cone: new THREE.ConeGeometry(1, 1, 10), cone6: new THREE.ConeGeometry(1, 1, 6), cone16: new THREE.ConeGeometry(1, 1, 16),
    disc: (() => { const g = new THREE.CircleGeometry(1, 28); g.rotateX(-Math.PI / 2); return g; })(),
    disc64: (() => { const g = new THREE.CircleGeometry(1, 64); g.rotateX(-Math.PI / 2); return g; })(),
    ring: (r0) => { const g = new THREE.RingGeometry(r0, 1, 64, 1); g.rotateX(-Math.PI / 2); return g; },
    half: new THREE.SphereGeometry(1, 14, 6, 0, TAU, 0, Math.PI / 2),
    prism: (() => {
      const a = [-0.5, 0, -0.5], b = [-0.5, 0, 0.5], c = [-0.5, 1, 0], d = [0.5, 0, -0.5], e = [0.5, 0, 0.5], f = [0.5, 1, 0];
      const tris = [a, b, c, d, f, e, a, d, e, a, e, b, b, e, f, b, f, c, a, c, f, a, f, d];
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3)); g.computeVertexNormals(); return g;
    })(),
    torus: new THREE.TorusGeometry(1, 0.22, 6, 16),
    arch: new THREE.TorusGeometry(1, 0.13, 6, 18, Math.PI),
    halfDisc: new THREE.CylinderGeometry(1, 1, 1, 10, 1, false, -Math.PI / 2, Math.PI),
  };
  const RINGS = new Map();
  const ringGeo = r0 => { const k = r0.toFixed(3); if (!RINGS.has(k)) RINGS.set(k, GEO.ring(r0)); return RINGS.get(k); };
  function Kit() {
    const B = { solid: [], sway: [], flag: [], earth: [] };
    let F = new THREE.Matrix4(), FY = 0;
    const autoInk = (geo, sx, sy, sz) => { const { size } = bbOf(geo); const dims = [size.x * sx, size.y * sy, size.z * sz].filter(v => v > 1e-3); return clamp(Math.min(...dims) * 0.1, 0.007, 0.026); };
    const k = {
      B, rot: 0, hush: 0,
      frame(x, y, z, rot = 0) { F = new THREE.Matrix4().makeRotationY(rot).setPosition(x, y, z); FY = y; k.rot = rot; return k; },
      world(x, y, z) { return new THREE.Vector3(x, y, z).applyMatrix4(F); },
      add(geo, x, y, z, sx, sy, sz, color, o = {}) {
        const m = F.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ')), new THREE.Vector3(sx, sy, sz)));
        const b = o.b || 'solid';
        const ink = b === 'solid' || b === 'sway' ? (o.ink === undefined ? autoInk(geo, sx, sy, sz) : o.ink) : 0;
        B[b].push({ geo, m, color, ink, hush: k.hush, sway: o.sway ? { y0: FY + o.sway.y0, y1: FY + o.sway.y1, k: o.sway.k } : null });
        return k;
      },
      raw(geo, color, b = 'earth') { B[b].push({ geo, m: new THREE.Matrix4(), color, ink: 0, hush: 0, sway: null }); return k; },
      box(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y, z, w, h, d, color, o); },
      post(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y + h / 2, z, w, h, d, color, o); },
      cyl(x, y, z, r, h, color, o = {}) { return k.add(o.geo || GEO.cyl, x, y + h / 2, z, r, h, r, color, o); },
      ball(x, y, z, r, color, o = {}) { return k.add(o.geo || GEO.ball, x, y, z, r, o.ry2 || r, o.rz2 || r, color, o); },
      beam(x1, y1, z1, x2, y2, z2, t, color, o = {}) {
        const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, L = Math.hypot(dx, dy, dz);
        const m = F.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2),
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L)), new THREE.Vector3(t, L, o.t2 || t)));
        const b = o.b || 'solid';
        B[b].push({ geo: o.geo || GEO.box, m, color, ink: o.ink === undefined ? clamp(t * 0.1, 0.006, 0.02) : o.ink, hush: k.hush, sway: o.sway ? { y0: FY + o.sway.y0, y1: FY + o.sway.y1, k: o.sway.k } : null });
        return k;
      },
    };
    return k;
  }

  // ------------------------------------------------------------ ground that follows the hills (draped patches; the town is flat)
  function fromTris(pos) {
    for (let i = 0; i < pos.length; i += 9) {      // make every triangle face up
      const ax = pos[i + 3] - pos[i], az = pos[i + 5] - pos[i + 2], bx = pos[i + 6] - pos[i], bz = pos[i + 8] - pos[i + 2];
      if (az * bx - ax * bz < 0) for (let j = 0; j < 3; j++) { const t = pos[i + 3 + j]; pos[i + 3 + j] = pos[i + 6 + j]; pos[i + 6 + j] = t; }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  }
  const quad = (pos, a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  function drapeEllipse(gy, e, lift = 0.05, step = 0.8) {
    const nr = Math.max(2, Math.ceil(Math.max(e.rx, e.rz) / step)), ns = clamp(Math.ceil(TAU * Math.max(e.rx, e.rz) / step), 16, 96), pos = [];
    const V = (i, j) => { const a = (j / ns) * TAU, r = i / nr, x = e.x + Math.cos(a) * e.rx * r, z = e.z + Math.sin(a) * e.rz * r; return [x, gy(x, z) + lift, z]; };
    for (let j = 0; j < ns; j++) { pos.push(...V(0, 0), ...V(1, j), ...V(1, j + 1)); for (let i = 1; i < nr; i++) quad(pos, V(i, j), V(i + 1, j), V(i + 1, j + 1), V(i, j + 1)); }
    return fromTris(pos);
  }
  function drapeRect(gy, b, lift = 0.05, step = 0.9) {
    const nx = Math.max(1, Math.ceil(b.hw * 2 / step)), nz = Math.max(1, Math.ceil(b.hd * 2 / step)), pos = [];
    const V = (i, j) => { const [x, z] = toWorld(b, -b.hw + (i / nx) * b.hw * 2, -b.hd + (j / nz) * b.hd * 2); return [x, gy(x, z) + lift, z]; };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) quad(pos, V(i, j), V(i + 1, j), V(i + 1, j + 1), V(i, j + 1));
    return fromTris(pos);
  }
  function drapeRibbon(gy, pts, w, lift = 0.05, step = 0.8) {
    const S = [];   // resample the polyline
    for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / step)); for (let k = 0; k < n; k++) S.push([lerp(ax, bx, k / n), lerp(az, bz, k / n)]); }
    S.push(pts[pts.length - 1]);
    const pos = [], row = i => { const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L; return [-1, 0, 1].map(s => { const x = S[i][0] + nx * s * w / 2, z = S[i][1] + nz * s * w / 2; return [x, gy(x, z) + lift, z]; }); };
    let prev = row(0);
    for (let i = 1; i < S.length; i++) { const cur = row(i); for (let j = 0; j < 2; j++) quad(pos, prev[j], cur[j], cur[j + 1], prev[j + 1]); prev = cur; }
    return fromTris(pos);
  }

  // ------------------------------------------------------------ colors
  const WHITE = '#fbf7ee', WHITE2 = '#f4ecdc', WHITE3 = '#fffdf7', BEAM = '#5e4030', WOOD = '#8a5f3e', WOOD_L = '#b07a48', WOOD_D = '#4a3a33';
  const STONE = '#c9bba0', STONE_L = '#e4dccb', STONE_D = '#a89a82', IRON = '#2f3440', GLASS = '#8fc8e0', POT = '#c46a3a', POT_B = '#3f6fb5';
  const LEAF = '#4f9a45', LEAF2 = '#5fae4f', GOLD = '#e8c35a', WHEAT_S = '#d9b450', SACK = '#efe6d2', HAY = '#e3c26a', HAY_D = '#c9a24e', CAP = '#5a463c', CAP_D = '#3f322c';
  const SAIL_CLOTH = '#f3ead6', SAIL_WOOD = '#8a4a32', OLIVE = ['#8aa060', '#96aa6a', '#7f9858', '#9fb274', '#86a05c'];
  const FLOWERS = ['#e0503f', '#ff6b5a', '#d9304a', '#ff8fb1', '#ffffff', '#ffd84a'];

  // ------------------------------------------------------------ small things: sheaves, sacks, lanterns, crates, barrels, benches, fences
  function sheaf(k, x, y, z, s, o = {}) {           // a sheaf of wheat tied with a red band, fanned out in the frame's xy plane
    for (let i = 0; i < 5; i++) {
      const a = (i - 2) * 0.17 + (o.lean || 0);
      k.add(GEO.box, x, y, z + (i % 2) * 0.03 * s, 0.045 * s, 0.95 * s, 0.03 * s, WHEAT_S, { rz: a, ry: o.ry || 0, ink: 0 });
      k.add(GEO.ico0, x - Math.sin(a) * 0.5 * s, y + Math.cos(a) * 0.5 * s, z + (i % 2) * 0.03 * s, 0.06 * s, 0.14 * s, 0.05 * s, GOLD, { rz: a, ink: 0 });
    }
    k.add(GEO.cyl6, x, y - 0.05 * s, z, 0.11 * s, 0.09 * s, 0.1 * s, '#c9443a', { ink: 0.005 });
  }
  function sack(k, x, y, z, s = 1, ry = 0, c = SACK) {        // a flour sack, tied at the top, with a wheat mark
    k.ball(x, y + 0.34 * s, z, 0.3 * s, c, { ry2: 0.36 * s, rz2: 0.26 * s, ry, geo: GEO.ball5, ink: 0.01 });
    k.add(GEO.cone6, x, y + 0.72 * s, z, 0.12 * s, 0.18 * s, 0.1 * s, c, { ry, ink: 0 });
    k.add(GEO.ico0, x + Math.sin(ry) * 0.27 * s, y + 0.36 * s, z + Math.cos(ry) * 0.27 * s, 0.06 * s, 0.12 * s, 0.03 * s, '#3f6fb5', { ry, ink: 0 });
  }
  function sacks(k, out, x, z, n, R, ry = 0) {
    const spots = [[0, 0, 0], [0.62, 0, 0.05], [-0.6, 0, -0.04], [0.3, 0.58, 0.02], [-0.3, 0.58, 0], [0, 0, -0.62]];
    for (let i = 0; i < Math.min(n, spots.length); i++) { const [sx, sy, sz] = spots[i], c = Math.cos(ry), s = Math.sin(ry); sack(k, x + sx * c + sz * s, sy, z - sx * s + sz * c, 0.95 + R() * 0.1, ry + (R() - 0.5) * 0.6, R() < 0.25 ? '#e9dcc0' : SACK); }
    if (out) { const p = k.world(x, 0, z); out.colliders.push({ x: p.x, z: p.z, r: n > 2 ? 0.95 : 0.6 }); }
  }
  function lantern(k, x, y, z) { k.box(x, y, z, 0.26, 0.34, 0.26, '#fff3b0', { ink: 0.008 }).box(x, y + 0.21, z, 0.36, 0.08, 0.36, IRON).add(GEO.cone4, x, y + 0.24, z, 0.22, 0.16, 0.22, IRON, { ink: 0 }).box(x, y - 0.2, z, 0.3, 0.06, 0.3, IRON, { ink: 0 }); }
  const crate = (k, x, y, z, s, ry = 0, fill) => {
    k.post(x, y, z, s, s * 0.7, s * 0.8, '#b98a55', { ry }).box(x, y + s * 0.35, z, s + 0.02, 0.06, s * 0.82, '#94683d', { ry, ink: 0 });
    if (fill) for (let i = 0; i < 6; i++) k.ball(x + Math.cos(ry) * ((i % 3) - 1) * s * 0.28 + Math.sin(ry) * ((i / 3 | 0) - 0.5) * s * 0.3, y + s * 0.72, z - Math.sin(ry) * ((i % 3) - 1) * s * 0.28 + Math.cos(ry) * ((i / 3 | 0) - 0.5) * s * 0.3, s * 0.15, typeof fill === 'string' ? fill : fill[i % fill.length], { geo: GEO.ball5, ink: 0 });
  };
  const barrel = (k, x, y, z, s = 1) => { k.cyl(x, y, z, 0.38 * s, 0.9 * s, '#9a6a3f', { geo: GEO.cyl8 }); for (const hy of [0.18, 0.72]) k.cyl(x, y + hy * s, z, 0.4 * s, 0.07 * s, '#4a3a33', { geo: GEO.cyl8, ink: 0 }); };
  const loaf = (k, x, y, z, s, ry = 0) => { k.ball(x, y, z, s, '#d99a4e', { ry2: s * 0.55, rz2: s * 0.6, ry, ink: 0.008, geo: GEO.ball5 }); for (let i = -1; i <= 1; i++) k.box(x + Math.cos(ry) * i * s * 0.5, y + s * 0.5, z - Math.sin(ry) * i * s * 0.5, s * 0.08, s * 0.05, s * 0.5, '#f2d29a', { ry: ry + 0.5, ink: 0 }); };
  const worldCol = (k, out, x, z, r) => { const p = k.world(x, 0, z); out.colliders.push({ x: p.x, z: p.z, r }); };
  const worldBox = (k, out, x, z, hw, hd, ry = 0) => { const p = k.world(x, 0, z); out.colliders.push({ obox: 1, x: p.x, z: p.z, hw, hd, rot: k.rot + ry }); };
  const bench = (k, out, x, z, ry, color = '#a8673a') => {
    k.box(x, 0.48, z, 1.7, 0.09, 0.5, color, { ry }).box(x - Math.sin(ry) * 0.24, 0.85, z - Math.cos(ry) * 0.24, 1.7, 0.4, 0.07, color, { ry, rx: -0.12 });
    for (const s of [-1, 1]) k.post(x + Math.cos(ry) * s * 0.7, 0, z - Math.sin(ry) * s * 0.7, 0.1, 0.48, 0.45, WOOD_D, { ry });
    if (out) { const p = k.world(x, 0, z); out.colliders.push({ obox: 1, x: p.x, z: p.z, hw: 0.9, hd: 0.32, rot: ry + k.rot }); out.benches.push({ x: p.x, z: p.z, yaw: ry + k.rot }); }
  };
  const fenceRun = (k, out, x1, z1, x2, z2, o = {}) => {     // a rail fence in the current frame; colliders in world space
    const L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.round(L / (o.step || 1.2))), ry = Math.atan2(x2 - x1, z2 - z1), c = o.color || '#c79d6d';
    for (let i = 0; i <= n; i++) { const x = lerp(x1, x2, i / n), z = lerp(z1, z2, i / n); k.post(x, -0.3, z, o.post || 0.13, (o.h || 0.95) + 0.3, o.post || 0.13, o.postColor || '#8a5f3e', { ink: 0.008, ry }); }
    for (const y of o.rails || [0.38, 0.76]) k.box((x1 + x2) / 2, y, (z1 + z2) / 2, 0.06, 0.09, L, c, { ink: 0.006, ry });
    if (out) for (let i = 0; i <= Math.ceil(L / 0.8); i++) { const p = k.world(lerp(x1, x2, i / Math.ceil(L / 0.8)), 0, lerp(z1, z2, i / Math.ceil(L / 0.8))); out.colliders.push({ x: p.x, z: p.z, r: 0.22 }); }
  };
  function stripedAwning(k, x, y, z, w, d, cols, o = {}) {   // a striped canvas awning, sloping toward +z, with a scalloped edge
    const n = Math.max(4, Math.round(w / 0.45)), tilt = o.tilt || 0.32;
    for (let i = 0; i < n; i++) k.box(x - w / 2 + (i + 0.5) * (w / n), y, z, w / n + 0.005, 0.07, d, cols[i % 2], { rx: tilt, ink: 0.01 });
    const ey = y - Math.sin(tilt) * d / 2 - 0.04, ez = z + Math.cos(tilt) * d / 2;
    for (let i = 0; i < n; i++) k.add(GEO.halfDisc, x - w / 2 + (i + 0.5) * (w / n), ey - 0.02, ez, (w / n) * 0.5, 0.05, (w / n) * 0.5, cols[i % 2], { rx: Math.PI / 2, ink: 0 });
  }

  // ------------------------------------------------------------ houses: whitewash over a painted band, dark beams, terracotta roofs
  function face(k, h, y0, i) { k.frame(h.x, y0, h.z, h.rot + [0, Math.PI / 2, Math.PI, -Math.PI / 2][i]); return i % 2 ? { hz: h.w / 2, hw: h.d / 2 } : { hz: h.d / 2, hw: h.w / 2 }; }
  function win(k, x, y, zf, o = {}) {
    const R = o.R || R0, wh = o.h || (o.small ? 0.7 : 0.95), ww = o.w || (o.small ? 0.62 : 0.82), trim = o.trim || WHITE3;
    k.box(x, y, zf + 0.03, ww + 0.22, wh + 0.22, 0.08, trim, { ink: 0.008 });
    k.box(x, y, zf + 0.05, ww, wh, 0.08, GLASS, { ink: 0 });
    if (!o.plain && !o.small) k.box(x, y, zf + 0.08, 0.05, wh, 0.04, trim, { ink: 0 }).box(x, y + 0.06, zf + 0.08, ww, 0.05, 0.04, trim, { ink: 0 });
    k.box(x, y - wh / 2 - 0.1, zf + 0.12, ww + 0.34, 0.08, 0.22, trim, { ink: 0 });
    if (o.bars) for (let i = -1; i <= 1; i++) k.box(x + i * ww * 0.3, y, zf + 0.16, 0.045, wh + 0.1, 0.045, IRON, { ink: 0 });
    else if (o.shutter) for (const s of [-1, 1]) k.box(x + s * (ww / 2 + 0.3), y, zf + 0.07, 0.4, wh + 0.04, 0.06, o.shutter, { ink: 0.008 });
    if (o.pot) { const py = y - wh / 2 - 0.06, px = x + (R() - 0.5) * 0.3; k.cyl(px, py, zf + 0.2, 0.11, 0.17, R() < 0.5 ? POT : POT_B, { geo: GEO.cyl6, ink: 0 }); k.add(GEO.ico0, px, py + 0.25, zf + 0.2, 0.17, 0.12, 0.13, LEAF, { ink: 0 }); for (let i = 0; i < 2; i++) k.add(GEO.ico0, px + (i - 0.5) * 0.12, py + 0.34 + R() * 0.05, zf + 0.22 + (R() - 0.5) * 0.08, 0.07, 0.07, 0.07, R() < 0.8 ? FLOWERS[0] : pick(FLOWERS, R), { ink: 0 }); }
  }
  function door(k, x, zf, color, o = {}) {
    const top = o.round ? 2.0 : 2.25, fr = o.frame || STONE_L;
    k.box(x, 0.3 + top / 2 + 0.06, zf + 0.03, 1.34, top + 0.14, 0.08, fr);
    k.box(x, 0.3 + top / 2, zf + 0.06, 1.06, top, 0.1, color);
    if (o.round) { k.add(GEO.halfDisc, x, 0.3 + top, zf + 0.06, 0.53, 0.1, 0.53, color, { rx: -Math.PI / 2, ink: 0.008 }); k.add(GEO.halfDisc, x, 0.3 + top, zf + 0.03, 0.67, 0.08, 0.67, fr, { rx: -Math.PI / 2 }); }
    for (const s of [-1, 1]) k.box(x + s * 0.2, 0.3 + top * 0.47, zf + 0.115, 0.04, top * 0.86, 0.02, shade(color, 0.72), { ink: 0 });
    k.add(GEO.ico0, x + 0.34, 1.3, zf + 0.14, 0.055, 0.055, 0.055, '#e6b84a', { ink: 0 });
    k.box(x, 0.14, zf + 0.32, 1.5, 0.22, 0.56, STONE);
    if (o.sheaf) sheaf(k, x, 0.3 + top + (o.round ? 0.9 : 0.42), zf + 0.12, 0.5);
    if (o.lamp) { lantern(k, x + 0.95, top + 0.12, zf + 0.26); k.box(x + 0.95, top + 0.42, zf + 0.15, 0.05, 0.05, 0.3, IRON, { ink: 0 }); }
  }
  // a gable roof with its ridge along x; returns the roof height at depth z (for chimneys)
  function gableRoof(k, w, d, H, pitch, roof, wall) {
    const ov = 0.42, tp = Math.tan(pitch), cp = Math.cos(pitch), sp = Math.sin(pitch), hR = (d / 2) * tp, t = 0.2, dark = shade(roof, 0.8);
    k.add(GEO.prism, 0, H, 0, w, hR, d, wall);
    for (const s of [-1, 1]) {
      const zm = (d / 2 + ov) / 2, ym = H + hR - zm * tp;
      k.box(0, ym + (t / 2) * cp, s * (zm + (t / 2) * sp), w + 0.7, t, (d / 2 + ov) / cp + 0.04, roof, { rx: s * pitch });
      for (let i = 1; i <= 4; i++) { const z = (i / 5) * (d / 2 + ov), y = H + hR - z * tp; k.box(0, y + (t + 0.02) * cp, s * (z + (t + 0.02) * sp), w + 0.72, 0.05, 0.12, dark, { rx: s * pitch, ink: 0 }); }
    }
    k.add(GEO.cyl8, 0, H + hR + 0.16, 0, 0.17, w + 0.82, 0.17, dark, { rz: Math.PI / 2 });
    return z => H + hR - Math.abs(z) * tp;
  }
  // the same with its ridge along z (the barn's gable faces front)
  function gableRoofZ(k, w, d, H, pitch, roof, wall) {
    const ov = 0.4, tp = Math.tan(pitch), cp = Math.cos(pitch), sp = Math.sin(pitch), hR = (w / 2) * tp, t = 0.22, dark = shade(roof, 0.8);
    k.add(GEO.prism, 0, H, 0, d, hR, w, wall, { ry: Math.PI / 2 });
    for (const s of [-1, 1]) {
      const xm = (w / 2 + ov) / 2, ym = H + hR - xm * tp;
      k.box(s * (xm + (t / 2) * sp), ym + (t / 2) * cp, 0, (w / 2 + ov) / cp + 0.04, t, d + 0.7, roof, { rz: -s * pitch });
      for (let i = 1; i <= 4; i++) { const x = (i / 5) * (w / 2 + ov), y = H + hR - x * tp; k.box(s * (x + (t + 0.02) * sp), y + (t + 0.02) * cp, 0, 0.12, 0.05, d + 0.72, dark, { rz: -s * pitch, ink: 0 }); }
    }
    k.add(GEO.cyl8, 0, H + hR + 0.17, 0, 0.18, d + 0.82, 0.18, dark, { rx: Math.PI / 2 });
    return hR;
  }
  function chimney(k, x, z, base, roof, out, smoke) {
    k.post(x, base - 0.45, z, 0.6, 1.55, 0.6, WHITE3).post(x, base + 1.08, z, 0.76, 0.1, 0.76, WHITE2);
    for (const s of [-1, 1]) k.box(x, base + 1.36, z + s * 0.17, 0.84, 0.07, 0.44, roof, { rx: -s * 0.6, ink: 0.006 });
    if (out && smoke) out.smoke.push(k.world(x, base + 1.3, z));
  }
  // One house. h: { x, z, w, d, rot, floors, wall, band, roof, door, shutter, style: cottage | timber | arcade, seed }
  // o: { slots, doorSlot, round, lamp, sheaf, shopWin, smoke, noChimney, vane, noExtras }
  function drawHouse(k, h, y0, out, o = {}) {
    const R = rng(Math.floor(h.seed * 1e6) + 7), fl = h.floors || 1, UP = 2.75, H = fl >= 3 ? 7.8 : fl === 2 ? 5.3 : 3.05;
    const { w, d } = h, style = h.style || 'cottage', jet = style === 'timber' && fl > 1 ? 0.22 : 0, wall = h.wall || WHITE;
    let f = face(k, h, y0, 0);
    k.post(0, -0.75, 0, w + 0.24, 1.1, d + 0.24, STONE);
    k.post(0, 0.3, 0, w, (jet ? UP : H) - 0.3, d, wall);
    k.post(0, 0.3, 0, w + 0.06, 0.62, d + 0.06, h.band, { ink: 0.008 });                       // the painted band (zócalo)
    if (jet) {   // the upper floor sticks out a little, framed in dark beams
      k.post(0, UP, 0, w + 0.1, H - UP, d + 2 * jet, WHITE2);
      k.box(0, UP + 0.06, 0, w + 0.26, 0.2, d + 2 * jet + 0.16, BEAM, { ink: 0.008 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 + 0.03), UP, sz * (d / 2 + jet + 0.03), 0.18, H - UP, 0.18, BEAM, { ink: 0.006 });
      for (const sz of [-1, 1]) k.box(0, H - 0.1, sz * (d / 2 + jet + 0.04), w + 0.16, 0.16, 0.08, BEAM, { ink: 0.005 });
    } else {
      k.box(0, H - 0.1, 0, w + 0.1, 0.2, d + 0.1, fl > 1 ? h.band : shade(h.band, 1.08), { ink: 0.006 });   // a painted strip under the eaves
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 - 0.06), 0.92, sz * (d / 2 - 0.06), 0.22, H - 1.0, 0.22, WHITE3, { ink: 0 });
    }
    const fz = f.hz, uz = f.hz + jet;
    let slots = clamp(Math.floor((w - 0.6) / 1.65), 2, 4); if (o.slots) slots = o.slots;
    const sx = i => -w / 2 + (w / slots) * (i + 0.5), dSlot = o.doorSlot !== undefined ? o.doorSlot : Math.floor(R() * slots);
    const bars = R() < 0.45, round = o.round !== undefined ? o.round : R() < 0.7;
    for (let i = 0; i < slots; i++) {
      if (i === dSlot) door(k, sx(i), fz, h.door, { round, lamp: o.lamp !== undefined ? o.lamp : R() < 0.35, sheaf: o.sheaf !== undefined ? o.sheaf : R() < 0.55, frame: round ? STONE_L : WHITE3 });
      else win(k, sx(i), 1.6, fz, { shutter: h.shutter, bars: bars && !o.shopWin, pot: R() < 0.55 && !o.shopWin, R, w: o.shopWin ? 1.35 : undefined, h: o.shopWin ? 1.4 : undefined, plain: o.shopWin });
      if (fl > 1) win(k, sx(i), UP + 1.25, uz, { shutter: h.shutter, pot: R() < 0.5, R });
      if (fl > 2) win(k, sx(i), UP + 3.55, uz, { shutter: h.shutter, R, small: true });
    }
    if (jet) for (let i = 0; i < slots - 1; i++) { const xa = -w / 2 + (w / slots) * (i + 1); k.beam(xa - 0.36, UP + 0.24, uz + 0.04, xa + 0.36, H - 0.24, uz + 0.04, 0.11, BEAM, { t2: 0.06 }); k.beam(xa + 0.36, UP + 0.24, uz + 0.04, xa - 0.36, H - 0.24, uz + 0.04, 0.11, BEAM, { t2: 0.06 }); }
    if (style === 'arcade' && fl > 1) {      // a wooden gallery across the upper floor, on posts down to the street
      const by = UP - 0.08, bd = 1.0;
      k.box(0, by, fz + bd / 2, w + 0.3, 0.16, bd + 0.05, WOOD);
      for (let i = 0; i <= slots; i++) { const x = -w / 2 - 0.05 + (w + 0.1) * i / slots; k.post(x, 0, fz + bd - 0.1, 0.15, by, 0.15, WOOD_D); const p = k.world(x, 0, fz + bd - 0.1); out.colliders.push({ x: p.x, z: p.z, r: 0.14 }); }
      k.box(0, by + 0.95, fz + bd - 0.04, w + 0.3, 0.08, 0.08, WOOD_D);
      for (let x = -w / 2; x <= w / 2 + 0.01; x += 0.32) k.box(x, by + 0.5, fz + bd - 0.04, 0.045, 0.86, 0.045, WOOD_D, { ink: 0 });
      for (const s of [-1, 1]) k.box(s * (w / 2 + 0.12), by + 0.5, fz + bd / 2, 0.06, 0.9, bd, WOOD_D, { ink: 0.005 });
    }
    // the sides and the back: plainer windows
    for (const i of [1, 2, 3]) {
      const g = face(k, h, y0, i), n = Math.max(1, Math.floor((g.hw * 2 - 0.8) / (i === 2 ? 3.2 : 2.6)));
      for (let j = 0; j < n; j++) {
        const x = -g.hw + (g.hw * 2 / n) * (j + 0.5);
        if (i === 2 || R() < 0.55) win(k, x, 1.6, g.hz, { shutter: i === 2 ? null : h.shutter, plain: i === 2, R, small: true });
        if (fl > 1 && (i !== 2 || j === 0)) win(k, x, UP + 1.25, g.hz + (i % 2 ? 0 : jet), { shutter: i === 2 ? null : h.shutter, plain: true, R, small: true });
      }
    }
    // the roof, a chimney, sometimes a little windmill weathervane on the ridge
    f = face(k, h, y0, 0);
    const pitch = fl > 1 ? 0.6 : 0.5, at = gableRoof(k, w + (jet ? 0.1 : 0), d + 2 * jet, H, pitch, h.roof, jet ? WHITE2 : wall);
    const cx = (R() < 0.5 ? -1 : 1) * w * 0.27, cz = -d * 0.18;
    if (!o.noChimney) chimney(k, cx, cz, at(cz), h.roof, out, o.smoke || R() < 0.3);
    if (o.vane || (o.vane === undefined && R() < 0.13)) {
      const vx = -cx * 0.9, top = at(0) + 0.2;
      k.cyl(vx, top, 0, 0.035, 1.0, IRON, { geo: GEO.cyl6, ink: 0 }).ball(vx, top + 0.62, 0, 0.07, IRON, { ink: 0 });
      out.vanes.push({ p: k.world(vx, top + 0.85, 0.12), yaw: k.rot + (R() - 0.5) * 0.8 });
    }
    h.doorAt = k.world(sx(dSlot), 0, d / 2 + 1.1);
    // things by the door: flour sacks, a pot of geraniums, a sheaf leaning on the wall, a bench
    if (!o.noExtras) {
      const side = R() < 0.5 ? -1 : 1, x = sx(dSlot) + side * 1.15, kind = R();
      if (Math.abs(x) < w / 2 - 0.2) {
        if (kind < 0.4) { sack(k, x, 0, fz + 0.42, 0.85, R()); if (R() < 0.6) sack(k, x + side * 0.55, 0, fz + 0.4, 0.8, R()); worldCol(k, out, x, fz + 0.42, 0.42); }
        else if (kind < 0.7) { k.cyl(x, 0, fz + 0.42, 0.24, 0.42, R() < 0.5 ? POT : POT_B, { geo: GEO.cyl8 }).add(GEO.ico1, x, 0.62, fz + 0.42, 0.32, 0.26, 0.3, LEAF2, { ink: 0.01 }); for (let i = 0; i < 4; i++) k.add(GEO.ico0, x + (R() - 0.5) * 0.4, 0.78 + R() * 0.1, fz + 0.42 + (R() - 0.5) * 0.3, 0.08, 0.08, 0.08, FLOWERS[i % 3], { ink: 0 }); worldCol(k, out, x, fz + 0.42, 0.3); }
        else if (kind < 0.85) { sheaf(k, x, 0.55, fz + 0.18, 0.95, { lean: side * 0.08 }); }
      }
      // pots on the wall (a Córdoba patio habit)
      if (R() < 0.5) for (let i = 0; i < slots - 1; i++) { const xa = -w / 2 + (w / slots) * (i + 1), y = 2.2 + (fl > 1 ? 0 : -0.2); k.box(xa, y - 0.15, fz + 0.06, 0.05, 0.3, 0.06, IRON, { ink: 0 }).cyl(xa, y - 0.05, fz + 0.2, 0.12, 0.2, POT_B, { geo: GEO.cyl6, ink: 0.005 }).add(GEO.ico0, xa, y + 0.22, fz + 0.2, 0.17, 0.13, 0.15, LEAF, { ink: 0 }).add(GEO.ico0, xa + 0.06, y + 0.3, fz + 0.26, 0.07, 0.07, 0.07, FLOWERS[0], { ink: 0 }); }
    }
    return { H, doorX: sx(dSlot), at };
  }
  // a round house that is also a little mill (two in town), with small turning sails
  function drawMillHouse(k, out, m, gy) {
    const y0 = gy(m.x, m.z); k.frame(m.x, y0, m.z, m.yaw);
    const r = m.r, H = 4.8;
    k.cyl(0, -0.6, 0, r + 0.22, 1.0, STONE, { geo: GEO.cyl16 });
    k.add(GEO.taper, 0, 0.3 + H / 2, 0, r, H, r, WHITE);
    k.cyl(0, 0.3, 0, r + 0.05, 0.6, '#3f6fb5', { geo: GEO.cyl16, ink: 0.008 });
    k.cyl(0, 0.3 + H - 0.1, 0, r * 0.82 + 0.1, 0.22, BEAM, { geo: GEO.cyl16, ink: 0.008 });
    const top = 0.3 + H, rt = r * 0.82;
    k.add(GEO.cone16, 0, top + 1.2, 0, rt + 0.45, 2.4, rt + 0.45, '#c9643f').ball(0, top + 2.45, 0, 0.14, CAP_D);
    const hubY = top + 0.55, fwd = rt + 0.75;
    k.add(GEO.cyl8, 0, hubY, fwd / 2, 0.16, fwd + 0.2, 0.16, WOOD_D, { rx: Math.PI / 2 });
    out.rotors.push({ x: m.x, y: y0 + hubY, z: m.z, yaw: m.yaw, fwd: fwd + 0.12, s: 0.52, speed: 0.9, ang: m.x * 0.1 });
    k.frame(m.x, y0, m.z, m.yaw + Math.PI);            // the door looks into town
    door(k, 0, r - 0.06, '#8d5733', { round: true, sheaf: true });
    win(k, 0, 3.6, rt + 0.12, { shutter: '#3f6fb5', R: R0, small: true });
    k.frame(m.x, y0, m.z, m.yaw + Math.PI / 2); win(k, 0, 2.2, r * 0.92, { shutter: '#3f6fb5', R: R0, small: true, pot: true });
    k.frame(m.x, y0, m.z, m.yaw - Math.PI / 2); win(k, 0, 2.6, r * 0.9, { shutter: '#3f6fb5', R: R0, small: true });
    out.colliders.push({ x: m.x, z: m.z, r: r + 0.25 });
  }

  // ------------------------------------------------------------ the special buildings: the clockmaker's, the inn, the bakery
  function clockFace(k, x, y, z, r, o = {}) {        // a clock face in the frame's xy plane, facing +z; o.hands draws fixed hands
    k.add(GEO.cyl20, x, y, z + 0.02, r + 0.12, 0.06, r + 0.12, o.rim || '#3a5a7a', { rx: Math.PI / 2 }).add(GEO.cyl20, x, y, z + 0.06, r, 0.05, r, '#fdf8ee', { rx: Math.PI / 2, ink: 0 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; k.box(x + Math.sin(a) * r * 0.82, y + Math.cos(a) * r * 0.82, z + 0.1, 0.05 * r, (i % 3 ? 0.09 : 0.18) * r, 0.02, '#2b2235', { rz: -a, ink: 0 }); }
    if (o.hands) { k.box(x, y + r * 0.27, z + 0.12, 0.07 * r, r * 0.54, 0.02, '#2b2235', { ink: 0 }).box(x + r * 0.18, y + r * 0.1, z + 0.12, 0.07 * r, r * 0.4, 0.02, '#2b2235', { rz: -1.1, ink: 0 }); }
    k.ball(x, y, z + 0.12, 0.06 * r, '#2b2235', { ink: 0 });
  }
  function drawSpecial(k, out, gy) {
    const col = out.colliders;
    for (const b of FIXED) {
      if (b.kind === 'millhouse') { drawMillHouse(k, out, b, gy); continue; }
      const y0 = Math.min(...corners({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot }).map(([x, z]) => gy(x, z)), gy(b.x, b.z));
      col.push({ obox: 1, x: b.x, z: b.z, hw: b.w / 2 + 0.12, hd: b.d / 2 + 0.12, rot: b.rot });
      const dz = b.d / 2;
      if (b.kind === 'clock') {
        const r = drawHouse(k, { ...b, seed: 0.618, wall: WHITE3, band: '#3a5a7a', roof: '#b85a3a', door: '#3a5a7a', shutter: '#3a5a7a', style: 'timber' }, y0, out, { slots: 3, doorSlot: 1, shopWin: true, round: true, lamp: false, sheaf: false, vane: false, noExtras: true, smoke: true });
        k.frame(b.x, y0, b.z, b.rot);
        // a big clock in the gable, and a pocket-watch sign on an iron bracket by the door
        clockFace(k, 0, r.H + 0.95, dz + 0.24, 0.95, { rim: '#3a5a7a' });
        out.clockAt = { p: k.world(0, r.H + 0.95, dz + 0.4), rot: b.rot, r: 0.95 };
        const sx = r.doorX + 0.95, sy = 3.15;
        k.box(sx + 0.55, sy + 0.62, dz + 0.65, 0.06, 0.06, 1.3, IRON, { ink: 0 }).beam(sx + 0.55, sy - 0.1, dz + 0.04, sx + 0.55, sy + 0.6, dz + 0.9, 0.05, IRON, { ink: 0 });
        k.add(GEO.cyl20, sx + 0.55, sy, dz + 1.05, 0.5, 0.12, 0.5, '#e6b84a', { rz: Math.PI / 2 });
        for (const s of [-1, 1]) k.add(GEO.cyl20, sx + 0.55 + s * 0.065, sy, dz + 1.05, 0.4, 0.02, 0.4, '#fdf8ee', { rz: Math.PI / 2, ink: 0 }).box(sx + 0.55 + s * 0.08, sy + 0.12, dz + 1.05, 0.02, 0.24, 0.04, '#2b2235', { ink: 0 }).box(sx + 0.55 + s * 0.08, sy + 0.04, dz + 1.12, 0.02, 0.04, 0.18, '#2b2235', { ink: 0 });
        k.add(GEO.cyl8, sx + 0.55, sy + 0.58, dz + 1.05, 0.09, 0.14, 0.09, '#e6b84a').ball(sx + 0.55, sy + 0.72, dz + 1.05, 0.08, '#e6b84a', { ink: 0.005 });
        k.box(sx + 0.55, sy + 0.45, dz + 1.05, 0.03, 0.3, 0.03, IRON, { ink: 0 });
        // little clocks in the shop window (left of the door)
        const wx = r.doorX - b.w / 3;
        for (let i = 0; i < 4; i++) { const x = wx - 0.45 + (i % 2) * 0.9, y = 1.25 + (i >> 1) * 0.6; k.add(GEO.cyl20, x, y, dz + 0.16, 0.2, 0.04, 0.2, ['#e6b84a', '#8a5f3e', '#3a5a7a', '#c9443a'][i], { rx: Math.PI / 2, ink: 0.004 }).add(GEO.cyl20, x, y, dz + 0.19, 0.15, 0.02, 0.15, '#fdf8ee', { rx: Math.PI / 2, ink: 0 }).box(x, y + 0.05, dz + 0.21, 0.02, 0.1, 0.01, '#2b2235', { ink: 0 }); }
        k.box(wx, 0.92, dz + 0.3, 1.5, 0.08, 0.4, WOOD, { ink: 0.006 });
        // a doorstep bench and pots, a grandfather clock outside (a clockmaker's pride)
        bench(k, out, r.doorX - 2.6 < -b.w / 2 ? r.doorX + 2.4 : r.doorX - 2.4, dz + 1.3, 0);
        const gx = -b.w / 2 - 0.55;
        k.post(gx, 0, dz - 0.6, 0.62, 2.1, 0.45, '#7a4f2e').add(GEO.cyl20, gx, 1.65, dz - 0.36, 0.22, 0.03, 0.22, '#fdf8ee', { rx: Math.PI / 2, ink: 0 }).add(GEO.cone4, gx, 2.1, dz - 0.6, 0.44, 0.3, 0.33, '#7a4f2e');
        k.box(gx, 0.95, dz - 0.36, 0.28, 0.7, 0.02, '#e6d3a0', { ink: 0 }).ball(gx, 0.75, dz - 0.34, 0.09, '#e6b84a', { ink: 0 });
        worldCol(k, out, gx, dz - 0.6, 0.4);
      } else if (b.kind === 'inn') {
        const r = drawHouse(k, { ...b, seed: 0.77, wall: WHITE, band: '#c0563c', roof: '#c45a3c', door: '#8d5733', shutter: '#4f7f4a', style: 'arcade' }, y0, out, { slots: 5, doorSlot: 2, round: true, lamp: true, smoke: true, sheaf: true, noExtras: true });
        k.frame(b.x, y0, b.z, b.rot);
        // the hanging sign: a mug and a little windmill
        const sx = r.doorX + 1.6;
        k.box(sx, 3.6, dz + 1.65, 0.07, 0.07, 1.1, IRON, { ink: 0 });
        k.box(sx, 3.05, dz + 1.75, 0.08, 0.85, 0.95, '#c79d6d').box(sx, 3.05, dz + 1.75, 0.06, 0.97, 1.07, '#8a5f3e', { ink: 0 });
        for (const s of [-1, 1]) { k.cyl(sx + s * 0.08, 2.85, dz + 1.62, 0.13, 0.32, '#e6a23a', { geo: GEO.cyl8 }).ball(sx + s * 0.08, 3.2, dz + 1.62, 0.15, '#fffaf0', { ry2: 0.08, ink: 0.005 }); k.post(sx + s * 0.08, 3.0, dz + 1.92, 0.04, 0.32, 0.1, WHITE3, { ink: 0.004 }).add(GEO.cone, sx + s * 0.08, 3.4, dz + 1.92, 0.1, 0.14, 0.1, '#c45a3c', { ink: 0.004 }); }
        // the terrace on the square: tables under a vine pergola, stools, barrels
        const PD = 3.4;
        for (const x of [-4.2, -1.4, 1.4, 4.2]) { k.post(x, 0, dz + PD, 0.18, 2.75, 0.18, WOOD_D); worldCol(k, out, x, dz + PD, 0.16); }
        for (const x of [-4.2, -1.4, 1.4, 4.2]) k.beam(x, 2.8, dz + PD + 0.25, x, 2.65, dz + 0.1, 0.14, WOOD);
        for (let z = 0.6; z < PD + 0.4; z += 0.55) k.box(0, 2.85, dz + z, 9.0, 0.08, 0.08, WOOD_L, { ink: 0.004 });
        const RV = rng(33);
        for (let i = 0; i < 16; i++) { const x = -4.3 + (i % 8) * 1.23 + RV() * 0.5, z = dz + 0.7 + (i >> 3) * 1.5 + RV() * 0.6; k.add(GEO.ico1, x, 3.0 + RV() * 0.15, z, 0.62 + RV() * 0.2, 0.2, 0.55, i % 3 ? LEAF2 : LEAF, { b: 'sway', ink: 0.008, sway: { y0: 2.6, y1: 3.4, k: 0.35 } }); if (i % 3 === 0) for (let j = 0; j < 4; j++) k.add(GEO.ico0, x + (j % 2) * 0.09, 2.78 - j * 0.07, z + 0.05, 0.06, 0.06, 0.06, '#7a4f9a', { b: 'sway', ink: 0, sway: { y0: 2.4, y1: 3.0, k: 0.4 } }); }
        out.terrace = [];
        for (const [tx, tz] of [[-2.8, dz + 1.9], [2.8, dz + 1.9]]) {
          k.cyl(tx, 0, tz, 0.08, 0.75, '#4a3a33').cyl(tx, 0.75, tz, 0.62, 0.07, '#c79d6d', { geo: GEO.cyl20 }).cyl(tx, 0, tz, 0.3, 0.05, '#4a3a33');
          k.cyl(tx + 0.2, 0.82, tz, 0.07, 0.16, '#e6a23a', { ink: 0.005 }).ball(tx - 0.2, 0.86, tz + 0.1, 0.12, '#d99a4e', { ry2: 0.07, ink: 0.005, geo: GEO.ball5 });
          const stools = [];
          for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4, x = tx + Math.cos(a) * 0.95, z = tz + Math.sin(a) * 0.95; k.cyl(x, 0, z, 0.24, 0.46, '#a8673a', { geo: GEO.cyl8 }); stools.push(k.world(x, 0, z)); }
          const p = k.world(tx, 0, tz); col.push({ x: p.x, z: p.z, r: 0.75 }); out.terrace.push({ x: p.x, z: p.z, stools });
        }
        for (const [x, z] of [[-b.w / 2 + 0.5, dz + 0.55], [b.w / 2 - 0.5, dz + 0.55]]) { barrel(k, x, 0, z); worldCol(k, out, x, z, 0.42); }
        barrel(k, -b.w / 2 + 0.5, 0.9, dz + 0.52, 0.8);
      } else if (b.kind === 'bakery') {
        const r = drawHouse(k, { ...b, seed: 0.52, wall: WHITE3, band: '#d9a03a', roof: '#d27445', door: '#8d5733', shutter: '#d0663f', style: 'cottage' }, y0, out, { slots: 3, doorSlot: 1, shopWin: true, round: true, lamp: true, sheaf: true, noExtras: true, noChimney: true, vane: true });
        k.frame(b.x, y0, b.z, b.rot);
        stripedAwning(k, 0, 2.9, dz + 0.55, b.w - 0.4, 1.2, ['#d0663f', '#fff4e4']);
        // the bread sign: a round board and a loaf, over the awning
        k.add(GEO.cyl20, 0, 4.25, dz + 0.1, 0.95, 0.12, 0.95, '#fff4e4', { rx: Math.PI / 2 }).add(GEO.cyl20, 0, 4.25, dz + 0.06, 1.08, 0.08, 1.08, '#8d5733', { rx: Math.PI / 2 });
        loaf(k, 0, 4.25, dz + 0.36, 0.66, 0);
        // the oven's big chimney, smoking all day
        const ox = b.w / 2 - 0.9;
        k.post(ox, 2.8, -dz + 1.2, 0.95, 4.4, 0.95, WHITE3).post(ox, 7.2, -dz + 1.2, 1.15, 0.14, 1.15, '#c9643f');
        out.smoke.push(k.world(ox, 7.5, -dz + 1.2)); out.bigSmoke = k.world(ox, 7.5, -dz + 1.2);
        // flour sacks and a handcart by the door
        sacks(k, out, -2.9, dz + 1.15, 5, rng(9), 0.2);
        k.frame(b.x, y0, b.z, b.rot); const cx = 3.0, cz = dz + 1.3;
        k.post(cx, 0.42, cz, 1.0, 0.36, 1.3, WOOD_L, { ry: 0.3 }).add(GEO.cyl20, cx - 0.62, 0.36, cz, 0.36, 0.08, 0.36, WOOD_D, { rz: Math.PI / 2 }).add(GEO.cyl20, cx + 0.62, 0.36, cz, 0.36, 0.08, 0.36, WOOD_D, { rz: Math.PI / 2 });
        sack(k, cx - 0.1, 0.62, cz, 0.7, 0.4); sack(k, cx + 0.25, 0.62, cz - 0.2, 0.65, 1.2);
        worldCol(k, out, cx, cz, 0.8);
      }
    }
  }

  // ------------------------------------------------------------ the Great Mill: a stone plinth, a stone footing with the big door,
  // a whitewashed tower with a wooden gallery, the cap with its windshaft, an open belfry with the bell, a terracotta roof
  function drawGreatMill(k, out, gy) {
    const M = GM;
    let lo = 1e9, hi = -1e9;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const h = gy(M.x + i * M.step / 2, M.z + j * M.step / 2); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    const base = Math.max(GY, hi), P1 = 0.28, P2 = 0.56;
    k.hush = 1;
    k.frame(M.x, base, M.z, 0);
    k.post(0, lo - base - 0.4, 0, M.step * 2, P1 - (lo - base - 0.4), M.step * 2, STONE_D);
    k.post(0, P1, 0, M.half * 2, P2 - P1, M.half * 2, STONE);
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const t = -M.half + 0.8 + i * (M.half * 2 - 1.6) / 8; k.box(t, P2 + 0.005, s * (M.half - 0.35), 1.4, 0.02, 0.6, STONE_L, { ink: 0 }).box(s * (M.half - 0.35), P2 + 0.005, t, 0.6, 0.02, 1.4, STONE_L, { ink: 0 }); }
    out.platforms.push({ box: [M.x - M.step, M.x + M.step, M.z - M.step, M.z + M.step], top: base + P1 }, { box: [M.x - M.half, M.x + M.half, M.z - M.half, M.z + M.half], top: base + P2 });
    // the stone footing and its big door (south)
    const R = rng(404), FH = 4.4, TR = M.towerR;
    k.cyl(0, P2, 0, TR, FH, '#d8cdb6', { geo: GEO.cyl20 });
    for (let i = 0; i < 46; i++) { const a = R() * TAU, y = P2 + 0.3 + R() * (FH - 0.6); if (Math.abs(angDiff(a, Math.PI / 2)) < 0.42 && y < P2 + 4.3) continue; k.box(Math.cos(a) * (TR + 0.02), y, Math.sin(a) * (TR + 0.02), 0.08, 0.34 + R() * 0.12, 0.7 + R() * 0.5, R() < 0.5 ? '#c9bda4' : '#e4dac6', { ry: -a, ink: 0 }); }
    k.cyl(0, P2 + FH - 0.18, 0, TR + 0.12, 0.3, '#c9bda4', { geo: GEO.cyl20, ink: 0.012 });
    const DW = 1.6, DH = 2.9, dz = TR - 0.05;
    k.box(0, P2 + DH / 2, dz, DW * 2 + 0.6, DH + 0.1, 0.5, '#e4dac6');
    k.add(GEO.halfDisc, 0, P2 + DH, dz, DW + 0.3, 0.5, DW + 0.3, '#e4dac6', { rx: -Math.PI / 2 });
    k.box(0, P2 + DH / 2, dz + 0.2, DW * 2, DH, 0.2, '#6b4228', { ink: 0.01 }).add(GEO.halfDisc, 0, P2 + DH, dz + 0.2, DW, 0.2, DW, '#6b4228', { rx: -Math.PI / 2, ink: 0.01 });
    k.box(0, P2 + (DH + DW) / 2, dz + 0.32, 0.06, DH + DW - 0.1, 0.04, '#4a2f1f', { ink: 0 });
    for (const y of [0.6, 1.6, 2.6]) k.box(0, P2 + y, dz + 0.33, DW * 2 - 0.1, 0.12, 0.04, IRON, { ink: 0 });
    for (const s of [-1, 1]) { k.add(GEO.torus, s * 0.3, P2 + 1.5, dz + 0.36, 0.12, 0.12, 0.12, IRON, { ink: 0 }); for (let i = 0; i < 6; i++) k.add(GEO.ico0, s * (0.4 + (i % 3) * 0.42), P2 + 0.9 + (i >> 1) * 0.5, dz + 0.34, 0.04, 0.04, 0.04, '#2b2235', { ink: 0 }); }
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; k.box(Math.cos(a) * (DW + 0.18), P2 + DH + Math.sin(a) * (DW + 0.18), dz + 0.27, 0.3, 0.42, 0.12, i === 4 ? '#c9bda4' : '#ece4d4', { rz: a - Math.PI / 2, ink: 0.006 }); }
    for (const s of [-1, 1]) { lantern(k, s * (DW + 0.85), P2 + 2.55, dz + 0.55); k.box(s * (DW + 0.85), P2 + 2.85, dz + 0.32, 0.05, 0.05, 0.5, IRON, { ink: 0 }); }
    sheaf(k, 0, P2 + DH + DW + 0.62, dz + 0.32, 1.1);
    for (let i = 0; i < 3; i++) k.post(0, P2 - 0.02 - i * 0.0, dz + 0.55 + i * 0.36, DW * 2 + 0.5 - i * 0.0, 0.02, 0.36, i % 2 ? STONE_L : STONE, { ink: 0 });
    out.colliders.push({ x: M.x, z: M.z, r: TR + 0.2 });
    // the white tower, with timber bands and small windows
    const T0 = P2 + FH, TH = 10.4, TT = T0 + TH, rAt = y => TR * 0.97 * (1 - 0.2 * (y - T0) / TH);
    k.add(GEO.taper20, 0, T0 + TH / 2, 0, TR * 0.97, TH, TR * 0.97, WHITE);
    for (const y of [T0 + 0.05, T0 + 5.4]) k.cyl(0, y - 0.13, 0, rAt(y) + 0.07, 0.26, BEAM, { geo: GEO.cyl20, ink: 0.01 });
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + 0.9 + i * 0.95, y = T0 + 2.6 + (i % 3) * 2.6 + (i > 3 ? 1.2 : 0), rr = rAt(y);
      k.frame(M.x + Math.sin(a) * rr, base, M.z + Math.cos(a) * rr, a);
      k.box(0, y, 0.0, 0.8, 1.05, 0.12, WHITE3, { ink: 0.008 }).box(0, y, 0.05, 0.56, 0.8, 0.1, '#3a4a5a', { ink: 0 }).add(GEO.halfDisc, 0, y + 0.4, 0.05, 0.28, 0.1, 0.28, '#3a4a5a', { rx: -Math.PI / 2, ink: 0 });
      for (const s of [-1, 1]) k.box(s * 0.48, y, 0.04, 0.3, 0.86, 0.06, '#c0563c', { ink: 0.006 });
    }
    k.frame(M.x, base, M.z, 0);
    // the gallery (a wooden stage round the tower, over the door)
    const GYL = T0;
    k.cyl(0, GYL - 0.04, 0, 7.3, 0.22, WOOD, { geo: GEO.cyl20 });
    for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; k.box(Math.cos(a) * 6.4, GYL + 0.19, Math.sin(a) * 6.4, 1.9, 0.02, 0.06, WOOD_D, { ry: -a, ink: 0 }); }
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * TAU, b2 = ((i + 1) / 20) * TAU, x = Math.cos(a) * 7.15, z = Math.sin(a) * 7.15, x2 = Math.cos(b2) * 7.15, z2 = Math.sin(b2) * 7.15;
      k.cyl(x, GYL + 0.18, z, 0.06, 0.95, WOOD_D, { geo: GEO.cyl6, ink: 0.006 });
      k.beam(x, GYL + 1.12, z, x2, GYL + 1.12, z2, 0.09, WOOD, { ink: 0.006 }).beam(x, GYL + 0.62, z, x2, GYL + 0.62, z2, 0.05, WOOD_D, { ink: 0 });
      if (i % 2 === 0 && Math.abs(angDiff(a, Math.PI / 2)) > 0.5) k.beam(Math.cos(a) * (TR + 0.02), GYL - 2.0, Math.sin(a) * (TR + 0.02), Math.cos(a) * 6.9, GYL - 0.1, Math.sin(a) * 6.9, 0.16, WOOD_D);
    }
    // the cap: a red wooden drum, the windshaft out toward the square, then the belfry and the roof
    const C0 = TT, CH = 1.7, hubY = C0 + CH * 0.5;
    k.cyl(0, C0 - 0.1, 0, rAt(TT) + 0.45, CH, '#9a3f2e', { geo: GEO.cyl20 });
    for (let i = 0; i < 20; i++) { const a = (i / 20) * TAU; k.box(Math.cos(a) * (rAt(TT) + 0.46), C0 + CH / 2 - 0.1, Math.sin(a) * (rAt(TT) + 0.46), 0.04, CH - 0.1, 0.06, '#7a2f22', { ry: -a, ink: 0 }); }
    k.cyl(0, C0 + CH - 0.15, 0, rAt(TT) + 0.62, 0.2, '#7a2f22', { geo: GEO.cyl20, ink: 0.01 });
    k.frame(M.x, base, M.z, M.yaw);
    const shaft = rAt(TT) + 1.3;
    k.add(GEO.cyl8, 0, hubY, shaft / 2, 0.42, shaft, 0.42, WOOD_D, { rx: Math.PI / 2 }).add(GEO.cyl8, 0, hubY, rAt(TT) + 0.5, 0.75, 0.8, 0.75, '#7a2f22', { rx: Math.PI / 2 });
    out.rotors.push({ x: M.x, y: base + hubY, z: M.z, yaw: M.yaw, fwd: shaft + 0.25, s: 1.5, speed: 0.36, ang: 0.4, great: true });
    k.frame(M.x, base, M.z, 0);
    const B0 = C0 + CH + 0.05, BH = 2.3, BR = 3.6;
    k.cyl(0, B0 - 0.1, 0, rAt(TT) + 0.2, 0.25, STONE_L, { geo: GEO.cyl20 });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + Math.PI / 6, x = Math.cos(a) * BR, z = Math.sin(a) * BR;
      k.post(x, B0, z, 0.55, BH, 0.55, WHITE3);
      const am = a + Math.PI / 6, mx = Math.cos(am) * BR * Math.cos(Math.PI / 6), mz = Math.sin(am) * BR * Math.cos(Math.PI / 6);
      k.add(GEO.arch, mx, B0 + BH - 0.05, mz, BR * Math.sin(Math.PI / 6) - 0.1, 0.8, 1.3, WHITE3, { ry: -am + Math.PI / 2 });
    }
    k.cyl(0, B0 + BH + 0.7, 0, BR + 0.6, 0.38, WHITE3, { geo: GEO.cyl20 });
    k.box(0, B0 + BH + 0.55, 0, 2 * BR - 0.2, 0.22, 0.22, WOOD_D, { ry: 0.3 });             // the beam the bell hangs from
    const RF0 = B0 + BH + 1.06, RFH = 3.4;
    k.add(GEO.cone16, 0, RF0 + RFH / 2, 0, BR + 1.2, RFH, BR + 1.2, '#c45a3c');
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + 0.1; k.beam(Math.cos(a) * (BR + 1.16), RF0 + 0.02, Math.sin(a) * (BR + 1.16), 0, RF0 + RFH - 0.15, 0, 0.09, '#9a4232', { ink: 0 }); }
    k.cyl(0, RF0 + RFH - 0.1, 0, 0.08, 1.5, IRON, { geo: GEO.cyl6, ink: 0 }).ball(0, RF0 + RFH + 0.5, 0, 0.18, '#e6b84a', { ink: 0.006 });
    out.vanes.push({ p: new THREE.Vector3(M.x, base + RF0 + RFH + 1.15, M.z + 0.12), yaw: M.yaw, s: 0.2, hush: 1 });
    out.bellAt = new THREE.Vector3(M.x, base + B0 + BH + 0.42, M.z);
    out.mill = { base, top: base + RF0 + RFH, hubY: base + hubY, gallery: base + GYL };
    // the forecourt: sacks waiting for flour that doesn't come, a cart, a millstone leaning on the plinth
    k.hush = 0;
    k.frame(M.x, GY, M.z + M.step + 3.0, 0);
    sacks(k, out, -3.6, 1.6, 4, rng(41), 0.3); sacks(k, out, 3.8, 1.2, 3, rng(42), -0.4);
    k.frame(M.x - M.step - 0.55, GY, M.z + 2.0, Math.PI / 2);
    k.add(GEO.cyl20, 0, 0.92, 0, 0.92, 0.3, 0.92, '#c9c1b0', { rx: Math.PI / 2 - 0.12 }).add(GEO.cyl8, 0, 0.92, 0.04, 0.16, 0.34, 0.16, '#8f8878', { rx: Math.PI / 2 - 0.12, ink: 0 });
    worldCol(k, out, 0, 0, 0.6);
  }

  // ------------------------------------------------------------ the hill windmills (La Mancha style): white tower, dark cap, tail pole
  function drawWindmill(k, out, m, gy) {
    const s = m.s;
    let lo = 1e9; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; lo = Math.min(lo, gy(m.x + Math.cos(a) * 2.3 * s, m.z + Math.sin(a) * 2.3 * s)); }
    const y0 = Math.min(lo, gy(m.x, m.z)), rb = 2.05 * s, rt = rb * 0.82, Ht = 7.6 * s, top = 0.3 + Ht;
    k.frame(m.x, y0, m.z, m.yaw);
    k.cyl(0, -1.2, 0, rb + 0.34, 1.55, STONE, { geo: GEO.cyl16 });
    k.add(GEO.taper, 0, 0.3 + Ht / 2, 0, rb, Ht, rb, WHITE);
    k.cyl(0, 0.3, 0, rb + 0.03, 0.5, '#e6dccb', { geo: GEO.cyl16, ink: 0.008 });
    k.cyl(0, top - 0.16, 0, rt + 0.08, 0.32, BEAM, { geo: GEO.cyl16, ink: 0.01 });
    k.add(GEO.cone16, 0, top + 1.3 * s, 0, rt + 0.46 * s, 2.6 * s, rt + 0.46 * s, CAP).ball(0, top + 2.66 * s, 0, 0.16 * s, CAP_D);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; k.beam(Math.cos(a) * (rt + 0.44 * s), top + 0.03, Math.sin(a) * (rt + 0.44 * s), 0, top + 2.5 * s, 0, 0.06, CAP_D, { ink: 0 }); }
    const hubY = top + 0.66 * s, fwd = rt + 0.9 * s;
    k.add(GEO.cyl8, 0, hubY, fwd / 2 + 0.1, 0.2 * s, fwd + 0.2, 0.2 * s, WOOD_D, { rx: Math.PI / 2 });
    // the tail pole the miller turns the cap with, down to a little wheel and a ring of stakes
    const tz = -(rt + 4.4 * s);
    k.beam(0, top + 0.4 * s, -rt * 0.8, 0, 0.75, tz, 0.2 * s, WOOD_D).beam(0.0, top - 0.3, -rt * 0.95, 0, 1.2, tz * 0.72, 0.13 * s, WOOD, { ink: 0.006 });
    k.add(GEO.cyl16, 0, 0.5, tz, 0.48, 0.12, 0.48, WOOD, { rz: Math.PI / 2 }).add(GEO.cyl8, 0, 0.5, tz, 0.08, 0.3, 0.08, IRON, { rz: Math.PI / 2, ink: 0 });
    // a door to one side, small windows
    k.frame(m.x, y0, m.z, m.yaw + Math.PI / 2);
    door(k, 0, rb - 0.1, '#6b4228', { round: true });
    sack(k, 1.05, 0, rb + 0.25, 0.85, 0.5); sack(k, 1.55, 0, rb - 0.1, 0.8, 1.1);
    for (const [da, y] of [[2.4, 3.4], [-2.0, 5.2], [0.8, 6.6]]) { k.frame(m.x, y0, m.z, m.yaw + da); const rr = rb - (rb - rt) * (y * s - 0.3) / Ht; k.box(0, y * s, rr - 0.02, 0.52, 0.62, 0.12, WHITE3, { ink: 0.006 }).box(0, y * s, rr + 0.02, 0.36, 0.46, 0.1, '#3a3040', { ink: 0 }); }
    out.colliders.push({ x: m.x, z: m.z, r: rb + 0.25 });
    const tw = new THREE.Vector3(0, 0, tz).applyAxisAngle(new THREE.Vector3(0, 1, 0), m.yaw); out.colliders.push({ x: m.x + tw.x, z: m.z + tw.z, r: 0.45 });
    out.rotors.push({ x: m.x, y: y0 + hubY, z: m.z, yaw: m.yaw, fwd: fwd + 0.15, s, speed: m.speed, ang: m.phase });
    out.hillProps.push({ what: 'windmill', x: m.x, z: m.z, r: rb + 0.3 });
  }

  // ------------------------------------------------------------ trees (town.js's, plus olives and poplars for the dry hills)
  const TREES = {
    round(k, s, R) { k.cyl(0, 0, 0, 0.2 * s, 2.3 * s, '#8a5f3e', { b: 'sway', geo: GEO.cyl8 }); [[0, 2.9, 0, 1.15], [0.85, 2.55, 0.3, 0.85], [-0.8, 2.6, -0.2, 0.9], [0.15, 3.55, -0.25, 0.8], [-0.25, 2.5, 0.8, 0.78], [0.35, 2.55, -0.8, 0.78]].forEach(([x, y, z, r], i) => k.ball(x * s, y * s, z * s, r * s, ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653', '#55a346', '#4b973f'][i], { b: 'sway', geo: GEO.ico1, sway: { y0: 1.4 * s, y1: 4 * s, k: 1 } })); },
    big(k, s, R) { k.cyl(0, 0, 0, 0.42 * s, 3.0 * s, '#7c5436', { b: 'sway', geo: GEO.cyl8 }); [[0, 4.0, 0, 1.8], [1.45, 3.5, 0.4, 1.35], [-1.35, 3.6, -0.3, 1.45], [0.3, 5.0, -0.4, 1.25], [-0.5, 3.5, 1.25, 1.25], [0.6, 3.6, -1.25, 1.25]].forEach(([x, y, z, r], i) => k.ball(x * s, y * s, z * s, r * s, ['#4a9440', '#55a346', '#4f9c3f', '#62b04c', '#4b973f', '#5aa84a'][i], { b: 'sway', geo: GEO.ico1, sway: { y0: 2 * s, y1: 5.5 * s, k: 0.8 } })); },
    cypress(k, s, R) { k.cyl(0, 0, 0, 0.14 * s, 0.8 * s, '#7c5436', { b: 'sway', geo: GEO.cyl6 }); k.ball(0, 2.3 * s, 0, 0.75 * s, '#3f7f45', { b: 'sway', ry2: 2.0 * s, geo: GEO.ico1, sway: { y0: 0.8 * s, y1: 4.2 * s, k: 0.6 } }); k.ball(0.1 * s, 3.6 * s, 0, 0.45 * s, '#4a8a4e', { b: 'sway', ry2: 1.0 * s, geo: GEO.ico1, sway: { y0: 0.8 * s, y1: 4.2 * s, k: 0.6 } }); },
    poplar(k, s, R) { k.cyl(0, 0, 0, 0.16 * s, 1.4 * s, '#8a7a5e', { b: 'sway', geo: GEO.cyl6 }); k.ball(0, 3.5 * s, 0, 0.95 * s, '#6aa84a', { b: 'sway', ry2: 2.7 * s, geo: GEO.ico1, sway: { y0: 1.2 * s, y1: 6 * s, k: 0.7 } }); k.ball(0.25 * s, 2.6 * s, 0.2 * s, 0.7 * s, '#7cb85a', { b: 'sway', ry2: 1.3 * s, geo: GEO.ico1, sway: { y0: 1.2 * s, y1: 6 * s, k: 0.7 } }); },
    olive(k, s, R) {
      k.beam(0, -0.1, 0, 0.25 * s, 1.3 * s, 0.1 * s, 0.32 * s, '#7a6a5a', { b: 'sway', geo: GEO.cyl8 }).beam(0.25 * s, 1.3 * s, 0.1 * s, -0.3 * s, 1.9 * s, -0.1 * s, 0.22 * s, '#7a6a5a', { b: 'sway', geo: GEO.cyl8 }).beam(0.25 * s, 1.3 * s, 0.1 * s, 0.75 * s, 1.85 * s, 0.2 * s, 0.2 * s, '#7a6a5a', { b: 'sway', geo: GEO.cyl8 });
      [[0, 2.35, 0, 1.15], [0.95, 2.1, 0.3, 0.85], [-0.85, 2.15, -0.2, 0.9], [0.2, 2.25, 0.95, 0.75], [-0.3, 2.2, -0.9, 0.8]].forEach(([x, y, z, r], i) => k.ball(x * s, y * s, z * s, r * s, OLIVE[i], { b: 'sway', ry2: r * s * 0.62, geo: GEO.ico1, sway: { y0: 1.2 * s, y1: 3 * s, k: 0.6 } }));
    },
    bush(k, s, R) { for (let i = 0; i < 3; i++) k.ball((i - 1) * 0.42 * s, 0.38 * s, (R() - 0.5) * 0.3 * s, (0.45 + R() * 0.12) * s, ['#4f9c3f', '#5aa84a', '#469240'][i], { b: 'sway', geo: GEO.ico1, sway: { y0: 0.2, y1: 1.2 * s, k: 0.25 } }); if (R() < 0.6) for (let i = 0; i < 4; i++) k.add(GEO.ico0, (R() - 0.5) * 1.1 * s, (0.6 + R() * 0.25) * s, (R() - 0.5) * 0.5 * s, 0.09, 0.09, 0.09, pick(FLOWERS, R), { b: 'sway', ink: 0 }); },
  };
  function tree(k, out, kind, x, z, s, R, y, colR) { k.frame(x, y, z, R() * TAU); TREES[kind](k, s, R); if (colR !== 0) out.colliders.push({ x, z, r: colR || (kind === 'big' ? 0.75 * s : kind === 'bush' ? 0.7 * s : kind === 'olive' ? 0.5 * s : 0.42 * s) }); out.trees.push({ x, z, r: kind === 'bush' ? 1.0 : 1.4 }); }

  // ------------------------------------------------------------ the hills: windmills, the farm, the pass, paths, the wheat's ground
  function drawHills(k, out, gy) {
    out.hillProps = out.hillProps || [];
    const note = (what, x, z, r) => out.hillProps.push({ what, x, z, r });
    for (const m of MILLS) drawWindmill(k, out, m, gy);
    // the farmhouse (whitewashed, like the town) and the barn
    {
      const h = { ...FARM.house, floors: 1, style: 'cottage', seed: 0.41, wall: WHITE, band: '#3f6fb5', roof: '#c9643f', door: '#4f7f4a', shutter: '#4f7f4a' };
      const y0 = Math.min(...corners({ x: h.x, z: h.z, hw: h.w / 2, hd: h.d / 2, rot: h.rot }).map(([x, z]) => gy(x, z)));
      drawHouse(k, h, y0, out, { slots: 3, doorSlot: 1, smoke: true, round: false, lamp: true, sheaf: true, vane: true });
      out.colliders.push({ obox: 1, x: h.x, z: h.z, hw: h.w / 2 + 0.12, hd: h.d / 2 + 0.12, rot: h.rot }); note('farmhouse', h.x, h.z, 4.8);
      k.frame(h.x, y0, h.z, h.rot);
      bench(k, out, -2.2, h.d / 2 + 0.75, 0, '#4f7f4a');
      for (let i = 0; i < 9; i++) k.cyl(h.w / 2 + 0.45, 0.15 + (i % 3) * 0.26, -1.0 + (i / 3 | 0) * 0.5, 0.13, 0.5, '#b07a48', { rz: Math.PI / 2, geo: GEO.cyl6, ink: 0.006 });
      worldBox(k, out, h.w / 2 + 0.45, -0.5, 0.35, 0.85);
    }
    {
      const b = FARM.barn, y0 = Math.min(...corners({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot }).map(([x, z]) => gy(x, z)));
      k.frame(b.x, y0, b.z, b.rot);
      const { w, d } = b, H = 3.5, RED = '#a8473a', REDD = '#8a3a30', TW = '#f4ede0';
      k.post(0, -0.8, 0, w + 0.24, 1.1, d + 0.24, STONE).post(0, 0.3, 0, w, H - 0.3, d, RED);
      for (let i = 1; i < 12; i++) for (const s of [-1, 1]) k.box(-w / 2 + (w * i) / 12, 0.3 + (H - 0.3) / 2, s * (d / 2 + 0.02), 0.05, H - 0.3, 0.04, REDD, { ink: 0 });
      for (let i = 1; i < 10; i++) for (const s of [-1, 1]) k.box(s * (w / 2 + 0.02), 0.3 + (H - 0.3) / 2, -d / 2 + (d * i) / 10, 0.04, H - 0.3, 0.05, REDD, { ink: 0 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 + 0.02), 0.3, sz * (d / 2 + 0.02), 0.2, H - 0.3, 0.2, TW, { ink: 0.006 });
      const dw = 3.4, dh = 2.8;
      k.box(0, 0.3 + dh / 2 + 0.05, d / 2 + 0.05, dw + 0.32, dh + 0.18, 0.08, TW);
      for (const s of [-1, 1]) {
        const cx = s * dw / 4, hw2 = dw / 4 - 0.12;
        k.box(cx, 0.3 + dh / 2, d / 2 + 0.1, dw / 2 - 0.06, dh, 0.08, RED, { ink: 0.006 });
        k.beam(cx - hw2, 0.42, d / 2 + 0.16, cx + hw2, 0.3 + dh - 0.12, d / 2 + 0.16, 0.12, TW, { t2: 0.05, ink: 0 }).beam(cx + hw2, 0.42, d / 2 + 0.16, cx - hw2, 0.3 + dh - 0.12, d / 2 + 0.16, 0.12, TW, { t2: 0.05, ink: 0 });
        for (const y of [0.42, 0.3 + dh - 0.12]) k.box(cx, y, d / 2 + 0.16, dw / 2 - 0.1, 0.12, 0.05, TW, { ink: 0 });
      }
      const hR = gableRoofZ(k, w, d, H, 0.78, '#8f4a3a', RED);
      k.box(0, H + 0.95, d / 2 + 0.06, 1.3, 1.25, 0.08, TW).box(0, H + 0.9, d / 2 + 0.1, 1.06, 1.0, 0.06, '#4a2a22', { ink: 0 });
      k.ball(0, H + 0.55, d / 2 + 0.28, 0.5, HAY, { ry2: 0.2, rz2: 0.32, geo: GEO.ico1, ink: 0.01 });
      for (let i = 0; i < 6; i++) k.beam(-0.4 + i * 0.16, H + 0.62, d / 2 + 0.3, -0.5 + i * 0.2, H + 0.32, d / 2 + 0.62, 0.025, HAY_D, { ink: 0 });
      k.box(0, H + hR - 0.35, d / 2 + 0.6, 0.18, 0.18, 1.5, WOOD_D).beam(0, H + hR - 0.4, d / 2 + 1.3, 0, H + 0.25, d / 2 + 1.3, 0.02, '#c9b48e', { ink: 0 });
      out.colliders.push({ obox: 1, x: b.x, z: b.z, hw: w / 2 + 0.12, hd: d / 2 + 0.12, rot: b.rot }); note('barn', b.x, b.z, 5.6);
      out.vanes.push({ p: k.world(0, H + hR + 1.2, 0.1), yaw: b.rot + 0.4, s: 0.11 });
      k.cyl(0, H + hR + 0.15, 0, 0.035, 0.95, IRON, { geo: GEO.cyl6, ink: 0 });
    }
    // the sheep pen (rails), with its gate standing open toward the yard
    {
      const p = FARM.pen;
      k.frame(0, 0, 0, 0);
      const run = (x1, z1, x2, z2) => {           // a fence that follows the ground: one section at a time
        const L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.round(L / 2.2));
        for (let i = 0; i < n; i++) { const ax = lerp(x1, x2, i / n), az = lerp(z1, z2, i / n), bx = lerp(x1, x2, (i + 1) / n), bz = lerp(z1, z2, (i + 1) / n), y = (gy(ax, az) + gy(bx, bz)) / 2; k.frame(0, y, 0, 0); fenceRun(k, out, ax, az, bx, bz, { step: 1.1 }); }
      };
      run(p.x0, p.z1, p.x1, p.z1); run(p.x0, p.z0, p.x1, p.z0); run(p.x0, p.z0, p.x0, p.z1);
      run(p.x1, p.z0, p.x1, -164.4); run(p.x1, -161.2, p.x1, p.z1);
      k.frame(p.x1, gy(p.x1, -161.2), -161.2, 0); fenceRun(k, null, 0, 0, 2.2, 1.6, { step: 0.9, rails: [0.3, 0.6, 0.9] });
      note('pen', (p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2, 0);
      // a water trough and a sack of feed by the gate
      const tx = p.x1 + 1.0, tz = -165.6, ty = gy(tx, tz);
      k.frame(tx, ty, tz, 0.1);
      k.post(0, 0.12, 0, 0.8, 0.5, 1.9, WOOD).box(0, 0.6, 0, 0.62, 0.04, 1.7, '#5fb8d6', { ink: 0 });
      for (const s of [-1, 1]) k.post(0, -0.2, s * 0.75, 0.9, 0.34, 0.14, WOOD_D);
      worldBox(k, out, 0, 0, 0.45, 1.0); note('trough', tx, tz, 1.0);
      sack(k, 0.9, 0, -0.6, 0.8, 0.6, '#d9c39c');
    }
    // hay: big stacks by the barn, round bales in the yard
    const R = rng(616);
    for (const [x, z, s] of [[138.6, -171.4, 1.0], [141.6, -173.6, 0.85], [138.2, -175.6, 0.7]]) {
      const y = gy(x, z); k.frame(x, y, z, R() * 3);
      k.add(GEO.half, 0, -0.1, 0, 1.45 * s, 1.75 * s, 1.45 * s, HAY).ball(0, 1.6 * s, 0, 0.3 * s, HAY_D, { geo: GEO.ball5 });
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; k.beam(Math.cos(a) * 1.2 * s, 0.25, Math.sin(a) * 1.2 * s, Math.cos(a) * 1.5 * s, 0.05, Math.sin(a) * 1.5 * s, 0.03, HAY_D, { ink: 0 }); }
      k.beam(-0.4, 0, 1.2 * s, 0.1, 2.3 * s, 0.2, 0.06, WOOD_D, { ink: 0.005 });
      out.colliders.push({ x, z, r: 1.4 * s }); note('haystack', x, z, 1.5 * s);
    }
    for (const [x, z, ry] of [[124.4, -169.8, 0.3], [126.2, -170.9, -0.2], [125.2, -170.1, 0.1]]) {
      const y = gy(x, z), up = x === 125.2 ? 1.0 : 0;
      k.frame(x, y + up, z, ry);
      if (up) { k.add(GEO.cyl20, 0, 0.55, 0, 0.55, 0.95, 0.55, HAY, {}); }
      else { k.add(GEO.cyl20, 0, 0.55, 0, 0.55, 1.0, 0.55, HAY, { rz: Math.PI / 2 }); for (const s of [-1, 1]) k.add(GEO.cyl20, s * 0.51, 0.55, 0, 0.42, 0.02, 0.42, HAY_D, { rz: Math.PI / 2, ink: 0 }); out.colliders.push({ x, z, r: 0.7 }); note('bale', x, z, 0.7); }
    }
    // the farm dog's spot, Marga's track, the cart's shed (a lean-to), a woodpile
    out.dogSpot = { x: 109.2, z: -162.6, yaw: -2.4 };
    // beehives (Inés's honey), the signpost, the scarecrow, rocks, trees
    for (const [x, z] of HIVES) {
      const y = gy(x, z); k.frame(x, y, z, 0.15);
      k.post(0, 0, 0, 0.7, 0.32, 0.7, WOOD_D);
      ['#f4ede0', '#f2c14e', '#3f6fb5'].forEach((c, i) => k.post(0, 0.32 + i * 0.36, 0, 0.82, 0.34, 0.82, c, { ink: 0.008 }));
      k.add(GEO.cone4, 0, 1.4, 0, 0.75, 0.34, 0.75, '#c9643f').box(0, 0.5, 0.42, 0.3, 0.06, 0.04, '#2b2235', { ink: 0 });
      out.colliders.push({ x, z, r: 0.5 }); note('hive', x, z, 0.6);
    }
    out.hives = HIVES.map(([x, z]) => ({ x, z, y: gy(x, z) + 1.2 }));
    {
      const S = SIGNPOST, y = gy(S.x, S.z); k.frame(S.x, y, S.z, 0);
      k.cyl(0, 0, 0, 0.09, 2.7, WOOD, { geo: GEO.cyl8 }).ball(0, 2.72, 0, 0.1, WOOD);
      // an arrow east (a little windmill: Molinar) and one west (a bell: Alba)
      for (const [dir, y2, c] of [[1, 2.2, '#c9643f'], [-1, 1.72, '#3e7fb0']]) {
        k.box(dir * 0.62, y2, 0, 1.1, 0.34, 0.07, c).add(GEO.cone4, dir * 1.3, y2, 0, 0.24, 0.24, 0.05, c, { rz: -dir * Math.PI / 2, ink: 0.006 });
        if (dir > 0) { k.box(0.6, y2, 0.06, 0.12, 0.22, 0.04, WHITE3, { ink: 0 }).add(GEO.cone4, 0.6, y2 + 0.1, 0.06, 0.1, 0.1, 0.03, CAP, { ink: 0 }); for (let i = 0; i < 4; i++) k.box(0.6, y2 + 0.06, 0.09, 0.03, 0.22, 0.01, WHITE3, { rz: i * Math.PI / 2 + 0.4, ink: 0 }); }
        else k.add(GEO.half, -0.6, y2 - 0.08, 0.06, 0.1, 0.16, 0.06, '#e6b84a', { ink: 0 });
      }
      out.colliders.push({ x: S.x, z: S.z, r: 0.2 }); note('signpost', S.x, S.z, 0.5);
    }
    {
      const S = SCARECROW, y = gy(S.x, S.z); k.frame(S.x, y, S.z, -0.5);
      k.cyl(0, 0, 0, 0.06, 2.4, '#8a5f3e', { geo: GEO.cyl6 }).box(0, 1.75, 0, 1.7, 0.08, 0.08, '#8a5f3e');
      k.ball(0, 2.38, 0, 0.3, '#e8c78f', { ry2: 0.33 }).add(GEO.cone, 0, 2.78, 0, 0.62, 0.36, 0.62, HAY_D).add(GEO.cyl20, 0, 2.62, 0, 0.66, 0.05, 0.66, HAY, { ink: 0.006 });
      k.post(0, 1.0, 0, 0.82, 0.9, 0.38, '#6f8fc9').box(0, 1.25, 0.2, 0.2, 0.2, 0.02, '#e0503f', { ink: 0 });
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) k.beam(s * 0.85, 1.75, 0, s * 1.0, 1.55 - i * 0.05, (i - 1) * 0.08, 0.025, HAY, { ink: 0 });
      out.colliders.push({ x: S.x, z: S.z, r: 0.3 }); note('scarecrow', S.x, S.z, 0.4);
    }
    for (const r of HROCKS) {
      const y = gy(r.x, r.z), Rr = rng(Math.round(r.x * 7 + r.z * 3));
      k.frame(r.x, y, r.z, Rr() * 3);
      k.add(GEO.ico1, 0, r.s * 0.25, 0, r.s * 1.1, r.s * 0.8, r.s * 0.95, Rr() < 0.5 ? '#a9a596' : '#b3ae9c', { rx: Rr() * 0.5 });
      if (r.s > 1) k.add(GEO.ico1, r.s * 0.75, r.s * 0.05, r.s * 0.35, r.s * 0.55, r.s * 0.45, r.s * 0.5, '#9d998b', { ry: 1 });
      k.add(GEO.half, -r.s * 0.1, r.s * 0.7, 0, r.s * 0.6, r.s * 0.2, r.s * 0.5, '#7f9a52', { ink: 0 });
      out.colliders.push({ x: r.x, z: r.z, r: r.s * 1.05 }); note('rock', r.x, r.z, r.s * 1.15);
    }
    for (const t of HTREES) { const y = gy(t.x, t.z) - 0.1; tree(k, out, t.kind, t.x, t.z, t.s, rng(Math.round(t.x * 31 + t.z)), y); note('tree:' + t.kind, t.x, t.z, t.kind === 'big' ? 2.2 : t.kind === 'olive' ? 1.5 : 1.0); }
    // fences along the fields' road sides, little stone cairns at the field corners
    for (const f of FIELDS) {
      const near = f.z < -150 ? [[-f.hw - 0.3, f.hd + 0.4], [f.hw + 0.3, f.hd + 0.4]] : [[-f.hw - 0.3, -f.hd - 0.4], [f.hw + 0.3, -f.hd - 0.4]];
      const [A, B] = near.map(([a, b]) => toWorld(f, a, b)), L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.round(L / 2.2));
      for (let i = 0; i < n; i++) { if (f.id === 'south2' && i === 2) continue; const ax = lerp(A[0], B[0], i / n), az = lerp(A[1], B[1], i / n), bx = lerp(A[0], B[0], (i + 1) / n), bz = lerp(A[1], B[1], (i + 1) / n); k.frame(0, (gy(ax, az) + gy(bx, bz)) / 2, 0, 0); fenceRun(k, out, ax, az, bx, bz, { step: 1.1, h: 0.8, rails: [0.32, 0.66], color: '#c9a77a' }); }
      note('fence:' + f.id, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, 0);
      out.hillProps.push({ what: 'fenceEnd', x: A[0], z: A[1], r: 0.15 }, { what: 'fenceEnd', x: B[0], z: B[1], r: 0.15 });
    }
    // the ground: the yard, the track, the paths, trampled rings round the mills, stubble under the wheat
    k.raw(drapeEllipse(gy, FARM.yard, 0.05, 1.1), '#e6cfa2');
    k.raw(drapeRect(gy, TRACK_BOX, 0.07, 0.7), '#d8bd8c');
    for (const s of [-1, 1]) k.raw(drapeRect(gy, { ...TRACK_BOX, z: TRACK_BOX.z + s * 0.62, hd: 0.12 }, 0.085, 0.7), '#b99a68');
    if (typeof WORLD === 'undefined') for (const p of HPATHS) k.raw(drapeRibbon(gy, p.pts, p.w, 0.06), '#e2cb9c');     // (in the game, world.js paints them into the ground)
    for (const m of MILLS) k.raw(drapeEllipse(gy, { x: m.x, z: m.z, rx: 3.4 * m.s, rz: 3.4 * m.s }, 0.05), '#dcc49a');
    for (const f of FIELDS) k.raw(drapeRect(gy, { ...f, hw: f.hw + 0.35, hd: f.hd + 0.35 }, 0.04, 1.4), '#b8973e');
  }

  // ------------------------------------------------------------ the town's gate, square, well, stalls, lamps, props
  function drawGate(k, out, gy) {
    const gx = 173, gz = -150, y0 = gy(gx, gz);
    k.frame(gx, y0, gz, -Math.PI / 2);        // the gate faces west, down the road
    const PX = 2.75;
    for (const s of [-1, 1]) {
      k.post(s * PX, -0.4, 0, 1.0, 4.9, 1.0, WHITE).post(s * PX, -0.4, 0, 1.06, 1.0, 1.06, '#3f6fb5', { ink: 0.008 });
      k.add(GEO.cone4, s * PX, 4.5, 0, 0.82, 0.62, 0.82, '#c9643f').ball(s * PX, 5.18, 0, 0.13, '#e6b84a', { ink: 0.006 });
      lantern(k, s * (PX + 0.72), 2.65, 0.0); k.box(s * (PX + 0.6), 2.95, 0, 0.3, 0.05, 0.05, IRON, { ink: 0 });
      // low white walls running out to the sides, with pots of geraniums along the top
      k.post(s * 5.6, -0.4, 0.1, 4.8, 1.5, 0.7, WHITE).post(s * 5.6, -0.4, 0.1, 4.86, 0.75, 0.76, '#3f6fb5', { ink: 0.008 }).box(s * 5.6, 1.12, 0.1, 4.9, 0.12, 0.82, '#c9643f');
      for (let i = 0; i < 3; i++) { const x = s * (4.2 + i * 1.4); k.cyl(x, 1.18, 0.1, 0.17, 0.26, POT, { geo: GEO.cyl8, ink: 0.005 }).add(GEO.ico0, x, 1.55, 0.1, 0.24, 0.17, 0.22, LEAF, { ink: 0 }).add(GEO.ico0, x + 0.06, 1.66, 0.14, 0.09, 0.09, 0.09, FLOWERS[i % 2], { ink: 0 }); }
      worldBox(k, out, s * PX, 0, 0.55, 0.55); worldBox(k, out, s * 5.6, 0.1, 2.45, 0.4);
      sheaf(k, s * (PX - 0.15), 0.85, 0.62, 0.9, { lean: -s * 0.1 });
    }
    // the arch, whitewashed, with a terracotta coping
    k.post(0, 3.65, 0, PX * 2 + 1.0, 1.0, 1.0, WHITE);
    const arc = [];
    for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI; arc.push([-Math.cos(a) * (PX - 0.5), 2.9 + Math.sin(a) * 0.75]); }
    for (let i = 0; i < arc.length - 1; i++) k.beam(arc[i][0], arc[i][1], 0, arc[i + 1][0], arc[i + 1][1], 0, 0.36, WHITE, { t2: 1.0, ink: 0.008 });
    k.add(GEO.prism, 0, 4.65, 0, PX * 2 + 1.3, 0.55, 1.3, '#c9643f');
    // a little windmill on top of the gate: a white drum and a cap (the sails are instanced)
    k.cyl(0, 5.1, 0, 0.55, 1.1, WHITE, { geo: GEO.cyl16 }).add(GEO.cone16, 0, 6.5, 0, 0.75, 0.8, 0.75, CAP).add(GEO.cyl8, 0, 5.95, 0.45, 0.07, 0.6, 0.07, WOOD_D, { rx: Math.PI / 2, ink: 0 });
    out.rotors.push({ x: gx, y: y0 + 5.95, z: gz, yaw: -Math.PI / 2, fwd: 0.78, s: 0.17, speed: 1.2, ang: 0, lite: true });
    out.gateSign = { at: k.world(0, 4.12, 0.53), rot: -Math.PI / 2 };
    // the east, north and south ways out: stone markers with a sheaf carved on top
    for (const p of [LM.eastGate, LM.northGate, LM.southGate]) {
      const ang = Math.atan2(p.x - CEN.x, p.z - CEN.z);
      k.frame(p.x, gy(p.x, p.z), p.z, ang);
      for (const s of [-1, 1]) { k.post(s * 2.9, -0.3, 0, 0.62, 1.6, 0.62, WHITE).add(GEO.cone4, s * 2.9, 1.3, 0, 0.5, 0.4, 0.5, '#c9643f'); worldBox(k, out, s * 2.9, 0, 0.33, 0.33); }
    }
  }
  function drawWell(k, out) {
    k.frame(SQ.x, GY, SQ.z, 0.4);
    const wall = new THREE.LatheGeometry([[1.25, 0], [1.62, 0], [1.66, 0.82], [1.72, 0.86], [1.72, 0.98], [1.22, 0.98], [1.18, 0.9]].map(([x, y]) => new THREE.Vector2(x, y)), 24);
    k.add(wall, 0, 0, 0, 1, 1, 1, '#e8e0cf', { ink: 0.022 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; k.box(Math.cos(a) * 1.65, 0.42, Math.sin(a) * 1.65, 0.05, 0.3, 0.6, '#d5cab4', { ry: -a, ink: 0 }); }
    k.add(GEO.disc, 0, 0.55, 0, 1.22, 1, 1.22, '#2f5f80', { ink: 0 });
    for (const s of [-1, 1]) k.post(s * 1.45, 0.9, 0, 0.2, 2.2, 0.2, WOOD_D);
    k.add(GEO.cyl8, 0, 2.3, 0, 0.13, 2.7, 0.13, WOOD, { rz: Math.PI / 2 }).add(GEO.cyl8, 1.48, 2.3, 0.22, 0.04, 0.4, 0.04, WOOD_D, { rx: Math.PI / 2, ink: 0 });
    k.beam(0, 2.25, 0, 0, 1.55, 0, 0.02, '#c9b48e', { ink: 0 });
    k.cyl(0, 1.25, 0, 0.2, 0.3, WOOD_L, { geo: GEO.cyl8 }).cyl(0, 1.48, 0, 0.21, 0.04, IRON, { geo: GEO.cyl8, ink: 0 });
    k.add(GEO.prism, 0, 3.05, 0, 3.4, 0.85, 2.0, '#c9643f', { ry: 0 });
    k.box(0, 3.05, 0, 3.3, 0.12, 0.2, WOOD_D);
    // a tall pole for the bunting, with a little windmill on top
    k.cyl(0, 3.6, 0, 0.07, 3.6, WOOD_D, { geo: GEO.cyl8 }).cyl(0, 7.0, 0, 0.22, 0.42, WHITE, { geo: GEO.cyl8 }).add(GEO.cone, 0, 7.6, 0, 0.3, 0.38, 0.3, CAP);
    out.rotors.push({ x: SQ.x, y: GY + 7.25, z: SQ.z, yaw: Math.PI * 0.75, fwd: 0.3, s: 0.1, speed: 1.6, ang: 0, lite: true });
    out.poleTop = new THREE.Vector3(SQ.x, GY + 6.9, SQ.z);
    out.colliders.push({ x: SQ.x, z: SQ.z, r: 1.85 });
    // benches round the well, facing out at the stalls
    k.frame(0, GY, 0, 0);
    for (const a of [45, 135, 225, 315]) { const [x, z] = ring(a, 3.9); bench(k, out, x, z, Math.atan2(x - SQ.x, z - SQ.z), '#4f7f4a'); }
  }
  // A market stall in the current frame (front = +z, toward the well). goods: hats, cheese, fruit, sweets, gray, bakery
  function stall(k, out, s) {
    const gray = !!s.hushed, wood = gray ? '#a9a6a2' : '#b07a48', woodD = gray ? '#8f8c88' : '#8d5d38', R = rng(Math.round(s.a * 7));
    const g = c => (gray ? '#' + new THREE.Color(c).lerp(new THREE.Color('#9a9a9e'), 0.8).getHexString() : c);
    k.post(0, 0, 0, 3.0, 0.95, 1.3, wood).box(0, 0.99, 0, 3.2, 0.08, 1.48, woodD);
    for (let i = 0; i < 6; i++) k.box(-1.25 + i * 0.5, 0.48, 0.66, 0.06, 0.9, 0.03, woodD, { ink: 0 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * 1.45, 0, sz * 0.62, 0.11, 2.4, 0.11, woodD);
    stripedAwning(k, 0, 2.48, 0.32, 3.5, 1.9, s.awn, { tilt: 0.26 });
    const top = 1.03;
    if (s.id === 'fruit') {
      crate(k, -0.95, top, 0.05, 0.72, 0, ['#e2453a', '#d93a32']); crate(k, 0, top, 0.05, 0.72, 0, ['#f29a2e', '#f2a83a']); crate(k, 0.95, top, 0.05, 0.72, 0, ['#9cc24e', '#b5d35a']);
      for (let j = 0; j < 7; j++) k.ball(-1.45 + (j % 3) * 0.08, top + 0.62 - (j / 3 | 0) * 0.1, 0.5, 0.055, '#7a4f9a', { geo: GEO.ico0, ink: 0 });
    } else if (s.id === 'bakery') {
      for (let i = 0; i < 5; i++) loaf(k, -1.1 + i * 0.55, top + 0.13, 0.12 + (i % 2) * 0.18, 0.22, i * 0.4);
      for (let i = 0; i < 4; i++) k.ball(-0.9 + i * 0.6, top + 0.08, -0.3, 0.17, '#d9a35a', { ry2: 0.1, geo: GEO.ball5, ink: 0.006 });
      k.cyl(1.0, top, -0.35, 0.22, 0.35, '#c9955a', { geo: GEO.cyl8 }); for (let i = 0; i < 4; i++) k.cyl(0.92 + i * 0.06, top + 0.1, -0.35, 0.045, 0.75, '#e0a85c', { rz: 0.25 - i * 0.15, geo: GEO.cyl6, ink: 0.004 });
    } else if (s.id === 'cheese') {
      for (let i = 0; i < 3; i++) { k.cyl(-1.0 + i * 0.75, top, 0.1, 0.32, 0.22, '#f2c14e', { geo: GEO.cyl20 }); if (i !== 1) k.cyl(-1.0 + i * 0.75, top + 0.22, 0.1, 0.27, 0.18, '#f6d36a', { geo: GEO.cyl20 }); }
      k.box(-0.25, top + 0.32, 0.12, 0.3, 0.18, 0.24, '#f6d36a', { ry: 0.5 });
      for (let i = 0; i < 4; i++) { const x = 0.55 + (i % 2) * 0.32, z = -0.32 + (i >> 1) * 0.3; k.cyl(x, top, z, 0.12, 0.26, '#e69a2e', { geo: GEO.cyl8, ink: 0.005 }).cyl(x, top + 0.26, z, 0.13, 0.06, '#fdf8ee', { geo: GEO.cyl8, ink: 0.004 }).box(x, top + 0.13, z + 0.12, 0.14, 0.1, 0.01, '#fdf8ee', { ink: 0 }); }
    } else if (s.id === 'sweets') {
      const cols = ['#e86a9a', '#8fd3ec', '#f2c14e', '#9cc24e', '#b9a2ff', '#ff6b5a'];
      for (let i = 0; i < 3; i++) { const x = -0.95 + i * 0.6; k.cyl(x, top, 0.1, 0.2, 0.42, '#dff2f8', { geo: GEO.cyl8, ink: 0.005 }).cyl(x, top + 0.42, 0.1, 0.16, 0.08, cols[i], { geo: GEO.cyl8, ink: 0.004 }); for (let j = 0; j < 5; j++) k.ball(x + (R() - 0.5) * 0.2, top + 0.1 + R() * 0.25, 0.1 + (R() - 0.5) * 0.2, 0.05, cols[(i + j) % 6], { geo: GEO.ico0, ink: 0 }); }
      for (let i = 0; i < 4; i++) { const x = 0.75 + (i % 2) * 0.35, z = -0.25 + (i >> 1) * 0.35; k.cyl(x, top, z, 0.02, 0.5, '#fdf8ee', { geo: GEO.cyl6, ink: 0 }).add(GEO.cyl20, x, top + 0.6, z, 0.17, 0.04, 0.17, cols[i + 1], { rx: Math.PI / 2 }); }
      k.cyl(0.95, top, 0.35, 0.25, 0.18, '#fdf8ee', { geo: GEO.cyl20 }).cyl(0.95, top + 0.18, 0.35, 0.2, 0.16, '#e86a9a', { geo: GEO.cyl20 }).ball(0.95, top + 0.4, 0.35, 0.06, '#e0403a', { ink: 0.004 });
    } else if (s.id === 'hats') {
      const hat = (x, z, c, kind, sc = 1) => {
        if (kind === 'straw') k.cyl(x, top, z, 0.34 * sc, 0.03, c, { geo: GEO.cyl20 }).add(GEO.half, x, top + 0.02, z, 0.18 * sc, 0.18 * sc, 0.18 * sc, c).cyl(x, top + 0.05, z, 0.185 * sc, 0.05, '#e0503f', { geo: GEO.cyl20, ink: 0 });
        else if (kind === 'beret') k.ball(x, top + 0.07, z, 0.24 * sc, c, { ry2: 0.08 * sc, geo: GEO.ball5 }).ball(x, top + 0.16, z, 0.03, c, { ink: 0 });
        else k.add(GEO.cone, x, top + 0.22 * sc, z, 0.16 * sc, 0.44 * sc, 0.16 * sc, c).ball(x, top + 0.46 * sc, z, 0.05, '#fdf8ee', { ink: 0 });
      };
      hat(-1.0, 0.1, '#e8c57a', 'straw'); hat(-0.25, 0.2, '#c9443a', 'beret'); hat(0.45, 0.15, '#3f6fb5', 'pointy'); hat(1.05, 0.25, '#4f9a5a', 'beret', 0.8);
      hat(-0.6, -0.35, '#e86a9a', 'straw', 0.6); hat(0.2, -0.35, '#f2c14e', 'pointy', 0.65); hat(0.85, -0.35, '#8a5ab0', 'straw', 0.55);
      k.cyl(-1.75, 0, 0.2, 0.05, 1.7, WOOD_D, { geo: GEO.cyl6 }); for (const [y, c] of [[1.35, '#e8c57a'], [1.7, '#3f6fb5']]) k.cyl(-1.75, y, 0.2, 0.3, 0.03, c, { geo: GEO.cyl20 }).add(GEO.half, -1.75, y + 0.02, 0.2, 0.16, 0.16, 0.16, c);
    } else if (s.id === 'gray') {
      for (let i = 0; i < 3; i++) sack(k, -0.9 + i * 0.9, top - 0.05, 0.05, 0.55, i, g('#d8b07a'));
      for (let i = 0; i < 3; i++) k.cyl(-0.6 + i * 0.6, top, -0.38, 0.1, 0.24, g(['#c9443a', '#e69a2e', '#4f8a4a'][i]), { geo: GEO.cyl8, ink: 0.004 });
    }
    // the sign on the awning's peak: a round board with the stall's picture
    const sy = 3.0, sz = 0.12;
    k.cyl(0, 2.6, 0.05, 0.03, 0.42, woodD, { geo: GEO.cyl6, ink: 0 }).add(GEO.cyl20, 0, sy, sz, 0.34, 0.06, 0.34, gray ? '#c8c6c2' : '#fff4e4', { rx: Math.PI / 2 }).add(GEO.cyl20, 0, sy, sz - 0.03, 0.4, 0.04, 0.4, woodD, { rx: Math.PI / 2 });
    const ic = { fruit: () => k.ball(0, sy, sz + 0.08, 0.16, '#e2453a').ball(0.06, sy + 0.17, sz + 0.08, 0.06, LEAF, { ry2: 0.03 }), bakery: () => loaf(k, 0, sy, sz + 0.1, 0.2, 0),
      cheese: () => k.add(GEO.prism, 0, sy - 0.1, sz + 0.08, 0.36, 0.22, 0.1, '#f2c14e', { rz: 0 }), sweets: () => k.add(GEO.cyl20, 0, sy + 0.06, sz + 0.08, 0.14, 0.04, 0.14, '#e86a9a', { rx: Math.PI / 2 }).box(0, sy - 0.12, sz + 0.08, 0.03, 0.22, 0.02, WOOD_D, { ink: 0 }),
      hats: () => k.cyl(0, sy - 0.08, sz + 0.08, 0.22, 0.03, '#e8c57a', { geo: GEO.cyl20, rx: 0.3 }).add(GEO.half, 0, sy - 0.06, sz + 0.08, 0.12, 0.12, 0.12, '#e8c57a'), gray: () => {} };
    ic[s.id]();
    crate(k, -2.0, 0, 0.35, 0.75, 0.15, gray ? g('#d8b07a') : s.id === 'fruit' ? ['#e2453a', '#9cc24e'] : null);
    if (!gray) crate(k, -2.0, 0.53, 0.32, 0.7, -0.1);
    worldBox(k, out, 0, 0, 1.65, 0.8); worldBox(k, out, -2.0, 0.35, 0.45, 0.4);
  }
  function drawSquare(k, out) {
    out.keepers = [];
    for (const s of STALLS) {
      k.frame(s.x, GY, s.z, s.rot);
      stall(k, out, s);
      const p = k.world(0, 0, -1.15); s.keeperAt = { x: p.x, z: p.z, yaw: s.rot };
      const f = k.world(0, 0, 1.45); s.front = { x: +f.x.toFixed(2), z: +f.z.toFixed(2) };
      out.keepers.push({ id: s.id, x: p.x, z: p.z, yaw: s.rot, hushed: !!s.hushed });
    }
    drawWell(k, out);
    // lamps round the square: wooden posts with a lantern hung on a bracket
    for (const a of [12, 76, 104, 166, 194, 258, 284, 346]) { const [x, z] = ring(a, 13.4); lamp(k, out, x, z, toSquare(x, z)); }
    // bunting from the well's pole out to every lamp
    const R = rng(8);
    for (const l of out.lamps) if (Math.hypot(l.x - SQ.x, l.z - SQ.z) < 14) bunting(k, out.poleTop.x, out.poleTop.y, out.poleTop.z, l.tip.x, l.tip.y, l.tip.z, 0.55, R);
    // planters and olive trees in the corners where no house stands
    for (const a of [90 + 16, 172, 262, 340]) { const [x, z] = ring(a, 17.6); if (!freeSpot(x, z, 1.2, { paved: true, street: 0.4 })) continue; tree(k, out, 'olive', x, z, 0.85, R, GY, 0.7); k.frame(x, GY, z, 0); k.cyl(0, 0, 0, 1.0, 0.5, WHITE, { geo: GEO.cyl16 }).cyl(0, 0.48, 0, 0.9, 0.06, '#6b4a33', { geo: GEO.cyl16, ink: 0 }); }
  }
  function lamp(k, out, x, z, yaw) {
    const y0 = out.gy ? Math.min(GY + 0.3, out.gy(x, z)) : GY;
    k.frame(x, y0, z, yaw);
    k.cyl(0, 0, 0, 0.17, 0.32, STONE, { geo: GEO.cyl8 }).post(0, 0.28, 0, 0.15, 3.0, 0.15, WOOD_D);
    k.box(0, 3.2, 0.32, 0.1, 0.1, 0.8, WOOD_D).beam(0, 2.68, 0.0, 0, 3.15, 0.5, 0.07, WOOD_D);
    lantern(k, 0, 2.72, 0.62); k.box(0, 3.0, 0.62, 0.02, 0.22, 0.02, IRON, { ink: 0 });
    out.colliders.push({ x, z, r: 0.2 }); out.lamps.push({ x, z, top: y0 + 3.25, tip: k.world(0, 3.25, 0.15) });
  }
  function bunting(k, x1, y1, z1, x2, y2, z2, sag, R) {
    const L = Math.hypot(x2 - x1, z2 - z1), n = Math.max(3, Math.round(L / 0.68)), ry = Math.atan2(x2 - x1, z2 - z1);
    k.frame(0, 0, 0, 0);
    const P2 = t => [lerp(x1, x2, t), lerp(y1, y2, t) - sag * 4 * t * (1 - t), lerp(z1, z2, t)];
    for (let i = 0; i < 8; i++) { const a = P2(i / 8), b = P2((i + 1) / 8); k.beam(a[0], a[1], a[2], b[0], b[1], b[2], 0.018, '#4a3a33', { ink: 0, geo: GEO.cyl6 }); }
    const cols = ['#e0503f', '#f2c14e', '#fff4e4', '#e8c35a', '#3f6fb5', '#fff4e4'], c0 = (R() * 6) | 0;
    for (let i = 1; i < n; i++) { const [x, y, z] = P2(i / n); k.add(GEO.prism, x, y, z, 0.02, 0.32, 0.27, cols[(c0 + i) % 6], { b: 'sway', ry, rz: Math.PI, ink: 0.004, sway: { y0: y - 0.02, y1: y - 0.34, k: 0.9 } }); }
  }
  function freeSpot(x, z, r, o = {}) {
    if (Math.hypot(x - CEN.x, z - CEN.z) > (o.maxR || 38.5)) return false;
    if (streetDist(x, z) < (o.street !== undefined ? o.street : r + 0.3)) return false;
    if (pavedAt(x, z) > 0.05 && !o.paved) return false;
    for (const b of FIXED.concat(HOUSES)) if (circleHitsObb({ x, z, r: r + (o.house !== undefined ? o.house : 0.6) }, { x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot || 0 })) return false;
    for (const q of RESERVED) if (q.c ? Math.hypot(x - q.x, z - q.z) < q.r + r : circleHitsObb({ x, z, r }, q)) return false;
    for (const s of STALLS) if (Math.hypot(x - s.x, z - s.z) < r + 2.6) return false;
    for (const c of o.avoid || []) if (Math.hypot(x - c.x, z - c.z) < (c.r || 0) + r) return false;
    return true;
  }
  function drawTownProps(k, out) {
    const R = rng(2026);
    // lamps along the streets
    for (const s of STREETS) {
      if (s.lane) continue;
      let side = 1, acc = 7;
      for (let i = 0; i < s.pts.length - 1; i++) {
        const [ax, az] = s.pts[i], [bx, bz] = s.pts[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
        for (let t = acc; t < L; t += 11) {
          const x = ax + ux * t - uz * side * (s.w / 2 + 0.55), z = az + uz * t + ux * side * (s.w / 2 + 0.55);
          if (Math.hypot(x - SQ.x, z - SQ.z) > SQ_R + 2 && freeSpot(x, z, 0.3, { street: 0.2, house: 0.3, paved: true })) lamp(k, out, x, z, Math.atan2(-uz * side, ux * side) + Math.PI);
          side = -side; acc = t + 11 - L;
        }
      }
    }
    // trees: olives and cypresses in the gardens, a few round ones
    const avoid = () => out.trees.concat(out.lamps.map(l => ({ x: l.x, z: l.z, r: 0.6 })));
    for (let n = 0, placed = 0; n < 3000 && placed < 10; n++) {
      const a = R() * TAU, r = 16 + Math.sqrt(R()) * 22, x = CEN.x + Math.cos(a) * r, z = CEN.z + Math.sin(a) * r;
      const kind = R() < 0.25 ? 'bush' : pick(['olive', 'cypress', 'olive', 'round', 'cypress'], R), s = 0.8 + R() * 0.3;
      if (!freeSpot(x, z, kind === 'bush' ? 0.9 : 1.5, { avoid: avoid().map(t => ({ x: t.x, z: t.z, r: (t.r || 1) + 1.2 })), house: kind === 'bush' ? 0.1 : 0.5 })) continue;
      tree(k, out, kind, x, z, s, R, out.gy(x, z) - 0.05); placed++;
    }
    // a ring of trees just outside town, framing it (not on the roads in)
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * TAU + R() * 0.25, r = 41 + R() * 5, x = CEN.x + Math.cos(a) * r, z = CEN.z + Math.sin(a) * r;
      if (streetDist(x, z) < 3 || Math.hypot(x - 173, z + 150) < 9 || Math.abs(z + 150) < 5 && x < 190 || Math.hypot(x - GM.x, z - GM.z) < 13) continue;
      tree(k, out, R() < 0.5 ? 'cypress' : 'olive', x, z, 1 + R() * 0.3, R, out.gy(x, z) - 0.1);
    }
    // odds and ends by the houses: flour sacks, barrels, crates, firewood, millstones
    for (const h of HOUSES) {
      const r2 = rng(Math.floor(h.seed * 9e5) + 11);
      const side = r2() < 0.5 ? -1 : 1, lx = side * (h.w / 2 + 0.6), lz = (r2() - 0.5) * (h.d - 1.4);
      const p = { x: h.x + lx * Math.cos(h.rot) + lz * Math.sin(h.rot), z: h.z - lx * Math.sin(h.rot) + lz * Math.cos(h.rot) };
      if (!freeSpot(p.x, p.z, 0.5, { house: -0.05, street: 0.4 })) continue;
      k.frame(p.x, Math.min(out.gy(p.x, p.z), GY + 0.4), p.z, h.rot);
      const kind = r2();
      if (kind < 0.3) sacks(k, out, 0, 0, 3, r2, Math.PI / 2);
      else if (kind < 0.5) { barrel(k, 0, 0, 0); out.colliders.push({ x: p.x, z: p.z, r: 0.42 }); }
      else if (kind < 0.65) { crate(k, 0, 0, 0, 0.75, r2(), r2() < 0.5 ? ['#e2453a', '#f2c14e', '#9cc24e'] : null); out.colliders.push({ x: p.x, z: p.z, r: 0.45 }); }
      else if (kind < 0.82) { for (let i = 0; i < 9; i++) k.cyl(0, 0.15 + (i % 3) * 0.26, -0.5 + (i / 3 | 0) * 0.5, 0.13, 0.5, '#b07a48', { rz: Math.PI / 2, geo: GEO.cyl6, ink: 0.006 }); out.colliders.push({ obox: 1, x: p.x, z: p.z, hw: 0.4, hd: 0.8, rot: h.rot }); }
      else { k.add(GEO.cyl20, 0, 0.9, 0, 0.9, 0.3, 0.9, '#c9c1b0', { rx: Math.PI / 2 - 0.15 }).add(GEO.cyl8, 0, 0.9, 0.06, 0.15, 0.34, 0.15, '#8f8878', { rx: Math.PI / 2 - 0.15, ink: 0 }); out.colliders.push({ x: p.x, z: p.z, r: 0.55 }); }
    }
    // cats: one asleep on the bakery's sacks (placed in makeDynamic), one sitting on the gate's wall
    out.cats = [{ x: 0, y: 0, z: 0, yaw: 0.6, sleep: true, onSacks: true }, { x: 173.2, y: out.gy(173.2, -146.4) + 1.2, z: -146.4, yaw: -1.4, sleep: false }];
  }
  // the ground: flagstone streets, earth lanes and footpaths, laid on the terrain (flat in the middle of town, not at its edge)
  function drawGround(k, gy0) {
    const gy = (x, z) => gy0(x, z) + 0.04 * smoothstep(31, 36, Math.hypot(x - CEN.x, z - CEN.z));
    k.frame(0, GY, 0, 0);
    STREETS.forEach((s, si) => {
      // (the earth lanes lie under the flagstones: where a lane meets a street, the stones cover its end. Laid over them, its
      // round end sat on the street like a patch of an old path nobody had cleared away: playtest 4)
      const b = s.lane ? 'earth' : 'flag', col = s.lane ? '#f2e2c4' : '#ffffff', y = s.lane ? 0.003 + si * 0.0005 : 0.014 + si * 0.0015;
      k.raw(drapeRibbon(gy, s.pts, s.w, y, 0.9), col, b);
      if (!s.lane) for (let i = 0; i < s.pts.length - 1; i++) {
        const [ax, az] = s.pts[i], [bx, bz] = s.pts[i + 1], L = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / L, nz = (bx - ax) / L;
        for (const sd of [-1, 1]) { const o = sd * (s.w / 2 + 0.06); k.raw(drapeRibbon(gy, [[ax + nx * o, az + nz * o], [bx + nx * o, bz + nz * o]], 0.32, y + 0.012, 0.9), '#cdb894', b); }
      }
      for (const [x, z] of s.pts) k.raw(drapeEllipse(gy, { x, z, rx: s.w / 2, rz: s.w / 2 }, y + 0.004, 0.9), col, b);
    });
    for (const c of PAVED) if (c.kind !== 'square') k.raw(drapeEllipse(gy, { x: c.x, z: c.z, rx: c.r, rz: c.r }, 0.026, 0.8), '#f4ead8', 'flag');
    k.frame(0, GY, 0, 0);
    for (const c of PAVED) {
      if (c.kind === 'square') {
        // the square: flagstones laid like a millstone, rings and eight furrows round the well
        k.add(GEO.disc64, c.x, 0.03, c.z, c.r, 1, c.r, '#fff8ec', { b: 'flag' });
        k.add(ringGeo(0.95), c.x, 0.036, c.z, c.r, 1, c.r, '#e2c9a0', { b: 'flag' });
        k.add(ringGeo(0.93), c.x, 0.036, c.z, SQ.r - 0.2, 1, SQ.r - 0.2, '#d9b88a', { b: 'flag' });
        k.add(ringGeo(0.86), c.x, 0.036, c.z, 7.6, 1, 7.6, '#e8b98a', { b: 'flag' });
        k.add(GEO.disc64, c.x, 0.034, c.z, 3.0, 1, 3.0, '#efd9b4', { b: 'flag' });
        for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.2; k.box(c.x + Math.cos(a) * 4.9, 0.035, c.z + Math.sin(a) * 4.9, 0.32, 0.01, 3.6, '#ddb58a', { b: 'flag', ry: Math.PI / 2 - a }); }
      }
    }
    const R = rng(31);
    for (const [[ax, az], [bx, bz]] of PATHS) {
      const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
      k.raw(drapeRibbon(gy, [[ax - ux * 0.3, az - uz * 0.3], [bx + ux * 0.3, bz + uz * 0.3]], 1.3, 0.016, 0.8), '#f4e6cc', 'earth');
      for (let t = 0.3; t < L; t += 0.75) { const x = ax + ux * t + (R() - 0.5) * 0.2, z = az + uz * t + (R() - 0.5) * 0.2; k.frame(0, gy(x, z) - GY, 0, 0); k.add(GEO.disc, x, 0.03 + GY, z, 0.3 + R() * 0.08, 1, 0.24 + R() * 0.06, '#e8e0d0', { b: 'flag', ry: R() * 3 }); }
    }
  }

  // ------------------------------------------------------------ the sails: one rotor (four lattice sails with canvas), instanced for every mill
  function rotorGeos() {
    const k = Kit(); k.frame(0, 0, 0, 0);
    const L = 6.2, W = 1.3, r0 = 0.95;
    k.add(GEO.cyl8, 0, 0, 0.05, 0.42, 0.5, 0.42, WOOD_D, { rx: Math.PI / 2 }).add(GEO.ico0, 0, 0, 0.36, 0.26, 0.26, 0.2, '#6b4228', { ink: 0.01 });
    for (let i = 0; i < 4; i++) {          // (the canvas sits behind the lattice, so the frame shows over it)
      const a = (i / 4) * TAU, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx, at = (r, o) => [dx * r + nx * o, dy * r + ny * o];
      k.beam(0, 0, 0.2, dx * L, dy * L, 0.2, 0.17, SAIL_WOOD);
      for (const o of [0.08, W]) { const [x1, y1] = at(r0, o), [x2, y2] = at(L, o); k.beam(x1, y1, 0.24, x2, y2, 0.24, 0.08, SAIL_WOOD, { ink: 0.008 }); }
      for (let j = 0; j <= 5; j++) { const r = r0 + (L - r0) * j / 5, [x1, y1] = at(r, 0.0), [x2, y2] = at(r, W); k.beam(x1, y1, 0.27, x2, y2, 0.27, 0.07, SAIL_WOOD, { ink: 0.006 }); }
      const [cx, cy] = at((r0 + L) / 2 + 0.1, (W + 0.08) / 2);
      k.box(cx, cy, 0.14, L - r0 - 0.35, W - 0.16, 0.035, SAIL_CLOTH, { rz: a, ink: 0.01 });
      const [bx, by] = at(L - 0.45, (W + 0.08) / 2); k.box(bx, by, 0.17, 0.5, W - 0.2, 0.02, '#c9443a', { rz: a, ink: 0 });
    }
    return { solid: bake(k.B.solid), ink: bake(k.B.solid, { hull: true }) };
  }
  // the same at a glance, for the little ones (weathervanes, the gate's and the well's toy mills): a stock and a canvas per sail
  function rotorLiteGeos() {
    const k = Kit(); k.frame(0, 0, 0, 0);
    const L = 6.2, W = 1.3;
    k.box(0, 0, 0.1, 0.8, 0.8, 0.5, WOOD_D, { rz: Math.PI / 4 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
      k.beam(0, 0, 0.2, dx * L, dy * L, 0.2, 0.35, SAIL_WOOD, { ink: 0.05 });
      k.box(dx * (L + 1) / 2 + nx * W / 2, dy * (L + 1) / 2 + ny * W / 2, 0.16, L - 1.1, W, 0.1, SAIL_CLOTH, { rz: a, ink: 0.06 });
    }
    return { solid: bake(k.B.solid), ink: bake(k.B.solid, { hull: true }) };
  }
  // ------------------------------------------------------------ the wheat: one tuft of stalks, instanced across the fields
  function wheatGeo() {
    const pos = [], col = [], R = rng(31);
    const C = { root: new THREE.Color('#8f8a3c'), stem: new THREE.Color('#d2b04e'), ear: new THREE.Color('#efca60'), ear2: new THREE.Color('#d9b14a'), tip: new THREE.Color('#ffe9a8') };
    const v = (p, c) => { pos.push(p[0], p[1], p[2]); col.push(c.r, c.g, c.b); };
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU + R() * 0.9, r = 0.05 + R() * 0.12, ox = Math.cos(a) * r, oz = Math.sin(a) * r, h = 0.82 + R() * 0.3, yaw = R() * Math.PI;
      const lx = (R() - 0.5) * 0.12, lz = (R() - 0.5) * 0.12, tx = ox + lx, tz = oz + lz, cx = Math.cos(yaw), cz = Math.sin(yaw), hs = h - 0.22;
      v([ox - cx * 0.022, 0, oz - cz * 0.022], C.root); v([ox + cx * 0.022, 0, oz + cz * 0.022], C.root); v([tx - cx * 0.012, hs, tz - cz * 0.012], C.stem);
      v([tx - cx * 0.012, hs, tz - cz * 0.012], C.stem); v([ox + cx * 0.022, 0, oz + cz * 0.022], C.root); v([tx + cx * 0.012, hs, tz + cz * 0.012], C.stem);
      for (const q of [0, Math.PI / 2]) {
        const ex = Math.cos(yaw + q) * 0.052, ez = Math.sin(yaw + q) * 0.052, c2 = q ? C.ear2 : C.ear;
        const b = [tx, h - 0.27, tz], m1 = [tx - ex, h - 0.11, tz - ez], m2 = [tx + ex, h - 0.11, tz + ez], t = [tx, h + 0.06, tz];
        v(b, C.ear2); v(m2, c2); v(m1, c2); v(m1, c2); v(m2, c2); v(t, C.tip);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }

  // ------------------------------------------------------------ townsfolk and animals: town.js's instanced people, one mesh per body part
  const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 13);
  const PART = {
    lathe: { geo: lathe([[0, 0], [0.38, 0.02], [0.37, 0.3], [0.28, 0.68], [0.2, 0.9], [0.1, 0.97], [0, 0.98]]), ink: 0.02, shadow: true },
    head: { geo: new THREE.SphereGeometry(1, 13, 9), ink: 0.02, shadow: true },
    ball: { geo: new THREE.SphereGeometry(1, 7, 5), ink: 0.03, shadow: true },
    cap: { geo: new THREE.SphereGeometry(1, 12, 5, 0, TAU, 0, Math.PI * 0.5), ink: 0.02 },
    cyl: { geo: new THREE.CylinderGeometry(1, 1, 1, 8), ink: 0.03, shadow: true },
    cone: { geo: new THREE.ConeGeometry(1, 1, 8), ink: 0.03 },
    box: { geo: new THREE.BoxGeometry(1, 1, 1), ink: 0.03, shadow: true },
    dot: { geo: new THREE.SphereGeometry(1, 6, 4), ink: 0, basic: true },          // eyes, highlights, mouths, blush, drops: flat colors
  };
  const SKINS = ['#f5cda2', '#efc29a', '#e6b48c', '#c98e62', '#a8714a', '#f0c7a0', '#8a5a3c', '#dcae86'];
  const grayOf = hex => { const c = new THREE.Color(hex), l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; return '#' + c.lerp(new THREE.Color(l * 0.86, l * 0.86, l * 0.95), 0.88).getHexString(); };
  function Rig() {
    const leaves = Object.fromEntries(Object.keys(PART).map(k => [k, []]));
    function leaf(parent, part, color, pos, scale, rot) {
      const n = new THREE.Object3D(); if (pos) n.position.set(...pos); if (scale) n.scale.set(...scale); if (rot) n.rotation.set(...rot);
      parent.add(n); leaves[part].push({ n, color }); n.userData.leaf = { part, i: leaves[part].length - 1 }; return n;
    }
    const node = (parent, pos, rot) => { const n = new THREE.Object3D(); if (pos) n.position.set(...pos); if (rot) n.rotation.set(...rot); if (parent) parent.add(n); return n; };
    function meshes(group) {
      const list = [], byPart = {}, col = new THREE.Color();
      for (const [name, L] of Object.entries(leaves)) {
        if (!L.length) continue;
        const P = PART[name], mat = P.basic ? new THREE.MeshBasicMaterial({ color: '#ffffff' }) : toonM({ rim: 0.32 });
        const im = new THREE.InstancedMesh(P.geo, mat, L.length);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = !!P.shadow; im.receiveShadow = false; im.name = 'mol-folk-' + name;
        L.forEach((l, i) => im.setColorAt(i, col.set(l.color || '#ffffff')));
        group.add(im); list.push({ im, L }); byPart[name] = im;
        if (P.ink) { const h = new THREE.InstancedMesh(P.geo, inkM({ off: P.ink }), L.length); h.instanceMatrix = im.instanceMatrix; h.frustumCulled = false; h.name = 'mol-folk-' + name + '-ink'; group.add(h); list.push({ im: h, L: null }); }
      }
      return {
        list, byPart,
        sync() { for (const { im, L } of list) { if (!L) continue; for (let i = 0; i < L.length; i++) im.setMatrixAt(i, L[i].n.matrixWorld); im.instanceMatrix.needsUpdate = true; } },
        recolor(n, c) { const { part, i } = n.userData.leaf, im = byPart[part]; if (!im) return; im.setColorAt(i, col.set(c)); im.instanceColor.needsUpdate = true; },
      };
    }
    return { leaf, node, meshes, leaves };
  }
  // One townsperson (town.js's makePerson, with flat-colored faces). d: { skin, hair, hairdo, dress, apron, hat, hatColor, beard,
  // stache, loupe, legs, pants, shoes, h, w, eyes, hushed, prop }
  function makePerson(rig, d) {
    const { leaf, node } = rig, g = d.hushed ? grayOf : c => c;
    const C = { skin: g(d.skin), hair: g(d.hair), dress: g(d.dress), apron: d.apron && g(d.apron), pants: g(d.pants || '#3a4466'), shoes: g(d.shoes || '#5b3a22'), hat: g(d.hatColor || '#e8c57a') };
    const root = new THREE.Object3D(), body = node(root), w = d.w || 1;
    root.scale.setScalar(d.h || 1);
    const R = { root, body, d, legs: null, feet: [], arms: [], head: null, eyes: [], mouth: null, props: {} };
    if (d.legs) {
      leaf(body, 'lathe', C.dress, [0, 0.36, 0], [w, 0.64, w]);
      R.legs = [-1, 1].map(s => { const hip = node(body, [s * 0.12 * w, 0.4, 0]); leaf(hip, 'cyl', C.pants, [0, -0.18, 0], [0.085, 0.36, 0.085]); R.feet.push(leaf(hip, 'ball', C.shoes, [0, -0.36, 0.05], [0.1, 0.075, 0.15])); return hip; });
    } else {
      leaf(body, 'lathe', C.dress, null, [w, 1, w]);
      R.feet = [-1, 1].map(s => leaf(body, 'ball', C.shoes, [s * 0.13 * w, 0.04, 0.12], [0.1, 0.07, 0.14]));
    }
    if (d.apron) leaf(body, 'ball', C.apron, [0, 0.42, 0.26 * w], [0.24 * w, 0.3, 0.08]);
    R.arms = [-1, 1].map(s => {
      const sh = node(body, [s * 0.25 * w, 0.84, 0.05], [-0.5, 0, -s * 0.2]);
      leaf(sh, 'cyl', C.dress, [0, -0.14, 0], [0.07, 0.28, 0.07]);
      const hand = node(sh, [0, -0.3, 0]); leaf(hand, 'ball', C.skin, null, [0.07, 0.07, 0.07]);
      sh.userData.hand = hand; return sh;
    });
    const head = R.head = node(body, [0, 0.98, 0]);
    leaf(head, 'head', C.skin, [0, 0.2, 0], [0.28, 0.27, 0.27]);
    if (d.hairdo !== 'bald') leaf(head, 'cap', C.hair, [0, 0.22, -0.02], [0.29, 0.29, 0.29], [-0.5, 0, 0]);
    else leaf(head, 'cap', C.hair, [0, 0.14, -0.06], [0.285, 0.2, 0.26], [-1.1, 0, 0]);
    if (d.hairdo === 'bun') leaf(head, 'ball', C.hair, [0, 0.42, -0.2], [0.12, 0.12, 0.12]);
    if (d.hairdo === 'pony') { leaf(head, 'ball', C.hair, [0, 0.3, -0.27], [0.08, 0.08, 0.08]); leaf(head, 'ball', C.hair, [0, 0.14, -0.33], [0.08, 0.17, 0.08], [0.3, 0, 0]); }
    if (d.hairdo === 'long') leaf(head, 'ball', C.hair, [0, 0.1, -0.1], [0.28, 0.3, 0.2]);
    if (d.hairdo === 'pigtails') for (const s of [-1, 1]) leaf(head, 'ball', C.hair, [s * 0.27, 0.12, -0.08], [0.09, 0.14, 0.09]);
    const EYE = d.hushed ? '#3a3a44' : '#2b2235';
    R.eyes = [-1, 1].map(s => {
      const e = node(head, [s * 0.1, 0.21, 0.24]);
      leaf(e, 'dot', EYE, null, [0.04, d.hushed ? 0.045 : 0.06, 0.025]);
      if (!d.hushed) leaf(e, 'dot', '#ffffff', [0.013, 0.023, 0.022], [0.017, 0.017, 0.017]);
      return e;
    });
    if (!d.hushed) { const bl = '#' + new THREE.Color(C.skin).lerp(new THREE.Color('#ff8c9a'), 0.5).getHexString(); [-1, 1].forEach(s => leaf(head, 'dot', bl, [s * 0.17, 0.09, 0.225], [0.05, 0.0275, 0.015], [0, s * 0.4, 0])); }
    R.mouth = leaf(head, 'dot', EYE, [0, 0.07, 0.27], [0.035, 0.012, 0.01]);
    if (d.stache) for (const s of [-1, 1]) leaf(head, 'ball', C.hair, [s * 0.05, 0.11, 0.255], [0.06, 0.025, 0.03], [0, 0, -s * 0.35]);
    if (d.beard) leaf(head, 'ball', C.hair, [0, 0.03, 0.12], [0.21, 0.17, 0.16]);
    if (d.loupe) { leaf(head, 'cyl', '#2f3440', [0.1, 0.21, 0.275], [0.07, 0.08, 0.07], [Math.PI / 2, 0, 0]); leaf(head, 'dot', '#bfe6f2', [0.1, 0.21, 0.318], [0.055, 0.055, 0.006]); }
    const hat = node(head, [0, 0.4, 0]);
    if (d.hat === 'straw') { leaf(hat, 'cyl', C.hat, null, [0.5, 0.035, 0.5]); leaf(hat, 'cap', C.hat, [0, 0.01, 0], [0.22, 0.2, 0.22]); leaf(hat, 'cyl', g('#e05a4b'), [0, 0.05, 0], [0.225, 0.05, 0.225]); }
    else if (d.hat === 'cap') { leaf(hat, 'cap', C.hat, [0, -0.08, 0], [0.3, 0.22, 0.3]); leaf(hat, 'cyl', C.hat, [0, -0.08, 0.26], [0.16, 0.02, 0.12]); }
    else if (d.hat === 'beret') leaf(hat, 'ball', C.hat, [0.04, -0.07, -0.02], [0.3, 0.09, 0.3], [0, 0, 0.2]);
    else if (d.hat === 'scarf') { leaf(hat, 'cap', C.hat, [0, -0.2, -0.01], [0.31, 0.32, 0.31], [-0.25, 0, 0]); leaf(hat, 'ball', C.hat, [0, -0.32, -0.27], [0.08, 0.08, 0.08]); }
    else if (d.hat === 'chef') { leaf(hat, 'cyl', '#ffffff', [0, 0.02, 0], [0.22, 0.14, 0.22]); leaf(hat, 'ball', '#ffffff', [0, 0.16, 0], [0.27, 0.16, 0.27]); }
    else if (d.hat === 'flat') { leaf(hat, 'cap', C.hat, [0, -0.1, 0.02], [0.31, 0.14, 0.33]); leaf(hat, 'cyl', C.hat, [0, -0.1, 0.27], [0.15, 0.02, 0.1]); }
    // things people carry
    const handR = R.arms[1].userData.hand, handL = R.arms[0].userData.hand, P = R.props;
    if (d.prop === 'sack') { P.sack = node(body, [0.2 * w, 1.02, -0.02], [0, 0, -0.35]); leaf(P.sack, 'ball', g(SACK), null, [0.22, 0.2, 0.34]); leaf(P.sack, 'dot', g('#3f6fb5'), [0.17, 0.02, 0], [0.02, 0.07, 0.1]); }
    if (d.prop === 'basket' || d.prop === 'eggs') { P.basket = node(handL, [0, -0.12, 0.04]); leaf(P.basket, 'cyl', g('#c9955a'), null, [0.17, 0.16, 0.13]); for (let i = 0; i < 3; i++) leaf(P.basket, 'ball', g(d.prop === 'eggs' ? ['#fdf8ee', '#f2e6d0', '#fdf8ee'][i] : ['#e2453a', '#f2c14e', '#9cc24e'][i]), [(i - 1) * 0.08, 0.09, 0], [0.06, d.prop === 'eggs' ? 0.075 : 0.06, 0.06]); }
    if (d.prop === 'bucket') { P.bucket = node(handL, [0, -0.17, 0.02]); leaf(P.bucket, 'cyl', g('#8a8a92'), null, [0.12, 0.18, 0.12]); leaf(P.bucket, 'cyl', g('#5f6a78'), [0, 0.08, 0], [0.125, 0.02, 0.125]); }
    if (d.prop === 'cloth') { P.cloth = node(handR, [0, -0.06, 0.05]); leaf(P.cloth, 'box', '#fdf8ee', null, [0.16, 0.025, 0.12]); }
    if (d.prop === 'watch') { P.watch = node(handR, [0, -0.03, 0.07], [0.6, 0, 0]); leaf(P.watch, 'cyl', '#e6b84a', null, [0.075, 0.025, 0.075], [Math.PI / 2, 0, 0]); leaf(P.watch, 'dot', '#fdf8ee', [0, 0, 0.014], [0.058, 0.058, 0.006]); }
    if (d.prop === 'knit') { P.knit = node(body, [0, 0.62, 0.3]); leaf(P.knit, 'ball', g('#c9443a'), [0.12, -0.04, 0.06], [0.09, 0.09, 0.09]); leaf(P.knit, 'box', g('#e86a9a'), [0, 0.02, 0.02], [0.2, 0.05, 0.13]); for (const s of [-1, 1]) leaf(P.knit, 'cyl', '#d8d0c0', [s * 0.07, 0.1, 0.04], [0.008, 0.3, 0.008], [0.5, 0, s * 0.7]); }
    if (d.prop === 'pinwheel') {
      P.pin = node(handR, [0, -0.02, 0.03], [1.8, 0, 0]); leaf(P.pin, 'cyl', g('#a8784e'), [0, 0.32, 0], [0.016, 0.72, 0.016]);   // (held up while the arm reaches forward)
      P.pinHead = node(P.pin, [0, 0.7, 0.05]); leaf(P.pinHead, 'ball', '#e6b84a', null, [0.03, 0.03, 0.03]);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, b = node(P.pinHead, [Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0], [0, 0, a]); leaf(b, 'box', ['#e0503f', '#f2c14e', '#3f6fb5', '#4f9a5a'][i], [0.02, 0.04, 0], [0.2, 0.09, 0.01], [0, 0, 0.5]); }
    }
    if (d.prop === 'barrow') { P.barrow = node(body, [0, 0, 0.95]); leaf(P.barrow, 'box', g('#a8784e'), [0, 0.42, 0.25], [0.72, 0.36, 0.95]); leaf(P.barrow, 'cyl', g('#4a3a33'), [0, 0.2, 0.75], [0.2, 0.08, 0.2], [0, 0, Math.PI / 2]); for (let i = 0; i < 3; i++) leaf(P.barrow, 'ball', g(SACK), [(i % 2 - 0.5) * 0.3, 0.7, 0.1 + i * 0.2], [0.17, 0.15, 0.22]); for (const s of [-1, 1]) leaf(P.barrow, 'cyl', g('#8a5f3e'), [s * 0.3, 0.52, -0.42], [0.03, 0.62, 0.03], [Math.PI / 2 - 0.3, 0, 0]); }
    return R;
  }
  // Animals: sheep, chickens, cats, Marga's dog
  function makeAnimal(rig, kind, color) {
    const { leaf, node } = rig, root = new THREE.Object3D(), body = node(root), A = { root, body, kind, legs: [], tail: null, head: null, wings: [] };
    if (kind === 'sheep') {
      const face = '#4a4048';
      for (const [x, y, z, r] of [[0, 0.52, 0.04, 0.32], [0.14, 0.53, -0.2, 0.25], [-0.14, 0.53, -0.2, 0.25], [0, 0.56, 0.24, 0.25], [0, 0.7, -0.04, 0.24]]) leaf(body, 'ball', color, [x, y, z], [r, r * 0.92, r]);
      A.head = node(body, [0, 0.64, 0.42]);
      leaf(A.head, 'ball', face, [0, -0.03, 0.07], [0.13, 0.15, 0.17]); leaf(A.head, 'ball', color, [0, 0.1, -0.01], [0.13, 0.08, 0.12]);
      for (const s of [-1, 1]) { leaf(A.head, 'ball', face, [s * 0.14, 0.02, -0.01], [0.09, 0.035, 0.05], [0, 0, s * 0.4]); leaf(A.head, 'dot', '#ffffff', [s * 0.075, 0.03, 0.17], [0.03, 0.035, 0.02]); leaf(A.head, 'dot', '#1e1a24', [s * 0.078, 0.03, 0.185], [0.017, 0.022, 0.01]); }
      for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const hip = node(body, [x * 0.13, 0.36, z * 0.18]); leaf(hip, 'cyl', face, [0, -0.17, 0], [0.04, 0.36, 0.04]); A.legs.push(hip); }
      A.tail = node(body, [0, 0.55, -0.4]); leaf(A.tail, 'ball', color, null, [0.08, 0.08, 0.08]);
    } else if (kind === 'chicken') {
      leaf(body, 'ball', color, [0, 0.2, 0], [0.13, 0.12, 0.16]);
      leaf(body, 'cone', color, [0, 0.29, -0.15], [0.07, 0.14, 0.05], [-0.6, 0, 0]);
      A.head = node(body, [0, 0.33, 0.12]); leaf(A.head, 'ball', color, null, [0.07, 0.08, 0.07]);
      leaf(A.head, 'ball', '#e0403a', [0, 0.08, 0], [0.022, 0.04, 0.05]); leaf(A.head, 'cone', '#f2b13c', [0, -0.005, 0.08], [0.025, 0.05, 0.025], [Math.PI / 2, 0, 0]); leaf(A.head, 'ball', '#e0403a', [0, -0.05, 0.05], [0.018, 0.03, 0.018]);
      for (const s of [-1, 1]) leaf(A.head, 'dot', '#1e1a24', [s * 0.05, 0.02, 0.04], [0.014, 0.014, 0.014]);
      A.wings = [-1, 1].map(s => { const wg = node(body, [s * 0.12, 0.22, 0]); leaf(wg, 'ball', shade(color, 0.9), [s * 0.01, 0, -0.01], [0.03, 0.08, 0.11]); return wg; });
      for (const s of [-1, 1]) { const hip = node(body, [s * 0.05, 0.1, 0]); leaf(hip, 'cyl', '#f2b13c', [0, -0.05, 0], [0.012, 0.1, 0.012]); A.legs.push(hip); }
    } else if (kind === 'dog') {
      leaf(body, 'ball', color, [0, 0.36, 0], [0.2, 0.18, 0.34]); leaf(body, 'ball', '#fdf8ee', [0, 0.32, 0.2], [0.14, 0.13, 0.12]);
      A.head = node(body, [0, 0.55, 0.3]); leaf(A.head, 'ball', color, null, [0.17, 0.16, 0.17]); leaf(A.head, 'ball', '#fdf8ee', [0, -0.04, 0.14], [0.09, 0.07, 0.1]); leaf(A.head, 'dot', '#1e1a24', [0, -0.01, 0.24], [0.04, 0.03, 0.03]);
      for (const s of [-1, 1]) { leaf(A.head, 'dot', '#1e1a24', [s * 0.07, 0.05, 0.13], [0.03, 0.035, 0.02]); leaf(A.head, 'dot', '#ffffff', [s * 0.07 + 0.01, 0.065, 0.145], [0.01, 0.01, 0.01]); leaf(A.head, 'ball', color, [s * 0.14, 0.08, -0.02], [0.05, 0.11, 0.07], [0, 0, s * 0.5]); }
      for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const hip = node(body, [x * 0.1, 0.26, z * 0.2]); leaf(hip, 'cyl', z > 0 ? '#fdf8ee' : color, [0, -0.11, 0], [0.05, 0.24, 0.05]); A.legs.push(hip); }
      A.tail = node(body, [0, 0.45, -0.32], [-0.7, 0, 0]); leaf(A.tail, 'ball', color, [0, 0.1, 0], [0.04, 0.12, 0.04]);
    } else if (kind === 'cat') {
      leaf(body, 'ball', color, [0, 0.13, 0], [0.17, 0.13, 0.24]);
      A.head = node(body, [0, 0.2, 0.2]); leaf(A.head, 'ball', color, null, [0.12, 0.11, 0.11]);
      for (const s of [-1, 1]) { leaf(A.head, 'cone', color, [s * 0.065, 0.11, 0], [0.04, 0.08, 0.03], [0, 0, -s * 0.2]); A.legs.push(leaf(A.head, 'dot', '#1e1a24', [s * 0.045, 0.02, 0.1], [0.025, 0.004, 0.01])); }
      leaf(A.head, 'dot', '#f2a0a8', [0, -0.02, 0.11], [0.015, 0.012, 0.01]);
      A.tail = node(body, [0, 0.08, -0.2], [0, 0, 0]); leaf(A.tail, 'cyl', color, [0.08, 0, -0.06], [0.035, 0.28, 0.035], [Math.PI / 2, 0.9, 0]);
    }
    return A;
  }
  // Marga's handcart: origin at the axle, on the ground; the load over the axle, the push bar behind (−z)
  function makeCart(rig) {
    const { leaf, node } = rig, root = new THREE.Object3D(), C = { root, wheels: [] }, Wd = '#b07a48', Wd2 = '#8d5d38';
    const bed = node(root);
    leaf(bed, 'box', Wd, [0, 0.5, 0.12], [1.05, 0.08, 1.35]);
    for (const s of [-1, 1]) leaf(bed, 'box', Wd2, [s * 0.5, 0.66, 0.12], [0.06, 0.26, 1.35]);
    leaf(bed, 'box', Wd2, [0, 0.66, 0.78], [1.05, 0.26, 0.06]); leaf(bed, 'box', Wd2, [0, 0.62, -0.53], [1.05, 0.18, 0.06]);
    for (const s of [-1, 1]) leaf(bed, 'cyl', '#6b4a33', [s * 0.36, 0.58, -0.92], [0.035, 0.82, 0.035], [Math.PI / 2 - 0.16, 0, 0]);
    leaf(bed, 'cyl', '#6b4a33', [0, 0.65, -1.3], [0.04, 0.86, 0.04], [0, 0, Math.PI / 2]);
    for (const s of [-1, 1]) leaf(bed, 'cyl', '#6b4a33', [s * 0.36, 0.26, 0.62], [0.03, 0.42, 0.03]);
    // the load: sheaves of wheat lying lengthwise, and two flour sacks
    for (let i = 0; i < 4; i++) { const x = -0.3 + (i % 2) * 0.6 + (i > 1 ? 0.0 : 0), y = 0.74 + (i > 1 ? 0.22 : 0), xx = i > 1 ? x * 0.55 : x; leaf(bed, 'cyl', '#d9b450', [xx, y, 0.15], [0.17, 1.05, 0.17], [Math.PI / 2, 0, 0]); leaf(bed, 'ball', GOLD, [xx, y, 0.72], [0.2, 0.2, 0.16]); leaf(bed, 'cyl', '#c9443a', [xx, y, 0.12], [0.18, 0.06, 0.18], [Math.PI / 2, 0, 0]); }
    leaf(bed, 'ball', SACK, [-0.22, 0.72, -0.32], [0.22, 0.2, 0.18]); leaf(bed, 'ball', '#e9dcc0', [0.22, 0.72, -0.3], [0.2, 0.19, 0.17]);
    leaf(root, 'cyl', '#4a3a33', [0, 0.36, 0], [0.04, 1.32, 0.04], [0, 0, Math.PI / 2]);
    for (const s of [-1, 1]) {
      const wn = node(root, [s * 0.62, 0.36, 0]);
      leaf(wn, 'cyl', Wd2, null, [0.36, 0.07, 0.36], [0, 0, Math.PI / 2]); leaf(wn, 'cyl', '#3a3040', null, [0.375, 0.05, 0.375], [0, 0, Math.PI / 2]);
      for (let i = 0; i < 3; i++) leaf(wn, 'box', '#6b4a33', [s * 0.045, 0, 0], [0.02, 0.62, 0.05], [i * Math.PI / 3, 0, 0]);
      leaf(wn, 'ball', '#4a3a33', [s * 0.05, 0, 0], [0.07, 0.07, 0.07]);
      C.wheels.push(wn);
    }
    return C;
  }

  // ------------------------------------------------------------ the cast: who lives here, what they do, what they say
  // Lines: en has slots the game weaves ({c.*} everyday words, {w.*} words Mimo can learn, :f a woman's form, :pl plurals);
  // es (Latin American), pt (Brazilian) and de say the same thing naturally, with only {w.*} slots. Nobody assumes your gender.
  const LINES = {
    farmer: { en: 'Phew! This cart is so heavy. The big mill doesn’t turn, so I take my wheat to the mills on the {c.hill}.', es: '¡Uf! Este carro pesa mucho. El molino grande no gira, así que llevo mi trigo a los molinos de la colina.', pt: 'Ufa! Essa carroça é muito pesada. O moinho grande não gira, então eu levo meu trigo pros moinhos do morro.', de: 'Puh! Der Karren ist so schwer. Die große Mühle dreht sich nicht, also bringe ich meinen Weizen zu den Mühlen auf dem Hügel.' },
    lupe: { en: 'Fruit from the {c.hill}! My {w.apple:pl} are the sweetest in the {c.village}.', es: '¡Fruta de la colina! Mis {w.apple:pl} son las más dulces del pueblo.', pt: 'Fruta do morro! Minhas {w.apple:pl} são as mais doces da vila.', de: 'Obst vom Hügel! Meine {w.apple:pl} sind die süßesten im Dorf.' },
    tomas: { en: 'Only a little {w.bread} today. No flour! The big mill is quiet.', es: 'Hoy hay poco {w.bread}. ¡No hay harina! El molino grande está callado.', pt: 'Hoje tem pouco {w.bread}. Não tem farinha! O moinho grande está quieto.', de: 'Heute gibt es nur wenig {w.bread}. Kein Mehl! Die große Mühle ist still.' },
    ines: { en: 'Cheese from our sheep, honey from our bees. Try some!', es: 'Queso de nuestras ovejas, miel de nuestras abejas. ¡Prueba un poco!', pt: 'Queijo das nossas ovelhas, mel das nossas abelhas. Prova um pouquinho!', de: 'Käse von unseren Schafen, Honig von unseren Bienen. Probier mal!' },
    // (P6c: «…» in an English line is never woven, so «how much?» stayed English; it's the question as you'd ask it, in the language)
    paco: { get en() { const l = typeof UI !== 'undefined' ? UI.lang : 'es', Q = { es: '¿cuánto cuesta?', pt: 'quanto custa?', de: 'Was kostet das?', zh: '[多少|duō shao] [钱|qián] ？', ja: 'いくら です か ？' }, q = Q[l];
      return `Sweets for everyone! Want something? Just ask me: «${!q ? 'how much?' : typeof CJK !== 'undefined' && CJK.isCJK(l) ? CJK.plain(q, { lang: l }) : q}»`; }, es: '¡Dulces para todos! ¿Quieres algo? Pregúntame: «¿cuánto cuesta?»', pt: 'Doces pra todo mundo! Quer alguma coisa? Me pergunta: «quanto custa?»', de: 'Süßigkeiten für alle! Möchtest du was? Frag mich einfach: «Was kostet das?»' },
    rita: { en: 'Hats! For the sun, for the wind, and for little friends.', es: '¡Sombreros! Para el sol, para el viento y para los amigos pequeños.', pt: 'Chapéus! Pro sol, pro vento e pros amiguinhos.', de: 'Hüte! Für die Sonne, für den Wind und für kleine Freunde.' },
    felix: { en: '{w.hello}! This is Molinar, the {c.village} of mills. The market is straight ahead.', es: '¡Hola! Esto es Molinar, el pueblo de los molinos. El mercado está ahí adelante.', pt: 'Oi! Aqui é Molinar, a vila dos moinhos. O mercado fica logo em frente.', de: 'Hallo! Das ist Molinar, das Dorf der Mühlen. Der Markt ist gleich da vorne.' },
    rafa: { en: 'These are the last sacks of flour. After this... no more {w.bread}!', es: 'Estos son los últimos sacos de harina. Después... ¡no hay más {w.bread}!', pt: 'Esses são os últimos sacos de farinha. Depois... acabou o {w.bread}!', de: 'Das sind die letzten Säcke Mehl. Danach... kein {w.bread} mehr!' },
    pepa: { en: 'Come back, chickens! They’re faster than me!', es: '¡Vuelvan, gallinas! ¡Son más rápidas que yo!', pt: 'Voltem, galinhas! Elas são mais rápidas que eu!', de: 'Kommt zurück, Hühner! Die sind schneller als ich!' },
    chelo: { en: 'Since the Hush, my {c.friend:f} Elena doesn’t talk. She just looks at the {w.water}.', es: 'Desde el Silencio, mi amiga Elena no habla. Solo mira el {w.water}.', pt: 'Desde o Silêncio, minha amiga Elena não fala. Só fica olhando a {w.water}.', de: 'Seit der Stille spricht meine Freundin Elena nicht mehr. Sie schaut nur ins {w.water}.' },
    luz: { en: 'A bed for the night? We have soft beds and hot soup.', es: '¿Una cama para esta noche? Tenemos camas suaves y sopa caliente.', pt: 'Uma cama pra esta noite? A gente tem camas macias e sopa quentinha.', de: 'Ein Bett für die Nacht? Wir haben weiche Betten und heiße Suppe.' },
    toni: { en: '{c.look}! One, two, {c.three} {w.apple:pl}! ...Oops.', es: '¡Mira! ¡Una, dos, tres {w.apple:pl}! ...¡Ups!', pt: 'Olha! Uma, duas, três {w.apple:pl}! ...Ops!', de: 'Schau! Eins, zwei, drei {w.apple:pl}! ...Hoppla!' },
    carmen: { en: 'Did you hear? Gil from the market doesn’t talk anymore. Not one word!', es: '¿Ya supiste? Don Gil, el del mercado, ya no habla. ¡Ni una palabra!', pt: 'Ficou sabendo? O seu Gil, do mercado, não fala mais. Nem uma palavra!', de: 'Hast du schon gehört? Gil vom Markt redet nicht mehr. Kein einziges Wort!' },
  };
  // zh / ja (game/CJK.md's notation and names): the same lines, A1–A2; adults are polite to you in ja, kids and Pepa (to her
  // chickens) casual. Only {w.*} / {c.*} slots the engine fills. Nobody genders the player.
  const LINES_CJK = {
    farmer: { zh: '[呼|hū] ！ [这|zhè] [辆|liàng] [车|chē] [好|hǎo] [重|zhòng] 。 [大磨坊|Dà mò fáng] [不|bù] [转|zhuàn] [了|le] ， [所以|suǒ yǐ] [我|wǒ] [把|bǎ] [麦子|mài zi] [拉|lā] [到|dào] [山坡|shān pō] [上|shàng] [的|de] [风车|fēng chē] [那里|nà lǐ] 。',
      ja: 'ふう ！ この [荷車|にぐるま] 、 とても [重|おも]い です 。 [大風車|だいふうしゃ] が [回|まわ]らない ので 、 [麦|むぎ] を [丘|おか] の [風車|ふうしゃ] まで [運|はこ]んで います 。' },
    lupe: { zh: '[山坡|shān pō] [上|shàng] [的|de] [水果|shuǐ guǒ] ！ [我|wǒ] [的|de] {w.apple:pl} [是|shì] [镇上|zhèn shang] [最|zuì] [甜|tián] [的|de] ！',
      ja: '[丘|おか] の くだもの です よ ！ うち の {w.apple:pl} は 、 [町|まち] で いちばん [甘|あま]い です ！' },
    tomas: { zh: '[今天|jīn tiān] [只有|zhǐ yǒu] [一点|yī diǎn] {w.bread} 。 [没有|méi yǒu] [面粉|miàn fěn] [了|le] ！ [大磨坊|Dà mò fáng] [静悄悄|jìng qiāo qiāo] [的|de] 。',
      ja: '[今日|きょう] は {w.bread} が [少|すこ]し しか ありません 。 [小麦粉|こむぎこ] が ありません ！ [大風車|だいふうしゃ] が [止|と]まって います 。' },
    ines: { zh: '[我们|wǒ men] [家|jiā] [羊|yáng] [的|de] [奶酪|nǎi lào] ， [我们|wǒ men] [家|jiā] [蜜蜂|mì fēng] [的|de] [蜂蜜|fēng mì] 。 [尝尝|cháng chang] [吧|ba] ！',
      ja: 'うち の [羊|ひつじ] の チーズ と 、 うち の [蜂|はち] の はちみつ です 。 [食|た]べて みて ください ！' },
    paco: { zh: '[大家|dà jiā] [都|dōu] [有|yǒu] [糖|táng] ！ [想|xiǎng] [要|yào] [什么|shén me] [吗|ma] ？ [问|wèn] [我|wǒ] [就|jiù] [行|xíng] ： “ [多少|duō shao] [钱|qián] ？ ”',
      ja: 'みんな に おかし です よ ！ [何|なに]か ほしい です か ？ 「 いくら です か ？ 」 って [聞|き]いて ください ね 。' },
    rita: { zh: '[帽子|mào zi] ！ [遮|zhē] [太阳|tài yáng] 、 [挡|dǎng] [风|fēng] ， [还有|hái yǒu] [小|xiǎo] [朋友|péng you] [戴|dài] [的|de] ！',
      ja: '[帽子|ぼうし] です よ ！ [日|ひ]よけ に も 、 [風|かぜ]よけ に も 、 [小|ちい]さな お[友達|ともだち] に も ！' },
    felix: { zh: '{w.hello} ！ [这里|zhè lǐ] [是|shì] [磨坊镇|Mò fáng zhèn] ， [风车|fēng chē] [之|zhī] [镇|zhèn] 。 [市场|shì chǎng] [就|jiù] [在|zài] [前面|qián miàn] 。',
      ja: '{w.hello} ！ ここ は モリナール 、 [風車|ふうしゃ] の [町|まち] です 。 [市場|いちば] は この [先|さき] です よ 。' },
    rafa: { zh: '[这|zhè] [是|shì] [最后|zuì hòu] [几|jǐ] [袋|dài] [面粉|miàn fěn] [了|le] 。 [以后|yǐ hòu] … [就|jiù] [没有|méi yǒu] {w.bread} [了|le] ！',
      ja: 'これ が [最後|さいご] の [小麦粉|こむぎこ] です 。 この [後|あと] は … もう {w.bread} が ありません ！' },
    pepa: { zh: '[鸡|jī] [啊|a] ， [快|kuài] [回来|huí lái] ！ [它们|tā men] [跑|pǎo] [得|de] [比|bǐ] [我|wǒ] [快|kuài] ！',
      ja: 'にわとり たち 、 [戻|もど]って きて ！ わたし より [速|はや]い ！' },
    chelo: { zh: '[寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [我|wǒ] [的|de] [朋友|péng you] [埃莱娜|Āi lái nà] [就|jiù] [不|bù] [说话|shuō huà] [了|le] 。 [她|tā] [只是|zhǐ shì] [看|kàn] [着|zhe] {w.water} 。',
      ja: '[静寂|せいじゃく] が [来|き]て から 、 [友達|ともだち] の エレナ は [話|はな]さなく なりました 。 {w.water} を [見|み]て いる だけ です 。' },
    luz: { zh: '[要|yào] [住|zhù] [一|yī] [晚|wǎn] [吗|ma] ？ [我们|wǒ men] [有|yǒu] [软软|ruǎn ruǎn] [的|de] [床|chuáng] [和|hé] [热|rè] [汤|tāng] 。',
      ja: '[今夜|こんや] の ベッド です か ？ ふかふか の ベッド と 、 [温|あたた]かい スープ が あります よ 。' },
    toni: { zh: '{c.look} ！ [一|yī] 、 [二|èr] 、 {c.three} [个|gè] {w.apple:pl} ！ … [哎呀|āi yā] 。',
      ja: '{c.look} ！ {w.apple:pl} が [一|ひと]つ 、 [二|ふた]つ 、 [三|みっ]つ ！ … あっ 。' },
    carmen: { zh: '[你|nǐ] [听说|tīng shuō] [了|le] [吗|ma] ？ [市场|shì chǎng] [的|de] [吉尔|Jí ěr] [不|bù] [说话|shuō huà] [了|le] 。 [一|yī] [个|gè] [字|zì] [也|yě] [不|bù] [说|shuō] ！',
      ja: '[聞|き]きました か ？ [市場|いちば] の ギル さん が 、 もう [何|なに] も [話|はな]しません 。 ひと[言|こと] も ！' },
  };
  for (const [k, v] of Object.entries(LINES_CJK)) if (LINES[k]) Object.assign(LINES[k], v);
  const SK = SKINS;
  function castOf(out) {
    const keeper = id => { const s = STALLS.find(q => q.id === id); return { ...s.keeperAt }; };
    const benchAt = a => { const [x, z] = ring(a, 3.9); return out.benches.reduce((b, q) => (Math.hypot(q.x - x, q.z - z) < Math.hypot(b.x - x, b.z - z) ? q : b), out.benches[0]); };
    const ch = benchAt(135), tr = out.terrace || [], st = tr[0] ? tr[0].stools[0] : { x: 200, z: -160 };
    const ramonAt = tr[0] ? { x: st.x, z: st.z, yaw: Math.atan2(tr[0].x - st.x, tr[0].z - st.z), seat: 0.46 } : { x: 200, z: -160, yaw: 0, seat: 0.46 };
    const ciroAt = { x: LM.ciro.x, z: LM.ciro.z, yaw: CLOCK.rot };
    const [elx, elz] = ring(72, 2.55), [tox, toz] = ring(80, 12.2), [ca, cb] = [ring(248, 12.9), ring(254, 12.5)];
    const sq = (a, r) => ring(a, r);
    return [
      { id: 'lupe', name: 'Lupe', job: 'keeper', at: keeper('fruit'), look: { skin: SK[2], hair: '#2e2420', hairdo: 'bun', dress: '#d9603f', apron: '#fdf8ee', hat: 'scarf', hatColor: '#f2c14e' } },
      { id: 'tomas', name: 'Tomás', job: 'keeper', at: keeper('bakery'), look: { skin: SK[1], hair: '#4a2f27', dress: '#f2e6d0', apron: '#ffffff', legs: true, hat: 'chef', stache: true } },
      { id: 'ines', name: 'Inés', job: 'keeper', at: keeper('cheese'), look: { skin: SK[5], hair: '#6b3b25', hairdo: 'long', dress: '#e6a23a', apron: '#fdf8ee', hat: 'straw' } },
      { id: 'paco', name: 'Paco', job: 'keeper', at: keeper('sweets'), look: { skin: SK[3], hair: '#2e2420', dress: '#e86a9a', legs: true, pants: '#3a3040', hat: 'beret', hatColor: '#c9443a', stache: true, w: 1.15 } },
      { id: 'rita', name: 'Rita', job: 'keeper', at: keeper('hats'), look: { skin: SK[0], hair: '#c98a4a', hairdo: 'pony', dress: '#3f6fb5', hat: 'straw', hatColor: '#f2d48a' } },
      { id: 'gil', name: 'Gil', job: 'keeper', hushed: true, at: keeper('gray'), look: { skin: SK[7], hair: '#3a2b26', dress: '#7a5a3a', legs: true, hat: 'flat', hatColor: '#4a4a55', stache: true } },
      { id: 'ciro', name: 'Ciro', job: 'tinker', story: true, at: ciroAt, look: { skin: SK[0], hair: '#ece8e0', hairdo: 'bald', beard: true, dress: '#5a4a7a', apron: '#8a5f3e', legs: true, pants: '#3a3040', loupe: true, h: 0.92 }, prop: 'watch' },
      { id: 'farmer', name: 'Marga', job: 'push', ground: 'terrain', look: { skin: SK[4], hair: '#4a2f27', hairdo: 'pony', dress: '#4f8a4a', apron: '#e8d9b8', hat: 'scarf', hatColor: '#e0503f', w: 1.06 } },
      { id: 'felix', name: 'Félix', job: 'stand', at: { x: 177.6, z: -146.2, yaw: -Math.PI / 2 - 0.3 }, look: { skin: SK[6], hair: '#2e2420', dress: '#3e7fb0', legs: true, pants: '#4a3a33', hat: 'cap', hatColor: '#c9443a', stache: true, h: 1.06 } },
      { id: 'rafa', name: 'Rafa', job: 'walk', speed: 1.0, pause: 3, stopAll: false, path: [[GM.x - 2.2, GM.z + GM.step + 2.6], [233.4, -161.8], [226.6, -157.6], sq(286, 13.6)], look: { skin: SK[3], hair: '#3a2b26', dress: '#efe6d2', legs: true, pants: '#6b5a4a', hat: 'flat', hatColor: '#d8d0c0' }, prop: 'sack' },
      { id: 'pepa', name: 'Pepa', job: 'chase', kid: 1, look: { skin: SK[1], hair: '#6b3b25', hairdo: 'pigtails', dress: '#f2c14e', h: 0.72 } },
      { id: 'dani', name: 'Dani', job: 'walk', speed: 2.3, pause: 1.6, run: true, path: [[214.2, -138.8], [215.0, -126.5], [214.4, -116.5]], look: { skin: SK[4], hair: '#2e2420', dress: '#4f9a5a', legs: true, h: 0.74, hat: 'cap', hatColor: '#3f6fb5' }, prop: 'pinwheel' },
      { id: 'chelo', name: 'Chelo', job: 'sit', at: { x: ch.x, z: ch.z, yaw: ch.yaw, seat: 0.5 }, knit: true, look: { skin: SK[2], hair: '#e0ddd6', hairdo: 'bun', dress: '#7a3f5a', h: 0.9 }, prop: 'knit' },
      { id: 'luz', name: 'Luz', job: 'wipe', at: tr[1] ? { x: tr[1].x + Math.sin(INN.rot) * 0.95, z: tr[1].z + Math.cos(INN.rot) * 0.95, yaw: INN.rot + Math.PI } : { x: 205, z: -160, yaw: 0 }, look: { skin: SK[5], hair: '#2e2420', hairdo: 'bun', dress: '#b84a3a', apron: '#ffffff' }, prop: 'cloth' },
      { id: 'toni', name: 'Toni', job: 'juggle', at: { x: tox, z: toz, yaw: toSquare(tox, toz) }, look: { skin: SK[0], hair: '#e0b060', dress: '#e8743c', legs: true, pants: '#3f6fb5', hat: 'beret', hatColor: '#4f9a5a' } },
      { id: 'carmen', name: 'Carmen', job: 'chat', at: { x: ca[0], z: ca[1] }, other: 'sara', look: { skin: SK[1], hair: '#2e2420', hairdo: 'long', dress: '#3e8f8a' }, prop: 'basket' },
      { id: 'sara', name: 'Sara', job: 'chat', at: { x: cb[0], z: cb[1] }, other: 'carmen', look: { skin: SK[3], hair: '#8a4a2a', hairdo: 'bun', dress: '#e0b84a', hat: 'straw' } },
      { id: 'quique', name: 'Quique', job: 'walk', speed: 1.0, pause: 4, path: [[251.2, -146.0], [237, -147.0], [229.5, -147.6]], look: { skin: SK[6], hair: '#2e2420', dress: '#8a5f3e', legs: true, hat: 'straw' }, prop: 'barrow' },
      { id: 'nuria', name: 'Nuria', job: 'walk', speed: 1.15, pause: 3, path: [[216.6, -187.5], [216.6, -176], [216.7, -165.5], sq(266, 13.0)], look: { skin: SK[7], hair: '#4a2f27', hairdo: 'pony', dress: '#d97aa0', apron: '#fdf8ee' }, prop: 'eggs' },
      { id: 'mateo', name: 'Mateo', job: 'stand', hushed: true, at: { x: GM.x + 2.9, z: GM.z + GM.half - 0.55, yaw: 0.25, y: out.mill.base + 0.56 }, look: { skin: SK[2], hair: '#d8d8d8', dress: '#efe6d2', legs: true, hat: 'flat', beard: true } },
      { id: 'elena', name: 'Elena', job: 'stand', hushed: true, at: { x: elx, z: elz, yaw: Math.atan2(SQ.x - elx, SQ.z - elz) }, look: { skin: SK[0], hair: '#6b3b25', hairdo: 'long', dress: '#5a86b8' }, prop: 'bucket' },
      { id: 'ramon', name: 'Ramón', job: 'sit', hushed: true, at: ramonAt, look: { skin: SK[3], hair: '#3a2b26', dress: '#4f8a4a', legs: true, hat: 'flat' } },
    ];
  }
  function moveTo(S, tx, tz, v, dt) {
    const dx = tx - S.x, dz = tz - S.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { S.speed = 0; return true; }
    const st = Math.min(d, v * dt); S.x += (dx / d) * st; S.z += (dz / d) * st; S.speed = v;
    S.yaw = dampAngle(S.yaw, Math.atan2(dx, dz), 7, dt);
    return d - st < 0.05;
  }
  function makeDynamic(root, out, gy) {
    const rig = Rig(), cast = castOf(out), people = [], byId = {}, R = rng(99);
    const groundOf = (d, S) => (d.ground === 'terrain' ? gy(S.x, S.z) : d.at && d.at.y !== undefined ? d.at.y : GY);
    // ---------------- people
    for (const d of cast) {
      const Rr = makePerson(rig, { ...d.look, hushed: d.hushed, prop: d.prop });
      const S = { x: 0, z: 0, yaw: 0, speed: 0, phase: R() * 6, near: false, wave: 0, talk: 0, blink: 1 + R() * 4, seed: R(), i: 0, dir: 1, pause: R() * 2, hop: 0, sit: false, seat: 0.5, pose: null, lookAt: undefined, gy: GY };
      if (d.at) { S.x = d.at.x; S.z = d.at.z; S.yaw = d.at.yaw || 0; }
      if (d.path) { S.x = d.path[0][0]; S.z = d.path[0][1]; S.i = 1; }
      if (d.job === 'sit') { S.sit = true; S.seat = (d.at && d.at.seat) || 0.53; S.x += Math.sin(S.yaw) * 0.06; S.z += Math.cos(S.yaw) * 0.06; }
      if (d.hushed) S.stare = (R() - 0.5) * 0.6;
      S.gy = groundOf(d, S);
      const h = (d.look.h || 1);
      const api = { id: d.id, name: d.name, kind: d.kid ? 'kid' : d.job === 'push' ? 'farmer' : d.job === 'tinker' ? 'clockmaker' : d.job, hushed: !!d.hushed, lines: d.hushed || d.story ? null : LINES[d.id] || null, talking: false,
        get x() { return S.x; }, get z() { return S.z; }, get y() { return S.gy + (S.sit ? S.seat - 0.5 : 0); }, top: h * 1.5 - (d.job === 'sit' ? 0.45 : 0), _S: S, _R: Rr, _d: d };
      if (d.story) api.story = true;
      people.push(api); byId[d.id] = api;
      if (['keeper', 'chat', 'stand', 'tinker', 'juggle', 'wipe', 'sit'].includes(d.job)) out.colliders.push({ x: S.x, z: S.z, r: 0.4, npc: d.id });
    }
    // ---------------- Marga and her cart (the "watch and learn" moment: she pushes, plainly, back and forth)
    const cart = makeCart(rig), T = FARM.track;
    const F = { mode: 'push', dir: 1, cx: T.a + 0.5, yaw: Math.PI / 2, t: 0, roll: 0, drops: 0, hold: false, resume: 0 };
    const HANDLE = 1.86, farmer = byId.farmer;
    { const S = farmer._S; S.x = F.cx - HANDLE; S.z = T.z; S.yaw = Math.PI / 2; }
    root.add(cart.root); cart.root.name = 'mol-cart';
    const moving = [{ x: F.cx, z: T.z, r: 0.95, what: 'cart' }];
    const drops = [0, 1].map(() => rig.leaf(new THREE.Object3D(), 'dot', '#9fdcf2', null, [0.035, 0.05, 0.035]));
    // ---------------- Pepa's chickens, Toni's apples, the bell, the clock's hands, bees
    const kids = { a: 0, sgn: 1, flip: 8, stop: false };
    const hens = ['#fdf8ee', '#c98a4a', '#fdf8ee', '#8a5a3a'].map((c, i) => ({ A: makeAnimal(rig, 'chicken', c), off: 0.55 + i * 0.42, peck: R() * 3, x: 0, z: 0, yaw: 0, flap: 0 }));
    const apples = ['#e2453a', '#9cc24e', '#f2c14e'].map(c => rig.leaf(new THREE.Object3D(), 'ball', c, null, [0.075, 0.075, 0.075]));
    const bell = new THREE.Object3D(); bell.position.copy(out.bellAt); bell.name = 'mol-bell';
    const BELL = '#d9a640', bellLeaves = [
      [rig.leaf(bell, 'cone', BELL, [0, -0.72, 0], [0.85, 1.0, 0.85]), BELL], [rig.leaf(bell, 'cap', BELL, [0, -0.3, 0], [0.45, 0.42, 0.45]), BELL],
      [rig.leaf(bell, 'cyl', '#c08a30', [0, -1.2, 0], [0.86, 0.07, 0.86]), '#c08a30'], [rig.leaf(bell, 'ball', '#7a5a2a', [0, -1.12, 0], [0.16, 0.16, 0.16]), '#7a5a2a'],
      [rig.leaf(bell, 'box', '#4a3a33', [0, 0.06, 0], [1.2, 0.18, 0.2]), '#4a3a33'],
    ];
    const clk = out.clockAt, hands = new THREE.Object3D();
    if (clk) { hands.position.copy(clk.p); hands.rotation.y = clk.rot; }
    const minute = rig.node(hands), hour = rig.node(hands);
    rig.leaf(minute, 'box', '#2b2235', [0, clk ? clk.r * 0.36 : 0.3, 0], [0.06, clk ? clk.r * 0.72 : 0.6, 0.03]); rig.leaf(hour, 'box', '#2b2235', [0, clk ? clk.r * 0.24 : 0.2, 0.01], [0.08, clk ? clk.r * 0.48 : 0.4, 0.03]);
    const bees = (out.hives || []).flatMap((h, i) => [0, 1, 2].map(j => ({ h, n: rig.leaf(new THREE.Object3D(), 'dot', j % 2 ? '#2b2235' : '#f2c14e', null, [0.04, 0.04, 0.04]), ph: R() * TAU, w: 1.5 + R() * 1.5, r: 0.5 + R() * 0.7 })));
    // ---------------- sheep in the pen, Marga's dog, the cats
    const pen = FARM.pen;
    const sheep = [0, 1, 2, 3, 4].map(i => ({ A: makeAnimal(rig, 'sheep', i === 3 ? '#e8e2d6' : '#fbf8f2'), x: lerp(pen.x0 + 1.4, pen.x1 - 1.4, (i * 0.37 + 0.15) % 1), z: lerp(pen.z0 + 1.4, pen.z1 - 1.4, (i * 0.61 + 0.3) % 1), yaw: R() * TAU, mode: 'graze', t: R() * 4, tx: 0, tz: 0, ph: R() * 6 }));
    const dog = { A: makeAnimal(rig, 'dog', '#2e2a30'), ...out.dogSpot };
    const cats = out.cats.map((c, i) => ({ A: makeAnimal(rig, 'cat', i ? '#8a8a96' : '#e8a050'), ...c }));
    if (cats[0] && cats[0].onSacks) { const b = BAKERY, x = -2.9, z = b.d / 2 + 1.15, c = Math.cos(b.rot), s = Math.sin(b.rot); Object.assign(cats[0], { x: b.x + x * c + z * s, z: b.z - x * s + z * c, y: GY + 1.2, yaw: b.rot + 1.2 }); }
    cats.forEach(c => c.A.legs.forEach(e => { e.scale.y = c.sleep ? 0.004 : 0.022; }));
    const folks = rig.meshes(root);
    folks.recolorBell = amt => { const gray = new THREE.Color(); bellLeaves.forEach(([n, c]) => { gray.set(c); const l = gray.r * 0.3 + gray.g * 0.55 + gray.b * 0.15; folks.recolor(n, '#' + gray.lerp(new THREE.Color(l * 0.9, l * 0.9, l * 0.96), amt * 0.9).getHexString()); }); };

    // ---------------- what everyone does each frame (town.js's think/pose, with Molinar's jobs)
    function think(p, dt, t, you) {
      const S = p._S, d = p._d;
      const dY = you ? Math.hypot(you.x - S.x, you.z - S.z) : 99, was = S.near;
      S.near = !d.hushed && (dY < (was ? 3.6 : 3.0) || p.talking);
      if (S.near && !was && !p.talking && d.job !== 'push' && d.job !== 'juggle') S.wave = 1.2;
      const toYou = you ? Math.atan2(you.x - S.x, you.z - S.z) : S.yaw;
      S.lookAt = !d.hushed && dY < 6 ? toYou : undefined;
      S.speed = 0; S.pose = null; S.hop = 0; S.chatTalk = false;
      const face = (yaw, k = 5) => { S.yaw = dampAngle(S.yaw, yaw, k, dt); };
      switch (d.job) {
        case 'walk': {
          S.pose = d.prop === 'barrow' ? 'barrow' : d.prop === 'sack' ? 'carry' : d.prop === 'eggs' || d.prop === 'basket' ? 'basket' : d.run ? 'run' : null;
          if (S.near) { face(toYou); if (d.run) S.pose = 'pinwheel'; break; }
          if (S.pause > 0) { S.pause -= dt; if (d.run) S.pose = 'pinwheel'; break; }
          const tg = d.path[S.i];
          if (moveTo(S, tg[0], tg[1], d.speed, dt)) {
            const end = S.i === 0 || S.i === d.path.length - 1;
            if (end || d.stopAll) S.pause = (d.pause || 2) * (0.6 + R() * 0.8);
            if (S.i === d.path.length - 1) S.dir = -1; else if (S.i === 0) S.dir = 1;
            S.i += S.dir;
          }
          if (d.run) S.hop = Math.abs(Math.sin(S.phase)) * 0.1;
          break;
        }
        case 'keeper': {
          if (S.near) { face(toYou, 4); break; }
          face(d.at.yaw, 3);
          if (!d.hushed) { const c = (t * 0.11 + S.seed * 7) % 1; S.pose = c < 0.2 ? 'arrange' : null; if (c > 0.55 && c < 0.6) S.talkSolo = 1; }
          break;
        }
        case 'chat': {
          const o = byId[d.other]; if (!o) break;
          if (S.near || o._S.near) { face(toYou); break; }
          face(Math.atan2(o._S.x - S.x, o._S.z - S.z));
          const turn = Math.floor(t / 2.7 + (d.id === 'carmen' ? 0 : 1)) % 2 === 0;
          S.chatTalk = turn; S.pose = 'chat'; S.nod = !turn && Math.sin(t * 0.9) > 0.3;
          break;
        }
        case 'sit': S.pose = d.knit && !S.near ? 'knit' : null; if (S.near && !d.hushed) S.lookAt = toYou; break;
        case 'stand': if (S.near) face(toYou, 4); else face(d.at.yaw, 2); S.pose = d.hushed ? null : 'hips'; break;
        case 'tinker': if (S.near) { face(toYou, 4); break; } face(d.at.yaw, 2); S.pose = 'tinker'; break;
        case 'wipe': if (S.near) { face(toYou); break; } face(d.at.yaw, 3); S.pose = 'wipe'; break;
        case 'juggle': S.pose = 'juggle'; face(S.near ? toYou : d.at.yaw, 3); break;
        case 'chase': {
          const a = kids.a;
          if (kids.stop) { face(toYou); break; }
          const r = 6.3 + Math.sin(t * 1.3) * 0.3, nx = SQ.x + Math.cos(a) * r, nz = SQ.z + Math.sin(a) * r;
          S.speed = Math.hypot(nx - S.x, nz - S.z) / Math.max(dt, 1e-3);
          if (S.speed > 0.05) face(Math.atan2(nx - S.x, nz - S.z), 12);
          S.x = nx; S.z = nz; S.speed = Math.min(S.speed, 3); S.pose = 'run'; S.hop = Math.abs(Math.sin(S.phase)) * 0.12;
          break;
        }
        case 'push': farmerThink(p, dt, t, you, toYou); break;
        default: break;
      }
    }
    // Marga: push the cart along the track, rest, swing the cart round (walking round with it), push it back
    function farmerThink(p, dt, t, you, toYou) {
      const S = p._S, fw = y => [Math.sin(y), Math.cos(y)];
      const stopped = p.talking || F.hold;
      if (stopped) { S.pose = p.talking ? null : 'rest'; S.yaw = dampAngle(S.yaw, p.talking ? toYou : S.yaw, 5, dt); F.resume = 0.6; return; }
      if (F.resume > 0) {         // back to the handle first
        F.resume -= dt; const [fx, fz] = fw(F.yaw), hx = F.cx - fx * HANDLE, hz = T.z - fz * HANDLE;
        moveTo(S, hx, hz, 1.2, dt); S.yaw = dampAngle(S.yaw, F.yaw, 6, dt); S.pose = 'rest'; return;
      }
      if (F.mode === 'push') {
        const v = 0.62, target = F.dir > 0 ? T.b : T.a, step = Math.min(Math.abs(target - F.cx), v * dt);
        F.cx += Math.sign(target - F.cx) * step; F.roll += step;
        S.speed = step / Math.max(dt, 1e-4); S.pose = 'push';
        if (Math.abs(target - F.cx) < 1e-3) { F.mode = 'rest'; F.t = 1.6; }
      } else if (F.mode === 'rest') {
        S.pose = 'brow'; F.t -= dt;
        if (F.t <= 0) { F.mode = 'turn'; F.t = 0; F.y0 = F.yaw; }
      } else if (F.mode === 'turn') {
        F.t += dt / 2.6; const k = easeInOut(Math.min(1, F.t));
        const y1 = F.y0 + Math.PI * (F.dir > 0 ? 1 : -1);
        const prev = F.yaw; F.yaw = lerp(F.y0, y1, k); F.roll += Math.abs(F.yaw - prev) * 0.55;
        S.speed = Math.abs(F.yaw - prev) * HANDLE / Math.max(dt, 1e-4); S.pose = 'turn';
        if (F.t >= 1) { F.mode = 'push'; F.dir = -F.dir; F.yaw = Math.atan2(Math.sin(y1), Math.cos(y1)); }
      }
      const [fx, fz] = fw(F.yaw);
      S.x = F.cx - fx * HANDLE; S.z = T.z - fz * HANDLE; S.yaw = F.mode === 'turn' ? F.yaw : dampAngle(S.yaw, F.yaw, 8, dt);
      if (S.near && you) S.lookAt = toYou;
    }
    function pose(p, dt, t) {
      const S = p._S, R = p._R, d = p._d, hush = d.hushed, P = R.props;
      if (d.ground === 'terrain') S.gy = gy(S.x, S.z);
      const legsSeat = S.sit && R.legs ? 0.3 : 0;
      R.root.position.set(S.x, S.gy + (S.sit ? S.seat - legsSeat - 0.02 : 0), S.z); R.root.rotation.y = S.yaw;
      const walk = clamp(S.speed / 1.3, 0, 1.6);
      if (S.speed > 0.05) S.phase += dt * (S.pose === 'push' ? 5.2 : 3.0 + S.speed * 2.6); else S.phase = damp(S.phase, Math.round(S.phase / Math.PI) * Math.PI, 8, dt);
      const ph = S.phase, sw = Math.sin(ph), wk = S.pose === 'push' ? 1.1 : walk;
      S.talkSolo = Math.max(0, (S.talkSolo || 0) - dt * 0.6);
      S.talk = damp(S.talk, p.talking || S.chatTalk || S.talkSolo > 0 ? 1 : 0, 10, dt);
      const br = hush ? 1 : 1 + Math.sin(t * 2.2 + S.seed * 9) * 0.014;
      R.body.scale.set(1, (S.sit ? 0.82 : 1) * br, 1);
      R.body.position.y = hush ? 0 : Math.abs(sw) * 0.05 * Math.min(wk, 1.2) + S.talk * Math.abs(Math.sin(t * 13)) * 0.03 + S.hop;
      R.body.rotation.z = hush ? 0 : sw * 0.05 * wk + Math.sin(t * 1.2 + S.seed * 9) * 0.02;
      R.body.rotation.x = (d.stoop || 0) + ({ arrange: 0.22, push: 0.36, turn: 0.2, carry: 0.06, barrow: 0.15, wipe: 0.3, tinker: 0.12, knit: 0.1 }[S.pose] || 0) + walk * 0.05;
      R.body.rotation.y = S.pose === 'wipe' ? Math.sin(t * 2.4) * 0.1 : 0;
      if (R.legs) R.legs.forEach((hip, i) => { hip.rotation.x = S.sit ? -1.25 : Math.sin(ph + i * Math.PI) * 0.6 * wk; });
      else R.feet.forEach((f, i) => { const s = i ? 1 : -1; if (S.sit) f.position.set(s * 0.13, -0.56, 0.36); else f.position.set(s * 0.13 * (d.look.w || 1), 0.04 + Math.max(0, Math.sin(ph + i * Math.PI)) * 0.07 * wk, 0.12 + Math.sin(ph + i * Math.PI) * (S.pose === 'push' ? 0.19 : 0.13) * wk); });
      let aL = [-0.5 + sw * 0.5 * walk, 0, 0.2], aR = [-0.5 - sw * 0.5 * walk, 0, -0.2];
      if (hush) { aL = [-0.1, 0, 0.12]; aR = [-0.1, 0, -0.12]; if (d.prop === 'bucket') aL = [-0.05, 0, 0.1]; }
      else switch (S.pose) {
        case 'push': case 'turn': aL = [-1.36 + Math.sin(ph) * 0.04, 0, 0.14]; aR = [-1.36 - Math.sin(ph) * 0.04, 0, -0.14]; break;
        case 'brow': { const k = Math.sin(t * 3); aL = [-0.25, 0, 0.12]; aR = [-2.25 + k * 0.08, 0, -0.95]; break; }
        case 'rest': aL = [-0.3, 0, 0.2]; aR = [-0.3, 0, -0.2]; break;
        case 'arrange': { const s = Math.sin(t * 3); aL = [-1.15 + s * 0.15, 0, 0.25]; aR = [-1.15 - s * 0.15, 0, -0.25]; break; }
        case 'carry': aL = [-0.5 + sw * 0.4 * walk, 0, 0.2]; aR = [-2.6, 0, 0.3]; break;
        case 'barrow': aL = [-0.7, 0, 0.1]; aR = [-0.7, 0, -0.1]; break;
        case 'basket': aL = [-0.35, 0, 0.15]; break;
        case 'chat': if (S.chatTalk) aR = [-1.0 + Math.sin(t * 5) * 0.25, 0, -0.35 - Math.sin(t * 2.5) * 0.25]; break;
        case 'run': aL = [-0.4 + sw * 0.9, 0, 0.6]; aR = [-0.4 - sw * 0.9, 0, -0.6]; break;
        case 'pinwheel': aL = [-0.4 + sw * 0.6 * walk, 0, 0.4]; aR = [-1.9, 0, -0.25]; break;
        case 'hips': aL = [0.1, 0, -0.6]; aR = [0.1, 0, 0.6]; break;
        case 'tinker': aL = [-1.05, 0, 0.42]; aR = [-1.0 + Math.sin(t * 7) * 0.05, 0, -0.45]; break;
        case 'wipe': aL = [-0.4, 0, 0.2]; aR = [-1.15 + Math.sin(t * 6) * 0.18, Math.cos(t * 6) * 0.3, -0.35 + Math.cos(t * 6) * 0.2]; break;
        case 'knit': { const k = Math.sin(t * 9); aL = [-0.95 + k * 0.05, 0, 0.35]; aR = [-0.95 - k * 0.05, 0, -0.35]; break; }
        case 'juggle': { const k = Math.sin(t * TAU * 1.3); aL = [-1.25 + k * 0.25, 0, 0.3]; aR = [-1.25 - k * 0.25, 0, -0.3]; break; }
      }
      if (d.prop === 'pinwheel' && S.pose !== 'pinwheel' && S.pose !== 'run') aR = [-1.7, 0, -0.25];
      if (d.prop === 'pinwheel') aR = S.pose === 'run' ? [-1.9 + sw * 0.15, 0, -0.25] : aR;
      if (S.sit && !S.pose && !hush) { aL = [-0.75, 0, 0.3]; aR = [-0.75, 0, -0.3]; }
      if (S.wave > 0 && !hush) { S.wave -= dt; if (!['carry', 'barrow', 'push', 'juggle', 'knit'].includes(S.pose)) aR = [-0.3, 0, -2.4 + Math.sin(t * 9) * 0.35]; }
      R.arms[0].rotation.set(...aL); R.arms[1].rotation.set(...aR);
      if (P.pinHead) P.pinHead.rotation.z -= dt * (4 + S.speed * 5);
      // the head: looks at you when you're close, else idles; the hushed stare at nothing
      let hy, hx = 0;
      if (hush) { hy = S.stare; hx = 0.2; }
      else if (S.lookAt !== undefined) { hy = clamp(angDiff(S.yaw + R.body.rotation.y, S.lookAt), -1.2, 1.2); hx = -0.05; }
      else hy = S.pose === 'push' ? Math.sin(t * 0.4) * 0.15 : Math.sin(t * 0.37 + S.seed * 20) * (S.speed > 0.1 ? 0.15 : 0.55);
      if (S.nod) hx += Math.max(0, Math.sin(t * 6)) * 0.12;
      if (S.pose === 'tinker' || S.pose === 'knit') { hx += 0.38; if (S.lookAt === undefined) hy = 0; }
      if (S.pose === 'juggle') hx -= 0.25;
      if (S.pose === 'push') hx += 0.12;
      R.head.rotation.y = damp(R.head.rotation.y, hy, 5, dt); R.head.rotation.x = damp(R.head.rotation.x, hx, 6, dt);
      if (!hush && (S.blink -= dt) < 0) { if (S.blink < -0.12) S.blink = 2 + R0() * 3.5; }
      const bl = !hush && S.blink < 0 ? 0.12 : 1;
      R.eyes.forEach(e => { e.scale.y = bl; });
      R.mouth.scale.y = S.talk > 0.3 ? 0.012 + Math.abs(Math.sin(t * 16)) * 0.035 : S.pose === 'push' ? 0.02 : 0.012;
      R.root.updateMatrixWorld(true);
    }
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
    let bellSwing = 0, bellAmp = 0, bellDecay = 0.12;
    function update(dt, t, you, millAmt) {
      // people
      const pepa = byId.pepa;
      kids.stop = !!you && pepa && (pepa._S.near || pepa.talking);
      if (!kids.stop) { kids.a += dt * 0.95 * kids.sgn; if ((kids.flip -= dt) < 0) { kids.flip = 7 + R() * 5; kids.sgn = -kids.sgn; } }
      for (const p of people) { think(p, dt, t, you); pose(p, dt, t); }
      // the cart follows Marga's work: its axle on the track, turned as she turns it, wheels rolling
      {
        const y = gy(F.cx, T.z), [fx, fz] = [Math.sin(F.yaw), Math.cos(F.yaw)], ahead = gy(F.cx + fx * 0.6, T.z + fz * 0.6), behind = gy(F.cx - fx * 0.6, T.z - fz * 0.6);
        cart.root.position.set(F.cx, y, T.z); cart.root.rotation.set(0, F.yaw, 0); cart.root.rotateX(-Math.atan2(ahead - behind, 1.2));
        cart.wheels.forEach(w => { w.rotation.x = F.roll / 0.36; });
        cart.root.updateMatrixWorld(true);
        moving[0].x = F.cx; moving[0].z = T.z;
        // little drops of effort while she pushes
        const S = farmer._S, pushing = F.mode === 'push' && !farmer.talking && !F.hold;
        drops.forEach((n, i) => {
          const u = (t * 0.7 + i * 0.5) % 1, on = pushing && u < 0.5;
          n.position.set(S.x + Math.sin(S.yaw + (i ? 1.6 : -1.6)) * (0.24 + u * 0.4), S.gy + 1.62 + u * 0.3 - u * u * 0.8, S.z + Math.cos(S.yaw + (i ? 1.6 : -1.6)) * (0.24 + u * 0.4));
          n.scale.set(on ? 0.035 : 0.0001, on ? 0.05 : 0.0001, on ? 0.035 : 0.0001); n.updateMatrixWorld(true);
        });
      }
      // Pepa's hens run ahead of her round the well, and peck when she stops
      hens.forEach((h, i) => {
        const A = h.A;
        if (kids.stop || !pepa) { h.peck += dt; A.body.rotation.x = Math.max(0, Math.sin(h.peck * 5 + i)) * 0.5; A.head.rotation.x = Math.max(0, Math.sin(h.peck * 7 + i)) * 0.9; }
        else {
          const a = kids.a + kids.sgn * h.off, r = 6.3 + Math.sin(t * 2 + i) * 0.5, nx = SQ.x + Math.cos(a) * r, nz = SQ.z + Math.sin(a) * r;
          if (h.x) h.yaw = Math.atan2(nx - h.x, nz - h.z);
          h.x = nx; h.z = nz; A.body.rotation.x = -0.15; A.head.rotation.x = -0.2;
          A.wings.forEach((w, s) => { w.rotation.z = (s ? -1 : 1) * (0.3 + Math.sin(t * 26 + i) * 0.6); });
        }
        if (!h.x) { const a = i * 1.4; h.x = SQ.x + Math.cos(a) * 6.3; h.z = SQ.z + Math.sin(a) * 6.3; }
        if (kids.stop) A.wings.forEach(w => { w.rotation.z = 0; });
        A.root.position.set(h.x, GY + (kids.stop ? 0 : Math.abs(Math.sin(t * 14 + i)) * 0.06), h.z); A.root.rotation.y = h.yaw;
        A.legs.forEach((l, j) => { l.rotation.x = kids.stop ? 0 : Math.sin(t * 22 + j * Math.PI) * 0.7; });
        A.root.updateMatrixWorld(true);
      });
      // Toni's apples: a three-ball cascade, in front of him
      const toni = byId.toni;
      if (toni) apples.forEach((n, i) => {
        const u = (t * 0.9 + i / 3) % 1, k = u < 0.5 ? u / 0.5 : (u - 0.5) / 0.5;
        const x = u < 0.5 ? lerp(-0.24, 0.24, k) : lerp(0.24, -0.24, k), y = 0.78 + (u < 0.5 ? 0.85 * 4 * k * (1 - k) : 0.12 * 4 * k * (1 - k));
        V.set(x, y, 0.36).applyMatrix4(toni._R.root.matrixWorld); n.position.copy(V); n.updateMatrixWorld(true);
      });
      // sheep: graze, wander a little, look up at you over the fence
      sheep.forEach((s, i) => {
        const A = s.A, nearYou = you && Math.hypot(you.x - s.x, you.z - s.z) < 4;
        s.t -= dt;
        if (s.t < 0) { if (s.mode === 'graze' && R() < 0.5) { s.mode = 'walk'; s.tx = lerp(pen.x0 + 1.2, pen.x1 - 1.2, R()); s.tz = lerp(pen.z0 + 1.2, pen.z1 - 1.2, R()); s.t = 6; } else { s.mode = 'graze'; s.t = 3 + R() * 5; } }
        let mv = 0;
        if (s.mode === 'walk') { const dx = s.tx - s.x, dz = s.tz - s.z, dd = Math.hypot(dx, dz); if (dd < 0.1) { s.mode = 'graze'; s.t = 3 + R() * 4; } else { const st = Math.min(dd, 0.5 * dt); s.x += dx / dd * st; s.z += dz / dd * st; s.yaw = dampAngle(s.yaw, Math.atan2(dx, dz), 4, dt); mv = 1; s.ph += dt * 7; } }
        for (const o of sheep) if (o !== s) { const dx = s.x - o.x, dz = s.z - o.z, dd = Math.hypot(dx, dz); if (dd < 0.95 && dd > 1e-3) { s.x += dx / dd * (0.95 - dd) * 0.5; s.z += dz / dd * (0.95 - dd) * 0.5; } }
        A.root.position.set(s.x, gy(s.x, s.z), s.z); A.root.rotation.y = s.yaw;
        A.legs.forEach((l, j) => { l.rotation.x = mv ? Math.sin(s.ph + (j % 2 ? 0 : Math.PI) + (j > 1 ? Math.PI : 0)) * 0.5 : 0; });
        A.body.position.y = mv ? Math.abs(Math.sin(s.ph)) * 0.03 : 0;
        const look = nearYou ? clamp(angDiff(s.yaw, Math.atan2(you.x - s.x, you.z - s.z)), -1, 1) : 0;
        A.head.rotation.x = damp(A.head.rotation.x, s.mode === 'graze' && !nearYou ? 0.9 + Math.sin(t * 6 + i) * 0.08 : -0.1, 4, dt); A.head.rotation.y = damp(A.head.rotation.y, look, 4, dt);
        A.tail.rotation.y = Math.sin(t * 5 + i) * 0.3;
        A.root.updateMatrixWorld(true);
      });
      // Marga's dog, lying by the pen, head up and tail going when you come by
      {
        const A = dog.A, near = you && Math.hypot(you.x - dog.x, you.z - dog.z) < 4.5;
        A.root.position.set(dog.x, gy(dog.x, dog.z), dog.z); A.root.rotation.y = near ? dampAngle(A.root.rotation.y, Math.atan2(you.x - dog.x, you.z - dog.z), 3, dt) : dampAngle(A.root.rotation.y, dog.yaw, 2, dt);
        A.body.position.y = -0.14; A.body.rotation.x = 0; A.legs.forEach((l, i) => { l.rotation.x = i < 2 ? -1.35 : 1.3; });
        A.head.rotation.x = near ? -0.1 : 0.35; A.head.rotation.z = near ? Math.sin(t * 2) * 0.2 : 0;
        A.tail.rotation.z = Math.sin(t * (near ? 16 : 3)) * (near ? 0.8 : 0.2);
        A.root.updateMatrixWorld(true);
      }
      cats.forEach((c, i) => {
        const A = c.A; A.root.position.set(c.x, c.y, c.z); A.root.rotation.y = c.yaw;
        const near = you && Math.hypot(you.x - c.x, you.z - c.z) < 3;
        if (c.sleep) { A.body.scale.set(1, 1 + Math.sin(t * 1.6 + i) * 0.05, 1); A.tail.rotation.y = Math.sin(t * 0.7) * 0.15; A.head.rotation.set(0.35, 0.5, 0.3); }
        else { A.body.rotation.x = -0.75; A.body.position.y = 0.12; A.head.rotation.x = 0.7; A.head.rotation.y = near ? clamp(angDiff(c.yaw, Math.atan2(you.x - c.x, you.z - c.z)), -1, 1) : Math.sin(t * 0.6) * 0.6; A.tail.rotation.y = Math.sin(t * 2.2) * 0.6; }
        A.root.updateMatrixWorld(true);
      });
      bees.forEach((b, i) => {
        const a = t * b.w + b.ph; b.n.position.set(b.h.x + Math.cos(a) * b.r, b.h.y + Math.sin(a * 1.7) * 0.3, b.h.z + Math.sin(a * 1.3) * b.r); b.n.updateMatrixWorld(true);
      });
      // the bell: still while the mill is hushed; once it's free it rings, then sways
      const free = 1 - millAmt;
      bellAmp = Math.max(bellAmp - dt * bellDecay, 0.05 * free);
      bellSwing += dt * 2.6;
      bell.rotation.z = Math.sin(bellSwing) * bellAmp; bell.updateMatrixWorld(true);
      // Ciro's clock keeps good time (a minute a minute, here)
      minute.rotation.z = -(t / 60) * TAU; hour.rotation.z = -(t / 720) * TAU - 1.1; hands.updateMatrixWorld(true);
      folks.sync();
    }
    return {
      people, update, cart, moving, farmer: F, folks, sheep, hens, dog, cats, bell,
      ring(sec = 4) { bellAmp = Math.max(bellAmp, 0.55); bellDecay = 0.5 / Math.max(0.5, sec); bellSwing = 0; },
    };
  }

  // ------------------------------------------------------------ build it
  let TEX = null;
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function textures() {
    if (TEX) return TEX;
    const flag = TK.canvasTex(256, 256, (c, W, H) => {        // big warm flagstones (Alba's are small cobbles)
      c.fillStyle = '#a8957a'; c.fillRect(0, 0, W, H);
      const R = rng(17), rows = 5, rh = H / rows;
      for (let r = 0; r < rows; r++) {
        let x = (r % 2) * -rh * 0.7;
        while (x < W) {
          const w = rh * (1.1 + R() * 0.9), v = 0.9 + R() * 0.12, k = R();
          const col = k < 0.33 ? [243, 226, 196] : k < 0.66 ? [238, 214, 178] : [246, 233, 210];
          for (const ox of [0, -W, W]) {
            c.fillStyle = `rgb(${col[0] * v | 0},${col[1] * v | 0},${col[2] * v | 0})`; roundRect(c, x + ox + 3, r * rh + 3, w - 6, rh - 6, 6); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.18)'; roundRect(c, x + ox + 8, r * rh + 7, w - 18, (rh - 14) * 0.32, 4); c.fill();
          }
          x += w;
        }
      }
    });
    const earth = TK.canvasTex(128, 128, (c, W, H) => {
      c.fillStyle = '#e6d3ae'; c.fillRect(0, 0, W, H);
      const R = rng(4);
      for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * H, r = 1.2 + R() * 3; c.fillStyle = R() < 0.5 ? 'rgba(150,120,80,0.35)' : 'rgba(255,250,235,0.45)'; for (const ox of [0, -W, W]) for (const oy of [0, -H, H]) { c.beginPath(); c.ellipse(x + ox, y + oy, r * 1.4, r, R() * 3, 0, TAU); c.fill(); } }
    });
    for (const t of [flag, earth]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; }
    return (TEX = { flag, earth });
  }
  function build(scene, env = {}) {
    const ground = env.terrainAt || (() => GY);
    const gy = (x, z) => ground(x, z);
    const root = new THREE.Group(); root.name = 'molinar'; scene.add(root);
    const hillsG = new THREE.Group(); hillsG.name = 'molinar-hills'; const townG = new THREE.Group(); townG.name = 'molinar-town'; root.add(hillsG, townG);
    const out = { smoke: [], colliders: [], platforms: [], rotors: [], vanes: [], benches: [], lamps: [], trees: [], hillProps: [], gy };
    const kH = Kit(), kT = Kit();
    // (a tally of triangles per stage, for tuning the budget)
    const stages = {}, triCount = k => { let n = 0; for (const b of Object.values(k.B)) for (const p of b) n += ni(p.geo).attributes.position.count / 3 * (p.ink > 0 ? 2 : 1); return n; };
    let lastT = 0; const stage = name => { const n = triCount(kH) + triCount(kT); stages[name] = Math.round(n - lastT); lastT = n; };
    // the hills
    drawHills(kH, out, gy); stage('hills');
    // the town: houses, the special buildings, the Great Mill, the gate, the square, props, the ground
    for (const h of HOUSES) {
      const y0 = Math.min(...corners({ x: h.x, z: h.z, hw: h.w / 2, hd: h.d / 2, rot: h.rot }).map(([x, z]) => gy(x, z)), gy(h.x, h.z));
      drawHouse(kT, h, y0, out);
      out.colliders.push({ obox: 1, x: h.x, z: h.z, hw: h.w / 2 + 0.12, hd: h.d / 2 + 0.12, rot: h.rot });
    }
    stage('houses');
    drawSpecial(kT, out, gy); stage('special');
    drawGreatMill(kT, out, gy); stage('greatMill');
    drawGate(kT, out, gy); stage('gate');
    drawSquare(kT, out); stage('square');
    drawTownProps(kT, out); stage('props');
    drawGround(kT, gy); stage('ground');
    // bake the buckets into a handful of meshes per group
    const tex = textures(), meshes = {};
    const add = (grp, name, geo, mat, o = {}) => { const m = new THREE.Mesh(geo, mat); m.name = 'mol-' + name; m.castShadow = !!o.cast; m.receiveShadow = o.receive !== false; m.matrixAutoUpdate = false; m.updateMatrix(); grp.add(m); meshes[name] = m; return m; };
    for (const [grp, k, tag] of [[hillsG, kH, 'hills'], [townG, kT, 'town']]) {
      if (k.B.solid.length) { add(grp, tag + 'Solid', bake(k.B.solid), toonM({ vc: true, rim: 0.15, fade: true, hush: tag === 'town' }), { cast: true }); add(grp, tag + 'Ink', bake(k.B.solid, { hull: true }), inkM({ fade: true }), { receive: false }); }
      if (k.B.sway.length) { add(grp, tag + 'Sway', bake(k.B.sway), toonM({ vc: true, rim: 0.22, fade: true, sway: true }), { cast: true }); add(grp, tag + 'SwayInk', bake(k.B.sway, { hull: true }), inkM({ fade: true, sway: true }), { receive: false }); }
      if (k.B.flag.length) add(grp, tag + 'Flag', bake(k.B.flag, { uv: 0.3 }), toonM({ vc: true, map: tex.flag, poly: 2 }));
      if (k.B.earth.length) add(grp, tag + 'Earth', bake(k.B.earth, { uv: 0.25 }), toonM({ vc: true, map: tex.earth, poly: 1 }));
    }
    // the sails: every mill's rotor is one instance (the Great Mill's drains gray while it's hushed); the little ones share a lighter rotor
    const rotors = out.rotors.filter(r => !r.lite), smallRotors = out.rotors.filter(r => r.lite)
      .concat(out.vanes.map(v => ({ x: v.p.x, y: v.p.y, z: v.p.z, yaw: v.yaw, fwd: 0, s: v.s || 0.13, speed: 1.4, ang: v.p.x, vane: true, great: !!v.hush })));
    const rotorMesh = (geos, list, name, shadow) => {
      const hushAttr = new Float32Array(list.length); list.forEach((r, i) => { hushAttr[i] = r.great ? 1 : 0; });
      geos.solid.setAttribute('aHush', new THREE.InstancedBufferAttribute(hushAttr, 1));
      const im = new THREE.InstancedMesh(geos.solid, toonM({ vc: true, rim: 0.2, fade: true, hush: true }), list.length);
      const ink = new THREE.InstancedMesh(geos.ink, inkM({ fade: true }), list.length); ink.instanceMatrix = im.instanceMatrix;
      im.castShadow = shadow; im.frustumCulled = ink.frustumCulled = false; im.name = 'mol-' + name; ink.name = 'mol-' + name + '-ink';
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); root.add(im, ink);
      return im;
    };
    const sails = rotorMesh(rotorGeos(), rotors, 'sails', true), vanes = rotorMesh(rotorLiteGeos(), smallRotors, 'vanes', false), RN = rotors.length + smallRotors.length;
    // the wheat
    const wheatG = wheatGeo(), spots = [];
    {
      const Rw = rng(73), sp = 0.5;
      for (const f of FIELDS) {
        const nx = Math.floor(f.hw * 2 / sp), nz = Math.floor(f.hd * 2 / sp);
        for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
          const lx = -f.hw + (i / nx) * f.hw * 2 + (Rw() - 0.5) * sp * 0.8, lz = -f.hd + (j / nz) * f.hd * 2 + (Rw() - 0.5) * sp * 0.8;
          const edge = Math.min(f.hw - Math.abs(lx), f.hd - Math.abs(lz)); if (edge < 0.05) continue;
          const [x, z] = toWorld(f, lx, lz); if (Math.hypot(x - SCARECROW.x, z - SCARECROW.z) < 0.7) continue;
          spots.push({ x, z, y: gy(x, z) - 0.02, s: (0.85 + Rw() * 0.3) * (0.78 + 0.22 * smoothstep(0, 0.9, edge)), t: 0.92 + Rw() * 0.14 });
        }
      }
    }
    const wheat = new THREE.InstancedMesh(wheatG, wheatMat(), spots.length);
    { const c = new THREE.Color(); spots.forEach((p, i) => { M.compose(V.set(p.x, p.y, p.z), Q.identity(), SC.set(p.s, p.s * (0.9 + p.t * 0.2), p.s)); wheat.setMatrixAt(i, M); wheat.setColorAt(i, c.setRGB(p.t, p.t, p.t * 0.97)); }); }
    wheat.frustumCulled = false; wheat.name = 'mol-wheat'; hillsG.add(wheat);
    // the town's name over the west gate (a board in the merged mesh; its face, the name, here). zh / ja: its name there
    // (CJK.md: 磨坊镇 / モリナール) in the mode, repainted when the language or mode changes (signs.js SIGNS.board)
    const paintGate = (c, W, H, l) => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#6b4a33'; roundRect(c, 4, 4, W - 8, H - 8, 24); c.fill();
      c.fillStyle = '#fbf3df'; roundRect(c, 15, 15, W - 30, H - 30, 17); c.fill();
      c.strokeStyle = '#d9a03a'; c.lineWidth = 4; roundRect(c, 27, 27, W - 54, H - 54, 11); c.stroke();
      for (const x of [62, W - 62]) {            // a little windmill at each end
        c.save(); c.translate(x, H / 2 + 6);
        c.fillStyle = '#ffffff'; c.strokeStyle = '#5b3a22'; c.lineWidth = 3; c.beginPath(); c.moveTo(-13, 30); c.lineTo(-10, -12); c.lineTo(10, -12); c.lineTo(13, 30); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#5a463c'; c.beginPath(); c.moveTo(-14, -11); c.lineTo(0, -27); c.lineTo(14, -11); c.closePath(); c.fill();
        c.translate(0, -15); c.fillStyle = '#c9643f';
        for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.fillRect(2, -4, 26, 8); }
        c.restore();
      }
      const cj = (l === 'zh' || l === 'ja') && typeof CJK !== 'undefined', name = cj ? CJK.plain(GATE_NAME[l], { lang: l }) : 'MOLINAR';
      let px = 72; c.font = `900 ${px}px "Trebuchet MS", Bahnschrift, "Segoe UI", sans-serif`;
      while (cj && px > 30 && c.measureText(name).width > W - 200) { px -= 2; c.font = `900 ${px}px "Trebuchet MS", Bahnschrift, "Segoe UI", sans-serif`; }
      c.fillStyle = '#5b3a22'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, W / 2, H / 2 + 5);
    };
    const GATE_NAME = { zh: '[磨坊镇|Mò fáng zhèn]', ja: 'モリナール' };
    const signTex = TK.canvasTex(512, 160, (c, W, H) => paintGate(c, W, H, 'es'));
    if (typeof SIGNS !== 'undefined' && SIGNS.board) {
      SIGNS.board(l => { const cv = signTex.image; paintGate(cv.getContext('2d'), cv.width, cv.height, l); signTex.needsUpdate = true; });
      // (zh / ja: E «Read» under the arch, for its name in the language)
      SIGNS.add({ id: 'molinar.gate', x: out.gateSign.at.x, z: out.gateSign.at.z, r: 3.0, when: () => (UI.lang === 'zh' || UI.lang === 'ja'),
        card: l => ({ tag: 'The sign over Molinar’s gate', lines: [{ text: GATE_NAME[l] || 'Molinar', en: 'Molinar, the town of mills' }] }) });
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.12), new THREE.MeshToonMaterial({ map: signTex, gradientMap: TK.grad }));
    sign.position.copy(out.gateSign.at); sign.position.x -= 0.02; sign.rotation.y = out.gateSign.rot; sign.name = 'mol-gate-sign'; townG.add(sign);
    { // the name on the arch's town side too (a plane has one face: from inside the town it was blank), turned round, behind the beam
      const r = out.gateSign.rot, back = sign.clone(); back.rotation.set(0, r + Math.PI, 0); back.name = 'mol-gate-sign-back';      // (set all three: a clone's Euler can come back as (π, …, π))
      back.position.copy(out.gateSign.at); back.position.x -= Math.sin(r) * 1.08; back.position.z -= Math.cos(r) * 1.08; townG.add(back); }
    const dyn = makeDynamic(root, out, gy);
    // ---------------- chimney smoke: puffs with ink outlines
    const SMOKE_N = 4, smokeSpots = out.smoke.slice(0, 7).map(p => ({ p, big: out.bigSmoke && p.distanceTo(out.bigSmoke) < 0.5, seed: (p.x * 0.37 + p.z * 0.11) % 1 }));
    const puffGeo = new THREE.IcosahedronGeometry(1, 1);
    const smoke = new THREE.InstancedMesh(puffGeo, toonM({ rim: 0.25, color: '#f4f2ee' }), Math.max(1, smokeSpots.length * SMOKE_N));
    const smokeInk = new THREE.InstancedMesh(puffGeo, inkM({ off: 0.06 }), smoke.count); smokeInk.instanceMatrix = smoke.instanceMatrix;
    smoke.frustumCulled = smokeInk.frustumCulled = false; smoke.name = 'mol-smoke'; smokeInk.name = 'mol-smoke-ink'; root.add(smoke, smokeInk);

    // ---------------- the Great Mill's hush, and the sails
    let millTarget = 1, millAmt = 1, greatSpin = 0;
    const UP = new THREE.Vector3(0, 1, 0), ZA = new THREE.Vector3(0, 0, 1), qy = new THREE.Quaternion(), qz = new THREE.Quaternion();
    function placeRotors(dt) {
      for (const [im, list] of [[sails, rotors], [vanes, smallRotors]]) {
        list.forEach((r, i) => {
          const sp = r.great ? greatSpin : 1;
          r.ang += dt * r.speed * sp;
          qy.setFromAxisAngle(UP, r.yaw); qz.setFromAxisAngle(ZA, r.ang); Q.copy(qy).multiply(qz);
          V.set(r.x + Math.sin(r.yaw) * r.fwd, r.y, r.z + Math.cos(r.yaw) * r.fwd);
          M.compose(V, Q, SC.setScalar(r.s)); im.setMatrixAt(i, M);
        });
        im.instanceMatrix.needsUpdate = true;
      }
    }
    placeRotors(0);
    dyn.folks.recolorBell(1);
    let lastAmt = 1;
    const landmarks = {};
    for (const [key, p] of Object.entries(LM)) landmarks[key] = Array.isArray(p) ? p.map(q => ({ ...q })) : { ...p };
    landmarks.bell = { x: out.bellAt.x, y: out.bellAt.y, z: out.bellAt.z };
    landmarks.millDoor.y = out.mill.base + 0.56;
    const stalls = STALLS.map(s => ({ id: s.id, x: +s.x.toFixed(2), z: +s.z.toFixed(2), yaw: +s.rot.toFixed(4), keeper: s.keeper, front: s.front, hushed: !!s.hushed }));
    function update(dt, t, you) {
      U.uTime.value = t;
      if (you) { const y = you.y !== undefined ? you.y : gy(you.x, you.z); U.uFocus.value.set(you.x, y + 1.0, you.z); U.uYou.value.set(you.x, y, you.z); }
      else { U.uFocus.value.set(0, -1e4, 0); U.uYou.value.set(0, -1e4, 0); }
      millAmt = millTarget > millAmt ? Math.min(millTarget, millAmt + dt * 1.5) : Math.max(millTarget, millAmt - dt * 0.45);
      U.uHush.value = millAmt;
      if (Math.abs(millAmt - lastAmt) > 0.004) { dyn.folks.recolorBell(millAmt); lastAmt = millAmt; }
      greatSpin = damp(greatSpin, 1 - millTarget, millTarget ? 3 : 0.5, dt);
      placeRotors(dt);
      dyn.update(dt, t, you, millAmt);
      // smoke
      let n = 0;
      for (const s of smokeSpots) for (let j = 0; j < SMOKE_N; j++) {
        const per = s.big ? 2.4 : 3.4, u = (t / per + j / SMOKE_N + s.seed) % 1, k = s.big ? 1.4 : 1;
        const sz = (0.26 + u * 0.7) * Math.min(1, u * 5) * (1 - Math.pow(u, 3)) * k * (0.8 + 0.4 * ((j * 0.618 + s.seed * 3) % 1));
        V.set(s.p.x + u * 1.4 + (j % 2 ? 1 : -1) * 0.22 * u + Math.sin(u * 5 + s.seed * 9) * 0.2, s.p.y + 0.1 + u * 2.6 * k, s.p.z + u * 0.6 + (j % 2 ? -1 : 1) * 0.15 * u);
        M.compose(V, Q.identity(), SC.set(sz, sz * 0.9, sz)); smoke.setMatrixAt(n++, M);
      }
      smoke.instanceMatrix.needsUpdate = true;
    }
    function stats() {
      let tris = 0, calls = 0, casters = 0;
      root.traverse(o => { if (o.isMesh && o.visible) { const g = o.geometry, k = (g.index ? g.index.count : g.attributes.position.count) / 3, mats = Array.isArray(o.material) ? o.material.length : 1; tris += k * (o.isInstancedMesh ? o.count : 1); calls += mats; if (o.castShadow) casters++; } });
      return { tris: Math.round(tris), meshes: calls, shadowCasters: casters, houses: HOUSES.length, buildings: FIXED.length + HOUSES.length + 3, people: dyn.people.length, wheat: spots.length, sails: RN };
    }
    return {
      colliders: out.colliders, platforms: out.platforms, moving: dyn.moving, update, people: dyn.people, stalls, landmarks, group: root, meshes,
      objects: { cart: dyn.cart.root, farmer: dyn.people.find(p => p.id === 'farmer'), farmerState: dyn.farmer, mill: { x: GM.x, z: GM.z, door: landmarks.millDoor, top: out.mill.top, hub: out.mill.hubY, base: out.mill.base, gallery: out.mill.gallery },
        bell: dyn.bell, sails, vanes, wheat, sign, hills: hillsG, town: townG, sheep: dyn.sheep, hens: dyn.hens, dog: dyn.dog, cats: dyn.cats, folks: dyn.folks.list.map(l => l.im) },
      pavedAt, fieldAt, bareAt, keepClear, distTo, layout: LAYOUT,
      setMillHushed(on, quiet) { millTarget = on ? 1 : 0; if (quiet) { millAmt = millTarget; greatSpin = 1 - millTarget; } else if (!on) dyn.ring(); },   // (quiet: a loaded save, no bell and no fade)
      get millHushed() { return millTarget > 0.5; },
      ringBell(sec) { dyn.ring(sec); },
      setFade(on) { U.uFade.value = on ? 1 : 0; },
      stats,
      _dev: { out, rotors, spots, HOUSES, FIXED, STALLS, roadDist, BOULDER, stages },
    };
  }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
  return { build, layout: LAYOUT, landmarks: LM, pavedAt, fieldAt, bareAt, keepClear, distTo, GY, roadDist };
})();
