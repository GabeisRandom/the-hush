'use strict';
// The great greenhouse, inside, in both other worlds (DESIGN.md 20 "T3a"): four glass halls at y 300 on MOLMILL's room kit
// (molinar_past_mill.js), reskinned here as a glasshouse (GDKIT.glassShell: the kit's plaster walls become glass panes in white frames,
// its plank floor terracotta tiles, its windows and beams hidden; the kit's trapdoor and ladder are hidden too, and a glass door in the
// back wall swings open instead, with a «Next hall» arrow). The kit itself is untouched.
//   GDKIT: glassShell, grayMat (a material that drains to gray: uGray 1 → 0 as a hall remembers its color), planters, palms, ferns,
//   the fountain, the pond, the back door, the hedge animals (tomorrow)
//   GD_PHOUSE (this file): the new greenhouse, long ago. Rooms at z −180, x −430 / −404 / −378 / −352. Young Melisa sneaks in after you
//   and shows how each hall was (a demonstration); you describe it, and its color comes back.
//     0 the Fountain Hall: «Aquí había una fuente» (the water and the stone fish come back); a gray vine up to the next door's latch:
//       «{mimo} trepó por la enredadera»
//     1 the Butterfly House: an ambush of gray moths (the Past's tense), then «El cuarto estaba lleno de mariposas»
//     2 the Lily Pond: no way across: «Aquí había un puente de madera»; something red on a lily pad: «{mimo} saltó al nenúfar» (the
//       boy's red cap)
//     3 the Dome: the Faded Bloom (gardens_time_boss.js), Elio's echo, Melisa keeps the cap; outside, the gardener sees the color back
//   GD_FHOUSE (gardens_future_dungeon.js): the greenhouse tomorrow.
const GDKIT = (() => {
  if (typeof MOLMILL === 'undefined') return null;
  const HW = MOLMILL.HW, HD = MOLMILL.HD, WH = MOLMILL.WH;
  const PAL = {
    past: { glass: '#cfeee6', frame: '#f6f3ea', tile: ['#c9774f', '#b86a46', '#d0845a'], grout: '#8a4f34', leaf: ['#4f9a45', '#5fae4f', '#478c3e'], trunk: '#8a6440', soil: '#5a3a26', fog: '#e6efdc' },
    future: { glass: '#8f9a9e', frame: '#a8a6ae', tile: ['#7a6a62', '#6f625c', '#837268'], grout: '#4a4044', leaf: ['#7d8a6a', '#6d7a5e', '#8a9278'], trunk: '#6b6560', soil: '#3e3834', fog: '#5e6068' },
  };
  const MAT = {};
  function tileMat(kind) {
    const key = 'tile' + kind; if (MAT[key]) return MAT[key];
    const P = PAL[kind], t = TK.canvasTex(256, 256, c => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = P.tile[(x * 3 + y * 5) % 3]; c.fillRect(x * 32, y * 32, 32, 32); } c.strokeStyle = P.grout; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, 256); c.stroke(); c.beginPath(); c.moveTo(0, i * 32); c.lineTo(256, i * 32); c.stroke(); } });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3.5, 3);
    return (MAT[key] = new THREE.MeshToonMaterial({ map: t, gradientMap: TK.grad }));
  }
  function glassMat(kind) {
    const key = 'glass' + kind; if (MAT[key]) return MAT[key];
    return (MAT[key] = new THREE.MeshToonMaterial({ color: PAL[kind].glass, gradientMap: TK.grad, transparent: true, opacity: kind === 'past' ? 0.42 : 0.7, depthWrite: false, side: THREE.DoubleSide }));
  }
  // a vertex-colored toon material that can drain to gray (uGray 1) and fill back with color (uGray 0)
  function grayMat(start = 1) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad }), u = { uGray: { value: start } };
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = u.uGray;
      sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.86, l * 0.92), uGray); }');
    };
    m.customProgramCacheKey = () => 'gdGray';
    return { m, u };
  }
  // the kit's room, as a glass hall: its walls glass, its floor tiles, its windows, beams and ink hidden; white frames up the walls
  function glassShell(room, api, kind, k) {
    for (const m of room.g.children.slice()) {
      if (!m.isMesh || !m.geometry) continue;
      const ty = m.geometry.type, p = m.geometry.parameters || {};
      if (ty === 'BoxGeometry') { m.material = tileMat(kind); continue; }
      if (ty === 'PlaneGeometry' && Math.abs(p.height - WH) < 0.01) { m.material = glassMat(kind); m.renderOrder = 2; continue; }
      if (ty === 'PlaneGeometry' && Math.abs(p.width - 2.2) < 0.01 && Math.abs(p.height - 1.2) < 0.01) continue;      // (the way out)
      m.visible = false;
    }
    if (!k) return;
    const R = room.R, Y0 = api.Y0, P = PAL[kind];
    for (let x = -HW; x <= HW + 0.01; x += 1.75) k.box(R.x + x, Y0 + WH / 2, R.z - HD + 0.05, 0.09, WH, 0.09, P.frame, { ink: 0 });
    for (let z = -HD; z <= HD - 1.2; z += 1.5) for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.05), Y0 + WH / 2, R.z + z, 0.09, WH, 0.09, P.frame, { ink: 0 });
    for (const yy of [1.2, 3.4, WH - 0.05]) { k.box(R.x, Y0 + yy, R.z - HD + 0.05, HW * 2, 0.08, 0.08, P.frame, { ink: 0 }); for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.05), Y0 + yy, R.z, 0.08, 0.08, HD * 2, P.frame, { ink: 0 }); }
    // the low brick plinth all round (the glass stands on it)
    k.box(R.x, Y0 + 0.25, R.z - HD + 0.15, HW * 2, 0.5, 0.3, '#b9ab94', { ink: 0.006 });
    for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.15), Y0 + 0.25, R.z, 0.3, 0.5, HD * 2, '#b9ab94', { ink: 0.006 });
  }
  // greenery along the walls (built on the room's gray-able material): planters with flowers, palms in the corners, ferns
  function planters(room, api, kind, pk, o = {}) {
    const R = room.R, Y0 = api.Y0, P = PAL[kind], KG = PAST.API.KG, rn = (() => { let q = 7 + room.i * 13; return () => ((q = (q * 16807) % 2147483647) / 2147483647); })();
    const dead = kind === 'future';
    for (const s of [-1, 1]) {
      pk.box(R.x + s * (HW - 0.9), Y0 + 0.35, R.z - 0.6, 1.1, 0.7, HD * 2 - 3.6, '#a8703f', { ink: 0.01 }).box(R.x + s * (HW - 0.9), Y0 + 0.71, R.z - 0.6, 1.0, 0.04, HD * 2 - 3.8, P.soil, { ink: 0 });
      for (let j = 0; j < 7; j++) {
        const x = R.x + s * (HW - 0.9) + (rn() - 0.5) * 0.5, z = R.z - HD + 2.2 + j * 1.15;
        if (dead) { pk.rod([x, Y0 + 0.72, z], [x + (rn() - 0.5) * 0.3, Y0 + 1.2 + rn() * 0.4, z], 0.02, '#7a7060', 0); continue; }
        pk.add(TK.G.ico1, x, Y0 + 1.0 + rn() * 0.2, z, 0.35, 0.3, 0.35, P.leaf[j % 3], { ry: rn() * 6, ink: 0.008 });
        if (!o.noFlowers) for (let f = 0; f < 3; f++) pk.add(KG.ball6, x + (rn() - 0.5) * 0.5, Y0 + 1.25 + rn() * 0.2, z + (rn() - 0.5) * 0.5, 0.08, 0.08, 0.08, ['#d9434f', '#f2c94c', '#ff8fb1', '#9b7fd0', '#f4efe2'][(j + f) % 5], { ink: 0 });
      }
    }
    // palms in the back corners, ferns at their feet
    for (const s of [-1, 1]) {
      const x = R.x + s * (HW - 1.2), z = R.z - HD + 1.2;
      pk.add(KG.cyl, x, Y0 + 0.3, z, 0.55, 0.6, 0.55, '#c9643f', { ink: 0.008 });
      for (let j = 0; j < 7; j++) pk.add(KG.cyl6, x + Math.sin(j) * 0.05, Y0 + 0.6 + j * 0.42, z, 0.12 - j * 0.008, 0.44, 0.12 - j * 0.008, P.trunk, { ry: j, ink: 0.004 });
      for (let j = 0; j < 7; j++) { const a = (j / 7) * TAU; pk.add(KG.sphere, x + Math.cos(a) * 0.9, Y0 + 3.6 - (dead ? 0.5 : 0), z + Math.sin(a) * 0.9, 1.0, 0.07, 0.24, dead ? '#8a8270' : P.leaf[j % 3], { ry: -a, rz: dead ? 0.8 : 0.25, ink: 0.006 }); }
      for (let j = 0; j < 4; j++) { const a = j * 1.6; pk.add(KG.sphere, x + Math.cos(a) * 0.9, Y0 + 0.35, z + Math.sin(a) * 0.6, 0.5, 0.1, 0.16, dead ? '#7d8a6a' : P.leaf[(j + 1) % 3], { ry: a, rz: 0.4, ink: 0.004 }); }
    }
  }
  // the glass door in the back wall that opens when a hall is done (the kit's ladder stays hidden), and its «Next hall» arrow
  let ARROW = null;
  function arrowTex() {
    if (ARROW) return ARROW;
    ARROW = TK.canvasTex(128, 160, c => {
      c.lineJoin = 'round';
      const path = () => { c.beginPath(); c.moveTo(64, 10); c.lineTo(118, 70); c.lineTo(86, 70); c.lineTo(86, 112); c.lineTo(42, 112); c.lineTo(42, 70); c.lineTo(10, 70); c.closePath(); };
      path(); c.lineWidth = 14; c.strokeStyle = '#2b2235'; c.stroke(); c.fillStyle = '#9ff5b8'; c.fill();
      c.font = '900 30px "Trebuchet MS", sans-serif'; c.textAlign = 'center'; c.lineWidth = 8; c.strokeText('Next', 64, 148); c.fillStyle = '#fffaf0'; c.fillText('Next', 64, 148);
    });
    return ARROW;
  }
  function backDoor(room, api, kind) {
    const w = room.way; if (!w) return null;
    const P = PAL[kind], g = new THREE.Group(), k = PAST.API.Kit(), x = w.x, z = room.R.z - HD + 0.08;
    g.position.set(x - 0.8, api.Y0, z); room.g.add(g);
    k.box(0.8, 1.3, 0, 1.6, 2.6, 0.05, P.glass, { ink: 0 }).box(0.8, 2.62, 0, 1.7, 0.1, 0.1, P.frame, { ink: 0.004 }).box(0.04, 1.3, 0, 0.1, 2.6, 0.1, P.frame, { ink: 0.004 }).box(1.56, 1.3, 0, 0.1, 2.6, 0.1, P.frame, { ink: 0.004 }).box(1.35, 1.3, 0.06, 0.08, 0.08, 0.1, '#e6b54a', { ink: 0 });
    k.build(g, { shadow: false });
    // the frame round it, fixed
    const kf = PAST.API.Kit(); kf.box(x, api.Y0 + 2.75, z, 1.9, 0.14, 0.14, P.frame, { ink: 0.004 }); kf.build(room.g, { shadow: false });
    w.arrow.material = new THREE.SpriteMaterial({ map: arrowTex(), transparent: true, depthWrite: false, depthTest: false });
    return g;
  }
  function hideLadder(room) { const w = room.way; if (!w) return; for (const o of [w.fr, w.lid, w.hole, w.lad]) if (o) o.visible = false; }
  // the fountain: a round stone basin in the middle, three stone fish, water (a disc) once remembered
  function fountain(room, api, at, kind) {
    const g = new THREE.Group(), k = PAST.API.Kit(), KG = PAST.API.KG, stone = kind === 'past' ? '#c9c2b6' : '#8f8a86';
    g.position.set(at.x, api.Y0, at.z); room.g.add(g);
    k.add(KG.cyl, 0, 0.3, 0, 1.6, 0.6, 1.6, stone, { ink: 0.014 }).add(KG.cyl, 0, 0.58, 0, 1.4, 0.06, 1.4, '#8a8580', { ink: 0 }).add(KG.cyl, 0, 1.0, 0, 0.25, 1.0, 0.25, stone, { ink: 0.008 }).add(KG.cyl, 0, 1.5, 0, 0.6, 0.12, 0.6, stone, { ink: 0.008 });
    const fish = [];
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; k.add(KG.sphere, Math.cos(a) * 0.95, 0.75, Math.sin(a) * 0.95, 0.24, 0.14, 0.12, stone, { ry: -a, ink: 0.006 }).add(KG.cone, Math.cos(a) * 1.18, 0.75, Math.sin(a) * 1.18, 0.1, 0.16, 0.04, stone, { ry: -a, rz: Math.PI / 2, ink: 0.004 }); fish.push(a); }
    k.build(g);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.36, 24), new THREE.MeshBasicMaterial({ color: '#7fd0e0', transparent: true, opacity: 0.85 })); water.rotation.x = -Math.PI / 2; water.position.y = 0.62; water.visible = false; g.add(water);
    const spray = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#bff0ff', transparent: true, opacity: 0, depthWrite: false })); spray.position.y = 1.8; spray.scale.set(1.0, 1.4, 1); g.add(spray);
    const solid = { x: at.x, z: at.z, r: 1.7 }; WORLD.extra.push(solid);
    return { g, water, spray, solid, on: false };
  }
  // a hedge animal (tomorrow's halls): a rabbit or a bear trimmed from a hedge, gray until it's asked nicely
  function hedgeAnimal(room, api, at, kind) {
    const g = new THREE.Group(), body = new THREE.Group(), KG = PAST.API.KG; g.add(body);
    const gm = grayMat(1), k = PAST.API.Kit(), L = ['#4f9a45', '#5fae4f', '#478c3e'];
    k.box(0, 0.15, 0, kind === 'bear' ? 2.0 : 1.4, 0.3, 1.2, '#8a6440', { ink: 0.01 });
    if (kind === 'bear') {
      k.add(TK.G.ico1, 0, 1.3, 0, 1.0, 1.1, 0.8, L[0], { ink: 0.014 }).add(TK.G.ico1, 0, 2.55, 0.05, 0.6, 0.55, 0.55, L[1], { ink: 0.012 });
      for (const s of [-1, 1]) k.add(TK.G.ico1, s * 0.42, 3.05, 0.0, 0.2, 0.2, 0.16, L[2], { ink: 0.008 }).add(TK.G.ico1, s * 0.75, 1.5, 0.35, 0.3, 0.55, 0.3, L[2], { rz: s * 0.5, ink: 0.008 });
      k.add(TK.G.ico1, 0, 2.45, 0.55, 0.22, 0.18, 0.2, L[0], { ink: 0.006 });
    } else {
      k.add(TK.G.ico1, 0, 0.85, 0, 0.75, 0.6, 0.65, L[0], { ink: 0.012 }).add(TK.G.ico1, 0, 1.6, 0.25, 0.42, 0.4, 0.4, L[1], { ink: 0.01 }).add(TK.G.ico1, 0, 0.6, -0.65, 0.22, 0.22, 0.22, '#f4efe2', { ink: 0.006 });
    }
    k.build(body, { mat: gm.m });
    const ears = [];
    if (kind !== 'bear') for (const s of [-1, 1]) { const e = new THREE.Group(); e.position.set(s * 0.16, 1.9, 0.2); body.add(e); const ke = PAST.API.Kit(); ke.add(TK.G.ico1, 0, 0.45, 0, 0.12, 0.5, 0.08, L[2], { ink: 0.006 }); ke.build(e, { mat: gm.m }); e.rotation.z = s * 0.6; e.rotation.x = 0.4; ears.push(e); }
    // eyes (dark knots in the leaves)
    const ki = PAST.API.Kit(); for (const s of [-1, 1]) ki.add(KG.ball6, s * (kind === 'bear' ? 0.2 : 0.14), kind === 'bear' ? 2.65 : 1.68, kind === 'bear' ? 0.55 : 0.62, 0.06, 0.07, 0.04, '#2b2235', { ink: 0 }); ki.build(body, { shadow: false });
    g.position.set(at.x, api.Y0, at.z); g.rotation.y = at.yaw || 0; room.g.add(g);
    const solid = { x: at.x, z: at.z, r: kind === 'bear' ? 1.2 : 0.9 }; WORLD.extra.push(solid);
    return { g, body, ears, gm, solid, kind, k: 1, ph: Math.random() * 6 };
  }
  // a narrow wall of thorny hedge across a hall, with a gap that the animal (or the bridge) fills
  function hedgeWall(room, api, z, gapX, gapW, k, kind) {
    const R = room.R, Y0 = api.Y0, L = kind === 'past' ? ['#4f9a45', '#5fae4f'] : ['#6d7a5e', '#7d8a6a'];
    for (let x = -HW + 0.6; x <= HW - 0.6; x += 0.8) { if (Math.abs(R.x + x - gapX) < gapW / 2) continue; k.add(TK.G.ico1, R.x + x, Y0 + 0.8, R.z + z, 0.55, 0.95, 0.45, L[Math.abs(Math.round(x)) % 2], { ry: x, ink: 0.01 }); }
    const left = (gapX - gapW / 2) - (R.x - HW), right = (R.x + HW) - (gapX + gapW / 2);
    const out = [{ obox: 1, x: R.x - HW + left / 2, z: R.z + z, hw: left / 2, hd: 0.45, rot: 0 }, { obox: 1, x: R.x + HW - right / 2, z: R.z + z, hw: right / 2, hd: 0.45, rot: 0 }];
    WORLD.extra.push(...out);
    return out;
  }
  return { HW, HD, WH, PAL, tileMat, glassMat, grayMat, glassShell, planters, backDoor, hideLadder, fountain, hedgeAnimal, hedgeWall, arrowTex };
})();

// ============================================================ the new greenhouse, long ago
const GD_PHOUSE = (() => {
  if (typeof MOLMILL === 'undefined' || typeof GARDT === 'undefined' || !GARDT || !GDKIT) return null;
  const M = GARDT, T = () => GPTXT, X = [-430, -404, -378, -352], Z = -180, KIT = GDKIT;
  const st = () => { const s = M.st('past'); return s.house || (s.house = {}); };
  const pS = () => M.st('past');
  const lang = () => M.lang();
  const melLook = { kid: true, skin: '#d9a27a', hair: '#3a2b26', hairdo: 'tails', ribbon: '#f2c94c', dress: '#f2d16b', apron: '#f4efe2', h: 0.7 };
  const nm = id => M.nameOf(T().CAST[id]);
  let K = null;
  const OUT = { x: M.DOOR.x, z: M.DOOR.z - 1.9, yaw: Math.PI };

  // a memory for {mimo} (the first time, the Past's card about memories, from Chapter 2)
  async function memory(kind) {
    const s = st();
    if (!s.memCard && typeof PAST_SC !== 'undefined' && PAST_SC._ && PAST_SC._.card) { s.memCard = true; try { await PAST_SC._.card('memory'); } catch (e) { /* */ } }
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const task = M.memTask(T().MEM[kind]); if (!task) return null;
    const r = await M.ask(task, { icon: kind === 'vine' ? 'climb' : 'jump' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('gd.mem.' + kind, r.letter); }
    return r;
  }
  // a hall remembers how it was: its gray drains away
  function colorBack(room, instant) { if (!room.gm) return; if (instant) { room.gm.u.uGray.value = 0; room.colorT = null; } else room.colorT = 1; }
  const floorsUp = i => { const p = pS(); p.floors = Math.max(p.floors || 0, Math.min(3, i + 1)); };

  // ---------------------------------------------------------- the rooms
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, i = room.i;
    KIT.glassShell(room, api, 'past', k);
    room.gm = KIT.grayMat(1);
    const pk = PAST.API.Kit(); KIT.planters(room, api, 'past', pk, { noFlowers: i === 1 });
    room.door = KIT.backDoor(room, api, 'past'); KIT.hideLadder(room);
    room.mel = api.person(room, melLook, i === 3 ? { x: R.x - 3.6, z: R.z + 3.4, yaw: 2.6 } : { x: R.x + 3.4, z: R.z + 3.2, yaw: -2.4 }, nm('melisa'));
    if (i === 0) {
      room.fount = KIT.fountain(room, api, { x: R.x + 0.6, z: R.z - 0.8 }, 'past');
      // the gray vine up the back wall, to the next door's latch
      room.vine = { x: room.way ? room.way.x + 1.6 : R.x - 3, z: R.z - KIT.HD + 0.4 };
      for (let j = 0; j < 9; j++) pk.add(KG.sphere, room.vine.x + Math.sin(j * 1.3) * 0.25, Y0 + 0.4 + j * 0.42, room.vine.z, 0.2, 0.16, 0.08, ['#4f9a45', '#5fae4f'][j % 2], { rz: j, ink: 0.004 });
      pk.rod([room.vine.x, Y0, room.vine.z + 0.05], [room.vine.x + 0.2, Y0 + 4.0, room.vine.z + 0.05], 0.04, '#5a7a3a', 0.004);
    }
    if (i === 1) {
      // the butterfly house: nets of thin frames, empty perches; the butterflies come back once it's remembered
      for (let j = 0; j < 5; j++) pk.add(KG.cyl6, R.x - 3 + j * 1.5, Y0 + 1.0, R.z - 1.5 + (j % 2), 0.05, 2.0, 0.05, '#8a6440', { ink: 0.004 }).add(KG.sphere, R.x - 3 + j * 1.5, Y0 + 2.05, R.z - 1.5 + (j % 2), 0.35, 0.12, 0.35, ['#ff8fb1', '#f2c94c', '#9b7fd0'][j % 3], { ink: 0.006 });
      const tex = TK.canvasTex(64, 64, c => { c.translate(32, 32); c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(-11, -6, 11, 9, -0.5, 0, TAU); c.ellipse(11, -6, 11, 9, 0.5, 0, TAU); c.ellipse(-8, 9, 7, 6, 0.4, 0, TAU); c.ellipse(8, 9, 7, 6, -0.4, 0, TAU); c.fill(); c.fillStyle = '#2b2235'; c.fillRect(-2, -12, 4, 26); });
      room.bf = []; const cols = ['#ffd166', '#9db8ff', '#ff9fc4', '#b9a2ff', '#ffb36b', '#9ff5b8'];
      for (let j = 0; j < 16; j++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: cols[j % cols.length], transparent: true, depthWrite: false })); s.scale.setScalar(0.34); s.visible = false; room.g.add(s); room.bf.push({ s, ph: j * 0.9, r: 1 + (j % 4) * 0.9, y: Y0 + 1 + (j % 5) * 0.5 }); }
    }
    if (i === 2) {
      // the lily pond across the hall (the way on is beyond it); the bridge once remembered; the boy's cap on a pad
      room.pondZ = R.z - 0.4;
      k.box(R.x, Y0 + 0.01, room.pondZ, KIT.HW * 2 - 0.4, 0.02, 2.6, '#2f6f78', { ink: 0 });
      for (let j = 0; j < 7; j++) k.add(KG.cyl, R.x - 5 + j * 1.6, Y0 + 0.04, room.pondZ + (j % 2 ? 0.6 : -0.5), 0.45, 0.03, 0.45, '#4f9a4a', { ink: 0.004 }).add(KG.ball6, R.x - 5 + j * 1.6 + 0.1, Y0 + 0.12, room.pondZ + (j % 2 ? 0.6 : -0.5), 0.1, 0.08, 0.1, j % 2 ? '#f4efe2' : '#ff8fb1', { ink: 0 });
      room.pondSolids = [{ obox: 1, x: R.x - 3.8, z: room.pondZ, hw: 3.0, hd: 1.3, rot: 0 }, { obox: 1, x: R.x + 3.8, z: room.pondZ, hw: 3.0, hd: 1.3, rot: 0 }, { obox: 1, x: R.x, z: room.pondZ, hw: 0.85, hd: 1.3, rot: 0 }];
      WORLD.extra.push(...room.pondSolids);
      room.bridge = new THREE.Group(); const kb = PAST.API.Kit();
      for (let j = 0; j < 7; j++) kb.box(0, 0.18, -1.5 + j * 0.5, 1.5, 0.08, 0.42, j % 2 ? '#a8743f' : '#b8844f', { ink: 0.006 });
      for (const s of [-1, 1]) kb.box(s * 0.78, 0.55, 0, 0.08, 0.08, 3.2, '#8a5a3a', { ink: 0.004 }).box(s * 0.78, 0.35, -1.4, 0.08, 0.4, 0.08, '#8a5a3a', { ink: 0 }).box(s * 0.78, 0.35, 1.4, 0.08, 0.4, 0.08, '#8a5a3a', { ink: 0 });
      kb.build(room.bridge); room.bridge.position.set(R.x, Y0, room.pondZ); room.bridge.visible = false; room.g.add(room.bridge);
      room.pad = { x: R.x + 3.4, z: room.pondZ + 0.6 };
      room.cap = new THREE.Group(); const kc = PAST.API.Kit(); kc.add(KG.half, 0, 0.12, 0, 0.16, 0.11, 0.16, '#d23a32', { ink: 0.006 }).box(0, 0.12, 0.15, 0.17, 0.02, 0.12, '#d23a32', { ink: 0 }); kc.build(room.cap);
      room.cap.position.set(room.pad.x, Y0 + 0.04, room.pad.z); room.g.add(room.cap);
    }
    if (i === 3) {
      // the dome: a great round bed in the middle where the Faded Bloom stands; a ring of benches
      room.bed = { x: R.x, z: R.z - 1.6 };
      k.add(KG.cyl, room.bed.x, Y0 + 0.3, room.bed.z, 2.2, 0.6, 2.2, '#b9ab94', { ink: 0.012 }).add(KG.cyl, room.bed.x, Y0 + 0.62, room.bed.z, 2.0, 0.04, 2.0, '#5a3a26', { ink: 0 });
      room.bloom = new THREE.Group(); room.bloom.position.set(room.bed.x, Y0 + 0.62, room.bed.z); room.g.add(room.bloom);
      const kf = PAST.API.Kit();
      kf.add(KG.cyl6, 0, 1.2, 0, 0.16, 2.4, 0.16, '#5f8a4a', { ink: 0.008 });
      for (let j = 0; j < 4; j++) kf.add(KG.sphere, Math.cos(j * 1.6) * 0.6, 0.6 + j * 0.3, Math.sin(j * 1.6) * 0.6, 0.7, 0.08, 0.3, '#4f9a45', { ry: -j * 1.6, rz: 0.3, ink: 0.006 });
      for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU; kf.add(KG.sphere, Math.cos(a) * 0.7, 2.55, Math.sin(a) * 0.7, 0.75, 0.12, 0.4, '#d9434f', { ry: -a, rz: 0.35, ink: 0.008 }); }
      kf.add(KG.sphere, 0, 2.62, 0, 0.4, 0.22, 0.4, '#f2c94c', { ink: 0.008 });
      kf.build(room.bloom, { mat: room.gm.m });
      room.bloomSolid = { x: room.bed.x, z: room.bed.z, r: 2.3 }; WORLD.extra.push(room.bloomSolid);
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffe6a8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.orb.scale.setScalar(1.4); room.orb.position.set(room.bed.x, Y0 + 2.6, room.bed.z); room.g.add(room.orb);
      for (const s of [-1, 1]) k.box(R.x + s * 4.4, Y0 + 0.42, R.z + 1.2, 0.5, 0.08, 1.8, '#a8743f', { ink: 0.008 }).box(R.x + s * 4.4, Y0 + 0.2, R.z + 1.2, 0.4, 0.4, 0.08, '#8a5a3a', { ink: 0 });
    }
    pk.build(room.g, { mat: room.gm.m });
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.fountain) setFountain(r0, true);
    if (s.done0 || s.fountain) colorBack(r0, true);
    if (s.butterflies) { colorBack(r1, true); r1.bf.forEach(b => { b.s.visible = true; }); }
    if (s.bridge) setBridge(r2, true);
    if (s.bridge) colorBack(r2, true);
    if (s.cap) r2.cap.visible = false;
    if (s.boss) { colorBack(r3, true); r3.bloomSolid.r = 2.3; }
    api.rooms.forEach(KIT.hideLadder);
  }
  function setFountain(room, instant) { room.fount.on = true; room.fount.water.visible = true; if (instant) room.fount.spray.material.opacity = 0.5; }
  function setBridge(room, instant) { room.pondSolids[2].x = 1e5; room.bridge.visible = true; if (instant) room.bridge.position.y = K.Y0; }

  // ---------------------------------------------------------- the rooms' deeds
  async function demoMel(room, key) { const P = room.mel; if (!P) return; M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
  async function describe(room, taskKey) {
    const r = await M.ask(T().TASKS[taskKey], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('The hall is still gray. Describe how it was.', 4); return null; }
    TIME.grade('gd.house.' + taskKey, r.letter); return r;
  }
  async function fountainTask(room) {
    const s = st(); const r = await describe(room, 'fountain'); if (!r) return;
    const G = K.G, f = room.fount;
    M.lock(true);
    try {
      M.shot(K.V(f.g.position.x + 3.2, K.Y0 + 3.0, f.g.position.z + 4.4), K.V(f.g.position.x, K.Y0 + 0.8, f.g.position.z)); await K.wait(0.4);
      setFountain(room, false); Sound.play('splash'); G.w3d.fx.sparkle(f.g.position.x, K.Y0 + 1.2, f.g.position.z, 20, ['#bff0ff', '#ffffff', '#9ff5b8']);
      colorBack(room); s.fountain = true; G.save(); await K.wait(1.2);
    } finally { M.lock(false); }
    UI.toast('The fountain remembers! The water is back.');
    M.think(`The way on is up the vine, to the door’s latch. Tell {mimo} what it did, as a memory: ${M.sx('mem')}.`, 6);
  }
  async function vineTask(room) {
    const s = st(); const r = await memory('vine'); if (!r) return;
    const G = K.G, v = room.vine;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: v.x, z: v.z + 0.9 }, v); await K.wait(0.8); Sound.play('climb');
      await K.mimoArc({ x: v.x, z: v.z + 0.3 }, K.Y0 + 3.4, 0.9); Sound.play('click'); await K.wait(0.3);
      await K.mimoLand(); s.vine = true; G.save();
    } finally { M.lock(false); }
    floorsUp(0); await K.floorDone(0);
    M.think('The door at the back swings open. The next hall!', 4);
  }
  async function butterflyTask(room) {
    const s = st(); const r = await describe(room, 'butterflies'); if (!r) return;
    const G = K.G;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 2.2, K.Y0 + 3.4, room.R.z + 5.0), K.V(room.R.x, K.Y0 + 1.4, room.R.z - 1)); await K.wait(0.4);
      for (const b of room.bf) { b.s.visible = true; await K.wait(0.06); }
      colorBack(room); Sound.play('chime'); s.butterflies = true; G.save(); await K.wait(1.4);
    } finally { M.lock(false); }
    floorsUp(1); await K.floorDone(1);
    UI.toast('Butterflies everywhere! The door at the back is open.');
  }
  async function bridgeTask(room) {
    const s = st(); const r = await describe(room, 'bridge'); if (!r) return;
    const G = K.G;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x - 3.4, K.Y0 + 3.2, room.R.z + 4.6), K.V(room.R.x, K.Y0 + 0.4, room.pondZ)); await K.wait(0.4);
      room.bridge.visible = true; await K.tween(0.8, kk => { room.bridge.position.y = K.Y0 - 0.6 + kk * 0.6; });
      setBridge(room, true); Sound.play('wood'); colorBack(room); s.bridge = true; G.save(); await K.wait(0.6);
    } finally { M.lock(false); }
    M.think(`A wooden bridge! And something red on a lily pad… Tell {mimo} what it did, as a memory.`, 5.5);
  }
  async function capTask(room) {
    const s = st(); const r = await memory('pad'); if (!r) return;
    const G = K.G, p = room.pad;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: p.x - 1.4, z: p.z + 1.6 }, p); await K.wait(0.7); Sound.play('jump');
      await K.mimoArc({ x: p.x, z: p.z }, K.Y0 + 0.1, 0.6); room.cap.visible = false; Sound.play('splash'); await K.wait(0.3);
      await K.mimoLand(); s.cap = true; G.save();
      const P = room.mel; if (P) { M.frame2(P.api); await M.say(P.api, T().LINES['melisa.cap']); }
    } finally { M.lock(false); }
    floorsUp(2); await K.floorDone(2);
  }
  // the dome: the Faded Bloom (the fight), Elio's echo, out into the sun
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.5, K.Y0 + 3.0, room.R.z + 3.6), K.V(room.bed.x, K.Y0 + 2.0, room.bed.z)); await K.wait(0.6); await M.you('A giant flower, gray as ash… and something hums inside it, like a boy’s voice.'); } finally { M.lock(false); }
    const r = typeof GDBOSS !== 'undefined' ? await GDBOSS.fightBloom() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Tell it as a memory!' : 'The gray flower closes again, humming.', 4); return; }
    s.boss = true;
    M.lock(true);
    try {
      colorBack(room); G.w3d.fx.sparkle(room.bed.x, K.Y0 + 2.6, room.bed.z, 26, ['#d9434f', '#f2c94c', '#ff8fb1']); Sound.play('chime');
      await K.wait(1.0);
      room.orb.position.set(room.bed.x, K.Y0 + 2.6, room.bed.z);
      await K.tween(1.4, kk => { room.orb.material.opacity = kk * 0.95; room.orb.position.y = K.Y0 + 2.6 + kk * 1.0; room.orb.scale.setScalar(1.0 + kk * 0.8); });
      await M.you('A boy’s voice… quiet, warm, as if humming in the sun.');
      const letter = typeof GDBOSS !== 'undefined' ? GDBOSS.letter('past') : 'B';
      await CH4.give('gardens', 'past', letter);
      await K.tween(0.8, kk => { room.orb.material.opacity = 0.95 * (1 - kk); room.orb.position.y = K.Y0 + 3.6 + kk * 2; });
      const P = room.mel; if (P) { M.frame2(P.api); await M.say(P.api, T().LINES['melisa.end']); }
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true; TIME.flag('past', 'gdHouse', true); TIME.refresh();
    await K.leave({ slow: true, then: async () => { const G = K.G; G.cam.override = { pos: K.V(OUT.x + 2.4, 3.4, OUT.z - 5.2), look: K.V(198, 1.6, -60.6) }; G.cam.snap(OUT.yaw, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      await K.wait(0.6);
      for (let j = 0; j < 8; j++) { G.w3d.fx.sparkle(198 + (Math.random() - 0.5) * 3, 1.5 + Math.random() * 2, -60.2, 6, ['#ffd166', '#9db8ff', '#ff9fc4']); await K.wait(0.12); }
      const D = typeof GD_PAST !== 'undefined' && GD_PAST ? GD_PAST.who('gardener') : null;
      if (D) { M.frame2(D); await M.say(D, T().LINES['gardener.done']); }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Elio’s words are free. Noa is waiting at the time crack on the green.', 5.5);
    G.save();
  }

  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().MEM[kind].model || {})[lang()] || '', lang()))}»` : `Tell ${name}`);
    if (room.mel) out.push({ x: room.mel.api.x - 0.6, z: room.mel.api.z - 0.6, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { await M.say(room.mel.api, T().LINES[s.boss ? 'melisa.end' : 'melisa.in']); } finally { M.lock(false); } } });
    const look = (x, z, id, line) => out.push({ x, z, r: 1.2, label: 'Look', run: async () => M.lookAt(id, line, 5) });
    if (i === 0) {
      look(room.R.x - 5.0, room.R.z - 3.6, 'w.gd_palm', 'A {w.gd_palm} in a big pot, its fronds touching the glass.');
      look(room.R.x + 5.2, room.R.z + 1.6, 'w.gd_fern', '{w.gd_fern:pl} at the palm’s feet, curled like green question marks.');
      if (!s.fountain) out.push({ x: room.fount.g.position.x, z: room.fount.g.position.z + 2.3, r: 1.8, label: 'Describe', run: () => fountainTask(room) });
      else { look(room.fount.g.position.x - 1.9, room.fount.g.position.z + 1.2, 'w.gd_fish', 'Three stone {w.gd_fish}, water pouring from their mouths. Cold and clear.'); if (!s.vine) out.push({ x: room.vine.x, z: room.vine.z + 1.4, r: 1.6, label: sayQ('vine'), run: () => vineTask(room) }); }
    }
    if (i === 1) {
      look(room.R.x + 5.0, room.R.z - 3.2, 'w.gd_leaf', 'Big glossy {w.gd_leaf:pl}, the size of umbrellas.');
      if (!s.butterflies) out.push({ x: room.R.x, z: room.R.z + 1.2, r: 2.0, label: 'Describe', run: () => butterflyTask(room) });
      else look(room.R.x - 1.0, room.R.z + 0.6, 'w.gd_butterfly', 'Blue, yellow, pink {w.gd_butterfly:pl}… one lands on your hand.');
    }
    if (i === 2) {
      look(room.R.x - 5.0, room.R.z + 1.6, 'w.gd_pond', 'A long {w.gd_pond}, still and green, full of {w.gd_lily:pl}.');
      if (!s.bridge) out.push({ x: room.R.x, z: room.pondZ + 2.1, r: 1.8, label: 'Describe', run: () => bridgeTask(room) });
      else if (!s.cap) out.push({ x: room.pad.x - 1.2, z: room.pad.z + 1.8, r: 1.6, label: sayQ('pad'), run: () => capTask(room) });
      if (s.bridge) look(room.R.x - 1.4, room.pondZ + 1.9, 'w.gd_bridge', 'A little wooden {w.gd_bridge}. The boy sat here every evening.');
    }
    if (i === 3) {
      look(room.R.x + 4.4, room.R.z + 2.4, 'w.gd_dome', 'The {w.gd_dome}, glass from the floor to the sky.');
      if (!s.boss) out.push({ x: room.bed.x, z: room.bed.z + 3.0, r: 2.2, label: 'Face the flower', run: () => bossScene(room) });
      else { look(room.bed.x - 2.6, room.bed.z + 1.6, 'w.gd_petal', 'Red {w.gd_petal:pl}, open wide, and a {w.gd_bud} beside them, about to bloom.'); if (!s.done3) out.push({ x: room.bed.x, z: room.bed.z + 3.0, r: 2.2, label: 'Go out', run: finale }); }
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!s.fountain) return { x: room.fount.g.position.x, z: room.fount.g.position.z, hint: '{mimo} looks at the dry, gray fountain.' }; if (!s.vine) return { x: room.vine.x, z: room.vine.z, hint: '{mimo} looks up the vine, at the door’s latch.' }; }
    if (i === 1 && !s.butterflies) return { x: room.R.x, z: room.R.z, hint: '{mimo} looks round the empty, gray hall.' };
    if (i === 2) { if (!s.bridge) return { x: room.R.x, z: room.pondZ, hint: '{mimo} looks across the pond. No way over.' }; if (!s.cap) return { x: room.pad.x, z: room.pad.z, hint: '{mimo} points at something red on a lily pad.' }; }
    if (i === 3 && !s.boss) return { x: room.bed.x, z: room.bed.z, hint: '{mimo} stares at the giant gray flower.' };
    return null;
  }
  async function onFirst(room) {
    const P = room.mel, i = room.i, s = st();
    if (i === 0) { await K.wait(0.8); if (P) { M.lock(true); try { M.frame2(P.api); await M.say(P.api, T().LINES['melisa.in']); } finally { M.lock(false); } } }
    if (i === 1 && !s.ambush) {
      await K.wait(1.0);
      await M.you('Gray moths in the gray hall! In here it’s a memory: tell what {mimo} did.');
      const r = await TIME.fight({ foes: [{ kind: 'moth', color: 'white', size: 'small' }, { kind: 'moth', color: 'green', size: 'small' }, { kind: 'moth', color: 'white', size: 'small' }], place: { x: 198, z: -72 } });
      if (!r || r.outcome !== 'win') return false;
      s.ambush = true; K.G.save();
    }
    const key = ['d.r0', 'd.r1', 'd.r2', 'd.r3'][i];
    if (P && key) { await K.wait(0.6); await demoMel(room, key); }
    if (i === 0) M.think(`The fountain is dry and gray. Describe how it was: ${M.sx('inside')}.`, 6);
    if (i === 1) M.think('The hall is empty. Describe how it was, with what Melisa just said.', 5);
    if (i === 2) M.think('No way across the pond. Describe how it was.', 5);
    if (i === 3) M.think('The giant flower in the middle is gray. Face it.', 4.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.mel) K.animate(room.mel, dt, t);
    KIT.hideLadder(room);
    if (room.door) { const want = st()['done' + room.i] ? -1.7 : 0; room.door.rotation.y += (want - room.door.rotation.y) * Math.min(1, dt * 3); }
    if (room.colorT != null && room.gm) { room.colorT = Math.max(0, room.colorT - dt * 0.6); room.gm.u.uGray.value = room.colorT; if (room.colorT <= 0) room.colorT = null; }
    if (room.fount && room.fount.on) { room.fount.spray.material.opacity = 0.42 + 0.12 * Math.sin(t * 6); room.fount.spray.scale.set(1.0, 1.4 + 0.1 * Math.sin(t * 5), 1); }
    if (room.bf) for (const b of room.bf) if (b.s.visible) { b.ph += dt; b.s.position.set(room.R.x + Math.cos(b.ph) * b.r * 1.6, b.y + Math.sin(b.ph * 2.1) * 0.3, room.R.z - 1 + Math.sin(b.ph * 1.3) * b.r); b.s.material.rotation = Math.sin(t * 20 + b.ph) * 0.25; }
    if (room.bloom) { const gray = room.gm.u.uGray.value; room.bloom.rotation.y = Math.sin(t * 0.5) * 0.2; room.bloom.scale.set(1, 1 - gray * 0.12, 1); }
  }
  // the greenhouse's own look: the old photograph's sepia over the picture (the Past's sky dome stays hidden in here)
  function late() {
    const cv = document.getElementById('gl');
    if (cv && !document.body.classList.contains('in-battle')) cv.style.filter = 'sepia(0.28) saturate(1.12) hue-rotate(-4deg) contrast(1.03)';
    if (typeof PAST !== 'undefined' && PAST._ && PAST._.W && PAST._.W.sky) PAST._.W.sky.visible = false;
  }
  const MOD = MOLMILL.make({
    name: 'gardens-past-house', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: OUT, state: st,
    tint: { planks: ['#c9774f', '#b86a46', '#d0845a'], joint: '#8a4f34', wall: '#cfeee6', wall2: '#c4e4dc', skirt: '#b9ab94', skirt2: '#a89a84', trim: '#f6f3ea', window: '#cfeee6', beam: '#f6f3ea', puff: '#e8f4e0' },
    interior: { fog: GDKIT.PAL.past.fog, near: 20, far: 60 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('gd_past_house') ? 'gd_past_house' : null),
  });
  // (the kit names its ways for the mill: here they're the greenhouse's halls)
  const ints0 = MOD.interactables;
  MOD.interactables = () => ints0().map(it => (it.label === 'Leave the mill' ? Object.assign({}, it, { label: 'Leave the greenhouse' }) : it.label === 'Climb' ? Object.assign({}, it, { label: 'Next hall' }) : it.label === 'Go down' ? Object.assign({}, it, { label: 'Back' }) : it));
  return Object.assign(MOD, { finale, OUT });
})();
