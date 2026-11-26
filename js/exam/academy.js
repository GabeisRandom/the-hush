'use strict';
// ACADEMY: the Academy of Alba (DESIGN.md 21.2, EX1), where the level exams are taken (exam.js, exam_ui.js), in every language that
// has a dictionary pack and exam content (EXAM.ready()).
// THE DOOR: 'alba-house-08', the two-floor half-timbered house at the west end of the west street, on the road out to Remanso
// (its door faces the street, south). Claimed through INTERIORS.claim only while the Academy is on; otherwise it's an ordinary
// house. Outside: a crest sign at its corner, two banners, a board by the door.
// THE ROOM: the exam hall floats at (−95, 300, 38), 16 × 12 (SIDES.md): the examiner's desk under a big chalkboard and the
// crest, eight desks with an aisle, the wall of certificates (yours hang there once you pass), a bench by the door where Mimo
// waits during an exam (no help in an exam), windows, a clock.
// THE EXAMINER: one per language (the content's `examiner`: a name, a portrait look, a rig look, a voice).
//   ACADEMY.init(game) · as a room (main.js ROOMS): .inside · .OUTSIDE · .interactables() · .update(dt, t) · .target() · .enter()
//   · .leave() · .curiosities() · outdoors (EXAM.update): .outdoor(dt, t, you) · .mapMark(dpr) · .door() · .desk() · ._ (tests)

const ACADEMY = (() => {
  const DOOR_ID = 'alba-house-08', HOUSE_N = 8;
  const X0 = -95, Y0 = 300, Z0 = 38;                    // (≥ 26 from every other room: the library at (−130, 60) is the nearest, 45 away)
  const HW = 8, HD = 6, WH = 4.6, HALF = Math.PI / 2;
  const INK = '#2b2235', ACAD = '#7a2a3d', GOLD = '#d9a72c';
  let G = null;
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const on = () => typeof EXAM !== 'undefined' && EXAM.ready();
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK(L());
  const P = s => (isC() ? CJK.plain(String(s || ''), { lang: L() }) : String(s || ''));
  const B = ['A0', 'A1', 'A2', 'B1', 'B2'];
  const C = () => (on() ? EXAM.content() : null) || {};
  const ac = k => { const a = C().academy || {}; return a[k]; };
  const exr = () => C().examiner || {};
  const exName = () => P(exr().name || 'the examiner');
  const S = () => EXAM.state;
  const snd = k => { try { Sound.play(k); } catch (e) { /* */ } };

  // ------------------------------------------------------------ outside: house 8 dressed as the Academy
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
  function crestCanvas(px) { const cv = document.createElement('canvas'); cv.width = cv.height = px; try { EXAMUI.crest(cv); } catch (e) { /* */ } return cv; }
  function plaqueDraw(c) {
    c.clearRect(0, 0, 512, 256);
    SIGNS.paint(c, 512, 256, { text: P(ac('sign') || 'ACADEMIA'), edge: ACAD, face: '#fbf3dc', ink: INK, size: 0.46 });
    try { c.drawImage(crestCanvas(160), 22, 52, 150, 150); } catch (e) { /* */ }
  }
  function bannerDraw(c) {
    c.fillStyle = ACAD; c.fillRect(0, 0, 256, 512); c.fillStyle = GOLD; c.fillRect(14, 0, 8, 512); c.fillRect(234, 0, 8, 512);
    c.beginPath(); c.moveTo(0, 512); c.lineTo(128, 462); c.lineTo(256, 512); c.closePath(); c.fillStyle = '#000'; c.globalCompositeOperation = 'destination-out'; c.fill(); c.globalCompositeOperation = 'source-over';
    try { c.drawImage(crestCanvas(200), 38, 60, 180, 180); } catch (e) { /* */ }
    c.fillStyle = '#fbf3dc'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const t = P(ac('banner') || ac('sign') || 'ACADEMIA'); let px = 46; c.font = `900 ${px}px Bahnschrift, "Segoe UI", sans-serif`; while (px > 16 && c.measureText(t).width > 210) { px--; c.font = `900 ${px}px Bahnschrift, "Segoe UI", sans-serif`; } c.fillText(t, 128, 300);
    c.font = '800 54px Bahnschrift, "Segoe UI", sans-serif'; c.fillStyle = GOLD; c.fillText('A1 · A2', 128, 370); c.fillText('B1 · B2', 128, 428);
  }
  function boardDraw(c, l) {
    c.fillStyle = '#6b4a2e'; c.fillRect(0, 0, 512, 640); c.fillStyle = '#23302a'; c.fillRect(18, 18, 476, 604);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    try { c.drawImage(crestCanvas(150), 186, 34, 140, 140); } catch (e) { /* */ }
    const lines = ((C().academy || {}).board || []).map(x => P(Array.isArray(x) ? x[0] : x));
    const wrap = (text, y, px, maxW, col) => { const ws = String(text).split(/\s+/), out = []; let cur = ''; c.font = `800 ${px}px Bahnschrift, "Segoe UI", sans-serif`; for (const w of ws) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); c.fillStyle = col; out.forEach((ln, i) => c.fillText(ln, 256, y + i * px * 1.15)); return out.length * px * 1.15; };
    let y = 215; lines.forEach((t, i) => { y += wrap(t, y, i ? 34 : 46, 430, i ? '#f2c94c' : '#f4efe4') + 14; });
  }
  function buildOutside() {
    const h = house(); if (!h || !G || typeof ZHF === 'undefined') return null;
    const g = new THREE.Group(); g.name = 'academy-outside'; g.position.set(h.b.x, h.GY, h.b.z); g.rotation.y = h.yaw; G.w3d.scene.add(g);
    const F = h.front, dx = h.dlx, k = ZHF.Kit();
    // the crest sign: two-sided, on an iron bracket at the corner nearest the door
    const pcv = document.createElement('canvas'); pcv.width = 512; pcv.height = 256;
    const ptex = new THREE.CanvasTexture(pcv); ptex.anisotropy = 4;
    const drawPlaque = () => { plaqueDraw(pcv.getContext('2d')); ptex.needsUpdate = true; };
    if (SIGNS.board) SIGNS.board(drawPlaque); else drawPlaque();
    const sxw = dx > 0 ? h.b.w / 2 - 0.2 : -h.b.w / 2 + 0.2, sy = 2.45, sz = F + 0.86;
    k.box(sxw, sy + 0.5, F + 0.66, 0.05, 0.05, 1.32, INK, { ink: 0 }).box(sxw, sy + 0.24, F + 0.05, 0.06, 0.6, 0.06, INK, { ink: 0 });
    k.rod([sxw, sy + 0.2, F + 0.05], [sxw, sy + 0.5, F + 0.5], 0.018, INK, { ink: 0 });
    for (const s of [-1, 1]) k.rod([sxw, sy + 0.5, sz + s * 0.55], [sxw, sy + 0.38, sz + s * 0.55], 0.012, INK, { ink: 0 });
    k.box(sxw, sy, sz, 0.08, 0.76, 1.44, ACAD);
    for (const s of [-1, 1]) { const m = ZHF.plane(1.36, 0.68, ptex); m.position.set(sxw + s * 0.045, sy, sz); m.rotation.y = s * HALF; g.add(m); }
    // two banners on the upper floor, in the gaps between its windows (town.js: the front's slots are w / slots wide)
    const bcv = document.createElement('canvas'); bcv.width = 256; bcv.height = 512;
    const btex = new THREE.CanvasTexture(bcv); btex.anisotropy = 4;
    const drawBanner = () => { bannerDraw(bcv.getContext('2d')); btex.needsUpdate = true; };
    if (SIGNS.board) SIGNS.board(drawBanner); else drawBanner();
    const slots = Math.max(2, Math.min(4, Math.floor((h.b.w - 0.6) / 1.6))), gap = i => -h.b.w / 2 + (h.b.w / slots) * (i + 1);
    const bx = slots >= 3 ? [gap(0), gap(1)] : [gap(0)], by = (h.b.floors || 1) > 1 ? 3.95 : 2.0;
    for (const x of bx) {
      const m = ZHF.plane(0.6, 1.2, btex, { alpha: true }); m.position.set(x, by, F + 0.12); g.add(m);
      k.rod([x - 0.36, by + 0.62, F + 0.13], [x + 0.36, by + 0.62, F + 0.13], 0.022, '#c9a24a', { ink: 0.006 });
      k.ball(x - 0.38, by + 0.62, F + 0.13, 0.035, 0.035, 0.035, '#c9a24a', { ink: 0.004 }).ball(x + 0.38, by + 0.62, F + 0.13, 0.035, 0.035, 0.035, '#c9a24a', { ink: 0.004 });
    }
    // the board by the door: the exams, the levels, the hours (both faces)
    const mx = dx + 1.5 > h.b.w / 2 - 0.3 ? dx - 1.5 : dx + 1.5, mz = F + 0.85;
    const ccv = document.createElement('canvas'); ccv.width = 512; ccv.height = 640;
    const ctex = new THREE.CanvasTexture(ccv); ctex.anisotropy = 4;
    const drawBoard = l => { boardDraw(ccv.getContext('2d'), l); ctex.needsUpdate = true; };
    if (SIGNS.board) SIGNS.board(drawBoard); else drawBoard(L());
    for (const s of [-1, 1]) {
      const m = ZHF.plane(0.66, 0.84, ctex); m.position.set(mx, 0.6, mz + s * 0.235); m.rotation.set(s * -0.32, s < 0 ? Math.PI : 0, 0); g.add(m);
      k.box(mx, 0.6, mz + s * 0.19, 0.72, 0.92, 0.03, '#6b4a2e', { rx: s * -0.32, ink: 0.01 });
    }
    k.box(mx, 1.06, mz, 0.76, 0.04, 0.12, '#5a3a22');
    // two bay trees in pots, either side of the door
    for (const s of [-1, 1]) { const x = dx + s * 0.85; if (Math.abs(x) > h.b.w / 2 - 0.2 || Math.abs(x - mx) < 0.6) continue; k.cyl(x, 0.22, F + 0.32, 0.2, 0.44, '#8a5a3a').cyl(x, 0.75, F + 0.32, 0.04, 0.6, '#6b4a2e').ball(x, 1.15, F + 0.32, 0.3, 0.32, 0.3, '#3f7a4a', { ink: 0.008 }); }
    const baked = ZHF.bake(g, k);
    const W = (lx, lz) => h.world(lx, lz);
    return { g, baked, h, menuSolid: W(mx, mz), boardAt: W(mx, mz + 0.9), signAt: W(sxw, F + 1.25), door: W(dx, F + 0.8), doorIn: W(dx, F + 0.35) };
  }
  const SOLID = { x: 1e5, z: 1e5, r: 0.42, academy: true };
  function outdoor() {
    if (!G || typeof TOWN === 'undefined') return;
    const live = on();
    if (!OUT && !live) return;
    if (!OUT) { try { OUT = buildOutside() || { broken: true }; } catch (e) { console.error('[academy]', e); OUT = { broken: true }; } }
    if (OUT.broken) return;
    const town = G.town && G.town.group;
    const vis = live && !(G.indoors && G.indoors()) && (!town || town.visible);
    OUT.g.visible = vis;
    if (!WORLD.extra.includes(SOLID)) WORLD.extra.push(SOLID);
    if (vis) { SOLID.x = OUT.menuSolid.x; SOLID.z = OUT.menuSolid.z; } else { SOLID.x = SOLID.z = 1e5; }
    if (!OUT.signed && typeof SIGNS !== 'undefined' && SIGNS.add) {
      OUT.signed = true;
      SIGNS.add({ id: 'academy-sign', x: OUT.signAt.x, z: OUT.signAt.z, r: 1.3, when: () => !inside && on(), card: () => ({ tag: 'The sign at the corner', lines: [{ text: ac('name') || 'ACADEMIA', en: 'The Academy of Alba', look: { face: '#fbf3dc', edge: ACAD, ink: INK } }] }) });
      SIGNS.add({ id: 'academy-board', x: OUT.boardAt.x, z: OUT.boardAt.z, r: 1.3, when: () => !inside && on(), card: () => boardCard() });
    }
  }
  function boardCard() {
    const look = { face: '#23302a', edge: '#6b4a2e', ink: '#f4efe4' };
    return { tag: 'The board by the Academy’s door', lines: ((C().academy || {}).board || []).map(x => ({ text: Array.isArray(x) ? x[0] : x, en: Array.isArray(x) ? x[1] : '', look })) };
  }
  // ------------------------------------------------------------ the exam hall (built on the first visit)
  let ROOM = null;
  const SPOT = { spawn: { x: 0, z: HD - 1.3 }, exit: { x: 0, z: HD - 0.5 }, desk: { x: 0, z: -3.0 }, ex: { x: 0, z: -4.15 }, talk: { x: 0, z: -1.7 },
    bench: { x: -6.3, z: 4.7 }, wall: { x: HW - 1.1, z: 0 }, board: { x: -2.6, z: -3.7 }, notice: { x: 3.4, z: HD - 1.2 } };
  const DESKS = []; for (const z of [-0.6, 1.9]) for (const x of [-5.2, -2.6, 2.6, 5.2]) DESKS.push({ x, z });
  const FRAMES = [1, 2, 3, 4].map((b, i) => ({ band: b, z: -3.3 + i * 2.2 }));
  const tex = (w, h, draw) => ZHF.canvasTex(w, h, draw);
  function floorTex() {
    return tex(512, 512, c => {
      for (let j = 0; j < 16; j++) for (let i = 0; i < 8; i++) { const x = i * 64, y = j * 32; c.fillStyle = ['#9a6a42', '#a8784e', '#8f6240', '#b08050'][(i * 3 + j) % 4]; if ((i + j) % 2) c.fillRect(x, y, 64, 32); else c.fillRect(x, y, 64, 32); c.strokeStyle = 'rgba(60,35,20,.4)'; c.lineWidth = 2; c.strokeRect(x, y, 64, 32); }
    });
  }
  function wallTex() {
    return tex(512, 512, c => {
      c.fillStyle = '#f3e8cf'; c.fillRect(0, 0, 512, 512);
      c.strokeStyle = 'rgba(122,42,61,.10)'; c.lineWidth = 3; for (let x = 0; x < 512; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 372); c.stroke(); }
      c.fillStyle = ACAD; c.fillRect(0, 380, 512, 132); c.fillStyle = GOLD; c.fillRect(0, 372, 512, 9);
      c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 3; for (let x = 0; x < 512; x += 128) c.strokeRect(x + 12, 396, 104, 100);
    });
  }
  function chalkTex() {
    return tex(1024, 512, c => {
      c.fillStyle = '#5a3a22'; c.fillRect(0, 0, 1024, 512); c.fillStyle = '#2a3b33'; c.fillRect(22, 22, 980, 468);
      c.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 40; i++) c.fillRect((i * 173) % 980 + 22, (i * 97) % 468 + 22, 60, 6);
      c.fillStyle = '#f4efe4'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const t = P(ac('chalk') || ac('levelTl') || 'Examen de nivel'); let px = 92; c.font = `700 ${px}px "Segoe Print", "Ink Free", cursive`; while (px > 30 && c.measureText(t).width > 900) { px -= 2; c.font = `700 ${px}px "Segoe Print", "Ink Free", cursive`; } c.fillText(t, 512, 150);
      c.font = '800 96px Bahnschrift, "Segoe UI", sans-serif'; c.fillStyle = '#f2c94c'; c.fillText('A1  ·  A2  ·  B1  ·  B2', 512, 300);
      const r = P(ac('chalk2') || ''); if (r) { let p2 = 46; c.font = `700 ${p2}px "Segoe Print", "Ink Free", cursive`; while (p2 > 20 && c.measureText(r).width > 900) { p2 -= 2; c.font = `700 ${p2}px "Segoe Print", "Ink Free", cursive`; } c.fillStyle = '#f4efe4'; c.fillText(r, 512, 420); }
    });
  }
  function frameTex(band) {
    return tex(256, 320, c => {
      const cf = S().certs[band];
      c.fillStyle = cf ? '#fffaf0' : '#e8dcc4'; c.fillRect(0, 0, 256, 320);
      c.strokeStyle = cf ? ACAD : 'rgba(43,34,53,.35)'; c.lineWidth = 10; c.strokeRect(14, 14, 228, 292); c.strokeStyle = cf ? GOLD : 'rgba(43,34,53,.2)'; c.lineWidth = 3; c.strokeRect(28, 28, 200, 264);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      if (cf) { try { c.drawImage(crestCanvas(96), 88, 40, 80, 80); } catch (e) { /* */ } }
      c.fillStyle = cf ? ACAD : 'rgba(43,34,53,.4)'; c.font = '900 78px Bahnschrift, sans-serif'; c.fillText(B[band], 128, cf ? 168 : 150);
      c.font = '700 22px Georgia, serif'; c.fillStyle = cf ? INK : 'rgba(43,34,53,.45)';
      if (cf) { c.fillText(`${Math.round(cf.total)} / 100`, 128, 222); c.font = 'italic 18px Georgia, serif'; const tt = cf.title || ''; c.fillText(tt.length > 20 ? tt.slice(0, 19) + '…' : tt, 128, 258); }
      else c.fillText('—', 128, 220);
    });
  }
  function windowTex() {
    return tex(256, 320, c => {
      const g = c.createLinearGradient(0, 0, 0, 320); g.addColorStop(0, '#9fd4ef'); g.addColorStop(1, '#e6f4ea'); c.fillStyle = g; c.fillRect(0, 0, 256, 320);
      c.fillStyle = '#7fb069'; c.beginPath(); c.ellipse(60, 300, 120, 60, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#f4efe4'; c.lineWidth = 14; c.strokeRect(7, 7, 242, 306); c.beginPath(); c.moveTo(128, 0); c.lineTo(128, 320); c.moveTo(0, 160); c.lineTo(256, 160); c.stroke();
    });
  }
  const glowSprite = (col, s) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: col, transparent: true, opacity: 0.42, depthWrite: false })); m.scale.setScalar(s); return m; };
  function buildRoom() {
    const g = new THREE.Group(); g.name = 'academy-room'; g.position.set(X0, Y0, Z0); g.visible = false; G.w3d.scene.add(g);
    const k = ZHF.Kit(), solids = [], glows = [];
    const ft = floorTex(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(HW / 2, HD / 2);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, 0.3, 2 * HD), new THREE.MeshToonMaterial({ map: ft, gradientMap: TK.grad })); floor.position.y = -0.15; floor.receiveShadow = true; g.add(floor);
    const wt = wallTex(); wt.wrapS = THREE.RepeatWrapping;
    for (const [w, x, z, ry] of [[2 * HW, 0, -HD, 0], [2 * HW, 0, HD, Math.PI], [2 * HD, -HW, 0, HALF], [2 * HD, HW, 0, -HALF]]) {
      const t = wt.clone(); t.needsUpdate = true; t.repeat.set(w / 5, 1);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), new THREE.MeshToonMaterial({ map: t, gradientMap: TK.grad })); m.position.set(x, WH / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    }
    solids.push({ obox: 1, x: 0, z: -HD - 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: 0, z: HD + 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: -HW - 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 }, { obox: 1, x: HW + 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 });
    for (const [x, z] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD]]) k.box(x + (x < 0 ? 0.1 : -0.1), WH / 2, z + (z < 0 ? 0.1 : -0.1), 0.22, WH, 0.22, '#4a3222');
    // the chalkboard and the crest over it
    const cb = ZHF.plane(6.2, 2.2, chalkTex()); cb.position.set(0, 2.35, -HD + 0.06); g.add(cb); ROOM_CHALK = cb;
    k.box(0, 1.22, -HD + 0.14, 6.3, 0.07, 0.2, '#5a3a22');
    const cr = ZHF.plane(1.1, 1.1, (() => { const t = new THREE.CanvasTexture(crestCanvas(256)); t.anisotropy = 4; return t; })(), { alpha: true }); cr.position.set(0, 4.0, -HD + 0.06); g.add(cr);
    // the examiner's desk: a green lamp, a brass bell, papers, a vase of flowers
    const D = SPOT.desk;
    k.box(D.x, 0.45, D.z, 3.2, 0.9, 1.1, '#5a3a22').box(D.x, 0.93, D.z, 3.36, 0.07, 1.22, '#7a5236').box(D.x, 0.45, D.z + 0.56, 3.0, 0.72, 0.02, ACAD, { ink: 0.006 });
    k.cyl(D.x - 1.15, 0.99, D.z - 0.15, 0.13, 0.05, '#c9a24a').cyl(D.x - 1.15, 1.17, D.z - 0.15, 0.025, 0.36, '#c9a24a', { ink: 0.004 });
    k.add(ZHF.GEO.half, '#2f7a4a', D.x - 1.15, 1.36, D.z - 0.05, 0.26, 0.12, 0.15, Math.PI, 0, 0); glows.push({ x: D.x - 1.15, y: 1.17, z: D.z + 0.1, c: '#ffe7a0', s: 1.3 });
    k.add(ZHF.GEO.half, '#c9a24a', D.x + 1.1, 0.97, D.z + 0.25, 0.1, 0.09, 0.1).ball(D.x + 1.1, 1.07, D.z + 0.25, 0.022, 0.022, 0.022, '#c9a24a', { ink: 0 });
    for (let i = 0; i < 4; i++) k.box(D.x + 0.2 + i * 0.02, 0.975 + i * 0.012, D.z + 0.05, 0.42, 0.01, 0.56, '#fffaf0', { ink: 0.004, ry: i * 0.05 });
    k.cyl(D.x + 0.75, 1.07, D.z - 0.3, 0.07, 0.22, '#3f6fb5'); for (const [a, col] of [[0, '#e8457a'], [2.1, '#f2c14e'], [4.2, '#fffaf0']]) k.ball(D.x + 0.75 + Math.cos(a) * 0.06, 1.24, D.z - 0.3 + Math.sin(a) * 0.06, 0.055, 0.05, 0.055, col, { ink: 0.005 });
    solids.push({ obox: 1, x: D.x, z: D.z, hw: 1.7, hd: 0.62, rot: 0 }, { x: SPOT.ex.x, z: SPOT.ex.z, r: 0.45 });
    // eight desks, each with a chair and a sheet of paper
    for (const d of DESKS) {
      k.box(d.x, 0.74, d.z, 1.3, 0.06, 0.72, '#8a5f3e'); for (const [a, b] of [[-0.58, -0.3], [0.58, -0.3], [-0.58, 0.3], [0.58, 0.3]]) k.box(d.x + a, 0.36, d.z + b, 0.07, 0.72, 0.07, '#5a3a22', { ink: 0.004 });
      k.box(d.x, 0.775, d.z, 0.36, 0.01, 0.48, '#fffaf0', { ink: 0.003, ry: 0.08 }).box(d.x + 0.3, 0.79, d.z + 0.05, 0.03, 0.03, 0.22, '#e6a92e', { ink: 0.003, ry: 0.3 });
      const cz = d.z + 0.62; k.box(d.x, 0.44, cz, 0.5, 0.06, 0.48, '#7a5236').box(d.x, 0.74, cz + 0.22, 0.5, 0.56, 0.05, '#7a5236');
      for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) k.box(d.x + a, 0.21, cz + b, 0.05, 0.42, 0.05, '#5a3a22', { ink: 0.004 });
      solids.push({ obox: 1, x: d.x, z: d.z, hw: 0.68, hd: 0.4, rot: 0 }, { x: d.x, z: cz, r: 0.3 });
    }
    // the wall of certificates (east): four frames, A1–B2, yours filled in as you pass
    ROOM_FRAMES = FRAMES.map(F => { const m = ZHF.plane(0.86, 1.08, frameTex(F.band)); m.position.set(HW - 0.05, 2.3, F.z); m.rotation.y = -HALF; g.add(m); k.box(HW - 0.08, 2.3, F.z, 0.06, 1.18, 0.96, '#6b4a2e', { ink: 0.008 }); return m; });
    // the bench by the door, where Mimo waits; a coat stand; a bookshelf (west); windows; a clock; two hanging lamps
    const BN = SPOT.bench;
    k.box(BN.x, 0.42, BN.z, 2.0, 0.08, 0.55, '#8a5f3e').box(BN.x, 0.74, BN.z + 0.25, 2.0, 0.5, 0.06, '#8a5f3e');
    for (const a of [-0.9, 0.9]) k.box(BN.x + a, 0.2, BN.z, 0.08, 0.4, 0.5, '#5a3a22', { ink: 0.004 });
    solids.push({ obox: 1, x: BN.x, z: BN.z, hw: 1.05, hd: 0.33, rot: 0 });
    k.cyl(6.4, 0.03, 4.9, 0.22, 0.06, '#3a2a22').cyl(6.4, 0.95, 4.9, 0.035, 1.9, '#5a3a22').ball(6.4, 1.9, 4.9, 0.08, 0.08, 0.08, '#5a3a22').box(6.4, 1.62, 4.9, 0.46, 0.5, 0.12, '#3f6fb5', { ry: 0.4 });
    solids.push({ x: 6.4, z: 4.9, r: 0.3 });
    // the notice board (south wall, east of the door): the practice papers in the real exams' formats, a sheet pinned up for each
    const NB = SPOT.notice; ROOM_NOTICE = ZHF.plane(1.6, 1.15, noticeTex()); ROOM_NOTICE.position.set(NB.x, 1.75, HD - 0.07); ROOM_NOTICE.rotation.y = Math.PI; g.add(ROOM_NOTICE);
    k.box(NB.x, 1.75, HD - 0.04, 1.72, 1.27, 0.05, '#6b4a2e', { ink: 0.008 });
    k.box(-HW + 0.35, 1.3, -1.6, 0.6, 2.6, 2.2, '#6b4a2e'); for (let s = 0; s < 4; s++) { k.box(-HW + 0.42, 0.25 + s * 0.62, -1.6, 0.5, 0.05, 2.0, '#7a5236', { ink: 0.004 }); for (let i = 0; i < 11; i++) k.box(-HW + 0.45, 0.48 + s * 0.62, -2.5 + i * 0.17, 0.36, 0.36 + (i % 3) * 0.04, 0.12, ['#a8322c', '#2f5a4a', '#3f6fb5', '#e6a92e', '#6b3a5a'][(i + s) % 5], { ink: 0.004 }); }
    solids.push({ obox: 1, x: -HW + 0.35, z: -1.6, hw: 0.35, hd: 1.15, rot: 0 });
    for (const [z] of [[1.8], [-4.4]]) { const w = ZHF.plane(1.3, 1.6, windowTex()); w.position.set(-HW + 0.03, 2.4, z); w.rotation.y = HALF; g.add(w); }
    const clk = ZHF.plane(0.6, 0.6, tex(128, 128, c => { c.fillStyle = '#fbf6e7'; c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.fill(); c.lineWidth = 6; c.strokeStyle = '#5a3a22'; c.stroke(); c.fillStyle = INK; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.fillRect(64 + Math.cos(a) * 46 - 3, 64 + Math.sin(a) * 46 - 3, 6, 6); } }), { alpha: true });
    clk.position.set(-HW + 0.04, 3.7, 1.8); clk.rotation.y = HALF; g.add(clk);
    for (const [x, z] of [[-2.6, 0.6], [2.6, 0.6]]) { k.cyl(x, WH - 0.45, z, 0.008, 0.9, INK, { ink: 0, geo: ZHF.GEO.cyl8 }).add(ZHF.GEO.cone, ACAD, x, WH - 0.95, z, 0.34, 0.26, 0.34); glows.push({ x, y: WH - 1.15, z, c: '#ffe7a0', s: 2.4 }); }
    k.box(0, 0.016, HD - 0.62, 1.8, 0.02, 0.9, ACAD, { ink: 0 });
    const baked = ZHF.bake(g, k);
    const sprites = glows.map(q => { const s = glowSprite(q.c, q.s); s.position.set(q.x, q.y, q.z); g.add(s); return s; });
    WORLD.addSolids(solids.map(s => Object.assign({}, s, { x: X0 + s.x, z: Z0 + s.z, academy: true })));
    WORLD.addPlatforms([{ box: [X0 - HW, X0 + HW, Z0 - HD, Z0 + HD], top: Y0, academy: true }]);
    ROOM = { g, baked, sprites, framesKey: '' };
    ROOM.ex = makeExaminer(g);
    return ROOM;
  }
  let ROOM_CHALK = null, ROOM_FRAMES = [], ROOM_NOTICE = null;
  function refreshFrames() {
    if (!ROOM) return;
    const key = JSON.stringify(Object.keys(S().certs).map(b => [b, S().certs[b].total])) + L() + JSON.stringify(Object.keys(S().mocks || {}));
    if (ROOM.framesKey === key) return;
    ROOM.framesKey = key;
    ROOM_FRAMES.forEach((m, i) => { const old = m.material.map; m.material.map = frameTex(FRAMES[i].band); m.material.needsUpdate = true; if (old) old.dispose(); });
    if (ROOM_CHALK) { const old = ROOM_CHALK.material.map; ROOM_CHALK.material.map = chalkTex(); ROOM_CHALK.material.needsUpdate = true; if (old) old.dispose(); }
    if (ROOM_NOTICE) { const old = ROOM_NOTICE.material.map; ROOM_NOTICE.material.map = noticeTex(); ROOM_NOTICE.material.needsUpdate = true; if (old) old.dispose(); }
  }
  // the notice board's face: cork, and a sheet pinned up per practice paper in this language (a gold star once you've passed it)
  function noticeTex() {
    return tex(512, 368, c => {
      c.fillStyle = '#c99a64'; c.fillRect(0, 0, 512, 368);
      for (let i = 0; i < 420; i++) { c.fillStyle = i % 3 ? 'rgba(120,80,40,.25)' : 'rgba(255,235,200,.25)'; c.fillRect((i * 97) % 512, (i * 61) % 368, 3, 3); }
      c.textAlign = 'center'; c.textBaseline = 'middle';
      const rows = typeof MOCK !== 'undefined' ? MOCK.rows(L()) : [];
      const sheet = (x, y, w, h, rot, col) => { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-w / 2 + 4, -h / 2 + 5, w, h); c.fillStyle = col; c.fillRect(-w / 2, -h / 2, w, h); c.strokeStyle = 'rgba(43,34,53,.35)'; c.lineWidth = 2; c.strokeRect(-w / 2, -h / 2, w, h); };
      const pin = (x, y) => { c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.fillStyle = ACAD; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); };
      // the header: the crest and the formats' names
      sheet(256, 52, 300, 70, -0.01, '#fffaf0'); c.font = '900 28px Bahnschrift, "Segoe UI", sans-serif'; c.fillStyle = ACAD;
      c.fillText(rows.length ? [...new Set(rows.map(r => r.F.name))].join(' · ') : '· · ·', 0, 2); c.restore(); pin(256, 22);
      // (one row of big sheets for up to four papers, two rows of smaller ones beyond that)
      const list = rows.slice(0, 8), one = list.length <= 4, k = one ? 1.15 : 1;
      list.forEach((r, i) => {
        const per = one ? list.length : 4, col = i % 4, row = one ? 0 : Math.floor(i / 4), x = 256 + (col - (per - 1) / 2) * (one ? 124 : 120), y = one ? 222 : 160 + row * 120, rot = ((i * 37) % 7 - 3) * 0.02;
        sheet(x, y, 100 * k, 100 * k, rot, '#fffdf6'); c.fillStyle = INK; c.font = `800 ${Math.round(17 * k)}px Bahnschrift, "Segoe UI", sans-serif`; c.fillText(P(r.F.name).slice(0, 11), 0, -26 * k);
        c.font = `900 ${Math.round(30 * k)}px Bahnschrift, "Segoe UI", sans-serif`; c.fillStyle = ACAD; c.fillText(String(r.level), 0, 6 * k);
        c.strokeStyle = 'rgba(43,34,53,.3)'; c.lineWidth = 2; for (const ly of [30, 40]) { c.beginPath(); c.moveTo(-34 * k, ly * k); c.lineTo(34 * k, ly * k); c.stroke(); }
        if (r.best && r.best.passed) { c.fillStyle = GOLD; c.beginPath(); for (let q = 0; q < 10; q++) { const a = -Math.PI / 2 + q * Math.PI / 5, rr = (q % 2 ? 7 : 16) * k; c.lineTo(30 * k + Math.cos(a) * rr, -30 * k + Math.sin(a) * rr); } c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); }
        c.restore(); pin(x, y - 44 * k);
      });
    });
  }

  // ------------------------------------------------------------ the examiner (a look per language, from the content)
  let P0 = null, P0lang = '';
  function makeExaminer(parent) {
    const look = Object.assign({ skin: '#d9a47a', hair: '#cfcac2', brow: '#cfcac2', shirt: ACAD, sleeve: ACAD, pants: '#3a3346', shoes: '#3a2b26', collar: '#f4efe4', glasses: true }, exr().rig || {});
    P0 = ZHF.person(look); P0lang = L();
    P0.x = SPOT.ex.x; P0.z = SPOT.ex.z; P0.y = 0; P0.yaw = P0.baseYaw = 0; P0.pose = 'idle';
    parent.add(P0.root);
    return P0;
  }
  function examinerForLang() {
    if (!ROOM || P0lang === L()) return;
    try { if (P0 && P0.root.parent) P0.root.parent.remove(P0.root); } catch (e) { /* */ }
    ROOM.ex = makeExaminer(ROOM.g);
  }
  const XP = { id: 'examiner', get name() { return exName(); }, get x() { return X0 + (P0 ? P0.x : SPOT.ex.x); }, get z() { return Z0 + (P0 ? P0.z : SPOT.ex.z); }, y: Y0, top: 1.95, lines: null,
    get talking() { return !!(P0 && P0.talking); }, set talking(v) { if (P0) P0.talking = !!v; } };
  // a line of the examiner's in the world (STORY.sayInline: a bubble over the head, the weave mixing it like everyone's)
  async function sayX(ln) {
    if (!ln || !ln.t) return;
    XP.lines = { [L()]: ln.t, en: ln.en || '' };
    try { const said = STORY.sayInline(XP, true); mixInto(STORY.line, ln.t, ln.en); await said; } catch (e) { console.error('[academy] say', e); }
  }
  function mixInto(ln, text, en) {
    if (!ln || ln.at !== XP || typeof MIX === 'undefined' || !MIX.ok() || !text || !en) return;
    try { const m = MIX.line(text, en, { key: 'academy:' + en, count: true }); if (m.full) return; ln.parts = m.parts; delete ln.text; ln.len = UI.partsLen(m.parts); ln.en = en; ln.under = false; } catch (e) { /* (the line stays whole) */ }
  }
  const says = (key, n) => (typeof EXAM !== 'undefined' ? EXAM._.says(key, n) : null);

  // ------------------------------------------------------------ in and out (a room: main.js ROOMS, story.js interactables)
  let inside = false, busy = false;
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
    M.x = x + Math.cos(yaw) * 0.95; M.z = z - Math.sin(yaw) * 0.95; M.station = null; M.look = null; M.hop = null; M.wander = null;
    [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3);
    G.sim.snap();
  }
  function outsideSpot() { const h = house(); if (!h) return { x: -48.2, z: -149.9, yaw: 0 }; const p = h.world(h.dlx, h.front + 1.5); return { x: p.x, z: p.z, yaw: h.yaw }; }
  async function enter(o = {}) {
    if (!G || inside || busy || !on()) return;
    busy = true;
    try {
      if (!ROOM) buildRoom();
      examinerForLang(); refreshFrames();
      snd('wood');
      await UI.fade(1, 380);
      inside = true; ROOM.g.visible = true;
      G.w3d.setInterior({ fog: '#2a2018', near: 26, far: 70 });
      const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); G.cam.snap(Math.PI, 0.6, 11);
      await UI.fade(0, 380);
    } catch (e) { console.error('[academy] enter', e); }
    busy = false;
    const st = S(); const first = !st.visited; st.visited = true; EXAM._.save();
    if (first) { try { UI.chapter(P(ac('name') || 'Academy of Alba'), exName()); } catch (e) { /* */ } }
    if (o.quiet) return;
    if (first) { await STORY.wait(0.4); await sayX(says('welcome', 0)); await sayX(says('welcome', 1)); }
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
    } catch (e) { console.error('[academy] leave', e); }
    busy = false;
  }
  function roomItems() {
    const list = []; if (!inside || busy || !ROOM) return list;
    const A = (p, r, label, run) => list.push({ x: X0 + p.x, z: Z0 + p.z, y: Y0, r, label, run });
    A(SPOT.exit, 1.4, 'Leave', leave);
    A(SPOT.talk, 2.0, 'Talk', talk);
    A(SPOT.wall, 1.7, 'Look', wallLook);
    A(SPOT.board, 1.3, 'Read', () => SIGNS.read(rulesCard()));
    A(SPOT.notice, 1.3, hasMocks() ? 'Practice papers' : 'Read', practice);
    A({ x: SPOT.bench.x + 0.4, z: SPOT.bench.z - 0.8 }, 1.2, 'Look', async () => STORY.think(`A long wooden bench. A brass plate on it: «For those who wait». ${G.state.mimoName || 'Mimo'} sits on it whenever you take an exam.`, 5));
    return list;
  }
  function rulesCard() {
    const look = { face: '#2a3b33', edge: '#5a3a22', ink: '#f4efe4' };
    const lines = EXAM._.linesOf((C().lines || {}).rules || []);
    return { tag: 'The chalkboard', lines: [{ text: ac('chalk') || 'Examen de nivel', en: 'Level exams', look }].concat(lines.map(l => ({ text: l.t, en: l.en, look }))) };
  }
  async function wallLook() {
    const got = Object.keys(S().certs).map(Number).sort();
    if (!got.length) { STORY.think('Four empty frames: A1, A2, B1, B2. Passing an exam puts its certificate up here.', 5); return; }
    const was = G.sim.lock; G.sim.lock = 1;
    let b; try { b = await UI.choose('The wall of certificates', got.map(x => ({ label: `${B[x]} · ${Math.round(S().certs[x].total)}/100`, sub: S().certs[x].title, value: x }))); } finally { G.sim.lock = was; }
    if (b) await EXAMUI.cert(b);
  }
  // the examiner's menu: the exams you may take (or go on with), your certificates, the rules
  async function talk() {
    if (!on()) return;
    if (P0) P0.faceAt = null;
    for (let guard = 0; guard < 6; guard++) {
      const opts = [];
      for (let b = 1; b <= 4; b++) {
        if (!EXAM.open(b)) continue;
        const pa = EXAM.paused(b), cf = S().certs[b];
        if (pa) { const n = pa.sections.filter(x => pa.res[x.id] && pa.res[x.id].done).length; opts.push({ label: `Go on with your ${B[b]} exam`, sub: `${n} of 4 parts done`, value: { go: 'resume', b } }); opts.push({ label: `Start the ${B[b]} exam over`, sub: 'new questions; the parts you did are dropped', value: { go: 'over', b } }); continue; }
        opts.push({ label: cf ? `Take the ${B[b]} exam again` : `Take the ${B[b]} exam`, sub: cf ? `your best: ${Math.round(cf.total)}/100` : 'four parts, 25 points each · no time limit', value: { go: 'start', b } });
      }
      // (C: practice papers in the real exams' formats, on the same list: full papers and one-section drills)
      if (hasMocks()) opts.push({ label: 'Practice papers', sub: `${mockNames()} · real formats, our own questions`, value: { go: 'mock' } });
      if (Object.keys(S().certs).length) opts.push({ label: 'Your certificates', value: { go: 'certs' } });
      opts.push({ label: 'Ask about the exams', value: { go: 'rules' } });
      const was = G.sim.lock; G.sim.lock = 1;
      let v; try { v = await UI.choose(exName(), opts); } finally { G.sim.lock = was; }
      if (!v) { await sayX(says('bye')); return; }
      if (v.go === 'rules') { for (const ln of EXAM._.linesOf((C().lines || {}).rules || []).slice(0, 4)) await sayX(ln); continue; }
      if (v.go === 'certs') { await wallLook(); continue; }
      if (v.go === 'mock') { if (await practice()) return; continue; }
      if (v.go === 'over') { const pa = EXAM.paused(v.b); if (pa) { pa.abandoned = true; delete S().cur[v.b]; } }
      await sayX(says('begin'));
      await sitExam(() => (v.go === 'resume' ? EXAM.resume(v.b) : EXAM.start(v.b)));
      refreshFrames();
      return;
    }
  }
  // the practice papers (formats.js MOCK, mock_ui.js MOCKUI): the list, then the paper; true when one was sat
  const hasMocks = () => typeof MOCK !== 'undefined' && typeof MOCKUI !== 'undefined' && (MOCK.BY_LANG[L()] || []).some(f => MOCK.F[f].levels.some(lv => MOCK.has(L(), f, lv)));
  const mockNames = () => [...new Set(MOCK.rows(L()).map(r => r.F.name))].join(' · ');
  async function practice() {
    if (!hasMocks()) { STORY.think('The notice board is empty for now: no practice papers in this language yet.', 4); return false; }
    const was = G.sim.lock; G.sim.lock = 1;
    let pick = null; try { pick = await MOCKUI.choose(); } finally { G.sim.lock = was; }
    if (!pick) return false;
    await sayX(says('begin'));
    await sitExam(() => MOCKUI.start(pick));
    refreshFrames();
    return true;
  }
  // during an exam Mimo waits on the bench (no help), then hops back
  async function sitExam(fn) {
    try { G.sim.mimoGo({ x: X0 + SPOT.bench.x, z: Z0 + SPOT.bench.z - 0.15 }); } catch (e) { /* */ }
    let att = null;
    try { att = await fn(); } catch (e) { console.error('[academy] exam', e); }
    try { G.sim.mimoGo(null); } catch (e) { /* */ }
    if (att && att.done) {
      if (P0) { P0.pose = att.passedIt ? 'cheer' : 'idle'; setTimeout(() => { if (P0) P0.pose = 'idle'; }, 2500); }
      try { G.sim.mimo.happy = att.passedIt ? 3 : 0; } catch (e) { /* */ }
    }
    return att;
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
    const Y = G.sim.you;
    if (P0) ZHF.animate(P0, dt, t, { x: Y.x - X0, z: Y.z - Z0 });
    ROOM.sprites.forEach((s, i) => { s.material.opacity = 0.38 + 0.05 * Math.sin(t * 3.1 + i * 1.7); });
    // (a scene that broke off never leaves you frozen)
    if (G.sim.lock && !STORY.busy && !busy && !(typeof EXAMUI !== 'undefined' && EXAMUI.isOpen) && !document.querySelector('#choose:not(.hidden)')) { G.sim.lock = 0; G.cam.override = null; }
  }
  const PROVIDER = {         // story.js STORY.extra: outdoors, «Go in» at the door
    interactables() {
      if (!G || !OUT || OUT.broken || !G.state.flags.hatched || !on() || inside) return [];
      const D = OUT.doorIn || OUT.door;
      return [{ x: D.x, z: D.z, r: 1.7, label: 'Go in', run: enter }];
    },
    tick(dt, Y) {
      if (!G || !OUT || OUT.broken || !on() || !OUT.door) return;
      const st = S(); if (st.told || !G.state.flags.rosa) return;
      if (Math.hypot(OUT.door.x - Y.x, OUT.door.z - Y.z) < 12) { st.told = true; STORY.think(`Red banners with a crest: an open book under a rising sun. «${P(ac('name') || 'Academia')}». Alba has a school for languages!`, 5); EXAM._.save(); }
    },
  };

  // ------------------------------------------------------------ the mini-map's mark (minimap.js): the crest on the door
  const MARK = {};
  function mapMark(dpr) {
    if (!G || !OUT || OUT.broken || !OUT.door || !on() || (G.indoors && G.indoors())) return null;
    const k = String(dpr);
    if (!MARK[k]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = ACAD; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.arc(9, 9, 8, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#fffaf0'; c.beginPath(); c.moveTo(9, 7.4); c.quadraticCurveTo(6.6, 6.2, 4, 6.8); c.lineTo(4, 12.4); c.quadraticCurveTo(6.6, 11.8, 9, 13); c.quadraticCurveTo(11.4, 11.8, 14, 12.4); c.lineTo(14, 6.8); c.quadraticCurveTo(11.4, 6.2, 9, 7.4); c.closePath(); c.fill();
      c.fillStyle = GOLD; c.beginPath(); c.arc(9, 6.2, 2.2, Math.PI, 0); c.fill();
      MARK[k] = cv;
    }
    return { x: OUT.door.x, z: OUT.door.z, img: MARK[k] };
  }

  // ------------------------------------------------------------ tests (ACADEMY._.t; the game never calls them)
  const TESTS = (() => {
    const g = () => window.__g;
    const tick = ms => new Promise(r => setTimeout(r, ms));
    async function waitFor(fn, sec = 6) { for (let i = 0; i < sec * 10 && !fn(); i++) { await g().go(0.05); await tick(30); } return !!fn(); }
    async function enterNow(o = {}) { STORY.run(() => enter(Object.assign({ quiet: true }, o))); await waitFor(() => inside && !busy, 8); return inside; }
    async function leaveNow() { STORY.run(() => leave()); await waitFor(() => !inside && !busy, 8); return !inside; }
    function frame(name) {
      const D = { door: () => { const d = OUT.door, h = house(); const out = h.world(h.dlx + 3.2, h.front + 7.4); return { pos: [out.x, 3.4, out.z], look: [d.x + 1.2, 2.2, d.z - 1.0] }; },
        room: () => ({ pos: [X0 + 0.6, Y0 + 5.2, Z0 + 10.2], look: [X0, Y0 + 1.2, Z0 - 2.0] }), desk: () => ({ pos: [X0 + 1.4, Y0 + 2.3, Z0 + 1.2], look: [X0, Y0 + 1.5, Z0 - 4.0] }),
        wall: () => ({ pos: [X0 + 3.0, Y0 + 2.4, Z0 + 0.4], look: [X0 + HW, Y0 + 2.2, Z0 - 0.3] }),
        notice: () => ({ pos: [X0 + 1.9, Y0 + 2.3, Z0 + HD - 3.9], look: [X0 + SPOT.notice.x, Y0 + 1.7, Z0 + HD] }) }[name]();
      G.cam.override = { pos: new THREE.Vector3(...D.pos), look: new THREE.Vector3(...D.look), dur: 0.01 };
    }
    return { waitFor, enterNow, leaveNow, frame };
  })();

  // ------------------------------------------------------------ the game side
  function init(game) {
    G = game;
    if (typeof INTERIORS !== 'undefined' && INTERIORS.claim) INTERIORS.claim(id => id === DOOR_ID && on());
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
  }
  return {
    init,
    get inside() { return inside; },
    get OUTSIDE() { return inside ? outsideSpot() : null; },
    interactables() { return inside ? roomItems() : []; },
    update(dt, t) { roomUpdate(dt, t); },
    curiosities() { return []; },
    target() { if (!inside) return null; return { x: X0 + SPOT.talk.x, z: Z0 + SPOT.talk.z, hint: `{mimo} points at ${exName()}.` }; },
    get busy() { return busy || (typeof EXAMUI !== 'undefined' && EXAMUI.isOpen); },
    enter, leave, outdoor(dt, t, you) { outdoor(); }, mapMark,
    door: () => (inside ? { x: X0 + SPOT.exit.x, z: Z0 + SPOT.exit.z } : OUT && !OUT.broken && OUT.door ? { x: OUT.door.x, z: OUT.door.z } : null),
    desk: () => ({ x: X0 + SPOT.talk.x, z: Z0 + SPOT.talk.z }),
    DOOR_ID, ROOM_AT: { x: X0, y: Y0, z: Z0 }, SPOT,
    _: { house, outsideSpot, talk, wallLook, sayX, buildRoom, refreshFrames, get OUT() { return OUT; }, get ROOM() { return ROOM; }, get P() { return P0; }, t: TESTS },
  };
})();
