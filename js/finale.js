'use strict';
// Chapter 4's finale, «Toda voz cuenta» (DESIGN.md 18.5, 21.9; the T4d proposal): the climb, the top of the Old Tower, the seam for
// a boss, the clock set to eight, and (finale_stage.js) the old theater's stage in all three times at once.
//   finale.js         FIN: the main quest's last steps (CH4.FINALE), the tower's door, the rise (the fall's mirror: a screen of its own),
//                     the top with no fight (three of his words given back, each in its own time), the gray lifting off him (its own beat,
//                     FIN.beats.grayLifts), Noa freed, FIN.bossSlot(next) (the seam: a boss can hook in there), the clock at eight, the
//                     shared kit (people, the grader, the ask box), Elio, his dad and Noa in Alba afterwards, the journal's «Elio's speech»
//                     page, the song, tests
//   finale_text.js    FINTXT: every line and task (+ finale_text_pt/de/zh/ja.js)
//   finale_stage.js   FINSTAGE: the three-times stage (a room at y 300), the speech, the laugh, the aftermath
//   finale_credits.js FINCRED: the lanterns and the program;  finale_music.js: five songs
// State: state.ch4.fin = { top, gifts: { g1: 'S' … }, boss (a boss helper's), clock, act, bridges: { b1: 'S' … }, lines: { g1: text … },
// speech, letter, credits }. Flags: flags.towerHealed (the tear in the tower's door is sealed; oldtower.js reads it).
// Hooks for a boss helper: FIN.bossSlot = async next => { …; return next(); }, FIN.bossDone = s => …, CH4.FINALE (insert a step after
// the one with fin: 'top'), FIN.beats.grayLifts (the top's last beat).
const FIN = (() => {
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  let G = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const lang = () => (G && G.state && G.state.lang) || 'es';
  const isCl = l => l === 'zh' || l === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const wait = s => STORY.wait(s);
  const tween = (s, fn) => STORY.tween(s, fn);
  const plainT = (s, l = lang()) => (isCl(l) && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: l }) : String(s || ''));
  const tHTML = (t, l = lang()) => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(String(t || ''), { lang: l }) : esc(t));
  const mimoName = () => (G && G.state && G.state.mimoName) || 'Mimo';
  const fillMimo = (t, l = lang()) => String(t || '').replace(/\{mimo\}/g, isCl(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName());
  const down = (letter, n) => 'SABCD'[Math.max(0, Math.min(4, 'SABCD'.indexOf(letter) + n))];
  const lock = on => { if (!G) return; G.sim.lock = on ? 1 : 0; if (!on) G.cam.override = null; };
  const shot = (pos, look, dur = 0.9) => { G.cam.override = { pos, look, dur }; };
  const X = () => FINTXT;
  const pick = (T, l = lang()) => (T ? T[l] || T.es || T.en || '' : '');
  const nameOf = (k, l = lang()) => { const T = X().CAST[k]; return T ? plainT(pick(T, l), l) : k; };

  // ------------------------------------------------------------ the save's part
  function st() { const s = G.state, c = s.ch4 || (s.ch4 = { echoes: {}, at: {} }); return c.fin || (c.fin = {}); }
  const finOf = s => (s && s.ch4 && s.ch4.fin) || {};
  const echoIn = (s, k) => !!(s && s.ch4 && s.ch4.echoes && s.ch4.echoes[k]);
  // the last report: the Gray Marsh's Future, told to Noa (time_marsh.js); then the climb
  const marshReported = s => !!(s && s.worlds && s.worlds.r && s.worlds.r.marsh && s.worlds.r.marsh.future && s.worlds.r.marsh.future.reported);
  const ready = s => echoIn(s, 'marsh.future') && marshReported(s);
  // a boss between the top and the stage can hold the stage back (its helper sets FIN.bossDone)
  const stageOpen = s => !!finOf(s).top && (!api.bossDone || !!api.bossDone(s));
  const done = s => !!finOf(s).speech;

  // ------------------------------------------------------------ a toon kit (past.js's, with a placement and a tint): people one by
  // one, or a whole seated crowd merged into one mesh and one ink hull
  const INK = '#2b2235';
  let VCM = null, HULLM = null;
  const mats = () => { if (!VCM) { VCM = TK.toon('#ffffff', { vc: 1, rim: 0.2 }); HULLM = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }); } return { VCM, HULLM }; };
  const lathe = (pts, n = 14) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
  const KG = { box: TK.G.box, sphere: new THREE.SphereGeometry(1, 12, 9), ball6: new THREE.SphereGeometry(1, 8, 6), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
    cone: new THREE.ConeGeometry(1, 1, 10), half: new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), torus: new THREE.TorusGeometry(1, 0.22, 6, 16),
    body: lathe([[0, 0], [0.38, 0.02], [0.37, 0.3], [0.28, 0.68], [0.2, 0.9], [0.1, 0.97], [0, 0.98]]), robe: lathe([[0, 0], [0.42, 0.02], [0.4, 0.4], [0.3, 0.72], [0.2, 0.92], [0.1, 0.98], [0, 0.99]]) };
  const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  function Kit() {
    const solid = [], hull = [];
    let base = null, tint = null;
    const k = {
      at(Mb, tf) { base = Mb || null; tint = tf || null; return k; },
      addM(geo, m, color, ink = 0.022) {
        solid.push({ geo, m: base ? base.clone().multiply(m) : m, color: tint ? tint(color) : color });
        if (ink > 0) { m.decompose(_v, _q, _s); const hm = m.clone().multiply(new THREE.Matrix4().makeScale(1 + 1.6 * ink / Math.max(0.03, _s.x), 1 + 1.6 * ink / Math.max(0.03, _s.y), 1 + 1.6 * ink / Math.max(0.03, _s.z))); hull.push({ geo, m: base ? base.clone().multiply(hm) : hm, color: INK }); }
        return k;
      },
      add(geo, x, y, z, sx, sy, sz, color, o = {}) { return k.addM(geo, TK.M4(x, y, z, sx, sy, sz, o.ry || 0, o.rx || 0, o.rz || 0), color, o.ink === undefined ? 0.022 : o.ink); },
      box(x, y, z, w, h, d, color, o) { return k.add(KG.box, x, y, z, w, h, d, color, o); },
      rod(a, b, r, color, ink = 0.012, geo = KG.cyl6) {
        const d = _v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = d.length() || 1e-3, q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
        return k.addM(geo, new THREE.Matrix4().compose(V((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, V(r, len, r)), color, ink);
      },
      get n() { return solid.length; },
      build(parent, o = {}) {
        const M = mats(), out = [];
        if (solid.length) { const m = new THREE.Mesh(TK.merge(solid), o.mat || M.VCM); m.castShadow = o.shadow !== false; m.receiveShadow = true; parent.add(m); out.push(m); }
        if (hull.length && o.hull !== false) { const h = new THREE.Mesh(TK.merge(hull), M.HULLM); parent.add(h); out.push(h); }
        return out;
      },
    };
    return k;
  }
  const glow = (color, s, o = 0, blend = THREE.AdditiveBlending) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, blending: blend, fog: false })); sp.scale.setScalar(s); return sp; };
  // a person, drawn into a kit (past.js's person kit: the same looks, skin, hair, hairdo, dress, apron, vest, shawl, robe, hat, beard…)
  function drawPerson(k, o) {
    const Wd = o.wide || 1, y0 = o.seat ? -0.36 : 0, hy = y0 + 1.18;
    k.add(o.robe ? KG.robe : KG.body, 0, y0, 0, Wd, 1, Wd, o.robe || o.dress, { ink: 0.02 });
    if (o.apron) k.add(KG.sphere, 0, y0 + 0.42, 0.26 * Wd, 0.24, 0.32, 0.08, o.apron, { ink: 0.01 });
    if (o.vest) k.add(KG.sphere, 0, y0 + 0.62, 0.12, 0.28, 0.3, 0.24, o.vest, { ink: 0.01 });
    if (o.shawl) k.add(KG.torus, 0, y0 + 0.86, 0, 0.27, 0.27, 0.6, o.shawl, { rx: Math.PI / 2 });
    for (const s of [-1, 1]) { k.rod([s * 0.25 * Wd, y0 + 0.86, 0.04], [s * 0.33 * Wd, y0 + 0.56, 0.16], 0.065, o.sleeve || o.robe || o.dress, 0.012, KG.cyl); k.add(KG.ball6, s * 0.33 * Wd, y0 + 0.53, 0.18, 0.075, 0.075, 0.075, o.skin, { ink: 0.008 }); }
    k.add(KG.sphere, 0, hy, 0, 0.28, 0.27, 0.27, o.skin);
    if (o.hairdo === 'bald') for (const s of [-1, 1]) k.add(KG.ball6, s * 0.24, hy - 0.01, -0.07, 0.08, 0.11, 0.13, o.hair, { ink: 0.008 });
    else k.add(KG.half, 0, hy + 0.02, -0.02, 0.29, 0.29, 0.29, o.hair, { rx: -0.5 });
    if (o.hairdo === 'bun') k.add(KG.ball6, 0, hy + 0.22, -0.2, 0.12, 0.12, 0.12, o.hair);
    if (o.hairdo === 'tails' || o.hairdo === 'braids') for (const s of [-1, 1]) { k.add(KG.ball6, s * 0.3, hy - 0.02, -0.06, 0.1, o.hairdo === 'braids' ? 0.2 : 0.1, 0.1, o.hair); if (o.ribbon) k.add(KG.ball6, s * 0.3, hy + 0.1, -0.05, 0.07, 0.05, 0.07, o.ribbon, { ink: 0.006 }); }
    for (const s of [-1, 1]) {
      k.add(KG.ball6, s * 0.1, hy + 0.01, 0.235, 0.04, 0.06, 0.03, '#2b2235', { ink: 0 });
      k.add(KG.ball6, s * 0.1 + 0.013, hy + 0.035, 0.258, 0.014, 0.014, 0.01, '#ffffff', { ink: 0 });
      k.add(KG.ball6, s * 0.17, hy - 0.09, 0.222, 0.05, 0.028, 0.015, '#ff9aa6', { ink: 0 });
    }
    if (!o.noMouth) k.add(KG.ball6, 0, hy - 0.11, 0.265, 0.035, 0.012, 0.01, '#2b2235', { ink: 0 });
    if (o.glasses) for (const s of [-1, 1]) k.add(KG.torus, s * 0.1, hy + 0.01, 0.258, 0.068, 0.068, 0.068, '#2b2235', { ink: 0 });
    if (o.stache) for (const s of [-1, 1]) k.add(KG.ball6, s * 0.07, hy - 0.08, 0.255, 0.075, 0.035, 0.045, o.hair2 || '#e8e4dc', { ink: 0.006 });
    if (o.beard) k.add(KG.ball6, 0, hy - 0.16, 0.16, 0.17, 0.15, 0.12, o.hair2 || '#e8e4dc');
    const hc = o.hatColor;
    if (o.hat === 'flat') { k.add(KG.cyl, 0, hy + 0.24, 0.02, 0.27, 0.08, 0.27, hc || '#6b5a4a', { rx: -0.12 }); k.box(0, hy + 0.21, 0.25, 0.3, 0.03, 0.16, hc || '#6b5a4a', { rx: 0.2 }); }
    if (o.hat === 'straw') { k.add(KG.cyl, 0, hy + 0.25, 0, 0.5, 0.035, 0.5, '#e8c57a'); k.add(KG.half, 0, hy + 0.26, 0, 0.22, 0.2, 0.22, '#e8c57a'); k.add(KG.cyl, 0, hy + 0.3, 0, 0.225, 0.05, 0.225, hc || '#e05a4b', { ink: 0 }); }
    if (o.hat === 'cap') { k.add(KG.half, 0, hy + 0.12, 0, 0.3, 0.2, 0.3, hc || '#c9443a'); k.box(0, hy + 0.13, 0.27, 0.3, 0.025, 0.18, hc || '#c9443a'); }
    if (o.hat === 'beret') k.add(KG.sphere, 0.05, hy + 0.25, -0.02, 0.27, 0.08, 0.27, hc || '#7a4fa0', { rz: 0.2 });
    if (o.hat === 'scarf') k.add(KG.half, 0, hy + 0.04, -0.02, 0.31, 0.3, 0.31, hc || '#c9553f', { rx: -0.35 });
    if (o.hat === 'band') k.add(KG.torus, 0, hy + 0.1, -0.01, 0.285, 0.285, 0.3, hc || '#d64b3c', { rx: Math.PI / 2 - 0.15, ink: 0 });
    const R = [0.33 * Wd, y0 + 0.53, 0.18], Lh = [-0.33 * Wd, y0 + 0.53, 0.18], p = o.prop;
    if (p === 'lantern') { k.box(R[0], R[1] - 0.18, R[2] + 0.05, 0.2, 0.26, 0.2, '#f6e7a8', { ink: 0.006 }); k.box(R[0], R[1] - 0.03, R[2] + 0.05, 0.24, 0.05, 0.24, '#2f3440'); }
    if (p === 'cane') k.rod([R[0], y0 + 0.02, R[2] + 0.1], [R[0], R[1] + 0.04, R[2]], 0.025, '#5a3a24', 0.006);
    if (p === 'baton') k.rod([R[0], R[1], R[2]], [R[0] + 0.05, R[1] + 0.35, R[2] + 0.2], 0.012, '#fdf8ee', 0);
    if (p === 'basket') { k.add(KG.cyl, Lh[0], Lh[1] - 0.06, Lh[2] + 0.05, 0.2, 0.16, 0.2, '#b8864f'); for (let i = 0; i < 4; i++) k.add(KG.ball6, Lh[0] + (i % 2 - 0.5) * 0.14, Lh[1] + 0.05, Lh[2] + 0.05 + (i > 1 ? 0.07 : -0.05), 0.075, 0.075, 0.075, '#d8402f', { ink: 0.006 }); }
    if (p === 'book') k.box(R[0] - 0.12, R[1] + 0.02, R[2] + 0.08, 0.26, 0.04, 0.2, '#a9784a', { ink: 0.006, rz: 0.15 });
    return hy + 0.36;
  }
  // one person of their own (a group you can move): { id, g, body, api (x, y, z, top, name, talking, yaw), o, h, ph, hop, cap?, grin? }
  function person(id, o, parent, at = {}) {
    const k = Kit(); if (o.tint) k.at(null, o.tint);
    const top = drawPerson(k, o), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    k.build(body, o.mat ? { mat: o.mat } : {});
    const h = o.h || (o.kid ? 0.78 : 1); g.scale.setScalar(h);
    const P = { id, o, g, body, h, ph: (id.length * 1.37) % 6.28, hop: 0, api: { id, name: '', x: at.x || 0, y: at.y || 0, z: at.z || 0, top: top * h + 0.1, talking: false, yaw: at.yaw || 0 } };
    const hy = (o.seat ? -0.36 : 0) + 1.18;
    if (o.capOn !== undefined) {           // (a cap of its own he can put on: Elio's red one)
      const ck = Kit(); ck.add(KG.half, 0, hy + 0.12, 0, 0.3, 0.2, 0.3, '#d23a32').box(0, hy + 0.13, 0.27, 0.3, 0.025, 0.18, '#d23a32');
      P.cap = new THREE.Group(); ck.build(P.cap); body.add(P.cap); P.cap.visible = !!o.capOn;
    }
    if (o.grin) {                          // (a wide open grin over the mouth, shown when he smiles: the teeth, its dark rim)
      const sm = new THREE.Group(); sm.position.set(0, hy - 0.07, 0.29);
      const teeth = new THREE.Mesh(new THREE.CircleGeometry(0.078, 16, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ color: '#fffaf0' })); sm.add(teeth);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.017, 5, 14, Math.PI), new THREE.MeshBasicMaterial({ color: INK })); rim.rotation.z = Math.PI; rim.position.z = 0.002; sm.add(rim);
      const top = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.016), new THREE.MeshBasicMaterial({ color: INK })); top.position.z = 0.003; sm.add(top);
      body.add(sm); sm.visible = false; P.grin = sm;
    }
    if (parent) parent.add(g);
    place(P, P.api.x, P.api.z, P.api.yaw, P.api.y);
    return P;
  }
  function place(P, x, z, yaw, y) { const a = P.api; a.x = x; a.z = z; if (y !== undefined) a.y = y; if (yaw !== undefined) a.yaw = yaw; P.g.position.set(x, a.y, z); P.g.rotation.y = a.yaw; }
  const faceTo = (P, x, z) => { P.api.yaw = Math.atan2(x - P.api.x, z - P.api.z); P.g.rotation.y = P.api.yaw; };
  // the three times' tints for a crowd: long ago, sepia; tomorrow, silver-blue (today: as it is)
  const _c = new THREE.Color(), _w = new THREE.Color();
  const TINT = {
    past: c => { _c.set(c); const l = _c.r * 0.3 + _c.g * 0.59 + _c.b * 0.11; _w.setRGB(Math.min(1, l * 1.1 + 0.12), l * 0.88 + 0.06, l * 0.6 + 0.02); return '#' + _c.lerp(_w, 0.76).getHexString(); },
    future: c => { _c.set(c); const l = _c.r * 0.3 + _c.g * 0.59 + _c.b * 0.11; _w.setRGB(l * 0.82 + 0.06, l * 0.92 + 0.1, Math.min(1, l * 1.08 + 0.2)); return '#' + _c.lerp(_w, 0.66).getHexString(); },
    now: c => c,
  };

  // ------------------------------------------------------------ saying things (the regions' way: mixed by the weave; a demonstration
  // whole in the language, EN on request)
  function say(p, T) { if (!p || !T) return Promise.resolve(); const l = lang(); p.lines = { en: fillMimo(T.en || '', 'en').replace(/\{mimo\}/g, mimoName()), [l]: fillMimo(pick(T, l), l) }; return STORY.sayInline(p); }
  function demo(p, T, marks) {
    if (!p || !T) return Promise.resolve();
    const T2 = { en: String(T.en || '').replace(/\{mimo\}/g, mimoName()) }; LANGS.forEach(x => { T2[x] = fillMimo(T[x] || '', x); });
    return STORY.demoLine(p, T2, marks || []);
  }
  const lower1 = s => String(s).charAt(0).toLowerCase() + String(s).slice(1);
  const cjRun = (s, l = lang()) => (isCl(l) && typeof CJK !== 'undefined' && CJK.plain ? String(s).replace(/[぀-ヿ一-鿿][぀-ヿ一-鿿…]*/g, m => { try { return lower1(CJK.plain(m, { lang: l })); } catch (e) { return m; } }) : s);
  const think = (s, d) => STORY.think(cjRun(String(s).replace(/\{mimo\}/g, mimoName())), d);
  const you = s => STORY.you(String(s).replace(/\{mimo\}/g, mimoName()));
  // an echo (CH4's words: read live, so a region's change of wording follows)
  const echo = k => (typeof CH4 !== 'undefined' && CH4._ && CH4._.WORDS[k]) || null;

  // ------------------------------------------------------------ grading what you say (S–D: one letter down per miss; «?», the whole
  // line, counts as two). The ruins' grader line, kept here: want → S (an A with an accent missing); alt → A; the right idea in the
  // wrong form (person, tense, mood) → a B with its tip; past / pres / fut → a miss with its tip. Typing only the blanks fills the frame.
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const fold = (s, lg) => { let t = nrm(s); if (lg === 'de') t = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'); return t; };
  const words = (s, lg) => ' ' + fold(s, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const hasCJ = (text, src, l) => {
    if (typeof CJK === 'undefined') return false;
    const typed = /[぀-ヿ一-鿿]/.test(String(text || ''));
    try { const ch = CJK.chars(src, { lang: l }).replace(/\s+/g, ''); if (/[぀-ヿ一-鿿]/.test(ch) && String(text || '').replace(/\s+/g, '').includes(ch)) return true; } catch (e) { /* */ }
    if (typed && l === 'zh') return false;               // (characters typed: the characters decide, 回 isn't 会)
    try { if (CJK.contains(text, src, l)) return true; } catch (e) { /* */ }
    if (typed) return false;
    try { const ro = nrm(CJK.roman(src, { lang: l })).replace(/[^a-z]/g, ''); if (ro.length >= 4 && nrm(text).replace(/[^a-z]/g, '').includes(ro)) return true; } catch (e) { /* */ }
    try { const ws = s => ' ' + nrm(s).replace(/[^a-z]+/g, ' ').trim() + ' ', rw = ws(CJK.roman(src, { lang: l })); if (rw.trim().length >= 2 && ws(text).includes(rw)) return true; } catch (e) { /* */ }
    return false;
  };
  function has(text, item, lg) {
    if (Array.isArray(item)) return item.every(x => has(text, x, lg));
    if (isCl(lg)) return hasCJ(text, item, lg);
    return words(text, lg).includes(' ' + fold(item, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ');
  }
  const accented = (text, item, lg) => { if (isCl(lg) || Array.isArray(item)) return true; const t = ' ' + String(text).toLowerCase().replace(/[¡!¿?.,;:«»"“”()…]/g, ' ').replace(/\s+/g, ' ') + ' '; return t.includes(' ' + String(item).toLowerCase() + ' '); };
  const exact = (text, item, lg) => (isCl(lg) ? has(text, item, lg) : Array.isArray(item) ? item.every(x => exact(text, x, lg)) : accented(text, item, lg));
  const BKEYS = ['person', 'tense', 'mood'], MISS = ['past', 'pres', 'fut'];
  const modelOf = (T, lg) => plainT(fillMimo((T.model || {})[lg] || '', lg), lg).replace(/\s*[.。]\s*$/, '');
  function tipOf(T, kind, lg) {
    const k = (T.tipK || {})[kind] || kind, tt = X().TIPS[k] || {};
    return String(tt[lg] || tt.es || '').replace('{form}', modelOf(T, lg));
  }
  function grade0(T, text, lg) {
    const first = (key, fn = has) => ((T[key] || {})[lg] || []).find(x => fn(text, x, lg));
    // a form that counts less, found by its exact spelling first (so a bare A can't hide it)
    for (const k of BKEYS) { const x0 = first(k, exact); if (x0 && !first('want', exact)) return { ok: true, letter: 'B', kind: k, why: tipOf(T, k, lg) }; }
    const w = first('want');
    if (w && !first('want', exact)) for (const k of MISS) { const m = first(k, exact); if (m) return { ok: false, kind: k, why: tipOf(T, k, lg) }; }
    if (w) {
      const others = ['alt', ...BKEYS, ...MISS].flatMap(k => ((T[k] || {})[lg] || []).flat());
      const ac = typeof ACCENTS !== 'undefined' && ACCENTS.judge ? ACCENTS.judge(text, w, lg, { others }) : { keep: !accented(text, w, lg), why: 'Mind the accent', tip: '' };
      return { ok: true, letter: ac.keep ? 'A' : 'S', kind: 'right', why: ac.keep ? ac.why : 'Just right!', tip: ac.tip || '' };
    }
    const a = first('alt'); if (a) return { ok: true, letter: 'A', kind: 'alt', why: 'Right! The way it was written for an S: «' + modelOf(T, lg) + '»' };
    for (const fn of [exact, has]) {
      for (const k of BKEYS) { const x = first(k, fn); if (x) return { ok: true, letter: 'B', kind: k, why: tipOf(T, k, lg) }; }
      for (const k of MISS) { const m = first(k, fn); if (m) return { ok: false, kind: k, why: tipOf(T, k, lg) }; }
    }
    return { ok: false, kind: 'none' };
  }
  // typing only the blanks fills the frame in («dije rieron» for «Aquella noche ___ una palabra mal, y todos se ___.»)
  function grade(T, text, lg) {
    const g = grade0(T, text, lg);
    if (!String(text || '').trim()) return g;
    const fr = fillMimo((T.frame || {})[lg] || '', lg), n = (fr.match(/___/g) || []).length; if (!n) return g;
    const chips = ((T.chips || {})[lg] || []).map(c => c[0]);
    let fills = null;
    // (already right, an S, an A or a B: it's filled in only if it's nothing but the chips, so a line of its own keeps its grade)
    const onlyChips = ch => {
      if (isCl(lg)) {
        let t = String(text).replace(/[\s、。，,.!！?？…]/g, '');
        if (/[぀-ヿ一-鿿]/.test(t)) {
          let a = t; for (const c of ch) a = a.replace(CJK.chars(c, { lang: lg }).replace(/\s+/g, ''), ''); if (!a || lg !== 'ja') return !a;
          try { let k = CJK.canon(t, lg).replace(/[^a-z]/g, ''); for (const c of ch) k = k.replace(CJK.canon(c, lg).replace(/[^a-z]/g, ''), ''); return !k; } catch (e) { return false; }      // (ja typed in kana)
        }
        t = nrm(t).replace(/[^a-z]/g, ''); for (const c of ch) t = t.replace(nrm(CJK.roman(c, { lang: lg })).replace(/[^a-z]/g, ''), ''); return !t;
      }
      let t = words(text, lg); for (const c of ch) t = t.replace(' ' + fold(c, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ', ' '); return !t.trim();
    };
    if (isCl(lg)) {
      // (only a text that's nothing but the chips: a whole line with a wrong form keeps its tip, «会说错» isn't «说错了»)
      const ch = chips.filter(c => has(text, c, lg));
      if (ch.length === n && onlyChips(ch)) fills = ch;
    } else {
      const tw = String(text).trim().replace(/[¡!¿?.,;:«»"“”()…]/g, ' ').split(/\s+/).filter(Boolean);
      const fw = new Set(words(fr.replace(/___/g, ' '), lg).trim().split(' '));
      if (tw.length === n && !tw.some(w => fw.has(fold(w, lg))) && (!g.ok || onlyChips(chips))) fills = tw;
      else if (tw.length <= n * 3) { const ch = chips.filter(c => has(text, c, lg)); if (ch.length === n && (!g.ok || onlyChips(ch))) fills = ch; }
    }
    if (!fills) return g;
    let i = 0; const full = fr.replace(/___/g, () => fills[i++] || '');
    const g2 = grade0(T, plainT(full, lg), lg);
    if (!g2.ok || (g.ok && 'SABCD'.indexOf(g.letter) < 'SABCD'.indexOf(g2.letter))) return g;
    // (the whole line is what's kept: the speech's script in the credits shows it)
    return Object.assign(g.ok && g.letter === g2.letter ? g : g2, { filled: plainT(full, lg) });
  }
  // one task, asked until it's said: the help ladder is always on the box (the frame, the chips, «?» for the whole line). After three
  // misses he finds the line himself (D): never a fail. o: { title, icon, tries (3), hint }
  async function ask(T, o = {}) {
    const lg = lang();
    const frame = plainT(fillMimo((T.frame || {})[lg] || '', lg), lg);
    const chips = ((T.chips || {})[lg] || []).map(([w, e]) => `${isCl(lg) ? lower1(plainT(fillMimo(w, lg), lg)) : plainT(fillMimo(w, lg), lg)} (${e})`).join(' · ');
    const modelRaw = fillMimo((T.model || {})[lg] || '', lg), model = plainT(modelRaw, lg);
    const ladder = `① «${frame}»${chips ? '  ② ___ = ' + chips : ''}  ③ ? = the whole line (it costs two letters)`;
    const per = v => (v && typeof v === 'object' ? v[lg] || v._ || v.es || '' : v || '');      // (rung, title: a language's own, or the English one)
    const rung = per(T.rung);              // (zh / ja rungs carry both scripts themselves: «了 (le): what happened»)
    let misses = 0;
    for (;;) {
      const r = await UI.command({ name: mimoName(), icon: o.icon || 'star', title: o.title || per(T.title), verbs: [], model: modelRaw, modelEn: (T.model || {}).en || '', placeholder: `«${frame}»`, hint: ladder + (rung ? ` · ${rung}` : '') });
      if (!r || r.cancelled) { think('He’s waiting for your whisper. The frame and the chips are on the box, and ? shows the whole line.', 5); await wait(0.4); continue; }
      const h = document.getElementById('command-hint'), peeked = !!(h && /^Try/.test(h.textContent || ''));
      const g = grade(T, r.text, lg);
      if (g.ok) {
        const letter = down(g.letter, misses + (peeked ? 2 : 0)), why = g.kind === 'right' && g.letter === 'S' && (misses || peeked) ? (peeked ? 'Right, with the example' : 'Right, on another try') : g.why;
        try { UI.toast(cjRun(`${letter} · ${why}${g.tip ? ' · ' + g.tip : ''}`)); } catch (e) { /* */ }
        snd(letter === 'S' ? 'chest' : 'review');
        return { letter, text: g.filled || r.text, kind: g.kind };
      }
      misses++; snd('wrong'); try { G.sim.mimo.tiltT = 1.4; } catch (e) { /* */ }
      if (misses >= (o.tries || 3)) { think(`He finds it, with you there: «${model}»`, 5); return { letter: 'D', text: model, kind: 'helped' }; }
      think(g.kind !== 'none' && g.why ? g.why : misses >= 2 ? `Like this: «${model}»` : `Not quite… «${frame}»${chips ? ' · ' + chips : ''}`, 6.5);
    }
  }
  // the letter for a set of grades (the curtain call's, the credits'): the average, never below D
  function avg(list) { const L = (list || []).filter(x => 'SABCD'.includes(x)); if (!L.length) return 'A'; const n = L.reduce((a, x) => a + 'SABCD'.indexOf(x), 0) / L.length; return 'SABCD'[Math.min(4, Math.round(n))]; }

  // ------------------------------------------------------------ the look of the finale's screens (the rise, the swirl)
  function css() {
    if (document.getElementById('fin-css')) return;
    const s = document.createElement('style'); s.id = 'fin-css';
    s.textContent = `#fin-rise { position: fixed; inset: 0; z-index: 60; background: #0b0a18; overflow: hidden; font-family: Bahnschrift, "Segoe UI", sans-serif; }
#fin-rise canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
#fin-rise .bar { position: absolute; left: 0; right: 0; height: 10vh; background: #050409; } #fin-rise .bar.t { top: 0; } #fin-rise .bar.b { bottom: 0; height: 15vh; }
#fin-rise .cap { position: absolute; left: 50%; bottom: 0; height: 15vh; width: min(900px, 90vw); transform: translateX(-50%); display: flex; align-items: center; justify-content: center; text-align: center;
  color: #f4ecdc; font-size: clamp(18px, 2.3vw, 26px); font-weight: 600; text-shadow: 0 2px 0 #000; opacity: 0; transition: opacity .5s; }
#fin-rise .cap .w { color: #ffd98a; border-bottom-color: #ffd98a; }
#fin-rise .skip { position: absolute; right: 18px; top: calc(10vh + 10px); color: #f4ecdc; opacity: .55; font-size: 13px; } #fin-rise .skip kbd { border: 1.5px solid currentColor; border-radius: 5px; padding: 0 5px; }
#fin-swirl { position: fixed; inset: 0; z-index: 59; pointer-events: none; opacity: 0; overflow: hidden; }
#fin-swirl .sw { position: absolute; left: 50%; top: 50%; width: 240vmax; height: 240vmax; margin: -120vmax 0 0 -120vmax; border-radius: 50%; animation: finSpin 2.6s linear infinite;
  background: radial-gradient(circle, #ffffff 0%, #fff3c8 8%, transparent 30%), repeating-conic-gradient(from 0deg, #ffd166 0deg 20deg, #8fe8b8 20deg 40deg, #9db8ff 40deg 60deg); }
@keyframes finSpin { to { transform: rotate(360deg); } }
.card.fin-card .big { font: italic 700 30px Georgia, "Yu Mincho", "Microsoft YaHei", serif; } .card.fin-card .tag { color: #a8532f; }`;
    document.head.appendChild(s);
  }
  const fast = () => typeof TIME !== 'undefined' && TIME._ && TIME._.fast && TIME._.fast.on;
  const sleep = ms => (fast() ? Promise.resolve() : new Promise(r => setTimeout(r, ms)));
  // the three times swirling together (the clock at eight): gold, teal and violet
  function swirl(on, ms = 800) {
    css();
    let el = document.getElementById('fin-swirl');
    if (!el) { el = document.createElement('div'); el.id = 'fin-swirl'; el.innerHTML = '<div class="sw"></div>'; document.body.appendChild(el); }
    if (fast()) { el.style.transition = 'none'; el.style.opacity = on ? '1' : '0'; return Promise.resolve(); }
    el.style.transition = `opacity ${ms}ms ease-${on ? 'in' : 'out'}`; void el.offsetWidth; el.style.opacity = on ? '1' : '0';
    return sleep(ms + 30);
  }

  // ------------------------------------------------------------ the main quest's last steps (chapter4.js puts CH4.FINALE after the
  // Gray Marsh's report; a boss helper can splice its own step in after the one with fin: 'top')
  const inWorldNow = () => typeof TIME === 'undefined' || TIME.world() === 'now';
  function homeT() {
    if (inWorldNow()) return null;
    const Y = G.sim.you, rid = TIME.regionNow();
    const cs = Object.values(TIME.CRACKS).filter(c => c.region === rid && c.worlds.includes('now') && c.worlds.includes(TIME.world()));
    cs.sort((a, b) => Math.hypot(a.x - Y.x, a.z - Y.z) - Math.hypot(b.x - Y.x, b.z - Y.z));
    return cs[0] ? { x: cs[0].x, z: cs[0].z, hint: '{mimo} looks at the time crack. Back to today first!' } : null;
  }
  const towerT = () => {
    if (typeof OLDTOWER !== 'undefined' && OLDTOWER.inside) return OLDTOWER.target();
    return homeT() || (typeof OLDTOWER !== 'undefined' ? Object.assign(OLDTOWER.doorSpot(), { hint: '{mimo} looks up at the Old Tower’s door, at the top of the stone stair.' }) : null);
  };
  const DOOR = { x: -13.5, z: -233.1 };          // the old theater's doors, today (cemetery.js HALL's front)
  const stageT = () => {
    if (typeof FINSTAGE !== 'undefined' && FINSTAGE.inside) return FINSTAGE.target();
    return homeT() || { x: DOOR.x, z: DOOR.z, hint: '{mimo} points north, to the old theater in the Old Quarter. It’s eight o’clock there.' };
  };
  const STEPS = [
    { fin: 'climb', text: 'The Old Tower: take Elio his words',
      why: 'All eighteen of Elio’s words are free. He’s up in the Old Tower, by the great clock where Noa is still caught. The stone stair goes up from the end of the marsh path.',
      done: s => !!finOf(s).rose || !!finOf(s).top, target: () => towerT(), hint: '{mimo} looks up at the Old Tower. Its door is at the top of the stone stair.' },
    { fin: 'top', text: 'The top of the Old Tower: free Elio from the Hush',
      why: 'The Hush is holding on to Elio, up by the great clock. Noa is still caught in its face.',
      done: s => stageOpen(s), target: () => towerT(), hint: '{mimo} looks up at the Old Tower’s door.' },
    { fin: 'stage', text: 'Eight o’clock at the old theater: Elio’s speech',
      why: 'The great clock struck eight, the concert’s hour, and the three times met at the old theater in the Old Quarter. Elio is in the wings. If he forgets a line, whisper it to him from the prompter’s box.',
      done: s => !!finOf(s).speech, target: () => stageT(), hint: '{mimo} points north, to the old theater.' },
    { fin: 'end', text: 'The valley is yours',
      why: 'Elio has his voice back, and Noa is free. What’s next is up to you: the Academy’s exams, Radio Alba’s quiz, the library’s book club, pen pals and debates at the town hall, free talk with everyone, and every time crack is still open. Elio is at the old theater, and Noa by the duck pond.',
      done: () => false, target: () => null, hint: '{mimo} stretches. Anywhere you like!' },
  ];
  const STORY_L = [
    { when: s => !!finOf(s).top, text: 'At the top of the Old Tower, you gave Elio back three of his own words, each in its own time. His hood fell, the gray lifted off him, and Noa stepped out of the great clock.' },
    { when: s => !!finOf(s).clock, text: 'Elio set the great clock to eight, the hour of the concert. It struck, and the three times met at the old theater.' },
    { when: s => !!finOf(s).speech, text: 'On the old theater’s stage, in all three times at once, Elio gave the speech he never finished. When he got the same word wrong again, he laughed, and everyone laughed with him… and he kept on talking. «¡Gracias, Alba!»' },
  ];
  STEPS.forEach(s0 => { s0._fdone = s0.done; });          // (tests: time_alba.js's setup wraps every main step as done; ours are put back)
  if (typeof CH4 !== 'undefined') { CH4.FINALE = STEPS; CH4.FINALE_STORY = STORY_L; }

  // ------------------------------------------------------------ the tower's door (oldtower.js asks: FIN.door(at)): once the Gray Marsh's
  // Future is reported, its tear doesn't lead to yesterday any more: «Go up»
  function door(at) {
    if (!G || !ready(G.state) || finOf(G.state).top || !inWorldNow()) return null;
    return Object.assign({}, at, { label: 'Go up the tower', run: climb });
  }
  // the door, the rise, the top (handed to the boss's seam), then the clock at eight and the stage. A second time up (after a load,
  // or a boss fight to try again) skips the door's scene, and the rise can be skipped with E.
  async function climb() {
    if (busy) return; busy = true;
    let up = false;
    lock(true);
    try {
      const Yd = typeof OLDTOWER !== 'undefined' ? OLDTOWER.yard : null, D = Yd && Yd.door, f = G.state.flags;
      if (D && !f.towerHealed) {
        // his words glow in the journal and rise out of it, into the tear; it closes, and the doors stand open
        shot(V(D.x + 4.8, D.y + 2.2, D.z + 7.5), V(D.x, D.y + 1.6, D.z), 0.9);
        await wait(0.9);
        await you(X().YOU.door);
        const Y = G.sim.you;
        for (let i = 0; i < 18; i++) { G.w3d.fx.sparkle(Y.x + (Math.random() - 0.5) * 0.6, Y.ry + 1.3, Y.z + (Math.random() - 0.5) * 0.6, 3, i % 2 ? ['#ffd98a', '#fff3c8'] : ['#9db8ff', '#e8f0ff']); if (i % 3 === 0) snd('chime'); await wait(0.12); }
        await wait(0.3);
        for (let i = 0; i < 6; i++) { G.w3d.fx.sparkle(Yd.tear.x, Yd.tear.y, Yd.tear.z + 0.3, 6, ['#ffd98a', '#9db8ff', '#8fe8b8']); await wait(0.15); }
        f.towerHealed = true; f.oldDoor = true;
        try { OLDTOWER._.applyYard(); } catch (e) { /* */ }
        snd('bigbell'); await wait(1.0);
        think(X().YOU.doorOpen, 4.5);
        G.save();
      }
      await rise(() => { try { OLDTOWER._.enterAt(8); } catch (e) { console.error('[finale] up', e); } }, { short: !!st().rose });
      const S0 = st(); S0.rose = true; G.save();
      up = true;
    } catch (e) { console.error('[finale] climb', e); }
    finally { lock(false); busy = false; }
    // the top is the boss's (FB1): the seam runs right after the rise, with the player in the Clock Room and nothing locked. It calls
    // won() when the Hush is beaten: Elio is free, and the clock at eight and the stage follow.
    if (up) { try { await api.bossSlot(won); } catch (e) { console.error('[finale] boss slot', e); } }
  }
  let busy = false;
  // the boss is beaten (FB1 calls next(o), or the seam's default does): a checkpoint, then the clock at eight. o: { elio, noa } (people
  // already standing at the clock, { g, api }: used instead of building ours)
  async function won(o = {}) {
    const S0 = st(); if (!S0.top) { S0.top = true; G.save(); }
    try { if (typeof QUESTS !== 'undefined' && QUESTS.tick) QUESTS.tick(); } catch (e) { /* */ }
    await clockAtEight(o);
  }

  // ------------------------------------------------------------ the rise (the fall's mirror, oldtower_boss.js): a screen of its own,
  // drawn frame by frame from the game's loop (FIN.tick), so tests can step it. Eighteen paper lanterns float up the shaft, one per
  // echo in the order they were freed; the eight bell marks light; the great clock comes down to meet you, its hands running forward.
  // E skips. at(): called under the screen just before it ends (the room you land in).
  let RISE = null;
  const RISE_T = 24;
  function rise(at, o = {}) {
    return new Promise(res => {
      css();
      const el = document.createElement('div'); el.id = 'fin-rise';
      el.innerHTML = '<canvas></canvas><div class="bar t"></div><div class="bar b"></div><div class="cap"></div><div class="skip"><kbd>E</kbd> ▸▸</div>';
      document.body.appendChild(el);
      const l = lang(), order = (typeof CH4 !== 'undefined' ? CH4.ORDER : []).flatMap(r => [r + '.past', r + '.future']);
      const lant = order.map((k, i) => ({ k, text: plainT(pick(echo(k) || {}, l), l), t0: 1.0 + i * 1.08, x: 0.2 + ((i * 0.618) % 1) * 0.6, ph: i * 1.7, past: /\.past$/.test(k) }));
      RISE = { el, cv: el.querySelector('canvas'), cap: el.querySelector('.cap'), t: o.short ? RISE_T - 5 : 0, lant, res, at, capNow: -1, landed: false, ended: false };
      const key = e => { if (!RISE) return; if (['KeyE', 'Enter', 'Space', 'Escape'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); RISE.t = Math.max(RISE.t, RISE_T - 1.2); } };
      RISE.key = key; addEventListener('keydown', key, true);
    });
  }
  function finishRise() {
    if (!RISE) return;
    const R = RISE; RISE = null;
    removeEventListener('keydown', R.key, true);
    if (!R.landed && R.at) { try { R.at(); } catch (e) { /* */ } }
    R.el.style.transition = fast() ? 'none' : 'opacity .8s'; R.el.style.opacity = '0';
    setTimeout(() => R.el.remove(), fast() ? 0 : 850);
    R.res();
  }
  const RCAPS = [[1.2, 6.2], [9.0, 14.0], [16.6, 21.2]];
  function riseFrame(dt) {
    if (!RISE) return;
    const R = RISE; R.t += Math.min(0.05, Math.max(0, dt || 0));
    const t = R.t;
    const ci = RCAPS.findIndex(([a, b]) => t >= a && t < b);
    if (ci !== R.capNow) { R.capNow = ci; if (ci >= 0) { const c = X().CAPS[ci] || ''; R.cap.innerHTML = typeof UI !== 'undefined' && UI.weave ? UI.weave(c) : esc(c); R.cap.style.opacity = '1'; } else R.cap.style.opacity = '0'; }
    if (t >= RISE_T - 0.6 && !R.landed) { R.landed = true; if (R.at) { try { R.at(); } catch (e) { console.error('[finale] rise at', e); } } }
    drawRise(R, t);
    if (t >= RISE_T) finishRise();
  }
  function drawRise(R, t) {
    const cv = R.cv, dpr = Math.min(1.5, window.devicePixelRatio || 1), W = Math.max(2, Math.round(innerWidth * dpr)), H = Math.max(2, Math.round(innerHeight * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const c = cv.getContext('2d'), S = Math.min(W, H), up = smoothstep(0, RISE_T, t), endK = smoothstep(RISE_T - 2.4, RISE_T - 0.4, t);
    // the shaft: from the night below to a warm gold light above, which grows as you rise
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, `rgba(255,${(200 + 40 * up) | 0},${(120 + 80 * up) | 0},1)`); bg.addColorStop(0.25 + 0.4 * (1 - up), 'rgba(96,74,150,1)'); bg.addColorStop(1, '#0b0a18');
    c.globalAlpha = 1; c.fillStyle = bg; c.fillRect(0, 0, W, H);
    // the walls: stone courses sliding down past you, each side; the eight bell marks light as they pass the middle
    const wall = W * 0.12, off = (t * S * 0.16) % (S * 0.08);
    for (const side of [0, 1]) {
      const x0 = side ? W - wall : 0;
      c.fillStyle = '#2a2436'; c.fillRect(x0, 0, wall, H);
      c.strokeStyle = 'rgba(150,140,180,0.35)'; c.lineWidth = Math.max(1, dpr);
      for (let y = -S * 0.08 + off; y < H; y += S * 0.08) { c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + wall, y); c.stroke(); }
    }
    for (let i = 0; i < 8; i++) {
      const y = H * 1.1 - ((t * 0.075 + i * 0.12) % 1.3) * H * 1.2, lit = t > 2.2 + i * 2.4, side = i % 2, x = side ? W - wall * 0.5 : wall * 0.5, r = S * 0.03;
      c.save(); c.translate(x, y);
      if (lit) { const g0 = c.createRadialGradient(0, 0, 0, 0, 0, r * 3); g0.addColorStop(0, 'rgba(255,214,110,0.8)'); g0.addColorStop(1, 'rgba(255,214,110,0)'); c.fillStyle = g0; c.beginPath(); c.arc(0, 0, r * 3, 0, TAU); c.fill(); }
      c.fillStyle = lit ? '#e9b949' : '#5d5670'; c.strokeStyle = INK; c.lineWidth = Math.max(1, r * 0.12);
      c.beginPath(); c.moveTo(-r * 0.8, r * 0.6); c.quadraticCurveTo(-r * 0.75, -r * 0.9, 0, -r); c.quadraticCurveTo(r * 0.75, -r * 0.9, r * 0.8, r * 0.6); c.closePath(); c.fill(); c.stroke();
      c.restore();
    }
    // the great clock, coming down to meet you, its hands running forward
    const ck = smoothstep(15, 21.5, t);
    if (ck > 0.01) {
      c.save(); c.translate(W / 2, H * (-0.3 + 0.52 * ck)); const rr = S * (0.18 + 0.1 * ck);
      c.fillStyle = '#efe4c8'; c.strokeStyle = INK; c.lineWidth = Math.max(2, rr * 0.06); c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.fill(); c.stroke();
      c.lineWidth = Math.max(1, rr * 0.025); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Math.sin(a) * rr * 0.82, -Math.cos(a) * rr * 0.82); c.lineTo(Math.sin(a) * rr * 0.94, -Math.cos(a) * rr * 0.94); c.stroke(); }
      c.lineCap = 'round'; const mA = t * 2.4, hA = t * 0.2;
      c.lineWidth = Math.max(2, rr * 0.07); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(hA) * rr * 0.5, -Math.cos(hA) * rr * 0.5); c.stroke();
      c.lineWidth = Math.max(1, rr * 0.045); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(mA) * rr * 0.8, -Math.cos(mA) * rr * 0.8); c.stroke();
      c.restore();
    }
    // you and Mimo, rising steadily (in the fall you tumbled away), under the lanterns' lines
    { const sz = S * 0.05, bx = W / 2, by = H * (0.74 - 0.08 * up) + Math.sin(t * 1.3) * S * 0.006;
      c.fillStyle = '#2b2235';
      c.beginPath(); c.arc(bx - sz * 0.5, by - sz * 0.55, sz * 0.24, 0, TAU); c.fill(); c.fillRect(bx - sz * 0.7, by - sz * 0.32, sz * 0.4, sz * 0.62); c.fillRect(bx - sz * 0.68, by + sz * 0.28, sz * 0.12, sz * 0.4); c.fillRect(bx - sz * 0.44, by + sz * 0.28, sz * 0.12, sz * 0.4);
      c.beginPath(); c.ellipse(bx + sz * 0.5, by + sz * 0.1, sz * 0.42, sz * 0.4, 0, 0, TAU); c.fill(); [-1, 1].forEach(e => { c.beginPath(); c.ellipse(bx + sz * 0.5 + e * sz * 0.2, by - sz * 0.45, sz * 0.1, sz * 0.32, e * 0.3, 0, TAU); c.fill(); }); }
    // the lanterns: paper, warm (his past words) or pale blue (his tomorrow's), each with its line, rising faster than you
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const L0 of R.lant) {
      const u = t - L0.t0; if (u < 0) continue;
      const y = H * (1.08 - u * 0.11), x = W * L0.x + Math.sin(u * 0.9 + L0.ph) * S * 0.025; if (y < -S * 0.2) continue;
      const s = S * 0.045, a = Math.min(1, u * 1.5) * (1 - endK);
      c.globalAlpha = a;
      const g1 = c.createRadialGradient(x, y, 0, x, y, s * 2.6); g1.addColorStop(0, L0.past ? 'rgba(255,200,110,0.55)' : 'rgba(170,200,255,0.5)'); g1.addColorStop(1, 'rgba(255,200,110,0)'); c.fillStyle = g1; c.beginPath(); c.arc(x, y, s * 2.6, 0, TAU); c.fill();
      c.fillStyle = L0.past ? '#ffd98a' : '#dfe8ff'; c.strokeStyle = INK; c.lineWidth = Math.max(1, s * 0.08);
      c.beginPath(); c.ellipse(x, y, s * 0.62, s * 0.8, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#b8462f'; c.fillRect(x - s * 0.36, y - s * 0.86, s * 0.72, s * 0.14); c.fillRect(x - s * 0.36, y + s * 0.72, s * 0.72, s * 0.14);
      // its line, while it's in the lower two thirds
      if (y > H * 0.22) {
        const fs = Math.max(10, S * 0.022) | 0; c.font = `700 ${fs}px "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif`;
        const txt = L0.text.length > 64 ? L0.text.slice(0, 62) + '…' : L0.text, tw = c.measureText(txt).width;
        c.globalAlpha = a * Math.min(1, (y - H * 0.22) / (H * 0.15));
        c.fillStyle = 'rgba(20,16,30,0.6)'; c.fillRect(x - tw / 2 - fs * 0.4, y + s * 1.15 - fs * 0.7, tw + fs * 0.8, fs * 1.4);
        c.fillStyle = '#fff6e0'; c.fillText(txt, x, y + s * 1.15);
      }
    }
    c.globalAlpha = 1;
    // the end: everything into the clock's light
    if (endK > 0) { c.globalAlpha = endK; c.fillStyle = '#fff8e6'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  }

  // ------------------------------------------------------------ the top belongs to the final battle (FB1): the rise hands over in the
  // Clock Room as Chapter 1 left it (the hooded figure reading Noa's notebook, Noa in the clock's face). Kept here for FB1's trials: the
  // three gifts (FINTXT.TASKS g1–g3, GIFTS): one of his old lines, three of his words to pick from, the word given back to him in the
  // second person, in its own time (graded S–D, never a fail).
  const ELIO_LOOK = { skin: '#d9a87e', hair: '#4a4048', hairdo: 'short', dress: '#6f6987', vest: '#8f88a6', beard: true, hair2: '#8d8794', h: 1.04, capOn: false, grin: true };
  const NOA_LOOK = { skin: '#f0c9a2', hair: '#3a2a24', hairdo: 'tails', ribbon: '#f2c94c', dress: '#2f8f8a', vest: '#e2683f', h: 0.92 };
  // Bruno (actors.js's coach: his red headband), who fought at the top with you (FB1) and comes down to the theater, today's block
  const BRUNO_LOOK = { skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#3f6f9a', hat: 'band', hatColor: '#d64b3c', h: 1.12, wide: 1.2 };
  const topRoom = () => (typeof OLDTOWER !== 'undefined' && OLDTOWER._ && OLDTOWER._.rooms && OLDTOWER._.rooms[8]) || null;
  const hoodName = () => { try { return OTXT.pick(OTXT.NAMES.hood, lang()); } catch (e) { return '…'; } };
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
  // one gift: o = { who (a speaker { x, y, z, top, name } for his line; none: no line), pickTitle, onGiven(r) }. Resolves { letter, text }
  // and keeps it in the save (state.ch4.fin.gifts / lines), so the credits can show it.
  async function giveBack(g, o = {}) {
    const D = X().GIFTS[g], T = X().TASKS[g], l = lang(), sim = G.sim;
    if (!D || !T) return null;
    if (o.who) await STORY.sayAt(o.who, D.hood, o.who.name || hoodName());
    think(X().YOU[D.think], 6);
    for (;;) {
      const opts = shuffle([D.echo, ...D.among]).map(k => ({ label: plainT(pick(echo(k) || {}, l), l), sub: X().TAGS[k], value: k }));
      const v = await UI.choose(o.pickTitle || 'Which of his words answers that?', opts);
      if (v === D.echo) break;
      snd('wrong'); sim.mimo.tiltT = 1.4; think(X().YOU.pickWrong, 5); await wait(0.6);
    }
    snd('chime'); think(X().YOU.giveIt.replace('{you}', ({ es: 'tú', pt: 'você', de: 'du', zh: '你', ja: 'あなた' })[l] || 'you'), 6);
    // (the box's title: his own words, in the language you're learning, to be said back to him)
    const r = await ask(T, { icon: 'star', title: `Give it back to him: «${plainT(pick(echo(D.echo) || {}, l), l)}» Say it to him.` });
    const S0 = st(); S0.gifts = S0.gifts || {}; S0.lines = S0.lines || {};
    S0.gifts[g] = r.letter; S0.lines[g] = r.text; G.save();
    if (o.onGiven) { try { await o.onGiven(r); } catch (e) { /* */ } }
    if (o.who) await demo(o.who, echo(D.echo));
    return r;
  }
  // the seam: FB1's final battle replaces it (async next => { …the fight, the vines, the realm's trials, its own checkpoints…; return
  // next({ elio, noa }); }). Until then the default lets you through: the Hush is gone, Elio is free.
  async function bossSlot(next) { return next(); }
  // he sets the great clock to eight, the concert's hour: it strikes, and the three times meet at the theater. Works from the Clock Room
  // (OLDTOWER's room 9, after the battle: Elio free, Noa out of the clock, your words back), or from anywhere (straight to the stage).
  // o: { elio, noa, bruno } (people FB1 left standing there, { g, api }: used instead of ours)
  async function clockAtEight(o = {}) {
    if (!stageOpen(G.state)) return;
    const room = topRoom(), mine = [];
    lock(true); clockOn = true;
    try {
      if (room && typeof OLDTOWER !== 'undefined' && OLDTOWER.inside && OLDTOWER.room === 8) {
        const R = room.R, C = room.clock, Y0 = 300;
        const mk = (id, look, at) => { const P = person(id, look, room.g, at); mine.push(P); return P; };
        const E = o.elio || mk('elio', ELIO_LOOK, { x: R.x + 0.5, y: Y0, z: R.z - 3.4, yaw: 0.2 });
        const N = o.noa || mk('noa', NOA_LOOK, { x: R.x - 0.7, y: Y0, z: R.z - 4.0, yaw: 0.4 });
        const Bp = o.bruno || mk('bruno', BRUNO_LOOK, { x: R.x + 2.3, y: Y0, z: R.z - 3.6, yaw: -0.4 });
        E.api.name = nameOf('elio'); N.api.name = nameOf('noa'); Bp.api.name = nameOf('bruno');
        if (E.grin) E.grin.visible = true;
        if (room.fig) room.fig.root.visible = false;
        (room.mist || []).forEach(m => { m.sp.visible = false; });
        if (C) { C.noa.g.visible = false; C.glass.material.opacity = 0; C.nglow.material.opacity = 0; C.beat = 0; }
        shot(V(R.x + 3.4, Y0 + 1.9, R.z + 2.2), V(R.x - 0.3, Y0 + 1.7, R.z - 4.4), 0.9);
        await wait(0.6);
        await say(E.api, X().LINES['elio.clock1']);
        await say(N.api, X().LINES['noa.clock']);
        await say(E.api, X().LINES['elio.clock2']);
        await say(Bp.api, X().LINES['bruno.clock']);
        // the hands run forward to eight; eight strokes, and the eight bells far below answer
        if (C) { C.spin = 0; const t0 = C.time % 12; await tween(2.2, k => { C.time = t0 + (((8 - t0) % 12 + 12) % 12) * (k * k * (3 - 2 * k)); }); C.time = 8; }
        for (let i = 0; i < 8; i++) { snd('bell'); if (C) G.w3d.fx.sparkle(R.x, Y0 + 2.95, R.z - 6.0, 4, ['#ffd98a', '#fff3c8']); await wait(0.42); }
        snd('bigbell');
      }
      st().clock = true; G.save();
      await swirl(true, 900);
      try { if (typeof OLDTOWER !== 'undefined' && OLDTOWER.inside) OLDTOWER._.leaveQuiet(); } catch (e) { console.error('[finale] leave tower', e); }
      mine.forEach(P => { if (P.g.parent) P.g.parent.remove(P.g); });
      if (typeof FINSTAGE !== 'undefined') await FINSTAGE.enter({ from: 'tower', quiet: true });
      clockOn = false;
      await sleep(300);
      await swirl(false, 900);
      lock(false);
      if (typeof FINSTAGE !== 'undefined' && FINSTAGE.wings) await FINSTAGE.wings();
    } catch (e) { console.error('[finale] clock', e); }
    finally { lock(false); clockOn = false; }
  }

  // ------------------------------------------------------------ the old theater's doors today (STORY.extra): «Go in», backstage, once
  // the clock has struck eight (after a load, or if you walked here); afterwards, Elio, his dad and Noa in Alba, and their Talk
  let POST = null;
  const postOn = () => !!(G && done(G.state) && inWorldNow() && !(G.indoors && G.indoors()));
  const POS = { elio: { x: -10.6, z: -230.4, yaw: 0.35 }, dad: { x: -16.9, z: -230.2, yaw: -0.25 }, bench: { x: -16.9, z: -230.5 }, noa: { x: 7.2, z: -172.4, yaw: -2.6 } };
  function buildPost() {
    if (POST) return POST;
    const scene = G.w3d.scene, gy = (x, z) => WORLD.terrainAt(x, z);
    const mk = (id, look, at) => { const P = person(id, Object.assign({}, look, { seat: false }), scene, { x: at.x, y: gy(at.x, at.z), z: at.z, yaw: at.yaw }); P.n = 0; P.solid = { x: 1e5, z: 1e5, _x: at.x, _z: at.z, r: 0.42 }; WORLD.extra.push(P.solid); return P; };
    POST = { elio: mk('elio', Object.assign({}, ELIO_LOOK, { capOn: true, grin: true }), POS.elio), noa: mk('noa', NOA_LOOK, POS.noa) };
    if (POST.elio.grin) POST.elio.grin.visible = true;
    if (X().DAD.on) {
      // the bench he sits on, and him (DAD block: finale_text.js FINTXT.DAD)
      const b = POS.bench, k = Kit(), g = new THREE.Group(); g.position.set(b.x, gy(b.x, b.z), b.z); g.rotation.y = POS.dad.yaw;
      k.box(0, 0.42, 0, 1.5, 0.08, 0.5, '#8a5f3e').box(0, 0.72, -0.24, 1.5, 0.36, 0.06, '#7a5236'); for (const s of [-1, 1]) k.box(s * 0.62, 0.2, 0, 0.08, 0.42, 0.44, '#4a3a33');
      k.build(g); scene.add(g); POST.benchG = g;
      POST.dad = person('dad', Object.assign({}, X().DAD.look, { seat: true }), scene, { x: b.x, y: gy(b.x, b.z) + 0.46, z: b.z + 0.02, yaw: POS.dad.yaw }); POST.dad.n = 0;
      POST.dad.solid = { x: 1e5, z: 1e5, _x: b.x, _z: b.z, r: 0.85 }; WORLD.extra.push(POST.dad.solid);
    }
    return POST;
  }
  function showPost(on) {
    if (!on && !POST) return;
    const P = buildPost();
    for (const k of ['elio', 'noa', 'dad']) { const p = P[k]; if (!p) continue; p.g.visible = on; if (p.solid) { p.solid.x = on ? p.solid._x : 1e5; p.solid.z = on ? p.solid._z : 1e5; } p.api.name = k === 'dad' ? plainT(pick(X().DAD.name)) : nameOf(k); }
    if (P.benchG) P.benchG.visible = on;
  }
  async function postTalk(k) {
    const P = POST && POST[k]; if (!P) return;
    const list = k === 'dad' ? X().DAD.post : (X().POST[k] || []); if (!list.length) return;
    const T = list[P.n++ % list.length];
    lock(true); try { await say(P.api, T); } finally { lock(false); }
  }
  const PROVIDER = {
    interactables() {
      if (!G) return [];
      const s = G.state, out = [];
      if (stageOpen(s) && !done(s) && inWorldNow()) out.push({ x: DOOR.x, z: DOOR.z, r: 1.7, label: 'Go in', run: theaterDoor });
      if (postOn() && POST) for (const k of ['elio', 'noa', 'dad']) { const P = POST[k]; if (P && P.g.visible) out.push({ x: P.api.x, z: P.api.z, r: 2.3, label: 'Talk', who: 'fin:' + k, p: P.api, run: () => postTalk(k) }); }
      return out;
    },
  };
  async function theaterDoor() {
    if (typeof FINSTAGE === 'undefined') return;
    lock(true);
    try { await UI.fade(1, 420); await FINSTAGE.enter({ from: 'door', quiet: true }); await UI.fade(0, 420); } finally { lock(false); }
    if (FINSTAGE.wings) await FINSTAGE.wings();
  }
  // the theater's front today, afterwards: a banner with the festival's motto, and lanterns by the doors (a TIME.effect: today only)
  function banner() {
    const H = (typeof CEMETERY !== 'undefined' && CEMETERY._ && CEMETERY._.HALL) || { x: -13.5, z: -241, d: 12.5 };
    const y0 = H.y0 !== undefined ? H.y0 : WORLD.terrainAt(H.x, H.z + H.d / 2), zf = H.z + H.d / 2 + 0.14, g = new THREE.Group();
    const l = lang(), motto = typeof PTXT !== 'undefined' && PTXT.NAMES && PTXT.NAMES.motto ? PTXT.pick(PTXT.NAMES.motto, l) : 'Toda voz cuenta';
    const tex = TK.canvasTex(512, 112, (c, w, h) => {
      c.fillStyle = '#c9443a'; c.fillRect(0, 8, w, 96); c.fillStyle = '#e8b83e'; c.fillRect(0, 8, w, 6); c.fillRect(0, 98, w, 6);
      for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#e8b83e' : '#fdf8ee'; c.beginPath(); c.moveTo(i * 32, 104); c.lineTo(i * 32 + 16, 112); c.lineTo(i * 32 + 32, 104); c.fill(); }
      c.fillStyle = '#fffaf0'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'italic 700 46px Georgia, "Yu Mincho", "Microsoft YaHei", serif'; c.fillText('«' + motto + '»', w / 2, 56);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.14), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
    m.position.set(H.x, y0 + 5.35, zf); g.add(m);
    for (const s of [-1, 1]) { const gl = glow('#ffd28a', 1.5, 0.55); gl.position.set(H.x + s * 1.55, y0 + 2.5, zf + 0.12); g.add(gl); }
    return g;
  }

  // ------------------------------------------------------------ the journal: «Elio's speech» (once it's been given): his lines and
  // yours, in order, with your letters; 🔊 says any line again
  function speechHTML() {
    const l = lang(), S0 = st(), out = [];
    const line = (t, cls, gr) => out.push(`<li class="${cls}"><span class="t">${tHTML(t, l)}</span>${gr ? ` <small class="gr">${esc(gr)}</small>` : ''} <button class="fin-say" data-say="${esc(plainT(t, l))}">🔊</button></li>`);
    let act = '';
    for (const it of X().SPEECH) {
      if (it.act) { act = it.act; out.push(`<li class="act">${esc((TIME.RULES[it.act].name.en || '').replace(/^the /, 'The '))} · «${tHTML(TIME.RULES[it.act].name[l] || '', l)}»</li>`); continue; }
      if (it.echo || it.pick) { const k = it.echo || it.pick, W = echo(k); if (W) line(W[l] || W.es || '', 'elio', null); continue; }
      if (it.bridge) { const T = X().TASKS[it.bridge], yours = (S0.lines || {})[it.bridge]; line(yours || (T.model || {})[l] || '', 'you', (S0.bridges || {})[it.bridge] || ''); continue; }
      if (it.line) { const T = X().LINES[it.line]; if (T) line(pick(T, l), 'elio', null); continue; }
      if (it.laugh) { const Sl = X().SLIP[l] || X().SLIP.es; line(Sl.slip, 'elio slip', null); line(Sl.joke, 'elio', null); continue; }
      if (it.thanks) { const Sl = X().SLIP[l] || X().SLIP.es; line(Sl.right, 'elio', null); }
    }
    const gifts = ['g1', 'g2', 'g3'].filter(g => (S0.gifts || {})[g]);
    const top = gifts.length ? `<h5>At the top of the tower</h5><ol class="fin-sp">${gifts.map(g => `<li class="you"><span class="t">${tHTML((S0.lines || {})[g] || '', l)}</span> <small class="gr">${esc(S0.gifts[g])}</small></li>`).join('')}</ol>` : '';
    return `<div class="mt"><h4 class="ph-h">Elio’s speech <small>${esc(S0.letter || '')}</small></h4><p class="note">The speech he never finished, finished at last on the old theater’s stage, in all three times at once. His lines, and the ones you whispered from the prompter’s box (in your own words).</p>${top}<ol class="fin-sp">${out.join('')}</ol></div>`;
  }
  function addTab() {
    if (typeof UI === 'undefined') return;
    UI.journalTabs = UI.journalTabs || [];
    if (UI.journalTabs.some(t => t.id === 'fin-speech')) return;
    UI.journalTabs.push({ id: 'fin-speech', group: 'story', label: () => (G && done(G.state) ? 'Elio’s speech' : null), html: () => speechHTML(),
      wire(el) { try { (el || document).querySelectorAll('.fin-say').forEach(b => { b.onclick = e => { e.stopPropagation(); try { UI.speak(b.dataset.say); } catch (e2) { /* */ } }; }); } catch (e) { /* */ } } });
    const s = document.createElement('style'); s.id = 'fin-tab-css';
    s.textContent = `.fin-sp { margin: 6px 0 12px; padding-left: 20px; font-size: 14px; line-height: 1.5; } .fin-sp li { margin: 3px 0; } .fin-sp li.act { list-style: none; margin: 10px 0 2px -20px; font-weight: 800; color: #a8532f; }
.fin-sp li.you .t { font-family: "Segoe Print", "Segoe Script", "Comic Sans MS", cursive; color: #2f5f8a; } .fin-sp li.slip .t { text-decoration: underline wavy #c9443a; } .fin-sp .gr { font-weight: 800; color: #a8532f; }
.fin-sp .fin-say { border: 0; background: none; cursor: pointer; font-size: 12px; opacity: .6; padding: 0 2px; }`;
    if (!document.getElementById('fin-tab-css')) document.head.appendChild(s);
  }

  // ------------------------------------------------------------ the music: whichever part of the finale is on (main.js asks first)
  const hasSong = n => typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(n);
  function song() {
    if (api.songOverride) return api.songOverride;
    if (RISE) return hasSong('fin_rise') ? 'fin_rise' : null;
    if (typeof FINCRED !== 'undefined' && FINCRED && FINCRED.on) return FINCRED.song ? FINCRED.song() : null;
    if (typeof FINSTAGE !== 'undefined' && FINSTAGE && FINSTAGE.inside) return FINSTAGE.song ? FINSTAGE.song() : null;
    if (clockOn) return hasSong('fin_clock') ? 'fin_clock' : null;
    return null;
  }
  let clockOn = false;

  // ------------------------------------------------------------ every frame (main.js): the rise's screen, the credits' screen, the
  // people in Alba afterwards (shown in today's world only, turning to you)
  let postWas = null, rollT = 0;
  function tick(dt, t) {
    if (!G) return;
    try { riseFrame(dt); } catch (e) { console.error('[finale] rise', e); finishRise(); }
    if (typeof FINCRED !== 'undefined' && FINCRED && FINCRED.frame) { try { FINCRED.frame(dt); } catch (e) { console.error('[finale] credits', e); } }
    const on = postOn();
    if (on !== postWas) { postWas = on; showPost(on); }
    // (a save from after the speech but before the credits ended: the credits roll, the next time you're out in the world)
    if (on && !st().credits && !STORY.busy && !STORY.line && !(typeof FINCRED !== 'undefined' && FINCRED && FINCRED.on) && !G.journalOpen && (rollT += dt) > 2) {
      rollT = 0; STORY.run(async () => { lock(true); try { if (typeof FINCRED !== 'undefined' && FINCRED && FINCRED.roll) await FINCRED.roll(); st().credits = true; G.save(); } finally { lock(false); } });
    }
    if (on && POST) {
      const Y = G.sim.you;
      for (const k of ['elio', 'noa', 'dad']) {
        const P = POST[k]; if (!P) continue;
        const a = P.api, near = Math.hypot(Y.x - a.x, Y.z - a.z) < 4.5;
        P.body.position.y = a.talking ? Math.abs(Math.sin(t * 12 + P.ph)) * 0.05 : 0;
        P.body.rotation.z = Math.sin(t * 1.2 + P.ph) * 0.03;
        P.g.rotation.y = dampAngle(P.g.rotation.y, near || a.talking ? Math.atan2(Y.x - a.x, Y.z - a.z) : a.yaw, 4, dt);
      }
    }
  }

  // ------------------------------------------------------------ init (main.js, after TIME's)
  function init(game) {
    G = game;
    try { css(); } catch (e) { /* */ }
    if (typeof STORY !== 'undefined' && STORY.extra && !STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER);
    try { addTab(); } catch (e) { console.error('[finale] journal', e); }
    try { if (typeof TIME !== 'undefined' && TIME.effect) TIME.effect('fin.theater', { region: 'alba', when: s => done(s), show: { now: () => banner() } }); } catch (e) { console.error('[finale] banner', e); }
    try { if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['エリオ', 'ノア', 'オーロラ', 'フェリックス', 'ロサ', 'ラミロ', 'タデオ', 'サミ', 'ブルーノ', 'マルタ', 'ルセロ']); } catch (e) { /* */ }
    if (typeof FINSTAGE !== 'undefined' && FINSTAGE && FINSTAGE.init) { try { FINSTAGE.init(game); } catch (e) { console.error('[finale] stage', e); } }
    if (typeof FINCRED !== 'undefined' && FINCRED && FINCRED.init) { try { FINCRED.init(game); } catch (e) { console.error('[finale] credits', e); } }
  }

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the save goes to the test slot)
  // setup(): the Gray Marsh done and reported (T4c's setup when it's there, else the Sunken Ruins' and the marsh's echoes given), every
  // echo in, the tower's door after the fall; at(step): 'climb' (nothing done) · 'top' (risen) · 'won' (the battle won: Elio free) ·
  // 'stage' (the clock struck eight) · 'act2' · 'act3' · 'laugh' · 'after' · 'done'
  function setup(o = {}) {
    const g = G;
    try {
      if (typeof MARSHT !== 'undefined' && MARSHT && MARSHT._ && MARSHT._.t && MARSHT._.t.setup) { MARSHT._.t.setup(); if (MARSHT._.t.at) { try { MARSHT._.t.at('future.top'); } catch (e) { /* */ } } }
      else if (typeof RUINT !== 'undefined' && RUINT && RUINT._ && RUINT._.t) RUINT._.t.setup();
    } catch (e) { console.error('[finale] setup', e); }
    if (typeof CH4 !== 'undefined') for (const r of CH4.ORDER) for (const w of ['past', 'future']) { CH4._.t.give(r, w); TIME.state(r, w).reported = true; }
    try { TIME.seen('ch4.open', true); } catch (e) { /* (Chapter 4's opening at the pond: long done by now) */ }
    const f = g.state.flags;
    Object.assign(f, { bells: Math.max(f.bells || 0, 8), oldDoor: true, oldBag: true, towerLost: true, pastIn: true, pastDone: true, futureIn: true, futureDone: true });
    delete f.towerHealed;
    const S0 = st(); for (const k of Object.keys(S0)) delete S0[k];
    const main = typeof QUESTS !== 'undefined' && QUESTS.LIST.find(q => q.id === 'main');
    if (main && !main.steps.some(x => x.fin)) { for (let i = main.steps.length - 1; i >= 0; i--) if (main.steps[i].ch4 === 'soon') main.steps.splice(i, 1); main.steps.push(...STEPS); }
    for (const s0 of STEPS) { s0.done = s0._fdone; s0._tt = true; }
    TIME._.fast.on = true; try { TIME.refresh(); } catch (e) { /* */ }
    return ready(g.state);
  }
  function at(step) {
    const S0 = st(), order = ['climb', 'top', 'won', 'stage', 'act2', 'act3', 'laugh', 'after', 'done'], i = order.indexOf(step);
    if (i >= 1) { S0.rose = true; G.state.flags.towerHealed = true; try { OLDTOWER._.applyYard(); } catch (e) { /* */ } }
    if (i >= 2) S0.top = true;
    if (i >= 3) S0.clock = true;
    if (i >= 4) { S0.act = 2; S0.bridges = Object.assign({ b1: 'S', b2: 'S', b3: 'S' }, S0.bridges); }
    if (i >= 5) { S0.act = 3; S0.bridges.b4 = S0.bridges.b4 || 'S'; }
    if (i >= 6) { S0.act = 4; Object.assign(S0.bridges, { b5: 'S', b6: 'S', b7: 'S' }); }
    if (i >= 7) { S0.bridges.b8 = 'S'; S0.speech = true; S0.letter = avg(Object.values(S0.bridges)); }
    if (i >= 8) S0.credits = true;
    try { if (typeof QUESTS !== 'undefined' && QUESTS.tick) QUESTS.tick(); } catch (e) { /* */ }
    return step;
  }
  function near(id) {
    const Y = G.sim.you, put = (x, z, yaw) => { Y.x = x; Y.z = z; if (yaw !== undefined) Y.yaw = yaw; G.sim.snap(); G.cam.snap(Y.yaw, 0.28, 8.5); return { x, z }; };
    if (id === 'door') { const D = OLDTOWER.yard && OLDTOWER.yard.door; if (D) { Y.y = D.y; return put(D.x, D.z + 1.6, Math.PI); } }
    if (id === 'theater') return put(DOOR.x, DOOR.z + 0.9, Math.PI);
    if (POS[id]) return put(POS[id].x + 0.6, POS[id].z + 1.6, Math.PI);
    return null;
  }
  const drv = () => (typeof MOLT !== 'undefined' && MOLT && MOLT._ && MOLT._.t && MOLT._.t.drv) || null;
  // the right page out of a pick (tests): the button whose label is the wanted echo
  function pickRight(k) { const W = echo(k); if (!W) return false; const want = plainT(pick(W, lang()), lang()); const b = [...document.querySelectorAll('#choose button[data-i]')].find(x => (x.textContent || '').includes(want.slice(0, 18))); if (b) { b.click(); return true; } return false; }
  // run a scene inside STORY.run, resolved when it ends
  const run = fn => new Promise(r => { STORY.run(async () => { try { await fn(); } finally { r(); } }); });
  // the final act's places, until Elio's speech is given: the Old Tower, inside the Hush (fb_realm.js) and the old theater at eight.
  // The world's own notices (the radio's new week, a pen pal's letter, a phone message) wait until you're out (quiz.js, life.js, phone.js)
  function quiet() {
    try {
      if (!G || !G.state || finOf(G.state).speech) return false;
      return !!((typeof OLDTOWER !== 'undefined' && OLDTOWER.inside) || (typeof FBREALM !== 'undefined' && FBREALM.inside) || (typeof FINSTAGE !== 'undefined' && FINSTAGE.inside));
    } catch (e) { return false; }
  }

  const api = {
    init, tick, song, door, climb, won, bossSlot, clockAtEight, giveBack, ask, grade, avg, say, demo, think, you, echo, st, finOf, ready, stageOpen, done, nameOf, plainT, tHTML, fillMimo, quiet,
    person, place, faceTo, drawPerson, Kit, KG, glow, TINT, INK, ELIO_LOOK, NOA_LOOK, BRUNO_LOOK, swirl, sleep, fast, shot, lock, css, STEPS, DOOR,
    beats: {}, bossDone: null, songOverride: null,
    get RISE() { return RISE; }, get clockOn() { return clockOn; }, set clockOn(v) { clockOn = !!v; },
    _: { rise, finishRise, riseFrame, speechHTML, buildPost, showPost, postTalk, banner, PROVIDER, topRoom, hoodName, homeT,
      t: { setup, at, near, pickRight, run, get drv() { return drv(); }, skipRise() { if (RISE) RISE.t = RISE_T - 0.7; } } },
  };
  return api;
})();
