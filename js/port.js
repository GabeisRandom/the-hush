'use strict';
// Region 6, Port Brisa (DESIGN.md 14.10, 6 and 17.1): the big port city by the sea, the third hub, south of the Mirror Lake.
// The Brisa Road leaves Remanso southward to the city's east gate, where a moat and a raised drawbridge stop you. Marino, a
// harbor kid on the bank, calls the gulls down to him, and Mimo learns «llama / chama / ruf» (叫, 呼んで) by watching; told to
// call, it brings the flock down on the sleeping bridge keeper's roof, and Abel wakes up and lowers the bridge. Inside the
// walls: Dora the harbor master, five sailors to interview (who saw Noa?) with good questions (qué, quién, de dónde, adónde,
// por qué; ir, venir, hacer, tener; travel), each question word first asked by Marino in front of you, and Eloy's ticket booth,
// where you ask when the boat goes and buy a ticket by asking for it. Then you call the fort boat from the end of the ferry
// pier and sail out to the sea fort on its islet (port_fort.js), where the harbor bell hangs (flags.portFree: bell 6 of 8).
// Crabs (battle/flow.js) walk sideways: hit them from behind, and say so.
// (2026-11-16: refitted to the grown Mirror Lake (DESIGN.md 16.5). The lake's south shore runs along z ≈ −120…−125 west of
// x −240, so the bay no longer runs west along it: a wooded headland and the lake's south hills keep the two apart, and the
// bay opens south-west into the open sea, which carries on past the map's west edge into the haze.)
//   plain data, ready before world.js: layout, landmarks, hush, roamers, roadDist, ground, playDist, keepClear, bareAt, pathAt,
//     areaAt, songAt, drawMap, open(state), inCity, seaD (the sea's signed distance), WATER (world3d.js: the sea's sheet in the
//     map), FARSEA and FARSHORES (the water past the map's west edge, the hole it leaves in the far ground, its wooded shores),
//     noOuterTree, WOODS (world.js grows the woods round the city from its own seed), DOCK (the big ship, region 7),
//     FORT_ROOMS (the sea fort's halls at y 300)
//   the language: PORT.ask (QS, grade(text, lang, key) → { ok, wrong, letter, reason, slips, soft, model, qw, verb })
//   PORT.build(scene, { terrainAt }) → { colliders, platforms, moving, group, people, update(dt, t, you|null), objects, … }
//   the game side (port_play.js): init(game), interactables(), target(), wayIn(), tick(), sync(); state in state.port
// Flags: portRoad (on the road), nico (met Marino), portGate (the drawbridge is down), port (arrived), dora, askedAll, doraTold,
//   ticket, boatCalled, fortLanded, portFree (the harbor bell; bells ≥ 6), portSixth (Dora's word after it). Region 7 (the
//   Sunken Ruins) sails from PORT.DOCK: boarding calls RUINS.arrive() (flags.ruins) if RUINS is loaded.

const PORT = (() => {
  // ---------------------------------------------------------------- the map (north is −z, west is −x)
  const CITY = { x: -201, z: -82, x0: -236, x1: -166, zN: -118, zS: -46, y: 0.6 };
  const QUAY = -236.3;                                  // the quay's face: the bay is west of it, from the north wall to the beach
  const BEACH = { zN: -64, zS: -46 };                   // sand in the city's south-west corner, sloping into the bay
  // the road from Remanso: from the end of the village's own path, between its two south houses and under Rocío's laundry line
  const ROAD_PTS = [[-144.6, -138.2], [-143.8, -134.2], [-145.0, -128.5], [-147.4, -122], [-149.3, -116], [-151.2, -105], [-153.2, -95.5], [-155.2, -89], [-156.2, -86.5]];
  const MOAT = { x0: -163.4, x1: -156.6, zN: -100, zS: -73, bed: -1.9 };
  const BRIDGE = { xa: -156.2, xb: -165.6, z: -86.5, w: 3.4, y: 0.72 };
  const GATE = { x: -165.8, z: -86.5, w: 4.4 };
  const WALL = { x: -165.8, zN: -118.6, zS: -45.6, t: 1.3, h: 3.4, nEnd: -236.2, sEnd: -253 };   // (the south wall runs on into the bay: a breakwater)
  const FORT = { x: -272, z: -86.5, r: 7.2, y: 0.9 };
  const PIERS = [{ id: 'fish', z: -106, x1: -250, w: 3 }, { id: 'ferry', z: -86.5, x1: -253.5, w: 3.2 }, { id: 'long', z: -71, x1: -257.5, w: 3.4 }];
  const FORT_DOCK = { xa: -265.4, xb: -262.0, z: -86.5, w: 2.8 };
  const FOG = { x: -148.5, z: -118.5, r: 4.6 };        // the gray fog across the road, until the fifth bell
  const PLAZA = { x0: -222.5, x1: -206, zN: -101.4, zS: -71.6, x: -214.2, z: -86.5 };
  // where things happen
  const SPOT = {
    nico: { x: -153.4, z: -93.6, yaw: -1.3 }, watch: { x: -151.6, z: -96.8 }, moatEdge: { x: -155.2, z: -86.5 }, roadIn: { x: -144.2, z: -134.5 },
    abel: { x: -168.5, z: -91.3, yaw: Math.PI / 2 }, booth: { x: -169.9, z: -93.6 }, enter: { x: -170.5, z: -86.5 },
    dora: { x: -230.2, z: -97.4, yaw: -Math.PI / 2 }, greta: { x: -243.4, z: -107.1, yaw: Math.PI }, rui: { x: -230.4, z: -76.2, yaw: -Math.PI / 2 },
    wei: { x: -210.6, z: -99.2, yaw: 0 }, yuki: { x: -244.6, z: -88.0, yaw: -Math.PI / 2 }, omar: { x: -223.4, z: -60.2, yaw: Math.PI }, omarGround: { x: -221.6, z: -62.2 },
    tito: { x: -231.4, z: -93.9, yaw: 0 }, kiosk: { x: -231.4, z: -93.8 }, kioskWin: { x: -231.4, z: -91.2 },
    pierEnd: { x: -251.6, z: -86.5 }, boatPier: { x: -253.2, z: -89.4 }, boatFort: { x: -263.8, z: -89.4 },
    landing: { x: -263.6, z: -86.5 }, fortGate: { x: -266.9, z: -86.5 }, plaza: { x: -214.2, z: -86.5 }, beach: { x: -226, z: -54 },
    ship: { x: -248.5, z: -66.2 }, dock: { x: -254.8, z: -71 }, quino: { x: -251.4, z: -72.3, yaw: Math.PI / 2 },
    // the travelers waiting for the big ship (a side quest): by the capitanía, on the promenade, on the south street
    trav1: { x: -226.8, z: -104.6, yaw: 0.4 }, trav2: { x: -229.2, z: -81.6, yaw: -1.2 }, trav3: { x: -224.6, z: -67.6, yaw: 2.8 },
  };
  // the big ship to the far coasts (region 7, the Sunken Ruins): it leaves from here and lands you back here
  const DOCK = { x: -254.4, z: -71, yaw: Math.PI / 2 };
  // the sea fort's halls, floating at y 300 out of sight (port_fort.js): clear of every other room by 26 or more
  const FORT_ROOMS = [{ x: -282, z: -206 }, { x: -256, z: -206 }, { x: -256, z: -180 }, { x: -282, z: -180 }];
  const HUSH = [{ x: -201, z: -83, r: 44, a: 0.55, port: true }, { x: FOG.x, z: FOG.z, r: 12, a: 0.78, portGate: true }];
  const ROAMERS = [
    { x: -224, z: -55, area: 'port', foes: [{ kind: 'crab', color: 'red' }, { kind: 'crab', color: 'blue' }] },
    { x: -189, z: -68, area: 'port', foes: [{ kind: 'crab', color: 'green' }, { kind: 'hushling', color: 'yellow' }] },
    { x: -151.6, z: -108, area: 'port', foes: [{ kind: 'crab', color: 'yellow' }, { kind: 'moth', color: 'red' }] },
  ];
  const AREAS = { road: { id: 'brisaroad', name: 'The Brisa Road', color: '#b8955a' }, city: { id: 'portbrisa', name: 'Port Brisa', color: '#3f8fb5' }, fort: { id: 'seafort', name: 'The Sea Fort', color: '#6f7f99' } };

  // ---------------------------------------------------------------- the sea
  // One polygon (x, z): from the quay's north end west along the headland's shore (the lake's south hills stand behind it, so the
  // lake and the sea never meet), out past the map's west edge into the haze, back in along the south coast to the breakwater,
  // and up the quay. Inside it the ground drops to deep water past the shallows; the land beside it slopes down to it.
  const SEA_PTS = [
    [-236.3, -121.5], [-246, -120], [-256, -116.5], [-265, -111], [-275, -106.5], [-288, -102.5], [-302, -99], [-316, -93], [-330, -85],
    [-346, -79], [-364, -80], [-384, -84], [-402, -80], [-420, -76], [-440, -79], [-458, -84], [-470, -86],
    // (past the map's edge: world3d.js draws this part as far water, flaring south-west away from the far lake's south shore)
    [-520, -62], [-600, -46], [-700, -28], [-775, -4], [-775, 120], [-700, 110], [-600, 80], [-520, 40], [-470, -18],
    [-430, -18], [-395, -20], [-360, -22], [-330, -24], [-300, -28], [-275, -33], [-262, -37.5], [-254.5, -43.4], [-237.6, -44.4],
  ];
  // past the map's west edge: the far water (its own polygon), and the two shores world3d.js raises along it (out: the land's side)
  const FARSEA = [[-470, -86], [-520, -62], [-600, -46], [-700, -28], [-775, -4], [-775, 120], [-700, 110], [-600, 80], [-520, 40], [-470, -18]];
  const FARSHORES = [{ line: [[-458, -86], [-470, -86], [-520, -62], [-600, -46], [-700, -28], [-775, -4]], out: -1 },
    { line: [[-458, -18], [-470, -18], [-520, 40], [-600, 80], [-700, 110], [-775, 120]], out: 1 }];
  // the sea's sheet of water inside the map (world3d.js; it only shows where the ground is under the water line). The lake's own
  // sheet covers z < −104 (the bay's north end too); this one the rest of the bay, the open sea and the moat
  const WATER = [{ x0: -470, x1: -155, z0: -104, z1: 78 }];
  // the land south of the bay rolls into low wooded hills (seen across the water: they hide the far plains)
  const HILLS = [{ x: -292, z: 12, r: 30, h: 7 }, { x: -356, z: 36, r: 34, h: 10 }, { x: -430, z: 22, r: 32, h: 9 }, { x: -228, z: 22, r: 26, h: 5 },
    { x: -250, z: 62, r: 30, h: 8 }, { x: -172, z: 14, r: 26, h: 6 }, { x: -128, z: -30, r: 22, h: 4.5 }, { x: -196, z: -22, r: 16, h: 3 },
    { x: -140, z: 52, r: 28, h: 6 }, { x: -90, z: 20, r: 26, h: 5 }, { x: -400, z: 66, r: 30, h: 9 }];

  // ---------------------------------------------------------------- shapes
  function segDist(ax, az, bx, bz, x, z) { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)) : 0; return Math.hypot(x - (ax + dx * t), z - (az + dz * t)); }
  function lineD(pts, x, z) { let d = 1e9; for (let i = 1; i < pts.length; i++) d = Math.min(d, segDist(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], x, z)); return d; }
  // the signed distance to a closed polygon (< 0 inside)
  function polyD(pts, x, z) {
    let d = 1e9, inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], zi = pts[i][1], xj = pts[j][0], zj = pts[j][1];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
      d = Math.min(d, segDist(xj, zj, xi, zi, x, z));
    }
    return inside ? -d : d;
  }
  const seaD = (x, z) => (x > -214 || z < -128 ? 30 : polyD(SEA_PTS, x, z));      // (far from it: just "far")
  const farSeaD = (x, z) => polyD(FARSEA, x, z);
  const roadDist = (x, z) => (x < -136 && x > -166 && z > -142 && z < -80 ? lineD(ROAD_PTS, x, z) : 1e9);
  const boxOut = (x, z, b, pad = 0) => Math.max(b.x0 - pad - x, x - b.x1 - pad, b.zN - pad - z, z - b.zS - pad);     // < 0 inside
  const inCity = (x, z, pad = 0) => boxOut(x, z, CITY, pad) < 0;
  const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, k) => a + (b - a) * k;
  const open = s => !!(s && s.flags && (s.flags.peaksFree || (s.flags.bells || 0) >= 5));

  // the ground (world.js calls this last in rawHeight, after the map's edge has risen into hills and the lake has its basin):
  // the hills south of the bay, the sea and its coast, the city's floor, the quay, the beach, the road, the moat, the fort's islet
  function ground(x, z, h) {
    for (const b of HILLS) { const t = Math.hypot(x - b.x, z - b.z) / b.r; if (t < 1) h += b.h * (1 - t * t) * (1 - t * t); }
    const sd = seaD(x, z);
    if (sd < 14) {
      const p = sd < 0 ? Math.max(-3.2, -0.25 + sd * 0.62) : -0.25 + sd * 0.55;
      h = sd < 0 ? Math.min(h, p) : mix(Math.min(h, p), h, ss(8, 14, sd));
    }
    // the city's floor: flat, out to the walls (never out over the bay: the quay drops straight into it)
    const k = x < QUAY ? 0 : ss(-4, 2, -boxOut(x, z, CITY, 2));
    h = mix(h, CITY.y, k);
    // the quay: a stone face straight down into deep water, from the north wall to the beach
    // (only right off the quay: further out, the sea's own profile)
    if (x < QUAY + 0.7 && x > QUAY - 10 && z > CITY.zN - 4 && z < BEACH.zN + 1) {
      const w = ss(CITY.zN - 4, CITY.zN - 1, z) * (1 - ss(BEACH.zN - 1, BEACH.zN + 1, z)) * (1 - ss(QUAY - 5, QUAY - 10, x));
      h = mix(h, Math.min(h, -3.2), w * ss(QUAY + 0.7, QUAY - 0.9, x));
    }
    // the beach in the city's south-west corner: sand sloping west into the bay, round the quay's end and along the breakwater
    if (z > BEACH.zN - 3 && z < BEACH.zS + 3.5 && x > -264 && x < -200) {
      const w = ss(BEACH.zN - 3, BEACH.zN + 0.5, z) * (1 - ss(BEACH.zS + 0.6, BEACH.zS + 3.5, z)) * (1 - ss(-252, -264, x)), b = mix(CITY.y, -1.9, ss(-216, -250, x));
      h = mix(h, b, w * ss(-200, -210, x));
    }
    const rd = roadDist(x, z);
    if (rd < 7) h = mix(h, Math.max(0.36, Math.min(h, 1.2) * 0.5 + 0.22), 1 - ss(2.2, 7, rd));
    if (x > MOAT.x0 - 3 && x < MOAT.x1 + 3 && z > MOAT.zN - 3 && z < MOAT.zS + 3) h = mix(h, MOAT.bed, 1 - ss(-0.7, 0.9, boxOut(x, z, MOAT)));
    const fd = Math.hypot(x - FORT.x, z - FORT.z) / FORT.r;
    if (fd < 1.6) h = mix(h, FORT.y + 0.25 * Math.max(0, 1 - fd * 1.4), 1 - ss(0.82, 1.18, fd));
    return h;
  }
  // how far from anywhere you're meant to be (world.js, after its own scatter: the mini-map's woods, and the density of the woods
  // world.js grows round the city from WOODS)
  function playDist(x, z) {
    let d = roadDist(x, z) - 6;
    d = Math.min(d, boxOut(x, z, CITY) + 2.5, Math.hypot(x - FORT.x, z - FORT.z) - FORT.r - 2, boxOut(x, z, { x0: MOAT.x0 - 2, x1: MOAT.x1 + 7, zN: MOAT.zN - 6, zS: MOAT.zS + 6 }));
    if (x < QUAY + 1 && seaD(x, z) < 0) d = Math.min(d, -1);       // (the bay and the sea: open water, no trees)
    return d;
  }
  // nothing scattered here (trees, rocks, flowers): the city, its walls' feet, the road, the moat, the islet, the fog's spot,
  // the shore by the city
  function keepClear(x, z, pad = 0) {
    return boxOut(x, z, CITY, 2.5 + pad) < 0 || roadDist(x, z) < 4.2 + pad || boxOut(x, z, MOAT, 3 + pad) < 0 || Math.hypot(x - FORT.x, z - FORT.z) < FORT.r + 1.5 + pad
      || Math.hypot(x - FOG.x, z - FOG.z) < 7 + pad || (x < -226 && x > -290 && z > -124 && z < -36 && seaD(x, z) < 2.5 + pad);
  }
  // no grass: the city (paved: port.js lays its own stones), the road, the islet, the sand along the shore
  function bareAt(x, z) {
    if (inCity(x, z, 1.2)) return 1;
    const rd = roadDist(x, z); if (rd < 2.6) return 1 - ss(1.6, 2.6, rd);
    const fd = Math.hypot(x - FORT.x, z - FORT.z); if (fd < FORT.r + 0.5) return 0.85;
    const sd = seaD(x, z); if (sd < 3 && sd > -3) return 0.9 * (1 - ss(1.5, 3, sd));
    return 0;
  }
  const pathAt = (x, z) => 1 - ss(1.0, 1.9, roadDist(x, z));
  function areaAt(x, z) {
    if (x > -130 || z < -140 || z > -30) return null;
    if (Math.hypot(x - FORT.x, z - FORT.z) < FORT.r + 4) return AREAS.fort;
    if (inCity(x, z, 3)) return AREAS.city;
    if (roadDist(x, z) < 9 || boxOut(x, z, MOAT, 6) < 0) return AREAS.road;
    if (x < QUAY && x > -300 && seaD(x, z) < 0) return AREAS.city;      // (the harbor: the bay off the quay)
    return null;
  }
  // the area's song: the city's (and the bay's, and the road's last stretch); inside the sea fort, the fort's (port_fort.js)
  const has = s => typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(s);
  function songAt(x, z) {
    if (typeof PORTFORT !== 'undefined' && PORTFORT.inside) return has('seafort') ? 'seafort' : 'mill';
    const a = areaAt(x, z);
    if (a === AREAS.city || a === AREAS.fort || (a === AREAS.road && z > -112)) return has('port') ? 'port' : 'molinar';
    return null;
  }
  // the far woods past the map's west edge stay off the far water
  const noOuterTree = (x, z) => x < -440 && z > -100 && z < 140 && farSeaD(Math.min(x, -470), z) < 5;

  // world.js grows these woods with its own seed, after its own scatter (so nothing it placed moves): a wall round the road, the
  // moat and the city's land side, and lower, sparser woods over the hills south of the bay and east of the city, so no bare
  // plain and no edge of the world shows from the harbor. spacing(x, z, jitter) → the gap between trees here, or 0 for none.
  const WOODS = { x0: -470, x1: -62, z0: -136, z1: 76, tries: 70000, max: 3600,
    spacing(x, z, j) {
      if (x > -120 && z < -84) return 0;              // (between the Reed River and Alba: the old woods are there)
      if (x > -64) return 0;
      const pd = playDist(x, z);
      if (pd < 2.5) return 0;
      return pd < 12 ? 2.25 + pd * 0.06 + j * 0.45 : pd < 40 ? 3.1 + j * 0.9 : 4.4 + j * 1.6;
    },
    far: (x, z) => playDist(x, z) > 16 };

  // ---------------------------------------------------------------- the city's blocks (houses: { x, z, w, d, rot, floors, col, roof, face })
  const HOUSE_COL = ['#f2c48d', '#e58e6b', '#8fc1d9', '#f4e6c4', '#b6d7a8', '#f3a9a0', '#d9c26a', '#a9b8e8', '#f6efe2', '#e8b5d0'];
  const ROOF_COL = ['#c9643f', '#b8563a', '#a8533f', '#d07a45'];
  const BUILDINGS = [];
  {
    let seed = 6061; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // a row of houses along x (from x0 to x1), its fronts facing 'n' or 's' (or both), z its middle
    const row = (x0, x1, z, d, face, gaps = []) => {
      let x = x0;
      while (x < x1 - 2.5) {
        const g = gaps.find(([a, b]) => x >= a - 0.01 && x < b); if (g) { x = g[1]; continue; }
        const nextGap = gaps.find(([a]) => a > x), lim = Math.min(x1, nextGap ? nextGap[0] : x1);
        let w = 4 + Math.round(R() * 3) * 0.75; if (lim - (x + w) < 3.2) w = lim - x;
        if (w < 2.6) { x = lim; continue; }
        BUILDINGS.push({ kind: 'house', x: x + w / 2, z, w: w - 0.05, d, rot: 0, floors: 2 + (R() < 0.45 ? 1 : 0), col: HOUSE_COL[Math.floor(R() * HOUSE_COL.length)], roof: R() < 0.55 ? 'tile' : 'flat', roofCol: ROOF_COL[Math.floor(R() * ROOF_COL.length)], face, seed: Math.floor(R() * 1e6) });
        x += w;
      }
    };
    const ALLEYS = [[-196, -192.4], [-181, -177.4]];
    row(-227.6, -168, -112.4, 9.6, 's');                         // the north row, its back to the wall
    row(-206, -172.5, -96.4, 10, 'both', ALLEYS);                 // between the north street and the main street (the gate square past them)
    row(-206, -172.5, -76.6, 10, 'both', ALLEYS);                 // between the main street and the south street
    // the landmarks
    BUILDINGS.push({ kind: 'capitania', x: -225, z: -96.4, w: 5, d: 10, rot: 0, floors: 3, col: '#f4f1e8', roof: 'flat', face: 'w' });
    BUILDINGS.push({ kind: 'lonja', x: -225, z: -76.6, w: 5, d: 10, rot: 0, floors: 1, col: '#e8d9b8', roof: 'tile', roofCol: '#b8563a', face: 'w' });
    BUILDINGS.push({ kind: 'aduana', x: -199, z: -59.7, w: 14, d: 9.4, rot: 0, floors: 2, col: '#f2e3c4', roof: 'flat', face: 'n' });
    BUILDINGS.push({ kind: 'store', x: -186.5, z: -59.2, w: 10, d: 8.6, rot: 0, floors: 2, col: '#c9a07a', roof: 'tile', roofCol: '#a8533f', face: 'n' });
    BUILDINGS.push({ kind: 'store', x: -174.2, z: -59.2, w: 12, d: 8.6, rot: 0, floors: 2, col: '#b5c4cf', roof: 'tile', roofCol: '#c9643f', face: 'n' });
    BUILDINGS.push({ kind: 'kiosk', x: SPOT.kiosk.x, z: SPOT.kiosk.z, w: 2.4, d: 2.2, rot: 0, floors: 1, col: '#4f8fb5', roof: 'flat', face: 's' });
    BUILDINGS.push({ kind: 'booth', x: SPOT.booth.x, z: SPOT.booth.z, w: 2.4, d: 2.4, rot: 0, floors: 1, col: '#c9b48e', roof: 'tile', roofCol: '#a8533f', face: 'e' });
  }
  // the walls (obox runs) and towers, for colliders, the camera and the map
  const WALLS = [
    { x0: WALL.nEnd, x1: WALL.x, z: WALL.zN, axis: 'x' },                               // north, from the north-west tower to the north-east corner
    { z0: WALL.zN, z1: GATE.z - GATE.w / 2, x: WALL.x, axis: 'z' },                       // east, north of the gate
    { z0: GATE.z + GATE.w / 2, z1: WALL.zS, x: WALL.x, axis: 'z' },                       // east, south of the gate
    { x0: WALL.sEnd, x1: WALL.x, z: WALL.zS, axis: 'x' },                               // south, from the breakwater's end to the south-east corner
  ];
  const TOWERS = [{ x: WALL.x, z: WALL.zN, r: 2.1 }, { x: WALL.x, z: WALL.zS, r: 2.1 }, { x: QUAY + 0.4, z: WALL.zN, r: 1.9 }, { x: -236.6, z: WALL.zS, r: 1.9 },
    { x: WALL.x, z: GATE.z - GATE.w / 2 - 1.6, r: 1.7, gate: true }, { x: WALL.x, z: GATE.z + GATE.w / 2 + 1.6, r: 1.7, gate: true }];

  function drawMap(c, o = {}) {
    const PX = o.PX || 0.33, INK = o.INK || '#2b2235';
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // the paved city floor, the streets lighter, the plaza, the beach
    c.fillStyle = '#d8cdb8'; c.fillRect(CITY.x0, CITY.zN, CITY.x1 - CITY.x0, BEACH.zN - CITY.zN); c.fillRect(-214, BEACH.zN, CITY.x1 + 214, CITY.zS - BEACH.zN);
    c.fillStyle = '#e8dfcc'; c.fillRect(PLAZA.x0, PLAZA.zN, PLAZA.x1 - PLAZA.x0, PLAZA.zS - PLAZA.zN);
    c.fillStyle = '#e9d9a8'; c.fillRect(-230, BEACH.zN, 16, BEACH.zS - BEACH.zN);
    // the moat, the road, the piers and the bridge
    c.fillStyle = '#5aa6c8'; c.fillRect(MOAT.x0, MOAT.zN, MOAT.x1 - MOAT.x0, MOAT.zS - MOAT.zN);
    c.strokeStyle = '#c9ad78'; c.lineWidth = 2.6; c.beginPath(); ROAD_PTS.forEach(([x, z], i) => (i ? c.lineTo(x, z) : c.moveTo(x, z))); c.stroke();
    c.strokeStyle = '#a07a52'; for (const p of PIERS) { c.lineWidth = p.w; c.beginPath(); c.moveTo(QUAY, p.z); c.lineTo(p.x1, p.z); c.stroke(); }
    c.lineWidth = BRIDGE.w; c.beginPath(); c.moveTo(BRIDGE.xa, BRIDGE.z); c.lineTo(BRIDGE.xb, BRIDGE.z); c.stroke();
    c.lineWidth = FORT_DOCK.w; c.beginPath(); c.moveTo(FORT_DOCK.xa, FORT_DOCK.z); c.lineTo(FORT_DOCK.xb, FORT_DOCK.z); c.stroke();
    // the houses: little roofs
    for (const b of BUILDINGS) { c.fillStyle = b.kind === 'house' ? (b.roof === 'tile' ? b.roofCol : '#c9bca4') : b.kind === 'kiosk' ? '#4f8fb5' : '#b8a27e'; c.fillRect(b.x - b.w / 2, b.z - b.d / 2, b.w, b.d); c.strokeStyle = INK; c.lineWidth = 0.9 * PX; c.strokeRect(b.x - b.w / 2, b.z - b.d / 2, b.w, b.d); }
    // the walls and towers
    c.strokeStyle = '#8f8778'; c.lineWidth = WALL.t + 0.4;
    for (const w of WALLS) { c.beginPath(); if (w.axis === 'x') { c.moveTo(w.x0, w.z); c.lineTo(w.x1, w.z); } else { c.moveTo(w.x, w.z0); c.lineTo(w.x, w.z1); } c.stroke(); }
    c.fillStyle = '#9c9484'; for (const t of TOWERS) { c.beginPath(); c.arc(t.x, t.z, t.r, 0, Math.PI * 2); c.fill(); c.lineWidth = 1 * PX; c.strokeStyle = INK; c.stroke(); }
    // the big ship at the long pier
    c.fillStyle = '#2f3f5a'; c.fillRect(SPOT.ship.x - 6, SPOT.ship.z - 1.8, 12, 3.6); c.strokeStyle = INK; c.lineWidth = 0.9 * PX; c.strokeRect(SPOT.ship.x - 6, SPOT.ship.z - 1.8, 12, 3.6);
    // the fort on its islet
    c.fillStyle = '#d9c99a'; c.beginPath(); c.arc(FORT.x, FORT.z, FORT.r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#9c9484'; c.beginPath(); c.arc(FORT.x, FORT.z, 5.2, 0, Math.PI * 2); c.fill(); c.lineWidth = 1.2 * PX; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#e6b84a'; c.beginPath(); c.arc(FORT.x, FORT.z, 1.2, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();
  }

  return {
    CITY, QUAY, BEACH, ROAD_PTS, MOAT, BRIDGE, GATE, WALL, WALLS, TOWERS, FORT, PIERS, FORT_DOCK, FOG, PLAZA, SPOT, DOCK, FORT_ROOMS, BUILDINGS, AREAS,
    SEA_PTS, FARSEA, FARSHORES, WATER, HILLS, WOODS, seaD, farSeaD, polyD,
    hush: HUSH, roamers: ROAMERS, roadDist, ground, playDist, keepClear, bareAt, pathAt, areaAt, songAt, drawMap, open, inCity, noOuterTree, boxOut, ss, mix,
    layout: { buildings: BUILDINGS.concat(WALLS.map(w => (w.axis === 'x' ? { x: (w.x0 + w.x1) / 2, z: w.z, w: Math.abs(w.x1 - w.x0), d: WALL.t, rot: 0, floors: 1 } : { x: w.x, z: (w.z0 + w.z1) / 2, w: WALL.t, d: Math.abs(w.z1 - w.z0), rot: 0, floors: 1 }))), road: ROAD_PTS, city: CITY },
    landmarks: Object.assign({ city: { x: CITY.x, z: CITY.z }, gate: { x: GATE.x, z: GATE.z }, fort: { x: FORT.x, z: FORT.z }, fog: FOG }, SPOT),
  };
})();

// ================================================================ the language: asking questions (qué, quién, dónde, cuándo, cómo, por qué)
// PORT.ask.grade(text, lang, key) reads a question you put to someone, for one of the things you want to know (QS):
//   → { ok, wrong: null | 'none' (not a question: no question word) | 'qword' (a question, but about something else), letter
//       S–D, reason, slips, soft, model, qw (the question word heard), verb }
// es: the question word (and its accent: soft), ¿…? (soft), the verb (ir, venir, hacer, tener; salir, llegar) and its person
//   (tú or usted; «hago / vengo / voy» ask about yourself), «de dónde» for where from, «adónde» for where to (soft), the noun.
// pt: «o que / de onde / para onde / aonde / quem / quando / como / por que» («porque» in a question: a slip), the verb.
// de: the W-word, the verb right after it (the verb comes second), «woher / wohin» (or «wo … her / hin»), the noun's capital.
// zh: 什么 / 谁 / 哪里 (哪儿) / 什么时候 / 怎么 / 为什么, the verb (做, 来, 有, 去, 怕), 从 for from, no 吗 with a question word.
// ja: 何 / だれ / どこ / いつ / どう / どうして (なぜ), the verb (する, 来る, 持つ, 行く), から for from, か (soft).
// Each kind of slip counts once (a major one twice): 0 → S (or A with only soft notes), 1 → B, 2 → C, 3+ → D.
(() => {
  const P = PORT;
  const nrm = s => String(s).toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const isCJ = l => l === 'zh' || l === 'ja';
  const canonOf = (t, l) => { try { return typeof CJK !== 'undefined' && CJK.canon ? CJK.canon(t, l) : String(t).toLowerCase().replace(/\s+/g, ''); } catch (e) { return String(t).toLowerCase(); } };
  const CANON = {};
  const canonKw = (w, l) => { const k = l + '|' + w; if (!(k in CANON)) CANON[k] = /^[a-z]+$/.test(w) ? w : canonOf(w, l); return CANON[k]; };
  // ---------------------------------------------------------------- what you want to know: the question word, the verb, the model
  // (qw: what · who · where · from · to · when · how · why)
  const QS = {
    what_do: { who: 'greta', qw: 'what', verb: 'do', icon: 'net', en: 'what she’s doing', title: 'Ask Greta what she’s doing.',
      model: { es: '¿Qué haces?', pt: 'O que você está fazendo?', de: 'Was machst du?', zh: '[你|nǐ] [在|zài] [做|zuò] [什么|shén me] ？', ja: '[何|なに] を して います か ？', en: 'What are you doing?' } },
    from: { who: 'rui', qw: 'from', verb: 'come', icon: 'boat', en: 'where he comes from', title: 'Ask Rui where he comes from.',
      model: { es: '¿De dónde vienes?', pt: 'De onde você vem?', de: 'Woher kommst du?', zh: '[你|nǐ] [从|cóng] [哪里|nǎ lǐ] [来|lái] ？', ja: 'どこ から [来|き]ました か ？', en: 'Where do you come from?' } },
    who_has: { who: 'wei', qw: 'who', verb: 'have', obj: 'ticket', icon: 'ticket', en: 'who has the boat tickets', title: 'Ask Wei who has the boat tickets.',
      model: { es: '¿Quién tiene los boletos?', pt: 'Quem tem as passagens?', de: 'Wer hat die Fahrkarten?', zh: '[谁|shéi] [有|yǒu] [船票|chuán piào] ？', ja: 'だれ が きっぷ を [持|も]って います か ？', en: 'Who has the tickets?' } },
    where_go: { who: 'yuki', qw: 'to', verb: 'go', icon: 'boat', en: 'where she’s going', title: 'Ask Yuki where she’s going.',
      model: { es: '¿Adónde vas?', pt: 'Para onde você vai?', de: 'Wohin gehst du?', zh: '[你|nǐ] [去|qù] [哪里|nǎ lǐ] ？', ja: 'どこ に [行|い]きます か ？', en: 'Where are you going?' } },
    why_afraid: { who: 'omar', qw: 'why', verb: 'fear', obj: 'fear', icon: 'crab', en: 'why he’s afraid', title: 'Ask Omar why he’s afraid.',
      model: { es: '¿Por qué tienes miedo?', pt: 'Por que você tem medo?', de: 'Warum hast du Angst?', zh: '[你|nǐ] [为什么|wèi shén me] [害怕|hài pà] ？', ja: 'どうして こわい ん です か ？', en: 'Why are you afraid?' } },
    when_go: { who: 'tito', qw: 'when', verb: 'leave', icon: 'boat', en: 'when the boat goes to the fort', title: 'Ask Tito when the boat goes to the sea fort.',
      model: { es: '¿Cuándo sale el barco al fuerte?', pt: 'Quando sai o barco para o forte?', de: 'Wann fährt das Boot zur Festung?', zh: '[船|chuán] [什么时候|shén me shí hou] [去|qù] [城堡|chéng bǎo] ？', ja: '[船|ふね] は いつ [砦|とりで] に [行|い]きます か ？', en: 'When does the boat leave for the fort?' } },
    how_go: { who: 'tito', qw: 'how', verb: 'get', icon: 'ticket', en: 'how you can get to the fort', title: 'Ask Tito how you can get to the sea fort.',
      model: { es: '¿Cómo voy al fuerte?', pt: 'Como eu vou para o forte?', de: 'Wie komme ich zur Festung?', zh: '[我|wǒ] [怎么|zěn me] [去|qù] [城堡|chéng bǎo] ？', ja: '[砦|とりで] に どう やって [行|い]きます か ？', en: 'How do I get to the fort?' } },
  };
  // ---------------------------------------------------------------- es / pt / de: question words (the first match wins: longest first)
  const QW = {
    es: [['why', /\bpor ?que\b/], ['when', /\bque hora\b/], ['from', /\bde ?donde\b/], ['to', /\ba ?donde\b/], ['where', /\bdonde\b/], ['what', /\bque\b/], ['who', /\bquien(es)?\b/], ['when', /\bcuando\b/], ['how', /\bcomo\b/], ['what', /\bcual(es)?\b/]],
    pt: [['why', /\bpor ?que\b/], ['when', /\bque horas?\b/], ['from', /\bde ?onde\b|\bdonde\b/], ['to', /\bpara ?onde\b|\baonde\b|\bpra ?onde\b/], ['where', /\bonde\b/], ['what', /\bo ?que\b|\bque\b/], ['who', /\bquem\b/], ['when', /\bquando\b/], ['how', /\bcomo\b/]],
    de: [['from', /\bwoher\b|\bwo\b.*\bher\b/], ['to', /\bwohin\b|\bwo\b.*\bhin\b/], ['where', /\bwo\b/], ['what', /\bwas\b/], ['who', /\bwer\b/], ['when', /\bwann\b|\bwie ?viel uhr\b|\bwie ?spat\b/], ['how', /\bwie\b/], ['why', /\bwarum\b|\bwieso\b|\bweshalb\b|\bwofur\b/]],
  };
  // (an accented letter isn't a word character to \b: «qué» is matched by what follows it)
  const ACC_OK = { what: /qué(?![a-záéíóúñü])/, who: /quién/, where: /dónde/, from: /dónde/, to: /dónde/, when: /cuándo|qué hora/, how: /cómo/, why: /qué(?![a-záéíóúñü])/ };
  // the verbs: [the forms that ask about someone else (tú, usted, they), the forms that ask about yourself]
  const VB = {
    es: { do: [/^(hace|haces|hacen|haciendo|haceis|hacés)$/, /^(hago|hacemos)$/], come: [/^(viene|vienes|vienen|venis|venís)$/, /^(vengo|venimos)$/], have: [/^(tiene|tienes|tienen|tenes|tenés)$/, /^(tengo|tenemos)$/],
      go: [/^(va|vas|van|vais|ido|yendo)$/, /^(voy|vamos)$/], fear: [/^(tiene|tienes|tienen|tenes|tenés)$/, /^(tengo|tenemos)$/], leave: [/^(va|van|sale|salen|parte|parten|zarpa|zarpan)$/, /^(voy|vamos|salgo|salimos)$/],
      get: [/^(voy|vamos|llego|llegamos|va|van|llega|llegan|se)$/, /^$/] },
    pt: { do: [/^(faz|fazes|fazem|fazendo|fazer)$/, /^(faco|fazemos)$/], come: [/^(vem|vens|veem|vindo)$/, /^(venho|vimos)$/], have: [/^(tem|tens|teem)$/, /^(tenho|temos)$/],
      go: [/^(vai|vais|vao|indo)$/, /^(vou|vamos)$/], fear: [/^(tem|tens|teem|esta|estas|estao)$/, /^(tenho|temos)$/], leave: [/^(vai|vao|sai|saem|parte|partem)$/, /^(vou|vamos|saio|saimos)$/],
      get: [/^(vou|vamos|chego|chegamos|vai|chega|ir|chegar)$/, /^$/] },
    de: { do: [/^(machst|macht|machen|tust|tut|tun)$/, /^(mache|tue)$/], come: [/^(kommst|kommt|kommen)$/, /^(komme)$/], have: [/^(hast|hat|haben|habt)$/, /^(habe)$/],
      go: [/^(gehst|geht|gehen|fahrst|fahrt|fahren|segelst|segelt)$/, /^(gehe|fahre)$/], fear: [/^(hast|hat|haben|habt)$/, /^(habe)$/], leave: [/^(fahrt|fahren|geht|gehen|legt|legen|faehrt)$/, /^(fahre|gehe)$/],
      get: [/^(komme|kommen|kommt|gehe|gehen|fahre|fahren)$/, /^$/] },
  };
  const OBJ = {
    ticket: { es: /^(boletos?|billetes?|pasajes?|tickets?|entradas?)$/, pt: /^(passagens?|passagem|bilhetes?|tickets?|ingressos?)$/, de: /^(fahrkarten?|tickets?|karten?|fahrscheine?)$/ },
    fear: { es: /^miedo$/, pt: /^medo$/, de: /^angst$/ },
  };
  const OBJ_SHOW = { ticket: { es: 'los boletos', pt: 'as passagens', de: 'die Fahrkarten' }, fear: { es: 'miedo', pt: 'medo', de: 'Angst' } };
  const VERB_SHOW = { es: { do: 'hace', come: 'viene', have: 'tiene', go: 'va', fear: 'tiene miedo', leave: 'va', get: 'voy' }, pt: { do: 'faz', come: 'vem', have: 'tem', go: 'vai', fear: 'tem medo', leave: 'vai', get: 'vou' },
    de: { do: 'machst', come: 'kommst', have: 'hat', go: 'fährst', fear: 'hast … Angst', leave: 'fährt', get: 'komme' } };
  const QW_SHOW = { es: { what: 'qué', who: 'quién', where: 'dónde', from: 'de dónde', to: 'adónde', when: 'cuándo', how: 'cómo', why: 'por qué' },
    pt: { what: 'o que', who: 'quem', where: 'onde', from: 'de onde', to: 'para onde', when: 'quando', how: 'como', why: 'por que' },
    de: { what: 'was', who: 'wer', where: 'wo', from: 'woher', to: 'wohin', when: 'wann', how: 'wie', why: 'warum' },
    zh: { what: '什么', who: '谁', where: '哪里', from: '从哪里', to: '去哪里', when: '什么时候', how: '怎么', why: '为什么' },
    ja: { what: '何', who: 'だれ', where: 'どこ', from: 'どこから', to: 'どこに', when: 'いつ', how: 'どう', why: 'どうして' } };
  // what each question word asks about, in English (for the hints)
  const QW_EN = { what: 'what', who: 'who', where: 'where', from: 'where from', to: 'where to', when: 'when', how: 'how', why: 'why' };
  // ---------------------------------------------------------------- zh / ja: words in characters (and their readings, canonical)
  // (each list: the characters / kana, then the pinyin / rōmaji someone types in the roman mode)
  const CJ = {
    zh: {
      qw: [['when', ['什么时候', '几点', '何时', 'shenmeshihou', 'jidian']], ['why', ['为什么', '为啥', '干吗', '干嘛', 'weishenme', 'weisha']], ['how', ['怎么', '如何', 'zenme', 'ruhe']], ['who', ['谁', 'shei', 'shui']],
        ['where', ['哪里', '哪儿', '哪', 'nali', 'nar', 'naer']], ['what', ['什么', '啥', 'shenme', 'sha']]],
      vb: { do: ['做', '干', '弄', 'zuo', 'gan'], come: ['来', 'lai'], have: ['有', 'you'], go: ['去', 'qu'], fear: ['害怕', '怕', 'haipa', 'pa'], leave: ['开', '出发', '走', '去', 'kai', 'chufa', 'zou', 'qu'], get: ['去', '走', '到', 'qu', 'zou', 'dao'] },
      obj: { ticket: ['票', '船票', 'piao', 'chuanpiao'] },
    },
    ja: {
      qw: [['why', ['どうして', 'なぜ', 'なんで', 'doushite', 'doshite', 'naze', 'nande']], ['how', ['どうやって', 'どう', 'douyatte', 'doyatte', 'dou']], ['when', ['いつ', 'itsu']], ['who', ['だれ', '誰', 'どなた', 'dare', 'donata']],
        ['where', ['どこ', 'どちら', 'doko', 'dochira']], ['what', ['何', 'なに', 'なん', 'nani', 'nan']]],
      vb: { do: ['して', 'します', 'する', 'やって', 'してる', 'shite', 'shimasu', 'suru', 'yatte'], come: ['来', 'きた', 'きました', 'きます', 'くる', 'kita', 'kimashita', 'kimasu', 'kuru'], have: ['持', 'もって', 'もつ', 'もち', 'motte', 'motsu', 'mochi'],
        go: ['行', 'いき', 'いく', 'いって', 'iki', 'iku', 'itte'], fear: ['怖', 'こわ', 'kowa'], leave: ['出', 'でる', 'でます', '行', 'いき', 'いく', 'deru', 'demasu', 'iki', 'iku'], get: ['行', 'いき', 'いく', 'いけ', 'iki', 'iku', 'ike'] },
      obj: { ticket: ['きっぷ', '切符', 'チケット', '券', 'kippu', 'chiketto'] },
    },
  };
  function finish(out) {
    let n = 0; for (const s of out.slips) n += s.major ? 2 : 1;
    // (an accent, or a missing ¿, is a tip, never a grade: P6a, accents.js)
    const sp = typeof ACCENTS !== 'undefined' ? ACCENTS.split(out.soft) : { soft: out.soft, tip: '' };
    out.letter = n === 0 ? (sp.soft.length ? 'A' : 'S') : n === 1 ? 'B' : n === 2 ? 'C' : 'D';
    out.reason = out.letter === 'S' ? 'Perfect question!' + (sp.tip ? ' · ' + sp.tip : '') : out.letter === 'A' ? sp.soft[0].why : out.slips[0].why;
    out.tip = sp.tip;
    return out;
  }
  function grade(text, l, key) {
    const Q = QS[key], lang = Q.model[l] ? l : 'es', raw = String(text || ''), low = raw.toLowerCase();
    const out = { ok: false, wrong: null, letter: null, reason: '', slips: [], soft: [], model: Q.model[lang], qw: null, verb: null };
    const slip = (kind, why, major) => { if (!out.slips.some(s => s.kind === kind)) out.slips.push({ kind, why, major: !!major }); };
    const soft = (kind, why) => { if (!out.soft.some(s => s.kind === kind)) out.soft.push({ kind, why }); };
    const want = Q.qw, same = (a, b) => a === b || (b === 'to' && a === 'where') || (b === 'from' && a === 'where') || (b === 'where' && (a === 'to' || a === 'from'));
    if (isCJ(lang)) {
      const C = CJ[lang], can = canonOf(raw, lang), roman = !/[぀-ヿ㐀-鿿]/.test(raw);
      const toks = low.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
      // a word is there: in the characters / kana as typed, or (pinyin / rōmaji typed) as a run in the plain letters (a short
      // one only as a word of its own, or, for a verb, as the start of one: «ikimasu», «kowai»)
      const has = (w, stem) => raw.includes(w) || (() => { const c = canonKw(w, lang); return !!c && (c.length >= 4 && (!roman || !stem) ? can.includes(c) : roman && toks.some(t => t === c || (stem && t.startsWith(c)))); })();
      const hasStem = w => has(w, true);
      let qw = null;
      for (const [k, list] of C.qw) if (list.some(w => has(w))) { qw = k; break; }
      // ja: どう in どうして is why; zh: 什么 in 为什么 / 什么时候 is caught by the order above
      if (!qw) { out.wrong = 'none'; return finish(out); }
      // zh 哪里 + 来 / 从 is where from; + 去 is where to
      if (lang === 'zh' && qw === 'where') qw = has('从') || (has('来') && !has('去')) ? 'from' : has('去') ? 'to' : 'where';
      if (lang === 'ja' && qw === 'where') qw = has('から') ? 'from' : /(に|へ)/.test(raw) || toks.some(t => t === 'ni' || t === 'e') || /dokoni|dokoe/.test(can) ? 'to' : 'where';
      out.qw = qw;
      if (!same(qw, want) && !(want === 'leave' && qw === 'when')) { out.wrong = 'qword'; return finish(out); }
      if (lang === 'zh' && want === 'from' && qw !== 'from') slip('from', 'Where from: «从哪里来»');
      if (lang === 'ja' && want === 'from' && qw !== 'from') slip('from', 'Where from: «どこから»');
      if (lang === 'ja' && want === 'to' && qw === 'where') soft('ni', 'Where to: «どこに / どこへ»');
      const vb = C.vb[Q.verb] || [];
      out.verb = vb.find(lang === 'ja' ? hasStem : w => has(w)) || null;
      if (!out.verb) slip('verb', `Say it with the verb: «${plainVerb(lang, Q.verb)}»`, true);
      if (Q.obj && C.obj[Q.obj] && !C.obj[Q.obj].some(w => has(w))) slip('obj', `Say what: «${C.obj[Q.obj][lang === 'zh' ? 1 : 0]}»`);
      if (lang === 'zh' && (/吗\s*[？?。！!]*\s*$/.test(raw) || toks[toks.length - 1] === 'ma')) slip('ma', 'With a question word, no 吗 at the end');
      if (lang === 'zh' && has('我') && Q.verb !== 'get' && !has('我们')) slip('person', 'You’re asking about them: «你…», not «我»');
      if (lang === 'ja' && !/(か|の)\s*[？?。]?\s*$/.test(raw) && !/(ka|no)\s*[?？.]?\s*$/.test(low) && !/[？?]\s*$/.test(raw)) soft('ka', 'A question ends with か (or の, among friends)');
      out.ok = true;
      return finish(out);
    }
    // es / pt / de
    const n = nrm(raw), toks = n.split(' ').filter(Boolean);
    let qw = null;
    for (const [k, re] of QW[lang]) if (re.test(n)) { qw = k; break; }
    if (!qw) { out.wrong = 'none'; return finish(out); }
    // es «¿dónde va?» asks where (to): «adónde» is the careful way; «de dónde» is from. pt «onde você vai?» is common too.
    out.qw = qw;
    if (!same(qw, want) && !(want === 'from' && qw === 'from')) { out.wrong = 'qword'; return finish(out); }
    if (want === 'from' && qw !== 'from') slip('from', lang === 'es' ? 'Where from: «¿De dónde…?»' : lang === 'pt' ? 'Where from: «De onde…?»' : 'Where from: «Woher…?»');
    if (want === 'to' && qw === 'where') { if (lang === 'de') slip('hin', 'Where to: «Wohin…?» (or «Wo … hin?»)'); else soft('to', lang === 'es' ? 'Where to: «¿Adónde…?» is the careful way' : 'Where to: «Para onde…?»'); }
    // the verb, and who it's about
    const [other, self] = VB[lang][Q.verb];
    const vi = toks.findIndex(t => other.test(t)), si = toks.findIndex(t => self.test(t));
    out.verb = vi >= 0 ? toks[vi] : si >= 0 ? toks[si] : null;
    if (vi < 0 && si < 0) slip('verb', `Say it with the verb: «${VERB_SHOW[lang][Q.verb]}»`, true);
    else if (vi < 0 && si >= 0 && Q.verb !== 'get') slip('person', lang === 'es' ? `You’re asking about them: «${VERB_SHOW.es[Q.verb]}» (usted) or the tú form` : lang === 'pt' ? `You’re asking about them: «${VERB_SHOW.pt[Q.verb]}»` : `You’re asking about them: «${VERB_SHOW.de[Q.verb]}»`);
    if (Q.obj && OBJ[Q.obj] && !toks.some(t => OBJ[Q.obj][lang].test(t))) slip('obj', `Say what: «${OBJ_SHOW[Q.obj][lang]}»`);
    // es: the accent on the question word, ¿ at the start, ? at the end
    if (lang === 'es') {
      const w = { what: /\bque\b/, who: /\bquien/, where: /donde/, from: /donde/, to: /donde/, when: /\bcuando\b/, how: /\bcomo\b/, why: /\bque\b/ }[qw];
      if (w && !ACC_OK[qw].test(low)) soft('accent', `In a question it takes an accent: «${QW_SHOW.es[qw]}»`);
      if (!/¿/.test(raw)) soft('open', 'Spanish questions open with ¿: «¿…?»');
      if (/\bporque\b/.test(low) && qw === 'why') slip('porque', 'In a question: «por qué», two words (porque is «because»)');
    }
    if (lang === 'pt' && /\bporque\b/.test(low) && qw === 'why') slip('porque', 'In a question: «por que», two words (porque is «because»)');
    // de: the verb comes right after the W-word; nouns take a capital
    if (lang === 'de' && vi >= 0) {
      let wi = toks.findIndex(t => /^(woher|wohin|wo|was|wer|wann|wie|warum|wieso|weshalb|wofur)$/.test(t));
      if (/\bwie ?viel uhr\b/.test(n)) wi = toks.indexOf('uhr');                    // («Um wie viel Uhr fährt …?»: the verb after the whole phrase)
      if (wi >= 0 && vi !== wi + 1) slip('order', `The verb comes second: «${QW_SHOW.de[qw === 'where' ? want : qw]} ${out.verb} …?»`);
      if (Q.obj === 'fear' && /\bangst\b/.test(low) && !/\bAngst\b/.test(raw)) soft('caps', 'Nouns take a capital: «Angst»');
      if (Q.obj === 'ticket' && /\b(fahrkarten?|tickets?|karten?)\b/.test(low) && !/\b(Fahrkarten?|Tickets?|Karten?)\b/.test(raw)) soft('caps', 'Nouns take a capital: «die Fahrkarten»');
    }
    if (!/[?？]\s*$/.test(raw)) soft('qmark', 'End a question with «?»');
    out.ok = true;
    return finish(out);
  }
  function plainVerb(l, v) { const C = CJ[l]; return C ? (C.vb[v] || [''])[0] : ''; }
  function model(key, l) { const Q = QS[key]; return (Q && (Q.model[l] || Q.model.es)) || ''; }
  Object.assign(P, { ask: { QS, grade, model, QW_SHOW, QW_EN, VERB_SHOW } });
})();
// ================================================================ the build: the road's fog, the moat and the drawbridge, the walled city, the harbor, the bay, the sea fort
(() => {
  const P = PORT, INK = '#2b2235';
  const dk = (hex, f) => '#' + new THREE.Color(hex).multiplyScalar(f).getHexString();
  const lt = (hex, f) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), f).getHexString();
  // water for world3d.js's shader (it shows only where the ground is below the water line): the bay out past the map, the moat
  // (the water itself is world3d.js's: P.WATER, the sea's sheet in the map, and P.FARSEA, the far water past its west edge)
  // the people: { shirt, pants | skirt, skin, hair, hat, hatCol, band, apron, scarf, bun, pony, pigtails, beard, mustache, kid, old, wide } (gardens.js draws them)
  const LOOKS = {
    nico: { shirt: '#4cb0d8', pants: '#3f4f66', skin: '#c98e62', hair: '#2e2420', kid: true, hat: 'cap', hatCol: '#e2574c' },
    abel: { shirt: '#6b7f5a', pants: '#4a4f66', skin: '#e6b48c', hair: '#d8d4cc', hat: 'beanie', hatCol: '#5a6a7a', band: '#4a5a6a', mustache: true, old: true, wide: 1.1 },
    dora: { shirt: '#2f3f6a', skirt: '#2f3f6a', skin: '#a8714a', hair: '#1f1a18', hat: 'captain', bun: true, scarf: '#f2c94c' },
    greta: { shirt: '#e2c74c', pants: '#3f5f7a', skin: '#f0c7a0', hair: '#c9a24a', hat: 'bandana', hatCol: '#4c7fd8', apron: '#8f8778', pony: true },
    rui: { shirt: '#f4efe2', pants: '#2f3f6a', skin: '#c98e62', hair: '#e8e4dc', hat: 'captain', hatCol: '#3a3046', beard: true, old: true },
    wei: { shirt: '#fbf8f0', pants: '#4a4566', skin: '#efc29a', hair: '#1f1a18', hat: 'chef', apron: '#e2574c', wide: 1.15 },
    yuki: { shirt: '#4c7fd8', pants: '#f4efe2', skin: '#f0c7a0', hair: '#1f1a18', hat: 'sailor', hatCol: '#2f4f8a', scarf: '#e2574c' },
    omar: { shirt: '#c9643f', pants: '#3f3a4a', skin: '#7a4a2e', hair: '#1f1a18', hat: 'beanie', hatCol: '#2f4f8a', band: '#253f70', beard: true, wide: 1.3 },
    tito: { shirt: '#f4efe2', pants: '#3f3a4a', skin: '#e6b48c', hair: '#5a3a24', hat: 'cap', hatCol: '#2f3f6a', mustache: true },
    tere: { shirt: '#f2c94c', pants: '#3f5f7a', skin: '#c98e62', hair: '#5a3a24', hat: 'sailor', hatCol: '#c9433a', pony: true },
    f1: { shirt: '#e58e6b', skirt: '#4c7fd8', skin: '#e6b48c', hair: '#5a3a24', bun: true },
    f2: { shirt: '#5fb257', pants: '#4a4f66', skin: '#a8714a', hair: '#1f1a18', hat: 'sailor', hatCol: '#2f4f8a' },
    f3: { shirt: '#b9a2ff', pants: '#3f3a4a', skin: '#f0c7a0', hair: '#c9a24a', kid: true, pigtails: true },
    f4: { shirt: '#f2c94c', pants: '#6b5a3e', skin: '#7a4a2e', hair: '#2e2420', hat: 'bandana', hatCol: '#e2574c', beard: true },
    f5: { shirt: '#8fc1d9', skirt: '#c9643f', skin: '#efc29a', hair: '#e8e4dc', old: true, bun: true },
    f6: { shirt: '#f4efe2', pants: '#2f4f8a', skin: '#c98e62', hair: '#1f1a18', kid: true, hat: 'cap', hatCol: '#5fb257' },
  };
  const PEOPLE = [
    { id: 'nico', name: 'Nico', pose: 'idle' },
    { id: 'abel', name: 'Abel', pose: 'idle', hushed: true, hushPose: 'sleep' },
    { id: 'dora', name: 'Dora', pose: 'idle' },
    { id: 'greta', name: 'Greta', pose: 'net', hushed: true, hushPose: 'net', ask: 'what_do', y: 0.75 },
    { id: 'rui', name: 'Rui', pose: 'idle', hushed: true, ask: 'from' },
    { id: 'wei', name: 'Wei', pose: 'idle', hushed: true, ask: 'who_has' },
    { id: 'yuki', name: 'Yuki', pose: 'idle', hushed: true, ask: 'where_go', y: 0.75 },
    { id: 'omar', name: 'Omar', pose: 'scared', hushed: true, hushPose: 'scared', ask: 'why_afraid', lift: 1.02 },
    { id: 'tito', name: 'Tito', pose: 'idle', hushed: true },
    { id: 'f1', name: 'Mari', x: -216.4, z: -78.2, yaw: 2.6, folk: true },
    { id: 'f2', name: 'Lalo', x: -190.2, z: -84.4, yaw: -0.4, folk: true },
    { id: 'f3', name: 'Pía', x: -199.0, z: -104.8, yaw: 3.0, folk: true },
    { id: 'f4', name: 'Beto', x: -184.4, z: -68.6, yaw: 0.5, folk: true },
    { id: 'f5', name: 'Rosa', x: -232.8, z: -112.4, yaw: -1.4, folk: true },
    { id: 'f6', name: 'Tavo', x: -213.6, z: -53.2, yaw: 2.2, folk: true },
  ];
  // (ja rōmaji capitalizes these names and places mid-sentence; ミソ is Tere's cat)
  if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['ブリサ', 'アベル', 'ドラ', 'グレタ', 'ルイ', 'ウェイ', 'ユキ', 'オマール', 'ティト', 'テレ', 'ミソ']);

  P.build = function build(scene, opts) {
    const GA = GARDENS, Kit = GA.Kit, GEO = GA.GEO, terrainAt = opts.terrainAt, Y = P.CITY.y, SP = P.SPOT;
    Object.assign(GA.POSES, {
      call: { arms: [[2.05, 0.22], [2.05, 0.22]], headDown: -0.32 }, sleep: { arms: [[0.05, 0.08], [0.05, 0.08]], headDown: 0.6 },
      scared: { arms: [[2.3, 0.55], [2.3, 0.55]], headDown: -0.15 }, net: { arms: [[0.95, 0.12], [1.05, 0.02]], headDown: 0.38 }, wave: { arms: [[0.1, 0.18], [2.9, -0.5]] },
    });
    const group = new THREE.Group(); group.name = 'port'; scene.add(group);
    const colliders = [], platforms = [], moving = [], people = [];
    const R = rng(6066);
    const obox = (x, z, w, d, rot = 0) => colliders.push({ obox: true, x, z, hw: w / 2, hd: d / 2, rot });
    const circ = (x, z, r) => colliders.push({ x, z, r });
    // a long solid in pieces no longer than 6 (world.js's pushOut only looks at solids whose middle is within 9 of you)
    const runX = (x0, x1, z, t) => { const n = Math.max(1, Math.ceil(Math.abs(x1 - x0) / 6)); for (let i = 0; i < n; i++) { const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n; obox((a + b) / 2, z, Math.abs(b - a) + 0.04, t); } };
    const runZ = (z0, z1, x, t) => { const n = Math.max(1, Math.ceil(Math.abs(z1 - z0) / 6)); for (let i = 0; i < n; i++) { const a = z0 + (z1 - z0) * i / n, b = z0 + (z1 - z0) * (i + 1) / n; obox(x, (a + b) / 2, t, Math.abs(b - a) + 0.04); } };
    const k = Kit();          // everything that stays put: one merged mesh, and its ink outline
    const STONE = '#b3a994', STONE_D = '#948b7a', CAP = '#d2c9b4', WOOD = '#8a5a3a', WOOD_D = '#6b4a30';
    const FLOWER = ['#e2574c', '#f2c94c', '#ff8fb1', '#b9a2ff', '#ffffff'], SHUT = ['#3f7f6a', '#4c7fd8', '#7a5a3a', '#c9433a', '#2f6f8a', '#5f8f4a'];

    // ---------------------------------------------------------------- the floor: paving in big panels, the streets lighter, the plaza's tiles, the beach's sand
    const PAVE = '#cdbf9f', STREET = '#ddd1b6';
    k.box(-201, Y + 0.01, -91, 70, 0.06, 54.4, PAVE, { ink: 0 });          // (x −236 … −166, z −118.2 … −63.8)
    k.box(-186, Y + 0.01, -55, 40, 0.06, 18, PAVE, { ink: 0 });            // (the south strip, east of the beach)
    k.box(-201, Y + 0.035, -86.5, 70, 0.04, 9.6, STREET, { ink: 0 });      // the main street
    k.box(-197, Y + 0.035, -104.5, 62, 0.04, 6, STREET, { ink: 0 });       // the north street
    k.box(-197, Y + 0.035, -68, 62, 0.04, 7, STREET, { ink: 0 });          // the south street
    k.box(-232, Y + 0.045, -91, 7.4, 0.04, 54, '#d4c8ae', { ink: 0 });     // the promenade along the quay
    for (let i = 0; i < 5; i++) for (let j = 0; j < 9; j++) if ((i + j) % 2 === 0) k.box(P.PLAZA.x0 + 1.65 + i * 3.3, Y + 0.055, P.PLAZA.zN + 1.66 + j * 3.31, 3.2, 0.03, 3.2, '#e6dcc6', { ink: 0 });
    {
      const g = new THREE.PlaneGeometry(46, 19, 46, 19); g.rotateX(-Math.PI / 2); g.translate(-229, 0, -55);     // x −252 … −206, z −64.5 … −45.5
      const pp = g.attributes.position;
      for (let i = 0; i < pp.count; i++) pp.setY(i, terrainAt(pp.getX(i), pp.getZ(i)) + 0.03);
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, TK.toon('#e9d9a8', { rim: 0 })); m.receiveShadow = true; group.add(m);
    }
    // ---------------------------------------------------------------- the quay: a stone face down into the bay, its coping, bollards
    k.box(P.QUAY - 0.4, (Y - 3.4) / 2, -91.3, 0.8, Y + 3.4, 54.6, STONE, { ink: 0.02 });
    k.box(P.QUAY - 0.25, Y + 0.06, -91.3, 1.1, 0.12, 54.6, CAP, { ink: 0.01 });
    for (let z = -116; z < -65; z += 4.2) if (!P.PIERS.some(p => Math.abs(p.z - z) < 2.4)) k.add(GEO.cyl, P.QUAY + 0.55, Y + 0.28, z, 0.17, 0.56, 0.17, '#4a4566', { ink: 0.012 }).add(GEO.sphere, P.QUAY + 0.55, Y + 0.58, z, 0.19, 0.08, 0.19, '#4a4566', { ink: 0.008 });
    // the piers: planks on posts, out over the water (platforms you walk on)
    for (const pr of P.PIERS) {
      const x0 = P.QUAY + 0.5, len = x0 - pr.x1, cx = (x0 + pr.x1) / 2;
      k.box(cx, 0.66, pr.z, len, 0.18, pr.w, '#a07a52', { ink: 0.02 });
      for (let x = x0 - 0.6; x > pr.x1; x -= 1.1) k.box(x, 0.755, pr.z, 0.06, 0.012, pr.w - 0.1, '#7a5a3a', { ink: 0 });
      for (let x = x0 - 1; x >= pr.x1 + 0.2; x -= 2.6) for (const s of [-1, 1]) k.add(GEO.cyl, x, -1.25, pr.z + s * (pr.w / 2 - 0.1), 0.13, 4.0, 0.13, WOOD_D, { ink: 0.01 });
      for (const s of [-1, 1]) k.add(GEO.cyl, pr.x1 + 0.3, 0.95, pr.z + s * (pr.w / 2 - 0.15), 0.15, 0.6, 0.15, WOOD_D, { ink: 0.01 });
      platforms.push({ seg: [x0 + 0.4, pr.z, pr.x1, pr.z], w: pr.w, y: [0.75, 0.75] });
    }
    { const D = P.FORT_DOCK, cx = (D.xa + D.xb) / 2, len = D.xb - D.xa;
      k.box(cx, 0.66, D.z, len, 0.18, D.w, '#a07a52', { ink: 0.02 });
      for (const x of [D.xa + 0.3, D.xb - 0.3]) for (const s of [-1, 1]) k.add(GEO.cyl, x, -1.25, D.z + s * (D.w / 2 - 0.1), 0.13, 4, 0.13, WOOD_D, { ink: 0.01 });
      platforms.push({ seg: [D.xa - 1.2, D.z, D.xb, D.z], w: D.w, y: [0.75, 0.75] }); }

    // ---------------------------------------------------------------- the walls: stone, coping and merlons on top, towers at the corners and the gate
    const W = P.WALL, top = Y + W.h;
    const wallBox = (cx, cz, lx, lz) => { k.box(cx, (top - 3.2) / 2, cz, lx, top + 3.2, lz, STONE, { ink: 0.02 }); k.box(cx, top + 0.06, cz, lx + (lx > lz ? 0 : 0.24), 0.12, lz + (lx > lz ? 0.24 : 0), CAP, { ink: 0.01 }); };
    for (const w of P.WALLS) {
      if (w.axis === 'x') { wallBox((w.x0 + w.x1) / 2, w.z, w.x1 - w.x0, W.t); for (let x = w.x0 + 0.7; x < w.x1 - 0.5; x += 1.7) k.box(x, top + 0.48, w.z, 0.85, 0.72, W.t, STONE, { ink: 0.012 }); runX(w.x0, w.x1, w.z, W.t); }
      else { const z0 = Math.min(w.z0, w.z1), z1 = Math.max(w.z0, w.z1); wallBox(w.x, (z0 + z1) / 2, W.t, z1 - z0); for (let z = z0 + 0.7; z < z1 - 0.5; z += 1.7) k.box(w.x, top + 0.48, z, W.t, 0.72, 0.85, STONE, { ink: 0.012 }); runZ(z0, z1, w.x, W.t); }
    }
    for (const t of P.TOWERS) {
      const h = top + (t.gate ? 2.6 : 2.0);
      k.add(GEO.cyl, t.x, (h - 3.2) / 2, t.z, t.r, h + 3.2, t.r, STONE_D, { ink: 0.02 }).add(GEO.cyl, t.x, h + 0.1, t.z, t.r + 0.2, 0.2, t.r + 0.2, CAP, { ink: 0.01 });
      if (t.gate) k.add(GEO.cone, t.x, h + 1.0, t.z, t.r + 0.35, 1.8, t.r + 0.35, '#c9643f', { ink: 0.02 });
      else for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; k.box(t.x + Math.cos(a) * (t.r - 0.1), h + 0.55, t.z + Math.sin(a) * (t.r - 0.1), 0.7, 0.7, 0.5, STONE_D, { ry: -a, ink: 0.01 }); }
      circ(t.x, t.z, t.r + 0.1);
    }
    { const x = W.sEnd, z = W.zS; k.add(GEO.cyl, x, (top - 3.2) / 2, z, 1.7, top + 3.2, 1.7, STONE_D, { ink: 0.02 }); circ(x, z, 1.8); }     // (the breakwater's end; the north wall stops at its corner tower)
    // the gate: a lintel over the opening, the raised portcullis's teeth, a blue board with a white gull
    const G0 = P.GATE;
    k.box(W.x, Y + 3.55, G0.z, W.t + 0.25, 1.9, G0.w + 0.3, STONE, { ink: 0.02 });
    for (let i = 0; i < 6; i++) k.box(W.x - 0.45, Y + 2.7, G0.z - G0.w / 2 + 0.4 + i * 0.72, 0.08, 0.5, 0.08, '#3a3046', { ink: 0 });
    k.box(W.x + 0.74, Y + 3.5, G0.z, 0.08, 0.9, 2.2, '#4f8fb5', { ink: 0.012 }).add(GEO.sphere, W.x + 0.8, Y + 3.5, G0.z, 0.05, 0.2, 0.44, '#ffffff', { ink: 0.006 });
    // the moat's stone kerbs
    const MO = P.MOAT;
    for (const x of [MO.x0 - 0.25, MO.x1 + 0.25]) for (const [z0, z1] of [[MO.zN, G0.z - 1.9], [G0.z + 1.9, MO.zS]]) k.box(x, 0.25, (z0 + z1) / 2, 0.5, 0.7, z1 - z0, STONE, { ink: 0.012 });
    for (const z of [MO.zN - 0.25, MO.zS + 0.25]) k.box((MO.x0 + MO.x1) / 2, 0.25, z, MO.x1 - MO.x0 + 1, 0.7, 0.5, STONE, { ink: 0.012 });
    // the drawbridge: hinged at the gate, raised until Abel lowers it (its walkway is a platform that's only there when it's down)
    const bridgeG = new THREE.Group(); bridgeG.position.set(P.BRIDGE.xb, Y + 0.08, P.BRIDGE.z); group.add(bridgeG);
    { const kb = Kit(), L = P.BRIDGE.xa - P.BRIDGE.xb;
      kb.box(L / 2, 0, 0, L, 0.22, P.BRIDGE.w, WOOD, { ink: 0.02 });
      for (let x = 0.5; x < L; x += 0.9) kb.box(x, 0.115, 0, 0.06, 0.01, P.BRIDGE.w - 0.1, WOOD_D, { ink: 0 });
      for (const s of [-1, 1]) kb.box(L / 2, 0.2, s * (P.BRIDGE.w / 2 - 0.1), L, 0.16, 0.16, '#5a3a24', { ink: 0.01 });
      kb.build(bridgeG); }
    const bridgePlat = { seg: [P.BRIDGE.xa + 0.3, P.BRIDGE.z, P.BRIDGE.xb - 0.4, P.BRIDGE.z], w: P.BRIDGE.w, y: [-30, -30] };
    platforms.push(bridgePlat);
    const BR = { k: 0, goal: 0 };        // k: 1 down (flat across the moat), 0 up
    // Abel's booth just inside the gate, and the ticket booth on the promenade (an open stand: Tito behind its counter)
    { const b = SP.booth; k.at(b.x, Y, b.z, 0);
      k.box(0, 1.3, 0, 2.4, 2.6, 2.4, '#c9b48e', { ink: 0.02 }).add(GEO.prism, 0, 2.6, 0, 2.7, 0.9, 2.7, '#a8533f', { ry: Math.PI / 2, ink: 0.02 });
      k.box(1.22, 1.5, 0, 0.06, 0.8, 1.2, '#3a4a66', { ink: 0.008 }).box(0, 1.0, 1.22, 0.9, 1.9, 0.06, WOOD_D, { ink: 0.01 });
      k.box(1.35, 0.3, 2.2, 0.5, 0.6, 0.5, WOOD, { ink: 0.01 });
      k.free(); obox(b.x, b.z, 2.4, 2.4); }
    { const b = SP.kiosk; k.at(b.x, Y, b.z, 0);
      k.box(0, 1.3, -1.05, 2.6, 2.6, 0.12, '#4f8fb5', { ink: 0.015 });
      for (const s of [-1, 1]) k.box(s * 1.24, 0.6, 0, 0.12, 1.2, 2.2, '#4f8fb5', { ink: 0.012 }).add(GEO.cyl6, s * 1.24, 1.9, 1.0, 0.06, 1.4, 0.06, '#f4efe2', { ink: 0.008 });
      k.box(0, 0.55, 1.0, 2.5, 1.1, 0.2, '#3f7aa0', { ink: 0.015 }).box(0, 1.14, 1.05, 2.7, 0.08, 0.5, '#f4efe2', { ink: 0.01 });
      k.box(0, 2.66, 0, 3.0, 0.14, 2.6, '#f4efe2', { ink: 0.012 });
      k.box(0, 3.05, 0.9, 2.0, 0.6, 0.08, '#f2c94c', { ink: 0.012 }).box(-0.5, 3.05, 0.95, 0.55, 0.3, 0.02, '#e2574c', { ink: 0 }).box(0.38, 3.05, 0.95, 0.75, 0.07, 0.02, INK, { ink: 0 });
      k.free(); obox(b.x, b.z + 1.0, 2.6, 0.3); obox(b.x, b.z - 1.05, 2.6, 0.2); obox(b.x - 1.24, b.z, 0.2, 2.2); obox(b.x + 1.24, b.z, 0.2, 2.2); }

    // ---------------------------------------------------------------- the houses: pastel walls, shutters, balconies with flowers, tiled or flat roofs
    function facade(w, d, floors, side, shut, r, shop) {      // side: +1 the +z face, −1 the −z face
      const z = side * (d / 2), n = Math.max(1, Math.floor(w / 1.75)), door = Math.floor(r() * n);
      for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) {
        const x = -w / 2 + (i + 0.5) * (w / n), y = 1.35 + f * 2.5;
        if (f === 0 && i === door) { k.box(x, 1.05, z + side * 0.04, 0.95, 2.0, 0.08, dk(shut, 0.8), { ink: 0.01 }).box(x, 2.12, z + side * 0.05, 1.15, 0.14, 0.1, '#f6f1e6', { ink: 0 }); continue; }
        if (f === 0 && shop) { k.box(x, 1.0, z + side * 0.04, 1.3, 1.5, 0.06, '#2f3f5a', { ink: 0.01 }); continue; }
        k.box(x, y, z + side * 0.035, 0.68, 1.0, 0.06, '#33415e', { ink: 0.008 });
        for (const s of [-1, 1]) k.box(x + s * 0.5, y, z + side * 0.06, 0.3, 1.04, 0.05, shut, { ink: 0.006 });
        if (f > 0 && r() < 0.33) {
          k.box(x, y - 0.6, z + side * 0.3, 1.2, 0.08, 0.6, '#d8cfbf', { ink: 0.008 }).box(x, y - 0.33, z + side * 0.58, 1.2, 0.48, 0.035, INK, { ink: 0 });
          k.add(GEO.cyl, x + 0.35, y - 0.46, z + side * 0.4, 0.12, 0.2, 0.12, '#c9643f', { ink: 0.005 }).add(GEO.sphere, x + 0.35, y - 0.3, z + side * 0.4, 0.17, 0.12, 0.17, FLOWER[Math.floor(r() * 5)], { ink: 0.004 });
        } else if (r() < 0.3) k.box(x, y - 0.56, z + side * 0.16, 0.8, 0.16, 0.24, '#7a5a3a', { ink: 0.005 }).add(GEO.sphere, x, y - 0.42, z + side * 0.17, 0.32, 0.1, 0.1, FLOWER[Math.floor(r() * 5)], { ink: 0 });
      }
      if (shop) k.box(0, 2.35, z + side * 0.55, w - 0.3, 0.07, 1.1, ['#e2574c', '#4c7fd8', '#5fb257', '#f2c94c'][Math.floor(r() * 4)], { rx: side * 0.28, ink: 0.01 });
    }
    function house(b) {
      const r = rng(b.seed || 9), w = b.w, d = b.d, H = b.floors * 2.5 + 0.4, shut = SHUT[Math.floor(r() * SHUT.length)];
      k.at(b.x, Y, b.z, b.rot || 0);
      k.box(0, H / 2, 0, w, H, d, b.col, { ink: 0.025 }).box(0, 0.22, 0, w + 0.05, 0.44, d + 0.05, dk(b.col, 0.78), { ink: 0 }).box(0, H + 0.08, 0, w + 0.16, 0.16, d + 0.16, lt(b.col, 0.35), { ink: 0.012 });
      if (b.roof === 'tile') {
        const a = 0.42, rise = Math.tan(a) * (d / 2 + 0.3);
        for (const s of [-1, 1]) k.box(0, H + 0.18 + rise / 2, s * (d / 4 + 0.15), w + 0.36, 0.16, (d / 2 + 0.45) / Math.cos(a), s < 0 ? b.roofCol : dk(b.roofCol, 0.9), { rx: s * a, ink: 0.022 });
        k.add(GEO.prism, 0, H + 0.16, 0, d + 0.02, rise, w - 0.04, b.col, { ry: Math.PI / 2, ink: 0 });
        if (r() < 0.5) k.box(w * 0.25, H + rise + 0.4, -d * 0.12, 0.45, 0.9, 0.45, '#c9b8a0', { ink: 0.015 });
      } else {
        for (const s of [-1, 1]) { k.box(0, H + 0.42, s * (d / 2 - 0.08), w + 0.16, 0.5, 0.16, b.col, { ink: 0.012 }); k.box(s * (w / 2 - 0.08), H + 0.42, 0, 0.16, 0.5, d, b.col, { ink: 0.012 }); }
        if (r() < 0.5) k.add(GEO.cyl, -w * 0.2, H + 0.75, d * 0.1, 0.45, 0.9, 0.45, '#e8e0cf', { ink: 0.012 });
        else { for (const s of [-1, 1]) k.add(GEO.cyl6, s * w * 0.3, H + 0.9, 0, 0.03, 1.4, 0.03, WOOD_D, { ink: 0 }); for (let i = 0; i < 4; i++) k.box(-w * 0.3 + (i + 0.5) * w * 0.15, H + 1.3, 0, 0.45, 0.55, 0.03, FLOWER[(i + 2) % 5], { ink: 0.004 }); }
      }
      const shopS = b.face === 'both' && Math.abs(b.z + 96.4) < 0.5, shopN = b.face === 'both' && Math.abs(b.z + 76.6) < 0.5;     // (the main street's side: shops with awnings)
      if (b.face === 's' || b.face === 'both') facade(w, d, b.floors, 1, shut, r, shopS && r() < 0.6);
      if (b.face === 'n' || b.face === 'both') facade(w, d, b.floors, -1, shut, r, shopN && r() < 0.6);
      k.free();
      obox(b.x, b.z, w, d, b.rot || 0);
    }
    // the harbor master's office: three floors, white and blue, an anchor, a balcony, the flag on the roof (it faces the quay, west)
    function capitania(b) {
      const H = 7.9, w = b.w, d = b.d;
      k.at(b.x, Y, b.z, 0);
      k.box(0, H / 2, 0, w, H, d, b.col, { ink: 0.025 }).box(0, 0.22, 0, w + 0.05, 0.44, d + 0.05, '#9fb3c9', { ink: 0 }).box(0, H + 0.1, 0, w + 0.3, 0.2, d + 0.3, '#2f4f8a', { ink: 0.014 });
      for (let f = 0; f < 3; f++) for (let i = 0; i < 4; i++) {
        const z = -d / 2 + (i + 0.5) * d / 4, y = 1.35 + f * 2.5;
        if (f === 0 && i === 2) { k.box(-w / 2 - 0.04, 1.1, z, 0.08, 2.1, 1.2, '#2f4f8a', { ink: 0.01 }); continue; }
        k.box(-w / 2 - 0.03, y, z, 0.06, 1.0, 0.7, '#33415e', { ink: 0.008 });
        for (const s of [-1, 1]) k.box(-w / 2 - 0.05, y, z + s * 0.52, 0.05, 1.04, 0.3, '#2f4f8a', { ink: 0.006 });
      }
      k.box(-w / 2 - 0.35, 5.0, 0, 0.6, 0.1, 3.2, '#e8e0cf', { ink: 0.01 }).box(-w / 2 - 0.62, 5.3, 0, 0.04, 0.5, 3.2, INK, { ink: 0 });
      k.add(GEO.cyl, -w / 2 - 0.08, 3.75, -1.25, 0.42, 0.06, 0.42, '#f4efe2', { rz: Math.PI / 2, ink: 0.01 }).box(-w / 2 - 0.14, 3.8, -1.25, 0.03, 0.5, 0.08, '#2f4f8a', { ink: 0 }).box(-w / 2 - 0.14, 3.62, -1.25, 0.03, 0.08, 0.36, '#2f4f8a', { ink: 0 });
      k.add(GEO.cyl6, 0, H + 2.0, 0, 0.06, 4.0, 0.06, '#f4efe2', { ink: 0.008 }).box(0, H + 3.4, 0.75, 0.04, 0.9, 1.4, '#4f8fb5', { ink: 0.008 }).box(0, H + 3.4, 0.75, 0.05, 0.3, 1.4, '#f4efe2', { ink: 0 });
      k.free(); obox(b.x, b.z, w, d);
    }
    // the fish market: an open arcade onto the quay, a marble counter inside with the day's fish
    function lonja(b) {
      const w = b.w, d = b.d, H = 3.6, a = 0.32, rise = Math.tan(a) * (w / 2 + 0.3);
      k.at(b.x, Y, b.z, 0);
      k.box(w / 2 - 0.3, H / 2, 0, 0.6, H, d, b.col, { ink: 0.02 });
      for (const s of [-1, 1]) k.box(0, H / 2, s * (d / 2 - 0.3), w, H, 0.6, b.col, { ink: 0.02 });
      for (let i = 0; i < 4; i++) k.box(-w / 2 + 0.3, H / 2, -d / 2 + 0.3 + i * (d - 0.6) / 3, 0.5, H, 0.5, lt(b.col, 0.2), { ink: 0.015 });
      for (const s of [-1, 1]) k.box(s * (w / 4 + 0.1), H + 0.1 + rise / 2, 0, (w / 2 + 0.5) / Math.cos(a), 0.16, d + 0.4, s < 0 ? b.roofCol : dk(b.roofCol, 0.9), { rz: -s * a, ink: 0.02 });
      k.add(GEO.prism, 0, H + 0.08, 0, w + 0.02, rise, d - 0.04, b.col, { ink: 0 });
      k.box(0.6, 0.5, 0, 1.2, 1.0, d - 2, '#e8e4dc', { ink: 0.012 });
      for (let i = 0; i < 5; i++) { const z = -d / 2 + 1.6 + i * (d - 3.2) / 4; k.box(0.6, 1.05, z, 0.9, 0.12, 1.2, '#8fc1d9', { ink: 0.006 }); for (let j = 0; j < 3; j++) k.add(GEO.sphere, 0.45 + j * 0.15, 1.15, z - 0.3 + j * 0.3, 0.32, 0.08, 0.1, '#c9d3dc', { ry: 0.3 * j, ink: 0.004 }); }
      k.box(-w / 2 - 0.05, H - 0.2, 0, 0.08, 0.6, 3.2, '#3f8fb5', { ink: 0.01 });
      k.free();
      obox(b.x + w / 2 - 0.3, b.z, 0.6, d); for (const s of [-1, 1]) obox(b.x, b.z + s * (d / 2 - 0.3), w, 0.6); obox(b.x + 0.6, b.z, 1.2, d - 2);
      for (let i = 0; i < 4; i++) circ(b.x - w / 2 + 0.3, b.z - d / 2 + 0.3 + i * (d - 0.6) / 3, 0.35);
    }
    // the customs house: a porch of columns onto the south street, and a little copper dome
    function aduana(b) {
      const w = b.w, d = b.d, H = 5.6;
      k.at(b.x, Y, b.z, 0);
      k.box(0, H / 2, 0, w, H, d, b.col, { ink: 0.025 }).box(0, 0.25, 0, w + 0.1, 0.5, d + 0.1, '#c9b48e', { ink: 0 }).box(0, H + 0.15, 0, w + 0.4, 0.3, d + 0.4, '#e8dcc0', { ink: 0.014 });
      for (let i = 0; i < 4; i++) k.add(GEO.cyl, -2.4 + i * 1.6, 1.9, -d / 2 - 0.6, 0.24, 3.4, 0.24, '#f6efe0', { ink: 0.012 });
      k.box(0, 3.75, -d / 2 - 0.6, 6.0, 0.4, 1.6, '#e8dcc0', { ink: 0.014 }).add(GEO.prism, 0, 3.95, -d / 2 - 0.6, 6.2, 0.9, 1.5, '#e8dcc0', { ink: 0.012 });
      k.box(0, 1.15, -d / 2 - 0.02, 1.4, 2.2, 0.06, WOOD_D, { ink: 0.01 });
      for (const s of [-1, 1]) for (let f = 0; f < 2; f++) for (let i = 0; i < 2; i++) k.box(s * (3.4 + i * 1.8), 1.5 + f * 2.5, -d / 2 - 0.03, 0.8, 1.2, 0.06, '#33415e', { ink: 0.008 });
      k.add(GEO.cyl, 0, H + 0.6, 0, 2.0, 0.8, 2.0, b.col, { ink: 0.015 }).add(GEO.half, 0, H + 1.0, 0, 2.0, 1.6, 2.0, '#6f9fb8', { ink: 0.02 }).add(GEO.sphere, 0, H + 2.75, 0, 0.18, 0.18, 0.18, '#e6b84a', { ink: 0.01 });
      k.free(); obox(b.x, b.z, w, d); for (let i = 0; i < 4; i++) circ(b.x - 2.4 + i * 1.6, b.z - d / 2 - 0.6, 0.3);
    }
    // the warehouses by the south wall: big doors, crates outside
    function store(b) {
      const w = b.w, d = b.d, H = 5.2, a = 0.38, rise = Math.tan(a) * (d / 2 + 0.3);
      k.at(b.x, Y, b.z, 0);
      k.box(0, H / 2, 0, w, H, d, b.col, { ink: 0.025 }).box(0, 0.22, 0, w + 0.05, 0.44, d + 0.05, dk(b.col, 0.75), { ink: 0 });
      for (const s of [-1, 1]) k.box(0, H + 0.15 + rise / 2, s * (d / 4 + 0.15), w + 0.4, 0.16, (d / 2 + 0.45) / Math.cos(a), s < 0 ? b.roofCol : dk(b.roofCol, 0.9), { rx: s * a, ink: 0.022 });
      k.add(GEO.prism, 0, H + 0.14, 0, d + 0.02, rise, w - 0.04, b.col, { ry: Math.PI / 2, ink: 0 });
      k.box(0, 1.6, -d / 2 - 0.04, w * 0.45, 3.2, 0.08, '#7a5a3a', { ink: 0.012 }).box(0, 1.6, -d / 2 - 0.08, 0.06, 3.2, 0.04, '#5a3a24', { ink: 0 }).box(0, 4.0, -d / 2 - 0.05, w * 0.6, 0.5, 0.08, '#f4efe2', { ink: 0.01 });
      k.free(); obox(b.x, b.z, w, d);
      for (let i = 0; i < 3; i++) k.box(b.x - w / 2 + 1 + i * 1.1, Y + 0.45, b.z - d / 2 - 1.0, 0.9, 0.9, 0.9, '#b8955a', { ry: i * 0.3, ink: 0.012 });
      obox(b.x - w / 2 + 2.1, b.z - d / 2 - 1.0, 3.4, 1.0);
    }
    for (const b of P.BUILDINGS) { if (b.kind === 'house') house(b); else if (b.kind === 'capitania') capitania(b); else if (b.kind === 'lonja') lonja(b); else if (b.kind === 'aduana') aduana(b); else if (b.kind === 'store') store(b); }
    // laundry strung across the north street
    for (const x of [-189.6, -185.2, -175.8, -173.6]) { k.rod(GEO.cyl6, [x, Y + 5.6, -107.4], [x + 0.6, Y + 5.6, -101.6], 0.018, '#f4efe2', 0); for (let i = 0; i < 4; i++) k.box(x + 0.1 + i * 0.13, Y + 5.2, -106.6 + i * 1.3, 0.04, 0.7, 0.9, FLOWER[(i + Math.round(-x)) % 5], { ink: 0.004 }); }
    // street lamps along the main street and the promenade
    const lamp = (x, z) => { k.add(GEO.cyl6, x, Y + 1.6, z, 0.07, 3.2, 0.07, '#3a3046', { ink: 0.008 }).box(x, Y + 3.3, z, 0.36, 0.4, 0.36, '#3a3046', { ink: 0.008 }).add(GEO.sphere, x, Y + 3.28, z, 0.15, 0.17, 0.15, '#ffe9a8', { ink: 0 }); circ(x, z, 0.18); };
    for (let x = -204; x < -173; x += 9) { lamp(x, -90.9); lamp(x + 4.5, -82.1); }
    for (let z = -114; z < -64; z += 9) lamp(-228.6, z);

    // ---------------------------------------------------------------- the plaza: a fountain, palms, market stalls, benches, Wei's soup cart
    function palm(x, z) {
      const lean = R() * 0.3 - 0.15, h = 4.2 + R() * 0.8;
      let px = x, py = Y, pz = z;
      for (let i = 0; i < 5; i++) { const nx = x + Math.sin(lean) * (i + 1) * h / 5 * 0.3, ny = Y + (i + 1) * h / 5; k.rod(GEO.cyl6, [px, py, pz], [nx, ny, pz], 0.16 - i * 0.015, i % 2 ? '#8a6440' : '#9a7450', 0.01); px = nx; py = ny; }
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; k.add(GEO.sphere, px + Math.cos(a) * 0.9, py - 0.15, pz + Math.sin(a) * 0.9, 1.0, 0.09, 0.3, i % 2 ? '#4f9a45' : '#5fae4f', { ry: -a, rz: 0.35, ink: 0.008 }); }
      circ(x, z, 0.35);
    }
    function stall(x, z, col, goods) {
      k.box(x, Y + 0.45, z, 2.4, 0.9, 1.2, '#a07a52', { ink: 0.015 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.add(GEO.cyl6, x + sx * 1.15, Y + 1.25, z + sz * 0.55, 0.05, 2.5, 0.05, WOOD_D, { ink: 0.006 });
      for (let i = 0; i < 5; i++) k.box(x - 1.2 + (i + 0.5) * 0.48, Y + 2.55, z, 0.48, 0.08, 1.6, i % 2 ? '#fffaf0' : col, { rx: 0.12, ink: 0.006 });
      const C = goods === 'fruit' ? ['#f29a3a', '#e2574c', '#f2c94c', '#5fb257'] : goods === 'fish' ? ['#c9d3dc', '#aab6c2'] : ['#f4e3d0', '#ff8fb1', '#f2c94c'];
      for (let i = 0; i < 8; i++) k.add(GEO.sphere, x - 0.9 + (i % 4) * 0.6, Y + 0.98, z - 0.25 + Math.floor(i / 4) * 0.5, goods === 'fish' ? 0.26 : 0.16, 0.12, goods === 'fish' ? 0.09 : 0.16, C[i % C.length], { ink: 0.004 });
      obox(x, z, 2.4, 1.2);
    }
    function bench(x, z, ry) {
      k.at(x, Y, z, ry); k.box(0, 0.45, 0, 1.8, 0.1, 0.5, WOOD, { ink: 0.01 }).box(0, 0.75, -0.22, 1.8, 0.4, 0.08, WOOD, { ink: 0.01 }); for (const s of [-1, 1]) k.box(s * 0.75, 0.22, 0, 0.1, 0.45, 0.45, '#3a3046', { ink: 0 }); k.free();
      const along = Math.abs(Math.cos(ry)) > 0.5; obox(x, z, along ? 1.8 : 0.5, along ? 0.5 : 1.8);
    }
    function soupCart(x, z) {
      k.box(x, Y + 0.7, z, 1.8, 0.8, 1.0, '#c9433a', { ink: 0.015 }).box(x, Y + 1.12, z, 1.9, 0.06, 1.1, '#f4efe2', { ink: 0.008 });
      for (const s of [-1, 1]) k.add(GEO.cyl, x + s * 0.6, Y + 0.3, z + 0.55, 0.3, 0.08, 0.3, '#3a3046', { rx: Math.PI / 2, ink: 0.006 });
      k.add(GEO.cyl, x - 0.3, Y + 1.35, z, 0.35, 0.42, 0.35, '#8f8c9a', { ink: 0.01 }).add(GEO.cyl, x - 0.3, Y + 1.57, z, 0.38, 0.04, 0.38, '#6f6c7a', { ink: 0 });
      k.add(GEO.cyl6, x + 0.75, Y + 2.0, z - 0.4, 0.04, 2.0, 0.04, WOOD_D, { ink: 0 }).box(x + 0.75, Y + 2.9, z - 0.4, 0.06, 0.5, 0.9, '#f2c94c', { ink: 0.008 });
      obox(x, z, 1.9, 1.1);
    }
    { const F = P.PLAZA;
      k.add(GEO.cyl, F.x, Y + 0.3, F.z, 2.4, 0.6, 2.4, STONE, { ink: 0.02 }).add(GEO.cyl, F.x, Y + 0.56, F.z, 2.15, 0.06, 2.15, '#6fbcd6', { ink: 0 });
      k.add(GEO.cyl, F.x, Y + 1.1, F.z, 0.32, 1.6, 0.32, STONE, { ink: 0.012 }).add(GEO.cyl, F.x, Y + 1.85, F.z, 0.95, 0.18, 0.95, STONE, { ink: 0.012 }).add(GEO.sphere, F.x, Y + 2.2, F.z, 0.3, 0.26, 0.4, '#f4efe2', { ink: 0.01 });
      circ(F.x, F.z, 2.5);
      for (const [x, z] of [[-220.4, -98.6], [-208.2, -96.4], [-220.4, -74.4], [-208.2, -74.4]]) palm(x, z);
      stall(-219.2, -80.2, '#e2574c', 'fruit'); stall(-209.4, -79.6, '#4c7fd8', 'fish'); stall(-219.2, -93.0, '#5fb257', 'shells');
      bench(-214.2, -96.6, 0); bench(-214.2, -76.4, Math.PI); bench(-216.6, -73.4, Math.PI);
      soupCart(SP.wei.x, SP.wei.z + 1.25);
    }
    // ---------------------------------------------------------------- the promenade: barrels, crates, rope, life rings, Rui's bench, Greta's nets drying
    for (const [x, z] of [[-233.6, -110.4], [-234.4, -101.8], [-233.2, -79.6], [-234.6, -66.4]]) { k.add(GEO.cyl, x, Y + 0.5, z, 0.42, 1.0, 0.42, WOOD, { ink: 0.015 }).add(GEO.cyl, x, Y + 0.5, z, 0.44, 0.08, 0.44, '#3a3046', { ink: 0 }); circ(x, z, 0.45); }
    for (const [x, z] of [[-233.8, -99.4], [-232.8, -68.2]]) { k.box(x, Y + 0.45, z, 0.9, 0.9, 0.9, '#b8955a', { ry: 0.3, ink: 0.012 }); obox(x, z, 1.0, 1.0, 0.3); }
    for (const z of [-104.2, -84.0, -73.2]) k.add(GEO.cyl, -235.3, Y + 0.08, z, 0.36, 0.16, 0.36, '#c9b48e', { ink: 0.006 });
    for (const z of [-108.6, -89.2, -69.0]) { k.add(GEO.cyl6, -235.7, Y + 0.7, z, 0.05, 1.4, 0.05, WOOD_D, { ink: 0 }); for (let i = 0; i < 8; i++) k.add(GEO.sphere, -235.7, Y + 1.2 + Math.sin(i * Math.PI / 4) * 0.32, z + Math.cos(i * Math.PI / 4) * 0.32, 0.1, 0.1, 0.1, i % 2 ? '#e2574c' : '#fffaf0', { ink: 0 }); }
    bench(SP.rui.x + 1.0, SP.rui.z, -Math.PI / 2);
    { const x = -233.6, z = -112.6;
      k.add(GEO.cyl6, x, Y + 1.0, z - 1.2, 0.05, 2.0, 0.05, WOOD_D, { ink: 0 }).add(GEO.cyl6, x, Y + 1.0, z + 1.2, 0.05, 2.0, 0.05, WOOD_D, { ink: 0 }).add(GEO.cyl6, x, Y + 2.0, z, 0.04, 2.5, 0.04, WOOD_D, { rx: Math.PI / 2, ink: 0 });
      k.box(x, Y + 1.3, z, 0.04, 1.4, 2.3, '#8f9c8a', { ink: 0.004 }); obox(x, z, 0.3, 2.5); }
    k.box(-246.6, 0.95, -105.0, 0.8, 0.4, 0.6, '#b8955a', { ink: 0.01 }).box(-245.2, 0.84, -105.1, 1.2, 0.18, 0.8, '#8f9c8a', { ink: 0.004 });     // Greta's crate and her net
    // ---------------------------------------------------------------- the beach: Omar's tower of crates, a rowboat up on the sand, an umbrella, shells
    function rowboat(x, z, ry, y, col = '#4c7fd8') {
      k.at(x, y, z, ry);
      k.box(0, 0.2, 0, 2.6, 0.4, 1.0, col, { ink: 0.015 }).add(GEO.cone, 1.55, 0.2, 0, 0.5, 0.6, 0.35, col, { rz: -Math.PI / 2, ink: 0.012 });
      k.box(0, 0.42, 0, 2.7, 0.06, 1.08, '#f4efe2', { ink: 0.006 }).box(0.2, 0.35, 0, 0.3, 0.06, 0.95, WOOD, { ink: 0 });
      k.free();
    }
    { const o = SP.omar, gy = terrainAt(o.x, o.z);
      k.box(o.x, gy + 0.5, o.z, 1.3, 1.0, 1.2, '#b8955a', { ry: 0.08, ink: 0.015 }).box(o.x + 1.2, gy + 0.42, o.z + 0.6, 0.9, 0.84, 0.9, '#c9a46a', { ry: -0.2, ink: 0.012 });
      obox(o.x, o.z, 1.4, 1.3, 0.08); obox(o.x + 1.2, o.z + 0.6, 1.0, 1.0, -0.2);
      rowboat(-224.6, -51.8, 0.6, terrainAt(-224.6, -51.8) + 0.05, '#e2574c'); obox(-224.6, -51.8, 2.8, 1.1, 0.6);
      const ux = -216, uz = -52.5, uy = terrainAt(ux, uz);
      k.add(GEO.cyl6, ux, uy + 1.2, uz, 0.04, 2.4, 0.04, '#f4efe2', { ink: 0 }).add(GEO.cone, ux, uy + 2.3, uz, 1.3, 0.5, 1.3, '#e2574c', { ink: 0.012 }).add(GEO.sphere, ux, uy + 2.58, uz, 0.08, 0.08, 0.08, '#fffaf0', { ink: 0 });
      for (let i = 0; i < 16; i++) { const x = -234 + R() * 26, z = -62 + R() * 15, y = terrainAt(x, z); if (y < -0.3) continue; k.add(GEO.sphere, x, y + 0.05, z, 0.12, 0.06, 0.1, R() < 0.5 ? '#f4e3d0' : '#ff8fb1', { ry: R() * 6, ink: 0.004 }); }
    }
    // boats at anchor in the bay
    for (const [x, z, ry, c] of [[-252.4, -99.6, 0.4, '#4c7fd8'], [-259.6, -77.4, -0.3, '#f2c94c'], [-247.6, -113.2, 1.1, '#5fb257'], [-243.4, -94.6, 0.2, '#e2574c']]) rowboat(x, z, ry, P.CITY.y - 1.18, c);
    // the big ship at the long pier («El Viento Sur»: the boat to the far coasts; region 7 sails it)
    { const s = SP.ship; k.at(s.x, -0.2, s.z, 0);
      k.box(0, 0.5, 0, 12, 1.6, 3.6, '#2f3f5a', { ink: 0.025 }).box(0, 1.35, 0, 12.2, 0.1, 3.7, '#e8e0cf', { ink: 0.01 }).box(0, -0.1, 0, 11.6, 0.4, 3.3, '#a8332c', { ink: 0.01 });
      k.add(GEO.cone, -7.1, 0.6, 0, 1.6, 2.2, 0.95, '#2f3f5a', { rz: Math.PI / 2, ink: 0.02 });
      k.box(4.2, 2.2, 0, 3.0, 1.6, 2.6, '#f4efe2', { ink: 0.015 }).box(4.2, 3.05, 0, 3.3, 0.12, 2.9, '#a8533f', { ink: 0.01 });
      for (const [x, h] of [[-2.8, 7.5], [1.2, 6.2]]) { k.add(GEO.cyl6, x, 1.4 + h / 2, 0, 0.12, h, 0.12, WOOD_D, { ink: 0.01 }); for (const yy of [0.55, 0.85]) k.add(GEO.cyl, x, 1.4 + h * yy, 0, 0.16, 3.4 * (1.2 - yy), 0.16, '#f6f1e6', { rx: Math.PI / 2, ink: 0.01 }); }
      k.box(-5.2, 1.0, 1.83, 3.4, 0.5, 0.05, '#f2c94c', { ink: 0.006 }).box(-5.2, 1.0, -1.83, 3.4, 0.5, 0.05, '#f2c94c', { ink: 0.006 });
      k.free();
      k.box(s.x + 3.2, 1.05, s.z - 2.6, 1.0, 0.08, 2.6, WOOD, { rx: 0.18, ink: 0.01 }); }

    // ---------------------------------------------------------------- the sea fort on its islet: a round curtain wall, the gate (shut), a tower, the harbor bell
    const FT = P.FORT, fy = FT.y + 0.05, FR = 5.2, NS = 18;
    for (let i = 0; i < NS; i++) {
      const a = (i + 0.5) / NS * TAU; if (Math.cos(a) > 0.96) continue;        // (the gate's gap, facing the city)
      const x = FT.x + Math.cos(a) * FR, z = FT.z + Math.sin(a) * FR, ry = -a - Math.PI / 2, seg = TAU * FR / NS + 0.05;
      k.box(x, fy + 1.4, z, seg, 3.6, 0.9, STONE, { ry, ink: 0.02 }).box(x, fy + 3.5, z, seg * 0.45, 0.6, 0.9, STONE, { ry, ink: 0.012 });
      obox(x, z, seg, 0.9, ry);
    }
    for (const s of [-1, 1]) { const a = s * 0.36, x = FT.x + Math.cos(a) * FR, z = FT.z + Math.sin(a) * FR; k.add(GEO.cyl, x, fy + 2.0, z, 0.95, 4.6, 0.95, STONE_D, { ink: 0.02 }).add(GEO.cone, x, fy + 4.9, z, 1.2, 1.3, 1.2, '#4f6f8a', { ink: 0.015 }); circ(x, z, 1.0); }
    k.box(FT.x + FR - 0.05, fy + 1.4, FT.z, 0.3, 2.8, 3.0, WOOD_D, { ink: 0.015 }).box(FT.x + FR + 0.12, fy + 1.4, FT.z, 0.06, 2.8, 0.08, '#3a3046', { ink: 0 });
    for (let i = 0; i < 9; i++) k.rod(GEO.cyl6, [FT.x + FR + 0.2, fy + 2.8 - (i % 3) * 0.3, FT.z - 1.3 + i * 0.32], [FT.x + FR + 0.22, fy + 0.5 + (i % 2) * 0.6, FT.z - 1.1 + i * 0.28], 0.05, i % 2 ? '#7d7a88' : '#6a6878', 0);     // gray seaweed over the gate
    obox(FT.x + FR, FT.z, 0.4, 3.2);
    k.add(GEO.cyl, FT.x, fy + 4.6, FT.z, 2.3, 9.2, 2.3, STONE_D, { ink: 0.025 }).add(GEO.cyl, FT.x, fy + 9.3, FT.z, 2.55, 0.25, 2.55, CAP, { ink: 0.012 });
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; k.add(GEO.cyl6, FT.x + Math.cos(a) * 1.15, fy + 10.3, FT.z + Math.sin(a) * 1.15, 0.09, 1.9, 0.09, CAP, { ink: 0.01 }); }
    k.add(GEO.cone, FT.x, fy + 11.75, FT.z, 1.75, 1.2, 1.75, '#4f6f8a', { ink: 0.02 }).add(GEO.cyl6, FT.x, fy + 12.7, FT.z, 0.04, 1.0, 0.04, '#3a3046', { ink: 0 }).box(FT.x, fy + 13.0, FT.z + 0.32, 0.03, 0.4, 0.6, '#e2574c', { ink: 0.006 });
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4; k.box(FT.x + Math.cos(a) * 2.32, fy + 3 + i * 2, FT.z + Math.sin(a) * 2.32, 0.08, 0.9, 0.5, '#33415e', { ry: -a, ink: 0.006 }); }
    circ(FT.x, FT.z, 2.4);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + R() * 0.3, r = FT.r - 0.4 + R() * 0.9; if (Math.cos(a) > 0.9) continue; const x = FT.x + Math.cos(a) * r, z = FT.z + Math.sin(a) * r; k.add(GEO.ico, x, terrainAt(x, z) + 0.1, z, 0.6 + R() * 0.5, 0.45 + R() * 0.3, 0.6 + R() * 0.5, R() < 0.5 ? '#a3a196' : '#8f8d84', { ry: R() * 6, ink: 0.015 }); }
    const bellG = new THREE.Group(); bellG.position.set(FT.x, fy + 11.0, FT.z); group.add(bellG);
    const bellMat = new THREE.MeshToonMaterial({ color: '#8f8c9a', gradientMap: TK.grad, side: THREE.DoubleSide });
    { const g = new THREE.LatheGeometry([[0, -0.04], [0.44, -0.06], [0.46, -0.02], [0.36, 0.08], [0.3, 0.25], [0.26, 0.48], [0.16, 0.6], [0, 0.62]].map(([x, y]) => new THREE.Vector2(x * 1.25, y * 1.25)), 18);     // (bottom to top: normals out)
      const m = new THREE.Mesh(g, bellMat); m.position.y = -0.8; bellG.add(m);
      const h = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })); h.scale.setScalar(1.06); h.position.y = -0.83; bellG.add(h); }
    // the sea floor out past the map's edge (the water itself is world3d.js's)
    // (the sea floor is the map's own ground now, carved by P.ground; past the map's edge it's world3d.js's far water)

    // ---------------------------------------------------------------- the fog across the road (until the fifth bell): gray puffs, and a wall you can't walk through
    const fogG = new THREE.Group(); group.add(fogG);
    { const tex = TK.canvasTex(64, 64, c => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(188,186,198,0.95)'); g.addColorStop(1, 'rgba(188,186,198,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(mat); s.position.set(P.FOG.x - 14 + i * 1.9 + (R() - 0.5), 1.3 + R() * 2.4, P.FOG.z + (R() - 0.5) * 3); s.scale.setScalar(4.5 + R() * 3); s.userData.a = R() * 6; fogG.add(s); } }
    const fogWalls = [];
    for (let i = 0; i < 5; i++) { const c = { obox: true, x: P.FOG.x - 12 + i * 6, z: P.FOG.z, hw: 3.05, hd: 1.2, rot: 0 }; c.x0 = c.x; fogWalls.push(c); moving.push(c); }

    // ---------------------------------------------------------------- gulls: a flock wheeling over the harbor (instanced: two draw calls)
    // (their own materials, never TK.toon's shared ones: world3d.js's flowers use toon('#ffffff', { rim: 0.2 }) on an instanced mesh
    // WITH instance colors, and three r128 would reuse that program here, where instanceColor is null: it crashed the first render)
    const gullMat = c => new THREE.MeshToonMaterial({ color: new THREE.Color(c), gradientMap: TK.grad });
    const NG = 16, gBody = new THREE.InstancedMesh(GEO.sphere, gullMat('#ffffff'), NG), gWing = new THREE.InstancedMesh(GEO.box, gullMat('#d9dfe6'), NG * 2);
    gBody.frustumCulled = gWing.frustumCulled = false; group.add(gBody, gWing);
    const gulls = [];
    for (let i = 0; i < NG; i++) { const g = { i, a: R() * TAU, r: 9 + R() * 16, h: 6 + R() * 5, sp: (0.22 + R() * 0.18) * (R() < 0.5 ? 1 : -1), cx: -240 + R() * 12, cz: -90 + R() * 16, yaw: 0, flap: R() * 6, target: null }; g.x = g.cx + Math.cos(g.a) * g.r; g.y = g.h; g.z = g.cz + Math.sin(g.a) * g.r; gulls.push(g); }
    let flockAt = null;
    const _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1);
    function gullsUpdate(dt, t) {
      for (const g of gulls) {
        let tx, ty, tz, speed = 7;
        const T = g.target;
        if (T) { const a = t * 1.7 + g.i * 2.1, rr = T.r || 1.3; tx = T.x + Math.cos(a) * rr; tz = T.z + Math.sin(a) * rr; ty = T.y + Math.sin(t * 3 + g.i) * 0.25; speed = 10; }
        else { g.a += g.sp * dt; tx = g.cx + Math.cos(g.a) * g.r; tz = g.cz + Math.sin(g.a) * g.r; ty = g.h + Math.sin(t * 0.7 + g.i) * 0.6; }
        const dx = tx - g.x, dy = ty - g.y, dz = tz - g.z, d = Math.hypot(dx, dy, dz);
        if (d > 0.01) { const st = Math.min(d, speed * dt * (d > 3 ? 1 : 0.6 + d * 0.13)); g.x += dx / d * st; g.y += dy / d * st; g.z += dz / d * st; if (Math.hypot(dx, dz) > 0.02) g.yaw = dampAngle(g.yaw, Math.atan2(dx, dz), 6, dt); }
        _e.set(0, g.yaw, 0); _q.setFromEuler(_e);
        _m.compose(_p.set(g.x, g.y, g.z), _q, _s.set(0.17, 0.13, 0.3)); gBody.setMatrixAt(g.i, _m);
        const fl = Math.sin(t * (T ? 13 : 7) + g.flap) * 0.6;
        for (const s of [-1, 1]) { _e.set(0, 0, s * (0.15 + fl)); _q2.setFromEuler(_e); _m2.compose(_p.set(s * 0.32, 0.03, 0), _q2, _s.set(0.5, 0.03, 0.2)); _m.compose(_p.set(g.x, g.y, g.z), _q, ONE).multiply(_m2); gWing.setMatrixAt(g.i * 2 + (s > 0 ? 1 : 0), _m); }
      }
      gBody.instanceMatrix.needsUpdate = gWing.instanceMatrix.needsUpdate = true;
    }
    // the flock (all but the first three, which are Nico's) to a spot ({ x, y, z, r }), or back to wheeling (null)
    function gullsTo(spot, n = 10) { flockAt = spot || null; gulls.forEach((g, i) => { if (i >= 3) g.target = spot && i < 3 + n ? { x: spot.x, y: spot.y, z: spot.z, r: (spot.r || 1.2) + (i % 3) * 0.35 } : null; }); }

    // ---------------------------------------------------------------- the fort boat, «La Gaviota», and Tere at its helm
    const boatG = new THREE.Group(); group.add(boatG);
    { const kb = Kit();
      kb.box(0, 0.25, 0, 3.6, 0.7, 1.7, '#f4efe2', { ink: 0.02 }).box(0, 0.62, 0, 3.7, 0.1, 1.78, '#4f8fb5', { ink: 0.01 }).box(0, -0.05, 0, 3.4, 0.25, 1.5, '#4f8fb5', { ink: 0.01 });
      kb.add(GEO.cone, 2.2, 0.25, 0, 0.45, 0.9, 0.84, '#f4efe2', { rz: -Math.PI / 2, ink: 0.015 });
      kb.box(-0.7, 0.95, 0, 1.2, 0.8, 1.2, '#f2c94c', { ink: 0.012 }).box(-0.7, 1.4, 0, 1.4, 0.1, 1.4, '#c9433a', { ink: 0.01 });
      kb.add(GEO.cyl6, 0.6, 2.0, 0, 0.06, 3.0, 0.06, WOOD_D, { ink: 0.008 }).add(GEO.cyl, 0.6, 1.4, 0, 0.12, 1.4, 0.12, '#f6f1e6', { rz: Math.PI / 2, ink: 0.008 });
      kb.box(0.4, 0.42, 0.86, 1.4, 0.3, 0.04, '#2f4f8a', { ink: 0 }).box(0.4, 0.42, -0.86, 1.4, 0.3, 0.04, '#2f4f8a', { ink: 0 });
      kb.build(boatG); }
    const tere = GA.makePerson({ id: 'tere', name: 'Tere', x: 0, z: 0, yaw: 0, look: LOOKS.tere }, boatG, { hushed: true, gray: true, pose: 'hushed' });
    tere.root.position.set(-1.5, 0.55, 0); tere.root.rotation.y = Math.PI / 2;
    const boat = { x: SP.boatFort.x, z: SP.boatFort.z, yaw: 0, mv: null };
    function setBoat(spot, yaw) { boat.x = spot.x; boat.z = spot.z; if (yaw !== undefined) boat.yaw = yaw; if (boat.mv && boat.mv.res) boat.mv.res(); boat.mv = null; }
    function boatTo(spot, dur = 4) { return new Promise(res => { if (boat.mv && boat.mv.res) boat.mv.res(); boat.mv = { x0: boat.x, z0: boat.z, x1: spot.x, z1: spot.z, t: 0, dur, res }; }); }
    function boatUpdate(dt, t) {
      const m = boat.mv;
      if (m) {
        m.t = Math.min(1, m.t + dt / m.dur); const e = m.t * m.t * (3 - 2 * m.t);
        boat.x = P.mix(m.x0, m.x1, e); boat.z = P.mix(m.z0, m.z1, e);
        const dx = m.x1 - m.x0, dz = m.z1 - m.z0; if (Math.hypot(dx, dz) > 0.1) boat.yaw = dampAngle(boat.yaw, Math.atan2(-dz, dx), 3, dt);
        if (m.t >= 1) { boat.mv = null; m.res(); }
      }
      boatG.position.set(boat.x, -0.45 + Math.sin(t * 1.3) * 0.05, boat.z);
      boatG.rotation.set(Math.sin(t * 1.1) * 0.03, boat.yaw, Math.sin(t * 0.9) * 0.03);
    }

    // ---------------------------------------------------------------- the people (gardens.js's makers), and Yuki's cat
    for (const def0 of PEOPLE) {
      const at = SP[def0.id] || {}, def = Object.assign({ x: at.x, z: at.z, yaw: at.yaw || 0 }, def0, { look: LOOKS[def0.id] });
      if (def.x === undefined) continue;
      const hushed = !!def.hushed || !!def.folk;
      const p = GA.makePerson(def, group, { hushed, gray: hushed, pose: hushed ? (def.hushPose || 'hushed') : def.pose || 'idle' });
      p.y = def.y !== undefined ? def.y : terrainAt(p.x, p.z) + (def.lift || 0);
      p.ask = def.ask || null; p.folk = !!def.folk; def.pose = def.pose || 'idle';
      people.push(p);
      if (def.id !== 'tito' && def.y === undefined && !def.lift) circ(p.x, p.z, 0.4);
    }
    { const y = SP.yuki, kc = Kit(), cx = y.x - 0.4, cz = y.z + 0.9;
      kc.add(GEO.sphere, cx, 0.95, cz, 0.2, 0.17, 0.3, '#f29a3a', { ink: 0.012 }).add(GEO.sphere, cx, 1.18, cz - 0.24, 0.15, 0.14, 0.14, '#f29a3a', { ink: 0.012 });
      for (const s of [-1, 1]) kc.add(GEO.cone, cx + s * 0.08, 1.33, cz - 0.24, 0.05, 0.1, 0.04, '#f29a3a', { ink: 0.006 });
      kc.add(GEO.sphere, cx - 0.05, 1.2, cz - 0.37, 0.03, 0.03, 0.02, INK, { ink: 0 }).add(GEO.sphere, cx + 0.05, 1.2, cz - 0.37, 0.03, 0.03, 0.02, INK, { ink: 0 });
      kc.rod(GEO.cyl6, [cx, 0.95, cz + 0.28], [cx + 0.15, 1.3, cz + 0.42], 0.035, '#e0843a', 0.004);
      kc.build(group); }
    const statics = k.build(group);

    // ---------------------------------------------------------------- every frame
    let ringT = 0;
    function update(dt, t, you) {
      const far = you && Math.hypot(you.x - P.CITY.x, you.z - P.CITY.z) > 175;
      group.visible = !far; if (far) return;
      const nico = people.find(p => p.id === 'nico');
      for (const p of people) {
        if (p === nico) { const want = p.calling ? 'call' : p.pose === 'call' ? 'idle' : null; if (want && p.pose !== want) p.set(want, false); }
        GA.animatePerson(p, dt, t, you);
        if (p.id === 'omar' && p.pose === 'scared') p.body.rotation.z += Math.sin(t * 38) * 0.025;
      }
      // Nico's three gulls come down to him while he calls; the rest wheel over the harbor (or go where they're sent)
      for (let i = 0; i < 3; i++) gulls[i].target = nico && nico.calling ? { x: nico.x - 0.4, y: nico.y + 2.7, z: nico.z - 0.3, r: 0.9 + i * 0.3 } : null;
      gullsUpdate(dt, t);
      BR.k = damp(BR.k, BR.goal, 2.2, dt); bridgeG.rotation.z = (1 - BR.k) * 1.25;
      boatUpdate(dt, t);
      if (ringT > 0) { ringT = Math.max(0, ringT - dt); bellG.rotation.z = Math.sin(ringT * 9) * 0.32 * Math.min(1, ringT); } else bellG.rotation.z = 0;
      if (fogG.visible) for (const s of fogG.children) s.position.y += Math.sin(t * 0.5 + s.userData.a) * 0.002;
    }
    function setBridge(down, instant) { BR.goal = down ? 1 : 0; if (instant) BR.k = BR.goal; bridgePlat.y = down ? [0.79, 0.79] : [-30, -30]; bridgeG.rotation.z = (1 - BR.k) * 1.25; }
    function setFog(open) { fogG.visible = !open; for (const c of fogWalls) c.x = open ? c.x0 + 1e5 : c.x0; }
    function setBell(on) { bellMat.color.set(on ? '#e6b54a' : '#8f8c9a'); }
    function ringBell(n = 1) { ringT = 1.2 * n; }
    return {
      group, colliders, platforms, moving, people, update, setBridge, setFog, setBell, ringBell, setBoat, boatTo, gullsTo, boat, Kit, GEO,
      objects: { bridgeG, boatG, bellG, fogG, gulls, statics, tere },
      get bridgeDown() { return BR.goal === 1; },
      stats() { return { colliders: colliders.length, platforms: platforms.length, people: people.length, gulls: NG, flock: !!flockAt }; },
    };
  };
})();
// ================================================================ words, icons and lines (registered at load)
(() => {
  const P = PORT;
  // the region's words (w.bridge, w.bird, w.water, w.fish come from words.js and the battles)
  const NEW_WORDS = [
    { id: 'w.sea', es: 'mar', pt: 'mar', de: 'Meer', zh: '[海|hǎi]', ja: '[海|うみ]', en: 'sea', g: { es: 'm', pt: 'm', de: 'n' }, pl: { es: 'mares', pt: 'mares', de: 'Meere', zh: '[海|hǎi]', ja: '[海|うみ]' }, icon: 'sea', alt: { zh: ['[大海|dà hǎi]'], ja: ['うみ'] } },
    { id: 'w.boat', es: 'barco', pt: 'barco', de: 'Boot', zh: '[船|chuán]', ja: '[船|ふね]', en: 'boat', g: { es: 'm', pt: 'm', de: 'n' }, pl: { es: 'barcos', pt: 'barcos', de: 'Boote', zh: '[船|chuán]', ja: '[船|ふね]' }, cl: { zh: '[条|tiáo]', ja: '[隻|せき]' }, icon: 'boat', alt: { es: ['bote', 'barca'], pt: ['bote', 'navio'], de: ['Schiff'], ja: ['ふね', 'ボート'] } },
    { id: 'w.gull', es: 'gaviota', pt: 'gaivota', de: 'Möwe', zh: '[海鸥|hǎi ōu]', ja: 'カモメ', en: 'gull', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'gaviotas', pt: 'gaivotas', de: 'Möwen', zh: '[海鸥|hǎi ōu]', ja: 'カモメ' }, cl: { zh: '[只|zhī]', ja: '[羽|わ]' }, icon: 'gull', alt: { ja: ['かもめ'] } },
    { id: 'w.crab', es: 'cangrejo', pt: 'caranguejo', de: 'Krabbe', zh: '[螃蟹|páng xiè]', ja: 'カニ', en: 'crab', g: { es: 'm', pt: 'm', de: 'f' }, pl: { es: 'cangrejos', pt: 'caranguejos', de: 'Krabben', zh: '[螃蟹|páng xiè]', ja: 'カニ' }, cl: { zh: '[只|zhī]', ja: '[匹|ひき]' }, icon: 'crab', alt: { ja: ['かに', '[蟹|かに]'], zh: ['[蟹|xiè]'] } },
    { id: 'w.ticket', es: 'boleto', pt: 'passagem', de: 'Fahrkarte', zh: '[船票|chuán piào]', ja: 'きっぷ', en: 'ticket', g: { es: 'm', pt: 'f', de: 'f' }, pl: { es: 'boletos', pt: 'passagens', de: 'Fahrkarten', zh: '[船票|chuán piào]', ja: 'きっぷ' }, cl: { zh: '[张|zhāng]', ja: '[枚|まい]' }, icon: 'ticket', alt: { es: ['billete', 'pasaje'], pt: ['bilhete'], de: ['Ticket'], zh: ['[票|piào]'], ja: ['[切符|きっぷ]', 'チケット'] } },
    { id: 'w.harbor', es: 'puerto', pt: 'porto', de: 'Hafen', zh: '[港口|gǎng kǒu]', ja: '[港|みなと]', en: 'harbor', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'puertos', pt: 'portos', de: 'Häfen', zh: '[港口|gǎng kǒu]', ja: '[港|みなと]' }, icon: 'anchor' },
    { id: 'w.fort', es: 'fuerte', pt: 'forte', de: 'Festung', zh: '[城堡|chéng bǎo]', ja: '[砦|とりで]', en: 'fort', g: { es: 'm', pt: 'm', de: 'f' }, pl: { es: 'fuertes', pt: 'fortes', de: 'Festungen', zh: '[城堡|chéng bǎo]', ja: '[砦|とりで]' }, cl: { zh: '[座|zuò]', ja: '[棟|とう]' }, icon: 'fort' },
  ];
  // call: Mimo learns it from Nico at the moat (the battle registers the same verb: whichever comes first keeps its object)
  const CALL = { id: 'v.call', kind: 'verb', es: 'llama', pt: 'chama', de: 'ruf', zh: '[叫|jiào]', ja: '[呼|よ]んで', en: 'call', icon: 'call',
    alt: { es: ['llame', 'llamá', 'llámalas', 'llámalos', 'llámala', 'llámalo', 'llamen'], pt: ['chame', 'chamem', 'chamar'], de: ['rufe', 'ruft', 'rufen', 'rufst'], zh: ['[叫来|jiào lái]', '[喊|hǎn]'], ja: ['[呼|よ]べ', '[呼|よ]ぶ', '[呼|よ]んで ください'] } };
  function registerWords() {
    if (typeof LEX === 'undefined') return;
    LEX.register(NEW_WORDS.filter(w => !LEX.item(w.id)).map(w => Object.assign({ kind: 'word' }, w)));
    const it = LEX.item('v.call');
    if (!it) LEX.register([CALL]);
    else { it.icon = 'call'; it.alt = it.alt || {}; for (const l of Object.keys(CALL.alt)) it.alt[l] = Array.from(new Set([...(it.alt[l] || []), ...CALL.alt[l]])); for (const l of ['es', 'pt', 'de', 'zh', 'ja']) if (!it[l]) it[l] = CALL[l]; }
    if (typeof CJK !== 'undefined' && CJK.addSource) for (const w of NEW_WORDS.concat([CALL])) { try { CJK.addSource(w.zh); CJK.addSource(w.ja); } catch (e) { /* the dictionary is optional */ } }
  }
  registerWords();
  // icons (ICONS.add: drawn twice, pass 0 the paper border, pass 1 colors and ink, in a 100 × 100 box)
  if (typeof ICONS !== 'undefined') {
    const add = (name, fn) => { if (!ICONS.keys.includes(name)) ICONS.add(name, fn); };
    add('call', (c, p, h) => { h.shape(c, p, h.ell(-14, 6, 18, 18), '#7ff7ea'); h.shape(c, p, h.ell(-20, -14, 5, 11, -0.3), '#7ff7ea'); h.shape(c, p, h.ell(-8, -14, 5, 11, 0.3), '#7ff7ea'); if (p) { h.eyes(c, -18, -10, 4, 0.6); c.lineWidth = 4; c.strokeStyle = '#2b2235'; for (const r of [12, 22, 32]) { c.beginPath(); c.arc(4, 4, r, -0.6, 0.6); c.stroke(); } } });
    add('boat', (c, p, h) => { h.shape(c, p, h.poly([[-36, 10], [36, 10], [26, 30], [-28, 30]]), '#4f8fb5'); h.shape(c, p, h.rr(-3, -34, 5, 44, 2), '#8a5a3a'); h.shape(c, p, h.poly([[4, -32], [30, 4], [4, 4]]), '#fffaf0'); h.shape(c, p, h.poly([[-4, -24], [-26, 4], [-4, 4]]), '#f2c94c'); });
    add('gull', (c, p, h) => { h.shape(c, p, h.ell(0, 6, 22, 11), '#ffffff'); h.shape(c, p, h.ell(18, 0, 10, 9), '#ffffff'); h.shape(c, p, h.poly([[-6, 2], [-30, -26], [-36, -20], [-10, 8]]), '#d9dfe6'); h.shape(c, p, h.poly([[6, 2], [0, -30], [10, -32], [14, 4]]), '#d9dfe6'); h.shape(c, p, h.poly([[26, -2], [38, 2], [26, 5]]), '#f2b84a'); if (p) h.dot(c, 20, -2, 2.4, h.INK); });
    add('ticket', (c, p, h) => { h.shape(c, p, h.rr(-38, -20, 76, 40, 6), '#f2c94c'); h.shape(c, p, h.rr(-26, -10, 30, 6, 2), '#e2574c'); h.shape(c, p, h.rr(-26, 4, 40, 4, 2), '#2b2235'); if (p) { c.setLineDash([4, 4]); c.lineWidth = 2.5; c.strokeStyle = '#2b2235'; c.beginPath(); c.moveTo(20, -18); c.lineTo(20, 18); c.stroke(); c.setLineDash([]); } });
    add('net', (c, p, h) => { h.shape(c, p, h.rr(-32, -32, 64, 64, 6), '#b9c4b0'); if (p) { c.lineWidth = 3; c.strokeStyle = '#4a5a48'; for (let i = -24; i <= 24; i += 12) { c.beginPath(); c.moveTo(i, -32); c.lineTo(i, 32); c.stroke(); c.beginPath(); c.moveTo(-32, i); c.lineTo(32, i); c.stroke(); } } h.shape(c, p, h.ell(18, 18, 9, 9), '#e6b84a'); });
    add('anchor', (c, p, h) => { h.shape(c, p, h.rr(-4, -26, 8, 54, 3), '#4a5a6a'); h.shape(c, p, h.rr(-18, -18, 36, 7, 3), '#4a5a6a'); h.shape(c, p, h.ell(0, -32, 9, 9), '#4a5a6a'); h.shape(c, p, h.poly([[-30, 12], [-4, 30], [4, 30], [30, 12], [22, 10], [0, 22], [-22, 10]]), '#4a5a6a'); });
    add('fort', (c, p, h) => { h.shape(c, p, h.rr(-36, 0, 72, 30, 3), '#b3a994'); h.shape(c, p, h.rr(-14, -32, 28, 62, 3), '#948b7a'); for (const x of [-36, -22, 10, 24]) h.shape(c, p, h.rr(x, -8, 10, 9, 1), '#b3a994'); h.shape(c, p, h.poly([[-18, -32], [0, -46], [18, -32]]), '#4f6f8a'); h.shape(c, p, h.ell(0, -20, 6, 7), '#e6b84a'); });
    add('sea', (c, p, h) => { h.shape(c, p, h.rr(-38, -10, 76, 40, 6), '#4f8fb5'); if (p) { c.lineWidth = 4; c.strokeStyle = '#ffffff'; for (const y of [-2, 12]) { c.beginPath(); for (let x = -34; x <= 34; x += 2) c.lineTo(x, y + Math.sin(x * 0.2) * 4); c.stroke(); } } h.shape(c, p, h.ell(18, -22, 12, 12), '#f2c94c'); });
  }

  // ---------------------------------------------------------------- lines: T(en, es, pt, de, zh, ja). The en is the weave's (slots). Starred words survive the Hush.
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const PL = {
    // Nico: a harbor kid who calls the gulls by name; quick, cheeky («tú»; the two of you «ustedes»)
    'n.hello': T('Shh! Watch this: I call the gulls… and they come! Everyone in Port Brisa went gray and quiet, even Abel, the bridge keeper. He’s asleep, and the drawbridge is up!',
      '¡Shh! Mira esto: llamo a las gaviotas… ¡y vienen! En Puerto Brisa todos se pusieron grises y callados, hasta Abel, el guardián del puente. ¡Está dormido y el puente está levantado!',
      'Psiu! Olha só: eu chamo as gaivotas… e elas vêm! No Porto Brisa todo mundo ficou cinza e calado, até o Abel, o guarda da ponte. Ele está dormindo, e a ponte está levantada!',
      'Pst! Schau mal: Ich rufe die Möwen… und sie kommen! In Port Brisa sind alle grau und still geworden, sogar Abel, der Brückenwärter. Er schläft, und die Zugbrücke ist oben!',
      '[嘘|xū] ！ [你|nǐ] [看|kàn] ， [我|wǒ] [叫|jiào] [海鸥|hǎi ōu] … [它们|tā men] [就|jiù] [来|lái] [了|le] ！ [微风港|Wēi fēng gǎng] [的|de] [人|rén] [都|dōu] [变成|biàn chéng] [灰色|huī sè] [了|le] ， [不|bù] [说话|shuō huà] ， [连|lián] [守桥|shǒu qiáo] [的|de] [阿贝尔|Ā bèi ěr] [也|yě] [一样|yī yàng] 。 [他|tā] [睡着|shuì zháo] [了|le] ， [吊桥|diào qiáo] [还|hái] [吊|diào] [着|zhe] ！',
      'しーっ ！ [見|み]て て 。 カモメ を [呼|よ]ぶ と … [来|く]る ん だ ！ ブリサ [港|こう] の みんな は [灰色|はいいろ] に なって 、 [話|はな]さなく なった 。 [橋|はし] の [番人|ばんにん] の アベル も 。 アベル は [寝|ね]て いて 、 はね[橋|ばし] が [上|あ]がった まま ！'),
    'n.after': T('Your little {c.friend} was watching me! It has a big voice… Call the gulls! Abel’s booth is right inside the gate. They’ll wake him up!',
      '¡Tu amiguito me estaba mirando! Tiene una voz grande… ¡Llama a las gaviotas! La caseta de Abel está justo detrás de la puerta. ¡Ellas lo van a despertar!',
      'O seu amiguinho estava me olhando! Ele tem uma voz grande… Chama as gaivotas! A cabine do Abel fica logo atrás do portão. Elas vão acordar ele!',
      'Dein kleiner Freund hat mir zugeschaut! Er hat eine große Stimme… Ruf die Möwen! Abels Häuschen ist gleich hinter dem Tor. Die wecken ihn auf!',
      '[你|nǐ] [的|de] [小|xiǎo] [朋友|péng you] [一直|yī zhí] [在|zài] [看|kàn] [我|wǒ] ！ [它|tā] [的|de] [声音|shēng yīn] [好|hǎo] [大|dà] … [叫|jiào] [海鸥|hǎi ōu] [吧|ba] ！ [阿贝尔|Ā bèi ěr] [的|de] [小屋|xiǎo wū] [就|jiù] [在|zài] [门|mén] [后面|hòu miàn] 。 [海鸥|hǎi ōu] [会|huì] [把|bǎ] [他|tā] [吵醒|chǎo xǐng] ！',
      'あなた の お[友達|ともだち] 、 わたし を [見|み]て た ね ！ [声|こえ] が [大|おお]きい … カモメ を [呼|よ]んで ！ アベル の [小屋|こや] は [門|もん] の すぐ [後|うし]ろ 。 カモメ が [起|お]こして くれる よ ！'),
    'n.open': T('The bridge is down! Come on, the harbor’s this way. Dora, the harbor master, knows everything that happens in Port Brisa.',
      '¡El puente bajó! Vengan, el puerto está por aquí. Dora, la capitana del puerto, sabe todo lo que pasa en Puerto Brisa.',
      'A ponte desceu! Venham, o porto é por aqui. A Dora, a capitã do porto, sabe tudo o que acontece no Porto Brisa.',
      'Die Brücke ist unten! Kommt, zum Hafen geht’s hier lang. Dora, die Hafenmeisterin, weiß alles, was in Port Brisa passiert.',
      '[桥|qiáo] [放下来|fàng xià lái] [了|le] ！ [来|lái] ， [港口|gǎng kǒu] [在|zài] [这边|zhè biān] 。 [港务长|gǎng wù zhǎng] [多拉|Duō lā] [知道|zhī dào] [微风港|Wēi fēng gǎng] [的|de] [每|měi] [一|yī] [件|jiàn] [事|shì] 。',
      '[橋|はし] が [下|お]りた ！ こっち ！ [港|みなと] は こっち だ よ 。 [港長|こうちょう] の ドラ は 、 ブリサ [港|こう] の こと なら なんでも [知|し]って る 。'),
    'n.chat': T('The gulls like your {c.friend} more than me now. Not fair!', 'Ahora las gaviotas quieren más a tu amiguito que a mí. ¡No es justo!', 'Agora as gaivotas gostam mais do seu amiguinho do que de mim. Não é justo!', 'Jetzt mögen die Möwen deinen kleinen Freund lieber als mich. Unfair!',
      '[现在|xiàn zài] [海鸥|hǎi ōu] [更|gèng] [喜欢|xǐ huan] [你|nǐ] [的|de] [小|xiǎo] [朋友|péng you] 。 [不|bù] [公平|gōng píng] ！', 'いま は カモメ が わたし より あなた の お[友達|ともだち] の ほう が [好|す]き みたい 。 ずるい ！'),
    // Abel: the bridge keeper, grumpy and kind
    'a.wake': T('Wha…? Gulls on my roof?! … Oh! The colors are back… Visitors! Hold on, I’ll lower the bridge!',
      '¿Qué…? ¡¿Gaviotas en mi techo?! … ¡Ay! Volvieron los colores… ¡Visitas! ¡Esperen, ya bajo el puente!',
      'Quê…? Gaivotas no meu telhado?! … Ah! As cores voltaram… Visita! Esperem, eu já baixo a ponte!',
      'Was…? Möwen auf meinem Dach?! … Oh! Die Farben sind zurück… Besuch! Wartet, ich lasse die Brücke runter!',
      '[什么|shén me] … ？ [海鸥|hǎi ōu] [在|zài] [我|wǒ] [的|de] [屋顶|wū dǐng] [上|shàng] ？ ！ … [哦|ò] ！ [颜色|yán sè] [回来|huí lái] [了|le] … [有|yǒu] [客人|kè rén] ！ [等|děng] [一下|yī xià] ， [我|wǒ] [放下|fàng xià] [吊桥|diào qiáo] ！',
      'な 、 なんだ ？ [屋根|やね] に カモメ ？ ！ … おお ！ [色|いろ] が [戻|もど]った … お[客|きゃく]さん だ ！ [待|ま]って ろ 、 [橋|はし] を [下|お]ろす ぞ ！'),
    'a.chat': T('From now on a gull alarm wakes me every morning. Thanks a lot!', 'Desde hoy, una alarma de gaviotas me despierta cada mañana. ¡Muchas gracias, eh!', 'A partir de hoje, um alarme de gaivotas me acorda toda manhã. Muito obrigado, viu!', 'Ab heute weckt mich jeden Morgen ein Möwenwecker. Vielen Dank auch!',
      '[从|cóng] [今天|jīn tiān] [起|qǐ] ， [每天|měi tiān] [早上|zǎo shang] [都|dōu] [有|yǒu] [海鸥|hǎi ōu] [叫|jiào] [我|wǒ] [起床|qǐ chuáng] 。 [真|zhēn] [是|shì] [谢谢|xiè xie] [你|nǐ] [啊|a] ！', 'きょう から 、 [毎朝|まいあさ] カモメ が [起|お]こして くれる 。 どうも ありがとう よ ！'),
    // Dora: the harbor master; brisk, warm, nautical («ustedes» to the two of you)
    'd.hello': T('Ahoy! Visitors in Port Brisa, on a gray day like this? I’m Dora, the harbor master.',
      '¡Ah del barco! ¿Visitas en Puerto Brisa, en un día tan gris? Soy Dora, la capitana del puerto.',
      'Ô de bordo! Visita no Porto Brisa, num dia cinza desses? Eu sou a Dora, a capitã do porto.',
      'Ahoi! Besuch in Port Brisa, an so einem grauen Tag? Ich bin Dora, die Hafenmeisterin.',
      '[喂|wèi] ！ [这么|zhè me] [灰|huī] [的|de] [天|tiān] ， [还|hái] [有|yǒu] [客人|kè rén] [来|lái] [微风港|Wēi fēng gǎng] ？ [我|wǒ] [是|shì] [多拉|Duō lā] ， [这里|zhè lǐ] [的|de] [港务长|gǎng wù zhǎng] 。',
      'おーい ！ こんな [灰色|はいいろ] の [日|ひ] に 、 ブリサ [港|こう] に お[客|きゃく]さん ？ わたし は ドラ 。 この [港|みなと] の [港長|こうちょう] よ 。'),
    'd.hush': T('The gray came in with the morning fog. The sailors went quiet, the harbor {w.bell} stopped ringing… and crabs walked up out of the {w.sea}.',
      'Lo gris llegó con la niebla de la mañana. Los marineros se callaron, la campana del puerto dejó de sonar… y los cangrejos salieron del mar.',
      'O cinza chegou com a neblina da manhã. Os marinheiros se calaram, o sino do porto parou de tocar… e os caranguejos saíram do mar.',
      'Das Grau kam mit dem Morgennebel. Die Seeleute verstummten, die Hafenglocke hörte auf zu läuten… und Krabben kamen aus dem Meer.',
      '[灰色|huī sè] [跟着|gēn zhe] [早上|zǎo shang] [的|de] [雾|wù] [来|lái] [了|le] 。 [水手们|shuǐ shǒu men] [不|bù] [说话|shuō huà] [了|le] ， [港口|gǎng kǒu] [的|de] [钟|zhōng] [也|yě] [不|bù] [响|xiǎng] [了|le] … [螃蟹|páng xiè] [还|hái] [从|cóng] [海|hǎi] [里|lǐ] [爬|pá] [了|le] [出来|chū lái] 。',
      '[朝|あさ] の [霧|きり] と いっしょ に [灰色|はいいろ] が [来|き]た の 。 [船乗|ふなの]り たち は [黙|だま]って 、 [港|みなと] の [鐘|かね] は [鳴|な]らなく なって … [海|うみ] から カニ が [上|あ]がって きた 。'),
    'd.ask': T('A girl with a notebook? Lots of people come and go here… Ask the sailors! Ask them good questions, and their words will come back.',
      '¿Una chica con un cuaderno? Aquí va y viene mucha gente… ¡Pregúntenles a los marineros! Háganles buenas preguntas, y les vuelven las palabras.',
      'Uma menina com um caderno? Muita gente vai e vem por aqui… Perguntem aos marinheiros! Façam boas perguntas, e as palavras deles voltam.',
      'Ein Mädchen mit einem Notizbuch? Hier kommen und gehen viele Leute… Fragt die Seeleute! Stellt ihnen gute Fragen, dann kommen ihre Worte zurück.',
      '[一个|yī gè] [拿着|ná zhe] [本子|běn zi] [的|de] [女孩|nǚ hái] ？ [这里|zhè lǐ] [人|rén] [来来往往|lái lái wǎng wǎng] … [去|qù] [问|wèn] [水手们|shuǐ shǒu men] [吧|ba] ！ [好好|hǎo hǎo] [地|de] [问|wèn] [问题|wèn tí] ， [他们|tā men] [的|de] [话|huà] [就|jiù] [会|huì] [回来|huí lái] 。',
      'ノート を [持|も]った [女|おんな]の[子|こ] ？ ここ は [人|ひと] が たくさん [行|い]ったり [来|き]たり する から … [船乗|ふなの]り たち に [聞|き]いて ！ いい [質問|しつもん] を すれば 、 [言葉|ことば] が [戻|もど]って くる わ 。'),
    'd.list': T('Greta’s on the fishing pier, Rui’s on his bench by the fish market, Wei’s at his soup cart, Yuki’s on the fort boat’s pier… and Omar’s hiding from the crabs on the beach.',
      'Greta está en el muelle de los pescadores, Rui en su banco junto a la lonja, Wei en su carrito de sopa, Yuki en el muelle del barco del fuerte… y Omar se esconde de los cangrejos en la playa.',
      'A Greta está no píer dos pescadores, o Rui no banco dele perto do mercado de peixe, o Wei no carrinho de sopa, a Yuki no píer do barco do forte… e o Omar está se escondendo dos caranguejos na praia.',
      'Greta ist auf dem Fischersteg, Rui auf seiner Bank beim Fischmarkt, Wei an seinem Suppenwagen, Yuki auf dem Steg vom Festungsboot… und Omar versteckt sich am Strand vor den Krabben.',
      '[格蕾塔|Gé lěi tǎ] [在|zài] [渔船|yú chuán] [码头|mǎ tou] ， [鲁伊|Lǔ yī] [在|zài] [鱼市|yú shì] [旁边|páng biān] [的|de] [长椅|cháng yǐ] [上|shàng] ， [伟|Wěi] [在|zài] [他|tā] [的|de] [汤|tāng] [车|chē] [那里|nà lǐ] ， [由纪|Yóu jì] [在|zài] [城堡|chéng bǎo] [船|chuán] [的|de] [码头|mǎ tou] … [奥马尔|Ào mǎ ěr] [在|zài] [海滩|hǎi tān] [上|shàng] [躲|duǒ] [螃蟹|páng xiè] 。',
      'グレタ は [漁師|りょうし] の [桟橋|さんばし] 、 ルイ は [魚市場|うおいちば] の [前|まえ] の ベンチ 、 ウェイ は スープ の [屋台|やたい] 、 ユキ は [砦|とりで] の [船|ふね] の [桟橋|さんばし] … オマール は [浜|はま] で カニ から [隠|かく]れて る わ 。'),
    'd.done': T('So Yuki rowed Noa out to the sea {w.fort}, and then the fog came. The fort boat’s still out there… Get a {w.ticket} from Tito, and call the {w.boat} from the end of the pier!',
      'Así que Yuki llevó a Noa en bote hasta el fuerte, y después llegó la niebla. El barco del fuerte sigue allá… ¡Saquen un boleto con Tito y llamen al barco desde la punta del muelle!',
      'Então a Yuki levou a Noa de bote até o forte, e depois veio a neblina. O barco do forte ainda está lá… Peguem uma passagem com o Tito e chamem o barco da ponta do píer!',
      'Yuki hat Noa also zur Seefestung gerudert, und dann kam der Nebel. Das Festungsboot ist noch da draußen… Holt euch bei Tito eine Fahrkarte und ruft das Boot vom Ende des Stegs!',
      '[原来|yuán lái] [由纪|Yóu jì] [划船|huá chuán] [把|bǎ] [诺娅|Nuò yà] [送到|sòng dào] [了|le] [海上|hǎi shàng] [城堡|chéng bǎo] ， [然后|rán hòu] [雾|wù] [就|jiù] [来|lái] [了|le] 。 [城堡|chéng bǎo] [的|de] [船|chuán] [还|hái] [在|zài] [那边|nà biān] … [去|qù] [蒂托|Dì tuō] [那里|nà lǐ] [买|mǎi] [票|piào] ， [然后|rán hòu] [在|zài] [码头|mǎ tou] [尽头|jìn tóu] [叫|jiào] [船|chuán] ！',
      'つまり 、 ユキ が ノア を [海|うみ] の [砦|とりで] まで [送|おく]った の ね 。 その [後|あと] で [霧|きり] が [来|き]た 。 [砦|とりで] の [船|ふね] は まだ [向|む]こう に ある … ティト に きっぷ を もらって 、 [桟橋|さんばし] の [先|さき] から [船|ふね] を [呼|よ]んで ！'),
    'd.boat': T('Call the {w.boat} from the end of the pier! Tere knows the way, gray or not.', '¡Llamen al barco desde la punta del muelle! Tere se sabe el camino, aunque esté gris.', 'Chamem o barco da ponta do píer! A Tere sabe o caminho, mesmo cinza.', 'Ruft das Boot vom Ende des Stegs! Tere kennt den Weg, auch in Grau.',
      '[在|zài] [码头|mǎ tou] [尽头|jìn tóu] [叫|jiào] [船|chuán] ！ [就算|jiù suàn] [是|shì] [灰色|huī sè] [的|de] ， [特蕾|Tè lěi] [也|yě] [认识|rèn shi] [路|lù] 。', '[桟橋|さんばし] の [先|さき] から [船|ふね] を [呼|よ]んで ！ [灰色|はいいろ] でも 、 テレ は [道|みち] を [知|し]って る わ 。'),
    'd.free': T('The harbor {w.bell}! Hear the whole city answering it? Six bells of eight… Noa’s a lucky one!',
      '¡La campana del puerto! ¿Oyen cómo le responde toda la ciudad? Seis campanas de ocho… ¡Qué suerte tiene Noa!',
      'O sino do porto! Estão ouvindo a cidade inteira responder? Seis sinos de oito… Que sorte a Noa tem!',
      'Die Hafenglocke! Hört ihr, wie die ganze Stadt antwortet? Sechs Glocken von acht… Noa hat echt Glück!',
      '[港口|gǎng kǒu] [的|de] [钟|zhōng] ！ [听到|tīng dào] [了|le] [吗|ma] ？ [整个|zhěng gè] [城市|chéng shì] [都|dōu] [在|zài] [回答|huí dá] [它|tā] 。 [八|bā] [个|gè] [钟|zhōng] [响|xiǎng] [了|le] [六|liù] [个|gè] … [诺娅|Nuò yà] [真|zhēn] [幸运|xìng yùn] ！',
      '[港|みなと] の [鐘|かね] ！ [町|まち] じゅう が [答|こた]えて る の 、 [聞|き]こえる ？ [八|やっ]つ の うち [六|むっ]つ … ノア は [幸|しあわ]せ ね ！'),
    'd.next': T('Noa’s page said the Sunken Ruins, didn’t it? The big ship at the long pier sails down that coast. Your {w.ticket} gets you on!',
      'La página de Noa decía las Ruinas Hundidas, ¿no? El barco grande del muelle largo va hacia esa costa. ¡Con su boleto pueden subir!',
      'A página da Noa falava das Ruínas Submersas, né? O navio grande do píer comprido vai pra aquela costa. Com a passagem vocês podem subir!',
      'Auf Noas Seite stand doch was von den Versunkenen Ruinen, oder? Das große Schiff am langen Steg fährt an diese Küste. Mit eurer Fahrkarte könnt ihr einsteigen!',
      '[诺娅|Nuò yà] [的|de] [那页|nà yè] [纸|zhǐ] [上|shàng] [写|xiě] [着|zhe] [沉没|chén mò] [的|de] [遗迹|yí jì] ， [对|duì] [吧|ba] ？ [长|cháng] [码头|mǎ tou] [的|de] [大船|dà chuán] [去|qù] [那边|nà biān] [的|de] [海岸|hǎi àn] 。 [有|yǒu] [票|piào] [就|jiù] [能|néng] [上船|shàng chuán] ！',
      'ノア の ページ に は 「 [沈|しず]んだ [遺跡|いせき] 」 って [書|か]いて あった でしょ ？ [長|なが]い [桟橋|さんばし] の [大|おお]きい [船|ふね] が その [海岸|かいがん] へ [行|い]く わ 。 きっぷ が あれば [乗|の]れる よ ！'),
    // the sailors: a hushed line (the starred words get through), the answer once you ask the right question, a chat after
    'g.h': T('*Nets*… *busy*… *work*…', '*Redes*… *trabajo*… *mucho*…', '*Redes*… *trabalho*… *muito*…', '*Netze*… *Arbeit*… *viel*…', '[网|wǎng] … [干活|gàn huó] … [很|hěn] [忙|máng] …', '[網|あみ] … [仕事|しごと] … いそがしい …'),
    'g.ans': T('I’m mending my nets. The crabs cut them every night! The girl with the notebook? She drew my boat. Then she talked to old Rui for a long time.',
      'Estoy remendando mis redes. ¡Los cangrejos las cortan cada noche! ¿La chica del cuaderno? Dibujó mi barco. Después habló mucho rato con el viejo Rui.',
      'Estou consertando as minhas redes. Os caranguejos cortam elas toda noite! A menina do caderno? Ela desenhou o meu barco. Depois conversou muito tempo com o velho Rui.',
      'Ich flicke meine Netze. Die Krabben zerschneiden sie jede Nacht! Das Mädchen mit dem Notizbuch? Sie hat mein Boot gezeichnet. Dann hat sie lange mit dem alten Rui geredet.',
      '[我|wǒ] [在|zài] [补|bǔ] [渔网|yú wǎng] 。 [螃蟹|páng xiè] [每天|měi tiān] [晚上|wǎn shang] [都|dōu] [把|bǎ] [网|wǎng] [剪破|jiǎn pò] ！ [拿|ná] [本子|běn zi] [的|de] [女孩|nǚ hái] ？ [她|tā] [画|huà] [了|le] [我|wǒ] [的|de] [船|chuán] 。 [然后|rán hòu] [跟|gēn] [老|lǎo] [鲁伊|Lǔ yī] [聊|liáo] [了|le] [很|hěn] [久|jiǔ] 。',
      '[網|あみ] を [直|なお]して いる の 。 カニ が [毎晩|まいばん] [切|き]る の よ ！ ノート の [女|おんな]の[子|こ] ？ わたし の [船|ふね] を [描|か]いて た 。 それ から ルイ じいさん と [長|なが]く [話|はな]して た わ 。'),
    'g.chat': T('Good nets, good fish. Simple.', 'Buenas redes, buen pescado. Así de simple.', 'Rede boa, peixe bom. Simples assim.', 'Gute Netze, guter Fisch. Ganz einfach.', '[网|wǎng] [好|hǎo] ， [鱼|yú] [就|jiù] [好|hǎo] 。 [就|jiù] [这么|zhè me] [简单|jiǎn dān] 。', 'いい [網|あみ] なら 、 いい [魚|さかな] 。 それ だけ 。'),
    'r.h': T('*Far*… *islands*… *long ago*…', '*Lejos*… las *islas*… hace *mucho*…', '*Longe*… as *ilhas*… há *muito tempo*…', '*Weit*… die *Inseln*… vor *langer Zeit*…', '[很|hěn] [远|yuǎn] … [岛|dǎo] … [很|hěn] [久|jiǔ] [以前|yǐ qián] …', '[遠|とお]い … [島|しま] … [昔|むかし] …'),
    'r.ans': T('I come from the islands in the south, long, long ago. The girl? She asked me about the harbor {w.bell} in the old sea fort. I told her it’s the oldest bell on the whole coast.',
      'Vengo de las islas del sur, hace muchos, muchos años. ¿La chica? Me preguntó por la campana del puerto, la del viejo fuerte del mar. Le dije que es la campana más vieja de toda la costa.',
      'Eu venho das ilhas do sul, faz muitos e muitos anos. A menina? Ela me perguntou do sino do porto, no velho forte do mar. Eu disse que é o sino mais antigo de toda a costa.',
      'Ich komme von den Inseln im Süden, vor vielen, vielen Jahren. Das Mädchen? Sie hat mich nach der Hafenglocke gefragt, in der alten Seefestung. Ich habe ihr gesagt: Das ist die älteste Glocke an der ganzen Küste.',
      '[我|wǒ] [从|cóng] [南边|nán biān] [的|de] [岛|dǎo] [来|lái] ， [很|hěn] [多|duō] [很|hěn] [多|duō] [年|nián] [以前|yǐ qián] 。 [那个|nà gè] [女孩|nǚ hái] ？ [她|tā] [问|wèn] [我|wǒ] [老|lǎo] [海上|hǎi shàng] [城堡|chéng bǎo] [里|lǐ] [的|de] [港口|gǎng kǒu] [钟|zhōng] 。 [我|wǒ] [告诉|gào su] [她|tā] ， [那|nà] [是|shì] [整个|zhěng gè] [海岸|hǎi àn] [最|zuì] [老|lǎo] [的|de] [钟|zhōng] 。',
      'わし は [南|みなみ] の [島|しま] から [来|き]た 。 ずっと ずっと [昔|むかし] に な 。 [女|おんな]の[子|こ] ？ [古|ふる]い [海|うみ] の [砦|とりで] の 、 [港|みなと] の [鐘|かね] の こと を [聞|き]いて きた 。 この [海岸|かいがん] で いちばん [古|ふる]い [鐘|かね] だ と [教|おし]えて やった よ 。'),
    'r.chat': T('The sea always brings things back. Always.', 'El mar siempre devuelve las cosas. Siempre.', 'O mar sempre devolve as coisas. Sempre.', 'Das Meer bringt alles zurück. Immer.', '[大海|dà hǎi] [总是|zǒng shì] [会|huì] [把|bǎ] [东西|dōng xi] [送|sòng] [回来|huí lái] 。 [总是|zǒng shì] 。', '[海|うみ] は いつも なんでも [返|かえ]して くれる 。 いつも な 。'),
    'w.h': T('*Soup*… *tickets*… *who*…', '*Sopa*… *boletos*… *quién*…', '*Sopa*… *passagens*… *quem*…', '*Suppe*… *Fahrkarten*… *wer*…', '[汤|tāng] … [票|piào] … [谁|shéi] …', 'スープ … きっぷ … だれ …'),
    'w.ans': T('Tito has the tickets, at the blue ticket booth by the pier! … The girl ate my fish soup. Two bowls! Then she went to look for Yuki.',
      '¡Tito tiene los boletos, en la taquilla azul junto al muelle! … La chica se tomó mi sopa de pescado. ¡Dos platos! Después fue a buscar a Yuki.',
      'O Tito tem as passagens, na bilheteria azul perto do píer! … A menina tomou a minha sopa de peixe. Duas tigelas! Depois ela foi procurar a Yuki.',
      'Tito hat die Fahrkarten, am blauen Schalter beim Steg! … Das Mädchen hat meine Fischsuppe gegessen. Zwei Schüsseln! Dann ist sie zu Yuki gegangen.',
      '[蒂托|Dì tuō] [有|yǒu] [船票|chuán piào] ， [在|zài] [码头|mǎ tou] [旁边|páng biān] [的|de] [蓝色|lán sè] [售票亭|shòu piào tíng] ！ … [那个|nà gè] [女孩|nǚ hái] [喝|hē] [了|le] [我|wǒ] [的|de] [鱼汤|yú tāng] 。 [两|liǎng] [碗|wǎn] ！ [然后|rán hòu] [她|tā] [去|qù] [找|zhǎo] [由纪|Yóu jì] [了|le] 。',
      'きっぷ は ティト が [持|も]って る よ 。 [桟橋|さんばし] の そば の [青|あお]い [売|う]り[場|ば] ！ … あの [子|こ] は ぼく の [魚|さかな] の スープ を [飲|の]んだ 。 [二杯|にはい] も ！ それ から ユキ を [探|さが]し に [行|い]った よ 。'),
    'w.chat': T('Soup’s always hot here. Come back hungry!', 'Aquí la sopa siempre está caliente. ¡Vuelvan con hambre!', 'Aqui a sopa está sempre quente. Voltem com fome!', 'Hier ist die Suppe immer heiß. Kommt hungrig wieder!', '[我|wǒ] [这里|zhè lǐ] [的|de] [汤|tāng] [永远|yǒng yuǎn] [是|shì] [热|rè] [的|de] 。 [饿|è] [了|le] [就|jiù] [回来|huí lái] ！', 'ここ の スープ は いつも あつあつ だ よ 。 おなか が すいたら また [来|き]て ！'),
    'y.h': T('*Fort*… *boat*… *go*…', 'El *fuerte*… el *barco*… *ir*…', 'O *forte*… o *barco*… *ir*…', 'Die *Festung*… das *Boot*… *fahren*…', '[城堡|chéng bǎo] … [船|chuán] … [去|qù] …', '[砦|とりで] … [船|ふね] … [行|い]く …'),
    'y.ans': T('I’m going to the sea fort… I want to, but the boat isn’t here. Yesterday I rowed the girl out there. She wanted to see the bell. Then the fog came, and I rowed back alone.',
      'Voy al fuerte del mar… Quiero ir, pero el barco no está. Ayer llevé a la chica en bote hasta allá. Quería ver la campana. Después vino la niebla, y volví sola.',
      'Eu vou para o forte do mar… Quero ir, mas o barco não está aqui. Ontem eu levei a menina até lá de bote. Ela queria ver o sino. Depois veio a neblina, e eu voltei sozinha.',
      'Ich fahre zur Seefestung… Ich will, aber das Boot ist nicht da. Gestern habe ich das Mädchen hingerudert. Sie wollte die Glocke sehen. Dann kam der Nebel, und ich bin allein zurückgerudert.',
      '[我|wǒ] [要|yào] [去|qù] [海上|hǎi shàng] [城堡|chéng bǎo] … [可是|kě shì] [船|chuán] [不|bù] [在|zài] [这里|zhè lǐ] 。 [昨天|zuó tiān] [我|wǒ] [划船|huá chuán] [把|bǎ] [那个|nà gè] [女孩|nǚ hái] [送|sòng] [过去|guò qù] 。 [她|tā] [想|xiǎng] [看|kàn] [那|nà] [口|kǒu] [钟|zhōng] 。 [后来|hòu lái] [雾|wù] [来|lái] [了|le] ， [我|wǒ] [一个人|yī gè rén] [划|huá] [回来|huí lái] [了|le] 。',
      'わたし は [海|うみ] の [砦|とりで] に [行|い]きたい … でも [船|ふね] が ない の 。 きのう 、 あの [子|こ] を ボート で [砦|とりで] まで [送|おく]った 。 [鐘|かね] が [見|み]たい って 。 その [後|あと] [霧|きり] が [来|き]て 、 わたし は ひとり で [戻|もど]った の 。'),
    'y.chat': T('Miso says hi. That’s my cat. He’s braver than me.', 'Miso te saluda. Es mi gato. Es más valiente que yo.', 'O Miso mandou um oi. É o meu gato. Ele é mais corajoso que eu.', 'Miso sagt hallo. Das ist mein Kater. Er ist mutiger als ich.',
      '[味噌|Wèi cēng] [跟|gēn] [你|nǐ] [打|dǎ] [招呼|zhāo hu] 。 [它|tā] [是|shì] [我|wǒ] [的|de] [猫|māo] ， [比|bǐ] [我|wǒ] [勇敢|yǒng gǎn] 。', 'ミソ が よろしく って 。 わたし の ネコ 。 わたし より [勇気|ゆうき] が ある の 。'),
    'y.boat': T('The boat! It came! Tere’s gray, but she knows the way by heart. Hop in, quick!', '¡El barco! ¡Vino! Tere está gris, pero se sabe el camino de memoria. ¡Suban, rápido!', 'O barco! Ele veio! A Tere está cinza, mas sabe o caminho de cor. Subam, rápido!', 'Das Boot! Es ist gekommen! Tere ist grau, aber sie kennt den Weg auswendig. Steigt ein, schnell!',
      '[船|chuán] ！ [船|chuán] [来|lái] [了|le] ！ [特蕾|Tè lěi] [虽然|suī rán] [是|shì] [灰色|huī sè] [的|de] ， [可是|kě shì] [她|tā] [记得|jì de] [路|lù] 。 [快|kuài] [上船|shàng chuán] [吧|ba] ！', '[船|ふね] ！ [来|き]た ！ テレ は [灰色|はいいろ] だ けど 、 [道|みち] は [覚|おぼ]えて る 。 [早|はや]く [乗|の]って ！'),
    'o.h': T('*Crabs*… *crabs*… *no, no*…', '*Cangrejos*… *cangrejos*… *no, no*…', '*Caranguejos*… *caranguejos*… *não, não*…', '*Krabben*… *Krabben*… *nein, nein*…', '[螃蟹|páng xiè] … [螃蟹|páng xiè] … [不|bù] [要|yào] …', 'カニ … カニ … いや だ …'),
    'o.ans': T('Why? The crabs! They walk sideways, and their claws are this big! You can’t hit them from the front: their shell is too hard. Only from behind!',
      '¿Por qué? ¡Por los cangrejos! Caminan de lado, ¡y tienen unas pinzas así de grandes! Por delante no se les puede pegar: el caparazón es muy duro. ¡Solo por detrás!',
      'Por quê? Os caranguejos! Eles andam de lado, e as garras são deste tamanho! Pela frente não dá pra bater neles: a casca é dura demais. Só por trás!',
      'Warum? Die Krabben! Die laufen seitwärts, und ihre Scheren sind sooo groß! Von vorne kann man sie nicht schlagen: Ihr Panzer ist zu hart. Nur von hinten!',
      '[为什么|wèi shén me] ？ [因为|yīn wèi] [螃蟹|páng xiè] ！ [它们|tā men] [横着|héng zhe] [走|zǒu] ， [钳子|qián zi] [这么|zhè me] [大|dà] ！ [从|cóng] [前面|qián miàn] [打|dǎ] [不了|bù liǎo] ， [壳|ké] [太|tài] [硬|yìng] [了|le] 。 [只能|zhǐ néng] [从|cóng] [后面|hòu miàn] [打|dǎ] ！',
      'どうして って ？ カニ だ よ ！ [横|よこ] に [歩|ある]く し 、 はさみ が こんなに [大|おお]きい ！ [前|まえ] から は [打|う]てない 。 [甲羅|こうら] が [硬|かた]すぎる 。 [後|うし]ろ から だけ だ ！'),
    'o.chat': T('Are they gone? Tell me when they’re gone.', '¿Ya se fueron? Avísame cuando se vayan.', 'Já foram embora? Me avisa quando forem.', 'Sind sie weg? Sag Bescheid, wenn sie weg sind.', '[它们|tā men] [走|zǒu] [了|le] [吗|ma] ？ [走|zǒu] [了|le] [告诉|gào su] [我|wǒ] 。', 'もう いない ？ いなく なったら [教|おし]えて 。'),
    'o.calm': T('No more crabs! I’m coming down. Slowly.', '¡Ya no hay cangrejos! Ya bajo. Despacito.', 'Acabaram os caranguejos! Já vou descer. Devagarinho.', 'Keine Krabben mehr! Ich komme runter. Ganz langsam.', '[没有|méi yǒu] [螃蟹|páng xiè] [了|le] ！ [我|wǒ] [下来|xià lái] [了|le] 。 [慢慢|màn màn] [地|de] 。', 'もう カニ は いない ！ [降|お]りる よ 。 ゆっくり ね 。'),
    // Tito: the ticket clerk; formal, by the book («usted»)
    't.h': T('*Tickets*… the *boat*… *when*…', '*Boletos*… el *barco*… *cuándo*…', '*Passagens*… o *barco*… *quando*…', '*Fahrkarten*… das *Boot*… *wann*…', '[票|piào] … [船|chuán] … [什么时候|shén me shí hou] …', 'きっぷ … [船|ふね] … いつ …'),
    't.when': T('The fort boat goes every morning at nine. But not today: it’s out at the fort, and Tere, its skipper, is gray.',
      'El barco del fuerte sale todas las mañanas a las nueve. Pero hoy no: está allá en el fuerte, y Tere, la patrona, está gris.',
      'O barco do forte sai toda manhã às nove. Mas hoje não: ele está lá no forte, e a Tere, a mestra do barco, está cinza.',
      'Das Festungsboot fährt jeden Morgen um neun. Aber heute nicht: Es liegt drüben an der Festung, und Tere, die Schifferin, ist grau.',
      '[去|qù] [城堡|chéng bǎo] [的|de] [船|chuán] [每天|měi tiān] [早上|zǎo shang] [九|jiǔ] [点|diǎn] [开|kāi] 。 [可是|kě shì] [今天|jīn tiān] [不行|bù xíng] ： [船|chuán] [在|zài] [城堡|chéng bǎo] [那边|nà biān] ， [船长|chuán zhǎng] [特蕾|Tè lěi] [变成|biàn chéng] [灰色|huī sè] [了|le] 。',
      '[砦|とりで] へ の [船|ふね] は [毎朝|まいあさ] [九時|くじ] に [出|で]ます 。 でも きょう は だめ です 。 [船|ふね] は [砦|とりで] に あって 、 [船長|せんちょう] の テレ は [灰色|はいいろ] です 。'),
    't.how': T('How? With a {w.ticket}, and with the {w.boat}! Here, your ticket: the first trip in days is on the house. The boat won’t come by itself… Call it from the end of the pier!',
      '¿Cómo? ¡Con boleto y con barco! Tenga, su boleto: el primer viaje en días es gratis. El barco no viene solo… ¡Llámelo desde la punta del muelle!',
      'Como? Com passagem e com barco! Aqui está a sua passagem: a primeira viagem em dias é por conta da casa. O barco não vem sozinho… Chame ele da ponta do píer!',
      'Wie? Mit Fahrkarte und mit Boot! Bitte sehr, Ihre Fahrkarte: Die erste Fahrt seit Tagen geht aufs Haus. Das Boot kommt nicht von allein… Rufen Sie es vom Ende des Stegs!',
      '[怎么|zěn me] [去|qù] ？ [要|yào] [有|yǒu] [票|piào] ， [也|yě] [要|yào] [有|yǒu] [船|chuán] ！ [给|gěi] [您|nín] [票|piào] ： [好|hǎo] [几|jǐ] [天|tiān] [来|lái] [第一|dì yī] [趟|tàng] ， [免费|miǎn fèi] 。 [船|chuán] [不会|bù huì] [自己|zì jǐ] [过来|guò lái] … [在|zài] [码头|mǎ tou] [尽头|jìn tóu] [叫|jiào] [它|tā] [吧|ba] ！',
      'どう やって ？ きっぷ と [船|ふね] で です よ ！ どうぞ 、 きっぷ です 。 [何日|なんにち] ぶり の [最初|さいしょ] の [便|びん] なので 、 ただ です 。 [船|ふね] は [自分|じぶん] で は [来|き]ません … [桟橋|さんばし] の [先|さき] から [呼|よ]んで ください ！'),
    't.chat': T('The next boat? When the {w.bell} rings again, everything will run on time.', '¿El próximo barco? Cuando vuelva a sonar la campana, todo va a salir a tiempo.', 'O próximo barco? Quando o sino tocar de novo, tudo vai sair na hora.', 'Das nächste Boot? Wenn die Glocke wieder läutet, fährt alles pünktlich.',
      '[下|xià] [一|yī] [班|bān] [船|chuán] ？ [钟|zhōng] [再|zài] [响|xiǎng] [的|de] [时候|shí hou] ， [一切|yī qiè] [都|dōu] [会|huì] [准时|zhǔn shí] 。', '[次|つぎ] の [船|ふね] ？ [鐘|かね] が また [鳴|な]ったら 、 ぜんぶ [時間|じかん] どおり に [出|で]ます よ 。'),
    // Quino: the big ship's boatman (region 7's boat): a hushed word until the bell, then «all aboard», or «soon»
    'q.h': T('The *ship*… the *south*… *soon*…', 'El *barco*… el *sur*… *pronto*…', 'O *navio*… o *sul*… *logo*…', 'Das *Schiff*… der *Süden*… *bald*…', '[船|chuán] … [南边|nán biān] … [快|kuài] [了|le] …', '[船|ふね] … [南|みなみ] … もうすぐ …'),
    'q.soon': T('The ship to the south-east coast? It sails soon, very soon! We’re still loading it.', '¿El barco a la costa del sureste? ¡Sale pronto, muy pronto! Todavía lo estamos cargando.', 'O navio para a costa sudeste? Sai logo, logo! A gente ainda está carregando.', 'Das Schiff zur Südostküste? Es fährt bald, ganz bald! Wir laden es noch.',
      '[去|qù] [东南|dōng nán] [海岸|hǎi àn] [的|de] [船|chuán] ？ [很|hěn] [快|kuài] [就|jiù] [开|kāi] ！ [我们|wǒ men] [还在|hái zài] [装|zhuāng] [货|huò] 。', '[南東|なんとう] の [海岸|かいがん] へ の [船|ふね] ？ もうすぐ [出|で]る よ ！ まだ [荷物|にもつ] を [積|つ]んで る ところ だ 。'),
    'q.board': T('A {w.ticket}? Perfect. All aboard! Next stop: the south-east coast.', '¿Boleto? Perfecto. ¡Todos a bordo! Próxima parada: la costa del sureste.', 'Passagem? Perfeito. Todos a bordo! Próxima parada: a costa sudeste.', 'Fahrkarte? Prima. Alle an Bord! Nächster Halt: die Südostküste.',
      '[有|yǒu] [票|piào] ？ [太好了|tài hǎo le] 。 [大家|dà jiā] [上船|shàng chuán] ！ [下|xià] [一|yī] [站|zhàn] ： [东南|dōng nán] [海岸|hǎi àn] 。', 'きっぷ ？ よし 。 みんな [乗|の]って ！ [次|つぎ] は [南東|なんとう] の [海岸|かいがん] だ 。'),
  };
  // the townsfolk: gray and quiet until the harbor bell, then glad
  const FOLK_HUSHED = T('So *quiet*… all *gray*… the *bell*…', 'Qué *silencio*… todo *gris*… la *campana*…', 'Que *silêncio*… tudo *cinza*… o *sino*…', 'So *still*… alles *grau*… die *Glocke*…', '[好|hǎo] [安静|ān jìng] … [都|dōu] [是|shì] [灰色|huī sè] … [钟|zhōng] …', '[静|しず]か … [灰色|はいいろ] … [鐘|かね] …');
  const FOLK = [
    T('The {w.bell}! I thought I’d never hear it again.', '¡La campana! Pensé que nunca la iba a volver a oír.', 'O sino! Achei que nunca mais ia ouvir.', 'Die Glocke! Ich dachte, ich höre sie nie wieder.', '[钟声|zhōng shēng] ！ [我|wǒ] [还|hái] [以为|yǐ wéi] [再也|zài yě] [听不到|tīng bu dào] [了|le] 。', '[鐘|かね] だ ！ もう [二度|にど] と [聞|き]けない と [思|おも]って た 。'),
    T('Fresh fish, fresh bread, fresh air! Port Brisa’s awake!', '¡Pescado fresco, pan fresco, aire fresco! ¡Puerto Brisa despertó!', 'Peixe fresco, pão fresco, ar fresco! O Porto Brisa acordou!', 'Frischer Fisch, frisches Brot, frische Luft! Port Brisa ist wach!', '[新鲜|xīn xiān] [的|de] [鱼|yú] ， [新鲜|xīn xiān] [的|de] [面包|miàn bāo] ， [新鲜|xīn xiān] [的|de] [空气|kōng qì] ！ [微风港|Wēi fēng gǎng] [醒|xǐng] [了|le] ！', '[新鮮|しんせん] な [魚|さかな] 、 [焼|や]きたて の パン 、 [新鮮|しんせん] な [空気|くうき] ！ ブリサ [港|こう] が [目|め]を[覚|さ]ました ！'),
    T('Where are you going next? Wherever it is, go by {w.sea}!', '¿Adónde van ahora? ¡Vayan adonde vayan, vayan por mar!', 'Para onde vocês vão agora? Seja onde for, vão por mar!', 'Wohin geht’s als Nächstes? Egal wohin: übers Meer!', '[你们|nǐ men] [接下来|jiē xià lái] [去|qù] [哪里|nǎ lǐ] ？ [不管|bù guǎn] [去|qù] [哪里|nǎ lǐ] ， [坐|zuò] [船|chuán] [去|qù] [吧|ba] ！', '[次|つぎ] は どこ に [行|い]く の ？ どこ でも 、 [船|ふね] で [行|い]き なさい ！'),
    T('My grandma says the gulls remember every face. They’ll remember yours!', 'Mi abuela dice que las gaviotas se acuerdan de todas las caras. ¡De la tuya también!', 'A minha avó diz que as gaivotas lembram de todos os rostos. Do seu também!', 'Meine Oma sagt, die Möwen merken sich jedes Gesicht. Deins auch!', '[我|wǒ] [奶奶|nǎi nai] [说|shuō] [海鸥|hǎi ōu] [记得|jì de] [每|měi] [一|yī] [张|zhāng] [脸|liǎn] 。 [也|yě] [会|huì] [记得|jì de] [你|nǐ] [的|de] ！', 'おばあちゃん が 、 カモメ は みんな の [顔|かお] を [覚|おぼ]えて る って 。 あなた の [顔|かお] も ね ！'),
  ];
  Object.assign(P, { LINES: PL, FOLK, FOLK_HUSHED, NEW_WORDS, CALL, registerWords, T });
})();
// ================================================================ (parked here: the game side — init, the scenes, interactables, target / wayIn, tick, sync —
// isn't written yet, and nothing loads this file: it isn't in index.html, and world.js, world3d.js, main.js, quests.js and
// minimap.js have no PORT hooks yet. battle/lang.js's crab-and-call block and flow.js's «from behind» reader wait for PORT.)
