'use strict';
// Molinar's two time dungeons share one kit (MOLMILL.make): four small rooms floating at y 300 (a floor each, walls that face
// inward so the camera looks in like a dollhouse, a trapdoor and a ladder that drop when the floor is done, a "Climb" arrow),
// visited one at a time; progress in TIME.state('molinar', world).mill; you always leave by the door you came in. Each world's
// rooms bring their own props, puzzles and people (cfg.build / interactables / target / update / onFirst).
//   MPMILL (this file): the Great Mill being built, long ago (DESIGN.md 18.6 "T1c"). Rooms at z −360, x −430 / −404 / −378 / −352.
//     0 the Stone Floor: tell {mimo} what it did with each millstone (a memory: «{mimo} empujó la piedra»); turn the crank; write
//       in the builders' log what YOU did («¿Giraste la manivela?» → «Sí, giré la manivela»)
//     1 the Gear Floor: Hushlings in the beams (a fight in the Past's tense), the big wheel into its socket, the lever, the log
//     2 the Sail Loft: {mimo} climbs the mast (a memory), you raise the sails, the log
//     3 the Cap: the first armadillo, young and silly (molinar_time_boss.js); Elio's echo; the last log line; the mill is done
//   MFMILL (molinar_future_mill.js): the silent Great Mill, tomorrow.
const MOLMILL = (() => {
  const Y0 = 300, HW = 7, HD = 6, WH = 5.6;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const { part, G: GEO } = TK;
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
  function make(cfg) {
    let G = null, inside = false, cur = -1, built = false;
    const rooms = cfg.ROOMS.map((R, i) => ({ i, R: { x: R.x, z: R.z }, name: R.name, sub: R.sub, g: null, way: null, up: null }));
    const S = () => cfg.state();
    const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
    // (tests: TIME's fast flag skips the fades and the floor cards, which wait on timers a hidden tab throttles)
    const fastOn = () => !!(TIME._ && TIME._.fast && TIME._.fast.on);
    const UIfade = (to, ms) => { if (fastOn()) { const el = document.getElementById('fade'); if (el) { el.style.transition = 'none'; el.style.opacity = to; } return Promise.resolve(); } return UI.fade(to, ms); };
    const UIchapter = (a, b) => (fastOn() ? (UI.toast(a + ' · ' + b), Promise.resolve()) : UI.chapter(a, b));
    const chime = () => { if (!(typeof BFX !== 'undefined' && BFX.solved && BFX.solved())) Sound.play('chest'); };
    // ---------------------------------------------------------- the rooms' shell: floor, inward walls, a beam frame, windows
    let MAT = null;
    function mats() {
      if (MAT) return MAT;
      const T0 = cfg.tint || {}, tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
      const planks = tex(256, 256, c => {
        const P = T0.planks || ['#c99a64', '#bb8a55', '#c69560'], j = T0.joint || '#7a5434';
        c.fillStyle = P[0]; c.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 8; i++) { const y = i * 32; c.fillStyle = P[i % 3]; c.fillRect(0, y + 2, 256, 30); c.fillStyle = j; c.fillRect(0, y, 256, 2); const off = (i * 97) % 256; c.fillRect(off, y, 3, 32); c.fillRect((off + 131) % 256, y, 3, 32); }
        if (T0.dust) { c.fillStyle = 'rgba(200,198,210,0.35)'; for (let k = 0; k < 40; k++) { c.beginPath(); c.ellipse((k * 53) % 256, (k * 31) % 256, 14 + (k % 5) * 4, 6 + (k % 3) * 3, 0, 0, TAU); c.fill(); } }
      }, 3.5, 3);
      const plaster = tex(256, 256, c => {
        const W = T0.wall || '#efe2c8'; c.fillStyle = W; c.fillRect(0, 0, 256, 256);
        c.fillStyle = T0.wall2 || '#e4d3b2'; for (let k = 0; k < 70; k++) c.fillRect((k * 71) % 256, (k * 37) % 256, 12, 6);
        if (T0.stones) { c.strokeStyle = 'rgba(120,96,70,0.35)'; c.lineWidth = 2; for (let y = 0; y < 256; y += 28) for (let x = (y / 28) % 2 ? 0 : 24; x < 256; x += 48) c.strokeRect(x, y, 48, 28); }
        c.fillStyle = T0.skirt || '#9a6a42'; c.fillRect(0, 190, 256, 66); c.fillStyle = T0.skirt2 || '#86593a'; for (let x = 0; x < 256; x += 32) c.fillRect(x, 190, 3, 66);
        c.fillStyle = T0.trim || '#6b4a2e'; c.fillRect(0, 186, 256, 6); c.fillRect(0, 0, 12, 256);
        if (T0.dust) { c.fillStyle = 'rgba(150,148,162,0.3)'; for (let k = 0; k < 30; k++) c.fillRect((k * 89) % 256, (k * 47) % 180, 30, 10); }
      }, 3, 1);
      MAT = { floor: new THREE.MeshToonMaterial({ map: planks, gradientMap: TK.grad }), wall: new THREE.MeshToonMaterial({ map: plaster, gradientMap: TK.grad }),
        window: new THREE.MeshBasicMaterial({ color: T0.window || '#ffe7a8' }), hole: new THREE.MeshBasicMaterial({ color: '#1b130e' }) };
      return MAT;
    }
    function shell(room) {
      const M = mats(), R = room.R, g = room.g;
      const floor = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, 0.4, HD * 2), M.floor); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
      [[0, -HD, 0, HW * 2], [0, HD, Math.PI, HW * 2], [-HW, 0, Math.PI / 2, HD * 2], [HW, 0, -Math.PI / 2, HD * 2]].forEach(([dx, dz, ry, w]) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), M.wall); m.position.set(R.x + dx, Y0 + WH / 2, R.z + dz); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
      });
      // the frame, the windows, the way out (a dark patch by the front wall): one merged mesh and hull
      const k = PAST.API.Kit(), trim = (cfg.tint || {}).beam || '#6b4a2e';
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => k.box(R.x + sx * (HW - 0.2), Y0 + WH / 2, R.z + sz * (HD - 0.2), 0.4, WH, 0.4, trim, { ink: 0 }));
      k.box(R.x, Y0 + WH - 0.2, R.z - HD + 0.15, HW * 2, 0.4, 0.3, trim, { ink: 0 });
      for (const dx of [-HW + 0.15, HW - 0.15]) k.box(R.x + dx, Y0 + WH - 0.2, R.z, 0.3, 0.4, HD * 2, trim, { ink: 0 });
      for (const [dx, dz, ry] of [[-3.6, -HD + 0.04, 0], [3.6, -HD + 0.04, 0]]) {
        const c = Math.cos(ry), s = Math.sin(ry), wx = R.x + dx, wz = R.z + dz;
        for (const [x, y, w, h] of [[0, 0.8, 1.55, 0.14], [0, -0.8, 1.55, 0.14], [-0.72, 0, 0.14, 1.7], [0.72, 0, 0.14, 1.7], [0, 0, 0.08, 1.5], [0, 0, 1.3, 0.08]]) k.box(wx + x * c, Y0 + 3.4 + y, wz + 0.05, w, h, 0.08, trim, { ink: 0 });
        void s;
      }
      for (const dx of [-1.15, 1.15]) k.box(R.x + dx, Y0 + 0.08, R.z + HD - 0.6, 0.14, 0.16, 1.2, trim, { ink: 0 });
      k.build(g, { shadow: false });
      for (const dx of [-3.6, 3.6]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.5), M.window); w.position.set(R.x + dx, Y0 + 3.4, R.z - HD + 0.03); g.add(w); }
      const door = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), M.hole); door.rotation.x = -Math.PI / 2; door.position.set(R.x, Y0 + 0.012, R.z + HD - 0.6); g.add(door);
      WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - HD - 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: R.x, z: R.z + HD + 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 },
        { obox: 1, x: R.x - HW - 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }, { obox: 1, x: R.x + HW + 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }]);
      WORLD.addPlatforms([{ box: [R.x - HW, R.x + HW, R.z - HD, R.z + HD], top: Y0 }]);
    }
    // ---------------------------------------------------------- the way up: a trapdoor in the ceiling, a ladder that drops
    const LEAN = 0.12;
    function wayUp(room, x, z) {
      const g = room.g, top = Y0 + WH - 0.12, len = WH - 0.12;
      const fr = new THREE.Group(); fr.position.set(x, top, z); g.add(fr);
      const kf = PAST.API.Kit(); [[0, -0.95, 2.1, 0.2], [0, 0.95, 2.1, 0.2], [-0.95, 0, 0.2, 1.7], [0.95, 0, 0.2, 1.7]].forEach(([dx, dz, w, d]) => kf.box(dx, 0, dz, w, 0.26, d, '#5d4027', { ink: 0.01 })); kf.build(fr, { shadow: false });
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ color: '#120c08', side: THREE.DoubleSide })); hole.rotation.x = Math.PI / 2; hole.position.y = 0.06; hole.visible = false; fr.add(hole);
      const lid = new THREE.Group(); lid.position.set(0, -0.03, -0.85); fr.add(lid);
      const kl = PAST.API.Kit(); kl.box(0, 0, 0.85, 1.7, 0.1, 1.7, '#8d6a46', { ink: 0.012 }); [-0.45, 0.45].forEach(dx => kl.box(dx, -0.07, 0.85, 0.14, 0.05, 1.6, '#6b4a2e', { ink: 0 })); kl.build(lid, { shadow: false });
      const lad = new THREE.Group(); lad.position.set(x, top, z + 0.1); g.add(lad);
      const kd = PAST.API.Kit(); [-0.42, 0.42].forEach(dx => kd.box(dx, -len / 2, 0, 0.12, len, 0.12, '#a8743f', { ink: 0.01 })); for (let j = 0; j < 9; j++) kd.box(0, -0.45 - j * 0.58, 0, 0.84, 0.09, 0.1, '#c79d6d', { ink: 0.008 }); kd.build(lad, { shadow: false });
      lad.rotation.x = -LEAN; lad.scale.y = 0.001; lad.visible = false;
      const foot = { x, z: z + 0.1 + len * Math.sin(LEAN) };
      const arrow = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex(), transparent: true, depthWrite: false, depthTest: false }));
      arrow.scale.set(0.95, 1.2, 1); arrow.position.set(foot.x, Y0 + 2.1, foot.z + 0.2); arrow.visible = false; arrow.renderOrder = 5; g.add(arrow);
      room.way = { fr, lid, hole, lad, arrow, x, z, foot, open: false };
      room.up = { x: foot.x, z: foot.z + 0.5 };
    }
    async function openWay(room, instant) {
      const w = room && room.way; if (!w || w.open) return; w.open = true;
      w.hole.visible = true; w.lad.visible = true;
      if (instant) { w.lid.rotation.x = Math.PI / 2 * 0.97; w.lad.scale.y = 1; w.arrow.visible = true; return; }
      chime();
      await tween(0.45, k => { w.lid.rotation.x = Math.PI / 2 * 0.97 * k * k; });
      Sound.play('wood'); Sound.play('swoosh');
      await tween(0.6, k => { w.lad.scale.y = Math.max(0.001, k * k); });
      Sound.play('land', 11); G.w3d.fx.puff(w.foot.x, Y0 + 0.1, w.foot.z, 12, 0.32, (cfg.tint || {}).puff || '#e8dcc4');
      w.lad.scale.y = 1; w.arrow.visible = true;
    }
    // ---------------------------------------------------------- moving between rooms, in and out
    function teleport(x, z, yaw) { const Y = G.sim.you, Mm = G.sim.mimo; Y.x = x; Y.z = z; Y.yaw = yaw; Mm.x = x + 1.1; Mm.z = z + 0.8; Mm.hidden = false; Mm.wander = null; Mm.station = null; G.sim.snap(); }
    function show(i) { rooms.forEach((r, k) => { if (r.g) r.g.visible = k === i; }); cur = i; quick = {}; }
    function hideAll() { rooms.forEach(r => { if (r.g) r.g.visible = false; }); cur = -1; quick = {}; }
    function build() {
      if (built) return; built = true;
      rooms.forEach(room => { room.g = new THREE.Group(); room.g.name = cfg.name + '-room' + room.i; room.g.visible = false; G.w3d.scene.add(room.g); shell(room); if (room.i < rooms.length - 1) wayUp(room, room.R.x - 4.6, room.R.z - 4.6); try { cfg.build(room, api); } catch (e) { console.error('[' + cfg.name + '] build', e); } });
      applyState();
    }
    function applyState() { const st = S(); rooms.forEach(room => { if (st['done' + room.i]) openWay(room, true); }); if (cfg.applyState) { try { cfg.applyState(api); } catch (e) { console.error('[' + cfg.name + '] state', e); } } }
    async function enter() {
      build();
      await UIfade(1, 450);
      inside = true; G.w3d.setInterior(cfg.interior || { fog: '#3a2a20', near: 18, far: 52 });
      show(0); const R = rooms[0].R; teleport(R.x, R.z + 4.4, Math.PI); G.cam.snap(Math.PI, 0.62, 10.5);
      await UIfade(0, 450);
      await first(0);
      G.save();
    }
    async function leave(o = {}) {
      await UIfade(1, 450);
      hideAll(); inside = false; G.w3d.setInterior(null);
      const O = cfg.OUTSIDE; teleport(O.x, O.z, O.yaw); G.cam.snap(O.yaw, 0.28, 8.5);
      if (o.then) { try { await o.then(); } catch (e) { console.error('[' + cfg.name + '] leave', e); } }
      await UIfade(0, o.slow ? 900 : 450);
    }
    async function go(i, from = 'below') {
      await UIfade(1, 350);
      show(i);
      const R = rooms[i].R, room = rooms[i];
      if (from === 'above') { teleport(room.up.x - 1.6, room.up.z + 1.8, 0); G.cam.snap(0, 0.62, 10.5); }
      else { teleport(R.x, R.z + 4.4, Math.PI); G.cam.snap(Math.PI, 0.62, 10.5); }
      await UIfade(0, 350);
      await first(i);
      G.save();
    }
    async function first(i) {
      const st = S(), room = rooms[i];
      if (st['seen' + i]) return;
      st['seen' + i] = true; UIchapter(room.name, room.sub);
      if (cfg.onFirst) { try { const ok = await cfg.onFirst(room, api); if (ok === false) { st['seen' + i] = false; if (i > 0) await go(i - 1, 'above'); else await leave(); } } catch (e) { console.error('[' + cfg.name + '] first', e); } }
    }
    // a floor done: the way up opens (or, at the top, the cfg's finale)
    async function floorDone(i) { const st = S(); if (st['done' + i]) return; st['done' + i] = true; await openWay(rooms[i]); G.save(); }
    // ---------------------------------------------------------- E, the compass, every frame
    let quick = {};
    function interactables() {
      const list = [], room = rooms[cur]; if (!room) return list;
      const R = room.R, st = S();
      list.push({ x: R.x, z: R.z + HD - 0.9, r: 1.7, label: cur === 0 ? 'Leave the mill' : 'Go down', run: () => (cur === 0 ? leave() : go(cur - 1, 'above')) });
      if (st['done' + cur] && room.way && room.way.open && cur < rooms.length - 1) list.push({ x: room.up.x, z: room.up.z, r: 2.6, label: 'Climb', run: () => go(cur + 1) });
      try { list.push(...(cfg.interactables(room, api) || [])); } catch (e) { console.error('[' + cfg.name + '] interactables', e); }
      return list;
    }
    function target() {
      const room = rooms[cur]; if (!room) return null;
      let t = null; try { t = cfg.target(room, api); } catch (e) { t = null; }
      if (t) return t;
      if (S()['done' + cur] && cur < rooms.length - 1) return { x: room.up.x, z: room.up.z, hint: '{mimo} points up the ladder.' };
      return null;
    }
    function update(dt, t) {
      if (!inside || cur < 0) return;
      if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
      const room = rooms[cur];
      if (room.way && room.way.arrow.visible) room.way.arrow.position.y = Y0 + 2.1 + Math.sin(t * 3) * 0.15;
      if (cfg.update) { try { cfg.update(room, dt, t, api); } catch (e) { console.error('[' + cfg.name + '] update', e); cfg.update = null; } }
    }
    function late(dt) { if (inside && cfg.late) { try { cfg.late(dt, api); } catch (e) { /* */ } } }
    // a person in a room: the person kit (one mesh and its hull), standing, breathing, turning to you
    function person(room, look, at, name) {
      const { k, top } = PAST.API.personKit(look), g = new THREE.Group(), body = new THREE.Group(); g.add(body); k.build(body);
      const h = look.h || (look.kid ? 0.78 : 1); g.scale.setScalar(h);
      g.position.set(at.x, Y0, at.z); g.rotation.y = at.yaw || 0; room.g.add(g);
      const solid = { x: at.x, z: at.z, r: 0.4 }; WORLD.extra.push(solid);
      return { g, body, solid, api: { id: name, name, x: at.x, y: Y0, z: at.z, top: top * h + 0.1, talking: false, yaw: at.yaw || 0 }, ph: Math.random() * 6 };
    }
    function animate(P, dt, t) {
      if (!P || !P.g.visible) return;
      const Y = G.sim.you, a = P.api, near = Math.hypot(Y.x - a.x, Y.z - a.z) < 4.5;
      P.body.position.y = a.talking ? Math.abs(Math.sin(t * 12 + P.ph)) * 0.05 : 0;
      P.body.rotation.z = Math.sin(t * 1.2 + P.ph) * 0.03;
      P.g.rotation.y = dampAngle(P.g.rotation.y, near || a.talking ? Math.atan2(Y.x - a.x, Y.z - a.z) : a.yaw, 4, dt);
    }
    // Mimo flies along an arc (up a mast, onto a ledge), then lands by you
    async function mimoArc(to, y1, dur = 0.7) {
      const Mm = G.sim.mimo, root = G.cast.mimo.root, p0 = root.position.clone(); Mm.hidden = true;
      await tween(dur, k => { root.position.set(lerp(p0.x, to.x, k), lerp(p0.y, y1, k) + Math.sin(k * Math.PI) * 1.3, lerp(p0.z, to.z, k)); });
      Sound.play('pip');
    }
    async function mimoLand() {
      const Mm = G.sim.mimo, Y = G.sim.you, root = G.cast.mimo.root, p0 = root.position.clone(), to = { x: Y.x + 1.1, z: Y.z + 0.6 };
      await tween(0.55, k => { root.position.set(lerp(p0.x, to.x, k), lerp(p0.y, Y0, k) + Math.sin(k * Math.PI) * 0.8, lerp(p0.z, to.z, k)); });
      Mm.x = to.x; Mm.z = to.z; Mm.y = Mm.ry = Y0; Mm.hidden = false; Mm.land = 0; Sound.play('land', 4);
    }
    const api = { get G() { return G; }, rooms, S, Y0, HW, HD, WH, V, part, GEO, wait, tween, chime, floorDone, openWay, leave, go, teleport, person, animate, mimoArc, mimoLand,
      get quick() { return quick; }, get cur() { return cur; }, get inside() { return inside; } };
    return {
      init(game) { G = game; },
      enter, leave, update, late, interactables, target, ROOMS: rooms, OUTSIDE: cfg.OUTSIDE,
      song: () => (cfg.song ? cfg.song(api) : null),
      get inside() { return inside; }, get room() { return cur; },
      curiosities: () => [],
      _: { api, build, applyState, go, floorDone, openWay, rooms, show },
    };
  }
  return { make, Y0, HW, HD, WH };
})();

// ============================================================ the Great Mill, being built (long ago)
const MPMILL = (() => {
  if (typeof MOLMILL === 'undefined' || typeof MOLT === 'undefined' || !MOLT) return null;
  const M = MOLT, T = () => MPTXT, X = [-430, -404, -378, -352], Z = -360;
  const st = () => { const s = M.st('past'); return s.mill || (s.mill = {}); };
  const pS = () => M.st('past');
  const lang = () => M.lang();
  const ln = key => T().LINES[key];
  const rufoLook = { skin: '#f0c7a0', hair: '#8a4a2a', hairdo: 'short', dress: '#5a86b8', vest: '#8a5f3e', hat: 'cap', hatColor: '#4f8a4a', h: 0.98 };
  const brigLook = { skin: '#c98e62', hair: '#2e2420', hairdo: 'braids', dress: '#7a5a3a', vest: '#d9a03a', hat: 'straw', hatColor: '#c9443a', h: 1.02 };
  const nm = id => M.nameOf(T().CAST[id]);
  let K = null;            // the kit's api (MOLMILL's), once built
  // a floor's log: the question (the 2nd person, shown), then your answer (the 1st); the floor holds once it's written
  async function writeLog(i, key) {
    const room = K.rooms[i], P = room.rufo || room.brig;
    if (P) { M.lock(true); try { M.shot(K.V(room.R.x + 2.2, K.Y0 + 3.2, room.R.z + 3.2), K.V(room.log.x, K.Y0 + 1.2, room.log.z)); await M.demo(P.api, T().LOGQ[key], T().LOGQ_MARKS[key]); } finally { M.lock(false); } }
    const r = await M.ask(T().TASKS[key], { tips: T().TIPS, icon: 'star', title: T().TASKS[key].title });
    if (!r) { M.think('The log is still open. What did you do on this floor?', 4); return false; }
    TIME.grade('mol.log.' + key, r.letter);
    Sound.play('page'); K.G.w3d.fx.sparkle(room.log.x, K.Y0 + 1.2, room.log.z, 12, ['#fff3a0', '#ffd7a0']);
    UI.toast('Written in the builders’ log. The floor holds!');
    const p = pS(); p.floors = Math.max(p.floors || 0, i + 1);
    return true;
  }
  // a memory: Mimo's move, told in the past (the first time, the Past's card for Mimo, from Chapter 2)
  async function memory(kind) {
    const s = st();
    if (!s.memCard && typeof PAST_SC !== 'undefined' && PAST_SC._ && PAST_SC._.card) { s.memCard = true; try { await PAST_SC._.card('memory'); } catch (e) { /* */ } }
    if (K.quick[kind]) { Sound.play('pip'); K.G.sim.mimoSay('♪', 1); return { letter: K.quick[kind] }; }
    const r = await M.ask(M.memTask(T().MEM[kind]), { icon: kind === 'mast' ? 'climb' : 'push' });
    if (r) { K.quick[kind] = r.letter; TIME.grade('mol.mem.' + kind, r.letter); }
    return r;
  }
  // ---------------------------------------------------------- the rooms
  function logStand(room, k) { const x = room.R.x + 5.4, z = room.R.z - 4.0; room.log = { x, z }; k.box(x, K.Y0 + 0.55, z, 0.5, 1.1, 0.5, '#8d6a46').box(x, K.Y0 + 1.16, z + 0.05, 0.86, 0.08, 0.62, '#f4ecdc', { rx: -0.35 }).box(x - 0.2, K.Y0 + 1.2, z + 0.05, 0.02, 0.06, 0.5, '#3a2a20', { rx: -0.35, ink: 0 }); }
  function millstoneG(room, x, z) {
    const g = new THREE.Group(); g.position.set(x, K.Y0, z); room.g.add(g);
    const k = PAST.API.Kit(), KG = PAST.API.KG; k.add(KG.cyl, 0, 0.3, 0, 0.95, 0.55, 0.95, '#b6ad9f').add(KG.cyl, 0, 0.32, 0, 0.2, 0.58, 0.2, '#5d564c', { ink: 0 }); k.build(g);
    return g;
  }
  function build(room, api) {
    K = api;
    const R = room.R, Y0 = api.Y0, k = PAST.API.Kit(), KG = PAST.API.KG;
    // the floor's own props, merged: scaffold posts along the walls, sacks, tools, timber
    for (const [dx, dz] of [[-6.4, 2.2], [6.4, 2.6], [-6.2, -1.6]]) k.box(R.x + dx, Y0 + 2.4, R.z + dz, 0.22, 4.8, 0.22, '#8a5f3e', { ink: 0.01 });
    for (let j = 0; j < 3; j++) k.box(R.x - 5.8 + j * 0.3, Y0 + 0.12 + j * 0.2, R.z + 4.6, 2.6, 0.18, 0.24, '#b07a48', { ry: 0.04 * j });
    logStand(room, k);
    if (room.i === 0) {
      // the two round beds the millstones go on, and the crank on the west wall
      room.beds = [{ x: R.x - 3, z: R.z - 1.2 }, { x: R.x + 3, z: R.z - 1.2 }];
      room.beds.forEach(b => k.add(KG.cyl, b.x, Y0 + 0.03, b.z, 1.05, 0.06, 1.05, '#8d6a46', { ink: 0.008 }).add(KG.torus, b.x, Y0 + 0.07, b.z, 0.8, 0.8, 0.8, '#e6b54a', { rx: Math.PI / 2, ink: 0 }));
      room.crank = { x: R.x - 6.3, z: R.z + 0.6 };
      k.box(room.crank.x, Y0 + 1.2, room.crank.z, 0.3, 1.2, 0.9, '#6b4a2e');
      room.crankG = new THREE.Group(); room.crankG.position.set(room.crank.x + 0.25, Y0 + 1.4, room.crank.z); room.g.add(room.crankG);
      const kc = PAST.API.Kit(); kc.add(KG.cyl, 0, 0, 0, 0.42, 0.08, 0.42, '#8d6a46', { rz: Math.PI / 2 }).box(0.1, 0.32, 0, 0.06, 0.64, 0.08, '#3a2a20').add(KG.cyl, 0.18, 0.62, 0, 0.06, 0.3, 0.06, '#c79d6d', { rz: Math.PI / 2 }); kc.build(room.crankG);
      room.stones = [0, 1].map(i => { const x = room.beds[i].x, z = R.z + 1.9, g = millstoneG(room, x, z), solid = { x, z, r: 0.9 }; WORLD.extra.push(solid); return { g, solid, x, z, set: false, i }; });
      room.rufo = api.person(room, rufoLook, { x: R.x + 5.0, z: R.z + 2.6, yaw: -2.4 }, nm('helper'));
    }
    if (room.i === 1) {
      // the big wheel lying on the floor, its socket on the north wall, the wall's gears, the lever on the east wall
      room.socket = { x: R.x + 0.5, z: R.z - 4.9 };
      room.wallGears = [[R.x - 2.2, Y0 + 3.0, 1.0], [R.x + 3.1, Y0 + 2.1, 0.7], [R.x + 3.9, Y0 + 3.8, 0.55]].map(([x, y, r]) => {
        const g = new THREE.Group(); g.position.set(x, y, R.z - 5.8); room.g.add(g); const kg = PAST.API.Kit();
        kg.add(KG.cyl, 0, 0, 0, r, 0.22, r, '#a8673a', { rx: Math.PI / 2 }); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; kg.box(Math.cos(a) * (r + 0.1), Math.sin(a) * (r + 0.1), 0, 0.22, 0.22, 0.2, '#8d5733', { rz: a, ink: 0.008 }); } kg.build(g);
        return g;
      });
      k.add(KG.cyl, room.socket.x, Y0 + 2.4, R.z - 5.85, 0.3, 0.4, 0.3, '#5d4027', { rx: Math.PI / 2 });
      room.wheel = { x: R.x + 0.5, z: R.z + 1.2, set: false };
      room.wheelG = new THREE.Group(); room.wheelG.position.set(room.wheel.x, Y0 + 0.2, room.wheel.z); room.g.add(room.wheelG);
      const kw = PAST.API.Kit(); kw.add(KG.cyl, 0, 0, 0, 1.25, 0.32, 1.25, '#a8673a'); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; kw.box(Math.cos(a) * 1.38, 0, Math.sin(a) * 1.38, 0.3, 0.3, 0.26, '#8d5733', { ry: -a, ink: 0.01 }); } kw.add(KG.cyl, 0, 0, 0, 0.4, 0.4, 0.4, '#6b4a2e'); kw.build(room.wheelG);
      room.wheelSolid = { x: room.wheel.x, z: room.wheel.z, r: 1.3 }; WORLD.extra.push(room.wheelSolid);
      room.lever = { x: R.x + 6.3, z: R.z + 0.8 };
      k.box(room.lever.x, Y0 + 0.6, room.lever.z, 0.3, 1.2, 0.5, '#6b4a2e');
      room.leverG = new THREE.Group(); room.leverG.position.set(room.lever.x - 0.2, Y0 + 1.1, room.lever.z); room.g.add(room.leverG);
      const kl = PAST.API.Kit(); kl.box(0, 0.45, 0, 0.08, 0.9, 0.08, '#2f3440').add(KG.ball6, 0, 0.92, 0, 0.12, 0.12, 0.12, '#c9443a'); kl.build(room.leverG); room.leverG.rotation.z = 0.5;
      room.rufo = api.person(room, rufoLook, { x: R.x + 4.4, z: R.z + 3.0, yaw: -2.6 }, nm('helper'));
    }
    if (room.i === 2) {
      // the mast with the sail's rope at its top, the winch, and through the north window the sails rising when hauled
      room.mast = { x: R.x + 1.6, z: R.z - 3.0 };
      k.add(KG.cyl, room.mast.x, Y0 + 2.7, room.mast.z, 0.18, 5.4, 0.18, '#8a5f3e');
      for (let j = 0; j < 7; j++) k.box(room.mast.x + 0.22, Y0 + 0.5 + j * 0.7, room.mast.z, 0.12, 0.06, 0.5, '#c79d6d', { ink: 0 });
      room.ropeG = new THREE.Group(); room.ropeG.position.set(room.mast.x, Y0 + 5.0, room.mast.z); room.g.add(room.ropeG);
      const kr = PAST.API.Kit(); kr.add(KG.torus, 0, 0, 0, 0.3, 0.3, 0.3, '#d8c8a0', { rx: Math.PI / 2, ink: 0.006 }); kr.build(room.ropeG);
      room.winch = { x: R.x - 2.4, z: R.z - 0.4 };
      k.box(room.winch.x, Y0 + 0.5, room.winch.z, 1.4, 1.0, 0.8, '#6b4a2e').add(KG.cyl, room.winch.x, Y0 + 1.15, room.winch.z, 0.35, 1.3, 0.35, '#a8743f', { rz: Math.PI / 2 });
      room.sailG = new THREE.Group(); room.sailG.position.set(R.x - 3.6, Y0 + 0.4, R.z - 6.4); room.g.add(room.sailG);
      const ks = PAST.API.Kit(); ks.box(0, 1.6, 0, 0.18, 3.6, 0.12, '#8a4a32'); for (let j = 0; j < 5; j++) ks.box(0.5, 0.3 + j * 0.7, 0, 1.1, 0.06, 0.08, '#6b4a2e', { ink: 0.004 }); ks.box(0.55, 1.6, 0.02, 0.95, 3.2, 0.02, '#f3ead6', { ink: 0.004 }); ks.build(room.sailG);
      room.rufo = api.person(room, rufoLook, { x: R.x - 4.8, z: R.z + 2.4, yaw: 2.4 }, nm('helper'));
    }
    if (room.i === 3) {
      // the cap: where the bell will hang (a beam, no bell yet); the young armadillo rolls about on the boards
      k.box(R.x, Y0 + 4.9, R.z - 1.2, 9.4, 0.36, 0.36, '#6b4a2e');
      for (const s of [-1, 1]) k.box(R.x + s * 4.6, Y0 + 2.45, R.z - 1.2, 0.36, 4.9, 0.36, '#6b4a2e');
      room.spot = { x: R.x + 0.4, z: R.z - 1.2 };
      let boss = null;
      if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) { try { boss = BATTLE.buildFoe('armadillo', 'green', { size: 'small' }); boss.scale.multiplyScalar(1.6); } catch (e) { console.warn('[molinar past mill] boss model', e); boss = null; } }
      if (boss) { boss.position.set(room.spot.x, Y0, room.spot.z); boss.rotation.y = 0.5; room.g.add(boss); if (boss.userData) boss.userData.mood = 'alert'; }
      room.boss = boss; room.bossSolid = { x: room.spot.x, z: room.spot.z, r: 1.4 }; WORLD.extra.push(room.bossSolid);
      room.orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffe6a8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      room.orb.scale.setScalar(1.6); room.orb.position.set(room.spot.x, Y0 + 1.2, room.spot.z); room.g.add(room.orb);
      room.brig = api.person(room, brigLook, { x: R.x - 4.4, z: R.z + 2.8, yaw: 2.6 }, nm('builder')); room.brig.g.visible = false; room.brig.solid.x = 1e5;
    }
    k.build(room.g);
  }
  function applyState(api) {
    const s = st(), r0 = api.rooms[0], r1 = api.rooms[1], r2 = api.rooms[2], r3 = api.rooms[3];
    (s.stones || []).forEach((on, i) => { if (on) setStone(r0, i, true); });
    if (s.crank) r0.crankG.rotation.x = Math.PI * 4;
    if (s.wheel) setWheel(r1, true);
    if (s.lever) r1.leverG.rotation.z = -0.5;
    if (s.mast) r2.ropeG.position.y = api.Y0 + 1.0;
    if (s.sails) r2.sailG.position.y = api.Y0 + 2.6;
    if (s.boss) { if (r3.boss) r3.boss.visible = false; r3.bossSolid.x = 1e5; r3.brig.g.visible = true; r3.brig.solid.x = r3.brig.api.x; }
  }
  function setStone(room, i, instant) {
    const o = room.stones[i], b = room.beds[i]; o.set = true; o.x = b.x; o.z = b.z; o.solid.x = b.x; o.solid.z = b.z;
    if (instant) o.g.position.set(b.x, K.Y0, b.z);
  }
  function setWheel(room, instant) {
    const w = room.wheel; w.set = true; room.wheelSolid.x = 1e5;
    if (instant) { room.wheelG.position.set(room.socket.x, K.Y0 + 2.4, room.socket.z + 0.4); room.wheelG.rotation.set(Math.PI / 2, 0, 0); }
  }
  // ---------------------------------------------------------- the floors' deeds
  async function pushStone(room, i) {
    const s = st(); s.stones = s.stones || [false, false];
    const r = await memory('stone'); if (!r) return;
    const o = room.stones[i], b = room.beds[i], G = K.G, Mm = G.sim.mimo;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: o.x, z: o.z + 1.4 }, o); await K.wait(0.7); Mm.hop = { t: 0 }; Sound.play('land', 8);
      const x0 = o.x, z0 = o.z; await K.tween(0.8, k => { o.g.position.set(lerp(x0, b.x, k), K.Y0, lerp(z0, b.z, k)); o.g.rotation.y = k * 3; });
      setStone(room, i, true); Sound.play('land', 12); G.w3d.fx.puff(b.x, K.Y0 + 0.3, b.z, 10, 0.3, '#e8dcc4'); s.stones[i] = true; G.save();
      G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    if (s.stones.every(Boolean)) { K.chime(); UI.toast('Both stones are on their beds! Now the crank.'); }
  }
  async function turnCrank(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { Sound.play('gears'); await K.tween(1.2, k => { room.crankG.rotation.x = k * Math.PI * 4; }); s.crank = true; G.save(); } finally { M.lock(false); }
    if (await writeLog(0, 'crank')) await K.floorDone(0);
  }
  async function pushWheel(room) {
    const s = st(); const r = await memory('wheel'); if (!r) return;
    const G = K.G, w = room.wheel;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: w.x, z: w.z + 1.8 }, w); await K.wait(0.7); G.sim.mimo.hop = { t: 0 }; Sound.play('land', 9);
      const p0 = room.wheelG.position.clone();
      await K.tween(1.1, k => { room.wheelG.position.set(lerp(p0.x, room.socket.x, k), K.Y0 + 0.2 + Math.sin(k * Math.PI) * 0.3 + k * 2.2, lerp(p0.z, room.socket.z + 0.4, k)); room.wheelG.rotation.set(k * Math.PI / 2, 0, k * 6); });
      setWheel(room, true); Sound.play('land', 14); s.wheel = true; G.save(); G.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    UI.toast('The big wheel is in its socket! Now the lever.');
  }
  async function pullLever(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try { Sound.play('click'); await K.tween(0.4, k => { room.leverG.rotation.z = lerp(0.5, -0.5, k); }); Sound.play('gears'); s.lever = true; G.save(); await K.wait(0.6); } finally { M.lock(false); }
    if (await writeLog(1, 'lever')) await K.floorDone(1);
  }
  async function climbMast(room) {
    const s = st(); const r = await memory('mast'); if (!r) return;
    const G = K.G;
    M.lock(true);
    try {
      G.sim.mimoGo({ x: room.mast.x + 0.8, z: room.mast.z + 1.6 }, room.mast); await K.wait(0.7);
      await K.mimoArc({ x: room.mast.x + 0.3, z: room.mast.z + 0.2 }, K.Y0 + 4.8, 0.8); Sound.play('climb');
      await K.tween(0.6, k => { room.ropeG.position.y = K.Y0 + 5.0 - k * 4.0; });
      await K.wait(0.3); await K.mimoLand(); s.mast = true; G.save();
    } finally { M.lock(false); }
    UI.toast('The rope is down! Haul the sails up with the winch.');
  }
  async function raiseSails(room) {
    const s = st(), G = K.G;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x - 1.0, K.Y0 + 3.4, room.R.z + 2.6), K.V(room.R.x - 3.4, K.Y0 + 2.8, room.R.z - 6.0));
      Sound.play('gears'); await K.tween(1.6, k => { room.sailG.position.y = K.Y0 + 0.4 + k * 2.2; }); s.sails = true; G.save(); await K.wait(0.5);
    } finally { M.lock(false); }
    if (await writeLog(2, 'sails')) await K.floorDone(2);
  }
  // the top: the first armadillo (the fight), Elio's echo, the head builder, the last line of the log, the mill done
  async function bossScene(room) {
    const s = st(), G = K.G, b = room.boss;
    M.lock(true);
    try {
      M.shot(K.V(room.R.x - 3.5, K.Y0 + 3.2, room.R.z + 4.5), K.V(room.spot.x, K.Y0 + 1.0, room.spot.z)); await K.wait(0.6);
      await M.you('A young armadillo, rolling round and round under the beam… and something in it glows.');
    } finally { M.lock(false); }
    const r = typeof MOLBOSS !== 'undefined' ? await MOLBOSS.fightArmadillo() : { outcome: 'win' };
    if (!r || r.outcome !== 'win') { M.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then try again. Tell it as a memory!' : 'It rolls off round the beam again.', 4); return; }
    s.boss = true; room.bossSolid.x = 1e5;
    M.lock(true);
    try {
      if (b) { G.w3d.fx.puff(room.spot.x, K.Y0 + 0.8, room.spot.z, 18, 0.45, '#e8dcc4'); await K.wait(0.4); b.visible = false; }
      // the shiny thing it found floats up, humming like a voice
      room.orb.position.set(room.spot.x, K.Y0 + 0.8, room.spot.z);
      await K.tween(1.4, k => { room.orb.material.opacity = k * 0.95; room.orb.position.y = K.Y0 + 0.8 + k * 1.2; room.orb.scale.setScalar(1.2 + k * 0.8); });
      Sound.play('chime'); await K.wait(0.4);
      await M.you('A boy’s voice… quiet, shy. The words he never said here.');
      const letter = typeof MOLBOSS !== 'undefined' ? MOLBOSS.letter('past') : 'B';
      await CH4.give('molinar', 'past', letter);
      await K.tween(0.8, k => { room.orb.material.opacity = 0.95 * (1 - k); room.orb.position.y = K.Y0 + 2.0 + k * 2; });
      // the head builder climbs up to see
      room.brig.g.visible = true; room.brig.solid.x = room.brig.api.x; Sound.play('wood');
      M.frame2(room.brig.api); await K.wait(0.5);
      await M.demo(room.brig.api, T().DEMO.room4, T().MARKS.room4);
    } finally { M.lock(false); }
    G.save();
    if (await writeLog(3, 'finished')) await finale(room);
  }
  async function finale() {
    const s = st(); s.done3 = true;
    TIME.flag('past', 'molBuilt', true); TIME.refresh();
    await K.leave({ slow: true, then: async () => {
      if (typeof MOL_PAST !== 'undefined') MOL_PAST.show(true);
      const G = K.G; G.cam.override = { pos: K.V(240 - 14, 9, -163.6 + 16), look: K.V(240, 11, -176) }; G.cam.snap(0, 0.3, 9);
    } });
    const G = K.G;
    M.lock(true);
    try {
      for (let k = 0; k < 3; k++) { Sound.play('chime'); await K.wait(0.9); }
      await (TIME._.fast.on ? Promise.resolve() : UI.chapter('The Great Mill', 'built, long ago'));
      const B = typeof MOL_PAST !== 'undefined' ? MOL_PAST.who('builder') : null;
      if (B) { M.frame2(B); await M.say(B, ln('builder.done')); }
    } finally { G.cam.override = null; M.lock(false); }
    M.think('Elio’s thank-you is free. Noa is waiting at the time crack by the west gate.', 5.5);
    G.save();
  }
  // ---------------------------------------------------------- E, room by room
  function interactables(room, api) {
    const s = st(), out = [], R = room.R, i = room.i, name = M.mimoName();
    const sayQ = kind => (api.quick[kind] ? `«${M.plainT(M.fillMimo((T().MEM[kind].model || {})[lang()] || '', lang()))}»` : `Tell ${name}`);
    if (room.rufo) out.push({ x: room.rufo.api.x - 0.6, z: room.rufo.api.z - 0.6, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { await M.say(room.rufo.api, ln('helper.hello')); } finally { M.lock(false); } } });
    if (i === 0) {
      if (!s.crank) room.stones.forEach((o, k) => { if (!(s.stones || [])[k]) out.push({ x: o.x, z: o.z + 1.3, r: 1.6, label: sayQ('stone'), run: () => pushStone(room, k) }); });
      if ((s.stones || []).filter(Boolean).length >= 2 && !s.crank) out.push({ x: room.crank.x + 1.1, z: room.crank.z, r: 1.6, label: 'Turn the crank', run: () => turnCrank(room) });
      if (s.crank && !s.done0) out.push({ x: room.log.x - 0.4, z: room.log.z + 1.2, r: 1.6, label: 'Write in the log', run: async () => { if (await writeLog(0, 'crank')) await K.floorDone(0); } });
    }
    if (i === 1) {
      if (!s.wheel) out.push({ x: room.wheel.x, z: room.wheel.z + 1.6, r: 1.8, label: sayQ('wheel'), run: () => pushWheel(room) });
      else if (!s.lever) out.push({ x: room.lever.x - 1.1, z: room.lever.z, r: 1.6, label: 'Pull the lever', run: () => pullLever(room) });
      if (s.lever && !s.done1) out.push({ x: room.log.x - 0.4, z: room.log.z + 1.2, r: 1.6, label: 'Write in the log', run: async () => { if (await writeLog(1, 'lever')) await K.floorDone(1); } });
    }
    if (i === 2) {
      if (!s.mast) out.push({ x: room.mast.x, z: room.mast.z + 1.8, r: 1.6, label: sayQ('mast'), run: () => climbMast(room) });
      else if (!s.sails) out.push({ x: room.winch.x, z: room.winch.z + 1.2, r: 1.6, label: 'Raise the sails', run: () => raiseSails(room) });
      if (s.sails && !s.done2) out.push({ x: room.log.x - 0.4, z: room.log.z + 1.2, r: 1.6, label: 'Write in the log', run: async () => { if (await writeLog(2, 'sails')) await K.floorDone(2); } });
    }
    if (i === 3) {
      if (!s.boss) out.push({ x: room.spot.x, z: room.spot.z + 2.0, r: 2.6, label: 'Catch it', run: () => bossScene(room) });
      else if (!s.done3) out.push({ x: room.log.x - 0.4, z: room.log.z + 1.2, r: 1.6, label: 'Write in the log', run: async () => { if (await writeLog(3, 'finished')) await finale(room); } });
      if (s.boss) out.push({ x: room.brig.api.x + 0.6, z: room.brig.api.z - 0.6, r: 1.4, label: 'Talk', run: async () => { M.lock(true); try { await M.say(room.brig.api, ln('builder.done')); } finally { M.lock(false); } } });
    }
    return out;
  }
  function target(room) {
    const s = st(), i = room.i;
    if (i === 0) { if (!s.crank) { const k = (s.stones || []).findIndex(f => !f); if (k >= 0 || !(s.stones || []).length) { const o = room.stones[k < 0 ? 0 : k]; return { x: o.x, z: o.z, hint: '{mimo} sniffs a millstone. It belongs on a round bed.' }; } return { x: room.crank.x, z: room.crank.z, hint: '{mimo} points at the crank on the wall.' }; } if (!s.done0) return { x: room.log.x, z: room.log.z, hint: '{mimo} points at the builders’ log.' }; }
    if (i === 1) { if (!s.wheel) return { x: room.wheel.x, z: room.wheel.z, hint: '{mimo} sniffs the big wheel. It belongs up on the wall.' }; if (!s.lever) return { x: room.lever.x, z: room.lever.z, hint: '{mimo} points at the lever.' }; if (!s.done1) return { x: room.log.x, z: room.log.z, hint: '{mimo} points at the log.' }; }
    if (i === 2) { if (!s.mast) return { x: room.mast.x, z: room.mast.z, hint: '{mimo} looks up the mast. The rope is at the top.' }; if (!s.sails) return { x: room.winch.x, z: room.winch.z, hint: '{mimo} points at the winch.' }; if (!s.done2) return { x: room.log.x, z: room.log.z, hint: '{mimo} points at the log.' }; }
    if (i === 3) { if (!s.boss) return { x: room.spot.x, z: room.spot.z, hint: '{mimo} watches the armadillo roll round and round.' }; if (!s.done3) return { x: room.log.x, z: room.log.z, hint: '{mimo} points at the log: one last line.' }; }
    return null;
  }
  async function onFirst(room) {
    const P = room.rufo;
    if (room.i === 1 && !st().ambush) {
      await K.wait(1.0);
      await M.you('Hushlings in the beams! In here, it’s all a memory: tell {mimo} what it did.');
      const r = await TIME.fight({ foes: [{ kind: 'hushling', color: 'green', size: 'small' }, { kind: 'moth', color: 'yellow', size: 'small' }, { kind: 'armadillo', color: 'blue', size: 'small' }], place: { x: 240, z: -176 } });
      if (!r || r.outcome !== 'win') return false;
      st().ambush = true; K.G.save();
    }
    const key = ['room1', 'room2', 'room3'][room.i];
    if (P && key) { await K.wait(room.i === 1 ? 0.6 : 1.6); M.lock(true); try { M.frame2(P.api); await M.demo(P.api, T().DEMO[key], T().MARKS[key]); } finally { M.lock(false); } }
    if (room.i === 0) M.think(`Two millstones, two round beds. Tell {mimo} what it did with each, as a memory: ${M.sx('mem')}.`, 6);
    if (room.i === 2) M.think('The rope is up the mast. {mimo} climbs; you haul the sails up with the winch.', 5);
    return true;
  }
  function update(room, dt, t) {
    if (room.rufo) K.animate(room.rufo, dt, t);
    if (room.brig) K.animate(room.brig, dt, t);
    const s = st();
    if (room.i === 1 && s.lever) { room.wallGears.forEach((g, i) => { g.rotation.z += dt * (i % 2 ? -0.9 : 0.7) / (0.6 + i * 0.3); }); room.wheelG.rotation.z += dt * 0.5; }
    if (room.i === 3 && room.boss && room.boss.visible && room.boss.userData.animate) {
      const b = room.boss, a = t * 0.9; b.position.set(room.spot.x + Math.cos(a) * 1.6, K.Y0, room.spot.z + Math.sin(a) * 1.1); b.rotation.y = a + Math.PI;
      if (b.userData) b.userData.curl = 1; b.userData.animate(dt, t, 1.4);
    }
  }
  // the dungeon's own look: the old photograph's sepia over the picture (the Past's sky dome stays hidden in here)
  function late() {
    const cv = document.getElementById('gl');
    if (cv && !document.body.classList.contains('in-battle')) cv.style.filter = 'sepia(0.3) saturate(1.14) hue-rotate(-6deg) contrast(1.03)';
    if (typeof PAST !== 'undefined' && PAST._ && PAST._.W && PAST._.W.sky) PAST._.W.sky.visible = false;
  }
  const MOD = MOLMILL.make({
    name: 'mol-past-mill', ROOMS: X.map((x, i) => ({ x, z: Z, name: T().ROOMS[i].name, sub: T().ROOMS[i].sub })),
    OUTSIDE: { x: 240, z: -165.4, yaw: 0 }, state: st, tint: { planks: ['#d4a874', '#c69a66', '#cfa06c'], wall: '#efe0c2', stones: true, window: '#fff0c8' },
    interior: { fog: '#5a4030', near: 20, far: 62 },
    build, applyState, interactables, target, onFirst, update, late,
    song: api => (api.cur === 3 && !st().boss ? (Sound.songs && Sound.songs.includes('mol_past_mill') ? 'mol_past_mill' : null) : Sound.songs && Sound.songs.includes('mol_past_mill') ? 'mol_past_mill' : null),
  });
  return Object.assign(MOD, { writeLog, finale });
})();
