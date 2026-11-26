'use strict';
// TOWNHALL: Alba's town hall and post office (D2, DESIGN.md 21.2 D), in every language with LIFE content (LIFE.ready()).
// THE HOUSE: 'alba-house-11', the two-floor house on the west street across from the Academy (its door faces the street,
// north). Claimed through INTERIORS.claim while LIFE is on: the town hall and the post office are downstairs. Leandro the
// stargazer keeps his flat upstairs: an outside stair on the house's side leads to his own door («Go up to Leandro's»),
// which opens his home as before (INTERIORS.enter: his telescope, his lines, his Looks; the claim steps aside while you visit).
// Outside: the plaque, the town's flag, a postbox (red in es / ja, yellow in pt / de, green in zh), the notice board (this
// month's debate, help wanted).
// THE ROOM: floats at (−68, 300, 56), 18 × 14 (SIDES.md). The lobby (south): the post counter and its clerk, the poste-
// restante pigeonholes, the writing desk, the stamp case, the notice board. The council hall (north, past a railing):
// the mayor's table under the town's crest, two lecterns, benches, a microphone stand where you speak.
//   TOWNHALL.init(game) · as a room (main.js ROOMS): .inside · .OUTSIDE · .interactables() · .update(dt, t) · .target()
//   · .enter() · .leave() · .curiosities() · outdoors (LIFE.update): .tick(dt, t, you) · .mapMark(dpr) · .door() · .spot(k)
//   · people for the debates: .person(look, at, o) · .clearExtras() · .shot(name) · .mayor · .clerk · ._ (tests)

const TOWNHALL = (() => {
  const DOOR_ID = 'alba-house-11', HOUSE_N = 11;
  const X0 = -68, Y0 = 300, Z0 = 56;
  const HW = 9, HD = 7, WH = 4.8, HALF = Math.PI / 2;
  const INK = '#2b2235', TEAL = '#2f6f6a', CREAM = '#fbf3dc', WOOD = '#8a5f3e', DARK = '#5a3a22', GOLD = '#d9a72c';
  let G = null;
  const L = () => LIFE.L();
  const on = () => LIFE.ready();
  const P = s => LIFE.P(s);
  const C = () => LIFE.content() || {};
  const pl = k => (C().place || {})[k];
  const plT = (k, fb) => { const v = pl(k); return P(Array.isArray(v) ? v[0] : v || fb || ''); };
  const plEn = (k, fb) => { const v = pl(k); return Array.isArray(v) ? v[1] : fb || ''; };
  const snd = k => LIFE.snd(k);
  const BOX = { es: '#c8322a', ja: '#c8322a', pt: '#f2c14e', de: '#f2c14e', zh: '#2f8f4e' };

  // ------------------------------------------------------------ outside: house 11 dressed as the town hall
  let OUT = null;
  function house() {
    if (typeof TOWN === 'undefined' || !TOWN.layout) return null;
    const b = TOWN.layout.buildings.filter(q => q.kind === 'house')[HOUSE_N - 1];
    if (!b) return null;
    const c = Math.cos(b.rot), s = Math.sin(b.rot), at = b.doorAt || null;
    const world = (lx, lz) => ({ x: b.x + lx * c + lz * s, z: b.z - lx * s + lz * c });
    const dlx = at ? (at.x - b.x) * c - (at.z - b.z) * s : 0;
    return { b, world, dlx, front: b.d / 2, yaw: b.rot, GY: (typeof TOWN !== 'undefined' && TOWN.GY) || 0.25 };
  }
  const tex = (w, h, draw) => ZHF.canvasTex(w, h, draw);
  // the town's crest: a teal shield, a rising sun over a bell and an envelope (Alba: the dawn; the voices; the letters)
  function crest(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
    c.beginPath(); c.moveTo(0, -40); c.lineTo(34, -30); c.lineTo(32, 6); c.quadraticCurveTo(28, 30, 0, 42); c.quadraticCurveTo(-28, 30, -32, 6); c.lineTo(-34, -30); c.closePath();
    c.fillStyle = TEAL; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.arc(0, -4, 15, Math.PI, 0); c.fillStyle = '#ffd36e'; c.fill(); c.lineWidth = 2.5; c.stroke();
    c.strokeStyle = '#ffd36e'; c.lineWidth = 3; for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 7; c.beginPath(); c.moveTo(Math.cos(a) * 19, -4 + Math.sin(a) * 19); c.lineTo(Math.cos(a) * 26, -4 + Math.sin(a) * 26); c.stroke(); }
    c.fillStyle = CREAM; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.rect(-17, 4, 34, 22); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-17, 4); c.lineTo(0, 17); c.lineTo(17, 4); c.stroke();
    c.restore();
  }
  function plaqueDraw(c) {
    c.clearRect(0, 0, 512, 256);
    SIGNS.paint(c, 512, 256, { text: plT('sign', 'TOWN HALL · POST'), edge: TEAL, face: CREAM, ink: INK, size: 0.4 });
    crest(c, 70, 128, 1.25);
  }
  function flagDraw(c) {
    c.fillStyle = CREAM; c.fillRect(0, 0, 256, 160); c.fillStyle = TEAL; c.fillRect(0, 0, 256, 52); c.fillRect(0, 108, 256, 52);
    crest(c, 128, 80, 0.95);
  }
  function boxPlateDraw(c) {
    c.fillStyle = CREAM; c.fillRect(0, 0, 256, 128); c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(3, 3, 250, 122);
    c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
    const t = plT('box', 'POST'); let px = 40; c.font = `900 ${px}px Bahnschrift, "Segoe UI", sans-serif`; while (px > 14 && c.measureText(t).width > 230) { px--; c.font = `900 ${px}px Bahnschrift, "Segoe UI", sans-serif`; }
    c.fillText(t, 128, 40);
    c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(96, 70, 64, 40); c.beginPath(); c.moveTo(96, 70); c.lineTo(128, 94); c.lineTo(160, 70); c.stroke();
  }
  // the notice board: its title, this month's debate, the jobs that are hiring (repainted when they change)
  function boardLines() {
    const out = [], hd = pl('boardTitle'); if (hd) out.push(LIFE.line(hd));
    try { if (typeof DEBATE !== 'undefined' && DEBATE.boardLine) { const d = DEBATE.boardLine(); if (d) out.push(d); } } catch (e) { /* */ }
    try { if (typeof JOBS !== 'undefined' && JOBS.boardLines) out.push(...JOBS.boardLines()); } catch (e) { /* */ }
    return out.filter(Boolean);
  }
  function boardDraw(c) {
    c.fillStyle = '#6b4a2e'; c.fillRect(0, 0, 512, 384); c.fillStyle = '#c99a64'; c.fillRect(14, 14, 484, 356);
    c.textAlign = 'left'; c.textBaseline = 'top';
    const ls = boardLines(); let y = 26;
    ls.slice(0, 6).forEach((l, i) => {
      const h = i ? 50 : 54, rot = ((i * 37) % 5 - 2) * 0.006;
      c.save(); c.translate(256, y + h / 2); c.rotate(rot); c.fillStyle = i ? '#fffdf6' : TEAL; c.fillRect(-232, -h / 2, 464, h - 6);
      c.fillStyle = i ? INK : CREAM; const t = P(l.t); let px = i ? 22 : 28; c.font = `800 ${px}px Bahnschrift, "Segoe UI", sans-serif`; while (px > 11 && c.measureText(t).width > 440) { px--; c.font = `800 ${px}px Bahnschrift, "Segoe UI", sans-serif`; }
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, 0, -3); c.restore();
      c.beginPath(); c.arc(256, y + 4, 6, 0, Math.PI * 2); c.fillStyle = '#c2412f'; c.fill();
      y += h + 4;
    });
  }
  let boardKey = '', boardTex = null, boardT = 0;
  function refreshBoard() {
    if (!boardTex) return;
    const k = L() + '|' + boardLines().map(l => l.t).join('|');
    if (k === boardKey) return; boardKey = k;
    boardDraw(boardTex.image.getContext('2d')); boardTex.needsUpdate = true;
  }
  function buildOutside() {
    const h = house(); if (!h || !G || typeof ZHF === 'undefined') return null;
    const g = new THREE.Group(); g.name = 'townhall-outside'; g.position.set(h.b.x, h.GY, h.b.z); g.rotation.y = h.yaw; G.w3d.scene.add(g);
    const F = h.front, dx = h.dlx, W2 = h.b.w / 2, k = ZHF.Kit(), solids = [];
    const W = (lx, lz) => h.world(lx, lz);
    // the plaque, two-sided on an iron bracket at the corner away from the stair
    const pcv = document.createElement('canvas'); pcv.width = 512; pcv.height = 256;
    const ptex = new THREE.CanvasTexture(pcv); ptex.anisotropy = 4;
    const drawPlaque = () => { plaqueDraw(pcv.getContext('2d')); ptex.needsUpdate = true; };
    if (SIGNS.board) SIGNS.board(drawPlaque); else drawPlaque();
    const side = dx > 0 ? -1 : 1, sx = side * (W2 - 0.2), sy = 2.5, sz = F + 0.86;
    k.box(sx, sy + 0.5, F + 0.66, 0.05, 0.05, 1.32, INK, { ink: 0 }).box(sx, sy + 0.24, F + 0.05, 0.06, 0.6, 0.06, INK, { ink: 0 });
    k.rod([sx, sy + 0.2, F + 0.05], [sx, sy + 0.5, F + 0.5], 0.018, INK, { ink: 0 });
    k.box(sx, sy, sz, 0.08, 0.76, 1.44, TEAL);
    for (const s of [-1, 1]) { const m = ZHF.plane(1.36, 0.68, ptex); m.position.set(sx + s * 0.045, sy, sz); m.rotation.y = s * HALF; g.add(m); }
    // the flag over the door
    const ftex = tex(256, 160, flagDraw);
    k.rod([dx, 3.0, F + 0.05], [dx, 3.55, F + 0.9], 0.025, '#cfcac2', { ink: 0.006 });
    const fl = ZHF.plane(0.9, 0.56, ftex, { double: true }); fl.position.set(dx, 3.15, F + 0.95); fl.rotation.set(0.35, 0, 0); g.add(fl);
    // the postbox, to the door's other side from the board
    const bx = dx + side * -1.35, bz = F + 0.55, col = BOX[L()] || BOX.es;
    k.cyl(bx, 0.55, bz, 0.26, 1.1, col).cyl(bx, 1.12, bz, 0.3, 0.06, col).ball(bx, 1.16, bz, 0.26, 0.12, 0.26, col);
    k.box(bx, 0.95, bz + 0.25, 0.26, 0.03, 0.04, INK, { ink: 0 });
    const btex = tex(256, 128, boxPlateDraw), bp = ZHF.plane(0.34, 0.17, btex); bp.position.set(bx, 0.68, bz + 0.265); g.add(bp);
    solids.push({ p: W(bx, bz), r: 0.34 });
    // the notice board, standing on two posts in front of the wall, beside the door (clear of the windows)
    const nbx = dx + side * 1.75, nbz = F + 1.0;
    const bcv = document.createElement('canvas'); bcv.width = 512; bcv.height = 384;
    boardTex = new THREE.CanvasTexture(bcv); boardTex.anisotropy = 4; boardKey = '';
    const nb = ZHF.plane(1.2, 0.9, boardTex); nb.position.set(nbx, 1.42, nbz + 0.04); g.add(nb);
    k.box(nbx, 1.42, nbz, 1.3, 1.0, 0.06, '#6b4a2e', { ink: 0.008 }).box(nbx, 1.98, nbz + 0.06, 1.42, 0.07, 0.22, DARK, { ink: 0.006 });
    for (const s of [-1, 1]) k.box(nbx + s * 0.6, 0.95, nbz - 0.04, 0.08, 1.9, 0.08, DARK, { ink: 0.005 });
    solids.push({ p: W(nbx, nbz), obox: { hw: 0.7, hd: 0.12 } });
    // Leandro's stair: up the side wall to his own door on the upper floor (a little landing, a blue door, his star)
    const stS = -side, stx = stS * (W2 + 0.55), z0 = F - 0.4, steps = 9, rise = 0.31, run = 0.42;
    for (let i = 0; i < steps; i++) k.box(stx, rise * (i + 0.5), z0 - i * run, 0.9, rise, run + 0.02, '#a8875a', { ink: 0.006 });
    const lz = z0 - steps * run - 0.5, ly = rise * steps;
    k.box(stx, ly - 0.08, lz, 1.0, 0.16, 1.1, '#a8875a', { ink: 0.008 });
    for (const s of [-1, 1]) k.rod([stx + stS * 0.45, 0.9, z0 + 0.2], [stx + stS * 0.45, ly + 0.9, lz + 0.5 * s * 0], 0.025, DARK, { ink: 0.004 });
    k.rod([stx + stS * 0.45, 0, z0 + 0.2], [stx + stS * 0.45, 0.9, z0 + 0.2], 0.03, DARK, { ink: 0.004 }).rod([stx + stS * 0.45, ly, lz - 0.5], [stx + stS * 0.45, ly + 0.9, lz - 0.5], 0.03, DARK, { ink: 0.004 });
    k.box(stS * (W2 + 0.04), ly + 0.95, lz, 0.08, 1.9, 0.9, '#3f6fb5', { ink: 0.008 });
    k.ball(stS * (W2 + 0.1), ly + 2.05, lz, 0.02, 0.12, 0.12, '#ffd84a', { ink: 0.004 });
    solids.push({ p: W(stx, (z0 + lz) / 2 + 0.2), obox: { hw: 0.5, hd: (z0 - lz) / 2 + 0.3 } });
    const baked = ZHF.bake(g, k);
    const outSolids = solids.map(s => s.obox ? { obox: 1, x: s.p.x, z: s.p.z, hw: s.obox.hw, hd: s.obox.hd, rot: h.yaw, townhall: true, off: { x: s.p.x, z: s.p.z } } : { x: s.p.x, z: s.p.z, r: s.r, townhall: true, off: { x: s.p.x, z: s.p.z } });
    return { g, baked, h, solids: outSolids, door: W(dx, F + 0.8), doorIn: W(dx, F + 0.35), board: W(nbx, nbz + 0.85), box: W(bx, bz + 0.6), stair: W(stx, z0 + 0.9), plaque: W(sx, F + 1.25) };
  }
  function tick(dt, t, you) {
    if (!G || typeof TOWN === 'undefined') return;
    const live = on();
    if (!OUT && !live) return;
    if (!OUT) { try { OUT = buildOutside() || { broken: true }; } catch (e) { console.error('[townhall]', e); OUT = { broken: true }; } }
    if (OUT.broken) return;
    const town = G.town && G.town.group;
    const vis = live && !(G.indoors && G.indoors()) && (!town || town.visible);
    OUT.g.visible = vis;
    for (const s of OUT.solids) { if (!WORLD.extra.includes(s)) WORLD.extra.push(s); if (vis) { s.x = s.off.x; s.z = s.off.z; } else { s.x = s.z = 1e5; } }
    if (!OUT.signed && typeof SIGNS !== 'undefined' && SIGNS.add) {
      OUT.signed = true;
      SIGNS.add({ id: 'townhall-plaque', x: OUT.plaque.x, z: OUT.plaque.z, r: 1.3, when: () => !inside && on(), card: () => ({ tag: 'The plaque at the corner', lines: [{ text: plT('sign', ''), en: plEn('sign', 'Town hall · Post office'), look: { face: CREAM, edge: TEAL, ink: INK } }] }) });
      SIGNS.add({ id: 'townhall-box', x: OUT.box.x, z: OUT.box.z, r: 1.1, when: () => !inside && on(), card: () => boxCard() });
    }
    if (vis && ((boardT -= dt) <= 0 || !boardKey)) { boardT = 2; refreshBoard(); }
    // (Leandro: while you visit his flat, the claim steps aside; once you're back out, it holds again)
    if (visit === 1 && typeof INTERIORS !== 'undefined' && INTERIORS.inside) visit = 2;
    else if (visit === 2 && typeof INTERIORS !== 'undefined' && !INTERIORS.inside) visit = 0;
    else if (visit === 1 && Date.now() - visitAt > 8000) visit = 0;
  }
  function boxCard() {
    const look = { face: CREAM, edge: BOX[L()] || BOX.es, ink: INK };
    const lines = [{ text: plT('box', ''), en: plEn('box', 'Postbox'), look }].concat(LIFE.lines(pl('boxPlate') || []).map(l => ({ text: l.t, en: l.en, look })));
    return { tag: 'The postbox', lines };
  }
  function boardCard() {
    const look = { face: '#fffdf6', edge: '#6b4a2e', ink: INK };
    return { tag: 'The town’s notice board', lines: boardLines().map(l => ({ text: l.t, en: l.en, look })) };
  }

  // ------------------------------------------------------------ the room (built on the first visit)
  let ROOM = null;
  const SPOT = { spawn: { x: 0, z: HD - 1.3 }, exit: { x: 0, z: HD - 0.5 }, counter: { x: -4.5, z: 2.8 }, clerk: { x: -7.0, z: 2.8 },
    desk: { x: 6.2, z: 3.4 }, deskAt: { x: 7.7, z: 3.4 }, caseAt: { x: 4.8, z: HD - 0.7 }, case: { x: 4.8, z: HD - 1.8 }, board: { x: -4.4, z: HD - 1.1 },
    holes: { x: -7.4, z: 5.6 }, mayor: { x: 0, z: -6.1 }, mayorTalk: { x: 0, z: -3.9 }, mic: { x: 0, z: -3.3 }, you: { x: 0, z: -2.7 },
    lecA: { x: -3.6, z: -4.6 }, lecB: { x: 3.6, z: -4.6 }, spkA: { x: -4.0, z: -4.9 }, spkB: { x: 4.0, z: -4.9 } };
  const BENCH = []; for (const z of [-1.5, -0.4]) for (const s of [-1, 1]) BENCH.push({ x: s * 4.1, z, len: 4.4 });
  const SEATS = []; BENCH.forEach(b => { for (let i = 0; i < 3; i++) SEATS.push({ x: b.x - 1.45 + i * 1.45, z: b.z }); });
  function floorTex() { return tex(512, 512, c => { for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { c.fillStyle = (i + j) % 2 ? '#e8dcc4' : '#c9b48e'; c.fillRect(i * 64, j * 64, 64, 64); } c.strokeStyle = 'rgba(60,40,20,.25)'; c.lineWidth = 2; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, 512); c.moveTo(0, i * 64); c.lineTo(512, i * 64); c.stroke(); } }); }
  function wallTex() {
    return tex(512, 512, c => {
      c.fillStyle = '#f1ead6'; c.fillRect(0, 0, 512, 512);
      c.fillStyle = 'rgba(47,111,106,.08)'; for (let x = 0; x < 512; x += 40) c.fillRect(x, 0, 18, 360);
      c.fillStyle = TEAL; c.fillRect(0, 372, 512, 140); c.fillStyle = GOLD; c.fillRect(0, 364, 512, 8);
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 3; for (let x = 0; x < 512; x += 128) c.strokeRect(x + 12, 388, 104, 108);
    });
  }
  function signTex(text, w = 512, h = 128, bg = TEAL, fg = CREAM) {
    return tex(w, h, c => { c.fillStyle = bg; c.fillRect(0, 0, w, h); c.strokeStyle = GOLD; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; let px = Math.round(h * 0.5); c.font = `900 ${px}px Bahnschrift, "Segoe UI", sans-serif`; while (px > 12 && c.measureText(text).width > w - 40) { px--; c.font = `900 ${px}px Bahnschrift, "Segoe UI", sans-serif`; } c.fillText(text, w / 2, h / 2 + 2); });
  }
  function crestTex() { return tex(256, 256, c => { c.clearRect(0, 0, 256, 256); crest(c, 128, 128, 2.6); }); }
  function windowTex() {
    return tex(256, 320, c => {
      const gr = c.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, '#9fd4ef'); gr.addColorStop(1, '#e6f4ea'); c.fillStyle = gr; c.fillRect(0, 0, 256, 320);
      c.fillStyle = '#7fb069'; c.beginPath(); c.ellipse(170, 300, 140, 60, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#f4efe4'; c.lineWidth = 14; c.strokeRect(7, 7, 242, 306); c.beginPath(); c.moveTo(128, 0); c.lineTo(128, 320); c.moveTo(0, 160); c.lineTo(256, 160); c.stroke();
    });
  }
  function stampsTex() {
    return tex(512, 256, c => {
      c.fillStyle = '#3a2a22'; c.fillRect(0, 0, 512, 256); c.fillStyle = '#f7f0dc'; c.fillRect(10, 10, 492, 236);
      const cols = ['#d6453a', '#3f6fb5', '#2f8f4e', '#e6a92e', '#8a4f7d', '#2f6f6a', '#c2412f', '#5b8fd6'];
      for (let i = 0; i < 16; i++) { const x = 30 + (i % 8) * 59, y = 30 + Math.floor(i / 8) * 104; c.fillStyle = '#fffdf6'; c.fillRect(x, y, 48, 60); c.fillStyle = cols[(i * 3) % 8]; c.fillRect(x + 5, y + 5, 38, 40); c.fillStyle = '#fffdf6'; c.beginPath(); c.arc(x + 24, y + 22, 8, 0, Math.PI * 2); c.fill(); c.fillStyle = INK; c.font = '700 10px sans-serif'; c.fillText(String(i + 1), x + 20, y + 56); }
    });
  }
  const glowSprite = (col, s) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: col, transparent: true, opacity: 0.42, depthWrite: false })); m.scale.setScalar(s); return m; };
  function buildRoom() {
    const g = new THREE.Group(); g.name = 'townhall-room'; g.position.set(X0, Y0, Z0); g.visible = false; G.w3d.scene.add(g);
    const k = ZHF.Kit(), solids = [], glows = [];
    const ft = floorTex(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(HW / 2.5, HD / 2.5);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, 0.3, 2 * HD), new THREE.MeshToonMaterial({ map: ft, gradientMap: TK.grad })); floor.position.y = -0.15; floor.receiveShadow = true; g.add(floor);
    const wt = wallTex(); wt.wrapS = THREE.RepeatWrapping;
    for (const [w, x, z, ry] of [[2 * HW, 0, -HD, 0], [2 * HW, 0, HD, Math.PI], [2 * HD, -HW, 0, HALF], [2 * HD, HW, 0, -HALF]]) {
      const t = wt.clone(); t.needsUpdate = true; t.repeat.set(w / 5, 1);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), new THREE.MeshToonMaterial({ map: t, gradientMap: TK.grad })); m.position.set(x, WH / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    }
    solids.push({ obox: 1, x: 0, z: -HD - 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: 0, z: HD + 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: -HW - 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 }, { obox: 1, x: HW + 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 });
    for (const [x, z] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD]]) k.box(x + (x < 0 ? 0.1 : -0.1), WH / 2, z + (z < 0 ? 0.1 : -0.1), 0.22, WH, 0.22, DARK);
    // the council hall's floor: a dark wood dais under the mayor's table, a carpet down the middle
    k.box(0, 0.06, -5.9, 7.6, 0.12, 2.0, '#7a5236', { ink: 0.006 });
    k.box(0, 0.012, -2.2, 1.6, 0.02, 3.6, '#8a2f45', { ink: 0 });
    // the railing between the lobby and the hall, with a gap in the middle
    for (const s of [-1, 1]) {
      const x0 = s * 1.2, x1 = s * (HW - 0.3), z = 0.55;
      k.box((x0 + x1) / 2, 0.86, z, Math.abs(x1 - x0), 0.08, 0.1, WOOD); k.box((x0 + x1) / 2, 0.35, z, Math.abs(x1 - x0), 0.06, 0.08, WOOD);
      for (let x = x0; s > 0 ? x <= x1 : x >= x1; x += s * 0.55) k.box(x, 0.43, z, 0.07, 0.86, 0.07, DARK, { ink: 0.004 });
      solids.push({ obox: 1, x: (x0 + x1) / 2, z, hw: Math.abs(x1 - x0) / 2, hd: 0.12, rot: 0 });
    }
    // the mayor's table, the crest and two flags on the north wall
    const M = SPOT.mayor;
    k.box(0, 0.88, M.z + 0.85, 3.6, 0.08, 1.0, '#7a5236').box(0, 0.46, M.z + 1.3, 3.5, 0.8, 0.05, TEAL, { ink: 0.006 });
    for (const s of [-1, 1]) k.box(s * 1.65, 0.45, M.z + 0.85, 0.12, 0.86, 0.9, DARK, { ink: 0.004 });
    k.cyl(0.9, 1.0, M.z + 0.75, 0.05, 0.16, GOLD).ball(-1.0, 0.96, M.z + 0.8, 0.09, 0.05, 0.09, GOLD);
    for (let i = 0; i < 3; i++) k.box(-0.3 + i * 0.03, 0.93 + i * 0.008, M.z + 0.9, 0.34, 0.01, 0.46, '#fffaf0', { ink: 0.003, ry: i * 0.06 });
    solids.push({ obox: 1, x: 0, z: M.z + 0.85, hw: 1.85, hd: 0.6, rot: 0 }, { x: M.x, z: M.z, r: 0.45 });
    const cr = ZHF.plane(1.5, 1.5, crestTex(), { alpha: true }); cr.position.set(0, 3.4, -HD + 0.06); g.add(cr);
    for (const s of [-1, 1]) { k.rod([s * 1.8, 0, -HD + 0.35], [s * 1.8, 3.2, -HD + 0.35], 0.03, GOLD, { ink: 0.004 }); const fl = ZHF.plane(0.7, 1.1, tex(128, 200, c => { flagDraw(c); }), { double: true }); fl.position.set(s * 1.8 + s * 0.36, 2.55, -HD + 0.4); g.add(fl); }
    // two lecterns, facing the middle; the microphone stand where you speak
    for (const [A, sgn] of [[SPOT.lecA, -1], [SPOT.lecB, 1]]) {
      k.frame(A.x, 0, A.z, sgn * -0.5);
      k.box(0, 0.55, 0, 0.6, 1.1, 0.45, WOOD).box(0, 1.14, 0.05, 0.7, 0.06, 0.55, '#7a5236', { rx: -0.25 });
      k.free();
      solids.push({ x: A.x, z: A.z, r: 0.42 });
    }
    k.cyl(SPOT.mic.x, 0.02, SPOT.mic.z, 0.2, 0.04, INK).cyl(SPOT.mic.x, 0.7, SPOT.mic.z, 0.02, 1.36, '#8a8a92', { ink: 0.004 }).ball(SPOT.mic.x, 1.42, SPOT.mic.z + 0.05, 0.06, 0.08, 0.06, INK, { ink: 0 });
    solids.push({ x: SPOT.mic.x, z: SPOT.mic.z, r: 0.18 });
    // the benches for the townsfolk
    for (const b of BENCH) {
      k.box(b.x, 0.44, b.z, b.len, 0.08, 0.5, WOOD).box(b.x, 0.78, b.z + 0.24, b.len, 0.5, 0.06, WOOD);
      for (const a of [-1, 1]) k.box(b.x + a * (b.len / 2 - 0.15), 0.21, b.z, 0.08, 0.42, 0.46, DARK, { ink: 0.004 });
      solids.push({ obox: 1, x: b.x, z: b.z + 0.04, hw: b.len / 2 + 0.05, hd: 0.33, rot: 0 });
    }
    // the post counter (west), the clerk's stool, the scale; the poste-restante pigeonholes behind; its sign
    k.box(-5.8, 0.52, 2.8, 0.8, 1.04, 4.4, '#7a5236').box(-5.75, 1.07, 2.8, 0.95, 0.07, 4.6, '#a8875a', { ink: 0.008 });
    k.box(-5.36, 0.55, 2.8, 0.02, 0.8, 4.0, TEAL, { ink: 0.004 });
    k.cyl(-5.8, 1.16, 1.4, 0.16, 0.1, GOLD).box(-5.8, 1.3, 1.4, 0.36, 0.03, 0.26, GOLD, { ink: 0.004 });
    for (let i = 0; i < 5; i++) k.box(-5.75, 1.12 + i * 0.012, 4.0 + i * 0.02, 0.26, 0.01, 0.36, i % 2 ? '#fffaf0' : '#f3e4c4', { ink: 0.003, ry: i * 0.1 });
    solids.push({ obox: 1, x: -5.8, z: 2.8, hw: 0.5, hd: 2.3, rot: 0 }, { x: SPOT.clerk.x, z: SPOT.clerk.z, r: 0.45 });
    k.frame(-HW + 0.3, 0, 2.8, HALF);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) {
      const x = -1.8 + i * 0.6, y = 1.0 + j * 0.42;
      k.box(x, y, 0, 0.56, 0.4, 0.4, '#a8875a', { ink: 0.004 });
      if ((i * 7 + j * 3) % 4 === 0) k.box(x, y - 0.05, 0.12, 0.38, 0.22, 0.04, (i + j) % 2 ? '#fffaf0' : '#f3e4c4', { ink: 0.003, rz: 0.05 });
    }
    k.free();
    solids.push({ obox: 1, x: -HW + 0.3, z: 2.8, hw: 0.3, hd: 2.2, rot: 0 });
    const rs = ZHF.plane(3.2, 0.62, signTex(plT('restante', 'Poste restante'))); rs.position.set(-HW + 0.05, 3.5, 2.8); rs.rotation.y = HALF; g.add(rs);
    // the writing desk (east): paper, an inkpot, a lamp, a chair
    const D = SPOT.deskAt;
    k.box(D.x, 0.76, D.z, 1.0, 0.07, 1.9, '#7a5236'); for (const [a, b] of [[-0.42, -0.85], [0.42, -0.85], [-0.42, 0.85], [0.42, 0.85]]) k.box(D.x + a, 0.37, D.z + b, 0.07, 0.74, 0.07, DARK, { ink: 0.004 });
    k.box(D.x - 0.1, 0.8, D.z, 0.36, 0.01, 0.5, '#fffaf0', { ink: 0.003, ry: 0.1 }).cyl(D.x + 0.25, 0.84, D.z - 0.55, 0.06, 0.09, INK).rod([D.x + 0.25, 0.88, D.z - 0.55], [D.x + 0.1, 1.1, D.z - 0.45], 0.008, '#f4efe4', { ink: 0 });
    k.cyl(D.x + 0.3, 0.82, D.z + 0.65, 0.1, 0.04, GOLD).cyl(D.x + 0.3, 1.05, D.z + 0.65, 0.015, 0.45, GOLD, { ink: 0.003 }).add(ZHF.GEO.cone, '#2f7a4a', D.x + 0.3, 1.28, D.z + 0.6, 0.16, 0.1, 0.16);
    glows.push({ x: D.x + 0.3, y: 1.2, z: D.z + 0.6, c: '#ffe7a0', s: 1.2 });
    k.box(D.x - 0.85, 0.44, D.z, 0.48, 0.06, 0.48, WOOD).box(D.x - 1.07, 0.74, D.z, 0.05, 0.56, 0.48, WOOD);
    solids.push({ obox: 1, x: D.x, z: D.z, hw: 0.55, hd: 1.0, rot: 0 });
    // the stamp case by the door (east), the notice board (west of the door)
    const S = SPOT.caseAt;
    k.box(S.x, 0.45, S.z, 1.6, 0.9, 0.7, DARK).box(S.x, 0.93, S.z, 1.66, 0.06, 0.76, '#a8875a', { ink: 0.006 });
    const st = ZHF.plane(1.45, 0.62, stampsTex()); st.position.set(S.x, 0.97, S.z); st.rotation.x = -HALF; g.add(st);
    solids.push({ obox: 1, x: S.x, z: S.z, hw: 0.85, hd: 0.4, rot: 0 });
    const BD = SPOT.board;
    ROOM_BOARD = ZHF.plane(1.7, 1.28, tex(512, 384, boardDraw)); ROOM_BOARD.position.set(BD.x, 1.8, HD - 0.07); ROOM_BOARD.rotation.y = Math.PI; g.add(ROOM_BOARD);
    k.box(BD.x, 1.8, HD - 0.04, 1.82, 1.4, 0.05, '#6b4a2e', { ink: 0.008 });
    // windows (both side walls, in the hall), a clock, hanging lamps, plants
    for (const z of [-4.6, -1.8]) for (const s of [-1, 1]) { const w = ZHF.plane(1.3, 1.7, windowTex()); w.position.set(s * (HW - 0.03), 2.5, z); w.rotation.y = -s * HALF; g.add(w); }
    const clk = ZHF.plane(0.62, 0.62, tex(128, 128, c => { c.fillStyle = '#fbf6e7'; c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.fill(); c.lineWidth = 6; c.strokeStyle = DARK; c.stroke(); c.fillStyle = INK; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.fillRect(64 + Math.cos(a) * 46 - 3, 64 + Math.sin(a) * 46 - 3, 6, 6); } c.fillRect(62, 30, 4, 36); c.fillRect(62, 62, 26, 4); }), { alpha: true });
    clk.position.set(0, 3.8, HD - 0.05); clk.rotation.y = Math.PI; g.add(clk);
    for (const [x, z] of [[-3.0, -3.0], [3.0, -3.0], [-3.0, 3.4], [3.0, 3.4]]) { k.cyl(x, WH - 0.45, z, 0.008, 0.9, INK, { ink: 0, geo: ZHF.GEO.cyl8 }).add(ZHF.GEO.cone, TEAL, x, WH - 0.95, z, 0.34, 0.26, 0.34); glows.push({ x, y: WH - 1.15, z, c: '#ffe7a0', s: 2.4 }); }
    for (const [x, z] of [[-HW + 0.6, -HD + 0.6], [HW - 0.6, -HD + 0.6], [HW - 0.6, HD - 0.6]]) { k.cyl(x, 0.25, z, 0.3, 0.5, '#b5653a').ball(x, 0.85, z, 0.38, 0.5, 0.38, '#3f7a4a', { ink: 0.008 }); solids.push({ x, z, r: 0.4 }); }
    k.box(0, 0.016, HD - 0.62, 1.8, 0.02, 0.9, TEAL, { ink: 0 });
    const baked = ZHF.bake(g, k);
    const sprites = glows.map(q => { const s = glowSprite(q.c, q.s); s.position.set(q.x, q.y, q.z); g.add(s); return s; });
    WORLD.addSolids(solids.map(s => Object.assign({}, s, { x: X0 + s.x, z: Z0 + s.z, townhall: true })));
    WORLD.addPlatforms([{ box: [X0 - HW, X0 + HW, Z0 - HD, Z0 + HD], top: Y0, townhall: true }]);
    ROOM = { g, baked, sprites, extras: [] };
    makePeople();
    return ROOM;
  }
  let ROOM_BOARD = null, roomBoardKey = '';
  function refreshRoomBoard() {
    if (!ROOM_BOARD) return;
    const k = L() + '|' + boardLines().map(l => l.t).join('|'); if (k === roomBoardKey) return; roomBoardKey = k;
    const old = ROOM_BOARD.material.map; ROOM_BOARD.material.map = tex(512, 384, boardDraw); ROOM_BOARD.material.needsUpdate = true; if (old) old.dispose();
  }

  // ------------------------------------------------------------ the people: the clerk, the mayor (looks from the content), and extras
  const zLook = l => {
    l = l || {};
    return { skin: l.skin || '#e6b48c', hair: l.hair || '#3a2b26', shirt: l.shirt || l.dress || '#3f6fb5', sleeve: l.sleeve, pants: l.pants || '#3a3436', shoes: l.shoes || '#3a2b26',
      apron: l.apron, glasses: !!l.glasses, bald: l.hairdo === 'bald' || !!l.bald, mustache: !!(l.stache || l.mustache), old: !!l.old, vest: l.vest, collar: l.collar, kid: !!l.kid, belly: !!l.belly,
      hat: l.zhat || null, hatCol: l.hatColor || l.hatCol };
  };
  let PC = null, PM = null, rigLang = '';
  function makePeople() {
    if (!ROOM) return;
    for (const p of [PC, PM]) if (p && p.root && p.root.parent) p.root.parent.remove(p.root);
    const c = C();
    PC = ZHF.person(zLook((c.clerk || {}).look)); PC.x = SPOT.clerk.x; PC.z = SPOT.clerk.z; PC.yaw = PC.baseYaw = HALF; ROOM.g.add(PC.root);
    PM = ZHF.person(zLook((c.mayor || {}).look)); PM.x = SPOT.mayor.x; PM.z = SPOT.mayor.z; PM.yaw = PM.baseYaw = 0; ROOM.g.add(PM.root);
    rigLang = L();
  }
  // a person for a scene (the debate's speakers, the audience): room-local at; o: { sit, seatY, yaw, pose }
  function person(look, at, o = {}) {
    if (!ROOM) buildRoom();
    const p = ZHF.person(zLook(look), o.sit ? { sit: true, seatY: o.seatY || 0.47 } : {});
    p.x = at.x; p.z = at.z; p.y = 0; p.yaw = p.baseYaw = o.yaw != null ? o.yaw : Math.PI; p.pose = o.pose || 'idle'; p.noTurn = !!o.noTurn;
    ROOM.g.add(p.root); ROOM.extras.push(p);
    return p;
  }
  function clearExtras() { if (!ROOM) return; for (const p of ROOM.extras) if (p.root && p.root.parent) p.root.parent.remove(p.root); ROOM.extras = []; }
  // a line said in the room, over a person's head (STORY.sayInline: the weave mixes it like everyone's)
  const RP = (rig, name) => ({ id: 'townhall', get name() { return typeof name === 'function' ? name() : name; }, get x() { return X0 + (rig ? rig.x : 0); }, get z() { return Z0 + (rig ? rig.z : 0); }, y: Y0, top: 1.95, lines: null,
    get talking() { return !!(rig && rig.talking); }, set talking(v) { if (rig) rig.talking = !!v; } });
  async function sayBy(rig, name, ln) {
    if (!ln || !ln.t) return;
    const who = RP(rig, name); who.lines = { [L()]: ln.t, en: ln.en || '' };
    try { const said = STORY.sayInline(who, true); mixInto(STORY.line, who, ln.t, ln.en); await said; } catch (e) { console.error('[townhall] say', e); }
  }
  function mixInto(ln, who, text, en) {
    if (!ln || ln.at !== who || typeof MIX === 'undefined' || !MIX.ok() || !text || !en) return;
    try { const m = MIX.line(text, en, { key: 'townhall:' + en, count: true }); if (m.full) return; ln.parts = m.parts; delete ln.text; ln.len = UI.partsLen(m.parts); ln.en = en; ln.under = false; } catch (e) { /* (whole, in the language) */ }
  }
  const clerkName = () => P((C().clerk || {}).name || 'the clerk');
  const mayorName = () => P((C().mayor || {}).name || 'the mayor');
  const clerkSay = ln => sayBy(PC, clerkName, ln);
  const mayorSay = ln => sayBy(PM, mayorName, ln);

  // ------------------------------------------------------------ in and out (a room: main.js ROOMS, story.js interactables)
  let inside = false, busy = false, visit = 0, visitAt = 0;
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
    M.x = x + Math.cos(yaw) * 0.95; M.z = z - Math.sin(yaw) * 0.95; M.station = null; M.look = null; M.hop = null; M.wander = null;
    [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3);
    G.sim.snap();
  }
  function outsideSpot() { const h = house(); if (!h) return { x: -41.6, z: -148.0, yaw: 0 }; const p = h.world(h.dlx, h.front + 1.5); return { x: p.x, z: p.z, yaw: h.yaw }; }
  async function enter(o = {}) {
    if (!G || inside || busy || !on()) return;
    busy = true;
    try {
      if (!ROOM) buildRoom();
      if (rigLang !== L()) makePeople();
      refreshRoomBoard();
      snd('wood');
      await UI.fade(1, 380);
      inside = true; ROOM.g.visible = true;
      G.w3d.setInterior({ fog: '#2a2018', near: 26, far: 70 });
      const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); G.cam.snap(Math.PI, 0.6, 11);
      await UI.fade(0, 380);
    } catch (e) { console.error('[townhall] enter', e); }
    busy = false;
    const st = LIFE.S(); st.hallVisits = (st.hallVisits || 0) + 1;
    if (st.hallVisits === 1) { try { UI.chapter(plT('hall', 'Town hall'), plEn('hall', 'Alba’s town hall and post office')); } catch (e) { /* */ } }
    LIFE.save();
    if (o.quiet) return;
    if (st.hallVisits === 1) { await STORY.wait(0.4); const l1 = LIFE.said('hello', 'clerk'); if (l1) await clerkSay(l1); }
  }
  async function leave() {
    if (!G || !inside || busy) return;
    busy = true;
    try {
      snd('wood');
      await UI.fade(1, 380);
      inside = false; if (ROOM) ROOM.g.visible = false; G.w3d.setInterior(null); G.sim.mimoGo(null);
      const o = outsideSpot(); [o.x, o.z] = WORLD.pushOut(o.x, o.z, 0.45); teleport(o.x, o.z, o.yaw); G.cam.snap(o.yaw + Math.PI - 0.9, 0.34, 8.5);
      await UI.fade(0, 380);
    } catch (e) { console.error('[townhall] leave', e); }
    busy = false;
  }
  // Leandro's flat, upstairs: his own door at the top of the outside stair (INTERIORS opens his home as it always did)
  async function upToLeandro() {
    if (typeof INTERIORS === 'undefined' || !INTERIORS.enter) return;
    visit = 1; visitAt = Date.now();
    try { await INTERIORS.enter(DOOR_ID); } catch (e) { console.error('[townhall] leandro', e); visit = 0; }
  }
  function roomItems() {
    const list = []; if (!inside || busy || !ROOM) return list;
    const A = (p, r, label, run) => list.push({ x: X0 + p.x, z: Z0 + p.z, y: Y0, r, label, run });
    A(SPOT.exit, 1.4, 'Leave', leave);
    A(SPOT.counter, 1.6, 'Talk', () => (typeof MAIL !== 'undefined' ? MAIL.counter() : null));
    A(SPOT.desk, 1.4, 'Write', () => (typeof MAIL !== 'undefined' ? MAIL.desk() : null));
    A(SPOT.case, 1.3, 'Look', () => (typeof MAIL !== 'undefined' ? MAIL.album() : null));
    A(SPOT.board, 1.3, 'Read', () => SIGNS.read(boardCard()));
    A(SPOT.holes, 1.1, 'Look', async () => STORY.think('Pigeonholes, one per name: letters wait here for whoever comes to ask. A few have your name on them now and then.', 5));
    if (!(typeof DEBATE !== 'undefined' && DEBATE.running)) A(SPOT.mayorTalk, 1.7, 'Talk', () => (typeof DEBATE !== 'undefined' ? DEBATE.menu() : mayorSay(LIFE.said('hello', 'mayor'))));
    return list;
  }
  // (the walls are thin: keep you and Mimo in the room)
  function keepIn() {
    const lim = (v, c, h) => Math.max(c - h, Math.min(c + h, v)), M = G.sim.mimo, Y = G.sim.you;
    if (!M.hidden && (Math.abs(M.x - X0) > HW - 0.3 || Math.abs(M.z - Z0) > HD - 0.3 || M.y < Y0 - 1)) { M.hop = null; M.wander = null; M.x = lim(M.x, X0, HW - 0.7); M.z = lim(M.z, Z0, HD - 0.7); M.y = M.ry = Y0; }
    if (M.wander && (Math.abs(M.wander.x - X0) > HW - 0.7 || Math.abs(M.wander.z - Z0) > HD - 0.7)) { M.wander.x = lim(M.wander.x, X0, HW - 0.8); M.wander.z = lim(M.wander.z, Z0, HD - 0.8); }
    if (Y.y < Y0 - 2 || Math.abs(Y.x - X0) > HW + 0.5 || Math.abs(Y.z - Z0) > HD + 0.5) { const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); }
  }
  function roomUpdate(dt, t) {
    if (!inside || !ROOM) return;
    if (!on()) { inside = false; ROOM.g.visible = false; G.w3d.setInterior(null); const o = outsideSpot(); teleport(o.x, o.z, o.yaw); return; }
    keepIn();
    const Y = G.sim.you, you = { x: Y.x - X0, z: Y.z - Z0 };
    for (const p of [PC, PM].concat(ROOM.extras)) if (p) ZHF.animate(p, dt, t, you);
    ROOM.sprites.forEach((s, i) => { s.material.opacity = 0.38 + 0.05 * Math.sin(t * 3.1 + i * 1.7); });
    if ((t % 2) < dt + 0.001) refreshRoomBoard();
    // (a scene that broke off never leaves you frozen)
    const open = (typeof LIFEUI !== 'undefined' && LIFEUI.isOpen) || (typeof TALK !== 'undefined' && TALK.busy) || (typeof DEBATE !== 'undefined' && DEBATE.running);
    if (G.sim.lock && !STORY.busy && !busy && !open && !document.querySelector('#choose:not(.hidden)')) { G.sim.lock = 0; G.cam.override = null; }
  }
  const PROVIDER = {
    interactables() {
      if (!G || !OUT || OUT.broken || !G.state.flags.hatched || !on() || inside) return [];
      const D = OUT.doorIn || OUT.door;
      return [{ x: D.x, z: D.z, r: 1.6, label: 'Go in', run: enter },
        { x: OUT.board.x, z: OUT.board.z, r: 1.2, label: 'Read', run: () => SIGNS.read(boardCard()) },
        { x: OUT.stair.x, z: OUT.stair.z, r: 1.3, label: 'Go up to Leandro’s', run: upToLeandro }];
    },
    tick(dt, Y) {
      if (!G || !OUT || OUT.broken || !on() || !OUT.door) return;
      const st = LIFE.S(); if (st.hallTold || !G.state.flags.rosa) return;
      if (Math.hypot(OUT.door.x - Y.x, OUT.door.z - Y.z) < 12) { st.hallTold = true; STORY.think(`A flag with a rising sun, and a plaque: «${plT('sign', '')}». The town hall, with the post office inside!`, 5); LIFE.save(); }
    },
  };

  // ------------------------------------------------------------ the mini-map's mark: an envelope on a teal disc
  const MARK = {};
  function mapMark(dpr) {
    if (!G || !OUT || OUT.broken || !OUT.door || !on() || (G.indoors && G.indoors())) return null;
    const key = String(dpr);
    if (!MARK[key]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = TEAL; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.arc(9, 9, 8, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = CREAM; c.fillRect(4.2, 5.8, 9.6, 6.6); c.strokeStyle = INK; c.lineWidth = 1; c.strokeRect(4.2, 5.8, 9.6, 6.6); c.beginPath(); c.moveTo(4.2, 5.8); c.lineTo(9, 9.6); c.lineTo(13.8, 5.8); c.stroke();
      MARK[key] = cv;
    }
    return { x: OUT.door.x, z: OUT.door.z, img: MARK[key] };
  }
  // camera shots for scenes (room-local): 'hall' (the council hall from the lobby), 'debate' (you at the mic, the mayor beyond), 'counter', 'desk'
  function shot(name) {
    const S = { hall: { pos: [0.4, 4.2, 4.6], look: [0, 1.4, -4.2] }, debate: { pos: [2.6, 2.4, 0.4], look: [-0.6, 1.4, -4.6] }, counter: { pos: [-1.6, 2.2, 5.4], look: [-6.4, 1.3, 2.4] },
      desk: { pos: [3.4, 2.3, 5.6], look: [7.6, 1.0, 3.2] }, room: { pos: [0.6, 6.0, 11.0], look: [0, 1.2, -1.5] }, vote: { pos: [0, 3.6, -5.2], look: [0, 0.9, 0.2] } }[name];
    if (!S || !G) return;
    G.cam.override = { pos: new THREE.Vector3(X0 + S.pos[0], Y0 + S.pos[1], Z0 + S.pos[2]), look: new THREE.Vector3(X0 + S.look[0], Y0 + S.look[1], Z0 + S.look[2]), dur: 0.5 };
  }
  const TESTS = (() => {
    const g = () => window.__g;
    const tickMs = ms => new Promise(r => setTimeout(r, ms));
    async function waitFor(fn, sec = 6) { for (let i = 0; i < sec * 10 && !fn(); i++) { await g().go(0.05); await tickMs(30); } return !!fn(); }
    async function enterNow(o = {}) { STORY.run(() => enter(Object.assign({ quiet: true }, o))); await waitFor(() => inside && !busy, 8); return inside; }
    async function leaveNow() { STORY.run(() => leave()); await waitFor(() => !inside && !busy, 8); return !inside; }
    function frame(name) {
      if (name === 'door') { const d = OUT.door, h = house(); const o = h.world(h.dlx + 3.4, h.front + 7.8); G.cam.override = { pos: new THREE.Vector3(o.x, 3.6, o.z), look: new THREE.Vector3(d.x - 0.6, 2.0, d.z - 0.8), dur: 0.01 }; return; }
      shot(name); if (G.cam.override) G.cam.override.dur = 0.01;
    }
    return { waitFor, enterNow, leaveNow, frame };
  })();

  // ------------------------------------------------------------ the game side
  function init(game) {
    G = game;
    if (typeof INTERIORS !== 'undefined' && INTERIORS.claim) INTERIORS.claim(id => id === DOOR_ID && on() && !visit);
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
  }
  return {
    init, tick,
    get inside() { return inside; },
    get OUTSIDE() { return inside ? outsideSpot() : null; },
    interactables() { return inside ? roomItems() : []; },
    update(dt, t) { roomUpdate(dt, t); },
    curiosities() { return []; },
    target() { if (!inside) return null; return { x: X0 + SPOT.counter.x, z: Z0 + SPOT.counter.z, hint: `{mimo} points at the post counter.` }; },
    get busy() { return busy; },
    enter, leave, mapMark, shot, person, clearExtras, sayBy, clerkSay, mayorSay, clerkName, mayorName, boardLines, refresh() { refreshBoard(); refreshRoomBoard(); },
    get clerk() { return PC; }, get mayor() { return PM; },
    door: () => (inside ? { x: X0 + SPOT.exit.x, z: Z0 + SPOT.exit.z } : OUT && !OUT.broken && OUT.door ? { x: OUT.door.x, z: OUT.door.z } : outsideSpot()),
    at: k => (SPOT[k] ? { x: X0 + SPOT[k].x, z: Z0 + SPOT[k].z } : null),
    spot: k => SPOT[k], SEATS, DOOR_ID, ROOM_AT: { x: X0, y: Y0, z: Z0 }, SPOT,
    _: { house, outsideSpot, buildRoom, upToLeandro, get visit() { return visit; }, get OUT() { return OUT; }, get ROOM() { return ROOM; }, t: TESTS },
  };
})();
