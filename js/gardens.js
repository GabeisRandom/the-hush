'use strict';
// The Bloom Gardens (DESIGN.md 14.1, region 4; 14.10): the fourth bell, in a warm valley just south of Molinar.
// A short road leaves Molinar's south way out (213.8, −111.6), climbs over a hedged ridge to the garden gate, and drops into
// the valley: flower fields in stripes (roses, tulips, lavender, sunflowers), white beehives on the east slope, the
// beekeepers' cottages, two little glasshouses, the flower show on the green (a striped marquee, three judging tables), and
// at the south end the great greenhouse with the gardeners' bell in its cupola. Until the caves' gong rings (caveFree) a
// thick gray mist hangs over the road at the ridge, and you can't get through.
//   · The gate is locked from inside. Flora, a young gardener stuck outside, keeps climbing the rose trellis to peek over;
//     Mimo learns «trepa / sobe / kletter» by watching her, climbs over itself and lifts the latch (the tell-Mimo box).
//   · The flower show (the language here: likes, dislikes and comparing): the Hush came on show day and the three judges went
//     gray. Melisa, the head beekeeper, asks you to help. For each judge: say what they like (or don't) so Melisa gets it
//     («A Tomasa le gustan los girasoles», «A Polo no le gustan las rosas»), then judge their contest in a comparing sentence
//     («La rosa roja es más grande que la rosa blanca», «El tulipán amarillo es más bonito…», «La miel de lavanda es más
//     dulce…»). Graded S–D like the shops.
//   · Picky bees roam the valley (battle/*: tell one what it likes, «¡Te gustan las rosas!», and it calms down).
//   · The great greenhouse is the dungeon (greenhouse.js: GREENHOUSE).
//
// One global, GARDENS, shaped like CAVES:
//   plain data, ready before world.js: layout, landmarks, hush, roadDist(x, z), ground(x, z, h), playDist(x, z), keepClear(x, z, pad),
//     bareAt(x, z), pathAt(x, z), areaAt(x, z), songAt(x, z), drawMap(ctx, o), roamers, open(state) (the gate: caveFree)
//   the language: GARDENS.likes (THINGS, grade(text, lang, o), model(…)), GARDENS.compare (CONTESTS, grade(text, lang, key))
//   GARDENS.build(scene, { terrainAt }) → { colliders, platforms, moving, group, people, update(dt, t, you|null), objects, stats() }
//   the game side: init(game), interactables(), target(), wayIn(), tick(), sync(), state in state.gardens;
//   flags: gardensRoad, gardens, flora, gardenGate, melisa, showDone, greenOpen, gardensFree (set by greenhouse.js), bells
// Needs THREE (r128), core.js, toonkit.js, lexicon.js and icons.js at load; UI, STORY, WORLD, Sound, LINES at run time.

const GARDENS = (() => {
  const INK = '#2b2235';
  // ================================================================ the gate: when the region opens
  // After the Quarry Caves' gong (bell 3). The one place that decides it.
  const CAVE_FLAG = 'caveFree';
  const open = s => !!(s && s.flags && (s.flags[CAVE_FLAG] || (s.flags.bells || 0) >= 3));

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
  const polyDist = (pts, x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; };
  // the valley floor: an ellipse, flat and warm; hills all round it (the ridge to the north, toward Molinar)
  const VALLEY = { x: 198, z: -71, rx: 34, rz: 20, y: 0.45 };
  const valE = (x, z) => Math.hypot((x - VALLEY.x) / VALLEY.rx, (z - VALLEY.z) / VALLEY.rz);
  const valDist = (x, z) => (valE(x, z) - 1) * VALLEY.rz;          // (roughly the distance to the floor's edge: < 0 inside)
  // the road: from Molinar's south way out, over the ridge (the garden gate at the top), down to the green
  const ROAD_PTS = [[213.8, -112.5], [213.5, -105], [212.4, -99.5], [210.6, -94], [207.4, -88.5], [203.6, -83.6]];
  const ROAD = spline(ROAD_PTS, 6);
  function roadDist(x, z) {
    if (x < 195 || x > 230 || z < -120 || z > -76) return 1e9;
    return polyDist(ROAD, x, z);
  }
  const GATE = { x: 212.2, z: -98.6, yaw: 0.18, w: 3.4 };            // the garden gate in the hedge on the ridge (it looks north)
  const MIST = { x: 213.3, z: -103.2, r: 6 };                         // the gray mist across the road, until the gong rings
  const RIDGE = { z: -98.6, x0: 186, x1: 240, h: 3.2 };                // the hedged ridge between Molinar and the valley
  const REGION = { x0: 150, x1: 250, zN: -118, zS: -40 };              // where this file shapes the land
  // the green (the flower show), the marquee, the three judging tables
  const GREEN = { x: 198, z: -74, r: 10 };
  const MARQUEE = { x: 198, z: -67.2, w: 12.4, d: 6.4, rot: 0 };
  // the three judging tables (their entries face north, at you; each judge sits behind theirs)
  const TABLES = [
    { id: 'big', x: 191.0, z: -76.6, rot: -0.38 },       // the biggest rose (Tomasa judges)
    { id: 'pretty', x: 198.0, z: -77.8, rot: 0 },        // the prettiest tulip (Polo)
    { id: 'sweet', x: 205.0, z: -76.6, rot: 0.38 },      // the sweetest honey (Lola)
  ];
  // the buildings (front = local +z, rot = the mesh's rotation.y, as the towns do it); w × d, floors for the camera's blockers
  const B = (id, x, z, w, d, rot, kind, floors = 1) => ({ id, x, z, w, d, rot, kind, floors });
  const BUILDINGS = [
    B('melisa', 222.4, -80.2, 6.0, 4.8, -Math.PI / 2 - 0.3, 'cottage'),         // Melisa's cottage by the hives, door to the west
    B('c1', 184.0, -85.0, 5.4, 4.4, 0.25, 'cottage'),
    B('c2', 171.6, -68.0, 5.0, 4.4, Math.PI / 2 + 0.1, 'cottage'),
    B('c3', 216.2, -83.4, 5.0, 4.2, -0.35, 'cottage'),
    B('glass1', 188.4, -56.8, 5.0, 3.6, Math.PI + 0.2, 'glass', 0.8),             // two little glasshouses
    B('glass2', 172.8, -79.0, 3.6, 5.0, Math.PI / 2, 'glass', 0.8),
    B('great', 198.0, -56.6, 13.0, 8.0, Math.PI, 'great', 2.4),                  // the great greenhouse (its door looks north, at the green)
  ];
  const GREAT = BUILDINGS.find(b => b.id === 'great');
  const DOOR = { x: GREAT.x, z: GREAT.z - GREAT.d / 2 - 0.9 };                   // in front of its door
  // the hives east of the green, in two rows
  const HIVES = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) HIVES.push({ x: 213.6 + i * 2.2 + j * 0.9, z: -67.4 - j * 3.0 + Math.sin(i * 1.7) * 0.3, rot: -0.2 + Math.sin(i * 2.1 + j) * 0.12 });
  // flower fields: rows of one kind (rotated rectangles)
  const FIELDS = [
    { kind: 'lavender', x: 180.0, z: -72.0, hw: 3.0, hd: 4.8, rot: 0.1 },
    { kind: 'tulip', x: 209.6, z: -86.6, hw: 3.2, hd: 1.8, rot: -0.25, mix: ['#e2574c', '#f2c94c', '#ff8fb1', '#f4efe2'] },
    { kind: 'sunflower', x: 217.6, z: -58.8, hw: 2.6, hd: 4.0, rot: 0.25 },
    { kind: 'rose', x: 184.2, z: -62.6, hw: 3.4, hd: 2.0, rot: 0.3 },
    { kind: 'tulip', x: 176.4, z: -62.4, hw: 2.4, hd: 1.7, rot: -0.4, mix: ['#e2574c', '#f2c94c'] },
  ];
  const SPOT = {
    flora: { x: 209.4, z: -101.2, yaw: Math.PI * 0.9 },              // Flora, outside the gate by the trellis (west of the road)
    trellis: { x: 209.0, z: -99.4 },                                  // the rose trellis on the hedge, west of the gate
    watch: { x: 213.4, z: -104.0 },                                   // a spot with a good view of her climbing
    melisa: { x: 207.0, z: -80.4, yaw: Math.PI * 0.8 },               // Melisa, on the green by the judges
    tomasa: { x: 190.6, z: -74.2, yaw: Math.PI - 0.38 }, polo: { x: 198.0, z: -75.4, yaw: Math.PI }, lola: { x: 205.4, z: -74.2, yaw: Math.PI + 0.38 },   // the judges, behind their tables
    sunflowers: { x: 217.6, z: -58.8 }, roses: { x: 184.2, z: -62.6 }, lavender: { x: 180.0, z: -72.0 }, tulips: { x: 209.6, z: -86.6 }, hives: { x: 219.6, z: -68.9 },
    enter: { x: 205.2, z: -86.4 }, door: DOOR,
  };
  // the gray patches world.js adds to L.hush: the valley (it lifts when the bell rings) and the mist on the ridge road
  const HUSH = [{ x: 198, z: -71, r: 22, a: 0.55, gardens: true }, { x: MIST.x, z: MIST.z, r: 7.5, a: 0.85, gardensGate: true }];
  // picky bees (and a few others) roaming the valley once the gate is open; their likes are picked per fight
  const ROAMERS = [
    { x: 181.0, z: -58.0, area: 'gardens', foes: [{ kind: 'bee', color: 'yellow' }, { kind: 'bee', color: 'red' }] },
    { x: 226.6, z: -79.6, area: 'gardens', foes: [{ kind: 'bee', color: 'blue' }, { kind: 'moth', color: 'green' }] },
    { x: 169.6, z: -70.0, area: 'gardens', foes: [{ kind: 'bee', color: 'white' }, { kind: 'bee', color: 'yellow' }, { kind: 'hushling', color: 'red' }] },
  ];

  // ================================================================ the ground (world.js rawHeight, playDist, grass, scatter)
  // the ridge: a long bump along z −98.6 between Molinar and the valley (the road cuts through it; world.js smooths roads)
  const ridge = (x, z) => RIDGE.h * Math.exp(-Math.pow((z - RIDGE.z) / 3.4, 2)) * smoothstep(RIDGE.x0, RIDGE.x0 + 10, x) * (1 - smoothstep(RIDGE.x1 - 10, RIDGE.x1, x));
  // the hills round the floor (east, south and west; the ridge does the north)
  function hills(x, z) {
    const d = valDist(x, z);
    if (d <= 0) return 0;
    const north = smoothstep(-92, -100, z);                      // (toward the ridge and Molinar, the rim fades: the ridge takes over)
    const h = (5.5 + 2.2 * Math.sin(x * 0.11 + 1.3) * Math.sin(z * 0.09 + 0.4) + 1.2 * Math.sin(x * 0.37 + z * 0.21)) * smoothstep(0.5, 13, d);
    return h * (1 - north);
  }
  function ground(x, z, h) {
    if (x < REGION.x0 || x > REGION.x1 || z < REGION.zN || z > REGION.zS) return h;
    const fade = smoothstep(REGION.x0, REGION.x0 + 8, x) * (1 - smoothstep(REGION.x1 - 8, REGION.x1, x)) * smoothstep(REGION.zN, REGION.zN + 8, z) * (1 - smoothstep(REGION.zS - 6, REGION.zS, z));
    const d = valDist(x, z), rd = roadDist(x, z);
    const floor = VALLEY.y + 0.22 * Math.sin(x * 0.13 + 0.6) * Math.cos(z * 0.17) + 0.15 * Math.sin(x * 0.05 - z * 0.07);
    let out = lerp(h, floor, (1 - smoothstep(-2.5, 2.5, d)) * fade);
    // (world.js's creek runs east-west across the whole map at z ≈ −66: in here it's gone, and the road's bed stays dry)
    out = Math.max(out, lerp(VALLEY.y, out, smoothstep(1, 6, d)));
    if (out < 0.3 && (d < 6 || rd < 6)) out = 0.3 + (out - 0.3) * 0.1;
    const cut = smoothstep(2.4, 6.5, rd);                       // the road cuts through the ridge (a little pass with the gate in it)
    out += (hills(x, z) + ridge(x, z) * smoothstep(-2, 1, d)) * cut * fade;
    // the green and the great greenhouse's yard are dead flat
    const g = Math.hypot(x - GREEN.x, z - GREEN.z);
    out = lerp(out, VALLEY.y, (1 - smoothstep(GREEN.r - 1, GREEN.r + 2.5, g)) * fade);
    const gy = Math.max(Math.abs(x - GREAT.x) - GREAT.w / 2 - 1.5, Math.abs(z - GREAT.z) - GREAT.d / 2 - 2);
    out = lerp(out, VALLEY.y + 0.05, (1 - smoothstep(0, 2.5, gy)) * fade);
    return out;
  }
  // how far from anywhere you're meant to be (negative inside): the road over the ridge (narrow at the gate), the floor. Past
  // the floor's edge there's a thin belt of trees, then bare hills (> 26: no trees), so nothing reaches the rooms that float
  // over the south-east woods (the mill's, the mine's); the edge itself is a ring of invisible solids (build: rimWalls)
  function playDist(x, z) {
    if (x < REGION.x0 - 10 || x > REGION.x1 + 10 || z < REGION.zN - 6 || z > REGION.zS + 4) return 1e9;
    const gd = Math.hypot(x - GATE.x, z - GATE.z);
    const rd = roadDist(x, z) - (z < -101 ? 4.5 : lerp(2.2, 4, smoothstep(1.5, 6, gd)));
    const d = Math.min(rd, valDist(x, z) + 1.2);
    return d > 8 ? 30 + d : d;
  }
  // world.js open(): no trees, rocks or flowers on the road, the green, the paths, by the buildings, in the fields or hives
  const KEEP = [];
  const inObb = (b, x, z, pad) => { const c = Math.cos(b.rot || 0), s = Math.sin(b.rot || 0), lx = (x - b.x) * c - (z - b.z) * s, lz = (x - b.x) * s + (z - b.z) * c; return Math.abs(lx) < b.hw + pad && Math.abs(lz) < b.hd + pad; };
  // the valley's paths: from the road's end round the green, to the cottages, the hives, the glasshouses and the great greenhouse
  const PATHS = [
    { w: 2.2, pts: [[203.6, -83.6], [201.0, -82.6], [198.0, -82.4]] },
    { w: 1.8, pts: [[194.0, -82.4], [189.0, -80.4], [184.6, -82.0]] },
    { w: 1.6, pts: [[189.0, -80.4], [182.0, -79.6], [175.2, -79.2]] },
    { w: 1.6, pts: [[188.4, -68.6], [183.4, -65.8], [176.4, -67.8]] },
    { w: 1.8, pts: [[208.0, -77.6], [214.0, -78.6], [219.6, -80.6]] },
    { w: 1.6, pts: [[211.4, -78.2], [215.2, -81.2]] },
    { w: 1.6, pts: [[213.0, -77.9], [215.0, -72.6]] },
    { w: 2.2, pts: [[207.4, -73.0], [206.8, -64.8], [201.6, -61.8], [198.0, -61.4]] },
    { w: 1.6, pts: [[194.2, -61.6], [189.2, -59.4]] },
    { w: 1.6, pts: [[206.8, -64.8], [212.2, -61.4]] },
  ];
  const pathDist = (x, z) => { let d = 1e9; for (const p of PATHS) d = Math.min(d, polyDist(p.pts, x, z) - p.w / 2); return d; };
  function keepClear(x, z, pad = 0) {
    if (x < REGION.x0 - 4 || x > REGION.x1 + 4 || z < REGION.zN || z > REGION.zS) return false;
    if (roadDist(x, z) < 3.4 + pad) return true;
    if (pad !== 0.5 && valDist(x, z) < 0.6) return true;            // (no world trees or rocks on the floor: build plants its own; world.js's flowers ask with 0.5)
    if (Math.hypot(x - GATE.x, z - GATE.z) < 7 + pad) return true;
    if (valDist(x, z) < 0.5 + pad && (pathDist(x, z) < 1.4 + pad || Math.hypot(x - GREEN.x, z - GREEN.z) < GREEN.r + 2 + pad)) return true;
    for (const b of BUILDINGS) if (inObb({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot }, x, z, 2.2 + pad)) return true;
    for (const f of FIELDS) if (inObb(f, x, z, 1.2 + pad)) return true;
    for (const c of KEEP) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true;
    if (Math.abs(x - SPOT.hives.x) < 9 + pad && Math.abs(z - SPOT.hives.z) < 4.5 + pad) return true;
    return false;
  }
  // world.js townBare (0..1): no grass on the road, the paths, under the buildings and the marquee, in the fields' soil
  function bareAt(x, z) {
    if (x < REGION.x0 || x > REGION.x1 || z < REGION.zN || z > REGION.zS) return 0;
    let a = 1 - smoothstep(1.4, 2.4, roadDist(x, z));
    if (valDist(x, z) < 3) {
      a = Math.max(a, 1 - smoothstep(-0.2, 0.7, pathDist(x, z)));
      for (const b of BUILDINGS) if (inObb({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot }, x, z, 0.5)) return 1;
      if (inObb({ x: MARQUEE.x, z: MARQUEE.z, hw: MARQUEE.w / 2, hd: MARQUEE.d / 2, rot: 0 }, x, z, 0.3)) return 1;
      for (const f of FIELDS) if (inObb(f, x, z, 0.4)) return 0.9;
      a = Math.max(a, 0.82 * (1 - smoothstep(GREEN.r - 1, GREEN.r + 1.5, Math.hypot(x - GREEN.x, z - GREEN.z))));     // (the show's green is mown short)
      if (Math.abs(x - GREAT.x) < GREAT.w / 2 + 2 && z > GREAT.z - GREAT.d / 2 - 3 && z < GREAT.z + GREAT.d / 2 + 1) a = Math.max(a, 0.8);
    }
    return clamp(a, 0, 1);
  }
  // world.js's path mask (the ground's tan color): the valley's paths and the trodden ring round the show tables
  function pathAt(x, z) {
    if (x < REGION.x0 || x > REGION.x1 || z < -96 || z > -48) return 0;
    let a = 0.8 * (1 - smoothstep(-0.3, 0.6, pathDist(x, z)));
    const g = Math.hypot(x - GREEN.x, z - (GREEN.z - 2.5));
    a = Math.max(a, 0.55 * (1 - smoothstep(4.5, 6.5, g)) * smoothstep(1.5, 3.5, g));
    return a;
  }
  // the mini-map's area names
  const AREAS = { road: { id: 'gardenroad', name: 'The Garden Road', color: '#8aa34a' }, valley: { id: 'gardens', name: 'The Bloom Gardens', color: '#d9649a' } };
  function areaAt(x, z) {
    if (x < REGION.x0 || x > REGION.x1 || z < -112 || z > REGION.zS) return null;
    if (valDist(x, z) < 4) return AREAS.valley;
    if (roadDist(x, z) < 9 && z > -110) return AREAS.road;
    return null;
  }
  // the music: the valley's own song (audio.js 'gardens', or Molinar's when it isn't there); the road, Molinar's
  function songAt(x, z) {
    const a = areaAt(x, z); if (!a) return null;
    if (a === AREAS.valley) return typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('gardens') ? 'gardens' : 'molinar';
    return 'molinar';
  }
  // the mini-map's picture (minimap.js drawLand, in world units): the floor, the fields, the paths, the roofs, the hives
  const FIELD_COL = { lavender: '#9b7fd0', tulip: '#e86a7a', sunflower: '#f2c94c', rose: '#d9434f' };
  function drawMap(c, o = {}) {
    const PX = o.PX || 0.33, INKC = o.INK || INK;
    c.save();
    c.lineJoin = 'round'; c.lineCap = 'round';
    // the floor: warm grass
    c.fillStyle = 'rgba(160,196,92,0.55)';
    c.beginPath(); c.ellipse(VALLEY.x, VALLEY.z, VALLEY.rx + 1, VALLEY.rz + 1, 0, 0, TAU); c.fill();
    // the fields, in stripes of their color
    for (const f of FIELDS) { c.save(); c.translate(f.x, f.z); c.rotate(-(f.rot || 0)); c.fillStyle = FIELD_COL[f.kind] || '#e86a7a'; c.globalAlpha = 0.85; c.fillRect(-f.hw, -f.hd, f.hw * 2, f.hd * 2); c.globalAlpha = 1; c.strokeStyle = 'rgba(86,66,38,0.45)'; c.lineWidth = 0.6 * PX; c.strokeRect(-f.hw, -f.hd, f.hw * 2, f.hd * 2); c.restore(); }
    // the road and the paths
    const line = (pts, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); };
    line(ROAD, 3.6, 'rgba(86,66,38,0.6)'); line(ROAD, 2.6, '#e8d9b6');
    PATHS.forEach(p => { line(p.pts, p.w + 0.8, 'rgba(86,66,38,0.45)'); line(p.pts, p.w, '#efe2c2'); });
    // the green, the marquee (striped), the tables
    c.fillStyle = '#b9d77a'; c.beginPath(); c.arc(GREEN.x, GREEN.z, GREEN.r, 0, TAU); c.fill();
    c.save(); c.translate(MARQUEE.x, MARQUEE.z); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#fffaf0' : '#e0503f'; c.fillRect(-MARQUEE.w / 2 + i * MARQUEE.w / 6, -MARQUEE.d / 2, MARQUEE.w / 6, MARQUEE.d); } c.strokeStyle = INKC; c.lineWidth = 1.2 * PX; c.strokeRect(-MARQUEE.w / 2, -MARQUEE.d / 2, MARQUEE.w, MARQUEE.d); c.restore();
    // the roofs (glass ones pale blue), with an ink edge
    const roof = (b, col) => { c.save(); c.translate(b.x, b.z); c.rotate(-(b.rot || 0)); c.fillStyle = col; c.strokeStyle = INKC; c.lineWidth = 1.3 * PX; c.beginPath(); c.rect(-b.w / 2 - 0.3, -b.d / 2 - 0.3, b.w + 0.6, b.d + 0.6); c.fill(); c.stroke(); c.restore(); };
    BUILDINGS.forEach(b => roof(b, b.kind === 'cottage' ? '#c9643f' : '#bfe3ef'));
    // the hives: little white squares
    c.fillStyle = '#fffaf0'; c.strokeStyle = INKC; c.lineWidth = 0.5 * PX;
    HIVES.forEach(h => { c.fillRect(h.x - 0.5, h.z - 0.5, 1, 1); c.strokeRect(h.x - 0.5, h.z - 0.5, 1, 1); });
    // the hedge on the ridge, and the gate
    c.strokeStyle = '#3f7a35'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(RIDGE.x0 + 8, RIDGE.z); c.lineTo(GATE.x - 2, GATE.z); c.moveTo(GATE.x + 2, GATE.z); c.lineTo(RIDGE.x1 - 8, RIDGE.z); c.stroke();
    c.restore();
  }

  return {
    layout: { buildings: BUILDINGS, road: ROAD_PTS, valley: VALLEY, gate: GATE, green: GREEN, marquee: MARQUEE, tables: TABLES, fields: FIELDS, hives: HIVES, paths: PATHS },
    landmarks: Object.assign({ valley: { x: VALLEY.x, z: VALLEY.z }, gate: GATE, door: DOOR, green: GREEN, mist: MIST }, SPOT),
    hush: HUSH, roamers: ROAMERS, open, CAVE_FLAG,
    roadDist, valDist, valE, ground, playDist, keepClear, bareAt, pathAt, areaAt, songAt, drawMap, pathDist,
    VALLEY, ROAD, ROAD_PTS, GATE, MIST, RIDGE, REGION, GREEN, MARQUEE, TABLES, BUILDINGS, GREAT, DOOR, HIVES, FIELDS, SPOT, KEEP, PATHS, AREAS, FIELD_COL, INK, inObb,
  };
})();

// ================================================================ the language: likes and dislikes, and comparing (pure: no THREE)
// GARDENS.likes.grade(text, lang, o) reads a sentence about what someone likes (or doesn't):
//   o.to: 'you' (talking to a bee: «¡Te gustan las rosas!», «Você gosta de rosas!», «Du magst Rosen!», «你喜欢玫瑰！», «バラが好きだね！»)
//         'other' (telling Melisa about a judge: «A Tomasa le gustan los girasoles», «Ele não gosta de rosas», «Er mag keine Rosen»)
//   o.g: that person's gender ('f' | 'm'), o.name, o.neg: whether the right answer is a dislike, o.thing: the right thing (a THINGS key)
//   → { thing (what you named, or null), neg, ok (the right thing, the right way round), letter S–D, reason, slips, soft, model }
// GARDENS.compare.grade(text, lang, key) reads a comparing sentence for one of the show's contests (CONTESTS: big, pretty, sweet)
//   → { ok, wrong: null | 'order' (you picked the other one) | 'adj' (another kind of contest) | 'none' (no entry named), letter, reason, model }
// es: gustar (gusta / gustan agreeing with the thing, «le» / «te», the article), más … que / menos … que, ser, agreement.
// pt: gostar de (de / do / da / dos / das), a person's ending, maior (never «mais grande»), mais … (do) que.
// de: mögen (magst / mag), gefallen + dative (gefällt / gefallen), kein / nicht, the comparative -er (größer, schöner, süßer) + als.
// zh: 喜欢 / 不喜欢, A 比 B + adjective (no 很 after 比). ja: …が好き / 嫌い, A は B より + adjective.
// Each kind of slip counts once (a major one twice): 0 → S (or A with only an accent or a style note), 1 → B, 2 → C, 3+ → D.
(() => {
  const GA = GARDENS;
  const nrm = s => String(s).toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const isCJ = l => l === 'zh' || l === 'ja';
  const canonOf = (t, l) => { try { return typeof CJK !== 'undefined' && CJK.canon ? CJK.canon(t, l) : String(t).toLowerCase().replace(/\s+/g, ''); } catch (e) { return String(t).toLowerCase(); } };
  const flatOf = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s'’.,!?！？。、]/g, '');
  // one letter off (a swap, an extra, a missing or a wrong one), for words of 5+ letters
  function near1(a, b) {
    if (a === b) return true;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1 || Math.min(la, lb) < 4) return false;
    let i = 0; while (i < la && i < lb && a[i] === b[i]) i++;
    if (la === lb) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
    return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  }
  // ---------------------------------------------------------------- the things people (and bees) like
  // count: plural in «te gustan las rosas»; else a mass noun in the singular («te gusta la miel»)
  const THINGS = {
    rose: { id: 'w.rose', en: 'roses', enSg: 'rose', count: true, icon: 'rose', es: { sg: 'rosa', pl: 'rosas', g: 'f' }, pt: { sg: 'rosa', pl: 'rosas', g: 'f' }, de: { sg: 'Rose', pl: 'Rosen', g: 'f' },
      zh: '[玫瑰|méi gui]', ja: 'バラ', zk: ['玫瑰', 'meigui'], jk: ['バラ', 'ばら', '薔薇', 'bara'] },
    sunflower: { id: 'w.sunflower', en: 'sunflowers', enSg: 'sunflower', count: true, icon: 'sunflower', es: { sg: 'girasol', pl: 'girasoles', g: 'm' }, pt: { sg: 'girassol', pl: 'girassóis', g: 'm' }, de: { sg: 'Sonnenblume', pl: 'Sonnenblumen', g: 'f' },
      zh: '[向日葵|xiàng rì kuí]', ja: 'ひまわり', zk: ['向日葵', 'xiangrikui'], jk: ['ひまわり', 'ヒマワリ', '向日葵', 'himawari'] },
    tulip: { id: 'w.tulip', en: 'tulips', enSg: 'tulip', count: true, icon: 'tulip', es: { sg: 'tulipán', pl: 'tulipanes', g: 'm' }, pt: { sg: 'tulipa', pl: 'tulipas', g: 'f' }, de: { sg: 'Tulpe', pl: 'Tulpen', g: 'f' },
      zh: '[郁金香|yù jīn xiāng]', ja: 'チューリップ', zk: ['郁金香', 'yujinxiang'], jk: ['チューリップ', 'ちゅーりっぷ', 'chuurippu', 'churippu', 'chuuripu'] },
    lavender: { id: 'w.lavender', en: 'lavender', enSg: 'lavender', count: false, icon: 'lavender', es: { sg: 'lavanda', g: 'f' }, pt: { sg: 'lavanda', g: 'f' }, de: { sg: 'Lavendel', g: 'm' },
      zh: '[薰衣草|xūn yī cǎo]', ja: 'ラベンダー', zk: ['薰衣草', 'xunyicao'], jk: ['ラベンダー', 'らべんだー', 'rabendaa', 'rabenda', 'labendaa'] },
    honey: { id: 'w.honey', en: 'honey', enSg: 'honey', count: false, icon: 'honey', es: { sg: 'miel', g: 'f' }, pt: { sg: 'mel', g: 'm' }, de: { sg: 'Honig', g: 'm' },
      zh: '[蜂蜜|fēng mì]', ja: 'はちみつ', zk: ['蜂蜜', 'fengmi'], jk: ['はちみつ', 'ハチミツ', '蜂蜜', 'hachimitsu', 'hatimitu', 'hachimitu'] },
  };
  const KEYS = Object.keys(THINGS);
  // a thing named in the sentence: { key, pl, form, typo, at (token index) }
  function findThing(toks, l) {
    let best = null;
    toks.forEach((t, i) => {
      for (const k of KEYS) {
        const F = THINGS[k][l]; if (!F) continue;
        const forms = [[nrm(F.sg), false]].concat(F.pl ? [[nrm(F.pl), true]] : []);
        // German compounds: «Lavendelhonig», «Rosenhonig»: the flower counts
        for (const [f, pl] of forms) {
          const exact = t === f, typo = !exact && near1(t, f);
          if ((exact || typo) && (!best || (best.typo && exact))) best = { key: k, pl, form: pl ? F.pl : F.sg, typo, at: i };
        }
      }
    });
    return best;
  }
  function findThingCJ(text, l) {
    const raw = String(text), can = canonOf(text, l), flat = flatOf(text);
    for (const k of KEYS) { const list = l === 'zh' ? THINGS[k].zk : THINGS[k].jk; if (list.some(w => raw.includes(w) || (/^[a-z]+$/.test(w) && (can.includes(w) || flat.includes(w))))) return { key: k }; }
    return null;
  }
  // ---------------------------------------------------------------- the right sentence (the "I don't know" model, and the recast)
  const ART = { es: { m: ['el', 'los'], f: ['la', 'las'] }, pt: { m: ['o', 'os'], f: ['a', 'as'] } };
  function thingPhrase(k, l, o = {}) {
    const T = THINGS[k], F = T[l];
    if (l === 'es') { const pl = T.count; return `${ART.es[F.g][pl ? 1 : 0]} ${pl ? F.pl : F.sg}`; }
    if (l === 'pt') return T.count ? F.pl : F.sg;                                     // «de rosas», «de mel»
    if (l === 'de') return T.count ? F.pl : F.sg;
    return T[l];
  }
  function likeModel(k, l, o = {}) {
    const T = THINGS[k]; if (!T) return '';
    const neg = !!o.neg, you = o.to === 'you', g = o.g || 'f', name = o.name || '';
    if (l === 'es') {
      const v = T.count ? 'gustan' : 'gusta', th = thingPhrase(k, 'es');
      return you ? `¡Te ${v} ${th}!` : `${name ? `A ${name} ` : ''}${neg ? 'no ' : ''}le ${v} ${th}.`.replace(/^./, c => c.toUpperCase());
    }
    if (l === 'pt') {
      const th = thingPhrase(k, 'pt');
      return you ? `Você gosta de ${th}!` : `${name || (g === 'f' ? 'Ela' : 'Ele')} ${neg ? 'não ' : ''}gosta de ${th}.`;
    }
    if (l === 'de') {
      const th = thingPhrase(k, 'de'), F = T.de, kein = T.count ? 'keine' : F.g === 'm' ? 'keinen' : 'keine';
      return you ? `Du magst ${th}!` : `${name || (g === 'f' ? 'Sie' : 'Er')} mag ${neg ? kein + ' ' : ''}${th}.`;
    }
    if (l === 'zh') {
      const who = you ? '[你|nǐ]' : g === 'f' ? '[她|tā]' : '[他|tā]';
      return `${who} ${neg ? '[不|bù] ' : ''}[喜欢|xǐ huan] ${T.zh} ${you ? '！' : '。'}`;
    }
    if (l === 'ja') return you ? `${T.ja} が [好|す]き だ ね ！` : `${T.ja} が ${neg ? '[嫌|きら]い' : '[好|す]き'} です 。`;
    return '';
  }
  function finish(out) {
    let n = 0; for (const s of out.slips) n += s.major ? 2 : 1;
    // (an accent or an umlaut is a tip, never a grade: P6a, accents.js)
    const sp = typeof ACCENTS !== 'undefined' ? ACCENTS.split(out.soft) : { soft: out.soft, tip: '' };
    out.letter = n === 0 ? (sp.soft.length ? 'A' : 'S') : n === 1 ? 'B' : n === 2 ? 'C' : 'D';
    out.reason = out.letter === 'S' ? 'Perfect sentence!' + (sp.tip ? ' · ' + sp.tip : '') : out.letter === 'A' ? sp.soft[0].why : out.slips[0].why;
    out.tip = sp.tip;
    return out;
  }
  const kit = out => ({
    slip: (kind, why, major) => { if (!out.slips.some(s => s.kind === kind)) out.slips.push({ kind, why, major: !!major }); },
    soft: (kind, why) => { if (!out.soft.some(s => s.kind === kind)) out.soft.push({ kind, why }); },
  });
  // ---------------------------------------------------------------- likes and dislikes
  function likeGrade(text, l, o = {}) {
    const lang = THINGS.rose[l] || isCJ(l) ? l : 'es';
    const out = { thing: null, neg: false, ok: false, slips: [], soft: [], letter: null, reason: '', model: '' };
    const { slip, soft } = kit(out);
    if (isCJ(lang)) {
      const th = findThingCJ(text, lang); if (!th) return out;
      out.thing = th.key;
      const raw = String(text), can = canonOf(text, lang), flat = flatOf(text);
      const has = (chars, roms) => chars.some(c => raw.includes(c)) || roms.some(r => can.includes(r) || flat.includes(r));
      if (lang === 'zh') {
        const mei = has(['没喜欢', '没有喜欢', '沒喜歡', '没爱'], ['meixihuan', 'meiyouxihuan']);      // (没 is for what didn't happen: not liking is 不)
        out.neg = mei || has(['不喜欢', '不爱', '讨厌', '不太喜欢'], ['buxihuan', 'buai', 'taoyan']);
        const like = out.neg || has(['喜欢', '爱', '喜爱'], ['xihuan', 'ai']);
        if (!like) slip('verb', 'Say it with 喜欢 (xǐhuan): «…喜欢…»', true);
        if (mei) slip('mei', 'Not liking is «不喜欢» (bù xǐhuan), not «没喜欢»: 没 is for what didn’t happen');
        if (has(['我'], [])) slip('person', o.to === 'you' ? 'To the bee: «你喜欢…», not «我» (that’s you)' : 'About them: «她 / 他喜欢…», not «我»');
        else if (o.to !== 'you' && raw.includes('你')) slip('person', 'You’re telling Melisa about them: «她 / 他喜欢…»');
        else if (o.to !== 'you' && o.g && raw.includes(o.g === 'f' ? '他' : '她')) slip('gender', `${o.name || 'They'}: «${o.g === 'f' ? '她' : '他'}»`);
      } else {
        out.neg = has(['嫌い', '好きじゃない', '好きではない', 'すきじゃない', 'きらい'], ['kirai', 'sukijanai', 'sukidewanai', 'sukizyanai']);
        const like = out.neg || has(['好き', 'すき'], ['suki']);
        if (!like) slip('verb', 'Say it with 好き (suki): «…が好き»', true);
        else if (/を\s*(大)?(好|す)き|を\s*嫌い/.test(raw) || /(wo|o)(dai)?suki/.test(flat.replace(/[^a-z]/g, '')) && !/(ga|wa)(dai)?suki/.test(flat)) slip('particle', 'With 好き / 嫌い the thing takes が: «…が好き»');
        if (/わたし|私|ぼく|僕|watashi|boku/.test(raw + ' ' + flat)) slip('person', o.to === 'you' ? 'To the bee: say what *it* likes («…が好きだね»)' : 'About them, not you');
      }
      out.model = likeModel(o.thing || th.key, lang, o);
      out.ok = (!o.thing || o.thing === th.key) && (o.neg === undefined || !!o.neg === out.neg);
      return finish(out);
    }
    const toks = nrm(text).split(' ').filter(Boolean), rawToks = String(text).toLowerCase().replace(/[¡!¿?.,;:«»"“”()…]/g, ' ').split(/\s+/).filter(Boolean);
    const th = findThing(toks, lang); if (!th) return out;
    out.thing = th.key;
    const T = THINGS[th.key], F = T[lang], ti = th.at, before = ti > 0 ? toks[ti - 1] : '', has = re => toks.some(t => re.test(t));
    if (th.typo) slip('spelling', `Spelling: «${th.form}»`);
    const wantThing = o.thing || th.key, wantNeg = !!o.neg, you = o.to === 'you';
    out.model = likeModel(wantThing, lang, o);
    if (lang === 'es') {
      out.neg = has(/^(no|nunca)$/);
      const vi = toks.findIndex(t => /^(gusta|gustan|encanta|encantan|gusto|gustas|gustamos|gustais|gustaba|gustaban|quiere|quieres|ama|amas|adora|adoras|prefiere|prefieres)$/.test(t));
      if (vi < 0) slip('verb', `Say it with gustar: «${out.model}»`, true);
      else {
        const vb = toks[vi];
        if (/^(gusta|gustan|encanta|encantan|gustaba|gustaban)$/.test(vb)) {
          const plV = /n$/.test(vb);
          if (plV !== th.pl) slip('number', th.pl ? `«${th.form}»: more than one, so «gustan»` : `«${th.form}» is one thing: «gusta»`);
          const pr = vi > 0 ? toks[vi - 1] : '';
          const want = you ? 'te' : 'le';
          if (pr === want || (you && pr === 'le')) { /* good («le» is polite usted, for a bee too) */ }
          else if (pr === 'me' || pr === 'nos') slip('person', you ? '«me gusta» is about you. To the bee: «te gusta»' : `That’s about you. About ${o.name || 'them'}: «le gusta»`);
          else if (pr === 'te' && !you) slip('person', `You’re telling Melisa about ${o.name || 'them'}: «le gusta», not «te»`);
          else if (pr === 'les') slip('number', `One person: «le gusta»`);
          else slip('pronoun', `Who likes it? «${want} gusta…»: «${out.model}»`);
          if (out.neg && toks.indexOf('no') > vi) slip('order', '«no» goes before «le»: «no le gustan…»');
        } else if (/^(gusto|gustas|gustamos|gustais)$/.test(vb)) slip('ending', 'With gustar the verb goes with the thing you like: «gusta» / «gustan»');
        else soft('style', `Almost! The way to say it: «${out.model}»`);
        // whose: «a ella / a él / a Tomasa»
        if (!you && o.g) { if (o.g === 'm' && has(/^ella$/)) slip('gender', `${o.name}: «a él», not «a ella»`); if (o.g === 'f' && rawToks.includes('él')) slip('gender', `${o.name}: «a ella», not «a él»`); }
      }
      // the article: «las rosas», «la miel» (gustar always takes one)
      const arts = ['el', 'la', 'los', 'las'];
      if (vi >= 0 && /^(gusta|gustan|encanta|encantan)$/.test(toks[vi])) {
        if (!arts.includes(before)) slip('article', `With gustar, the thing takes «${ART.es[F.g][th.pl ? 1 : 0]}»: «… ${ART.es[F.g][th.pl ? 1 : 0]} ${th.form}»`);
        else { const want = ART.es[F.g][th.pl ? 1 : 0]; if (before !== want) slip(/^(la|las)$/.test(before) !== (F.g === 'f') ? 'gender' : 'number', `«${want} ${th.form}»`); }
      }
      if (th.key === 'tulip' && !th.pl && !/tulipán/.test(String(text).toLowerCase()) && !th.typo) soft('accent', 'Accent: «tulipán»');
    } else if (lang === 'pt') {
      out.neg = has(/^(nao|nunca)$/);
      const vi = toks.findIndex(t => /^(gosta|gostas|gosto|gostam|gostamos|adora|adoras|ama|amas|curte|quer|queres|prefere)$/.test(t));
      if (vi < 0) slip('verb', `Say it with gostar de: «${out.model}»`, true);
      else {
        const vb = toks[vi];
        if (/^gost/.test(vb)) {
          if (vb === 'gosto' || vb === 'gostamos') slip('person', you ? '«gosto» is you. To the bee: «você gosta»' : `About ${o.name || 'them'}: «gosta», not «${vb}»`);
          else if (vb === 'gostam') slip('person', `One ${you ? 'bee' : 'person'}: «gosta»`);
          else if (vb === 'gostas' && !you) slip('person', `About ${o.name || 'them'}: «gosta»`);
          // «de» (or do / da / dos / das) between the verb and the thing
          const mid = toks.slice(vi + 1, ti), p = mid.find(t => /^(de|do|da|dos|das)$/.test(t));
          if (!p) slip('prep', 'gostar always takes «de»: «gosta de …»');
          else if (p === 'de' && /^(a|o|as|os)$/.test(mid[mid.indexOf(p) + 1] || '')) slip('prep', `de + ${mid[mid.indexOf(p) + 1]} = ${{ a: 'da', o: 'do', as: 'das', os: 'dos' }[mid[mid.indexOf(p) + 1]]}`);
          else if (p !== 'de') { const pg = /a/.test(p.slice(1)) ? 'f' : 'm', ppl = /s$/.test(p); if (pg !== F.g) slip('gender', `«${F.sg}» is ${F.g === 'f' ? 'feminine: «da»' : 'masculine: «do»'}`); else if (ppl !== th.pl) slip('number', th.pl ? `More than one: «${F.g === 'f' ? 'das' : 'dos'}»` : `One: «${F.g === 'f' ? 'da' : 'do'}»`); }
          if (out.neg && toks.indexOf('nao') > vi) slip('order', '«não» goes before the verb: «não gosta de…»');
        } else soft('style', `Almost! The way to say it: «${out.model}»`);
      }
      if (has(/^eu$/)) slip('person', you ? '«eu» is you. To the bee: «você gosta…»' : `About ${o.name || 'them'}, not you`);
      if (!you && o.g) { if (o.g === 'm' && has(/^ela$/)) slip('gender', `${o.name}: «ele», not «ela»`); if (o.g === 'f' && has(/^ele$/)) slip('gender', `${o.name}: «ela», not «ele»`); if (has(/^voce$/)) slip('person', `You’re telling Melisa about ${o.name || 'them'}: «${o.g === 'f' ? 'ela' : 'ele'} gosta»`); }
      if (out.neg && !/não/.test(String(text).toLowerCase()) && /\bnao\b/.test(String(text).toLowerCase())) soft('accent', 'Accent: «não»');
      if (th.key === 'sunflower' && th.pl && !/girassóis/.test(String(text).toLowerCase()) && !th.typo) soft('accent', 'Accent: «girassóis»');
    } else if (lang === 'de') {
      out.neg = has(/^(kein|keine|keinen|nicht)$/);
      const vi = toks.findIndex(t => /^(magst|mag|mogt|moegt|mogen|moegen|mochte|moechte|gefallt|gefaellt|gefallen|gefallst|gefaellst|liebst|liebt|liebe|hast|hat|findest|findet)$/.test(t));
      if (vi < 0) slip('verb', `Say it with mögen: «${out.model}»`, true);
      else {
        const vb = toks[vi];
        if (/^(magst|mag|mogt|moegt|mogen|moegen)$/.test(vb)) {
          const right = you ? 'magst' : 'mag';
          if (vb !== right) slip('ending', you ? 'du → «magst»' : `${o.name || 'she / he'} → «mag»`);
        } else if (/^(gefallt|gefaellt|gefallen|gefallst|gefaellst)$/.test(vb)) {
          if (/st$/.test(vb)) slip('case', `It’s the thing that pleases: «${T.count ? F.pl + ' gefallen' : F.sg + ' gefällt'} ${you ? 'dir' : o.g === 'm' ? 'ihm' : 'ihr'}»`, true);
          else if ((vb === 'gefallen') !== !!th.pl) slip('number', th.pl ? `«${th.form}» are more than one: «gefallen»` : `«${th.form}» is one thing: «gefällt»`);
          const dat = you ? 'dir' : o.g === 'm' ? 'ihm' : 'ihr';
          if (!has(new RegExp(`^${dat}$`))) { if (has(/^(dich|du|sie|er|ihn)$/)) slip('case', `To whom? The dative: «${dat}»`); else if (!has(/^(dir|ihm|ihr|mir)$/) && !o.name) slip('pronoun', `To whom? «… ${dat}»`); else if (has(/^mir$/)) slip('person', '«mir» is you'); else if (has(/^(dir|ihm|ihr)$/)) slip('gender', `«${dat}»`); }
        } else if (/^(hast|hat)$/.test(vb) && !has(/^gern$/)) soft('style', `Almost! «${out.model}»`);
        else if (/^(liebst|liebt|liebe|findest|findet)$/.test(vb)) { /* fine: «Du liebst Rosen», «Er findet Rosen toll» */ }
      }
      if (has(/^ich$/)) slip('person', you ? '«ich» is you. To the bee: «du magst…»' : `About ${o.name || 'them'}, not you`);
      if (!you && o.g) { if (o.g === 'm' && toks[0] === 'sie') slip('gender', `${o.name}: «er», not «sie»`); if (o.g === 'f' && toks[0] === 'er') slip('gender', `${o.name}: «sie», not «er»`); if (toks[0] === 'du') slip('person', `You’re telling Melisa about ${o.name || 'them'}: «${o.g === 'f' ? 'sie' : 'er'} mag…»`); }
      // the negation: «keine Rosen» / «Rosen nicht» (not «nicht Rosen»; «kein» for the plural is «keine»)
      if (out.neg) {
        const k = toks.findIndex(t => /^(kein|keine|keinen)$/.test(t)), ni = toks.indexOf('nicht');
        const want = T.count ? 'keine' : F.g === 'm' ? 'keinen' : 'keine';
        if (k >= 0 && toks[k] !== want) slip('ending', `«${want} ${th.form}»`);
        if (k < 0 && ni >= 0 && ni < ti) slip('order', `«${th.form} nicht», or «${want} ${th.form}»`);
      }
      const rawThing = String(text).replace(/[¡!¿?.,;:«»"“”()…]/g, ' ').split(/\s+/).find(w => w && nrm(w) === nrm(th.form));
      if (rawThing && rawThing[0] === rawThing[0].toLowerCase() && !th.typo) soft('capital', `German nouns start with a capital: «${th.form}»`);
    }
    out.ok = wantThing === th.key && (o.neg === undefined || wantNeg === out.neg);
    return finish(out);
  }

  // ---------------------------------------------------------------- the show's contests: which is bigger, prettier, sweeter
  // Each has a winner (a) and the other entry (b), told apart by one word: a color for the flowers, the flower for the honey.
  const ENTRY = {
    red: { es: /^roj[oa]s?$/, pt: /^vermelh[oa]s?$/, de: /^rot(e|en|er|es|em)?$/, zh: ['红', 'hong'], ja: ['赤', 'あか', 'aka'] },
    white: { es: /^blanc[oa]s?$/, pt: /^branc[oa]s?$/, de: /^(weiss|weis)(e|en|er|es|em)?$/, zh: ['白', 'bai'], ja: ['白', 'しろ', 'shiro', 'siro'] },
    yellow: { es: /^amarill[oa]s?$/, pt: /^amarel[oa]s?$/, de: /^gelb(e|en|er|es|em)?$/, zh: ['黄', 'huang'], ja: ['黄色', 'きいろ', 'kiiro', 'kiro'] },
    lavender: { es: /^lavanda$/, pt: /^lavanda$/, de: /lavendel/, zh: ['薰衣草', 'xunyicao'], ja: ['ラベンダー', 'rabendaa', 'rabenda'] },
    rose: { es: /^rosas?$/, pt: /^rosas?$/, de: /^rosen|rose/, zh: ['玫瑰', 'meigui'], ja: ['バラ', 'ばら', '薔薇', 'bara'] },
  };
  const ADJ = {
    big: { es: /^(grande|grandes|mayor)$/, pt: /^(maior|grande|grandes)$/, de: /^(grosser|groesser|grossere|groessere|grosseren|gross|grosse|grossen|grosses)$/, zh: ['大', 'da'], ja: ['大きい', 'おおきい', 'ookii', 'okii', 'ookikute'] },
    pretty: { es: /^(bonit[oa]s?|lind[oa]s?|hermos[oa]s?|precios[oa]s?|bell[oa]s?)$/, pt: /^(bonit[oa]s?|lind[oa]s?)$/, de: /^(schoner|schoener|hubscher|huebscher|schon|schoen|schonere|schoenere)$/, zh: ['漂亮', 'piaoliang', '好看', 'haokan', '美'], ja: ['きれい', '綺麗', 'kirei', 'かわいい', '可愛い', 'kawaii', '美しい', 'utsukushii'] },
    sweet: { es: /^(dulce|dulces)$/, pt: /^(doce|doces)$/, de: /^(susser|suesser|suss|suess|sussere|suessere)$/, zh: ['甜', 'tian'], ja: ['甘い', 'あまい', 'amai'] },
  };
  const CONTESTS = {
    big: { adj: 'big', judge: 'tomasa', noun: 'rose', a: 'red', b: 'white', en: 'bigger',
      model: { es: 'La rosa roja es más grande que la rosa blanca.', pt: 'A rosa vermelha é maior que a rosa branca.', de: 'Die rote Rose ist größer als die weiße Rose.', zh: '[红|hóng] [玫瑰|méi gui] [比|bǐ] [白|bái] [玫瑰|méi gui] [大|dà] 。', ja: '[赤|あか]い バラ は [白|しろ]い バラ より [大|おお]きい です 。', en: 'The red rose is bigger than the white rose.' } },
    pretty: { adj: 'pretty', judge: 'polo', noun: 'tulip', a: 'yellow', b: 'red', en: 'prettier',
      model: { es: 'El tulipán amarillo es más bonito que el tulipán rojo.', pt: 'A tulipa amarela é mais bonita que a tulipa vermelha.', de: 'Die gelbe Tulpe ist schöner als die rote Tulpe.', zh: '[黄|huáng] [郁金香|yù jīn xiāng] [比|bǐ] [红|hóng] [郁金香|yù jīn xiāng] [漂亮|piào liang] 。', ja: '[黄色|きいろ]い チューリップ は [赤|あか]い チューリップ より きれい です 。', en: 'The yellow tulip is prettier than the red tulip.' } },
    sweet: { adj: 'sweet', judge: 'lola', noun: 'honey', a: 'lavender', b: 'rose', en: 'sweeter',
      model: { es: 'La miel de lavanda es más dulce que la miel de rosas.', pt: 'O mel de lavanda é mais doce que o mel de rosas.', de: 'Der Lavendelhonig ist süßer als der Rosenhonig.', zh: '[薰衣草|xūn yī cǎo] [蜂蜜|fēng mì] [比|bǐ] [玫瑰|méi gui] [蜂蜜|fēng mì] [甜|tián] 。', ja: 'ラベンダー の はちみつ は バラ の はちみつ より [甘|あま]い です 。', en: 'The lavender honey is sweeter than the rose honey.' } },
  };
  // the nouns' genders per contest (for «bonito / bonita», «die rote Rose»)
  const NOUN_G = { big: { es: 'f', pt: 'f', de: 'f' }, pretty: { es: 'm', pt: 'f', de: 'f' }, sweet: { es: 'f', pt: 'm', de: 'm' } };
  function compareGrade(text, l, key) {
    const C = CONTESTS[key], lang = C.model[l] ? l : 'es';
    const out = { ok: false, wrong: null, slips: [], soft: [], letter: null, reason: '', model: C.model[lang], adj: null };
    const { slip, soft } = kit(out);
    const ents = [C.a, C.b];
    if (isCJ(lang)) {
      const raw = String(text), can = canonOf(text, lang), flat = flatOf(text);
      // where a word is: in the characters / kana as typed, or (pinyin / rōmaji typed) in the plain letters
      const roman = !/[぀-ヿ㐀-鿿]/.test(raw), low = raw.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const posOf = list => { let p = -1; for (const w of list) { const isR = /^[a-z]+$/.test(w); if (isR !== roman) continue; const i = isR ? low.indexOf(w) : raw.indexOf(w); if (i >= 0 && (p < 0 || i < p)) p = i; } return p; };
      const posRe = re => { const m = re.exec(low); return m ? m.index + m[1].length : -1; };
      const hasAny = list => list.some(w => raw.includes(w) || (/^[a-z]+$/.test(w) && (can.includes(w) || flat.includes(w))));
      const found = ents.filter(e => hasAny(ENTRY[e][lang]));
      const adjKey = Object.keys(ADJ).find(k => hasAny(ADJ[k][lang]));
      if (!found.length) { out.wrong = 'none'; return out; }
      if (adjKey && adjKey !== C.adj) { out.wrong = 'adj'; out.adj = adjKey; return out; }
      if (!adjKey) slip('adj', `Say how: «${C.en}»`, true);
      let winner = null;
      if (lang === 'zh') {
        const bi = raw.indexOf('比') >= 0 ? raw.indexOf('比') : -1, biR = bi < 0 && /(^|[^a-z])bi([^a-z]|$)/.test(String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
        const meiyou = raw.includes('没有') || /meiyou/.test(flat);
        if (bi < 0 && !biR && !meiyou) slip('bi', 'Comparing takes 比: «A 比 B …»', true);
        if (/比[^。！]*很/.test(raw) || /bi.*hen/.test(flat) && !/hen.*bi/.test(flat)) slip('hen', 'No 很 after 比: «A 比 B 大»');
        // who comes before 比 (or 没有) is the one said to be more (or, with 没有, less)
        const pa = posOf(ENTRY[C.a].zh), pb = posOf(ENTRY[C.b].zh);
        const cut = roman ? (posRe(/(^|[^a-z])bi(?![a-z])/) >= 0 ? posRe(/(^|[^a-z])bi(?![a-z])/) : posRe(/(^|[^a-z])mei ?you(?![a-z])/)) : (bi >= 0 ? bi : raw.indexOf('没有'));
        if (pa >= 0 && pb >= 0 && cut >= 0) winner = (pa < cut) !== meiyou ? C.a : C.b;
        else if (pa >= 0 && pb >= 0) winner = pa < pb ? C.a : C.b;
        else winner = found[0];
      } else {
        const yi = roman ? posRe(/(^|)yori/) : raw.indexOf('より'), nh = roman ? posRe(/(^|)no ?ho[uo]?(?= ?ga|\s|$)/) : raw.indexOf('のほう'), nohou = nh >= 0;
        if (yi < 0 && !nohou) slip('yori', 'Comparing takes より: «A は B より …»', true);
        // the one marked by より (the nearest before it) is the one it's compared to, the loser; のほうが marks the winner
        const pa = posOf(ENTRY[C.a].ja), pb = posOf(ENTRY[C.b].ja);
        const nearest = at => [[C.a, pa], [C.b, pb]].filter(([, p]) => p >= 0 && p < at).sort((x, y) => y[1] - x[1])[0];
        const loser = yi >= 0 ? nearest(yi) : null, champ = !loser && nh >= 0 ? nearest(nh) : null;
        if (loser) winner = loser[0] === C.a ? C.b : C.a;
        else if (champ) winner = champ[0];
        else if (pa >= 0 && pb >= 0) winner = pa < pb ? C.a : C.b;
        else winner = found[0];
        if (/より[^。！]*とても/.test(raw)) soft('style', 'With より you don’t need とても');
      }
      if (winner !== C.a) { out.wrong = 'order'; return out; }
      out.ok = true;
      return finish(out);
    }
    const toks = nrm(text).split(' ').filter(Boolean), rawL = String(text).toLowerCase();
    const has = re => toks.some(t => re.test(t)), idx = re => toks.findIndex(t => re.test(t));
    // the entries named, in order
    const marks = [];
    toks.forEach((t, i) => { for (const e of ents) if (ENTRY[e][lang].test(t) && !marks.some(m => m.e === e)) marks.push({ e, i }); });
    const adjI = toks.findIndex(t => Object.values(ADJ).some(A => A[lang].test(t)));
    const adjKey = adjI >= 0 ? Object.keys(ADJ).find(k => ADJ[k][lang].test(toks[adjI])) : null;
    if (!marks.length) { out.wrong = 'none'; return out; }
    if (adjKey && adjKey !== C.adj) { out.wrong = 'adj'; out.adj = adjKey; return out; }
    if (!adjKey) slip('adj', `Say how: «${{ big: { es: 'más grande', pt: 'maior', de: 'größer' }, pretty: { es: 'más bonito', pt: 'mais bonita', de: 'schöner' }, sweet: { es: 'más dulce', pt: 'mais doce', de: 'süßer' } }[C.adj][lang]}»`, true);
    const less = lang === 'de' ? has(/^weniger$/) : has(/^menos$/);
    const first = marks[0].e, winner = less ? (first === C.a ? C.b : C.a) : first;
    if (winner !== C.a) { out.wrong = 'order'; return out; }
    const two = marks.length > 1, g = NOUN_G[key][lang];
    if (lang === 'es') {
      if (!has(/^(es|son|era)$/)) { if (has(/^(esta|estan)$/)) slip('serestar', 'What it is like: «es» (ser), not «está»', true); else slip('verb', 'Add the verb: «… es más …»'); }
      if (!has(/^(mas|menos)$/) && !(adjKey === 'big' && toks[adjI] === 'mayor')) slip('comparative', `Compare with «más»: «es más ${toks[adjI] || 'grande'} que…»`, true);
      if (two && !has(/^que$/)) slip('prep', '«más … que»: the other one comes after «que»');
      if (!two && (has(/^(mas|menos)$/) || toks[adjI] === 'mayor')) slip('than', `Compare it with the other one: «… que ${key === 'sweet' ? 'la miel de rosas' : key === 'big' ? 'la rosa blanca' : 'el tulipán rojo'}»`);
      // agreement: bonito / bonita with the noun; the colors too
      if (adjKey === 'pretty' && adjI >= 0) { const e = toks[adjI].replace(/s$/, '').slice(-1); if ((e === 'a') !== (g === 'f')) slip('gender', `«${g === 'f' ? 'bonita' : 'bonito'}»: «el tulipán» is masculine`); }
      for (const m of marks) { const t = toks[m.i]; if (/[oa]s?$/.test(t) && key !== 'sweet') { const e = t.replace(/s$/, '').slice(-1); if ((e === 'a') !== (g === 'f')) slip('gender', key === 'big' ? '«la rosa» is feminine: «roja», «blanca»' : '«el tulipán» is masculine: «amarillo», «rojo»'); } }
      // the article before the first noun (or the color: «la roja»)
      const art0 = toks.slice(0, marks[0].i).reverse().find(t => /^(el|la|los|las|un|una)$/.test(t));
      if (!art0) slip('article', `Start with the article: «${g === 'f' ? 'La' : 'El'} …»`);
      else if (/^(la|las|una)$/.test(art0) !== (g === 'f')) slip('gender', `«${g === 'f' ? 'la' : 'el'} ${key === 'big' ? 'rosa' : key === 'pretty' ? 'tulipán' : 'miel'}»`);
      if (!/más/.test(rawL) && /\bmas\b/.test(rawL)) soft('accent', 'Accent: «más»');
    } else if (lang === 'pt') {
      const eI = toks.findIndex(t => t === 'e');
      if (eI < 0 && !has(/^(sao|era)$/)) { if (has(/^(esta|estao|ta)$/)) slip('serestar', 'What it is like: «é» (ser), not «está»', true); else slip('verb', 'Add the verb: «… é …»'); }
      else if (eI >= 0 && !/é/.test(rawL)) soft('accent', 'Accent: «é»');
      if (adjKey === 'big') { if (has(/^grandes?$/)) { if (has(/^mais$/)) slip('comparative', '«mais grande» → «maior»: «é maior que…»'); else slip('comparative', 'Compare: «é maior que…»', true); } }
      else if (!has(/^(mais|menos)$/)) slip('comparative', `Compare with «mais»: «é mais ${toks[adjI] || 'bonita'} que…»`, true);
      if (two && !has(/^que$/)) slip('prep', '«mais … (do) que»: the other one comes after «que»');
      if (!two && has(/^(mais|menos|maior)$/)) slip('than', `Compare it with the other one: «… que ${key === 'sweet' ? 'o mel de rosas' : key === 'big' ? 'a rosa branca' : 'a tulipa vermelha'}»`);
      if (adjKey === 'pretty' && adjI >= 0) { const e = toks[adjI].replace(/s$/, '').slice(-1); if ((e === 'a') !== (g === 'f')) slip('gender', '«a tulipa» is feminine: «bonita»'); }
      for (const m of marks) { const t = toks[m.i]; if (/[oa]s?$/.test(t) && key !== 'sweet') { const e = t.replace(/s$/, '').slice(-1); if ((e === 'a') !== (g === 'f')) slip('gender', key === 'big' ? '«a rosa» is feminine: «vermelha», «branca»' : '«a tulipa» is feminine: «amarela», «vermelha»'); } }
      const art0 = toks.slice(0, marks[0].i).reverse().find(t => /^(o|a|os|as|um|uma)$/.test(t));
      if (!art0) slip('article', `Start with the article: «${g === 'f' ? 'A' : 'O'} …»`);
      else if (/^(a|as|uma)$/.test(art0) !== (g === 'f')) slip('gender', `«${g === 'f' ? 'a' : 'o'} ${key === 'big' ? 'rosa' : key === 'pretty' ? 'tulipa' : 'mel'}»`);
    } else if (lang === 'de') {
      if (!has(/^(ist|sind|war)$/)) slip('verb', 'Add the verb: «… ist …»');
      if (adjI >= 0) {
        const a = toks[adjI];
        if (/^(gross|grosse|grossen|grosses|schon|schoen|suss|suess)$/.test(a)) slip('comparative', `The comparative: «${{ big: 'größer', pretty: 'schöner', sweet: 'süßer' }[C.adj]}»`, true);
        else if (has(/^mehr$/)) slip('comparative', `Not «mehr …»: «${{ big: 'größer', pretty: 'schöner', sweet: 'süßer' }[C.adj]}»`);
        else { const rw = String(text).split(/\s+/).map(w => w.replace(/[^A-Za-zÀ-ÿß]/g, '')).find(w => nrm(w) === a) || ''; if (!/[öüß]|oe|ue/i.test(rw)) soft('accent', `The umlaut: «${{ big: 'größer', pretty: 'schöner', sweet: 'süßer' }[C.adj]}»`); }
      }
      if (two && !has(/^als$/)) { if (has(/^(wie|dann|denn)$/)) slip('als', 'Comparing: «als», not «wie»'); else slip('prep', '«… als die …»: the other one comes after «als»'); }
      if (!two && adjI >= 0 && /er$/.test(toks[adjI])) slip('than', `Compare it with the other one: «… als ${key === 'sweet' ? 'der Rosenhonig' : key === 'big' ? 'die weiße Rose' : 'die rote Tulpe'}»`);
      // the article and the color's ending: «die rote Rose», «der Lavendelhonig»
      const art0 = toks.slice(0, marks[0].i + 1).reverse().find(t => /^(der|die|das|den|dem|des|ein|eine)$/.test(t));
      const wantArt = g === 'f' ? 'die' : 'der';
      if (!art0) slip('article', `Start with the article: «${cap(wantArt)} …»`);
      else if (!/^(der|die|ein|eine)$/.test(art0) || (art0 === 'die' && g === 'm') || (art0 === 'der' && g === 'f') || (art0 === 'eine' && g === 'm')) slip('gender', `«${wantArt}» (${g === 'f' ? key === 'big' ? 'die Rose' : 'die Tulpe' : 'der Honig'})`);
      if (key !== 'sweet') for (const m of marks) { const t = toks[m.i]; if (/^(rot|weiss|weis|gelb)$/.test(t) && m.i > 0 && /^(der|die|das)$/.test(toks[m.i - 1])) slip('ending', `After «die», the color ends in -e: «die ${t === 'rot' ? 'rote' : t === 'gelb' ? 'gelbe' : 'weiße'} …»`); }
    }
    out.ok = true;
    return finish(out);
  }
  Object.assign(GA, {
    likes: { THINGS, KEYS, grade: likeGrade, model: likeModel, phrase: thingPhrase, find: findThing, findCJ: findThingCJ },
    compare: { CONTESTS, ENTRY, ADJ, grade: compareGrade },
    nrm, near1,
  });
})();

// ================================================================ the build: the ridge, the hedge and the gate, the valley, the people
(() => {
  const GA = GARDENS, { toon, merge } = TK, INK = '#2b2235';
  const { VALLEY, GATE, MIST, RIDGE, GREEN, MARQUEE, TABLES, BUILDINGS, GREAT, HIVES, FIELDS, SPOT, KEEP, ROAD } = GA;
  const grayOf = hex => { const c = new THREE.Color(hex), l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; return '#' + c.lerp(new THREE.Color(l * 0.86, l * 0.86, l * 0.95), 0.88).getHexString(); };
  // keep world.js's scatter off our things (plain data: this runs before world.js)
  KEEP.push({ x: GATE.x, z: GATE.z, r: 6 }, { x: SPOT.trellis.x, z: SPOT.trellis.z, r: 3 }, { x: MIST.x, z: MIST.z, r: 5 });

  // ---------------------------------------------------------------- a kit: pieces in vertex colors, merged, with ink hulls (as caves.js)
  let VC = null, HULL = null;
  const mats = () => { if (!VC) { VC = toon('#ffffff', { vc: 1, rim: 0.14 }); HULL = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }); } return { VC, HULL }; };
  const GEO = {
    box: TK.G.box, sphere: new THREE.SphereGeometry(1, 12, 9), cyl: new THREE.CylinderGeometry(1, 1, 1, 10), cyl6: new THREE.CylinderGeometry(1, 1, 1, 7), cone: new THREE.ConeGeometry(1, 1, 8),
    ico: TK.G.ico0, ico1: TK.G.ico1, half: new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), torus: new THREE.TorusGeometry(1, 0.12, 6, 18, Math.PI),
    prism: (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5, 0.5, 0, -0.5, -0.5, 0, -0.5, 0, 1, -0.5, -0.5, 0, -0.5, -0.5, 0, 0.5, 0, 1, 0.5, -0.5, 0, -0.5, 0, 1, 0.5, 0, 1, -0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, 0, 1, -0.5, 0.5, 0, 0.5, 0, 1, -0.5, 0, 1, 0.5]), 3)); g.computeVertexNormals(); return g; })(),
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
        if (ink > 0) { m.decompose(_v, _q, _s); hull.push({ geo, m: m.clone().multiply(new THREE.Matrix4().makeScale(1 + 1.6 * ink / Math.max(0.03, Math.abs(_s.x)), 1 + 1.6 * ink / Math.max(0.03, Math.abs(_s.y)), 1 + 1.6 * ink / Math.max(0.03, Math.abs(_s.z)))), color: INK }); }
        return k;
      },
      add(geo, x, y, z, sx, sy, sz, color, o = {}) { return k.addM(geo, TK.M4(x, y, z, sx, sy, sz, o.ry || 0, o.rx || 0, o.rz || 0), color, o.ink === undefined ? 0.03 : o.ink); },
      box(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y, z, w, h, d, color, o); },
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

  // ---------------------------------------------------------------- the valley's things
  const WALL = '#f4ece0', ROOFC = ['#c9643f', '#b8563a'], WOOD = '#8a5a3a', WOOD_D = '#5a3a24', FRAMEC = '#f6f3ea', LEAF = ['#4f9a45', '#5fae4f', '#478c3e'];
  function cottage(k, b, Y) {
    const w = b.w, d = b.d, h = 2.5;
    k.at(b.x, Y, b.z, b.rot);
    k.box(0, 0.12, 0, w + 0.3, 0.24, d + 0.3, '#b9ab94', { ink: 0.02 });
    k.box(0, h / 2 + 0.2, 0, w, h, d, WALL, { ink: 0.03 });
    // the roof: two slabs and a ridge; a chimney
    const a = 0.6, rise = Math.tan(a) * (d / 2 + 0.4);
    for (const s of [-1, 1]) k.box(0, h + 0.2 + rise / 2, s * (d / 4 + 0.2), w + 0.7, 0.18, (d / 2 + 0.6) / Math.cos(a), ROOFC[(s + 1) / 2], { rx: s * a, ink: 0.025 });
    k.add(GEO.prism, 0, h + 0.2, 0, d + 0.02, rise, w - 0.04, WALL, { ry: Math.PI / 2, ink: 0 });
    k.box(w * 0.28, h + rise + 0.5, -d * 0.18, 0.5, 1.0, 0.5, '#c9b8a0', { ink: 0.02 });
    // the door (front, +z) and windows with flower boxes
    k.box(-w * 0.18, 1.15, d / 2 + 0.05, 0.95, 1.9, 0.1, WOOD, { ink: 0.02 }).box(-w * 0.18 + 0.3, 1.1, d / 2 + 0.12, 0.08, 0.08, 0.06, '#e8c45a', { ink: 0 });
    k.box(w * 0.22, 1.6, d / 2 + 0.05, 1.0, 0.8, 0.08, '#3d5a7a', { ink: 0.02 }).box(w * 0.22, 1.6, d / 2 + 0.1, 0.06, 0.8, 0.04, WOOD_D, { ink: 0 });
    k.box(w * 0.22, 1.1, d / 2 + 0.25, 1.2, 0.25, 0.32, WOOD, { ink: 0.015 });
    for (let i = 0; i < 4; i++) k.add(GEO.sphere, w * 0.22 - 0.42 + i * 0.28, 1.3, d / 2 + 0.28, 0.12, 0.1, 0.12, ['#e2574c', '#f2c94c', '#ff8fb1', '#b9a2ff'][i], { ink: 0.008 });
    for (const s of [-1, 1]) k.box(s * (w / 2 + 0.05), 1.6, 0, 0.08, 0.8, 1.0, '#3d5a7a', { ink: 0.02 });
    k.free();
  }
  // a glasshouse's white frame (its glass is a separate see-through mesh: GLASS)
  function glassFrame(k, b, Y, o = {}) {
    const w = b.w, d = b.d, h = o.h || 2.2, ridge = o.ridge || 1.1, n = Math.max(2, Math.round(w / 1.2));
    k.at(b.x, Y, b.z, b.rot);
    k.box(0, 0.2, 0, w + 0.2, 0.4, d + 0.2, '#c9bca8', { ink: 0.02 });
    for (let i = 0; i <= n; i++) { const x = -w / 2 + (i / n) * w; for (const s of [-1, 1]) k.box(x, 0.4 + h / 2, s * d / 2, 0.09, h, 0.09, FRAMEC, { ink: 0.012 }); }
    for (const s of [-1, 1]) k.box(0, 0.4 + h, s * d / 2, w + 0.1, 0.1, 0.1, FRAMEC, { ink: 0.012 });
    // the roof's ribs, up to the ridge
    for (let i = 0; i <= n; i++) { const x = -w / 2 + (i / n) * w; for (const s of [-1, 1]) k.rod(GEO.cyl6, [x, 0.4 + h, s * d / 2], [x, 0.4 + h + ridge, 0], 0.045, FRAMEC, 0.01); }
    k.box(0, 0.4 + h + ridge, 0, w + 0.1, 0.1, 0.1, FRAMEC, { ink: 0.012 });
    // plants inside, and a door at the front
    for (let i = 0; i < 5; i++) k.add(GEO.ico1, -w / 2 + 0.6 + i * (w - 1.2) / 4, 0.75, (i % 2 ? 1 : -1) * d * 0.22, 0.38, 0.32, 0.38, LEAF[i % 3], { ink: 0.012 });
    if (!o.noDoor) k.box(0, 1.3, d / 2 + 0.03, 0.9, 1.8, 0.06, FRAMEC, { ink: 0.012 });
    k.free();
    // the panes: a box of glass (and the roof's two slopes)
    const gl = [];
    const M = TK.M4(b.x, Y, b.z, 1, 1, 1, b.rot);
    gl.push({ geo: GEO.box, m: M.clone().multiply(TK.M4(0, 0.4 + h / 2, 0, w, h, d)), color: '#ffffff' });
    const a = Math.atan2(ridge, d / 2), L = Math.hypot(ridge, d / 2);
    for (const s of [-1, 1]) gl.push({ geo: GEO.box, m: M.clone().multiply(TK.M4(0, 0.4 + h + ridge / 2, s * d / 4, w, 0.04, L, 0, s * a, 0)), color: '#ffffff' });
    return gl;
  }
  // the great greenhouse: a long glass hall with a domed middle and a cupola where the gardeners' bell hangs
  function greatHouse(k, Y) {
    const b = GREAT, gl = glassFrame(k, b, Y, { h: 3.2, ridge: 1.6, noDoor: true });
    // the dome over the middle, and the cupola on it
    const M = TK.M4(b.x, Y, b.z, 1, 1, 1, b.rot), top = 0.4 + 3.2;
    gl.push({ geo: GEO.half, m: M.clone().multiply(TK.M4(0, top + 0.3, 0, 3.4, 3.0, 3.4)), color: '#ffffff' });
    k.at(b.x, Y, b.z, b.rot);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; k.addM(GEO.torus, TK.M4(0, top + 0.3, 0, 3.42, 3.02, 3.42, a, 0, 0), FRAMEC, 0.006); }
    k.add(GEO.cyl, 0, top + 0.25, 0, 3.5, 0.18, 3.5, FRAMEC, { ink: 0.012 });
    // the cupola: four posts and a little roof, the bell inside it (BELL, below)
    const cy = top + 3.3;
    k.add(GEO.cyl, 0, cy, 0, 0.9, 0.16, 0.9, FRAMEC, { ink: 0.012 });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; k.add(GEO.cyl6, Math.cos(a) * 0.72, cy + 0.85, Math.sin(a) * 0.72, 0.07, 1.6, 0.07, FRAMEC, { ink: 0.01 }); }
    k.add(GEO.cone, 0, cy + 2.05, 0, 1.15, 0.9, 1.15, '#4f8a6a', { ink: 0.02 }).add(GEO.sphere, 0, cy + 2.6, 0, 0.14, 0.14, 0.14, '#e6b54a', { ink: 0.01 });
    // the doors (front, the green side) and a brick step; a sign over the door
    k.box(0, 1.55, b.d / 2 + 0.04, 2.2, 2.3, 0.08, '#cfe6dc', { ink: 0.015 }).box(0, 1.55, b.d / 2 + 0.08, 0.06, 2.3, 0.06, FRAMEC, { ink: 0 });
    k.box(0, 0.12, b.d / 2 + 0.9, 3.0, 0.24, 1.4, '#b88a6a', { ink: 0.015 });
    k.box(0, 3.15, b.d / 2 + 0.08, 2.8, 0.55, 0.1, '#4f8a6a', { ink: 0.015 });
    for (let i = 0; i < 5; i++) k.add(GEO.sphere, -1.0 + i * 0.5, 3.15, b.d / 2 + 0.16, 0.1, 0.1, 0.06, ['#e2574c', '#f2c94c', '#ff8fb1', '#b9a2ff', '#f4efe2'][i], { ink: 0 });
    // big plants inside: palms and ferns (seen through the glass)
    for (let i = 0; i < 6; i++) { const x = -b.w / 2 + 1.2 + i * (b.w - 2.4) / 5; k.add(GEO.cyl6, x, 1.4, (i % 2 ? 1 : -1) * 1.6, 0.12, 2.0, 0.12, WOOD, { ink: 0.01 }); for (let j = 0; j < 5; j++) { const a = (j / 5) * TAU + i; k.add(GEO.sphere, x + Math.cos(a) * 0.55, 2.45, (i % 2 ? 1 : -1) * 1.6 + Math.sin(a) * 0.55, 0.6, 0.12, 0.25, LEAF[j % 3], { ry: -a, ink: 0.01 }); } }
    k.free();
    return { gl, bellY: cy + 0.95 };
  }
  // the marquee: a striped tent, open at the front (north), bunting along its edge
  function marquee(k, Y) {
    const M = MARQUEE, w = M.w, d = M.d, h = 2.6, ridge = 1.5, n = 8;
    k.at(M.x, Y, M.z, M.rot);
    for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [0, -d / 2], [0, d / 2]]) k.add(GEO.cyl6, x, h / 2, z, 0.07, h, 0.07, FRAMEC, { ink: 0.012 });
    k.add(GEO.cyl6, 0, h + ridge, 0, 0.06, w + 0.4, 0.06, FRAMEC, { rz: Math.PI / 2, ink: 0.01 });
    // the roof: stripes on both slopes; the back and the sides, striped too (the front is open)
    const a = Math.atan2(ridge, d / 2), L = Math.hypot(ridge, d / 2);
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + (i + 0.5) * (w / n), col = i % 2 ? '#fffaf0' : '#e0503f';
      for (const s of [-1, 1]) k.box(x, h + ridge / 2, s * d / 4, w / n + 0.01, 0.06, L + 0.12, col, { rx: s * a, ink: 0.012 });
      k.box(x, h / 2, d / 2, w / n + 0.01, h, 0.05, col, { ink: 0.008 });           // the back wall (south)
      // the scalloped valance at the front
      k.add(GEO.half, x, h - 0.02, -d / 2 - 0.03, w / n / 2, 0.28, 0.05, col, { rx: Math.PI, ink: 0.006 });
    }
    for (const s of [-1, 1]) for (let j = 0; j < 4; j++) k.box(s * w / 2, h / 2, -d / 2 + (j + 0.5) * d / 4, 0.05, h, d / 4 + 0.01, j % 2 ? '#fffaf0' : '#e0503f', { ink: 0.008 });
    // inside: a long table of flower pots (the other entries), a banner over it
    k.box(0, 0.75, d / 2 - 1.0, w - 2, 0.1, 1.0, '#f4efe2', { ink: 0.012 });
    for (let i = 0; i < 9; i++) { const x = -w / 2 + 1.6 + i * (w - 3.2) / 8; k.add(GEO.cyl, x, 0.95, d / 2 - 1.0, 0.16, 0.3, 0.16, '#c9643f', { ink: 0.008 }).add(GEO.sphere, x, 1.3, d / 2 - 1.0, 0.22, 0.2, 0.22, ['#e2574c', '#f2c94c', '#b9a2ff', '#ff8fb1', '#f4efe2'][i % 5], { ink: 0.008 }); }
    k.box(0, h - 0.3, d / 2 - 0.12, 4.6, 0.6, 0.06, '#4f8a6a', { ink: 0.012 });
    k.free();
  }
  // bunting: little triangle flags on a string between poles round the green
  function bunting(k, Y, pts) {
    for (const [x, z] of pts) k.add(GEO.cyl6, x, 1.6, z, 0.06, 3.2, 0.06, WOOD, { ink: 0.01 }).add(GEO.sphere, x, 3.25, z, 0.1, 0.1, 0.1, '#e6b54a', { ink: 0.008 });
    const cols = ['#e2574c', '#f2c94c', '#4c7fd8', '#5fb257', '#ff8fb1', '#f4efe2'];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az) + Math.PI / 2, n = Math.floor(len / 0.7);
      for (let j = 1; j < n; j++) { const u = j / n, sag = Math.sin(u * Math.PI) * 0.45; k.add(GEO.cone, lerp(ax, bx, u), Y + 3.0 - sag - 0.18, lerp(az, bz, u), 0.17, 0.36, 0.03, cols[(i * 3 + j) % cols.length], { ry, rz: Math.PI, ink: 0.006 }); }
    }
  }
  function hive(k, h, Y) {
    k.at(h.x, Y, h.z, h.rot);
    for (const s of [-1, 1]) for (const t of [-1, 1]) k.box(s * 0.32, 0.18, t * 0.28, 0.08, 0.36, 0.08, WOOD_D, { ink: 0.008 });
    k.box(0, 0.62, 0, 0.9, 0.52, 0.75, '#f6f1e6', { ink: 0.02 }).box(0, 1.12, 0, 0.9, 0.42, 0.75, '#efe6d6', { ink: 0.02 });
    k.box(0, 1.42, 0, 1.06, 0.12, 0.9, '#c9b48e', { ink: 0.015 }).box(0, 0.42, 0.38, 0.4, 0.06, 0.04, '#3a2b26', { ink: 0 });
    k.free();
  }
  // a little fruit tree (an orange dot or two)
  function fruitTree(k, x, z, Y, s = 1, seed = 1) {
    const R = rng(seed);
    k.add(GEO.cyl6, x, Y + 0.9 * s, z, 0.14 * s, 1.8 * s, 0.14 * s, WOOD, { ink: 0.015 });
    for (let i = 0; i < 4; i++) { const a = R() * TAU; k.add(GEO.ico1, x + Math.cos(a) * 0.45 * s, Y + (2.1 + R() * 0.5) * s, z + Math.sin(a) * 0.45 * s, (0.75 + R() * 0.25) * s, (0.65 + R() * 0.2) * s, (0.75 + R() * 0.25) * s, LEAF[i % 3], { ry: R() * 6, ink: 0.02 }); }
    for (let i = 0; i < 5; i++) { const a = R() * TAU; k.add(GEO.sphere, x + Math.cos(a) * 0.95 * s, Y + (1.9 + R() * 0.8) * s, z + Math.sin(a) * 0.95 * s, 0.11 * s, 0.11 * s, 0.11 * s, R() < 0.5 ? '#f29a3a' : '#f2c94c', { ink: 0.006 }); }
  }

  // ---------------------------------------------------------------- the flower fields: instanced (a few draw calls for hundreds of flowers)
  const _m = new THREE.Matrix4(), _c = new THREE.Color();
  function fields(group, terrainAt) {
    const spots = { lavender: [], tulip: [], sunflower: [], rose: [] };
    const R = rng(4404);
    for (const f of FIELDS) {
      const c = Math.cos(f.rot), s = Math.sin(f.rot), step = f.kind === 'sunflower' ? 1.0 : f.kind === 'rose' ? 1.1 : f.kind === 'lavender' ? 0.75 : 0.45;
      for (let lx = -f.hw + step / 2; lx < f.hw; lx += step) for (let lz = -f.hd + step / 2; lz < f.hd; lz += (f.kind === 'tulip' ? 0.6 : step)) {
        const jx = lx + (R() - 0.5) * step * 0.3, jz = lz + (R() - 0.5) * step * 0.3;
        const x = f.x + jx * c + jz * s, z = f.z - jx * s + jz * c;
        const col = f.mix ? f.mix[Math.floor((lz + f.hd) / 1.2) % f.mix.length] : null;
        spots[f.kind].push({ x, z, y: terrainAt(x, z), s: 0.85 + R() * 0.3, r: R() * TAU, col });
      }
    }
    const out = [];
    const inst = (geo, mat, list, place) => {
      if (!list.length) return null;
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((p, i) => { place(p, _m); im.setMatrixAt(i, _m); if (im.instanceColor !== undefined || p.col) im.setColorAt(i, _c.set(p.col || '#ffffff')); });
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = false; im.receiveShadow = true; group.add(im); out.push(im);
      return im;
    };
    const plain = c => toon(c, { rim: 0.1 });
    // lavender: purple tufts on gray-green bushes
    inst(new THREE.ConeGeometry(0.32, 0.9, 6), plain('#7e9a7a'), spots.lavender, (p, m) => m.compose(_v.set(p.x, p.y + 0.4 * p.s, p.z), _q.setFromEuler(_e.set(0, p.r, 0)), _s.set(p.s * 1.3, p.s, p.s * 1.3)));
    inst(new THREE.ConeGeometry(0.2, 0.5, 6), plain('#9b7fd0'), spots.lavender, (p, m) => m.compose(_v.set(p.x, p.y + 1.0 * p.s, p.z), _q.setFromEuler(_e.set(0, p.r, 0)), _s.set(p.s * 1.4, p.s, p.s * 1.4)));
    // tulips: a stem, and a cup in its color
    inst(new THREE.CylinderGeometry(0.025, 0.03, 0.6, 5), plain('#4f9a45'), spots.tulip, (p, m) => m.compose(_v.set(p.x, p.y + 0.3 * p.s, p.z), _q.identity(), _s.set(1, p.s, 1)));
    inst(new THREE.CylinderGeometry(0.11, 0.07, 0.2, 7), toon('#ffffff', { rim: 0.12 }), spots.tulip, (p, m) => m.compose(_v.set(p.x, p.y + 0.66 * p.s, p.z), _q.setFromEuler(_e.set(0, p.r, 0)), _s.set(p.s, p.s, p.s)));
    // sunflowers: a tall stem, a yellow ring of petals and a brown middle, facing the sun (south-east)
    inst(new THREE.CylinderGeometry(0.05, 0.07, 1.9, 5), plain('#4f9a45'), spots.sunflower, (p, m) => m.compose(_v.set(p.x, p.y + 0.95 * p.s, p.z), _q.identity(), _s.set(1, p.s, 1)));
    inst(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 12), plain('#f2c94c'), spots.sunflower, (p, m) => m.compose(_v.set(p.x, p.y + 1.95 * p.s, p.z), _q.setFromEuler(_e.set(1.25, 0.6, 0)), _s.set(p.s, 1, p.s)));
    inst(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 10), plain('#6b4226'), spots.sunflower, (p, m) => m.compose(_v.set(p.x + 0.02, p.y + 1.96 * p.s, p.z + 0.03), _q.setFromEuler(_e.set(1.25, 0.6, 0)), _s.set(p.s, 1, p.s)));
    // rose bushes, with red blooms
    inst(TK.G.ico1, plain('#3f8a3e'), spots.rose, (p, m) => m.compose(_v.set(p.x, p.y + 0.4 * p.s, p.z), _q.setFromEuler(_e.set(0, p.r, 0)), _s.set(0.55 * p.s, 0.45 * p.s, 0.55 * p.s)));
    const blooms = [];
    spots.rose.forEach(p => { for (let i = 0; i < 4; i++) { const a = p.r + i * 1.6; blooms.push({ x: p.x + Math.cos(a) * 0.38 * p.s, z: p.z + Math.sin(a) * 0.38 * p.s, y: p.y + (0.55 + (i % 2) * 0.25) * p.s, s: p.s, col: i % 3 ? '#d9434f' : '#ff8fb1' }); } });
    inst(new THREE.SphereGeometry(0.11, 8, 6), toon('#ffffff', { rim: 0.12 }), blooms, (p, m) => m.compose(_v.set(p.x, p.y, p.z), _q.identity(), _s.set(1, 0.85, 1)));
    return out;
  }

  // ---------------------------------------------------------------- people: a gardener (merged body and head, posed)
  // look: { shirt, pants, skirt, skin, hair, hat: 'straw' | 'veil' | 'sunflower' | 'cap' | null, hatCol, apron, bun, pony, pigtails, beard, mustache, kid, old, wide }
  const POSES = {
    idle: { arms: [[0.1, 0.18], [0.1, 0.18]] }, hushed: { arms: [[0.05, 0.08], [0.05, 0.08]], headDown: 0.3 }, happy: { arms: [[0.15, 0.25], [2.9, -0.55]] },
    cheer: { arms: [[2.7, 0.5], [2.7, 0.5]] }, climb: { arms: [[2.9, 0.15], [2.6, 0.2]] }, sneeze: { arms: [[1.2, -0.3], [0.1, 0.2]], headDown: -0.35 },
    hold: { arms: [[1.1, 0.05], [1.1, 0.05]] }, point: { arms: [[0.1, 0.2], [1.5, 0.1]] }, think: { arms: [[0.1, 0.2], [2.4, -0.3]], headDown: 0.12 },
    sniff: { arms: [[0.9, 0.05], [0.9, 0.05]], headDown: 0.25 }, boss: { arms: [[0.1, 0.45], [0.75, -0.15]] },
  };
  function personKits(def, pose, gray) {
    const L = def.look, col = h => (gray ? grayOf(h) : h), body = Kit(), head = Kit(), W = L.wide || 1, P = POSES[pose] || POSES.idle, kid = !!L.kid;
    const legH = kid ? 0.36 : 0.5;
    for (const s of [-1, 1]) { body.add(GEO.cyl, s * 0.12, legH / 2 + 0.02, 0, 0.085, legH, 0.085, col(L.pants || L.skirt || '#4a4566'), { ink: 0.02 }); body.add(GEO.sphere, s * 0.12, 0.06, 0.05, 0.11, 0.08, 0.15, col('#5a3a24'), { ink: 0.02 }); }
    const y0 = kid ? -0.14 : 0, torso = kid ? 0.52 : 0.66;
    if (L.skirt) body.add(GEO.cone, 0, 0.52 + y0, 0, 0.36 * W, 0.5, 0.32 * W, col(L.skirt), { ink: 0.02 });
    body.add(GEO.cyl, 0, 0.84 + y0, 0, 0.28 * W, torso, 0.24 * W, col(L.shirt), { ink: 0.025 });
    if (L.apron) body.add(GEO.box, 0, 0.72 + y0, 0.235 * W, 0.4, 0.62, 0.03, col(L.apron), { ink: 0.008 });
    if (L.scarf) body.add(GEO.cyl, 0, 1.12 + y0, 0, 0.2, 0.1, 0.19, col(L.scarf), { ink: 0.01 });
    [-1, 1].forEach((s, i) => {
      const [fwd, out] = P.arms[i], rz = s * out, rx = -fwd;
      _e.set(rx, 0, rz); const dir = new THREE.Vector3(0, -1, 0).applyEuler(_e);
      const sh = [s * 0.3 * W, 1.08 + y0, 0], len = kid ? 0.36 : 0.44, hand = [sh[0] + dir.x * len, sh[1] + dir.y * len, sh[2] + dir.z * len];
      body.rod(GEO.cyl, sh, hand, 0.07, col(L.shirt));
      body.add(GEO.sphere, hand[0], hand[1], hand[2], 0.075, 0.075, 0.075, col(L.skin), { ink: 0.015 });
    });
    // the head: skin, hair, a hat, eyes, a mouth
    const hs = kid ? 1.08 : 1;
    head.add(GEO.sphere, 0, 0.22 * hs, 0, 0.25 * hs, 0.25 * hs, 0.24 * hs, col(L.skin), { ink: 0.025 });
    head.add(GEO.half, 0, 0.23 * hs, -0.02, 0.265 * hs, 0.26 * hs, 0.255 * hs, col(L.hair), { rx: -0.4, ink: 0.015 });
    if (L.bun) head.add(GEO.sphere, 0, 0.36 * hs, -0.22 * hs, 0.11, 0.11, 0.11, col(L.hair), { ink: 0.015 });
    if (L.pony) { head.add(GEO.sphere, 0, 0.22 * hs, -0.27 * hs, 0.08, 0.08, 0.08, col(L.hair), { ink: 0.012 }); head.add(GEO.cone, 0, 0.04 * hs, -0.3 * hs, 0.08, -0.32, 0.07, col(L.hair), { rx: 0.25, ink: 0.012 }); }
    if (L.pigtails) for (const s of [-1, 1]) head.add(GEO.sphere, s * 0.26 * hs, 0.16 * hs, -0.06, 0.08, 0.13, 0.08, col(L.hair), { rz: s * 0.3, ink: 0.012 });
    if (L.beard) head.add(GEO.sphere, 0, 0.06, 0.12, 0.17, 0.13, 0.12, col(L.hair), { ink: 0.015 });
    if (L.mustache) for (const s of [-1, 1]) head.add(GEO.sphere, s * 0.06, 0.13, 0.22, 0.07, 0.03, 0.03, col(L.hair), { rz: s * 0.3, ink: 0.006 });
    if (L.hat === 'straw' || L.hat === 'sunflower') {
      head.add(GEO.cyl, 0, 0.42 * hs, 0, 0.42 * hs, 0.03, 0.42 * hs, col(L.hatCol || '#e8c46a'), { ink: 0.012 }).add(GEO.cyl, 0, 0.5 * hs, 0, 0.2 * hs, 0.16, 0.2 * hs, col(L.hatCol || '#e8c46a'), { ink: 0.012 });
      head.add(GEO.cyl, 0, 0.45 * hs, 0, 0.205 * hs, 0.05, 0.205 * hs, col(L.band || '#e2574c'), { ink: 0 });
      if (L.hat === 'sunflower') { head.add(GEO.cyl, 0.16, 0.5 * hs, 0.14, 0.14, 0.03, 0.14, col('#f2c94c'), { rx: 1.1, ink: 0.008 }).add(GEO.cyl, 0.16, 0.51 * hs, 0.145, 0.06, 0.04, 0.06, col('#6b4226'), { rx: 1.1, ink: 0 }); }
    } else if (L.hat === 'veil') {         // a beekeeper's hat, the veil pinned up on the brim
      head.add(GEO.cyl, 0, 0.44, 0, 0.4, 0.03, 0.4, col(L.hatCol || '#f4efe2'), { ink: 0.012 }).add(GEO.half, 0, 0.44, 0, 0.24, 0.2, 0.24, col(L.hatCol || '#f4efe2'), { ink: 0.012 });
      head.add(GEO.cyl, 0, 0.38, 0, 0.405, 0.1, 0.405, col('#d9d2c4'), { ink: 0 });
    } else if (L.hat === 'cap') head.add(GEO.half, 0, 0.36, 0, 0.27, 0.16, 0.27, col(L.hatCol || '#5fb257'), { ink: 0.015 }).add(GEO.box, 0, 0.37, 0.25, 0.3, 0.03, 0.2, col(L.hatCol || '#5fb257'), { ink: 0.01 });
    // (Port Brisa's hats: a sailor's cap, a captain's cap, a knitted beanie, a headscarf, a cook's hat)
    else if (L.hat === 'sailor') head.add(GEO.cyl, 0, 0.42, 0, 0.27, 0.12, 0.27, col('#f6f3ea'), { ink: 0.012 }).add(GEO.cyl, 0, 0.37, 0, 0.275, 0.05, 0.275, col(L.hatCol || '#2f4f8a'), { ink: 0 });
    else if (L.hat === 'captain') head.add(GEO.cyl, 0, 0.43, 0, 0.28, 0.14, 0.28, col(L.hatCol || '#2f3f6a'), { ink: 0.012 }).add(GEO.cyl, 0, 0.5, 0, 0.3, 0.03, 0.3, col('#f6f3ea'), { ink: 0.008 }).add(GEO.box, 0, 0.37, 0.25, 0.3, 0.03, 0.18, col('#2b2235'), { ink: 0 }).add(GEO.sphere, 0, 0.44, 0.27, 0.05, 0.04, 0.02, col('#e6b54a'), { ink: 0 });
    else if (L.hat === 'beanie') head.add(GEO.half, 0, 0.3, 0, 0.27, 0.24, 0.27, col(L.hatCol || '#c9433a'), { ink: 0.014 }).add(GEO.cyl, 0, 0.31, 0, 0.275, 0.07, 0.275, col(L.band || '#a8332c'), { ink: 0 });
    else if (L.hat === 'bandana') head.add(GEO.half, 0, 0.28, -0.02, 0.27, 0.22, 0.27, col(L.hatCol || '#e2574c'), { rx: -0.25, ink: 0.012 }).add(GEO.cone, 0, 0.2, -0.27, 0.07, 0.16, 0.05, col(L.hatCol || '#e2574c'), { rx: -2.4, ink: 0.006 });
    else if (L.hat === 'chef') head.add(GEO.cyl, 0, 0.5, 0, 0.21, 0.32, 0.21, col('#fbf8f0'), { ink: 0.012 }).add(GEO.sphere, 0, 0.7, 0, 0.27, 0.15, 0.27, col('#fbf8f0'), { ink: 0.012 });
    for (const s of [-1, 1]) head.add(GEO.sphere, s * 0.09, 0.24 * hs, 0.215 * hs, 0.032, 0.048, 0.02, INK, { ink: 0 });
    head.add(GEO.box, 0, 0.11 * hs, 0.225 * hs, 0.08, 0.016, 0.01, INK, { ink: 0 }).add(GEO.sphere, 0, 0.17 * hs, 0.245 * hs, 0.035, 0.03, 0.03, col(L.skin), { ink: 0 });
    if (L.old) head.add(GEO.box, 0, 0.3, 0.23, 0.22, 0.012, 0.01, col('#c9a08a'), { ink: 0 });
    return { body, head, P, kid };
  }
  // a person in the valley: { id, name, x, z, y, top, hushed, talking, def, root, … }; set(pose, gray) rebuilds the look
  function makePerson(def, parent, o = {}) {
    const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group();
    root.add(body); body.add(head); parent.add(root);
    const p = { id: def.id, name: def.name, def, x: def.x, z: def.z, y: 0, top: def.look.kid ? 1.75 : 2.15, yaw: def.yaw || 0, baseYaw: def.yaw || 0, hushed: !!o.hushed, talking: false, root, body, head, pose: o.pose || 'idle', meshes: [], t: Math.random() * 9, kid: !!def.look.kid };
    p.set = (pose, gray) => {
      p.pose = pose; p.gray = !!gray;
      for (const m of p.meshes) { m.parent.remove(m); m.geometry.dispose(); }
      const K = personKits(def, pose, gray);
      p.meshes = K.body.build(body).concat(K.head.build(head));
      head.position.set(0, K.kid ? 1.0 : 1.16, 0);
      p.P = K.P;
    };
    p.set(p.pose, o.gray);
    root.scale.setScalar(def.look.old ? 0.95 : 1);
    return p;
  }
  function animatePerson(p, dt, t, you) {
    p.t += dt;
    const P = p.P || POSES.idle, near = you && Math.hypot(you.x - p.x, you.z - p.z) < 6.5;
    const want = p.look ? Math.atan2(p.look.x - p.x, p.look.z - p.z) : near && !p.gray && p.pose !== 'climb' ? Math.atan2(you.x - p.x, you.z - p.z) : p.baseYaw;
    p.yaw = dampAngle(p.yaw, want, 4, dt);
    const bob = p.talking ? Math.abs(Math.sin(p.t * 13)) * 0.035 : p.pose === 'cheer' || p.pose === 'happy' ? Math.abs(Math.sin(p.t * 6)) * 0.08 : 0;
    const sneeze = p.pose === 'sneeze' ? Math.max(0, Math.sin(p.t * 1.7)) : 0;
    p.root.position.set(p.x, p.y + bob + (p.lift || 0), p.z);
    p.root.rotation.y = p.yaw;
    p.body.rotation.x = (P.lean || 0) + Math.sin(p.t * 1.3) * 0.015 + (sneeze > 0.92 ? 0.35 : -sneeze * 0.1);
    p.body.rotation.z = Math.sin(p.t * 1.1 + p.x) * (p.gray ? 0.005 : 0.02);
    p.head.rotation.x = (P.headDown || 0) * (p.talking ? 0.4 : 1) + (p.pose === 'sniff' ? Math.sin(p.t * 3) * 0.08 : 0);
    p.head.rotation.y = p.pose === 'think' ? Math.sin(p.t * 0.7) * 0.25 : 0;
  }
  const LOOKS = {
    melisa: { shirt: '#f2d16b', pants: '#6b5a3e', skin: '#d9a27a', hair: '#3a2b26', hat: 'veil', apron: '#f4efe2', bun: true },
    flora: { shirt: '#5fa86a', pants: '#4a4f66', skin: '#c98e62', hair: '#1f1a18', hat: 'straw', band: '#4c7fd8', pony: true, scarf: '#e2574c' },
    tomasa: { shirt: '#c9643f', skirt: '#7a5a8a', skin: '#efc29a', hair: '#e8e4dc', hat: 'sunflower', band: '#f2c94c', old: true, bun: true },
    polo: { shirt: '#4c7fd8', pants: '#3f3a4a', skin: '#a8714a', hair: '#2e2420', hat: 'cap', hatCol: '#5fb257', mustache: true, wide: 1.1 },
    lola: { shirt: '#ff8fb1', pants: '#4a4566', skin: '#f0c7a0', hair: '#8a4a2a', kid: true, pigtails: true },
    keeper1: { shirt: '#f4efe2', pants: '#f4efe2', skin: '#c98e62', hair: '#2e2420', hat: 'veil' },
    keeper2: { shirt: '#f4efe2', pants: '#e8e0cf', skin: '#efc29a', hair: '#8a4a2a', hat: 'veil', pony: true },
    fan1: { shirt: '#b9a2ff', skirt: '#4c7fd8', skin: '#e6b48c', hair: '#5a3a24', hat: 'straw', bun: true },
    fan2: { shirt: '#e0a43c', pants: '#4a4f66', skin: '#a8714a', hair: '#1f1a18', beard: true },
    fan3: { shirt: '#5fb257', pants: '#6b5a3e', skin: '#f0c7a0', hair: '#c9a24a', kid: true },
    fan4: { shirt: '#e2574c', skirt: '#3f3a4a', skin: '#c98e62', hair: '#e8e4dc', old: true, hat: 'straw', band: '#5fb257' },
  };
  // who's where (the judges hold their spot behind their tables)
  const PEOPLE = [
    { id: 'melisa', name: 'Melisa', x: SPOT.melisa.x, z: SPOT.melisa.z, yaw: SPOT.melisa.yaw, story: true },
    { id: 'flora', name: 'Flora', x: SPOT.flora.x, z: SPOT.flora.z, yaw: SPOT.flora.yaw, story: true },
    { id: 'tomasa', name: 'Tomasa', g: 'f', x: SPOT.tomasa.x, z: SPOT.tomasa.z, yaw: SPOT.tomasa.yaw, judge: 'big', likes: 'sunflower', pose: 'think', hushed: true },
    { id: 'polo', name: 'Polo', g: 'm', x: SPOT.polo.x, z: SPOT.polo.z, yaw: SPOT.polo.yaw, judge: 'pretty', hates: 'rose', pose: 'sneeze', hushed: true },
    { id: 'lola', name: 'Lola', g: 'f', x: SPOT.lola.x, z: SPOT.lola.z, yaw: SPOT.lola.yaw, judge: 'sweet', likes: 'honey', pose: 'sniff', hushed: true },
    { id: 'keeper1', name: 'Bento', x: 212.4, z: -71.4, yaw: 1.4, hushed: true, fan: true },
    { id: 'keeper2', name: 'Dalia', x: 226.0, z: -74.2, yaw: -1.6, hushed: true, fan: true },
    { id: 'fan1', name: 'Nora', x: 187.4, z: -80.6, yaw: Math.PI - 0.5, hushed: true, fan: true },
    { id: 'fan2', name: 'Iker', x: 193.0, z: -83.0, yaw: Math.PI - 0.2, hushed: true, fan: true },
    { id: 'fan3', name: 'Tito', x: 202.0, z: -83.8, yaw: Math.PI + 0.2, hushed: true, fan: true },
    { id: 'fan4', name: 'Amparo', x: 211.6, z: -75.2, yaw: Math.PI + 0.9, hushed: true, fan: true },
  ];
  PEOPLE.forEach(d => { d.look = LOOKS[d.id]; });
  // (ja rōmaji capitalizes these names mid-sentence; CJK.md's table)
  if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['フローラ', 'メリッサ', 'トマサ', 'ポロ', 'ローラ']);
  // ---------------------------------------------------------------- the entries on the judging tables
  function table(k, t, Y) {
    k.at(t.x, Y, t.z, t.rot);
    k.box(0, 0.78, 0, 2.2, 0.08, 0.95, '#f4efe2', { ink: 0.015 }).box(0, 0.62, 0.475, 2.2, 0.3, 0.02, '#f4efe2', { ink: 0 });
    for (const s of [-1, 1]) for (const z of [-0.36, 0.36]) k.box(s * 0.95, 0.38, z, 0.07, 0.76, 0.07, WOOD_D, { ink: 0.008 });
    // a little sign on a stick: the contest's picture
    k.add(GEO.cyl6, 0, 1.2, -0.38, 0.025, 0.8, 0.025, WOOD, { ink: 0 }).box(0, 1.62, -0.38, 0.6, 0.36, 0.04, '#fffaf0', { ink: 0.01 });
    k.free();
  }
  // the entries: each a group (the judged winner gets a ribbon); { group, a: { g, x, z }, b }
  function entries(parent, t, Y) {
    const tg = new THREE.Group(); tg.position.set(t.x, Y + 0.82, t.z); tg.rotation.y = t.rot; parent.add(tg);
    const k = Kit(), side = [-0.52, 0.52];
    const pot = x => k.add(GEO.cyl, x, 0.14, 0.05, 0.17, 0.28, 0.17, '#c9643f', { ink: 0.012 }).add(GEO.cyl, x, 0.29, 0.05, 0.19, 0.05, 0.19, '#b8563a', { ink: 0.008 });
    if (t.id === 'big') {        // the red rose's bloom is big; the white one's small
      for (let i = 0; i < 2; i++) { const x = side[i], big = i === 0, c = big ? '#d9434f' : '#f4efe2'; pot(x); k.add(GEO.cyl6, x, 0.6, 0.05, 0.025, 0.62, 0.025, '#4f9a45', { ink: 0.006 }); k.add(GEO.sphere, x + 0.08, 0.55, 0.05, 0.1, 0.04, 0.06, '#5fae4f', { rz: -0.6, ink: 0.006 }); k.add(GEO.ico1, x, 0.95, 0.05, big ? 0.3 : 0.14, big ? 0.24 : 0.12, big ? 0.3 : 0.14, c, { ink: 0.012 }); k.add(GEO.sphere, x, big ? 1.12 : 1.02, 0.05, big ? 0.16 : 0.08, big ? 0.1 : 0.05, big ? 0.16 : 0.08, big ? '#b8343f' : '#e8e0cf', { ink: 0.006 }); }
    } else if (t.id === 'pretty') {     // the yellow tulip stands up bright; the red one droops, its petals falling
      pot(side[0]); k.add(GEO.cyl6, side[0], 0.62, 0.05, 0.025, 0.66, 0.025, '#4f9a45', { ink: 0.006 }); k.add(GEO.cyl, side[0], 1.02, 0.05, 0.15, 0.24, 0.12, '#f2c94c', { ink: 0.012 }); for (const s of [-1, 1]) k.add(GEO.sphere, side[0] + s * 0.12, 0.6, 0.05, 0.13, 0.03, 0.05, '#5fae4f', { rz: s * 0.9, ink: 0.006 });
      pot(side[1]); k.rod(GEO.cyl6, [side[1], 0.3, 0.05], [side[1] + 0.12, 0.62, 0.05], 0.025, '#7a8a45', 0.006); k.rod(GEO.cyl6, [side[1] + 0.12, 0.62, 0.05], [side[1] + 0.34, 0.6, 0.05], 0.025, '#7a8a45', 0.006);
      k.add(GEO.cyl, side[1] + 0.42, 0.5, 0.05, 0.1, 0.18, 0.08, '#9a4a44', { rz: 2.2, ink: 0.01 }); k.add(GEO.sphere, side[1] - 0.2, 0.31, 0.25, 0.07, 0.015, 0.05, '#9a4a44', { ink: 0.004 }); k.add(GEO.sphere, side[1] + 0.25, 0.31, 0.3, 0.06, 0.015, 0.05, '#9a4a44', { ink: 0.004 });
    } else {                     // two honey jars: lavender honey (a purple sprig on its label) and rose honey (a pink rose)
      for (let i = 0; i < 2; i++) { const x = side[i]; k.add(GEO.cyl, x, 0.2, 0.05, 0.16, 0.4, 0.16, i ? '#e6a93c' : '#f0c25a', { ink: 0.012 }).add(GEO.cyl, x, 0.43, 0.05, 0.17, 0.07, 0.17, i ? '#d9434f' : '#9b7fd0', { ink: 0.008 }); k.box(x, 0.2, 0.21, 0.2, 0.16, 0.02, '#fffaf0', { ink: 0 }); k.add(GEO.sphere, x, 0.21, 0.225, 0.05, 0.05, 0.01, i ? '#ff8fb1' : '#9b7fd0', { ink: 0 }); }
      k.add(GEO.cyl6, 0, 0.12, 0.2, 0.02, 0.24, 0.02, '#c9b48e', { rz: 1.2, ink: 0 });       // a tasting spoon
    }
    k.build(tg);
    // the ribbons (rosettes), hidden until the contest is judged: on the winner (the left entry: index 0)
    const rib = new THREE.Group(); rib.position.set(side[0], 0.02, 0.32); rib.visible = false; tg.add(rib);
    const rk = Kit(); rk.add(GEO.cyl, 0, 0.18, 0, 0.13, 0.03, 0.13, '#4c7fd8', { rx: Math.PI / 2, ink: 0.008 }).add(GEO.cyl, 0, 0.18, 0.02, 0.07, 0.03, 0.07, '#f2c94c', { rx: Math.PI / 2, ink: 0 });
    for (const s of [-1, 1]) rk.box(s * 0.05, 0.06, 0, 0.06, 0.18, 0.01, '#4c7fd8', { rz: s * 0.25, ink: 0.004 });
    rk.build(rib, { shadow: false });
    return { group: tg, rib, at: s => ({ x: t.x + Math.cos(t.rot) * side[s], z: t.z - Math.sin(t.rot) * side[s] }) };
  }

  // ================================================================ build
  const glowTex = TK.glowTex;
  function build(scene, env = {}) {
    const terrainAt = env.terrainAt || ((x, z) => (typeof WORLD !== 'undefined' ? WORLD.terrainAt(x, z) : 0));
    const group = new THREE.Group(); group.name = 'gardens'; scene.add(group);
    const colliders = [], moving = [];
    const Y = VALLEY.y;
    const k = Kit(), glassPieces = [];
    // ---- the hedge along the ridge (the gate's gap in it), and the rose trellis west of the gate
    const gx0 = GATE.x - GATE.w / 2 - 0.5, gx1 = GATE.x + GATE.w / 2 + 0.5;
    for (let x = RIDGE.x0 + 4; x <= RIDGE.x1 - 4; x += 1.1) {
      if (x > gx0 - 0.3 && x < gx1 + 0.3) continue;
      const z = RIDGE.z + Math.sin(x * 0.31) * 0.15, y = terrainAt(x, z) - 0.2, R = Math.sin(x * 12.9898) * 43758.5453, r = R - Math.floor(R);
      k.add(GEO.ico1, x, y + 1.1, z, 0.78, 1.25 + r * 0.2, 0.72, LEAF[Math.floor(r * 3)], { ry: r * 6, ink: 0.025 });
      if (r > 0.82) k.add(GEO.sphere, x + 0.3, y + 1.6 + r * 0.4, z - 0.68, 0.1, 0.1, 0.06, r > 0.91 ? '#ff8fb1' : '#f4efe2', { ink: 0.006 });
    }
    for (let x = RIDGE.x0 + 4; x < RIDGE.x1 - 4; x += 3.6) {
      const xa = x, xb = Math.min(RIDGE.x1 - 4, x + 3.6);
      if (xb > gx0 && xa < gx1) { if (xa < gx0) colliders.push({ obox: 1, x: (xa + gx0) / 2, z: RIDGE.z, hw: (gx0 - xa) / 2, hd: 0.75, rot: 0 }); if (xb > gx1) colliders.push({ obox: 1, x: (gx1 + xb) / 2, z: RIDGE.z, hw: (xb - gx1) / 2, hd: 0.75, rot: 0 }); continue; }
      colliders.push({ obox: 1, x: (xa + xb) / 2, z: RIDGE.z, hw: (xb - xa) / 2 + 0.1, hd: 0.75, rot: 0 });
    }
    // the gate's brick pillars and its arch with roses
    const gy = terrainAt(GATE.x, GATE.z);
    for (const s of [-1, 1]) {
      const px = GATE.x + s * (GATE.w / 2 + 0.3);
      k.box(px, gy + 1.25, GATE.z, 0.6, 2.5, 0.6, '#b8664a', { ink: 0.025 }).box(px, gy + 2.6, GATE.z, 0.72, 0.18, 0.72, '#d9cdb4', { ink: 0.015 });
      colliders.push({ x: px, z: GATE.z, r: 0.45 });
    }
    for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI, x = GATE.x - Math.cos(a) * (GATE.w / 2 + 0.3), y = gy + 2.7 + Math.sin(a) * 1.0; k.add(GEO.ico1, x, y, GATE.z, 0.26, 0.24, 0.3, LEAF[i % 3], { ink: 0.012 }); if (i % 2) k.add(GEO.sphere, x, y + 0.12, GATE.z - 0.22, 0.1, 0.1, 0.08, i % 4 === 1 ? '#d9434f' : '#ff8fb1', { ink: 0.006 }); }
    // the trellis: a wooden lattice in front of the hedge, vines and roses up it (Flora climbs it; so does Mimo)
    const T = SPOT.trellis, ty = terrainAt(T.x, T.z);
    for (let i = 0; i <= 4; i++) k.box(T.x - 1.0 + i * 0.5, ty + 1.5, T.z, 0.07, 3.0, 0.07, '#e8dcc4', { ink: 0.01 });
    for (let j = 0; j <= 5; j++) k.box(T.x, ty + 0.2 + j * 0.55, T.z, 2.1, 0.07, 0.07, '#e8dcc4', { ink: 0.01 });
    for (let j = 0; j < 9; j++) { const x = T.x - 0.9 + (j % 3) * 0.9 + Math.sin(j) * 0.2, y = ty + 0.4 + j * 0.3; k.add(GEO.sphere, x, y, T.z - 0.08, 0.22, 0.16, 0.08, LEAF[j % 3], { rz: j, ink: 0.008 }); if (j % 3 === 1) k.add(GEO.sphere, x + 0.12, y + 0.08, T.z - 0.14, 0.09, 0.09, 0.06, '#d9434f', { ink: 0.005 }); }
    colliders.push({ obox: 1, x: T.x, z: T.z + 0.2, hw: 1.1, hd: 0.35, rot: 0 });
    // a signpost where the road leaves Molinar, and one at the valley end
    for (const [x, z, ry] of [[216.2, -108.6, 0.2], [206.6, -88.6, -0.5]]) { const y = terrainAt(x, z); k.add(GEO.cyl6, x, y + 1.0, z, 0.08, 2.0, 0.08, WOOD, { ink: 0.012 }).box(x, y + 1.75, z, 1.3, 0.38, 0.08, '#e8d9b6', { ry, ink: 0.012 }); for (let i = 0; i < 3; i++) k.add(GEO.sphere, x - 0.4 + i * 0.4, y + 1.75, z + 0.06, 0.07, 0.07, 0.03, ['#e2574c', '#f2c94c', '#ff8fb1'][i], { ry, ink: 0 }); colliders.push({ x, z, r: 0.2 }); }
    // ---- the valley: cottages, glasshouses, the great greenhouse, the marquee, the tables, hives, trees, bunting
    for (const b of BUILDINGS) {
      if (b.kind === 'cottage') cottage(k, b, terrainAt(b.x, b.z));
      else if (b.kind === 'glass') glassPieces.push(...glassFrame(k, b, terrainAt(b.x, b.z)));
    }
    const great = greatHouse(k, Y + 0.05);
    glassPieces.push(...great.gl);
    marquee(k, Y);
    TABLES.forEach(t => table(k, t, Y));
    HIVES.forEach(h => hive(k, h, terrainAt(h.x, h.z)));
    [[176.6, -86.4, 1.0], [168.4, -73.0, 1.1], [226.6, -66.0, 0.95], [229.0, -76.6, 1.05], [190.6, -88.6, 0.9], [210.2, -59.6, 1.0], [179.0, -58.2, 0.95], [221.6, -88.4, 0.9]].forEach(([x, z, s], i) => { fruitTree(k, x, z, terrainAt(x, z), s, 11 + i); colliders.push({ x, z, r: 0.3 * s }); });
    bunting(k, Y, [[187.6, -82.4], [194.0, -84.6], [202.0, -84.6], [208.4, -82.4], [209.6, -74.0]].map(([x, z]) => [x, z]));
    // a bench by Melisa's door, a wheelbarrow of pots, a water trough
    k.at(214.6, terrainAt(214.6, -84.6), -84.6, 0.3).box(0, 0.42, 0, 1.6, 0.08, 0.45, WOOD, { ink: 0.012 }); for (const s of [-1, 1]) k.box(s * 0.65, 0.2, 0, 0.08, 0.4, 0.4, WOOD_D, { ink: 0.006 }); k.free();
    k.at(193.2, Y, -61.0, -0.4).box(0, 0.42, 0, 0.8, 0.3, 1.1, '#5d6470', { rx: -0.15, ink: 0.02 }).add(GEO.cyl, 0, 0.2, 0.62, 0.2, 0.08, 0.2, '#3a3d44', { rz: Math.PI / 2, ink: 0.01 }); for (let i = 0; i < 3; i++) k.add(GEO.cyl, -0.2 + i * 0.2, 0.68, 0, 0.11, 0.18, 0.11, '#c9643f', { ink: 0.006 }); k.free();
    const statics = k.build(group);
    // the glass: one see-through mesh (pale, a little blue) for every pane
    const glassMat = new THREE.MeshToonMaterial({ color: '#cfeef5', gradientMap: TK.grad, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
    const glass = new THREE.Mesh(merge(glassPieces), glassMat); glass.renderOrder = 3; group.add(glass);
    // the flower fields
    const flowers = fields(group, terrainAt);
    // the judging tables' entries (and their ribbons)
    const ents = {}; TABLES.forEach(t => { ents[t.id] = entries(group, t, Y); });
    // the judges' things: a vase of roses on a stool by Polo (they make him sneeze), and, once they're brought, Tomasa's
    // sunflowers and Lola's honey pot (on stools by them)
    const props = {};
    const stool = (k2, top) => { k2.add(GEO.cyl, 0, top / 2, 0, 0.24, top, 0.24, WOOD, { ink: 0.01 }).add(GEO.cyl, 0, top, 0, 0.3, 0.06, 0.3, '#a57d57', { ink: 0.008 }); };
    const propAt = (id, x, z, draw) => { const g = new THREE.Group(); g.position.set(x, Y, z); group.add(g); const k2 = Kit(); stool(k2, 0.55); draw(k2); k2.build(g, { shadow: false }); props[id] = g; return g; };
    propAt('roses', SPOT.polo.x - 1.25, SPOT.polo.z + 0.5, k2 => { k2.add(GEO.cyl, 0, 0.75, 0, 0.12, 0.38, 0.12, '#4c7fd8', { ink: 0.008 }); for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; k2.rod(GEO.cyl6, [0, 0.9, 0], [Math.cos(a) * 0.16, 1.25, Math.sin(a) * 0.16], 0.015, '#4f9a45', 0); k2.add(GEO.ico1, Math.cos(a) * 0.17, 1.3, Math.sin(a) * 0.17, 0.09, 0.08, 0.09, '#d9434f', { ink: 0.006 }); } });
    propAt('sunflowers', SPOT.tomasa.x - 1.15, SPOT.tomasa.z + 0.6, k2 => { k2.add(GEO.cyl, 0, 0.75, 0, 0.13, 0.38, 0.13, '#e6b54a', { ink: 0.008 }); for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.4; k2.rod(GEO.cyl6, [0, 0.9, 0], [Math.cos(a) * 0.2, 1.55, Math.sin(a) * 0.2], 0.02, '#4f9a45', 0); k2.add(GEO.cyl, Math.cos(a) * 0.21, 1.6, Math.sin(a) * 0.21, 0.2, 0.03, 0.2, '#f2c94c', { rx: 1.2, ry: a, ink: 0.006 }).add(GEO.cyl, Math.cos(a) * 0.215, 1.61, Math.sin(a) * 0.215, 0.09, 0.04, 0.09, '#6b4226', { rx: 1.2, ry: a, ink: 0 }); } });
    propAt('honey', SPOT.lola.x + 1.15, SPOT.lola.z + 0.6, k2 => { k2.add(GEO.cyl, 0, 0.75, 0, 0.17, 0.34, 0.17, '#f0c25a', { ink: 0.01 }).add(GEO.cyl, 0, 0.95, 0, 0.18, 0.06, 0.18, '#e2574c', { ink: 0.006 }).add(GEO.cyl6, 0.08, 1.05, 0, 0.02, 0.32, 0.02, '#c9b48e', { rz: 0.3, ink: 0 }); });
    props.sunflowers.visible = false; props.honey.visible = false;
    // the gardeners' bell in the cupola (gray until it rings); the Hush's gray vines over the great greenhouse's door
    const bell = new THREE.Group(); bell.position.set(GREAT.x, Y + 0.05 + great.bellY, GREAT.z); group.add(bell);
    const bellMat = new THREE.MeshToonMaterial({ color: '#8f8c9a', gradientMap: TK.grad, side: THREE.DoubleSide });     // (its mouth is open: from below, the inside shows)
    { const g = new THREE.LatheGeometry([[0, -0.04], [0.44, -0.06], [0.46, -0.02], [0.36, 0.08], [0.3, 0.25], [0.26, 0.48], [0.16, 0.6], [0, 0.62]].map(([x, y]) => new THREE.Vector2(x, y)), 18);     // (bottom to top: normals out, so the ink hull stays behind it)
      const m = new THREE.Mesh(g, bellMat); m.position.y = -0.45; m.castShadow = true; bell.add(m);
      const h = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })); h.scale.setScalar(1.06); h.position.y = -0.47; bell.add(h); }
    const vines = new THREE.Group(); group.add(vines);
    { const vk = Kit(), dz = GREAT.z - GREAT.d / 2 - 0.15;
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI, x = GREAT.x - Math.cos(a) * 1.25, y = Y + 0.3 + Math.sin(a) * 2.6 * ((i % 3) / 3 + 0.4); vk.rod(GEO.cyl6, [GREAT.x + (i % 2 ? 0.8 : -0.8), Y + 0.1, dz], [x, y, dz - 0.05], 0.06, i % 2 ? '#6f6b7a' : '#7d7889', 0.01); vk.add(GEO.cone, x, y, dz - 0.1, 0.06, 0.18, 0.06, '#5a5666', { rz: a, ink: 0 }); }
      vk.build(vines); }
    // the mist across the road on the ridge's north side (until the gong rings), a fallen branch and leaves in it
    const mistG = new THREE.Group(); group.add(mistG);
    const mist = [], R = rng(7);
    for (let i = 0; i < 12; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: i % 2 ? '#bdbac9' : '#a9a6b8', transparent: true, opacity: 0.7, depthWrite: false }));
      const tt = (i / 11 - 0.5) * 14; sp.position.set(MIST.x + tt, terrainAt(MIST.x + tt, MIST.z) + 1 + R() * 2.2, MIST.z + (R() - 0.5) * 3);
      sp.scale.setScalar(4.5 + R() * 3); mistG.add(sp); mist.push({ sp, ph: R() * 6, y0: sp.position.y });
    }
    const mistSolids = [];
    for (let i = -6; i <= 6; i++) mistSolids.push({ x: MIST.x + i * 1.15, z: MIST.z, r: 0.8, id: 'gardens-mist' });
    mistSolids.forEach(s => { s.x0 = s.x; s.z0 = s.z; });
    moving.push(...mistSolids);
    // the garden gate's two wooden leaves (they swing in, toward the valley), and its latch
    const leaves = [-1, 1].map(s => {
      const pv = new THREE.Group(); pv.position.set(GATE.x + s * GATE.w / 2, gy, GATE.z); group.add(pv);
      const lk = Kit(), w = GATE.w / 2 - 0.05;
      for (let i = 0; i < 5; i++) lk.box(-s * (0.18 + i * (w - 0.3) / 4), 0.95, 0, 0.3, 1.7, 0.08, i % 2 ? '#9a6440' : '#8a5636', { ink: 0.012 });
      for (const y of [0.45, 1.45]) lk.box(-s * w / 2, y, 0.06, w, 0.14, 0.06, WOOD_D, { ink: 0.008 });
      lk.rod(GEO.cyl6, [-s * 0.1, 0.45, 0.06], [-s * (w - 0.1), 1.45, 0.06], 0.05, WOOD_D, 0.006);
      if (s > 0) lk.box(-s * (w - 0.1), 1.0, 0.18, 0.4, 0.08, 0.1, '#3d3a3a', { ink: 0.006 });         // the latch bar, on the valley side
      lk.build(pv);
      return { pv, s };
    });
    const gateSolid = { obox: 1, x: GATE.x, z: GATE.z, hw: GATE.w / 2 + 0.1, hd: 0.3, rot: 0, id: 'gardens-gate' };
    moving.push(gateSolid);
    // the valley's edge: a ring of invisible solids just past the floor (not across the road), and walls along the road through the cut
    colliders.push(...rimWalls());
    // little bees round the hives (and two by the gate's roses): dots with wings, buzzing about
    const beeTex = TK.canvasTex(64, 64, c => { c.translate(32, 34); c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.ellipse(-9, -11, 9, 6, -0.5, 0, TAU); c.ellipse(9, -11, 9, 6, 0.5, 0, TAU); c.fill(); c.fillStyle = '#f2c94c'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.ellipse(0, 0, 13, 10, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = INK; c.fillRect(-4, -9, 4, 18); c.fillRect(5, -8, 3, 16); });
    const bees = [];
    const beeHomes = [[SPOT.hives.x, SPOT.hives.z, 9, 3.4], [SPOT.sunflowers.x, SPOT.sunflowers.z, 4, 2.6], [SPOT.lavender.x, SPOT.lavender.z, 4, 3.0], [SPOT.roses.x, SPOT.roses.z, 3, 2.4]];
    for (const [hx, hz, n, r] of beeHomes) for (let i = 0; i < n; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: beeTex, transparent: true, depthWrite: false })); s.scale.setScalar(0.24); group.add(s); bees.push({ s, hx, hz, r, ph: Math.random() * 9, sp: 0.8 + Math.random() * 0.9, y: terrainAt(hx, hz) + 0.9 + Math.random() * 0.8 }); }
    // ---- people
    const people = PEOPLE.map(d => {
      const p = makePerson(d, group, { pose: d.pose || 'idle', gray: !!d.hushed, hushed: !!d.hushed });
      p.y = terrainAt(p.x, p.z); p.judge = d.judge || null; p.fan = !!d.fan; p.story = !!d.story; p.g = d.g || 'f';
      return p;
    });
    // Flora climbs the trellis, again and again, to peek over (until the gate is open)
    const flora = people.find(p => p.id === 'flora');
    flora.climb = { on: true, t: 0 };
    // the valley's things are drawn only near it (from Molinar's square you see the ridge, not this)
    const S = { mistOpen: false, mistK: 1, gateOpen: false, gateK: 0, bellK: 0, bellT: 0, ring: 0, vines: true, vinesK: 1 };
    function setMist(open, instant) { S.mistOpen = !!open; mistSolids.forEach(s => { s.x = open ? 1e5 : s.x0; s.z = open ? 1e5 : s.z0; }); if (instant) { S.mistK = open ? 0 : 1; mistG.visible = !open; } }
    function setGate(open, instant) { S.gateOpen = !!open; gateSolid.x = open ? 1e5 : GATE.x; gateSolid.z = open ? 1e5 : GATE.z; if (instant) S.gateK = open ? 1 : 0; flora.climb.on = !open; }
    function setRibbon(id, on) { if (ents[id]) ents[id].rib.visible = !!on; }
    function setBell(gold, instant) { S.bellT = gold ? 1 : 0; if (instant) S.bellK = S.bellT; }
    function ringBell(sec = 3) { S.ring = sec; }
    function setVines(on, instant) { S.vines = !!on; if (instant) { S.vinesK = on ? 1 : 0; vines.visible = !!on; } }
    function setProp(id, on) { if (props[id]) props[id].visible = !!on; }
    function update(dt, t, you) {
      const near = !!you && Math.hypot(you.x - VALLEY.x, you.z - VALLEY.z) < 150;
      group.visible = near;
      if (!near) { S.mistK = S.mistOpen ? 0 : 1; S.gateK = S.gateOpen ? 1 : 0; S.bellK = S.bellT; return; }
      for (const p of people) if (p !== flora || !flora.climb.on) animatePerson(p, dt, t, you);
      // Flora on the trellis: up, a peek over the hedge, back down (while the gate is shut)
      if (flora.climb.on) {
        flora.climb.t += dt;
        const c = flora.climb.t % 7, up = c < 1.6 ? c / 1.6 : c < 3.6 ? 1 : c < 5 ? 1 - (c - 3.6) / 1.4 : 0;
        const by = terrainAt(SPOT.trellis.x, SPOT.trellis.z);
        flora.x = SPOT.trellis.x - 0.2; flora.z = SPOT.trellis.z - 0.55; flora.y = by + up * 1.3;
        if ((up > 0 && up < 1) !== (flora.pose === 'climb')) flora.set(up > 0 && up < 1 ? 'climb' : 'idle', false);
        flora.root.position.set(flora.x, flora.y, flora.z); flora.root.rotation.y = 0;
        flora.body.rotation.set(0, 0, Math.sin(t * 9) * 0.04 * (up > 0 && up < 1 ? 1 : 0));
        flora.head.rotation.x = up >= 1 ? -0.25 : 0;
      }
      // bees: little loops round their flowers
      for (const b of bees) { b.ph += dt * b.sp; b.s.position.set(b.hx + Math.cos(b.ph) * b.r * Math.sin(b.ph * 0.37), b.y + Math.sin(b.ph * 2.3) * 0.25, b.hz + Math.sin(b.ph * 1.3) * b.r * 0.6); b.s.material.rotation = Math.sin(t * 30 + b.ph) * 0.2; }
      // the mist: drifting while it holds, fading when the gong has rung
      S.mistK = damp(S.mistK, S.mistOpen ? 0 : 1, 1.2, dt);
      mistG.visible = S.mistK > 0.02;
      if (mistG.visible) mist.forEach(m => { m.sp.material.opacity = 0.68 * S.mistK; m.sp.position.y = m.y0 + Math.sin(t * 0.4 + m.ph) * 0.4; });
      // the gate's leaves swing in
      S.gateK = damp(S.gateK, S.gateOpen ? 1 : 0, 3, dt);
      leaves.forEach(l => { l.pv.rotation.y = -l.s * S.gateK * 1.75; });
      // the bell: gray → gold, swinging when it rings
      S.bellK = damp(S.bellK, S.bellT, 1.4, dt);
      bellMat.color.setRGB(lerp(0.56, 0.9, S.bellK), lerp(0.55, 0.68, S.bellK), lerp(0.6, 0.24, S.bellK));
      if (S.ring > 0) { S.ring -= dt; bell.rotation.z = Math.sin(t * 7) * 0.35 * Math.min(1, S.ring); } else bell.rotation.z = damp(bell.rotation.z, 0, 3, dt);
      // the gray vines on the greenhouse door shrivel away
      S.vinesK = damp(S.vinesK, S.vines ? 1 : 0, 2, dt);
      vines.visible = S.vinesK > 0.02; if (vines.visible) vines.scale.set(1, S.vinesK, 1);
    }
    const stats = () => { let tris = 0, calls = 0; group.traverse(o => { if ((o.isMesh || o.isSprite) && o.visible) { calls++; if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) tris += ((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3) * (o.isInstancedMesh ? o.count : 1); } }); return { tris: Math.round(tris), meshes: calls, colliders: colliders.length, people: people.length }; };
    return {
      colliders, platforms: [], moving, group, people, update, stats,
      landmarks: GA.landmarks, objects: { statics, glass, flowers, ents, bell, vines, mistG, leaves, bees, flora, props },
      setMist, setGate, setRibbon, setBell, ringBell, setVines, setProp, Kit, GEO,
      makePerson: (d, o) => makePerson(Object.assign({ look: LOOKS[d.id] || LOOKS.fan1 }, d), group, o),
      get gateOpen() { return S.gateOpen; },
    };
  }
  // the valley's edge: a ring of solids just past the floor (leaving the road's gap), and the road's sides through the cut
  function rimWalls() {
    const out = [];
    for (let a = 0; a < TAU; a += 0.03) {
      const x = VALLEY.x + Math.cos(a) * (VALLEY.rx + 1.5), z = VALLEY.z + Math.sin(a) * (VALLEY.rz + 1.5);
      if (GA.roadDist(x, z) < 4.6) continue;
      if (out.length && Math.hypot(out[out.length - 1].x - x, out[out.length - 1].z - z) < 0.9) continue;
      out.push({ x, z, r: 0.85 });
    }
    // the road from the gate down to the floor, between the cut's banks
    for (let i = 0; i < ROAD.length - 1; i++) {
      const [ax, az] = ROAD[i], [bx, bz] = ROAD[i + 1], len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
      for (let s = 0; s < len; s += 0.9) {
        const x = ax + ux * s, z = az + uz * s;
        if (z < GATE.z + 0.6 || GA.valDist(x, z) < -1.2) continue;
        for (const sd of [-1, 1]) out.push({ x: x - uz * 3.5 * sd, z: z + ux * 3.5 * sd, r: 0.8 });
      }
    }
    return out;
  }
  Object.assign(GA, { build, POSES, PEOPLE, LOOKS, grayOf, Kit, GEO, makePersonDef: personKits, makePerson, animatePerson });     // (port.js builds its people with these)
})();

// ================================================================ words, icons and lines (registered at load)
(() => {
  const GA = GARDENS;
  // the region's words (w.honey comes from shop.js, w.flower from words.js, w.bell from phonk.js, w.garden from adolf.js)
  const NEW_WORDS = [
    { id: 'w.rose', es: 'rosa', pt: 'rosa', de: 'Rose', zh: '[玫瑰|méi gui]', ja: 'バラ', en: 'rose', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'rosas', pt: 'rosas', de: 'Rosen', zh: '[玫瑰|méi gui]', ja: 'バラ' }, cl: { zh: '[朵|duǒ]', ja: '[本|ほん]' }, icon: 'rose', alt: { ja: ['ばら', '[薔薇|ばら]'] } },
    { id: 'w.sunflower', es: 'girasol', pt: 'girassol', de: 'Sonnenblume', zh: '[向日葵|xiàng rì kuí]', ja: 'ひまわり', en: 'sunflower', g: { es: 'm', pt: 'm', de: 'f' }, pl: { es: 'girasoles', pt: 'girassóis', de: 'Sonnenblumen', zh: '[向日葵|xiàng rì kuí]', ja: 'ひまわり' }, cl: { zh: '[朵|duǒ]', ja: '[本|ほん]' }, icon: 'sunflower', alt: { ja: ['ヒマワリ', '[向日葵|ひまわり]'] } },
    { id: 'w.tulip', es: 'tulipán', pt: 'tulipa', de: 'Tulpe', zh: '[郁金香|yù jīn xiāng]', ja: 'チューリップ', en: 'tulip', g: { es: 'm', pt: 'f', de: 'f' }, pl: { es: 'tulipanes', pt: 'tulipas', de: 'Tulpen', zh: '[郁金香|yù jīn xiāng]', ja: 'チューリップ' }, cl: { zh: '[朵|duǒ]', ja: '[本|ほん]' }, icon: 'tulip' },
    { id: 'w.lavender', es: 'lavanda', pt: 'lavanda', de: 'Lavendel', zh: '[薰衣草|xūn yī cǎo]', ja: 'ラベンダー', en: 'lavender', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'lavandas', pt: 'lavandas', de: 'Lavendel', zh: '[薰衣草|xūn yī cǎo]', ja: 'ラベンダー' }, icon: 'lavender' },
    { id: 'w.bee', es: 'abeja', pt: 'abelha', de: 'Biene', zh: '[蜜蜂|mì fēng]', ja: 'ハチ', en: 'bee', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'abejas', pt: 'abelhas', de: 'Bienen', zh: '[蜜蜂|mì fēng]', ja: 'ハチ' }, cl: { zh: '[只|zhī]', ja: '[匹|ひき]' }, icon: 'bee', alt: { ja: ['はち', '[蜂|はち]', 'ミツバチ'] } },
    { id: 'w.hive', es: 'colmena', pt: 'colmeia', de: 'Bienenstock', zh: '[蜂箱|fēng xiāng]', ja: '[巣箱|すばこ]', en: 'beehive', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'colmenas', pt: 'colmeias', de: 'Bienenstöcke', zh: '[蜂箱|fēng xiāng]', ja: '[巣箱|すばこ]' }, cl: { zh: '[个|gè]', ja: '[個|こ]' }, icon: 'hive', alt: { de: ['Bienenkorb'] } },
    { id: 'w.greenhouse', es: 'invernadero', pt: 'estufa', de: 'Gewächshaus', zh: '[温室|wēn shì]', ja: '[温室|おんしつ]', en: 'greenhouse', g: { es: 'm', pt: 'f', de: 'n' }, pl: { es: 'invernaderos', pt: 'estufas', de: 'Gewächshäuser', zh: '[温室|wēn shì]', ja: '[温室|おんしつ]' }, cl: { zh: '[座|zuò]', ja: '[棟|とう]' }, icon: 'greenhouse' },
  ];
  // climb: Mimo learns it from Flora on the trellis (the battle registers the same verb: whichever comes first keeps its object, and gets these)
  // (no «trepa» in Portuguese: in Brazil it's slang for something else entirely)
  const CLIMB = { id: 'v.climb', kind: 'verb', es: 'trepa', pt: 'sobe', de: 'kletter', zh: '[爬|pá]', ja: '[登|のぼ]って', en: 'climb', icon: 'climb',
    alt: { es: ['trepe', 'sube', 'suba', 'escala', 'trepá', 'súbete'], pt: ['suba', 'escala', 'escale', 'subir'], de: ['klettere', 'klettert', 'klettern', 'kletterst'], zh: ['[爬上去|pá shàng qù]', '[往上爬|wǎng shàng pá]', '[爬上|pá shàng]'], ja: ['[登|のぼ]る', '[上|のぼ]って', 'よじ[登|のぼ]って', 'のぼれ'] } };
  function registerWords() {
    if (typeof LEX === 'undefined') return;
    LEX.register(NEW_WORDS.filter(w => !LEX.item(w.id)).map(w => Object.assign({ kind: 'word' }, w)));
    const it = LEX.item('v.climb');
    if (!it) LEX.register([CLIMB]);
    else { it.icon = 'climb'; it.alt = it.alt || {}; for (const l of Object.keys(CLIMB.alt)) it.alt[l] = Array.from(new Set([...(it.alt[l] || []), ...CLIMB.alt[l]])); for (const l of ['es', 'pt', 'de', 'zh', 'ja']) if (!it[l]) it[l] = CLIMB[l]; }
    // zh / ja for words other files made before CJK (honey: the shop's; the garden: Adi's)
    const fill = (id, zh, ja) => { const w = LEX.item(id); if (w) { if (!w.zh) w.zh = zh; if (!w.ja) w.ja = ja; } };
    fill('w.honey', '[蜂蜜|fēng mì]', 'はちみつ'); fill('w.garden', '[花园|huā yuán]', '[庭|にわ]');
    if (typeof CJK !== 'undefined' && CJK.addSource) for (const w of NEW_WORDS.concat([CLIMB])) { try { CJK.addSource(w.zh); CJK.addSource(w.ja); } catch (e) { /* the dictionary is optional */ } }
  }
  registerWords();
  // icons (ICONS.add: drawn twice, pass 0 the paper border, pass 1 colors and ink, in a 100 × 100 box)
  if (typeof ICONS !== 'undefined') {
    const add = (name, fn) => { if (!ICONS.keys.includes(name)) ICONS.add(name, fn); };
    add('rose', (c, p, h) => { h.shape(c, p, h.rr(-3, 0, 6, 40, 2), '#4f9a45'); h.shape(c, p, h.ell(-14, 14, 12, 6, -0.5), '#5fae4f'); h.shape(c, p, h.ell(0, -14, 24, 22), '#d9434f'); h.shape(c, p, h.ell(2, -18, 12, 10), '#b8343f'); if (p) { c.beginPath(); c.arc(2, -16, 6, 0.4, 4.4); c.lineWidth = 2.5; c.strokeStyle = 'rgba(43,34,53,0.55)'; c.stroke(); } });
    add('sunflower', (c, p, h) => { h.shape(c, p, h.rr(-3, 4, 6, 40, 2), '#4f9a45'); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; h.shape(c, p, h.ell(Math.cos(a) * 22, -12 + Math.sin(a) * 22, 10, 5, a), '#f2c94c'); } h.shape(c, p, h.ell(0, -12, 15, 15), '#6b4226'); });
    add('tulip', (c, p, h) => { h.shape(c, p, h.rr(-3, 0, 6, 40, 2), '#4f9a45'); h.shape(c, p, h.ell(12, 18, 14, 6, -0.7), '#5fae4f'); h.shape(c, p, c2 => { c2.moveTo(-20, -30); c2.lineTo(-10, -14); c2.lineTo(0, -32); c2.lineTo(10, -14); c2.lineTo(20, -30); c2.quadraticCurveTo(24, 6, 0, 6); c2.quadraticCurveTo(-24, 6, -20, -30); c2.closePath(); }, '#e2574c'); });
    add('lavender', (c, p, h) => { for (const [x, r] of [[-14, -0.25], [0, 0], [14, 0.25]]) { h.shape(c, p, h.rr(x - 2, -6, 4, 44, 2), '#7e9a7a'); for (let i = 0; i < 6; i++) h.shape(c, p, h.ell(x + Math.sin(r) * i * 4, -10 - i * 7, 6, 5), i % 2 ? '#9b7fd0' : '#b9a2ff'); } });
    add('bee', (c, p, h) => { h.shape(c, p, h.ell(-10, -16, 14, 10, -0.5), '#e8f6ff'); h.shape(c, p, h.ell(12, -16, 14, 10, 0.5), '#e8f6ff'); h.shape(c, p, h.ell(0, 4, 26, 20), '#f2c94c'); if (p) { c.fillStyle = '#2b2235'; c.fillRect(-12, -14, 7, 36); c.fillRect(4, -14, 7, 36); h.eyes(c, 16, 26, 0, 0.7); } h.shape(c, p, h.poly([[-26, 4], [-38, 0], [-26, 10]]), '#2b2235'); });
    add('hive', (c, p, h) => { h.shape(c, p, h.rr(-26, -6, 52, 40, 4), '#f6f1e6'); h.shape(c, p, h.rr(-30, -18, 60, 14, 3), '#c9b48e'); h.shape(c, p, h.rr(-26, 8, 52, 4, 1), '#e2d6be'); h.shape(c, p, h.rr(-8, 24, 16, 5, 2), '#2b2235'); });
    add('greenhouse', (c, p, h) => { h.shape(c, p, c2 => { c2.moveTo(-36, 34); c2.lineTo(-36, -2); c2.lineTo(0, -32); c2.lineTo(36, -2); c2.lineTo(36, 34); c2.closePath(); }, '#cfeef5'); if (p) { c.strokeStyle = '#ffffff'; c.lineWidth = 3; [-18, 0, 18].forEach(x => { c.beginPath(); c.moveTo(x, 34); c.lineTo(x, x === 0 ? -32 : -16); c.stroke(); }); c.beginPath(); c.moveTo(-36, 10); c.lineTo(36, 10); c.stroke(); } h.shape(c, p, h.ell(-20, 26, 8, 8), '#5fae4f'); h.shape(c, p, h.ell(18, 24, 10, 10), '#4f9a45'); });
    add('climb', (c, p, h) => { for (let i = 0; i < 4; i++) h.shape(c, p, h.rr(-30, 30 - i * 20, 60, 4, 2), '#c9a66b'); h.shape(c, p, h.rr(-30, -36, 5, 72, 2), '#8a6440'); h.shape(c, p, h.rr(25, -36, 5, 72, 2), '#8a6440'); h.shape(c, p, h.ell(2, -6, 14, 14), '#7ff7ea'); h.shape(c, p, h.ell(-4, -22, 4, 9, -0.3), '#7ff7ea'); h.shape(c, p, h.ell(8, -22, 4, 9, 0.3), '#7ff7ea'); if (p) h.eyes(c, -3, 7, -5, 0.6); });
  }

  // ---------------------------------------------------------------- lines: T(en, es, pt, de, zh, ja). The en is the weave's (slots).
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const GL = {
    // Flora, the young gardener stuck outside the gate: quick, a bit cross, warm («tú»)
    'f.hello': T('{w.hello}! I’m Flora. I live in the Bloom Gardens… but the gate is locked from inside, and nobody answers!',
      '¡Hola! Soy Flora. Vivo en los Jardines en Flor… ¡pero la puerta está cerrada por dentro y nadie contesta!',
      'Oi! Eu sou a Flora. Eu moro nos Jardins em Flor… mas o portão está trancado por dentro e ninguém responde!',
      'Hallo! Ich bin Flora. Ich wohne in den Blütengärten… aber das Tor ist von innen zu, und keiner antwortet!',
      '[你好|nǐ hǎo] ！ [我|wǒ] [是|shì] [芙洛拉|Fú luò lā] 。 [我|wǒ] [住|zhù] [在|zài] [花园谷|Huā yuán gǔ] … [可是|kě shì] [门|mén] [从|cóng] [里面|lǐ miàn] [锁上|suǒ shang] [了|le] ， [没有|méi yǒu] [人|rén] [回答|huí dá] ！',
      'こんにちは ！ わたし は フローラ 。 [花園|はなぞの] に [住|す]んで いる の 。 でも [門|もん] が [中|なか] から [閉|し]まって いて 、 だれ も [答|こた]えない の ！'),
    'f.climb': T('I keep climbing the trellis to look over. Inside, everyone is gray and quiet! But up at the top it’s too thin for me.',
      'Trepo y trepo por el enrejado para mirar. ¡Adentro todos están grises y callados! Pero arriba es muy delgado para mí.',
      'Eu subo e subo na treliça pra olhar. Lá dentro, todo mundo está cinza e calado! Mas lá em cima é fino demais pra mim.',
      'Ich klettere immer wieder am Rosengitter hoch und schaue rüber. Drinnen sind alle grau und still! Aber oben ist es zu dünn für mich.',
      '[我|wǒ] [一直|yī zhí] [爬|pá] [上|shàng] [花架|huā jià] [往|wǎng] [里|lǐ] [看|kàn] 。 [里面|lǐ miàn] [大家|dà jiā] [都|dōu] [是|shì] [灰色|huī sè] [的|de] ， [一|yī] [句|jù] [话|huà] [也|yě] [不|bù] [说|shuō] ！ [可是|kě shì] [上面|shàng miàn] [太|tài] [细|xì] [了|le] ， [我|wǒ] [过不去|guò bu qù] 。',
      'わたし 、 なんど も [棚|たな] を [登|のぼ]って のぞく の 。 [中|なか] は みんな [灰色|はいいろ] で 、 [静|しず]か ！ でも [上|うえ] は [細|ほそ]すぎて 、 わたし には [越|こ]えられない 。'),
    'f.small': T('Your little {c.friend} watched me! It’s small and light… it can climb over and lift the latch!',
      '¡Tu amiguito me estaba mirando! Es chiquito y ligero… ¡puede trepar y abrir el cerrojo!',
      'O seu amiguinho estava me olhando! Ele é pequeno e leve… pode subir e abrir a tranca!',
      'Dein kleiner Freund hat mir zugeschaut! Er ist klein und leicht… er kann hochklettern und den Riegel aufmachen!',
      '[你|nǐ] [的|de] [小|xiǎo] [朋友|péng you] [一直|yī zhí] [在|zài] [看|kàn] [我|wǒ] ！ [它|tā] [又|yòu] [小|xiǎo] [又|yòu] [轻|qīng] … [它|tā] [能|néng] [爬|pá] [过去|guò qù] [打开|dǎ kāi] [门闩|mén shuān] ！',
      'あなた の お[友達|ともだち] 、 わたし を [見|み]て た よ ！ [小|ちい]さくて [軽|かる]い から … [登|のぼ]って 、 かんぬき を [開|あ]けられる ！'),
    'f.open': T('You did it! The gate’s open! Come on in. Melisa, the head beekeeper, will know what to do.',
      '¡Lo lograron! ¡La puerta está abierta! Pasen. Melisa, la apicultora mayor, va a saber qué hacer.',
      'Vocês conseguiram! O portão está aberto! Entrem. A Melisa, a apicultora-chefe, vai saber o que fazer.',
      'Ihr habt es geschafft! Das Tor ist offen! Kommt rein. Melisa, die Chefin der Imker, weiß bestimmt, was zu tun ist.',
      '[你们|nǐ men] [做到|zuò dào] [了|le] ！ [门|mén] [开|kāi] [了|le] ！ [进来|jìn lái] [吧|ba] 。 [养蜂人|yǎng fēng rén] [的|de] [头儿|tóu r] [梅丽莎|Méi lì shā] [一定|yī dìng] [知道|zhī dào] [怎么办|zěn me bàn] 。',
      'やった ！ [門|もん] が [開|あ]いた ！ [入|はい]って 。 ハチ[飼|か]い の リーダー 、 メリッサ なら どう すれば いい か わかる よ 。'),
    'f.chat': T('I’ll never lock that gate again. Never!', '¡Nunca más cierro esa puerta con llave! ¡Nunca!', 'Nunca mais eu tranco esse portão. Nunca!', 'Ich schließe das Tor nie wieder ab. Nie!',
      '[我|wǒ] [再|zài] [也|yě] [不|bù] [锁|suǒ] [那|nà] [扇|shàn] [门|mén] [了|le] ！', 'もう [二度|にど] と あの [門|もん] に カギ を かけない ！'),
    // Melisa, the head beekeeper: warm, quick, a little proud of her show («tú»; the two of you «ustedes»)
    'm.hello': T('{w.hello}, {w.hello}! Visitors, on show day! Welcome to the Bloom Gardens. I’m Melisa, the head beekeeper.',
      '¡Hola, hola! ¡Visitas, en el día de la feria! Bienvenidos a los Jardines en Flor. Soy Melisa, la apicultora mayor.',
      'Oi, oi! Visita, no dia da feira! Bem-vindos aos Jardins em Flor. Eu sou a Melisa, a apicultora-chefe.',
      'Hallo, hallo! Besuch, am Tag der Blumenschau! Willkommen in den Blütengärten. Ich bin Melisa, die Chefin der Imker.',
      '[你好|nǐ hǎo] ， [你好|nǐ hǎo] ！ [花展|huā zhǎn] [这天|zhè tiān] [来|lái] [了|le] [客人|kè rén] ！ [欢迎|huān yíng] [来到|lái dào] [花园谷|Huā yuán gǔ] 。 [我|wǒ] [是|shì] [梅丽莎|Méi lì shā] ， [养蜂人|yǎng fēng rén] [的|de] [头儿|tóu r] 。',
      'こんにちは 、 こんにちは ！ フラワーショー の [日|ひ] に お[客|きゃく]さん ！ [花園|はなぞの] へ ようこそ 。 わたし は メリッサ 、 ハチ[飼|か]い の リーダー です 。'),
    'm.hush': T('Today is our flower show. The judges were looking and smelling and tasting… and then the gray came over the hill. Now they can’t say a word.',
      'Hoy es nuestra feria de las flores. Los jueces estaban mirando, oliendo, probando… y de repente lo gris bajó por la colina. Ahora no pueden decir ni una palabra.',
      'Hoje é a nossa feira das flores. Os jurados estavam olhando, cheirando, provando… e de repente o cinza desceu o morro. Agora eles não conseguem dizer nem uma palavra.',
      'Heute ist unsere Blumenschau. Die Richter haben geschaut, gerochen, probiert… und dann kam das Grau über den Hügel. Jetzt sagen sie kein Wort mehr.',
      '[今天|jīn tiān] [是|shì] [我们|wǒ men] [的|de] [花展|huā zhǎn] 。 [评委们|píng wěi men] [正在|zhèng zài] [看|kàn] 、 [闻|wén] 、 [尝|cháng] … [忽然|hū rán] [灰色|huī sè] [从|cóng] [山|shān] [上|shàng] [下来|xià lái] [了|le] 。 [现在|xiàn zài] [他们|tā men] [一|yī] [句|jù] [话|huà] [也|yě] [说不出来|shuō bu chū lái] 。',
      '[今日|きょう] は フラワーショー の [日|ひ] です 。 [審査員|しんさいん] が [見|み]て 、 かいで 、 [味見|あじみ] を して いたら … [急|きゅう]に [灰色|はいいろ] が [丘|おか] から [来|き]ました 。 [今|いま] は [一言|ひとこと] も [話|はな]せません 。'),
    'm.bell': T('At the end of every show, we ring the gardeners’ {w.bell} at the top of the great {w.greenhouse}. But the Hush has wrapped its door in gray vines.',
      'Al final de cada feria tocamos la campana de los jardineros, arriba del gran invernadero. Pero el Silencio cubrió su puerta con enredaderas grises.',
      'No fim de cada feira, a gente toca o sino dos jardineiros, no alto da grande estufa. Mas o Silêncio cobriu a porta dela com trepadeiras cinza.',
      'Am Ende jeder Blumenschau läuten wir die Glocke der Gärtner, oben im großen Gewächshaus. Aber die Stille hat seine Tür mit grauen Ranken zugewachsen.',
      '[每次|měi cì] [花展|huā zhǎn] [结束|jié shù] [的|de] [时候|shí hou] ， [我们|wǒ men] [都|dōu] [敲响|qiāo xiǎng] [大|dà] [温室|wēn shì] [顶上|dǐng shang] [的|de] [园丁|yuán dīng] [之|zhī] [钟|zhōng] 。 [可是|kě shì] [寂静|jì jìng] [用|yòng] [灰色|huī sè] [的|de] [藤蔓|téng màn] [缠住|chán zhù] [了|le] [它|tā] [的|de] [门|mén] 。',
      'ショー の [終|お]わり に は いつも 、 [大温室|だいおんしつ] の [上|うえ] の 「 [庭師|にわし] の [鐘|かね] 」 を [鳴|な]らします 。 でも [静寂|せいじゃく] が [灰色|はいいろ] の つる で その [扉|とびら] を ふさいで しまいました 。'),
    'm.ask': T('Can you help? The judges need what they like. They can’t tell me… but you can look at each one and tell me what they like.',
      '¿Me ayudan? Los jueces necesitan lo que les gusta. No me lo pueden decir… pero tú puedes mirar a cada uno y decirme qué le gusta.',
      'Vocês me ajudam? Os jurados precisam do que eles gostam. Eles não conseguem me dizer… mas você pode olhar cada um e me dizer do que ele gosta.',
      'Helft ihr mir? Die Richter brauchen, was sie mögen. Sie können es mir nicht sagen… aber du kannst sie dir anschauen und mir sagen, was sie mögen.',
      '[你们|nǐ men] [能|néng] [帮|bāng] [我|wǒ] [吗|ma] ？ [评委们|píng wěi men] [需要|xū yào] [他们|tā men] [喜欢|xǐ huan] [的|de] [东西|dōng xi] 。 [他们|tā men] [说不出来|shuō bu chū lái] … [可是|kě shì] [你|nǐ] [可以|kě yǐ] [看看|kàn kan] [每|měi] [个|gè] [人|rén] ， [告诉|gào su] [我|wǒ] [他们|tā men] [喜欢|xǐ huan] [什么|shén me] 。',
      '[手伝|てつだ]って くれます か ？ [審査員|しんさいん] に は [好|す]きな もの が [必要|ひつよう] です 。 [本人|ほんにん] は [言|い]えません … でも あなた なら 、 [一人|ひとり] ずつ [見|み]て 、 [何|なに] が [好|す]き か [教|おし]えて くれます よ ね 。'),
    'm.again': T('Look at each judge: what do they like? Tell me, and I’ll bring it.',
      'Mira a cada juez: ¿qué le gusta? Dímelo, y yo se lo traigo: «A Tomasa le gustan…»',
      'Olha cada jurado: do que ele gosta? Me diz, e eu levo: «A Tomasa gosta de…»',
      'Schau dir jeden Richter an: Was mag er? Sag es mir, dann bringe ich es: «Tomasa mag…»',
      '[看看|kàn kan] [每|měi] [位|wèi] [评委|píng wěi] ： [他们|tā men] [喜欢|xǐ huan] [什么|shén me] ？ [告诉|gào su] [我|wǒ] ， [我|wǒ] [去|qù] [拿|ná] ： “ [她|tā] [喜欢|xǐ huan] … ”',
      '[審査員|しんさいん] を [一人|ひとり] ずつ [見|み]て 、 [何|なに] が [好|す]き か [教|おし]えて 。 [持|も]って きます ： 「 … が [好|す]き です 」'),
    'm.contest': T('Now they can talk… but they still can’t decide! Which one is bigger, prettier, sweeter? Help each judge choose.',
      'Ya pueden hablar… ¡pero no se deciden! ¿Cuál es más grande, más bonito, más dulce? Ayuda a cada juez a elegir.',
      'Agora eles conseguem falar… mas ainda não conseguem decidir! Qual é maior, mais bonito, mais doce? Ajuda cada jurado a escolher.',
      'Jetzt können sie reden… aber sie können sich nicht entscheiden! Was ist größer, schöner, süßer? Hilf jedem Richter beim Wählen.',
      '[现在|xiàn zài] [他们|tā men] [能|néng] [说话|shuō huà] [了|le] … [可是|kě shì] [还是|hái shi] [选不出来|xuǎn bu chū lái] ！ [哪个|nǎ ge] [更|gèng] [大|dà] 、 [更|gèng] [漂亮|piào liang] 、 [更|gèng] [甜|tián] ？ [帮|bāng] [每|měi] [位|wèi] [评委|píng wěi] [选|xuǎn] [一下|yī xià] 。',
      '[話|はな]せる よう に なった けど … まだ [決|き]められない の ！ どっち が [大|おお]きい ？ きれい ？ [甘|あま]い ？ [審査員|しんさいん] が [選|えら]ぶ の を [手伝|てつだ]って 。'),
    'm.huh': T('Hmm? I don’t understand. What does she like? Look again: her hat, her hands, where she’s looking…',
      '¿Cómo? No entiendo. ¿Qué le gusta? Mira bien: su sombrero, sus manos, adónde mira…',
      'Como? Não entendi. Do que ele gosta? Olha bem: o chapéu, as mãos, pra onde está olhando…',
      'Wie bitte? Das verstehe ich nicht. Was mag er? Schau genau hin: der Hut, die Hände, wohin er schaut…',
      '[什么|shén me] ？ [我|wǒ] [不|bù] [懂|dǒng] 。 [喜欢|xǐ huan] [什么|shén me] ？ [再|zài] [看看|kàn kan] ： [帽子|mào zi] 、 [手|shǒu] 、 [在|zài] [看|kàn] [哪里|nǎ lǐ] …',
      'え ？ わかりません 。 [何|なに] が [好|す]き ？ よく [見|み]て ： [帽子|ぼうし] 、 [手|て] 、 どこ を [見|み]て いる か …'),
    'm.showDone': T('Listen to them! They’re talking again. The flower show is saved! And look: the gray vines on the {w.greenhouse} door… they’re falling away!',
      '¡Escúchalos! Ya hablan otra vez. ¡La feria está salvada! Y mira: las enredaderas grises de la puerta del invernadero… ¡se están cayendo!',
      'Escuta só! Eles estão falando de novo. A feira está salva! E olha: as trepadeiras cinza da porta da estufa… estão caindo!',
      'Hör nur! Sie reden wieder. Die Blumenschau ist gerettet! Und schau: die grauen Ranken an der Tür vom Gewächshaus… sie fallen ab!',
      '[你|nǐ] [听|tīng] ！ [他们|tā men] [又|yòu] [说话|shuō huà] [了|le] 。 [花展|huā zhǎn] [得救|dé jiù] [了|le] ！ [你|nǐ] [看|kàn] ： [温室|wēn shì] [门|mén] [上|shàng] [的|de] [灰色|huī sè] [藤蔓|téng màn] … [正在|zhèng zài] [掉|diào] [下来|xià lái] ！',
      '[聞|き]いて ！ みんな また [話|はな]して いる 。 ショー は [大丈夫|だいじょうぶ] ！ ほら 、 [温室|おんしつ] の [扉|とびら] の [灰色|はいいろ] の つる が … [落|お]ちて いく ！'),
    'm.green': T('The {w.bell} hangs at the very top of the dome. Something buzzes in there… something big. Be careful!',
      'La campana cuelga arriba de todo, en la cúpula. Algo zumba ahí adentro… algo grande. ¡Cuidado!',
      'O sino fica bem no alto da cúpula. Tem alguma coisa zumbindo lá dentro… uma coisa grande. Cuidado!',
      'Die Glocke hängt ganz oben in der Kuppel. Da drin summt etwas… etwas Großes. Seid vorsichtig!',
      '[钟|zhōng] [挂|guà] [在|zài] [圆顶|yuán dǐng] [的|de] [最|zuì] [上面|shàng miàn] 。 [里面|lǐ miàn] [有|yǒu] [东西|dōng xi] [在|zài] [嗡嗡|wēng wēng] [响|xiǎng] … [一个|yī gè] [大|dà] [东西|dōng xi] 。 [小心|xiǎo xīn] ！',
      '[鐘|かね] は ドーム の いちばん [上|うえ] に あります 。 [中|なか] で [何|なに] か が ブンブン いって います … [大|おお]きな [何|なに] か が 。 [気|き] を つけて ！'),
    'm.fourth': T('The fourth {w.bell}! Hear that? The whole valley is singing. Your friend Noa was here too, you know. She loved our lavender {w.honey}.',
      '¡La cuarta campana! ¿La oyen? Todo el valle canta. Tu amiga Noa también estuvo aquí, ¿sabes? Le encantaba nuestra miel de lavanda.',
      'O quarto sino! Estão ouvindo? O vale inteiro está cantando. A sua amiga Noa também esteve aqui, sabia? Ela adorava o nosso mel de lavanda.',
      'Die vierte Glocke! Hört ihr das? Das ganze Tal singt. Deine Freundin Noa war übrigens auch hier. Sie mochte unseren Lavendelhonig so gern.',
      '[第四|dì sì] [个|gè] [钟|zhōng] ！ [你们|nǐ men] [听到|tīng dào] [了|le] [吗|ma] ？ [整个|zhěng gè] [山谷|shān gǔ] [都|dōu] [在|zài] [唱歌|chàng gē] 。 [你|nǐ] [的|de] [朋友|péng you] [诺娅|Nuò yà] [也|yě] [来|lái] [过|guo] [这里|zhè lǐ] 。 [她|tā] [最|zuì] [喜欢|xǐ huan] [我们|wǒ men] [的|de] [薰衣草|xūn yī cǎo] [蜂蜜|fēng mì] 。',
      '[四番目|よんばんめ] の [鐘|かね] ！ [聞|き]こえます か ？ [谷|たに] [全体|ぜんたい] が [歌|うた]って います 。 あなた の お[友達|ともだち] の ノア も ここ に [来|き]ました よ 。 ラベンダー の はちみつ が [大好|だいす]き でした 。'),
    'm.next': T('She went on to the Frost Peaks, the snowy mountains to the north-east. There’s an old clock workshop up there. Wrap up warm!',
      'Se fue a los Picos Helados, las montañas nevadas del noreste. Allá arriba hay un viejo taller de relojes. ¡Abríguense bien!',
      'Ela foi para os Picos Gelados, as montanhas nevadas do nordeste. Lá em cima tem uma velha oficina de relógios. Se agasalhem bem!',
      'Sie ist weiter zu den Frostgipfeln, den verschneiten Bergen im Nordosten. Da oben gibt es eine alte Uhrenwerkstatt. Zieht euch warm an!',
      '[她|tā] [去|qù] [了|le] [霜峰|Shuāng fēng] ， [东北|dōng běi] [边|biān] [的|de] [雪山|xuě shān] 。 [山|shān] [上|shàng] [有|yǒu] [一|yī] [家|jiā] [老|lǎo] [钟表|zhōng biǎo] [工坊|gōng fáng] 。 [多|duō] [穿|chuān] [一点|yī diǎn] ！',
      'ノア は [北東|ほくとう] の [雪山|ゆきやま] 、 [霜|しも] の [峰|みね] へ [行|い]きました 。 [上|うえ] に は [古|ふる]い [時計|とけい] の [工房|こうぼう] が あります 。 [暖|あたた]かく して ね ！'),
    // (DESIGN.md 16: heard before you're asked, whole in the language with the English under it) Flora as she climbs, before Mimo
    // asks what she's doing; Melisa showing how to say what someone likes (and doesn't), before you tell her about the judges
    'f.demo': T('Up we go! Climb, Flora, climb!', '¡Arriba! ¡Trepa, Flora, trepa!', 'Pra cima! Sobe, Flora, sobe!', 'Nach oben! Kletter, Flora, kletter!',
      '[往上|wǎng shàng] ！ [爬|pá] ， [芙洛拉|Fú luò lā] ， [爬|pá] ！', 'よいしょ ！ [登|のぼ]って 、 フローラ 、 [登|のぼ]って ！'),
    'm.demo': T('Like this: my grandma likes {w.tulip:pl}, and my dog doesn’t like {w.bee:pl}. Tell me what each judge likes, like that.',
      'Así: a mi abuela le gustan los tulipanes, y a mi perro no le gustan las abejas. Dime así qué le gusta a cada juez.',
      'Assim: a minha avó gosta de tulipas, e o meu cachorro não gosta de abelhas. Me diz assim do que cada jurado gosta.',
      'So: Meine Oma mag Tulpen, und mein Hund mag keine Bienen. Sag mir so, was jeder Richter mag.',
      '[比如|bǐ rú] ： [我|wǒ] [奶奶|nǎi nai] [喜欢|xǐ huan] [郁金香|yù jīn xiāng] ， [我|wǒ] [的|de] [狗|gǒu] [不|bù] [喜欢|xǐ huan] [蜜蜂|mì fēng] 。 [你|nǐ] [就|jiù] [这样|zhè yàng] [告诉|gào su] [我|wǒ] [每|měi] [个|gè] [评委|píng wěi] [喜欢|xǐ huan] [什么|shén me] 。',
      'たとえば 、 わたし の おばあちゃん は チューリップ が [好|す]き です 。 うち の [犬|いぬ] は ハチ が [嫌|きら]い です 。 そんな ふう に 、 [審査員|しんさいん] の [好|す]き な もの を [教|おし]えて ください 。'),
    'm.chat': T('The bees are dancing again. That means the flowers are happy.', 'Las abejas bailan otra vez. Eso quiere decir que las flores están contentas.', 'As abelhas estão dançando de novo. Isso quer dizer que as flores estão felizes.', 'Die Bienen tanzen wieder. Das heißt, die Blumen sind glücklich.',
      '[蜜蜂|mì fēng] [又|yòu] [跳舞|tiào wǔ] [了|le] 。 [这|zhè] [说明|shuō míng] [花|huā] [很|hěn] [开心|kāi xīn] 。', 'ハチ が また [踊|おど]って います 。 [花|はな] が [喜|よろこ]んで いる [証拠|しょうこ] です 。'),
  };
  // the judges: hushed (the *starred* words survive the Hush: they're the clue), back to themselves, their contest, the ribbon, chat
  const JL = {
    tomasa: {
      hushed: T('*Yellow*… so *tall*… *sunflowers*… I…', '*Amarillos*… tan *altos*… los *girasoles*… yo…', '*Amarelos*… tão *altos*… os *girassóis*… eu…', '*Gelb*… so *groß*… *Sonnenblumen*… ich…', '[黄色|huáng sè] … [好|hǎo] [高|gāo] … [向日葵|xiàng rì kuí] … [我|wǒ] …', '[黄色|きいろ]くて … [高|たか]くて … ひまわり … わたし …'),
      back: T('Sunflowers! Thank you, dear. Now I can think again. I judge the biggest flower.', '¡Girasoles! Gracias, querida. Ya puedo pensar otra vez. Yo juzgo la flor más grande.', 'Girassóis! Obrigada, querida. Agora eu consigo pensar de novo. Eu julgo a flor maior.', 'Sonnenblumen! Danke, Liebes. Jetzt kann ich wieder denken. Ich bewerte die größte Blume.',
        '[向日葵|xiàng rì kuí] ！ [谢谢|xiè xie] [你|nǐ] ， [亲爱|qīn ài] [的|de] 。 [我|wǒ] [又|yòu] [能|néng] [想|xiǎng] [事情|shì qing] [了|le] 。 [我|wǒ] [评|píng] [最|zuì] [大|dà] [的|de] [花|huā] 。', 'ひまわり ！ ありがとう 。 また [考|かんが]えられる わ 。 わたし は いちばん [大|おお]きい [花|はな] の [審査員|しんさいん] よ 。'),
      ask: T('Two {w.rose:pl}: the red one and the white one. Which is bigger? My eyes aren’t what they used to be.', 'Dos rosas: la roja y la blanca. ¿Cuál es más grande? Mis ojos ya no son lo que eran.', 'Duas rosas: a vermelha e a branca. Qual é maior? Meus olhos já não são o que eram.', 'Zwei Rosen: die rote und die weiße. Welche ist größer? Meine Augen sind nicht mehr so gut.',
        '[两|liǎng] [朵|duǒ] [玫瑰|méi gui] ： [红|hóng] [的|de] [和|hé] [白|bái] [的|de] 。 [哪|nǎ] [朵|duǒ] [大|dà] ？ [我|wǒ] [的|de] [眼睛|yǎn jing] [不|bù] [太|tài] [好|hǎo] [了|le] 。', 'バラ が [二本|にほん] ： [赤|あか]い の と [白|しろ]い の 。 どっち が [大|おお]きい ？ [目|め] が もう よく ない の 。'),
      won: T('Yes, yes! The red {w.rose} is bigger. The blue ribbon goes to the red one!', '¡Sí, sí! La rosa roja es más grande. ¡El listón azul es para la roja!', 'Sim, sim! A rosa vermelha é maior. A fita azul vai para a vermelha!', 'Ja, ja! Die rote Rose ist größer. Die blaue Schleife bekommt die rote!',
        '[对|duì] ， [对|duì] ！ [红|hóng] [玫瑰|méi gui] [比|bǐ] [白|bái] [玫瑰|méi gui] [大|dà] 。 [蓝|lán] [丝带|sī dài] [给|gěi] [红|hóng] [的|de] ！', 'そう 、 そう ！ [赤|あか]い バラ の ほう が [大|おお]きい 。 [青|あお]い リボン は [赤|あか]い やつ に ！'),
      wrong: T('That one? Look again, dear. Look at the flowers, not the pots.', '¿Esa? Mira otra vez, querida. Mira las flores, no las macetas.', 'Essa? Olha de novo, querida. Olha as flores, não os vasos.', 'Die da? Schau noch mal, Liebes. Schau die Blüten an, nicht die Töpfe.',
        '[那|nà] [朵|duǒ] ？ [再|zài] [看看|kàn kan] ， [亲爱|qīn ài] [的|de] 。 [看|kàn] [花|huā] ， [别|bié] [看|kàn] [花盆|huā pén] 。', 'そっち ？ もう [一度|いちど] [見|み]て 。 [鉢|はち] じゃ なくて 、 [花|はな] を [見|み]る の よ 。'),
      chat: T('Sunflowers follow the sun all day long. Just like me!', 'Los girasoles siguen al sol todo el día. ¡Igual que yo!', 'Os girassóis seguem o sol o dia todo. Igualzinho a mim!', 'Sonnenblumen folgen den ganzen Tag der Sonne. Genau wie ich!',
        '[向日葵|xiàng rì kuí] [一|yī] [整|zhěng] [天|tiān] [都|dōu] [跟着|gēn zhe] [太阳|tài yáng] 。 [跟|gēn] [我|wǒ] [一样|yī yàng] ！', 'ひまわり は [一日中|いちにちじゅう] 、 [太陽|たいよう] を [追|お]いかける の 。 わたし と [同|おな]じ ！'),
    },
    polo: {
      hushed: T('*Achoo*!… the *roses*… *no*… *achoo*!', '¡*Achís*!… las *rosas*… *no*… ¡*achís*!', '*Atchim*!… as *rosas*… *não*… *atchim*!', '*Hatschi*!… die *Rosen*… *nein*… *hatschi*!', '[阿嚏|ā tì] ！ … [玫瑰|méi gui] … [不|bù] … [阿嚏|ā tì] ！', 'ハクション ！ … バラ … いや … ハクション ！'),
      back: T('Ahh… no more {w.rose:pl}. Thank you! I don’t like roses: they make me sneeze. Now then: the prettiest tulip!', 'Ahh… ya no hay rosas. ¡Gracias! No me gustan las rosas: me hacen estornudar. Bueno: ¡el tulipán más bonito!', 'Ahh… sem rosas. Obrigado! Eu não gosto de rosas: elas me fazem espirrar. Bom: a tulipa mais bonita!', 'Ahh… keine Rosen mehr. Danke! Ich mag keine Rosen: Ich muss davon niesen. Also: die schönste Tulpe!',
        '[啊|à] … [没有|méi yǒu] [玫瑰|méi gui] [了|le] 。 [谢谢|xiè xie] ！ [我|wǒ] [不|bù] [喜欢|xǐ huan] [玫瑰|méi gui] ： [它们|tā men] [让|ràng] [我|wǒ] [打|dǎ] [喷嚏|pēn tì] 。 [好|hǎo] [了|le] ： [最|zuì] [漂亮|piào liang] [的|de] [郁金香|yù jīn xiāng] ！', 'ああ … バラ が なくなった 。 ありがとう ！ バラ は [嫌|きら]い なんだ 。 くしゃみ が [出|で]る から 。 さて 、 いちばん きれい な チューリップ だ ！'),
      ask: T('The yellow {w.tulip} or the red one. Which is prettier? Tell me straight.', 'El tulipán amarillo o el rojo. ¿Cuál es más bonito? Dímelo claro.', 'A tulipa amarela ou a vermelha. Qual é mais bonita? Fala sem rodeios.', 'Die gelbe Tulpe oder die rote. Welche ist schöner? Sag es ehrlich.',
        '[黄|huáng] [郁金香|yù jīn xiāng] [还是|hái shi] [红|hóng] [郁金香|yù jīn xiāng] 。 [哪个|nǎ ge] [更|gèng] [漂亮|piào liang] ？ [直接|zhí jiē] [告诉|gào su] [我|wǒ] 。', '[黄色|きいろ]い チューリップ か 、 [赤|あか]い の か 。 どっち が きれい ？ はっきり [言|い]って くれ 。'),
      won: T('Agreed! The yellow {w.tulip} is prettier. The red one is… tired.', '¡De acuerdo! El tulipán amarillo es más bonito. El rojo está… cansado.', 'Concordo! A tulipa amarela é mais bonita. A vermelha está… cansada.', 'Einverstanden! Die gelbe Tulpe ist schöner. Die rote ist… müde.',
        '[同意|tóng yì] ！ [黄|huáng] [郁金香|yù jīn xiāng] [比|bǐ] [红|hóng] [的|de] [漂亮|piào liang] 。 [红|hóng] [的|de] … [累|lèi] [了|le] 。', 'そう だ な ！ [黄色|きいろ]い チューリップ の ほう が きれい だ 。 [赤|あか]い の は … [疲|つか]れて いる 。'),
      wrong: T('That one? It’s drooping! Look again.', '¿Ese? ¡Está todo caído! Mira otra vez.', 'Essa? Ela está toda caída! Olha de novo.', 'Die da? Die hängt ja runter! Schau noch mal.',
        '[那个|nà ge] ？ [它|tā] [都|dōu] [垂|chuí] [下来|xià lái] [了|le] ！ [再|zài] [看看|kàn kan] 。', 'そっち ？ しおれて いる じゃ ない か ！ もう [一度|いちど] [見|み]て 。'),
      chat: T('Tulips: pretty, and they don’t make me sneeze.', 'Los tulipanes: bonitos, y no me hacen estornudar.', 'Tulipas: bonitas, e não me fazem espirrar.', 'Tulpen: schön, und ich muss nicht niesen.',
        '[郁金香|yù jīn xiāng] ： [漂亮|piào liang] ， [还|hái] [不|bù] [让|ràng] [我|wǒ] [打|dǎ] [喷嚏|pēn tì] 。', 'チューリップ は きれい で 、 くしゃみ も [出|で]ない 。'),
    },
    lola: {
      hushed: T('*Honey*… *sweet*… *mmm*…', '*Miel*… *dulce*… *mmm*…', '*Mel*… *docinho*… *hum*…', '*Honig*… *süß*… *mmm*…', '[蜂蜜|fēng mì] … [甜|tián] … [嗯|ng] …', 'はちみつ … [甘|あま]い … うーん …'),
      back: T('{w.honey}! Yummy! I can talk again! I’m the judge of the sweetest honey. The youngest judge ever!', '¡Miel! ¡Qué rica! ¡Ya puedo hablar! Soy la jueza de la miel más dulce. ¡La jueza más chiquita de la historia!', 'Mel! Que delícia! Eu consigo falar de novo! Eu sou a jurada do mel mais doce. A jurada mais nova de todas!', 'Honig! Lecker! Ich kann wieder reden! Ich bin die Richterin für den süßesten Honig. Die jüngste Richterin aller Zeiten!',
        '[蜂蜜|fēng mì] ！ [真|zhēn] [好吃|hǎo chī] ！ [我|wǒ] [又|yòu] [能|néng] [说话|shuō huà] [了|le] ！ [我|wǒ] [是|shì] [最|zuì] [甜|tián] [蜂蜜|fēng mì] [的|de] [评委|píng wěi] 。 [史上|shǐ shàng] [最|zuì] [小|xiǎo] [的|de] [评委|píng wěi] ！', 'はちみつ ！ おいしい ！ また [話|はな]せる ！ わたし は いちばん [甘|あま]い はちみつ の [審査員|しんさいん] 。 [史上|しじょう] いちばん [小|ちい]さい [審査員|しんさいん] だ よ ！'),
      ask: T('Lavender {w.honey} or rose honey? {mimo} can taste them! Which one is sweeter?', '¿Miel de lavanda o miel de rosas? ¡{mimo} las puede probar! ¿Cuál es más dulce?', 'Mel de lavanda ou mel de rosas? O {mimo} pode provar! Qual é mais doce?', 'Lavendelhonig oder Rosenhonig? {mimo} kann sie probieren! Welcher ist süßer?',
        '[薰衣草|xūn yī cǎo] [蜂蜜|fēng mì] [还是|hái shi] [玫瑰|méi gui] [蜂蜜|fēng mì] ？ {mimo} [可以|kě yǐ] [尝尝|cháng chang] ！ [哪个|nǎ ge] [更|gèng] [甜|tián] ？', 'ラベンダー の はちみつ か 、 バラ の はちみつ か 。 {mimo} が [味見|あじみ] できる よ ！ どっち が [甘|あま]い ？'),
      won: T('Yes! The lavender {w.honey} is sweeter! I knew it!', '¡Sí! ¡La miel de lavanda es más dulce! ¡Lo sabía!', 'Isso! O mel de lavanda é mais doce! Eu sabia!', 'Ja! Der Lavendelhonig ist süßer! Ich wusste es!',
        '[对|duì] ！ [薰衣草|xūn yī cǎo] [蜂蜜|fēng mì] [比|bǐ] [玫瑰|méi gui] [蜂蜜|fēng mì] [甜|tián] ！ [我|wǒ] [就|jiù] [知道|zhī dao] ！', 'やった ！ ラベンダー の はちみつ の ほう が [甘|あま]い ！ わかって た ！'),
      wrong: T('No way! Did you see {mimo}’s face? Look again!', '¡Nooo! ¿Viste la cara de {mimo}? ¡Mira otra vez!', 'Nada disso! Você viu a cara do {mimo}? Olha de novo!', 'Niemals! Hast du {mimo}s Gesicht gesehen? Schau noch mal!',
        '[才|cái] [不|bù] [是|shì] [呢|ne] ！ [你|nǐ] [看到|kàn dào] {mimo} [的|de] [表情|biǎo qíng] [了|le] [吗|ma] ？ [再|zài] [看看|kàn kan] ！', 'ちがう よ ！ {mimo} の [顔|かお] 、 [見|み]た ？ もう [一回|いっかい] [見|み]て ！'),
      chat: T('When I grow up I’ll be a beekeeper, like Melisa.', 'Cuando sea grande voy a ser apicultora, como Melisa.', 'Quando eu crescer, vou ser apicultora, que nem a Melisa.', 'Wenn ich groß bin, werde ich Imkerin, wie Melisa.',
        '[我|wǒ] [长大|zhǎng dà] [了|le] [要|yào] [当|dāng] [养蜂人|yǎng fēng rén] ， [像|xiàng] [梅丽莎|Méi lì shā] [一样|yī yàng] 。', '[大|おお]きく なったら 、 メリッサ みたい な ハチ[飼|か]い に なる ！'),
    },
  };
  // Melisa says it back the right way, then brings it (or takes the roses away): «¿Le gustan los girasoles? ¡Ahora mismo!»
  const GOT = {
    sunflower: T('{w.sunflower:pl}? Of course! Right away.', '¿Le gustan los girasoles? ¡Claro! Ahora mismo.', 'Ela gosta de girassóis? Claro! Agora mesmo.', 'Sie mag Sonnenblumen? Natürlich! Sofort.', '[她|tā] [喜欢|xǐ huan] [向日葵|xiàng rì kuí] ？ [当然|dāng rán] ！ [马上|mǎ shàng] [来|lái] 。', 'ひまわり が [好|す]き ？ もちろん ！ すぐ [持|も]って きます 。'),
    rose: T('He doesn’t like {w.rose:pl}? Oh! That’s why he sneezes. Away they go!', '¿No le gustan las rosas? ¡Ay! Por eso estornuda. ¡Fuera las rosas!', 'Ele não gosta de rosas? Ah! É por isso que ele espirra. Fora as rosas!', 'Er mag keine Rosen? Ach! Darum niest er. Weg mit den Rosen!', '[他|tā] [不|bù] [喜欢|xǐ huan] [玫瑰|méi gui] ？ [哦|ò] ！ [怪不得|guài bu de] [他|tā] [打|dǎ] [喷嚏|pēn tì] 。 [把|bǎ] [玫瑰|méi gui] [拿走|ná zǒu] ！', 'バラ が [嫌|きら]い ？ あら ！ だから くしゃみ を して いる の ね 。 バラ は あっち へ ！'),
    honey: T('She likes {w.honey}? Who doesn’t! Here, a spoonful.', '¿Le gusta la miel? ¿A quién no? Toma, una cucharada.', 'Ela gosta de mel? Quem não gosta! Toma, uma colherada.', 'Sie mag Honig? Wer nicht! Hier, ein Löffel voll.', '[她|tā] [喜欢|xǐ huan] [蜂蜜|fēng mì] ？ [谁|shéi] [不|bù] [喜欢|xǐ huan] [呢|ne] ！ [来|lái] ， [一|yī] [勺|sháo] 。', 'はちみつ が [好|す]き ？ だれ だって [好|す]き よ ！ はい 、 ひとさじ 。'),
    // the wrong thing: Melisa brings it, and the judge turns away (Polo, more roses: he sneezes harder)
    no: T('Hmm… like this? No… look at that face. That’s not it.', 'Mmm… ¿esto? No… mira esa cara. No es eso.', 'Hum… isso? Não… olha essa cara. Não é isso.', 'Hm… das hier? Nein… schau dir das Gesicht an. Das ist es nicht.', '[嗯|ng] … [这个|zhè ge] ？ [不|bù] … [你|nǐ] [看|kàn] [那|nà] [表情|biǎo qíng] 。 [不|bù] [是|shì] [这个|zhè ge] 。', 'うーん … これ ？ ちがう … あの [顔|かお] を [見|み]て 。 これ じゃ ない わ 。'),
  };
  // the fans and beekeepers round the green: hushed, then chatty once the show is saved
  const CHAT = [
    T('What a show! The best in years.', '¡Qué feria! La mejor en años.', 'Que feira! A melhor em anos.', 'Was für eine Blumenschau! Die beste seit Jahren.', '[多|duō] [好|hǎo] [的|de] [花展|huā zhǎn] ！ [这么|zhè me] [多|duō] [年|nián] [来|lái] [最|zuì] [好|hǎo] [的|de] 。', 'すてき な ショー ！ ここ [何年|なんねん] か で いちばん ！'),
    T('I like the sunflowers more than the roses. Don’t tell Tomasa.', 'Me gustan más los girasoles que las rosas. No le digas a Tomasa.', 'Eu gosto mais dos girassóis do que das rosas. Não conta pra Tomasa.', 'Ich mag Sonnenblumen lieber als Rosen. Sag es nicht Tomasa.', '[比起|bǐ qǐ] [玫瑰|méi gui] ， [我|wǒ] [更|gèng] [喜欢|xǐ huan] [向日葵|xiàng rì kuí] 。 [别|bié] [告诉|gào su] [托玛莎|Tuō mǎ shā] 。', 'わたし は バラ より ひまわり が [好|す]き 。 トマサ に は [内緒|ないしょ] よ 。'),
    T('The bees are calm again. Listen to them hum.', 'Las abejas están tranquilas otra vez. Escucha cómo zumban.', 'As abelhas estão calmas de novo. Escuta como elas zumbem.', 'Die Bienen sind wieder ruhig. Hör mal, wie sie summen.', '[蜜蜂|mì fēng] [又|yòu] [安静|ān jìng] [下来|xià lái] [了|le] 。 [你|nǐ] [听|tīng] [它们|tā men] [嗡嗡|wēng wēng] [的|de] [声音|shēng yīn] 。', 'ハチ が また [落|お]ち[着|つ]いた 。 ブンブン いう [音|おと] を [聞|き]いて 。'),
    T('Lavender honey is sweeter than rose honey. Everybody knows that!', 'La miel de lavanda es más dulce que la de rosas. ¡Todo el mundo lo sabe!', 'O mel de lavanda é mais doce que o de rosas. Todo mundo sabe!', 'Lavendelhonig ist süßer als Rosenhonig. Das weiß doch jeder!', '[薰衣草|xūn yī cǎo] [蜂蜜|fēng mì] [比|bǐ] [玫瑰|méi gui] [蜂蜜|fēng mì] [甜|tián] 。 [大家|dà jiā] [都|dōu] [知道|zhī dao] ！', 'ラベンダー の はちみつ は バラ の より [甘|あま]い 。 みんな [知|し]って いる よ ！'),
    T('My tulips are smaller than Polo’s… but prettier!', 'Mis tulipanes son más pequeños que los de Polo… ¡pero más bonitos!', 'As minhas tulipas são menores que as do Polo… mas mais bonitas!', 'Meine Tulpen sind kleiner als die von Polo… aber schöner!', '[我|wǒ] [的|de] [郁金香|yù jīn xiāng] [比|bǐ] [波洛|Bō luò] [的|de] [小|xiǎo] … [可是|kě shì] [更|gèng] [漂亮|piào liang] ！', 'わたし の チューリップ は ポロ の より [小|ちい]さい … でも 、 もっと きれい ！'),
    T('Careful by the hives! The bees are picky: tell them what they like.', '¡Cuidado con las colmenas! Las abejas son quisquillosas: diles lo que les gusta.', 'Cuidado com as colmeias! As abelhas são exigentes: diz pra elas do que elas gostam.', 'Vorsicht bei den Bienenstöcken! Die Bienen sind wählerisch: Sag ihnen, was sie mögen.', '[小心|xiǎo xīn] [蜂箱|fēng xiāng] ！ [蜜蜂|mì fēng] [很|hěn] [挑剔|tiāo ti] ： [告诉|gào su] [它们|tā men] [它们|tā men] [喜欢|xǐ huan] [什么|shén me] 。', '[巣箱|すばこ] に [気|き] を つけて ！ ハチ は [好|この]み に うるさい の 。 [好|す]きな もの を [言|い]って あげて 。'),
  ];
  const FAN_HUSHED = T('*Pretty*… the *show*… so *quiet*…', '*Bonito*… la *feria*… tan *callado*…', '*Bonito*… a *feira*… tão *quieto*…', '*Schön*… die *Schau*… so *still*…', '[漂亮|piào liang] … [花展|huā zhǎn] … [好|hǎo] [安静|ān jìng] …', 'きれい … ショー … [静|しず]か …');
  // the sentence frames on the help and judging boxes (zh / ja in the notation): what Melisa and the judges showed you, with gaps
  const FRAMES = {
    likes: { es: '«A ___ le gusta(n) ___» · «A ___ no le gusta(n) ___»', pt: '«___ gosta de ___» · «___ não gosta de ___»', de: '«___ mag ___» · «___ mag keine ___»',
      zh: '“ [她|tā] / [他|tā] [喜欢|xǐ huan] ___ ” · “ [不|bù] [喜欢|xǐ huan] ___ ”', ja: '「 ___ が [好|す]き です 」 · 「 ___ が [嫌|きら]い です 」' },
    compare: { es: '«El / La ___ es más ___ que el / la ___»', pt: '«O / A ___ é mais ___ que o / a ___»', de: '«Der / Die ___ ist ___er als der / die ___»',
      zh: '“ ___ [比|bǐ] ___ ___ ”', ja: '「 ___ は ___ より ___ です 」' },
  };
  Object.assign(GA, { GARDEN_LINES: GL, JUDGE_LINES: JL, GOT, CHAT, FAN_HUSHED, NEW_WORDS, CLIMB, registerWords, T, FRAMES });
})();

// ================================================================ the game side: Flora and the gate, Melisa, the flower show, the greenhouse door
(() => {
  const GA = GARDENS, SPOT = GA.SPOT, V = (x, y, z) => new THREE.Vector3(x, y, z);
  let G = null, B = null, synced = '', nudgeCool = 0, curCool = 20, carried = [];
  const S = () => { const s = G.state; s.gardens = s.gardens || {}; s.gardens.liked = s.gardens.liked || {}; s.gardens.judged = s.gardens.judged || {}; return s.gardens; };
  const F = () => G.state.flags;
  const name = () => G.state.mimoName || 'Mimo';
  const lang = () => G.state.lang || 'es';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const ex = w => (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const VERBS = ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing', 'v.climb'];
  const person = id => (B ? B.people.find(p => p.id === id) || null : null);
  const lock = on => { G.sim.lock = on ? 1 : 0; };
  const cjk = l => l === 'zh' || l === 'ja';
  const plainOf = src => (cjk(lang()) && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(src, { lang: lang() }) : src);
  const frameOf = src => (cjk(lang()) && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(src, { lang: lang(), cap: false }) : src);     // (a frame: no capital after a gap)
  // what the demonstrations show (DESIGN.md 16: highlighted and glossed small in the sentence, no English under it): Melisa's
  // likes and dislikes; «más grande / bonito / dulce» in her question and the judges'
  const LIKE_MARK = { es: [['no le gustan', 'doesn’t like'], ['le gustan', 'likes']], pt: [['não gosta de', 'doesn’t like'], ['gosta de', 'likes']], de: [['mag keine', 'doesn’t like'], ['mag', 'likes']],
    zh: [['[不|bù] [喜欢|xǐ huan]', 'doesn’t like'], ['[喜欢|xǐ huan]', 'likes']], ja: [['[好|す]き', 'likes'], ['[嫌|きら]い', 'doesn’t like']] };
  const MORE_MARK = { es: [['más grande', 'bigger'], ['más bonito', 'prettier'], ['más dulce', 'sweeter']], pt: [['maior', 'bigger'], ['mais bonita', 'prettier'], ['mais bonito', 'prettier'], ['mais doce', 'sweeter']],
    de: [['größer', 'bigger'], ['schöner', 'prettier'], ['süßer', 'sweeter']],
    zh: [['[更|gèng] [大|dà]', 'bigger'], ['[大|dà]', 'big'], ['[更|gèng] [漂亮|piào liang]', 'prettier'], ['[更|gèng] [甜|tián]', 'sweeter']], ja: [['[大|おお]きい', 'big'], ['きれい', 'pretty'], ['[甘|あま]い', 'sweet']] };
  const idSeed = id => [...String(id || 'x')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const JUDGES = ['tomasa', 'polo', 'lola'];
  const JUDGE_OF = { tomasa: { key: 'big', thing: 'sunflower', neg: false, g: 'f', en: 'Tomasa likes sunflowers.' }, polo: { key: 'pretty', thing: 'rose', neg: true, g: 'm', en: 'Polo doesn’t like roses.' }, lola: { key: 'sweet', thing: 'honey', neg: false, g: 'f', en: 'Lola likes honey.' } };
  const likedCount = () => JUDGES.filter(id => S().liked[id]).length, judgedCount = () => JUDGES.filter(id => S().judged[JUDGE_OF[id].key]).length;
  const terrainAt = (x, z) => WORLD.terrainAt(x, z);
  // the Hush eats most of a hushed line's words; the *starred* ones survive (as story.js does it)
  function blank(s, seed) {
    if (!s) return s;
    const R = rng(seed);
    return s.split(' ').map(w => {
      if (/^[¿¡]?\*.*\*[.,…!?！？。]*$/.test(w)) return w.replace(/\*/g, '');
      if (/^[….…]+$/.test(w)) return w;
      const m = w.match(/^(.*?)([.,…!?;:]*)$/);
      return R() < 0.55 ? '▬' + m[2] : w;
    }).join(' ');
  }
  // someone says a line from a T table, through the weave; o.hush: gray, slow, words eaten; o.full: all in the language
  // (DESIGN.md 16: every line is mixed by story.js; a hushed one keeps the words the Hush left in the language, glossed small)
  function sayT(p, T, o = {}) {
    if (!p || !T) return Promise.resolve();
    const l = lang();
    if (o.hush && STORY.sayHushed) return STORY.sayHushed(p, (T[l] || '').replace(/\{mimo\}/g, name()), T.en || '', { seed: idSeed(p.id), key: 'hushed.' + p.id });
    let text = (T[l] || '').replace(/\{mimo\}/g, name()), en = (T.en || '').replace(/\*/g, o.hush ? '*' : '');
    if (o.hush) { const seed = idSeed(p.id); text = cjk(l) ? text.replace(/\*/g, '') : blank(text, seed); en = blank(en, seed + 1); }
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
  async function untilNear(spot, r, max) { const M = G.sim.mimo; for (let t = 0; t < max && Math.hypot(M.x - spot.x, M.z - spot.z) > r; t += 0.1) await wait(0.1); }
  // ---------------------------------------------------------------- Mimo carrying something (a sunflower, a honey pot, the vase of roses)
  function carryProp(kind) {
    const k = B.Kit(), GEO = B.GEO, g = new THREE.Group();
    if (kind === 'sunflowers') { for (let i = 0; i < 3; i++) { k.add(GEO.cyl6, (i - 1) * 0.08, 0.2, 0, 0.015, 0.42, 0.015, '#4f9a45', { ink: 0 }); k.add(GEO.cyl, (i - 1) * 0.1, 0.44, 0.02, 0.1, 0.02, 0.1, '#f2c94c', { rx: 1.2, ink: 0.005 }); } }
    else if (kind === 'honey') k.add(GEO.cyl, 0, 0.12, 0, 0.12, 0.24, 0.12, '#f0c25a', { ink: 0.008 }).add(GEO.cyl, 0, 0.26, 0, 0.13, 0.05, 0.13, '#e2574c', { ink: 0.005 });
    else if (kind === 'roses') { k.add(GEO.cyl, 0, 0.12, 0, 0.09, 0.24, 0.09, '#4c7fd8', { ink: 0.006 }); for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; k.add(GEO.ico1, Math.cos(a) * 0.1, 0.36, Math.sin(a) * 0.1, 0.07, 0.06, 0.07, '#d9434f', { ink: 0.004 }); } }
    k.build(g, { shadow: false });
    G.w3d.scene.add(g);
    const c = { g, kind }; carried.push(c);
    return c;
  }
  function dropProp(c) { if (!c) return; G.w3d.scene.remove(c.g); carried.splice(carried.indexOf(c), 1); }
  function placeCarried() { const M = G.sim.mimo; for (const c of carried) { c.g.position.set(M.x, M.ry + 1.0 + Math.sin(performance.now() / 160) * 0.03, M.z); c.g.rotation.y = M.yaw; } }
  // a judge gets their colors (and words) back
  function restore(p, instant, pose) {
    p.hushed = false; p.set(pose || 'idle', false);
    if (!instant) { G.w3d.fx.sparkle(p.x, p.y + 1.3, p.z, 22, ['#ffd166', '#fff3a0', '#ff8fb1']); Sound.play('learned'); }
  }

  // ---------------------------------------------------------------- Flora, the gate, and «trepa»
  async function floraScene() {
    const f = F(), p = person('flora'); if (!p) return;
    f.flora = true;
    lock(true);
    p.climb.on = false; p.x = SPOT.flora.x; p.z = SPOT.flora.z; p.y = terrainAt(p.x, p.z); p.set('idle', false); p.look = G.sim.you;
    G.cam.override = { pos: V(p.x + 3.6, p.y + 2.4, p.z - 3.2), look: V(p.x, p.y + 1.2, p.z) };
    await sayT(p, GA.GARDEN_LINES['f.hello']);
    await STORY.you('{w.hello}! Locked from inside? Then how do we get in?');
    await sayT(p, GA.GARDEN_LINES['f.climb']);
    p.look = null; p.climb.on = true; p.climb.t = 0;
    G.cam.override = null; lock(false);
    G.save();
    if (!LEX.taught('v.climb')) await watchFlora();
    else { await sayT(p, GA.GARDEN_LINES['f.small']); }
  }
  // Mimo watches her climb, and wants the word: the teach box (13.1: verbs learned by watching)
  async function watchFlora() {
    const p = person('flora'); if (!p) return;
    p.climb.on = true; p.climb.t = 0.2;
    await wait(1.2);
    // (DESIGN.md 16: heard first) she says it as she goes up, whole in the language with the English under it; then Mimo asks
    if (STORY.youWord) {
      lock(true);
      const T = SPOT.trellis, ty = terrainAt(T.x, T.z);
      G.cam.override = { pos: V(T.x - 5.5, ty + 3.2, T.z - 4.0), look: V(T.x, ty + 1.8, T.z), dur: 0.8 };
      await (STORY.demoLine ? STORY.demoLine(p, GA.GARDEN_LINES['f.demo'], ['v.climb']) : sayT(p, GA.GARDEN_LINES['f.demo']));
      await STORY.youWord('«', STORY.wordPart('v.climb'), '»… Flora says it every time she goes up the trellis!');
      G.cam.override = null; lock(false);
    }
    const r = await STORY.teachWord('v.climb', { spot: { x: SPOT.watch.x, z: SPOT.watch.z }, look: { x: SPOT.trellis.x, z: SPOT.trellis.z }, title: `${name()} is watching Flora on the trellis. What is she doing?` });
    if (r && r.ok) { await wait(0.4); p.climb.on = false; p.x = SPOT.flora.x; p.z = SPOT.flora.z; p.y = terrainAt(p.x, p.z); p.set('happy', false); p.look = G.sim.you; await sayT(p, GA.GARDEN_LINES['f.small']); p.look = null; p.set('idle', false); p.climb.on = !F().gardenGate; }
    G.save();
  }
  // the gate: tell Mimo what to do («¡Trepa!»); it climbs the trellis, drops down inside and lifts the latch
  async function gateScene() {
    const f = F(), st = S(), M = G.sim.mimo;
    if (f.gardenGate) return;
    let verb = st.quickClimb ? 'v.climb' : null, ms = 3000;
    if (!verb) {
      const r = await UI.command({ name: name(), icon: 'climb', title: `The garden gate is locked from inside, and the latch is on the other side. A rose trellis runs up the hedge. What should ${name()} do?`, verbs: VERBS, answer: 'v.climb' });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); M.tiltT = 1.4; STORY.think(LEX.taught('v.climb') ? '{mimo} tilts its head. What did Flora do on the trellis?' : '{mimo} looks at the trellis… and at Flora, going up it again.', 5); return; }
      verb = r.verb; ms = r.ms;
    }
    const at = { x: SPOT.trellis.x, z: SPOT.trellis.z - 1.0 };
    if (verb !== 'v.climb') {
      if (LEX.taught(verb)) LEX.attempt(verb, { ok: true, hints: 0, ms, mode: 'command' });
      G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
      G.sim.mimoGo({ x: GA.GATE.x, z: GA.GATE.z - 1.2 }, GA.GATE); await wait(0.9);
      if (verb === 'v.push') { Sound.play('land', 6); STORY.think('{mimo} pushes the gate with all its might. It rattles… locked tight.', 4); }
      else if (verb === 'v.hit') { Sound.play('wood'); M.sad = 1.2; STORY.think('{mimo} bonks the gate. Ouch! It’s solid wood.', 4); }
      else if (verb === 'v.jump') { M.hop = { t: 0 }; Sound.play('jump'); STORY.think('{mimo} hops and hops. The hedge is much too high.', 4); }
      else if (verb === 'v.throw') { Sound.play('whiff'); STORY.think('{mimo} throws a pebble over the hedge. Plink. Nobody comes.', 4); }
      else if (verb === 'v.sing') { Sound.play('sing'); STORY.think('{mimo} sings at the gate. From inside… only silence.', 4); }
      else if (verb === 'v.swim') STORY.think('{mimo} looks around for water. There’s only a hedge.', 4);
      else STORY.think('{mimo} tries, but the gate doesn’t care.', 4);
      G.sim.mimoGo(null, null);
      return;
    }
    learnUse('v.climb', ms); st.quickClimb = true;
    lock(true);
    const T = SPOT.trellis, ty = terrainAt(T.x, T.z), root = G.cast.mimo.root, Flora = person('flora');
    if (Flora) { Flora.climb.on = false; Flora.x = SPOT.flora.x + 0.6; Flora.z = SPOT.flora.z - 0.4; Flora.y = terrainAt(Flora.x, Flora.z); Flora.set('point', false); Flora.look = T; }
    G.cam.override = { pos: V(T.x - 6.5, ty + 4.2, T.z - 3.0), look: V(T.x + 1.5, ty + 1.6, T.z + 0.6), dur: 0.8 };
    G.sim.mimoGo(at, T);
    await untilNear(at, 0.9, 3);
    M.hidden = true;
    const p0 = root.position.clone();
    Sound.play('pip');
    // up the trellis, paw over paw
    await tween(1.6, k => { root.position.set(lerp(p0.x, T.x + 0.1, k) + Math.sin(k * 26) * 0.05, lerp(p0.y, ty + 2.9, k), lerp(p0.z, T.z - 0.42, Math.min(1, k * 3))); root.rotation.set(-0.35, 0, Math.sin(k * 26) * 0.12); if (Math.random() < 0.12) Sound.play('wood'); });
    // over the top of the hedge, and down the other side
    Sound.play('jump');
    const p1 = root.position.clone(), inside = { x: GA.GATE.x - 0.9, z: GA.GATE.z + 1.3 }, iy = terrainAt(inside.x, inside.z);
    await tween(0.7, k => { root.position.set(lerp(p1.x, inside.x, k), lerp(p1.y, iy, k) + Math.sin(k * Math.PI) * 1.0, lerp(p1.z, inside.z, k)); root.rotation.set(0, Math.PI * k, 0); });
    Sound.play('land', 5); G.w3d.fx.puff(inside.x, iy, inside.z, 6, 0.2);
    await wait(0.3);
    // the latch: a hop, a clunk
    G.cam.override = { pos: V(GA.GATE.x + 3.4, iy + 3.4, GA.GATE.z + 6.6), look: V(GA.GATE.x - 0.6, iy + 0.7, GA.GATE.z + 0.6), dur: 0.6 };
    await wait(0.5);
    await tween(0.35, k => { root.position.y = iy + Math.sin(k * Math.PI) * 0.6; });
    Sound.play('click'); Sound.play('wood');
    await wait(0.3);
    if (B) B.setGate(true);
    f.gardenGate = true; G.save();
    Sound.play('chest');
    await wait(1.0);
    // back out to you through the open gate
    const Y = G.sim.you;
    M.x = GA.GATE.x; M.z = GA.GATE.z - 1.2; M.y = M.ry = terrainAt(M.x, M.z); M.hidden = false; root.rotation.set(0, 0, 0);
    M.happy = 1.5;
    G.cam.override = null;
    if (Flora) { Flora.look = Y; Flora.set('cheer', false); await sayT(Flora, GA.GARDEN_LINES['f.open']); Flora.look = null; Flora.set('idle', false); Flora.x = 207.6; Flora.z = -89.2; Flora.y = terrainAt(Flora.x, Flora.z); Flora.baseYaw = 2.6; }
    lock(false);
    G.save();
  }

  // ---------------------------------------------------------------- arriving, and Melisa
  async function arriveGardens() {
    const f = F(); f.gardens = true; G.save();
    for (const id of ['w.rose', 'w.sunflower', 'w.tulip', 'w.lavender', 'w.bee', 'w.hive', 'w.greenhouse', 'w.honey', 'w.flower']) if (LEX.item(id)) LEX.expose(id);
    await UI.chapter('The Bloom Gardens', 'Chapter 1 · The fourth bell');
    if (!f.melisa) await STORY.you('So many {w.flower:pl}… but everyone is gray. Is that a flower show? Nobody’s moving.');
  }
  async function melisaScene() {
    const m = person('melisa'); if (!m) return;
    lock(true);
    const my = m.y, shot = { pos: V(m.x - 3.8, my + 2.5, m.z - 3.6), look: V(m.x, my + 1.3, m.z) };
    G.cam.override = shot; m.look = G.sim.you;
    await sayT(m, GA.GARDEN_LINES['m.hello']);
    await STORY.you('{w.hello}! We’re ringing the eight bells. Three ring again already. Is there a {w.bell} here?');
    G.cam.override = { pos: V(GA.GREEN.x + 7, GA.VALLEY.y + 4.4, GA.GREEN.z - 9), look: V(GA.GREEN.x, GA.VALLEY.y + 1.2, GA.GREEN.z - 0.5), dur: 1.0 };
    await sayT(m, GA.GARDEN_LINES['m.hush']);
    G.cam.override = { pos: V(GA.DOOR.x + 7, GA.VALLEY.y + 10.5, GA.DOOR.z - 17), look: V(GA.GREAT.x, GA.VALLEY.y + 4.0, GA.GREAT.z), dur: 1.2 };
    await sayT(m, GA.GARDEN_LINES['m.bell']);
    G.cam.override = Object.assign({ dur: 0.9 }, shot);
    await STORY.you('Then {mimo} and I will help. What can we do?');
    await sayT(m, GA.GARDEN_LINES['m.ask']);
    await (STORY.demoLine ? STORY.demoLine(m, GA.GARDEN_LINES['m.demo'], LIKE_MARK) : sayT(m, GA.GARDEN_LINES['m.demo']));      // (DESIGN.md 16: how to say what someone likes, heard first)
    m.look = null; G.cam.override = null; lock(false);
    F().melisa = true; G.save();
  }
  // Report back to Melisa after the gardeners' bell (DESIGN.md 16): the fourth bell, Noa, and the Frost Peaks next
  async function reportBell() {
    const m = person('melisa'), f = F(); if (!m) return;
    lock(true);
    const Y = G.sim.you, my = m.y;
    G.cam.override = { pos: V(m.x + (Y.x - m.x) * 0.5 - 3.0, my + 2.4, m.z + (Y.z - m.z) * 0.5 - 3.0), look: V((m.x + Y.x) / 2, my + 1.2, (m.z + Y.z) / 2), dur: 0.8 };
    m.look = Y;
    await STORY.you('Melisa! The gardeners’ {w.bell} is ringing again, up in the dome!');
    await sayT(m, GA.GARDEN_LINES['m.fourth']);
    f.melisaFourth = true; G.save();
    G.cam.override = { pos: V(m.x - 3, my + 6, m.z - 6), look: V(m.x + 40, my + 14, m.z - 160), dur: 1.4 };     // (north-east, up to the snowy peaks)
    await wait(0.8);
    await sayT(m, GA.GARDEN_LINES['m.next']);
    m.look = null; G.cam.override = null; lock(false);
    await STORY.you('The Frost Peaks. Let’s go, {mimo}!');
    G.save();
  }
  async function melisaAgain() {
    const m = person('melisa'), f = F();
    if (f.gardensFree) { if (!f.melisaFourth) return reportBell(); return sayT(m, GA.GARDEN_LINES['m.next']); }
    if (f.showDone) return sayT(m, GA.GARDEN_LINES['m.green']);
    if (likedCount() >= 3) return STORY.demoLine ? STORY.demoLine(m, GA.GARDEN_LINES['m.contest'], MORE_MARK) : sayT(m, GA.GARDEN_LINES['m.contest']);
    return sayT(m, GA.GARDEN_LINES['m.again']);
  }

  // ---------------------------------------------------------------- the judges: what they like, then their contest
  async function judgeTalk(p) {
    const st = S(), J = JUDGE_OF[p.id], L = GA.JUDGE_LINES[p.id];
    if (st.liked[p.id] && st.judged[J.key]) return sayT(p, L.chat);
    if (st.liked[p.id]) return contestScene(p);
    await sayT(p, L.hushed, { hush: true, full: true });     // (the words the Hush left, in the language with the English under them)
    if (!F().melisa) { G.sim.mimo.scared = 2.5; STORY.think('{mimo} hides behind you. The judge is gray and stiff. Maybe whoever runs the show knows what happened.', 5); return; }
    return likeScene(p);
  }
  async function likeScene(p) {
    const d = p.def, J = JUDGE_OF[p.id], l = lang(), she = J.g === 'f' ? 'she' : 'he';
    const model = GA.likes.model(J.thing, l, { to: 'other', g: J.g, name: d.name, neg: J.neg });
    const r = await UI.command({ name: name(), icon: GA.likes.THINGS[J.thing].icon, title: `What does ${d.name} like${J.neg ? ' (or not)' : ''}? Tell Melisa, and she’ll bring it.`, verbs: [], placeholder: `say what ${she} ${J.neg ? 'doesn’t like' : 'likes'}…`,
      hint: `Like Melisa showed you: ${frameOf(GA.FRAMES.likes[l] || GA.FRAMES.likes.es)}. Look at ${she === 'she' ? 'her' : 'him'}: the hat, the hands, the sneezing… (? shows an example)`, model: plainOf(model), modelEn: J.en });
    if (!r || r.cancelled) return;
    const g = GA.likes.grade(r.text, l, { to: 'other', g: J.g, name: d.name, thing: J.thing, neg: J.neg }), mel = person('melisa');
    if (!g.thing) { Sound.play('wrong'); await sayT(mel, GA.GARDEN_LINES['m.huh']); STORY.think(`Look at ${d.name} again. Sunflowers? Roses? Tulips? Lavender? Honey? (Type ? for an example.)`, 6); return; }
    if (!g.ok) {
      Sound.play('wrong');
      lock(true);
      if (p.id === 'polo' && g.thing === 'rose' && !g.neg) { await sayT(mel, GA.GOT.no); p.set('sneeze', true); Sound.play('poof'); G.w3d.fx.puff(p.x, p.y + 1.5, p.z + 0.3, 8, 0.2, '#e8e0f0'); lock(false); STORY.think('More roses? Polo sneezes even harder! He doesn’t seem to like them at all…', 5); return; }
      await sayT(mel, GA.GOT.no);
      lock(false);
      STORY.think(`${d.name} turns away. That’s not it… Look again: what does ${she} ${J.neg ? 'not like' : 'like'}?`, 5);
      return;
    }
    UI.toast(`${g.letter} · ${g.reason}`);
    Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    lock(true);
    await sayT(mel, GA.GOT[J.thing]);          // (Melisa says it back the right way)
    G.cam.override = { pos: V(p.x - 3.2, p.y + 2.4, p.z - 4.4), look: V(p.x, p.y + 1.0, p.z), dur: 0.9 };
    await deliver(p, J.thing);
    S().liked[p.id] = g.letter;
    restore(p, false, p.id === 'lola' ? 'happy' : 'idle');
    await wait(0.5);
    await sayT(p, GA.JUDGE_LINES[p.id].back, { full: true });
    G.cam.override = null;
    lock(false);
    G.save();
    if (likedCount() >= 3 && !F().allLiked) { F().allLiked = true; G.save(); await (STORY.demoLine ? STORY.demoLine(mel, GA.GARDEN_LINES['m.contest'], MORE_MARK) : sayT(mel, GA.GARDEN_LINES['m.contest'])); }     // («¿Cuál es más grande…?»: heard before you compare)
    await contestScene(p);
  }
  // Mimo fetches it (a sunflower from the field, a honey pot from the hives) or carries the roses away
  async function deliver(p, thing) {
    const M = G.sim.mimo;
    if (thing === 'rose') {
      const vase = { x: SPOT.polo.x - 1.25, z: SPOT.polo.z + 0.5 };
      G.sim.mimoGo({ x: vase.x - 0.8, z: vase.z - 0.6 }, vase); await untilNear({ x: vase.x - 0.8, z: vase.z - 0.6 }, 1.0, 4); await wait(0.2);
      if (B) B.setProp('roses', false);
      const c = carryProp('roses'); Sound.play('pip');
      const away = { x: GA.MARQUEE.x - 5.4, z: GA.MARQUEE.z + 2.6 };
      G.sim.mimoGo(away, away); await untilNear(away, 1.2, 4);
      dropProp(c); G.w3d.fx.puff(M.x, M.ry + 0.8, M.z, 10, 0.25, '#ffd6e2'); Sound.play('poof');
      G.sim.mimoGo(null, null);
      return;
    }
    const src = thing === 'sunflower' ? SPOT.sunflowers : SPOT.hives, kind = thing === 'sunflower' ? 'sunflowers' : 'honey';
    const from = { x: src.x - 2.4, z: src.z - 2.8 };
    G.sim.mimoGo(from, src); await untilNear(from, 1.6, 5); await wait(0.25);
    const c = carryProp(kind); Sound.play('pip'); G.w3d.fx.sparkle(M.x, M.ry + 1.1, M.z, 8);
    const to = { x: p.x + (p.id === 'lola' ? 1.6 : -1.6), z: p.z - 0.6 };
    G.sim.mimoGo(to, p); await untilNear(to, 1.3, 5); await wait(0.2);
    dropProp(c); if (B) B.setProp(kind, true); Sound.play('review');
    G.sim.mimoGo(null, null);
  }
  async function contestScene(p) {
    const st = S(), J = JUDGE_OF[p.id], C = GA.compare.CONTESTS[J.key], l = lang(), L = GA.JUDGE_LINES[p.id];
    if (st.judged[J.key]) return sayT(p, L.chat);
    const t = GA.TABLES.find(x => x.id === J.key), M = G.sim.mimo;
    lock(true);
    G.cam.override = { pos: V(t.x + Math.sin(t.rot) * 0.5, GA.VALLEY.y + 2.6, t.z - 3.6), look: V(t.x, GA.VALLEY.y + 1.0, t.z), dur: 0.8 };
    await (STORY.demoLine ? STORY.demoLine(p, L.ask, MORE_MARK) : sayT(p, L.ask));       // (DESIGN.md 16: the judge asks «¿Cuál es más grande?» in the language, «más grande» glossed)
    // the honey: Mimo tastes them both (the lavender honey makes it beam; the rose honey, not so much)
    if (J.key === 'sweet' && !st.tasted) {
      const E = B && B.objects.ents.sweet;
      for (let i = 0; i < 2; i++) {
        const at = E ? E.at(i) : { x: t.x, z: t.z }, stand = { x: at.x, z: at.z - 0.9 };
        G.sim.mimoGo(stand, at); await untilNear(stand, 0.8, 3); await wait(0.2);
        M.hop = { t: 0 }; Sound.play('babble'); await wait(0.6);
        if (i === 0) { M.happy = 2; M.glow = 1; G.sim.mimoSay('♥ Mmm! ♥', 1.6); G.w3d.fx.sparkle(M.x, M.ry + 1.1, M.z, 12, ['#ff9bb3', '#fff3a0']); Sound.play('learned'); }
        else { M.tiltT = 1.6; G.sim.mimoSay('…mm.', 1.4); Sound.play('pip'); }
        await wait(1.3);
      }
      G.sim.mimoGo(null, null); st.tasted = true;
    }
    G.cam.override = null; lock(false);
    const what = { big: 'bigger', pretty: 'prettier', sweet: 'sweeter' }[J.key];
    const r = await UI.command({ name: name(), icon: J.key === 'sweet' ? 'honey' : J.key === 'big' ? 'rose' : 'tulip', title: `Which one is ${what}? Tell ${p.def.name} in a comparing sentence.`, verbs: [],
      placeholder: { big: 'the red one is bigger than…', pretty: 'the yellow one is prettier than…', sweet: 'the lavender honey is sweeter than…' }[J.key], hint: `Compare the two: ${frameOf(GA.FRAMES.compare[l] || GA.FRAMES.compare.es)} (? shows an example)`, model: plainOf(C.model[l] || C.model.es), modelEn: C.model.en });
    if (!r || r.cancelled) return;
    const g = GA.compare.grade(r.text, l, J.key);
    if (g.wrong === 'none') { Sound.play('wrong'); STORY.think(J.key === 'sweet' ? 'Say which honey: the lavender one? The rose one?' : J.key === 'big' ? 'Say which rose: the red one? The white one?' : 'Say which tulip: the yellow one? The red one?', 5); return; }
    if (g.wrong === 'adj') { Sound.play('wrong'); STORY.think(`${p.def.name} blinks. This contest is about which one is ${what}…`, 5); return; }
    if (g.wrong === 'order') { Sound.play('wrong'); await sayT(p, L.wrong); return; }
    UI.toast(`${g.letter} · ${g.reason}`);
    Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    st.judged[J.key] = g.letter;
    if (B) B.setRibbon(J.key, true);
    const E = B && B.objects.ents[J.key], at = E ? E.at(0) : t;
    G.w3d.fx.sparkle(at.x, GA.VALLEY.y + 1.5, at.z, 18, ['#4c7fd8', '#fff3a0', '#ffffff']);
    p.set('happy', false);
    await sayT(p, L.won, { full: true });
    p.set('idle', false);
    G.save();
    if (judgedCount() >= 3 && !F().showDone) await showDone();
  }
  // all three judged: the show is saved, everyone gets their color back, and the vines on the greenhouse door fall away
  async function showDone() {
    const f = F(), m = person('melisa');
    lock(true);
    f.showDone = true; f.greenOpen = true; G.save();
    G.cam.override = { pos: V(GA.GREEN.x - 4, GA.VALLEY.y + 8, GA.GREEN.z - 16), look: V(GA.GREEN.x, GA.VALLEY.y + 1, GA.GREEN.z + 2), dur: 1.0 };
    Sound.play('fanfare');
    for (const p of B.people) if (p.fan && p.hushed) { restore(p, false, 'cheer'); await wait(0.15); }
    await wait(1.0);
    await sayT(m, GA.GARDEN_LINES['m.showDone']);
    G.cam.override = { pos: V(GA.DOOR.x + 10.5, GA.VALLEY.y + 3.8, GA.DOOR.z - 2.4), look: V(GA.DOOR.x + 0.5, GA.VALLEY.y + 1.5, GA.DOOR.z + 0.8), dur: 1.0 };
    if (B) B.setVines(false);
    Sound.play('crack'); G.w3d.fx.puff(GA.DOOR.x, GA.VALLEY.y + 1.3, GA.DOOR.z + 0.8, 18, 0.4, '#b9b7c6');
    await wait(1.4);
    await sayT(m, GA.GARDEN_LINES['m.green']);
    G.cam.override = null;
    for (const p of B.people) if (p.fan) p.set('idle', false);
    lock(false);
    await STORY.you('The {w.greenhouse} door is open! The {w.bell} is at the very top. Let’s go, {mimo}.');
    G.save();
  }
  async function fanTalk(p) {
    if (p.hushed) { await sayT(p, GA.FAN_HUSHED, { hush: true }); return; }
    const pool = GA.CHAT;
    return sayT(p, pool[idSeed(p.id) % pool.length]);
  }
  async function doorScene() {
    const f = F();
    if (!f.greenOpen) { STORY.think(F().melisa ? 'Gray, thorny vines wrap the great {w.greenhouse}’s door, tight as a fist.' : 'A huge glass {w.greenhouse}. Its door is wrapped in gray, thorny vines.', 4.5); return; }
    if (typeof GREENHOUSE !== 'undefined' && GREENHOUSE.enter) return GREENHOUSE.enter();
    STORY.think('The way in is open… (the great greenhouse is coming soon!)', 4);
  }

  // ---------------------------------------------------------------- what you can press E on (outdoors, round the gate and the valley)
  function interactables() {
    if (!G || !B) return [];
    const f = F(), list = [], Y = G.sim.you, st = S();
    const nearGate = Math.hypot(Y.x - GA.GATE.x, Y.z - GA.GATE.z) < 16, nearValley = GA.valDist(Y.x, Y.z) < 6;
    if (!nearGate && !nearValley) return list;
    const fl = person('flora');
    if (fl && !f.gardenGate && GA.open(G.state)) list.push({ x: SPOT.flora.x, z: SPOT.flora.z, r: 2.8, label: 'Talk', run: async () => { if (!f.flora) return floraScene(); if (!LEX.taught('v.climb')) return watchFlora(); return sayT(fl, GA.GARDEN_LINES['f.small']); } });
    if (!f.gardenGate && GA.open(G.state)) {
      const lbl = st.quickClimb ? `«${ex(LEX.form('v.climb'))}»` : `Tell ${name()}`;
      list.push({ x: GA.GATE.x + 0.5, z: GA.GATE.z - 1.4, r: 2.4, label: lbl, run: gateScene });
    }
    if (!nearValley) return list;
    if (fl && f.gardenGate) list.push({ x: fl.x, z: fl.z, r: 2.3, label: 'Talk', run: () => sayT(fl, GA.GARDEN_LINES['f.chat']) });
    const m = person('melisa');
    const rep = typeof QUESTS !== 'undefined' && QUESTS.reportDue && QUESTS.reportDue('melisa');      // (DESIGN.md 16: after the bell, report back)
    if (m) list.push({ x: m.x, z: m.z, r: 2.7, label: rep ? 'Report' : 'Talk', run: f.melisa ? melisaAgain : melisaScene });
    for (const id of JUDGES) {
      const p = person(id); if (!p) continue;
      const J = JUDGE_OF[id], liked = st.liked[id], judged = st.judged[J.key];
      list.push({ x: p.x, z: p.z - 0.4, r: 2.4, label: !liked && f.melisa ? 'Help' : liked && !judged ? 'Judge' : 'Talk', run: () => judgeTalk(p) });
      // the table's entries: the contest, from in front of it
      const t = GA.TABLES.find(x => x.id === J.key);
      if (liked && !judged) list.push({ x: t.x, z: t.z - 1.4, r: 1.8, label: 'Judge', run: () => contestScene(p) });
    }
    for (const p of B.people) if (p.fan) list.push({ x: p.x, z: p.z, r: 2.0, label: 'Talk', run: () => fanTalk(p) });
    list.push({ x: GA.DOOR.x, z: GA.DOOR.z, r: 2.8, label: f.greenOpen ? 'Go in' : 'Look', run: doorScene });
    return list;
  }
  // where the compass points: the next thing to do here
  function target() {
    const f = F(), st = S();
    if (!GA.open(G.state)) return wayIn();
    if (!f.gardenGate) { const Y = G.sim.you; if (Y.z < GA.MIST.z - 4 || Y.x < 170) return wayIn(); return f.flora && LEX.taught('v.climb') ? SPOT.trellis : person('flora') || SPOT.flora; }
    if (!f.gardens) return SPOT.enter;
    if (!f.melisa) return person('melisa');
    const Y = G.sim.you;
    const next = JUDGES.filter(id => !st.liked[id]).map(person).filter(Boolean);
    if (next.length) return next.reduce((b, p) => (!b || Math.hypot(p.x - Y.x, p.z - Y.z) < Math.hypot(b.x - Y.x, b.z - Y.z) ? p : b), null);
    const nj = JUDGES.filter(id => !st.judged[JUDGE_OF[id].key]).map(id => GA.TABLES.find(t => t.id === JUDGE_OF[id].key));
    if (nj.length) return { x: nj[0].x, z: nj[0].z - 1.4 };
    if (!f.gardensFree) return GA.DOOR;
    return person('melisa');
  }
  // the way here: east along the road to Molinar, through the square, out of its south way, up the garden road
  function wayIn() {
    const Y = G.sim.you, L = WORLD.L;
    if (Y.x < 168 && Y.z < -100) return Y.x < 146 ? { x: 150, z: -150 } : (L.molinarGate || { x: 173, z: -150 });
    if (Y.z < -113) return Math.hypot(Y.x - 215, Y.z + 150) > 14 && Y.z < -136 ? { x: 215, z: -150 } : { x: 213.8, z: -111.6 };
    if (!GA.open(G.state)) return GA.MIST;
    return GA.GATE;
  }

  // ---------------------------------------------------------------- every frame (story hooks): the mist, Flora, words to teach
  function tick(dt, Y) {
    if (!G || !B) return;
    const f = F();
    nudgeCool -= dt; curCool -= dt;
    // the mist on the ridge road: shut until the gong
    if (!GA.open(G.state) && nudgeCool <= 0 && Math.hypot(Y.x - GA.MIST.x, Y.z - GA.MIST.z) < 9) {
      nudgeCool = 25; G.sim.mimo.scared = 2.5;
      STORY.think('A thick gray mist hangs over the road, and the air smells of flowers… far away. The Hush is too strong here. Maybe once another bell rings, it will thin out.', 6);
    }
    // Flora on the trellis catches your eye (once the mist is gone)
    if (GA.open(G.state) && !f.flora && Math.hypot(Y.x - SPOT.flora.x, Y.z - SPOT.flora.z) < 9) { STORY.run(floraScene); return; }
    // through the gate and down into the valley
    if (f.gardenGate && !f.gardens && GA.valDist(Y.x, Y.z) < -1) { STORY.run(arriveGardens); return; }
    // a word Mimo is curious about (seen, not taught yet): the flowers, the bees, the hives, the greenhouse
    if (curCool <= 0 && f.gardens && Y.speed < 6 && LEX.mayIntroduce && LEX.mayIntroduce()) {
      curCool = 4;
      const spots = [['w.sunflower', SPOT.sunflowers], ['w.lavender', SPOT.lavender], ['w.rose', SPOT.roses], ['w.tulip', SPOT.tulips], ['w.hive', SPOT.hives], ['w.bee', SPOT.hives], ['w.greenhouse', { x: GA.DOOR.x, z: GA.DOOR.z - 1 }]];
      for (const [id, at] of spots) {
        if (LEX.taught(id) || !LEX.seen(id) || Math.hypot(Y.x - at.x, Y.z - at.z) > 7) continue;
        curCool = 60; STORY.run(() => STORY.teachWord(id, { spot: { x: at.x + (Y.x - at.x) * 0.4, z: at.z + (Y.z - at.z) * 0.4 }, look: at })); return;
      }
    }
  }
  // the look of things follows the save: the mist, the gate, the judges, their things and ribbons, the fans, the vines, the bell
  function sync() {
    if (!G || !B) return;
    const f = F(), st = S(), open = GA.open(G.state);
    const key = [open, !!f.gardenGate, Object.keys(st.liked).sort().join(','), Object.keys(st.judged).sort().join(','), !!f.showDone, !!f.greenOpen, !!f.gardensFree].join('|');
    if (key === synced) return;
    const first = !synced;
    synced = key;
    B.setMist(open, first);
    if (open) liftPatch('gardensGate', first);
    B.setGate(!!f.gardenGate, first);
    const fl = person('flora');
    if (fl && f.gardenGate && fl.climb.on) { fl.climb.on = false; fl.x = 207.6; fl.z = -89.2; fl.y = WORLD.terrainAt(fl.x, fl.z); fl.baseYaw = 2.6; fl.set('idle', false); }
    for (const id of JUDGES) {
      const p = person(id); if (!p) continue;
      if (st.liked[id]) { if (p.hushed || p.gray) restore(p, true); }
      else if (!p.hushed) { p.hushed = true; p.set(p.def.pose || 'idle', true); }
    }
    B.setProp('roses', !st.liked.polo); B.setProp('sunflowers', !!st.liked.tomasa); B.setProp('honey', !!st.liked.lola);
    for (const k of ['big', 'pretty', 'sweet']) B.setRibbon(k, !!st.judged[k]);
    for (const p of B.people) if (p.fan) { if (f.showDone) { if (p.hushed || p.gray) restore(p, true); } else if (!p.hushed) { p.hushed = true; p.set('idle', true); } }
    B.setVines(!f.greenOpen, first);
    B.setBell(!!f.gardensFree, first);
    if (f.gardensFree) liftPatch('gardens', first);
  }
  function liftPatch(tag, instant) {
    const i = WORLD.L.hush.findIndex(h => h[tag]);
    if (i >= 0 && WORLD.L.hush[i].a > 0.001) G.w3d.liftHush(i, instant);
  }

  // ---------------------------------------------------------------- the module's hooks
  function init(game) {
    G = game; B = game.gardens || null;
    GA.registerWords();
    if (B) {     // (the build's per-frame update gets the sync and the carried things)
      const up0 = B.update;
      B.update = (dt, t, you) => { sync(); up0(dt, t, you); placeCarried(); };
    }
    // the story's hooks (story.js's appended section): our things join the E race, and our per-frame checks run
    if (STORY.extra) STORY.extra.push({ interactables, tick });
    if (STORY._test && STORY._test.zones) STORY._test.zones.push(
      { id: 'gardenRoad', test: (x, z) => GA.open(G.state) && z > -112 && z < -102 && GA.roadDist(x, z) < 7, run: () => UI.chapter('The Garden Road', 'Chapter 1 · The fourth bell') });
  }
  Object.assign(GA, { init, interactables, target, wayIn, tick, sync, sayT, person, likedCount, judgedCount, restore, learnUse, JUDGE_OF, JUDGES,
    _: { floraScene, watchFlora, gateScene, arriveGardens, melisaScene, melisaAgain, judgeTalk, likeScene, contestScene, showDone, deliver, doorScene, S, reportBell } });
  // (live getters: Object.assign would copy their values once, while they're still null)
  Object.defineProperty(GA, 'G', { get: () => G, configurable: true });
  Object.defineProperty(GA, 'built', { get: () => B, configurable: true });
})();
