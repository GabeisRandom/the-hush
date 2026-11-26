'use strict';
// The one continuous map of the slice, south to north: the train station, the Quiet Forest, the
// old road (where Bruno finds you and walks you to town, and Hushlings jump out), and the town of
// Alba with its fields and the hill to the east. The old tower stands far north on the skyline.
// Height and masks live in grids that both the physics and the shaders read, so what you see is
// what you walk on. Away from the places you're meant to go, the woods grow denser until you
// can't get through, and beyond the map they carry on into the fog, so the world never just ends.

const L = {
  minX: -470, maxX: 280, minZ: -445, maxZ: 78,   // the whole map (the woods carry on past it, in world3d.js); north to −300 for the cemetery, then to −445 for the Gray Marsh and the Old Tower (marsh.js); west to −470 for the Mirror Lake
  bx0: -464, bx1: 274, bz0: -439, bz1: 66,       // a last hard stop, well inside the dense woods (and out on the lake)
  water: -0.4,
  path: [[0, 57.6], [3, 50], [6, 42], [3, 34], [-3, 26], [-6, 18], [-3, 10], [3, 3], [5, -5], [1, -14], [-5, -22], [-8, -30],
    // the old road to Alba
    [-9, -40], [-6, -50], [0, -59], [5, -68], [6, -78], [2, -88], [-4, -97], [-9, -106]],
  trails: [
    [[6, 42], [14, 41], [22, 38], [27, 36]],          // to the mushroom ring
    [[-6, 18], [-14, 17], [-22, 15], [-27, 14]],      // to the hushed fox
    [[5, -5], [12, -6], [19, -8], [22, -9]],          // to the lookout
  ],
  // places you can reach without a visible trail (the woods stay open there)
  links: [[[-19.4, 31], [-21, 38], [-23, 45]]],        // across the log bridge to Noa's secret glade
  clearings: [
    { x: 30, z: 36, r: 7.5, kind: 'mushrooms' }, { x: -30, z: 14, r: 8.5, kind: 'fox' },
    { x: -23, z: 45, r: 5.5, kind: 'glade' }, { x: 27, z: -9, r: 8, kind: 'lookout' },
  ],
  lookout: { x: 28, z: -10, r: 7.5, h: 4.4 },
  ponds: [],
  hush: [{ x: -30, z: 14, r: 12, a: 1 }, { x: 15, z: 9, r: 6, a: 0.6 }, { x: -13, z: -9, r: 5.5, a: 0.5 }, { x: 37, z: 22, r: 7, a: 0.55 }, { x: 8, z: 50, r: 7, a: 0.35 },
    { x: 3, z: -62, r: 7, a: 0.35 }, { x: 4, z: -86, r: 7, a: 0.4 },          // gray patches on the road, where Hushlings wait
    { x: 72, z: -186, r: 11, a: 0.8, boss: true },           // the big hushling's hill; lifts when you win
    { x: 240, z: -176, r: 11, a: 0.7, mill: true },          // Molinar's Great Mill, hushed (lifts in M2)
    { x: -327, z: -164, r: 9, a: 0.6, buoy: true }],         // the Mirror Lake's floating bell, hushed (by the island's landing)
  boss: { x: 72, z: -185 },
  tower: { x: 14, z: -405, top: 64 },                       // the old tower, far north on the skyline (where the Hush began; beyond the map's new north edge)
  guide: { x: -8.5, z: -44 },                               // where Bruno finds you, just out of the forest
  // Hushlings that jump out onto the road while Bruno walks you to town
  ambush: [
    { x: 1.5, z: -61, foes: [{ kind: 'hushling', color: 'green', size: 'small' }] },
    { x: 4.5, z: -85, foes: [{ kind: 'moth', color: 'blue', size: 'small' }, { kind: 'hushling', color: 'green', size: 'small' }] },
  ],
  // the field east of Alba: the three groups Bruno sends you after (a quest step)
  fieldGroups: [
    { x: 46, z: -136, foes: [{ kind: 'hushling', color: 'green', size: 'small' }, { kind: 'moth', color: 'red', size: 'small' }] },
    { x: 56, z: -150, foes: [{ kind: 'beetle', color: 'blue', size: 'small' }, { kind: 'hushling', color: 'red', size: 'small' }] },
    { x: 64, z: -164, foes: [{ kind: 'moth', color: 'green', size: 'small' }, { kind: 'beetle', color: 'red', size: 'small' }, { kind: 'hushling', color: 'blue', size: 'big' }] },
  ],
  // Hushlings roaming everywhere else, for practice: they come back a few minutes after you beat them.
  // area 'wild' shows up after Bruno's first lesson, 'field' after his second.
  roamers: [
    { x: 16, z: 40, area: 'wild', foes: [{ kind: 'hushling', color: 'green' }] },
    { x: -18, z: 16, area: 'wild', foes: [{ kind: 'moth', color: 'blue' }] },
    { x: 18, z: -14, area: 'wild', foes: [{ kind: 'beetle', color: 'red' }, { kind: 'hushling', color: 'blue' }] },
    { x: -8, z: 31, area: 'wild', foes: [{ kind: 'moth', color: 'green' }, { kind: 'moth', color: 'red' }] },
    { x: 11, z: -52, area: 'wild', foes: [{ kind: 'moth', color: 'red' }, { kind: 'hushling', color: 'green' }] },
    { x: -9, z: -74, area: 'wild', foes: [{ kind: 'beetle', color: 'green' }] },
    { x: -16, z: -95, area: 'wild', foes: [{ kind: 'hushling', color: 'red' }, { kind: 'moth', color: 'green' }] },
    { x: 60, z: -128, area: 'field', foes: [{ kind: 'beetle', color: 'blue' }, { kind: 'moth', color: 'blue' }] },
    { x: 76, z: -146, area: 'field', foes: [{ kind: 'hushling', color: 'red', size: 'big' }, { kind: 'moth', color: 'green' }] },
    { x: 44, z: -178, area: 'field', foes: [{ kind: 'beetle', color: 'red' }, { kind: 'beetle', color: 'green' }] },
    { x: 60, z: -196, area: 'field', foes: [{ kind: 'moth', color: 'red' }, { kind: 'hushling', color: 'blue' }, { kind: 'beetle', color: 'blue' }] },
    // the Windmill Hills (after the big one on the hill)
    { x: 98, z: -138, area: 'hills', foes: [{ kind: 'hushling', color: 'green' }, { kind: 'moth', color: 'yellow' }] },
    { x: 128, z: -131, area: 'hills', foes: [{ kind: 'armadillo', color: 'yellow' }] },                                  // the region's new kind: push it over
    { x: 112, z: -196, area: 'hills', foes: [{ kind: 'moth', color: 'red' }, { kind: 'beetle', color: 'green' }] },
    { x: 138, z: -170, area: 'hills', foes: [{ kind: 'armadillo', color: 'red' }, { kind: 'moth', color: 'blue' }] },
    { x: 104, z: -116, area: 'hills', foes: [{ kind: 'armadillo', color: 'green' }, { kind: 'hushling', color: 'blue' }] },
    // the Reed Meadows and the river (after the first bell): frogs, the region's new kind, fought on the lake's lily
    // pads. Look-alikes hop between pads, so «la rana de la izquierda» matters.
    { x: -84, z: -143, area: 'lake', biome: 'lake', foes: [{ kind: 'frog', color: 'green' }, { kind: 'frog', color: 'green' }] },
    { x: -100, z: -159, area: 'lake', biome: 'lake', foes: [{ kind: 'frog', color: 'blue' }, { kind: 'moth', color: 'yellow' }] },
    { x: -72, z: -159, area: 'lake', biome: 'lake', foes: [{ kind: 'frog', color: 'yellow' }, { kind: 'hushling', color: 'blue' }] },
    { x: -128, z: -161, area: 'lake', biome: 'lake', foes: [{ kind: 'frog', color: 'red' }, { kind: 'frog', color: 'red' }, { kind: 'frog', color: 'green' }] },
  ],
  // the town of Alba (drawn by town.js) and the places the story uses there
  town: { x: -10, z: -150, r: 44, y: 0.25 },
  plaza: { x: -10, z: -146, r: 12 },
  gate: { x: -9, z: -106 },
  eastGate: { x: 34, z: -150 },
  basket: { x: -17.8, z: -130.2 },
  yard: { x: -26, z: -157 },
  people: { rosa: [-21, -129, 2.6], kid: [-4, -140, -0.8], baker: [3, -154.5, 3.1], brunoYard: [-24, -154, 2.2] },
  farm: { x0: 12, x1: 56, z0: -72, z1: -112 },              // the corn maze's field by the road (cornmaze.js; it was crop fields)
  field: { x0: 34, x1: 84, z0: -126, z1: -200 },            // the open field and the hill, east of town
  // Chapter 1, region 1 (DESIGN.md 14.2): the road east, the Windmill Hills, the pass, and Molinar
  eastRoad: [[34, -150], [60, -147], [88, -151], [112, -152], [134, -149], [150, -150], [166, -150], [173, -150]],
  hills: { x0: 92, x1: 146, z0: -104, z1: -200 },           // open rolling hills with windmills and wheat (props: molinar.js)
  boulder: { x: 150, z: -150, r: 2.1 },                      // blocks the pass until Mimo pushes it («¡empuja!»)
  molinar: { x: 215, z: -150, r: 42, y: 0.25 },              // the market town of mills (drawn by molinar.js)
  molinarGate: { x: 173, z: -150 },
  // Chapter 1, region 2 (DESIGN.md 14.5): the road west, the Reed River, the Mirror Lake and Remanso
  westRoad: [[-53, -150], [-72, -152], [-92, -148], [-110, -150], [-118, -150], [-126, -150], [-138, -150], [-146, -151]],
  river: { x: -118, z0: -300, z1: -80, half: 3.5 },          // runs north–south at riverX(z); the road crosses it on a broken bridge
  crossing: { x: -118, z: -150, east: { x: -113.5, z: -150 }, west: { x: -122.5, z: -150 } },   // the raft docks (lake.js draws them)
  lake: { x: -200, z: -155, rx: 40, rz: 32, bed: -2.2 },     // the east bay, by Remanso (the lake as it first was; lakeE)
  // the Mirror Lake grown big (playtest 4): the east bay plus three more lobes, the open water running on past the map's west edge
  // into the haze (world3d.js draws the far water, its shores and hills). lakeD(x, z) is the union's distance to the shore.
  lakes: [{ x: -292, z: -166, rx: 68, rz: 46 }, { x: -400, z: -174, rx: 130, rz: 58 }, { x: -300, z: -222, rx: 44, rz: 26 }],
  island: { x: -340, z: -172, r: 9 },                       // Lighthouse Island, far out: the ferry ride is a real journey now (isle.js)
  islets: [{ x: -232, z: -144, r: 2.6 }, { x: -256, z: -184, r: 4 }, { x: -264, z: -191, r: 3 }, { x: -286, z: -152, r: 3.6 },     // (passed on the ferry)
    { x: -306, z: -199, r: 5 }, { x: -372, z: -146, r: 4 }, { x: -410, z: -200, r: 6.5 }, { x: -362, z: -208, r: 3 }],
  lakeHills: [{ x: -252, z: -262, r: 26, h: 8 }, { x: -306, z: -274, r: 30, h: 11 }, { x: -366, z: -262, r: 28, h: 9 }, { x: -424, z: -258, r: 30, h: 12 },
    { x: -284, z: -98, r: 24, h: 6 }, { x: -344, z: -96, r: 30, h: 9 }, { x: -414, z: -102, r: 28, h: 10 }],
  // past the map's west edge: the far water's outline (world3d.js), flaring out into the haze
  farLake: [[-470, -226], [-560, -242], [-680, -266], [-790, -286], [-790, -62], [-680, -84], [-560, -106], [-470, -122]],
  remanso: { x0: -158, x1: -136, z0: -134, z1: -170, y: 0.25 },   // the village's flat ground on the east shore (lake.js)
  // the station (its platform reaches the track edge, with the little station house on its west end)
  station: { x0: -22, x1: 11, z0: 59.6, z1: 66.2, top: 0.7 },
  stationHouse: { x: -17, z: 61.6, w: 7, d: 3.6 },
  rails: 68,
  // the line: from the buffer stop at the end of the platform ("the last stop") east past the station,
  // then off into the deep forest, curving into a cutting and a tunnel you can't follow it through.
  // L.track[portal] is the tunnel mouth; the points past it carry the train on, out of sight.
  track: [[-23, 68], [-6, 68], [12, 68], [26, 68], [38, 68.7], [48, 70.3], [57, 72.4], [64, 74.2], [71, 76.0], [80, 78.3], [96, 82.4]],
  portal: 7,
};
if (typeof CEMETERY !== 'undefined' && CEMETERY.hush) L.hush.push(...CEMETERY.hush.map(h => Object.assign({}, h)));     // (north of Alba: the cemetery, the mist past the north gate)
// Region 3, the Quarry Caves (caves.js): the quarry road north from the field, the miners' camp, its gray patches and echo bats
if (typeof CAVES !== 'undefined') {
  L.hush.push(...CAVES.hush.map(h => Object.assign({}, h)));          // (the camp, and the mist across the road until the lake's bell)
  L.roamers.push(...CAVES.roamers);
  L.quarryRoad = CAVES.layout.road; L.camp = CAVES.landmarks.camp; L.mineMouth = CAVES.landmarks.mouth; L.quarryGate = CAVES.landmarks.gate;
}
// Region 4, the Bloom Gardens (gardens.js): the valley south of Molinar, its gray patches and picky bees
if (typeof GARDENS !== 'undefined') {
  L.hush.push(...GARDENS.hush.map(h => Object.assign({}, h)));        // (the valley, and the mist on the ridge road until the gong)
  L.roamers.push(...GARDENS.roamers);
  L.gardens = GARDENS.landmarks.valley; L.gardenGate = GARDENS.landmarks.gate;
}
// Region 5, the Frost Peaks (peaks.js): the pass east out of the miners' camp, Escarcha, the Ice Clock Tower, its gray patches and snowballs
if (typeof PEAKS !== 'undefined') {
  L.hush.push(...PEAKS.hush.map(h => Object.assign({}, h)));          // (the village, and the blizzard across the pass until the fourth bell)
  L.roamers.push(...PEAKS.roamers);
  L.peaks = PEAKS.landmarks.village; L.peaksGate = PEAKS.landmarks.gate;
}
// Region 8, the Gray Marsh (marsh.js): the basin at the Old Tower's feet past the old north road, its gray patches and shadows.
// (Like Port Brisa's below: its ground, grass, paths and play area only join in after the scatter has run (MARSH_ON), and the
// scatter samples the old map (SZ0), so nothing it placed moves; then the rows north of z −262 are worked out again.)
let MARSH_ON = false;
if (typeof MARSH !== 'undefined') {
  L.hush.push(...MARSH.hush.map(h => Object.assign({}, h)));          // (the road in, Candil, the causeway, the tower's path)
  L.roamers.push(...MARSH.roamers);
  L.marsh = MARSH.landmarks.candil; L.marshGate = MARSH.landmarks.gate;
}
// Region 6, Port Brisa (port.js): the road south from Remanso, the walled city on the bay, the sea, its gray patches and crabs.
// (Its ground, grass, paths and play area only join in after the scatter below has run (PORT_ON), so nothing that scatter placed
// moves; then its corner of the grid is worked out again, and its own woods grow from their own seed.)
let PORT_ON = false;
if (typeof PORT !== 'undefined') {
  L.hush.push(...PORT.hush.map(h => Object.assign({}, h)));           // (the city, and the fog across the road until the fifth bell)
  L.roamers.push(...PORT.roamers);
  L.port = PORT.landmarks.city; L.portGate = PORT.landmarks.gate;
}
// Region 7, the Sunken Ruins (ruins.js): a red-rock canyon in the south-east woods, reached only by ship; its gray patch and sand
// worms. (Like Port Brisa's: its ground, grass and play area only join in after the scatter has run (RUINS_ON), so nothing moves.)
let RUINS_ON = false;
if (typeof RUINS !== 'undefined') {
  L.hush.push(...RUINS.hush.map(h => Object.assign({}, h)));          // (the camp and the old town, until the temple's bell)
  L.roamers.push(...RUINS.roamers);
  L.ruins = RUINS.landmarks.camp;
}
const streamZ = x =>30 + 3 * Math.sin(x * 0.08) + 1.5 * Math.sin(x * 0.21 + 1);
const creekZ = x => -66 + 2.2 * Math.sin(x * 0.07) + 1.1 * Math.sin(x * 0.19 + 2);   // the creek the road crosses
const riverX = z => -118 + 3 * Math.sin((z + 150) * 0.05);                              // the Reed River, west of Alba (centered at x −118 where the road crosses)
const lakeE = (x, z) => Math.hypot((x - L.lake.x) / L.lake.rx, (z - L.lake.z) / L.lake.rz);   // < 1 inside the east bay (the lake as it first was)
// The whole Mirror Lake: { d, R }, d the distance to the shore along the ray from a lobe's middle (negative on the water), R that
// lobe's radius (its shore slopes from −0.22·R to 0.04·R, as the first lake's did). East of x −217 it's the east bay alone, exactly as
// before (so nothing scattered round Remanso moves); further west the other lobes join in, their corners rounded off.
function lakeShape(x, z) {
  const A = L.lake, ex = (x - A.x) / A.rx, ez = (z - A.z) / A.rz, e = Math.hypot(ex, ez);
  let R = e > 1e-6 ? Math.hypot(x - A.x, z - A.z) / e : Math.min(A.rx, A.rz), d = R * (e - 1);
  if (x < -217) {
    const k = 10 * smoothstep(-217, -232, x);
    for (const o of L.lakes) {
      const q = Math.hypot((x - o.x) / o.rx, (z - o.z) / o.rz), b = q > 1e-6 ? Math.hypot(x - o.x, z - o.z) * (1 - 1 / q) : -Math.min(o.rx, o.rz);
      if (b < d) R = 38;
      const h = k > 0 ? Math.max(k - Math.abs(d - b), 0) / k : 0;
      d = Math.min(d, b) - h * h * k * 0.25;
    }
  }
  return { d, R };
}
const lakeD = (x, z) => lakeShape(x, z).d;     // < 0 on the Mirror Lake
// Platforms you can stand on: the station, its steps, the fallen log over the stream, and the
// little bridge where the road crosses the creek (worked out from the path below).
const PLATFORMS = [
  // (solid: a block down to the ground, so you can't walk into its side; climb the steps, the ramp, or jump)
  { box: [L.station.x0, L.station.x1, L.station.z0, L.station.z1], top: L.station.top, solid: true },
  { box: [-2.4, 2.4, 58.4, 59.6], top: 0.47 }, { box: [-2.4, 2.4, 57.3, 58.4], top: 0.24 },
  { seg: [14.4, 62.9, 11, 62.9], w: 6.6, y: [0.02, 0.7] },        // the ramp down off the platform's east end
  { seg: [-18.6, 22.8, -19.4, 31.0], w: 1.1, y: [0.42, 0.5] },
];

const WORLD = (() => {
  const R = rng(20261103);
  // (SZ0: the map's north edge before the Gray Marsh grew it to L.minZ. The hills and the scatter below still go by it, so
  // everything south of it stays exactly where it was; marsh.js shapes and plants what's north of it)
  const SZ0 = -300;
  const segDist = (px, pz, ax, az, bx, bz) => {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
    const t = l2 ? clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
  };
  // Smooth the path through its points (Catmull-Rom), so it winds instead of zig-zagging.
  function spline(pts, per = 6) {
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
  const PATH = spline(L.path), TRAILS = L.trails.map(t => spline(t)), LINKS = L.links.map(t => spline(t)), EAST = spline(L.eastRoad), WEST = spline(L.westRoad);
  // How far a point is from a line of points. (It runs millions of times while the ground's grid and the woods are worked
  // out, so a long line gets a small tree of boxes the first time it's asked about, and boxes farther than the nearest
  // segment found so far are skipped. The answer is exactly what checking every segment gives. P6d, the boot time)
  const LD = new WeakMap(), LDS = [];
  function ldTree(pts) {
    const node = (i0, i1) => {     // segments i0 … i1 − 1 (points i0 … i1)
      let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
      for (let i = i0; i <= i1; i++) { const p = pts[i]; if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < z0) z0 = p[1]; if (p[1] > z1) z1 = p[1]; }
      const N = { x0, z0, x1, z1, i0, i1, a: null, b: null };
      if (i1 - i0 > 6) { const m = (i0 + i1) >> 1; N.a = node(i0, m); N.b = node(m, i1); }
      return N;
    };
    return node(0, pts.length - 1);
  }
  const boxD2 = (N, x, z) => { const dx = Math.max(N.x0 - x, 0, x - N.x1), dz = Math.max(N.z0 - z, 0, z - N.z1); return dx * dx + dz * dz; };
  function lineDist(pts, x, z) {
    const n = pts.length - 1;
    let d = 1e9;
    if (n < 16) { for (let i = 0; i < n; i++) d = Math.min(d, segDist(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; }
    let T = LD.get(pts); if (!T) LD.set(pts, T = ldTree(pts));
    let sp = 0; LDS[sp++] = T;
    while (sp) {
      const N = LDS[--sp], lim = d + 1e-6;
      if (boxD2(N, x, z) > lim * lim) continue;
      if (!N.a) { for (let i = N.i0; i < N.i1; i++) d = Math.min(d, segDist(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); continue; }
      if (boxD2(N.a, x, z) <= boxD2(N.b, x, z)) { LDS[sp++] = N.b; LDS[sp++] = N.a; } else { LDS[sp++] = N.a; LDS[sp++] = N.b; }     // (the nearer half first)
    }
    return d;
  }
  // The railway: arc length along the line (s = 0 at the buffer stop), where the train stops, and where
  // the tunnel mouth is. The bed and its cutting are flattened up to the portal (rawHeight).
  const TRACK = (() => {
    const PER = 8, pts = spline(L.track, PER), len = [0];
    for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = len[len.length - 1], iPortal = L.portal * PER, sPortal = len[iPortal];
    function at(s) {      // position and heading at arc length s (straight on past either end)
      let i = 1; while (i < pts.length - 1 && len[i] < s) i++;
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i], l = (len[i] - len[i - 1]) || 1, ux = (bx - ax) / l, uz = (bz - az) / l, t = s - len[i - 1];
      return { x: ax + ux * t, z: az + uz * t, ux, uz };
    }
    const near = pts.slice(0, iPortal + 1);
    const P = at(sPortal);
    // how far past the tunnel mouth (into the hill) a point is
    const past = (x, z) => (x - P.x) * P.ux + (z - P.z) * P.uz;
    const dist = (x, z) => (z < 60 || x < -30 || x > 72) ? 1e9 : lineDist(near, x, z);
    // (the loco's middle sits at x 2.5 when the train is in, as it always has)
    return { pts, len, total, at, sPortal, sStop: 2.5 - L.track[0][0], portal: P, past, dist };
  })();
  // the roads: the old road from the station to Alba, and (Chapter 1) the road east to Molinar
  const QUARRY = typeof CAVES !== 'undefined' ? CAVES.roadDist : null;     // (the quarry road, caves.js)
  const GROAD = typeof GARDENS !== 'undefined' ? GARDENS.roadDist : null;  // (the garden road south of Molinar, gardens.js)
  const pathDist = (x, z) => x > 30 && z < -100 ? Math.min(lineDist(PATH, x, z), lineDist(EAST, x, z), QUARRY && z < -140 ? QUARRY(x, z) : 1e9, GROAD && x > 190 ? GROAD(x, z) : 1e9)
    : GROAD && x > 190 && z < -76 && z > -121 ? Math.min(lineDist(PATH, x, z), GROAD(x, z))
    : x < -45 && z < -100 ? Math.min(lineDist(PATH, x, z), lineDist(WEST, x, z)) : lineDist(PATH, x, z);
  // (several lines at once, the forest trails or the links: one tree over all their segments, built on first use; the same
  // answer as asking each line, P6d)
  function soupOf(lines) {
    const A = [];
    for (const pts of lines) for (let i = 0; i < pts.length - 1; i++) A.push([pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]]);
    const node = list => {
      let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
      for (const s of list) { x0 = Math.min(x0, s[0], s[2]); x1 = Math.max(x1, s[0], s[2]); z0 = Math.min(z0, s[1], s[3]); z1 = Math.max(z1, s[1], s[3]); }
      const N = { x0, z0, x1, z1, segs: null, a: null, b: null };
      if (list.length <= 6) { N.segs = list; return N; }
      const k = x1 - x0 > z1 - z0 ? 0 : 1;
      list.sort((p, q) => (p[k] + p[k + 2]) - (q[k] + q[k + 2]));
      const m = list.length >> 1; N.a = node(list.slice(0, m)); N.b = node(list.slice(m));
      return N;
    };
    return A.length ? node(A) : null;
  }
  function soupDist(T, x, z) {
    let d = 1e9; if (!T) return d;
    let sp = 0; LDS[sp++] = T;
    while (sp) {
      const N = LDS[--sp], lim = d + 1e-6;
      if (boxD2(N, x, z) > lim * lim) continue;
      if (N.segs) { for (const s of N.segs) d = Math.min(d, segDist(x, z, s[0], s[1], s[2], s[3])); continue; }
      if (boxD2(N.a, x, z) <= boxD2(N.b, x, z)) { LDS[sp++] = N.b; LDS[sp++] = N.a; } else { LDS[sp++] = N.a; LDS[sp++] = N.b; }
    }
    return d;
  }
  let TRAIL_T, LINK_T;
  const trailDist = (x, z) => (TRAILS.length ? soupDist(TRAIL_T || (TRAIL_T = soupOf(TRAILS)), x, z) : Infinity);
  const linkDist = (x, z) => (LINKS.length ? soupDist(LINK_T || (LINK_T = soupOf(LINKS)), x, z) : Infinity);

  // the bridge over the creek: where the road meets the creek, along the road
  {
    let best = null;
    for (let i = 1; i < PATH.length - 1; i++) { const [x, z] = PATH[i], d = Math.abs(z - creekZ(x)); if (z < -40 && (!best || d < best.d)) best = { i, d }; }
    const [x, z] = PATH[best.i], [ax, az] = PATH[best.i - 1], [bx, bz] = PATH[best.i + 1], l = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / l, uz = (bz - az) / l;
    L.bridge = { x, z: creekZ(x), ux, uz, len: 8, w: 3 };
    PLATFORMS.push({ seg: [x - ux * 4, creekZ(x) - uz * 4, x + ux * 4, creekZ(x) + uz * 4], w: 3, y: [0.32, 0.32], bridge: true });
  }

  // ------------------------------------------------------------ regions
  // 1 deep in the forest, 0 in the meadows around the station, the road and the town.
  const forestAt = (x, z) => smoothstep(-40, -28, z) * (1 - smoothstep(52, 57, z));
  // (a blob farther than its radius adds nothing: skipped without the square root, P6d)
  function hushAt(x, z) { let a = 0; for (const h of L.hush) { if (Math.abs(x - h.x) > h.r + 1e-6 || Math.abs(z - h.z) > h.r + 1e-6) continue; a = Math.max(a, h.a * (1 - smoothstep(h.r * 0.45, h.r, Math.hypot(x - h.x, z - h.z)))); } return a; }
  function clearingAt(x, z) { let a = 0; for (const c of L.clearings) { if (Math.abs(x - c.x) > c.r + 1e-6 || Math.abs(z - c.z) > c.r + 1e-6) continue; a = Math.max(a, 1 - smoothstep(c.r * 0.7, c.r, Math.hypot(x - c.x, z - c.z))); } return a; }
  // how far outside a town you are (Alba, or Molinar): negative inside
  const townDist = (x, z) => Math.min(Math.hypot(x - L.town.x, z - L.town.z) - L.town.r, Math.hypot(x - L.molinar.x, z - L.molinar.z) - L.molinar.r);
  const inBox = (b, x, z, pad = 0) => x > b.x0 - pad && x < b.x1 + pad && z < b.z0 + pad && z > b.z1 - pad;
  // How far (roughly) you are from anywhere you're meant to be. Negative inside. The woods get
  // denser as this grows, until they're a wall (DESIGN.md 12.11).
  function playDist(x, z) {
    let d = lineDist(PATH, x, z) - (z < -34 ? 16 : 8);                              // the road is wide open, the forest path less so
    if (x > 30 && z < -100) d = Math.min(d, lineDist(EAST, x, z) - (Math.abs(x - L.boulder.x) < 7 ? 5 : 16));   // the road east (narrow at the pass)
    if (x < -45 && z < -100) {      // the road west, Remanso, and the near shore of the Mirror Lake
      d = Math.min(d, lineDist(WEST, x, z) - 14);
      const rv = L.remanso; if (inBox(rv, x, z, 4)) d = Math.min(d, -1);
      if (x > -216) d = Math.min(d, (lakeE(x, z) - 1) * 32 - 7);
    }
    d = Math.min(d, trailDist(x, z) - 4.5, linkDist(x, z) - 3.5);
    for (const c of L.clearings) d = Math.min(d, Math.hypot(x - c.x, z - c.z) - c.r - 4);
    d = Math.min(d, townDist(x, z) - 6);
    if (z > 48 && z < 67 && Math.abs(x) < 26) d = Math.min(d, -1);                  // the station (the woods carry on past the tracks)
    const f = L.field; if (inBox(f, x, z)) d = Math.min(d, -1); else d = Math.min(d, Math.max(f.x0 - x, x - f.x1, z - f.z0, f.z1 - z));
    const fm = L.farm; if (inBox(fm, x, z, 2)) d = Math.min(d, -1); else d = Math.min(d, Math.max(fm.x0 - x, x - fm.x1, z - fm.z0, fm.z1 - z) + 1);   // (the corn maze: woods close in around it)
    d = Math.min(d, Math.hypot(x - L.eastGate.x, z - L.eastGate.z) - 8);
    const hb = L.hills; if (inBox(hb, x, z)) d = Math.min(d, -1); else d = Math.min(d, Math.max(hb.x0 - x, x - hb.x1, z - hb.z0, hb.z1 - z) + 2);   // the Windmill Hills
    if (typeof CEMETERY !== 'undefined' && z < -186) d = Math.min(d, CEMETERY.playDist(x, z));     // north of Alba: the Old Quarter, the brick roads, the theater, the cemetery
    if (typeof CAVES !== 'undefined' && x > 10 && z < -140) d = Math.min(d, CAVES.playDist(x, z));   // the quarry road and the miners' camp
    if (typeof GARDENS !== 'undefined' && x > 140 && z > -124 && z < -36) d = Math.min(d, GARDENS.playDist(x, z));   // the garden road and the Bloom Gardens' valley
    if (typeof PEAKS !== 'undefined' && x > 90 && z < -186) d = Math.min(d, PEAKS.playDist(x, z));     // the Frost Pass, Escarcha and the tower's ledge
    if (MARSH_ON && z < -262) d = Math.min(d, MARSH.playDist(x, z));      // the Gray Marsh: the road in, Candil, the causeway, the tower's path (after the scatter: see MARSH_ON)
    if (PORT_ON && x < -60 && z > -142) d = Math.min(d, PORT.playDist(x, z));      // Port Brisa: the road, the city, the bay (after the scatter: see PORT_ON)
    if (RUINS_ON && x > 72 && z > -53) d = Math.min(d, RUINS.playDist(x, z));      // the Sunken Ruins' canyon (after the scatter: see RUINS_ON)
    return d;
  }
  const bump = (x, z, c) => { const t = Math.hypot(x - c.x, z - c.z) / c.r; return t < 1 ? c.h * (1 - t * t) * (1 - t * t) : 0; };
  // (molinar.js puts its windmills on the first five; the last two squeeze the road into the pass)
  const HILLS = [{ x: 108, z: -122, r: 14, h: 3.5 }, { x: 126, z: -186, r: 16, h: 4 }, { x: 140, z: -116, r: 12, h: 3 }, { x: 162, z: -192, r: 14, h: 3.5 }, { x: 100, z: -178, r: 12, h: 3 },
    { x: 150, z: -133, r: 12, h: 4.5 }, { x: 150, z: -167, r: 12, h: 4.5 }];

  function rawHeight(x, z) {
    let h = 0.55 * Math.sin(x * 0.09) * Math.cos(z * 0.11) + 0.3 * Math.sin(x * 0.21 + 1.3) * Math.sin(z * 0.17 + 0.4) + 0.7 * Math.sin(x * 0.035 + z * 0.02);
    // keep dry land dry: the bumps used to dip below the water line where there's no water,
    // which made bare "sand" and invisible walls (the walk code won't let you into deep water)
    h += 0.35; if (h < 0.3) h = 0.3 + (h - 0.3) * 0.12;
    h += bump(x, z, { x: 72, z: -186, r: 18, h: 6 });           // the big hill past the field
    h += bump(x, z, { x: -44, z: 40, r: 14, h: 3.2 });
    h += bump(x, z, { x: 34, z: -50, r: 16, h: 3.2 }) + bump(x, z, { x: -36, z: -80, r: 18, h: 3.8 }) + bump(x, z, { x: 44, z: -108, r: 14, h: 2.6 });   // rolling hills by the road
    if (x > 88) {     // the Windmill Hills (each one has a windmill on top), and the two steep hills of the pass
      for (const b of HILLS) h += bump(x, z, b);
    }
    const lk = L.lookout, ld = Math.hypot(x - lk.x, z - lk.z) / lk.r;   // the lookout: a steep knoll
    h += lk.h * (1 - smoothstep(0.5, 1, ld)) + 0.8 * (1 - smoothstep(0.9, 1.4, ld));
    // flat places: the town, the station; the road itself smoothed a little
    h = lerp(h, L.town.y, 1 - smoothstep(-8, 2, townDist(x, z)));
    h = lerp(h, L.molinar.y, 1 - smoothstep(8, 14, Math.hypot(x - 240, z + 176)));     // the Great Mill's ground
    if (typeof CORN !== 'undefined') h = lerp(h, CORN.flatY, CORN.flatK(x, z));     // the corn maze's field (cornmaze.js)
    if (typeof CEMETERY !== 'undefined' && z < -186) h = CEMETERY.ground(x, z, h);     // north of Alba (cemetery.js)
    if (typeof CAVES !== 'undefined' && z < -190 && x > 26) h = CAVES.ground(x, z, h);   // the quarry's mountains and the camp's floor (caves.js)
    if (typeof PEAKS !== 'undefined' && z < -186 && x > 96) h = PEAKS.ground(x, z, h);   // the Frost Peaks: the pass cut through them, the village, the ledge (peaks.js)
    h = lerp(h, 0, smoothstep(54, 57, z));
    if (z < -34) h = lerp(h, h * 0.5 + 0.2, 1 - smoothstep(2, 5, pathDist(x, z)));
    // the stream, the creek and the ponds
    const sd = Math.abs(z - streamZ(x));
    if (z > 18 && z < 42) h = lerp(h, -0.85, 1 - smoothstep(1.0, 2.6, sd));
    const cd = Math.abs(z - creekZ(x));
    if (z < -54 && z > -80) h = lerp(h, -0.8, 1 - smoothstep(0.9, 2.3, cd));
    if (RUINS_ON && x > 76 && z > -49) h = RUINS.ground(x, z, h);     // the Sunken Ruins: the canyon, its cove and its mesas (ruins.js; after the stream, which ran across it)
    // the garden road's ridge, the valley's floor and its hills (gardens.js; after the creek, which would cross the valley)
    if (typeof GARDENS !== 'undefined' && x > 148 && z > -120 && z < -38) h = GARDENS.ground(x, z, h);
    if (x < -45) {
      // Remanso's flat village ground, the Reed River's channel (deep: only the raft gets you across)
      const rv = L.remanso, inV = Math.min(x - rv.x0, rv.x1 - x, z - rv.z1, rv.z0 - z);
      h = lerp(h, rv.y, smoothstep(-5, 1, inV));
      if (z > L.river.z0 - 6 && z < L.river.z1) h = lerp(h, -1.7, (1 - smoothstep(1.6, 4.2, Math.abs(x - riverX(z)))) * smoothstep(L.river.z1, L.river.z1 - 6, z));
    }
    for (const p of L.ponds) h -= 2.4 * (1 - smoothstep(0, p.r * 1.3, Math.hypot(x - p.x, z - p.z)));
    // the land rises into wooded hills toward the edges of the map
    const ex = Math.max(x - (L.maxX - 12), (L.minX + 12) - x, 0), ez = Math.max(z - (L.maxZ - 12), 0) + Math.max((SZ0 + 12) - z, 0);
    h += 9 * smoothstep(0, 10, Math.hypot(ex, ez));
    if (MARSH_ON && z < -262) h = MARSH.ground(x, z, h);      // north of the old edge: the Gray Marsh's basin cut into the hills, the ridge, the Old Tower's rise (marsh.js; see MARSH_ON)
    if (x < -45) {
      // the Mirror Lake's basin, after the edge's rise (out west it runs on past the map's edge), with hills round its far shores;
      // shore sand comes by itself where the ground dips toward the water. Then the islets and Lighthouse Island.
      if (x < -218) for (const b of L.lakeHills) h += bump(x, z, b);
      const S = lakeShape(x, z);
      if (S.d < 0.25 * S.R) h = lerp(h, L.lake.bed, 1 - smoothstep(-0.22 * S.R, 0.04 * S.R, S.d));
      if (x < -218) for (const t of L.islets) { const id = Math.hypot(x - t.x, z - t.z) / t.r; if (id < 1.4) h = lerp(h, 0.2 + 0.9 * Math.max(0, 1 - id * 1.3), 1 - smoothstep(0.75, 1.15, id)); }
      const id = Math.hypot(x - L.island.x, z - L.island.z) / L.island.r;
      if (id < 1.4) h = lerp(h, 1.1 + 0.6 * Math.max(0, 1 - id * 1.4), 1 - smoothstep(0.75, 1.15, id));
    }
    // Port Brisa: the hills south of the bay, the sea (out through the map's west edge), the city's floor, the road, the moat (port.js)
    if (PORT_ON && x < -60 && z > -142) h = PORT.ground(x, z, h);
    // the railway's bed: flat along the line, cut through the rising woods up to the tunnel mouth
    if (z > 60 && x > -30 && x < 72) {
      const td = TRACK.dist(x, z);
      if (td < 8) h = lerp(h, 0.02, (1 - smoothstep(2.6, 7.5, td)) * (1 - smoothstep(1.5, 3.5, TRACK.past(x, z))));
    }
    return h;
  }

  // ------------------------------------------------------------ grids (1 unit cells)
  const GW = L.maxX - L.minX + 1, GH = L.maxZ - L.minZ + 1;
  const H = new Float32Array(GW * GH), MAP = new Float32Array(GW * GH * 4);
  // no grass on the towns' streets and squares, inside their buildings and stalls, in Alba's pond or in
  // Molinar's wheat fields (town.js and molinar.js draw those)
  const TL = typeof TOWN !== 'undefined' ? TOWN.layout : null, ML = typeof MOLINAR !== 'undefined' ? MOLINAR : null, LK = typeof LAKE !== 'undefined' ? LAKE : null;
  const inObb = (b, x, z, pad) => { const c = Math.cos(b.rot || 0), s = Math.sin(b.rot || 0), lx = (x - b.x) * c - (z - b.z) * s, lz = (x - b.x) * s + (z - b.z) * c; return Math.abs(lx) < (b.w || 0) / 2 + pad && Math.abs(lz) < (b.d || 0) / 2 + pad; };
  function townBare(x, z) {
    let a = 0;
    if (TL && Math.hypot(x - L.town.x, z - L.town.z) < L.town.r + 3) {
      a = TOWN.pavedAt(x, z);
      for (const b of TL.buildings) if (b.w && inObb(b, x, z, 0.6)) return 1;
      for (const b of TL.stalls || []) if (b.w && inObb(b, x, z, 0.4)) return 1;
      const P = TOWN.landmarks.pond; if (P && Math.hypot(x - P.x, z - P.z) < 7.5) a = Math.max(a, 1 - smoothstep(6.2, 7.5, Math.hypot(x - P.x, z - P.z)));
    }
    if (ML && x > 88) {
      if (ML.pavedAt) a = Math.max(a, ML.pavedAt(x, z));
      if (ML.fieldAt) a = Math.max(a, ML.fieldAt(x, z));
      const bl = ML.layout && ML.layout.buildings;
      if (bl) for (const b of bl) if (b.w && Math.abs(x - b.x) < 14 && Math.abs(z - b.z) < 14 && inObb(b, x, z, 0.6)) return 1;
    }
    if (LK && x < -100 && LK.bareAt) a = Math.max(a, LK.bareAt(x, z));          // Remanso's paths and the ground under its houses
    if (typeof CORN !== 'undefined' && x > -36 && x < 64 && z < -60 && z > -124) a = Math.max(a, CORN.bareAt(x, z));     // (the corn maze's dirt floor and paths)
    if (typeof CEMETERY !== 'undefined' && z < -186) a = Math.max(a, CEMETERY.bareAt(x, z));     // (the brick roads, the buildings, the cemetery's paths)
    if (typeof CAVES !== 'undefined' && x > 26 && z < -140) a = Math.max(a, CAVES.bareAt(x, z));     // (the quarry road, the camp's gravel, bare rock)
    if (typeof GARDENS !== 'undefined' && x > 148 && z > -120 && z < -38) a = Math.max(a, GARDENS.bareAt(x, z));     // (the garden road, paths, buildings, the fields' soil)
    if (typeof PEAKS !== 'undefined' && x > 96 && z < -186) a = Math.max(a, PEAKS.bareAt(x, z));     // (the snow)
    if (MARSH_ON && z < -268) a = Math.max(a, MARSH.bareAt(x, z));     // (the Gray Marsh's paths, Candil's trodden earth, the causeway)
    if (typeof TOWNLIFE !== 'undefined' && TOWNLIFE.bareAt) a = Math.max(a, TOWNLIFE.bareAt(x, z));       // (the smokers' corner, the stores)
    if (typeof DOMINO !== 'undefined' && DOMINO.bareAt && x < -38 && x > -60 && z < -150 && z > -175) a = Math.max(a, DOMINO.bareAt(x, z));     // (Don Fello's yard)
    if (PORT_ON && x < -60 && z > -142) a = Math.max(a, PORT.bareAt(x, z));     // (Port Brisa: its paving, the road, the islet, the sand along the shore)
    if (RUINS_ON && x > 76 && z > -49) a = Math.max(a, RUINS.bareAt(x, z));     // (the Sunken Ruins: sand and rock)
    return a;
  }
  // the Windmill Hills' trodden paths (molinar.js), painted into the ground like the road they leave and the forest trails
  // (they used to be crisp strips laid on top, stopping short of the road: playtest 4, "weird looking paths")
  const HP = ML && ML.layout && ML.layout.hillPaths ? ML.layout.hillPaths.map(p => ({ pts: spline(p.pts, 4), w: p.w })) : [];
  const hillPathAt = (x, z) => { if (x < 88 || x > 148 || z < -192 || z > -112) return 0; let a = 0; for (const p of HP) a = Math.max(a, 1 - smoothstep(p.w / 2 - 0.15, p.w / 2 + 0.75, lineDist(p.pts, x, z))); return a; };
  // (one grid cell: its height, grass, gray and path; Port Brisa's corner is worked out again once PORT_ON, after the scatter)
  function cell(i, j) {
    const x = L.minX + i, z = L.minZ + j, h = rawHeight(x, z), k = j * GW + i;
    H[k] = h;
    const pd = Math.min(pathDist(x, z) * (z < -34 ? 0.8 : 1), trailDist(x, z) + 0.6);
    const pathM = Math.max(1 - smoothstep(1.0, 1.8, pd), z > 56 && z < 67 && x > -24 && x < 13 ? 1 : 0,     // (the town's streets are drawn by town.js)
      z > 60 && TRACK.past(x, z) < 1 ? 1 - smoothstep(1.7, 2.6, TRACK.dist(x, z)) : 0,                   // the railway's bed
      typeof CAVES !== 'undefined' && z < -240 ? CAVES.pathAt(x, z) : 0,                                   // the miners' camp's gravel floor
      typeof GARDENS !== 'undefined' && x > 148 && z > -100 && z < -44 ? GARDENS.pathAt(x, z) : 0,       // the Bloom Gardens' paths
      MARSH_ON && z < -268 ? MARSH.pathAt(x, z) : 0,                                                     // the Gray Marsh's road in and the Old Tower's path
      PORT_ON && x < -130 && z > -142 && z < -80 ? PORT.pathAt(x, z) : 0,                                 // the Brisa Road (port.js)
      hillPathAt(x, z));                                                                                    // the Windmill Hills' paths
    const f = forestAt(x, z);
    const grass = lerp(1, 0.45, f) * (1 - pathM) * smoothstep(L.water + 0.15, L.water + 0.45, h) * (townDist(x, z) < -4 ? 0.9 : 1) * (1 - townBare(x, z));
    MAP.set([h, grass, hushAt(x, z), pathM], k * 4);
  }
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) cell(i, j);
  // Ground height for walking (bilinear over the grid, plus platforms).
  function terrainAt(x, z) {
    const fx = clamp(x - L.minX, 0, GW - 1.001), fz = clamp(z - L.minZ, 0, GH - 1.001);
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * GW + i;
    return lerp(lerp(H[k], H[k + 1], u), lerp(H[k + GW], H[k + GW + 1], u), v);
  }
  function groundAt(x, z, y) {
    let g = terrainAt(x, z);
    for (const p of PLATFORMS) {
      let top = null;
      if (p.box) { if (x >= p.box[0] && x <= p.box[1] && z >= p.box[2] && z <= p.box[3]) top = p.fn ? p.fn(x, z) : p.top; }     // (fn: a surface of its own inside the box, null off it: TIME.land's dunes, drifts and beds)
      else {
        const [ax, az, bx, bz] = p.seg, dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
        const t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1);
        if (Math.hypot(x - (ax + dx * t), z - (az + dz * t)) < p.w / 2) top = lerp(p.y[0], p.y[1], t);
      }
      // a platform counts if you're on it or could step onto it (not when you're under it); a solid one
      // always counts, so its side is a wall you can't walk into
      if (top !== null && top > g && (p.solid || y === undefined || y >= top - 0.6)) g = top;
    }
    return g;
  }
  const mapAt = (x, z, c) => { const i = clamp(Math.round(x - L.minX), 0, GW - 1), j = clamp(Math.round(z - L.minZ), 0, GH - 1); return MAP[(j * GW + i) * 4 + c]; };

  // ------------------------------------------------------------ scatter: trees, rocks, ferns, mushrooms, flowers
  // trees: { x, z, s, kind, seed, wall } — wall trees are the dense, simpler ones at the edges
  // (SX0: the map's west edge before the lake grew. The scatter below still samples from there, so every tree, rock and flower
  // it placed stays where it was; the woods round the grown lake come after it, from their own seed.)
  const SX0 = -296;
  const trees = [], rocks = [], ferns = [], shrooms = [], flowers = [], logs = [];
  const TG = new Map(), tkey = (x, z) => ((Math.floor(x / 4) + 200) * 1000) + (Math.floor(z / 4) + 200);
  const treeNear = (x, z, d) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = TG.get(tkey(x + a * 4, z + b * 4)); if (l) for (const t of l) if (Math.hypot(t.x - x, t.z - z) < d) return true; } return false; };
  const addTree = t => { trees.push(t); const k = tkey(t.x, t.z); if (!TG.has(k)) TG.set(k, []); TG.get(k).push(t); };
  const open = (x, z, pad = 0) => pathDist(x, z) > (z < -34 ? 5 : 3.4) + pad && trailDist(x, z) > 2.4 + pad && clearingAt(x, z) < 0.05
    && Math.abs(z - streamZ(x)) > 3 + pad && !(z < -54 && z > -80 && Math.abs(z - creekZ(x)) < 3) && mapAt(x, z, 0) > L.water + 0.2 && townDist(x, z) > 1 + pad
    && !(ML && ML.keepClear && x > 88 && ML.keepClear(x, z, 0.5))           // (Molinar's farm, fields, paths and windmills)
    && !(typeof CORN !== 'undefined' && CORN.keepClear(x, z, pad))       // (the corn maze and its paths)
    && !(typeof CEMETERY !== 'undefined' && z < -186 && CEMETERY.keepClear(x, z, pad))     // (north of Alba)
    && !(typeof CAVES !== 'undefined' && x > 10 && z < -140 && CAVES.keepClear(x, z, pad))     // (the quarry road and the camp)
    && !(typeof GARDENS !== 'undefined' && x > 144 && z > -122 && z < -36 && GARDENS.keepClear(x, z, pad))     // (the garden road and the Bloom Gardens)
    && !(typeof PEAKS !== 'undefined' && x > 90 && z < -186 && PEAKS.keepClear(x, z, pad))     // (the Frost Pass, Escarcha, the snow)
    && !(MARSH_ON && z < -262 && MARSH.keepClear(x, z, pad))     // (the Gray Marsh's road in)
    && !(x < -45 && (Math.abs(x - riverX(z)) < 4.5 + pad && z < L.river.z1 || lakeE(x, z) < 1.06 || (LK && LK.keepClear && LK.keepClear(x, z, 0.5))))   // (the river, the lake, Remanso)
    && !(z > 58 && TRACK.dist(x, z) < 3.9 && TRACK.past(x, z) < 3.5);          // (the railway: room for the train to pass)
  // the forest itself
  for (let n = 0; n < 26000 && trees.length < 1100; n++) {
    const x = lerp(SX0 + 3, L.maxX - 3, R()), z = lerp(-38, 58, R());
    const f = forestAt(x, z), pd = playDist(x, z);
    if (pd > 6 || R() > f * 0.95 || !open(x, z) || treeNear(x, z, 3.1)) continue;
    const r = R();
    addTree({ x, z, s: 0.85 + R() * 0.55, kind: r < 0.42 ? 'pine' : r < 0.6 ? 'birch' : 'round', seed: R() });
  }
  // meadow trees along the road and around town, sparser, in little groves
  for (let n = 0; n < 20000 && trees.length < 1900; n++) {
    const x = lerp(SX0 + 4, L.maxX - 4, R()), z = lerp(SZ0 + 8, -36, R());
    if (playDist(x, z) > 6 || !open(x, z, 1) || treeNear(x, z, 6.5) || inBox(L.field, x, z, 2) || inBox(L.farm, x, z, 2)) continue;
    if (R() > 0.35 + 0.4 * Math.max(0, Math.sin(x * 0.07) * Math.cos(z * 0.05))) continue;
    addTree({ x, z, s: 0.9 + R() * 0.5, kind: R() < 0.3 ? 'pine' : 'round', seed: R() });
  }
  trees.push({ x: 31.5, z: -13.5, s: 1.3, kind: 'big', seed: 0.7 });
  // the woods thicken away from the places you're meant to be, into a wall you can't get through
  for (let n = 0; n < 352000 && trees.length < 12000; n++) {          // (as many tries per area as before the map grew east and west)
    const x = lerp(SX0 + 1, L.maxX - 1, R()), z = lerp(SZ0 + 1, L.maxZ - 1, R());
    const pd = playDist(x, z);
    if (pd < 4 || pd > 26) continue;
    const spacing = lerp(3.4, 1.9, smoothstep(4, 12, pd));
    if (R() > smoothstep(2, 9, pd) || !open(x, z, -1.5) || mapAt(x, z, 0) < L.water + 0.2 || treeNear(x, z, spacing)) continue;
    const r = R();
    addTree({ x, z, s: 0.9 + R() * 0.6, kind: r < 0.5 ? 'pine' : 'round', seed: R(), wall: pd > 7 });
  }
  for (let n = 0; n < 7500 && rocks.length < 175; n++) {
    const x = lerp(SX0 + 6, L.maxX - 6, R()), z = lerp(SZ0 + 10, 56, R());
    if (playDist(x, z) < 6 && open(x, z, -1) && rocks.every(r => Math.hypot(r.x - x, r.z - z) > 6)) rocks.push({ x, z, s: 0.35 + R() * 0.75, seed: R(), moss: forestAt(x, z) > 0.5 });
  }
  // the pass: a rocky ridge across the road, between its two steep hills; the boulder plugs the gap
  {
    const B = L.boulder;
    for (const side of [-1, 1]) for (let k = 0; k < 7; k++) {
      const dz = 3.5 + k * 2.3, x = B.x + (k % 2 ? 0.7 : -0.5);      // (close enough that nobody squeezes between them)
      rocks.push({ x, z: B.z + side * dz, s: 1.45 + 0.55 * Math.abs(Math.sin(k * 1.7 + side)), seed: R(), moss: k > 3 });
    }
  }
  for (let n = 0; n < 30000 && ferns.length < 720; n++) {          // (each fern is a few hundred triangles: keep them where you walk)
    const x = lerp(SX0 + 4, L.maxX - 4, R()), z = lerp(-34, 56, R());
    if (R() < forestAt(x, z) && playDist(x, z) < 7 && pathDist(x, z) > 2.2 && trailDist(x, z) > 1.6 && mapAt(x, z, 0) > L.water + 0.25) ferns.push({ x, z, s: 0.6 + R() * 0.6, r: R() * TAU, seed: R() });
  }
  for (let n = 0; n < 9000 && shrooms.length < 160; n++) {
    const x = lerp(SX0 + 4, L.maxX - 4, R()), z = lerp(-34, 56, R());
    if (R() < forestAt(x, z) * 0.6 && playDist(x, z) < 4 && pathDist(x, z) > 2 && mapAt(x, z, 0) > L.water + 0.25) shrooms.push({ x, z, s: 0.5 + R() * 0.7, red: R() < 0.55, seed: R() });
  }
  // the fairy ring: glowing mushrooms in a circle
  const ring = [];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; ring.push({ x: 30 + Math.cos(a) * 3.6, z: 36 + Math.sin(a) * 3.6, s: 0.9 + (i % 3) * 0.15 }); }
  const FLOWER = ['#ffffff', '#ffd84a', '#ff8fb1', '#b9a2ff', '#ff7a59'];
  for (let n = 0; n < 2800 && flowers.length < 1050; n++) {
    const x = lerp(SX0 + 5, L.maxX - 5, R()), z = lerp(SZ0 + 10, 64, R());
    const c = clearingAt(x, z), f = forestAt(x, z);
    if (playDist(x, z) > 4 || pathDist(x, z) < 2 || townDist(x, z) < 0 || mapAt(x, z, 0) < L.water + 0.3 || mapAt(x, z, 2) > 0.4) continue;
    if (ML && ML.keepClear && x > 88 && ML.keepClear(x, z, 0.5)) continue;
    if (typeof CORN !== 'undefined' && CORN.keepClear(x, z, 0.5)) continue;
    if (typeof CEMETERY !== 'undefined' && z < -186 && CEMETERY.keepClear(x, z, 0.5)) continue;
    if (typeof CAVES !== 'undefined' && x > 10 && z < -140 && CAVES.keepClear(x, z, 0.5)) continue;
    if (typeof GARDENS !== 'undefined' && x > 144 && z > -122 && z < -36 && GARDENS.keepClear(x, z, 0.5)) continue;
    if (typeof PEAKS !== 'undefined' && x > 90 && z < -186 && PEAKS.keepClear(x, z, 0.5)) continue;
    if (x < -45 && (Math.abs(x - riverX(z)) < 5 || lakeE(x, z) < 1.1 || (LK && LK.keepClear && LK.keepClear(x, z, 0.5)))) continue;
    if (R() < (1 - f) * 0.5 + c * 0.9) {
      const col = FLOWER[(R() * 5) | 0];
      for (let i = 0; i < 6; i++) { const a = R() * TAU, r = Math.sqrt(R()) * 1.6; flowers.push({ x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, col: R() < 0.8 ? col : FLOWER[(R() * 5) | 0], s: 0.8 + R() * 0.5, seed: R() }); }
    }
  }
  // Port Brisa (port.js) joins in now that the scatter above is done (so nothing it placed has moved): its corner of the grid is
  // worked out again (the city's floor, the sea, the road, the moat, the hills south of the bay), and the trees and rocks the scatter
  // left on its streets, its road and its shore go
  if (typeof PORT !== 'undefined') {
    PORT_ON = true;
    const i0 = Math.max(0, -470 - L.minX), i1 = Math.min(GW - 1, -60 - L.minX), j0 = Math.max(0, -142 - L.minZ);
    for (let j = j0; j < GH; j++) for (let i = i0; i <= i1; i++) cell(i, j);
    const gone = t => t.x < -120 && t.z > -142 && (PORT.keepClear(t.x, t.z, 0.6) || terrainAt(t.x, t.z) < L.water + 0.2);
    for (let i = trees.length - 1; i >= 0; i--) { const t = trees[i]; if (!gone(t)) continue; trees.splice(i, 1); const l = TG.get(tkey(t.x, t.z)); if (l && l.includes(t)) l.splice(l.indexOf(t), 1); }
    for (let i = rocks.length - 1; i >= 0; i--) if (gone(rocks[i])) rocks.splice(i, 1);
  }
  // the woods round the grown Mirror Lake: its far shores and hills, and the land north of Remanso, seen from the ferry and the
  // island (own seed; not round Remanso and the near shore, which keep their trees). Simple trees (far: world3d.js tiles them big).
  {
    const RL = rng(4471210), I = L.island;
    for (let n = 0, added = 0; n < 30000 && added < 2400; n++) {
      const x = lerp(L.minX + 2, -122, RL()), z = lerp(SZ0 + 2, -84, RL()), s = 0.9 + RL() * 0.7, kind = RL() < 0.55 ? 'pine' : 'round', seed = RL(), edge = 3 + RL() * 6;
      if (x > -217 && z > -196) continue;
      if (terrainAt(x, z) < L.water + 0.35 || lakeD(x, z) < edge || Math.abs(x - riverX(z)) < 7 || Math.hypot(x - I.x, z - I.z) < I.r + 4) continue;
      if (playDist(x, z) < 5 || (LK && LK.keepClear && LK.keepClear(x, z, 0.5)) || (typeof CEMETERY !== 'undefined' && z < -186 && CEMETERY.keepClear(x, z, 1))) continue;
      if (typeof PORT !== 'undefined' && PORT.keepClear && PORT.keepClear(x, z, 1)) continue;        // (Port Brisa: its land stays clear)
      if (treeNear(x, z, 3.3)) continue;
      addTree({ x, z, s, kind, seed, wall: true, far: true }); added++;
    }
  }
  // the woods round Port Brisa (port.js WOODS, own seed, after everything above): a wall along the road, the moat and the city's
  // land side, and sparser woods over the hills south of the bay and east of the city, so the harbor never looks out on bare land
  if (PORT_ON && PORT.WOODS) {
    const W = PORT.WOODS, RP = rng(6061606), rv = L.remanso;
    for (let n = 0, added = 0; n < W.tries && added < W.max; n++) {
      const x = lerp(W.x0, W.x1, RP()), z = lerp(W.z0, W.z1, RP()), s = 0.9 + RP() * 0.7, kind = RP() < 0.5 ? 'pine' : 'round', seed = RP(), jit = RP();
      const sp = W.spacing(x, z, jit);
      if (!sp || terrainAt(x, z) < L.water + 0.35 || Math.abs(x - riverX(z)) < 7 || lakeD(x, z) < 4 || inBox(rv, x, z, 6) || PORT.keepClear(x, z, 1.2) || treeNear(x, z, sp)) continue;
      addTree({ x, z, s, kind, seed, wall: true, far: W.far(x, z) }); added++;
    }
  }
  // the Gray Marsh (marsh.js) joins in now too: the rows north of z −262 are worked out again (the basin and its black water, the
  // ridge east of it, the Old Tower's rise), what the scatter left in its water or on its paths goes, and its own woods grow
  // (marsh.js scatter, own seed: the basin's rim, and the hills out to the map's new north edge)
  if (typeof MARSH !== 'undefined') {
    MARSH_ON = true;
    const j1 = Math.min(GH - 1, -262 - L.minZ);
    for (let j = 0; j <= j1; j++) for (let i = 0; i < GW; i++) cell(i, j);
    const gone = t => t.z < -262 && (MARSH.keepClear(t.x, t.z, 0.6) || terrainAt(t.x, t.z) < L.water + 0.2);
    for (let i = trees.length - 1; i >= 0; i--) { const t = trees[i]; if (!gone(t)) continue; trees.splice(i, 1); const l = TG.get(tkey(t.x, t.z)); if (l && l.includes(t)) l.splice(l.indexOf(t), 1); }
    for (let i = rocks.length - 1; i >= 0; i--) if (gone(rocks[i])) rocks.splice(i, 1);
    for (let i = flowers.length - 1; i >= 0; i--) if (gone(flowers[i])) flowers.splice(i, 1);
    try { MARSH.scatter({ addTree, treeNear, terrainAt, L }); } catch (e) { console.error('[marsh] scatter', e); }
  }
  // the Sunken Ruins (ruins.js) join in last: the south-east corner of the grid is worked out again (the canyon, the cove, the
  // mesas), and whatever the scatter left in it goes (nothing of the woods grows in the canyon)
  if (typeof RUINS !== 'undefined') {
    RUINS_ON = true;
    const R0 = RUINS.REGION, i0 = Math.max(0, R0.x0 - 4 - L.minX), i1 = Math.min(GW - 1, R0.x1 + 4 - L.minX), j0 = Math.max(0, R0.zN - 4 - L.minZ);
    for (let j = j0; j < GH; j++) for (let i = i0; i <= i1; i++) cell(i, j);
    const gone = t => RUINS.keepClear(t.x, t.z, 0.6);
    for (let i = trees.length - 1; i >= 0; i--) { const t = trees[i]; if (!gone(t)) continue; trees.splice(i, 1); const l = TG.get(tkey(t.x, t.z)); if (l && l.includes(t)) l.splice(l.indexOf(t), 1); }
    for (const list of [rocks, flowers, ferns, shrooms]) for (let i = list.length - 1; i >= 0; i--) if (gone(list[i])) list.splice(i, 1);
  }
  logs.push({ x1: -18.6, z1: 22.8, x2: -19.4, z2: 31.0, r: 0.42, bridge: true }, { x1: 12, z1: 18, x2: 16, z2: 21, r: 0.4 }, { x1: -38, z1: -6, x2: -34, z2: -9, r: 0.45 });

  // ------------------------------------------------------------ the fox's den, in its clearing
  // (Noa's page there says "my friend the fox lives here"): a mossy mound under an old stump, with a burrow
  const den = { x: -33.5, z: 12, stump: { x: -34.6, z: 10.6, r: 1.3 }, logs: [{ x1: -25.5, z1: 18.5, x2: -29.5, z2: 20, r: 0.42 }], stones: [[-26.5, 9.5], [-27.5, 8.2], [-34.5, 17.5], [-36.2, 15.8]] };
  logs.push(...den.logs);

  // ------------------------------------------------------------ colliders (in a grid, for speed)
  const C = [];
  trees.forEach(t => C.push({ x: t.x, z: t.z, r: (t.kind === 'big' ? 0.9 : t.wall ? 0.75 : 0.42) * t.s + 0.1 }));
  rocks.forEach(r => C.push({ x: r.x, z: r.z, r: r.s * 0.95 }));
  logs.filter(l => !l.bridge).forEach(l => { const n = 5; for (let i = 0; i <= n; i++) C.push({ x: lerp(l.x1, l.x2, i / n), z: lerp(l.z1, l.z2, i / n), r: l.r + 0.05 }); });
  C.push({ x: den.stump.x, z: den.stump.z, r: den.stump.r }, { x: den.x, z: den.z, r: 1.1 });
  den.stones.forEach(([x, z]) => C.push({ x, z, r: 0.45 }));
  // the station: shelter posts, lamp, sign posts, the bench, the station house, the fences at the platform's ends
  [[5.4, 63.6], [10.6, 63.6], [-7, 60.3], [-1.6, 60.3], [1.6, 60.3]].forEach(([x, z]) => C.push({ x, z, r: 0.22 }));
  C.push({ obox: 1, x: 8, z: 64.05, hw: 1.2, hd: 0.28, rot: 0 });
  { const h = L.stationHouse; C.push({ obox: 1, x: h.x, z: h.z, hw: h.w / 2, hd: h.d / 2, rot: 0 }); }
  C.push({ obox: 1, x: 20.2, z: 65.7, hw: 5.8, hd: 0.15, rot: 0 });
  // the bridge's rails
  { const b = L.bridge, px = -b.uz, pz = b.ux; for (let k = -3.6; k <= 3.6; k += 0.9) [-1, 1].forEach(s => C.push({ x: b.x + b.ux * k + px * s * 1.55, z: b.z + b.uz * k + pz * s * 1.55, r: 0.12 })); }
  const GRID = new Map(), gk = (cx, cz) => cx * 4096 + cz;
  function addCollider(c) {
    const r = (c.obox ? Math.hypot(c.hw, c.hd) : c.r) + 0.8;   // (+ your own radius, so a solid just over a cell edge still counts)
    for (let cx = Math.floor((c.x - r) / 8); cx <= Math.floor((c.x + r) / 8); cx++) for (let cz = Math.floor((c.z - r) / 8); cz <= Math.floor((c.z + r) / 8); cz++) {
      const k = gk(cx + 64, cz + 64); if (!GRID.has(k)) GRID.set(k, []); GRID.get(k).push(c);
    }
  }
  C.forEach(addCollider);
  const extra = [];   // story things add solids here at runtime (NPCs, the chest, the fox)
  function pushOne(c, x, z, r) {
    if (c.obox) {
      const cs = Math.cos(c.rot), sn = Math.sin(c.rot);
      let lx = (x - c.x) * cs - (z - c.z) * sn, lz = (x - c.x) * sn + (z - c.z) * cs;
      const cx = clamp(lx, -c.hw, c.hw), cz = clamp(lz, -c.hd, c.hd), dx = lx - cx, dz = lz - cz, d = Math.hypot(dx, dz);
      if (d >= r) return [x, z];
      if (d > 1e-4) { lx = cx + (dx / d) * r; lz = cz + (dz / d) * r; }
      else if (c.hw - Math.abs(lx) < c.hd - Math.abs(lz)) lx = Math.sign(lx || 1) * (c.hw + r); else lz = Math.sign(lz || 1) * (c.hd + r);
      return [c.x + lx * cs + lz * sn, c.z - lx * sn + lz * cs];
    }
    const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
    if (d < m && d > 1e-4) return [c.x + (dx / d) * m, c.z + (dz / d) * m];
    return [x, z];
  }
  function pushOut(x, z, r) {
    const l = GRID.get(gk(Math.floor(x / 8) + 64, Math.floor(z / 8) + 64));
    if (l) for (const c of l) { if (Math.abs(x - c.x) > 9 || Math.abs(z - c.z) > 9) continue; [x, z] = pushOne(c, x, z, r); }
    for (const c of extra) { if (Math.abs(x - c.x) > 9 || Math.abs(z - c.z) > 9) continue; [x, z] = pushOne(c, x, z, r); }
    return [clamp(x, L.bx0, L.bx1), clamp(z, L.bz0, L.bz1)];
  }
  // Solids added after the world is built (the town's houses, fences, stalls): fixed, so they go in the grid.
  function addSolids(list) { list.forEach(c => { C.push(c); addCollider(c); }); }
  // Platforms added later (the town's pond footbridge), in the PLATFORMS format.
  function addPlatforms(list) { PLATFORMS.push(...list); }
  return { L, PATH, TRAILS, TRACK, pathDist, trailDist, playDist, townDist, forestAt, hushAt, clearingAt, terrainAt, groundAt, mapAt, GW, GH, H, MAP,
    trees, rocks, ferns, shrooms, ring, flowers, logs, den, colliders: C, extra, pushOut, addSolids, addPlatforms };
})();
