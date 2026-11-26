'use strict';
// The Frost Peaks (DESIGN.md 14.1, region 5; 14.10): the fifth bell, higher in the mountains beyond the quarry.
// A back way out of the miners' camp (between the bunkhouse and the canteen) climbs east up a canyon, the Frost Pass,
// into the snow. A gray blizzard fills the pass until the fourth bell has rung (gardensFree below). Halfway up, Lía, the
// clockmaker's apprentice, sits by a stone hut blowing on her pinwheel: Mimo learns «sopla / sopra / puste» by watching
// her, then blows away the snowdrift that blocks the road. At the top lies Escarcha, a snowy village of clocks, where time
// stopped when the Hush came: every clock froze at a different time, and its owner froze with it, the snowflakes hanging
// in the air around them. You set each clock by saying the time it should show (graded S–D like the shops): the bakery,
// the school, the post office, the inn, the town hall's calendar (the day) and the weather house on the square (the
// weather). Tobías, the old master clockmaker (Ciro's teacher), knows the old tower's great clock. Above the village, on a
// ledge, stands the Ice Clock Tower (icetower.js: ICETOWER), with the workshop's bell at the top: the fifth bell.
//
// One global, PEAKS, shaped like CAVES:
//   plain data, ready before world.js: layout, landmarks, hush, roamers, open(state) (the gate), roadDist(x, z),
//     ground(x, z, h), playDist(x, z), keepClear(x, z, pad), bareAt(x, z), tint(x, z, color, slope, h), noOuterTree(x, z),
//     areaAt(x, z), songAt(x, z), drawMap(ctx, o)
//   PEAKS.build(scene, { terrainAt }) → { colliders, platforms, moving, group, people, update(dt, t, you|null), objects, stats() }
//   the game side: init(game) (words, lines, the quest steps), interactables(), target(), wayIn(), tick(), sync(),
//     state in state.peaks; flags: peaks (arrived), liaSeen, drift, tobias, clocksSet, towerOpen, peaksFree (ICETOWER's
//     finale, bells → 5), tobiasFifth
// Needs THREE (r128), core.js, toonkit.js, lexicon.js, lines.js, icons.js and caves.js (its Kit) at load; UI, STORY,
// WORLD, Sound at run time.

const PEAKS = (() => {
  const INK = '#2b2235';

  // ================================================================ the gate: when the region opens
  // The pass opens once the Bloom Gardens' bell (bell 4) has rung: flags.gardensFree (region 4's), or four bells rung.
  // This is the one place that decides it.
  const GARDENS_FLAG = 'gardensFree';
  const open = s => !!(s && s.flags && (s.flags[GARDENS_FLAG] || (s.flags.bells || 0) >= 4));

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
  // the Frost Pass: from the miners' camp (between the bunkhouse and the canteen) east up the canyon to Escarcha's gate
  const ROAD_PTS = [[100, -261.8], [108, -261.7], [116, -261.0], [124, -259.2], [132, -256.6], [140, -254.4], [148, -253.4], [156, -253.6], [164, -254.8], [172, -256.4], [180, -257.6], [187, -258.0]];
  const ROAD = spline(ROAD_PTS, 6);
  const SEG = [];       // each segment: start, direction, length, and the arc length at its start
  { let s = 0; for (let i = 0; i < ROAD.length - 1; i++) { const [ax, az] = ROAD[i], [bx, bz] = ROAD[i + 1], l = Math.hypot(bx - ax, bz - az) || 1e-6; SEG.push({ ax, az, ux: (bx - ax) / l, uz: (bz - az) / l, l, s }); s += l; } }
  const ROAD_LEN = SEG.reduce((a, g) => a + g.l, 0);
  // the nearest point on the road: { d (distance), s (arc length), ux, uz (its direction) }
  function roadInfo(x, z) {
    if (x < 88 || x > 200 || z < -280 || z > -236) return { d: 1e9, s: 0, ux: 1, uz: 0 };
    let best = { d: 1e9, s: 0, ux: 1, uz: 0 };
    for (const g of SEG) {
      const t = clamp((x - g.ax) * g.ux + (z - g.az) * g.uz, 0, g.l), px = g.ax + g.ux * t, pz = g.az + g.uz * t, d = Math.hypot(x - px, z - pz);
      if (d < best.d) best = { d, s: g.s + t, ux: g.ux, uz: g.uz };
    }
    return best;
  }
  const roadDist = (x, z) => roadInfo(x, z).d;
  const ROAD_W = 4.2;                                          // the open road's half-width (the canyon's walls stand past it)
  // the village: a flat snowy plateau
  const VILLAGE = { x: 205, z: -258, rx: 22, rz: 17 };
  const VY = 5.2, CAMP_Y = 0.4, LY = 7.4;                      // the village's floor, the camp's (caves.js), the tower's ledge
  const villageE = (x, z) => Math.hypot((x - VILLAGE.x) / VILLAGE.rx, (z - VILLAGE.z) / VILLAGE.rz);
  const villageDist = (x, z) => (villageE(x, z) - 1) * VILLAGE.rz;          // (roughly the distance to its edge: < 0 inside)
  // the road climbs from the camp's floor to the village's (flat for the first stretch, out of the camp)
  const roadY = s => CAMP_Y + (VY - CAMP_Y) * smoothstep(9, ROAD_LEN - 3, s);
  // the Ice Clock Tower on its ledge, north-east of the village, and the path up to it
  const TOWER = { x: 240, z: -278, r: 4.3, h: 26 };
  const DOOR = { x: 240, z: -273.4 };                          // the tower's door (south face)
  const LEDGE = { x: 238.4, z: -271.2, r: 5.0 };
  const PATH = { ax: 223.4, az: -265.6, bx: 234.6, bz: -270.0, w: 2.3 };
  function pathInfo(x, z) {
    const dx = PATH.bx - PATH.ax, dz = PATH.bz - PATH.az, l2 = dx * dx + dz * dz, t = clamp(((x - PATH.ax) * dx + (z - PATH.az) * dz) / l2, 0, 1);
    return { d: Math.hypot(x - (PATH.ax + dx * t), z - (PATH.az + dz * t)), t };
  }
  // the stone hut halfway up the pass (Lía's nook, a little off the road), the snowdrift, and the blizzard (the gate)
  const HUT = { x: 141.4, z: -248.6, w: 4.2, d: 3.4, rot: Math.PI };
  const NOOK = { x: 141.6, z: -251.2, r: 4.6 };
  const NOOK_Y = roadY(roadInfo(NOOK.x, NOOK.z).s);
  const DRIFT = { x: 151.5, z: -253.4 };
  const GATE = { x: 116.6, z: -260.9, r: 7 };
  // the buildings (front = local +z, rot = the mesh's rotation.y, as the towns do it); w × d, floors for the camera's blockers
  const B = (id, x, z, w, d, rot, kind, floors = 1) => ({ id, x, z, w, d, rot, kind, floors });
  const BUILDINGS = [
    B('bakery', 190.6, -250.8, 6.2, 5.0, Math.PI / 2, 'bakery'),
    B('school', 196.5, -244.6, 7.2, 5.0, Math.PI, 'school'),
    B('post', 213.8, -245.2, 6.0, 4.6, Math.PI, 'post'),
    B('inn', 221.2, -256.6, 8.0, 6.0, -Math.PI / 2, 'inn', 2),
    B('hall', 192.0, -265.6, 7.0, 5.6, Math.PI / 2, 'hall', 2),
    B('workshop', 206.2, -271.6, 10.4, 7.0, 0, 'workshop', 2),
    B('house1', 219.8, -267.4, 5.0, 4.4, -Math.PI / 2 - 0.35, 'house'),
    B('house2', 227.8, -248.6, 5.0, 4.4, -Math.PI / 2, 'house'),
  ];
  // a building's front: the point d/2 + out in front of it, and the way it faces (its yaw)
  const frontOf = (b, out = 0) => ({ x: b.x + Math.sin(b.rot) * (b.d / 2 + out), z: b.z + Math.cos(b.rot) * (b.d / 2 + out), yaw: b.rot });
  const bld = id => BUILDINGS.find(b => b.id === id);
  // the clocks to set: on a building's front over its door (or the weather house on the square), what it froze at, and
  // what it should show. kind: 'time' { h, m } · 'day' (today's day of the week) · 'weather' (it's snowing)
  const CLOCKS = [
    { id: 'bakery', who: 'rafa', b: 'bakery', kind: 'time', h: 7, m: 0, froze: [4, 50], sign: 'Hot bread · 7:00' },
    { id: 'school', who: 'clara', b: 'school', kind: 'time', h: 8, m: 15, froze: [2, 10], sign: 'School starts · 8:15' },
    { id: 'post', who: 'nando', b: 'post', kind: 'time', h: 1, m: 0, froze: [11, 40], sign: 'The mail goes down · 1:00' },
    { id: 'inn', who: 'pili', b: 'inn', kind: 'time', h: 3, m: 30, froze: [6, 5], sign: 'Hot chocolate · 3:30' },
    { id: 'hall', who: 'ines', b: 'hall', kind: 'day', froze: 'sun', sign: 'Today is…' },
    { id: 'weather', who: 'teo', b: null, kind: 'weather', froze: 'sun', sign: 'What’s the weather?' },
  ];
  // the people of Escarcha (frozen until their clock is set), Tobías and Lía (es/pt names that read in every language;
  // g: the gender their own words agree with)
  const SPOT = {
    plaza: { x: 205, z: -257.6 }, weather: { x: 205.8, z: -258.8 }, enter: { x: 186.4, z: -258.0 }, hutWatch: { x: 144.4, z: -252.6 },
    tobias: { x: 206.2, z: -266.6, yaw: 0 }, liaHut: { x: 142.6, z: -251.0, yaw: -2.5 }, liaHome: { x: 203.0, z: -266.2, yaw: 0.4 },
    driftFront: { x: 148.2, z: -253.4 }, doorFront: { x: 240, z: -271.6 }, ledge: { x: LEDGE.x, z: LEDGE.z },
  };
  const PEOPLE = [
    { id: 'rafa', name: 'Rafa', g: 'm', clock: 'bakery', look: { coat: '#f4efe2', pants: '#5a4a3a', skin: '#e6b48c', hair: '#3a2b26', hat: '#f4efe2', apron: true, chef: true, wide: 1.12 }, hold: 'bread' },
    { id: 'clara', name: 'Clara', g: 'f', clock: 'school', look: { coat: '#4f7fb0', pants: '#3f3a4a', skin: '#efc29a', hair: '#8a4a2a', scarf: '#e0a43c', bun: true, glasses: true }, hold: 'handbell' },
    { id: 'nando', name: 'Nando', g: 'm', clock: 'post', look: { coat: '#2f5f8a', pants: '#3a3d4a', skin: '#c98e62', hair: '#1f1a18', cap: '#2f5f8a', scarf: '#c9453a' }, hold: 'letter' },
    { id: 'pili', name: 'Pili', g: 'f', clock: 'inn', look: { coat: '#b84a5a', pants: '#4a3f3a', skin: '#a8714a', hair: '#1f1a18', scarf: '#f2e6c9', braid: true }, hold: 'mug' },
    { id: 'ines', name: 'Inés', g: 'f', clock: 'hall', look: { coat: '#5a3f7a', pants: '#3a3a44', skin: '#efc29a', hair: '#d8d0c4', scarf: '#d9493b', bun: true, sash: true, old: true }, hold: null },
    { id: 'teo', name: 'Teo', g: 'm', clock: 'weather', look: { coat: '#5f7a4a', pants: '#4a4436', skin: '#d9a27a', hair: '#e8e4dc', beanie: '#e0743c', beard: true, old: true }, hold: 'pipe' },
  ];
  const TOBIAS = { id: 'tobias', name: 'Tobías', g: 'm', look: { coat: '#6b4a30', pants: '#3f3a4a', skin: '#e6b48c', hair: '#f0ece4', apron: true, beard: true, glasses: true, loupe: true, old: true } };
  const LIA = { id: 'lia', name: 'Lía', g: 'f', kid: true, look: { coat: '#e0743c', pants: '#3f4a6a', skin: '#e6b48c', hair: '#5a3020', beanie: '#d9493b', scarf: '#ffd84a', braid: true } };
  // (ja rōmaji capitalizes these names and places mid-sentence; CJK.md's table)
  if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['リア', 'トビアス', 'エスカルチャ', 'ブリサ', 'ラファ', 'クララ', 'ナンド', 'ピリ', 'イネス', 'テオ']);
  // the snowballs on the pass (they show up once the pass is open); fights in the snow arena
  const ROAMERS = [
    { x: 125.5, z: -258.6, area: 'peaks', biome: 'snow', foes: [{ kind: 'snowball', color: 'red' }, { kind: 'snowball', color: 'blue' }] },
    { x: 161.0, z: -254.4, area: 'peaks', biome: 'snow', foes: [{ kind: 'snowball', color: 'green' }, { kind: 'moth', color: 'yellow' }] },
    { x: 175.5, z: -256.9, area: 'peaks', biome: 'snow', foes: [{ kind: 'snowball', color: 'yellow' }, { kind: 'hushling', color: 'blue' }] },
  ];
  // the gray patches world.js adds to L.hush: the village (it lifts when the bell rings) and the blizzard in the pass
  const HUSH = [{ x: VILLAGE.x, z: VILLAGE.z, r: 25, a: 0.5, peaks: true }, { x: GATE.x, z: GATE.z, r: 8, a: 0.85, peaksGate: true }];
  const REGION = { x0: 104, x1: 279, zS: -196, zN: -300 };     // where this file shapes the land

  // ================================================================ the ground (world.js rawHeight, playDist, grass, scatter)
  // how far you are from somewhere you can walk (< 0 inside): the road, the hut's nook, the village, the ledge path, the ledge
  function walkDist(x, z) {
    let d = roadDist(x, z) - ROAD_W;
    d = Math.min(d, Math.hypot(x - NOOK.x, z - NOOK.z) - NOOK.r, villageDist(x, z), pathInfo(x, z).d - PATH.w, Math.hypot(x - LEDGE.x, z - LEDGE.z) - LEDGE.r);
    return d;
  }
  // the mountains: rock and snow rising away from where you walk, east of the quarry's (whose canyon this road cuts
  // through), steepest and highest behind the village, where the peaks are
  function mountain(x, z) {
    const zf = smoothstep(-198, -216, z), xf = smoothstep(126, 148, x);
    if (zf <= 0 || xf <= 0) return 0;
    const d = walkDist(x, z);
    let m = 13 * smoothstep(1.5, 11, d) + 9 * smoothstep(11, 32, d);
    m += 2.6 * Math.sin(x * 0.27 + 0.6) * Math.sin(z * 0.31 + 1.2) * smoothstep(4, 12, d) + 1.3 * Math.sin(x * 0.71 + z * 0.53) * smoothstep(3, 8, d);
    m += 12 * smoothstep(-272, -292, z) * smoothstep(3, 12, d);          // the peaks behind the village
    return m * zf * xf;
  }
  function ground(x, z, h) {
    if (x < REGION.x0 || x > REGION.x1 || z > REGION.zS || z < REGION.zN - 12) return h;
    h += mountain(x, z);
    // the flat places, each at its own height: the road (climbing), the nook (the road's height there), the village, the
    // path up (climbing) and the ledge
    const R = roadInfo(x, z), P = pathInfo(x, z);
    const cand = [
      [1 - smoothstep(ROAD_W - 0.6, ROAD_W + 4.5, R.d), roadY(R.s)],
      [1 - smoothstep(NOOK.r - 0.5, NOOK.r + 3, Math.hypot(x - NOOK.x, z - NOOK.z)), NOOK_Y],
      [1 - smoothstep(-1.2, 3.5, villageDist(x, z)), VY],
      [1 - smoothstep(PATH.w - 0.4, PATH.w + 3, P.d), lerp(VY, LY, smoothstep(0.1, 0.95, P.t))],
      [1 - smoothstep(LEDGE.r - 0.6, LEDGE.r + 3, Math.hypot(x - LEDGE.x, z - LEDGE.z)), LY],
    ];
    let K = 0, sw = 0, sy = 0;
    for (const [k, y] of cand) { if (k <= 0) continue; K = Math.max(K, k); sw += k * k; sy += k * k * y; }
    if (K > 0) h = lerp(h, sy / sw, K);
    // the tower stands on a plinth of rock at the back of the ledge
    const td = Math.hypot(x - TOWER.x, z - TOWER.z);
    if (td < TOWER.r + 2) h = Math.max(h, lerp(LY + 0.4, h, smoothstep(TOWER.r, TOWER.r + 2, td)));
    return h;
  }
  // how far from anywhere you're meant to be (negative inside). Past a few units it jumps past world.js's tree wall (> 26),
  // so the snow and rock stay bare: the edges are walls of invisible solids instead (build: edgeWalls)
  function playDist(x, z) {
    if (x < REGION.x0 - 12 || x > REGION.x1 + 10 || z > -190 || z < REGION.zN - 10) return 1e9;
    const d = walkDist(x, z);
    return d > 4 ? 30 + d : d;
  }
  // world3d.js: no woods past the map's edge where the peaks stand (their backdrop is drawn by build)
  const noOuterTree = (x, z) => z < -288 && z > -400 && x > 140 && x < 330;
  // world3d.js's ring of far mountains: one landed right behind the village, its slope through the tower's ledge. Push any
  // out that way back past the peaks, and put snow on them (m: the mesh, its position already set; r: its base radius)
  function farMountain(m, r) {
    const p = m.position; if (p.x < 100 || p.z > -150) return;
    const dx = p.x - VILLAGE.x, dz = p.z - VILLAGE.z, d = Math.hypot(dx, dz) || 1, need = r + 90;
    if (d < need) { p.x = VILLAGE.x + dx / d * need; p.z = VILLAGE.z + dz / d * need; }
    const pos = m.geometry.attributes.position, col = m.geometry.attributes.color; if (!pos || !col) return;
    let top = 1; for (let i = 0; i < pos.count; i++) top = Math.max(top, pos.getY(i));
    const rock = new THREE.Color('#9aa0aa'), snow = new THREE.Color('#f4f8fb'), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) { c.copy(rock).lerp(snow, smoothstep(0.18, 0.5, pos.getY(i) / top)); col.setXYZ(i, c.r, c.g, c.b); }
    col.needsUpdate = true;
  }
  // world.js open(): no trees, rocks or flowers where you walk, nor in the snow around it
  const KEEP = [];
  function keepClear(x, z, pad = 0) {
    if (x < REGION.x0 - 8 || x > REGION.x1 + 10 || z > -190 || z < REGION.zN - 10) return false;
    if (walkDist(x, z) < 3 + pad) return true;
    if (Math.hypot(x - TOWER.x, z - TOWER.z) < TOWER.r + 4 + pad) return true;
    for (const c of KEEP) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true;
    if (x > 128 && z < -199 && mountain(x, z) > 7.5) return true;      // (a tree line: the field's woods stop partway up the snowy slopes)
    return z < -212 && x > 128;          // (up in the snow nothing grows)
  }
  // how snowy a spot is (0..1): everything past the canyon's foot, more the higher it is
  function snowAt(x, z, h) {
    if (x < 106 || z > -196) return 0;
    const mask = smoothstep(106, 124, x) * smoothstep(-198, -214, z);
    return mask * Math.max(smoothstep(1.2, 3.4, h === undefined ? 4 : h), smoothstep(130, 150, x));
  }
  // world.js townBare: no grass in the snow (0..1)
  function bareAt(x, z) {
    if (x < 104 || z > -194) return 0;
    return clamp(smoothstep(106, 118, x) * smoothstep(-196, -210, z), 0, 1);
  }
  // world3d.js's terrain tint: snow over everything up here, packed down on the road and the village's lanes, and rock on
  // the steepest slopes (c: the color so far, a THREE.Color; sl: the slope; h: the height)
  const SNOW = new THREE.Color('#eef3f8'), SNOW2 = new THREE.Color('#dfe8f1'), PACKED = new THREE.Color('#c3ccd6'), ICE = new THREE.Color('#bcd9ea'), ROCK = new THREE.Color('#8d8f97');
  const _c = new THREE.Color();
  function tint(x, z, c, sl = 0, h = 0) {
    const k = snowAt(x, z, h); if (k <= 0) return;
    _c.copy(SNOW).lerp(SNOW2, 0.5 + 0.5 * Math.sin(x * 0.21 + Math.cos(z * 0.17) * 2));
    const trod = Math.max(1 - smoothstep(1.2, 2.8, roadDist(x, z)), 1 - smoothstep(4.5, 7.5, Math.hypot(x - SPOT.plaza.x, z - SPOT.plaza.z)), 1 - smoothstep(0.6, 1.6, pathInfo(x, z).d));
    _c.lerp(PACKED, trod * 0.75);
    _c.lerp(ROCK, smoothstep(1.5, 2.6, sl) * 0.8);
    c.lerp(_c, k);
  }
  // the mini-map's area names
  const AREAS = { pass: { id: 'frostpass', name: 'The Frost Pass', color: '#7b8fa6' }, village: { id: 'escarcha', name: 'Escarcha', color: '#5d7fa8' }, tower: { id: 'icetower', name: 'The Ice Clock Tower', color: '#4f8fb0' } };
  function areaAt(x, z) {
    if (x < 106 || x > REGION.x1 || z > -236 || z < -296) return null;
    if (Math.hypot(x - LEDGE.x, z - LEDGE.z) < LEDGE.r + 1.5 || pathInfo(x, z).d < PATH.w + 1 || Math.hypot(x - TOWER.x, z - TOWER.z) < TOWER.r + 2) return AREAS.tower;
    if (villageDist(x, z) < 2) return AREAS.village;
    if (roadDist(x, z) < 10 || Math.hypot(x - NOOK.x, z - NOOK.z) < NOOK.r + 3) return x < 111 ? null : AREAS.pass;
    return null;
  }
  // the music: snowy funk all over the region ('peaks', or the forest's when audio.js has none)
  function songAt(x, z) {
    const a = areaAt(x, z); if (!a) return null;
    if (typeof ICETOWER !== 'undefined' && ICETOWER.inside) return typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('icetower') ? 'icetower' : 'mill';
    return typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('peaks') ? 'peaks' : 'forest';
  }
  // the mini-map's picture (minimap.js drawLand, in world units): snow over the land, the road, the square, the roofs, the tower
  function drawMap(c, o = {}) {
    const PX = o.PX || 0.33, INKC = o.INK || INK;
    c.save();
    c.lineJoin = 'round'; c.lineCap = 'round';
    // the snow, a block per three units (the heights from world.js's grid)
    for (let x = 106; x < REGION.x1; x += 3) for (let z = -296; z < -198; z += 3) {
      const h = typeof WORLD !== 'undefined' ? WORLD.terrainAt(x, z) : 4, k = snowAt(x, z, h);
      if (k < 0.05) continue;
      c.globalAlpha = Math.min(0.9, k * (walkDist(x, z) < 1 ? 0.95 : 0.75)); c.fillStyle = walkDist(x, z) < 1 ? '#f4f8fb' : '#d6e0ea'; c.fillRect(x - 1.5, z - 1.5, 3.1, 3.1);
    }
    c.globalAlpha = 1;
    // the road and the path up to the ledge
    const line = pts => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); };
    for (const pts of [ROAD, [[PATH.ax, PATH.az], [PATH.bx, PATH.bz]]]) { c.strokeStyle = 'rgba(70,86,110,0.55)'; c.lineWidth = 3.6; line(pts); c.stroke(); c.strokeStyle = '#c9d4de'; c.lineWidth = 2.6; line(pts); c.stroke(); }
    // the square
    c.fillStyle = '#c9d4de'; c.strokeStyle = 'rgba(70,86,110,0.5)'; c.lineWidth = 1.2 * PX; c.beginPath(); c.arc(SPOT.plaza.x, SPOT.plaza.z, 6.5, 0, TAU); c.fill(); c.stroke();
    // the roofs, with an ink edge (snow on them), the hut
    const roof = (b, col) => { c.save(); c.translate(b.x, b.z); c.rotate(-(b.rot || 0)); c.fillStyle = col; c.strokeStyle = INKC; c.lineWidth = 1.3 * PX; c.beginPath(); c.rect(-b.w / 2 - 0.3, -b.d / 2 - 0.3, b.w + 0.6, b.d + 0.6); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(-b.w / 2, -b.d / 2, b.w, b.d * 0.45); c.restore(); };
    BUILDINGS.forEach(b => roof(b, b.kind === 'workshop' ? '#7a4a3a' : b.kind === 'inn' ? '#9a5a3c' : b.kind === 'hall' ? '#6a5a7a' : '#8a6a52'));
    roof(HUT, '#7d7a76');
    // the Ice Clock Tower: a round icy blue tower
    c.fillStyle = 'rgba(25,16,40,0.25)'; c.beginPath(); c.arc(TOWER.x + 0.4, TOWER.z + 0.5, TOWER.r, 0, TAU); c.fill();
    c.fillStyle = '#9fd2ea'; c.strokeStyle = INKC; c.lineWidth = 1.4 * PX; c.beginPath(); c.arc(TOWER.x, TOWER.z, TOWER.r, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#f4f8fb'; c.beginPath(); c.arc(TOWER.x, TOWER.z, TOWER.r * 0.55, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#e6b84a'; c.beginPath(); c.arc(TOWER.x, TOWER.z, 1.0, 0, TAU); c.fill(); c.stroke();
    c.restore();
  }

  // ================================================================ (the rest: words, lines, the build, the game side)
  return {
    layout: { buildings: BUILDINGS, hut: HUT, village: VILLAGE, road: ROAD_PTS, tower: TOWER, door: DOOR, ledge: LEDGE, path: PATH, gate: GATE, drift: DRIFT },
    landmarks: Object.assign({ village: { x: VILLAGE.x, z: VILLAGE.z }, tower: TOWER, door: DOOR, gate: GATE, drift: DRIFT, hut: HUT }, SPOT),
    hush: HUSH, roamers: ROAMERS, open, GARDENS_FLAG,
    roadDist, roadInfo, roadY, ground, playDist, keepClear, bareAt, snowAt, tint, areaAt, songAt, drawMap, mountain, noOuterTree, farMountain, walkDist, villageDist, villageE, pathInfo, frontOf, bld,
    ROAD, ROAD_PTS, ROAD_LEN, ROAD_W, KEEP, VILLAGE, VY, LY, CAMP_Y, TOWER, DOOR, LEDGE, PATH, HUT, NOOK, DRIFT, GATE, BUILDINGS, CLOCKS, SPOT, PEOPLE, TOBIAS, LIA, REGION, AREAS,
  };
})();

// ================================================================ words, icons and lines (registered at load), and the clock grader
(() => {
  const C = PEAKS;
  // the region's words (w.clock, w.bell, w.mountain, w.bread, w.chocolate come from other files)
  const NEW_WORDS = [
    { id: 'w.snow', es: 'nieve', pt: 'neve', de: 'Schnee', zh: '[雪|xuě]', ja: '[雪|ゆき]', en: 'snow', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'nieves', pt: 'neves', de: 'Schnee', zh: '[雪|xuě]', ja: '[雪|ゆき]' }, icon: 'snow' },
    { id: 'w.ice', es: 'hielo', pt: 'gelo', de: 'Eis', zh: '[冰|bīng]', ja: '[氷|こおり]', en: 'ice', g: { es: 'm', pt: 'm', de: 'n' }, pl: { es: 'hielos', pt: 'gelos', de: 'Eis', zh: '[冰|bīng]', ja: '[氷|こおり]' }, icon: 'ice' },
  ];
  // blow: Mimo learns it from Lía (the battle registers the same verb: whichever comes first keeps its object, and gets these)
  const BLOW = { id: 'v.blow', kind: 'verb', es: 'sopla', pt: 'sopra', de: 'puste', zh: '[吹|chuī]', ja: '[吹|ふ]いて', en: 'blow', icon: 'blow',
    alt: { es: ['sople', 'sóplale', 'soplá', 'soplale'], pt: ['sopre', 'soprar', 'assopra', 'assopre'], de: ['pust', 'pusten', 'pustet', 'blas', 'blase', 'blasen'], ja: ['[吹|ふ]け', '[吹|ふ]く'] } };
  // other files' words that have no zh / ja yet (filled in at init, only when missing)
  const CJK_FILL = { 'w.clock': { zh: '[时钟|shí zhōng]', ja: '[時計|とけい]' }, 'w.bell': { zh: '[钟|zhōng]', ja: '[鐘|かね]' }, 'w.chocolate': { zh: '[巧克力|qiǎo kè lì]', ja: 'チョコレート' } };
  function registerWords() {
    if (typeof LEX === 'undefined') return;
    LEX.register(NEW_WORDS.filter(w => !LEX.item(w.id)));
    const it = LEX.item('v.blow');
    if (!it) LEX.register([BLOW]);
    else { it.icon = 'blow'; it.alt = it.alt || {}; for (const l of Object.keys(BLOW.alt)) it.alt[l] = Array.from(new Set([...(it.alt[l] || []), ...BLOW.alt[l]])); for (const l of ['zh', 'ja']) if (!it[l]) it[l] = BLOW[l]; }
    for (const [id, f] of Object.entries(CJK_FILL)) { const w = LEX.item(id); if (w) for (const l of ['zh', 'ja']) if (!w[l]) w[l] = f[l]; }
  }
  registerWords();
  // icons (ICONS.add: drawn twice, pass 0 the paper border, pass 1 colors and ink, in a 100 × 100 box)
  // a clock face showing h:m (the settable clocks' pictures, and Mimo's word for «reloj»)
  const clockIcon = (h, m, col = '#f4efe2') => (c, p, H) => {
    H.shape(c, p, H.ell(0, 2, 36, 36), '#c98a4a'); H.shape(c, p, H.ell(0, 2, 30, 30), col);
    if (!p) return;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r0 = i % 3 ? 25 : 22; c.beginPath(); c.moveTo(Math.sin(a) * r0, 2 - Math.cos(a) * r0); c.lineTo(Math.sin(a) * 28, 2 - Math.cos(a) * 28); c.lineWidth = i % 3 ? 1.6 : 3; c.strokeStyle = H.INK; c.stroke(); }
    const ah = ((h % 12) + m / 60) / 12 * TAU, am = m / 60 * TAU;
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 2); c.lineTo(Math.sin(ah) * 15, 2 - Math.cos(ah) * 15); c.lineWidth = 5; c.strokeStyle = H.INK; c.stroke();
    c.beginPath(); c.moveTo(0, 2); c.lineTo(Math.sin(am) * 24, 2 - Math.cos(am) * 24); c.lineWidth = 3; c.strokeStyle = '#c9453a'; c.stroke();
    H.dot(c, 0, 2, 3.5, H.INK);
  };
  if (typeof ICONS !== 'undefined') {
    ICONS.add('blow', (c, p, h) => {      // a round face with puffed cheeks, blowing a gust
      h.shape(c, p, h.ell(-14, 4, 21, 21), '#9fd2ea'); h.shape(c, p, h.ell(-6, 12, 7, 6), '#f2a3b8'); h.shape(c, p, h.ell(4, 6, 6, 6), '#e0503f');
      if (p) {
        h.dot(c, -20, -6, 2.6, h.INK); h.dot(c, -8, -6, 2.6, h.INK);
        c.lineCap = 'round'; c.strokeStyle = h.INK; c.lineWidth = 2.6;
        [[-8, 14], [0, 26], [8, 38]].forEach(([y0, len], i) => { c.beginPath(); c.moveTo(14, y0 - 10 + i * 8); c.quadraticCurveTo(14 + len * 0.6, y0 - 20 + i * 8, 14 + len, y0 - 6 + i * 8); c.stroke(); });
      }
    });
    ICONS.add('snow', (c, p, h) => {      // a snowflake
      h.shape(c, p, h.ell(0, 0, 33, 33), '#dfeefa');
      if (p) { c.strokeStyle = '#4f7fb0'; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU, x = Math.cos(a), y = Math.sin(a); c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(x * 26, y * 26); c.stroke(); c.lineWidth = 3; for (const s of [-1, 1]) { const b = a + s * 0.6; c.beginPath(); c.moveTo(x * 15, y * 15); c.lineTo(x * 15 + Math.cos(b) * 9, y * 15 + Math.sin(b) * 9); c.stroke(); } } }
    });
    ICONS.add('ice', (c, p, h) => {       // an ice cube with a shine
      h.shape(c, p, h.poly([[-26, -10], [0, -24], [26, -10], [0, 4]]), '#dff2fb'); h.shape(c, p, h.poly([[-26, -10], [0, 4], [0, 32], [-26, 18]]), '#9fd2ea'); h.shape(c, p, h.poly([[26, -10], [0, 4], [0, 32], [26, 18]]), '#7fbedd');
      if (p) { c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.moveTo(-18, 2); c.lineTo(-18, 12); c.stroke(); }
    });
    ICONS.add('pinwheel', (c, p, h) => { h.shape(c, p, h.rr(-2, 0, 4, 40, 2), '#8a5f3e'); ['#e0503f', '#ffd84a', '#4c7fd8', '#5fb257'].forEach((col, i) => { const a = i * Math.PI / 2; h.shape(c, p, h.poly([[0, -8], [Math.cos(a) * 26, -8 + Math.sin(a) * 26], [Math.cos(a + 0.9) * 14, -8 + Math.sin(a + 0.9) * 14]]), col); }); if (p) h.dot(c, 0, -8, 3, h.INK); });
    ICONS.add('weatherhouse', (c, p, h) => {      // a little house with two doors: the snow figure is out
      h.shape(c, p, h.rr(-26, -8, 52, 38, 3), '#e8d9b6'); h.shape(c, p, h.poly([[-32, -6], [0, -34], [32, -6]]), '#9a5a3c');
      h.shape(c, p, h.rr(-20, 4, 14, 22, 6), '#3a3550'); h.shape(c, p, h.rr(6, 4, 14, 22, 6), '#3a3550');
      h.shape(c, p, h.ell(-13, 12, 6, 6), '#ffffff'); h.shape(c, p, h.ell(-13, 22, 7, 7), '#ffffff');
      if (p) { h.dot(c, 13, 14, 5, '#ffd84a'); }
    });
    ICONS.add('calendar', (c, p, h) => { h.shape(c, p, h.rr(-28, -26, 56, 56, 5), '#fffaf0'); h.shape(c, p, h.rr(-28, -26, 56, 16, 5), '#c9453a'); if (p) { [-14, 14].forEach(x => h.dot(c, x, -26, 3.5, h.INK)); for (let i = 0; i < 9; i++) h.dot(c, -16 + (i % 3) * 16, 0 + Math.floor(i / 3) * 10, 2.6, i === 4 ? '#c9453a' : 'rgba(43,34,53,0.6)'); } });
    for (const cl of C.CLOCKS) if (cl.kind === 'time') ICONS.add('clk.' + cl.id, clockIcon(cl.h, cl.m));
    ICONS.add('clk.noon', clockIcon(12, 0, '#dff2fb'));
    if (!ICONS.keys.includes('clock')) ICONS.add('clock', clockIcon(10, 10));
  }

  // ---------------------------------------------------------------- lines: T(en, es, pt, de, zh, ja). The en is the weave's (slots).
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const PL = {
    // Lía, the clockmaker's apprentice: a bubbly kid who talks fast; «tú» / «você» / «du»
    'l.hello': T('{w.hello}! You came up the canyon? Wow! I’m Lía. I can’t get home: a huge pile of {w.snow} is blocking the road!',
      '¡Hola! ¿Subiste por el cañón? ¡Qué valiente! Soy Lía. No puedo volver a casa: ¡un montón de nieve tapa el camino!',
      'Oi! Você subiu pelo cânion? Que coragem! Eu sou a Lía. Não consigo voltar pra casa: um monte de neve está bloqueando o caminho!',
      'Hallo! Du bist durch die Schlucht gekommen? Mutig! Ich bin Lía. Ich komme nicht nach Hause: Ein riesiger Schneehaufen versperrt den Weg!',
      '[你好|nǐ hǎo] ！ [你|nǐ] [是|shì] [从|cóng] [峡谷|xiá gǔ] [上来|shàng lái] [的|de] [吗|ma] ？ [真|zhēn] [勇敢|yǒng gǎn] ！ [我|wǒ] [叫|jiào] [莉娅|Lì yà] 。 [我|wǒ] [回|huí] [不|bù] [了|liǎo] [家|jiā] ： [一|yī] [大|dà] [堆|duī] [雪|xuě] [挡住|dǎng zhù] [了|le] [路|lù] ！',
      'こんにちは ！ [谷|たに] を [登|のぼ]って きた の ？ すごい ！ わたし 、 リア 。 [家|いえ] に [帰|かえ]れない の 。 [大|おお]きな [雪|ゆき] の [山|やま] が [道|みち] を ふさいでる ！'),
    'l.blow': T('That’s it! Blow! If your little {c.friend} blows really hard… maybe the {w.snow} will fly away!',
      '¡Eso es! ¡Sopla! Si tu amiguito sopla muy fuerte… ¡a lo mejor la nieve sale volando!',
      'Isso! Sopra! Se o seu amiguinho soprar bem forte… talvez a neve saia voando!',
      'Genau! Puste! Wenn dein kleiner Freund ganz fest pustet… fliegt der Schnee vielleicht weg!',
      '[对|duì] ！ [吹|chuī] ！ [如果|rú guǒ] [你|nǐ] [的|de] [小|xiǎo] [朋友|péng you] [用力|yòng lì] [吹|chuī] … [雪|xuě] [说不定|shuō bu dìng] [会|huì] [飞走|fēi zǒu] ！',
      'そう ！ [吹|ふ]いて ！ お[友達|ともだち] が [思|おも]いっきり [吹|ふ]いたら … [雪|ゆき] が [飛|と]んで いく かも ！'),
    'l.drift': T('Wow! The road is open! {c.thanks:f}! Come to Escarcha. My master, Tobías, is in the clock workshop. See you there!',
      '¡Guau! ¡El camino está libre! ¡Gracias! Ven a Escarcha. Mi maestro, Tobías, está en el taller de relojes. ¡Nos vemos allá!',
      'Uau! O caminho está livre! Obrigada! Vem pra Escarcha. O meu mestre, o Tobías, está na oficina de relógios. Te vejo lá!',
      'Wow! Der Weg ist frei! Danke! Komm nach Escarcha. Mein Meister, Tobías, ist in der Uhrenwerkstatt. Bis gleich!',
      '[哇|wā] ！ [路|lù] [通|tōng] [了|le] ！ [谢谢|xiè xie] ！ [来|lái] [霜村|Shuāng cūn] [吧|ba] 。 [我|wǒ] [的|de] [师傅|shī fu] [托比亚斯|Tuō bǐ yà sī] [在|zài] [钟表|zhōng biǎo] [工坊|gōng fáng] 。 [我们|wǒ men] [那里|nà lǐ] [见|jiàn] ！',
      'わあ ！ [道|みち] が [開|あ]いた ！ ありがとう ！ エスカルチャ に [来|き]て 。 わたし の [師匠|ししょう] 、 トビアス は [時計|とけい] [工房|こうぼう] に いる よ 。 [向|む]こう で ね ！'),
    'l.home': T('The master knows every {w.clock} in the world. Even the great {w.clock} in the old {w.tower}!',
      'El maestro conoce todos los relojes del mundo. ¡Hasta el gran reloj de la torre vieja!',
      'O mestre conhece todos os relógios do mundo. Até o grande relógio da torre velha!',
      'Der Meister kennt jede Uhr der Welt. Sogar die große Uhr im alten Turm!',
      '[师傅|shī fu] [认识|rèn shi] [世界|shì jiè] [上|shàng] [所有|suǒ yǒu] [的|de] [时钟|shí zhōng] 。 [连|lián] [古塔|gǔ tǎ] [的|de] [大钟|dà zhōng] [也|yě] [认识|rèn shi] ！',
      '[師匠|ししょう] は [世界|せかい] じゅう の [時計|とけい] を [知|し]って いる の 。 [古|ふる]い [塔|とう] の [大時計|おおどけい] まで ！'),
    'l.after': T('Listen! Tick, tock! Escarcha is ticking again! You’re the best!',
      '¡Escucha! ¡Tic, tac! ¡Escarcha vuelve a andar! ¡Eres lo máximo!',
      'Escuta! Tic, tac! Escarcha voltou a funcionar! Você é demais!',
      'Hör mal! Tick, tack! Escarcha tickt wieder! Du bist super!',
      '[你|nǐ] [听|tīng] ！ [滴答|dī dā] ， [滴答|dī dā] ！ [霜村|Shuāng cūn] [又|yòu] [走|zǒu] [起来|qǐ lái] [了|le] ！ [你|nǐ] [太|tài] [棒|bàng] [了|le] ！',
      '[聞|き]いて ！ チクタク ！ エスカルチャ が また [動|うご]き [出|だ]した ！ [最高|さいこう] ！'),
    // Tobías, the old master clockmaker (Ciro's teacher): slow and warm, he talks in clocks
    't.hello': T('Ah… visitors. Lía told me about you. I’m Tobías, the clockmaker. Ciro, in Molinar, was my student, many years ago.',
      'Ah… visitas. Lía me habló de ti. Soy Tobías, el relojero. Ciro, el de Molinar, fue mi alumno hace muchos años.',
      'Ah… visitas. A Lía me falou de você. Eu sou o Tobías, o relojoeiro. O Ciro, de Molinar, foi meu aluno, há muitos anos.',
      'Ah… Besuch. Lía hat mir von dir erzählt. Ich bin Tobías, der Uhrmacher. Ciro aus Molinar war vor vielen Jahren mein Schüler.',
      '[啊|a] … [有|yǒu] [客人|kè rén] [来|lái] [了|le] 。 [莉娅|Lì yà] [跟|gēn] [我|wǒ] [说|shuō] [过|guo] [你|nǐ] 。 [我|wǒ] [是|shì] [托比亚斯|Tuō bǐ yà sī] ， [钟表匠|zhōng biǎo jiàng] 。 [磨坊镇|Mò fáng zhèn] [的|de] [西罗|Xī luó] [是|shì] [我|wǒ] [很|hěn] [多|duō] [年|nián] [前|qián] [的|de] [学生|xué sheng] 。',
      'ああ … お[客|きゃく]さん です か 。 リア から [聞|き]きました 。 わたし は トビアス 、 [時計|とけい] [職人|しょくにん] です 。 モリナール の シロ は 、 [昔|むかし] の わたし の [弟子|でし] です 。'),
    't.frozen': T('When the Hush came, every {w.clock} in Escarcha stopped, each one at a different time. And the people stopped with them. Look: even the {w.snow} is frozen in the air.',
      'Cuando llegó el Silencio, todos los relojes de Escarcha se pararon, cada uno a una hora distinta. Y la gente se paró con ellos. Mira: hasta la nieve está quieta en el aire.',
      'Quando o Silêncio chegou, todos os relógios de Escarcha pararam, cada um numa hora diferente. E as pessoas pararam junto. Olha: até a neve está parada no ar.',
      'Als die Stille kam, sind alle Uhren in Escarcha stehen geblieben, jede zu einer anderen Zeit. Und die Leute sind mit ihnen stehen geblieben. Schau: Sogar der Schnee steht still in der Luft.',
      '[寂静|jì jìng] [来|lái] [的|de] [时候|shí hou] ， [霜村|Shuāng cūn] [所有|suǒ yǒu] [的|de] [时钟|shí zhōng] [都|dōu] [停|tíng] [了|le] ， [每|měi] [个|gè] [停|tíng] [在|zài] [不同|bù tóng] [的|de] [时间|shí jiān] 。 [人们|rén men] [也|yě] [跟着|gēn zhe] [停|tíng] [住|zhù] [了|le] 。 [你|nǐ] [看|kàn] ， [连|lián] [雪|xuě] [都|dōu] [停|tíng] [在|zài] [空中|kōng zhōng] 。',
      '[静寂|せいじゃく] が [来|き]た とき 、 エスカルチャ の [時計|とけい] は ぜんぶ [止|と]まりました 。 それぞれ ちがう [時間|じかん] に 。 [人|ひと] も いっしょ に [止|と]まって しまった 。 ほら 、 [雪|ゆき] まで [空|そら] で [止|と]まって います 。'),
    't.ask': T('A {w.clock} is a voice: it says the time. Look at each one, read its sign, and say out loud the time it should show. A {w.clock} that hears the right time remembers how to tick.',
      'Un reloj es una voz: dice la hora. Mira cada reloj, lee su letrero y di en voz alta la hora que debe marcar. Un reloj que oye la hora correcta se acuerda de andar.',
      'Um relógio é uma voz: ele diz as horas. Olha cada relógio, lê a placa e diz em voz alta a hora que ele deve mostrar. Um relógio que ouve a hora certa lembra como funcionar.',
      'Eine Uhr ist eine Stimme: Sie sagt die Zeit. Schau dir jede Uhr an, lies ihr Schild und sag laut, wie spät es sein soll. Eine Uhr, die die richtige Zeit hört, weiß wieder, wie sie tickt.',
      '[时钟|shí zhōng] [就是|jiù shì] [一个|yī gè] [声音|shēng yīn] ： [它|tā] [说|shuō] [时间|shí jiān] 。 [看看|kàn kan] [每|měi] [个|gè] [时钟|shí zhōng] ， [读|dú] [它|tā] [的|de] [牌子|pái zi] ， [大声|dà shēng] [说出|shuō chū] [它|tā] [该|gāi] [显示|xiǎn shì] [的|de] [时间|shí jiān] 。 [听到|tīng dào] [对|duì] [的|de] [时间|shí jiān] ， [时钟|shí zhōng] [就|jiù] [会|huì] [想起|xiǎng qǐ] [怎么|zěn me] [走|zǒu] 。',
      '[時計|とけい] は [声|こえ] です 。 [時間|じかん] を [言|い]います 。 [一|ひと]つ ずつ [見|み]て 、 [看板|かんばん] を [読|よ]んで 、 [何時|なんじ] に する か [声|こえ] に [出|だ]して [言|い]って ください 。 [正|ただ]しい [時間|じかん] を [聞|き]けば 、 [時計|とけい] は [動|うご]き [方|かた] を [思|おも]い [出|だ]します 。'),
    't.bell': T('Our {w.bell}, the fifth of the eight, hangs at the top of the Ice Clock Tower, up on the ledge. But its door is buried in {w.snow}… First, the clocks.',
      'Nuestra campana, la quinta de las ocho, cuelga arriba de la Torre del Reloj de Hielo, allá en la cornisa. Pero su puerta está enterrada en la nieve… Primero, los relojes.',
      'O nosso sino, o quinto dos oito, fica no alto da Torre do Relógio de Gelo, lá em cima da encosta. Mas a porta está enterrada na neve… Primeiro, os relógios.',
      'Unsere Glocke, die fünfte von acht, hängt ganz oben im Eisuhrturm, dort oben auf dem Felsen. Aber seine Tür ist im Schnee begraben… Zuerst die Uhren.',
      '[我们|wǒ men] [的|de] [钟|zhōng] ， [八|bā] [个|gè] [钟|zhōng] [里|lǐ] [的|de] [第五|dì wǔ] [个|gè] ， [挂|guà] [在|zài] [冰钟楼|Bīng zhōng lóu] [的|de] [顶上|dǐng shang] 。 [可是|kě shì] [楼|lóu] [门|mén] [被|bèi] [雪|xuě] [埋|mái] [住|zhù] [了|le] … [先|xiān] [修|xiū] [时钟|shí zhōng] [吧|ba] 。',
      'わたし たち の [鐘|かね] 、 [八|やっ]つ の うち の [五|いつ]つ [目|め] は 、 [氷|こおり] の [時計塔|とけいとう] の いちばん [上|うえ] に あります 。 でも 、 [塔|とう] の [扉|とびら] は [雪|ゆき] に うまって います … まず は [時計|とけい] です 。'),
    't.again': T('Read each sign, then say the time to its {w.clock}, in a whole sentence.',
      'Lee cada letrero y dile la hora a su reloj: «Son las siete», «Es la una»…',
      'Lê cada placa e diz a hora pro relógio: «São sete horas», «É uma hora»…',
      'Lies jedes Schild und sag der Uhr die Zeit: «Es ist sieben Uhr», «Es ist ein Uhr»…',
      '[读|dú] [每|měi] [个|gè] [牌子|pái zi] ， [然后|rán hòu] [告诉|gào su] [时钟|shí zhōng] [时间|shí jiān] ： “ [七点|qī diǎn] ” 、 “ [一点|yī diǎn] ” …',
      '[看板|かんばん] を [読|よ]んで 、 [時計|とけい] に [時間|じかん] を [言|い]って ください 。 「 [七時|しちじ] 」 、 「 [一時|いちじ] 」 …'),
    't.first': T('First the clocks, please. Escarcha needs its time back.',
      'Primero los relojes, por favor. Escarcha necesita su hora.',
      'Primeiro os relógios, por favor. Escarcha precisa das suas horas de volta.',
      'Zuerst die Uhren, bitte. Escarcha braucht seine Zeit zurück.',
      '[请|qǐng] [先|xiān] [修|xiū] [时钟|shí zhōng] 。 [霜村|Shuāng cūn] [需要|xū yào] [找回|zhǎo huí] [时间|shí jiān] 。',
      'まず は [時計|とけい] を お[願|ねが]い します 。 エスカルチャ に [時間|じかん] を [返|かえ]して ください 。'),
    't.allSet': T('Listen… tick, tock, tick, tock. Escarcha is awake again! Now the tower. Its door is under the {w.snow}… but your little {c.friend} knows what to do with {w.snow}, doesn’t it?',
      'Escucha… tic, tac, tic, tac. ¡Escarcha despertó! Ahora, la torre. Su puerta está bajo la nieve… pero tu amiguito sabe qué hacer con la nieve, ¿verdad?',
      'Escuta… tic, tac, tic, tac. Escarcha acordou! Agora, a torre. A porta está debaixo da neve… mas o seu amiguinho sabe o que fazer com a neve, né?',
      'Hör mal… tick, tack, tick, tack. Escarcha ist wieder wach! Jetzt der Turm. Seine Tür liegt unter dem Schnee… aber dein kleiner Freund weiß, was man mit Schnee macht, oder?',
      '[你|nǐ] [听|tīng] … [滴答|dī dā] ， [滴答|dī dā] 。 [霜村|Shuāng cūn] [醒|xǐng] [了|le] ！ [现在|xiàn zài] [去|qù] [塔|tǎ] [那里|nà lǐ] 。 [塔|tǎ] [门|mén] [在|zài] [雪|xuě] [下面|xià miàn] … [不过|bù guò] [你|nǐ] [的|de] [小|xiǎo] [朋友|péng you] [知道|zhī dào] [怎么|zěn me] [对付|duì fu] [雪|xuě] ， [对|duì] [吧|ba] ？',
      '[聞|き]いて … チクタク 、 チクタク 。 エスカルチャ が [目|め] を [覚|さ]ました ！ [次|つぎ] は [塔|とう] です 。 [扉|とびら] は [雪|ゆき] の [下|した] … でも 、 お[友達|ともだち] は [雪|ゆき] の あつかい 、 わかります よ ね ？'),
    't.clock': T('Fifty years ago, Ciro and I built the heart of the great {w.clock} in the old {w.tower}. It doesn’t only tell the time… If someone winds it backwards, time runs backwards too. Be careful up there.',
      'Hace cincuenta años, Ciro y yo hicimos el corazón del gran reloj de la torre vieja. No solo dice la hora… Si alguien le da cuerda al revés, el tiempo también va al revés. Ten cuidado allá arriba.',
      'Há cinquenta anos, eu e o Ciro fizemos o coração do grande relógio da torre velha. Ele não só diz as horas… Se alguém der corda ao contrário, o tempo também anda ao contrário. Toma cuidado lá em cima.',
      'Vor fünfzig Jahren haben Ciro und ich das Herz der großen Uhr im alten Turm gebaut. Sie zeigt nicht nur die Zeit… Wenn jemand sie rückwärts aufzieht, läuft auch die Zeit rückwärts. Pass da oben gut auf.',
      '[五十|wǔ shí] [年|nián] [前|qián] ， [我|wǒ] [和|hé] [西罗|Xī luó] [做|zuò] [了|le] [古塔|gǔ tǎ] [大钟|dà zhōng] [的|de] [心脏|xīn zàng] 。 [它|tā] [不|bù] [只|zhǐ] [是|shì] [报时|bào shí] … [要是|yào shi] [有人|yǒu rén] [把|bǎ] [它|tā] [倒着|dào zhe] [上|shàng] [发条|fā tiáo] ， [时间|shí jiān] [也|yě] [会|huì] [倒着|dào zhe] [走|zǒu] 。 [在|zài] [上面|shàng mian] [要|yào] [小心|xiǎo xīn] 。',
      '[五十年|ごじゅうねん] [前|まえ] 、 シロ と わたし で [古|ふる]い [塔|とう] の [大時計|おおどけい] の [心臓|しんぞう] を [作|つく]りました 。 あの [時計|とけい] は [時間|じかん] を [言|い]う だけ で は ない … だれか が [逆|ぎゃく] に ねじ を [巻|ま]けば 、 [時間|じかん] も [逆|ぎゃく] に [進|すす]む 。 [上|うえ] で は [気|き] を つけて 。'),
    't.fifth': T('The fifth {w.bell}! Hear it? Every {w.clock} in Escarcha answers it. Your friend Noa came through here too, you know. She went down to Port Brisa, the big port by the sea.',
      '¡La quinta campana! ¿La oyes? Todos los relojes de Escarcha le responden. Tu amiga Noa también pasó por aquí, ¿sabes? Bajó a Puerto Brisa, el gran puerto junto al mar.',
      'O quinto sino! Está ouvindo? Todos os relógios de Escarcha respondem. A sua amiga Noa também passou por aqui, sabia? Ela desceu para o Porto Brisa, o grande porto à beira-mar.',
      'Die fünfte Glocke! Hörst du sie? Alle Uhren in Escarcha antworten ihr. Deine Freundin Noa war übrigens auch hier. Sie ist hinunter nach Port Brisa, zum großen Hafen am Meer.',
      '[第五|dì wǔ] [个|gè] [钟|zhōng] ！ [你|nǐ] [听到|tīng dào] [了|le] [吗|ma] ？ [霜村|Shuāng cūn] [所有|suǒ yǒu] [的|de] [时钟|shí zhōng] [都|dōu] [在|zài] [回答|huí dá] [它|tā] 。 [你|nǐ] [的|de] [朋友|péng you] [诺娅|Nuò yà] [也|yě] [来|lái] [过|guo] [这里|zhè lǐ] 。 [她|tā] [下山|xià shān] [去|qù] [了|le] [微风港|Wēi fēng gǎng] ， [海边|hǎi biān] [的|de] [大|dà] [港口|gǎng kǒu] 。',
      '[五番目|ごばんめ] の [鐘|かね] ！ [聞|き]こえます か ？ エスカルチャ の [時計|とけい] が みんな [答|こた]えて います 。 あなた の お[友達|ともだち] の ノア も 、 ここ を [通|とお]りました よ 。 [海|うみ] の そば の [大|おお]きな [港|みなと] 、 ブリサ [港|こう] へ [下|お]りて いきました 。'),
    't.next': T('Port Brisa is far to the south-west, by the sea. Ships, gulls, sailors… The sixth {w.bell} must be there.',
      'Puerto Brisa está lejos, al suroeste, junto al mar. Barcos, gaviotas, marineros… La sexta campana debe de estar ahí.',
      'O Porto Brisa fica longe, a sudoeste, à beira-mar. Navios, gaivotas, marinheiros… O sexto sino deve estar lá.',
      'Port Brisa liegt weit im Südwesten, am Meer. Schiffe, Möwen, Seeleute… Die sechste Glocke muss dort sein.',
      '[微风港|Wēi fēng gǎng] [在|zài] [很|hěn] [远|yuǎn] [的|de] [西南|xī nán] [边|biān] ， [在|zài] [海边|hǎi biān] 。 [船|chuán] 、 [海鸥|hǎi ōu] 、 [水手|shuǐ shǒu] … [第六|dì liù] [个|gè] [钟|zhōng] [一定|yī dìng] [在|zài] [那里|nà lǐ] 。',
      'ブリサ [港|こう] は 、 ずっと [南西|なんせい] の [海|うみ] の そば です 。 [船|ふね] 、 カモメ 、 [船乗|ふなの]り … [六番目|ろくばんめ] の [鐘|かね] は きっと そこ です 。'),
    // (DESIGN.md 16: heard before you're asked, whole in the language with the English under it) Lía and her pinwheel, before
    // Mimo asks what she's doing; Tobías saying the time on his own clock, before you set the village's
    'l.demo': T('Whoooo! See? I blow, and it spins. You blow too!', '¡Fuuu! ¿Ves? Soplo y gira. ¡Sopla tú también!', 'Fuuu! Viu? Eu sopro e ele gira. Sopra você também!', 'Puuuh! Siehst du? Ich puste, und es dreht sich. Puste du auch!',
      '[呼|hū] ！ [看|kàn] ， [我|wǒ] [一|yī] [吹|chuī] ， [它|tā] [就|jiù] [转|zhuàn] 。 [你|nǐ] [也|yě] [吹|chuī] [吧|ba] ！', 'ふーっ ！ ほら 、 [吹|ふ]く と くるくる [回|まわ]る よ 。 [吹|ふ]いて みて ！'),
    't.demo': T('Watch. My {w.clock} says ten o’clock, so I say: «It’s ten o’clock». At one, I’d say: «It’s one o’clock».',
      'Mira. Mi reloj marca las diez, así que digo: «Son las diez». A la una, diría: «Es la una».',
      'Olha. O meu relógio marca dez horas, então eu digo: «São dez horas». À uma, eu diria: «É uma hora».',
      'Schau. Meine Uhr zeigt zehn Uhr, also sage ich: «Es ist zehn Uhr». Um eins würde ich sagen: «Es ist ein Uhr».',
      '[你|nǐ] [看|kàn] 。 [我|wǒ] [的|de] [钟|zhōng] [是|shì] [十点|shí diǎn] ， [所以|suǒ yǐ] [我|wǒ] [说|shuō] ： “ [十点|shí diǎn] [了|le] ” 。 [一点|yī diǎn] [的|de] [时候|shí hou] ， [就|jiù] [说|shuō] ： “ [一点|yī diǎn] [了|le] ” 。',
      '[見|み]て ください 。 わたし の [時計|とけい] は [十時|じゅうじ] です 。 だから 「 [十時|じゅうじ] です 」 と [言|い]います 。 [一時|いちじ] なら 、 「 [一時|いちじ] です 」 。'),
  };
  // (the day and the weather, Tobías's second example: the day is today's)
  const dayDemo = d => T(`And the calendar? Today is ${DAYS.en[d]}. And the weather? Look up: it’s snowing!`,
    `¿Y el calendario? Hoy es ${DAYS.es[d]}. ¿Y el tiempo? Mira arriba: ¡está nevando!`,
    `E o calendário? Hoje é ${DAYS.pt[d]}. E o tempo? Olha pra cima: está nevando!`,
    `Und der Kalender? Heute ist ${DAYS.de[d]}. Und das Wetter? Schau nach oben: Es schneit!`,
    `[日历|rì lì] [呢|ne] ？ [今天|jīn tiān] [是|shì] ${DAYS.zh[d]} 。 [天气|tiān qì] [呢|ne] ？ [你|nǐ] [看|kàn] [上面|shàng miàn] ： [下雪|xià xuě] [了|le] ！`,
    `カレンダー は ？ [今日|きょう] は ${DAYS.ja[d]} です 。 [天気|てんき] は ？ [上|うえ] を [見|み]て ください 。 [雪|ゆき] が [降|ふ]って います ！`);
  // the sentence frames on the clock box (zh / ja in the notation)
  const FRAME = {
    time: { es: '«Son las ___» · «Es la una»', pt: '«São ___ horas» · «É uma hora»', de: '«Es ist ___ Uhr»', zh: '“ ___ [点|diǎn] ”', ja: '「 ___ [時|じ] です 」' },
    day: { es: '«Hoy es ___»', pt: '«Hoje é ___»', de: '«Heute ist ___»', zh: '“ [今天|jīn tiān] [是|shì] ___ ”', ja: '「 [今日|きょう] は ___ です 」' },
    weather: { es: '«Está ___»', pt: '«Está ___»', de: '«Es ___»', zh: '“ [下|xià] ___ [了|le] ”', ja: '「 ___ が [降|ふ]って います 」' },
  };
  // the people of Escarcha, once their clock is set: back (their first words, all in the language) and chat (after)
  const VL = {
    rafa: { back: T('Seven o’clock! The {w.bread}! Mmm, it smells so good… {c.thanks}!', '¡Son las siete! ¡El pan! Mmm, qué rico huele… ¡Gracias!', 'São sete horas! O pão! Hum, que cheiro bom… Obrigado!', 'Es ist sieben Uhr! Das Brot! Mmm, das riecht so gut… Danke!',
      '[七点|qī diǎn] [了|le] ！ [我|wǒ] [的|de] [面包|miàn bāo] ！ [好|hǎo] [香|xiāng] [啊|a] … [谢谢|xiè xie] ！', '[七時|しちじ] だ ！ パン ！ うーん 、 いい におい … ありがとう ！'),
      chat: T('Every morning at seven: warm {w.bread} for the whole village.', 'Todas las mañanas a las siete: pan calentito para todo el pueblo.', 'Toda manhã às sete: pão quentinho para a vila inteira.', 'Jeden Morgen um sieben: warmes Brot für das ganze Dorf.',
        '[每天|měi tiān] [早上|zǎo shang] [七点|qī diǎn] ， [全|quán] [村|cūn] [都|dōu] [有|yǒu] [热|rè] [面包|miàn bāo] 。', '[毎朝|まいあさ] [七時|しちじ] に 、 [村|むら] の みんな に あたたかい パン 。') },
    clara: { back: T('A quarter past eight! The children are coming! {c.thanks:f}!', '¡Las ocho y cuarto! ¡Ya vienen los niños! ¡Gracias!', 'Oito e quinze! As crianças já estão chegando! Obrigada!', 'Viertel nach acht! Die Kinder kommen schon! Danke!',
      '[八点|bā diǎn] [一刻|yī kè] ！ [孩子们|hái zi men] [来|lái] [了|le] ！ [谢谢|xiè xie] ！', '[八時|はちじ] [十五分|じゅうごふん] ！ [子|こ]ども たち が [来|く]る ！ ありがとう ！'),
      chat: T('Today’s lesson: the days of the week. Monday, Tuesday, Wednesday…', 'La clase de hoy: los días de la semana. Lunes, martes, miércoles…', 'A aula de hoje: os dias da semana. Segunda, terça, quarta…', 'Die Stunde heute: die Wochentage. Montag, Dienstag, Mittwoch…',
        '[今天|jīn tiān] [的|de] [课|kè] ： [一个|yī gè] [星期|xīng qī] [的|de] [七|qī] [天|tiān] 。 [星期一|xīng qī yī] 、 [星期二|xīng qī èr] 、 [星期三|xīng qī sān] …', '[今日|きょう] の [授業|じゅぎょう] は 、 [曜日|ようび] です 。 [月曜日|げつようび] 、 [火曜日|かようび] 、 [水曜日|すいようび] …') },
    nando: { back: T('One o’clock: the mail goes down the {w.mountain}! {c.thanks}!', '¡Es la una! ¡El correo baja de la montaña! ¡Gracias!', 'É uma hora! O correio desce a montanha! Obrigado!', 'Es ist ein Uhr! Die Post geht den Berg hinunter! Danke!',
      '[一点|yī diǎn] [了|le] ！ [信|xìn] [要|yào] [送|sòng] [下山|xià shān] [了|le] ！ [谢谢|xiè xie] ！', '[一時|いちじ] だ ！ [郵便|ゆうびん] が [山|やま] を [下|お]りる ！ ありがとう ！'),
      chat: T('I carry letters up and down the {w.mountain}. In the {w.snow}, in the wind, in the sun.', 'Llevo cartas montaña arriba y montaña abajo. Con nieve, con viento, con sol.', 'Eu levo cartas montanha acima e montanha abaixo. Com neve, com vento, com sol.', 'Ich trage Briefe den Berg hinauf und hinunter. Bei Schnee, bei Wind, bei Sonne.',
        '[我|wǒ] [在|zài] [山|shān] [上|shàng] [山|shān] [下|xià] [送|sòng] [信|xìn] 。 [下雪|xià xuě] 、 [刮风|guā fēng] 、 [出|chū] [太阳|tài yáng] ， [都|dōu] [送|sòng] 。', '[山|やま] を [上|のぼ]ったり [下|お]りたり して 、 [手紙|てがみ] を [運|はこ]びます 。 [雪|ゆき] の [日|ひ] も 、 [風|かぜ] の [日|ひ] も 、 [晴|は]れ の [日|ひ] も 。') },
    pili: { back: T('Half past three: hot {w.chocolate} time! Come in whenever you like.', '¡Las tres y media! ¡La hora del chocolate caliente! Pasa cuando quieras.', 'Três e meia! Hora do chocolate quente! Entra quando quiser.', 'Halb vier! Zeit für heiße Schokolade! Komm rein, wann du willst.',
      '[三点半|sān diǎn bàn] [了|le] ！ [喝|hē] [热|rè] [巧克力|qiǎo kè lì] [的|de] [时间|shí jiān] [到|dào] [了|le] ！ [随时|suí shí] [进来|jìn lái] [吧|ba] 。', '[三時半|さんじはん] ！ ホット チョコレート の [時間|じかん] ！ いつでも [入|はい]って ね 。'),
      chat: T('In winter it’s very cold here. A hot {w.chocolate} helps.', 'En invierno aquí hace mucho frío. Un chocolate caliente ayuda.', 'No inverno aqui faz muito frio. Um chocolate quente ajuda.', 'Im Winter ist es hier sehr kalt. Eine heiße Schokolade hilft.',
        '[冬天|dōng tiān] [这里|zhè lǐ] [很|hěn] [冷|lěng] 。 [喝|hē] [杯|bēi] [热|rè] [巧克力|qiǎo kè lì] [就|jiù] [好|hǎo] [了|le] 。', '[冬|ふゆ] は ここ は とても [寒|さむ]い です 。 ホット チョコレート が いちばん 。') },
    ines: { back: null,       // (the day: built when it's said, below)
      chat: T('Seven days, four seasons… and in Escarcha it snows in all of them.', 'Siete días, cuatro estaciones… y en Escarcha nieva en todas.', 'Sete dias, quatro estações… e em Escarcha neva em todas.', 'Sieben Tage, vier Jahreszeiten… und in Escarcha schneit es in allen.',
        '[一个|yī gè] [星期|xīng qī] [七|qī] [天|tiān] ， [一年|yī nián] [四季|sì jì] … [霜村|Shuāng cūn] [每个|měi gè] [季节|jì jié] [都|dōu] [下雪|xià xuě] 。', '[一週間|いっしゅうかん] は [七日|なのか] 、 [季節|きせつ] は [四|よっ]つ … エスカルチャ は どの [季節|きせつ] も [雪|ゆき] です 。') },
    teo: { back: T('It’s snowing! Of course it’s snowing. In Escarcha it’s always snowing!', '¡Está nevando! Claro que está nevando. ¡En Escarcha siempre nieva!', 'Está nevando! Claro que está nevando. Em Escarcha sempre neva!', 'Es schneit! Natürlich schneit es. In Escarcha schneit es immer!',
      '[下雪|xià xuě] [了|le] ！ [当然|dāng rán] [在|zài] [下雪|xià xuě] 。 [霜村|Shuāng cūn] [总是|zǒng shì] [下雪|xià xuě] ！', '[雪|ゆき] が [降|ふ]って いる ！ もちろん [雪|ゆき] だ 。 エスカルチャ は いつも [雪|ゆき] ！'),
      chat: T('In spring it rains, in summer it’s hot, in autumn it’s windy… and here, in winter, it snows and snows.', 'En primavera llueve, en verano hace calor, en otoño hace viento… y aquí, en invierno, nieva y nieva.', 'Na primavera chove, no verão faz calor, no outono venta… e aqui, no inverno, neva e neva.', 'Im Frühling regnet es, im Sommer ist es heiß, im Herbst ist es windig… und hier, im Winter, schneit es und schneit es.',
        '[春天|chūn tiān] [下雨|xià yǔ] ， [夏天|xià tiān] [很|hěn] [热|rè] ， [秋天|qiū tiān] [刮风|guā fēng] … [这里|zhè lǐ] [的|de] [冬天|dōng tiān] ， [雪|xuě] [下|xià] [个|gè] [不停|bù tíng] 。', '[春|はる] は [雨|あめ] 、 [夏|なつ] は [暑|あつ]い 、 [秋|あき] は [風|かぜ] … ここ の [冬|ふゆ] は 、 [雪|ゆき] 、 [雪|ゆき] 、 [雪|ゆき] 。') },
  };
  // the days of the week (0 = Sunday, as Date counts), for the town hall's calendar
  const DAYS = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    pt: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
    de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    zh: ['[星期天|xīng qī tiān]', '[星期一|xīng qī yī]', '[星期二|xīng qī èr]', '[星期三|xīng qī sān]', '[星期四|xīng qī sì]', '[星期五|xīng qī wǔ]', '[星期六|xīng qī liù]'],
    ja: ['[日曜日|にちようび]', '[月曜日|げつようび]', '[火曜日|かようび]', '[水曜日|すいようび]', '[木曜日|もくようび]', '[金曜日|きんようび]', '[土曜日|どようび]'],
  };
  const today = () => new Date().getDay();
  const inesBack = d => T(`Today is ${DAYS.en[d]}! At last I know what day it is. {c.thanks:f}!`, `¡Hoy es ${DAYS.es[d]}! Por fin sé qué día es. ¡Gracias!`, `Hoje é ${DAYS.pt[d]}! Finalmente eu sei que dia é. Obrigada!`, `Heute ist ${DAYS.de[d]}! Endlich weiß ich, welcher Tag ist. Danke!`,
    `[今天|jīn tiān] [是|shì] ${DAYS.zh[d]} ！ [我|wǒ] [终于|zhōng yú] [知道|zhī dào] [今天|jīn tiān] [是|shì] [星期几|xīng qī jǐ] [了|le] 。 [谢谢|xiè xie] ！`, `[今日|きょう] は ${DAYS.ja[d]} です ！ やっと [曜日|ようび] が わかりました 。 ありがとう ！`);
  // Noa's notebook page at the top of the Ice Clock Tower (UI.page reads LINES via line(); [text] per language)
  const PAGE = {
    es: ['Aquí arriba el tiempo se paró y la nieve flota en el aire. Desde lo alto de la torre vi el mar, muy lejos, al suroeste. Hay un puerto grande: Puerto Brisa. Mañana bajo allí.'],
    pt: ['Aqui em cima o tempo parou e a neve flutua no ar. Do alto da torre eu vi o mar, bem longe, a sudoeste. Tem um porto grande: o Porto Brisa. Amanhã eu desço pra lá.'],
    de: ['Hier oben ist die Zeit stehen geblieben, und der Schnee schwebt in der Luft. Von der Turmspitze habe ich das Meer gesehen, weit weg im Südwesten. Dort ist ein großer Hafen: Port Brisa. Morgen gehe ich hinunter.'],
    zh: ['[这|zhè] [上面|shàng mian] [时间|shí jiān] [停|tíng] [了|le] ， [雪|xuě] [飘|piāo] [在|zài] [空中|kōng zhōng] 。 [从|cóng] [塔|tǎ] [顶|dǐng] [我|wǒ] [看到|kàn dào] [了|le] [大海|dà hǎi] ， [在|zài] [很|hěn] [远|yuǎn] [的|de] [西南|xī nán] [边|biān] 。 [那里|nà lǐ] [有|yǒu] [一个|yī gè] [大|dà] [港口|gǎng kǒu] ： [微风港|Wēi fēng gǎng] 。 [明天|míng tiān] [我|wǒ] [就|jiù] [下山|xià shān] [去|qù] 。'],
    ja: ['ここ で は [時間|じかん] が [止|と]まって 、 [雪|ゆき] が [空|そら] に [浮|う]いて いる 。 [塔|とう] の [上|うえ] から 、 ずっと [遠|とお]く の [南西|なんせい] に [海|うみ] が [見|み]えた 。 [大|おお]きな [港|みなと] が ある 。 ブリサ [港|こう] 。 [明日|あした] 、 そこ へ [下|お]りる 。'],
    en: ['Up here time has stopped, and the snow floats in the air. From the top of the tower I saw the sea, far away to the south-west. There’s a big port: Port Brisa. Tomorrow I’m going down there.'],
  };
  if (typeof LINES !== 'undefined' && !LINES['page.peaks']) LINES['page.peaks'] = PAGE;
  // (zh / ja: the dictionary that reads what you type learns these words)
  if (typeof CJK !== 'undefined' && CJK.addSource) {
    const all = [];
    for (const t of Object.values(PL)) all.push(t.zh, t.ja);
    for (const v of Object.values(VL)) for (const t of [v.back, v.chat]) if (t) all.push(t.zh, t.ja);
    all.push(...DAYS.zh, ...DAYS.ja, PAGE.zh[0], PAGE.ja[0], '[七点|qī diǎn] [八点|bā diǎn] [一点|yī diǎn] [三点半|sān diǎn bàn] [一刻|yī kè] [十二点|shí èr diǎn] [下雪|xià xuě] [很|hěn] [冷|lěng]',
      '[七時|しちじ] [八時|はちじ] [十五分|じゅうごふん] [一時|いちじ] [三時半|さんじはん] [十二時|じゅうにじ] [雪|ゆき] が [降|ふ]って います [寒|さむ]い');
    for (const s of all) if (s) { try { CJK.addSource(s); } catch (e) { /* (the engine may not take every string) */ } }
  }

  // ---------------------------------------------------------------- the model sentence for a clock (the "I don't know" box shows it)
  const NUMW = {
    es: ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'],
    pt: ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze'],
    de: ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'],
    zh: ['', '[一|yī]', '[两|liǎng]', '[三|sān]', '[四|sì]', '[五|wǔ]', '[六|liù]', '[七|qī]', '[八|bā]', '[九|jiǔ]', '[十|shí]', '[十一|shí yī]', '[十二|shí èr]'],
    ja: ['', '[一時|いちじ]', '[二時|にじ]', '[三時|さんじ]', '[四時|よじ]', '[五時|ごじ]', '[六時|ろくじ]', '[七時|しちじ]', '[八時|はちじ]', '[九時|くじ]', '[十時|じゅうじ]', '[十一時|じゅういちじ]', '[十二時|じゅうにじ]'],
  };
  const h12 = h => ((h - 1 + 120) % 12) + 1;
  function timeModel(h, m, l) {
    const n = NUMW[l] || NUMW.es, H = h12(h), N = h12(h + 1);
    if (l === 'es') { const head = H === 1 ? 'Es la una' : `Son las ${n[H]}`; return m === 0 ? `${head}.` : m === 15 ? `${head} y cuarto.` : m === 30 ? `${head} y media.` : m === 45 ? `${N === 1 ? 'Es la una' : 'Son las ' + n[N]} menos cuarto.` : `${head} y ${m}.`; }
    if (l === 'pt') { const head = H === 1 ? 'É uma' : `São ${n[H]}`; return m === 0 ? `${head} ${H === 1 ? 'hora' : 'horas'}.` : m === 15 ? `${head} e quinze.` : m === 30 ? `${head} e meia.` : m === 45 ? `São quinze para ${N === 1 ? 'a uma' : 'as ' + n[N]}.` : `${head} e ${m}.`; }
    if (l === 'de') { const w = H === 1 ? 'eins' : n[H], wN = N === 1 ? 'eins' : n[N]; return m === 0 ? `Es ist ${n[H]} Uhr.` : m === 15 ? `Es ist Viertel nach ${w}.` : m === 30 ? `Es ist halb ${wN}.` : m === 45 ? `Es ist Viertel vor ${wN}.` : `Es ist ${n[H]} Uhr ${m}.`; }
    if (l === 'zh') { const hz = H === 2 ? '[两点|liǎng diǎn]' : `[${n[H].slice(1, n[H].indexOf('|'))}点|${n[H].slice(n[H].indexOf('|') + 1, -1)} diǎn]`; return `${hz}${m === 0 ? '' : m === 15 ? ' [一刻|yī kè]' : m === 30 ? ' [半|bàn]' : m === 45 ? ' [三刻|sān kè]' : ''} 。`; }
    if (l === 'ja') return `${n[H]}${m === 0 ? '' : m === 15 ? ' [十五分|じゅうごふん]' : m === 30 ? ' [半|はん]' : m === 45 ? ' [四十五分|よんじゅうごふん]' : ''} です 。`;
    return `It’s ${H}:${String(m).padStart(2, '0')}.`;
  }
  const dayModel = (d, l) => ({ es: `Hoy es ${DAYS.es[d]}.`, pt: `Hoje é ${DAYS.pt[d]}.`, de: `Heute ist ${DAYS.de[d]}.`, zh: `[今天|jīn tiān] ${DAYS.zh[d]} 。`, ja: `[今日|きょう] は ${DAYS.ja[d]} です 。` }[l] || `Today is ${DAYS.en[d]}.`);
  const weatherModel = l => ({ es: 'Está nevando.', pt: 'Está nevando.', de: 'Es schneit.', zh: '[下雪|xià xuě] [了|le] 。', ja: '[雪|ゆき] が [降|ふ]って います 。' }[l] || 'It’s snowing.');
  function modelOf(cl, l) { return cl.kind === 'time' ? timeModel(cl.h, cl.m, l) : cl.kind === 'day' ? dayModel(today(), l) : weatherModel(l); }
  const enOf = cl => (cl.kind === 'time' ? `It’s ${cl.h}:${String(cl.m).padStart(2, '0')}.` : cl.kind === 'day' ? `Today is ${DAYS.en[today()]}.` : 'It’s snowing.');

  // ---------------------------------------------------------------- the grader: what you said (a time, a day, the weather), and how well (S–D)
  // es: «son las + hour» («es la una»), y cuarto / y media / menos cuarto / en punto · pt: «são + hour (horas)» («é uma
  // hora»), uma / duas are feminine, e quinze / e meia / quinze para as… · de: «es ist + hour Uhr», «ein Uhr» (but «eins»
  // alone), Viertel nach / halb (halb vier = 3:30) / Viertel vor. Days: «hoy es martes» (no article; lowercase in es and
  // pt), «Heute ist Dienstag» (a capital in de). The weather: «está nevando», «hace frío» (not «está frío»), «es schneit»,
  // «es ist kalt». Each kind of slip counts once (a major one twice), like the battles and the shop: 0 → S (or A with only
  // an accent or a style note), 1 → B, 2 → C, 3+ → D. zh / ja: what's said is found, and that's an S.
  const nd = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss').replace(/[^a-z0-9:\s-]/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const NUMS = {
    es: { una: 1, uno: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veinticinco: 25, treinta: 30, cuarenta: 40, cincuenta: 50 },
    pt: { uma: 1, um: 1, duas: 2, dois: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14, quinze: 15, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50 },
    de: { ein: 1, eins: 1, eine: 1, zwei: 2, drei: 3, vier: 4, funf: 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwolf: 12, zwoelf: 12, funfzehn: 15, fuenfzehn: 15, zwanzig: 20, dreissig: 30, vierzig: 40, funfzig: 50, fuenfzig: 50 },
  };
  // a number at token i (words, compounds like «cuarenta y cinco» / «fünfundvierzig», or digits): { v, n (tokens used), digits }
  function numAt(t, i, l) {
    const w = t[i]; if (w === undefined) return null;
    if (/^\d{1,2}$/.test(w)) return { v: +w, n: 1, digits: true };
    const N = NUMS[l] || NUMS.es;
    if (l === 'de') {
      const m = /^(ein|zwei|drei|vier|funf|fuenf|sechs|sieben|acht|neun)und(zwanzig|dreissig|vierzig|funfzig|fuenfzig)$/.exec(w);
      if (m) return { v: N[m[1]] + N[m[2]], n: 1 };
    }
    if (N[w] === undefined) return null;
    let v = N[w], n = 1;
    if (v >= 20 && v % 10 === 0 && (t[i + 1] === 'y' || t[i + 1] === 'e') && t[i + 2] !== undefined && N[t[i + 2]] !== undefined && N[t[i + 2]] < 10) { v += N[t[i + 2]]; n = 3; }
    return { v, n };
  }
  // the time in es / pt / de: { h, m, digits, at (token of the hour), halb } or null
  function readTime(t, l) {
    const digit = t.join(' ').match(/\b(\d{1,2})[: ](\d{2})\b/);
    if (digit) return { h: +digit[1], m: +digit[2], digits: true, at: -1 };
    if (l === 'es' || l === 'pt') {
      if (t.includes('mediodia') || t.includes('meiodia') || (t.includes('meio') && t.includes('dia'))) return { h: 12, m: 0, noon: true, at: -1 };
      if (t.includes('medianoche') || (t.includes('meia') && t.includes('noite'))) return { h: 12, m: 0, noon: true, at: -1 };
      // «quince para las seis» / «faltam quinze para as seis» (pt), «cuarto para las seis» (es, Latin America)
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== 'para') continue;
        const a = numAt(t, i - 1, l) || (t[i - 1] === 'cuarto' ? { v: 15 } : null), j = t[i + 1] === 'las' || t[i + 1] === 'as' || t[i + 1] === 'la' || t[i + 1] === 'a' ? i + 2 : i + 1, b = numAt(t, j, l);
        if (a && b && b.v <= 12) return { h: b.v - 1 || 12, m: 60 - a.v, at: j, digits: b.digits };
      }
      let at = -1, H = null;
      for (let i = 0; i < t.length; i++) { const x = numAt(t, i, l); if (x && x.v <= 12) { at = i; H = x; break; } }
      if (!H) return null;
      let m = 0, k = at + H.n;
      if (t[k] === 'horas' || t[k] === 'hora') k++;
      if ((t[k] === 'y' || t[k] === 'e')) {
        if (t[k + 1] === 'media' || t[k + 1] === 'meia') m = 30;
        else if (t[k + 1] === 'cuarto' || (t[k + 1] === 'um' && t[k + 2] === 'quarto') || t[k + 1] === 'quarto') m = 15;
        else { const x = numAt(t, k + 1, l); if (x) m = x.v; }
      } else if (t[k] === 'menos') {
        if (t[k + 1] === 'cuarto' || t[k + 1] === 'quarto') m = -15; else { const x = numAt(t, k + 1, l); if (x) m = -x.v; }
      } else { const x = numAt(t, k, l); if (x && x.v > 12) m = x.v; }
      let h = H.v;
      if (m < 0) { h = h - 1 || 12; m += 60; }
      return { h, m, at, digits: H.digits };
    }
    if (l === 'de') {
      for (let i = 0; i < t.length; i++) {
        if (t[i] === 'viertel' && (t[i + 1] === 'nach' || t[i + 1] === 'vor')) { const x = numAt(t, i + 2, l); if (x) return t[i + 1] === 'nach' ? { h: x.v, m: 15, at: i + 2, digits: x.digits } : { h: x.v - 1 || 12, m: 45, at: i + 2, digits: x.digits }; }
        if (t[i] === 'dreiviertel') { const x = numAt(t, i + 1, l); if (x) return { h: x.v - 1 || 12, m: 45, at: i + 1 }; }
        if (t[i] === 'viertel') { const x = numAt(t, i + 1, l); if (x) return { h: x.v - 1 || 12, m: 15, at: i + 1, regional: true }; }
        if (t[i] === 'halb') { const x = numAt(t, i + 1, l); if (x) return { h: x.v - 1 || 12, m: 30, at: i + 1, halb: true, digits: x.digits }; }
        if (t[i] === 'mittag' || t[i] === 'mitternacht') return { h: 12, m: 0, noon: true, at: -1 };
      }
      for (let i = 0; i < t.length; i++) {
        const a = numAt(t, i, l);
        if (a && (t[i + 1] === 'nach' || t[i + 1] === 'vor')) { const b = numAt(t, i + 2, l); if (b) return t[i + 1] === 'nach' ? { h: b.v, m: a.v, at: i + 2 } : { h: b.v - 1 || 12, m: 60 - a.v, at: i + 2 }; }
      }
      for (let i = 0; i < t.length; i++) {
        const x = numAt(t, i, l); if (!x || x.v > 12) continue;
        let m = 0; if (t[i + x.n] === 'uhr' || t[i + x.n] === 'uhren') { const y = numAt(t, i + x.n + 1, l); if (y) m = y.v; }
        return { h: x.v, m, at: i, digits: x.digits };
      }
    }
    return null;
  }
  // zh / ja: the time from characters, digits, pinyin or rōmaji
  const CN = { '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
  const cnNum = s => { if (/^\d+$/.test(s)) return +s; if (s === '十') return 10; if (s[0] === '十') return 10 + (CN[s[1]] || 0); if (s.length === 2 && s[1] === '十') return CN[s[0]] * 10; if (s.length === 3 && s[1] === '十') return CN[s[0]] * 10 + CN[s[2]]; return CN[s] || 0; };
  const PY = { yi: 1, er: 2, liang: 2, san: 3, si: 4, wu: 5, liu: 6, qi: 7, ba: 8, jiu: 9, shi: 10 };
  const pyNum = s => { if (!s) return 0; const m = /^(yi|er|liang|san|si|wu|liu|qi|ba|jiu)?(shi)?(yi|er|san|si|wu|liu|qi|ba|jiu)?$/.exec(s); if (!m) return 0; if (!m[2]) return PY[m[1] || m[3]] || 0; return (m[1] ? PY[m[1]] : 1) * 10 + (m[3] ? PY[m[3]] : 0); };
  const JR = { ichi: 1, ni: 2, san: 3, yo: 4, yon: 4, shi: 4, go: 5, roku: 6, shichi: 7, nana: 7, hachi: 8, ku: 9, kyu: 9, ju: 10, juichi: 11, juni: 12 };
  function readTimeCJK(text, l) {
    const raw = String(text), flat = raw.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ü/g, 'v');
    let can = ''; try { can = typeof CJK !== 'undefined' && CJK.canon ? CJK.canon(raw, l) : ''; } catch (e) { can = ''; }
    const lat = flat.replace(/[^a-z0-9]/g, '');
    if (l === 'zh') {
      let m = raw.match(/([一二两三四五六七八九十]{1,3}|\d{1,2})\s*[点點]\s*(半|[一1]刻|[三3]刻|([一二三四五六七八九十]{1,3}|\d{1,2})\s*分?)?/);
      if (m) { const h = cnNum(m[1]), x = m[2] || ''; const mm = /半/.test(x) ? 30 : /[一1]刻/.test(x) ? 15 : /[三3]刻/.test(x) ? 45 : m[3] ? cnNum(m[3]) : 0; if (h) return { h, m: mm, two: m[1] === '二' && h === 2 }; }
      for (const s of [lat, can]) {
        m = s.match(/(shier|shiyi|yi|er|liang|san|si|wu|liu|qi|ba|jiu|shi)dian(ban|yike|sanke|([a-z]+?)fen|(yi|er|san|si|wu|liu|qi|ba|jiu|shi)+)?/);
        if (m) { const h = pyNum(m[1]), x = m[2] || ''; const mm = x === 'ban' ? 30 : x === 'yike' ? 15 : x === 'sanke' ? 45 : m[3] ? pyNum(m[3]) : x ? pyNum(x) : 0; if (h) return { h, m: mm, two: m[1] === 'er' }; }
        m = s.match(/(\d{1,2})dian(ban|\d{1,2})?/); if (m) return { h: +m[1], m: m[2] === 'ban' ? 30 : m[2] ? +m[2] : 0 };
      }
      return null;
    }
    let m = raw.match(/([一二三四五六七八九十]{1,3}|\d{1,2})\s*時\s*(半|([一二三四五六七八九十]{1,3}|\d{1,2})\s*分)?/);
    if (m) { const h = cnNum(m[1]), mm = m[2] === '半' ? 30 : m[3] ? cnNum(m[3]) : 0; if (h) return { h, m: mm }; }
    // (rōmaji minutes, long vowels collapsed and the small っ dropped: jugo 15, sanju 30, yonjugo 45…)
    const jaMin = w => ({ go: 5, ju: 10, jugo: 15, niju: 20, nijugo: 25, sanju: 30, sanjugo: 35, yonju: 40, yonjugo: 45, goju: 50, gojugo: 55 })[w.replace(/([aiueo])\1+/g, '$1').replace(/p$/, '')] || 0;
    for (const s of [can, lat]) {
      // (the canon reads は as わ, the particle, so «半» typed as はん comes back as «wan»)
      m = s.replace(/([aiueo])\1+/g, '$1').match(/(juichi|juni|ichi|ni|san|yon|yo|go|roku|shichi|nana|hachi|kyu|ku|ju)ji(han|wan|([a-z]+?)(fun|pun))?/);
      if (m) { const h = JR[m[1]] || 0, mm = m[2] === 'han' || m[2] === 'wan' ? 30 : m[3] ? jaMin(m[3]) : 0; if (h) return { h, m: mm }; }
      m = s.match(/(\d{1,2})ji(han)?/); if (m) return { h: +m[1], m: m[2] ? 30 : 0 };
    }
    return null;
  }
  // where a word sits in what you typed (accents ignored, case kept): the matched text, and whether it's the first word
  function wordInRaw(raw, base) {
    const r = String(raw).normalize('NFD').replace(/[̀-ͯ]/g, ''), m = new RegExp(nd(base).replace(/\s+/g, '[\\s-]+'), 'i').exec(r);
    if (!m) return null;
    return { s: m[0], first: !/[a-z]/i.test(r.slice(0, m.index)) };
  }
  // the day of the week (0 = Sunday) in what you said, or -1
  const DAYKEY = {
    es: [/\bdomingo\b/, /\blunes\b/, /\bmartes\b/, /\bmiercoles\b/, /\bjueves\b/, /\bviernes\b/, /\bsabado\b/],
    pt: [/\bdomingo\b/, /\bsegunda\b/, /\bterca\b/, /\bquarta\b/, /\bquinta\b/, /\bsexta\b/, /\bsabado\b/],
    de: [/\bsonntag\b/, /\bmontag\b/, /\bdienstag\b/, /\bmittwoch\b/, /\bdonnerstag\b/, /\bfreitag\b/, /\b(samstag|sonnabend)\b/],
    zh: [/(星期|礼拜|周)(天|日)|xingqi(tian|ri)|libai(tian|ri)|zhou(ri|tian)/, /(星期|礼拜|周)一|xingqiyi|libaiyi|zhouyi/, /(星期|礼拜|周)二|xingqier|libaier|zhouer/, /(星期|礼拜|周)三|xingqisan|libaisan|zhousan/, /(星期|礼拜|周)四|xingqisi|libaisi|zhousi/, /(星期|礼拜|周)五|xingqiwu|libaiwu|zhouwu/, /(星期|礼拜|周)六|xingqiliu|libailiu|zhouliu/],
    ja: [/日曜|nichiyo/, /月曜|getsuyo|getuyo/, /火曜|kayo/, /水曜|suiyo/, /木曜|mokuyo/, /金曜|kinyo/, /土曜|doyo/],
  };
  function readDay(text, l) {
    const K = DAYKEY[l] || DAYKEY.es;
    let s = nd(text);
    if (l === 'zh' || l === 'ja') { let can = ''; try { can = CJK.canon(text, l); } catch (e) { /* */ } s = String(text) + ' ' + can + ' ' + nd(text).replace(/\s/g, ''); }
    for (let d = 0; d < 7; d++) if (K[d].test(s)) return d;
    return -1;
  }
  // the weather in what you said: 'snow' | 'cold' | 'sun' | 'rain' | 'wind' | 'hot' | null
  function readWeather(text, l) {
    if (l === 'zh' || l === 'ja') {
      let can = ''; try { can = CJK.canon(text, l); } catch (e) { /* */ }
      const s = String(text) + ' ' + can + ' ' + nd(text).replace(/\s/g, '');
      if (l === 'zh') return /雪|xue/.test(s) ? 'snow' : /冷|leng/.test(s) ? 'cold' : /晴|太阳|qing|taiyang/.test(s) ? 'sun' : /雨|yu\b|xiayu/.test(s) ? 'rain' : /风|feng/.test(s) ? 'wind' : /热|re\b/.test(s) ? 'hot' : null;
      return /雪|yuki/.test(s) ? 'snow' : /寒|samu/.test(s) ? 'cold' : /晴|hare/.test(s) ? 'sun' : /雨|ame/.test(s) ? 'rain' : /風|kaze/.test(s) ? 'wind' : /暑|atsu/.test(s) ? 'hot' : null;
    }
    const n = ' ' + nd(text) + ' ';
    const K = { es: { snow: /\b(nevando|nieva|nieve|nevada)\b/, cold: /\b(frio|helando|hielo)\b/, sun: /\b(sol|soleado)\b/, rain: /\b(lloviendo|llueve|lluvia)\b/, wind: /\b(viento)\b/, hot: /\b(calor)\b/ },
      pt: { snow: /\b(nevando|neva|neve)\b/, cold: /\b(frio|gelado)\b/, sun: /\b(sol|ensolarado)\b/, rain: /\b(chovendo|chove|chuva)\b/, wind: /\b(vento|ventando|venta)\b/, hot: /\b(calor|quente)\b/ },
      de: { snow: /\b(schneit|schnee|schneien)\b/, cold: /\b(kalt|friert|frostig)\b/, sun: /\b(sonne|sonnig)\b/, rain: /\b(regnet|regen)\b/, wind: /\b(windig|wind)\b/, hot: /\b(heiss|warm)\b/ } }[l] || {};
    for (const k of ['snow', 'cold', 'sun', 'rain', 'wind', 'hot']) if (K[k] && K[k].test(n)) return k;
    return null;
  }
  // grade(text, l, clock) → { said (the value heard, or null), right, slips, soft, letter, reason, model }
  function grade(text, l, cl) {
    const out = { said: null, right: false, slips: [], soft: [], model: modelOf(cl, l), kind: cl.kind };
    const slip = (kind, why, major) => { if (!out.slips.some(s => s.kind === kind)) out.slips.push({ kind, why, major: !!major }); };
    const soft = (kind, why) => { if (!out.soft.some(s => s.kind === kind)) out.soft.push({ kind, why }); };
    const raw = String(text || ''), n = nd(raw), t = n.split(' ').filter(Boolean), has = re => re.test(' ' + n + ' ');
    const cjk = l === 'zh' || l === 'ja';
    if (cl.kind === 'time') {
      const x = cjk ? readTimeCJK(raw, l) : readTime(t, l);
      if (!x) return out;
      out.said = { h: h12(x.h), m: ((x.m % 60) + 60) % 60 }; out.halb = !!x.halb;
      out.right = out.said.h === h12(cl.h) && out.said.m === cl.m;
      if (!out.right) return finish(out);
      if (cjk) { if (x.two) soft('two', 'For two o’clock it’s 两点 (liǎng diǎn), not 二点'); return finish(out); }
      if (x.digits) slip('digits', `Say the hour in words: «${out.model}»`);
      const H = h12(cl.h);
      if (l === 'es') {
        const one = H === 1, verbOk = one ? has(/\bes\b/) : has(/\bson\b/), artOk = one ? has(/\bla una\b/) : has(new RegExp(`\\blas ${x.digits ? '\\d+' : t[x.at]}\\b`));
        if (has(/\b(esta|estan|hay|tiene)\b/)) slip('ser', 'The time takes ser: «son las…», «es la una»', true);
        else if (one && has(/\bson\b/)) slip('number', 'One o’clock is one hour: «es la una» (not «son»)');
        else if (!one && !x.noon && has(/\bes\b/) && !has(/\bson\b/)) slip('number', `More than one hour: «son las ${NUMW.es[H]}» (not «es»)`);     // («es mediodía» is right)
        else if (!verbOk && !x.noon) slip('verb', `A whole sentence: «${out.model}»`);
        if (!x.noon && !x.digits) {
          if (one && has(/\blas una\b/)) slip('article', '«la una»: one hour, so «la», not «las»');
          else if (!one && has(new RegExp(`\\bla ${t[x.at]}\\b`))) slip('article', `«las ${NUMW.es[H]}»: the hours take «las»`);
          else if (has(/\blos\b/) && !artOk) slip('article', `The hours are feminine: «las ${NUMW.es[H]}», «la una»`);
          else if (!artOk) slip('article', `The hour needs its article: «${one ? 'la una' : 'las ' + NUMW.es[H]}»`);
        }
        if (cl.m === 30 && has(/\by treinta\b/)) soft('style', '«y media» is how people usually say :30');
      } else if (l === 'pt') {
        const one = H === 1 || x.noon, sao = has(/\bsao\b/), eh = /(^|[\s¡¿])é(\s|$)/i.test(raw) || (t[0] === 'e' && NUMS.pt[t[1]] !== undefined) || has(/^e (meio|meia)\b/);    // («é», the verb, not «e», and)
        if (has(/\b(esta|estao|tem)\b/)) slip('ser', 'The time takes ser: «são sete horas», «é uma hora»', true);
        else if (one && sao) slip('number', 'One o’clock is one hour: «é uma hora» (not «são»)');
        else if (!one && eh && !sao) slip('number', `More than one hour: «são ${NUMW.pt[H]}» (not «é»)`);
        else if (!(one ? eh : sao)) slip('verb', `A whole sentence: «${out.model}»`);
        if (one && has(/\bum hora\b|\bum\b/) && !has(/\buma\b/)) slip('gender', '«hora» is feminine: «uma hora»');
        if (H === 2 && has(/\bdois\b/)) slip('gender', '«hora» is feminine: «duas horas»');
        if (has(/\buma horas\b/) || (!one && has(/\bhora\b/) && !has(/\bhoras\b/))) slip('number', `«${one ? 'uma hora' : NUMW.pt[H] + ' horas'}»`);
        if (/\btres\b/.test(raw.toLowerCase()) && H === 3) soft('accent', 'Accent: «três»');
      } else if (l === 'de') {
        if (!has(/\bes ist\b/) && !has(/\bist es\b/)) slip('verb', `A whole sentence: «${out.model}»`);
        if (has(/\beins uhr\b/)) slip('ein', '«ein Uhr» (but «Es ist eins» without Uhr)');
        if (has(/\buhren\b/)) slip('number', '«Uhr» in the time never takes the plural: «sieben Uhr»');
        if (x.regional) soft('style', '«Viertel neun» is regional: most people say «Viertel nach acht»');
        if (/\bfunf\b|\bzwolf\b/.test(n) && !/[äöü]/i.test(raw) && !/ae|oe|ue/.test(n)) soft('accent', 'Umlaut: «fünf», «zwölf»');
      }
      return finish(out);
    }
    if (cl.kind === 'day') {
      const d = readDay(raw, l); if (d < 0) return out;
      out.said = d; out.right = d === today();
      if (!out.right || cjk) return finish(out);
      const w = wordInRaw(raw, (l === 'pt' ? DAYS.pt[d].split('-')[0] : (DAYS[l] || DAYS.es)[d]));
      if (l === 'es') {
        if (!has(/\b(es|hoy es)\b/)) slip('verb', `A whole sentence: «${out.model}»`);
        if (has(/\bes el\b/)) slip('article', 'No article after «es»: «hoy es martes»');
        if (w && !w.first && /^[A-Z]/.test(w.s)) soft('capital', `Days are lowercase in Spanish: «${DAYS.es[d]}»`);
        if ((d === 3 || d === 6) && !/[éá]/.test(raw)) soft('accent', `Accent: «${DAYS.es[d]}»`);
      } else if (l === 'pt') {
        const eh = /(^|[\s¡¿])é(\s|$)/i.test(raw) || has(/\bhoje e\b/) || t[0] === 'e';
        if (!eh) slip('verb', `A whole sentence: «${out.model}»`);
        if (has(/\be (a|o)\b/)) slip('article', `No article: «${out.model}»`);
        if (w && !w.first && /^[A-Z]/.test(w.s)) soft('capital', `Days are lowercase in Portuguese: «${DAYS.pt[d]}»`);
        if ((d === 2 || d === 6) && !/[çá]/.test(raw)) soft('accent', `Accent: «${DAYS.pt[d]}»`);
      } else if (l === 'de') {
        if (!has(/\bist\b/)) slip('verb', `A whole sentence: «${out.model}»`);
        if (has(/\bist (der|ein)\b/)) slip('article', `No article: «${out.model}»`);
        if (w && /^[a-z]/.test(w.s)) soft('capital', `Days are nouns in German: a capital «${DAYS.de[d]}»`);
      }
      return finish(out);
    }
    // the weather
    const w = readWeather(raw, l); if (!w) return out;
    out.said = w; out.right = w === 'snow' || w === 'cold';
    if (!out.right || cjk) return finish(out);
    if (l === 'es') {
      if (w === 'snow') { if (has(/\b(es|son) nevando\b/)) slip('estar', 'Something happening now: «está nevando» (estar)', true); else if (!has(/\b(esta|nieva|cae)\b/)) { if (has(/\bhay nieve\b/)) soft('style', 'For the weather: «está nevando» or «nieva»'); else slip('verb', '«Está nevando» or «Nieva»'); } if (has(/\besta\b/) && /\besta\b/.test(raw.toLowerCase())) soft('accent', 'Accent: «está»'); }
      else { if (has(/\b(esta|es) frio\b/)) slip('hacer', 'The weather is «hace frío» («está frío» is a thing that’s cold to touch)'); else if (has(/\btengo frio\b/)) slip('person', 'That’s you! The weather: «hace frío»'); else if (!has(/\bhace\b/)) slip('verb', '«Hace frío»'); if (/\bfrio\b/.test(raw.toLowerCase())) soft('accent', 'Accent: «frío»'); }
    } else if (l === 'pt') {
      if (w === 'snow') { if (has(/\be nevando\b/)) slip('estar', 'Something happening now: «está nevando»', true); else if (!has(/\b(esta|ta|neva)\b/)) slip('verb', '«Está nevando» or «Neva»'); if (/\besta\b/.test(raw.toLowerCase())) soft('accent', 'Accent: «está»'); }
      else { if (has(/\be frio\b/)) slip('estar', 'The weather: «está frio» or «faz frio»'); else if (has(/\b(estou com|tenho) frio\b/)) slip('person', 'That’s you! The weather: «está frio»'); else if (!has(/\b(esta|faz|ta)\b/)) slip('verb', '«Está frio» or «Faz frio»'); }
    } else if (l === 'de') {
      if (w === 'snow') { if (!has(/\bes schneit\b|\bschneit es\b/)) slip('verb', '«Es schneit»'); }
      else { if (has(/\b(mir|ich bin)\b/)) slip('person', 'That’s you! The weather: «Es ist kalt»'); else if (!has(/\bes ist kalt\b|\bist es kalt\b/)) slip('verb', '«Es ist kalt»'); }
    }
    return finish(out);
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
  // how a value reads in English (for the "that’s not it" thought)
  const saidEn = (o, kind) => (o === null || o === undefined ? '' : kind === 'time' ? `${o.h}:${String(o.m).padStart(2, '0')}` : kind === 'day' ? DAYS.en[o] : o);
  Object.assign(C, { PEAKS_LINES: PL, VLINES: VL, DAYS, today, inesBack, modelOf, enOf, gradeSet: grade, readTime, readTimeCJK, readDay, readWeather, saidEn, h12, registerWords, T, NUMW, dayDemo, FRAME });
})();

// ================================================================ the build: the pass, the village, its people and clocks, the tower, the snow
(() => {
  const C = PEAKS, { toon, merge } = TK, INK = '#2b2235';
  const { VILLAGE, VY, LY, BUILDINGS, HUT, NOOK, DRIFT, GATE, TOWER, DOOR, LEDGE, SPOT, PEOPLE, TOBIAS, LIA, CLOCKS } = C;
  // keep world.js's scatter (trees, rocks, flowers) off the village's things (plain data: this runs before world.js)
  BUILDINGS.forEach(b => C.KEEP.push({ x: b.x, z: b.z, r: Math.hypot(b.w, b.d) / 2 + 1.5 }));
  C.KEEP.push({ x: HUT.x, z: HUT.z, r: 4 });
  const STONE = '#8f8a80', TIMBER = '#5a3a24', SNOWC = '#f4f8fb', WIN = '#ffe7a8', DOORC = '#6b4226', ICEC = ['#cfeaf7', '#b6dcef', '#a6d2ea', '#dff2fb'];
  const LOOK = {
    bakery: { wall: '#f3dfb9', roof: '#b8603c', trim: '#e0743c' }, school: { wall: '#cfe0ea', roof: '#5f7590', trim: '#4f7fb0' }, post: { wall: '#f0d6a8', roof: '#3f6a8a', trim: '#2f5f8a' },
    inn: { wall: '#ecd0b8', roof: '#9a5a3c', trim: '#b84a5a' }, hall: { wall: '#ddd5e8', roof: '#6a5a7a', trim: '#5a3f7a' }, workshop: { wall: '#e6d3b3', roof: '#7a4a3a', trim: '#c98a4a' }, house: { wall: '#efe4cf', roof: '#8a6a52', trim: '#5f8a4a' },
  };
  // the words on the buildings (boards that follow the language): a name over the door, the hours on a little board by it
  const SIGNTXT = {
    bakery: { name: { en: 'Bakery', es: 'Panadería', pt: 'Padaria', de: 'Bäckerei', zh: '[面包店|miàn bāo diàn]', ja: 'パン [屋|や]' },
      hours: { en: 'Hot bread · 7:00', es: 'Pan caliente · 7:00', pt: 'Pão quentinho · 7:00', de: 'Frisches Brot · 7:00', zh: '[热|rè] [面包|miàn bāo] · 7:00', ja: '[焼|や]きたて パン · 7:00' } },
    school: { name: { en: 'School', es: 'Escuela', pt: 'Escola', de: 'Schule', zh: '[学校|xué xiào]', ja: '[学校|がっこう]' },
      hours: { en: 'School starts · 8:15', es: 'Las clases empiezan · 8:15', pt: 'As aulas começam · 8:15', de: 'Die Schule beginnt · 8:15', zh: '[上课|shàng kè] · 8:15', ja: '[授業|じゅぎょう] · 8:15' } },
    post: { name: { en: 'Post office', es: 'Correo', pt: 'Correio', de: 'Post', zh: '[邮局|yóu jú]', ja: '[郵便局|ゆうびんきょく]' },
      hours: { en: 'The mail goes down · 1:00', es: 'El correo baja · 1:00', pt: 'O correio desce · 1:00', de: 'Die Post fährt ab · 1:00', zh: '[邮件|yóu jiàn] [下山|xià shān] · 1:00', ja: '[郵便|ゆうびん] [出発|しゅっぱつ] · 1:00' } },
    inn: { name: { en: 'Inn', es: 'Posada', pt: 'Pousada', de: 'Gasthaus', zh: '[客栈|kè zhàn]', ja: '[宿|やど]' },
      hours: { en: 'Hot chocolate · 3:30', es: 'Chocolate caliente · 3:30', pt: 'Chocolate quente · 3:30', de: 'Heiße Schokolade · 3:30', zh: '[热|rè] [巧克力|qiǎo kè lì] · 3:30', ja: 'ホット チョコレート · 3:30' } },
    hall: { name: { en: 'Town hall', es: 'Ayuntamiento', pt: 'Prefeitura', de: 'Rathaus', zh: '[村公所|cūn gōng suǒ]', ja: '[役場|やくば]' },
      hours: { en: 'What day is it today?', es: '¿Qué día es hoy?', pt: 'Que dia é hoje?', de: 'Welcher Tag ist heute?', zh: '[今天|jīn tiān] [星期几|xīng qī jǐ] ？', ja: '[今日|きょう] は [何曜日|なんようび] ？' } },
    workshop: { name: { en: 'Clock workshop', es: 'Taller de relojes', pt: 'Oficina de relógios', de: 'Uhrenwerkstatt', zh: '[钟表|zhōng biǎo] [工坊|gōng fáng]', ja: '[時計|とけい] [工房|こうぼう]' } },
    village: { name: { en: 'Escarcha', es: 'Escarcha', pt: 'Escarcha', de: 'Escarcha', zh: '[霜村|Shuāng cūn]', ja: 'エスカルチャ' } },
  };
  // a building's local frame → world (x right, z front)
  const toWorld = (b, lx, lz) => { const c = Math.cos(b.rot), s = Math.sin(b.rot); return { x: b.x + lx * c + lz * s, z: b.z - lx * s + lz * c }; };
  const roofTop = b => 0.5 + 2.6 * (b.floors || 1);
  const gableRise = b => Math.tan(0.68) * (b.w / 2);

  // ---------------------------------------------------------------- a chalet: a stone footing, painted walls with timber corners, a steep
  // gabled roof under snow, a door, windows with shutters, a chimney and icicles along the eaves (front = local +z)
  function chalet(k, b) {
    const G = CAVES.GEO, P = LOOK[b.kind] || LOOK.house, w = b.w, d = b.d, fl = b.floors || 1, H = 2.6 * fl, a = 0.68, top = roofTop(b), rise = gableRise(b), half = w / 2 + 0.65;
    k.at(b.x, VY, b.z, b.rot);
    k.box(0, 0.25, 0, w + 0.3, 0.5, d + 0.3, STONE, { ink: 0.02 });
    k.box(0, 0.5 + H / 2, 0, w, H, d, P.wall, { ink: 0.025 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(sx * w / 2, 0.5 + H / 2, sz * d / 2, 0.24, H, 0.24, TIMBER, { ink: 0.012 });
    if (fl > 1) k.box(0, 0.5 + 2.6, 0, w + 0.08, 0.2, d + 0.08, TIMBER, { ink: 0.012 });
    for (const s of [-1, 1]) k.add(G.tri, 0, top, s * (d / 2), w / 2, rise, 1, P.wall, { ink: 0 });
    for (const s of [-1, 1]) {
      const L = half / Math.cos(a), cx = s * half / 2, cy = top + rise - Math.tan(a) * half / 2;
      k.box(cx, cy + 0.08, 0, L, 0.2, d + 1.0, P.roof, { rz: -s * a, ink: 0.025 });
      k.box(cx + s * Math.sin(a) * 0.15, cy + 0.08 + Math.cos(a) * 0.15, 0, L * 0.98, 0.14, d + 0.92, SNOWC, { rz: -s * a, ink: 0.012 });
      for (let i = 0; i < 6; i++) { const z = -d / 2 - 0.3 + (i + 0.5) * (d + 0.6) / 6; k.add(G.cone, s * (half - 0.1), top + rise - Math.tan(a) * half - 0.18, z, 0.06, -0.32 - (i % 3) * 0.12, 0.06, '#e6f4fb', { ink: 0.006 }); }
    }
    k.add(G.cyl6, 0, top + rise + 0.12, 0, 0.13, d + 1.1, 0.13, TIMBER, { rx: Math.PI / 2, ink: 0.015 });
    // the door, the windows (and shutters), the side windows
    k.box(0, 0.5 + 1.05, d / 2 + 0.07, 1.15, 2.1, 0.14, DOORC, { ink: 0.02 }).box(0.38, 1.5, d / 2 + 0.16, 0.1, 0.1, 0.06, '#e8c45a', { ink: 0 });
    for (const s of [-1, 1]) {
      const x = s * Math.min(w * 0.3, w / 2 - 0.9);
      k.box(x, 2.0, d / 2 + 0.06, 0.85, 0.8, 0.1, WIN, { ink: 0.02 }).box(x, 2.0, d / 2 + 0.1, 0.06, 0.8, 0.04, TIMBER, { ink: 0 });
      for (const t of [-1, 1]) k.box(x + t * 0.62, 2.0, d / 2 + 0.08, 0.36, 0.9, 0.06, P.trim, { ink: 0.012 });
      k.box(x, 1.55, d / 2 + 0.2, 1.0, 0.1, 0.32, SNOWC, { ink: 0.01 });
      if (fl > 1) k.box(x, 0.5 + 2.6 + 1.25, d / 2 + 0.06, 0.8, 0.75, 0.1, WIN, { ink: 0.02 });
      k.box(s * (w / 2 + 0.06), 2.0, 0, 0.1, 0.75, 0.9, WIN, { ink: 0.02 });
    }
    k.box(-w * 0.26, top + rise * 0.72, -d * 0.18, 0.6, 1.7, 0.6, STONE, { ink: 0.02 }).box(-w * 0.26, top + rise * 0.72 + 0.9, -d * 0.18, 0.72, 0.16, 0.72, SNOWC, { ink: 0.012 });
    // the workshop: a little clock turret on its roof ridge, and a big gear on its gable; the inn: a hanging mug
    if (b.kind === 'workshop') {
      k.box(0, top + rise + 0.9, 0.4, 1.2, 1.5, 1.2, P.wall, { ink: 0.02 }).add(G.cone, 0, top + rise + 2.1, 0.4, 1.0, 1.1, 1.0, P.roof, { ink: 0.02 }).add(G.cone, 0, top + rise + 2.2, 0.4, 0.8, 0.7, 0.8, SNOWC, { ink: 0.01 });
      for (let i = 0; i < 10; i++) { const an = (i / 10) * TAU; k.box(Math.sin(an) * 0.95, top + rise * 0.42 + Math.cos(an) * 0.95, d / 2 + 0.05, 0.28, 0.28, 0.1, '#c98a4a', { rz: -an, ink: 0.01 }); }
      k.add(G.cyl, 0, top + rise * 0.42, d / 2 + 0.05, 0.85, 0.1, 0.85, '#c98a4a', { rx: Math.PI / 2, ink: 0.015 });
      k.box(-w / 2 - 0.6, 0.9, d / 2 - 0.4, 1.4, 0.1, 0.9, '#a57d57', { ink: 0.015 });       // a workbench out front
      for (const s of [-1, 1]) for (const t of [-1, 1]) k.box(-w / 2 - 0.6 + s * 0.6, 0.45, d / 2 - 0.4 + t * 0.35, 0.08, 0.9, 0.08, TIMBER, { ink: 0 });
      for (let i = 0; i < 3; i++) k.add(G.cyl, -w / 2 - 0.9 + i * 0.32, 1.0, d / 2 - 0.4, 0.11, 0.05, 0.11, ['#e6b84a', '#c0c4cc', '#c98a4a'][i], { rx: Math.PI / 2, ink: 0.006 });
    }
    k.free();
  }
  // the stone hut on the pass, with a bench out front (Lía's)
  function hut(k) {
    const G = CAVES.GEO, b = HUT, y0 = C.roadY(C.roadInfo(NOOK.x, NOOK.z).s);
    k.at(b.x, y0, b.z, b.rot);
    k.box(0, 1.1, 0, b.w, 2.2, b.d, '#9a958c', { ink: 0.025 });
    for (let i = 0; i < 7; i++) k.box(((i * 0.37) % 1 - 0.5) * b.w * 0.8, 0.3 + i * 0.3, b.d / 2 + 0.03, 0.6, 0.22, 0.04, '#8a8478', { ink: 0 });
    for (const s of [-1, 1]) k.box(s * b.w / 4, 2.55, 0, b.w / 2 + 0.8, 0.18, b.d + 0.8, '#6e5646', { rz: -s * 0.5, ink: 0.02 }).box(s * b.w / 4, 2.7, 0, b.w / 2 + 0.7, 0.12, b.d + 0.7, SNOWC, { rz: -s * 0.5, ink: 0.01 });
    k.box(0, 0.95, b.d / 2 + 0.06, 0.95, 1.8, 0.1, DOORC, { ink: 0.02 });
    k.box(0, 0.45, b.d / 2 + 0.95, 1.8, 0.12, 0.45, '#a57d57', { ink: 0.015 });
    for (const s of [-1, 1]) k.box(s * 0.75, 0.22, b.d / 2 + 0.95, 0.1, 0.44, 0.4, TIMBER, { ink: 0 });
    k.box(0, 0.55, b.d / 2 + 0.95, 1.85, 0.08, 0.5, SNOWC, { ink: 0 });
    k.free();
  }
  // the snowdrift across the pass (a heap of snow, its own mesh: Mimo blows it away)
  function drift(group) {
    const k = CAVES.Kit(), G = CAVES.GEO, R = rng(71), I = C.roadInfo(DRIFT.x, DRIFT.z), y0 = C.roadY(I.s), nx = -I.uz, nz = I.ux;
    for (let i = -6; i <= 6; i++) for (let j = 0; j < 2; j++) {
      const t = i * 0.85 + (R() - 0.5) * 0.4, s = 1.1 + R() * 0.6 - Math.abs(i) * 0.04;
      k.add(G.sphere, DRIFT.x + nx * t + I.ux * (j - 0.5) * 1.2, y0 + s * 0.45 + j * 0.3, DRIFT.z + nz * t + I.uz * (j - 0.5) * 1.2, s * 1.1, s * 0.8, s, R() < 0.5 ? '#f4f8fb' : '#e6eef5', { ink: 0.02 });
    }
    const g = new THREE.Group(); group.add(g); k.build(g);
    const solids = []; for (let i = -6; i <= 6; i++) solids.push({ x: DRIFT.x + nx * i * 0.95, z: DRIFT.z + nz * i * 0.95, r: 0.9, id: 'peaks-drift' });
    solids.forEach(s => { s.x0 = s.x; s.z0 = s.z; });
    return { g, solids, y0, nx, nz };
  }
  // a clock face (a group facing local +z): rim, face, ticks, and two hands that turn (setTime)
  function clockFace(parent, r = 0.62, o = {}) {
    const g = new THREE.Group(); parent.add(g);
    const k = CAVES.Kit(), G = CAVES.GEO;
    k.add(G.cyl, 0, 0, -0.02, r * 1.14, 0.1, r * 1.14, o.rim || '#5a3a24', { rx: Math.PI / 2, ink: 0.02 }).add(G.cyl, 0, 0, 0.03, r, 0.06, r, o.face || '#f8f2e4', { rx: Math.PI / 2, ink: 0 });
    for (let i = 0; i < 12; i++) { const an = (i / 12) * TAU; k.box(Math.sin(an) * r * 0.82, Math.cos(an) * r * 0.82, 0.07, i % 3 ? 0.035 : 0.07, r * (i % 3 ? 0.13 : 0.2), 0.02, INK, { rz: -an, ink: 0 }); }
    k.build(g, { shadow: false });
    const handMat = new THREE.MeshBasicMaterial({ color: INK }), redMat = new THREE.MeshBasicMaterial({ color: '#c9453a' });
    const hand = (len, wd, mat, z) => { const p = new THREE.Group(); p.position.z = z; g.add(p); const m = new THREE.Mesh(new THREE.BoxGeometry(wd, len, 0.02), mat); m.position.y = len / 2 - 0.04; p.add(m); return p; };
    const hh = hand(r * 0.55, r * 0.11, handMat, 0.1), mm = hand(r * 0.8, r * 0.07, redMat, 0.12);
    const cap = new THREE.Mesh(CAVES.GEO.sphere, handMat); cap.scale.setScalar(r * 0.08); cap.position.z = 0.13; g.add(cap);
    const S = { g, h: 0, m: 0, th: 0, tm: 0, run: false, spin: 0, hh, mm };
    S.setTime =(h, m, instant) => { S.th = ((h % 12) + m / 60) / 12 * TAU; S.tm = (m / 60) * TAU; if (instant) { S.h = S.th; S.m = S.tm; } };
    S.step = (dt, t) => {
      if (S.run) { S.tm += dt * TAU / 60; S.th += dt * TAU / 720; }        // (running: a minute a second, so you can see it go)
      if (S.spin > 0) { S.spin -= dt; S.m += dt * 9; S.h += dt * 0.75; }
      else { S.m = damp(S.m, S.tm + Math.round((S.m - S.tm) / TAU) * TAU, 6, dt); S.h = damp(S.h, S.th + Math.round((S.h - S.th) / TAU) * TAU, 6, dt); }
      hh.rotation.z = -S.h; mm.rotation.z = -S.m;
    };
    return S;
  }
  // the weather house on its post: a little house with two doorways; the sun lady and the snow man slide in and out
  function weatherHouse(group) {
    const k = CAVES.Kit(), G = CAVES.GEO, p = SPOT.weather, g = new THREE.Group(); g.position.set(p.x, VY, p.z); g.rotation.y = 0.25; group.add(g);
    k.add(G.cyl6, 0, 1.0, 0, 0.09, 2.0, 0.09, TIMBER, { ink: 0.015 });
    k.box(0, 2.35, 0, 1.3, 0.75, 0.6, '#e8d9b6', { ink: 0.02 }).box(-0.3, 2.3, 0.31, 0.32, 0.5, 0.04, '#3a3550', { ink: 0 }).box(0.3, 2.3, 0.31, 0.32, 0.5, 0.04, '#3a3550', { ink: 0 });
    for (const s of [-1, 1]) k.box(s * 0.36, 2.92, 0, 0.86, 0.1, 0.8, '#9a5a3c', { rz: -s * 0.62, ink: 0.015 }).box(s * 0.38, 3.0, 0, 0.82, 0.08, 0.76, SNOWC, { rz: -s * 0.62, ink: 0.008 });
    k.add(G.tri, 0, 2.72, 0.31, 0.66, 0.42, 1, '#e8d9b6', { ink: 0 });
    k.build(g);
    const fig = (col, kind) => {
      const f = new THREE.Group(); g.add(f); const kk = CAVES.Kit();
      if (kind === 'sun') { kk.add(G.sphere, 0, 0.22, 0, 0.12, 0.2, 0.1, '#f2c94c', { ink: 0.01 }).add(G.sphere, 0, 0.43, 0, 0.09, 0.09, 0.09, '#f2c94c', { ink: 0.01 }); for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU; kk.box(Math.sin(an) * 0.15, 0.43 + Math.cos(an) * 0.15, 0, 0.04, 0.07, 0.02, '#f2a93a', { rz: -an, ink: 0 }); } }
      else { kk.add(G.sphere, 0, 0.14, 0, 0.13, 0.13, 0.12, '#ffffff', { ink: 0.01 }).add(G.sphere, 0, 0.36, 0, 0.1, 0.1, 0.1, '#ffffff', { ink: 0.01 }).add(G.cone, 0, 0.36, 0.1, 0.02, 0.08, 0.02, '#e0743c', { rx: Math.PI / 2, ink: 0 }).add(G.cyl, 0, 0.48, 0, 0.08, 0.1, 0.08, '#3a3550', { ink: 0.006 }); }
      kk.build(f, { shadow: false });
      return f;
    };
    const sun = fig('#f2c94c', 'sun'), snow = fig('#ffffff', 'snow');
    sun.position.set(-0.3, 2.05, 0.4); snow.position.set(0.3, 2.05, 0.05);
    return { g, sun, snow, k: 0, kT: 0 };
  }
  // the Ice Clock Tower: a rock plinth, a shaft of ice blocks, the big clock, the open belfry with the bell, a snowy roof,
  // icicles; the door at its foot, buried under a drift until Mimo blows it clear
  function iceTower(group) {
    const k = CAVES.Kit(), G = CAVES.GEO, R = rng(5), T = TOWER, g = new THREE.Group(); g.position.set(T.x, LY, T.z); group.add(g);
    k.add(G.cyl, 0, 0.5, 0, T.r + 0.5, 1.4, T.r + 0.5, '#7d7a80', { ink: 0.03 });
    for (let i = 0; i < 12; i++) {
      const y = 1.2 + i * 1.3, r = lerp(T.r - 0.4, T.r - 1.1, i / 12);
      k.add(G.cyl6 || G.cyl, 0, y + 0.62, 0, r, 1.26, r, ICEC[i % 4], { ry: i * 0.3, ink: 0.02 });
      for (let j = 0; j < 7; j++) { const an = (j / 7) * TAU + i * 0.45; k.box(Math.sin(an) * r * 0.96, y + 0.63, Math.cos(an) * r * 0.96, 0.08, 1.2, 0.06, '#9cc7de', { ry: an, ink: 0 }); }
    }
    const topY = 1.2 + 12 * 1.3, rT = T.r - 1.1;
    k.add(G.cyl, 0, topY + 0.15, 0, rT + 0.5, 0.3, rT + 0.5, '#dff2fb', { ink: 0.02 });
    for (let i = 0; i < 4; i++) { const an = (i / 4) * TAU + Math.PI / 4; k.box(Math.sin(an) * (rT - 0.1), topY + 1.8, Math.cos(an) * (rT - 0.1), 0.45, 3.2, 0.45, ICEC[i % 4], { ry: an, ink: 0.02 }); }
    k.add(G.cyl, 0, topY + 3.5, 0, rT + 0.55, 0.3, rT + 0.55, '#dff2fb', { ink: 0.02 });
    k.add(G.cone, 0, topY + 5.2, 0, rT + 0.7, 3.4, rT + 0.7, '#5f7590', { ink: 0.025 }).add(G.cone, 0, topY + 5.6, 0, rT + 0.35, 2.6, rT + 0.35, SNOWC, { ink: 0.012 });
    for (let i = 0; i < 18; i++) { const an = (i / 18) * TAU, rr = rT + 0.55; k.add(G.cone, Math.sin(an) * rr, topY + 3.1, Math.cos(an) * rr, 0.08, -0.5 - R() * 0.6, 0.08, '#e6f4fb', { ink: 0.006 }); }
    // the doorway (south), with an arch of darker ice
    k.box(0, 1.9, T.r - 0.52, 2.0, 2.6, 0.5, '#7fbedd', { ink: 0.02 });
    const iceMat = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad, emissive: new THREE.Color('#123848') });
    k.build(g, { mat: iceMat });
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.3), new THREE.MeshBasicMaterial({ color: '#0d1a24' })); dark.position.set(0, 1.85, T.r - 0.25); g.add(dark);
    // the bell, in the belfry
    const bell = new THREE.Group(); bell.position.set(0, topY + 3.1, 0); g.add(bell);
    const bk = CAVES.Kit();
    bk.add(G.cyl6 || G.cyl, 0, 0.1, 0, 0.06, 0.3, 0.06, TIMBER, { ink: 0.01 });
    const lp = [[0.64, -1.45], [0.62, -1.35], [0.42, -0.9], [0.32, -0.3], [0.18, 0]].map(([x, y]) => new THREE.Vector2(x, y));      // (bottom up: the faces turn outward)
    bk.addM(new THREE.LatheGeometry(lp, 16), TK.M4(0, 0, 0, 1, 1, 1), '#e6b84a', 0.03);
    bk.add(G.sphere, 0, -1.4, 0, 0.13, 0.13, 0.13, '#8a6a2a', { ink: 0.01 });
    bk.build(bell);
    // the big clock on the south face, frozen at five to twelve
    const clkY = 12.4, clkR = lerp(T.r - 0.4, T.r - 1.1, (clkY - 1.2) / 1.3 / 12);
    const clk = clockFace(g, 1.7, { rim: '#5f7590', face: '#f2f8fb' }); clk.g.position.set(0, clkY, clkR + 0.1); clk.setTime(11, 55, true);
    // the drift over the door, until Mimo blows it away
    const dk = CAVES.Kit(); for (let i = 0; i < 9; i++) dk.add(G.sphere, (i - 4) * 0.42 + (R() - 0.5) * 0.2, 0.5 + (4 - Math.abs(i - 4)) * 0.18 + R() * 0.2, T.r + 0.35 + R() * 0.3, 0.75, 0.62 + R() * 0.3, 0.6, i % 2 ? '#f4f8fb' : '#e6eef5', { ink: 0.02 });
    const doorDrift = new THREE.Group(); g.add(doorDrift); dk.build(doorDrift);
    return { g, bell, clk, doorDrift, topY };
  }
  // the peaks past the map's edge (world3d.js leaves its woods out there): big snowy mountains to the north and east
  function backdrop(group) {
    const pcs = [], R = rng(4242);
    const peaks = [[168, -318, 30, 60], [200, -330, 40, 88], [236, -320, 34, 74], [270, -334, 42, 96], [300, -306, 30, 58], [312, -270, 34, 64], [318, -232, 30, 50],
      [186, -360, 44, 104], [228, -366, 50, 118], [276, -372, 46, 100], [150, -340, 26, 52], [300, -350, 36, 80]];
    for (const [x, z, r, h] of peaks) {
      pcs.push({ geo: new THREE.ConeGeometry(r, h, 7), m: TK.M4(x, h / 2 + 3, z, 1, 1, 1, R() * 6), color: R() < 0.5 ? '#8d8f97' : '#9a9ca4' });
      pcs.push({ geo: new THREE.ConeGeometry(r * 0.62, h * 0.5, 7), m: TK.M4(x + (R() - 0.5) * 2, h * 0.75 + 3.4, z, 1, 1, 1, R() * 6), color: '#f2f6fa' });
      pcs.push({ geo: new THREE.ConeGeometry(r * 0.3, h * 0.2, 7), m: TK.M4(x, h * 0.92 + 3.6, z, 1.04, 1, 1.04, R() * 6), color: '#ffffff' });
      pcs.push({ geo: new THREE.ConeGeometry(r * 1.05, h * 0.2, 7), m: TK.M4(x, h * 0.1 + 3, z, 1, 1, 1, R() * 6), color: '#dfe8f1' });
    }
    const m = new THREE.Mesh(merge(pcs, true), toon('#ffffff', { vc: 1, rim: 0 })); m.castShadow = false; m.receiveShadow = false;
    group.add(m);
    // a snowfield past the map's north edge, over world3d.js's green ground there (it stands at y 7.6)
    const field = new THREE.Mesh(new THREE.PlaneGeometry(230, 150), toon('#e9f0f6', { rim: 0 }));
    field.rotation.x = -Math.PI / 2; field.position.set(240, 7.75, -372); field.receiveShadow = false; group.add(field);
    return m;
  }
  // snowy pines dotted on the slopes (outside where you walk), one merged mesh
  function pines(group, terrainAt) {
    const pcs = [], R = rng(613), list = [];
    for (let n = 0; n < 2400 && list.length < 140; n++) {
      const x = lerp(112, 262, R()), z = lerp(-292, -238, R()), d = C.walkDist(x, z);
      if (d < 2.5 || d > 16 || C.snowAt(x, z, 5) < 0.5 || list.some(p => Math.hypot(p.x - x, p.z - z) < 3.2)) continue;
      if (Math.hypot(x - TOWER.x, z - TOWER.z) < TOWER.r + 3) continue;
      list.push({ x, z, s: 0.8 + R() * 0.7 });
    }
    for (const p of list) {
      const y = terrainAt(p.x, p.z) - 0.1, s = p.s, ry = R() * 6;
      pcs.push({ geo: new THREE.CylinderGeometry(0.18 * s, 0.26 * s, 1.2 * s, 6), m: TK.M4(p.x, y + 0.6 * s, p.z, 1, 1, 1, ry), color: '#6e4c33' });
      [[1.5, 1.7, 1.5], [1.2, 2.6, 1.3], [0.85, 3.4, 1.1]].forEach(([r, yy, hh], i) => {
        pcs.push({ geo: new THREE.ConeGeometry(r * s, hh * 1.4 * s, 8), m: TK.M4(p.x, y + yy * s, p.z, 1, 1, 1, ry + i), color: i % 2 ? '#2f5a46' : '#355f4a' });
        pcs.push({ geo: new THREE.ConeGeometry(r * 0.78 * s, hh * 0.55 * s, 8), m: TK.M4(p.x, y + (yy + hh * 0.38) * s, p.z, 1, 1, 1, ry + i), color: '#f2f6fa' });
      });
    }
    if (!pcs.length) return null;
    const m = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.2 })); m.castShadow = true; m.receiveShadow = true; group.add(m);
    return m;
  }

  // ---------------------------------------------------------------- people: a villager in winter clothes (merged body and head), posed
  // pose: arms as [forward, out] for each side (left, right); props in the hands; frozen: gray and frosty, and quite still
  const POSE = {
    idle: { arms: [[0.1, 0.18], [0.1, 0.18]] }, tray: { arms: [[1.15, 0.2], [1.15, 0.2]] }, ring: { arms: [[0.15, 0.2], [2.5, 0.35]] }, letter: { arms: [[0.1, 0.2], [1.35, -0.1]] },
    mug: { arms: [[1.35, -0.35], [0.15, 0.2]] }, welcome: { arms: [[0.55, 0.75], [0.55, 0.75]] }, point: { arms: [[0.15, 0.2], [2.75, 0.1]] }, hands: { arms: [[0.95, -0.45], [0.95, -0.45]] },
    pinwheel: { arms: [[0.15, 0.25], [1.7, 0.05]] }, happy: { arms: [[0.15, 0.25], [2.9, -0.55]] }, blow: { arms: [[0.15, 0.25], [1.25, -0.25]] },
  };
  const ACTION = { rafa: 'tray', clara: 'ring', nando: 'letter', pili: 'mug', ines: 'welcome', teo: 'point', tobias: 'hands', lia: 'pinwheel' };
  // (clamped: a channel over 1 overflows getHexString into the next one, and a frozen white hat came out lime)
  const frost = hex => { const c = new THREE.Color(hex), l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; c.lerp(new THREE.Color(l * 0.82, l * 0.9, l * 1.06), 0.86); c.setRGB(Math.min(1, c.r), Math.min(1, c.g), Math.min(1, c.b)); return '#' + c.getHexString(); };
  const _e = new THREE.Euler();
  function personKits(def, pose, frozen) {
    const G = CAVES.GEO, L = def.look, col = h => (frozen ? frost(h) : h), body = CAVES.Kit(), head = CAVES.Kit(), W = L.wide || 1, P = POSE[pose] || POSE.idle;
    for (const s of [-1, 1]) { body.add(G.cyl, s * 0.12, 0.27, 0, 0.085, 0.5, 0.085, col(L.pants), { ink: 0.02 }); body.add(G.sphere, s * 0.12, 0.07, 0.05, 0.11, 0.09, 0.16, col('#4a3426'), { ink: 0.02 }); }
    body.add(G.cyl, 0, 0.88, 0, 0.3 * W, 0.72, 0.26 * W, col(L.coat), { ink: 0.025 }).add(G.cyl, 0, 0.56, 0, 0.33 * W, 0.16, 0.29 * W, col(L.coat), { ink: 0.02 });
    for (let i = 0; i < 3; i++) body.add(G.sphere, 0, 0.72 + i * 0.17, 0.27 * W, 0.03, 0.03, 0.02, col('#3a2b26'), { ink: 0 });
    if (L.apron) body.box(0, 0.78, 0.275 * W, 0.44, 0.66, 0.03, col(L.chef ? '#ffffff' : '#7a5a3e'), { ink: 0.01 });
    if (L.sash) body.box(0.02, 0.92, 0.27 * W, 0.12, 0.82, 0.02, col('#d9493b'), { rz: 0.62, ink: 0 });
    if (L.scarf) body.add(G.cyl, 0, 1.2, 0, 0.27 * W, 0.13, 0.24 * W, col(L.scarf), { ink: 0.015 }).box(0.1, 1.02, 0.25 * W, 0.11, 0.32, 0.05, col(L.scarf), { rz: 0.15, ink: 0.01 });
    const hands = [];
    [-1, 1].forEach((s, i) => {
      const [fwd, out] = P.arms[i];
      _e.set(-fwd, 0, s * out); const dir = new THREE.Vector3(0, -1, 0).applyEuler(_e);
      const sh = [s * 0.32 * W, 1.12, 0], hand = [sh[0] + dir.x * 0.44, sh[1] + dir.y * 0.44, sh[2] + dir.z * 0.44];
      body.rod(G.cyl, sh, hand, 0.075, col(L.coat));
      body.add(G.sphere, hand[0], hand[1], hand[2], 0.08, 0.08, 0.08, col(L.scarf || '#7a5a3e'), { ink: 0.015 });
      hands.push(hand);
    });
    // what they hold
    const hold = def.hold, R = hands[1], Lh = hands[0];
    if (hold === 'bread') { const cx = (R[0] + Lh[0]) / 2, cy = (R[1] + Lh[1]) / 2 + 0.05, cz = (R[2] + Lh[2]) / 2; body.box(cx, cy, cz, 0.62, 0.05, 0.4, col('#8a5f3e'), { ink: 0.01 }); for (let i = 0; i < 3; i++) body.add(G.sphere, cx - 0.18 + i * 0.18, cy + 0.07, cz, 0.08, 0.06, 0.13, col('#d9a35a'), { ink: 0.008 }); }
    if (hold === 'handbell') body.add(G.cone, R[0], R[1] + 0.12, R[2], 0.09, 0.16, 0.09, col('#e6b84a'), { ink: 0.008 }).add(G.cyl, R[0], R[1] + 0.04, R[2], 0.02, 0.1, 0.02, col(TIMBER), { ink: 0 });
    if (hold === 'letter') body.box(R[0], R[1] + 0.06, R[2] + 0.05, 0.24, 0.16, 0.02, col('#fffaf0'), { rx: -0.4, ink: 0.006 });
    if (hold === 'mug') body.add(G.cyl, Lh[0], Lh[1] + 0.08, Lh[2] + 0.04, 0.07, 0.14, 0.07, col('#c9453a'), { ink: 0.008 }).add(G.cyl, Lh[0], Lh[1] + 0.15, Lh[2] + 0.04, 0.06, 0.01, 0.06, col('#6b4226'), { ink: 0 });
    // the head (its own group: it turns): skin, hair, hats, glasses, a beard, eyes, a mouth
    head.add(G.sphere, 0, 0.22, 0, 0.25, 0.25, 0.24, col(L.skin), { ink: 0.025 });
    head.add(G.half, 0, 0.22, -0.02, 0.26, 0.25, 0.25, col(L.hair), { rx: -0.35, ink: 0.015 });
    if (L.bun) head.add(G.sphere, 0, 0.32, -0.25, 0.11, 0.11, 0.11, col(L.hair), { ink: 0.015 });
    if (L.braid) for (let i = 0; i < 3; i++) for (const s of [-1, 1]) head.add(G.sphere, s * 0.19, 0.06 - i * 0.12, -0.12 - i * 0.02, 0.06, 0.07, 0.06, col(L.hair), { ink: 0.012 });
    if (L.beard) head.add(G.sphere, 0, 0.06, 0.12, 0.17, 0.13, 0.12, col(L.hair), { ink: 0.015 });
    if (L.chef) head.add(G.cyl, 0, 0.5, 0, 0.2, 0.32, 0.2, col('#ffffff'), { ink: 0.015 }).add(G.sphere, 0, 0.68, 0, 0.26, 0.13, 0.26, col('#ffffff'), { ink: 0.015 });
    if (L.beanie) head.add(G.half, 0, 0.3, 0, 0.27, 0.25, 0.27, col(L.beanie), { ink: 0.02 }).add(G.cyl, 0, 0.32, 0, 0.275, 0.07, 0.275, col(L.beanie), { ink: 0.01 }).add(G.sphere, 0, 0.58, 0, 0.08, 0.08, 0.08, col('#ffffff'), { ink: 0.01 });
    if (L.cap) head.add(G.half, 0, 0.36, 0, 0.27, 0.17, 0.27, col(L.cap), { ink: 0.02 }).box(0, 0.37, 0.24, 0.3, 0.03, 0.16, col(L.cap), { ink: 0.01 });
    for (const s of [-1, 1]) head.add(G.sphere, s * 0.09, 0.24, 0.215, 0.032, 0.048, 0.02, INK, { ink: 0 });
    if (L.glasses) { for (const s of [-1, 1]) head.add(G.cyl, s * 0.09, 0.24, 0.23, 0.06, 0.012, 0.06, INK, { rx: Math.PI / 2, ink: 0 }); head.box(0, 0.245, 0.235, 0.05, 0.012, 0.01, INK, { ink: 0 }); }
    if (L.loupe) head.add(G.cyl, 0.06, 0.38, 0.19, 0.05, 0.08, 0.05, col('#3a3550'), { rx: Math.PI / 2 - 0.3, ink: 0.006 });
    head.box(0, 0.11, 0.225, 0.08, 0.016, 0.01, INK, { ink: 0 }).add(G.sphere, 0, 0.17, 0.245, 0.035, 0.03, 0.03, col(L.skin), { ink: 0 });
    return { body, head, P, hands };
  }
  // a person: { id, name, x, z, y, top, frozen, hushed, talking, root, body, head, … }; set(pose, frozen) rebuilds the look
  function makePerson(def, group, o = {}) {
    const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group();
    root.add(body); body.add(head); group.add(root);
    const p = { id: def.id, name: def.name, def, x: o.x, z: o.z, y: o.y || VY, top: def.kid ? 1.75 : 2.15, yaw: o.yaw || 0, baseYaw: o.yaw || 0, frozen: !!o.frozen, hushed: !!o.frozen, talking: false,
      root, body, head, pose: o.pose || 'idle', meshes: [], t: Math.random() * 9, kid: !!def.kid };
    p.set = (pose, frozen) => {
      p.pose = pose; p.frozen = !!frozen; p.hushed = p.frozen;
      for (const m of p.meshes) { m.parent.remove(m); m.geometry.dispose(); }
      const K = personKits(def, pose, frozen);
      p.meshes = K.body.build(body).concat(K.head.build(head));
      head.position.set(0, 1.18, 0);
      p.P = K.P; p.hands = K.hands;
    };
    p.set(p.pose, p.frozen);
    root.scale.setScalar(def.kid ? 0.78 : def.look.old ? 0.95 : 1);
    return p;
  }
  function animatePerson(p, dt, t, you) {
    p.t += dt;
    if (p.frozen) { p.root.position.set(p.x, p.y, p.z); p.root.rotation.y = p.yaw; p.body.rotation.set(0, 0, 0); p.head.rotation.set(0, 0, 0); return; }
    const near = you && Math.hypot(you.x - p.x, you.z - p.z) < 6.5;
    const want = p.look ? Math.atan2(p.look.x - p.x, p.look.z - p.z) : near ? Math.atan2(you.x - p.x, you.z - p.z) : p.baseYaw;
    p.yaw = dampAngle(p.yaw, want, 4, dt);
    const bob = p.talking ? Math.abs(Math.sin(p.t * 13)) * 0.035 : p.pose === 'happy' ? Math.abs(Math.sin(p.t * 6)) * 0.08 : p.hop ? Math.abs(Math.sin(p.t * 8)) * 0.12 : 0;
    p.root.position.set(p.x, p.y + bob, p.z); p.root.rotation.y = p.yaw;
    p.body.rotation.x = Math.sin(p.t * 1.3) * 0.015; p.body.rotation.z = Math.sin(p.t * 1.1 + p.x) * 0.02;
    p.head.rotation.y = p.pose === 'point' ? 0 : Math.sin(p.t * 0.5 + p.z) * 0.08; p.head.rotation.x = p.pose === 'point' ? -0.35 : p.pose === 'blow' ? 0.1 : 0;
  }
  // Lía's pinwheel: a stick and four colored blades that spin (fast when she blows)
  function pinwheel(p) {
    const g = new THREE.Group(), k = CAVES.Kit(), G = CAVES.GEO;
    k.add(G.cyl6 || G.cyl, 0, -0.18, 0, 0.018, 0.42, 0.018, '#8a5f3e', { ink: 0.004 });
    k.build(g, { shadow: false });
    const blades = new THREE.Group(); blades.position.y = 0.04; g.add(blades);
    const bk = CAVES.Kit();
    ['#e0503f', '#ffd84a', '#4c7fd8', '#5fb257'].forEach((c, i) => { const an = i * Math.PI / 2; bk.add(G.tri, Math.cos(an) * 0.08, Math.sin(an) * 0.08, 0.01, 0.09, 0.16, 1, c, { rz: an - Math.PI / 2, ink: 0.004 }); });
    bk.build(blades, { shadow: false });
    p.body.add(g);
    return { g, blades, spin: 2, place() { const h = p.hands ? p.hands[1] : [0.3, 1.0, 0.3]; g.position.set(h[0], h[1] + 0.2, h[2] + 0.04); } };
  }

  // ---------------------------------------------------------------- snow: a flurry around the camera, and flakes hanging still around the frozen
  const flakeTex = TK.canvasTex(32, 32, c => { const g = c.createRadialGradient(16, 16, 0, 16, 16, 15); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); });
  function flurry(group, n = 1300, box = 32, hgt = 22) {
    const pos = new Float32Array(n * 3), seed = new Float32Array(n), R = rng(17);
    for (let i = 0; i < n; i++) { pos[i * 3] = (R() - 0.5) * box * 2; pos[i * 3 + 1] = R() * hgt; pos[i * 3 + 2] = (R() - 0.5) * box * 2; seed[i] = R(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.2, map: flakeTex, transparent: true, depthWrite: false, color: '#ffffff', sizeAttenuation: true }));
    pts.frustumCulled = false; group.add(pts);
    return { pts, pos, seed, n, box, hgt, cx: 0, cz: 0, cy: 0 };
  }
  function frozenFlakes(group, x, y, z, n = 46) {
    const pos = new Float32Array(n * 3), R = rng(Math.round(x * 31 + z * 7));
    for (let i = 0; i < n; i++) { const a = R() * TAU, r = 0.4 + R() * 2.0; pos[i * 3] = x + Math.cos(a) * r; pos[i * 3 + 1] = y + 0.2 + R() * 3.2; pos[i * 3 + 2] = z + Math.sin(a) * r; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.24, map: flakeTex, transparent: true, depthWrite: false, color: '#ffffff', sizeAttenuation: true }));
    group.add(pts);
    return { pts, pos, y0: y, fall: 0, n };
  }

  // ---------------------------------------------------------------- the walls: rows of solids just past where you can walk (the canyon's
  // edges, the village's rim, the ledge), except inside the miners' camp
  function edgeWalls() {
    const out = [];
    for (let x = 100; x <= 262; x += 0.9) for (let z = -295; z <= -236; z += 0.9) {
      const d = C.walkDist(x, z);
      if (d < 0.15 || d > 1.25) continue;
      if (typeof CAVES !== 'undefined' && CAVES.bowlDist && CAVES.bowlDist(x, z) < 2.4) continue;      // (the camp's own ring is there)
      out.push({ x, z, r: 0.62 });
    }
    return out;
  }

  // ================================================================ build
  function build(scene, env = {}) {
    const terrainAt = env.terrainAt || ((x, z) => (typeof WORLD !== 'undefined' ? WORLD.terrainAt(x, z) : 0));
    const group = new THREE.Group(); group.name = 'peaks'; scene.add(group);
    const near = new THREE.Group(); near.name = 'peaks-near'; group.add(near);
    const colliders = [], moving = [];
    // the village and the hut (one merged mesh and its ink)
    const k = CAVES.Kit(), G = CAVES.GEO;
    BUILDINGS.forEach(b => chalet(k, b));
    hut(k);
    // lamps, benches, firewood, a fence round the square's edge, a snowman by the school, barrels by the inn
    const R = rng(99);
    for (const [x, z] of [[198.5, -254.6], [211.6, -254.0], [199.0, -262.0], [212.0, -262.6], [188.5, -257.0], [221.6, -263.0]]) {
      k.add(G.cyl6, x, VY + 1.2, z, 0.08, 2.4, 0.08, TIMBER, { ink: 0.015 }).box(x, VY + 2.5, z, 0.32, 0.4, 0.32, '#3d3a3a', { ink: 0.015 }).box(x, VY + 2.5, z, 0.25, 0.3, 0.34, WIN, { ink: 0 }).box(x, VY + 2.75, z, 0.4, 0.08, 0.4, SNOWC, { ink: 0.008 });
      colliders.push({ x, z, r: 0.2 });
    }
    for (const [x, z, ry] of [[201.2, -252.4, 0.3], [209.8, -252.2, -0.3]]) {
      k.at(x, VY, z, ry); k.box(0, 0.45, 0, 1.6, 0.1, 0.45, '#a57d57', { ink: 0.015 }); for (const s of [-1, 1]) k.box(s * 0.65, 0.22, 0, 0.1, 0.44, 0.4, TIMBER, { ink: 0 }); k.box(0, 0.52, 0, 1.6, 0.06, 0.45, SNOWC, { ink: 0 }); k.free();
      colliders.push({ obox: 1, x, z, hw: 0.85, hd: 0.3, rot: ry });
    }
    { const s = { x: 202.2, z: -248.6 }; k.add(G.sphere, s.x, VY + 0.45, s.z, 0.5, 0.48, 0.5, SNOWC, { ink: 0.02 }).add(G.sphere, s.x, VY + 1.15, s.z, 0.36, 0.34, 0.36, SNOWC, { ink: 0.02 }).add(G.sphere, s.x, VY + 1.65, s.z, 0.26, 0.26, 0.26, SNOWC, { ink: 0.02 });
      k.add(G.cone, s.x, VY + 1.65, s.z + 0.32, 0.05, 0.22, 0.05, '#e0743c', { rx: Math.PI / 2, ink: 0.006 }).add(G.cyl, s.x, VY + 1.93, s.z, 0.2, 0.2, 0.2, '#3a3550', { ink: 0.01 }).add(G.cyl, s.x, VY + 1.84, s.z, 0.3, 0.03, 0.3, '#3a3550', { ink: 0.006 });
      for (const sx of [-1, 1]) k.add(G.sphere, s.x + sx * 0.09, VY + 1.72, s.z + 0.23, 0.03, 0.03, 0.02, INK, { ink: 0 });
      k.add(G.cyl, s.x, VY + 1.42, s.z, 0.33, 0.1, 0.33, '#c9453a', { ink: 0.008 }); colliders.push({ x: s.x, z: s.z, r: 0.55 }); }
    for (let i = 0; i < 5; i++) k.add(G.cyl6, 186.6 + (i % 3) * 0.3, VY + 0.18 + Math.floor(i / 3) * 0.3, -246.8, 0.15, 1.2, 0.15, i % 2 ? '#8a5636' : '#9a6440', { rx: Math.PI / 2, ry: 0.3, ink: 0.012 });
    for (const [x, z] of [[217.0, -252.2], [217.6, -251.2]]) k.add(G.cyl, x, VY + 0.45, z, 0.36, 0.9, 0.36, '#7a5a3e', { ink: 0.02 }).add(G.cyl, x, VY + 0.92, z, 0.37, 0.06, 0.37, SNOWC, { ink: 0 });
    colliders.push({ x: 217.3, z: -251.7, r: 0.9 });
    // the village gate: two posts and a beam over the road in, with a board (the name)
    const gate = { x: 185.0, z: -258.0 };
    for (const s of [-1, 1]) k.add(G.cyl6, gate.x, VY + 1.6, gate.z + s * 2.6, 0.16, 3.2, 0.16, TIMBER, { ink: 0.02 }).add(G.cyl6, gate.x, VY + 3.3, gate.z + s * 2.6, 0.22, 0.2, 0.22, SNOWC, { ink: 0.01 });
    k.box(gate.x, VY + 3.15, gate.z, 0.3, 0.3, 5.6, TIMBER, { ink: 0.02 }).box(gate.x, VY + 3.35, gate.z, 0.36, 0.12, 5.7, SNOWC, { ink: 0.01 });
    colliders.push({ x: gate.x, z: gate.z - 2.6, r: 0.25 }, { x: gate.x, z: gate.z + 2.6, r: 0.25 });
    k.build(near);
    // solids: the buildings, the hut
    BUILDINGS.forEach(b => colliders.push({ obox: 1, x: b.x, z: b.z, hw: b.w / 2 + 0.25, hd: b.d / 2 + 0.25, rot: b.rot }));
    colliders.push({ obox: 1, x: HUT.x, z: HUT.z, hw: HUT.w / 2 + 0.2, hd: HUT.d / 2 + 0.2, rot: HUT.rot }, { obox: 1, x: HUT.x, z: HUT.z + HUT.d / 2 + 0.95, hw: 0.95, hd: 0.3, rot: 0 });
    colliders.push(...edgeWalls());
    // the backdrop, pines
    const peaks = backdrop(group);
    const trees = pines(near, terrainAt);
    // the boards: a name over each door, the hours by it (readable with E)
    const boards = [];
    // (a free-standing board gets a second face turned round, in the same mesh: it reads right from behind, never mirrored)
    const twoFaced = (w, h) => {
      const a = new THREE.PlaneGeometry(w, h), b = new THREE.PlaneGeometry(w, h).rotateY(Math.PI).translate(0, 0, -0.012), g = new THREE.BufferGeometry();
      for (const key of ['position', 'normal', 'uv']) { const A = a.attributes[key].array, Bb = b.attributes[key].array, arr = new Float32Array(A.length + Bb.length); arr.set(A); arr.set(Bb, A.length); g.setAttribute(key, new THREE.BufferAttribute(arr, a.attributes[key].itemSize)); }
      const ia = a.index.array, ib = b.index.array, n = a.attributes.position.count, idx = new Uint16Array(ia.length + ib.length); idx.set(ia); for (let i = 0; i < ib.length; i++) idx[ia.length + i] = ib[i] + n;
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      return g;
    };
    const signBoard = (txt, w, h, look, two) => {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = Math.round(256 * h / w);
      const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
      const mat = new THREE.MeshBasicMaterial({ map: tex, side: two ? THREE.FrontSide : THREE.DoubleSide });
      const mesh = new THREE.Mesh(two ? twoFaced(w, h) : new THREE.PlaneGeometry(w, h), mat);
      const draw = l => { const c = cv.getContext('2d'); const text = (typeof pickLang === 'function' ? pickLang(txt, l, txt.en) : txt[l]) || txt.en; if (typeof SIGNS !== 'undefined') SIGNS.paint(c, cv.width, cv.height, Object.assign({ text }, look)); else { c.fillStyle = '#fffaf0'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = INK; c.font = '800 40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(text).replace(/\[([^|\]]*)\|[^\]]*\]/g, '$1').replace(/ /g, ''), cv.width / 2, cv.height / 2); } tex.needsUpdate = true; };
      if (typeof SIGNS !== 'undefined' && SIGNS.board) SIGNS.board(draw); else draw('es');
      boards.push(mesh);
      return mesh;
    };
    for (const b of BUILDINGS) {
      const T = SIGNTXT[b.kind]; if (!T) continue;
      const P = LOOK[b.kind], f = C.frontOf(b, 0.16), m = signBoard(T.name, Math.min(3.2, b.w * 0.55), 0.6, { edge: P.trim });
      // (under the gable's clock, never over it: its tick marks showed through the name like accents, «Córrèo»)
      const clk = CLOCKS.some(c => c.b === b.id), signY = clk ? Math.min(3.57, roofTop(b) + gableRise(b) * 0.42 - (b.kind === 'workshop' ? 0.8 : 0.62) * 1.14 - 0.36) : 3.57;
      m.position.set(f.x, VY + signY, f.z); m.rotation.y = b.rot; near.add(m);
      if (T.hours) {
        const at = toWorld(b, b.w / 2 - 0.2, b.d / 2 + 1.1), post = CAVES.Kit();
        post.add(G.cyl6, at.x, VY + 0.65, at.z, 0.06, 1.3, 0.06, TIMBER, { ink: 0.01 }); post.build(near);
        const hm = signBoard(T.hours, 1.5, 0.5, { edge: P.trim, face: '#fffaf0' }, true); hm.position.set(at.x, VY + 1.45, at.z); hm.rotation.y = b.rot; near.add(hm);
        colliders.push({ x: at.x, z: at.z, r: 0.12 });
        if (typeof SIGNS !== 'undefined' && SIGNS.add) SIGNS.add({ id: 'peaks-' + b.id, x: at.x, z: at.z, y: VY, r: 1.7, card: l => ({ tag: (pickLang(T.name, 'en')), lines: [{ text: pickLang(T.hours, l, T.hours.en), en: T.hours.en }] }) });
      }
    }
    { const m = signBoard(SIGNTXT.village.name, 3.0, 0.62, { edge: '#5f7590' }, true); m.position.set(gate.x - 0.25, VY + 2.75, gate.z); m.rotation.y = -Math.PI / 2; near.add(m);
      if (typeof SIGNS !== 'undefined' && SIGNS.add) SIGNS.add({ id: 'peaks-gate', x: gate.x - 1.2, z: gate.z, y: VY, r: 2.4, card: l => ({ tag: 'The village sign', lines: [{ text: pickLang(SIGNTXT.village.name, l, 'Escarcha'), en: 'Escarcha (“frost”)' }] }) }); }
    // the clocks: one on each building's gable, the calendar's day board under the town hall's, the weather house
    const clocks = {};
    for (const cl of CLOCKS) {
      if (!cl.b) continue;
      const b = C.bld(cl.b), f = C.frontOf(b, 0.1), S = clockFace(near, b.kind === 'workshop' ? 0.8 : 0.62);
      S.g.position.set(f.x, VY + roofTop(b) + gableRise(b) * 0.42, f.z); S.g.rotation.y = b.rot;
      if (cl.kind === 'time') S.setTime(cl.froze[0], cl.froze[1], true); else S.setTime(9, 41, true);
      clocks[cl.id] = S;
    }
    // the town hall's day board (a canvas: the day in the language; the day it froze on until it's set)
    const dayCv = document.createElement('canvas'); dayCv.width = 256; dayCv.height = 72;
    const dayTex = new THREE.CanvasTexture(dayCv), hall = C.bld('hall'), hf = C.frontOf(hall, 0.12);
    const dayBoard = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.42), new THREE.MeshBasicMaterial({ map: dayTex, side: THREE.DoubleSide }));
    dayBoard.position.set(hf.x, VY + roofTop(hall) + gableRise(hall) * 0.42 - 1.0, hf.z); dayBoard.rotation.y = hall.rot; near.add(dayBoard);
    let dayShown = null;
    const showDay = d => {
      dayShown = d; const l = (typeof UI !== 'undefined' && UI.lang) || 'es', c = dayCv.getContext('2d'), Dt = C.DAYS;
      let text = (Dt[l] || Dt.en)[d]; if (typeof CJK !== 'undefined' && CJK.isCJK && CJK.isCJK(l)) text = CJK.plain(text, { lang: l });
      if (typeof SIGNS !== 'undefined') SIGNS.paint(c, 256, 72, { text, edge: '#5a3f7a', face: '#fffaf0' }); else { c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 256, 72); c.fillStyle = INK; c.font = '800 36px sans-serif'; c.textAlign = 'center'; c.fillText(text, 128, 48); }
      dayTex.needsUpdate = true;
    };
    showDay((C.today() + 6) % 7);
    const wh = weatherHouse(near);
    colliders.push({ x: SPOT.weather.x, z: SPOT.weather.z, r: 0.25 });
    // the tower on its ledge
    const tw = iceTower(group);
    colliders.push({ x: TOWER.x, z: TOWER.z, r: TOWER.r + 0.3 });
    // the drift on the pass, and the door's drift (solid until it's blown away)
    const dr = drift(near);
    moving.push(...dr.solids);
    const doorSolid = { x: DOOR.x, z: DOOR.z + 0.4, r: 1.2, id: 'peaks-door' }; doorSolid.x0 = doorSolid.x; doorSolid.z0 = doorSolid.z; moving.push(doorSolid);
    // the blizzard across the pass (until the fourth bell): rocks, a broken signpost, drifting gray snow; solids across the road
    const blizz = new THREE.Group(); group.add(blizz);
    const GI = C.roadInfo(GATE.x, GATE.z), gnx = -GI.uz, gnz = GI.ux, gy = C.roadY(GI.s);
    const bk = CAVES.Kit(), RB = rng(23);
    for (let i = -5; i <= 5; i++) { const s = 0.5 + RB() * 0.6, x = GATE.x + gnx * i * 1.0, z = GATE.z + gnz * i * 1.0; bk.add(G.sphere, x, gy + s * 0.4, z, s * 1.3, s * 0.8, s, i % 2 ? '#d6dde6' : '#c6ced8', { ink: 0.02 }); }
    bk.build(blizz);
    const mist = [];
    for (let i = 0; i < 22; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: i % 2 ? '#c9ccd8' : '#b3b6c6', transparent: true, opacity: 0.7, depthWrite: false }));
      const tt = (i / 21 - 0.5) * 14; sp.position.set(GATE.x + gnx * tt + GI.ux * (RB() - 0.5) * 4, gy + 0.8 + RB() * 3.4, GATE.z + gnz * tt + GI.uz * (RB() - 0.5) * 4);
      sp.scale.setScalar(4 + RB() * 3.5); blizz.add(sp); mist.push({ sp, ph: RB() * 6, x0: sp.position.x, y0: sp.position.y });
    }
    const gateSolids = [];
    for (let i = -6; i <= 6; i++) gateSolids.push({ x: GATE.x + gnx * i * 1.0, z: GATE.z + gnz * i * 1.0, r: 0.75, id: 'peaks-gate' });
    gateSolids.forEach(s => { s.x0 = s.x; s.z0 = s.z; });
    moving.push(...gateSolids);
    // the people of Escarcha (frozen until their clock is set), Tobías, Lía
    const people = [];
    const spotOf = cl => {
      if (cl.id === 'weather') return { x: SPOT.weather.x - 1.4, z: SPOT.weather.z + 1.0, yaw: 2.6 };
      const b = C.bld(cl.b), f = C.frontOf(b, 1.3), side = toWorld(b, -1.25, b.d / 2 + 1.3);
      return { x: side.x, z: side.z, yaw: b.rot };
    };
    for (const d of PEOPLE) {
      const cl = CLOCKS.find(c => c.id === d.clock), at = spotOf(cl);
      const p = makePerson(d, near, { x: at.x, z: at.z, yaw: at.yaw, pose: ACTION[d.id], frozen: true });
      p.clock = cl.id; p.villager = true; p.flakes = frozenFlakes(near, p.x, VY, p.z);
      people.push(p);
    }
    const tob = makePerson(TOBIAS, near, { x: SPOT.tobias.x, z: SPOT.tobias.z, yaw: SPOT.tobias.yaw, pose: 'hands' }); tob.story = true; people.push(tob);
    const lia = makePerson(LIA, group, { x: SPOT.liaHut.x, z: SPOT.liaHut.z, y: C.roadY(C.roadInfo(SPOT.liaHut.x, SPOT.liaHut.z).s), yaw: SPOT.liaHut.yaw, pose: 'pinwheel' }); lia.story = true; people.push(lia);
    const pw = pinwheel(lia); pw.place();
    // snow falling (and frozen in the air in the village, until its clocks run again)
    const fl = flurry(group);
    // ---------------------------------------------------------------- live state
    const S = { gateOpen: false, gateK: 1, freeze: 1, freezeT: 1, liaHome: false, bell: 0, bellSwing: 0, rung: false, fogK: 0 };
    function setGate(open, instant) {
      S.gateOpen = !!open;
      gateSolids.forEach(s => { s.x = open ? 1e5 : s.x0; s.z = open ? 1e5 : s.z0; });
      if (instant) { S.gateK = open ? 0 : 1; blizz.visible = !open; }
    }
    function setDrift(gone) { dr.g.visible = !gone; dr.solids.forEach(s => { s.x = gone ? 1e5 : s.x0; s.z = gone ? 1e5 : s.z0; }); }
    function setDoor(open) { tw.doorDrift.visible = !open; doorSolid.x = open ? 1e5 : doorSolid.x0; doorSolid.z = open ? 1e5 : doorSolid.z0; }
    // blow the drift away (async: t is the story's tween): the heap shakes, then bursts into snow that flies off down the pass
    async function blowDrift(tween, wait) {
      for (let i = 0; i < 2; i++) { await tween(0.2, u => { dr.g.position.x = Math.sin(u * Math.PI * 4) * 0.08; }); await wait(0.15); }
      await tween(1.0, u => { dr.g.position.set(u * 6, u * 2.5, u * 0.5); dr.g.scale.setScalar(Math.max(0.01, 1 - u)); });
      setDrift(true); dr.g.position.set(0, 0, 0); dr.g.scale.setScalar(1);
    }
    async function blowDoor(tween) { await tween(0.8, u => { tw.doorDrift.position.set(0, u * 1.2, u * 1.5); tw.doorDrift.scale.setScalar(Math.max(0.01, 1 - u)); }); setDoor(true); tw.doorDrift.position.set(0, 0, 0); tw.doorDrift.scale.setScalar(1); }
    // a clock set: its hands spin, then go to the time; frozen people around it come back (person.set), their flakes fall
    function setClock(id, h, m, instant) {
      const S2 = clocks[id]; if (!S2) return;
      if (instant) { S2.setTime(h, m, true); S2.run = true; return; }
      S2.spin = 1.1; S2.setTime(h, m); setTimeout(() => { S2.run = true; }, 1300);
    }
    function wrongClock(id, h, m) { const S2 = clocks[id]; if (S2) { S2.spin = 0.6; S2.setTime(h, m); } }
    function setWeather(snowing, instant) { wh.kT = snowing ? 1 : 0; if (instant) wh.k = wh.kT; }
    function unfreeze(p, instant) {
      if (!p.frozen) return;
      p.set(p.pose === 'pinwheel' ? 'pinwheel' : 'happy', false); p.hushed = false;
      if (p.flakes) { if (instant) p.flakes.pts.visible = false; else p.flakes.fall = 0.001; }
      if (!instant) setTimeout(() => { if (!p.frozen) p.set(ACTION[p.id] === 'welcome' ? 'welcome' : 'idle', false); }, 2600);
      else p.set(ACTION[p.id] === 'welcome' ? 'welcome' : 'idle', false);
    }
    function placeLia(home) {
      S.liaHome = !!home;
      const at = home ? SPOT.liaHome : SPOT.liaHut;
      lia.x = at.x; lia.z = at.z; lia.baseYaw = lia.yaw = at.yaw; lia.y = home ? VY : C.roadY(C.roadInfo(at.x, at.z).s);
      if (lia.root.parent !== (home ? near : group)) (home ? near : group).add(lia.root);
    }
    function update(dt, t, you) {
      const Y = you || { x: 0, z: 0, y: 0 };
      const inRegion = !!you && Y.x > 104 && Y.z < -228;
      near.visible = !!you && Math.hypot(Y.x - VILLAGE.x, Y.z - VILLAGE.z) < 150;
      blizz.visible = !!you && S.gateK > 0.01 && Math.hypot(Y.x - GATE.x, Y.z - GATE.z) < 110;
      tw.g.visible = !!you && Math.hypot(Y.x - TOWER.x, Y.z - TOWER.z) < 260;
      fl.pts.visible = inRegion;
      // the blizzard: swirling while it holds, fading once the fourth bell has rung
      S.gateK = damp(S.gateK, S.gateOpen ? 0 : 1, 1.2, dt);
      if (blizz.visible) mist.forEach((m, i) => { m.sp.material.opacity = 0.7 * S.gateK; m.sp.position.x = m.x0 + Math.sin(t * 0.9 + m.ph) * 1.4; m.sp.position.y = m.y0 + Math.sin(t * 0.5 + m.ph) * 0.5; });
      if (blizz.children[0]) blizz.children[0].visible = S.gateK > 0.05;
      // time in the village: frozen until the clocks run again (the flurry hangs still there)
      S.freeze = damp(S.freeze, S.freezeT, 1.2, dt);
      if (fl.pts.visible) {
        const P = fl.pos, inV = C.villageDist(Y.x, Y.z) < 8, speed = inV ? 1 - S.freeze : 1, B = fl.box;
        for (let i = 0; i < fl.n; i++) {
          let x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
          y -= dt * speed * (0.9 + fl.seed[i] * 0.8); x += dt * speed * Math.sin(t * 0.7 + fl.seed[i] * 9) * 0.35;
          if (x - Y.x > B) x -= 2 * B; else if (x - Y.x < -B) x += 2 * B;
          if (z - Y.z > B) z -= 2 * B; else if (z - Y.z < -B) z += 2 * B;
          const base = Y.y - 3;
          if (y < base) y += fl.hgt; else if (y > base + fl.hgt) y -= fl.hgt;
          P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
        }
        fl.pts.geometry.attributes.position.needsUpdate = true;
      }
      if (!near.visible) return;
      people.forEach(p => {
        animatePerson(p, dt, t, you);
        if (p.flakes && p.flakes.fall > 0 && p.flakes.pts.visible) {
          p.flakes.fall += dt; const Pz = p.flakes.pos;
          for (let i = 0; i < p.flakes.n; i++) Pz[i * 3 + 1] -= dt * (1.2 + (i % 5) * 0.2);
          p.flakes.pts.geometry.attributes.position.needsUpdate = true; p.flakes.pts.material.opacity = Math.max(0, 1 - p.flakes.fall / 2.4);
          if (p.flakes.fall > 2.4) p.flakes.pts.visible = false;
        }
      });
      pw.blades.rotation.z -= dt * pw.spin; pw.spin = damp(pw.spin, 1.5, 0.8, dt);
      Object.values(clocks).forEach(c => c.step(dt, t));
      tw.clk.step(dt, t);
      wh.k = damp(wh.k, wh.kT, 2.5, dt);
      wh.sun.position.z = lerp(0.4, 0.05, wh.k); wh.snow.position.z = lerp(0.05, 0.4, wh.k);
      S.bellSwing = damp(S.bellSwing, 0, 0.6, dt); tw.bell.rotation.x = Math.sin(t * 3.2) * S.bellSwing;
    }
    // a little cold blue in the air up here (after world3d.js sets the fog for the frame)
    const SNOWFOG = new THREE.Color('#dce8f2');
    function fog(Y, fogObj) { if (!fogObj) return; const k = smoothstep(108, 132, Y.x) * smoothstep(-226, -246, Y.z); S.fogK = k; if (k > 0.01) fogObj.color.lerp(SNOWFOG, 0.55 * k); }
    const stats = () => { let tris = 0, calls = 0; group.traverse(o => { if (o.isMesh || o.isSprite || o.isPoints) { calls++; if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } }); return { tris: Math.round(tris), meshes: calls, colliders: colliders.length, people: people.length }; };
    return {
      colliders, platforms: [], moving, group, people, update, stats, fog,
      objects: { near, peaks, trees, blizz, drift: dr, tower: tw, clocks, weather: wh, dayBoard, pinwheel: pw, flurry: fl },
      setGate, setDrift, setDoor, blowDrift, blowDoor, setClock, wrongClock, setWeather, showDay, unfreeze, placeLia,
      makePerson: (d, o) => makePerson(d, group, o), clockFace: (parent, r, o) => clockFace(parent, r, o),
      ringBell() { S.bellSwing = 0.5; }, freezeTo(k) { S.freezeT = k; },
      get dayShown() { return dayShown; }, get state() { return S; },
    };
  }
  Object.assign(C, { build, POSE, ACTION, personKits, frost, SIGNTXT, roofTop, gableRise, toWorld });
})();

// ================================================================ the game side: the pass, Lía, the snowdrift, Tobías, Escarcha's clocks, the door
(() => {
  const C = PEAKS, SPOT = C.SPOT, V = (x, y, z) => new THREE.Vector3(x, y, z);
  let G = null, B = null, synced = '', nudgeCool = 0, curCool = 20;
  const S = () => { const s = G.state; s.peaks = s.peaks || {}; s.peaks.set = s.peaks.set || {}; return s.peaks; };
  const F = () => G.state.flags;
  const name = () => G.state.mimoName || 'Mimo';
  const lang = () => G.state.lang || 'es';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const ex = w => (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  // every verb Mimo might know by now (climb, region 4's, only if it exists)
  const verbs = () => ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing', 'v.climb', 'v.blow'].filter(id => LEX.item(id));
  const person = id => (B ? B.people.find(p => p.id === id) || null : null);
  const lock = on => { G.sim.lock = on ? 1 : 0; };
  const setCount = () => C.CLOCKS.filter(c => S().set[c.id]).length;
  const cjk = l => l === 'zh' || l === 'ja';
  const plainOf = src => (cjk(lang()) && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(src, { lang: lang() }) : src);
  const fmt = (h, m) => `${C.h12(h)}:${String(m).padStart(2, '0')}`;
  // what Tobías's demonstrations show (DESIGN.md 16: highlighted and glossed small in his sentences, no English under them)
  const TIME_MARK = { es: [['Son las diez', 'it’s ten o’clock'], ['Es la una', 'it’s one o’clock']], pt: [['São dez horas', 'it’s ten o’clock'], ['É uma hora', 'it’s one o’clock']],
    de: [['Es ist zehn Uhr', 'it’s ten o’clock'], ['Es ist ein Uhr', 'it’s one o’clock']], zh: [['[十点|shí diǎn] [了|le]', 'it’s ten o’clock'], ['[一点|yī diǎn] [了|le]', 'it’s one o’clock']],
    ja: [['[十時|じゅうじ] です', 'it’s ten o’clock'], ['[一時|いちじ] です', 'it’s one o’clock']] };
  const dayMark = d => { const D = C.DAYS; return { es: [['Hoy es', 'today is'], [D.es[d], D.en[d]], ['está nevando', 'it’s snowing']], pt: [['Hoje é', 'today is'], [D.pt[d], D.en[d]], ['está nevando', 'it’s snowing']],
    de: [['Heute ist', 'today is'], [D.de[d], D.en[d]], ['Es schneit', 'it’s snowing']], zh: [['[今天|jīn tiān] [是|shì]', 'today is'], [D.zh[d], D.en[d]], ['[下雪|xià xuě] [了|le]', 'it’s snowing']],
    ja: [['[今日|きょう] は', 'today is'], [D.ja[d], D.en[d]], ['[雪|ゆき] が [降|ふ]って います', 'it’s snowing']] }; };
  // someone says a line from a T table, through the weave (o.full: all in the language, the English under it)
  function sayT(p, T, o = {}) {
    if (!p || !T) return Promise.resolve();
    const l = lang();
    p.lines = { en: T.en || '', [l]: T[l] || '' };
    return STORY.sayInline(p, !!o.full);
  }
  const sayKey = (p, key, o) => sayT(p, C.PEAKS_LINES[key], o);
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${name()} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  // Mimo blows: it puffs up, then a gust of breath flies off toward `at` (little white puffs, the wind's whoosh)
  async function mimoBlow(at, sec = 1.2) {
    const M = G.sim.mimo, yaw = Math.atan2(at.x - M.x, at.z - M.z), ux = Math.sin(yaw), uz = Math.cos(yaw);
    G.sim.mimoGo(null, at); M.happy = 0; M.glow = 1;
    Sound.play('blow');
    for (let t = 0; t < sec; t += 0.08) {
      const d = 0.6 + (t / sec) * 3.2;
      G.w3d.fx.puff(M.x + ux * d, M.ry + 0.55 + Math.sin(t * 9) * 0.1, M.z + uz * d, 2, 0.16 + t * 0.08, '#f4f8fb', 0.3);
      await wait(0.08);
    }
  }
  // a frozen person's sad thought (they can't talk), and Mimo pokes them
  const FROZEN_EN = {
    rafa: 'The baker is frozen stiff, a tray of bread in his hands. Even the snowflakes around him hang still.',
    clara: 'The teacher is frozen mid-ring, her hand bell silent. The snowflakes around her hang in the air.',
    nando: 'The postman is frozen, holding out a letter for no one.',
    pili: 'The innkeeper is frozen with a mug of cocoa that doesn’t steam.',
    ines: 'The mayor is frozen by the town hall, her arms open in a welcome.',
    teo: 'Old Teo is frozen, pointing up at the sky.',
  };
  // the tell box's title for each clock (the sign gives the time it should show)
  function clockTitle(cl) {
    const yday = C.DAYS.en[(C.today() + 6) % 7];
    return {
      bakery: 'The bakery clock is stuck at 4:50. The sign by the door says: Hot bread · 7:00. Say the time it should show!',
      school: 'The school clock is stuck at 2:10. The sign says: School starts · 8:15. Say the time it should show!',
      post: 'The post office clock is stuck at 11:40. The sign says: The mail goes down · 1:00. Say the time it should show!',
      inn: 'The inn’s clock is stuck at 6:05. The sign says: Hot chocolate · 3:30. Say the time it should show!',
      hall: `The town hall’s calendar clock is stuck on ${yday}. What day is it today, really? Say it!`,
      weather: 'Teo’s weather house shows the sun. Look up: what’s the weather really like? Say it!',
    }[cl.id];
  }

  // ---------------------------------------------------------------- the scenes
  async function arrivePass() {
    const f = F(); f.peaks = true; G.save();
    await UI.chapter('The Frost Pass', 'The Frost Peaks · Chapter 1 · The fifth bell');
    await STORY.you('{w.snow}! It’s getting cold up here… There’s an old clock workshop somewhere up this pass.');
  }
  // Lía on the bench by the hut, blowing on her pinwheel: Mimo learns «sopla» by watching her (13.1)
  async function liaScene() {
    const f = F(), lia = person('lia'); if (!lia) return;
    f.liaSeen = true;
    lock(true);
    const y = lia.y, shot = { pos: V(lia.x - 3.2, y + 2.4, lia.z - 4.2), look: V(lia.x, y + 1.2, lia.z), dur: 0.9 };
    G.cam.override = shot;
    await sayKey(lia, 'l.hello');
    G.cam.override = null; lock(false);
    await watchLia(lia, shot);
    G.save();
  }
  // she blows on her pinwheel, puffing her cheeks: it whirls. (DESIGN.md 16: heard first) she says it as she blows, whole in the
  // language with the English under it; then Mimo asks what she's doing
  async function watchLia(lia, shot) {
    lia.set('blow', false); B.objects.pinwheel.place(); B.objects.pinwheel.spin = 40; Sound.play('blow');
    await wait(0.3);
    if (!LEX.taught('v.blow')) {
      if (STORY.youWord) {
        lock(true); G.cam.override = shot || { pos: V(lia.x - 3.2, lia.y + 2.4, lia.z - 4.2), look: V(lia.x, lia.y + 1.2, lia.z), dur: 0.9 };
        await (STORY.demoLine ? STORY.demoLine(lia, C.PEAKS_LINES['l.demo'], ['v.blow']) : sayKey(lia, 'l.demo'));
        B.objects.pinwheel.spin = 40; Sound.play('blow');
        await STORY.youWord('«', STORY.wordPart('v.blow'), '»… Lía says it, blows, and the pinwheel spins!');
        G.cam.override = null; lock(false);
      }
      const r = await STORY.teachWord('v.blow', { spot: { x: SPOT.hutWatch.x, z: SPOT.hutWatch.z }, look: { x: lia.x, z: lia.z }, title: `${name()} is watching Lía and her pinwheel. What is she doing?` });
      lia.set('pinwheel', false); B.objects.pinwheel.place();
      if (r && r.ok) { await sayKey(lia, 'l.blow'); await mimoBlow({ x: lia.x, z: lia.z }, 0.8); B.objects.pinwheel.spin = 30; }
    } else {
      lia.set('pinwheel', false); B.objects.pinwheel.place();
      await sayKey(lia, 'l.blow');
    }
  }
  async function liaTalk() {
    const f = F(), lia = person('lia'); if (!lia) return;
    if (f.peaksFree) return sayKey(lia, 'l.after');
    if (f.drift) return sayKey(lia, 'l.home');
    if (!f.liaSeen) return liaScene();
    if (!LEX.taught('v.blow')) { await watchLia(lia); G.save(); return; }      // (no word yet: watch her again, and Mimo asks again)
    B.objects.pinwheel.spin = 30; Sound.play('blow');
    return sayKey(lia, LEX.taught('v.blow') ? 'l.blow' : 'l.hello');
  }
  // the snowdrift on the pass: tell Mimo what to do («¡Sopla!»); other verbs do their own funny little thing
  async function driftScene() {
    const f = F(), M = G.sim.mimo, st = S(), I = C.roadInfo(C.DRIFT.x, C.DRIFT.z);
    let verb = st.quickBlow ? 'v.blow' : null, ms = 3000;
    if (!verb) {
      const r = await UI.command({ name: name(), icon: 'snow', title: `A wall of snow blocks the pass, too high to climb over. What should ${name()} do?`, verbs: verbs(), answer: 'v.blow' });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); M.tiltT = 1.4; STORY.think(LEX.taught('v.blow') ? '{mimo} tilts its head. What did Lía do with her pinwheel?' : '{mimo} looks at the snow… then back down the pass, at Lía and her pinwheel.', 5); return; }
      verb = r.verb; ms = r.ms;
    }
    const at = { x: C.DRIFT.x - I.ux * 2.6, z: C.DRIFT.z - I.uz * 2.6 };
    if (verb !== 'v.blow') {
      if (LEX.taught(verb)) LEX.attempt(verb, { ok: true, hints: 0, ms, mode: 'command' });
      G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
      G.sim.mimoGo(at, C.DRIFT); await wait(0.9);
      if (verb === 'v.hit') { Sound.play('hit'); M.sad = 1.2; G.w3d.fx.puff(C.DRIFT.x - I.ux, M.ry + 0.8, C.DRIFT.z - I.uz, 6, 0.2, '#f4f8fb'); STORY.think('{mimo} punches the snow. Poof! A little hole… and more snow slides in.', 4); }
      else if (verb === 'v.push') { Sound.play('land', 6); STORY.think('{mimo} pushes with all its might. The snow just packs down harder.', 4); }
      else if (verb === 'v.jump') { M.hop = { t: 0 }; Sound.play('jump'); STORY.think('{mimo} hops… and sinks into the snow up to its ears. Brrr!', 4); }
      else if (verb === 'v.throw') { Sound.play('whiff'); STORY.think('{mimo} throws a snowball at the snow. It’s just more snow now.', 4); }
      else if (verb === 'v.sing') { Sound.play('sing'); STORY.think('{mimo} sings. Lovely… but the snow doesn’t move.', 4); }
      else if (verb === 'v.climb') { STORY.think('{mimo} tries to climb the drift, and slides back down. Too soft!', 4); }
      else if (verb === 'v.swim') STORY.think('{mimo} tries to swim through the snow. It’s too cold for that!', 4);
      else STORY.think('{mimo} tries, but the snow doesn’t care.', 4);
      G.sim.mimoGo(null, null);
      return;
    }
    learnUse('v.blow', ms); st.quickBlow = true;
    lock(true);
    const y = C.roadY(I.s);
    G.cam.override = { pos: V(C.DRIFT.x - I.ux * 9 + 4, y + 4.2, C.DRIFT.z - I.uz * 9 + 3), look: V(C.DRIFT.x, y + 1.2, C.DRIFT.z), dur: 0.9 };
    G.sim.mimoGo(at, C.DRIFT);
    for (let t = 0; t < 3 && Math.hypot(M.x - at.x, M.z - at.z) > 1.3; t += 0.1) await wait(0.1);
    M.hop = { t: 0 }; await wait(0.4);
    const pb = mimoBlow(C.DRIFT, 1.6);
    await wait(0.5);
    await B.blowDrift(tween, wait);
    Sound.play('poof'); G.w3d.fx.puff(C.DRIFT.x, y + 1.4, C.DRIFT.z, 26, 0.5, '#f4f8fb', 1.4);
    await pb;
    f.drift = true; G.save();
    await wait(0.5);
    G.cam.override = null;
    const lia = person('lia');
    if (lia) {
      lia.look = { x: C.DRIFT.x, z: C.DRIFT.z }; lia.hop = true;
      await sayKey(lia, 'l.drift');
      lia.hop = false; lia.look = null;
      await tween(0.5, k => { lia.root.scale.setScalar(0.78 * (1 - k)); });
      G.w3d.fx.puff(lia.x, lia.y + 0.5, lia.z, 10, 0.25, '#f4f8fb');
      B.placeLia(true); lia.root.scale.setScalar(0.78);
    }
    lock(false); G.sim.mimoGo(null, null);
    STORY.think('The road to the village is open!', 3.5);
  }
  async function arriveVillage() {
    await UI.chapter('Escarcha', 'The Frost Peaks · the village of clocks');
    await STORY.you('It’s so still… {mimo}, look: the {w.snow} is hanging in the air! And nobody moves.');
    G.sim.mimo.scared = 2;
  }
  async function tobiasScene() {
    const t = person('tobias'); if (!t) return;
    lock(true);
    const shotT = { pos: V(t.x + 3.4, t.y + 2.5, t.z + 4.2), look: V(t.x, t.y + 1.3, t.z), dur: 0.9 };
    G.cam.override = shotT;
    await sayKey(t, 't.hello');
    await STORY.you('{w.hello}! We’re ringing the eight bells. Four ring again already. Is the fifth up here?');
    // a frozen clock and its frozen keeper
    const b = C.bld('bakery'), f = C.frontOf(b, 0);
    G.cam.override = { pos: V(f.x + 5.5, C.VY + 3.6, f.z + 2.0), look: V(f.x, C.VY + 2.6, f.z), dur: 1.1 };
    await sayKey(t, 't.frozen');
    G.cam.override = Object.assign({ dur: 0.9 }, shotT);
    await sayKey(t, 't.ask');
    // (DESIGN.md 16: heard before you're asked) the time on his own clock, then the day and the weather, whole in the language
    if (STORY.demoLine) { await STORY.demoLine(t, C.PEAKS_LINES['t.demo'], TIME_MARK); await STORY.demoLine(t, C.dayDemo(C.today()), dayMark(C.today())); }
    else { await sayKey(t, 't.demo'); await sayT(t, C.dayDemo(C.today())); }
    // the tower up on its ledge
    G.cam.override = { pos: V(C.TOWER.x - 16, C.LY + 12, C.TOWER.z + 22), look: V(C.TOWER.x, C.LY + 12, C.TOWER.z), dur: 1.2 };
    await sayKey(t, 't.bell');
    G.cam.override = null; lock(false);
    F().tobias = true; G.save();
    await STORY.you('Six clocks to set… Let’s read the signs, {mimo}.');
  }
  // Report back to Tobías after the tower's bell (DESIGN.md 16): the fifth bell, Noa, and Port Brisa next
  async function reportTower() {
    const t = person('tobias'), f = F(); if (!t) return;
    lock(true);
    const Y = G.sim.you;
    G.cam.override = { pos: V(t.x + (Y.x - t.x) * 0.5 + 3.0, t.y + 2.4, t.z + (Y.z - t.z) * 0.5 + 3.4), look: V((t.x + Y.x) / 2, t.y + 1.2, (t.z + Y.z) / 2), dur: 0.8 };
    await STORY.you('Tobías! The workshop’s {w.bell} is ringing, right at the top of the tower!');
    await sayKey(t, 't.fifth');
    f.tobiasFifth = true; G.save();
    G.cam.override = { pos: V(t.x + 3, t.y + 7, t.z + 6), look: V(t.x - 120, t.y - 10, t.z + 80), dur: 1.4 };     // (far to the south-west: the sea)
    await wait(0.8);
    await sayKey(t, 't.next');
    G.cam.override = null; lock(false);
    await STORY.you('Port Brisa, by the sea. One day soon, {mimo}!');
    G.save();
  }
  async function tobiasAgain() {
    const t = person('tobias'), f = F();
    if (f.peaksFree) { if (!f.tobiasFifth) return reportTower(); return sayKey(t, 't.next'); }
    if (f.clocksSet) return sayKey(t, f.towerOpen ? 't.clock' : 't.allSet');
    return sayKey(t, 't.again');
  }
  // setting a clock: say the time it should show (or the day, or the weather). Graded S–D; the right one starts it again
  async function clockScene(p) {
    const cl = C.CLOCKS.find(c => c.id === p.clock), l = lang(), st = S();
    if (!F().tobias) { G.sim.mimo.scared = 2.5; STORY.think(FROZEN_EN[p.id] + ' Maybe someone in the village knows what happened.', 5); return; }
    const icon = cl.kind === 'time' ? 'clk.' + cl.id : cl.kind === 'day' ? 'calendar' : 'weatherhouse';
    const r = await UI.command({ name: name(), icon, title: clockTitle(cl), verbs: [], placeholder: cl.kind === 'time' ? 'say the time…' : cl.kind === 'day' ? 'say what day it is…' : 'say what the weather is like…',
      hint: `Like Tobías showed you: ${cjk(l) && typeof CJK !== 'undefined' ? CJK.plain((C.FRAME[cl.kind] || C.FRAME.time)[l], { lang: l, cap: false }) : ((C.FRAME[cl.kind] || C.FRAME.time)[l] || C.FRAME.time.es)} (? shows an example)`, model: plainOf(C.modelOf(cl, l)), modelEn: C.enOf(cl) });
    if (!r || r.cancelled) return;
    const g = C.gradeSet(r.text, l, cl);
    if (g.said === null || g.said === undefined) {
      Sound.play('wrong'); G.sim.mimoSay('…?', 1.4); G.sim.mimo.tiltT = 1.4;
      STORY.think(cl.kind === 'time' ? 'The hands don’t move. Say a time, like the sign shows it… (? shows an example)' : cl.kind === 'day' ? 'Nothing happens. Say what day it is today… (? shows an example)' : 'Nothing happens. Look up, and say what the weather is like… (? shows an example)', 5);
      return;
    }
    if (!g.right) {
      Sound.play('wrong'); lock(true);
      if (cl.kind === 'time') { B.wrongClock(cl.id, g.said.h, g.said.m); await wait(1.4); B.wrongClock(cl.id, cl.froze[0], cl.froze[1]); }
      else if (cl.kind === 'day') { B.showDay(g.said); await wait(1.4); B.showDay((C.today() + 6) % 7); }
      else await wait(0.8);
      lock(false);
      const why = cl.kind === 'time' ? (g.halb && lang() === 'de' ? `«halb» means half way TO the next hour: «halb ${C.NUMW.de[C.h12(cl.h + 1)] === 'ein' ? 'eins' : C.NUMW.de[C.h12(cl.h + 1)]}» is ${fmt(cl.h, 30)}.` : `The hands spin to ${fmt(g.said.h, g.said.m)}… and stop. The sign says ${fmt(cl.h, cl.m)}.`)
        : cl.kind === 'day' ? `The calendar flips to ${C.saidEn(g.said, 'day')}… and back. That’s not today.` : `The weather house shivers. Look up: is that ${g.said === 'sun' ? 'sunny' : g.said === 'rain' ? 'rain' : g.said === 'wind' ? 'wind' : 'hot'}?`;
      STORY.think(why, 5);
      return;
    }
    UI.toast(`${g.letter} · ${g.reason}`);
    Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    lock(true);
    const Y = G.sim.you, dx = p.x - Y.x, dz = p.z - Y.z, dl = Math.hypot(dx, dz) || 1, sx = -dz / dl, sz = dx / dl;
    G.cam.override = { pos: V(p.x - dx / dl * 3.4 + sx * 3.4, p.y + 2.6, p.z - dz / dl * 3.4 + sz * 3.4), look: V(p.x, p.y + 1.6, p.z), dur: 0.8 };
    if (cl.kind === 'time') B.setClock(cl.id, cl.h, cl.m);
    else if (cl.kind === 'day') B.showDay(C.today());
    else B.setWeather(true);
    Sound.play('clockset');
    await wait(1.2);
    st.set[cl.id] = g.letter;
    B.unfreeze(p); Sound.play('learned'); G.w3d.fx.sparkle(p.x, p.y + 1.3, p.z, 22, ['#ffd166', '#fff3a0', '#9fd2ea']);
    B.freezeTo(1 - setCount() / C.CLOCKS.length);
    await wait(0.5);
    await sayT(p, cl.kind === 'day' ? C.inesBack(C.today()) : C.VLINES[p.id].back, { full: true });
    G.cam.override = null; lock(false);
    G.save();
    if (setCount() >= C.CLOCKS.length && !F().clocksSet) { F().clocksSet = true; G.save(); await allSet(); }
  }
  async function allSet() {
    const t = person('tobias'); if (!t) return;
    lock(true);
    G.cam.override = { pos: V(C.VILLAGE.x - 4, C.VY + 11, C.VILLAGE.z + 20), look: V(C.VILLAGE.x, C.VY + 1.5, C.VILLAGE.z - 3), dur: 1.0 };
    B.freezeTo(0); Sound.play('fanfare');
    for (let k = 0; k < 3; k++) { Sound.play('tick'); await wait(0.5); }
    G.cam.override = { pos: V(t.x + 3.4, t.y + 2.5, t.z + 4.2), look: V(t.x, t.y + 1.3, t.z), dur: 0.9 };
    await sayKey(t, 't.allSet');
    G.cam.override = null; lock(false);
    await STORY.you('The tower’s door is under the {w.snow}… {mimo}, you know what to do!');
  }
  async function villagerTalk(p) {
    if (S().set[p.clock]) return sayT(p, C.VLINES[p.id].chat);
    return clockScene(p);
  }
  // the Ice Clock Tower's door: blow the snow off it («¡Sopla!»), then go in (icetower.js)
  async function doorScene() {
    const f = F(), M = G.sim.mimo, st = S();
    if (f.towerOpen) {
      if (typeof ICETOWER !== 'undefined' && ICETOWER.enter) return ICETOWER.enter();
      STORY.think('The door is open. Stairs of ice go up into the tower… (coming soon!)', 4); return;
    }
    if (!f.clocksSet) { const t = person('tobias'); STORY.think('Snow is piled high against the tower’s door. Tobías said: first, the clocks.', 4.5); if (t && Math.hypot(G.sim.you.x - t.x, G.sim.you.z - t.z) < 12) await sayKey(t, 't.first'); return; }
    let verb = st.quickBlow ? 'v.blow' : null, ms = 3000;
    if (!verb) {
      const r = await UI.command({ name: name(), icon: 'snow', title: `Snow is piled high against the tower’s door. What should ${name()} do?`, verbs: verbs(), answer: 'v.blow' });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); M.tiltT = 1.4; STORY.think('{mimo} tilts its head. How did it get rid of the snow on the pass?', 4.5); return; }
      verb = r.verb; ms = r.ms;
      if (verb !== 'v.blow') { if (LEX.taught(verb)) LEX.attempt(verb, { ok: true, hints: 0, ms, mode: 'command' }); G.sim.mimoSay(ex(LEX.form(verb)), 1.4); STORY.think(verb === 'v.push' ? '{mimo} pushes the snow. It just packs down harder against the door.' : '{mimo} tries… but the snow stays where it is.', 4); return; }
    }
    learnUse('v.blow', ms); st.quickBlow = true;
    lock(true);
    const D = C.DOOR, at = { x: D.x, z: D.z + 2.2 };
    G.cam.override = { pos: V(D.x + 5, C.LY + 3.2, D.z + 7), look: V(D.x, C.LY + 1.4, D.z), dur: 0.8 };
    G.sim.mimoGo(at, D);
    for (let t = 0; t < 3 && Math.hypot(M.x - at.x, M.z - at.z) > 1.2; t += 0.1) await wait(0.1);
    const pb = mimoBlow(D, 1.3);
    await wait(0.4);
    await B.blowDoor(tween);
    Sound.play('poof'); G.w3d.fx.puff(D.x, C.LY + 1.2, D.z + 0.6, 18, 0.4, '#f4f8fb', 1.2);
    await pb;
    f.towerOpen = true; G.save();
    await wait(0.4);
    G.cam.override = null; lock(false); G.sim.mimoGo(null, null);
    await STORY.you('The door! Stairs of {w.ice} go up inside. The {w.bell} is at the very top.');
  }

  // a night at the Posada: the fade, the hearts (HEARTS.rest), then the word for the bed you slept in
  async function innRest() {
    if (typeof HEARTS === 'undefined' || !HEARTS.rest) return;
    const ok = await HEARTS.rest({ where: 'inn' });
    if (ok) STORY.think('A warm night at the Posada, under a thick blanket in a real {w.bed}… good morning!', 4.5);
  }

  // ---------------------------------------------------------------- what you can press E on (outdoors, in the region)
  function interactables() {
    if (!G || !B) return [];
    const f = F(), list = [], Y = G.sim.you;
    if (Y.x < 104 || Y.z > -232) return list;
    const st = S();
    const lia = person('lia'); if (lia && C.open(G.state)) list.push({ x: lia.x, z: lia.z, y: lia.y, r: 2.4, label: 'Talk', run: liaTalk });
    if (C.open(G.state) && !f.drift) {
      const D = C.SPOT.driftFront;
      list.push({ x: D.x, z: D.z, r: 3.2, label: st.quickBlow ? `«${ex(LEX.form('v.blow'))}»` : `Tell ${name()}`, run: driftScene });
    }
    if (C.villageDist(Y.x, Y.z) < 14) {
      // the Posada's bed (it has no inside): the same rest the other inns give, ♥ back for 2 coins (hearts.js)
      const iF = C.frontOf(C.bld('inn'), 1.6);
      if (typeof HEARTS !== 'undefined' && HEARTS.rest && Math.hypot(Y.x - iF.x, Y.z - iF.z) < 8) list.push({ x: iF.x, z: iF.z, y: C.VY, r: 2.6, label: HEARTS.now() < HEARTS.max() ? 'Rest (2 coins)' : 'Rest', run: innRest });
      const rep = typeof QUESTS !== 'undefined' && QUESTS.reportDue && QUESTS.reportDue('tobias');      // (DESIGN.md 16: after the bell, report back)
      const t = person('tobias'); if (t) list.push({ x: t.x, z: t.z, y: t.y, r: 2.6, label: rep ? 'Report' : 'Talk', run: f.tobias ? tobiasAgain : tobiasScene });
      for (const p of B.people) {
        if (!p.villager) continue;
        const set = !!st.set[p.clock];
        list.push({ x: p.x, z: p.z, y: p.y, r: 2.3, label: set ? 'Talk' : f.tobias ? (p.clock === 'weather' ? 'Say the weather' : p.clock === 'hall' ? 'Set the calendar' : 'Set the clock') : 'Look', run: () => villagerTalk(p) });
      }
    }
    if (Math.hypot(Y.x - C.DOOR.x, Y.z - C.DOOR.z) < 6) {
      const lbl = f.towerOpen ? 'Go in' : f.clocksSet && st.quickBlow ? `«${ex(LEX.form('v.blow'))}»` : f.clocksSet ? `Tell ${name()}` : 'Look';
      list.push({ x: C.SPOT.doorFront.x, z: C.SPOT.doorFront.z, y: C.LY, r: 2.6, label: lbl, run: doorScene });
    }
    return list;
  }
  // where the compass points: the next thing to do here
  function target() {
    const f = F(), Y = G.sim.you;
    if (!f.peaks || C.roadDist(Y.x, Y.z) > 12 && C.villageDist(Y.x, Y.z) > 6 && Math.hypot(Y.x - C.LEDGE.x, Y.z - C.LEDGE.z) > 10) return wayIn();
    if (!f.drift) { if (!f.liaSeen && !LEX.taught('v.blow')) { const l = person('lia'); return l ? { x: l.x, z: l.z } : C.SPOT.liaHut; } return C.SPOT.driftFront; }
    if (!f.tobias) return person('tobias') || C.SPOT.tobias;
    const next = B && B.people.filter(p => p.villager && !S().set[p.clock]);
    if (next && next.length) return next.reduce((b, p) => (!b || Math.hypot(p.x - Y.x, p.z - Y.z) < Math.hypot(b.x - Y.x, b.z - Y.z) ? p : b), null);
    return C.SPOT.doorFront;
  }
  // the way here: up the quarry road to the miners' camp, then out of its east side (between the bunkhouse and the canteen)
  function wayIn() {
    const Y = G.sim.you, R = C.ROAD, start = { x: R[0][0] + 6, z: R[0][1] };
    if (C.roadDist(Y.x, Y.z) > 9) {
      const inCamp = typeof CAVES !== 'undefined' && CAVES.bowlDist && CAVES.bowlDist(Y.x, Y.z) < 4;
      if (inCamp) return start;
      if (typeof CAVES !== 'undefined' && CAVES.wayIn && CAVES.G) { const w = CAVES.wayIn(); if (w && CAVES.roadDist(Y.x, Y.z) < 9) { const last = CAVES.ROAD[CAVES.ROAD.length - 1]; if (Math.hypot(Y.x - last[0], Y.z - last[1]) < 26) return start; } return w || start; }
      return start;
    }
    let k = 0, bd = 1e9; R.forEach(([x, z], i) => { const d = Math.hypot(x - Y.x, z - Y.z); if (d < bd) { bd = d; k = i; } });
    const p = R[Math.min(R.length - 1, k + 8)];
    return k + 8 >= R.length ? C.SPOT.enter : { x: p[0], z: p[1] };
  }

  // ---------------------------------------------------------------- every frame (story hooks): the blizzard, Lía, words to teach
  function tick(dt, Y) {
    if (!G || !B) return;
    const f = F();
    nudgeCool -= dt; curCool -= dt;
    if (!C.open(G.state)) {
      if (nudgeCool <= 0 && Math.hypot(Y.x - C.GATE.x, Y.z - C.GATE.z) < 10) {
        nudgeCool = 25; G.sim.mimo.scared = 2.5;
        STORY.think('A gray blizzard howls across the pass. The Hush is too strong here… Maybe once the fourth bell rings, it will die down.', 6);
      }
      return;
    }
    // Lía catches Mimo's eye (once): she's blowing on her pinwheel
    const lia = person('lia');
    if (!f.liaSeen && !f.drift && lia && Math.hypot(Y.x - lia.x, Y.z - lia.z) < 9) { STORY.run(liaScene); return; }
    // a word Mimo is curious about (seen, not taught yet): the snow, a clock, the ice
    if (curCool <= 0 && Y.speed < 6 && LEX.mayIntroduce && LEX.mayIntroduce()) {
      curCool = 4;
      const b = C.bld('bakery'), bf = C.frontOf(b, 2.5);
      for (const [id, at, need] of [['w.snow', C.SPOT.driftFront, !f.drift], ['w.snow', C.SPOT.plaza, f.drift], ['w.clock', { x: bf.x, z: bf.z }, f.tobias], ['w.ice', C.SPOT.doorFront, f.towerOpen]]) {
        if (!need || !at || !LEX.item(id) || LEX.taught(id) || !LEX.seen(id) || Math.hypot(Y.x - at.x, Y.z - at.z) > 8) continue;
        curCool = 60; STORY.run(() => STORY.teachWord(id, { spot: { x: at.x + (Y.x - at.x) * 0.4, z: at.z + (Y.z - at.z) * 0.4 }, look: at })); return;
      }
    }
  }
  // the look of things follows the save: the blizzard, the drift, Lía, the clocks, the frozen people, the door, the color
  function sync() {
    if (!G || !B) return;
    const f = F(), st = S(), open = C.open(G.state);
    const key = [open, !!f.drift, !!f.towerOpen, !!f.peaksFree, Object.keys(st.set).sort().join(','), G.state.lang].join('|');
    if (key === synced) return;
    const first = !synced;
    synced = key;
    B.setGate(open, first || !B.gateOnce); B.gateOnce = true;
    if (open) liftPatch('peaksGate', first);
    B.setDrift(!!f.drift);
    if (first || f.drift) B.placeLia(!!f.drift);
    B.setDoor(!!f.towerOpen);
    for (const cl of C.CLOCKS) {
      const p = B.people.find(q => q.clock === cl.id), set = !!st.set[cl.id];
      if (set) {
        if (cl.kind === 'time') B.setClock(cl.id, cl.h, cl.m, true);
        if (p && p.frozen) B.unfreeze(p, true);
      } else if (p && !p.frozen) p.set(C.ACTION[p.id], true);
    }
    B.showDay(st.set.hall ? C.today() : (C.today() + 6) % 7);
    B.setWeather(!!st.set.weather, first);
    B.freezeTo(1 - setCount() / C.CLOCKS.length);
    if (f.peaksFree) { liftPatch('peaks', first); if (B.objects.tower.clk) B.objects.tower.clk.run = true; }
  }
  function liftPatch(tag, instant) {
    const i = WORLD.L.hush.findIndex(h => h[tag]);
    if (i >= 0 && WORLD.L.hush[i].a > 0.001) G.w3d.liftHush(i, instant);
  }
  // (the miners' camp's ring of solids leaves a gap where this road goes east: caves.js skips the ring there; the
  // blizzard blocks the pass until the fourth bell)

  // ---------------------------------------------------------------- the module's hooks
  function init(game) {
    G = game; B = game.peaks || null;
    C.registerWords();
    if (B) {     // (the build's per-frame update gets the sync)
      const up0 = B.update;
      B.update = (dt, t, you) => { sync(); up0(dt, t, you); };
    }
    if (STORY.extra) STORY.extra.push({ interactables, tick });
    if (STORY._test && STORY._test.zones) STORY._test.zones.push(
      { id: 'peakspass', scene: true, test: (x, z) => C.open(G.state) && x > 118 && x < 132 && C.roadDist(x, z) < 6, run: () => STORY.run(arrivePass) },
      { id: 'escarcha', scene: true, test: (x, z) => !!G.state.flags.drift && Math.hypot(x - SPOT.enter.x, z - SPOT.enter.z) < 5, run: () => STORY.run(arriveVillage) });
  }
  Object.assign(C, { init, interactables, target, wayIn, tick, sync, sayT, person, setCount, mimoBlow, learnUse, liftPatch,
    _: { arrivePass, liaScene, liaTalk, driftScene, arriveVillage, tobiasScene, tobiasAgain, clockScene, allSet, villagerTalk, doorScene, S, watchLia, reportTower } });
  Object.defineProperty(C, 'G', { get: () => G, configurable: true });
  Object.defineProperty(C, 'built', { get: () => B, configurable: true });
})();
