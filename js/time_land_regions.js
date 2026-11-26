'use strict';
// The five regions' lands long ago and tomorrow (TIME.land, time_land.js; DESIGN.md 21.1, each adapted to its world's story: TIME.md
// §22). Each region is a block of its own: where things go (kept clear of its streets, paths, people, cracks and doors: TIME.land.check
// says so), what grows, the water, the Looks and who talks about the land. The words and the people's lines are TLTXT's.
(() => {
  if (typeof TIME === 'undefined' || !TIME.land || typeof WORLD === 'undefined') return;
  const LAND = TIME.land, TL = LAND._, tA = (x, z) => WORLD.terrainAt(x, z);
  const LN = k => (typeof TLTXT !== 'undefined' && TLTXT.LINES[k]) || [];
  const G = () => TIME._.G;
  const ss = (a, b, x) => smoothstep(a, b, x);
  const local = (b, x, z) => { const c = Math.cos(b.rot || 0), s = Math.sin(b.rot || 0); return [(x - b.x) * c - (z - b.z) * s, (x - b.x) * s + (z - b.z) * c]; };
  const inRect = (b, x, z, kx = 1, kz = kx, pad = 0) => { const [lx, lz] = local(b, x, z); return Math.abs(lx) < b.hw * kx + pad && Math.abs(lz) < b.hd * kz + pad; };
  const near = (list, x, z, d) => list.some(p => Math.hypot(p.x - x, p.z - z) < (p.r !== undefined ? Math.max(d, p.r) : d));
  const cellK = (x, z) => { const Lm = WORLD.L; return clamp(Math.round(z - Lm.minZ), 0, WORLD.GH - 1) * WORLD.GW + clamp(Math.round(x - Lm.minX), 0, WORLD.GW - 1); };
  const grassAt = (x, z) => WORLD.MAP[cellK(x, z) * 4 + 1];        // (today's: nothing has changed it yet when this file runs)
  const pathAt = (x, z) => WORLD.MAP[cellK(x, z) * 4 + 3];
  const treesIn = B => WORLD.trees.filter(t => t.x > B.x0 - 4 && t.x < B.x1 + 4 && t.z > B.z0 - 4 && t.z < B.z1 + 4);
  // a form fits where everything its raised part covers passes ok(x, z)
  function fits(F, ok) {
    const P = TL.prep(Object.assign({}, F));
    for (let x = P.bx0; x <= P.bx1; x += 0.7) for (let z = P.bz0; z <= P.bz1; z += 0.7) { const y = TL.topOf(P, x, z); if (y !== null && y > tA(x, z) + 0.05 && !ok(x, z)) return false; }
    return true;
  }
  const overlaps = (list, F, k = 0.9) => list.some(o => Math.hypot(o.x - F.x, o.z - F.z) < (Math.max(o.rx, o.rz) + Math.max(F.rx, F.rz)) * k);

  // ======================================================== Molinar (DESIGN.md 18.9)
  // Long ago (the preterite, I and you; the Great Mill being built, the market twice the size): the woods came up to the town walls.
  // There's no creek near Molinar, so no river (the table's first idea): instead oak and chestnut groves on the Windmill Hills round
  // five smaller wheat fields, each inside a hedge, lush tall grass, and more oaks just outside the gates.
  // Tomorrow (the simple future; the sails stopped, «sembraremos», «cosecha»): a dust bowl. Cracked ochre earth, the wheat gone, short
  // dead straw, the windbreak round the town dead and gray, dust drifts banked against the outer houses (you walk over them),
  // tumbleweeds through the pass. Freed (molFree): the field by the west gate sown again, green shoots in its furrows, saplings.
  (() => {
    const ML = typeof MOLINAR !== 'undefined' ? MOLINAR : null, R = TIME.REGIONS.molinar;
    if (!ML || !ML.layout || !R) return;
    const LY = ML.layout, C = LY.center, BOX = { x0: 88, x1: 272, z0: -214, z1: -92 };
    const reach = (x, z) => R.inside(x, z);
    const GATES = [{ x: 173, z: -150 }, { x: 254.6, z: -147.2 }, { x: 215.6, z: -190.8 }, { x: 213.8, z: -111.6 }];
    const LOOK = { wn: { x: 172.0, z: -144.6 }, ws: { x: 171.6, z: -157.6 }, n: { x: 215.0, z: -188.6 }, e: { x: 252.4, z: -149.6 }, e2: { x: 253.6, z: -154.4 }, s: { x: 213.0, z: -114.4 } };
    // what must keep its ground here (the check adds the cracks, spots and people itself; this is for placing things)
    const KEEP = [...Object.values(TIME.CRACKS).filter(c => c.region === 'molinar').map(c => ({ x: c.x, z: c.z, r: 3.2 })), ...Object.values(LOOK).map(p => ({ x: p.x, z: p.z, r: 2.4 })),
      ...GATES.map(g => ({ x: g.x, z: g.z, r: 5.5 })), { x: 240, z: -167.3, r: 4 }, { x: C.x, z: C.z, r: 17 }];
    const AT = [[241.4, -162.2], [244.6, -160.6], [229.8, -160.4], [236.6, -160.9], [245.4, -166.8], [224.0, -156.4], [207.6, -136.6], [205.2, -137.6],
      [236.4, -161.0], [248.6, -169.0], [219.6, -159.6], [205.9, -144.8], [206.2, -134.8], [226.6, -144.0], [177.6, -146.2]].map(([x, z]) => ({ x, z, r: 2.6 }));
    KEEP.push(...AT);
    const inBuilding = (x, z, pad = 0.6) => LY.buildings.some(b => b.w && inRect({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot }, x, z, 1, 1, pad));
    const soft = (x, z) => grassAt(x, z) > 0.22 && pathAt(x, z) < 0.25 && ML.pavedAt(x, z) < 0.02 && !inBuilding(x, z) && !near(KEEP, x, z, 0);
    const old = treesIn(BOX), Rg = rng(9071);
    const free = (list, x, z, d) => !near(old, x, z, d) && !near(list, x, z, d);
    const gateGap = (x, z) => GATES.some(g => Math.hypot(x - g.x, z - g.z) < 8);
    const roadGap = (x, z) => WORLD.pathDist(x, z) < 5 || (typeof GARDENS !== 'undefined' && GARDENS.roadDist && GARDENS.roadDist(x, z) < 5) || Math.hypot(x - 150, z + 150) < 9;

    // ---------------------------------------------------- long ago: groves, oaks at the walls, smaller fields inside hedges
    const pastTrees = [];
    for (let n = 0; n < 6000 && pastTrees.length < 84; n++) {         // the Windmill Hills: groves between the fields, clumped
      const x = lerp(94, 168, Rg()), z = lerp(-202, -102, Rg());
      if (ML.keepClear(x, z, 1.2) || roadGap(x, z) || !free(pastTrees, x, z, 3.5)) continue;
      if (Math.sin(x * 0.11 + 1.7) * Math.cos(z * 0.09 - 0.6) < -0.15 && Rg() < 0.8) continue;
      pastTrees.push({ x, z, kind: Rg() < 0.58 ? 'oak' : 'chestnut', s: 0.9 + Rg() * 0.45, seed: Rg() });
    }
    for (let n = 0; n < 6000 && pastTrees.length < 150; n++) {        // round the town, just outside where you can walk
      const a = Rg() * TAU, r = 46.5 + Rg() * 11, x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r;
      if (reach(x, z) || Math.hypot(x - 214, z + 151) < 46.5 || ML.keepClear(x, z, 0.5) || roadGap(x, z) || gateGap(x, z) || !free(pastTrees, x, z, 3.3)) continue;
      pastTrees.push({ x, z, kind: Rg() < 0.7 ? 'oak' : 'chestnut', s: 1.0 + Rg() * 0.4, seed: Rg() });
    }
    // the old oak by the north gate (its roots, Ciro's master says), oaks by the east gate, young chestnuts down the lane south
    pastTrees.push({ x: 221.0, z: -193.4, kind: 'oak', s: 1.25, seed: 0.31 }, { x: 260.2, z: -143.6, kind: 'oak', s: 1.1, seed: 0.62 }, { x: 261.0, z: -153.4, kind: 'oak', s: 1.15, seed: 0.12 },
      { x: 208.6, z: -104.8, kind: 'chestnut', s: 0.85, seed: 0.44 }, { x: 219.0, z: -103.4, kind: 'chestnut', s: 0.8, seed: 0.71 }, { x: 207.6, z: -97.4, kind: 'chestnut', s: 0.9, seed: 0.2 }, { x: 219.8, z: -96.8, kind: 'chestnut', s: 0.85, seed: 0.9 });
    // the fields were smaller: a hedge round the part that was wheat, the rest meadow
    const SHRINK = [0.58, 0.62];
    const kept = (f, x, z) => inRect(f, x, z, SHRINK[0], SHRINK[1]);
    const freedAt = (x, z) => { for (const f of LY.fields) if (inRect(f, x, z, 1, 1, 0.35) && !kept(f, x, z)) return 1; return 0; };
    const hedges = [];
    for (const f of LY.fields) {
      const hw = f.hw * SHRINK[0] + 0.7, hd = f.hd * SHRINK[1] + 0.7, c = Math.cos(f.rot || 0), s = Math.sin(f.rot || 0), W = (lx, lz) => [f.x + lx * c + lz * s, f.z - lx * s + lz * c];
      for (const [ax, az, bx, bz] of [[-hw, -hd, hw, -hd], [hw, -hd, hw, hd], [hw, hd, -hw, hd], [-hw, hd, -hw, -hd]]) {
        const L1 = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L1 / 1.9));
        for (let i = 0; i < n; i++) {
          if (i === Math.floor(n / 2) && az === -hd && bz === -hd) continue;          // (a gap for the gate)
          const t = (i + 0.5) / n, [x, z] = W(lerp(ax, bx, t), lerp(az, bz, t)), [x2, z2] = W(bx, bz), [x1, z1] = W(ax, az);
          hedges.push({ x, z, kind: 'hedge', s: 1.0, yaw: Math.atan2(-(z2 - z1), x2 - x1), seed: (i * 0.37) % 1 });
        }
      }
    }
    // a woodpile with an axe in the chopping block, by the west gate
    const woodpile = { x: 170.2, z: -159.0, r: 0.9, build(k, KG, y) {
      const x = this.x, z = this.z;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) k.add(KG.cyl, x + (j - (2 - i) / 2) * 0.38, y + 0.19 + i * 0.32, z, 0.18, 1.15, 0.18, (i + j) % 2 ? '#8a6a4a' : '#7a5a3e', { rx: Math.PI / 2, ink: 0.01 });
      k.add(KG.cyl, x + 1.1, y + 0.23, z + 0.5, 0.32, 0.46, 0.32, '#7a6046', { ink: 0.012 }).add(KG.cyl, x + 1.1, y + 0.47, z + 0.5, 0.3, 0.02, 0.3, '#d6b888', { ink: 0 });
      k.rod([x + 1.08, y + 0.5, z + 0.5], [x + 1.32, y + 1.25, z + 0.68], 0.035, '#9a7a52', 0.006).box(x + 1.08, y + 0.55, z + 0.48, 0.34, 0.18, 0.04, '#8a8e96', { ry: 0.6, ink: 0.006 });
    } };
    LAND('molinar', 'past', {
      box: BOX, arena: 'forest',
      ground: [
        { col: '#3b8236', map: '#8cc86a', amt: (x, z, q) => q.g * 0.5 },                    // (deeper, lusher green)
        { col: '#4f9440', map: '#a6d474', amt: (x, z) => freedAt(x, z) * 0.97, mapAmt: (x, z) => freedAt(x, z) },     // (meadow where today's wheat grows)
      ],
      grass: { amt: (x, z, q) => Math.max(q.g, freedAt(x, z) * 0.85), tip: '#8ccc60', base: '#2f6c2c', h: 1.28, k: 0.7 },
      trees: { add: pastTrees.concat(hedges) },
      leaves: [{ obj: () => G().molinar && G().molinar.objects.hills, from: ['#b8973e'], to: '#5a9a46', area: (x, z) => freedAt(x, z) > 0 }],      // (the stubble under the wheat that wasn't there yet: meadow)
      trim: [{ obj: () => G().molinar && G().molinar.objects.wheat, keep: (x, z) => !LY.fields.some(f => inRect(f, x, z, 1, 1, 0.3)) || LY.fields.some(f => kept(f, x, z)) }],
      props: [woodpile],
      looks: [
        { id: 'w.tf_ml_oak', at: LOOK.wn, line: 'Past the gate, the hills are dark with {w.tf_ml_oak:pl}: a {w.tf_ml_grove} on every slope, and small fields in between.' },
        { id: 'w.tf_ml_axe', at: LOOK.ws, line: 'An {w.tf_ml_axe} stuck in the chopping block, and a stack of {w.ml_firewood}. The {w.tf_ml_woodcutter} can’t be far.' },
        { id: 'w.tf_ml_squirrel', at: LOOK.n, line: 'A {w.tf_ml_squirrel} runs along a {w.tf_ml_branch} of the old {w.tf_ml_oak}. In the mud under it, the tracks of a {w.tf_ml_boar}.' },
        { id: 'w.tf_ml_acorn', at: LOOK.e, line: '{w.tf_ml_acorn:pl} crunch under your feet. Somewhere up in the oaks, a {w.tf_ml_woodpecker} knocks.' },
        { id: 'w.tf_ml_chestnut', at: LOOK.s, line: 'Young {w.tf_ml_chestnut:pl} along the lane out of town, in flower.' },
      ],
      lines: [{ who: 'past:fina', T: LN('molinar.past.fina')[0] }, { who: 'past:fina', T: LN('molinar.past.fina')[1] }, { who: 'past:master', T: LN('molinar.past.master')[0] }],
    });

    // ---------------------------------------------------- tomorrow: the dust bowl
    const drifts = [];
    const ok = (x, z) => !reach(x, z) || soft(x, z);
    for (let a = 0; a < TAU; a += 0.21) {          // drifts banked against the town's outer houses, their steep side toward the town
      const r = 34 + 7 * (0.5 + 0.5 * Math.sin(a * 3.1)), x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r, ux = (C.x - x) / r, uz = (C.z - z) / r;
      const F = { kind: 'drift', x, z, rx: 2.5 + Rg() * 0.9, rz: 3.2 + Rg() * 1.8, h: 0.75 + Rg() * 0.55, rot: Math.atan2(-uz, ux), col: '#cbb68c', col2: '#b9a47c', foot: '#b8a27c' };
      if (gateGap(x, z) || overlaps(drifts, F, 0.8) || !fits(F, ok)) continue;
      drifts.push(F);
    }
    for (let n = 0; n < 900 && drifts.length < 60; n++) {          // and bigger dust dunes over the hills' fields and slopes (scenery)
      const x = lerp(98, 166, Rg()), z = lerp(-198, -104, Rg());
      const F = { kind: 'dune', x, z, rx: 4 + Rg() * 3.5, rz: 2.6 + Rg() * 2, h: 1.0 + Rg() * 1.3, rot: -0.35 + Rg() * 0.3, col: '#cdb890', col2: '#b9a37a', foot: '#b8a27c' };
      if (roadGap(x, z) || ML.keepClear(x, z, -0.8) && !LY.fields.some(f => inRect(f, x, z, 1.2, 1.2)) || overlaps(drifts, F, 1.0)) continue;
      drifts.push(F);
    }
    const cracks = LY.fields.map(f => ({ kind: 'cracks', x: f.x, z: f.z, rx: f.hw + 0.3, rz: f.hd + 0.3, rot: f.rot || 0, box: true }));
    for (let n = 0; n < 400 && cracks.length < 22; n++) {
      const a = Rg() * TAU, r = 44 + Rg() * 16, x = C.x + Math.cos(a) * r, z = C.z + Math.sin(a) * r;
      if (reach(x, z) || roadGap(x, z) || near(cracks, x, z, 8)) continue;
      cracks.push({ kind: 'cracks', x, z, rx: 4 + Rg() * 3, rz: 3 + Rg() * 2, rot: Rg() * 3 });
    }
    // the field by the west gate (east2) is the one sown again once Molinar's tomorrow is freed
    const SOWN = LY.fields.find(f => f.id === 'east2') || LY.fields[LY.fields.length - 1];
    const sprouts = [];
    { const c = Math.cos(SOWN.rot || 0), s = Math.sin(SOWN.rot || 0); for (let lx = -SOWN.hw + 0.6; lx < SOWN.hw - 0.4; lx += 0.8) for (let lz = -SOWN.hd + 0.5; lz < SOWN.hd - 0.3; lz += 0.95) sprouts.push({ x: SOWN.x + lx * c + lz * s, z: SOWN.z - lx * s + lz * c, kind: 'sprout', s: 0.9 + ((lx * 7 + lz * 3) % 1 + 1) % 1 * 0.4 }); }
    const hoe = { x: 253.6, z: -155.4, r: 0.5, build(k, KG, y) {
      const x = this.x, z = this.z;
      k.add(KG.sphere, x, y - 0.05, z, 0.9, 0.35, 0.7, '#c9b48a', { ink: 0.008 });
      k.rod([x + 0.1, y + 0.1, z], [x - 0.25, y + 1.35, z + 0.2], 0.035, '#8a6a48', 0.006).box(x + 0.12, y + 0.12, z - 0.02, 0.32, 0.04, 0.2, '#7d8088', { rx: 0.2, ink: 0.006 });
      for (let i = 0; i < 3; i++) { const bx = x + 0.45 + i * 0.16, bz = z + 0.35 - i * 0.1; k.rod([bx, y + 0.12, bz], [bx + 0.1, y + 0.72, bz + 0.05], 0.012, '#c9b27a', 0).add(KG.ball6, bx + 0.11, y + 0.82, bz + 0.05, 0.05, 0.13, 0.05, '#d6bf86', { ink: 0.004 }); }
    } };
    const tumbleStuck = { x: 256.6, z: -151.2, r: 0.45, build(k, KG, y) { k.add(KG.sphere, this.x, y + 0.42, this.z, 0.46, 0.42, 0.46, '#a8885a', { ink: 0.012 }).add(KG.ball6, this.x + 0.1, y + 0.5, this.z - 0.08, 0.36, 0.32, 0.36, '#8a6e48', { ink: 0 }); } };
    LAND('molinar', 'future', {
      box: BOX, arena: 'dust',
      ground: [
        { col: '#b8a27c', map: '#e9d8ac', amt: (x, z, q) => (1 - q.p) * 0.94 },                                          // (dust over everything but the roads: the streets are paved on top)
        { col: '#9e8a66', map: '#d4c095', amt: (x, z, q) => (1 - q.p) * 0.3 * ss(0.55, 0.95, Math.sin(x * 0.19 + Math.sin(z * 0.07) * 2) * Math.cos(z * 0.23)) },
        { col: '#a5875e', map: '#c9ad80', amt: () => 0, mapAmt: (x, z) => ML.fieldAt(x, z) },        // (on the map: the fields bare and cracked, no wheat)
      ],
      grass: { amt: (x, z, q) => q.g * 0.3, tip: '#d9c68c', base: '#9b8558', h: 0.55, k: 1 },
      trees: { swap: t => (t.kind === 'pine' ? 'snag' : 'dead') },
      leaves: [
        { obj: () => G().molinar && G().molinar.objects.hills, from: ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653', '#55a346', '#4b973f', '#62b04c', '#3f7f45', '#4a8a4e', '#6aa84a', '#7cb85a', '#8aa060', '#96aa6a', '#7f9858', '#9fb274', '#86a05c', '#469240'], to: '#8f8461' },
        { obj: () => G().molinar && G().molinar.objects.hills, from: ['#b8973e'], to: '#a88a62' },
        { obj: () => G().molinar && G().molinar.objects.hills, from: ['#e0503f', '#ff6b5a', '#d9304a', '#ff8fb1', '#ffd84a'], to: '#a8987a' },       // (the bushes' flowers, dried)
      ],
      hide: [() => G().molinar && G().molinar.objects.wheat],
      forms: drifts, decals: cracks,
      tumble: { n: 6, box: { x0: 112, x1: 168, z0: -168, z1: -132 } },
      props: [hoe, tumbleStuck],
      looks: [
        { id: 'w.tf_ml_drought', at: LOOK.wn, when: s => !TIME.flag('future', 'molFree'), line: 'Past the gate, the fields have cracked open. A {w.tf_ml_drought}: no {w.tf_ml_rain} for a long, long time.' },
        { id: 'w.tf_ml_furrow', at: LOOK.ws, line: 'Old {w.tf_ml_furrow:pl} with nothing in them, {w.tf_ml_clod:pl} of dry earth, a little {w.tf_ml_stubble}.' },
        { id: 'w.tf_ml_windbreak', at: LOOK.n, line: 'The {w.tf_ml_windbreak} is dead: gray trunks, not one leaf. The wind blows straight through.' },
        { id: 'w.tf_ml_tumbleweed', at: LOOK.e, line: 'A {w.tf_ml_tumbleweed} caught on the gate post. More roll out over the dust.' },
        { id: 'w.tf_ml_hoe', at: LOOK.e2, line: 'A {w.tf_ml_hoe} left standing in the dust, and a few dry {w.tf_ml_ear:pl} of wheat.' },
        { id: 'w.tf_ml_stump', at: LOOK.s, line: 'A row of {w.tf_ml_stump:pl} down the lane, where the chestnut trees stood.' },
      ],
      lines: [{ who: 'future:trigo', T: LN('molinar.future.trigo')[0] }, { who: 'future:trigo', T: LN('molinar.future.trigo')[1] },
        { who: 'future:felix', T: LN('molinar.future.felix')[0], when: () => { const F = TIME.state('molinar', 'future'); return !!(F.woke && F.woke.felix); } }],
      heal: {
        when: () => !!TIME.flag('future', 'molFree'),
        patch: { x: SOWN.x + 1, z: SOWN.z - 1, r: 11 },
        leaves: [
          { obj: () => G().molinar && G().molinar.objects.hills, from: ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653', '#55a346', '#4b973f', '#62b04c', '#3f7f45', '#4a8a4e', '#6aa84a', '#7cb85a', '#8aa060', '#96aa6a', '#7f9858', '#9fb274', '#86a05c', '#469240'], to: '#8f8461' },
          { obj: () => G().molinar && G().molinar.objects.hills, from: ['#b8973e'], to: '#a88a62', area: (x, z) => !inRect(SOWN, x, z, 1, 1, 0.6) },
          { obj: () => G().molinar && G().molinar.objects.hills, from: ['#b8973e'], to: '#7d5d3c', area: (x, z) => inRect(SOWN, x, z, 1, 1, 0.6) },      // (the sown field: dark, turned earth)
          { obj: () => G().molinar && G().molinar.objects.hills, from: ['#e0503f', '#ff6b5a', '#d9304a', '#ff8fb1', '#ffd84a'], to: '#a8987a' },
        ],
        ground: [{ col: '#6a7a3c', map: '#9fbf6a', heal: true, amt: (x, z) => (inRect(SOWN, x, z, 1, 1, 0.4) ? 0.9 : 0), mapAmt: (x, z) => (inRect(SOWN, x, z, 1, 1, 0.4) ? 1 : 0) }],
        decals: [{ kind: 'furrows', x: SOWN.x, z: SOWN.z, rx: SOWN.hw, rz: SOWN.hd, rot: SOWN.rot || 0, box: true }],
        trees: { add: sprouts.concat([{ x: 167.6, z: -141.2, kind: 'sapling', s: 1 }, { x: 166.2, z: -134.6, kind: 'sapling', s: 0.9 }, { x: 168.4, z: -128.6, kind: 'sapling', s: 1.1 }]) },
        looks: [{ id: 'w.gd_sprout', at: LOOK.wn, line: 'Green {w.gd_sprout:pl} in the {w.tf_ml_furrow:pl} past the gate! Someone sowed the field again, and the {w.tf_ml_rain} came.' }],
      },
    });
  })();

  // ======================================================== the Bloom Gardens (DESIGN.md 18.13)
  // Long ago (the imperfect for descriptions; the summer after the concert, the greenhouse brand new): wilder and lusher at the edges,
  // tall grass, poppies and clover, willows and ferns, and the brook that's dry today (world.js's creek, buried under the valley floor
  // by gardens.js) runs again round the south and east rim, with reeds, lily pads and a footbridge behind the greenhouse.
  // Tomorrow (the conditional; the fields wilted, the bees gone, thorns over the door): a thorny desert. Sand over every bit of soft
  // ground, no grass, tall dunes round the rim and up the greenhouse's walls (over the hedge on the ridge too), cacti, thorny scrub,
  // dead trees, the brook's bed dry and cracked. Freed (gdFree): an oasis in the old bed by the hives, a pool, palms, reeds, green.
  (() => {
    const GA = typeof GARDENS !== 'undefined' ? GARDENS : null, R = TIME.REGIONS.gardens;
    if (!GA || !GA.valE || !R) return;
    const V = GA.VALLEY, BOX = { x0: 150, x1: 250, z0: -118, z1: -38 }, GR = GA.GREAT, Rg = rng(4417);
    const reach = (x, z) => R.inside(x, z);
    const LOOK = { se: { x: 222.4, z: -60.6 }, w: { x: 166.0, z: -72.0 }, sw: { x: 171.0, z: -60.0 }, n: { x: 194.5, z: -90.0 }, e: { x: 230.5, z: -72.5 }, gh: { x: 206.6, z: -61.0 }, oasis: { x: 224.2, z: -63.2 } };
    // what must keep its ground: the people of both worlds, the Looks there, the green, the show, the hives, the cracks, the door
    const PEOPLE = [[201.8, -80.6], [216.4, -72.8], [213.0, -61.2], [186.4, -66.4], [202.2, -63.4], [184.4, -76.8], [187.4, -60.2],
      [201.0, -64.2], [213.4, -73.6], [217.2, -72.8], [205.5, -57.0], [187.8, -72.2], [213.2, -61.0], [186.0, -66.0]].map(([x, z]) => ({ x, z, r: 2.4 }));
    const SPOTS = [[195.2, -63.4], [205.0, -62.8], [190.2, -70.0], [211.0, -67.6], [204.8, -66.0], [181.4, -65.6], [180.2, -59.6], [209.0, -78.6], [193.4, -81.6], [187.6, -79.0], [213.0, -83.2],
      [215.6, -56.4], [191.0, -71.2], [198.0, -79.4], [206.4, -82.0], [213.0, -68.8], [185.2, -57.4], [205.2, -65.8], [187.2, -77.6], [185.6, -62.9], [191.0, -78.2], [183.4, -70.6],
      [185.7, -76.8], [186.0, -61.6], [205.4, -67.0], [211.0, -64.4]].map(([x, z]) => ({ x, z, r: 2.0 }));
    const KEEP = PEOPLE.concat(SPOTS, Object.values(LOOK).map(p => ({ x: p.x, z: p.z, r: 2.2 })), Object.values(TIME.CRACKS).filter(c => c.region === 'gardens').map(c => ({ x: c.x, z: c.z, r: 3.2 })),
      [{ x: GA.DOOR.x, z: GA.DOOR.z, r: 3 }, { x: GA.GREEN.x, z: GA.GREEN.z, r: GA.GREEN.r + 2 }, { x: 219.6, z: -68.9, r: 9 }]);
    const inB = (x, z, pad) => GA.BUILDINGS.some(b => GA.inObb({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot }, x, z, pad));
    const inF = (x, z, pad) => GA.FIELDS.some(f => GA.inObb(f, x, z, pad));
    const soft = (x, z) => grassAt(x, z) > 0.2 && GA.pathDist(x, z) > 1.0 && GA.roadDist(x, z) > 3.5 && !inB(x, z, 0.8) && !inF(x, z, 0.8) && !near(KEEP, x, z, 0);
    const roadGap = (x, z) => GA.roadDist(x, z) < 7 || Math.hypot(x - GA.GATE.x, z - GA.GATE.z) < 9;
    // the brook: in from the west hills, round the south rim behind the greenhouse, up the east side past the hives, out east
    const BROOK = [[156, -61], [166, -56.5], [177, -52.5], [188, -50.2], [198, -48.8], [208, -49.4], [218, -52.4], [226.5, -58.6], [233, -65.5], [240, -71.5], [248, -76]];
    const brookLine = TL.splineOf(BROOK), brookD = (x, z) => TL.lineDist(brookLine, x, z);
    const onBrook = (t) => { const i = Math.min(brookLine.length - 2, Math.floor(t * (brookLine.length - 1))), f = t * (brookLine.length - 1) - i, [ax, az] = brookLine[i], [bx, bz] = brookLine[i + 1], l = Math.hypot(bx - ax, bz - az) || 1; return { x: lerp(ax, bx, f), z: lerp(az, bz, f), nx: -(bz - az) / l, nz: (bx - ax) / l }; };

    // ---------------------------------------------------- long ago: lusher and wilder, the brook running
    const pastAdd = [];
    for (let t = 0.02; t < 0.98; t += 0.024) {          // reeds along both banks, lily pads where it's slow, willows every so often
      const p = onBrook(t), s = (Math.floor(t * 100) % 2) ? 1 : -1;
      pastAdd.push({ x: p.x + p.nx * 1.55 * s, z: p.z + p.nz * 1.55 * s, kind: 'reedGreen', s: 0.9 + Rg() * 0.3 });
      if (Rg() < 0.32) pastAdd.push({ x: p.x + p.nx * (Rg() - 0.5) * 0.7, z: p.z + p.nz * (Rg() - 0.5) * 0.7, kind: 'lily', s: 0.8 + Rg() * 0.3, y: Math.max(tA(p.x, p.z), tA(p.x + p.nx, p.z + p.nz), tA(p.x - p.nx, p.z - p.nz)) + 0.06 });
      if (Rg() < 0.16) { const o = (2.8 + Rg() * 1.5) * -s, x = p.x + p.nx * o, z = p.z + p.nz * o; if (!reach(x, z) && !near(pastAdd.filter(a => a.kind === 'willow'), x, z, 6)) pastAdd.push({ x, z, kind: 'willow', s: 0.95 + Rg() * 0.3 }); }
      if (Rg() < 0.25) { const o = (2.4 + Rg()) * s, x = p.x + p.nx * o, z = p.z + p.nz * o; if (!reach(x, z)) pastAdd.push({ x, z, kind: 'flowers', s: 0.9 }); }
    }
    for (let n = 0; n < 3000 && pastAdd.filter(a => a.kind === 'flowers').length < 110; n++) {      // wildflowers: the floor's soft edges and the rim
      const a = Rg() * TAU, e = 0.82 + Rg() * 0.55, x = V.x + Math.cos(a) * V.rx * e, z = V.z + Math.sin(a) * V.rz * e;
      if (!inBoxXZ(BOX, x, z) || roadGap(x, z) || brookD(x, z) < 2.2) continue;
      if (reach(x, z) && !soft(x, z)) continue;
      pastAdd.push({ x, z, kind: 'flowers', s: 0.9 + Rg() * 0.4, col: Rg() < 0.45 ? '#ff6a5a' : undefined });
    }
    for (let n = 0; n < 2000 && pastAdd.filter(a => a.kind === 'fruit' || a.kind === 'chestnut').length < 22; n++) {     // fruit trees and chestnuts up the rim
      const a = Rg() * TAU, e = 1.18 + Rg() * 0.4, x = V.x + Math.cos(a) * V.rx * e, z = V.z + Math.sin(a) * V.rz * e;
      if (!inBoxXZ(BOX, x, z) || reach(x, z) || roadGap(x, z) || brookD(x, z) < 3.5 || near(pastAdd.filter(q => q.kind !== 'flowers' && q.kind !== 'reedGreen' && q.kind !== 'lily'), x, z, 4.2)) continue;
      pastAdd.push({ x, z, kind: Rg() < 0.6 ? 'fruit' : 'chestnut', s: 0.9 + Rg() * 0.35 });
    }
    const footbridge = { x: 198.4, z: -48.8, build(k, KG, y) {
      const x = this.x, z = this.z, top = Math.max(tA(x, z - 2), tA(x, z + 2)) + 0.4;
      for (let i = -4; i <= 4; i++) k.box(x + i * 0.32, top, z, 0.28, 0.07, 4.6, i % 2 ? '#9a7048' : '#8a6040', { ink: 0.006 });
      for (const s of [-1, 1]) { k.box(x + s * 1.45, top + 0.55, z, 0.08, 0.08, 4.6, '#7a5a3a', { ink: 0.006 }); for (const dz of [-2.1, 0, 2.1]) k.box(x + s * 1.45, top + 0.28, z + dz, 0.09, 0.62, 0.09, '#7a5a3a', { ink: 0.006 }); }
    } };
    LAND('gardens', 'past', {
      box: BOX,
      ground: [{ col: '#3e8a3a', map: '#8fce6c', amt: (x, z, q) => q.g * 0.45 }],
      grass: { amt: (x, z, q) => q.g, tip: '#9ad466', base: '#2e6e2c', h: 1.38, k: 0.75 },
      water: { streams: [{ pts: BROOK, w: 2.3 }] },
      trees: { add: pastAdd },
      props: [footbridge],
      looks: [
        { id: 'w.tf_gd_brook', at: LOOK.se, line: 'A {w.tf_gd_brook} runs round the edge of the garden, under the {w.tf_gd_willow:pl}. Today there’s only grass here.' },
        { id: 'w.tf_gd_dragonfly', at: LOOK.sw, line: 'Blue {w.tf_gd_dragonfly:pl} over the water, and a {w.tf_gd_grasshopper} jumping in the tall grass.' },
        { id: 'w.tf_gd_poppy', at: LOOK.w, line: 'Red {w.tf_gd_poppy:pl} and white {w.tf_gd_clover} all over the slope. A {w.tf_gd_bumblebee} drifts from one to the next.' },
        { id: 'w.tf_gd_meadow', at: LOOK.n, line: 'Past the path, the {w.tf_gd_meadow} runs wild up to the hedge. Nobody mows it.' },
        { id: 'w.tf_gd_steppingstone', at: LOOK.e, line: 'A {w.tf_gd_steppingstone} or two across the brook, for the beekeepers. The {w.tf_gd_current} is slow and cool.' },
      ],
      lines: [{ who: 'past:keeper', T: LN('gardens.past.keeper')[0] }, { who: 'past:painter', T: LN('gardens.past.painter')[0] }, { who: 'past:painter', T: LN('gardens.past.painter')[1] }],
    });

    // ---------------------------------------------------- tomorrow: the thorny desert
    const forms = [];
    // the greenhouse banked in sand: up its east wall (you can climb it), round the back and the west corner (past the edge)
    forms.push({ id: 'gd.gh.east', kind: 'drift', x: GR.x + GR.w / 2 + 4.4, z: GR.z, rx: 5.0, rz: 4.3, h: 3.1, rot: Math.PI, col: '#e6cd93', col2: '#d6b97c', foot: '#d9c28e' });
    forms.push({ id: 'gd.gh.back', kind: 'drift', x: GR.x, z: GR.z + GR.d / 2 + 4.0, rx: 4.6, rz: 11, h: 5.2, rot: Math.PI / 2, col: '#e6cd93', col2: '#d6b97c', foot: '#d9c28e', walk: false });
    forms.push({ id: 'gd.gh.west', kind: 'dune', x: 186.0, z: -50.4, rx: 6.5, rz: 3.8, h: 3.4, rot: 0.25, col: '#e3c98f', col2: '#d4b57a', foot: '#d9c28e', walk: false });
    // dunes all round the rim, tall enough to show over the hedge from the green; the wind is from the west
    for (let n = 0; n < 2400 && forms.length < 34; n++) {
      const a = Rg() * TAU, e = 1.16 + Rg() * 0.55, x = V.x + Math.cos(a) * V.rx * e, z = V.z + Math.sin(a) * V.rz * e;
      const F = { id: 'gd.rim' + n, kind: 'dune', x, z, rx: 5 + Rg() * 4.5, rz: 3 + Rg() * 2.2, h: 2.6 + Rg() * 2.6, rot: -0.3 + Rg() * 0.6, col: '#e3c98f', col2: '#d4b57a', foot: '#d9c28e', walk: false };
      if (!inBoxXZ(BOX, x, z) || roadGap(x, z) || overlaps(forms, F, 0.72)) continue;
      if (fits(F, (px, pz) => !reach(px, pz) && !roadGap(px, pz))) forms.push(F);
    }
    // and low ones you can walk over, on the floor's soft edges
    const ok = (x, z) => !reach(x, z) || soft(x, z);
    for (let n = 0; n < 2600 && forms.filter(F => F.walk !== false).length < 12; n++) {
      const a = Rg() * TAU, e = 0.8 + Rg() * 0.22, x = V.x + Math.cos(a) * V.rx * e, z = V.z + Math.sin(a) * V.rz * e;
      const F = { id: 'gd.low' + n, kind: 'dune', x, z, rx: 2.4 + Rg() * 1.4, rz: 1.8 + Rg() * 0.9, h: 0.9 + Rg() * 0.7, rot: -0.3 + Rg() * 0.6, col: '#e6cd93', col2: '#d6b97c', foot: '#d9c28e' };
      if (overlaps(forms, F, 0.9) || !fits(F, ok)) continue;
      forms.push(F);
    }
    // cacti and thorny scrub: up the rim, and a few on the floor's edges; world.js's trees round the valley die
    const futAdd = [];
    for (let n = 0; n < 3000 && futAdd.length < 70; n++) {
      const a = Rg() * TAU, e = 0.86 + Rg() * 0.7, x = V.x + Math.cos(a) * V.rx * e, z = V.z + Math.sin(a) * V.rz * e;
      if (!inBoxXZ(BOX, x, z) || roadGap(x, z) || near(futAdd, x, z, 3.2)) continue;
      if (reach(x, z) && (!soft(x, z) || near(KEEP, x, z, 1.2))) continue;
      if (forms.some(F => TL.topOf(TL.prep(Object.assign({}, F)), x, z) !== null)) continue;
      futAdd.push({ x, z, kind: Rg() < 0.45 ? 'cactus' : 'thorn', s: 0.8 + Rg() * 0.5 });
    }
    // the brook's bed, dry and cracked, with its pebbles and a few dead reeds
    const bed = [], pebbles = [];
    for (let i = 0; i < brookLine.length - 1; i += 2) {
      const [ax, az] = brookLine[i], [bx, bz] = brookLine[Math.min(brookLine.length - 1, i + 2)], l = Math.hypot(bx - ax, bz - az);
      bed.push({ kind: 'cracks', x: (ax + bx) / 2, z: (az + bz) / 2, rx: l / 2 + 0.6, rz: 1.25, rot: Math.atan2(-(bz - az), bx - ax), box: true });
    }
    for (let t = 0.03; t < 0.97; t += 0.05) { const p = onBrook(t); pebbles.push({ x: p.x + p.nx * (Rg() - 0.5) * 1.2, z: p.z + p.nz * (Rg() - 0.5) * 1.2, kind: Rg() < 0.7 ? 'pebbles' : 'reed', s: 0.9 + Rg() * 0.3 }); }
    const OASIS = { x: 227.2, z: -59.8 };
    const DRY = ['#4f9a45', '#5fae4f', '#478c3e'];
    LAND('gardens', 'future', {
      box: BOX, arena: 'dunes',
      ground: [
        { col: '#dcc591', map: '#f3e4b8', amt: (x, z, q) => (1 - q.p) * 0.96 },
        { col: '#cdb07a', map: '#e6d29e', amt: (x, z, q) => (1 - q.p) * 0.35 * ss(0.5, 0.95, Math.sin(x * 0.23 + Math.sin(z * 0.11) * 2.2) * Math.cos(z * 0.19 - x * 0.05)) },
      ],
      grass: { amt: (x, z, q) => q.g * 0.06, tip: '#cdb57a', base: '#9c8452', h: 0.5, k: 1 },
      trees: { swap: t => (t.seed < 0.22 ? 'cactus' : t.seed < 0.38 ? 'thorn' : t.kind === 'pine' ? 'snag' : 'dead'), add: futAdd.concat(pebbles) },
      leaves: [{ obj: () => G().gardens && G().gardens.group, from: DRY, to: '#8a7d5e' }, { obj: () => G().gardens && G().gardens.group, from: ['#f29a3a', '#f2c94c'], to: '#8f7048' }],
      forms, decals: bed,
      looks: [
        { id: 'w.tf_gd_dune', at: LOOK.gh, line: 'A {w.tf_gd_dune} piled up the greenhouse wall, almost to the windows. The sand is hot.' },
        { id: 'w.tf_gd_riverbed', at: LOOK.se, when: () => !TIME.flag('future', 'gdFree'), line: 'The old {w.tf_gd_riverbed}: dry, cracked, full of stones. A {w.tf_gd_lizard} sleeps on one.' },
        { id: 'w.tf_gd_cactus', at: LOOK.sw, line: 'A {w.tf_gd_cactus} where the roses grew, and thorny {w.tf_gd_scrub} all round it. Watch out for the {w.tf_gd_scorpion}.' },
        { id: 'w.tf_gd_desert', at: LOOK.w, line: 'From here to the hills it’s all {w.tf_gd_desert}. The wind lifts the sand into a small {w.tf_gd_sandstorm}.' },
        { id: 'w.tf_gd_mirage', at: LOOK.n, line: 'Over the dunes the air shakes in the heat: a {w.tf_gd_mirage}, a lake that isn’t there.' },
        { id: 'w.tf_gd_thirst', at: LOOK.e, line: 'Your mouth is dry. {w.tf_gd_thirst}. Someone left a {w.tf_gd_canteen} on the post, empty.' },
      ],
      props: [{ x: 231.4, z: -73.6, r: 0.25, build(k, KG, y) { const x = this.x, z = this.z; k.add(KG.cyl, x, y + 0.6, z, 0.08, 1.2, 0.08, '#8a6a48', { ink: 0.008 }).add(KG.sphere, x + 0.14, y + 1.0, z, 0.14, 0.2, 0.1, '#7d8a6a', { ink: 0.008 }).add(KG.cyl, x + 0.14, y + 1.22, z, 0.05, 0.06, 0.05, '#5a5a5a', { ink: 0.004 }); } }],
      lines: [{ who: 'future:flora', T: LN('gardens.future.flora')[0] }, { who: 'future:flora', T: LN('gardens.future.flora')[1] },
        { who: 'future:melisa', T: LN('gardens.future.melisa')[0], when: () => { const F = TIME.state('gardens', 'future'); return !!(F.woke && F.woke.melisa); } }],
      heal: {
        when: () => !!TIME.flag('future', 'gdFree'),
        patch: { x: OASIS.x - 0.5, z: OASIS.z - 1.0, r: 9 },
        drop: forms.filter(F => Math.hypot(F.x - OASIS.x, F.z - OASIS.z) < Math.max(F.rx, F.rz) + 6).map(F => F.id || ''),
        ground: [{ col: '#4f9a45', map: '#a6d474', heal: true, amt: (x, z) => 1 - ss(5.5, 9, Math.hypot(x - OASIS.x, z - OASIS.z)), mapAmt: (x, z) => 1 - ss(5.5, 9, Math.hypot(x - OASIS.x, z - OASIS.z)) }],
        water: { pools: [{ x: OASIS.x, z: OASIS.z, r: 2.7 }] },
        trees: { add: [{ x: OASIS.x + 3.6, z: OASIS.z + 1.8, kind: 'palm', s: 1.15 }, { x: OASIS.x - 3.4, z: OASIS.z + 2.8, kind: 'palm', s: 1.0 }, { x: OASIS.x + 1.2, z: OASIS.z - 4.2, kind: 'palm', s: 0.9 },
          ...Array.from({ length: 14 }, (_, i) => { const a = i / 14 * TAU + 0.2; return { x: OASIS.x + Math.cos(a) * 3.2, z: OASIS.z + Math.sin(a) * 3.2, kind: i % 3 ? 'reedGreen' : 'flowers', s: 0.9 }; })] },
        looks: [{ id: 'w.tf_gd_oasis', at: LOOK.oasis, line: 'An {w.tf_gd_oasis}! Water in the old bed, green all round it, and the {w.gd_palm:pl} Flora wished for.' }],
      },
    });
  })();

  // ======================================================== the Mirror Lake (DESIGN.md 18.11)
  // Long ago (irregular preterites; the winter after the concert, the lake already low with its sandbar and island: time_lake.js):
  // that winter's hard frost. White rime on the ground and short frosted grass, the round trees and birches bare, pines green, gold
  // dry reeds, thin walkable ice plates along the shallows, two swans on the water, icicles, winter berries.
  // Tomorrow (irregular futures; gray and still): the table's «a salt flat you can walk across» would strand lk.warn's ferry, Lucho's
  // paper boat and the party, so the lake is shrinking instead: the water drops 1.2, a walkable band of white salt crust round the
  // east bay, the piers standing on dry posts, dry reeds, a rowboat capsized on the crust, a marker post of old water lines;
  // the ferry channel keeps water (the painted ferry and the paper boat float down with it). Freed (lkFree): the water comes back
  // up, the rowboat floats, and the south beach has a green reed bed again.
  (() => {
    const R = TIME.REGIONS.lake; if (!R) return;
    const BOX = { x0: -292, x1: -116, z0: -196, z1: -100 }, W0 = WORLD.L.water;
    const reach = (x, z) => R.inside(x, z);
    // time_lake.js's sandbar, island and drained bay (its own constants: the Past's platforms are parked while it's off)
    const ISL = { x: -203, z: -137, r: 5.4 }, BAR = { a: [-184.4, -150.2], b: [-198.8, -140.2] }, MUD = { x0: -216, x1: -186, z0: -149, z1: -127 };
    const barD = (x, z) => { const [ax, az] = BAR.a, [bx, bz] = BAR.b, dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(x - ax - dx * t, z - az - dz * t); };
    const LOOK = { freeze: { x: -158.0, z: -177.6 }, ice: { x: -162.0, z: -175.4 }, swan: { x: -166.4, z: -137.2 }, birch: { x: -149.6, z: -131.0 }, icicle: { x: -153.0, z: -134.2 }, berry: { x: -151.2, z: -175.1 },
      post: { x: -162.2, z: -145.4 }, boat: { x: -164.4, z: -171.4 }, pile: { x: -163.2, z: -156.0 }, silt: { x: -166.0, z: -134.0 } };
    const KEEP = [[-188.8, -149.6], [-185.6, -154.6], [-159.0, -145.6], [-172.0, -151.0], [-160.6, -166.0], [-155.8, -161.0], [-160.6, -148.6], [-158.8, -158.2], [-152.0, -160.0],
      [-162.8, -164.4], [-163.2, -168.4], [-161.8, -171.2], [-163.8, -152.2], [-159.8, -135.6], [-190.4, -147.4], [-186.4, -152.6], [-189.4, -150.2], [-182.0, -157.75], [-175.3, -151.0], [-169.6, -151.3],
      [-158.9, -145.8], [-155.6, -164.6], [-193.9, -152.0], [-155.4, -154.0], [-157.0, -143.3], [-168.5, -151.0]].map(([x, z]) => ({ x, z, r: 3 }))
      .concat(Object.values(LOOK).map(p => ({ x: p.x, z: p.z, r: 2.4 })), Object.values(TIME.CRACKS).filter(c => c.region === 'lake').map(c => ({ x: c.x, z: c.z, r: 3.2 })));
    const deck = (x, z) => WORLD.groundAt(x, z) > tA(x, z) + 0.15;          // (lake.js's piers, docks and porches: kept clear)
    const Rg = rng(7130);
    // ---------------------------------------------------- long ago: the frost
    const PW = W0 - 0.55;                      // (that winter's water line: time_lake.js lowers the sheet this much)
    // shelf ice along the shallows: plates whose inner edge meets the winter shoreline (found going west from the village side)
    const ice = [];
    for (let z = -186; z <= -124; z += 3.4) {
      if (Math.abs(z + 150.9) < 4 || Math.abs(z + 145) < 2) continue;                  // (the main pier; the beach where the sandbar starts)
      let xs = null; for (let x = -150; x > -200; x -= 0.25) if (tA(x, z) < PW) { xs = x; break; }
      if (xs === null) continue;
      const x = xs - 1.6 - Rg() * 0.6, F = { kind: 'plate', y: PW + 0.03, x, z: z + (Rg() - 0.5), rx: 2.4 + Rg() * 1.2, rz: 1.5 + Rg() * 0.5, rot: Math.PI / 2 + (Rg() - 0.5) * 0.3, col: '#e4f0f6', col2: '#cfe2ee', foot: '#bcd6e6' };
      if (!reach(x, z) || barD(x, z) < 5 || Math.hypot(x - ISL.x, z - ISL.z) < ISL.r + 5) continue;
      if (!fits(F, (px, pz) => !deck(px, pz) && Math.abs(pz + 150.9) > 2.5 && barD(px, pz) > 3 && !near(KEEP, px, pz, 0))) continue;
      ice.push(F);
    }
    const birches = [{ x: -150.2, z: -127.8, kind: 'bareBirch', s: 1.0 }, { x: -153.2, z: -126.2, kind: 'bareBirch', s: 0.9 }, { x: -147.4, z: -125.8, kind: 'bareBirch', s: 1.1 }];
    const swans = { x: -171.2, z: -137.6, build(k, KG) {
      for (const [dx, dz, ry] of [[0, 0, 0.6], [-1.3, 1.6, 2.2]]) { const x = this.x + dx, z = this.z + dz, y = PW + 0.02, c = Math.cos(ry), s = Math.sin(ry);
        k.add(KG.sphere, x, y + 0.18, z, 0.32, 0.2, 0.5, '#f8f8f4', { ry, ink: 0.008 }).rod([x + s * 0.32, y + 0.2, z + c * 0.32], [x + s * 0.38, y + 0.72, z + c * 0.38], 0.05, '#f8f8f4', 0.004)
          .add(KG.ball6, x + s * 0.42, y + 0.76, z + c * 0.42, 0.08, 0.07, 0.1, '#f8f8f4', { ink: 0.004 }).add(KG.cone, x + s * 0.53, y + 0.74, z + c * 0.53, 0.03, 0.1, 0.03, '#e8823a', { rx: Math.PI / 2, ry, ink: 0 }); }
    } };
    const barrel = { x: -154.4, z: -133.0, r: 0.45, build(k, KG, y) {
      const x = this.x, z = this.z;
      k.add(KG.cyl, x, y + 0.45, z, 0.36, 0.9, 0.36, '#7a5a3e', { ink: 0.01 }).add(KG.cyl, x, y + 0.91, z, 0.33, 0.02, 0.33, '#dcecf4', { ink: 0 });
      k.rod([x + 0.36, y + 0.3, z], [x + 0.5, y + 0.3, z], 0.04, '#6a6a72', 0.004);
      for (let i = 0; i < 3; i++) k.add(KG.cone, x + 0.5, y + 0.12 - i * 0.02, z + (i - 1) * 0.05, 0.025, 0.24 + i * 0.06, 0.025, '#e4f2fa', { rx: Math.PI, ink: 0 });
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; k.add(KG.cone, x + Math.cos(a) * 0.36, y + 0.78, z + Math.sin(a) * 0.36, 0.02, 0.2, 0.02, '#e4f2fa', { rx: Math.PI, ink: 0 }); }
    } };
    const berryBush = { x: -151.4, z: -176.8, r: 0.6, build(k, KG, y) {
      const x = this.x, z = this.z;
      for (let i = 0; i < 9; i++) { const a = i * 0.7; k.rod([x, y, z], [x + Math.cos(a) * 0.6, y + 0.7 + (i % 3) * 0.15, z + Math.sin(a) * 0.6], 0.03, '#6a4a34', 0.003); }
      for (let i = 0; i < 14; i++) { const a = i * 2.3; k.add(KG.ball6, x + Math.cos(a) * (0.3 + (i % 3) * 0.12), y + 0.5 + (i % 4) * 0.12, z + Math.sin(a) * (0.3 + (i % 3) * 0.12), 0.06, 0.06, 0.06, '#d9303a', { ink: 0.003 }); }
    } };
    const LK_LEAF = ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653', '#55a346', '#469240'], LK_WILLOW = ['#8fb85a', '#9cc463', '#86b052'], LK_REED = ['#7f9a4a', '#94a85a'], LK_PAD = ['#4f9a50', '#63ab5a', '#4f9a45', '#5fae4f'];
    const lakeG = () => G().lake && G().lake.group;
    LAND('lake', 'past', {
      box: BOX,
      ground: [
        { col: '#e2e9e8', map: '#f2f6f6', amt: (x, z, q) => q.g * (0.72 + 0.2 * Math.sin(x * 0.31 + Math.cos(z * 0.27) * 2)) },
        { col: '#e8ecea', map: '#f4f6f4', amt: (x, z, q) => (q.g < 0.3 && q.p < 0.3 && q.h > PW + 0.05 && q.h < 0.6 ? 0.45 : 0), mapAmt: () => 0 },        // (rime on the winter shore's sand too)
      ],
      grass: { amt: (x, z, q) => q.g * 0.7, tip: '#f2f6f6', base: '#6a7d62', h: 0.55, k: 0.9 },
      trees: { swap: t => (t.kind === 'pine' ? undefined : t.kind === 'birch' ? 'bareBirch' : 'bare'), add: birches },
      leaves: [{ obj: lakeG, from: LK_LEAF, to: '#a57a4c' }, { obj: lakeG, from: LK_WILLOW, to: '#a89a5c' }, { obj: lakeG, from: LK_REED, to: '#c9a95c' }, { obj: lakeG, from: LK_PAD, to: '#7a7650' }],
      forms: ice, props: [swans, barrel, berryBush],
      looks: [
        { id: 'w.tf_lk_freeze', at: LOOK.freeze, line: 'Everything is white with the {w.tf_lk_freeze}. Your {w.tf_lk_breath} hangs in the air.' },
        { id: 'w.tf_lk_thinice', at: LOOK.ice, line: '{w.tf_lk_thinice} along the shore, and a {w.tf_lk_floe} drifting further out. Too thin to {w.tf_lk_skate} on.' },
        { id: 'w.tf_lk_swan', at: LOOK.swan, line: 'Two {w.tf_lk_swan:pl} on the cold water, perfectly still.' },
        { id: 'w.tf_lk_birch', at: LOOK.birch, line: 'Three {w.tf_lk_birch:pl}, white and bare. Not one leaf, only {w.tf_lk_twig:pl}.' },
        { id: 'w.tf_lk_crystal', at: LOOK.icicle, line: 'The water in the barrel froze in the night: {w.tf_lk_crystal:pl} like little stars, and ice hanging from the tap.' },
        { id: 'w.tf_lk_berry', at: LOOK.berry, line: 'Red {w.tf_lk_berry:pl} on a bare bush, and a {w.tf_lk_robin} eating them. The only color on the shore.' },
      ],
      lines: [{ who: 'past:mender', T: LN('lake.past.mender')[0] }, { who: 'past:pepe', T: LN('lake.past.pepe')[0] }],
    });

    // ---------------------------------------------------- tomorrow: the lake shrinking
    const DY = -1.2, FL = W0 + DY;
    const bedArea = (x, z) => !(x > MUD.x0 && x < MUD.x1 && z > MUD.z0 && z < MUD.z1) && Math.hypot(x - ISL.x, z - ISL.z) > ISL.r + 0.5;
    const dry = () => !TIME.flag('future', 'lkFree');
    const turtle = (k, KG, ax, az, ty) => {
      k.add(KG.half, ax, ty, az, 0.32, 0.2, 0.4, '#6a7a4a', { ink: 0.008 }).add(KG.ball6, ax + 0.05, ty + 0.06, az + 0.46, 0.09, 0.08, 0.11, '#8a9a5a', { ink: 0.004 });
      for (const [lx, lz] of [[-0.24, 0.24], [0.24, 0.24], [-0.24, -0.24], [0.24, -0.24]]) k.add(KG.ball6, ax + lx, ty + 0.03, az + lz, 0.07, 0.04, 0.07, '#8a9a5a', { ink: 0 });
    };
    const rot = (x, z, ry) => { const c = Math.cos(ry), s = Math.sin(ry); return (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c]; };
    // the rowboat: capsized on the crust, keel up, a turtle asleep in its shade (gone with its collider once the water's back)
    const boat = { x: -167.0, z: -170.6, get r() { return dry() ? 1.3 : 0; }, build(k, KG, y) {
      if (!dry()) return;
      const x = this.x, z = this.z, ry = 0.5, by = Math.max(y, FL) - 0.02, [ax, az] = rot(x, z, ry)(1.1, 0.6);
      k.add(KG.half, x, by, z, 0.85, 0.5, 2.2, '#6f5a48', { ry, ink: 0.012 }).box(x, by + 0.47, z, 0.08, 0.08, 2.6, '#5a4636', { ry, ink: 0.006 });
      turtle(k, KG, ax, az, Math.max(tA(ax, az), FL) + 0.02);
    } };
    // freed: the same boat afloat out past the reeds, a floor and three seats in it, the turtle swimming beside it
    const boatWet = { x: -171.2, z: -167.6, build(k, KG) {
      const x = this.x, z = this.z, ry = 0.35, by = W0 + 0.26, at = rot(x, z, ry), [ax, az] = at(1.3, 0.9);
      k.add(KG.half, x, by, z, 0.85, 0.6, 2.2, '#6f5a48', { rx: Math.PI, ry, ink: 0.012 }).add(KG.cyl, x, by - 0.12, z, 0.8, 0.02, 2.0, '#9a7e60', { ry, ink: 0 });
      for (const lz of [-0.9, 0, 0.9]) { const [px, pz] = at(0, lz); k.box(px, by - 0.04, pz, 1.5, 0.05, 0.18, '#8a7058', { ry, ink: 0.006 }); }
      turtle(k, KG, ax, az, W0 - 0.1);
    } };
    const marker = { x: -164.6, z: -145.8, r: 0.3, build(k, KG, y) {
      const x = this.x, z = this.z;
      k.add(KG.cyl, x, Math.max(y, FL) + 1.2, z, 0.09, 2.8, 0.09, '#8a7a64', { ink: 0.006 });
      for (let i = 0; i < 6; i++) k.box(x + 0.1, W0 + 0.2 - i * 0.28, z, 0.03, 0.03, 0.2, i < 2 ? '#3a5a8a' : '#c9443a', { ink: 0 });
    } };
    LAND('lake', 'future', {
      box: BOX,
      ground: [{ col: '#a8a27a', map: '#d6d0a6', amt: (x, z, q) => q.g * 0.45 }],
      grass: { amt: (x, z, q) => q.g * 0.55, tip: '#b9b48a', base: '#6d6a4c', h: 0.75, k: 0.8 },
      trees: { swap: t => (t.seed < 0.3 ? (t.kind === 'pine' ? 'snag' : 'dead') : undefined) },
      leaves: [{ obj: lakeG, from: LK_REED, to: '#b3a57c' }, { obj: lakeG, from: LK_PAD, to: '#8a8466' }, { obj: lakeG, from: LK_WILLOW, to: '#9a9a6a' }],
      water: {
        sheet: { dy: DY, float: [{ name: 'lake-fut-ferry-sound', mode: 'set' }, { name: 'lake-fut-ferry-rust', mode: 'set' }, { name: 'lake-fut-paperboat', mode: 'add', when: () => !!TIME.state('lake', 'future').boat }] },
        bed: { level: FL, area: bedArea, tex: 'salt', map: '#f4f1e6' },
      },
      props: [boat, marker],
      looks: [
        { id: 'w.tf_lk_saltcrust', at: LOOK.ice, when: dry, line: 'A white {w.tf_lk_saltcrust} where the water used to be. It crunches like snow.' },
        { id: 'w.tf_lk_mark', at: LOOK.post, when: dry, line: 'A post with a painted {w.tf_lk_mark} for every year. The {w.tf_lk_waterlevel} is far below the last one.' },
        { id: 'w.tf_lk_aground', at: LOOK.boat, when: dry, line: 'A rowboat lying {w.tf_lk_aground} on the crust, its {w.tf_lk_keel} in the air. A {w.tf_lk_turtle} sleeps in its shade.' },
        { id: 'w.tf_lk_pile', at: LOOK.pile, when: dry, line: 'The pier stands on dry legs now: every {w.tf_lk_pile} has a dark ring where the water was.' },
        { id: 'w.tf_lk_silt', at: LOOK.silt, when: dry, line: 'Each year the water seems to {w.tf_lk_recede} a little more, and leave gray {w.tf_lk_silt} behind.' },
        { id: 'w.tf_lk_evaporate', at: LOOK.berry, when: dry, line: 'In summer the shallows {w.tf_lk_evaporate}, and the old reed bed will {w.tf_lk_dryup} for good.' },
      ],
      lines: [{ who: 'future:lalo', T: LN('lake.future.lalo')[0] }, { who: 'future:bartolo', T: LN('lake.future.bartolo')[0], when: () => { const F = TIME.state('lake', 'future'); return !!(F.woke && F.woke.bartolo); } }],
      heal: {
        when: () => !!TIME.flag('future', 'lkFree'),
        water: { sheet: null, bed: null },
        patch: { x: -162.4, z: -172.4, r: 9 },
        ground: [{ col: '#5a9a48', map: '#a6d474', heal: true, amt: (x, z) => 1 - ss(5.5, 9, Math.hypot(x + 162.4, z + 172.4)) }],
        trees: { add: Array.from({ length: 16 }, (_, i) => { const z = -178 + i * 0.75, x = -165.6 - (z + 178) * 0.32 + Math.sin(i * 1.7) * 0.4; return { x, z, kind: 'reedGreen', s: 1.0 + (i % 3) * 0.12 }; }).concat([{ x: -160.4, z: -169.4, kind: 'flowers', s: 1 }, { x: -159.2, z: -174.0, kind: 'flowers', s: 0.9 }]) },
        props: [boatWet],
        looks: [{ id: 'w.tf_lk_cane', at: LOOK.ice, line: 'A green {w.tf_lk_cane} on the bank again, and the water lapping at it. The lake came back.' },
          { id: 'w.tf_lk_waterlevel', at: LOOK.post, line: 'The {w.tf_lk_waterlevel} is back up to the top {w.tf_lk_mark} on the post.' },
          { id: 'w.tf_lk_turtle', at: LOOK.boat, line: 'The rowboat floats again, and a {w.tf_lk_turtle} swims beside it.' }],
      },
    });
  })();

  // ======================================================== the Quarry Caves (DESIGN.md 18.10)
  // Long ago (the imperfect for habits; the mine in its best years): a pine forest on the slopes round the camp, right down to its
  // edge, turf between the trees; fresh stumps and a log pile (the pines go into the mine's beams); a mountain stream down the
  // north-east slope into a wooden flume that fills the trough by the forge; pale spoil heaps in the north-west corner, under the face.
  // Tomorrow (the future of guessing; the camp abandoned): the pines dead, the slopes bare and eroded, gray scree fans slid down into
  // the camp's edges, boulders, the flume a ruin, thistles and nettles on the gravel, scrap by the rails. Freed (qrFree): the spring
  // comes back where the stream used to fall, a pool with moss and flowers round it, and the old trough fills again. Fights keep
  // the cave arena.
  (() => {
    const CV = typeof CAVES !== 'undefined' ? CAVES : null, R = TIME.REGIONS.quarry;
    if (!CV || !CV.bowlE || !R) return;
    const CP = CV.CAMP, BOX = { x0: 44, x1: 132, z0: -298, z1: -236 }, Rg = rng(6203);
    const reach = (x, z) => R.inside(x, z), bowlE = (x, z) => CV.bowlE(x, z);
    // (the cut face, a band behind the camp: bare rock in every world; the plateau above it is ground again)
    const faceK = (x, z) => ss(-278.4, -281.4, z) * (1 - ss(-284.5, -287.5, z)) * (1 - ss(17, 25, Math.abs(x - CP.x)));
    const LOOK = { pw: { x: 67.8, z: -261.2 }, rs: { x: 70.4, z: -258.8 }, fl: { x: 105.0, z: -274.2 }, lg: { x: 72.0, z: -272.4 }, sp: { x: 76.0, z: -274.2 },
      sc: { x: 68.6, z: -262.6 }, er: { x: 109.6, z: -262.2 }, th: { x: 82.4, z: -259.6 }, scr: { x: 93.6, z: -268.0 } };
    // what must keep its ground: the people of all three worlds, their things, the lamps, the crystals, the fire, the mouth, the cracks
    const peopleOf = w => { const D = R.dress && R.dress[w]; return ((D && D.people) || []).filter(p => p.at).map(p => ({ x: p.at.x, z: p.at.z, r: 2.0 })); };
    const PEOPLE = peopleOf('past').concat(peopleOf('future'), CV.MINERS.concat([CV.CHEPE]).map(m => ({ x: m.x, z: m.z, r: 2.0 })));
    const THINGS = [[99.4, -273.6], [100.8, -275.4], [86.4, -266.4], [87.7, -263.6], [73.6, -269.6], [76.8, -260.2], [73.9, -262.5], [96.2, -253.4], [92.4, -275.4], [99.7, -256.1],
      [76.4, -265.6], [99.5, -257.7], [103.46, -269.0], [89.6, -276.4], [100.78, -254.7]].map(([x, z]) => ({ x, z, r: 1.6 }));
    const KEEP = PEOPLE.concat(THINGS, Object.values(CV.SPOT).map(p => ({ x: p.x, z: p.z, r: 1.6 })), CV.LAMPS.map(([x, z]) => ({ x, z, r: 1.1 })), CV.CRYSTALS.map(([x, z]) => ({ x, z, r: 1.0 })),
      Object.values(LOOK).map(p => ({ x: p.x, z: p.z, r: 2.2 })), Object.values(TIME.CRACKS).filter(c => c.region === 'quarry').map(c => ({ x: c.x, z: c.z, r: 3.2 })),
      [{ x: CV.PIT.x, z: CV.PIT.z, r: CV.PIT.r + 1.4 }, { x: CV.MOUTH.x, z: CV.MOUTH.z + 3.2, r: 4.2 }]);
    const inB = (x, z, pad) => CV.BUILDINGS.concat([CV.TENT]).some(b => inRect({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot }, x, z, 1, 1, pad));
    const railD = (x, z) => { let d = 1e9; const P = CV.RAIL; for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1); d = Math.min(d, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return d; };
    const roadGap = (x, z) => CV.roadDist(x, z) < 6 || (typeof PEAKS !== 'undefined' && !!PEAKS.roadDist && PEAKS.roadDist(x, z) < (PEAKS.ROAD_W || 3) + 2.5);
    const floorOK = (x, z, pad = 0) => !near(KEEP, x, z, pad) && !inB(x, z, 0.8 + pad) && railD(x, z) > 1.8 + pad && !roadGap(x, z);
    const old = treesIn(BOX);
    const free = (list, x, z, d) => !near(old, x, z, d) && !near(list, x, z, d);
    const dry = () => !TIME.flag('future', 'qrFree');

    // ---------------------------------------------------- long ago: the pinewood, the stream and its flume, stumps, logs, spoil
    const turf = (x, z, h) => ss(0.98, 1.16, bowlE(x, z)) * (1 - faceK(x, z)) * (1 - ss(15, 21, h));
    const pines = [];
    for (let n = 0; n < 12000 && pines.length < 130; n++) {          // the slopes, and along the top of the face
      const x = lerp(BOX.x0, BOX.x1, Rg()), z = lerp(-296, -238, Rg()), e = bowlE(x, z), h = tA(x, z);
      if (e < 1.12 || e > 2.1 || faceK(x, z) > 0.2 || roadGap(x, z) || h > (z < -284 ? 26 : 18) || !free(pines, x, z, 2.7)) continue;
      pines.push({ x, z, kind: 'pine', s: 0.85 + Rg() * 0.55, seed: Rg() });
    }
    const STUMP = { x: 69.2, z: -257.6 };
    const stumps = [{ x: STUMP.x, z: STUMP.z, kind: 'stump', s: 1.0 }];
    for (let n = 0; n < 4000 && stumps.length < 10; n++) {           // fresh stumps round the camp's edge, a few more up the slope
      const a = Rg() * TAU, e = (stumps.length < 7 ? 0.84 : 1.08) + Rg() * 0.22, x = CP.x + Math.cos(a) * CP.rx * e, z = CP.z + Math.sin(a) * CP.rz * e;
      if (z < -276 || faceK(x, z) > 0 || (reach(x, z) && !floorOK(x, z, 0.6)) || roadGap(x, z) || !free(stumps.concat(pines), x, z, 2.4)) continue;
      stumps.push({ x, z, kind: 'stump', s: 0.8 + Rg() * 0.35 });
    }
    const STREAM = [[122.5, -284.5], [119.5, -281.8], [116.4, -279.6], [113.6, -278.2], [111.4, -277.5]];
    const F0 = { x: 110.6, z: -277.2 }, F1 = { x: 105.4, z: -276.0 }, TROUGH = { x: 104.3, z: -275.7 };
    const flumeDir = (() => { const dx = F1.x - F0.x, dz = F1.z - F0.z, l = Math.hypot(dx, dz); return { l, ux: dx / l, uz: dz / l, ry: Math.atan2(dx, dz) }; })();
    const trough = (k, KG, water) => {
      const x = TROUGH.x, z = TROUGH.z, y = tA(x, z), ry = flumeDir.ry + Math.PI / 2;
      k.box(x, y + 0.3, z, 1.5, 0.6, 0.8, '#7a5a3e', { ry, ink: 0.01 });
      if (water) k.box(x, y + 0.56, z, 1.36, 0.04, 0.66, '#7fc4e4', { ry, ink: 0 });
    };
    const trestle = (k, KG, x, z, top, lean, col) => {
      const cx = Math.cos(flumeDir.ry), sx = -Math.sin(flumeDir.ry), y = tA(x, z);
      for (const s of [-1, 1]) k.rod([x + cx * 0.32 * s, y, z + sx * 0.32 * s], [x + cx * 0.32 * s + flumeDir.ux * lean, top, z + sx * 0.32 * s + flumeDir.uz * lean], 0.05, col, 0.005);
      k.rod([x - cx * 0.36 + flumeDir.ux * lean * 0.7, top - 0.32, z - sx * 0.36 + flumeDir.uz * lean * 0.7], [x + cx * 0.36 + flumeDir.ux * lean * 0.7, top - 0.32, z + sx * 0.36 + flumeDir.uz * lean * 0.7], 0.04, col, 0.004);
    };
    // the flume: a catch box under the falls, the channel on trestles (short level steps: the drop is a few centimeters a step), the trough
    const flume = { x: TROUGH.x, z: TROUGH.z, r: 0.8, build(k, KG) {
      const y0 = tA(F0.x, F0.z) + 1.05, y1 = tA(F1.x, F1.z) + 0.95, N = 6, ry = flumeDir.ry, cx = Math.cos(ry), sx = -Math.sin(ry), seg = flumeDir.l / N;
      k.box(F0.x + 0.35, tA(F0.x + 0.35, F0.z) + 0.42, F0.z - 0.1, 0.9, 0.84, 0.9, '#7a5a3e', { ry, ink: 0.01 }).box(F0.x + 0.35, tA(F0.x + 0.35, F0.z) + 0.8, F0.z - 0.1, 0.76, 0.04, 0.76, '#8fd0ec', { ry, ink: 0 });
      for (let i = 0; i < N; i++) {
        const t = (i + 0.5) / N, x = lerp(F0.x, F1.x, t), z = lerp(F0.z, F1.z, t), y = lerp(y0, y1, t);
        k.box(x, y, z, 0.56, 0.07, seg + 0.03, '#8a6a48', { ry, ink: 0.005 }).box(x, y + 0.1, z, 0.4, 0.05, seg + 0.03, '#8fd0ec', { ry, ink: 0 });
        for (const s of [-1, 1]) k.box(x + cx * 0.27 * s, y + 0.14, z + sx * 0.27 * s, 0.06, 0.3, seg + 0.03, '#7a5a3e', { ry, ink: 0.005 });
      }
      for (const t of [0.12, 0.42, 0.72]) trestle(k, KG, lerp(F0.x, F1.x, t), lerp(F0.z, F1.z, t), lerp(y0, y1, t) - 0.05, 0, '#6e5038');
      trough(k, KG, true);
      // white water where it pours in
      for (let i = 0; i < 6; i++) { const a = i * 1.1; k.add(KG.ball6, F1.x - flumeDir.ux * 0.3 + Math.cos(a) * 0.16, tA(TROUGH.x, TROUGH.z) + 0.62, F1.z - flumeDir.uz * 0.3 + Math.sin(a) * 0.16, 0.12, 0.06, 0.12, '#f4fbff', { ink: 0 }); }
    } };
    // (the channel can't be walked under: a solid at each trestle)
    const flumeSolids = [0.12, 0.42, 0.72].map(t => ({ x: lerp(F0.x, F1.x, t), z: lerp(F0.z, F1.z, t), r: 0.45, build() { /* */ } }));
    // logs stacked to dry with their sawdust, and an old stump with a badger's burrow under it
    const LOGS = { x: 70.2, z: -274.6 };
    const logs = { x: LOGS.x, z: LOGS.z, r: 1.8, build(k, KG) {
      const x = this.x, z = this.z, y = tA(x, z);
      k.add(KG.cyl, x, y + 0.01, z, 2.1, 0.02, 1.5, '#e0c89a', { ink: 0 });
      [[4, 0], [3, 0.4], [2, 0.8]].forEach(([n, yo]) => {
        for (let i = 0; i < n; i++) {
          const lz = (i - (n - 1) / 2) * 0.48, ly = y + 0.24 + yo, len = 3.0 - yo * 0.4;
          k.add(KG.cyl, x, ly, z + lz, 0.23, len, 0.23, i % 2 ? '#6e4f36' : '#7a5a3e', { rz: Math.PI / 2, ink: 0.008 });
          for (const s of [-1, 1]) k.add(KG.cyl, x + s * (len / 2 + 0.005), ly, z + lz, 0.2, 0.02, 0.2, '#d9bc8a', { rz: Math.PI / 2, ink: 0 });
        }
      });
      for (const s of [-1, 1]) for (const lx of [-1.1, 1.1]) k.rod([x + lx, y, z + s * 1.05], [x + lx, y + 1.35, z + s * 1.05], 0.05, '#5a4030', 0.004);
      const bx = x - 2.4, bz = z + 1.9, by = tA(bx, bz);
      k.add(KG.cyl, bx, by + 0.22, bz, 0.36, 0.45, 0.36, '#6a5038', { ink: 0.008 }).add(KG.cyl, bx, by + 0.45, bz, 0.34, 0.02, 0.34, '#c9ab7e', { ink: 0 });
      k.add(KG.half, bx + 0.42, by - 0.02, bz + 0.18, 0.26, 0.2, 0.22, '#2b2235', { ink: 0 }).add(KG.half, bx + 0.78, by - 0.03, bz + 0.3, 0.42, 0.16, 0.36, '#8a6a4a', { ink: 0.004 });
    } };
    // a marmot up on its rock, on the west slope
    const MARMOT = { x: 64.4, z: -259.8 };
    const marmot = { x: MARMOT.x, z: MARMOT.z, build(k, KG) {
      const x = this.x, z = this.z, y = tA(x, z);
      k.add(KG.ball6, x, y + 0.2, z, 0.95, 0.55, 0.8, '#8c8780', { ry: 0.4, ink: 0.01 });
      const my = y + 0.7;
      k.add(KG.sphere, x + 0.1, my + 0.2, z + 0.05, 0.16, 0.25, 0.14, '#9a6a3e', { ink: 0.008 }).add(KG.sphere, x + 0.13, my + 0.5, z + 0.1, 0.11, 0.1, 0.1, '#9a6a3e', { ink: 0.006 })
        .add(KG.sphere, x + 0.18, my + 0.48, z + 0.18, 0.05, 0.04, 0.05, '#e8dcc8', { ink: 0 });
      for (const s of [-1, 1]) k.add(KG.sphere, x + 0.13 + s * 0.07, my + 0.6, z + 0.08, 0.03, 0.03, 0.02, '#7a5232', { ink: 0 });
    } };
    // (the camp's floor is bare gravel, which the check counts as paved: the heaps and the scree say over, and keep off the rails,
    // the doors, the people, the cracks and the road instead)
    const spoil = [
      { id: 'qr.spoil.big', kind: 'heap', x: 72.8, z: -278.6, rx: 3.4, rz: 2.6, h: 2.6, col: '#d9d3c5', col2: '#c7bfae', foot: '#cfc7b6', over: true },
      { id: 'qr.spoil.low', kind: 'heap', x: 75.8, z: -277.4, rx: 2.0, rz: 1.6, h: 1.0, col: '#ddd7ca', col2: '#cbc3b3', foot: '#d3cbba', over: true },
    ];
    LAND('quarry', 'past', {
      box: BOX,
      ground: [{ col: '#5a8a42', map: '#86b866', amt: (x, z, q) => turf(x, z, q.h) * (0.82 + 0.12 * Math.sin(x * 0.37 + Math.cos(z * 0.29) * 2)) }],
      grass: { amt: (x, z, q) => Math.max(q.g, turf(x, z, q.h) * 0.85), tip: '#9ad466', base: '#2e6e2c', h: 1.0, k: 0.8 },
      trees: { add: pines.concat(stumps) },
      water: { streams: [{ pts: STREAM, w: 1.1 }] },
      forms: spoil,
      props: [flume, logs, marmot].concat(flumeSolids),
      looks: [
        { id: 'w.tf_qr_pinewood', at: LOOK.pw, line: 'Pines all over the slopes, a whole {w.tf_qr_pinewood}, right down to the camp. A {w.tf_qr_marmot} whistles from a rock up there.' },
        { id: 'w.tf_qr_resin', at: LOOK.rs, line: 'Fresh {w.tf_qr_resin} on the stumps: they cut pines here for the mine’s beams. It smells sweet.' },
        { id: 'w.tf_qr_flume', at: LOOK.fl, line: 'A wooden {w.tf_qr_flume} brings the {w.tf_qr_torrent} down from the slope. It splashes into a {w.tf_qr_trough} in white {w.tf_qr_foam}.' },
        { id: 'w.tf_qr_log', at: LOOK.lg, line: '{w.tf_qr_log:pl} stacked to dry, with {w.tf_qr_sawdust} all round. A {w.tf_qr_badger} has dug its burrow under the old stump.' },
        { id: 'w.tf_qr_spoil', at: LOOK.sp, line: 'A pale {w.tf_qr_spoil}: every cart of rock nobody wants ends up here. It grows a little every day.' },
      ],
      lines: [{ who: 'past:grandpa', T: LN('quarry.past.grandpa')[0] }, { who: 'past:smith', T: LN('quarry.past.smith')[0] }],
    });

    // ---------------------------------------------------- tomorrow: dead pines, bare slopes, scree fans down into the camp
    const fans = [];
    const outward = a => { const nx = Math.cos(a) / CP.rx, nz = Math.sin(a) / CP.rz, l = Math.hypot(nx, nz); return -Math.atan2(nz / l, nx / l); };
    const fanOK = (x, z) => !roadGap(x, z) && (!reach(x, z) || floorOK(x, z, 0.1));
    // (pale against the dark bare rock: under tomorrow's gray it's the value that reads, not the hue)
    const SCREE = { col: '#c4bfb6', col2: '#a39e96', foot: '#b5b0a8', over: true };
    for (let n = 0; n < 4000 && fans.length < 16; n++) {          // big fans down the slopes (the face's two corners included)
      const a = Rg() * TAU, e = 1.1 + Rg() * 0.3, x = CP.x + Math.cos(a) * CP.rx * e, z = CP.z + Math.sin(a) * CP.rz * e;
      if (faceK(x, z) > 0.3 || roadGap(x, z)) continue;
      const F = Object.assign({ id: 'qr.fan' + n, kind: 'rubble', x, z, rx: 6 + Rg() * 3, rz: 3.4 + Rg() * 1.4, h: 2.6 + Rg() * 1.2, rot: outward(a) }, SCREE);
      if (overlaps(fans, F, 0.72) || !fits(F, fanOK)) continue;
      fans.push(F);
    }
    for (let n = 0; n < 4000 && fans.filter(F => /toe/.test(F.id)).length < 8; n++) {     // their toes, spilled onto the camp's edge
      const a = Rg() * TAU, e = 0.93 + Rg() * 0.14, x = CP.x + Math.cos(a) * CP.rx * e, z = CP.z + Math.sin(a) * CP.rz * e;
      if (faceK(x, z) > 0.3) continue;
      const F = Object.assign({ id: 'qr.toe' + n, kind: 'rubble', x, z, rx: 3.2 + Rg() * 1.2, rz: 2.4 + Rg() * 0.8, h: 1.0 + Rg() * 0.6, rot: outward(a) }, SCREE);
      if (overlaps(fans, F, 0.6) || !fits(F, fanOK)) continue;
      fans.push(F);
    }
    // rills down the bare slopes between the fans, where the rain runs now the roots are gone
    const rills = [];
    for (let n = 0; n < 3000 && rills.length < 12; n++) {
      const a = Rg() * TAU, e = 1.2 + Rg() * 0.3, x = CP.x + Math.cos(a) * CP.rx * e, z = CP.z + Math.sin(a) * CP.rz * e;
      if (faceK(x, z) > 0.2 || roadGap(x, z) || reach(x, z) || rills.some(D => Math.hypot(D.x - x, D.z - z) < 7)) continue;
      if (fans.some(F => Math.hypot(F.x - x, F.z - z) < Math.max(F.rx, F.rz) * 0.8)) continue;
      rills.push({ kind: 'furrows', x, z, rx: 5.5 + Rg() * 2, rz: 1.6 + Rg() * 0.8, rot: outward(a), scale: 0.5 });
    }
    const onFan = (x, z) => fans.some(F => TL.topOf(TL.prep(Object.assign({}, F)), x, z) !== null);
    const futAdd = [];
    for (let n = 0; n < 4000 && futAdd.filter(p => p.kind === 'boulder').length < 26; n++) {      // boulders: on the fans' toes and the slopes
      const a = Rg() * TAU, e = 0.9 + Rg() * 0.5, x = CP.x + Math.cos(a) * CP.rx * e, z = CP.z + Math.sin(a) * CP.rz * e;
      // (on the floor only right at its rim, so they never wall a strip of it off)
      if (faceK(x, z) > 0.5 || roadGap(x, z) || (reach(x, z) && (!floorOK(x, z, 1.0) || bowlE(x, z) < 0.99)) || near(futAdd, x, z, 2.6)) continue;
      futAdd.push({ x, z, kind: 'boulder', s: 0.7 + Rg() * 0.7 });
    }
    for (const F of fans) for (let i = 0; i < 3; i++) {          // loose stones on each fan
      const u = (Rg() - 0.3) * 0.8, v = (Rg() - 0.5) * 0.9, c = Math.cos(F.rot), s = Math.sin(F.rot), x = F.x + u * F.rx * c + v * F.rz * s, z = F.z - u * F.rx * s + v * F.rz * c;
      if (reach(x, z) && !floorOK(x, z, 0.4)) continue;
      futAdd.push({ x, z, kind: 'pebbles', s: 1.2 + Rg() * 0.6, y: TL.topOf(TL.prep(Object.assign({}, F)), x, z) || undefined });
    }
    for (let n = 0; n < 3000 && futAdd.filter(p => p.kind !== 'boulder').length < 28; n++) {      // thistles and nettles on the gravel's edges
      const a = Rg() * TAU, e = 0.55 + Rg() * 0.42, x = CP.x + Math.cos(a) * CP.rx * e, z = CP.z + Math.sin(a) * CP.rz * e;
      if (!floorOK(x, z, 0.2) || onFan(x, z) || near(futAdd, x, z, 1.6)) continue;
      futAdd.push({ x, z, kind: Rg() < 0.5 ? 'thistle' : 'nettle', s: 0.8 + Rg() * 0.5 });
    }
    // the flume's ruin: two leaning posts, a board in the dirt, the trough dry (full again once the spring's back)
    const ruin = { x: TROUGH.x, z: TROUGH.z, r: 0.8, build(k, KG) {
      const y0 = tA(F0.x, F0.z) + 1.0, y1 = tA(F1.x, F1.z) + 0.9;
      trestle(k, KG, lerp(F0.x, F1.x, 0.12), lerp(F0.z, F1.z, 0.12), y0 - 0.25, 0.35, '#77706a');
      trestle(k, KG, lerp(F0.x, F1.x, 0.72), lerp(F0.z, F1.z, 0.72), y1 - 0.35, -0.3, '#77706a');
      if (dry()) { const x = lerp(F0.x, F1.x, 0.45), z = lerp(F0.z, F1.z, 0.45); k.box(x, tA(x, z) + 0.05, z + 0.25, 0.5, 0.06, 2.2, '#86807a', { ry: flumeDir.ry + 0.4, rz: 0.08, ink: 0.005 }); }
      trough(k, KG, !dry());
    } };
    const SCRAP = { x: 91.6, z: -269.8 };
    const scrap = { x: SCRAP.x, z: SCRAP.z, r: 0.9, build(k, KG) {
      const x = this.x, z = this.z, y = tA(x, z);
      k.add(KG.torus, x - 0.2, y + 0.42, z + 0.1, 0.42, 0.42, 0.42, '#7a5a48', { rx: 1.2, ry: 0.3, ink: 0.006 }).add(KG.cyl, x - 0.2, y + 0.42, z + 0.1, 0.1, 0.12, 0.1, '#6a5a50', { rx: 1.2 + Math.PI / 2, ry: 0.3, ink: 0 });
      k.box(x + 0.3, y + 0.12, z - 0.2, 0.12, 0.1, 2.0, '#6f6660', { ry: 0.9, rz: 0.25, ink: 0.004 }).box(x + 0.1, y + 0.08, z + 0.35, 0.8, 0.05, 0.6, '#8a5a3e', { ry: -0.4, rx: 0.2, ink: 0.004 });
      k.add(KG.cyl, x + 0.5, y + 0.2, z + 0.4, 0.12, 0.4, 0.12, '#55504c', { rz: 1.3, ink: 0.004 }).add(KG.ball6, x + 0.75, y + 0.22, z + 0.42, 0.12, 0.12, 0.12, '#4a4648', { ink: 0.004 });
    } };
    const SPRING = { x: 108.4, z: -277.2 };
    LAND('quarry', 'future', {
      box: BOX,
      ground: [
        { col: '#625d58', map: '#a8a39c', amt: (x, z) => ss(0.98, 1.14, bowlE(x, z)) * (1 - faceK(x, z)) * 0.9 },
        { col: '#9a958c', map: '#cfc9bd', amt: (x, z) => (1 - ss(0.92, 1.02, bowlE(x, z))) * 0.3, mapAmt: () => 0 },
      ],
      grass: { amt: (x, z, q) => q.g * 0.3, tip: '#a8a488', base: '#5e5a48', h: 0.7, k: 0.9 },
      trees: { swap: t => (t.kind === 'pine' ? (t.seed < 0.55 ? 'snag' : 'dead') : 'dead'), add: futAdd },
      forms: fans, decals: rills,
      props: [ruin, scrap],
      looks: [
        { id: 'w.tf_qr_scree', at: LOOK.sc, line: 'A fan of gray {w.tf_qr_scree} has slid down into the camp. {w.tf_qr_pebble:pl} still trickle down it now and then.' },
        { id: 'w.tf_qr_erosion', at: LOOK.er, line: 'With no roots to hold it, the {w.tf_qr_erosion} has eaten the slope down to the rock. The rain has cut a {w.tf_qr_gully} in it.' },
        { id: 'w.tf_qr_crumble', at: LOOK.sp, line: 'The quarry face is starting to {w.tf_qr_crumble}: cracks all over it, and fallen stones at its foot.' },
        { id: 'w.tf_qr_thistle', at: LOOK.th, line: '{w.tf_qr_thistle:pl} and {w.tf_qr_nettle:pl} where the gravel was. Careful: the {w.tf_qr_nettle:pl} sting.' },
        { id: 'w.tf_qr_scrap', at: LOOK.scr, line: 'A heap of {w.tf_qr_scrap}: a cart wheel, a bent rail, a lamp with no glass.' },
        { id: 'w.tf_qr_ruin', at: LOOK.fl, when: dry, line: 'The old flume is a {w.tf_qr_ruin} now: two leaning posts and a board in the dirt. The trough is dry.' },
      ],
      lines: [{ who: 'future:cande', T: LN('quarry.future.cande')[0] },
        { who: 'future:lucho', T: LN('quarry.future.lucho')[0], when: () => { const F = TIME.state('quarry', 'future'); return !!(F.woke && F.woke.lucho); } }],
      heal: {
        when: () => !!TIME.flag('future', 'qrFree'),
        patch: { x: SPRING.x, z: SPRING.z + 0.4, r: 7 },
        drop: fans.filter(F => Math.hypot(F.x - SPRING.x, F.z - SPRING.z) < Math.max(F.rx, F.rz) + 4).map(F => F.id),
        ground: [{ col: '#4f8a3e', map: '#8fc46a', heal: true, amt: (x, z) => 1 - ss(3.0, 6.5, Math.hypot(x - SPRING.x, z - SPRING.z - 0.4)) }],
        water: { pools: [{ x: SPRING.x, z: SPRING.z, r: 1.3 }], streams: [{ pts: [[116.4, -279.6], [113.6, -278.2], [111.0, -277.4], [SPRING.x + 0.9, SPRING.z]], w: 0.8 }] },
        trees: { add: Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU + 0.3, r = 1.9 + (i % 2) * 0.6; return { x: SPRING.x + Math.cos(a) * r, z: SPRING.z + Math.sin(a) * r, kind: i % 3 === 0 ? 'flowers' : 'moss', s: 0.9 + (i % 3) * 0.1 }; })
          .concat([{ x: SPRING.x + 3.4, z: SPRING.z - 1.6, kind: 'sapling', s: 1 }, { x: SPRING.x - 2.8, z: SPRING.z - 2.2, kind: 'flowers', s: 1.1 }, { x: SPRING.x + 1.2, z: SPRING.z + 3.0, kind: 'sprout', s: 1 }]) },
        looks: [{ id: 'w.tf_qr_gush', at: LOOK.fl, line: 'Clear water starts to {w.tf_qr_gush} between the stones again: a {w.rup_spring}! There’s moss all round it, and flowers.' }],
      },
    });
  })();

  // ======================================================== the Frost Peaks (DESIGN.md 20)
  // Long ago (the preterite against the imperfect; the winter after the concert): the glacier comes all the way down the mountain
  // behind the village to the tower's crag, a broad blue-white river of ice with blue crevasse bands, the White Hollow's arch at its
  // snout (the pines that stand on its bed today stick up out of it as blue towers of ice); fresh powder banked against the backs and
  // ends of the houses (you can walk over the drifts), a stoat, ptarmigan, a chamois up the slope, an ice axe stuck in the snow.
  // Tomorrow (the conditional; Escarcha snowed in): the glacier gone, but for a small gray remnant up on the snowfield; where it lay,
  // bare dark rock, gray moraines along its old sides and at its old snout, boulders, the pines on its bed dead. Freed (pkFree):
  // meltwater runs down the old bed into a pool by the crag, with green grass, gentians and edelweiss round it.
  (() => {
    const PK = typeof PEAKS !== 'undefined' ? PEAKS : null, R = TIME.REGIONS.peaks;
    if (!PK || !PK.villageE || !PK.BUILDINGS || !R) return;
    const BOX = { x0: 176, x1: 262, z0: -314, z1: -236 }, Rg = rng(8821);
    const reach = (x, z) => R.inside(x, z);
    // the glacier, from the snowfield down to the crag beside the tower (all of it up the mountain, past where you can walk)
    // (a strong blue: long ago's warm sepia would turn a paler one into the snow's own cream)
    const GL = { pts: [[221.0, -307.0], [224.0, -299.0], [227.6, -291.0], [230.6, -284.4], [232.8, -279.2]], w: [12, 11, 9.4, 7.0, 4.0], h: [6.0, 5.6, 5.0, 4.0, 3.0] };
    const glacier = { id: 'pk.glacier', kind: 'tongue', pts: GL.pts, w: GL.w, h: GL.h, col: '#b4dcf6', col2: '#8cc4ec', crevasse: '#3d78b8', edge: '#8a9aac', walk: false };
    const G0 = TL.prep(Object.assign({}, glacier));
    // how far across the glacier's bed a point is (0 on its middle line, 1 at its edge)
    const across = (x, z) => { let k = 1e9; for (const g of G0.seg) { const t = clamp((x - g.ax) * g.ux + (z - g.az) * g.uz, 0, g.l); k = Math.min(k, Math.hypot(x - g.ax - g.ux * t, z - g.az - g.uz * t) / lerp(g.w0, g.w1, t / g.l)); } return k; };
    const LOOK = { a: { x: 225.1, z: -266.3 }, b: { x: 232.2, z: -268.6 }, c: { x: 214.0, z: -272.6 } };      // (b: up the path, clear of the rock's Look)
    // what must keep its ground: the people of all three worlds, the doors, the clocks' spots, both worlds' things, the cracks, the
    // White Hollow, the tower's door and ledge, little Pili's sled drift
    const peopleOf = w => { const D = R.dress && R.dress[w]; return ((D && D.people) || []).filter(p => p.at).map(p => ({ x: p.at.x, z: p.at.z, r: 2.0 })); };
    const BLD = PK.BUILDINGS, front = b => ({ x: b.x + Math.sin(b.rot) * (b.d / 2 + 1.2), z: b.z + Math.cos(b.rot) * (b.d / 2 + 1.2), r: 2.4 });
    const THINGS = [[201.6, -266.8], [199.6, -267.4], [212.6, -267.6], [190.2, -253.4], [191.8, -251.8], [217.9, -253.2], [195.6, -261.0], [204.2, -260.6], [210.6, -256.6], [186.2, -251.2],
      [226.2, -259.6], [213.0, -269.4], [187.0, -265.2], [186.6, -255.6], [228.6, -269.8], [204.4, -268.05], [209.6, -268.05],
      [201.8, -259.8], [199.9, -248.3], [212.0, -248.4], [217.9, -246.4], [193.7, -252.6], [216.2, -258.9], [217.4, -253.7], [203.0, -267.3], [206.2, -265.55], [199.8, -268.9], [210.4, -250.4], [198.0, -261.4], [236.4, -270.2]]
      .map(([x, z]) => ({ x, z, r: 1.6 }));
    const KEEP = peopleOf('past').concat(peopleOf('future'), BLD.map(front), THINGS, Object.values(PK.SPOT).map(p => ({ x: p.x, z: p.z, r: 1.8 })), Object.values(LOOK).map(p => ({ x: p.x, z: p.z, r: 2.2 })),
      Object.values(TIME.CRACKS).filter(c => c.region === 'peaks').map(c => ({ x: c.x, z: c.z, r: 3.2 })),
      [{ x: 235.0, z: -273.8, r: 2.6 }, { x: 236.6, z: -272.4, r: 2.0 }, { x: PK.DOOR.x, z: PK.DOOR.z, r: 2.6 }, { x: PK.LEDGE.x, z: PK.LEDGE.z, r: 2.4 }, { x: 221.4, z: -262.6, r: 3.0 }]);
    const inBld = (b, x, z, pad = 0) => inRect({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot }, x, z, 1, 1, pad);
    const trod = (x, z) => Math.hypot(x - PK.SPOT.plaza.x, z - PK.SPOT.plaza.z) < 7.5 || PK.roadDist(x, z) < 3.2 || PK.pathInfo(x, z).d < 3.2;
    const floorOK = (x, z, pad = 0) => !near(KEEP, x, z, pad) && !BLD.some(b => inBld(b, x, z, 0.6 + pad)) && !trod(x, z);
    const peaksNear = () => { const g = G().w3d.scene.children.find(o => o.name === 'peaks'); return g && g.children.find(c => c.name === 'peaks-near'); };
    const PINE = ['#355f4a', '#2f5a46'], TRUNK = ['#6e4c33'];
    const dry = () => !TIME.flag('future', 'pkFree');

    // ---------------------------------------------------- long ago: the glacier, powder against the houses
    // drifts against each house's back and ends (their steep side to the wall; banked into the wall a little)
    const drifts = [];
    for (const b of BLD) for (const side of [0, 1, 2]) {
      if (drifts.length >= 10) break;
      const fx = Math.sin(b.rot), fz = Math.cos(b.rot), sx = Math.cos(b.rot), sz = -Math.sin(b.rot);
      const dir = side === 0 ? [-fx, -fz] : side === 1 ? [sx, sz] : [-sx, -sz];
      const half = side === 0 ? b.d / 2 : b.w / 2, along = side === 0 ? b.w / 2 : b.d / 2;
      const rx = 1.9 + Rg() * 0.5, rz = Math.min(along * 0.82, 3.2), off = half + rx * 0.75, x = b.x + dir[0] * off, z = b.z + dir[1] * off;
      if (drifts.some(D => Math.hypot(D.x - x, D.z - z) < 4)) continue;
      const F = { id: 'pk.drift.' + b.id + side, kind: 'drift', x, z, rx, rz, h: 1.1 + Rg() * 0.5, rot: Math.atan2(dir[1], -dir[0]), col: '#f6f9fc', col2: '#dde8f2', foot: '#e8eef4', over: true };
      if (fits(F, (px, pz) => inBld(b, px, pz, 0.1) || !reach(px, pz) || floorOK(px, pz))) drifts.push(F);
    }
    // (most of those are past the village's edge, scenery: one you can walk over, in the lane behind the inn, with its Look)
    const innDrift = { id: 'pk.drift.inn', kind: 'drift', x: 225.5, z: -256.4, rx: 1.5, rz: 2.2, h: 0.9, rot: Math.PI, col: '#f6f9fc', col2: '#dde8f2', foot: '#e8eef4', over: true };
    drifts.push(innDrift);
    const powderAt = { x: 225.9, z: -256.4, F: innDrift };          // (on the drift's low end: the inn's sign has a Look just south)
    KEEP.push({ x: powderAt.x, z: powderAt.z, r: 2.2 });
    // a stoat on that drift, two ptarmigan and an ice axe by the workshop, a chamois up the slope
    const critters = { x: LOOK.c.x + 1.4, z: LOOK.c.z - 1.6, r: 0.25, build(k, KG) {
      const ax = this.x, az = this.z, ay = tA(ax, az);
      k.rod([ax, ay - 0.1, az], [ax + 0.12, ay + 0.85, az - 0.05], 0.03, '#6b4a30', 0.004).box(ax + 0.14, ay + 0.9, az - 0.05, 0.32, 0.06, 0.05, '#8a8e96', { rz: 0.15, ink: 0.004 });
      for (const [dx, dz, ry] of [[1.6, -1.8, 0.4], [2.5, -2.4, 2.2]]) {
        const x = ax + dx, z = az + dz, y = tA(x, z);
        k.add(KG.sphere, x, y + 0.18, z, 0.17, 0.15, 0.22, '#f4f6f8', { ry, ink: 0.006 }).add(KG.sphere, x + Math.sin(ry) * 0.16, y + 0.32, z + Math.cos(ry) * 0.16, 0.09, 0.09, 0.09, '#f4f6f8', { ink: 0.004 })
          .add(KG.cone, x + Math.sin(ry) * 0.25, y + 0.31, z + Math.cos(ry) * 0.25, 0.025, 0.06, 0.025, '#2b2235', { rx: Math.PI / 2, ry, ink: 0 });
      }
      const cx = 221.8, cz = -280.6, cy = tA(cx, cz);
      k.add(KG.ball6, cx, cy + 0.3, cz, 1.1, 0.6, 0.9, '#9a9ca4', { ink: 0.01 });
      const my = cy + 0.85;
      k.add(KG.sphere, cx, my + 0.35, cz, 0.22, 0.2, 0.42, '#7a5a3e', { ry: 0.6, ink: 0.008 }).add(KG.sphere, cx + 0.24, my + 0.62, cz + 0.32, 0.12, 0.12, 0.15, '#5a4030', { ry: 0.6, ink: 0.006 });
      for (const [lx, lz] of [[-0.12, -0.2], [0.12, -0.2], [-0.12, 0.2], [0.12, 0.2]]) k.rod([cx + lx, my, cz + lz], [cx + lx, my + 0.3, cz + lz], 0.03, '#5a4030', 0.003);
      for (const s of [-1, 1]) k.rod([cx + 0.24 + s * 0.05, my + 0.7, cz + 0.34], [cx + 0.2 + s * 0.08, my + 0.86, cz + 0.28], 0.015, '#2b2235', 0);
      if (powderAt) {
        const F = powderAt.F, c = Math.cos(F.rot), s = Math.sin(F.rot), x = F.x - c * F.rx * 0.2, z = F.z + s * F.rx * 0.2, y = TL.topOf(TL.prep(Object.assign({}, F)), x, z) || tA(x, z);
        k.add(KG.sphere, x, y + 0.1, z, 0.08, 0.09, 0.2, '#f8fafc', { ink: 0.005 }).add(KG.sphere, x, y + 0.2, z + 0.16, 0.06, 0.06, 0.07, '#f8fafc', { ink: 0.004 }).add(KG.sphere, x, y + 0.08, z - 0.24, 0.03, 0.03, 0.07, '#2b2235', { ink: 0 });
      }
    } };
    LAND('peaks', 'past', {
      box: BOX,
      forms: [glacier].concat(drifts),
      leaves: [{ obj: peaksNear, from: PINE, to: '#9ccbea', area: (x, z) => across(x, z) < 1.1 }, { obj: peaksNear, from: TRUNK, to: '#7fb3dc', area: (x, z) => across(x, z) < 1.1 }],
      props: [critters],
      looks: [
        { id: 'w.tf_pk_glacier', at: LOOK.b, line: 'The {w.tf_pk_glacier} comes all the way down to the crag: a great {w.tf_pk_tongue} of {w.tf_pk_blueice}, and the cave’s {w.tf_pk_icearch} at its foot.' },
        { id: 'w.tf_pk_serac', at: LOOK.a, line: 'Blue {w.tf_pk_serac:pl} stand up out of the ice like towers. The whole glacier seems to {w.tf_pk_slide} down, a little every year.' },
        { id: 'w.tf_pk_ptarmigan', at: LOOK.c, line: 'Two {w.tf_pk_ptarmigan:pl} in their winter white by an ice axe in the snow, and up on the rocks a {w.tf_pk_chamois} watching.' },
      ].concat(powderAt ? [{ id: 'w.tf_pk_powder', at: { x: powderAt.x, z: powderAt.z }, line: 'Fresh {w.tf_pk_powder} piled up against the wall. A {w.tf_pk_stoat}, white as the snow, pops out of it.' }] : []),
      lines: [{ who: 'past:teo', T: LN('peaks.past.teo')[0] }, { who: 'past:driver', T: LN('peaks.past.driver')[0] }],
    });

    // ---------------------------------------------------- tomorrow: the glacier gone, a moraine where it lay
    const moraine = [];
    for (const g of G0.seg) for (let t = 1.6; t < g.l; t += 3.4) for (const s of [-1, 1]) {      // along both old sides
      const w = lerp(g.w0, g.w1, t / g.l), x = g.ax + g.ux * t - g.uz * w * 1.02 * s, z = g.az + g.uz * t + g.ux * w * 1.02 * s;
      const F = { id: 'pk.mor' + moraine.length, kind: 'rubble', x, z, rx: 2.6, rz: 1.4 + Rg() * 0.4, h: 1.1 + Rg() * 0.6, rot: -Math.atan2(g.uz, g.ux), col: '#9a958e', col2: '#837e77', foot: '#8c8780', walk: false };
      if (fits(F, (px, pz) => !reach(px, pz))) moraine.push(F);
    }
    { const g = G0.seg[G0.seg.length - 1], [ex, ez] = GL.pts[GL.pts.length - 1];       // and round its old snout
      for (const a of [-0.9, -0.3, 0.3, 0.9]) {
        const ca = Math.cos(a), sa = Math.sin(a), dx = g.ux * ca - g.uz * sa, dz = g.uz * ca + g.ux * sa, x = ex + dx * 4.4, z = ez + dz * 4.4;
        const F = { id: 'pk.mor.end' + a, kind: 'rubble', x, z, rx: 1.6, rz: 2.6, h: 1.2, rot: -Math.atan2(dz, dx), col: '#9a958e', col2: '#837e77', foot: '#8c8780', walk: false };
        if (fits(F, (px, pz) => !reach(px, pz) && !near(KEEP, px, pz, 0))) moraine.push(F);
      } }
    const remnant = { id: 'pk.remnant', kind: 'tongue', pts: [[219.6, -309.6], [221.4, -304.4]], w: [5.2, 3.2], h: [2.2, 1.5], col: '#c4ccd2', col2: '#a8b2ba', crevasse: '#7e8c98', edge: '#7a7670', walk: false };
    const boulders = [];
    for (let n = 0; n < 2000 && boulders.length < 14; n++) {
      const g = G0.seg[Math.floor(Rg() * G0.seg.length)], t = Rg() * g.l, w = lerp(g.w0, g.w1, t / g.l), e = (Rg() * 2 - 1) * 0.85, x = g.ax + g.ux * t - g.uz * w * e, z = g.az + g.uz * t + g.ux * w * e;
      if (reach(x, z) || near(KEEP, x, z, 1.0) || near(boulders, x, z, 2.6)) continue;
      boulders.push({ x, z, kind: 'boulder', s: 0.7 + Rg() * 0.7 });
    }
    const POOL = { x: 231.0, z: -274.6 };
    LAND('peaks', 'future', {
      box: BOX,
      ground: [{ col: '#56534f', map: '#8c8986', amt: (x, z) => (1 - ss(0.72, 1.06, across(x, z))) * 0.94 }],
      forms: moraine.concat([remnant]),
      trees: { add: boulders },
      leaves: [{ obj: peaksNear, from: PINE, to: '#5d5a55', area: (x, z) => across(x, z) < 1.1 }, { obj: peaksNear, from: TRUNK, to: '#4a4038', area: (x, z) => across(x, z) < 1.1 }],
      looks: [
        { id: 'w.tf_pk_bare', at: LOOK.a, when: dry, line: 'Where the glacier was, only {w.tf_pk_bare}, {w.tf_pk_polished} by the ice. It looks like a {w.tf_pk_scar} on the mountain.' },
        { id: 'w.tf_pk_moraine', at: LOOK.b, when: dry, line: 'A long gray {w.tf_pk_moraine}: the stones the glacier pushed down and left behind. Watch out for a {w.tf_pk_rockfall}.' },
        { id: 'w.tf_pk_remnant', at: LOOK.c, line: 'Far up on the snowfield, a small gray {w.tf_pk_remnant} of the glacier is all that’s left. One day it will {w.tf_pk_melt} too.' },
      ],
      lines: [{ who: 'future:lia', T: LN('peaks.future.lia')[0] },
        { who: 'future:teo', T: LN('peaks.future.teo')[0], when: () => { const F = TIME.state('peaks', 'future'); return !!(F.woke && F.woke.teo); } }],
      heal: {
        when: () => !!TIME.flag('future', 'pkFree'),
        patch: { x: POOL.x, z: POOL.z - 1.0, r: 7 },
        ground: [{ col: '#4f8a3e', map: '#8fc46a', heal: true, amt: (x, z) => 1 - ss(3.4, 7, Math.hypot(x - POOL.x, z - POOL.z + 1.0)) }],
        water: { pools: [{ x: POOL.x, z: POOL.z, r: 1.4 }], streams: [{ pts: [[221.6, -303.0], [225.2, -295.4], [228.6, -288.0], [231.0, -281.4], [231.6, -277.6], [231.2, -275.6]], w: 1.2 }] },
        trees: { add: Array.from({ length: 12 }, (_, i) => { const a = i / 12 * TAU + 0.2, r = 2.3 + (i % 3) * 0.55; return { x: POOL.x + Math.cos(a) * r, z: POOL.z + Math.sin(a) * r, kind: i % 4 === 3 ? 'sprout' : 'flowers', s: 0.9 + (i % 2) * 0.2, col: i % 2 ? '#4a6fd8' : '#f4f2ea' }; }) },
        looks: [{ id: 'w.tf_pk_meltwater', at: LOOK.b, line: 'The snow is melting at last: {w.tf_pk_meltwater} runs down the old bed in a {w.tf_pk_rivulet}, into a pool by the crag.' },
          { id: 'w.tf_pk_gentian', at: LOOK.a, line: 'Green grass round the pool, blue {w.tf_pk_gentian:pl}, and a white {w.tf_pk_edelweiss} between the stones. Listen: the rocks {w.tf_pk_drip}.' }],
      },
    });
  })();
  // ======================================================== Port Brisa (DESIGN.md 18.15)
  // Long ago (the progressive cut by the preterite; the port's busiest years): wooded headlands round the bay (two green capes of
  // stone pines and cork oaks out in the water), the beach twice as wide (a sand shelf you can walk, west of today's), the hills
  // behind the walls greener, with heather and rosemary.
  // Tomorrow (wishes; the harbor empty): the sea has risen 0.78, to just under the quay's edge. The beach and the lanes down to it are
  // under water, with boardwalks over them (out to the storm plaque, and down to the south wall), sandbags along the dry edge; the
  // sea fort's rocks are awash and the half-sunk boat is gone under. Freed (pbFree): the water drops back a step, and a green salt
  // marsh with sea lavender grows where the beach was. Fights keep the harbor arena, its water raised tomorrow (time_land_battle.js).
  (() => {
    const P = typeof PORT !== 'undefined' ? PORT : null, R = TIME.REGIONS.port;
    if (!P || !P.seaD || !R) return;
    const BOX = { x0: -340, x1: -140, z0: -128, z1: 20 }, Rg = rng(5521), W0 = WORLD.L.water;
    const reach = (x, z) => R.inside(x, z);
    const LOOK = { p1: { x: -234.8, z: -110.6 }, p2: { x: -239.4, z: -52.6 }, p3: { x: -256.4, z: -71.0 }, p4: { x: -170.6, z: -101.0 },
      f2: { x: -219.6, z: -58.4 }, f3: { x: -213.0, z: -62.4 }, f4: { x: -246.0, z: -86.5 } };
    // what must keep its ground: both worlds' people and things, the cracks, the office door, the plaque, today's spots
    const peopleOf = w => { const D = R.dress && R.dress[w]; return ((D && D.people) || []).filter(p => p.at).map(p => ({ x: p.at.x, z: p.at.z, r: 2.0 })); };
    const THINGS = [[-227.55, -95.15], [-234.2, -77.0], [-229.4, -84.2], [-231.4, -91.6], [-252.6, -89.6], [-234.6, -101.8], [-228.0, -58.4], [-226.6, -58.4], [-235.8, -84.6],
      [-245.3, -70.6], [-234.6, -96.2], [-233.0, -97.6], [-233.2, -74.2], [-235.4, -77.4], [-229.4, -84.2], [-227.0, -59.4], [-229.8, -53.2]].map(([x, z]) => ({ x, z, r: 1.6 }));
    const KEEP = peopleOf('past').concat(peopleOf('future'), THINGS, Object.values(P.SPOT).map(p => ({ x: p.x, z: p.z, r: 1.6 })), Object.values(LOOK).map(p => ({ x: p.x, z: p.z, r: 2.2 })),
      Object.values(TIME.CRACKS).filter(c => c.region === 'port').map(c => ({ x: c.x, z: c.z, r: 3.2 })));
    const inBld = (x, z, pad = 0) => P.BUILDINGS.some(b => inRect({ x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot || 0 }, x, z, 1, 1, pad));
    const old = treesIn(BOX);
    const free = (list, x, z, d) => !near(old, x, z, d) && !near(list, x, z, d);
    const land = (x, z) => !P.inCity(x, z, 3) && P.seaD(x, z) > 3 && P.roadDist(x, z) > 5 && P.boxOut(x, z, P.MOAT, 4) > 0 && Math.hypot(x - P.FORT.x, z - P.FORT.z) > P.FORT.r + 3;
    const seaSheet = () => { const W = P.WATER[0], cx = (W.x0 + W.x1) / 2, cz = (W.z0 + W.z1) / 2, sc = G() && G().w3d && G().w3d.scene; return sc ? sc.children.find(o => o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && Math.abs(o.position.x - cx) < 1 && Math.abs(o.position.z - cz) < 1) : null; };
    const dry = () => !TIME.flag('future', 'pbFree');

    // ---------------------------------------------------- long ago: headlands, a wider beach, green hills
    const HEAD = [{ id: 'pb.cape.n', x: -292, z: -95.5, rx: 11.5, rz: 7.2, h: 7.0, rot: 0.25 }, { id: 'pb.cape.s', x: -291, z: -35.0, rx: 12.5, rz: 8.6, h: 6.2, rot: -0.2 }]
      .map(F => Object.assign(F, { kind: 'mound', col: '#5f8f45', col2: '#4f7f3a', foot: '#b9a98a', walk: false }));
    const pastAdd = [];
    for (const F of HEAD) {          // stone pines and cork oaks along each cape's back
      const PF = TL.prep(Object.assign({}, F));
      for (let n = 0; n < 400 && pastAdd.filter(p => p.cape === F.id).length < 13; n++) {
        const u = (Rg() * 2 - 1) * 0.78, v = (Rg() * 2 - 1) * 0.62, c = Math.cos(F.rot), s = Math.sin(F.rot), x = F.x + u * F.rx * c + v * F.rz * s, z = F.z - u * F.rx * s + v * F.rz * c;
        if (near(pastAdd, x, z, 2.6)) continue;
        const y = TL.topOf(PF, x, z); if (y === null || y < W0 + 1.2) continue;
        pastAdd.push({ x, z, y, kind: Rg() < 0.62 ? 'stonepine' : 'oak', s: 0.85 + Rg() * 0.4, cape: F.id });
      }
    }
    for (let n = 0; n < 6000 && pastAdd.filter(p => !p.cape).length < 70; n++) {      // the hills behind the walls: pines, cork oaks, heather, rosemary
      const x = lerp(BOX.x0, BOX.x1, Rg()), z = lerp(-70, 18, Rg()), h = tA(x, z);
      if (!land(x, z) || h < W0 + 1.0 || !free(pastAdd, x, z, 2.2)) continue;
      const r = Rg(), kind = r < 0.22 ? 'stonepine' : r < 0.4 ? 'oak' : 'flowers';
      pastAdd.push({ x, z, kind, s: kind === 'flowers' ? 1.1 + Rg() * 0.4 : 0.85 + Rg() * 0.4, col: kind === 'flowers' ? (Rg() < 0.6 ? '#b07ac8' : '#7f8fd8') : undefined });
    }
    // the beach, twice as wide: a sand shelf out west of today's (you can walk it), with a sandcastle and a starfish
    const SAND = { id: 'pb.sand', kind: 'plate', x: -240.2, z: -54.6, rx: 8.4, rz: 8.4, y: W0 + 0.12, col: '#ead8a8', col2: '#dcc795', foot: '#cdb582', over: true };
    const castle = { x: -241.2, z: -51.4, r: 0.7, build(k, KG) {
      const x = this.x, z = this.z, y = W0 + 0.12;
      k.add(KG.cyl, x, y + 0.2, z, 0.62, 0.4, 0.62, '#e6d09a', { ink: 0.01 });
      for (const [dx, dz] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) k.add(KG.cyl, x + dx, y + 0.55, z + dz, 0.16, 0.3, 0.16, '#e2c98e', { ink: 0.006 }).add(KG.cone, x + dx, y + 0.78, z + dz, 0.17, 0.16, 0.17, '#dcc287', { ink: 0.004 });
      k.add(KG.cyl, x, y + 0.62, z, 0.26, 0.44, 0.26, '#e6d09a', { ink: 0.006 }).rod([x, y + 0.84, z], [x, y + 1.28, z], 0.015, '#7a5a3e', 0).box(x + 0.1, y + 1.2, z, 0.18, 0.1, 0.01, '#d9483b', { ink: 0 });
      // (a striped beach umbrella over it, leaning a little)
      const ux = x + 1.1, uz = z + 0.9;
      k.rod([ux, y - 0.2, uz], [ux - 0.25, y + 2.1, uz - 0.15], 0.04, '#e8e2d4', 0.004);
      k.add(KG.cone, ux - 0.25, y + 2.0, uz - 0.15, 1.35, 0.5, 1.35, '#d9483b', { ink: 0.008 }).add(KG.cone, ux - 0.25, y + 2.12, uz - 0.15, 0.95, 0.38, 0.95, '#f4efe2', { ink: 0 }).add(KG.cone, ux - 0.25, y + 2.22, uz - 0.15, 0.5, 0.24, 0.5, '#d9483b', { ink: 0 });
    } };
    LAND('port', 'past', {
      box: BOX,
      ground: [{ col: '#5a9447', map: '#8fc46a', amt: (x, z, q) => (land(x, z) ? 0.6 * ss(W0 + 0.8, W0 + 2.4, q.h) : 0) }],
      grass: { amt: (x, z, q) => (land(x, z) ? Math.max(q.g, 0.75 * ss(W0 + 0.8, W0 + 2.4, q.h)) : q.g), tip: '#a6d870', base: '#3e7a34', h: 1.15, k: 0.8 },
      forms: HEAD.concat([SAND, Object.assign({}, SAND, { id: 'pb.sand2', x: -246.6, z: -49.6, rx: 4.8, rz: 4.2 })]),
      trees: { add: pastAdd },
      props: [castle],
      looks: [
        { id: 'w.tf_pb_cape', at: LOOK.p1, line: 'Across the bay, a green {w.tf_pb_cape} of {w.tf_pb_stonepine:pl}, and red {w.tf_pb_cliff:pl} dropping into the sea.' },
        { id: 'w.tf_pb_sandcastle', at: LOOK.p2, line: 'The beach runs much further out than today. Someone built a {w.tf_pb_sandcastle} in the shade of a striped {w.tf_pb_umbrella}.' },
        { id: 'w.tf_pb_tern', at: LOOK.p3, line: 'A {w.tf_pb_tern} dives off the end of the pier. To the south, under the cliffs, a little {w.tf_pb_inlet}.' },
        { id: 'w.tf_pb_corkoak', at: LOOK.p4, line: 'Over the wall the hills are green: {w.tf_pb_corkoak:pl}, {w.tf_pb_heather} and wild {w.tf_pb_rosemary}. The {w.tf_pb_breeze} smells of it.' },
      ],
      lines: [{ who: 'past:fisher', T: LN('port.past.fisher')[0] }, { who: 'past:mason', T: LN('port.past.mason')[0] }],
    });

    // ---------------------------------------------------- tomorrow: the sea risen into the beach's lanes
    const UP = 0.78, SEA = W0 + UP, DECK = 0.62;
    const inBeach = (x, z) => x > -252 && x < -210 && z > -64.8 && z < -45.5;
    const northBay = (x, z) => x < P.QUAY && x > -340 && z > -126 && z < -104 && tA(x, z) < SEA;
    const D1 = { box: [-230.4, -220.6, -59.9, -56.9], top: DECK }, D3 = { box: [-226.7, -224.3, -56.9, -47.0], top: DECK };
    // (drawn only over the bay's north end, the lake's sheet there: the raised sea sheet covers the rest, in the same water)
    const flood = y => ({ area: (x, z) => inBeach(x, z) || northBay(x, z), draw: northBay, y, decks: [D1, D3], mat: () => { const s = seaSheet(); return s && TL.raisedMat(s, y); } });
    // the boardwalks: planks across, posts down to the bed every 1.5, a rope rail along the open sides
    const walks = { x: -225.5, z: -55.0, build(k, KG) {
      for (const [x0, x1, z0, z1] of [D1.box, D3.box]) {
        const along = x1 - x0 > z1 - z0, L0 = along ? x1 - x0 : z1 - z0, W = along ? z1 - z0 : x1 - x0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        for (let s = 0.2; s < L0; s += 0.5) { const x = along ? x0 + s : cx, z = along ? cz : z0 + s; k.box(x, DECK - 0.04, z, along ? 0.44 : W, 0.08, along ? W : 0.44, (Math.floor(s * 2) % 2) ? '#8a7258' : '#7d664e', { ink: 0.004 }); }
        for (let s = 0.4; s < L0; s += 1.5) for (const e of [-1, 1]) {
          const x = along ? x0 + s : cx + e * (W / 2 - 0.12), z = along ? cz + e * (W / 2 - 0.12) : z0 + s, b = tA(x, z);
          k.rod([x, b - 0.1, z], [x, DECK + 0.62, z], 0.06, '#6a5440', 0.005);
        }
        for (const e of [-1, 1]) { const a = along ? [x0 + 0.4, DECK + 0.55, cz + e * (W / 2 - 0.12)] : [cx + e * (W / 2 - 0.12), DECK + 0.55, z0 + 0.4], b = along ? [x1 - 0.2, DECK + 0.55, cz + e * (W / 2 - 0.12)] : [cx + e * (W / 2 - 0.12), DECK + 0.55, z1 - 0.2]; k.rod(a, b, 0.025, '#c9b58a', 0); }
      }
    } };
    // sandbags along the dry edge of the flooded lanes (a gap where each boardwalk starts)
    const sandbags = { x: -221.0, z: -56.0, build(k, KG) {
      for (let z = -64.2; z < -46.6; z += 0.62) {
        if (z > -60.2 && z < -56.4) continue;
        const x = -220.9 + Math.sin(z * 1.7) * 0.08, y = tA(x, z);
        k.add(KG.sphere, x, y + 0.16, z, 0.3, 0.17, 0.36, (Math.round(z * 3) % 2) ? '#a89a78' : '#9a8c6c', { ry: 0.2, ink: 0.006 }).add(KG.sphere, x + 0.02, y + 0.42, z + 0.3, 0.28, 0.15, 0.34, '#a3957a', { ry: -0.2, ink: 0.006 });
      }
    } };
    LAND('port', 'future', {
      box: BOX,
      water: { sheet: { find: seaSheet, dy: UP, float: [{ name: 'pb-fut-ship', mode: 'add' }] }, flood: flood(SEA) },
      props: [walks, sandbags],
      looks: [
        { id: 'w.tf_pb_hightide', at: LOOK.p1, line: 'The sea has risen right up to the edge of the quay. At {w.tf_pb_hightide} the {w.tf_pb_saltwater} will {w.tf_pb_overflow}.' },
        { id: 'w.tf_pb_boardwalk', at: LOOK.f2, when: dry, line: 'The beach is gone. A {w.tf_pb_boardwalk} runs over the {w.tf_pb_flooded} lanes, out to the old stone, half {w.tf_pb_sunk}.' },
        { id: 'w.tf_pb_barrier', at: LOOK.f3, when: dry, line: 'A {w.tf_pb_barrier} of sandbags along the street, against the next {w.tf_pb_storm}. Someone has been trying to {w.tf_pb_bail} out a cellar.' },
        { id: 'w.tf_pb_seawall', at: LOOK.f4, line: 'The sea fort stands in the water now, and the waves break over the old {w.tf_pb_seawall}.' },
      ],
      lines: [{ who: 'future:marino', T: LN('port.future.marino')[0] },
        { who: 'future:tere', T: LN('port.future.tere')[0], when: () => { const F = TIME.state('port', 'future'); return !!(F.woke && F.woke.tere); } }],
      heal: {
        when: () => !!TIME.flag('future', 'pbFree'),
        water: { sheet: { find: seaSheet, dy: 0.4, float: [{ name: 'pb-fut-ship', mode: 'add' }] }, flood: flood(W0 + 0.4) },
        patch: { x: -221.0, z: -55.5, r: 9 },
        ground: [{ col: '#6f9a5a', map: '#9fcf7a', heal: true, amt: (x, z) => (inBeach(x, z) && x > -229.5 ? 0.92 * ss(W0 + 0.42, W0 + 0.62, tA(x, z)) : 0) }],
        // (port.js paves the beach with its own sand, over the ground's colors: the marsh is its plants, thick)
        trees: { add: (() => { const out = [], Rh = rng(611); for (let n = 0; n < 2400 && out.length < 96; n++) {
          const x = lerp(-229, -213.5, Rh()), z = lerp(-63.6, -46.6, Rh());
          if (tA(x, z) < W0 + 0.45 || near(out, x, z, 0.85) || near(KEEP, x, z, 0.6) || (x > -231 && x < -219.8 && z > -60.4 && z < -56.4) || (x > -227.2 && x < -223.8 && z > -57 && z < -46.5)) continue;
          const r = Rh(), kind = r < 0.42 ? 'moss' : r < 0.64 ? 'reedGreen' : 'flowers';
          out.push({ x, z, kind, s: kind === 'moss' ? 1.1 + Rh() * 0.5 : 0.8 + Rh() * 0.4, col: kind === 'flowers' ? '#9a7fd8' : undefined }); } return out; })() },
        looks: [{ id: 'w.tf_pb_saltmarsh', at: LOOK.f2, line: 'The water has gone down a step. Where the beach was, a green {w.tf_pb_saltmarsh}, purple with {w.tf_pb_sealavender}.' },
          { id: 'w.tf_pb_flooded', at: LOOK.f3, line: 'The lanes aren’t {w.tf_pb_flooded} any more. The sandbags can stay, just in case.' }],
      },
    });
  })();
  function inBoxXZ(B, x, z) { return x >= B.x0 && x <= B.x1 && z >= B.z0 && z <= B.z1; }
})();
