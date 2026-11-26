'use strict';
// The Great Mill (DESIGN.md 14.4): Molinar's bell, and the first dungeon. Four small rooms, one per
// floor, built high above the far forest (out of sight) and visited one at a time:
//   0 the grain store: push flour sacks onto the two plates and the hatch opens («¡empuja!»)
//   1 the gear room:   Hushlings; push the big cog into its socket; break the cracked crate («¡golpea!»)
//   2 the sail loft:   knock the high latch with a pebble («¡lanza!»), stomp the shelf button («¡salta!»)
//   3 the bell cap:    the big one, Noa's page, and the bell («¡golpea la campana!»)
// Every action is a sentence to Mimo (UI.command). Once a verb has worked on a kind of thing in a
// room, E repeats it there (the prompt shows the sentence). Walls face inward only, so the camera
// sees in from outside, like a dollhouse. Progress lives in state.mill; you always leave by the door.
// DESIGN.md 16 (playtest 4):
//   the way up: every floor's is a trapdoor in the ceiling; when its puzzle is solved a chime plays (BFX.solved), the lid
//     swings open, a ladder slides down through it to the floor, and a bobbing arrow and a "Climb" prompt show (wayUp, openWay)
//   «lanza» before it's asked for: Trigo, the miller's grandkid, hides in the sail loft throwing pebbles at the latch and
//     missing («¡Lanzo una piedrita!… ¡Lanza!»); Mimo watches and learns it (STORY.teachWord), then the latch asks for it
//   the bell cap's giant armadillo is a real boss fight now (battle/flow.js armaMain: BATTLE.start({ boss: 'armadillo' }))
// DESIGN.md 19 (playtest 6, P6c):
//   prompts: every interactable carries y (Y0), so the E prompt shows up here at all (main.js places it at the thing's height;
//     without y it went to the forest floor 300 below, off screen: no prompt ever showed in the mill)
//   ladders: solid once down (way.solid, an oriented box from the wall to the foot); «trepa / sobe / kletter / 爬 / 登って» (v.climb)
//     taught before the first one: Trigo hides behind the sacks in the grain store and pops out when its ladder drops, climbs a
//     few rungs saying it (STORY.demoLine), then the teach box (climbLesson); every ladder is "E Climb": the first time a
//     sentence to Mimo («¡Trepa!»), then E repeats it (st.quickClimb); Mimo scrambles up first and you follow (climbUp)
//   the gear room's Hushlings drop from the beams in front of you, a beat to see them, then the fight (dropAmbush)
//   window frames, the beams and anything on a wall go with that wall when the camera is outside it (wallsFor, every frame)
//   the bell cap: E at the bell's rope rings it (a hushed clonk), the armadillo wakes and uncurls, then the fight (ringToWake);
//     after it, Noa's page, then «¡golpea la campana!» rings it for real; w.bell is let into the weave first, so the armadillo's
//     threats (mixed by battle/foelines.js) say «campana» glossed; its own shouts are taught the first time (foelines.js arma1/2)
//   MILL.init(game) · MILL.enter() · MILL.update(dt, t) · MILL.interactables() · MILL.target()
//   MILL.inside · MILL.OUTSIDE (the forecourt: where saves put you)
const MILL = (() => {
  let G = null, built = false;
  const { part, G: GEO } = TK;
  const Y0 = 300, HW = 7, HD = 6, WH = 5.6, CELL = 2;
  const ROOMS = [
    { id: 'grain', name: 'The Grain Store', sub: 'The Great Mill · 1st floor', x: 236, z: 50 },
    { id: 'gears', name: 'The Gear Room', sub: 'The Great Mill · 2nd floor', x: 236, z: 22 },
    { id: 'loft', name: 'The Sail Loft', sub: 'The Great Mill · 3rd floor', x: 236, z: -6 },
    { id: 'cap', name: 'The Bell Cap', sub: 'The Great Mill · the top', x: 236, z: -34 },
  ];
  const OUTSIDE = { x: 240, z: -163.6, yaw: 0 };
  const VERBS = ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.climb'];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = () => G.state.mill || (G.state.mill = {});
  const cellPos = (R, c, r) => ({ x: R.x - 6 + c * CELL, z: R.z - 5 + r * CELL });
  // Mimo's «¡Empuja!» (zh / ja: the word as LEX.form gives it in the mode, with a full-width ！ after characters: 推！ / 押して！)
  const ex = w => (UI.lang === 'zh' || UI.lang === 'ja' ? w + (/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]$/i.test(w) ? '!' : '！')
    : (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!');
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  let inside = false, cur = -1, quick = {};
  const rooms = [];
  // a floor's puzzle is solved: the chime (js/battle_fx.js; audio.js's own as a fallback)
  const chime = () => { if (!(typeof BFX !== 'undefined' && BFX.solved && BFX.solved())) Sound.play('chest'); };

  // ------------------------------------------------------------ materials and textures
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const planks = tex(256, 256, c => {
      c.fillStyle = '#b98a5a'; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 8; i++) {
        const y = i * 32; c.fillStyle = ['#c09160', '#b3844f', '#bd8d5b'][i % 3]; c.fillRect(0, y + 2, 256, 30);
        c.fillStyle = '#7a5434'; c.fillRect(0, y, 256, 2); const off = (i * 97) % 256; c.fillRect(off, y, 3, 32); c.fillRect((off + 131) % 256, y, 3, 32);
      }
      c.fillStyle = 'rgba(255,255,255,0.09)'; for (let k = 0; k < 50; k++) c.fillRect((k * 53) % 256, (k * 29) % 256, 20, 2);
    }, 3.5, 3);
    const plaster = tex(256, 256, c => {
      c.fillStyle = '#efe2c8'; c.fillRect(0, 0, 256, 256);
      c.fillStyle = '#e4d3b2'; for (let k = 0; k < 70; k++) c.fillRect((k * 71) % 256, (k * 37) % 256, 12, 6);
      c.fillStyle = '#9a6a42'; c.fillRect(0, 190, 256, 66); c.fillStyle = '#86593a'; for (let x = 0; x < 256; x += 32) c.fillRect(x, 190, 3, 66);
      c.fillStyle = '#6b4a2e'; c.fillRect(0, 186, 256, 6); c.fillRect(0, 0, 12, 256);
    }, 3, 1);
    MAT = { floor: new THREE.MeshToonMaterial({ map: planks, gradientMap: TK.grad }), wall: new THREE.MeshToonMaterial({ map: plaster, gradientMap: TK.grad }),
      window: new THREE.MeshBasicMaterial({ color: '#ffe7a8' }), hole: new THREE.MeshBasicMaterial({ color: '#1b130e' }) };
    return MAT;
  }

  // ------------------------------------------------------------ little builders (all TK parts: toon, with ink)
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  function sackMesh(parent) {
    const g = new THREE.Group(); parent.add(g);
    g.add(part(GEO.sphere, '#f1e8d4', [0, 0.62, 0], [0.78, 0.66, 0.72], { ink: 0.02 }));
    g.add(part(new THREE.CylinderGeometry(0.79, 0.79, 0.15, 18), '#c9553f', [0, 0.6, 0], [1, 1, 0.92], { ink: 0 }));
    g.add(part(GEO.sphere, '#e3d6b8', [0, 1.26, 0], [0.24, 0.17, 0.24], { ink: 0.015 }));
    g.add(part(GEO.sphere, '#ffffff', [0.2, 0.95, 0.5], [0.16, 0.1, 0.06], { ink: 0 }));      // a puff of flour on its side
    return g;
  }
  function cogMesh(parent, r = 0.95) {
    const g = new THREE.Group(); parent.add(g);
    g.add(part(new THREE.CylinderGeometry(r, r, 0.32, 22), '#a8673a', [0, 0, 0], null, { ink: 0.02 }));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.add(part(GEO.box, '#8d5733', [Math.cos(a) * (r + 0.13), 0, Math.sin(a) * (r + 0.13)], [0.3, 0.3, 0.26], { rot: [0, -a, 0], ink: 0.012 })); }
    g.add(part(new THREE.CylinderGeometry(r * 0.32, r * 0.32, 0.4, 14), '#6b4a2e', [0, 0, 0], null, { ink: 0.012 }));
    return g;
  }
  function crateMesh(parent) {
    const g = new THREE.Group(); parent.add(g);
    g.add(part(GEO.box, '#b07a48', [0, 0.7, 0], [1.4, 1.4, 1.4], { ink: 0.02 }));
    [[0.71, 0.7, 0, 0.06, 1.3, 0.12], [-0.71, 0.7, 0, 0.06, 1.3, 0.12], [0, 0.7, 0.71, 0.12, 1.3, 0.06], [0, 0.7, -0.71, 0.12, 1.3, 0.06]].forEach(([x, y, z, sx, sy, sz]) => g.add(part(GEO.box, '#8d5d38', [x, y, z], [sx, sy, sz], { ink: 0 })));
    [[0.2, 1.0, 0.72, 0.5], [-0.25, 0.55, 0.72, -0.7], [0.72, 0.8, -0.1, 1.1]].forEach(([x, y, z, a]) => g.add(part(GEO.box, '#3a2a20', [x, y, z], [0.04, 0.5, 0.03], { rot: [0, z > 0.7 ? 0 : Math.PI / 2, a], ink: 0 })));   // cracks
    return g;
  }
  function millstone(parent) {
    const g = new THREE.Group(); parent.add(g);
    g.add(part(new THREE.CylinderGeometry(0.95, 1.0, 0.55, 20), '#aaa397', [0, 0.28, 0], null, { ink: 0.02 }));
    g.add(part(new THREE.CylinderGeometry(0.2, 0.2, 0.58, 10), '#5d564c', [0, 0.3, 0], null, { ink: 0 }));
    return g;
  }
  function plateMesh(parent) {
    const g = new THREE.Group(); parent.add(g);
    g.add(part(new THREE.CylinderGeometry(0.85, 0.9, 0.08, 22), '#8d6a46', [0, 0.04, 0], null, { ink: 0.012 }));
    const ring = part(new THREE.TorusGeometry(0.66, 0.07, 6, 22), '#e6b54a', [0, 0.1, 0], null, { rot: [Math.PI / 2, 0, 0], ink: 0 }); g.add(ring);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd76a', transparent: true, opacity: 0, depthWrite: false }));
    glow.scale.setScalar(2.4); glow.position.y = 0.35; g.add(glow);
    return { g, glow };
  }
  function pile(parent, x, z) {       // a few sacks heaped in a corner (solid)
    const g = grp(parent, x, Y0, z);
    [[0, 0, 0], [0.75, 0, 0.3], [0.3, 0.9, 0.1]].forEach(([dx, dy, dz]) => { const s = sackMesh(g); s.position.set(dx - 0.35, dy, dz); s.scale.setScalar(0.85); s.rotation.y = dx * 2; });
    return g;
  }
  function bellMesh(parent) {
    const g = new THREE.Group(); parent.add(g);
    const prof = [[0, 0.05], [0.95, 0], [1.0, 0.12], [0.86, 0.4], [0.7, 1.0], [0.6, 1.45], [0.38, 1.62], [0, 1.66]].map(([x, y]) => new THREE.Vector2(x, y));
    const body = part(new THREE.LatheGeometry(prof, 24), '#c99a3e', [0, -1.66, 0], null, { ink: 0.02 }); g.add(body);
    g.add(part(GEO.sphere, '#8a6a2a', [0, -1.55, 0], [0.22, 0.22, 0.22], { ink: 0 }));    // the clapper
    g.add(part(new THREE.TorusGeometry(0.2, 0.06, 6, 14), '#6b5222', [0, 0.08, 0], null, { ink: 0 }));
    return g;
  }

  // ------------------------------------------------------------ the rooms
  function shell(R, g) {
    const M = mats();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, 0.4, HD * 2), M.floor); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
    // walls face inward only: from outside, the near ones vanish and you look in
    [[0, -HD, 0, HW * 2], [0, HD, Math.PI, HW * 2], [-HW, 0, Math.PI / 2, HD * 2], [HW, 0, -Math.PI / 2, HD * 2]].forEach(([dx, dz, ry, w]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), M.wall); m.position.set(R.x + dx, Y0 + WH / 2, R.z + dz); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    });
    // corner posts and a beam frame along the tops of the side and back walls (none in front: the
    // front wall is the one the camera looks through, so anything there would float across the view)
    // (DESIGN.md 19, P6c: "window frames still show when moving camera around in the mill". Each wall's things are listed with it,
    // in the order north, south, west, east, with the wall's inward normal: when the camera is outside a wall, the wall vanishes by
    // itself (it faces inward) and wallsFor hides its things with it. A corner post goes once both its walls are gone.)
    const walls = [[0, -1, 0, 1], [0, 1, 0, -1], [-1, 0, 1, 0], [1, 0, -1, 0]].map(([sx, sz, nx, nz]) => ({ px: R.x + sx * HW, pz: R.z + sz * HD, nx, nz, items: [] })), posts = [];
    const frame = [];
    [[-1, -1, 0, 2], [1, -1, 0, 3], [-1, 1, 1, 2], [1, 1, 1, 3]].forEach(([sx, sz, a, b]) => { const m = part(GEO.box, '#6b4a2e', [R.x + sx * (HW - 0.2), Y0 + WH / 2, R.z + sz * (HD - 0.2)], [0.4, WH, 0.4], { ink: 0 }); frame.push(m); posts.push({ m, a, b }); });
    { const m = part(GEO.box, '#6b4a2e', [R.x, Y0 + WH - 0.2, R.z - HD + 0.15], [HW * 2, 0.4, 0.3], { ink: 0 }); frame.push(m); walls[0].items.push(m); }
    [[-HW + 0.15, 2], [HW - 0.15, 3]].forEach(([dx, k]) => { const m = part(GEO.box, '#6b4a2e', [R.x + dx, Y0 + WH - 0.2, R.z], [0.3, 0.4, HD * 2], { ink: 0 }); frame.push(m); walls[k].items.push(m); });
    frame.forEach(m => { m.castShadow = false; g.add(m); });
    // two sunny windows on the north wall, and one on each side
    [[-3.6, -HD + 0.04, 0, 0], [3.6, -HD + 0.04, 0, 0], [-HW + 0.04, -1.5, Math.PI / 2, 2], [HW - 0.04, 1.5, -Math.PI / 2, 3]].forEach(([dx, dz, ry, k]) => {
      const win = grp(g, R.x + dx, Y0 + 3.4, R.z + dz); win.rotation.y = ry;        // (local +z points into the room)
      win.add(new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.5), M.window));
      [[0, 0.8, 1.55, 0.14], [0, -0.8, 1.55, 0.14], [-0.72, 0, 0.14, 1.7], [0.72, 0, 0.14, 1.7], [0, 0, 0.08, 1.5], [0, 0, 1.3, 0.08]].forEach(([x, y, w, h]) =>
        win.add(part(GEO.box, '#6b4a2e', [x, y, 0.04], [w, h, 0.08], { ink: 0 })));
      walls[k].items.push(win);
    });
    // the way down (or out): an opening in the south wall
    // (the way out is a dark doormat-like patch by the front wall, so it reads from above)
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), M.hole); door.rotation.x = -Math.PI / 2; door.position.set(R.x, Y0 + 0.012, R.z + HD - 0.6); g.add(door);
    [[-1.15], [1.15]].forEach(([dx]) => g.add(part(GEO.box, '#6b4a2e', [R.x + dx, Y0 + 0.08, R.z + HD - 0.6], [0.14, 0.16, 1.2], { ink: 0 })));
    // the walls, as solids; the floor, as a platform
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - HD - 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: R.x, z: R.z + HD + 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 },
      { obox: 1, x: R.x - HW - 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }, { obox: 1, x: R.x + HW + 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }]);
    WORLD.addPlatforms([{ box: [R.x - HW, R.x + HW, R.z - HD, R.z + HD], top: Y0 }]);
    return { walls, posts };
  }
  // what goes with its wall (P6c): every frame, a wall's things show only while the camera is on the room's side of it (the wall
  // plane itself faces inward, so it's culled from outside); a corner post stays while either of its walls shows
  function wallsFor(room, cam) {
    if (!room.walls) return;
    const inn = room.walls.map(w => (cam.x - w.px) * w.nx + (cam.z - w.pz) * w.nz > 0);
    room.walls.forEach((w, k) => { for (const m of w.items) if (m.visible !== inn[k]) m.visible = inn[k]; });
    for (const p of room.posts) { const v = inn[p.a] || inn[p.b]; if (p.m.visible !== v) p.m.visible = v; }
    return inn;
  }
  // a thing that moves on the grid (a sack, the cog): mesh, cell, and a solid in WORLD.extra
  function mover(room, kind, c, r, mesh) {
    const p = cellPos(room.R, c, r), o = { kind, c, r, c0: c, r0: r, g: mesh, x: p.x, z: p.z, solid: { x: p.x, z: p.z, r: 0.78, id: 'mill-' + kind } };
    mesh.position.set(p.x, Y0, p.z); WORLD.extra.push(o.solid); room.movers.push(o);
    return o;
  }
  const place = (o, x, z, y = Y0) => { o.x = x; o.z = z; o.g.position.set(x, y, z); o.solid.x = x; o.solid.z = z; };
  const unsolid = o => { const s = o.solid || o; s.x = s.z = 1e5; };       // (gone: its solid is moved far away; takes a thing or a solid)
  // Trigo, the miller's grandkid (the grain store's and the sail loft's: two models, one boy)
  function kidModel() {
    if (typeof ACTORS === 'undefined' || !ACTORS.villager) return null;
    if (ACTORS.PRESETS && !ACTORS.PRESETS.millkid) ACTORS.PRESETS.millkid = { dress: '#e7dcc6', apron: null, skin: '#e6b48c', hair: '#7a4a2a', hat: 'cap', glasses: false, bun: false, eyes: 'open', h: 0.78 };
    return ACTORS.villager('millkid');
  }
  // the gear room's Hushlings, where each lands (from the room's middle): in front of you as you come up (P6c)
  const AMBUSH = [{ kind: 'hushling', color: 'green', size: 'small', dx: -2.3, dz: 2.1 }, { kind: 'moth', color: 'yellow', size: 'small', dx: 0.9, dz: 2.5 }, { kind: 'armadillo', color: 'blue', size: 'small', dx: 2.7, dz: 1.7 }];
  function build() {
    if (built) return; built = true;
    const scene = G.w3d.scene;
    ROOMS.forEach((R, i) => {
      const g = new THREE.Group(); g.visible = false; scene.add(g);
      const sh = shell(R, g);
      if (i > 0) {      // the way down: the top of the ladder you came up, poking out of the hole by the front wall
        const lz = R.z + HD - 0.75;
        [-0.42, 0.42].forEach(dx => g.add(part(GEO.box, '#a8743f', [R.x + dx, Y0 + 0.2, lz], [0.12, 1.0, 0.12], { ink: 0.01 })));
        g.add(part(GEO.box, '#c79d6d', [R.x, Y0 + 0.45, lz], [0.84, 0.09, 0.1], { ink: 0.008 }));
        WORLD.extra.push({ obox: 1, x: R.x, z: lz, hw: 0.52, hd: 0.12, rot: 0, id: 'mill-ladder-top' });      // (solid too: P6c)
      }
      rooms[i] = { R, g, movers: [], solid: [], noPush: [[3, 5]], anim: [], walls: sh.walls, posts: sh.posts };
    });
    // 0 · the grain store: two plates, two sacks, a millstone in the way, the hatch to the stairs
    {
      const room = rooms[0], R = room.R, g = room.g;
      room.plates = [[2, 1], [4, 1]].map(([c, r]) => { const p = cellPos(R, c, r), m = plateMesh(grp(g, p.x, Y0, p.z)); return { c, r, glow: m.glow }; });
      room.sacks = [[2, 3], [4, 3]].map(([c, r]) => mover(room, 'sack', c, r, sackMesh(g)));
      const ms = cellPos(R, 4, 2); millstone(grp(g, ms.x, Y0, ms.z)); room.solid.push([4, 2]); WORLD.extra.push({ x: ms.x, z: ms.z, r: 0.95 });
      [[0, 0], [0, 5]].forEach(([c, r]) => { const p = cellPos(R, c, r); pile(g, p.x, p.z); room.solid.push([c, r]); WORLD.extra.push({ x: p.x, z: p.z, r: 0.95 }); });
      room.noPush.push([6, 0], [6, 1]);                // (the ladder comes down in the north-east corner)
      const hp = cellPos(R, 6, 0); wayUp(room, hp.x, hp.z);
      // (P6c) Trigo hides behind a heap of sacks by the ladder's corner, and pops out when the ladder drops (climbLesson)
      { const p = cellPos(R, 5, 0); pile(g, p.x, p.z); room.solid.push([5, 0]); WORLD.extra.push({ x: p.x, z: p.z, r: 0.95 }); }
      const kid = kidModel();
      if (kid) {
        const tx = R.x + 4.9, tz = R.z - 3.7; g.add(kid.root); kid.root.visible = false;
        room.trigo = { model: kid, N: { x: tx, y: Y0, z: tz, yaw: Math.PI, talk: 0, wave: false, walking: false }, p: { id: 'trigo', name: 'Trigo', x: tx, z: tz, y: Y0, top: 1.2, talking: false }, hide: { x: tx, z: tz } };
      }
      // the reset lever by the door
      const lv = grp(g, R.x + 2.6, Y0, R.z + HD - 0.35); lv.add(part(GEO.box, '#6b4a2e', [0, 0.6, 0], [0.5, 1.2, 0.2], { ink: 0.01 }));
      const arm = grp(lv, 0, 1.0, -0.1); arm.add(part(GEO.cyl, '#8d6a46', [0, 0.35, 0], [0.07, 0.7, 0.07], { ink: 0 })); arm.add(part(GEO.sphere, '#c9553f', [0, 0.72, 0], [0.13, 0.13, 0.13], { ink: 0.01 }));
      arm.rotation.x = 0.5; room.lever = { g: lv, arm, x: R.x + 2.6, z: R.z + HD - 0.9 };
    }
    // 1 · the gear room: the cog on the floor, its socket on the north wall, two wall gears, the cracked crate before the stairs
    {
      const room = rooms[1], R = room.R, g = room.g;
      room.cog = mover(room, 'cog', 3, 3, cogMesh(g)); room.cog.g.position.y = Y0 + 0.17; room.cog.solid.r = 1.05;
      const so = cellPos(R, 3, 0); room.socket = { c: 3, r: 0, x: so.x, z: R.z - HD + 0.35 };
      const axle = part(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12), '#3a2a20', [so.x, Y0 + 2.3, R.z - HD + 0.25], null, { rot: [Math.PI / 2, 0, 0], ink: 0 }); g.add(axle);   // the empty axle
      room.wallGears = [[-2.6, 3.2, 1.25], [2.7, 2.0, 0.85], [4.6, 3.6, 0.7]].map(([dx, y, r]) => { const c = cogMesh(g, r); c.position.set(R.x + dx, Y0 + y, R.z - HD + 0.3); c.rotation.x = Math.PI / 2; return c; });
      room.walls[0].items.push(axle, ...room.wallGears);          // (on the north wall: they go with it, P6c)
      // (P6c) the Hushlings up in the beams: they drop in front of you the first time you come up (dropAmbush)
      room.drop = AMBUSH.map(a => {
        let m = null;
        if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) { try { m = BATTLE.buildFoe(a.kind, a.color, { size: a.size }); m.visible = false; g.add(m); } catch (e) { console.warn('[mill] ambush model', e); m = null; } }
        return { a, m, x: R.x + a.dx, z: R.z + a.dz, on: false };
      });
      const cp = cellPos(R, 6, 1); room.crate = { g: crateMesh(grp(g, cp.x, Y0, cp.z)), x: cp.x, z: cp.z, solid: { x: cp.x, z: cp.z, r: 0.95 } }; WORLD.extra.push(room.crate.solid);
      room.solid.push([6, 1]); room.noPush.push([6, 0]);
      [[0, 0], [0, 1]].forEach(([c, r]) => { const p = cellPos(R, c, r); pile(g, p.x, p.z); room.solid.push([c, r]); WORLD.extra.push({ x: p.x, z: p.z, r: 0.95 }); });
      const st = cellPos(R, 6, 0); wayUp(room, st.x, st.z);      // (the gears open its trapdoor; the crate sits at the ladder's foot)
    }
    // 2 · the sail loft: the latch high on the north wall, the button on the east shelf, the rolled-up rope ladder
    {
      const room = rooms[2], R = room.R, g = room.g;
      room.latch = { x: R.x - 3.4, y: Y0 + 4.3, z: R.z - HD + 0.4 };
      const lt = grp(g, room.latch.x, room.latch.y, R.z - HD + 0.2); lt.add(part(GEO.box, '#6b4a2e', [0, 0, 0], [0.7, 0.35, 0.3], { ink: 0.01 }));
      const larm = grp(lt, 0, 0, 0.18); larm.add(part(GEO.box, '#c9553f', [0, -0.45, 0], [0.16, 0.9, 0.12], { ink: 0.01 })); larm.rotation.z = 0.9; room.latch.arm = larm;
      const lrope = part(GEO.cyl, '#d8c08a', [R.x - 1.7, Y0 + 4.6, R.z - HD + 0.4], [0.035, 0.035, 3.4], { rot: [0, 0, Math.PI / 2], ink: 0 }); g.add(lrope);    // the rope from the latch to the ladder
      room.shelf = { x: R.x + HW - 0.7, y: Y0 + 2.3, z: R.z - 1.2 };
      const shelf = [part(GEO.box, '#7a5434', [room.shelf.x, room.shelf.y - 0.1, room.shelf.z], [1.3, 0.16, 2.2], { ink: 0.012 })];
      [[-0.6], [0.6]].forEach(([dz]) => shelf.push(part(GEO.box, '#6b4a2e', [room.shelf.x + 0.3, room.shelf.y - 0.55, room.shelf.z + dz], [0.15, 0.8, 0.15], { rot: [0, 0, 0.6], ink: 0 })));
      shelf.forEach(m => g.add(m));
      const btn = grp(g, room.shelf.x, room.shelf.y, room.shelf.z); btn.add(part(new THREE.CylinderGeometry(0.4, 0.45, 0.12, 16), '#3a2a20', [0, 0.06, 0], null, { ink: 0 }));
      const cap = part(GEO.sphere, '#e2483a', [0, 0.14, 0], [0.32, 0.2, 0.32], { ink: 0.012 }); btn.add(cap); room.button = { g: btn, cap };
      room.walls[0].items.push(lt, lrope); room.walls[3].items.push(...shelf, btn);      // (the latch on the north wall, the shelf on the east: P6c)
      const lp = cellPos(R, 3, 0); wayUp(room, lp.x, lp.z);
      room.ladder = room.way.lad; room.ladder.visible = true; room.ladder.scale.y = 0.12;     // (rolled up and tied off: it shows)
      [[0, 4], [6, 5]].forEach(([c, r]) => { const p = cellPos(R, c, r); pile(g, p.x, p.z); WORLD.extra.push({ x: p.x, z: p.z, r: 0.95 }); });
      // Trigo, the miller's grandkid, hiding up here from the Hush: on a sack by the latch wall, a pocketful of pebbles
      const kid = kidModel();
      if (kid) {
        const tx = R.x - 5.6, tz = R.z - 1.3; g.add(kid.root);
        const yaw = Math.atan2(room.latch.x - tx, room.latch.z - tz);
        room.trigo = { model: kid, N: { x: tx, y: Y0, z: tz, yaw, talk: 0, wave: false }, p: { id: 'trigo', name: 'Trigo', x: tx, z: tz, y: Y0, top: 1.2, talking: false } };
        const sk = sackMesh(g); sk.position.set(tx - 0.5, Y0, tz + 0.6); sk.scale.setScalar(0.7);
        WORLD.extra.push({ x: tx, z: tz, r: 0.45 }, { x: tx - 0.5, z: tz + 0.6, r: 0.5 });
      }
    }
    // 3 · the bell cap: the great bell under a beam, and the big one curled around its frame
    {
      const room = rooms[3], R = room.R, g = room.g;
      g.add(part(GEO.box, '#6b4a2e', [R.x, Y0 + WH - 0.5, R.z - 2.2], [HW * 2 - 0.4, 0.5, 0.6], { ink: 0.012 }));
      [[-2.6], [2.6]].forEach(([dx]) => g.add(part(GEO.box, '#6b4a2e', [R.x + dx, Y0 + (WH - 0.5) / 2, R.z - 2.2], [0.4, WH - 0.5, 0.4], { ink: 0.012 })));
      const piv = grp(g, R.x, Y0 + 4.3, R.z - 2.2); const bell = bellMesh(piv); bell.scale.setScalar(1.15);      // (hung low enough to see from the usual camera)
      g.add(part(GEO.cyl, '#5d4027', [R.x, Y0 + 4.75, R.z - 2.2], [0.09, 0.9, 0.09], { ink: 0 }));
      room.bell = { piv, x: R.x, z: R.z - 2.2, swing: 0 };
      WORLD.extra.push({ x: R.x - 2.6, z: R.z - 2.2, r: 0.35 }, { x: R.x + 2.6, z: R.z - 2.2, r: 0.35 });
      // (P6c: "make us ring the bell to trigger the fight") the bell's rope: an arm off the yoke, a rope down beside the bell to a
      // red-and-cream grip at hand height. E there rings it (ringToWake); after the fight, Mimo rings it for real
      const rp = { x: R.x - 1.35, z: R.z - 2.2 };
      g.add(part(GEO.box, '#6b4a2e', [R.x - 0.7, Y0 + 4.5, rp.z], [1.45, 0.12, 0.14], { ink: 0.008 }));
      const rope = grp(g, rp.x, Y0, rp.z), rline = grp(rope, 0, 4.45, 0);      // (it hangs from the arm's end; a pull slides it down)
      rline.add(part(GEO.cyl, '#d8c08a', [0, -1.5, 0], [0.055, 3.0, 0.055], { ink: 0.008 }));
      rline.add(part(GEO.cyl, '#c9553f', [0, -3.05, 0], [0.12, 0.62, 0.12], { ink: 0.012 }));
      [-2.78, -3.32].forEach(y => rline.add(part(GEO.cyl, '#f1e8d4', [0, y, 0], [0.125, 0.1, 0.125], { ink: 0 })));
      rline.add(part(GEO.sphere, '#b8a070', [0, -3.45, 0], [0.13, 0.12, 0.13], { ink: 0.01 }));
      room.rope = { g: rope, line: rline, x: rp.x, z: rp.z, y0: 4.45 };
      WORLD.extra.push({ x: rp.x, z: rp.z, r: 0.16 });
      if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) {     // (gold bands, like the bell it guards: the same one as in the fight)
        try { const b = BATTLE.buildFoe('armadillo', 'yellow', { size: 'big' }); b.scale.multiplyScalar(2.8); b.position.set(R.x + 1.8, Y0, R.z - 0.4); b.rotation.y = -0.6; b.userData.curl = true; b.userData.mood = 'asleep'; g.add(b); room.boss = b; }
        catch (e) { console.warn('[mill] boss model', e); }
      }
      room.bossSolid = { x: R.x + 1.8, z: R.z - 0.4, r: 2.0 }; WORLD.extra.push(room.bossSolid);
      room.page = grp(g, R.x - 2.2, Y0, R.z - 3.4); room.page.visible = false;
      room.page.add(part(GEO.box, '#8a5f3e', [0, 0.65, 0], [0.16, 1.3, 0.16], { ink: 0 }));
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ color: '#fffaf0', side: THREE.DoubleSide })); sheet.position.set(0, 1.05, 0.1); sheet.rotation.z = 0.08; room.page.add(sheet);
      const pg = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3b0', transparent: true, opacity: 0.5, depthWrite: false })); pg.scale.setScalar(1.3); pg.position.set(0, 1.05, 0.15); room.page.add(pg); room.pageGlow = pg;
    }
    applyState();
  }
  // ------------------------------------------------------------ the way up (DESIGN.md 16: "a black square opens… no signal")
  // A trapdoor in a beam frame in the ceiling by the north wall, shut until the floor's puzzle is solved; then (openWay) a chime,
  // the lid swings down, the dark hole shows, a wooden ladder slides down through it to the floor with a clatter, and a gold arrow
  // bobs over its foot (with the E "Climb" prompt when you're near). room.up is the ladder's foot.
  const LEAN = 0.12;                       // (the ladder leans out from the wall a little, so it reads as a ladder from above)
  let ARROW = null;
  function arrowTex() {
    if (ARROW) return ARROW;
    ARROW = TK.canvasTex(128, 160, c => {
      c.lineJoin = 'round';
      const path = () => { c.beginPath(); c.moveTo(64, 10); c.lineTo(118, 70); c.lineTo(86, 70); c.lineTo(86, 112); c.lineTo(42, 112); c.lineTo(42, 70); c.lineTo(10, 70); c.closePath(); };
      path(); c.lineWidth = 14; c.strokeStyle = '#2b2235'; c.stroke(); c.fillStyle = '#ffcf45'; c.fill();
      c.font = '900 30px "Trebuchet MS", sans-serif'; c.textAlign = 'center'; c.lineWidth = 8; c.strokeText('Climb', 64, 148); c.fillStyle = '#fffaf0'; c.fillText('Climb', 64, 148);
    });
    return ARROW;
  }
  function wayUp(room, x, z) {
    const g = room.g, top = Y0 + WH - 0.12, len = WH - 0.12;
    const fr = grp(g, x, top, z);
    [[0, -0.95, 2.1, 0.2], [0, 0.95, 2.1, 0.2], [-0.95, 0, 0.2, 1.7], [0.95, 0, 0.2, 1.7]].forEach(([dx, dz, w, d]) => fr.add(part(GEO.box, '#5d4027', [dx, 0, dz], [w, 0.26, d], { ink: 0.01 })));
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ color: '#120c08', side: THREE.DoubleSide }));
    hole.rotation.x = Math.PI / 2; hole.position.y = 0.06; hole.visible = false; fr.add(hole);
    // the lid, hinged on its north edge: shut it lies in the frame; open it hangs down against the wall
    const lid = grp(fr, 0, -0.03, -0.85);
    lid.add(part(GEO.box, '#8d6a46', [0, 0, 0.85], [1.7, 0.1, 1.7], { ink: 0.012 }));
    [-0.45, 0.45].forEach(dx => lid.add(part(GEO.box, '#6b4a2e', [dx, -0.07, 0.85], [0.14, 0.05, 1.6], { ink: 0 })));
    // the ladder, from the trapdoor down to the floor; rolled up out of sight (scale.y from its top) until it drops
    const lad = grp(g, x, top, z + 0.1);
    [-0.42, 0.42].forEach(dx => lad.add(part(GEO.box, '#a8743f', [dx, -len / 2, 0], [0.12, len, 0.12], { ink: 0.01 })));
    for (let k = 0; k < 9; k++) lad.add(part(GEO.box, '#c79d6d', [0, -0.45 - k * 0.58, 0], [0.84, 0.09, 0.1], { ink: 0.008 }));
    lad.rotation.x = -LEAN; lad.scale.y = 0.001; lad.visible = false;
    const foot = { x, z: z + 0.1 + len * Math.sin(LEAN) };
    const arrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex(), transparent: true, depthWrite: false, depthTest: false }));
    arrow.scale.set(0.95, 1.2, 1); arrow.position.set(foot.x, Y0 + 2.1, foot.z + 0.2); arrow.visible = false; arrow.renderOrder = 5; g.add(arrow);
    // (P6c: "make the ladder… unable to be walked through") down, it's solid: a box from the wall to just past its foot (parked
    // far away while it's rolled up)
    const z0 = z - 1.0, z1 = foot.z + 0.15, solid = { obox: 1, x: 1e5, z: 1e5, hw: 0.55, hd: (z1 - z0) / 2, rot: 0, id: 'mill-ladder' };
    WORLD.extra.push(solid);
    room.way = { fr, lid, hole, lad, arrow, x, z, foot, open: false, solid, solidAt: { x, z: (z0 + z1) / 2 } };
    room.up = { x: foot.x, z: foot.z + 0.5 };
    return room.way;
  }
  const ladderSolid = (w, on) => { if (w && w.solid) { w.solid.x = on ? w.solidAt.x : 1e5; w.solid.z = on ? w.solidAt.z : 1e5; } };
  // the puzzle's solved: chime, the lid swings down, the ladder slides down through the hole and lands; the arrow shows
  async function openWay(room, instant) {
    const w = room && room.way; if (!w || w.open) return; w.open = true;
    w.hole.visible = true;
    const s0 = w.lad.visible ? w.lad.scale.y : 0.001; w.lad.visible = true; w.lad.rotation.z = 0;     // (the sail loft's is rolled up already)
    if (instant) { w.lid.rotation.x = Math.PI / 2 * 0.97; w.lad.scale.y = 1; w.arrow.visible = true; ladderSolid(w, true); return; }
    chime();
    await tween(0.45, k => { w.lid.rotation.x = Math.PI / 2 * 0.97 * k * k; });
    Sound.play('wood'); Sound.play('swoosh');
    await tween(0.6, k => { w.lad.scale.y = Math.max(0.001, s0 + (1 - s0) * k * k); });
    Sound.play('land', 11); G.w3d.fx.puff(w.foot.x, Y0 + 0.1, w.foot.z, 12, 0.32, '#e8dcc4'); ladderSolid(w, true);
    await tween(0.2, k => { w.lad.scale.y = 1 + Math.sin(k * Math.PI) * 0.035; });
    w.lad.scale.y = 1; w.arrow.visible = true;
  }
  // after a load (or a reset): put each room the way the saved progress says
  function applyState() {
    const st = S(), r0 = rooms[0], r1 = rooms[1], r2 = rooms[2], r3 = rooms[3];
    if (st.grain) { r0.sacks.forEach((o, i) => { const [c, r] = [[2, 1], [4, 1]][i], p = cellPos(r0.R, c, r); o.c = c; o.r = r; place(o, p.x, p.z); }); openWay(r0, true); }
    if (st.gear) socketCog(true);
    if (st.crate) { r1.crate.g.visible = false; unsolid(r1.crate); }
    if (st.gear) openWay(r1, true);
    if (st.latch) r2.latch.arm.rotation.z = -0.9;
    if (st.button) r2.button.cap.scale.y = 0.35;
    if (st.latch && st.button) openWay(r2, true);
    if (st.boss && r3.boss) { r3.boss.visible = false; unsolid(r3.bossSolid); }
    if (st.boss) r3.page.visible = !st.page;
  }

  // ------------------------------------------------------------ the grid
  const has = (list, c, r) => list.some(([a, b]) => a === c && b === r);
  function free(room, c, r, self) {
    if (c < 0 || c > 6 || r < 0 || r > 5) return false;
    if (has(room.solid, c, r) || has(room.noPush, c, r)) return false;
    return !room.movers.some(o => o !== self && o.c === c && o.r === r);
  }
  // Mimo shoves a thing one cell, away from you
  async function shove(room, o) {
    const Y = G.sim.you, M = G.sim.mimo, dx = o.x - Y.x, dz = o.z - Y.z;
    const d = Math.abs(dx) > Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz)];
    G.sim.mimoGo({ x: o.x - d[0] * 1.4, z: o.z - d[1] * 1.4 }, { x: o.x, z: o.z });
    await wait(0.6);
    M.hop = { t: 0 }; Sound.play('land', 9);
    const to = [o.c + d[0], o.r + d[1]];
    if (!free(room, to[0], to[1], o)) {
      await tween(0.24, k => { const s = Math.sin(k * Math.PI) * 0.14; o.g.position.x = o.x + d[0] * s; o.g.position.z = o.z + d[1] * s; });
      place(o, o.x, o.z, o.g.position.y); STORY.think('It won’t go that way.', 2.5); G.sim.mimoGo(null, null); return false;
    }
    const p0 = { x: o.x, z: o.z }, p1 = cellPos(room.R, to[0], to[1]), y = o.g.position.y;
    o.c = to[0]; o.r = to[1];
    await tween(0.42, k => { const e = k * k * (3 - 2 * k); place(o, lerp(p0.x, p1.x, e), lerp(p0.z, p1.z, e), y); if (o.kind === 'cog') o.g.rotation.y += 0.05; });
    G.w3d.fx.puff(p1.x, Y0 + 0.1, p1.z, 6, 0.22, '#f4ead6');
    G.sim.mimoGo(null, null);
    return true;
  }
  async function checkPlates() {
    const room = rooms[0], on = room.plates.map(p => room.sacks.some(o => o.c === p.c && o.r === p.r));
    on.forEach((v, i) => { room.plates[i].on = v; });
    if (on.every(Boolean) && !S().grain) {
      S().grain = true;
      UI.toast('Click! A trapdoor opens in the ceiling, and a ladder drops down.'); G.save();
      G.sim.lock = 1;
      await openWay(room);
      G.sim.lock = 0;
      if (lessonDue()) await climbLesson();         // (P6c: the noise brings Trigo out of hiding, and he shows «trepa»)
    }
  }
  function resetSacks() {
    const room = rooms[0];
    if (S().grain) return;
    room.sacks.forEach(o => { const p = cellPos(room.R, o.c0, o.r0); o.c = o.c0; o.r = o.r0; place(o, p.x, p.z); G.w3d.fx.puff(p.x, Y0 + 0.2, p.z, 6, 0.2, '#f4ead6'); });
    Sound.play('click'); tween(0.4, k => { room.lever.arm.rotation.x = 0.5 - Math.sin(k * Math.PI) * 1.0; });
    checkPlates();
  }
  function socketCog(instant) {
    const room = rooms[1], o = room.cog, s = room.socket;
    unsolid(o);
    const done = () => { o.g.position.set(s.x, Y0 + 2.3, s.z); o.g.rotation.set(Math.PI / 2, 0, 0); };
    if (instant) { done(); return Promise.resolve(); }
    const p0 = o.g.position.clone();
    return tween(0.9, k => { const e = k * k * (3 - 2 * k); o.g.position.set(lerp(p0.x, s.x, e), lerp(p0.y, Y0 + 2.3, e) + Math.sin(k * Math.PI) * 0.8, lerp(p0.z, s.z, e)); o.g.rotation.x = Math.PI / 2 * e; }).then(done);
  }

  // ------------------------------------------------------------ telling Mimo (the verb is the key)
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${G.state.mimoName} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  // t: { kind, verb (the one that works), icon, title, hint, right(), wrong(verb) }
  async function tell(t) {
    let verb = quick[t.kind] || null, ms = 0;
    if (!verb) {
      const r = await UI.command({ name: G.state.mimoName, icon: t.icon, title: t.title, verbs: VERBS, answer: t.verb });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); G.sim.mimo.tiltT = 1.4; STORY.think('{mimo} tilts its head. ' + t.hint, 4); return; }
      verb = r.verb; ms = r.ms;
      if (verb === t.verb) quick[t.kind] = verb;
    }
    if (verb === t.verb || LEX.taught(verb)) learnUse(verb, ms);
    if (verb !== t.verb) { await wrong(t, verb); return; }
    await t.right();
  }
  // a verb that doesn't do the job: Mimo still does it, harmlessly (and it's still practice)
  async function wrong(t, verb) {
    const M = G.sim.mimo, at = t.at ? t.at() : { x: G.sim.you.x, z: G.sim.you.z };
    G.sim.mimoGo({ x: at.x + 1.2, z: at.z + 1.2 }, at); await wait(0.6);
    if (verb === 'v.jump') { M.hop = { t: 0 }; Sound.play('jump'); STORY.think('{mimo} hops up and down. Nothing happens.', 3); }
    else if (verb === 'v.hit') { Sound.play('hit'); M.sad = 1.2; G.w3d.fx.puff(at.x, Y0 + 0.8, at.z, 8, 0.25, '#f4ead6'); STORY.think(t.kind === 'sack' ? 'Poof! A cloud of flour. The sack doesn’t move.' : '{mimo} bonks it. Ouch! Nothing moves.', 3); }
    else if (verb === 'v.throw') { Sound.play('whiff'); STORY.think('{mimo} throws a pebble at it. Plink. Nothing.', 3); }
    else if (verb === 'v.push') { Sound.play('land', 6); STORY.think('{mimo} pushes with all its might. It doesn’t budge.', 3); }
    else if (verb === 'v.eat') { STORY.think('{mimo} sniffs it… and decides it’s not food.', 3); }
    else if (verb === 'v.swim') { M.sad = 1; STORY.think('{mimo} paddles its paws in the air. There’s no water up here!', 3); }
    else if (verb === 'v.climb') { M.hop = { t: 0 }; Sound.play('climb'); STORY.think(t.kind === 'sack' ? '{mimo} climbs up onto the sack… and slides back down. It doesn’t move.' : '{mimo} looks for something to climb. Not here.', 3); }
    G.sim.mimoGo(null, null);
  }
  // Mimo flies along an arc (to a shelf, up to the bell…): the simulation lets go of it meanwhile
  async function mimoArc(to, y1, dur = 0.7) {
    const M = G.sim.mimo, root = G.cast.mimo.root, p0 = root.position.clone();
    M.hidden = true;
    await tween(dur, k => { root.position.set(lerp(p0.x, to.x, k), lerp(p0.y, y1, k) + Math.sin(k * Math.PI) * 1.3, lerp(p0.z, to.z, k)); });
    Sound.play('pip');
  }
  async function mimoLand() {
    const M = G.sim.mimo, Y = G.sim.you, root = G.cast.mimo.root, p0 = root.position.clone(), to = { x: Y.x + 1.1, z: Y.z + 0.6 };
    await tween(0.55, k => { root.position.set(lerp(p0.x, to.x, k), lerp(p0.y, Y0, k) + Math.sin(k * Math.PI) * 0.8, lerp(p0.z, to.z, k)); });
    M.x = to.x; M.z = to.z; M.y = M.ry = Y0; M.hidden = false; M.land = 0; Sound.play('land', 4);
  }

  // ------------------------------------------------------------ what you can press E on, room by room
  function interactables() {
    const list = [], st = S(), room = rooms[cur]; if (!room) return list;
    const R = room.R, name = G.state.mimoName;
    const say = kind => quick[kind] ? `«${ex(LEX.form(quick[kind]))}»` : `Tell ${name}`;
    // out, or down
    list.push({ x: R.x, z: R.z + HD - 0.9, r: 1.7, label: cur === 0 ? 'Leave the mill' : 'Go down', run: () => (cur === 0 ? leave() : go(cur - 1, 'above')) });
    if (cur === 0) {
      if (!st.grain) {
        room.sacks.forEach(o => list.push({ x: o.x, z: o.z, r: 2.25, label: say('sack'), run: () => tell({ kind: 'sack', verb: 'v.push', icon: 'push', at: () => o,
          title: `A heavy flour sack. What should ${name} do?`, hint: 'Maybe it could move the sack…', right: async () => { if (await shove(room, o)) await checkPlates(); } }) }));
        list.push({ x: room.lever.x, z: room.lever.z, r: 1.4, label: 'Put the sacks back', run: async () => resetSacks() });
      } else list.push(climbItem(room, 1));
      if (room.trigo && room.trigo.model.root.visible) list.push({ x: room.trigo.N.x, z: room.trigo.N.z + 0.9, r: 1.7, label: 'Talk', run: () => (lessonDue() ? climbLesson() : trigoSay('climbBye', 0)) });
    }
    if (cur === 1) {
      const o = room.cog;
      if (!st.gear) list.push({ x: o.x, z: o.z, r: 2.35, label: say('cog'), run: () => tell({ kind: 'cog', verb: 'v.push', icon: 'push', at: () => o,
        title: `The big cog fell off its axle. What should ${name} do?`, hint: 'The cog belongs up on the north wall…',
        right: async () => { if (await shove(room, o) && o.c === room.socket.c && o.r === room.socket.r) await gearsTurn(); } }) });
      if (!st.crate) list.push({ x: room.crate.x, z: room.crate.z, r: 2.3, label: say('crate'), run: () => tell({ kind: 'crate', verb: 'v.hit', icon: 'hit', at: () => room.crate,
        title: `A cracked old crate blocks the stairs. What should ${name} do?`, hint: 'It’s cracked already. One good whack…', right: breakCrate }) });
      if (st.gear && st.crate) list.push(climbItem(room, 2));
      else if (st.crate && !st.gear) list.push({ x: room.up.x, z: room.up.z, r: 1.8, label: 'Look', run: async () => STORY.think('A trapdoor up in the ceiling, shut tight. It’s linked to the mill’s gears…', 4) });
    }
    if (cur === 2) {
      if (!st.latch) list.push({ x: room.latch.x, z: room.latch.z + 3, r: 3.4, label: say('latch'), run: () => tell({ kind: 'latch', verb: 'v.throw', icon: 'throw', at: () => ({ x: room.latch.x, z: room.latch.z + 1.5 }),
        title: `The ladder’s latch is way up on the wall. What should ${name} do?`, hint: 'It’s too high to reach. Maybe something could fly up there…', right: throwAtLatch }) });
      if (!st.button) list.push({ x: room.shelf.x - 1.6, z: room.shelf.z, r: 2.4, label: say('button'), run: () => tell({ kind: 'button', verb: 'v.jump', icon: 'jump', at: () => ({ x: room.shelf.x - 1.4, z: room.shelf.z }),
        title: `A big red button, up on the shelf. What should ${name} do?`, hint: 'The shelf isn’t that high, for someone bouncy…', right: jumpOnButton }) });
      if (st.latch && st.button) list.push(climbItem(room, 3));
      const T = room.trigo; if (T) list.push({ x: T.N.x + 0.9, z: T.N.z + 0.6, r: 1.7, label: 'Talk', run: trigoTalk });
    }
    if (cur === 3) {
      // (P6c: "its very hard to trigger the fight… make us ring the bell to trigger the fight") one clear spot, by the bell's rope
      const rp = room.rope, at = { x: rp.x, z: rp.z + 1.15 };
      if (!st.boss) list.push({ x: at.x, z: at.z, y: Y0 + 1.3, r: 2.4, label: 'Ring the bell', run: ringToWake });      // (y: the prompt sits over the rope's grip)
      else if (!st.page) list.push({ x: room.page.position.x, z: room.page.position.z + 0.6, r: 2.0, label: 'Read', run: readPage });
      else if (!st.bell) list.push({ x: at.x, z: at.z, y: Y0 + 1.3, r: 2.4, label: quick.bell ? `Ring the bell · «${ex(LEX.form(quick.bell))}»` : 'Ring the bell', run: () => tell({ kind: 'bell', verb: 'v.hit', icon: 'hit', at: () => ({ x: room.bell.x, z: room.bell.z + 1.2 }),
        title: `The Hush has let go of the great bell. Ring it for real! What should ${name} do?`, hint: 'The rope only made it clonk. A bell rings when something strikes it…', right: ringBell }) });
    }
    for (const it of list) if (it.y === undefined) it.y = Y0;      // (P6c: the E prompt shows at the thing, up here, not 300 below)
    return list;
  }
  // where the compass points inside: the next thing to do in this room
  function target() {
    const st = S(), room = rooms[cur]; if (!room) return null;
    if (cur === 0) { if (st.grain) return room.up; const p = room.plates.find(pl => !pl.on); return p ? cellPos(room.R, p.c, p.r) : room.up; }
    if (cur === 1) return !st.gear ? { x: room.cog.x, z: room.cog.z } : !st.crate ? room.crate : room.up;
    if (cur === 2) return !st.latch ? { x: room.latch.x, z: room.latch.z + 2 } : !st.button ? { x: room.shelf.x - 1, z: room.shelf.z } : room.up;
    if (cur === 3) return !st.page && st.boss ? { x: room.page.position.x, z: room.page.position.z } : { x: room.rope.x, z: room.rope.z + 0.6 };
    return null;
  }

  // ------------------------------------------------------------ the actions
  async function gearsTurn() {
    const room = rooms[1];
    G.sim.lock = 1;
    await socketCog(false);
    S().gear = true; Sound.play('land', 14);
    await wait(0.4);
    await openWay(room);
    G.sim.lock = 0;
    UI.toast(S().crate ? 'The gears catch! The trapdoor opens, and the ladder drops down.' : 'The gears catch! A ladder drops down… behind the cracked crate.'); G.save();
  }
  async function breakCrate() {
    const room = rooms[1], c = room.crate, M = G.sim.mimo;
    G.sim.mimoGo({ x: c.x - 1.3, z: c.z + 0.6 }, c); await wait(0.6);
    M.hop = { t: 0 }; Sound.play('hit'); await wait(0.25);
    Sound.play('poof'); G.w3d.fx.puff(c.x, Y0 + 0.7, c.z, 16, 0.35, '#b07a48');
    await tween(0.25, k => c.g.scale.setScalar(1 - k));
    c.g.visible = false; unsolid(c); S().crate = true; G.sim.mimoGo(null, null); G.save();
    if (S().gear) { chime(); UI.toast('The way to the ladder is clear!'); }     // (the floor's last piece: the chime again)
  }
  async function throwAtLatch() {
    const room = rooms[2], L = room.latch, M = G.sim.mimo;
    G.sim.mimoGo({ x: L.x + 0.6, z: L.z + 3.2 }, { x: L.x, z: L.z }); await wait(0.7);
    const pebble = part(GEO.ico1, '#a3a196', [0, 0, 0], [0.16, 0.14, 0.15], { ink: 0.01 }); G.w3d.scene.add(pebble);
    const p0 = V(M.x, Y0 + 0.9, M.z), p1 = V(L.x, L.y, L.z + 0.2);
    M.hop = { t: 0 }; Sound.play('whiff');
    await tween(0.55, k => { pebble.position.set(lerp(p0.x, p1.x, k), lerp(p0.y, p1.y, k) + Math.sin(k * Math.PI) * 1.4, lerp(p0.z, p1.z, k)); pebble.rotation.x += 0.4; });
    Sound.play('click'); G.w3d.fx.sparkle(p1.x, p1.y, p1.z, 10);
    await tween(0.3, k => { L.arm.rotation.z = lerp(0.9, -0.9, k); });
    await tween(0.5, k => { pebble.position.y = lerp(p1.y, Y0 + 0.1, k * k); });
    G.w3d.scene.remove(pebble);
    S().latch = true; G.sim.mimoGo(null, null); await afterLoft();
  }
  async function jumpOnButton() {
    const room = rooms[2], B = room.shelf;
    G.sim.mimoGo({ x: B.x - 1.5, z: B.z }, B); await wait(0.6);
    await mimoArc({ x: B.x, z: B.z }, B.y + 0.15, 0.6);
    Sound.play('land', 8); await tween(0.15, k => { room.button.cap.scale.y = lerp(1, 0.35, k); });
    Sound.play('click'); G.w3d.fx.sparkle(B.x, B.y + 0.4, B.z, 10);
    await wait(0.4); await mimoLand();
    S().button = true; await afterLoft();
  }
  async function afterLoft() {
    const room = rooms[2], st = S();
    if (st.latch && st.button) { UI.toast('The trapdoor opens, and the ladder drops down!'); await openWay(room); G.save(); await trigoSay('cheer'); }
    else UI.toast(st.latch ? 'Clack! One latch open. One to go…' : 'Click! One latch open. One to go…');
    G.save();
  }

  // ------------------------------------------------------------ Trigo, in the sail loft: «lanza» before the latch asks for it
  // (DESIGN.md 16: "lanza when in the mill… The only way I knew what word to use was by saying IDK".) The miller's grandkid hid up
  // here from the Hush. The first time you come up, Trigo shows you: «¡Mira! Lanzo una piedrita…» (a pebble at the latch: too
  // short), then «¡Lanza!» to Mimo, every line whole in the language with the English under it, and Mimo learns the word watching
  // (STORY.teachWord: you type it from what you just heard). Talk to Trigo again any time. Trigo = wheat: zh 小麦, ja コムギ.
  const TRIGO = {
    name: { zh: '[小麦|Xiǎo mài]', ja: 'コムギ' },
    hello: { en: 'Hi! I’m {trigo}. My grandpa is the miller. I’m hiding up here from the Hush.', es: '¡Hola! Soy Trigo. Mi abuelo es el molinero. Me escondo aquí del Silencio.',
      pt: 'Oi! Eu sou o Trigo. Meu avô é o moleiro. Eu me escondo aqui do Silêncio.', de: 'Hallo! Ich bin Trigo. Mein Opa ist der Müller. Ich verstecke mich hier vor der Stille.',
      zh: '[你好|nǐ hǎo] ！ [我|wǒ] [叫|jiào] [小麦|Xiǎo mài] 。 [我|wǒ] [爷爷|yé ye] [开|kāi] [磨坊|mò fáng] 。 [我|wǒ] [在|zài] [这里|zhè lǐ] [躲|duǒ] [寂静|jì jìng] 。',
      ja: 'こんにちは ！ ぼく は コムギ 。 おじいちゃん は [粉屋|こなや] さん だ よ 。 [静寂|せいじゃく] から [隠|かく]れて る んだ 。' },
    demo: { en: 'Look! I throw a pebble… oops! It doesn’t reach.', es: '¡Mira! Lanzo una piedrita… ¡uy! No llega.', pt: 'Olha! Eu jogo uma pedrinha… ai! Não chega.', de: 'Schau! Ich werfe ein Steinchen… oh! Zu kurz.',
      zh: '[看|kàn] ！ [我|wǒ] [扔|rēng] [一|yī] [颗|kē] [小|xiǎo] [石子|shí zǐ] … [哎呀|āi yā] ！ [扔|rēng] [不|bù] [到|dào] 。', ja: '[見|み]て ！ [小石|こいし] を [投|な]げる よ … あっ ！ [届|とど]かない 。' },
    cue: { en: 'You can do it! Throw the pebble at the latch! Throw!', es: '¡Tú puedes! ¡Lanza la piedrita al pestillo! ¡Lanza!', pt: 'Você consegue! Joga a pedrinha na trava! Joga!', de: 'Du schaffst das! Wirf das Steinchen an den Riegel! Wirf!',
      zh: '[你|nǐ] [可以|kě yǐ] [的|de] ！ [把|bǎ] [石子|shí zǐ] [扔|rēng] [到|dào] [门闩|mén shuān] [上|shàng] ！ [扔|rēng] ！', ja: 'きみ なら できる ！ [小石|こいし] を かけがね に [投|な]げて ！ [投|な]げて ！' },
    // (P6c: "trigo says <<throw>> instead of the word for throw in target language": {v.throw} in the English is the word Mimo
    // was taught, in the language, «lanza» / «rēng» (trigoSay); «…» is never swapped by the weave, so it used to stay English)
    good: { en: 'Yes! You know «{v.throw}» now. The latch is way up there…', es: '¡Eso! Ya sabes «lanza». El pestillo está allá arriba…', pt: 'Isso! Agora você sabe «joga». A trava está lá em cima…', de: 'Genau! Jetzt kannst du «wirf». Der Riegel ist da oben…',
      zh: '[对|duì] ！ [你|nǐ] [会|huì] “ [扔|rēng] ” [了|le] 。 [门闩|mén shuān] [在|zài] [上面|shàng miàn] …', ja: 'そう ！ 「 [投|な]げて 」 を [覚|おぼ]えた ね 。 かけがね は あそこ だ よ …' },
    cheer: { en: 'Hooray! The ladder! I’ll wait here. Good luck up there!', es: '¡Bravo! ¡La escalera! Yo espero aquí. ¡Suerte allá arriba!', pt: 'Eba! A escada! Eu espero aqui. Boa sorte lá em cima!', de: 'Juhu! Die Leiter! Ich warte hier. Viel Glück da oben!',
      zh: '[太|tài] [棒|bàng] [了|le] ！ [梯子|tī zi] [下来|xià lái] [了|le] ！ [我|wǒ] [在|zài] [这里|zhè lǐ] [等|děng] 。 [上面|shàng miàn] [加油|jiā yóu] ！', ja: 'やった ！ はしご だ ！ ぼく は ここ で [待|ま]ってる 。 [上|うえ] で がんばって ！' },
    later: { en: 'Grandpa says the big armadillo sleeps right by the bell. Be careful!', es: 'Mi abuelo dice que el armadillo grande duerme junto a la campana. ¡Cuidado!',
      pt: 'Meu avô diz que o tatu grande dorme do lado do sino. Cuidado!', de: 'Opa sagt, das große Gürteltier schläft direkt neben der Glocke. Pass auf!',
      zh: '[爷爷|yé ye] [说|shuō] [大|dà] [犰狳|qiú yú] [就|jiù] [睡|shuì] [在|zài] [钟|zhōng] [旁边|páng biān] 。 [小心|xiǎo xīn] ！', ja: 'おじいちゃん が [言|い]う に は 、 [大|おお]きい アルマジロ が [鐘|かね] の そば で [寝|ね]てる って 。 [気|き] を つけて ！' },
    // (P6c) the grain store: he pops out when the first ladder drops, and shows «trepa» (climbDemo and climbCue are demonstrations:
    // whole in the language, the word marked; the rest are mixed by the weave like every line)
    hello0: { en: 'Hi! I’m {trigo}. My grandpa is the miller. The Hush scared me, so I hid down here!', es: '¡Hola! Soy Trigo. Mi abuelo es el molinero. ¡El Silencio me asustó y me escondí aquí abajo!',
      pt: 'Oi! Eu sou o Trigo. Meu avô é o moleiro. O Silêncio me assustou, e eu me escondi aqui embaixo!', de: 'Hallo! Ich bin Trigo. Mein Opa ist der Müller. Die Stille hat mir Angst gemacht, da hab ich mich hier unten versteckt!',
      zh: '[你好|nǐ hǎo] ！ [我|wǒ] [叫|jiào] [小麦|Xiǎo mài] 。 [我|wǒ] [爷爷|yé ye] [开|kāi] [磨坊|mò fáng] 。 [我|wǒ] [怕|pà] [寂静|jì jìng] ， [就|jiù] [躲|duǒ] [在|zài] [这里|zhè lǐ] ！',
      ja: 'こんにちは ！ ぼく は コムギ 。 おじいちゃん は [粉屋|こなや] さん だ よ 。 [静寂|せいじゃく] が こわくて 、 ここ に [隠|かく]れて た んだ ！' },
    climbDemo: { en: 'The ladder! Look… up I go! Climb, {trigo}, climb!', es: '¡La escalera! Mira… ¡arriba! ¡Trepa, Trigo, trepa!', pt: 'A escada! Olha… pra cima! Sobe, Trigo, sobe!', de: 'Die Leiter! Schau… nach oben! Kletter, Trigo, kletter!',
      zh: '[梯子|tī zi] ！ [你|nǐ] [看|kàn] … [往上|wǎng shàng] ！ [爬|pá] ， [小麦|Xiǎo mài] ， [爬|pá] ！', ja: 'はしご だ ！ [見|み]て … よいしょ ！ [登|のぼ]って 、 コムギ 、 [登|のぼ]って ！' },
    climbCue: { en: 'Your turn, {mimo}! Climb! Climb the ladder!', es: '¡Ahora tú, {mimo}! ¡Trepa! ¡Trepa por la escalera!', pt: 'Agora você, {mimo}! Sobe! Sobe a escada!', de: 'Jetzt du, {mimo}! Kletter! Kletter die Leiter hoch!',
      zh: '[该|gāi] [你|nǐ] [了|le] ！ [爬|pá] ！ [爬|pá] [梯子|tī zi] ！', ja: 'つぎ は きみ の [番|ばん] ！ [登|のぼ]って ！ はしご を [登|のぼ]って ！' },
    climbYes: { en: 'Yes! You know «{v.climb}» now!', es: '¡Eso! ¡Ya sabes «trepa»!', pt: 'Isso! Agora você sabe «sobe»!', de: 'Genau! Jetzt kannst du «kletter»!',
      zh: '[对|duì] ！ [你|nǐ] [会|huì] “ [爬|pá] ” [了|le] ！', ja: 'そう ！ 「 [登|のぼ]って 」 を [覚|おぼ]えた ね ！' },
    climbBye: { en: 'You two go first, something’s rustling up there… I know a secret way up. See you upstairs!', es: 'Vayan ustedes primero, que algo se mueve allá arriba… Yo conozco un camino secreto. ¡Nos vemos arriba!',
      pt: 'Vão vocês primeiro, que tem alguma coisa mexendo lá em cima… Eu conheço um caminho secreto. A gente se vê lá em cima!', de: 'Geht ihr zuerst, da oben raschelt was… Ich kenne einen geheimen Weg. Wir sehen uns oben!',
      zh: '[你们|nǐ men] [先|xiān] [上去|shàng qù] 。 [上面|shàng miàn] [有|yǒu] [声音|shēng yīn] … [我|wǒ] [知道|zhī dào] [一|yī] [条|tiáo] [秘密|mì mì] [的|de] [路|lù] 。 [上面|shàng miàn] [见|jiàn] ！',
      ja: 'きみ たち が [先|さき] に [行|い]って 。 [上|うえ] で [何|なに]か [音|おと] が する … ぼく は ひみつ の [道|みち] を [知|し]って る 。 [上|うえ] で ね ！' },
    // the sail loft, when you met him downstairs
    again: { en: 'You made it! I came up my secret way, the old flour chute. Grandpa showed me!', es: '¡Llegaron! Yo subí por mi camino secreto: el viejo tubo de la harina. ¡Me lo enseñó mi abuelo!',
      pt: 'Vocês chegaram! Eu subi pelo meu caminho secreto: o velho tubo da farinha. Foi o meu avô que me mostrou!', de: 'Ihr habt es geschafft! Ich bin meinen geheimen Weg hochgekommen, durch den alten Mehlschacht. Opa hat ihn mir gezeigt!',
      zh: '[你们|nǐ men] [来|lái] [了|le] ！ [我|wǒ] [走|zǒu] [秘密|mì mì] [的|de] [路|lù] [上来|shàng lái] [的|de] ， [就是|jiù shì] [旧|jiù] [面粉|miàn fěn] [管道|guǎn dào] 。 [是|shì] [爷爷|yé ye] [教|jiāo] [我|wǒ] [的|de] ！',
      ja: '[来|き]た ね ！ ぼく は ひみつ の [道|みち] で [来|き]た んだ 。 [古|ふる]い [粉|こな] の パイプ だ よ 。 おじいちゃん に [教|おし]えて もらった ！' },
  };
  // the demonstrations' marked words (the forms LEX doesn't list: ja's dictionary form 投げる)
  const THROW_MARKS = { es: ['v.throw'], pt: ['v.throw'], de: ['v.throw'], zh: ['v.throw'], ja: ['v.throw', ['[投|な]げる', 'throw']] }, CLIMB_MARKS = ['v.climb'];
  const trigoName = () => { const l = UI.lang; return typeof CJK !== 'undefined' && CJK.isCJK(l) ? CJK.plain(TRIGO.name[l], { lang: l }) : 'Trigo'; };
  // his mixed lines (ri: the room he's in: 2 the sail loft, 0 the grain store); {v.*} in the English is that word in the language
  // (the English: {v.*} is that word as it's said in the language, {trigo} his name as it's shown: 小麦 / コムギ in zh / ja)
  const enOf = L0 => String(L0.en).replace(/\{(v\.[a-z_]+)\}/g, (m, id) => (LEX.item(id) ? LEX.form(id) : m)).replace(/\{trigo\}/g, trigoName());
  function trigoSay(key, ri = 2) {
    const T = rooms[ri] && rooms[ri].trigo, L0 = TRIGO[key]; if (!T || !L0) return Promise.resolve();
    return STORY.sayInline(Object.assign(T.p, { name: trigoName(), lines: Object.assign({}, L0, { en: enOf(L0) }) }), true);
  }
  // a demonstration: whole in the language, said out loud, the word marked and glossed (EN on request)
  function trigoDemo(key, ri, marks) {
    const T = rooms[ri] && rooms[ri].trigo, L0 = TRIGO[key]; if (!T || !L0) return Promise.resolve();
    T.p.name = trigoName();
    const L1 = Object.assign({}, L0, { en: enOf(L0) });
    return STORY.demoLine ? STORY.demoLine(T.p, L1, marks) : trigoSay(key, ri);
  }
  const syncP = T => { T.p.x = T.N.x; T.p.y = T.N.y; T.p.z = T.N.z; };
  // how far out from the wall a ladder is at height h (it leans: its foot is out, its top by the trapdoor)
  const rungZ = (w, h) => w.foot.z - (clamp(h, 0, WH) / (WH - 0.12)) * (w.foot.z - (w.z + 0.1));
  // a pebble from Trigo's hand up at the latch… and it falls short
  async function trigoThrow() {
    const room = rooms[2], T = room.trigo, L = room.latch;
    T.N.yaw = Math.atan2(L.x - T.N.x, L.z - T.N.z); T.N.wave = true;
    const pebble = part(GEO.ico1, '#a3a196', [0, 0, 0], [0.12, 0.1, 0.11], { ink: 0.01 }); G.w3d.scene.add(pebble);
    const p0 = V(T.N.x + 0.15, Y0 + 1.25, T.N.z - 0.2), p1 = V(L.x - 0.5, L.y - 1.7, L.z + 0.3);
    await wait(0.2); Sound.play('whiff');
    await tween(0.5, k => { pebble.position.set(lerp(p0.x, p1.x, k), lerp(p0.y, p1.y, k) + Math.sin(k * Math.PI) * 1.1, lerp(p0.z, p1.z, k)); pebble.rotation.x += 0.4; });
    Sound.play('click');
    await tween(0.4, k => { pebble.position.y = lerp(p1.y, Y0 + 0.08, k * k); });
    Sound.play('pip'); G.w3d.fx.puff(p1.x, Y0 + 0.1, p1.z, 4, 0.15, '#e8dcc4');
    T.N.wave = false; G.w3d.scene.remove(pebble);
  }
  async function trigoScene() {
    const room = rooms[2], T = room.trigo, st = S(); if (!T) return;
    st.trigo = Math.max(st.trigo || 0, 1);
    G.sim.lock = 1;
    T.N.yaw = Math.atan2(G.sim.you.x - T.N.x, G.sim.you.z - T.N.z);
    G.cam.override = { pos: V(T.N.x + 4.4, Y0 + 3.4, T.N.z + 5.6), look: V(T.N.x + 1.0, Y0 + 1.5, T.N.z - 1.8) };
    await wait(0.4);
    await trigoSay(st.trigo0 ? 'again' : 'hello');        // (met in the grain store: P6c)
    await trigoThrow();
    await trigoDemo('demo', 2, THROW_MARKS);               // (P6c: the demonstrations whole in the language, «lanza» marked; mixed,
    await trigoThrow();                                    //  they came out English at A0 and «lanza» was never heard)
    await trigoDemo('cue', 2, THROW_MARKS);
    await STORY.youWord('«', STORY.wordPart('v.throw'), `»… ${trigoName()} says it every time he throws a pebble!`);
    G.cam.override = null; G.sim.lock = 0;
    // Mimo watched: now it's the teach moment (with what you just heard, not «I don't know»)
    if (!LEX.taught('v.throw')) {
      const r = await STORY.teachWord('v.throw', { spot: { x: T.N.x + 1.7, z: T.N.z + 1.3 }, look: { x: T.N.x, z: T.N.z }, title: `${G.state.mimoName} is watching ${trigoName()}. What is ${trigoName()} doing?` });
      if (!(r && r.ok)) { G.save(); return; }
    }
    st.trigo = 2;
    await trigoSay('good');
    G.save();
  }
  async function trigoTalk() {
    const st = S();
    if (!LEX.taught('v.throw')) return trigoScene();
    G.sim.lock = 1;
    await trigoSay(st.latch && st.button ? 'later' : 'good');
    G.sim.lock = 0;
  }

  // you walk somewhere in a scene (the lock holds your keys; the speed shows the walk)
  async function walkYou(x, z, speed = 3.4) {
    const Y = G.sim.you, x0 = Y.x, z0 = Y.z, d = Math.hypot(x - x0, z - z0); if (d < 0.05) return;
    // (a straight walk through a sack or the millstone would show: then you're just there, while the camera moves)
    for (let k = 1; k <= 10; k++) { const px = lerp(x0, x, k / 10), pz = lerp(z0, z, k / 10), q = WORLD.pushOut(px, pz, 0.42); if (Math.hypot(q[0] - px, q[1] - pz) > 0.05) { Y.x = x; Y.z = z; Y.vx = Y.vz = 0; return; } }
    const dur = d / speed, vx = (x - x0) / dur, vz = (z - z0) / dur;
    Y.yaw = Math.atan2(vx, vz);
    await tween(dur, k => { Y.x = lerp(x0, x, k); Y.z = lerp(z0, z, k); Y.vx = vx; Y.vz = vz; });
    Y.vx = Y.vz = 0;
  }
  const faceYou = (x, z) => { const Y = G.sim.you; Y.yaw = Math.atan2(x - Y.x, z - Y.z); };

  // ------------------------------------------------------------ the ladders (P6c): "ladder still doesn't tell you what button to press"
  // "E Climb" at every ladder's foot. The first time, a sentence to Mimo (the tell box: «¡Trepa!»; I don't know shows the word); after
  // that E repeats it (st.quickClimb, and the prompt shows the sentence). Mimo scrambles up the rungs and through the hatch, you
  // step onto the ladder and climb after it: the next floor.
  function climbItem(room, next) {
    const q = S().quickClimb && LEX.taught('v.climb');
    return { x: room.up.x, z: room.up.z, y: Y0 + 1.1, r: 2.8, label: q ? `Climb · «${ex(LEX.form('v.climb'))}»` : 'Climb', run: () => climb(room, next) };     // (y: the prompt sits just over the bobbing arrow)
  }
  async function climb(room, next) {
    const st = S(), name = G.state.mimoName;
    if (!(st.quickClimb && LEX.taught('v.climb'))) {
      const r = await UI.command({ name, icon: 'climb', title: `The ladder goes up through the trapdoor. What should ${name} do?`, verbs: VERBS, answer: 'v.climb' });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); G.sim.mimo.tiltT = 1.4; STORY.think('{mimo} tilts its head. ' + ((st.trigo0 || 0) >= 2 ? `What did ${trigoName()} say on the ladder?` : 'Something to say “go up the ladder”…'), 4); return; }
      if (r.verb === 'v.climb' || LEX.taught(r.verb)) learnUse(r.verb, r.ms);
      if (r.verb !== 'v.climb') { await wrong({ kind: 'ladder', at: () => room.way.foot }, r.verb); return; }
      st.quickClimb = true; G.save();
    } else G.sim.mimoSay(ex(LEX.form('v.climb')), 1.4);
    await climbUp(room);
    await go(next);
  }
  async function climbUp(room) {
    const w = room.way, Y = G.sim.you, M = G.sim.mimo, mr = G.cast.mimo.root;
    G.sim.lock = 1;
    await walkYou(w.foot.x - 0.9, w.foot.z + 1.0);
    // Mimo first: up the rungs and through the hatch
    G.sim.mimoGo({ x: w.foot.x + 0.1, z: w.foot.z + 0.45 }, { x: w.x, z: w.z }); await wait(0.45);
    M.hidden = true; Sound.play('climb'); w.arrow.visible = false;
    const p0 = mr.position.clone(), top = WH - 0.25;
    await tween(0.8, k => { const h = lerp(p0.y - Y0, top, k); mr.position.set(lerp(p0.x, w.x, k), Y0 + h, rungZ(w, h) + 0.2); });
    mr.visible = false;
    // you: onto the ladder, and up after it
    ladderSolid(w, false);
    await walkYou(w.foot.x, w.foot.z + 0.3, 2.6);
    Y.yaw = Math.PI;
    Sound.play('climb');
    const f = UI.fade(1, 650);
    await tween(0.7, k => { const h = 1.7 * k; Y.y = Y.ry = Y0 + h; Y.vy = 0; Y.onGround = false; Y.z = rungZ(w, h + 0.5) + 0.42; });
    await f;
    mr.visible = true; M.hidden = false;
    Y.onGround = true; Y.vy = 0; Y.air = 0;
    ladderSolid(w, true); w.arrow.visible = true;
    G.sim.lock = 0;
  }

  // ------------------------------------------------------------ the grain store (P6c): Trigo shows «trepa» before the first ladder
  // ("teach the verb to climb for ladder".) The miller's grandkid hid behind the sacks by the ladder's corner. The ladder's clatter
  // brings him out: who he is, then up a few rungs saying it («¡Trepa, Trigo, trepa!», whole in the language, the word marked),
  // «¡Ahora tú, Mimo! ¡Trepa!» from up there, and down again. Mimo watched: the teach box. Then he slips off his own secret way
  // (he turns up in the sail loft). st.trigo0: 1 met, 2 done. An older save that met him in the loft first doesn't get it (the
  // ladder's own box still asks, and I don't know shows the word). Talk to him to try again if the box was closed.
  const lessonDue = () => { const st = S(); return !!(rooms[0] && rooms[0].trigo) && !st.trigo && (st.trigo0 || 0) < 2; };
  async function climbLesson() {
    const room = rooms[0], T = room.trigo, st = S(), w = room.way, M = G.sim.mimo, Y = G.sim.you; if (!T || !w) return;
    const N = T.N, kid = T.model.root, name = G.state.mimoName, met = (st.trigo0 || 0) >= 1;
    st.trigo0 = Math.max(st.trigo0 || 0, 1);
    G.sim.lock = 1;
    const foot = { x: w.foot.x, z: w.foot.z + 0.3 }, watch = { x: room.R.x + 0.6, z: room.R.z - 1.8 };
    G.cam.override = { pos: V(w.x - 1.7, Y0 + 3.9, w.z + 8.7), look: V(w.x - 0.6, Y0 + 1.6, w.z + 0.9), dur: 0.8 };
    G.sim.mimoGo({ x: foot.x - 2.9, z: foot.z + 1.1 }, foot);
    w.arrow.visible = false;                         // (the Climb arrow would sit over him; back when he's done)
    await walkYou(watch.x, watch.z);
    faceYou(foot.x, foot.z);
    if (!kid.visible) {          // out he pops, in a puff of flour
      N.x = T.hide.x; N.z = T.hide.z; N.y = Y0 - 0.7; N.yaw = Math.atan2(Y.x - N.x, Y.z - N.z); syncP(T);
      await wait(0.4);
      kid.visible = true; Sound.play('poof'); G.w3d.fx.puff(N.x, Y0 + 0.5, N.z, 14, 0.32, '#f4ead6');
      await tween(0.4, k => { N.y = Y0 - 0.7 + 0.7 * k + Math.sin(k * Math.PI) * 0.45; syncP(T); });
      N.y = Y0; syncP(T); Sound.play('land', 4); M.happy = 1;
    }
    if (!met) await trigoSay('hello0', 0);
    // to the ladder, and up a few rungs, saying it
    N.walking = true; N.yaw = Math.atan2(foot.x - N.x, foot.z - N.z);
    { const a = { x: N.x, z: N.z }; await tween(0.55, k => { N.x = lerp(a.x, foot.x, k); N.z = lerp(a.z, foot.z, k); syncP(T); }); }
    N.walking = false; N.yaw = Math.PI;
    const climbTo = (h, dur) => { const h0 = N.y - Y0; N.walking = true; Sound.play('climb'); return tween(dur, k => { const hh = lerp(h0, h, k); N.y = Y0 + hh; N.z = rungZ(w, hh + 0.4) + 0.32; syncP(T); }).then(() => { N.walking = false; }); };
    const up = climbTo(1.8, 1.4);
    await trigoDemo('climbDemo', 0, CLIMB_MARKS);
    await up;
    N.yaw = Math.PI + 0.7; N.wave = true;           // (he looks back down at Mimo)
    await trigoDemo('climbCue', 0, CLIMB_MARKS);
    N.wave = false;
    await STORY.youWord('«', STORY.wordPart('v.climb'), `»… ${trigoName()} says it every time he goes up a rung!`);
    N.yaw = Math.PI;
    await climbTo(0, 0.9);
    N.yaw = Math.atan2(Y.x - N.x, Y.z - N.z);
    G.cam.override = null; G.sim.lock = 0; w.arrow.visible = true;
    // Mimo watched: the teach box, from what you just heard (not «I don't know»)
    if (!LEX.taught('v.climb')) {
      const r = await STORY.teachWord('v.climb', { spot: { x: foot.x - 1.9, z: foot.z + 1.7 }, look: { x: w.x, z: w.z + 0.5 }, title: `${name} is watching ${trigoName()} on the ladder. What is ${trigoName()} doing?` });
      if (!(r && r.ok)) { G.save(); return; }
    }
    G.sim.lock = 1;
    await trigoSay('climbYes', 0);
    await trigoSay('climbBye', 0);
    // off he goes his own way: behind the sacks, a puff of flour, gone
    N.walking = true; N.yaw = Math.atan2(T.hide.x - N.x, T.hide.z - N.z);
    { const b = { x: N.x, z: N.z }; await tween(0.5, k => { N.x = lerp(b.x, T.hide.x, k); N.z = lerp(b.z, T.hide.z, k); syncP(T); }); }
    N.walking = false; Sound.play('poof'); G.w3d.fx.puff(N.x, Y0 + 0.5, N.z, 14, 0.32, '#f4ead6');
    await tween(0.3, k => { N.y = Y0 - 0.8 * k; syncP(T); });
    kid.visible = false; N.y = Y0; syncP(T);
    st.trigo0 = 2; G.sim.lock = 0; G.save();
    STORY.think('Up the ladder, then! (E at its foot)', 4);
  }

  // ------------------------------------------------------------ the gear room (P6c): the Hushlings drop from the beams
  // ("the player says hushlings are hiding behind the gears, maybe make them drop from the ceiling… and make us see them before we
  // fight".) Dust trickles down, then the three drop one by one right in front of you, thud and puff, and turn to you, bouncing,
  // eyes open; a beat to see them, your line, then the fight. They're gone when it's over (or drop again if you lose).
  async function dropAmbush() {
    const room = rooms[1], R = room.R, Y = G.sim.you, drops = (room.drop || []).filter(d => d.m);
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x - 2.4, Y0 + 5.9, R.z + 9.4), look: V(R.x + 0.6, Y0 + 1.2, R.z + 1.6), dur: 0.7 };
    await wait(0.7);
    Sound.play('wood'); drops.forEach(d => G.w3d.fx.puff(d.x, Y0 + WH - 0.2, d.z, 6, 0.24, '#d9cdb4', -0.6));
    STORY.think('Dust is trickling down from the beams… Something’s up there!', 2.6);
    await wait(1.2);
    for (const d of drops) {
      d.m.visible = true; d.m.userData.mood = 'alert'; d.m.rotation.y = Math.atan2(Y.x - d.x, Y.z - d.z);
      const y0 = Y0 + WH + 0.8; Sound.play('swoosh');
      await tween(0.45, k => { d.m.position.set(d.x, lerp(y0, Y0, k * k), d.z); });
      d.m.position.set(d.x, Y0, d.z);
      if (!(typeof BFX !== 'undefined' && BFX.fx && BFX.fx('thud'))) Sound.play('land', 12);
      G.w3d.fx.puff(d.x, Y0 + 0.1, d.z, 10, 0.3, '#e8dcc4'); d.on = true;
      await wait(0.22);
    }
    G.sim.mimo.scared = 2.5;
    await wait(1.0);       // (a beat to see them)
    await STORY.you('Hushlings! They dropped from the beams! Get ready, {mimo}!');
    G.cam.override = null; G.sim.lock = 0;
  }
  function clearDrops() { for (const d of rooms[1].drop || []) { d.on = false; if (d.m) d.m.visible = false; } }

  // ------------------------------------------------------------ the bell cap (P6c): ring the bell, and the big one wakes
  // ("its very hard to trigger the fight at the top… make us ring the bell to trigger the fight".) E at the bell's rope: you pull
  // it, and the bell only clonks, smothered by the Hush; gray dust shakes off it. The armadillo stirs, uncurls, stands, turns to
  // you and stamps: a beat to see it awake, then the fight. «campana» is let into the weave first (STORY.introduce), so your lines
  // and its threats in the fight ("armadillo threatens us fully in target language") say it glossed, the rest in English until
  // you know it (battle/foelines.js mixes every foe line; its own shouts are taught there the first time: arma1 / arma2).
  const growl = (text, shout) => { try { if (typeof BFX !== 'undefined' && BFX.voice) BFX.voice({ kind: 'foe', species: 'armadillo', isBoss: true }, text, { cls: shout ? 'foe shout boss' : 'foe' }); else Sound.play('shout'); } catch (e) { /* (no sound) */ } };
  async function ringToWake() {
    const room = rooms[3], b = room.boss, R = room.R, B = room.bell, rp = room.rope, M = G.sim.mimo;
    STORY.introduce('w.bell');
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x - 5.6, Y0 + 3.3, R.z + 4.6), look: V(R.x + 0.4, Y0 + 1.9, R.z - 1.2), dur: 0.8 };
    G.sim.mimoGo({ x: rp.x - 1.2, z: rp.z + 1.7 }, { x: B.x, z: B.z });
    await walkYou(rp.x + 0.05, rp.z + 0.72);
    faceYou(rp.x, rp.z);
    await STORY.you('The great {w.bell}! Let’s ring it, {mimo}!');
    // the pull: down and up… and it only clonks
    await tween(0.22, k => { rp.line.position.y = rp.y0 - 0.35 * k; });
    if (!(typeof BFX !== 'undefined' && BFX.fx && BFX.fx('shell'))) Sound.play('hit');
    B.swing = 0.16; G.w3d.fx.puff(B.x, Y0 + 2.5, B.z, 16, 0.34, '#b9b6c8');
    await tween(0.3, k => { rp.line.position.y = rp.y0 - 0.35 * (1 - k); });
    await wait(0.6);
    await STORY.you('Clonk… The Hush is smothering the {w.bell}. It can’t ring!');
    if (b) {
      // the big one stirs…
      G.cam.override = { pos: V(R.x - 2.4, Y0 + 2.5, R.z + 5.4), look: V(room.bossSolid.x - 0.3, Y0 + 1.4, room.bossSolid.z), dur: 0.6 };
      await wait(0.6);
      growl('Mmm… grr…', false); b.userData.mood = 'idle';
      await tween(0.7, k => { b.userData.curl = 1 - 0.35 * k; });
      await wait(0.4);
      // …uncurls, stands, and turns to you
      b.userData.mood = 'alert';
      const Y = G.sim.you, r0 = b.rotation.y, r1 = Math.atan2(Y.x - b.position.x, Y.z - b.position.z);
      await tween(0.7, k => { b.userData.curl = 0.65 * (1 - k); b.rotation.y = r0 + angDiff(r0, r1) * k; });
      b.userData.curl = 0;
      growl('Grrraaah!', true);
      if (!(typeof BFX !== 'undefined' && BFX.fx && BFX.fx('phase'))) Sound.play('land', 16);
      G.w3d.fx.puff(b.position.x, Y0 + 0.2, b.position.z, 22, 0.45, '#c8c6d8'); M.scared = 2.5;
      await wait(1.1);       // (a beat to see it awake)
    }
    await STORY.you('It woke up… and it looks angry! Get ready, {mimo}!');
    G.cam.override = null; G.sim.lock = 0;
    await bossFight();
  }
  async function bossFight() {
    const room = rooms[3], st = S(), b = room.boss, R = room.R;
    // a real boss fight (battle/flow.js armaMain): it rolls at you, gets dizzy, and «¡Empuja al armadillo!» flips it
    const r = await G.fight({ boss: 'armadillo', foes: [{ kind: 'armadillo', color: 'yellow', size: 'big', giant: 2.3, hp: 26, boss: 'armadillo' }], place: { x: 240, z: -176 } });
    if (!r || r.outcome !== 'win') {
      if (b) { b.userData.curl = true; b.userData.mood = 'asleep'; b.rotation.y = -0.6; }
      STORY.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then ring the bell again. Push it when it’s dizzy!' : 'It curls back up beside the bell.', 4);
      return;
    }
    st.boss = true; unsolid(room.bossSolid);
    // free of the Hush: it uncurls, stretches, and trundles off down through the floor's hole
    if (b) {
      G.sim.lock = 1;
      b.userData.curl = false; b.userData.mood = 'happy';
      G.w3d.fx.puff(room.bossSolid.x, Y0 + 0.8, room.bossSolid.z, 18, 0.45, '#c8c6d8');
      await wait(0.6);
      const x0 = b.position.x, z0 = b.position.z, x1 = R.x, z1 = R.z + HD - 0.6;
      b.rotation.y = Math.atan2(x1 - x0, z1 - z0); room.bossSpeed = 2.2;
      await tween(2.0, k => { b.position.x = lerp(x0, x1, k); b.position.z = lerp(z0, z1, k); });
      room.bossSpeed = 0; G.w3d.fx.puff(x1, Y0 + 0.4, z1, 16, 0.4, '#e8dcc4'); Sound.play('poof');
      b.visible = false; G.sim.lock = 0;
    }
    Sound.play('learned');
    await wait(0.5);
    room.page.visible = true; Sound.play('page');
    await STORY.you('Something fluttered down from the beams. A page from Noa’s notebook!');
    G.save();
  }
  async function readPage() {
    const room = rooms[3], st = S();
    Sound.play('page');
    await UI.page('page.mill', 'w.tower');
    st.page = true; room.page.visible = false;
    if (!G.state.pages.includes('page.mill')) G.state.pages.push('page.mill');
    await STORY.you('Noa saw someone in the old {w.tower}… Then let’s make this {w.bell} ring for real, {mimo}!');
    G.save();
  }
  async function ringBell() {
    const room = rooms[3], B = room.bell, st = S();
    G.sim.lock = 1;
    G.cam.override = { pos: V(B.x + 4.5, Y0 + 2.6, B.z + 6), look: V(B.x, Y0 + 3.2, B.z) };
    await mimoArc({ x: B.x + 0.9, z: B.z + 0.4 }, Y0 + 2.6, 0.7);
    Sound.play('hit');
    for (let k = 0; k < 3; k++) { Sound.play('bell'); B.swing = 0.5; G.w3d.fx.sparkle(B.x, Y0 + 3.4, B.z, 14); await wait(0.9); }
    await mimoLand();
    st.bell = true;
    await wait(0.6);
    G.cam.override = null; G.sim.lock = 0;
    await finale();
  }
  // outside again: the sails turn, the color comes back, and the first bell of eight rings
  async function finale() {
    await UI.fade(1, 700);
    hideAll(); inside = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z + 2, 0);
    const mol = G.molinar;
    if (mol && mol.setMillHushed) mol.setMillHushed(false);
    const hi = WORLD.L.hush.findIndex(h => h.mill); if (hi >= 0) G.w3d.liftHush(hi);
    G.state.flags.millFree = true; G.state.flags.bells = Math.max(1, G.state.flags.bells || 0);
    G.sim.lock = 1;
    G.cam.override = { pos: V(OUTSIDE.x - 13, 9, OUTSIDE.z + 16), look: V(240, 11, -176) };
    G.cam.snap(0, 0.3, 9);
    await UI.fade(0, 900);
    for (let k = 0; k < 4; k++) { Sound.play('bell'); await wait(1.1); }
    await UI.chapter('The first bell', '1 of 8 · Molinar sings again');
    G.cam.override = null; G.sim.lock = 0;
    await STORY.you('Listen… the whole town is ringing! One bell down, seven to go. Ciro will want to hear about this.');
    G.save();
  }

  // ------------------------------------------------------------ moving between rooms, in and out
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + 1.1; M.z = z + 0.8; M.hidden = false; G.sim.snap();
  }
  function show(i) { rooms.forEach((r, k) => { r.g.visible = k === i; }); cur = i; quick = {}; }
  function hideAll() { rooms.forEach(r => { r.g.visible = false; }); cur = -1; quick = {}; }
  async function enter() {
    build();
    await UI.fade(1, 450);
    inside = true; G.w3d.setInterior({ fog: '#2b2019', near: 18, far: 50 });
    show(0); const R = ROOMS[0]; teleport(R.x, R.z + 4.4, Math.PI); G.cam.snap(Math.PI, 0.62, 10.5);
    await UI.fade(0, 450);
    if (!S().seen0) { S().seen0 = true; UI.chapter('The Great Mill', 'Molinar’s bell hangs at the very top'); STORY.think('Flour dust everywhere… two round plates on the floor, and a hatch to the stairs.', 5); }
    else if (S().grain && lessonDue() && !LEX.taught('v.climb')) { await wait(0.6); await climbLesson(); }      // (a save from before P6c: Trigo's lesson now)
    G.save();
  }
  async function leave() {
    await UI.fade(1, 450);
    hideAll(); inside = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw); G.cam.snap(0, 0.28, 8.5);
    await UI.fade(0, 450);
  }
  async function go(i, from = 'below') {
    await UI.fade(1, 350);
    show(i);
    const R = ROOMS[i], room = rooms[i];
    if (from === 'above') { teleport(room.up.x - 1.6, room.up.z + 1.8, 0); G.cam.snap(0, 0.62, 10.5); }
    else { teleport(R.x, R.z + 4.4, Math.PI); G.cam.snap(Math.PI, 0.62, 10.5); }
    await UI.fade(0, 350);
    const st = S();
    if (!st['seen' + i]) {
      st['seen' + i] = true; UI.chapter(R.name, R.sub);
      if (i === 1 && !st.ambush) {      // the gear room: Hushlings drop from the beams, where you can see them (P6c: dropAmbush)
        await wait(1.2);
        await dropAmbush();
        const r = await G.fight({ foes: [{ kind: 'hushling', color: 'green', size: 'small' }, { kind: 'armadillo', color: 'blue', size: 'small' }, { kind: 'moth', color: 'yellow', size: 'small' }], place: { x: 240, z: -176 } });
        clearDrops();
        if (r && r.outcome === 'win') st.ambush = true; else { st['seen' + i] = false; await go(i - 1, 'above'); return; }
        STORY.think('Now: the big cog fell off its axle. And a cracked crate blocks the stairs.', 5);
      }
      if (i === 2) {
        await wait(1.8);                                 // (the floor's card first)
        await trigoScene();                              // Trigo shows «lanza», and Mimo learns it
        STORY.think('The ladder up is tied off twice: a latch high on the wall, and a button on the shelf.', 5);
      }
    }
    G.save();
  }

  // ------------------------------------------------------------ per frame (while inside)
  function update(dt, t) {
    if (!inside || cur < 0) return;
    const room = rooms[cur], st = S();
    if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    const inn = wallsFor(room, G.w3d.camera.position);                              // (P6c: the windows and beams go with their wall)
    if (cur === 0) room.plates.forEach(p => { p.glow.material.opacity = damp(p.glow.material.opacity, p.on ? 0.85 + 0.15 * Math.sin(t * 4) : 0, 5, dt); });
    if (cur === 0 && room.trigo && room.trigo.model.root.visible && typeof ACTORS !== 'undefined') { const T = room.trigo; T.N.talk = T.p.talking ? 1 : 0; ACTORS.animateVillager(T.model, T.N, dt, t); }
    if (cur === 1 && st.gear) { room.wallGears.forEach((g, i) => { g.rotation.y += dt * (i % 2 ? -0.9 : 0.7) / (0.6 + i * 0.3); }); room.cog.g.rotation.y += dt * 0.6; if (inn) room.cog.g.visible = inn[0]; }
    if (cur === 1 && room.drop) for (const d of room.drop) if (d.on && d.m && d.m.userData.animate) d.m.userData.animate(dt, t, d.a.kind === 'armadillo' ? 0 : 0.7);     // (bouncing, eyes on you)
    if (cur === 2 && !(st.latch && st.button)) room.ladder.rotation.z = Math.sin(t * 1.3) * 0.02;
    if (room.way && room.way.arrow.visible) room.way.arrow.position.y = Y0 + 2.1 + Math.sin(t * 3) * 0.15;     // (the Climb arrow bobs)
    if (cur === 2 && room.trigo && typeof ACTORS !== 'undefined') { const T = room.trigo; T.N.talk = T.p.talking ? 1 : 0; ACTORS.animateVillager(T.model, T.N, dt, t); }
    if (cur === 3) {
      const B = room.bell; B.swing = damp(B.swing, 0, 1.4, dt); B.piv.rotation.z = Math.sin(t * 5) * B.swing;
      if (room.boss && room.boss.visible && room.boss.userData.animate) room.boss.userData.animate(dt, t, room.bossSpeed || 0);
      if (room.page.visible) room.pageGlow.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
    }
  }

  return {
    init(game) { G = game; },
    enter, leave, update, interactables, target, ROOMS, OUTSIDE,
    get inside() { return inside; }, get room() { return cur; },
    _: { rooms, go, shove, S, build, applyState, cellPos, openWay, trigoScene, trigoTalk, TRIGO, tell,
      // (P6c) the ladders, Trigo's «trepa», the drop, the bell, the walls; bossScene is ringToWake now (kept for old callers)
      climb, climbUp, climbLesson, lessonDue, dropAmbush, clearDrops, ringToWake, bossFight, bossScene: ringToWake, wallsFor, checkPlates, trigoSay },
  };
})();
