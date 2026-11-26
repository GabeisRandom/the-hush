'use strict';
// Shared pieces for the zh-only side characters (DESIGN.md 14.11): cards.js (Grandpa Chen's 斗地主 table) and newyear.js
// (Longlong, the New Year kid). Both show up in Chinese games only. One global, ZHF:
//  • the CJK.md notation as HTML / plain text (H, P, R), a typed-phrase matcher (says: the phrase's own characters in order,
//    or its pinyin syllable by syllable; tones optional, a wrong one flagged)
//  • phrases in the journal's Phrasebook (LEX items of kind 'phrase', taught to stage 3 and kept out of LEX's review queue)
//  • lines (lines.js's shape) said through STORY.sayInline, always in Chinese with the English under it
//  • a 3D kit (pieces merged into one vertex-colored toon mesh and one ink hull) and a small person rig (seated or standing)
//  • the paper overlay (#zf) and its echo-then-recall lesson card, with the in-game IME
//  • a music bus for the songs these files add (Sound.addSong): one deck into our own gain, the area's music ducked
// Needs THREE (r128), core.js and toonkit.js at load; CJK, LEX, LINES, UI, STORY, Sound at run time.

const ZHF = (() => {
  let G = null;
  const bind = g => { G = g; };
  const L = () => (G && G.state && G.state.lang) || (typeof UI !== 'undefined' && UI.lang) || 'es';
  const on = () => L() === 'zh';
  const cj = () => typeof CJK !== 'undefined';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const H = (src, o) => (cj() ? CJK.html(String(src), Object.assign({ lang: 'zh' }, o || {})) : esc(src));
  const P = (src, o) => (cj() ? CJK.plain(String(src), Object.assign({ lang: 'zh' }, o || {})) : String(src));
  const R = src => (cj() ? CJK.roman(String(src), { lang: 'zh' }) : String(src));
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const tick = ms => new Promise(r => setTimeout(r, ms));
  const wait = s => (typeof STORY !== 'undefined' && STORY.wait ? STORY.wait(s) : tick(s * 1000));
  const sayVoice = src => { try { if (typeof UI !== 'undefined' && UI.speak) UI.speak(src); else if (typeof Sound !== 'undefined') Sound.say(P(src, { mode: 'chars' }), 'zh'); } catch (e) { /* no voice */ } };

  // ============================================================ typed answers
  // does the typed text say this phrase somewhere? Its characters in order (大 is not 打), or its pinyin by syllable;
  // tones optional (a tone typed wrong sets toneBad). o.loose: a character that only sounds the same counts too.
  function says(text, src, o = {}) {
    if (!cj() || !CJK.typed) return { ok: false };
    const { U } = CJK.typed(String(text == null ? '' : text), 'zh'), w = CJK.wordOf(src, 'zh');
    if (!w.syl || !w.syl.length) return { ok: false };
    for (let i = 0; i < U.length; i++) { const m = CJK.matchAt(w, U, i, 'zh', { homo: !!o.loose }); if (m) return { ok: true, toneBad: !!m.toneBad, homo: !!m.homo, i, j: m.j, n: U.length }; }
    return { ok: false };
  }
  // the first of several phrases said (→ its index), or -1
  function saysAny(text, list, o) { for (let i = 0; i < list.length; i++) if (says(text, list[i], o).ok) return i; return -1; }
  const idk = t => /^\s*(\?+|idk|i\s*don.?t\s*know|不知道|bu ?zhi ?dao)\s*$/i.test(String(t || ''));
  // a plain-text hint of a phrase in the current mode: the first character / syllable, the rest as dots
  function hintOf(src, n) {
    const roman = cj() && CJK.mode('zh') === 'roman', s = P(src);
    if (roman) return s.split('').map((c, i) => (/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/i.test(c) && i > 0 && n < 3 && (n < 2 || i % 2) ? '·' : c)).join('');
    return [...s].map((c, i) => (i === 0 || n >= 3 || (n >= 2 && i % 2 === 0) || /[，。！？：；]/.test(c) ? c : '＿')).join('');
  }

  // ============================================================ phrases (the Phrasebook)
  // list: [{ id, zh (notation), en, note, register: 'casual' | 'slang', region, icon }]
  function phrases(list) {
    if (typeof LEX === 'undefined') return;
    LEX.register(list.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', zh: p.zh, en: p.en, note: p.note || '', region: p.region || '', register: p.register || 'casual', icon: p.icon || 'star' })));
  }
  const nowS = () => Date.now() / 1000;
  // into the Phrasebook (stage 3: "known"), its LEX review pushed far off (whoever taught it quizzes you instead)
  function teach(id) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || LEX.lang !== 'zh') return;
    const s = LEX.st(id), t = nowS(); LEX.expose(id);
    if (s.stage < 3) s.stage = 3;
    s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 30 * 86400; s.last = t;
  }
  const taught = id => typeof LEX !== 'undefined' && LEX.lang === 'zh' && !!LEX.item(id) && LEX.st(id).stage >= 2;
  function keepFar(ids) {
    if (typeof LEX === 'undefined' || LEX.lang !== 'zh') return;
    const t = nowS();
    for (const id of ids) { if (!LEX.item(id)) continue; const s = LEX.st(id); if (s.stage >= 2 && s.due < t + 86400) { s.due = t + 30 * 86400; s.str = Math.max(s.str || 0, 30 * 86400); } }
  }

  // ============================================================ lines
  // LT: key → { zh: [notation, richer?], en: [english, richer?] }; registered into LINES (CJK.validateAll checks them there)
  function registerLines(LT) { if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v; }
  function lineOf(LT, key, vars) {
    const v = LT[key]; if (!v) return { zh: '', en: key };
    const tier = typeof LEX !== 'undefined' && LEX.tier ? LEX.tier() : 1, n = Math.max(1, Math.min(tier, v.zh.length)) - 1;
    let zh = v.zh[n], en = v.en[Math.min(n, v.en.length - 1)];
    if (vars) for (const [a, b] of Object.entries(vars)) { zh = zh.split('{' + a + '}').join(b.zh !== undefined ? b.zh : b); en = en.split('{' + a + '}').join(b.en !== undefined ? b.en : b); }
    return { zh, en };
  }
  // one of ours says a line (p: { x, y, z, top, id, nameSrc }): the whole line in Chinese, the English under it
  function say(p, line) {
    if (!p || typeof STORY === 'undefined') return Promise.resolve();
    p.name = P(p.nameSrc || '');
    p.lines = { en: line.en, zh: line.zh };
    return STORY.sayInline(p, true);
  }

  // ============================================================ 3D: pieces → one vertex-colored toon mesh + one ink hull
  const INK = '#2b2235';
  const GEO = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 14), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
    ball: new THREE.SphereGeometry(1, 14, 10), cone: new THREE.ConeGeometry(1, 1, 10), half: new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2),
    tor: new THREE.TorusGeometry(1, 0.16, 6, 20) };
  const GSIZE = new Map([[GEO.box, [1, 1, 1]], [GEO.cyl, [2, 1, 2]], [GEO.cyl8, [2, 1, 2]], [GEO.ball, [2, 2, 2]], [GEO.cone, [2, 1, 2]], [GEO.half, [2, 1, 2]]]);
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
  const M4 = (x, y, z, sx, sy, sz, rx, ry, rz) => new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx || 0, ry || 0, rz || 0)), _s.set(sx, sy, sz));
  function Kit() {
    const P0 = [], H0 = [], GL = [];
    let F = new THREE.Matrix4();
    const k = {
      P: P0, H: H0, GL,
      frame(x, y, z, ry = 0) { F = M4(x, y, z, 1, 1, 1, 0, ry, 0); return k; },
      free() { F = new THREE.Matrix4(); return k; },
      // geo at (x, y, z), scaled, turned; o.ink: the hull's width (0: none); o.glow: unlit (lanterns, sparks)
      add(geo, color, x, y, z, sx, sy, sz, rx, ry, rz, o = {}) {
        sy = sy === undefined ? sx : sy; sz = sz === undefined ? sx : sz;
        (o.glow ? GL : P0).push({ geo, color, m: F.clone().multiply(M4(x, y, z, sx, sy, sz, rx, ry, rz)) });
        const w = o.ink === undefined ? 0.016 : o.ink, g = GSIZE.get(geo);
        if (w > 0 && g && !o.glow) H0.push({ geo, color: INK, m: F.clone().multiply(M4(x, y, z, sx + (2 * w) / g[0], sy + (2 * w) / g[1], sz + (2 * w) / g[2], rx, ry, rz)) });
        return k;
      },
      box(x, y, z, w, h, d, color, o = {}) { return k.add(GEO.box, color, x, y, z, w, h, d, o.rx, o.ry, o.rz, o); },
      cyl(x, y, z, r, h, color, o = {}) { return k.add(o.geo || GEO.cyl, color, x, y, z, r, h, o.rz2 || r, o.rx, o.ry, o.rz, o); },
      ball(x, y, z, rx, ry, rz, color, o = {}) { return k.add(GEO.ball, color, x, y, z, rx, ry, rz, o.ax || 0, o.ay || 0, o.az || 0, o); },
      cone(x, y, z, r, h, color, o = {}) { return k.add(GEO.cone, color, x, y, z, r, h, r, o.rx, o.ry, o.rz, o); },
      // a rod from a to b ([x, y, z]), radius r
      rod(a, b, r, color, o = {}) {
        _d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = _d.length() || 0.001; _d.normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(_up, _d), m = new THREE.Matrix4().compose(_p.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, _s.set(r, len, r));
        (o.glow ? GL : P0).push({ geo: o.geo || GEO.cyl8, color, m: F.clone().multiply(m) });
        const w = o.ink === undefined ? 0.012 : o.ink;
        if (w > 0) H0.push({ geo: o.geo || GEO.cyl8, color: INK, m: F.clone().multiply(new THREE.Matrix4().compose(_p.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, _s.set(r + w, len + w, r + w))) });
        return k;
      },
    };
    return k;
  }
  // the kit → meshes in a group: one toon mesh, its ink hull, the glowing bits
  function bake(group, k, o = {}) {
    const out = {};
    if (k.P.length) { out.mesh = new THREE.Mesh(TK.merge(k.P), TK.toon('#ffffff', { vc: true, rim: 0.22 })); out.mesh.castShadow = !o.noShadow; out.mesh.receiveShadow = true; group.add(out.mesh); }
    if (k.H.length) { out.hull = new THREE.Mesh(TK.merge(k.H), new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })); group.add(out.hull); }
    if (k.GL.length) { out.glow = new THREE.Mesh(TK.merge(k.GL), new THREE.MeshBasicMaterial({ vertexColors: true })); group.add(out.glow); }
    return out;
  }
  const canvasTex = (w, h, draw) => { const t = TK.canvasTex(w, h, draw); t.anisotropy = 4; return t; };
  function plane(w, h, tex, o = {}) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ map: tex, gradientMap: TK.grad, transparent: !!o.alpha, alphaTest: o.alpha ? 0.4 : 0, side: o.double ? THREE.DoubleSide : THREE.FrontSide }));
    m.receiveShadow = true; return m;
  }
  const FONT = '"KaiTi", "STKaiti", "Kaiti SC", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", serif';
  const SANS = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Segoe UI", sans-serif';
  // vertical characters on a board, top to bottom, as big as they fit
  function vtext(c, chars, x, y0, y1, maxW, color, font) {
    const n = [...chars].length, step = (y1 - y0) / n, px = Math.min(maxW, step * 0.86);
    c.font = `700 ${Math.round(px)}px ${font || FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color;
    [...chars].forEach((ch, i) => c.fillText(ch, x, y0 + step * (i + 0.5)));
  }

  // ============================================================ people: a small rig (legs + torso, head, two arms)
  // look: { skin, hair, shirt, pants, shoes, hat: 'flat' | 'beanie' | 'hood' | null, hatCol, kid, bald, glasses, vest, belly, apron }
  // o.sit: seated on a low stool (hips at o.seatY), thighs forward. → { root, body, head, arms: [L, R], look, pose, t, … }
  function person(look, o = {}) {
    const kid = !!look.kid, sit = !!o.sit, W = look.wide || 1;
    const legH = kid ? 0.36 : 0.5, hipY = sit ? (o.seatY || 0.32) : legH, torH = kid ? 0.5 : 0.62, shY = hipY + torH * 0.86, headY = hipY + torH + (kid ? 0.3 : 0.25);
    const root = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group(); root.add(body); head.position.set(0, headY, 0); body.add(head);
    const kb = Kit(), kh = Kit(), pants = look.pants || '#3f4a5a', shoes = look.shoes || '#3a2b26';
    // legs: standing, two posts; seated, thighs forward then shins down to the ground
    for (const s of [-1, 1]) {
      const x = s * 0.12 * W;
      if (sit) { kb.rod([x, hipY, 0], [x, hipY, 0.36], 0.085, pants); kb.rod([x, hipY, 0.36], [x, 0.06, 0.4], 0.075, pants); kb.ball(x, 0.05, 0.47, 0.1, 0.07, 0.14, shoes, { ink: 0.015 }); }
      else { kb.cyl(x, legH / 2 + 0.02, 0, 0.085, legH, pants, { ink: 0.018 }); kb.ball(x, 0.06, 0.05, 0.1, 0.075, 0.14, shoes, { ink: 0.015 }); }
    }
    // the torso (a belly bulge for the grandpas), a vest, a collar
    kb.cyl(0, hipY + torH / 2, 0, 0.27 * W, torH, look.shirt, { ink: 0.022, rz2: 0.24 * W });
    if (look.belly) kb.ball(0, hipY + torH * 0.35, 0.1, 0.24 * W, 0.22, 0.2, look.shirt, { ink: 0.015 });
    if (look.vest) { kb.cyl(0, hipY + torH * 0.55, -0.01, 0.285 * W, torH * 0.82, look.vest, { ink: 0.012, rz2: 0.25 * W }); kb.box(0, hipY + torH * 0.6, 0.235 * W, 0.12, torH * 0.7, 0.03, look.shirt, { ink: 0 }); }
    if (look.apron) kb.box(0, hipY + torH * 0.4, 0.24 * W, 0.36, torH * 0.8, 0.03, look.apron, { ink: 0.008 });
    kb.cyl(0, hipY + torH + 0.01, 0, 0.12, 0.06, look.collar || look.shirt, { ink: 0.01 });
    bake(body, kb);
    // arms: a pivot at each shoulder (rotate it), a sleeve and a hand
    const arms = [-1, 1].map(s => {
      const g = new THREE.Group(); g.position.set(s * 0.3 * W, shY, 0); body.add(g);
      const ka = Kit(), len = kid ? 0.34 : 0.42;
      ka.rod([0, 0, 0], [0, -len, 0], 0.075, look.sleeve || look.shirt); ka.ball(0, -len - 0.04, 0, 0.075, 0.075, 0.075, look.skin, { ink: 0.014 });
      bake(g, ka); g.userData.hand = new THREE.Object3D(); g.userData.hand.position.set(0, -len - 0.05, 0); g.add(g.userData.hand);
      return g;
    });
    // the head: skin, hair (or a bald crown with a fringe), eyes, brows, a mouth, cheeks; glasses and hats
    const hs = kid ? 1.1 : 1, r = 0.25 * hs;
    kh.ball(0, 0, 0, r, r, r * 0.96, look.skin, { ink: 0.024 });
    if (look.bald) { kh.add(GEO.tor, look.hair, 0, -0.02, -0.02, r * 0.98, r * 0.98, r * 0.7, Math.PI / 2 + 0.25, 0, 0, { ink: 0 }); }
    else if (look.hat !== 'hood') kh.add(GEO.half, look.hair, 0, 0.01, -0.02, r * 1.06, r * 1.04, r * 1.02, -0.42, 0, 0, { ink: 0.014 });
    for (const s of [-1, 1]) {
      kh.ball(s * 0.09 * hs, 0.02, r * 0.88, 0.03, 0.045, 0.02, INK, { ink: 0 });
      kh.box(s * 0.09 * hs, 0.085 * hs, r * 0.9, 0.07, 0.016, 0.01, look.brow || look.hair, { ink: 0, rz: s * (look.old ? -0.18 : 0.08) });
      kh.ball(s * 0.15 * hs, -0.06, r * 0.82, 0.045, 0.026, 0.012, '#ff9b9b', { ink: 0 });
    }
    kh.box(0, -0.1 * hs, r * 0.92, 0.07, 0.014, 0.01, INK, { ink: 0 });
    if (look.old) for (const s of [-1, 1]) kh.box(s * 0.11, 0.14, r * 0.86, 0.06, 0.008, 0.008, '#c9a08a', { ink: 0, rz: s * 0.1 });
    if (look.glasses) for (const s of [-1, 1]) kh.add(GEO.tor, '#2b2235', s * 0.09 * hs, 0.02, r * 0.95, 0.06, 0.06, 0.06, 0, 0, 0, { ink: 0 });
    if (look.mustache) for (const s of [-1, 1]) kh.ball(s * 0.05, -0.07, r * 0.93, 0.055, 0.02, 0.02, look.hair, { ink: 0, az: s * 0.3 });
    const hc = look.hatCol || '#5a5f6b';
    if (look.hat === 'flat') { kh.add(GEO.half, hc, 0, 0.06, -0.01, r * 1.1, r * 0.62, r * 1.14, -0.1, 0, 0, { ink: 0.012 }); kh.box(0, 0.075, r * 0.98, 0.3, 0.02, 0.16, hc, { ink: 0.008, rx: 0.12 }); kh.ball(0, 0.2, -0.01, 0.025, 0.02, 0.025, hc, { ink: 0 }); }
    else if (look.hat === 'beanie') { kh.add(GEO.half, hc, 0, 0.05, 0, r * 1.08, r * 1.0, r * 1.08, -0.1, 0, 0, { ink: 0.014 }); kh.cyl(0, 0.07, 0, r * 1.1, 0.06, look.band || hc, { ink: 0 }); }
    else if (look.hat === 'hood') {
      // the kid's dragon hood: red, two gold horns, a green crest, white teeth along the rim
      kh.add(GEO.half, hc, 0, 0.0, -0.03, r * 1.16, r * 1.12, r * 1.14, -0.5, 0, 0, { ink: 0.016 });
      for (const s of [-1, 1]) { kh.cone(s * 0.12, 0.26, -0.05, 0.045, 0.2, '#ffcf3f', { rz: -s * 0.35, rx: -0.3, ink: 0.01 }); }
      for (let i = 0; i < 4; i++) kh.cone(0, 0.22 - i * 0.07, -0.2 - i * 0.04, 0.035, 0.1, '#3fae5a', { rx: -1.2 - i * 0.25, ink: 0.006 });
      for (let i = -3; i <= 3; i++) kh.cone(i * 0.065, 0.2 - Math.abs(i) * 0.02, r * 0.86 - Math.abs(i) * 0.03, 0.022, 0.05, '#fffaf0', { rx: Math.PI, ink: 0 });
    }
    bake(head, kh);
    const p = { root, body, head, arms, look, sit, kid, pose: o.pose || 'idle', t: Math.random() * 9, yaw: 0, baseYaw: 0, talking: false, hidden: false, headY, shY, hipY,
      x: 0, y: 0, z: 0, top: headY + r + 0.55, r: kid ? 0.34 : 0.42 };
    return p;
  }
  // a pose this frame. Arm angles: [forward (rx), out (rz)] each; poses: idle, cards (holding a hand of cards), slam, think,
  // cheer, wave, drum, hold (both forward), point, hands (on the hips), sulk
  const POSE = { idle: [[0.08, 0.12], [0.08, 0.12]], cards: [[1.05, 0.25], [1.05, 0.25]], think: [[0.1, 0.15], [2.3, -0.35]], cheer: [[2.7, 0.45], [2.7, 0.45]],
    hold: [[1.2, 0.1], [1.2, 0.1]], point: [[0.1, 0.15], [1.45, 0.05]], hands: [[0.35, 0.75], [0.35, 0.75]], sulk: [[0.25, 0.05], [0.25, 0.05]], wave: [[0.1, 0.15], [0.3, 2.5]],
    drum: [[1.3, 0.2], [1.3, 0.2]], slam: [[1.05, 0.25], [2.4, 0.1]], pole: [[2.2, 0.2], [2.2, 0.2]] };
  function animate(p, dt, t, you) {
    if (!p || !p.root) return;
    p.t += dt;
    const want = p.faceAt ? Math.atan2(p.faceAt.x - p.x, p.faceAt.z - p.z) : you && !p.noTurn && Math.hypot(you.x - p.x, you.z - p.z) < 5.5 && !p.sit ? Math.atan2(you.x - p.x, you.z - p.z) : p.baseYaw;
    p.yaw = dampAngle(p.yaw, want, 5, dt);
    p.root.position.set(p.x, p.y + (p.hop || 0), p.z); p.root.rotation.y = p.yaw;
    const talk = p.talking ? Math.abs(Math.sin(p.t * 13)) * 0.03 : 0, cheer = p.pose === 'cheer' ? Math.abs(Math.sin(p.t * 7)) * 0.1 : 0;
    p.body.position.y = talk + cheer;
    p.body.rotation.x = (p.pose === 'sulk' ? 0.18 : p.pose === 'cards' || p.pose === 'slam' ? 0.08 : 0) + Math.sin(p.t * 1.3) * 0.012;
    p.body.rotation.z = Math.sin(p.t * 1.1 + p.x) * 0.015;
    let A = POSE[p.pose] || POSE.idle;
    if (p.pose === 'wave') A = [A[0], [0.3, 2.3 + Math.sin(p.t * 9) * 0.35]];
    if (p.pose === 'drum') { const b = Math.abs(Math.sin(p.t * 6)); A = [[1.0 + b * 0.8, 0.2], [1.0 + (1 - b) * 0.8, 0.2]]; }
    if (p.pose === 'slam' && p.slamT > 0) { p.slamT -= dt; const k = p.slamT > 0.18 ? 2.6 : 0.7; A = [A[0], [k, 0.1]]; }
    p.arms.forEach((g, i) => { const [fw, out] = A[i], s = i ? 1 : -1; g.rotation.x = damp(g.rotation.x, -fw, 12, dt); g.rotation.z = damp(g.rotation.z, s * out, 12, dt); });
    const hx = (p.pose === 'sulk' ? 0.35 : p.pose === 'cards' ? 0.25 : 0) + (p.nod > 0 ? Math.sin(p.t * 14) * 0.15 : 0);
    if (p.nod > 0) p.nod -= dt;
    p.head.rotation.x = damp(p.head.rotation.x, hx, 8, dt);
    p.head.rotation.y = damp(p.head.rotation.y, p.headTurn || (p.pose === 'think' ? Math.sin(p.t * 0.7) * 0.25 : 0), 6, dt);
  }

  // ============================================================ the paper overlay (#zf) and the lesson card
  const CSS = `
#zf { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; font-family: "Trebuchet MS", "Segoe UI", system-ui, sans-serif; color: #2b2235; -webkit-font-smoothing: antialiased; }
#zf.hidden, #zf .hidden { display: none !important; }
#zf * { box-sizing: border-box; }
#zf .zf-shade { position: absolute; inset: 0; background: rgba(30,22,40,.42); }
#zf .zf-panel { position: relative; width: min(1120px, calc(100vw - 16px)); max-height: calc(100vh - 16px); background: #fffaf0; border: 3px solid #2b2235; border-radius: 20px;
  box-shadow: 0 0 0 6px #fff, 0 12px 0 5px rgba(43,34,53,.22); overflow: hidden; }
#zf button { font: inherit; font-weight: 800; font-size: 14px; color: #2b2235; background: #fffaf0; border: 2.5px solid #2b2235; border-radius: 12px; padding: 4px 11px; cursor: pointer; box-shadow: 0 3px 0 rgba(43,34,53,.18); }
#zf button:hover { background: #fff3c4; } #zf button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(43,34,53,.18); }
#zf button.go { background: #c8322a; color: #fff; } #zf button.go:hover { background: #db4236; }
#zf kbd { font: 800 11px "Segoe UI", sans-serif; border: 1.5px solid currentColor; border-radius: 5px; padding: 0 4px; margin-left: 3px; }
#zf ruby rt { font-size: 52%; font-weight: 600; opacity: .85; }
#zf .zf-head { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 2px dashed rgba(43,34,53,.2); background: linear-gradient(90deg, #fff1e6, #fffaf0); }
#zf .zf-head b { font: 800 21px Bahnschrift, "Segoe UI", sans-serif; } #zf .zf-head .t { font-weight: 800; opacity: .7; }
#zf .zf-head .dots { margin-left: auto; display: flex; gap: 4px; } #zf .zf-head .dots i { width: 11px; height: 11px; border-radius: 50%; border: 2px solid #c8322a; } #zf .zf-head .dots i.f { background: #c8322a; } #zf .zf-head .dots i.now { box-shadow: 0 0 0 3px #ffd166; }
#zf .zf-lbody { display: grid; grid-template-columns: 230px 1fr; gap: 18px; padding: 18px 24px; overflow: auto; max-height: calc(100vh - 90px); }
#zf .zf-who { display: flex; flex-direction: column; align-items: center; gap: 10px; }
#zf .zf-who canvas { width: 116px; height: 116px; border-radius: 50%; border: 3px solid #2b2235; background: #fff; }
#zf .zf-who .nm { font: 800 15px Bahnschrift, sans-serif; text-align: center; }
#zf .zf-bub { position: relative; background: #fff; border: 2.5px solid #2b2235; border-radius: 16px; padding: 8px 12px; font-size: 17px; font-weight: 700; line-height: 1.5; box-shadow: 0 3px 0 rgba(43,34,53,.15); }
#zf .zf-bub i { display: block; font-size: 12.5px; font-weight: 600; opacity: .7; margin-top: 3px; line-height: 1.35; }
#zf .zf-bub .zf-enb, #zf .zf-card .zf-enb { float: right; font-size: 11px; padding: 0 6px; border-width: 2px; border-radius: 8px; box-shadow: none; margin: 0 0 2px 8px; }
#zf .zf-card .ex .en-x { display: none; } #zf .zf-card .ex.en-on .en-x { display: inline; }
#zf .zf-card { background: #fff; border: 3px solid #2b2235; border-radius: 18px; padding: 14px 20px 16px; box-shadow: 0 5px 0 rgba(43,34,53,.15); display: flex; flex-direction: column; gap: 8px; align-self: start; }
#zf .zf-card.ok { box-shadow: 0 0 0 4px #21a493, 0 5px 0 rgba(43,34,53,.15); }
#zf .zf-card .kind { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #c8322a; }
#zf .zf-card .ph { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
#zf .zf-card .ph b { font: 900 40px ${SANS}; color: #c8322a; line-height: 1.25; }
#zf .zf-card .gl { font-size: 18px; font-weight: 800; } #zf .zf-card .note { font-size: 14px; opacity: .8; line-height: 1.45; }
#zf .zf-card .ex { font-size: 16px; line-height: 1.7; background: #fbf6e7; border-radius: 10px; padding: 6px 12px; } #zf .zf-card .ex i { font-size: 12.5px; opacity: .7; }
#zf .zf-card .sit { font-size: 19px; font-weight: 800; line-height: 1.35; }
#zf .zf-card form { display: flex; gap: 8px; }
#zf .zf-card input, #zf .zf-in { flex: 1; min-width: 0; font: 600 22px ${SANS}; padding: 6px 10px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; }
#zf .zf-card input:focus, #zf .zf-in:focus { box-shadow: 0 0 0 3px rgba(200,50,42,.3); }
#zf .zf-card .hint { font: 800 19px ${SANS}; letter-spacing: .06em; color: #c8322a; min-height: 22px; }
#zf .zf-card .hint.plain { font: 700 14px "Trebuchet MS", sans-serif; letter-spacing: 0; color: #2b2235; opacity: .75; }
#zf .zf-card .row { display: flex; gap: 8px; align-items: center; font-size: 12px; font-weight: 700; flex-wrap: wrap; } #zf .zf-card .row span { opacity: .6; }
#zf .shake { animation: zf-shake .35s; } @keyframes zf-shake { 20% { transform: translateX(-8px); } 45% { transform: translateX(7px); } 70% { transform: translateX(-4px); } }
#zf .zf-badge { display: inline-block; font: 900 15px Bahnschrift, sans-serif; color: #fff; background: #c8322a; border: 2.5px solid #2b2235; border-radius: 99px; padding: 1px 12px; transform: rotate(-3deg); }
#zf .zf-badge.S { background: #e0a020; } #zf .zf-badge.A { background: #21a493; } #zf .zf-badge.B { background: #3f7fc9; } #zf .zf-badge.C { background: #8a5ab0; } #zf .zf-badge.D { background: #8a8f9e; }
body.zf-open #objective, body.zf-open #counters, body.zf-open #help, body.zf-open #compass, body.zf-open #minimap, body.zf-open .bubble, body.zf-open #thought, body.zf-open .prompt { display: none !important; }
@media (max-width: 860px) { #zf .zf-lbody { grid-template-columns: 1fr; } #zf .zf-who { flex-direction: row; } }
`;
  const OV = { root: null, open: false, keys: null, extraCSS: {} };
  function css(id, text) { if (document.getElementById(id)) return; const s = document.createElement('style'); s.id = id; s.textContent = text; document.head.appendChild(s); }
  function ensure() {
    if (OV.root) return OV.root;
    css('zf-css', CSS);
    const root = document.createElement('div'); root.id = 'zf'; root.className = 'hidden';
    root.innerHTML = '<div class="zf-shade"></div><div class="zf-panel"></div>';
    document.body.appendChild(root);
    OV.root = root; OV.panel = root.querySelector('.zf-panel');
    return root;
  }
  // open the overlay with this HTML in its panel; onKey(e) gets every keydown first (capture). The world waits meanwhile.
  function open(html, onKey, cls) {
    ensure();
    OV.panel.className = 'zf-panel ' + (cls || ''); OV.panel.innerHTML = html;
    OV.root.classList.remove('hidden'); document.body.classList.add('zf-open');
    if (OV.keys) removeEventListener('keydown', OV.keys, true);
    OV.keys = e => { if (e.isComposing || e.keyCode === 229) return; if (onKey) onKey(e); };
    addEventListener('keydown', OV.keys, true);
    OV.open = true; Input.typing = true;
    if (G) { G.state.teaching = true; G.prompt = null; }
    return OV.panel;
  }
  function close() {
    if (!OV.root) return;
    OV.root.classList.add('hidden'); document.body.classList.remove('zf-open');
    if (OV.keys) { removeEventListener('keydown', OV.keys, true); OV.keys = null; }
    OV.open = false; Input.typing = false;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (G) G.state.teaching = false;
  }
  const ime = el => { try { if (cj() && CJK.attachIME && el && !el._ime) { CJK.attachIME(el); el._ime = true; } } catch (e) { /* no IME */ } };
  // A teacher's line in their bubble, by the weave like every line (DESIGN.md 17.3): mixed (the English with the words you know
  // in Chinese), whole in Chinese as the weave rises; its English only on request (EN on the bubble), never under it by default.
  // (No Chinese: an instruction, its English as it is. show: how the line is drawn when it's whole, H for zh, the ja panels' own.)
  function sayBub(el, zh, en, input, show = H) {
    if (!el) return;
    if (!zh) { el.innerHTML = en ? `<i>${esc(en)}</i>` : ''; return; }
    let html = show(zh);
    try { if (en && typeof STORY !== 'undefined' && STORY.mixHTML) html = STORY.mixHTML(zh, en, { key: 'zhf:' + en }).html; } catch (e) { /* (as written) */ }
    el.innerHTML = (en ? '<button type="button" class="zf-enb" title="This line in English">EN</button>' : '') + html + (en ? `<i class="hidden">${esc(en)}</i>` : '');
    const b = el.querySelector('.zf-enb'), tr = el.querySelector('i');
    if (b) b.onclick = e => { e.stopPropagation(); tr.classList.toggle('hidden'); if (input) input.focus(); };
  }
  function face(cv, icon) { try { if (cv && typeof ICONS !== 'undefined') ICONS.draw(cv, icon); } catch (e) { /* no icon */ } }

  // A lesson: each item copied (echo: shown with its reading, its meaning, a note, an example), then all of them said from
  // memory (recall: a situation; Tab a hint, ? shows it). o: { title, sub, who: { nameSrc, icon }, intro: { zh, en },
  // items: [{ id?, zh, en, note, ex: [[zh, en]…], sit, alts: [zh…] }], recall: true, outro: { zh, en } }
  // → { done: true, clean: [bool per item] } or { quit: true }. Test hook: LES.cur ({ answer, submit(text), idk(), quit() }).
  const LES = { cur: null, fast: false };
  async function lesson(o) {
    const items = o.items, total = items.length * (o.recall === false ? 1 : 2);
    const html = `<div class="zf-head"><b>${esc(o.title)}</b><span class="t">${esc(o.sub || '')}</span><span class="dots"></span><button type="button" class="stop">Stop <kbd>Esc</kbd></button></div>
<div class="zf-lbody"><div class="zf-who"><canvas width="116" height="116"></canvas><div class="nm"></div><div class="zf-bub"></div></div>
<div class="zf-card"><div class="kind"></div><div class="ph"><b></b><button type="button" class="hear" title="Hear it">🔊</button></div><div class="gl"></div><div class="note"></div><div class="ex"></div><div class="sit"></div>
<form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Say it</button></form><div class="hint"></div>
<div class="row"><button type="button" class="idk">I don’t know (?)</button><span>Tab: a hint · Esc: stop</span></div></div></div>`;
    let quit = false, curFn = null;
    const panel = open(html, e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); quit = true; if (curFn) curFn('quit'); }
      else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); if (LES.cur && LES.cur.hint) LES.cur.hint(); }
    }, 'zf-les');
    const q = s => panel.querySelector(s);
    const E = { dots: q('.dots'), say: q('.zf-bub'), nm: q('.zf-who .nm'), card: q('.zf-card'), kind: q('.kind'), ph: q('.ph'), phB: q('.ph b'), hear: q('.hear'), gl: q('.gl'), note: q('.note'), ex: q('.ex'), sit: q('.sit'), form: q('form'), input: q('input'), hint: q('.hint'), idk: q('.idk'), stop: q('.stop') };
    face(q('.zf-who canvas'), o.who.icon); E.nm.innerHTML = H(o.who.nameSrc);
    ime(E.input);
    const teacher = (zh, en) => sayBub(E.say, zh, en, E.input);
    E.stop.onclick = () => { quit = true; if (curFn) curFn('quit'); };
    if (o.intro) teacher(o.intro.zh, o.intro.en);
    const card = (it, i, mode) => new Promise(res => {
      let hints = 0, shown = mode === 'echo', idkUsed = false, done = false;
      curFn = r => { if (done) return; done = true; LES.cur = null; res(r); };
      E.dots.innerHTML = Array.from({ length: total }, (_, k) => `<i class="${k < i ? 'f' : ''} ${k === i ? 'now' : ''}"></i>`).join('');
      E.card.classList.remove('ok');
      E.kind.textContent = mode === 'echo' ? 'New · type it to learn it' : 'From memory · what do you say?';
      E.phB.innerHTML = H(it.zh, { ruby: 'always' }); E.ph.classList.toggle('hidden', !shown);
      E.gl.textContent = mode === 'echo' ? `“${it.en}”` : ''; E.gl.classList.toggle('hidden', mode !== 'echo');
      E.note.textContent = mode === 'echo' ? (it.note || '') : ''; E.note.classList.toggle('hidden', mode !== 'echo' || !it.note);
      // (an example sentence: in Chinese, its English on request, EN: never under it by default, DESIGN.md 17.3)
      E.ex.innerHTML = mode === 'echo' && it.ex ? '<button type="button" class="zf-enb" title="The examples in English">EN</button>' + it.ex.map(([z, e]) => `${H(z)} <i class="en-x">${esc(e)}</i>`).join('<br>') : ''; E.ex.classList.toggle('hidden', mode !== 'echo' || !it.ex);
      E.ex.classList.remove('en-on'); { const b = E.ex.querySelector('.zf-enb'); if (b) b.onclick = e => { e.stopPropagation(); E.ex.classList.toggle('en-on'); E.input.focus(); }; }
      E.sit.textContent = mode === 'recall' ? (it.sit || it.en) : ''; E.sit.classList.toggle('hidden', mode !== 'recall');
      E.idk.classList.toggle('hidden', mode === 'echo');
      E.input.value = ''; E.input.placeholder = mode === 'echo' ? P(it.zh) : 'say it in Chinese…';
      const showHint = () => { E.hint.className = 'hint' + (hints ? '' : ' plain'); E.hint.textContent = hints ? hintOf(it.zh, hints) : (mode === 'echo' ? 'Type it just like that (pinyin or characters; tones are optional)' : 'Tab: a hint · ?: show me'); };
      showHint();
      if (mode === 'echo') setTimeout(() => sayVoice(it.zh), 150);
      E.hear.onclick = () => { sayVoice(it.zh); E.input.focus(); };
      setTimeout(() => E.input.focus(), 40);
      const ok = (res2) => {
        E.card.classList.add('ok'); try { Sound.play(mode === 'echo' ? 'learned' : 'review'); } catch (e) { /* */ }
        E.ph.classList.remove('hidden'); E.hint.className = 'hint plain';
        E.hint.textContent = '✓ ' + P(it.zh) + '  ·  ' + it.en + (res2.toneBad ? '  (check the tones: ' + R(it.zh) + ')' : '');
        try { CJK.used(E.input.value, it.zh, { lang: 'zh' }); } catch (e) { /* */ }
        E.input.blur();
        const fin = () => curFn && curFn({ ok: true, hints, idk: idkUsed });
        if (LES.fast) fin(); else setTimeout(fin, 1100);
      };
      const submit = text => {
        const t = String(text || '').trim(); if (!t || done) return;
        if (mode === 'recall' && !shown && idk(t)) { LES.cur.idk(); return; }
        const r = says(t, it.zh); let alt = r;
        if (!r.ok && it.alts) for (const a of it.alts) { alt = says(t, a); if (alt.ok) break; }
        if (r.ok || alt.ok) { ok(r.ok ? r : alt); return; }
        try { Sound.play('wrong'); } catch (e) { /* */ }
        E.card.classList.remove('shake'); void E.card.offsetWidth; E.card.classList.add('shake');
        const other = o.items.find(x => x !== it && says(t, x.zh).ok);
        if (other) { E.hint.className = 'hint plain'; E.hint.textContent = `That’s «${P(other.zh)}» (${other.en}). Try again!`; }
        else if (mode === 'echo' || shown) { E.hint.className = 'hint plain'; E.hint.textContent = `Not quite: copy «${P(it.zh)}» (${R(it.zh)})`; }
        else { hints = Math.min(3, hints + 1); showHint(); }
        E.input.select();
      };
      LES.cur = { answer: P(it.zh, { mode: 'chars' }), roman: R(it.zh), mode, submit,
        idk() { if (shown) return; shown = true; idkUsed = true; hints = 3; E.ph.classList.remove('hidden'); E.gl.textContent = `“${it.en}”`; E.gl.classList.remove('hidden'); E.input.value = ''; E.input.placeholder = P(it.zh); E.hint.className = 'hint plain'; E.hint.textContent = 'Here it is! Type it.'; sayVoice(it.zh); E.input.focus(); },
        hint() { if (shown) return; hints = Math.min(3, hints + 1); showHint(); E.input.focus(); }, quit() { quit = true; curFn && curFn('quit'); } };
      E.form.onsubmit = e => { e.preventDefault(); submit(E.input.value); };
      E.idk.onclick = () => LES.cur && LES.cur.idk();
    });
    const clean = [];
    try {
      for (let i = 0; i < items.length && !quit; i++) {
        if (i > 0 && items[i].say) teacher(items[i].say[0], items[i].say[1]);
        const r = await card(items[i], i, 'echo'); if (r === 'quit' || quit) return { quit: true };
      }
      if (o.recall !== false) {
        teacher(o.recallLine ? o.recallLine.zh : '[现在|xiàn zài] ， [不|bù] [看|kàn] 。', o.recallLine ? o.recallLine.en : 'Now, without looking.');
        const order = shuffle(items.map((_, i) => i));
        for (let k = 0; k < order.length && !quit; k++) {
          const r = await card(items[order[k]], items.length + k, 'recall'); if (r === 'quit' || quit) return { quit: true };
          clean[order[k]] = !r.hints && !r.idk;
          teacher(...(clean[order[k]] ? pick([['[对|duì] ！', 'Right!'], ['[很|hěn] [好|hǎo] ！', 'Very good!'], ['[厉害|lì hai] ！', 'Impressive!']]) : [['[没|méi] [关系|guān xi] ， [再|zài] [练|liàn] [练|liàn] 。', 'That’s OK, we’ll practice it again.']]));
        }
      }
      for (const it of items) if (it.id) teach(it.id);
      if (o.outro) { teacher(o.outro.zh, o.outro.en); E.kind.textContent = 'Lesson done!'; E.ph.classList.remove('hidden'); E.phB.innerHTML = items.map(it => H(it.zh)).join(' · '); E.gl.classList.add('hidden'); E.note.classList.remove('hidden'); E.note.textContent = 'They’re in your journal’s Phrasebook now.'; [E.ex, E.sit, E.idk].forEach(x => x.classList.add('hidden')); E.hint.className = 'hint plain'; E.hint.textContent = 'Enter: carry on'; E.card.classList.add('ok'); try { Sound.play('chest'); } catch (e) { /* */ }
        if (!LES.fast) await new Promise(res => { E.input.value = ''; E.input.placeholder = '(Enter)'; E.form.onsubmit = e => { e.preventDefault(); res(); }; LES.cur = { submit: () => res(), quit: () => res() }; curFn = () => res(); setTimeout(() => E.input.focus(), 40); });
      }
      return { done: true, clean };
    } finally { LES.cur = null; close(); }
  }

  // ============================================================ a drill: a panel of steps, each a row of tiles and a typed answer
  // steps: [{ kind, tiles: [html], say: [zh, en], gl (html), answer (notation) + alts, or check(text) → { ok, tone, said }, help,
  //   placeholder, after (html, on success), miss (html) }]; o: { title, sub, who: { nameSrc, icon } } → { done, clean } or { quit }.
  // Tests: DRILL.cur ({ answer, roman, submit(text), idk(), hint() }).
  const DRILL = { cur: null };
  async function drill(steps, o) {
    const html = `<div class="zf-head"><b>${esc(o.title)}</b><span class="t">${esc(o.sub || '')}</span><span class="dots"></span><button type="button" class="stop">Stop <kbd>Esc</kbd></button></div>
<div class="zf-lbody"><div class="zf-who"><canvas width="116" height="116"></canvas><div class="nm"></div><div class="zf-bub"></div></div>
<div class="zf-card"><div class="kind"></div><div class="tiles" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;padding:6px 0 2px"></div><div class="gl"></div>
<form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Say it</button></form><div class="hint"></div>
<div class="row"><button type="button" class="idk">I don’t know (?)</button><span>Tab: a hint · Esc: stop</span></div></div></div>`;
    let quit = false, cur = null;
    const panel = open(html, e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); quit = true; cur && cur('quit'); } else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); DRILL.cur && DRILL.cur.hint(); } }, 'zf-drill');
    const q = s => panel.querySelector(s), E = { dots: q('.dots'), bub: q('.zf-bub'), card: q('.zf-card'), kind: q('.kind'), tiles: q('.tiles'), gl: q('.gl'), form: q('form'), input: q('input'), hint: q('.hint'), idk: q('.idk') };
    face(q('.zf-who canvas'), o.who.icon); q('.zf-who .nm').innerHTML = H(o.who.nameSrc); ime(E.input);
    q('.stop').onclick = () => { quit = true; cur && cur('quit'); };
    const clean = [];
    try {
      for (let i = 0; i < steps.length && !quit; i++) {
        const s = steps[i];
        E.dots.innerHTML = steps.map((_, k) => `<i class="${k < i ? 'f' : ''} ${k === i ? 'now' : ''}"></i>`).join('');
        if (s.say) sayBub(E.bub, s.say[0], s.say[1], E.input);          // (by the weave, its English on request)
        E.kind.textContent = s.kind || ''; E.card.classList.remove('ok'); E.tiles.innerHTML = (s.tiles || []).join(''); E.gl.innerHTML = s.gl || '';
        E.input.value = ''; E.input.placeholder = s.placeholder || 'say it in Chinese…'; E.hint.className = 'hint plain'; E.hint.innerHTML = s.help || '';
        if (s.voice) setTimeout(() => sayVoice(s.voice), 200);
        setTimeout(() => E.input.focus(), 40);
        let tries = 0, shownAns = false;
        const ans = s.answer || '';
        const r = await new Promise(res => {
          cur = v => { cur = null; DRILL.cur = null; res(v); };
          const check = text => {
            const t = String(text || '').trim(); if (!t) return;
            if (!shownAns && idk(t) && ans) { DRILL.cur.idk(); return; }
            let ok = false, tone = false, said = ans;
            if (s.check) { const c = s.check(t) || {}; ok = !!c.ok; tone = !!c.tone; said = c.said || ans; if (!ok && c.why) { E.hint.className = 'hint'; E.hint.innerHTML = c.why; } }
            else { const list = [ans].concat(s.alts || []), m = saysAny(t, list); ok = m >= 0; if (ok) { said = list[m]; tone = says(t, said).toneBad; } }
            if (ok) {
              E.card.classList.add('ok'); try { Sound.play('review'); if (said) CJK.used(t, said, { lang: 'zh' }); } catch (e) { /* */ }
              E.hint.className = 'hint plain'; E.hint.innerHTML = '✓ ' + (said ? H(said) : '') + (tone ? ' · tones: ' + esc(R(said)) : '') + (s.after ? ' · ' + s.after : '');
              const fin = () => cur && cur({ ok: true, clean: !tries && !shownAns, text: t }); if (LES.fast) fin(); else setTimeout(fin, 1100); return;
            }
            tries++; try { Sound.play('wrong'); } catch (e) { /* */ }
            E.card.classList.remove('shake'); void E.card.offsetWidth; E.card.classList.add('shake');
            if (!(s.check && E.hint.className === 'hint')) { E.hint.className = 'hint'; E.hint.innerHTML = ans && (tries >= 2 || shownAns) ? 'It’s ' + H(ans, { ruby: 'always' }) + ' (' + esc(R(ans)) + ')' : (s.miss || 'Not quite. Try again! (Tab: a hint)'); }
            E.input.select();
          };
          DRILL.cur = { answer: ans ? P(ans, { mode: 'chars' }) : (s.testAnswer || ''), roman: ans ? R(ans) : (s.testAnswer || ''), submit: check,
            idk() { if (!ans) return; shownAns = true; E.hint.className = 'hint'; E.hint.innerHTML = 'Here: ' + H(ans, { ruby: 'always' }) + '. Type it!'; sayVoice(ans); E.input.focus(); },
            hint() { if (!ans) return; E.hint.className = 'hint'; E.hint.innerHTML = esc(hintOf(ans, 2)); } };
          E.form.onsubmit = e => { e.preventDefault(); check(E.input.value); };
          E.idk.onclick = () => DRILL.cur && DRILL.cur.idk();
        });
        if (r === 'quit' || quit) return { quit: true };
        clean.push(r.clean); if (s.then) s.then(r);
      }
      return { done: true, clean };
    } finally { DRILL.cur = null; close(); }
  }

  // ============================================================ a typed question (a quick output check, outside the overlay)
  // UI.command with a model sentence ("I don't know" shows it); → { text, ok, r } or null (Esc)
  async function ask(o) {
    if (typeof UI === 'undefined') return null;
    const inp = document.getElementById('command-input'); if (inp) { inp.dataset.model = o.model ? P(o.model, { mode: 'chars' }) : ''; inp.dataset.roman = o.model ? R(o.model) : ''; }      // (for tests: drive())
    const r = await UI.command({ name: G ? G.state.mimoName : 'Mimo', icon: o.icon || 'star', title: o.title, verbs: [], hint: o.hint || '', placeholder: o.placeholder || 'say it in Chinese…', model: o.model, modelEn: o.modelEn });
    if (!r || r.cancelled) return null;
    return r;
  }

  // ============================================================ music: our songs (Sound.addSong) on one deck, our own bus
  // Each module asks every frame: want(owner, name, level, { cut, duck }); the loudest request plays (a level of 0 lets go).
  const MU = { req: {}, deck: null, name: null, bus: null, lastT: -1 };
  const audioOK = () => typeof Sound !== 'undefined' && !!Sound.ctx && Sound.ctx.state === 'running' && !!Sound.out && !!Sound.deck;
  function bus() {
    const ac = Sound.ctx;
    if (MU.bus && MU.bus.ac === ac) return MU.bus;
    const inp = ac.createGain(), lp = ac.createBiquadFilter(), vol = ac.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 16000; lp.Q.value = 0.7; vol.gain.value = 0;
    inp.connect(lp); lp.connect(vol); vol.connect(Sound.out);
    return (MU.bus = { ac, inp, lp, vol });
  }
  function want(owner, name, level, o = {}) { MU.req[owner] = { name, level: level || 0, cut: o.cut || 16000, duck: o.duck === undefined ? 1 - Math.min(1, (level || 0) * 2.4) : o.duck }; }
  function stopDeck(now) { if (!MU.deck) return; const d = MU.deck; MU.deck = null; MU.name = null; if (MU.bus && audioOK()) { const ac = Sound.ctx; MU.bus.vol.gain.cancelScheduledValues(ac.currentTime); MU.bus.vol.gain.setTargetAtTime(0, ac.currentTime, now ? 0.03 : 0.3); } setTimeout(() => d.stop(), now ? 80 : 1200); }
  // once per frame (both modules call it; the second call in a frame does nothing)
  function frame(t) {
    if (t === MU.lastT) return; MU.lastT = t;
    let best = null; for (const k of Object.keys(MU.req)) { const r = MU.req[k]; if (r.level > 0.001 && (!best || r.level > best.level)) best = r; }
    if (!audioOK()) return;
    if (!best || Sound.music === false) { if (MU.deck) stopDeck(); try { Sound.duck('zhf', 1); } catch (e) { /* */ } return; }
    const B = bus(), ac = Sound.ctx;
    if (MU.name !== best.name) { stopDeck(true); if ((Sound.songs || []).includes(best.name)) { MU.deck = Sound.deck(best.name, B.inp, { at: ac.currentTime + 0.12, from: 0 }); MU.name = best.name; } }
    B.vol.gain.setTargetAtTime(MU.deck ? best.level : 0, ac.currentTime, 0.15);
    B.lp.frequency.setTargetAtTime(best.cut, ac.currentTime, 0.2);
    try { Sound.duck('zhf', best.duck, 0.5); } catch (e) { /* */ }
  }

  // ============================================================ checks: every notation string we have (CJK.validate)
  function check(where, x, out = []) {
    if (!cj()) return out;
    if (typeof x === 'string') { if (/\[[^\]]*\|/.test(x) || /[，。！？]/.test(x)) { const p = CJK.validate(x, 'zh'); if (p.length) out.push({ where, src: x, problems: p }); } }
    else if (Array.isArray(x)) x.forEach((v, i) => check(`${where}[${i}]`, v, out));
    else if (x && typeof x === 'object') for (const k of Object.keys(x)) if (!/^(en|es|pt|de|ja|note|sit|title|sub|icon|id|register|region)$/.test(k)) check(`${where}.${k}`, x[k], out);
    return out;
  }

  // ============================================================ tests: play on through a scene (the game never calls this)
  // Lines (E), menus (o.choose: which button, or a function of the menu's text), lessons (right answers), typed questions
  // (o.say(title) → what to type; else the model), cards (E), and o.panel() for a module's own panel (→ a log string or null).
  // Stops when no scene runs, or after o.sec seconds (call it again to carry on).
  async function drive(o = {}) {
    const g = window.__g, log = [], t0 = performance.now(), $q = s => document.querySelector(s);
    while (performance.now() - t0 < (o.sec || 25) * 1000) {
      if (LES.cur && LES.cur.submit) { const a = o.wrong ? 'xx' : ((o.roman ? LES.cur.roman : LES.cur.answer) || LES.cur.answer || ''); log.push('lesson: ' + a); LES.cur.submit(a); await g.go(0.05); continue; }
      if (DRILL.cur && DRILL.cur.submit) { const a = (o.roman ? DRILL.cur.roman : DRILL.cur.answer) || DRILL.cur.answer || ''; log.push('drill: ' + a); DRILL.cur.submit(a); await g.go(0.05); continue; }
      const pl = o.panel && o.panel(); if (pl) { log.push(pl); await g.go(0.05); continue; }
      const ch = $q('#choose:not(.hidden)');
      if (ch) { const bs = [...ch.querySelectorAll('button')], txt = ch.textContent; const i = typeof o.choose === 'function' ? o.choose(txt, bs.map(b => b.textContent)) : (o.choose || 0); log.push('choose: ' + (bs[i] ? bs[i].textContent.slice(0, 40) : '?')); (bs[i] || bs[0]).click(); await g.go(0.1); continue; }
      const cmd = $q('#command:not(.hidden)');
      if (cmd) { const title = ($q('#command-title') || {}).textContent || '', inp = $q('#command-input'); const ans = (o.say && o.say(title)) || (inp && (o.roman ? inp.dataset.roman : inp.dataset.model)) || ''; log.push('say: ' + title.slice(0, 40) + ' → ' + ans); if (inp) { inp.value = ans; $q('#command-form').requestSubmit(); } await g.go(0.1); continue; }
      const card = $q('#card:not(.hidden)');
      if (card && card.textContent.trim()) { log.push('card: ' + card.textContent.replace(/\s+/g, ' ').slice(0, 40)); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true, cancelable: true })); await g.go(0.1); await tick(120); continue; }
      if (typeof STORY !== 'undefined' && STORY.line) { log.push((STORY.line.name || STORY.line.who || '') + ': ' + String(STORY.line.text || (STORY.line.parts || []).map(p => p.s).join('')).slice(0, 46)); if (STORY.line.full) await g.press(); else await g.go(0.25); continue; }
      if (typeof STORY !== 'undefined' && !STORY.busy && !OV.open && !(o.busy && o.busy())) break;
      await g.go(o.step || 0.15); await null;      // (game time only: a hidden tab runs real timers once a second)
    }
    return log;
  }
  // (UI.command's "I don't know" model, so drive() can answer with it)
  const _ask = ask;

  return { bind, on, L, esc, H, P, R, rnd, pick, shuffle, tick, wait, sayVoice, says, saysAny, idk, hintOf, drive,
    phrases, teach, taught, keepFar, registerLines, lineOf, say,
    INK, GEO, Kit, bake, canvasTex, plane, vtext, FONT, SANS, person, animate, POSE,
    css, open, close, ime, face, sayBub, lesson, LES, drill, DRILL, ask, get overlayOpen() { return OV.open; },
    music: { want, frame, stop: stopDeck, audioOK, get name() { return MU.name; } }, check };
})();
