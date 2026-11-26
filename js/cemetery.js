'use strict';
// North of Alba (the user's request, 2026-11-06): out of the north gate (−10, −193) a worn brick road (cracked, sunken,
// mossy, bricks missing, weeds) runs north through the Old Quarter, a handful of rundown houses on the village's outskirts
// (boarded windows, sagging roofs, faded paint, vines; one half collapsed; a swing hanging from a single rope): Alba is
// slowly shrinking. At the fork, straight ahead and a little to the left, stands the old theater (Teatro de Alba), boarded
// up and chained: it will matter when the story goes to the past. Peek through its broken window: a dusty stage, one music
// stand in a beam of light, a little red cap left behind. Over its door, a clock ringed by eight little bells.
// The left branch, a long worn brick path, winds north-west through thinning trees to the cemetery (40 × 30): an iron
// fence and gate, cypresses, the gravekeeper's hut, Aurora's mausoleum, crows, candles, fireflies, a bench, gray stains.
// The right branch is the old north road, chained shut, with gray mist past the bars (a future region).
//
// The side quest «The faded names»: the Hush has faded the names on six graves, because nobody says them anymore.
// Baltasar, the half-hushed gravekeeper, asks you to give them back. His book has the jobs; the names come from Doña Tina
// (ask her: «¿Quién era la panadera?»), a class photo in the fallen house, a crow with a photo (ask it nicely), Lía's
// postcard, the theater's poster, and Baltasar himself once his words come back. Restore a grave by typing its name and
// job («Elena, la panadera»): a memory wisp rises and tells a little story, and Baltasar gets a little color back. With
// all six back, the wisps sing their old song at the mausoleum and you sing the missing word; Aurora's wisp gives you her
// pocket watch, stopped at eight, and the gray lifts.
// Everyone buried here is alive in the past: CEMETERY.PEOPLE. CEMETERY.setEra('past') shows that era (a debug call for
// now): the houses and the theater thriving in an older style, a new brick road, a small, mostly empty cemetery, people.
//
// One global, CEMETERY:
//   plain data, ready before world.js: layout, hush (gray patches for L.hush), ground(x, z, h) (rawHeight), playDist(x, z),
//                                       keepClear(x, z, pad), bareAt(x, z), areaAt(x, z), songAt(x, z), drawMap(ctx, o)
//   CEMETERY.build(scene, { terrainAt }) → { colliders, platforms, group, people (live: the array changes with the era),
//                                             update(dt, t, you|null), landmarks, objects, stats() }
//   the game side: init(game) (adds the quest), interactables(), curiosities(), setEra('now' | 'past'), era, quest()
// Progress lives in state.cemetery; the prize in state.flags.pocketWatch and state.bag['k.pocketWatch'].
// Needs THREE (r128), core.js, toonkit.js, lexicon.js, words.js, lines.js and icons.js at load; UI, STORY, WORLD at run time.

const CEMETERY = (() => {
  const GEO0 = TK.G, HALF = Math.PI / 2;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; };
  const pick = (a, R) => a[Math.floor(R() * a.length) % a.length];
  const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
  const mix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  function segDist(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
  }
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
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // typed answers: no accents, case or punctuation, and German ae/oe/ue/ß written out count too
  const fold = s => norm(s).replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/ß/g, 'ss');
  const inBox = (b, x, z, pad = 0) => x > b.x0 - pad && x < b.x1 + pad && z < b.zS + pad && z > b.zN - pad;
  const boxOut = (b, x, z) => Math.max(b.x0 - x, x - b.x1, z - b.zS, b.zN - z);         // < 0 inside (zS is the south edge: north is −z)
  // an oriented box's outside distance (rot: the mesh's rotation.y, as world.js pushOut)
  function obbOut(b, x, z) {
    const c = Math.cos(b.rot || 0), s = Math.sin(b.rot || 0), lx = (x - b.x) * c - (z - b.z) * s, lz = (x - b.x) * s + (z - b.z) * c;
    return Math.max(Math.abs(lx) - b.w / 2, Math.abs(lz) - b.d / 2);
  }

  // ================================================================ the layout (pure data)
  // A road: a smoothed centerline with arc lengths. near(x, z) → { d, s }; at(s) → { x, z, ux, uz }
  function Line(pts, per = 6) {
    const P = spline(pts, per), S = [0];
    for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (const [x, z] of P) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    const len = S[S.length - 1];
    function near(x, z) {
      let best = 1e9, bs = 0;
      for (let i = 0; i < P.length - 1; i++) {
        const ax = P[i][0], az = P[i][1], dx = P[i + 1][0] - ax, dz = P[i + 1][1] - az, l2 = dx * dx + dz * dz;
        const t = l2 ? clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1) : 0, d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
        if (d < best) { best = d; bs = S[i] + t * (S[i + 1] - S[i]); }
      }
      return { d: best, s: bs };
    }
    function at(s) {
      s = clamp(s, 0, len); let i = 1; while (i < P.length - 1 && S[i] < s) i++;
      const [ax, az] = P[i - 1], [bx, bz] = P[i], l = (S[i] - S[i - 1]) || 1, t = (s - S[i - 1]) / l;
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, ux: (bx - ax) / l, uz: (bz - az) / l };
    }
    return { pts, P, S, len, near, at, bb: { x0, x1, z0, z1 } };
  }
  // the roads: through the Old Quarter (from where Alba's cobbles end) to the theater's forecourt; the long path to the
  // cemetery (its corridor of trees widens as they thin out); the old north road to its chained gate; past the gate
  const ROADS = {
    main: { w: 3.6, open: [9, 9], pts: [[-10, -187.3], [-10, -193], [-9.7, -199], [-10.3, -205], [-10.6, -211], [-10.3, -217], [-10, -223.0]] },
    left: { w: 2.6, open: [3.6, 9.5], pts: [[-21.2, -229.9], [-26.2, -232.2], [-31.4, -235.4], [-35.8, -240.2], [-39.4, -246], [-43, -251.4], [-47.4, -256.2], [-50.8, -260.4], [-53.4, -263.6], [-55.6, -265.0]] },
    right: { w: 2.4, open: [4, 2.4], pts: [[-5.8, -228.2], [-2.0, -232.0], [2.0, -237.2], [5.0, -243.2], [7.2, -249.0], [8.7, -254.2]] },
    beyond: { w: 2.2, open: [1.8, 1.8], pts: [[9.0, -255.4], [10.6, -260.4], [12.5, -266], [14.7, -272]] },
  };
  for (const r of Object.values(ROADS)) Object.assign(r, Line(r.pts));
  const SQUARE = { x0: -21.4, x1: -5.6, zS: -223.0, zN: -233.6 };          // the theater's brick forecourt, where the roads fork
  const QUARTER = { x0: -28, x1: 8, zS: -192, zN: -227 };
  const HALLBOX = { x0: -24.6, x1: -2.4, zS: -222.6, zN: -250.4 };
  const CEMBOX = { x0: -96, x1: -56, zS: -252, zN: -282 };
  const REGION = { x0: -112, x1: 30, zS: -186, zN: -292 };                   // everything this file touches
  // the houses of the Old Quarter (front = local +z, toward the road). [now, past] colors
  const HOUSES = [
    { id: 'tina', x: -19.6, z: -204.6, w: 6.2, d: 5.0, rot: HALF, floors: 1, style: 'cottage', wall: ['#e2ccaa', '#f6dcae'], roof: ['#a35a4c', '#c9553f'], door: '#4f8a4a', shutter: '#3e7fb0', kind: 'tina' },
    { id: 'bakery', x: -20.6, z: -213.8, w: 7.2, d: 5.6, rot: HALF, floors: 1, style: 'stucco', wall: ['#d6c3a8', '#fbe9c8'], roof: ['#93604f', '#d0663f'], door: '#8d5733', shutter: '#d0663f', kind: 'bakery' },
    { id: 'blue', x: -20.0, z: -222.2, w: 5.4, d: 4.8, rot: HALF + 0.12, floors: 1, style: 'timber', wall: ['#c3ccd2', '#e7eef4'], roof: ['#5b6f84', '#3f7fc9'], door: '#7a4f8f', shutter: '#3e8f8a', kind: 'house' },
    { id: 'ruin', x: -0.9, z: -203.2, w: 6.4, d: 5.4, rot: -HALF, floors: 2, style: 'timber', wall: ['#d5cab6', '#f6ead6'], roof: ['#6b7b60', '#4f9a5a'], door: '#b84a3a', shutter: '#4f8a4a', kind: 'ruin' },
    { id: 'post', x: 0.1, z: -212.4, w: 7.0, d: 5.6, rot: -HALF, floors: 2, style: 'stucco', wall: ['#c3cdbd', '#dcecd8'], roof: ['#5a7b78', '#3e8f8a'], door: '#3e7fb0', shutter: '#2f6f6a', kind: 'post' },
    { id: 'sale', x: -0.7, z: -220.8, w: 5.8, d: 4.8, rot: -HALF - 0.1, floors: 1, style: 'cottage', wall: ['#d2bbb0', '#f4d8c8'], roof: ['#7a6782', '#8a5ab0'], door: '#2f6f6a', shutter: '#b84a3a', kind: 'sale' },
  ];
  const HALL = { x: -13.5, z: -241, w: 14, d: 12.5, H: 7.2, rot: 0, floors: 2.5, kind: 'hall' };   // the old theater (front faces south)
  const HUT = { x: -61.4, z: -278.6, w: 5.2, d: 4.0, rot: 0, floors: 0.4, kind: 'hut' };
  const MAUS = { x: -90.6, z: -265, w: 6.0, d: 6.4, rot: HALF, floors: 0.6, kind: 'mausoleum' };   // faces east, toward the gate
  const SPOT = {
    gate: { x: -10, z: -193 }, well: { x: -14.6, z: -217.4 }, sign: { x: -13.6, z: -222.4 }, swing: { x: 3.8, z: -197.8 },
    tina: { x: -16.1, z: -205.0 }, lia: { x: 0.5, z: -199.0 }, cart: { x: -15.4, z: -208.9 }, sale: { x: -5.1, z: -219.4 }, mailbox: { x: -3.5, z: -209.4 },
    lamp: { x: -7.5, z: -213.4 }, hallDoor: { x: -13.5, z: -234.75 }, peek: { x: -17.5, z: -233.9 }, poster: { x: -11.25, z: -233.9 },
    ruinLook: { x: -4.9, z: -205.0 }, northGate: { x: 9.0, z: -255.0 }, cemGate: { x: -56, z: -265 }, ledger: { x: -58.4, z: -275.6 },
    baltasar: { x: -67.5, z: -266.7 }, bench: { x: -84.4, z: -262.5 }, obelisk: { x: -89.4, z: -256.6 }, deadTree: { x: -92.6, z: -254.6 },
    mausDoor: { x: -88.3, z: -265 }, cemCenter: { x: -76, z: -267 }, hallCenter: { x: -13.5, z: -238 },
  };
  { const r = ROADS.right, a = r.at(r.len), b = r.at(r.len - 1.5); const u = Math.hypot(a.x - b.x, a.z - b.z) || 1; SPOT.northGate.ux = (a.x - b.x) / u; SPOT.northGate.uz = (a.z - b.z) / u; }
  // graves: the six faded ones (the quest), six that can still be read, and old mossy ones with nothing left to read
  // face: the way the inscription looks (N = −z, toward the main path for the south rows)
  const QG = [
    { id: 'elena', job: 'baker', fem: true, name: 'Elena Prado', x: -64.5, z: -261.4, face: 'N', shape: 'round', sym: 'bread', tint: '#ffd36a', clue: 'tina' },
    { id: 'julian', job: 'teacher', fem: false, name: 'Julián Mora', x: -73.5, z: -261.4, face: 'N', shape: 'peak', sym: 'book', tint: '#8fe0a0', clue: 'photo' },
    { id: 'felix', job: 'musician', fem: false, name: 'Félix Bravo', x: -76.5, z: -257.0, face: 'N', shape: 'scroll', sym: 'note', tint: '#c9a2ff', clue: 'poster' },
    { id: 'clara', job: 'seamstress', fem: true, name: 'Clara Soler', x: -60.5, z: -268.8, face: 'S', shape: 'round', sym: 'spool', tint: '#ff9cc0', clue: 'crow' },
    { id: 'mateo', job: 'postman', fem: false, name: 'Mateo Luna', x: -73.5, z: -268.8, face: 'S', shape: 'flat', sym: 'letter', tint: '#8cc6ff', clue: 'lia' },
    { id: 'ines', job: 'gardener', fem: true, name: { es: 'Inés Duarte', pt: 'Inês Duarte', de: 'Inés Duarte' }, x: -83.5, z: -268.8, face: 'S', shape: 'peak', sym: 'flower', tint: '#b6f08a', clue: 'baltasar' },
  ];
  QG.forEach((g, i) => { g.q = i; g.slot = i; });
  const FG = [
    { id: 'andres', name: 'Andrés Vidal', x: -76.5, z: -261.4, face: 'N', shape: 'round', sym: 'apple',
      ep: { es: 'El amigo de los manzanos', pt: 'O amigo das macieiras', de: 'Der Freund der Apfelbäume' }, en: 'The friend of the apple trees' },
    { id: 'sofia', name: 'Sofía Reyes', x: -83.5, z: -261.4, face: 'N', shape: 'flat', sym: 'heart',
      ep: { es: 'La doctora de Alba', pt: 'A médica de Alba', de: 'Die Ärztin von Alba' }, en: 'Alba’s doctor' },
    { id: 'gil', name: { es: 'Ramona y Rufino Gil', pt: 'Ramona e Rufino Gil', de: 'Ramona und Rufino Gil' }, x: -64.5, z: -257.0, face: 'N', shape: 'scroll', sym: 'shoe',
      ep: { es: 'Zapateros. Hermanos. Amigos.', pt: 'Sapateiros. Irmãos. Amigos.', de: 'Schuster. Geschwister. Freunde.' }, en: 'Shoemakers. Twins. Friends.' },
    { id: 'lorenzo', name: 'Lorenzo Paz', x: -64.5, z: -268.8, face: 'S', shape: 'peak', sym: 'saw',
      ep: { es: 'Carpintero y buen amigo', pt: 'Carpinteiro e bom amigo', de: 'Tischler und guter Freund' }, en: 'Carpenter and good friend' },
    { id: 'bernardo', name: 'Bernardo Ruiz', x: -76.5, z: -268.8, face: 'S', shape: 'round', sym: 'bowl',
      ep: { es: 'Siempre una sopa caliente', pt: 'Sempre uma sopa quente', de: 'Immer eine warme Suppe' }, en: 'Always a hot soup' },
    { id: 'pilar', name: 'Pilar Ortega', x: -64.5, z: -273.0, face: 'S', shape: 'scroll', sym: 'bell',
      ep: { es: '¡Din, don!', pt: 'Dim, dom!', de: 'Bim, bam!' }, en: 'Ding, dong!' },
  ];
  FG.forEach((g, i) => { g.slot = 6 + i; });
  const OLDG = [[-60.5, -257.0, 'N', 'ancient'], [-73.5, -257.0, 'N', 'lean'], [-83.5, -257.0, 'N', 'ancient'], [-73.5, -273.0, 'S', 'ancient'], [-76.5, -273.0, 'S', 'lean'],
    [-83.5, -273.0, 'S', 'broken'], [-74.6, -277.4, 'S', 'ancient'], [-84.4, -277.6, 'S', 'lean'], [-90.4, -277.2, 'E', 'broken'], [-60.6, -273.4, 'S', 'broken']]
    .map(([x, z, face, kind]) => ({ x, z, face, kind }));
  const GRAVES_ALL = QG.concat(FG, OLDG);
  const CYPRESS = [[-93.6, -260.2], [-93.6, -269.8], [-87.0, -259.6], [-87.0, -270.4], [-67.0, -253.6], [-77.4, -253.6], [-67.4, -280.4], [-78.4, -280.4], [-88.6, -280.6], [-54.0, -261.0], [-54.0, -269.0]];
  // the people buried here: all of them alive in the past (era 'past'), for the story's visit there later
  const PEOPLE = [
    { id: 'elena', name: 'Elena Prado', role: 'the baker', bio: 'Baked Alba’s bread in the Old Quarter, and sang to the dough so it would rise higher.', era: 'past', grave: 'quest' },
    { id: 'julian', name: 'Julián Mora', role: 'the schoolteacher', bio: 'Taught every child in Alba to read and write; his favorite letters were the ones full of brave mistakes.', era: 'past', grave: 'quest' },
    { id: 'felix', name: 'Félix Bravo', role: 'the musician (the theater’s pianist)', bio: 'Played the piano in the theater; one song from him and the whole village danced.', era: 'past', grave: 'quest' },
    { id: 'clara', name: 'Clara Soler', role: 'the seamstress', bio: 'Sewed the choir’s red robes, always a little too big, so the singers could grow into them.', era: 'past', grave: 'quest' },
    { id: 'mateo', name: 'Mateo Luna', role: 'the postman', bio: 'Carried every letter in the valley for forty years, and knew every door and every dog by its bark.', era: 'past', grave: 'quest' },
    { id: 'ines', name: 'Inés Duarte', role: 'the gardener', bio: 'Planted the cemetery’s cypresses and taught young Baltasar to care for them.', era: 'past', grave: 'quest' },
    { id: 'aurora', name: 'Aurora Campos', role: 'the choir director, who built the theater', bio: 'Built the theater so the whole village could sing together; her pocket watch stopped at eight, the hour of the spring concert.', era: 'past', grave: 'mausoleum' },
    { id: 'andres', name: 'Andrés Vidal', role: 'the apple grower', bio: 'Planted the apple trees whose apples Doña Rosa still sells.', era: 'past', grave: 'stone' },
    { id: 'gil', name: 'Ramona and Rufino Gil', role: 'twin shoemakers', bio: 'Made every pair of shoes in Alba, and argued about every single one.', era: 'past', grave: 'stone' },
    { id: 'sofia', name: 'Sofía Reyes', role: 'the village doctor', bio: 'Cured colds with soup and bad moods with jokes.', era: 'past', grave: 'stone' },
    { id: 'lorenzo', name: 'Lorenzo Paz', role: 'the carpenter', bio: 'Built the theater’s stage and every one of its chairs.', era: 'past', grave: 'stone' },
    { id: 'bernardo', name: 'Bernardo Ruiz', role: 'the innkeeper', bio: 'Kept the inn’s fire going and knew every traveller’s story.', era: 'past', grave: 'stone' },
    { id: 'pilar', name: 'Pilar Ortega', role: 'the bell ringer', bio: 'Rang the theater’s bell before every concert, loud enough to wake the next valley.', era: 'past', grave: 'stone' },
    // alive now too
    { id: 'baltasar', name: 'Baltasar', role: 'the gravekeeper (a teenage apprentice gardener in the past)', bio: 'Inés taught him to care for the cypresses; now he looks after all of them, and he is going gray.', era: 'both' },
    { id: 'tina', name: 'Doña Tina', role: 'the last neighbor of the Old Quarter (a girl in the choir in the past)', bio: 'Still sits on her porch; as a girl she sang in Aurora’s choir and was Elena’s neighbor.', era: 'both' },
  ];

  // ================================================================ the ground: the roads' height, flat pads, the woods
  // world.js's own height here (its noise, and Alba's flat ground fading out past the town): the same formula, so the
  // brick roads can follow a smoothed version of it
  function natural(x, z) {
    let h = 0.55 * Math.sin(x * 0.09) * Math.cos(z * 0.11) + 0.3 * Math.sin(x * 0.21 + 1.3) * Math.sin(z * 0.17 + 0.4) + 0.7 * Math.sin(x * 0.035 + z * 0.02);
    h += 0.35; if (h < 0.3) h = 0.3 + (h - 0.3) * 0.12;
    return lerp(h, 0.25, 1 - smoothstep(-8, 2, Math.hypot(x + 10, z + 150) - 44));
  }
  // each road's height along it: the ground's, smoothed (a box filter, twice), so the road rises and dips gently
  for (const r of Object.values(ROADS)) {
    const n = Math.max(2, Math.ceil(r.len)), raw = [];
    for (let i = 0; i <= n; i++) { const a = r.at(i * r.len / n); raw.push(natural(a.x, a.z)); }
    let y = raw;
    for (let pass = 0; pass < 2; pass++) y = y.map((_, i) => { let s = 0, c = 0; for (let j = Math.max(0, i - 6); j <= Math.min(n, i + 6); j++) { s += y[j]; c++; } return s / c; });
    r.ys = y; r.yAt = s => { const f = clamp(s / r.len, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)); return lerp(y[i], y[i + 1], f - i); };
  }
  // where the old road leaves Alba, keep the town's own ground (it slopes up from the cobbles to the gate)
  ROADS.main.ys.forEach((_, i, a) => { const s = i * ROADS.main.len / (a.length - 1), p = ROADS.main.at(s); if (p.z > -194) a[i] = natural(p.x, p.z); });
  const SQY = ROADS.main.yAt(ROADS.main.len);
  ROADS.left.ys[0] = ROADS.left.ys[1] = SQY; ROADS.right.ys[0] = ROADS.right.ys[1] = SQY;      // (both branches leave the forecourt level)
  const CEMY = ROADS.left.yAt(ROADS.left.len), GATEY = ROADS.right.yAt(ROADS.right.len);
  // flat pads: each house sits level with the road in front of it; the theater and its forecourt; the cemetery; the gate
  HOUSES.forEach(h => { const q = ROADS.main.near(h.x, h.z); h.y0 = ROADS.main.yAt(q.s) + 0.02; });
  HALL.y0 = SQY; HUT.y0 = CEMY; MAUS.y0 = CEMY;
  const PADS = HOUSES.map(h => ({ obb: h, y: h.y0, m0: 0.8, m1: 3.6 }))
    .concat([{ box: { x0: SQUARE.x0 - 0.6, x1: SQUARE.x1 + 0.6, zS: SQUARE.zS + 0.4, zN: HALL.z - HALL.d / 2 - 1.2 }, y: SQY, m0: 0.5, m1: 4 },
      { box: CEMBOX, y: CEMY, m0: 1.5, m1: 6 }, { circle: SPOT.northGate, r: 3.5, y: GATEY, m0: 0, m1: 3 }, { circle: SPOT.swing, r: 2.2, y: ROADS.main.yAt(ROADS.main.near(SPOT.swing.x, SPOT.swing.z).s), m0: 0, m1: 3 }]);
  // the gray patches world.js adds to L.hush: the cemetery (it lifts when the names are back), and the mist past the north gate
  const HUSH = [{ x: -76, z: -267, r: 17, a: 0.42, cemetery: true }, { x: 13.4, z: -268.5, r: 9, a: 0.72, northRoad: true }];

  // world.js rawHeight: the roads smoothed, the pads flat (called with world.js's height so far)
  function ground(x, z, h) {
    if (x < REGION.x0 || x > REGION.x1 || z > REGION.zS || z < REGION.zN) return h;
    let best = 0, target = h;
    for (const r of Object.values(ROADS)) {
      const b = r.bb, m = r.w / 2 + 4;
      if (x < b.x0 - m || x > b.x1 + m || z < b.z0 - m || z > b.z1 + m) continue;
      const q = r.near(x, z), k = 1 - smoothstep(r.w / 2 + 0.4, r.w / 2 + 3.6, q.d);
      if (k > best) { best = k; target = r.yAt(q.s); }
    }
    if (z > -194) best *= smoothstep(-189, -194, z);      // (Alba's own ground, up to its gate)
    if (best > 0) h = lerp(h, target, best);
    for (const p of PADS) {
      const d = p.obb ? obbOut(p.obb, x, z) : p.box ? boxOut(p.box, x, z) : Math.hypot(x - p.circle.x, z - p.circle.z) - p.r;
      if (d < p.m1) h = lerp(h, p.y, 1 - smoothstep(p.m0, p.m1, d));
    }
    return h;
  }
  // world.js playDist: how far you are from anywhere you're meant to be (negative inside)
  function roadOpen(r, x, z) {
    const b = r.bb, m = 30;
    if (x < b.x0 - m || x > b.x1 + m || z < b.z0 - m || z > b.z1 + m) return 1e9;
    const q = r.near(x, z);
    return q.d - lerp(r.open[0], r.open[1], smoothstep(0, r.len, q.s));
  }
  function playDist(x, z) {
    if (x < REGION.x0 - 40 || x > REGION.x1 + 40 || z > REGION.zS + 10 || z < REGION.zN - 30) return 1e9;
    let d = 1e9;
    for (const key of ['main', 'left', 'right', 'beyond']) d = Math.min(d, roadOpen(ROADS[key], x, z));
    d = Math.min(d, boxOut(QUARTER, x, z), boxOut(HALLBOX, x, z), boxOut(CEMBOX, x, z) - 1.5);
    return d;
  }
  // world.js open() and its flowers: no trees, rocks or flowers on the roads, in the houses and their yards, the theater,
  // the cemetery (it has its own cypresses), or where this file puts things
  const KEEP = [];          // circles { x, z, r }: props and this file's own trees (filled once the build data exists)
  function keepClear(x, z, pad = 0) {
    if (x < REGION.x0 || x > REGION.x1 || z > REGION.zS || z < REGION.zN) return false;
    for (const r of Object.values(ROADS)) {
      const b = r.bb, m = r.w / 2 + 3;
      if (x < b.x0 - m || x > b.x1 + m || z < b.z0 - m || z > b.z1 + m) continue;
      if (r.near(x, z).d < r.w / 2 + 1.4 + pad) return true;
    }
    if (inBox(SQUARE, x, z, 1.5 + pad) || inBox(HALLBOX, x, z, -1.2 + pad) || inBox(CEMBOX, x, z, 1.5 + pad)) return true;
    for (const h of HOUSES) if (obbOut(h, x, z) < 2.2 + pad) return true;
    for (const c of KEEP) if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true;
    return false;
  }
  // world.js townBare: no grass on the bricks, in the buildings, or on the cemetery's paths (0..1)
  function bareAt(x, z) {
    if (x < REGION.x0 || x > REGION.x1 || z > REGION.zS || z < REGION.zN) return 0;
    let a = 0;
    for (const r of Object.values(ROADS)) {
      const b = r.bb, m = r.w / 2 + 1;
      if (x < b.x0 - m || x > b.x1 + m || z < b.z0 - m || z > b.z1 + m) continue;
      a = Math.max(a, 1 - smoothstep(r.w / 2 - 0.2, r.w / 2 + 0.5, r.near(x, z).d));
    }
    if (inBox(SQUARE, x, z, 0.3)) a = 1;
    if (obbOut(HALL, x, z) < 0.4 || (Math.abs(x - HALL.x) < 2.2 && z > HALL.z && z < HALL.z + HALL.d / 2 + 1.6)) a = 1;      // (its floor, and the steps)
    for (const h of HOUSES) if (obbOut(h, x, z) < 0.3) a = 1;
    if (inBox(CEMBOX, x, z)) {
      a = Math.max(a, 0.72);                // (the grass is kept low in here)
      for (const g of GRAVES_ALL) if (Math.abs(x - g.x) < 0.9 && Math.abs(z - g.z) < 2.3) { a = Math.max(a, 0.94); break; }
      if (Math.abs(z - SPOT.cemGate.z) < 1.5 && x > MAUS.x) a = Math.max(a, 1 - smoothstep(1.1, 1.5, Math.abs(z - SPOT.cemGate.z)));
      for (const px of [-70, -80]) if (Math.abs(x - px) < 1.0) a = Math.max(a, 1 - smoothstep(0.7, 1.0, Math.abs(x - px)));
      if (obbOut(MAUS, x, z) < 0.6 || obbOut(HUT, x, z) < 0.5) a = 1;
    }
    return a;
  }
  // the mini-map's area names
  const AREAS = { quarter: { id: 'oldquarter', name: 'The Old Quarter', color: '#b4703f' }, road: { id: 'brickroad', name: 'The Brick Road', color: '#a8533f' },
    cemetery: { id: 'cemetery', name: 'The Cemetery', color: '#6c6688' } };
  function areaAt(x, z) {
    if (z > -193.5 || x < REGION.x0 || x > REGION.x1 || z < REGION.zN) return null;
    if (inBox(CEMBOX, x, z, 3)) return AREAS.cemetery;
    if (inBox(QUARTER, x, z) || inBox(HALLBOX, x, z, 1)) return AREAS.quarter;
    for (const key of ['left', 'right', 'beyond']) if (roadOpen(ROADS[key], x, z) < 4) return AREAS.road;
    return null;
  }
  // the music: Alba's song in the Old Quarter; out on the brick road and in the cemetery, the forest's (the Hush dims it)
  function songAt(x, z) { const a = areaAt(x, z); return !a ? null : a === AREAS.quarter ? 'village' : 'forest'; }

  // ================================================================ words, icons and lines (registered at load)
  const NEW_WORDS = [
    { id: 'w.grave', es: 'tumba', pt: 'túmulo', de: 'Grab', en: 'grave', g: { es: 'f', pt: 'm', de: 'n' }, pl: { es: 'tumbas', pt: 'túmulos', de: 'Gräber' }, icon: 'grave',
      alt: { es: ['sepultura', 'lápida'], pt: ['sepultura', 'lápide', 'jazigo'], de: ['Grabstein'] } },
    { id: 'w.cemetery', es: 'cementerio', pt: 'cemitério', de: 'Friedhof', en: 'cemetery', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'cementerios', pt: 'cemitérios', de: 'Friedhöfe' }, icon: 'cemetery' },
    { id: 'w.candle', es: 'vela', pt: 'vela', de: 'Kerze', en: 'candle', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'velas', pt: 'velas', de: 'Kerzen' }, icon: 'candle' },
    { id: 'w.crow', es: 'cuervo', pt: 'corvo', de: 'Krähe', en: 'crow', g: { es: 'm', pt: 'm', de: 'f' }, pl: { es: 'cuervos', pt: 'corvos', de: 'Krähen' }, icon: 'crow', alt: { de: ['Rabe'] } },
    { id: 'w.name', es: 'nombre', pt: 'nome', de: 'Name', en: 'name', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'nombres', pt: 'nomes', de: 'Namen' }, icon: 'name' },
    { id: 'w.photo', es: 'foto', pt: 'foto', de: 'Foto', en: 'photo', g: { es: 'f', pt: 'f', de: 'n' }, pl: { es: 'fotos', pt: 'fotos', de: 'Fotos' }, icon: 'photo',
      alt: { es: ['fotografía'], pt: ['fotografia'], de: ['Bild'] } },
    // jobs (the graves' second lines): the base form is the man's, f the woman's (the weave's {w.baker:f})
    { id: 'w.baker', es: 'panadero', pt: 'padeiro', de: 'Bäcker', en: 'baker', g: { es: 'm', pt: 'm', de: 'm' }, f: { es: 'panadera', pt: 'padeira', de: 'Bäckerin' },
      pl: { es: 'panaderos', pt: 'padeiros', de: 'Bäcker' }, icon: 'baker', alt: { es: ['panadera'], pt: ['padeira'], de: ['Bäckerin'] } },
    { id: 'w.teacher', es: 'maestro', pt: 'professor', de: 'Lehrer', en: 'teacher', g: { es: 'm', pt: 'm', de: 'm' }, f: { es: 'maestra', pt: 'professora', de: 'Lehrerin' },
      pl: { es: 'maestros', pt: 'professores', de: 'Lehrer' }, icon: 'teacher', alt: { es: ['maestra', 'profesor', 'profesora'], pt: ['professora'], de: ['Lehrerin'] } },
    { id: 'w.seamstress', es: 'costurera', pt: 'costureira', de: 'Schneiderin', en: 'seamstress', g: { es: 'f', pt: 'f', de: 'f' }, f: { es: 'costurera', pt: 'costureira', de: 'Schneiderin' },
      pl: { es: 'costureras', pt: 'costureiras', de: 'Schneiderinnen' }, icon: 'seamstress', alt: { es: ['modista'], de: ['Näherin'] } },
    { id: 'w.postman', es: 'cartero', pt: 'carteiro', de: 'Briefträger', en: 'postman', g: { es: 'm', pt: 'm', de: 'm' }, f: { es: 'cartera', pt: 'carteira', de: 'Briefträgerin' },
      pl: { es: 'carteros', pt: 'carteiros', de: 'Briefträger' }, icon: 'postman', alt: { de: ['Postbote'] } },
    { id: 'w.gardener', es: 'jardinero', pt: 'jardineiro', de: 'Gärtner', en: 'gardener', g: { es: 'm', pt: 'm', de: 'm' }, f: { es: 'jardinera', pt: 'jardineira', de: 'Gärtnerin' },
      pl: { es: 'jardineros', pt: 'jardineiros', de: 'Gärtner' }, icon: 'gardener', alt: { es: ['jardinera'], pt: ['jardineira'], de: ['Gärtnerin'] } },
    { id: 'w.musician', es: 'músico', pt: 'músico', de: 'Musiker', en: 'musician', g: { es: 'm', pt: 'm', de: 'm' }, f: { es: 'música', pt: 'musicista', de: 'Musikerin' },
      pl: { es: 'músicos', pt: 'músicos', de: 'Musiker' }, icon: 'musician', alt: { es: ['música'], pt: ['musicista'], de: ['Musikerin'] } },
    // the prize (a key item, not a word to teach)
    { id: 'k.pocketWatch', kind: 'key', es: 'reloj de bolsillo', pt: 'relógio de bolso', de: 'Taschenuhr', en: 'pocket watch', g: { es: 'm', pt: 'm', de: 'f' }, icon: 'pocketWatch' },
  ];
  if (typeof LEX !== 'undefined') NEW_WORDS.forEach(w => { if (!LEX.item(w.id)) LEX.register([Object.assign({ kind: 'word' }, w)]); });
  if (typeof WORDS !== 'undefined' && Array.isArray(WORDS)) NEW_WORDS.forEach(w => { if (w.kind !== 'key' && !WORDS.some(x => x.id === w.id) && LEX.item(w.id)) WORDS.push(LEX.item(w.id)); });   // (the journal's word cards)
  // plurals for two shared words these lines use as {w.flower:pl} and {w.letter:pl} (words.js has none; only added if missing)
  if (typeof LEX !== 'undefined') for (const [id, pl] of [['w.flower', { es: 'flores', pt: 'flores', de: 'Blumen' }], ['w.letter', { es: 'cartas', pt: 'cartas', de: 'Briefe' }]]) { const it = LEX.item(id); if (it && !it.pl) it.pl = pl; }
  // the jobs for judging what you type: [man, woman] per language, and other words people use
  const JOBS = {
    baker: { id: 'w.baker', es: ['panadero', 'panadera'], pt: ['padeiro', 'padeira'], de: ['Bäcker', 'Bäckerin'], en: ['baker'], sym: 'bread' },
    teacher: { id: 'w.teacher', es: ['maestro', 'maestra'], pt: ['professor', 'professora'], de: ['Lehrer', 'Lehrerin'], en: ['teacher'], alt: { es: [['profesor', 'profesora']] }, sym: 'book' },
    musician: { id: 'w.musician', es: ['músico', 'música'], pt: ['músico', 'musicista'], de: ['Musiker', 'Musikerin'], en: ['musician', 'pianist'], alt: { es: [['pianista', 'pianista']], pt: [['pianista', 'pianista']], de: [['Pianist', 'Pianistin']] }, sym: 'note' },
    seamstress: { id: 'w.seamstress', es: ['costurero', 'costurera'], pt: ['costureiro', 'costureira'], de: ['Schneider', 'Schneiderin'], en: ['seamstress', 'tailor'], alt: { es: [['sastre', 'modista']], de: [['Näher', 'Näherin']] }, sym: 'spool' },
    postman: { id: 'w.postman', es: ['cartero', 'cartera'], pt: ['carteiro', 'carteira'], de: ['Briefträger', 'Briefträgerin'], en: ['postman', 'mailman'], alt: { de: [['Postbote', 'Postbotin']] }, sym: 'letter' },
    gardener: { id: 'w.gardener', es: ['jardinero', 'jardinera'], pt: ['jardineiro', 'jardineira'], de: ['Gärtner', 'Gärtnerin'], en: ['gardener'], sym: 'flower' },
  };
  // zh / ja (CJK.md notation; the same word for a man or a woman, and no article)
  [['baker', '[面包师|miàn bāo shī]', 'パン[屋|や]'], ['teacher', '[老师|lǎo shī]', '[先生|せんせい]'], ['musician', '[音乐家|yīn yuè jiā]', '[音楽家|おんがくか]'],
    ['seamstress', '[裁缝|cái feng]', '[仕立屋|したてや]'], ['postman', '[邮递员|yóu dì yuán]', '[郵便屋|ゆうびんや]'], ['gardener', '[园丁|yuán dīng]', '[庭師|にわし]']]
    .forEach(([k, zh, ja]) => { JOBS[k].zh = [zh, zh]; JOBS[k].ja = [ja, ja]; });
  const ART = { es: ['el', 'la'], pt: ['o', 'a'], de: ['der', 'die'], zh: ['', ''], ja: ['', ''] };
  // (a language without its own entry gets the English, never a crash: the graves are drawn every frame)
  const jobWord = (job, fem, l) => { const J = JOBS[job][l] || JOBS[job].en; return J[fem ? 1 : 0] || J[0]; };
  const jobPhrase = (job, fem, l) => { const a = (ART[l] || ['the', 'the'])[fem ? 1 : 0]; return (a ? a + ' ' : '') + jobWord(job, fem, l); };
  // canvas text: zh / ja notation as plain text in the mode
  const cjL = l => typeof CJK !== 'undefined' && CJK.isCJK(l);
  const plainTxt = (t, l) => (cjL(l) ? CJK.plain(t, { lang: l }) : t);
  // zh / ja (CJK.md names table): everyone's name in the language, [given, family]; written «埃莱娜·普拉多», «エレナ・プラド»
  const CJ_NAMES = {
    elena: { zh: ['[埃莱娜|Āi lái nà]', '[普拉多|Pǔ lā duō]'], ja: ['エレナ', 'プラド'] }, julian: { zh: ['[胡利安|Hú lì ān]', '[莫拉|Mò lā]'], ja: ['フリアン', 'モラ'] },
    felix: { zh: ['[费利克斯|Fèi lì kè sī]', '[布拉沃|Bù lā wò]'], ja: ['フェリックス', 'ブラボ'] }, clara: { zh: ['[克拉拉|Kè lā lā]', '[索莱尔|Suǒ lái ěr]'], ja: ['クララ', 'ソレル'] },
    mateo: { zh: ['[马特奥|Mǎ tè ào]', '[卢纳|Lú nà]'], ja: ['マテオ', 'ルナ'] }, ines: { zh: ['[伊内斯|Yī nèi sī]', '[杜阿尔特|Dù ā ěr tè]'], ja: ['イネス', 'ドゥアルテ'] },
    aurora: { zh: ['[奥罗拉|Ào luó lā]', '[坎波斯|Kǎn bō sī]'], ja: ['オーロラ', 'カンポス'] }, andres: { zh: ['[安德烈斯|Ān dé liè sī]', '[比达尔|Bǐ dá ěr]'], ja: ['アンドレス', 'ビダル'] },
    sofia: { zh: ['[索菲娅|Suǒ fēi yà]', '[雷耶斯|Léi yē sī]'], ja: ['ソフィア', 'レイエス'] }, gil: { zh: ['[拉莫娜|Lā mò nà] [和|hé] [鲁菲诺|Lǔ fēi nuò]', '[希尔|Xī ěr]'], ja: ['ラモナ と ルフィーノ', 'ヒル'] },
    lorenzo: { zh: ['[洛伦索|Luò lún suǒ]', '[帕斯|Pà sī]'], ja: ['ロレンソ', 'パス'] }, bernardo: { zh: ['[贝尔纳多|Bèi ěr nà duō]', '[鲁伊斯|Lǔ yī sī]'], ja: ['ベルナルド', 'ルイス'] },
    pilar: { zh: ['[皮拉尔|Pí lā ěr]', '[奥尔特加|Ào ěr tè jiā]'], ja: ['ピラール', 'オルテガ'] }, baltasar: { zh: ['[巴尔塔萨|Bā ěr tǎ sà]'], ja: ['バルタサール'] },
    tina: { zh: ['[蒂娜|Dì nà] [奶奶|nǎi nai]'], ja: ['ティナ さん'], young: { zh: '[蒂娜|Dì nà]', ja: 'ティナ' } }, lia: { zh: ['[莉娅|Lì yà]'], ja: ['リア'] },
  };
  // (rōmaji capitalizes these names mid-sentence: every katakana word of the ja names)
  if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(Object.values(CJ_NAMES).flatMap(N => N.ja.join(' ').split(' ')).filter(s => /^[ァ-ヿ]+$/.test(s)));
  // a name in the notation (full: given and family), or null when the language has none
  const cjName = (id, l, full = true) => { const N = cjL(l) && CJ_NAMES[id] && CJ_NAMES[id][l]; return N ? (full && N.length > 1 ? N.join(l === 'zh' ? ' · ' : ' ・ ') : N[0]) : null; };
  const nameOf = (g, l) => cjName(g.id, l) || (typeof g.name === 'object' ? g.name[l] || g.name.es : g.name);
  // the given name (zh / ja: in the notation)
  const givenOf = (g, l) => cjName(g.id, l, false) || nameOf(g, l).split(' ')[0];
  // HTML for a card: zh / ja with their readings (CJK.html), else escaped text
  const cardTxt = (t, l) => (cjL(l) && CJK.hasCJK(String(t)) ? CJK.html(t, { lang: l }) : esc(t));

  if (typeof ICONS !== 'undefined' && ICONS.add) {
    const has = k => ICONS.keys.includes(k), I = (k, fn) => { if (!has(k)) ICONS.add(k, fn); };
    const tablet = c => { c.moveTo(-20, 28); c.lineTo(-20, -8); c.arc(0, -8, 20, Math.PI, 0); c.lineTo(20, 28); c.closePath(); };
    I('grave', (c, p, h) => {
      h.shape(c, p, tablet, '#c4bfb3'); h.shape(c, p, h.rr(-30, 26, 60, 10, 3), '#9d988c');
      if (p) { c.strokeStyle = 'rgba(43,34,53,0.55)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-9, -6); c.lineTo(9, -6); c.moveTo(-11, 4); c.lineTo(11, 4); c.moveTo(-7, 13); c.lineTo(7, 13); c.stroke(); [[-26, 26], [-20, 24], [22, 25]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y - 9); c.lineTo(x + 3, y); c.fillStyle = '#5f9a45'; c.fill(); }); }
    });
    I('cemetery', (c, p, h) => {
      h.shape(c, p, cc => { cc.moveTo(-26, 30); cc.quadraticCurveTo(-34, -6, -22, -36); cc.quadraticCurveTo(-10, -6, -18, 30); cc.closePath(); }, '#3f6b48');
      h.shape(c, p, cc => { cc.moveTo(4, 30); cc.lineTo(4, 0); cc.arc(15, 0, 11, Math.PI, 0); cc.lineTo(26, 30); cc.closePath(); }, '#c4bfb3');
      h.shape(c, p, h.rr(-36, 26, 72, 8, 3), '#7fae4a');
      if (p) { c.strokeStyle = '#3a3640'; c.lineWidth = 2.6; c.beginPath(); for (let x = -12; x <= 36; x += 8) { c.moveTo(x - 2, 26); c.lineTo(x - 2, 12); } c.moveTo(-14, 14); c.lineTo(34, 14); c.stroke(); }
    });
    I('candle', (c, p, h) => {
      h.shape(c, p, h.ell(0, 30, 20, 6), '#c9a24e'); h.shape(c, p, h.rr(-9, -6, 18, 36, 4), '#f6efe0');
      h.shape(c, p, cc => { cc.moveTo(0, -36); cc.bezierCurveTo(11, -22, 8, -10, 0, -10); cc.bezierCurveTo(-8, -10, -11, -22, 0, -36); cc.closePath(); }, '#ffcf3f');
      if (p) { h.dot(c, 0, -17, 3.6, '#ff8a3a'); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(-5, -2, 3, 22); }
    });
    I('crow', (c, p, h) => {
      h.shape(c, p, h.poly([[-30, 14], [-12, 4], [-14, 18]]), '#2f2b38');
      h.shape(c, p, h.ell(0, 8, 22, 15, -0.2), '#3a3546'); h.shape(c, p, h.ell(16, -10, 12, 11), '#3a3546');
      h.shape(c, p, h.poly([[25, -12], [38, -7], [25, -4]]), '#e0b04a');
      if (p) { h.dot(c, 18, -12, 3.4, '#fff'); h.dot(c, 19, -12, 1.8, h.INK); c.strokeStyle = '#e0b04a'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-2, 22); c.lineTo(-4, 32); c.moveTo(6, 22); c.lineTo(6, 32); c.stroke(); }
    });
    I('name', (c, p, h) => {
      h.shape(c, p, cc => { cc.moveTo(-32, -16); cc.lineTo(22, -16); cc.lineTo(34, 0); cc.lineTo(22, 16); cc.lineTo(-32, 16); cc.closePath(); }, '#fff2cf');
      if (p) { h.dot(c, 22, 0, 4, '#c9a24e'); c.strokeStyle = 'rgba(43,34,53,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-24, -5); c.lineTo(8, -5); c.moveTo(-24, 6); c.lineTo(0, 6); c.stroke(); c.strokeStyle = '#c9553f'; c.lineWidth = 2; c.beginPath(); c.moveTo(26, 0); c.quadraticCurveTo(36, 22, 18, 34); c.stroke(); }
    });
    I('photo', (c, p, h) => {
      h.shape(c, p, h.rr(-32, -26, 64, 52, 3), '#fdf8ee'); h.shape(c, p, h.rr(-26, -20, 52, 34, 1), '#9fd0e6', 1.6);
      if (p) { c.fillStyle = '#7fbf5a'; c.beginPath(); c.moveTo(-26, 14); c.quadraticCurveTo(-8, -2, 26, 10); c.lineTo(26, 14); c.closePath(); c.fill(); h.dot(c, -6, 0, 4.5, '#f5cda2'); h.dot(c, 8, 1, 4.5, '#f5cda2'); h.dot(c, 16, -12, 4, '#ffe27a'); }
    });
    I('baker', (c, p, h) => {
      h.shape(c, p, cc => { cc.moveTo(-34, 30); cc.bezierCurveTo(-36, 6, 36, 6, 34, 30); cc.closePath(); }, '#d9a35a');
      h.shape(c, p, h.rr(-14, -12, 28, 18, 3), '#ffffff'); h.shape(c, p, h.ell(0, -22, 20, 14), '#ffffff');
      if (p) [-18, -2, 14].forEach(x => { c.beginPath(); c.moveTo(x - 3, 16); c.lineTo(x + 4, 24); c.lineWidth = 2; c.strokeStyle = '#a8673a'; c.stroke(); });
    });
    I('teacher', (c, p, h) => {
      h.shape(c, p, h.rr(-34, -26, 68, 46, 4), '#8a5f3e'); h.shape(c, p, h.rr(-29, -21, 58, 36, 2), '#3f6b4f', 1.6);
      if (p) { c.fillStyle = '#f4f1e6'; c.font = '900 17px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('A B C', 0, -3); c.fillRect(14, 24, 10, 4); }
    });
    I('seamstress', (c, p, h) => {
      h.shape(c, p, h.rr(-24, -24, 30, 8, 2), '#c99a68'); h.shape(c, p, h.rr(-24, 18, 30, 8, 2), '#c99a68'); h.shape(c, p, h.rr(-20, -16, 22, 34, 3), '#e2453a');
      if (p) { c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.4; for (let y = -12; y < 16; y += 5) { c.beginPath(); c.moveTo(-20, y); c.lineTo(2, y + 2); c.stroke(); } c.strokeStyle = '#8f8a99'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(14, 30); c.lineTo(32, -28); c.stroke(); c.strokeStyle = '#e2453a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(2, 0); c.quadraticCurveTo(20, 10, 30, -22); c.stroke(); }
    });
    I('postman', (c, p, h) => {
      h.shape(c, p, h.rr(-30, -10, 52, 40, 6), '#8a5f3e'); h.shape(c, p, h.rr(-30, -10, 52, 14, 4), '#6f4a30');
      h.shape(c, p, h.rr(-6, -34, 40, 28, 3), '#fffaf0');
      if (p) { c.beginPath(); c.moveTo(-6, -34); c.lineTo(14, -20); c.lineTo(34, -34); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke(); h.dot(c, 14, -20, 4, '#e05a4b'); }
    });
    I('gardener', (c, p, h) => {
      h.shape(c, p, h.rr(-30, -6, 40, 34, 6), '#4f8fc0'); h.shape(c, p, h.poly([[8, 2], [34, -14], [36, -8], [10, 12]]), '#4f8fc0');
      h.shape(c, p, cc => { cc.arc(-10, -6, 16, Math.PI, 0); }, null);
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; h.shape(c, p, h.ell(-26 + Math.cos(a) * 7, -26 + Math.sin(a) * 7, 6, 6), '#ff8fb1'); }
      if (p) h.dot(c, -26, -26, 4, '#ffd84a');
    });
    I('musician', (c, p, h) => {
      h.shape(c, p, h.ell(-16, 22, 11, 8, -0.4), '#7a4fa0'); h.shape(c, p, h.ell(18, 14, 11, 8, -0.4), '#7a4fa0');
      h.shape(c, p, h.poly([[-7, 20], [-7, -26], [27, -34], [27, 12], [23, 12], [23, -24], [-3, -18], [-3, 20]]), '#7a4fa0');
    });
    I('pocketWatch', (c, p, h) => {
      if (p) { c.strokeStyle = '#c9a24e'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -30); c.bezierCurveTo(16, -48, 34, -34, 28, -18); c.stroke(); }
      h.shape(c, p, h.rr(-5, -34, 10, 8, 2), '#e6b84a'); h.shape(c, p, h.ell(0, 2, 28, 28), '#f2c94c'); h.shape(c, p, h.ell(0, 2, 21, 21), '#fdf8ee', 1.6);
      if (p) {
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; h.dot(c, Math.cos(a) * 24.5, 2 + Math.sin(a) * 24.5, 2.6, '#c98a2e'); }
        c.strokeStyle = h.INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 2); c.lineTo(0, -14); c.moveTo(0, 2); c.lineTo(-10, 8); c.stroke(); h.dot(c, 0, 2, 2.4, h.INK);
      }
    });
  }

  // Everything people say here, in lines.js's format: es / pt / de [simpler, richer] (picked by LEX.tier()), and the English for
  // the weave. *Starred* words survive when Baltasar's words are still hushed. Nobody assumes the player's gender.
  const LT = {
    // Baltasar, the gravekeeper (half hushed: his words come back as the names do)
    'cem.bal.hello': {
      es: ['*Visitas*… Ya *nadie* viene por aquí.', '*Visitas*… Hace mucho que *nadie* viene por aquí. Soy *Baltasar*. Yo cuido las {w.grave:pl}.'],
      pt: ['*Visitas*… *Ninguém* vem mais aqui.', '*Visitas*… Faz tempo que *ninguém* vem aqui. Eu sou o *Baltasar*. Eu cuido dos {w.grave:pl}.'],
      de: ['*Besuch* … Hier kommt *niemand* mehr hin.', '*Besuch* … Hier kommt schon lange *niemand* mehr hin. Ich bin *Baltasar*. Ich passe auf die {w.grave:pl} auf.'],
      en: ['*Visitors*… *Nobody* comes here anymore.', '*Visitors*… It’s been a long time since *anyone* came. I’m *Baltasar*. I look after the {w.grave:pl}.'] },
    'cem.bal.names': {
      es: ['Lo *gris* borró los *nombres*. Nadie los *dice* ya.', 'Lo *gris* borró los *nombres* de seis {w.grave:pl}. Nadie *dice* sus nombres ya… y el Silencio se los *lleva*.'],
      pt: ['O *cinza* apagou os *nomes*. Ninguém mais *fala* eles.', 'O *cinza* apagou os *nomes* de seis {w.grave:pl}. Ninguém mais *fala* esses nomes… e o Silêncio *leva* embora.'],
      de: ['Das *Grau* hat die *Namen* gelöscht. Keiner *sagt* sie mehr.', 'Das *Grau* hat die *Namen* von sechs {w.grave:pl} gelöscht. Keiner *sagt* sie mehr … und die Stille *nimmt* sie mit.'],
      en: ['The *gray* wiped out the *names*. Nobody *says* them anymore.', 'The *gray* wiped the *names* off six {w.grave:pl}. Nobody *says* them anymore… so the Hush *takes* them.'] },
    'cem.bal.help': {
      es: ['¿Me *ayudas*? Mi *libro* tiene pistas.', '¿Me *ayudas* a devolverles sus *nombres*? Mi *libro*, junto a la cabaña, tiene pistas.'],
      pt: ['Você me *ajuda*? O meu *livro* tem pistas.', 'Você me *ajuda* a devolver os *nomes* deles? O meu *livro*, do lado da cabana, tem pistas.'],
      de: ['Hilfst du *mir*? Mein *Buch* hat Hinweise.', 'Hilfst du *mir*, ihnen die *Namen* zurückzugeben? Mein *Buch* bei der Hütte hat Hinweise.'],
      en: ['Will you *help* me? My *book* has clues.', 'Will you *help* me give them their *names* back? My *book*, by the hut, has clues.'] },
    'cem.bal.wait': { es: ['Lee mi *libro*, junto a la *cabaña*.'], pt: ['Lê o meu *livro*, do lado da *cabana*.'], de: ['Lies mein *Buch* bei der *Hütte*.'], en: ['Read my *book*, by the *hut*.'] },
    'cem.bal.some': {
      es: ['*Gracias*. Cada *nombre* que vuelve… me devuelve una *palabra*.'], pt: ['*Obrigado*. Cada *nome* que volta… me devolve uma *palavra*.'],
      de: ['*Danke*. Jeder *Name*, der zurückkommt … gibt mir ein *Wort* zurück.'], en: ['*{c.thanks}*. Every *{w.name}* that comes back… gives me back a *word*.'] },
    'cem.bal.ines': {
      es: ['¡Ahora me acuerdo! La jardinera era *Inés*. Inés Duarte.', '¡Ahora me acuerdo! La jardinera era *Inés*, Inés Duarte. Ella plantó estos cipreses… y me enseñó a cuidarlos.'],
      pt: ['Agora eu lembro! A jardineira era a *Inês*. Inês Duarte.', 'Agora eu lembro! A jardineira era a *Inês*, Inês Duarte. Ela plantou estes ciprestes… e me ensinou a cuidar deles.'],
      de: ['Jetzt weiß ich es wieder! Die Gärtnerin war *Inés*. Inés Duarte.', 'Jetzt weiß ich es wieder! Die Gärtnerin war *Inés*, Inés Duarte. Sie hat diese Zypressen gepflanzt … und mir gezeigt, wie man sie pflegt.'],
      en: ['Now I remember! The {w.gardener:f} was *Inés*. Inés Duarte.', 'Now I remember! The {w.gardener:f} was *Inés*, Inés Duarte. She planted these cypresses… and taught me to look after them.'] },
    'cem.bal.done': {
      es: ['¡Todos tienen su nombre otra vez! Escucha… ¿los oyes cantar?', '¡Todos tienen su nombre otra vez! Escucha… ¿los oyes? Cantan junto al mausoleo, como antes.'],
      pt: ['Todos têm o nome de novo! Escuta… você ouve eles cantando?', 'Todos têm o nome de novo! Escuta… está ouvindo? Eles cantam perto do mausoléu, como antes.'],
      de: ['Alle haben wieder ihren Namen! Hör mal … hörst du sie singen?', 'Alle haben wieder ihren Namen! Hör mal … hörst du das? Sie singen beim Mausoleum, wie früher.'],
      en: ['They all have their {w.name:pl} again! Listen… can you hear them singing?', 'They all have their {w.name:pl} again! Listen… can you hear it? They’re singing by the mausoleum, like they used to.'] },
    'cem.bal.thanks': {
      es: ['Gracias. Digan sus nombres de vez en cuando.', 'Gracias. Digan sus nombres de vez en cuando… así el Silencio nunca se los lleva.'],
      pt: ['Obrigado. Falem os nomes deles de vez em quando.', 'Obrigado. Falem os nomes deles de vez em quando… assim o Silêncio nunca leva embora.'],
      de: ['Danke. Sagt ihre Namen ab und zu.', 'Danke. Sagt ihre Namen ab und zu … dann nimmt die Stille sie nie mehr mit.'],
      en: ['{c.thanks}. Say their {w.name:pl} now and then.', '{c.thanks}. Say their {w.name:pl} now and then… so the Hush never takes them again.'] },
    // Doña Tina, on her porch: the last neighbor in the Old Quarter
    'cem.tina.hello': {
      es: ['¡Hola! Ya casi nadie vive aquí.', '¡Hola! Ya casi nadie vive en este barrio. Antes había música en cada casa.'],
      pt: ['Oi! Quase ninguém mora mais aqui.', 'Oi! Quase ninguém mora mais neste bairro. Antes tinha música em cada casa.'],
      de: ['Hallo! Hier wohnt fast keiner mehr.', 'Hallo! In diesem Viertel wohnt fast keiner mehr. Früher gab es Musik in jedem Haus.'],
      en: ['{w.hello}! Hardly anyone lives here now.', '{w.hello}! Hardly anyone lives in this quarter anymore. There used to be music in every {w.house}.'] },
    'cem.tina.ask': {
      es: ['¿La panadera? ¡Elena! Elena Prado.', '¿La panadera? ¡Elena! Elena Prado. Cantaba cuando hacía el {w.bread}.'],
      pt: ['A padeira? A Elena! Elena Prado.', 'A padeira? A Elena! Elena Prado. Ela cantava quando fazia o {w.bread}.'],
      de: ['Die Bäckerin? Elena! Elena Prado.', 'Die Bäckerin? Elena! Elena Prado. Sie hat beim Brotbacken immer gesungen.'],
      en: ['The {w.baker:f}? Elena! Elena Prado.', 'The {w.baker:f}? Elena! Elena Prado. She used to sing while she made the {w.bread}.'] },
    'cem.tina.after': {
      es: ['¡Gracias por ir al cementerio! Hoy llevo flores.'], pt: ['Obrigada por ir ao cemitério! Hoje eu levo flores.'],
      de: ['Danke, dass du auf dem Friedhof warst! Heute bringe ich Blumen hin.'], en: ['{c.thanks:f} for going to the {w.cemetery}! Today I’m taking {w.flower:pl} there.'] },
    // Lía, by the broken swing
    'cem.lia.hello': {
      es: ['El columpio está roto. ¡Qué pena!', 'El columpio está roto… solo tiene una cuerda. Mi abuela jugaba aquí de niña.'],
      pt: ['O balanço está quebrado. Que pena!', 'O balanço está quebrado… só tem uma corda. A minha avó brincava aqui quando era criança.'],
      de: ['Die Schaukel ist kaputt. Schade!', 'Die Schaukel ist kaputt … sie hat nur noch ein Seil. Meine Oma hat hier als Kind gespielt.'],
      en: ['The swing is broken. What a shame!', 'The swing is broken… it only has one rope left. My grandma played here when she was little.'] },
    'cem.lia.ask': {
      es: ['¿El cartero? ¡Mira! Tengo una postal: «Mateo, el cartero».'], pt: ['O carteiro? Olha! Eu tenho um cartão-postal: «Mateo, o carteiro».'],
      de: ['Der Briefträger? Schau! Ich habe eine Postkarte: „Mateo, der Briefträger“.'], en: ['The {w.postman}? {c.look}! I have a postcard: “Mateo, the {w.postman}.”'] },
    // asking someone who doesn't know, or who didn't understand the question
    'cem.ask.other': { es: ['Mmm, no sé. Pregunta a otra persona.'], pt: ['Hmm, não sei. Pergunta para outra pessoa.'], de: ['Hm, das weiß ich nicht. Frag jemand anderen.'], en: ['Hmm, I don’t know. Ask someone else.'] },
    'cem.ask.huh': { es: ['¿Cómo? No entiendo.'], pt: ['Como? Não entendi.'], de: ['Wie bitte? Das verstehe ich nicht.'], en: ['Sorry? I don’t understand.'] },
    'cem.crow': { es: ['¡Cra! ¡Cra!'], pt: ['Cró! Cró!'], de: ['Krah! Krah!'], en: ['Caw! Caw!'] },
    // the memories, when their names come back
    'cem.w.elena': {
      es: ['¡Mi nombre! Gracias. Yo hacía el {w.bread} del pueblo.', '¡Mi nombre otra vez! Gracias. Yo hacía el {w.bread} de todo el pueblo… y le cantaba a la masa. ¡Así crecía más!'],
      pt: ['Meu nome! Obrigada. Eu fazia o {w.bread} da vila.', 'Meu nome de novo! Obrigada. Eu fazia o {w.bread} da vila toda… e cantava para a massa. Assim ela crescia mais!'],
      de: ['Mein Name! Danke. Ich habe das {w.bread} für das Dorf gebacken.', 'Mein Name, endlich! Danke. Ich habe das {w.bread} für das ganze Dorf gebacken … und dem Teig etwas vorgesungen. Dann ging er besser auf!'],
      en: ['My name! {c.thanks:f}. I baked the {c.village}’s {w.bread}.', 'My name again! {c.thanks:f}. I baked the {w.bread} for the whole {c.village}… and I sang to the dough. It rose higher that way!'] },
    'cem.w.julian': {
      es: ['¡Gracias! Yo enseñaba a leer y a escribir.', '¡Gracias! Yo enseñaba a leer y a escribir. Mis cartas favoritas eran las que tenían errores… ¡porque eran valientes!'],
      pt: ['Obrigado! Eu ensinava a ler e a escrever.', 'Obrigado! Eu ensinava a ler e a escrever. As minhas cartas favoritas eram as que tinham erros… porque eram corajosas!'],
      de: ['Danke! Ich habe Lesen und Schreiben unterrichtet.', 'Danke! Ich habe Lesen und Schreiben unterrichtet. Meine Lieblingsbriefe waren die mit Fehlern … weil sie mutig waren!'],
      en: ['{c.thanks}! I taught reading and writing.', '{c.thanks}! I taught reading and writing. My favorite {w.letter:pl} were the ones full of mistakes… because they were brave!'] },
    'cem.w.felix': {
      es: ['¡Gracias! Yo tocaba el piano en el teatro.', '¡Gracias! Yo tocaba el piano en el teatro. Una canción mía… ¡y todo el pueblo bailaba!'],
      pt: ['Obrigado! Eu tocava piano no teatro.', 'Obrigado! Eu tocava piano no teatro. Uma música minha… e a vila inteira dançava!'],
      de: ['Danke! Ich habe im Theater Klavier gespielt.', 'Danke! Ich habe im Theater Klavier gespielt. Ein Lied von mir … und das ganze Dorf hat getanzt!'],
      en: ['{c.thanks}! I played the piano at the theater.', '{c.thanks}! I played the piano at the theater. One song from me… and the whole {c.village} danced!'] },
    'cem.w.clara': {
      es: ['¡Ay, gracias! Yo cosía la ropa del coro.', '¡Ay, gracias! Yo cosía las túnicas rojas del coro. Siempre un poco grandes… ¡para crecer cantando!'],
      pt: ['Ai, obrigada! Eu costurava as roupas do coral.', 'Ai, obrigada! Eu costurava as túnicas vermelhas do coral. Sempre um pouco grandes… para crescer cantando!'],
      de: ['Oh, danke! Ich habe die Kleider für den Chor genäht.', 'Oh, danke! Ich habe die roten Gewänder für den Chor genäht. Immer ein bisschen zu groß … zum Hineinwachsen beim Singen!'],
      en: ['Oh, {c.thanks:f}! I sewed the choir’s clothes.', 'Oh, {c.thanks:f}! I sewed the choir’s red robes. Always a little too big… so they could grow into them, singing!'] },
    'cem.w.mateo': {
      es: ['¡Gracias! Yo llevaba las cartas del valle.', '¡Gracias! Yo llevaba todas las cartas del valle. Conocía cada puerta… ¡y cada perro!'],
      pt: ['Obrigado! Eu levava as cartas do vale.', 'Obrigado! Eu levava todas as cartas do vale. Eu conhecia cada porta… e cada cachorro!'],
      de: ['Danke! Ich habe die Briefe im Tal gebracht.', 'Danke! Ich habe alle Briefe im Tal gebracht. Ich kannte jede Tür … und jeden Hund!'],
      en: ['{c.thanks}! I carried the valley’s letters.', '{c.thanks}! I carried every {w.letter} in the valley. I knew every {w.door}… and every dog!'] },
    'cem.w.ines': {
      es: ['¡Gracias! Yo planté estos cipreses.', '¡Gracias! Yo planté estos cipreses cuando eran así de pequeños. ¡Míralos ahora! Y Baltasar… ¡qué grande está!'],
      pt: ['Obrigada! Eu plantei estes ciprestes.', 'Obrigada! Eu plantei estes ciprestes quando eram pequenininhos. Olha eles agora! E o Baltasar… como ele cresceu!'],
      de: ['Danke! Ich habe diese Zypressen gepflanzt.', 'Danke! Ich habe diese Zypressen gepflanzt, als sie noch so klein waren. Schau sie dir jetzt an! Und Baltasar … wie groß er geworden ist!'],
      en: ['{c.thanks:f}! I planted these cypresses.', '{c.thanks:f}! I planted these cypresses when they were this small. Look at them now! And Baltasar… how he’s grown!'] },
    'cem.w.aurora': {
      es: ['Cantaron con nosotros. Gracias.', 'Ustedes cantaron con nosotros… como en los viejos tiempos. Tomen mi reloj. Un día van a necesitar llegar a tiempo.'],
      pt: ['Vocês cantaram com a gente. Obrigada.', 'Vocês cantaram com a gente… como nos velhos tempos. Peguem o meu relógio. Um dia vocês vão precisar chegar na hora certa.'],
      de: ['Ihr habt mit uns gesungen. Danke.', 'Ihr habt mit uns gesungen … wie in alten Zeiten. Nehmt meine Uhr. Eines Tages müsst ihr pünktlich sein.'],
      en: ['You sang with us. {c.thanks:f}.', 'You sang with us… just like the old days. Take my watch. One day you’ll need to be right on time.'] },
    'cem.w.aurora.after': { es: ['El reloj se paró a las ocho. Como todo lo demás.'], pt: ['O relógio parou às oito. Como todo o resto.'], de: ['Die Uhr ist um acht stehen geblieben. Wie alles andere.'], en: ['The watch stopped at eight. Like everything else.'] },
    // the past: everyone alive (present tense, A1–A2)
    'cem.p.elena': { es: ['¡Buenos días! ¿Quieres {w.bread}? ¡Está calentito!'], pt: ['Bom dia! Quer {w.bread}? Está quentinho!'], de: ['Guten Morgen! Möchtest du {w.bread}? Es ist noch warm!'], en: ['Good morning! Would you like some {w.bread}? It’s still warm!'] },
    'cem.p.julian': { es: ['¡Hola! Hoy los niños escriben cartas. ¡Con errores, y está bien!'], pt: ['Oi! Hoje as crianças escrevem cartas. Com erros, e tudo bem!'], de: ['Hallo! Heute schreiben die Kinder Briefe. Mit Fehlern, und das ist gut so!'], en: ['{w.hello}! Today the kids are writing {w.letter:pl}. With mistakes, and that’s fine!'] },
    'cem.p.felix': { es: ['¡La, la, la! Esta noche toco el piano. ¿Vienes al concierto?'], pt: ['Lá, lá, lá! Hoje à noite eu toco piano. Você vem pro concerto?'], de: ['La, la, la! Heute Abend spiele ich Klavier. Kommst du zum Konzert?'], en: ['La, la, la! Tonight I play the piano. Are you coming to the concert?'] },
    'cem.p.clara': { es: ['Coso las túnicas del coro. ¿Te gusta el rojo?'], pt: ['Estou costurando as túnicas do coral. Você gosta de vermelho?'], de: ['Ich nähe die Gewänder für den Chor. Magst du Rot?'], en: ['I’m sewing the choir’s robes. Do you like red?'] },
    'cem.p.mateo': { es: ['¡Correo! ¿Tienes una {w.letter} para mí?'], pt: ['Correio! Você tem uma {w.letter} pra mim?'], de: ['Post! Hast du einen {w.letter} für mich?'], en: ['Mail! Do you have a {w.letter} for me?'] },
    'cem.p.ines': { es: ['Mira mis flores. Hoy planto cipreses en el cementerio.'], pt: ['Olha as minhas flores. Hoje eu planto ciprestes no cemitério.'], de: ['Schau meine Blumen an. Heute pflanze ich Zypressen auf dem Friedhof.'], en: ['Look at my {w.flower:pl}. Today I’m planting cypresses at the {w.cemetery}.'] },
    'cem.p.aurora': { es: ['¡Bienvenidos al teatro! Esta noche canta todo el pueblo.'], pt: ['Bem-vindos ao teatro! Hoje à noite a vila inteira canta.'], de: ['Willkommen im Theater! Heute Abend singt das ganze Dorf.'], en: ['Welcome to the theater! Tonight the whole {c.village} sings.'] },
    'cem.p.pilar': { es: ['¡Din, don! Cuando suena la campana, empieza la música.'], pt: ['Dim, dom! Quando o sino toca, a música começa.'], de: ['Bim, bam! Wenn die Glocke läutet, fängt die Musik an.'], en: ['Ding, dong! When the bell rings, the music starts.'] },
    'cem.p.baltasar': { es: ['Soy Baltasar. ¡Inés me enseña a cuidar las plantas!'], pt: ['Eu sou o Baltasar. A Inês me ensina a cuidar das plantas!'], de: ['Ich bin Baltasar. Inés zeigt mir, wie man Pflanzen pflegt!'], en: ['I’m Baltasar. Inés is teaching me to look after the plants!'] },
    'cem.p.tina': { es: ['¡Hoy canto en el coro! Estoy un poco nerviosa.'], pt: ['Hoje eu canto no coral! Estou um pouco nervosa.'], de: ['Heute singe ich im Chor! Ich bin ein bisschen nervös.'], en: ['Today I sing in the choir! I’m a little nervous.'] },
  };
  if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v;
  // your own lines (STORY.you, English with the words woven in) and passing thoughts
  const YOU = {
    names: 'The {w.name:pl}… on the {w.grave:pl}? If nobody says them, the Hush takes them?',
    yes: 'We’ll find them, Baltasar. {mimo} and I are good at finding things!',
    ledger: 'Six {w.grave:pl} with no {w.name}. The book says what they did… now we need who they were.',
    song: 'They’re humming… an old song. But the last word is missing.',
    watch: 'Aurora’s pocket watch… stopped at eight o’clock. Just like the clock at the station.',
  };
  const THINK = {
    quarter: 'Out past the gate the houses are falling apart… boarded windows, sagging roofs. Is Alba getting smaller?',
    hall: 'This place… it feels important, somehow. {mimo} feels it too.',
    hallDoor: 'Locked, and chained. Above the door there’s a carving: a clock, with eight little bells around it.',
    hallDoorCiro: 'Locked, and chained. Above the door there’s a carving: a clock with eight little bells around it… like the eight bells Ciro told us about!',
    peek: 'A dusty stage… one music stand in a beam of light, and a little red cap left behind, as if someone ran off in the middle of a song.',
    gate: 'The old road north… chained shut. Past the bars everything is gray. The way is closed, for now.',
    cemetery: 'So quiet… {w.candle:pl} burning, a {w.crow} watching. And the {w.name:pl} on some of the {w.grave:pl} are gray and empty.',
    faded: 'The {w.name} on this {w.grave} has faded. Only the carving is left: {what}.',
    noBook: 'The {w.name} on this {w.grave} has faded. Baltasar, the gravekeeper, might know why.',
    ancient: 'An old, old stone. Moss has covered whatever it said.',
    crow: 'A {w.crow}… with an old {w.photo} in its beak!',
    crowNo: 'The {w.crow} tilts its head and keeps the {w.photo}. Maybe ask more nicely?',
    crowEn: 'The {w.crow} just stares. It wants it in the language… and nicely.',
    crowDone: 'The {w.crow} hops along the stone, very pleased with itself.',
    swing: 'A swing hanging from one rope. The other one snapped long ago.',
    well: 'An old well. Dry, and full of leaves.',
    mausClosed: 'A small stone mausoleum. The iron door won’t move… and it says «Aurora Campos».',
    mausOpen: 'Aurora’s mausoleum. It’s peaceful in there now.',
    bench: 'A bench under the cypresses. A nice place to sit and say names out loud.',
    hut: 'Baltasar’s hut. A shovel, a watering can… and a kettle that’s gone cold.',
  };
  // the words on signs, per language (the language can change when another save loads, so they're drawn when it does)
  const SIGNW = {
    cem: { es: 'CEMENTERIO', pt: 'CEMITÉRIO', de: 'FRIEDHOF' }, closed: { es: 'CERRADO', pt: 'FECHADO', de: 'GESPERRT' },
    north: { es: 'CAMINO DEL NORTE', pt: 'ESTRADA DO NORTE', de: 'NORDWEG' }, sale: { es: 'SE VENDE', pt: 'VENDE-SE', de: 'ZU VERKAUFEN' },
    post: { es: 'CORREO', pt: 'CORREIO', de: 'POST' }, hall: { es: 'TEATRO DE ALBA', pt: 'TEATRO DE ALBA', de: 'THEATER ALBA' },
    bakery: { es: 'PANADERÍA', pt: 'PADARIA', de: 'BÄCKEREI' }, concert: { es: '¡CONCIERTO HOY!', pt: 'CONCERTO HOJE!', de: 'HEUTE KONZERT!' },
    ledger: { es: 'Libro del cementerio', pt: 'Livro do cemitério', de: 'Friedhofsbuch' },
  };
  // the same words written normally, and in English, for the Read cards (signs.js); and the theater's letters the Hush is eating
  const SIGN_NAT = {
    cem: { es: 'Cementerio', pt: 'Cemitério', de: 'Friedhof', en: 'cemetery' }, closed: { es: 'Cerrado', pt: 'Fechado', de: 'Gesperrt', en: 'closed' },
    north: { es: 'Camino del norte', pt: 'Estrada do norte', de: 'Nordweg', en: 'the north road' }, sale: { es: 'Se vende', pt: 'Vende-se', de: 'Zu verkaufen', en: 'for sale' },
    post: { es: 'Correo', pt: 'Correio', de: 'Post', en: 'post office' }, hall: { es: 'Teatro de Alba', pt: 'Teatro de Alba', de: 'Theater Alba', en: 'Alba Theater' },
    bakery: { es: 'Panadería', pt: 'Padaria', de: 'Bäckerei', en: 'bakery' }, concert: { es: '¡Concierto hoy!', pt: 'Concerto hoje!', de: 'Heute Konzert!', en: 'concert today!' },
  };
  const hallHush = name => [1, 5, 8, 11].filter(i => name[i] && name[i] !== ' ');
  const POSTER = {
    es: ['CONCIERTO DE PRIMAVERA', 'Coro de Alba', 'Dirige: Aurora Campos', 'Al piano: Félix Bravo', 'Sábado, a las ocho'],
    pt: ['CONCERTO DE PRIMAVERA', 'Coral de Alba', 'Regente: Aurora Campos', 'Ao piano: Félix Bravo', 'Sábado, às oito'],
    de: ['FRÜHLINGSKONZERT', 'Chor von Alba', 'Leitung: Aurora Campos', 'Am Klavier: Félix Bravo', 'Samstag, um acht'],
    en: ['SPRING CONCERT', 'The Alba Choir', 'Conductor: Aurora Campos', 'At the piano: Félix Bravo', 'Saturday, at eight'],
  };
  const LEDGER = {
    elena: { es: '— la panadera. Doña Tina la conocía.', pt: '— a padeira. A Dona Tina conhecia ela.', de: '— die Bäckerin. Oma Tina kannte sie.', en: '— the baker. Old Tina knew her.' },
    julian: { es: '— el maestro. Hay una foto de su clase en la casa caída.', pt: '— o professor. Tem uma foto da turma dele na casa caída.', de: '— der Lehrer. Im eingestürzten Haus gibt es ein Foto von seiner Klasse.', en: '— the teacher. There’s a photo of his class in the fallen-down house.' },
    felix: { es: '— el músico. Tocaba el piano en el teatro.', pt: '— o músico. Tocava piano no teatro.', de: '— der Musiker. Er hat im Theater Klavier gespielt.', en: '— the musician. He played the piano at the theater.' },
    clara: { es: '— la costurera. Un cuervo se llevó su foto.', pt: '— a costureira. Um corvo levou a foto dela.', de: '— die Schneiderin. Eine Krähe hat ihr Foto geklaut.', en: '— the seamstress. A crow ran off with her photo.' },
    mateo: { es: '— el cartero. La niña del columpio tiene una postal de él.', pt: '— o carteiro. A menina do balanço tem um cartão-postal dele.', de: '— der Briefträger. Das Mädchen an der Schaukel hat eine Postkarte von ihm.', en: '— the postman. The girl by the swing has a postcard from him.' },
    ines: { es: '— la jardinera. Plantó estos cipreses. Yo lo sé… pero la palabra no viene.', pt: '— a jardineira. Plantou estes ciprestes. Eu sei… mas a palavra não vem.', de: '— die Gärtnerin. Sie hat diese Zypressen gepflanzt. Ich weiß es … aber das Wort kommt nicht.', en: '— the gardener. She planted these cypresses. I know her… but the word won’t come.' },
    maus: { es: 'El mausoleo: Aurora Campos, la directora del coro. Solo se abre con todos sus amigos.', pt: 'O mausoléu: Aurora Campos, a regente do coral. Só abre com todos os amigos dela.', de: 'Das Mausoleum: Aurora Campos, die Chorleiterin. Es geht nur mit all ihren Freunden auf.', en: 'The mausoleum: Aurora Campos, the choir director. It only opens when all her friends are with her.' },
  };
  const PHOTO_TXT = {
    julian: { es: 'La clase del maestro Julián Mora', pt: 'A turma do professor Julián Mora', de: 'Die Klasse von Lehrer Julián Mora', en: 'Teacher Julián Mora’s class' },
    clara: { es: 'Clara Soler, costurera. Las túnicas del coro, con cariño.', pt: 'Clara Soler, costureira. As túnicas do coral, com carinho.', de: 'Clara Soler, Schneiderin. Die Gewänder für den Chor, mit Liebe.', en: 'Clara Soler, seamstress. The choir’s robes, with love.' },
    mateo: { es: '¡Hola, Alba! Te traigo cartas de todo el valle. — Mateo, el cartero', pt: 'Oi, Alba! Eu trago cartas do vale todo. — Mateo, o carteiro', de: 'Hallo, Alba! Ich bringe dir Briefe aus dem ganzen Tal. — Mateo, der Briefträger', en: 'Hello, Alba! I bring you letters from all over the valley. — Mateo, the postman' },
  };
  const SONG = {
    es: ['Canta el pan y canta el sol,', 'canta el río, canta la flor.', 'Si una voz se quiere callar,', '¡todo el pueblo va a ▬▬▬▬▬▬!'],
    pt: ['Canta o pão e canta o sol,', 'canta o rio, canta a flor.', 'Se uma voz se calar,', 'a vila toda vai ▬▬▬▬▬▬!'],
    de: ['Es singt das Brot, es singt der Wind,', 'es singt der Fluss, es singt das Kind.', 'Und will die Stimme still sein, nein:', 'Dann ▬▬▬▬▬▬ wir alle, groß und klein!'],
    en: { es: ['The bread sings and the sun sings,', 'the river sings, the flower sings.', 'If a voice wants to go quiet,', 'the whole village is going to… ▬▬▬!'],
      pt: ['The bread sings and the sun sings,', 'the river sings, the flower sings.', 'If a voice goes quiet,', 'the whole village is going to… ▬▬▬!'],
      de: ['The bread sings, the wind sings,', 'the river sings, the child sings.', 'And if the voice wants to go quiet, no:', 'then we all… ▬▬▬, big and small!'] },
    answer: { es: 'cantar', pt: 'cantar', de: 'singen' },
  };
  // ---------------------------------------------------------------- zh / ja (CJK.md notation): the words, every line, the signs,
  // the ledger, the poster, the photos, the song and the epitaphs. Polite adults in ja (です / ます), casual kids (Lía, young
  // Tina and Baltasar in the past); nobody genders the player. Baltasar's *starred* words survive the Hush, as in es / pt / de.
  const CJ_WORDS = {
    'w.grave': { zh: '[坟墓|fén mù]', ja: '[墓|はか]', alt: { zh: ['[墓|mù]', '[坟|fén]', '[墓碑|mù bēi]'], ja: ['お[墓|はか]', '[墓石|ぼせき]'] } },
    'w.cemetery': { zh: '[墓地|mù dì]', ja: '[墓地|ぼち]', alt: { zh: ['[公墓|gōng mù]'], ja: ['[霊園|れいえん]'] } },
    'w.candle': { zh: '[蜡烛|là zhú]', ja: 'ろうそく', alt: { ja: ['[蝋燭|ろうそく]', 'キャンドル'] } },
    'w.crow': { zh: '[乌鸦|wū yā]', ja: 'カラス', alt: { ja: ['[烏|からす]'] } },
    'w.name': { zh: '[名字|míng zi]', ja: '[名前|なまえ]', alt: { zh: ['[姓名|xìng míng]'] } },
    'w.photo': { zh: '[照片|zhào piàn]', ja: '[写真|しゃしん]', alt: { zh: ['[相片|xiàng piàn]'] } },
    'k.pocketWatch': { zh: '[怀表|huái biǎo]', ja: '[懐中時計|かいちゅうどけい]' },
  };
  Object.values(JOBS).forEach(J => { CJ_WORDS[J.id] = { zh: J.zh[0], ja: J.ja[0] }; });
  if (typeof LEX !== 'undefined') for (const [id, T] of Object.entries(CJ_WORDS)) {
    const it = LEX.item(id); if (!it) continue;
    for (const l of ['zh', 'ja']) {
      if (!it[l]) it[l] = T[l];
      if (T.alt && T.alt[l]) { it.alt = it.alt || {}; it.alt[l] = Array.from(new Set([...(it.alt[l] || []), ...T.alt[l]])); }
      if (it.pl && typeof it.pl === 'object' && !it.pl[l]) it.pl[l] = it[l];
      if (it.f && typeof it.f === 'object' && !it.f[l]) it.f[l] = it[l];
    }
  }
  const CJ_LT = {
    'cem.bal.hello': {
      zh: ['*[客人|kè rén]* … [已经|yǐ jīng] *[没有人|méi yǒu rén]* [来|lái] [这里|zhè lǐ] [了|le] 。', '*[客人|kè rén]* … [好久|hǎo jiǔ] *[没有人|méi yǒu rén]* [来|lái] [这里|zhè lǐ] [了|le] 。 [我|wǒ] [是|shì] *[巴尔塔萨|Bā ěr tǎ sà]* ， [我|wǒ] [照看|zhào kàn] [这里|zhè lǐ] [的|de] {w.grave:pl} 。'],
      ja: ['*お[客|きゃく]さん* … もう *[誰|だれ]も* [来|き]ません 。', '*お[客|きゃく]さん* … もう [長|なが]い こと *[誰|だれ]も* [来|き]て いません 。 わたし は *バルタサール* 、 {w.grave:pl} の [番|ばん] を して います 。'] },
    'cem.bal.names': {
      zh: ['*[灰色|huī sè]* [擦|cā] [掉|diào] [了|le] *[名字|míng zi]* 。 [没有人|méi yǒu rén] [再|zài] *[说|shuō]* [了|le] 。', '*[灰色|huī sè]* [擦|cā] [掉|diào] [了|le] [六|liù] [座|zuò] {w.grave:pl} [上|shang] [的|de] *[名字|míng zi]* 。 [没有人|méi yǒu rén] [再|zài] *[说|shuō]* [它们|tā men] … [寂静|Jì jìng] [就|jiù] [把|bǎ] [它们|tā men] *[带走|dài zǒu]* [了|le] 。'],
      ja: ['*[灰色|はいいろ]* が *[名前|なまえ]* を [消|け]しました 。 もう [誰|だれ]も *[言|い]いません* 。', '*[灰色|はいいろ]* が [六|むっ]つ の {w.grave:pl} の *[名前|なまえ]* を [消|け]しました 。 もう [誰|だれ]も *[言|い]わない* … だから [静寂|せいじゃく] が *[持|も]って いく* んです 。'] },
    'cem.bal.help': {
      zh: ['[你|nǐ] [能|néng] *[帮|bāng]* [我|wǒ] [吗|ma] ？ [我|wǒ] [的|de] *[本子|běn zi]* [里|lǐ] [有|yǒu] [线索|xiàn suǒ] 。', '[你|nǐ] [能|néng] *[帮|bāng]* [我|wǒ] [把|bǎ] *[名字|míng zi]* [还|huán] [给|gěi] [他们|tā men] [吗|ma] ？ [小屋|xiǎo wū] [旁边|páng biān] [我|wǒ] [的|de] *[本子|běn zi]* [里|lǐ] [有|yǒu] [线索|xiàn suǒ] 。'],
      ja: ['*[手伝|てつだ]って* くれます か ？ わたし の *[本|ほん]* に ヒント が あります 。', '[名前|なまえ] を [返|かえ]す の を *[手伝|てつだ]って* くれます か ？ [小屋|こや] の そば の わたし の *[本|ほん]* に ヒント が あります 。'] },
    'cem.bal.wait': { zh: ['[看看|kàn kan] [我|wǒ] [的|de] *[本子|běn zi]* ， [在|zài] *[小屋|xiǎo wū]* [旁边|páng biān] 。'], ja: ['*[小屋|こや]* の そば の *[本|ほん]* を [読|よ]んで ください 。'] },
    'cem.bal.some': {
      zh: ['*[谢谢|xiè xie]* 。 [每|měi] [一个|yī gè] [回来|huí lái] [的|de] *{w.name}* … [都|dōu] [还|huán] [给|gěi] [我|wǒ] [一个|yī gè] *[词|cí]* 。'],
      ja: ['*ありがとう* 。 *{w.name}* が ひとつ [戻|もど]る たび に … わたし に *[言葉|ことば]* が ひとつ [戻|もど]ります 。'] },
    'cem.bal.ines': {
      zh: ['[我|wǒ] [想|xiǎng] [起来|qǐ lái] [了|le] ！ [园丁|yuán dīng] [是|shì] *[伊内斯|Yī nèi sī]* ， [伊内斯|Yī nèi sī] · [杜阿尔特|Dù ā ěr tè] 。', '[我|wǒ] [想|xiǎng] [起来|qǐ lái] [了|le] ！ [园丁|yuán dīng] [是|shì] *[伊内斯|Yī nèi sī]* ， [伊内斯|Yī nèi sī] · [杜阿尔特|Dù ā ěr tè] 。 [这些|zhè xiē] [柏树|bǎi shù] [是|shì] [她|tā] [种|zhòng] [的|de] … [她|tā] [还|hái] [教|jiāo] [我|wǒ] [怎么|zěn me] [照顾|zhào gù] [它们|tā men] 。'],
      ja: ['[思|おも]い[出|だ]しました ！ [庭師|にわし] は *イネス* 、 イネス ・ ドゥアルテ です 。', '[思|おも]い[出|だ]しました ！ [庭師|にわし] は *イネス* 、 イネス ・ ドゥアルテ です 。 この [糸杉|いとすぎ] を [植|う]えた の は [彼女|かのじょ] です … そして わたし に [世話|せわ] の [仕方|しかた] を [教|おし]えて くれました 。'] },
    'cem.bal.done': {
      zh: ['[大家|dà jiā] [又|yòu] [有|yǒu] [名字|míng zi] [了|le] ！ [听|tīng] … [你|nǐ] [听到|tīng dào] [他们|tā men] [唱歌|chàng gē] [了|le] [吗|ma] ？', '[大家|dà jiā] [又|yòu] [有|yǒu] [名字|míng zi] [了|le] ！ [听|tīng] … [听到|tīng dào] [了|le] [吗|ma] ？ [他们|tā men] [在|zài] [陵墓|líng mù] [旁边|páng biān] [唱歌|chàng gē] ， [就|jiù] [像|xiàng] [从前|cóng qián] [一样|yī yàng] 。'],
      ja: ['みんな また [名前|なまえ] が あります ！ [聞|き]いて … [歌|うた]って いる の が [聞|き]こえます か ？', 'みんな また [名前|なまえ] が あります ！ [聞|き]いて … [聞|き]こえます か ？ [霊廟|れいびょう] の そば で 、 [昔|むかし] の よう に [歌|うた]って います 。'] },
    'cem.bal.thanks': {
      zh: ['[谢谢|xiè xie] 。 [时不时|shí bù shí] [说说|shuō shuo] [他们|tā men] [的|de] [名字|míng zi] [吧|ba] 。', '[谢谢|xiè xie] 。 [时不时|shí bù shí] [说说|shuō shuo] [他们|tā men] [的|de] [名字|míng zi] [吧|ba] … [这样|zhè yàng] [寂静|Jì jìng] [就|jiù] [再也|zài yě] [带|dài] [不|bù] [走|zǒu] [他们|tā men] [了|le] 。'],
      ja: ['ありがとう 。 ときどき みんな の [名前|なまえ] を [言|い]って ください 。', 'ありがとう 。 ときどき みんな の [名前|なまえ] を [言|い]って ください … そう すれば 、 [静寂|せいじゃく] は もう [二度|にど] と [連|つ]れて いけません 。'] },
    'cem.tina.hello': {
      zh: ['[你好|nǐ hǎo] ！ [这里|zhè lǐ] [几乎|jī hū] [没有|méi yǒu] [人|rén] [住|zhù] [了|le] 。', '[你好|nǐ hǎo] ！ [这个|zhè ge] [街区|jiē qū] [几乎|jī hū] [没有|méi yǒu] [人|rén] [住|zhù] [了|le] 。 [以前|yǐ qián] [每|měi] [座|zuò] {w.house} [里|lǐ] [都|dōu] [有|yǒu] [音乐|yīn yuè] 。'],
      ja: ['こんにちは ！ ここ に は もう ほとんど [誰|だれ]も [住|す]んで いません 。', 'こんにちは ！ この [辺|あた]り に は もう ほとんど [誰|だれ]も [住|す]んで いません 。 [昔|むかし] は どの {w.house} に も [音楽|おんがく] が ありました 。'] },
    'cem.tina.ask': {
      zh: ['[面包师|miàn bāo shī] ？ [埃莱娜|Āi lái nà] ！ [埃莱娜|Āi lái nà] · [普拉多|Pǔ lā duō] 。', '[面包师|miàn bāo shī] ？ [埃莱娜|Āi lái nà] ！ [埃莱娜|Āi lái nà] · [普拉多|Pǔ lā duō] 。 [她|tā] [做|zuò] {w.bread} [的|de] [时候|shí hou] [总是|zǒng shì] [唱歌|chàng gē] 。'],
      ja: ['パン[屋|や]さん ？ エレナ ！ エレナ ・ プラド です よ 。', 'パン[屋|や]さん ？ エレナ ！ エレナ ・ プラド です よ 。 {w.bread} を [作|つく]る とき 、 いつも [歌|うた]って いました 。'] },
    'cem.tina.after': {
      zh: ['[谢谢|xiè xie] [你|nǐ] [去|qù] [了|le] {w.cemetery} ！ [今天|jīn tiān] [我|wǒ] [带|dài] {w.flower:pl} [去|qù] 。'],
      ja: ['{w.cemetery} に [行|い]って くれて 、 ありがとう ！ [今日|きょう] は {w.flower:pl} を [持|も]って [行|い]きます 。'] },
    'cem.lia.hello': {
      zh: ['[秋千|qiū qiān] [坏|huài] [了|le] 。 [真|zhēn] [可惜|kě xī] ！', '[秋千|qiū qiān] [坏|huài] [了|le] … [只|zhǐ] [剩|shèng] [一|yī] [根|gēn] [绳子|shéng zi] [了|le] 。 [我|wǒ] [奶奶|nǎi nai] [小时候|xiǎo shí hou] [在|zài] [这里|zhè lǐ] [玩|wán] 。'],
      ja: ['ブランコ 、 [壊|こわ]れてる 。 ざんねん ！', 'ブランコ 、 [壊|こわ]れてる … ロープ が [一本|いっぽん] しか ない の 。 おばあちゃん が [子|こ]ども の ころ 、 ここ で [遊|あそ]んで た んだ 。'] },
    'cem.lia.ask': {
      zh: ['[邮递员|yóu dì yuán] ？ [你|nǐ] [看|kàn] ！ [我|wǒ] [有|yǒu] [一|yī] [张|zhāng] [明信片|míng xìn piàn] ： “ [邮递员|yóu dì yuán] [马特奥|Mǎ tè ào] ” 。'],
      ja: ['[郵便屋|ゆうびんや]さん ？ [見|み]て ！ ハガキ が ある よ ： 「 [郵便屋|ゆうびんや] の マテオ 」 。'] },
    'cem.ask.other': { zh: ['[嗯|ng] … [我|wǒ] [不|bù] [知道|zhī dào] 。 [问问|wèn wen] [别人|bié rén] [吧|ba] 。'], ja: ['うーん 、 わかりません 。 [他|ほか] の [人|ひと] に [聞|き]いて ください 。'] },
    'cem.ask.huh': { zh: ['[什么|shén me] ？ [我|wǒ] [没|méi] [听懂|tīng dǒng] 。'], ja: ['え ？ よく わかりません 。'] },
    'cem.crow': { zh: ['[嘎|gā] ！ [嘎|gā] ！'], ja: ['カー ！ カー ！'] },
    'cem.w.elena': {
      zh: ['[我|wǒ] [的|de] [名字|míng zi] ！ [谢谢|xiè xie] 。 [我|wǒ] [以前|yǐ qián] [给|gěi] [村子|cūn zi] [做|zuò] {w.bread} 。', '[我|wǒ] [的|de] [名字|míng zi] [又|yòu] [回来|huí lái] [了|le] ！ [谢谢|xiè xie] 。 [我|wǒ] [以前|yǐ qián] [给|gěi] [全|quán] [村|cūn] [做|zuò] {w.bread} … [还|hái] [对|duì] [着|zhe] [面团|miàn tuán] [唱歌|chàng gē] 。 [这样|zhè yàng] [它|tā] [发|fā] [得|de] [更|gèng] [高|gāo] ！'],
      ja: ['わたし の [名前|なまえ] ！ ありがとう 。 [村|むら] の {w.bread} を [焼|や]いて いました 。', 'わたし の [名前|なまえ] が [戻|もど]った ！ ありがとう 。 [村|むら] じゅう の {w.bread} を [焼|や]いて いました … [生地|きじ] に [歌|うた]って あげる と 、 よく ふくらむ んです よ ！'] },
    'cem.w.julian': {
      zh: ['[谢谢|xiè xie] ！ [我|wǒ] [以前|yǐ qián] [教|jiāo] [孩子们|hái zi men] [读书|dú shū] [写字|xiě zì] 。', '[谢谢|xiè xie] ！ [我|wǒ] [以前|yǐ qián] [教|jiāo] [孩子们|hái zi men] [读书|dú shū] [写字|xiě zì] 。 [我|wǒ] [最|zuì] [喜欢|xǐ huan] [有|yǒu] [错|cuò] [的|de] {w.letter:pl} … [因为|yīn wèi] [它们|tā men] [很|hěn] [勇敢|yǒng gǎn] ！'],
      ja: ['ありがとう ！ [読|よ]み[書|か]き を [教|おし]えて いました 。', 'ありがとう ！ [読|よ]み[書|か]き を [教|おし]えて いました 。 いちばん [好|す]き だった の は 、 まちがい だらけ の {w.letter:pl} です … [勇気|ゆうき] が ある から ！'] },
    'cem.w.felix': {
      zh: ['[谢谢|xiè xie] ！ [我|wǒ] [以前|yǐ qián] [在|zài] [剧院|jù yuàn] [弹|tán] [钢琴|gāng qín] 。', '[谢谢|xiè xie] ！ [我|wǒ] [以前|yǐ qián] [在|zài] [剧院|jù yuàn] [弹|tán] [钢琴|gāng qín] 。 [我|wǒ] [弹|tán] [一|yī] [首|shǒu] [歌|gē] … [全|quán] [村|cūn] [的|de] [人|rén] [都|dōu] [跳|tiào] [起|qǐ] [舞|wǔ] [来|lái] ！'],
      ja: ['ありがとう ！ [劇場|げきじょう] で ピアノ を [弾|ひ]いて いました 。', 'ありがとう ！ [劇場|げきじょう] で ピアノ を [弾|ひ]いて いました 。 わたし が [一曲|いっきょく] [弾|ひ]く と … [村|むら] じゅう が [踊|おど]りだした もの です ！'] },
    'cem.w.clara': {
      zh: ['[哎呀|āi yā] ， [谢谢|xiè xie] ！ [我|wǒ] [以前|yǐ qián] [给|gěi] [合唱团|hé chàng tuán] [做|zuò] [衣服|yī fu] 。', '[哎呀|āi yā] ， [谢谢|xiè xie] ！ [我|wǒ] [以前|yǐ qián] [给|gěi] [合唱团|hé chàng tuán] [缝|féng] [红色|hóng sè] [的|de] [长袍|cháng páo] 。 [总是|zǒng shì] [大|dà] [一点|yī diǎn] … [这样|zhè yàng] [他们|tā men] [可以|kě yǐ] [一边|yī biān] [唱|chàng] [一边|yī biān] [长大|zhǎng dà] ！'],
      ja: ['まあ 、 ありがとう ！ [合唱団|がっしょうだん] の [服|ふく] を [縫|ぬ]って いました 。', 'まあ 、 ありがとう ！ [合唱団|がっしょうだん] の [赤|あか]い ローブ を [縫|ぬ]って いました 。 いつも [少|すこ]し [大|おお]きめ に … [歌|うた]い ながら [大|おお]きく なれる よう に ！'] },
    'cem.w.mateo': {
      zh: ['[谢谢|xiè xie] ！ [我|wǒ] [以前|yǐ qián] [给|gěi] [山谷|shān gǔ] [送|sòng] {w.letter:pl} 。', '[谢谢|xiè xie] ！ [山谷|shān gǔ] [里|lǐ] [所有|suǒ yǒu] [的|de] {w.letter:pl} [都|dōu] [是|shì] [我|wǒ] [送|sòng] [的|de] 。 [我|wǒ] [认识|rèn shi] [每|měi] [一|yī] [扇|shàn] [门|mén] … [还有|hái yǒu] [每|měi] [一|yī] [条|tiáo] [狗|gǒu] ！'],
      ja: ['ありがとう ！ [谷|たに] の {w.letter:pl} を [配|くば]って いました 。', 'ありがとう ！ [谷|たに] じゅう の {w.letter:pl} を [配|くば]って いました 。 どの ドア も [知|し]って いました … どの [犬|いぬ] も ね ！'] },
    'cem.w.ines': {
      zh: ['[谢谢|xiè xie] ！ [这些|zhè xiē] [柏树|bǎi shù] [是|shì] [我|wǒ] [种|zhòng] [的|de] 。', '[谢谢|xiè xie] ！ [这些|zhè xiē] [柏树|bǎi shù] [是|shì] [我|wǒ] [种|zhòng] [的|de] ， [那时|nà shí] [它们|tā men] [只有|zhǐ yǒu] [这么|zhè me] [小|xiǎo] 。 [你|nǐ] [看|kàn] [现在|xiàn zài] ！ [还有|hái yǒu] [巴尔塔萨|Bā ěr tǎ sà] … [长|zhǎng] [这么|zhè me] [大|dà] [了|le] ！'],
      ja: ['ありがとう ！ この [糸杉|いとすぎ] は わたし が [植|う]えました 。', 'ありがとう ！ この [糸杉|いとすぎ] は 、 こんなに [小|ちい]さい とき に わたし が [植|う]えました 。 [今|いま] を [見|み]て ！ それに バルタサール … [大|おお]きく なりました ね ！'] },
    'cem.w.aurora': {
      zh: ['[你们|nǐ men] [和|hé] [我们|wǒ men] [一起|yī qǐ] [唱|chàng] [了|le] 。 [谢谢|xiè xie] 。', '[你们|nǐ men] [和|hé] [我们|wǒ men] [一起|yī qǐ] [唱|chàng] [了|le] … [就|jiù] [像|xiàng] [从前|cóng qián] [一样|yī yàng] 。 [拿|ná] [着|zhe] [我|wǒ] [的|de] [表|biǎo] [吧|ba] 。 [总有一天|zǒng yǒu yī tiān] [你们|nǐ men] [要|yào] [准时|zhǔn shí] [到达|dào dá] 。'],
      ja: ['いっしょ に [歌|うた]って くれました ね 。 ありがとう 。', 'いっしょ に [歌|うた]って くれました ね … [昔|むかし] の よう に 。 わたし の [時計|とけい] を どうぞ 。 いつか 、 [時間|じかん] ぴったり に [着|つ]く [必要|ひつよう] が ある でしょう 。'] },
    'cem.w.aurora.after': { zh: ['[表|biǎo] [停|tíng] [在|zài] [了|le] [八|bā] [点|diǎn] 。 [就|jiù] [像|xiàng] [别的|bié de] [一切|yī qiè] 。'], ja: ['[時計|とけい] は [八時|はちじ] で [止|と]まりました 。 ほか の すべて と [同|おな]じ よう に 。'] },
    'cem.p.elena': { zh: ['[早上好|zǎo shang hǎo] ！ [要|yào] {w.bread} [吗|ma] ？ [还|hái] [热|rè] [着|zhe] [呢|ne] ！'], ja: ['おはよう ございます ！ {w.bread} は いかが です か ？ まだ あたたかい です よ ！'] },
    'cem.p.julian': { zh: ['[你好|nǐ hǎo] ！ [今天|jīn tiān] [孩子们|hái zi men] [写|xiě] {w.letter:pl} 。 [有|yǒu] [错|cuò] [也|yě] [没关系|méi guān xi] ！'], ja: ['こんにちは ！ [今日|きょう] は [子|こ]ども たち が {w.letter:pl} を [書|か]きます 。 まちがえて も だいじょうぶ ！'] },
    'cem.p.felix': { zh: ['[啦|la] ， [啦|la] ， [啦|la] ！ [今晚|jīn wǎn] [我|wǒ] [弹|tán] [钢琴|gāng qín] 。 [你|nǐ] [来|lái] [听|tīng] [音乐会|yīn yuè huì] [吗|ma] ？'], ja: ['ラ 、 ラ 、 ラ ！ [今夜|こんや] は ピアノ を [弾|ひ]きます 。 コンサート に [来|き]ます か ？'] },
    'cem.p.clara': { zh: ['[我|wǒ] [在|zài] [缝|féng] [合唱团|hé chàng tuán] [的|de] [长袍|cháng páo] 。 [你|nǐ] [喜欢|xǐ huan] [红色|hóng sè] [吗|ma] ？'], ja: ['[合唱団|がっしょうだん] の ローブ を [縫|ぬ]って います 。 [赤|あか] は [好|す]き です か ？'] },
    'cem.p.mateo': { zh: ['[邮件|yóu jiàn] ！ [你|nǐ] [有|yǒu] [要|yào] [寄|jì] [的|de] {w.letter} [吗|ma] ？'], ja: ['[郵便|ゆうびん] です ！ [出|だ]す {w.letter} は あります か ？'] },
    'cem.p.ines': { zh: ['[你|nǐ] [看|kàn] [我|wǒ] [的|de] {w.flower:pl} 。 [今天|jīn tiān] [我|wǒ] [在|zài] {w.cemetery} [种|zhòng] [柏树|bǎi shù] 。'], ja: ['わたし の {w.flower:pl} を [見|み]て ください 。 [今日|きょう] は {w.cemetery} に [糸杉|いとすぎ] を [植|う]えます 。'] },
    'cem.p.aurora': { zh: ['[欢迎|huān yíng] [来到|lái dào] [剧院|jù yuàn] ！ [今晚|jīn wǎn] [全|quán] [村|cūn] [一起|yī qǐ] [唱歌|chàng gē] 。'], ja: ['[劇場|げきじょう] へ ようこそ ！ [今夜|こんや] は [村|むら] じゅう で [歌|うた]います 。'] },
    'cem.p.pilar': { zh: ['[叮|dīng] ， [咚|dōng] ！ [钟|zhōng] [一|yī] [响|xiǎng] ， [音乐|yīn yuè] [就|jiù] [开始|kāi shǐ] 。'], ja: ['ディン 、 ドン ！ [鐘|かね] が [鳴|な]る と 、 [音楽|おんがく] が [始|はじ]まります 。'] },
    'cem.p.baltasar': { zh: ['[我|wǒ] [是|shì] [巴尔塔萨|Bā ěr tǎ sà] 。 [伊内斯|Yī nèi sī] [教|jiāo] [我|wǒ] [照顾|zhào gù] [植物|zhí wù] ！'], ja: ['ぼく 、 バルタサール 。 イネス さん が [植物|しょくぶつ] の [世話|せわ] を [教|おし]えて くれる んだ ！'] },
    'cem.p.tina': { zh: ['[今天|jīn tiān] [我|wǒ] [在|zài] [合唱团|hé chàng tuán] [唱歌|chàng gē] ！ [我|wǒ] [有|yǒu] [一点|yī diǎn] [紧张|jǐn zhāng] 。'], ja: ['[今日|きょう] 、 [合唱団|がっしょうだん] で [歌|うた]う の ！ ちょっと ドキドキ する 。'] },
  };
  for (const [k, T] of Object.entries(CJ_LT)) if (LT[k]) Object.assign(LT[k], T);
  // the signs (SIGNW: painted, as plain text in the mode; SIGN_NAT: the Read cards, with their readings)
  const CJ_SIGN = {
    cem: ['[墓地|mù dì]', '[墓地|ぼち]'], closed: ['[禁止|jìn zhǐ] [通行|tōng xíng]', '[通行止|つうこうど]め'], north: ['[北路|běi lù]', '[北|きた] の [道|みち]'],
    sale: ['[出售|chū shòu]', '[売|う]り[家|や]'], post: ['[邮局|yóu jú]', '[郵便局|ゆうびんきょく]'], hall: ['[阿尔巴|Ā ěr bā] [剧院|jù yuàn]', 'アルバ [劇場|げきじょう]'],
    bakery: ['[面包店|miàn bāo diàn]', 'パン[屋|や]'], concert: ['[今天|jīn tiān] [有|yǒu] [音乐会|yīn yuè huì] ！', '[本日|ほんじつ] コンサート ！'],
  };
  for (const [k, [zh, ja]] of Object.entries(CJ_SIGN)) { Object.assign(SIGNW[k], { zh, ja }); Object.assign(SIGN_NAT[k], { zh, ja }); }
  Object.assign(SIGNW.ledger, { zh: '[墓地|mù dì] [名册|míng cè]', ja: '[墓地|ぼち] の [台帳|だいちょう]' });
  SIGNW.alba = { es: 'ALBA', pt: 'ALBA', de: 'ALBA', zh: '[阿尔巴|Ā ěr bā]', ja: 'アルバ' };
  Object.assign(POSTER, {
    zh: ['[春季|chūn jì] [音乐会|yīn yuè huì]', '[阿尔巴|Ā ěr bā] [合唱团|hé chàng tuán]', '[指挥|zhǐ huī] ： [奥罗拉|Ào luó lā] · [坎波斯|Kǎn bō sī]', '[钢琴|gāng qín] ： [费利克斯|Fèi lì kè sī] · [布拉沃|Bù lā wò]', '[星期六|xīng qī liù] ， [八|bā] [点|diǎn]'],
    ja: ['[春|はる] の コンサート', 'アルバ [合唱団|がっしょうだん]', '[指揮|しき] ： オーロラ ・ カンポス', 'ピアノ ： フェリックス ・ ブラボ', '[土曜日|どようび] 、 [八時|はちじ]'],
  });
  const CJ_LEDGER = {
    elena: ['— [面包师|miàn bāo shī] 。 [蒂娜|Dì nà] [奶奶|nǎi nai] [认识|rèn shi] [她|tā] 。', '— パン[屋|や] 。 ティナ さん が [知|し]って いました 。'],
    julian: ['— [老师|lǎo shī] 。 [倒塌|dǎo tā] [的|de] [房子|fáng zi] [里|lǐ] [有|yǒu] [一|yī] [张|zhāng] [他|tā] [班上|bān shang] [的|de] [照片|zhào piàn] 。', '— [先生|せんせい] 。 [崩|くず]れた [家|いえ] に 、 [彼|かれ] の クラス の [写真|しゃしん] が あります 。'],
    felix: ['— [音乐家|yīn yuè jiā] 。 [他|tā] [在|zài] [剧院|jù yuàn] [弹|tán] [钢琴|gāng qín] 。', '— [音楽家|おんがくか] 。 [劇場|げきじょう] で ピアノ を [弾|ひ]いて いました 。'],
    clara: ['— [裁缝|cái feng] 。 [一|yī] [只|zhī] [乌鸦|wū yā] [叼|diāo] [走|zǒu] [了|le] [她|tā] [的|de] [照片|zhào piàn] 。', '— [仕立屋|したてや] 。 カラス が [彼女|かのじょ] の [写真|しゃしん] を [持|も]って いきました 。'],
    mateo: ['— [邮递员|yóu dì yuán] 。 [秋千|qiū qiān] [旁边|páng biān] [的|de] [女孩|nǚ hái] [有|yǒu] [一|yī] [张|zhāng] [他|tā] [的|de] [明信片|míng xìn piàn] 。', '— [郵便屋|ゆうびんや]さん 。 ブランコ の [女|おんな]の[子|こ] が 、 [彼|かれ] の ハガキ を [持|も]って います 。'],
    ines: ['— [园丁|yuán dīng] 。 [这些|zhè xiē] [柏树|bǎi shù] [是|shì] [她|tā] [种|zhòng] [的|de] 。 [我|wǒ] [知道|zhī dào] … [可是|kě shì] [那个|nà ge] [词|cí] [想|xiǎng] [不|bù] [起来|qǐ lái] 。', '— [庭師|にわし] 。 この [糸杉|いとすぎ] を [植|う]えた [人|ひと] 。 [知|し]って いる のに … [言葉|ことば] が [出|で]て きません 。'],
    maus: ['[陵墓|líng mù] ： [奥罗拉|Ào luó lā] · [坎波斯|Kǎn bō sī] ， [合唱团|hé chàng tuán] [指挥|zhǐ huī] 。 [只有|zhǐ yǒu] [她|tā] [所有|suǒ yǒu] [的|de] [朋友|péng you] [都|dōu] [在|zài] ， [门|mén] [才|cái] [会|huì] [开|kāi] 。', '[霊廟|れいびょう] ： オーロラ ・ カンポス 、 [合唱団|がっしょうだん] の [指揮者|しきしゃ] 。 [友|とも]だち が みんな そろった とき だけ 、 [開|ひら]きます 。'],
  };
  for (const [k, [zh, ja]] of Object.entries(CJ_LEDGER)) Object.assign(LEDGER[k], { zh, ja });
  Object.assign(PHOTO_TXT.julian, { zh: '[胡利安|Hú lì ān] · [莫拉|Mò lā] [老师|lǎo shī] [的|de] [班级|bān jí]', ja: 'フリアン ・ モラ [先生|せんせい] の クラス' });
  Object.assign(PHOTO_TXT.clara, { zh: '[克拉拉|Kè lā lā] · [索莱尔|Suǒ lái ěr] ， [裁缝|cái feng] 。 [合唱团|hé chàng tuán] [的|de] [长袍|cháng páo] ， [用心|yòng xīn] [缝制|féng zhì] 。', ja: 'クララ ・ ソレル 、 [仕立屋|したてや] 。 [合唱団|がっしょうだん] の ローブ 、 [心|こころ] を こめて 。' });
  Object.assign(PHOTO_TXT.mateo, { zh: '[你好|nǐ hǎo] ， [阿尔巴|Ā ěr bā] ！ [我|wǒ] [给|gěi] [你|nǐ] [带来|dài lái] [整个|zhěng gè] [山谷|shān gǔ] [的|de] [信|xìn] 。 — [邮递员|yóu dì yuán] [马特奥|Mǎ tè ào]', ja: 'こんにちは 、 アルバ ！ [谷|たに] じゅう の [手紙|てがみ] を [届|とど]けます 。 — [郵便屋|ゆうびんや] の マテオ' });
  Object.assign(SONG, {
    zh: ['[面包|miàn bāo] [在|zài] [唱|chàng] ， [太阳|tài yáng] [在|zài] [唱|chàng] ，', '[小河|xiǎo hé] [在|zài] [唱|chàng] ， [花儿|huā r] [在|zài] [唱|chàng] 。', '[如果|rú guǒ] [有|yǒu] [声音|shēng yīn] [想|xiǎng] [沉默|chén mò] ，', '[全|quán] [村|cūn] [的|de] [人|rén] [都|dōu] [要|yào] ▬ ▬ ！'],
    ja: ['パン が [歌|うた]う 、 [太陽|たいよう] が [歌|うた]う 、', '[川|かわ] が [歌|うた]う 、 [花|はな] が [歌|うた]う 。', 'もし [声|こえ] が [黙|だま]ろう と したら 、', '[村|むら] じゅう で ▬ ▬ ▬ ！'],
  });
  const SONG_EN_CJ = ['The bread sings, the sun sings,', 'the river sings, the flower sings.', 'If a voice wants to go quiet,', 'the whole village will… ▬▬▬!'];
  Object.assign(SONG.en, { zh: SONG_EN_CJ, ja: SONG_EN_CJ });
  Object.assign(SONG.answer, { zh: '[唱|chàng]', ja: '[歌|うた]う' });
  // the epitaphs on the stones you can read
  [['andres', '[苹果树|píng guǒ shù] [的|de] [朋友|péng you]', 'りんご の [木|き] の [友|とも]だち'], ['sofia', '[阿尔巴|Ā ěr bā] [的|de] [医生|yī shēng]', 'アルバ の お[医者|いしゃ]さん'],
    ['gil', '[鞋匠|xié jiang] 。 [双胞胎|shuāng bāo tāi] 。 [朋友|péng you] 。', '[靴屋|くつや] 。 [双子|ふたご] 。 [友|とも]だち 。'], ['lorenzo', '[木匠|mù jiang] ， [好|hǎo] [朋友|péng you]', '[大工|だいく] 、 よき [友|とも]'],
    ['bernardo', '[永远|yǒng yuǎn] [有|yǒu] [一|yī] [碗|wǎn] [热汤|rè tāng]', 'いつも あたたかい スープ を'], ['pilar', '[叮|dīng] ， [咚|dōng] ！', 'ディン 、 ドン ！']]
    .forEach(([id, zh, ja]) => { const g = FG.find(q => q.id === id); if (g) Object.assign(g.ep, { zh, ja }); });
  // (anything still missing in zh / ja: the English, never Spanish, and never a crash: the signs are drawn every frame)
  for (const l of ['zh', 'ja']) {
    for (const [k, T] of Object.entries(SIGNW)) if (T[l] === undefined) T[l] = k === 'ledger' ? 'The cemetery book' : (SIGN_NAT[k] ? SIGN_NAT[k].en : k).toUpperCase();
    for (const T of [...Object.values(SIGN_NAT), ...Object.values(LEDGER), ...Object.values(PHOTO_TXT)]) if (T[l] === undefined) T[l] = T.en;
    if (!POSTER[l]) POSTER[l] = POSTER.en;
    if (!SONG[l]) SONG[l] = SONG.en.es;
    if (!SONG.en[l]) SONG.en[l] = SONG.en.es;
    if (!SONG.answer[l]) SONG.answer[l] = l === 'zh' ? '[唱|chàng]' : '[歌|うた]う';      // (the song's missing verb: sing)
  }
  const lang = () => (typeof UI !== 'undefined' && UI.lang) || 'es';
  // a line for the current language and level (as lines.js picks them; zh / ja without a line: no text, so the English weave)
  function lineOf(key) {
    const L = LT[key]; if (!L) return { text: key, en: key, weave: key };
    const tier = typeof LEX !== 'undefined' ? LEX.tier() : 1, arr = pickLang(L, lang(), []), i = Math.min(arr.length, Math.max(1, tier)) - 1, en = L.en || [''];
    return { text: arr[i] || '', en: en[Math.min(en.length - 1, i)], weave: en[en.length - 1] };
  }
  // the Hush eats some of the words (*starred* ones survive, and so do the woven words)
  function blank(s, seed, amt) {
    if (!(amt > 0)) return s.replace(/\*/g, '');
    const R = rng(seed);
    // (zh / ja notation: split between tokens, never inside a bracket: [看看|kàn kan] is one word)
    const words = /\[[^\]|]*\|/.test(s) && typeof CJK !== 'undefined' ? CJK.split(s) : s.split(' ');
    return words.map(w => {
      if (/\*/.test(w)) return w.replace(/\*/g, '');
      if (!w || /\{[wc]\./.test(w) || /^[…\-–—.!?¡¿,，。！？、：；·・「」“”]+$/.test(w)) return w;      // (zh / ja punctuation is a token of its own: kept)
      const m = w.match(/^([¡¿„“«]*)(.*?)([.,…!?;:»“”]*)$/);
      return R() < amt ? m[1] + '▬' + m[3] : w;
    }).join(' ');
  }

  // ================================================================ materials: the town's toon look, its dithered fade (the camera from
  // viewMatrix: three r128 only sends cameraPosition to lit materials), and a mask: pieces with a slot show only while
  // U.uMask[slot] is on (a grave's fresh flowers once its name is back, its wilted ones before; the mausoleum's door…)
  const U = { uTime: { value: 0 }, uFocus: { value: V3(0, -1e4, 0) }, uFade: { value: 1 }, uMask: { value: new Array(16).fill(1) } };
  const FADE = `
    { vec3 camW = -vec3(dot(viewMatrix[0].xyz, viewMatrix[3].xyz), dot(viewMatrix[1].xyz, viewMatrix[3].xyz), dot(viewMatrix[2].xyz, viewMatrix[3].xyz));
      vec3 seg = uFocus - camW; float segL = max(length(seg), 0.001); vec3 dir = seg / segL;
      vec3 rel = vWP - camW; float along = dot(rel, dir); float axis = length(rel - dir * along);
      float occl = step(0.0, along) * step(along, segL - 0.9) * (1.0 - smoothstep(1.3, 2.7, axis)) * smoothstep(0.4, 1.2, vWP.y - uFocus.y + 1.5);
      float nearCam = 1.0 - smoothstep(1.5, 3.4, length(rel));
      if (uFade > 0.5 && nearCam > 0.8) discard;
      float fadeAmt = uFade * max(occl * 0.9, nearCam);
      if (fadeAmt > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < fadeAmt) discard; }`;
  const RIM = 'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\ngl_FragColor.rgb += vec3(1.0, 0.95, 0.82) * rimAmt * smoothstep(0.6, 0.95, rimF);\n';
  function patch(o) {
    return sh => {
      const CC = o.fade && TK.camCut;        // (a house the camera's inside goes all at once: its windows, boards, doors too)
      Object.assign(sh.uniforms, U, CC ? CC.U : {}, { rimAmt: { value: o.rim || 0 } });
      if (o.gray) sh.uniforms.uGray = o.gray;
      let vs = 'uniform float uTime;\nuniform float uMask[16];\nattribute float aSlot;\nvarying vec3 vWP;\n' + (o.sway ? 'attribute float aSway;\n' : '') + sh.vertexShader;
      vs = vs.replace('#include <begin_vertex>', `#include <begin_vertex>
        ${o.sway ? '{ float ph = position.x * 0.35 + position.z * 0.27; transformed.x += sin(uTime * 1.5 + ph) * 0.11 * aSway; transformed.z += sin(uTime * 1.1 + ph * 1.7) * 0.08 * aSway; }' : ''}
        if (aSlot > -0.5) { if (uMask[int(aSlot + 0.5)] < 0.5) transformed = vec3(0.0); }`);
      vs = vs.replace('#include <project_vertex>', `#include <project_vertex>
        #ifdef USE_INSTANCING
          vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
      sh.vertexShader = vs;
      let fs = 'uniform vec3 uFocus;\nuniform float uFade;\nuniform float rimAmt;\n' + (o.gray ? 'uniform float uGray;\n' : '') + 'varying vec3 vWP;\n' + (CC ? CC.decl : '') + sh.fragmentShader;
      if (o.fade) fs = fs.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + (CC ? CC.test + '\n' : '') + FADE);
      let tail = '';
      if (o.rim) tail += RIM;
      if (o.gray) tail += '{ float lum = dot(gl_FragColor.rgb, vec3(0.3, 0.55, 0.15)); gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(lum) * vec3(0.9, 0.9, 0.98), uGray); }\n';
      if (tail) fs = fs.replace('#include <tonemapping_fragment>', tail + '#include <tonemapping_fragment>');
      sh.fragmentShader = fs;
    };
  }
  const MATS = {};
  function toonM(o = {}) {
    const k = 't' + JSON.stringify(Object.assign({}, o, { gray: !!o.gray, map: o.map ? o.map.uuid : 0 }));
    if (MATS[k] && !o.gray) return MATS[k];
    const m = new THREE.MeshToonMaterial({ color: o.color || '#ffffff', gradientMap: TK.grad, vertexColors: !!o.vc, map: o.map || null,
      emissive: new THREE.Color(o.emissive || '#000000'), transparent: !!o.opacity, opacity: o.opacity || 1, side: o.side || THREE.FrontSide });
    if (o.poly) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -o.poly; }
    m.onBeforeCompile = patch(o); m.customProgramCacheKey = () => 'cem' + JSON.stringify({ fade: !!o.fade, sway: !!o.sway, rim: o.rim || 0, gray: !!o.gray });
    if (!o.gray) MATS[k] = m;
    return m;
  }
  function inkM(o = {}) {
    const k = 'i' + JSON.stringify(o);
    if (MATS[k]) return MATS[k];
    const m = new THREE.MeshBasicMaterial({ color: '#2b2235', side: THREE.BackSide });
    m.onBeforeCompile = patch(o); m.customProgramCacheKey = () => 'cemink' + JSON.stringify(o);
    return (MATS[k] = m);
  }

  // ================================================================ pieces → merged geometry, and its ink hull (as town.js does it)
  const NI = new Map(), BBX = new Map();
  const ni = g => { let r = NI.get(g); if (!r) { r = g.index ? g.toNonIndexed() : g; if (!r.attributes.normal) r.computeVertexNormals(); NI.set(g, r); } return r; };
  const bbOf = g => { let r = BBX.get(g); if (!r) { g.computeBoundingBox(); r = { size: g.boundingBox.getSize(V3(0, 0, 0)), ctr: g.boundingBox.getCenter(V3(0, 0, 0)) }; BBX.set(g, r); } return r; };
  const _p = V3(0, 0, 0), _q = new THREE.Quaternion(), _s = V3(0, 0, 0), _v = V3(0, 0, 0), _c = new THREE.Color(), _m3 = new THREE.Matrix3();
  function hullMatrix(geo, m, ink) {
    const { size, ctr } = bbOf(geo); m.decompose(_p, _q, _s);
    const f = ['x', 'y', 'z'].map(k => { const L = Math.abs(size[k] * _s[k]); return L > 1e-4 ? (L + 2 * ink) / L : 1; });
    return m.clone().multiply(new THREE.Matrix4().makeTranslation(ctr.x, ctr.y, ctr.z)).multiply(new THREE.Matrix4().makeScale(f[0], f[1], f[2]))
      .multiply(new THREE.Matrix4().makeTranslation(-ctr.x, -ctr.y, -ctr.z));
  }
  function bake(pieces, o = {}) {
    const list = o.hull ? pieces.filter(p => p.ink > 0) : pieces;
    if (!list.length) return null;
    let n = 0; for (const p of list) n += ni(p.geo).attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = o.hull ? null : new Float32Array(n * 3), slot = new Float32Array(n);
    const sw = list.some(p => p.sway) ? new Float32Array(n) : null;
    let at = 0;
    for (const p of list) {
      const g = ni(p.geo), PA = g.attributes.position, NA = g.attributes.normal, cnt = PA.count;
      const m = o.hull ? hullMatrix(p.geo, p.m, p.ink) : p.m;
      if (!o.hull) { _m3.getNormalMatrix(m); _c.set(p.color); }
      for (let i = 0; i < cnt; i++) {
        const j = at + i;
        _v.fromBufferAttribute(PA, i).applyMatrix4(m); pos[j * 3] = _v.x; pos[j * 3 + 1] = _v.y; pos[j * 3 + 2] = _v.z;
        slot[j] = p.slot;
        if (sw && p.sway) { const S = p.sway, k = clamp((_v.y - S.y0) / (S.y1 - S.y0), 0, 1); sw[j] = S.k * k * Math.sqrt(k); }
        if (!o.hull) {
          _v.fromBufferAttribute(NA, i).applyMatrix3(_m3).normalize(); nor[j * 3] = _v.x; nor[j * 3 + 1] = _v.y; nor[j * 3 + 2] = _v.z;
          col[j * 3] = _c.r; col[j * 3 + 1] = _c.g; col[j * 3 + 2] = _c.b;
        }
      }
      at += cnt;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aSlot', new THREE.BufferAttribute(slot, 1));
    if (sw) geo.setAttribute('aSway', new THREE.BufferAttribute(sw, 1));
    geo.computeBoundingSphere();
    return geo;
  }
  const GEO = {
    box: GEO0.box, cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
    cyl16: new THREE.CylinderGeometry(1, 1, 1, 16), ball: new THREE.SphereGeometry(1, 12, 8), ball6: new THREE.SphereGeometry(1, 8, 6), ico0: GEO0.ico0, ico1: GEO0.ico1,
    cone: new THREE.ConeGeometry(1, 1, 10), cone6: new THREE.ConeGeometry(1, 1, 6),
    cone4: (() => { const g = new THREE.ConeGeometry(1, 1, 4); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0); return g; })(),
    half: new THREE.SphereGeometry(1, 14, 6, 0, TAU, 0, Math.PI / 2),
    halfCyl: new THREE.CylinderGeometry(1, 1, 1, 14, 1, false, Math.PI / 2, Math.PI),       // (rx π/2: the top half of a disc, for round-topped stones)
    prism: (() => {       // a triangular prism: ridge along x, base z −0.5..0.5 at y 0, apex at y 1
      const a = [-0.5, 0, -0.5], b = [-0.5, 0, 0.5], c = [-0.5, 1, 0], d = [0.5, 0, -0.5], e = [0.5, 0, 0.5], f = [0.5, 1, 0];
      const tris = [a, b, c, d, f, e, a, d, e, a, e, b, b, e, f, b, f, c, a, c, f, a, f, d];
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3)); g.computeVertexNormals(); return g;
    })(),
    torus: new THREE.TorusGeometry(1, 0.22, 6, 16), arch: new THREE.TorusGeometry(1, 0.13, 6, 18, Math.PI), ring: new THREE.TorusGeometry(1, 0.08, 5, 20),
    disc: (() => { const g = new THREE.CircleGeometry(1, 20); g.rotateX(-Math.PI / 2); return g; })(),
  };
  // the drawing kit: pieces in a local frame (front = +z), in buckets: solid (toon + ink), sway (moves in the wind), flat (no ink)
  function Kit() {
    const B = { solid: [], sway: [], flat: [] };
    let F = new THREE.Matrix4(), FY = 0, SL = -1;
    const autoInk = (geo, sx, sy, sz) => { const { size } = bbOf(geo); const dims = [size.x * sx, size.y * sy, size.z * sz].filter(v => v > 1e-3); return clamp(Math.min(...dims) * 0.1, 0.007, 0.026); };
    const k = {
      B, rot: 0,
      frame(x, y, z, rot = 0) { F = new THREE.Matrix4().makeRotationY(rot).setPosition(x, y, z); FY = y; k.rot = rot; return k; },
      slot(i) { SL = i; return k; },
      world(x, y, z) { return V3(x, y, z).applyMatrix4(F); },
      add(geo, x, y, z, sx, sy, sz, color, o = {}) {
        const m = F.clone().multiply(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ')), V3(sx, sy, sz)));
        const b = o.b || 'solid', ink = b === 'flat' ? 0 : o.ink === undefined ? autoInk(geo, sx, sy, sz) : o.ink;
        B[b].push({ geo, m, color, ink, slot: o.slot !== undefined ? o.slot : SL, sway: o.sway ? { y0: FY + o.sway.y0, y1: FY + o.sway.y1, k: o.sway.k } : null });
        return k;
      },
      box(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y, z, w, h, d, color, o); },
      post(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y + h / 2, z, w, h, d, color, o); },
      cyl(x, y, z, r, h, color, o = {}) { return k.add(o.geo || GEO.cyl, x, y + h / 2, z, r, h, r, color, o); },
      ball(x, y, z, r, color, o = {}) { return k.add(o.geo || GEO.ball, x, y, z, r, o.ry2 || r, o.rz2 || r, color, o); },
      beam(x1, y1, z1, x2, y2, z2, t, color, o = {}) {
        const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, L = Math.hypot(dx, dy, dz) || 1e-4;
        const m = F.clone().multiply(new THREE.Matrix4().compose(V3((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2),
          new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), V3(dx / L, dy / L, dz / L)), V3(t, L, o.t2 || t)));
        const b = o.b || 'solid';
        B[b].push({ geo: o.geo || GEO.box, m, color, ink: b === 'flat' ? 0 : o.ink === undefined ? clamp(t * 0.1, 0.006, 0.02) : o.ink, slot: o.slot !== undefined ? o.slot : SL, sway: o.sway ? { y0: FY + o.sway.y0, y1: FY + o.sway.y1, k: o.sway.k } : null });
        return k;
      },
    };
    return k;
  }
  // a kit's buckets → meshes in a group (solid and sway get ink hulls; everything fades by the camera)
  function meshesOf(k, group, o = {}) {
    const out = [];
    const add = (geo, mat, cast) => { if (!geo) return null; const m = new THREE.Mesh(geo, mat); m.castShadow = !!cast; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); group.add(m); out.push(m); return m; };
    add(bake(k.B.solid), toonM({ vc: true, rim: 0.15, fade: o.fade !== false }), o.cast !== false);
    add(bake(k.B.solid, { hull: true }), inkM({ fade: o.fade !== false }));
    add(bake(k.B.sway), toonM({ vc: true, rim: 0.22, fade: o.fade !== false, sway: true }), o.cast !== false);
    add(bake(k.B.sway, { hull: true }), inkM({ fade: o.fade !== false, sway: true }));
    add(bake(k.B.flat), toonM({ vc: true, poly: 1, fade: false }), false);
    return out;
  }

  // ================================================================ canvases: the stones' inscriptions and every sign, two atlases redrawn
  // when the language, the era or a grave changes
  const SYMS = {
    bread(c, s) { c.beginPath(); c.moveTo(-s, s * 0.45); c.bezierCurveTo(-s * 1.05, -s * 0.7, s * 1.05, -s * 0.7, s, s * 0.45); c.closePath(); c.fill(); c.stroke(); for (const x of [-0.45, 0, 0.45]) { c.beginPath(); c.moveTo(x * s - s * 0.12, -s * 0.1); c.lineTo(x * s + s * 0.14, s * 0.22); c.stroke(); } },
    book(c, s) { c.beginPath(); c.moveTo(0, -s * 0.45); c.quadraticCurveTo(-s * 0.5, -s * 0.7, -s, -s * 0.45); c.lineTo(-s, s * 0.55); c.quadraticCurveTo(-s * 0.5, s * 0.3, 0, s * 0.55); c.quadraticCurveTo(s * 0.5, s * 0.3, s, s * 0.55); c.lineTo(s, -s * 0.45); c.quadraticCurveTo(s * 0.5, -s * 0.7, 0, -s * 0.45); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, -s * 0.45); c.lineTo(0, s * 0.55); c.stroke(); },
    note(c, s) { c.beginPath(); c.ellipse(-s * 0.55, s * 0.55, s * 0.32, s * 0.24, -0.4, 0, TAU); c.ellipse(s * 0.55, s * 0.4, s * 0.32, s * 0.24, -0.4, 0, TAU); c.fill(); c.stroke(); c.lineWidth *= 1.4; c.beginPath(); c.moveTo(-s * 0.27, s * 0.5); c.lineTo(-s * 0.27, -s * 0.7); c.lineTo(s * 0.83, -s * 0.85); c.lineTo(s * 0.83, s * 0.35); c.stroke(); },
    spool(c, s) { c.fillRect(-s * 0.55, -s * 0.85, s * 1.1, s * 0.22); c.fillRect(-s * 0.55, s * 0.63, s * 1.1, s * 0.22); c.strokeRect(-s * 0.55, -s * 0.85, s * 1.1, s * 0.22); c.strokeRect(-s * 0.55, s * 0.63, s * 1.1, s * 0.22); c.strokeRect(-s * 0.4, -s * 0.63, s * 0.8, s * 1.26); c.beginPath(); for (let y = -0.5; y < 0.6; y += 0.22) { c.moveTo(-s * 0.4, y * s); c.lineTo(s * 0.4, (y + 0.1) * s); } c.moveTo(s * 0.4, 0); c.quadraticCurveTo(s * 1.0, s * 0.1, s * 0.9, -s * 0.9); c.stroke(); },
    letter(c, s) { c.fillRect(-s, -s * 0.6, s * 2, s * 1.2); c.strokeRect(-s, -s * 0.6, s * 2, s * 1.2); c.beginPath(); c.moveTo(-s, -s * 0.6); c.lineTo(0, s * 0.1); c.lineTo(s, -s * 0.6); c.stroke(); },
    flower(c, s) { for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - HALF; c.beginPath(); c.ellipse(Math.cos(a) * s * 0.48, Math.sin(a) * s * 0.48 - s * 0.15, s * 0.32, s * 0.32, 0, 0, TAU); c.fill(); c.stroke(); } c.beginPath(); c.arc(0, -s * 0.15, s * 0.22, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(0, s * 0.3); c.lineTo(0, s); c.stroke(); },
    apple(c, s) { c.beginPath(); c.moveTo(0, -s * 0.5); c.bezierCurveTo(-s * 1.1, -s, -s * 1.1, s * 0.9, 0, s * 0.8); c.bezierCurveTo(s * 1.1, s * 0.9, s * 1.1, -s, 0, -s * 0.5); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, -s * 0.5); c.lineTo(s * 0.1, -s * 0.95); c.stroke(); },
    heart(c, s) { c.beginPath(); c.moveTo(0, s * 0.85); c.bezierCurveTo(-s * 1.3, -s * 0.1, -s * 0.6, -s * 1.0, 0, -s * 0.4); c.bezierCurveTo(s * 0.6, -s * 1.0, s * 1.3, -s * 0.1, 0, s * 0.85); c.closePath(); c.fill(); c.stroke(); },
    shoe(c, s) { c.beginPath(); c.moveTo(-s * 0.6, -s * 0.9); c.lineTo(-s * 0.1, -s * 0.9); c.lineTo(-s * 0.1, 0); c.quadraticCurveTo(s * 0.9, 0, s, s * 0.6); c.lineTo(-s * 0.7, s * 0.6); c.closePath(); c.fill(); c.stroke(); },
    saw(c, s) { c.beginPath(); c.moveTo(-s, -s * 0.2); c.lineTo(s * 0.6, -s * 0.5); c.lineTo(s * 0.6, s * 0.2); c.lineTo(-s, s * 0.35); c.closePath(); c.fill(); c.stroke(); c.strokeRect(s * 0.6, -s * 0.6, s * 0.4, s * 0.9); },
    bowl(c, s) { c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(0, s * 1.3, s, 0); c.closePath(); c.fill(); c.stroke(); c.beginPath(); for (const x of [-0.35, 0, 0.35]) { c.moveTo(x * s, -s * 0.15); c.quadraticCurveTo(x * s + s * 0.18, -s * 0.5, x * s, -s * 0.9); } c.stroke(); },
    bell(c, s) { c.beginPath(); c.moveTo(-s * 0.9, s * 0.6); c.quadraticCurveTo(-s * 0.7, s * 0.4, -s * 0.6, -s * 0.2); c.quadraticCurveTo(-s * 0.5, -s * 0.85, 0, -s * 0.85); c.quadraticCurveTo(s * 0.5, -s * 0.85, s * 0.6, -s * 0.2); c.quadraticCurveTo(s * 0.7, s * 0.4, s * 0.9, s * 0.6); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.arc(0, s * 0.75, s * 0.18, 0, TAU); c.fill(); c.stroke(); },
  };
  const SYM_NAME = { bread: 'a loaf of bread', book: 'an open book', note: 'a music note', spool: 'a spool of thread and a needle', letter: 'an envelope', flower: 'a flower' };
  function drawSym(c, key, x, y, s, fill, ink, lw = 3) { c.save(); c.translate(x, y); c.fillStyle = fill; c.strokeStyle = ink; c.lineWidth = lw; c.lineJoin = c.lineCap = 'round'; (SYMS[key] || SYMS.heart)(c, s); c.restore(); }
  // text that fits: the font shrinks until it does
  function fitText(c, text, x, y, maxW, size, font, fill) {
    let fs = size; c.font = font.replace('#', fs); while (c.measureText(text).width > maxW && fs > 10) { fs -= 1; c.font = font.replace('#', fs); }
    c.fillStyle = fill; c.fillText(text, x, y); return fs;
  }
  // carved letters: a light lower edge, then the dark cut
  function carve(c, text, x, y, maxW, size, font) { c.save(); fitText(c, text, x + 1.4, y + 1.6, maxW, size, font, 'rgba(250,247,238,0.75)'); fitText(c, text, x, y, maxW, size, font, '#4f4a44'); c.restore(); }
  const barred = (s, keep) => s.split('').map((ch, i) => (ch === ' ' ? ' ' : keep.includes(i) ? ch : '▬')).join('');

  // the stones: a 1024² atlas of 256² faces. Slots 0–5 the faded graves, 6–11 the ones you can read
  const STONE = { cv: null, tex: null, key: '', reveal: null };
  function stoneFace(c, i, g, mode, rev) {
    const S = 256, R = rng(97 + i * 13), l = lang();
    c.save(); c.translate((i % 4) * S, Math.floor(i / 4) * S);
    c.fillStyle = '#c9c4b8'; c.fillRect(0, 0, S, S);
    for (let n = 0; n < 260; n++) { c.fillStyle = R() < 0.5 ? 'rgba(90,84,76,0.13)' : 'rgba(255,255,250,0.2)'; c.fillRect(R() * S, R() * S, 1 + R() * 3, 1 + R() * 2.5); }
    c.strokeStyle = 'rgba(79,74,68,0.5)'; c.lineWidth = 3; c.strokeRect(16, 16, S - 32, S - 32);
    c.strokeStyle = 'rgba(250,247,238,0.65)'; c.lineWidth = 2; c.strokeRect(19, 19, S - 32, S - 32);
    for (let n = 0; n < 7; n++) { c.fillStyle = R() < 0.5 ? 'rgba(110,150,80,0.55)' : 'rgba(130,168,90,0.45)'; c.beginPath(); c.ellipse(R() < 0.5 ? 20 + R() * 30 : S - 20 - R() * 30, S - 14 - R() * 26, 6 + R() * 12, 4 + R() * 7, R() * 3, 0, TAU); c.fill(); }
    c.textAlign = 'center'; c.textBaseline = 'middle';
    drawSym(c, g.sym, S / 2, 66, 30, '#ddd8cc', '#57524b', 3);
    const NAME = plainTxt(nameOf(g, l), l).toUpperCase(), serif = '700 #px Georgia, "Times New Roman", serif', ital = 'italic 600 #px Georgia, "Times New Roman", serif';
    if (g.q !== undefined) {
      const job = cap(plainTxt(jobPhrase(g.job, g.fem, l), l)), showName = mode === 'full' || mode === 'name', showJob = mode === 'full' || mode === 'job';
      const part = (txt, line) => (rev && (rev.line === line || rev.line === 'all') ? txt.slice(0, Math.ceil(txt.length * rev.k)) : txt);
      if (showName) carve(c, part(NAME, 'name'), S / 2, 140, 214, 30, serif);
      else { c.font = serif.replace('#', 28); c.fillStyle = '#8d88a0'; c.fillText(barred(NAME, [0, NAME.indexOf(' ') + 1]), S / 2, 140); }
      if (showJob) carve(c, part(job, 'job'), S / 2, 186, 206, 26, ital);
      else { c.font = ital.replace('#', 24); c.fillStyle = '#9792a8'; c.fillText('▬▬▬▬▬▬▬▬', S / 2, 186); }
      if (mode !== 'full') {        // the Hush: a gray wash over the words
        const gr = c.createRadialGradient(S / 2, 160, 10, S / 2, 160, 130); gr.addColorStop(0, 'rgba(150,146,172,0.5)'); gr.addColorStop(1, 'rgba(150,146,172,0)');
        c.fillStyle = gr; c.fillRect(0, 0, S, S);
      }
      if (rev && rev.k < 1) { const gw = c.createRadialGradient(S / 2, rev.line === 'name' ? 140 : 186, 4, S / 2, rev.line === 'name' ? 140 : 186, 120); gw.addColorStop(0, `rgba(255,246,200,${0.55 * (1 - rev.k)})`); gw.addColorStop(1, 'rgba(255,246,200,0)'); c.fillStyle = gw; c.fillRect(0, 0, S, S); }
    } else {
      carve(c, NAME, S / 2, 140, 214, 28, serif);
      carve(c, plainTxt(pickLang(g.ep, l, g.en), l), S / 2, 188, 210, 22, ital);
    }
    c.restore();
  }
  function drawStones(force) {
    const st = G ? S() : {}, key = lang() + (cjL(lang()) ? CJK.mode(lang()) : '') + '|' + QG.map(g => graveMode(g)).join(',') + (STONE.reveal ? '|r' + STONE.reveal.g.id + STONE.reveal.k.toFixed(2) : '');
    if (!force && key === STONE.key) return; STONE.key = key;
    if (!STONE.cv) { STONE.cv = document.createElement('canvas'); STONE.cv.width = STONE.cv.height = 1024; STONE.tex = new THREE.CanvasTexture(STONE.cv); STONE.tex.anisotropy = 4; }
    const c = STONE.cv.getContext('2d');
    QG.forEach(g => stoneFace(c, g.slot, g, graveMode(g), STONE.reveal && STONE.reveal.g === g ? STONE.reveal : null));
    FG.forEach(g => stoneFace(c, g.slot, g, 'full', null));
    STONE.tex.needsUpdate = true;
    return st;
  }
  // every sign, board and plaque: one 1024² atlas, per era and language
  const SLOTS = {
    forkCem: [0, 0, 512, 128], forkCemB: [512, 0, 512, 128], forkClosed: [0, 128, 512, 128], forkClosedB: [512, 128, 512, 128],
    forkAlba: [0, 256, 512, 128], forkAlbaB: [512, 256, 512, 128], hallName: [0, 384, 1024, 128], cemArch: [0, 512, 512, 128], northArch: [512, 512, 512, 128],
    northSign: [0, 640, 256, 128], postSign: [256, 640, 256, 128], saleSign: [512, 640, 256, 128], mausPlaque: [768, 640, 256, 128],
    poster: [0, 768, 256, 256], emblem: [256, 768, 256, 256], bakerySign: [512, 768, 256, 256], ruinPhoto: [768, 768, 256, 128], banner: [768, 896, 256, 128],
  };
  const SIGN = { cv: null, tex: null, key: '' };
  function board(c, w, h, o = {}) {
    const R = rng(o.seed || 5), old = o.old;
    c.fillStyle = old ? '#bfa486' : '#d6ad7a'; c.fillRect(0, 0, w, h);
    c.fillStyle = old ? 'rgba(90,64,40,0.18)' : 'rgba(138,95,62,0.16)'; for (let y = 18; y < h; y += 26) c.fillRect(0, y, w, 3);
    if (old) { for (let n = 0; n < 40; n++) { c.fillStyle = 'rgba(70,52,36,0.2)'; c.fillRect(R() * w, R() * h, 2 + R() * 18, 1.5); } c.fillStyle = 'rgba(120,150,80,0.35)'; c.beginPath(); c.ellipse(w * 0.92, h * 0.85, 30, 14, 0.2, 0, TAU); c.fill(); }
    c.strokeStyle = old ? '#6f5038' : '#8a5f3e'; c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10);
  }
  function emblem(c, cx, cy, r, gilt) {
    const gold = gilt ? '#e8b83e' : '#a99a7a', face = gilt ? '#fff8e6' : '#d8d2c2', ink = gilt ? '#5a3a1a' : '#4f4a44';
    c.save(); c.translate(cx, cy);
    c.fillStyle = gilt ? '#7a2f2a' : '#b5ae9f'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = ink; c.lineWidth = r * 0.05; c.stroke();
    for (let i = 0; i < 8; i++) {      // eight little bells around the clock
      const a = i / 8 * TAU - HALF; c.save(); c.translate(Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74); c.rotate(a + HALF);
      c.fillStyle = gold; c.strokeStyle = ink; c.lineWidth = r * 0.025; const s = r * 0.13;
      c.beginPath(); c.moveTo(-s, s * 0.7); c.quadraticCurveTo(-s * 0.8, -s * 0.9, 0, -s * 1.05); c.quadraticCurveTo(s * 0.8, -s * 0.9, s, s * 0.7); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.arc(0, s * 0.9, s * 0.25, 0, TAU); c.fill(); c.restore();
    }
    c.fillStyle = face; c.beginPath(); c.arc(0, 0, r * 0.5, 0, TAU); c.fill(); c.stroke();
    c.lineWidth = r * 0.02; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42); c.lineTo(Math.cos(a) * r * 0.47, Math.sin(a) * r * 0.47); c.stroke(); }
    c.lineWidth = r * 0.045; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * 0.36); c.moveTo(0, 0);
    const ha = (8 / 12) * TAU - HALF; c.lineTo(Math.cos(ha) * r * 0.25, Math.sin(ha) * r * 0.25); c.stroke();      // stopped at eight
    c.fillStyle = ink; c.beginPath(); c.arc(0, 0, r * 0.04, 0, TAU); c.fill();
    c.restore();
  }
  function drawSigns(force) {
    const l = lang(), key = l + era + (cjL(l) ? CJK.mode(l) : '');
    if (!force && key === SIGN.key) return; SIGN.key = key;
    const W = k => plainTxt(SIGNW[k][l], l);          // (zh / ja: the notation painted as plain text in the mode)
    if (!SIGN.cv) { SIGN.cv = document.createElement('canvas'); SIGN.cv.width = SIGN.cv.height = 1024; SIGN.tex = new THREE.CanvasTexture(SIGN.cv); SIGN.tex.anisotropy = 4; }
    const c = SIGN.cv.getContext('2d'), now = era === 'now', bold = '900 #px Bahnschrift, "Segoe UI", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const at = (k, fn) => { const [x, y, w, h] = SLOTS[k]; c.save(); c.translate(x, y); c.beginPath(); c.rect(0, 0, w, h); c.clip(); fn(w, h); c.restore(); };
    const arrowBoard = (k, text, arrow, seed) => at(k, (w, h) => { board(c, w, h, { old: now, seed }); fitText(c, arrow === 'L' ? '← ' + text : arrow === 'R' ? text + ' →' : arrow === 'D' ? text + ' ↓' : text, w / 2, h / 2 + 4, w - 50, 68, bold, now ? '#46321f' : '#5b3a22'); });
    arrowBoard('forkCem', W('cem'), 'L', 3); arrowBoard('forkCemB', W('cem'), 'R', 4);
    arrowBoard('forkClosed', now ? '✕ ' + W('closed') : W('north'), now ? '' : 'R', 5); arrowBoard('forkClosedB', now ? W('closed') + ' ✕' : W('north'), now ? '' : 'L', 6);
    arrowBoard('forkAlba', W('alba'), 'D', 7); arrowBoard('forkAlbaB', W('alba'), 'D', 8);
    at('hallName', (w, h) => {       // the theater's name. Now the Hush is eating some of its letters: gray, faded and cracked, but still there to read
      c.fillStyle = now ? '#d6ccb6' : '#f6ecd6'; c.fillRect(0, 0, w, h); c.strokeStyle = now ? '#8f8676' : '#c9553f'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
      const name = W('hall'), font = '700 #px Georgia, "Times New Roman", serif', hushed = now ? hallHush(name) : [], R = rng(13);
      let fs = 84; c.font = font.replace('#', fs); while (c.measureText(name).width > w - 80 && fs > 10) { fs -= 1; c.font = font.replace('#', fs); }
      const x0 = w / 2 - c.measureText(name).width / 2, y = h / 2 + 4;
      c.textAlign = 'left';
      name.split('').forEach((ch, i) => {
        const x = x0 + c.measureText(name.slice(0, i)).width, cw = c.measureText(ch).width;
        if (!hushed.includes(i)) { c.fillStyle = now ? '#4c4238' : '#9c2f28'; c.fillText(ch, x, y); return; }
        c.fillStyle = '#8e879e'; c.fillText(ch, x, y);                                       // the Hush's gray…
        c.strokeStyle = 'rgba(76,66,56,0.5)'; c.lineWidth = 1.6; c.strokeText(ch, x, y);       // …a faint outline, so it still reads…
        c.strokeStyle = '#5a536a'; c.lineWidth = 2.6; c.beginPath();                         // …and a crack down through it
        let cx = x + cw * (0.35 + R() * 0.3), cy = y - fs * 0.42; c.moveTo(cx, cy);
        while (cy < y + fs * 0.38) { cy += fs * (0.12 + R() * 0.1); cx += (R() - 0.5) * cw * 0.45; c.lineTo(cx, cy); }
        c.stroke();
      });
      c.textAlign = 'center';
      if (now) { c.strokeStyle = 'rgba(80,72,64,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(w * 0.62, 6); c.lineTo(w * 0.6, 50); c.lineTo(w * 0.64, 90); c.stroke(); }
    });
    for (const [k, text] of [['cemArch', W('cem')], ['northArch', W('north')]]) at(k, (w, h) => { c.fillStyle = '#2f2c36'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8f8778'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); fitText(c, text, w / 2, h / 2 + 4, w - 50, 60, '700 #px Georgia, "Times New Roman", serif', '#e9dcc0'); });
    at('northSign', (w, h) => { c.fillStyle = now ? '#c9443a' : '#d6ad7a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fffaf0'; c.lineWidth = 7; c.strokeRect(8, 8, w - 16, h - 16); fitText(c, now ? W('closed') : W('north'), w / 2, h / 2 + 3, w - 34, 52, bold, '#fffaf0'); });
    at('postSign', (w, h) => { board(c, w, h, { old: now, seed: 9 }); fitText(c, W('post'), w / 2, h / 2 + 4, w - 40, 56, bold, now ? '#4a5a68' : '#2f5f9a'); });
    at('saleSign', (w, h) => { c.fillStyle = '#f2ead8'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9443a'; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12); fitText(c, W('sale'), w / 2, h / 2 + 3, w - 30, 46, bold, '#c9443a'); });
    at('mausPlaque', (w, h) => { c.fillStyle = '#bdb7aa'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7d776c'; c.lineWidth = 5; c.strokeRect(6, 6, w - 12, h - 12); carve(c, plainTxt(cjName('aurora', l) || 'Aurora Campos', l).toUpperCase(), w / 2, h / 2 + 3, w - 30, 34, '700 #px Georgia, serif'); });
    at('poster', (w, h) => {
      const P = POSTER[l].map(t => plainTxt(t, l)); c.fillStyle = now ? '#e3dac4' : '#fff6dc'; c.fillRect(0, 0, w, h);
      c.fillStyle = now ? '#a8645a' : '#c9443a'; c.fillRect(0, 0, w, 54); emblem(c, w / 2, 98, 34, !now);
      fitText(c, P[0], w / 2, 28, w - 20, 26, bold, '#fff6dc');
      [P[1], P[2], P[3], P[4]].forEach((t, i) => fitText(c, t, w / 2, 152 + i * 25, w - 24, i ? 19 : 22, i ? '600 #px "Segoe UI", sans-serif' : '800 #px "Segoe UI", sans-serif', now ? '#5b5048' : '#3a2b26'));
      if (now) { c.fillStyle = 'rgba(120,110,95,0.35)'; c.beginPath(); c.moveTo(w, h - 60); c.lineTo(w, h); c.lineTo(w - 70, h); c.closePath(); c.fill(); c.fillStyle = 'rgba(160,150,170,0.35)'; c.fillRect(0, 0, w, h); }
    });
    at('emblem', (w, h) => { c.fillStyle = now ? '#c2bcae' : '#efe3c8'; c.fillRect(0, 0, w, h); emblem(c, w / 2, h / 2, w * 0.44, !now); });
    at('bakerySign', (w, h) => { c.fillStyle = now ? '#d9cdb4' : '#fff4e4'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 6, 0, TAU); c.fill(); c.strokeStyle = now ? '#7a6656' : '#8d5733'; c.lineWidth = 12; c.stroke(); drawSym(c, 'bread', w / 2, h / 2 - 52, 34, now ? '#c9a77a' : '#e0a050', '#5b3a22', 4); fitText(c, W('bakery'), w / 2, h / 2 + 14, w - 40, 48, bold, now ? '#5a4a3c' : '#8d5733'); });   // (the word across the middle, where the round board is widest)
    at('ruinPhoto', (w, h) => { photoClass(c, w, h); });
    at('banner', (w, h) => { c.fillStyle = '#c9443a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#ffd84a'; c.lineWidth = 6; c.strokeRect(5, 5, w - 10, h - 10); fitText(c, W('concert'), w / 2, h / 2 + 3, w - 24, 40, bold, '#fff6dc'); });
    SIGN.tex.needsUpdate = true;
  }
  // the old class photo (in the fallen house): sepia, the teacher and his pupils in front of the school
  function photoClass(c, w, h) {
    c.fillStyle = '#e8dcc0'; c.fillRect(0, 0, w, h); const m = Math.round(Math.min(w, h) * 0.06);
    c.fillStyle = '#c9b48e'; c.fillRect(m, m, w - 2 * m, h - 2 * m);
    c.fillStyle = '#a88e68'; c.fillRect(m, m, w - 2 * m, (h - 2 * m) * 0.45);
    c.fillStyle = '#8f7556'; c.beginPath(); c.moveTo(w * 0.3, h * 0.46); c.lineTo(w * 0.5, m * 1.6); c.lineTo(w * 0.7, h * 0.46); c.closePath(); c.fill();
    const R = rng(31), n = 8;
    for (let i = 0; i < n; i++) { const x = m + (w - 2 * m) * (0.12 + 0.76 * i / (n - 1)), y = h * (i % 2 ? 0.72 : 0.66), s = Math.min(w, h) * 0.07; c.fillStyle = '#6f5a44'; c.beginPath(); c.arc(x, y - s * 1.5, s * 0.7, 0, TAU); c.fill(); c.fillRect(x - s * 0.7, y - s * 0.8, s * 1.4, s * 1.9); if (R() < 0.5) { c.fillStyle = '#5a4634'; c.fillRect(x - s * 0.8, y - s * 2.3, s * 1.6, s * 0.5); } }
    const tx = w * 0.88, ty = h * 0.66, s = Math.min(w, h) * 0.1; c.fillStyle = '#4f3f30'; c.beginPath(); c.arc(tx, ty - s * 1.6, s * 0.65, 0, TAU); c.fill(); c.fillRect(tx - s * 0.75, ty - s * 0.9, s * 1.5, s * 2.4);
    c.fillStyle = 'rgba(255,248,230,0.25)'; c.fillRect(0, 0, w, h * 0.12);
  }
  // little textures: a candle flame, a gray stain, a beam of light
  const TEX = {};
  function smallTex() {
    if (TEX.flame) return TEX;
    TEX.flame = TK.canvasTex(64, 64, c => { const g = c.createRadialGradient(32, 36, 1, 32, 32, 30); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.25, 'rgba(255,214,110,0.95)'); g.addColorStop(0.6, 'rgba(255,150,60,0.35)'); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
    TEX.stain = TK.canvasTex(128, 128, c => { const g = c.createRadialGradient(64, 64, 6, 64, 64, 62); g.addColorStop(0, 'rgba(150,147,166,0.85)'); g.addColorStop(0.5, 'rgba(150,147,166,0.55)'); g.addColorStop(1, 'rgba(150,147,166,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
    TEX.beam = TK.canvasTex(64, 256, c => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,246,210,0.9)'); g.addColorStop(1, 'rgba(255,246,210,0.05)'); c.fillStyle = g; c.fillRect(0, 0, 64, 256); const s = c.createLinearGradient(0, 0, 64, 0); s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.5, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = s; c.fillRect(0, 0, 64, 256); });
    return TEX;
  }
  // quads cut from an atlas: { add(k, x, y, z, w, h, rect, o) } in a kit's frame (front = +z), then mesh(tex)
  function Quads() {
    const pos = [], uv = [], slot = [];
    return {
      add(k, x, y, z, w, h, rect, o = {}) {
        const [rx, ry, rw, rh] = rect, u0 = rx / 1024, u1 = (rx + rw) / 1024, v1 = 1 - ry / 1024, v0 = 1 - (ry + rh) / 1024;
        const m = new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, 0, 'YXZ')), V3(1, 1, 1));
        const P = [[-w / 2, -h / 2, u0, v0], [w / 2, -h / 2, u1, v0], [w / 2, h / 2, u1, v1], [-w / 2, h / 2, u0, v1]].map(([a, b, u, v]) => ({ p: k.world(...V3(a, b, 0).applyMatrix4(m).toArray()), u, v }));
        for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(P[i].p.x, P[i].p.y, P[i].p.z); uv.push(P[i].u, P[i].v); slot.push(o.slot !== undefined ? o.slot : -1); }
      },
      mesh(tex, group) {
        if (!pos.length) return null;
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setAttribute('aSlot', new THREE.Float32BufferAttribute(slot, 1)); g.computeVertexNormals();
        const mat = toonM({ map: tex, poly: 2, fade: true }); mat.alphaTest = 0.5;       // (round signs: their corners are see-through)
        const m = new THREE.Mesh(g, mat); m.receiveShadow = true; group.add(m); return m;
      },
    };
  }

  // ================================================================ builders
  // a solid for one era only ('now', 'past') or both: the other era's are parked far away (world.js skips them)
  const OFF = 1e5;
  function solid(out, c, e) { if (out.skipBoth && !e) return c; c.era = e || null; c._x = c.x; out.col.push(c); return c; }
  const worldBox = (k, out, lx, lz, hw, hd, e, lry = 0) => { const p = k.world(lx, 0, lz); return solid(out, { obox: 1, x: p.x, z: p.z, hw, hd, rot: k.rot + lry }, e); };
  const worldCol = (k, out, lx, lz, r, e) => { const p = k.world(lx, 0, lz); return solid(out, { x: p.x, z: p.z, r }, e); };
  function weeds(k, x, z, n, R, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = R() * TAU, r = R() * (o.spread || 0.35), xx = x + Math.cos(a) * r, zz = z + Math.sin(a) * r, h = (o.h || 0.45) * (0.6 + R() * 0.7);
      k.add(GEO.cone6, xx, (o.y || 0) + h / 2, zz, 0.05, h, 0.05, R() < 0.5 ? '#5f9a45' : o.dry ? '#a8a05a' : '#79b04f', { b: 'sway', ink: 0, rx: (R() - 0.5) * 0.6, rz: (R() - 0.5) * 0.6, sway: { y0: o.y || 0, y1: (o.y || 0) + 0.6, k: 0.35 } });
    }
  }
  function vines(k, x, zf, H, R, o = {}) {
    for (let i = 0; i < (o.n || 10); i++) {
      const y = 0.2 + i * (H * 0.92) / (o.n || 10), xx = x + Math.sin(i * 1.3) * 0.32 + (R() - 0.5) * 0.3;
      k.add(GEO.ico0, xx, y, zf + 0.1, 0.26 + R() * 0.16, 0.22 + R() * 0.08, 0.12, R() < 0.5 ? '#5f8f45' : '#6fa04f', { b: 'sway', ink: 0.007, ry: R() * 3, sway: { y0: 0, y1: H, k: 0.2 } });
    }
  }
  function peel(k, hw, zf, y0, y1, base, R, n = 4) {
    for (let i = 0; i < n; i++) { const bw = 0.3 + R() * 0.55, bh = 0.18 + R() * 0.32; k.box((R() - 0.5) * (hw * 2 - bw - 0.3), y0 + R() * (y1 - y0), zf + 0.016, bw, bh, 0.03, R() < 0.55 ? '#a1574a' : shade(base, 1.08), { ink: 0 }); }
  }
  function crack(k, x, y, zf, R) { let px = x, py = y; for (let i = 0; i < 3; i++) { const nx = px + (R() - 0.5) * 0.35, ny = py - 0.22 - R() * 0.2; k.beam(px, py, zf + 0.02, nx, ny, zf + 0.02, 0.03, '#5a514a', { ink: 0, t2: 0.01 }); px = nx; py = ny; } }
  // a window on the face the kit is turned to: state 'ok' | 'boarded' | 'broken'
  function win(k, x, y, zf, o) {
    const wh = o.tall ? 1.5 : 0.95, ww = o.w || 0.86, R = o.R;
    k.box(x, y, zf + 0.02, ww + 0.2, wh + 0.2, 0.08, o.trim, { ink: 0.009 });
    if (o.state === 'boarded') {
      k.box(x, y, zf + 0.04, ww, wh, 0.08, '#3a3440', { ink: 0 });
      for (let i = 0; i < 3; i++) k.box(x + (R() - 0.5) * 0.06, y + (i - 1) * wh * 0.32, zf + 0.11, ww + 0.34, 0.15, 0.05, i % 2 ? '#a08060' : '#8f7052', { rz: (i - 1) * 0.16 + (R() - 0.5) * 0.18, ink: 0.006 });
    } else if (o.state === 'broken') {
      k.box(x, y, zf + 0.04, ww, wh, 0.08, '#2a2430', { ink: 0 });
      for (let i = 0; i < 3; i++) k.add(GEO.cone4, x + (i - 1) * ww * 0.32, y + wh / 2 - 0.05, zf + 0.09, 0.14, -0.28 - R() * 0.2, 0.02, '#9fc8d8', { ink: 0 });
      k.add(GEO.cone4, x - ww * 0.28, y - wh / 2 + 0.05, zf + 0.09, 0.12, 0.24, 0.02, '#9fc8d8', { ink: 0 });
    } else {
      k.box(x, y, zf + 0.04, ww, wh, 0.08, o.lit ? '#ffe6a0' : '#8fd3ec', { ink: 0 });
      k.box(x, y, zf + 0.07, 0.06, wh, 0.05, o.trim, { ink: 0 }).box(x, y + 0.05, zf + 0.07, ww, 0.06, 0.05, o.trim, { ink: 0 });
      if (o.curtain) k.box(x - ww * 0.3, y + 0.05, zf + 0.06, ww * 0.35, wh * 0.9, 0.02, '#fdf3f0', { ink: 0 });
    }
    k.box(x, y - wh / 2 - 0.12, zf + 0.1, ww + 0.36, 0.08, 0.22, o.trim, { ink: 0.007 });
    if (o.shutter && o.state !== 'boarded') for (const s of [-1, 1]) {
      const hang = o.state === 'broken' && s > 0;      // one shutter hanging off its hinge
      k.box(x + s * (ww / 2 + 0.33) + (hang ? 0.12 : 0), y - (hang ? 0.25 : 0), zf + 0.06, 0.42, wh + 0.04, 0.06, o.shutter, { ink: 0.01, rz: hang ? -0.5 : 0 });
    }
    if (o.box) {
      const by = y - wh / 2 - 0.32; k.box(x, by, zf + 0.2, ww + 0.2, 0.24, 0.28, '#a5683d');
      for (let i = 0; i < 4; i++) k.add(GEO.ico0, x - ww / 2 + 0.14 + i * (ww - 0.28) / 3, by + 0.22, zf + 0.22, 0.1, 0.1, 0.1, pick(['#ff8fb1', '#ffd84a', '#ff6b5a', '#ffffff', '#b9a2ff'], R), { ink: 0 });
    }
  }
  function doorOf(k, x, zf, color, o) {
    const top = 2.2, trim = o.trim;
    k.box(x, 0.3 + top / 2 + 0.06, zf + 0.02, 1.32, top + 0.14, 0.08, trim);
    k.box(x, 0.3 + top / 2, zf + 0.05, 1.06, top, 0.1, color);
    k.box(x, 0.3 + top * 0.55, zf + 0.11, 0.85, 0.05, 0.03, shade(color, 0.78), { ink: 0 }).box(x, 0.3 + top * 0.25, zf + 0.11, 0.85, 0.05, 0.03, shade(color, 0.78), { ink: 0 });
    k.add(GEO.ico0, x + 0.33, 1.3, zf + 0.13, 0.06, 0.06, 0.06, '#e6b84a', { ink: 0 });
    k.box(x, 0.12, zf + 0.33, 1.5, 0.24, 0.6, o.stone, { rz: o.now ? 0.05 : 0 });
    if (o.boarded) for (const s of [-1, 1]) k.box(x, 1.2 + s * 0.45, zf + 0.14, 1.4, 0.16, 0.05, '#9a7a58', { rz: s * 0.25, ink: 0.006 });
    if (o.lamp) k.box(x + 0.92, top - 0.1, zf + 0.16, 0.22, 0.32, 0.22, o.now ? '#8f8a80' : '#f6e7a8', { emissive: 1 }).box(x + 0.92, top + 0.1, zf + 0.16, 0.3, 0.07, 0.3, '#2f3440');
  }
  // a gable roof (ridge along x); sag: the middle sinks; hole: a gap with broken rafters; moss
  function gable(k, w, d, H, pitch, roof, wall, o = {}) {
    const ov = 0.42, tp = Math.tan(pitch), cp = Math.cos(pitch), sp = Math.sin(pitch), hR = (d / 2) * tp, t = 0.2, dark = shade(roof, 0.78), R = o.R;
    k.add(GEO.prism, 0, H, 0, w, hR, d, wall);
    for (const s of [-1, 1]) {
      const zm = (d / 2 + ov) / 2, ym = H + hR - zm * tp, len = (d / 2 + ov) / cp + 0.04;
      if (!o.sag) k.box(0, ym + (t / 2) * cp, s * (zm + (t / 2) * sp), w + 0.7, t, len, roof, { rx: s * pitch });
      else for (let j = -1; j <= 1; j++) {
        if (o.hole && s > 0 && j === 0) continue;
        const seg = (w + 0.7) / 3; k.box(j * seg, ym + (t / 2) * cp - (j === 0 ? o.sag : o.sag * 0.25), s * (zm + (t / 2) * sp), seg + 0.03, t, len, j === 0 ? shade(roof, 0.93) : roof, { rx: s * (pitch + (j === 0 ? 0.05 : 0)), rz: j * 0.025 });
      }
      for (let i = 1; i <= 3; i++) { const z = (i / 4) * (d / 2 + ov), y = H + hR - z * tp; k.box(0, y + (t + 0.02) * cp - (o.sag || 0) * 0.5, s * (z + (t + 0.02) * sp), w + 0.72, 0.045, 0.13, dark, { rx: s * pitch, ink: 0 }); }
      if (o.moss) for (let i = 0; i < 4; i++) { const z = (0.2 + R() * 0.6) * (d / 2 + ov), y = H + hR - z * tp + 0.12; k.add(GEO.ico0, (R() - 0.5) * w, y, s * z, 0.4 + R() * 0.3, 0.08, 0.3, '#6f9a4a', { rx: s * pitch, ink: 0 }); }
    }
    if (o.hole) { const zm = (d / 2 + ov) / 2, ym = H + hR - zm * tp; for (const x of [-0.5, 0.45]) k.box(x, ym, zm, 0.12, 0.12, (d / 2 + ov) / cp, '#5a4636', { rx: pitch + (x > 0 ? 0.15 : -0.1), ink: 0.006 }); }
    k.add(GEO.cyl8, 0, H + hR + 0.16 - (o.sag || 0) * 0.6, 0, 0.17, w + 0.82, 0.17, dark, { rz: HALF });
    return z => H + hR - Math.abs(z) * tp;
  }
  function chimney(k, x, z, base, color, o) {
    k.post(x, base - 0.4, z, 0.62, o.broken ? 1.1 : 1.7, 0.62, color, { rz: o.broken ? 0.08 : 0 });
    if (!o.broken) k.post(x, base + 1.3, z, 0.8, 0.16, 0.8, '#5b4a46');
    else for (let i = 0; i < 3; i++) k.add(GEO.ico0, x + (i - 1) * 0.22, base - 0.4 + 1.1 + 0.08, z, 0.14, 0.1, 0.14, color, { ink: 0.006 });
    if (o.smoke) o.smoke.push(k.world(x, base + 1.55, z));
  }
  // one house of the Old Quarter, in its era: now rundown (boarded, faded, sagging, vines), then thriving (fresh paint, flower boxes, smoke)
  function drawHouse(k, h, now, out, q) {
    if (now && h.kind === 'ruin') return drawRuin(k, h, out, q);
    const R = rng(hash(h.id) + (now ? 7 : 3)), two = h.floors > 1, H = two ? 5.3 : 3.0, w = h.w, d = h.d;
    const lived = h.kind === 'tina', worn = now && !lived;
    const wall = now ? h.wall[0] : h.wall[1], roof = now ? h.roof[0] : h.roof[1], wood = now ? '#6e5640' : '#7a5236', trim = now ? '#d6cfc1' : '#fdf8ee', stone = now ? '#a59886' : '#b9a58a';
    const doorC = worn ? mix(h.door, '#8f8a86', 0.45) : h.door, shut = worn ? mix(h.shutter, '#8f8a86', 0.45) : h.shutter;
    const face = i => { k.frame(h.x, h.y0, h.z, h.rot + [0, HALF, Math.PI, -HALF][i]); return i % 2 ? { hz: w / 2, hw: d / 2 } : { hz: d / 2, hw: w / 2 }; };
    face(0);
    k.post(0, -0.35, 0, w + 0.24, 0.65, d + 0.24, stone);
    k.post(0, 0.3, 0, w, H - 0.3, d, wall);
    if (h.style === 'timber') {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2), 0.3, sz * (d / 2), 0.24, H - 0.3, 0.24, wood);
      for (const s of [-1, 1]) { k.box(0, H - 0.1, s * (d / 2 + 0.03), w + 0.08, 0.2, 0.1, wood); if (two) k.box(0, 2.72, s * (d / 2 + 0.03), w + 0.08, 0.2, 0.1, wood); }
    } else if (h.style === 'stucco') {
      k.box(0, H - 0.12, 0, w + 0.1, 0.22, d + 0.1, shade(wall, 0.9), { ink: 0.01 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (let y = 0.7; y < H - 0.4; y += 1.0) k.box(sx * (w / 2 - 0.12), y, sz * (d / 2 - 0.12), 0.3, 0.36, 0.3, shade(wall, 0.93), { ink: 0 });
    }
    const slots = h.kind === 'bakery' ? 3 : Math.max(2, Math.min(4, Math.floor((w - 0.6) / 1.6))), sx = i => -w / 2 + (w / slots) * (i + 0.5);
    const dSlot = h.kind === 'bakery' || h.kind === 'post' ? 1 : h.kind === 'tina' ? 0 : Math.floor(R() * slots);
    let f = face(0);
    for (let i = 0; i < slots; i++) {
      if (i === dSlot) doorOf(k, sx(i), f.hz, doorC, { trim, stone, now, boarded: worn && h.kind !== 'sale', lamp: !now || lived });
      else win(k, sx(i), 1.65, f.hz, { trim, shutter: shut, state: worn ? (R() < 0.7 ? 'boarded' : 'broken') : 'ok', box: !worn, curtain: lived, w: h.kind === 'bakery' ? 1.4 : undefined, tall: h.kind === 'bakery', R });
      if (two) win(k, sx(i), 4.0, f.hz, { trim, shutter: shut, state: worn ? (R() < 0.55 ? 'broken' : 'boarded') : 'ok', box: !worn && R() < 0.6, R });
    }
    if (worn) { peel(k, f.hw, f.hz, 0.6, H - 0.5, wall, R, 5); crack(k, -f.hw + 0.6 + R() * 0.5, H - 0.5, f.hz, R); weeds(k, -f.hw + 0.3, f.hz + 0.3, 5, R); weeds(k, f.hw - 0.4, f.hz + 0.35, 4, R); vines(k, (R() < 0.5 ? -1 : 1) * (f.hw - 0.25), f.hz, H * (0.6 + R() * 0.4), R); }
    for (const i of [1, 2, 3]) {
      const g = face(i), n = Math.max(1, Math.floor((g.hw * 2 - 0.8) / 2.2));
      for (let j = 0; j < n; j++) { const x = -g.hw + (g.hw * 2 / n) * (j + 0.5); if (i === 2 || R() < 0.7) win(k, x, 1.65, g.hz, { trim, state: worn ? 'boarded' : 'ok', R }); if (two) win(k, x, 4.0, g.hz, { trim, state: worn ? (R() < 0.5 ? 'broken' : 'boarded') : 'ok', R }); }
      if (worn && R() < 0.5) peel(k, g.hw, g.hz, 0.6, H - 0.5, wall, R, 2);
      if (worn && i !== 2 && R() < 0.6) vines(k, (R() - 0.5) * g.hw, g.hz, H * 0.7, R, { n: 7 });
    }
    f = face(0);
    const at = gable(k, w, d, H, h.style === 'timber' ? 0.78 : 0.6, roof, wall, { sag: worn ? 0.14 : 0, hole: worn && h.kind === 'blue', moss: now, R });
    const cx = (R() < 0.5 ? -1 : 1) * w * 0.28, cz = -d * 0.22;
    chimney(k, h.kind === 'bakery' ? w * 0.3 : cx, cz, at(cz), h.kind === 'bakery' ? '#a1574a' : '#c9b8a0', { broken: worn, smoke: !now || lived ? out.smoke : null });
    if (lived) drawPorch(k, h, out, now);
    if (h.kind === 'bakery') { const y = 2.95; k.beam(sx(1) + 0.8, y + 0.3, f.hz + 0.05, sx(1) + 0.8, y + 0.3, f.hz + 1.05, 0.07, '#2f3440'); q.add(k, sx(1) + 0.8, y - 0.42 - (now ? 0.05 : 0), f.hz + 0.92, 1.2, 1.2, SLOTS.bakerySign, { ry: HALF, rx: 0 }); q.add(k, sx(1) + 0.8, y - 0.42, f.hz + 0.9, 1.2, 1.2, SLOTS.bakerySign, { ry: -HALF }); }   // (bigger, and further out from under the eaves)
    if (h.kind === 'post') { q.add(k, sx(1), 3.05, f.hz + 0.08, 1.5, 0.75, SLOTS.postSign); if (!now) k.box(sx(1), 3.05, f.hz + 0.04, 1.6, 0.85, 0.05, '#8a5f3e'); }
    solid(out, { obox: 1, x: h.x, z: h.z, hw: w / 2 + 0.12, hd: d / 2 + 0.12, rot: h.rot }, h.kind === 'ruin' ? 'past' : null);
  }
  // Doña Tina's porch: a deck, posts, a little roof, a railing (and her rocking chair: with her, in the people)
  function drawPorch(k, h, out, now) {
    const d = h.d, w = h.w, z0 = d / 2, z1 = d / 2 + 1.6, wood = now ? '#8a6e52' : '#a8784e';
    k.frame(h.x, h.y0, h.z, h.rot);
    k.post(0, 0, (z0 + z1) / 2, w - 0.4, 0.22, z1 - z0, wood);
    for (const x of [-w / 2 + 0.4, w / 2 - 0.4]) k.post(x, 0.22, z1 - 0.1, 0.14, 2.35, 0.14, wood);
    k.box(0, 2.62, (z0 + z1) / 2 + 0.1, w - 0.1, 0.12, z1 - z0 + 0.5, now ? '#8f6e66' : '#c9553f', { rx: -0.22 });
    for (const x of [-w / 2 + 0.4, w / 2 - 0.4]) { k.box(x * 0.6 + (x > 0 ? 0.5 : -0.5), 0.75, z1 - 0.1, Math.abs(x) * 0.8 - 0.6, 0.06, 0.06, wood); for (let t = 0; t < 4; t++) k.post(x * (0.35 + t * 0.2), 0.22, z1 - 0.1, 0.05, 0.53, 0.05, wood, { ink: 0 }); }
    k.cyl(w / 2 - 1.0, 0.22, z0 + 0.5, 0.24, 0.42, '#c46a3a').ball(w / 2 - 1.0, 0.82, z0 + 0.5, 0.3, '#5fae4f', { geo: GEO.ball6 }).add(GEO.ico0, w / 2 - 0.92, 1.0, z0 + 0.6, 0.1, 0.1, 0.1, '#ff8fb1', { ink: 0 });
    k.post(-0.9, 0.22, z0 + 0.7, 0.5, 0.45, 0.5, wood).cyl(-0.9, 0.67, z0 + 0.7, 0.12, 0.18, '#3e7fb0');      // a little table, a teapot
    worldBox(k, out, 0, z1 - 0.1, w / 2 - 0.3, 0.12, null);
  }
  // the half-collapsed house (now): one half still stands two floors high; the other half has fallen in, its roof sliding
  // into the rubble. Through the gap in the front you can see in: a fallen table, a chair, and a class photo by the back wall.
  function drawRuin(k, h, out, q) {
    const R = rng(77), w = h.w, d = h.d, H = 5.3, wall = h.wall[0], wood = '#6e5640', trim = '#d6cfc1', stone = '#a59886';
    k.frame(h.x, h.y0, h.z, h.rot);
    k.post(0, -0.35, 0, w + 0.24, 0.65, d + 0.24, stone);
    k.post(0, 0.25, -0.0, w - 0.2, 0.1, d - 0.2, '#6a5444');                                             // the floor, planks
    for (let x = -w / 2 + 0.3; x < 0; x += 0.42) k.box(x, 0.31, 0, 0.03, 0.01, d - 0.3, '#4f3e32', { ink: 0 });
    k.post(w / 4, 0.3, 0, w / 2, H - 0.3, d, wall);                                                      // the half that still stands
    for (const sz of [-1, 1]) k.post(w / 2, 0.3, sz * d / 2, 0.24, H - 0.3, 0.24, wood);
    for (let y = 0.5; y < H - 0.2; y += 0.6) k.box(0.02 + (R() - 0.5) * 0.12, y, (R() - 0.5) * d * 0.6, 0.12, 0.5, 0.6 + R() * 0.8, shade(wall, 0.85), { ink: 0.006 });   // its broken inside edge
    win(k, w / 4, 1.65, d / 2, { trim, state: 'boarded', R }); win(k, w / 4, 4.0, d / 2, { trim, state: 'broken', shutter: '#7f8f7a', R });
    const jag = (x0, x1, z, along, hs) => { const n = hs.length, step = (x1 - x0) / n; hs.forEach((hh, i) => { const c = x0 + step * (i + 0.5); if (along === 'x') k.post(c, 0.3, z, step + 0.04, hh, 0.24, wall); else k.post(z, 0.3, c, 0.24, hh, step + 0.04, wall); }); };
    jag(-w / 2, 0, -d / 2, 'x', [2.3, 1.9, 1.5, 1.1, 0.9, 1.6]);         // the back wall, broken down
    jag(-w / 2, -0.5, d / 2, 'x', [1.0, 0.7, 1.15, 0.8]);                // the front: the gap you look in through
    jag(-d / 2, d / 2, -w / 2, 'z', [1.3, 0.9, 0.6, 1.0, 1.5]);           // the far side
    for (let x = -w / 2 + 0.6; x < -0.6; x += 1.0) k.box(x, 0.95 + R() * 0.3, d / 2 + 0.02, 0.5, 0.06, 0.04, shade(wall, 0.8), { ink: 0 });
    k.box(w / 4, 2.75, 0, w / 2, 0.14, d - 0.1, '#7a6250');                                               // the upper floor, over the standing half
    for (let i = 0; i < 4; i++) k.box(-0.15 - R() * 0.3, 2.5 - i * 0.18, (i - 1.5) * 1.1, 0.7, 0.06, 0.18, '#8a6e52', { rz: 0.6 + R() * 0.4, ink: 0.006 });   // dangling planks
    { // the standing half's roof (a gable over x 0…w/2) and the fallen one, sliding into the rubble
      const pitch = 0.78, ov = 0.42, tp = Math.tan(pitch), cp = Math.cos(pitch), sp = Math.sin(pitch), hR = (d / 2) * tp, t = 0.2, roof = h.roof[0];
      k.add(GEO.prism, w / 4, H, 0, w / 2, hR, d, wall);
      for (const s of [-1, 1]) { const zm = (d / 2 + ov) / 2, ym = H + hR - zm * tp; k.box(w / 4 + 0.15, ym + (t / 2) * cp, s * (zm + (t / 2) * sp), w / 2 + 0.4, t, (d / 2 + ov) / cp, roof, { rx: s * pitch }); }
      k.add(GEO.cyl8, w / 4 + 0.15, H + hR + 0.16, 0, 0.17, w / 2 + 0.5, 0.17, shade(roof, 0.78), { rz: HALF });
      for (let i = 0; i < 4; i++) k.box(-0.3 - R() * 0.4, H + hR * (0.3 + i * 0.18), (i - 1.5) * 0.9, 0.9, 0.1, 0.1, '#5a4636', { rz: -0.35 - R() * 0.3, ink: 0.006 });   // broken rafters
      k.box(-w / 4 - 0.1, 1.7, -d * 0.12, w / 2 + 0.6, 0.18, d * 0.62, shade(roof, 0.92), { rz: -0.62, rx: 0.1 });                 // the fallen roof
      k.box(-w / 4 - 0.3, 0.9, d * 0.28, w / 2 - 0.2, 0.16, 1.4, roof, { rz: 0.32, ry: 0.2 });
      chimney(k, w * 0.28, -d * 0.22, H + hR - d * 0.22 * tp, '#c9b8a0', { broken: true });
    }
    for (let i = 0; i < 22; i++) { const x = -w / 2 + 0.6 + R() * (w / 2 - 1.0), z = (R() - 0.5) * (d - 1.2); k.add(R() < 0.6 ? GEO.ico0 : GEO.box, x, 0.35 + R() * 0.35, z, 0.25 + R() * 0.3, 0.18 + R() * 0.2, 0.22 + R() * 0.3, R() < 0.5 ? '#a1574a' : '#a59886', { ry: R() * 3, rz: R() * 0.5, ink: 0.006 }); }
    for (let i = 0; i < 3; i++) k.beam(-w / 2 + 0.8 + i * 0.7, 0.4, -d / 2 + 0.6 + i, -0.8 + i * 0.3, 1.6 - i * 0.3, d / 2 - 1.2 - i * 0.4, 0.14, '#6a5444');
    k.post(-1.8, 0.3, 0.9, 1.2, 0.08, 0.8, '#8a6e52', { rz: 0.35 }); k.post(-2.1, 0.3, 0.6, 0.08, 0.6, 0.08, '#6a5444', { rz: 0.35 });     // a fallen table
    k.post(-1.0, 0.32, 1.6, 0.45, 0.08, 0.45, '#8a6e52', { rx: HALF });                                                           // a chair on its side
    // the class photo, leaning on the back wall inside (look through the gap)
    k.post(-1.6, 0.6, -d / 2 + 0.24, 1.0, 0.75, 0.06, '#5a4636', { rx: -0.12 });
    q.add(k, -1.6, 0.98, -d / 2 + 0.29, 0.86, 0.43, SLOTS.ruinPhoto, { rx: -0.12 });
    for (let i = 0; i < 3; i++) k.cyl(-w / 2 + 0.9 + i * 0.5, 0.3, -0.4 + i * 0.6, 0.05, 1.2 + i * 0.4, '#7a5a3a', { geo: GEO.cyl6, ink: 0 }).ball(-w / 2 + 0.9 + i * 0.5, 1.6 + i * 0.4, -0.4 + i * 0.6, 0.45, '#6fa04f', { b: 'sway', geo: GEO.ball6, ink: 0.008, sway: { y0: 0, y1: 2.4, k: 0.3 } });   // saplings in the rubble
    weeds(k, -w / 2 + 0.4, d / 2 + 0.3, 8, R, { spread: 0.8 }); vines(k, w / 2 - 0.3, d / 2, H * 0.8, R);
    worldBox(k, out, w / 4, 0, w / 4 + 0.12, d / 2 + 0.12, 'now');
    worldBox(k, out, -w / 4, d / 2, w / 4, 0.16, 'now'); worldBox(k, out, -w / 4, -d / 2, w / 4, 0.16, 'now'); worldBox(k, out, -w / 2, 0, 0.16, d / 2, 'now');
    worldCol(k, out, -w / 4, 0, 1.2, 'now');
  }

  // The old theater (Teatro de Alba): two tall floors under a gable, its front a pediment. Now: boarded, chained, peeling,
  // the name half eaten, a hole in the roof; through the broken left window, the stage. Then: fresh paint, bunting, open doors.
  function drawHall(k, now, out, q, fx) {
    const R = rng(now ? 41 : 42), w = HALL.w, d = HALL.d, Hw = HALL.H, Y = 0.55, zf = d / 2 - 0.175, pitch = 0.5, hR = (w / 2) * Math.tan(pitch);
    const wall = now ? '#cbc1ad' : '#f6ead2', trim = now ? '#a89c88' : '#c9553f', stone = now ? '#9d968a' : '#c8bda8', roofC = now ? '#6b6276' : '#5c4a7a', doorC = now ? '#5a4436' : '#7a2f2a', gilt = now ? '#a99a7a' : '#e8b83e';
    k.frame(HALL.x, HALL.y0, HALL.z, 0);
    k.post(0, -0.4, 0, w + 0.5, 0.95, d + 0.5, stone);
    k.post(0, Y, -d / 2 + 0.175, w, Hw, 0.35, wall);                                                         // back
    for (const s of [-1, 1]) k.post(s * (w / 2 - 0.175), Y, 0, 0.35, Hw, d, wall);                           // sides
    for (const [x0, x1] of [[-7, -4.9], [-3.1, -1.3], [1.3, 3.1], [4.9, 7]]) k.post((x0 + x1) / 2, Y, zf, x1 - x0, Hw, 0.35, wall);   // the front, around its openings
    for (const x of [-4.0, 4.0]) { k.post(x, Y, zf, 1.8, 1.0, 0.35, wall); k.post(x, Y + 4.0, zf, 1.8, Hw - 4.0, 0.35, wall); }
    k.post(0, Y + 3.4, zf, 2.6, Hw - 3.4, 0.35, wall);
    for (const z of [zf, -zf]) k.add(GEO.prism, 0, Y + Hw, z, 0.35, hR, w, wall, { ry: HALF });               // the gables
    k.box(0, Y + Hw, d / 2 + 0.06, w + 0.5, 0.32, 0.32, trim); k.box(0, Y + 0.2, d / 2 + 0.06, w + 0.3, 0.4, 0.2, trim);
    for (const x of [-6.6, -2.2, 2.2, 6.6]) k.post(x, Y, d / 2 + 0.05, 0.5, Hw, 0.18, trim, { ink: 0.008 });
    // the roof: two slabs, ridge front to back; now the left one has a hole over the stage
    { const ov = 0.5, tp = Math.tan(pitch), cp = Math.cos(pitch), sp = Math.sin(pitch), t = 0.25, xm = (w / 2 + ov) / 2, ym = Y + Hw + hR - xm * tp, across = (w / 2 + ov) / cp + 0.05;
      for (const s of [-1, 1]) {
        const at = (z0, z1, part = 1, off = 0) => k.box(s * (xm + (t / 2) * sp) - s * off * cp, ym + (t / 2) * cp + off * sp, (z0 + z1) / 2, across * part, t, z1 - z0, roofC, { rz: -s * pitch });
        if (now && s < 0) { at(-d / 2 - 0.4, -5.3); at(-2.9, d / 2 + 0.4); at(-5.3, -2.9, 0.45, across * 0.27); }
        else at(-d / 2 - 0.4, d / 2 + 0.4);
        for (let i = 1; i <= 4; i++) { const x = (i / 5) * (w / 2 + ov), y = Y + Hw + hR - x * tp; k.box(s * (x + (t + 0.02) * sp), y + (t + 0.02) * cp, 0, 0.13, 0.045, d + 0.82, shade(roofC, 0.8), { rz: -s * pitch, ink: 0 }); }
        if (now) for (let i = 0; i < 5; i++) { const x = (0.2 + R() * 0.6) * (w / 2 + ov), y = Y + Hw + hR - x * tp + 0.14; k.add(GEO.ico0, s * x, y, (R() - 0.5) * d, 0.5, 0.08, 0.7, '#6f9a4a', { rz: -s * pitch, ink: 0 }); }
      }
      k.add(GEO.cyl8, 0, Y + Hw + hR + 0.18, 0, 0.2, d + 0.9, 0.2, shade(roofC, 0.78), { rx: HALF });
      if (now) for (const z of [-4.9, -3.4]) k.box(-2.4, Y + Hw + hR - 2.4 * tp + 0.2, z, 0.12, 0.14, 2.8, '#5a4636', { rz: pitch + 0.1 });
    }
    // the bell turret on the ridge, over the front
    { const ty = Y + Hw + hR - 0.4; k.post(0, ty, d / 2 - 1.1, 1.5, 2.0, 1.5, wall, { rz: now ? 0.05 : 0 }); k.add(GEO.cone4, 0, ty + 2.0, d / 2 - 1.1, 1.25, 1.3, 1.25, roofC, { rz: now ? 0.05 : 0 });
      k.post(0, ty + 0.5, d / 2 - 0.34, 0.8, 1.1, 0.05, '#2a2430', { ink: 0 });
      if (!now) k.add(GEO.half, 0, ty + 1.45, d / 2 - 1.1, 0.42, -0.6, 0.42, '#e8b83e'); else k.add(GEO.half, 0.2, ty + 0.75, d / 2 - 0.9, 0.36, -0.48, 0.36, '#8f7a52', { rz: 1.1 });
      fx.turret = k.world(0, ty + 2.5, d / 2 - 1.1); }
    // the door: chained shut (now), or open with warm light inside (then); the emblem over it; the name across the front
    if (now) {
      for (const s of [-1, 1]) k.post(s * 0.65, Y, zf + 0.12, 1.28, 3.35, 0.12, doorC);
      for (const s of [-1, 1]) k.box(s * 0.2, Y + 1.6, zf + 0.22, 0.08, 0.28, 0.08, '#2f3440', { ink: 0 });
      for (let i = 0; i < 7; i++) k.add(GEO.torus, -0.45 + i * 0.15, Y + 1.55 - Math.sin(i / 6 * Math.PI) * 0.18, zf + 0.26, 0.08, 0.08, 0.08, '#5a5a62', { ry: i % 2 ? HALF : 0, ink: 0 });
      k.box(0, Y + 1.25, zf + 0.3, 0.26, 0.3, 0.12, '#4a4a52'); k.add(GEO.torus, 0, Y + 1.45, zf + 0.3, 0.1, 0.1, 0.1, '#4a4a52', { ink: 0 });
    } else {
      for (const s of [-1, 1]) k.box(s * 1.75, Y + 1.68, zf + 0.75, 1.28, 3.35, 0.12, doorC, { ry: s * 1.2 });
      k.post(0, Y, zf - 0.1, 2.5, 3.3, 0.05, '#ffdc8a', { ink: 0, emissive: 1 });
      fx.glows.push(k.world(0, Y + 2.0, zf + 0.6), k.world(-1.0, Y + 2.8, zf + 0.5), k.world(1.0, Y + 2.8, zf + 0.5));
    }
    k.add(GEO.arch, 0, Y + 3.4, d / 2 + 0.05, 1.42, 1.0, 1.4, trim);
    k.post(0, Y + 3.62, d / 2 + 0.02, 1.9, 1.75, 0.08, trim);
    q.add(k, 0, Y + 4.5, d / 2 + 0.07, 1.55, 1.55, SLOTS.emblem);
    // (the name board is fixed across the front of the pilasters: behind them, two of its letters were hidden)
    k.box(0, Y + Hw - 0.68, d / 2 + 0.17, 7.56, 1.06, 0.06, trim); q.add(k, 0, Y + Hw - 0.68, d / 2 + 0.205, 7.4, 0.92, SLOTS.hallName);
    if (!now) q.add(k, 0, Y + 3.65, d / 2 + 0.55, 2.6, 0.65, SLOTS.banner, { rx: 0.1 });
    // the front windows: the left one broken (look in), the right one boarded (now)
    for (const x of [-4.0, 4.0]) {
      k.add(GEO.arch, x, Y + 4.0, d / 2 + 0.04, 0.98, 0.6, 1.2, trim); k.box(x, Y + 0.98, d / 2 + 0.08, 2.1, 0.14, 0.32, trim);
      for (const s of [-1, 1]) k.post(x + s * 0.95, Y + 1.0, d / 2 + 0.02, 0.12, 3.0, 0.12, trim, { ink: 0.006 });
      if (!now) { k.post(x, Y + 1.0, zf, 1.75, 3.0, 0.06, '#ffe6a0', { ink: 0, emissive: 1 }); k.post(x, Y + 1.0, zf + 0.05, 0.06, 3.0, 0.05, trim, { ink: 0 }); fx.glows.push(k.world(x, Y + 2.4, zf + 0.4)); }
      else if (x > 0) { k.post(x, Y + 1.0, zf - 0.1, 1.75, 3.0, 0.05, '#2a2430', { ink: 0 }); for (let i = 0; i < 5; i++) k.box(x + (R() - 0.5) * 0.08, Y + 1.4 + i * 0.6, zf + 0.22, 2.0, 0.17, 0.05, i % 2 ? '#a08060' : '#8f7052', { rz: (R() - 0.5) * 0.35, ink: 0.006 }); }
      else for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; k.add(GEO.cone4, x + Math.cos(a) * 0.78, Y + 2.5 + Math.sin(a) * 1.35, zf + 0.12, 0.16, -(0.3 + R() * 0.3), 0.02, '#a9d0de', { ink: 0, rz: a + HALF }); }
    }
    for (const s of [-1, 1]) for (const z of [-3.5, 0, 3.5]) {        // the sides: tall windows, boarded now
      k.frame(HALL.x + s * w / 2, HALL.y0, HALL.z + z, s * HALF);
      win(k, 0, Y + 2.6, 0, { trim, state: now ? 'boarded' : 'ok', lit: !now, tall: true, w: 1.2, R });
      if (now && R() < 0.5) peel(k, 1.4, 0.0, Y + 0.6, Y + Hw - 1, wall, R, 2);
    }
    k.frame(HALL.x, HALL.y0, HALL.z, 0);
    k.add(GEO.ring, 0, Y + Hw + hR * 0.42, d / 2 + 0.06, 0.55, 0.55, 1.6, trim); k.add(GEO.cyl16, 0, Y + Hw + hR * 0.42, d / 2 + 0.02, 0.5, 0.05, 0.5, now ? '#2a2430' : '#ffe6a0', { rx: HALF, ink: 0 });
    // the steps up to the door
    for (let i = 0; i < 2; i++) k.post(0, -0.2, d / 2 + 0.44 + i * 0.38, 3.2, 0.57 - i * 0.19, 0.38, stone, { rz: now && i ? 0.03 : 0 });
    out.plat.push({ box: [HALL.x - 1.6, HALL.x + 1.6, HALL.z + d / 2 + 0.25, HALL.z + d / 2 + 0.63], top: HALL.y0 + 0.37 }, { box: [HALL.x - 1.6, HALL.x + 1.6, HALL.z + d / 2 + 0.63, HALL.z + d / 2 + 1.01], top: HALL.y0 + 0.18 });
    // the notice board with the concert poster, right of the door
    k.post(2.25, Y + 0.95, d / 2 + 0.1, 1.15, 1.45, 0.07, now ? '#6e5640' : '#8a5f3e'); q.add(k, 2.25, Y + 1.68, d / 2 + 0.15, 0.96, 0.96, SLOTS.poster, { rx: now ? 0.04 : 0 });
    if (now) {
      peel(k, w / 2, d / 2 + 0.02, Y + 0.6, Y + Hw - 1.0, wall, R, 7); crack(k, -5.6, Y + Hw - 0.6, d / 2 + 0.02, R); crack(k, 5.4, Y + 3.0, d / 2 + 0.02, R);
      vines(k, w / 2 - 0.2, d / 2 + 0.05, Hw * 0.95, R, { n: 14 }); vines(k, -w / 2 + 0.4, d / 2 + 0.05, Hw * 0.5, R, { n: 7 });
      for (const x of [-1.5, -0.7, 0.9, 1.6]) weeds(k, x, d / 2 + 0.9, 3, R, { y: 0.2 });
      k.beam(w / 2 + 0.1, Y + Hw - 0.1, d / 2 + 0.15, w / 2 + 0.6, 0.3, d / 2 + 0.6, 0.1, '#6a6670');       // a fallen gutter
      k.add(GEO.cyl16, -0.2, 0.188, d / 2 + 0.82, 0.55, 0.02, 0.15, '#8f8ca0', { rz: 0.03, ink: 0 });       // a gray stain on the lower step (lying on it: its top is at 0.18)
    } else {
      for (const s of [-1, 1]) { k.cyl(s * 2.6, 0, d / 2 + 1.1, 0.42, 0.55, '#c46a3a').ball(s * 2.6, 0.75, d / 2 + 1.1, 0.48, '#5fae4f', { geo: GEO.ball6 }); for (let i = 0; i < 4; i++) k.add(GEO.ico0, s * 2.6 + (R() - 0.5) * 0.6, 1.0 + R() * 0.2, d / 2 + 1.1 + (R() - 0.5) * 0.6, 0.12, 0.12, 0.12, pick(['#ff8fb1', '#ffd84a', '#ffffff'], R), { ink: 0 }); }
      const T = fx.turret, corners = [k.world(-w / 2 - 0.2, Y + Hw + 0.2, d / 2 + 0.2), k.world(w / 2 + 0.2, Y + Hw + 0.2, d / 2 + 0.2)];
      fx.bunting = corners.map(c => [T, c]);
    }
    // inside: the floor, the stage, the curtains, rows of chairs, the music stand (now: dust, a hole of light, a red cap)
    const fl = now ? '#5d4c3e' : '#8a6448', curt = now ? '#7d4a4c' : '#c43c3c', SY = Y + 0.9, sz = -d / 2 + 1.6;
    k.post(0, Y - 0.02, 0, w - 0.7, 0.05, d - 0.7, fl);
    k.post(0, Y, sz, w - 1.0, 0.9, 2.8, now ? '#6a5444' : '#a8784e'); k.box(0, SY - 0.05, sz + 1.42, w - 1.0, 0.1, 0.06, trim);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) k.post(s * (w / 2 - 1.0 - i * 0.28), SY, sz + 1.25, 0.3, 5.0, 0.18, curt, { ink: 0.006, rz: s * 0.02 * i });
    k.box(0, Y + 6.1, sz + 1.3, w - 1.0, 0.8, 0.2, curt);
    { const mx = 0, mz = sz + 0.5;
      k.cyl(mx, SY, mz, 0.03, 1.1, '#2f3440', { geo: GEO.cyl6, ink: 0 }); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; k.beam(mx, SY + 0.3, mz, mx + Math.cos(a) * 0.3, SY, mz + Math.sin(a) * 0.3, 0.03, '#2f3440', { ink: 0 }); }
      k.box(mx, SY + 1.15, mz + 0.04, 0.6, 0.4, 0.03, '#2f3440', { rx: -0.5, ink: 0.005 }); k.box(mx, SY + 1.17, mz + 0.06, 0.5, 0.32, 0.01, '#f4efe0', { rx: -0.5, ink: 0 });
      fx.stand = k.world(mx, SY + 1.0, mz);
      if (now) { k.add(GEO.half, mx + 0.7, SY, mz + 0.55, 0.14, 0.11, 0.14, '#c9443a', { ink: 0.006 }); k.box(mx + 0.7, SY + 0.01, mz + 0.72, 0.18, 0.02, 0.14, '#c9443a', { ink: 0 }); for (let i = 0; i < 7; i++) k.box(mx + (R() - 0.5) * 3, SY + 0.01, mz + (R() - 0.2) * 1.4, 0.32, 0.01, 0.42, '#efe8d6', { ry: R() * 3, ink: 0 }); }
      else { k.post(-3.6, SY, sz - 0.2, 1.8, 1.3, 0.6, '#2b2235'); k.box(-3.6, SY + 0.78, sz + 0.18, 1.7, 0.06, 0.25, '#f4f1e6', { ink: 0 }); k.post(-3.6, SY, sz + 0.5, 0.9, 0.5, 0.35, '#5a3a2a'); }
    }
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
      const x = -4.5 + c * 1.8, z = 3.9 - r * 1.35, fall = now && R() < 0.22, gone = now && R() < 0.1; if (gone) continue;
      const cc = now ? '#6e5848' : '#9c3f3a';
      if (fall) { k.box(x + 0.2, Y + 0.25, z, 0.55, 0.06, 0.55, cc, { rz: 1.35, ry: R() * 2 }); continue; }
      for (const lx of [-0.24, 0.24]) for (const lz of [-0.22, 0.22]) k.post(x + lx, Y, z + lz, 0.05, 0.45, 0.05, '#4a3a33', { ink: 0 });
      k.post(x, Y + 0.45, z, 0.6, 0.08, 0.55, cc); k.post(x, Y + 0.53, z + 0.25, 0.6, 0.6, 0.07, cc);
    }
    if (now) { k.add(GEO.torus, 1.8, Y + 0.12, 0.4, 0.75, 0.75, 0.75, '#6f6458', { rx: HALF + 0.15 }); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; k.cyl(1.8 + Math.cos(a) * 0.75, Y + 0.05, 0.4 + Math.sin(a) * 0.75, 0.05, 0.25, '#efe8d6', { ink: 0, rz: 0.9 }); } }
    solid(out, { obox: 1, x: HALL.x, z: HALL.z, hw: w / 2 + 0.12, hd: d / 2 + 0.12, rot: 0 }, null);
  }
  // the signpost at the fork: «CEMENTERIO ←», the right-hand way shut, Alba back the way you came
  function drawSignpost(k, out, q, now) {
    const P = SPOT.sign, wood = now ? '#7a6048' : '#8a5f3e', bw = now ? '#a8916f' : '#c79d6d';
    k.frame(P.x, gyOf(P.x, P.z), P.z, 0);
    k.post(0, 0, 0, 0.17, 2.75, 0.17, wood, { rz: now ? 0.04 : 0 }); k.add(GEO.cone4, 0, 2.75, 0, 0.2, 0.22, 0.2, wood);
    const boardAt = (y, ry, front, back, len, tilt = 0) => {
      k.frame(P.x, gyOf(P.x, P.z), P.z, ry);
      k.box(len / 2 + 0.05, y, 0, len, 0.46, 0.08, bw, { rz: tilt }); k.add(GEO.cone4, len + 0.12, y, 0, 0.32, 0.32, 0.08, bw, { rz: -HALF + tilt });
      q.add(k, len / 2 + 0.05, y + tilt * (len / 2), 0.045, len - 0.08, 0.4, SLOTS[front], { rx: 0 });
      q.add(k, len / 2 + 0.05, y + tilt * (len / 2), -0.045, len - 0.08, 0.4, SLOTS[back], { ry: Math.PI });
    };
    boardAt(2.2, Math.PI, 'forkCemB', 'forkCem', 1.7, now ? 0.03 : 0);       // (points west: from the south you read its back face)
    boardAt(1.75, 0.6, 'forkClosed', 'forkClosedB', 1.6, now ? -0.06 : 0);
    boardAt(1.3, -HALF, 'forkAlba', 'forkAlbaB', 1.3, 0);
    k.frame(P.x, gyOf(P.x, P.z), P.z, 0);
    solid(out, { x: P.x, z: P.z, r: 0.22 }, null);
  }
  // the old north road's gate: stone pillars, an iron arch («Camino del norte»), chained shut, walls and brambles either side
  function drawNorthGate(k, out, q, now) {
    const P = SPOT.northGate, rot = Math.atan2(-P.ux, -P.uz), stone = now ? '#9d968a' : '#c8bda8', iron = '#3a3640', R = rng(55);
    k.frame(P.x, GATEY, P.z, rot);
    for (const s of [-1, 1]) { k.post(s * 2.1, 0, 0, 0.75, 3.0, 0.75, stone); k.add(GEO.cone4, s * 2.1, 3.0, 0, 0.55, 0.5, 0.55, shade(stone, 0.85)); worldBox(k, out, s * 2.1, 0, 0.42, 0.42, null); }
    k.add(GEO.arch, 0, 2.95, 0, 1.75, 1.0, 0.8, iron);
    q.add(k, 0, 3.55, 0.07, 2.4, 0.6, SLOTS.northArch); q.add(k, 0, 3.55, -0.07, 2.4, 0.6, SLOTS.northArch, { ry: Math.PI });
    k.box(0, 3.55, 0, 2.5, 0.68, 0.1, iron);
    // (the Gray Marsh, marsh.js, draws the two iron leaves itself, so they can swing open once seven bells ring: MARSH.gateLeaves)
    const marshGate = typeof MARSH !== 'undefined' && MARSH.gateLeaves;
    if (!marshGate) {
      for (let x = -1.65; x <= 1.66; x += 0.2) { k.cyl(x, 0, 0, 0.035, 2.45, iron, { geo: GEO.cyl6, ink: 0 }); k.add(GEO.cone4, x, 2.45, 0, 0.06, 0.16, 0.06, iron, { ink: 0 }); }
      for (const y of [0.35, 1.3, 2.25]) k.box(0, y, 0, 3.4, 0.07, 0.07, iron, { ink: 0.005 });
      k.box(0, 1.2, 0.03, 0.06, 2.3, 0.1, iron);
    }
    if (now && !marshGate) {
      for (let i = 0; i < 8; i++) k.add(GEO.torus, -0.5 + i * 0.14, 1.32 - Math.sin(i / 7 * Math.PI) * 0.22, 0.1, 0.07, 0.07, 0.07, '#5a5a62', { ry: i % 2 ? HALF : 0, ink: 0 });
      k.box(0, 1.0, 0.14, 0.24, 0.28, 0.1, '#4a4a52');
      q.add(k, 0, 1.75, 0.1, 0.95, 0.48, SLOTS.northSign, { rx: 0.05 }); k.box(0, 1.75, 0.07, 1.0, 0.52, 0.03, '#2f2c36');
    }
    if (!marshGate) solid(out, { obox: 1, x: P.x, z: P.z, hw: 1.75, hd: 0.2, rot }, null);
    for (const s of [-1, 1]) {
      for (let x = 2.5; x < 8; x += 1.1) { const hh = 1.1 + R() * 0.5 - (x > 6.6 ? 0.4 : 0); k.post(s * (x + 0.55), 0, 0, 1.12, hh, 0.6, stone, { ink: 0.01 }); if (R() < 0.5) k.add(GEO.ico0, s * (x + 0.55), hh + 0.05, 0.1, 0.4, 0.14, 0.32, '#6f9a4a', { ink: 0 }); }
      worldBox(k, out, s * 5.2, 0, 2.75, 0.35, null);
      for (let x = 8.2; x < 14; x += 0.9) { const z = (R() - 0.5) * 1.2; k.add(GEO.ico1, s * x, 0.55, z, 0.75 + R() * 0.3, 0.6 + R() * 0.3, 0.7, R() < 0.5 ? '#3f6b3e' : '#4a7a46', { b: 'sway', ink: 0.012, sway: { y0: 0, y1: 1.4, k: 0.15 } }); worldCol(k, out, s * x, z, 0.75, null); }
    }
  }
  // the Old Quarter's odds and ends: the well, the swing's old oak, a cart, the «for sale» sign, the mailbox, a lamp post
  function drawQuarterProps(k, out, q, now, fx) {
    const R = rng(now ? 21 : 22), wood = now ? '#7a6048' : '#8a5f3e';
    { const P = SPOT.well; k.frame(P.x, gyOf(P.x, P.z), P.z, 0.3);
      k.cyl(0, 0, 0, 0.8, 0.8, now ? '#a39b8f' : '#c8bda8', { geo: GEO.cyl16 }); k.add(GEO.disc, 0, 0.78, 0, 0.62, 1, 0.62, '#2a2430', { ink: 0 });
      for (const s of [-1, 1]) k.post(s * 0.72, 0.6, 0, 0.12, 1.6, 0.12, wood);
      k.box(0, 2.15, 0, 1.7, 0.1, 0.1, wood); k.add(GEO.prism, 0, 2.2, 0, 2.0, 0.55, 1.4, now ? '#8a6e66' : '#c9553f', { rz: now ? 0.08 : 0 });
      k.cyl(0.1, 1.2, 0, 0.012, 0.95, '#c9b88a', { ink: 0, geo: GEO.cyl6 }); k.cyl(0.1, 0.95, 0, 0.16, 0.26, now ? '#6f6a62' : '#8a6a4a', { geo: GEO.cyl8 });
      if (now) weeds(k, 0.7, 0.6, 6, R); solid(out, { x: P.x, z: P.z, r: 0.95 }, null); }
    { const P = SPOT.swing, y = gyOf(P.x, P.z), leaf = ['#4f9c3f', '#5aa84a', '#4a9440', '#6ab653'];
      k.frame(P.x, y, P.z, 0);
      k.cyl(0, 0, 0, 0.42, 3.2, '#7c5436', { geo: GEO.cyl8 }); k.cyl(0, -0.1, 0, 0.62, 0.5, '#6f4a30', { geo: GEO.cyl8 });
      k.beam(0, 2.9, 0, -2.6, 3.45, 0.2, 0.26, '#7c5436'); k.beam(0, 2.8, 0, 1.6, 3.9, -0.6, 0.22, '#7c5436'); k.beam(0, 3.1, 0, 0.3, 4.4, 1.2, 0.22, '#7c5436');
      for (let i = 0; i < 11; i++) { const a = R() * TAU, r = R() * 2.2; k.add(GEO.ico1, Math.cos(a) * r - 0.4, 4.3 + R() * 1.3, Math.sin(a) * r, 1.0 + R() * 0.6, 0.85 + R() * 0.4, 1.0 + R() * 0.5, pick(leaf, R), { b: 'sway', ink: 0.016, sway: { y0: 3, y1: 6, k: 0.5 } }); }
      for (let i = 0; i < 3; i++) k.add(GEO.ico1, -2.4 + i * 0.5, 3.75, 0.2, 0.7, 0.45, 0.6, pick(leaf, R), { b: 'sway', ink: 0.012, sway: { y0: 3, y1: 5, k: 0.4 } });
      if (now) k.cyl(-2.25, 3.0, 0.62, 0.02, 0.42, '#c9b88a', { geo: GEO.cyl6, ink: 0 });      // the snapped rope's stub
      fx.swing = { x: P.x - 2.3, y: y + 3.35, z: P.z + 0.2, now };
      solid(out, { x: P.x, z: P.z, r: 0.62 }, null); }
    { const P = SPOT.cart; k.frame(P.x, gyOf(P.x, P.z), P.z, 0.4);
      if (now) { k.post(0, 0.3, 0, 1.3, 0.5, 1.9, '#8a7058', { rz: 0.32 }); k.add(GEO.cyl16, 0.85, 0.42, 0.5, 0.42, 0.1, 0.42, '#5a4636', { rz: HALF + 0.3 }); k.add(GEO.cyl16, -0.2, 0.06, -1.6, 0.42, 0.1, 0.42, '#5a4636'); k.beam(0.2, 0.5, 0.95, -0.4, 0.15, 2.1, 0.08, '#6a5444'); weeds(k, 0, 0.3, 7, R, { spread: 0.9 }); }
      else { k.post(0, 0.45, 0, 1.3, 0.55, 1.9, '#b07a48'); for (const s of [-1, 1]) k.add(GEO.cyl16, s * 0.72, 0.42, 0, 0.42, 0.1, 0.42, '#5a4636', { rz: HALF }); k.beam(0, 0.7, 0.95, 0, 0.55, 2.1, 0.08, '#8a5f3e'); for (let i = 0; i < 6; i++) k.ball((R() - 0.5) * 0.9, 1.1, (R() - 0.5) * 1.4, 0.22, R() < 0.5 ? '#e2453a' : '#9cc24e', { geo: GEO.ball6 }); }
      solid(out, { obox: 1, x: P.x, z: P.z, hw: 0.75, hd: 1.05, rot: 0.4 }, null); }
    if (now) { const P = SPOT.sale; k.frame(P.x, gyOf(P.x, P.z), P.z, -HALF);
      // (the board hangs beside its post, off an arm, and says it on both faces: hung in front of the post, the post hid the back's words)
      k.post(0, 0, 0, 0.12, 1.6, 0.12, wood, { rz: 0.06 }); k.box(0.56, 1.45, 0, 1.06, 0.08, 0.08, wood); k.box(0.58, 1.05, 0, 1.0, 0.52, 0.04, '#d8cfbc');
      q.add(k, 0.58, 1.05, 0.025, 0.95, 0.48, SLOTS.saleSign); q.add(k, 0.58, 1.05, -0.025, 0.95, 0.48, SLOTS.saleSign, { ry: Math.PI });
      solid(out, { x: P.x, z: P.z, r: 0.2 }, 'now'); }
    { const P = SPOT.mailbox; k.frame(P.x, gyOf(P.x, P.z), P.z, -HALF);
      k.post(0, 0, 0, 0.1, 1.0, 0.1, wood, { rz: now ? 0.1 : 0 }).post(0, 1.0, 0, 0.42, 0.34, 0.62, now ? '#5a6a78' : '#3e7fb0').add(GEO.cyl16, 0, 1.34, 0, 0.21, 0.62, 0.21, now ? '#5a6a78' : '#3e7fb0', { rx: HALF });
      if (now) k.add(GEO.ico0, 0.1, 1.2, 0.2, 0.18, 0.14, 0.2, '#8a5a3a', { ink: 0 }); else k.box(0.23, 1.3, -0.1, 0.03, 0.18, 0.08, '#d64b3c', { ink: 0 });
      solid(out, { x: P.x, z: P.z, r: 0.25 }, null); }
    { const P = SPOT.lamp; k.frame(P.x, gyOf(P.x, P.z), P.z, 0);
      k.post(0, 0, 0, 0.14, 3.0, 0.14, '#2f3440', { rz: now ? 0.12 : 0 }); k.box(now ? 0.35 : 0, 3.05, 0, 0.36, 0.42, 0.36, now ? '#8f8a80' : '#f6e7a8', { rz: now ? 0.12 : 0 });
      if (!now) fx.glows.push(k.world(0, 3.05, 0)); solid(out, { x: P.x, z: P.z, r: 0.2 }, null); }
  }
  // trees along the long path, thinning out toward the cemetery: old oaks and birches, cypresses near the end
  const PATH_TREES = (() => {
    const R = rng(4242), out = [], L = ROADS.left;
    for (let s = 2.5, i = 0; s < L.len - 3; s += 3.4 + s * 0.11, i++) {
      const a = L.at(s), side = i % 2 ? 1 : -1, off = 3.0 + s * 0.05 + R() * 1.4, x = a.x - a.uz * side * off, z = a.z + a.ux * side * off;
      if (inBox(CEMBOX, x, z, 3) || inBox(HALLBOX, x, z, 1)) continue;
      out.push({ x, z, kind: s > L.len * 0.65 ? (R() < 0.6 ? 'cypress' : 'birch') : R() < 0.55 ? 'oak' : 'birch', s: 0.85 + R() * 0.35, seed: R() });
    }
    return out;
  })();
  function drawTree(k, t, y) {
    const R = rng(Math.floor(t.seed * 1e6) + 5), s = t.s;
    k.frame(t.x, y, t.z, t.seed * TAU);
    if (t.kind === 'cypress') { k.cyl(0, 0, 0, 0.16 * s, 1.0 * s, '#6a4a32', { geo: GEO.cyl6 }); k.add(GEO.cone, 0, 3.1 * s, 0, 0.85 * s, 5.0 * s, 0.85 * s, R() < 0.5 ? '#3f6b48' : '#46754c', { b: 'sway', sway: { y0: 1, y1: 6 * s, k: 0.3 } }); k.add(GEO.ball6, 0, 1.4 * s, 0, 0.75 * s, 0.9 * s, 0.75 * s, '#3a6343', { b: 'sway', sway: { y0: 1, y1: 6 * s, k: 0.3 } }); return; }
    const birch = t.kind === 'birch', H = (birch ? 3.4 : 2.6) * s;
    k.cyl(0, 0, 0, (birch ? 0.15 : 0.3) * s, H, birch ? '#efe9dc' : '#7c5436', { geo: GEO.cyl8 });
    if (birch) for (let i = 0; i < 4; i++) k.box(0, 0.5 + i * 0.7, 0.13 * s, 0.12, 0.05, 0.05, '#4a4440', { ink: 0 });
    const n = birch ? 5 : 7, leaf = birch ? ['#8fc45a', '#9dcc63', '#86bb52'] : ['#4a9440', '#55a346', '#4f9c3f', '#62b04c'];
    for (let i = 0; i < n; i++) { const a = R() * TAU, r = R() * 1.1 * s; k.add(GEO.ico1, Math.cos(a) * r, H + (R() - 0.2) * 1.1 * s, Math.sin(a) * r, (0.8 + R() * 0.5) * s, (0.7 + R() * 0.4) * s, (0.8 + R() * 0.5) * s, pick(leaf, R), { b: 'sway', ink: 0.014, sway: { y0: H * 0.6, y1: H + 2 * s, k: 0.45 } }); }
  }

  // ---------------------------------------------------------------- the cemetery
  const STONEC = '#bdb7aa', STONED = '#8f8a80', IRON = '#3a3640';
  const slotRect = i => [(i % 4) * 256, Math.floor(i / 4) * 256, 256, 256];
  // an iron fence on a low stone wall, in world coordinates (the kit's frame at the cemetery's height)
  function fenceRun(k, out, x1, z1, x2, z2, e, now) {
    const L = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(x2 - x1, z2 - z1), mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, R = rng(Math.round(x1 * 7 + z1 * 13));
    k.box(mx, 0.2, mz, 0.42, 0.45, L, STONEC, { ry }); k.box(mx, 0.45, mz, 0.5, 0.06, L + 0.05, STONED, { ry, ink: 0 });
    for (const y of [0.62, 1.55]) k.box(mx, y, mz, 0.05, 0.05, L, IRON, { ry, ink: 0.004 });
    const n = Math.floor(L / 0.32);
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = lerp(x1, x2, t), z = lerp(z1, z2, t);
      if (now && R() < 0.06) continue;                                          // (a bar gone here and there)
      const bend = now && R() < 0.08 ? (R() - 0.5) * 0.5 : 0;
      k.cyl(x, 0.45, z, 0.028, 1.25, IRON, { geo: GEO.cyl6, ink: 0, rz: bend }); k.add(GEO.cone4, x + Math.sin(bend) * -1.25, 1.68, z, 0.05, 0.14, 0.05, IRON, { ink: 0 });
    }
    for (let i = 0; i <= Math.round(L / 6); i++) { const t = i / Math.max(1, Math.round(L / 6)), x = lerp(x1, x2, t), z = lerp(z1, z2, t); k.post(x, 0, z, 0.5, 1.9, 0.5, STONEC, { ry }); k.ball(x, 2.02, z, 0.2, STONED, { geo: GEO.ball6 }); if (now && R() < 0.5) k.add(GEO.ico0, x, 1.92, z, 0.3, 0.08, 0.3, '#6f9a4a', { ink: 0 }); }
    solid(out, { obox: 1, x: mx, z: mz, hw: 0.28, hd: L / 2 + 0.2, rot: ry }, e);
  }
  // a grave: a plinth, a tablet (round, peaked, scrolled or flat), its inscription (a quad of the stone atlas), a little plot.
  // Quest graves carry both their faded things (slot 6 + q: wilted flowers, a burnt-out stub) and their restored ones (slot q).
  function drawGrave(k, g, out, qs, fx, old) {
    const rot = { N: Math.PI, S: 0, E: HALF, W: -HALF }[g.face], R = rng(hash((g.id || '') + g.x + ',' + g.z));
    k.frame(g.x, CEMY, g.z, rot);
    const lean = old ? (g.kind === 'lean' ? (R() < 0.5 ? -1 : 1) * (0.12 + R() * 0.1) : 0) : 0, lx = old ? (R() - 0.5) * 0.12 : 0;
    k.post(0, -0.05, 0, 1.1, 0.27, 0.62, STONED);
    const th = 0.18, tw = 0.88, hgt = old && g.kind === 'broken' ? 0.55 : 0.95, y0 = 0.22, col = old ? '#a9a497' : STONEC, shape = old ? (R() < 0.5 ? 'round' : 'peak') : g.shape;
    k.add(GEO.box, 0, y0 + hgt / 2, 0, tw, hgt, th, col, { rz: lean, rx: lx });
    const top = y0 + hgt;
    if (!(old && g.kind === 'broken')) {
      if (shape === 'round') k.add(GEO.halfCyl, 0, top, 0, tw / 2, th, tw / 2, col, { rx: HALF + lx, rz: lean });
      else if (shape === 'peak') k.add(GEO.prism, 0, top, 0, th, 0.32, tw, col, { ry: HALF, rz: lean });
      else if (shape === 'scroll') { for (const s of [-1, 1]) k.add(GEO.halfCyl, s * tw * 0.27, top, 0, tw * 0.23, th, tw * 0.23, col, { rx: HALF }); k.box(0, top + 0.05, 0, tw * 0.1, 0.1, th, col); }
      else k.box(0, top + 0.05, 0, tw + 0.1, 0.1, th + 0.06, STONED);
    } else for (let i = 0; i < 4; i++) k.add(GEO.ico0, (i - 1.5) * 0.22, top + 0.04, 0, 0.13, 0.1, 0.1, col, { ink: 0.006 });
    if (old) { for (let i = 0; i < 4; i++) k.add(GEO.ico0, (R() - 0.5) * 0.7, y0 + R() * hgt, th / 2 + 0.02, 0.18 + R() * 0.12, 0.12, 0.05, '#6f9a4a', { ink: 0, rz: lean }); crack(k, (R() - 0.5) * 0.3, y0 + hgt * 0.9, th / 2, R); }
    if (g.slot !== undefined) qs.add(k, 0, y0 + 0.5, th / 2 + 0.006, 0.76, 0.76, slotRect(g.slot));
    if (!old) {      // the plot: a stone curb in front
      for (const s of [-1, 1]) k.box(s * 0.5, 0.05, 1.12, 0.1, 0.12, 1.5, STONED, { ink: 0.005 });
      k.box(0, 0.05, 1.87, 1.1, 0.12, 0.1, STONED, { ink: 0.005 });
    }
    if (g.q !== undefined) {
      k.slot(6 + g.q);         // faded: wilted flowers, a stub of a candle
      for (let i = 0; i < 4; i++) { const x = -0.25 + i * 0.12, z = 0.55 + R() * 0.2; k.beam(x, 0.05, z, x + 0.1, 0.32, z + 0.12, 0.02, '#7d7a5a', { ink: 0 }).add(GEO.ico0, x + 0.12, 0.3, z + 0.14, 0.06, 0.05, 0.06, '#8d8778', { ink: 0 }); }
      k.cyl(0.32, 0.0, 0.5, 0.06, 0.1, '#bdb6a6', { geo: GEO.cyl8 });
      k.slot(g.q);             // restored: a fresh bouquet and a candle (its flame is a point with the same slot)
      const c0 = g.tint;
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, x = -0.18 + Math.cos(a) * 0.12, z = 0.6 + Math.sin(a) * 0.1; k.beam(-0.18, 0.04, 0.6, x, 0.36, z, 0.02, '#4f8a3a', { ink: 0 }).add(GEO.ico0, x, 0.4, z, 0.07, 0.07, 0.07, i % 2 ? c0 : '#ffffff', { ink: 0 }); }
      k.cyl(0.3, 0.0, 0.52, 0.07, 0.24, '#f6efe0', { geo: GEO.cyl8 }); k.add(GEO.disc, 0.3, 0.005, 0.52, 0.16, 1, 0.16, '#c9a24e', { ink: 0 });
      fx.flames.push({ p: k.world(0.3, 0.33, 0.52), slot: g.q, s: 1 });
      k.slot(-1);
      fx.stains.push({ x: g.x, z: g.z, slot: 6 + g.q, r: 1.7 });
    } else if (!old) {
      if (R() < 0.8) { k.cyl(-0.22, 0, 0.62, 0.13, 0.22, pick(['#c46a3a', '#8a9aa8', '#b8a07a'], R), { geo: GEO.cyl8 }); for (let i = 0; i < 5; i++) k.add(GEO.ico0, -0.22 + (R() - 0.5) * 0.2, 0.3 + R() * 0.1, 0.62 + (R() - 0.5) * 0.2, 0.08, 0.08, 0.08, pick(['#ff8fb1', '#ffd84a', '#ffffff', '#b9a2ff', '#ff6b5a'], R), { ink: 0 }); }
      if (R() < 0.85) { k.cyl(0.3, 0, 0.5, 0.06, 0.2, '#f6efe0', { geo: GEO.cyl8 }); fx.flames.push({ p: k.world(0.3, 0.29, 0.5), slot: -1, s: 0.9 }); }
    }
    solid(out, { obox: 1, x: g.x, z: g.z, hw: 0.56, hd: 0.34, rot }, out.era);
  }
  function cypress(k, x, z, s, R, o = {}) {
    k.frame(x, o.y !== undefined ? o.y : CEMY, z, R() * TAU);
    k.cyl(0, 0, 0, 0.16 * s, 1.0 * s, '#6a4a32', { geo: GEO.cyl6 });
    k.add(GEO.cone, 0, 3.0 * s, 0, 0.9 * s, 5.2 * s, 0.9 * s, R() < 0.5 ? '#3f6b48' : '#46754c', { b: 'sway', sway: { y0: 1, y1: 6 * s, k: 0.25 } });
    k.add(GEO.ball6, 0, 1.3 * s, 0, 0.8 * s, 0.95 * s, 0.8 * s, '#3a6343', { b: 'sway', sway: { y0: 1, y1: 6 * s, k: 0.25 } });
  }
  // Aurora's mausoleum: a little stone temple, two columns, a pediment with her name and the theater's emblem, an iron door
  // (two leaves that swing open at the end of the quest: built apart, in fx.door), and an alcove with her tomb
  function drawMausoleum(k, out, qs, fx) {
    const st = STONEC, st2 = '#a8a296', R = rng(61);
    k.frame(MAUS.x, CEMY, MAUS.z, MAUS.rot);
    k.post(0, -0.1, 0, 7.0, 0.6, 7.4, st2);
    k.post(0, -0.1, 3.9, 3.6, 0.43, 0.7, st2); k.post(0, -0.1, 4.6, 3.6, 0.26, 0.7, st2);
    k.post(-1.75, 0.5, -0.4, 1.5, 3.6, 5.0, st); k.post(1.75, 0.5, -0.4, 1.5, 3.6, 5.0, st);       // the body, around its alcove
    k.post(0, 3.1, -0.4, 2.0, 1.0, 5.0, st); k.post(0, 0.5, -1.9, 2.0, 2.6, 2.0, st);
    k.post(0, 0.5, -0.85, 2.0, 0.05, 2.0, '#4a4452', { ink: 0 }); k.post(0, 0.5, -0.9, 0.05, 2.6, 2.0, '#4a4452', { ink: 0 });
    for (const s of [-1, 1]) { k.cyl(s * 1.9, 0.5, 2.9, 0.27, 3.6, st, { geo: GEO.cyl16 }); k.post(s * 1.9, 0.5, 2.9, 0.7, 0.2, 0.7, st2); k.post(s * 1.9, 3.9, 2.9, 0.7, 0.22, 0.7, st2); }
    k.box(0, 4.35, 0.2, 5.6, 0.5, 6.4, st);
    k.add(GEO.prism, 0, 4.6, 0.2, 6.6, 1.6, 6.0, st2, { ry: HALF });
    qs.add(k, 0, 4.35, 3.42, 2.6, 0.62, SLOTS.mausPlaque);
    qs.add(k, 0, 5.08, 3.52, 0.9, 0.9, SLOTS.emblem);
    k.post(0, 0.5, 2.05, 2.5, 2.95, 0.12, '#5a5560');
    k.slot(13);       // inside, once it's open: her tomb, and the watch on it
    k.post(0, 0.5, -0.3, 1.5, 0.75, 0.9, '#d9d2c2'); k.box(0, 1.27, -0.3, 1.6, 0.06, 1.0, '#c9c2b2');
    k.add(GEO.cyl16, 0, 1.33, -0.25, 0.16, 0.04, 0.16, '#f2c94c', { ink: 0.004 });
    k.slot(-1);
    fx.mausGlow = k.world(0, 1.8, 0.4); fx.watch = k.world(0, 1.36, -0.25);
    for (const s of [-1, 1]) {
      k.cyl(s * 3.0, 0.5, 3.1, 0.32, 0.5, st2, { geo: GEO.cyl8 }).ball(s * 3.0, 1.2, 3.1, 0.42, '#4f8a3a', { geo: GEO.ball6 });
      k.post(s * 2.3, -0.1, 5.4, 0.12, 1.6, 0.12, IRON); k.cyl(s * 2.3, 1.5, 5.4, 0.07, 0.25, '#f6efe0', { geo: GEO.cyl8 }); fx.flames.push({ p: k.world(s * 2.3, 1.82, 5.4), slot: -1, s: 1.3 });
      vines(k, s * 2.45, 2.1, 3.4, R, { n: 6 });
    }
    crack(k, -1.6, 3.0, 2.12, R); for (let i = 0; i < 6; i++) k.add(GEO.ico0, (R() - 0.5) * 5, 4.62 + R() * 0.4, (R() - 0.5) * 5, 0.5, 0.08, 0.4, '#6f9a4a', { ink: 0 });
    worldBox(k, out, 0, -0.4, 2.6, 2.6, 'now'); for (const s of [-1, 1]) worldCol(k, out, s * 1.9, 2.9, 0.35, 'now');
    const wx = MAUS.x, wz = MAUS.z;
    out.plat.push({ box: [wx - 3.7, wx + 3.55, wz - 3.5, wz + 3.5], top: CEMY + 0.5, era: 'now' }, { box: [wx + 3.55, wx + 4.25, wz - 1.8, wz + 1.8], top: CEMY + 0.33, era: 'now' }, { box: [wx + 4.25, wx + 4.95, wz - 1.8, wz + 1.8], top: CEMY + 0.16, era: 'now' });
  }
  // the door's two iron leaves: their own little meshes, hinged at the sides (they swing open)
  function mausDoor(group) {
    const leaves = [-1, 1].map(s => {
      const k = Kit(); k.frame(0, 0, 0, 0);
      k.post(-s * 0.55, 0, 0, 1.08, 2.55, 0.08, '#3a3640'); for (let y = 0.4; y < 2.4; y += 0.5) k.box(-s * 0.55, y, 0.05, 0.95, 0.05, 0.03, '#5a5560', { ink: 0 });
      k.add(GEO.torus, -s * 0.85, 1.25, 0.08, 0.08, 0.08, 0.08, '#c9a24e', { ink: 0 });
      const pv = new THREE.Group(); meshesOf(k, pv); const p = new THREE.Group(); p.add(pv);
      const at = V3(s * 1.1, 0.5, 2.15), m = new THREE.Matrix4().makeRotationY(MAUS.rot).setPosition(MAUS.x, CEMY, MAUS.z);
      p.position.copy(at.applyMatrix4(m)); p.rotation.y = MAUS.rot; group.add(p); return { p, s };
    });
    return { leaves, set(k) { leaves.forEach(L => { L.p.rotation.y = MAUS.rot + L.s * k * 1.7; }); } };
  }
  // Baltasar's hut: boards, a mossy roof, an open door, a lit window, his tools, and the book on its lectern by the door
  function drawHut(k, out, now, fx) {
    const plank = now ? '#7a6048' : '#9a7652', R = rng(now ? 71 : 72), roof = now ? '#5d6b5a' : '#7a5236';
    k.frame(HUT.x, CEMY, HUT.z, 0);
    k.post(0, -0.2, 0, 5.4, 0.35, 4.2, '#8f8a80');
    k.post(0, 0.1, 0, 5.2, 2.5, 4.0, plank);
    for (let x = -2.4; x <= 2.41; x += 0.4) for (const z of [2.01, -2.01]) k.box(x, 1.35, z, 0.03, 2.4, 0.02, shade(plank, 0.75), { ink: 0 });
    k.post(-0.9, 0.1, 2.02, 1.0, 2.0, 0.05, '#241c22', { ink: 0 }); k.box(-1.75, 1.1, 2.4, 0.08, 2.0, 0.95, shade(plank, 0.9), { ry: -0.5 });
    win(k, 1.3, 1.5, 2.0, { trim: '#c9b88a', state: 'ok', lit: true, R });
    fx.glows.push(k.world(1.3, 1.5, 2.3));
    gable(k, 5.2, 4.0, 2.6, 0.62, roof, plank, { moss: now, R });
    k.cyl(1.6, 3.1, -0.8, 0.13, 1.2, '#4a4a52', { geo: GEO.cyl8 });
    k.beam(2.75, 0.0, 1.5, 2.65, 1.9, 1.75, 0.06, '#8a6a4a').box(2.72, 0.2, 1.42, 0.3, 0.4, 0.04, '#6a6a72');     // a shovel
    k.beam(-2.75, 0.0, 1.3, -2.68, 1.8, 1.65, 0.05, '#8a6a4a').box(-2.68, 1.85, 1.62, 0.45, 0.06, 0.05, '#6a6a72');  // a rake
    k.cyl(3.0, 0, 0.6, 0.38, 0.85, '#7a5a3a', { geo: GEO.cyl8 }); worldCol(k, out, 3.0, 0.6, 0.42, null);           // the rain barrel
    k.cyl(2.2, 0, 2.5, 0.2, 0.32, '#5f8fb0', { geo: GEO.cyl8 }).beam(2.38, 0.2, 2.5, 2.62, 0.38, 2.5, 0.04, '#5f8fb0');   // a watering can
    for (let i = 0; i < 9; i++) k.cyl(-2.95, 0.15 + (i % 3) * 0.26, -1.2 + (i / 3 | 0) * 0.5, 0.13, 0.9, '#a8784e', { rz: HALF, geo: GEO.cyl6, ink: 0.006 });
    // the lectern with the book
    k.frame(SPOT.ledger.x, CEMY, SPOT.ledger.z, -0.4);
    k.post(0, 0, 0, 0.14, 1.0, 0.14, plank).box(0, 1.08, 0, 0.7, 0.06, 0.5, plank, { rx: 0.35 });
    k.box(-0.16, 1.14, 0.0, 0.32, 0.03, 0.42, '#fdf8ee', { rx: 0.35, rz: 0.06 }).box(0.16, 1.14, 0.0, 0.32, 0.03, 0.42, '#fdf8ee', { rx: 0.35, rz: -0.06 });
    k.box(0, 1.12, 0.06, 0.04, 0.02, 0.5, '#c9443a', { rx: 0.35, ink: 0 });
    k.frame(HUT.x, CEMY, HUT.z, 0);
    solid(out, { obox: 1, x: HUT.x, z: HUT.z, hw: 2.72, hd: 2.12, rot: 0 }, null); solid(out, { x: SPOT.ledger.x, z: SPOT.ledger.z, r: 0.3 }, null);
  }
  function drawCemetery(k, out, qs, ss, fx, now) {
    const R = rng(now ? 91 : 92), B = CEMBOX, G0 = SPOT.cemGate;
    k.frame(0, CEMY, 0, 0);
    if (now) {
      fenceRun(k, out, B.x0, B.zS, B.x1, B.zS, 'now', true); fenceRun(k, out, B.x0, B.zN, B.x1, B.zN, 'now', true); fenceRun(k, out, B.x0, B.zS, B.x0, B.zN, 'now', true);
      fenceRun(k, out, B.x1, B.zS, B.x1, G0.z + 2.6, 'now', true); fenceRun(k, out, B.x1, G0.z - 2.6, B.x1, B.zN, 'now', true);
      // the gate: two pillars with lanterns, an iron arch with the sign, the gates standing open
      k.frame(G0.x, CEMY, G0.z, HALF);
      for (const s of [-1, 1]) { k.post(s * 2.75, 0, 0, 0.75, 2.7, 0.75, STONEC); k.add(GEO.cone4, s * 2.75, 2.7, 0, 0.55, 0.4, 0.55, STONED); k.box(s * 2.75, 3.25, 0, 0.3, 0.42, 0.3, '#f6e7a8', { emissive: 1 }); k.add(GEO.cone4, s * 2.75, 3.46, 0, 0.26, 0.2, 0.26, IRON); fx.flames.push({ p: k.world(s * 2.75, 3.25, 0), slot: -1, s: 2.2, glow: true }); worldBox(k, out, s * 2.75, 0, 0.42, 0.42, 'now'); }
      k.add(GEO.arch, 0, 2.6, 0, 2.4, 1.2, 0.6, IRON);
      ss.add(k, 0, 3.15, 0.07, 3.0, 0.75, SLOTS.cemArch); ss.add(k, 0, 3.15, -0.07, 3.0, 0.75, SLOTS.cemArch, { ry: Math.PI }); k.box(0, 3.15, 0, 3.1, 0.82, 0.08, IRON);
      for (const s of [-1, 1]) {        // each gate leaf, swung open into the cemetery
        k.frame(G0.x - 0.95, CEMY, G0.z + s * 1.95, s > 0 ? 0.32 : Math.PI - 0.32);
        for (let x = -1.0; x <= 1.0; x += 0.2) { k.cyl(x, 0.05, 0, 0.03, 2.0, IRON, { geo: GEO.cyl6, ink: 0 }); k.add(GEO.cone4, x, 2.05, 0, 0.05, 0.14, 0.05, IRON, { ink: 0 }); }
        for (const y of [0.3, 1.0, 1.8]) k.box(0, y, 0, 2.1, 0.06, 0.06, IRON, { ink: 0.004 });
      }
      k.frame(0, CEMY, 0, 0);
      drawMausoleum(k, out, ss, fx);
      QG.forEach(g => drawGrave(k, g, out, qs, fx, false)); FG.forEach(g => drawGrave(k, g, out, qs, fx, false)); OLDG.forEach(g => drawGrave(k, g, out, qs, fx, true));
      { const P = SPOT.obelisk; k.frame(P.x, CEMY, P.z, 0.3); k.post(0, -0.05, 0, 0.9, 0.35, 0.9, STONED); k.add(GEO.cone4, 0, 0.3, 0, 0.62, 1.5, 0.62, '#a9a497', { rz: 0.05 }); k.add(GEO.ico0, 0.1, 0.9, 0.28, 0.28, 0.18, 0.06, '#6f9a4a', { ink: 0 }); solid(out, { x: P.x, z: P.z, r: 0.55 }, 'now'); }
      { const P = SPOT.deadTree; k.frame(P.x, CEMY, P.z, 0.7); k.cyl(0, 0, 0, 0.3, 2.6, '#5a4a40', { geo: GEO.cyl8 }); for (const [a, b, c, d2, e2, f2] of [[0, 2.2, 0, -1.6, 3.4, 0.4], [0, 2.5, 0, 1.4, 3.9, -0.3], [0, 2.0, 0, 0.6, 3.0, 1.4], [-1.0, 2.95, 0.25, -1.8, 3.9, 0.9]]) k.beam(a, b, c, d2, e2, f2, 0.14, '#5a4a40'); solid(out, { x: P.x, z: P.z, r: 0.4 }, 'now'); fx.perches.push(k.world(-1.6, 3.42, 0.4), k.world(1.4, 3.92, -0.3)); }
      { const P = SPOT.bench; k.frame(P.x, CEMY, P.z, Math.PI); k.box(0, 0.48, 0, 1.7, 0.09, 0.5, '#8a6a4a').box(0, 0.85, -0.24, 1.7, 0.4, 0.07, '#8a6a4a', { rx: -0.12 }); for (const s of [-1, 1]) k.post(s * 0.7, 0, 0, 0.1, 0.48, 0.45, IRON); solid(out, { obox: 1, x: P.x, z: P.z, hw: 0.9, hd: 0.32, rot: Math.PI }, 'now'); }
      for (const [x, z] of CYPRESS) { cypress(k, x, z, 0.95 + R() * 0.25, R); solid(out, { x, z, r: 0.5 }, 'now'); }
      fx.perches.push(V3(MAUS.x, CEMY + 6.25, MAUS.z), V3(B.x1, CEMY + 2.1, G0.z - 4.6), V3(HUT.x + 1.0, CEMY + 4.3, HUT.z));
      // gravel: the main path from the gate to the mausoleum, and the two cross paths
      k.frame(0, CEMY, 0, 0);
      k.box((MAUS.x + 4.95 + B.x1) / 2, 0.025, G0.z, B.x1 - MAUS.x - 4.95, 0.04, 2.4, '#d6ccb2', { b: 'flat' });
      for (const px of [-70, -80]) k.box(px, 0.02, (B.zS + B.zN) / 2, 1.6, 0.04, B.zS - B.zN - 3, '#d2c8ae', { b: 'flat' });
      for (let i = 0; i < 70; i++) { const x = lerp(MAUS.x + 5, B.x1, R()), z = G0.z + (R() - 0.5) * 2.2; k.add(GEO.ico0, x, 0.05, z, 0.07, 0.04, 0.06, R() < 0.5 ? '#b9b09a' : '#a8a08c', { b: 'flat' }); }
      for (let i = 0; i < 30; i++) { const x = lerp(B.x0 + 1, B.x1 - 1, R()), z = lerp(B.zN + 1, B.zS - 1, R()); if (Math.abs(z - G0.z) < 2 || keepClearCem(x, z)) continue; weeds(k, x, z, 3, R, { dry: true }); }
      // the fireflies: drifting lights among the graves
      for (let i = 0; i < 26; i++) fx.flies.push(V3(lerp(B.x0 + 2, B.x1 - 2, R()), CEMY + 0.6 + R() * 1.8, lerp(B.zN + 2, B.zS - 2, R())));
    } else {
      // the past: a small plot by the gate with a white picket fence, two old stones, and young cypresses Inés has just planted
      const P = { x0: -74, x1: -56.4, zS: -257, zN: -273 };
      const pick2 = (x1, z1, x2, z2) => { const L = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(x2 - x1, z2 - z1), n = Math.round(L / 0.42); for (let i = 0; i <= n; i++) { const x = lerp(x1, x2, i / n), z = lerp(z1, z2, i / n); k.post(x, 0, z, 0.09, 0.8, 0.09, '#f4efe4', { ink: 0.008, ry }); k.add(GEO.cone4, x, 0.8, z, 0.07, 0.12, 0.07, '#f4efe4', { ink: 0 }); } for (const y of [0.25, 0.55]) k.box((x1 + x2) / 2, y, (z1 + z2) / 2, 0.05, 0.07, L, '#f4efe4', { ink: 0.005, ry }); solid(out, { obox: 1, x: (x1 + x2) / 2, z: (z1 + z2) / 2, hw: 0.12, hd: L / 2, rot: ry }, 'past'); };
      pick2(P.x0, P.zS, P.x1, P.zS); pick2(P.x0, P.zN, P.x1, P.zN); pick2(P.x0, P.zS, P.x0, P.zN); pick2(P.x1, P.zS, P.x1, G0.z + 1.6); pick2(P.x1, G0.z - 1.6, P.x1, P.zN);
      [[-66, -261.4, 'N'], [-62, -261.4, 'N']].forEach(([x, z, face]) => drawGrave(k, { x, z, face, kind: 'ancient', id: 'past' + x }, out, qs, fx, true));
      for (const [x, z] of CYPRESS) { if (x > -60) continue; cypress(k, x, z, 0.32, R); }
      k.frame(0, CEMY, 0, 0); k.box((-56 + -74) / 2, 0.02, G0.z, 17.6, 0.04, 2.0, '#d9cfb6', { b: 'flat' });
      k.frame(-80.6, CEMY, -274.6, 0.3); k.post(0, 0.3, 0, 0.9, 0.4, 1.3, '#b07a48'); k.add(GEO.cyl16, 0, 0.3, 0.75, 0.3, 0.08, 0.3, '#5a4636', { rz: HALF });       // Inés's wheelbarrow
      for (let i = 0; i < 4; i++) k.cyl(-0.2 + i * 0.12, 0.6, -0.2 + (i % 2) * 0.3, 0.12, 0.4, '#5fae4f', { geo: GEO.cyl6 });
      solid(out, { obox: 1, x: -80.6, z: -274.6, hw: 0.6, hd: 0.8, rot: 0.3 }, 'past');
    }
    drawHut(k, out, now, fx);
  }
  const keepClearCem = (x, z) => [...QG, ...FG, ...OLDG].some(g => Math.abs(g.x - x) < 1.2 && Math.abs(g.z - z) < 2.2) || obbOut(MAUS, x, z) < 4 || obbOut(HUT, x, z) < 1.5 || Math.abs(x + 70) < 1 || Math.abs(x + 80) < 1;

  // ---------------------------------------------------------------- people: one merged mesh and its ink each, in the townsfolk's style
  const BODY = new THREE.LatheGeometry([[0, 0], [0.38, 0.02], [0.37, 0.3], [0.28, 0.68], [0.2, 0.9], [0.1, 0.97], [0, 0.98]].map(([x, y]) => new THREE.Vector2(x, y)), 14);
  const CAP = new THREE.SphereGeometry(1, 14, 7, 0, TAU, 0, Math.PI * 0.5);
  function personKit(o) {
    const k = Kit(), W = o.wide || 1, y0 = o.seat ? 0.4 : 0, bh = o.seat ? 0.72 : 1, hy = y0 + 0.98 * bh + 0.2;
    k.frame(0, 0, 0, 0);
    if (o.seat) {      // a rocking chair: runners, seat, back; legs forward, shoes
      for (const s of [-1, 1]) { k.beam(s * 0.3, 0.06, -0.55, s * 0.3, 0.02, 0.0, 0.06, '#8a6a4a').beam(s * 0.3, 0.02, 0.0, s * 0.3, 0.08, 0.5, 0.06, '#8a6a4a'); k.post(s * 0.3, 0.05, 0.25, 0.06, 0.38, 0.06, '#8a6a4a'); k.post(s * 0.3, 0.05, -0.32, 0.06, 1.25, 0.06, '#8a6a4a'); }
      k.box(0, 0.42, -0.02, 0.72, 0.07, 0.6, '#a8784e'); for (let i = 0; i < 4; i++) k.box(-0.21 + i * 0.14, 0.95, -0.34, 0.08, 0.8, 0.04, '#a8784e', { rx: -0.12 });
      for (const s of [-1, 1]) { k.beam(s * 0.11, 0.48, 0.15, s * 0.12, 0.3, 0.42, 0.11, o.dress); k.ball(s * 0.12, 0.08, 0.5, 0.09, '#4a3a33', { rz2: 0.14, ry2: 0.06 }); k.beam(s * 0.12, 0.32, 0.42, s * 0.12, 0.1, 0.46, 0.08, o.legs || '#5a4a44'); }
    }
    k.add(BODY, 0, y0, 0, W, bh, W, o.dress);
    if (o.apron) k.add(GEO.ball, 0, y0 + 0.42 * bh, 0.26 * W, 0.24, 0.32 * bh, 0.08, o.apron, { ink: 0.01 });
    if (o.shawl) k.add(GEO.torus, 0, y0 + 0.86 * bh, 0, 0.27, 0.27, 0.6, o.shawl, { rx: HALF });
    if (o.vest) k.add(GEO.ball, 0, y0 + 0.62 * bh, 0.12, 0.28, 0.3 * bh, 0.24, o.vest, { ink: 0.01 });
    const arm = o.seat ? [[0.25, 0.84, 0.04, 0.2, 0.62, 0.3], [0.25, 0.84, 0.04, 0.2, 0.62, 0.3]] : [[0.25, 0.86, 0.04, 0.33, 0.56, 0.16], [0.25, 0.86, 0.04, 0.33, 0.56, 0.16]];
    [-1, 1].forEach((s, i) => { const [ax, ay, az, bx, by, bz] = arm[i]; k.beam(s * ax * W, y0 + ay * bh, az, s * bx * W, y0 + by * bh, bz, 0.13, o.sleeve || o.dress); k.ball(s * bx * W, y0 + by * bh - 0.03, bz + 0.02, 0.075, o.skin); });
    k.add(GEO.ball, 0, hy, 0, 0.28, 0.27, 0.27, o.skin);
    if (o.hairdo === 'bald') for (const s of [-1, 1]) k.add(GEO.ball6, s * 0.24, hy - 0.01, -0.07, 0.08, 0.11, 0.13, o.hair, { ink: 0.008 });
    else k.add(CAP, 0, hy + 0.02, -0.02, 0.29, 0.29, 0.29, o.hair, { rx: -0.5 });
    if (o.hairdo === 'bun') k.ball(0, hy + 0.22, -0.2, 0.12, o.hair);
    if (o.hairdo === 'tails') for (const s of [-1, 1]) k.ball(s * 0.3, hy - 0.02, -0.06, 0.1, o.hair, { ry2: 0.17 });
    for (const s of [-1, 1]) {
      k.add(GEO.ball6, s * 0.1, hy + 0.01, 0.235, 0.04, 0.06, 0.03, '#2b2235', { ink: 0 });
      k.add(GEO.ball6, s * 0.1 + 0.013, hy + 0.035, 0.258, 0.014, 0.014, 0.01, '#ffffff', { ink: 0 });
      k.add(GEO.ball6, s * 0.17, hy - 0.09, 0.222, 0.05, 0.028, 0.015, '#ff9aa6', { ink: 0 });
    }
    k.add(GEO.ball6, 0, hy - 0.11, 0.265, 0.035, 0.012, 0.01, '#2b2235', { ink: 0 });
    if (o.glasses) for (const s of [-1, 1]) k.add(GEO.ring, s * 0.1, hy + 0.01, 0.258, 0.068, 0.068, 0.068, '#2b2235', { ink: 0 });
    if (o.stache) for (const s of [-1, 1]) k.ball(s * 0.07, hy - 0.08, 0.255, 0.075, o.hair2 || '#e8e4dc', { ry2: 0.035, rz2: 0.045, ink: 0.006 });
    if (o.beard) k.ball(0, hy - 0.16, 0.16, 0.17, o.hair2 || '#e8e4dc', { ry2: 0.15, rz2: 0.12 });
    const hc = o.hatColor;
    if (o.hat === 'flat') { k.add(GEO.cyl16, 0, hy + 0.24, 0.02, 0.27, 0.08, 0.27, hc || '#6b5a4a', { rx: -0.12 }); k.box(0, hy + 0.21, 0.25, 0.3, 0.03, 0.16, hc || '#6b5a4a', { rx: 0.2 }); }
    if (o.hat === 'straw') { k.add(GEO.cyl16, 0, hy + 0.25, 0, 0.5, 0.035, 0.5, '#e8c57a'); k.add(GEO.half, 0, hy + 0.26, 0, 0.22, 0.2, 0.22, '#e8c57a'); k.add(GEO.cyl16, 0, hy + 0.3, 0, 0.225, 0.05, 0.225, hc || '#e05a4b', { ink: 0 }); }
    if (o.hat === 'cap') { k.add(GEO.half, 0, hy + 0.12, 0, 0.3, 0.2, 0.3, hc || '#3d5fa1'); k.box(0, hy + 0.13, 0.27, 0.3, 0.025, 0.18, hc || '#3d5fa1'); }
    if (o.hat === 'beret') k.add(GEO.ball, 0.05, hy + 0.25, -0.02, 0.27, 0.08, 0.27, hc || '#7a4fa0', { rz: 0.2 });
    if (o.hat === 'scarf') k.add(GEO.half, 0, hy + 0.04, -0.02, 0.31, 0.3, 0.31, hc || '#c9553f', { rx: -0.35 });
    if (o.hat === 'chef') { k.add(GEO.cyl16, 0, hy + 0.28, 0, 0.22, 0.14, 0.22, '#ffffff'); k.ball(0, hy + 0.42, 0, 0.27, '#ffffff', { ry2: 0.16 }); }
    const hand = (s) => V3(s * (o.seat ? 0.2 : 0.33) * W, y0 + (o.seat ? 0.59 : 0.53) * bh, o.seat ? 0.32 : 0.18);
    const p = o.prop, R = hand(1), L = hand(-1);
    if (p === 'lantern') { k.box(R.x, R.y - 0.25, R.z + 0.05, 0.2, 0.26, 0.2, '#f6e7a8', { emissive: 1 }); k.box(R.x, R.y - 0.1, R.z + 0.05, 0.24, 0.05, 0.24, '#2f3440'); k.box(R.x, R.y - 0.4, R.z + 0.05, 0.24, 0.05, 0.24, '#2f3440'); }
    if (p === 'broom') k.beam(L.x, -0.05, L.z + 0.25, L.x + 0.1, 1.5, L.z - 0.1, 0.05, '#8a6a4a').add(GEO.cone6, L.x, 0.12, L.z + 0.28, 0.16, 0.36, 0.1, '#d9b85a', { rx: 0.2 });
    if (p === 'knit') { k.ball(0, y0 + 0.48, 0.32, 0.12, '#c9443a'); k.beam(-0.1, y0 + 0.5, 0.3, 0.18, y0 + 0.62, 0.36, 0.015, '#d9d2c4', { ink: 0 }); }
    if (p === 'bread') k.ball(R.x - 0.05, R.y + 0.05, R.z + 0.08, 0.17, '#d99a4e', { ry2: 0.1, rz2: 0.11 });
    if (p === 'mailbag') { k.box(0.3 * W, y0 + 0.45, 0.05, 0.16, 0.34, 0.42, '#8a5f3e'); k.beam(-0.2, y0 + 0.95, 0.12, 0.3, y0 + 0.62, 0.05, 0.04, '#6f4a30'); k.box(0.36 * W, y0 + 0.66, 0.05, 0.03, 0.12, 0.2, '#fdf8ee', { ink: 0 }); }
    if (p === 'book') k.box(R.x - 0.05, R.y + 0.05, R.z + 0.06, 0.2, 0.26, 0.05, '#b84a3a', { ry: -0.4 });
    if (p === 'flowers') for (let i = 0; i < 5; i++) k.add(GEO.ico0, R.x + (i - 2) * 0.06, R.y + 0.18 + (i % 2) * 0.05, R.z + 0.05, 0.07, 0.07, 0.07, ['#ff8fb1', '#ffd84a', '#ffffff'][i % 3], { ink: 0 });
    if (p === 'baton') k.beam(R.x, R.y, R.z, R.x + 0.05, R.y + 0.35, R.z + 0.2, 0.025, '#fdf8ee', { ink: 0 });
    if (p === 'sewing') k.box(0, y0 + 0.52, 0.34, 0.42, 0.04, 0.3, '#c9443a', { rx: 0.2 });
    if (p === 'can') k.cyl(R.x + 0.05, R.y - 0.25, R.z + 0.05, 0.13, 0.22, '#5f8fb0', { geo: GEO.cyl8 });
    if (p === 'bell') k.add(GEO.half, R.x, R.y + 0.02, R.z + 0.05, 0.1, -0.16, 0.1, '#e8b83e');
    return { k, top: (hy + 0.3) * (o.h || 1) };
  }
  // a person in the world: { g, body, gray, api } (api: what STORY.sayInline and main.js read: x, z, y, top, name, talking…)
  function makePerson(def, parent) {
    const { k, top } = personKit(def.look), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const gray = { value: def.gray || 0 };
    const geo = bake(k.B.solid), hull = bake(k.B.solid, { hull: true });
    const m = new THREE.Mesh(geo, toonM({ vc: true, rim: 0.3, fade: true, gray })); m.castShadow = true; body.add(m);
    if (hull) body.add(new THREE.Mesh(hull, inkM({ fade: true })));
    const y = gyOf(def.x, def.z) + (def.dy || 0);
    g.position.set(def.x, y, def.z); g.rotation.y = def.yaw || 0; g.scale.setScalar(def.look.h || 1); parent.add(g);
    if (def.look.prop === 'lantern') { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd76a', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(1.1); s.position.set(0.33 * (def.look.wide || 1), 0.28, 0.23); body.add(s); g.userData.glow = s; }
    const api = { id: def.id, name: def.name, x: def.x, z: def.z, y, top, talking: false, hushed: !!def.hushed, kid: !!def.look.kid, era: def.era, def, yaw: def.yaw || 0 };
    return { g, body, gray, api, def, ph: hash(def.id) % 100 / 16 };
  }
  // ---------------------------------------------------------------- the memories: little glowing ghosts, each with a hint of who they were
  const WISP_BODY = (() => {
    const g = new THREE.LatheGeometry([[0, 0.95], [0.17, 0.92], [0.28, 0.8], [0.33, 0.6], [0.33, 0.38], [0.31, 0.18], [0.35, 0.02]].map(([x, y]) => new THREE.Vector2(x, y)), 18);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < 0.05) { const a = Math.atan2(p.getZ(i), p.getX(i)); p.setY(i, p.getY(i) + Math.sin(a * 6) * 0.06); }
    g.computeVertexNormals(); return g;
  })();
  function makeWisp(q, parent) {
    const k = Kit(); k.frame(0, 0, 0, 0);
    k.add(WISP_BODY, 0, 0, 0, 1, 1, 1, mix(q.tint, '#ffffff', 0.55), { ink: 0 });
    for (const s of [-1, 1]) { k.add(GEO.ball6, s * 0.11, 0.62, 0.285, 0.045, 0.065, 0.03, '#3a3550', { ink: 0 }); k.add(GEO.ball6, s * 0.11 + 0.014, 0.645, 0.305, 0.014, 0.014, 0.01, '#ffffff', { ink: 0 }); k.add(GEO.ball6, s * 0.19, 0.5, 0.27, 0.05, 0.026, 0.015, '#ff8fb1', { ink: 0 }); }
    k.add(GEO.arch, 0, 0.52, 0.31, 0.05, -0.04, 0.03, '#3a3550', { ink: 0 });
    const a = q.id;
    if (a === 'elena') { k.add(GEO.cyl16, 0, 0.98, 0, 0.18, 0.12, 0.18, '#ffffff', { ink: 0 }); k.ball(0, 1.12, 0, 0.22, '#ffffff', { ry2: 0.12, ink: 0 }); }
    if (a === 'julian') for (const s of [-1, 1]) k.add(GEO.ring, s * 0.11, 0.62, 0.3, 0.075, 0.075, 0.075, '#3a3550', { ink: 0 });
    if (a === 'felix') { k.add(GEO.ball, 0.05, 0.96, -0.02, 0.24, 0.07, 0.24, '#7a4fa0', { rz: 0.25, ink: 0 }); k.add(GEO.ball6, 0, 0.43, 0.31, 0.07, 0.04, 0.02, '#2b2235', { ink: 0 }); }
    if (a === 'clara') { k.add(GEO.torus, 0, 0.42, 0, 0.3, 0.3, 0.3, '#ffd84a', { rx: HALF, ink: 0 }); k.add(GEO.cyl8, 0.18, 0.92, 0, 0.07, 0.12, 0.07, '#e2453a', { ink: 0 }); }
    if (a === 'mateo') { k.add(GEO.half, 0, 0.88, 0, 0.25, 0.15, 0.25, '#3d5fa1', { ink: 0 }); k.box(0, 0.89, 0.22, 0.24, 0.02, 0.14, '#3d5fa1', { ink: 0 }); }
    if (a === 'ines') for (let i = 0; i < 5; i++) { const t = i / 5 * TAU; k.add(GEO.ico0, 0.14 + Math.cos(t) * 0.06, 0.93 + Math.sin(t) * 0.06, 0.12, 0.05, 0.05, 0.03, '#ff8fb1', { ink: 0 }); }
    if (a === 'aurora') { k.ball(0, 1.0, -0.12, 0.13, '#f4f1ea', { ink: 0 }); k.beam(0.3, 0.45, 0.15, 0.42, 0.75, 0.3, 0.02, '#fdf8ee', { ink: 0 }); }
    const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.86, depthWrite: false });
    const g = new THREE.Group(), m = new THREE.Mesh(bake(k.B.solid), mat); g.add(m);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: q.tint, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(2.3); glow.position.y = 0.5; g.add(glow);
    g.visible = false; parent.add(g);
    const f = q.face === 'N' ? -1 : q.face === 'S' ? 1 : 0, ex = q.face === 'E' ? 1 : q.face === 'W' ? -1 : 0;
    const home = q.id === 'aurora' ? { x: SPOT.mausDoor.x + 1.6, z: SPOT.mausDoor.z } : { x: q.x + ex * 0.9, z: q.z + f * 1.0 };
    return { g, m, mat, glow, q, home, x: home.x, z: home.z, y: CEMY + 1.3, k: 0, api: { name: '', x: home.x, z: home.z, y: CEMY + 1.3, top: 1.0, talking: false } };
  }
  // ---------------------------------------------------------------- crows: three that perch and flap off when you come close, and one with a photo
  function makeCrow(parent, photo) {
    const k = Kit(), B = '#3a3546', B2 = '#2b2638';
    k.frame(0, 0, 0, 0);
    k.add(GEO.ball6, 0, 0.17, 0, 0.15, 0.13, 0.24, B); k.add(GEO.ball6, 0, 0.32, 0.15, 0.1, 0.1, 0.1, B);
    k.add(GEO.cone6, 0, 0.31, 0.29, 0.032, 0.13, 0.032, '#d8a84a', { rx: HALF, ink: 0.004 });
    for (const s of [-1, 1]) { k.add(GEO.ball6, s * 0.055, 0.35, 0.22, 0.022, 0.022, 0.022, '#ffffff', { ink: 0 }); k.add(GEO.ball6, s * 0.058, 0.352, 0.236, 0.011, 0.011, 0.011, '#111111', { ink: 0 }); k.add(GEO.ball6, s * 0.13, 0.18, -0.02, 0.05, 0.1, 0.2, B2, { rx: 0.2 }); k.add(GEO.cyl6, s * 0.05, 0.03, 0.02, 0.012, 0.08, 0.012, '#d8a84a', { ink: 0 }); }
    for (const a of [-0.25, 0, 0.25]) k.add(GEO.box, Math.sin(a) * 0.05, 0.16, -0.3, 0.07, 0.025, 0.2, B2, { rx: 0.15, ry: a });
    if (photo) k.add(GEO.box, 0, 0.29, 0.38, 0.17, 0.12, 0.01, '#fdf8ee', { rx: -0.25, ink: 0.004, slot: 15 });
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body); meshesOf(k, body, { cast: true }); g.scale.setScalar(1.25); parent.add(g);
    return { g, body, mode: 'sit', t: 0, photo };
  }
  // the swing under the old oak: one rope now (the seat hangs crooked), two then (and it swings)
  function makeSwing(parent, at, now) {
    const k = Kit(); k.frame(0, 0, 0, 0);
    if (now) { k.cyl(0, -2.2, 0, 0.02, 2.2, '#c9b88a', { geo: GEO.cyl6, ink: 0 }); k.box(0.08, -2.45, 0, 0.12, 0.6, 0.32, '#8a6a4a', { rz: 0.2 }); }
    else { for (const s of [-1, 1]) k.cyl(0, -2.35, s * 0.32, 0.02, 2.35, '#c9b88a', { geo: GEO.cyl6, ink: 0 }); k.box(0, -2.38, 0, 0.3, 0.07, 0.75, '#a8784e'); }
    const g = new THREE.Group(); meshesOf(k, g); g.position.set(at.x, at.y, at.z); parent.add(g);
    return g;
  }
  // glowing points (candle flames, lanterns, fireflies, dust in a beam): one draw call per kind. Flames with a slot only
  // shine while it's on (the candle on a grave whose name is back)
  function pointsOf(list, o, parent) {
    if (!list.length) return null;
    const n = list.length, pos = new Float32Array(n * 3), size = new Float32Array(n), ph = new Float32Array(n), slot = new Float32Array(n), col = new Float32Array(n * 3), c = new THREE.Color();
    list.forEach((it, i) => { pos.set([it.p.x, it.p.y, it.p.z], i * 3); size[i] = (it.s || 1) * (o.size || 0.5); ph[i] = (i * 0.618) % 1; slot[i] = it.slot === undefined ? -1 : it.slot; c.set(it.color || o.color || '#ffd27a'); col.set([c.r, c.g, c.b], i * 3); });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
    g.setAttribute('aSlot', new THREE.BufferAttribute(slot, 1)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uMask: U.uMask, uTex: { value: o.tex }, uScale: PSCALE, uDrift: { value: o.drift || 0 } },
      vertexShader: `attribute float aSize; attribute float aPhase; attribute float aSlot; attribute vec3 color;
        uniform float uTime; uniform float uMask[16]; uniform float uScale; uniform float uDrift; varying vec3 vCol; varying float vOn;
        void main() {
          float on = aSlot < -0.5 ? 1.0 : uMask[int(aSlot + 0.5)];
          vec3 p = position;
          float fl = 0.88 + 0.12 * sin(uTime * 11.0 + aPhase * 6.28) + 0.06 * sin(uTime * 23.0 + aPhase * 17.0);
          if (uDrift > 0.5) { p += vec3(sin(uTime * 0.37 + aPhase * 7.0) * 0.9, sin(uTime * 0.51 + aPhase * 3.0) * 0.45, cos(uTime * 0.29 + aPhase * 5.0) * 0.9) * uDrift; fl = 0.35 + 0.65 * max(0.0, sin(uTime * 1.7 + aPhase * 11.0)); }
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * fl * uScale / max(0.2, -mv.z) * on;
          gl_Position = projectionMatrix * mv; vCol = color; vOn = on * fl;
        }`,
      fragmentShader: `uniform sampler2D uTex; varying vec3 vCol; varying float vOn;
        void main() { vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vCol * t.rgb, t.a * min(1.0, vOn)); if (gl_FragColor.a < 0.01) discard; }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; parent.add(pts);
    return pts;
  }
  const PSCALE = { value: 700 };
  // flat decals on the ground (the gray stains under the faded graves and around Baltasar): one mesh, masked per slot
  function stainsOf(list, parent) {
    if (!list.length) return null;
    const pos = [], uv = [], slot = [];
    for (const s of list) {
      const y = gyOf(s.x, s.z) + 0.05, r = s.r;
      const P = [[-r, -r, 0, 0], [r, -r, 1, 0], [r, r, 1, 1], [-r, r, 0, 1]];
      for (const i of [0, 2, 1, 0, 3, 2]) { pos.push(s.x + P[i][0], y, s.z + P[i][1]); uv.push(P[i][2], P[i][3]); slot.push(s.slot); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aSlot', new THREE.Float32BufferAttribute(slot, 1));
    const mat = new THREE.MeshBasicMaterial({ map: smallTex().stain, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    mat.onBeforeCompile = patch({}); mat.customProgramCacheKey = () => 'cem-stain';
    const m = new THREE.Mesh(g, mat); m.renderOrder = 2; parent.add(m); return m;
  }

  // ---------------------------------------------------------------- the brick roads: 3D bricks (one instanced mesh) on a strip of dirt.
  // Now: worn (missing, sunken, tilted, mossy, weeds in the gaps). Then: new, neat rows.
  function buildRoads(parent, now) {
    const R = rng(now ? 811 : 812), list = [], k = Kit();
    const PAL = now ? ['#a8604a', '#9c5644', '#b26a50', '#975040', '#ab6750', '#9f5d4a'] : ['#c8613f', '#d06a46', '#c55c3c', '#d27650'];
    for (const key of ['main', 'left', 'right', 'beyond']) {
      const r = ROADS[key], w = r.w, rows = Math.floor(r.len / 0.23), miss0 = now ? { main: 0.07, left: 0.15, right: 0.2, beyond: 0.3 }[key] : 0;
      for (let i = 0; i <= rows; i++) {
        const s = i * 0.23, a = r.at(s), nx = -a.uz, nz = a.ux, off = (i % 2) * 0.215, ry = Math.atan2(a.ux, a.uz);
        for (let u = -w / 2 + off; u < w / 2; u += 0.43) {
          const c = u + 0.2; if (Math.abs(c) > w / 2) continue;
          const x = a.x + nx * c, z = a.z + nz * c, edge = Math.abs(c) > w / 2 - 0.5;
          if (inBox(SQUARE, x, z, key === 'main' ? 0.0 : 0.15)) continue;
          if (now && R() < miss0 + (edge ? 0.2 : 0)) continue;
          list.push({ x, z, ry, edge, key });
        }
      }
    }
    for (let z = SQUARE.zS - 0.12, row = 0; z > SQUARE.zN + 0.05; z -= 0.23, row++) for (let x = SQUARE.x0 + 0.2 + (row % 2) * 0.215; x < SQUARE.x1 - 0.15; x += 0.43) {
      const edge = x < SQUARE.x0 + 0.6 || x > SQUARE.x1 - 0.6 || z > SQUARE.zS - 0.5 || z < SQUARE.zN + 0.5;
      if (now && R() < (edge ? 0.28 : 0.08)) continue;
      list.push({ x, z, ry: 0, edge, key: 'square' });
    }
    const n = list.length, im = new THREE.InstancedMesh(GEO.box, new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad }), n * (now ? 1 : 1));
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color(), pos = V3(0, 0, 0), sc = V3(1, 1, 1);
    list.forEach((b, i) => {
      let y = gyOf(b.x, b.z) + 0.035, rx = 0, rz = 0, len = 0.4;
      col.set(pick(PAL, R)).multiplyScalar(0.9 + R() * 0.2);
      if (now) {
        if (R() < 0.12) y -= 0.03 + R() * 0.05;                                   // sunken
        if (R() < 0.28) { rx = (R() - 0.5) * 0.16; rz = (R() - 0.5) * 0.16; }      // tilted
        if (R() < (b.edge ? 0.3 : 0.12)) col.lerp(new THREE.Color('#6f8f45'), 0.35 + R() * 0.3);   // moss
        if (R() < 0.05) len = 0.19;                                               // cracked in half
        if (b.edge && R() < 0.3) { b.x += (R() - 0.5) * 0.12; b.z += (R() - 0.5) * 0.12; }
      }
      q.setFromEuler(e.set(rx, b.ry + (now ? (R() - 0.5) * 0.06 : 0), rz, 'YXZ'));
      im.setMatrixAt(i, m4.compose(pos.set(b.x, y, b.z), q, sc.set(len, 0.085, 0.2))); im.setColorAt(i, col);
    });
    im.receiveShadow = true; im.castShadow = false; im.frustumCulled = false; parent.add(im);
    // the dirt under the bricks, and (now) weeds in the gaps and a few loose bricks in the grass
    k.frame(0, 0, 0, 0);
    const dirt = now ? '#7a6550' : '#9a8466', strip = (r, w) => { for (let s = 0; s < r.len - 0.3; s += 0.8) { const a = r.at(s + 0.4), y = gyOf(a.x, a.z) + 0.012, sx = inBox(SQUARE, a.x, a.z, 0.2); if (sx) continue; k.add(GEO.box, a.x, y, a.z, w - 0.25, 0.02, 0.86, dirt, { b: 'flat', ry: Math.atan2(a.ux, a.uz) }); } };
    for (const key of ['main', 'left', 'right', 'beyond']) strip(ROADS[key], ROADS[key].w);
    k.add(GEO.box, (SQUARE.x0 + SQUARE.x1) / 2, SQY + 0.012, (SQUARE.zS + SQUARE.zN) / 2, SQUARE.x1 - SQUARE.x0 - 0.2, 0.02, SQUARE.zS - SQUARE.zN - 0.2, dirt, { b: 'flat' });
    if (now) {
      for (let i = 0; i < 150; i++) { const b = list[(R() * n) | 0]; weeds(k, b.x + (R() - 0.5) * 0.4, b.z + (R() - 0.5) * 0.4, 2 + ((R() * 3) | 0), R, { y: gyOf(b.x, b.z), h: 0.35, spread: 0.12 }); }
      for (let i = 0; i < 26; i++) { const key = pick(['main', 'left', 'right'], R), r = ROADS[key], a = r.at(R() * r.len), side = R() < 0.5 ? -1 : 1, o = r.w / 2 + 0.3 + R() * 0.8, x = a.x - a.uz * side * o, z = a.z + a.ux * side * o; if (inBox(SQUARE, x, z, 0.5)) continue; k.add(GEO.box, x, gyOf(x, z) + 0.05, z, 0.4, 0.085, 0.2, pick(PAL, R), { ry: R() * 3, rz: (R() - 0.5) * 0.4, ink: 0.004 }); }
    }
    meshesOf(k, parent, { cast: false, fade: false });
    return im;
  }

  // ================================================================ build: everything north of the gate, in the era it's in
  let gyOf = (x, z) => ground(x, z, natural(x, z));
  let BUILT = null;
  const NOW_PEOPLE = [
    { id: 'baltasar', name: 'Baltasar', x: SPOT.baltasar.x, z: SPOT.baltasar.z, yaw: HALF, era: 'now', gray: 0.75,
      look: { skin: '#e6b48c', hair: '#d8d4cc', hairdo: 'bald', stache: true, dress: '#4f6b52', sleeve: '#4f6b52', hat: 'flat', hatColor: '#5a5048', h: 1.12, wide: 0.9, prop: 'lantern' } },
    { id: 'tina', name: { es: 'Doña Tina', pt: 'Dona Tina', de: 'Oma Tina' }, x: SPOT.tina.x, z: SPOT.tina.z, yaw: HALF, era: 'now', dy: 0.22,
      look: { seat: true, skin: '#efc29a', hair: '#f4f1ea', hairdo: 'bun', dress: '#8a5a9a', shawl: '#d9c4e0', glasses: true, prop: 'knit' } },
    { id: 'lia', name: 'Lía', x: SPOT.lia.x, z: SPOT.lia.z, yaw: -HALF, era: 'now', look: { kid: true, skin: '#c98e62', hair: '#3a2b26', hairdo: 'tails', dress: '#f2c14e', h: 0.75 } },
  ];
  const PAST_PEOPLE = [
    { id: 'elena', name: 'Elena', x: -16.3, z: -212.6, yaw: HALF, look: { skin: '#f0c7a0', hair: '#5a3a26', hairdo: 'bun', dress: '#e8d4b0', apron: '#ffffff', hat: 'scarf', hatColor: '#d0663f', prop: 'bread' } },
    { id: 'julian', name: 'Julián', x: -5.0, z: -201.6, yaw: -HALF, look: { skin: '#e6b48c', hair: '#3a2b26', dress: '#4f5f7a', vest: '#8a6a4a', glasses: true, prop: 'book', h: 1.08 } },
    { id: 'clara', name: 'Clara', x: -4.6, z: -222.4, yaw: -HALF, look: { seat: true, skin: '#efc29a', hair: '#a8442e', hairdo: 'bun', dress: '#c9443a', prop: 'sewing' } },
    { id: 'mateo', name: 'Mateo', x: -7.7, z: -208.6, yaw: -1.2, look: { skin: '#c98e62', hair: '#2e2420', dress: '#3d5fa1', hat: 'cap', hatColor: '#2f4f8a', prop: 'mailbag', stache: true, hair2: '#2e2420', h: 1.05 } },
    { id: 'felix', name: 'Félix', x: -8.6, z: -230.2, yaw: 0.5, look: { skin: '#a8714a', hair: '#1f1a18', dress: '#2b2235', vest: '#7a4fa0', hat: 'beret', hatColor: '#7a4fa0', h: 1.06 } },
    { id: 'aurora', name: 'Aurora', x: -12.4, z: -232.6, yaw: 0.1, look: { skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'bun', dress: '#5c4a7a', shawl: '#e8b83e', prop: 'baton', h: 1.05 } },
    { id: 'pilar', name: 'Pilar', x: -17.6, z: -232.0, yaw: -0.2, look: { skin: '#e6b48c', hair: '#8a6a4a', hairdo: 'tails', dress: '#3e8f8a', apron: '#fdf8ee', prop: 'bell' } },
    { id: 'ines', name: { es: 'Inés', pt: 'Inês', de: 'Inés' }, x: -78.8, z: -272.6, yaw: 0.6, look: { skin: '#dcae86', hair: '#4a3020', hat: 'straw', hatColor: '#4f9a5a', dress: '#6f8a4a', apron: '#a8784e', prop: 'can' } },
    { id: 'baltasar', name: 'Baltasar', x: -76.4, z: -270.3, yaw: -0.9, look: { kid: true, skin: '#e6b48c', hair: '#3a2b26', dress: '#4f6b52', hat: 'flat', hatColor: '#5a5048', h: 0.88, prop: 'flowers' } },
    { id: 'tina', name: 'Tina', x: 0.6, z: -199.2, yaw: -HALF, look: { kid: true, skin: '#efc29a', hair: '#6b3b25', hairdo: 'tails', dress: '#c43c3c', h: 0.8 } },
  ];
  // one era's things: { group, parts (quarter, hall, cemetery, road), people, crows, fx… }
  function buildEra(root, now, out) {
    const group = new THREE.Group(); group.name = 'north-' + (now ? 'now' : 'then'); root.add(group);
    const fx = { smoke: [], glows: [], flames: [], flies: [], perches: [], stains: [], bunting: null };
    const parts = { quarter: new THREE.Group(), hall: new THREE.Group(), cemetery: new THREE.Group(), road: new THREE.Group() };
    Object.values(parts).forEach(p => group.add(p));
    out.era = now ? 'now' : 'past';
    // the Old Quarter and the forecourt's signpost, the north gate, the path's trees
    { const k = Kit(), q = Quads();
      for (const h of HOUSES) drawHouse(k, h, now, out, q);
      drawQuarterProps(k, out, q, now, fx); drawSignpost(k, out, q, now); drawNorthGate(k, out, q, now);
      for (const t of PATH_TREES) { drawTree(k, t, gyOf(t.x, t.z)); if (now) solid(out, { x: t.x, z: t.z, r: t.kind === 'oak' ? 0.42 : 0.3 }, null); }
      meshesOf(k, parts.quarter); q.mesh(SIGN.tex, parts.quarter); }
    { const k = Kit(), q = Quads(); drawHall(k, now, out, q, fx); meshesOf(k, parts.hall); q.mesh(SIGN.tex, parts.hall); }
    { const k = Kit(), qs = Quads(), ss = Quads(); drawCemetery(k, out, qs, ss, fx, now); meshesOf(k, parts.cemetery); qs.mesh(STONE.tex, parts.cemetery); ss.mesh(SIGN.tex, parts.cemetery); }
    buildRoads(parts.road, now);
    const T = smallTex();
    const E = { group, parts, fx, people: [], crows: [], wisps: [], swing: makeSwing(parts.quarter, fx.swing, now) };
    pointsOf(fx.flames, { tex: T.flame, size: 0.45, color: '#ffc864' }, parts.cemetery);
    pointsOf(fx.glows.map(p => ({ p, s: 2.6 })), { tex: TK.glowTex, size: 0.9, color: '#ffd27a' }, parts.hall);
    if (fx.flies.length) pointsOf(fx.flies.map(p => ({ p, s: 0.35 })), { tex: TK.glowTex, size: 0.6, color: '#d8ff8a', drift: 1 }, parts.cemetery);
    if (now) {
      E.stains = stainsOf(fx.stains.concat([{ x: SPOT.baltasar.x, z: SPOT.baltasar.z, slot: 14, r: 2.2 }]), parts.cemetery);
      // the light falling through the theater's roof onto the music stand, and the dust in it
      const st = fx.stand, beamM = new THREE.MeshBasicMaterial({ map: T.beam, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      for (let i = 0; i < 2; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 8.6), beamM); m.position.set(st.x - 1.1, st.y + 3.5, st.z - 0.1); m.rotation.set(0, i * HALF + 0.3, -0.26); parts.hall.add(m); }
      const motes = []; for (let i = 0; i < 18; i++) motes.push({ p: V3(st.x - 1.1 + (Math.random() - 0.5) * 1.2, st.y + Math.random() * 5, st.z + (Math.random() - 0.5) * 1.2), s: 0.18 });
      E.dust = pointsOf(motes, { tex: TK.glowTex, size: 0.5, color: '#fff2c0', drift: 0.25 }, parts.hall);
      E.people = NOW_PEOPLE.map(d => makePerson(d, d.id === 'baltasar' ? parts.cemetery : parts.quarter));
      E.wisps = QG.concat([{ id: 'aurora', tint: '#e6e2ff', face: 'E', x: MAUS.x, z: MAUS.z }]).map(q => makeWisp(q, parts.cemetery));
      E.crows = fx.perches.map((p, i) => Object.assign(makeCrow(parts.cemetery, false), { perch: p, i }));
      const pc = Object.assign(makeCrow(parts.cemetery, true), { perch: V3(SPOT.obelisk.x, CEMY + 1.85, SPOT.obelisk.z), i: 9, photoCrow: true }); E.crows.push(pc); E.photoCrow = pc;
      E.crows.forEach(c => { c.g.position.copy(c.perch); c.g.rotation.y = c.i * 1.7; });
      E.door = mausDoor(parts.cemetery);
      E.mausGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffe7a0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      E.mausGlow.scale.setScalar(4); E.mausGlow.position.copy(fx.mausGlow); parts.cemetery.add(E.mausGlow);
    } else {
      E.people = PAST_PEOPLE.map(d => makePerson(Object.assign({ era: 'past' }, d), d.id === 'ines' || d.id === 'baltasar' ? parts.cemetery : parts.quarter));
      // smoke from the chimneys, and bunting from the theater's turret
      const puff = new THREE.IcosahedronGeometry(0.3, 1), sm = new THREE.InstancedMesh(puff, toonM({ rim: 0.25, color: '#f4f2ee' }), Math.max(1, fx.smoke.length * 6));
      sm.frustumCulled = false; parts.quarter.add(sm); E.smoke = { im: sm, spots: fx.smoke };
      if (fx.bunting) { const k = Kit(), cols = ['#e2453a', '#ffd84a', '#3f7fc9', '#5fae4f', '#ff8fb1']; k.frame(0, 0, 0, 0);
        fx.bunting.forEach(([a, b], j) => { for (let i = 0; i <= 12; i++) { const t = i / 12, x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t), y = lerp(a.y, b.y, t) - Math.sin(t * Math.PI) * 1.1; k.add(GEO.cone4, x, y - 0.25, z, 0.22, 0.4, 0.04, cols[(i + j) % 5], { rx: Math.PI, ry: Math.atan2(b.x - a.x, b.z - a.z) + HALF, ink: 0.004 }); } });
        meshesOf(k, parts.hall, { cast: false }); }
    }
    return E;
  }
  function build(scene, env = {}) {
    if (env.terrainAt) gyOf = env.terrainAt;
    drawSigns(true); drawStones(true);
    const root = new THREE.Group(); root.name = 'north-of-alba'; scene.add(root);
    const out = { col: [], plat: [] };
    const now = buildEra(root, true, out);
    out.col.forEach(c => { if (c.era === 'past') c.x = OFF; });
    BUILT = { root, scene, out, eras: { now, past: null }, people: now.people.map(p => p.api), stRef: null, lastLang: null, t: 0 };
    const landmarks = {}; for (const [k, p] of Object.entries(SPOT)) landmarks[k] = { x: p.x, z: p.z };
    return { colliders: out.col, platforms: out.plat, group: root, people: BUILT.people, update, landmarks, objects: { eras: BUILT.eras }, stats, setEra };
  }

  // ---------------------------------------------------------------- per frame (main.js calls it while the area is drawn)
  function setMasks() {
    const M = U.uMask.value, st = G ? S() : {};
    QG.forEach((g, i) => { const r = isRestored(g); M[i] = r ? 1 : 0; M[6 + i] = r ? 0 : 1; });
    M[12] = st.song ? 0 : 1; M[13] = st.song ? 1 : 0; M[14] = st.song ? 0 : 1; M[15] = st.photo ? 0 : 1;
  }
  // after a load (or a new game): the stones, the masks, the door, the gray patch
  function applyState() {
    setMasks(); drawStones(true);
    const E = BUILT && BUILT.eras.now, st = S();
    if (E) {
      E.door.set(st.song ? 1 : 0); E.doorK = st.song ? 1 : 0;
      E.wisps.forEach(W => { W.scene = null; W.k = (W.q.id === 'aurora' ? !!st.song : isRestored(W.q)) ? 1 : 0; });
      if (E.photoCrow) E.photoCrow.g.visible = true;
    }
    hushFor(era);
  }
  // the cemetery's gray lifts once the names are back (and there's none in the past); the mist past the north gate stays
  function hushFor(e) {
    if (typeof WORLD === 'undefined' || !G || !G.w3d) return;
    const L = WORLD.L.hush, done = !!S().song;
    L.forEach((h, i) => {
      if (!h.cemetery && !h.northRoad) return;
      if (h._a0 === undefined) h._a0 = h.a;
      const want = e === 'past' || (h.cemetery && done) ? 0 : h._a0;
      if (want === 0 && h.a > 0) G.w3d.liftHush(i, true);
      else if (want > 0 && h.a < want * 0.99) {
        h.a = want;
        const W = WORLD, x0 = Math.max(0, Math.floor(h.x - h.r - W.L.minX)), x1 = Math.min(W.GW - 1, Math.ceil(h.x + h.r - W.L.minX)), z0 = Math.max(0, Math.floor(h.z - h.r - W.L.minZ)), z1 = Math.min(W.GH - 1, Math.ceil(h.z + h.r - W.L.minZ));
        for (let j = z0; j <= z1; j++) for (let k = x0; k <= x1; k++) W.MAP[(j * W.GW + k) * 4 + 2] = W.hushAt(W.L.minX + k, W.L.minZ + j);
        if (G.w3d.mapTex) G.w3d.mapTex.needsUpdate = true;
        const terr = G.w3d.scene.children.find(o => o.userData && o.userData.recolor); if (terr) terr.userData.recolor(h.x, h.z, h.r);
      }
    });
  }
  let era = 'now';
  function setEra(e) {
    e = e === 'past' ? 'past' : 'now';
    const B = BUILT; if (!B) { era = e; return era; }
    if (e === 'past' && !B.eras.past) {
      const out = { col: [], plat: [], skipBoth: true };
      B.eras.past = buildEra(B.root, false, out);
      out.plat.forEach(p => { p.era = p.era || 'past'; });
      if (typeof WORLD !== 'undefined') { WORLD.addSolids(out.col); if (WORLD.addPlatforms) WORLD.addPlatforms(out.plat); }
      B.out.col.push(...out.col); B.out.plat.push(...out.plat);
    }
    era = e;
    B.eras.now.group.visible = e === 'now'; if (B.eras.past) B.eras.past.group.visible = e === 'past';
    for (const c of B.out.col) if (c.era) c.x = c.era === e ? c._x : OFF;      // (the other era's solids, parked far away)
    for (const p of B.out.plat) if (p.era) { if (!p._box) p._box = p.box.slice(); p.box = p.era === e ? p._box.slice() : [OFF, OFF + 1, OFF, OFF + 1]; }
    B.people.length = 0; B.eras[e].people.forEach(p => B.people.push(p.api));
    hushFor(e); drawSigns(true); drawStones(true);
    if (typeof MINIMAP !== 'undefined' && MINIMAP.rebuild) { try { MINIMAP.rebuild(); } catch (err) { console.warn('[cemetery] minimap', err); } }
    return era;
  }
  const _m = new THREE.Matrix4(), _q2 = new THREE.Quaternion(), _sv = V3(1, 1, 1), _pv = V3(0, 0, 0);
  function update(dt, t, you) {
    const B = BUILT; if (!B) return;
    U.uTime.value += dt; B.t += dt;
    const Y = you || (G && G.sim && G.sim.you) || null;
    if (Y) U.uFocus.value.set(Y.x, (you && you.y !== undefined ? you.y : gyOf(Y.x, Y.z)) + 1.0, Y.z); else U.uFocus.value.set(0, -1e4, 0);
    PSCALE.value = (window.innerHeight || 720) * Math.min(window.devicePixelRatio || 1, 1.5) / 0.9326;
    if (G && G.state !== B.stRef) { B.stRef = G.state; applyState(); }
    drawSigns(); drawStones();
    const E = B.eras[era]; if (!E) return;
    const fp = Y || { x: -10, z: -150 }, dist = (x, z) => Math.hypot(fp.x - x, fp.z - z);
    E.parts.cemetery.visible = dist(-76, -267) < 140; E.parts.hall.visible = dist(-13.5, -241) < 165; E.parts.quarter.visible = dist(-8, -212) < 175;
    if (you && G) triggers(you);
    const st = G ? S() : {};
    for (const P of E.people) {
      const a = P.api, dx = Y ? Y.x - a.x : 0, dz = Y ? Y.z - a.z : 0, near = Y && Math.hypot(dx, dz) < 4.5;
      if (!P.def.look.seat) P.g.rotation.y = dampAngle(P.g.rotation.y, (a.talking || near) && Y ? Math.atan2(dx, dz) : P.def.yaw || 0, 4, dt);
      else P.g.rotation.x = Math.sin(t * 1.3 + P.ph) * 0.05;
      P.body.position.y = a.talking ? Math.abs(Math.sin(t * 9)) * 0.05 : Math.sin(t * 1.6 + P.ph) * 0.012;
      if (P.def.id === 'baltasar' && era === 'now') P.gray.value = damp(P.gray.value, balHush() * 1.1, 1.2, dt);
      if (P.g.userData.glow) P.g.userData.glow.material.opacity = 0.45 + 0.08 * Math.sin(t * 5 + P.ph);
    }
    for (const W of E.wisps) {
      const show = W.q.id === 'aurora' ? !!st.song : isRestored(W.q);
      if (!W.scene) { W.k = damp(W.k, show ? 1 : 0, 2.2, dt); W.x = W.home.x; W.z = W.home.z; W.y = CEMY + 1.25 + Math.sin(t * 1.7 + W.q.x) * 0.12; }
      W.g.visible = W.k > 0.01 && E.parts.cemetery.visible;
      if (!W.g.visible) continue;
      W.g.position.set(W.x, W.y, W.z); W.g.scale.setScalar(0.85 * W.k * (W.api.talking ? 1 + Math.sin(t * 9) * 0.05 : 1));
      W.g.rotation.y = Y ? dampAngle(W.g.rotation.y, Math.atan2(Y.x - W.x, Y.z - W.z), 3, dt) : 0; W.g.rotation.z = Math.sin(t * 1.1 + W.q.z) * 0.06;
      W.mat.opacity = 0.86 * W.k; W.glow.material.opacity = (0.5 + 0.1 * Math.sin(t * 2.3 + W.q.x)) * W.k;
      Object.assign(W.api, { x: W.x, z: W.z, y: W.y - 0.2 });
    }
    for (const C of E.crows) {
      const P = C.perch, dY = Y ? Math.hypot(Y.x - P.x, Y.z - P.z) : 99;
      if (C.mode === 'sit') {
        C.g.visible = true; C.g.position.copy(P); C.body.position.y = Math.max(0, Math.sin(t * 3.1 + C.i * 2)) * 0.035; C.g.rotation.y = C.i * 1.7 + Math.sin(t * 0.6 + C.i) * 0.9;
        if (!C.photoCrow && dY < 3.4 && G && G.sim.you.speed > 0.6) { C.mode = 'fly'; C.t = 0; C.dir = Math.atan2(P.z - Y.z, P.x - Y.x) + (Math.random() - 0.5); if (typeof Sound !== 'undefined') Sound.play('shout'); }
      } else if (C.mode === 'fly') {
        C.t += dt; const f = C.t; C.g.position.set(P.x + Math.cos(C.dir) * f * 6, P.y + f * f * 2.2 + f * 2, P.z + Math.sin(C.dir) * f * 6);
        C.g.rotation.y = Math.atan2(Math.cos(C.dir), Math.sin(C.dir)); C.body.scale.y = 1 + Math.sin(f * 40) * 0.18;
        if (f > 2.4) { C.mode = 'away'; C.t = 7 + Math.random() * 6; C.g.visible = false; }
      } else if (C.mode === 'away') { C.t -= dt; if (C.t <= 0 && dY > 9) { C.mode = 'back'; C.t = 0; C.g.visible = true; } }
      else if (C.mode === 'back') { C.t += dt / 2.2; const f = Math.min(1, C.t); C.g.position.set(P.x + (1 - f) * 7, P.y + (1 - f) * (1 - f) * 8, P.z + (1 - f) * 3); C.body.scale.y = 1 + Math.sin(B.t * 40) * 0.15 * (1 - f); if (f >= 1) { C.mode = 'sit'; C.body.scale.y = 1; } }
    }
    if (E.swing) { if (era === 'now') { E.swing.rotation.y = Math.sin(t * 0.45) * 0.5; E.swing.rotation.z = Math.sin(t * 0.8) * 0.05; } else E.swing.rotation.z = Math.sin(t * 2.0) * 0.38; }
    if (E.smoke) {
      const S0 = E.smoke; let i = 0;
      S0.spots.forEach((sp, j) => { for (let n = 0; n < 6; n++, i++) { const life = (t * 0.32 + n / 6 + j * 0.13) % 1, s = (0.35 + life * 1.1) * (1 - life * 0.6); S0.im.setMatrixAt(i, _m.compose(_pv.set(sp.x + life * 1.6, sp.y + life * 3.2, sp.z + Math.sin(life * 6 + j) * 0.3), _q2, _sv.set(s, s, s))); } });
      S0.im.instanceMatrix.needsUpdate = true;
    }
    if (E.door) { const want = st.song ? 1 : 0; if (!E.doorScene) E.doorK = damp(E.doorK || 0, want, 2, dt); E.door.set(E.doorK); E.mausGlow.material.opacity = (E.doorK || 0) * (0.55 + 0.1 * Math.sin(t * 2)); }
  }
  function stats() {
    let tris = 0, calls = 0, inst = 0;
    BUILT.root.traverseVisible(o => {
      if (!o.isMesh && !o.isPoints && !o.isSprite) return;
      calls++;
      if (o.isMesh) { const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += n * (o.isInstancedMesh ? o.count : 1); if (o.isInstancedMesh) inst += o.count; }
    });
    return { tris: Math.round(tris), calls, instances: inst, solids: BUILT.out.col.length, era };
  }

  // ================================================================ the game side: state, voices, scenes
  let G = null;            // the game (main.js): { sim, w3d, cam, cast, state, save, fight, … }
  function S() {
    if (!G) return { clues: {}, restored: {}, half: {}, seen: {} };
    const s = G.state.cemetery || (G.state.cemetery = {});
    s.clues = s.clues || {}; s.restored = s.restored || {}; s.half = s.half || {}; s.seen = s.seen || {};
    return s;
  }
  const isRestored = g => !!(G && S().restored[g.id]);
  const graveMode = g => (!G ? 'faded' : S().restored[g.id] ? 'full' : S().half[g.id] || 'faded');
  const restoredCount = () => QG.filter(isRestored).length;
  const balHush = () => { const s = S(); return s.song ? 0 : Math.max(0, 0.75 - 0.125 * restoredCount()); };
  const knows = id => !!(S().clues[id] || S().restored[id]);
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const personName = d => {           // (zh / ja: the name in the language, plain text for the bubble; young Tina in the past)
    const l = lang(), N = cjL(l) && CJ_NAMES[d.id];
    if (N) return plainTxt(d.era === 'past' && N.young ? N.young[l] : N[l][0], l);
    return typeof d.name === 'object' ? d.name[l] || d.name.es : d.name;
  };
  const shownName = (g, l, full = true) => plainTxt(full ? nameOf(g, l) : givenOf(g, l), l);     // (a grave's name as plain text in the mode)
  const first = s => s.split(' ')[0];
  const faceVec = g => ({ x: g.face === 'E' ? 1 : g.face === 'W' ? -1 : 0, z: g.face === 'N' ? -1 : g.face === 'S' ? 1 : 0 });
  function personOf(id) { const E = BUILT && BUILT.eras[era]; const p = E && E.people.find(q => q.def.id === id); if (p) p.api.name = personName(p.def); return p || null; }
  // a line over someone, through STORY.sayInline (the weave; it waits for E). hush: the Hush eats words (gray, slow bubble)
  function speak(p, key, o = {}) {
    if (!p) return Promise.resolve();
    const L = lineOf(key), W = LEX.weave(), h = o.hush || 0, seed = hash(key + (p.id || p.name || ''));
    const text = blank(L.text, seed, h * 0.72), en = o.native && text ? text : blank(L.weave || L.en, seed + 1, h * 0.72);     // (native: a crow caws in the language, «¡Cra!», «Cró!», «Krah!»)
    p.lines = { en }; p.lines[lang()] = text;
    const pr = STORY.sayInline(p), line = STORY.line;
    if (line && h > 0.4) { line.hushed = true; line.say = ''; }
    return pr;
  }
  function clue(id) {
    const st = S(); if (st.clues[id]) return; st.clues[id] = true;
    const g = QG.find(q => q.id === id); if (g) UI.toast(`Clue: the ${JOBS[g.job].en[0]} was ${shownName(g, lang())}`);
    G.save();
  }
  const ICONURL = {};
  const iconURL = key => ICONURL[key] || (ICONURL[key] = ICONS.canvas(key, 64).toDataURL());
  function addCSS() {
    if (document.getElementById('cem-css')) return;
    const s = document.createElement('style'); s.id = 'cem-css';
    s.textContent = `.card.cem-doc { max-width: min(540px, calc(100vw - 40px)); }
.cem-rows { display: flex; flex-direction: column; gap: 5px; margin: 8px 0; text-align: left; font: 17px/1.3 "Segoe Print", "Ink Free", cursive; }
.cem-rows .r { display: flex; align-items: center; gap: 10px; } .cem-rows img { width: 34px; height: 34px; flex: 0 0 34px; }
.cem-rows b { font-family: "Segoe UI", sans-serif; font-weight: 800; } .cem-rows .m { opacity: .8; font-size: 15px; }
.card .en.cem-en { text-align: left; font-size: 13px; } .cem-photo { display: block; margin: 6px auto; width: 320px; max-width: 100%; border-radius: 3px; box-shadow: 0 4px 0 rgba(43,34,53,.2); }
.cem-song { font: 21px/1.5 "Segoe Print", "Ink Free", cursive; margin: 8px 0; } .cem-cap { font: 18px "Segoe Print", "Ink Free", cursive; margin: 4px 0; }
.card.cem-doc { max-height: calc(100vh - 24px); overflow-y: auto; } .cem-rows .cjk.cjk-ruby, .cem-cap .cjk.cjk-ruby, .cem-song .cjk.cjk-ruby { line-height: 1.8; }
.card.cem-doc:has(.cjk) { top: 50%; }`;
    document.head.appendChild(s);
  }
  // (the English of a page, a photo or the song: on request, EN, never shown by default: DESIGN.md 17.3)
  const enBox = html => `<div class="row"><button data-act="en">EN</button></div><div class="en cem-en">${html}</div>`;
  // ---------------------------------------------------------------- Baltasar, the gravekeeper
  async function baltasarTalk() {
    const st = S(), P = personOf('baltasar'); if (!P) return;
    const a = P.api, h = balHush();
    if (!st.met) {
      G.sim.lock = 1; LEX.expose('w.grave'); LEX.expose('w.name');
      G.cam.override = { pos: V3(a.x + 3.4, CEMY + 2.3, a.z + 3.2), look: V3(a.x, CEMY + 1.2, a.z) };
      await speak(a, 'cem.bal.hello', { hush: h });
      await speak(a, 'cem.bal.names', { hush: h });
      await STORY.you(YOU.names);
      await speak(a, 'cem.bal.help', { hush: h });
      await STORY.you(YOU.yes);
      st.met = true; G.cam.override = null; G.sim.lock = 0; G.save();
      return;
    }
    if (st.song) return speak(a, 'cem.bal.thanks');
    if (restoredCount() >= 6) return speak(a, 'cem.bal.done');
    if (!st.ledger) return speak(a, 'cem.bal.wait', { hush: h });
    if (restoredCount() >= 3 && !knows('ines')) { await speak(a, 'cem.bal.ines', { hush: h * 0.4 }); clue('ines'); return; }
    return speak(a, 'cem.bal.some', { hush: h });
  }
  async function readLedger() {
    const st = S(), l = lang(), firstTime = !st.ledger, jobIcon = g => JOBS[g.job].id.slice(2);
    Sound.play('page');
    QG.forEach(g => LEX.expose(JOBS[g.job].id));
    const rows = QG.map(g => `<div class="r"><img src="${iconURL(jobIcon(g))}" alt=""><span><b>${isRestored(g) || knows(g.id) ? cardTxt(nameOf(g, l), l) : '▬▬▬▬▬'}</b> <span class="m">${cardTxt(LEDGER[g.id][l], l)}</span></span></div>`).join('');
    const en = QG.map(g => `${esc(isRestored(g) || knows(g.id) ? nameOf(g, 'es') : '▬▬▬▬▬')} ${esc(LEDGER[g.id].en)}`).join('<br>') + '<br>' + esc(LEDGER.maus.en);
    await UI.card(`<div class="tag">${cardTxt(SIGNW.ledger[l], l)}</div><div class="cem-rows">${rows}<div class="r"><img src="${iconURL('grave')}" alt=""><span class="m">${cardTxt(LEDGER.maus[l], l)}</span></div></div>${enBox(en)}<div class="sub">E to close</div>`, { kind: 'page cem-doc' });
    if (cjL(l)) [SIGNW.ledger[l], LEDGER.maus[l], ...QG.map(g => LEDGER[g.id][l])].forEach(t => CJK.seen(t, { lang: l }));     // (reading it counts for its characters)
    st.ledger = true; G.save();
    if (firstTime) await STORY.you(YOU.ledger);
  }
  // ---------------------------------------------------------------- asking people who someone was (you type the question: output)
  // (zh / ja: matched on the typed text and its pinyin / rōmaji (CJK.canon), the job anywhere in it: there are no spaces)
  const QW = { es: /\bquien(es)?\b/, pt: /\bquem\b/, de: /\bwer\b/, zh: /shei|shui|谁/, ja: /dare|donata|誰|だれ|どなた/ },
    PASTV = { es: /\b(era|fue)\b/, pt: /\b(era|foi)\b/, de: /\bwar\b/, zh: /shi|是|yiqian|以前/, ja: /deshita|datta|でした|だった/ },
    PRESV = { es: /\bes\b/, pt: /\be\b/, de: /\bist\b/, zh: /shi|是/, ja: /desu|です|だ/ };
  const cjkOn = l => typeof CJK !== 'undefined' && CJK.isCJK(l);
  function parseQuestion(text, l) {
    const n = fold(text), words = n.split(' ').filter(Boolean), plain = cjkOn(l) ? CJK.canon(text, l) + ' ' + text : norm(text);      // (the question words: plain, or «quem» would fold to «qum»)
    let job = null;
    for (const [key, J] of Object.entries(JOBS)) {
      if (cjkOn(l)) { if ((J[l] || []).some(f => CJK.contains(text, f, l))) { job = key; break; } continue; }
      const forms = J[l].concat(...((J.alt && J.alt[l]) || [])).map(fold);
      if (forms.some(f => words.includes(f) || (f.length > 5 && words.some(w => lev(w, f) === 1)))) { job = key; break; }
    }
    return { q: QW[l].test(plain), past: PASTV[l].test(plain), pres: PRESV[l].test(plain), job };
  }
  const askModel = (g, l) => ({ es: `¿Quién era ${jobPhrase(g.job, g.fem, 'es')}?`, pt: `Quem era ${jobPhrase(g.job, g.fem, 'pt')}?`, de: `Wer war ${jobPhrase(g.job, g.fem, 'de')}?`,
    zh: `${jobPhrase(g.job, g.fem, 'zh')} [是|shì] [谁|shéi] ？`, ja: `${jobPhrase(g.job, g.fem, 'ja')} は [誰|だれ] でした か ？` })[l];
  async function askScene(P, who) {
    const l = lang(), a = P.api, target = QG.find(g => g.clue === who), model = askModel(target, l), shown = cjkOn(l) ? CJK.plain(model, { lang: l }) : model;
    a.talking = true;
    const r = await UI.command({ name: G.state.mimoName, icon: 'wave', title: `What do you want to ask ${a.name}?`, verbs: [], placeholder: 'ask a question…',
      hint: 'Ask who someone was. Baltasar’s book says what each of them did.', model, modelEn: `Who was the ${JOBS[target.job].en[0]}?` });
    a.talking = false;
    if (!r || r.cancelled) return speak(a, who === 'tina' ? 'cem.tina.hello' : 'cem.lia.hello');
    const q = parseQuestion(r.text, l);
    if (!q.q || !q.job) { await speak(a, 'cem.ask.huh'); UI.toast(`Try: «${shown}»`); return; }
    if (q.job !== target.job) { await speak(a, 'cem.ask.other'); return; }
    if (!q.past) UI.toast(q.pres ? `Close! Better: «${shown}» (they’re not around anymore)` : `Better: «${shown}»`); else Sound.play('review');
    await speak(a, who === 'tina' ? 'cem.tina.ask' : 'cem.lia.ask');
    if (who === 'lia') await showPhoto('mateo');
    clue(target.id);
  }
  // ---------------------------------------------------------------- photos and documents (cards)
  function photoURL(which) {
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = which === 'mateo' ? 200 : 230; const c = cv.getContext('2d'), w = cv.width, h = cv.height;
    if (which === 'julian') photoClass(c, w, h);
    else if (which === 'clara') {
      c.fillStyle = '#ead9b8'; c.fillRect(0, 0, w, h); c.fillStyle = '#c9b08a'; c.fillRect(14, 14, w - 28, h - 28);
      c.fillStyle = '#8a6f52'; c.fillRect(40, 120, 150, 60); c.fillStyle = '#5a4634'; c.fillRect(60, 95, 80, 28);                       // a sewing machine on a table
      c.fillStyle = '#a14a3a'; for (let i = 0; i < 3; i++) c.fillRect(205 + i * 26, 60, 20, 110);                                        // red robes on a rail
      c.fillStyle = '#6f5a44'; c.beginPath(); c.arc(170, 78, 18, 0, TAU); c.fill(); c.fillRect(152, 96, 36, 70);                          // Clara
      c.fillStyle = 'rgba(255,248,230,0.25)'; c.fillRect(0, 0, w, 30);
    } else {
      c.fillStyle = '#fff6e0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9443a'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12);
      c.fillStyle = '#9fd0e6'; c.fillRect(18, 18, 150, 100); c.fillStyle = '#7fbf5a'; c.fillRect(18, 88, 150, 30);
      for (let i = 0; i < 5; i++) { c.fillStyle = ['#f3e1c4', '#bcd8ea', '#f4d8c8', '#dcecd8', '#f6dcae'][i]; c.fillRect(28 + i * 27, 62, 22, 28); c.fillStyle = '#c9553f'; c.beginPath(); c.moveTo(26 + i * 27, 62); c.lineTo(39 + i * 27, 50); c.lineTo(52 + i * 27, 62); c.fill(); }
      c.fillStyle = '#e8c46a'; c.fillRect(w - 66, 18, 48, 56); c.strokeStyle = '#8a5f3e'; c.lineWidth = 2; c.strokeRect(w - 66, 18, 48, 56);
      c.fillStyle = '#3a3546'; c.font = '600 15px "Segoe Print", cursive'; const l = lang(), T = PHOTO_TXT.mateo[l] || PHOTO_TXT.mateo.es;
      T.split(' — ').forEach((s, i) => { const t = plainTxt(s, l); let fs = 15; while (cjL(l) && fs > 9 && c.measureText((i ? '— ' : '') + t).width > w - 36) c.font = `600 ${--fs}px "Segoe Print", cursive`; c.fillText(i ? '— ' + t : t, 20, 146 + i * 26); });
    }
    return cv.toDataURL();
  }
  async function showPhoto(which) {
    const l = lang(), T = PHOTO_TXT[which]; Sound.play('page'); LEX.expose('w.photo');
    await UI.card(`<div class="tag">${which === 'mateo' ? 'A postcard' : 'An old photo'}</div><img class="cem-photo" src="${photoURL(which)}" alt=""><div class="cem-cap">${cardTxt(T[l], l)}</div>${enBox(esc(T.en))}<div class="sub">E</div>`, { kind: 'page cem-doc' });
    if (cjL(l)) CJK.seen(T[l], { lang: l });
  }
  async function ruinLook() {
    const y = HOUSES[3].y0;
    G.sim.lock = 1; G.cam.override = { pos: V3(SPOT.ruinLook.x - 1.4, y + 2.5, SPOT.ruinLook.z - 0.6), look: V3(1.6, y + 1.0, -204.8) };
    await wait(1.2);
    if (!knows('julian')) { await showPhoto('julian'); clue('julian'); }
    else STORY.think('The fallen house… the class photo is still leaning by the back wall.', 4);
    G.cam.override = null; G.sim.lock = 0;
  }
  async function posterRead() {
    const l = lang(), P = POSTER[l]; Sound.play('page');
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const c = cv.getContext('2d');
    c.drawImage(SIGN.cv, SLOTS.poster[0], SLOTS.poster[1], 256, 256, 0, 0, 256, 256);
    await UI.card(`<div class="tag">A poster by the theater’s door</div><img class="cem-photo" style="width:240px" src="${cv.toDataURL()}" alt=""><div class="cem-cap">${P.map(t => cardTxt(t, l)).join(' · ')}</div>${enBox(POSTER.en.map(esc).join(' · '))}<div class="sub">E</div>`, { kind: 'page cem-doc' });
    if (cjL(l)) P.forEach(t => CJK.seen(t, { lang: l }));
    clue('felix');
  }
  // ---------------------------------------------------------------- the theater: the first visit, the door, the peek
  async function hallScene() {
    const { sim } = G, M = sim.mimo, root = G.cast && G.cast.mimo && G.cast.mimo.root;
    sim.lock = 1;
    G.cam.override = { pos: V3(HALL.x + 8.5, HALL.y0 + 3.4, HALL.z + 16), look: V3(HALL.x, HALL.y0 + 5.5, HALL.z) };
    M.scared = 3.5; sim.mimoSay('…', 1.6); if (typeof Sound !== 'undefined') Sound.play('whimper');
    await tween(1.1, k => { if (root) root.rotation.z = Math.sin(k * 70) * 0.09 * (1 - k * 0.5); });
    if (root) root.rotation.z = 0;
    STORY.think(THINK.hall, 5.5);
    await wait(2.6);
    G.cam.override = null; sim.lock = 0;
  }
  async function hallDoor() { STORY.think(G.state.flags.ciro ? THINK.hallDoorCiro : THINK.hallDoor, 6); Sound.play('wood'); }
  async function peek() {
    const st = S(); G.sim.lock = 1;
    G.cam.override = { pos: V3(HALL.x - 4.0, HALL.y0 + 2.6, HALL.z + HALL.d / 2 + 0.9), look: V3(HALL.x + 0.2, HALL.y0 + 1.6, HALL.z - HALL.d / 2 + 2.0) };
    await wait(1.6); STORY.think(THINK.peek, 6.5); await wait(3.2);
    st.peeked = true; G.cam.override = null; G.sim.lock = 0; G.save();
  }
  // the signs' Read cards (signs.js: the words big, a 🔊, the English; without it, a thought)
  const nat = (k, l) => SIGN_NAT[k][l] || SIGN_NAT[k].es;
  const readCard = card => (typeof SIGNS !== 'undefined' && SIGNS.read ? SIGNS.read(card) : Promise.resolve(STORY.think(card.lines.map(L => `«${L.text}» (${L.en})`).join(' · '), 4.5)));
  async function signRead() {
    const l = lang(), now = era === 'now'; LEX.expose('w.cemetery');
    await readCard({ tag: 'The signpost at the fork', lines: [{ text: '← ' + nat('cem', l), en: 'cemetery, this way' },
      now ? { text: '✕ ' + nat('closed', l), en: 'closed (the way to the right is shut)' } : { text: nat('north', l) + ' →', en: 'the north road' }, { text: (cjL(l) ? SIGNW.alba[l] : 'Alba') + ' ↓', en: 'back to Alba' }] });
    if (now && !LEX.taught('w.cemetery') && LEX.mayIntroduce()) { await wait(0.8); await STORY.teachWord('w.cemetery', { look: { x: SPOT.sign.x - 1.0, z: SPOT.sign.z } }); }
  }
  async function cemSignRead() { LEX.expose('w.cemetery'); await readCard({ tag: 'Over the cemetery’s gate', lines: [{ text: nat('cem', lang()), en: SIGN_NAT.cem.en, look: { face: '#2f2c36', edge: '#8f8778', ink: '#e9dcc0' } }] }); }
  async function gateLook() { STORY.think(THINK.gate, 5.5); Sound.play('wood'); }
  // (once seven bells ring the Gray Marsh, marsh.js, opens the gate: then it's that file's to talk about)
  const gateOpenNow = () => typeof MARSH !== 'undefined' && !!MARSH.gateOpen && MARSH.gateOpen();
  async function saleRead() { await readCard({ tag: 'A sign by a house', lines: [{ text: nat('sale', lang()), en: SIGN_NAT.sale.en, look: { face: '#f2ead8', edge: '#c9443a', ink: '#c9443a' } }], note: 'Nobody wants to live out here anymore.' }); }
  async function hallRead() {      // (now the Hush is eating its letters: gray, but there to read)
    const l = lang(), now = era === 'now';
    await readCard({ tag: 'Across the old theater', lines: [{ text: nat('hall', l), en: SIGN_NAT.hall.en, hush: now ? hallHush(SIGNW.hall[l]) : [] }]
      .concat(now ? [] : [{ text: nat('concert', l), en: SIGN_NAT.concert.en, look: { face: '#c9443a', edge: '#ffd84a', ink: '#fff6dc' } }]), note: now ? 'The Hush is eating its letters… but you can still read them.' : '' });
  }
  async function postRead() { await readCard({ tag: 'Over a door', lines: [{ text: nat('post', lang()), en: SIGN_NAT.post.en, look: { edge: '#2f5f9a', ink: '#2f5f9a' } }] }); }
  async function bakeryRead() { await readCard({ tag: 'A round sign with a loaf on it', lines: [{ text: nat('bakery', lang()), en: SIGN_NAT.bakery.en, look: { edge: '#8d5733', ink: '#8d5733' } }] }); }
  async function northRead() {
    const l = lang(), now = era === 'now';
    await readCard({ tag: 'The gate on the old north road', lines: [{ text: nat('north', l), en: SIGN_NAT.north.en, look: { face: '#2f2c36', edge: '#8f8778', ink: '#e9dcc0' } }]
      .concat(now && !gateOpenNow() ? [{ text: nat('closed', l), en: SIGN_NAT.closed.en, look: { face: '#c9443a', edge: '#8f2f26', ink: '#fffaf0' } }] : []) });
  }
  async function arriveCemetery() {
    LEX.expose('w.candle'); LEX.expose('w.crow'); LEX.expose('w.grave');
    UI.chapter('The Cemetery', 'At the end of the brick road');
    await wait(3.0); STORY.think(THINK.cemetery, 6);
  }
  // ---------------------------------------------------------------- the graves
  function judgeRestore(text, g, l) {
    const words = fold(text).split(' ').filter(Boolean), nm = fold(cjkOn(l) ? nameOf(g, 'es') : nameOf(g, l)).split(' '), f0 = nm[0], last = nm[nm.length - 1];
    let name = words.some(w => w === f0 || w === last || (f0.length >= 5 && lev(w, f0) <= 1));
    const J = JOBS[g.job], pairs = [J[l]].concat((J.alt && J.alt[l]) || []);
    if (cjkOn(l)) {          // (zh / ja: the name in the language, its given or family name, in characters or pinyin / rōmaji; one job word for both)
      const N = (CJ_NAMES[g.id] || {})[l] || [];
      name = name || N.some(n => CJK.contains(text, n, l));
      return { name, job: (J[l] || []).some(f => CJK.contains(text, f, l)) ? 'ok' : words.some(w => J.en.includes(w)) ? 'english' : 'no', typo: false };
    }
    const right = pairs.map(p => fold(p[g.fem ? 1 : 0])), wrong = pairs.map(p => fold(p[g.fem ? 0 : 1])).filter(w => !right.includes(w));
    let job = 'no', typo = false;
    if (words.some(w => right.includes(w))) job = 'ok';
    else if (words.some(w => wrong.includes(w))) job = 'gender';          // (before typos: «panadero» is one letter off «panadera»)
    else if (words.some(w => right.some(r => r.length >= 6 && lev(w, r) === 1))) { job = 'ok'; typo = true; }
    else if (words.some(w => J.en.includes(w))) job = 'english';
    return { name, job, typo };
  }
  async function revealLine(g, line) { await tween(1.0, k => { STONE.reveal = { g, line, k }; drawStones(); }); STONE.reveal = null; drawStones(true); }
  async function restoreScene(g) {
    const st = S(), l = lang(), nm = nameOf(g, l), jp = jobPhrase(g.job, g.fem, l), fnSrc = givenOf(g, l), fn = plainTxt(fnSrc, l), jpT = plainTxt(jp, l);     // (zh / ja: fn and jpT as plain text, for thoughts; the model keeps the notation)
    let tries = 0;
    for (;;) {
      const half = st.half[g.id], known = knows(g.id);
      const title = half === 'name' ? `${fn}… The name is back. What did ${g.fem ? 'she' : 'he'} do? (the second line)` : half === 'job' ? 'The second line is back. Whose grave is it? (the name)' : 'The words on this stone have faded. Who rests here, and what did they do?';
      const hint = !known ? 'You don’t know the name yet… Baltasar’s book has a clue.' : tries ? `In the language: the name, then the job from Baltasar’s book${g.fem && !cjkOn(l) ? ' (she was a woman)' : ''}.` : 'Type the name and the job, in the language.';
      const model = known && tries >= 1 ? (half === 'name' ? jp : half === 'job' ? nm : cjkOn(l) ? `${fnSrc} ${l === 'zh' ? '，' : '、'} ${jp}` : `${fn}, ${jp}`) : undefined;
      const r = await UI.command({ name: 'the stone', icon: 'grave', title, verbs: [], placeholder: half === 'name' ? 'the job…' : half === 'job' ? 'the name…' : 'name and job…', hint, model, modelEn: `${fn}, the ${JOBS[g.job].en[0]}` });
      if (!r || r.cancelled) return;
      const v = judgeRestore(r.text, g, l), gotName = v.name || half === 'name', gotJob = v.job === 'ok' || half === 'job';
      if (gotName && gotJob) { if (v.typo) UI.toast(`Restored! (It’s spelled «${plainTxt(jobWord(g.job, g.fem, l), l)}».)`); return restoreFx(g); }
      tries++;
      if (v.name && !half) {
        st.half[g.id] = 'name'; G.save(); Sound.play('review'); await revealLine(g, 'name');
        STORY.think(v.job === 'gender' ? `${fn}! The name is back. But the second line stays gray: ${fn} was ${g.fem ? 'a woman' : 'a man'}, so it’s «${jpT}».` : `${fn}! The name is back… but the second line is still gray.`, 5);
        continue;
      }
      if (v.job === 'ok' && !half) { st.half[g.id] = 'job'; G.save(); Sound.play('review'); await revealLine(g, 'job'); STORY.think('The second line is back… but whose grave is it?', 4); continue; }
      Sound.play('wrong');
      if (v.job === 'gender') STORY.think(`Almost! ${fn} was ${g.fem ? 'a woman' : 'a man'}: «${jpT}».`, 5);
      else if (v.job === 'english') STORY.think('The stone wants the word in the language, not in English.', 4.5);
      else if (!known && !v.name) { STORY.think(st.ledger ? 'That doesn’t feel right… The book has a clue about who this was.' : THINK.noBook, 5); return; }
      else STORY.think('The letters flicker… but they don’t come back. (Baltasar’s book has the jobs.)', 4.5);
    }
  }
  async function restoreFx(g) {
    const st = S(), E = BUILT.eras.now, W = E.wisps[g.q], f = faceVec(g), line = st.half[g.id] === 'name' ? 'job' : st.half[g.id] === 'job' ? 'name' : 'all';
    G.sim.lock = 1;
    G.cam.override = { pos: V3(g.x + f.x * 4.4 + 1.4, CEMY + 2.5, g.z + f.z * 4.4), look: V3(g.x, CEMY + 1.0, g.z) };
    delete st.half[g.id]; st.restored[g.id] = true; st.clues[g.id] = true;
    Sound.play('learned');
    await tween(1.4, k => { STONE.reveal = { g, line, k }; drawStones(); });
    STONE.reveal = null; setMasks(); drawStones(true);
    G.w3d.fx.sparkle(g.x, CEMY + 1.0, g.z, 22, [g.tint, '#fff3a0']);
    W.scene = true; W.k = 0;
    await tween(1.3, k => { W.k = k; W.y = CEMY + 0.3 + k * 1.0; W.x = lerp(g.x, W.home.x, k); W.z = lerp(g.z, W.home.z, k); });
    W.scene = null;
    G.sim.mimo.happy = 1.5; Sound.play('chirp');
    W.api.name = shownName(g, lang(), false);
    await speak(W.api, 'cem.w.' + g.id);
    G.cam.override = null; G.sim.lock = 0;
    const n = restoredCount(); UI.toast(`✓ ${shownName(g, lang())} (${n}/6)`);
    if (n === 3 && !knows('ines')) STORY.think('Baltasar looks a little less gray… maybe his words are coming back.', 5);
    if (n >= 6) STORY.think('All six names are back… Listen! Something by the mausoleum is humming.', 5);
    G.save();
  }
  async function wispTalk(g) { const W = BUILT.eras.now.wisps[g.q]; W.api.name = shownName(g, lang(), false); await speak(W.api, 'cem.w.' + g.id); }
  async function graveLook(g) { STORY.think(THINK.faded.replace('{what}', SYM_NAME[g.sym] || 'a carving'), 5); LEX.expose('w.grave'); LEX.expose('w.name'); }
  async function fillerRead(g) {
    const l = lang();
    // a Read card: the name and the epitaph (zh / ja with their readings), a 🔊, and the English on request (EN), never in a
    // thought after it (DESIGN.md 17.3)
    return readCard({ tag: 'A gravestone', lines: [{ text: nameOf(g, l), en: cjL(l) ? nameOf(g, 'es') : '', look: { face: '#c9c4b8', edge: '#8f8a80', ink: '#4f4a44' } },
      { text: pickLang(g.ep, l, g.en), en: g.en, look: { face: '#c9c4b8', edge: '#8f8a80', ink: '#4f4a44' } }] });
  }
  // ---------------------------------------------------------------- the crow with the photo: ask it nicely
  const CROW_MODEL = { es: '¿Me das la foto, por favor?', pt: 'Me dá a foto, por favor?', de: 'Gibst du mir bitte das Foto?',
    zh: '[请|qǐng] [给|gěi] [我|wǒ] [照片|zhào piàn] ！', ja: '[写真|しゃしん] を ください ！' };
  function judgePolite(text, l) {
    const n = fold(text), words = n.split(' ');
    if (cjkOn(l)) {            // (zh: 请 qǐng + 照片; ja: ください / お願い + 写真)
      const c = CJK.canon(text, l) + ' ' + text;
      return { please: l === 'zh' ? /qing|请/.test(c) : /kudasai|onegai|ください|下さい|お願い|おねがい/.test(c), photo: l === 'zh' ? /zhaopian|照片|xiangpian|相片/.test(c) : /shashin|写真|しゃしん/.test(c), english: words.includes('please') || words.includes('pls') };
    }
    const please = l === 'de' ? words.some(w => /^bitte/.test(w)) : (/\bpor favor\b/.test(n) || words.includes('porfa') || words.includes('porfavor'));
    return { please, photo: words.some(w => ['foto', 'fotografia', 'bild'].includes(w)), english: words.includes('please') || words.includes('pls') };
  }
  async function crowScene() {
    const st = S(), E = BUILT.eras.now, C = E.photoCrow, cp = { name: cap(LEX.form('w.crow')), x: C.perch.x, z: C.perch.z, y: C.perch.y, top: 0.45, talking: false };
    if (st.photo) { STORY.think(THINK.crowDone, 3.5); return; }
    LEX.expose('w.crow'); LEX.expose('w.photo');
    if (!st.crowSeen) { st.crowSeen = true; STORY.think(THINK.crow, 4); await wait(1.2); }
    let tries = st.crowTries || 0;
    for (;;) {
      const r = await UI.command({ name: 'the crow', icon: 'crow', title: 'The crow has an old photo in its beak. How do you ask for it?', verbs: [], placeholder: 'ask nicely…',
        hint: tries ? 'Ask nicely… with the magic word, in the language.' : 'Ask for the photo, in the language.', model: tries >= 2 ? CROW_MODEL[lang()] : undefined, modelEn: 'Can you give me the photo, please?' });
      if (!r || r.cancelled) return;
      const v = judgePolite(r.text, lang());
      if (v.please) { if (v.photo) Sound.play('review'); break; }
      tries++; st.crowTries = tries; G.save();
      Sound.play('shout'); await speak(cp, 'cem.crow', { native: true });
      STORY.think(v.english ? THINK.crowEn : THINK.crowNo, 4.5);
    }
    st.photo = true; setMasks(); G.save();
    Sound.play('pip'); G.w3d.fx.sparkle(C.perch.x, C.perch.y, C.perch.z, 10);
    await tween(0.5, k => { C.body.position.y = Math.sin(k * Math.PI) * 0.25; });
    await speak(cp, 'cem.crow', { native: true });
    await showPhoto('clara');
    clue('clara');
  }
  // ---------------------------------------------------------------- the mausoleum: the song, the door, Aurora, the watch
  function judgeSong(text, l) {
    const words = fold(text).split(' ');
    if (cjkOn(l)) {           // (zh 唱 / 唱歌; ja 歌う, or 歌おう «let's sing»; 歌って / 歌います are close)
      const has = list => list.some(f => CJK.contains(text, f, l));
      if (has(l === 'zh' ? ['[唱|chàng]'] : ['[歌|うた]う', '[歌|うた]おう'])) return 'yes';
      if (l === 'ja' && has(['[歌|うた]って', '[歌|うた]います', '[歌|うた]いましょう', '[歌|うた]った', '[歌|うた]'])) return 'close';
      return words.some(w => ['sing', 'singing'].includes(w)) ? 'english' : 'no';
    }
    if (words.includes(fold(SONG.answer[l]))) return 'yes';
    const close = { es: ['canta', 'cantan', 'cantamos', 'cante', 'canto', 'cantando', 'cantara'], pt: ['canta', 'cantam', 'cantamos', 'cante', 'canto', 'cantando'], de: ['singt', 'sing', 'singe', 'singst', 'gesungen', 'sang'] }[l];
    if (words.some(w => close.includes(w))) return 'close';
    if (words.some(w => ['sing', 'singing'].includes(w))) return 'english';
    return 'no';
  }
  const SONG_CLOSE = { es: 'Almost! After «va a» the verb stays whole: «cantar».', pt: 'Almost! After «vai» the verb stays whole: «cantar».', de: 'Almost! With «wir» it’s «singen».',
    zh: 'Almost! The missing word is «唱» (chàng), to sing.', ja: 'Almost! The song ends with the plain verb: «歌う» (utau).' };
  async function songCard() {
    const l = lang();
    await UI.card(`<div class="tag">Their old song</div><div class="cem-song">${SONG[l].map(t => cardTxt(t, l)).join('<br>')}</div>${enBox(SONG.en[l].map(esc).join('<br>'))}<div class="sub">E</div>`, { kind: 'page cem-doc' });
    if (cjL(l)) SONG[l].forEach(t => CJK.seen(t, { lang: l }));
  }
  const auroraName = () => personName({ id: 'aurora', name: 'Aurora', era: 'now' });
  async function mausScene() {
    const st = S();
    if (st.song) { STORY.think(THINK.mausOpen, 4); const A = BUILT.eras.now.wisps[6]; A.api.name = auroraName(); return speak(A.api, 'cem.w.aurora.after'); }
    if (restoredCount() < 6) { STORY.think(THINK.mausClosed, 5); return; }
    return songScene();
  }
  async function songScene() {
    const st = S(), E = BUILT.eras.now, l = lang(), D = SPOT.mausDoor, { sim } = G;
    sim.lock = 1;
    G.cam.override = { pos: V3(D.x + 10.5, CEMY + 3.4, D.z + 5.2), look: V3(D.x + 1.5, CEMY + 1.7, D.z) };
    const ws = E.wisps.slice(0, 6), arc = ws.map((W, i) => ({ x: D.x + 4.6 - Math.abs(i - 2.5) * 0.35, z: D.z + (i - 2.5) * 1.1 }));
    ws.forEach(W => { W.scene = true; W.from = { x: W.x, z: W.z }; });
    await tween(2.2, k => ws.forEach((W, i) => { const e = easeInOut(k); W.x = lerp(W.from.x, arc[i].x, e); W.z = lerp(W.from.z, arc[i].z, e); W.y = CEMY + 1.3 + Math.sin(k * Math.PI) * 0.9; }));
    for (let i = 0; i < 4; i++) { Sound.play('pip'); await wait(0.3); }
    await STORY.you(YOU.song);
    await songCard();
    let tries = 0;
    for (;;) {
      const r = await UI.command({ name: 'the song', icon: 'musician', title: 'The memories hum their old song, but the last word is missing. Sing it with them!', verbs: [], placeholder: 'the missing word…',
        hint: tries ? 'Every line of the song has the same verb…' : 'One word, in the language.', model: tries >= 2 ? SONG.answer[l] : undefined, modelEn: 'sing' });
      if (!r || r.cancelled) { ws.forEach(W => { W.scene = null; }); G.cam.override = null; sim.lock = 0; return; }
      const v = judgeSong(r.text, l);
      if (v === 'yes') break;
      tries++; Sound.play('wrong');
      STORY.think(v === 'close' ? SONG_CLOSE[l] : v === 'english' ? 'In the language! The song is in the language.' : 'Hmm, that doesn’t fit the song. Every line has the same verb…', 5);
    }
    // they sing: chimes, bobbing, then the door swings open and Aurora comes out
    for (let i = 0; i < 10; i++) { Sound.play(i % 3 === 2 ? 'review' : 'pip'); ws.forEach((W, j) => { W.y = CEMY + 1.3 + ((i + j) % 2 ? 0.28 : 0); }); await wait(0.28); }
    Sound.play('bell'); U.uMask.value[13] = 1;
    E.doorScene = true; await tween(1.6, k => { E.doorK = easeInOut(k); });      // (it stays open: doorScene holds it until the song is saved)
    const A = E.wisps[6]; A.scene = true; A.api.name = auroraName();
    await tween(1.5, k => { A.k = k; A.x = lerp(D.x - 0.6, A.home.x, k); A.z = D.z; A.y = CEMY + 0.9 + k * 0.5; });
    await speak(A.api, 'cem.w.aurora');
    G.state.flags.pocketWatch = true; G.state.bag = G.state.bag || {}; G.state.bag['k.pocketWatch'] = 1; LEX.expose('k.pocketWatch');
    st.song = true; E.doorScene = false; setMasks(); G.save();
    const name = LEX.form('k.pocketWatch', { article: true }), wIt = LEX.item('k.pocketWatch'), wL = (typeof UI !== 'undefined' && UI.lang) || 'es', wCJ = cjL(wL) && wIt && wIt[wL];
    Sound.play('chest');
    await UI.card(`<canvas width="140" height="140"></canvas><div class="tag">Key item</div><div class="big">${wCJ ? CJK.html(wCJ, { lang: wL }) : esc(name)}</div><div class="sub">Aurora’s pocket watch · stopped at eight · <b>E</b></div>`, { kind: 'reveal', icon: 'pocketWatch', say: name });
    await STORY.you(YOU.watch);
    const hi = WORLD.L.hush.findIndex(h => h.cemetery); if (hi >= 0) G.w3d.liftHush(hi);
    Sound.play('fanfare');
    ws.forEach(W => { W.scene = null; }); A.scene = null;
    G.cam.override = null; sim.lock = 0; G.save();
  }

  // ---------------------------------------------------------------- talking to people, what E does here, and arriving
  const askable = id => { const st = S(); return st.ledger && ((id === 'tina' && !knows('elena')) || (id === 'lia' && !knows('mateo'))); };
  async function talk(P) {
    const id = P.def.id, a = P.api; personOf(id);
    if (P.def.era === 'past') { const h = typeof CEMETERY !== 'undefined' && CEMETERY.pastTalk, r = h ? h(id, a) : null; return r || speak(a, 'cem.p.' + id); }     // (pastTalk: Alba long ago after Chapter 2 has lines of its own, alba_past.js)
    if (id === 'baltasar') return baltasarTalk();
    if (askable(id)) return askScene(P, id);
    if (id === 'tina') return speak(a, S().song ? 'cem.tina.after' : 'cem.tina.hello');
    if (id === 'lia') return speak(a, 'cem.lia.hello');
  }
  function interactables() {
    if (!G || !BUILT) return [];
    const Y = G.sim.you; if (Y.z > -186 || Y.x < REGION.x0 || Y.x > REGION.x1 || Y.z < REGION.zN) return [];
    const list = [], st = S(), E = BUILT.eras[era];
    const add = (x, z, r, label, run, y) => { if (Math.abs(x - Y.x) < r + 2 && Math.abs(z - Y.z) < r + 2) list.push({ x, z, r, label, run, y: y !== undefined ? y : gyOf(x, z) }); };
    for (const P of E.people) { const a = P.api, n = list.length; add(a.x, a.z, P.def.look.seat ? 2.4 : 2.5, P.def.era !== 'past' && askable(P.def.id) ? 'Ask' : 'Talk', () => talk(P), a.y); if (P.def.era === 'past' && list.length > n) Object.assign(list[n], { who: 'past:' + P.def.id, p: a }); }     // (who: for STORY.talkHooks)
    // the signs, in either era: the fork's signpost, the theater's name, the post office, the bakery, the north road's gate
    add(SPOT.sign.x + 0.2, SPOT.sign.z + 1.1, 1.7, 'Read', signRead);
    add(HALL.x, HALL.z + HALL.d / 2 + 3.4, 1.7, 'Read', hallRead, HALL.y0 + 0.1);
    for (const h of HOUSES) if (h.kind === 'post' || h.kind === 'bakery') {
      const s = h.kind === 'bakery' ? 0.6 : 0, f = h.d / 2 + 2.3, x = h.x + Math.sin(h.rot) * f + Math.cos(h.rot) * s, z = h.z + Math.cos(h.rot) * f - Math.sin(h.rot) * s;
      add(x, z, 1.5, 'Read', h.kind === 'post' ? postRead : bakeryRead, h.y0 + 0.1);
    }
    { const N = SPOT.northGate; add(N.x - N.ux * 3.9, N.z - N.uz * 3.9, 1.5, 'Read', northRead, GATEY); }
    if (era === 'past') return list;
    add(SPOT.ruinLook.x, SPOT.ruinLook.z, 2.0, 'Look', ruinLook);
    add(SPOT.sale.x, SPOT.sale.z + 0.58, 1.7, 'Read', saleRead);       // (from either side of the board)
    add(SPOT.well.x + 1.1, SPOT.well.z + 0.2, 1.4, 'Look', async () => STORY.think(THINK.well, 3.5));
    add(SPOT.swing.x - 2.3, SPOT.swing.z + 0.9, 1.2, 'Look', async () => STORY.think(THINK.swing, 3.5));
    add(SPOT.peek.x, SPOT.peek.z, 1.5, 'Peek', peek, HALL.y0 + 0.1);
    add(SPOT.hallDoor.x, SPOT.hallDoor.z + 1.25, 1.4, 'Look', hallDoor, HALL.y0 + 0.3);
    add(SPOT.poster.x, SPOT.poster.z, 1.4, 'Read', posterRead, HALL.y0 + 0.1);
    if (!gateOpenNow() && !(typeof MARSH !== 'undefined' && MARSH.gateBusy && MARSH.gateBusy())) { const N = SPOT.northGate; add(N.x - N.ux * 1.5, N.z - N.uz * 1.5, 2.3, 'Look', gateLook, GATEY); }
    if (inBox(CEMBOX, Y.x, Y.z, 8)) {
      add(SPOT.cemGate.x + 1.4, SPOT.cemGate.z + 3.0, 1.3, 'Read', cemSignRead, CEMY);
      add(SPOT.ledger.x - 0.5, SPOT.ledger.z + 0.7, 1.5, 'Read', readLedger, CEMY);
      add(HUT.x - 0.9, HUT.z + 2.9, 1.2, 'Look', async () => STORY.think(THINK.hut, 4), CEMY);
      for (const g of QG) { const f = faceVec(g), x = g.x + f.x * 1.25, z = g.z + f.z * 1.25; if (isRestored(g)) add(x, z, 1.5, 'Talk', () => wispTalk(g), CEMY); else add(x, z, 1.45, st.met ? 'Restore' : 'Look', () => (st.met ? restoreScene(g) : graveLook(g)), CEMY); }
      for (const g of FG) { const f = faceVec(g); add(g.x + f.x * 1.25, g.z + f.z * 1.25, 1.35, 'Read', () => fillerRead(g), CEMY); }
      for (const g of OLDG) add(g.x, g.z + (g.face === 'S' ? 0.9 : -0.9), 1.0, 'Look', async () => STORY.think(THINK.ancient, 3.5), CEMY);
      add(SPOT.obelisk.x + 1.1, SPOT.obelisk.z + 0.6, 1.8, st.photo ? 'Look' : 'Ask', crowScene, CEMY + 0.5);
      add(SPOT.mausDoor.x + 2.7, SPOT.mausDoor.z, 1.9, !st.song && restoredCount() >= 6 ? 'Sing' : 'Look', mausScene, CEMY + 0.5);
      add(SPOT.bench.x, SPOT.bench.z - 0.9, 1.1, 'Look', async () => STORY.think(THINK.bench, 4), CEMY);
    }
    return list;
  }
  // Mimo gets curious about these (words you've seen: the lines and signs show them first)
  function curiosities() {
    if (era !== 'now') return [];
    return [{ id: 'w.grave', x: QG[0].x, z: QG[0].z, r: 5.5 }, { id: 'w.candle', x: FG[0].x, z: FG[0].z - 0.5, r: 4.5 }, { id: 'w.crow', x: SPOT.obelisk.x, z: SPOT.obelisk.z, r: 6 },
      { id: 'w.cemetery', x: SPOT.cemGate.x + 2.5, z: SPOT.cemGate.z, r: 6 }, { id: 'w.photo', x: SPOT.ruinLook.x, z: SPOT.ruinLook.z, r: 4 }];
  }
  // arriving: the Old Quarter (a chapter card), the theater (Mimo shivers), the cemetery, the chained gate
  function triggers(you) {
    if (!G || !G.state.flags || !G.state.flags.hatched || STORY.busy || STORY.line || G.state.teaching || G.journalOpen || (G.indoors && G.indoors())) return;
    const st = S(), x = you.x, z = you.z; if (z > -195) return;
    if (!st.seen.quarter && inBox(QUARTER, x, z) && z < -197) { st.seen.quarter = true; G.save(); UI.chapter('The Old Quarter', era === 'past' ? 'Alba, long ago' : 'Alba’s outskirts'); if (era === 'now') STORY.think(THINK.quarter, 6); return; }
    if (era !== 'now') return;
    if (!st.seen.hall && Math.hypot(x - SPOT.hallDoor.x, z - (SPOT.hallDoor.z + 4)) < 6.5) { st.seen.hall = true; G.save(); STORY.run(hallScene); return; }
    if (!st.seen.cemetery && inBox(CEMBOX, x, z, -0.6)) { st.seen.cemetery = true; G.save(); STORY.run(arriveCemetery); return; }
    if (!st.seen.gate && !gateOpenNow() && !(typeof MARSH !== 'undefined' && MARSH.open && MARSH.open(G.state)) && Math.hypot(x - SPOT.northGate.x, z - SPOT.northGate.z) < 5) { st.seen.gate = true; G.save(); STORY.think(THINK.gate, 5.5); }
  }
  // ---------------------------------------------------------------- the side quest (a quests.js LIST entry)
  function nextTarget() {
    const Y = G.sim.you, d = p => Math.hypot(p.x - Y.x, p.z - Y.z), todo = QG.filter(g => !isRestored(g));
    const ready = todo.filter(g => knows(g.id)).map(g => { const f = faceVec(g); return { x: g.x + f.x * 1.25, z: g.z + f.z * 1.25 }; });
    if (ready.length) return ready.sort((a, b) => d(a) - d(b))[0];
    const src = { tina: SPOT.tina, photo: SPOT.ruinLook, crow: SPOT.obelisk, lia: SPOT.lia, poster: SPOT.poster, baltasar: SPOT.baltasar };
    const open = todo.filter(g => g.clue !== 'baltasar' || restoredCount() >= 3).map(g => src[g.clue]);
    return open.length ? open.sort((a, b) => d(a) - d(b))[0] : SPOT.baltasar;
  }
  function quest() {
    const st = s => s.cemetery || {}, rc = s => QG.filter(g => (st(s).restored || {})[g.id]).length;
    return {
      id: 'cemetery', kind: 'side', title: 'The faded {w.name:pl}', giver: 'Baltasar, the gravekeeper',
      started: s => !!st(s).met,
      steps: [
        { text: 'Read Baltasar’s book by his hut', word: 'w.grave',
          why: 'The Hush has faded the {w.name:pl} on six {w.grave:pl}, because nobody says them anymore. Baltasar keeps a book of everyone buried there.',
          done: s => !!st(s).ledger, target: () => SPOT.ledger, hint: '{mimo} hops toward the hut. The book is on a stand by the door.' },
        { text: 'Give the {w.grave:pl} their {w.name:pl} back ({n}/6)', n: rc, word: 'w.name',
          why: 'The book says what each of them did. The {w.name:pl} come from people who remember them: Doña Tina on her porch, the girl by the swing, a {w.photo} in the fallen house, a {w.crow}, the theater’s poster… and Baltasar, once his words come back. At a {w.grave}, type the {w.name} and the job.',
          done: s => rc(s) >= 6, target: nextTarget, hint: '{mimo} sniffs the air… over there!' },
        { text: 'Sing with them at the mausoleum',
          why: 'With all six {w.name:pl} back, the memories hum an old song by Aurora’s mausoleum. But its last word is missing.',
          done: s => !!s.flags.pocketWatch, target: () => ({ x: SPOT.mausDoor.x + 2.7, z: SPOT.mausDoor.z }), hint: '{mimo}’s ears perk up. The humming comes from the mausoleum!' },
      ],
      story: [
        { when: s => !!st(s).met, text: 'North of Alba, past the Old Quarter, a worn brick road leads to the {w.cemetery}. The Hush has faded the {w.name:pl} on six {w.grave:pl}: nobody says them anymore. Baltasar, the gravekeeper, is going gray too.' },
        { when: s => rc(s) >= 1, text: 'Every {w.name} you give back brings back a memory, and Baltasar finds a few of his words again.' },
        { when: s => !!s.flags.pocketWatch, text: 'With all six {w.name:pl} back, the memories sang their old song, and you sang the missing word. Aurora Campos, who built the old theater, gave you her pocket watch. It stopped at eight.' },
      ],
    };
  }
  // ---------------------------------------------------------------- the mini-map: roads, roofs and the cemetery, drawn into its picture
  // (in world units, on the picture's context, before the Hush patches are painted over it)
  function drawMap(c, o = {}) {
    const PX = o.PX || 1 / 3, INK = o.INK || '#2b2235', now = era === 'now';
    const line = pts => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); };
    const tone = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
    c.save(); c.lineJoin = c.lineCap = 'round';
    const keys = ['main', 'left', 'right', 'beyond'];
    c.strokeStyle = 'rgba(86,46,30,0.55)'; for (const k of keys) { c.lineWidth = ROADS[k].w + 2.6 * PX; line(ROADS[k].P); c.stroke(); }
    c.fillStyle = 'rgba(86,46,30,0.55)'; c.fillRect(SQUARE.x0 - 1.3 * PX, SQUARE.zN - 1.3 * PX, SQUARE.x1 - SQUARE.x0 + 2.6 * PX, SQUARE.zS - SQUARE.zN + 2.6 * PX);
    for (const k of keys) { c.strokeStyle = k === 'beyond' ? '#c9b1a4' : now ? '#d9a283' : '#e09670'; c.lineWidth = ROADS[k].w; line(ROADS[k].P); c.stroke(); }
    c.fillStyle = now ? '#d9a283' : '#e09670'; c.fillRect(SQUARE.x0, SQUARE.zN, SQUARE.x1 - SQUARE.x0, SQUARE.zS - SQUARE.zN);
    c.strokeStyle = 'rgba(120,60,40,0.35)'; c.lineWidth = 0.3; c.setLineDash([0.4, 0.5]); for (const k of keys) { line(ROADS[k].P); c.stroke(); } c.setLineDash([]);
    const roof = (b, color) => {
      c.save(); c.translate(b.x, b.z); c.rotate(-(b.rot || 0)); const hw = b.w / 2, hd = b.d / 2;
      c.fillStyle = 'rgba(25,16,40,0.28)'; c.fillRect(-hw + 0.35, -hd + 0.45, b.w, b.d);
      c.fillStyle = tone(color, 0.75); c.fillRect(-hw, -hd, b.w, hd); c.fillStyle = color; c.fillRect(-hw, 0, b.w, hd);
      c.strokeStyle = INK; c.lineWidth = 1.4 * PX; c.strokeRect(-hw, -hd, b.w, b.d); c.beginPath(); c.moveTo(-hw, 0); c.lineTo(hw, 0); c.stroke();
      c.fillStyle = '#5a3a24'; c.fillRect(-0.5, hd - 0.1, 1.0, 0.5); c.restore();
    };
    for (const h of HOUSES) {
      if (now && h.kind === 'ruin') { c.save(); c.translate(h.x, h.z); c.rotate(-h.rot); c.fillStyle = '#a8a093'; c.fillRect(-h.w / 2, -h.d / 2, h.w / 2, h.d); c.strokeStyle = INK; c.lineWidth = 1.2 * PX; c.strokeRect(-h.w / 2, -h.d / 2, h.w / 2, h.d); c.restore(); roof({ x: h.x, z: h.z + h.w / 4, w: h.w / 2, d: h.d, rot: h.rot }, h.roof[0]); continue; }
      roof(h, now ? h.roof[0] : h.roof[1]);
    }
    { const b = HALL, col = now ? '#6b6276' : '#5c4a7a'; c.fillStyle = 'rgba(25,16,40,0.28)'; c.fillRect(b.x - b.w / 2 + 0.4, b.z - b.d / 2 + 0.5, b.w, b.d);
      c.fillStyle = tone(col, 0.8); c.fillRect(b.x - b.w / 2, b.z - b.d / 2, b.w / 2, b.d); c.fillStyle = col; c.fillRect(b.x, b.z - b.d / 2, b.w / 2, b.d);
      c.strokeStyle = INK; c.lineWidth = 1.5 * PX; c.strokeRect(b.x - b.w / 2, b.z - b.d / 2, b.w, b.d); c.beginPath(); c.moveTo(b.x, b.z - b.d / 2); c.lineTo(b.x, b.z + b.d / 2); c.stroke();
      c.fillStyle = now ? '#a89c88' : '#e8b83e'; c.beginPath(); c.arc(b.x, b.z + b.d / 2 - 1.1, 0.75, 0, TAU); c.fill(); c.stroke(); }
    // the cemetery
    const B = CEMBOX, G0 = SPOT.cemGate;
    if (now) {
      c.fillStyle = 'rgba(70,100,60,0.22)'; c.fillRect(B.x0, B.zN, B.x1 - B.x0, B.zS - B.zN);
      c.fillStyle = '#e4dbc4'; c.fillRect(MAUS.x + 4.9, G0.z - 1.2, B.x1 - MAUS.x - 4.9, 2.4); for (const px of [-70, -80]) c.fillRect(px - 0.8, B.zN + 1.5, 1.6, B.zS - B.zN - 3);
      c.strokeStyle = '#3a3640'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(B.x1, G0.z - 2.6); c.lineTo(B.x1, B.zN); c.lineTo(B.x0, B.zN); c.lineTo(B.x0, B.zS); c.lineTo(B.x1, B.zS); c.lineTo(B.x1, G0.z + 2.6); c.stroke();
      for (const g of [...QG, ...FG, ...OLDG]) { c.fillStyle = g.q !== undefined && !isRestored(g) ? '#a9a5b8' : '#d8d3c6'; c.strokeStyle = INK; c.lineWidth = 0.9 * PX; c.beginPath(); c.rect(g.x - 0.55, g.z - 0.3, 1.1, 0.6); c.fill(); c.stroke(); }
      roof({ x: MAUS.x, z: MAUS.z, w: MAUS.w, d: MAUS.d, rot: MAUS.rot }, '#a8a296');
      for (const [x, z] of CYPRESS) { c.fillStyle = '#2f5a3a'; c.beginPath(); c.arc(x, z, 1.25, 0, TAU); c.fill(); c.fillStyle = '#4a7a50'; c.beginPath(); c.arc(x - 0.2, z - 0.2, 0.85, 0, TAU); c.fill(); }
    } else {
      c.strokeStyle = '#f4efe4'; c.lineWidth = 0.35; c.strokeRect(-74, -273, 17.6, 16);
      c.fillStyle = '#e4dbc4'; c.fillRect(-74, G0.z - 1.0, 18, 2.0);
    }
    roof(HUT, now ? '#5d6b5a' : '#7a5236');
    for (const t of PATH_TREES) { c.fillStyle = t.kind === 'birch' ? '#7fb04f' : t.kind === 'cypress' ? '#2f5a3a' : '#4a8f3f'; c.beginPath(); c.arc(t.x, t.z, t.kind === 'cypress' ? 1.1 : 1.7, 0, TAU); c.fill(); }
    { const N = SPOT.northGate, px = -N.uz, pz = N.ux; c.strokeStyle = '#3a3640'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(N.x - px * 2.2, N.z - pz * 2.2); c.lineTo(N.x + px * 2.2, N.z + pz * 2.2); c.stroke();
      c.strokeStyle = '#9d968a'; c.lineWidth = 0.9; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(N.x + px * s * 2.4, N.z + pz * s * 2.4); c.lineTo(N.x + px * s * 8, N.z + pz * s * 8); c.stroke(); } }
    c.restore();
  }

  // the places world.js keeps its trees, rocks and flowers away from (this file's props and its own trees)
  KEEP.push({ x: SPOT.swing.x, z: SPOT.swing.z, r: 3.4 }, { x: SPOT.well.x, z: SPOT.well.z, r: 1.6 }, { x: SPOT.sign.x, z: SPOT.sign.z, r: 1.6 }, { x: SPOT.cart.x, z: SPOT.cart.z, r: 2 },
    { x: SPOT.northGate.x, z: SPOT.northGate.z, r: 4 }, ...PATH_TREES.map(t => ({ x: t.x, z: t.z, r: 2.6 })));
  { const N = SPOT.northGate, px = -N.uz, pz = N.ux; for (let s = -14; s <= 14; s += 2) KEEP.push({ x: N.x + px * s, z: N.z + pz * s, r: 1.6 }); }

  return {
    // plain data and hooks for world.js / minimap.js (ready at load)
    layout: {
      buildings: HOUSES.map(h => ({ x: h.x, z: h.z, w: h.w, d: h.d, rot: h.rot, floors: h.floors, kind: 'house', id: h.id }))
        .concat([HALL, HUT, MAUS].map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d, rot: b.rot, floors: b.floors, kind: b.kind }))),
      roads: Object.fromEntries(Object.entries(ROADS).map(([k, r]) => [k, { w: r.w, pts: r.pts.map(p => p.slice()), len: r.len }])),
      square: SQUARE, quarter: QUARTER, hall: HALL, cemetery: CEMBOX, graves: QG.map(g => ({ id: g.id, x: g.x, z: g.z })), heights: { square: SQY, cemetery: CEMY, gate: GATEY },
    },
    hush: HUSH, ground, playDist, keepClear, bareAt, areaAt, songAt, drawMap,
    landmarks: SPOT, PEOPLE,
    // tests: every zh / ja string here (the notation, stars stripped), checked against CJK.md → [{ where, src, problems }]
    _cjCheck() {
      if (typeof CJK === 'undefined') return [];
      const out = [], chk = (where, s, l) => { if (typeof s !== 'string' || !s) return; const p = CJK.validate(s.replace(/\*/g, ''), l); if (p.length) out.push({ where, src: s, problems: p }); };
      for (const l of ['zh', 'ja']) {
        for (const [k, T] of Object.entries(LT)) (T[l] || []).forEach((s, i) => chk(`line ${k}[${i}]`, s, l));
        for (const [n, T] of Object.entries({ SIGNW, SIGN_NAT, LEDGER, PHOTO_TXT })) for (const [k, v] of Object.entries(T)) chk(`${n}.${k}`, v[l], l);
        POSTER[l].forEach((s, i) => chk('POSTER ' + i, s, l)); SONG[l].forEach((s, i) => chk('SONG ' + i, s, l)); chk('SONG.answer', SONG.answer[l], l);
        Object.entries(CJ_NAMES).forEach(([id, N]) => { (N[l] || []).forEach(s => chk('name ' + id, s, l)); if (N.young) chk('name ' + id, N.young[l], l); });
        FG.forEach(g => chk('epitaph ' + g.id, g.ep[l], l)); Object.entries(CJ_WORDS).forEach(([id, T]) => { chk('word ' + id, T[l], l); ((T.alt || {})[l] || []).forEach(s => chk('word ' + id, s, l)); });
        Object.entries(JOBS).forEach(([k, J]) => chk('job ' + k, J[l][0], l));
      }
      return out;
    },
    build,
    init(game) {
      G = game; addCSS();
      if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'cemetery')) QUESTS.LIST.push(quest());
    },
    interactables, curiosities, setEra, quest,
    get era() { return era; },
    // tests and tools
    _: {
      ROADS, HOUSES, HALL, HUT, MAUS, CEMBOX, QUARTER, SQUARE, QG, FG, OLDG, SPOT, JOBS, LT, YOU, THINK, SONG, U, KEEP, PATH_TREES,
      natural, judgeRestore, judgePolite, judgeSong, parseQuestion, restoreScene, restoreFx, crowScene, songScene, readLedger, askScene, baltasarTalk, ruinLook, posterRead, peek, hallScene,
      talk, triggers, applyState, setMasks, personOf, nextTarget, restoredCount, S: () => S(), get built() { return BUILT; }, stats: () => BUILT && stats(), drawStones, drawSigns,
      get stone() { return STONE; }, get sign() { return SIGN; },
    },
  };
})();
