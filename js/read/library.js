'use strict';
// LIBRARY: Alba's library (DESIGN.md 15.4), in every language that has a dictionary pack and books (READ.on('books')).
// THE DOOR: 'alba-house-12', the one-floor house on the north street just off the plaza, across from the Plum Garden (its door
// faces the street, west). Claimed through INTERIORS.claim only while the library is on; otherwise it's an ordinary house.
// THE ROOM: floats at (−130, 300, 60) (registered in SIDES.md). Shelves by band along the north wall (A1, A2, B1, B2), the
// librarian's desk, a reading nook with the radio, a long table, the big clock on the east wall (Noa hid something behind it:
// overheard.js tells you), the notice board by the door.
// THE LIBRARIAN: an original character, a name per language (NAME); his lines come with the content (READ.add(lang,
// { librarian: { lines } })). LIBRARY.person is for the talk helper (js/talk/): an id, a name, a position, `say(key)`, and
// `options` (push { label, sub, run } to add to his menu, e.g. "Talk freely" once he's a bond).
//   LIBRARY.init(game) · as a room (main.js ROOMS): .inside · .OUTSIDE · .interactables() · .update(dt, t) · .target() · .enter()
//   · .leave() · .curiosities() · outdoors every frame: .update via READ.update → outdoor() · .mapMarks(dpr) · .readNote(id) · ._ (tests)

const LIBRARY = (() => {
  const DOOR_ID = 'alba-house-12', HOUSE_N = 12;
  const X0 = -130, Y0 = 300, Z0 = 60;                 // (≥ 26 from every other room: SIDES.md)
  const HW = 8, HD = 6, WH = 4.6, HALF = Math.PI / 2;
  const INK = '#2b2235';
  let G = null;
  const L = () => READ.lang;
  const on = () => READ.on('books');
  const esc = READ.esc;

  // ------------------------------------------------------------ names (CJK.md notation for zh/ja)
  const NAME = { es: 'Don Evaristo', pt: 'Seu Benedito', de: 'Herr Buchholz', zh: '[白|Bái] [爷爷|yé ye]', ja: '[文田|ふみた] さん', en: 'the librarian' };
  const PLACE = { es: 'BIBLIOTECA', pt: 'BIBLIOTECA', de: 'BIBLIOTHEK', zh: '[图书馆|tú shū guǎn]', ja: '[図書館|としょかん]', en: 'Library' };
  const MOTTO = { es: '¡Aquí se lee en voz alta!', pt: 'Aqui se lê em voz alta!', de: 'Hier wird laut gelesen!', zh: '[在|zài] [这里|zhè lǐ] [大声|dà shēng] [读书|dú shū] ！', ja: 'ここ で は [声|こえ] に [出|だ]して [読|よ]もう ！', en: 'Here we read aloud!' };
  const HOURS = { es: 'Abierto todos los días', pt: 'Aberto todos os dias', de: 'Jeden Tag geöffnet', zh: '[每天|měi tiān] [开放|kāi fàng]', ja: '[毎日|まいにち] [開館|かいかん]', en: 'Open every day' };
  const SHELF = { 1: { es: 'Primeros pasos', pt: 'Primeiros passos', de: 'Erste Schritte', zh: '[入门|rù mén]', ja: 'はじめて', en: 'First steps' },
    2: { es: 'Cuentos', pt: 'Contos', de: 'Geschichten', zh: '[故事|gù shi]', ja: 'おはなし', en: 'Stories' },
    3: { es: 'Historias largas', pt: 'Histórias longas', de: 'Lange Geschichten', zh: '[长篇|cháng piān]', ja: '[長|なが]い [話|はなし]', en: 'Longer stories' },
    4: { es: 'Para expertos', pt: 'Para quem já lê bem', de: 'Für Profis', zh: '[高级|gāo jí]', ja: '[上級|じょうきゅう]', en: 'For strong readers' } };
  const pick = T => (T[L()] != null ? T[L()] : T.en);
  const nm = () => { const c = READ.content(); return (c && c.librarian && c.librarian.name) || pick(NAME); };
  const nmPlain = () => READ.plain(nm());

  // ------------------------------------------------------------ the state (READ.S().lib) and the librarian's lines
  const S = () => READ.S().lib;
  function lineOf(key, i) {
    const c = READ.content(), v = c && c.librarian && c.librarian.lines && c.librarian.lines[key];
    if (!v) return null;
    const arr = Array.isArray(v) ? v : [v], x = arr[Math.min(arr.length - 1, i == null ? 0 : i)];
    return typeof x === 'string' ? { text: x, en: '' } : x;
  }
  const lineCount = key => { const c = READ.content(), v = c && c.librarian && c.librarian.lines && c.librarian.lines[key]; return v ? (Array.isArray(v) ? v.length : 1) : 0; };

  // ------------------------------------------------------------ outside: house 12 dressed as the library
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
  function signTex(w, h, draw) { return ZHF.canvasTex(w, h, draw); }
  function plaqueDraw(c, l) {
    SIGNS.paint(c, 512, 256, { text: pick(PLACE), edge: '#2f5a4a', face: '#fbf3dc', ink: '#2b2235', icon: 'rd_book', iconSide: 'L', size: 0.5 });
  }
  function boardDraw(c, l) {
    c.fillStyle = '#6b4a2e'; c.fillRect(0, 0, 512, 640); c.fillStyle = '#23302a'; c.fillRect(18, 18, 476, 604);
    c.fillStyle = '#f4efe4'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const motto = READ.plain(pick(MOTTO)), hours = READ.plain(pick(HOURS));
    const wrap = (text, y, px, maxW) => { const ws = text.split(/\s+/), lines = []; let cur = ''; c.font = `800 ${px}px Bahnschrift, "Segoe UI", sans-serif`; for (const w of ws) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); lines.forEach((ln, i) => c.fillText(ln, 256, y + i * px * 1.15)); return lines.length; };
    if (typeof ICONS !== 'undefined') try { c.drawImage(ICONS.canvas('rd_book', 160), 176, 50, 160, 160); } catch (e) { /* */ }
    const n = wrap(motto, 270, /^(zh|ja)$/.test(l) ? 54 : 56, 420);
    c.fillStyle = '#f2c94c'; wrap(hours, 300 + n * 64, 34, 420);
    c.fillStyle = 'rgba(244,239,228,.5)'; c.font = '700 26px "Segoe UI", sans-serif'; c.fillText('📖  📻  ✎', 256, 590);
  }
  function addIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    try {
      // an open book (icons.js's rule: drawn twice in a 100 box round 0,0; pass 0 is the paper border)
      ICONS.add('rd_book', (c, p, h) => {
        h.shape(c, p, cc => { cc.moveTo(0, -18); cc.quadraticCurveTo(-18, -30, -38, -24); cc.lineTo(-38, 22); cc.quadraticCurveTo(-18, 16, 0, 27); cc.quadraticCurveTo(18, 16, 38, 22); cc.lineTo(38, -24); cc.quadraticCurveTo(18, -30, 0, -18); cc.closePath(); }, '#fffaf0');
        if (!p) return;
        c.beginPath(); c.moveTo(0, -18); c.lineTo(0, 27); c.lineWidth = 2.2; c.strokeStyle = h.INK; c.stroke();
        c.strokeStyle = '#21a493'; c.lineWidth = 2.4; for (const y of [-10, -1, 8]) { c.beginPath(); c.moveTo(-30, y); c.lineTo(-8, y + 3); c.moveTo(8, y + 3); c.lineTo(30, y); c.stroke(); }
        c.fillStyle = '#c2412f'; c.beginPath(); c.moveTo(16, -26); c.lineTo(23, -26); c.lineTo(23, -8); c.lineTo(19.5, -12); c.lineTo(16, -8); c.closePath(); c.fill();
      });
    } catch (e) { /* (icons.js without add) */ }
  }
  function buildOutside() {
    const h = house(); if (!h || !G || typeof ZHF === 'undefined') return null;
    const g = new THREE.Group(); g.name = 'library-outside'; g.position.set(h.b.x, h.GY, h.b.z); g.rotation.y = h.yaw; G.w3d.scene.add(g);
    const F = h.front, dx = h.dlx, k = ZHF.Kit();
    // the signboard over the door: a green-framed board on two brackets
    const pcv = document.createElement('canvas'); pcv.width = 512; pcv.height = 256;
    const ptex = new THREE.CanvasTexture(pcv); ptex.anisotropy = 4;
    const drawPlaque = l => { plaqueDraw(pcv.getContext('2d'), l); ptex.needsUpdate = true; };
    if (SIGNS.board) SIGNS.board(drawPlaque); else drawPlaque(L());
    // (a two-sided hanging sign on an iron bracket at the house's corner, read from up and down the street; each face its own
    // plane, so neither side is mirrored)
    const sxw = dx > 0 ? h.b.w / 2 - 0.2 : -h.b.w / 2 + 0.2, sy = 2.4, sz = F + 0.86;
    k.box(sxw, sy + 0.5, F + 0.66, 0.05, 0.05, 1.32, '#2b2235', { ink: 0 }).box(sxw, sy + 0.24, F + 0.05, 0.06, 0.6, 0.06, '#2b2235', { ink: 0 });
    k.rod([sxw, sy + 0.2, F + 0.05], [sxw, sy + 0.5, F + 0.5], 0.018, '#2b2235', { ink: 0 });
    for (const s of [-1, 1]) k.rod([sxw, sy + 0.5, sz + s * 0.55], [sxw, sy + 0.38, sz + s * 0.55], 0.012, '#2b2235', { ink: 0 });
    k.box(sxw, sy, sz, 0.08, 0.76, 1.44, '#2f5a4a');
    for (const s of [-1, 1]) { const m = ZHF.plane(1.36, 0.68, ptex); m.position.set(sxw + s * 0.045, sy, sz); m.rotation.y = s * HALF; g.add(m); }
    const signRead = h.world(sxw, F + 1.25);
    // the chalkboard by the door (an A-frame: both faces)
    const mx = dx + 1.55 > h.b.w / 2 - 0.3 ? dx - 1.55 : dx + 1.55, mz = F + 0.85;
    const bcv = document.createElement('canvas'); bcv.width = 512; bcv.height = 640;
    const btex = new THREE.CanvasTexture(bcv); btex.anisotropy = 4;
    const drawBoard = l => { boardDraw(bcv.getContext('2d'), l); btex.needsUpdate = true; };
    if (SIGNS.board) SIGNS.board(drawBoard); else drawBoard(L());
    for (const s of [-1, 1]) {
      const m = ZHF.plane(0.66, 0.84, btex); m.position.set(mx, 0.6, mz + s * 0.235); m.rotation.set(s * -0.32, s < 0 ? Math.PI : 0, 0); g.add(m);
      k.box(mx, 0.6, mz + s * 0.19, 0.72, 0.92, 0.03, '#6b4a2e', { rx: s * -0.32, ink: 0.01 });
    }
    k.box(mx, 1.06, mz, 0.76, 0.04, 0.12, '#5a3a22');
    // two pots of herbs either side of the door, and a little stack of books on a crate (a free book swap)
    for (const s of [-1, 1]) { const x = dx + s * 0.85; if (Math.abs(x) > h.b.w / 2 - 0.2) continue; k.cyl(x, 0.2, F + 0.32, 0.18, 0.4, '#b5654a').ball(x, 0.55, F + 0.32, 0.26, 0.2, 0.26, '#5a8a3a', { ink: 0.008 }); }
    const sx = mx > dx ? dx - 1.5 : dx + 1.5;
    if (Math.abs(sx) < h.b.w / 2 - 0.3) { k.box(sx, 0.22, F + 0.45, 0.6, 0.44, 0.4, '#a8784e'); [['#c2412f', 0.12], ['#3f6fb5', 0.1], ['#e6a92e', 0.11]].forEach(([col, hgt], i) => k.box(sx, 0.48 + i * 0.11, F + 0.45, 0.46 - i * 0.06, hgt * 0.8, 0.32, col, { ink: 0.006, ry: i * 0.3 })); }
    const baked = ZHF.bake(g, k);
    const W = (lx, lz) => h.world(lx, lz);
    return { g, baked, h, l: L(), menuSolid: W(mx, mz), boardAt: W(mx, mz + 0.9), signAt: signRead, door: W(dx, F + 0.8), doorIn: W(dx, F + 0.35), crate: W(sx, F + 0.45) };
  }
  const SOLID = { x: 1e5, z: 1e5, r: 0.42, library: true };
  function outdoor() {
    if (!G || typeof TOWN === 'undefined') return;
    const live = on();
    if (!OUT && !live) return;
    if (!OUT) { try { OUT = buildOutside() || { broken: true }; } catch (e) { console.error('[library]', e); OUT = { broken: true }; } }
    if (OUT.broken) return;
    const town = G.town && G.town.group;
    const vis = live && !(G.indoors && G.indoors()) && (!town || town.visible);
    OUT.g.visible = vis;
    if (!WORLD.extra.includes(SOLID)) WORLD.extra.push(SOLID);
    if (vis) { SOLID.x = OUT.menuSolid.x; SOLID.z = OUT.menuSolid.z; } else { SOLID.x = SOLID.z = 1e5; }
    if (!OUT.signed && typeof SIGNS !== 'undefined' && SIGNS.add) {
      OUT.signed = true;
      SIGNS.add({ id: 'library-sign', x: OUT.signAt.x, z: OUT.signAt.z, r: 1.3, when: () => !inside && on(), card: () => signCard() });
      SIGNS.add({ id: 'library-board', x: OUT.boardAt.x, z: OUT.boardAt.z, r: 1.3, when: () => !inside && on(), card: () => boardCard() });
    }
  }
  function signCard() { const look = { face: '#fbf3dc', edge: '#2f5a4a', ink: INK }; return { tag: 'The sign over the door', lines: [{ text: pick(PLACE), en: 'Library', look }] }; }
  function boardCard() {
    const look = { face: '#23302a', edge: '#6b4a2e', ink: '#f4efe4' };
    return { tag: 'The chalkboard by the door', lines: [{ text: pick(MOTTO), en: MOTTO.en, look }, { text: pick(HOURS), en: HOURS.en, look }] };
  }

  // ------------------------------------------------------------ the room (built on the first visit)
  let ROOM = null;
  const SPOT = { spawn: { x: 0, z: HD - 1.3 }, exit: { x: 0, z: HD - 0.5 }, desk: { x: 0, z: -1.9 }, lib: { x: 0, z: -3.0 }, talk: { x: 0, z: -0.75 },
    radio: { x: -6.7, z: -0.4 }, board: { x: -HW + 0.5, z: 3.6 }, clock: { x: HW - 0.15, z: -1.2 }, clockAt: { x: HW - 1.2, z: -1.2 },
    nook: { x: -4.9, z: 1.2 }, table: { x: 3.4, z: 2.3 }, globe: { x: 5.9, z: -3.0 }, kids: { x: 5.6, z: 4.2 } };
  const CASES = [1, 2, 3, 4].map((band, i) => ({ band, x: -5.4 + i * 3.6, z: -HD + 0.42 }));
  function floorTex() {
    return signTex(512, 512, c => {
      for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) {
        const off = (j % 2) * 64, x = i * 128 + off, y = j * 64;
        c.fillStyle = ['#a8784e', '#9a6c44', '#b38254', '#a07048'][(i + j * 3) % 4]; c.fillRect(x - 128, y, 128, 64); c.fillRect(x, y, 128, 64);
        c.strokeStyle = 'rgba(60,35,20,.45)'; c.lineWidth = 3; c.strokeRect(x, y, 128, 64); c.strokeRect(x - 128, y, 128, 64);
        c.fillStyle = 'rgba(60,35,20,.12)'; c.fillRect(x + 20 + (j * 13) % 60, y + 20, 40, 3);
      }
    });
  }
  function wallTex() {
    return signTex(512, 512, c => {
      c.fillStyle = '#f1e6c8'; c.fillRect(0, 0, 512, 512);
      c.fillStyle = 'rgba(47,90,74,.10)'; for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 ? 32 : 0; x < 512; x += 64) { c.beginPath(); c.arc(x + 16, y + 16, 7, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#2f5a4a'; c.fillRect(0, 380, 512, 132); c.fillStyle = '#c9a24a'; c.fillRect(0, 374, 512, 8);
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 3; for (let x = 0; x < 512; x += 128) c.strokeRect(x + 12, 396, 104, 100);
    });
  }
  function plaqueTex(band) {
    return signTex(256, 128, c => {
      c.fillStyle = '#c9a24a'; c.fillRect(0, 0, 256, 128); c.fillStyle = '#3a2a22'; c.fillRect(8, 8, 240, 112);
      c.fillStyle = '#f2d98a'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 64px Bahnschrift, "Segoe UI", sans-serif';
      c.fillText(READ.BAND(band), 128, 50);
      const t = READ.plain(SHELF[band][L()] || SHELF[band].en); let px = 26; c.font = `700 ${px}px "Segoe UI", sans-serif`; while (px > 12 && c.measureText(t).width > 226) { px--; c.font = `700 ${px}px "Segoe UI", sans-serif`; } c.fillText(t, 128, 98);
    });
  }
  function clockTex() {
    return signTex(256, 256, c => {
      c.fillStyle = '#fbf6e7'; c.beginPath(); c.arc(128, 128, 120, 0, Math.PI * 2); c.fill(); c.lineWidth = 10; c.strokeStyle = '#5a3a22'; c.stroke();
      c.fillStyle = INK; c.font = '700 30px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      ['XII', 'III', 'VI', 'IX'].forEach((n, i) => { const a = i * Math.PI / 2 - Math.PI / 2; c.fillText(n, 128 + Math.cos(a) * 88, 128 + Math.sin(a) * 88); });
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.fillRect(128 + Math.cos(a) * 104 - 3, 128 + Math.sin(a) * 104 - 3, 6, 6); }
    });
  }
  function windowTex() {
    return signTex(256, 320, c => {
      const g = c.createLinearGradient(0, 0, 0, 320); g.addColorStop(0, '#9fd4ef'); g.addColorStop(1, '#e6f4ea'); c.fillStyle = g; c.fillRect(0, 0, 256, 320);
      c.fillStyle = '#7fb069'; c.beginPath(); c.ellipse(70, 300, 110, 60, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(210, 310, 90, 50, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(80, 70, 40, 14, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#f4efe4'; c.lineWidth = 14; c.strokeRect(7, 7, 242, 306); c.beginPath(); c.moveTo(128, 0); c.lineTo(128, 320); c.moveTo(0, 160); c.lineTo(256, 160); c.stroke();
    });
  }
  function boardTex() {
    return signTex(512, 384, c => {
      c.fillStyle = '#b8895a'; c.fillRect(0, 0, 512, 384); c.fillStyle = '#c9a074'; c.fillRect(14, 14, 484, 356);
      const papers = [[40, 40, 190, 150, '#fffaf0', -0.05], [260, 36, 210, 120, '#fff3b0', 0.04], [60, 210, 170, 140, '#d9f0ea', 0.03], [270, 180, 200, 170, '#fbe0e0', -0.04]];
      for (const [x, y, w, h, col, r] of papers) { c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(r); c.fillStyle = col; c.fillRect(-w / 2, -h / 2, w, h); c.fillStyle = '#c2412f'; c.beginPath(); c.arc(0, -h / 2 + 10, 7, 0, Math.PI * 2); c.fill(); c.strokeStyle = 'rgba(43,34,53,.4)'; c.lineWidth = 3; for (let ly = -h / 2 + 32; ly < h / 2 - 12; ly += 18) { c.beginPath(); c.moveTo(-w / 2 + 14, ly); c.lineTo(w / 2 - 14 - ((ly * 7) % 30), ly); c.stroke(); } c.restore(); }
    });
  }
  const PAL = ['#a8322c', '#2f5a4a', '#3f6fb5', '#e6a92e', '#6b3a5a', '#7a8a3a', '#c9783a', '#2b2235', '#d9c9a8', '#4a8a9a', '#8a5ab0', '#b5654a'];
  const glowSprite = (col, s) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: col, transparent: true, opacity: 0.45, depthWrite: false })); m.scale.setScalar(s); return m; };
  function buildRoom() {
    const g = new THREE.Group(); g.name = 'library-room'; g.position.set(X0, Y0, Z0); g.visible = false; G.w3d.scene.add(g);
    const k = ZHF.Kit(), solids = [], glows = [], R = rng(1212);
    const ft = floorTex(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(HW / 2, HD / 2);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, 0.3, 2 * HD), new THREE.MeshToonMaterial({ map: ft, gradientMap: TK.grad })); floor.position.y = -0.15; floor.receiveShadow = true; g.add(floor);
    const wt = wallTex(); wt.wrapS = THREE.RepeatWrapping;
    for (const [w, x, z, ry] of [[2 * HW, 0, -HD, 0], [2 * HW, 0, HD, Math.PI], [2 * HD, -HW, 0, HALF], [2 * HD, HW, 0, -HALF]]) {
      const t = wt.clone(); t.needsUpdate = true; t.repeat.set(w / 5, 1);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), new THREE.MeshToonMaterial({ map: t, gradientMap: TK.grad })); m.position.set(x, WH / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    }
    solids.push({ obox: 1, x: 0, z: -HD - 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: 0, z: HD + 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 },
      { obox: 1, x: -HW - 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 }, { obox: 1, x: HW + 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 });
    for (const [x, z] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD]]) k.box(x + (x < 0 ? 0.1 : -0.1), WH / 2, z + (z < 0 ? 0.1 : -0.1), 0.22, WH, 0.22, '#4a3222');
    // the bookcases along the north wall, one per band, full of books (and a brass plaque on each)
    for (const C of CASES) {
      const x = C.x, z = C.z, w = 3.2, hgt = 3.7, d = 0.62;
      k.box(x, hgt / 2, z - 0.06, w, hgt, 0.08, '#4a3222', { ink: 0 }).box(x - w / 2, hgt / 2, z + 0.24, 0.1, hgt, d, '#6b4a2e').box(x + w / 2, hgt / 2, z + 0.24, 0.1, hgt, d, '#6b4a2e');
      k.box(x, hgt + 0.07, z + 0.26, w + 0.26, 0.14, d + 0.14, '#5a3a22');
      for (let s = 0; s < 5; s++) {
        const y = 0.1 + s * 0.72; k.box(x, y, z + 0.24, w, 0.06, d, '#7a5236', { ink: 0.006 });
        let bx = x - w / 2 + 0.1;
        while (bx < x + w / 2 - 0.16) {
          if (R() < 0.06) { bx += 0.14; continue; }
          const bw = 0.07 + R() * 0.07, bh = 0.4 + R() * 0.19, lean = R() < 0.05 ? 0.2 : 0;
          k.box(bx + bw / 2, y + 0.03 + bh / 2, z + 0.27, bw, bh, 0.4 + R() * 0.06, PAL[(R() * PAL.length) | 0], { ink: 0.005, rz: lean });
          bx += bw + 0.01;
        }
      }
      const pl = ZHF.plane(0.66, 0.33, plaqueTex(C.band)); pl.position.set(x, hgt + 0.07, z + 0.6); g.add(pl); C.plaque = pl;
      solids.push({ obox: 1, x, z: z + 0.22, hw: w / 2 + 0.08, hd: 0.42, rot: 0 });
    }
    // the rolling ladder against the A2 case
    for (const s of [-1, 1]) k.rod([-2.6 + s * 0.24, 0, -HD + 1.25], [-2.6 + s * 0.24, 3.6, -HD + 0.86], 0.03, '#8a5f3e');
    for (let i = 1; i < 9; i++) { const t = i / 9; k.box(-2.6, t * 3.6, -HD + 1.25 - t * 0.39, 0.5, 0.04, 0.05, '#8a5f3e', { ink: 0.004 }); }
    // the desk: a brass bell, a green banker's lamp, a stamp, a stack of books
    const D = SPOT.desk;
    k.box(D.x, 0.44, D.z, 2.8, 0.88, 1.0, '#6b4a2e').box(D.x, 0.91, D.z, 2.96, 0.07, 1.12, '#8a5f3e').box(D.x, 0.44, D.z + 0.505, 2.6, 0.7, 0.02, '#5a3a22', { ink: 0.006 });
    k.cyl(D.x - 0.95, 0.97, D.z - 0.15, 0.13, 0.05, '#c9a24a').cyl(D.x - 0.95, 1.15, D.z - 0.15, 0.025, 0.36, '#c9a24a', { ink: 0.004 });
    k.add(ZHF.GEO.half, '#2f7a4a', D.x - 0.95, 1.34, D.z - 0.05, 0.26, 0.12, 0.15, Math.PI, 0, 0);
    k.add(ZHF.GEO.ball, '#fff3b0', D.x - 0.95, 1.29, D.z - 0.05, 0.18, 0.03, 0.1, 0, 0, 0, { glow: true, ink: 0 }); glows.push({ x: D.x - 0.95, y: 1.15, z: D.z + 0.1, c: '#ffe7a0', s: 1.3 });
    k.add(ZHF.GEO.half, '#c9a24a', D.x + 0.9, 0.95, D.z + 0.2, 0.09, 0.08, 0.09).ball(D.x + 0.9, 1.04, D.z + 0.2, 0.02, 0.02, 0.02, '#c9a24a', { ink: 0 });
    [['#a8322c', 0.08], ['#3f6fb5', 0.07], ['#e6a92e', 0.09]].forEach(([c, h], i) => k.box(D.x + 0.25, 0.98 + i * 0.085, D.z - 0.1, 0.5 - i * 0.04, h, 0.36, c, { ink: 0.005, ry: i * 0.15 }));
    k.box(D.x + 0.55, 0.99, D.z + 0.25, 0.1, 0.1, 0.1, '#5a3a22').cyl(D.x + 0.55, 1.08, D.z + 0.25, 0.035, 0.1, '#2b2235');
    solids.push({ obox: 1, x: D.x, z: D.z, hw: 1.5, hd: 0.58, rot: 0 }, { x: SPOT.lib.x, z: SPOT.lib.z, r: 0.45 });
    // the reading nook (west): a round rug, two armchairs, a little table, a floor lamp; the radio on its side table
    const N = SPOT.nook;
    k.cyl(N.x, 0.012, N.z, 2.0, 0.02, '#a8423a', { ink: 0 }).cyl(N.x, 0.016, N.z, 1.6, 0.02, '#c9783a', { ink: 0 }).cyl(N.x, 0.02, N.z, 1.1, 0.02, '#e6c07a', { ink: 0 });
    for (const [ax, az, ry] of [[N.x - 1.2, N.z - 0.6, 0.9], [N.x + 1.1, N.z + 0.9, -2.3]]) {
      k.frame(ax, 0, az, ry);
      k.box(0, 0.25, 0, 0.9, 0.5, 0.86, '#2f5a4a').box(0, 0.7, -0.36, 0.9, 0.9, 0.18, '#2f5a4a').box(-0.4, 0.55, 0, 0.14, 0.32, 0.86, '#2f5a4a').box(0.4, 0.55, 0, 0.14, 0.32, 0.86, '#2f5a4a').box(0, 0.53, 0.04, 0.68, 0.08, 0.68, '#3f7a62', { ink: 0.006 });
      k.free(); solids.push({ x: ax, z: az, r: 0.55 });
    }
    k.cyl(N.x, 0.3, N.z + 0.15, 0.06, 0.6, '#5a3a22').cyl(N.x, 0.62, N.z + 0.15, 0.42, 0.05, '#8a5f3e').cyl(N.x + 0.1, 0.69, N.z + 0.1, 0.07, 0.09, '#fffaf0');
    solids.push({ x: N.x, z: N.z + 0.15, r: 0.45 });
    k.cyl(-HW + 0.7, 0.03, 2.6, 0.22, 0.06, '#3a2a22').cyl(-HW + 0.7, 0.85, 2.6, 0.025, 1.6, '#3a2a22').add(ZHF.GEO.cone, '#f2d98a', -HW + 0.7, 1.75, 2.6, 0.3, 0.32, 0.3);
    glows.push({ x: -HW + 0.7, y: 1.55, z: 2.6, c: '#ffd98a', s: 1.8 }); solids.push({ x: -HW + 0.7, z: 2.6, r: 0.3 });
    const RS = SPOT.radio;
    k.box(RS.x, 0.4, RS.z, 0.7, 0.8, 0.55, '#6b4a2e').box(RS.x, 0.82, RS.z, 0.78, 0.05, 0.62, '#8a5f3e');
    solids.push({ obox: 1, x: RS.x, z: RS.z, hw: 0.42, hd: 0.34, rot: 0 });
    if (typeof RADIO !== 'undefined' && RADIO.model) { try { const r = RADIO.model(); r.g.position.set(RS.x, 0.85, RS.z); r.g.rotation.y = HALF * 0.8; r.g.scale.setScalar(0.9); g.add(r.g); ROOM_RADIO = r; } catch (e) { console.error('[library] radio', e); } }
    // the long table (east of the middle): four chairs, two green lamps, open books
    const T0 = SPOT.table;
    k.box(T0.x, 0.78, T0.z, 3.4, 0.08, 1.3, '#8a5f3e');
    for (const [lx, lz] of [[-1.55, -0.55], [1.55, -0.55], [-1.55, 0.55], [1.55, 0.55]]) k.box(T0.x + lx, 0.38, T0.z + lz, 0.1, 0.76, 0.1, '#5a3a22');
    for (const s of [-1, 1]) for (const cx of [-0.85, 0.85]) {
      const x = T0.x + cx, z = T0.z + s * 1.05;
      k.box(x, 0.45, z, 0.5, 0.06, 0.5, '#7a5236').box(x, 0.72, z + s * 0.24, 0.5, 0.56, 0.05, '#7a5236');
      for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) k.box(x + a, 0.22, z + b, 0.05, 0.44, 0.05, '#5a3a22', { ink: 0.004 });
    }
    for (const lx of [-0.9, 0.9]) { k.cyl(T0.x + lx, 0.85, T0.z - 0.25, 0.1, 0.05, '#c9a24a').cyl(T0.x + lx, 1.0, T0.z - 0.25, 0.02, 0.28, '#c9a24a', { ink: 0.004 }); k.add(ZHF.GEO.half, '#2f7a4a', T0.x + lx, 1.17, T0.z - 0.15, 0.22, 0.1, 0.13, Math.PI, 0, 0); glows.push({ x: T0.x + lx, y: 1.0, z: T0.z, c: '#ffe7a0', s: 1.1 }); }
    for (const [lx, c] of [[-0.3, '#fffaf0'], [0.7, '#fbf3dc']]) { k.box(T0.x + lx - 0.13, 0.83, T0.z + 0.2, 0.26, 0.02, 0.34, c, { ink: 0.004, rz: 0.06 }).box(T0.x + lx + 0.13, 0.83, T0.z + 0.2, 0.26, 0.02, 0.34, c, { ink: 0.004, rz: -0.06 }); }
    solids.push({ obox: 1, x: T0.x, z: T0.z, hw: 1.75, hd: 0.7, rot: 0 });
    for (const s of [-1, 1]) for (const cx of [-0.85, 0.85]) solids.push({ x: T0.x + cx, z: T0.z + s * 1.05, r: 0.3 });
    // the grandfather clock against the east wall (something's tucked behind it…), the globe, the children's corner
    const CL = { x: HW - 0.42, z: SPOT.clock.z };
    k.box(CL.x, 1.25, CL.z, 0.5, 2.5, 0.8, '#5a3a22').box(CL.x, 2.62, CL.z, 0.56, 0.24, 0.9, '#4a3222').box(CL.x - 0.26, 1.15, CL.z, 0.02, 1.0, 0.4, '#d9e8ef', { ink: 0.004 });
    k.cone(CL.x, 2.86, CL.z, 0.42, 0.24, '#4a3222');
    const face = ZHF.plane(0.66, 0.66, clockTex(), { alpha: true }); face.position.set(CL.x - 0.26, 2.0, CL.z); face.rotation.y = -HALF; g.add(face);
    const hands = new THREE.Group(); hands.position.set(CL.x - 0.275, 2.0, CL.z); hands.rotation.y = -HALF; g.add(hands);
    const hourH = TK.part(TK.G.box, INK, [0, 0.07, 0], [0.025, 0.15, 0.01], { ink: 0 }), minH = TK.part(TK.G.box, INK, [0, 0.11, 0], [0.018, 0.22, 0.01], { ink: 0 });
    const hp = new THREE.Group(), mp = new THREE.Group(); hp.add(hourH); mp.add(minH); hands.add(hp, mp);
    const pend = new THREE.Group(); pend.position.set(CL.x - 0.24, 1.6, CL.z); g.add(pend);
    pend.add(TK.part(TK.G.box, '#c9a24a', [0, -0.35, 0], [0.012, 0.7, 0.012], { ink: 0 })); pend.add(TK.part(TK.G.sphere, '#c9a24a', [0, -0.72, 0], [0.09, 0.09, 0.03], { ink: 0.004 }));
    solids.push({ obox: 1, x: CL.x, z: CL.z, hw: 0.3, hd: 0.48, rot: 0 });
    const GL = SPOT.globe;
    k.cyl(GL.x, 0.03, GL.z, 0.3, 0.06, '#5a3a22').cyl(GL.x, 0.5, GL.z, 0.04, 0.95, '#5a3a22').ball(GL.x, 1.25, GL.z, 0.36, 0.36, 0.36, '#4a8ac9');
    for (const [a, b, s] of [[0.3, 0.5, 0.16], [-0.6, 0.2, 0.2], [1.6, -0.3, 0.14], [2.6, 0.4, 0.18]]) k.ball(GL.x + Math.cos(a) * 0.3, 1.25 + b * 0.25, GL.z + Math.sin(a) * 0.3, s, s * 0.7, s, '#6fae5a', { ink: 0 });
    k.add(ZHF.GEO.tor, '#c9a24a', GL.x, 1.25, GL.z, 0.42, 0.42, 0.42, 0, 0, 0.4, { ink: 0 });
    solids.push({ x: GL.x, z: GL.z, r: 0.42 });
    const KC = SPOT.kids;
    k.cyl(KC.x, 0.012, KC.z, 1.4, 0.02, '#8ac9b8', { ink: 0 });
    k.box(KC.x + 1.1, 0.42, KC.z - 0.2, 0.5, 0.84, 1.6, '#e6a92e');
    for (let i = 0; i < 9; i++) k.box(KC.x + 1.0, 0.88 + (i % 3) * 0.0, KC.z - 0.85 + i * 0.18, 0.3, 0.16 + (i % 3) * 0.04, 0.1, PAL[(i * 5) % PAL.length], { ink: 0.004, rx: 0.1 });
    for (const [cx, cz, c] of [[-0.5, 0.3, '#e86a8a'], [0.2, -0.5, '#4a8ac9'], [0.3, 0.6, '#e6c07a']]) k.ball(KC.x + cx, 0.14, KC.z + cz, 0.32, 0.14, 0.32, c, { ink: 0.008 });
    solids.push({ obox: 1, x: KC.x + 1.1, z: KC.z - 0.2, hw: 0.3, hd: 0.85, rot: 0 });
    // windows (east and west), the notice board by the door, the welcome mat, two hanging lamps
    for (const [x, z, ry] of [[-HW + 0.03, -2.8, HALF], [HW - 0.03, 2.6, -HALF]]) { const w = ZHF.plane(1.3, 1.6, windowTex()); w.position.set(x, 2.4, z); w.rotation.y = ry; g.add(w); }
    const nb = ZHF.plane(1.5, 1.12, boardTex()); nb.position.set(-HW + 0.05, 1.9, SPOT.board.z); nb.rotation.y = HALF; g.add(nb);
    k.box(0, 0.016, HD - 0.62, 1.8, 0.02, 0.9, '#7a5236', { ink: 0 });
    for (const [x, z] of [[-3, -0.2], [3, -0.2]]) { k.cyl(x, WH - 0.45, z, 0.008, 0.9, INK, { ink: 0, geo: ZHF.GEO.cyl8 }).add(ZHF.GEO.cone, '#2f5a4a', x, WH - 0.95, z, 0.34, 0.26, 0.34); glows.push({ x, y: WH - 1.15, z, c: '#ffe7a0', s: 2.4 }); }
    const baked = ZHF.bake(g, k);
    const sprites = glows.map(q => { const s = glowSprite(q.c, q.s); s.position.set(q.x, q.y, q.z); g.add(s); return s; });
    WORLD.addSolids(solids.map(s => Object.assign({}, s, { x: X0 + s.x, z: Z0 + s.z, library: true })));
    WORLD.addPlatforms([{ box: [X0 - HW, X0 + HW, Z0 - HD, Z0 + HD], top: Y0, library: true }]);
    ROOM = { g, baked, sprites, pend, hp, mp };
    ROOM.lib = makeLibrarian(g);
    return ROOM;
  }
  let ROOM_RADIO = null;

  // ------------------------------------------------------------ the librarian: an old gentleman in a green cardigan, a red bow tie, round glasses
  let P = null;
  function makeLibrarian(parent) {
    P = ZHF.person({ skin: '#b97f56', hair: '#e2ddd3', brow: '#e2ddd3', shirt: '#f4efe4', sleeve: '#5a7a4a', vest: '#5a7a4a', pants: '#4a4038', shoes: '#3a2b26', collar: '#f4efe4', glasses: true, mustache: true, old: true });
    const k = ZHF.Kit();
    k.box(0, P.hipY + 0.58, 0.245, 0.07, 0.06, 0.04, '#c2412f', { ink: 0.004 }).box(-0.06, P.hipY + 0.58, 0.245, 0.07, 0.08, 0.03, '#c2412f', { ink: 0.004, rz: 0.4 }).box(0.06, P.hipY + 0.58, 0.245, 0.07, 0.08, 0.03, '#c2412f', { ink: 0.004, rz: -0.4 });
    ZHF.bake(P.body, k);
    const bk = ZHF.Kit(); bk.box(0, -0.02, 0.05, 0.2, 0.26, 0.05, '#a8322c', { ink: 0.006 }).box(0.0, -0.02, 0.078, 0.16, 0.22, 0.01, '#fffaf0', { ink: 0 });
    ZHF.bake(P.arms[0].userData.hand, bk);
    P.x = SPOT.lib.x; P.z = SPOT.lib.z; P.y = 0; P.yaw = P.baseYaw = 0; P.pose = 'hold';
    parent.add(P.root);
    return P;
  }
  // the speaker STORY.sayInline needs (its bubble floats over his head)
  const LP = { id: 'librarian', get name() { return nmPlain(); }, get x() { return X0 + (P ? P.x : SPOT.lib.x); }, get z() { return Z0 + (P ? P.z : SPOT.lib.z); }, y: Y0, top: 1.95, lines: null,
    get talking() { return !!(P && P.talking); }, set talking(v) { if (P) P.talking = !!v; } };
  async function sayL(key, i, vars) {
    const ln = lineOf(key, i); if (!ln) return false;
    const sub = s => String(s || '').replace(/\{(\w+)\}/g, (m, k2) => (vars && vars[k2] != null ? vars[k2] : k2 === 'mimo' ? READ.mimo() : m));
    const text = sub(ln.text), en = sub(ln.en || '');
    LP.lines = { [L()]: text, en };
    if (P) P.pose = 'idle';
    try { const said = STORY.sayInline(LP, true); mixInto(STORY.line, text, en); await said; } finally { if (P) P.pose = 'hold'; }
    return true;
  }
  // His lines are mixed by the weave like everyone's (js/talk/mix.js, DESIGN.md 16): STORY.sayInline puts the line up whole in
  // the language, and before its bubble draws, a mixed one becomes the English with the words you know in the language (EN in
  // the bubble: the whole English). A line the weave says whole stays as it is, with the English under it until 0.92.
  function mixInto(ln, text, en) {
    if (!ln || ln.at !== LP || typeof MIX === 'undefined' || !MIX.ok() || !text || !en) return;
    try {
      const m = MIX.line(text, en, { key: 'librarian:' + en, count: true });
      if (m.full) return;
      ln.parts = m.parts; delete ln.text; ln.len = UI.partsLen(m.parts); ln.en = en; ln.under = false;
    } catch (e) { /* (the line stays whole in the language) */ }
  }
  const options = [];          // (for the talk helper: { label, sub, when?(), run() } added to his menu)
  const person = {
    id: 'librarian', options, say: sayL, lineOf, lineCount,
    get name() { return nmPlain(); }, get nameSrc() { return nm(); }, names: NAME,
    get x() { return LP.x; }, get z() { return LP.z; }, get y() { return Y0; }, get here() { return inside; },
    get rig() { return P; }, talk: () => talk(),
  };

  // ------------------------------------------------------------ in and out (a room: main.js ROOMS, story.js interactables)
  let inside = false, busy = false;
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
    M.x = x + Math.cos(yaw) * 0.95; M.z = z - Math.sin(yaw) * 0.95; M.station = null; M.look = null; M.hop = null; M.wander = null;
    [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3);
    G.sim.snap();
  }
  function outsideSpot() {
    const h = house(); if (!h) return { x: -9.2, z: -160.8, yaw: -HALF };
    const p = h.world(h.dlx, h.front + 1.5); return { x: p.x, z: p.z, yaw: h.yaw };
  }
  async function enter(o = {}) {
    if (!G || inside || busy || !on()) return;
    busy = true;
    try {
      if (!ROOM) buildRoom();
      Sound.play('wood');
      await UI.fade(1, 380);
      inside = true; ROOM.g.visible = true;
      G.w3d.setInterior({ fog: '#2a2018', near: 26, far: 70 });
      const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); G.cam.snap(Math.PI, 0.6, 11);
      await UI.fade(0, 380);
    } catch (e) { console.error('[library] enter', e); }
    busy = false;
    const st = S(); st.visits = (st.visits || 0) + 1;
    if (!st.seen) { st.seen = true; UI.chapter('Alba’s library', READ.plain(pick(PLACE)) + ' · ' + nmPlain()); }
    READ.save();
    if (o.quiet) return;
    if (!st.met) { await STORY.wait(0.6); await meet(); }
    else if (lineCount('back')) await sayL('back', (st.visits || 0) % lineCount('back'));
  }
  async function leave() {
    if (!G || !inside || busy) return;
    busy = true;
    try {
      SPEECH.stop();
      Sound.play('wood');
      await UI.fade(1, 380);
      inside = false; if (ROOM) ROOM.g.visible = false; G.w3d.setInterior(null);
      const o = outsideSpot(); [o.x, o.z] = WORLD.pushOut(o.x, o.z, 0.45); teleport(o.x, o.z, o.yaw); G.cam.snap(o.yaw + Math.PI - 0.9, 0.34, 8.5);
      await UI.fade(0, 380);
    } catch (e) { console.error('[library] leave', e); }
    busy = false;
    READ.save();
  }
  function roomItems() {
    const list = []; if (!inside || busy || !ROOM) return list;
    const A = (p, r, label, run) => list.push({ x: X0 + p.x, z: Z0 + p.z, y: Y0, r, label, run });
    A(SPOT.exit, 1.4, 'Leave', leave);
    A(SPOT.talk, 2.2, 'Talk', talk);
    for (const C of CASES) A({ x: C.x, z: C.z + 1.35 }, 1.5, `Browse ${READ.BAND(C.band)}`, () => browse(C.band));
    if (typeof RADIO !== 'undefined' && RADIO.tune && READ.on('radio')) A({ x: SPOT.radio.x + 1.05, z: SPOT.radio.z + 0.35 }, 1.4, 'Listen', () => RADIO.tune('library'));
    A({ x: SPOT.board.x + 0.75, z: SPOT.board.z }, 1.3, 'Read', () => SIGNS.read(noticeCard()));
    A(SPOT.clockAt, 1.4, 'Look', clockLook);
    A({ x: SPOT.globe.x - 0.7, z: SPOT.globe.z + 0.6 }, 1.1, 'Look', async () => STORY.think('An old globe. Someone drew a tiny star on the valley, and a question mark far up north.', 5));
    return list;
  }
  function noticeCard() {
    const c = READ.content(), n = c && c.librarian && c.librarian.notice;
    const look = { face: '#fffaf0', edge: '#b8895a', ink: INK };
    if (n && n.length) return { tag: 'The notice board', lines: n.map(x => ({ text: x.text, en: x.en, look })) };
    return { tag: 'The notice board', lines: [{ text: pick(MOTTO), en: MOTTO.en, look }, { text: pick(HOURS), en: HOURS.en, look }] };
  }
  async function clockLook() {
    const st = S(), facts = READ.S().facts, c = READ.content(), note = c && c.notes && c.notes.noa;
    if (note && facts.clock && !st.note) {
      Sound.play('wood'); await STORY.wait(0.3);
      STORY.think('You peek behind the old clock… there’s a folded page tucked in the gap. Noa’s handwriting!', 4);
      await STORY.wait(1.2);
      st.note = 'found'; facts['note.noa'] = true; READ.save();
      await readNote('noa');
      if (lineCount('note')) await sayL('note', 0);
      return;
    }
    STORY.think(st.note ? 'Tick… tock. The gap behind the clock is empty now.' : 'A tall old clock. Tick… tock. It’s been keeping time here for a hundred years.', 4);
  }
  async function readNote(id, o = {}) {
    const c = READ.content(), n = c && c.notes && c.notes[id]; if (!n) return null;
    const res = await READER.page(Object.assign({ band: 2 }, n), { diary: true, kind: n.kind || 'A note from Noa' });
    const r = READ.record('talks', 'note.' + id, { t: Date.now() }); if (res && res.grades) r.grades = (r.grades || []).concat(res.grades.filter(Boolean)).slice(-6);
    READ.save();
    return res;
  }
  // the shelves: pick a book of that band
  async function browse(band) {
    const books = READ.list('books').filter(b => (b.band || 1) === band);
    const shelf = SHELF[band] || SHELF[1];
    const b = await READER.shelf(books.map(x => Object.assign(x, { shelf: `${READ.BAND(band)} · ${shelf.en}` })), { kind: 'The shelves', title: `${READ.BAND(band)} · ${READ.plain(shelf[L()] || shelf.en)}`, empty: band >= 3 && !books.length ? 'Empty for now: more books are coming. Ask the librarian!' : undefined });
    if (b) await readBook(b);
  }
  async function readBook(b) {
    const res = await READER.book(b);
    if (inside && res && res.done && res.grades && res.grades.some(Boolean) && lineCount('after')) await sayL('after', Math.floor(Math.random() * lineCount('after')), { title: '«' + READ.plain(b.title) + '»' });
    return res;
  }
  // what he'd recommend: the first unread book, lowest band first (then the one you know most of)
  function recommendation() {
    const all = READ.list('books'); if (!all.length) return null;
    const st = READ.S().books, unread = all.filter(b => !(st[b.id] && st[b.id].done));
    const pool = (unread.length ? unread : all).slice().sort((a, b) => (a.band || 1) - (b.band || 1));
    return pool[0];
  }
  async function meet() {
    const st = S(); st.met = true; READ.save();
    if (P) P.faceAt = null;
    for (let i = 0; i < lineCount('hello'); i++) await sayL('hello', i, { mimo: READ.mimo() });
    await recommend(true);
  }
  async function choose(title, opts) {
    const was = G.sim.lock; G.sim.lock = 1;
    try { return await UI.choose(title, opts); } finally { G.sim.lock = was; }
  }
  async function recommend(first) {
    const b = recommendation(); if (!b) return;
    if (lineCount('rec')) await sayL('rec', first ? 0 : 1, { title: '«' + READ.plain(b.title) + '»' });
    const v = await choose(`${nmPlain()} holds out «${READ.plain(b.title)}» (${READ.BAND(b.band)})`, [{ label: 'Read it now', value: 'read' }, { label: 'Maybe later', value: 'later' }]);
    if (v === 'read') await readBook(b);
  }
  async function talk() {
    if (!S().met) return meet();
    const RAD = typeof RADIO !== 'undefined' && RADIO.tune && READ.on('radio');
    for (let guard = 0; guard < 6; guard++) {
      const st = S(), opts = [{ label: 'Recommend me a book', sub: 'something for my level', value: 'rec' }, { label: 'Browse the shelves', value: 'shelves' }];
      if (lineCount('noa')) opts.push({ label: 'Ask about Noa', value: 'noa' });
      if (lineCount('hush')) opts.push({ label: 'Ask about the Hush', value: 'hush' });
      if (RAD) opts.push({ label: 'Turn on the radio', value: 'radio' });
      // the talk helper (js/talk/): he's a bond, so "Talk freely" joins his menu when it's ready
      if (typeof TALK !== 'undefined' && TALK.offersFor) { try { (TALK.offersFor('librarian') || []).forEach(o => opts.unshift({ label: o.label, sub: o.sub, value: o })); } catch (e) { console.error('[library] TALK.offersFor', e); } }
      for (const o of options) if (!o.when || o.when()) opts.push({ label: o.label, sub: o.sub, value: o });
      const v = await choose(nmPlain(), opts);
      if (!v) return;
      if (v === 'rec') return recommend(false);
      if (v === 'shelves') { const band = await choose('Which shelf?', [1, 2, 3, 4].map(b => ({ label: `${READ.BAND(b)} · ${SHELF[b].en}`, sub: `${READ.list('books').filter(x => x.band === b).length} books`, value: b }))); if (band) return browse(band); continue; }
      if (v === 'noa') { const n = lineCount('noa'), k = (st.noaN || 0) % n; st.noaN = k + 1; await sayL('noa', k); continue; }
      if (v === 'hush') { await sayL('hush', ((st.hushN = (st.hushN || 0) + 1) - 1) % lineCount('hush')); continue; }
      if (v === 'radio') return RADIO.tune('library');
      if (v && v.run) { try { await v.run(); } catch (e) { console.error('[library] option', e); } return; }
    }
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
    if (P) ZHF.animate(P, dt, t, { x: Y.x - X0, z: Y.z - Z0 });
    ROOM.pend.rotation.x = Math.sin(t * 2.6) * 0.18;
    const d = new Date(), hr = (d.getHours() % 12) + d.getMinutes() / 60;
    ROOM.hp.rotation.z = -hr / 12 * Math.PI * 2; ROOM.mp.rotation.z = -d.getMinutes() / 60 * Math.PI * 2;
    ROOM.sprites.forEach((s, i) => { s.material.opacity = 0.4 + 0.05 * Math.sin(t * 3.1 + i * 1.7); });
    if (ROOM_RADIO && ROOM_RADIO.update) ROOM_RADIO.update(dt, t, typeof RADIO !== 'undefined' && RADIO.playingAt === 'library');
    // (a scene that broke off never leaves you frozen)
    if (G.sim.lock && !STORY.busy && !busy && !READER.isOpen && !document.querySelector('#choose:not(.hidden)')) { G.sim.lock = 0; G.cam.override = null; }
  }
  const PROVIDER = {         // story.js STORY.extra: outdoors, "Go in" at the door; the first time you pass by (or after the first bell), the quest
    interactables() {
      if (!G || !OUT || OUT.broken || !G.state.flags.hatched || !on()) return [];
      const D = OUT.doorIn || OUT.door;
      const list = [{ x: D.x, z: D.z, r: 1.7, label: 'Go in', run: enter }];
      if (OUT.crate) list.push({ x: OUT.crate.x, z: OUT.crate.z, r: 1.1, label: 'Look', run: async () => STORY.think('A crate of old books: «Free! Take one, leave one». Most of them are inside, on the shelves.', 4) });
      return list;
    },
    tick(dt, Y) {
      if (!G || !OUT || OUT.broken || !on()) return;
      const st = S(), f = G.state.flags;
      if (st.told || !f.rosa || !OUT.door) return;
      const near = Math.hypot(OUT.door.x - Y.x, OUT.door.z - Y.z) < 14;
      if (near || (f.bells || 0) >= 1) {
        st.told = near ? 'near' : 'bell';
        if (near) STORY.think(`A green sign with an open book: «${READ.plain(pick(PLACE))}». A library! Noa loved books…`, 5);
        READ.save();
      }
    },
  };

  // ------------------------------------------------------------ the quest (QUESTS.LIST): Alba's library
  function quest() {
    const lib = s => (s.read && s.read.lib) || {};
    const door = () => (inside ? { x: X0 + SPOT.talk.x, z: Z0 + SPOT.talk.z } : OUT && !OUT.broken && OUT.door ? OUT.door : null);
    const graded = s => Object.values((s.read && s.read.books) || {}).some(b => b.grades && b.grades.length);
    return {
      id: 'library', kind: 'side',
      get title() { return 'Alba’s library'; },
      get giver() { return 'the chalkboard on the north street'; },
      started: s => !!lib(s).told && on(),
      steps: [
        { text: 'Visit Alba’s library, on the north street off the plaza', why: 'A library! Noa loved books. Maybe someone there knew her.', done: s => !!lib(s).met, target: door, hint: '{mimo} points up the north street: a green sign with an open book.' },
        { text: 'Read a book, then tell {mimo} what happened', why: 'Tap any word you don’t know. After the last page, {mimo} wants the story in your own words.', done: graded, target: () => (inside ? { x: X0 + CASES[0].x, z: Z0 + CASES[0].z + 1.35 } : door()), hint: '{mimo} points at the shelves.' },
      ],
      story: [
        { when: s => !!lib(s).met, get text() { return `Alba’s library is on the north street, off the plaza. The librarian, ${nmPlain()}, says the Hush can’t stand a book read out loud. Noa used to come almost every afternoon.`; } },
        { when: s => !!lib(s).note, text: 'Behind the library’s old clock you found a note from Noa, left for you.' },
      ],
    };
  }

  // ------------------------------------------------------------ the mini-map's mark (minimap.js via READ.mapMarks): an open book on the door
  const MARK = {};
  function mapMarks(dpr) {
    if (!G || !OUT || OUT.broken || !OUT.door || !on()) return [];
    const k = String(dpr);
    if (!MARK[k]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = '#2f5a4a'; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.arc(9, 9, 8, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = '#fffaf0'; c.beginPath(); c.moveTo(9, 6); c.quadraticCurveTo(6.5, 4.6, 3.6, 5.4); c.lineTo(3.6, 12.6); c.quadraticCurveTo(6.5, 11.8, 9, 13.2); c.quadraticCurveTo(11.5, 11.8, 14.4, 12.6); c.lineTo(14.4, 5.4); c.quadraticCurveTo(11.5, 4.6, 9, 6); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = 0.9; c.beginPath(); c.moveTo(9, 6); c.lineTo(9, 13); c.stroke();
      MARK[k] = cv;
    }
    return [{ x: OUT.door.x, z: OUT.door.z, img: MARK[k] }];
  }

  // ------------------------------------------------------------ tests (LIBRARY._.t; the game never calls them)
  const TESTS = (() => {
    const g = () => window.__g;
    const tick = ms => new Promise(r => setTimeout(r, ms));
    function setup(o = {}) {
      const G0 = g().game, f = G0.state.flags;
      Object.assign(f, { hatched: true, guideMet: true, guide: true, escort: false, escorted: true, rosa: true, lessons: 2 }, o.flags || {});
      ['hushwave', 'hush', 'lookout', 'glade', 'exit', 'guide', 'gate', 'pass'].forEach(z => { f['z_' + z] = true; });
      const B = G0.sim.npc('bruno'), Pb = WORLD.L.people.brunoYard; if (B && Pb) { B.x = Pb[0]; B.z = Pb[1]; B.baseYaw = B.yaw = Pb[2]; }
    }
    async function waitFor(fn, sec = 6) { for (let i = 0; i < sec * 10 && !fn(); i++) { await g().go(0.05); await tick(30); } return !!fn(); }
    function door() { return OUT && OUT.door; }
    async function enterNow(o = {}) { STORY.run(() => enter(Object.assign({ quiet: true }, o))); await waitFor(() => inside && !busy, 8); return inside; }
    async function leaveNow() { STORY.run(() => leave()); await waitFor(() => !inside && !busy, 8); return !inside; }
    function frame(name) {
      const D = { door: () => { const d = OUT.door, h = house(); const out = h.world(h.dlx + 2.6, h.front + 5.2); return { pos: [out.x, 3.0, out.z], look: [d.x, 1.8, d.z] }; },
        room: () => ({ pos: [X0 + 0.4, Y0 + 5.4, Z0 + 10.5], look: [X0, Y0 + 1.2, Z0 - 1.8] }), desk: () => ({ pos: [X0 + 1.2, Y0 + 2.3, Z0 + 2.0], look: [X0, Y0 + 1.3, Z0 - 2.6] }),
        shelves: () => ({ pos: [X0 - 0.5, Y0 + 2.6, Z0 + 0.8], look: [X0 - 1.0, Y0 + 2.0, Z0 - HD] }), nook: () => ({ pos: [X0 - 2.2, Y0 + 2.4, Z0 + 4.4], look: [X0 - 5.4, Y0 + 0.8, Z0 + 0.6] }) }[name]();
      G.cam.override = { pos: new THREE.Vector3(...D.pos), look: new THREE.Vector3(...D.look), dur: 0.01 };
    }
    return { setup, waitFor, enterNow, leaveNow, frame, door };
  })();

  // ------------------------------------------------------------ the game side
  function init(game) {
    G = game;
    addIcons();
    if (typeof INTERIORS !== 'undefined' && INTERIORS.claim) INTERIORS.claim(id => id === DOOR_ID && on());
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'library')) QUESTS.LIST.push(quest());
    // free talk (js/talk/): the librarian is a bond person (his conversations come with the talk content: 'librarian.1' …)
    if (typeof TALK !== 'undefined' && TALK.bond) {
      try {
        TALK.bond('librarian', { name: Object.assign({}, NAME, { en: 'the librarian' }), find: () => (inside && P ? LP : null), gate: () => !!S().met && on(), gateText: 'after you meet him in the library',
          look: { skin: '#b97f56', hair: '#e2ddd3', shirt: '#5a7a4a', pants: '#4a4038', glasses: true, mustache: true, old: true }, her: 'him', where: 'Alba’s library, on the north street', ownMenu: true });
      } catch (e) { console.error('[library] TALK.bond', e); }
    }
  }
  return {
    init,
    // as a room (main.js ROOMS; story.js asks the room you're in for its interactables)
    get inside() { return inside; },
    get OUTSIDE() { return inside ? outsideSpot() : null; },
    interactables() { return inside ? roomItems() : []; },
    update(dt, t) { roomUpdate(dt, t); },
    curiosities() { return []; },
    target() { if (!inside) return null; return { x: X0 + SPOT.talk.x, z: Z0 + SPOT.talk.z, hint: `{mimo} points at ${nmPlain()}.` }; },
    get busy() { return busy || READER.isOpen; },
    enter, leave,
    outdoor(dt, t, you) { outdoor(); },
    mapMarks, readNote, readBook, recommendation,
    person, NAME, PLACE, DOOR_ID, ROOM_AT: { x: X0, y: Y0, z: Z0 }, SPOT,
    _: { S, house, outsideSpot, signCard, boardCard, noticeCard, talk, meet, browse, clockLook, sayL, lineOf, quest, buildRoom, get OUT() { return OUT; }, get ROOM() { return ROOM; }, get P() { return P; }, t: TESTS },
  };
})();
