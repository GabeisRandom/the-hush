'use strict';
// The Quarry Caves (DESIGN.md 14.1, region 3; 14.10): the third bell, north of the East Field, up in the mountains.
// A gravel road leaves the road east at the field (56, −148), runs north past the big hill and climbs a rocky canyon to
// the miners' camp at the quarry's mouth (88, −266): log cabins (Cande's office, the bunkhouse, the canteen), a first-aid
// tent, rails and minecarts, lamps on posts, a cold fire pit, crates, and the quarry face with the timber-framed mouth of
// the mine, sealed by gray Hush stone and ringed with dark crystals. Until the lake's bell rings (lakeFree below) a thick
// gray mist hangs across the road at the canyon's foot, and you can't get through.
// The miners lost their words: here you teach *them*. Say how each one is or what they need («Está cansado», «Tiene
// frío», «Le duele la cabeza»…) and Cande, the camp boss, gets them the right help (coffee, a blanket, soup, a lamp,
// medicine, a song). Graded S–D like the shop: the verb (estar / tener / doler · estar com / ter · sein / haben / dative),
// agreement with the miner, the person. The right help gives them their words back.
// Pío, Cande's canary, is the only one still singing: Mimo learns «canta / canta / sing» by watching him, then sings the
// crystals at the mine's mouth awake, and the gray stone crumbles (the mine itself is mine.js: MINE).
//
// One global, CAVES, shaped like CEMETERY / LAKE:
//   plain data, ready before world.js: layout, landmarks, hush, roadDist(x, z), ground(x, z, h), playDist(x, z),
//     keepClear(x, z, pad), bareAt(x, z), pathAt(x, z), areaAt(x, z), songAt(x, z), drawMap(ctx, o), roamers, lakeFree(state)
//   CAVES.build(scene, { terrainAt }) → { colliders, platforms, group, people, update(dt, t, you|null), landmarks, objects, stats() }
//   the game side: init(game) (words, lines, the quest steps), interactables(), curiosities(), target(), zones,
//     restoreAll(), state in state.caves; flags: camp, cande, mineOpen, caveFree (set by mine.js), bells
// Needs THREE (r128), core.js, toonkit.js, lexicon.js, lines.js and icons.js at load; UI, STORY, WORLD, Sound at run time.

const CAVES = (() => {
  const INK = '#2b2235';
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  // ================================================================ the gate: when the region opens
  // The region opens once the Mirror Lake's bell (bell 2) has rung. The lake's own flag will be named like the mill's
  // (flags.millFree); until it exists, two bells rung counts too. This is the one place that decides it.
  const LAKE_FLAG = 'lakeFree';
  const lakeFree = s => !!(s && s.flags && (s.flags[LAKE_FLAG] || (s.flags.bells || 0) >= 2));

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
  function segDist(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
  }
  // the quarry road: from the road east (at the field) north past the big hill, up the canyon into the camp
  const ROAD_PTS = [[56, -148], [53, -160], [50, -174], [49, -188], [51, -202], [55, -215], [61, -227], [68, -238], [76, -248], [83, -256]];
  const ROAD = spline(ROAD_PTS, 6);
  const ROAD_LEN = (() => { let s = 0; for (let i = 1; i < ROAD.length; i++) s += Math.hypot(ROAD[i][0] - ROAD[i - 1][0], ROAD[i][1] - ROAD[i - 1][1]); return s; })();
  let RB = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9 };
  for (const [x, z] of ROAD) { RB.x0 = Math.min(RB.x0, x); RB.x1 = Math.max(RB.x1, x); RB.z0 = Math.min(RB.z0, z); RB.z1 = Math.max(RB.z1, z); }
  function roadDist(x, z) {
    if (x < RB.x0 - 30 || x > RB.x1 + 30 || z < RB.z0 - 30 || z > RB.z1 + 30) return 1e9;
    let d = 1e9;
    for (let i = 0; i < ROAD.length - 1; i++) d = Math.min(d, segDist(x, z, ROAD[i][0], ROAD[i][1], ROAD[i + 1][0], ROAD[i + 1][1]));
    return d;
  }
  // the camp: a flat gravel floor in a bowl at the quarry's mouth (its height is the road's, as world.js smooths roads:
  // 0.4 stays 0.4 under its h·0.5 + 0.2, so the floor doesn't dip where the road comes in)
  const CAMP = { x: 88, z: -266, rx: 22, rz: 15, y: 0.4 };
  const bowlE = (x, z) => Math.hypot((x - CAMP.x) / CAMP.rx, (z - CAMP.z) / CAMP.rz);
  const bowlDist = (x, z) => (bowlE(x, z) - 1) * CAMP.rz;          // (roughly the distance to the bowl's edge: < 0 inside)
  const GATE = { x: 58.6, z: -221.8, r: 7 };                        // the gray mist across the road, until the lake's bell rings
  const MOUTH = { x: 88, z: -280.6 };                               // the mine's mouth, in the quarry face (it looks south)
  const REGION = { x0: 30, x1: 150, zS: -194, zN: -300 };            // where this file shapes the land (north of the field)
  // the buildings (front = local +z, rot = the mesh's rotation.y, as the towns do it); w × d, floors for the camera's blockers
  const B = (id, x, z, w, d, rot, kind, floors = 1) => ({ id, x, z, w, d, rot, kind, floors });
  const BUILDINGS = [
    B('office', 70.2, -267.2, 6.4, 5.2, Math.PI / 2, 'office'),            // Cande's office, door to the east (the canary's cage on its porch)
    B('bunk', 106.4, -268.6, 7.6, 5.4, -Math.PI / 2, 'bunk'),             // the bunkhouse, door to the west
    B('canteen', 103.6, -254.4, 8.4, 5.0, -Math.PI / 2 - 0.35, 'canteen'),  // the canteen (tables out front), facing the camp
    B('shed', 99.6, -279.0, 4.6, 3.6, 0.1, 'shed', 0.8),                  // the tool shed by the quarry face
  ];
  const TENT = { x: 74.6, z: -253.4, w: 5.0, d: 4.2, rot: Math.PI / 2 + 0.3 };     // the first-aid tent
  const PIT = { x: 86.4, z: -266.4, r: 1.3 };                                       // the fire pit in the middle (cold until the end)
  const RAIL = [[88, -279.6], [88, -270], [87.6, -262], [85.4, -256.6], [82.4, -253.4]];   // from the mouth to the buffer
  const SPOT = {
    cande: { x: 74.4, z: -264.6, yaw: Math.PI / 2 + 0.25 },
    cage: { x: 73.9, z: -262.5 },
    canteen: { x: 99.4, z: -255.8 }, tent: { x: 77.4, z: -254.6 }, crates: { x: 95.4, z: -276.4 }, lampPost: { x: 92.6, z: -272.8 }, water: { x: 100.6, z: -259.6 },
    enter: { x: 79.5, z: -251.5 }, watch: { x: 77.6, z: -261.6 }, mouthFront: { x: 88, z: -276.2 },
  };
  // the miners (es/pt names that read in every language; g: the gender their adjectives agree with)
  // state: what's wrong (the help box's answer); help: what Cande sends; from: where Mimo fetches it
  const MINERS = [
    { id: 'paco', name: 'Paco', g: 'm', state: 'tired', help: 'coffee', from: 'canteen', x: 84.0, z: -259.0, yaw: 2.6, seat: true, look: { shirt: '#c45a3c', pants: '#4a4f66', skin: '#e6b48c', hair: '#2e2420', hat: '#e8b83a' } },
    { id: 'rocio', name: 'Rocío', g: 'f', state: 'cold', help: 'blanket', from: 'crates', x: 82.8, z: -268.8, yaw: 1.2, look: { shirt: '#3e7fb0', pants: '#4a4566', skin: '#c98e62', hair: '#1f1a18', hat: '#e8b83a', braid: true } },
    { id: 'lucho', name: 'Lucho', g: 'm', state: 'hungry', help: 'soup', from: 'canteen', x: 97.6, z: -250.8, yaw: -2.6, look: { shirt: '#5f9a4a', pants: '#4f4436', skin: '#f0c7a0', hair: '#6b3b25', hat: '#d9783a', wide: 1.15 } },
    { id: 'maite', name: 'Maite', g: 'f', state: 'scared', help: 'lamp', from: 'lampPost', x: 91.2, z: -275.2, yaw: 0.3, look: { shirt: '#b84a7a', pants: '#3c4a5a', skin: '#efc29a', hair: '#8a4a2a', hat: '#e8b83a', bun: true } },
    { id: 'efrain', name: 'Efraín', g: 'm', state: 'headache', help: 'medicine', from: 'tent', x: 78.8, z: -252.0, yaw: 1.9, old: true, look: { shirt: '#8a6a4a', pants: '#3f3a4a', skin: '#c98e62', hair: '#e8e4dc', hat: '#e8b83a', beard: true } },
    { id: 'lupe', name: 'Lupe', g: 'f', state: 'sad', help: 'song', from: 'cage', x: 102.2, z: -266.6, yaw: -1.4, seat: true, look: { shirt: '#e0a43c', pants: '#4a4566', skin: '#a8714a', hair: '#1f1a18', hat: '#e8b83a', bun: true } },
  ];
  // Chepe, lost in the mine (mine.js finds him); after that he's in the camp too
  const CHEPE = { id: 'chepe', name: 'Chepe', g: 'm', state: 'lost', help: 'way', x: 94.6, z: -262.4, yaw: -2.2, look: { shirt: '#4f8a7a', pants: '#4a4f66', skin: '#d9a27a', hair: '#3a2b26', hat: '#e8b83a' } };
  // the crystals around the mine's mouth (dark until Mimo sings), as [x, z, height, lean]
  const CRYSTALS = [[83.2, -279.6, 1.5, -0.5], [84.6, -280.9, 2.2, -0.2], [91.6, -280.8, 1.9, 0.25], [93.0, -279.4, 1.4, 0.55], [81.6, -278.0, 0.9, -0.7], [94.6, -277.8, 1.0, 0.7], [86.1, -278.1, 0.7, -0.3], [90.2, -277.9, 0.8, 0.35]];
  const LAMPS = [[80.6, -258.6], [95.2, -260.6], [79.6, -272.6], [92.6, -272.8], [88.6, -252.2], [100.6, -272.4]];
  // the echo bats on the quarry road (they show up once the mist has lifted); fights in the cave arena
  const ROAMERS = [
    { x: 60.5, z: -233, area: 'quarry', biome: 'cave', foes: [{ kind: 'bat', color: 'blue' }, { kind: 'bat', color: 'red' }] },
    { x: 72.5, z: -244, area: 'quarry', biome: 'cave', foes: [{ kind: 'bat', color: 'green' }, { kind: 'moth', color: 'yellow' }] },
    { x: 51.5, z: -211, area: 'quarry', biome: 'cave', foes: [{ kind: 'bat', color: 'yellow' }, { kind: 'hushling', color: 'blue' }] },
  ];
  // the gray patches world.js adds to L.hush: the camp (it lifts when the gong rings) and the mist at the gate
  const HUSH = [{ x: 88, z: -267, r: 17, a: 0.62, caves: true }, { x: GATE.x, z: GATE.z, r: 9, a: 0.85, cavesGate: true }];

  // ================================================================ the ground (world.js rawHeight, playDist, grass, scatter)
  // the mountains: rock rising away from the road and the camp (north of the field), steepest behind the camp, where the
  // quarry face is; the camp's floor is flat
  function mountain(x, z) {
    const zf = smoothstep(-196, -222, z), xf = smoothstep(REGION.x0, REGION.x0 + 14, x) * (1 - smoothstep(REGION.x1 - 14, REGION.x1, x));
    if (zf <= 0 || xf <= 0) return 0;
    const d = Math.min(roadDist(x, z), bowlDist(x, z));
    let m = 15 * smoothstep(2.5, 13, d) + 6 * smoothstep(13, 30, d);
    m += 2.4 * Math.sin(x * 0.31 + 1.1) * Math.sin(z * 0.27) * smoothstep(5, 14, d) + 1.2 * Math.sin(x * 0.83 + z * 0.61) * smoothstep(4, 9, d);
    // the quarry face: a steep wall right behind the camp, cut in terraces
    const face = smoothstep(-279.6, -283.4, z) * (1 - smoothstep(19, 27, Math.abs(x - CAMP.x)));
    m = Math.max(m, face * (9 + 1.4 * Math.floor(smoothstep(-283, -296, z) * 4)));
    return m * zf * xf;
  }
  function ground(x, z, h) {
    if (x < REGION.x0 || x > REGION.x1 || z > REGION.zS || z < REGION.zN - 12) return h;
    const inB = 1 - smoothstep(-2, 1, bowlDist(x, z));
    if (inB > 0) h = lerp(h, CAMP.y, inB);
    return h + mountain(x, z);
  }
  // how far from anywhere you're meant to be (negative inside): the road (narrow at the gate), and the camp. Up in the
  // mountains (past a thin belt of pines at the foot of the slopes) it jumps past world.js's tree wall (> 26), so the
  // rock stays bare: the canyon's edges are walls of invisible solids instead (build: corridorWalls)
  function playDist(x, z) {
    if (x < REGION.x0 - 20 || x > REGION.x1 + 10 || z > -140 || z < REGION.zN - 10) return 1e9;
    const g = Math.hypot(x - GATE.x, z - GATE.z);
    const open = z > -200 ? 9 : lerp(4.5, 7, smoothstep(4, 14, g));
    const d = Math.min(roadDist(x, z) - open, bowlDist(x, z) + 1.5);
    return z < -206 && d > 5.5 ? 30 + d : d;
  }
  // world3d.js: no woods past the map's edge where the mountains stand (their backdrop is drawn by build)
  const noOuterTree = (x, z) => z < -286 && z > -372 && x > REGION.x0 - 6 && x < REGION.x1 + 8;
  // world.js open(): no trees, rocks or flowers on the road, in the camp or by its things
  const KEEP = [];
  function keepClear(x, z, pad = 0) {
    if (x < REGION.x0 - 20 || x > REGION.x1 + 10 || z > -140 || z < REGION.zN - 10) return false;
    if (roadDist(x, z) < 3.2 + pad) return true;
    if (bowlDist(x, z) < 2.5 + pad) return true;
    if (Math.hypot(x - GATE.x, z - GATE.z) < 6 + pad) return true;
    for (const c of KEEP) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true;
    return false;
  }
  // world.js townBare: no grass on the road, the camp's gravel or the bare rock of the mountains (0..1)
  function bareAt(x, z) {
    if (x < REGION.x0 - 4 || x > REGION.x1 + 4 || z > -140 || z < REGION.zN - 10) return 0;
    let a = 1 - smoothstep(1.6, 2.6, roadDist(x, z));
    if (z < -196) {
      a = Math.max(a, 1 - smoothstep(-1, 1.5, bowlDist(x, z)));
      a = Math.max(a, 0.95 * smoothstep(3, 7, mountain(x, z)));
      if (z < -272 && Math.abs(x - MOUTH.x) < 30) a = 1;          // (the working ground at the foot of the quarry face, and the face)
    }
    return clamp(a, 0, 1);
  }
  // world.js's path mask (the ground's tan color): the road comes from world.js's own road list; the camp's gravel floor here
  function pathAt(x, z) {
    if (z > -244 || z < -284 || x < 60 || x > 116) return 0;
    return 0.85 * (1 - smoothstep(-2.5, 0.5, bowlDist(x, z)));
  }
  // the mini-map's area names
  const AREAS = { road: { id: 'quarryroad', name: 'The Quarry Road', color: '#8a7a64' }, camp: { id: 'minecamp', name: 'The Miners’ Camp', color: '#a8673a' } };
  function areaAt(x, z) {
    if (z > -196 || x < REGION.x0 || x > REGION.x1) return null;
    if (bowlDist(x, z) < 3) return AREAS.camp;
    if (roadDist(x, z) < 12) return AREAS.road;
    return null;
  }
  // the music: the camp has its own song (audio.js 'quarry', or Alba's when it isn't there); the road, the forest's
  function songAt(x, z) {
    const a = areaAt(x, z); if (!a) return null;
    if (a === AREAS.camp) return typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('quarry') ? 'quarry' : 'village';
    return 'forest';
  }
  // the mini-map's picture (minimap.js drawLand, in world units): the gravel road, the camp's floor, the roofs, the rails
  function drawMap(c, o = {}) {
    const PX = o.PX || 0.33, INKC = o.INK || INK;
    c.save();
    c.lineJoin = 'round'; c.lineCap = 'round';
    // the rock of the mountains: a few strokes of gray over the dark woods, so the canyon reads
    c.fillStyle = 'rgba(150,146,138,0.5)';
    for (let x = REGION.x0 + 8; x < REGION.x1 - 6; x += 3) for (let z = -292; z < -204; z += 3) {
      const m = mountain(x, z); if (m > 8) { c.globalAlpha = Math.min(0.55, (m - 8) * 0.05); c.fillRect(x - 1.5, z - 1.5, 3, 3); }
    }
    c.globalAlpha = 1;
    // the camp floor
    c.fillStyle = '#d9cdb4'; c.strokeStyle = 'rgba(86,66,38,0.6)'; c.lineWidth = 1.2 * PX;
    c.beginPath(); c.ellipse(CAMP.x, CAMP.z, CAMP.rx, CAMP.rz, 0, 0, TAU); c.fill(); c.stroke();
    // the road
    const path = () => { c.beginPath(); c.moveTo(ROAD[0][0], ROAD[0][1]); for (let i = 1; i < ROAD.length; i++) c.lineTo(ROAD[i][0], ROAD[i][1]); };
    c.strokeStyle = 'rgba(86,66,38,0.6)'; c.lineWidth = 3.6; path(); c.stroke();
    c.strokeStyle = '#e8d9b6'; c.lineWidth = 2.6; path(); c.stroke();
    // the rails
    c.strokeStyle = '#6b5a4a'; c.lineWidth = 0.7; c.setLineDash([0.5, 0.5]); c.beginPath(); c.moveTo(RAIL[0][0], RAIL[0][1]); RAIL.slice(1).forEach(p => c.lineTo(p[0], p[1])); c.stroke(); c.setLineDash([]);
    // the roofs (and the tent), with an ink edge
    const roof = (b, col) => { c.save(); c.translate(b.x, b.z); c.rotate(-(b.rot || 0)); c.fillStyle = col; c.strokeStyle = INKC; c.lineWidth = 1.3 * PX; c.beginPath(); c.rect(-b.w / 2 - 0.3, -b.d / 2 - 0.3, b.w + 0.6, b.d + 0.6); c.fill(); c.stroke(); c.restore(); };
    BUILDINGS.forEach(b => roof(b, b.kind === 'canteen' ? '#b8603c' : b.kind === 'shed' ? '#7d6a58' : '#9a6440'));
    roof(TENT, '#f2ece0');
    // the mine's mouth: a dark arch in the face
    c.fillStyle = '#2b2235'; c.beginPath(); c.ellipse(MOUTH.x, MOUTH.z + 0.6, 2.2, 1.2, 0, 0, TAU); c.fill();
    c.restore();
  }

  // ================================================================ (the rest: words, lines, the build, the game side)
  const PARTS = {};
  return {
    layout: { buildings: BUILDINGS, tent: TENT, camp: CAMP, road: ROAD_PTS, rail: RAIL, mouth: MOUTH, gate: GATE },
    landmarks: Object.assign({ camp: { x: CAMP.x, z: CAMP.z }, mouth: MOUTH, gate: GATE, pit: PIT }, SPOT),
    hush: HUSH, roamers: ROAMERS, lakeFree, LAKE_FLAG,
    roadDist, ground, playDist, keepClear, bareAt, pathAt, areaAt, songAt, drawMap, mountain, noOuterTree, bowlDist, bowlE,
    MINERS, CHEPE, CRYSTALS, LAMPS, KEEP, ROAD, ROAD_LEN, PARTS, CAMP, SPOT, BUILDINGS, TENT, PIT, RAIL, GATE, MOUTH, REGION, AREAS,
  };
})();

// ================================================================ the build: the camp, the quarry face, the mountains, the people
(() => {
  const C = CAVES, { G, toon, merge } = TK, INK = '#2b2235';
  const { CAMP, SPOT, BUILDINGS, TENT, PIT, RAIL, GATE, MOUTH, MINERS, CHEPE, CRYSTALS, LAMPS, KEEP, ROAD } = C;
  const Y0 = CAMP.y;
  const grayOf = hex => { const c = new THREE.Color(hex), l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; return '#' + c.lerp(new THREE.Color(l * 0.86, l * 0.86, l * 0.95), 0.88).getHexString(); };
  // keep world.js's scatter (trees, rocks, flowers) off the camp's things (plain data: this runs before world.js)
  BUILDINGS.forEach(b => KEEP.push({ x: b.x, z: b.z, r: Math.hypot(b.w, b.d) / 2 + 1.5 }));
  KEEP.push({ x: TENT.x, z: TENT.z, r: 4 }, { x: MOUTH.x, z: MOUTH.z, r: 9 });

  // ---------------------------------------------------------------- a kit: pieces in vertex colors, merged, with ink hulls
  let VC = null, HULL = null;
  const mats = () => { if (!VC) { VC = toon('#ffffff', { vc: 1, rim: 0.14 }); HULL = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }); } return { VC, HULL }; };
  const GEO = {
    box: G.box, sphere: new THREE.SphereGeometry(1, 12, 9), cyl: new THREE.CylinderGeometry(1, 1, 1, 10), cyl6: new THREE.CylinderGeometry(1, 1, 1, 7), cone: new THREE.ConeGeometry(1, 1, 8),
    ico: G.ico0, ico1: G.ico1, oct: new THREE.OctahedronGeometry(1, 0), half: new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2),
    tri: (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0]), 3)); g.computeVertexNormals(); return g; })(),
  };
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  function Kit() {
    const solid = [], hull = [];
    let frame = null;
    const k = {
      at(x, y, z, ry = 0) { frame = TK.M4(x, y, z, 1, 1, 1, ry); return k; },
      free() { frame = null; return k; },
      addM(geo, m, color, ink = 0.03) {
        if (frame) m.premultiply(frame);
        solid.push({ geo, m, color });
        if (ink > 0) { m.decompose(_v, _q, _s); hull.push({ geo, m: m.clone().multiply(new THREE.Matrix4().makeScale(1 + 1.6 * ink / Math.max(0.03, _s.x), 1 + 1.6 * ink / Math.max(0.03, _s.y), 1 + 1.6 * ink / Math.max(0.03, _s.z))), color: INK }); }
        return k;
      },
      add(geo, x, y, z, sx, sy, sz, color, o = {}) { return k.addM(geo, TK.M4(x, y, z, sx, sy, sz, o.ry || 0, o.rx || 0, o.rz || 0), color, o.ink === undefined ? 0.03 : o.ink); },
      box(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y, z, w, h, d, color, o); },
      // a cylinder (or anything along y) from a to b, radius r
      rod(geo, a, b, r, color, ink = 0.02) {
        const d = _v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length() || 1e-3;
        const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
        return k.addM(geo, new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(r, len, r)), color, ink);
      },
      build(parent, o = {}) {
        const M = mats(), out = [];
        if (solid.length) { const m = new THREE.Mesh(merge(solid), o.mat || M.VC); m.castShadow = o.shadow !== false; m.receiveShadow = true; parent.add(m); out.push(m); }
        if (hull.length && o.hull !== false) { const h = new THREE.Mesh(merge(hull), M.HULL); parent.add(h); out.push(h); }
        return out;
      },
      get count() { return solid.length; },
    };
    return k;
  }

  // ---------------------------------------------------------------- the camp's things
  const LOG = ['#9a6440', '#8a5636', '#a56e47'], ROOF = ['#6e5646', '#7a6150'], STONE = '#8f8a80', DARKW = '#5a3a24', IRON = '#5d6470', GLASS = '#3d4a5e';
  function cabin(k, b) {
    const w = b.w, d = b.d, n = b.kind === 'shed' ? 4 : 5, top = 0.45 + n * 0.42;
    k.at(b.x, Y0, b.z, b.rot);
    k.box(0, 0.12, 0, w + 0.5, 0.3, d + 0.5, STONE, { ink: 0.02 });                       // a stone footing
    for (let i = 0; i < n; i++) {
      const y = 0.45 + i * 0.42;
      for (const s of [-1, 1]) {
        k.add(GEO.cyl6, 0, y, s * d / 2, 0.21, w + 0.55, 0.21, LOG[i % 3], { rz: Math.PI / 2, ink: 0.02 });                 // front and back logs
        k.add(GEO.cyl6, s * w / 2, y + 0.21, 0, 0.21, d + 0.55, 0.21, LOG[(i + 1) % 3], { rx: Math.PI / 2, ink: 0.02 });   // side logs, in between
      }
    }
    // the gables: shorter and shorter logs up the sides
    for (let j = 0; j < 4; j++) for (const s of [-1, 1]) k.add(GEO.cyl6, s * w / 2, top + 0.2 + j * 0.4, 0, 0.2, (d + 0.3) * (1 - (j + 0.6) / 4.3), 0.2, LOG[(j + 2) % 3], { rx: Math.PI / 2, ink: 0.02 });
    // the roof: two plank slabs and a ridge beam
    const a = 0.62, half = d / 2 + 0.55, rise = Math.tan(a) * (d / 2);
    for (const s of [-1, 1]) k.box(0, top + rise / 2 + 0.05, s * d / 4, w + 1.0, 0.16, half / Math.cos(a) * 1.02, ROOF[(s + 1) / 2], { rx: s * a, ink: 0.025 });
    k.add(GEO.cyl6, 0, top + rise + 0.12, 0, 0.16, w + 1.1, 0.16, DARKW, { rz: Math.PI / 2, ink: 0.02 });
    // a door and windows on the front (+z), a window on each side
    k.box(w * 0.2, 1.3, d / 2 + 0.16, 1.0, 1.85, 0.12, DARKW, { ink: 0.02 }).box(w * 0.2 + 0.34, 1.25, d / 2 + 0.24, 0.1, 0.1, 0.06, '#e8c45a', { ink: 0 });
    k.box(-w * 0.22, 1.55, d / 2 + 0.16, 0.95, 0.75, 0.1, GLASS, { ink: 0.02 }).box(-w * 0.22, 1.55, d / 2 + 0.22, 0.06, 0.75, 0.04, DARKW, { ink: 0 }).box(-w * 0.22, 1.55, d / 2 + 0.22, 0.95, 0.06, 0.04, DARKW, { ink: 0 });
    if (b.kind !== 'shed') for (const s of [-1, 1]) k.box(s * (w / 2 + 0.16), 1.55, 0, 0.1, 0.7, 0.85, GLASS, { ink: 0.02 });
    if (b.kind === 'canteen') { k.box(w / 2 - 1.0, top + rise + 0.6, -d / 5, 0.75, 2.4, 0.75, STONE, { ink: 0.025 }); k.box(w / 2 - 1.0, top + rise + 1.85, -d / 5, 0.9, 0.18, 0.9, '#6f6a62', { ink: 0.02 }); }
    if (b.kind === 'office') {   // a porch with a little roof (the canary's cage hangs from it)
      k.box(0, 0.32, d / 2 + 1.0, w * 0.86, 0.16, 1.7, '#8a6440', { ink: 0.02 });
      for (const s of [-1, 1]) k.add(GEO.cyl6, s * w * 0.4, 1.4, d / 2 + 1.75, 0.09, 2.3, 0.09, DARKW, { ink: 0.02 });
      k.box(0, 2.6, d / 2 + 1.0, w * 0.92, 0.12, 2.0, ROOF[1], { rx: 0.16, ink: 0.025 });
    }
    if (b.kind === 'bunk') { k.box(0, 0.3, d / 2 + 0.75, 2.2, 0.16, 1.2, '#8a6440', { ink: 0.02 }); k.box(0, 0.12, d / 2 + 1.5, 1.8, 0.16, 0.5, '#8a6440', { ink: 0.02 }); }
    if (b.kind === 'canteen') {    // two long tables with benches out front, bowls on them
      for (const [x, z] of [[-1.7, d / 2 + 2.5], [1.9, d / 2 + 2.3]]) {
        k.box(x, 0.86, z, 2.3, 0.1, 0.9, '#a57d57', { ink: 0.02 });
        for (const lx of [-0.95, 0.95]) for (const lz of [-0.3, 0.3]) k.box(x + lx, 0.43, z + lz, 0.08, 0.84, 0.08, DARKW, { ink: 0 });
        for (const s of [-1, 1]) { k.box(x, 0.48, z + s * 0.75, 2.3, 0.08, 0.32, '#9a7450', { ink: 0.015 }); for (const lx of [-0.95, 0.95]) k.box(x + lx, 0.24, z + s * 0.75, 0.07, 0.46, 0.07, DARKW, { ink: 0 }); }
        for (const bx of [-0.6, 0.5]) k.add(GEO.half, x + bx, 0.92, z + 0.1, 0.13, -0.08, 0.13, '#d9d2c4', { ink: 0.012 });
      }
      k.add(GEO.cyl, -w / 2 + 0.2, 0.55, d / 2 + 0.8, 0.42, 1.0, 0.42, '#7a5a3e', { ink: 0.02 });       // a water barrel by the door
      k.add(GEO.cyl, -w / 2 + 0.2, 1.07, d / 2 + 0.8, 0.43, 0.05, 0.43, '#4f7fb0', { ink: 0 });
    }
    k.free();
  }
  function tent(k) {
    const T = TENT, hw = T.w / 2, h = 2.3, L = Math.hypot(hw, h), a = Math.atan2(h, hw), CAN = '#f2ece0', CAN2 = '#e2d9c6';
    k.at(T.x, Y0, T.z, T.rot);
    for (const s of [-1, 1]) k.box(s * hw / 2, h / 2, 0, L, 0.07, T.d, s > 0 ? CAN : CAN2, { rz: -s * a, ink: 0.025 });
    k.add(GEO.tri, 0, 0, -T.d / 2, hw, h, 1, CAN2, { ink: 0 });                                           // the back wall
    for (const s of [-1, 1]) k.add(GEO.tri, s * hw * 0.55, 0, T.d / 2 + 0.25, hw * 0.45, h * 0.55, 1, CAN, { ry: s * 0.9, ink: 0 });   // the flaps, tied back
    for (const z of [-T.d / 2, T.d / 2]) k.add(GEO.cyl6, 0, h / 2, z, 0.06, h + 0.2, 0.06, DARKW, { ink: 0.015 });
    k.add(GEO.cyl6, 0, h, 0, 0.05, T.d + 0.3, 0.05, DARKW, { rx: Math.PI / 2, ink: 0.015 });
    k.box(0, 1.15, -T.d / 2 - 0.04, 0.9, 0.26, 0.04, '#3f9a5a', { ink: 0 }).box(0, 1.15, -T.d / 2 - 0.04, 0.26, 0.9, 0.04, '#3f9a5a', { ink: 0 });   // a green cross (inside, through the flaps: the same on the front)
    k.box(0, 1.65, T.d / 2 + 0.03, 0.6, 0.18, 0.03, '#3f9a5a', { ink: 0 }).box(0, 1.65, T.d / 2 + 0.03, 0.18, 0.6, 0.03, '#3f9a5a', { ink: 0 });
    k.box(-0.6, 0.35, -0.2, 0.8, 0.12, 2.0, '#d8cfbf', { ink: 0.015 }).box(-0.6, 0.18, -0.2, 0.75, 0.3, 1.9, '#6f5a46', { ink: 0 });   // a cot
    k.box(0.75, 0.42, 0.6, 0.6, 0.06, 0.5, '#a57d57', { ink: 0.015 }).add(GEO.cyl6, 0.75, 0.6, 0.6, 0.07, 0.28, 0.07, '#8a4a3a', { ink: 0.01 });   // a little table, a bottle
    k.free();
  }
  function rails(k) {
    for (let i = 0; i < RAIL.length - 1; i++) {
      const [ax, az] = RAIL[i], [bx, bz] = RAIL[i + 1], len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
      for (let s = 0.35; s < len; s += 0.75) k.box(ax + ux * s, Y0 + 0.05, az + uz * s, 1.5, 0.1, 0.28, '#6b4a30', { ry, ink: 0 });
      for (const o of [-0.5, 0.5]) k.box((ax + bx) / 2 - uz * o, Y0 + 0.16, (az + bz) / 2 + ux * o, 0.08, 0.1, len + 0.05, '#7d8590', { ry, ink: 0.012 });
    }
    const [x, z] = RAIL[RAIL.length - 1], [px, pz] = RAIL[RAIL.length - 2], ry = Math.atan2(x - px, z - pz);
    k.at(x, Y0, z, ry);
    for (const o of [-0.55, 0.55]) k.box(o, 0.45, 0.1, 0.2, 0.9, 0.2, DARKW, { ink: 0.015 });
    k.box(0, 0.75, 0.15, 1.6, 0.3, 0.25, '#c9453a', { ink: 0.02 }).box(0, 0.75, 0.29, 0.5, 0.3, 0.02, '#f4efe2', { ink: 0 });
    k.free();
  }
  function cart(k, x, z, ry, o = {}) {
    k.at(x, Y0, z, ry);
    const rz = o.tipped ? 1.45 : 0, lift = o.tipped ? 0.62 : 0;
    k.box(0, 0.75 + lift * 0.1, 0, 1.0, 0.72, 1.35, IRON, { rz, ink: 0.025 }).box(0, 1.13, 0, 1.08, 0.08, 1.43, '#454b55', { rz, ink: 0.015 });
    if (!o.tipped) {
      for (const sx of [-0.52, 0.52]) for (const sz of [-0.4, 0.4]) k.add(GEO.cyl, sx, 0.32, sz, 0.2, 0.12, 0.2, '#3a3d44', { rz: Math.PI / 2, ink: 0.012 });
      for (let i = 0; i < 6; i++) k.add(GEO.ico, (i % 3 - 1) * 0.28, 1.15 + (i > 2 ? 0.12 : 0), (i > 2 ? 0.25 : -0.25), 0.22, 0.18, 0.2, i % 2 ? '#9a958c' : '#8a8478', { ry: i, ink: 0.012 });
    } else for (let i = 0; i < 7; i++) k.add(GEO.ico, 0.9 + (i % 3) * 0.35, 0.14, -0.5 + i * 0.18, 0.2, 0.15, 0.18, i % 2 ? '#9a958c' : '#8a8478', { ry: i, ink: 0.012 });
    k.free();
  }
  function crates(k, x, z) {
    k.at(x, Y0, z, 0.2);
    k.box(0, 0.45, 0, 0.9, 0.9, 0.9, '#b07a48', { ink: 0.02 }).box(0.95, 0.45, 0.2, 0.9, 0.9, 0.9, '#a8703f', { ry: 0.3, ink: 0.02 }).box(0.45, 1.33, 0.1, 0.85, 0.85, 0.85, '#b88450', { ry: -0.2, ink: 0.02 });
    k.box(-0.95, 0.38, 0.4, 0.7, 0.75, 0.7, '#8a8f6a', { ry: 0.6, ink: 0.02 });          // a crate of folded blankets
    for (let i = 0; i < 3; i++) k.box(-0.95, 0.8 + i * 0.12, 0.4, 0.62, 0.11, 0.62, ['#c45a3c', '#3e7fb0', '#e0a43c'][i], { ry: 0.6 + i * 0.2, ink: 0.01 });
    k.add(GEO.cyl, 1.9, 0.5, -0.6, 0.38, 1.0, 0.38, '#7a5a3e', { ink: 0.02 }).add(GEO.cyl, 1.9, 0.75, -0.6, 0.4, 0.06, 0.4, '#3d3a3a', { ink: 0 });
    k.free();
  }
  function lampPost(k, x, z) {
    k.add(GEO.cyl6, x, Y0 + 1.25, z, 0.08, 2.5, 0.08, DARKW, { ink: 0.015 }).box(x + 0.25, Y0 + 2.42, z, 0.55, 0.07, 0.07, DARKW, { ink: 0.01 });
    k.box(x + 0.5, Y0 + 2.12, z, 0.3, 0.38, 0.3, '#3d3a3a', { ink: 0.015 }).box(x + 0.5, Y0 + 2.12, z, 0.23, 0.28, 0.32, '#c9bc8a', { ink: 0 });
  }
  function firePit(k) {
    for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU; k.add(GEO.ico, PIT.x + Math.cos(a) * PIT.r, Y0 + 0.12, PIT.z + Math.sin(a) * PIT.r, 0.3, 0.22, 0.27, i % 2 ? '#8a8478' : '#9a958c', { ry: a, ink: 0.015 }); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; k.rod(GEO.cyl6, [PIT.x + Math.cos(a) * 0.7, Y0 + 0.05, PIT.z + Math.sin(a) * 0.7], [PIT.x + Math.cos(a) * 0.1, Y0 + 0.75, PIT.z + Math.sin(a) * 0.1], 0.09, i % 2 ? '#5a3a24' : '#4a2f20'); }
    k.add(GEO.sphere, PIT.x, Y0 + 0.06, PIT.z, 0.6, 0.06, 0.6, '#3a3330', { ink: 0 });
  }
  // the quarry face behind the camp: blocks of rock in bands, cut back in steps, with the mine's mouth in the middle
  const STRATA = ['#9a8f80', '#8a7f70', '#a89c8a', '#7d7366'];
  function quarryFace(k) {
    const R = rng(4441);
    for (let x = 64; x < 112;) {
      const w = 2.4 + R() * 1.8, cx = x + w / 2; x += w;
      if (Math.abs(cx - MOUTH.x) < 2.6) continue;                          // (the mouth)
      const near = Math.abs(cx - MOUTH.x) < 5, hTot = 7 + R() * 2.8 + (Math.abs(cx - 88) > 16 ? -1.5 : 0);
      let y = Y0 - 0.3, band = (R() * 4) | 0;
      while (y < Y0 + hTot) {
        const bh = Math.min(1.2 + R() * 1.4, Y0 + hTot - y), back = (y - Y0) * 0.18;
        k.box(cx + (R() - 0.5) * 0.3, y + bh / 2, -281.7 - back - (near ? 0 : R() * 0.5), w + 0.15, bh, 2.4, STRATA[band++ % 4], { ry: (R() - 0.5) * 0.08, ink: 0.03 });
        y += bh;
      }
    }
    k.box(MOUTH.x, Y0 + 5.9, -282.0, 5.6, 3.8, 2.4, STRATA[1], { ink: 0.03 }).box(MOUTH.x, Y0 + 8.4, -282.6, 5.2, 1.4, 2.4, STRATA[2], { ink: 0.03 });   // over the mouth
    // rubble at its foot
    for (let i = 0; i < 26; i++) { const x = 66 + R() * 44; if (Math.abs(x - MOUTH.x) < 3.4) continue; const s = 0.3 + R() * 0.6; k.add(GEO.ico, x, Y0 + s * 0.35, -279.9 + R() * 1.2, s * 1.2, s * 0.8, s, STRATA[i % 4], { ry: R() * 6, rx: R(), ink: 0.02 }); }
    // the mouth's timber frame, a dark tunnel behind it, the rails running in
    for (const s of [-1, 1]) k.add(GEO.cyl6, MOUTH.x + s * 2.05, Y0 + 1.95, MOUTH.z - 0.2, 0.2, 3.9, 0.2, '#6b4a30', { ink: 0.025 });
    k.box(MOUTH.x, Y0 + 3.95, MOUTH.z - 0.2, 4.9, 0.42, 0.5, '#6b4a30', { ink: 0.025 }).box(MOUTH.x, Y0 + 4.35, MOUTH.z - 0.05, 3.2, 0.5, 0.12, '#d9c79e', { ink: 0.02 });
    for (const s of [-1, 1]) k.box(MOUTH.x + s * 1.75, Y0 + 3.0, MOUTH.z - 0.1, 0.12, 1.4, 0.12, '#6b4a30', { rz: s * 0.7, ink: 0.015 });
  }
  // the mountains past the map's edge (the land rises into them; world3d.js leaves its woods out there)
  function mountains(group) {
    const pcs = [], R = rng(902);
    const peaks = [[60, -318, 30, 44], [86, -326, 36, 62], [112, -318, 30, 50], [136, -326, 28, 40], [72, -352, 36, 66], [104, -356, 40, 74], [132, -350, 30, 54], [42, -332, 20, 30], [150, -306, 18, 26]];
    for (const [x, z, r, h] of peaks) {
      pcs.push({ geo: new THREE.ConeGeometry(r, h, 7), m: TK.M4(x, h / 2 + 3, z, 1, 1, 1, R() * 6), color: R() < 0.5 ? '#8f877a' : '#9a9184' });
      pcs.push({ geo: new THREE.ConeGeometry(r * 0.7, h * 0.4, 7), m: TK.M4(x + 1, h * 0.8 + 3, z, 1, 1, 1, R() * 6), color: '#7d7569' });
      if (h > 55) pcs.push({ geo: new THREE.ConeGeometry(r * 0.24, h * 0.22, 7), m: TK.M4(x, h * 0.9 + 3.2, z, 1.02, 1, 1.02, R() * 6), color: '#eef2f4' });
      pcs.push({ geo: new THREE.ConeGeometry(r * 1.05, h * 0.18, 7), m: TK.M4(x, h * 0.09 + 3, z, 1, 1, 1, R() * 6), color: '#6f8a5a' });     // green foothills
    }
    const m = new THREE.Mesh(merge(pcs, true), toon('#ffffff', { vc: 1, rim: 0 })); m.castShadow = false; m.receiveShadow = false;
    group.add(m);
    return m;
  }

  // ---------------------------------------------------------------- people: a miner (merged body and head, posed by how they feel)
  // pose: arms as [forward, out] for each side; lean (forward), sit, headDown
  const POSES = {
    idle: { arms: [[0.1, 0.18], [0.1, 0.18]] }, tired: { arms: [[0.15, 0.06], [0.15, 0.06]], lean: 0.32, headDown: 0.35 },
    cold: { arms: [[1.25, -0.95], [1.15, -0.95]] }, hungry: { arms: [[0.1, 0.2], [0.95, -0.6]] }, scared: { arms: [[2.25, 0.32], [2.25, 0.32]], lean: -0.12 },
    headache: { arms: [[0.15, 0.2], [2.85, 0.35]], headDown: 0.15 }, sad: { arms: [[0.8, 0.12], [0.8, 0.12]], headDown: 0.45 }, lost: { arms: [[0.15, 0.2], [2.45, 0.15]] },
    happy: { arms: [[0.15, 0.25], [2.9, -0.55]] }, boss: { arms: [[0.1, 0.55], [0.7, -0.15]] },
  };
  function personKits(def, pose, gray) {
    const L = def.look, col = h => (gray ? grayOf(h) : h), body = Kit(), head = Kit(), W = L.wide || 1, P = POSES[pose] || POSES.idle;
    const seat = def.seat && pose !== 'happy';
    for (const s of [-1, 1]) {
      if (seat) { body.rod(GEO.cyl, [s * 0.13, 0.5, 0], [s * 0.13, 0.5, 0.42], 0.09, col(L.pants)).rod(GEO.cyl, [s * 0.13, 0.5, 0.42], [s * 0.13, 0.08, 0.46], 0.085, col(L.pants)); body.add(GEO.sphere, s * 0.13, 0.06, 0.53, 0.12, 0.08, 0.16, col('#4a3426'), { ink: 0.02 }); }
      else { body.add(GEO.cyl, s * 0.13, 0.27, 0, 0.09, 0.5, 0.09, col(L.pants), { ink: 0.02 }); body.add(GEO.sphere, s * 0.13, 0.06, 0.05, 0.12, 0.08, 0.16, col('#4a3426'), { ink: 0.02 }); }
    }
    const y0 = seat ? -0.02 : 0;
    body.add(GEO.cyl, 0, 0.84 + y0, 0, 0.3 * W, 0.68, 0.25 * W, col(L.shirt), { ink: 0.025 });
    body.add(GEO.cyl, 0, 0.55 + y0, 0, 0.31 * W, 0.09, 0.26 * W, col('#5a3a24'), { ink: 0 }).add(GEO.box, 0, 0.55 + y0, 0.25 * W, 0.12, 0.1, 0.03, col('#d9b04a'), { ink: 0 });
    for (const s of [-1, 1]) body.add(GEO.box, s * 0.13, 0.88 + y0, 0.235 * W, 0.06, 0.5, 0.03, col('#3e5a7a'), { ink: 0 });          // braces
    // arms: from the shoulder, swung forward and out
    [-1, 1].forEach((s, i) => {
      const [fwd, out] = P.arms[i], rz = s * out, rx = -fwd;
      _e.set(rx, 0, rz); const dir = new THREE.Vector3(0, -1, 0).applyEuler(_e);
      const sh = [s * 0.32 * W, 1.1 + y0, 0], hand = [sh[0] + dir.x * 0.44, sh[1] + dir.y * 0.44, sh[2] + dir.z * 0.44];
      body.rod(GEO.cyl, sh, hand, 0.075, col(L.shirt));
      body.add(GEO.sphere, hand[0], hand[1], hand[2], 0.075, 0.075, 0.075, col(L.skin), { ink: 0.015 });
      if (pose === 'boss' && i === 1) body.add(GEO.box, hand[0], hand[1] + 0.05, hand[2] + 0.06, 0.22, 0.3, 0.03, col('#b88a50'), { rx: -0.6, ink: 0.012 });   // Cande's clipboard
    });
    // the head (its own group: it turns and droops): skin, hair, a hard hat with a lamp, eyes, a mouth
    head.add(GEO.sphere, 0, 0.22, 0, 0.25, 0.25, 0.24, col(L.skin), { ink: 0.025 });
    head.add(GEO.half, 0, 0.22, -0.02, 0.26, 0.25, 0.25, col(L.hair), { rx: -0.35, ink: 0.015 });
    if (L.bun) head.add(GEO.sphere, 0, 0.3, -0.26, 0.11, 0.11, 0.11, col(L.hair), { ink: 0.015 });
    if (L.braid) for (let i = 0; i < 3; i++) head.add(GEO.sphere, 0, 0.08 - i * 0.13, -0.24 - i * 0.03, 0.07, 0.08, 0.07, col(L.hair), { ink: 0.012 });
    if (L.beard) head.add(GEO.sphere, 0, 0.06, 0.12, 0.17, 0.13, 0.12, col(L.hair), { ink: 0.015 });
    head.add(GEO.half, 0, 0.36, 0, 0.27, 0.2, 0.27, col(L.hat), { ink: 0.02 }).add(GEO.cyl, 0, 0.37, 0.03, 0.31, 0.03, 0.33, col(L.hat), { ink: 0.015 });
    head.add(GEO.cyl, 0, 0.47, 0.25, 0.06, 0.07, 0.06, col('#c9bc8a'), { rx: Math.PI / 2, ink: 0.01 });           // the helmet's lamp
    for (const s of [-1, 1]) head.add(GEO.sphere, s * 0.09, 0.24, 0.215, 0.032, 0.048, 0.02, INK, { ink: 0 });
    head.add(GEO.box, 0, 0.11, 0.225, 0.08, 0.016, 0.01, INK, { ink: 0 }).add(GEO.sphere, 0, 0.17, 0.245, 0.035, 0.03, 0.03, col(L.skin), { ink: 0 });
    return { body, head, P, seat };
  }
  // a person in the camp: { id, name, x, z, y, top, hushed, talking, def, root, … }; set(pose, gray) rebuilds the look
  function makePerson(def, scene, o = {}) {
    const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group();
    root.add(body); body.add(head); scene.add(root);
    const p = { id: def.id, name: def.name, def, x: def.x, z: def.z, y: Y0, top: 2.15, yaw: def.yaw || 0, baseYaw: def.yaw || 0, hushed: !!o.hushed, talking: false, root, body, head, pose: o.pose || 'idle', meshes: [], t: Math.random() * 9 };
    p.set = (pose, gray) => {
      p.pose = pose; p.gray = !!gray;
      for (const m of p.meshes) { m.parent.remove(m); m.geometry.dispose(); }
      const K = personKits(def, pose, gray);
      p.meshes = K.body.build(body).concat(K.head.build(head));
      head.position.set(0, (K.seat ? 1.16 : 1.18), 0);
      p.P = K.P; p.seat = K.seat;
    };
    p.set(p.pose, o.gray);
    root.scale.setScalar(def.old ? 0.95 : 1);
    return p;
  }
  function animatePerson(p, dt, t, you) {
    p.t += dt;
    const P = p.P || POSES.idle, near = you && Math.hypot(you.x - p.x, you.z - p.z) < 6.5;
    let want = p.look ? Math.atan2(p.look.x - p.x, p.look.z - p.z) : near && p.pose !== 'scared' ? Math.atan2(you.x - p.x, you.z - p.z) : p.baseYaw;
    p.yaw = dampAngle(p.yaw, want, 4, dt);
    const shiver = p.pose === 'cold' ? Math.sin(p.t * 38) * 0.018 : p.pose === 'scared' ? Math.sin(p.t * 29) * 0.012 : 0;
    const bob = p.talking ? Math.abs(Math.sin(p.t * 13)) * 0.035 : p.pose === 'happy' ? Math.abs(Math.sin(p.t * 6)) * 0.08 : 0;
    p.root.position.set(p.x + shiver, p.y + (p.seat ? 0.02 : 0) + bob, p.z);
    p.root.rotation.y = p.yaw;
    p.body.rotation.x = (P.lean || 0) + Math.sin(p.t * 1.3) * 0.015;
    p.body.rotation.z = Math.sin(p.t * 1.1 + p.x) * 0.02;
    p.head.rotation.x = (P.headDown || 0) * (p.talking ? 0.4 : 1) + (p.pose === 'tired' ? Math.sin(p.t * 0.7) * 0.06 : 0);
    p.head.rotation.y = p.pose === 'lost' ? Math.sin(p.t * 0.9) * 0.6 : p.pose === 'scared' ? Math.sin(p.t * 1.7) * 0.15 : 0;
  }

  // ---------------------------------------------------------------- the canary (Pío) in his cage, hanging from the office's porch
  function canary(group) {
    const cage = new THREE.Group(); cage.position.set(SPOT.cage.x, Y0 + 2.48, SPOT.cage.z); group.add(cage);
    const k = Kit();
    k.add(GEO.cyl, 0, -0.62, 0, 0.26, 0.05, 0.26, '#c9a24a', { ink: 0.012 }).add(GEO.half, 0, -0.08, 0, 0.26, 0.2, 0.26, '#c9a24a', { ink: 0.012 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; k.add(GEO.cyl6, Math.cos(a) * 0.25, -0.34, Math.sin(a) * 0.25, 0.012, 0.56, 0.012, '#d9b45a', { ink: 0 }); }
    k.add(GEO.cyl6, 0, 0.18, 0, 0.012, 0.32, 0.012, '#5a3a24', { ink: 0 }).add(GEO.cyl6, 0, -0.38, 0, 0.015, 0.44, 0.015, '#8a6440', { rz: Math.PI / 2, ink: 0 });   // the hook string, the perch
    k.build(cage, { shadow: false });
    const bird = new THREE.Group(); bird.position.set(0, -0.33, 0); cage.add(bird);
    const b = Kit();
    b.add(GEO.sphere, 0, 0.07, 0, 0.075, 0.07, 0.09, '#f6d32a', { ink: 0.01 }).add(GEO.sphere, 0, 0.15, 0.06, 0.055, 0.055, 0.055, '#f6d32a', { ink: 0.01 });
    b.add(GEO.cone, 0, 0.15, 0.12, 0.018, 0.045, 0.018, '#e8843a', { rx: Math.PI / 2, ink: 0 }).add(GEO.box, 0, 0.06, -0.1, 0.06, 0.012, 0.07, '#d9b520', { rx: 0.4, ink: 0.006 });
    for (const s of [-1, 1]) { b.add(GEO.sphere, s * 0.06, 0.08, -0.01, 0.02, 0.045, 0.06, '#e2bd22', { ink: 0.006 }); b.add(GEO.sphere, s * 0.028, 0.165, 0.105, 0.009, 0.012, 0.008, INK, { ink: 0 }); }
    b.build(bird, { shadow: false });
    return { cage, bird, sing: 0, hop: 0, next: 2 };
  }
  // little music notes floating up (the canary's song, Mimo's)
  const noteTex = TK.canvasTex(64, 64, c => { c.font = '900 50px Segoe UI Symbol, Trebuchet MS, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 7; c.strokeStyle = INK; c.strokeText('♪', 30, 34); c.fillStyle = '#fff3a0'; c.fillText('♪', 30, 34); });
  const NOTES = [];
  function note(scene, x, y, z, col) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex, color: col || '#ffffff', transparent: true, depthWrite: false }));
    s.position.set(x, y, z); s.scale.setScalar(0.32); scene.add(s);
    NOTES.push({ s, scene, t: 0, vx: (Math.random() - 0.5) * 0.6, vz: (Math.random() - 0.5) * 0.6, ph: Math.random() * 6 });
  }
  function notesStep(dt) {
    for (let i = NOTES.length - 1; i >= 0; i--) {
      const n = NOTES[i]; n.t += dt;
      n.s.position.x += n.vx * dt + Math.sin(n.t * 6 + n.ph) * 0.01; n.s.position.y += 0.9 * dt; n.s.position.z += n.vz * dt;
      n.s.material.opacity = 1 - smoothstep(0.9, 1.6, n.t); n.s.material.rotation = Math.sin(n.t * 4 + n.ph) * 0.3;
      if (n.t > 1.6) { n.scene.remove(n.s); n.s.material.dispose(); NOTES.splice(i, 1); }
    }
  }

  // ---------------------------------------------------------------- the crystals at the mine's mouth, the Hush's seal, the lamps, the fire
  const glowTex = TK.glowTex;
  const flameTex = TK.canvasTex(64, 96, cx => { const g = cx.createRadialGradient(32, 64, 2, 32, 56, 34); g.addColorStop(0, 'rgba(255,248,210,1)'); g.addColorStop(0.45, 'rgba(255,190,80,0.95)'); g.addColorStop(1, 'rgba(255,90,20,0)'); cx.fillStyle = g; cx.beginPath(); cx.moveTo(32, 2); cx.quadraticCurveTo(64, 60, 32, 94); cx.quadraticCurveTo(0, 60, 32, 2); cx.fill(); });
  const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); return sp; };
  function crystalCluster(k, x, y, z, h, lean, R) {
    const cols = ['#9b8fd8', '#7fe0d8', '#c9a2ff', '#8fd0ff'];
    k.add(GEO.oct, x, y + h * 0.45, z, 0.2, h * 0.55, 0.2, cols[(R() * 4) | 0], { rz: lean, rx: (R() - 0.5) * 0.3, ink: 0.015 });
    for (let i = 0; i < 3; i++) { const a = R() * TAU, hh = h * (0.35 + R() * 0.35); k.add(GEO.oct, x + Math.cos(a) * 0.28, y + hh * 0.4, z + Math.sin(a) * 0.22, 0.12, hh * 0.5, 0.12, cols[(R() * 4) | 0], { rz: lean + Math.cos(a) * 0.5, rx: Math.sin(a) * 0.5, ink: 0.012 }); }
  }

  // ================================================================ build
  function build(scene, env = {}) {
    const terrainAt = env.terrainAt || ((x, z) => (typeof WORLD !== 'undefined' ? WORLD.terrainAt(x, z) : 0));
    const group = new THREE.Group(); group.name = 'caves'; scene.add(group);
    const colliders = [], moving = [];
    // the static camp: one merged mesh and its ink
    const k = Kit();
    BUILDINGS.forEach(b => cabin(k, b));
    tent(k); rails(k); firePit(k); quarryFace(k);
    cart(k, 87.75, -270.2, 0.02); cart(k, 94.6, -258.4, 0.9, { tipped: true });
    crates(k, SPOT.crates.x, SPOT.crates.z);
    LAMPS.forEach(([x, z]) => lampPost(k, x, z));
    // a tool rack by the shed (pickaxes and shovels), a wheelbarrow, rock piles, a pair of sawhorses
    k.at(102.4, Y0, -276.4, -0.3);
    k.box(0, 0.7, 0, 1.8, 0.1, 0.1, DARKW, { ink: 0.012 }); for (const s of [-1, 1]) k.box(s * 0.8, 0.35, 0, 0.1, 0.7, 0.4, DARKW, { ink: 0.012 });
    for (let i = 0; i < 4; i++) { const x = -0.6 + i * 0.4; k.box(x, 0.75, 0.08, 0.05, 1.2, 0.05, '#a57d57', { rz: 0.1, ink: 0.008 }); k.box(x + 0.06, 1.32, 0.08, i % 2 ? 0.3 : 0.5, 0.08, 0.06, '#7d8590', { rz: i % 2 ? 0 : 0.2, ink: 0.008 }); }
    k.free().at(77.0, Y0, -275.6, 0.6);
    k.box(0, 0.45, 0, 0.8, 0.3, 1.1, IRON, { rx: -0.15, ink: 0.02 }).add(GEO.cyl, 0, 0.22, 0.65, 0.2, 0.08, 0.2, '#3a3d44', { rz: Math.PI / 2, ink: 0.012 });
    for (const s of [-1, 1]) k.box(s * 0.32, 0.45, -0.75, 0.06, 0.06, 0.8, DARKW, { rx: 0.25, ink: 0.008 });
    k.free();
    const R = rng(77);
    for (const [px, pz, n] of [[73.5, -278.0, 7], [105.5, -263.0, 5], [69.2, -256.5, 4]]) for (let i = 0; i < n; i++) { const s = 0.25 + R() * 0.45; k.add(GEO.ico, px + (R() - 0.5) * 2, Y0 + s * 0.3, pz + (R() - 0.5) * 1.6, s * 1.2, s * 0.8, s, STRATA[i % 4], { ry: R() * 6, ink: 0.015 }); }
    const statics = k.build(group);
    // the mountains beyond the map's edge
    const peaks = mountains(group);
    // the darkness of the tunnel, behind the frame
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 3.75), new THREE.MeshBasicMaterial({ color: '#0b0910' }));
    dark.position.set(MOUTH.x, Y0 + 1.87, MOUTH.z - 0.45); group.add(dark);
    // the Hush's seal in the mouth: gray stone, until Mimo sings the crystals awake
    const seal = new THREE.Group(); seal.position.set(MOUTH.x, Y0, MOUTH.z - 0.15); group.add(seal);
    const sk = Kit(), RS = rng(13);
    const chunks = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) chunks.push([-1.4 + i * 0.93, 0.47 + j * 0.93]);
    const sealParts = chunks.map(([x, y]) => { const g = new THREE.Group(); g.position.set(x, y, 0); seal.add(g); const kk = Kit(); kk.box(0, 0, 0, 0.95, 0.95, 0.4 + RS() * 0.15, ['#8d8a9a', '#9895a6', '#83808f'][(RS() * 3) | 0], { rz: (RS() - 0.5) * 0.1, ink: 0.015 }); kk.build(g); g.userData.v = new THREE.Vector3((RS() - 0.5) * 2, 1 + RS() * 2, 1.5 + RS() * 2); return g; });
    void sk;
    // the crystals (one mesh; dark gray until lit), a glow on each cluster
    const ck = Kit(), RC = rng(31);
    CRYSTALS.forEach(([x, z, h, lean]) => crystalCluster(ck, x, terrainAt(x, z), z, h, lean, RC));
    const crystalMat = new THREE.MeshToonMaterial({ color: '#4a4658', vertexColors: true, gradientMap: TK.grad, emissive: new THREE.Color('#000000') });
    const crystalMesh = ck.build(group, { mat: crystalMat });
    const crystalGlows = CRYSTALS.map(([x, z, h]) => { const g = glow('#a99cff', 2.4 + h); g.position.set(x, terrainAt(x, z) + h * 0.55, z); group.add(g); return g; });
    // the lamps' glows (dark while the camp is hushed), the fire (cold until the end)
    const lampGlows = LAMPS.map(([x, z]) => { const g = glow('#ffd27a', 1.6); g.position.set(x + 0.5, Y0 + 2.12, z); group.add(g); return g; });
    const fire = new THREE.Group(); fire.position.set(PIT.x, Y0 + 0.2, PIT.z); fire.visible = false; group.add(fire);
    const flames = [[1, '#ffb05a'], [0.62, '#fff1c2']].map(([s, c]) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.position.y = 0.55 * s; sp.scale.set(0.9 * s, 1.4 * s, 1); fire.add(sp); return { sp, s }; });
    fire.add((() => { const g = glow('#ffb35a', 4.5, 0.55); g.position.y = 0.4; return g; })());
    // the mist across the road at the gate (until the lake's bell), a fallen tree and rocks in it
    const gate = new THREE.Group(); group.add(gate);
    const gk = Kit(), RG = rng(5);
    const gd = (() => { let i = 0, best = 1e9; ROAD.forEach(([x, z], j) => { const d = Math.hypot(x - GATE.x, z - GATE.z); if (d < best) { best = d; i = j; } }); const a = ROAD[Math.max(0, i - 1)], b = ROAD[Math.min(ROAD.length - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return { ux: (b[0] - a[0]) / l, uz: (b[1] - a[1]) / l }; })();
    const nx = -gd.uz, nz = gd.ux;
    for (let i = -5; i <= 5; i++) { const x = GATE.x + nx * i * 1.1 + (RG() - 0.5) * 0.6, z = GATE.z + nz * i * 1.1 + (RG() - 0.5) * 0.6, s = 0.5 + RG() * 0.6; gk.add(GEO.ico, x, terrainAt(x, z) + s * 0.4, z, s * 1.2, s * 0.9, s, STRATA[(i + 5) % 4], { ry: RG() * 6, ink: 0.02 }); }
    gk.rod(GEO.cyl6, [GATE.x - nx * 5.5, terrainAt(GATE.x - nx * 5.5, GATE.z - nz * 5.5) + 0.7, GATE.z - nz * 5.5], [GATE.x + nx * 5.0, terrainAt(GATE.x + nx * 5, GATE.z + nz * 5) + 0.5, GATE.z + nz * 5.0], 0.32, '#6b4a30', 0.025);
    gk.build(gate);
    const mist = [];
    for (let i = 0; i < 14; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: i % 2 ? '#bdbac9' : '#a9a6b8', transparent: true, opacity: 0.7, depthWrite: false }));
      const t = (i / 13 - 0.5) * 16; sp.position.set(GATE.x + nx * t + gd.ux * (RG() - 0.5) * 3, terrainAt(GATE.x, GATE.z) + 1 + RG() * 2.4, GATE.z + nz * t + gd.uz * (RG() - 0.5) * 3);
      sp.scale.setScalar(4.5 + RG() * 3); gate.add(sp); mist.push({ sp, ph: RG() * 6, y0: sp.position.y });
    }
    const gateSolids = [];
    for (let i = -7; i <= 7; i++) gateSolids.push({ x: GATE.x + nx * i * 1.15, z: GATE.z + nz * i * 1.15, r: 0.8, id: 'caves-gate' });
    moving.push(...gateSolids);
    // solids: the cabins, the tent, the quarry face, carts, crates, the pit, lamps, and the canyon's walls
    BUILDINGS.forEach(b => colliders.push({ obox: 1, x: b.x, z: b.z, hw: b.w / 2 + 0.3, hd: b.d / 2 + 0.3, rot: b.rot }));
    { const b = BUILDINGS.find(q => q.kind === 'canteen'), c = Math.cos(b.rot), s = Math.sin(b.rot); [[-1.7, b.d / 2 + 2.5], [1.9, b.d / 2 + 2.3]].forEach(([lx, lz]) => colliders.push({ obox: 1, x: b.x + lx * c + lz * s, z: b.z - lx * s + lz * c, hw: 1.3, hd: 1.0, rot: b.rot })); }
    colliders.push({ obox: 1, x: TENT.x, z: TENT.z, hw: TENT.w / 2, hd: TENT.d / 2, rot: TENT.rot });
    colliders.push({ obox: 1, x: 88, z: -282.6, hw: 24, hd: 1.6, rot: 0 });
    colliders.push({ x: 87.75, z: -270.2, r: 0.85 }, { x: 94.6, z: -258.4, r: 0.9 }, { x: SPOT.crates.x + 0.4, z: SPOT.crates.z, r: 1.3 }, { x: SPOT.crates.x + 1.9, z: SPOT.crates.z - 0.6, r: 0.5 }, { x: PIT.x, z: PIT.z, r: PIT.r + 0.25 });
    colliders.push({ x: 102.4, z: -276.4, r: 0.9 }, { x: 77.0, z: -275.6, r: 0.7 });
    LAMPS.forEach(([x, z]) => colliders.push({ x, z, r: 0.2 }));
    colliders.push(...corridorWalls());
    // people: Cande and the miners (hushed until you help them), Chepe (in the mine until you find him)
    const people = [];
    const cande = makePerson({ id: 'cande', name: 'Cande', x: SPOT.cande.x, z: SPOT.cande.z, yaw: SPOT.cande.yaw, look: { shirt: '#c9453a', pants: '#3f4a5a', skin: '#c98e62', hair: '#2e2420', hat: '#f4efe2', bun: true, wide: 1.05 } }, group, { pose: 'boss' });
    cande.story = true; people.push(cande);
    for (const d of MINERS) { const p = makePerson(d, group, { pose: d.state, gray: true, hushed: true }); p.miner = true; people.push(p); }
    const chepe = makePerson(CHEPE, group, { pose: 'happy' }); chepe.miner = true; chepe.hidden = true; chepe.root.visible = false; people.push(chepe);
    people.forEach(p => { p.y = terrainAt(p.x, p.z); });
    // the canary
    const bird = canary(group);
    // the camp's things are drawn only near it (the mountains carry far: they're on the skyline from Alba)
    const near = new THREE.Group(); near.name = 'caves-near';
    group.children.slice().forEach(o => { if (o !== peaks && o !== gate) near.add(o); });
    group.add(near);
    // ---------------------------------------------------------------- live state
    const S = { lit: 0, litT: 0, campLit: 0, campT: 0, gateOpen: false, gateK: 1, sealOpen: false };
    function setCrystals(on, instant) { S.litT = on ? 1 : 0; if (instant) S.lit = S.litT; }
    function setCamp(on, instant) { S.campT = on ? 1 : 0; if (instant) S.campLit = S.campT; fire.visible = S.campT > 0 || S.campLit > 0.01; }
    function setGate(open, instant) {
      S.gateOpen = !!open;
      gateSolids.forEach(s => { s.x = open ? 1e5 : s.x0; s.z = open ? 1e5 : s.z0; });
      if (instant) { S.gateK = open ? 0 : 1; gate.visible = !open; }
    }
    gateSolids.forEach(s => { s.x0 = s.x; s.z0 = s.z; });
    // the seal: it cracks, shakes, and its stones fall away (async; t: the game clock's wait/tween from the story)
    async function openSeal(tween, wait) {
      if (S.sealOpen) return;
      for (let i = 0; i < 3; i++) { await tween(0.18, u => { seal.position.x = MOUTH.x + Math.sin(u * Math.PI * 4) * 0.06 * (i + 1); }); await wait(0.25); }
      S.sealOpen = true;
      await tween(1.1, u => sealParts.forEach((g, i) => { const v = g.userData.v, k = Math.max(0, u * 1.4 - (i % 4) * 0.08); g.position.set(-1.4 + (i / 4 | 0) * 0.93 + v.x * k * 0.6, Math.max(0.2, 0.47 + (i % 4) * 0.93 + v.y * k - 4.5 * k * k), v.z * k * 0.8); g.rotation.set(k * v.x, k * v.y, k * 2); g.scale.setScalar(Math.max(0.01, 1 - k * 0.6)); }));
      seal.visible = false;
    }
    function setSeal(open) { S.sealOpen = !!open; seal.visible = !open; if (!open) sealParts.forEach((g, i) => { g.position.set(-1.4 + (i / 4 | 0) * 0.93, 0.47 + (i % 4) * 0.93, 0); g.rotation.set(0, 0, 0); g.scale.setScalar(1); }); }
    function update(dt, t, you) {
      near.visible = !!you && Math.hypot(you.x - CAMP.x, you.z - CAMP.z) < 125;
      gate.visible = !!you && S.gateK > 0.01 && Math.hypot(you.x - GATE.x, you.z - GATE.z) < 110;
      if (!near.visible) { S.lit = S.litT; S.campLit = S.campT; S.gateK = S.gateOpen ? 0 : 1; return; }
      people.forEach(p => { if (!p.hidden) animatePerson(p, dt, t, you); });
      // Pío: hops along his perch, and now and then sings (notes float up)
      bird.next -= dt; bird.hop = Math.max(0, bird.hop - dt * 3);
      if (bird.next <= 0) { bird.next = 2.5 + Math.random() * 3; bird.sing = 1.6; bird.hop = 1; }
      if (bird.sing > 0) { bird.sing -= dt; if (Math.random() < dt * 5) note(group, SPOT.cage.x + 0.1, Y0 + 2.3, SPOT.cage.z + 0.1, Math.random() < 0.5 ? '#fff3a0' : '#ffd6e2'); }
      bird.bird.position.y = -0.33 + Math.sin(bird.hop * Math.PI) * 0.06;
      bird.bird.rotation.y = Math.sin(t * 0.8) * 0.7; bird.bird.rotation.x = bird.sing > 0 ? -0.25 + Math.sin(t * 22) * 0.08 : 0;
      bird.cage.rotation.z = Math.sin(t * 1.2) * 0.04;
      notesStep(dt);
      // the crystals: dark gray → their colors, glowing and pulsing
      S.lit = damp(S.lit, S.litT, 2.2, dt);
      const L = S.lit;
      crystalMat.color.setRGB(lerp(0.29, 1, L), lerp(0.27, 1, L), lerp(0.35, 1, L));
      crystalMat.emissive.setRGB(0.22 * L, 0.16 * L, 0.42 * L).multiplyScalar(0.8 + 0.25 * Math.sin(t * 2.4));
      crystalGlows.forEach((g, i) => { g.material.opacity = L * (0.55 + 0.2 * Math.sin(t * 2 + i)); });
      // the camp's lamps and the fire: lit once the gong has rung
      S.campLit = damp(S.campLit, S.campT, 1.5, dt);
      lampGlows.forEach((g, i) => { g.material.opacity = S.campLit * (0.75 + 0.1 * Math.sin(t * 7 + i * 2)); });
      if (fire.visible) flames.forEach((f, i) => { const kk = 1 + Math.sin(t * 11 + i) * 0.08 + Math.sin(t * 17 + i * 2) * 0.05; f.sp.scale.set(0.9 * f.s * kk * S.campLit, 1.4 * f.s * (2 - kk) * S.campLit, 1); });
      // the gate's mist: drifting while it holds, fading when the lake's bell has rung
      S.gateK = damp(S.gateK, S.gateOpen ? 0 : 1, 1.2, dt);
      if (gate.visible) { mist.forEach((m, i) => { m.sp.material.opacity = 0.65 * S.gateK; m.sp.position.y = m.y0 + Math.sin(t * 0.4 + m.ph) * 0.4; }); gate.children[0].visible = S.gateK > 0.05; }
    }
    const stats = () => { let tris = 0, calls = 0; group.traverse(o => { if (o.isMesh || o.isSprite) { calls++; if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } }); return { tris: Math.round(tris), meshes: calls, colliders: colliders.length, people: people.length }; };
    return {
      colliders, platforms: [], moving, group, people, update, stats,
      landmarks: C.landmarks, objects: { seal, crystalMat, crystalGlows, lampGlows, fire, gate, bird, peaks, statics, dark },
      setCrystals, setCamp, setGate, openSeal, setSeal, makePerson: (d, o) => makePerson(d, group, o), note: (x, y, z, c) => note(group, x, y, z, c),
      get lit() { return S.lit; }, get sealOpen() { return S.sealOpen; },
    };
  }
  // the canyon's walls: rows of solids just past the open road, and round the camp (leaving the way in)
  function corridorWalls() {
    const out = [], R = C.roadDist, BD = C.bowlDist, last = ROAD[ROAD.length - 1];
    const push = (x, z) => { if (BD(x, z) < 1.4 || R(x, z) < 5.2) return; if (out.some(o => Math.hypot(o.x - x, o.z - z) < 0.9)) return; out.push({ x, z, r: 0.85 }); };
    // along the road, north of the field
    for (let i = 0; i < ROAD.length - 1; i++) {
      const [ax, az] = ROAD[i], [bx, bz] = ROAD[i + 1], len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
      for (let s = 0; s < len; s += 1.0) {
        const x = ax + ux * s, z = az + uz * s;
        if (z > -203) continue;
        const g = Math.hypot(x - GATE.x, z - GATE.z), w = lerp(5.6, 7.6, smoothstep(4, 14, g));
        for (const sd of [-1, 1]) push(x - uz * w * sd, z + ux * w * sd);
      }
    }
    // round the camp, but not across the way in
    for (let a = 0; a < TAU; a += 0.035) {
      const x = CAMP.x + Math.cos(a) * (CAMP.rx + 2.2), z = CAMP.z + Math.sin(a) * (CAMP.rz + 2.2);
      if (Math.hypot(x - last[0], z - last[1]) < 9 || R(x, z) < 6.5) continue;
      if (typeof PEAKS !== 'undefined' && PEAKS.roadDist && PEAKS.roadDist(x, z) < PEAKS.ROAD_W + 0.9) continue;      // (the Frost Pass leaves east: peaks.js)
      out.push({ x, z, r: 0.9 });
    }
    return out;
  }
  Object.assign(C, { build, makePersonDef: personKits, POSES, grayOf, Kit, GEO });
})();

// ================================================================ words, icons and lines (registered at load), and the "how are they?" grader
(() => {
  const C = CAVES;
  // the region's words (w.blanket, w.lamp, w.lantern, w.mountain and w.bell come from other files)
  const NEW_WORDS = [
    { id: 'w.gong', es: 'gong', pt: 'gongo', de: 'Gong', zh: '[锣|luó]', ja: '[銅鑼|どら]', en: 'gong', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'gongs', pt: 'gongos', de: 'Gongs' }, icon: 'gong' },
    { id: 'w.crystal', es: 'cristal', pt: 'cristal', de: 'Kristall', zh: '[水晶|shuǐ jīng]', ja: '[水晶|すいしょう]', en: 'crystal', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'cristales', pt: 'cristais', de: 'Kristalle' }, icon: 'crystal' },
    { id: 'w.canary', es: 'canario', pt: 'canário', de: 'Kanarienvogel', zh: '[金丝雀|jīn sī què]', ja: 'カナリア', en: 'canary', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'canarios', pt: 'canários', de: 'Kanarienvögel' }, icon: 'canary', alt: { de: ['Kanarie'] } },
    { id: 'w.soup', es: 'sopa', pt: 'sopa', de: 'Suppe', zh: '[汤|tāng]', ja: 'スープ', en: 'soup', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'sopas', pt: 'sopas', de: 'Suppen' }, icon: 'soup' },
  ];
  // sing: Mimo learns it from Pío (the battle registers the same verb: whichever comes first keeps its object, and gets these)
  const SING = { id: 'v.sing', kind: 'verb', es: 'canta', pt: 'canta', de: 'sing', zh: '[唱歌|chàng gē]', ja: '[歌|うた]って', en: 'sing', icon: 'sing',     // (zh / ja: as the battle says it)
    alt: { es: ['cante', 'cántale', 'cantá'], pt: ['cante', 'cantar'], de: ['singe', 'singt', 'singen'], zh: ['[唱|chàng]'], ja: ['[歌|うた]う', '[歌|うた]え'] } };
  function registerWords() {
    if (typeof LEX === 'undefined') return;
    LEX.register(NEW_WORDS.filter(w => !LEX.item(w.id)));
    const it = LEX.item('v.sing');
    if (!it) LEX.register([SING]);
    else { it.icon = 'sing'; it.alt = it.alt || {}; for (const l of Object.keys(SING.alt)) it.alt[l] = Array.from(new Set([...(it.alt[l] || []), ...SING.alt[l]])); for (const l of ['zh', 'ja']) if (!it[l]) it[l] = SING[l]; }
  }
  registerWords();
  // icons (ICONS.add: drawn twice, pass 0 the paper border, pass 1 colors and ink, in a 100 × 100 box)
  if (typeof ICONS !== 'undefined') {
    ICONS.add('sing', (c, p, h) => {      // a round singer with notes coming out
      h.shape(c, p, h.ell(-8, 6, 20, 20), '#ffd84a'); h.shape(c, p, h.ell(-2, 12, 7, 9), '#e0503f');
      if (p) { h.dot(c, -14, -2, 2.6, h.INK); h.dot(c, 0, -2, 2.6, h.INK); }
      [[20, -22], [32, -6]].forEach(([x, y], i) => { h.shape(c, p, h.ell(x, y, 6, 5, -0.4), i ? '#7ff7ea' : '#ff9bb3'); h.shape(c, p, h.rr(x + 4, y - 22, 3, 22, 1), i ? '#7ff7ea' : '#ff9bb3', 1.4); });
    });
    ICONS.add('gong', (c, p, h) => { h.shape(c, p, h.rr(-34, -36, 68, 8, 3), '#8a5f3e'); h.shape(c, p, h.rr(-32, -36, 7, 70, 3), '#8a5f3e'); h.shape(c, p, h.rr(25, -36, 7, 70, 3), '#8a5f3e'); h.shape(c, p, h.ell(0, 4, 20, 20), '#e6b54a'); h.shape(c, p, h.ell(0, 4, 9, 9), '#c99a3e'); });
    ICONS.add('crystal', (c, p, h) => { h.shape(c, p, h.poly([[-6, 30], [-16, -6], [-4, -34], [8, -6], [2, 30]]), '#a99cff'); h.shape(c, p, h.poly([[6, 30], [10, 2], [22, -16], [26, 4], [18, 30]]), '#7ff7ea'); h.shape(c, p, h.poly([[-14, 30], [-24, 8], [-20, -6], [-12, 12], [-8, 30]]), '#c9a2ff'); });
    ICONS.add('canary', (c, p, h) => { h.shape(c, p, h.ell(0, 8, 22, 16), '#ffd84a'); h.shape(c, p, h.ell(12, -12, 12, 12), '#ffd84a'); h.shape(c, p, h.poly([[22, -14], [34, -10], [22, -6]]), '#f2a03a'); h.shape(c, p, h.ell(-6, 10, 12, 7, 0.4), '#e8b93a'); if (p) h.eyes(c, 14, 14, -14, 0.8); });
    ICONS.add('soup', (c, p, h) => { h.shape(c, p, c2 => { c2.moveTo(-30, -4); c2.lineTo(30, -4); c2.quadraticCurveTo(28, 28, 0, 28); c2.quadraticCurveTo(-28, 28, -30, -4); c2.closePath(); }, '#f3ead6'); h.shape(c, p, h.ell(0, -4, 29, 7), '#e0743c'); if (p) [[-10, -20], [6, -24]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y + 10); c.quadraticCurveTo(x - 6, y, x, y - 8); c.lineWidth = 2; c.strokeStyle = 'rgba(43,34,53,0.5)'; c.stroke(); }); });
    ICONS.add('miner', (c, p, h) => { h.shape(c, p, h.ell(0, 6, 22, 22), '#e6b48c'); h.shape(c, p, c2 => { c2.moveTo(-26, -4); c2.quadraticCurveTo(0, -42, 26, -4); c2.closePath(); }, '#e8b83a'); h.shape(c, p, h.rr(-6, -20, 12, 9, 3), '#fff3a0'); if (p) h.eyes(c, -8, 8, 8); });
  }

  // ---------------------------------------------------------------- lines: T(en, es, pt, de, zh, ja). The en is the weave's (slots).
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const CL = {
    // Cande, the camp boss: brisk and warm; she calls you «tú» and the two of you «ustedes»
    'c.hello': T('{w.hello}! Visitors, all the way up here? I’m Cande, the boss of this camp. Careful: the Hush got here first.',
      '¡Hola! ¿Visitas, aquí arriba? Soy Cande, la jefa de este campamento. Cuidado: el Silencio llegó primero.',
      'Oi! Visita aqui em cima? Eu sou a Cande, a chefe deste acampamento. Cuidado: o Silêncio chegou primeiro.',
      'Hallo! Besuch hier oben? Ich bin Cande, die Chefin von diesem Lager. Vorsicht: Die Stille war zuerst hier.',
      '[你好|nǐ hǎo] ！ [有|yǒu] [客人|kè rén] [到|dào] [这么|zhè me] [高|gāo] [的|de] [地方|dì fang] [来|lái] ？ [我|wǒ] [是|shì] [坎德|Kǎn dé] ， [这个|zhè ge] [营地|yíng dì] [的|de] [队长|duì zhǎng] 。 [小心|xiǎo xīn] ， [寂静|jì jìng] [先|xiān] [到|dào] [了|le] 。',
      'こんにちは ！ こんな [上|うえ] まで お[客|きゃく]さん です か ？ わたし は カンデ 、 この キャンプ の リーダー です 。 [気|き] を つけて 。 [静寂|せいじゃく] が [先|さき] に [来|き]ました 。'),
    'c.hush': T('Two weeks ago the mine’s {w.gong} went quiet. Then the dark came up out of the tunnels… and took my miners’ words.',
      'Hace dos semanas, el gong de la mina se calló. Luego la oscuridad salió de los túneles… y se llevó las palabras de mis mineros.',
      'Faz duas semanas, o gongo da mina se calou. Depois a escuridão saiu dos túneis… e levou as palavras dos meus mineiros.',
      'Vor zwei Wochen ist der Gong in der Mine verstummt. Dann kam die Dunkelheit aus den Stollen… und hat meinen Bergleuten die Wörter genommen.',
      '[两|liǎng] [个|gè] [星期|xīng qī] [以前|yǐ qián] ， [矿|kuàng] [里|lǐ] [的|de] [锣|luó] [不|bù] [响|xiǎng] [了|le] 。 [然后|rán hòu] [黑暗|hēi àn] [从|cóng] [隧道|suì dào] [里|lǐ] [出来|chū lái] … [拿走|ná zǒu] [了|le] [我|wǒ] [的|de] [矿工们|kuàng gōng men] [的|de] [话|huà] 。',
      '[二週間|にしゅうかん] [前|まえ] 、 [鉱山|こうざん] の [銅鑼|どら] が [鳴|な]らなく なりました 。 それから [闇|やみ] が トンネル から [出|で]て きて … [鉱夫|こうふ] たち の [言葉|ことば] を [奪|うば]った ん です 。'),
    'c.gong': T('Our {w.bell} is a {w.gong}, deep down in the mine. Now gray stone seals the way in. Only a voice can open it… and mine isn’t enough.',
      'Nuestra campana es un gong, en lo más hondo de la mina. Ahora una piedra gris tapa la entrada. Solo una voz la puede abrir… y la mía no alcanza.',
      'O nosso sino é um gongo, lá no fundo da mina. Agora uma pedra cinza tampa a entrada. Só uma voz pode abrir… e a minha não basta.',
      'Unsere Glocke ist ein Gong, ganz tief unten in der Mine. Jetzt versperrt grauer Stein den Eingang. Nur eine Stimme kann ihn öffnen… und meine reicht nicht.',
      '[我们|wǒ men] [的|de] [钟|zhōng] [是|shì] [一|yī] [面|miàn] [锣|luó] ， [在|zài] [矿|kuàng] [的|de] [最|zuì] [深处|shēn chù] 。 [现在|xiàn zài] [灰色|huī sè] [的|de] [石头|shí tou] [堵住|dǔ zhù] [了|le] [洞口|dòng kǒu] 。 [只有|zhǐ yǒu] [声音|shēng yīn] [能|néng] [打开|dǎ kāi] [它|tā] … [我|wǒ] [的|de] [声音|shēng yīn] [不|bù] [够|gòu] 。',
      'わたし たち の [鐘|かね] は [銅鑼|どら] です 。 [鉱山|こうざん] の いちばん [奥|おく] に あります 。 [今|いま] は [灰色|はいいろ] の [石|いし] が [入口|いりぐち] を ふさいで います 。 [開|あ]けられる の は [声|こえ] だけ … わたし の [声|こえ] では [足|た]りません 。'),
    'c.ask': T('They can’t tell me what’s wrong. You teach your little {c.friend} words, don’t you? Then look at each one and tell me how they are. I’ll know what they need.',
      'No me pueden decir qué les pasa. Tú le enseñas palabras a tu amiguito, ¿no? Entonces mira a cada uno y dime cómo está. Yo sabré qué necesita.',
      'Eles não conseguem me dizer o que têm. Você ensina palavras pro seu amiguinho, né? Então olha cada um e me diz como ele está. Eu vou saber do que precisa.',
      'Sie können mir nicht sagen, was los ist. Du bringst deinem kleinen Freund Wörter bei, oder? Dann schau sie dir an und sag mir, wie es ihnen geht. Dann weiß ich, was sie brauchen.',
      '[他们|tā men] [说|shuō] [不|bù] [出|chū] [自己|zì jǐ] [怎么|zěn me] [了|le] 。 [你|nǐ] [教|jiāo] [你|nǐ] [的|de] [小|xiǎo] [朋友|péng you] [说话|shuō huà] ， [对|duì] [吧|ba] ？ [那|nà] [你|nǐ] [看看|kàn kan] [每|měi] [个|gè] [人|rén] ， [告诉|gào su] [我|wǒ] [他们|tā men] [怎么样|zěn me yàng] 。 [我|wǒ] [就|jiù] [知道|zhī dào] [他们|tā men] [需要|xū yào] [什么|shén me] 。',
      'みんな 、 どう した の か [言|い]えない ん です 。 あなた は お[友達|ともだち] に [言葉|ことば] を [教|おし]えて います よ ね ？ じゃあ 、 [一人|ひとり] ずつ [見|み]て 、 どんな [様子|ようす] か [教|おし]えて ください 。 [何|なに] が [必要|ひつよう] か わかります から 。'),
    'c.pio': T('Only Pío, my {w.canary}, still sings. Listen to him. The Hush can’t take a song.',
      'Solo Pío, mi canario, sigue cantando. Escúchalo. El Silencio no se puede llevar una canción.',
      'Só o Pío, meu canário, ainda canta. Escuta ele. O Silêncio não consegue levar uma canção.',
      'Nur Pío, mein Kanarienvogel, singt noch. Hör ihm zu. Ein Lied kann die Stille nicht nehmen.',
      '[只有|zhǐ yǒu] [皮奥|Pí ào] ， [我|wǒ] [的|de] [金丝雀|jīn sī què] ， [还|hái] [在|zài] [唱歌|chàng gē] 。 [你|nǐ] [听|tīng] 。 [寂静|jì jìng] [拿不走|ná bù zǒu] [歌声|gē shēng] 。',
      '[歌|うた]って いる の は 、 わたし の カナリア の ピオ だけ です 。 [聞|き]いて ください 。 [静寂|せいじゃく] も [歌|うた] は [奪|うば]えません 。'),
    'c.again': T('Look at each miner, and tell me how they are. I’ll get them what they need.',
      'Mira a cada minero y dime cómo está: «Está cansado», «Tiene frío»… Yo le doy lo que necesita.',
      'Olha cada mineiro e me diz como ele está: «Está cansado», «Está com frio»… Eu dou o que ele precisa.',
      'Schau dir jeden an und sag mir, wie es ihm geht: «Er ist müde», «Ihm ist kalt»… Ich gebe ihm, was er braucht.',
      '[看看|kàn kan] [每|měi] [个|gè] [矿工|kuàng gōng] ， [告诉|gào su] [我|wǒ] [他们|tā men] [怎么样|zěn me yàng] ： “ [他|tā] [很|hěn] [累|lèi] ” 、 “ [他|tā] [很|hěn] [冷|lěng] ” … [我|wǒ] [会|huì] [给|gěi] [他们|tā men] [需要|xū yào] [的|de] [东西|dōng xi] 。',
      '[鉱夫|こうふ] を [一人|ひとり] ずつ [見|み]て 、 どんな [様子|ようす] か [教|おし]えて ください 。 「 [疲|つか]れて います 」 、 「 [寒|さむ]がって います 」 … [必要|ひつよう] な もの を あげます 。'),
    'c.huh': T('Hm? I don’t understand. How is he? Tired, cold, hungry…?',
      '¿Cómo? No entiendo. ¿Cómo está? ¿Cansado? ¿Tiene frío? ¿Tiene hambre?',
      'Como? Não entendi. Como ele está? Cansado? Com frio? Com fome?',
      'Wie bitte? Das verstehe ich nicht. Wie geht es ihm? Ist er müde? Ist ihm kalt? Hat er Hunger?',
      '[什么|shén me] ？ [我|wǒ] [不|bù] [懂|dǒng] 。 [他|tā] [怎么样|zěn me yàng] ？ [累|lèi] [吗|ma] ？ [冷|lěng] [吗|ma] ？ [饿|è] [吗|ma] ？',
      'え ？ わかりません 。 どんな [様子|ようす] です か ？ [疲|つか]れて いる ？ [寒|さむ]い ？ お[腹|なか] が すいて いる ？'),
    'c.pioTeach': T('Yes! Pío sings every morning. If your little {c.friend} can sing too… maybe the {w.crystal:pl} by the mine will listen.',
      '¡Sí! Pío canta todas las mañanas. Si tu amiguito también canta… a lo mejor los cristales de la mina lo escuchan.',
      'Isso! O Pío canta toda manhã. Se o seu amiguinho também cantar… talvez os cristais da mina escutem.',
      'Ja! Pío singt jeden Morgen. Wenn dein kleiner Freund auch singt… hören die Kristalle an der Mine vielleicht zu.',
      '[对|duì] ！ [皮奥|Pí ào] [每天|měi tiān] [早上|zǎo shang] [都|dōu] [唱歌|chàng gē] 。 [如果|rú guǒ] [你|nǐ] [的|de] [小|xiǎo] [朋友|péng you] [也|yě] [会|huì] [唱|chàng] … [矿|kuàng] [边|biān] [的|de] [水晶|shuǐ jīng] [说不定|shuō bu dìng] [会|huì] [听|tīng] 。',
      'そう ！ ピオ は [毎朝|まいあさ] [歌|うた]います 。 あなた の お[友達|ともだち] も [歌|うた]えたら … [鉱山|こうざん] の [水晶|すいしょう] が [聞|き]いて くれる かも しれません 。'),
    'c.allHelped': T('Listen to them! They’re talking again. {c.thanks:f}, from the whole camp. Now… the mine. The {w.gong} is at the very bottom.',
      '¡Escúchalos! Ya hablan otra vez. Gracias, de parte de todo el campamento. Ahora… la mina. El gong está abajo del todo.',
      'Escuta só! Eles estão falando de novo. Obrigada, em nome de todo o acampamento. Agora… a mina. O gongo fica lá no fundo.',
      'Hör nur! Sie reden wieder. Danke, vom ganzen Lager. Jetzt… die Mine. Der Gong ist ganz unten.',
      '[你|nǐ] [听|tīng] ！ [他们|tā men] [又|yòu] [说话|shuō huà] [了|le] 。 [我|wǒ] [代表|dài biǎo] [整个|zhěng gè] [营地|yíng dì] [谢谢|xiè xie] [你|nǐ] 。 [现在|xiàn zài] … [该|gāi] [去|qù] [矿|kuàng] [里|lǐ] [了|le] 。 [锣|luó] [在|zài] [最|zuì] [下面|xià miàn] 。',
      '[聞|き]いて ！ みんな また [話|はな]して います 。 キャンプ の みんな から 、 ありがとう 。 さあ … [鉱山|こうざん] です 。 [銅鑼|どら] は いちばん [下|した] に あります 。'),
    'c.mine': T('The {w.gong} hangs in the Gong Hall, at the very bottom. Something big sleeps down there. Keep singing!',
      'El gong está en la Sala del Gong, abajo del todo. Algo grande duerme ahí. ¡Sigan cantando!',
      'O gongo fica no Salão do Gongo, lá no fundo. Tem uma coisa grande dormindo lá. Continuem cantando!',
      'Der Gong hängt in der Gonghalle, ganz unten. Da unten schläft etwas Großes. Singt weiter!',
      '[锣|luó] [挂|guà] [在|zài] [最|zuì] [下面|xià miàn] [的|de] [锣厅|luó tīng] [里|lǐ] 。 [那里|nà lǐ] [睡着|shuì zhe] [一|yī] [个|gè] [大|dà] [东西|dōng xi] 。 [继续|jì xù] [唱|chàng] [吧|ba] ！',
      '[銅鑼|どら] は いちばん [下|した] の 「 [銅鑼|どら] の [間|ま] 」 に あります 。 そこ で [何|なに] か [大|おお]きな もの が [眠|ねむ]って います 。 [歌|うた]い つづけて ！'),
    'c.first': T('First, my miners. Help them find their words, and then we’ll talk about the mine.',
      'Primero, mis mineros. Ayúdalos a encontrar sus palabras, y después hablamos de la mina.',
      'Primeiro, os meus mineiros. Ajuda eles a achar as palavras, e depois a gente fala da mina.',
      'Zuerst meine Bergleute. Hilf ihnen, ihre Wörter wiederzufinden, dann reden wir über die Mine.',
      '[先|xiān] [帮|bāng] [我|wǒ] [的|de] [矿工们|kuàng gōng men] [找回|zhǎo huí] [他们|tā men] [的|de] [话|huà] ， [然后|rán hòu] [我们|wǒ men] [再|zài] [说|shuō] [矿|kuàng] [的|de] [事|shì] 。',
      'まず 、 [鉱夫|こうふ] たち を [助|たす]けて ください 。 [言葉|ことば] が [戻|もど]ったら 、 [鉱山|こうざん] の [話|はなし] を しましょう 。'),
    'c.third': T('The third {w.bell}! Hear that? The whole {w.mountain} is ringing. Your friend Noa came through here too, you know. She went on to the Bloom Gardens.',
      '¡La tercera campana! ¿La oyen? Toda la montaña suena. Tu amiga Noa también pasó por aquí, ¿sabes? Se fue a los Jardines en Flor.',
      'O terceiro sino! Estão ouvindo? A montanha inteira está tocando. A sua amiga Noa também passou por aqui, sabia? Ela foi para os Jardins em Flor.',
      'Die dritte Glocke! Hört ihr das? Der ganze Berg klingt. Deine Freundin Noa war übrigens auch hier. Sie ist weiter zu den Blütengärten.',
      '[第三|dì sān] [个|gè] [钟|zhōng] ！ [你们|nǐ men] [听到|tīng dào] [了|le] [吗|ma] ？ [整|zhěng] [座|zuò] [山|shān] [都|dōu] [在|zài] [响|xiǎng] 。 [你|nǐ] [的|de] [朋友|péng you] [诺娅|Nuò yà] [也|yě] [来|lái] [过|guo] [这里|zhè lǐ] 。 [她|tā] [去|qù] [了|le] [花园谷|Huā yuán gǔ] 。',
      '[三番目|さんばんめ] の [鐘|かね] ！ [聞|き]こえます か ？ [山|やま] [全体|ぜんたい] が [鳴|な]って います 。 あなた の お[友達|ともだち] の ノア も 、 ここ を [通|とお]りました よ 。 [花園|はなぞの] へ [行|い]きました 。'),
    'c.next': T('The Bloom Gardens are in a warm valley, a long way from here. Bees, flowers, greenhouses… The fourth {w.bell} must be there.',
      'Los Jardines en Flor están en un valle cálido, lejos de aquí. Abejas, flores, invernaderos… La cuarta campana debe estar ahí.',
      'Os Jardins em Flor ficam num vale quente, longe daqui. Abelhas, flores, estufas… O quarto sino deve estar lá.',
      'Die Blütengärten liegen in einem warmen Tal, weit weg von hier. Bienen, Blumen, Gewächshäuser… Die vierte Glocke muss dort sein.',
      '[花园谷|Huā yuán gǔ] [在|zài] [很|hěn] [远|yuǎn] [的|de] [地方|dì fang] ， [一|yī] [个|gè] [温暖|wēn nuǎn] [的|de] [山谷|shān gǔ] [里|lǐ] 。 [蜜蜂|mì fēng] 、 [花|huā] 、 [温室|wēn shì] … [第四|dì sì] [个|gè] [钟|zhōng] [一定|yī dìng] [在|zài] [那里|nà lǐ] 。',
      '[花園|はなぞの] は 、 ずっと [遠|とお]く の 、 あたたかい [谷|たに] に あります 。 ハチ 、 [花|はな] 、 [温室|おんしつ] … [四番目|よんばんめ] の [鐘|かね] は きっと そこ です 。'),
    // (DESIGN.md 16: heard before you're asked) Cande shows you how to say it, on two of her miners, whole in the language with the
    // English under it; and she calls to Pío as he sings, before Mimo asks what he's doing
    'c.demo': T('Look at Paco: he’s tired. And Rocío? She’s cold. Tell me like that: «He’s tired», «She’s cold»…',
      'Mira a Paco: está cansado. ¿Y Rocío? Tiene frío. Dímelo así: «Está cansado», «Tiene frío»…',
      'Olha o Paco: ele está cansado. E a Rocío? Ela está com frio. Me diz assim: «Ele está cansado», «Ela está com frio»…',
      'Schau, Paco: Er ist müde. Und Rocío? Ihr ist kalt. Sag es mir so: «Er ist müde», «Ihr ist kalt»…',
      '[你|nǐ] [看|kàn] [帕科|Pà kē] ： [他|tā] [很|hěn] [累|lèi] 。 [罗西奥|Luó xī ào] [呢|ne] ？ [她|tā] [很|hěn] [冷|lěng] 。 [就|jiù] [这样|zhè yàng] [告诉|gào su] [我|wǒ] ： “ [他|tā] [很|hěn] [累|lèi] ” 、 “ [她|tā] [很|hěn] [冷|lěng] ” …',
      'パコ を [見|み]て ください 。 [疲|つか]れて います 。 ロシオ は ？ [寒|さむ]がって います 。 そんな ふう に [教|おし]えて ください 。 「 [疲|つか]れて います 」 、 「 [寒|さむ]がって います 」 …'),
    'c.pioDemo': T('Sing, Pío, sing! Hear that? He sings like that every morning.',
      '¡Canta, Pío, canta! ¿Lo oyes? Así canta todas las mañanas.',
      'Canta, Pío, canta! Tá ouvindo? Ele canta assim toda manhã.',
      'Sing, Pío, sing! Hörst du? So singt er jeden Morgen.',
      '[皮奥|Pí ào] ， [唱歌|chàng gē] ！ [唱歌|chàng gē] ！ [听到|tīng dào] [了|le] [吗|ma] ？ [他|tā] [每天|měi tiān] [早上|zǎo shang] [都|dōu] [这样|zhè yàng] [唱歌|chàng gē] 。',
      'ピオ 、 [歌|うた]って ！ [歌|うた]って ！ [聞|き]こえます か ？ [毎朝|まいあさ] 、 こう やって [歌|うた]う ん です よ 。'),
  };
  // the sentence frames on the help box (zh / ja in the notation): what Cande showed you, with a gap
  const FRAME = { es: '«Está ___» · «Tiene ___» · «Le duele ___»', pt: '«Ele / Ela está ___» · «Ele / Ela está com ___»', de: '«Er / Sie ist ___» · «Er / Sie hat ___» · «Ihm / Ihr ist ___»',
    zh: '“ [他|tā] / [她|tā] [很|hěn] ___ ”', ja: '「 ___ て います 」 · 「 ___ が [痛|いた]い です 」' };
  // Cande, sending the help (it says the sentence back, the right way, for that miner: «¿Está cansado? ¡Un café!»)
  const he = g => (g === 'f' ? 'she' : 'he'), He = g => (g === 'f' ? 'She' : 'He');
  const GOT = {
    tired: g => T(`Tired? A coffee, quick!`, `¿Está ${g === 'f' ? 'cansada' : 'cansado'}? ¡Un café, rápido!`, `${g === 'f' ? 'Ela' : 'Ele'} está ${g === 'f' ? 'cansada' : 'cansado'}? Um cafezinho, rápido!`, `${g === 'f' ? 'Sie' : 'Er'} ist müde? Schnell, einen Kaffee!`,
      `[${g === 'f' ? '她' : '他'}|tā] [累|lèi] [了|le] ？ [快|kuài] ， [来|lái] [杯|bēi] [咖啡|kā fēi] ！`, '[疲|つか]れて いる ？ コーヒー を 、 [早|はや]く ！'),
    cold: g => T(`Cold? A {w.blanket}!`, '¿Tiene frío? ¡Una cobija!', `${g === 'f' ? 'Ela' : 'Ele'} está com frio? Um cobertor!`, `${g === 'f' ? 'Ihr' : 'Ihm'} ist kalt? Eine Decke!`,
      `[${g === 'f' ? '她' : '他'}|tā] [冷|lěng] ？ [拿|ná] [条|tiáo] [毯子|tǎn zi] [来|lái] ！`, '[寒|さむ]い ？ [毛布|もうふ] を ！'),
    hungry: g => T(`Hungry? {w.soup} from the kitchen!`, '¿Tiene hambre? ¡Sopa de la cocina!', `${g === 'f' ? 'Ela' : 'Ele'} está com fome? Sopa da cozinha!`, `${g === 'f' ? 'Sie' : 'Er'} hat Hunger? Suppe aus der Küche!`,
      `[${g === 'f' ? '她' : '他'}|tā] [饿|è] [了|le] ？ [厨房|chú fáng] [有|yǒu] [汤|tāng] ！`, 'お[腹|なか] が すいて いる ？ [台所|だいどころ] の スープ を ！'),
    scared: g => T(`Scared? A {w.lamp}! Light helps.`, '¿Tiene miedo? ¡Una lámpara! La luz ayuda.', `${g === 'f' ? 'Ela' : 'Ele'} está com medo? Uma lanterna! A luz ajuda.`, `${g === 'f' ? 'Sie' : 'Er'} hat Angst? Eine Lampe! Licht hilft.`,
      `[${g === 'f' ? '她' : '他'}|tā] [害怕|hài pà] ？ [拿|ná] [盏|zhǎn] [灯|dēng] [来|lái] ！ [有|yǒu] [光|guāng] [就|jiù] [好|hǎo] [了|le] 。`, '[怖|こわ]い ？ ランプ を ！ [明|あか]かり が あれば [大丈夫|だいじょうぶ] 。'),
    headache: g => T(`A headache? Medicine, from the first-aid tent.`, '¿Le duele la cabeza? Medicina, de la enfermería.', `${g === 'f' ? 'Ela' : 'Ele'} está com dor de cabeça? Remédio, da enfermaria.`, `${g === 'f' ? 'Ihr' : 'Ihm'} tut der Kopf weh? Medizin aus dem Sanitätszelt.`,
      `[${g === 'f' ? '她' : '他'}|tā] [头疼|tóu téng] ？ [医务室|yī wù shì] [有|yǒu] [药|yào] 。`, '[頭|あたま] が [痛|いた]い ？ [救護|きゅうご] テント の [薬|くすり] を 。'),
    sad: g => T(`Sad? Then a song.`, '¿Está triste? Entonces, una canción.', `${g === 'f' ? 'Ela' : 'Ele'} está triste? Então, uma canção.`, `${g === 'f' ? 'Sie' : 'Er'} ist traurig? Dann ein Lied.`,
      `[${g === 'f' ? '她' : '他'}|tā] [难过|nán guò] ？ [那|nà] [就|jiù] [唱|chàng] [首|shǒu] [歌|gē] 。`, '[悲|かな]しい ？ じゃあ 、 [歌|うた] を 。'),
  };
  // the miners: half-hushed (the *starred* words survive the Hush), then themselves again
  const MINER_LINES = {
    paco: { hushed: T('So *tired*… my *arms*… I *can’t*…', '*Cansado*… mis *brazos*… no *puedo*…', '*Cansado*… meus *braços*… não *consigo*…', 'So *müde*… meine *Arme*… ich *kann* nicht…', '[好|hǎo] [累|lèi] … [我|wǒ] [的|de] [胳膊|gē bo] …', 'もう … [腕|うで] が … [疲|つか]れた …'),
      back: T('Ah, a coffee! {c.thanks}. I’m not so tired now. I’m happy!', '¡Ay, un café! Gracias. Ya no estoy tan cansado. ¡Estoy contento!', 'Ah, um cafezinho! Obrigado. Já não estou tão cansado. Estou contente!', 'Ah, ein Kaffee! Danke. Ich bin nicht mehr so müde. Ich bin froh!',
        '[啊|a] ， [咖啡|kā fēi] ！ [谢谢|xiè xie] 。 [我|wǒ] [没|méi] [那么|nà me] [累|lèi] [了|le] 。 [我|wǒ] [很|hěn] [高兴|gāo xìng] ！', 'わあ 、 コーヒー ！ ありがとう 。 もう そんなに [疲|つか]れて ない 。 うれしい ！'),
      chat: T('Back to work tomorrow! But slowly.', '¡Mañana vuelvo al trabajo! Pero despacito.', 'Amanhã eu volto ao trabalho! Mas devagarinho.', 'Morgen gehe ich wieder an die Arbeit! Aber langsam.', '[明天|míng tiān] [我|wǒ] [回去|huí qù] [干活|gàn huó] ！ [可是|kě shì] [慢慢|màn màn] [来|lái] 。', '[明日|あした] は [仕事|しごと] に [戻|もど]ります ！ でも 、 ゆっくり 。') },
    rocio: { hushed: T('*Cold*… so *cold*… my *hands*…', '*Frío*… mucho *frío*… mis *manos*…', '*Frio*… muito *frio*… minhas *mãos*…', '*Kalt*… so *kalt*… meine *Hände*…', '[冷|lěng] … [好|hǎo] [冷|lěng] … [我|wǒ] [的|de] [手|shǒu] …', '[寒|さむ]い … とても [寒|さむ]い … [手|て] が …'),
      back: T('What a warm {w.blanket}! I’m not cold anymore. {c.thanks:f}!', '¡Qué cobija tan calientita! Ya no tengo frío. ¡Gracias!', 'Que cobertor quentinho! Já não estou com frio. Obrigada!', 'Was für eine warme Decke! Mir ist nicht mehr kalt. Danke!',
        '[好|hǎo] [暖和|nuǎn huo] [的|de] [毯子|tǎn zi] ！ [我|wǒ] [不|bù] [冷|lěng] [了|le] 。 [谢谢|xiè xie] ！', 'あたたかい [毛布|もうふ] ！ もう [寒|さむ]く ない 。 ありがとう ！'),
      chat: T('My hands are warm again. I can hold a pickaxe!', 'Mis manos ya están calientes. ¡Ya puedo agarrar el pico!', 'As minhas mãos já estão quentes. Já consigo segurar a picareta!', 'Meine Hände sind wieder warm. Ich kann wieder die Hacke halten!', '[我|wǒ] [的|de] [手|shǒu] [暖和|nuǎn huo] [了|le] 。 [我|wǒ] [又|yòu] [能|néng] [拿|ná] [镐|gǎo] [了|le] ！', '[手|て] が あたたかく なった 。 また つるはし を [持|も]てる ！') },
    lucho: { hushed: T('*Hungry*… I didn’t *eat*… *nothing*…', '*Hambre*… no *comí*… *nada*…', '*Fome*… não *comi*… *nada*…', '*Hunger*… nichts *gegessen*… *nichts*…', '[饿|è] … [没|méi] [吃|chī] … [什么|shén me] [都|dōu] [没|méi] [吃|chī] …', 'お[腹|なか] … [何|なに] も [食|た]べて ない …'),
      back: T('Mmm, {w.soup}! I’m not hungry anymore. {c.thanks}, really!', '¡Mmm, sopa! Ya no tengo hambre. ¡Gracias, de verdad!', 'Hum, sopa! Já não estou com fome. Obrigado, de verdade!', 'Mmm, Suppe! Ich habe keinen Hunger mehr. Danke, wirklich!',
        '[好|hǎo] [香|xiāng] [的|de] [汤|tāng] ！ [我|wǒ] [不|bù] [饿|è] [了|le] 。 [真|zhēn] [的|de] [谢谢|xiè xie] ！', 'うーん 、 スープ ！ もう お[腹|なか] いっぱい 。 [本当|ほんとう] に ありがとう ！'),
      chat: T('The canteen’s {w.soup} is the best in the mountains.', 'La sopa del comedor es la mejor de la montaña.', 'A sopa do refeitório é a melhor da montanha.', 'Die Suppe aus der Kantine ist die beste in den Bergen.', '[食堂|shí táng] [的|de] [汤|tāng] [是|shì] [山|shān] [里|lǐ] [最|zuì] [好|hǎo] [的|de] 。', '[食堂|しょくどう] の スープ は [山|やま] で いちばん です 。') },
    maite: { hushed: T('So *dark*… *scared*… I *can’t*…', 'Muy *oscuro*… *miedo*… no *puedo*…', 'Muito *escuro*… *medo*… não *consigo*…', 'So *dunkel*… *Angst*… ich *kann* nicht…', '[好|hǎo] [黑|hēi] … [怕|pà] … [我|wǒ] [不|bù] [行|xíng] …', '[暗|くら]い … [怖|こわ]い … できない …'),
      back: T('A {w.lamp}! With a light, I’m not scared anymore. {c.thanks:f}!', '¡Una lámpara! Con luz ya no tengo miedo. ¡Gracias!', 'Uma lanterna! Com luz já não estou com medo. Obrigada!', 'Eine Lampe! Mit Licht habe ich keine Angst mehr. Danke!',
        '[一|yī] [盏|zhǎn] [灯|dēng] ！ [有|yǒu] [光|guāng] [我|wǒ] [就|jiù] [不|bù] [怕|pà] [了|le] 。 [谢谢|xiè xie] ！', 'ランプ ！ [明|あか]かり が あれば もう [怖|こわ]く ない 。 ありがとう ！'),
      chat: T('The mine isn’t so scary with a light. And with a song!', 'La mina no da tanto miedo con luz. ¡Y con una canción!', 'A mina não dá tanto medo com luz. E com uma canção!', 'Mit Licht ist die Mine nicht so gruselig. Und mit einem Lied!', '[有|yǒu] [光|guāng] ， [矿|kuàng] [就|jiù] [没|méi] [那么|nà me] [可怕|kě pà] 。 [有|yǒu] [歌|gē] [就|jiù] [更|gèng] [好|hǎo] ！', '[明|あか]かり が あれば 、 [鉱山|こうざん] も そんなに [怖|こわ]く ない 。 [歌|うた] が あれば もっと ！') },
    efrain: { hushed: T('My *head*… it *hurts*… a *lot*…', 'Mi *cabeza*… me *duele*… *mucho*…', 'Minha *cabeça*… *dói*… *muito*…', 'Mein *Kopf*… tut *weh*… *sehr*…', '[我|wǒ] [的|de] [头|tóu] … [好|hǎo] [疼|téng] …', '[頭|あたま] が … [痛|いた]い …'),
      back: T('Ah… the medicine. My head doesn’t hurt anymore. {c.thanks}, {c.thanks}.', 'Ah… la medicina. Ya no me duele la cabeza. Gracias, gracias.', 'Ah… o remédio. A minha cabeça já não dói. Obrigado, obrigado.', 'Ah… die Medizin. Mein Kopf tut nicht mehr weh. Danke, danke.',
        '[啊|a] … [药|yào] 。 [我|wǒ] [的|de] [头|tóu] [不|bù] [疼|téng] [了|le] 。 [谢谢|xiè xie] ， [谢谢|xiè xie] 。', 'ああ … [薬|くすり] 。 もう [頭|あたま] が [痛|いた]く ない 。 ありがとう 、 ありがとう 。'),
      chat: T('Forty years in this mine, and I never heard it this quiet.', 'Cuarenta años en esta mina, y nunca la oí tan callada.', 'Quarenta anos nesta mina, e nunca ouvi ela tão calada.', 'Vierzig Jahre in dieser Mine, und so still war sie noch nie.', '[我|wǒ] [在|zài] [这个|zhè ge] [矿|kuàng] [里|lǐ] [四十|sì shí] [年|nián] [了|le] ， [从来|cóng lái] [没|méi] [这么|zhè me] [安静|ān jìng] [过|guo] 。', 'この [鉱山|こうざん] で [四十年|よんじゅうねん] 。 こんなに [静|しず]か だった こと は ない 。') },
    lupe: { hushed: T('*Sad*… I don’t *sing* anymore… *nothing*…', '*Triste*… ya no *canto*… *nada*…', '*Triste*… não *canto* mais… *nada*…', '*Traurig*… ich *singe* nicht mehr… *nichts*…', '[难过|nán guò] … [我|wǒ] [不|bù] [唱|chàng] [了|le] …', '[悲|かな]しい … もう [歌|うた]わない …'),
      back: T('What a pretty song! I’m not sad anymore. I’m happy!', '¡Qué canción tan bonita! Ya no estoy triste. ¡Estoy contenta!', 'Que canção bonita! Já não estou triste. Estou contente!', 'Was für ein schönes Lied! Ich bin nicht mehr traurig. Ich bin froh!',
        '[多|duō] [好听|hǎo tīng] [的|de] [歌|gē] ！ [我|wǒ] [不|bù] [难过|nán guò] [了|le] 。 [我|wǒ] [很|hěn] [高兴|gāo xìng] ！', 'きれい な [歌|うた] ！ もう [悲|かな]しく ない 。 うれしい ！'),
      chat: T('Tonight we’ll sing by the fire, like before.', 'Esta noche cantamos junto al fuego, como antes.', 'Hoje à noite a gente canta perto do fogo, como antes.', 'Heute Abend singen wir am Feuer, wie früher.', '[今天|jīn tiān] [晚上|wǎn shang] [我们|wǒ men] [在|zài] [火|huǒ] [边|biān] [唱歌|chàng gē] ， [像|xiàng] [以前|yǐ qián] [一样|yī yàng] 。', '[今夜|こんや] は 、 [前|まえ] みたい に [火|ひ] の そば で [歌|うた]おう 。') },
    chepe: { hushed: T('*Where*… am I… *lost*… so *dark*…', '¿*Dónde*… estoy?… *perdido*… muy *oscuro*…', '*Onde*… estou?… *perdido*… muito *escuro*…', '*Wo*… bin ich?… *verlaufen*… so *dunkel*…', '[我|wǒ] [在|zài] [哪里|nǎ lǐ] … [迷路|mí lù] [了|le] … [好|hǎo] [黑|hēi] …', 'ここ は どこ … [迷|まよ]った … [暗|くら]い …'),
      back: T('{c.thanks}! I was lost. The {w.gong} is further down… but careful: the giant bat sleeps there.', '¡Gracias! Estaba perdido. El gong está más abajo… pero cuidado: ahí duerme el murciélago gigante.', 'Obrigado! Eu estava perdido. O gongo fica mais embaixo… mas cuidado: o morcego gigante dorme lá.', 'Danke! Ich hatte mich verlaufen. Der Gong ist weiter unten… aber Vorsicht: Dort schläft die Riesenfledermaus.',
        '[谢谢|xiè xie] ！ [我|wǒ] [迷路|mí lù] [了|le] 。 [锣|luó] [在|zài] [下面|xià miàn] … [可是|kě shì] [小心|xiǎo xīn] ， [大|dà] [蝙蝠|biān fú] [在|zài] [那里|nà lǐ] [睡觉|shuì jiào] 。', 'ありがとう ！ [迷|まよ]って いました 。 [銅鑼|どら] は もっと [下|した] です … でも [気|き] を つけて 。 そこ で [大|おお]きな コウモリ が [寝|ね]て います 。'),
      chat: T('I’ll never go down there again without a song.', 'Nunca más bajo ahí sin una canción.', 'Nunca mais desço lá sem uma canção.', 'Ich gehe da nie wieder ohne ein Lied runter.', '[我|wǒ] [再|zài] [也|yě] [不|bù] [会|huì] [不|bù] [唱歌|chàng gē] [就|jiù] [下去|xià qù] [了|le] 。', 'もう [二度|にど] と 、 [歌|うた] なし で [下|お]りません 。') },
  };
  // Noa's notebook page in the mine (UI.page reads LINES via line(); [text] per language)
  const PAGE = {
    es: ['Aquí abajo todo está oscuro, y los murciélagos repiten todo lo que digo. Mañana me voy a los Jardines en Flor, en el valle cálido.'],
    pt: ['Aqui embaixo tudo está escuro, e os morcegos repetem tudo o que eu digo. Amanhã eu vou para os Jardins em Flor, no vale quente.'],
    de: ['Hier unten ist alles dunkel, und die Fledermäuse wiederholen alles, was ich sage. Morgen gehe ich zu den Blütengärten, im warmen Tal.'],
    zh: ['[这|zhè] [下面|xià miàn] [一|yī] [片|piàn] [漆黑|qī hēi] ， [蝙蝠|biān fú] [学|xué] [我|wǒ] [说|shuō] [的|de] [每|měi] [一|yī] [句|jù] [话|huà] 。 [明天|míng tiān] [我|wǒ] [要|yào] [去|qù] [温暖|wēn nuǎn] [山谷|shān gǔ] [里|lǐ] [的|de] [花园谷|Huā yuán gǔ] 。'],
    ja: ['ここ は まっくら で 、 コウモリ が わたし の [言|い]う こと を ぜんぶ まねする 。 [明日|あした] は あたたかい [谷|たに] の [花園|はなぞの] へ [行|い]く 。'],
    en: ['Down here it’s all dark, and the bats repeat everything I say. Tomorrow I’m off to the Bloom Gardens, in the warm valley.'],
  };
  if (typeof LINES !== 'undefined' && !LINES['page.caves']) LINES['page.caves'] = PAGE;

  // ---------------------------------------------------------------- the model sentence for a miner (the "I don't know" box shows it)
  const pr = (g, l) => ({ es: g === 'f' ? 'ella' : 'él', pt: g === 'f' ? 'Ela' : 'Ele', de: g === 'f' ? 'Sie' : 'Er' }[l]);
  const MODEL = {
    tired: { es: g => `Está ${g === 'f' ? 'cansada' : 'cansado'}.`, pt: g => `${pr(g, 'pt')} está ${g === 'f' ? 'cansada' : 'cansado'}.`, de: g => `${pr(g, 'de')} ist müde.`, zh: g => `[${g === 'f' ? '她' : '他'}|tā] [很|hěn] [累|lèi] 。`, ja: () => '[疲|つか]れて います 。', en: g => `${He(g)}’s tired.` },
    cold: { es: () => 'Tiene frío.', pt: g => `${pr(g, 'pt')} está com frio.`, de: g => `${g === 'f' ? 'Ihr' : 'Ihm'} ist kalt.`, zh: g => `[${g === 'f' ? '她' : '他'}|tā] [很|hěn] [冷|lěng] 。`, ja: () => '[寒|さむ]がって います 。', en: g => `${He(g)}’s cold.` },
    hungry: { es: () => 'Tiene hambre.', pt: g => `${pr(g, 'pt')} está com fome.`, de: g => `${pr(g, 'de')} hat Hunger.`, zh: g => `[${g === 'f' ? '她' : '他'}|tā] [饿|è] [了|le] 。`, ja: () => 'お[腹|なか] が すいて います 。', en: g => `${He(g)}’s hungry.` },
    scared: { es: () => 'Tiene miedo.', pt: g => `${pr(g, 'pt')} está com medo.`, de: g => `${pr(g, 'de')} hat Angst.`, zh: g => `[${g === 'f' ? '她' : '他'}|tā] [很|hěn] [害怕|hài pà] 。`, ja: () => '[怖|こわ]がって います 。', en: g => `${He(g)}’s scared.` },
    headache: { es: () => 'Le duele la cabeza.', pt: g => `${pr(g, 'pt')} está com dor de cabeça.`, de: g => `${g === 'f' ? 'Ihr' : 'Ihm'} tut der Kopf weh.`, zh: g => `[${g === 'f' ? '她' : '他'}|tā] [头疼|tóu téng] 。`, ja: () => '[頭|あたま] が [痛|いた]い です 。', en: g => `${He(g)} has a headache.` },
    sad: { es: () => 'Está triste.', pt: g => `${pr(g, 'pt')} está triste.`, de: g => `${pr(g, 'de')} ist traurig.`, zh: g => `[${g === 'f' ? '她' : '他'}|tā] [很|hěn] [难过|nán guò] 。`, ja: () => '[悲|かな]しんで います 。', en: g => `${He(g)}’s sad.` },
    lost: { es: g => `Está ${g === 'f' ? 'perdida' : 'perdido'}.`, pt: g => `${pr(g, 'pt')} está ${g === 'f' ? 'perdida' : 'perdido'}.`, de: g => `${pr(g, 'de')} hat sich verlaufen.`, zh: g => `[${g === 'f' ? '她' : '他'}|tā] [迷路|mí lù] [了|le] 。`, ja: () => '[道|みち] に [迷|まよ]って います 。', en: g => `${He(g)}’s lost.` },
  };
  const modelOf = (state, g, l) => { const m = MODEL[state]; if (!m) return ''; const f = m[l] || m.en; return f(g); };

  // ---------------------------------------------------------------- the grader: which state, and how well it was said (S–D)
  // es: estar + adjective (and its ending), tener + noun, «le duele la cabeza» · pt: estar + adjective, estar com / ter + noun,
  // «está com dor de cabeça» / «dói a cabeça» · de: sein + adjective, haben + noun, the dative «ihm/ihr ist kalt», «ihm tut der
  // Kopf weh». Each kind of slip counts once (a major one twice), like the battles and the shop: 0 → S (or A with only an accent
  // or a style note), 1 → B, 2 → C, 3+ → D. zh / ja: the state is found, and that's an S (their grammar comes in wave 2).
  const KEY = {
    es: { tired: /\b(cansad[oa]s?|agotad[oa]s?|fatigad[oa]s?)\b/, cold: /\b(frio|helad[oa]s?|congelad[oa]s?)\b/, hungry: /\b(hambre|hambrient[oa]s?)\b/, scared: /\b(miedo|asustad[oa]s?|susto)\b/,
      headache: /\b(cabeza|jaqueca|migrana)\b/, sad: /\b(triste|tristes|deprimid[oa]s?)\b/, lost: /\b(perdid[oa]s?)\b/, thirsty: /\bsed\b/, sleepy: /\bsueno\b/, asleep: /\b(dormid[oa]s?)\b/, happy: /\b(content[oa]s?|feliz)\b/ },
    pt: { tired: /\b(cansad[oa]s?|exaust[oa]s?)\b/, cold: /\b(frio|gelad[oa]s?)\b/, hungry: /\b(fome|faminto|faminta)\b/, scared: /\b(medo|assustad[oa]s?)\b/, headache: /\b(cabeca|enxaqueca)\b/,
      sad: /\b(triste|tristes)\b/, lost: /\b(perdid[oa]s?)\b/, thirsty: /\bsede\b/, sleepy: /\bsono\b/, asleep: /\bdormindo\b/, happy: /\b(contente|feliz)\b/ },
    de: { tired: /\b(mude|muede|erschopft|erschoepft)\b/, cold: /\b(kalt|friert|frieren|friere)\b/, hungry: /\b(hunger|hungrig)\b/, scared: /\b(angst|angstlich|aengstlich|furchtet|fuerchtet)\b/,
      headache: /\b(kopf|kopfschmerzen|kopfweh)\b/, sad: /\btraurig\b/, lost: /\b(verlaufen|verirrt|verloren)\b/, thirsty: /\b(durst|durstig)\b/, sleepy: /\b(schlafrig|schlaefrig)\b/, asleep: /\b(schlaft|schlaeft)\b/, happy: /\b(froh|glucklich|gluecklich)\b/ },
  };
  const CJKKEY = {
    zh: { tired: /累|lei|kun/, cold: /冷|leng/, hungry: /饿|饥|^e(le)?$|\be\b/, scared: /怕|haipa|hai pa/, headache: /头疼|头痛|touteng|tou teng|toutong/, sad: /难过|伤心|nanguo|nan guo|shangxin/, lost: /迷路|milu|mi lu/ },
    ja: { tired: /疲|つかれ|tsukare|tukare/, cold: /寒|さむ|samu/, hungry: /腹|おなか|onaka|hara|空腹|すいて|suite/, scared: /怖|こわ|kowa/, headache: /頭|あたま|atama/, sad: /悲|かなし|kanashi|kanasi/, lost: /迷|まよ|mayo/ },
  };
  const ORDER = ['headache', 'cold', 'hungry', 'thirsty', 'sleepy', 'scared', 'tired', 'sad', 'lost', 'asleep', 'happy'];
  function detect(text, l) {
    if (l === 'zh' || l === 'ja') {
      const raw = String(text).toLowerCase(), can = typeof CJK !== 'undefined' && CJK.canon ? CJK.canon(text, l) : raw.replace(/\s+/g, '');
      const flat = raw.normalize('NFD').replace(/[̀-ͯ]/g, '');        // (pinyin typed with tone marks: «Tā è le.»)
      for (const k of Object.keys(CJKKEY[l])) if (CJKKEY[l][k].test(raw) || CJKKEY[l][k].test(flat) || CJKKEY[l][k].test(can)) return k;
      return null;
    }
    const n = norm(text), K = KEY[l] || KEY.es;
    for (const k of ORDER) if (K[k] && K[k].test(n)) return k;
    return null;
  }
  const TENER = { cold: 1, hungry: 1, thirsty: 1, sleepy: 1 };
  function grade(text, l, miner) {
    const state = detect(text, l), g = miner.g || 'm';
    if (!state) return { state: null };
    const out = { state, slips: [], soft: [], model: modelOf(miner.state, g, l) };
    if (l === 'zh' || l === 'ja') return finish(out);
    const n = ' ' + norm(text) + ' ', raw = ' ' + String(text).toLowerCase() + ' ', has = re => re.test(n);
    const slip = (kind, why, major) => { if (!out.slips.some(s => s.kind === kind)) out.slips.push({ kind, why, major: !!major }); };
    const soft = (kind, why) => { if (!out.soft.some(s => s.kind === kind)) out.soft.push({ kind, why }); };
    const adjEnd = re => { const m = n.match(re); return m ? m[1] : null; };
    if (l === 'es') {
      const asustado = state === 'scared' && has(/\basustad[oa]s?\b/);
      if (state === 'headache') {
        if (has(/\bduele\b/)) {
          if (has(/\bme duele\b/)) slip('person', 'For someone else: «le duele», not «me duele» (that’s your own head)');
          else if (has(/\bte duele\b/)) slip('person', 'Talking about them: «le duele»');
          else if (!has(/\ble duele\b/)) slip('pronoun', 'Whose head? «le duele la cabeza»');
          if (!has(/\bla cabeza\b/)) slip('article', 'With «duele», the head takes «la»: «le duele la cabeza»');
        } else if (has(/\bduelen\b/)) slip('number', 'One head: «le duele la cabeza»');
        else if (has(/\bdolor de cabeza\b/)) { if (has(/\btengo\b/)) slip('person', 'Talking about them: «tiene dolor de cabeza»'); else if (!has(/\btiene\b/)) slip('verb', 'Say it whole: «Le duele la cabeza» (or «Tiene dolor de cabeza»)', true); }
        else slip('verb', 'Say what’s wrong: «Le duele la cabeza»', true);
      } else if (TENER[state] || (state === 'scared' && !asustado)) {
        if (has(/\btiene\b/)) { /* good */ } else if (has(/\b(tengo|tienes|tienen)\b/)) slip('person', `Talking about ${miner.name}: «tiene», not «tengo»`);
        else if (has(/\b(esta|estan|es|son)\b/)) slip('tener', `With frío, hambre, miedo… Spanish says «tener»: «tiene ${state === 'cold' ? 'frío' : state === 'hungry' ? 'hambre' : state === 'thirsty' ? 'sed' : state === 'sleepy' ? 'sueño' : 'miedo'}»`, true);
        else if (state === 'cold' && has(/\bhace\b/)) slip('tener', '«Hace frío» is the weather. A person: «tiene frío»', true);
        else slip('verb', 'Make it a sentence: «Tiene …»', true);
        if (state === 'cold' && /\bfrio\b/.test(raw)) soft('accent', 'Accent: «frío»');
        if (state === 'sleepy' && /\bsueno\b/.test(raw)) soft('accent', 'Accent: «sueño»');
      } else {
        if (has(/\b(esta|estan)\b/)) { if (/\besta\b/.test(raw)) soft('accent', 'Accent: «está»'); }
        else if (has(/\b(estoy|estas)\b/)) slip('person', `Talking about ${miner.name}: «está», not «estoy»`);
        else if (has(/\b(es|son)\b/)) slip('serestar', 'How someone is right now: «está» (estar), not «es» (ser)', true);
        else if (has(/\b(tiene|tengo)\b/)) slip('verb', 'An adjective goes with «estar»: «está …»', true);
        else slip('verb', 'Make it a sentence: «Está …»', true);
        const end = adjEnd(/\b(?:cansad|perdid|asustad|dormid|content|agotad|fatigad|deprimid)([oa])s?\b/);
        if (end && (end === 'a') !== (g === 'f')) slip('gender', `${miner.name} is ${g === 'f' ? 'a woman: «-a»' : 'a man: «-o»'} (${modelOf(miner.state, g, l)})`);
      }
      if (g === 'm' && has(/\bella\b/)) slip('gender', `${miner.name}: «él», not «ella»`);
      if (g === 'f' && /(^|[^a-záéíóúñü])él([^a-záéíóúñü]|$)/.test(raw)) slip('gender', `${miner.name}: «ella», not «él»`);     // (\b doesn't see «é» as a letter)
    } else if (l === 'pt') {
      const com = TENER[state] || (state === 'scared' && !has(/\bassustad[oa]s?\b/));
      if (state === 'headache') {
        if (has(/\bdor de cabeca\b/)) {
          if (has(/\b(estou com|tenho)\b/)) slip('person', `Talking about ${miner.name}: «está com dor de cabeça»`);
          else if (!has(/\b(esta|ta) com\b|\btem\b/)) { if (has(/\b(esta|ta)\b/)) slip('prep', 'Add «com»: «está com dor de cabeça»'); else slip('verb', 'Say it whole: «Está com dor de cabeça»', true); }
        } else if (has(/\bdoi\b/)) { if (!has(/\ba cabeca\b/)) slip('article', '«dói a cabeça»'); }
        else slip('verb', 'Say what’s wrong: «Está com dor de cabeça»', true);
      } else if (com) {
        if (has(/\b(esta|ta) com\b|\btem\b/)) { /* good */ }
        else if (has(/\b(estou com|tenho|estou)\b/)) slip('person', `Talking about ${miner.name}: «está com…», not «estou»`);
        else if (has(/\b(esta|ta)\b/)) slip('prep', `Add «com»: «está com ${state === 'cold' ? 'frio' : state === 'hungry' ? 'fome' : state === 'thirsty' ? 'sede' : state === 'sleepy' ? 'sono' : 'medo'}»`);
        else if (has(/\be\b/)) slip('serestar', 'Right now: «está com…» (or «tem…»), not «é»', true);
        else slip('verb', 'Make it a sentence: «Está com …»', true);
      } else {
        if (has(/\b(esta|ta)\b/)) { /* good */ } else if (has(/\b(estou|estas)\b/)) slip('person', `Talking about ${miner.name}: «está», not «estou»`);
        else if (has(/\be\b/)) slip('serestar', 'How someone is right now: «está» (estar), not «é» (ser)', true);
        else slip('verb', 'Make it a sentence: «Está …»', true);
        const end = adjEnd(/\b(?:cansad|perdid|assustad|exaust)([oa])s?\b/);
        if (end && (end === 'a') !== (g === 'f')) slip('gender', `${miner.name} is ${g === 'f' ? 'a woman: «-a»' : 'a man: «-o»'} (${modelOf(miner.state, g, l)})`);
      }
      if (/\besta\b/.test(raw) && has(/\besta\b/)) soft('accent', 'Accent: «está»');
      if (g === 'm' && has(/\bela\b/)) slip('gender', `${miner.name}: «ele», not «ela»`);
      if (g === 'f' && has(/\bele\b/)) slip('gender', `${miner.name}: «ela», not «ele»`);
    } else if (l === 'de') {
      const P = g === 'f' ? { nom: 'sie', dat: 'ihr' } : { nom: 'er', dat: 'ihm' }, W = g === 'f' ? { nom: 'er', dat: 'ihm' } : { nom: 'sie', dat: 'ihr' };
      if (state === 'cold') {
        if (has(/\b(ihm|ihr|dem|der) (ist|wird) kalt\b|\bist (ihm|ihr) kalt\b/)) { if (has(new RegExp(`\\b${W.dat}\\b`)) && !has(new RegExp(`\\b${P.dat}\\b`))) slip('gender', `${miner.name}: «${cap(P.dat)} ist kalt»`); }
        else if (has(/\b(er|sie) friert\b/)) { if (has(new RegExp(`\\b${W.nom} friert\\b`))) slip('gender', `${miner.name}: «${cap(P.nom)} friert»`); }
        else if (has(/\bmir ist kalt\b/)) slip('person', `Talking about ${miner.name}: «${cap(P.dat)} ist kalt»`);
        else if (has(/\b(er|sie|ich) (ist|bin) kalt\b/)) slip('case', `Who’s cold takes the dative: «${cap(P.dat)} ist kalt» («${cap(P.nom)} ist kalt» means cold to the touch, or unfriendly)`, true);
        else if (has(/\bist kalt\b/)) slip('pronoun', `Whose? «${cap(P.dat)} ist kalt»`);
        else slip('verb', `Make it a sentence: «${cap(P.dat)} ist kalt»`, true);
      } else if (state === 'headache') {
        if (has(/\b(ihm|ihr|sein|seinem|ihrem) .*\bkopf\b.*\bweh\b|\btut (ihm|ihr) der kopf weh\b|\b(ihm|ihr) tut der kopf weh\b|\bsein kopf tut weh\b|\bihr kopf tut weh\b/)) {
          if (has(new RegExp(`\\b${W.dat}\\b`)) && !has(new RegExp(`\\b${P.dat}\\b`)) && !has(/\b(sein|ihr) kopf\b/)) slip('gender', `${miner.name}: «${cap(P.dat)} tut der Kopf weh»`);
          if (has(/\btut kopf weh\b/)) slip('article', '«der Kopf»');
        } else if (has(/\bkopfschmerzen\b|\bkopfweh\b/)) { if (has(/\bhabe\b/)) slip('person', `Talking about ${miner.name}: «${cap(P.nom)} hat Kopfschmerzen»`); else if (!has(/\bhat\b/)) slip('verb', `«${cap(P.nom)} hat Kopfschmerzen»`, true); }
        else if (has(/\bmir tut\b/)) slip('person', `Talking about ${miner.name}: «${cap(P.dat)} tut der Kopf weh»`);
        else if (has(/\bder kopf tut weh\b/)) soft('whose', `Whose head? «${cap(P.dat)} tut der Kopf weh»`);
        else slip('verb', `Say what’s wrong: «${cap(P.dat)} tut der Kopf weh»`, true);
      } else if (state === 'hungry' || state === 'thirsty' || (state === 'scared' && !has(/\bangstlich|aengstlich|furchtet|fuerchtet\b/))) {
        if (has(/\bhat (hunger|durst|angst)\b|\b(hunger|durst|angst) hat\b/)) { const raw0 = String(text); if (/\b(hunger|durst|angst)\b/.test(raw0)) soft('capital', 'German nouns start with a capital: «Hunger», «Angst»'); }
        else if (has(/\bist (hungrig|durstig)\b/)) { /* good too */ }
        else if (has(/\b(habe|hast|haben)\b/)) slip('person', `Talking about ${miner.name}: «${cap(P.nom)} hat …»`);
        else if (has(/\bist (hunger|durst|angst)\b/)) slip('haben', `It’s a noun: «${cap(P.nom)} hat ${state === 'hungry' ? 'Hunger' : state === 'thirsty' ? 'Durst' : 'Angst'}»`, true);
        else slip('verb', `Make it a sentence: «${cap(P.nom)} hat …»`, true);
      } else if (state === 'lost') {
        if (!has(/\bhat sich (verlaufen|verirrt)\b|\bist (verloren|verirrt)\b/)) { if (has(/\bhabe mich\b|\bbin\b/)) slip('person', `Talking about ${miner.name}: «${cap(P.nom)} hat sich verlaufen»`); else slip('verb', `«${cap(P.nom)} hat sich verlaufen»`, true); }
      } else {
        if (has(/\bist\b/)) { /* good */ } else if (has(/\b(bin|bist)\b/)) slip('person', `Talking about ${miner.name}: «${cap(P.nom)} ist …»`);
        else if (has(/\bhat\b/)) slip('sein', `An adjective goes with «sein»: «${cap(P.nom)} ist …»`, true);
        else slip('verb', `Make it a sentence: «${cap(P.nom)} ist …»`, true);
      }
      if (state !== 'cold' && state !== 'headache' && has(new RegExp(`\\b${W.nom}\\b`)) && !has(new RegExp(`\\b${P.nom}\\b`))) slip('gender', `${miner.name}: «${cap(P.nom)}», not «${cap(W.nom)}»`);
    }
    return finish(out);
  }
  function finish(out) {
    let n = 0; for (const s of out.slips) n += s.major ? 2 : 1;
    // (an accent is a tip, never a grade: P6a, accents.js)
    const sp = typeof ACCENTS !== 'undefined' ? ACCENTS.split(out.soft) : { soft: out.soft, tip: '' };
    out.letter = n === 0 ? (sp.soft.length ? 'A' : 'S') : n === 1 ? 'B' : n === 2 ? 'C' : 'D';
    out.reason = out.letter === 'S' ? 'Perfect sentence!' + (sp.tip ? ' · ' + sp.tip : '') : out.letter === 'A' ? sp.soft[0].why : out.slips[0].why;
    out.tip = sp.tip;
    return out;
  }
  Object.assign(C, { CAVE_LINES: CL, GOT, MINER_LINES, MODEL, modelOf, gradeHelp: grade, detectState: detect, registerWords, T, FRAME });
})();

// ================================================================ the game side: Cande, the miners, Pío, the mine's mouth
(() => {
  const C = CAVES, SPOT = C.SPOT, V = (x, y, z) => new THREE.Vector3(x, y, z);
  let G = null, B = null, synced = '', propsOn = [], nudgeCool = 0, curCool = 20;
  const S = () => { const s = G.state; s.caves = s.caves || {}; s.caves.helped = s.caves.helped || {}; return s.caves; };
  const F = () => G.state.flags;
  const name = () => G.state.mimoName || 'Mimo';
  const lang = () => G.state.lang || 'es';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const ex = w => (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const VERBS = ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing'];
  const person = id => (B ? B.people.find(p => p.id === id) || null : null);
  const lock = on => { G.sim.lock = on ? 1 : 0; };
  const helpedCount = () => C.MINERS.filter(m => S().helped[m.id]).length;
  const cjk = l => l === 'zh' || l === 'ja';
  const plainOf = src => (cjk(lang()) && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(src, { lang: lang() }) : src);
  const idSeed = id => [...String(id || 'x')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  // what Cande's demonstration shows (DESIGN.md 16: highlighted and glossed small in her sentence, no English under it)
  const DEMO_MARK = { es: [['cansado', 'tired'], ['frío', 'cold']], pt: [['cansado', 'tired'], ['com frio', 'cold']], de: [['müde', 'tired'], ['kalt', 'cold']],
    zh: [['[累|lèi]', 'tired'], ['[冷|lěng]', 'cold']], ja: [['[疲|つか]れて', 'tired'], ['[寒|さむ]がって', 'cold']] };
  // the Hush eats most of a hushed line's words; the *starred* ones survive (as story.js does it)
  function blank(s, seed) {
    if (!s) return s;
    const R = rng(seed);
    return s.split(' ').map(w => {
      if (/^\*.*\*[.,…!?¿¡]*$/.test(w) || /^[¿¡]?\*.*\*[.,…!?]*$/.test(w)) return w.replace(/\*/g, '');
      if (/^[….]+$/.test(w)) return w;
      const m = w.match(/^(.*?)([.,…!?;:]*)$/);
      return R() < 0.55 ? '▬' + m[2] : w;
    }).join(' ');
  }
  // someone says a line from a T table, through the weave; o.hush: gray, slow, words eaten; o.full: all in the language
  // (DESIGN.md 16: every line is mixed by story.js; a hushed one keeps the words the Hush left in the language, glossed small)
  function sayT(p, T, o = {}) {
    if (!p || !T) return Promise.resolve();
    const l = lang();
    if (o.hush && STORY.sayHushed) return STORY.sayHushed(p, T[l] || '', T.en || '', { seed: idSeed(p.id), key: 'hushed.' + p.id });
    let text = T[l] || '', en = T.en || '';
    if (o.hush) { const seed = idSeed(p.id); text = cjk(l) ? text : blank(text, seed); en = blank(en, seed + 1); }
    p.lines = { en, [l]: text };
    const pr = STORY.sayInline(p, !!o.full);
    const L = STORY.line;
    if (L && o.hush) { L.hushed = true; L.say = ''; }
    return pr;
  }
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${name()} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  // Mimo sings: notes float up, its voice (and the crystals near it listen)
  async function mimoSing(sec = 2.2) {
    const M = G.sim.mimo;
    G.sim.mimoSay('♪ ' + (LEX.taught('v.sing') ? LEX.form('v.sing') : 'la la') + ' ♪', sec);
    Sound.play('sing'); M.happy = sec; M.glow = 1;
    for (let t = 0; t < sec; t += 0.22) { if (B) B.note(M.x + (Math.random() - 0.5) * 0.5, M.ry + 1.1, M.z + (Math.random() - 0.5) * 0.5, Math.random() < 0.5 ? '#7ff7ea' : '#fff3a0'); await wait(0.22); }
  }
  async function untilNear(spot, r, max) { const M = G.sim.mimo; for (let t = 0; t < max && Math.hypot(M.x - spot.x, M.z - spot.z) > r; t += 0.1) await wait(0.1); }

  // ---------------------------------------------------------------- the help: something Mimo carries over (a prop), handed to a miner
  const FROM = { coffee: 'canteen', blanket: 'crates', soup: 'canteen', lamp: 'lampPost', medicine: 'tent' };
  const HELP_OF = { tired: 'coffee', cold: 'blanket', hungry: 'soup', scared: 'lamp', headache: 'medicine', sad: 'song' };
  function makeProp(help) {
    const k = C.Kit(), GEO = C.GEO, g = new THREE.Group();
    if (help === 'coffee') k.add(GEO.cyl, 0, 0.08, 0, 0.07, 0.15, 0.07, '#f4efe2', { ink: 0.01 }).add(GEO.cyl, 0, 0.155, 0, 0.06, 0.01, 0.06, '#6b4226', { ink: 0 });
    else if (help === 'blanket') k.box(0, 0, 0, 0.62, 0.16, 0.42, '#c45a3c', { ink: 0.012 }).box(0, 0.001, 0, 0.64, 0.05, 0.1, '#e0a43c', { ink: 0 });
    else if (help === 'soup') k.add(GEO.half, 0, 0.12, 0, 0.13, -0.1, 0.13, '#f3ead6', { ink: 0.01 }).add(GEO.cyl, 0, 0.11, 0, 0.115, 0.01, 0.115, '#e0743c', { ink: 0 });
    else if (help === 'lamp') { k.box(0, 0.13, 0, 0.16, 0.22, 0.16, '#3d3a3a', { ink: 0.01 }).box(0, 0.13, 0, 0.12, 0.16, 0.17, '#ffe7a8', { ink: 0 }); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd27a', transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(1.1); gl.position.y = 0.13; g.add(gl); }
    else if (help === 'medicine') k.add(GEO.cyl, 0, 0.08, 0, 0.045, 0.14, 0.045, '#8a4a3a', { ink: 0.008 }).add(GEO.cyl, 0, 0.165, 0, 0.035, 0.035, 0.035, '#f4efe2', { ink: 0 });
    k.build(g, { shadow: false });
    G.w3d.scene.add(g);
    return g;
  }
  // where a prop sits on a miner (in their own frame: x right, y up, z forward)
  const ON = { coffee: [0.08, 0.98, 0.42], blanket: [0, 1.34, -0.02], soup: [0, 0.98, 0.42], lamp: [-0.36, 0.82, 0.18], medicine: [0.08, 0.98, 0.38] };
  function placeProps() {
    for (const o of propsOn) {
      if (o.follow === 'mimo') { const M = G.sim.mimo; o.g.position.set(M.x, M.ry + 1.05 + Math.sin(performance.now() / 160) * 0.03, M.z); o.g.rotation.y = M.yaw; continue; }
      const p = o.follow, off = ON[o.help] || [0, 1, 0.4], c = Math.cos(p.yaw), s = Math.sin(p.yaw);
      o.g.position.set(p.x + off[0] * c + off[2] * s, p.y + off[1] + (p.seat ? -0.12 : 0), p.z - off[0] * s + off[2] * c);
      o.g.rotation.y = p.yaw;
      if (o.help === 'blanket') o.g.scale.set(1.25, 1, 1.25);
    }
  }
  async function deliver(p, help, o = {}) {
    if (help === 'song') return singTo(p, o);
    const src = SPOT[FROM[help]] || SPOT.crates, M = G.sim.mimo;
    G.sim.mimoGo(src, src);
    await untilNear(src, 1.8, 4);
    await wait(0.25);
    const prop = { g: makeProp(help), help, follow: 'mimo' }; propsOn.push(prop);
    Sound.play('pip'); G.w3d.fx.sparkle(M.x, M.ry + 1.1, M.z, 8);
    const to = { x: p.x + Math.sin(p.yaw) * 1.15, z: p.z + Math.cos(p.yaw) * 1.15 };
    G.sim.mimoGo(to, p);
    await untilNear(to, 1.4, 4);
    await wait(0.2);
    if (o.wrong) {                          // they shake their head; it drops and it's gone
      prop.follow = p; placeProps();
      const y0 = p.yaw;
      await tween(0.6, u => { p.yaw = y0 + Math.sin(u * Math.PI * 4) * 0.35; });
      await tween(0.35, u => { prop.g.position.y -= 0.05; prop.g.scale.setScalar(1 - u); });
      G.w3d.scene.remove(prop.g); propsOn.splice(propsOn.indexOf(prop), 1);
      G.sim.mimoGo(null, null);
      return;
    }
    prop.follow = p; Sound.play('review');
    G.sim.mimoGo(null, null);
  }
  // a song for someone sad: Mimo sings if it can; if not yet, Pío sings from his cage (the notes fly over)
  async function singTo(p) {
    const M = G.sim.mimo;
    if (LEX.taught('v.sing')) {
      G.sim.mimoGo({ x: p.x + Math.sin(p.yaw) * 1.2, z: p.z + Math.cos(p.yaw) * 1.2 }, p);
      await untilNear({ x: p.x, z: p.z }, 1.9, 4);
      LEX.attempt('v.sing', { ok: true, hints: 0, ms: 3000, mode: 'command' });
      await mimoSing(2.6);
      G.sim.mimoGo(null, null);
    } else {
      B.objects.bird.sing = 3; Sound.play('canary');
      for (let t = 0; t < 2.6; t += 0.2) { B.note(lerp(SPOT.cage.x, p.x, t / 2.6), C.CAMP.y + 2.2 + Math.sin(t * 3) * 0.3, lerp(SPOT.cage.z, p.z, t / 2.6), '#fff3a0'); await wait(0.2); }
    }
    M.happy = 1;
  }
  // a miner gets their words (and colors) back
  function restore(p, instant) {
    p.hushed = false; if (p.pose !== 'happy' || p.gray) p.set('happy', false);
    if (!instant) { G.w3d.fx.sparkle(p.x, p.y + 1.3, p.z, 22, ['#ffd166', '#fff3a0', '#7ff7ea']); Sound.play('learned'); }
  }

  // ---------------------------------------------------------------- the scenes
  async function arriveCamp() {
    const f = F(); f.camp = true; f.quarry = true; G.save();
    await UI.chapter('The Miners’ Camp', 'The Quarry Caves · Chapter 1 · The third bell');
    if (!f.cande) await STORY.you('A whole camp, up in the {w.mountain:pl}… and it’s so quiet. Everyone is gray. Who’s in charge here?');
  }
  async function candeScene() {
    const c = person('cande'); if (!c) return;
    lock(true);
    const cy = c.y, shotC = { pos: V(c.x + 4.4, cy + 2.6, c.z + 3.2), look: V(c.x, cy + 1.3, c.z) };
    G.cam.override = shotC;
    await sayT(c, C.CAVE_LINES['c.hello']);
    await STORY.you('{w.hello}! We’re ringing the eight bells. Two ring again already: in Molinar, and on the Mirror Lake. Is there a {w.bell} up here?');
    G.cam.override = { pos: V(C.MOUTH.x - 5, cy + 4.6, C.MOUTH.z + 13), look: V(C.MOUTH.x, cy + 2.2, C.MOUTH.z), dur: 1.2 };
    await sayT(c, C.CAVE_LINES['c.hush']);
    await sayT(c, C.CAVE_LINES['c.gong']);
    G.cam.override = Object.assign({ dur: 0.9 }, shotC);
    await STORY.you('Then {mimo} and I will help. What can we do?');
    await sayT(c, C.CAVE_LINES['c.ask']);
    // (DESIGN.md 16) she shows you how, on Paco and Rocío: whole in the language, the English under it
    const pa = person('paco'), ro = person('rocio');
    if (pa && ro) { const mx = (pa.x + ro.x) / 2, mz = (pa.z + ro.z) / 2; G.cam.override = { pos: V(mx + 4.2, cy + 2.6, mz + 4.6), look: V(mx, cy + 1.1, mz), dur: 0.9 }; }
    await (STORY.demoLine ? STORY.demoLine(c, C.CAVE_LINES['c.demo'], DEMO_MARK) : sayT(c, C.CAVE_LINES['c.demo']));
    G.cam.override = { pos: V(SPOT.cage.x + 2.8, cy + 2.4, SPOT.cage.z + 2.6), look: V(SPOT.cage.x, cy + 2.0, SPOT.cage.z), dur: 0.8 };
    if (B) B.objects.bird.sing = 3; Sound.play('canary');
    await sayT(c, C.CAVE_LINES['c.pio']);
    G.cam.override = null; lock(false);
    F().cande = true; G.save();
  }
  // Report back to Cande after the gong (DESIGN.md 16): the third bell, Noa, and where the next one is (the Bloom Gardens)
  async function reportGong() {
    const c = person('cande'), f = F(); if (!c) return;
    lock(true);
    const Y = G.sim.you, cy = c.y;
    G.cam.override = { pos: V(c.x + (Y.x - c.x) * 0.5 + 3.0, cy + 2.4, c.z + (Y.z - c.z) * 0.5 + 3.2), look: V((c.x + Y.x) / 2, cy + 1.2, (c.z + Y.z) / 2), dur: 0.8 };
    await STORY.you('Cande! The {w.gong} is ringing again, all the way down at the bottom!');
    await sayT(c, C.CAVE_LINES['c.third']);
    f.candeThird = true; G.save();
    G.cam.override = { pos: V(c.x + 3, cy + 6, c.z + 7), look: V(c.x + 60, cy - 4, c.z + 120), dur: 1.4 };     // (south, down the quarry road: the warm valley's that way)
    await wait(0.8);
    await sayT(c, C.CAVE_LINES['c.next']);
    G.cam.override = null; lock(false);
    await STORY.you('The Bloom Gardens. Let’s go, {mimo}!');
    G.save();
  }
  async function candeAgain() {
    const c = person('cande'), f = F();
    if (f.caveFree) { if (!f.candeThird) return reportGong(); return sayT(c, C.CAVE_LINES['c.next']); }
    if (f.mineOpen) return sayT(c, C.CAVE_LINES['c.mine']);
    if (helpedCount() >= C.MINERS.length) return sayT(c, LEX.taught('v.sing') ? C.CAVE_LINES['c.pioTeach'] : C.CAVE_LINES['c.pio']);
    return sayT(c, C.CAVE_LINES['c.again']);
  }
  async function minerTalk(p) {
    const f = F(), L = C.MINER_LINES[p.id];
    if (S().helped[p.id] || (p.id === 'chepe')) return sayT(p, L.chat || L.back);
    await sayT(p, L.hushed, { hush: true, full: true });     // (the words the Hush left, in the language with the English under: «Cansado… tired»)
    if (!f.cande) { G.sim.mimo.scared = 2.5; STORY.think('{mimo} hides behind you. The miner is gray and stiff. Maybe whoever runs this camp knows what happened.', 5); return; }
    return helpScene(p);
  }
  async function helpScene(p) {
    const d = p.def, l = lang(), en = C.MODEL[d.state].en(d.g), he = d.g === 'f' ? 'she' : 'he';
    const fr = C.FRAME[l] || C.FRAME.es, frame = cjk(l) && typeof CJK !== 'undefined' ? CJK.plain(fr, { lang: l, cap: false }) : fr;
    const r = await UI.command({ name: name(), icon: 'miner', title: `How is ${d.name}? Tell Cande, and she’ll know what ${he} needs.`, verbs: [], placeholder: `say how ${he} is…`,
      hint: `Like Cande showed you: ${frame} (? shows an example)`, model: plainOf(C.modelOf(d.state, d.g, l)), modelEn: en });
    if (!r || r.cancelled) return;
    const g = C.gradeHelp(r.text, l, d), cande = person('cande');
    if (!g.state) { Sound.play('wrong'); await sayT(cande, C.CAVE_LINES['c.huh']); STORY.think(`Look at ${d.name} again. Tired? Cold? Hungry? Scared? Hurting? Sad? (Type ? for an example.)`, 6); return; }
    if (g.state !== d.state) {
      const got = C.GOT[g.state];
      lock(true);
      if (got) { await sayT(cande, got(d.g)); await deliver(p, HELP_OF[g.state], { wrong: true }); } else await sayT(cande, C.CAVE_LINES['c.huh']);
      lock(false);
      STORY.think(`${d.name} shakes ${d.g === 'f' ? 'her' : 'his'} head. That’s not it… Look again: what’s wrong?`, 5);
      return;
    }
    UI.toast(`${g.letter} · ${g.reason}`);
    Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    lock(true);
    await sayT(cande, C.GOT[d.state](d.g));       // (Cande says it back the right way)
    { const Y = G.sim.you, dx = p.x - Y.x, dz = p.z - Y.z, dl = Math.hypot(dx, dz) || 1, sx = -dz / dl, sz = dx / dl;     // (a side view of the miner)
      G.cam.override = { pos: V(p.x - dx / dl * 3.2 + sx * 3.6, p.y + 2.3, p.z - dz / dl * 3.2 + sz * 3.6), look: V(p.x, p.y + 1.0, p.z), dur: 0.9 }; }
    await deliver(p, d.help);
    S().helped[p.id] = g.letter;
    restore(p);
    await wait(0.5);
    await sayT(p, C.MINER_LINES[p.id].back, { full: true });
    G.cam.override = null;
    lock(false);
    G.save();
    if (helpedCount() >= C.MINERS.length && !F().allHelped) { F().allHelped = true; G.save(); await allHelped(); }
  }
  async function allHelped() {
    const c = person('cande'); if (!c) return;
    lock(true);
    G.cam.override = { pos: V(C.CAMP.x - 2, C.CAMP.y + 9, C.CAMP.z + 16), look: V(C.CAMP.x, C.CAMP.y + 1, C.CAMP.z - 2), dur: 1.0 };
    Sound.play('fanfare');
    await wait(1.2);
    await sayT(c, C.CAVE_LINES['c.allHelped']);
    G.cam.override = null; lock(false);
    if (!LEX.taught('v.sing')) await STORY.you('The mine… Cande said only a voice can open it. And Pío is still singing on the porch.');
    else await STORY.you('A voice opens the mine… {mimo} can sing! Let’s try at the mine’s mouth.');
  }
  // Pío: Mimo watches him and learns «canta» (13.1: verbs learned by watching)
  async function pioScene() {
    S().pioTried = true;
    if (B) B.objects.bird.sing = 4; Sound.play('canary');
    // (DESIGN.md 16: heard first) Cande calls to him while he sings, whole in the language; then Mimo asks what he's doing
    const c = person('cande');
    if (c && STORY.youWord) {
      lock(true);
      G.cam.override = { pos: V(SPOT.cage.x + 2.8, C.CAMP.y + 2.4, SPOT.cage.z + 2.6), look: V(SPOT.cage.x, C.CAMP.y + 2.0, SPOT.cage.z), dur: 0.8 };
      await (STORY.demoLine ? STORY.demoLine(c, C.CAVE_LINES['c.pioDemo'], ['v.sing']) : sayT(c, C.CAVE_LINES['c.pioDemo']));
      if (B) B.objects.bird.sing = 3; Sound.play('canary');
      await STORY.youWord('«', STORY.wordPart('v.sing'), '»… Cande says it to Pío, and he sings!');
      G.cam.override = null; lock(false);
    }
    const r = await STORY.teachWord('v.sing', { spot: { x: SPOT.watch.x, z: SPOT.watch.z }, look: { x: SPOT.cage.x, z: SPOT.cage.z }, title: `${name()} is watching the canary. What is he doing?` });
    if (r && r.ok) {
      const c = person('cande');
      if (c) await sayT(c, C.CAVE_LINES['c.pioTeach']);
      await mimoSing(1.8);
    }
    G.save();
  }
  async function pioLook() {
    if (F().cande && !LEX.taught('v.sing')) return pioScene();
    if (B) B.objects.bird.sing = 2.5; Sound.play('canary');
    STORY.think(LEX.taught('v.sing') ? 'Pío sings, and {mimo} sings along: «' + LEX.form('v.sing') + '!»' : 'A little yellow canary, singing its heart out. The only song in the whole camp.', 4);
    if (LEX.taught('v.sing')) await mimoSing(1.4);
  }
  // the mine's mouth: tell Mimo what to do («¡Canta!»); once it's open, go in (mine.js)
  async function mouthScene() {
    const f = F(), M = G.sim.mimo, st = S();
    if (f.mineOpen) {
      if (typeof MINE !== 'undefined' && MINE.enter) return MINE.enter();
      STORY.think('The tunnel goes down into the dark… (the mine is coming soon!)', 4); return;
    }
    if (helpedCount() < C.MINERS.length) { const c = person('cande'); if (c) await sayT(c, C.CAVE_LINES['c.first']); return; }
    let verb = st.quickSing ? 'v.sing' : null, ms = 3000;
    if (!verb) {
      const r = await UI.command({ name: name(), icon: 'crystal', title: `Gray stone seals the mine’s mouth, and the crystals around it are dark. What should ${name()} do?`, verbs: VERBS, answer: 'v.sing' });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); M.tiltT = 1.4; STORY.think(LEX.taught('v.sing') ? '{mimo} tilts its head. What did Pío teach it?' : '{mimo} looks at the dark crystals… and back at Pío, singing on the porch.', 5); return; }
      verb = r.verb; ms = r.ms;
    }
    const at = { x: C.MOUTH.x, z: C.MOUTH.z + 2.2 };
    if (verb !== 'v.sing') {
      if (LEX.taught(verb)) LEX.attempt(verb, { ok: true, hints: 0, ms, mode: 'command' });
      G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
      G.sim.mimoGo(at, C.MOUTH); await wait(0.9);
      if (verb === 'v.hit') { Sound.play('hit'); M.sad = 1.2; STORY.think('{mimo} bonks the gray stone. Ouch! Not even a crack.', 4); }
      else if (verb === 'v.push') { Sound.play('land', 6); STORY.think('{mimo} pushes with all its might. The stone doesn’t budge.', 4); }
      else if (verb === 'v.jump') { M.hop = { t: 0 }; Sound.play('jump'); STORY.think('{mimo} hops up and down. The crystals stay dark.', 4); }
      else if (verb === 'v.throw') { Sound.play('whiff'); STORY.think('{mimo} throws a pebble at the stone. Plink. Nothing.', 4); }
      else if (verb === 'v.swim') STORY.think('{mimo} looks around for water. There isn’t any.', 4);
      else STORY.think('{mimo} tries, but the stone doesn’t care.', 4);
      G.sim.mimoGo(null, null);
      return;
    }
    learnUse('v.sing', ms); st.quickSing = true;
    lock(true);
    const y = C.CAMP.y;
    G.cam.override = { pos: V(C.MOUTH.x + 5.5, y + 3.4, C.MOUTH.z + 9.5), look: V(C.MOUTH.x, y + 1.8, C.MOUTH.z), dur: 0.9 };
    G.sim.mimoGo(at, C.MOUTH);
    await untilNear(at, 1.2, 3);
    const p1 = mimoSing(2.6);
    await wait(0.6);
    if (B) B.setCrystals(true);
    Sound.play('chime');
    await p1;
    if (B) { Sound.play('crack'); await B.openSeal(tween, wait); G.w3d.fx.puff(C.MOUTH.x, y + 1.2, C.MOUTH.z + 0.6, 22, 0.45, '#b9b7c6'); Sound.play('poof'); }
    f.mineOpen = true; G.save();
    await wait(0.6);
    G.cam.override = null; lock(false); G.sim.mimoGo(null, null);
    await STORY.you('The {w.crystal:pl} are singing back! The way into the mine is open.');
  }

  // ---------------------------------------------------------------- what you can press E on (outdoors, around the camp)
  function interactables() {
    if (!G || !B) return [];
    const f = F(), list = [], Y = G.sim.you;
    if (Math.hypot(Y.x - C.CAMP.x, Y.z - C.CAMP.z) > 34) return list;
    const c = person('cande');
    const rep = typeof QUESTS !== 'undefined' && QUESTS.reportDue && QUESTS.reportDue('cande');      // (DESIGN.md 16: after the gong, report back)
    if (c) list.push({ x: c.x, z: c.z, r: 2.7, label: rep ? 'Report' : 'Talk', run: f.cande ? candeAgain : candeScene });
    for (const p of B.people) { if (!p.miner || p.hidden) continue; list.push({ x: p.x, z: p.z, r: 2.3, label: !S().helped[p.id] && f.cande && p.id !== 'chepe' ? 'Help' : 'Talk', run: () => minerTalk(p) }); }
    list.push({ x: SPOT.cage.x + 0.7, z: SPOT.cage.z + 0.9, r: 1.6, label: 'Look', run: pioLook });
    const lbl = f.mineOpen ? 'Go in' : S().quickSing ? `«${ex(LEX.form('v.sing'))}»` : f.cande ? `Tell ${name()}` : 'Look';
    list.push({ x: SPOT.mouthFront.x, z: SPOT.mouthFront.z, r: 3.0, label: lbl,
      run: f.cande ? mouthScene : async () => STORY.think('Gray stone seals the mine’s mouth. Dark crystals stud the rock all around it.', 4) });
    list.push({ x: C.PIT.x, z: C.PIT.z, r: 2.2, label: 'Look', run: async () => STORY.think(f.caveFree ? 'The fire crackles. Somebody’s humming.' : 'A cold fire pit. Nobody has lit it in weeks.', 4) });
    return list;
  }
  // where the compass points: the next thing to do here
  function target() {
    const f = F();
    if (!f.camp) return wayIn();
    if (!f.cande) return person('cande');
    const next = B && B.people.filter(p => p.miner && !p.hidden && p.id !== 'chepe' && !S().helped[p.id]);
    if (next && next.length) { const Y = G.sim.you; return next.reduce((b, p) => (!b || Math.hypot(p.x - Y.x, p.z - Y.z) < Math.hypot(b.x - Y.x, b.z - Y.z) ? p : b), null); }
    if (!LEX.taught('v.sing')) return SPOT.cage;
    return SPOT.mouthFront;
  }
  // the way here: out of Alba's east gate, to the field, up the quarry road
  function wayIn() {
    const Y = G.sim.you, R = C.ROAD;
    if (C.roadDist(Y.x, Y.z) > 9) return Y.x < 34 && Math.abs(Y.z + 150) < 46 ? (WORLD.L.eastGate || { x: 34, z: -150 }) : { x: R[0][0], z: R[0][1] };
    let k = 0, bd = 1e9; R.forEach(([x, z], i) => { const d = Math.hypot(x - Y.x, z - Y.z); if (d < bd) { bd = d; k = i; } });
    const p = R[Math.min(R.length - 1, k + 8)];
    return { x: p[0], z: p[1] };
  }

  // ---------------------------------------------------------------- every frame (story hooks): the gate, Pío, words to teach
  function tick(dt, Y) {
    if (!G || !B) return;
    const f = F();
    nudgeCool -= dt; curCool -= dt;
    // the mist across the road: shut until the lake's bell
    if (!C.lakeFree(G.state) && nudgeCool <= 0 && Math.hypot(Y.x - C.GATE.x, Y.z - C.GATE.z) < 10) {
      nudgeCool = 25; G.sim.mimo.scared = 2.5;
      STORY.think('A thick gray mist hangs across the road. Everything sounds muffled, and the rocks have fallen in… The Hush is too strong here. Maybe once another bell rings, it will thin out.', 6);
    }
    // Pío catches Mimo's eye (once, after Cande, if it doesn't know «canta» yet)
    if (f.cande && !LEX.taught('v.sing') && !S().pioTried && Math.hypot(Y.x - SPOT.cage.x, Y.z - SPOT.cage.z) < 8) { STORY.run(pioScene); return; }
    // a word Mimo is curious about (seen, not taught yet): the crystals, the canary
    if (curCool <= 0 && Y.speed < 6 && LEX.mayIntroduce && LEX.mayIntroduce()) {
      curCool = 4;
      for (const [id, at, need] of [['w.crystal', { x: C.MOUTH.x - 3.6, z: C.MOUTH.z + 1.6 }, f.mineOpen], ['w.canary', SPOT.cage, f.cande && LEX.taught('v.sing')], ['w.gong', null, false]]) {
        if (!need || !at || LEX.taught(id) || !LEX.seen(id) || Math.hypot(Y.x - at.x, Y.z - at.z) > 7) continue;
        curCool = 60; STORY.run(() => STORY.teachWord(id, { spot: { x: at.x + (Y.x - at.x) * 0.4, z: at.z + (Y.z - at.z) * 0.4 }, look: at })); return;
      }
    }
  }
  // the look of things follows the save: the gate, the mouth, the crystals, the camp's lights, the miners, Chepe
  function sync() {
    if (!G || !B) return;
    const f = F(), st = S(), free = C.lakeFree(G.state);
    const key = [free, !!f.mineOpen, !!f.caveFree, Object.keys(st.helped).sort().join(','), !!st.chepe].join('|');
    if (key === synced) return;
    const first = !synced;
    synced = key;
    B.setGate(free, first || !B.gateOpenOnce); B.gateOpenOnce = true;
    if (free) liftPatch('cavesGate', first);
    if (!B.sealOpen) B.setSeal(!!f.mineOpen);
    B.setCrystals(!!f.mineOpen, first);
    B.setCamp(!!f.caveFree, first);
    if (f.caveFree) liftPatch('caves', first);
    for (const p of B.people) {
      if (!p.miner) continue;
      if (p.id === 'chepe') { p.hidden = !st.chepe; p.root.visible = !!st.chepe; continue; }
      if (st.helped[p.id]) { if (p.hushed || p.gray) restore(p, true); if (!propsOn.some(o => o.follow === p) && p.def.help !== 'song') propsOn.push({ g: makeProp(p.def.help), help: p.def.help, follow: p }); }
      else if (!p.hushed) { p.hushed = true; p.set(p.def.state, true); }
    }
  }
  function liftPatch(tag, instant) {
    const i = WORLD.L.hush.findIndex(h => h[tag]);
    if (i >= 0 && WORLD.L.hush[i].a > 0.001) G.w3d.liftHush(i, instant);
  }

  // ---------------------------------------------------------------- the module's hooks
  function init(game) {
    G = game; B = game.caves || null;
    C.registerWords();
    if (B) {     // (the build's per-frame update gets the sync and the props)
      const up0 = B.update;
      B.update = (dt, t, you) => { sync(); up0(dt, t, you); placeProps(); };
    }
    // the story's hooks (story.js's appended section): our things join the E race, and our per-frame checks run
    if (STORY.extra) STORY.extra.push({ interactables, tick });
    if (STORY._test && STORY._test.zones) STORY._test.zones.push(
      { id: 'quarry', test: (x, z) => C.lakeFree(G.state) && z < -206 && z > -246 && C.roadDist(x, z) < 9, run: () => UI.chapter('The Quarry Road', 'Chapter 1 · The third bell') },
      { id: 'camp', scene: true, test: (x, z) => C.lakeFree(G.state) && Math.hypot(x - SPOT.enter.x, z - SPOT.enter.z) < 7, run: () => STORY.run(arriveCamp) });
  }
  Object.assign(C, { init, interactables, target, wayIn, tick, sync, sayT, person, helpedCount, mimoSing, learnUse, restore,
    _: { candeScene, candeAgain, minerTalk, helpScene, pioScene, mouthScene, arriveCamp, allHelped, deliver, S, propsOn, reportGong } });
  // (live getters: Object.assign would copy their values once, while they're still null)
  Object.defineProperty(C, 'G', { get: () => G, configurable: true });
  Object.defineProperty(C, 'built', { get: () => B, configurable: true });
})();
