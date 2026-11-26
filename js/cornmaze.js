'use strict';
// The corn maze by the old road, where the farm's crop field used to be, and the Corn Society's hall underneath it
// (DESIGN.md 14.6). The field (x 12..56, z −72..−112) is a real maze of corn taller than you, on an 11 × 10 grid of
// 4-unit cells: a seeded recursive backtracker, then a few extra openings so it loops instead of being miserable. You
// go in from the old road (west, by the sign «Laberinto») and come out on the north side, by Alba's south gate.
// A grand scarecrow guards the clearing in the middle (2 × 2 cells), standing over a wooden hatch. Three hooded corn
// kids, the Society's scouts, hide in dead ends: between them they tell you about the hatch, the voice behind it, and
// its password, the magic word («por favor» / «por favor» / «bitte»). Say it and you climb down into the Corn
// Society's hall: hooded corn folk who hid from the Hush and whisper, believing quiet keeps them safe (the very thing
// the Hush feeds on: one of them is forgetting words). Their leader, Colonel Cob (el Coronel Mazorca · o Coronel Espiga ·
// Oberst Kolben), takes you for the Hush's spies: a boss fight. Win, and he gives up, says sorry and hands you the
// Golden Kernel: "Plant it where the silence began" (the old tower, later in the game).
//
// One global, CORN, shaped like MOLINAR (the field) and MILL (the hall):
//   plain data, ready before world.js:  CORN.layout, .keepClear(x, z, pad), .bareAt(x, z), .flatK(x, z), .flatY,
//                                       .distTo(x, z), .landmarks
//   CORN.build(scene, { terrainAt }) → { colliders, platforms, update(dt, t, you|null), people (the scouts), group,
//                                        landmarks, objects, stats() }
//   the hall (a room, like MILL):        CORN.init(game) · .inside · .OUTSIDE · .interactables() (outside: the maze's
//                                        things; inside: the hall's) · .update(dt, t) · .curiosities() · .target() ·
//                                        .enter() · .leave()
//   the quest:                           CORN.quest() (a quests.js LIST entry; init adds it if LIST has no 'corn')
// Progress lives in state.corn; the prize in state.flags.goldenKernel and state.bag['k.goldenKernel'].
// Needs THREE (r128), core.js, toonkit.js, lexicon.js, words.js, lines.js and icons.js at load; UI, STORY, WORLD and
// BATTLE at run time (the colonel and kernel kinds, falling back to hushlings while battle/ doesn't have them).

const CORN = (() => {
  const { M4 } = TK, GEO = TK.G;
  const SPH = new THREE.SphereGeometry(1, 14, 9), SPH_S = new THREE.SphereGeometry(1, 8, 6);     // (TK's sphere is 1,120 triangles: too many for eyes and petals)
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function segDist(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
  }
  const polyDist = (pts, x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(x, z, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; };
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function shuffle(a, R) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ================================================================ the field and the maze (pure data)
  const BOX = { x0: 12, x1: 56, z0: -72, z1: -112 };            // (z0 is the south edge: north is −z)
  const CELL = 4, NC = 11, NR = 10;
  const FLAT_Y = 0.3;                                             // world.js flattens the field to this (the old road's height)
  const SEED = 1237;                                              // (17 cells from the way in to the heart, 19 on to the way out, 11 dead ends)
  const T_SOLID = 0.6, ROW = 0.42;                                // a corn wall's solid half-thickness, and where its two rows of stalks stand
  const ENT = { c: 0, r: 2 }, EXI = { c: 1, r: 9 };               // the way in (west, facing the road) and out (north, by Alba's south gate)
  const CL = { c: 5, r: 4 };                                      // the clearing's south-west cell (the clearing is 2 × 2 cells)
  const cellX = c => BOX.x0 + CELL * (c + 0.5), cellZ = r => BOX.z0 - CELL * (r + 0.5);
  const inClear = (c, r) => c >= CL.c && c <= CL.c + 1 && r >= CL.r && r <= CL.r + 1;
  const inGrid = (c, r) => c >= 0 && r >= 0 && c < NC && r < NR;
  const CENTER = { x: BOX.x0 + CELL * (CL.c + 1), z: BOX.z0 - CELL * (CL.r + 1) };          // (36, −92)
  const SCARECROW = { x: CENTER.x, z: CENTER.z - 1.1 }, HATCH = { x: CENTER.x, z: CENTER.z + 1.25 };
  const OUTSIDE = { x: CENTER.x + 0.3, z: CENTER.z + 2.75, yaw: Math.PI };                   // beside the hatch, facing the scarecrow
  // Walls: V[r][c] is the wall on the west side of cell (c, r) (c = NC: the east edge); H[r][c] the wall on the south
  // side of cell (c, r) (r = NR: the north edge). Rows count north from the field's south edge.
  function gen(seed) {
    const R = rng(seed);
    const V = Array.from({ length: NR }, () => Array(NC + 1).fill(true));
    const H = Array.from({ length: NR + 1 }, () => Array(NC).fill(true));
    const wallOf = (c, r, c2, r2) => (c2 > c ? [V, r, c2] : c2 < c ? [V, r, c] : r2 > r ? [H, r2, c] : [H, r, c]);
    const isOpen = (c, r, c2, r2) => { const [A, i, j] = wallOf(c, r, c2, r2); return !A[i][j]; };
    const setOpen = (c, r, c2, r2, v = true) => { const [A, i, j] = wallOf(c, r, c2, r2); A[i][j] = !v; };
    const nbrs = (c, r) => DIRS.map(([dc, dr]) => [c + dc, r + dr]).filter(([c2, r2]) => inGrid(c2, r2) && isOpen(c, r, c2, r2));
    const bfs = (c0, r0) => {
      const D = new Array(NC * NR).fill(-1), q = [[c0, r0]]; D[r0 * NC + c0] = 0;
      for (let k = 0; k < q.length; k++) { const [c, r] = q[k]; for (const [c2, r2] of nbrs(c, r)) if (D[r2 * NC + c2] < 0) { D[r2 * NC + c2] = D[r * NC + c] + 1; q.push([c2, r2]); } }
      return D;
    };
    const CLC = [[CL.c, CL.r], [CL.c + 1, CL.r], [CL.c, CL.r + 1], [CL.c + 1, CL.r + 1]];
    setOpen(CL.c, CL.r, CL.c + 1, CL.r); setOpen(CL.c, CL.r + 1, CL.c + 1, CL.r + 1); setOpen(CL.c, CL.r, CL.c, CL.r + 1); setOpen(CL.c + 1, CL.r, CL.c + 1, CL.r + 1);
    // the recursive backtracker (with a stack), from the way in; the clearing counts as one place
    const node = (c, r) => (inClear(c, r) ? -1 : r * NC + c);
    const seen = new Set([node(ENT.c, ENT.r)]), stack = [[ENT.c, ENT.r]];
    while (stack.length) {
      const [c, r] = stack[stack.length - 1], opts = [];
      for (const [a, b] of inClear(c, r) ? CLC : [[c, r]]) for (const [dc, dr] of DIRS) { const c2 = a + dc, r2 = b + dr; if (inGrid(c2, r2) && !seen.has(node(c2, r2))) opts.push([a, b, c2, r2]); }
      if (!opts.length) { stack.pop(); continue; }
      const [a, b, c2, r2] = opts[Math.floor(R() * opts.length)];
      setOpen(a, b, c2, r2); seen.add(node(c2, r2)); stack.push([c2, r2]);
    }
    // a few extra openings between places far apart along the paths, so it loops (never opening up a 2 × 2 plaza)
    const plaza = (i, j) => i > 0 && j > 0 && i < NC && j < NR && !V[j - 1][i] && !V[j][i] && !H[j][i - 1] && !H[j][i];
    const cand = [];
    for (let r = 0; r < NR; r++) for (let c = 1; c < NC; c++) cand.push([c - 1, r, c, r]);
    for (let r = 1; r < NR; r++) for (let c = 0; c < NC; c++) cand.push([c, r - 1, c, r]);
    shuffle(cand, R);
    const loops = [];
    for (const [a, b, c, d] of cand) {
      if (loops.length >= 7) break;
      if (inClear(a, b) || inClear(c, d) || isOpen(a, b, c, d) || bfs(a, b)[d * NC + c] < 12) continue;
      setOpen(a, b, c, d);
      const ends = c > a ? [[c, b], [c, b + 1]] : [[a, d], [a + 1, d]];         // the wall's two corners
      if (ends.some(([i, j]) => plaza(i, j))) { setOpen(a, b, c, d, false); continue; }
      loops.push([a, b, c, d]);
    }
    // the clearing has at least two ways in
    const border = [];
    for (const [a, b] of CLC) for (const [dc, dr] of DIRS) { const c2 = a + dc, r2 = b + dr; if (inGrid(c2, r2) && !inClear(c2, r2)) border.push([a, b, c2, r2]); }
    let openB = border.filter(w => isOpen(...w));
    if (openB.length < 2) {
      const D = bfs(openB[0][2], openB[0][3]);
      const w = border.filter(x => !isOpen(...x)).sort((p, q) => D[q[3] * NC + q[2]] - D[p[3] * NC + p[2]])[0];
      setOpen(...w); openB = border.filter(x => isOpen(...x));
    }
    V[ENT.r][0] = false; H[NR][EXI.c] = false;                     // the way in and the way out
    const isEnd = (c, r) => (c === ENT.c && r === ENT.r) || (c === EXI.c && r === EXI.r);
    const DE = bfs(ENT.c, ENT.r), DC = bfs(CL.c, CL.r);
    const dead = [];
    for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
      if (inClear(c, r) || isEnd(c, r)) continue;
      const n = nbrs(c, r); if (n.length !== 1) continue;
      dead.push({ c, r, d: DE[r * NC + c], dc: n[0][0] - c, dr: n[0][1] - r });
    }
    // spread out: each next pick is the dead end farthest from the ones already taken (and from the way in)
    const far = (list, n, taken) => {
      const out = [];
      while (out.length < n) {
        let best = null, bs = -1;
        for (const k of list) {
          if (out.includes(k) || taken.includes(k)) continue;
          const s = Math.min(...taken.concat(out).map(o => Math.hypot(o.c - k.c, o.r - k.r))) + Math.min(k.d, 14) * 0.12;
          if (s > bs) { bs = s; best = k; }
        }
        if (!best) break;
        out.push(best);
      }
      return out;
    };
    const anchor = [{ c: ENT.c, r: ENT.r }], pool = dead.filter(k => k.d >= 4);
    const scouts = far(pool, 3, anchor), treats = far(pool, 3, anchor.concat(scouts));
    const toCenter = Math.min(...[[CL.c, CL.r], [CL.c + 1, CL.r], [CL.c, CL.r + 1], [CL.c + 1, CL.r + 1]].map(([c, r]) => DE[r * NC + c]));
    return { V, H, isOpen, nbrs, bfs, dead, scouts, treats, loops, openings: openB.length, toCenter, toExit: DC[EXI.r * NC + EXI.c] };
  }
  const MZ = gen(SEED);
  // a dead end's spot: tucked in at its closed end, facing the way out of it
  const spotOf = k => ({ c: k.c, r: k.r, x: cellX(k.c) - k.dc * 0.8, z: cellZ(k.r) + k.dr * 0.8, yaw: Math.atan2(k.dc, -k.dr) });
  const SPOTS = { scouts: MZ.scouts.map(spotOf), treats: MZ.treats.map(spotOf) };
  // the walls as solids: runs of up to three cells, each an oriented box (world.js only looks 9 units around you)
  function runsOf(M) {
    const out = [];
    for (let c = 0; c <= NC; c++) for (let r = 0; r < NR;) {
      if (!M.V[r][c]) { r++; continue; }
      let n = 0; while (r + n < NR && M.V[r + n][c] && n < 3) n++;
      out.push({ x1: BOX.x0 + c * CELL, z1: BOX.z0 - r * CELL, x2: BOX.x0 + c * CELL, z2: BOX.z0 - (r + n) * CELL }); r += n;
    }
    for (let r = 0; r <= NR; r++) for (let c = 0; c < NC;) {
      if (!M.H[r][c]) { c++; continue; }
      let n = 0; while (c + n < NC && M.H[r][c + n] && n < 3) n++;
      out.push({ x1: BOX.x0 + c * CELL, z1: BOX.z0 - r * CELL, x2: BOX.x0 + (c + n) * CELL, z2: BOX.z0 - r * CELL }); c += n;
    }
    return out;
  }
  const RUNS = runsOf(MZ);
  const SOLIDS = RUNS.map(w => ({ obox: 1, x: (w.x1 + w.x2) / 2, z: (w.z1 + w.z2) / 2, hw: Math.abs(w.x2 - w.x1) / 2 + T_SOLID, hd: Math.abs(w.z2 - w.z1) / 2 + T_SOLID, rot: 0 }));
  const SEGS = [];        // every wall, one cell long: [x1, z1, x2, z2]
  for (let c = 0; c <= NC; c++) for (let r = 0; r < NR; r++) if (MZ.V[r][c]) SEGS.push([BOX.x0 + c * CELL, BOX.z0 - r * CELL, BOX.x0 + c * CELL, BOX.z0 - (r + 1) * CELL]);
  for (let r = 0; r <= NR; r++) for (let c = 0; c < NC; c++) if (MZ.H[r][c]) SEGS.push([BOX.x0 + c * CELL, BOX.z0 - r * CELL, BOX.x0 + (c + 1) * CELL, BOX.z0 - r * CELL]);
  // trodden paths outside: from the old road to the way in, and from the way out to Alba's main street, just inside its south gate
  const ENTRY = [[4.2, -81.4], [7.4, -81.7], [10.6, -82], [12.8, -82]];
  const EXIT_PATH = [[18, -111.2], [17.4, -114.2], [12.6, -114.6], [6, -112.8], [1.0, -110.6], [-2.5, -108.2], [-7.2, -108.0]];   // (between Alba's houses and the bench by the gate)
  const PATHS = [{ pts: ENTRY, w: 2.6 }, { pts: EXIT_PATH, w: 2.2 }];
  const boxOut = (x, z) => Math.max(BOX.x0 - x, x - BOX.x1, z - BOX.z0, BOX.z1 - z);       // < 0 inside the field
  // where world.js's own trees, rocks and flowers shouldn't go: the field (and a margin), and the two paths
  function keepClear(x, z, pad = 0) {
    if (x < BOX.x0 - 32 || x > BOX.x1 + 14 || z > BOX.z0 + 14 || z < BOX.z1 - 14) return false;
    if (boxOut(x, z) < 2.5 + pad) return true;
    for (const p of PATHS) if (polyDist(p.pts, x, z) < p.w / 2 + 1.4 + pad) return true;
    return false;
  }
  // no grass here (0..1): the field's dirt floor reaches a unit past the corn, and the paths
  function bareAt(x, z) {
    if (x < BOX.x0 - 30 || x > BOX.x1 + 6 || z > BOX.z0 + 6 || z < BOX.z1 - 8) return 0;
    let a = 1 - smoothstep(-0.1, 0.8, boxOut(x, z));          // (weeds grow up to the outer rows of corn)
    for (const p of PATHS) a = Math.max(a, 1 - smoothstep(p.w / 2 - 0.3, p.w / 2 + 0.4, polyDist(p.pts, x, z)));
    return a;
  }
  // how much world.js flattens the ground to FLAT_Y: all of it out to 2 units past the field, none past 7
  const flatK = (x, z) => 1 - smoothstep(2, 7, boxOut(x, z));
  const distTo = (x, z) => Math.max(0, boxOut(x, z));

  // ================================================================ the Corn Society's hall: high over the far west woods (out of sight)
  const HALL = { x: -255, z: 35, y: 300, hw: 11, hd: 9, wh: 6.2 };
  const HY = HALL.y;
  const hp = (lx, lz) => ({ x: HALL.x + lx, z: HALL.z + lz });
  // (you arrive a few steps off the ladder: out of "Climb up"'s reach, so an E pressed as the fade lifts doesn't send you back up)
  const LADDER = hp(-10.35, 4.4), ARRIVE = Object.assign(hp(-6.6, 4.6), { yaw: Math.PI });
  const THRONE = hp(0, -7.5), COLONEL = hp(0, -5.1);
  const TABLES = [hp(-8.3, -0.5), hp(8.3, -0.5)];
  const COLUMNS = [hp(-5.2, -4.4), hp(5.2, -4.4), hp(-5.2, 2.2), hp(5.2, 2.2)];
  const face = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  const MEMBERS = [
    { id: 'tusa', name: 'Tusa', at: hp(-9.3, 2.85), look: hp(-8.3, 4.4), kernel: '#f2c94c', hood: '#b7c376', h: 1.4, prop: 'lantern' },    // the doorkeeper (the voice under the hatch), by the ladder
    { id: 'arepa', name: 'Arepa', at: hp(-6.7, -1.9), look: hp(-9, -1.9), kernel: '#f4efe2', hood: '#c9b87a', h: 1.45, prop: 'loaf' },
    { id: 'mote', name: 'Mote', at: hp(-6.7, 1.1), look: hp(-9, 0.6), kernel: '#d9573f', hood: '#9cbf5a', h: 1.5 },
    { id: 'chala', name: 'Chala', at: hp(3.2, 5.0), look: hp(4.6, 5.6), kernel: '#4c6fc8', hood: '#b7c376', h: 1.35 },
    { id: 'pochi', name: 'Pochi', at: hp(4.6, 5.6), look: hp(3.2, 5.0), kernel: '#f2c94c', hood: '#a9b86a', h: 1.4 },
    { id: 'choclo', name: 'Choclo', at: hp(6.7, -1.2), look: hp(9, -1.2), kernel: '#7a4fa0', hood: '#c9b87a', h: 1.5, prop: 'book' },
    { id: 'elote', name: 'Elote', at: hp(8.4, 3.9), look: hp(5, 3.4), kernel: '#efe2b4', hood: '#a39a78', h: 1.4, elder: true, gray: 0.6 },
    { id: 'pipoca', name: 'Pipoca', at: hp(-8.4, -5.0), look: hp(-6, -3), kernel: '#f4efe2', hood: '#9cbf5a', h: 1.0, kid: true },
  ];
  const PAIRS = { chala: 'pochi', pochi: 'chala' };

  const LANDMARKS = {
    center: { ...CENTER }, scarecrow: { ...SCARECROW }, hatch: { ...HATCH }, outside: { ...OUTSIDE },
    entrance: { x: BOX.x0, z: cellZ(ENT.r) }, exit: { x: cellX(EXI.c), z: BOX.z1 }, road: { x: ENTRY[0][0], z: ENTRY[0][1] }, alba: { x: EXIT_PATH[EXIT_PATH.length - 1][0], z: EXIT_PATH[EXIT_PATH.length - 1][1] },
    scouts: SPOTS.scouts.map(s => ({ x: s.x, z: s.z })), treats: SPOTS.treats.map(s => ({ x: s.x, z: s.z })),
    hall: { x: HALL.x, z: HALL.z, y: HY }, ladder: { ...LADDER }, colonel: { ...COLONEL }, throne: { ...THRONE },
  };
  const LAYOUT = {
    box: { ...BOX }, farm: { ...BOX }, cell: CELL, cols: NC, rows: NR, flatY: FLAT_Y, seed: SEED,
    entrance: { x: BOX.x0, z: cellZ(ENT.r), c: ENT.c, r: ENT.r, side: 'west' }, exit: { x: cellX(EXI.c), z: BOX.z1, c: EXI.c, r: EXI.r, side: 'north' },
    center: { ...CENTER, c: CL.c, r: CL.r, size: 2 }, hatch: { ...HATCH }, scarecrow: { ...SCARECROW },
    // the grid: V[r][c] / H[r][c] (see gen), and a cell's centre, or the cell at a spot
    cells: { V: MZ.V, H: MZ.H, isOpen: MZ.isOpen, x: cellX, z: cellZ, at: (x, z) => ({ c: Math.floor((x - BOX.x0) / CELL), r: Math.floor((BOX.z0 - z) / CELL) }) },
    walls: SEGS.map(s => s.slice()), paths: PATHS.map(p => ({ w: p.w, pts: p.pts.map(q => q.slice()) })),
    scouts: SPOTS.scouts.map(s => ({ ...s })), treats: SPOTS.treats.map(s => ({ ...s })), deadEnds: MZ.dead.length, loops: MZ.loops.length,
    openings: MZ.openings, steps: { toCenter: MZ.toCenter, toExit: MZ.toExit }, solids: SOLIDS.length, hall: { ...HALL },
  };

  // ================================================================ words, icons and lines (registered at load)
  const NEW_WORDS = [
    { id: 'w.corn', kind: 'word', es: 'maíz', pt: 'milho', de: 'Mais', en: 'corn', g: { es: 'm', pt: 'm', de: 'm' }, icon: 'corn', alt: { es: ['choclo', 'elote'] } },
    { id: 'w.scarecrow', kind: 'word', es: 'espantapájaros', pt: 'espantalho', de: 'Vogelscheuche', en: 'scarecrow', g: { es: 'm', pt: 'm', de: 'f' },
      pl: { es: 'espantapájaros', pt: 'espantalhos', de: 'Vogelscheuchen' }, icon: 'scarecrow' },
    { id: 'w.password', kind: 'word', es: 'contraseña', pt: 'senha', de: 'Passwort', en: 'password', g: { es: 'f', pt: 'f', de: 'n' },
      pl: { es: 'contraseñas', pt: 'senhas', de: 'Passwörter' }, icon: 'password', alt: { es: ['clave'], de: ['Parole', 'Kennwort'] } },
    { id: 'w.maze', kind: 'word', es: 'laberinto', pt: 'labirinto', de: 'Labyrinth', en: 'maze', g: { es: 'm', pt: 'm', de: 'n' },
      pl: { es: 'laberintos', pt: 'labirintos', de: 'Labyrinthe' }, icon: 'maze', alt: { de: ['Irrgarten'] } },
    // the prize (a key item, not a word to teach): «el Grano de Oro» · «o Grão de Ouro» · «das Goldkorn»
    { id: 'k.goldenKernel', kind: 'key', es: 'Grano de Oro', pt: 'Grão de Ouro', de: 'Goldkorn', en: 'Golden Kernel', g: { es: 'm', pt: 'm', de: 'n' }, icon: 'goldenKernel' },
  ];
  if (typeof LEX !== 'undefined') LEX.register(NEW_WORDS.filter(w => !LEX.item(w.id)));
  if (typeof ICONS !== 'undefined' && ICONS.add) {
    const has = k => ICONS.keys.includes(k);
    if (!has('corn')) ICONS.add('corn', (c, p, h) => {
      h.shape(c, p, h.poly([[-4, 34], [-27, 4], [-21, -26], [-8, 2], [0, 34]]), '#7fb04a');
      h.shape(c, p, h.ell(4, -2, 14, 30, 0.15), '#f2c94c');
      if (p) for (let r = -3; r <= 3; r++) for (let k = -1; k <= 1; k++) h.dot(c, 4 + k * 7 + (r & 1) * 3.5 - r * 0.9, -2 + r * 8, 2.6, '#d9a32c');
      h.shape(c, p, h.poly([[2, 34], [23, 6], [31, -18], [12, 9], [8, 34]]), '#9cc45a');
    });
    if (!has('scarecrow')) ICONS.add('scarecrow', (c, p, h) => {
      h.shape(c, p, h.rr(-3, -14, 6, 50, 2), '#8a5f3e');
      h.shape(c, p, h.rr(-34, -3, 68, 9, 3), '#d9573f');
      h.shape(c, p, h.rr(-13, -5, 26, 27, 6), '#4f6fae');
      h.shape(c, p, h.ell(0, -18, 12, 12), '#e2c48c');
      h.shape(c, p, h.poly([[-23, -26], [23, -26], [9, -31], [0, -44], [-9, -31]]), '#c9a24e');
      if (p) {
        h.dot(c, -4, -19, 2.3, h.INK); h.dot(c, 4, -19, 2.3, h.INK);
        c.beginPath(); c.arc(0, -16, 4.5, 0.25, Math.PI - 0.25); c.lineWidth = 1.6; c.strokeStyle = h.INK; c.stroke();
        [-36, 36].forEach(x => h.dot(c, x, 1, 3.4, '#f2cf55'));
      }
    });
    if (!has('password')) ICONS.add('password', (c, p, h) => {      // a key
      h.shape(c, p, h.rr(-6, -4, 40, 9, 2), '#f2c14e');
      h.shape(c, p, h.rr(18, 3, 6, 11, 1), '#f2c14e'); h.shape(c, p, h.rr(27, 3, 6, 8, 1), '#f2c14e');
      h.shape(c, p, h.ell(-16, 0, 15, 15), '#f2c14e');
      if (p) h.dot(c, -16, 0, 5.5, '#fffaf0');
    });
    if (!has('maze')) ICONS.add('maze', (c, p, h) => {
      h.shape(c, p, h.rr(-32, -32, 64, 64, 6), '#e8d39a');
      if (p) {
        c.lineWidth = 5; c.lineCap = 'round'; c.strokeStyle = '#5f9438'; c.beginPath();
        [[-24, -24, 24, -24], [24, -24, 24, 10], [-24, -24, -24, 24], [-24, 24, 14, 24], [-12, -12, 12, -12], [-12, -12, -12, 12], [0, 0, 24, 0], [-12, 12, 4, 12]]
          .forEach(([a, b, d, e]) => { c.moveTo(a, b); c.lineTo(d, e); });
        c.stroke(); h.dot(c, 4, 4, 4, '#e0503f');
      }
    });
    if (!has('goldenKernel')) ICONS.add('goldenKernel', (c, p, h) => {
      h.shape(c, p, c2 => { c2.moveTo(0, -30); c2.bezierCurveTo(25, -30, 27, 6, 10, 26); c2.quadraticCurveTo(0, 34, -10, 26); c2.bezierCurveTo(-27, 6, -25, -30, 0, -30); c2.closePath(); }, '#ffcf3f');
      if (p) {
        h.shape(c, 1, h.ell(0, 13, 7, 10), '#fff1b8', 1.4); h.dot(c, -7, -14, 6, 'rgba(255,255,255,0.75)');
        [[-30, -22, 5], [29, -16, 6], [25, 24, 4]].forEach(([x, y, r]) => { c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? r * 0.35 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fillStyle = '#fff3a0'; c.fill(); });
      }
    });
  }
  // Everything people say here, in lines.js's format: es / pt / de [simpler, richer] (picked by LEX.tier()), and the English
  // for the weave. {please} becomes the word «por favor» / «bitte» itself (the password has to come through in the language).
  // In the language versions only {w.*} slots, never at the start of a sentence; nobody assumes the player's gender.
  const LT = {
    // the scouts, hiding in dead ends: one hint each
    'corn.kid1': {
      es: ['¡Ay, me encontraste! Psst… el {w.scarecrow} tiene una puerta a sus pies.', '¡Ay, me encontraste! Psst… ¿ves el {w.scarecrow} del centro? A sus pies hay una puerta secreta. ¡Pero no le digas a nadie!'],
      pt: ['Ai, você me achou! Psiu… o {w.scarecrow} tem uma porta nos pés dele.', 'Ai, você me achou! Psiu… tá vendo o {w.scarecrow} lá no meio? Nos pés dele tem uma porta secreta. Mas não conta pra ninguém!'],
      de: ['Oh, du hast mich gefunden! Psst … die {w.scarecrow} hat eine Tür unter den Füßen.', 'Oh, du hast mich gefunden! Psst … siehst du die {w.scarecrow} in der Mitte? Unter ihren Füßen ist eine Geheimtür. Aber sag es niemandem!'],
      en: ['Oh, you found me! Psst… the {w.scarecrow} has a door at its feet.', 'Oh, you found me! Psst… see the {w.scarecrow} in the middle? There’s a secret door at its feet. But don’t tell anyone!'] },
    'corn.kid2': {
      es: ['Psst… abajo vive la Sociedad del Maíz. Una voz te pide la {w.password}.', 'Psst… debajo del {w.maze} vive la Sociedad del Maíz. Si tocas la puerta, una voz te pide la {w.password}. ¡Sin {w.password}, no entras!'],
      pt: ['Psiu… lá embaixo mora a Sociedade do Milho. Uma voz pede a {w.password}.', 'Psiu… embaixo do {w.maze} mora a Sociedade do Milho. Se você bater na porta, uma voz pede a {w.password}. Sem {w.password}, ninguém entra!'],
      de: ['Psst … unten wohnt der Maisbund. Eine Stimme fragt nach dem {w.password}.', 'Psst … unter dem {w.maze} wohnt der Maisbund. Wenn du an die Tür klopfst, fragt eine Stimme nach dem {w.password}. Ohne {w.password} kommt keiner rein!'],
      en: ['Psst… the Corn Society lives down below. A voice asks for the {w.password}.', 'Psst… the Corn Society lives under the {w.maze}. If you knock on the door, a voice asks for the {w.password}. No {w.password}, no way in!'] },
    'corn.kid3': {
      es: ['La {w.password} es la palabra mágica: ¡por favor!', 'Psst… ¿la {w.password}? Es la palabra mágica: ¡por favor! La dices cuando pides algo con cariño.'],
      pt: ['A {w.password} é a palavra mágica: por favor!', 'Psiu… a {w.password}? É a palavra mágica: por favor! A gente fala quando pede alguma coisa com carinho.'],
      de: ['Das {w.password} ist das Zauberwort: bitte!', 'Psst … das {w.password}? Es ist das Zauberwort: bitte! Man sagt es, wenn man nett um etwas bittet.'],
      en: ['The {w.password} is the magic word: «{please}»!', 'Psst… the {w.password}? It’s the magic word: «{please}»! You say it when you ask for something nicely.'] },
    'corn.kidAfter': {
      es: ['¡Ya no susurramos! ¡HOLA!', '¡Ya no tenemos que susurrar! El Coronel dice que hablar fuerte es bueno. ¡HOLA, HOLA!'],
      pt: ['A gente não cochicha mais! OI!', 'A gente não precisa mais cochichar! O Coronel disse que falar alto é bom. OI, OI!'],
      de: ['Wir flüstern nicht mehr! HALLO!', 'Wir müssen nicht mehr flüstern! Der Oberst sagt, laut reden ist gut. HALLO, HALLO!'],
      en: ['We don’t whisper anymore! {w.hello}!', 'We don’t have to whisper anymore! The Colonel says speaking up is good. {w.hello}, {w.hello}!'] },
    // the muffled voice under the hatch (Tusa, the doorkeeper)
    'corn.door.who': {
      es: ['¿Quién es? ¿La {w.password}?', '¿Quién anda ahí? ¡Shh! Si quieres entrar, dime la {w.password}.'],
      pt: ['Quem é? A {w.password}?', 'Quem está aí? Psiu! Se quiser entrar, me diz a {w.password}.'],
      de: ['Wer ist da? Das {w.password}?', 'Wer ist da? Pst! Wenn du rein willst, sag mir das {w.password}.'],
      en: ['Who’s there? The {w.password}?', 'Who’s there? Shh! If you want to come in, tell me the {w.password}.'] },
    'corn.door.no': {
      es: ['¡No! Esa no es.', '¡No, no! Esa no es la {w.password}. Es una palabra mágica… la dices cuando pides algo.'],
      pt: ['Não! Não é essa.', 'Não, não! Essa não é a {w.password}. É uma palavra mágica… você fala quando pede alguma coisa.'],
      de: ['Nein! Das ist es nicht.', 'Nein, nein! Das ist nicht das {w.password}. Es ist ein Zauberwort … man sagt es, wenn man um etwas bittet.'],
      en: ['No! That’s not it.', 'No, no! That’s not the {w.password}. It’s a magic word… you say it when you ask for something.'] },
    'corn.door.en': {
      es: ['La palabra mágica… ¡pero no en inglés!'], pt: ['A palavra mágica… mas não em inglês!'], de: ['Das Zauberwort … aber nicht auf Englisch!'],
      en: ['The magic word… but not in English!'] },
    'corn.door.thanks': {
      es: ['¡Esa es la otra palabra mágica! No «gracias»… la de pedir.'], pt: ['Essa é a outra palavra mágica! Não «obrigado»… a de pedir.'],
      de: ['Das ist das andere Zauberwort! Nicht „danke“ … das Wort zum Bitten.'], en: ['That’s the other magic word! Not “{c.thanks}”… the one for asking.'] },
    'corn.door.close': { es: ['¡Casi! Dilo bien.'], pt: ['Quase! Fala direito.'], de: ['Fast! Sag es richtig.'], en: ['Almost! Say it properly.'] },
    'corn.door.yes': {
      es: ['¡Correcto! Pasa… pero en silencio.', '¡Correcto! Pueden pasar. Bajen por la escalera… pero en silencio.'],
      pt: ['Certo! Pode entrar… mas em silêncio.', 'Certo! Podem entrar. Desçam pela escada… mas em silêncio.'],
      de: ['Richtig! Komm rein … aber leise.', 'Richtig! Ihr dürft rein. Steigt die Leiter runter … aber leise.'],
      en: ['Correct! Come in… but quietly.', 'Correct! You can come in. Climb down the ladder… but quietly.'] },
    // the Society: whispers before you win, and out loud after
    'corn.m.tusa': {
      es: ['Shh… habla bajito, por favor.', 'Shh… aquí abajo hablamos bajito. Así el Silencio no nos encuentra.'],
      pt: ['Psiu… fala baixinho, por favor.', 'Psiu… aqui embaixo a gente fala baixinho. Assim o Silêncio não acha a gente.'],
      de: ['Pst … sprich leise, bitte.', 'Pst … hier unten sprechen wir leise. So findet uns die Stille nicht.'],
      en: ['Shh… talk quietly, {c.please}.', 'Shh… down here we talk quietly. That way the Hush can’t find us.'] },
    'corn.m.tusa.after': { es: ['¡Hola! ¡Ya podemos hablar fuerte!'], pt: ['Oi! Agora a gente pode falar alto!'], de: ['Hallo! Jetzt dürfen wir laut reden!'], en: ['{w.hello}! Now we can talk out loud!'] },
    'corn.m.arepa': {
      es: ['¿Quieres {w.bread} de {w.corn}? Está calentito.', 'Psst… ¿quieres {w.bread} de {w.corn}? Está calentito. Toma uno, para el camino.'],
      pt: ['Quer {w.bread} de {w.corn}? Está quentinho.', 'Psiu… quer {w.bread} de {w.corn}? Está quentinho. Leva um, pra viagem.'],
      de: ['Willst du Maisbrot? Es ist noch warm.', 'Psst … willst du Maisbrot? Es ist noch warm. Nimm eins mit, für unterwegs.'],
      en: ['Want some {w.bread} made of {w.corn}? It’s still warm.', 'Psst… want some {w.bread} made of {w.corn}? It’s still warm. Take one for the road.'] },
    'corn.m.arepa.after': { es: ['¡Hay {w.bread} de {w.corn} para todos!'], pt: ['Tem {w.bread} de {w.corn} pra todo mundo!'], de: ['Maisbrot für alle! Esst!'], en: ['There’s {w.bread} for everyone! Eat up!'] },
    'corn.m.mote': {
      es: ['Hace mucho que no hablamos fuerte. Es más seguro.', 'Hace meses que no hablamos fuerte. El Coronel dice que es más seguro así.'],
      pt: ['Faz tempo que a gente não fala alto. É mais seguro.', 'Faz meses que a gente não fala alto. O Coronel diz que assim é mais seguro.'],
      de: ['Wir reden schon lange nicht mehr laut. Das ist sicherer.', 'Wir reden seit Monaten nicht mehr laut. Der Oberst sagt, so ist es sicherer.'],
      en: ['We haven’t talked out loud in a long time. It’s safer.', 'We haven’t talked out loud in months. The Colonel says it’s safer that way.'] },
    'corn.m.mote.after': { es: ['¡Qué bien se siente hablar!'], pt: ['Que bom falar de novo!'], de: ['Wie schön, wieder zu reden!'], en: ['It feels so good to talk again!'] },
    'corn.m.chala': {
      es: ['Psst… ¿quién es? ¿Viene del Silencio?', 'Psst… ¿quién es esa persona? ¿Viene del Silencio? Tengo miedo.'],
      pt: ['Psiu… quem é? Veio do Silêncio?', 'Psiu… quem é essa pessoa? Será que veio do Silêncio? Tô com medo.'],
      de: ['Psst … wer ist das? Kommt die Person von der Stille?', 'Psst … wer ist das? Schickt die Stille diese Person? Ich habe Angst.'],
      en: ['Psst… who’s that? Did they come from the Hush?', 'Psst… who is that? Did the Hush send them? I’m scared.'] },
    'corn.m.chala.after': { es: ['¡Perdón! Ustedes son buena gente.'], pt: ['Desculpa! Vocês são gente boa.'], de: ['Entschuldigung! Ihr seid nett.'], en: ['Sorry! You’re good people.'] },
    'corn.m.pochi': {
      es: ['Shh, Chala. Si hacemos ruido, viene el Silencio.'], pt: ['Psiu, Chala. Se a gente fizer barulho, o Silêncio vem.'],
      de: ['Pst, Chala. Wenn wir Lärm machen, kommt die Stille.'], en: ['Shh, Chala. If we make noise, the Hush will come.'] },
    'corn.m.pochi.after': { es: ['¡Hagamos ruido! ¡Mucho ruido!'], pt: ['Vamos fazer barulho! Muito barulho!'], de: ['Lasst uns Lärm machen! Viel Lärm!'], en: ['Let’s make noise! Lots of noise!'] },
    'corn.m.choclo': {
      es: ['Arriba, los niños vigilan el {w.maze}.', 'Arriba, en el {w.maze}, los niños vigilan. Ellos vieron a los calladitos en el camino.'],
      pt: ['Lá em cima, as crianças vigiam o {w.maze}.', 'Lá em cima, no {w.maze}, as crianças vigiam. Elas viram os caladinhos no caminho.'],
      de: ['Oben passen die Kinder auf das {w.maze} auf.', 'Oben im {w.maze} passen die Kinder auf. Sie haben die Schweiglinge auf dem Weg gesehen.'],
      en: ['Up top, the kids keep watch over the {w.maze}.', 'Up in the {w.maze}, the kids keep watch. They saw the Hushlings on the road.'] },
    'corn.m.choclo.after': { es: ['El Grano de Oro… ¡cuídalo mucho!'], pt: ['O Grão de Ouro… cuida bem dele!'], de: ['Das Goldkorn … pass gut darauf auf!'], en: ['The Golden Kernel… take good care of it!'] },
    'corn.m.elote': {
      es: ['A veces olvido palabras… ¿es normal?', 'A veces olvido palabras… Ayer no me acordaba de la palabra «sol». ¿Es normal?'],
      pt: ['Às vezes eu esqueço palavras… é normal?', 'Às vezes eu esqueço palavras… Ontem eu não lembrava a palavra «sol». É normal?'],
      de: ['Manchmal vergesse ich Wörter … ist das normal?', 'Manchmal vergesse ich Wörter … Gestern wusste ich das Wort „Sonne“ nicht mehr. Ist das normal?'],
      en: ['Sometimes I forget words… is that normal?', 'Sometimes I forget words… Yesterday I couldn’t remember the word “sun.” Is that normal?'] },
    'corn.m.elote.after': { es: ['¡Sol! ¡Luna! ¡Maíz! Las palabras vuelven.'], pt: ['Sol! Lua! Milho! As palavras estão voltando.'], de: ['Sonne! Mond! Mais! Die Wörter kommen zurück.'], en: ['Sun! Moon! {w.corn}! The words are coming back.'] },
    'corn.m.pipoca': {
      es: ['Psst… ¿tú hablas fuerte? ¡Qué valiente!', 'Psst… ¿allá arriba hablas fuerte? ¡Qué valiente! Yo casi no hablo.'],
      pt: ['Psiu… você fala alto? Que coragem!', 'Psiu… lá em cima você fala alto? Que coragem! Eu quase não falo.'],
      de: ['Psst … du redest laut? Wie mutig!', 'Psst … da oben redest du laut? Wie mutig! Ich rede fast nie.'],
      en: ['Psst… you talk out loud? So brave!', 'Psst… up there, you talk out loud? So brave! I hardly ever talk.'] },
    'corn.m.pipoca.after': { es: ['¡Mira! ¡Ya hablo fuerte! ¡HOLA!'], pt: ['Olha! Agora eu falo alto! OI!'], de: ['Schau! Jetzt rede ich laut! HALLO!'], en: ['Look! Now I talk out loud! {w.hello}!'] },
    'corn.guard': { es: ['¡Alto! Primero habla con el Coronel.'], pt: ['Alto! Primeiro fale com o Coronel.'], de: ['Halt! Sprich zuerst mit dem Oberst.'], en: ['Halt! Talk to the Colonel first.'] },
    'corn.guard.after': { es: ['¡Firmes! …digo, ¡hola!'], pt: ['Sentido! …quer dizer, oi!'], de: ['Stillgestanden! … äh, hallo!'], en: ['Attention! …I mean, {w.hello}!'] },
    // Colonel Cob
    'corn.col.halt': {
      es: ['¡Alto! ¿Quién anda ahí?', '¡Alto ahí! ¿Quién se atreve a entrar en mi cuartel?'], pt: ['Alto! Quem está aí?', 'Alto lá! Quem se atreve a entrar no meu quartel?'],
      de: ['Halt! Wer ist da?', 'Halt! Wer wagt es, in mein Quartier zu kommen?'], en: ['Halt! Who goes there?', 'Halt! Who dares to come into my headquarters?'] },
    'corn.col.name': {
      es: ['Soy el Coronel Mazorca, jefe de la Sociedad del Maíz.', 'Soy el Coronel Mazorca, jefe de la Sociedad del Maíz. Aquí abajo, nadie hace ruido.'],
      pt: ['Eu sou o Coronel Espiga, chefe da Sociedade do Milho.', 'Eu sou o Coronel Espiga, chefe da Sociedade do Milho. Aqui embaixo, ninguém faz barulho.'],
      de: ['Ich bin Oberst Kolben, der Chef vom Maisbund.', 'Ich bin Oberst Kolben, der Chef vom Maisbund. Hier unten macht niemand Lärm.'],
      en: ['I’m Colonel Cob, leader of the Corn Society.', 'I’m Colonel Cob, leader of the Corn Society. Down here, nobody makes a sound.'] },
    'corn.col.spy': {
      es: ['Ustedes hablan muy fuerte… ¡Son espías del Silencio!', 'Ustedes hablan fuerte y nadie sabe quiénes son… ¡Seguro que son espías del Silencio!'],
      pt: ['Vocês falam muito alto… Vocês trabalham para o Silêncio!', 'Vocês falam alto e ninguém conhece vocês… Com certeza trabalham para o Silêncio!'],
      de: ['Ihr redet so laut … Ihr arbeitet für die Stille!', 'Ihr redet laut, und keiner kennt euch … Ihr arbeitet bestimmt für die Stille!'],
      en: ['You talk so loud… You’re spies for the Hush!', 'You talk loudly, and nobody knows who you are… You must be spies for the Hush!'] },
    'corn.col.attack': { es: ['¡Silencio! ¡Soldados, a formar!'], pt: ['Silêncio! Soldados, em forma!'], de: ['Ruhe! Soldaten, antreten!'], en: ['Silence! Soldiers, fall in!'] },
    'corn.col.again': { es: ['¿Otra vez ustedes? ¡Soldados!'], pt: ['Vocês de novo? Soldados!'], de: ['Ihr schon wieder? Soldaten!'], en: ['You again? Soldiers!'] },
    'corn.col.notyet': { es: ['¡Ja! Ni saben pelear. ¡Fuera de aquí!'], pt: ['Rá! Vocês nem sabem lutar. Fora daqui!'], de: ['Ha! Ihr könnt ja nicht mal kämpfen. Raus hier!'], en: ['Ha! You don’t even know how to fight. Out!'] },
    'corn.col.lose': { es: ['¡Ja! Fuera de aquí… y en silencio.'], pt: ['Rá! Fora daqui… e em silêncio.'], de: ['Ha! Raus hier … und zwar leise.'], en: ['Ha! Out you go… and quietly.'] },
    'corn.col.giveup': {
      es: ['¡Basta, basta! Me rindo.', 'Está bien, está bien… ¡me rindo! ¡Qué palabras tan fuertes!'], pt: ['Chega, chega! Eu me rendo.', 'Tá bom, tá bom… eu me rendo! Que palavras fortes!'],
      de: ['Genug, genug! Ich gebe auf.', 'Schon gut, schon gut … ich gebe auf! Was für starke Wörter!'], en: ['Enough, enough! I give up.', 'All right, all right… I give up! What strong words!'] },
    'corn.col.sorry': {
      es: ['Perdón. Ustedes no son espías.', 'Perdón. Ustedes no son espías… Ustedes hablan, y el Silencio les tiene miedo.'],
      pt: ['Desculpa. Vocês não são do Silêncio.', 'Desculpa. Vocês não trabalham para o Silêncio… Vocês falam, e o Silêncio tem medo de vocês.'],
      de: ['Entschuldigung. Ihr seid nicht von der Stille.', 'Entschuldigung. Ihr arbeitet nicht für die Stille … Ihr redet, und die Stille hat Angst vor euch.'],
      en: ['Sorry. You’re not spies.', 'Sorry. You’re not spies… you talk, and the Hush is afraid of you.'] },
    'corn.col.quiet': {
      es: ['Nos escondimos y nos callamos. Pero el silencio no nos protegió.', 'Nos escondimos aquí abajo y nos callamos. Creíamos que el silencio nos protegía… pero ahora olvidamos palabras.'],
      pt: ['A gente se escondeu e parou de falar. Mas o silêncio não protegeu a gente.', 'A gente se escondeu aqui embaixo e parou de falar. A gente achava que o silêncio protegia… mas agora estamos esquecendo palavras.'],
      de: ['Wir haben uns versteckt und geschwiegen. Aber die Stille hat uns nicht geschützt.', 'Wir haben uns hier unten versteckt und geschwiegen. Wir dachten, die Stille schützt uns … aber jetzt vergessen wir Wörter.'],
      en: ['We hid and kept quiet. But the {c.silence} didn’t protect us.', 'We hid down here and kept quiet. We thought the {c.silence} would protect us… but now we’re forgetting words.'] },
    'corn.col.gift': {
      es: ['Tomen esto: el Grano de Oro.', 'Tomen esto: el Grano de Oro, el tesoro de nuestra Sociedad. Brilla como el sol.'],
      pt: ['Peguem isto: o Grão de Ouro.', 'Peguem isto: o Grão de Ouro, o tesouro da nossa Sociedade. Ele brilha como o sol.'],
      de: ['Nehmt das: das Goldkorn.', 'Nehmt das: das Goldkorn, der Schatz von unserem Bund. Es leuchtet wie die Sonne.'],
      en: ['Take this: the Golden Kernel.', 'Take this: the Golden Kernel, our Society’s treasure. It shines like the sun.'] },
    'corn.col.plant': {
      es: ['Plántenlo donde empezó el silencio.', 'Nuestros abuelos decían: «Plántenlo donde empezó el silencio». Yo nunca supe dónde es.'],
      pt: ['Plantem onde o silêncio começou.', 'Nossos avós diziam: «Plantem onde o silêncio começou». Eu nunca soube onde é.'],
      de: ['Pflanzt es dort, wo die Stille begann.', 'Unsere Großeltern sagten: „Pflanzt es dort, wo die Stille begann.“ Ich wusste nie, wo das ist.'],
      en: ['Plant it where the {c.silence} began.', 'Our grandparents used to say: “Plant it where the {c.silence} began.” I never knew where that is.'] },
    'corn.col.thanks': {
      es: ['¡Gracias! Desde hoy, la Sociedad del Maíz habla fuerte.', '¡Gracias! Desde hoy, la Sociedad del Maíz habla fuerte. Y la {w.tower} vieja está al norte… ¡buena suerte!'],
      pt: ['Obrigado! A partir de hoje, a Sociedade do Milho fala alto.', 'Obrigado! A partir de hoje, a Sociedade do Milho fala alto. E a {w.tower} velha fica no norte… boa sorte!'],
      de: ['Danke! Ab heute redet der Maisbund laut.', 'Danke! Ab heute redet der Maisbund laut. Und der alte {w.tower} ist im Norden … viel Glück!'],
      en: ['{c.thanks}! From today on, the Corn Society speaks up.', '{c.thanks}! From today on, the Corn Society speaks up. And the old {w.tower} is up {c.north}… good luck!'] },
  };
  if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v;     // (window.line() and STORY.sayAt can say them too)
  // your own lines (STORY.you: English, with the words woven in) and the signs
  const YOU = {
    enter: 'Walls of {w.corn}, taller than me… a real {w.maze}!',
    center1: 'The heart of the {w.maze}… and what a grand {w.scarecrow}!',
    center2: 'Wait… there’s a little wooden hatch at its feet. Something’s carved on it: a {w.corn} cob, with a finger on its lips.',
    spy: 'Spies? No! We’re here to stop the Hush. With words!',
    win: 'The Hush takes the words of people who stop using them. Speaking up, mistakes and all, is how you beat it!',
    tower: 'Where the {c.silence} began… that’s the old {w.tower}, up {c.north}!',
  };
  const SIGN_WORDS = { maze: { es: 'LABERINTO', pt: 'LABIRINTO', de: 'LABYRINTH', en: 'maze', zh: '[迷宫|mí gōng]', ja: '[迷路|めいろ]' },
    exit: { es: 'SALIDA', pt: 'SAÍDA', de: 'AUSGANG', en: 'exit (the way out)', zh: '[出口|chū kǒu]', ja: '[出口|でぐち]' } };   // (SIGNS is signs.js's)
  const MOTTO = { before: { es: 'EN SILENCIO, A SALVO', pt: 'EM SILÊNCIO, A SALVO', de: 'STILL IST SICHER', en: 'QUIET IS SAFE', zh: '[安静|ān jìng] [就|jiù] [是|shì] [安全|ān quán]', ja: '[静|しず]か が [安全|あんぜん]' },
    after: { es: '¡HABLEN FUERTE!', pt: 'FALEM ALTO!', de: 'SPRECHT LAUT!', en: 'SPEAK UP!', zh: '[大声|dà shēng] [说|shuō] ！', ja: '[大|おお]きな [声|こえ] で ！' } };
  // zh / ja (CJK.md): words painted on canvas are plain text in the mode (pinyin / rōmaji or characters)
  const plainCM = t => (typeof CJK !== 'undefined' && typeof UI !== 'undefined' && CJK.isCJK(UI.lang) && typeof t === 'string' ? CJK.plain(t, { lang: UI.lang }) : t);
  const KID_NAMES = [{ es: 'Granito', pt: 'Grãozinho', de: 'Körnchen' }, { es: 'Hojita', pt: 'Folhinha', de: 'Blättchen' }, { es: 'Barbita', pt: 'Cabelinho', de: 'Bärtchen' }];
  const COL_NAME = { es: 'Coronel Mazorca', pt: 'Coronel Espiga', de: 'Oberst Kolben' };
  const lang = () => (typeof UI !== 'undefined' && UI.lang) || 'es';
  // ---------------------------------------------------------------- zh / ja (CJK.md notation): the words, the names (the scouts' are
  // little corn words, like Granito / Körnchen; the members' sound like their es names; the Colonel as in CJK.md's table) and
  // every line. The doorkeeper and the members are polite in ja, the kids and the pompous Colonel («わし») aren't; nobody
  // genders the player (zh 你们 / ja おまえ たち for you and Mimo). The password is the magic word: zh 请, ja お願いします.
  const CM_WORDS = {
    'w.corn': { zh: '[玉米|yù mǐ]', ja: 'トウモロコシ', alt: { ja: ['とうもろこし', 'コーン'] } },
    'w.scarecrow': { zh: '[稻草人|dào cǎo rén]', ja: 'かかし', alt: { ja: ['[案山子|かかし]'] } },
    'w.password': { zh: '[暗号|àn hào]', ja: '[合言葉|あいことば]', alt: { zh: ['[口令|kǒu lìng]', '[密码|mì mǎ]'], ja: ['パスワード'] } },
    'w.maze': { zh: '[迷宫|mí gōng]', ja: '[迷路|めいろ]' },
    'k.goldenKernel': { zh: '[金色|jīn sè] [玉米粒|yù mǐ lì]', ja: '[黄金|おうごん] の [粒|つぶ]' },
  };
  if (typeof LEX !== 'undefined') for (const [id, T] of Object.entries(CM_WORDS)) {
    const it = LEX.item(id); if (!it) continue;
    for (const l of ['zh', 'ja']) {
      if (!it[l]) it[l] = T[l];
      if (T.alt && T.alt[l]) { it.alt = it.alt || {}; it.alt[l] = Array.from(new Set([...(it.alt[l] || []), ...T.alt[l]])); }
      if (it.pl && typeof it.pl === 'object' && !it.pl[l]) it.pl[l] = it[l];
    }
  }
  [['[小粒|Xiǎo lì]', 'ツブ'], ['[小叶|Xiǎo yè]', 'ハッパ'], ['[小须|Xiǎo xū]', 'ヒゲ']].forEach(([zh, ja], i) => Object.assign(KID_NAMES[i], { zh, ja }));
  Object.assign(COL_NAME, { zh: '[玉米棒|yù mǐ bàng] [上校|shàng xiào]', ja: 'トウモロコシ [大佐|たいさ]' });
  const CM_NAMES = { tusa: ['[图萨|Tú sà]', 'トゥサ'], arepa: ['[阿雷帕|Ā léi pà]', 'アレパ'], mote: ['[莫特|Mò tè]', 'モテ'], chala: ['[查拉|Chá lā]', 'チャラ'],
    pochi: ['[波奇|Bō qí]', 'ポチ'], choclo: ['[乔克洛|Qiáo kè luò]', 'チョクロ'], elote: ['[埃洛特|Āi luò tè]', 'エローテ'], pipoca: ['[皮波卡|Pí bō kǎ]', 'ピポカ'] };
  // (rōmaji capitalizes these names mid-sentence: «Shī, Chara.»; not トウモロコシ, which is also the word for corn)
  if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['ツブ', 'ハッパ', 'ヒゲ'].concat(Object.values(CM_NAMES).map(n => n[1])));
  // a name as the bubble shows it: zh / ja plain text in the mode, else as written
  const nameCM = (id, fallback) => { const l = lang(), N = CM_NAMES[id]; return N && (l === 'zh' || l === 'ja') ? plainCM(N[l === 'zh' ? 0 : 1]) : fallback; };
  const kidName = i => plainCM(KID_NAMES[i][lang()] || KID_NAMES[i].es);
  const colName = () => plainCM(COL_NAME[lang()] || COL_NAME.es);
  const ALBA_UP = { zh: '[阿尔巴|Ā ěr bā] ↑', ja: 'アルバ ↑' };          // (the north arch's small line, and its Read card)
  // The Corn Society: zh [玉米会|Yù mǐ huì] (a secret society's name, like 天地会), ja トウモロコシ の [会|かい].
  const CM_LT = {
    'corn.kid1': {
      zh: ['[哎呀|āi yā] ， [你|nǐ] [找到|zhǎo dào] [我|wǒ] [了|le] ！ [嘘|xū] … [那个|nà ge] {w.scarecrow} [脚|jiǎo] [下|xià] [有|yǒu] [一|yī] [扇|shàn] [门|mén] 。',
        '[哎呀|āi yā] ， [你|nǐ] [找到|zhǎo dào] [我|wǒ] [了|le] ！ [嘘|xū] … [你|nǐ] [看到|kàn dào] [中间|zhōng jiān] [的|de] {w.scarecrow} [了|le] [吗|ma] ？ [它|tā] [脚|jiǎo] [下|xià] [有|yǒu] [一|yī] [扇|shàn] [秘密|mì mì] [的|de] [门|mén] 。 [可|kě] [别|bié] [告诉|gào su] [别人|bié rén] ！'],
      ja: ['あっ 、 [見|み]つかっちゃった ！ しーっ … あの {w.scarecrow} の [足元|あしもと] に 、 ドア が ある よ 。',
        'あっ 、 [見|み]つかっちゃった ！ しーっ … [真|ま]ん[中|なか] の {w.scarecrow} 、 [見|み]える ？ その [足元|あしもと] に 、 [秘密|ひみつ] の ドア が ある んだ 。 でも 、 [誰|だれ] に も [言|い]っちゃ だめ だ よ ！'] },
    'corn.kid2': {
      zh: ['[嘘|xū] … [下面|xià miàn] [住|zhù] [着|zhe] [玉米会|Yù mǐ huì] 。 [会|huì] [有|yǒu] [一个|yī gè] [声音|shēng yīn] [问|wèn] [你|nǐ] {w.password} 。',
        '[嘘|xū] … {w.maze} [下面|xià miàn] [住|zhù] [着|zhe] [玉米会|Yù mǐ huì] 。 [你|nǐ] [一|yī] [敲门|qiāo mén] ， [就|jiù] [会|huì] [有|yǒu] [一个|yī gè] [声音|shēng yīn] [问|wèn] [你|nǐ] {w.password} 。 [没有|méi yǒu] {w.password} ， [谁|shéi] [都|dōu] [进|jìn] [不|bù] [去|qù] ！'],
      ja: ['しーっ … [下|した] に は 、 トウモロコシ の [会|かい] が [住|す]んで いる んだ 。 [声|こえ] が {w.password} を [聞|き]いて くる よ 。',
        'しーっ … {w.maze} の [下|した] に は 、 トウモロコシ の [会|かい] が [住|す]んで いる んだ 。 ドア を ノック する と 、 [声|こえ] が {w.password} を [聞|き]いて くる よ 。 その {w.password} が ない と 、 [誰|だれ] も [入|はい]れない よ ！'] },
    'corn.kid3': {
      zh: ['[那个|nà ge] {w.password} [就|jiù] [是|shì] [魔法|mó fǎ] [词|cí] ： “ [请|qǐng] ” ！',
        '[嘘|xū] … [你|nǐ] [问|wèn] {w.password} ？ [是|shì] [一个|yī gè] [魔法|mó fǎ] [词|cí] ： “ [请|qǐng] ” ！ [跟|gēn] [别人|bié rén] [要|yào] [东西|dōng xi] [的|de] [时候|shí hou] ， [就|jiù] [说|shuō] [这个|zhè ge] [字|zì] 。'],
      ja: ['えっと 、 {w.password} は [魔法|まほう] の [言葉|ことば] ： 「 お[願|ねが]い します 」 ！',
        'しーっ … {w.password} ？ [魔法|まほう] の [言葉|ことば] だ よ ： 「 お[願|ねが]い します 」 ！ [何|なに] か を [頼|たの]む とき に [言|い]う んだ 。'] },
    'corn.kidAfter': {
      zh: ['[我们|wǒ men] [不|bù] [再|zài] [说|shuō] [悄悄话|qiāo qiāo huà] [了|le] ！ [你好|nǐ hǎo] ！',
        '[我们|wǒ men] [不用|bù yòng] [再|zài] [说|shuō] [悄悄话|qiāo qiāo huà] [了|le] ！ [上校|shàng xiào] [说|shuō] [大声|dà shēng] [说话|shuō huà] [是|shì] [好事|hǎo shì] 。 [你好|nǐ hǎo] ， [你好|nǐ hǎo] ！'],
      ja: ['もう ひそひそ [話|はな]さない よ ！ こんにちは ！',
        'もう ひそひそ [話|はな]さなくて いい んだ ！ [大佐|たいさ] が 、 [大|おお]きな [声|こえ] で [話|はな]す の は いい こと だ って 。 こんにちは 、 こんにちは ！'] },
    'corn.door.who': {
      zh: ['[谁|shéi] ？ {w.password} [呢|ne] ？', '[谁|shéi] [在|zài] [那里|nà lǐ] ？ [嘘|xū] ！ [想|xiǎng] [进来|jìn lái] [的话|de huà] ， [先|xiān] [说|shuō] {w.password} 。'],
      ja: ['[誰|だれ] です か ？ {w.password} は ？', 'そこ に いる の は [誰|だれ] です か ？ しーっ ！ [入|はい]りたい なら 、 {w.password} を [言|い]って ください 。'] },
    'corn.door.no': {
      zh: ['[不|bù] [对|duì] ！ [不|bù] [是|shì] [这个|zhè ge] 。',
        '[不|bù] [对|duì] ， [不|bù] [对|duì] ！ [这|zhè] [不|bù] [是|shì] {w.password} 。 [是|shì] [一个|yī gè] [魔法|mó fǎ] [词|cí] … [跟|gēn] [别人|bié rén] [要|yào] [东西|dōng xi] [的|de] [时候|shí hou] [说|shuō] [的|de] 。'],
      ja: ['[違|ちが]います ！ それ じゃ ありません 。',
        '[違|ちが]います 、 [違|ちが]います ！ それ は {w.password} じゃ ありません 。 [魔法|まほう] の [言葉|ことば] です … [何|なに] か を [頼|たの]む とき に [言|い]う [言葉|ことば] です よ 。'] },
    'corn.door.en': { zh: ['[对|duì] ， [是|shì] [魔法|mó fǎ] [词|cí] … [可是|kě shì] [别|bié] [用|yòng] [英语|Yīng yǔ] [说|shuō] ！'], ja: ['[魔法|まほう] の [言葉|ことば] … でも 、 [英語|えいご] じゃ だめ です ！'] },
    'corn.door.thanks': {
      zh: ['[那|nà] [是|shì] [另|lìng] [一个|yī gè] [魔法|mó fǎ] [词|cí] ！ [不|bù] [是|shì] “ [谢谢|xiè xie] ” … [是|shì] [要|yào] [东西|dōng xi] [时|shí] [说|shuō] [的|de] [那个|nà ge] 。'],
      ja: ['それ は [別|べつ] の [魔法|まほう] の [言葉|ことば] です ！ 「 ありがとう 」 じゃ なくて … [頼|たの]む とき の [言葉|ことば] です 。'] },
    'corn.door.close': { zh: ['[差|chà] [一点|yī diǎn] [就|jiù] [对|duì] [了|le] ！ [再|zài] [好好|hǎo hǎo] [说|shuō] [一|yī] [遍|biàn] 。'], ja: ['おしい ！ ちゃんと [言|い]って ください 。'] },
    'corn.door.yes': {
      zh: ['[对|duì] [了|le] ！ [进来|jìn lái] [吧|ba] … [可是|kě shì] [要|yào] [安静|ān jìng] 。', '[对|duì] [了|le] ！ [你们|nǐ men] [可以|kě yǐ] [进来|jìn lái] 。 [顺着|shùn zhe] [梯子|tī zi] [下来|xià lái] … [可是|kě shì] [要|yào] [安静|ān jìng] 。'],
      ja: ['[正解|せいかい] です ！ どうぞ … でも 、 [静|しず]か に 。', '[正解|せいかい] です ！ どうぞ [入|はい]って ください 。 はしご を [降|お]りて … でも 、 [静|しず]か に お[願|ねが]い します 。'] },
    'corn.m.tusa': {
      zh: ['[嘘|xū] … [请|qǐng] [小声|xiǎo shēng] [说话|shuō huà] 。', '[嘘|xū] … [在|zài] [这|zhè] [下面|xià miàn] ， [我们|wǒ men] [都|dōu] [小声|xiǎo shēng] [说话|shuō huà] 。 [这样|zhè yàng] [寂静|Jì jìng] [就|jiù] [找|zhǎo] [不|bù] [到|dào] [我们|wǒ men] 。'],
      ja: ['しーっ … [小|ちい]さな [声|こえ] で お[願|ねが]い します 。', 'しーっ … ここ で は 、 みんな [小|ちい]さな [声|こえ] で [話|はな]します 。 そう すれば 、 [静寂|せいじゃく] に [見|み]つかりません 。'] },
    'corn.m.tusa.after': { zh: ['[你好|nǐ hǎo] ！ [现在|xiàn zài] [我们|wǒ men] [可以|kě yǐ] [大声|dà shēng] [说话|shuō huà] [了|le] ！'], ja: ['こんにちは ！ もう [大|おお]きな [声|こえ] で [話|はな]せます ！'] },
    'corn.m.arepa': {
      zh: ['[要|yào] [不要|bù yào] {w.corn} {w.bread} ？ [还|hái] [热|rè] [着|zhe] [呢|ne] 。', '[嘘|xū] … [要|yào] [不要|bù yào] {w.corn} {w.bread} ？ [还|hái] [热|rè] [着|zhe] [呢|ne] 。 [拿|ná] [一个|yī gè] ， [路上|lù shang] [吃|chī] [吧|ba] 。'],
      ja: ['あの 、 {w.corn} の {w.bread} 、 いかが です か ？ まだ あたたかい です よ 。', 'しーっ … {w.corn} の {w.bread} 、 いかが です か ？ まだ あたたかい です よ 。 ひとつ 、 [持|も]って [行|い]って ください 。'] },
    'corn.m.arepa.after': { zh: ['[大家|dà jiā] [都|dōu] [有|yǒu] {w.corn} {w.bread} [吃|chī] ！'], ja: ['みんな の ぶん の {w.corn} の {w.bread} が あります よ ！'] },
    'corn.m.mote': {
      zh: ['[我们|wǒ men] [很久|hěn jiǔ] [没有|méi yǒu] [大声|dà shēng] [说话|shuō huà] [了|le] 。 [这样|zhè yàng] [更|gèng] [安全|ān quán] 。', '[我们|wǒ men] [好|hǎo] [几|jǐ] [个|gè] [月|yuè] [没有|méi yǒu] [大声|dà shēng] [说话|shuō huà] [了|le] 。 [上校|shàng xiào] [说|shuō] [这样|zhè yàng] [更|gèng] [安全|ān quán] 。'],
      ja: ['もう [長|なが]い こと 、 [大|おお]きな [声|こえ] で [話|はな]して いません 。 その ほう が [安全|あんぜん] です 。', 'もう [何|なん]か[月|げつ] も 、 [大|おお]きな [声|こえ] で [話|はな]して いません 。 [大佐|たいさ] が 、 その ほう が [安全|あんぜん] だ と [言|い]う んです 。'] },
    'corn.m.mote.after': { zh: ['[又|yòu] [能|néng] [说话|shuō huà] [了|le] ， [真|zhēn] [好|hǎo] ！'], ja: ['また [話|はな]せる って 、 いい です ね ！'] },
    'corn.m.chala': {
      zh: ['[嘘|xū] … [那|nà] [是|shì] [谁|shéi] ？ [是|shì] [从|cóng] [寂静|Jì jìng] [那里|nà lǐ] [来|lái] [的|de] [吗|ma] ？', '[嘘|xū] … [那个|nà ge] [人|rén] [是|shì] [谁|shéi] ？ [是|shì] [寂静|Jì jìng] [派|pài] [来|lái] [的|de] [吗|ma] ？ [我|wǒ] [好|hǎo] [害怕|hài pà] 。'],
      ja: ['しーっ … あの [人|ひと] は [誰|だれ] です か ？ [静寂|せいじゃく] から [来|き]た の でしょう か ？', 'しーっ … あの [人|ひと] は [誰|だれ] です か ？ [静寂|せいじゃく] が [送|おく]って [来|き]た の でしょう か ？ こわい です 。'] },
    'corn.m.chala.after': { zh: ['[对不起|duì bu qǐ] ！ [你们|nǐ men] [都|dōu] [是|shì] [好人|hǎo rén] 。'], ja: ['ごめんなさい ！ みなさん 、 いい [人|ひと] たち です ね 。'] },
    'corn.m.pochi': { zh: ['[嘘|xū] ， [查拉|Chá lā] 。 [我们|wǒ men] [要是|yào shi] [出声|chū shēng] ， [寂静|Jì jìng] [就|jiù] [会|huì] [来|lái] 。'], ja: ['しーっ 、 チャラ 。 [音|おと] を [立|た]てたら 、 [静寂|せいじゃく] が [来|く]る よ 。'] },
    'corn.m.pochi.after': { zh: ['[一起|yī qǐ] [出声|chū shēng] [吧|ba] ！ [大声|dà shēng] [一点|yī diǎn] ！'], ja: ['[騒|さわ]ごう ！ もっと [騒|さわ]ごう ！'] },
    'corn.m.choclo': {
      zh: ['[孩子们|hái zi men] [在|zài] [上面|shàng miàn] [看守|kān shǒu] {w.maze} 。', '[孩子们|hái zi men] [在|zài] [上面|shàng miàn] [的|de] {w.maze} [里|lǐ] [放哨|fàng shào] 。 [他们|tā men] [在|zài] [路上|lù shang] [看见|kàn jiàn] [了|le] [小默默|xiǎo mò mò] 。'],
      ja: ['[上|うえ] で は 、 [子|こ]ども たち が {w.maze} を [見張|みは]って います 。', '[上|うえ] の {w.maze} で 、 [子|こ]ども たち が [見張|みは]って います 。 [道|みち] で 、 だまりっこ を [見|み]た そう です 。'] },
    'corn.m.choclo.after': { zh: ['[金色|jīn sè] [玉米粒|yù mǐ lì] … [你|nǐ] [要|yào] [好好|hǎo hǎo] [保管|bǎo guǎn] [它|tā] ！'], ja: ['[黄金|おうごん] の [粒|つぶ] … [大事|だいじ] に して ください ね ！'] },
    'corn.m.elote': {
      zh: ['[我|wǒ] [有时候|yǒu shí hou] [会|huì] [忘记|wàng jì] [词|cí] … [这|zhè] [正常|zhèng cháng] [吗|ma] ？', '[我|wǒ] [有时候|yǒu shí hou] [会|huì] [忘记|wàng jì] [词|cí] … [昨天|zuó tiān] [我|wǒ] [想|xiǎng] [不|bù] [起来|qǐ lái] “ [太阳|tài yáng] ” [这个|zhè ge] [词|cí] 。 [这|zhè] [正常|zhèng cháng] [吗|ma] ？'],
      ja: ['ときどき 、 [言葉|ことば] を [忘|わす]れて しまいます … [普通|ふつう] でしょう か ？', 'ときどき 、 [言葉|ことば] を [忘|わす]れて しまいます … [昨日|きのう] は 「 [太陽|たいよう] 」 と いう [言葉|ことば] が 、 [出|で]て きません でした 。 [普通|ふつう] でしょう か ？'] },
    'corn.m.elote.after': { zh: ['[太阳|tài yáng] ！ [月亮|yuè liang] ！ [玉米|yù mǐ] ！ [词|cí] [都|dōu] [回来|huí lái] [了|le] ！'], ja: ['[太陽|たいよう] ！ [月|つき] ！ トウモロコシ ！ [言葉|ことば] が [戻|もど]って きました ！'] },
    'corn.m.pipoca': {
      zh: ['[嘘|xū] … [你|nǐ] [敢|gǎn] [大声|dà shēng] [说话|shuō huà] ？ [好|hǎo] [勇敢|yǒng gǎn] ！', '[嘘|xū] … [你|nǐ] [在|zài] [上面|shàng miàn] [大声|dà shēng] [说话|shuō huà] [吗|ma] ？ [好|hǎo] [勇敢|yǒng gǎn] ！ [我|wǒ] [几乎|jī hū] [不|bù] [说话|shuō huà] 。'],
      ja: ['しーっ … [大|おお]きな [声|こえ] で [話|はな]す の ？ すごい 、 [勇気|ゆうき] ある ね ！', 'しーっ … [上|うえ] で は [大|おお]きな [声|こえ] で [話|はな]す の ？ すごい 、 [勇気|ゆうき] ある ね ！ わたし は 、 ほとんど [話|はな]さない 。'] },
    'corn.m.pipoca.after': { zh: ['[你|nǐ] [看|kàn] ！ [我|wǒ] [现在|xiàn zài] [敢|gǎn] [大声|dà shēng] [说话|shuō huà] [了|le] ！ [你好|nǐ hǎo] ！'], ja: ['[見|み]て ！ もう [大|おお]きな [声|こえ] で [話|はな]せる よ ！ こんにちは ！'] },
    'corn.guard': { zh: ['[站住|zhàn zhù] ！ [先|xiān] [去|qù] [跟|gēn] [上校|shàng xiào] [说话|shuō huà] ！'], ja: ['[止|と]まれ ！ まず は [大佐|たいさ] と [話|はな]して ください 。'] },
    'corn.guard.after': { zh: ['[立正|lì zhèng] ！ … [我|wǒ] [是|shì] [说|shuō] ， [你好|nǐ hǎo] ！'], ja: ['[気|き] を つけ ！ … じゃ なくて 、 こんにちは ！'] },
    // Colonel Cob: gruff and pompous («わし», plain forms; おまえ たち before the fight, きみ たち once he's sorry)
    'corn.col.halt': {
      zh: ['[站住|zhàn zhù] ！ [什么|shén me] [人|rén] ？', '[站住|zhàn zhù] ！ [谁|shéi] [敢|gǎn] [闯进|chuǎng jìn] [我|wǒ] [的|de] [军营|jūn yíng] ？'],
      ja: ['[止|と]まれ ！ [何者|なにもの] だ ？', '[止|と]まれ ！ わし の [基地|きち] に [入|はい]って くる の は 、 [何者|なにもの] だ ？'] },
    'corn.col.name': {
      zh: ['[我|wǒ] [是|shì] [玉米棒|yù mǐ bàng] [上校|shàng xiào] ， [玉米会|Yù mǐ huì] [的|de] [首领|shǒu lǐng] 。', '[我|wǒ] [是|shì] [玉米棒|yù mǐ bàng] [上校|shàng xiào] ， [玉米会|Yù mǐ huì] [的|de] [首领|shǒu lǐng] 。 [在|zài] [这|zhè] [下面|xià miàn] ， [谁|shéi] [都|dōu] [不|bù] [出声|chū shēng] 。'],
      ja: ['わし は トウモロコシ [大佐|たいさ] 。 トウモロコシ の [会|かい] の リーダー だ 。', 'わし は トウモロコシ [大佐|たいさ] 。 トウモロコシ の [会|かい] の リーダー だ 。 ここ で は 、 [誰|だれ] も [音|おと] を [立|た]てない 。'] },
    'corn.col.spy': {
      zh: ['[你们|nǐ men] [说话|shuō huà] [这么|zhè me] [大声|dà shēng] … [你们|nǐ men] [是|shì] [寂静|Jì jìng] [的|de] [间谍|jiàn dié] ！', '[你们|nǐ men] [说话|shuō huà] [大声|dà shēng] ， [又|yòu] [没有|méi yǒu] [人|rén] [认识|rèn shi] [你们|nǐ men] … [你们|nǐ men] [一定|yī dìng] [是|shì] [寂静|Jì jìng] [的|de] [间谍|jiàn dié] ！'],
      ja: ['おまえ たち 、 [声|こえ] が [大|おお]きすぎる … [静寂|せいじゃく] の スパイ だ な ！', 'おまえ たち は [声|こえ] が [大|おお]きい し 、 [誰|だれ] も [知|し]らない [顔|かお] だ … きっと [静寂|せいじゃく] の スパイ だ な ！'] },
    'corn.col.attack': { zh: ['[安静|ān jìng] ！ [士兵们|shì bīng men] ， [集合|jí hé] ！'], ja: ['[静|しず]か に ！ [兵士|へいし] たち 、 [整列|せいれつ] ！'] },
    'corn.col.again': { zh: ['[又|yòu] [是|shì] [你们|nǐ men] ？ [士兵们|shì bīng men] ！'], ja: ['また おまえ たち か ？ [兵士|へいし] たち ！'] },
    'corn.col.notyet': { zh: ['[哈|hā] ！ [你们|nǐ men] [连|lián] [打架|dǎ jià] [都|dōu] [不|bù] [会|huì] 。 [出去|chū qù] ！'], ja: ['ハハ ！ [戦|たたか]い[方|かた] も [知|し]らない くせ に 。 [出|で]て [行|い]け ！'] },
    'corn.col.lose': { zh: ['[哈|hā] ！ [出去|chū qù] … [而且|ér qiě] [要|yào] [安静|ān jìng] ！'], ja: ['ハハ ！ [出|で]て [行|い]け … [静|しず]か に な ！'] },
    'corn.col.giveup': {
      zh: ['[够|gòu] [了|le] ， [够|gòu] [了|le] ！ [我|wǒ] [投降|tóu xiáng] ！', '[好|hǎo] [了|le] ， [好|hǎo] [了|le] … [我|wǒ] [投降|tóu xiáng] ！ [多么|duō me] [有力|yǒu lì] [的|de] [话|huà] [啊|a] ！'],
      ja: ['もう いい 、 もう いい ！ [降参|こうさん] だ ！', 'わかった 、 わかった … [降参|こうさん] だ ！ なんと [強|つよ]い [言葉|ことば] だ ！'] },
    'corn.col.sorry': {
      zh: ['[对不起|duì bu qǐ] 。 [你们|nǐ men] [不|bù] [是|shì] [间谍|jiàn dié] 。', '[对不起|duì bu qǐ] 。 [你们|nǐ men] [不|bù] [是|shì] [间谍|jiàn dié] … [你们|nǐ men] [说话|shuō huà] ， [寂静|Jì jìng] [就|jiù] [怕|pà] [你们|nǐ men] 。'],
      ja: ['すまなかった 。 きみ たち は スパイ じゃ ない 。', 'すまなかった 。 きみ たち は スパイ じゃ ない … きみ たち が [話|はな]す から 、 [静寂|せいじゃく] は きみ たち を [怖|こわ]がる んだ 。'] },
    'corn.col.quiet': {
      zh: ['[我们|wǒ men] [躲|duǒ] [起来|qǐ lái] ， [不|bù] [说话|shuō huà] 。 [可是|kě shì] {c.silence} [没有|méi yǒu] [保护|bǎo hù] [我们|wǒ men] 。',
        '[我们|wǒ men] [躲|duǒ] [在|zài] [这|zhè] [下面|xià miàn] ， [不|bù] [说话|shuō huà] 。 [我们|wǒ men] [以为|yǐ wéi] {c.silence} [能|néng] [保护|bǎo hù] [我们|wǒ men] … [可是|kě shì] [现在|xiàn zài] [我们|wǒ men] [开始|kāi shǐ] [忘记|wàng jì] [词|cí] [了|le] 。'],
      ja: ['わし たち は [隠|かく]れて 、 だまって いた 。 だが 、 {c.silence} は わし たち を [守|まも]らなかった 。',
        'わし たち は ここ に [隠|かく]れて 、 だまって いた 。 わし たち は 、 {c.silence} が [守|まも]って くれる と [思|おも]って いた … だが [今|いま] 、 [言葉|ことば] を [忘|わす]れはじめて いる 。'] },
    'corn.col.gift': {
      zh: ['[拿|ná] [着|zhe] [这个|zhè ge] ： [金色|jīn sè] [玉米粒|yù mǐ lì] 。', '[拿|ná] [着|zhe] [这个|zhè ge] ： [金色|jīn sè] [玉米粒|yù mǐ lì] ， [我们|wǒ men] [玉米会|Yù mǐ huì] [的|de] [宝物|bǎo wù] 。 [它|tā] [像|xiàng] [太阳|tài yáng] [一样|yī yàng] [闪亮|shǎn liàng] 。'],
      ja: ['これ を [受|う]け[取|と]って くれ ： [黄金|おうごん] の [粒|つぶ] だ 。', 'これ を [受|う]け[取|と]って くれ ： [黄金|おうごん] の [粒|つぶ] 、 わし たち の [会|かい] の [宝|たから] だ 。 [太陽|たいよう] の よう に [光|ひか]る 。'] },
    'corn.col.plant': {
      zh: ['[把|bǎ] [它|tā] [种|zhòng] [在|zài] {c.silence} [开始|kāi shǐ] [的|de] [地方|dì fang] 。',
        '[我们|wǒ men] [的|de] [祖辈|zǔ bèi] [常|cháng] [说|shuō] ： “ [把|bǎ] [它|tā] [种|zhòng] [在|zài] {c.silence} [开始|kāi shǐ] [的|de] [地方|dì fang] 。 ” [我|wǒ] [一直|yī zhí] [不|bù] [知道|zhī dào] [那|nà] [是|shì] [哪里|nǎ lǐ] 。'],
      ja: ['それ を 、 {c.silence} が [始|はじ]まった [場所|ばしょ] に [植|う]えて くれ 。',
        '[昔|むかし] から 、 こう [言|い]われて いる ： 「 {c.silence} が [始|はじ]まった [場所|ばしょ] に [植|う]えよ 」 。 わし は 、 それ が どこ な の か 、 ずっと わからなかった 。'] },
    'corn.col.thanks': {
      zh: ['[谢谢|xiè xie] ！ [从|cóng] [今天|jīn tiān] [起|qǐ] ， [玉米会|Yù mǐ huì] [要|yào] [大声|dà shēng] [说话|shuō huà] ！',
        '[谢谢|xiè xie] ！ [从|cóng] [今天|jīn tiān] [起|qǐ] ， [玉米会|Yù mǐ huì] [要|yào] [大声|dà shēng] [说话|shuō huà] 。 [还有|hái yǒu] ， [古|gǔ] {w.tower} [在|zài] {c.north} … [祝|zhù] [你们|nǐ men] [好运|hǎo yùn] ！'],
      ja: ['ありがとう ！ [今日|きょう] から 、 トウモロコシ の [会|かい] は [大|おお]きな [声|こえ] で [話|はな]す ぞ ！',
        'ありがとう ！ [今日|きょう] から 、 トウモロコシ の [会|かい] は [大|おお]きな [声|こえ] で [話|はな]す ぞ 。 それから 、 [古|ふる]い {w.tower} は {c.north} に ある … がんばって くれ ！'] },
  };
  for (const [k, T] of Object.entries(CM_LT)) if (LT[k]) Object.assign(LT[k], T);
  // a line for the current language and level (as lines.js picks them), with {please} filled in
  function lineOf(key, vars = {}) {
    const L = LT[key]; if (!L) return { text: key, en: key, weave: key };
    const tier = typeof LEX !== 'undefined' ? LEX.tier() : 1, arr = pickLang(L, lang(), []), i = Math.min(arr.length, Math.max(1, tier)) - 1, en = L.en || [''];     // (a language without the line: no text → the English weave)
    const sub = s => String(s == null ? '' : s).replace(/\{please\}/g, () => vars.please || (typeof LEX !== 'undefined' ? LEX.form('c.please') : 'por favor'));
    return { text: sub(arr[i]), en: sub(en[Math.min(en.length - 1, Math.max(0, i))]), weave: sub(en[en.length - 1]) };
  }

  // ================================================================ materials
  // The corn sways in waves that roll across the field, parts around you, and dissolves (dithered, like the town's walls)
  // right in front of the camera and between the camera and you, so a wall of corn never hides you.
  const U = { uTime: { value: 0 }, uYou: { value: V3(0, -1e4, 0) }, uFocus: { value: V3(0, -1e4, 0) }, uFade: { value: 1 } };
  // (the camera comes from viewMatrix, which every material gets: three r128 only sends cameraPosition to lit ones)
  const FADE = `
    { vec3 camW = -vec3(dot(viewMatrix[0].xyz, viewMatrix[3].xyz), dot(viewMatrix[1].xyz, viewMatrix[3].xyz), dot(viewMatrix[2].xyz, viewMatrix[3].xyz));
      vec3 seg = uFocus - camW; float segL = max(length(seg), 0.001); vec3 dir = seg / segL;
      vec3 rel = vWP - camW; float along = dot(rel, dir); float axis = length(rel - dir * along);
      float occl = step(0.0, along) * step(along, segL - 0.7) * (1.0 - smoothstep(1.0, 2.3, axis));
      float nearCam = 1.0 - smoothstep(1.4, 3.0, length(rel));
      if (uFade > 0.5 && nearCam > 0.8) discard;      // (all the way gone right by the camera: a few leftover dots read as specks)
      float fadeAmt = uFade * max(occl * 0.9, nearCam);
      if (fadeAmt > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < fadeAmt) discard; }`;
  const RIM = 'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\ngl_FragColor.rgb += vec3(1.0, 0.95, 0.82) * rimAmt * smoothstep(0.6, 0.95, rimF);\n';
  const MATS = {};
  function cornMat(sway) {
    const key = sway ? 'sway' : 'still';
    if (MATS[key]) return MATS[key];
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad, vertexColors: true, side: THREE.DoubleSide });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U, { rimAmt: { value: 0.16 } });
      sh.vertexShader = 'uniform float uTime;\nuniform vec3 uYou;\nvarying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', `
        vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
          vec3 o = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 o = vec3(0.0);
        #endif
        mvPosition = modelMatrix * mvPosition;
        ${sway ? `{
          float k = clamp(position.y / 2.9, 0.0, 1.2), bend = k * k;
          float gust = 0.5 + 0.5 * sin(uTime * 0.9 - dot(o.xz, vec2(0.23, 0.11)));
          float flick = sin(uTime * 2.6 + o.x * 1.9 + o.z * 1.3);
          mvPosition.xz += vec2(0.9, 0.42) * (0.04 + 0.12 * gust + 0.025 * flick) * bend;
          vec2 aw = o.xz - uYou.xz; float d = length(aw);
          float push = (1.0 - smoothstep(0.5, 1.5, d)) * (1.0 - step(2.5, abs(uYou.y - o.y)));
          mvPosition.xz += normalize(aw + 1e-4) * push * 0.42 * bend;
          mvPosition.y -= push * 0.12 * bend;
        }` : ''}
        vWP = mvPosition.xyz;
        mvPosition = viewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`);
      sh.fragmentShader = 'uniform vec3 uFocus;\nuniform float uFade;\nuniform float rimAmt;\nvarying vec3 vWP;\n' + sh.fragmentShader
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + FADE)
        .replace('#include <tonemapping_fragment>', RIM + '#include <tonemapping_fragment>');
    };
    m.customProgramCacheKey = () => 'corn-' + key;
    return (MATS[key] = m);
  }
  // the corn folk: toon with vertex colors, and a gray (the Hush creeping in while they whisper: uGray, per person)
  function folkMat() {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad, vertexColors: true, side: THREE.DoubleSide });
    const gray = { value: 0 }; m.userData.gray = gray;
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = gray; sh.uniforms.rimAmt = { value: 0.3 };
      sh.fragmentShader = 'uniform float uGray;\nuniform float rimAmt;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>', RIM +
        '{ float lum = dot(gl_FragColor.rgb, vec3(0.3, 0.55, 0.15)); gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(lum) * vec3(0.92, 0.93, 0.99), uGray * 0.9); }\n#include <tonemapping_fragment>');
    };
    m.customProgramCacheKey = () => 'corn-folk';
    return m;
  }
  const VC = () => TK.toon('#ffffff', { vc: 1, rim: 0.22 });
  const glowMat = (color, opacity) => new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });

  // ================================================================ geometry helpers: pieces → one vertex-colored mesh (plus an ink hull)
  // a piece: { geo, m (Matrix4), color } (color left out: the geometry has its own colors)
  function bake(pieces) {
    let n = 0;
    const list = pieces.map(p => { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone(); if (p.m) g.applyMatrix4(p.m); n += g.attributes.position.count; return { g, c: p.color != null ? new THREE.Color(p.color) : null }; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let o = 0;
    for (const { g, c } of list) {
      const cnt = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
      if (c) for (let i = 0; i < cnt; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
      else if (g.attributes.color) col.set(g.attributes.color.array, o * 3);
      else col.fill(1, o * 3, (o + cnt) * 3);
      o += cnt;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    return geo;
  }
  function Kit() {
    const P = [];
    const k = {
      P,
      add(geo, color, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) { P.push({ geo, color, m: M4(x, y, z, sx, sy, sz, ry, rx, rz) }); return k; },
      box(x, y, z, w, h, d, color, ry = 0) { return k.add(GEO.box, color, x, y, z, w, h, d, 0, ry, 0); },
      put(geo, m, color) { P.push({ geo, m, color }); return k; },
      beam(a, b, t, color, t2 = t) {        // a box from point a to point b
        const d = V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
        const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
        P.push({ geo: GEO.box, color, m: new THREE.Matrix4().compose(V3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, V3(t, L, t2)) });
        return k;
      },
    };
    return k;
  }
  // one mesh for a kit's pieces, with an ink hull
  function inked(P, mat, ink = 0.02, o = {}) {
    const geo = bake(P), g = new THREE.Group();
    const m = new THREE.Mesh(geo, mat || VC()); m.castShadow = o.shadow !== false; m.receiveShadow = !!o.receive; g.add(m);
    if (ink) { const h = new THREE.Mesh(geo, TK.outlineMat(ink)); h.castShadow = false; g.add(h); }
    g.userData.mesh = m;
    return g;
  }
  const lathe = (pts, n = 14) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
  // color a geometry's triangles one by one (fn(centroid, index) → THREE.Color); returns a non-indexed geometry
  function colorize(geo, fn) {
    const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = p.count, col = new Float32Array(n * 3), c = V3(0, 0, 0);
    for (let i = 0; i < n; i += 3) {
      c.set((p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3);
      const k = fn(c, i / 3);
      for (let j = 0; j < 3; j++) { col[(i + j) * 3] = k.r; col[(i + j) * 3 + 1] = k.g; col[(i + j) * 3 + 2] = k.b; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }
  // a cob of kernels: a lathe whose quads alternate two colors, rows offset (so the kernels sit in staggered rows)
  function resample(prof, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const y = lerp(prof[0][1], prof[prof.length - 1][1], i / (n - 1));
      let k = 0; while (k < prof.length - 2 && prof[k + 1][1] < y) k++;
      const [x0, y0] = prof[k], [x1, y1] = prof[k + 1], t = y1 > y0 ? clamp((y - y0) / (y1 - y0), 0, 1) : 0;
      out.push([lerp(x0, x1, t), y]);
    }
    return out;
  }
  function cobGeo(prof, segs, rows, cA, cB) {
    const pts = resample(prof, rows + 1), P = pts.length;
    const g = lathe(pts, segs).toNonIndexed(), A = new THREE.Color(cA), B = new THREE.Color(cB);
    return colorize(g, (c, t) => { const q = Math.floor(t / 2), i = Math.floor(q / (P - 1)), j = q % (P - 1); return (i + j) % 2 ? A : B; });
  }
  // husk: stripes around the y axis
  const husk = (geo, c1, c2, n = 12) => { const A = new THREE.Color(c1), B = new THREE.Color(c2); return colorize(geo, c => (Math.floor((Math.atan2(c.x, c.z) + Math.PI) / (TAU / n)) % 2 ? A : B)); };

  // ================================================================ one corn stalk (about 3 units tall): a three-sided stem, four arching
  // leaves (greener at the base, yellowing at the tips), a golden tassel, and on some a cob in its husk
  function stalkGeo(cob, seed) {
    const R = rng(seed), pos = [], col = [];
    const C = h => new THREE.Color(h);
    const push = (p, c) => { pos.push(p[0], p[1], p[2]); col.push(c.r, c.g, c.b); };
    const tri = (a, b, c, ca, cb, cc) => { push(a, ca); push(b, cb); push(c, cc); };
    const quad = (a, b, c, d, ca, cb, cc, cd) => { tri(a, b, c, ca, cb, cc); tri(a, c, d, ca, cc, cd); };
    const HT = 2.85, s0 = C('#7c963a'), s1 = C('#a9c25a');
    for (let i = 0; i < 3; i++) {
      const a0 = (i / 3) * TAU, a1 = ((i + 1) / 3) * TAU;
      quad([Math.cos(a0) * 0.06, 0, Math.sin(a0) * 0.06], [Math.cos(a0) * 0.026, HT, Math.sin(a0) * 0.026], [Math.cos(a1) * 0.026, HT, Math.sin(a1) * 0.026], [Math.cos(a1) * 0.06, 0, Math.sin(a1) * 0.06], s0, s1, s1, s0);
    }
    const GREEN = [C('#5f9438'), C('#86bd4c'), C('#d4cf74')], GOLD = [C('#8ea84a'), C('#b8c45c'), C('#e6d68a')];
    [[0.55, 0], [1.05, Math.PI], [1.6, 0.35], [2.1, Math.PI + 0.35]].forEach(([h, yaw0]) => {
      const yaw = yaw0 + (R() - 0.5) * 0.9, len = 0.95 + R() * 0.35, up = 0.2 + R() * 0.12, droop = 0.28 + R() * 0.2, w = 0.11 + R() * 0.035;
      const dx = Math.cos(yaw), dz = Math.sin(yaw), sx = -dz, sz = dx, [c0, c1, c2] = R() < 0.3 ? GOLD : GREEN;
      const m = [dx * len * 0.45, h + up, dz * len * 0.45], tip = [dx * len, h + up - droop, dz * len];
      quad([dx * 0.03 + sx * 0.03, h, dz * 0.03 + sz * 0.03], [m[0] + sx * w, m[1] + 0.02, m[2] + sz * w], [m[0] - sx * w, m[1] - 0.02, m[2] - sz * w], [dx * 0.03 - sx * 0.03, h, dz * 0.03 - sz * 0.03], c0, c1, c1, c0);
      tri([m[0] + sx * w, m[1] + 0.02, m[2] + sz * w], tip, [m[0] - sx * w, m[1] - 0.02, m[2] - sz * w], c1, c2, c1);
    });
    const T0 = C('#d9b24e'), T1 = C('#f7e3a0');
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + R(), lx = Math.cos(a), lz = Math.sin(a); tri([lx * 0.025, HT - 0.06, lz * 0.025], [-lx * 0.025, HT - 0.06, -lz * 0.025], [lx * 0.24, HT + 0.32, lz * 0.24], T0, T0, T1); }
    if (cob) {      // a cob in its husk, leaning out from the stem, its kernels peeking out on one side
      const yaw = R() * TAU, dx = Math.cos(yaw), dz = Math.sin(yaw), tl = 0.55;
      const ax = V3(dx * Math.sin(tl), Math.cos(tl), dz * Math.sin(tl)), base = V3(dx * 0.05, 1.22, dz * 0.05);
      const u = V3(-dz, 0, dx), v = ax.clone().cross(u).normalize(), mid = base.clone().addScaledVector(ax, 0.2), tip = base.clone().addScaledVector(ax, 0.46);
      const ring = [0, 1, 2, 3].map(k => mid.clone().addScaledVector(u, Math.cos(k * Math.PI / 2) * 0.078).addScaledVector(v, Math.sin(k * Math.PI / 2) * 0.078));
      const H0 = C('#93b25a'), H1 = C('#b7cd72'), K = C('#f2c94c'), SILK = C('#a8703a'), arr = q => [q.x, q.y, q.z];
      for (let k = 0; k < 4; k++) {
        const a = ring[k], b = ring[(k + 1) % 4];
        tri(arr(base), arr(a), arr(b), H0, H1, H1);
        tri(arr(a), arr(tip), arr(b), k === 0 ? K : H1, k === 0 ? SILK : H1, k === 0 ? K : H1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }
  // the dark heart of a corn wall, between its two rows of stalks: a ridge (wide at the foot, narrow on top), so you
  // can't see through the corn, and from above it reads as shadowed leaves
  function corePrism(x1, z1, x2, z2, B = 0.34, T = 0.11, H = 2.15) {
    const along = x2 !== x1, pos = [], col = [], lo = new THREE.Color('#3b5524'), hi = new THREE.Color('#62842f');
    const pt = (u, s, y) => (along ? [lerp(x1, x2, u) + (u ? 0.3 : -0.3), y, z1 + s] : [x1 + s, y, lerp(z1, z2, u) + (u ? -0.3 : 0.3)]);
    const push = (p, c) => { pos.push(...p); col.push(c.r, c.g, c.b); };
    const quad = (a, b, c, d, ca, cb) => { push(a, ca); push(b, cb); push(c, cb); push(a, ca); push(c, cb); push(d, ca); };
    for (const s of [-1, 1]) quad(pt(0, s * B, 0), pt(0, s * T, H), pt(1, s * T, H), pt(1, s * B, 0), lo, hi);     // the two slopes
    quad(pt(0, -T, H), pt(0, T, H), pt(1, T, H), pt(1, -T, H), hi, hi);                                          // the top
    for (const u of [0, 1]) quad(pt(u, -B, 0), pt(u, -T, H), pt(u, T, H), pt(u, B, 0), lo, hi);                 // the ends
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }
  // a big flat leaf (the throne's fan, the columns' crowns): a strip up the y axis, widest at 40%, pointed
  function fanLeaf(len, w, c0, c1, c2) {
    const pos = [], col = [], A = new THREE.Color(c0), B = new THREE.Color(c1), Cc = new THREE.Color(c2);
    const push = (p, c) => { pos.push(...p); col.push(c.r, c.g, c.b); };
    const a = [-w * 0.3, 0, 0], b = [w * 0.3, 0, 0], m1 = [-w, len * 0.4, 0.04], m2 = [w, len * 0.4, 0.04], t = [0, len, 0.12];
    push(a, A); push(b, A); push(m2, B); push(a, A); push(m2, B); push(m1, B); push(m1, B); push(m2, B); push(t, Cc);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }

  // ================================================================ textures: the dirt floor, signs, the Society's emblem, the hall's earth
  function floorTex() {
    const W = 1024, Hh = 1024, FX0 = BOX.x0 - 1, FX1 = BOX.x1 + 1, FZN = BOX.z1 - 1, FZS = BOX.z0 + 1;
    const px = x => (x - FX0) / (FX1 - FX0) * W, py = z => (z - FZN) / (FZS - FZN) * Hh, U1 = W / (FX1 - FX0);
    const t = TK.canvasTex(W, Hh, c => {
      const R = rng(77);
      c.fillStyle = '#4e7a33'; c.fillRect(0, 0, W, Hh);                 // (the strip outside the corn: grassy, under the weeds)
      c.fillStyle = '#6b5434'; c.fillRect(px(BOX.x0 - 0.55), py(BOX.z1 - 0.55), px(BOX.x1 + 0.55) - px(BOX.x0 - 0.55), py(BOX.z0 + 0.55) - py(BOX.z1 - 0.55));
      for (let i = 0; i < 2600; i++) { c.fillStyle = R() < 0.5 ? 'rgba(40,28,14,0.18)' : 'rgba(150,120,70,0.14)'; c.beginPath(); c.arc(R() * W, R() * Hh, 1 + R() * 3, 0, TAU); c.fill(); }
      const ways = [];       // [x1, z1, x2, z2]: every opening between cells, and out of the field's two gaps
      for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
        ways.push([cellX(c), cellZ(r), cellX(c), cellZ(r)]);
        if (c + 1 < NC && MZ.isOpen(c, r, c + 1, r)) ways.push([cellX(c), cellZ(r), cellX(c + 1), cellZ(r)]);
        if (r + 1 < NR && MZ.isOpen(c, r, c, r + 1)) ways.push([cellX(c), cellZ(r), cellX(c), cellZ(r + 1)]);
      }
      ways.push([cellX(ENT.c), cellZ(ENT.r), BOX.x0 - 1.5, cellZ(ENT.r)], [cellX(EXI.c), cellZ(EXI.r), cellX(EXI.c), BOX.z1 - 1.5]);
      c.lineCap = 'round'; c.lineJoin = 'round';
      const stroke = (style, w) => { c.strokeStyle = style; c.lineWidth = w * U1; c.beginPath(); for (const [a, b, d, e] of ways) { c.moveTo(px(a), py(b)); c.lineTo(px(d) + 0.01, py(e)); } c.stroke(); };
      stroke('#9d7f50', 3.05); stroke('#c4a26e', 2.65); stroke('rgba(226,200,150,0.35)', 1.1);
      // the clearing: trodden dirt all over, and a ring of straw around the scarecrow
      c.fillStyle = '#c4a26e'; c.beginPath(); c.arc(px(CENTER.x), py(CENTER.z), 3.5 * U1, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(232,200,96,0.55)'; c.lineWidth = 0.5 * U1; c.beginPath(); c.arc(px(SCARECROW.x), py(SCARECROW.z), 1.6 * U1, 0, TAU); c.stroke();
      // straw, pebbles and fallen leaves on the paths
      for (let i = 0; i < 900; i++) {
        const w = ways[(R() * ways.length) | 0], k = R(), x = lerp(w[0], w[2], k) + (R() - 0.5) * 2.2, z = lerp(w[1], w[3], k) + (R() - 0.5) * 2.2, kind = R();
        c.save(); c.translate(px(x), py(z)); c.rotate(R() * TAU);
        if (kind < 0.45) { c.fillStyle = R() < 0.5 ? '#e8cf7a' : '#d9b860'; c.fillRect(-0.3 * U1, -0.03 * U1, 0.6 * U1, 0.06 * U1); }
        else if (kind < 0.75) { c.fillStyle = '#9a8a72'; c.beginPath(); c.ellipse(0, 0, 0.09 * U1, 0.06 * U1, 0, 0, TAU); c.fill(); }
        else { c.fillStyle = R() < 0.5 ? '#7fae46' : '#b9b45a'; c.beginPath(); c.ellipse(0, 0, 0.25 * U1, 0.06 * U1, 0, 0, TAU); c.fill(); }
        c.restore();
      }
    });
    t.anisotropy = 4;
    return t;
  }
  // a painted board: cream wood, a darker frame, the word in big letters (and a small line), corn doodles at the sides
  function paintBoard(cv, big, small, arrow) {
    const c = cv.getContext('2d'), W = cv.width, Hh = cv.height;
    c.clearRect(0, 0, W, Hh);
    c.fillStyle = '#e9cf98'; c.fillRect(0, 0, W, Hh);
    c.fillStyle = 'rgba(138,95,62,0.18)'; for (let y = 22; y < Hh; y += 30) c.fillRect(0, y, W, 3);
    c.strokeStyle = '#8a5f3e'; c.lineWidth = 12; c.strokeRect(6, 6, W - 12, Hh - 12);
    [[46, Hh / 2], [W - 46, Hh / 2]].forEach(([x, y], i) => {
      if (arrow && i) {          // (a sign that points: a big arrow at its right end instead of the second cob, so the word stays big)
        c.fillStyle = '#5b3a22'; c.beginPath(); c.moveTo(x - 24, y - 10); c.lineTo(x + 2, y - 10); c.lineTo(x + 2, y - 26); c.lineTo(x + 30, y); c.lineTo(x + 2, y + 26); c.lineTo(x + 2, y + 10); c.lineTo(x - 24, y + 10); c.closePath(); c.fill();
        return;
      }
      c.fillStyle = '#7fb04a'; c.beginPath(); c.ellipse(x - 9, y + 8, 7, 22, -0.4, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + 9, y + 8, 7, 22, 0.4, 0, TAU); c.fill();
      c.fillStyle = '#f2c94c'; c.beginPath(); c.ellipse(x, y - 2, 11, 26, 0, 0, TAU); c.fill();
      c.fillStyle = '#d9a32c'; for (let k = -2; k <= 2; k++) for (let j = -1; j <= 1; j++) { c.beginPath(); c.arc(x + j * 6, y - 2 + k * 9, 2.2, 0, TAU); c.fill(); }
    });
    c.fillStyle = '#4a2e1a'; c.textAlign = 'center'; c.textBaseline = 'middle';
    let fs = small ? 72 : 84; c.font = `900 ${fs}px Bahnschrift, "Segoe UI", sans-serif`;
    while (c.measureText(big).width > W - 150 && fs > 30) { fs -= 2; c.font = `900 ${fs}px Bahnschrift, "Segoe UI", sans-serif`; }
    c.fillText(big, W / 2, small ? Hh * 0.42 : Hh / 2 + 4);
    if (small) { c.font = '800 34px Bahnschrift, "Segoe UI", sans-serif'; c.fillStyle = '#7a5436'; c.fillText(small, W / 2, Hh * 0.79); }
  }
  // the Society's emblem: a corn cob in a husk hood, a finger to its lips (shh)
  function drawEmblem(c, x, y, s, ring) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (ring) { c.fillStyle = '#e8c35a'; c.beginPath(); c.arc(0, 0, 58, 0, TAU); c.fill(); c.fillStyle = '#3f5d43'; c.beginPath(); c.arc(0, 0, 50, 0, TAU); c.fill(); }
    c.fillStyle = '#b7c376'; c.beginPath(); c.ellipse(0, -6, 30, 40, 0, Math.PI, TAU); c.fill(); c.beginPath(); c.moveTo(-30, -6); c.lineTo(-24, 36); c.lineTo(-14, 6); c.fill(); c.beginPath(); c.moveTo(30, -6); c.lineTo(24, 36); c.lineTo(14, 6); c.fill();
    c.fillStyle = '#f2c94c'; c.beginPath(); c.ellipse(0, 6, 18, 32, 0, 0, TAU); c.fill();
    c.fillStyle = '#d9a32c'; for (let k = -3; k <= 3; k++) for (let j = -1; j <= 1; j++) if (Math.abs(k) < 3 || j === 0) { c.beginPath(); c.arc(j * 9 + (k & 1) * 4 - 2, 6 + k * 8, 2.6, 0, TAU); c.fill(); }
    c.fillStyle = '#2b2235'; c.beginPath(); c.arc(-7, -4, 3.2, 0, TAU); c.arc(7, -4, 3.2, 0, TAU); c.fill();
    c.fillStyle = '#f5cda2'; c.strokeStyle = '#2b2235'; c.lineWidth = 2; c.beginPath(); c.roundRect ? c.roundRect(-3, 2, 6, 24, 3) : c.rect(-3, 2, 6, 24); c.fill(); c.stroke();
    c.restore();
  }
  function emblemTex() { return TK.canvasTex(256, 256, c => { drawEmblem(c, 128, 128, 1.9, true); }); }
  function earthTex() {
    const t = TK.canvasTex(256, 256, c => {
      const R = rng(9);
      c.fillStyle = '#7b5b3a'; c.fillRect(0, 0, 256, 256);
      [[30, '#86643f'], [70, '#6f5034'], [118, '#8a6a46'], [150, '#715236']].forEach(([y, col]) => { c.fillStyle = col; c.fillRect(0, y, 256, 18 + R() * 10); });
      for (let i = 0; i < 26; i++) { c.fillStyle = R() < 0.5 ? '#9a8f80' : '#8a8172'; c.beginPath(); c.ellipse(R() * 256, R() * 170, 4 + R() * 7, 3 + R() * 4, R() * 3, 0, TAU); c.fill(); }
      c.strokeStyle = '#4a3322'; c.lineWidth = 2.2;
      for (let i = 0; i < 7; i++) { let x = R() * 256, y = 0; c.beginPath(); c.moveTo(x, y); while (y < 120) { x += (R() - 0.5) * 12; y += 8 + R() * 8; c.lineTo(x, y); } c.stroke(); }
      c.fillStyle = '#9a6a42'; c.fillRect(0, 190, 256, 66); c.fillStyle = '#86593a'; for (let x = 0; x < 256; x += 32) c.fillRect(x, 190, 3, 66);
      c.fillStyle = '#5b3e27'; c.fillRect(0, 185, 256, 6);
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  function packedEarthTex() {
    const t = TK.canvasTex(256, 256, c => {
      const R = rng(12);
      c.fillStyle = '#8d6b45'; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 900; i++) { c.fillStyle = R() < 0.5 ? 'rgba(60,40,22,0.15)' : 'rgba(190,160,110,0.13)'; c.beginPath(); c.arc(R() * 256, R() * 256, 1 + R() * 3, 0, TAU); c.fill(); }
      for (let i = 0; i < 140; i++) { c.save(); c.translate(R() * 256, R() * 256); c.rotate(R() * TAU); c.fillStyle = R() < 0.5 ? '#e3c26a' : '#d1ad55'; c.fillRect(-7, -1, 14, 2); c.restore(); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  // ================================================================ the corn folk: a cob of kernels in its corn color, peeking out of a husk
  // hood and cloak (the Society, and its scouts). o: { kernel, hood (null: none), h, kid, elder, prop, cap, stache }
  function folk(o) {
    const k = Kit(), kc = new THREE.Color(o.kernel), light = kc.clone().lerp(new THREE.Color('#ffffff'), 0.22), dark = kc.clone().multiplyScalar(0.8);
    const prof = [[0, 0.06], [0.16, 0.08], [0.25, 0.18], [0.29, 0.34], [0.29, 0.52], [0.26, 0.68], [0.2, 0.8], [0.11, 0.88], [0, 0.9]];
    k.put(cobGeo(prof, 14, 10, light, dark), null);
    // the face, on the cob's upper front
    const INK = '#2b2235', eyeS = o.kid ? 1.15 : 1;
    [-1, 1].forEach(s => {
      k.add(SPH_S, INK, s * 0.085, 0.6, 0.262, 0.042 * eyeS, 0.056 * eyeS, 0.03);
      k.add(SPH_S, '#ffffff', s * 0.085 + 0.014, 0.622, 0.288, 0.014 * eyeS);
      k.add(SPH_S, '#e58fb0', s * 0.16, 0.53, 0.235, 0.045, 0.024, 0.012, 0, s * 0.6, 0);
    });
    k.add(SPH_S, INK, 0, 0.5, 0.272, 0.028, 0.017, 0.012);
    if (o.stache) [-1, 1].forEach(s => k.add(GEO.cone, '#dcae52', s * 0.1, 0.53, 0.27, 0.035, 0.18, 0.035, 0, 0, s * 1.9));
    // little husk arms and boots
    const hoodC = o.hood || '#b7c376', hoodD = new THREE.Color(hoodC).multiplyScalar(0.84).getStyle();
    [-1, 1].forEach(s => { k.add(SPH_S, hoodC, s * 0.29, 0.4, 0.06, 0.06, 0.13, 0.06, 0, 0, s * 0.5); k.add(SPH_S, '#6b4a2e', s * 0.1, 0.035, 0.06, 0.08, 0.05, 0.11); });
    if (o.hood !== null) {
      // the hood (open in front, over the head) and the cloak (open in front)
      // (small enough that the kernels show below it, from any side: a corn person in a husk hood, not a green bell)
      const gap = 2.1, hood = new THREE.SphereGeometry(1, 16, 9, Math.PI / 2 + gap / 2, TAU - gap, 0, Math.PI * 0.55);
      k.put(husk(hood, hoodC, hoodD), M4(0, 0.66, -0.03, 0.31, 0.34, 0.31));
      k.add(GEO.cone, hoodC, 0, 1.02, -0.11, 0.07, 0.2, 0.07, -0.55, 0, 0);
      const cloak = new THREE.CylinderGeometry(0.27, 0.36, 0.32, 16, 1, true, 0.95, TAU - 1.9);
      k.put(husk(cloak, hoodC, hoodD), M4(0, 0.6, -0.01, 1));
      for (let i = 0; i < 4; i++) k.add(GEO.cone, i % 2 ? '#d9a84e' : '#b98a3a', (i - 1.5) * 0.04, 1.06, -0.05, 0.016, 0.16, 0.016, -0.2, 0, (i - 1.5) * 0.35);   // a tuft of silk
    }
    if (o.cap) { k.add(GEO.cyl, '#3f5d43', 0.02, 0.97, 0, 0.15, 0.12, 0.15); k.add(GEO.cyl, '#2f3b30', 0.02, 0.93, 0, 0.155, 0.04, 0.155); k.add(SPH_S, '#ffcf45', 0.02, 0.97, 0.15, 0.03, 0.03, 0.012); }
    if (o.elder) for (let i = 0; i < 5; i++) k.add(GEO.cone, '#f1e3b0', (i - 2) * 0.045, 0.42, 0.26, 0.022, 0.2, 0.022, Math.PI, 0, (i - 2) * 0.12);     // a beard of corn silk
    if (o.prop === 'lantern') { k.add(GEO.box, '#2f3440', 0.33, 0.43, 0.14, 0.14, 0.03, 0.14); k.add(GEO.box, '#2f3440', 0.33, 0.25, 0.14, 0.13, 0.02, 0.13); }
    if (o.prop === 'loaf') k.add(SPH, '#e0a64a', 0, 0.38, 0.3, 0.12, 0.07, 0.08);
    if (o.prop === 'book') { k.add(GEO.box, '#b84a3a', 0.02, 0.4, 0.3, 0.16, 0.2, 0.04, 0, -0.3, 0); k.add(GEO.box, '#fffaf0', 0.02, 0.4, 0.315, 0.14, 0.18, 0.02, 0, -0.3, 0); }
    const mat = folkMat(), g = new THREE.Group(), body = inked(k.P, mat, o.kid ? 0.012 : 0.014);
    g.add(body); g.scale.setScalar(o.h || 1);
    let glow = null;
    if (o.prop === 'lantern') {
      const lamp = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: '#ffe7a0' })); lamp.scale.set(0.11, 0.16, 0.11); lamp.position.set(0.33, 0.335, 0.14); body.add(lamp);
      glow = new THREE.Sprite(glowMat('#ffd76a', 0.6)); glow.scale.setScalar(0.9); glow.position.set(0.33, 0.34, 0.14); body.add(glow);
    }
    g.userData = { body, mat, glow, h: o.h || 1 };
    return g;
  }

  // ================================================================ the game side
  let G = null;              // the game (main.js): { sim, w3d, cam, cast, state, save, fight }
  const S = () => G.state.corn || (G.state.corn = {});
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  let maze = null;           // what build() made (the field)
  let hall = null, inside = false;
  // Say a line over someone ({ name, x, z, y, top }): through STORY.sayInline (the weave, waits for E), as lines.js does
  function speak(p, key, vars) {
    const L = lineOf(key, vars);
    if (STORY.sayInline) { p.lines = { en: L.weave || L.en }; p.lines[lang()] = L.text; return STORY.sayInline(p); }
    if (!speak.warned) { speak.warned = true; console.warn('[corn] STORY.sayInline isn’t exported yet: lines show as thoughts'); }
    STORY.think(LEX.weave() >= 0.62 ? `${p.name}: «${UI.plainText(L.text)}»` : `${p.name}: ${L.weave}`, 4.5);
    return wait(2.4);
  }
  const VOICE = { name: 'A voice', x: HATCH.x, z: HATCH.z, y: FLAT_Y, top: 0.5, talking: false };

  // ================================================================ build: the field (corn, floor, paths, signs, the scarecrow and its hatch,
  // the treats in dead ends, the three scouts)
  function build(scene, env = {}) {
    const gy = env.terrainAt || (() => FLAT_Y);
    const root = new THREE.Group(); root.name = 'corn-maze'; scene.add(root);
    const colliders = SOLIDS.map(s => ({ ...s }));
    const RC = rng(SEED + 7);
    // ---------------- the corn: two rows of stalks along every wall, a few more at each corner; a dark ridge inside each run
    const spots = [[], []];        // [plain stalks, stalks with a cob]
    const add = (x, z) => spots[RC() < 0.34 ? 1 : 0].push({ x, z, s: 0.94 + RC() * 0.13, yaw: RC() * TAU, t: RC() });
    for (const [x1, z1, x2, z2] of SEGS) {
      const along = x2 !== x1, L = CELL + 0.2, n = Math.round(L / 0.62);
      for (const side of [-1, 1]) for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, o = side * (ROW + (RC() - 0.5) * 0.16), j = (RC() - 0.5) * 0.18;
        if (along) add(lerp(x1 - 0.1, x2 + 0.1, u) + j, z1 + o); else add(x1 + o, lerp(z1 + 0.1, z2 - 0.1, u) + j);
      }
    }
    const verts = new Set();
    for (const [x1, z1, x2, z2] of SEGS) { verts.add(x1 + ',' + z1); verts.add(x2 + ',' + z2); }
    for (const v of verts) { const [x, z] = v.split(',').map(Number); for (let i = 0; i < 3; i++) { const a = RC() * TAU, r = 0.12 + RC() * 0.3; add(x + Math.cos(a) * r, z + Math.sin(a) * r); } }
    const mat = cornMat(true), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V3(1, 1, 1), p = V3(0, 0, 0), col = new THREE.Color(), up = V3(0, 1, 0);
    const corn = [false, true].map((cob, k) => {
      const geo = stalkGeo(cob, 31 + k), list = spots[k];
      geo.boundingSphere = new THREE.Sphere(V3((BOX.x0 + BOX.x1) / 2, FLAT_Y + 1.6, (BOX.z0 + BOX.z1) / 2), Math.hypot(BOX.x1 - BOX.x0, BOX.z0 - BOX.z1) / 2 + 2);
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((s, i) => {
        q.setFromAxisAngle(up, s.yaw); m4.compose(p.set(s.x, FLAT_Y - 0.02, s.z), q, sc.set(s.s, s.s * (0.96 + s.t * 0.1), s.s)); im.setMatrixAt(i, m4);
        const gold = s.t > 0.86, v = 0.9 + s.t * 0.18; im.setColorAt(i, gold ? col.setRGB(1.12, 1.04, 0.78) : col.setRGB(v, v, v * 0.96));
      });
      im.castShadow = true; im.receiveShadow = true; im.frustumCulled = true; im.name = 'corn-stalks' + (cob ? '-cobs' : '');
      root.add(im);
      return im;
    });
    const coreGeo = bake(RUNS.map(w => ({ geo: corePrism(w.x1, w.z1, w.x2, w.z2), m: M4(0, FLAT_Y, 0, 1) })));
    const core = new THREE.Mesh(coreGeo, cornMat(false)); core.castShadow = true; core.receiveShadow = true; core.name = 'corn-cores'; root.add(core);
    // ---------------- the dirt floor (the field is flat: world.js flattens it), and the trodden paths out to the road and to Alba
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(BOX.x1 - BOX.x0 + 2, BOX.z0 - BOX.z1 + 2), new THREE.MeshToonMaterial({ map: floorTex(), gradientMap: TK.grad, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set((BOX.x0 + BOX.x1) / 2, FLAT_Y + 0.025, (BOX.z0 + BOX.z1) / 2); floor.receiveShadow = true; floor.name = 'corn-floor'; root.add(floor);
    const ribbon = (pts, w) => {
      const Sx = []; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.7)); for (let k = 0; k < n; k++) Sx.push([lerp(ax, bx, k / n), lerp(az, bz, k / n)]); }
      Sx.push(pts[pts.length - 1]);
      const pos = [], cols = [], A = new THREE.Color('#c4a26e'), B = new THREE.Color('#a98a5c');
      const row = i => { const a = Sx[Math.max(0, i - 1)], b = Sx[Math.min(Sx.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, nz = (b[0] - a[0]) / L; return [-1, 0, 1].map(s => { const x = Sx[i][0] + nx * s * w / 2, z = Sx[i][1] + nz * s * w / 2; return [x, gy(x, z) + 0.05, z]; }); };
      let prev = row(0);
      for (let i = 1; i < Sx.length; i++) {
        const cur = row(i);
        for (let j = 0; j < 2; j++) { const a = prev[j], b = cur[j], c2 = cur[j + 1], d = prev[j + 1]; [a, b, c2, a, c2, d].forEach((v, k) => { pos.push(...v); const e = (k === 0 || k === 3 ? j : k === 1 ? j : j + 1); cols.push(...(e === 1 ? [A.r, A.g, A.b] : [B.r, B.g, B.b])); }); }
        prev = cur;
      }
      for (let i = 0; i < pos.length; i += 9) {        // every triangle faces up
        const ax = pos[i + 3] - pos[i], az = pos[i + 5] - pos[i + 2], bx = pos[i + 6] - pos[i], bz = pos[i + 8] - pos[i + 2];
        if (az * bx - ax * bz < 0) for (let j = 0; j < 3; j++) { [pos[i + 3 + j], pos[i + 6 + j]] = [pos[i + 6 + j], pos[i + 3 + j]]; const ci = i + 3 + j, cj = i + 6 + j; [cols[ci], cols[cj]] = [cols[cj], cols[ci]]; }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: TK.grad, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.receiveShadow = true; root.add(m); return m;
    };
    PATHS.forEach(pth => ribbon(pth.pts, pth.w));
    // ---------------- the signs: an arch over each way in or out with a painted board («LABERINTO» outside, «SALIDA» inside), and
    // a standing sign by the path from the road. The boards redraw in the language when it changes.
    const boards = [];
    const board = (w, h, front, back) => {
      const mk = () => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const t = new THREE.CanvasTexture(cv); return { cv, t, m: new THREE.MeshToonMaterial({ map: t, gradientMap: TK.grad }) }; };
      const F = mk(), Bk = mk(), wood = TK.toon('#b07a48', { rim: 0.1 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.09), [wood, wood, wood, wood, F.m, Bk.m]); mesh.castShadow = true;
      boards.push({ F, B: Bk, front, back });
      return mesh;
    };
    const signs = new THREE.Group(); root.add(signs);
    const arch = (x, z, along, front, back) => {      // along: the arch spans along x (else along z); the board's front faces +z (or −x)
      const g = new THREE.Group(); g.position.set(x, FLAT_Y, z); g.rotation.y = along ? 0 : Math.PI / 2; signs.add(g);
      const k = Kit();
      [-2, 2].forEach(s => { k.box(s, 1.75, 0, 0.26, 3.5, 0.26, '#7a5436'); k.box(s, 3.55, 0, 0.36, 0.14, 0.36, '#6b4a2e'); });
      k.box(0, 3.38, 0, 4.7, 0.24, 0.3, '#8a5f3e');
      [-1.25, 1.25].forEach(s => k.box(s, 3.08, 0, 0.04, 0.42, 0.04, '#d8c08a'));
      for (let i = 0; i < 5; i++) { const xx = -1.9 + i * 0.95; k.add(SPH_S, '#f2c94c', xx, 3.12, 0.17, 0.07, 0.17, 0.07); k.add(GEO.cone, '#9cbf5a', xx + 0.05, 3.22, 0.16, 0.05, 0.22, 0.03, 0, 0, -0.6); }
      g.add(inked(k.P, VC(), 0.018));
      const b = board(2.7, 0.84, front, back); b.position.set(0, 2.55, 0); g.add(b);
      [-2, 2].forEach(s => { const wp = V3(s, 0, 0).applyAxisAngle(up, g.rotation.y); colliders.push({ x: x + wp.x, z: z + wp.z, r: 0.22 }); });
      return g;
    };
    arch(BOX.x0, cellZ(ENT.r), false, { big: SIGN_WORDS.exit }, { big: SIGN_WORDS.maze });                                   // (front: +x, inside; back: the road)
    arch(cellX(EXI.c), BOX.z1, true, { big: SIGN_WORDS.exit, small: 'ALBA ↑' }, { big: SIGN_WORDS.maze });                     // (front: +z, inside; back: Alba)
    {      // (bigger than it was, so «LABERINTO» reads from the road)
      const sx = 8.4, sz = -79.4, g = new THREE.Group(); g.position.set(sx, gy(sx, sz), sz); g.rotation.y = -Math.PI / 2 + 0.35; signs.add(g);
      const k = Kit(); k.box(0, 0.56, 0, 0.14, 1.12, 0.14, '#7a5436'); g.add(inked(k.P, VC(), 0.015));     // (the board sits on its post: in front of it, the post hid the back's word)
      const b = board(2.2, 0.69, { big: SIGN_WORDS.maze, arrow: true }, { big: SIGN_WORDS.maze }); b.position.set(0, 1.45, 0); g.add(b);
      colliders.push({ x: sx, z: sz, r: 0.18 });
    }
    let boardLang = null;
    const drawBoards = () => {      // (repainted when the language or its zh / ja mode changes)
      const l = lang(), key = l + (typeof CJK !== 'undefined' && CJK.isCJK(l) ? ':' + CJK.mode(l) : ''); if (key === boardLang) return; boardLang = key;
      for (const b of boards) for (const [side, o] of [[b.F, b.front], [b.B, b.back]]) { paintBoard(side.cv, plainCM(pickLang(o.big, l, o.big.en)), o.small && ALBA_UP[l] ? plainCM(ALBA_UP[l]) : o.small, o.arrow); side.t.needsUpdate = true; }
    };
    drawBoards();
    // ---------------- the scarecrow, grander than the old one: patched overalls, a plaid shirt, straw everywhere, a sack head
    // with button eyes and a stitched grin, a floppy hat with a sunflower, and a lantern on one arm
    const scare = new THREE.Group(); scare.position.set(SCARECROW.x, FLAT_Y, SCARECROW.z); root.add(scare);
    {
      const k = Kit(), STRAW = '#efcf6a', DENIM = '#4f6fae', SHIRT = '#d9573f';
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3, r = 0.3 + (i % 2) * 0.14; k.add(SPH_S, i % 2 ? '#d6b25a' : '#e8cb72', Math.cos(a) * r, 0.05, Math.sin(a) * r, 0.3, 0.13, 0.24, 0, -a, 0); }   // hay at its foot
      k.box(0, 2.05, 0, 0.2, 4.1, 0.2, '#8a5f3e'); k.box(0, 2.95, -0.05, 3.1, 0.15, 0.15, '#7a5436');
      [-1, 1].forEach(s => {
        k.add(GEO.cyl, DENIM, s * 0.17, 1.32, 0.02, 0.15, 0.9, 0.15);
        for (let i = 0; i < 3; i++) k.add(GEO.cone, STRAW, s * 0.17 + (i - 1) * 0.07, 0.8, 0.02 + (i % 2) * 0.05, 0.05, 0.24, 0.05, Math.PI, 0, (i - 1) * 0.3);
        k.add(GEO.cyl, SHIRT, s * 0.92, 2.95, 0, 0.18, 1.05, 0.18, 0, 0, Math.PI / 2);
        [0.62, 1.05].forEach(x => k.add(GEO.cyl, '#f4e6c8', s * x, 2.95, 0, 0.186, 0.05, 0.186, 0, 0, Math.PI / 2));
        for (let i = 0; i < 4; i++) k.add(GEO.cone, STRAW, s * 1.55, 2.95 + (i - 1.5) * 0.08, (i % 2) * 0.06, 0.05, 0.3, 0.05, 0, 0, -s * (Math.PI / 2 + (i - 1.5) * 0.25));
        k.box(s * 0.22, 2.98, 0.27, 0.1, 0.36, 0.05, DENIM);
        k.add(GEO.cyl, '#ffcf45', s * 0.22, 2.78, 0.47, 0.045, 0.03, 0.045, Math.PI / 2, 0, 0);
      });
      k.add(lathe([[0, 1.72], [0.46, 1.74], [0.5, 2.0], [0.47, 2.5], [0.4, 2.88], [0, 2.9]], 14), DENIM, 0, 0, 0, 1, 1, 0.9);
      k.box(0.12, 2.28, 0.43, 0.22, 0.2, 0.04, SHIRT); k.box(-0.17, 2.02, 0.45, 0.18, 0.18, 0.04, '#f2c94c');
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; k.add(GEO.cone, STRAW, Math.cos(a) * 0.18, 3.12, Math.sin(a) * 0.16, 0.05, 0.22, 0.05, Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); }
      k.add(SPH, '#d8b98a', 0, 3.55, 0, 0.5, 0.55, 0.47);
      k.add(new THREE.TorusGeometry(0.2, 0.05, 6, 14), '#9a6a3a', 0, 3.08, 0, 1, 1, 1, Math.PI / 2, 0, 0);
      [-1, 1].forEach(s => { k.add(GEO.cyl, '#2b2235', s * 0.17, 3.63, 0.42, 0.08, 0.04, 0.08, Math.PI / 2 - 0.12, 0, 0); k.add(SPH_S, '#6b6a78', s * 0.17 + 0.02, 3.65, 0.445, 0.015); k.add(SPH_S, '#e58fb0', s * 0.29, 3.42, 0.36, 0.07, 0.04, 0.02, 0, s * 0.5, 0); });
      k.add(GEO.cone, '#e8955a', 0, 3.5, 0.5, 0.06, 0.13, 0.06, Math.PI / 2, 0, 0);
      for (let i = 0; i < 5; i++) { const a = -0.55 + i * 0.275; k.box(Math.sin(a) * 0.24, 3.36 - Math.cos(a) * 0.06, 0.43, 0.06, 0.018, 0.02, '#5b3a22', 0); }
      // the hat: wide brim, crown, red band, a sunflower
      k.add(GEO.cyl, '#c9a24e', 0, 3.98, 0, 0.95, 0.06, 0.95, 0, 0, 0.1); k.add(GEO.cyl, '#d6b25a', 0.03, 4.24, 0, 0.4, 0.5, 0.4, 0, 0, 0.1);
      k.add(GEO.cyl, '#c9443a', 0.02, 4.05, 0, 0.43, 0.1, 0.43, 0, 0, 0.1);
      const fx = -0.22, fy = 4.1, fz = 0.36;
      k.add(GEO.cyl, '#6b4a2e', fx, fy, fz, 0.09, 0.04, 0.09, Math.PI / 2, 0, 0);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; k.add(SPH_S, '#ffd84a', fx + Math.cos(a) * 0.14, fy + Math.sin(a) * 0.14, fz - 0.01, 0.07, 0.035, 0.02, 0, 0, a); }
      // the lantern on the right arm
      k.box(1.32, 2.68, 0, 0.02, 0.4, 0.02, '#2f3440'); k.box(1.32, 2.47, 0, 0.26, 0.04, 0.26, '#2f3440'); k.box(1.32, 2.2, 0, 0.24, 0.04, 0.24, '#2f3440');
      scare.add(inked(k.P, VC(), 0.02));
      const lamp = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: '#fff0b0' })); lamp.scale.set(0.2, 0.24, 0.2); lamp.position.set(1.32, 2.34, 0); scare.add(lamp);
      const glow = new THREE.Sprite(glowMat('#ffd76a', 0.55)); glow.scale.setScalar(1.3); glow.position.set(1.32, 2.34, 0); scare.add(glow); scare.userData.glow = glow;
      colliders.push({ x: SCARECROW.x, z: SCARECROW.z, r: 0.5 });
    }
    // ---------------- the hatch at its feet: a frame, a dark hole, the top of a ladder, and the lid on its hinge (it swings up)
    const hatch = new THREE.Group(); hatch.position.set(HATCH.x, FLAT_Y, HATCH.z); root.add(hatch);
    const lid = new THREE.Group(); lid.position.set(0, 0.11, -0.82); hatch.add(lid);
    {
      const k = Kit();
      [[0, -0.88, 1.9, 0.14], [0, 0.88, 1.9, 0.14], [-0.88, 0, 0.14, 1.62], [0.88, 0, 0.14, 1.62]].forEach(([x, z, w, d]) => k.box(x, 0.05, z, w, 0.12, d, '#5b4030'));
      [-0.42, 0.42].forEach(x => k.box(x, 0.2, -0.62, 0.07, 0.5, 0.07, '#8a5f3e')); k.box(0, 0.36, -0.62, 0.84, 0.05, 0.06, '#a8774a');
      hatch.add(inked(k.P, VC(), 0.012));
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 1.62), new THREE.MeshBasicMaterial({ color: '#120d0b', polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }));
      hole.rotation.x = -Math.PI / 2; hole.position.y = 0.05; hatch.add(hole);           // (over the dirt floor)
      const L = Kit();
      L.box(0, 0.05, 0.82, 1.62, 0.1, 1.64, '#a8774a');
      [-0.4, 0, 0.4].forEach(x => L.box(x, 0.101, 0.82, 0.03, 0.01, 1.6, '#7a5436'));
      [-0.55, 0.55].forEach(x => L.box(x, 0.06, 0.1, 0.18, 0.11, 0.24, '#2f3440'));
      L.add(new THREE.TorusGeometry(0.11, 0.025, 6, 14), '#2f3440', 0, 0.12, 1.5, 1, 1, 1, Math.PI / 2, 0, 0);
      lid.add(inked(L.P, VC(), 0.012));
      const em = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), new THREE.MeshToonMaterial({ map: emblemTex(), gradientMap: TK.grad, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 }));
      em.rotation.x = -Math.PI / 2; em.position.set(0, 0.106, 0.82); lid.add(em);
    }
    const holeSolid = { x: 1e5, z: 1e5, r: 0.8, id: 'corn-hatch' };
    // ---------------- treats in dead ends: a coin pouch, a crow on a post (hiding from the scarecrow), a lost straw hat
    const treats = [];
    const sparkle = () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.sparkTex, color: '#fff3a0', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(0.42); return s; };
    SPOTS.treats.forEach((sp, i) => {
      const kind = ['pouch', 'crow', 'hat'][i]; if (!kind) return;
      const g = new THREE.Group(); g.position.set(sp.x, FLAT_Y, sp.z); g.rotation.y = sp.yaw; root.add(g);
      const k = Kit(), T = { kind, g, spot: sp, glint: null, crow: null };
      if (kind === 'pouch') {
        k.add(SPH, '#c9a46a', 0, 0.22, 0, 0.24, 0.21, 0.24); k.add(GEO.cone, '#b8925a', 0, 0.48, 0, 0.1, 0.16, 0.1);
        k.add(new THREE.TorusGeometry(0.08, 0.025, 6, 12), '#c9443a', 0, 0.42, 0, 1, 1, 1, Math.PI / 2, 0, 0);
        [[0.32, 0.12, 0.2], [0.42, -0.1, -0.4], [0.18, 0.3, 1]].forEach(([x, z, a]) => k.add(GEO.cyl, '#ffcf45', x, 0.02, z, 0.07, 0.02, 0.07, 0, a, 0));
        g.add(inked(k.P, VC(), 0.012));
      } else if (kind === 'crow') {
        k.box(0, 0.65, 0, 0.16, 1.3, 0.16, '#8a5f3e'); k.box(0, 1.31, 0, 0.26, 0.04, 0.26, '#6b4a2e');
        g.add(inked(k.P, VC(), 0.012));
        const c = Kit(), BLK = '#3a3546';
        c.add(SPH_S, BLK, 0, 0.17, 0, 0.15, 0.13, 0.24); c.add(SPH_S, BLK, 0, 0.32, 0.15, 0.1); c.add(GEO.cone, '#f2b84a', 0, 0.31, 0.29, 0.032, 0.13, 0.032, Math.PI / 2, 0, 0);
        [-1, 1].forEach(s => { c.add(SPH_S, '#ffffff', s * 0.055, 0.35, 0.22, 0.022); c.add(SPH_S, BLK, s * 0.058, 0.352, 0.235, 0.011); c.add(SPH_S, '#2b2638', s * 0.13, 0.18, -0.02, 0.05, 0.1, 0.2, 0.2, 0, 0); c.add(GEO.cyl, '#f2b84a', s * 0.05, 0.03, 0.02, 0.012, 0.08, 0.012); });
        [-0.25, 0, 0.25].forEach(a => c.add(GEO.box, '#2b2638', Math.sin(a) * 0.05, 0.16, -0.3, 0.07, 0.025, 0.2, 0.15, a, 0));
        const crow = inked(c.P, VC(), 0.01); crow.position.y = 1.33; g.add(crow); T.crow = crow;
        colliders.push({ x: sp.x, z: sp.z, r: 0.2 });
      } else {
        k.add(GEO.cyl, '#e8c46a', 0, 0.03, 0, 0.34, 0.03, 0.34); k.add(GEO.cyl, '#e8c46a', 0, 0.11, 0, 0.15, 0.15, 0.16); k.add(GEO.cyl, '#d9493b', 0, 0.06, 0, 0.165, 0.04, 0.165);
        const hat = inked(k.P, VC(), 0.01); hat.rotation.set(0.22, 0.4, 0.18); hat.position.y = 0.04; g.add(hat);
      }
      if (kind !== 'crow') { T.glint = sparkle(); T.glint.position.set(0.1, 0.55, 0); g.add(T.glint); }
      treats.push(T);
    });
    // ---------------- the scouts: hooded corn kids, crouched low in their dead ends until you come close
    const KIDS = [{ kernel: '#f2c94c', hood: '#9cbf5a' }, { kernel: '#f1ead2', hood: '#b7c376' }, { kernel: '#d9573f', hood: '#c9b87a', prop: 'lantern' }];
    const markTex = TK.canvasTex(64, 64, c => { c.font = '900 52px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#e0503f'; c.strokeStyle = '#fffaf0'; c.lineWidth = 6; c.strokeText('!', 32, 52); c.fillText('!', 32, 52); });
    const kids = SPOTS.scouts.map((sp, i) => {
      const g = folk(Object.assign({ h: 1.0, kid: true }, KIDS[i])); g.position.set(sp.x, FLAT_Y, sp.z); g.rotation.y = sp.yaw; root.add(g);
      const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex, transparent: true, opacity: 0, depthWrite: false })); mark.scale.setScalar(0.55); mark.position.set(sp.x, FLAT_Y + 1.45, sp.z); root.add(mark);
      colliders.push({ x: sp.x, z: sp.z, r: 0.34 });
      const api = { id: 'scout' + (i + 1), get name() { return kidName(i); }, x: sp.x, z: sp.z, y: FLAT_Y, top: 1.0, kid: true, talking: false, scout: i };
      return { i, g, mark, spot: sp, api, up: 0, ph: i * 1.7 };
    });

    // ---------------- per frame (main calls it while the field is shown)
    let stRef = null;
    function applyState() {        // after a load (or a new game): the hatch, its hole, the treats
      if (!G) return;
      const st = S();
      lid.rotation.x = st.open ? -1.95 : 0;
      holeSolid.x = st.open ? HATCH.x : 1e5; holeSolid.z = st.open ? HATCH.z : 1e5;
      if (!WORLD.extra.includes(holeSolid)) WORLD.extra.push(holeSolid);
      for (const T of treats) { T.fly = null; if (T.crow) { T.crow.visible = !st.crow; T.crow.position.set(0, 1.33, 0); T.crow.rotation.set(0, 0, 0); T.crow.scale.setScalar(1); } else T.g.visible = !st[T.kind]; }
    }
    function update(dt, t, you) {
      if (G && G.state !== stRef) { stRef = G.state; applyState(); }
      if (you && G) triggers(you);
      U.uTime.value += dt;
      if (you) U.uYou.value.set(you.x, you.y, you.z);
      if (G) { const Y = G.sim.you; U.uFocus.value.set(Y.x, Y.ry + 1.0, Y.z); }
      drawBoards();
      scare.rotation.z = Math.sin(t * 0.7) * 0.012; scare.userData.glow.material.opacity = 0.45 + 0.1 * Math.sin(t * 3.1);
      const st = G ? S() : {};
      for (const k of kids) {
        const d = you ? Math.hypot(you.x - k.spot.x, you.z - k.spot.z) : 99, near = d < 6.5 || k.api.talking;
        k.up = damp(k.up, near ? 1 : 0, 5, dt);
        const body = k.g.userData.body, bob = Math.sin(t * 2.3 + k.ph) * 0.015;
        body.position.y = lerp(-0.34, 0, k.up) + bob + (near && k.api.talking ? Math.abs(Math.sin(t * 9)) * 0.04 : 0);
        body.scale.y = lerp(0.84, 1, k.up);
        const want = near && you ? Math.atan2(you.x - k.spot.x, you.z - k.spot.z) : k.spot.yaw;
        k.g.rotation.y = dampAngle(k.g.rotation.y, want, 5, dt);
        const heard = st.heard && st.heard[k.i];
        k.mark.material.opacity = damp(k.mark.material.opacity, near && !heard && !k.api.talking ? 1 : 0, 6, dt);
        k.mark.position.y = FLAT_Y + 1.45 + Math.sin(t * 6) * 0.06;
        if (k.g.userData.glow) k.g.userData.glow.material.opacity = 0.5 + 0.12 * Math.sin(t * 4 + k.ph);
      }
      for (const T of treats) {
        if (T.glint && T.g.visible) { T.glint.material.opacity = 0.35 + 0.45 * Math.max(0, Math.sin(t * 2.4 + T.spot.x)); T.glint.material.rotation += dt; }
        if (T.crow && T.crow.visible) {
          if (T.fly) {        // off it goes, over the corn
            T.fly.t += dt; const f = T.fly.t;
            T.crow.position.set(Math.sin(f * 2) * 0.3 * f, 1.33 + f * f * 2.2 + f * 1.4, f * 3.2); T.crow.rotation.x = -0.4;
            T.crow.scale.setScalar(1 + Math.sin(f * 30) * 0.08);
            if (f > 2.2) { T.crow.visible = false; T.fly = null; }
          } else { T.crow.rotation.y = Math.sin(t * 0.8 + 1) * 0.6; T.crow.position.y = 1.33 + Math.max(0, Math.sin(t * 3.3)) * 0.03; }
        }
      }
    }
    // the maze's draw cost, for tests
    function stats() {
      let tris = 0, calls = 0;
      root.traverse(o => { if (o.isMesh && o.visible) { const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += n * (o.isInstancedMesh ? o.count : 1); calls++; } });
      return { tris: Math.round(tris), calls, stalks: spots[0].length + spots[1].length, cornTris: Math.round(corn.reduce((a, im) => a + im.geometry.attributes.position.count / 3 * im.count, 0)), solids: SOLIDS.length };
    }
    maze = { root, lid, hatch, holeSolid, scare, kids, treats, corn, core, floor, signs, applyState, drawBoards };
    return {
      colliders, platforms: [], update, people: kids.map(k => k.api), group: root, landmarks: LANDMARKS,
      objects: { lid, hatch, scarecrow: scare, kids, treats, corn, core, floor, signs }, stats,
    };
  }

  // ================================================================ the maze's scenes
  const knows = () => !!(S().knows || S().open);
  // what you typed at the hatch: 'yes' (the magic word), 'en' (in English), 'thanks' (the other magic word), 'close' or 'no'
  function judgePassword(text, l = lang()) {
    if ((l === 'zh' || l === 'ja') && typeof CJK !== 'undefined') return judgePasswordCJ(text, l);
    const n = norm(text), words = n.split(' ').filter(Boolean), has = w => (' ' + n + ' ').includes(' ' + w + ' ');
    if (l === 'de' ? words.some(w => /^bitte/.test(w)) : (has('por favor') || words.includes('porfavor') || words.includes('porfa'))) return 'yes';
    if (words.some(w => ['please', 'pls', 'plz', 'pleeease', 'pleease'].includes(w)) || has('magic word') || has('pretty please')) return 'en';
    const TH = { es: ['gracias'], pt: ['obrigado', 'obrigada', 'valeu', 'brigado', 'brigada'], de: ['danke', 'dankeschon'] }[l] || [];
    if (words.some(w => TH.includes(w)) || words.includes('thanks') || has('thank you')) return 'thanks';
    const target = l === 'de' ? 'bitte' : 'por favor';
    if (n.length >= 4 && (lev(n, target) <= 2 || lev(n.replace(/ /g, ''), target.replace(/ /g, '')) <= 2)) return 'close';
    return 'no';
  }
  // zh: 请 (or 拜托), in characters or pinyin (tones optional; a character that only sounds like 请 is 'close');
  // ja: お願い(します) or ください, in kana, kanji or rōmaji (どうぞ, the please for offering, is 'close')
  function judgePasswordCJ(text, l) {
    const raw = String(text == null ? '' : text), has = src => CJK.contains(raw, src, l), han = /[一-鿿]/.test(raw);
    const n = norm(raw), words = n.split(' ').filter(Boolean), saysEn = w => (' ' + n + ' ').includes(' ' + w + ' ');
    if (l === 'zh' ? (han ? /[请請]|拜托|拜託/.test(raw) : has('[请|qǐng]') || has('[拜托|bài tuō]'))
      : /願い|おねがい|オネガイ|下さい|ください/.test(raw) || has('お[願|ねが]い') || has('[下|くだ]さい')) return 'yes';
    if (words.some(w => ['please', 'pls', 'plz', 'pleeease', 'pleease'].includes(w)) || saysEn('magic word') || saysEn('pretty please')) return 'en';
    if (l === 'zh' ? (han ? /[谢謝]/.test(raw) : has('[谢谢|xiè xie]') || has('[多谢|duō xiè]')) : /有難|ありがと|アリガト/.test(raw) || has('ありがとう') || has('どうも')) return 'thanks';
    if (words.includes('thanks') || saysEn('thank you')) return 'thanks';
    if (l === 'ja' && (/どうぞ/.test(raw) || has('どうぞ'))) return 'close';
    const c = CJK.canon(raw, l);
    if (c.length >= 3 && (l === 'zh' ? ['qing'] : ['onegaishimasu', 'onegai', 'kudasai']).some(t => lev(c, t) <= (t.length > 5 ? 2 : 1))) return 'close';
    return 'no';
  }
  async function knock() {
    const st = S();
    Sound.play('wood'); jiggle(); await wait(0.22); Sound.play('wood'); await wait(0.22); Sound.play('wood'); jiggle();
    await wait(0.45);
    await speak(VOICE, 'corn.door.who');
    for (;;) {
      const tries = st.tries || 0;
      const r = await UI.command({ name: 'the voice', icon: 'password', title: 'A muffled voice under the hatch wants the password. What do you say?', verbs: [], placeholder: 'say the password…',
        hint: knows() || st.knows ? 'The corn kids told you: the magic word!' : tries ? 'It’s a magic word… in the language.' : 'Say it in the language. (The corn kids hiding in the maze know it.)',
        answer: tries >= 2 ? 'c.please' : undefined });
      if (!r || r.cancelled) { STORY.think('The voice under the hatch mutters something and goes quiet.', 3); return; }
      const v = judgePassword(r.text);
      if (v === 'yes') break;
      st.tries = tries + 1; G.save();
      Sound.play('wrong'); jiggle();
      await speak(VOICE, v === 'en' ? 'corn.door.en' : v === 'thanks' ? 'corn.door.thanks' : v === 'close' ? 'corn.door.close' : 'corn.door.no');
    }
    if (typeof LEX !== 'undefined') LEX.expose('c.please');
    st.open = true; st.knows = true; G.save();
    await speak(VOICE, 'corn.door.yes');
    await openHatch();
    await enter();
  }
  function jiggle() { if (maze && !S().open) tween(0.3, k => { maze.lid.rotation.x = -Math.sin(k * Math.PI) * 0.09; }).then(() => { if (!S().open) maze.lid.rotation.x = 0; }); }
  async function openHatch() {
    const { sim } = G;
    sim.lock = 1;
    G.cam.override = { pos: V3(HATCH.x - 3.0, FLAT_Y + 3.4, HATCH.z + 3.6), look: V3(HATCH.x, FLAT_Y + 0.5, HATCH.z - 0.2) };
    await wait(0.35);
    Sound.play('hatch');
    if (maze) await tween(0.9, k => { maze.lid.rotation.x = -1.95 * easeInOut(k); });
    G.w3d.fx.puff(HATCH.x, FLAT_Y + 0.2, HATCH.z, 10, 0.3, '#e8cf7a');
    if (maze) { maze.holeSolid.x = HATCH.x; maze.holeSolid.z = HATCH.z; if (!WORLD.extra.includes(maze.holeSolid)) WORLD.extra.push(maze.holeSolid); }
    sim.mimoGo({ x: HATCH.x + 1.2, z: HATCH.z + 1.1 }, HATCH); sim.mimo.perk = 1;
    STORY.think('A ladder goes down into the dark… and it smells like {w.bread}!', 3.5);
    await wait(1.4);
    sim.mimoGo(null, null);
    G.cam.override = null; sim.lock = 0;
  }
  async function centerScene() {
    const st = S(); if (st.center) return;
    st.center = true; G.save();
    const { sim } = G;
    sim.lock = 1;
    G.cam.override = { pos: V3(SCARECROW.x + 3.0, FLAT_Y + 4.3, SCARECROW.z + 5.0), look: V3(SCARECROW.x, FLAT_Y + 2.7, SCARECROW.z) };
    sim.mimo.look = SCARECROW;
    await wait(1.0);
    await STORY.you(YOU.center1);
    G.cam.override = { pos: V3(HATCH.x - 2.4, FLAT_Y + 3.1, HATCH.z + 3.4), look: V3(HATCH.x, FLAT_Y + 0.3, HATCH.z) };
    await wait(0.8);
    await STORY.you(YOU.center2);
    G.cam.override = null; sim.lock = 0; sim.mimo.look = null;
    // Mimo wants to know what it's called
    if (!LEX.taught('w.scarecrow') && LEX.mayIntroduce()) await STORY.teachWord('w.scarecrow', { spot: { x: SCARECROW.x + 1.4, z: SCARECROW.z + 2.2 }, look: { x: SCARECROW.x, z: SCARECROW.z } });
  }
  async function scoutTalk(i) {
    const st = S(), k = maze && maze.kids[i];
    const p = k ? k.api : { name: kidName(i), x: SPOTS.scouts[i].x, z: SPOTS.scouts[i].z, y: FLAT_Y, top: 1 };
    if (st.boss) return speak(p, 'corn.kidAfter');
    await speak(p, 'corn.kid' + (i + 1));
    st.heard = st.heard || [false, false, false];
    if (!st.heard[i]) {
      st.heard[i] = true; if (i === 2) st.knows = true;
      UI.toast(`Corn kids found: ${st.heard.filter(Boolean).length}/3`); G.save();
    }
  }
  // a sign's Read card (signs.js: the word big, a 🔊, the English); 'exitN' is the north arch, with «ALBA ↑» under the word
  async function readSign(which) {
    const l = lang(), W = which === 'maze' ? SIGN_WORDS.maze : SIGN_WORDS.exit, word = cap(pickLang(W, l, W.en).toLowerCase());
    if (which === 'maze') LEX.expose('w.maze');
    const card = { tag: which === 'maze' ? 'A sign by the corn' : 'Over the way out', lines: [{ text: word, en: W.en, look: { face: '#e9cf98', edge: '#8a5f3e', ink: '#4a2e1a' } }]
      .concat(which === 'exitN' ? [{ text: ALBA_UP[l] || 'Alba ↑', en: 'Alba, straight on', look: { face: '#e9cf98', edge: '#8a5f3e', ink: '#7a5436' } }] : []),
      note: which === 'maze' ? '' : which === 'exitN' ? 'The way out! Alba’s south gate is just past it.' : 'The way out, back to the old road.' };
    if (typeof SIGNS !== 'undefined' && SIGNS.read) await SIGNS.read(card);
    else STORY.think(`«${word}»… ${W.en}.`, 4);
    if (which === 'maze' && !LEX.taught('w.maze') && LEX.mayIntroduce()) { await wait(0.8); await STORY.teachWord('w.maze', { look: { x: BOX.x0 - 0.4, z: cellZ(ENT.r) } }); }
  }
  async function pickTreat(T) {
    const st = S(), M = G.sim.mimo;
    if (st[T.kind]) return;
    if (T.kind === 'pouch') {
      st.pouch = true; T.g.visible = false; G.state.coins = (G.state.coins || 0) + 12;
      Sound.play('chest'); G.w3d.fx.sparkle(T.spot.x, FLAT_Y + 0.4, T.spot.z, 12); UI.toast('🪙 +12 coins: a pouch somebody dropped in the maze!');
    } else if (T.kind === 'crow') {
      st.crow = true;
      Sound.play('shout'); M.scared = 1.2; G.sim.mimoSay('…!', 1.2);
      await wait(0.6);
      STORY.think('A crow, hiding from the {w.scarecrow}! It drops a shiny coin for {mimo}… and flies off.', 4.5);
      T.fly = { t: 0 }; Sound.play('swoosh');
      G.state.coins = (G.state.coins || 0) + 5; UI.toast('🪙 +5 coins');
    } else {
      st.hat = true; T.g.visible = false; Sound.play('chest');
      if (!G.state.flags.hat) { G.state.flags.hat = true; M.happy = 1.5; STORY.think('A straw hat, lost in the maze… {mimo} puts it on. It fits perfectly!', 4.5); }
      else { G.state.coins = (G.state.coins || 0) + 5; UI.toast('🪙 +5 coins, tucked in the hatband'); STORY.think('Somebody lost a straw hat… there’s a coin tucked in the band!', 4); }
    }
    G.save();
  }
  // the maze's own things you can press E on (story.js adds these to its list outside)
  function outsideItems() {
    const list = [], st = S(), Y = G.sim.you;
    if (distTo(Y.x, Y.z) > 9) return list;
    if (maze) maze.kids.forEach((k, i) => list.push({ x: k.spot.x, z: k.spot.z, y: FLAT_Y, r: 2.6, label: 'Talk', run: () => scoutTalk(i) }));
    list.push({ x: HATCH.x, z: HATCH.z + 0.7, y: FLAT_Y, r: 2.0, label: st.open ? 'Climb down' : 'Knock', run: st.open ? enter : knock });
    // the signs, each from both sides: the way in (LABERINTO outside, SALIDA inside), the standing sign, the way out north
    list.push({ x: BOX.x0 - 1.4, z: cellZ(ENT.r) + 1.3, y: FLAT_Y, r: 1.8, label: 'Read', run: () => readSign('maze') });
    list.push({ x: BOX.x0 + 1.4, z: cellZ(ENT.r) + 1.3, y: FLAT_Y, r: 1.6, label: 'Read', run: () => readSign('exit') });
    list.push({ x: 8.4, z: -80.4, y: FLAT_Y, r: 1.6, label: 'Read', run: () => readSign('maze') });
    list.push({ x: cellX(EXI.c) + 1.4, z: BOX.z1 + 1.4, y: FLAT_Y, r: 1.8, label: 'Read', run: () => readSign('exitN') });
    list.push({ x: cellX(EXI.c) + 1.4, z: BOX.z1 - 1.4, y: FLAT_Y, r: 1.6, label: 'Read', run: () => readSign('maze') });
    if (maze) maze.treats.forEach(T => { if (!st[T.kind]) list.push({ x: T.spot.x, z: T.spot.z, y: FLAT_Y, r: 2.0, label: T.kind === 'crow' ? 'Look' : 'Pick up', run: () => pickTreat(T) }); });
    return list;
  }
  // arriving: the maze (the quest starts) and its heart (a little scene)
  function triggers(you) {
    if (!G || !G.state.flags.hatched || STORY.busy || STORY.line || G.state.teaching || G.journalOpen) return;
    const st = S();
    if (!st.seen && boxOut(you.x, you.z) < -0.6) { st.seen = true; G.save(); UI.chapter('The Corn Maze', 'By the old road'); STORY.think(YOU.enter, 4.5); return; }
    if (st.seen && !st.center && Math.hypot(you.x - CENTER.x, you.z - CENTER.z) < 4.2) STORY.run(centerScene);
  }

  // ================================================================ the hall (built on first entry, like the mill's rooms)
  function buildHall() {
    if (hall) return hall;
    const scene = G.w3d.scene, g = new THREE.Group(); g.name = 'corn-hall'; g.visible = false; scene.add(g);
    const H = HALL, solids = [];
    const wx = lx => H.x + lx, wz = lz => H.z + lz;
    // floor and walls (walls face inward only: from outside, the near ones vanish and you look in, like a dollhouse)
    const ft = packedEarthTex(); ft.repeat.set(5, 4);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(H.hw * 2, 0.4, H.hd * 2), new THREE.MeshToonMaterial({ map: ft, gradientMap: TK.grad })); floor.position.set(H.x, HY - 0.2, H.z); floor.receiveShadow = true; g.add(floor);
    const et = earthTex(); et.repeat.set(4, 1);
    const wallM = new THREE.MeshToonMaterial({ map: et, gradientMap: TK.grad });
    [[0, -H.hd, 0, H.hw * 2], [0, H.hd, Math.PI, H.hw * 2], [-H.hw, 0, Math.PI / 2, H.hd * 2], [H.hw, 0, -Math.PI / 2, H.hd * 2]].forEach(([dx, dz, ry, w]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H.wh), wallM); m.position.set(H.x + dx, HY + H.wh / 2, H.z + dz); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    });
    // the walls as solids, in pieces of at most 12 units (world.js only looks at solids within 9 units of you)
    const wallSolid = (x1, z1, x2, z2) => { const L = Math.hypot(x2 - x1, z2 - z1), n = Math.ceil(L / 12); for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n, cx = lerp(x1, x2, (a + b) / 2), cz = lerp(z1, z2, (a + b) / 2); solids.push(x1 === x2 ? { obox: 1, x: cx, z: cz, hw: 0.3, hd: L / n / 2 + 0.3, rot: 0 } : { obox: 1, x: cx, z: cz, hw: L / n / 2 + 0.3, hd: 0.3, rot: 0 }); } };
    wallSolid(wx(-H.hw), wz(-H.hd - 0.25), wx(H.hw), wz(-H.hd - 0.25)); wallSolid(wx(-H.hw), wz(H.hd + 0.25), wx(H.hw), wz(H.hd + 0.25));
    wallSolid(wx(-H.hw - 0.25), wz(-H.hd), wx(-H.hw - 0.25), wz(H.hd)); wallSolid(wx(H.hw + 0.25), wz(-H.hd), wx(H.hw + 0.25), wz(H.hd));
    // everything that stays put, in one mesh: frame, corn-stalk columns, beams, tables, bales, the throne, the ladder
    const k = Kit(), WOOD = '#8a5f3e', DARK = '#6b4a2e';
    [[-H.hw + 0.2, -H.hd + 0.2], [H.hw - 0.2, -H.hd + 0.2], [-H.hw + 0.2, -1], [H.hw - 0.2, -1]].forEach(([x, z]) => k.box(wx(x), HY + H.wh / 2, wz(z), 0.4, H.wh, 0.4, DARK));
    k.box(H.x, HY + H.wh - 0.2, wz(-H.hd + 0.15), H.hw * 2, 0.4, 0.3, DARK);
    COLUMNS.forEach((c, i) => {
      k.add(GEO.cyl, '#7f9a3a', c.x, HY + 3.0, c.z, 0.42, 6.0, 0.42);
      [1.2, 2.4, 3.6, 4.8].forEach(y => k.add(GEO.cyl, '#6c8632', c.x, HY + y, c.z, 0.47, 0.12, 0.47));
      for (let j = 0; j < 3; j++) { const a = j * 2.1 + i; k.put(fanLeaf(2.4, 0.42, '#6e9e3c', '#8cc152', '#d8d27a'), new THREE.Matrix4().compose(V3(c.x, HY + 4.6 + j * 0.35, c.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 1.05)), V3(1, 1, 1))); }
      const s = i % 2 ? -1 : 1;
      k.add(SPH, '#a9c56a', c.x + s * 0.5, HY + 3.3, c.z + 0.2, 0.26, 0.72, 0.26, 0, 0, s * 0.3); k.add(SPH, '#f2c94c', c.x + s * 0.58, HY + 3.35, c.z + 0.34, 0.15, 0.5, 0.12, 0, 0, s * 0.3);
      k.box(c.x, HY + 6.0, c.z, 0.9, 0.3, 0.9, DARK);
      solids.push({ x: c.x, z: c.z, r: 0.55 });
    });
    [-5.2, 5.2].forEach(x => k.box(wx(x), HY + 6.18, wz(-3.4), 0.36, 0.36, 11.2, DARK));
    k.box(H.x, HY + 6.18, wz(-4.4), H.hw * 2, 0.34, 0.34, DARK);
    // stalks of corn pressed against the back and side walls
    const stalk = stalkGeo(true, 77);
    [-9.8, -8.2, -3.6, -2.6, 2.6, 3.6, 8.2, 9.8].forEach((x, i) => k.put(stalk, M4(wx(x), HY, wz(-H.hd + 0.35), 2.0, 2.05, 2.0, i * 1.3)));
    [-6, -3.2, 0.6].forEach((z, i) => { k.put(stalk, M4(wx(-H.hw + 0.35), HY, wz(z), 1.9, 1.95, 1.9, i * 2.1)); k.put(stalk, M4(wx(H.hw - 0.35), HY, wz(z + 0.8), 1.9, 2.0, 1.9, i * 1.7)); });
    // two long tables with corn bread, plates, mugs, a bowl of popcorn and a candle
    TABLES.forEach((t, i) => {
      k.box(t.x, HY + 0.86, t.z, 1.5, 0.12, 5.2, '#b07a48');
      [[-0.6, -2.3], [0.6, -2.3], [-0.6, 2.3], [0.6, 2.3]].forEach(([dx, dz]) => k.box(t.x + dx, HY + 0.4, t.z + dz, 0.12, 0.8, 0.12, WOOD));
      [-1.6, 0, 1.6].forEach((dz, j) => {
        k.add(GEO.cyl, '#efe6d2', t.x, HY + 0.935, t.z + dz, 0.26, 0.03, 0.26);
        k.add(GEO.cyl, '#e0a64a', t.x, HY + 1.03, t.z + dz, 0.15, 0.4, 0.15, 0, 0, Math.PI / 2); k.add(GEO.box, '#f2cf7a', t.x, HY + 1.12, t.z + dz, 0.3, 0.02, 0.08, 0, 0.6, 0);
        k.add(GEO.cyl, '#8a5f3e', t.x + (i ? -0.5 : 0.5), HY + 1.0, t.z + dz + 0.45, 0.08, 0.16, 0.08);
        if (j === 1) for (let q = 0; q < 6; q++) k.add(GEO.ico1, '#fcf4e0', t.x + (i ? 0.45 : -0.45) + Math.cos(q) * 0.1, HY + 1.06 + (q % 2) * 0.05, t.z + 0.9 + Math.sin(q) * 0.1, 0.07);
      });
      k.add(new THREE.SphereGeometry(1, 12, 6, 0, TAU, Math.PI / 2, Math.PI / 2), '#c9553f', t.x + (i ? 0.45 : -0.45), HY + 1.08, t.z + 0.9, 0.22, 0.14, 0.22);
      k.add(GEO.cyl, '#fff3d6', t.x, HY + 1.05, t.z + 2.2, 0.045, 0.26, 0.045);
      solids.push({ obox: 1, x: t.x, z: t.z, hw: 0.82, hd: 2.68, rot: 0 });
    });
    // straw bales
    [[-9.8, -7.9, 0], [-8.5, -8.0, 0], [-9.6, -6.6, 0], [-9.2, -7.9, 0.76], [9.6, -7.7, 0], [9.7, -6.3, 0], [9.7, 7.1, 0], [8.4, 7.6, 0]].forEach(([x, z, y]) => {
      k.box(wx(x), HY + y + 0.38, wz(z), 1.2, 0.75, 0.8, '#e3c26a');
      [-0.3, 0.3].forEach(dx => k.box(wx(x + dx), HY + y + 0.38, wz(z), 0.06, 0.77, 0.82, '#b08a3a'));
      if (!y) solids.push({ obox: 1, x: wx(x), z: wz(z), hw: 0.62, hd: 0.42, rot: 0 });
    });
    // the throne: a husk fan behind a red cushion, cob armrests, on a dais with a red rug
    {
      const T = THRONE;
      k.box(T.x, HY + 0.2, T.z, 4.6, 0.4, 2.6, '#8a6040'); k.box(T.x, HY + 0.415, T.z + 0.1, 3.6, 0.03, 2.0, '#b8433a'); k.box(T.x, HY + 0.1, T.z + 1.55, 2.4, 0.2, 0.5, '#7a5436');
      k.box(T.x, HY + 0.62, T.z - 0.4, 1.5, 0.42, 1.1, '#7a5436'); k.box(T.x, HY + 0.9, T.z - 0.35, 1.36, 0.16, 0.98, '#c9443a');
      for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.36; k.put(fanLeaf(2.7, 0.5, i % 2 ? '#a9b85e' : '#c2c879', i % 2 ? '#c9cf7a' : '#dcd896', '#efe6b4'), new THREE.Matrix4().compose(V3(T.x, HY + 0.85, T.z - 0.95), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, 0, a)), V3(1, 1, 1))); }
      [-1, 1].forEach(s => k.put(cobGeo([[0, 0], [0.1, 0.06], [0.13, 0.3], [0.12, 0.6], [0.06, 0.82], [0, 0.86]], 10, 8, '#ffd863', '#e8b83a'), new THREE.Matrix4().compose(V3(T.x + s * 0.82, HY + 1.0, T.z + 0.1), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), V3(1, 1, 1))));
      k.add(SPH_S, '#ffcf45', T.x, HY + 3.55, T.z - 1.0, 0.16, 0.24, 0.1);
      solids.push({ obox: 1, x: T.x, z: T.z, hw: 2.3, hd: 1.3, rot: 0 });
    }
    // the ladder up to the hatch, and the hatch's frame in a scrap of ceiling
    {
      const L = LADDER;
      [-0.42, 0.42].forEach(s => k.beam([L.x + 0.3, HY, L.z + s], [L.x - 0.32, HY + 6.6, L.z + s], 0.09, WOOD));
      for (let i = 1; i < 14; i++) { const t = i / 14; k.box(L.x + lerp(0.3, -0.32, t), HY + t * 6.6, L.z, 0.08, 0.06, 0.84, '#a8774a'); }
      [[0, -0.9, 1.9, 0.18], [0, 0.9, 1.9, 0.18], [-0.86, 0, 0.18, 1.62], [0.86, 0, 0.18, 1.62]].forEach(([dx, dz, w, d]) => k.box(L.x + dx, HY + 6.6, L.z + dz, w, 0.22, d, DARK));
      solids.push({ obox: 1, x: L.x, z: L.z, hw: 0.4, hd: 0.62, rot: 0 });
    }
    // rods for the banners, and the lantern frames
    const BAN = [[0, -H.hd + 0.06, 0, 3.9, 2.1, 3.0, 'main'], [-6.2, -H.hd + 0.06, 0, 3.7, 1.4, 2.3, 'side'], [6.2, -H.hd + 0.06, 0, 3.7, 1.4, 2.3, 'side'],
      [-H.hw + 0.06, -1.9, Math.PI / 2, 3.6, 1.2, 2.0, 'side'], [H.hw - 0.06, -1.9, -Math.PI / 2, 3.6, 1.2, 2.0, 'side']];
    BAN.forEach(([x, z, ry, y, w, h]) => { const d = V3(1, 0, 0).applyAxisAngle(V3(0, 1, 0), ry); k.beam([wx(x) - d.x * (w / 2 + 0.15), HY + y + h / 2 + 0.06, wz(z) - d.z * (w / 2 + 0.15)], [wx(x) + d.x * (w / 2 + 0.15), HY + y + h / 2 + 0.06, wz(z) + d.z * (w / 2 + 0.15)], 0.07, DARK); });
    const LAMPS = [[-5.2, 4.6, -6.4], [5.2, 4.6, -6.4], [-5.2, 4.6, -0.6], [5.2, 4.6, -0.6], [-2.7, 1.6, -7.2], [2.7, 1.6, -7.2]];
    LAMPS.forEach(([x, y, z], i) => {
      if (i < 4) k.box(wx(x), HY + (y + 6.0) / 2 + 0.25, wz(z), 0.03, 6.0 - y - 0.5, 0.03, '#2f3440');
      else { k.box(wx(x), HY + y / 2, wz(z), 0.12, y, 0.12, DARK); }
      k.box(wx(x), HY + y + 0.27, wz(z), 0.36, 0.06, 0.36, '#2f3440'); k.box(wx(x), HY + y - 0.27, wz(z), 0.32, 0.06, 0.32, '#2f3440');
    });
    // straw on the floor
    { const R = rng(3); for (let i = 0; i < 70; i++) k.box(wx(-H.hw + 1 + R() * (H.hw * 2 - 2)), HY + 0.01, wz(-H.hd + 1 + R() * (H.hd * 2 - 2)), 0.4, 0.02, 0.05, R() < 0.5 ? '#e3c26a' : '#d1ad55', R() * Math.PI); }
    const stat = inked(k.P, VC(), 0.018, { receive: true }); g.add(stat);
    // what glows: lantern bodies and candle flames (unlit), their halos, the daylight in the hatch, and its shaft of light
    const lit = Kit();
    LAMPS.forEach(([x, y, z]) => lit.box(wx(x), HY + y, wz(z), 0.3, 0.46, 0.3, '#ffe7a0'));
    TABLES.forEach(t => lit.add(GEO.cone, '#ffd56a', t.x, HY + 1.25, t.z + 2.2, 0.035, 0.12, 0.035));
    lit.box(LADDER.x, HY + 6.72, LADDER.z, 1.5, 0.02, 1.62, '#fff6d8');
    g.add(new THREE.Mesh(bake(lit.P), new THREE.MeshBasicMaterial({ vertexColors: true })));
    const glows = LAMPS.map(([x, y, z]) => { const s = new THREE.Sprite(glowMat('#ffcf6a', 0.55)); s.scale.setScalar(2.2); s.position.set(wx(x), HY + y, wz(z)); g.add(s); return s; });
    TABLES.forEach(t => { const s = new THREE.Sprite(glowMat('#ffcf6a', 0.5)); s.scale.setScalar(0.9); s.position.set(t.x, HY + 1.28, t.z + 2.2); g.add(s); glows.push(s); });
    const shaftTex = TK.canvasTex(32, 128, c => { const gr = c.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,246,210,0.9)'); gr.addColorStop(1, 'rgba(255,246,210,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 128); });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.5, 6.5, 16, 1, true), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    shaft.position.set(LADDER.x + 0.5, HY + 3.3, LADDER.z); shaft.rotation.z = -0.08; g.add(shaft);
    // the banners: the Society's emblem, and its motto in the middle (it changes once they speak up)
    const mainCv = document.createElement('canvas'); mainCv.width = 256; mainCv.height = 384; const mainT = new THREE.CanvasTexture(mainCv);
    const sideT = TK.canvasTex(128, 224, c => { banner(c, 128, 224, null); });
    function banner(c, W, Hh, motto) {          // red and gold, like the banners in battle/'s cellar arena (the same hall)
      c.clearRect(0, 0, W, Hh);
      c.fillStyle = '#c8433a'; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, Hh - 28); c.lineTo(W / 2, Hh); c.lineTo(0, Hh - 28); c.closePath(); c.fill();
      c.strokeStyle = '#f2c94c'; c.lineWidth = 6; c.beginPath(); c.moveTo(8, 6); c.lineTo(W - 8, 6); c.lineTo(W - 8, Hh - 32); c.lineTo(W / 2, Hh - 8); c.lineTo(8, Hh - 32); c.closePath(); c.stroke();
      drawEmblem(c, W / 2, motto ? Hh * 0.33 : Hh * 0.42, W / 170, true);
      if (motto) {
        c.fillStyle = '#fff1c4'; c.textAlign = 'center'; c.textBaseline = 'middle';
        const words = motto.split(' '), lines = []; let cur = '';
        let fs = 34; c.font = `900 ${fs}px Bahnschrift, "Segoe UI", sans-serif`;
        for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > W - 36 && cur) { lines.push(cur); cur = w; } else cur = t; }
        lines.push(cur);
        lines.forEach((l, i) => c.fillText(l, W / 2, Hh * 0.72 + (i - (lines.length - 1) / 2) * 38));
      }
    }
    let bannerKey = null;
    const drawMotto = () => { const key = lang() + (S().boss ? '+' : '-') + (typeof CJK !== 'undefined' && CJK.isCJK(lang()) ? CJK.mode(lang()) : ''); if (key === bannerKey) return; bannerKey = key; const MM = S().boss ? MOTTO.after : MOTTO.before; banner(mainCv.getContext('2d'), 256, 384, plainCM(pickLang(MM, lang(), MM.en))); mainT.needsUpdate = true; };
    drawMotto();
    BAN.forEach(([x, z, ry, y, w, h, kind]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ map: kind === 'main' ? mainT : sideT, gradientMap: TK.grad, transparent: true, side: THREE.DoubleSide }));
      m.position.set(wx(x), HY + y, wz(z)); m.rotation.y = ry; g.add(m);
    });
    // the Society: hooded corn folk, gray-ish while they whisper
    const members = MEMBERS.map((d, i) => {
      const f = folk({ kernel: d.kernel, hood: d.hood, h: d.h, kid: d.kid, elder: d.elder, prop: d.prop });
      f.position.set(d.at.x, HY, d.at.z); f.rotation.y = face(d.at, d.look); g.add(f);
      f.userData.mat.userData.gray.value = d.gray !== undefined ? d.gray : 0.3;
      solids.push({ x: d.at.x, z: d.at.z, r: d.kid ? 0.34 : 0.42 });
      const api = { id: d.id, get name() { return nameCM(d.id, d.name); }, x: d.at.x, z: d.at.z, y: HY, top: 0.98 * d.h, kid: !!d.kid, talking: false };
      return { d, g: f, api, yaw: f.rotation.y, ph: i * 1.3, gray: d.gray !== undefined ? d.gray : 0.3 };
    });
    // Colonel Cob and two kernel soldiers by the throne (the battle's own models, so they look the same in the fight)
    const model = (kind, color, scale) => {
      try {
        if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) {
          const m = BATTLE.buildFoe(kind, color, { size: 'small' });
          if (m && (!m.userData.hush || m.userData.hush.kind === kind)) { m.scale.multiplyScalar(scale); return m; }
        }
      } catch (e) { console.warn('[corn] model', kind, e); }
      return null;
    };
    let colonel = model('colonel', 'yellow', 1);
    if (!colonel) { colonel = folk({ kernel: '#f2c94c', hood: null, h: 2.3, cap: true, stache: true }); colonel.userData.fallback = true; }
    colonel.position.set(COLONEL.x, HY, COLONEL.z); g.add(colonel);
    solids.push({ x: COLONEL.x, z: COLONEL.z, r: 0.95 });
    const colApi = { id: 'colonel', get name() { return colName(); }, x: COLONEL.x, z: COLONEL.z, y: HY, top: 2.5, talking: false };
    const guards = [['yellow', -2.4], ['red', 2.4]].map(([color, dx]) => {
      let m = model('kernel', color, 1.45);
      if (!m) m = folk({ kernel: color === 'red' ? '#d9573f' : '#f2c94c', hood: '#b6c178', h: 0.95, kid: true });
      const at = hp(dx, -5.5); m.position.set(at.x, HY, at.z); g.add(m);
      solids.push({ x: at.x, z: at.z, r: 0.45 });
      return { m, at, api: { id: 'guard-' + color, name: color === 'red' ? '🔴' : '🟡', x: at.x, z: at.z, y: HY, top: 1.25, talking: false } };
    });
    WORLD.addSolids(solids);
    WORLD.addPlatforms([{ box: [H.x - H.hw, H.x + H.hw, H.z - H.hd, H.z + H.hd], top: HY }]);
    // the prize, hidden until the Colonel hands it over
    const kernel = new THREE.Group(); kernel.visible = false; g.add(kernel);
    {
      const k2 = Kit(); k2.put(lathe([[0, 0], [0.12, 0.03], [0.17, 0.14], [0.15, 0.3], [0.08, 0.4], [0, 0.42]], 16), M4(0, -0.2, 0, 1), '#ffcf3f'); k2.add(SPH_S, '#fff1b8', 0, -0.06, 0.1, 0.06, 0.09, 0.03);
      const gm = inked(k2.P, TK.toon('#ffffff', { vc: 1, rim: 0.5, emissive: '#5a3c00' }), 0.012); kernel.add(gm);
      const gl = new THREE.Sprite(glowMat('#ffe27a', 0.9)); gl.scale.setScalar(1.5); kernel.add(gl); kernel.userData.glow = gl;
    }
    hall = { g, members, colonel, colApi, guards, glows, shaft, drawMotto, kernel, solids };
    applyHall();
    return hall;
  }
  // after a load or the win: the Colonel's mood and colors, the Society's
  function applyHall(o = {}) {
    if (!hall) return;
    const st = S(), C = hall.colonel;
    if (C.userData.mood !== undefined) C.userData.mood = st.boss ? 'happy' : 'idle';
    hall.guards.forEach(gd => { if (gd.m.userData.mood !== undefined) gd.m.userData.mood = st.boss ? 'happy' : 'idle'; });
    if (st.boss && !o.fade) brighten(1);
  }
  function brighten(k) {
    try { const h = hall.colonel.userData.hush; if (h && BATTLE._ && BATTLE._.M && BATTLE._.M.brighten) { BATTLE._.M.brighten(h.model, k); hall.guards.forEach(gd => { const q = gd.m.userData.hush; if (q) BATTLE._.M.brighten(q.model, k); }); } } catch (e) { /* (an older battle/) */ }
  }
  const colF = () => { const h = hall && hall.colonel.userData.hush; return h ? h.state : null; };
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + 1.1; M.z = z + 0.8; M.hidden = false; G.sim.snap();
  }
  // put the camera behind you at once (and cancel the glide back from a scene's shot: it would swoop across the map)
  function snapCam(yaw, pitch, dist) { G.cam.snap(yaw, pitch, dist); G.cam.back = 0; G.cam._look = null; }
  async function enter() {
    buildHall();
    await UI.fade(1, 450);
    inside = true; hall.g.visible = true; G.w3d.setInterior({ fog: '#2b1d15', near: 18, far: 54 });
    teleport(ARRIVE.x, ARRIVE.z, ARRIVE.yaw); snapCam(Math.PI - 0.35, 0.62, 11);          // (from the south-west: the whole hall, the throne at the back)
    Sound.play('wood');
    await UI.fade(0, 450);
    const st = S();
    if (!st.hallSeen) { st.hallSeen = true; UI.chapter('The Corn Society', 'A secret hall under the maze'); STORY.think('Everyone down here is… whispering.', 4.5); }
    G.save();
  }
  async function leave() {
    await UI.fade(1, 450);
    inside = false; if (hall) hall.g.visible = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw); snapCam(Math.PI, 0.3, 8.5);
    Sound.play('wood');
    await UI.fade(0, 450);
    G.save();
  }

  // ================================================================ the hall's scenes
  async function memberTalk(m) {
    const st = S(); m.api.talking = true;
    const key = 'corn.m.' + m.d.id + (st.boss ? '.after' : '');
    await speak(m.api, key);
    m.api.talking = false;
  }
  async function guardTalk(gd) { await speak(gd.api, S().boss ? 'corn.guard.after' : 'corn.guard'); }
  async function takeBread() {
    const st = S(); if (st.bread) return;
    st.bread = true; G.state.bag = G.state.bag || {}; G.state.bag['w.bread'] = (G.state.bag['w.bread'] || 0) + 1;
    LEX.expose('w.bread'); Sound.play('pip'); G.sim.mimo.happy = 1;
    UI.toast(`+1 ${LEX.form('w.bread')} (corn bread: it heals in a fight)`); G.save();
  }
  // Colonel Cob takes you for the Hush's spies: a fight (once you've trained with Bruno). While his scene runs (the fight,
  // the Golden Kernel's card) Mimo keeps its questions to itself (curiosities()).
  let colBusy = 0;
  const cardUp = () => { const el = typeof document !== 'undefined' && document.getElementById('card'); return !!el && !el.classList.contains('hidden'); };
  async function colonelScene() { colBusy++; try { return await colonelBody(); } finally { colBusy--; } }
  async function colonelBody() {
    const st = S(), C = hall.colonel, F = colF(), { sim } = G;
    if (st.boss) return speak(hall.colApi, 'corn.col.thanks');
    sim.lock = 1;
    G.cam.override = { pos: V3(COLONEL.x + 4.4, HY + 3.4, COLONEL.z + 7.2), look: V3(COLONEL.x - 0.8, HY + 1.6, COLONEL.z + 1.0) };
    if (C.userData.mood !== undefined) C.userData.mood = 'alert';
    Sound.play('shout');
    if (!st.metCol) { await speak(hall.colApi, 'corn.col.halt'); await speak(hall.colApi, 'corn.col.name'); st.metCol = true; G.save(); }
    else await speak(hall.colApi, 'corn.col.again');
    await speak(hall.colApi, 'corn.col.spy');
    await STORY.you(YOU.spy);
    if ((G.state.flags.lessons || 0) < 2) {      // not ready: he laughs you off
      await speak(hall.colApi, 'corn.col.notyet');
      G.cam.override = null; sim.lock = 0; if (C.userData.mood !== undefined) C.userData.mood = 'idle';
      STORY.think('{mimo} hides behind me. We need more training first. Bruno, in Alba, can help!', 5);
      return;
    }
    if (F) F.cape = 1;
    await speak(hall.colApi, 'corn.col.attack');
    hall.guards.forEach(gd => { if (gd.m.userData.mood !== undefined) gd.m.userData.mood = 'alert'; });
    G.cam.override = null; sim.lock = 0;
    const r = await fightColonel();
    if (F) F.cape = 0;
    hall.guards.forEach(gd => { if (gd.m.userData.mood !== undefined) gd.m.userData.mood = 'idle'; });
    if (r && r.outcome === 'win') return winScene();      // (it brightens the hall and cheers everyone up: applyHall)
    if (r && r.outcome === 'lose') return loseScene();
    if (C.userData.mood !== undefined) C.userData.mood = 'idle';
    STORY.think('The Colonel huffs and straightens his cap.', 3.5);
  }
  // the Colonel's kinds come from battle/; while they aren't there (or a fight with them can't start) it's hushlings
  const bossKinds = () => { try { const M = BATTLE._.M; return M.kindOf('colonel') === 'colonel' && M.kindOf('kernel') === 'kernel'; } catch (e) { return false; } };
  async function safeFight(opts) {
    if (typeof BATTLE === 'undefined' || !BATTLE.start) return G.fight(opts);
    const B = BATTLE, start = B.start; let failed = null;
    B.start = function (o) {         // (a fight that throws as it starts would leave main.js stuck in battle mode)
      try { return Promise.resolve(start.call(this, o)).catch(e => { failed = e; return { outcome: 'flee' }; }); } catch (e) { failed = e; return Promise.resolve({ outcome: 'flee' }); }
    };
    let r;
    try { r = await G.fight(opts); } finally { B.start = start; }
    if (failed) { console.info('[corn] that fight couldn’t start:', failed && failed.message); return null; }
    return r;
  }
  async function fightColonel() {
    const place = { x: CENTER.x, z: CENTER.z, biome: 'cellar' };
    if (bossKinds()) {
      const r = await safeFight({ foes: [{ kind: 'colonel', color: 'yellow' }, { kind: 'kernel', color: 'yellow' }, { kind: 'kernel', color: 'red' }], place, boss: true });
      if (r) return r;
      console.info('[corn] battle/ can’t fight the Colonel yet: hushlings stand in for him and his soldiers');
    } else console.info('[corn] battle/ has no colonel or kernel kinds yet: hushlings stand in for the Colonel and his soldiers');
    return (await safeFight({ foes: [{ kind: 'hushling_big', color: 'yellow' }, { kind: 'hushling', color: 'yellow', size: 'small' }, { kind: 'hushling', color: 'red', size: 'small' }], place })) || { outcome: 'flee' };
  }
  async function winScene() { colBusy++; try { return await winBody(); } finally { colBusy--; } }
  async function winBody() {
    const st = S(), C = hall.colonel, F = colF(), { sim } = G;
    sim.lock = 1;
    G.cam.override = { pos: V3(COLONEL.x + 3.6, HY + 3.0, COLONEL.z + 6.4), look: V3(COLONEL.x - 0.4, HY + 1.5, COLONEL.z + 0.8) };
    if (F) F.surrender = 1;
    await wait(0.6);
    await speak(hall.colApi, 'corn.col.giveup');
    await speak(hall.colApi, 'corn.col.sorry');
    await STORY.you(YOU.win);
    await speak(hall.colApi, 'corn.col.quiet');
    if (F) F.surrender = 0;
    st.boss = true;                              // the Society brightens and speaks up from here on
    applyHall({ fade: true });
    await tween(1.2, k => brighten(k));
    await speak(hall.colApi, 'corn.col.gift');
    // the Golden Kernel floats down from the Colonel's hands
    const K = hall.kernel; K.visible = true; Sound.play('chest');
    await tween(1.0, k => { K.position.set(lerp(COLONEL.x, COLONEL.x + 0.3, k), HY + lerp(2.4, 1.5, k) + Math.sin(k * Math.PI) * 0.4, lerp(COLONEL.z + 0.4, COLONEL.z + 1.6, k)); K.rotation.y = k * 6; });
    G.w3d.fx.sparkle(K.position.x, K.position.y, K.position.z, 22, ['#fff3a0', '#ffd84a']);
    G.state.flags.goldenKernel = true; G.state.bag = G.state.bag || {}; G.state.bag['k.goldenKernel'] = 1; LEX.expose('k.goldenKernel');
    G.save();
    const name = LEX.form('k.goldenKernel', { article: true }), kIt = LEX.item('k.goldenKernel'), kCJ = typeof CJK !== 'undefined' && CJK.isCJK(lang()) && kIt && kIt[lang()];
    await UI.card(`<canvas width="140" height="140"></canvas><div class="tag">Key item</div><div class="big">${kCJ ? CJK.html(kCJ, { lang: lang() }) : esc(name)}</div><div class="sub">The Golden Kernel · <b>E</b></div>`, { kind: 'reveal', icon: 'goldenKernel', say: name });
    K.visible = false;
    await speak(hall.colApi, 'corn.col.plant');
    await STORY.you(YOU.tower);
    Sound.play('fanfare');
    G.cam.override = null; sim.lock = 0;
    G.save();
  }
  async function loseScene() {
    const C = hall.colonel;
    await UI.fade(1, 400);
    teleport(ARRIVE.x, ARRIVE.z, ARRIVE.yaw); snapCam(Math.PI - 0.35, 0.62, 11);
    if (C.userData.mood !== undefined) C.userData.mood = 'idle';
    await UI.fade(0, 600);
    STORY.think('Ouch… I woke up at the foot of the ladder. Let’s catch our breath, then try again.', 5);
    await wait(1.2);
    await speak(hall.colApi, 'corn.col.lose');
  }
  function insideItems() {
    const list = [], st = S(); if (!hall) return list;
    list.push({ x: LADDER.x + 1.3, z: LADDER.z, y: HY, r: 2.0, label: 'Climb up', run: leave });
    hall.members.forEach(m => list.push({ x: m.api.x, z: m.api.z, y: HY, r: 2.3, label: 'Talk', run: () => memberTalk(m) }));
    list.push({ x: COLONEL.x, z: COLONEL.z + 1.4, y: HY, r: 3.0, label: 'Talk', run: colonelScene });
    hall.guards.forEach(gd => list.push({ x: gd.at.x, z: gd.at.z + 0.6, y: HY, r: 1.5, label: 'Talk', run: () => guardTalk(gd) }));
    if (!st.bread) list.push({ x: TABLES[0].x + 1.0, z: TABLES[0].z + 0.4, y: HY, r: 1.5, label: 'Take some bread', run: takeBread });
    list.push({ x: hp(-6.2, -7.6).x, z: hp(-6.2, -7.6).z, y: HY, r: 1.6, label: 'Read', run: mottoRead });
    return list;
  }
  // the motto on the big banner, as a Read card (signs.js); without it, the old thought
  async function mottoRead() {
    const after = !!S().boss, MM = after ? MOTTO.after : MOTTO.before, M = pickLang(MM, lang(), MM.en);
    const word = M.toLowerCase().replace(/^([¡¿]?)(.)/, (m, p, ch) => p + ch.toUpperCase());
    const note = after ? 'Their new motto. They changed it today!' : 'Their motto. Quiet is safe? That’s just what the Hush wants.';
    if (typeof SIGNS === 'undefined' || !SIGNS.read) { STORY.think(`«${M}»… ${note}`, 5); return; }
    await SIGNS.read({ tag: 'The Corn Society’s banner', lines: [{ text: word, en: after ? 'Speak up! (talk loud)' : 'In silence, safe', look: { face: '#c8433a', edge: '#f2c94c', ink: '#fff1c4' } }], note });
  }
  // per frame while you're in the hall (main.js calls the room you're in)
  function update(dt, t) {
    if (!inside || !hall) return;
    const { sim } = G, Y = sim.you, st = S();
    if (sim.lock && !STORY.busy) { sim.lock = 0; G.cam.override = null; }       // (a scene that broke off never leaves you frozen)
    U.uTime.value += dt;
    hall.drawMotto();
    for (const m of hall.members) {
      const dx = Y.x - m.api.x, dz = Y.z - m.api.z, d = Math.hypot(dx, dz);
      const want = m.api.talking || d < 3.0 ? Math.atan2(dx, dz) : m.yaw;
      m.g.rotation.y = dampAngle(m.g.rotation.y, want, 4, dt);
      const body = m.g.userData.body, happy = st.boss ? 1 : 0;
      body.position.y = happy ? Math.abs(Math.sin(t * 4.2 + m.ph)) * 0.07 : 0;
      body.scale.set(1, 1 + Math.sin(t * 2.2 + m.ph) * 0.02, 1);
      body.rotation.x = !happy && PAIRS[m.d.id] && !m.api.talking ? 0.12 + Math.sin(t * 1.3 + m.ph) * 0.03 : 0;       // whispering pairs lean in
      const gr = m.g.userData.mat.userData.gray; gr.value = damp(gr.value, st.boss ? 0 : m.gray, 1.4, dt);
      if (m.g.userData.glow) m.g.userData.glow.material.opacity = 0.5 + 0.1 * Math.sin(t * 4 + m.ph);
    }
    const C = hall.colonel, F = colF();
    if (C.userData.animate) {
      const near = Math.hypot(Y.x - COLONEL.x, Y.z - COLONEL.z) < 6 || hall.colApi.talking;
      C.rotation.y = dampAngle(C.rotation.y, near ? Math.atan2(Y.x - COLONEL.x, Y.z - COLONEL.z) : 0, 3, dt);
      if (F) F.talk = hall.colApi.talking ? 1 : 0;
      C.userData.animate(dt, t, 0);
    } else { C.userData.body.position.y = Math.sin(t * 1.6) * 0.02; }
    hall.guards.forEach((gd, i) => { if (gd.m.userData.animate) gd.m.userData.animate(dt, t + i * 0.7, 0); });
    hall.glows.forEach((s, i) => { s.material.opacity = 0.48 + 0.08 * Math.sin(t * 5.3 + i * 1.7) + 0.04 * Math.sin(t * 13 + i); });
    hall.shaft.material.opacity = 0.28 + 0.05 * Math.sin(t * 0.7);
    if (hall.kernel.visible) hall.kernel.userData.glow.material.opacity = 0.75 + 0.2 * Math.sin(t * 5);
  }

  // ================================================================ the quest (a quests.js LIST entry)
  function quest() {
    const st = s => s.corn || {}, heard = s => (st(s).heard || []).filter(Boolean).length;
    const nextScout = () => {
      const s = G.state, Y = G.sim.you, list = SPOTS.scouts.map((p, i) => ({ x: p.x, z: p.z, i })).filter(p => !(st(s).heard || [])[p.i]);
      return list.sort((a, b) => Math.hypot(a.x - Y.x, a.z - Y.z) - Math.hypot(b.x - Y.x, b.z - Y.z))[0] || HATCH;
    };
    return {
      id: 'corn', kind: 'side', title: 'The heart of the {w.maze}', giver: 'the corn maze by the old road',
      started: s => !!st(s).seen,
      steps: [
        { text: 'Find the {w.scarecrow} at the heart of the {w.maze}', word: 'w.scarecrow',
          why: 'The old field by the road is a huge {w.maze} of {w.corn} now. From outside you can see a grand {w.scarecrow} standing in the middle.',
          done: s => !!st(s).center, target: () => CENTER, hint: '{mimo} sniffs the air… the middle of the {w.maze} is this way!' },
        { text: 'Find out the {w.password}: ask the corn kids ({n}/3)', n: heard, word: 'w.password',
          why: 'A muffled voice under the hatch wants a {w.password}. Little hooded corn kids are hiding in the dead ends of the {w.maze}. They might know it.',
          done: s => !!(st(s).knows || st(s).open), target: nextScout, hint: '{mimo}’s ears twitch. Something is rustling in a dead end over there!' },
        { text: 'Say the {w.password} at the hatch', word: 'w.password',
          why: 'The corn kids told you: the {w.password} is the magic word, in the language. The hatch is at the {w.scarecrow}’s feet.',
          done: s => !!st(s).open, target: () => HATCH, hint: '{mimo} hops toward the {w.scarecrow}. The hatch is at its feet.' },
        { text: 'Meet the leader of the Corn Society',
          why: 'A secret hall under the {w.maze}! Everyone down there whispers. Their leader sits on a throne of husks at the back.',
          done: s => !!s.flags.goldenKernel, target: () => (inside ? COLONEL : HATCH), hint: '{mimo} points at the throne at the back of the hall.' },
      ],
      story: [
        { when: s => !!st(s).seen, text: 'By the old road, the old field has become a huge {w.maze} of {w.corn}, with a grand {w.scarecrow} in the middle.' },
        { when: s => !!st(s).open, text: 'Hooded corn kids hid in the {w.maze}, the scouts of a secret society. The {w.password} for the hatch under the {w.scarecrow} was the magic word: {c.please}.' },
        { when: s => !!s.flags.goldenKernel, text: 'Under the {w.maze}, the Corn Society hid from the Hush and stopped talking, and they started to forget words. Their leader, Colonel Cob, took you for spies until your words won. He gave you the Golden Kernel: “Plant it where the {c.silence} began.” That must be the old {w.tower}.' },
      ],
    };
  }

  return {
    // plain data (before any scene exists; world.js reads these)
    layout: LAYOUT, landmarks: LANDMARKS, keepClear, bareAt, flatK, distTo, flatY: FLAT_Y,
    build,
    // the hall, as a room (main.js: ROOMS; story.js: interactables)
    init(game) {
      G = game;
      if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'corn')) QUESTS.LIST.push(quest());
    },
    get inside() { return inside; },
    OUTSIDE,
    interactables() { if (!G) return []; return inside ? insideItems() : outsideItems(); },
    update(dt, t) { update(dt, t); },
    // (Mimo's "what is this called?" waits while the Colonel's scene runs and while a card is up: it used to open over the
    // Golden Kernel's key-item card)
    curiosities() { return inside && colBusy <= 0 && !cardUp() ? [{ id: 'w.corn', x: COLUMNS[2].x, z: COLUMNS[2].z, r: 4.5 }, { id: 'w.bread', x: TABLES[0].x, z: TABLES[0].z, r: 3.5 }] : []; },
    target() { return G && inside ? (S().boss ? LADDER : COLONEL) : null; },
    enter, leave, quest,
    // tests and tools
    _: {
      gen, MZ, SOLIDS, RUNS, SEGS, SPOTS, PATHS, HALL, LT, YOU, MEMBERS, CENTER, HATCH, SCARECROW, LADDER, ARRIVE, COLONEL, THRONE, TABLES,
      lineOf, judgePassword, knock, openHatch, centerScene, scoutTalk, readSign, pickTreat, colonelScene, winScene, loseScene, fightColonel, safeFight, bossKinds,
      memberTalk, takeBread, buildHall, applyHall, triggers, U, get maze() { return maze; }, get hall() { return hall; }, S: () => S(), speak,
      // zh / ja: every line, sign, name and word in the notation (CJK.validate) → [] when all is well
      _cjCheck() {
        if (typeof CJK === 'undefined') return [];
        const out = [], chk = (where, s, l) => { if (typeof s !== 'string' || !s) { out.push({ where, problems: ['missing'] }); return; } const p = CJK.validate(s, l); if (p.length) out.push({ where, src: s, problems: p }); };
        for (const l of ['zh', 'ja']) {
          for (const [k, T] of Object.entries(LT)) { if (!T[l]) out.push({ where: `line ${k}`, problems: ['no ' + l] }); (T[l] || []).forEach((s, i) => chk(`line ${k}[${i}]`, s, l)); }
          for (const [n, T] of Object.entries({ SIGN_WORDS, MOTTO })) for (const [k, v] of Object.entries(T)) chk(`${n}.${k}`, v[l], l);
          KID_NAMES.forEach((N, i) => chk('scout ' + i, N[l], l)); chk('colonel', COL_NAME[l], l); chk('alba', ALBA_UP[l], l);
          Object.entries(CM_NAMES).forEach(([id, N]) => chk('name ' + id, N[l === 'zh' ? 0 : 1], l));
          Object.entries(CM_WORDS).forEach(([id, T]) => { chk('word ' + id, T[l], l); ((T.alt || {})[l] || []).forEach(s => chk('word ' + id, s, l)); });
        }
        return out;
      },
      // the outside triggers run from the field's update (main.js calls it every frame the field is shown)
      cellX, cellZ, boxOut, folk,
    },
  };
})();
