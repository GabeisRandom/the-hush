'use strict';
// TIME.land: terraforming, a different land in each time (DESIGN.md 21.1; helper TF1, 2026-11-22). The three times share one map;
// a region's Past and its Future can each lay a landscape of their own over it while that world is on. Today never changes, and the
// terrain's shape (world.js's height grid) never does either, so everything standing on it stays where it was.
//   TIME.land(region, world, spec)    a world's land (time_land_regions.js has the five regions'). Every part is optional:
//     box { x0, x1, z0, z1 }           the area it repaints (terrain colors, grass, trees, flowers, the minimap): the region's reach
//                                      and what you can see from it
//     ground [{ col, map, amt(x, z, q), heal }]   palette layers: the terrain's vertex colors lerp to col by amt (q: { h height,
//                                      g today's grass, p path, hu hush, sl slope, heal the healed patch 0..1 }); map: its minimap color
//     grass { amt(x, z, q), tip, base, h, k }   the grass amount (absolute 0..1; q.g is today's), the blades' colors and height in
//                                      the region (k: how much of their color). It's 0 under every form, stream, pool and bed.
//     trees { swap(t) → kind | null | undefined, add: [{ x, z, kind, s, seed }] }   world.js's trees in the box swapped for one of
//                                      PLANTS (null: gone, its collider parked; undefined: kept) and plants added (instanced, one
//                                      draw call per kind; colliders only inside the region's reach)
//     leaves [{ obj(), from: [hex], to, box }]   a region's own merged foliage recolored by its leaf colors (restored after)
//     flowers (x, z) → bool             which of world.js's flowers in the box stay (default: where the land keeps its grass)
//     decals [{ kind: 'cracks' | 'furrows' | 'salt', x, z, rx, rz, rot }]   patterns laid flat on the ground
//     water { sheet: { find(scene), dy }, streams: [{ pts, w }], pools: [{ x, z, r }], bed: { level, area(x, z) },
//             flood: { area(x, z), y, decks: [platforms] } }
//     forms [{ id, kind, x, z, rx, rz, h, rot, col, col2, walk, solid, y, pts, w }]   landforms laid on the ground: dune, drift,
//                                      mound, heap, rubble, plate (flat at y: ice, mud, crust), tongue (a glacier along pts, w wide)
//     tumble { n, box }                tumbleweeds rolling across a box
//     keep [{ x, z, r }]               ground that must not change (the region's cracks, spots, people and path cells are added)
//     arena                            the battle arena of a fight here that names no biome
//     looks [{ id, at, line }]         things to look at (TIME spots, said with the word), lines [{ who, T, when }] (a «The land»
//                                      item in that person's Talk), words (time_land_text.js registers them)
//     heal { when(state), patch: { x, z, r }, …more of the above, drop: [form ids] }   the Future's payoff, once that world's freed
//   TIME.land.on(region, world) / off() / late(dt)   time.js calls them (dressOn before the teleport, dressOff, every frame)
//   TIME.land.arena() · TIME.landAt(x, z) (the form you stand on) · TIME.landTop(x, z) (the land's height there: main.js's camera)
//   TIME.mapLand() → { cv, px, py, w, h } (minimap.js draws it over its picture) · TIME.land.check(region?) → [] when all's well
//   WORLD.deepAt(x, z): a flood's deep water (sim.js's okAt, rescue and Mimo's hops ask it)
// Walking: only TIME's land platforms are new ground (world.js groundAt's { box, fn } kind: the drawn surface's height), parked far
// away while the land is off. A walkable top over deep water stands at least 0.2 over the terrain, so sim.js's rescue never fires.
(() => {
  if (typeof TIME === 'undefined' || typeof THREE === 'undefined' || typeof WORLD === 'undefined') return;
  const T = TIME, _ = T._, A = T.API, OFF = A.OFF;
  const G = () => _.G;
  const K = 3;                                   // (minimap.js's picture: pixels per world unit)
  const INK = '#2b2235';
  const LANDS = {}, BUILT = {};
  let cur = null;
  const err = (where, e) => console.error('[land] ' + where, e);
  const tA = (x, z) => WORLD.terrainAt(x, z);
  const DEEP = () => WORLD.L.water - 0.6;
  const ss = (a, b, x) => smoothstep(a, b, x);
  const hexRGB = s => { const c = new THREE.Color(s); return [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)]; };
  const lighter = (s, k = 0.35) => '#' + new THREE.Color(s).lerp(new THREE.Color('#ffffff'), k).getHexString();

  // ------------------------------------------------------------ declaring a land
  function land(rid, w, spec) {
    const S = Object.assign({ rid, w }, spec || {});
    for (const k of ['ground', 'forms', 'looks', 'lines', 'keep', 'leaves', 'decals']) S[k] = S[k] || [];
    S.water = S.water || {};
    S.forms.forEach((F, i) => { if (!F.id) F.id = S.rid + '.' + S.w + '.' + i; });
    if (S.heal) (S.heal.forms || []).forEach((F, i) => { if (!F.id) F.id = S.rid + '.' + S.w + '.h' + i; });
    LANDS[rid + ':' + w] = S;
    S.looks.forEach((L0, i) => lookSpot(S, L0, 'l' + i, false));
    if (S.heal) (S.heal.looks || []).forEach((L0, i) => lookSpot(S, L0, 'h' + i, true));
    return S;
  }
  const healOn = (S, st) => { if (!S || !S.heal || !S.heal.when) return false; try { return !!S.heal.when(st); } catch (e) { return false; } };
  // the land as it is now: with its heal laid over it once that world is freed (arrays add up; objects: the heal's win)
  function specOf(S, healed) {
    if (!healed || !S.heal) return Object.assign({}, S, { patch: null });
    const H = S.heal, drop = new Set(H.drop || []), W0 = S.water || {}, W1 = H.water || {}, T0 = S.trees || {}, T1 = H.trees || {};
    return Object.assign({}, S, {
      ground: S.ground.concat(H.ground || []), forms: S.forms.filter(f => !drop.has(f.id)).concat(H.forms || []),
      grass: H.grass ? Object.assign({}, S.grass, H.grass) : S.grass, arena: H.arena || S.arena, decals: S.decals.concat(H.decals || []),
      trees: { swap: T1.swap || T0.swap, add: (T0.add || []).concat(T1.add || []) },
      // (the heal can take a sheet, a bed or a flood away by naming it null)
      water: { sheet: 'sheet' in W1 ? W1.sheet : W0.sheet, streams: (W0.streams || []).concat(W1.streams || []), pools: (W0.pools || []).concat(W1.pools || []), bed: 'bed' in W1 ? W1.bed : W0.bed, flood: 'flood' in W1 ? W1.flood : W0.flood },
      leaves: H.leaves || S.leaves, flowers: H.flowers || S.flowers, tumble: H.tumble === undefined ? S.tumble : H.tumble, patch: H.patch || null,
      props: (S.props || []).concat(H.props || []), hide: H.hide || S.hide, trim: H.trim || S.trim,
    });
  }
  // how much of a spot the healed patch takes back (1 inside it)
  const patchK = (L0, x, z) => { const P = L0.patch; return P ? 1 - ss(P.r * 0.62, P.r, Math.hypot(x - P.x, z - P.z)) : 0; };

  // ------------------------------------------------------------ the forms: their shapes, their height where you walk
  function prep(F) {
    if (F._p) return F;
    F._p = true;
    F.c = Math.cos(F.rot || 0); F.s = Math.sin(F.rot || 0);
    F.walk = F.walk !== false && !F.solid;
    F.flat = F.kind === 'plate' || F.y !== undefined;
    if (F.kind === 'tongue') {
      const P = F.pts, seg = []; let s = 0, x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      const W = i => (Array.isArray(F.w) ? F.w[Math.min(i, F.w.length - 1)] : F.w), Hh = i => (Array.isArray(F.h) ? F.h[Math.min(i, F.h.length - 1)] : F.h);
      for (let i = 0; i < P.length - 1; i++) {
        const [ax, az] = P[i], [bx, bz] = P[i + 1], l = Math.hypot(bx - ax, bz - az) || 1e-6;
        seg.push({ ax, az, ux: (bx - ax) / l, uz: (bz - az) / l, l, s, w0: W(i), w1: W(i + 1), h0: Hh(i), h1: Hh(i + 1) }); s += l;
      }
      for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      const wm = Math.max(...P.map((p, i) => W(i)));
      F.seg = seg; F.len = s; F.bx0 = x0 - wm; F.bx1 = x1 + wm; F.bz0 = z0 - wm; F.bz1 = z1 + wm;
    } else {
      const r = Math.max(F.rx, F.rz) + 0.01;
      F.bx0 = F.x - r; F.bx1 = F.x + r; F.bz0 = F.z - r; F.bz1 = F.z + r;
    }
    return F;
  }
  const localOf = (F, x, z) => { const dx = x - F.x, dz = z - F.z; return [dx * F.c - dz * F.s, dx * F.s + dz * F.c]; };
  const worldOf = (F, lx, lz) => [F.x + lx * F.c + lz * F.s, F.z - lx * F.s + lz * F.c];
  // 0..1 over the footprint (u along the form's own x, the wind's way for a dune; v across; t the ellipse's radius)
  function profile(F, u, v, t) {
    switch (F.kind) {
      case 'dune': {        // a long windward back and a steep lee face, the crest a little past the middle
        const a = u - 0.28, along = a < 0 ? 1 - (a / 1.28) * (a / 1.28) : 1 - (a / 0.72) * (a / 0.72);
        return Math.pow(Math.max(0, along) * Math.max(0, 1 - v * v), 1.2) * (1 - ss(0.8, 1, t));
      }
      case 'drift': {       // a drift banked against something: steep on its +u side, a long tail
        const a = u - 0.45, along = a < 0 ? 1 - (a / 1.45) * (a / 1.45) : 1 - (a / 0.55) * (a / 0.55);
        return Math.pow(Math.max(0, along) * Math.max(0, 1 - v * v), 0.9) * (1 - ss(0.82, 1, t));
      }
      case 'heap': return Math.pow(Math.max(0, 1 - t), 1.1) * (1 - ss(0.9, 1, t) * 0.4);
      case 'rubble': return Math.pow(Math.max(0, 1 - t), 1.3) * (1 + 0.14 * Math.sin(u * 9.1 + v * 6.3) * Math.sin(u * 4.3 - v * 7.7));
      default: return (1 - t * t) * (1 - t * t);
    }
  }
  function tongueAt(F, x, z) {     // { d (from the middle line), s (along), w, h } or null
    let best = null;
    for (const g of F.seg) {
      const t = clamp((x - g.ax) * g.ux + (z - g.az) * g.uz, 0, g.l), px = g.ax + g.ux * t, pz = g.az + g.uz * t, d = Math.hypot(x - px, z - pz);
      if (!best || d < best.d) best = { d, s: g.s + t, w: lerp(g.w0, g.w1, t / g.l), h: lerp(g.h0, g.h1, t / g.l) };
    }
    return best && best.d < best.w ? best : null;
  }
  function topOf(F, x, z) {
    if (x < F.bx0 || x > F.bx1 || z < F.bz0 || z > F.bz1) return null;
    if (F.kind === 'tongue') { const q = tongueAt(F, x, z); if (!q) return null; const e = q.d / q.w; return tA(x, z) + q.h * Math.pow(Math.max(0, 1 - e * e * e * e), 0.45) - 0.04; }
    const [lx, lz] = localOf(F, x, z), u = lx / F.rx, v = lz / F.rz, t = Math.hypot(u, v);
    if (t >= 1) return null;
    if (F.flat) { const y = F.y - 0.05 * ss(0.86, 1, t), h = tA(x, z); return h < DEEP() && y < h + 0.21 ? h + 0.21 : y; }     // (over deep water a plate stands 0.2 clear of the bed, or sim.js would call you stranded)
    return tA(x, z) + F.h * profile(F, u, v, t) - 0.03;
  }

  // ------------------------------------------------------------ the plants (one merged, vertex-colored geometry each, base at y 0)
  const PL = {};
  function rod(list, x, y, z, len, r0, r1, ang, tilt, color) {
    const dx = -Math.sin(tilt) * Math.cos(ang), dy = Math.cos(tilt), dz = Math.sin(tilt) * Math.sin(ang);
    list.push({ geo: new THREE.CylinderGeometry(r1, r0, len, 6), m: TK.M4(x + dx * len / 2, y + dy * len / 2, z + dz * len / 2, 1, 1, 1, ang, 0, tilt), color });
    return [x + dx * len, y + dy * len, z + dz * len];
  }
  function branchy(L, trunk, bark, twig, R, o = {}) {       // a bare crown: main limbs, each forking into twigs
    const top = rod(L, 0, 0, 0, o.h || 2.4, o.r0 || 0.26, o.r1 || 0.15, 0, 0.04, trunk);
    const n = o.n || 5;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + R() * 0.6, y = (o.h || 2.4) * (0.55 + 0.45 * i / n), tilt = 0.55 + R() * 0.45;
      const e = rod(L, 0, y, 0, (o.len || 1.5) * (0.8 + R() * 0.4), 0.09, 0.05, a, tilt, bark);
      for (let j = 0; j < (o.twigs || 2); j++) rod(L, e[0], e[1], e[2], 0.5 + R() * 0.5, 0.045, 0.02, a + (j ? 0.7 : -0.7) + R() * 0.3, 0.35 + R() * 0.5, twig);
    }
    return top;
  }
  const BUILD = {
    dead(R) { const L = []; branchy(L, '#6b6159', '#6f655c', '#7a7067', R, { h: 2.5, n: 5, len: 1.6 }); return L; },
    bare(R) { const L = []; branchy(L, '#6e5038', '#6a4c36', '#7d5c42', R, { h: 2.4, n: 6, len: 1.5, twigs: 3 }); return L; },
    bareBirch(R) { const L = []; branchy(L, '#ece6da', '#6f5a48', '#7d6a58', R, { h: 3.2, n: 5, len: 1.2, r0: 0.18, r1: 0.12, twigs: 3 }); for (let i = 0; i < 5; i++) L.push({ geo: new THREE.BoxGeometry(0.2, 0.05, 0.02), m: TK.M4(Math.cos(i * 2) * 0.17, 0.5 + i * 0.5, Math.sin(i * 2) * 0.17, 1, 1, 1, i * 2, 0, 0), color: '#3a3430' }); return L; },
    snag(R) { const L = []; rod(L, 0, 0, 0, 4.2, 0.22, 0.06, 0, 0.03, '#5e554e'); for (let i = 0; i < 7; i++) rod(L, 0, 1.4 + i * 0.4, 0, 0.5 + R() * 0.4, 0.05, 0.02, i * 2.1, 1.2 + R() * 0.3, '#6a6058'); return L; },
    stump() { return [{ geo: new THREE.CylinderGeometry(0.32, 0.4, 0.5, 9), m: TK.M4(0, 0.25, 0, 1), color: '#7a6046' }, { geo: new THREE.CylinderGeometry(0.31, 0.31, 0.04, 9), m: TK.M4(0, 0.51, 0, 1), color: '#d6b888' }]; },
    oak(R) {
      const L = []; rod(L, 0, 0, 0, 2.2, 0.36, 0.24, 0, 0.03, '#5f4230');
      [[0, 3.4, 0, 1.6], [1.1, 3.0, 0.4, 1.2], [-1.1, 3.1, -0.3, 1.25], [0.3, 4.2, -0.4, 1.15], [-0.4, 3.0, 1.0, 1.05], [0.5, 3.1, -1.0, 1.05], [-0.9, 3.8, 0.6, 0.9]]
        .forEach(([x, y, z, r], i) => L.push({ geo: TK.G.ico1, m: TK.M4(x, y, z, r, r * 0.86, r), color: ['#3d7a34', '#467f38', '#356c2c', '#4c8a3e', '#3a7431', '#42803a', '#4f8f40'][i] }));
      return L;
    },
    chestnut(R) {
      const L = []; rod(L, 0, 0, 0, 2.0, 0.3, 0.2, 0, 0.03, '#6a4a34');
      [[0, 3.6, 0, 1.3, 1.5], [0.8, 3.0, 0.3, 1.0, 1.1], [-0.8, 3.1, -0.3, 1.0, 1.1], [0.1, 4.5, 0, 0.9, 1.0]].forEach(([x, y, z, r, ry], i) => L.push({ geo: TK.G.ico1, m: TK.M4(x, y, z, r, ry, r), color: ['#5a9442', '#4c8a3a', '#62a048', '#579a46'][i] }));
      for (let i = 0; i < 6; i++) { const a = i * 1.1; L.push({ geo: TK.G.ico0, m: TK.M4(Math.cos(a) * 1.1, 3.2 + (i % 3) * 0.5, Math.sin(a) * 1.1, 0.14), color: '#efe6a8' }); }
      return L;
    },
    hedge() { return [{ geo: TK.G.ico1, m: TK.M4(0, 0.55, 0, 1.05, 0.62, 0.55), color: '#3d7636' }, { geo: TK.G.ico1, m: TK.M4(0.45, 0.72, 0.05, 0.6, 0.42, 0.42), color: '#478240' }, { geo: TK.G.ico1, m: TK.M4(-0.5, 0.66, -0.05, 0.62, 0.44, 0.44), color: '#356c30' }]; },
    palm(R) {
      const L = []; let x = 0, y = 0;
      for (let i = 0; i < 6; i++) { const nx = x + 0.1 + i * 0.03; L.push({ geo: new THREE.CylinderGeometry(0.17 - i * 0.012, 0.19 - i * 0.012, 0.85, 7), m: TK.M4((x + nx) / 2, y + 0.42, 0, 1, 1, 1, 0, 0, -0.12 - i * 0.03), color: i % 2 ? '#9a7048' : '#8a6040' }); x = nx; y += 0.82; }
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; L.push({ geo: TK.G.ico1, m: TK.M4(x + Math.cos(a) * 1.05, y + 0.05 - (i % 2) * 0.2, Math.sin(a) * 1.05, 1.25, 0.1, 0.32, -a, 0, 0.42), color: i % 2 ? '#5fae4f' : '#4f9a45' }); }
      for (let i = 0; i < 3; i++) L.push({ geo: TK.G.ico0, m: TK.M4(x + Math.cos(i * 2.1) * 0.2, y - 0.18, Math.sin(i * 2.1) * 0.2, 0.16), color: '#7a5a34' });
      return L;
    },
    cactus() {
      return [{ geo: new THREE.CylinderGeometry(0.26, 0.3, 2.1, 9), m: TK.M4(0, 1.05, 0, 1), color: '#5f8f4a' }, { geo: TK.G.ico1, m: TK.M4(0, 2.1, 0, 0.26, 0.2, 0.26), color: '#6a9a52' },
        { geo: new THREE.CylinderGeometry(0.15, 0.17, 0.6, 7), m: TK.M4(0.42, 1.0, 0, 1, 1, 1, 0, 0, 1.57), color: '#5a8846' }, { geo: new THREE.CylinderGeometry(0.15, 0.16, 0.8, 7), m: TK.M4(0.7, 1.35, 0, 1), color: '#5f8f4a' },
        { geo: new THREE.CylinderGeometry(0.14, 0.16, 0.5, 7), m: TK.M4(-0.38, 1.35, 0, 1, 1, 1, 0, 0, 1.57), color: '#5a8846' }, { geo: new THREE.CylinderGeometry(0.13, 0.15, 0.55, 7), m: TK.M4(-0.6, 1.6, 0, 1), color: '#5f8f4a' },
        { geo: TK.G.ico0, m: TK.M4(0.02, 2.3, 0.05, 0.1), color: '#e6a0c4' }];
    },
    thorn(R) {
      const L = [{ geo: TK.G.ico1, m: TK.M4(0, 0.45, 0, 0.55, 0.45, 0.55), color: '#4f463a' }];
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + R() * 0.3, tilt = 0.6 + R() * 0.9; rod(L, Math.cos(a) * 0.2, 0.35, Math.sin(a) * 0.2, 0.9 + R() * 0.6, 0.05, 0.005, a, tilt, i % 3 ? '#5a5044' : '#6e6455'); }
      return L;
    },
    reed(R) { const L = []; for (let i = 0; i < 8; i++) { const a = i * 2.4, r = 0.12 + (i % 3) * 0.08, h = 1.1 + R() * 0.6; L.push({ geo: new THREE.ConeGeometry(0.035, h, 4), m: TK.M4(Math.cos(a) * r, h / 2, Math.sin(a) * r, 1, 1, 1, 0, Math.cos(a) * 0.12, Math.sin(a) * 0.12), color: i % 2 ? '#b8a65a' : '#a89a50' }); if (i % 3 === 0) L.push({ geo: new THREE.CylinderGeometry(0.05, 0.05, 0.22, 5), m: TK.M4(Math.cos(a) * r, h - 0.05, Math.sin(a) * r, 1), color: '#7a5a3a' }); } return L; },
    reedGreen(R) { return BUILD.reed(R).map(p => Object.assign({}, p, { color: p.color === '#7a5a3a' ? '#6a4a30' : (p.color === '#b8a65a' ? '#6fa04a' : '#5f9440') })); },
    willow(R) {
      const L = []; rod(L, 0, 0, 0, 2.2, 0.3, 0.2, 0, 0.06, '#6a5240');
      L.push({ geo: TK.G.ico1, m: TK.M4(0, 3.2, 0, 1.5, 1.0, 1.5), color: '#6aa84a' });
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; L.push({ geo: TK.G.ico1, m: TK.M4(Math.cos(a) * 1.3, 2.2, Math.sin(a) * 1.3, 0.42, 1.25, 0.42), color: i % 2 ? '#78b456' : '#5f9a42' }); }
      return L;
    },
    fruit(R) {
      const L = []; rod(L, 0, 0, 0, 1.8, 0.22, 0.15, 0, 0.04, '#7a5a40');
      [[0, 2.7, 0, 1.15], [0.7, 2.4, 0.3, 0.85], [-0.7, 2.5, -0.2, 0.9], [0.2, 3.2, -0.3, 0.8]].forEach(([x, y, z, r], i) => L.push({ geo: TK.G.ico1, m: TK.M4(x, y, z, r), color: ['#5aa84a', '#66b456', '#4f9a42', '#6ab858'][i] }));
      for (let i = 0; i < 12; i++) { const a = i * 0.9, h = 2.2 + (i % 4) * 0.35; L.push({ geo: TK.G.ico0, m: TK.M4(Math.cos(a) * 1.0, h, Math.sin(a) * 1.0, 0.12), color: i % 3 ? '#ffd6e4' : '#ffffff' }); }
      return L;
    },
    pineSnow() {
      const L = [{ geo: new THREE.CylinderGeometry(0.18, 0.3, 1.8, 7), m: TK.M4(0, 0.9, 0, 1), color: '#6a4c36' }];
      [[1.0, 2.0, 2.2], [0.82, 3.1, 1.9], [0.6, 4.0, 1.5]].forEach(([r, y, h], i) => { L.push({ geo: new THREE.ConeGeometry(r * 1.6, h * 1.4, 9), m: TK.M4(0, y, 0, 1), color: ['#2f5a46', '#355f4a', '#3b6a52'][i] }); L.push({ geo: new THREE.ConeGeometry(r * 1.3, h * 0.62, 9), m: TK.M4(0, y + h * 0.42, 0, 1), color: '#f4f8fb' }); });
      return L;
    },
    stonepine(R) {
      const L = []; rod(L, 0, 0, 0, 3.4, 0.24, 0.16, R() * 6, 0.12, '#7a5a40');
      [[0, 3.9, 0, 2.2, 0.62], [0.9, 3.6, 0.5, 1.4, 0.5], [-0.8, 3.7, -0.4, 1.5, 0.5]].forEach(([x, y, z, r, h], i) => L.push({ geo: TK.G.ico1, m: TK.M4(x, y, z, r, h, r), color: ['#3f6f3a', '#4a7a42', '#386634'][i] }));
      return L;
    },
    pine() {
      const L = [{ geo: new THREE.CylinderGeometry(0.16, 0.26, 1.6, 7), m: TK.M4(0, 0.8, 0, 1), color: '#6a4c36' }];
      [[1.0, 1.9, 2.2], [0.82, 3.0, 1.9], [0.6, 3.9, 1.5]].forEach(([r, y, h], i) => L.push({ geo: new THREE.ConeGeometry(r * 1.5, h * 1.4, 8), m: TK.M4(0, y, 0, 1), color: ['#2f7a44', '#37874b', '#3f9452'][i] }));
      return L;
    },
    thistle(R) {
      const L = [];
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; L.push({ geo: new THREE.ConeGeometry(0.09, 0.62, 4), m: TK.M4(Math.cos(a) * 0.2, 0.12, Math.sin(a) * 0.2, 1, 1, 0.4, Math.PI - a, 0, 1.25), color: i % 2 ? '#6a8458' : '#5f7a4e' }); }
      for (let i = 0; i < 3; i++) { const a = i * 2.1 + R() * 0.4, h = 0.75 + i * 0.18, x = Math.cos(a) * 0.12, z = Math.sin(a) * 0.12; L.push({ geo: new THREE.CylinderGeometry(0.02, 0.025, h, 4), m: TK.M4(x, h / 2, z, 1), color: '#5f7a4e' }, { geo: TK.G.ico0, m: TK.M4(x, h + 0.04, z, 0.09, 0.11, 0.09), color: '#7f9a62' }, { geo: TK.G.ico0, m: TK.M4(x, h + 0.13, z, 0.08, 0.07, 0.08), color: '#9a5fb4' }); }
      return L;
    },
    nettle(R) { const L = []; for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.08 + (i % 3) * 0.1, h = 0.55 + R() * 0.35; L.push({ geo: new THREE.ConeGeometry(0.1, h, 4), m: TK.M4(Math.cos(a) * r, h / 2, Math.sin(a) * r, 1, 1, 0.35, a, Math.cos(a) * 0.15, Math.sin(a) * 0.15), color: i % 2 ? '#3f6a3a' : '#4a7842' }); } return L; },
    sapling() { return [{ geo: new THREE.CylinderGeometry(0.05, 0.07, 1.3, 6), m: TK.M4(0, 0.65, 0, 1), color: '#7a5a40' }, { geo: TK.G.ico1, m: TK.M4(0, 1.45, 0, 0.45, 0.5, 0.45), color: '#6ab848' }, { geo: TK.G.ico1, m: TK.M4(0.2, 1.2, 0.1, 0.28), color: '#7cc85a' }]; },
    sprout() { const L = []; for (let i = 0; i < 7; i++) { const a = i * 0.9, r = (i % 3) * 0.1; L.push({ geo: new THREE.ConeGeometry(0.03, 0.34, 4), m: TK.M4(Math.cos(a) * r, 0.17, Math.sin(a) * r, 1, 1, 1, 0, Math.cos(a) * 0.3, Math.sin(a) * 0.3), color: i % 2 ? '#7cc85a' : '#5fae44' }); } return L; },
    flowers() { const L = [], C = ['#ffd84a', '#ff8fb1', '#ffffff', '#b9a2ff', '#ff7a59']; for (let i = 0; i < 7; i++) { const a = i * 2.4, r = 0.15 + (i % 3) * 0.14, h = 0.28 + (i % 2) * 0.12; L.push({ geo: new THREE.CylinderGeometry(0.012, 0.012, h, 4), m: TK.M4(Math.cos(a) * r, h / 2, Math.sin(a) * r, 1), color: '#4f8a3a' }, { geo: TK.G.ico0, m: TK.M4(Math.cos(a) * r, h, Math.sin(a) * r, 0.07, 0.045, 0.07), color: C[i % C.length] }); } return L; },
    boulder() { return [{ geo: new THREE.DodecahedronGeometry(1, 0), m: TK.M4(0, 0.35, 0, 0.9, 0.62, 0.8), color: '#8c8780' }, { geo: new THREE.DodecahedronGeometry(1, 0), m: TK.M4(0.45, 0.22, 0.3, 0.42, 0.35, 0.4, 0.7), color: '#7d7872' }]; },
    tumble() { return [{ geo: TK.G.ico1, m: TK.M4(0, 0, 0, 0.42), color: '#a8885a' }, { geo: TK.G.ico0, m: TK.M4(0, 0, 0, 0.5, 0.46, 0.5, 0.6, 0.4), color: '#8a6e48' }]; },
    moss() { return [{ geo: TK.G.ico1, m: TK.M4(0, 0.05, 0, 0.8, 0.12, 0.65), color: '#5f9a46' }, { geo: TK.G.ico1, m: TK.M4(0.5, 0.06, 0.3, 0.45, 0.1, 0.4), color: '#74ac52' }]; },
    stone(R) { const L = []; branchy(L, '#8a8a8e', '#7d7d82', '#95959a', R, { h: 2.6, n: 4, len: 1.4, r0: 0.3, r1: 0.2, twigs: 1 }); return L; },
    lily() { return [{ geo: new THREE.CylinderGeometry(0.42, 0.42, 0.02, 12, 1, false, 0.3, TAU - 0.6), m: TK.M4(0, 0, 0, 1), color: '#4f9a45' }, { geo: new THREE.CylinderGeometry(0.26, 0.26, 0.025, 10), m: TK.M4(0.45, 0.005, 0.35, 1), color: '#5fae4f' },
      { geo: TK.G.ico0, m: TK.M4(0.05, 0.08, -0.05, 0.12, 0.09, 0.12), color: '#ff9fc4' }, { geo: TK.G.ico0, m: TK.M4(0.05, 0.12, -0.05, 0.05), color: '#ffe680' }]; },
    pebbles(R) { const L = []; for (let i = 0; i < 6; i++) { const a = i * 1.9, r = 0.2 + (i % 3) * 0.25; L.push({ geo: new THREE.DodecahedronGeometry(1, 0), m: TK.M4(Math.cos(a) * r, 0.04, Math.sin(a) * r, 0.16 + (i % 2) * 0.08, 0.07, 0.13 + (i % 3) * 0.04, a), color: ['#b9ae9a', '#a89e8a', '#c8bfab'][i % 3] }); } return L; },
  };
  // what kind of thing each one is: a tree (tall, sways, fades by the camera, casts a shadow), its collider's radius, minimap colors
  const KIND = {
    dead: { tree: 1, r: 0.42, map: '#8a8278' }, bare: { tree: 1, r: 0.42, map: '#8f7a64' }, bareBirch: { tree: 1, r: 0.36, map: '#a39686' }, snag: { tree: 1, r: 0.36, map: '#7a7068' },
    stump: { r: 0.42, map: '#a8865a' }, oak: { tree: 1, r: 0.5, map: '#3f7a34' }, chestnut: { tree: 1, r: 0.45, map: '#5a9442' }, hedge: { r: 0, map: '#3d7636' },
    palm: { tree: 1, r: 0.32, map: '#5fae4f' }, cactus: { r: 0.4, map: '#5f8f4a' }, thorn: { r: 0.55, map: '#5a5044' }, reed: { r: 0, map: '#b8a65a' }, reedGreen: { r: 0, map: '#6fa04a' },
    willow: { tree: 1, r: 0.42, map: '#6aa84a' }, fruit: { tree: 1, r: 0.36, map: '#6ab858' }, pineSnow: { tree: 1, r: 0.42, map: '#e9f0f4' }, sapling: { r: 0.18, map: '#6ab848' },
    sprout: { r: 0, map: '#7cc85a' }, flowers: { r: 0, map: '#ffd84a' }, boulder: { r: 0.85, map: '#a8a39a' }, tumble: { r: 0, map: '#a8885a' }, moss: { r: 0, map: '#5f9a46' }, stone: { tree: 1, r: 0.45, map: '#8a8a8e' },
    lily: { r: 0, map: '#4f9a45', yo: 0.1 }, pebbles: { r: 0, map: '#c8bfab' },
    pine: { tree: 1, r: 0.42, map: '#3f8a4a' }, thistle: { r: 0, map: '#7a6a8a' }, nettle: { r: 0, map: '#4a7842' }, stonepine: { tree: 1, r: 0.36, map: '#3f6f3a' },
  };
  function plantGeo(kind) {
    if (PL[kind]) return PL[kind];
    const f = BUILD[kind] || BUILD.dead, R = rng(kind.length * 977 + kind.charCodeAt(0));
    return (PL[kind] = TK.merge(f(R)));
  }
  let swayMat = null, plainMat = null;
  function matFor(kind) {
    if (!plainMat) plainMat = TK.toon('#ffffff', { vc: 1, rim: 0.18 });
    if (!KIND[kind] || !KIND[kind].tree) return plainMat;
    if (!swayMat) { const t = WORLD.trees.find(q => q._im && !q.wall && q.kind === 'round'); swayMat = t ? t._im.material : plainMat; }
    return swayMat;
  }

  // ------------------------------------------------------------ building a land's things (once per land and heal state; then shown and hidden)
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
  function inBox(B, x, z, pad = 0) { return !!B && x >= B.x0 - pad && x <= B.x1 + pad && z >= B.z0 - pad && z <= B.z1 + pad; }
  function build(L0, key) {
    const g = G(), scene = g.w3d.scene, B = { key, objs: [], forms: [], walk: [], solids: [], swapped: [], gone: [], plants: {}, streams: [], pools: [], tumble: null, plat: null, pbox: null, bed: null, flood: null, decks: [] };
    const R = T.REGIONS[L0.rid], inReach = (x, z) => { try { return !!(R && R.inside(x, z)); } catch (e) { return false; } };
    B.inReach = inReach;
    // the forms: one merged mesh with an ink hull, and one platform for all the walkable ones
    B.forms = L0.forms.map(F => prep(Object.assign({}, F)));
    B.walk = B.forms.filter(F => F.walk);
    if (B.forms.length) {
      const geo = formsGeo(B.forms), mesh = new THREE.Mesh(geo, TK.toon('#ffffff', { vc: 1, rim: 0.1 })), hull = new THREE.Mesh(geo, TK.outlineMat(0.05));
      mesh.receiveShadow = true; mesh.castShadow = true; mesh.name = 'land-forms-' + key; hull.name = 'land-ink-' + key;
      B.objs.push(mesh, hull);
      for (const F of B.forms) if (F.solid) B.solids.push(...solidRing(F));
    }
    // the plants: world.js's trees swapped, and the ones added
    const inst = {};
    const put = (kind, x, z, s, seed, col, yaw, y) => { (inst[kind] || (inst[kind] = [])).push({ x, z, s, seed, col, yaw, y }); };
    const TR = L0.trees || {};
    if (TR.swap && L0.box) {
      for (const t of WORLD.trees) {
        if (!t._im || !inBox(L0.box, t.x, t.z)) continue;
        let k; try { k = TR.swap(t, L0); } catch (e) { k = undefined; }
        if (k === undefined) continue;
        if (k === null) { B.gone.push(t); continue; }
        B.swapped.push(t); put(k, t.x, t.z, t.s * (t.wall ? 1.08 : 1), t.seed);
      }
    }
    for (const a of TR.add || []) {
      put(a.kind, a.x, a.z, a.s || 1, a.seed === undefined ? ((a.x * 0.37 + a.z * 0.11) % 1 + 1) % 1 : a.seed, a.col, a.yaw, a.y);
      const kr = KIND[a.kind] ? KIND[a.kind].r : 0.4;
      if (kr > 0 && inReach(a.x, a.z)) B.solids.push({ x: a.x, z: a.z, r: kr * (a.s || 1) + 0.08 });
    }
    for (const [kind, list] of Object.entries(inst)) {
      const geo0 = plantGeo(kind), geo = new THREE.BufferGeometry();
      Object.keys(geo0.attributes).forEach(a => geo.setAttribute(a, geo0.attributes[a])); if (geo0.index) geo.setIndex(geo0.index);
      const im = new THREE.InstancedMesh(geo, matFor(kind), list.length);
      let cx = 0, cz = 0, y0 = 1e9, y1 = -1e9, r = 0;
      list.forEach((p, i) => {
        const y = (p.y !== undefined ? p.y : tA(p.x, p.z) - (KIND[kind] && KIND[kind].tree ? 0.1 : 0.02)) + ((KIND[kind] && KIND[kind].yo) || 0);
        im.setMatrixAt(i, _m.compose(_v.set(p.x, y, p.z), _q.setFromEuler(_e.set(0, p.yaw !== undefined ? p.yaw : p.seed * TAU, 0)), _s.set(p.s, p.s * (0.94 + p.seed * 0.14), p.s)));
        const k = 0.88 + p.seed * 0.22; im.setColorAt(i, p.col ? _c.set(p.col) : _c.setRGB(k, k, k * (0.96 + 0.08 * p.seed)));
        cx += p.x; cz += p.z; y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      });
      cx /= list.length; cz /= list.length; list.forEach(p => { r = Math.max(r, Math.hypot(p.x - cx, p.z - cz) + 5 * p.s); });
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, (y0 + y1) / 2 + 3, cz), Math.hypot(r, (y1 - y0) / 2 + 6));
      im.castShadow = !!(KIND[kind] && KIND[kind].tree) || kind === 'boulder' || kind === 'cactus'; im.receiveShadow = true; im.name = 'land-' + kind + '-' + key;
      B.plants[kind] = { im, list }; B.objs.push(im);
    }
    // water: streams, pools, a dry bed, a flood
    const W0 = L0.water || {};
    for (const St of W0.streams || []) { const m = streamMesh(St); if (m) { B.objs.push(m); B.streams.push({ pts: St.pts, w: St.w || 1.6, line: splineOf(St.pts) }); } }
    for (const P of W0.pools || []) { B.objs.push(poolMesh(P)); B.pools.push(P); }
    if (W0.bed) { const bm = bedMesh(W0.bed, L0.box); if (bm) B.objs.push(bm); B.bed = W0.bed; }
    if (W0.flood) { B.flood = W0.flood; const fm = floodMesh(W0.flood, L0.box); if (fm) B.objs.push(fm); B.decks = (W0.flood.decks || []).map(p => Object.assign({}, p, { _box: p.box ? p.box.slice() : null, _seg: p.seg ? p.seg.slice() : null })); WORLD.addPlatforms(B.decks); }
    // decals: cracked earth, furrows, salt laid on the ground
    if (L0.decals.length) { const dm = decalMesh(L0.decals); if (dm) B.objs.push(dm); }
    // props: small things that go with the land (a woodpile, a hoe in the dust), in past.js's toon kit: one merged mesh and its ink
    if (L0.props && L0.props.length && typeof PAST !== 'undefined' && PAST.API && PAST.API.Kit) {
      const k = PAST.API.Kit(), KG = PAST.API.KG, grp = new THREE.Group(); grp.name = 'land-props-' + key;
      for (const P of L0.props) { try { P.build(k, KG, tA(P.x, P.z), P); } catch (e) { err('prop', e); } if (P.r && inReach(P.x, P.z)) B.solids.push({ x: P.x, z: P.z, r: P.r }); }
      k.build(grp); B.objs.push(grp);
    }
    // tumbleweeds
    if (L0.tumble && L0.tumble.n) {
      const n = L0.tumble.n, im = new THREE.InstancedMesh(plantGeo('tumble'), matFor('tumble'), n), Rt = rng(n * 31 + 7);
      im.frustumCulled = false; im.castShadow = true; im.name = 'land-tumble-' + key;
      for (let i = 0; i < n; i++) im.setColorAt(i, _c.setRGB(1, 1, 1));       // (every instanced mesh on a shared material has colors: r128 keeps one program for both)
      B.tumble = { im, box: L0.tumble.box, list: Array.from({ length: n }, () => ({ x: lerp(L0.tumble.box.x0, L0.tumble.box.x1, Rt()), z: lerp(L0.tumble.box.z0, L0.tumble.box.z1, Rt()), sp: 1.2 + Rt() * 1.4, ph: Rt() * TAU, rot: 0 })) };
      B.objs.push(im);
    }
    for (const o of B.objs) { o.visible = false; scene.add(o); }
    // the walkable surface: one platform over the walkable forms and the dry bed (parked while the land is off)
    if (B.walk.length || B.bed) {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (const F of B.walk) { x0 = Math.min(x0, F.bx0); x1 = Math.max(x1, F.bx1); z0 = Math.min(z0, F.bz0); z1 = Math.max(z1, F.bz1); }
      if (B.bed && L0.box) { x0 = Math.min(x0, L0.box.x0); x1 = Math.max(x1, L0.box.x1); z0 = Math.min(z0, L0.box.z0); z1 = Math.max(z1, L0.box.z1); }
      B.pbox = [x0, x1, z0, z1];
      B.plat = { box: [OFF, OFF + 1, OFF, OFF + 1], fn: (x, z) => walkTop(B, x, z), land: true };
      WORLD.addPlatforms([B.plat]);
    }
    if (B.solids.length) { WORLD.addSolids(B.solids); B.solids.forEach(c => { c._x = c.x; c._z = c.z; c.x = OFF; c.z = OFF; }); }
    return B;
  }
  // the bed's height over its ground: a skim near the old shore, at least 0.2 over the terrain where the water was deep
  const bedOff = h => lerp(0.03, 0.22, ss(DEEP() + 0.22, DEEP() - 0.04, h));
  function bedTop(bed, x, z) {
    const h = tA(x, z); if (h < bed.level + 0.02 || h > WORLD.L.water + 0.35) return null;
    if (bed.area && !bed.area(x, z)) return null;
    return h + bedOff(h);
  }
  function walkTop(B, x, z) {
    let top = null;
    for (const F of B.walk) { const y = topOf(F, x, z); if (y !== null && (top === null || y > top)) top = y; }
    if (B.bed) { const y = bedTop(B.bed, x, z); if (y !== null && (top === null || y > top)) top = y; }
    return top;
  }
  // a solid form (a glacier's wall, a boulder field): a ring of solids round its foot, so you can't walk into it
  function solidRing(F) {
    const out = [];
    if (F.kind === 'tongue') { for (let s = 0; s < F.len; s += 1.6) { const g = F.seg.find(q => s >= q.s && s <= q.s + q.l) || F.seg[F.seg.length - 1], t = s - g.s, w = lerp(g.w0, g.w1, t / g.l); out.push({ x: g.ax + g.ux * t, z: g.az + g.uz * t, r: w * 0.92 }); } return out; }
    const n = Math.max(6, Math.round((F.rx + F.rz) * 1.2));
    for (let i = 0; i < n; i++) { const a = i / n * TAU, [x, z] = worldOf(F, Math.cos(a) * F.rx * 0.78, Math.sin(a) * F.rz * 0.78); out.push({ x, z, r: Math.min(F.rx, F.rz) * 0.32 + 0.3 }); }
    out.push({ x: F.x, z: F.z, r: Math.min(F.rx, F.rz) * 0.7 });
    return out;
  }

  // ------------------------------------------------------------ meshes: the forms (rings over each footprint, a ribbon down a tongue)
  const FORM_COL = { dune: ['#e3c98f', '#d4b57a'], drift: ['#f4f8fb', '#dfe8f0'], mound: ['#8f9a6a', '#7f8a5c'], heap: ['#c9c2b2', '#b3ab9a'], rubble: ['#9a958c', '#857f76'],
    plate: ['#dbe9f2', '#c6dbe8'], tongue: ['#e8f3fb', '#cfe3f2'] };
  function formsGeo(forms) {
    const pos = [], col = [], idx = [], c0 = new THREE.Color(), c1 = new THREE.Color(), c = new THREE.Color(), cv = new THREE.Color();
    for (const F of forms) {
      const P = FORM_COL[F.kind] || FORM_COL.mound;
      c0.set(F.col || P[0]); c1.set(F.col2 || P[1]); cv.set(F.foot || F.col2 || P[1]);
      const base = pos.length / 3;
      if (F.kind === 'tongue') {
        const step = 1.1, n = Math.max(2, Math.ceil(F.len / step)), NA = 13;
        for (let i = 0; i <= n; i++) {
          const s = Math.min(F.len, i * step), g = F.seg.find(q => s >= q.s && s <= q.s + q.l + 1e-6) || F.seg[F.seg.length - 1], t = s - g.s;
          const cx = g.ax + g.ux * t, cz = g.az + g.uz * t, w = lerp(g.w0, g.w1, t / g.l), hh = lerp(g.h0, g.h1, t / g.l), nx = -g.uz, nz = g.ux;
          for (let j = 0; j < NA; j++) {
            const e = (j / (NA - 1)) * 2 - 1, x = cx + nx * e * w * 1.02, z = cz + nz * e * w * 1.02, ae = Math.abs(e);
            const y = ae >= 0.999 ? tA(x, z) - 0.08 : tA(x, z) + hh * Math.pow(Math.max(0, 1 - ae * ae * ae * ae), 0.45) - 0.04;
            pos.push(x, y, z);
            const band = ss(0.82, 0.96, Math.sin(s * 0.75 + e * 1.7 + Math.sin(s * 0.21) * 2)) * (1 - ss(0.75, 0.95, ae));
            c.copy(c0).lerp(c1, 0.5 + 0.5 * Math.sin(s * 0.33 + e * 3.1)).lerp(cv.set(F.crevasse || '#6f9fca'), band * 0.85).lerp(_c.set(F.edge || '#8a8a92'), ss(0.8, 0.98, ae) * 0.75);
            col.push(c.r, c.g, c.b);
          }
        }
        for (let i = 0; i < n; i++) for (let j = 0; j < NA - 1; j++) { const a = base + i * NA + j, b = a + NA; idx.push(a, a + 1, b, a + 1, b + 1, b); }     // (wound to face up)
        continue;
      }
      const NR = F.flat ? 4 : 10, NS = Math.max(20, Math.min(44, Math.round((F.rx + F.rz) * 2.4)));
      // the middle, then rings out to the foot
      const [mx, mz] = worldOf(F, 0, 0); pos.push(mx, topOf(F, mx, mz) ?? tA(mx, mz), mz); c.copy(c0); col.push(c.r, c.g, c.b);
      for (let r = 1; r <= NR; r++) {
        const t = r / NR;
        for (let k = 0; k < NS; k++) {
          const a = k / NS * TAU, u = Math.cos(a) * t, v = Math.sin(a) * t, [x, z] = worldOf(F, u * F.rx, v * F.rz);
          const y = r === NR ? (F.flat ? F.y - 0.07 : tA(x, z) - 0.06) : (topOf(F, x, z) ?? tA(x, z));
          pos.push(x, y, z);
          const rip = F.kind === 'dune' ? 0.5 + 0.5 * Math.sin((u * F.rx) * 1.9 + Math.sin(v * F.rz * 0.5) * 1.6) : 0.5 + 0.5 * Math.sin(x * 0.9 + z * 0.7);
          c.copy(c0).lerp(c1, rip * 0.55 + (F.kind === 'dune' ? ss(0.2, 0.9, u) * 0.35 : 0)).lerp(cv, ss(0.55, 1, t) * (F.flat ? 0.2 : 0.65));
          col.push(c.r, c.g, c.b);
        }
      }
      for (let k = 0; k < NS; k++) idx.push(base, base + 1 + ((k + 1) % NS), base + 1 + k);          // (wound to face up)
      for (let r = 1; r < NR; r++) for (let k = 0; k < NS; k++) {
        const a = base + 1 + (r - 1) * NS + k, b = base + 1 + (r - 1) * NS + ((k + 1) % NS), a2 = a + NS, b2 = b + NS;
        idx.push(a, b, a2, b, b2, a2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  // ------------------------------------------------------------ water: a shader of its own (fog, a slow ripple, foam at the banks)
  let waterMat = null;
  function wMat() {
    if (waterMat) return waterMat;
    const g = G(), fog = g.w3d.scene.fog;
    waterMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime: g.w3d.time, uFog: { value: fog.color }, uFogNear: { value: 45 }, uFogFar: { value: 240 }, uShallow: { value: new THREE.Color('#7fd0e4') }, uDeep: { value: new THREE.Color('#2f78b0') } },
      vertexShader: 'attribute vec2 aW; varying vec2 vW; varying float vFogD; void main(){ vW = aW; vec4 mv = modelViewMatrix * vec4(position, 1.0); vFogD = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform float uTime; uniform vec3 uFog; uniform float uFogNear, uFogFar; uniform vec3 uShallow, uDeep; varying vec2 vW; varying float vFogD;
        void main(){
          float e = clamp(vW.x, 0.0, 1.0);
          vec3 col = mix(uDeep, uShallow, smoothstep(0.15, 0.95, e));
          float r = sin(vW.y * 2.6 - uTime * 2.2 + sin(e * 9.0 + uTime) * 0.9) * sin(vW.y * 1.1 + e * 4.0 - uTime * 1.3);
          col += smoothstep(0.55, 0.95, r) * 0.16;
          col = mix(col, vec3(0.94, 0.98, 1.0), smoothstep(0.8, 1.0, e) * 0.85);
          gl_FragColor = vec4(mix(col, uFog, smoothstep(uFogNear, uFogFar, vFogD)), 0.9);
        }`,
    });
    return waterMat;
  }
  function splineOf(pts, per = 5) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < per; k++) { const t = k / per, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }
  function lineDist(line, x, z) {
    let d = 1e9;
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, az] = line[i], [bx, bz] = line[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1) : 0;
      d = Math.min(d, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
    }
    return d;
  }
  function streamMesh(St) {
    const line = splineOf(St.pts), pos = [], aw = [], idx = [], w = St.w || 1.6; let s = 0;
    for (let i = 0; i < line.length; i++) {
      const [x, z] = line[i], [ax, az] = line[Math.max(0, i - 1)], [bx, bz] = line[Math.min(line.length - 1, i + 1)], l = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / l, nz = (bx - ax) / l;
      if (i) s += Math.hypot(x - line[i - 1][0], z - line[i - 1][1]);
      const y = Math.max(tA(x, z), tA(x + nx * w * 0.5, z + nz * w * 0.5), tA(x - nx * w * 0.5, z - nz * w * 0.5)) + 0.06;
      for (const e of [-1, -0.5, 0, 0.5, 1]) { pos.push(x + nx * e * w * 0.5, y, z + nz * e * w * 0.5); aw.push(Math.abs(e), s); }
      if (i) for (let j = 0; j < 4; j++) { const a = (i - 1) * 5 + j, b = i * 5 + j; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 2)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, wMat()); m.renderOrder = 2; m.name = 'land-stream'; return m;
  }
  function poolMesh(P) {
    const pos = [], aw = [], idx = [], NR = 6, NS = 36, y = (P.y !== undefined ? P.y : tA(P.x, P.z) + 0.08);
    pos.push(P.x, y, P.z); aw.push(0, 0);
    for (let r = 1; r <= NR; r++) for (let k = 0; k < NS; k++) { const a = k / NS * TAU, rr = P.r * r / NR * (1 + 0.06 * Math.sin(a * 3 + P.x)); pos.push(P.x + Math.cos(a) * rr, y, P.z + Math.sin(a) * rr); aw.push(r / NR, a * P.r); }
    for (let k = 0; k < NS; k++) idx.push(0, 1 + ((k + 1) % NS), 1 + k);
    for (let r = 1; r < NR; r++) for (let k = 0; k < NS; k++) { const a = 1 + (r - 1) * NS + k, b = 1 + (r - 1) * NS + ((k + 1) % NS); idx.push(a, b, a + NS, b, b + NS, a + NS); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 2)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, wMat()); m.renderOrder = 2; m.name = 'land-pool'; return m;
  }
  // canvas patterns: a cracked crust (salt or dried mud), cracked earth, furrows
  const TEX = {};
  function texOf(kind) {
    if (TEX[kind]) return TEX[kind];
    const t = TK.canvasTex(256, 256, (c, w, h) => {
      const R = rng(kind.length * 131 + 5);
      c.clearRect(0, 0, w, h);
      if (kind === 'salt') { c.fillStyle = '#ece8dc'; c.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { c.fillStyle = i % 2 ? 'rgba(210,204,190,0.6)' : 'rgba(250,248,242,0.7)'; c.beginPath(); c.ellipse(R() * w, R() * h, 6 + R() * 18, 4 + R() * 10, R() * 3, 0, TAU); c.fill(); } }
      if (kind === 'furrows') { c.strokeStyle = 'rgba(92,70,44,0.75)'; c.lineWidth = 9; for (let y = 8; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 16) c.lineTo(x, y + Math.sin(x * 0.05) * 2); c.stroke(); } c.strokeStyle = 'rgba(255,240,200,0.25)'; c.lineWidth = 3; for (let y = 22; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } return; }
      // the cracks: a web of polygons (a jittered grid, each cell's edges drawn)
      const N = 7, P = [];
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) P.push([i / N * w + (i % N ? (R() - 0.5) * 22 : 0), j / N * h + (j % N ? (R() - 0.5) * 22 : 0)]);
      c.strokeStyle = kind === 'salt' ? 'rgba(150,140,120,0.85)' : 'rgba(70,52,34,0.8)'; c.lineWidth = kind === 'salt' ? 2.2 : 3; c.lineJoin = 'round';
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const a = P[j * (N + 1) + i], b = P[j * (N + 1) + i + 1], d = P[(j + 1) * (N + 1) + i + 1], e = P[(j + 1) * (N + 1) + i];
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); c.stroke();
        if (R() < 0.5) { c.beginPath(); c.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); c.lineTo((a[0] + d[0]) / 2 + (R() - 0.5) * 10, (a[1] + d[1]) / 2); c.stroke(); }
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    return (TEX[kind] = t);
  }
  function decalMesh(list) {
    const byKind = {}; for (const D of list) (byKind[D.kind || 'cracks'] || (byKind[D.kind || 'cracks'] = [])).push(D);
    const grp = new THREE.Group(); grp.name = 'land-decals';
    for (const [kind, L] of Object.entries(byKind)) {
      const pos = [], uv = [], idx = [];
      for (const D of L) {
        const c = Math.cos(D.rot || 0), s = Math.sin(D.rot || 0), NX = Math.max(4, Math.ceil(D.rx)), NZ = Math.max(4, Math.ceil(D.rz)), base = pos.length / 3, sc = D.scale || (kind === 'furrows' ? 0.33 : 0.24);
        for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) {
          const lx = (i / NX * 2 - 1) * D.rx, lz = (j / NZ * 2 - 1) * D.rz, x = D.x + lx * c + lz * s, z = D.z - lx * s + lz * c;
          pos.push(x, tA(x, z) + 0.065, z); uv.push(kind === 'furrows' ? lx * sc : x * sc, kind === 'furrows' ? lz * sc : z * sc);
        }
        for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
          const lx = ((i + 0.5) / NX * 2 - 1), lz = ((j + 0.5) / NZ * 2 - 1); if (!D.box && lx * lx + lz * lz > 1) continue;     // (an oval unless it's a box)
          const a = base + j * (NX + 1) + i; idx.push(a, a + NX + 1, a + 1, a + 1, a + NX + 1, a + NX + 2);
        }
      }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
      const mat = new THREE.MeshToonMaterial({ map: texOf(kind), gradientMap: TK.grad, transparent: kind !== 'salt', depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.renderOrder = 1; grp.add(m);
    }
    return grp;
  }
  // the exposed bed of water gone down: a crust over it, at the walking height
  function bedMesh(bed, box) {
    if (!box) return null;
    const pos = [], uv = [], idx = [], at = new Map();
    const x0 = Math.floor(box.x0), x1 = Math.ceil(box.x1), z0 = Math.floor(box.z0), z1 = Math.ceil(box.z1);
    const vtx = (x, z) => { const k = x * 4096 + z; if (at.has(k)) return at.get(k); const h = tA(x, z), y = Math.max(h, bed.level - 0.06) + bedOff(Math.max(h, bed.level)); at.set(k, pos.length / 3); pos.push(x, y, z); uv.push(x * 0.2, z * 0.2); return at.get(k); };
    for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
      let any = false; for (const [dx, dz] of [[0.5, 0.5], [0.1, 0.1], [0.9, 0.9], [0.1, 0.9], [0.9, 0.1]]) if (bedTop(bed, x + dx, z + dz) !== null) { any = true; break; }
      if (!any) continue;
      const a = vtx(x, z), b = vtx(x + 1, z), c = vtx(x + 1, z + 1), d = vtx(x, z + 1);
      idx.push(a, d, b, b, d, c);
    }
    if (!idx.length) return null;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
    const mat = new THREE.MeshToonMaterial({ map: texOf(bed.tex || 'salt'), gradientMap: TK.grad, color: bed.col || '#ffffff' });
    const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.name = 'land-bed'; return m;
  }
  // (fl.draw: where to draw it, if not everywhere it's deep: a raised sea sheet may already cover the rest; fl.mat: that sheet's own
  // material, a function, so the seam doesn't show)
  function floodMesh(fl, box) {
    if (!box) return null;
    const pos = [], aw = [], idx = [], at = new Map(), drawAt = fl.draw || fl.area;
    const x0 = Math.floor(box.x0), x1 = Math.ceil(box.x1), z0 = Math.floor(box.z0), z1 = Math.ceil(box.z1);
    const vtx = (x, z) => { const k = x * 4096 + z; if (at.has(k)) return at.get(k); at.set(k, pos.length / 3); pos.push(x, fl.y, z); aw.push(0.3, x * 0.8 + z * 0.3); return at.get(k); };
    for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) { if (!drawAt(x + 0.5, z + 0.5)) continue; const a = vtx(x, z), b = vtx(x + 1, z), c = vtx(x + 1, z + 1), d = vtx(x, z + 1); idx.push(a, d, b, b, d, c); }
    if (!idx.length) return null;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 2)); geo.setIndex(idx);
    let mat = null; try { mat = typeof fl.mat === 'function' ? fl.mat() : fl.mat || null; } catch (e) { mat = null; }
    const m = new THREE.Mesh(geo, mat || wMat()); m.renderOrder = 2; m.name = 'land-flood'; return m;
  }
  WORLD.deepAt = (x, z) => { const c = cur, fl = c && c.B.flood; if (!fl) return false; try { return !!fl.area(x, z) && tA(x, z) < fl.y - 0.12; } catch (e) { return false; } };

  // ------------------------------------------------------------ putting it on and taking it off
  const terrainMesh = () => { const g = G(); return g && g.w3d ? g.w3d.scene.children.find(o => o.isMesh && o.userData && o.userData.recolor) : null; };
  const grassMat = () => { const g = G(); const m = g && g.w3d ? g.w3d.scene.children.find(o => o.material && o.material.uniforms && o.material.uniforms.uLand) : null; return m ? m.material : null; };
  let G1 = null;     // today's grass (the map's channel 1), kept once: nothing writes it after world.js
  function cellsOf(B) { const Lm = WORLD.L; return [Math.max(0, Math.floor(B.x0 - Lm.minX)), Math.min(WORLD.GW - 1, Math.ceil(B.x1 - Lm.minX)), Math.max(0, Math.floor(B.z0 - Lm.minZ)), Math.min(WORLD.GH - 1, Math.ceil(B.z1 - Lm.minZ))]; }
  const Q = { h: 0, g: 0, p: 0, hu: 0, sl: 0, heal: 0, x: 0, z: 0 };
  function fillQ(k, x, z, L0) {
    const M = WORLD.MAP;
    Q.h = WORLD.H[k]; Q.g = G1 ? G1[k] : M[k * 4 + 1]; Q.p = M[k * 4 + 3]; Q.hu = M[k * 4 + 2]; Q.x = x; Q.z = z;
    Q.sl = Math.hypot(tA(x + 0.5, z) - tA(x - 0.5, z), tA(x, z + 0.5) - tA(x, z - 0.5)); Q.heal = patchK(L0, x, z);
    return Q;
  }
  function layerAmt(Ly, x, z, q) { let a = 0; try { a = Ly.amt(x, z, q); } catch (e) { a = 0; } if (!(a > 0)) return 0; if (!Ly.heal) a *= 1 - q.heal; return Math.min(1, a); }
  function groundOn(c, on) {
    const terr = terrainMesh(), L0 = c.L, B = L0.box; if (!terr || !B) return;
    if (!on) { const cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2, r = Math.max(B.x1 - B.x0, B.z1 - B.z0) / 2 + 1; terr.userData.recolor(cx, cz, r); return; }
    if (!L0.ground.length) return;
    const col = terr.geometry.attributes.color, GW = WORLD.GW, Lm = WORLD.L, [i0, i1, j0, j1] = cellsOf(B);
    const layers = L0.ground.map(Ly => Object.assign({ c3: new THREE.Color(Ly.col) }, Ly));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * GW + i, x = Lm.minX + i, z = Lm.minZ + j, q = fillQ(k, x, z, L0);
      _c.setRGB(col.getX(k), col.getY(k), col.getZ(k));
      let ch = false;
      for (const Ly of layers) { const a = layerAmt(Ly, x, z, q); if (a > 0) { _c.lerp(Ly.c3, a); ch = true; } }
      if (ch) col.setXYZ(k, _c.r, _c.g, _c.b);
    }
    col.needsUpdate = true;
  }
  // how much a form, a stream, a pool or the bed covers a spot (no grass there)
  function covered(c, x, z) {
    for (const F of c.B.forms) { const y = topOf(F, x, z); if (y !== null && (F.flat || y > tA(x, z) + 0.04)) return true; }
    for (const S of c.B.streams) if (lineDist(S.line, x, z) < S.w * 0.5 + 0.35) return true;
    for (const P of c.B.pools) if (Math.hypot(x - P.x, z - P.z) < P.r + 0.4) return true;
    if (c.B.bed && bedTop(c.B.bed, x, z) !== null) return true;
    if (c.B.flood && WORLD.deepAt(x, z)) return true;
    return false;
  }
  function grassOn(c, on) {
    const L0 = c.L, B = L0.box, g = G(); if (!B || !g) return;
    const M = WORLD.MAP, GW = WORLD.GW, Lm = WORLD.L, [i0, i1, j0, j1] = cellsOf(B);
    if (!G1) { G1 = new Float32Array(GW * WORLD.GH); for (let k = 0; k < G1.length; k++) G1[k] = M[k * 4 + 1]; }
    const gm = grassMat();
    if (!on) {
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const k = j * GW + i; M[k * 4 + 1] = G1[k]; }
      if (gm) { gm.uniforms.uLand.value.set(0, 0, 0, 0); gm.uniforms.uLandHeal.value.set(0, 0, 0, 0); gm.uniforms.uLandH.value = 1; }
      g.w3d.mapTex.needsUpdate = true;
      return;
    }
    const GS = L0.grass || {};
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * GW + i, x = Lm.minX + i, z = Lm.minZ + j;
      let a = G1[k];
      if (GS.amt) { const q = fillQ(k, x, z, L0); let n = a; try { n = GS.amt(x, z, q); } catch (e) { n = a; } a = lerp(clamp(n, 0, 1), G1[k], q.heal); }
      if (a > 0 && covered(c, x, z)) a = 0;
      M[k * 4 + 1] = a;
    }
    g.w3d.mapTex.needsUpdate = true;
    if (gm && (GS.tip || GS.base || GS.h)) {
      const U = gm.uniforms, R = Math.max(B.x1 - B.x0, B.z1 - B.z0) * 0.5 * 1.12;
      U.uLand.value.set((B.x0 + B.x1) / 2, (B.z0 + B.z1) / 2, R, GS.k === undefined ? 1 : GS.k);
      U.uLandTip.value.set(GS.tip || '#9fd06a'); U.uLandBase.value.set(GS.base || '#3d7a32'); U.uLandH.value = GS.h || 1;
      const P = L0.patch; U.uLandHeal.value.set(P ? P.x : 0, P ? P.z : 0, P ? P.r : 0, P ? 1 : 0);
    }
  }
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  function treesOn(c, on) {
    const B = c.B, touched = new Set();
    const hide = (t, h) => {
      if (!t._im) return;
      if (h) { if (!t._m0) { t._m0 = new THREE.Matrix4(); t._im.getMatrixAt(t._i, t._m0); } t._im.setMatrixAt(t._i, ZERO); }
      else if (t._m0) t._im.setMatrixAt(t._i, t._m0);
      touched.add(t._im);
    };
    for (const t of B.swapped) hide(t, on);
    for (const t of B.gone) { hide(t, on); parkTree(t, on); }
    touched.forEach(im => { im.instanceMatrix.needsUpdate = true; });
  }
  let TIDX = null;
  function parkTree(t, on) {
    if (!TIDX) { TIDX = new Map(); WORLD.trees.forEach((q, i) => TIDX.set(q, i)); }
    const i = TIDX.get(t), C = WORLD.colliders[i];
    if (!C || Math.abs((C._x !== undefined ? C._x : C.x) - t.x) > 1e-6) return;
    if (on) { if (C._x === undefined) { C._x = C.x; C._z = C.z; } C.x = OFF; C.z = OFF; } else if (C._x !== undefined) { C.x = C._x; C.z = C._z; }
  }
  // a region's own merged foliage, recolored by its leaf colors (kept: the colors as they were, restored after)
  function leavesOn(c, on) {
    const L0 = c.L;
    if (!c.B.leafJobs) {
      c.B.leafJobs = [];
      for (const Lf of L0.leaves || []) {
        let root = null; try { root = Lf.obj(); } catch (e) { root = null; } if (!root) continue;
        root.updateMatrixWorld(true);
        const from = (Lf.from || []).map(h => new THREE.Color(h)), to = new THREE.Color(Lf.to), tol = Lf.tol || 0.03, P = new THREE.Vector3();
        root.traverse(m => {
          if (!m.isMesh || !m.geometry || !m.geometry.attributes.color || m.material === undefined || (m.material && m.material.side === THREE.BackSide)) return;
          const A0 = m.geometry.attributes.color, pos = m.geometry.attributes.position; if (!pos) return;
          if (!m.geometry.userData.tf_col0) m.geometry.userData.tf_col0 = Float32Array.from(A0.array);
          const orig = m.geometry.userData.tf_col0, hits = [];
          for (let i = 0; i < A0.count; i++) {
            const r = orig[i * 3], g = orig[i * 3 + 1], b = orig[i * 3 + 2];
            if (!from.some(f => Math.abs(f.r - r) < tol && Math.abs(f.g - g) < tol && Math.abs(f.b - b) < tol)) continue;
            if (Lf.box || Lf.area) {
              P.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(m.matrixWorld);
              if (Lf.box && !inBox(Lf.box, P.x, P.z)) continue;
              if (Lf.area) { let ok = false; try { ok = !!Lf.area(P.x, P.z); } catch (e) { ok = false; } if (!ok) continue; }
            }
            hits.push(i);
          }
          if (hits.length) c.B.leafJobs.push({ A0, orig, hits, to });
        });
      }
    }
    for (const J of c.B.leafJobs) {
      for (const i of J.hits) { if (on) { const v = 0.92 + 0.16 * ((i * 7919) % 13) / 13; J.A0.setXYZ(i, J.to.r * v, J.to.g * v, J.to.b * v); } else J.A0.setXYZ(i, J.orig[i * 3], J.orig[i * 3 + 1], J.orig[i * 3 + 2]); }
      J.A0.needsUpdate = true;
    }
  }
  // world.js's flowers in the box: hidden where the land has none (stems and heads: two instanced meshes, in WORLD.flowers' order)
  let FLM = null;
  function flowerMeshes() {
    if (FLM) return FLM;
    const n = WORLD.flowers.length, g = G();
    FLM = g.w3d.scene.children.filter(o => o.isInstancedMesh && o.count === n && o.geometry && (o.geometry.type === 'CylinderGeometry' || o.geometry.type === 'IcosahedronGeometry'));
    return FLM;
  }
  function flowersOn(c, on) {
    const L0 = c.L, B = L0.box; if (!B) return;
    if (!c.B.flowerIdx) {
      c.B.flowerIdx = [];
      const keep = L0.flowers || ((x, z) => { const Lm = WORLD.L, k = Math.round(z - Lm.minZ) * WORLD.GW + Math.round(x - Lm.minX); return WORLD.MAP[k * 4 + 1] >= 0.7 * (G1 ? G1[k] : 1); });     // (where the land keeps most of today's grass)
      WORLD.flowers.forEach((f, i) => { if (inBox(B, f.x, f.z)) { let k = true; try { k = keep(f.x, f.z); } catch (e) { k = true; } if (!k) c.B.flowerIdx.push(i); } });
    }
    const ms = flowerMeshes(); if (!ms.length || !c.B.flowerIdx.length) return;
    for (const im of ms) {
      if (!im.userData.tf_m0) im.userData.tf_m0 = Float32Array.from(im.instanceMatrix.array);
      const A0 = im.instanceMatrix.array, orig = im.userData.tf_m0;
      for (const i of c.B.flowerIdx) for (let k = 0; k < 16; k++) A0[i * 16 + k] = on ? 0 : orig[i * 16 + k];
      im.instanceMatrix.needsUpdate = true;
    }
  }
  // a big water sheet's level (the Mirror Lake's: time_lake.js moves it too, so it's put back every frame while the land is on)
  function lakeSheet(scene) { const Lw = WORLD.L.water; for (const o of scene.children) if (o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && o.position.x < -170 && o.geometry.parameters.width > 60 && Math.abs(o.userData.tf_y0 !== undefined ? o.userData.tf_y0 - Lw : o.position.y - Lw) < 0.6) return o; return null; }
  // a sheet raised above the line its own shader draws to (world3d.js's seas draw only where the ground is under L.water, a number in
  // the shader): a clone of its material drawing to the raised line, one per level, its uniforms shared (the waves keep moving); a
  // flood in the same water can wear it too (_.raisedMat)
  const RAISED = new Map();
  function raisedMat(mesh, level) {
    const m0 = mesh && (mesh.userData.tf_mat0 || mesh.material); if (!m0 || !m0.isShaderMaterial) return m0 || null;
    const key = m0.uuid + ':' + level.toFixed(3); if (RAISED.has(key)) return RAISED.get(key);
    const fs = m0.fragmentShader.replace(/float d = (-?[0-9.]+) - m\.r;/, 'float d = uTfLevel - m.r;');
    if (fs === m0.fragmentShader) { RAISED.set(key, m0); return m0; }
    const m = m0.clone(); m.uniforms = Object.assign({}, m0.uniforms, { uTfLevel: { value: level } }); m.fragmentShader = 'uniform float uTfLevel;\n' + fs; m.needsUpdate = true;
    RAISED.set(key, m); return m;
  }
  function waterOn(c, on) {
    const Sh = c.L.water && c.L.water.sheet, g = G(); if (!Sh || !g) return;
    let mesh = null; try { mesh = Sh.find ? Sh.find(g.w3d.scene) : lakeSheet(g.w3d.scene); } catch (e) { mesh = null; } if (!mesh) return;
    if (mesh.userData.tf_y0 === undefined) mesh.userData.tf_y0 = WORLD.L.water;
    if (on) {
      c.sheet = { mesh, y: mesh.userData.tf_y0 + (Sh.dy || 0), dy: Sh.dy || 0, float: Sh.float || [] }; mesh.position.y = c.sheet.y;
      if (c.sheet.dy > 0) { if (!mesh.userData.tf_mat0) mesh.userData.tf_mat0 = mesh.material; mesh.material = raisedMat(mesh, c.sheet.y); }
    } else {
      mesh.position.y = mesh.userData.tf_y0;
      if (mesh.userData.tf_mat0) mesh.material = mesh.userData.tf_mat0;
      for (const f of (c.sheet && c.sheet.float) || []) { const o = f._o; if (o && f.mode !== 'add' && o.userData.tf_fy0 !== undefined) o.position.y = o.userData.tf_fy0; }
    }
  }
  // what floats on a lowered sheet goes down with it: sheet.float [{ name, mode: 'set' (placed once: put at its own height + dy) |
  // 'add' (its owner places it every frame: dy added after), when() }]
  // (a float's thing, found by name near the top of the scene, where the dressings hang: some 17,000 things live deeper, and a
  // miss through scene.getObjectByName walks every one of them, ~6 ms a frame)
  function findNamed(root, name, depth = 3) {
    let lvl = [root];
    for (let d = 0; d <= depth && lvl.length; d++) {
      const nx = [];
      for (const o of lvl) { if (o.name === name) return o; if (d < depth) for (const ch of o.children) nx.push(ch); }
      lvl = nx;
    }
    return null;
  }
  function floatStep(c, dt) {
    const S = c.sheet; if (!S || !S.float.length) return;
    const scene = G().w3d.scene;
    for (const f of S.float) {
      if (!f._o || !f._o.parent) {
        // (looked for again once a second while it isn't there: a dressing shows it later, or never in this state)
        f._o = null; if ((f._t = (f._t || 0) - dt) > 0) continue;
        f._t = 1; f._o = findNamed(scene, f.name);
      }
      const o = f._o; if (!o) continue;
      let on = true; if (f.when) { try { on = !!f.when(); } catch (e) { on = false; } }
      if (f.mode === 'add') { if (on) o.position.y += S.dy; continue; }
      if (o.userData.tf_fy0 === undefined) o.userData.tf_fy0 = o.position.y;
      o.position.y = o.userData.tf_fy0 + (on ? S.dy : 0);
    }
  }
  // the region's own things the land does without (hide: [() => obj]), and instanced ones thinned out (trim: [{ obj(), keep(x, z) }])
  function hideOn(c, on) {
    if (on) { c.hid = []; for (const f of c.L.hide || []) { let o = null; try { o = f(); } catch (e) { o = null; } if (o && o.visible) { o.visible = false; c.hid.push(o); } } }
    else { for (const o of c.hid || []) o.visible = true; c.hid = []; }
  }
  function trimOn(c, on) {
    for (const Tm of c.L.trim || []) {
      let im = null; try { im = Tm.obj(); } catch (e) { im = null; } if (!im || !im.isInstancedMesh) continue;
      const A0 = im.instanceMatrix.array; if (!im.userData.tf_m0) im.userData.tf_m0 = Float32Array.from(A0);
      const orig = im.userData.tf_m0;
      for (let i = 0; i < im.count; i++) {
        const o = i * 16, x = orig[o + 12], z = orig[o + 14];
        let keep = true; if (on) { try { keep = !!Tm.keep(x, z); } catch (e) { keep = true; } }
        for (let k = 0; k < 16; k++) A0[o + k] = keep ? orig[o + k] : 0;
      }
      im.instanceMatrix.needsUpdate = true;
    }
  }
  function showOn(B, on) {
    for (const o of B.objs) o.visible = on;
    if (B.plat) B.plat.box = on ? B.pbox.slice() : [OFF, OFF + 1, OFF, OFF + 1];
    for (const s of B.solids) { s.x = on ? s._x : OFF; s.z = on ? s._z : OFF; }
    for (const p of B.decks) { if (p.box) p.box = on ? p._box.slice() : [OFF, OFF + 1, OFF, OFF + 1]; if (p.seg) p.seg = on ? p._seg.slice() : [OFF, OFF, OFF + 1, OFF]; }
  }
  function on(rid, w) {
    off();
    const S = LANDS[rid + ':' + w], g = G(); if (!S || !g || !g.w3d) return false;
    const healed = healOn(S, g.state), key = rid + ':' + w + (healed ? ':heal' : ''), L0 = specOf(S, healed);
    let B = BUILT[key];
    if (!B) { try { B = BUILT[key] = build(L0, key); } catch (e) { err('build ' + key, e); return false; } }
    cur = { key, rid, w, S, L: L0, B, healed, healT: 0.5, splashT: 0, sheet: null, wrapT: 0 };
    for (const [nm, f] of [['ground', groundOn], ['grass', grassOn], ['trees', treesOn], ['leaves', leavesOn], ['flowers', flowersOn], ['water', waterOn], ['hide', hideOn], ['trim', trimOn]]) { try { f(cur, true); } catch (e) { err(nm, e); } }
    showOn(B, true);
    return true;
  }
  function off() {
    const c = cur; if (!c) return false;
    cur = null;
    showOn(c.B, false);
    for (const [nm, f] of [['trim', trimOn], ['hide', hideOn], ['water', waterOn], ['flowers', flowersOn], ['leaves', leavesOn], ['trees', treesOn], ['grass', grassOn], ['ground', groundOn]]) { try { f(c, false); } catch (e) { err(nm, e); } }
    return true;
  }

  // ------------------------------------------------------------ every frame (time.js late, after the dressing's own)
  function late(dt) {
    if ((wrapT -= dt) <= 0) { wrapT = 1; try { wrapTabs(); } catch (e) { /* */ } }
    const c = cur, g = G(); if (!c || !g) return;
    if (c.sheet && c.sheet.mesh.position.y !== c.sheet.y) c.sheet.mesh.position.y = c.sheet.y;
    if (c.sheet) { try { floatStep(c, dt); } catch (e) { err('float', e); } }
    if ((c.healT -= dt) <= 0) { c.healT = 0.5; const h = healOn(c.S, g.state); if (h !== c.healed) { const { rid, w } = c; off(); on(rid, w); return; } }
    if (waterMat) { const f = g.w3d.scene.fog; waterMat.uniforms.uFogNear.value = f.near; waterMat.uniforms.uFogFar.value = f.far; }
    // a splash when you wade through a stream or a pool
    const Y = g.sim.you;
    if (Y.speed > 1 && Y.onGround && (c.splashT -= dt) <= 0) {
      if (c.B.streams.some(S => lineDist(S.line, Y.x, Y.z) < S.w * 0.5) || c.B.pools.some(P => Math.hypot(Y.x - P.x, Y.z - P.z) < P.r)) { c.splashT = 0.22; try { g.w3d.fx.puff(Y.x, Y.y + 0.05, Y.z, 2, 0.12, '#e9f6ff', 0.6); } catch (e) { /* */ } }
    }
    // tumbleweeds roll before the wind, bouncing, and come round again
    const Tb = c.B.tumble;
    if (Tb) {
      const t = g.w3d.time.value, bx = Tb.box;
      Tb.list.forEach((p, i) => {
        p.x += p.sp * dt; if (p.x > bx.x1) p.x = bx.x0; p.rot += p.sp * dt * 2.2;
        const z = p.z + Math.sin(t * 0.4 + p.ph) * 1.5, y = tA(p.x, z) + 0.42 + Math.abs(Math.sin(t * 2.3 * p.sp * 0.6 + p.ph)) * 0.35;
        Tb.im.setMatrixAt(i, _m.compose(_v.set(p.x, y, z), _q.setFromEuler(_e.set(0, p.ph, -p.rot)), _s.set(1, 1, 1)));
      });
      Tb.im.instanceMatrix.needsUpdate = true;
    }
  }
  let wrapT = 0;

  // ------------------------------------------------------------ what's here: the form you're on (main.js's steps), the land's height (the camera), the arena
  T.landAt = (x, z) => { const c = cur; if (!c) return null; for (const F of c.B.walk) { const y = topOf(F, x, z); if (y !== null && y > tA(x, z) + 0.12) return F; } if (c.B.bed && bedTop(c.B.bed, x, z) !== null && tA(x, z) < WORLD.L.water) return { kind: 'bed' }; return null; };
  T.landTop = (x, z) => { const c = cur; if (!c) return -Infinity; let m = -Infinity; for (const F of c.B.forms) { const y = topOf(F, x, z); if (y !== null && y > m) m = y; } return m; };

  // ------------------------------------------------------------ the minimap: the land painted once per world, over the picture
  function paintMap(c) {
    const L0 = c.L, B = L0.box; if (!B) return null;
    const Lm = WORLD.L, X0 = Lm.minX - 0.5, Z0 = Lm.minZ - 0.5, GW = WORLD.GW;
    const x0 = Math.floor(B.x0), z0 = Math.floor(B.z0), x1 = Math.ceil(B.x1), z1 = Math.ceil(B.z1), Wd = x1 - x0 + 1, Ht = z1 - z0 + 1;
    const cv = document.createElement('canvas'); cv.width = Wd * K; cv.height = Ht * K;
    const oc = cv.getContext('2d');
    // 1. the ground layers, a pixel per grid point (each layer's map color, as much as it says), spread smoothly over K px a unit
    const sm = document.createElement('canvas'); sm.width = Wd; sm.height = Ht;
    const sc = sm.getContext('2d'), img = sc.createImageData(Wd, Ht), D = img.data;
    const layers = L0.ground.map(Ly => ({ Ly, rgb: hexRGB(Ly.map || lighter(Ly.col)) }));
    const wl = Lm.water, bed = c.B.bed;
    for (let j = 0; j < Ht; j++) for (let i = 0; i < Wd; i++) {
      const x = x0 + i, z = z0 + j, gi = clamp(x - Lm.minX, 0, GW - 1), gj = clamp(z - Lm.minZ, 0, WORLD.GH - 1), k = gj * GW + gi, q = fillQ(k, x, z, L0), o = (j * Wd + i) * 4;
      let r = 0, g = 0, b = 0, a = 0;
      for (const { Ly, rgb } of layers) {
        // (on the map a layer paints only where today's picture shows meadow, unless it says where: roofs, streets and water stay)
        let t = 0;
        if (Ly.mapAmt) { try { t = Ly.mapAmt(x, z, q); } catch (e) { t = 0; } if (!Ly.heal) t *= 1 - q.heal; t = Math.min(1, Math.max(0, t || 0)); }
        else t = layerAmt(Ly, x, z, q) * ss(0.0, 0.12, q.g);
        t *= Ly.mapA === undefined ? 0.92 : Ly.mapA; if (!(t > 0)) continue;
        const na = t + a * (1 - t); r = (rgb[0] * t + r * a * (1 - t)) / na; g = (rgb[1] * t + g * a * (1 - t)) / na; b = (rgb[2] * t + b * a * (1 - t)) / na; a = na;
      }
      // the bed: crust where the water's gone down
      if (bed && bedTop(bed, x, z) !== null && q.h < wl + 0.05) { const cr = hexRGB(bed.map || '#f2eee2'); r = cr[0]; g = cr[1]; b = cr[2]; a = 1; }
      D[o] = r; D[o + 1] = g; D[o + 2] = b; D[o + 3] = Math.round(a * 255);
    }
    sc.putImageData(img, 0, 0);
    oc.imageSmoothingEnabled = true; oc.drawImage(sm, 0, 0, Wd, Ht, 0, 0, Wd * K, Ht * K);
    // 2. the rest in world units
    oc.setTransform(K, 0, 0, K, -(x0 - 0.5) * K, -(z0 - 0.5) * K);
    oc.lineJoin = 'round'; oc.lineCap = 'round';
    const groundRGB = (x, z) => { const gi = clamp(Math.round(x - Lm.minX), 0, GW - 1), gj = clamp(Math.round(z - Lm.minZ), 0, WORLD.GH - 1), k = gj * GW + gi, q = fillQ(k, x, z, L0); let col = [150, 190, 100], a = 0; for (const { Ly, rgb } of layers) { const t = layerAmt(Ly, x, z, q); if (t > a) { a = t; col = rgb; } } return `rgb(${col[0]},${col[1]},${col[2]})`; };
    // the new shore of a lowered sheet: an ink line along the water's new edge
    if (bed) {
      oc.strokeStyle = INK; oc.lineWidth = 0.55;
      oc.beginPath();
      for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) {
        const v = [tA(x, z), tA(x + 1, z), tA(x + 1, z + 1), tA(x, z + 1)].map(h => h - bed.level), m = v.map(t => t > 0);
        if (m.every(t => t) || m.every(t => !t)) continue;
        const P = [], E = [[0, 1, [x, z], [x + 1, z]], [1, 2, [x + 1, z], [x + 1, z + 1]], [2, 3, [x + 1, z + 1], [x, z + 1]], [3, 0, [x, z + 1], [x, z]]];
        for (const [a, b2, pa, pb] of E) if (m[a] !== m[b2]) { const t = v[a] / (v[a] - v[b2]); P.push([pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]); }
        if (P.length >= 2 && (!bed.area || bed.area(x + 0.5, z + 0.5))) { oc.moveTo(P[0][0], P[0][1]); oc.lineTo(P[1][0], P[1][1]); }
      }
      oc.stroke();
    }
    // a flood: water where it lies
    if (c.B.flood) {
      const fa = (x, z) => { try { return !!c.B.flood.area(x, z); } catch (e) { return false; } };
      oc.fillStyle = 'rgb(130,208,238)'; for (let z = z0; z < z1; z++) for (let x = x0; x < x1; x++) if (fa(x + 0.5, z + 0.5)) oc.fillRect(x, z, 1, 1);
    }
    // streams and pools
    for (const S of c.B.streams) {
      const line = S.line, path = () => { oc.beginPath(); oc.moveTo(line[0][0], line[0][1]); for (let i = 1; i < line.length; i++) oc.lineTo(line[i][0], line[i][1]); };
      oc.strokeStyle = INK; oc.lineWidth = S.w + 0.7; path(); oc.stroke();
      oc.strokeStyle = 'rgb(232,247,255)'; oc.lineWidth = S.w + 0.15; path(); oc.stroke();
      oc.strokeStyle = 'rgb(130,208,238)'; oc.lineWidth = Math.max(0.4, S.w - 0.35); path(); oc.stroke();
    }
    for (const P of c.B.pools) { oc.fillStyle = INK; oc.beginPath(); oc.arc(P.x, P.z, P.r + 0.35, 0, TAU); oc.fill(); oc.fillStyle = 'rgb(232,247,255)'; oc.beginPath(); oc.arc(P.x, P.z, P.r + 0.05, 0, TAU); oc.fill(); oc.fillStyle = 'rgb(100,186,228)'; oc.beginPath(); oc.arc(P.x, P.z, P.r - 0.3, 0, TAU); oc.fill(); }
    // the forms: their outline in ink, filled in their color, a lighter crest
    for (const F of c.B.forms) {
      const col = F.map || lighter(F.col || (FORM_COL[F.kind] || FORM_COL.mound)[0], 0.1), shape = grow => {
        oc.beginPath();
        if (F.kind === 'tongue') { const L1 = [], L2 = []; for (const g of F.seg) for (const t of [0, g.l]) { const cx = g.ax + g.ux * t, cz = g.az + g.uz * t, w = (t ? g.w1 : g.w0) + grow; L1.push([cx - g.uz * w, cz + g.ux * w]); L2.push([cx + g.uz * w, cz - g.ux * w]); } const all = L1.concat(L2.reverse()); oc.moveTo(all[0][0], all[0][1]); for (const p of all) oc.lineTo(p[0], p[1]); oc.closePath(); return; }
        oc.save(); oc.translate(F.x, F.z); oc.rotate(-(F.rot || 0)); oc.ellipse(0, 0, F.rx + grow, F.rz + grow, 0, 0, TAU); oc.restore();
      };
      oc.fillStyle = INK; shape(0.35); oc.fill();
      oc.fillStyle = col; shape(0); oc.fill();
      if (F.kind === 'dune' || F.kind === 'drift') { oc.strokeStyle = 'rgba(255,255,255,0.55)'; oc.lineWidth = 0.45; oc.save(); oc.translate(F.x, F.z); oc.rotate(-(F.rot || 0)); oc.beginPath(); oc.ellipse(F.rx * 0.28, 0, F.rx * 0.35, F.rz * 0.72, 0, -1.2, 1.2); oc.stroke(); oc.restore(); }
      if (F.kind === 'tongue') { oc.strokeStyle = 'rgba(111,159,202,0.8)'; oc.lineWidth = 0.35; for (const g of F.seg) for (let t = 1; t < g.l; t += 2.2) { const cx = g.ax + g.ux * t, cz = g.az + g.uz * t, w = lerp(g.w0, g.w1, t / g.l) * 0.6; oc.beginPath(); oc.moveTo(cx - g.uz * w, cz + g.ux * w); oc.lineTo(cx + g.uz * w, cz - g.ux * w); oc.stroke(); } }
    }
    // the plants: the old canopy painted over in the ground's color, then each one stamped in its own
    for (const t of c.B.swapped.concat(c.B.gone)) { const r = t.wall ? 1.2 + 0.8 * t.s : t.kind === 'big' ? 3.4 : 1.05 + 0.62 * t.s; oc.fillStyle = groundRGB(t.x, t.z); oc.beginPath(); oc.arc(t.x, t.z, r + 0.5, 0, TAU); oc.fill(); }
    for (const [kind, P] of Object.entries(c.B.plants)) {
      const km = KIND[kind] || { map: '#7a7068' }, rr = km.tree ? 1.0 : kind === 'hedge' ? 0.8 : 0.5;
      for (const p of P.list) { const r = rr * p.s; oc.fillStyle = 'rgba(43,34,53,0.85)'; oc.beginPath(); oc.arc(p.x, p.z, r + 0.32, 0, TAU); oc.fill(); oc.fillStyle = p.col || km.map; oc.beginPath(); oc.arc(p.x, p.z, r, 0, TAU); oc.fill(); }
    }
    return { cv, px: (x0 - 0.5 - X0) * K, py: (z0 - 0.5 - Z0) * K, w: Wd * K, h: Ht * K };
  }
  T.mapLand = () => { const c = cur; if (!c) return null; const B = c.B; if (B.map === undefined) { try { B.map = paintMap(c); } catch (e) { err('map', e); B.map = null; } } return B.map; };

  // ------------------------------------------------------------ the words, the Looks, the people's lines
  const lang = () => A.lang(), isCl = l => l === 'zh' || l === 'ja';
  const mimoName = () => { try { return (typeof UI !== 'undefined' && UI.mimoName) || 'Mimo'; } catch (e) { return 'Mimo'; } };
  const SLOT = /\{(w\.[a-z_0-9]+)(?::(?:pl|f))?\}/g;
  function meet(en) { if (typeof LEX === 'undefined') return; let m; SLOT.lastIndex = 0; while ((m = SLOT.exec(String(en || '')))) { try { if (LEX.item(m[1])) LEX.expose(m[1]); } catch (e) { /* */ } } }
  const fillEn = s => String(s || '').replace(/\{mimo\}/g, mimoName());
  async function lookAt(L0) {
    try {
      if (typeof LEX !== 'undefined' && LEX.item(L0.id)) {
        try { if (STORY.introduce) STORY.introduce(L0.id); else LEX.expose(L0.id); } catch (e) { /* */ }
        const l = lang(), w = isCl(l) ? A.plainT(LEX.src(L0.id)) : LEX.form(L0.id, { article: true }); try { UI.speak(w); } catch (e) { /* (no voice) */ }
      }
    } catch (e) { /* */ }
    const line = typeof L0.line === 'function' ? L0.line() : L0.line;
    meet(line);
    STORY.think(fillEn(line), L0.dur || 5);
  }
  function lookSpot(S, L0, tag, heal) {
    T.spot('land.' + S.rid + '.' + S.w + '.' + tag, { region: S.rid, world: S.w, x: L0.at.x, z: L0.at.z, r: L0.r || 1.7, label: 'Look',
      when: s => !!cur && cur.S === S && (!heal || cur.healed) && (!L0.when || !!L0.when(s)), run: () => lookAt(L0) });
  }
  // «The land» in a person's Talk: what they remember, or what they fear (said through the weave, in turn)
  function sayLand(p, list) {
    const c = cur; if (!c || !p) return Promise.resolve();
    const st = T.state(c.rid, c.w), n = st.landN || 0, T0 = list[n % list.length]; st.landN = n + 1;
    const l = lang(), en = fillEn(T0.en || ''); meet(T0.en);
    p.lines = { en, [l]: String(T0[l] || '').replace(/\{mimo\}/g, isCl(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName()) };
    return STORY.sayInline(p);
  }
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    const c = cur; if (!c || !it || !it.who || !it.p) return null;
    const st = G() && G().state, list = (c.L.lines || []).filter(Ln => Ln.who === it.who && (!Ln.when || (() => { try { return !!Ln.when(st); } catch (e) { return false; } })()));
    if (!list.length) return null;
    return [{ label: 'The land', sub: c.w === 'past' ? '◆ how it was' : '◆ what will be', run: () => sayLand(it.p, list.map(Ln => Ln.T)) }];
  });
  // the journal: a «The land» section on each region's own word page (time_land_text.js holds the words)
  const TABS = { molinar: 'ml-words', lake: 'lk-words', quarry: 'qr-words', gardens: 'gd-words', peaks: 'pk-words', port: 'pb-words' };
  function css() {
    if (document.getElementById('tf-css')) return;
    const s = document.createElement('style'); s.id = 'tf-css';
    s.textContent = '.tf-words { columns: 2; column-gap: 18px; font-size: 13px; line-height: 1.5; margin: 6px 0 10px; } .tf-words li { break-inside: avoid; } .tf-words .no { opacity: .45; } .tf-words .en { opacity: .7; }';
    document.head.appendChild(s);
  }
  function landWordsHTML(rid) {
    const W = typeof TLTXT !== 'undefined' && TLTXT.WORDS && TLTXT.WORDS[rid]; if (!W) return '';
    css();
    const l = lang(), seen = id => typeof LEX !== 'undefined' && LEX.seen(id), esc = A.esc;
    const tH = t => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t));
    const row = w => `<li class="${seen(w.id) ? '' : 'no'}">${seen(w.id) ? '✓ ' : ''}<b>${tH(w[l] || '')}</b> <span class="en">${esc(w.en)}</span></li>`;
    const n = list => list.filter(w => seen(w.id)).length, P = W.past || [], F = W.future || [];
    return `<div class="mt"><h4 class="ph-h">The land <small>${n(P) + n(F)} / ${P.length + F.length}</small></h4><p class="note">How the land itself was long ago, and what it will be tomorrow: the woods, the water, the snow and the sand (✓ once you’ve met it). Mimo keeps them for review.</p>`
      + `<h5>Long ago <small>${n(P)} / ${P.length}</small></h5><ul class="tf-words">${P.map(row).join('')}</ul>`
      + `<h5>Tomorrow <small>${n(F)} / ${F.length}</small></h5><ul class="tf-words">${F.map(row).join('')}</ul></div>`;
  }
  function wrapTabs() {
    if (typeof UI === 'undefined' || !UI.journalTabs) return;
    for (const [rid, id] of Object.entries(TABS)) {
      const tab = UI.journalTabs.find(t => t.id === id); if (!tab || tab._land) continue;
      const h0 = tab.html;
      tab.html = function () { let h = ''; try { h = h0.apply(this, arguments); } catch (e) { err('tab ' + id, e); } try { h += landWordsHTML(rid); } catch (e) { err('land words ' + id, e); } return h; };
      tab._land = true;
    }
  }
  // the words go into Mimo's memory when TIME starts (after the regions' own, so a word already there is never registered twice)
  const init0 = T.init;
  T.init = function (game) {
    const r = init0.apply(this, arguments);
    try { if (typeof TLTXT !== 'undefined' && TLTXT.register) TLTXT.register(); } catch (e) { err('words', e); }
    return r;
  };

  // ------------------------------------------------------------ the checks: every land against the ground it must keep
  function keepPts(S) {
    const out = [];
    for (const c of Object.values(T.CRACKS)) if (c.region === S.rid && c.worlds.includes(S.w)) out.push({ x: c.x, z: c.z, r: 2.4, what: 'crack ' + c.id });
    for (const sp of Object.values(T.SPOTS)) {
      if (sp.region !== S.rid || sp.world !== S.w || /^land\./.test(sp.id)) continue;
      try { const x = _.val(sp.x), z = _.val(sp.z); if (x != null && z != null) out.push({ x, z, r: 1.4, what: 'spot ' + sp.id }); } catch (e) { /* */ }
    }
    const R = T.REGIONS[S.rid], D = R && R.dress[S.w];
    for (const p of (D && D.people) || []) if (p.at) out.push({ x: p.at.x, z: p.at.z, r: 1.2, what: 'person ' + p.id });
    if (cur && cur.S === S && D && D.interactables) { try { for (const it of D.interactables(A) || []) if (isFinite(it.x) && isFinite(it.z)) out.push({ x: it.x, z: it.z, r: 1.1, what: 'E ' + (it.label || '?') }); } catch (e) { /* */ } }
    for (const k of S.keep) out.push(Object.assign({ r: 1.5, what: 'keep' }, k));
    return out;
  }
  function check(rid) {
    const out = [];
    for (const S of Object.values(LANDS)) {
      if (rid && S.rid !== rid) continue;
      const R = T.REGIONS[S.rid];
      if (!R) { out.push(`${S.rid}: no such region`); continue; }
      for (const healed of [false, true]) {
        if (healed && !S.heal) continue;
        const L0 = specOf(S, healed), tag = S.rid + ':' + S.w + (healed ? '+heal' : ''), forms = L0.forms.map(F => prep(Object.assign({}, F))), walk = forms.filter(F => F.walk);
        const streams = ((L0.water || {}).streams || []).map(St => ({ w: St.w || 1.6, line: splineOf(St.pts) })), pools = (L0.water || {}).pools || [];
        const inside = (x, z) => { try { return R.inside(x, z); } catch (e) { return false; } };
        // 1. what must keep its ground: nothing raised over it, no water on it
        for (const k of keepPts(S)) {
          for (const F of forms) for (let a = 0; a < 8; a++) {
            const x = k.x + Math.cos(a / 8 * TAU) * k.r * (a % 2 ? 1 : 0.5), z = k.z + Math.sin(a / 8 * TAU) * k.r * (a % 2 ? 1 : 0.5), y = topOf(F, x, z);
            if (y !== null && y > tA(x, z) + 0.06) { out.push(`${tag}: form ${F.id} (${F.kind}) covers ${k.what} at ${k.x.toFixed(1)},${k.z.toFixed(1)}`); break; }
          }
          for (const St of streams) if (lineDist(St.line, k.x, k.z) < St.w / 2 + k.r) out.push(`${tag}: a stream runs over ${k.what}`);
          for (const P of pools) if (Math.hypot(k.x - P.x, k.z - P.z) < P.r + k.r) out.push(`${tag}: a pool covers ${k.what}`);
        }
        // 2. the paths and paved ground inside the reach: no walkable form raises them
        if (L0.box) {
          const [i0, i1, j0, j1] = cellsOf(L0.box), Lm = WORLD.L, seen = new Set();
          for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
            const x = Lm.minX + i, z = Lm.minZ + j, k = j * WORLD.GW + i; if (!inside(x, z)) continue;
            const g1 = G1 ? G1[k] : WORLD.MAP[k * 4 + 1], path = WORLD.MAP[k * 4 + 3] > 0.5 || (g1 < 0.05 && WORLD.H[k] > Lm.water + 0.1);
            if (!path) continue;
            for (const F of walk) { if (seen.has(F.id) || F.over) continue; const y = topOf(F, x, z); if (y !== null && y > tA(x, z) + 0.08) { seen.add(F.id); out.push(`${tag}: form ${F.id} (${F.kind}) raises a path or paved cell at ${x},${z}`); } }
          }
          // 3. a walkable top over deep water stands 0.2 over the terrain (or sim.js's rescue would fire)
          const bed = (L0.water || {}).bed;
          for (let j = j0; j <= j1; j += 1) for (let i = i0; i <= i1; i += 1) {
            const x = Lm.minX + i + 0.5, z = Lm.minZ + j + 0.5, h = tA(x, z); if (h > DEEP()) continue;
            let top = null; for (const F of walk) { const y = topOf(F, x, z); if (y !== null && (top === null || y > top)) top = y; }
            if (bed) { const y = bedTop(bed, x, z); if (y !== null && (top === null || y > top)) top = y; }
            if (top !== null && top > h && top < h + 0.2) { out.push(`${tag}: a walkable top over deep water at ${x.toFixed(1)},${z.toFixed(1)} is only ${(top - h).toFixed(2)} over the bed`); i = i1 + 1; j = j1 + 1; }
          }
        }
        // 4. the Looks: inside the reach, nothing solid on them
        for (const L1 of L0.looks.concat(healed && S.heal ? S.heal.looks || [] : [])) {
          if (!inside(L1.at.x, L1.at.z)) out.push(`${tag}: the Look ${L1.id} at ${L1.at.x},${L1.at.z} is outside the region's reach`);
          if (typeof LEX !== 'undefined' && LEX.item && !LEX.item(L1.id)) out.push(`${tag}: the Look's word ${L1.id} isn't registered`);
        }
      }
    }
    if (typeof TLTXT !== 'undefined' && TLTXT.check) { try { out.push(...TLTXT.check()); } catch (e) { out.push('TLTXT.check threw ' + e.message); } }
    return out;
  }

  // ------------------------------------------------------------ test hooks
  // reach(region, world): with that world on, flood-fill the reach on a half-unit grid from its three-way crack (each step one you
  // could walk: sim.js's okAt from the cell you're on, and not into a solid) → the keep points nobody can get to ([] when all's well)
  function reach() {
    const c = cur, g = G(); if (!c || !g) return ['no land is on'];
    const R = T.REGIONS[c.rid], cr = Object.values(T.CRACKS).find(q => q.region === c.rid && q.worlds.length === 3) || Object.values(T.CRACKS).find(q => q.region === c.rid);
    if (!R || !cr) return ['no crack to start from'];
    const S0 = 0.5, B = c.L.box, key = (i, j) => i * 100000 + j, sim = g.sim, Lm = WORLD.L;
    const start = [cr.x + 1.6, cr.z + 1.2], seen = new Map(), q = [];
    const cell = (x, z) => [Math.round((x - B.x0) / S0), Math.round((z - B.z0) / S0)];
    const [si, sj] = cell(start[0], start[1]); seen.set(key(si, sj), WORLD.groundAt(start[0], start[1])); q.push([si, sj]);
    while (q.length) {
      const [i, j] = q.shift(), y = seen.get(key(i, j)), x = B.x0 + i * S0, z = B.z0 + j * S0;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const ni = i + di, nj = j + dj, k = key(ni, nj), was = seen.get(k);
        const nx = B.x0 + ni * S0, nz = B.z0 + nj * S0;
        if (nx < B.x0 || nx > B.x1 || nz < B.z0 || nz > B.z1) continue;
        let ins = false; try { ins = R.inside(nx, nz); } catch (e) { ins = false; } if (!ins) continue;
        if (was !== undefined && was >= y + 0.6) continue;
        if (!sim.okAt(nx, nz, y)) continue;
        const [px, pz] = WORLD.pushOut(nx, nz, 0.42); if (Math.hypot(px - nx, pz - nz) > 0.12) continue;
        // (a cell first reached wading under a pier counts again from the deck above it: only a higher ground re-queues it)
        const gy = WORLD.groundAt(nx, nz, y); if (was !== undefined && gy <= was + 0.05) continue;
        seen.set(k, gy); q.push([ni, nj]);
      }
      if (seen.size > 400000) break;
    }
    const out = [];
    for (const kp of keepPts(c.S)) {
      let ok = false;
      for (let a = 0; a < 16 && !ok; a++) for (const rr of [0, 0.5, 1, 1.5, 2.2]) { const [i, j] = cell(kp.x + Math.cos(a / 16 * TAU) * rr, kp.z + Math.sin(a / 16 * TAU) * rr); if (seen.has(key(i, j))) { ok = true; break; } }
      if (!ok) out.push(`unreachable: ${kp.what} at ${kp.x.toFixed(1)},${kp.z.toFixed(1)}`);
    }
    out.cells = seen.size; out.keep = keepPts(c.S).length;
    return out;
  }
  // onForms(): stand on every walkable form's top (a few spots each) and step: the ground must hold you, and the rescue never fire
  async function onForms(steps = 12) {
    const c = cur, g = G(); if (!c || !g) return ['no land is on'];
    const out = [], sim = g.sim, Y = sim.you, r0 = sim.rescue, RG = T.REGIONS[c.rid];
    let resc = 0;
    sim.rescue = function () { const r = r0.call(this); if (r) resc++; return r; };
    const stand = (x, z, what, top) => {
      Y.x = x; Y.z = z; Y.vx = Y.vz = Y.vy = 0; sim.snap(); resc = 0;
      if (typeof __g !== 'undefined') __g.step(steps);
      const moved = Math.hypot(Y.x - x, Y.z - z);
      // (stranded: what sim.js counts toward its rescue, 1.2 s of it; checked straight away rather than waited out)
      const strand = Y.onGround && !sim.okAt(Y.x, Y.z, Y.y + 0.3);
      if (resc || strand) out.push(`${resc ? 'rescued' : 'stranded'} off ${what} at ${x.toFixed(1)},${z.toFixed(1)}`);
      else if (top !== null && moved < 0.3 && Math.abs(Y.y - WORLD.groundAt(x, z)) > 0.15) out.push(`${what}: standing at ${Y.y.toFixed(2)}, the ground there is ${WORLD.groundAt(x, z).toFixed(2)}`);
    };
    try {
      for (const F of c.B.walk) {
        const spots = F.kind === 'tongue' ? [] : [[0, 0], [0.45, 0], [-0.45, 0], [0, 0.45], [0, -0.45]];
        for (const [u, v] of spots) {
          const [x, z] = worldOf(F, u * F.rx, v * F.rz);
          if (!(RG && RG.inside(x, z))) continue;
          stand(x, z, F.id, topOf(F, x, z));
        }
      }
      // a dry bed: spots spread over it (the old water's edge, the middle, near the new water line)
      if (c.B.bed && c.L.box) {
        const Bx = c.L.box, pts = [];
        for (let x = Bx.x0 + 1; x < Bx.x1; x += 2.5) for (let z = Bx.z0 + 1; z < Bx.z1; z += 2.5) if (RG && RG.inside(x, z) && bedTop(c.B.bed, x, z) !== null && tA(x, z) < WORLD.L.water - 0.05) pts.push([x, z]);
        const n = Math.min(36, pts.length);
        for (let i = 0; i < n; i++) { const [x, z] = pts[Math.floor(i * pts.length / n)]; stand(x, z, 'the bed', bedTop(c.B.bed, x, z)); }
        out.bedSpots = n;
      }
    } finally { sim.rescue = r0; }
    return out;
  }
  // the flood path (no region of these five floods yet: the port's will): a test flood around you, a deck through it, and back
  async function floodTest() {
    const g = G(); if (!g) return { error: 'no game' };
    const c = cur, Y = g.sim.you, x0 = Y.x, z0 = Y.z, sim = g.sim, res = {};
    const had = c ? c.B.flood : undefined, fake = c || { B: { flood: null } };
    const area = (x, z) => Math.abs(x - (x0 + 6)) < 3 && Math.abs(z - z0) < 3;
    const deck = { box: [x0 + 2.8, x0 + 9.2, z0 - 0.6, z0 + 0.6], top: tA(x0 + 6, z0) + 0.45 };
    fake.B.flood = { area, y: tA(x0 + 6, z0) + 0.5 };
    const wasCur = cur; if (!cur) cur = fake;
    WORLD.addPlatforms([deck]);
    try {
      res.deep = WORLD.deepAt(x0 + 6, z0 + 2);
      res.okWater = sim.okAt(x0 + 6, z0 + 2, tA(x0 + 6, z0 + 2));
      res.okDeck = sim.okAt(x0 + 6, z0, deck.top);
      Y.x = x0 + 6; Y.z = z0 + 2; sim.snap(); res.rescued = sim.rescue(); res.out = { x: +Y.x.toFixed(2), z: +Y.z.toFixed(2) }; res.outDeep = WORLD.deepAt(Y.x, Y.z);
    } finally {
      deck.box = [OFF, OFF + 1, OFF, OFF + 1];
      if (wasCur) wasCur.B.flood = had; else cur = null;
      Y.x = x0; Y.z = z0; sim.snap();
    }
    res.pass = res.deep === true && res.okWater === false && res.okDeck === true && res.rescued === true && res.outDeep === false;
    return res;
  }
  // perf(n): draw calls of the last frame and the mean ms of n frames (the GPU flushed at the end, so its work counts too)
  function perf(n = 90) {
    if (typeof __g === 'undefined') return null;
    const r = __g.renderer, gl = r.getContext();
    __g.step(4); gl.finish();
    const t0 = performance.now(); __g.step(n); gl.finish(); const ms = (performance.now() - t0) / n;
    __g.step(1);
    return { calls: r.info.render.calls, tris: r.info.render.triangles, ms: +ms.toFixed(2) };
  }
  // shot(name, cam): a still from a fixed camera (cam: { pos: [x, y, z], look: [x, y, z] }), with the Past's sepia and the Future's
  // gray put into the picture (they're CSS over the canvas), saved by the dev server into its shots folder
  async function shot(name, cam) {
    const g = G(); if (!g || typeof __g === 'undefined') return null;
    const gl = document.getElementById('gl'), tint = document.getElementById('future-tint');
    if (gl) gl.style.transition = 'none'; if (tint) tint.style.transition = 'none';
    if (cam) { g.cam.override = { pos: new THREE.Vector3(...cam.pos), look: new THREE.Vector3(...cam.look), dur: 0.01 }; }
    // (cull.js's zones hide groups by where you stand, not where this camera is: every time drawn whole, so they compare)
    const cullWas = typeof CULL !== 'undefined' && CULL ? CULL.on : null; if (cam && cullWas !== null) CULL.on = false;
    __g.step(cam ? 50 : 2);
    const W = gl.width, H = gl.height, out = document.createElement('canvas'); out.width = W; out.height = H;
    const c2 = out.getContext('2d');
    __g.step(1);
    c2.filter = gl.style.filter || 'none'; c2.drawImage(gl, 0, 0); c2.filter = 'none';
    if (tint && (+tint.style.opacity || 0) > 0 && getComputedStyle(tint).display !== 'none') {
      const f = tint.style.backdropFilter || tint.style.webkitBackdropFilter;
      if (f) { const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; tmp.getContext('2d').drawImage(out, 0, 0); c2.clearRect(0, 0, W, H); c2.filter = f; c2.drawImage(tmp, 0, 0); c2.filter = 'none'; }
      if (tint.style.background !== 'none') { const gr = c2.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) / 2); gr.addColorStop(0, 'rgba(70,66,92,0)'); gr.addColorStop(0.48, 'rgba(70,66,92,0)'); gr.addColorStop(1, 'rgba(40,37,58,0.4)'); c2.fillStyle = gr; c2.fillRect(0, 0, W, H); }
    }
    if (cam) { g.cam.override = null; g.cam.back = 0; if (cullWas !== null) CULL.on = cullWas; }
    const data = out.toDataURL('image/png');
    const r = await fetch('/shot', { method: 'POST', body: JSON.stringify({ name, data }) });
    return r.json();
  }
  // show(region, world): put a land on without the story (the region's world dressed through TIME, the way a crack does)
  async function show(rid, w, at) {
    const R = T.REGIONS[rid]; if (!R) return false;
    _.fast.on = true;
    if (w === 'now') return T.go('now', { region: rid, at, quick: true, quiet: true });
    if (T.world() !== 'now' && T.regionNow() !== rid) await T.go('now', { quick: true, quiet: true });
    if (T.world() === w) return true;
    return T.go(w, { region: rid, at: at || { x: R.center.x, z: R.center.z, yaw: 0 }, quick: true, quiet: true });
  }

  Object.assign(land, {
    on, off, late, check, LANDS, BUILT, PLANTS: BUILD, KIND,
    arena: () => (cur ? cur.L.arena || null : null),
    _: { get cur() { return cur; }, specOf, topOf, prep, bedTop, walkTop, paintMap, keepPts, lineDist, splineOf, plantGeo, wrapTabs, landWordsHTML, raisedMat,
      t: { reach, onForms, floodTest, perf, shot, show } },
  });
  // (a getter: Object.assign would copy its value once)
  Object.defineProperty(land, 'now', { get: () => (cur ? { key: cur.key, rid: cur.rid, w: cur.w, healed: cur.healed } : null), configurable: true });
  T.land = land;
})();
