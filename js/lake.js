'use strict';
// The Mirror Lake (DESIGN.md 14.5), west of Alba. The Reed River and its broken bridge, with the raft docks beside it
// (Lalo swims there, and Mimo learns «nada» by watching him); Remanso, the village on the lake: houses on the shore and
// on stilts over the water, joined by boardwalks, the main pier out to the ferry dock, Marina's yellow house at its end,
// the flat ferry and Bartolo the ferryman (hushed); boats, nets, reeds, lily pads, ducks, jumping fish and a little mist.
// Out in the lake, the island with its old lighthouse (its east door is the next dungeon's) and the second bell, gray and
// still on its buoy until setBuoyHushed(false).
// One global, LAKE, shaped like MOLINAR (molinar.js):
//   LAKE.layout, .landmarks, .pavedAt(x, z), .bareAt(x, z), .keepClear(x, z, pad), .distTo(x, z), .riverX(z):
//     plain data, ready before any scene (keepClear: where world.js's own trees, rocks and flowers shouldn't go)
//   LAKE.build(scene, { terrainAt }) → { colliders, platforms, moving, update(dt, t, you|null), people, landmarks, group,
//     objects: { raft, ferry, buoy, bell, lighthouse, … }, setBuoyHushed(on), buoyHushed, ringBuoy(sec),
//     setLighthouseLit(on), setFade(on), stats() }
// The water itself is world3d.js's (its surface is at y = −0.4). Static things are merged by material; everything that
// moves or bobs (people, boats, the raft, the ferry, the buoy, ducks, fish, splashes) is a node driving instanced body
// parts, so the whole region costs a couple of dozen draw calls. Needs THREE (r128), core.js and toonkit.js.

const LAKE = (() => {
  const { G } = TK;
  const WATER = -0.4, GY = 0.25, DECK = 0.55;       // the water's surface, the village's flat ground, the boardwalks' top
  const P = (x, z) => ({ x, z });
  const R0 = rng(4471);
  const pick = (a, R = R0) => a[Math.floor(R() * a.length) % a.length];

  // ------------------------------------------------------------ small helpers (molinar's)
  function segDist(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
  }
  const polyDist = (pts, x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; };
  const toWorld = (b, lx, lz) => { const c = Math.cos(b.rot || 0), s = Math.sin(b.rot || 0); return [b.x + lx * c + lz * s, b.z - lx * s + lz * c]; };
  const corners = b => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => toWorld(b, a * b.hw, c * b.hd));
  const local = (b, x, z) => { const c = Math.cos(b.rot || 0), s = Math.sin(b.rot || 0); return [(x - b.x) * c - (z - b.z) * s, (x - b.x) * s + (z - b.z) * c]; };
  const boxDist = (b, x, z) => { const [lx, lz] = local(b, x, z); return Math.max(Math.abs(lx) - b.hw, Math.abs(lz) - b.hd); };
  const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
  function spline(pts, per = 6) {          // Catmull-Rom, as world.js smooths its roads
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

  // ------------------------------------------------------------ the water and the road (world.js shapes the ground; these mirror its numbers)
  const RX = z => -118 + 3 * Math.sin((z + 150) * 0.05);        // the Reed River's centerline (world.js riverX)
  const LK = { x: -200, z: -155, rx: 40, rz: 32, bed: -2.2 };     // the east bay, by the village (the lake as it first was)
  const lakeE = (x, z) => Math.hypot((x - LK.x) / LK.rx, (z - LK.z) / LK.rz);   // < 1 inside the east bay (the waterline is near 0.95)
  // the whole grown lake (playtest 4): world.js's lakeD once it's loaded (lake.js loads first: nothing here asks before then)
  const lakeAll = (x, z) => (typeof lakeD === 'function' ? lakeD(x, z) : (lakeE(x, z) - 1) * 36);
  // Lighthouse Island, far out in the open water (world.js L.island), and the islets passed on the ferry (L.islets): everything on
  // and round the island is placed from ISLE, so it moves with it (I(dx, dz): a spot that far from the island's middle)
  const ISLE = { x: -340, z: -172, r: 9 };                       // the island (its shore is about 8.4 out)
  const I = (dx, dz) => [+(ISLE.x + dx).toFixed(2), +(ISLE.z + dz).toFixed(2)];
  const ISLETS = [{ x: -232, z: -144, r: 2.6 }, { x: -256, z: -184, r: 4 }, { x: -264, z: -191, r: 3 }, { x: -286, z: -152, r: 3.6 },
    { x: -306, z: -199, r: 5 }, { x: -372, z: -146, r: 4 }, { x: -410, z: -200, r: 6.5 }, { x: -362, z: -208, r: 3 }];
  const VIL = { x0: -158, x1: -136, zN: -170, zS: -134 };       // Remanso's flat ground (y 0.25)
  const ROAD_PTS = [[-53, -150], [-72, -152], [-92, -148], [-110, -150], [-118, -150], [-126, -150], [-138, -150], [-146, -151]];
  const ROAD = spline(ROAD_PTS);
  const roadDist = (x, z) => polyDist(ROAD, x, z);

  // ------------------------------------------------------------ the crossing: the broken bridge on the road, the raft docks just south of it
  const BR = { x: RX(-150), z: -150, half: 6.4, gap: 1.8, top: 0.85, w: 2.4 };   // deck from x−half to x+half; fallen in between x ± gap
  const DZ = -146.3, DX = RX(DZ);                                // the docks' line (the river's middle there)
  const DOCK_E = { x0: DX + 5.8, x1: DX + 2.6, z: DZ, w: 1.8 }, DOCK_W = { x0: DX - 5.8, x1: DX - 2.6, z: DZ, w: 1.8 };   // (x0 on the bank, x1 over the water)
  const RAFT = { home: P(+(DX + 1.38).toFixed(2), DZ), away: P(+(DX - 1.38).toFixed(2), DZ), half: 1.2, top: WATER + 0.3 };
  const LALO = { z0: -153.2, z1: -161.8, off: 0.75 };            // Lalo swims laps in the river here (north of the bridge)

  // ------------------------------------------------------------ Remanso (pure data)
  const PIERS = [      // boardwalks at deck height: the main pier, side piers to the stilt houses, the south walk back to the beach
    { id: 'main', a: [-156.4, -152], b: [-185.0, -152], w: 2.6 },
    { id: 'toA', a: [-170.5, -153.0], b: [-170.5, -157.4], w: 1.8 },
    { id: 'toMarina', a: [-182, -153.0], b: [-182, -157.6], w: 1.8 },
    { id: 'toB', a: [-173, -151.0], b: [-173, -146.6], w: 1.8 },
    { id: 'toC', a: [-180.5, -151.0], b: [-180.5, -146.5], w: 1.8 },
    { id: 'south', a: [-167.5, -151.0], b: [-167.5, -141.2], w: 2.0 },
    { id: 'southIn', a: [-167.5, -141.2], b: [-157.4, -141.2], w: 2.0 },
  ];
  const FERRY_DOCK = { x0: -190.4, x1: -183.8, z0: -155.6, z1: -148.4 };
  const FERRY = { x: -193.9, z: -152, len: 6.4, wid: 3.2, top: WATER + 0.42 };
  const JETTY = { a: I(7.2, 1.6), b: I(11.4, 1.6), w: 1.8 };          // the island's little landing, east side
  // houses: stilt houses over the water (front +z when rot is 0), houses on the shore, the boat builder's shed
  const HOUSES = [
    { id: 'marina', kind: 'stilt', x: -182, z: -161.0, w: 6.2, d: 5.2, rot: 0, floors: 2, wall: '#f2c94c', door: '#2f8f8a', shutter: '#e0603c', roof: 'thatch', doorX: 0 },
    { id: 'hA', kind: 'stilt', x: -170.5, z: -160.4, w: 5.4, d: 4.6, rot: 0, wall: '#7f97a6', door: '#d9483b', shutter: '#f0b429', roof: 'thatch', doorX: 0 },
    { id: 'hB', kind: 'stilt', x: -173.0, z: -143.6, w: 5.4, d: 4.6, rot: Math.PI, wall: '#9fb4b0', door: '#3f6fb5', shutter: '#e07a3a', roof: 'slate', doorX: 0 },
    { id: 'hC', kind: 'stilt', x: -180.5, z: -143.4, w: 5.8, d: 4.8, rot: Math.PI, wall: '#b9a58a', door: '#2f8f8a', shutter: '#d9483b', roof: 'thatch', doorX: 0 },
    { id: 'L1', kind: 'land', x: -140.6, z: -158.8, w: 6.0, d: 4.8, rot: 0, floors: 2, wall: '#8ea0b4', door: '#f0b429', shutter: '#2f8f8a', roof: 'slate', doorX: -1.2 },
    { id: 'L2', kind: 'land', x: -149.2, z: -159.0, w: 5.4, d: 4.6, rot: 0, wall: '#c9b9a0', door: '#3f6fb5', shutter: '#d9483b', roof: 'thatch', doorX: 1.0 },
    { id: 'L3', kind: 'land', x: -141.4, z: -166.4, w: 5.6, d: 4.6, rot: 0, wall: '#9fb4b0', door: '#7a4f9a', shutter: '#f0b429', roof: 'slate', doorX: 0.8 },
    { id: 'S1', kind: 'land', x: -140.4, z: -141.6, w: 6.0, d: 4.8, rot: Math.PI, floors: 2, wall: '#7f97a6', door: '#e07a3a', shutter: '#f2c94c', roof: 'slate', doorX: 1.0 },
    { id: 'S2', kind: 'land', x: -148.8, z: -141.4, w: 5.6, d: 4.6, rot: Math.PI, wall: '#b9a58a', door: '#2f8f8a', shutter: '#3f6fb5', roof: 'thatch', doorX: -0.8 },
    { id: 'shed', kind: 'shed', x: -150.5, z: -166.4, w: 6.0, d: 5.2, rot: -Math.PI / 2, wall: '#8c9aa3', door: '#6b5446', roof: 'slate', doorX: 0 },
  ];
  HOUSES.forEach(h => {
    h.hw = h.w / 2; h.hd = h.d / 2;
    const [dx, dz] = toWorld(h, h.doorX, h.d / 2 + 0.7); h.doorAt = P(+dx.toFixed(2), +dz.toFixed(2));
    if (h.kind === 'stilt') {        // the porch in front of the door (an axis-aligned box: these are all turned 0 or π)
      const [ax, az] = toWorld(h, -h.w / 2 - 0.2, h.d / 2), [bx, bz] = toWorld(h, h.w / 2 + 0.2, h.d / 2 + 1.4);
      h.porch = { x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) };
    }
  });
  const HOUSE = Object.fromEntries(HOUSES.map(h => [h.id, h]));
  const PLAZA = { x: -153.6, z: -152.4, r: 3.0 };                     // the little square at the pier head
  const STREET = { pts: [[-142.0, -150.7], [-150, -151.5], [-157.2, -152.1]], w: 3.4 };   // the road's end, into the village
  const FOOT = [        // footpaths (dirt) to doors, the shed, the beach, the laundry, the river docks, the lighthouse
    [[HOUSE.L1.doorAt.x, HOUSE.L1.doorAt.z], [-141.8, -151.4]], [[HOUSE.L2.doorAt.x, HOUSE.L2.doorAt.z], [-148.2, -152.4]],
    [[HOUSE.L3.doorAt.x, HOUSE.L3.doorAt.z], [-145.0, -162.4], [-145.2, -152.2]],
    [[HOUSE.S1.doorAt.x, HOUSE.S1.doorAt.z], [-141.4, -149.6]], [[HOUSE.S2.doorAt.x, HOUSE.S2.doorAt.z], [-148.0, -150.2]],
    [[-154.0, -163.8], [-155.4, -158.4], [-155.0, -155.0]],
    [[-155.6, -149.8], [-157.4, -146.2], [-157.4, -141.2]], [[-144.6, -149.4], [-144.6, -138.2]],
    [[BR.x + 7.2, -149.2], [DOCK_E.x0 + 0.4, DZ]], [[BR.x - 7.2, -149.2], [DOCK_W.x0 - 0.4, DZ]],
    [[JETTY.a[0] + 0.2, JETTY.a[1]], I(5.0, 0.6), [ISLE.x + 2.3, ISLE.z]],
  ];
  const SIGN = { x: -135.2, z: -143.9 };                           // the village's name board, by the road where you arrive
  const BUOY = { x: I(13, 8)[0], z: I(13, 8)[1] };                 // (by the island's landing, between it and the pier far away)
  // Milestone 2 (isle.js): the ferry moored at the island's jetty (stern to the jetty's end, turned like at home), the gentle
  // hook it takes there from its dock, Bartolo's three lost things (the oar under the main pier, the lantern on the red boat,
  // the rope in the barrel by Vicente's slipway), and the lily pads of the giant frog and its two helpers, by the bell
  const FERRY_ISLE = { x: I(14.7, 1.6)[0], z: I(14.7, 1.6)[1] };
  // the ride out (isle.js): it backs off the dock, turns, crosses the bay and the strait between the islets, and turns again to
  // back up to the island's jetty, about 133 units in all
  const FERRY_PATH = [[FERRY.x, FERRY.z], [-200.5, -152.6], [-208, -154.8], [-232, -160.5], [-262, -165.5], [-292, -169.5], I(26, 0.4), I(18.5, 1.1), [FERRY_ISLE.x, FERRY_ISLE.z]];
  const LOST = { oar: { x: -163.8, z: -150.6 }, lantern: { boat: 0 }, rope: { x: -153.6, z: -163.0 } };
  const FROG_PADS = { boss: { x: I(10.4, 11.1)[0], z: I(10.4, 11.1)[1], r: 1.75 }, left: { x: I(7, 8.8)[0], z: I(7, 8.8)[1], r: 0.85 }, right: { x: I(13.4, 13.6)[0], z: I(13.4, 13.6)[1], r: 0.85 } };

  // ------------------------------------------------------------ masks for world.js: paths, bare ground, and where its own scatter shouldn't go
  const inBox = (x, z, x0, x1, z0, z1) => x > x0 && x < x1 && z > z0 && z < z1;
  const nearIsle = (x, z) => Math.abs(x - ISLE.x) < 18 && Math.abs(z - ISLE.z) < 18;
  function pavedAt(x, z) {
    if ((x > -106 || x < -216 || z < -172 || z > -128) && !nearIsle(x, z)) return 0;
    let a = 0;
    if (x > -162 && x < -134 && z > -170 && z < -134) {
      a = Math.max(a, 1 - smoothstep(STREET.w / 2 - 0.3, STREET.w / 2 + 0.4, polyDist(STREET.pts, x, z)), 1 - smoothstep(PLAZA.r - 0.3, PLAZA.r + 0.4, Math.hypot(x - PLAZA.x, z - PLAZA.z)));
    }
    for (const f of FOOT) if (x > f[0][0] - 12 && x < f[0][0] + 12 && Math.abs(z - f[0][1]) < 14) a = Math.max(a, 1 - smoothstep(0.5, 0.85, polyDist(f, x, z)));
    return a;
  }
  function bareAt(x, z) {        // paths, and the ground under the shore houses and the shed: no grass
    if ((x > -106 || x < -216 || z < -172 || z > -128) && !nearIsle(x, z)) return 0;
    const a = pavedAt(x, z);
    if (a >= 1) return 1;
    for (const h of HOUSES) if (h.kind !== 'stilt' && Math.abs(x - h.x) < 6 && Math.abs(z - h.z) < 6 && boxDist({ x: h.x, z: h.z, hw: h.hw + 0.5, hd: h.hd + 0.5, rot: h.rot }, x, z) < 0) return 1;
    return a;
  }
  function keepClear(x, z, pad = 0) {
    // (out west, the grown lake: its shore, the islets and the island. East of −217 everything is as it was, so world.js's scatter
    // round the village comes out the same.)
    if (x < -217) return lakeAll(x, z) < 3 + pad || Math.hypot(x - ISLE.x, z - ISLE.z) < ISLE.r + 2 + pad || ISLETS.some(t => Math.hypot(x - t.x, z - t.z) < t.r + 1.5 + pad);
    if (x > -104 || x < -226 || z < -182 || z > -120) return false;
    if (inBox(x, z, VIL.x0 - 10 - pad, VIL.x1 + 4 + pad, VIL.zN - 4 - pad, VIL.zS + 4 + pad)) return true;     // the village and its beach
    if (Math.hypot(x - BR.x, z - BR.z) < 11 + pad) return true;                                                // the bridge and the docks
    if (z < -150 && z > -166 && Math.abs(x - RX(z)) < 8 + pad) return true;                                    // Lalo's stretch, and the bank you watch from
    if (lakeE(x, z) < 1.12 + pad * 0.02 || Math.hypot(x - ISLE.x, z - ISLE.z) < ISLE.r + 2 + pad) return true;  // the shore (reeds)
    if (Math.hypot(x - SIGN.x, z - SIGN.z) < 2 + pad) return true;
    return pavedAt(x, z) > 0.05;
  }
  // how far (x, z) is from the region (0 inside): for showing and hiding it
  function distTo(x, z) {       // (the village, the river and the east bay; or the island, far out)
    const dx = Math.max(-226 - x, 0, x - -104), dz = Math.max(-180 - z, 0, z - -124);
    return Math.min(Math.hypot(dx, dz), Math.max(0, Math.hypot(x - ISLE.x, z - ISLE.z) - ISLE.r - 18));
  }
  const LAYOUT = {
    water: WATER, ground: GY, deck: DECK, village: VIL, lake: LK, island: ISLE, road: ROAD_PTS, riverX: 'riverX(z) = −118 + 3·sin((z + 150)·0.05)',
    bridge: { ...BR }, docks: { east: DOCK_E, west: DOCK_W }, raft: RAFT, piers: PIERS, ferryDock: FERRY_DOCK, ferry: FERRY, jetty: JETTY,
    plaza: PLAZA, street: STREET, paths: FOOT, buoy: BUOY,
    buildings: HOUSES.map(h => ({ kind: h.kind, id: h.id, x: h.x, z: h.z, w: h.w, d: h.d, rot: h.rot })),
    bounds: { x0: -226, x1: -104, z0: -180, z1: -124 },        // (the village, the river and the east bay; the island is far out west of these)
    ferryIsle: FERRY_ISLE, ferryPath: FERRY_PATH, lost: LOST, frogPads: FROG_PADS,       // (milestone 2: isle.js)
    islets: ISLETS,
  };
  // the area's name on the mini-map (minimap.js asks before its own): the island, its lighthouse and its jetty
  const AREA_ISLE = { id: 'isle', name: 'Lighthouse Island', color: '#c4574a' };
  function areaAt(x, z) {
    if (Math.hypot(x - ISLE.x, z - ISLE.z) < ISLE.r + 1.2) return AREA_ISLE;
    if (x > JETTY.a[0] - 1 && x < JETTY.b[0] + 1.4 && Math.abs(z - JETTY.a[1]) < 2.2) return AREA_ISLE;
    return null;
  }

  // ------------------------------------------------------------ landmarks (story spots, camera targets); build() adds y where it matters
  const LM = {
    village: P(-150, -152), remanso: P(-150, -152), plaza: P(PLAZA.x, PLAZA.z), sign: P(SIGN.x, SIGN.z),
    bridge: { x: BR.x, z: BR.z, gap: [+(BR.x - BR.gap).toFixed(2), +(BR.x + BR.gap).toFixed(2)], top: BR.top },
    riverDockEast: P(+(DX + 3.7).toFixed(2), DZ), riverDockWest: P(+(DX - 3.7).toFixed(2), DZ),
    raftHome: { ...RAFT.home }, raftAway: { ...RAFT.away },
    laloWatch: P(+(RX(-157) + 5.4).toFixed(2), -157), laloLane: { z0: LALO.z0, z1: LALO.z1 },
    pier: P(-157.2, -152), pierEnd: P(-184.6, -152), ferryDock: P(-187.2, -152),
    marinaHouse: P(-182, -157.2), marina: P(-182, -157.75), marinaDoor: P(-182, -158.5),
    bartolo: P(-189.4, -150.2), ferry: P(FERRY.x, FERRY.z),
    island: P(ISLE.x, ISLE.z), lighthouse: P(ISLE.x, ISLE.z), lighthouseDoor: P(ISLE.x + 2.45, ISLE.z), islandJetty: P(...I(9.8, 1.6)),
    buoy: P(BUOY.x, BUOY.z), bell: P(BUOY.x, BUOY.z),
    boatShed: P(-154.4, -166.4), nets: P(-160.4, -145.8), fishStall: P(-153.7, -149.4),
    // milestone 2: the ferry's mooring at the island, Bartolo's lost things, the giant frog's lily pad
    ferryIsle: P(FERRY_ISLE.x, FERRY_ISLE.z), lostOar: P(LOST.oar.x, LOST.oar.z), lostLantern: P(-169.9, -149.2),      // (the red boat, MOORED[0])
    lostRope: P(LOST.rope.x, LOST.rope.z), frogPad: P(FROG_PADS.boss.x, FROG_PADS.boss.z),
  };
  // ------------------------------------------------------------ materials: molinar's toon look (rim light, a dithered fade for walls between
  // the camera and you, a sway for reeds and leaves)
  const U = { uTime: { value: 0 }, uFocus: { value: new THREE.Vector3(0, -1e4, 0) }, uFade: { value: 1 } };
  function patch(o) {
    return sh => {
      const CC = o.fade && TK.camCut;        // (a house the camera's inside goes all at once: its windows, frames, doors too)
      Object.assign(sh.uniforms, U, CC ? CC.U : {}, { rimAmt: { value: o.rim || 0 } });
      let vs = 'uniform float uTime;\nvarying vec3 vWP;\n' + (o.sway ? 'attribute float aSway;\n' : '') + sh.vertexShader;
      if (o.sway) vs = vs.replace('#include <begin_vertex>', `#include <begin_vertex>
        { float ph = position.x * 0.35 + position.z * 0.27;
          transformed.x += sin(uTime * 1.5 + ph) * 0.11 * aSway;
          transformed.z += sin(uTime * 1.1 + ph * 1.7) * 0.08 * aSway; }`);
      if (o.off) vs = vs.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${TK.fl(o.off)};`);
      vs = vs.replace('#include <project_vertex>', `#include <project_vertex>
        #ifdef USE_INSTANCING
          vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
      sh.vertexShader = vs;
      let fs = 'uniform vec3 uFocus;\nuniform float uFade;\nuniform float rimAmt;\nvarying vec3 vWP;\n' + (CC ? CC.decl : '') + sh.fragmentShader;
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
    m.onBeforeCompile = patch(o); m.customProgramCacheKey = () => 'lake' + k;
    return (MATS[k] = m);
  }
  function inkM(o = {}) {
    const k = 'i' + JSON.stringify(o);
    if (MATS[k]) return MATS[k];
    const m = new THREE.MeshBasicMaterial({ color: '#2b2235', side: THREE.BackSide });
    m.onBeforeCompile = patch(o); m.customProgramCacheKey = () => 'lake' + k;
    return (MATS[k] = m);
  }

  // ------------------------------------------------------------ pieces → merged geometry, and its ink hull (as in molinar.js)
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
  function bake(pieces, o = {}) {        // o: { hull, uv (planar world uv scale) }
    const list = o.hull ? pieces.filter(p => p.ink > 0) : pieces;
    let n = 0; for (const p of list) n += ni(p.geo).attributes.position.count;
    const pos = new Float32Array(n * 3), nor = o.hull ? null : new Float32Array(n * 3), col = o.hull ? null : new Float32Array(n * 3);
    const uv = o.uv ? new Float32Array(n * 2) : null, sw = list.some(p => p.sway) ? new Float32Array(n) : null;
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
    geo.computeBoundingSphere();
    return geo;
  }

  // ------------------------------------------------------------ the drawing kit (molinar's): pieces in a local frame, sorted into buckets
  const GEO = {
    box: G.box, cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
    cyl16: new THREE.CylinderGeometry(1, 1, 1, 16), cyl20: new THREE.CylinderGeometry(1, 1, 1, 20), ball: new THREE.SphereGeometry(1, 12, 8), ball6: new THREE.SphereGeometry(1, 8, 6), ball5: new THREE.SphereGeometry(1, 7, 5),
    ico0: G.ico0, ico1: G.ico1, taper: new THREE.CylinderGeometry(0.82, 1, 1, 16), taper20: new THREE.CylinderGeometry(0.78, 1, 1, 20),
    cone4: (() => { const g = new THREE.ConeGeometry(1, 1, 4); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); return g; })(),
    cone: new THREE.ConeGeometry(1, 1, 10), cone6: new THREE.ConeGeometry(1, 1, 6), cone16: new THREE.ConeGeometry(1, 1, 16),
    disc: (() => { const g = new THREE.CircleGeometry(1, 20); g.rotateX(-Math.PI / 2); return g; })(),
    pad: (() => { const g = new THREE.CircleGeometry(1, 14, 0.5, TAU - 0.55); g.rotateX(-Math.PI / 2); return g; })(),      // a lily pad, with its notch
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
  function Kit() {
    const B = { solid: [], sway: [], earth: [] };
    let F = new THREE.Matrix4(), FY = 0;
    const autoInk = (geo, sx, sy, sz) => { const { size } = bbOf(geo); const dims = [size.x * sx, size.y * sy, size.z * sz].filter(v => v > 1e-3); return clamp(Math.min(...dims) * 0.1, 0.007, 0.026); };
    const k = {
      B, rot: 0,
      frame(x, y, z, rot = 0) { F = new THREE.Matrix4().makeRotationY(rot).setPosition(x, y, z); FY = y; k.rot = rot; return k; },
      world(x, y, z) { return new THREE.Vector3(x, y, z).applyMatrix4(F); },
      add(geo, x, y, z, sx, sy, sz, color, o = {}) {
        const m = F.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ')), new THREE.Vector3(sx, sy, sz)));
        const b = o.b || 'solid';
        const ink = b === 'solid' || b === 'sway' ? (o.ink === undefined ? autoInk(geo, sx, sy, sz) : o.ink) : 0;
        B[b].push({ geo, m, color, ink, sway: o.sway ? { y0: FY + o.sway.y0, y1: FY + o.sway.y1, k: o.sway.k } : null });
        return k;
      },
      raw(geo, color, b = 'earth') { B[b].push({ geo, m: new THREE.Matrix4(), color, ink: 0, sway: null }); return k; },
      box(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y, z, w, h, d, color, o); },
      post(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y + h / 2, z, w, h, d, color, o); },
      cyl(x, y, z, r, h, color, o = {}) { return k.add(o.geo || GEO.cyl, x, y + h / 2, z, r, h, r, color, o); },
      ball(x, y, z, r, color, o = {}) { return k.add(o.geo || GEO.ball, x, y, z, r, o.ry2 || r, o.rz2 || r, color, o); },
      beam(x1, y1, z1, x2, y2, z2, t, color, o = {}) {
        const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, L = Math.hypot(dx, dy, dz);
        const m = F.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2),
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L)), new THREE.Vector3(t, L, o.t2 || t)));
        const b = o.b || 'solid';
        B[b].push({ geo: o.geo || GEO.box, m, color, ink: o.ink === undefined ? clamp(t * 0.1, 0.006, 0.02) : o.ink, sway: o.sway ? { y0: FY + o.sway.y0, y1: FY + o.sway.y1, k: o.sway.k } : null });
        return k;
      },
    };
    return k;
  }

  // ------------------------------------------------------------ ground patches laid on the terrain (dirt paths)
  function fromTris(pos) {
    for (let i = 0; i < pos.length; i += 9) {      // make every triangle face up
      const ax = pos[i + 3] - pos[i], az = pos[i + 5] - pos[i + 2], bx = pos[i + 6] - pos[i], bz = pos[i + 8] - pos[i + 2];
      if (az * bx - ax * bz < 0) for (let j = 0; j < 3; j++) { const t = pos[i + 3 + j]; pos[i + 3 + j] = pos[i + 6 + j]; pos[i + 6 + j] = t; }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  }
  const quad = (pos, a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  function drapeDisc(gy, c, lift = 0.05, step = 0.8) {
    const nr = Math.max(2, Math.ceil(c.r / step)), ns = clamp(Math.ceil(TAU * c.r / step), 16, 64), pos = [];
    const V = (i, j) => { const a = (j / ns) * TAU, r = (i / nr) * c.r, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r; return [x, gy(x, z) + lift, z]; };
    for (let j = 0; j < ns; j++) { pos.push(...V(0, 0), ...V(1, j), ...V(1, j + 1)); for (let i = 1; i < nr; i++) quad(pos, V(i, j), V(i + 1, j), V(i + 1, j + 1), V(i, j + 1)); }
    return fromTris(pos);
  }
  function drapeRibbon(gy, pts, w, lift = 0.05, step = 0.8) {
    const S = [];
    for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(L / step)); for (let k = 0; k < n; k++) S.push([lerp(ax, bx, k / n), lerp(az, bz, k / n)]); }
    S.push(pts[pts.length - 1]);
    const pos = [], row = i => { const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L; return [-1, 0, 1].map(s => { const x = S[i][0] + nx * s * w / 2, z = S[i][1] + nz * s * w / 2; return [x, gy(x, z) + lift, z]; }); };
    let prev = row(0);
    for (let i = 1; i < S.length; i++) { const cur = row(i); for (let j = 0; j < 2; j++) quad(pos, prev[j], cur[j], cur[j + 1], prev[j + 1]); prev = cur; }
    return fromTris(pos);
  }

  // ------------------------------------------------------------ colors: weathered blue-gray wood, bright doors and shutters, rope, reed thatch
  const WOOD = '#8c9aa3', WOOD_L = '#a9b5bb', WOOD_D = '#5f6b74', STILT = '#5b5048', STILT_D = '#463d37', PLANKS = ['#9aa6ac', '#8d9aa1', '#a3adb1', '#949fa5'];
  const ROPE = '#c9a66b', ROPE_D = '#a8864f', THATCH = '#c9a55a', THATCH_D = '#a8843f', SLATE = '#4f6470', SLATE_D = '#3d4f5a';
  const TRIM = '#f4efe4', STONE = '#a9aba4', STONE_D = '#8d8f88', IRON = '#2f3440', GLASS = '#8fc8e0', LAMP = '#ffe9a0';
  const LEAF = '#4f9a45', LEAF2 = '#5fae4f', REED = '#7f9a4a', REED2 = '#94a85a', CATTAIL = '#6b4a33', PAD = '#4f9a50', PAD2 = '#63ab5a';
  const FLOWERS = ['#e0503f', '#ff8fb1', '#ffffff', '#ffd84a', '#b9a2ff'], FLOATS = ['#e8743c', '#fdf8ee', '#d9483b'];

  // ------------------------------------------------------------ small things: lanterns, crates of fish, barrels, benches, coils of rope, nets
  function lantern(k, x, y, z) { k.box(x, y, z, 0.26, 0.34, 0.26, LAMP, { ink: 0.008 }).box(x, y + 0.21, z, 0.36, 0.08, 0.36, IRON).add(GEO.cone4, x, y + 0.24, z, 0.22, 0.16, 0.22, IRON, { ink: 0 }).box(x, y - 0.2, z, 0.3, 0.06, 0.3, IRON, { ink: 0 }); }
  function lampPost(k, out, x, y0, z, yaw = 0, colR = 0.2) {        // a lantern on a wooden post with a little arm
    k.frame(x, y0, z, yaw);
    k.post(0, 0, 0, 0.16, 2.5, 0.16, WOOD_D).box(0, 2.62, 0.26, 0.09, 0.09, 0.66, WOOD_D).beam(0, 2.1, 0.0, 0, 2.58, 0.42, 0.06, WOOD_D);
    lantern(k, 0, 2.24, 0.5); k.box(0, 2.48, 0.5, 0.02, 0.2, 0.02, IRON, { ink: 0 });
    for (let i = 0; i < 3; i++) k.add(GEO.torus, 0, 0.5 + i * 0.07, 0, 0.11, 0.11, 0.11, ROPE, { rx: Math.PI / 2, ink: 0 });
    if (colR) out.colliders.push({ x, z, r: colR });
    out.lamps.push(k.world(0, 2.24, 0.5));
  }
  const FISH = ['#9fb3bf', '#b8c6cc', '#8aa0ae', '#c9a46a'];
  function fishCrate(k, x, y, z, s, ry = 0, big = false, R = R0) {
    k.post(x, y, z, s, s * 0.45, s * 0.7, '#a8875a', { ry }).box(x, y + s * 0.44, z, s + 0.03, 0.05, s * 0.72, '#7f6440', { ry, ink: 0 });
    const n = big ? 3 : 6, c = Math.cos(ry), sn = Math.sin(ry);
    for (let i = 0; i < n; i++) {
      const lx = big ? (i - 1) * s * 0.3 : ((i % 3) - 1) * s * 0.3, lz = big ? 0 : ((i / 3 | 0) - 0.5) * s * 0.3, fs = big ? 0.42 : 0.22;
      const fx = x + lx * c + lz * sn, fz = z - lx * sn + lz * c, col = pick(FISH, R);
      k.ball(fx, y + s * 0.47, fz, fs * 0.22, col, { ry2: fs * 0.12, rz2: fs * 0.5, ry: ry + Math.PI / 2 + (R() - 0.5) * 0.3, geo: GEO.ball5, ink: 0.005 });
      k.add(GEO.cone4, fx + Math.cos(ry + Math.PI / 2) * 0 + c * fs * 0.55, y + s * 0.47, fz - sn * fs * 0.55, fs * 0.16, fs * 0.2, fs * 0.04, shade(col, 0.85), { rz: -Math.PI / 2, ry, ink: 0 });
    }
  }
  const barrel = (k, x, y, z, s = 1) => { k.cyl(x, y, z, 0.36 * s, 0.86 * s, '#8a6a4a', { geo: GEO.cyl8 }); for (const hy of [0.16, 0.68]) k.cyl(x, y + hy * s, z, 0.38 * s, 0.07 * s, IRON, { geo: GEO.cyl8, ink: 0 }); };
  const ropeCoil = (k, x, y, z, s = 1) => { for (let i = 0; i < 3; i++) k.add(GEO.torus, x, y + 0.05 + i * 0.07 * s, z, (0.3 - i * 0.05) * s, (0.3 - i * 0.05) * s, (0.3 - i * 0.05) * s, i % 2 ? ROPE_D : ROPE, { rx: Math.PI / 2, ink: 0.006 }); };
  const bollard = (k, x, y, z) => { k.cyl(x, y, z, 0.16, 0.5, STILT, { geo: GEO.cyl8 }).add(GEO.torus, x, y + 0.36, z, 0.17, 0.17, 0.17, ROPE, { rx: Math.PI / 2, ink: 0 }).ball(x, y + 0.5, z, 0.17, STILT_D, { ry2: 0.07, ink: 0 }); };
  function bench(k, out, x, z, ry, y = GY, color = '#7f97a6') {
    k.frame(x, y, z, ry);
    k.box(0, 0.48, 0, 1.7, 0.09, 0.5, color).box(0, 0.86, -0.24, 1.7, 0.4, 0.07, color, { rx: -0.12 });
    for (const s of [-1, 1]) k.post(s * 0.7, 0, 0, 0.1, 0.48, 0.45, WOOD_D);
    out.colliders.push({ obox: 1, x, z, hw: 0.9, hd: 0.32, rot: ry }); out.benches.push({ x, z, yaw: ry, y });
  }
  // a fishing net hung on a frame of two posts (in the frame's x), with floats along the top and a little sag
  function netFrame(k, out, x0, x1, z, y, h = 1.9) {
    const L = x1 - x0;
    for (const x of [x0, x1]) { k.post(x, y - 0.3, z, 0.14, h + 0.4, 0.14, WOOD_D); const p = k.world(x, 0, z); out.colliders.push({ x: p.x, z: p.z, r: 0.2 }); }
    k.box((x0 + x1) / 2, y + h, z, L + 0.3, 0.1, 0.1, WOOD);
    const NC = '#4f6a62', top = y + h - 0.08, bot = y + 0.35, n = Math.max(4, Math.round(L / 0.32));
    const sag = (x, yy) => yy - 0.18 * Math.sin(Math.PI * (x - x0) / L) * (top - yy) / (top - bot);
    for (let i = 0; i <= n; i++) { const x = x0 + (i / n) * L; k.beam(x, top, z, x + (i % 2 ? 0.08 : -0.08), sag(x, bot), z + 0.02, 0.02, NC, { ink: 0 }); }
    for (let j = 1; j <= 5; j++) { const yy = top - (j / 5) * (top - bot); for (let i = 0; i < 4; i++) { const xa = x0 + (i / 4) * L, xb = x0 + ((i + 1) / 4) * L; k.beam(xa, sag(xa, yy), z + 0.02, xb, sag(xb, yy), z + 0.02, 0.022, NC, { ink: 0 }); } }
    for (let i = 0; i < n; i += 2) k.ball(x0 + (i / n) * L + 0.1, top - 0.05, z + 0.05, 0.08, FLOATS[i % 3], { geo: GEO.ball5, ink: 0.005 });
  }
  // ------------------------------------------------------------ houses: painted boards over a dark base, white corner trim, bright doors and
  // shutters, reed thatch or blue slate; the stilt houses stand over the lake on dark posts, with a porch where their pier arrives
  function win(k, x, y, zf, o = {}) {
    const wh = o.h || 0.8, ww = o.w || 0.72;
    k.box(x, y, zf + 0.03, ww + 0.2, wh + 0.2, 0.08, TRIM, { ink: 0.008 }).box(x, y, zf + 0.06, ww, wh, 0.06, GLASS, { ink: 0 });
    k.box(x, y, zf + 0.09, 0.05, wh, 0.03, TRIM, { ink: 0 }).box(x, y, zf + 0.09, ww, 0.05, 0.03, TRIM, { ink: 0 });
    if (o.shutter) for (const s of [-1, 1]) { k.box(x + s * (ww / 2 + 0.27), y, zf + 0.07, 0.36, wh + 0.06, 0.06, o.shutter, { ink: 0.008 }); for (let i = -1; i <= 1; i++) k.box(x + s * (ww / 2 + 0.27), y + i * wh * 0.28, zf + 0.11, 0.3, 0.035, 0.02, shade(o.shutter, 0.78), { ink: 0 }); }
    if (o.box) {      // a flower box
      k.box(x, y - wh / 2 - 0.16, zf + 0.2, ww + 0.3, 0.18, 0.26, o.boxColor || '#7a5a3e', { ink: 0.006 });
      for (let i = 0; i < 5; i++) k.add(GEO.ico0, x - ww / 2 + (i + 0.5) * (ww / 5) + 0.02, y - wh / 2 - 0.02, zf + 0.22, 0.1, 0.09, 0.1, i % 2 ? LEAF : LEAF2, { ink: 0 });
      for (let i = 0; i < 4; i++) k.add(GEO.ico0, x - ww / 2 + (i + 0.7) * (ww / 4), y - wh / 2 + 0.06, zf + 0.26, 0.06, 0.06, 0.06, FLOWERS[(i + (o.seed || 0)) % 5], { ink: 0 });
    }
  }
  function porthole(k, x, y, zf, r, color) { k.add(GEO.cyl16, x, y, zf + 0.04, r + 0.07, 0.08, r + 0.07, color, { rx: Math.PI / 2, ink: 0.006 }).add(GEO.cyl16, x, y, zf + 0.07, r, 0.04, r, GLASS, { rx: Math.PI / 2, ink: 0 }); }
  function boards(k, w, H, zf, color, y0 = 0.32) {        // clapboard lines across a wall (in the frame's x)
    for (let y = y0 + 0.34; y < H - 0.12; y += 0.36) k.box(0, y, zf + 0.012, w - 0.04, 0.035, 0.02, color, { ink: 0 });
  }
  function wallFace(k, h, y0, i) { k.frame(h.x, y0, h.z, h.rot + [0, Math.PI / 2, Math.PI, -Math.PI / 2][i]); return i % 2 ? { hz: h.w / 2, hw: h.d / 2 } : { hz: h.d / 2, hw: h.w / 2 }; }
  // a gable roof with its ridge along x (thatch is thick and soft-edged; slate is thin, with shingle rows)
  function roof(k, w, d, H, kind, wall) {
    const thatch = kind === 'thatch', pitch = thatch ? 0.66 : 0.56, ov = thatch ? 0.5 : 0.36, tp = Math.tan(pitch), cp = Math.cos(pitch), sp = Math.sin(pitch), hR = (d / 2) * tp, t = thatch ? 0.34 : 0.16;
    const C = thatch ? THATCH : SLATE, CD = thatch ? THATCH_D : SLATE_D;
    k.add(GEO.prism, 0, H, 0, w, hR, d, wall);
    for (const s of [-1, 1]) {
      const zm = (d / 2 + ov) / 2, ym = H + hR - zm * tp, L = (d / 2 + ov) / cp + 0.04;
      k.box(0, ym + (t / 2) * cp, s * (zm + (t / 2) * sp), w + (thatch ? 0.8 : 0.6), t, L, C, { rx: s * pitch });
      if (thatch) { const ze = d / 2 + ov - 0.08, ye = H + hR - ze * tp; k.box(0, ye + 0.02, s * (ze + 0.1), w + 0.84, 0.16, 0.2, CD, { rx: s * pitch, ink: 0.006 }); }
      else for (let i = 1; i <= 4; i++) { const z = (i / 5) * (d / 2 + ov), y = H + hR - z * tp; k.box(0, y + (t + 0.015) * cp, s * (z + (t + 0.015) * sp), w + 0.62, 0.04, 0.1, CD, { rx: s * pitch, ink: 0 }); }
    }
    k.add(GEO.cyl8, 0, H + hR + (thatch ? 0.22 : 0.12), 0, thatch ? 0.26 : 0.14, w + (thatch ? 0.9 : 0.7), thatch ? 0.26 : 0.14, CD, { rz: Math.PI / 2 });
    return z => H + hR - Math.abs(z) * tp;
  }
  function chimney(k, x, z, base, out, smoke) {
    k.post(x, base - 0.5, z, 0.56, 1.5, 0.56, STONE).post(x, base + 1.0, z, 0.7, 0.1, 0.7, STONE_D);
    if (smoke) out.smoke.push(k.world(x, base + 1.2, z));
  }
  function drawHouse(k, out, h, gy) {
    const R = rng(h.id.charCodeAt(0) * 131 + h.id.length * 17 + (h.id.charCodeAt(1) || 0)), stilt = h.kind === 'stilt', fl = h.floors || 1;
    const y0 = stilt ? DECK : Math.min(...corners(h).map(([x, z]) => gy(x, z)), gy(h.x, h.z), GY + 0.05);
    const { w, d } = h, H = fl > 1 ? 4.9 : 2.75, wall = h.wall, line = shade(wall, 0.84);
    let f = wallFace(k, h, y0, 0);
    if (stilt) {
      // the posts down to the lake bed (with a dark band where the water laps), braces, the floor, the porch
      const spots = [];
      for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) spots.push([sx * (w / 2 - 0.12), sz * (d / 2 - 0.12)]);
      for (const sx of [-1, 1]) spots.push([sx * (w / 2 + 0.05), d / 2 + 1.25]);
      for (const [lx, lz] of spots) {
        const [wx, wz] = toWorld(h, lx, lz), bed = Math.min(gy(wx, wz), WATER - 0.3);
        k.cyl(lx, bed - y0 - 0.4, lz, 0.15, y0 - bed + 0.3, STILT, { geo: GEO.cyl8 }).cyl(lx, WATER - y0 - 0.08, lz, 0.17, 0.22, '#4d5a3c', { geo: GEO.cyl8, ink: 0 });
      }
      for (const sz of [-1, 1]) { k.beam(-w / 2 + 0.12, -0.25, sz * (d / 2 - 0.12), 0, WATER - y0 + 0.1, sz * (d / 2 - 0.12), 0.1, STILT_D, { ink: 0.006 }).beam(w / 2 - 0.12, -0.25, sz * (d / 2 - 0.12), 0, WATER - y0 + 0.1, sz * (d / 2 - 0.12), 0.1, STILT_D, { ink: 0.006 }); }
      k.post(0, -0.24, 0.6, w + 0.5, 0.24, d + 1.7, WOOD_D);
      for (let i = 0; i < 5; i++) k.box(0, 0.025, d / 2 + 0.14 + i * 0.28, w + 0.36, 0.05, 0.26, PLANKS[(i + 1) % 4], { ink: 0 });
      // the porch rail, open in the middle where the pier comes in
      for (const sx of [-1, 1]) {
        const xe = sx * (w / 2 + 0.12), xi = sx * 1.0;
        for (const [px, pz] of [[xe, d / 2 + 0.08], [xe, d / 2 + 1.32], [xi, d / 2 + 1.32]]) k.post(px, 0, pz, 0.12, 0.95, 0.12, WOOD_D, { ink: 0.006 });
        k.box(xe, 0.9, d / 2 + 0.7, 0.08, 0.07, 1.24, WOOD_L, { ink: 0.005 }).box((xe + xi) / 2, 0.9, d / 2 + 1.32, Math.abs(xe - xi), 0.07, 0.08, WOOD_L, { ink: 0.005 });
        k.box((xe + xi) / 2, 0.5, d / 2 + 1.32, Math.abs(xe - xi), 0.05, 0.05, WOOD, { ink: 0 });
        for (const [px, pz] of [[xe, d / 2 + 0.08], [xe, d / 2 + 1.32], [xi, d / 2 + 1.32]]) { const p = k.world(px, 0, pz); out.colliders.push({ x: p.x, z: p.z, r: 0.12 }); }
        for (let i = 1; i < 4; i++) { const p = k.world(xe, 0, d / 2 + 0.08 + i * 0.31); out.colliders.push({ x: p.x, z: p.z, r: 0.1 }); }
      }
      // a life ring and a string of floats on the front wall, a coil of rope on the porch
      k.add(GEO.torus, -w / 2 + 0.55, 1.75, d / 2 + 0.1, 0.32, 0.32, 0.5, '#e8e2d6', { ink: 0.008 });
      for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; k.add(GEO.torus, -w / 2 + 0.55 + Math.cos(a) * 0.32, 1.75 + Math.sin(a) * 0.32, d / 2 + 0.12, 0.09, 0.09, 0.4, '#d9483b', { ink: 0, rz: a }); }
      ropeCoil(k, w / 2 - 0.45, 0.02, d / 2 + 0.55, 0.9);
    } else k.post(0, -0.7, 0, w + 0.24, 1.0, d + 0.24, STONE);
    // the walls, their boards and trim
    k.post(0, 0, 0, w, H, d, wall);
    k.post(0, 0, 0, w + 0.06, 0.32, d + 0.06, shade(wall, 0.68), { ink: 0.006 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 - 0.04), 0, sz * (d / 2 - 0.04), 0.18, H, 0.18, TRIM, { ink: 0.005 });
    if (fl > 1) k.box(0, 2.7, 0, w + 0.12, 0.14, d + 0.12, TRIM, { ink: 0.005 });
    for (const i of [0, 1, 2, 3]) { const g = wallFace(k, h, y0, i); boards(k, g.hw * 2, H, g.hz, line); }
    f = wallFace(k, h, y0, 0);
    const dx = h.doorX, fz = d / 2;
    if (h.kind === 'shed') {
      // a wide open front: the dark inside, the frame, two doors folded back
      k.box(0, 1.25, fz + 0.01, 3.2, 2.5, 0.06, '#3a322e', { ink: 0 }).box(0, 2.6, fz + 0.05, 3.6, 0.22, 0.14, TRIM).post(-1.7, 0, fz + 0.05, 0.18, 2.6, 0.14, TRIM).post(1.7, 0, fz + 0.05, 0.18, 2.6, 0.14, TRIM);
      for (const s of [-1, 1]) { k.box(s * 2.45, 1.2, fz + 0.12, 1.5, 2.3, 0.08, h.door); for (let i = 0; i < 5; i++) k.box(s * 2.45 - 0.6 + i * 0.3, 1.2, fz + 0.17, 0.03, 2.2, 0.02, shade(h.door, 0.75), { ink: 0 }); k.beam(s * 1.8, 0.2, fz + 0.17, s * 3.1, 2.2, fz + 0.17, 0.08, shade(h.door, 0.8), { ink: 0 }); }
      // the sign over the door: an oar and a little boat
      k.box(0, 3.05, fz + 0.1, 2.4, 0.5, 0.08, '#e8dcc0').box(0, 3.05, fz + 0.06, 2.55, 0.62, 0.05, WOOD_D, { ink: 0 });
      k.add(GEO.half, 0, 3.0, fz + 0.16, 0.6, 0.18, 0.06, '#d9483b', { rx: Math.PI, ink: 0 }).beam(-0.95, 2.86, fz + 0.16, 0.95, 3.24, fz + 0.16, 0.05, '#7a5a3e', { ink: 0 });
      for (const i of [1, 3]) { const g = wallFace(k, h, y0, i); win(k, 0, 1.6, g.hz, { w: 0.9, h: 0.6 }); }
      f = wallFace(k, h, y0, 0);
    } else {
      // the door (a round window in it), a little roof over it, a lantern; windows with shutters and flower boxes
      k.box(dx, 1.15, fz + 0.03, 1.2, 2.2, 0.08, TRIM).box(dx, 1.08, fz + 0.06, 0.92, 2.06, 0.08, h.door);
      for (const s of [-1, 1]) k.box(dx + s * 0.2, 1.0, fz + 0.11, 0.04, 1.7, 0.02, shade(h.door, 0.74), { ink: 0 });
      porthole(k, dx, 1.62, fz + 0.06, 0.16, shade(h.door, 0.82));
      k.add(GEO.ico0, dx + 0.32, 1.02, fz + 0.12, 0.05, 0.05, 0.05, '#e6b84a', { ink: 0 });
      k.box(dx, 2.42, fz + 0.38, 1.6, 0.08, 0.76, h.roof === 'thatch' ? THATCH_D : SLATE, { rx: 0.32 });
      for (const s of [-1, 1]) k.beam(dx + s * 0.7, 2.05, fz + 0.02, dx + s * 0.7, 2.38, fz + 0.6, 0.06, WOOD_D, { ink: 0 });
      lantern(k, dx + 0.85, 2.0, fz + 0.24);
      const slots = [-w / 2 + 0.95, w / 2 - 0.95].filter(x => Math.abs(x - dx) > 1.35);
      slots.forEach((x, i) => win(k, x, 1.55, fz, { shutter: h.shutter, box: R() < 0.8, seed: i + (R() * 5 | 0) }));
      if (fl > 1) for (const x of [-w / 4, w / 4]) win(k, x, 3.8, fz, { shutter: h.shutter, box: R() < 0.5, seed: 2 });
      for (const i of [1, 2, 3]) {
        const g = wallFace(k, h, y0, i);
        win(k, 0, 1.55, g.hz, { shutter: i === 2 ? null : h.shutter, w: 0.6, h: 0.66 });
        if (fl > 1) win(k, 0, 3.8, g.hz, { w: 0.56, h: 0.6 });
      }
      f = wallFace(k, h, y0, 0);
    }
    // the roof; a chimney on the shore houses; a round window in the gable
    const at = roof(k, w, d, H, h.roof, wall);
    for (const s of [-1, 1]) { k.frame(h.x, y0, h.z, h.rot + s * Math.PI / 2); porthole(k, 0, H + 0.42, w / 2, 0.2, TRIM); }
    k.frame(h.x, y0, h.z, h.rot);
    if (!stilt) chimney(k, (R() < 0.5 ? -1 : 1) * w * 0.28, -d * 0.18, at(-d * 0.18), out, h.id !== 'shed');
    else if (h.id === 'marina') chimney(k, -w * 0.3, -d * 0.2, at(-d * 0.2), out, true);
    out.colliders.push({ obox: 1, x: h.x, z: h.z, hw: w / 2 + 0.12, hd: d / 2 + 0.12, rot: h.rot });
    return { y0, H, at };
  }
  // Marina's house: her flag, a bench and pots on the porch, a bell-rope by the door (she's the village head)
  function marinaExtras(k, out, h) {
    const { w, d } = h, fz = d / 2;
    k.frame(h.x, DECK, h.z, h.rot);
    k.cyl(w / 2 - 0.3, 0, fz + 1.18, 0.05, 3.3, WOOD_D, { geo: GEO.cyl6, ink: 0.005 }).ball(w / 2 - 0.3, 3.32, fz + 1.18, 0.07, '#e6b84a', { ink: 0 });
    k.add(GEO.prism, w / 2 - 0.27, 2.98, fz + 1.18, 0.03, 0.95, 0.56, '#2f8f8a', { rx: -Math.PI / 2, rz: -Math.PI / 2, b: 'sway', ink: 0.004, sway: { y0: 2.6, y1: 3.3, k: 0.6 } });
    for (const x of [-w / 2 + 0.5, -w / 2 + 1.0]) { k.cyl(x, 0, fz + 1.05, 0.2, 0.36, '#c46a3a', { geo: GEO.cyl8 }).add(GEO.ico1, x, 0.5, fz + 1.05, 0.27, 0.22, 0.25, LEAF2, { ink: 0.008 }); for (let i = 0; i < 3; i++) k.add(GEO.ico0, x + (i - 1) * 0.12, 0.66, fz + 1.08, 0.07, 0.07, 0.07, FLOWERS[i], { ink: 0 }); }
    for (const x of [-w / 2 + 0.5, -w / 2 + 1.0]) { const p = k.world(x, 0, fz + 1.05); out.colliders.push({ x: p.x, z: p.z, r: 0.24 }); }
  }

  // ------------------------------------------------------------ boardwalks: planks across, two stringers, posts down to the lake bed
  function drawWalk(k, out, a, b, w, y0, y1, gy, o = {}) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, rot = Math.atan2(ux, uz), R = rng(Math.round(a[0] * 7 + a[1] * 3));
    const yAt = t => lerp(y0, y1, t), slope = Math.atan2(y1 - y0, L);
    k.frame(a[0], 0, a[1], rot);
    const n = Math.max(1, Math.round(L / 0.42));
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; k.box((R() - 0.5) * 0.04, yAt(t) - 0.045 + (R() - 0.5) * 0.012, t * L, w + (R() - 0.5) * 0.08, 0.09, L / n - 0.03, PLANKS[(i * 7 + (R() * 2 | 0)) % 4], { ink: 0, ry: (R() - 0.5) * 0.04, rx: -slope }); }
    for (const s of [-1, 1]) k.beam(s * (w / 2 - 0.16), y0 - 0.17, -0.05, s * (w / 2 - 0.16), y1 - 0.17, L + 0.05, 0.16, WOOD_D, { t2: 0.2 });
    if (o.edge !== false) for (const s of [-1, 1]) k.beam(s * (w / 2 + 0.02), y0 - 0.06, 0, s * (w / 2 + 0.02), y1 - 0.06, L, 0.06, WOOD, { t2: 0.14, ink: 0.004 });
    const m = Math.max(1, Math.round(L / (o.step || 2.4)));
    for (let i = 0; i <= m; i++) {
      const t = i / m, lz = t * L;
      for (const s of [-1, 1]) {
        const lx = s * (w / 2 - 0.1), [wx, wz] = toWorld({ x: a[0], z: a[1], rot }, lx, lz), g = gy(wx, wz), top = yAt(t) - 0.12;
        if (g > top - 0.15) continue;
        const bed = Math.min(g, WATER - 0.3);
        k.cyl(lx, bed - 0.4, lz, 0.12, top - bed + 0.4, STILT, { geo: GEO.cyl8 });
        if (g < WATER) k.cyl(lx, WATER - 0.1, lz, 0.14, 0.2, '#4d5a3c', { geo: GEO.cyl8, ink: 0 });
      }
    }
    out.walks.push({ a, b, w, y: [y0, y1] });
  }
  function drawDeck(k, out, b, y, gy) {           // a square deck (the ferry dock): planks along z, posts on a grid
    const W = b.x1 - b.x0, D = b.z1 - b.z0, n = Math.round(W / 0.42), R = rng(77);
    k.frame(0, 0, 0, 0);
    for (let i = 0; i < n; i++) { const x = b.x0 + (i + 0.5) * W / n; k.box(x, y - 0.045 + (R() - 0.5) * 0.01, (b.z0 + b.z1) / 2, W / n - 0.03, 0.09, D, PLANKS[(i * 3 + (R() * 2 | 0)) % 4], { ink: 0 }); }
    k.post((b.x0 + b.x1) / 2, y - 0.32, (b.z0 + b.z1) / 2, W - 0.1, 0.22, D - 0.1, WOOD_D);
    for (const z of [b.z0, b.z1]) k.box((b.x0 + b.x1) / 2, y - 0.06, z, W + 0.04, 0.14, 0.06, WOOD, { ink: 0.004 });
    for (const x of [b.x0, b.x1]) k.box(x, y - 0.06, (b.z0 + b.z1) / 2, 0.06, 0.14, D + 0.04, WOOD, { ink: 0.004 });
    for (let x = b.x0 + 0.15; x <= b.x1 - 0.1; x += (W - 0.3) / Math.round((W - 0.3) / 2.2)) for (let z = b.z0 + 0.15; z <= b.z1 - 0.1; z += (D - 0.3) / Math.round((D - 0.3) / 2.2)) {
      const bed = Math.min(gy(x, z), WATER - 0.3);
      k.cyl(x, bed - 0.4, z, 0.14, y - 0.12 - bed + 0.4, STILT, { geo: GEO.cyl8 }).cyl(x, WATER - 0.1, z, 0.16, 0.2, '#4d5a3c', { geo: GEO.cyl8, ink: 0 });
    }
  }

  // ------------------------------------------------------------ the broken bridge: two stubs on log piles, the middle fallen into the river,
  // planks hanging down into the water; the raft docks just downstream
  function drawBridge(k, out, gy) {
    const { x: X, z: Z, half, gap, top, w } = BR, R = rng(150);
    const ends = [];
    for (const s of [1, -1]) {
      const xIn = X + s * gap, xOut = X + s * half, xRoad = X + s * (half + 1.7), yRoad = gy(xRoad, Z) + 0.04;
      ends.push({ s, xIn, xOut, xRoad, yRoad });
      // the ramp up from the road, then the deck out to the break (planks across, two log stringers under)
      const n = Math.round(Math.abs(xIn - xOut) / 0.44);
      k.frame(0, 0, 0, 0);
      for (let i = 0; i < n; i++) {
        const x = xOut + (xIn - xOut) * (i + 0.5) / n, last = i >= n - 2, missing = i === n - 1 && s > 0;
        if (missing) continue;
        k.box(x, top - 0.05 - (last ? 0.04 : 0), Z + (R() - 0.5) * 0.12, Math.abs(xIn - xOut) / n - 0.05, 0.1, w - (last ? R() * 0.6 : 0), PLANKS[i % 4], { ink: 0, rx: (R() - 0.5) * (last ? 0.12 : 0.03), ry: (R() - 0.5) * 0.05 });
      }
      const nr = Math.round((half + 1.7 - half) / 0.44) + 1;
      for (let i = 0; i < nr; i++) { const t = (i + 0.5) / nr, x = lerp(xRoad, xOut, t), y = lerp(yRoad, top, t); k.box(x, y - 0.05, Z, 1.7 / nr * 1.0 - 0.04, 0.1, w - 0.1, PLANKS[(i + 2) % 4], { ink: 0, rz: -s * Math.atan2(top - yRoad, 1.7) }); }
      for (const sz of [-1, 1]) {
        k.beam(xRoad, yRoad - 0.2, Z + sz * (w / 2 - 0.25), xOut, top - 0.2, Z + sz * (w / 2 - 0.25), 0.22, STILT, { geo: GEO.cyl8 });
        k.beam(xOut, top - 0.2, Z + sz * (w / 2 - 0.25), xIn + s * (sz > 0 ? 0.3 : 0.0), top - 0.2, Z + sz * (w / 2 - 0.25), 0.24, STILT, { geo: GEO.cyl8 });
      }
      // log piles: at the break and at the bank, pairs, down to the river bed
      for (const px of [xIn + s * 0.15, X + s * 4.0]) for (const sz of [-1, 1]) {
        const pz = Z + sz * (w / 2 - 0.1), bed = Math.min(gy(px, pz), WATER - 0.2);
        k.cyl(px, bed - 0.5, pz, 0.17, top - bed + 0.25, STILT, { geo: GEO.cyl8 }).ball(px, top + 0.25, pz, 0.17, STILT_D, { ry2: 0.06, ink: 0 });
      }
      for (const sz of [-1, 1]) k.beam(xIn + s * 0.15, WATER + 0.1, Z + sz * (w / 2 - 0.1), xIn + s * 1.6, top - 0.25, Z + sz * (w / 2 - 0.1), 0.1, STILT_D, { ink: 0.006 });
      // the abutment: a crib of logs on the bank
      for (let i = 0; i < 3; i++) k.beam(xOut, gy(xOut, Z) - 0.2 + i * 0.32, Z - w / 2 - 0.2, xOut, gy(xOut, Z) - 0.2 + i * 0.32, Z + w / 2 + 0.2, 0.3, i % 2 ? STILT : STILT_D, { geo: GEO.cyl8 });
      // the railing: posts and a top rail; the last bit by the break hangs loose
      for (const sz of [-1, 1]) {
        const zr = Z + sz * (w / 2 - 0.05), xs = [];
        for (let x = xOut; s > 0 ? x > xIn + 0.6 : x < xIn - 0.6; x -= s * 1.15) xs.push(x);
        for (const x of xs) { k.post(x, top, zr, 0.12, 0.95, 0.12, STILT, { ink: 0.006 }); out.colliders.push({ x, z: zr, r: 0.12 }); }
        const xl = xs[xs.length - 1];
        k.beam(xOut, top + 0.9, zr, xl, top + 0.9, zr, 0.09, '#7a6a5c', { ink: 0.005 }).beam(xOut, top + 0.48, zr, xl, top + 0.48, zr, 0.06, '#6b5a4e', { ink: 0 });
        if (sz > 0) k.beam(xl, top + 0.9, zr, xl - s * 1.1, top - 0.35, zr + 0.25, 0.08, '#7a6a5c', { ink: 0.005 });
        else k.post(xl - s * 0.8, top, zr, 0.12, 0.45, 0.12, STILT, { rz: s * 0.4 });
        k.post(xRoad + s * 0.1, yRoad - 0.1, zr, 0.16, 1.15, 0.16, STILT, { ink: 0.008 });
        out.colliders.push({ x: xRoad + s * 0.1, z: zr, r: 0.14 });
      }
      // planks dangling from the break into the water, a fallen stringer
      for (let i = 0; i < 3; i++) {
        const zz = Z + (i - 1) * 0.7 + (R() - 0.5) * 0.2, L = 1.4 + R() * 0.6, ang = 0.9 + R() * 0.45;
        const x0 = xIn - s * (s > 0 ? 0.25 : 0.05), y0 = top - 0.1;
        k.beam(x0, y0, zz, x0 - s * Math.cos(ang) * L, y0 - Math.sin(ang) * L, zz + (R() - 0.5) * 0.4, 0.4, PLANKS[(i + 1) % 4], { t2: 0.08, ink: 0.006 });
      }
      k.beam(xIn, top - 0.22, Z - s * (w / 2 - 0.25), xIn - s * 1.9, WATER - 0.4, Z - s * (w / 2 - 0.1), 0.2, STILT, { geo: GEO.cyl8 });
    }
    // a plank adrift in the gap, and a lantern post at the east end of the bridge
    k.frame(X + 0.3, WATER + 0.03, Z + 1.6, 0.5); k.box(0, 0, 0, 1.5, 0.08, 0.36, PLANKS[0], { ink: 0.006 });
    lampPost(k, out, X + half + 2.1, gy(X + half + 2.1, Z + 2.2), Z + 2.2, -Math.PI / 2);
    out.bridgeEnds = ends;
  }
  function drawDocks(k, out, gy) {
    for (const D of [DOCK_E, DOCK_W]) {
      const s = Math.sign(D.x0 - DX), yb = Math.max(gy(D.x0, D.z) + 0.1, 0.14), yw = 0.12;
      drawWalk(k, out, [D.x0, D.z], [D.x1, D.z], D.w, yb, yw, gy, { step: 1.5 });
      k.frame(0, 0, 0, 0);
      bollard(k, D.x1 + s * 0.25, yw, D.z - D.w / 2 + 0.2);
      bollard(k, D.x1 + s * 0.25, yw, D.z + D.w / 2 - 0.2);
      lampPost(k, out, D.x0 + s * 0.6, gy(D.x0 + s * 0.6, D.z + 1.5), D.z + 1.5, s > 0 ? -Math.PI / 2 : Math.PI / 2);
      out.dockTops.push({ D, yb, yw });
    }
    // a coil of rope and an old oar on the east dock
    ropeCoil(k, DOCK_E.x0 - 0.9, out.dockTops[0].yb - 0.02, DZ - 0.5, 0.8);
    k.frame(0, 0, 0, 0); k.beam(DOCK_E.x0 - 2.0, 0.2, DZ + 0.62, DOCK_E.x0 - 0.2, 0.32, DZ + 0.7, 0.06, '#b07a48', { ink: 0.006 }).box(DOCK_E.x0 - 2.15, 0.2, DZ + 0.6, 0.12, 0.04, 0.3, '#b07a48', { ry: 0.05 });
  }
  // ------------------------------------------------------------ trees (molinar's round ones and bushes, plus willows by the water and pines)
  const TREES = {
    round(k, s) { k.cyl(0, 0, 0, 0.2 * s, 2.3 * s, '#8a5f3e', { b: 'sway', geo: GEO.cyl8 }); [[0, 2.9, 0, 1.15], [0.85, 2.55, 0.3, 0.85], [-0.8, 2.6, -0.2, 0.9], [0.15, 3.55, -0.25, 0.8], [-0.25, 2.5, 0.8, 0.78]].forEach(([x, y, z, r], i) => k.ball(x * s, y * s, z * s, r * s, ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653', '#55a346'][i], { b: 'sway', geo: GEO.ico1, sway: { y0: 1.4 * s, y1: 4 * s, k: 1 } })); },
    pine(k, s) { k.cyl(0, 0, 0, 0.16 * s, 1.2 * s, '#7c5436', { b: 'sway', geo: GEO.cyl6 }); [[1.0, 1.15, 1.7], [1.9, 0.9, 1.4], [2.7, 0.62, 1.1]].forEach(([y, r, h], i) => k.add(GEO.cone, 0, y * s + h * s / 2, 0, r * s * 1.2, h * s, r * s * 1.2, ['#3f7f45', '#468a4a', '#4f9450'][i], { b: 'sway', sway: { y0: 0.8 * s, y1: 4 * s, k: 0.5 } })); },
    willow(k, s, R) {
      k.beam(0, -0.1, 0, 0.3 * s, 2.4 * s, 0.1 * s, 0.34 * s, '#7a6a52', { b: 'sway', geo: GEO.cyl8 }).beam(0.3 * s, 2.4 * s, 0.1 * s, -0.2 * s, 3.2 * s, 0, 0.22 * s, '#7a6a52', { b: 'sway', geo: GEO.cyl8 });
      k.ball(0.05 * s, 3.5 * s, 0, 1.25 * s, '#8fb85a', { b: 'sway', ry2: 0.75 * s, geo: GEO.ico1, sway: { y0: 1.5 * s, y1: 4.3 * s, k: 0.9 } });
      for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + R() * 0.3, r = (1.05 + R() * 0.3) * s; k.ball(Math.cos(a) * r, 2.45 * s, Math.sin(a) * r, 0.42 * s, i % 2 ? '#9cc463' : '#86b052', { b: 'sway', ry2: 1.0 * s, rz2: 0.36 * s, ry: -a, geo: GEO.ico1, sway: { y0: 1.2 * s, y1: 3.8 * s, k: 1.2 } }); }
    },
    bush(k, s, R) { for (let i = 0; i < 3; i++) k.ball((i - 1) * 0.42 * s, 0.38 * s, (R() - 0.5) * 0.3 * s, (0.45 + R() * 0.12) * s, ['#4f9c3f', '#5aa84a', '#469240'][i], { b: 'sway', geo: GEO.ico1, sway: { y0: 0.2, y1: 1.2 * s, k: 0.25 } }); },
  };
  function tree(k, out, kind, x, z, s, R, y, colR) { k.frame(x, y, z, R() * TAU); TREES[kind](k, s, R); if (colR !== 0) out.colliders.push({ x, z, r: colR || (kind === 'bush' ? 0.6 * s : kind === 'willow' ? 0.5 * s : 0.42 * s) }); }

  // ------------------------------------------------------------ the island: rocks, trees, the old lighthouse (its door looks east), a landing
  function drawIsland(k, out, gy) {
    const I = ISLE, R = rng(212);
    let y0 = 1e9; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; y0 = Math.min(y0, gy(I.x + Math.cos(a) * 1.9, I.z + Math.sin(a) * 1.9)); }
    k.frame(I.x, y0, I.z, Math.PI / 2);                 // (local +z is east: the door's side)
    const TR = 1.5, TH = 6.4, rAt = y => TR * (1 - 0.22 * clamp(y / TH, 0, 1)), WHITE = '#f1ece0', RED = '#c4574a';
    k.cyl(0, -0.5, 0, 2.0, 0.85, STONE, { geo: GEO.cyl16 }).cyl(0, 0.3, 0, 1.85, 0.14, STONE_D, { geo: GEO.cyl16, ink: 0.008 });
    k.add(GEO.taper20, 0, 0.35 + TH / 2, 0, TR, TH, TR, WHITE);
    for (const [ya, yb] of [[1.5, 2.3], [3.9, 4.7]]) k.add(GEO.taper20, 0, 0.35 + (ya + yb) / 2, 0, rAt(ya) + 0.03, yb - ya, rAt(ya) + 0.03, RED, { ink: 0.006 });
    for (let i = 0; i < 26; i++) { const a = R() * TAU, y = 0.6 + R() * (TH - 1); if (Math.abs(angDiff(a, Math.PI / 2)) < 0.5 && y < 2.6) continue; k.box(Math.cos(a) * (rAt(y) + 0.01), 0.35 + y, Math.sin(a) * (rAt(y) + 0.01), 0.05, 0.12, 0.4 + R() * 0.3, '#d9d3c4', { ry: -a, ink: 0 }); }
    // the door (east), its stone frame and steps, a lantern; two little windows up the tower
    const dz = TR - 0.04;
    k.box(0, 0.35 + 0.95, dz, 1.3, 1.9, 0.3, STONE).add(GEO.halfDisc, 0, 0.35 + 1.9, dz, 0.65, 0.3, 0.65, STONE, { rx: -Math.PI / 2 });
    k.box(0, 0.35 + 0.88, dz + 0.12, 0.92, 1.76, 0.12, '#2f6f6a', { ink: 0.008 }).add(GEO.halfDisc, 0, 0.35 + 1.76, dz + 0.12, 0.46, 0.12, 0.46, '#2f6f6a', { rx: -Math.PI / 2, ink: 0.008 });
    for (const y of [0.6, 1.5]) k.box(0, 0.35 + y, dz + 0.2, 0.9, 0.08, 0.03, IRON, { ink: 0 });
    k.add(GEO.torus, 0.25, 0.35 + 1.05, dz + 0.22, 0.09, 0.09, 0.09, IRON, { ink: 0 });
    for (let i = 0; i < 2; i++) k.box(0, 0.3 - i * 0.22, dz + 0.45 + i * 0.4, 1.5 + i * 0.3, 0.2, 0.5, i ? STONE_D : STONE);
    lantern(k, 0.95, 0.35 + 2.1, dz + 0.32); k.box(0.95, 0.35 + 2.4, dz + 0.16, 0.05, 0.05, 0.36, IRON, { ink: 0 });
    for (const [a, y] of [[2.4, 3.2], [-1.2, 5.0], [0.5, 5.6]]) { const rr = rAt(y); k.frame(I.x, y0, I.z, Math.PI / 2 + a); k.box(0, 0.35 + y, rr - 0.02, 0.5, 0.7, 0.1, '#3a4a5a', { ink: 0.006 }).box(0, 0.35 + y - 0.42, rr + 0.05, 0.62, 0.08, 0.16, STONE, { ink: 0 }); }
    k.frame(I.x, y0, I.z, Math.PI / 2);
    // the gallery and its rail, the lantern room (dark glass), its red cap
    const GYt = 0.35 + TH, rt = rAt(TH);
    k.cyl(0, GYt, 0, rt + 0.55, 0.16, STONE_D, { geo: GEO.cyl20 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, b2 = ((i + 1) / 12) * TAU, r = rt + 0.48; k.cyl(Math.cos(a) * r, GYt + 0.16, Math.sin(a) * r, 0.035, 0.62, IRON, { geo: GEO.cyl6, ink: 0 }).beam(Math.cos(a) * r, GYt + 0.78, Math.sin(a) * r, Math.cos(b2) * r, GYt + 0.78, Math.sin(b2) * r, 0.05, IRON, { ink: 0 }); }
    k.cyl(0, GYt + 0.16, 0, 0.9, 0.3, RED, { geo: GEO.cyl8 });
    k.cyl(0, GYt + 0.46, 0, 0.82, 1.05, '#5a6f80', { geo: GEO.cyl8, ink: 0.008 });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + Math.PI / 8; k.post(Math.cos(a) * 0.8, GYt + 0.46, Math.sin(a) * 0.8, 0.07, 1.05, 0.07, IRON, { ink: 0 }); }
    k.add(GEO.cone16, 0, GYt + 1.51 + 0.4, 0, 1.08, 0.8, 1.08, '#7a2f22').ball(0, GYt + 2.36, 0, 0.13, '#e6b84a', { ink: 0.005 });
    k.cyl(0, GYt + 2.4, 0, 0.03, 0.6, IRON, { geo: GEO.cyl6, ink: 0 }).box(0.16, GYt + 2.85, 0, 0.36, 0.12, 0.02, IRON, { ink: 0 });
    out.lamp = k.world(0, GYt + 0.95, 0);
    out.lighthouse = { x: I.x, z: I.z, base: y0, top: y0 + GYt + 2.4, gallery: y0 + GYt, door: k.world(0, 0, TR + 0.95) };
    out.colliders.push({ x: I.x, z: I.z, r: 2.05 });
    // the landing: a little jetty, a path up to the door (drawn with the ground), a lamp
    drawWalk(k, out, JETTY.a, JETTY.b, JETTY.w, DECK, DECK, gy, { step: 1.4 });
    k.frame(0, 0, 0, 0); bollard(k, JETTY.b[0] - 0.3, DECK, JETTY.b[1] + 0.68); bollard(k, JETTY.b[0] - 0.3, DECK, JETTY.b[1] - 0.68);
    lampPost(k, out, JETTY.a[0] - 0.4, gy(JETTY.a[0] - 0.4, JETTY.a[1] + 1.4), JETTY.a[1] + 1.4, Math.PI / 2);
    // rocks round the shore, trees, an old boat turned over, an anchor
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * TAU + R() * 0.2, r = 7.4 + R() * 1.4, x = I.x + Math.cos(a) * r, z = I.z + Math.sin(a) * r;
      if (Math.hypot(x - (JETTY.a[0] + 0.5), z - JETTY.a[1]) < 2.4) continue;
      const s = 0.45 + R() * 0.65;
      k.frame(x, gy(x, z) - s * 0.25, z, R() * TAU); k.add(R() < 0.5 ? GEO.ico0 : GEO.ico1, 0, 0, 0, s * 1.2, s * 0.7, s, R() < 0.5 ? '#9a9c94' : '#a9aba0', { rx: R() * 0.5 });
      if (gy(x, z) > WATER - 0.6) out.colliders.push({ x, z, r: s * 0.9 });
    }
    for (const [kind, dx, dz, s] of [['pine', -3.6, 4.8, 1.05], ['round', -5.2, -2.2, 1.0], ['pine', 2.8, -5.6, 0.95], ['willow', -1.4, -6.6, 0.9], ['pine', -6.2, 2.0, 0.85], ['bush', 3.4, 5.2, 0.9], ['bush', -2.4, 6.6, 0.8], ['bush', -5.0, -6.0, 0.85]]) {
      const x = I.x + dx, z = I.z + dz; tree(k, out, kind, x, z, s, R, gy(x, z) - 0.05);
    }
    const bx = I.x + 1.2, bz = I.z - 7.4, ax = I.x - 4.4, az = I.z - 0.6;      // (the old boat on the shore, the anchor)
    k.frame(bx, gy(bx, bz) + 0.05, bz, 0.4);
    k.add(GEO.half, 0, 0, 0, 0.72, 0.42, 1.6, '#8a9aa3').box(0, 0.02, 0, 1.46, 0.06, 3.1, '#5f6b74', { ink: 0 }).box(0.3, 0.3, 0.6, 0.6, 0.08, 0.45, '#5f6b74', { rx: 0.5, ink: 0.006 });
    out.colliders.push({ x: bx, z: bz, r: 1.1 });
    k.frame(ax, gy(ax, az), az, 1.2);
    k.cyl(0, 0, 0, 0.07, 1.2, IRON, { geo: GEO.cyl6, rz: 0.5 }).add(GEO.arch, 0.28, 0.2, 0, 0.45, 0.45, 0.5, IRON, { rz: Math.PI + 0.5, ink: 0.006 }).box(-0.32, 0.95, 0, 0.5, 0.07, 0.07, IRON, { rz: 0.5, ink: 0 });
    // the islets out on the lake (world.js raises them): a ring of rocks, a tree or two on the bigger ones, gulls on gull rock
    const RI = rng(4242);
    ISLETS.forEach((t, j) => {
      const n = Math.round(5 + t.r * 1.6);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + RI() * 0.5, r = t.r * (0.55 + RI() * 0.5), x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r, s = 0.4 + RI() * 0.6 + t.r * 0.05;
        k.frame(x, gy(x, z) - s * 0.3, z, RI() * TAU); k.add(RI() < 0.5 ? GEO.ico0 : GEO.ico1, 0, 0, 0, s * 1.2, s * 0.75, s, RI() < 0.5 ? '#9a9c94' : '#a9aba0', { rx: RI() * 0.5 });
      }
      if (t.r >= 3.5) for (let i = 0; i < (t.r > 5 ? 3 : t.r > 4 ? 2 : 1); i++) { const a = RI() * TAU, r = RI() * t.r * 0.35, x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r; tree(k, out, i === 2 ? 'bush' : RI() < 0.6 ? 'pine' : 'round', x, z, 0.75 + RI() * 0.35, RI, gy(x, z) - 0.05, 0); }
      if (j === 3) for (let i = 0; i < 4; i++) {       // gull rock: little white gulls sitting on it, facing the wind
        const a = (i / 4) * TAU + 0.4, x = t.x + Math.cos(a) * t.r * 0.45, z = t.z + Math.sin(a) * t.r * 0.45, y = gy(x, z) + 0.12;
        k.frame(x, y, z, 2.2 + i * 0.3);
        k.ball(0, 0.16, 0, 0.16, '#fdf8ee', { ry2: 0.13, rz2: 0.26 }).ball(0, 0.3, 0.17, 0.09, '#fdf8ee', { ink: 0.004 }).add(GEO.cone, 0, 0.29, 0.29, 0.03, 0.09, 0.03, '#f2b43c', { rx: Math.PI / 2, ink: 0 })
          .box(0, 0.18, -0.02, 0.36, 0.05, 0.22, '#9aa4ad', { ink: 0.004 }).box(0, 0.16, -0.24, 0.12, 0.03, 0.14, '#5f6b74', { ink: 0 });
      }
    });
  }

  // ------------------------------------------------------------ reeds round the shallows (the lake, the island, the river banks), lily pads
  function reedClump(k, x, y, z, R, s = 1) {
    k.frame(x, y, z, R() * TAU);
    const n = 5 + (R() * 3 | 0);
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, r = R() * 0.3 * s, h = (0.9 + R() * 0.9) * s, lean = (R() - 0.5) * 0.25, px = Math.cos(a) * r, pz = Math.sin(a) * r;
      k.add(GEO.box, px, h / 2, pz, 0.04, h, 0.04, R() < 0.5 ? REED : REED2, { b: 'sway', rz: lean, ink: 0, sway: { y0: 0, y1: 2 * s, k: 0.7 } });
      if (i % 2 === 0) k.add(GEO.cyl6, px - Math.sin(lean) * h, h + 0.05, pz, 0.055, 0.24, 0.055, CATTAIL, { b: 'sway', rz: lean, ink: 0.006, sway: { y0: 0, y1: 2 * s, k: 0.7 } });
      if (i % 3 === 1) k.add(GEO.box, px, h * 0.32, pz, 0.12, h * 0.6, 0.015, '#6f8f40', { b: 'sway', ry: a, rz: lean * 2 + 0.25, ink: 0, sway: { y0: 0, y1: 2 * s, k: 0.7 } });
    }
  }
  function drawShallows(k, out, gy) {
    const R = rng(808), spots = [], clear = (x, z, r) => {
      for (const w of out.walks) if (segDist(x, z, w.a[0], w.a[1], w.b[0], w.b[1]) < w.w / 2 + r) return false;
      if (x > FERRY_DOCK.x0 - 3 && x < FERRY_DOCK.x1 + 1 && z > FERRY_DOCK.z0 - 2 && z < FERRY_DOCK.z1 + 2) return false;
      if (x > -169 && z > -169 && z < -136.5) return false;                              // the village beach stays open
      for (const h of HOUSES) if (Math.hypot(x - h.x, z - h.z) < Math.max(h.w, h.d) * 0.5 + 2.4 + r) return false;
      if (Math.hypot(x - BR.x, z - BR.z) < 6.5 || Math.abs(z - DZ) < 2.2 && Math.abs(x - DX) < 7 || roadDist(x, z) < 4) return false;
      return spots.every(s => Math.hypot(s.x - x, s.z - z) > 1.05);
    };
    const shallow = (x, z) => { const g = gy(x, z); return g < WATER + 0.08 && g > WATER - 0.55; };
    // the lake: march out from the middle to the waterline
    for (let i = 0; i < 260; i++) {
      const a = (i / 260) * TAU + R() * 0.01, ca = Math.cos(a), sa = Math.sin(a);
      for (let e = 0.86; e < 1.08; e += 0.012) {
        const x = LK.x + ca * LK.rx * e, z = LK.z + sa * LK.rz * e;
        if (!shallow(x, z)) continue;
        if (R() < 0.62 && clear(x, z, 0.5)) { spots.push({ x, z }); reedClump(k, x, gy(x, z), z, R, 0.9 + R() * 0.35); }
        break;
      }
    }
    // the island's shore (not by the landing)
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU, x0 = ISLE.x + Math.cos(a) * 7, z0 = ISLE.z + Math.sin(a) * 7;
      if (Math.abs(angDiff(a, 0.1)) < 0.5 || R() < 0.45) continue;
      for (let r = 7; r < 10.5; r += 0.25) { const x = ISLE.x + Math.cos(a) * r, z = ISLE.z + Math.sin(a) * r; if (shallow(x, z)) { if (clear(x, z, 0.4)) { spots.push({ x, z }); reedClump(k, x, gy(x, z), z, R, 0.85 + R() * 0.3); } break; } }
      void x0; void z0;
    }
    // the river banks, up and down from the crossing
    for (let z = -188; z < -116; z += 1.3) for (const s of [-1, 1]) {
      if (R() < 0.35) continue;
      for (let d = 2.4; d < 4.2; d += 0.2) { const x = RX(z) + s * d; if (shallow(x, z)) { const x2 = x + s * 0.15 * R(); if (clear(x2, z, 0.4)) { spots.push({ x: x2, z }); reedClump(k, x2, gy(x2, z), z, R, 0.8 + R() * 0.4); } break; } }
    }
    // the grown lake (world.js L.lakes, past x −217): out from each lobe's middle to its shallows, and round the islets (own seed,
    // so the bay's reeds above stay put)
    const R2 = rng(909), n0 = spots.length, lobes = (typeof WORLD !== 'undefined' && WORLD.L.lakes) || [];
    for (const o of lobes) for (let i = 0; i < 140; i++) {
      const a = (i / 140) * TAU + R2() * 0.02, ca = Math.cos(a), sa = Math.sin(a);
      for (let e = 0.3; e < 1.3; e += 0.01) {
        const x = o.x + ca * o.rx * e, z = o.z + sa * o.rz * e;
        if (x > -217 || x < -466) break;
        if (!shallow(x, z)) continue;
        if (R2() < 0.45 && spots.length - n0 < 240 && clear(x, z, 0.5)) { spots.push({ x, z }); reedClump(k, x, gy(x, z), z, R2, 0.9 + R2() * 0.35); }
        break;
      }
    }
    for (const t of ISLETS) for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + R2() * 0.3;
      if (R2() < 0.5) continue;
      for (let r = t.r * 0.8; r < t.r * 1.6; r += 0.2) { const x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r; if (shallow(x, z)) { if (clear(x, z, 0.4)) { spots.push({ x, z }); reedClump(k, x, gy(x, z), z, R2, 0.8 + R2() * 0.3); } break; } }
    }
    out.reeds = spots.length;
    // lily pads: patches in calm water, a few in flower
    const patches = [[-165.8, -165.2, 2.2], [-171.5, -137.2, 2.4], [-186.0, -166.5, 2.6], [-207.5, -168.6, 2.0], [-219.6, -150.6, 2.0], [-192.5, -137.0, 2.2], [-176.0, -168.8, 2.0]];
    let pads = 0;
    for (const [cx, cz, r] of patches) for (let i = 0; i < 11; i++) {
      const a = R() * TAU, rr = Math.sqrt(R()) * r, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr, g = gy(x, z);
      if (g > WATER - 0.2) continue;
      if (!out.walks.every(w => segDist(x, z, w.a[0], w.a[1], w.b[0], w.b[1]) > w.w / 2 + 0.5)) continue;
      const s = 0.26 + R() * 0.22;
      k.frame(x, WATER + 0.012 + R() * 0.004, z, R() * TAU); k.add(GEO.pad, 0, 0, 0, s, 1, s, R() < 0.5 ? PAD : PAD2, { ink: 0 });
      if (R() < 0.22) { const c = R() < 0.6 ? '#ff9fc0' : '#fdf8ee'; for (let j = 0; j < 5; j++) { const b2 = (j / 5) * TAU; k.add(GEO.ico0, Math.cos(b2) * 0.07, 0.07, Math.sin(b2) * 0.07, 0.07, 0.04, 0.05, c, { ry: -b2, rz: 0.5, ink: 0 }); } k.ball(0, 0.08, 0, 0.04, '#f2c14e', { ink: 0, geo: GEO.ball5 }); }
      pads++;
    }
    out.pads = pads;
    out.reedSpots = spots;
  }

  // ------------------------------------------------------------ Remanso's things: the piers and the ferry dock, lamps, nets, the fish stall,
  // the boat builder's yard and slipway, benches, the laundry, crates and barrels, the name board; the dirt paths
  function drawVillage(k, out, gy) {
    const R = rng(1515);
    for (const p of PIERS) drawWalk(k, out, p.a, p.b, p.w, DECK, DECK, gy);
    drawDeck(k, out, FERRY_DOCK, DECK, gy);
    out.walks.push({ a: [FERRY_DOCK.x0, (FERRY_DOCK.z0 + FERRY_DOCK.z1) / 2], b: [FERRY_DOCK.x1, (FERRY_DOCK.z0 + FERRY_DOCK.z1) / 2], w: FERRY_DOCK.z1 - FERRY_DOCK.z0, y: [DECK, DECK], noPlat: true });
    for (const h of HOUSES) { const r = drawHouse(k, out, h, gy); h.y0 = r.y0; if (h.id === 'marina') marinaExtras(k, out, h); }
    // lamps along the main pier, on the ferry dock, the plaza, the south walk
    for (const [x, s] of [[-160.6, 1], [-168.6, -1], [-176.6, 1], [-183.0, -1]]) lampPost(k, out, x, DECK, -152 + s * 1.12, s > 0 ? Math.PI : 0);
    lampPost(k, out, FERRY_DOCK.x0 + 0.3, DECK, FERRY_DOCK.z1 - 0.3, Math.PI); lampPost(k, out, FERRY_DOCK.x0 + 0.3, DECK, FERRY_DOCK.z0 + 0.3, 0);
    lampPost(k, out, -156.8, GY, -155.0, Math.PI / 2); lampPost(k, out, -166.6, DECK, -145.0, -Math.PI / 2);
    // bollards along the piers, and on the ferry dock
    for (const [x, z] of [[-169.6, -150.9], [-176.0, -153.1], [-179.75, -148.6], [-185.0, -153.1]]) bollard(k, x, DECK, z);
    for (const [x, z] of [[FERRY_DOCK.x0 + 0.25, -153.2], [FERRY_DOCK.x0 + 0.25, -150.8], [-186.0, FERRY_DOCK.z0 + 0.25]]) bollard(k, x, DECK, z);
    // the ferry dock: crates, a barrel, rope, a bench, and a sign with the ferry and the island on it
    k.frame(0, 0, 0, 0);
    fishCrate(k, -184.6, DECK, -149.0, 0.8, 0.2, false, R); barrel(k, -184.5, DECK, -155.0); ropeCoil(k, -189.4, DECK, -154.6);
    for (const [x, z, r] of [[-184.6, -149.0, 0.5], [-184.5, -155.0, 0.42]]) out.colliders.push({ x, z, r });
    bench(k, out, -186.6, -155.1, 0, DECK, '#9fb4b0');
    k.frame(-184.4, DECK, -152.0 + 2.3, Math.PI / 2);
    k.post(-0.55, 0, 0, 0.1, 1.9, 0.1, WOOD_D).post(0.55, 0, 0, 0.1, 1.9, 0.1, WOOD_D).box(0, 1.55, 0.02, 1.5, 0.7, 0.08, '#e8dcc0').box(0, 1.55, -0.01, 1.62, 0.82, 0.05, WOOD_D, { ink: 0 });
    k.box(-0.15, 1.42, 0.08, 0.7, 0.12, 0.02, '#3f6fb5', { ink: 0 }).box(-0.15, 1.52, 0.08, 0.5, 0.1, 0.02, '#d9483b', { ink: 0 }).add(GEO.half, 0.45, 1.5, 0.08, 0.2, 0.22, 0.02, '#4f9a45', { ink: 0 }).box(0.45, 1.72, 0.08, 0.05, 0.22, 0.02, '#f1ece0', { ink: 0 });
    for (let i = 0; i < 3; i++) k.box(-0.62 + i * 0.12, 1.75, 0.08, 0.08, 0.02, 0.02, '#2b2235', { ink: 0 });
    out.colliders.push({ x: -184.4, z: -149.7, r: 0.15 }, { x: -184.4, z: -150.8, r: 0.15 });
    // the gangplank onto the ferry
    k.frame(0, 0, 0, 0);
    k.beam(FERRY_DOCK.x0 + 0.25, DECK - 0.02, -152, FERRY.x + FERRY.len / 2 - 0.35, FERRY.top + 0.04, -152, 0.08, '#a8875a', { t2: 1.1, ink: 0.006, geo: GEO.box });
    for (const s of [-1, 1]) k.beam(FERRY_DOCK.x0 + 0.25, DECK + 0.02, -152 + s * 0.5, FERRY.x + FERRY.len / 2 - 0.35, FERRY.top + 0.08, -152 + s * 0.5, 0.06, WOOD_D, { ink: 0 });
    // crates and a coil of rope on the main pier
    k.frame(0, 0, 0, 0);
    fishCrate(k, -162.6, DECK, -153.0, 0.7, 0.1, true, R); ropeCoil(k, -172.4, DECK, -153.0, 0.9); barrel(k, -178.0, DECK, -153.0, 0.85);
    out.colliders.push({ x: -162.6, z: -153.0, r: 0.42 }, { x: -178.0, z: -153.0, r: 0.38 });
    // nets drying on frames (south beach, where Delia mends them; north beach)
    k.frame(-160.4, gy(-160.4, -145.8), -145.8, Math.PI / 2); netFrame(k, out, -2.0, 2.0, 0, 0);
    k.frame(-160.6, gy(-160.6, -157.9), -157.9, Math.PI / 2); netFrame(k, out, -1.5, 1.5, 0, 0, 1.7);
    k.frame(-158.9, gy(-158.9, -144.0), -144.0, 0); k.cyl(0, 0, 0, 0.22, 0.42, '#7a5a3e', { geo: GEO.cyl8 }); out.colliders.push({ x: -158.9, z: -144.0, r: 0.25 });
    // the fish stall at the pier head: big fish on the left (as you face it), little ones on the right, a striped awning
    k.frame(0, 0, 0, 0);
    fishCrate(k, -152.8, GY, -149.4, 1.0, 0, true, R); fishCrate(k, -154.6, GY, -149.4, 1.0, 0, false, R);
    for (const [x, z] of [[-152.8, -149.4], [-154.6, -149.4]]) out.colliders.push({ obox: 1, x, z, hw: 0.55, hd: 0.4, rot: 0 });
    k.frame(-153.7, GY, -147.6, Math.PI);
    for (const s of [-1, 1]) k.post(s * 1.6, 0, -0.35, 0.1, 2.3, 0.1, WOOD_D).post(s * 1.6, 0, 1.4, 0.1, 2.0, 0.1, WOOD_D);
    for (let i = 0; i < 8; i++) k.box(-1.6 + (i + 0.5) * 0.4, 2.15, 0.52, 0.41, 0.06, 1.9, i % 2 ? '#fdf8ee' : '#3f6fb5', { rx: -0.16, ink: 0.006 });
    barrel(k, 2.1, 0, 0.6, 0.8);
    out.colliders.push({ x: -152.1, z: -148.0, r: 0.12 }, { x: -155.3, z: -148.0, r: 0.12 }, { x: -152.1, z: -146.2, r: 0.12 }, { x: -155.3, z: -146.2, r: 0.12 }, { x: -151.6, z: -147.0, r: 0.35 });
    bench(k, out, -154.8, -156.6, 0, GY);
    // the boat builder's yard: a hull on trestles (its ribs still showing), the workbench with the nails, the slipway down to the water
    {
      const bx = -155.6, bz = -166.4, y = GY;
      k.frame(bx, y, bz, Math.PI / 2);           // (local z along the boat, toward the water)
      for (const s of [-1, 1]) { k.box(0, 0.62, s * 1.1, 1.5, 0.1, 0.12, '#a8875a').beam(-0.6, 0, s * 1.1 - 0.15, -0.4, 0.6, s * 1.1, 0.07, '#7f6440', { ink: 0 }).beam(0.6, 0, s * 1.1 - 0.15, 0.4, 0.6, s * 1.1, 0.07, '#7f6440', { ink: 0 }); }
      k.box(0, 0.78, 0, 0.14, 0.18, 4.2, '#8a6a4a');
      k.beam(0, 0.78, 2.1, 0, 1.75, 2.45, 0.14, '#8a6a4a').beam(0, 0.78, -2.1, 0, 1.6, -2.35, 0.14, '#8a6a4a');
      for (let i = 0; i < 7; i++) { const z = -1.6 + i * 0.53, wd = 0.85 * Math.sqrt(1 - Math.pow(z / 2.2, 2)); k.add(GEO.arch, 0, 1.62, z, wd, 0.8, 0.9, '#b48a5a', { rz: Math.PI, ink: 0.006 }); }
      for (const s of [-1, 1]) for (let j = 0; j < 2; j++) k.beam(s * 0.45, 0.95 + j * 0.2, -1.7, s * (0.58 + j * 0.06), 1.0 + j * 0.2, 1.7, 0.07, j ? '#c9a46a' : '#b48a5a', { t2: 0.2, ink: 0.005 });
      out.colliders.push({ obox: 1, x: bx, z: bz, hw: 2.3, hd: 0.8, rot: 0 });
      k.frame(-155.2, y, -168.75, 0);
      k.box(0, 0.86, 0, 1.6, 0.08, 0.7, '#a8875a');
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * 0.7, 0, sz * 0.28, 0.08, 0.84, 0.08, '#7f6440', { ink: 0.005 });
      k.post(-0.35, 0.9, 0.05, 0.36, 0.16, 0.24, '#8a8f98').box(0.3, 0.95, 0.0, 0.45, 0.05, 0.07, '#7a5a3e', { ry: 0.4, ink: 0 }).box(0.48, 0.96, 0.06, 0.12, 0.08, 0.12, IRON, { ry: 0.4, ink: 0 });
      for (let i = 0; i < 6; i++) k.box(-0.42 + (i % 3) * 0.06, 1.08, 0.0 + (i / 3 | 0) * 0.06 - 0.03, 0.015, 0.06, 0.015, '#c9ccd2', { ink: 0 });
      out.colliders.push({ obox: 1, x: -155.2, z: -168.75, hw: 0.85, hd: 0.4, rot: 0 });
      for (let i = 0; i < 4; i++) k.beam(0.95 + i * 0.12, 0, -0.5, 1.05 + i * 0.12, 1.7, -0.6, 0.1, PLANKS[i], { t2: 0.24, ink: 0.004 });
      k.frame(0, 0, 0, 0);
      for (const s of [-1, 1]) { const pts = []; for (let x = -153.4; x >= -163.8; x -= 0.8) pts.push([x, bz + s * 0.6]); for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx2, bz2] = pts[i + 1]; k.beam(ax, gy(ax, az) + 0.06, az, bx2, gy(bx2, bz2) + 0.06, bz2, 0.12, STILT, { t2: 0.08, ink: 0.004 }); } }
      for (let x = -153.8; x >= -163.6; x -= 0.62) k.box(x, gy(x, bz) + 0.13, bz, 0.22, 0.05, 1.5, PLANKS[(x * 10 | 0) & 3], { ink: 0 });
      barrel(k, -153.6, gy(-153.6, -163.0), -163.0); out.colliders.push({ x: -153.6, z: -163.0, r: 0.4 });
    }
    // Fausto's boat, turned over on the beach and half painted, a paint pot
    {
      const x = -160.1, z = -162.2, y = gy(x, z);
      k.frame(x, y, z, 0);
      for (const s of [-1, 1]) k.post(0, 0, s * 0.95, 1.2, 0.36, 0.14, '#7f6440', { ink: 0.005 });
      k.add(GEO.half, 0, 0.4, 0, 0.72, 0.42, 1.65, '#2f8f8a').box(0, 0.42, 0, 1.42, 0.06, 3.2, '#e8e2d6', { ink: 0 });
      k.add(GEO.half, 0, 0.405, 0.82, 0.7, 0.41, 0.82, '#f2c94c', { ink: 0 });
      k.frame(x + 1.0, y, z + 1.2, 0); k.cyl(0, 0, 0, 0.14, 0.22, '#c9ccd2', { geo: GEO.cyl8 }).cyl(0, 0.2, 0, 0.12, 0.03, '#f2c94c', { geo: GEO.cyl8, ink: 0 });
      out.colliders.push({ obox: 1, x, z, hw: 0.75, hd: 1.7, rot: 0 });
    }
    // Rocío's laundry line behind the south houses
    {
      const y = GY, z = -136.4, xa = -148.2, xb = -141.4;
      k.frame(0, 0, 0, 0);
      for (const x of [xa, xb]) { k.post(x, y, z, 0.12, 2.2, 0.12, WOOD_D); out.colliders.push({ x, z, r: 0.15 }); }
      const sagY = t => y + 2.05 - 0.28 * Math.sin(Math.PI * t);
      for (let i = 0; i < 6; i++) k.beam(lerp(xa, xb, i / 6), sagY(i / 6), z, lerp(xa, xb, (i + 1) / 6), sagY((i + 1) / 6), z, 0.02, '#e8e2d6', { ink: 0, geo: GEO.cyl6 });
      const cloth = ['#e05a3c', '#fdf8ee', '#3f6fb5', '#f2c94c', '#9fd3c7', '#e86a9a'];
      for (let i = 0; i < 6; i++) { const t = (i + 0.7) / 7, x = lerp(xa, xb, t), h = 0.5 + R() * 0.35; k.add(GEO.box, x, sagY(t) - h / 2, z, 0.62, h, 0.03, cloth[i], { b: 'sway', ink: 0.004, sway: { y0: sagY(t) - y - 0.05, y1: sagY(t) - y - h, k: 0.8 } }); }
      k.cyl(-145.0, y, z + 1.2, 0.3, 0.3, '#c9a66b', { geo: GEO.cyl8 }); out.colliders.push({ x: -145.0, z: z + 1.2, r: 0.32 });
    }
    // odds and ends by the shore houses: barrels, crates, oars leaning on walls, stacked firewood
    for (const [x, z, what] of [[-137.2, -161.6, 'barrel'], [-152.2, -161.9, 'crates'], [-137.0, -139.2, 'wood'], [-152.0, -138.8, 'barrel'], [-144.6, -169.0, 'crates'], [-147.6, -163.9, 'oars']]) {
      k.frame(x, gy(x, z), z, 0);
      if (what === 'barrel') { barrel(k, 0, 0, 0); barrel(k, 0.62, 0, 0.3, 0.85); out.colliders.push({ x: x + 0.3, z: z + 0.15, r: 0.7 }); }
      else if (what === 'crates') { fishCrate(k, 0, 0, 0, 0.8, 0.3, false, R); k.post(0.7, 0, 0.5, 0.7, 0.55, 0.6, '#a8875a', { ry: -0.2 }); out.colliders.push({ x: x + 0.3, z: z + 0.25, r: 0.75 }); }
      else if (what === 'wood') { for (let i = 0; i < 9; i++) k.cyl(0, 0.15 + (i % 3) * 0.26, -0.5 + (i / 3 | 0) * 0.5, 0.13, 0.5, '#a8784e', { rz: Math.PI / 2, geo: GEO.cyl6, ink: 0.006 }); out.colliders.push({ obox: 1, x, z, hw: 0.4, hd: 0.8, rot: 0 }); }
      else { for (const s of [-1, 1]) k.beam(s * 0.3, 0, 0.1, s * 0.15, 2.0, -0.25, 0.07, '#b07a48', { ink: 0.006 }).box(s * 0.3, 0.32, 0.12, 0.2, 0.55, 0.04, '#b07a48', { rx: 0.18, ink: 0.006 }); out.colliders.push({ x, z, r: 0.3 }); }
    }
    // shore trees: willows and round trees round the village, never on the road
    for (const [kind, x, z, s] of [['willow', -159.4, -169.6, 1.05], ['willow', -159.8, -134.6, 1.0], ['round', -135.6, -168.4, 1.0], ['round', -134.8, -134.8, 0.95], ['willow', -127.8, -158.6, 0.95], ['bush', -138.2, -145.3, 0.8], ['bush', -152.6, -145.2, 0.75], ['willow', -112.6, -162.4, 1.0], ['round', -125.4, -139.6, 1.0], ['willow', -124.2, -163.8, 0.9]])
      tree(k, out, kind, x, z, s, R, gy(x, z) - 0.05);
    // the village's name board, by the road where you come in
    k.frame(SIGN.x, gy(SIGN.x, SIGN.z), SIGN.z, Math.PI / 2 + 0.3);
    for (const s of [-1, 1]) k.post(s * 1.2, 0, 0, 0.16, 2.6, 0.16, WOOD_D);
    k.box(0, 1.95, -0.02, 2.75, 1.0, 0.1, WOOD_D);
    for (let i = 0; i < 3; i++) k.ball(-1.35 + i * 0.08, 2.5 + (i % 2) * 0.04, 0.05, 0.07, FLOATS[i], { geo: GEO.ball5, ink: 0.004 });
    out.signAt = { at: k.world(0, 1.95, 0.04), rot: Math.PI / 2 + 0.3 };
    out.colliders.push({ x: SIGN.x + Math.sin(Math.PI / 2 + 0.3) * 0 + Math.cos(Math.PI / 2 + 0.3) * 1.2, z: SIGN.z - Math.sin(Math.PI / 2 + 0.3) * 1.2, r: 0.18 }, { x: SIGN.x - Math.cos(Math.PI / 2 + 0.3) * 1.2, z: SIGN.z + Math.sin(Math.PI / 2 + 0.3) * 1.2, r: 0.18 });
  }
  function drawGround(k, gy) {
    k.frame(0, 0, 0, 0);
    k.raw(drapeRibbon(gy, STREET.pts, STREET.w, 0.02, 0.8), '#e9dcc0');
    k.raw(drapeDisc(gy, { x: PLAZA.x, z: PLAZA.z, r: PLAZA.r }, 0.026, 0.7), '#efe2c6');
    FOOT.forEach((f, i) => k.raw(drapeRibbon(gy, f, 1.1, 0.03 + i * 0.001, 0.7), '#e6d6b6'));
  }
  // ------------------------------------------------------------ people, animals and everything that floats: molinar's instanced rig (one
  // InstancedMesh per body part, each instance driven by a node), plus a boat hull and a thin ring (ripples, rope, gunwales)
  const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 13);
  const PART = {
    lathe: { geo: lathe([[0, 0], [0.38, 0.02], [0.37, 0.3], [0.28, 0.68], [0.2, 0.9], [0.1, 0.97], [0, 0.98]]), ink: 0.02, shadow: true },
    head: { geo: new THREE.SphereGeometry(1, 13, 9), ink: 0.02, shadow: true },
    ball: { geo: new THREE.SphereGeometry(1, 7, 5), ink: 0.03, shadow: true },
    cap: { geo: new THREE.SphereGeometry(1, 12, 5, 0, TAU, 0, Math.PI * 0.5), ink: 0.02 },
    cyl: { geo: new THREE.CylinderGeometry(1, 1, 1, 8), ink: 0.03, shadow: true },
    cone: { geo: new THREE.ConeGeometry(1, 1, 8), ink: 0.03 },
    box: { geo: new THREE.BoxGeometry(1, 1, 1), ink: 0.03, shadow: true },
    hull: { geo: new THREE.SphereGeometry(1, 14, 5, 0, TAU, Math.PI / 2, Math.PI / 2), ink: 0.03, shadow: true, side: THREE.DoubleSide },
    dot: { geo: new THREE.SphereGeometry(1, 6, 4), ink: 0, basic: true },          // eyes, mouths, blush, drops, the lamp: flat colors
    ring: { geo: (() => { const g = new THREE.TorusGeometry(1, 0.05, 3, 28); g.rotateX(Math.PI / 2); return g; })(), ink: 0, basic: true },
  };
  const SKINS = ['#f5cda2', '#efc29a', '#e6b48c', '#c98e62', '#a8714a', '#f0c7a0', '#8a5a3c', '#dcae86'];
  const grayOf = hex => { const c = new THREE.Color(hex), l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; return '#' + c.lerp(new THREE.Color(l * 0.86, l * 0.86, l * 0.95), 0.88).getHexString(); };
  const HIDE = new THREE.Matrix4().makeScale(0, 0, 0);
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
        const P = PART[name], mat = P.basic ? new THREE.MeshBasicMaterial({ color: '#ffffff' }) : toonM({ rim: 0.32, side: P.side });
        const im = new THREE.InstancedMesh(P.geo, mat, L.length);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = !!P.shadow; im.receiveShadow = false; im.name = 'lake-' + name;
        L.forEach((l, i) => im.setColorAt(i, col.set(l.color || '#ffffff')));
        group.add(im); list.push({ im, L }); byPart[name] = im;
        if (P.ink) { const h = new THREE.InstancedMesh(P.geo, inkM({ off: P.ink }), L.length); h.instanceMatrix = im.instanceMatrix; h.frustumCulled = false; h.name = 'lake-' + name + '-ink'; group.add(h); list.push({ im: h, L: null }); }
      }
      // (a leaf under an owner that's been hidden, e.g. objects.raft.visible = false, is drawn at zero size)
      const shown = n => { for (let o = n; o; o = o.parent) if (o.visible === false) return false; return true; };
      return {
        list, byPart,
        sync() { for (const { im, L } of list) { if (!L) continue; for (let i = 0; i < L.length; i++) im.setMatrixAt(i, L[i].n.userData.own && !shown(L[i].n) ? HIDE : L[i].n.matrixWorld); im.instanceMatrix.needsUpdate = true; } },
        recolor(n, c) { const { part, i } = n.userData.leaf, im = byPart[part]; if (!im) return; im.setColorAt(i, col.set(c)); im.instanceColor.needsUpdate = true; },
      };
    }
    return { leaf, node, meshes, leaves };
  }
  // One villager (molinar's makePerson). d: { skin, hair, hairdo, dress, apron, hat, hatColor, beard, stache, legs, pants, shoes, h, w, hushed, prop }
  function makePerson(rig, d) {
    // (a hushed person is drawn gray, but keeps every part's real color in R.paint, and the eye shine and blush in R.wake
    // at zero size: setPersonHush can give the color back, bit by bit, as Bartolo gets his words back)
    const { node } = rig, R = { root: null, body: null, d, legs: null, feet: [], arms: [], head: null, eyes: [], mouth: null, props: {}, paint: [], wake: [] };
    const leaf = (parent, part, color, pos, scale, rot) => {
      const n = rig.leaf(parent, part, d.hushed ? grayOf(color) : color, pos, scale, rot);
      if (d.hushed) R.paint.push([n, color]);
      return n;
    };
    const g = c => c;
    const C = { skin: d.skin, hair: d.hair, dress: d.dress, apron: d.apron, pants: d.pants || '#3a4466', shoes: d.shoes || '#5b3a22', hat: d.hatColor || '#e8c57a' };
    const root = new THREE.Object3D(), body = node(root), w = d.w || 1;
    root.scale.setScalar(d.h || 1);
    R.root = root; R.body = body;
    if (d.legs) {
      leaf(body, 'lathe', C.dress, [0, 0.36, 0], [w, 0.64, w]);
      R.legs = [-1, 1].map(s => { const hip = node(body, [s * 0.12 * w, 0.4, 0]); leaf(hip, 'cyl', C.pants, [0, -0.18, 0], [0.085, 0.36, 0.085]); R.feet.push(leaf(hip, 'ball', C.shoes, [0, -0.36, 0.05], [0.1, 0.075, 0.15])); return hip; });
    } else {
      leaf(body, 'lathe', C.dress, null, [w, 1, w]);
      R.feet = [-1, 1].map(s => leaf(body, 'ball', C.shoes, [s * 0.13 * w, 0.04, 0.12], [0.1, 0.07, 0.14]));
    }
    if (d.apron) leaf(body, 'ball', C.apron, [0, 0.42, 0.26 * w], [0.24 * w, 0.3, 0.08]);
    const aL = d.armL || 0.3;
    R.arms = [-1, 1].map(s => {
      const sh = node(body, [s * 0.25 * w, 0.84, 0.05], [-0.5, 0, -s * 0.2]);
      leaf(sh, 'cyl', d.bare ? C.skin : C.dress, [0, -(aL - 0.02) / 2, 0], [0.07, aL - 0.02, 0.07]);
      const hand = node(sh, [0, -aL, 0]); leaf(hand, 'ball', C.skin, null, [0.075, 0.075, 0.075]);
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
    if (d.hairdo === 'curly') for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; leaf(head, 'ball', C.hair, [Math.cos(a) * 0.2, 0.36, Math.sin(a) * 0.17 - 0.04], [0.11, 0.1, 0.11]); }
    const EYE = '#2b2235', tiny = [0.0001, 0.0001, 0.0001];
    R.eyes = [-1, 1].map(s => {
      const e = node(head, [s * 0.1, 0.21, 0.24]);
      const ball = leaf(e, 'dot', EYE, null, [0.04, d.hushed ? 0.045 : 0.06, 0.025]);
      const shine = leaf(e, 'dot', '#ffffff', [0.013, 0.023, 0.022], d.hushed ? tiny : [0.017, 0.017, 0.017]);
      if (d.hushed) R.wake.push([ball, [0.04, 0.06, 0.025]], [shine, [0.017, 0.017, 0.017]]);
      return e;
    });
    { const bl = '#' + new THREE.Color(C.skin).lerp(new THREE.Color('#ff8c9a'), 0.5).getHexString(); [-1, 1].forEach(s => { const n = leaf(head, 'dot', bl, [s * 0.17, 0.09, 0.225], d.hushed ? tiny : [0.05, 0.0275, 0.015], [0, s * 0.4, 0]); if (d.hushed) R.wake.push([n, [0.05, 0.0275, 0.015]]); }); }
    R.mouth = leaf(head, 'dot', EYE, [0, 0.07, 0.27], [0.035, 0.012, 0.01]);
    if (d.stache) for (const s of [-1, 1]) leaf(head, 'ball', C.hair, [s * 0.05, 0.11, 0.255], [0.06, 0.025, 0.03], [0, 0, -s * 0.35]);
    if (d.beard) leaf(head, 'ball', C.hair, [0, 0.03, 0.12], [0.21, 0.17, 0.16]);
    const hat = node(head, [0, 0.4, 0]);
    if (d.hat === 'straw') { leaf(hat, 'cyl', C.hat, null, [0.5, 0.035, 0.5]); leaf(hat, 'cap', C.hat, [0, 0.01, 0], [0.22, 0.2, 0.22]); leaf(hat, 'cyl', g('#e05a4b'), [0, 0.05, 0], [0.225, 0.05, 0.225]); }
    else if (d.hat === 'cap') { leaf(hat, 'cap', C.hat, [0, -0.08, 0], [0.3, 0.22, 0.3]); leaf(hat, 'cyl', C.hat, [0, -0.08, 0.26], [0.16, 0.02, 0.12]); }
    else if (d.hat === 'swim') { leaf(hat, 'cap', C.hat, [0, -0.17, -0.02], [0.305, 0.3, 0.305], [-0.35, 0, 0]); leaf(hat, 'ball', '#fdf8ee', [0, 0.08, -0.04], [0.06, 0.03, 0.2], [-0.35, 0, 0]); }
    else if (d.hat === 'beanie') { leaf(hat, 'cap', C.hat, [0, -0.12, -0.01], [0.31, 0.3, 0.31], [-0.3, 0, 0]); leaf(hat, 'ball', C.hat, [0, 0.12, -0.08], [0.07, 0.07, 0.07]); }
    else if (d.hat === 'scarf') { leaf(hat, 'cap', C.hat, [0, -0.2, -0.01], [0.31, 0.32, 0.31], [-0.25, 0, 0]); leaf(hat, 'ball', C.hat, [0, -0.32, -0.27], [0.08, 0.08, 0.08]); }
    else if (d.hat === 'sailor') { leaf(hat, 'cyl', C.hat, [0, -0.06, 0], [0.27, 0.1, 0.27]); leaf(hat, 'cyl', g('#2f4f7a'), [0, -0.12, 0], [0.285, 0.035, 0.285]); }
    else if (d.hat === 'flat') { leaf(hat, 'cap', C.hat, [0, -0.1, 0.02], [0.31, 0.14, 0.33]); leaf(hat, 'cyl', C.hat, [0, -0.1, 0.27], [0.15, 0.02, 0.1]); }
    // things people hold
    const handR = R.arms[1].userData.hand, handL = R.arms[0].userData.hand, P = R.props;
    if (d.prop === 'rod') { P.rod = node(handR, [0, 0, 0.02], [0.9, 0, 0]); leaf(P.rod, 'cyl', g('#8a5f3e'), [0, 0.9, 0], [0.018, 1.9, 0.018]); }
    if (d.prop === 'pole') { P.pole = node(handR, [0, 0, 0.02], [0.15, 0, 0.05]); leaf(P.pole, 'cyl', g('#8a6a4a'), [0, 0.35, 0], [0.028, 3.0, 0.028]); }
    if (d.prop === 'broom') { P.broom = node(handR, [0, 0, 0.03], [0.5, 0, 0]); leaf(P.broom, 'cyl', g('#b07a48'), [0, -0.35, 0], [0.022, 1.3, 0.022]); leaf(P.broom, 'cone', g('#d9b450'), [0, -1.05, 0], [0.12, 0.3, 0.06], [Math.PI, 0, 0]); }
    if (d.prop === 'hammer') { P.hammer = node(handR, [0, -0.02, 0.04], [1.4, 0, 0]); leaf(P.hammer, 'cyl', g('#b07a48'), [0, 0.12, 0], [0.02, 0.3, 0.02]); leaf(P.hammer, 'box', g('#5f6670'), [0, 0.27, 0.03], [0.06, 0.07, 0.15]); }
    if (d.prop === 'shuttle') { P.shuttle = node(handR, [0, -0.04, 0.05]); leaf(P.shuttle, 'box', g('#c9a66b'), null, [0.03, 0.12, 0.05]); }
    if (d.prop === 'brush') { P.brush = node(handR, [0, -0.02, 0.05], [1.2, 0, 0]); leaf(P.brush, 'cyl', g('#b07a48'), [0, 0.1, 0], [0.018, 0.22, 0.018]); leaf(P.brush, 'box', g('#f2c94c'), [0, 0.24, 0], [0.06, 0.08, 0.025]); }
    if (d.prop === 'oars') { P.oars = node(body, [0.24 * w, 1.04, 0.02], [0, 0, -0.25]); for (const s of [-1, 1]) { leaf(P.oars, 'cyl', g('#b07a48'), [s * 0.04, 0, 0.1], [0.025, 2.2, 0.025], [Math.PI / 2 - 0.12, 0, 0]); leaf(P.oars, 'box', g('#b07a48'), [s * 0.04, -0.13, 1.18], [0.03, 0.12, 0.42], [-0.12, 0, 0]); } }
    if (d.prop === 'fish') { P.basket = node(handL, [0, -0.12, 0.04]); leaf(P.basket, 'cyl', g('#c9955a'), null, [0.17, 0.16, 0.13]); for (let i = 0; i < 3; i++) leaf(P.basket, 'ball', g(FISH[i]), [(i - 1) * 0.07, 0.1, 0], [0.04, 0.035, 0.11], [0, (i - 1) * 0.4, 0]); }
    if (d.prop === 'cloth') { P.cloth = node(handR, [0, -0.06, 0.05]); leaf(P.cloth, 'box', '#fdf8ee', null, [0.16, 0.025, 0.12]); }
    return R;
  }
  function makeDuck(rig, color) {
    const { leaf, node } = rig, root = new THREE.Object3D(), body = node(root), A = { root, body, head: null };
    leaf(body, 'ball', color, [0, 0.06, 0], [0.15, 0.1, 0.22]); leaf(body, 'ball', color, [0, 0.12, -0.2], [0.06, 0.05, 0.06], [0.6, 0, 0]);
    A.head = node(body, [0, 0.22, 0.14]); leaf(A.head, 'ball', color === '#fdf8ee' ? '#fdf8ee' : '#3f8a4e', null, [0.08, 0.08, 0.08]); leaf(A.head, 'box', '#f2a03a', [0, -0.01, 0.09], [0.06, 0.02, 0.07]);
    for (const s of [-1, 1]) leaf(A.head, 'dot', '#1e1a24', [s * 0.05, 0.02, 0.05], [0.012, 0.012, 0.012]);
    return A;
  }
  // a rowboat: origin at the waterline, length along z; colorful outside, plain boards inside
  function makeBoat(rig, color, trim, o = {}) {
    const { leaf, node } = rig, root = node(null), body = node(root), B = { root, body, oars: [] };
    leaf(body, 'hull', color, [0, 0.26, 0], [0.7, 0.44, 1.6]);
    leaf(body, 'ring', trim, [0, 0.27, 0], [0.71, 2.2, 1.61]);
    leaf(body, 'box', '#a8875a', [0, -0.06, 0], [0.62, 0.04, 2.1]);
    for (const z of [-0.55, 0.3]) leaf(body, 'box', '#b48a5a', [0, 0.14, z], [1.2, 0.05, 0.28]);
    leaf(body, 'box', shade(color, 0.8), [0, 0.3, 1.52], [0.08, 0.2, 0.12]);
    if (o.oars === 'row') for (const s of [-1, 1]) { const piv = node(body, [s * 0.68, 0.3, -0.1]); leaf(piv, 'cyl', '#b07a48', [s * 0.75, 0, 0], [0.025, 1.6, 0.025], [0, 0, Math.PI / 2]); leaf(piv, 'box', '#b07a48', [s * 1.45, 0, 0], [0.3, 0.02, 0.14]); B.oars.push(piv); }
    else if (o.oars !== false) for (const s of [-1, 1]) leaf(body, 'cyl', '#b07a48', [s * 0.25, 0.2, 0.1], [0.025, 2.2, 0.025], [Math.PI / 2, 0, s * 0.08]);
    return B;
  }
  function makeRaft(rig) {         // logs lashed with rope, two cross planks, a coil of rope, a paddle (deck top at the water + 0.28)
    const { leaf, node } = rig, root = new THREE.Group(), body = node(root), Rr = rng(31);
    root.name = 'lake-raft';
    for (let i = 0; i < 5; i++) { const x = -0.96 + i * 0.48; leaf(body, 'cyl', i % 2 ? '#8a6a4a' : '#9a7a52', [x, 0.06, (Rr() - 0.5) * 0.12], [0.22, 2.4 + (Rr() - 0.5) * 0.2, 0.22], [Math.PI / 2, 0, 0]); for (const z of [-1.21, 1.21]) leaf(body, 'cyl', '#c9b48a', [x, 0.06, z + (z > 0 ? 0.01 : -0.01)], [0.2, 0.02, 0.2], [Math.PI / 2, 0, 0]); }
    for (const z of [-0.82, 0.82]) { leaf(body, 'box', '#a8875a', [0, 0.3, z], [2.3, 0.07, 0.34]); leaf(body, 'box', ROPE, [0, 0.27, z + 0.24], [2.36, 0.05, 0.05]); leaf(body, 'box', ROPE, [0, 0.27, z - 0.24], [2.36, 0.05, 0.05]); }
    for (let i = 0; i < 3; i++) leaf(body, 'ring', i % 2 ? ROPE_D : ROPE, [0.62, 0.34 + i * 0.045, -0.1], [0.28 - i * 0.05, 1.6, 0.28 - i * 0.05]);
    leaf(body, 'cyl', '#b07a48', [-0.35, 0.33, 0.1], [0.025, 1.5, 0.025], [Math.PI / 2, 0.4, 0]); leaf(body, 'box', '#b07a48', [-0.06, 0.33, 0.78], [0.18, 0.03, 0.36], [0, 0.4, 0]);
    return { root, body };
  }
  function makeFerry(rig) {        // a flat ferry: a barge with low rails, a canopy at the back, a steering oar, a lantern on a pole
    const { leaf, node } = rig, root = new THREE.Group(), body = node(root), L = FERRY.len, W = FERRY.wid, top = FERRY.top - WATER;
    root.name = 'lake-ferry';
    leaf(body, 'box', '#5f5148', [0, top - 0.32, 0], [W, 0.5, L]);
    leaf(body, 'box', '#2f6f6a', [0, top - 0.16, 0], [W + 0.04, 0.1, L + 0.04]);
    for (let i = 0; i < 8; i++) leaf(body, 'box', PLANKS[i % 4], [-W / 2 + (i + 0.5) * W / 8, top - 0.03, 0], [W / 8 - 0.03, 0.06, L - 0.1]);
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++) leaf(body, 'box', WOOD_D, [s * (W / 2 - 0.08), top + 0.35, -L / 2 + 0.4 + i * (L - 0.8) / 5], [0.1, 0.7, 0.1]);
      leaf(body, 'box', '#f2c94c', [s * (W / 2 - 0.08), top + 0.68, 0], [0.12, 0.08, L - 0.6]);
      leaf(body, 'box', WOOD, [s * (W / 2 - 0.08), top + 0.36, 0], [0.06, 0.05, L - 0.7]);
    }
    for (const s of [-1, 1]) leaf(body, 'box', '#5f5148', [0, top + 0.25, s * (L / 2 + 0.05)], [W - 0.3, 0.55, 0.08], [s * -0.35, 0, 0]);
    const cz = -L / 2 + 1.1;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) leaf(body, 'box', WOOD_D, [sx * (W / 2 - 0.25), top + 1.0, cz + sz * 0.75], [0.09, 2.0, 0.09]);
    for (let i = 0; i < 6; i++) leaf(body, 'box', i % 2 ? '#fdf8ee' : '#d9483b', [-W / 2 + 0.15 + (i + 0.5) * (W - 0.3) / 6, top + 2.02, cz], [(W - 0.3) / 6, 0.07, 1.8]);
    leaf(body, 'box', '#9fb4b0', [0, top + 0.42, cz - 0.55], [W - 0.6, 0.1, 0.42]);
    for (const sx of [-1, 1]) leaf(body, 'box', WOOD_D, [sx * (W / 2 - 0.5), top + 0.2, cz - 0.55], [0.08, 0.4, 0.38]);
    const oar = node(body, [0, top + 0.6, -L / 2 - 0.2], [0.55, 0, 0]); leaf(oar, 'cyl', '#8a6a4a', [0, -0.6, 0], [0.05, 2.6, 0.05]); leaf(oar, 'box', '#8a6a4a', [0, -1.9, 0], [0.32, 0.6, 0.05]);
    leaf(body, 'cyl', WOOD_D, [W / 2 - 0.35, top + 1.0, L / 2 - 0.4], [0.05, 2.0, 0.05]);
    const lamp = node(body, [W / 2 - 0.35, top + 1.85, L / 2 - 0.62]);
    leaf(lamp, 'box', LAMP, null, [0.22, 0.28, 0.22]); leaf(lamp, 'box', IRON, [0, 0.18, 0], [0.3, 0.06, 0.3]); leaf(lamp, 'box', IRON, [0, 0.13, 0.15], [0.03, 0.03, 0.3]);
    const coil = node(body, [-W / 2 + 0.6, top, L / 2 - 0.7]);       // (Bartolo's oar, lantern and rope: hidden while they're lost, setFerryGear)
    for (let i = 0; i < 3; i++) leaf(coil, 'ring', ROPE, [0, 0.04 + i * 0.05, 0], [0.3 - i * 0.05, 1.6, 0.3 - i * 0.05]);
    return { root, body, oar, lamp, coil };
  }
  function makeBuoy(rig) {         // the second bell: under a little frame on a floating barrel raft
    const { leaf, node } = rig, root = new THREE.Group(), body = node(root), parts = [];
    root.name = 'lake-buoy';
    const L = (p, part, color, pos, scale, rot) => { const n = leaf(p, part, color, pos, scale, rot); parts.push([n, color]); return n; };
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { L(body, 'cyl', '#9a6a3f', [sx * 0.52, 0.05, sz * 0.52], [0.34, 0.7, 0.34]); L(body, 'cyl', IRON, [sx * 0.52, 0.28, sz * 0.52], [0.36, 0.06, 0.36]); }
    L(body, 'box', '#a8875a', [0, 0.42, 0], [1.75, 0.09, 1.75]);
    for (let i = 0; i < 4; i++) L(body, 'box', i % 2 ? '#e8e2d6' : '#d9483b', [0, 0.49, -0.66 + i * 0.44], [1.6, 0.04, 0.4]);
    for (const s of [-1, 1]) { L(body, 'box', '#5f6b74', [s * 0.62, 1.25, 0], [0.12, 1.6, 0.12]); L(body, 'box', '#5f6b74', [s * 0.4, 0.75, 0], [0.07, 0.75, 0.07], [0, 0, s * 0.55]); }
    L(body, 'box', '#5f6b74', [0, 2.08, 0], [1.5, 0.14, 0.18]);
    L(body, 'cone', '#d9483b', [0, 2.33, 0], [0.62, 0.36, 0.3]);
    L(body, 'cyl', '#5f6b74', [0.0, 0.0, 0.82], [0.03, 1.6, 0.03], [0.7, 0, 0]);
    const pivot = node(body, [0, 2.0, 0]), BELL = '#d9a640';
    L(pivot, 'cone', BELL, [0, -0.42, 0], [0.4, 0.5, 0.4]); L(pivot, 'cap', BELL, [0, -0.2, 0], [0.22, 0.2, 0.22]);
    L(pivot, 'cyl', '#c08a30', [0, -0.66, 0], [0.4, 0.04, 0.4]); L(pivot, 'ball', '#7a5a2a', [0, -0.62, 0], [0.08, 0.08, 0.08]);
    L(pivot, 'ring', '#c08a30', [0, -0.05, 0], [0.06, 1, 0.06], [Math.PI / 2, 0, 0]);
    return { root, body, pivot, parts };
  }
  function makeFish(rig) {
    const { leaf, node } = rig, root = node(null), F = { root };
    leaf(root, 'ball', '#9fb8c8', null, [0.09, 0.075, 0.22]); leaf(root, 'cone', '#8aa6b8', [0, 0, -0.26], [0.09, 0.14, 0.03], [-Math.PI / 2, 0, 0]);
    leaf(root, 'dot', '#1e1a24', [0.06, 0.02, 0.13], [0.015, 0.015, 0.015]); leaf(root, 'dot', '#1e1a24', [-0.06, 0.02, 0.13], [0.015, 0.015, 0.015]);
    return F;
  }
  // ------------------------------------------------------------ the cast: who lives here, what they do, what they say
  // Lines (molinar's format): en has slots the game weaves ({c.*} everyday words, {w.*} words Mimo can learn); es (Latin American),
  // pt (Brazilian) and de say the same thing with only the same {w.*} slots. The language here is where things are. Nobody
  // assumes your gender.
  const LINES = {
    pepe: { en: 'Shh... the fish are under the pier, right under my feet!', es: 'Shh... los peces están debajo del muelle, ¡justo debajo de mis pies!', pt: 'Psiu... os peixes estão debaixo do píer, bem debaixo dos meus pés!', de: 'Pst... die Fische sind unter dem Steg, genau unter meinen Füßen!' },
    delia: { en: 'A net with a hole catches no fish. I mend the nets here, next to the {w.water}.', es: 'Una red con un hoyo no atrapa peces. Yo arreglo las redes aquí, al lado del {w.water}.', pt: 'Rede furada não pega peixe. Eu conserto as redes aqui, do lado da {w.water}.', de: 'Ein Netz mit Loch fängt keine Fische. Ich flicke die Netze hier, neben dem {w.water}.' },
    vicente: { en: 'This boat is almost ready! The nails are on the table, next to the boat.', es: '¡Este barco ya casi está listo! Los clavos están en la mesa, al lado del barco.', pt: 'Esse barco já está quase pronto! Os pregos estão na mesa, do lado do barco.', de: 'Das Boot ist fast fertig! Die Nägel liegen auf dem Tisch, neben dem Boot.' },
    aurora: { en: 'Every night the bell on the {w.water} sang for the boats. Now there is only {c.silence}.', es: 'Cada noche la campana sobre el {w.water} cantaba para los barcos. Ahora solo hay silencio.', pt: 'Toda noite o sino na {w.water} cantava pros barcos. Agora só tem silêncio.', de: 'Jeden Abend hat die Glocke auf dem {w.water} für die Boote gesungen. Jetzt ist nur noch Stille.' },
    chema: { en: 'Fresh fish! The big ones are on the left, the little ones on the right.', es: '¡Pescado fresco! Los grandes están a la izquierda, los chiquitos a la derecha.', pt: 'Peixe fresquinho! Os grandes ficam à esquerda, os pequenos à direita.', de: 'Frischer Fisch! Die großen sind links, die kleinen rechts.' },
    tere: { en: 'I take fish to every {w.house} in the {c.village}. The last one is the yellow one, at the end of the pier.', es: 'Llevo pescado a cada {w.house} del pueblo. La última es la amarilla, al final del muelle.', pt: 'Eu levo peixe pra cada {w.house} da vila. A última é a amarela, no fim do píer.', de: 'Ich bringe Fisch zu jedem {w.house} im Dorf. Das letzte ist das gelbe, am Ende vom Steg.' },
    lucho: { en: 'I can run to the end of the pier and back! {c.look}!', es: '¡Puedo correr hasta el final del muelle y volver! ¡Mira!', pt: 'Eu consigo correr até o fim do píer e voltar! Olha!', de: 'Ich kann bis zum Ende vom Steg rennen und zurück! Schau!' },
    rocio: { en: 'Every morning the fog sits on top of the lake. My laundry never dries!', es: 'Cada mañana la niebla se queda encima del lago. ¡Mi ropa nunca se seca!', pt: 'Toda manhã a neblina fica em cima do lago. Minha roupa nunca seca!', de: 'Jeden Morgen liegt der Nebel über dem See. Meine Wäsche wird nie trocken!' },
    moncho: { en: '{c.look}, the bell is out there on the {w.water}. It doesn’t ring anymore.', es: 'Mira, la campana está allá, sobre el {w.water}. Ya no suena.', pt: 'Olha, o sino está lá, em cima da {w.water}. Não toca mais.', de: 'Schau, die Glocke ist da draußen auf dem {w.water}. Sie läutet nicht mehr.' },
    lino: { en: 'Bartolo took everyone to the island. Since the Hush, he just stands next to his ferry.', es: 'Bartolo llevaba a todos a la isla. Desde el Silencio, solo se queda al lado de su ferry.', pt: 'O Bartolo levava todo mundo pra ilha. Desde o Silêncio, ele só fica do lado da balsa.', de: 'Bartolo hat alle zur Insel gebracht. Seit der Stille steht er nur neben seiner Fähre.' },
  };
  // zh / ja (game/CJK.md's notation and names): the same lines; adults polite to you in ja, the kids casual
  const LINES_CJK = {
    pepe: { zh: '[嘘|xū] … [鱼|yú] [在|zài] [码头|mǎ tóu] [下面|xià miàn] ， [就|jiù] [在|zài] [我|wǒ] [脚|jiǎo] [底下|dǐ xia] ！',
      ja: 'しーっ … [魚|さかな] は [桟橋|さんばし] の [下|した] に います 。 わたし の [足|あし] の [真下|ました] です よ ！' },
    delia: { zh: '[破|pò] [网|wǎng] [抓|zhuā] [不|bù] [到|dào] [鱼|yú] 。 [我|wǒ] [在|zài] [这里|zhè lǐ] ， {w.water} [边|biān] [补|bǔ] [渔网|yú wǎng] 。',
      ja: '[穴|あな] の あいた [網|あみ] で は 、 [魚|さかな] は とれません 。 わたし は ここ 、 {w.water} の そば で [網|あみ] を [直|なお]して います 。' },
    vicente: { zh: '[这|zhè] [条|tiáo] [船|chuán] [快|kuài] [做|zuò] [好|hǎo] [了|le] ！ [钉子|dīng zi] [在|zài] [桌子|zhuō zi] [上|shàng] ， [在|zài] [船|chuán] [旁边|páng biān] 。',
      ja: 'この [船|ふね] は 、 もう すぐ できます よ ！ くぎ は テーブル の [上|うえ] 、 [船|ふね] の [横|よこ] に あります 。' },
    aurora: { zh: '[以前|yǐ qián] [每天|měi tiān] [晚上|wǎn shang] ， {w.water} [上|shàng] [的|de] [钟|zhōng] [都|dōu] [为|wèi] [船|chuán] [唱歌|chàng gē] 。 [现在|xiàn zài] [只|zhǐ] [剩下|shèng xià] [寂静|jì jìng] 。',
      ja: '[毎晩|まいばん] 、 {w.water} の [上|うえ] の [鐘|かね] が 、 [船|ふね] の ため に [歌|うた]って いました 。 [今|いま] は [静|しず]か な だけ です 。' },
    chema: { zh: '[新鲜|xīn xiān] [的|de] [鱼|yú] ！ [大|dà] [的|de] [在|zài] [左边|zuǒ biān] ， [小|xiǎo] [的|de] [在|zài] [右边|yòu biān] 。',
      ja: '[新鮮|しんせん] な [魚|さかな] です よ ！ [大|おお]きい の は [左|ひだり] 、 [小|ちい]さい の は [右|みぎ] です 。' },
    tere: { zh: '[我|wǒ] [给|gěi] [村子|cūn zi] [里|lǐ] [每|měi] [一|yī] [栋|dòng] {w.house} [送|sòng] [鱼|yú] 。 [最后|zuì hòu] [一|yī] [栋|dòng] [是|shì] [黄色|huáng sè] [的|de] ， [在|zài] [码头|mǎ tóu] [尽头|jìn tóu] 。',
      ja: '[村|むら] の すべて の {w.house} に 、 [魚|さかな] を [届|とど]けて います 。 [最後|さいご] は [黄色|きいろ]い [家|いえ] 、 [桟橋|さんばし] の [先|さき] です 。' },
    lucho: { zh: '[我|wǒ] [能|néng] [跑|pǎo] [到|dào] [码头|mǎ tóu] [尽头|jìn tóu] [再|zài] [跑|pǎo] [回来|huí lái] ！ {c.look} ！',
      ja: 'ぼく 、 [桟橋|さんばし] の [先|さき] まで [走|はし]って 、 [戻|もど]って こられる よ ！ {c.look} ！' },
    rocio: { zh: '[每天|měi tiān] [早上|zǎo shang] [湖|hú] [上|shàng] [都|dōu] [有|yǒu] [雾|wù] 。 [我|wǒ] [洗|xǐ] [的|de] [衣服|yī fu] [从来|cóng lái] [都|dōu] [不|bù] [干|gān] ！',
      ja: '[毎朝|まいあさ] 、 [湖|みずうみ] の [上|うえ] に [霧|きり] が かかって います 。 [洗濯物|せんたくもの] が ぜんぜん [乾|かわ]きません ！' },
    moncho: { zh: '{c.look} ， [钟|zhōng] [在|zài] [那边|nà biān] [的|de] {w.water} [上|shàng] 。 [它|tā] [不|bù] [响|xiǎng] [了|le] 。',
      ja: '{c.look} 、 [鐘|かね] は あそこ 、 {w.water} の [上|うえ] です 。 もう [鳴|な]りません 。' },
    lino: { zh: '[以前|yǐ qián] [巴托洛|Bā tuō luò] [把|bǎ] [大家|dà jiā] [送|sòng] [到|dào] [岛|dǎo] [上|shàng] 。 [寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [他|tā] [就|jiù] [只|zhǐ] [站|zhàn] [在|zài] [渡船|dù chuán] [旁边|páng biān] 。',
      ja: 'バルトロ さん は 、 みんな を [島|しま] へ [連|つ]れて いって くれました 。 [静寂|せいじゃく] が [来|き]て から は 、 フェリー の [横|よこ] に [立|た]って いる だけ です 。' },
  };
  for (const [k, v] of Object.entries(LINES_CJK)) if (LINES[k]) Object.assign(LINES[k], v);
  // Answers when you ask «¿Dónde está…?» (DESIGN.md 14.5), true to where each of them stands. Left and right are as you walk out along
  // the pier (west), where you'd be going. Plain text, no slots.
  const A = (es, pt, de, en) => ({ es, pt, de, en });
  const ANSWERS = {
    pepe: {        // fishing off the middle of the main pier
      marina: A('Marina está en la casa amarilla, al final del muelle, a la derecha.', 'A Marina está na casa amarela, no fim do píer, à direita.', 'Marina ist im gelben Haus am Ende vom Steg, rechts.', 'Marina is in the yellow house at the end of the pier, on the right.'),
      bartolo: A('Bartolo está al final del muelle, al lado del ferry. Ya no habla.', 'O Bartolo está no fim do píer, do lado da balsa. Ele não fala mais.', 'Bartolo ist am Ende vom Steg, neben der Fähre. Er spricht nicht mehr.', 'Bartolo is at the end of the pier, next to the ferry. He doesn’t talk anymore.'),
      ferry: A('El ferry está al final del muelle, delante de la isla.', 'A balsa está no fim do píer, na frente da ilha.', 'Die Fähre ist am Ende vom Steg, vor der Insel.', 'The ferry is at the end of the pier, in front of the island.'),
      island: A('La isla está en medio del lago, detrás del ferry.', 'A ilha fica no meio do lago, atrás da balsa.', 'Die Insel ist mitten im See, hinter der Fähre.', 'The island is in the middle of the lake, behind the ferry.'),
      bell: A('La campana está en el agua, entre el muelle y la isla.', 'O sino está na água, entre o píer e a ilha.', 'Die Glocke ist im Wasser, zwischen dem Steg und der Insel.', 'The bell is in the water, between the pier and the island.'),
    },
    chema: {       // at the fish stall, where the pier starts
      marina: A('Camina por el muelle hasta el final. La casa amarilla de la derecha es la de Marina.', 'Vai pelo píer até o fim. A casa amarela da direita é a da Marina.', 'Geh den Steg entlang bis zum Ende. Das gelbe Haus rechts ist Marinas Haus.', 'Walk down the pier to the end. The yellow house on the right is Marina’s.'),
      bartolo: A('Bartolo está en el muelle, al lado de su ferry. No se mueve.', 'O Bartolo está no píer, do lado da balsa dele. Ele não se mexe.', 'Bartolo steht auf dem Steg, neben seiner Fähre. Er bewegt sich nicht.', 'Bartolo is on the pier, next to his ferry. He doesn’t move.'),
      ferry: A('El ferry está al final de este muelle. Es el barco grande y plano.', 'A balsa fica no fim deste píer. É o barco grande e chato.', 'Die Fähre ist am Ende von diesem Steg. Das ist das große, flache Boot.', 'The ferry is at the end of this pier. It’s the big flat boat.'),
      island: A('La isla está en el lago, al oeste. ¿Ves el faro? Está encima de la isla.', 'A ilha fica no lago, a oeste. Tá vendo o farol? Fica em cima da ilha.', 'Die Insel ist im See, im Westen. Siehst du den Leuchtturm? Er steht auf der Insel.', 'The island is in the lake, to the west. See the lighthouse? It’s on top of the island.'),
      bell: A('La campana está en el agua, delante de la isla. Ya no suena.', 'O sino está na água, na frente da ilha. Não toca mais.', 'Die Glocke ist im Wasser, vor der Insel. Sie läutet nicht mehr.', 'The bell is in the water, in front of the island. It doesn’t ring anymore.'),
    },
    aurora: {      // on the bench by the pier head
      marina: A('¿Marina? Está en su casa, la casa amarilla al final del muelle.', 'A Marina? Está em casa, a casa amarela no fim do píer.', 'Marina? Sie ist zu Hause, im gelben Haus am Ende vom Steg.', 'Marina? She’s at home, in the yellow house at the end of the pier.'),
      bartolo: A('El pobre Bartolo está al lado de su ferry, al final del muelle. Ya no habla.', 'O coitado do Bartolo está do lado da balsa, no fim do píer. Ele não fala mais.', 'Der arme Bartolo steht neben seiner Fähre, am Ende vom Steg. Er spricht nicht mehr.', 'Poor Bartolo is next to his ferry, at the end of the pier. He doesn’t talk anymore.'),
      ferry: A('El ferry está al final del muelle, pero hoy no sale.', 'A balsa está no fim do píer, mas hoje não sai.', 'Die Fähre liegt am Ende vom Steg, aber heute fährt sie nicht.', 'The ferry is at the end of the pier, but it doesn’t go today.'),
      island: A('La isla está ahí, en el lago. Desde aquí se ve el faro.', 'A ilha fica ali, no lago. Daqui dá pra ver o farol.', 'Die Insel ist da drüben im See. Von hier sieht man den Leuchtturm.', 'The island is over there, in the lake. You can see the lighthouse from here.'),
      bell: A('La campana está en el agua, al lado de la isla. Antes sonaba cada noche.', 'O sino está na água, perto da ilha. Antes ele tocava toda noite.', 'Die Glocke ist im Wasser, neben der Insel. Früher hat sie jeden Abend geläutet.', 'The bell is in the water, next to the island. It used to ring every night.'),
    },
    delia: {       // mending nets on the beach, south of the pier
      marina: A('Sube al muelle y camina hasta el final. Marina vive en la casa amarilla, a la derecha.', 'Sobe no píer e vai até o fim. A Marina mora na casa amarela, à direita.', 'Geh auf den Steg und bis zum Ende. Marina wohnt im gelben Haus, rechts.', 'Go up onto the pier and walk to the end. Marina lives in the yellow house, on the right.'),
      bartolo: A('Bartolo, el barquero, está al lado del ferry, al final del muelle.', 'O Bartolo, o balseiro, está do lado da balsa, no fim do píer.', 'Bartolo, der Fährmann, ist neben der Fähre, am Ende vom Steg.', 'Bartolo, the ferryman, is next to the ferry, at the end of the pier.'),
      ferry: A('El ferry está al final del muelle. Pero sin Bartolo, no va a ninguna parte.', 'A balsa está no fim do píer. Mas sem o Bartolo, ela não vai a lugar nenhum.', 'Die Fähre ist am Ende vom Steg. Aber ohne Bartolo fährt sie nirgendwohin.', 'The ferry is at the end of the pier. But without Bartolo, it goes nowhere.'),
      island: A('La isla está lejos, en medio del lago. Mira: el faro está encima.', 'A ilha fica longe, no meio do lago. Olha: o farol fica em cima.', 'Die Insel ist weit weg, mitten im See. Schau: Oben steht der Leuchtturm.', 'The island is far out, in the middle of the lake. Look: the lighthouse is on top.'),
      bell: A('La campana está en el agua, a la izquierda de la isla.', 'O sino está na água, à esquerda da ilha.', 'Die Glocke ist im Wasser, links von der Insel.', 'The bell is in the water, to the left of the island.'),
    },
    moncho: {      // at the corner of the ferry dock, looking out at the bell
      marina: A('La casa amarilla, aquí al lado, a la derecha. Ahí vive Marina.', 'A casa amarela, aqui do lado, à direita. A Marina mora ali.', 'Das gelbe Haus hier nebenan, rechts. Da wohnt Marina.', 'The yellow house right here, on the right. Marina lives there.'),
      bartolo: A('Bartolo está ahí, delante del ferry. Míralo: no se mueve.', 'O Bartolo está ali, na frente da balsa. Olha só: ele não se mexe.', 'Bartolo ist da vorne, vor der Fähre. Schau: Er bewegt sich nicht.', 'Bartolo is right there, in front of the ferry. Look: he doesn’t move.'),
      ferry: A('El ferry está ahí, detrás de Bartolo.', 'A balsa está ali, atrás do Bartolo.', 'Die Fähre ist da, hinter Bartolo.', 'The ferry is right there, behind Bartolo.'),
      island: A('La isla está delante, detrás del ferry. Arriba está el faro.', 'A ilha fica na frente, atrás da balsa. Lá em cima fica o farol.', 'Die Insel ist da vorne, hinter der Fähre. Oben steht der Leuchtturm.', 'The island is ahead, behind the ferry. The lighthouse is up on top.'),
      bell: A('¿Ves la campana en el agua? Está delante de la isla, a la izquierda.', 'Tá vendo o sino na água? Está na frente da ilha, à esquerda.', 'Siehst du die Glocke im Wasser? Sie ist vor der Insel, links.', 'See the bell in the water? It’s in front of the island, on the left.'),
    },
  };
  // zh / ja: the same answers (CJK.md's notation and names), just as true to where each of them stands. The ask itself is
  // story.js's askScene: «玛丽娜在哪里？» / «マリーナさんはどこですか？», compared through CJK.canon.
  const Z = (zh, ja) => ({ zh, ja });
  const ANSWERS_CJK = {
    pepe: {
      marina: Z('[玛丽娜|Mǎ lì nà] [在|zài] [码头|mǎ tóu] [尽头|jìn tóu] [的|de] [黄|huáng] [房子|fáng zi] [里|lǐ] ， [在|zài] [右边|yòu biān] 。', 'マリーナ さん は [桟橋|さんばし] の [先|さき] の 、 [黄色|きいろ]い [家|いえ] に います 。 [右|みぎ] です よ 。'),
      bartolo: Z('[巴托洛|Bā tuō luò] [在|zài] [码头|mǎ tóu] [尽头|jìn tóu] ， [渡船|dù chuán] [旁边|páng biān] 。 [他|tā] [不|bù] [说话|shuō huà] [了|le] 。', 'バルトロ さん は [桟橋|さんばし] の [先|さき] 、 フェリー の [横|よこ] に います 。 もう [話|はな]しません 。'),
      ferry: Z('[渡船|dù chuán] [在|zài] [码头|mǎ tóu] [尽头|jìn tóu] ， [在|zài] [岛|dǎo] [的|de] [前面|qián miàn] 。', 'フェリー は [桟橋|さんばし] の [先|さき] 、 [島|しま] の [前|まえ] に あります 。'),
      island: Z('[岛|dǎo] [在|zài] [湖|hú] [中间|zhōng jiān] ， [在|zài] [渡船|dù chuán] [后面|hòu miàn] 。', '[島|しま] は [湖|みずうみ] の [真|ま]ん[中|なか] 、 フェリー の [後|うし]ろ です 。'),
      bell: Z('[钟|zhōng] [在|zài] [水|shuǐ] [里|lǐ] ， [在|zài] [码头|mǎ tóu] [和|hé] [岛|dǎo] [中间|zhōng jiān] 。', '[鐘|かね] は [水|みず] の [中|なか] 、 [桟橋|さんばし] と [島|しま] の [間|あいだ] に あります 。'),
    },
    chema: {
      marina: Z('[沿着|yán zhe] [码头|mǎ tóu] [一直|yī zhí] [走|zǒu] [到|dào] [尽头|jìn tóu] 。 [右边|yòu biān] [那|nà] [栋|dòng] [黄|huáng] [房子|fáng zi] [就是|jiù shì] [玛丽娜|Mǎ lì nà] [家|jiā] 。', '[桟橋|さんばし] を [先|さき] まで [歩|ある]いて ください 。 [右|みぎ] の [黄色|きいろ]い [家|いえ] が 、 マリーナ さん の [家|いえ] です 。'),
      bartolo: Z('[巴托洛|Bā tuō luò] [在|zài] [码头|mǎ tóu] [上|shàng] ， [他|tā] [的|de] [渡船|dù chuán] [旁边|páng biān] 。 [他|tā] [一|yī] [动|dòng] [也|yě] [不|bù] [动|dòng] 。', 'バルトロ さん は [桟橋|さんばし] に います 。 フェリー の [横|よこ] です 。 ぜんぜん [動|うご]きません 。'),
      ferry: Z('[渡船|dù chuán] [在|zài] [这个|zhè ge] [码头|mǎ tóu] [的|de] [尽头|jìn tóu] 。 [就是|jiù shì] [那|nà] [条|tiáo] [又|yòu] [大|dà] [又|yòu] [平|píng] [的|de] [船|chuán] 。', 'フェリー は この [桟橋|さんばし] の [先|さき] です 。 [大|おお]きくて [平|たい]ら な [船|ふね] です よ 。'),
      island: Z('[岛|dǎo] [在|zài] [湖|hú] [里|lǐ] ， [在|zài] [西边|xī biān] 。 [看到|kàn dào] [灯塔|dēng tǎ] [了|le] [吗|ma] ？ [灯塔|dēng tǎ] [就|jiù] [在|zài] [岛|dǎo] [上|shàng] 。', '[島|しま] は [湖|みずうみ] の [西|にし] に あります 。 [灯台|とうだい] が [見|み]えます か ？ [島|しま] の [上|うえ] に あります 。'),
      bell: Z('[钟|zhōng] [在|zài] [水|shuǐ] [里|lǐ] ， [在|zài] [岛|dǎo] [前面|qián miàn] 。 [它|tā] [不|bù] [响|xiǎng] [了|le] 。', '[鐘|かね] は [水|みず] の [中|なか] 、 [島|しま] の [前|まえ] です 。 もう [鳴|な]りません 。'),
    },
    aurora: {
      marina: Z('[玛丽娜|Mǎ lì nà] ？ [她|tā] [在|zài] [家|jiā] ， [就是|jiù shì] [码头|mǎ tóu] [尽头|jìn tóu] [的|de] [黄|huáng] [房子|fáng zi] 。', 'マリーナ さん ？ [家|いえ] に います よ 。 [桟橋|さんばし] の [先|さき] の 、 [黄色|きいろ]い [家|いえ] です 。'),
      bartolo: Z('[可怜|kě lián] [的|de] [巴托洛|Bā tuō luò] [在|zài] [他|tā] [的|de] [渡船|dù chuán] [旁边|páng biān] ， [码头|mǎ tóu] [尽头|jìn tóu] 。 [他|tā] [不|bù] [说话|shuō huà] [了|le] 。', 'かわいそう な バルトロ さん は 、 [桟橋|さんばし] の [先|さき] 、 フェリー の [横|よこ] に います 。 もう [話|はな]しません 。'),
      ferry: Z('[渡船|dù chuán] [在|zài] [码头|mǎ tóu] [尽头|jìn tóu] ， [可是|kě shì] [今天|jīn tiān] [不|bù] [开|kāi] 。', 'フェリー は [桟橋|さんばし] の [先|さき] です 。 でも 、 [今日|きょう] は [出|で]ません 。'),
      island: Z('[岛|dǎo] [就|jiù] [在|zài] [那边|nà biān] ， [在|zài] [湖|hú] [里|lǐ] 。 [从|cóng] [这里|zhè lǐ] [能|néng] [看到|kàn dào] [灯塔|dēng tǎ] 。', '[島|しま] は あそこ 、 [湖|みずうみ] の [中|なか] です 。 ここ から [灯台|とうだい] が [見|み]えます よ 。'),
      bell: Z('[钟|zhōng] [在|zài] [水|shuǐ] [里|lǐ] ， [在|zài] [岛|dǎo] [旁边|páng biān] 。 [以前|yǐ qián] [每天|měi tiān] [晚上|wǎn shang] [都|dōu] [响|xiǎng] 。', '[鐘|かね] は [水|みず] の [中|なか] 、 [島|しま] の [横|よこ] です 。 [前|まえ] は [毎晩|まいばん] [鳴|な]って いました 。'),
    },
    delia: {
      marina: Z('[走|zǒu] [上|shàng] [码头|mǎ tóu] ， [一直|yī zhí] [走|zǒu] [到|dào] [尽头|jìn tóu] 。 [玛丽娜|Mǎ lì nà] [住|zhù] [在|zài] [右边|yòu biān] [的|de] [黄|huáng] [房子|fáng zi] [里|lǐ] 。', '[桟橋|さんばし] に [上|あ]がって 、 [先|さき] まで [歩|ある]いて ください 。 マリーナ さん は [右|みぎ] の [黄色|きいろ]い [家|いえ] に [住|す]んで います 。'),
      bartolo: Z('[船夫|chuán fū] [巴托洛|Bā tuō luò] [在|zài] [渡船|dù chuán] [旁边|páng biān] ， [在|zài] [码头|mǎ tóu] [尽头|jìn tóu] 。', '[船頭|せんどう] の バルトロ さん は 、 [桟橋|さんばし] の [先|さき] 、 フェリー の [横|よこ] に います 。'),
      ferry: Z('[渡船|dù chuán] [在|zài] [码头|mǎ tóu] [尽头|jìn tóu] 。 [可是|kě shì] [没有|méi yǒu] [巴托洛|Bā tuō luò] ， [它|tā] [哪里|nǎ lǐ] [也|yě] [去|qù] [不|bù] [了|liǎo] 。', 'フェリー は [桟橋|さんばし] の [先|さき] です 。 でも 、 バルトロ さん が いない と 、 どこ に も [行|い]けません 。'),
      island: Z('[岛|dǎo] [很|hěn] [远|yuǎn] ， [在|zài] [湖|hú] [中间|zhōng jiān] 。 [你|nǐ] [看|kàn] ， [灯塔|dēng tǎ] [在|zài] [上面|shàng miàn] 。', '[島|しま] は [遠|とお]い です 。 [湖|みずうみ] の [真|ま]ん[中|なか] です よ 。 ほら 、 [上|うえ] に [灯台|とうだい] が あります 。'),
      bell: Z('[钟|zhōng] [在|zài] [水|shuǐ] [里|lǐ] ， [在|zài] [岛|dǎo] [的|de] [左边|zuǒ biān] 。', '[鐘|かね] は [水|みず] の [中|なか] 、 [島|しま] の [左|ひだり] に あります 。'),
    },
    moncho: {
      marina: Z('[就是|jiù shì] [旁边|páng biān] [那|nà] [栋|dòng] [黄|huáng] [房子|fáng zi] ， [在|zài] [右边|yòu biān] 。 [玛丽娜|Mǎ lì nà] [住|zhù] [在|zài] [那里|nà lǐ] 。', 'すぐ [横|よこ] の [黄色|きいろ]い [家|いえ] です 。 [右|みぎ] です よ 。 そこ に マリーナ さん が [住|す]んで います 。'),
      bartolo: Z('[巴托洛|Bā tuō luò] [就|jiù] [在|zài] [那里|nà lǐ] ， [渡船|dù chuán] [前面|qián miàn] 。 [你|nǐ] [看|kàn] ， [他|tā] [一|yī] [动|dòng] [也|yě] [不|bù] [动|dòng] 。', 'バルトロ さん は そこ 、 フェリー の [前|まえ] に います 。 [見|み]て ください 、 [動|うご]きません 。'),
      ferry: Z('[渡船|dù chuán] [就|jiù] [在|zài] [那里|nà lǐ] ， [在|zài] [巴托洛|Bā tuō luò] [后面|hòu miàn] 。', 'フェリー は そこ 、 バルトロ さん の [後|うし]ろ です 。'),
      island: Z('[岛|dǎo] [在|zài] [前面|qián miàn] ， [在|zài] [渡船|dù chuán] [后面|hòu miàn] 。 [上面|shàng miàn] [是|shì] [灯塔|dēng tǎ] 。', '[島|しま] は [前|まえ] 、 フェリー の [向|む]こう です 。 [上|うえ] に [灯台|とうだい] が あります 。'),
      bell: Z('[你|nǐ] [看到|kàn dào] [水|shuǐ] [里|lǐ] [的|de] [钟|zhōng] [了|le] [吗|ma] ？ [它|tā] [在|zài] [岛|dǎo] [前面|qián miàn] ， [在|zài] [左边|zuǒ biān] 。', '[水|みず] の [中|なか] の [鐘|かね] が [見|み]えます か ？ [島|しま] の [前|まえ] 、 [左|ひだり] です 。'),
    },
  };
  for (const [who, T] of Object.entries(ANSWERS_CJK)) for (const [k, v] of Object.entries(T)) if (ANSWERS[who] && ANSWERS[who][k]) Object.assign(ANSWERS[who][k], v);
  // Milestone 2: where Bartolo's lost things are, when you ask «¿Dónde está el remo?» (story.js askScene). Two ways of saying it,
  // taken in turns by the people you can ask. zh / ja in game/CJK.md's notation.
  const A6 = (es, pt, de, en, zh, ja) => ({ es, pt, de, en, zh, ja });
  const LOST_ANSWERS = [
    {
      oar: A6('El remo de Bartolo está debajo del muelle, cerca del puesto de pescado.', 'O remo do Bartolo está debaixo do píer, perto da banca de peixe.',
        'Bartolos Ruder ist unter dem Steg, beim Fischstand.', 'Bartolo’s oar is under the pier, near the fish stall.',
        '[巴托洛|Bā tuō luò] [的|de] [船桨|chuán jiǎng] [在|zài] [码头|mǎ tóu] [下面|xià miàn] ， [鱼摊|yú tān] [旁边|páng biān] 。',
        'バルトロ さん の オール は [桟橋|さんばし] の [下|した] に あります 。 [魚|さかな] の [屋台|やたい] の [近|ちか]く です 。'),
      lantern: A6('El farol de Bartolo está encima del barco rojo, al lado del muelle.', 'A lanterna do Bartolo está em cima do barco vermelho, do lado do píer.',
        'Bartolos Laterne ist auf dem roten Boot, neben dem Steg.', 'Bartolo’s lantern is on top of the red boat, next to the pier.',
        '[巴托洛|Bā tuō luò] [的|de] [马灯|mǎ dēng] [在|zài] [红|hóng] [船|chuán] [上|shàng] ， [在|zài] [码头|mǎ tóu] [旁边|páng biān] 。',
        'バルトロ さん の ランタン は [赤|あか]い [船|ふね] の [上|うえ] に あります 。 [桟橋|さんばし] の [横|よこ] です 。'),
      rope: A6('La cuerda de Bartolo está dentro del barril, al lado del barco de Vicente.', 'A corda do Bartolo está dentro do barril, do lado do barco do Vicente.',
        'Bartolos Seil ist im Fass, neben Vicentes Boot.', 'Bartolo’s rope is in the barrel, next to Vicente’s boat.',
        '[巴托洛|Bā tuō luò] [的|de] [绳子|shéng zi] [在|zài] [木桶|mù tǒng] [里|lǐ] ， [在|zài] [维森特|Wéi sēn tè] [的|de] [船|chuán] [旁边|páng biān] 。',
        'バルトロ さん の ロープ は [樽|たる] の [中|なか] に あります 。 ビセンテ さん の [船|ふね] の [横|よこ] です 。'),
    },
    {
      oar: A6('¿El remo? Está debajo del muelle, entre los postes.', 'O remo? Está debaixo do píer, entre as estacas.',
        'Das Ruder? Das ist unter dem Steg, zwischen den Pfählen.', 'The oar? It’s under the pier, between the posts.',
        '[船桨|chuán jiǎng] ？ [在|zài] [码头|mǎ tóu] [下面|xià miàn] ， [在|zài] [柱子|zhù zi] [中间|zhōng jiān] 。',
        'オール ？ [桟橋|さんばし] の [下|した] です よ 。 [柱|はしら] の [間|あいだ] に あります 。'),
      lantern: A6('¿El farol? Mira el barco rojo: el farol está encima.', 'A lanterna? Olha o barco vermelho: ela está em cima dele.',
        'Die Laterne? Sie ist auf dem roten Boot. Schau mal!', 'The lantern? Look at the red boat: the lantern is on top of it.',
        '[马灯|mǎ dēng] ？ [你|nǐ] [看|kàn] [那|nà] [条|tiáo] [红|hóng] [船|chuán] ， [马灯|mǎ dēng] [在|zài] [上面|shàng miàn] 。',
        'ランタン ？ [赤|あか]い [船|ふね] を [見|み]て ください 。 その [上|うえ] に あります よ 。'),
      rope: A6('¿La cuerda? Está dentro del barril, donde trabaja Vicente.', 'A corda? Está dentro do barril, onde o Vicente trabalha.',
        'Das Seil? Das ist im Fass, da, wo Vicente arbeitet.', 'The rope? It’s in the barrel, where Vicente works.',
        '[绳子|shéng zi] ？ [在|zài] [木桶|mù tǒng] [里|lǐ] ， [就|jiù] [在|zài] [维森特|Wéi sēn tè] [干活|gàn huó] [的|de] [地方|dì fang] 。',
        'ロープ ？ [樽|たる] の [中|なか] です よ 。 ビセンテ さん が [働|はたら]いて いる ところ です 。'),
    },
  ];
  ['pepe', 'chema', 'aurora', 'delia', 'moncho'].forEach((id, i) => { if (ANSWERS[id]) Object.assign(ANSWERS[id], LOST_ANSWERS[i % 2]); });
  const SK = SKINS;
  const CAST = [
    { id: 'lalo', name: 'Lalo', job: 'swim', story: true, kid: 1, look: { skin: SK[3], hair: '#2e2420', dress: '#e0603c', bare: true, legs: true, pants: '#2f6f8a', h: 0.8, armL: 0.46, hat: 'swim', hatColor: '#e8403a' } },
    { id: 'marina', name: 'Marina', kind: 'head', job: 'stand', story: true, at: { x: -182, z: -157.75, yaw: 0, y: DECK }, look: { skin: SK[4], hair: '#3a2b26', hairdo: 'bun', dress: '#2f8f8a', apron: '#f2c94c', w: 1.05 } },
    { id: 'bartolo', name: 'Bartolo', kind: 'ferryman', job: 'stand', hushed: true, at: { x: -189.4, z: -150.2, yaw: Math.atan2(FERRY.x + 189.4, FERRY.z + 150.2), y: DECK }, look: { skin: SK[2], hair: '#5a5a5a', beard: true, dress: '#3f5f7a', legs: true, pants: '#3a3a44', hat: 'sailor', hatColor: '#e8e2d6', h: 1.06 }, prop: 'pole' },
    { id: 'pepe', name: 'Pepe', job: 'fish', at: { x: -176.4, z: -150.82, yaw: 0, y: DECK, seat: 0.02 }, bob: { x: -176.1, z: -147.5 }, look: { skin: SK[0], hair: '#e0ddd6', hairdo: 'bald', beard: true, dress: '#e6b84a', legs: true, pants: '#3f5f7a', hat: 'straw', h: 0.95 }, prop: 'rod' },
    { id: 'delia', name: 'Delia', job: 'mend', at: { x: -158.9, z: -145.8, yaw: -Math.PI / 2 }, look: { skin: SK[5], hair: '#6b3b25', hairdo: 'long', dress: '#c0563c', apron: '#e8e2d6', hat: 'scarf', hatColor: '#3f6fb5' }, prop: 'shuttle' },
    { id: 'vicente', name: 'Vicente', job: 'build', at: { x: -155.6, z: -164.6, yaw: Math.PI }, look: { skin: SK[6], hair: '#2e2420', dress: '#8a5f3e', apron: '#c9a66b', legs: true, pants: '#4a3a33', hat: 'cap', hatColor: '#2f6f6a', stache: true, h: 1.05 }, prop: 'hammer' },
    { id: 'aurora', name: 'Aurora', job: 'sit', at: { x: -154.8, z: -156.6, yaw: 0, seat: 0.5 }, look: { skin: SK[1], hair: '#ece8e0', hairdo: 'bun', dress: '#7a4f9a', h: 0.9 } },
    { id: 'chema', name: 'Chema', job: 'keeper', at: { x: -153.7, z: -148.0, yaw: Math.PI }, look: { skin: SK[3], hair: '#3a2b26', dress: '#3f6fb5', apron: '#fdf8ee', legs: true, pants: '#3a3040', hat: 'beanie', hatColor: '#d9483b', stache: true, w: 1.12 } },
    { id: 'tere', name: 'Tere', job: 'walk', speed: 1.1, pause: 3, path: [[-147.8, -155.6], [-151.0, -153.6], [-157.4, -151.8], [-170.4, -151.8], [-170.5, -156.4]], look: { skin: SK[2], hair: '#4a2f27', hairdo: 'pony', dress: '#e07a3a', apron: '#fdf8ee' }, prop: 'fish' },
    { id: 'lucho', name: 'Lucho', job: 'walk', kid: 1, speed: 2.4, pause: 1.5, run: true, path: [[-158.6, -152.2], [-182.6, -152.2]], look: { skin: SK[4], hair: '#2e2420', dress: '#f2c94c', legs: true, pants: '#3f6fb5', h: 0.72, hat: 'cap', hatColor: '#d9483b' } },
    { id: 'cata', name: 'Cata', job: 'walk', kid: 1, speed: 2.2, pause: 2, run: true, path: [[-167.5, -149.6], [-167.5, -141.6], [-159.6, -141.2]], look: { skin: SK[0], hair: '#c98a4a', hairdo: 'pigtails', dress: '#4f9a5a', h: 0.7 } },
    { id: 'nando', name: 'Nando', job: 'row', look: { skin: SK[3], hair: '#3a2b26', dress: '#e8e2d6', legs: true, pants: '#3a4466', hat: 'straw', hatColor: '#e8c57a' } },
    { id: 'rocio', name: 'Rocío', job: 'hang', at: { x: -144.8, z: -137.5, yaw: 0 }, look: { skin: SK[7], hair: '#2e2420', hairdo: 'long', dress: '#e86a9a', apron: '#fdf8ee' } },
    { id: 'fausto', name: 'Fausto', job: 'paint', at: { x: -158.75, z: -162.3, yaw: -Math.PI / 2 }, look: { skin: SK[2], hair: '#8a4a2a', dress: '#f4efe4', legs: true, pants: '#2f6f8a', hat: 'cap', hatColor: '#f2c94c', beard: true }, prop: 'brush' },
    { id: 'celia', name: 'Celia', job: 'sweep', at: { x: -170.5, z: -157.35, yaw: Math.PI / 2, y: DECK }, look: { skin: SK[5], hair: '#3a2b26', hairdo: 'bun', dress: '#9fd3c7', apron: '#fdf8ee', hat: 'scarf', hatColor: '#e05a3c' }, prop: 'broom' },
    { id: 'moncho', name: 'Moncho', job: 'stand', at: { x: -184.2, z: -153.05, yaw: Math.atan2(BUOY.x + 184.2, BUOY.z + 153.05), y: DECK }, look: { skin: SK[6], hair: '#d8d8d8', dress: '#5a86b8', legs: true, pants: '#3a3a44', hat: 'flat', hatColor: '#4a4a55', beard: true, h: 0.98 } },
    { id: 'lino', name: 'Lino', job: 'chat', at: { x: -144.6, z: -153.8 }, other: 'mar', look: { skin: SK[1], hair: '#4a2f27', dress: '#2f8f8a', legs: true, pants: '#4a3a33', hat: 'cap', hatColor: '#3f6fb5' } },
    { id: 'mar', name: 'Mar', job: 'chat', at: { x: -143.2, z: -154.9 }, other: 'lino', look: { skin: SK[4], hair: '#2e2420', hairdo: 'curly', dress: '#f2c94c' }, prop: 'fish' },
    { id: 'quino', name: 'Quino', job: 'walk', speed: 1.0, pause: 3.5, path: [[-140.6, -163.2], [-145.0, -162.2], [-145.4, -154.6], [-151.6, -153.6], [-157.6, -152.4]], look: { skin: SK[7], hair: '#2e2420', dress: '#7f97a6', legs: true, pants: '#3a3040', hat: 'beanie', hatColor: '#2f6f6a' }, prop: 'oars' },
  ];
  const DUCKS = [['#fdf8ee', -165.5, -159.8, 1.5, 0.35], ['#9a7a5a', -165.5, -159.8, 0.9, -0.5], ['#fdf8ee', -171.0, -138.4, 1.8, 0.3], ['#9a7a5a', -171.0, -138.4, 1.15, -0.42], ['#fdf8ee', -192.4, -145.6, 1.6, 0.28]];
  const MOORED = [   // boats tied up: [hull, trim, x, z, yaw, the bollard their rope goes to]
    ['#d9483b', '#fdf8ee', -169.9, -149.2, Math.PI / 2, [-169.6, -150.9]], ['#2f8f8a', '#f2c94c', -176.2, -154.7, Math.PI / 2 + 0.08, [-176.0, -153.1]],
    ['#f2c94c', '#3f6fb5', -178.15, -147.9, 0.05, [-179.75, -148.6]], ['#3f6fb5', '#fdf8ee', -186.4, -157.5, Math.PI / 2 - 0.05, [-186.0, -155.35]],
  ];
  const ROW = { x: -183, z: -136.2, rx: 7.2, rz: 3.2 };            // Nando rows round this loop, south-west of the village
  const JUMPS = [[-178.5, -157.0], [-175.8, -147.4], [-186.4, -158.8], [-188.8, -145.0], [-195.6, -160.2], [-170.2, -164.2], [-196.0, -143.5], [-160.2, -172.0]];
  const UPV = new THREE.Vector3(0, 1, 0), _d3 = new THREE.Vector3();
  function stretch(n, ax, ay, az, bx, by, bz, r) {          // a rope (a thin 'cyl' leaf) from a to b
    const dx = bx - ax, dy = by - ay, dz = bz - az, L = Math.hypot(dx, dy, dz) || 1e-4;
    n.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2); n.quaternion.setFromUnitVectors(UPV, _d3.set(dx / L, dy / L, dz / L));
    n.scale.set(r, L, r); n.updateMatrixWorld(true);
  }
  function moveTo(S, tx, tz, v, dt) {
    const dx = tx - S.x, dz = tz - S.z, d = Math.hypot(dx, dz);
    if (d < 0.05) { S.speed = 0; return true; }
    const st = Math.min(d, v * dt); S.x += (dx / d) * st; S.z += (dz / d) * st; S.speed = v;
    S.yaw = dampAngle(S.yaw, Math.atan2(dx, dz), 7, dt);
    return d - st < 0.05;
  }
  // Lalo's laps: up the river on one side, a turn, back down the other (a stadium round riverX)
  const LANE = { L: Math.abs(LALO.z1 - LALO.z0), r: LALO.off };
  LANE.P = 2 * (LANE.L + Math.PI * LANE.r);
  function lanePos(s) {
    const { L, r } = LANE, za = LALO.z0, zb = LALO.z1;
    s = ((s % LANE.P) + LANE.P) % LANE.P;
    if (s < L) { const z = za - s; return { x: RX(z) + r, z, yaw: Math.PI }; }
    s -= L;
    if (s < Math.PI * r) { const th = s / r; return { x: RX(zb) + r * Math.cos(th), z: zb - r * Math.sin(th), yaw: Math.atan2(-Math.sin(th), -Math.cos(th)) }; }
    s -= Math.PI * r;
    if (s < L) { const z = zb + s; return { x: RX(z) - r, z, yaw: 0 }; }
    s -= L;
    const th = s / r; return { x: RX(za) - r * Math.cos(th), z: za + r * Math.sin(th), yaw: th };
  }
  function makeDynamic(root, out, gy) {
    const rig = Rig(), people = [], byId = {}, R = rng(99), V = new THREE.Vector3(), W2 = new THREE.Vector3();
    const groundAt = (x, z) => {
      let g = gy(x, z);
      for (const p of out.platforms) {
        let top = null;
        if (p.box) { if (x >= p.box[0] && x <= p.box[1] && z >= p.box[2] && z <= p.box[3]) top = p.top; }
        else { const [ax, az, bx, bz] = p.seg, dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); if (Math.hypot(x - (ax + dx * t), z - (az + dz * t)) < p.w / 2) top = lerp(p.y[0], p.y[1], t); }
        if (top !== null && top > g) g = top;
      }
      return g;
    };
    const own = o => o.traverse(n => { n.userData.own = true; });
    // ---------------- the floating things: the raft, the ferry, the buoy and its bell, boats tied up, Nando's boat
    const raft = makeRaft(rig); raft.root.position.set(RAFT.home.x, WATER, RAFT.home.z); root.add(raft.root);
    const ferry = makeFerry(rig); ferry.root.position.set(FERRY.x, WATER, FERRY.z); ferry.root.rotation.y = Math.PI / 2; root.add(ferry.root);
    const buoy = makeBuoy(rig); buoy.root.position.set(BUOY.x, WATER, BUOY.z); buoy.root.rotation.y = 0.5; root.add(buoy.root);
    [raft.root, ferry.root, buoy.root].forEach(own);
    const ropeLeaf = () => rig.leaf(new THREE.Object3D(), 'cyl', ROPE, null, [0.02, 1, 0.02]);
    const boats = MOORED.map(([c, tr, x, z, yaw, post], i) => { const B = makeBoat(rig, c, tr); B.root.position.set(x, WATER, z); B.root.rotation.y = yaw; Object.assign(B, { post, rope: ropeLeaf(), i }); return B; });
    const rowB = makeBoat(rig, '#e07a3a', '#fdf8ee', { oars: 'row' }), row = { B: rowB, a: 0.6, ph: 0 };
    const raftRope = ropeLeaf(), ferryRopes = [ropeLeaf(), ropeLeaf()];
    // ---------------- people
    for (const d of CAST) {
      const Rr = makePerson(rig, { ...d.look, hushed: d.hushed, prop: d.prop });
      const S = { x: 0, z: 0, yaw: 0, speed: 0, phase: R() * 6, near: false, wave: 0, talk: 0, blink: 1 + R() * 4, seed: R(), i: 0, dir: 1, pause: R() * 2, hop: 0, sit: false, seat: 0.5, pose: null, lookAt: undefined, gy: GY, blend: 1, s: 0, ap: 0, kick: 0, rip: 0 };
      if (d.at) { S.x = d.at.x; S.z = d.at.z; S.yaw = d.at.yaw || 0; }
      if (d.path) { S.x = d.path[0][0]; S.z = d.path[0][1]; S.i = 1; }
      if (d.job === 'sit' || d.job === 'fish') { S.sit = true; S.seat = d.at.seat !== undefined ? d.at.seat : 0.53; if (d.job === 'sit') { S.x += Math.sin(S.yaw) * 0.06; S.z += Math.cos(S.yaw) * 0.06; } }
      if (d.job === 'row') { S.sit = true; rowB.body.add(Rr.root); }
      if (d.job === 'swim') { S.s = 3.2; const q = lanePos(S.s); S.x = q.x; S.z = q.z; S.yaw = q.yaw; }
      if (d.hushed) S.stare = (R() - 0.5) * 0.6;
      S.gy = d.at && d.at.y !== undefined ? d.at.y : groundAt(S.x, S.z);
      const h = d.look.h || 1;
      const api = { id: d.id, name: d.name, kind: d.kind || (d.kid ? 'kid' : d.job), hushed: !!d.hushed, lines: d.hushed || d.story ? null : LINES[d.id] || null, talking: false,
        get x() { return S.x; }, get z() { return S.z; }, get y() { return d.job === 'swim' ? WATER : d.job === 'row' ? WATER + 0.2 : S.gy + (S.sit ? S.seat - 0.5 : 0); },
        top: d.job === 'swim' ? 0.95 : d.job === 'fish' ? 1.6 : h * 1.5 - (d.job === 'sit' ? 0.45 : 0), _S: S, _R: Rr, _d: d };
      if (ANSWERS[d.id]) api.answers = ANSWERS[d.id];
      if (d.story) api.story = true;
      people.push(api); byId[d.id] = api;
      // (Bartolo rides his ferry to the island and back: no fixed solid for him; main.js's crowd solids follow him)
      if (['keeper', 'chat', 'stand', 'fish', 'mend', 'build', 'sit', 'hang', 'paint'].includes(d.job) && d.id !== 'bartolo') out.colliders.push({ x: S.x, z: S.z, r: 0.4, npc: d.id });
    }
    // ---------------- Bartolo's lost things (isle.js shows them while they're lost): his oar under the main pier, his lantern
    // on the red boat (it bobs with the boat), his rope coiled in the barrel by Vicente's slipway
    const items = {};
    {
      const o = LOST.oar, oy = Math.max(gy(o.x, o.z), WATER) + 0.04, n = rig.node(root, [o.x, oy, o.z], [0, 0.35, 0]);
      rig.leaf(n, 'cyl', '#b07a48', [0, 0, -0.2], [0.045, 2.3, 0.045], [Math.PI / 2 - 0.05, 0, 0]);
      rig.leaf(n, 'box', '#9a6a3f', [0, 0.06, 1.15], [0.26, 0.045, 0.62]);
      rig.leaf(n, 'box', '#d9483b', [0, 0.065, 1.38], [0.27, 0.05, 0.14]);
      rig.leaf(n, 'cyl', '#8a5f3e', [0, -0.05, -1.32], [0.055, 0.16, 0.055], [Math.PI / 2, 0, 0]);
      items.oar = n;
    }
    {
      const B = boats[LOST.lantern.boat], n = rig.node(B.body, [0.05, 0.19, 0.3], [0, 0.4, 0]);
      rig.leaf(n, 'box', LAMP, [0, 0.13, 0], [0.2, 0.24, 0.2]); rig.leaf(n, 'box', IRON, [0, 0.27, 0], [0.26, 0.05, 0.26]); rig.leaf(n, 'box', IRON, [0, 0.0, 0], [0.24, 0.04, 0.24]);
      rig.leaf(n, 'cone', IRON, [0, 0.33, 0], [0.14, 0.1, 0.14]); rig.leaf(n, 'ring', IRON, [0, 0.42, 0], [0.07, 1.2, 0.07], [Math.PI / 2, 0, 0]);
      items.lantern = n;
    }
    {
      const o = LOST.rope, n = rig.node(root, [o.x, gy(o.x, o.z) + 0.86, o.z]);
      for (let i = 0; i < 3; i++) rig.leaf(n, 'ring', i % 2 ? ROPE_D : ROPE, [0, 0.03 + i * 0.05, 0], [0.27 - i * 0.04, 1.8, 0.27 - i * 0.04]);
      rig.leaf(n, 'cyl', ROPE, [0.36, -0.2, 0.05], [0.025, 0.5, 0.025], [0, 0, 0.35]);
      items.rope = n;
    }
    Object.values(items).forEach(own);
    const lalo = byId.lalo, pepe = byId.pepe, nando = byId.nando, laloState = { hold: false };
    nando._R.root.position.set(0, -0.17, 0.3); nando._R.root.rotation.y = Math.PI;
    // Pepe's line and bobber
    const bob = pepe._d.bob, bobber = rig.node(new THREE.Object3D(), [bob.x, WATER + 0.04, bob.z]), line = rig.leaf(new THREE.Object3D(), 'cyl', '#f4efe4', null, [0.006, 1, 0.006]);
    rig.leaf(bobber, 'ball', '#e0503f', null, [0.06, 0.05, 0.06]); rig.leaf(bobber, 'ball', '#fdf8ee', [0, 0.04, 0], [0.05, 0.03, 0.05]);
    // ---------------- ducks, a jumping fish, ripples and drops, the lighthouse lamp
    const ducks = DUCKS.map(([c, cx, cz, r, w], i) => ({ A: makeDuck(rig, c), cx, cz, r, w, a: i * 2.1, rip: R() }));
    const fish = makeFish(rig), jump = { on: false, u: 0 }, spots = JUMPS.filter(([x, z]) => gy(x, z) < WATER - 0.7);
    let fishT = 2;
    const RIP = Array.from({ length: 24 }, () => ({ n: rig.leaf(new THREE.Object3D(), 'ring', '#eaf6fa', null, [0.001, 0.001, 0.001]), life: 9, max: 1, x: 0, z: 0, s: 1 }));
    const DROPS = Array.from({ length: 40 }, () => ({ n: rig.leaf(new THREE.Object3D(), 'dot', '#f4fbff', null, [0.001, 0.001, 0.001]), life: 9, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, s: 0.05 }));
    let ripI = 0, dropI = 0;
    const ripple = (x, z, s = 1, max = 1.3) => { const r = RIP[ripI++ % RIP.length]; Object.assign(r, { x, z, s, max, life: 0 }); };
    const splash = (x, z, n = 4, up = 1.6, s = 0.05) => { for (let i = 0; i < n; i++) { const d = DROPS[dropI++ % DROPS.length], a = R() * TAU, v = 0.3 + R() * 0.7; Object.assign(d, { x, y: WATER + 0.03, z, vx: Math.cos(a) * v, vy: up * (0.6 + R() * 0.6), vz: Math.sin(a) * v, life: 0, max: 0.45 + R() * 0.25, s: s * (0.7 + R() * 0.6) }); } };
    const lampLeaf = rig.leaf(new THREE.Object3D(), 'dot', '#3d4652', out.lamp ? [out.lamp.x, out.lamp.y, out.lamp.z] : [0, -50, 0], [0.4, 0.46, 0.4]);
    lampLeaf.updateMatrixWorld(true);
    const folks = rig.meshes(root);
    let buoyAmt = 1, buoyTarget = 1, lastAmt = -1, bellAmp = 0, bellSwing = 0, bellDecay = 0.12, buoyRip = 0;
    const recolorBuoy = amt => { const c = new THREE.Color(); buoy.parts.forEach(([n, col]) => { c.set(col); const l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; folks.recolor(n, '#' + c.lerp(new THREE.Color(l * 0.88, l * 0.88, l * 0.96), amt * 0.9).getHexString()); }); };

    // ---------------- what everyone does each frame
    function think(p, dt, t, you) {
      const S = p._S, d = p._d;
      const dY = you ? Math.hypot(you.x - S.x, you.z - S.z) : 99, was = S.near;
      const level = !you || you.y === undefined || Math.abs(you.y - (d.job === 'swim' ? WATER : S.gy)) < 1.8;
      S.near = !d.hushed && level && d.job !== 'row' && (dY < (was ? 3.6 : 3.0) || p.talking);
      if (S.near && !was && !p.talking && !['swim', 'build', 'fish', 'mend', 'paint'].includes(d.job)) S.wave = 1.2;
      const toYou = you ? Math.atan2(you.x - S.x, you.z - S.z) : S.yaw;
      S.lookAt = !d.hushed && dY < 6 && level ? toYou : undefined;
      S.speed = 0; S.pose = null; S.hop = 0; S.chatTalk = false;
      const face = (yaw, k = 5) => { S.yaw = dampAngle(S.yaw, yaw, k, dt); };
      switch (d.job) {
        case 'walk': {
          S.pose = d.prop === 'oars' ? 'oars' : d.prop === 'fish' ? 'basket' : d.run ? 'run' : null;
          if (S.near) { face(toYou); break; }
          if (S.pause > 0) { S.pause -= dt; break; }
          const tg = d.path[S.i];
          if (moveTo(S, tg[0], tg[1], d.speed, dt)) {
            if (S.i === 0 || S.i === d.path.length - 1) S.pause = (d.pause || 2) * (0.6 + R() * 0.8);
            if (S.i === d.path.length - 1) S.dir = -1; else if (S.i === 0) S.dir = 1;
            S.i += S.dir;
          }
          if (d.run) S.hop = Math.abs(Math.sin(S.phase)) * 0.1;
          S.gy = groundAt(S.x, S.z);
          break;
        }
        case 'keeper': { if (S.near) { face(toYou, 4); break; } face(d.at.yaw, 3); const c = (t * 0.11 + S.seed * 7) % 1; S.pose = c < 0.25 ? 'arrange' : null; if (c > 0.55 && c < 0.6) S.talkSolo = 1; break; }
        case 'chat': {
          const o = byId[d.other]; if (!o) break;
          if (S.near || o._S.near) { face(toYou); break; }
          face(Math.atan2(o._S.x - S.x, o._S.z - S.z));
          const turn = Math.floor(t / 2.7 + (d.id === 'lino' ? 0 : 1)) % 2 === 0;
          S.chatTalk = turn; S.pose = 'chat'; S.nod = !turn && Math.sin(t * 0.9) > 0.3;
          break;
        }
        case 'sit': break;
        case 'fish': S.pose = 'fish'; break;
        case 'stand':
          if (S.pin) {        // pinned somewhere by a scene (Bartolo on his ferry): there, facing its way (or you, when you're close and it allows)
            S.x = S.pin.x; S.z = S.pin.z; S.gy = S.pin.y;
            if (S.near && S.pin.face !== false) face(toYou, 4); else face(S.pin.yaw, 6);
            S.pose = S.pin.steer ? 'steer' : 'pole'; break;
          }
          if (S.near) face(toYou, 4); else face(d.at.yaw, 2); S.pose = d.hushed || d.prop === 'pole' ? 'pole' : d.id === 'marina' ? 'hands' : 'hips'; break;
        case 'mend': case 'build': case 'paint': if (p.talking) { face(toYou, 4); break; } face(d.at.yaw, 3); S.pose = d.job; break;
        case 'hang': if (S.near) { face(toYou, 4); break; } face(d.at.yaw, 3); S.pose = 'hang'; break;
        case 'sweep': {
          if (S.near) { face(toYou, 4); break; }
          const tx = d.at.x + Math.sin(t * 0.3 + S.seed * 5) * 1.3;
          S.speed = Math.min(0.6, Math.abs(tx - S.x) / Math.max(dt, 1e-3)); S.x = tx;
          face(d.at.yaw + Math.sin(t * 0.6) * 0.3, 2); S.pose = 'sweep';
          break;
        }
        case 'swim': {
          const tread = p.talking || laloState.hold;
          S.blend = damp(S.blend, tread ? 0 : 1, 3, dt);
          if (!tread) { S.s += dt * 1.05 * S.blend; const q = lanePos(S.s); S.x = damp(S.x, q.x, 6, dt); S.z = damp(S.z, q.z, 6, dt); S.yaw = dampAngle(S.yaw, q.yaw, 6, dt); S.ap += dt * (1.2 + 3.2 * S.blend); }
          else { if (you && p.talking) S.yaw = dampAngle(S.yaw, toYou, 3, dt); S.ap += dt * 1.2 * S.blend; }
          S.yaw = Math.atan2(Math.sin(S.yaw), Math.cos(S.yaw)); S.ap %= TAU * 64;
          S.near = false; S.wave = 0;
          break;
        }
        default: break;
      }
    }
    function swimPose(p, dt, t) {          // Lalo: the crawl (pitched forward, arms over the top, kicking), or treading water to talk
      const S = p._S, R = p._R, k = S.blend, ph = S.ap;
      R.root.position.set(S.x, WATER - lerp(0.6, 0.38, k) + (k > 0.5 ? Math.sin(ph * 2) * 0.025 : Math.sin(t * 2.4) * 0.04), S.z); R.root.rotation.y = S.yaw;
      R.body.position.y = 0; R.body.scale.set(1, 1, 1);
      R.body.rotation.set(lerp(0.12, 0.95, k), k * Math.sin(ph) * 0.32, 0);
      const sc = Math.sin(t * 5);
      R.arms.forEach((arm, i) => { const s = i ? 1 : -1, a = (ph + (i ? Math.PI : 0)) % TAU; arm.rotation.set(lerp(-0.3, a, k), 0, lerp(s * (0.95 + sc * s * 0.3), s * 0.15, k)); });
      if (R.legs) R.legs.forEach((hip, i) => { hip.rotation.x = lerp(Math.sin(t * 3 + i * Math.PI) * 0.5, Math.sin(ph * 3 + i * Math.PI) * 0.35 - 0.1, k); });
      const breathe = k > 0.5 && Math.sin(ph) > 0.55 ? 0.7 : 0;
      R.head.rotation.x = damp(R.head.rotation.x, lerp(-0.08, -0.8, k), 6, dt); R.head.rotation.y = damp(R.head.rotation.y, breathe, 6, dt);
      S.talk = damp(S.talk, p.talking ? 1 : 0, 10, dt);
      if ((S.blink -= dt) < 0 && S.blink < -0.12) S.blink = 2 + R0() * 3.5;
      R.eyes.forEach(e => { e.scale.y = S.blink < 0 ? 0.12 : 1; });
      R.mouth.scale.y = S.talk > 0.3 ? 0.012 + Math.abs(Math.sin(t * 16)) * 0.035 : k > 0.5 && breathe ? 0.04 : 0.012;
      R.root.updateMatrixWorld(true);
      // splashes: each hand going in, the kicking feet, a little wave round the shoulders
      R.arms.forEach((arm, i) => {
        const a = (ph + (i ? Math.PI : 0)) % TAU, pa = arm.userData.pa === undefined ? a : arm.userData.pa;
        if (k > 0.5 && pa < 4.55 && a >= 4.55) { V.setFromMatrixPosition(arm.userData.hand.matrixWorld); ripple(V.x, V.z, 0.5, 0.9); splash(V.x, V.z, 6, 1.7, 0.065); }
        arm.userData.pa = a;
      });
      if (k > 0.5 && (S.kick -= dt) < 0) { S.kick = 0.13; R.feet.forEach(f => { V.setFromMatrixPosition(f.matrixWorld); splash(V.x, V.z, 2, 1.2, 0.05); }); }
      if ((S.rip -= dt) < 0) { S.rip = k > 0.5 ? 0.45 : 1.1; V.setFromMatrixPosition(R.head.matrixWorld); ripple(V.x, V.z, k > 0.5 ? 0.55 : 0.75, k > 0.5 ? 0.9 : 1.6); }
    }
    function pose(p, dt, t) {
      const S = p._S, R = p._R, d = p._d, hush = d.hushed, P = R.props;
      if (d.job === 'swim') return swimPose(p, dt, t);
      const row = d.job === 'row', legsSeat = S.sit && R.legs ? 0.3 : 0;
      if (!row) { R.root.position.set(S.x, S.gy + (S.sit ? S.seat - legsSeat - 0.02 : 0), S.z); R.root.rotation.y = S.yaw; }
      const walk = clamp(S.speed / 1.3, 0, 1.6);
      if (S.speed > 0.05) S.phase += dt * (3.0 + S.speed * 2.6); else S.phase = damp(S.phase, Math.round(S.phase / Math.PI) * Math.PI, 8, dt);
      const ph = S.phase, sw = Math.sin(ph), wk = walk;
      S.talkSolo = Math.max(0, (S.talkSolo || 0) - dt * 0.6);
      S.talk = damp(S.talk, p.talking || S.chatTalk || S.talkSolo > 0 ? 1 : 0, 10, dt);
      const br = hush ? 1 : 1 + Math.sin(t * 2.2 + S.seed * 9) * 0.014;
      R.body.scale.set(1, (S.sit ? 0.82 : 1) * br, 1);
      R.body.position.y = hush ? 0 : Math.abs(sw) * 0.05 * Math.min(wk, 1.2) + S.talk * Math.abs(Math.sin(t * 13)) * 0.03 + S.hop;
      R.body.rotation.z = hush ? 0 : sw * 0.05 * wk + Math.sin(t * 1.2 + S.seed * 9) * 0.02;
      const rowPh = row ? row_.ph : 0;
      R.body.rotation.x = ({ arrange: 0.22, mend: 0.1, build: 0.28, paint: 0.16, sweep: 0.2, oars: 0.04, fish: 0.06 }[S.pose] || 0) + walk * 0.05 + (row ? 0.32 * Math.cos(rowPh) : 0)
        + (S.pose === 'hang' && (t * 0.15 + S.seed) % 1 > 0.62 ? 0.55 : 0);
      R.body.rotation.y = S.pose === 'sweep' ? Math.sin(t * 3) * 0.25 : 0;
      if (R.legs) R.legs.forEach((hip, i) => { hip.rotation.x = d.job === 'fish' ? -0.5 + Math.sin(t * 1.3 + i * 2) * 0.12 : S.sit ? -1.25 : Math.sin(ph + i * Math.PI) * 0.6 * wk; });
      else R.feet.forEach((f, i) => { const s = i ? 1 : -1; if (S.sit) f.position.set(s * 0.13, -0.56, 0.36); else f.position.set(s * 0.13 * (d.look.w || 1), 0.04 + Math.max(0, Math.sin(ph + i * Math.PI)) * 0.07 * wk, 0.12 + Math.sin(ph + i * Math.PI) * 0.13 * wk); });
      let aL = [-0.5 + sw * 0.5 * walk, 0, 0.2], aR = [-0.5 - sw * 0.5 * walk, 0, -0.2];
      if (hush) { aL = [-0.1, 0, 0.12]; aR = d.prop === 'pole' ? [-0.45, 0, -0.1] : [-0.1, 0, -0.12]; }
      else switch (S.pose) {
        case 'arrange': { const s = Math.sin(t * 3); aL = [-1.15 + s * 0.15, 0, 0.25]; aR = [-1.15 - s * 0.15, 0, -0.25]; break; }
        case 'basket': aL = [-0.35, 0, 0.15]; break;
        case 'oars': aL = [-0.5 + sw * 0.4 * walk, 0, 0.2]; aR = [-2.5, 0, 0.35]; break;
        case 'chat': if (S.chatTalk) aR = [-1.0 + Math.sin(t * 5) * 0.25, 0, -0.35 - Math.sin(t * 2.5) * 0.25]; break;
        case 'run': aL = [-0.4 + sw * 0.9, 0, 0.6]; aR = [-0.4 - sw * 0.9, 0, -0.6]; break;
        case 'hips': aL = [0.1, 0, -0.6]; aR = [0.1, 0, 0.6]; break;
        case 'pole': aL = [0.1, 0, -0.6]; aR = [-0.5 + Math.sin(t * 1.3) * 0.05, 0, -0.1]; break;        // (Bartolo, himself again: a hand on his hip, his pole)
        case 'steer': { const k = Math.sin(t * 2.2); aL = [-1.0 + k * 0.25, 0, 0.35]; aR = [-1.1 - k * 0.25, 0, -0.3]; break; }     // (rowing the ferry over)
        case 'hands': aL = [-0.75, 0, -0.35]; aR = [-0.75, 0, 0.35]; break;
        case 'fish': aL = [-1.1, 0, 0.3]; aR = [-1.05 + Math.sin(t * 0.7) * 0.05, 0, -0.3]; break;
        case 'mend': { const s = Math.sin(t * 4); aL = [-1.3 + s * 0.08, 0, 0.25]; aR = [-1.45 - s * 0.16, Math.sin(t * 8) * 0.2, -0.3]; break; }
        case 'build': { const c = (t * 1.5 + S.seed) % 1, up = c < 0.62 ? c / 0.62 : 1 - (c - 0.62) / 0.38 * 1.15; aL = [-1.2, 0, 0.3]; aR = [-1.0 - 1.5 * clamp(up, -0.1, 1), 0, -0.2]; break; }
        case 'paint': aL = [0.1, 0, -0.6]; aR = [-1.25 + Math.sin(t * 5) * 0.35, 0, -0.25]; break;
        case 'sweep': aL = [-0.95, 0.3, 0.35]; aR = [-0.7 + Math.sin(t * 3) * 0.25, 0, -0.3]; break;
        case 'hang': { const up = (t * 0.15 + S.seed) % 1 < 0.62; aL = up ? [-2.7 + Math.sin(t * 2) * 0.1, 0, 0.3] : [-0.6, 0, 0.2]; aR = up ? [-2.7 - Math.sin(t * 2) * 0.1, 0, -0.3] : [-0.6, 0, -0.2]; break; }
      }
      if (row) { const c = Math.cos(rowPh); aL = [-1.15 - 0.4 * c, 0, 0.35]; aR = [-1.15 - 0.4 * c, 0, -0.35]; }
      if (S.sit && !S.pose && !hush && !row) { aL = [-0.75, 0, 0.3]; aR = [-0.75, 0, -0.3]; }
      if (S.wave > 0 && !hush) { S.wave -= dt; if (!['oars', 'fish', 'build', 'mend', 'paint'].includes(S.pose)) aR = [-0.3, 0, -2.4 + Math.sin(t * 9) * 0.35]; }
      R.arms[0].rotation.set(...aL); R.arms[1].rotation.set(...aR);
      // the head: looks at you when you're close, else idles; the hushed stare at nothing
      let hy, hx = 0;
      if (hush) { hy = S.stare; hx = 0.2; }
      else if (S.lookAt !== undefined) { hy = clamp(angDiff(S.yaw + R.body.rotation.y, S.lookAt), -1.2, 1.2); hx = -0.05; }
      else hy = Math.sin(t * 0.37 + S.seed * 20) * (S.speed > 0.1 ? 0.15 : 0.55);
      if (S.nod) hx += Math.max(0, Math.sin(t * 6)) * 0.12;
      if (['mend', 'build', 'paint', 'fish'].includes(S.pose)) { hx += 0.3; if (S.lookAt === undefined) hy = 0; }
      R.head.rotation.y = damp(R.head.rotation.y, hy, 5, dt); R.head.rotation.x = damp(R.head.rotation.x, hx, 6, dt);
      if (!hush && (S.blink -= dt) < 0) { if (S.blink < -0.12) S.blink = 2 + R0() * 3.5; }
      R.eyes.forEach(e => { e.scale.y = !hush && S.blink < 0 ? 0.12 : 1; });
      R.mouth.scale.y = S.talk > 0.3 ? 0.012 + Math.abs(Math.sin(t * 16)) * 0.035 : 0.012;
      if (!row) R.root.updateMatrixWorld(true);
    }
    const row_ = row;
    function update(dt, t, you) {
      for (const p of people) { if (p._d.job !== 'row') { think(p, dt, t, you); pose(p, dt, t); } }
      // Nando rows his loop: the boat surges with each pull, the oars sweep and dip
      {
        row.ph += dt * 2.3; const pull = Math.max(0, Math.sin(row.ph));
        row.a += dt * (0.035 + 0.07 * pull);
        const x = ROW.x + Math.cos(row.a) * ROW.rx, z = ROW.z + Math.sin(row.a) * ROW.rz, B = row.B;
        B.root.position.set(x, WATER, z); B.root.rotation.y = Math.atan2(-Math.sin(row.a) * ROW.rx, Math.cos(row.a) * ROW.rz);
        B.body.position.y = Math.sin(t * 1.4) * 0.025; B.body.rotation.z = Math.sin(t * 1.1) * 0.03;
        B.oars.forEach((o, i) => { const s = i ? 1 : -1; o.rotation.set(0, -s * 0.55 * Math.cos(row.ph), -s * (0.04 + 0.18 * pull)); });
        nando._S.x = x; nando._S.z = z;
        think(nando, dt, t, you); pose(nando, dt, t);
        B.root.updateMatrixWorld(true);
        if (row.prev < 0.2 && pull >= 0.2) for (const s of [-1, 1]) { V.set(s * 2.1, 0, 0.6).applyMatrix4(B.body.matrixWorld); ripple(V.x, V.z, 0.4, 0.9); splash(V.x, V.z, 2, 1.1, 0.04); }
        row.prev = pull;
        if ((row.wake = (row.wake || 0) - dt) < 0) { row.wake = 0.7; V.set(0, 0, -1.4).applyMatrix4(B.body.matrixWorld); ripple(V.x, V.z, 0.7, 1.4); }
      }
      // boats tied up bob and tug at their ropes
      boats.forEach(B => {
        const i = B.i; B.body.position.y = Math.sin(t * 1.3 + i * 1.7) * 0.03; B.body.rotation.z = Math.sin(t * 1.1 + i) * 0.035; B.body.rotation.x = Math.sin(t * 0.8 + i * 2.3) * 0.02;
        B.root.updateMatrixWorld(true);
        V.set(0, 0.32, 1.42).applyMatrix4(B.body.matrixWorld); W2.set(0, 0.32, -1.42).applyMatrix4(B.body.matrixWorld);
        const e = Math.hypot(V.x - B.post[0], V.z - B.post[1]) < Math.hypot(W2.x - B.post[0], W2.z - B.post[1]) ? V : W2;
        stretch(B.rope, B.post[0], DECK + 0.38, B.post[1], e.x, e.y, e.z, 0.022);
      });
      // the raft (the story moves objects.raft; it just bobs on the spot) and its rope while it's tied up at home
      {
        raft.body.position.y = Math.sin(t * 1.5) * 0.025; raft.body.rotation.z = Math.sin(t * 1.2) * 0.02; raft.body.rotation.x = Math.sin(t * 0.9 + 1) * 0.015;
        raft.root.updateMatrixWorld(true);
        const rp = raft.root.position, home = Math.hypot(rp.x - RAFT.home.x, rp.z - RAFT.home.z) < 0.4 && raft.root.visible;
        if (home) { V.set(1.05, 0.3, -1.0).applyMatrix4(raft.body.matrixWorld); stretch(raftRope, DOCK_E.x1 + 0.25, out.dockTops[0].yw + 0.42, DZ - DOCK_E.w / 2 + 0.2, V.x, V.y, V.z, 0.022); }
        else { raftRope.scale.set(0.0001, 0.0001, 0.0001); raftRope.position.y = -60; raftRope.updateMatrixWorld(true); }
        out.raftDeck.box[0] = rp.x - RAFT.half + 0.05; out.raftDeck.box[1] = rp.x + RAFT.half - 0.05; out.raftDeck.box[2] = rp.z - RAFT.half + 0.05; out.raftDeck.box[3] = rp.z + RAFT.half - 0.05; out.raftDeck.top = rp.y + 0.28;
        if (Math.abs(rp.z - DZ) < 0.3 && Math.abs(rp.x - RAFT.home.x) < 0.3) out.raftDeck.box[1] = DOCK_E.x1 + 0.05;        // (no gap to step over at either dock)
        if (Math.abs(rp.z - DZ) < 0.3 && Math.abs(rp.x - RAFT.away.x) < 0.3) out.raftDeck.box[0] = DOCK_W.x1 - 0.05;
      }
      // the ferry, moored at the end of the pier
      {
        ferry.body.position.y = Math.sin(t * 0.9) * 0.02; ferry.body.rotation.z = Math.sin(t * 0.7) * 0.012;
        ferry.root.updateMatrixWorld(true);
        const fp = ferry.root.position, home = Math.hypot(fp.x - FERRY.x, fp.z - FERRY.z) < 0.4 && ferry.root.visible;
        const isle = !home && Math.hypot(fp.x - FERRY_ISLE.x, fp.z - FERRY_ISLE.z) < 0.4 && ferry.root.visible;     // (moored at the island's jetty)
        ferryRopes.forEach((r, i) => {
          if (!home && !isle) { r.scale.set(0.0001, 0.0001, 0.0001); r.position.y = -60; r.updateMatrixWorld(true); return; }
          V.set((i ? 1 : -1) * (FERRY.wid / 2 - 0.25), FERRY.top - WATER + 0.25, (isle ? -1 : 1) * (FERRY.len / 2 - 0.25)).applyMatrix4(ferry.body.matrixWorld);
          if (isle) stretch(r, JETTY.b[0] - 0.3, DECK + 0.38, JETTY.b[1] + (i ? -0.68 : 0.68), V.x, V.y, V.z, 0.025);
          else stretch(r, FERRY_DOCK.x0 + 0.25, DECK + 0.38, i ? -150.8 : -153.2, V.x, V.y, V.z, 0.025);
        });
        // (the deck as a box round the ferry however it's turned: it swings round on the long ride out to the island, isle.js)
        const L = FERRY.len / 2 - 0.1, Wd = FERRY.wid / 2 - 0.1, cy = Math.abs(Math.cos(ferry.root.rotation.y)), sy = Math.abs(Math.sin(ferry.root.rotation.y)), hx = sy * L + cy * Wd, hz = cy * L + sy * Wd;
        out.ferryDeck.box[0] = fp.x - hx; out.ferryDeck.box[1] = fp.x + hx; out.ferryDeck.box[2] = fp.z - hz; out.ferryDeck.box[3] = fp.z + hz; out.ferryDeck.top = fp.y + FERRY.top - WATER;
        if (home) out.ferryDeck.box[1] = FERRY_DOCK.x0 + 0.2;      // (moored: the gangplank joins it to the dock)
        if (isle) out.ferryDeck.box[0] = JETTY.b[0] - 0.2;         // (…or its stern to the island's jetty)
      }
      // the buoy: barely moving while it's hushed; free, it bobs, sways and rings out over the water
      {
        buoyAmt = buoyTarget > buoyAmt ? Math.min(buoyTarget, buoyAmt + dt * 1.5) : Math.max(buoyTarget, buoyAmt - dt * 0.45);
        if (Math.abs(buoyAmt - lastAmt) > 0.004) { recolorBuoy(buoyAmt); lastAmt = buoyAmt; }
        const free = 1 - buoyAmt, mv = 0.2 + 0.8 * free;
        buoy.body.position.y = Math.sin(t * 1.25) * 0.06 * mv; buoy.body.rotation.x = Math.sin(t * 0.9) * 0.05 * mv; buoy.body.rotation.z = Math.sin(t * 1.1 + 1) * 0.06 * mv;
        bellAmp = Math.max(bellAmp - dt * bellDecay, 0.07 * free); bellSwing += dt * 3.1;
        buoy.pivot.rotation.z = Math.sin(bellSwing) * bellAmp; buoy.pivot.rotation.x = Math.sin(bellSwing * 0.7) * bellAmp * 0.3;
        if (free > 0.5 && (buoyRip -= dt) < 0) { buoyRip = bellAmp > 0.2 ? 0.45 : 1.3; ripple(BUOY.x, BUOY.z, bellAmp > 0.2 ? 1.6 : 1.2, 1.8); }
        buoy.root.updateMatrixWorld(true);
      }
      // ducks paddle round in little circles, dipping their heads
      ducks.forEach((d, i) => {
        d.a += dt * d.w * 0.6 / Math.max(0.6, d.r);
        const x = d.cx + Math.cos(d.a) * d.r, z = d.cz + Math.sin(d.a) * d.r, A = d.A;
        A.root.position.set(x, WATER - 0.02 + Math.sin(t * 2 + i) * 0.012, z); A.root.rotation.y = Math.atan2(-Math.sin(d.a) * Math.sign(d.w), Math.cos(d.a) * Math.sign(d.w));
        A.head.rotation.x = Math.sin(t * 0.5 + i * 2) > 0.92 ? 1.2 : 0;
        if ((d.rip -= dt) < 0) { d.rip = 1.5; ripple(x, z, 0.32, 1.0); }
        A.root.updateMatrixWorld(true);
      });
      // now and then a fish jumps
      if (!jump.on && (fishT -= dt) < 0 && spots.length) { const sp = spots[(R() * spots.length) | 0], a = R() * TAU; Object.assign(jump, { on: true, u: 0, x: sp[0], z: sp[1], dx: Math.cos(a), dz: Math.sin(a) }); ripple(sp[0], sp[1], 0.55, 1.2); splash(sp[0], sp[1], 5, 1.6); }
      if (jump.on) {
        jump.u += dt / 0.8; const u = Math.min(1, jump.u);
        fish.root.position.set(jump.x + jump.dx * u * 1.3, WATER - 0.12 + Math.sin(u * Math.PI) * 0.95, jump.z + jump.dz * u * 1.3);
        fish.root.rotation.set(-0.9 * Math.cos(u * Math.PI), Math.atan2(jump.dx, jump.dz), Math.sin(t * 20) * 0.2, 'YXZ');
        if (jump.u >= 1) { jump.on = false; fishT = 3 + R() * 5; const lx = jump.x + jump.dx * 1.3, lz = jump.z + jump.dz * 1.3; ripple(lx, lz, 0.6, 1.3); splash(lx, lz, 6, 1.8); }
      } else fish.root.position.set(0, -60, 0);
      fish.root.updateMatrixWorld(true);
      // Pepe's line, from his rod's tip to the bobber (which dips now and then)
      {
        bobber.position.y = WATER + 0.04 + Math.sin(t * 2.3) * 0.015 + (Math.sin(t * 0.37) > 0.97 ? -0.06 : 0); bobber.updateMatrixWorld(true);
        const tip = V.set(0, 1.85, 0).applyMatrix4(pepe._R.props.rod.matrixWorld);
        stretch(line, tip.x, tip.y, tip.z, bobber.position.x, bobber.position.y, bobber.position.z, 0.006);
        if (Math.sin(t * 0.37) > 0.97 && !row.bit) { ripple(bob.x, bob.z, 0.3, 0.8); row.bit = true; } else if (Math.sin(t * 0.37) <= 0.97) row.bit = false;
      }
      // ripples spread and sink away; drops arc and fall back
      for (const r of RIP) {
        if (r.life >= r.max) { if (r.n.position.y > -50) { r.n.scale.set(0.0001, 0.0001, 0.0001); r.n.position.y = -60; r.n.updateMatrixWorld(true); } continue; }
        r.life += dt; const u = Math.min(1, r.life / r.max), s = r.s * (0.25 + u * 1.1);
        r.n.position.set(r.x, WATER + 0.015 - u * u * 0.14, r.z); r.n.scale.set(s, Math.max(0.05, 1.4 * (1 - u)), s); r.n.updateMatrixWorld(true);
      }
      for (const d of DROPS) {
        if (d.life >= d.max) { if (d.n.position.y > -50) { d.n.scale.set(0.0001, 0.0001, 0.0001); d.n.position.y = -60; d.n.updateMatrixWorld(true); } continue; }
        d.life += dt; d.vy -= 9 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
        if (d.y < WATER - 0.05) d.life = d.max;
        const s = d.s * (1 - 0.5 * d.life / d.max); d.n.position.set(d.x, d.y, d.z); d.n.scale.set(s, s * 1.2, s); d.n.updateMatrixWorld(true);
      }
      folks.sync();
    }
    return {
      people, update, folks, raft, ferry, buoy, boats, rowBoat: rowB, ducks, fish, jump, laloState,
      ring(sec = 4) { bellAmp = Math.max(bellAmp, 0.6); bellDecay = 0.55 / Math.max(0.5, sec); bellSwing = 0; },
      setBuoy(on) { buoyTarget = on ? 1 : 0; },
      get buoyHushed() { return buoyTarget > 0.5; },
      setLamp(on) { folks.recolor(lampLeaf, on ? '#fff1a8' : '#3d4652'); },
      initBuoy() { recolorBuoy(1); buoyAmt = 1; lastAmt = 1; },
      // milestone 2: Bartolo's lost things, the gear back on his ferry, his colour coming back, and pinning him to the ferry
      items,
      setItem(id, on) { if (items[id]) items[id].visible = !!on; },
      setFerryGear(o = {}) { ferry.oar.visible = !!o.oar; ferry.lamp.visible = !!o.lantern; ferry.coil.visible = !!o.rope; },
      setPersonHush(id, amt) {        // 1: hushed (gray, staring, silent) … 0: themselves again
        const p = byId[id]; if (!p || !p._R.paint.length) return;
        amt = clamp(amt, 0, 1); p._hushAmt = amt;
        const c = new THREE.Color(), gc = new THREE.Color();
        p._R.paint.forEach(([n, col]) => { c.set(col); gc.set(grayOf(col)); folks.recolor(n, '#' + c.lerp(gc, amt).getHexString()); });
        p._R.wake.forEach(([n, s]) => { const on = amt < 0.4; if (n.userData.s0 === undefined) n.userData.s0 = n.scale.toArray(); n.scale.fromArray(on ? s : n.userData.s0); });
        const free = amt < 0.02; p._d.hushed = !free; p.hushed = !free;
      },
      hushOf(id) { const p = byId[id]; return p ? (p._hushAmt !== undefined ? p._hushAmt : p._d.hushed ? 1 : 0) : 0; },
      pinPerson(id, pin) {
        const p = byId[id]; if (!p) return; const S = p._S, d = p._d;
        S.pin = pin || null;
        if (!pin && d.at) { S.x = d.at.x; S.z = d.at.z; S.gy = d.at.y !== undefined ? d.at.y : groundAt(S.x, S.z); }
        else if (pin) { S.x = pin.x; S.z = pin.z; S.gy = pin.y; if (pin.snap) S.yaw = pin.yaw; }
      },
    };
  }
  // ------------------------------------------------------------ build it
  let TEX = null;
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function textures() {
    if (TEX) return TEX;
    const earth = TK.canvasTex(128, 128, (c, W, H) => {
      c.fillStyle = '#e6d3ae'; c.fillRect(0, 0, W, H);
      const R = rng(4);
      for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * H, r = 1.2 + R() * 3; c.fillStyle = R() < 0.5 ? 'rgba(150,120,80,0.35)' : 'rgba(255,250,235,0.45)'; for (const ox of [0, -W, W]) for (const oy of [0, -H, H]) { c.beginPath(); c.ellipse(x + ox, y + oy, r * 1.4, r, R() * 3, 0, TAU); c.fill(); } }
    });
    earth.wrapS = earth.wrapT = THREE.RepeatWrapping; earth.anisotropy = 4;
    const mist = TK.canvasTex(128, 64, (c, W, H) => {        // a soft, lumpy bank of mist (white, all in the alpha)
      const R = rng(9);
      for (let i = 0; i < 9; i++) {
        const x = W * (0.2 + R() * 0.6), y = H * (0.45 + R() * 0.2), r = H * (0.22 + R() * 0.2);
        const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
    });
    return (TEX = { earth, mist });
  }
  function build(scene, env = {}) {
    const ground = env.terrainAt || (() => GY);
    const gy = (x, z) => ground(x, z);
    const root = new THREE.Group(); root.name = 'lake'; scene.add(root);
    const out = { smoke: [], colliders: [], platforms: [], walks: [], dockTops: [], lamps: [], benches: [], gy };
    const k = Kit();
    // (a tally of triangles per stage, for tuning the budget)
    const stages = {}, triCount = () => { let n = 0; for (const b of Object.values(k.B)) for (const p of b) n += ni(p.geo).attributes.position.count / 3 * (p.ink > 0 ? 2 : 1); return n; };
    let lastT = 0; const stage = name => { const n = triCount(); stages[name] = Math.round(n - lastT); lastT = n; };
    drawVillage(k, out, gy); stage('village');
    drawBridge(k, out, gy); stage('bridge');
    drawDocks(k, out, gy); stage('docks');
    drawIsland(k, out, gy); stage('island');
    drawShallows(k, out, gy); stage('shallows');
    drawGround(k, gy); stage('ground');
    // bake the buckets into a handful of meshes
    const tex = textures(), meshes = {};
    const add = (name, geo, mat, o = {}) => { const m = new THREE.Mesh(geo, mat); m.name = 'lake-' + name; m.castShadow = !!o.cast; m.receiveShadow = o.receive !== false; m.matrixAutoUpdate = false; m.updateMatrix(); root.add(m); meshes[name] = m; return m; };
    add('solid', bake(k.B.solid), toonM({ vc: true, rim: 0.15, fade: true }), { cast: true }); add('ink', bake(k.B.solid, { hull: true }), inkM({ fade: true }), { receive: false });
    add('sway', bake(k.B.sway), toonM({ vc: true, rim: 0.22, fade: true, sway: true }), { cast: true }); add('swayInk', bake(k.B.sway, { hull: true }), inkM({ fade: true, sway: true }), { receive: false });
    add('earth', bake(k.B.earth, { uv: 0.25 }), toonM({ vc: true, map: tex.earth, poly: 1 }));
    // walkable: the boardwalks, docks and jetty, the ferry dock, the porches, the bridge's two stubs, and the raft's and ferry's decks
    for (const w of out.walks) {      // (each segment pulled in by half its width, so its round ends stop where the planks do)
      if (w.noPlat) continue;
      const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]), ux = (w.b[0] - w.a[0]) / L, uz = (w.b[1] - w.a[1]) / L, c = Math.min(w.w / 2, L / 2 - 0.01), t = c / L;
      out.platforms.push({ seg: [w.a[0] + ux * c, w.a[1] + uz * c, w.b[0] - ux * c, w.b[1] - uz * c], w: w.w, y: [lerp(w.y[0], w.y[1], t), lerp(w.y[0], w.y[1], 1 - t)] });
    }
    out.platforms.push({ box: [FERRY_DOCK.x0, FERRY_DOCK.x1, FERRY_DOCK.z0, FERRY_DOCK.z1], top: DECK });
    for (const h of HOUSES) if (h.porch) out.platforms.push({ box: [h.porch.x0, h.porch.x1, h.porch.z0, h.porch.z1], top: DECK });
    for (const e of out.bridgeEnds) {      // the ramp up from the road, then the deck out to its last plank (a box, so it stops square at the break)
      const xEnd = e.xIn + (e.s > 0 ? 0.42 : -0.06), hw = (BR.w - 0.3) / 2;
      out.platforms.push({ seg: [e.xRoad, BR.z, e.xOut, BR.z], w: BR.w - 0.3, y: [e.yRoad, BR.top], bridge: true }, { box: [Math.min(e.xOut, xEnd), Math.max(e.xOut, xEnd), BR.z - hw, BR.z + hw], top: BR.top, bridge: true });
    }
    out.raftDeck = { box: [RAFT.home.x - 1.15, RAFT.home.x + 1.15, DZ - 1.15, DZ + 1.15], top: RAFT.top - 0.02, raft: true };
    out.ferryDeck = { box: [FERRY.x - FERRY.len / 2 + 0.1, FERRY.x + FERRY.len / 2 - 0.1, FERRY.z - FERRY.wid / 2 + 0.1, FERRY.z + FERRY.wid / 2 - 0.1], top: FERRY.top, ferry: true };
    out.platforms.push(out.raftDeck, out.ferryDeck);
    // the village's name over the board by the road. zh / ja: its name there (CJK.md: 静水村 / レマンソ) in the mode, repainted
    // when the language or mode changes (signs.js SIGNS.board)
    const paintBoard = (c, W, H, l) => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#4f5f6a'; roundRect(c, 4, 4, W - 8, H - 8, 22); c.fill();
      c.fillStyle = '#eef3f2'; roundRect(c, 15, 15, W - 30, H - 30, 16); c.fill();
      c.strokeStyle = '#2f8f8a'; c.lineWidth = 4; roundRect(c, 27, 27, W - 54, H - 54, 10); c.stroke();
      c.strokeStyle = '#5aa8c8'; c.lineWidth = 5;
      for (const [x0, y0] of [[46, 128], [W - 110, 128]]) { c.beginPath(); for (let i = 0; i <= 64; i++) c.lineTo(x0 + i, y0 + Math.sin(i * 0.2) * 5); c.stroke(); }
      for (const x of [78, W - 78]) {           // a little stilt house at each end
        c.save(); c.translate(x, 92);
        c.fillStyle = '#f2c94c'; c.strokeStyle = '#3a3040'; c.lineWidth = 3; c.fillRect(-16, -16, 32, 24); c.strokeRect(-16, -16, 32, 24);
        c.fillStyle = '#c9a55a'; c.beginPath(); c.moveTo(-22, -14); c.lineTo(0, -36); c.lineTo(22, -14); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#2f8f8a'; c.fillRect(-4, -6, 8, 14);
        c.strokeStyle = '#5b5048'; c.lineWidth = 4; for (const sx of [-12, 12]) { c.beginPath(); c.moveTo(sx, 8); c.lineTo(sx, 30); c.stroke(); }
        c.restore();
      }
      const cj = (l === 'zh' || l === 'ja') && typeof CJK !== 'undefined', name = cj ? CJK.plain(BOARD_NAME[l], { lang: l }) : 'REMANSO';
      let px = 64; c.font = `900 ${px}px "Trebuchet MS", Bahnschrift, "Segoe UI", sans-serif`;
      while (cj && px > 28 && c.measureText(name).width > W - 210) { px -= 2; c.font = `900 ${px}px "Trebuchet MS", Bahnschrift, "Segoe UI", sans-serif`; }
      c.fillStyle = '#2f4f5a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, W / 2, H / 2 - 4);
    };
    const BOARD_NAME = { zh: '[静水村|Jìng shuǐ cūn]', ja: 'レマンソ' };
    const signTex = TK.canvasTex(512, 180, (c, W, H) => paintBoard(c, W, H, 'es'));
    if (typeof SIGNS !== 'undefined' && SIGNS.board) {
      SIGNS.board(l => { const cv = signTex.image; paintBoard(cv.getContext('2d'), cv.width, cv.height, l); signTex.needsUpdate = true; });
      // (zh / ja: E «Read» at the board, for its name in the language)
      SIGNS.add({ id: 'remanso.board', x: out.signAt.at.x, z: out.signAt.at.z, r: 2.4, when: () => (UI.lang === 'zh' || UI.lang === 'ja'),
        card: l => ({ tag: 'The board by the road into Remanso', lines: [{ text: BOARD_NAME[l] || 'Remanso', en: 'Remanso, the village on the lake' }] }) });
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 0.9), new THREE.MeshToonMaterial({ map: signTex, gradientMap: TK.grad }));
    sign.position.copy(out.signAt.at); sign.rotation.y = out.signAt.rot; sign.name = 'lake-sign'; root.add(sign);
    { // the name on the board's back too (a plane has one face: from the village it was blank), turned round, behind the board
      const r = out.signAt.rot, back = sign.clone(); back.rotation.set(0, r + Math.PI, 0); back.name = 'lake-sign-back';      // (set all three: a clone's Euler can come back as (π, …, π))
      back.position.copy(out.signAt.at); back.position.x -= Math.sin(r) * 0.12; back.position.z -= Math.cos(r) * 0.12; root.add(back); }
    // everyone and everything that moves
    const dyn = makeDynamic(root, out, gy);
    dyn.initBuoy();
    // the lighthouse's beam (milestone 2: lit once its lamp shines again): a soft cone of light from the lamp, sweeping slowly
    // round over the lake; a scene can hold it on one bearing (aimBeam)
    const beam = (() => {
      const g = new THREE.Group(), tilt = new THREE.Group(); g.name = 'lake-beam'; g.visible = false;
      if (out.lamp) g.position.copy(out.lamp); root.add(g); g.add(tilt); tilt.rotation.x = 0.1;
      const geo = new THREE.ConeGeometry(2.6, 30, 24, 1, true); geo.translate(0, -15, 0); geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({ color: '#fff1b0', transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const cone = new THREE.Mesh(geo, mat); cone.renderOrder = 3; cone.name = 'lake-beam-cone'; tilt.add(cone);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3b0', transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
      glow.scale.setScalar(3.2); g.add(glow);
      return { g, tilt, mat, glow, yaw: 0, aim: null, on: false, pitch: 0.1 };
    })();
    // chimney smoke: puffs with ink outlines (molinar's)
    const SMOKE_N = 4, smokeSpots = out.smoke.slice(0, 6).map(p => ({ p, seed: (Math.abs(p.x * 0.37 + p.z * 0.11)) % 1 }));
    const puffGeo = new THREE.IcosahedronGeometry(1, 1);
    const smoke = new THREE.InstancedMesh(puffGeo, toonM({ rim: 0.25, color: '#f4f2ee' }), Math.max(1, smokeSpots.length * SMOKE_N));
    const smokeInk = new THREE.InstancedMesh(puffGeo, inkM({ off: 0.06 }), smoke.count); smokeInk.instanceMatrix = smoke.instanceMatrix;
    smoke.frustumCulled = smokeInk.frustumCulled = false; smoke.name = 'lake-smoke'; smokeInk.name = 'lake-smoke-ink'; root.add(smoke, smokeInk);
    // mist: soft banks low over the water, always facing you, fading as you come close (or look down from above)
    const MR = rng(61), mists = [];
    for (let n = 0; n < 400 && mists.length < 15; n++) {
      const x = lerp(-236, -150, MR()), z = lerp(-185, -125, MR());
      if (lakeE(x, z) > 0.86 || mists.some(m => Math.hypot(m.x - x, m.z - z) < 8)) continue;
      mists.push({ x, z, y: WATER + 0.55 + MR() * 0.6, w: 8 + MR() * 6, h: 2.0 + MR() * 1.2, ph: MR() * TAU, sp: 0.1 + MR() * 0.12 });
    }
    for (const z of [-170, -160, -138, -128]) mists.push({ x: RX(z), z, y: WATER + 0.45, w: 6 + MR() * 3, h: 1.6, ph: MR() * TAU, sp: 0.08 });
    // out on the grown lake: mist banks here and there, bigger and higher toward the haze in the west (own seed)
    const MR2 = rng(62);
    for (let n = 0; n < 600 && mists.length < 44; n++) {
      const x = lerp(-466, -222, MR2()), z = lerp(-250, -110, MR2()), far = smoothstep(-300, -460, x);
      if (lakeAll(x, z) > -8 || mists.some(m => Math.hypot(m.x - x, m.z - z) < 14 + far * 10)) continue;
      mists.push({ x, z, y: WATER + 0.6 + MR2() * 0.8 + far * 1.4, w: 9 + MR2() * 7 + far * 22, h: 2.0 + MR2() * 1.4 + far * 2.5, ph: MR2() * TAU, sp: 0.08 + MR2() * 0.1 });
    }
    const mistMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTex: { value: tex.mist }, uOpacity: { value: 0.85 }, uColor: { value: new THREE.Color('#f2f6f7') } }]),
      vertexShader: `#include <fog_pars_vertex>
        varying vec2 vUv; varying float vA;
        void main() {
          vUv = uv;
          vec4 c = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          vec3 wc = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float sx = length(instanceMatrix[0].xyz), sy = length(instanceMatrix[1].xyz);
          vec4 mvPosition = c + vec4(position.x * sx, position.y * sy, 0.0, 0.0);
          float steep = abs(normalize(wc - cameraPosition).y);
          vA = smoothstep(5.0, 16.0, -c.z) * (1.0 - smoothstep(0.45, 0.8, steep));
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: `#include <fog_pars_fragment>
        uniform sampler2D uTex; uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv; varying float vA;
        void main() {
          float a = texture2D(uTex, vUv).a * uOpacity * vA;
          if (a < 0.004) discard;
          gl_FragColor = vec4(uColor, a);
          #include <fog_fragment>
        }`,
    });
    mistMat.uniforms.uTex.value = tex.mist;          // (merge clones uniform values; keep the shared texture)
    const mist = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mistMat, mists.length);
    mist.frustumCulled = false; mist.renderOrder = 2; mist.name = 'lake-mist'; root.add(mist);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
    const placeMist = t => { mists.forEach((m, i) => { M.compose(V.set(m.x + Math.sin(t * 0.02 * m.sp * 10 + m.ph) * 3.5, m.y + Math.sin(t * 0.3 + m.ph) * 0.08, m.z + Math.cos(t * 0.015 + m.ph) * 1.5), Q.identity(), SC.set(m.w, m.h, 1)); mist.setMatrixAt(i, M); }); mist.instanceMatrix.needsUpdate = true; };
    placeMist(0);
    // landmarks, with heights where they matter
    const groundAt = (x, z) => {
      let g = gy(x, z);
      for (const p of out.platforms) {
        let top = null;
        if (p.box) { if (x >= p.box[0] && x <= p.box[1] && z >= p.box[2] && z <= p.box[3]) top = p.top; }
        else { const [ax, az, bx, bz] = p.seg, dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); if (Math.hypot(x - (ax + dx * t), z - (az + dz * t)) < p.w / 2) top = lerp(p.y[0], p.y[1], t); }
        if (top !== null && top > g) g = top;
      }
      return g;
    };
    const landmarks = {};
    for (const [key, p] of Object.entries(LM)) { landmarks[key] = Array.isArray(p) ? p.map(q => ({ ...q })) : { ...p }; if (!Array.isArray(p) && p.x !== undefined && p.y === undefined) landmarks[key].y = +groundAt(p.x, p.z).toFixed(3); }
    Object.assign(landmarks.raftHome, { y: RAFT.top }); Object.assign(landmarks.raftAway, { y: RAFT.top });
    landmarks.buoy.y = WATER; landmarks.bell = { x: BUOY.x, y: WATER + 2.0, z: BUOY.z };
    landmarks.lighthouse.top = +out.lighthouse.top.toFixed(2);
    landmarks.lighthouseDoor = { x: +out.lighthouse.door.x.toFixed(2), z: +out.lighthouse.door.z.toFixed(2), y: +gy(out.lighthouse.door.x, out.lighthouse.door.z).toFixed(3), yaw: Math.PI / 2 };
    landmarks.ferry.y = FERRY.top; landmarks.bridge.y = WATER; landmarks.marinaDoor.y = DECK;
    function update(dt, t, you) {
      U.uTime.value = t;
      if (you) { const y = you.y !== undefined ? you.y : gy(you.x, you.z); U.uFocus.value.set(you.x, y + 1.0, you.z); }
      else U.uFocus.value.set(0, -1e4, 0);
      dyn.update(dt, t, you);
      if (beam.on) {         // the lighthouse's beam sweeps round (or swings to the bearing a scene holds it on)
        beam.yaw = beam.aim !== null ? dampAngle(beam.yaw, beam.aim, 2.2, dt) : beam.yaw + dt * 0.45;
        beam.g.rotation.y = beam.yaw; beam.tilt.rotation.x = damp(beam.tilt.rotation.x, beam.aim !== null ? beam.pitch : 0.1, 2.2, dt); beam.mat.opacity = 0.13 + 0.04 * Math.sin(t * 2.1); beam.glow.material.opacity = 0.75 + 0.15 * Math.sin(t * 3.3);
      }
      let n = 0;
      for (const s of smokeSpots) for (let j = 0; j < SMOKE_N; j++) {
        const u = (t / 3.4 + j / SMOKE_N + s.seed) % 1;
        const sz = (0.24 + u * 0.66) * Math.min(1, u * 5) * (1 - Math.pow(u, 3)) * (0.8 + 0.4 * ((j * 0.618 + s.seed * 3) % 1));
        V.set(s.p.x + u * 1.2 + (j % 2 ? 1 : -1) * 0.2 * u + Math.sin(u * 5 + s.seed * 9) * 0.2, s.p.y + 0.1 + u * 2.4, s.p.z + u * 0.5 + (j % 2 ? -1 : 1) * 0.15 * u);
        M.compose(V, Q.identity(), SC.set(sz, sz * 0.9, sz)); smoke.setMatrixAt(n++, M);
      }
      smoke.instanceMatrix.needsUpdate = true;
      placeMist(t);
    }
    function stats() {
      let tris = 0, calls = 0, casters = 0;
      root.traverse(o => { if (o.isMesh && o.visible) { const g = o.geometry, k2 = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += k2 * (o.isInstancedMesh ? o.count : 1); calls++; if (o.castShadow) casters++; } });
      return { tris: Math.round(tris), meshes: calls, shadowCasters: casters, houses: HOUSES.length, people: dyn.people.length, reeds: out.reeds, pads: out.pads, colliders: out.colliders.length, platforms: out.platforms.length, stages };
    }
    return {
      colliders: out.colliders, platforms: out.platforms, moving: [], update, people: dyn.people, landmarks, group: root, meshes,
      objects: {
        raft: dyn.raft.root, ferry: dyn.ferry.root, buoy: dyn.buoy.root, bell: dyn.buoy.pivot, lighthouse: out.lighthouse,
        raftDeck: out.raftDeck, ferryDeck: out.ferryDeck, lalo: dyn.people.find(p => p.id === 'lalo'), laloState: dyn.laloState,
        boats: dyn.boats.map(b => b.root), rowBoat: dyn.rowBoat.root, ducks: dyn.ducks.map(d => d.A.root), sign, mist, smoke, folks: dyn.folks.list.map(l => l.im),
        items: dyn.items, bartolo: dyn.people.find(p => p.id === 'bartolo'), beam: beam.g,
      },
      pavedAt, bareAt, keepClear, distTo, layout: LAYOUT, riverX: RX, areaAt,
      setBuoyHushed(on) { dyn.setBuoy(on); if (!on) dyn.ring(); },
      get buoyHushed() { return dyn.buoyHushed; },
      ringBuoy(sec) { dyn.ring(sec); },
      setLighthouseLit(on) { dyn.setLamp(on); beam.on = !!on; beam.g.visible = !!on; },
      aimBeam(yaw, pitch) { beam.aim = typeof yaw === 'number' ? yaw : null; beam.pitch = typeof pitch === 'number' ? pitch : 0.1; if (beam.aim !== null && !beam.on) beam.yaw = beam.aim; },
      // milestone 2 (isle.js): Bartolo's things lost around the village (setItem(id, on)), back on his ferry (setFerryGear), his
      // colour coming back (setPersonHush('bartolo', 1 … 0)), and him riding along on the ferry (pinPerson(id, { x, z, y, yaw, steer }))
      setItem: (id, on) => dyn.setItem(id, on), setFerryGear: o => dyn.setFerryGear(o),
      setPersonHush: (id, amt) => dyn.setPersonHush(id, amt), hushOf: id => dyn.hushOf(id), pinPerson: (id, pin) => dyn.pinPerson(id, pin),
      setFade(on) { U.uFade.value = on ? 1 : 0; },
      stats,
      _dev: { out, stages, HOUSES, PIERS, roadDist, lanePos, groundAt, dyn },
    };
  }
  return { build, layout: LAYOUT, landmarks: LM, pavedAt, bareAt, keepClear, distTo, riverX: RX, GY, DECK, WATER, roadDist, areaAt };
})();
