'use strict';
// The Sunken Ruins (DESIGN.md 14.1, region 7; 17.1; game/REGIONS.md): the seventh bell, far down the coast from Port Brisa,
// in a red-rock desert canyon you can only reach by ship. «El Viento Sur» sails out of a sea cave into a cove and ties up at
// a little pier. Up a gully (a sand slide blocks it: Fermín the digger shows Mimo «cava / cava / grab», 挖, 掘って) lies the
// archaeologists' camp, gray and still: the Hush came as a sandstorm and buried everyone's things. Mimo digs them up and you
// give each one back to its owner in a sentence («¡Es tu despertador!»: possessives), and each wakes up and gets on with the
// morning («¡Me levanto!»: reflexives, heard). North of the camp, the old town's Wall of Days tells, in six carved panels, the
// day of the bell-keeper who rang the temple's bell (reading: input, in the reflexive). The temple itself sank long ago:
// only its top shows above the sand, and its Door of Days opens for whoever tells it their own morning («Me levanto. Me lavo
// la cara…»: the pattern, used). Inside (ruins_temple.js) the sunken temple goes down four halls to its bell, the seventh.
// Sand worms (battle/flow.js) burrow: hit them when they're up, or dig them out («¡Cava!»).
//
// One global, RUINS, shaped like PEAKS:
//   plain data, ready before world.js: layout, landmarks, hush, roamers, open(state) (the ship sails), LANDING (the pier),
//     ground(x, z, h), playDist(x, z), keepClear(x, z, pad), bareAt(x, z), tint(x, z, color, slope, h), areaAt(x, z),
//     songAt(x, z), drawMap(ctx, o), walkDist, openDist, waterDist
//   ruins.js also holds the words, icons, lines (en weave + es pt de zh ja) and the graders (gradeYours: possessives;
//     gradeRoutine: reflexive routines, first or third person)
//   ruins_scenes.js: RUINS.build(scene, { terrainAt }) and the game side (arrive(), leave(), init(game), interactables(),
//     target(), tick(), sync(); state in state.ruins)
//   ruins_temple.js: RUINS_TEMPLE, the sunken temple (four rooms at y 300, x 262)
//   ruins_battle.js: the sand worm and «cava» in battle (data, model, arena, rewards), and the region's two songs
// Flags: ruins (arrived), ruinsDig (Fermín's demonstration), ruinsSlide (the gully dug open), ruinsChief (Elvira, the head
//   archaeologist), ruinsThings (the four things given back), ruinsWall (the six panels read), ruinsDoor (the Door of Days
//   open), ruinsFree (the temple's bell: bells → 7), ruinsReport (the report to Elvira). Progress in state.ruins.
// Needs THREE (r128), core.js and toonkit.js at load; caves.js (its Kit) and gardens.js (its people) at build; UI, STORY,
// WORLD, Sound at run time.

const RUINS = (() => {
  const INK = '#2b2235';

  // ================================================================ the way in: the ship from Port Brisa, after the sixth bell
  // (port.js: «El Viento Sur» at the long pier sails here with a ticket and calls RUINS.arrive(); this is the one place that
  // decides the ruins are open at all)
  const PORT_FLAG = 'portFree';
  const open = s => !!(s && s.flags && (s.flags[PORT_FLAG] || s.flags.ruins || (s.flags.bells || 0) >= 6));

  // ================================================================ the layout (pure data)
  // The canyon runs north–south in the south-east woods, between the floating rooms' columns (the lighthouse's at x 108, the
  // mine's at x 176): its floor x 121…163, z −23…48, the cove and the sea cave south of it. The land is shaped over REGION.
  const REGION = { x0: 78, x1: 216, zN: -47, zS: 80 };
  const FLOOR = 0.75, BED = -2.4;
  const E = (x, z, rx, rz) => ({ x, z, rx, rz });
  const ell = (e, x, z) => (Math.hypot((x - e.x) / e.rx, (z - e.z) / e.rz) - 1) * Math.min(e.rx, e.rz);
  // a rounded box: { x0, x1, z0, z1, r } (its signed distance)
  const rbox = (b, x, z) => {
    const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, hx = (b.x1 - b.x0) / 2 - b.r, hz = (b.z1 - b.z0) / 2 - b.r;
    const qx = Math.abs(x - cx) - hx, qz = Math.abs(z - cz) - hz;
    return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - b.r;
  };
  function segD(x, z, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1) : 0;
    return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
  }
  const polyD = (pts, x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segD(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; };
  // the floor: the beach on the cove, the gully up to the camp, the camp, the oasis, the old town (the Wall of Days on its west
  // side), a nook to the east, and the temple court at the north end
  const BEACH = E(137.5, 43.6, 15, 4.9);
  const CAMP = { x0: 133, x1: 160.5, z0: 8.4, z1: 28.6, r: 5 };
  const OASIS = E(130.6, 25.4, 7.4, 6.4);
  const OLD = { x0: 123.4, x1: 142.5, z0: -8.6, z1: 8.6, r: 3.4 };
  const NOOK = E(155.6, -2.4, 6.2, 5.6);
  const COURT = E(142, -15, 11.6, 7.9);
  const PATHS = [
    { w: 3.1, pts: [[140.6, 43.4], [142.4, 38], [144.2, 33.6], [145.8, 28.4]] },     // the gully, from the beach up to the camp (the slide sits in it)
    { w: 2.9, pts: [[140.4, 11.4], [137.2, 6.2]] },                                    // the camp → the old town
    { w: 3.1, pts: [[139.2, -6.4], [141.2, -9.4]] },                                   // the old town → the temple court
    { w: 2.5, pts: [[152.4, 9.0], [154.6, 2.6]] },                                     // the camp → the nook
  ];
  // the water: the cove, its channel out to the sea cave (under an arch), the oasis pool
  const COVE = E(136.5, 55.2, 13.6, 8.6);
  const CHANNEL = { ax: 136.5, az: 59.5, bx: 136.5, bz: 73, w: 4.4 };
  const POOL = { x: 130.3, z: 26.1, r: 3.3 };
  const CAVE = { x: 136.5, z: 64.8, w: 10.4, h: 11.6 };       // the sea cave's arch, facing north; the dark inside starts at z 66.6
  // the pier (the landing) on the cove's north shore, the ship tied up beside it (bow to the north), the gangplank between
  const PIER = { x: 143.2, z0: 45.0, z1: 56.4, w: 2.5, y: 0.82 };
  const SHIP = { x: 139.3, z: 53.9, yaw: Math.PI, len: 12, beam: 3.6 };
  const LANDING = { x: 143.2, z: 48.6, yaw: Math.PI };          // where RUINS.arrive() leaves you and Mimo: on the pier, facing the beach
  // the slide: sand that poured into the gully in the storm (Mimo digs it out)
  const SLIDE = { x: 143.5, z: 35.4, r: 3.4 };
  // the temple: only its top shows above the sand, at the north end of the court; its door (the Door of Days) faces south
  const TEMPLE = { x: 142, z: -25.2, w: 14, d: 5.2 };
  const DOOR = { x: 142, z: -22.5 };
  // the Wall of Days: a carved wall along the old town's west side, six panels facing east
  const WALL = { x: 123.0, z0: -6.2, z1: 6.2 };
  const PANELS = [5.15, 3.1, 1.05, -1.0, -3.05, -5.1].map((z, i) => ({ i, x: WALL.x + 0.34, z }));      // (I on the left as you face the wall)
  // the camp's things (front = local +z, rot = the mesh's rotation.y; w × d) — for the camera's spring arm too
  const B = (id, x, z, w, d, rot, kind) => ({ id, x, z, w, d, rot, kind, floors: 1 });
  const BUILDINGS = [
    B('canopy', 148.4, 14.2, 5.4, 3.8, 0, 'canopy'),
    B('tent1', 157.6, 21.6, 3.0, 3.4, -Math.PI / 2, 'tent'),
    B('tent2', 157.8, 14.6, 3.0, 3.4, -Math.PI / 2, 'tent'),
    B('tent3', 152.6, 26.4, 3.0, 3.4, Math.PI, 'tent'),
    B('temple', TEMPLE.x, TEMPLE.z, TEMPLE.w, TEMPLE.d, 0, 'temple'),
  ];
  // where things happen
  const SPOT = {
    landing: LANDING, pierFoot: { x: 143.2, z: 44.6 }, captain: { x: 144.1, z: 53.6, yaw: -Math.PI / 2 },
    ferminDig: { x: 142.1, z: 39.3, yaw: Math.PI - 0.25 }, slideFront: { x: 141.7, z: 39.6 }, slideWatch: { x: 140.2, z: 41.6 },
    ferminCamp: { x: 151.6, z: 22.6, yaw: Math.PI * 0.75 },
    elvira: { x: 148.4, z: 17.2, yaw: 0.15 }, campIn: { x: 145.6, z: 27.0 },
    hammock: { x: 138.3, z: 21.6 }, dario: { x: 138.3, z: 21.6, yaw: 0 }, fire: { x: 141.6, z: 25.6 },
    basin: { x: 136.2, z: 12.6 }, nadia: { x: 136.3, z: 13.9, yaw: Math.PI },
    desk: { x: 143.4, z: 10.4 }, salome: { x: 143.4, z: 11.6, yaw: Math.PI }, salomeWall: { x: 126.2, z: 0.4, yaw: -Math.PI / 2 },
    board: { x: 152.2, z: 10.6 }, gaspar: { x: 152.2, z: 11.9, yaw: Math.PI },
    tula: { x: 147.2, z: 23.6, yaw: 0.6 }, digsite: { x: 152.4, z: 21.6 },
    wallFront: { x: 126.0, z: 0 }, courtIn: { x: 142, z: -9.2 }, doorFront: { x: 142, z: -20.2 },
  };
  const OUTSIDE = { x: 142, z: -19.8, yaw: 0 };                 // where you come out of the temple (ruins_temple.js)
  // the things the storm buried (the possessive task): each with its owner, and the mound Mimo digs it out of
  const THINGS = [
    { id: 'alarm', word: 'w.alarm', owner: 'dario', at: { x: 128.3, z: 20.9 } },
    { id: 'towel', word: 'w.towel', owner: 'nadia', at: { x: 130.4, z: 41.8 } },
    { id: 'glasses', word: 'w.glasses', owner: 'salome', at: { x: 130.0, z: 3.6 } },
    { id: 'comb', word: 'w.comb', owner: 'gaspar', at: { x: 155.4, z: 25.2 } },
  ];
  // Tula's jar (a side quest): its four lost pieces
  const SHARDS = [{ id: 0, x: 157.8, z: -4.9 }, { id: 1, x: 134.4, z: -18.6 }, { id: 2, x: 149.0, z: 42.8 }, { id: 3, x: 125.6, z: 31.4 }];
  // (ja rōmaji capitalizes these names mid-sentence: CJK.md's table)
  if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['エルビラ', 'フェルミン', 'サロメ', 'ダリオ', 'ナディア', 'ガスパル', 'トゥラ', 'キノ']);
  // the sand worms (once the gully is dug open); fights in the desert arena (ruins_battle.js)
  const ROAMERS = [
    { x: 125.4, z: 44.2, area: 'ruins', biome: 'desert', foes: [{ kind: 'worm', color: 'yellow' }, { kind: 'worm', color: 'red' }] },      // (the beach's far end: away from the camp)
    { x: 150.8, z: -13.0, area: 'ruins', biome: 'desert', foes: [{ kind: 'worm', color: 'green' }, { kind: 'moth', color: 'yellow' }] },      // (the temple court)
    { x: 134.0, z: -15.4, area: 'ruins', biome: 'desert', foes: [{ kind: 'worm', color: 'blue' }, { kind: 'hushling', color: 'red' }] },
  ];
  // the gray over the camp and the old town (it lifts when the temple's bell rings)
  const HUSH = [{ x: 141.0, z: 5.0, r: 28, a: 0.5, ruins: true }];       // (the camp, the old town and the court; the cove and the gully stay bright)

  // ================================================================ distances
  function walkDist(x, z) {
    let d = Math.min(ell(BEACH, x, z), rbox(CAMP, x, z), ell(OASIS, x, z), rbox(OLD, x, z), ell(NOOK, x, z), ell(COURT, x, z));
    for (const p of PATHS) d = Math.min(d, polyD(p.pts, x, z) - p.w);
    return d;
  }
  const waterDist = (x, z) => Math.min(ell(COVE, x, z), segD(x, z, CHANNEL.ax, CHANNEL.az, CHANNEL.bx, CHANNEL.bz) - CHANNEL.w, Math.hypot(x - POOL.x, z - POOL.z) - POOL.r);
  const openDist = (x, z) => Math.min(walkDist(x, z), waterDist(x, z));
  const inBox = (x, z, pad = 0) => x > REGION.x0 - pad && x < REGION.x1 + pad && z > REGION.zN - pad && z < REGION.zS + pad;
  // how much of the canyon's shape a spot takes: 1 in the canyon and on its mesas, easing back into the woods' own ground 19…33
  // units out from the canyon (a wavy line, so the mesas have no straight edge), and sooner to the north, toward the Bloom Gardens
  // (the south runs on to the map's edge, where the land rises anyway)
  function boxK(x, z, od) {
    if (!inBox(x, z)) return 0;
    if (od === undefined) od = openDist(x, z);
    const n = 3.5 * Math.sin(x * 0.083 + 0.7) + 2.5 * Math.sin(z * 0.071 + 1.9) + 1.5 * Math.sin((x + z) * 0.19);
    return (1 - smoothstep(19 + n, 33 + n, od)) * smoothstep(-46 + n * 0.4, -32 + n * 0.4, z) * smoothstep(REGION.x0, REGION.x0 + 6, x) * (1 - smoothstep(REGION.x1 - 6, REGION.x1, x));
  }

  // ================================================================ the ground (world.js rawHeight)
  // A floor of sand, the beach sloping into the cove (deep: only the ship gets out there), and steep red walls in layers that
  // rise about 17 in six units and on to a mesa about 24 up (the map's edge rises further still past z 66)
  function canyonH(x, z) {
    const od = openDist(x, z), wd = waterDist(x, z);
    let y = FLOOR + 0.13 * Math.sin(x * 0.31 + z * 0.17) * Math.sin(z * 0.23 - 0.4) + 0.08 * Math.sin(x * 0.9 + 1.3) * Math.sin(z * 0.7);
    if (wd < 2.6) y = lerp(y, -0.25, smoothstep(2.6, 0.15, wd));
    if (wd < 0.15) y = lerp(-0.25, BED, smoothstep(0.15, -3.4, wd));
    if (od > 0) {
      const n = 1.3 * Math.sin(x * 0.19 + 1.1) * Math.sin(z * 0.23 + 0.3) + 0.7 * Math.sin(x * 0.53 - z * 0.41) + 0.35 * Math.sin(x * 1.3 + z * 0.9);
      let w = 1.5 * smoothstep(0, 0.8, od) + 15.5 * smoothstep(0.8, 6.0, od) + 6.6 * smoothstep(6, 18, od);
      // ledges: the rock weathers in layers, so the wall steps a little every ~2.8 up
      const step = 2.8, k = w / step, f = k - Math.floor(k);
      w = (Math.floor(k) + smoothstep(0.25, 0.75, f)) * step * 0.35 + w * 0.65;
      y = Math.max(y, FLOOR) + w + n * smoothstep(2, 7, od);
    }
    return y;
  }
  function ground(x, z, h) {
    if (!inBox(x, z)) return h;
    const k = boxK(x, z); if (k <= 0) return h;
    // (out on the mesa's far slopes the woods' ground comes back up under it, so the rock meets it without a step)
    return lerp(Math.max(h, 0.3), canyonH(x, z), k);
  }
  // how far from anywhere you're meant to be (negative inside). Past a few units it jumps past world.js's tree wall (> 26),
  // so the rock stays bare: the edges are invisible solids instead (ruins_scenes.js edgeWalls)
  function playDist(x, z) {
    if (!inBox(x, z, 6)) return 1e9;
    const d = Math.min(walkDist(x, z), waterDist(x, z) + 1.5);
    return d > 4 ? 30 + d : d;
  }
  // world.js open() (and the ferns, mushrooms and flowers): nothing of the woods grows anywhere in the canyon
  const KEEP = [];
  function keepClear(x, z, pad = 0) {
    if (!inBox(x, z, 4 + pad)) return false;
    return boxK(x, z) > 0.05;
  }
  // world.js townBare (0..1): no grass on the sand or the rock; a little, dry, up on the mesa's far side
  function bareAt(x, z) {
    if (!inBox(x, z)) return 0;
    const od = openDist(x, z), k = boxK(x, z, od);
    return k * (od < 16 ? 1 : 1 - 0.55 * smoothstep(16, 28, od));
  }
  // world3d.js's terrain tint: sand on the floor (darker and wet by the water, pale on the paths), red rock in bands up the
  // walls, a dusty olive on the mesa top far from the canyon (c: the color so far, a THREE.Color; sl: the slope; h: the height)
  const SAND = new THREE.Color('#e9c98d'), SAND2 = new THREE.Color('#dcb878'), WET = new THREE.Color('#bf9a62'), PATHC = new THREE.Color('#f1dcae');
  const STRATA = ['#c8643c', '#d9834f', '#b4532f', '#e3a76c', '#c96f45', '#a9492c', '#d99460'].map(c => new THREE.Color(c));
  const MESA = new THREE.Color('#c9905a'), OLIVE = new THREE.Color('#9c9a5c'), CLIFF = new THREE.Color('#8f3f28');
  const _c = new THREE.Color(), _d = new THREE.Color();
  function tint(x, z, c, sl = 0, h = 0) {
    if (!inBox(x, z, 2)) return;
    const od = openDist(x, z), k = boxK(x, z, od); if (k <= 0) return;
    const wd = waterDist(x, z);
    if (od < 0.9 && h < FLOOR + 1.2) {
      _c.copy(SAND).lerp(SAND2, 0.5 + 0.5 * Math.sin(x * 0.27 + Math.cos(z * 0.19) * 2.2));
      let p = 0; for (const q of PATHS) p = Math.max(p, 1 - smoothstep(0.6, 1.8, polyD(q.pts, x, z)));
      _c.lerp(PATHC, p * 0.55);
      _c.lerp(WET, 1 - smoothstep(-0.6, 1.4, wd));
    } else {
      const band = Math.floor((h - FLOOR) / 2.6 + Math.sin(x * 0.07 + z * 0.05) * 0.6);
      _c.copy(STRATA[((band % STRATA.length) + STRATA.length) % STRATA.length]);
      _d.copy(STRATA[(((band + 1) % STRATA.length) + STRATA.length) % STRATA.length]);
      _c.lerp(_d, 0.25 + 0.25 * Math.sin(x * 0.4 - z * 0.3));
      _c.lerp(CLIFF, smoothstep(1.4, 2.8, sl) * 0.35);
      const top = smoothstep(14, 19, od) * (1 - smoothstep(0.3, 1.0, sl));
      _c.lerp(MESA, top * 0.6);
      _c.lerp(OLIVE, smoothstep(17, 30, od) * (1 - smoothstep(0.3, 1.0, sl)) * 0.7);
    }
    c.lerp(_c, k);
  }
  // the mini-map's area names
  const AREAS = { cove: { id: 'ruinscove', name: 'The Sunken Cove', color: '#3f8fb5' }, camp: { id: 'ruinscamp', name: 'The Dig Camp', color: '#c9784a' },
    old: { id: 'ruinsold', name: 'The Old Town', color: '#b4632f' }, court: { id: 'ruinscourt', name: 'The Sunken Temple', color: '#9a5a8a' }, canyon: { id: 'ruins', name: 'The Sunken Ruins', color: '#c8643c' } };
  function areaAt(x, z) {
    if (!inBox(x, z)) return null;
    if (openDist(x, z) > 6) return null;
    if (ell(COURT, x, z) < 2.5 || z < -9.5) return AREAS.court;
    if (rbox(OLD, x, z) < 2 || ell(NOOK, x, z) < 2) return AREAS.old;
    if (rbox(CAMP, x, z) < 2.5 || ell(OASIS, x, z) < 2) return AREAS.camp;
    if (z > 37) return AREAS.cove;
    return AREAS.canyon;
  }
  // the music: the canyon's own song outdoors, and the temple's inside it (ruins_battle.js adds them)
  const has = n => typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(n);
  function songAt(x, z) {
    if (typeof RUINS_TEMPLE !== 'undefined' && RUINS_TEMPLE.inside) return has('ruins_temple') ? 'ruins_temple' : 'mill';
    if (!inBox(x, z) || openDist(x, z) > 10) return null;
    return has('ruins') ? 'ruins' : 'molinar';
  }
  // the mini-map's picture (minimap.js drawLand, in world units): the rock, the sand, the water, the roofs, the temple
  function drawMap(c, o = {}) {
    const PX = o.PX || 0.33, INKC = o.INK || INK;
    c.save();
    c.lineJoin = 'round'; c.lineCap = 'round';
    for (let x = REGION.x0; x < REGION.x1; x += 2) for (let z = -40; z < 76; z += 2) {
      const od = openDist(x, z), k = boxK(x, z, od); if (k < 0.1) continue;
      const wd = waterDist(x, z);
      if (wd < 0) continue;                                         // (the water draws itself)
      c.globalAlpha = Math.min(0.92, k);
      c.fillStyle = od < 0.6 ? '#ecd09a' : od < 4 ? '#c8643c' : od < 12 ? '#b9603c' : '#c49064';
      c.fillRect(x - 1, z - 1, 2.1, 2.1);
    }
    c.globalAlpha = 1;
    // the paths
    for (const p of PATHS) { c.strokeStyle = '#f6e6c0'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(p.pts[0][0], p.pts[0][1]); for (let i = 1; i < p.pts.length; i++) c.lineTo(p.pts[i][0], p.pts[i][1]); c.stroke(); }
    // the pier and the ship
    c.fillStyle = '#9a7048'; c.fillRect(PIER.x - PIER.w / 2, PIER.z0, PIER.w, PIER.z1 - PIER.z0);
    c.save(); c.translate(SHIP.x, SHIP.z); c.fillStyle = '#2f3f5a'; c.strokeStyle = INKC; c.lineWidth = 1.2 * PX;
    c.beginPath(); c.moveTo(0, -SHIP.len / 2 - 0.8); c.lineTo(SHIP.beam / 2, -SHIP.len / 2 + 1.6); c.lineTo(SHIP.beam / 2, SHIP.len / 2); c.lineTo(-SHIP.beam / 2, SHIP.len / 2); c.lineTo(-SHIP.beam / 2, -SHIP.len / 2 + 1.6); c.closePath(); c.fill(); c.stroke(); c.restore();
    // the tents and the canopy, with an ink edge
    for (const b of BUILDINGS) {
      if (b.kind === 'temple') continue;
      c.save(); c.translate(b.x, b.z); c.rotate(-(b.rot || 0)); c.fillStyle = b.kind === 'canopy' ? '#e9e0c8' : '#d8c08a'; c.strokeStyle = INKC; c.lineWidth = 1.2 * PX;
      c.beginPath(); c.rect(-b.w / 2, -b.d / 2, b.w, b.d); c.fill(); c.stroke(); c.restore();
    }
    // the temple's top, half in the sand
    c.fillStyle = '#d9b07a'; c.strokeStyle = INKC; c.lineWidth = 1.4 * PX;
    c.beginPath(); c.rect(TEMPLE.x - TEMPLE.w / 2, TEMPLE.z - TEMPLE.d / 2, TEMPLE.w, TEMPLE.d); c.fill(); c.stroke();
    c.fillStyle = '#7a3f5a'; c.beginPath(); c.arc(TEMPLE.x, TEMPLE.z, 1.3, 0, TAU); c.fill(); c.stroke();
    // the Wall of Days
    c.strokeStyle = '#8f3f28'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(WALL.x, WALL.z0); c.lineTo(WALL.x, WALL.z1); c.stroke();
    c.restore();
  }

  return {
    layout: { buildings: BUILDINGS, beach: BEACH, camp: CAMP, oasis: OASIS, old: OLD, nook: NOOK, court: COURT, cove: COVE, pier: PIER, ship: SHIP, temple: TEMPLE, door: DOOR, wall: WALL, paths: PATHS },
    landmarks: Object.assign({ camp: { x: 146.5, z: 18.5 }, cove: { x: COVE.x, z: COVE.z }, temple: TEMPLE, door: DOOR, slide: SLIDE }, SPOT),
    hush: HUSH, roamers: ROAMERS, open, PORT_FLAG, LANDING, OUTSIDE,
    ground, canyonH, playDist, keepClear, bareAt, tint, areaAt, songAt, drawMap, walkDist, openDist, waterDist, inBox, boxK, ell, rbox, polyD, segD,
    REGION, FLOOR, BED, BEACH, CAMP, OASIS, OLD, NOOK, COURT, PATHS, COVE, CHANNEL, POOL, CAVE, PIER, SHIP, SLIDE, TEMPLE, DOOR, WALL, PANELS, BUILDINGS, SPOT, THINGS, SHARDS, KEEP, AREAS, INK,
  };
})();

// ================================================================ words and icons (registered at load), and the two graders
// gradeYours(text, lang, thing, owner): giving a thing back to its owner, «¡Es tu despertador!» (the possessive: tu / tus, o seu /
//   a sua / os seus, dein / deine, 你的, 〇〇さんの). → { thing, ok, wrongThing, wrongWho, slips, soft, letter, reason, model }
// gradeRoutine(text, lang, { person: 1 | 3, want }): a morning routine, «Me levanto.» (1) or «Se levanta.» (3): the reflexive
//   (me / se, mich / sich, …). → { key (getup, wake, wash, brush, shower, dress, comb, dry, sleep, eat), refl, ok, slips, soft,
//   letter, reason, model }. Each kind of slip counts once (a major one twice): 0 → S (A with only a soft note), 1 B, 2 C, 3+ D.
(() => {
  const C = RUINS;
  const W = (id, es, pt, de, zh, ja, en, g, o = {}) => Object.assign({ id, kind: o.kind || 'word', es, pt, de, zh, ja, en, g, icon: o.icon || id.split('.')[1] }, o.more || {});
  const NEW_WORDS = [
    W('w.sand', 'arena', 'areia', 'Sand', '[沙子|shā zi]', '[砂|すな]', 'sand', { es: 'f', pt: 'f', de: 'm' }, { more: { pl: { es: 'arenas', pt: 'areias', de: 'Sand', zh: '[沙子|shā zi]', ja: '[砂|すな]' }, alt: { zh: ['[沙|shā]'] } } }),
    W('w.alarm', 'despertador', 'despertador', 'Wecker', '[闹钟|nào zhōng]', 'めざまし', 'alarm clock', { es: 'm', pt: 'm', de: 'm' }, { more: { enPl: 'alarm clocks', pl: { es: 'despertadores', pt: 'despertadores', de: 'Wecker', zh: '[闹钟|nào zhōng]', ja: 'めざまし' }, cl: { zh: '[个|gè]', ja: '[個|こ]' }, alt: { ja: ['[目覚|めざ]まし', 'めざまし[時計|どけい]'] } } }),
    W('w.towel', 'toalla', 'toalha', 'Handtuch', '[毛巾|máo jīn]', 'タオル', 'towel', { es: 'f', pt: 'f', de: 'n' }, { more: { pl: { es: 'toallas', pt: 'toalhas', de: 'Handtücher', zh: '[毛巾|máo jīn]', ja: 'タオル' }, cl: { zh: '[条|tiáo]', ja: '[枚|まい]' } } }),
    W('w.glasses', 'lentes', 'óculos', 'Brille', '[眼镜|yǎn jìng]', 'めがね', 'glasses', { es: 'm', pt: 'm', de: 'f' }, { more: { enPl: 'glasses', art: { es: 'los', pt: 'os' }, pl: { es: 'lentes', pt: 'óculos', de: 'Brillen', zh: '[眼镜|yǎn jìng]', ja: 'めがね' }, cl: { zh: '[副|fù]' }, alt: { es: ['anteojos', 'gafas', 'los anteojos', 'las gafas'], ja: ['[眼鏡|めがね]', 'メガネ'] } } }),
    W('w.comb', 'peine', 'pente', 'Kamm', '[梳子|shū zi]', 'くし', 'comb', { es: 'm', pt: 'm', de: 'm' }, { more: { pl: { es: 'peines', pt: 'pentes', de: 'Kämme', zh: '[梳子|shū zi]', ja: 'くし' }, cl: { zh: '[把|bǎ]', ja: '[本|ほん]' }, alt: { ja: ['[櫛|くし]'] } } }),
    W('w.temple', 'templo', 'templo', 'Tempel', '[神庙|shén miào]', '[神殿|しんでん]', 'temple', { es: 'm', pt: 'm', de: 'm' }, { more: { pl: { es: 'templos', pt: 'templos', de: 'Tempel', zh: '[神庙|shén miào]', ja: '[神殿|しんでん]' }, cl: { zh: '[座|zuò]' } } }),
    W('w.jar', 'vasija', 'jarro', 'Krug', '[罐子|guàn zi]', 'つぼ', 'jar', { es: 'f', pt: 'm', de: 'm' }, { more: { pl: { es: 'vasijas', pt: 'jarros', de: 'Krüge', zh: '[罐子|guàn zi]', ja: 'つぼ' }, cl: { zh: '[个|gè]', ja: '[個|こ]' }, alt: { es: ['jarra', 'jarrón'], pt: ['jarra', 'vaso'], ja: ['[壺|つぼ]'] } } }),
    W('w.shovel', 'pala', 'pá', 'Schaufel', '[铲子|chǎn zi]', 'スコップ', 'shovel', { es: 'f', pt: 'f', de: 'f' }, { more: { pl: { es: 'palas', pt: 'pás', de: 'Schaufeln', zh: '[铲子|chǎn zi]', ja: 'スコップ' }, cl: { zh: '[把|bǎ]', ja: '[本|ほん]' } } }),
  ];
  // dig: Mimo learns it from Fermín at the sand slide (the battle registers the same verb: whichever comes first keeps its object)
  const DIG = { id: 'v.dig', kind: 'verb', es: 'cava', pt: 'cava', de: 'grab', zh: '[挖|wā]', ja: '[掘|ほ]って', en: 'dig', icon: 'dig',
    alt: { es: ['cave', 'cavá', 'excava', 'excave', 'cavale', 'cávale'], pt: ['cave', 'cavar', 'escava', 'escave', 'cavuca'], de: ['grabe', 'grabt', 'graben', 'buddel', 'buddle'], zh: ['[挖开|wā kāi]', '[挖出来|wā chū lái]'], ja: ['[掘|ほ]れ', '[掘|ほ]る', '[掘|ほ]ります'] } };
  function registerWords() {
    if (typeof LEX === 'undefined') return;
    LEX.register(NEW_WORDS.filter(w => !LEX.item(w.id)));
    const it = LEX.item('v.dig');
    if (!it) LEX.register([DIG]);
    else { it.icon = 'dig'; it.alt = it.alt || {}; for (const l of Object.keys(DIG.alt)) it.alt[l] = Array.from(new Set([...(it.alt[l] || []), ...DIG.alt[l]])); for (const l of ['es', 'pt', 'de', 'zh', 'ja']) if (!it[l]) it[l] = DIG[l]; }
  }
  registerWords();
  // icons (ICONS.add: drawn twice, pass 0 the paper border, pass 1 colors and ink, in a 100 × 100 box)
  if (typeof ICONS !== 'undefined') {
    const add = (k, fn) => { if (!ICONS.keys.includes(k)) ICONS.add(k, fn); };
    add('dig', (c, p, h) => {        // a little shovel in a heap of sand
      h.shape(c, p, h.ell(4, 26, 34, 12), '#e9c98d');
      h.shape(c, p, h.rr(-6, -38, 7, 44, 3), '#8a5f3e');
      h.shape(c, p, h.poly([[-14, 2], [8, 2], [6, 22], [-3, 30], [-12, 22]]), '#a9b4c2');
      if (p) { c.strokeStyle = h.INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-10, -38); c.lineTo(4, -38); c.stroke(); [[-26, 18], [30, 14], [24, 28]].forEach(([x, y]) => h.dot(c, x, y, 3, '#c9a46a')); }
    });
    add('sand', (c, p, h) => { h.shape(c, p, h.poly([[-38, 26], [-12, -6], [6, 6], [24, -14], [40, 26]]), '#e9c98d'); if (p) { c.strokeStyle = '#c9a46a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-20, 14); c.quadraticCurveTo(-8, 8, 4, 16); c.stroke(); c.beginPath(); c.moveTo(10, 4); c.quadraticCurveTo(20, -2, 30, 8); c.stroke(); } });
    add('alarm', (c, p, h) => {      // an alarm clock with two bells on top
      for (const s of [-1, 1]) h.shape(c, p, h.ell(s * 18, -26, 11, 9), '#e6b84a');
      h.shape(c, p, h.ell(0, 6, 30, 30), '#e2574c'); h.shape(c, p, h.ell(0, 6, 23, 23), '#fffaf0');
      if (p) { c.strokeStyle = h.INK; c.lineCap = 'round'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -10); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(0, 6); c.lineTo(12, 12); c.stroke(); c.beginPath(); c.moveTo(-18, 36); c.lineTo(-24, 44); c.moveTo(18, 36); c.lineTo(24, 44); c.stroke(); }
    });
    add('towel', (c, p, h) => { h.shape(c, p, h.rr(-30, -28, 60, 56, 8), '#5fb2c9'); h.shape(c, p, h.rr(-30, 14, 60, 8, 2), '#f4efe2'); h.shape(c, p, h.rr(-30, -20, 60, 6, 2), '#f4efe2'); });
    add('glasses', (c, p, h) => {
      for (const s of [-1, 1]) h.shape(c, p, h.ell(s * 18, 4, 14, 12), '#bfe3f2');
      if (p) { c.strokeStyle = h.INK; c.lineWidth = 4; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 18, 4, 14, 12, 0, 0, TAU); c.stroke(); } c.beginPath(); c.moveTo(-4, 2); c.quadraticCurveTo(0, -4, 4, 2); c.stroke(); c.beginPath(); c.moveTo(-32, 0); c.lineTo(-40, -8); c.moveTo(32, 0); c.lineTo(40, -8); c.stroke(); }
    });
    add('comb', (c, p, h) => { h.shape(c, p, h.rr(-34, -18, 68, 14, 5), '#d9a24a'); if (p) { c.strokeStyle = '#a8732a'; c.lineWidth = 3.4; for (let i = 0; i < 12; i++) { const x = -30 + i * 5.5; c.beginPath(); c.moveTo(x, -4); c.lineTo(x, 20); c.stroke(); } } });
    add('temple', (c, p, h) => {
      h.shape(c, p, h.poly([[-38, -12], [0, -36], [38, -12]]), '#e3a76c'); h.shape(c, p, h.rr(-34, -12, 68, 8, 2), '#d9834f');
      for (const x of [-26, -9, 9, 26]) h.shape(c, p, h.rr(x - 4, -4, 8, 34, 2), '#f0d2a0');
      h.shape(c, p, h.rr(-38, 28, 76, 8, 2), '#c96f45');
    });
    add('jar', (c, p, h) => { h.shape(c, p, h.ell(0, 10, 24, 26), '#c96f45'); h.shape(c, p, h.rr(-10, -30, 20, 14, 3), '#c96f45'); h.shape(c, p, h.rr(-14, -34, 28, 6, 3), '#a9492c'); if (p) { c.strokeStyle = '#f0d2a0'; c.lineWidth = 3; c.beginPath(); c.moveTo(-20, 6); c.quadraticCurveTo(0, 0, 20, 6); c.stroke(); h.dot(c, 0, 18, 4, '#f0d2a0'); } });
    add('shovel', (c, p, h) => { h.shape(c, p, h.rr(-4, -40, 8, 46, 3), '#8a5f3e'); h.shape(c, p, h.poly([[-14, 4], [14, 4], [12, 26], [0, 38], [-12, 26]]), '#a9b4c2'); });
    add('ship', (c, p, h) => { h.shape(c, p, h.poly([[-40, 8], [40, 8], [30, 28], [-32, 28]]), '#2f3f5a'); h.shape(c, p, h.rr(-3, -38, 5, 46, 2), '#5a3a24'); h.shape(c, p, h.poly([[4, -34], [28, 4], [4, 4]]), '#f6f1e6'); h.shape(c, p, h.rr(-40, 18, 80, 5, 2), '#a8332c'); });
  }

  // ---------------------------------------------------------------- helpers
  const nrm = s => String(s).toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const canonOf = (t, l) => { try { return typeof CJK !== 'undefined' && CJK.canon ? CJK.canon(t, l) : String(t).toLowerCase().replace(/\s+/g, ''); } catch (e) { return String(t).toLowerCase(); } };
  const flatOf = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  function near1(a, b) {
    if (a === b) return true;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1 || Math.min(la, lb) < 4) return false;
    let i = 0; while (i < la && i < lb && a[i] === b[i]) i++;
    if (la === lb) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
    return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  }
  const kit = out => ({
    slip: (kind, why, major) => { if (!out.slips.some(s => s.kind === kind)) out.slips.push({ kind, why, major: !!major }); },
    soft: (kind, why) => { if (!out.soft.some(s => s.kind === kind)) out.soft.push({ kind, why }); },
  });
  function finish(out) {
    let n = 0; for (const s of out.slips) n += s.major ? 2 : 1;
    // (an accent or an umlaut is a tip, never a grade: P6a, accents.js)
    const sp = typeof ACCENTS !== 'undefined' ? ACCENTS.split(out.soft) : { soft: out.soft, tip: '' };
    out.letter = n === 0 ? (sp.soft.length ? 'A' : 'S') : n === 1 ? 'B' : n === 2 ? 'C' : 'D';
    out.reason = out.letter === 'S' ? 'Perfect sentence!' + (sp.tip ? ' · ' + sp.tip : '') : out.letter === 'A' ? sp.soft[0].why : out.slips[0].why;
    out.tip = sp.tip;
    return out;
  }
  const cjOf = l => l === 'zh' || l === 'ja';
  // a phrase in the notation as a note's text: «你的梳子 (nǐ de shūzi)», whatever mode the player reads in
  const cjs = (src, l) => {
    try { const ch = CJK.chars(src, { lang: l, register: false }).replace(/\s+/g, ''), ro = CJK.roman(src, { lang: l, register: false }).trim(); return ch === ro ? ch : `${ch} (${ro})`; }
    catch (e) { return String(src).replace(/\[([^|\]]+)\|[^\]]*\]/g, '$1').replace(/\s+/g, ''); }
  };

  // ---------------------------------------------------------------- the four things, and their owners
  const OWNERS = {
    dario: { name: 'Darío', g: 'm', zh: '[达里奥|Dá lǐ ào]', ja: 'ダリオ', zk: ['达里奥', 'daliao'], jk: ['ダリオ', 'dario'] },
    nadia: { name: 'Nadia', g: 'f', zh: '[娜迪娅|Nà dí yà]', ja: 'ナディア', zk: ['娜迪娅', 'nadiya'], jk: ['ナディア', 'nadia', 'nadhia'] },
    salome: { name: 'Salomé', g: 'f', zh: '[萨洛梅|Sà luò méi]', ja: 'サロメ', zk: ['萨洛梅', 'saluomei'], jk: ['サロメ', 'sarome', 'salome'] },
    gaspar: { name: 'Gaspar', g: 'm', zh: '[加斯帕尔|Jiā sī pà ěr]', ja: 'ガスパル', zk: ['加斯帕尔', 'jiasipaer'], jk: ['ガスパル', 'gasuparu', 'gaspar'] },
  };
  const NOUNS = {
    alarm: { en: 'alarm clock', es: { w: 'despertador', g: 'm', alt: ['reloj'] }, pt: { w: 'despertador', g: 'm', alt: ['relogio'] }, de: { w: 'wecker', W: 'Wecker', g: 'm' },
      zh: { w: '[闹钟|nào zhōng]', k: ['闹钟', 'naozhong'] }, ja: { w: 'めざまし', k: ['めざまし', '目覚まし', 'mezamashi', 'mezamasi'] } },
    towel: { en: 'towel', es: { w: 'toalla', g: 'f' }, pt: { w: 'toalha', g: 'f' }, de: { w: 'handtuch', W: 'Handtuch', g: 'n' },
      zh: { w: '[毛巾|máo jīn]', k: ['毛巾', 'maojin'] }, ja: { w: 'タオル', k: ['タオル', 'たおる', 'taoru'] } },
    glasses: { en: 'glasses', es: { w: 'lentes', g: 'm', pl: true, alt: ['anteojos'], altF: ['gafas'] }, pt: { w: 'oculos', show: 'óculos', g: 'm', pl: true }, de: { w: 'brille', W: 'Brille', g: 'f' },
      zh: { w: '[眼镜|yǎn jìng]', k: ['眼镜', 'yanjing'] }, ja: { w: 'めがね', k: ['めがね', '眼鏡', 'メガネ', 'megane'] } },
    comb: { en: 'comb', es: { w: 'peine', g: 'm' }, pt: { w: 'pente', g: 'm' }, de: { w: 'kamm', W: 'Kamm', g: 'm' },
      zh: { w: '[梳子|shū zi]', k: ['梳子', 'shuzi'] }, ja: { w: 'くし', k: ['くし', '櫛', 'kushi', 'kusi'] } },
  };
  // the model sentence (the "I don't know" box shows it)
  function yoursModel(id, l, owner) {
    const N = NOUNS[id], O = OWNERS[owner] || OWNERS.dario;
    if (l === 'es') { const n = N.es; return n.pl ? `¡Son tus ${n.w}!` : `¡Es tu ${n.w}!`; }
    if (l === 'pt') { const n = N.pt; return n.pl ? 'São os seus óculos!' : `É ${n.g === 'f' ? 'a sua' : 'o seu'} ${n.w}!`; }
    if (l === 'de') { const n = N.de; return `Das ist ${n.g === 'f' ? 'deine' : 'dein'} ${n.W}!`; }
    if (l === 'zh') return `[这|zhè] [是|shì] [你|nǐ] [的|de] ${N.zh.w} ！`;
    if (l === 'ja') return `${O.ja} さん の ${N.ja.w} です よ ！`;
    return `It’s your ${N.en}!`;
  }
  const YOURS_FRAME = { es: '«Es tu ___» · «Son tus ___»', pt: '«É o seu ___» · «É a sua ___»', de: '«Das ist dein ___» · «deine ___»', zh: '“ [这|zhè] [是|shì] [你|nǐ] [的|de] ___ ”', ja: '「 ___ さん の ___ です 」' };
  // which of the four things a sentence names (es / pt / de): { key, typo }
  function findNoun(t, l) {
    let best = null;
    for (const k of Object.keys(NOUNS)) {
      const N = NOUNS[k][l]; if (!N) continue;
      const forms = [N.w].concat(N.alt || [], N.altF || []);
      for (const tok of t) for (const f of forms) {
        const exact = tok === f, typo = !exact && near1(tok, f);
        if ((exact || typo) && (!best || (best.typo && exact))) best = { key: k, typo, form: f };
      }
    }
    return best;
  }
  function findNounCJ(text, l) {
    const raw = String(text), can = canonOf(text, l), flat = flatOf(text);
    for (const k of Object.keys(NOUNS)) { const list = NOUNS[k][l].k; if (list.some(w => raw.includes(w) || (/^[a-z]+$/.test(w) && (can.includes(w) || flat.includes(w))))) return { key: k }; }
    return null;
  }
  // ---------------------------------------------------------------- «¡Es tu despertador!»
  function gradeYours(text, l, id, owner) {
    const out = { thing: null, ok: false, wrongThing: false, wrongWho: null, slips: [], soft: [], letter: null, reason: '', model: yoursModel(id, l, owner) };
    const { slip, soft } = kit(out);
    const raw = String(text || ''), N = NOUNS[id], O = OWNERS[owner] || OWNERS.dario;
    if (cjOf(l)) {
      const can = canonOf(raw, l), flat = flatOf(raw), has = (chars, roms) => chars.some(c => raw.includes(c)) || roms.some(r => can.includes(r) || flat.includes(r));
      const th = findNounCJ(raw, l);
      if (th && th.key !== id) { out.thing = th.key; out.wrongThing = true; return out; }
      out.thing = id;
      if (l === 'zh') {
        const you = has(['你的', '您的'], ['nide', 'ninde']), name = has(O.zk.map(n => n + '的'), O.zk.filter(n => /^[a-z]+$/.test(n)).map(n => n + 'de'));
        const mine = has(['我的'], ['wode']), his = has(['他的', '她的'], ['tade']);
        if (!you && !name) { if (mine) { out.wrongWho = 'me'; return out; } if (his) { out.wrongWho = 'them'; return out; } if (!th) return out; slip('whose', `Say whose: «${cjs('[你|nǐ] [的|de] ' + N.zh.w, 'zh')}» (yours)`, true); }
        else if (name && !you) soft('name', `Talking to ${O.name}, «${cjs('[你|nǐ] [的|de]', 'zh')}» (your) is more natural`);
        if (!th) soft('thing', `Name the thing too: «${cjs('[这|zhè] [是|shì] [你|nǐ] [的|de] ' + N.zh.w, 'zh')}»`);
        else if (!has(['是'], ['shi'])) soft('verb', `A whole sentence: «${cjs('[这|zhè] [是|shì] [你|nǐ] [的|de] ' + N.zh.w, 'zh')}»`);
      } else {
        const name = has(O.jk.filter(n => !/^[a-z]+$/.test(n)), O.jk.filter(n => /^[a-z]+$/.test(n))), anata = has(['あなた'], ['anata']);
        const me = has(['わたし', '私', 'ぼく', '僕', 'おれ', '俺'], ['watashi', 'watasi', 'boku', 'ore']);
        const no = /の/.test(raw) || /no/.test(can.replace(/nos|non/g, ''));
        if (!name && !anata) { if (me) { out.wrongWho = 'me'; return out; } if (!th) return out; slip('whose', `Say whose: «${O.ja}さんの ${N.ja.w}»`, true); }
        else {
          if (!no) slip('particle', `の links the owner and the thing: «${O.ja}さんの ${N.ja.w}»`);
          if (anata && !name) soft('name', `Using the name, «${O.ja}さんの…», sounds more natural than あなたの`);
          else if (!/さん|san/.test(raw + ' ' + can)) soft('san', `Add さん to the name: «${O.ja}さん»`);
        }
        if (!th) soft('thing', `Name the thing too: «${O.ja}さんの ${N.ja.w}です»`);
        if (!/です|desu|desu/.test(raw + ' ' + can)) soft('polite', 'Add です (desu) to be polite');
      }
      out.ok = true;
      return finish(out);
    }
    const n = nrm(raw), t = n.split(' ').filter(Boolean), has = re => re.test(' ' + n + ' '), lo = raw.toLowerCase();
    const found = findNoun(t, l);
    if (found && found.key !== id) { out.thing = found.key; out.wrongThing = true; return out; }
    out.thing = id;
    const Nl = N[l] || N.es, pl = !!Nl.pl, isF = Nl.g === 'f' || (found && (Nl.altF || []).includes(found.form));
    if (found && found.typo) slip('spelling', `Spelling: «${Nl.show || Nl.W || Nl.w}»`);
    const names = ['dario', 'nadia', 'salome', 'gaspar'], other = names.find(nm => nm !== owner && has(new RegExp(`\\b${nm}\\b`)));
    if (l === 'es') {
      const two = has(/\btus?\b/) || has(/\btuy[oa]s?\b/), formal = has(/\bsus?\b/) || has(/\bsuy[oa]s?\b/), byName = has(new RegExp(`\\bde ${owner}\\b`)), one = has(/\bmis?\b/) || has(/\bmi[oa]s?\b/);
      if (other && has(new RegExp(`\\bde ${other}\\b`))) { out.wrongWho = other; return out; }
      if (!two && !formal && !byName) { if (one) { out.wrongWho = 'me'; return out; } if (!found) return out; slip('whose', `Say whose it is: «${pl ? 'tus' : 'tu'} ${Nl.w}»`, true); }
      else if (!two && formal) soft('formal', `«su» is polite (usted); between friends: «${pl ? 'tus' : 'tu'} ${Nl.w}»`);
      else if (!two && byName) soft('name', `To ${O.name}: «${pl ? 'tus' : 'tu'} ${Nl.w}»`);
      if (two) {
        if (pl && has(/\btu\b/) && !has(/\btus\b/)) slip('number', `«${Nl.w}» is plural: «tus ${Nl.w}»`);
        if (!pl && has(/\btus\b/)) slip('number', `One thing: «tu ${Nl.w}»`);
        if (has(/\b(el|la|los|las) tus?\b/)) slip('article', `No article before «tu»: «tu ${Nl.w}»`);
        if (/\btú\s/.test(lo + ' ')) soft('accent', '«tu» (your) has no accent; «tú» is “you”');
        const tuyo = (t.find(w => /^tuy[oa]s?$/.test(w)) || '');
        if (tuyo) { const want = 'tuy' + (isF ? 'a' : 'o') + (pl ? 's' : ''); if (tuyo !== want) slip('gender', `«${want}»: it agrees with «${Nl.w}»`); }
      }
      const es = has(/\bes\b/), son = has(/\bson\b/);
      if (pl && es && !son) slip('verb', `Plural: «Son tus ${Nl.w}»`);
      else if (!pl && son && !es) slip('verb', `One thing: «Es tu ${Nl.w}»`);
      else if (!es && !son) soft('whole', `A whole sentence: «${pl ? 'Son tus' : 'Es tu'} ${Nl.w}»`);
    } else if (l === 'pt') {
      const two = has(/\b(seu|sua|seus|suas|teu|tua|teus|tuas)\b/) || has(/\bde voce\b/), three = has(/\b(dele|dela)\b/), byName = has(new RegExp(`\\bd[oa] ${owner}\\b`)), one = has(/\b(meu|minha|meus|minhas)\b/);
      if (other && has(new RegExp(`\\bd[oa] ${other}\\b`))) { out.wrongWho = other; return out; }
      if (!two && !byName) { if (one) { out.wrongWho = 'me'; return out; } if (three) { out.wrongWho = 'them'; return out; } if (!found) return out; slip('whose', `Say whose it is: «${pl ? 'os seus' : isF ? 'a sua' : 'o seu'} ${Nl.show || Nl.w}»`, true); }
      else if (!two && byName) soft('name', `To ${O.name}: «${pl ? 'os seus' : isF ? 'a sua' : 'o seu'} ${Nl.show || Nl.w}»`);
      if (two) {
        const w = t.find(x => /^(seu|sua|seus|suas|teu|tua|teus|tuas)$/.test(x)) || '';
        const fem = /^(sua|suas|tua|tuas)$/.test(w), plu = /s$/.test(w) && w !== 'seu' && w !== 'teu' ? true : /^(seus|suas|teus|tuas)$/.test(w);
        if (w && fem !== isF) slip('gender', `«${Nl.show || Nl.w}» is ${isF ? 'feminine: «a sua»' : 'masculine: «o seu»'}`);
        if (w && pl && !plu) soft('number', '«óculos» is plural: «os seus óculos»');
        if (w && !pl && plu) slip('number', `One thing: «${isF ? 'a sua' : 'o seu'} ${Nl.show || Nl.w}»`);
      }
      const eh = /(^|[\s¡¿])é(\s|$)/i.test(raw) || t[0] === 'e', sao = has(/\bsao\b/);
      if (!eh && !sao) soft('whole', `A whole sentence: «${pl ? 'São os seus' : isF ? 'É a sua' : 'É o seu'} ${Nl.show || Nl.w}»`);
      else if (pl && eh && !sao) soft('number', '«óculos» is plural: «São os seus óculos»');
      else if (!pl && sao && !eh) slip('verb', `One thing: «É ${isF ? 'a sua' : 'o seu'} ${Nl.w}»`);
      if (eh && !/é/i.test(raw)) soft('accent', 'Accent: «é» (is); «e» is “and”');
      if (pl && /oculos/.test(n) && !/óculos/i.test(raw)) soft('accent', 'Accent: «óculos»');
    } else {
      const two = has(/\bdein(e|en|em|er|es)?\b/) || has(/\bgehort dir\b|\bgehoert dir\b/), three = has(/\b(sein|seine|seinen|ihr|ihre|ihren)\b/), one = has(/\b(mein|meine|meinen)\b/);
      const gen = has(new RegExp(`\\b${owner}s\\b`)) || has(new RegExp(`\\bvon ${owner}\\b`));
      if (other && (has(new RegExp(`\\b${other}s\\b`)) || has(new RegExp(`\\bvon ${other}\\b`)))) { out.wrongWho = other; return out; }
      if (!two && !gen) { if (one) { out.wrongWho = 'me'; return out; } if (three) { out.wrongWho = 'them'; return out; } if (!found) return out; slip('whose', `Say whose it is: «${isF ? 'deine' : 'dein'} ${Nl.W}»`, true); }
      else if (!two && gen) soft('name', `To ${O.name}: «${isF ? 'deine' : 'dein'} ${Nl.W}»`);
      if (two) {
        const w = t.find(x => /^dein(e|en|em|er|es)?$/.test(x)) || '';
        if (w === 'deinen' || w === 'deinem') slip('case', `After «ist» it's the first case: «${isF ? 'deine' : 'dein'} ${Nl.W}»`);
        else if (w === 'deine' && !isF) slip('gender', `«${Nl.g === 'n' ? 'das' : 'der'} ${Nl.W}»: «dein ${Nl.W}»`);
        else if (w === 'dein' && isF) slip('gender', `«die ${Nl.W}» is a die-word: «deine ${Nl.W}»`);
      }
      if (has(/\bsind\b/) && !has(/\bist\b/)) slip('verb', `One thing: «Das ist ${isF ? 'deine' : 'dein'} ${Nl.W}»`);
      else if (!has(/\bist\b/) && !has(/\bgehort\b|\bgehoert\b/)) soft('whole', `A whole sentence: «Das ist ${isF ? 'deine' : 'dein'} ${Nl.W}»`);
      if (found && !found.typo && new RegExp(`\\b${Nl.w}\\b`).test(raw)) soft('caps', `Nouns take a capital: «${Nl.W}»`);
    }
    out.ok = true;
    return finish(out);
  }

  // ---------------------------------------------------------------- the morning: «Me levanto.» (and «Se levanta.» about her)
  // per language: [key, first-person right, third-person right, reflexive?]; then the slips each language watches for
  const RT = {
    es: [
      ['getup', /\bme levanto\b/, /\bse levanta\b/, true], ['wake', /\bme despierto\b/, /\bse despierta\b/, true],
      ['brush', /\bme (lavo|cepillo) los dientes\b/, /\bse (lava|cepilla) los dientes\b/, true], ['wash', /\bme lavo\b/, /\bse lava\b/, true],
      ['shower', /\bme (ducho|bano)\b/, /\bse (ducha|bana)\b/, true], ['dress', /\bme visto\b|\bme pongo (la|el|los|las|mi|mis)\b/, /\bse viste\b|\bse pone (la|el|los|las|su|sus)\b/, true],
      ['comb', /\bme peino\b|\bme cepillo el pelo\b/, /\bse peina\b|\bse cepilla el pelo\b/, true], ['dry', /\bme seco\b/, /\bse seca\b/, true],
      ['sleep', /\bme acuesto\b|\bme duermo\b/, /\bse acuesta\b|\bse duerme\b/, true], ['eat', /\bdesayuno\b/, /\bdesayuna\b/, false],
    ],
    pt: [
      ['getup', /\bme levanto\b|\blevanto me\b/, /\bse levanta\b|\blevanta se\b/, true], ['wake', /\b(me )?acordo\b/, /\b(se )?acorda\b/, false],
      ['brush', /\bescovo os dentes\b/, /\bescova os dentes\b/, false], ['wash', /\bme lavo\b|\blavo me\b|\blavo (o rosto|a cara|as maos)\b/, /\bse lava\b|\blava se\b|\blava (o rosto|a cara|as maos)\b/, true],
      ['shower', /\btomo banho\b|\bme banho\b/, /\btoma banho\b|\bse banha\b/, false], ['dress', /\bme visto\b|\bvisto me\b|\b(visto|coloco|ponho) a roupa\b/, /\bse veste\b|\bveste se\b|\b(veste|coloca|poe) a roupa\b/, true],
      ['comb', /\bme penteio\b|\bpenteio me\b|\bpenteio o cabelo\b/, /\bse penteia\b|\bpenteia se\b|\bpenteia o cabelo\b/, true], ['dry', /\bme (enxugo|seco)\b/, /\bse (enxuga|seca)\b/, true],
      ['sleep', /\bme deito\b|\bdeito me\b|\bdurmo\b|\bvou dormir\b/, /\bse deita\b|\bdeita se\b|\bdorme\b|\bvai dormir\b/, true], ['eat', /\btomo (o )?cafe\b/, /\btoma (o )?cafe\b/, false],
    ],
    de: [
      ['getup', /\bich stehe\b.*\bauf\b/, /\b(sie|er) steht\b.*\bauf\b|\bsteht (sie|er)\b.*\bauf\b/, false], ['wake', /\bich wache\b.*\bauf\b/, /\b(sie|er) wacht\b.*\bauf\b/, false],
      ['brush', /\bich putze mir die z(ae|a)hne\b/, /\b(sie|er) putzt sich die z(ae|a)hne\b/, true], ['wash', /\bich wasche mich\b|\bich wasche mir\b/, /\b(sie|er) w(ae|a)scht sich\b|\bw(ae|a)scht (sie|er) sich\b/, true],
      ['shower', /\bich dusche\b/, /\b(sie|er) duscht\b/, false], ['dress', /\bich ziehe mich\b.*\ban\b/, /\b(sie|er) zieht sich\b.*\ban\b|\bzieht (sie|er) sich\b.*\ban\b/, true],
      ['comb', /\bich k(ae|a)mme mich\b|\bich k(ae|a)mme mir\b|\bich burste mir\b|\bich buerste mir\b/, /\b(sie|er) k(ae|a)mmt sich\b|\bk(ae|a)mmt (sie|er) sich\b/, true], ['dry', /\bich trockne mich\b/, /\b(sie|er) trocknet sich\b/, true],
      ['sleep', /\bich gehe ins bett\b|\bich lege mich\b|\bich schlafe\b/, /\b(sie|er) geht ins bett\b|\b(sie|er) legt sich\b|\b(sie|er) schlaft\b/, true], ['eat', /\bich fruhstucke\b|\bich fruehstuecke\b/, /\b(sie|er) fruhstuckt\b|\b(sie|er) fruehstueckt\b/, false],
    ],
  };
  const RT_CJ = {
    zh: [['getup', ['起床'], ['qichuang']], ['wake', ['醒'], ['xing']], ['brush', ['刷牙'], ['shuaya']], ['wash', ['洗脸', '洗手'], ['xilian', 'xishou']], ['shower', ['洗澡', '冲澡'], ['xizao', 'chongzao']],
      ['dress', ['穿衣服', '穿衣', '穿上'], ['chuanyi', 'chuanshang']], ['comb', ['梳头', '梳头发'], ['shutou']], ['dry', ['擦干'], ['cagan']], ['sleep', ['睡觉', '上床'], ['shuijiao', 'shangchuang']], ['eat', ['吃早饭', '吃早餐'], ['chizaofan', 'chizaocan']]],
    ja: [['getup', ['起きます', 'おきます', '起きる', 'おきる'], ['okimasu', 'okiru']], ['wake', ['目を覚まします', '目が覚めます', 'めをさまします'], ['mewosamashimasu', 'meosamashimasu', 'megasamemasu']],
      ['brush', ['歯をみがきます', '歯を磨きます', 'はをみがきます', '歯みがき', '歯磨き'], ['waomigakimasu', 'wamigakimasu', 'wamigaki', 'hawomigakimasu', 'haomigakimasu', 'hamigaki']], ['wash', ['顔を洗います', 'かおをあらいます', '顔を洗う', '顔洗います'], ['kaoaraimasu', 'kaoarau', 'kaowoaraimasu', 'kaooaraimasu']],
      ['shower', ['シャワーを浴びます', 'シャワーをあびます'], ['shawaoabimasu', 'shawaabimasu', 'shawaawoabimasu', 'shawaaoabimasu']], ['dress', ['服を着ます', 'ふくをきます', '着替えます', 'きがえます'], ['fukuokimasu', 'fukukimasu', 'fukuokiru', 'fukukiru', 'kigaemasu']],
      ['comb', ['髪をとかします', 'かみをとかします', '髪をとかす'], ['kamiotokashimasu', 'kamitokashimasu', 'kamiotokasu', 'kamitokasu', 'kamiotokasimasu']], ['sleep', ['寝ます', 'ねます', '寝る'], ['nemasu', 'neru']], ['eat', ['朝ごはんを食べます', 'あさごはんをたべます'], ['asagohanotabemasu', 'asagohantabemasu']]],
  };
  const ROUT_EN = { getup: 'I get up', wake: 'I wake up', brush: 'I brush my teeth', wash: 'I wash my face', shower: 'I take a shower', dress: 'I get dressed', comb: 'I comb my hair', dry: 'I dry off', sleep: 'I go to bed', eat: 'I have breakfast' };
  const ROUT_EN3 = { getup: 'She gets up', wake: 'She wakes up', brush: 'She brushes her teeth', wash: 'She washes her face', shower: 'She takes a shower', dress: 'She gets dressed', comb: 'She combs her hair', dry: 'She dries off', sleep: 'She goes to bed', eat: 'She has breakfast' };
  const ROUT_MODEL = {
    es: { getup: ['Me levanto.', 'Se levanta.'], wake: ['Me despierto.', 'Se despierta.'], brush: ['Me lavo los dientes.', 'Se lava los dientes.'], wash: ['Me lavo la cara.', 'Se lava la cara.'], shower: ['Me ducho.', 'Se ducha.'], dress: ['Me visto.', 'Se viste.'], comb: ['Me peino.', 'Se peina.'], dry: ['Me seco.', 'Se seca.'], sleep: ['Me acuesto.', 'Se acuesta.'], eat: ['Desayuno.', 'Desayuna.'] },
    pt: { getup: ['Eu me levanto.', 'Ela se levanta.'], wake: ['Eu acordo.', 'Ela acorda.'], brush: ['Eu escovo os dentes.', 'Ela escova os dentes.'], wash: ['Eu lavo o rosto.', 'Ela lava o rosto.'], shower: ['Eu tomo banho.', 'Ela toma banho.'], dress: ['Eu me visto.', 'Ela se veste.'], comb: ['Eu me penteio.', 'Ela se penteia.'], dry: ['Eu me enxugo.', 'Ela se enxuga.'], sleep: ['Eu me deito.', 'Ela se deita.'], eat: ['Eu tomo café.', 'Ela toma café.'] },
    de: { getup: ['Ich stehe auf.', 'Sie steht auf.'], wake: ['Ich wache auf.', 'Sie wacht auf.'], brush: ['Ich putze mir die Zähne.', 'Sie putzt sich die Zähne.'], wash: ['Ich wasche mich.', 'Sie wäscht sich.'], shower: ['Ich dusche.', 'Sie duscht.'], dress: ['Ich ziehe mich an.', 'Sie zieht sich an.'], comb: ['Ich kämme mich.', 'Sie kämmt sich.'], dry: ['Ich trockne mich ab.', 'Sie trocknet sich ab.'], sleep: ['Ich gehe ins Bett.', 'Sie geht ins Bett.'], eat: ['Ich frühstücke.', 'Sie frühstückt.'] },
    zh: { getup: ['[我|wǒ] [起床|qǐ chuáng] 。', '[她|tā] [起床|qǐ chuáng] 。'], wake: ['[我|wǒ] [醒|xǐng] [了|le] 。', '[她|tā] [醒|xǐng] [了|le] 。'], brush: ['[我|wǒ] [刷牙|shuā yá] 。', '[她|tā] [刷牙|shuā yá] 。'], wash: ['[我|wǒ] [洗|xǐ] [脸|liǎn] 。', '[她|tā] [洗|xǐ] [脸|liǎn] 。'], shower: ['[我|wǒ] [洗澡|xǐ zǎo] 。', '[她|tā] [洗澡|xǐ zǎo] 。'], dress: ['[我|wǒ] [穿|chuān] [衣服|yī fu] 。', '[她|tā] [穿|chuān] [衣服|yī fu] 。'], comb: ['[我|wǒ] [梳头|shū tóu] 。', '[她|tā] [梳头|shū tóu] 。'], dry: ['[我|wǒ] [擦干|cā gān] 。', '[她|tā] [擦干|cā gān] 。'], sleep: ['[我|wǒ] [睡觉|shuì jiào] 。', '[她|tā] [睡觉|shuì jiào] 。'], eat: ['[我|wǒ] [吃|chī] [早饭|zǎo fàn] 。', '[她|tā] [吃|chī] [早饭|zǎo fàn] 。'] },
    ja: { getup: ['[起|お]きます 。', '[鐘守|かねもり] は [起|お]きます 。'], wake: ['[目|め] を [覚|さ]まします 。', '[鐘守|かねもり] は [目|め] を [覚|さ]まします 。'], brush: ['[歯|は] を みがきます 。', '[鐘守|かねもり] は [歯|は] を みがきます 。'], wash: ['[顔|かお] を [洗|あら]います 。', '[鐘守|かねもり] は [顔|かお] を [洗|あら]います 。'], shower: ['シャワー を [浴|あ]びます 。', '[鐘守|かねもり] は シャワー を [浴|あ]びます 。'], dress: ['[服|ふく] を [着|き]ます 。', '[鐘守|かねもり] は [服|ふく] を [着|き]ます 。'], comb: ['[髪|かみ] を とかします 。', '[鐘守|かねもり] は [髪|かみ] を とかします 。'], dry: ['[体|からだ] を ふきます 。', '[鐘守|かねもり] は [体|からだ] を ふきます 。'], sleep: ['[寝|ね]ます 。', '[鐘守|かねもり] は [寝|ね]ます 。'], eat: ['[朝|あさ]ごはん を [食|た]べます 。', '[鐘守|かねもり] は [朝|あさ]ごはん を [食|た]べます 。'] },
  };
  const routineModel = (key, l, person = 1) => { const M = (ROUT_MODEL[l] || ROUT_MODEL.es)[key] || (ROUT_MODEL[l] || ROUT_MODEL.es).getup; return M[person === 3 ? 1 : 0]; };
  const ROUT_FRAME = { es: ['«Me ___»: «Me levanto», «Me lavo la cara»…', '«Se ___»: «Se levanta», «Se lava la cara»…'], pt: ['«Eu me ___»: «Eu me levanto», «Eu me visto»…', '«Ela se ___»: «Ela se levanta», «Ela se penteia»…'],
    de: ['«Ich … mich»: «Ich wasche mich», «Ich stehe auf»…', '«Sie … sich»: «Sie wäscht sich», «Sie steht auf»…'], zh: ['“ [我|wǒ] ___ ”: [我|wǒ] [起床|qǐ chuáng] …', '“ [她|tā] ___ ”: [她|tā] [起床|qǐ chuáng] …'], ja: ['「 ___ ます 」: [起|お]きます …', '「 [鐘守|かねもり] は ___ ます 」']};
  function gradeRoutine(text, l, o = {}) {
    const person = o.person === 3 ? 3 : 1;
    const out = { key: null, refl: false, ok: false, slips: [], soft: [], letter: null, reason: '', model: routineModel(o.want || 'getup', l, person), person };
    const { slip, soft } = kit(out);
    const raw = String(text || '');
    if (cjOf(l)) {
      const can = canonOf(raw, l), flat = flatOf(raw);
      // (the longest match wins: «服を着ます», fukuokimasu, has «okimasu» in it, but it's getting dressed)
      let hit = null, best = 0;
      for (const e of RT_CJ[l]) {
        const [, ch, ro] = e;
        const n = Math.max(0, ...ch.filter(c => raw.includes(c)).map(c => c.length * 2), ...ro.filter(r => can.includes(r) || flat.includes(r)).map(r => r.length));
        if (n > best) { best = n; hit = e; }
      }
      if (!hit) return out;
      out.key = hit[0]; out.refl = out.key !== 'eat';
      out.model = routineModel(out.key, l, person);
      if (l === 'zh') {
        const me = /我/.test(raw) || /^wo/.test(can), her = /她|他/.test(raw) || /^ta/.test(can);
        if (person === 1) { if (her && !me) { out.wrongPerson = true; slip('person', `That’s her! Your own morning: «${cjs(routineModel(out.key, 'zh', 1), 'zh')}»`, true); } else if (!me) soft('who', `Say who: «${cjs(routineModel(out.key, 'zh', 1), 'zh')}»`); }
        else { if (me && !her) { out.wrongPerson = true; slip('person', `That’s you! About her: «${cjs(routineModel(out.key, 'zh', 3), 'zh')}»`, true); } else if (!her && !/守钟人/.test(raw)) soft('who', `Say who: «${cjs(routineModel(out.key, 'zh', 3), 'zh')}»`); }
      } else {
        const rawJ = raw.replace(/\s+/g, ''), both = rawJ + ' ' + can + ' ' + flat;
        const plain = /起きる|おきる|寝る|ねる|洗う|あらう|とかす|着る|きる|okiru|neru|arau|tokasu|kiru/.test(both) && !/ます|masu/.test(both);
        if (plain) soft('polite', `Polite: «${cjs(out.model, 'ja')}» (～ます)`);
        if (/顔洗|かおあら|髪とか|かみとか|服着|ふくき/.test(rawJ) || /kaoara|kamitoka|fukuki/.test(flat)) slip('particle', `を after the thing: «${cjs(out.model, 'ja')}»`);
        if (person === 3 && /わたし|私|ぼく|僕|watashi|watasi|boku/.test(both)) { out.wrongPerson = true; slip('person', `That’s you! About her: «${cjs(routineModel(out.key, 'ja', 3), 'ja')}»`, true); }
      }
      if (o.want && o.want !== out.key) { out.ok = false; return out; }
      out.ok = !out.wrongPerson;
      return finish(out);
    }
    const n = nrm(raw), has = re => re.test(' ' + n + ' '), lo = ' ' + raw.toLowerCase() + ' ';
    const list = RT[l] || RT.es;
    let hit = list.find(e => has(person === 3 ? e[2] : e[1]));
    const other = list.find(e => has(person === 3 ? e[1] : e[2]));
    if (!hit && other) { hit = other; out.wrongPerson = true; slip('person', person === 3 ? `That’s you! About her: «${routineModel(other[0], l, 3)}»` : `That’s her! Your morning: «${routineModel(other[0], l, 1)}»`, true); }
    // the reflexive left out, a stem or a separable verb gone wrong: still the routine, with a slip
    if (!hit) {
      const B = {
        es: [[/\blevanto\b/, 'getup', 'refl', '«levantarse»: «me levanto»'], [/\blevanta\b/, 'getup', 'refl', '«levantarse»: «se levanta»'], [/\blavo (la cara|las manos)\b/, 'wash', 'refl', '«me lavo la cara»'], [/\blava (la cara|las manos)\b/, 'wash', 'refl', '«se lava la cara»'],
          [/\bme vesto\b/, 'dress', 'stem', 'vestirse: «me visto»'], [/\bvisto\b/, 'dress', 'refl', '«vestirse»: «me visto»'], [/\bviste\b/, 'dress', 'refl', '«se viste»'], [/\bpeino\b/, 'comb', 'refl', '«me peino»'], [/\bpeina\b/, 'comb', 'refl', '«se peina»'],
          [/\bme acosto\b/, 'sleep', 'stem', 'acostarse: «me acuesto»'], [/\bme desperto\b/, 'wake', 'stem', 'despertarse: «me despierto»'], [/\bducho\b/, 'shower', 'refl', '«me ducho»']],
        pt: [[/\beu levanto\b/, 'getup', 'refl', '«eu me levanto»'], [/\bela levanta\b/, 'getup', 'refl', '«ela se levanta»'], [/\bme penteo\b/, 'comb', 'stem', 'pentear-se: «me penteio»'], [/\beu visto\b/, 'dress', 'refl', '«eu me visto»'], [/\beu deito\b/, 'sleep', 'refl', '«eu me deito»']],
        de: [[/\bich aufstehe\b/, 'getup', 'sep', '«aufstehen» splits: «ich stehe … auf»'], [/\bich stehe\b/, 'getup', 'sep', '«aufstehen»: «ich stehe auf» (auf at the end)'], [/\bich wache\b/, 'wake', 'sep', '«aufwachen»: «ich wache auf»'],
          [/\bich wasche\b/, 'wash', 'refl', '«sich waschen»: «ich wasche mich»'], [/\bich ziehe\b.*\ban\b/, 'dress', 'refl', '«sich anziehen»: «ich ziehe mich an»'], [/\bich ziehe mich\b/, 'dress', 'sep', '«anziehen»: «ich ziehe mich an» (an at the end)'],
          [/\bich k(ae|a)mme\b/, 'comb', 'refl', '«sich kämmen»: «ich kämme mich»'], [/\b(sie|er) w(ae|a)scht\b/, 'wash', 'refl', '«sie wäscht sich»'], [/\b(sie|er) steht\b/, 'getup', 'sep', '«sie steht auf»'], [/\b(sie|er) k(ae|a)mmt\b/, 'comb', 'refl', '«sie kämmt sich»'], [/\b(sie|er) zieht\b/, 'dress', 'refl', '«sie zieht sich an»']],
      }[l] || [];
      const b = B.find(([re]) => has(re));
      if (!b) return out;
      hit = list.find(e => e[0] === b[1]);
      slip(b[2], b[3], b[2] !== 'stem');
    }
    out.key = hit[0]; out.refl = hit[3];
    out.model = routineModel(out.key, l, person);
    if (l === 'de') {
      if (out.key === 'wash' && person === 1 && /\bwasche mich (das|die|den)\b/.test(n)) slip('case', 'With a body part it’s «mir»: «ich wasche mir das Gesicht»');
      if (out.key === 'wash' && person === 1 && /\bwasche mir\b/.test(n) && !/\bwasche mir (das|die|den|meine?)\b/.test(n)) slip('case', '«ich wasche mich», or with a body part: «ich wasche mir das Gesicht»');
      if (/\bw(a)scht\b/.test(n) && !/wäscht|waescht/.test(lo)) soft('umlaut', 'Umlaut: «wäscht»');
      if (/\bkamm(e|t)\b/.test(n) && !/kämm|kaemm/.test(lo)) soft('umlaut', 'Umlaut: «kämmen»');
      if (person === 3 && /\bsie\b/.test(n) && /\b(mich|mir)\b/.test(n)) slip('refl', 'For her it’s «sich»: «sie wäscht sich»');
      if (person === 1 && /\bsich\b/.test(n)) slip('refl', 'For you it’s «mich»: «ich wasche mich»');
    }
    if (l === 'es') {
      if (person === 1 && /\bse\b/.test(n) && /\bme\b/.test(n) === false && hit) slip('refl', `Your morning: «${out.model}» (me, not se)`, true);
      if (/\bme levanta\b|\bme lava\b|\bme peina\b|\bme viste\b/.test(n)) slip('ending', `With «me»: «${routineModel(out.key, 'es', 1)}»`);
    }
    if (o.want && o.want !== out.key) { out.ok = false; return out; }
    out.ok = !out.wrongPerson;
    return finish(out);
  }
  // (zh / ja: the dictionary that reads what you type learns these words)
  if (typeof CJK !== 'undefined' && CJK.addSource) {
    const all = [];
    for (const it of NEW_WORDS.concat([DIG])) all.push(it.zh, it.ja);
    for (const o of Object.values(OWNERS)) all.push(o.zh, o.ja);
    for (const M of [ROUT_MODEL.zh, ROUT_MODEL.ja]) for (const v of Object.values(M)) all.push(...v);
    all.push('[你|nǐ] [的|de] [这|zhè] [是|shì] [她|tā] [他|tā] [我|wǒ] [刷牙|shuā yá] [冲澡|chōng zǎo] [上床|shàng chuáng] [早餐|zǎo cān]', 'さん の です あなた わたし ぼく [着替|きが]えます [起|お]きる [寝|ね]る');
    for (const s of all) if (s) { try { CJK.addSource(s); } catch (e) { /* (the engine may not take every string) */ } }
  }
  Object.assign(C, { registerWords, NEW_WORDS, DIG, OWNERS, NOUNS, gradeYours, yoursModel, YOURS_FRAME, gradeRoutine, routineModel, ROUT_FRAME, ROUT_EN, ROUT_EN3, ROUT_MODEL, nrm, near1, finish });
})();
