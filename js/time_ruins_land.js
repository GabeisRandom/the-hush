'use strict';
// The Sunken Ruins' two lands (TIME.land, time_land.js; DESIGN.md 21.1 "a green city with rivers and fields … the sea over it, which
// explains the name"; game/TIME.md "The Sunken Ruins (T4b)"). The terrain never changes: only what lies on it.
//   Long ago (the pluperfect; the first dig, the morning after the flood): the canyon green. A river runs from a fall at the temple
//   court's north-east wall, past the old town and the camp, down the gully into the cove; date palms on its banks, green reeds,
//   grass over the sand, fig trees and three small fields by the cove, a water wheel, the fisherwoman's boat; the dig's spoil heaps by
//   the temple's trench (walkable); green on the mesas.
//   Tomorrow («cuando» + the subjunctive, doubt): the sea over the ruins. TIME.land's flood fills the canyon floor and the cove at
//   RUINT.WATER_Y (1.75 over the floor: today's tents just poke out, the Wall's panels and the temple's door half under); boardwalks on
//   stilts (decks at RUINT.DECK_Y) run from a landing at the old gully over the stilt camp to the old town and the temple's door; wet
//   dark bands and a waterline stain on the red walls. Freed (ruFree): a green island rises by the old town with a spring on it, a
//   young palm and Nadia's garden.
// The words of the land are RUPTXT's and RUFTXT's (w.rup_*, w.ruf_*); the land lines are here.
(() => {
  if (typeof TIME === 'undefined' || !TIME.land || typeof WORLD === 'undefined' || typeof RUINS === 'undefined' || typeof RUINT === 'undefined' || !RUINT) return;
  const LAND = TIME.land, R = RUINS, tA = (x, z) => WORLD.terrainAt(x, z), M = RUINT, L = M.L;
  const ss = (a, b, x) => smoothstep(a, b, x);
  const BOX = { x0: 96, x1: 190, z0: -44, z1: 76 };
  const WY = M.WATER_Y, DY = M.DECK_Y;
  const pathK = (x, z) => { let p = 0; for (const q of R.PATHS) p = Math.max(p, 1 - ss(0.6, 1.8, R.polyD(q.pts, x, z))); return p; };
  const floorK = (x, z) => (R.inBox(x, z) ? 1 - ss(-0.3, 1.1, R.openDist(x, z)) : 0);
  const near = (list, x, z, d) => list.some(p => Math.hypot(p.x - x, p.z - z) < d);
  const segD = (x, z, P) => { let d = 1e9; for (let i = 0; i < P.length - 1; i++) d = Math.min(d, R.segD(x, z, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1])); return d; };

  // ======================================================== long ago: the green canyon and its river
  const RIVER = [[150.6, -19.4], [147.6, -13.0], [141.6, -9.2], [139.6, -6.2], [140.6, -1.6], [140.4, 3.6], [139.6, 9.0], [139.0, 15.0], [141.4, 23.0], [143.8, 28.6], [145.0, 33.0], [143.8, 38.0], [142.4, 43.0], [141.0, 48.6]];
  const FIELDS = [{ x: 126.8, z: 41.6, rx: 2.6, rz: 1.5, rot: 0.1 }, { x: 131.2, z: 42.2, rx: 1.9, rz: 1.4, rot: -0.15 }, { x: 126.2, z: 45.0, rx: 2.2, rz: 1.1, rot: 0.05 }];
  const PAST_KEEP = [{ x: 142.0, z: -20.0, r: 2.6 }, ...Object.values((typeof RU_PAST !== 'undefined' && RU_PAST && RU_PAST.AT) || {}).map(a => ({ x: a.x, z: a.z, r: 1.6 }))];
  const Rg = rng(70713);
  const pastTrees = [];
  // date palms along both banks, every few steps, on the floor and clear of the people, the cracks and the paths' middles
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, az] = RIVER[i], [bx, bz] = RIVER[i + 1], l = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / l, nz = (bx - ax) / l;
    for (let s = 0.6; s < l; s += 4.2) for (const side of [-1, 1]) {
      const off = 2.4 + Rg() * 1.2, x = ax + (bx - ax) * s / l + nx * side * off, z = az + (bz - az) * s / l + nz * side * off;
      if (R.walkDist(x, z) > -0.8 || pathK(x, z) > 0.35 || near(PAST_KEEP, x, z, 2.2) || segD(x, z, RIVER) < 2.0) continue;
      if (Object.values(M.CRACK).some(c => Math.hypot(c.x - x, c.z - z) < 3.6) || near(pastTrees, x, z, 2.6)) continue;
      pastTrees.push({ x, z, kind: 'palm', s: 0.85 + Rg() * 0.35, seed: Rg() });
    }
  }
  // green reeds on the river's edges, fig trees and saplings round the fields
  const reeds = [];
  for (let i = 0; i < RIVER.length - 1; i++) {
    const [ax, az] = RIVER[i], [bx, bz] = RIVER[i + 1], l = Math.hypot(bx - ax, bz - az), nx = -(bz - az) / l, nz = (bx - ax) / l;
    for (let s = 0.4; s < l; s += 1.7) { const side = Rg() < 0.5 ? -1 : 1, x = ax + (bx - ax) * s / l + nx * side * 1.45, z = az + (bz - az) * s / l + nz * side * 1.45; if (R.walkDist(x, z) > -0.3 || near(PAST_KEEP, x, z, 1.6) || pathK(x, z) > 0.6) continue; reeds.push({ x, z, kind: 'reedGreen', s: 0.8 + Rg() * 0.5, seed: Rg() }); }
  }
  const figs = [{ x: 124.4, z: 39.8, kind: 'fruit', s: 0.8 }, { x: 133.6, z: 39.6, kind: 'fruit', s: 0.75 }, { x: 123.6, z: 43.2, kind: 'fruit', s: 0.7 }, { x: 129.2, z: 46.2, kind: 'sapling', s: 1 }];
  const crops = [];
  for (const F of FIELDS) { const c = Math.cos(F.rot), s = Math.sin(F.rot); for (let lx = -F.rx + 0.4; lx < F.rx - 0.3; lx += 0.7) for (let lz = -F.rz + 0.35; lz < F.rz - 0.25; lz += 0.75) crops.push({ x: F.x + lx * c + lz * s, z: F.z - lx * s + lz * c, kind: (Math.round(lx * 3 + lz) % 3) ? 'sprout' : 'flowers', s: 0.8 + ((lx * 7 + lz * 3) % 1 + 1) % 1 * 0.3 }); }
  // green trees up on the mesas (seen over the canyon's rim; outside the reach, no solids)
  const mesa = [];
  for (let n = 0; n < 3000 && mesa.length < 46; n++) {
    const x = lerp(104, 182, Rg()), z = lerp(-40, 66, Rg()), od = R.openDist(x, z);
    if (od < 9 || od > 24 || !R.inBox(x, z, -4) || near(mesa, x, z, 4.5)) continue;
    mesa.push({ x, z, kind: Rg() < 0.55 ? 'palm' : Rg() < 0.5 ? 'oak' : 'fruit', s: 0.9 + Rg() * 0.4, seed: Rg() });
  }
  // the land's things: the farmer's hut, a water wheel on the river by the fields, the fisherwoman's boat and her nets on poles
  const hut = { x: 122.9, z: 40.8, r: 1.4, build(k, KG, y) {
    const x = this.x, z = this.z;
    k.add(KG.cyl, x, y + 0.85, z, 1.25, 1.7, 1.25, '#b9956a', { ink: 0.014 }).add(KG.cone, x, y + 2.25, z, 1.6, 1.2, 1.6, '#c9b27a', { ink: 0.014 });
    k.box(x + 1.2, y + 0.65, z + 0.1, 0.06, 1.3, 0.7, '#5a3a24', { ink: 0 });
    for (let i = 0; i < 3; i++) k.add(KG.sphere, x + 1.6, y + 0.2 + i * 0.05, z + 1.0 - i * 0.5, 0.28, 0.2, 0.28, ['#e0a43c', '#c9643f', '#8a6a3a'][i], { ink: 0.006 });
  } };
  const wheel = { x: 143.9, z: 40.6, r: 0, build(k, KG, y) {
    const x = this.x, z = this.z;
    for (const s of [-1, 1]) k.add(KG.cyl6, x + s * 0.5, y + 1.0, z, 0.08, 2.0, 0.08, '#6b4a30', { ink: 0.006 });
    k.add(KG.torus, x, y + 1.4, z, 1.2, 1.2, 0.8, '#8a6440', { ry: Math.PI / 2, ink: 0.008 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; k.rod([x, y + 1.4, z], [x, y + 1.4 + Math.sin(a) * 1.2, z + Math.cos(a) * 1.2], 0.04, '#8a6440', 0); k.box(x, y + 1.4 + Math.sin(a) * 1.25, z + Math.cos(a) * 1.25, 0.5, 0.18, 0.18, '#a8743f', { rx: a, ink: 0.004 }); }
  } };
  const boat = { x: 148.2, z: 45.4, r: 1.1, build(k, KG, y) {
    const x = this.x, z = this.z;
    k.box(x, y + 0.3, z, 0.95, 0.42, 2.6, '#4c7fd8', { ry: 0.5, ink: 0.012 }).box(x, y + 0.52, z, 1.0, 0.05, 2.65, '#f4efe2', { ry: 0.5, ink: 0.004 });
    k.add(KG.cone, x + Math.sin(0.5) * 1.5, y + 0.3, z + Math.cos(0.5) * 1.5, 0.45, 0.6, 0.3, '#4c7fd8', { rx: Math.PI / 2, ry: 0.5, ink: 0.008 });
    k.rod([x - 0.2, y + 0.5, z], [x - 0.9, y + 0.1, z + 1.4], 0.03, '#a8743f', 0.004);
    for (const [dx, dz] of [[2.2, -1.4], [3.4, -0.6]]) k.add(KG.cyl6, x + dx, y + 0.9, z + dz, 0.05, 1.8, 0.05, '#6b4a30', { ink: 0 });
    k.box(x + 2.8, y + 1.2, z - 1.0, 1.4, 0.9, 0.03, '#7a8a6a', { ry: 0.6, ink: 0.004 });
  } };
  const PAST_LINES = {
    farmer: [L('The river comes down from the rocks up north, past the temple, and all the way to the sea. It waters my fields all year.', 'El río baja de las rocas del norte, pasa junto al templo y llega hasta el mar. Riega mis huertos todo el año.',
        'O rio desce das pedras do norte, passa pelo templo e vai até o mar. Ele rega as minhas hortas o ano inteiro.', 'Der Fluss kommt von den Felsen im Norden herunter, fließt am Tempel vorbei bis zum Meer. Er bewässert meine Felder das ganze Jahr.',
        '[河水|hé shuǐ] [从|cóng] [北边|běi bian] [的|de] [岩石|yán shí] [流|liú] [下来|xià lai] ， [经过|jīng guò] [神庙|shén miào] ， [一直|yī zhí] [流|liú] [到|dào] [海|hǎi] [里|lǐ] 。 [一年四季|yī nián sì jì] [都|dōu] [浇|jiāo] [着|zhe] [我|wǒ] [的|de] [田|tián] 。',
        '[川|かわ] は [北|きた] の [岩|いわ] から [下|くだ]って きて 、 [神殿|しんでん] の そば を [通|とお]って 、 [海|うみ] まで [流|なが]れる の 。 [一年中|いちねんじゅう] 、 うち の [畑|はたけ] を うるおして くれる 。'),
      L('My grandmother said that long, long ago the river had been twice as wide. Who knows.', 'Mi abuela decía que, hace mucho mucho tiempo, el río había sido el doble de ancho. Quién sabe.',
        'A minha avó dizia que, muito tempo atrás, o rio tinha sido duas vezes mais largo. Vai saber.', 'Meine Großmutter hat gesagt, dass der Fluss vor langer, langer Zeit doppelt so breit gewesen war. Wer weiß.',
        '[我|wǒ] [奶奶|nǎi nai] [说|shuō] ， [很|hěn] [久|jiǔ] [很|hěn] [久|jiǔ] [以前|yǐ qián] ， [这|zhè] [条|tiáo] [河|hé] [有|yǒu] [现在|xiàn zài] [两|liǎng] [倍|bèi] [宽|kuān] 。 [谁|shéi] [知道|zhī dào] [呢|ne] 。',
        'うち の おばあちゃん は 、 ずっと [昔|むかし] 、 [川|かわ] は [今|いま] の [倍|ばい] も [広|ひろ]かった と [言|い]って いた わ 。 どう かしら ね 。')],
    fisher: [L('The river brings the fish down to the cove, and the palms give us dates. Nobody here goes hungry.', 'El río trae los peces hasta la cala, y las palmeras nos dan dátiles. Aquí nadie pasa hambre.',
        'O rio traz os peixes até a enseada, e as palmeiras dão tâmaras. Aqui ninguém passa fome.', 'Der Fluss bringt die Fische in die Bucht, und die Palmen geben uns Datteln. Hier hungert niemand.',
        '[河水|hé shuǐ] [把|bǎ] [鱼|yú] [带到|dài dào] [海湾|hǎi wān] ， [棕榈树|zōng lǘ shù] [给|gěi] [我们|wǒ men] [椰枣|yē zǎo] 。 [这里|zhè lǐ] [没有|méi yǒu] [人|rén] [挨饿|ái è] 。',
        '[川|かわ] が [魚|さかな] を [入|い]り[江|え] まで [運|はこ]んで くれて 、 ヤシ は デーツ を くれる 。 ここ で は だれ も おなか を すかせない よ 。')],
  };
  LAND('ruins', 'past', {
    box: BOX, arena: 'riverbank',
    ground: [
      { col: '#5f9a46', map: '#8cc86a', amt: (x, z) => floorK(x, z) * (1 - pathK(x, z) * 0.75) * 0.88 },              // (grass and riverbank soil over the sand; the paths stay pale)
      { col: '#7a6a44', map: '#c8b27a', amt: (x, z) => floorK(x, z) * pathK(x, z) * 0.35 },
      { col: '#6f9a48', map: '#9fc06a', amt: (x, z, q) => (R.inBox(x, z) ? ss(10, 18, R.openDist(x, z)) * (1 - ss(0.3, 1.0, q.sl)) * 0.75 : 0) },      // (green on the mesas)
      { col: '#7f9a4a', map: '#a8b070', amt: (x, z, q) => (R.inBox(x, z) ? ss(1.2, 4, R.openDist(x, z)) * (1 - ss(0.25, 0.7, q.sl)) * 0.45 : 0) },     // (moss on the ledges of the red walls)
    ],
    grass: { amt: (x, z, q) => { if (!R.inBox(x, z)) return q.g; const od = R.openDist(x, z); return od < 1 ? 0.6 * (1 - pathK(x, z) * 0.85) : od > 9 ? 0.55 : q.g; }, tip: '#a6d86e', base: '#3f7a30', h: 0.78, k: 0.85 },
    trees: { add: pastTrees.concat(reeds, figs, crops, mesa) },
    water: { streams: [{ pts: RIVER, w: 2.2 }] },
    decals: FIELDS.map(F => ({ kind: 'furrows', x: F.x, z: F.z, rx: F.rx, rz: F.rz, rot: F.rot, box: true })),
    forms: [{ id: 'ruins.past.heapW', kind: 'heap', x: 137.6, z: -18.2, rx: 1.7, rz: 1.2, h: 0.85, col: '#8a6a4a', col2: '#7a5a3a', foot: '#6b5236', over: true },
      { id: 'ruins.past.heapE', kind: 'heap', x: 146.6, z: -18.6, rx: 1.5, rz: 1.1, h: 0.75, col: '#8a6a4a', col2: '#7a5a3a', foot: '#6b5236', over: true }],
    props: [hut, wheel, boat],
    keep: PAST_KEEP,
    looks: [
      { id: 'w.rup_river', at: { x: 138.0, z: 11.4 }, line: 'The {w.rup_river} runs clear and quick here, over round stones. Last night it was brown, and high enough to reach the {w.rup_palm:pl}.' },
      { id: 'w.rup_waterfall', at: { x: 147.6, z: -16.4 }, line: 'A {w.rup_waterfall} spills down the red rock into the canyon: that’s where the river starts. Today there’s only dry stone there.' },
      { id: 'w.rup_reed', at: { x: 141.8, z: 30.2 }, line: 'Green {w.rup_reed} on the bank, taller than you. Something splashes among them: a {w.rup_frog}.' },
      { id: 'w.rup_heron', at: { x: 140.8, z: 19.8 }, line: 'A {w.rup_heron} stands in the shallows on one leg, waiting for a {w.rup_fish}.' },
      { id: 'w.rup_field', at: { x: 128.8, z: 40.0 }, line: 'Little {w.rup_field:pl} by the cove: {w.rup_onion:pl} and beans in neat rows, and the {w.rup_waterwheel} bringing them the river’s water.' },
      { id: 'w.rup_waterwheel', at: { x: 145.4, z: 40.0 }, line: 'A wooden {w.rup_waterwheel} turns in the river, lifting water for the fields, bucket by bucket.' },
      { id: 'w.rup_date', at: { x: 130.0, z: 30.4 }, line: 'The {w.rup_palm:pl} are heavy with {w.rup_date:pl}. Here, everything is {w.rup_green}.' },
    ],
    lines: [{ who: 'past:farmer', T: PAST_LINES.farmer[0] }, { who: 'past:farmer', T: PAST_LINES.farmer[1] }, { who: 'past:fisher', T: PAST_LINES.fisher[0] }],
  });

  // ======================================================== tomorrow: the sea over the ruins
  // the boardwalks (decks over the flood: world.js platforms, seg with w and y, or box with top), drawn as planks on stilts below
  const SEG = (ax, az, bx, bz, w = 2.4) => ({ seg: [ax, az, bx, bz], w, y: [DY, DY] });
  const BOXD = (x0, x1, z0, z1) => ({ box: [x0, x1, z0, z1], top: DY });
  const DECKS = [
    BOXD(133.0, 141.6, 37.4, 44.0),          // the landing at the old gully's foot (the crack by the beach stands on it)
    SEG(141.0, 38.4, 145.2, 28.2),           // up the drowned gully
    BOXD(140.2, 150.4, 17.0, 27.4),          // the stilt camp
    SEG(141.0, 17.6, 140.0, 4.6),            // to the old town (the crack at the camp's edge stands on its landing)
    BOXD(137.6, 142.8, 8.6, 13.6),
    BOXD(124.4, 139.8, -3.6, 5.2),           // the old town, along the Wall of Days
    SEG(139.0, -3.2, 141.8, -16.2),          // to the temple
    BOXD(138.4, 145.6, -21.0, -15.2),        // the landing at the temple's half-drowned door
  ];
  // planks on stilts, a rope rail on posts (one prop; past.js's toon kit, merged with the land's props)
  const walks = { x: 141, z: 12, r: 0, build(k, KG) {
    const plank = (x0, z0, x1, z1, w) => {
      const l = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), n = Math.max(1, Math.round(l / 0.55)), ux = (x1 - x0) / l, uz = (z1 - z0) / l;
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; k.box(x, DY - 0.06, z, w, 0.1, l / n - 0.05, i % 3 ? '#9a7048' : '#8a6040', { ry, ink: 0.004 }); }
      for (let s = 0; s <= l; s += 2.4) for (const side of [-1, 1]) { const x = x0 + ux * s - uz * side * (w / 2 - 0.12), z = z0 + uz * s + ux * side * (w / 2 - 0.12); k.add(KG.cyl6, x, (DY + tA(x, z)) / 2 - 0.3, z, 0.09, DY - tA(x, z) + 0.6, 0.09, '#5a3a24', { ink: 0.004 }); }
    };
    const rect = (x0, x1, z0, z1) => {
      const nz = Math.max(1, Math.round((z1 - z0) / 0.6));
      for (let i = 0; i < nz; i++) { const z = z0 + (z1 - z0) * (i + 0.5) / nz; k.box((x0 + x1) / 2, DY - 0.06, z, x1 - x0, 0.1, (z1 - z0) / nz - 0.05, i % 3 ? '#9a7048' : '#8a6040', { ink: 0.004 }); }
      for (let x = x0 + 0.2; x <= x1; x += 2.6) for (let z = z0 + 0.2; z <= z1; z += 2.6) k.add(KG.cyl6, x, (DY + tA(x, z)) / 2 - 0.3, z, 0.1, DY - tA(x, z) + 0.6, 0.1, '#5a3a24', { ink: 0.004 });
    };
    for (const D of DECKS) { if (D.seg) plank(D.seg[0], D.seg[1], D.seg[2], D.seg[3], D.w); else rect(D.box[0], D.box[1], D.box[2], D.box[3]); }
  } };
  // the stilt camp: two tents on the deck, a rope rail round its sea side, buoys and a rowboat by the landing
  const camp = { x: 145.3, z: 22.2, r: 0, build(k, KG) {
    for (const [x, z, c] of [[148.4, 18.6, '#c9b07a'], [148.6, 25.4, '#bfae86']]) { k.add(PAST.API.KG.cone4, x, DY + 0.95, z, 1.5, 1.9, 1.35, c, { ry: Math.PI / 4, ink: 0.02 }); k.box(x - 1.0, DY + 0.5, z, 0.04, 1.0, 0.7, '#4a3a2a', { ink: 0 }); }
    for (let x = 140.4; x <= 150.4; x += 2.5) for (const z of [17.1, 27.3]) k.add(KG.cyl6, x, DY + 0.5, z, 0.06, 1.0, 0.06, '#5a3a24', { ink: 0 });
    for (const z of [17.1, 27.3]) k.box(145.3, DY + 0.95, z, 10.0, 0.05, 0.05, '#c9b48e', { ink: 0 });
    for (const [x, z, c] of [[134.2, 46.0, '#e2574c'], [138.8, 46.4, '#f4efe2'], [151.6, 30.4, '#e2574c'], [126.6, -5.0, '#f2c94c']]) k.add(KG.sphere, x, WY + 0.1, z, 0.35, 0.3, 0.35, c, { ink: 0.008 }).add(KG.cyl6, x, WY + 0.55, z, 0.04, 0.6, 0.04, '#5a3a24', { ink: 0 });
    k.box(133.6, WY + 0.15, 42.6, 1.1, 0.4, 2.8, '#7a8a9a', { ry: 0.2, ink: 0.012 }).box(133.6, WY + 0.37, 42.6, 1.15, 0.05, 2.85, '#e8e0cf', { ry: 0.2, ink: 0.004 });
    for (let i = 0; i < 3; i++) k.box(150.0 - i * 0.6, DY + 0.18, 20.6 + i * 0.5, 0.55, 0.36, 0.45, '#8a7a5a', { ry: i * 0.4, ink: 0.006 });
  } };
  const FUT_LINES = {
    tula: [L('When I was little, this was all sand. I dug for my jar right where the water is now. Hard to believe, isn’t it?', 'Cuando era pequeña, todo esto era arena. Busqué mi vasija justo donde ahora está el agua. Cuesta creerlo, ¿verdad?',
        'Quando eu era pequena, tudo isto era areia. Eu procurei o meu jarro bem onde agora está a água. Difícil de acreditar, né?', 'Als ich klein war, war hier überall Sand. Ich habe meinen Krug genau da gesucht, wo jetzt das Wasser ist. Kaum zu glauben, oder?',
        '[我|wǒ] [小|xiǎo] [时候|shí hou] ， [这里|zhè lǐ] [全|quán] [是|shì] [沙子|shā zi] 。 [我|wǒ] [就|jiù] [在|zài] [现在|xiàn zài] [有|yǒu] [水|shuǐ] [的|de] [地方|dì fang] [找|zhǎo] [过|guo] [我|wǒ] [的|de] [罐子|guàn zi] 。 [很|hěn] [难|nán] [相信|xiāng xìn] [吧|ba] ？',
        '[小|ちい]さい ころ 、 ここ は ぜんぶ [砂|すな] だった の 。 [今|いま] [水|みず] が ある ところ で 、 わたし の つぼ を [探|さが]した ん だ よ 。 [信|しん]じられない でしょう ？'),
      L('Every year the tide comes a little higher. Some days I think: when the water goes down, I’ll dig again. Some days I don’t think anything at all.', 'Cada año la marea sube un poco más. Algunos días pienso: cuando baje el agua, volveré a cavar. Otros días no pienso nada.',
        'Todo ano a maré sobe um pouco mais. Alguns dias eu penso: quando a água baixar, vou cavar de novo. Outros dias eu não penso em nada.', 'Jedes Jahr kommt die Flut ein bisschen höher. An manchen Tagen denke ich: Sobald das Wasser sinkt, grabe ich wieder. An anderen denke ich gar nichts.',
        '[潮水|cháo shuǐ] [一年|yī nián] [比|bǐ] [一年|yī nián] [高|gāo] 。 [有|yǒu] [的|de] [时候|shí hou] [我|wǒ] [想|xiǎng] ： [等|děng] [水|shuǐ] [退|tuì] [了|le] ， [我|wǒ] [就|jiù] [再|zài] [挖|wā] 。 [有|yǒu] [的|de] [时候|shí hou] [什么|shén me] [都|dōu] [不|bù] [想|xiǎng] 。',
        '[潮|しお] は [毎年|まいとし] 、 [少|すこ]し ずつ [高|たか]く なる 。 [水|みず] が [引|ひ]いたら 、 また [掘|ほ]ろう … と [思|おも]う [日|ひ] も ある し 、 [何|なに] も [考|かんが]えない [日|ひ] も ある 。')],
  };
  // what TIME.land lays over the canyon tomorrow (the sea, the decks, the stains)
  const ISLE = { x: 134.0, z: 9.2 };
  const islet = { x: ISLE.x, z: ISLE.z, r: 0, build(k, KG) {
    const x = ISLE.x, z = ISLE.z, y0 = tA(x, z);
    k.add(KG.sphere, x, y0 + 0.6, z, 4.3, Math.max(0.4, 2.95 - (y0 + 0.6)), 3.5, '#8a6a4a', { ink: 0.02 });       // (its earth, rising out of the sea: its top just under the grass)
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; k.add(KG.sphere, x + Math.cos(a) * 3.9, WY + 0.05, z + Math.sin(a) * 3.1, 0.7, 0.5, 0.6, ['#9a8a7a', '#8a7a6a', '#a89888'][i % 3], { ry: i, ink: 0.008 }); }
    k.add(KG.cyl, x, 3.0, z, 3.9, 0.12, 3.1, '#6aa84a', { ink: 0.012 });                                          // (a cap of grass, the island's top)
    // the spring's ring of stones, a young palm, Nadia's garden beds
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; k.add(KG.sphere, x - 1.4 + Math.cos(a) * 1.0, 3.12, z + 0.4 + Math.sin(a) * 1.0, 0.24, 0.16, 0.22, '#b8b0a0', { ink: 0.004 }); }
    const px = x + 1.6, pz = z - 0.8; for (let i = 0; i < 4; i++) k.add(KG.cyl6, px + i * 0.06, 3.1 + 0.35 + i * 0.7, pz, 0.12 - i * 0.015, 0.75, 0.12 - i * 0.015, '#9a7048', { ink: 0.004 });
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; k.add(KG.sphere, px + 0.24 + Math.cos(a) * 0.8, 6.0, pz + Math.sin(a) * 0.8, 0.95, 0.07, 0.24, i % 2 ? '#5fae4f' : '#4f9a45', { ry: -a, rz: 0.35, ink: 0.004 }); }
    for (let r = 0; r < 3; r++) { k.box(x + 0.6, 3.12, z + 1.3 - r * 0.0, 2.2, 0.12, 0.5, '#6b5236', { ry: 0.1, ink: 0.004 }); for (let i = 0; i < 6; i++) k.add(KG.cone, x - 0.3 + i * 0.36, 3.3, z + 1.25 + (r - 1) * 0.02, 0.08, 0.3, 0.08, i % 2 ? '#7cc85a' : '#5fae44', { ink: 0 }); }
    for (let i = 0; i < 8; i++) k.add(KG.ball6, x - 2.8 + i * 0.5, 3.12, z - 2.0 + (i % 2) * 0.3, 0.08, 0.08, 0.08, ['#ffd84a', '#ff8fb1', '#ffffff'][i % 3], { ink: 0 });
  } };
  LAND('ruins', 'future', {
    box: BOX, arena: 'flooded',
    ground: [
      { col: '#7f8a7a', map: '#9fb0b8', amt: (x, z) => floorK(x, z) * 0.7 },                                         // (the sea floor, seen through the water)
      { col: '#5a4a40', map: '#b08a6a', amt: (x, z, q) => (R.inBox(x, z) && R.openDist(x, z) > -0.5 ? ss(WY + 1.4, WY + 0.3, q.h) * ss(WY - 1.6, WY - 0.6, q.h) * 0.7 : 0) },     // (the walls dark and wet up to the tide)
      { col: '#4f6a5a', map: '#8aa090', amt: (x, z, q) => (R.inBox(x, z) && R.openDist(x, z) > -0.5 ? (1 - Math.abs(q.h - (WY + 0.25)) / 0.3) * 0.9 : 0) },               // (the waterline's green stain)
    ],
    grass: { amt: (x, z, q) => (R.inBox(x, z) && R.openDist(x, z) < 8 ? 0 : q.g * 0.4), tip: '#b8b08a', base: '#7a7458', h: 0.7, k: 1 },
    water: { flood: { area: (x, z) => R.inBox(x, z) && z < 73.5 && R.openDist(x, z) < 2.4, y: WY, decks: DECKS } },
    props: [walks, camp],
    looks: [
      { id: 'w.sea', at: { x: 139.8, z: 42.8 }, line: 'Where the beach was, the {w.sea} goes all the way up the canyon now. The old pier is somewhere under your feet, and a {w.ruf_shipwreck} beyond it.' },
      { id: 'w.ruf_tideline', at: { x: 125.6, z: 4.4 }, line: 'The Wall of Days is half under the {w.sea}. A green {w.ruf_tideline} runs across the {w.ruf_carving}, and {w.pf_barnacle:pl} on the bell keeper’s morning.' },
      { id: 'w.pb_seaweed', at: { x: 138.6, z: -9.8 }, line: '{w.pb_seaweed} sways round the old columns under the {w.ruf_boardwalk}. Little {w.crab:pl} climb up and down them, past {w.ruf_mussel:pl} and a {w.ruf_urchin}.' },
      { id: 'w.ruf_mangrove', at: { x: 142.6, z: 25.0 }, line: 'The oasis {w.rup_palm:pl} stand in the {w.sea} now, their trunks dark with salt, and a {w.ruf_mangrove} has rooted between them, its roots in the water.' },
      { id: 'w.lf_buoy', at: { x: 137.6, z: 43.4 }, line: 'A red {w.lf_buoy} rocks on the {w.pb_wave:pl}, tied to the old pier down below. A {w.ruf_pelican} sits on it, very serious.' },
      { id: 'w.pf_tide', at: { x: 144.6, z: -19.4 }, line: 'The temple’s door is half under the water. The {w.pf_tide} goes in and out of it, breathing.' },
    ],
    lines: [{ who: 'future:tula', T: FUT_LINES.tula[0] }, { who: 'future:tula', T: FUT_LINES.tula[1] }],
    heal: {
      when: () => !!TIME.flag('future', 'ruFree'),
      patch: { x: ISLE.x, z: ISLE.z, r: 6 },
      forms: [{ id: 'ruins.future.isle', kind: 'plate', x: ISLE.x, z: ISLE.z, rx: 3.9, rz: 3.1, y: 3.06, col: '#6aa84a', col2: '#5f9a42', over: true }],
      water: { pools: [{ x: ISLE.x - 1.4, z: ISLE.z + 0.4, r: 0.8, y: 3.14 }] },
      props: [islet],
      looks: [{ id: 'w.ruf_freshwater', at: { x: ISLE.x - 0.4, z: ISLE.z - 1.2 }, line: 'An {w.island} rose out of the gray water, green, and a {w.rup_spring} of {w.ruf_freshwater} bubbles up on it. Nadia’s seeds are already up.' }],
    },
  });
  // (the islet's own E and the decks are tested with TIME.land.check('ruins'); DECKS is shared with the Future's people and spots)
  RUINT.DECKS = DECKS; RUINT.RIVER = RIVER; RUINT.ISLE = ISLE;
})();
