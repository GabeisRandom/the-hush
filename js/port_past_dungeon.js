'use strict';
// Aboard La Golondrina, long ago (DESIGN.md 20.1b "T4a"): four rooms at y 300, z −60, x −430 / −404 / −378 / −352, on MOLMILL's room
// kit (molinar_past_mill.js), reskinned here as a ship (PBKIT: dark wooden walls and ribs, round portholes, the kit's windows and its
// trapdoor ladder hidden; a door in the back wall swings open instead, with a «Next» arrow). The kit itself is untouched.
// Everyone aboard froze, gray, the moment the fog came. Young Dora sneaks aboard after you and shows what was going on in each place
// (a demonstration); you tell the ship, and the moment plays on (its gray drains away).
//   0 the Main Deck, in the fog: three sailors frozen hauling on the halyards, the sails half up: «Los marineros estaban subiendo las
//     velas cuando llegó la niebla» (the sails go up, the shanty starts again); the hatch's rope is tied up the mast: «{mimo} trepó por
//     el mástil»
//   1 the Galley: a gray-crab ambush (the Past's tense), then «El cocinero estaba cocinando cuando llegó la niebla» (steam, the soup
//     bubbles); a crate blocks the way down: «{mimo} empujó la caja»
//   2 the Cargo Hold: «El contramaestre estaba contando los barriles cuando llegó la niebla»; where the quiet boy worked, his notebook,
//     full of the port's words; the cabin's latch is up over the barrels: «{mimo} saltó sobre los barriles»
//   3 the Captain's Cabin: the Fog Octopus (port_time_boss.js), Elio's echo; outside, the ship's colors come back
const PT_PSHIP = (() => {
  if (typeof MOLMILL === 'undefined' || typeof PORTT === 'undefined' || !PORTT) return null;
  const M = PORTT, T = () => PTPTXT, X = [-430, -404, -378, -352], Z = -60;
  const HW = MOLMILL.HW, HD = MOLMILL.HD, WH = MOLMILL.WH;
  const st = () => { const s = M.st('past'); return s.ship || (s.ship = {}); };
  const pS = () => M.st('past');
  const lang = () => M.lang();
  const doraLook = { kid: true, skin: '#a8714a', hair: '#1f1a18', hairdo: 'tails', ribbon: '#f2c94c', dress: '#4c7fd8', apron: '#f4efe2', h: 0.68 };
  const nm = id => M.nameOf(T().CAST[id]);
  let K = null;
  const OUT = { x: -245.3, z: -70.4, yaw: Math.PI / 2 };

  // ---------------------------------------------------------- the ship's look (a material that drains to gray, shared by a room's
  // things and its frozen people: uGray 1 → 0 as the moment plays on)
  function grayMat(start = 1) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad }), u = { uGray: { value: start } };
    m.onBeforeCompile = sh => { sh.uniforms.uGray = u.uGray; sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.86, l * 0.92), uGray); }'); };
    m.customProgramCacheKey = () => 'pbRoomGray';
    return { m, u };
  }
  let FOGWALL = null;
  const fogWall = () => FOGWALL || (FOGWALL = new THREE.MeshBasicMaterial({ color: '#bdb8c2' }));      // (front side only: the kit's walls face in, so the camera sees through the near one)
  // the kit's room, as a ship's inside: its windows and the frame round them hidden (wooden ribs and portholes instead); the deck's
  // walls turned to fog
  function shipShell(room, api, k, deck) {
    for (const m of room.g.children.slice()) {
      if (!m.isMesh || !m.geometry) continue;
      const ty = m.geometry.type, p = m.geometry.parameters || {};
      if (ty === 'BoxGeometry') continue;
      if (ty === 'PlaneGeometry' && Math.abs(p.height - WH) < 0.01) { if (deck) m.material = fogWall(); continue; }
      if (ty === 'PlaneGeometry' && Math.abs(p.width - 2.2) < 0.01 && Math.abs(p.height - 1.2) < 0.01) continue;      // (the way out)
      m.visible = false;
    }
    const R = room.R, Y0 = api.Y0, KG = PAST.API.KG;
    if (deck) {
      // the bulwarks: a low wooden rail all round, fog beyond
      k.box(R.x, Y0 + 0.5, R.z - HD + 0.2, HW * 2, 1.0, 0.25, '#6b4428', { ink: 0.01 });
      for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.15), Y0 + 0.5, R.z, 0.25, 1.0, HD * 2, '#6b4428', { ink: 0.01 }).box(R.x + s * (HW - 0.15), Y0 + 1.05, R.z, 0.35, 0.1, HD * 2, '#f2c94c', { ink: 0.004 });
      return;
    }
    // ribs up the walls and along the ceiling, round portholes on the back wall
    for (let x = -HW + 1; x <= HW - 1; x += 2) k.box(R.x + x, Y0 + WH / 2, R.z - HD + 0.12, 0.22, WH, 0.18, '#5a3a24', { ink: 0.004 }).box(R.x + x, Y0 + WH - 0.15, R.z, 0.22, 0.22, HD * 2, '#5a3a24', { ink: 0 });
    for (let z = -HD + 1.5; z <= HD - 1.5; z += 2) for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.1), Y0 + WH / 2, R.z + z, 0.18, WH, 0.22, '#5a3a24', { ink: 0.004 });
    for (const dx of [-3.6, 3.6]) k.add(KG.cyl, R.x + dx, Y0 + 3.2, R.z - HD + 0.1, 0.5, 0.1, 0.5, '#c9a24a', { rx: Math.PI / 2, ink: 0.006 }).add(KG.cyl, R.x + dx, Y0 + 3.2, R.z - HD + 0.14, 0.38, 0.06, 0.38, '#9fd0e8', { rx: Math.PI / 2, ink: 0 });
  }
  // the door in the back wall that opens when a place is done (the kit's ladder stays hidden), and its «Next» arrow
  let ARROW = null;
  function arrowTex() {
    if (ARROW) return ARROW;
    ARROW = TK.canvasTex(128, 160, c => {
      c.lineJoin = 'round';
      const path = () => { c.beginPath(); c.moveTo(64, 10); c.lineTo(118, 70); c.lineTo(86, 70); c.lineTo(86, 112); c.lineTo(42, 112); c.lineTo(42, 70); c.lineTo(10, 70); c.closePath(); };
      path(); c.lineWidth = 14; c.strokeStyle = '#2b2235'; c.stroke(); c.fillStyle = '#ffd27a'; c.fill();
      c.font = '900 30px "Trebuchet MS", sans-serif'; c.textAlign = 'center'; c.lineWidth = 8; c.strokeText('Next', 64, 148); c.fillStyle = '#fffaf0'; c.fillText('Next', 64, 148);
    });
    return ARROW;
  }
  function backDoor(room, api) {
    const w = room.way; if (!w) return null;
    const g = new THREE.Group(), k = PAST.API.Kit(), x = w.x, z = room.R.z - HD + 0.1;
    g.position.set(x - 0.8, api.Y0, z); room.g.add(g);
    k.box(0.8, 1.3, 0, 1.6, 2.6, 0.08, '#7a4f2e', { ink: 0.008 }).box(0.8, 0.7, 0.05, 1.4, 0.08, 0.04, '#5a3a24', { ink: 0 }).box(0.8, 1.9, 0.05, 1.4, 0.08, 0.04, '#5a3a24', { ink: 0 }).box(1.35, 1.3, 0.08, 0.1, 0.1, 0.1, '#c9a24a', { ink: 0 });
    k.build(g, { shadow: false });
    const kf = PAST.API.Kit(); kf.box(x, api.Y0 + 2.75, z, 1.9, 0.16, 0.16, '#5a3a24', { ink: 0.004 }).box(x - 0.9, api.Y0 + 1.35, z, 0.14, 2.7, 0.16, '#5a3a24', { ink: 0 }).box(x + 0.9, api.Y0 + 1.35, z, 0.14, 2.7, 0.16, '#5a3a24', { ink: 0 }); kf.build(room.g, { shadow: false });
    w.arrow.material = new THREE.SpriteMaterial({ map: arrowTex(), transparent: true, depthWrite: false, depthTest: false });
    return g;
  }
  function hideLadder(room) { const w = room.way; if (!w) return; for (const o of [w.fr, w.lid, w.hole, w.lad]) if (o) o.visible = false; }
  // a frozen member of the crew: the person kit on the room's gray material (it comes back with the room's color)
  function frozen(room, api, look, at, mat) {
    const { k } = PAST.API.personKit(look), g = new THREE.Group(), body = new THREE.Group(); g.add(body); k.build(body, { mat });
    g.scale.setScalar(look.h || 1); g.position.set(at.x, api.Y0, at.z); g.rotation.y = at.yaw || 0; room.g.add(g);
    const solid = { x: at.x, z: at.z, r: 0.4 }; WORLD.extra.push(solid);
    return { g, body, solid, at };
  }

  // a memory for {mimo} (the first time, the Past's card about memories, from Chapter 2)
  async function memory(kind) {
    const s = st();
    if (!s.memCard && typeof PAST_SC !== 'undefined' && PAST_SC._ && PAST_SC._.card) { s.memCard = true; try { await PAST_SC._.card('memory'); } catch (e) { /* */ } }
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const task = M.memTask(T().MEM[kind]); if (!task) return null;
    const r = await M.ask(task, { icon: kind === 'mast' ? 'climb' : kind === 'barrels' ? 'jump' : 'push' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('pb.mem.' + kind, r.letter); }
    return r;
  }
  function colorBack(room, instant) { if (!room.gm) return; if (instant) { room.gm.u.uGray.value = 0; room.colorT = null; } else room.colorT = 1; }
  const floorsUp = i => { const p = pS(); p.floors = Math.max(p.floors || 0, Math.min(3, i + 1)); };

  // ---------------------------------------------------------- the rooms
  const SAILOR = [{ skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#f4efe2', vest: '#2f3f6a', hat: 'cap', hatColor: '#c9433a', h: 1.0 },
    { skin: '#e6b48c', hair: '#c9a24a', hairdo: 'short', dress: '#4c7fd8', vest: '#f4efe2', hat: 'scarf', hatColor: '#2f3f6a', beard: true, hair2: '#c9a24a', h: 1.02 },
    { skin: '#7a4a2e', hair: '#1f1a18', hairdo: 'bun', dress: '#f4efe2', vest: '#c9433a', prop: 'accordion', h: 0.98 }];
  const COOK = { skin: '#efc29a', hair: '#e8e4dc', hairdo: 'bald', stache: true, hair2: '#e8e4dc', dress: '#f4efe2', apron: '#f4efe2', hat: 'scarf', hatColor: '#f4efe2', prop: 'baton', wide: 1.2, h: 1.0 };
  const BOSUN = { skin: '#a8714a', hair: '#5a3a26', hairdo: 'short', beard: true, hair2: '#5a3a26', dress: '#3f4f66', vest: '#c9a24a', hat: 'flat', hatColor: '#2f3f6a', h: 1.02 };
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG, i = room.i;
    room.gm = grayMat(1);
    const pk = PAST.API.Kit();
    shipShell(room, api, k, i === 0);
    room.door = backDoor(room, api); hideLadder(room);
    room.dora = api.person(room, doraLook, i === 3 ? { x: R.x - 3.8, z: R.z + 3.2, yaw: 2.6 } : { x: R.x + 3.6, z: R.z + 3.3, yaw: -2.4 }, nm('dora'));
    if (i === 0) {
      // the main deck in the fog: two masts with half-raised sails, three sailors frozen hauling, the helm, coils of rope
      room.mast = { x: R.x - 2.6, z: R.z - 1.8 };
      for (const [mx, mz, h] of [[room.mast.x, room.mast.z, 7.0], [R.x + 2.6, R.z - 2.2, 6.2]]) {
        pk.add(KG.cyl6, mx, Y0 + h / 2, mz, 0.18, h, 0.18, '#8a5a3a', { ink: 0.01 }).add(KG.cyl, mx, Y0 + h * 0.82, mz, 0.07, 3.4, 0.07, '#8a5a3a', { rz: Math.PI / 2, ink: 0.004 });
        for (const s of [-1, 1]) pk.rod([mx, Y0 + h, mz], [mx + s * 3.0, Y0 + 1.0, mz + 1.5], 0.02, '#4a3a30', 0);
      }
      room.sails = new THREE.Group(); room.g.add(room.sails);
      const ks = PAST.API.Kit();
      for (const [mx, mz, h] of [[room.mast.x, room.mast.z, 7.0], [R.x + 2.6, R.z - 2.2, 6.2]]) ks.box(mx + 0.08, Y0 + h * 0.6, mz, 3.0, h * 0.42, 0.06, '#f6efe0', { ink: 0.008 });
      ks.build(room.sails, { mat: room.gm.m }); room.sails.position.y = -2.2;
      room.crew = [frozen(room, api, SAILOR[0], { x: R.x - 1.4, z: R.z + 0.6, yaw: Math.PI - 0.4 }, room.gm.m), frozen(room, api, SAILOR[1], { x: R.x + 0.2, z: R.z + 1.0, yaw: Math.PI }, room.gm.m),
        frozen(room, api, SAILOR[2], { x: R.x + 1.8, z: R.z + 1.6, yaw: Math.PI + 0.5 }, room.gm.m)];
      for (const c of room.crew.slice(0, 2)) pk.rod([c.at.x, Y0 + 1.0, c.at.z - 0.2], [room.mast.x, Y0 + 4.2, room.mast.z], 0.025, '#c9b48e', 0);
      room.helm = { x: R.x + 5.0, z: R.z + 1.6 };
      pk.add(KG.cyl6, room.helm.x, Y0 + 0.6, room.helm.z, 0.12, 1.2, 0.12, '#6b4428', { ink: 0.008 }).add(KG.torus, room.helm.x, Y0 + 1.3, room.helm.z, 0.55, 0.55, 1.0, '#8a5a3a', { ry: Math.PI / 2, ink: 0.006 });
      for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU; pk.rod([room.helm.x, Y0 + 1.3, room.helm.z], [room.helm.x, Y0 + 1.3 + Math.sin(a) * 0.7, room.helm.z + Math.cos(a) * 0.7], 0.025, '#8a5a3a', 0); }
      for (let j = 0; j < 3; j++) pk.add(KG.torus, R.x - 5.2 + j * 0.9, Y0 + 0.08, R.z + 3.6, 0.32, 0.32, 1.6, '#c9b48e', { rx: Math.PI / 2, ink: 0.004 });
      room.puffs = []; const tex = TK.canvasTex(64, 64, c => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(206,204,212,0.85)'); g.addColorStop(1, 'rgba(206,204,212,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
      for (let j = 0; j < 10; j++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7, depthWrite: false })); const side = j % 3; s.position.set(side === 0 ? R.x - HW + 0.8 : side === 1 ? R.x + HW - 0.8 : R.x - 5 + j * 1.1, Y0 + 1.4 + (j % 2) * 1.2, side === 2 ? R.z - HD + 0.9 : R.z - 4 + j * 0.8); s.scale.setScalar(2.2 + (j % 3) * 0.5); room.g.add(s); room.puffs.push(s); }
    }
    if (i === 1) {
      // the galley: the stove and its pot, the frozen cook stirring, shelves of cups, pans hanging, a table with bowls; a crate in front of the next door
      room.stove = { x: R.x - 2.0, z: R.z - 3.6 };
      pk.box(room.stove.x, Y0 + 0.55, room.stove.z, 2.2, 1.1, 1.3, '#3a3046', { ink: 0.012 }).add(KG.cyl6, room.stove.x + 0.8, Y0 + 3.2, room.stove.z - 0.3, 0.12, 4.2, 0.12, '#3a3046', { ink: 0.006 });
      pk.add(KG.cyl, room.stove.x - 0.3, Y0 + 1.38, room.stove.z, 0.42, 0.56, 0.42, '#6f6c7a', { ink: 0.01 }).add(KG.cyl, room.stove.x - 0.3, Y0 + 1.6, room.stove.z, 0.36, 0.04, 0.36, '#c9a46a', { ink: 0 });
      room.cook = frozen(room, api, COOK, { x: room.stove.x + 0.2, z: room.stove.z + 1.3, yaw: Math.PI }, room.gm.m);
      for (let j = 0; j < 2; j++) { pk.box(R.x + 3.4, Y0 + 2.0 + j * 0.8, R.z - HD + 0.35, 3.0, 0.08, 0.5, '#8a5a3a', { ink: 0.006 }); for (let c = 0; c < 6; c++) pk.add(KG.cyl, R.x + 2.2 + c * 0.45, Y0 + 2.16 + j * 0.8, R.z - HD + 0.35, 0.1, 0.18, 0.1, ['#f4efe2', '#4c7fd8', '#e2574c'][c % 3], { ink: 0.004 }); }
      for (let j = 0; j < 4; j++) pk.add(KG.cyl, R.x - 4.6 + j * 0.7, Y0 + 3.6, R.z - HD + 0.5, 0.25, 0.05, 0.25, '#6f6c7a', { rx: Math.PI / 2, ink: 0.004 }).rod([R.x - 4.6 + j * 0.7, Y0 + 3.85, R.z - HD + 0.5], [R.x - 4.6 + j * 0.7, Y0 + 4.3, R.z - HD + 0.3], 0.02, '#4a3a30', 0);
      pk.box(R.x + 2.0, Y0 + 0.75, R.z + 0.6, 2.4, 0.08, 1.3, '#a8743f', { ink: 0.01 });
      for (const [dx, dz] of [[-1.05, -0.5], [1.05, -0.5], [-1.05, 0.5], [1.05, 0.5]]) pk.box(R.x + 2.0 + dx, Y0 + 0.37, R.z + 0.6 + dz, 0.08, 0.74, 0.08, '#6b4a30', { ink: 0 });
      for (let j = 0; j < 4; j++) pk.add(KG.half, R.x + 1.2 + j * 0.55, Y0 + 0.82, R.z + 0.6, 0.18, -0.1, 0.18, '#f4efe2', { ink: 0.004 });
      room.steam = []; for (let j = 0; j < 4; j++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(0.6); room.g.add(s); room.steam.push({ s, ph: j * 0.7 }); }
      room.crate = new THREE.Group(); const kc = PAST.API.Kit(); kc.box(0, 0.7, 0, 1.6, 1.4, 1.1, '#b8955a', { ink: 0.012 }).box(0, 0.7, 0.56, 1.5, 0.12, 0.02, '#8a6440', { ink: 0 }).box(0, 1.1, 0.56, 1.5, 0.12, 0.02, '#8a6440', { ink: 0 }); kc.build(room.crate, { mat: room.gm.m });
      room.crateAt = { x: room.way ? room.way.x : R.x - 4.6, z: R.z - HD + 1.2 }; room.crate.position.set(room.crateAt.x, Y0, room.crateAt.z); room.g.add(room.crate);
      room.crateSolid = { x: room.crateAt.x, z: room.crateAt.z, r: 0.9 }; WORLD.extra.push(room.crateSolid);
    }
    if (i === 2) {
      // the cargo hold: barrels and crates and sacks, a lantern, the frozen boatswain with his tally board; the boy's corner
      for (let j = 0; j < 6; j++) pk.add(KG.cyl, R.x - 5.2 + (j % 3) * 0.95, Y0 + 0.5 + (j > 2 ? 1.0 : 0), R.z - 3.8 + (j > 2 ? 0.2 : 0), 0.45, 1.0, 0.45, '#8a5a3a', { ink: 0.01 }).add(KG.cyl, R.x - 5.2 + (j % 3) * 0.95, Y0 + 0.5 + (j > 2 ? 1.0 : 0), R.z - 3.8 + (j > 2 ? 0.2 : 0), 0.47, 0.08, 0.47, '#3a3046', { ink: 0 });
      room.barrels = { x: R.x - 4.2, z: R.z - 3.6 };
      for (let j = 0; j < 7; j++) pk.box(R.x + 2.2 + (j % 4) * 0.95, Y0 + 0.45 + (j > 3 ? 0.9 : 0), R.z - 3.4, 0.9, 0.9, 0.9, j % 2 ? '#b8955a' : '#c9a46a', { ry: j * 0.1, ink: 0.01 });
      for (let j = 0; j < 4; j++) pk.add(KG.sphere, R.x + 5.4, Y0 + 0.3 + j * 0.4, R.z - 0.6 + (j % 2) * 0.3, 0.45, 0.25, 0.35, '#d8c8a0', { ry: j, ink: 0.008 });
      pk.rod([R.x, Y0 + WH - 0.2, R.z], [R.x, Y0 + 3.6, R.z], 0.02, '#4a3a30', 0).box(R.x, Y0 + 3.4, R.z, 0.3, 0.4, 0.3, '#f6e7a8', { ink: 0.006 });
      room.bosun = frozen(room, api, BOSUN, { x: R.x - 1.6, z: R.z - 1.6, yaw: -2.6 }, room.gm.m);
      pk.box(R.x - 1.2, Y0 + 1.0, R.z - 1.35, 0.4, 0.5, 0.04, '#f4efe2', { ry: -0.5, ink: 0.004 });
      room.corner = { x: R.x + 1.6, z: R.z + 0.6 };
      pk.box(room.corner.x, Y0 + 0.3, room.corner.z, 0.7, 0.6, 0.6, '#b8955a', { ink: 0.01 });
      room.book = new THREE.Group(); const kb = PAST.API.Kit(); kb.box(0, 0.04, 0, 0.36, 0.06, 0.26, '#4c7fd8', { ink: 0.006 }).box(0.02, 0.08, 0, 0.32, 0.02, 0.24, '#f4efe2', { ink: 0 }); kb.build(room.book);
      room.book.position.set(room.corner.x, Y0 + 0.6, room.corner.z); room.book.rotation.y = 0.4; room.book.visible = false; room.g.add(room.book);
    }
    if (i === 3) {
      // the captain's cabin: the stern windows, a chart table with a map and a compass, a bunk, a sea chest, a hanging lamp; the fog itself
      for (let j = 0; j < 3; j++) k.box(R.x - 3.0 + j * 3.0, Y0 + 3.0, R.z - HD + 0.08, 2.0, 1.6, 0.06, '#cfe4ee', { ink: 0 }).box(R.x - 3.0 + j * 3.0, Y0 + 3.0, R.z - HD + 0.12, 0.1, 1.6, 0.06, '#5a3a24', { ink: 0 });
      room.table = { x: R.x, z: R.z - 1.4 };
      pk.box(room.table.x, Y0 + 0.8, room.table.z, 3.0, 0.1, 1.6, '#8a5a3a', { ink: 0.012 });
      for (const [dx, dz] of [[-1.3, -0.6], [1.3, -0.6], [-1.3, 0.6], [1.3, 0.6]]) pk.box(room.table.x + dx, Y0 + 0.4, room.table.z + dz, 0.1, 0.8, 0.1, '#6b4a30', { ink: 0 });
      pk.box(room.table.x - 0.3, Y0 + 0.87, room.table.z, 1.6, 0.02, 1.1, '#efe2c4', { ry: 0.1, ink: 0.004 }).add(KG.cyl, room.table.x + 0.9, Y0 + 0.9, room.table.z + 0.3, 0.2, 0.06, 0.2, '#c9a24a', { ink: 0.004 });
      pk.box(R.x + 5.4, Y0 + 0.5, R.z + 1.0, 1.0, 0.5, 2.4, '#6b4428', { ink: 0.01 }).box(R.x + 5.4, Y0 + 0.8, R.z + 1.0, 0.9, 0.12, 2.2, '#e8e0cf', { ink: 0 });
      pk.box(R.x - 5.2, Y0 + 0.4, R.z + 2.4, 1.2, 0.8, 0.7, '#7a4f2e', { ink: 0.01 }).box(R.x - 5.2, Y0 + 0.82, R.z + 2.4, 1.24, 0.06, 0.74, '#c9a24a', { ink: 0 });
      pk.rod([R.x, Y0 + WH - 0.2, R.z + 1.0], [R.x, Y0 + 3.8, R.z + 1.0], 0.02, '#4a3a30', 0).box(R.x, Y0 + 3.6, R.z + 1.0, 0.32, 0.42, 0.32, '#f6e7a8', { ink: 0.006 });
      room.bossSolid = { x: room.table.x, z: room.table.z, r: 2.0 }; WORLD.extra.push(room.bossSolid);
      room.cloud = new THREE.Group(); room.cloud.position.set(room.table.x, Y0 + 1.8, room.table.z); room.g.add(room.cloud);
      const tex = TK.canvasTex(64, 64, c => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(170,168,182,0.95)'); g.addColorStop(1, 'rgba(170,168,182,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
      room.cloudP = []; for (let j = 0; j < 10; j++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); const a = j / 10 * TAU; s.position.set(Math.cos(a) * 1.2, Math.sin(j * 1.7) * 0.6, Math.sin(a) * 0.8); s.scale.setScalar(1.8 + (j % 3) * 0.5); room.cloud.add(s); room.cloudP.push({ s, a, ph: j }); }
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffe6a8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.orb.scale.setScalar(1.4); room.orb.position.set(room.table.x, Y0 + 2.2, room.table.z); room.g.add(room.orb);
    }
    pk.build(room.g, { mat: room.gm.m });
    k.build(room.g, { shadow: false });      // (the ribs and rails: no long shadows striping the floor)
  }
  function applyState(api) {
    const s = st(), [r0, r1, r2, r3] = api.rooms;
    if (s.sails) { r0.sails.position.y = 0; colorBack(r0, true); r0.puffs.forEach(p => { p.visible = false; }); }
    if (s.soup) colorBack(r1, true);
    if (s.crate) { r1.crate.position.x = r1.crateAt.x + 2.4; r1.crateSolid.x = r1.crateAt.x + 2.4; }
    if (s.tally) { colorBack(r2, true); r2.book.visible = !s.book; }
    if (s.boss) { colorBack(r3, true); r3.cloud.visible = false; r3.bossSolid.x = 1e5; }
    api.rooms.forEach(hideLadder);
  }

  // ---------------------------------------------------------- the rooms' deeds
  async function demoDora(room, key) { const P = room.dora; if (!P) return; M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
  async function tell(room, taskKey) {
    const r = await M.ask(T().TASKS[taskKey], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('Everything here is still stopped. Tell what was going on when the fog came.', 4); return null; }
    TIME.grade('pb.ship.' + taskKey, r.letter); return r;
  }
  async function deckTask(room) {
    const s = st(); const r = await tell(room, 'deck'); if (!r) return;
    const G = K.G;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 3.4, K.Y0 + 3.6, room.R.z + 5.4), K.V(room.R.x - 1, K.Y0 + 2.6, room.R.z - 1.6)); await K.wait(0.4);
      colorBack(room); Sound.play('swoosh');
      await K.tween(1.4, kk => { room.sails.position.y = -2.2 * (1 - kk * kk); room.puffs.forEach(p => { p.material.opacity = 1 - kk; }); });
      room.puffs.forEach(p => { p.visible = false; }); Sound.play('chime'); s.sails = true; G.save();
      try { if (typeof PTMUSIC !== 'undefined' && PTMUSIC.shanty) PTMUSIC.shanty(); } catch (e) { /* */ }
      await K.wait(0.8);
      const P = room.dora; if (P) { M.frame2(P.api); await M.say(P.api, T().LINES['dora.deck']); }
    } finally { M.lock(false); }
    UI.toast('The moment plays on: the sails go up!');
    M.think(`The hatch’s rope is tied high up the mast. Tell {mimo} what it did, as a memory: ${M.sx('mem')}.`, 6);
  }
  async function mastTask(room) {
    const s = st(); const r = await memory('mast'); if (!r) return;
    const G = K.G, m = room.mast;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: m.x + 0.6, z: m.z + 0.8 }, m); await K.wait(0.8); Sound.play('climb');
      await K.mimoArc({ x: m.x, z: m.z + 0.3 }, K.Y0 + 5.4, 1.0); Sound.play('click'); await K.wait(0.3);
      await K.mimoLand(); s.mast = true; G.save();
    } finally { M.lock(false); }
    floorsUp(0); await K.floorDone(0);
    M.think('The rope comes free, and the door below deck swings open.', 4);
  }
  async function galleyTask(room) {
    const s = st(); const r = await tell(room, 'galley'); if (!r) return;
    const G = K.G;
    M.lock(true);
    try {
      M.shot(K.V(room.stove.x + 3.6, K.Y0 + 2.8, room.stove.z + 5.0), K.V(room.stove.x, K.Y0 + 1.2, room.stove.z)); await K.wait(0.4);
      colorBack(room); Sound.play('splash'); s.soup = true; G.save(); await K.wait(1.0);
      const P = room.dora; if (P) { M.frame2(P.api); await M.say(P.api, T().LINES['dora.galley']); }
    } finally { M.lock(false); }
    UI.toast('The moment plays on: the soup bubbles again!');
    M.think('A big crate blocks the way down to the hold. Tell {mimo} what it did, as a memory.', 5);
  }
  async function crateTask(room) {
    const s = st(); const r = await memory('crate'); if (!r) return;
    const G = K.G, c = room.crateAt;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: c.x - 1.2, z: c.z + 0.6 }, c); await K.wait(0.8); Sound.play('push');
      await K.tween(0.9, kk => { room.crate.position.x = c.x + kk * 2.4; }); room.crateSolid.x = c.x + 2.4; Sound.play('wood');
      s.crate = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    floorsUp(1); await K.floorDone(1);
  }
  async function holdTask(room) {
    const s = st(); const r = await tell(room, 'hold'); if (!r) return;
    const G = K.G;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x + 2.4, K.Y0 + 3.0, room.R.z + 4.6), K.V(room.R.x - 1, K.Y0 + 1.0, room.R.z - 1.6)); await K.wait(0.4);
      colorBack(room); Sound.play('chime'); s.tally = true; G.save(); await K.wait(1.0);
      room.book.visible = true; G.w3d.fx.sparkle(room.corner.x, K.Y0 + 0.9, room.corner.z, 10, ['#ffe6a8', '#9fd0e8']); Sound.play('learned');
      const P = room.dora; if (P) { M.frame2(P.api); await M.say(P.api, T().LINES['dora.book']); }
      room.book.visible = false; s.book = true; G.save();
    } finally { M.lock(false); }
    M.think('The cabin door’s latch is up above the barrels. Tell {mimo} what it did, as a memory.', 5);
  }
  async function barrelsTask(room) {
    const s = st(); const r = await memory('barrels'); if (!r) return;
    const G = K.G, b = room.barrels;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: b.x + 1.0, z: b.z + 1.2 }, b); await K.wait(0.7); Sound.play('jump');
      await K.mimoArc({ x: b.x, z: b.z + 0.2 }, K.Y0 + 2.1, 0.7); Sound.play('click'); await K.wait(0.3);
      await K.mimoLand(); s.barrels = true; G.save();
    } finally { M.lock(false); }
    floorsUp(2); await K.floorDone(2);
    M.think('The latch clicks. The captain’s cabin is through there.', 4);
  }
  // the cabin: the Fog Octopus (the fight), Elio's echo, out onto the quay
  async function bossScene(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { M.shot(K.V(room.R.x - 2.6, K.Y0 + 3.0, room.R.z + 3.8), K.V(room.table.x, K.Y0 + 1.6, room.table.z)); await K.wait(0.6); await M.you('A gray fog fills the cabin, thick as wool… and something in it has arms. It hums like a boy’s voice.'); } finally { M.lock(false); }
    const r = typeof PTBOSS !== 'undefined' ? await PTBOSS.fightOctopus() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Tell it as a memory!' : 'The fog curls back over the table, humming.', 4); return; }
    s.boss = true;
    M.lock(true);
    try {
      colorBack(room); room.cloud.visible = false; room.bossSolid.x = 1e5; G.w3d.fx.sparkle(room.table.x, K.Y0 + 1.8, room.table.z, 26, ['#ffe6a8', '#9fd0e8', '#f2c94c']); Sound.play('chime');
      await K.wait(1.0);
      await K.tween(1.4, kk => { room.orb.material.opacity = kk * 0.95; room.orb.position.y = K.Y0 + 2.2 + kk * 1.0; room.orb.scale.setScalar(1.0 + kk * 0.8); });
      await M.you('A boy’s voice… careful, the way someone talks who is still learning the words.');
      const letter = typeof PTBOSS !== 'undefined' ? PTBOSS.letter('past') : 'B';
      await CH4.give('port', 'past', letter);
      await K.tween(0.8, kk => { room.orb.material.opacity = 0.95 * (1 - kk); room.orb.position.y = K.Y0 + 3.2 + kk * 2; });
      const P = room.dora; if (P) { M.frame2(P.api); await M.say(P.api, T().LINES['dora.end']); }
    } finally { M.lock(false); }
    G.save();
    await finale();
  }
  async function finale() {
    const s = st(); s.done3 = true; TIME.flag('past', 'pbShip', true); TIME.refresh();
    await K.leave({ slow: true, then: async () => { const G = K.G; G.cam.override = { pos: K.V(OUT.x + 6.0, 4.2, OUT.z - 2.0), look: K.V(-248.5, 2.4, -66.2) }; G.cam.snap(OUT.yaw, 0.3, 9); } });
    const G = K.G;
    M.lock(true);
    try {
      await K.wait(1.2);
      for (let j = 0; j < 8; j++) { G.w3d.fx.sparkle(-248.5 + (Math.random() - 0.5) * 9, 2 + Math.random() * 5, -66.2, 6, ['#ffd166', '#9fd0e8', '#f6efe0']); await K.wait(0.12); }
      const D = typeof PT_PAST !== 'undefined' && PT_PAST ? PT_PAST.who('master') : null;
      if (D) { M.frame2(D); await M.say(D, T().LINES['master.done']); }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Elio’s words are free. Noa is waiting at the time crack in the plaza.', 5.5);
    G.save();
  }

  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().MEM[kind].model || {})[lang()] || '', lang()))}»` : `Tell ${name}`);
    if (room.dora) out.push({ x: room.dora.api.x - 0.6, z: room.dora.api.z - 0.6, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { await M.say(room.dora.api, T().LINES[s.boss ? 'dora.end' : 'dora.in']); } finally { M.lock(false); } } });
    const look = (x, z, id, line) => out.push({ x, z, r: 1.2, label: 'Look', run: async () => M.lookAt(id, line, 5) });
    if (room.intro) return out;          // (a room's first moments: young Dora's demonstration, the ambush, before anything to do)
    if (i === 0) {
      look(room.helm.x - 0.8, room.helm.z + 0.8, 'w.pb_helm', 'The ship’s {w.pb_helm}, its spokes worn smooth by many hands.');
      if (!s.sails) out.push({ x: room.R.x, z: room.R.z + 2.6, r: 2.0, label: 'Tell', run: () => deckTask(room) });
      else { look(room.R.x - 4.8, room.R.z + 3.2, 'w.pb_shanty', 'The sailors hum their {w.pb_shanty} as they work. One of them winks at you.'); if (!s.mast) out.push({ x: room.mast.x + 0.8, z: room.mast.z + 1.4, r: 1.6, label: sayQ('mast'), run: () => mastTask(room) }); }
    }
    if (i === 1) {
      look(room.R.x + 3.2, room.R.z - HD + 1.4, 'w.pb_porthole', 'A round {w.pb_porthole}. Outside, only gray fog.');
      if (!s.soup) out.push({ x: room.stove.x + 1.6, z: room.stove.z + 2.2, r: 1.8, label: 'Tell', run: () => galleyTask(room) });
      else { look(room.stove.x + 1.2, room.stove.z + 1.4, 'w.pb_fishsoup', '{w.pb_fishsoup} bubbling in the {w.pb_pot}, {w.pb_steam} rising. {cook} hums.'); if (!s.crate) out.push({ x: room.crateAt.x + 1.0, z: room.crateAt.z + 1.4, r: 1.6, label: sayQ('crate'), run: () => crateTask(room) }); }
    }
    if (i === 2) {
      look(room.R.x + 3.6, room.R.z - 2.2, 'w.pb_cargo', 'Crates and sacks to the ceiling: the {w.pb_cargo}. The quiet boy loaded most of it.');
      if (!s.tally) out.push({ x: room.R.x - 0.6, z: room.R.z + 0.6, r: 1.9, label: 'Tell', run: () => holdTask(room) });
      else if (!s.barrels) out.push({ x: room.barrels.x + 1.2, z: room.barrels.z + 1.6, r: 1.6, label: sayQ('barrels'), run: () => barrelsTask(room) });
      if (s.book) look(room.corner.x + 0.6, room.corner.z + 0.8, 'w.pb_notebook', 'The crate where the quiet boy sat. Young {dora} has his {w.pb_notebook} now, safe.');
    }
    if (i === 3) {
      look(room.R.x + 4.6, room.R.z + 2.6, 'w.pb_captain', 'The {w.pb_captain}’s bunk, neatly made. A {w.pb_compass} and a {w.pb_map} on the table.');
      if (!s.boss) out.push({ x: room.table.x, z: room.table.z + 2.8, r: 2.2, label: 'Face the fog', run: () => bossScene(room) });
      else if (!s.done3) out.push({ x: room.table.x, z: room.table.z + 2.8, r: 2.2, label: 'Go out', run: finale });
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!s.sails) return { x: room.R.x, z: room.R.z + 1, hint: '{mimo} looks at the frozen sailors, their sails half up.' }; if (!s.mast) return { x: room.mast.x, z: room.mast.z, hint: '{mimo} looks up the mast, at the hatch’s rope.' }; }
    if (i === 1) { if (!s.soup) return { x: room.stove.x, z: room.stove.z, hint: '{mimo} sniffs the cold gray soup.' }; if (!s.crate) return { x: room.crateAt.x, z: room.crateAt.z, hint: '{mimo} pushes at a big crate. Too heavy… now.' }; }
    if (i === 2) { if (!s.tally) return { x: room.R.x - 1.6, z: room.R.z - 1.6, hint: '{mimo} looks at the gray boatswain and his tally board.' }; if (!s.barrels) return { x: room.barrels.x, z: room.barrels.z, hint: '{mimo} looks up at the latch over the barrels.' }; }
    if (i === 3 && !s.boss) return { x: room.table.x, z: room.table.z, hint: '{mimo} stares at the fog over the table.' };
    return null;
  }
  // (while a room's first moments play, its tasks wait: room.intro; teach before ask)
  async function onFirst(room) { room.intro = true; try { return await onFirst0(room); } finally { room.intro = false; } }
  async function onFirst0(room) {
    const P = room.dora, i = room.i, s = st();
    if (i === 0) { await K.wait(0.8); if (P) { M.lock(true); try { M.frame2(P.api); await M.say(P.api, T().LINES['dora.in']); } finally { M.lock(false); } } }
    if (i === 1 && !s.ambush) {
      await K.wait(1.0);
      await M.you('Gray crabs scuttle out from under the stove! In here it’s a memory: tell what {mimo} did.');
      const r = await TIME.fight({ foes: [{ kind: 'crab', color: 'red', size: 'small' }, { kind: 'crab', color: 'blue', size: 'small' }], place: { x: -226, z: -60 } });
      if (!r || r.outcome !== 'win') return false;
      s.ambush = true; K.G.save();
    }
    const key = ['d.r0', 'd.r1', 'd.r2', null][i];
    if (P && key) { await K.wait(0.6); await demoDora(room, key); }
    if (i === 0) M.think(`Everyone stopped when the fog came. Tell the ship what was going on: ${M.sx('story')}.`, 6);
    if (i === 1) M.think('The cook stopped mid-stir. Tell what he was doing when the fog came.', 5);
    if (i === 2) M.think('The boatswain stopped mid-count. Tell what he was doing when the fog came.', 5);
    if (i === 3) M.think('The fog itself is in here. Face it.', 4.5);
    return true;
  }
  function update(room, dt, t) {
    if (room.dora) K.animate(room.dora, dt, t);
    hideLadder(room);
    if (room.door) { const want = st()['done' + room.i] ? -1.7 : 0; room.door.rotation.y += (want - room.door.rotation.y) * Math.min(1, dt * 3); }
    if (room.colorT != null && room.gm) { room.colorT = Math.max(0, room.colorT - dt * 0.6); room.gm.u.uGray.value = room.colorT; if (room.colorT <= 0) room.colorT = null; }
    const s = st();
    if (room.crew && s.sails) room.crew.forEach((c, j) => { c.body.position.y = Math.abs(Math.sin(t * 2.2 + j)) * 0.04; c.body.rotation.z = Math.sin(t * 1.6 + j) * 0.05; });
    if (room.puffs) room.puffs.forEach((p, j) => { if (p.visible) p.position.y = K.Y0 + 1.2 + (j % 3) * 0.9 + Math.sin(t * 0.6 + j) * 0.2; });
    if (room.cook && s.soup) room.cook.body.rotation.y = Math.sin(t * 2.4) * 0.25;
    if (room.steam) room.steam.forEach(o => { const on = !!s.soup; o.s.material.opacity = on ? 0.35 * (1 - ((t * 0.5 + o.ph) % 1)) : 0; o.s.position.set(room.stove.x - 0.3 + Math.sin(t + o.ph) * 0.1, K.Y0 + 1.7 + ((t * 0.5 + o.ph) % 1) * 1.4, room.stove.z); });
    if (room.bosun && s.tally) room.bosun.body.rotation.z = Math.sin(t * 1.3) * 0.04;
    if (room.cloud && room.cloud.visible) { room.cloud.rotation.y = t * 0.25; room.cloudP.forEach(o => { o.s.position.y = Math.sin(t * 1.1 + o.ph) * 0.5; }); }
  }
  // the ship's own look: the old photograph's sepia over the picture (the Past's sky dome stays hidden in here)
  function late() {
    const cv = document.getElementById('gl');
    if (cv && !document.body.classList.contains('in-battle')) cv.style.filter = 'sepia(0.3) saturate(1.1) hue-rotate(-4deg) contrast(1.03)';
    if (typeof PAST !== 'undefined' && PAST._ && PAST._.W && PAST._.W.sky) PAST._.W.sky.visible = false;
  }
  const MOD = MOLMILL.make({
    name: 'port-past-ship', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: OUT, state: st,
    tint: { planks: ['#a8743f', '#9a6a3a', '#b07a45'], joint: '#5a3a24', wall: '#7a5236', wall2: '#6b4a30', skirt: '#5a3a26', skirt2: '#4a3020', trim: '#3a2a20', window: '#9fd0e8', beam: '#5a3a24', puff: '#d8c8a8' },
    interior: { fog: '#c9c4c4', near: 16, far: 48 },
    build, applyState, interactables, target, onFirst, update, late,
    song: () => (Sound.songs && Sound.songs.includes('pb_past_ship') ? 'pb_past_ship' : null),
  });
  // (each room's subtitle names the ship in the language you're learning, read when you walk in)
  (MOD.ROOMS || []).forEach((r, i) => Object.defineProperty(r, 'sub', { get: () => T().ROOMS[i].sub, configurable: true, enumerable: true }));
  // (the kit names its ways for the mill: here they're the ship's)
  const ints0 = MOD.interactables;
  MOD.interactables = () => ints0().map(it => (it.label === 'Leave the mill' ? Object.assign({}, it, { label: 'Leave the ship' }) : it.label === 'Climb' ? Object.assign({}, it, { label: 'Next' }) : it.label === 'Go down' ? Object.assign({}, it, { label: 'Back' }) : it));
  return Object.assign(MOD, { finale, OUT });
})();
