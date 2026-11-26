'use strict';
// The themed homes, part 2: the layout engine and the themes (DESIGN.md 16, playtest 4). Each theme is a spec for
// LAY.ground (the ground floor) and LAY.up (the room upstairs, or at the back), in canonical coordinates (see
// interiors_themes.js). A ground floor, from the walls in:
//   bed     the west wall's north half: a single or double bed, a nightstand, a picture over it (when nobody sleeps upstairs)
//   kitchen the east wall's north half: a stove and a counter under a sunny window ('full'), or a stove and a shelf ('small')
//   hero    the north wall between them: what the house is about (an easel, a loom, a fish tank…), with the 'hero' spot
//   center  'dining' (a table, two chairs, a lamp over it), 'sofa' (a sofa facing the hero, a low table), 'rug', or a fn
//   sw / se the south halves of the west and east walls (se only when the house has no stairs or back room)
//   walls   anything more for the walls; door: what stands by the front door; pics: [cells] for the walls
// Spots (who stands, sits or sleeps where): hero cook sit sofa bed desk floor stand arm rock cat dog pet parrot canary turtle.
const LAY = (() => {
  if (typeof ITH === 'undefined' || !ITH) return null;
  const { F, F0, K, BRIGHT, PI } = ITH, H = PI / 2;
  const PICS = ['hills', 'lake', 'vase', 'tower', 'sea', 'mill', 'flowers2', 'boat', 'birdprint', 'fishprint'];

  // ------------------------------------------------------------ the ground floor
  function ground(Z, s = {}) {
    const { hw, hd, R, P } = Z, out = { x0: -hw + 0.45, x1: hw - 0.45 };
    // the bed nook (west wall, north half)
    let bedEnd = -hd;
    if (s.bed) {
      const dbl = s.bed === 'double', bw = dbl ? 1.5 : 1.0, L = 2.05, bx = -hw + bw / 2 + 0.12, bz = -hd + L / 2 + 0.06;
      Z.put(F0.bed, bx, bz, 0, { w: bw, L, quilt: s.quilt || P.fab[0], patch: s.patch || (R() < 0.5 ? P.fab[2] : null), wood: s.bedWood || P.wood, head: dbl ? 1.1 : 0.95 });
      Z.put(F0.nightstand, -hw + bw + 0.47, -hd + 0.28, 0, { book: true, cup: R() < 0.4 });
      Z.wall(4, bz + 0.1, 2.0, F0.picture, { cell: s.bedPic || K.pick(PICS, R), w: 0.75, h: 0.55 });
      Z.spot('bed', bx + bw / 2 + 0.05, bz + 0.35, H, { seat: 0.5 });
      Z.spot('catbed', bx, bz + 0.45, H, { pose: 'sleep', y: 0.62 });
      out.x0 = -hw + bw + 0.85; bedEnd = -hd + L + 0.12;
    }
    // the kitchen (east wall, north half)
    let kEnd = -hd;
    if (s.kitchen) {
      const st = Z.room.door.style;
      if (st === 'lake' && s.kitchen !== 'full') { Z.E(F0.potStove, -hd + 0.7, 1.0, {}); kEnd = -hd + 1.3; }
      else { Z.E(F0.stove, -hd + 0.55, 0.66, {}); kEnd = -hd + 1.05; }
      if (s.kitchen === 'full' || s.kitchen === true) {
        const len = Math.min(1.7, Math.max(1.0, (Z.second ? 0.1 : hd - 1.2) - kEnd));
        Z.E(F0.counter, kEnd + len / 2 + 0.02, 0.64, { len });
        Z.wall(2, kEnd + len / 2, 2.2, F0.windowItem, { w: Math.min(1.0, len - 0.2), h: 0.85, curtains: false, sun: true });
        kEnd += len + 0.05;
      } else {
        Z.wall(2, kEnd + 0.5, 1.75, F0.wallShelf, { len: 0.8, what: 'jars' });
        if (kEnd + 1.6 < (Z.second ? 0.2 : hd - 1.2)) Z.wall(2, kEnd + 1.5, 2.35, F.potRail, { len: 0.8 });
        kEnd += 0.2;
      }
      Z.spot('cook', hw - 1.15, -hd + 0.62, H, { job: 'cook', prop: 'spoon' });       // (facing the stove, east)
      out.x1 = hw - 0.85;
    }
    out.bedEnd = bedEnd; out.kEnd = kEnd;
    // what the house is about, on the north wall
    if (s.hero) s.hero(Z, out);
    // the middle
    const cx = s.cx !== undefined ? s.cx : (s.bed && !s.kitchen ? 0.5 : s.kitchen && !s.bed ? -0.4 : 0), cz = s.cz !== undefined ? s.cz : -0.1;
    if (s.center === 'dining' || s.center === undefined) dining(Z, cx, cz, s);
    else if (s.center === 'sofa') sofaSet(Z, cx, cz, s);
    else if (s.center === 'rug') { Z.put(F0.roundRug, cx, cz, 0, { r: 1.1, cols: s.rug }); Z.spot('floor', cx - 0.3, cz + 0.2, PI * 0.9, {}); Z.spot('cat', cx + 0.4, cz - 0.2, -1.0, { pose: 'sleep' }); Z.spot('dog', cx + 0.5, cz + 0.1, -0.6, { pose: 'lie' }); }
    else if (typeof s.center === 'function') s.center(Z, cx, cz);
    // the south halves of the side walls
    const swZ0 = Math.max(bedEnd + 0.15, 0.1), swZ1 = hd - (s.cornerW === false ? 0.45 : 0.95);
    if (s.sw) s.sw(Z, swZ0, swZ1); else Z.W(F0.dresser, (swZ0 + swZ1) / 2, 0.5, { w: 1.2, rack: false });
    if (!Z.second) { const se0 = Math.max(kEnd + 0.15, 0.1), se1 = hd - 0.95; if (s.se) s.se(Z, se0, se1); else { Z.E(F0.bookcase, (se0 + se1) / 2, 0.36, { w: 1.0, h: 1.7 }); } }
    // a runner from the door mat toward the middle, and plants in the south corners that are free
    if (s.runner !== false) Z.put(F0.rectRug, 0, hd - 1.55, 0, { w: 1.0, d: 1.3, cols: s.runnerCols || [P.fab[6], P.fab[7], P.fab[4]] });
    if (s.cornerW !== false) Z.put(F0.plantItem, -hw + 0.45, hd - 0.45, 0, { tall: R() < 0.5, s: 0.95 });
    if (!Z.second && s.cornerE !== false) Z.put(F0.floorLamp, hw - 0.4, hd - 0.4, 0, {});
    // by the front door
    const door = s.door === undefined ? 'coat' : s.door;
    if (door) {
      if (door === 'coat' || door === 'both') Z.put(F0.coatRack, -1.25, hd - 0.42, 0, {});
      if (door === 'umbrella' || door === 'both') Z.put(F.umbrellas, door === 'both' ? -1.75 : -1.2, hd - 0.3, 0, {});
      if (door === 'shoes') Z.S(F.shoeRack, -1.45, 0.3, {});
    }
    if (!Z.second || hw > 4.2) Z.put(F0.plantItem, 1.3, hd - 0.42, 0, { tall: R() < 0.4 });
    // the walls: a clock and a picture by the door, a window on each side wall's south half (unless the theme put something there)
    Z.wall(3, -2.2, 2.45, F0.clockItem, { pendulum: R() < 0.3, look: s.clockLook === false ? false : undefined });
    Z.wall(3, 2.15, 2.05, F0.picture, { cell: s.sampler || 'sampler', w: 0.55, h: 0.55, frame: '#8a5f3e' });
    if (s.winW !== false) Z.wall(4, s.winW !== undefined ? s.winW : hd * 0.42, 2.15, F0.windowItem, { w: 0.9, h: 0.85 });
    if (!Z.second && s.winE !== false && s.kitchen !== 'full') Z.wall(2, s.winE !== undefined ? s.winE : hd * 0.42, 2.15, F0.windowItem, { w: 0.9, h: 0.85, sun: true });
    if (s.walls) s.walls(Z, out);
    if (s.pets) s.pets(Z);
    // a free place to stand, near the middle, for whoever lives here
    Z.spot('stand', cx + (s.bed ? 0.9 : -0.9), cz + 1.25, PI * 0.95, {});
    Z.spot('stand', cx - 1.6, cz - 0.9, PI * 0.8, {});
    return out;
  }
  // a table for two (or four), a rug under it, a lamp over it
  function dining(Z, x, z, s = {}) {
    const P = Z.P, R = Z.R, w = s.tableW || 1.2;
    Z.put(F0.rectRug, x, z, 0, { w: w + 1.3, d: 1.9, cols: s.rug });
    Z.put(F0.table, x, z, 0, { w, d: 0.8, cloth: R() < 0.5 ? P.fab[5] : null });
    const ch = s.chairs || 2, col = s.chairColor || P.wood;
    const seats = ch >= 4 ? [[-0.35, -0.7, 0], [0.35, -0.7, 0], [-0.35, 0.7, PI], [0.35, 0.7, PI]] : ch === 3 ? [[-w / 2 - 0.42, 0, H], [w / 2 + 0.42, 0, -H], [0, -0.7, 0]] : [[-w / 2 - 0.42, 0, H], [w / 2 + 0.42, 0, -H]];
    seats.forEach(([dx, dz, yaw], i) => { const m = Z.put(F0.chair, x + dx, z + dz, yaw, { color: col, cushion: i % 2 ? null : P.fab[3], look: i ? null : 'w.chair' }); Z.spot('sit', x + dx, z + dz, yaw, { seat: m.seat }); });
    Z.lamp(x, z, 2.5, s.lampColor || P.fab[1]);
    Z.spot('cat', x + 0.75, z + 0.75, -0.8, { pose: 'sleep' }); Z.spot('dog', x - 1.0, z + 1.0, 0.6, { pose: 'lie' });
  }
  // a sofa with its back to the door, a low table in front of it
  function sofaSet(Z, x, z, s = {}) {
    const P = Z.P;
    Z.put(F0.roundRug, x, z - 0.2, 0, { r: 1.2, cols: s.rug });
    Z.put(F.sofa, x, z + 0.55, PI, { color: s.sofaColor || P.fab[1], w: 1.8 });
    Z.put(F.coffeeTable, x, z - 0.45, 0, { w: 0.95 });
    Z.spot('sofa', x - 0.4, z + 0.5, PI, { seat: 0.5 }); Z.spot('sofa', x + 0.45, z + 0.5, PI, { seat: 0.5 });
    Z.spot('cat', x + 0.75, z + 0.45, PI, { pose: 'sleep', y: 0.52 }); Z.spot('dog', x - 1.1, z - 0.3, 0.8, { pose: 'lie' }); Z.spot('floor', x + 0.9, z - 0.6, -0.6, {});
    Z.lamp(x, z - 0.2, 2.6, s.lampColor || P.fab[2]);
  }

  // ------------------------------------------------------------ the room upstairs (or at the back)
  // spec: { bed: 'double' | 'single' | 'bunks' | 'kid' | 'none', crib, desk: items (or a fn(Z, z0, z1)), hero: fn(Z) (the
  // west wall's north half), walls: fn(Z), quilt, pics, rug }
  function up(Z, s = {}) {
    const { hw, hd, R, P } = Z, back = Z.back;
    const bed = s.bed || 'double', bx = s.bx !== undefined ? s.bx : 0.2;
    if (bed === 'double' || bed === 'single' || bed === 'kid') {
      const bw = bed === 'double' ? 1.55 : 1.0, L = bed === 'kid' ? 1.7 : 2.05;
      Z.put(F0.bed, bx, -hd + L / 2 + 0.06, 0, { w: bw, L, quilt: s.quilt || P.fab[0], patch: s.patch || P.fab[2], wood: P.wood, head: bed === 'double' ? 1.15 : 0.95, toys: bed === 'kid' });
      for (const sx of [-1, 1]) if (bed === 'double' || sx > 0) Z.put(F0.nightstand, bx + sx * (bw / 2 + 0.36), -hd + 0.28, 0, { book: sx < 0, cup: sx > 0 });
      Z.wall(1, bx, 2.25, F0.picture, { cell: (s.pics && s.pics[0]) || K.pick(PICS, R), w: 0.85, h: 0.6 });
      Z.spot('bed', bx + bw / 2 - 0.1, -hd + L + 0.2, PI * 0.95, { seat: 0.5 }); Z.spot('catbed', bx - 0.2, -hd + L * 0.6, 0.5, { pose: 'sleep', y: 0.62 });
      Z.spot('sleep', bx, -hd + L / 2 + 0.06 + L / 2 - 0.35, 0, { lie: true, y: 0.55 });
    } else if (bed === 'bunks') {
      Z.put(F.bunks, bx, -hd + 1.08, 0, { q1: P.fab[0], q2: P.fab[3] });
      Z.spot('bed', bx + 0.65, -hd + 2.3, PI * 0.9, { seat: 0.5 });
    }
    if (s.crib) { Z.put(F.crib, bx - 1.6, -hd + 0.7, 0, {}); Z.spot('crib', bx - 1.6, -hd + 0.7, 0, {}); }
    // the wardrobe (east wall, north), the desk or a hobby (east wall, south)
    if (s.wardrobe !== false) Z.E(F0.wardrobe, -hd + 0.8, 0.56, { w: 1.1 });
    const e0 = -hd + 1.6, e1 = hd - 0.45;
    if (typeof s.desk === 'function') s.desk(Z, e0, e1);
    else if (s.desk !== false) {
      const dz = (e0 + e1) / 2 + 0.2;
      Z.E(F.desk, dz, 0.6, { items: s.desk || 'homework', w: 1.15 });
      const m = Z.put(F0.chair, hw - 1.1, dz, H, { color: P.wood, look: null }); Z.spot('desk', hw - 1.1, dz, H, { seat: m.seat, job: 'write' });
      Z.wall(2, dz, 2.2, F0.windowItem, { w: 0.9, h: 0.8, sun: true });
    }
    // the west wall: upstairs its north half is free (the stairs are in the south-west corner); a back room has all of it
    if (s.hero) s.hero(Z, back ? hd - 0.5 : -0.2);
    else Z.W(F0.dresser, back ? 0.6 : -hd + 1.6, 0.5, { w: 1.1, rack: false });
    if (s.corner !== false) Z.put(F0.plantItem, -hw + 0.45, -hd + 0.45, 0, { tall: true, s: 0.9 });
    if (s.shelf !== false) Z.wall(4, back ? 0.6 : -hd + 1.6, 1.9, F.shelf, { len: 0.9, what: s.shelf || 'books' });
    if (back) Z.wall(4, -hd + 1.0, 2.2, F0.windowItem, { w: 0.8, h: 0.75 });
    Z.put(F0.roundRug, 0.3, 0.5, 0, { r: 1.0, cols: s.rug }); Z.spot('floor', 0.0, 0.6, PI, {}); Z.spot('cat', 0.7, 0.3, -1.2, { pose: 'sleep' }); Z.spot('dog', 0.6, 0.8, -0.5, { pose: 'lie' });
    Z.spot('stand', 1.2, 1.2, PI * 0.9, {});
    Z.lamp(0.3, 0.2, 2.45, P.fab[2]);
    if (s.walls) s.walls(Z);
    if (!back) Z.wall(3, 1.4, 2.0, F0.picture, { cell: (s.pics && s.pics[1]) || 'calendar', w: 0.42, h: 0.42, frame: '#fdf8ee' });
  }

  // ------------------------------------------------------------ helpers for the themes' own pieces
  // something against the north wall at x (d: its depth), a spot in front of it
  const N = (Z, fn, x, d, o, sp) => { const m = Z.N(fn, x, d, o || {}); if (sp) Z.spot(sp.type || 'hero', x + (sp.dx || 0), -Z.hd + d + (sp.dz !== undefined ? sp.dz : 0.55), sp.yaw !== undefined ? sp.yaw : PI, sp); return m; };
  const T = (name, def) => INTERIORS.theme(name, { size: def.size || 'M', label: def.label || '', ground: Z => ground(Z, def.g || {}), up: Z => up(Z, def.u || {}) });
  return { ground, up, dining, sofaSet, N, T, PICS };
})();

// ============================================================ the themes: the generic one, then Alba's homes
(() => {
  if (!LAY) return;
  const { F, F0, K, PI } = ITH, { N, T } = LAY, H = PI / 2;
  const pic = (Z, w, t, y, cell, sz = 0.6, o = {}) => Z.wall(w, t, y, F0.picture, Object.assign({ cell, w: sz, h: sz * 0.8 }, o));
  // the hearth (the town's own: a brick fireplace, Molinar's hood, Remanso's iron stove), and a chair to sit by it
  const hearth = (Z, o, chair = 'rock', job = 'knit', prop = 'knit') => {
    const x = (o.x0 + o.x1) / 2 - 0.4, st = Z.room.door.style;
    Z.N(st === 'molinar' ? F0.hood : st === 'lake' ? F0.potStove : F0.fireplace, x, st === 'lake' ? 1.0 : 0.85, {});
    const cx = Math.min(o.x1 - 0.4, x + 1.75), cz = -Z.hd + 1.55;
    if (chair === 'rock') { const b = K.rockingChair(Z.room, Z.X(cx), cz, Z.Y(-0.9), Z.P.wood); Z.spot('rock', cx, cz, -0.9, { bone: b, seat: 0.5, job, prop }); }
    else if (chair) { Z.put(F0.armchair, cx, cz, -0.9, { color: Z.P.fab[0] }); Z.spot('arm', cx, cz, -0.9, { seat: 0.56, job: job === 'knit' ? 'read' : job, prop: prop === 'knit' ? 'book' : prop }); }
    return x;
  };

  // the generic home (a door with no profile): a bed, a kitchen, the hearth, a table for two
  T('cozy', { size: 'M', label: '', g: { bed: 'single', kitchen: 'full', hero: (Z, o) => hearth(Z, o, Z.R() < 0.5 ? 'rock' : 'arm') }, u: { bed: 'double' } });

  // ---- Alba
  // 01 the lamplighter: lanterns on every shelf, a ladder, the one he's mending on the bench
  T('lamplighter', { label: 'the lamplighter’s house', g: { bed: 'single', kitchen: 'small', center: 'dining',
    hero: (Z, o) => {
      N(Z, F0.workbench, -0.6, 0.86, { len: 1.6 }, { job: 'tinker', prop: 'tool' });
      { const k = Z.at(-0.6, -Z.hd + 0.45); for (let i = 0; i < 2; i++) { k.post(-0.4 + i * 0.7, 0.9, 0, 0.16, 0.24, 0.16, '#3a3436', { ink: 0.004 }); k.box(-0.4 + i * 0.7, 1.02, 0, 0.12, 0.16, 0.12, '#ffe2a0', { b: 'glow', c2: '#ffc870' }); } }
      Z.wall(1, -0.6, 1.55, F.shelf, { len: 1.5, what: 'lanterns', levels: 2 });
      N(Z, F.ladder, 1.6, 0.4, { h: 2.6 });
      Z.wall(1, 2.6, 2.3, F0.windowItem, { w: 0.8, h: 0.8 });
    },
    sw: (Z, a, b) => { Z.W(F0.bench, (a + b) / 2, 0.42, { w: 1.2, cushion: Z.P.fab[2] }); { const k = Z.at(-Z.hw + 0.35, (a + b) / 2 + 0.95, 0, 0); for (let i = 0; i < 3; i++) { k.post(i * 0.22 - 0.2, 0, 0, 0.14, 0.2, 0.14, '#3a3436', { ink: 0.003 }); k.box(i * 0.22 - 0.2, 0.1, 0, 0.1, 0.14, 0.1, '#ffe2a0', { b: 'glow', flick: 0.05, c2: '#ffc870' }); } } },
    walls: Z => { Z.wall(4, -0.4, 3.0, F.garland, { len: 2.4, lights: true }); Z.wall(2, 1.5, 3.0, F.garland, { len: 2.0, lights: true }); } } });
  // 02 the beekeeper: hives and frames, honey on the shelves, flowers
  T('beekeeper', { label: 'the beekeeper’s cottage', g: { bed: 'single', kitchen: 'full',
    hero: (Z, o) => { N(Z, F.hives, -1.0, 0.5, {}, { job: 'tinker', prop: 'tool', dz: 0.6 }); Z.wall(1, 0.9, 1.35, F.shelf, { len: 1.4, what: 'honey', levels: 2 }); N(Z, F.plants, 2.4, 0.5, {}); pic(Z, 1, -1.0, 2.2, 'flowers2', 0.7); },
    sw: (Z, a, b) => { Z.W(F.flowerBuckets, (a + b) / 2, 0.4, {}); }, walls: Z => { pic(Z, 4, 0.9, 2.3, 'birdprint', 0.5); } } });
  // 03 the painter: an easel, canvases everywhere, a gallery wall; upstairs, her bedroom full of paintings
  T('painter', { label: 'the painter’s studio', g: { kitchen: 'small', center: 'rug', cx: 0.6, rug: ['#f2c14e', '#7fbf6a', '#e86a7a'],
    hero: (Z, o) => { N(Z, F.easel, -0.9, 0.7, { cell: typeof HQ !== 'undefined' && HQ && HQ.stage('hq.colors') >= 2 ? 'lake' : 'abstract' }, { job: 'paint', prop: 'brush', dz: 0.55, yaw: PI * 0.92 }); N(Z, F.canvases, -2.9, 0.4, {}); N(Z, F.paintTable, 0.7, 0.55, {}); Z.wall(1, 0.7, 2.2, F0.windowItem, { w: 1.1, h: 1.0, curtains: false }); N(Z, F.easel, 2.4, 0.7, { cell: 'sea' }); },
    sw: (Z, a, b) => { Z.W(F.canvases, (a + b) / 2 - 0.6, 0.4, {}); Z.W(F0.stool, (a + b) / 2 + 0.8, 0.5, {}); },
    walls: Z => { pic(Z, 4, -2.0, 2.2, 'flowers2', 0.6); pic(Z, 4, -0.9, 2.5, 'hills', 0.5); pic(Z, 4, -1.4, 1.6, 'boat', 0.45); pic(Z, 3, 3.2, 2.3, 'abstract', 0.5); } },
    u: { bed: 'double', desk: 'notes', pics: ['abstract', 'flowers2'], hero: (Z, z) => { Z.W(F.easel, -Z.hd + 1.4, 0.7, { cell: 'flowers2' }); }, walls: Z => { pic(Z, 2, 1.6, 2.6, 'sea', 0.45); } } });
  // 04 the young family: the baby's crib by the fire, toys everywhere; upstairs, Coco's room
  T('babyFamily', { label: 'the family with the new baby', g: { kitchen: 'full', center: 'sofa', cx: 0.4,
    hero: (Z, o) => { N(Z, F.crib, -1.6, 1.3, {}, { type: 'crib', dz: -0.6 }); Z.spot('hero', -0.6, -Z.hd + 1.2, -2.6, { job: 'cradle', prop: 'baby' }); N(Z, F0.dresser, 0.6, 0.5, { w: 1.0, rack: false }); pic(Z, 1, 0.6, 2.0, 'baby', 0.5); Z.wall(1, 2.0, 2.2, F0.windowItem, { w: 0.9, h: 0.9 }); },
    sw: (Z, a, b) => { Z.W(F.toyBox, (a + b) / 2, 0.55, { color: '#e86a7a' }); Z.put(F.toys, -Z.hw + 1.4, (a + b) / 2 + 0.3, 0.5, {}); },
    walls: Z => { Z.wall(4, -0.6, 2.9, F.garland, { len: 2.2 }); pic(Z, 4, -1.6, 2.0, 'sunkid', 0.5, { frame: '#fdf8ee' }); } },
    u: { bed: 'kid', desk: false, pics: ['dino', 'sunkid'], hero: (Z, z) => { Z.W(F.toyBox, -Z.hd + 1.5, 0.55, {}); Z.put(F.toys, -1.2, -0.6, 0.3, {}); }, walls: Z => { Z.E(F.shelf, 1.2, 0.3, { what: 'toys', len: 1.0 }); pic(Z, 2, 0.4, 2.2, 'dino', 0.55, { frame: '#fdf8ee' }); } } });
  // 05 the stamp collector (a retired postman): albums under the lamp, framed stamps, a map of where letters went
  T('stamps', { label: 'the stamp collector’s house', g: { kitchen: 'small', center: 'sofa', cx: 0.6,
    hero: (Z, o) => { N(Z, F.desk, -0.6, 0.6, { items: 'stamps', w: 1.3 }); const m = Z.put(F0.chair, -0.6, -Z.hd + 1.25, PI, { color: Z.P.wood, look: null }); Z.spot('desk', -0.6, -Z.hd + 1.25, PI, { seat: m.seat, job: 'write', prop: 'letter' }); Z.wall(1, -0.6, 2.15, F.photoWall, { cells: ['birdprint', 'boat', 'flowers2', 'fishprint', 'mill', 'tower'] }); N(Z, F0.bookcase, -3.2, 0.36, { w: 1.0 }); N(Z, F0.bookcase, 1.4, 0.36, { w: 1.0 }); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); }, walls: Z => { pic(Z, 4, -1.5, 2.2, 'world', 1.1); } },
    u: { bed: 'single', desk: 'letters', pics: ['map', 'world'] } });
  // 06 the cyclist: the bike in the living room, trophies, routes on the map
  T('cyclist', { label: 'the cyclist’s house', g: { kitchen: 'full', center: 'dining', cx: 0.6,
    hero: (Z, o) => { N(Z, F.bicycle, -1.4, 0.4, { color: '#2f8f86' }, { job: 'tinker', prop: 'tool', dz: 0.55 }); Z.wall(1, 1.2, 1.4, F.shelf, { len: 1.3, what: 'trophies', levels: 2 }); pic(Z, 1, -1.4, 2.3, 'world', 0.9); },
    sw: (Z, a, b) => { Z.S(F.shoeRack, -2.6, 0.3, {}); Z.put(F.mat, -Z.hw + 0.9, (a + b) / 2, 0, { color: '#e86a7a' }); }, door: 'umbrella', walls: Z => { pic(Z, 4, 0.8, 2.3, 'hills', 0.6); } },
    u: { bed: 'single', desk: 'maps', pics: ['hills', 'mill'] } });
  // 07 the young musician: guitars, an amp, records, posters; upstairs his room, and Mango up on the wardrobe
  T('musician', { label: 'the musician’s place', g: { kitchen: 'small', center: 'sofa', cx: 0.5, rug: ['#3a3040', '#e0743c', '#f2c14e'],
    hero: (Z, o) => { N(Z, F.guitar, -2.4, 0.4, { color: '#d9483b' }); N(Z, F.amp, -1.5, 0.36, {}); N(Z, F.records, 0.6, 0.45, {}); N(Z, F.guitar, 2.0, 0.4, { color: '#3f6fb5' }); pic(Z, 1, -1.9, 2.3, 'poster', 0.75); pic(Z, 1, 0.6, 2.2, 'notes', 0.6); },
    sw: (Z, a, b) => { Z.W(F.amp, (a + b) / 2, 0.36, { color: '#d9483b' }); }, walls: Z => { pic(Z, 4, -0.8, 2.3, 'poster', 0.7); Z.wall(3, 3.0, 3.0, F.garland, { len: 2.0, lights: true }); } },
    u: { bed: 'double', desk: 'notes', pics: ['poster', 'notes'], hero: (Z, z) => { Z.W(F.guitar, -Z.hd + 1.2, 0.4, { color: '#e0743c' }); }, walls: Z => { Z.spot('wardrobeTop', Z.hw - 0.3, -Z.hd + 0.8, -H, { y: 2.04, pose: 'sit' }); } } });
  // 08 the candle maker: candles lit on every shelf against the gray; the wax pot on the stove
  T('candles', { label: 'the candle maker’s house', g: { kitchen: 'small', center: 'rug', cx: 0.5, rug: ['#e6a23a', '#fdf3dc', '#e86a7a'],
    hero: (Z, o) => { N(Z, F.candleTable, -0.6, 0.55, { w: 1.3 }, { job: 'tinker', prop: 'tool' }); Z.wall(1, -2.4, 1.5, F.shelf, { len: 1.1, what: 'candles', levels: 2 }); Z.wall(1, 1.4, 1.5, F.shelf, { len: 1.3, what: 'candles', levels: 2 }); },
    sw: (Z, a, b) => { const b2 = K.rockingChair(Z.room, Z.X(-Z.hw + 0.9), (a + b) / 2, Z.Y(1.2), Z.P.wood); Z.spot('rock', -Z.hw + 0.9, (a + b) / 2, 1.2, { bone: b2, seat: 0.5 }); },
    walls: Z => { Z.wall(4, -1.2, 1.7, F.shelf, { len: 1.2, what: 'candles' }); Z.wall(3, 3.0, 1.6, F.shelf, { len: 1.0, what: 'candles' }); pic(Z, 4, -1.2, 2.5, 'moon', 0.6); } },
    u: { bed: 'single', desk: false, pics: ['moon', 'stars'], walls: Z => { Z.E(F.candleTable, 1.2, 0.55, { w: 1.0 }); } } });
  // 09 the poet (in es / pt / de games): a typewriter, crumpled pages, books in towers
  T('poet', { label: 'the poet’s house', g: { kitchen: 'small', center: 'sofa', cx: 0.4,
    hero: (Z, o) => { N(Z, F.desk, -0.4, 0.6, { items: 'typewriter', w: 1.3 }); const m = Z.put(F0.chair, -0.4, -Z.hd + 1.25, PI, { color: '#3a3040', look: null }); Z.spot('desk', -0.4, -Z.hd + 1.25, PI, { seat: m.seat, job: 'write' }); N(Z, F0.bookcase, -2.6, 0.36, { w: 1.1 }); N(Z, F0.bookcase, 1.6, 0.36, { w: 1.1 }); pic(Z, 1, -0.4, 2.2, 'moon', 0.6); },
    sw: (Z, a, b) => { Z.W(F.papers, (a + b) / 2, 0.5, {}); { const k = Z.at(-1.5, 1.0); for (let i = 0; i < 6; i++) k.ball((i % 3) * 0.4 - 0.4, 0.05, Math.floor(i / 3) * 0.5, 0.06, '#fdf8ee', { geo: K.GEO.ico0, ink: 0.003 }); } },
    walls: Z => { pic(Z, 4, -1.4, 2.2, 'notes', 0.55); } },
    u: { bed: 'single', desk: 'notes', pics: ['moon', 'notes'] } });
  // 10 the home baker (not in German games: house 10 is the Yıldız Grill there): cakes on stands, cups on the shelves
  T('cakes', { label: 'the cake lover’s house', g: { kitchen: 'full', center: 'dining', cx: 0.4,
    hero: (Z, o) => { N(Z, F.cakeStand, -1.6, 0.5, { color: '#f6a6c1' }, { job: 'stir', prop: 'spoon', dz: 0.6, dx: 0.6 }); N(Z, F.cakeStand, -0.2, 0.5, { color: '#8a5f3e' }); Z.wall(1, 1.3, 1.45, F.shelf, { len: 1.3, what: 'cups', levels: 2 }); pic(Z, 1, -0.9, 2.3, 'vase', 0.6); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1 }); } },
    u: { bed: 'double', desk: 'notes', pics: ['vase', 'flowers2'] } });
  // 11 the stargazer: the telescope by the window, star charts, the globe; upstairs, a second telescope
  T('stargazer', { label: 'the stargazer’s house', g: { kitchen: 'small', center: 'sofa', cx: 0.5, rug: ['#1f2a5a', '#3f6fb5', '#ffd84a'],
    hero: (Z, o) => { N(Z, F0.bookcase, -2.9, 0.36, { w: 1.0 }); N(Z, F0.globe, -1.6, 0.5, {}); N(Z, F.telescope, 0.6, 0.8, {}, { job: 'think', dz: 0.4, dx: 0.8 }); Z.wall(1, 0.6, 2.4, F0.windowItem, { w: 1.0, h: 0.9, curtains: false }); pic(Z, 1, 2.2, 2.2, 'stars', 0.75); pic(Z, 1, -1.6, 2.3, 'moon', 0.6); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); }, walls: Z => { pic(Z, 4, -0.8, 2.3, 'stars', 0.6); } },
    u: { bed: 'single', desk: 'maps', pics: ['stars', 'moon'], hero: (Z, z) => { Z.W(F.telescope, -Z.hd + 1.4, 0.8, {}); } } });
  // 12 the knitter (Teo's grandma, when the library isn't there; and Doña Socorro in Molinar): yarn, quilts, photos
  T('knitter', { label: 'the knitter’s house', g: { bed: 'single', kitchen: 'full',
    hero: (Z, o) => { hearth(Z, o, 'rock', 'knit', 'knit'); Z.put(F.yarnBasket, Math.min(o.x1 - 0.5, (o.x0 + o.x1) / 2 + 1.0), -Z.hd + 2.35, 0, {}); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); }, walls: Z => { Z.wall(4, 1.6, 2.0, F.quilt, { w: 1.1, h: 0.8 }); Z.wall(1, (Z.hw - 1.6), 2.3, F.photoWall, { cells: ['family', 'grandma', 'baby', 'cat', 'family', 'hills'] }); } } });
  // 13 the puppeteer (not in Japanese games): a little puppet theater, puppets on strings, cushions for the audience
  T('puppets', { label: 'the puppeteer’s house', g: { kitchen: 'small', center: (Z, x, z) => { Z.put(F0.roundRug, x, z, 0, { r: 1.2, cols: ['#d9483b', '#f2c14e', '#3f6fb5'] }); { const k = Z.at(x, z); for (let i = 0; i < 4; i++) { const a = -0.8 + i * 0.55; k.ball(Math.sin(a) * 0.8, 0.12, Math.cos(a) * 0.5 + 0.2, 0.26, ITH.BRIGHT[i], { ry2: 0.11 }); } } Z.spot('floor', x - 0.5, z + 0.6, PI, {}); Z.lamp(x, z, 2.6, '#d9483b'); }, cx: 0.4,
    hero: (Z, o) => { N(Z, F.puppetBooth, -0.4, 0.45, { color: '#2f8f86' }, { job: 'think', dx: 1.25, dz: 0.4, yaw: PI * 0.85 }); pic(Z, 1, -2.4, 2.2, 'poster', 0.6); pic(Z, 1, 1.8, 2.2, 'drawhouse', 0.55); },
    sw: (Z, a, b) => { Z.W(F.toyBox, (a + b) / 2, 0.55, { color: '#3f6fb5' }); },
    walls: Z => { const rail = Z.at(-Z.hw + 0.12, -1.0, H, 4, 2.4); rail.box(0, 0, 0, 2.2, 0.05, 0.05, '#5e4130', { ink: 0.003 });
      for (let i = 0; i < 4; i++) { const p = Z.at(-Z.hw + 0.25, -1.9 + i * 0.6, 0, 4, 2.4), at = p.world(0, 0, 0), b = Z.room.rig.bone(null, [at.x, at.y, at.z], [0, 0, 0], 'XYZ', Z.Wm(4)); const c = ITH.BRIGHT[(i * 3) % 8];
        Z.room.rig.part(b, K.PG.cyl, '#e8dcc0', [0, -0.2, 0], [0.004, 0.4, 0.004], null, 0); Z.room.rig.part(b, K.PG.ball, c, [0, -0.62, 0], [0.09, 0.15, 0.07], null, 0.004); Z.room.rig.part(b, K.PG.ball, '#f5cda2', [0, -0.42, 0], [0.07, 0.07, 0.07], null, 0.004); Z.room.rig.part(b, K.PG.cap, ITH.BRIGHT[(i * 3 + 2) % 8], [0, -0.37, 0], [0.075, 0.06, 0.075], null, 0.003);
        Z.anim(t => { b.rotation.x = Math.sin(t * 1.3 + i) * 0.12; }); } } },
    u: { bed: 'single', desk: 'notes', pics: ['poster', 'drawhouse'], walls: Z => { Z.W(F.shelf, -1.2, 0.3, { what: 'toys', len: 1.0 }); } } });
  // 14 the retired teacher: books from floor to ceiling, the globe, a small blackboard with the house words; Nube the cat
  T('teacher', { label: 'the retired teacher’s house', g: { bed: 'single', kitchen: 'small', center: 'dining', cx: 0.7,
    hero: (Z, o) => { N(Z, F0.bookcase, -2.2, 0.36, { w: 1.0 }); Z.mark('shelf', -2.2, -Z.hd + 0.9); N(Z, F0.bookcase, -1.15, 0.36, { w: 1.0 }); Z.wall(1, 0.6, 1.85, F0.blackboard, { w: 1.6, h: 0.95 }); N(Z, F0.globe, 2.0, 0.5, {}); },
    sw: (Z, a, b) => { Z.W(F.desk, (a + b) / 2 - 0.2, 0.6, { items: 'homework', w: 1.2 }); Z.mark('desk', -Z.hw + 1.0, (a + b) / 2 - 0.2); Z.put(F0.armchair, -Z.hw + 1.75, b - 0.35, 2.4, { color: '#4f8a7a' }); Z.spot('arm', -Z.hw + 1.75, b - 0.35, 2.4, { seat: 0.56, job: 'read', prop: 'book' }); },
    walls: Z => { pic(Z, 4, -0.3, 2.4, 'abc', 0.6, { frame: '#3f6fb5' }); pic(Z, 4, 1.2, 2.4, 'map', 0.6); } } });
  // 16 the cook: a big pot over the fire, pots and herbs hanging, the kitchen table full; a pantry and bedroom at the back
  T('cook', { label: 'the cook’s kitchen', g: { kitchen: 'full', center: (Z, x, z) => { Z.put(F.cookTable, x, z, 0, { w: 1.4 }); for (const s of [-1, 1]) { const m = Z.put(F0.stool, x + s * 1.0, z, 0, {}); Z.spot('sit', x + s * 1.0, z, -s * H, { seat: 0.5 }); } Z.lamp(x, z, 2.5, '#e0743c'); Z.spot('cat', x + 0.8, z + 0.9, -0.8, { pose: 'sleep' }); }, cx: -0.2,
    hero: (Z, o) => { const x = hearth(Z, o, null); Z.spot('hero', x + 0.1, -Z.hd + 1.55, PI, { job: 'stir', prop: 'spoon' }); Z.mark('pot', x, -Z.hd + 1.3); Z.wall(1, x + 2.0, 2.2, F.herbRail, { len: 1.2 }); Z.wall(1, x - 2.1, 2.2, F.potRail, { len: 1.1 }); },
    sw: (Z, a, b) => { Z.W(F0.sacks, (a + b) / 2, 0.7, { n: 3 }); }, walls: Z => { Z.wall(4, -0.8, 1.7, F.shelf, { len: 1.3, what: 'jars', levels: 2 }); pic(Z, 3, 3.0, 2.2, 'menu', 0.6, { frame: '#7a5236' }); } },
    u: { bed: 'double', desk: false, pics: ['vase', 'family'], hero: (Z, z) => { Z.W(F0.sacks, -Z.hd + 1.4, 0.7, { n: 3 }); Z.wall(4, 0.6, 1.6, F.shelf, { len: 1.2, what: 'jam', levels: 2 }); } } });
  // 17 the little artist and her mom: a kids' table of crayons, drawings on every wall
  T('artistKid', { label: 'the little artist’s house', g: { bed: 'single', kitchen: 'full', center: 'rug', cx: 0.6, rug: ['#f2c14e', '#7fc4e0', '#e86a7a'],
    hero: (Z, o) => { N(Z, F.easel, -1.2, 0.7, { cell: 'sunkid' }); N(Z, F0.table, 0.6, 0.6, { w: 0.9, d: 0.55, h: 0.5, items: false, look: null }); { const k = Z.at(0.6, -Z.hd + 0.35); for (let i = 0; i < 6; i++) k.cyl(-0.3 + i * 0.1, 0.5, 0.05, 0.015, 0.12, ITH.BRIGHT[i], { rz: H, ry: i * 0.3, geo: K.GEO.cyl6, ink: 0.002 }); k.box(0.1, 0.505, 0.0, 0.3, 0.005, 0.22, '#ffffff', { ry: 0.2, ink: 0.002 }); }
      Z.spot('floor', 0.6, -Z.hd + 1.05, PI, { job: 'desk' }); pic(Z, 1, -1.2, 2.2, 'dino', 0.55, { frame: '#fdf8ee' }); pic(Z, 1, 0.6, 2.0, 'star', 0.5, { frame: '#fdf8ee' }); pic(Z, 1, 1.8, 2.3, 'drawhouse', 0.5, { frame: '#fdf8ee' }); },
    sw: (Z, a, b) => { Z.W(F.toyBox, (a + b) / 2, 0.55, { color: '#7a5ab0' }); }, walls: Z => { pic(Z, 4, -0.2, 2.5, 'sunkid', 0.45, { frame: '#fdf8ee' }); Z.wall(1, 0.0, 2.95, F.garland, { len: 3.0 }); } } });
  // 18 the bird lover: canaries in two cages, plants, bird prints
  T('birds', { label: 'the house of the canaries', g: { bed: 'single', kitchen: 'full', center: 'dining', cx: 0.7,
    hero: (Z, o) => { N(Z, F.birdCage, -1.0, 0.6, {}); Z.spot('canary', -1.0, -Z.hd + 0.33, 0, { y: 1.1 }); N(Z, F.birdCage, 0.4, 0.6, { color: '#c9c4bb' }); Z.spot('canary', 0.4, -Z.hd + 0.33, 0, { y: 1.1 }); N(Z, F.plants, 1.8, 0.5, {}); pic(Z, 1, -0.3, 2.45, 'birdprint', 0.6); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); Z.mark('wall', -Z.hw + 0.2, (a + b) / 2); }, walls: Z => { pic(Z, 4, 0.4, 2.3, 'flowers2', 0.55); } } });
  // 19 the angler: rods on the wall, the tackle box, the big fish he talks about
  T('angler', { label: 'the angler’s house', g: { bed: 'single', kitchen: 'small', center: 'dining', cx: 0.7,
    hero: (Z, o) => { Z.wall(1, -1.0, 1.6, F.rods, {}); N(Z, F.tackle, -1.0, 0.4, {}); Z.wall(1, 1.4, 2.0, F.fishTrophy, {}); N(Z, F.ropeCoil, 1.6, 0.7, {}); },
    sw: (Z, a, b) => { Z.W(F.seaChest, (a + b) / 2, 0.55, { color: '#4f8a7a' }); }, walls: Z => { pic(Z, 4, 0.9, 2.3, 'fishprint', 0.6); pic(Z, 3, 3.1, 2.3, 'boat', 0.5); } } });
  // 20 the seamstress: the sewing machine, a dress form, rolls of cloth; the fitting room at the back
  T('seamstress', { label: 'the seamstress’s workshop', g: { kitchen: 'small', center: (Z, x, z) => { Z.put(F0.rectRug, x, z, 0, { w: 2.4, d: 1.6 }); Z.put(F.fabricRolls, x + 0.7, z + 0.2, 0, {}); Z.spot('stand', x - 0.6, z, PI, {}); Z.lamp(x, z, 2.6, '#e86a7a'); }, cx: 0.4,
    hero: (Z, o) => { N(Z, F.sewingTable, -0.9, 0.6, { fabric: '#e86a7a' }); const m = Z.put(F0.chair, -0.9, -Z.hd + 1.25, PI, { color: '#e86a7a', look: null }); Z.spot('hero', -0.9, -Z.hd + 1.25, PI, { seat: m.seat, job: 'sew', sit: 1 }); N(Z, F.dressForm, 1.0, 0.6, { color: '#3f6fb5' }); Z.wall(1, -0.9, 2.1, F.spools, {}); N(Z, F.dressForm, 2.4, 0.6, { color: '#f2c14e' }); },
    sw: (Z, a, b) => { Z.W(F.fabricRolls, (a + b) / 2, 0.68, {}); }, walls: Z => { pic(Z, 4, -1.4, 2.3, 'flowers2', 0.5); } },
    u: { bed: 'single', desk: 'notes', pics: ['vase', 'flowers2'], hero: (Z, z) => { Z.W(F.dressForm, -Z.hd + 1.3, 0.6, { color: '#7a5ab0' }); } } });
  // 21 the tinkerer: radios in pieces, a bench of gears, a pegboard of tools
  T('tinkerer', { label: 'the tinkerer’s workshop', g: { bed: 'single', kitchen: 'small', center: 'dining', cx: 0.7,
    hero: (Z, o) => { N(Z, F0.workbench, -0.8, 0.86, { len: 1.8, gears: true }, { job: 'tinker', prop: 'tool', dz: 0.45 }); Z.wall(1, -0.8, 2.0, F.pegboard, {}); N(Z, F.desk, 1.7, 0.6, { items: 'radios', w: 1.1 }); },
    sw: (Z, a, b) => { Z.W(F.boxes, (a + b) / 2, 0.6, {}); }, walls: Z => { pic(Z, 4, 0.9, 2.3, 'blueprint', 0.6); Z.wall(4, -0.4, 1.7, F.shelf, { len: 1.0, what: 'boxes' }); } } });
  // 22 the puzzle man (Kalle, in German games): a jigsaw on the table, crosswords in piles, the armchair
  T('puzzles', { label: 'the puzzle lover’s house', g: { bed: 'single', kitchen: 'small', center: (Z, x, z) => { Z.put(F0.rectRug, x, z, 0, { w: 2.2, d: 1.7 }); Z.put(F.jigsaw, x, z, 0, {}); const m = Z.put(F0.chair, x, z + 0.7, PI, { color: Z.P.wood }); Z.spot('sit', x, z + 0.7, PI, { seat: m.seat }); Z.lamp(x, z, 2.5, '#3f6fb5'); }, cx: 0.7,
    hero: (Z, o) => { N(Z, F0.bookcase, -1.9, 0.36, { w: 1.1 }); Z.put(F0.armchair, 0.3, -Z.hd + 1.0, PI * 1.1, { color: '#7a5ab0' }); Z.spot('arm', 0.3, -Z.hd + 1.0, PI * 1.1, { seat: 0.56, job: 'read', prop: 'paper' }); N(Z, F.papers, 1.4, 0.5, {}); pic(Z, 1, 0.3, 2.3, 'world', 0.8); },
    sw: (Z, a, b) => { Z.W(F.papers, (a + b) / 2, 0.5, {}); Z.W(F0.sideTable, (a + b) / 2 + 0.9, 0.6, {}); } } });
  // 23 the board-game granny (Oma Hilde, in German games): a game set out on the table, boxes of games, the knitting by the fire
  T('boardgames', { label: 'the board-game house', g: { kitchen: 'full', center: (Z, x, z) => { Z.put(F0.roundRug, x, z, 0, { r: 1.25 }); Z.put(F.gameTable, x, z, 0, {}); [[-0.75, 0, H], [0.75, 0, -H], [0, -0.75, 0]].forEach(([dx, dz, y], i) => { const m = Z.put(F0.chair, x + dx, z + dz, y, { color: Z.P.wood, look: i ? null : 'w.chair' }); Z.spot('sit', x + dx, z + dz, y, { seat: m.seat }); }); Z.lamp(x, z, 2.5, '#4f9a5a'); }, cx: 0.3,
    hero: (Z, o) => hearth(Z, o, 'rock', 'knit', 'knit'),
    sw: (Z, a, b) => { Z.wall(4, (a + b) / 2, 1.2, F.shelf, { what: 'boxes', len: 1.2, levels: 2 }); }, walls: Z => { Z.wall(4, -1.4, 2.0, F.quilt, { w: 1.0, h: 0.75 }); } },
    u: { bed: 'single', desk: false, pics: ['family', 'grandma'], hero: (Z, z) => { Z.W(F.yarnBasket, -Z.hd + 1.3, 0.4, {}); Z.wall(4, -1.0, 1.4, F.shelf, { what: 'boxes', len: 1.0 }); } } });
  // 24 the dog lover: Trufa's bed, her bowls, her portraits everywhere
  T('dogs', { label: 'Trufa’s house', g: { bed: 'single', kitchen: 'full', center: 'sofa', cx: 0.6,
    hero: (Z, o) => { N(Z, F.dogBed, -0.8, 0.9, { color: '#e86a7a' }); Z.spot('pet', -0.8, -Z.hd + 0.5, 0.2, { pose: 'lie' }); Z.wall(1, -0.4, 2.1, F.photoWall, { cells: ['dog', 'dog', 'family', 'dog', 'hills', 'dog'] }); N(Z, F0.dresser, 1.6, 0.5, { w: 1.0, rack: false }); },
    sw: (Z, a, b) => { Z.W(F.shoeRack, (a + b) / 2, 0.3, {}); Z.mark('hook', -Z.hw + 0.3, (a + b) / 2 - 0.8); }, door: 'both', walls: Z => { pic(Z, 4, 0.6, 2.3, 'dog', 0.6); } } });
  // 25 the busy family (Fiete's family's door, in German games): laundry drying, shoes in a pile, homework, toys
  T('busyFamily', { label: 'the busy family’s house', g: { kitchen: 'full', center: 'dining', cx: 0.3, chairs: 4,
    hero: (Z, o) => { N(Z, F.laundry, -1.4, 0.5, {}); N(Z, F.toyBox, 0.4, 0.55, {}); pic(Z, 1, 0.4, 2.2, 'family', 0.6); Z.put(F.toys, 1.6, -Z.hd + 1.2, 0.4, {}); },
    sw: (Z, a, b) => { Z.W(F.shoeRack, (a + b) / 2, 0.3, {}); }, door: 'both', walls: Z => { pic(Z, 4, -1.0, 2.2, 'drawhouse', 0.5, { frame: '#fdf8ee' }); pic(Z, 4, 0.2, 2.4, 'sunkid', 0.45, { frame: '#fdf8ee' }); } },
    u: { bed: 'bunks', desk: 'homework', pics: ['dino', 'star'], hero: (Z, z) => { Z.put(F.toys, -1.4, -0.3, 0.2, {}); } } });
  // 26 the potter: the wheel turning, the kiln glowing, pots on every shelf
  T('potter', { label: 'the potter’s studio', g: { bed: 'single', kitchen: 'small', center: 'rug', cx: 0.6, rug: ['#c9784a', '#e8d8c2', '#b85a3a'],
    hero: (Z, o) => { N(Z, F.potteryWheel, -1.0, 0.9, {}, { job: 'tinker', dz: 0.5 }); N(Z, F.kiln, 1.4, 0.74, {}); Z.wall(1, -1.0, 1.55, F.shelf, { len: 1.2, what: 'pots', levels: 2 }); },
    sw: (Z, a, b) => { Z.wall(4, (a + b) / 2, 1.1, F.shelf, { len: 1.2, what: 'pots', levels: 2 }); }, walls: Z => { pic(Z, 4, -1.0, 2.4, 'abstract', 0.5); } } });
  // 27 the world traveler: suitcases, a world map, souvenirs; upstairs, a hammock instead of a bed
  T('traveler', { label: 'the traveler’s house', g: { kitchen: 'small', center: 'sofa', cx: 0.5,
    hero: (Z, o) => { N(Z, F.suitcases, -2.2, 0.5, {}); pic(Z, 1, -0.6, 2.1, 'world', 1.3); Z.wall(1, 1.6, 1.4, F.shelf, { len: 1.2, what: 'ship', levels: 2 }); N(Z, F.hatStand, 0.4, 0.6, {}); },
    sw: (Z, a, b) => { Z.W(F.seaChest, (a + b) / 2, 0.55, { color: '#d9483b' }); }, walls: Z => { pic(Z, 4, -1.2, 2.3, 'sea', 0.5); pic(Z, 4, 0.0, 2.5, 'tower', 0.4); Z.wall(3, 3.0, 3.0, F.garland, { len: 2.0 }); } },
    u: { bed: 'none', desk: 'maps', pics: ['world', 'boat'], hero: (Z, z) => { Z.put(F.hammock, -0.4, -Z.hd + 0.75, 0, { color: '#2f8f86', len: 2.4 }); Z.spot('bed', -0.4, -Z.hd + 1.3, PI, {}); } } });
  // 28 the new family: still in boxes, a lamp not plugged in, one picture leaning against the wall
  T('movingIn', { label: 'the house of the new neighbors', g: { kitchen: 'small', center: (Z, x, z) => { Z.put(F.boxes, x - 0.4, z - 0.2, 0.3, {}); Z.put(F0.roundRug, x + 0.9, z + 0.4, 0, { r: 0.8 }); Z.spot('floor', x + 0.9, z + 0.5, PI, {}); }, cx: 0.4, winW: 1.0,
    hero: (Z, o) => { N(Z, F.boxes, -1.6, 0.6, {}); N(Z, F0.floorLamp, 0.2, 0.5, {}); N(Z, F.boxes, 1.5, 0.6, {}); { const k = Z.at(0.9, -Z.hd + 0.12); k.box(0, 0.4, 0, 0.7, 0.55, 0.04, '#c99a3e', { rx: -0.25, ink: 0.004 }); k.decal(0, 0.4, 0.03, 0.62, 0.47, 'hills', { rx: -0.25 }); } },
    sw: (Z, a, b) => { Z.W(F.boxes, (a + b) / 2, 0.6, {}); }, door: false },
    u: { bed: 'kid', desk: false, pics: ['star', 'sunkid'], hero: (Z, z) => { Z.W(F.boxes, -Z.hd + 1.6, 0.6, {}); } } });
  // 29 the botanist: plants on every surface, hanging from the ceiling, seedlings on the bench
  T('botanist', { label: 'the botanist’s house', g: { bed: 'single', kitchen: 'small', center: 'dining', cx: 0.7,
    hero: (Z, o) => { N(Z, F.seedTable, -0.6, 0.55, { w: 1.4 }, { job: 'water', prop: 'can' }); N(Z, F.plants, 1.3, 0.5, {}); Z.wall(1, -0.6, 2.2, F0.windowItem, { w: 1.2, h: 0.9, sill: true }); F.hangPlant(Z.room, Z.X(-1.6), -0.6, 2.4); F.hangPlant(Z.room, Z.X(2.0), 0.4, 2.3); },
    sw: (Z, a, b) => { Z.W(F.plants, (a + b) / 2, 0.5, {}); Z.W(F0.plantItem, (a + b) / 2 + 1.0, 0.4, { tall: true }); }, walls: Z => { pic(Z, 4, 0.9, 2.4, 'flowers2', 0.55); } } });
  // 30 the carpenter: sawhorses and a plank, the tools on a pegboard, a chair half built
  T('carpenter', { label: 'the carpenter’s workshop', g: { bed: 'single', kitchen: 'small', center: (Z, x, z) => { Z.put(F.sawhorse, x, z, 0, {}); Z.spot('stand', x, z + 0.75, PI, { job: 'tinker', prop: 'tool' }); Z.lamp(x, z, 2.6, '#c8925a'); }, cx: 0.6,
    hero: (Z, o) => { Z.wall(1, -0.8, 1.9, F.pegboard, {}); N(Z, F0.workbench, -0.8, 0.86, { len: 1.8 }); { const k = Z.at(1.6, -Z.hd + 0.9); k.box(0, 0.46, 0, 0.44, 0.05, 0.44, '#e6c08a'); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1]]) k.post(x * 0.18, 0, z * 0.18, 0.05, 0.46, 0.05, '#c8925a', { ink: 0.003 }); Z.solid(1.6, -Z.hd + 0.9, 0.3); } },
    sw: (Z, a, b) => { { const k = Z.at(-Z.hw + 0.4, (a + b) / 2, 0, 4); for (let i = 0; i < 5; i++) k.box(0, 0.06 + i * 0.1, 0, 0.3, 0.08, 2.0, i % 2 ? '#e6c08a' : '#c8925a', { ink: 0.003 }); Z.box(-Z.hw + 0.4, (a + b) / 2, 0.2, 1.0); } } } });
  // 31 the aquarium dad and his son: a big fish tank, shells, sea posters; upstairs Nacho's room
  T('aquarium', { label: 'the house with the fish tank', g: { kitchen: 'full', center: 'sofa', cx: 0.4, rug: ['#3f8fc9', '#7fd3e8', '#f2c14e'],
    hero: (Z, o) => { N(Z, F.aquarium, -0.8, 0.5, { w: 1.4 }, { job: 'think', dz: 0.6, dx: 0.6 }); Z.wall(1, 1.4, 1.5, F.shelf, { len: 1.2, what: 'shells', levels: 2 }); pic(Z, 1, -0.8, 2.4, 'sea', 0.7); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1 }); }, walls: Z => { pic(Z, 4, -0.6, 2.3, 'fishprint', 0.6); } },
    u: { bed: 'kid', desk: 'homework', pics: ['sea', 'fishprint'], shelf: 'shells', hero: (Z, z) => { Z.W(F.aquarium, -Z.hd + 1.3, 0.5, { w: 0.9 }); } } });

  // ---- Molinar (whitewash, beams, terracotta)
  // 01 the new parents: the crib, the gifts the neighbors brought, a rocking chair
  T('newParents', { label: 'the house with the new baby', g: { kitchen: 'full', center: 'sofa', cx: 0.4,
    hero: (Z, o) => { N(Z, F.crib, -1.8, 1.3, { color: '#bfe0f4' }, { type: 'crib', dz: -0.6 }); const b = K.rockingChair(Z.room, Z.X(-0.4), -Z.hd + 1.2, Z.Y(-2.6), Z.P.wood); Z.spot('rock', -0.4, -Z.hd + 1.2, -2.6, { bone: b, seat: 0.5, job: 'cradle', prop: 'baby' });
      N(Z, F.boxes, 1.4, 0.6, {}); { const k = Z.at(1.0, -Z.hd + 1.1); k.box(0, 0.12, 0, 0.3, 0.24, 0.3, '#f6a6c1', { ink: 0.004 }); k.box(0, 0.12, 0, 0.32, 0.04, 0.32, '#fdf8ee', { ink: 0 }); k.box(0.35, 0.1, 0.2, 0.22, 0.2, 0.22, '#8fd3ec', { ry: 0.5, ink: 0.004 }); } pic(Z, 1, -0.6, 2.3, 'baby', 0.55); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); }, walls: Z => { Z.wall(4, -0.6, 2.9, F.garland, { len: 2.0 }); } },
    u: { bed: 'double', desk: false, pics: ['family', 'baby'], hero: (Z, z) => { Z.W(F.crib, -Z.hd + 1.2, 1.3, {}); } } });
  // 02 the kite maker: kites on every wall, tails and all, one half made on the table, spools of string
  const kite = (k, o) => {
    const c = o.color || '#d9483b', c2 = o.c2 || '#f2c14e';
    k.box(0, 0, 0.02, 0.4, 0.4, 0.02, c, { rz: PI / 4, ink: 0.006 }); k.box(0, 0.07, 0.033, 0.2, 0.2, 0.006, c2, { rz: PI / 4, ink: 0 });
    k.box(0, 0, 0.04, 0.025, 0.56, 0.01, '#8a5f3e', { ink: 0 }); k.box(0, 0.06, 0.04, 0.5, 0.025, 0.01, '#8a5f3e', { ink: 0 });
    for (let i = 0; i < 4; i++) k.box(Math.sin(i * 1.7) * 0.05, -0.36 - i * 0.13, 0.03, 0.09, 0.05, 0.01, i % 2 ? c2 : c, { rz: 0.6 * (i % 2 ? -1 : 1), ink: 0.003 });
    return { look: null };
  };
  T('kites', { label: 'the kite maker’s house', g: { bed: 'single', kitchen: 'small', cx: 0.5, winW: -0.55,
    center: (Z, x, z) => { Z.put(F.sailTable, x, z, 0, {}); { const k = Z.at(x - 0.2, z - 0.05); k.box(0, 0.79, 0, 0.5, 0.01, 0.5, '#3f6fb5', { ry: PI / 4 + 0.2, ink: 0.004 }); k.box(0.45, 0.79, 0.2, 0.12, 0.05, 0.12, '#f6f1e7', { ink: 0.003 }); } Z.spot('hero', x - 0.1, z + 0.75, PI, { job: 'sew' }); Z.lamp(x, z, 2.6, '#f2c14e'); },
    hero: (Z, o) => { [[-1.4, 2.3, '#d9483b', '#f2c14e'], [-0.3, 2.2, '#3f6fb5', '#fdf8ee'], [0.8, 2.35, '#4f9a5a', '#e86a7a'], [1.9, 2.1, '#7a5ab0', '#f2c14e']].forEach(([x, y, c, c2]) => Z.wall(1, x, y, kite, { color: c, c2 })); Z.wall(1, -0.3, 1.1, F.shelf, { len: 1.6, what: 'boxes', levels: 1 }); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); Z.wall(4, (a + b) / 2, 2.25, kite, { color: '#e0743c', c2: '#2f8f86' }); } } });
  // 03 the cuckoo-clock collector: clocks on every wall, all saying something else
  T('cuckoo', { label: 'the house of the cuckoo clocks', g: { kitchen: 'small', center: 'dining', cx: 0.5,
    hero: (Z, o) => { N(Z, F0.grandClock, -2.2, 0.45, {}); Z.mark('grand', -2.2, -Z.hd + 1.0); [[-1.1, 2.0], [0.0, 2.5], [1.1, 1.9], [2.2, 2.4], [-0.5, 1.4], [0.7, 1.35]].forEach(([x, y], i) => Z.wall(1, x, y, F0.clockItem, { shape: i % 3 === 2 ? 'round' : 'cuckoo', r: 0.18 + (i % 2) * 0.05, look: i === 1 ? undefined : false, offset: i * 3700 })); Z.spot('hero', 0.2, -Z.hd + 1.0, PI, { job: 'think' }); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); Z.wall(4, (a + b) / 2, 2.2, F0.clockItem, { shape: 'cuckoo', r: 0.2, look: false, offset: 20000 }); }, walls: Z => { Z.wall(4, -1.2, 2.2, F0.clockItem, { shape: 'oct', r: 0.22, look: false, offset: 9000 }); } },
    u: { bed: 'single', desk: false, pics: ['mill', 'hills'], walls: Z => { Z.wall(2, 1.0, 2.2, F0.clockItem, { shape: 'cuckoo', r: 0.2, look: false }); } } });
  // 04 the sailmaker: a sail spread out to stitch, coils of rope, canvas bolts
  T('sailmaker', { label: 'the sailmaker’s loft', g: { kitchen: 'small', center: (Z, x, z) => { Z.put(F.sailTable, x, z, 0, {}); Z.spot('hero', x, z + 0.7, PI, { job: 'sew' }); Z.lamp(x, z, 2.6, '#3f6fb5'); }, cx: 0.3,
    hero: (Z, o) => { N(Z, F.ropeCoil, -2.0, 0.75, {}); N(Z, F.fabricRolls, -0.6, 0.68, {}); Z.wall(1, 0.8, 1.6, F.shelf, { len: 1.3, what: 'boxes', levels: 2 }); pic(Z, 1, -1.3, 2.4, 'mill', 0.6); },
    sw: (Z, a, b) => { Z.W(F.ropeCoil, (a + b) / 2, 0.75, {}); }, walls: Z => { pic(Z, 4, -1.0, 2.3, 'boat', 0.55); } },
    u: { bed: 'single', desk: 'notes', pics: ['boat', 'mill'], hero: (Z, z) => { Z.put(F.hammock, -1.2, -0.2, H, { len: 2.0, color: '#f6f1e7' }); } } });
  // 05 the mapmaker: maps rolled in a basket, the big one on the wall, a globe
  T('mapmaker', { label: 'the mapmaker’s study', g: { kitchen: 'small', center: 'dining', cx: 0.5,
    hero: (Z, o) => { N(Z, F.desk, -0.8, 0.6, { items: 'maps', w: 1.4 }); const m = Z.put(F0.chair, -0.8, -Z.hd + 1.25, PI, { color: Z.P.wood, look: null }); Z.spot('desk', -0.8, -Z.hd + 1.25, PI, { seat: m.seat, job: 'write' }); pic(Z, 1, -0.8, 2.15, 'world', 1.2); N(Z, F.fabricRolls, 1.0, 0.68, {}); N(Z, F0.globe, 2.1, 0.5, {}); },
    sw: (Z, a, b) => { Z.W(F0.bookcase, (a + b) / 2, 0.36, { w: 1.1 }); }, walls: Z => { pic(Z, 4, -1.4, 2.3, 'map', 0.6); pic(Z, 4, -0.4, 2.4, 'hills', 0.45); } },
    u: { bed: 'single', desk: 'maps', pics: ['world', 'map'] } });
  // 06 the herbalist: herbs drying from every rail, the mortar, jars of tea
  T('herbalist', { label: 'the herbalist’s house', g: { bed: 'single', kitchen: 'small', center: 'dining', cx: 0.6,
    hero: (Z, o) => { N(Z, F.herbTable, -0.6, 0.6, { w: 1.2 }, { job: 'stir', prop: 'spoon' }); Z.wall(1, -0.6, 2.3, F.herbRail, { len: 1.4 }); Z.wall(1, 1.4, 1.6, F.shelf, { len: 1.1, what: 'jars', levels: 2 }); },
    sw: (Z, a, b) => { Z.W(F.plants, (a + b) / 2, 0.5, {}); }, walls: Z => { Z.wall(4, -0.7, 2.6, F.herbRail, { len: 1.2 }); pic(Z, 4, 0.9, 2.2, 'flowers2', 0.5); } } });
  // 07 the grandpa and the windmill kid: paper windmills on the sill, a model windmill whose sails turn
  T('windmillKid', { label: 'the house of the paper windmills', g: { kitchen: 'small', center: 'dining', cx: 0.5,
    hero: (Z, o) => { N(Z, F.windmillModel, -1.0, 0.55, {}, { job: 'think', dx: 0.8, dz: 0.4 }); Z.wall(1, 0.8, 2.1, F0.windowItem, { w: 1.1, h: 0.9 }); N(Z, F.pinwheels, 0.8, 0.3, { y: 0 }); N(Z, F.pinwheels, 1.2, 0.3, { y: 0 }); pic(Z, 1, -1.0, 2.3, 'mill', 0.55); },
    sw: (Z, a, b) => { Z.W(F.toyBox, (a + b) / 2, 0.55, {}); }, walls: Z => { pic(Z, 4, -0.6, 2.2, 'hills', 0.55); } },
    u: { bed: 'kid', desk: 'homework', pics: ['mill', 'sunkid'], hero: (Z, z) => { Z.W(F.windmillModel, -Z.hd + 1.3, 0.55, { speed: 2.0 }); } } });
  // 08 the shepherd and his dog: the hearth, the crook by the door, the dog's bed, a sheepskin rug
  T('shepherd', { label: 'the shepherd’s house', g: { kitchen: 'small', center: 'dining', cx: 0.4, rug: ['#f6f1e7', '#e8dcc0', '#f6f1e7'],
    hero: (Z, o) => { const x = hearth(Z, o, 'arm', 'read', 'book'); N(Z, F.dogBed, x - 1.7, 0.9, { color: '#8a5f3e' }); Z.spot('pet', x - 1.7, -Z.hd + 0.5, 0.3, { pose: 'sit' }); Z.mark('dogbed', x - 1.7, -Z.hd + 0.6); },
    sw: (Z, a, b) => { { const k = Z.at(-Z.hw + 0.25, (a + b) / 2, 0, 4); k.beam(0, 0, 0, 0.05, 1.6, 0.1, 0.035, '#8a5f3e', { ink: 0.003 }); k.add(K.GEO.thin, 0.05, 1.68, 0.2, 0.12, 0.12, 0.12, '#8a5f3e', { ry: H, ink: 0 }); } Z.W(F0.bench, (a + b) / 2 + 0.9, 0.42, { w: 1.1 }); }, walls: Z => { pic(Z, 4, -0.8, 2.3, 'hills', 0.6); } },
    u: { bed: 'single', desk: false, pics: ['hills', 'dog'] } });
  // 09 the jam maker: shelves of jars in every color, the big pot, fruit in crates
  T('jam', { label: 'the jam maker’s kitchen', g: { kitchen: 'full', center: (Z, x, z) => { Z.put(F.cookTable, x, z, 0, { w: 1.4 }); Z.spot('hero', x - 0.95, z, H, { job: 'stir', prop: 'spoon' }); Z.lamp(x, z, 2.5, '#c9443a'); }, cx: 0.0,
    hero: (Z, o) => { Z.wall(1, -1.6, 1.3, F.shelf, { len: 1.4, what: 'jam', levels: 2 }); Z.wall(1, 0.6, 1.3, F.shelf, { len: 1.4, what: 'jam', levels: 2 }); { const k = Z.at(-0.5, -Z.hd + 0.45); for (let i = 0; i < 3; i++) { k.post(-0.6 + i * 0.6, 0, 0, 0.5, 0.3, 0.4, '#c8925a', { ink: 0.004 }); for (let j = 0; j < 5; j++) k.ball(-0.75 + i * 0.6 + (j % 3) * 0.12, 0.33, -0.08 + Math.floor(j / 3) * 0.14, 0.06, ['#e2453a', '#f2a83a', '#7a3f5a'][i], { geo: K.GEO.ball6, ink: 0.003 }); } Z.box(-0.5, -Z.hd + 0.45, 0.9, 0.22); } },
    sw: (Z, a, b) => { Z.W(F0.sacks, (a + b) / 2, 0.7, { n: 3 }); } },
    u: { bed: 'single', desk: false, pics: ['vase', 'flowers2'], shelf: 'jam' } });
  // 10 the weaver: the loom, yarn in baskets, rugs on every floor and wall
  T('weaver', { label: 'the weaver’s house', g: { bed: 'single', kitchen: 'small', center: 'rug', cx: 0.6, rug: ['#c9553f', '#f2c14e', '#3f6fb5'],
    hero: (Z, o) => { N(Z, F.loom, -0.6, 0.9, {}); Z.spot('hero', -0.6, -Z.hd + 1.45, PI, { seat: 0.42, sit: 1, job: 'sew' }); N(Z, F.yarnBasket, 1.2, 0.5, {}); N(Z, F.yarnBasket, 1.8, 0.5, {}); },
    sw: (Z, a, b) => { Z.wall(4, (a + b) / 2, 1.7, F.quilt, { w: 1.2, h: 0.9 }); Z.put(F0.rectRug, -Z.hw + 1.2, (a + b) / 2, 0, { w: 1.4, d: 2.0 }); }, walls: Z => { Z.wall(4, -1.4, 2.2, F.quilt, { w: 0.9, h: 0.7 }); } } });
  // 11 the hat maker: hats on stands and shelves, hat boxes, a mirror
  T('hatter', { label: 'the hat maker’s workshop', g: { kitchen: 'small', center: 'dining', cx: 0.5,
    hero: (Z, o) => { N(Z, F.hatStand, -2.0, 0.6, {}); Z.wall(1, -0.3, 1.35, F.shelf, { len: 1.6, what: 'hats', levels: 2 }); N(Z, F.hatStand, 1.4, 0.6, {}); Z.spot('hero', -0.3, -Z.hd + 1.0, PI, { job: 'sew' }); Z.mark('shelf', -0.3, -Z.hd + 0.9); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); Z.wall(4, (a + b) / 2, 1.8, F0.windowItem, { w: 0.6, h: 0.8, curtains: false }); }, walls: Z => { pic(Z, 4, -1.2, 2.3, 'mill', 0.5); } },
    u: { bed: 'single', desk: 'notes', pics: ['flowers2', 'mill'], shelf: 'hats' } });
  // 12 the flower seller: buckets of flowers, vases, plants hanging from the beams
  T('florist', { label: 'the flower seller’s house', g: { bed: 'single', kitchen: 'small', center: 'dining', cx: 0.6,
    hero: (Z, o) => { N(Z, F.flowerBuckets, -0.6, 0.4, {}, { job: 'water', prop: 'can' }); N(Z, F.plants, 1.3, 0.5, {}); F.hangPlant(Z.room, Z.X(-1.4), -0.4, 2.3); F.hangPlant(Z.room, Z.X(1.8), 0.6, 2.2); pic(Z, 1, -0.6, 2.2, 'flowers2', 0.65); },
    sw: (Z, a, b) => { Z.W(F.flowerBuckets, (a + b) / 2, 0.4, {}); }, walls: Z => { pic(Z, 4, -0.8, 2.3, 'vase', 0.5); } } });
  // 13 the cook and her husband who's ill in bed upstairs
  T('sickbed', { label: 'the house with the soup on', g: { kitchen: 'full', center: 'dining', cx: 0.4,
    hero: (Z, o) => { hearth(Z, o, 'arm', 'read', 'book'); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); } },
    u: { bed: 'double', desk: false, pics: ['family', 'mill'], hero: (Z, z) => { Z.W(F0.armchair, -Z.hd + 1.6, 0.8, { color: Z.P.fab[0] }); }, walls: Z => { const k = Z.at(-1.5, -Z.hd + 0.28); for (let i = 0; i < 3; i++) k.cyl(-0.1 + i * 0.07, 0.6, 0, 0.025, 0.1, ['#8fd3ec', '#f2c14e', '#fdf8ee'][i], { geo: K.GEO.cyl6, ink: 0.002 }); } } });
  // 14 the music teacher: the piano, music stands, chairs for the pupils
  T('musicTeacher', { label: 'the music teacher’s house', g: { kitchen: 'small', center: (Z, x, z) => { Z.put(F0.roundRug, x, z, 0, { r: 1.2 }); for (const s of [-1, 1]) { const m = Z.put(F0.chair, x + s * 0.7, z, PI, { color: Z.P.wood }); Z.spot('sit', x + s * 0.7, z, PI, { seat: m.seat }); } Z.put(F.musicStand, x, z - 0.9, PI, {}); Z.lamp(x, z, 2.6, '#7a5ab0'); }, cx: 0.3,
    hero: (Z, o) => { N(Z, F.piano, -0.9, 0.7, {}); Z.spot('hero', -0.9, -Z.hd + 1.48, PI, { seat: 0.48, sit: 1, job: 'keys' }); N(Z, F.violin, 1.0, 0.45, {}); N(Z, F.musicStand, 1.8, 0.45, {}); pic(Z, 1, 1.4, 2.3, 'notes', 0.6); },
    sw: (Z, a, b) => { Z.W(F0.bookcase, (a + b) / 2, 0.36, { w: 1.1 }); }, walls: Z => { pic(Z, 4, -1.0, 2.3, 'poster', 0.55); } },
    u: { bed: 'single', desk: 'notes', pics: ['notes', 'mill'], hero: (Z, z) => { Z.W(F.musicStand, -Z.hd + 1.4, 0.45, {}); } } });
  // 15 the toy maker: wooden toys on the bench and the shelves, a rocking horse that rocks
  T('toymaker', { label: 'the toy maker’s workshop', g: { bed: 'single', kitchen: 'small', center: (Z, x, z) => { Z.put(F0.roundRug, x, z, 0, { r: 1.1 }); Z.put(F.rockingHorse, x + 0.3, z, H * 0.6, {}); Z.put(F.toys, x - 0.6, z + 0.3, 0, {}); Z.lamp(x, z, 2.6, '#e0743c'); }, cx: 0.6,
    hero: (Z, o) => { N(Z, F0.workbench, -0.6, 0.86, { len: 1.6 }, { job: 'tinker', prop: 'tool', dz: 0.45 }); Z.wall(1, -0.6, 1.75, F.shelf, { len: 1.5, what: 'toys', levels: 2 }); N(Z, F.toyBox, 1.5, 0.55, {}); },
    sw: (Z, a, b) => { Z.wall(4, (a + b) / 2, 1.2, F.shelf, { len: 1.1, what: 'toys', levels: 2 }); } } });
  // 16 the photographer: a camera on its tripod, a wall of photos; upstairs the darkroom, photos drying on a line
  T('photographer', { label: 'the photographer’s studio', g: { kitchen: 'small', center: 'sofa', cx: 0.5,
    hero: (Z, o) => { N(Z, F.tripodCamera, -1.6, 0.7, {}, { job: 'think', dx: 0.7, dz: 0.4 }); Z.wall(1, 0.4, 2.0, F.photoWall, { cells: ['family', 'mill', 'hills', 'baby', 'dog', 'lake'] }); N(Z, F0.floorLamp, 1.9, 0.45, {}); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); }, walls: Z => { Z.wall(4, -1.0, 2.0, F.photoWall, { cells: ['grandma', 'tower', 'lake', 'family', 'cat', 'boat'] }); } },
    u: { bed: 'single', desk: false, pics: ['family', 'hills'], walls: Z => { Z.put(F.laundry, 1.0, 0.9, 0, {}); Z.lamp(1.0, 0.9, 2.3, '#d9483b'); } } });
  // 17 the chess player: a game laid out, trophies, chess books
  T('chess', { label: 'the chess player’s house', g: { bed: 'single', kitchen: 'small', center: (Z, x, z) => { Z.put(F0.rectRug, x, z, 0, { w: 2.2, d: 1.8, cols: ['#2b2235', '#fdf8ee', '#c99a3e'] }); Z.put(F.chessTable, x, z, 0, {}); for (const s of [-1, 1]) { const m = Z.put(F0.chair, x + s * 0.75, z, -s * H, { color: Z.P.wood }); Z.spot('sit', x + s * 0.75, z, -s * H, { seat: m.seat, job: 'think' }); } Z.lamp(x, z, 2.5, '#2f8f86'); }, cx: 0.6,
    hero: (Z, o) => { Z.wall(1, -0.8, 1.4, F.shelf, { len: 1.6, what: 'trophies', levels: 2 }); N(Z, F0.bookcase, 1.2, 0.36, { w: 1.1 }); },
    sw: (Z, a, b) => { Z.W(F0.armchair, (a + b) / 2, 0.8, { color: '#2f8f86' }); } } });
  // 18 the candy maker: jars of sweets, the caramel pot, a cake under glass
  T('candy', { label: 'the candy maker’s kitchen', g: { kitchen: 'full', center: 'dining', cx: 0.4,
    hero: (Z, o) => { Z.wall(1, -1.4, 1.3, F.shelf, { len: 1.5, what: 'candy', levels: 2 }); N(Z, F.cakeStand, 0.5, 0.5, { color: '#7fd3a8' }, { job: 'stir', prop: 'spoon', dx: 0.6 }); Z.wall(1, 1.8, 1.4, F.shelf, { len: 1.0, what: 'candy', levels: 2 }); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); } },
    u: { bed: 'single', desk: false, pics: ['vase', 'flowers2'], shelf: 'candy' } });
  // 19 the old miller: a model of the Great Mill, a millstone for a table, flour sacks
  T('oldMiller', { label: 'the old miller’s house', g: { kitchen: 'small', center: (Z, x, z) => { { const k = Z.at(x, z); k.cyl(0, 0, 0, 0.75, 0.42, '#b8b1a3', { geo: K.GEO.cyl16 }); k.cyl(0, 0.42, 0, 0.18, 0.02, '#8a8a96', { geo: K.GEO.cyl8, ink: 0 }); } Z.solid(x, z, 0.8); for (const s of [-1, 1]) { const m = Z.put(F0.stool, x + s * 1.1, z, 0, {}); Z.spot('sit', x + s * 1.1, z, -s * H, { seat: 0.5 }); } Z.lamp(x, z, 2.6, '#c9783a'); }, cx: 0.4,
    hero: (Z, o) => { N(Z, F.windmillModel, -1.2, 0.55, { speed: 0.6 }, { job: 'think', dx: 0.8, dz: 0.4 }); N(Z, F0.sacks, 1.0, 0.7, { n: 3 }); pic(Z, 1, -1.2, 2.4, 'mill', 0.6); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); }, walls: Z => { pic(Z, 4, -1.0, 2.3, 'hills', 0.55); } },
    u: { bed: 'single', desk: false, pics: ['mill', 'family'] } });
  // 20 the runner (a teenager): trophies, shoes, a mat; homework upstairs
  T('runner', { label: 'the runner’s house', g: { kitchen: 'small', center: (Z, x, z) => { Z.put(F.mat, x, z, H, { color: '#4fb3a9', w: 0.7, d: 1.8 }); Z.spot('floor', x, z, PI, {}); Z.lamp(x, z, 2.6, '#4fb3a9'); }, cx: 0.4,
    hero: (Z, o) => { Z.wall(1, -0.8, 1.4, F.shelf, { len: 1.6, what: 'trophies', levels: 2 }); N(Z, F.shoeRack, 1.2, 0.3, {}); pic(Z, 1, -0.8, 2.4, 'hills', 0.6); },
    sw: (Z, a, b) => { Z.W(F.bicycle, (a + b) / 2, 0.4, { color: '#e0743c' }); } },
    u: { bed: 'single', desk: 'homework', pics: ['hills', 'poster'], shelf: 'trophies' } });
  // 21 the widow: her husband's photo by the old radio, lace, a rocking chair; the mill on the wall
  T('widow', { label: 'the widow’s house', g: { bed: 'single', kitchen: 'small', center: 'dining', cx: 0.6,
    hero: (Z, o) => { N(Z, F.radio, -1.4, 0.45, { cell: 'family' }); const b = K.rockingChair(Z.room, Z.X(0.0), -Z.hd + 1.3, Z.Y(-2.8), Z.P.wood); Z.spot('rock', 0.0, -Z.hd + 1.3, -2.8, { bone: b, seat: 0.5, job: 'knit', prop: 'knit' }); Z.wall(1, 1.4, 2.0, F.photoWall, { cells: ['family', 'mill', 'grandma', 'hills', 'family', 'baby'] }); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); }, walls: Z => { pic(Z, 4, -0.6, 2.3, 'mill', 0.55); } } });
  // 22 the bookbinder: the press, towers of books, a glue pot
  T('bookbinder', { label: 'the bookbinder’s workshop', g: { kitchen: 'small', center: 'dining', cx: 0.5,
    hero: (Z, o) => { N(Z, F0.bookcase, -2.1, 0.36, { w: 1.1 }); N(Z, F.bookPress, -0.4, 0.6, {}, { job: 'tinker', prop: 'tool' }); N(Z, F0.bookcase, 1.4, 0.36, { w: 1.1 }); },
    sw: (Z, a, b) => { Z.W(F.papers, (a + b) / 2, 0.5, {}); Z.W(F.papers, (a + b) / 2 + 0.7, 0.5, {}); } },
    u: { bed: 'single', desk: 'notes', pics: ['notes', 'vase'] } });
  // 23 the violinist: the violin on its stand, music everywhere, a sofa to listen from
  T('violinist', { label: 'the violinist’s house', g: { kitchen: 'small', center: 'sofa', cx: 0.4,
    hero: (Z, o) => { N(Z, F.violin, -1.6, 0.45, {}); N(Z, F.musicStand, -0.6, 0.45, {}); Z.spot('hero', -0.6, -Z.hd + 1.2, PI, { job: 'strum', prop: 'violin' }); N(Z, F.records, 1.2, 0.45, {}); pic(Z, 1, -1.1, 2.3, 'notes', 0.6); pic(Z, 1, 1.2, 2.3, 'poster', 0.5); },
    sw: (Z, a, b) => { Z.W(F0.bookcase, (a + b) / 2, 0.36, { w: 1.1 }); } },
    u: { bed: 'single', desk: 'notes', pics: ['notes', 'moon'] } });
  // 24 the locksmith: keys on a board, locks in pieces on the bench
  T('locksmith', { label: 'the locksmith’s workshop', g: { kitchen: 'small', center: 'dining', cx: 0.5,
    hero: (Z, o) => { N(Z, F0.workbench, -0.6, 0.86, { len: 1.6, gears: true }, { job: 'tinker', prop: 'tool', dz: 0.45 }); Z.wall(1, -0.6, 2.0, F.keyBoard, {}); Z.wall(1, 1.5, 1.5, F.shelf, { len: 1.0, what: 'keys', levels: 2 }); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); } },
    u: { bed: 'single', desk: false, pics: ['tower', 'mill'] } });
  // 25 the traveler about to leave: suitcases half packed, the map, the ticket
  T('packing', { label: 'the house of the young traveler', g: { kitchen: 'small', center: (Z, x, z) => { Z.put(F0.roundRug, x, z, 0, { r: 1.1 }); Z.put(F.suitcases, x + 0.3, z - 0.1, 0.4, {}); Z.put(F.boxes, x - 0.9, z + 0.2, -0.3, {}); Z.spot('stand', x + 0.4, z + 0.8, PI, { job: 'think' }); Z.lamp(x, z, 2.6, '#3f6fb5'); }, cx: 0.5,
    hero: (Z, o) => { pic(Z, 1, -0.6, 2.1, 'world', 1.2); N(Z, F0.dresser, -0.6, 0.5, { w: 1.2, rack: false }); N(Z, F.hatStand, 1.4, 0.6, {}); Z.mark('hat', 1.4, -Z.hd + 1.0); },
    sw: (Z, a, b) => { Z.W(F0.bookcase, (a + b) / 2, 0.36, { w: 1.0 }); Z.mark('books', -Z.hw + 0.9, (a + b) / 2); } },
    u: { bed: 'single', desk: 'maps', pics: ['world', 'tower'] } });
  // the farmhouse (Marga's): the big table, cheese on the shelves, the churn, the hood over the hearth
  T('farm', { size: 'L', label: 'Marga’s farmhouse', g: { bed: 'double', kitchen: 'full', center: 'dining', chairs: 4, tableW: 1.8, cx: 0.4,
    hero: (Z, o) => { hearth(Z, o, null); N(Z, F.churn, (o.x0 + o.x1) / 2 + 1.5, 0.45, {}, { job: 'stir', dz: 0.4 }); },
    sw: (Z, a, b) => { Z.W(F.cheeses, (a + b) / 2, 0.5, {}); }, se: (Z, a, b) => { Z.E(F0.sacks, (a + b) / 2, 0.7, { n: 5 }); } } });

  // ---- Remanso (painted boards, lake planks)
  // A the fisher family: nets on the walls, the bucket, the catch on the table; the girls' bunks at the back
  T('fisherFamily', { label: 'the fishers’ house', g: { kitchen: 'small', center: (Z, x, z) => { dining(Z, x, z); }, cx: 0.4,
    hero: (Z, o) => { Z.wall(1, -0.8, 2.6, F0.fishNet, { w: 2.0 }); N(Z, F.tackle, -0.8, 0.4, {}); Z.mark('basket', -0.8, -Z.hd + 0.9); N(Z, F.ropeCoil, 1.3, 0.75, {}); },
    sw: (Z, a, b) => { Z.W(F.seaChest, (a + b) / 2, 0.55, { color: '#2f8f86' }); }, walls: Z => { Z.wall(4, -0.8, 2.3, F0.lifeRing, {}); pic(Z, 4, 0.8, 2.3, 'fishprint', 0.5); } },
    u: { bed: 'bunks', desk: false, pics: ['sea', 'boat'], shelf: 'shells' } });
  // B the retired sailor and his parrot: the ship's wheel, the telescope, a chest, a ship in a bottle
  T('sailor', { label: 'the old sailor’s house', g: { kitchen: 'small', center: 'dining', cx: 0.5,
    hero: (Z, o) => { Z.wall(1, -1.0, 1.8, F.shipWheel, {}); N(Z, F.perch, 0.6, 0.6, {}); Z.spot('parrot', 0.6, -Z.hd + 0.33, 0.3, { y: 1.25 }); N(Z, F.telescope, 2.0, 0.8, {}); N(Z, F.seaChest, -1.0, 0.55, { color: '#3f6fb5' }); },
    sw: (Z, a, b) => { Z.wall(4, (a + b) / 2, 1.4, F.shelf, { len: 1.1, what: 'ship', levels: 2 }); Z.W(F0.armchair, (a + b) / 2, 0.8, { color: '#3f6fb5' }); Z.spot('arm', -Z.hw + 0.6, (a + b) / 2, H, { seat: 0.56, job: 'read', prop: 'book' }); }, walls: Z => { pic(Z, 4, -1.0, 2.3, 'sea', 0.6); pic(Z, 2, 0.0, 2.4, 'world', 0.6); } },
    u: { bed: 'none', desk: false, pics: ['boat', 'sea'], hero: (Z, z) => { Z.put(F.hammock, 0.0, -Z.hd + 0.75, 0, { color: '#3f6fb5', len: 2.4 }); Z.spot('bed', 0.0, -Z.hd + 1.3, PI, {}); Z.W(F.seaChest, 0.2, 0.55, { color: '#8a5f3e' }); } } });
  // C the net mender: nets everywhere, floats, oars, a coil of rope, his stool
  T('netMender', { label: 'the net mender’s house', g: { bed: 'single', kitchen: 'small', center: (Z, x, z) => { Z.put(F0.roundRug, x, z, 0, { r: 1.0, cols: ['#5d6b70', '#9aa0ad', '#d8c08a'] }); Z.put(F0.stool, x, z + 0.4, 0, {}); Z.spot('hero', x, z + 0.4, PI, { seat: 0.5, sit: 1, job: 'sew' }); { const k = Z.at(x, z - 0.4); for (let i = 0; i < 5; i++) k.box((i - 2) * 0.15, 0.05 + (i % 2) * 0.03, 0, 0.3, 0.04, 0.5, '#5d6b70', { ry: i * 0.5, ink: 0 }); for (let i = 0; i < 3; i++) k.ball(-0.3 + i * 0.3, 0.1, 0.25, 0.07, ['#d9483b', '#f2c94c', '#fdf8ee'][i], { ink: 0.003 }); } Z.lamp(x, z, 2.5, '#2f8f86'); }, cx: 0.6,
    hero: (Z, o) => { Z.wall(1, -0.6, 2.6, F0.fishNet, { w: 2.2 }); Z.wall(1, 1.6, 2.4, F0.oars, {}); N(Z, F.ropeCoil, -0.6, 0.75, {}); },
    sw: (Z, a, b) => { Z.W(F.seaChest, (a + b) / 2, 0.55, { color: '#d9483b' }); }, walls: Z => { Z.wall(4, -0.5, 2.3, F0.lifeRing, {}); } } });
  // L1 the shell collectors (a boy and his big sister): shells on every shelf, a fish tank, sea pictures; their room upstairs
  T('shells', { label: 'the house of the shell collectors', g: { kitchen: 'full', center: 'dining', cx: 0.4,
    hero: (Z, o) => { Z.wall(1, -1.6, 1.4, F.shelf, { len: 1.2, what: 'shells', levels: 2 }); N(Z, F.aquarium, 0.4, 0.5, { w: 1.1 }); pic(Z, 1, 0.4, 2.4, 'sea', 0.6); },
    sw: (Z, a, b) => { Z.W(F.seaChest, (a + b) / 2, 0.55, { color: '#f2c14e' }); } },
    u: { bed: 'kid', desk: 'homework', pics: ['sea', 'fishprint'], shelf: 'shells', hero: (Z, z) => { Z.W(F.toyBox, -Z.hd + 1.5, 0.55, { color: '#2f8f86' }); Z.mark('underbed', 0.2, -Z.hd + 1.0); } } });
  // L2 the lady who stopped writing: letters on the desk, her son's photos, the clock she never wound
  T('letters', { label: 'the letter writer’s house', g: { bed: 'single', kitchen: 'small', center: 'rug', cx: 0.6, rug: ['#8fb0c9', '#e8dcc0', '#c9b9a0'],
    hero: (Z, o) => { N(Z, F.desk, -0.6, 0.6, { items: 'letters', w: 1.3 }); const m = Z.put(F0.chair, -0.6, -Z.hd + 1.25, PI, { color: Z.P.wood, look: null }); Z.spot('desk', -0.6, -Z.hd + 1.25, PI, { seat: m.seat, job: 'write', prop: 'letter' }); Z.wall(1, -0.6, 2.1, F.photoWall, { cells: ['family', 'baby', 'lake', 'boat', 'family', 'tower'] }); N(Z, F0.grandClock, 1.6, 0.45, { color: '#5e4130' }); },
    sw: (Z, a, b) => { Z.W(F0.armchair, (a + b) / 2, 0.8, { color: '#8fb0c9' }); Z.W(F0.sideTable, (a + b) / 2 + 0.9, 0.6, {}); }, walls: Z => { pic(Z, 4, -0.6, 2.3, 'lake', 0.55); } } });
  // L3 the boat painter: a little boat half painted, cans and brushes, model boats
  T('boatPainter', { label: 'the boat painter’s workshop', g: { bed: 'single', kitchen: 'small', center: (Z, x, z) => { Z.put(F.rowboat, x, z, 0, { color: '#2f8f86' }); Z.spot('stand', x - 0.4, z + 0.85, PI, { job: 'paint', prop: 'brush', propColor: '#2f8f86' }); Z.lamp(x, z, 2.6, '#2f8f86'); }, cx: 0.5,
    hero: (Z, o) => { Z.wall(1, -0.8, 1.4, F.shelf, { len: 1.6, what: 'ship', levels: 2 }); N(Z, F0.workbench, 1.2, 0.86, { len: 1.4 }); pic(Z, 1, -0.8, 2.4, 'boat', 0.6); },
    sw: (Z, a, b) => { { const k = Z.at(-Z.hw + 0.45, (a + b) / 2); for (let i = 0; i < 4; i++) k.cyl((i % 2) * 0.28 - 0.14, Math.floor(i / 2) * 0.22, (i % 3) * 0.1, 0.11, 0.2, ITH.BRIGHT[i * 2], { geo: K.GEO.cyl8, ink: 0.004 }); Z.solid(-Z.hw + 0.45, (a + b) / 2, 0.35); } }, walls: Z => { pic(Z, 4, -0.8, 2.3, 'sea', 0.5); } } });
  // S1 the weather watcher: a barometer, a wind chime, her notebooks of skies; a rain gauge by the window
  T('weather', { label: 'the weather watcher’s house', g: { kitchen: 'small', center: 'dining', cx: 0.5,
    hero: (Z, o) => { N(Z, F.desk, -0.8, 0.6, { items: 'notes', w: 1.3 }); const m = Z.put(F0.chair, -0.8, -Z.hd + 1.25, PI, { color: Z.P.wood, look: null }); Z.spot('desk', -0.8, -Z.hd + 1.25, PI, { seat: m.seat, job: 'write' }); Z.wall(1, -2.2, 1.7, F.barometer, {}); Z.wall(1, 1.0, 2.2, F0.windowItem, { w: 1.1, h: 1.0, curtains: false }); N(Z, F.telescope, 1.0, 0.8, { color: '#2f8f86' }); F.windChime(Z.room, Z.X(0.2), -0.3, 2.6); },
    sw: (Z, a, b) => { Z.W(F0.bookcase, (a + b) / 2, 0.36, { w: 1.1 }); }, walls: Z => { pic(Z, 4, -1.0, 2.3, 'moon', 0.55); pic(Z, 4, 0.0, 2.4, 'sea', 0.45); } },
    u: { bed: 'single', desk: 'notes', pics: ['stars', 'moon'], walls: Z => { F.windChime(Z.room, Z.X(-0.6), 0.2, 2.5); } } });
  // S2 the grandma and her grandson's turtle: the turtle's tub, frogs and lake pictures, toys
  T('turtle', { label: 'Galleta the turtle’s house', g: { bed: 'single', kitchen: 'full', center: (Z, x, z) => { Z.put(F0.roundRug, x, z, 0, { r: 1.2, cols: ['#7fbf6a', '#cfe8a8', '#4f9a5a'] }); Z.put(F.basin, x, z - 0.1, 0, {}); Z.spot('turtle', x - 0.15, z + 0.05, 0.6, { y: 0.21 }); Z.spot('floor', x + 0.4, z + 0.85, PI, {}); Z.lamp(x, z, 2.6, '#4f9a5a'); }, cx: 0.5,
    hero: (Z, o) => { const x = hearth(Z, o, 'rock', 'knit', 'knit'); N(Z, F.toyBox, x - 1.8, 0.55, { color: '#4f9a5a' }); },
    sw: (Z, a, b) => { Z.W(F0.dresser, (a + b) / 2, 0.5, { w: 1.1, rack: false }); }, walls: Z => { pic(Z, 4, -0.6, 2.3, 'lake', 0.55); pic(Z, 4, 0.5, 2.4, 'sunkid', 0.45, { frame: '#fdf8ee' }); } } });
  const { dining } = LAY;
})();
