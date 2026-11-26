'use strict';
// The Gray Marsh's two lands (TIME.land, time_land.js; DESIGN.md 21.1 "a clear lake village … a forest turned to stone"; game/TIME.md §25
// "The Gray Marsh (T4c)"). The terrain never changes: only what lies on it, and what marsh.js's own meshes look like.
//   Long ago (a long story with every past): the basin is a clear lake. marsh_past.js swaps today's dark water for clear water; here, the
//   bed shows sandy through it, the banks are green and grassy, today's dead willows have their leaves (marsh.js's willow mesh
//   recolored), the reeds are green, the huts' roofs fresh straw; weeping willows and reeds along the shores, water lilies and duckweed,
//   wildflowers; two swans, a heron in the shallows, carp under the clear water.
//   Tomorrow («si» + the imperfect subjunctive): the water gone, a forest turned to stone. A walkable dry bed of gray stone over the
//   whole basin (not under the boardwalk, the dock or the chapel's jetty: they stand over a dark channel), the banks gray rock, the
//   willows, the reeds, the boardwalk and the huts' wood petrified (recolored), the trees round the rim turned to stone trees, fossil
//   fish in the bed, the twins' punt stranded. Freed (mhFree): a pool by Candil's east shore, green reeds, lilies and a green willow.
// The words of the land are MHPTXT's and MHFTXT's (w.mhp_*, w.mhf_*); the land lines are here.
(() => {
  if (typeof TIME === 'undefined' || !TIME.land || typeof WORLD === 'undefined' || typeof MARSH === 'undefined' || typeof MARSHT === 'undefined' || !MARSHT) return;
  const LAND = TIME.land, MS = MARSH, M = MARSHT, L = M.L, tA = (x, z) => WORLD.terrainAt(x, z), W0 = WORLD.L.water;
  const ss = (a, b, x) => smoothstep(a, b, x);
  const BOX = { x0: -88, x1: 38, z0: -414, z1: -262 };
  const mg = () => (MS.built && MS.built.group) || null;
  // marsh.js's own colors (its reeds, its dead willows' trunks and gray moss, the huts' reed roofs and gray boards, the planks)
  const REED = ['#8a8a5a', '#7a7d52', '#9a9564'], MOSS = ['#8f9488'], TRUNK = ['#5a5048'], ROOF = ['#8a8259', '#7d7650'], BOARD = ['#8a8378'], WOOD = ['#6f5a46', '#7a6450', '#665241'], POST = ['#4a3a2e', '#5a4a3a'];
  // what must stay as it is: the people of both worlds, the cracks, the doors, the paths' middles, the Lantern House
  const P0 = (typeof MH_PAST !== 'undefined' && MH_PAST && MH_PAST.AT) || {};
  const F0 = typeof MH_FUT !== 'undefined' && MH_FUT ? Object.values(MH_FUT.AT).concat(Object.values(MH_FUT.AT_FREE)) : [];
  const KEEP = Object.values(P0).concat(F0).map(a => ({ x: a.x, z: a.z, r: 1.6 }))
    .concat(Object.values(TIME.CRACKS).filter(c => c.region === 'marsh').map(c => ({ x: c.x, z: c.z, r: 3.2 })))
    .concat([{ x: MS.LANTERN.x, z: MS.LANTERN.z, r: 3.6 }, { x: MS.CH_DOOR.x, z: MS.CH_DOOR.z, r: 2.4 }, { x: MS.SPOT.shrine.x, z: MS.SPOT.shrine.z, r: 1.6 }, { x: -18.6, z: -345.6, r: 2.4 }, { x: 9.4, z: -371.4, r: 1.8 }]);
  const near = (list, x, z, d) => list.some(p => Math.hypot(p.x - x, p.z - z) < (p.r || 0) + d);
  const onPath = (x, z, pad = 0) => MS.ROAD.near(x, z).d < 2.6 + pad || MS.CAUSE.near(x, z).d < 1.8 + pad || MS.TPATH.near(x, z).d < 2.4 + pad || (MS.bwInfo(x, z).d < 1.6 + pad && MS.bwInfo(x, z).t > 0 && MS.bwInfo(x, z).t < 1);
  const inCandil = (x, z, pad = 0) => Math.hypot(x - MS.CANDIL.x, z - MS.CANDIL.z) < MS.CANDIL.r + pad;
  const hutNear = (x, z, d) => MS.HUTS.some(b => Math.hypot(b.x - x, b.z - z) < Math.max(b.w, b.d) / 2 + d);
  const reach = (x, z) => M.inside(x, z);
  const Rg = rng(80817);

  // ======================================================== long ago: the clear lake
  const pastAdd = [];
  // weeping willows along the shores (on dry ground just above the water), reeds in the shallows, lilies and duckweed on open water
  for (let n = 0; n < 5000 && pastAdd.filter(a => a.kind === 'willow').length < 20; n++) {
    const x = lerp(-62, 26, Rg()), z = lerp(-292, -396, Rg()), h = tA(x, z);
    if (h < W0 + 0.08 || h > W0 + 0.8 || MS.basinDist(x, z) > 1 || onPath(x, z, 1.2) || near(KEEP, x, z, 1.6) || hutNear(x, z, 2.4) || near(pastAdd, x, z, 5.2)) continue;
    pastAdd.push({ x, z, kind: 'willow', s: 0.95 + Rg() * 0.35, seed: Rg(), r: 0 });
  }
  for (let n = 0; n < 6000 && pastAdd.filter(a => a.kind === 'reedGreen').length < 70; n++) {
    const x = lerp(-62, 26, Rg()), z = lerp(-292, -396, Rg()), h = tA(x, z);
    if (h > W0 + 0.05 || h < W0 - 0.5 || onPath(x, z, 0.8) || near(KEEP, x, z, 0.6)) continue;
    pastAdd.push({ x, z, kind: 'reedGreen', s: 0.8 + Rg() * 0.5, seed: Rg() });
  }
  for (let n = 0; n < 6000 && pastAdd.filter(a => a.kind === 'lily').length < 34; n++) {
    const x = lerp(-56, 22, Rg()), z = lerp(-298, -392, Rg()), h = tA(x, z);
    if (h > W0 - 0.35 || h < W0 - 1.4 || onPath(x, z, 1.4) || near(KEEP, x, z, 1.0) || near(pastAdd.filter(a => a.kind === 'lily'), x, z, 1.6)) continue;
    pastAdd.push({ x, z, kind: 'lily', s: 0.8 + Rg() * 0.5, seed: Rg(), y: W0 + 0.02 });
  }
  for (let n = 0; n < 4000 && pastAdd.filter(a => a.kind === 'flowers').length < 40; n++) {
    const x = lerp(-64, 30, Rg()), z = lerp(-268, -398, Rg()), h = tA(x, z);
    if (h < W0 + 0.15 || MS.basinDist(x, z) > 3 || onPath(x, z, 0.4) || near(KEEP, x, z, 0.8) || hutNear(x, z, 1.4)) continue;
    pastAdd.push({ x, z, kind: 'flowers', s: 0.8 + Rg() * 0.4, seed: Rg() });
  }
  // the lake's life: two swans, a heron in the shallows, carp under the clear water, a toad on a stone, irises at the reed bed
  const SWANS = { x: -34.0, z: -352.0 }, HERON = { x: -30.4, z: -321.6 }, CARP = [[-8.0, -312.0], [6.0, -318.6], [-28.0, -360.0]], TOAD = { x: -27.6, z: -322.4 }, IRIS = { x: -31.6, z: -340.2 };
  const swans = { x: SWANS.x, z: SWANS.z, r: 0, build(k, KG) {
    for (const [dx, dz, ry] of [[0, 0, 0.6], [-1.4, 1.5, 2.4]]) {
      const x = this.x + dx, z = this.z + dz, y = W0 + 0.02, c = Math.cos(ry), s = Math.sin(ry);
      k.add(KG.sphere, x, y + 0.18, z, 0.32, 0.2, 0.5, '#f8f8f4', { ry, ink: 0.008 }).rod([x + s * 0.32, y + 0.2, z + c * 0.32], [x + s * 0.38, y + 0.72, z + c * 0.38], 0.05, '#f8f8f4', 0.004)
        .add(KG.ball6, x + s * 0.42, y + 0.76, z + c * 0.42, 0.08, 0.07, 0.1, '#f8f8f4', { ink: 0.004 }).add(KG.cone, x + s * 0.53, y + 0.74, z + c * 0.53, 0.03, 0.1, 0.03, '#e8823a', { rx: Math.PI / 2, ry, ink: 0 });
    }
  } };
  const heron = { x: HERON.x, z: HERON.z, r: 0, build(k, KG) {
    const x = this.x, z = this.z, y = Math.max(tA(x, z), W0 - 0.4);
    for (const s of [-1, 1]) k.rod([x + s * 0.08, y, z], [x + s * 0.06, W0 + 0.75, z], 0.025, '#c9a24a', 0);
    k.add(KG.sphere, x, W0 + 1.05, z, 0.26, 0.32, 0.5, '#b8c4cc', { rx: -0.3, ink: 0.008 }).rod([x, W0 + 1.2, z + 0.3], [x, W0 + 1.7, z + 0.42], 0.05, '#c8d2d8', 0.004);
    k.add(KG.ball6, x, W0 + 1.76, z + 0.46, 0.09, 0.08, 0.12, '#e8eef0', { ink: 0.004 }).add(KG.cone, x, W0 + 1.74, z + 0.68, 0.03, 0.28, 0.03, '#e8a03a', { rx: Math.PI / 2, ink: 0 });
  } };
  const carp = { x: CARP[0][0], z: CARP[0][1], r: 0, build(k, KG) {
    CARP.forEach(([x, z], i) => { const y = Math.max(tA(x, z) + 0.15, W0 - 0.55), ry = i * 1.9; k.add(KG.sphere, x, y, z, 0.16, 0.12, 0.42, i % 2 ? '#e8823a' : '#f2c94c', { ry, ink: 0 }).add(KG.cone, x - Math.sin(ry) * 0.42, y, z - Math.cos(ry) * 0.42, 0.14, 0.22, 0.04, '#e8823a', { rx: -Math.PI / 2, ry, ink: 0 }); });
  } };
  const toad = { x: TOAD.x, z: TOAD.z, r: 0.3, build(k, KG, y) {
    const x = this.x, z = this.z;
    k.add(KG.sphere, x, y + 0.12, z, 0.34, 0.24, 0.3, '#9a958c', { ink: 0.008 }).add(KG.sphere, x + 0.05, y + 0.36, z, 0.2, 0.14, 0.18, '#7a8a4a', { ink: 0.006 });
    for (const s of [-1, 1]) k.add(KG.ball6, x + 0.13, y + 0.45, z + s * 0.08, 0.04, 0.04, 0.04, '#f2c94c', { ink: 0 });
  } };
  const iris = { x: IRIS.x, z: IRIS.z, r: 0, build(k, KG, y) {
    for (let i = 0; i < 7; i++) { const a = i * 0.9, x = this.x + Math.cos(a) * 0.5, z = this.z + Math.sin(a) * 0.5, yy = Math.max(tA(x, z), W0); k.add(KG.cyl6, x, yy + 0.35, z, 0.02, 0.7, 0.02, '#4f8a3e', { ink: 0 }).add(KG.sphere, x, yy + 0.72, z, 0.08, 0.1, 0.08, i % 2 ? '#6a5ac8' : '#f2c94c', { ink: 0 }); }
  } };
  const PLOOK = { reedbed: { x: -25.6, z: -320.6 }, weeping: { x: 6.4, z: -310.6 }, clear: { x: 2.4, z: -309.8 }, wild: { x: 12.2, z: -296.0 }, cricket: { x: 14.6, z: -289.6 }, duck: { x: -27.4, z: -338.6 }, shore: { x: -1.0, z: -346.4 }, morning: { x: 9.6, z: -306.8 } };
  const PAST_LINES = {
    ferry: L('My father used to say this water came down from the mountain, so clear you could count the {w.mhp_carp} on the bottom. Last night, for the first time, I couldn’t see the bottom.',
      'Mi padre decía que esta agua bajaba de la montaña, tan clara que se contaban las carpas en el fondo. Anoche, por primera vez, no vi el fondo.',
      'O meu pai dizia que esta água descia da montanha, tão limpa que dava para contar as carpas no fundo. Ontem à noite, pela primeira vez, não vi o fundo.',
      'Mein Vater sagte immer, dieses Wasser komme vom Berg, so klar, dass man die Karpfen am Grund zählen könne. Gestern Abend sah ich zum ersten Mal den Grund nicht.',
      '[我|wǒ] [爸爸|bà ba] [以前|yǐ qián] [常|cháng] [说|shuō] ， [这|zhè] [湖水|hú shuǐ] [是|shì] [从|cóng] [山上|shān shàng] [流|liú] [下来|xià lai] [的|de] ， [清|qīng] [得|de] [能|néng] [数|shǔ] [清|qīng] [湖底|hú dǐ] [的|de] [鲤鱼|lǐ yú] 。 [昨天|zuó tiān] [晚上|wǎn shang] ， [我|wǒ] [第一次|dì yī cì] [看不见|kàn bu jiàn] [湖底|hú dǐ] 。',
      '[父|ちち] は よく 、 この [水|みず] は [山|やま] から [流|なが]れて くる 、 [底|そこ] の [鯉|こい] が [数|かぞ]えられる くらい きれい だ と [言|い]って いた 。 ゆうべ 、 はじめて [底|そこ] が [見|み]えなかった 。'),
    nieves: L('When I was little, the {w.mhp_weepingwillow:pl} already reached down to the water. We used to hide under them while the grown-ups lit the lanterns.',
      'Cuando yo era pequeña, los sauces llorones ya llegaban hasta el agua. Nos escondíamos debajo mientras los mayores encendían los faroles.',
      'Quando eu era pequena, os chorões já chegavam até a água. A gente se escondia debaixo deles enquanto os adultos acendiam as lanternas.',
      'Als ich klein war, reichten die Trauerweiden schon bis ans Wasser. Wir versteckten uns darunter, während die Großen die Laternen anzündeten.',
      '[我|wǒ] [小时候|xiǎo shí hou] ， [垂柳|chuí liǔ] [就|jiù] [已经|yǐ jīng] [垂|chuí] [到|dào] [水面|shuǐ miàn] [了|le] 。 [大人|dà rén] [点|diǎn] [灯笼|dēng long] [的|de] [时候|shí hou] ， [我们|wǒ men] [就|jiù] [躲|duǒ] [在|zài] [树|shù] [下|xià] 。',
      '[小|ちい]さい ころ 、 シダレヤナギ は もう [水|みず] まで [届|とど]いて いた 。 [大人|おとな] たち が [灯籠|とうろう] に [火|ひ] を ともして いる [間|あいだ] 、 わたし たち は その [下|した] に かくれて いた 。'),
  };
  LAND('marsh', 'past', {
    box: BOX, arena: 'lanternlake',
    ground: [
      // (the banks, green; the paths stay pale)
      { col: '#6a9a4a', map: '#97c46a', amt: (x, z, q) => (MS.basinDist(x, z) < 3 && q.h > W0 + 0.06 ? (1 - q.p * 0.8) * 0.85 : 0) },
      // (the lake's bed, seen through the clear water: pale sand in the shallows, darker green where it's deep)
      { col: '#c4b48a', map: '#8fc8d8', amt: (x, z, q) => (q.h < W0 && MS.basinDist(x, z) < 2 ? ss(W0, W0 - 0.3, q.h) * (1 - ss(W0 - 0.9, W0 - 1.5, q.h)) * 0.9 : 0) },
      { col: '#5f8a76', map: '#5fa8c4', amt: (x, z, q) => (q.h < W0 - 0.9 && MS.basinDist(x, z) < 2 ? ss(W0 - 0.9, W0 - 1.5, q.h) * 0.85 : 0) },
    ],
    grass: { amt: (x, z, q) => (MS.basinDist(x, z) < 3 && q.h > W0 + 0.1 ? 0.75 * (1 - q.p * 0.85) : q.g), tip: '#a6d86e', base: '#3f7a30', h: 0.82, k: 0.85 },
    trees: { add: pastAdd },
    leaves: [
      { obj: mg, from: REED, to: '#6f9a4a' }, { obj: mg, from: MOSS, to: '#7cb85a' }, { obj: mg, from: TRUNK, to: '#6b5236' },
      { obj: mg, from: ROOF, to: '#c9a24a' }, { obj: mg, from: BOARD, to: '#a8906a' },
    ],
    props: [swans, heron, carp, toad, iris],
    keep: KEEP,
    looks: [
      { id: 'w.mhp_reedbed', at: PLOOK.reedbed, line: 'A green {w.mhp_reedbed} by the shore, taller than you. Something rustles in it: a {w.rup_heron}, standing on one leg.' },
      { id: 'w.mhp_weepingwillow', at: PLOOK.weeping, line: 'A {w.mhp_weepingwillow} leans over the water, every {w.mhp_willowbranch} down to the surface. Its leaves draw lines in the {w.lf_lake}.' },
      { id: 'w.mhp_transparent', at: PLOOK.clear, line: 'The water is so {w.mhp_transparent} you can see the stones on the bottom, and a {w.mhp_carp} gliding over them, orange and slow.' },
      { id: 'w.mhp_wildflower', at: PLOOK.wild, line: '{w.mhp_wildflower:pl} all along the road down to the lake: yellow, white, blue {w.mhp_iris:pl} at the water’s edge.' },
      { id: 'w.mhp_cricket', at: PLOOK.cricket, line: 'The {w.mhp_cricket:pl} are still singing in the grass, as if nothing happened last night.' },
      { id: 'w.mhp_duckweed', at: PLOOK.duck, line: 'Green {w.mhp_duckweed} round the twins’ dock, and a {w.mhp_toad} on a stone, very sure of itself.' },
      { id: 'w.mhp_lakeshore', at: PLOOK.shore, line: 'From the {w.mhp_lakeshore} you can see the whole {w.lf_lake}: Candil on its island, the chapel at the end of the causeway… and a ribbon of gray going up toward the tower.' },
      { id: 'w.mhp_morninglight', at: PLOOK.morning, line: 'The {w.mhp_morninglight} on the water, and two {w.tf_lk_swan:pl} out on the {w.lf_lake}. Everything is beautiful. Only the gray ribbon doesn’t move.' },
    ],
    lines: [{ who: 'past:ferry', T: PAST_LINES.ferry }, { who: 'past:nieves', T: PAST_LINES.nieves }],
  });

  // ======================================================== tomorrow: a forest turned to stone
  // the bed: the whole basin under today's water, but not under the boardwalk, the dock or the chapel's jetty (a dark channel stays
  // there, so you can't walk under the planks); its height as time_land.js lays it (a skim near the shore, 0.2 over the deep bed)
  const LEVEL = -3.0, DEEP = W0 - 0.6;
  const bedY = (x, z) => { const h = tA(x, z); return h + lerp(0.03, 0.22, ss(DEEP + 0.22, DEEP - 0.04, h)); };
  const DOCK = { a: { x: -25.4, z: -333.8 }, b: { x: -32.0, z: -333.2 } };
  const segD = (x, z, a, b) => { const dx = b.x - a.x, dz = b.z - a.z, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz), 0, 1); return Math.hypot(x - a.x - dx * t, z - a.z - dz * t); };
  const JET = () => { const a = MS.CAUSE.at(MS.CAUSE.len); return { a: { x: a.x, z: a.z }, b: { x: MS.CH_DOOR.x, z: MS.CH_DOOR.z } }; };
  const bedArea = (x, z) => {
    const bw = MS.bwInfo(x, z); if (bw.d < 1.9 && bw.t > 0.02 && bw.t < 0.98) return false;
    if (segD(x, z, DOCK.a, DOCK.b) < 1.6) return false;
    const J = JET(); if (segD(x, z, J.a, J.b) < 1.6) return false;
    return MS.basinDist(x, z) < 2 && z < -294;
  };
  const futAdd = [];
  // stone trees on the banks (the willows' places and a few more), boulders, stone reeds at the old shoreline
  for (let n = 0; n < 5000 && futAdd.filter(a => a.kind === 'stone').length < 22; n++) {
    const x = lerp(-64, 28, Rg()), z = lerp(-290, -398, Rg()), h = tA(x, z);
    if (h < W0 + 0.1 || MS.basinDist(x, z) > 3 || onPath(x, z, 1.2) || near(KEEP, x, z, 1.8) || hutNear(x, z, 2.6) || inCandil(x, z, -1) || near(futAdd, x, z, 5)) continue;
    futAdd.push({ x, z, kind: 'stone', s: 0.9 + Rg() * 0.4, seed: Rg() });
  }
  for (let n = 0; n < 3000 && futAdd.filter(a => a.kind === 'boulder').length < 9; n++) {
    const x = lerp(-60, 24, Rg()), z = lerp(-298, -394, Rg()), h = tA(x, z);
    if (h < W0 + 0.1 || MS.basinDist(x, z) > 2 || onPath(x, z, 1.6) || near(KEEP, x, z, 2.2) || hutNear(x, z, 2.6) || inCandil(x, z, 0) || near(futAdd, x, z, 4)) continue;
    futAdd.push({ x, z, kind: 'boulder', s: 0.7 + Rg() * 0.5, seed: Rg() });
  }
  // the twins' punt stranded on the bed by the dock, fossil fish lying in the bed, stone stumps, the tide of dust against the huts
  const PUNT = { x: -29.0, z: -336.2 }, FOSSILS = [[-6.4, -314.8, 0.4], [9.0, -322.0, 2.2], [-34.0, -350.6, 1.1]];
  const punt = { x: PUNT.x, z: PUNT.z, r: 1.2, build(k, KG) {
    const x = this.x, z = this.z, y = bedY(x, z), ry = 1.4;
    k.box(x, y + 0.2, z, 1.3, 0.3, 3.6, '#8d8a84', { ry, rz: 0.1, ink: 0.02 }).box(x, y + 0.38, z, 1.18, 0.08, 3.4, '#7d7a74', { ry, rz: 0.1, ink: 0 });
    for (const s of [-1, 1]) k.box(x + Math.cos(ry) * s * 0.62, y + 0.46, z - Math.sin(ry) * s * 0.62, 0.1, 0.3, 3.5, '#9a968e', { ry, ink: 0.01 });
    k.rod([x - 0.3, y + 0.4, z + 0.4], [x + 1.6, y + 0.15, z - 1.2], 0.04, '#8a8780', 0.004);
  } };
  const fossils = { x: FOSSILS[0][0], z: FOSSILS[0][1], r: 0, build(k, KG) {
    FOSSILS.forEach(([x, z, ry]) => {
      const y = bedY(x, z) + 0.02, c = Math.cos(ry), s = Math.sin(ry);
      k.add(KG.sphere, x, y, z, 0.42, 0.05, 1.1, '#b8b4aa', { ry, ink: 0.006 });
      for (let i = -3; i <= 3; i++) { const px = x + s * i * 0.22, pz = z + c * i * 0.22; k.box(px, y + 0.04, pz, 0.62 - Math.abs(i) * 0.06, 0.03, 0.04, '#8a8680', { ry, ink: 0 }); }
      k.add(KG.cone, x + s * 1.1, y + 0.03, z + c * 1.1, 0.3, 0.4, 0.04, '#a8a49a', { rx: Math.PI / 2, ry, ink: 0 });
    });
  } };
  const stumps = { x: -14, z: -350, r: 0, build(k, KG) {
    for (const [x, z, h] of [[-40.6, -358.0, 0.9], [4.6, -350.0, 1.2], [-48.2, -366.4, 0.7], [16.0, -304.6, 1.0]]) { const y = tA(x, z); k.add(KG.cyl6, x, y + h / 2, z, 0.34, h, 0.34, '#8d8a84', { ink: 0.012 }).add(KG.cyl6, x, y + h + 0.02, z, 0.3, 0.04, 0.3, '#a8a49c', { ink: 0 }); }
  } };
  const FLOOK = { fossil: { x: -5.0, z: -313.2 }, crust: { x: 2.6, z: -317.8 }, petrified: { x: 12.6, z: -298.6 }, punt: { x: -26.8, z: -336.0 }, reeds: { x: -24.8, z: -320.6 }, basin: { x: -0.6, z: -346.6 }, quiet: { x: 8.8, z: -306.0 },
    fissure: { x: -12.6, z: -316.4 }, gravel: { x: 14.6, z: -309.8 }, sediment: { x: -31.6, z: -352.4 }, quartz: { x: -6.0, z: -356.0 } };
  const FUT_LINES = {
    lucero: L('If the water came back, the willows would turn green again. I say it to them every night. Stone doesn’t answer.',
      'Si volviera el agua, los sauces se pondrían verdes otra vez. Se lo digo cada noche. La piedra no contesta.',
      'Se a água voltasse, os salgueiros ficariam verdes de novo. Eu digo isso a eles toda noite. A pedra não responde.',
      'Wenn das Wasser zurückkäme, würden die Weiden wieder grün werden. Ich sage es ihnen jede Nacht. Der Stein antwortet nicht.',
      '[要是|yào shi] [水|shuǐ] [回来|huí lai] [了|le] ， [柳树|liǔ shù] [就|jiù] [会|huì] [重新|chóng xīn] [变|biàn] [绿|lǜ] 。 [我|wǒ] [每天|měi tiān] [晚上|wǎn shang] [都|dōu] [对|duì] [它们|tā men] [说|shuō] 。 [石头|shí tou] [不|bù] [回答|huí dá] 。',
      'もし [水|みず] が [戻|もど]って きたら 、 [柳|やなぎ] は また [緑|みどり] に なる でしょう 。 [毎晩|まいばん] そう [言|い]って いる の 。 [石|いし] は [答|こた]えない けど 。'),
  };
  LAND('marsh', 'future', {
    box: BOX, arena: 'stonewood',
    ground: [
      { col: '#8d8a84', map: '#b4b0a8', amt: (x, z, q) => (MS.basinDist(x, z) < 4 ? (1 - q.p * 0.5) * 0.85 : 0) },
      { col: '#7a7770', map: '#a8a49c', amt: (x, z, q) => (MS.basinDist(x, z) < 4 && q.sl > 0.3 ? 0.5 : 0) },
    ],
    grass: { amt: (x, z, q) => (MS.basinDist(x, z) < 6 ? 0 : q.g * 0.25), tip: '#a8a6a0', base: '#6d6a64', h: 0.5, k: 1 },
    trees: { swap: t => 'stone', add: futAdd },
    leaves: [
      { obj: mg, from: REED, to: '#9a978f' }, { obj: mg, from: MOSS, to: '#a8a59e' }, { obj: mg, from: TRUNK, to: '#7d7a74' },
      { obj: mg, from: ROOF, to: '#8a8780' }, { obj: mg, from: BOARD, to: '#8f8c86' }, { obj: mg, from: WOOD, to: '#8d8a84' }, { obj: mg, from: POST, to: '#6f6c66' },
    ],
    water: { bed: { level: LEVEL, area: bedArea, tex: 'salt', col: '#a8a49c', map: '#c4c0b8' } },
    props: [punt, fossils, stumps],
    keep: KEEP.concat([{ x: PUNT.x, z: PUNT.z, r: 1.6 }]),
    looks: [
      { id: 'w.mhf_fossil', at: FLOOK.fossil, line: 'A {w.mhf_fossil} in the dry bed: a fish turned to stone, its whole {w.mhf_skeleton}, every little bone. It was swimming here once.' },
      { id: 'w.mhf_crust', at: FLOOK.crust, line: 'Where the black water was, the {w.mhf_lakebed} is a gray {w.mhf_crust} of stone, cracked like an old plate. It rings under your feet.' },
      { id: 'w.mhf_fissure', at: FLOOK.fissure, line: 'A long {w.mhf_fissure} across the dry bed. Down in it, nothing: no water, no frog, not even an echo.' },
      { id: 'w.mhf_gravel', at: FLOOK.gravel, line: 'Gray {w.mhf_gravel} where the shore used to be, every stone the same color as the next.' },
      { id: 'w.mhf_sediment', at: FLOOK.sediment, line: 'Layers of {w.mhf_sediment} in the bank, one on top of the other, like the pages of a closed book.' },
      { id: 'w.mhf_quartz', at: FLOOK.quartz, line: 'A piece of {w.mhf_quartz} in the stone, the only thing that still shines… a little.' },
      { id: 'w.mhf_petrified', at: FLOOK.petrified, line: 'The trees round the marsh are {w.mhf_petrified}: stone trunks, stone branches, stone {w.ml_moss}. Not one bird.' },
      { id: 'w.mhp_punt', at: FLOOK.punt, line: 'The twins’ {w.mhp_punt}, stranded on the stone where the water used to be. Its pole has turned to stone too.' },
      { id: 'w.mhf_stonereed', at: FLOOK.reeds, line: '{w.mhf_stonereed:pl} at the old shoreline: every stalk gray and hard. When the wind blows, they don’t move.' },
      { id: 'w.mhf_basin', at: FLOOK.basin, line: 'The whole {w.mhf_basin}, dry and gray, from the road down to the chapel. Not a sound in it.' },
      { id: 'w.mhf_stillness', at: FLOOK.quiet, line: 'The {w.mhf_stillness} is the worst part. Nothing moves here: no water, no leaves, no wings.' },
    ],
    lines: [{ who: 'future:lucero', T: FUT_LINES.lucero }],
    heal: {
      when: () => !!TIME.flag('future', 'mhFree'),
      patch: { x: 2.6, z: -334.8, r: 6.5 },
      ground: [{ col: '#5f9a46', map: '#9fc86a', heal: true, amt: (x, z) => 1 - ss(4.5, 6.5, Math.hypot(x - 2.6, z + 334.8)) }],
      water: { pools: [{ x: 3.2, z: -335.0, r: 3.0, y: bedY(3.2, -335.0) + 0.12 }] },
      trees: { add: [{ x: -1.6, z: -338.6, kind: 'willow', s: 1.1 }].concat(Array.from({ length: 12 }, (_, i) => { const a = i / 12 * TAU; return { x: 3.2 + Math.cos(a) * 3.4, z: -335.0 + Math.sin(a) * 3.4, kind: 'reedGreen', s: 0.9 + (i % 3) * 0.12 }; }), [{ x: 2.2, z: -334.0, kind: 'lily', s: 1, y: bedY(3.2, -335.0) + 0.14 }, { x: 4.4, z: -336.0, kind: 'lily', s: 0.9, y: bedY(3.2, -335.0) + 0.14 }]) },
      looks: [{ id: 'w.rup_spring', at: { x: -0.8, z: -333.4 }, line: 'Water! A {w.rup_spring} came up through the stone by the jetty. Green {w.mhp_reedbed} round it already, and a {w.tf_gd_willow} with leaves.' },
        { id: 'w.mhf_ripple', at: { x: 3.4, z: -339.2 }, line: 'A little {w.mhf_pond} where the stone was. When the wind blows, {w.mhf_ripple:pl} run across it. Something is moving again.' }],
    },
  });
  M.LAND = { BOX, bedArea, bedY, PUNT, FOSSILS, PLOOK, FLOOK };
})();
