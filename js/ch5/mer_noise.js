'use strict';
// Chapter 5, «Meridiana» (CH5-W1): the noise and its creatures, the mirror of the Hush: everyone talks at once and nobody listens.
//   The creatures: «bullicios» (pt tagarelas, de Krachmacher, zh 闹闹, ja ガヤ): jagged speech balloons in loud colors with megaphone
//   mouths, made of the shouting around them; two bosses, el Megáfono (the university's lecture) and el Gran Pregón (the market).
//   The rule, «say it another way»: they echo what they hear. Each command is compared with the last one you gave, facet by facet: the
//   verb's word (golpea / pega), how you named the target (its color, its size, where it stands, «el que…», a part), the frame (a bare
//   command, «¿Puedes…?», «Necesito que…», «Hay que…», «¿Y si…?», «Vamos a…»; de «Kannst du…?», «Du musst…», «Lass uns…»; zh 请 /
//   能不能 / 帮我 / 快; ja 〜てください / 〜てくれる？ / 〜てほしい), and whether it's a chain. No change: ECHO ×0.5; one: ×1.25; two: ×1.6;
//   three or more: ×2 «said another way». The same words again are blocked (as in every fight). A plain, correct, varied sentence always
//   wins: an echo only costs damage.
//   Everything goes through the battle's seams (BATTLE._: LANGS species, M build / pose, tac.judgeHooks / beginHooks / afterHooks,
//   UI.preview, P.parse while a noise fight runs, arenaBuilders 'mer_street' / 'mer_campus' / 'mer_market'); no battle file changes.
//   DIN.fight(specs, o) · DIN.groups (the overworld's, per pad) · DIN.dots(pad) · DIN.rule (tests: facets, frames, mult)
const DIN = (() => {
  if (typeof BATTLE === 'undefined' || !BATTLE._ || typeof MER === 'undefined' || !MER || typeof THREE === 'undefined') return null;
  const _ = BATTLE._, KINDS = ['din', 'din_meg', 'din_preg'], INK = '#2b2235';
  const COL = { red: '#ff5a6a', blue: '#4f8fff', green: '#3ee08a', yellow: '#ffd23f', white: '#efeaff' };
  let G = null;
  const FX = { on: false, last: null, lastKey: null, cache: {}, LASTR: null, echoNext: null };
  // ------------------------------------------------------------ the model: a jagged balloon, eyes, a megaphone mouth, little feet (merged: 2 draw calls)
  function burstGeo(r0, r1, n, depth, seed) {
    const sh = new THREE.Shape(), R = rng(seed);
    for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 + 0.2, r = (i % 2 ? r0 : r1) * (0.9 + R() * 0.2), x = Math.cos(a) * r, y = Math.sin(a) * r * 0.86; if (i) sh.lineTo(x, y); else sh.moveTo(x, y); }
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 1, steps: 1 });
    g.translate(0, 0, -depth / 2); g.computeVertexNormals(); return g;
  }
  const GEO = {};
  const geo = (k, f) => GEO[k] || (GEO[k] = f());
  const CONE = () => geo('cone', () => new THREE.ConeGeometry(1, 1, 12, 1, true).rotateX(Math.PI / 2));
  const BALL = () => geo('ball', () => new THREE.SphereGeometry(1, 10, 8));
  const DISC = () => geo('disc', () => new THREE.CircleGeometry(1, 14));
  function pieces(kind, color, k) {
    const c = COL[color] || COL.red, P = [], M4 = TK.M4;
    const add = (g, m, col, ink = true) => P.push({ g, m, col, ink });
    if (kind === 'din_meg') {      // a great megaphone that walks on its handle, eyes on its side, the bell's mouth forward
      add(geo('megbody', () => new THREE.CylinderGeometry(0.5, 1.55, 3.2, 18, 1, true).rotateX(Math.PI / 2)), M4(0, 1.9, 0.2, 1, 1, 1), '#ff7a3c');
      add(DISC(), M4(0, 1.9, 1.81, 1.5, 1.5, 1), '#2b2235', false);
      add(BALL(), M4(0, 1.9, -1.4, 0.55, 0.55, 0.4), '#ffd23f');
      add(geo('megh', () => new THREE.BoxGeometry(0.5, 1.4, 0.5)), M4(0, 0.75, -0.6, 1, 1, 1), '#3a3440');
      for (const s of [-1, 1]) { add(BALL(), M4(s * 0.95, 2.75, 0.6, 0.26, 0.3, 0.2), '#ffffff', false); add(BALL(), M4(s * 0.98, 2.74, 0.78, 0.12, 0.15, 0.08), INK, false); }
      for (const s of [-1, 1]) add(BALL(), M4(s * 0.5, 0.12, -0.6, 0.32, 0.16, 0.42), '#3a3440');
      return P;
    }
    if (kind === 'din_preg') {     // a totem of three shouting balloons (the market's prices)
      [['#ffd23f', 0.9, 1.0], ['#ff5aa0', 2.15, 0.85], ['#3ee0d0', 3.25, 0.72]].forEach(([cc, y, s], i) => {
        add(geo('burst' + i, () => burstGeo(0.62, 0.86, 9, 0.5, 40 + i)), M4(0, y, 0, s, s, s), cc);
        add(CONE(), M4(0.05, y - 0.05, 0.45 * s, 0.22 * s, 0.22 * s, 0.5 * s), '#3a3440');
        for (const e of [-1, 1]) { add(BALL(), M4(e * 0.26 * s, y + 0.26 * s, 0.3 * s, 0.11 * s, 0.13 * s, 0.06), '#ffffff', false); add(BALL(), M4(e * 0.27 * s, y + 0.25 * s, 0.36 * s, 0.05 * s, 0.07 * s, 0.03), INK, false); }
      });
      for (const s of [-1, 1]) add(BALL(), M4(s * 0.4, 0.12, 0, 0.3, 0.16, 0.38), '#3a3440');
      return P;
    }
    add(geo('burst', () => burstGeo(0.48, 0.66, 9, 0.42, 9)), M4(0, 0.95, 0, 1, 1, 1), c);
    add(geo('tail', () => new THREE.ConeGeometry(0.16, 0.42, 6).rotateZ(Math.PI)), M4(-0.18, 0.38, 0, 1, 1, 1), c);
    add(CONE(), M4(0.06, 0.82, 0.32, 0.2, 0.2, 0.42), '#3a3440');
    add(DISC(), M4(0.06, 0.82, 0.54, 0.19, 0.19, 1), '#2b2235', false);
    for (const e of [-1, 1]) { add(BALL(), M4(e * 0.2, 1.15, 0.24, 0.1, 0.12, 0.05), '#ffffff', false); add(BALL(), M4(e * 0.21, 1.14, 0.28, 0.045, 0.06, 0.03), INK, false); }
    for (const s of [-1, 1]) add(BALL(), M4(s * 0.18, 0.08, 0, 0.12, 0.08, 0.16), '#3a3440');
    return P;
  }
  function mesh(kind, color, size) {
    // (the bosses are built at their own size, a little smaller than life so they never climb into the top of the screen)
    const k = kind === 'din' ? (size === 'big' ? 1.35 : 1) : kind === 'din_meg' ? 0.8 : 0.86, P = pieces(kind, color, k), m = TK.M4(0, 0, 0, k, k, k);
    const solid = TK.merge(P.map(p => ({ geo: p.g, m: m.clone().multiply(p.m), color: p.col })));
    const hull = TK.merge(P.filter(p => p.ink).map(p => ({ geo: p.g, m: m.clone().multiply(p.m).multiply(TK.M4(0, 0, 0, 1.07, 1.07, 1.07)), color: INK })));
    const g = new THREE.Group();
    const a = new THREE.Mesh(solid, TK.toon('#ffffff', { vc: 1, rim: 0.25, side: THREE.DoubleSide })); a.castShadow = true; g.add(a);
    const h = new THREE.Mesh(hull, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })); g.add(h);
    return g;
  }
  // word scraps orbiting a creature: what it has heard (battle only)
  const SCRAP = [];
  const scrapTex = i => SCRAP[i] || (SCRAP[i] = TK.canvasTex(96, 48, (c, w, h) => { c.fillStyle = ['#fff3a0', '#ffd0e8', '#c8f4ff', '#e8ffd0'][i % 4]; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(6, 8); c.lineTo(w - 8, 4); c.lineTo(w - 4, h - 10); c.lineTo(10, h - 6); c.closePath(); c.fill(); c.stroke(); c.lineWidth = 3; for (let k = 0; k < 2; k++) { c.beginPath(); c.moveTo(16, 18 + k * 12); for (let x = 0; x < 7; x++) c.lineTo(16 + x * 9, 18 + k * 12 + ((x + i) % 2 ? 3 : -3)); c.stroke(); } }));
  const anchorsOf = (body, list) => { const a = {}; for (const [n, p] of list) { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); a[n] = o; } return a; };
  function model(o = {}) {
    const kind = o.kind, size = o.size === 'big' ? 'big' : 'small', k = size === 'big' ? 1.35 : 1;
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    body.add(mesh(kind, o.color, size));
    const boss = kind !== 'din', H = boss ? (kind === 'din_meg' ? 2.9 : 3.5) : 1.45 * k;
    const scraps = [];
    for (let i = 0; i < (boss ? 6 : 3); i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: scrapTex(i), transparent: true, depthWrite: false })); s.scale.set(0.5 * k, 0.25 * k, 1); root.add(s); scraps.push({ s, ph: i * 2.1, r: (boss ? 1.9 : 0.85) * k }); }
    const anchors = anchorsOf(body, [['top', [0, H + 0.1, 0]], ['mid', [0, H * 0.55, 0.3 * k]], ['head', [0, H * 0.75, 0.25]], ['face', [0, H * 0.72, 0.4 * k]], ['feet', [0, 0.05, 0]]]);
    return { root, body, scraps, anchors, kind, scale: 1, radius: boss ? 1.6 : 0.55 * k, height: H, parts: [], labelH: H + 0.5, hover: boss ? 0 : 0.3, L: {} };
  }
  function pose(h, F, t) {
    const sd = F.seed || 0, loud = 1 + (F.dinLoud || 0) * 0.12;
    h.body.scale.set((F.sx || 1) * loud, (F.sy || 1) * loud, (F.sx || 1) * loud);
    h.body.position.y = (h.kind === 'din' ? 0.12 + Math.abs(Math.sin(t * 2.6 + sd)) * 0.12 : Math.sin(t * 1.3 + sd) * 0.06);
    h.body.rotation.z = Math.sin(t * 5 + sd) * (h.kind === 'din' ? 0.08 : 0.04) + (F.lean || 0) * 0.3;
    h.scraps.forEach(p => { const a = t * 1.4 + p.ph; p.s.position.set(Math.cos(a) * p.r, h.height * 0.6 + Math.sin(t * 2 + p.ph) * 0.2, Math.sin(a) * p.r * 0.7); p.s.visible = (F.dinHeard || 0) > (h.scraps.indexOf(p)) || h.kind !== 'din'; });
  }
  // ------------------------------------------------------------ the battle's hooks: species, models, icons, lore, voices, arenas, the boss songs
  const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 6 L38 14 L48 9 L48 20 L59 22 L52 31 L60 40 L48 42 L47 53 L37 48 L30 58 L25 47 L13 51 L15 40 L4 34 L13 27 L7 17 L19 17 L21 6 L28 13 Z" fill="#ff5a6a" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="27" r="4" fill="#fff"/><circle cx="38" cy="27" r="4" fill="#fff"/><circle cx="26" cy="28" r="2" fill="#2b2235"/><circle cx="38" cy="28" r="2" fill="#2b2235"/><path d="M27 36 L40 33 L40 43 Z" fill="#2b2235"/></svg>';
  const burstD = (cx, cy, r0, r1, n) => { let d = ''; for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? r0 : r1; d += (i ? ' L' : 'M') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r * 0.86).toFixed(1); } return d + ' Z'; };
  const SVGS = { din: SVG,
    din_meg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M6 25 L38 11 L38 53 L6 39 Z" fill="#ff7a3c" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/><ellipse cx="40" cy="32" rx="8" ry="21" fill="#2b2235"/><rect x="12" y="39" width="7" height="18" rx="2" fill="#3a3440" stroke="#2b2235" stroke-width="2"/><circle cx="18" cy="25" r="4" fill="#fff"/><circle cx="27" cy="22" r="4" fill="#fff"/><circle cx="18" cy="26" r="2" fill="#2b2235"/><circle cx="27" cy="23" r="2" fill="#2b2235"/><path d="M52 21 l8 -4 M53 32 l9 0 M52 43 l8 4" stroke="#2b2235" stroke-width="3" stroke-linecap="round"/></svg>',
    din_preg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' + [['#ffd23f', 48, 15], ['#ff5aa0', 30, 13], ['#3ee0d0', 14, 11]].map(([c, y, r]) => `<path d="${burstD(32, y, r * 0.7, r, 8)}" fill="${c}" stroke="#2b2235" stroke-width="2.5" stroke-linejoin="round"/><circle cx="28" cy="${y - 2}" r="2" fill="#2b2235"/><circle cx="36" cy="${y - 2}" r="2" fill="#2b2235"/>`).join('') + '</svg>' };
  const LORE = { din: { en: 'A bullicio: a scrap of the city’s noise that took a shape. It shouts back whatever it hears. Say it another way and it loses its voice.', es: 'Un bullicio: un pedazo del ruido de la ciudad que tomó forma. Repite a gritos lo que oye. Si lo dices de otra manera, se queda sin voz.' },
    din_meg: { en: 'The Megáfono: a lecture hall’s worth of talking over each other. Only words it hasn’t heard get through.', es: 'El Megáfono: todo un auditorio hablando a la vez. Solo le llegan las palabras que no ha oído.' },
    din_preg: { en: 'The Gran Pregón: every price shouted in the market at once, stacked into a tower. Nobody asks; everybody shouts.', es: 'El Gran Pregón: todos los precios del mercado gritados a la vez, en una torre. Nadie pregunta; todos gritan.' } };
  function hookBattle() {
    for (const [lg, Lg] of Object.entries(_.LANGS || {})) {
      const W = (MERTXT.DIN_WORDS || {})[lg] || MERTXT.DIN_WORDS.es; if (!Lg || !Lg.species || !W) continue;
      for (const k of KINDS) if (W[k] && !Lg.species[k]) { Lg.species[k] = Object.assign({}, W[k]); delete Lg.I; delete Lg.CJ; }
    }
    const M = _.M;
    if (M && !M.merHooked) {
      M.merHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (KINDS.includes(String(k || '')) ? String(k) : k0(k));
      M.build = o => (o && KINDS.includes(o.kind) ? model(o) : b0(o));
      M.pose = (h, F, t, dt) => (h && KINDS.includes(h.kind) ? pose(h, F, t, dt) : p0(h, F, t, dt));
      if (br0) M.brighten = (h, k) => (h && KINDS.includes(h.kind) ? undefined : br0(h, k));
    }
    // their names are words Mimo learns like any creature's: the meet lesson the first time (battle/flow.js meetKind: copy it, teach it),
    // and an item in the language engine (n.din, n.din_meg, n.din_preg), so «el megáfono» reaches the Megáfono once it's taught
    if (_.NEW_KINDS) for (const k of KINDS) if (!_.NEW_KINDS.includes(k)) _.NEW_KINDS.push(k);
    if (typeof LEX !== 'undefined' && LEX.register) {
      const DW = MERTXT.DIN_WORDS || {}, items = [];
      for (const k of KINDS) {
        const id = 'n.' + k; if (LEX.item(id)) continue;
        const it = { id, en: (DW.es && DW.es[k] && DW.es[k].en) || k, g: {}, pl: {}, alt: {}, icon: k, battle: true };
        for (const [l, W] of Object.entries(DW)) { const s = W && W[k]; if (!s) continue; it[l] = s.w; it.g[l] = s.g || 'm'; if (s.pl) it.pl[l] = s.pl; if (s.alt) it.alt[l] = s.alt; }
        items.push(it);
      }
      if (items.length) { LEX.register(items); if (_.ITEMS) for (const it of items) if (!_.ITEMS.some(x => x.id === it.id)) _.ITEMS.push(it); }
    }
    if (typeof ICONS !== 'undefined' && ICONS.add && ICONS.H) {
      const h = ICONS.H, burst = (c, p, col, r0, r1, n) => h.shape(c, p, cx => { for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, r = i % 2 ? r0 : r1; i ? cx.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.86) : cx.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.86); } cx.closePath(); }, col);
      if (!ICONS.keys.includes('din')) ICONS.add('din', (c, p) => { burst(c, p, '#ff5a6a', 22, 34, 9); if (p) { h.eyes(c, -8, 8, -6, 0.8); h.shape(c, 1, h.poly([[-2, 6], [14, 2], [14, 14]]), h.INK, 1.2); } });
      if (!ICONS.keys.includes('din_meg')) ICONS.add('din_meg', (c, p) => { h.shape(c, p, h.poly([[-30, -6], [10, -24], [10, 24], [-30, 6]]), '#ff7a3c'); h.shape(c, p, h.ell(12, 0, 10, 26), '#2b2235'); h.shape(c, p, h.rr(-24, 6, 8, 22, 2), '#3a3440'); if (p) h.eyes(c, -18, -8, -10, 0.7); });
      if (!ICONS.keys.includes('din_preg')) ICONS.add('din_preg', (c, p) => { [['#ffd23f', 20, 13], ['#ff5aa0', -2, 11], ['#3ee0d0', -22, 9]].forEach(([col, y, s]) => { c.save(); c.translate(0, y); burst(c, p, col, s * 0.72, s, 8); c.restore(); }); if (p) h.eyes(c, -4, 4, -24, 0.6); });
    }
    if (_.RW && _.RW.KIND_EN) Object.assign(_.RW.KIND_EN, { din: 'noise-maker', din_meg: 'Megaphone', din_preg: 'Grand Crier' });
    // (the noise stole no words: «Words the Hush let go» is the Hush's, battle/rewards.js pick)
    if (_.RW && _.RW.pick && !_.RW.pick._mer) { const pk0 = _.RW.pick; _.RW.pick = function (f) { return f && KINDS.includes(f.species) ? null : pk0.apply(this, arguments); }; _.RW.pick._mer = true; }
    // (the bestiary's lore: es here, the others from their packs, MERTXT.LORE; never Spanish in another save, English instead)
    if (_.RW && _.RW.LORE) for (const [k, T0] of Object.entries(LORE)) { const key = k === 'din' ? k : 'boss:' + k; if (!_.RW.LORE[key]) _.RW.LORE[key] = ['es', 'pt', 'de', 'zh', 'ja'].map(l => (l === 'es' ? T0.es : ((MERTXT.LORE || {})[l] || {})[k]) || T0.en).concat([T0.en]); }
    if (_.UI && _.UI.ICON) {
      for (const k of KINDS) if (!_.UI.ICON[k]) _.UI.ICON[k] = SVGS[k];
      // (the teach box's picture: battle/ui.js iconFor draws an unknown creature as a part, ICON.part)
      const part0 = _.UI.ICON.part; if (part0 && !part0._mer) { _.UI.ICON.part = function (key) { return KINDS.includes(key) ? SVGS[key] : part0.apply(this, arguments); }; _.UI.ICON.part._mer = true; }
    }
    try { if (typeof BFX !== 'undefined' && BFX.VOICES) { BFX.VOICES.din = BFX.VOICES.din || { m: 70, vow: ['a', 'e', 'a'], len: 0.06, gap: 0.02 }; BFX.VOICES.din_meg = BFX.VOICES.din_meg || { m: 46, vow: ['o', 'a'], len: 0.14, gap: 0.04 }; BFX.VOICES.din_preg = BFX.VOICES.din_preg || { m: 58, vow: ['a', 'o', 'e'], len: 0.1, gap: 0.03 }; } } catch (e) { /* */ }
    try { if (typeof BOSS_MUSIC !== 'undefined' && BOSS_MUSIC.SONG) { BOSS_MUSIC.SONG.din_meg = BOSS_MUSIC.SONG.din_meg || 'mer_boss'; BOSS_MUSIC.SONG.din_preg = BOSS_MUSIC.SONG.din_preg || 'mer_boss'; } } catch (e) { /* */ }
    _.arenaBuilders = _.arenaBuilders || {};
    for (const [id, pal] of Object.entries(ARENA)) if (!_.arenaBuilders[id]) _.arenaBuilders[id] = K => arena(K, pal);
    hookRule();
  }
  // ------------------------------------------------------------ the arenas: a sunny plaza in the city, facades around, the noise's scraps in the air
  const ARENA = {
    mer_street: { fog: '#efe2c8', skyTop: [0.37, 0.65, 0.91], skyHor: [0.96, 0.88, 0.74], floor: ['#e3d6bf', '#d6c8ae'], walls: ['#e8b9a0', '#f2d8a0', '#a9cbb6', '#e4c0d4', '#c9d6e0'] },
    mer_campus: { fog: '#e8e6cf', skyTop: [0.42, 0.68, 0.91], skyHor: [0.95, 0.9, 0.78], floor: ['#a6cf86', '#e3d6bf'], walls: ['#f2e2c4', '#d9c6b0', '#c9d6e0', '#e8d6b8'] },
    mer_market: { fog: '#e2e8e4', skyTop: [0.35, 0.65, 0.89], skyHor: [0.94, 0.92, 0.82], floor: ['#bfb3a0', '#d1c2a6'], walls: ['#3f6f6a', '#f1e0c2', '#9fc9cc'] },
  };
  function arena(K, pal) {
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(pal.fog, 24, 110); scene.background = new THREE.Color(pal.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 0 }, uStainC: { value: new THREE.Vector2(3, 0) } };
    scene.add(new THREE.HemisphereLight('#eef6ff', '#a89878', 0.62));
    const sun = new THREE.DirectionalLight('#fff1d6', 0.8); sun.position.set(6, 16, 9); sun.target.position.set(0, 0, 0);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 }); sun.shadow.bias = -0.0008;
    scene.add(sun, sun.target);
    if (K && K.makeSky) scene.add(K.makeSky({ skyTop: pal.skyTop, skyHor: pal.skyHor }));
    const R = rng(808), Bt = MERB.Batch();
    for (let x = -30; x < 30; x += 2) for (let z = -24; z < 16; z += 2) Bt.box(x + 1, -0.06, z + 1, 1.96, 0.12, 1.96, pal.floor[((x + z) / 2 & 1)], { ink: 0 });
    for (let i = 0; i < 11; i++) { const x = -26 + i * 5.2 + R() * 1.4, h = 6 + R() * 9; Bt.box(x, h / 2, -19 - R() * 3, 5, h, 4, pal.walls[i % pal.walls.length], { ink: 0.05 }); for (let f = 1; f < h / 3; f++) for (const dx of [-1.3, 0, 1.3]) Bt.box(x + dx, f * 3 - 0.6, -16.9 - 0, 0.8, 1.2, 0.12, '#4f6d8f', { ink: 0 }); }
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const h = 5 + R() * 7; Bt.box(s * (24 + R() * 3), h / 2, -12 + i * 7, 4, h, 6, pal.walls[(i + 2) % pal.walls.length], { ink: 0.05 }); }
    Bt.build(scene, { fade: false });
    const clouds = []; for (let i = 0; i < 10; i++) { const n = MERB.noiseCloud(scene, -18 + i * 4, -10 - (i % 3) * 3, 3); n.on = 0.7; clouds.push(n); }
    return { scene, sun, uni, update(dt, t) { uni.uTime.value = t; clouds.forEach(c => c.anim(t)); }, P: pal };
  }
  // ------------------------------------------------------------ the rule: frames (a P.parse wrapper, only in noise fights), facets, the multiplier
  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let MAPS = {};
  // the verbs' forms the frames turn back into the plain command (built per language from the battle's own verb table)
  function verbMaps(L) {
    const key = L.code; if (MAPS[key]) return MAPS[key];
    const inf = {}, subj = {}, pres = {}, l = L.code;
    for (const v of Object.values(L.verbs || {})) {
      const forms = (v.forms || []).map(f => (typeof f === 'string' ? f : '')).filter(f => f && !/\[/.test(f));
      const plain = forms.filter(f => /^[a-zñäöüß]+$/.test(f));
      for (const f of plain) {
        if (l === 'es' || l === 'pt') {
          if (f.endsWith('a')) { const st = f.slice(0, -1); inf[st + 'ar'] = f; pres[f + 's'] = f; const sb = /c$/.test(st) ? st.slice(0, -1) + 'qu' : /g$/.test(st) ? st + 'u' : /z$/.test(st) ? st.slice(0, -1) + 'c' : st; subj[sb + (l === 'es' ? 'es' : 'e')] = f; }
          else if (f.endsWith('e') && !plain.includes(f.slice(0, -1) + 'a')) { const st = f.slice(0, -1); inf[st + 'er'] = f; inf[st + 'ir'] = f; pres[f + 's'] = f; subj[st + (l === 'es' ? 'as' : 'a')] = f; }
        } else if (l === 'de') { if (!/e$/.test(f) || !plain.includes(f.slice(0, -1))) inf[f.endsWith('e') ? f + 'n' : f + 'en'] = f; }
      }
    }
    if (l === 'de') Object.assign(inf, { essen: 'iss', werfen: 'wirf', treten: 'tritt', nehmen: 'nimm', helfen: 'hilf' });
    // (and by the dictionary's lemma: «bater», «bata», «pular» are the verbs of «bate», «pula», whatever the endings say)
    const lem = {};
    try {
      if (typeof DICT !== 'undefined' && DICT.analyze) for (const v of Object.values(L.verbs || {})) {
        const forms = (v.forms || []).map(f => (typeof f === 'string' ? f : '')).filter(f => f && /^[a-zñäöüßçãõáéíóúâêô]+$/i.test(f));
        for (const f of forms) { const x = ((DICT.analyze(f) || {}).words || []).find(t => !t.punct); if (x && x.pos === 'v' && x.lemma && !lem[fold(x.lemma)]) lem[fold(x.lemma)] = forms[0]; }
      }
    } catch (e) { /* (no dictionary: the endings alone) */ }
    return (MAPS[key] = { inf, subj, pres, lem });
  }
  const CLITIC = /(los|las|les|lo|la|le|me|nos)$/;
  const imperOf = (w, map, l, V) => {
    const f = fold(w); if (map[f]) return map[f];
    if (l === 'es') { const m = f.match(CLITIC); if (m && map[f.slice(0, -m[1].length)]) return map[f.slice(0, -m[1].length)]; }
    if (V && V.lem) { try { const x = ((DICT.analyze(w) || {}).words || []).find(t => !t.punct); if (x && x.pos === 'v' && x.lemma && V.lem[fold(x.lemma)]) return V.lem[fold(x.lemma)]; } catch (e) { /* */ } }
    return null;
  };
  // what frame a command is in, and the plain command to parse: { frame, text }
  function frameOf(text, l, L) {
    const raw = String(text || '').trim(), V = L ? verbMaps(L) : { inf: {}, subj: {}, pres: {} };
    const swap = (frame, w, rest, map) => { const im = imperOf(w, map, l, V); return im ? { frame, text: (l === 'es' ? '¡' : '') + im + (rest || '') } : null; };
    let m;
    if (l === 'es') {
      const t = raw.replace(/^[¡¿]+/, '').replace(/[?!]+$/, '').trim();
      if ((m = t.match(/^(?:me\s+|nos\s+|le\s+)?(?:puedes|podrías|podrias|puede|podría|podria)\s+(\S+)(.*)$/i))) return swap('ask', m[1], m[2], V.inf) || { frame: 'imp', text: raw };
      if ((m = t.match(/^(?:necesito|quiero)\s+que\s+(\S+)(.*)$/i))) return swap('need', m[1], m[2], V.subj) || { frame: 'imp', text: raw };
      if ((m = t.match(/^(?:hay\s+que|tienes\s+que|debes|vamos\s+a)\s+(\S+)(.*)$/i))) return swap(/^vamos/i.test(t) ? 'lets' : 'must', m[1], m[2], V.inf) || { frame: 'imp', text: raw };
      if ((m = t.match(/^(?:y\s+)?si\s+(\S+)(.*)$/i))) return swap('if', m[1], m[2], V.pres) || { frame: 'imp', text: raw };
    } else if (l === 'pt') {
      const t = raw.replace(/[?!]+$/, '').trim();
      if ((m = t.match(/^(?:você\s+|voce\s+|cê\s+)?(?:pode|poderia|consegue|dá\s+pra|da\s+pra)\s+(\S+)(.*)$/i))) return swap('ask', m[1], m[2], V.inf) || { frame: 'imp', text: raw };
      if ((m = t.match(/^(?:eu\s+)?(?:preciso|quero)\s+que\s+(?:você\s+|voce\s+)?(\S+)(.*)$/i))) return swap('need', m[1], m[2], V.subj) || { frame: 'imp', text: raw };
      if ((m = t.match(/^(?:você\s+tem\s+que|tem\s+que|precisa|vamos|bora)\s+(\S+)(.*)$/i))) return swap(/^(vamos|bora)/i.test(t) ? 'lets' : 'must', m[1], m[2], V.inf) || { frame: 'imp', text: raw };
    } else if (l === 'de') {
      const t = raw.replace(/[?!.]+$/, '').trim();
      const sep = (frame, mid, w) => { const f = fold(w), pre = (f.match(/^(an|auf|um|zu|weg|los|hoch|ab)(?=\w{4,})/) || [])[1]; const base = pre ? f.slice(pre.length) : f; const im = V.inf[base] || imperOf(base, {}, l, V); return im ? { frame, text: im + ' ' + mid + (pre ? ' ' + pre : '') + '!' } : null; };
      if ((m = t.match(/^(?:kannst|könntest|konntest|kannste)\s+du\s+(.*?)\s*(\S+)$/i))) return sep('ask', m[1], m[2]) || { frame: 'imp', text: raw };
      if ((m = t.match(/^du\s+(?:musst|sollst|solltest)\s+(.*?)\s*(\S+)$/i))) return sep('must', m[1], m[2]) || { frame: 'imp', text: raw };
      if ((m = t.match(/^lass\s+uns\s+(.*?)\s*(\S+)$/i))) return sep('lets', m[1], m[2]) || { frame: 'imp', text: raw };
      if ((m = t.match(/^(?:versuch(?:e)?|probier)\s*(?:mal|doch)?\s*,?\s*(.*?)\s+zu\s+(\S+)$/i))) return sep('try', m[1], m[2]) || { frame: 'imp', text: raw };
    } else if (l === 'zh') {
      let t = raw, frame = 'imp';
      const P = [['ask', /^(你能不能|能不能|你可以|可以|你能)\s*/, /^(ni\s*neng\s*bu\s*neng|neng\s*bu\s*neng|ni\s*ke\s*yi|ke\s*yi|ni\s*neng)\s+/i], ['pol', /^(请你|请|麻烦你|麻烦)\s*/, /^(qing\s*ni|qing|ma\s*fan\s*ni|ma\s*fan)\s+/i], ['need', /^(我要你|我需要你|我想让你)\s*/, /^(wo\s*yao\s*ni|wo\s*xu\s*yao\s*ni|wo\s*xiang\s*rang\s*ni)\s+/i], ['urge', /^(快点|快|赶紧)\s*/, /^(kuai\s*dian|kuai|gan\s*jin)\s+/i], ['help', /^(帮我)\s*/, /^(bang\s*wo)\s+/i]];
      const tl = fold(t);
      for (const [f, re, rr] of P) { if (re.test(t)) { t = t.replace(re, ''); frame = f; break; } if (rr.test(tl)) { t = tl.replace(rr, ''); frame = f; break; } }
      t = t.replace(/\s*(好吗|行吗|吗|吧)\s*([？?！!。]*)$/, '$2').replace(/\s+(hao\s*ma|xing\s*ma|ma|ba)\s*([?!.]*)$/i, '$2');
      return { frame, text: t };
    } else if (l === 'ja') {
      let frame = 'imp', t = raw;
      // (in rōmaji the te-form ends the verb's own word, «utte kudasai»: no word boundary before it)
      const J = [['pol', /([てで])\s*(ください|下さい)/, /(te|de)\s*kudasai(?![a-z])/i], ['ask', /([てで])\s*(くれる|くれない|くれ|もらえる|もらえない|ちょうだい)/, /(te|de)\s*(kureru|kurenai|kure|moraeru|moraenai|chōdai|choudai|chodai)(?![a-z])/i], ['need', /([てで])\s*(ほしい|欲しい)/, /(te|de)\s*hoshii(?![a-z])/i]];
      for (const [f, re, rr] of J) { if (re.test(t)) { t = t.replace(re, '$1'); frame = f; break; } if (rr.test(t)) { t = t.replace(rr, '$1'); frame = f; break; } }
      t = t.replace(/\s*(か|ね|よ)?\s*([？?！!。]*)$/, '$2');
      return { frame, text: t };
    }
    return { frame: 'imp', text: raw };
  }
  // a command's facets: the verb's word, how the target was named, the frame, a chain
  function facets(r, l) {
    const cs = (r.clauses || []).filter(c => c && c.verb), c = cs[0]; if (!c) return null;
    let vw = c.verb;
    if (!(l === 'zh' || l === 'ja')) { const tk = c.verbTok && (c.verbTok.n || c.verbTok.raw) || c.verbShow || ''; let f = fold(tk); if (l === 'es') f = f.replace(CLITIC, ''); vw += ':' + f.slice(0, 4); }
    else {
      // (zh / ja: which of the verb's forms you used; the longest one that's in there, so «殴って» isn't read as the «utte» inside «nagutte»)
      const L = _.LANGS[l], forms = ((L && L.verbs && L.verbs[c.verb] && (L.verbs[c.verb].cj || L.verbs[c.verb].forms)) || []).map(x => (Array.isArray(x) ? x[0] : x));
      const hits = forms.map((fm, i) => { try { return CJK.contains(r.raw || r.canon || '', fm, l) ? { i, n: String(CJK.canon(fm, l)).length } : null; } catch (e) { return null; } }).filter(Boolean).sort((a, b) => b.n - a.n);
      vw += ':' + (hits[0] ? hits[0].i : -1);
    }
    const d = c.desc || {}, way = c.partKey ? 'part:' + c.partKey : c.auto || !d.described ? 'auto' : [d.pos ? 'pos:' + (d.pos.key || d.pos) : '', d.rel ? 'rel' : '', d.pron ? 'pron' : '', d.noun ? 'noun' : '', ...(d.adjs || []).map(a => 'a:' + (a.key || a.k || a.show || ''))].filter(Boolean).sort().join('+');
    return { verb: vw, way, frame: r.frame || 'imp', chain: cs.length > 1 ? 1 : 0 };
  }
  const MULT = [0.5, 1.25, 1.6, 2];
  function compare(a, b) {
    if (!a || !b) return null;
    const n = (a.verb !== b.verb) + (a.way !== b.way) + (a.frame !== b.frame) + (a.chain !== b.chain);
    return { n, mult: MULT[Math.min(3, n)], label: n === 0 ? 'ECHO ½' : n >= 3 ? `SAID ANOTHER WAY ×${MULT[3]}` : `ANOTHER WAY ×${MULT[n]}` };
  }
  const keyOf = r => { try { return _.P.tokenize(r.canon || '').map(t => t.n).join(' '); } catch (e) { return ''; } };
  // a creature that echoed you shouts your words back: «¡…, golpea al rojo!» (es), «… hau den Roten!» (de), 「……打红的！」 (zh / ja)
  function echoShout(raw, l) {
    const s = String(raw || '').replace(/[<>&]/g, ''), bare = s.replace(/[¡!¿?。！？、，,.«»「」]/g, ' ').replace(/\s+/g, ' ').trim();
    const cj = (l === 'zh' || l === 'ja') && /[぀-ヿ㐀-鿿]/.test(bare);
    const tail = cj ? bare.replace(/\s+/g, '').slice(-4) : bare.split(' ').slice(-2).join(' ');
    return cj ? `「${s}」……${tail}！` : l === 'es' ? `«${s}»… ¡${tail}!` : `«${s}»… ${tail}!`;
  }
  // the foes' labels never pile up. FB1's rule for its hoods (fb_boss.js goonsIn: front to back, each label clear above the one in front
  // of it), done on the screen, right after battle/ui.js has placed them each frame: in world units the back labels climb into the top
  // bar's clamp and pile up there again. A label that would sit on one in front of it goes up over it, or, with no room under the top
  // bar, beside it (kept on the screen). Whatever the stack's height, the sizes and the camera. And every label, a big boss's too, stays
  // whole on the screen: its sides in, its top well clear of the top bar and the rung (its HP bar under it, inside the label).
  function unpile() {
    const U = _.UI && _.UI.U; if (!U || !U.labels || !U.labels.size) return;
    const W = innerWidth, list = [], GAP = 4;
    const rung = U.e && U.e.rung && !U.e.rung.hidden ? U.e.rung.getBoundingClientRect().bottom : 0, minTop = Math.max(48, rung) + 14;
    for (const [f, el] of U.labels) {
      if (!el || f.hidden || el.style.display === 'none') continue;
      const m = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(el.style.transform || ''); if (!m) continue;
      const w = el.offsetWidth, h = el.offsetHeight, x = Math.max(8 + w / 2, Math.min(W - 8 - w / 2, +m[1])), y = Math.max(minTop + h, +m[2]);
      if (x !== +m[1] || y !== +m[2]) el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`;
      list.push({ f, el, x, y, w, h });
    }
    if (list.length < 2) return;
    list.sort((a, b) => (b.f.hz || 0) - (a.f.hz || 0) || b.y - a.y);          // front first
    const done = [], hit = L => done.find(o => L.x - L.w / 2 < o.x + o.w / 2 + GAP && L.x + L.w / 2 > o.x - o.w / 2 - GAP && L.y - L.h < o.y + GAP && L.y > o.y - o.h - GAP);
    for (const L of list) {
      const x0 = L.x, y0 = L.y;
      for (let n = 0; n < 8; n++) {
        const o = hit(L); if (!o) break;
        const up = o.y - o.h - GAP;
        if (up - L.h >= minTop) { L.y = up; continue; }
        const right = o.x + o.w / 2 + GAP + L.w / 2, left = o.x - o.w / 2 - GAP - L.w / 2, fitsR = right + L.w / 2 <= W - 8, fitsL = left - L.w / 2 >= 8;
        L.x = (x0 >= o.x && fitsR) || !fitsL ? Math.min(right, W - 8 - L.w / 2) : left;
      }
      if (L.x !== x0 || L.y !== y0) L.el.style.transform = `translate(${Math.round(L.x)}px, ${Math.round(L.y)}px) translate(-50%, -100%)`;
      done.push(L);
    }
  }
  // a boss stands at the back (like a giant: battle/stage.js BOSS_SPOT, a little to the left, so it stands between its noise on the
  // screen and «el del medio» means it), its noise in a row in front of it: its body never fills the front of the shot or climbs over
  // the top bar. (The row's words come from where they stand: battle/parser.js posKeysOf)
  function bossBack() {
    const BG0 = (_.api && _.api.G) || {}, foes = BG0.foes || [], b = foes.find(f => f && (f.species === 'din_meg' || f.species === 'din_preg')); if (!b) return;
    const rest = foes.filter(f => f !== b), spots = (_.STAGE && _.STAGE.rowSpots) ? _.STAGE.rowSpots(rest.length) : [];
    const put = (f, x, z) => { f.hx = x; f.hz = z; f.x = x + 7; f.z = z; };
    put(b, 3.2, -2.6);
    rest.forEach((f, i) => { const s = spots[Math.min(i, spots.length - 1)]; if (s) put(f, s[0], s[1]); });
  }
  function hookRule() {
    const T = _.tac; if (!T || T.merHooked) return; T.merHooked = true;
    const BG = () => (_.api && _.api.G) || {};
    T.beginHooks.push(opts => { FX.on = (opts && opts.foes || []).some(f => KINDS.includes(String(f && f.kind))); FX.last = null; FX.lastKey = null; FX.cache = {}; FX.echoNext = null; if (FX.on) bossBack(); });
    const sync0 = _.UI.sync;
    _.UI.sync = function () { const r = sync0.apply(this, arguments); if (FX.on) { try { unpile(); } catch (e) { console.error('[din] labels', e); } } return r; };
    T.judgeHooks.push(r => {
      if (!FX.on || !r || r.kind !== 'command') return;
      const G0 = BG(), l = G0.lang || 'es';
      // (a command was carried out since the last look: it's the one to compare with)
      if (G0.lastKey && G0.lastKey !== FX.lastKey) { FX.lastKey = G0.lastKey; FX.last = FX.cache[G0.lastKey] || FX.last; }
      const f = facets(r, l); if (!f) return;
      const k = keyOf(r); FX.cache[k] = f;
      const cmp = compare(f, FX.last);
      (FX.keyDin = FX.keyDin || {})[k] = { n: cmp ? cmp.n : null, raw: r.raw || r.canon || '' };
      r.din = cmp ? Object.assign({ facets: f }, cmp) : { facets: f, n: null, mult: 1 };
      FX.LASTR = r;
      if (!cmp) return;
      for (const c of r.clauses || []) { if (!c.target || !KINDS.includes(c.target.species)) continue; c.tacMult = (c.tacMult || 1) * cmp.mult; c.tacSub = c.tacSub || cmp.label; }
    });
    // after their turn: a creature that just echoed you shouts your words back; each one wears the words it has heard
    T.afterHooks.push(async () => {
      if (!FX.on) return;
      const G0 = BG(); for (const f of G0.foes || []) if (f.alive && KINDS.includes(f.species)) f.dinHeard = Math.min(6, (f.dinHeard || 0) + 1);
      const kd = G0.lastKey && FX.keyDin && FX.keyDin[G0.lastKey];
      if (!kd || kd.n !== 0 || FX.shoutKey === G0.lastKey + ':' + G0.turn) return;
      FX.shoutKey = G0.lastKey + ':' + G0.turn;
      const r = kd.raw;
      const f = (G0.foes || []).find(x => x.alive && KINDS.includes(x.species)); if (!f) return;
      try { _.UI.say(f, echoShout(r, G0.lang || 'es'), { cls: 'foe shout', dur: 2.0 }); } catch (e) { /* */ }
      f.dinLoud = Math.min(3, (f.dinLoud || 0) + 1);
    });
    // the parse: frames turned back into the plain command (the bubble keeps what you typed)
    const P = _.P, parse0 = P.parse;
    P.parse = function (text, ctx) {
      if (!FX.on) return parse0.call(this, text, ctx);
      FX.LASTR = null;
      const G0 = BG(), fr = frameOf(text, G0.lang || 'es', G0.L);
      const r = parse0.call(this, fr.text, ctx);
      if (r && r.ok !== false) { r.frame = fr.frame; if (fr.text !== text) r.raw = text; }
      return r;
    };
    // the grade pill while you type: the rule's word on it
    const U = _.UI, pv0 = U.preview;
    U.preview = function (html) {
      if (FX.on && html && FX.LASTR && FX.LASTR.din) {
        const d = FX.LASTR.din;
        if (d.n === 0) { let ex = ''; try { ex = MERTXT.q('{askEx}', BG().lang || 'es'); } catch (e) { /* */ } html += ` <span class="warn">· ECHO: they heard that already! Say it another way (another verb, another way to name it${ex ? ', ' + ex.replace(/[<>&]/g, '') : ''})</span>`; }
        else if (d.n) html += ` <span class="bonus">· ↻ ${d.n >= 3 ? 'said another way' : 'another way'} ×${d.mult}</span>`;
      }
      return pv0.call(this, html);
    };
  }
  // ------------------------------------------------------------ fights: the noise's own song for ordinary ones
  let fighting = false;
  function hookMusic() {
    if (typeof Sound === 'undefined' || !Sound.setSong || Sound.setSong._mer) return;
    const s0 = Sound.setSong;
    Sound.setSong = function (n) { if (fighting && (n === 'battle' || /^boss_(es|pt|de|zh|ja)$/.test(String(n))) && Sound.songs && Sound.songs.includes('mer_battle')) n = 'mer_battle'; return s0.call(this, n); };
    Sound.setSong._mer = true;
  }
  const BIOME = { centro: 'mer_street', casa: 'mer_street', uni: 'mer_campus', puerto: 'mer_market' };
  async function fight(specs, o = {}) {
    const Y = G.sim.you;
    fighting = true;
    // (their hearts follow Mimo's strength: a post-game Mimo hits hard, and a noise fight should still take a few sentences)
    let pw = 1; try { pw = Math.max(1, (_.RW && _.RW.mimo && _.RW.mimo().power) || 1); } catch (e) { pw = 1; }
    try { return await G.fight({ foes: specs.map(s => Object.assign({ size: 'small' }, s, s.hp ? { hp: Math.round(s.hp * pw) } : {})), place: { x: Y.x, z: Y.z, biome: o.biome || BIOME[MER.cur] || 'mer_street' }, boss: o.boss }); }
    finally { fighting = false; }
  }
  // ------------------------------------------------------------ the overworld: groups of bullicios on the pads (shown once the story has them)
  const GROUPS = {};
  function group(id, def) { GROUPS[id] = Object.assign({ id, hp: 6, respawn: 720 }, def); return GROUPS[id]; }
  const S = () => MER.S();
  const cleared = id => { const c = (S().din || {})[id]; if (!c) return false; const g = GROUPS[id]; if (g.story || g.respawn <= 0) return true; return (G.state.time || 0) - c < g.respawn; };
  function visible(g) { try { return MER.inside && MER.cur === g.pad && (!g.show || g.show(S())) && !cleared(g.id); } catch (e) { return false; } }
  function buildGroup(g) {
    if (g.root) return g.root;
    const b = MER.built(g.pad); if (!b) return null;
    g.root = new THREE.Group(); g.root.position.set(g.x, 0, g.z); b.root.add(g.root);
    g.cr = g.foes.map((f, i) => { const m = mesh('din', f.color, f.size); const a = i / g.foes.length * Math.PI * 2; m.position.set(Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4); g.root.add(m); return { m, ph: i * 1.3 }; });
    g.home = { x: g.x, z: g.z }; g.alert = 0;
    return g.root;
  }
  let fightCool = 0;
  function tick(dt, t, pad) {
    fightCool = Math.max(0, fightCool - dt);
    const Y = G.sim.you, P0 = MER.PADS[pad];
    for (const g of Object.values(GROUPS)) {
      const on = g.pad === pad && visible(g);
      if (!on) { if (g.root) g.root.visible = false; continue; }
      buildGroup(g); g.root.visible = true;
      const lx = Y.x - P0.x, lz = Y.z - P0.z, dx = lx - g.root.position.x, dz = lz - g.root.position.z, d = Math.hypot(dx, dz);
      // they hover and bob; the ordinary ones notice you (7 units) and drift after you; touching them starts the fight
      g.cr.forEach((c, i) => { c.m.position.y = 0.15 + Math.abs(Math.sin(t * 2.6 + c.ph)) * 0.15; c.m.rotation.y = Math.atan2(dx, dz); c.m.rotation.z = Math.sin(t * 5 + c.ph) * 0.08; });
      if (g.story) continue;
      g.alert = d < 7 ? Math.min(1, g.alert + dt * 2) : Math.max(0, g.alert - dt);
      const hx = g.home.x - g.root.position.x, hz = g.home.z - g.root.position.z;
      if (g.alert > 0.5 && d > 1.2 && !STORY.busy && !MER.busy) { g.root.position.x += dx / d * dt * 2.6; g.root.position.z += dz / d * dt * 2.6; }
      else if (Math.hypot(hx, hz) > 0.3) { g.root.position.x += hx * dt * 0.6; g.root.position.z += hz * dt * 0.6; }
      if (d < 1.6 && !fightCool && !STORY.busy && !MER.busy && !G.state.teaching) { fightCool = 3; STORY.run(() => battle(g.id)); }
    }
  }
  // a group's fight (story groups are started by their scenes): win, they're gone (the ordinary ones gather again after a while)
  async function battle(id, o = {}) {
    const g = GROUPS[id]; if (!g) return null;
    MER.lock(true);
    try {
      const r = await fight(g.foes.map(f => Object.assign({ kind: 'din', hp: g.hp }, f)), o);
      if (r && r.outcome === 'win') { (S().din = S().din || {})[id] = G.state.time || 1; MER.save(); if (g.root) g.root.visible = false; if (g.onWin) await g.onWin(r); }
      else if (g.root) { g.root.position.set(g.home.x, 0, g.home.z); }
      return r;
    } finally { MER.lock(false); }
  }
  // ------------------------------------------------------------ tests: the rule on pairs of commands, in a noise fight that's running (red on the
  // left, blue in the middle, green on the right, all small): [the last command, the next one, how many facets changed (or '>=n')]
  const CASES = {
    es: [['Golpea al rojo', 'Golpea al rojo', 0], ['Golpea al rojo', 'Empuja al rojo', 1], ['Golpea al rojo', 'Golpea al de la izquierda', 1], ['Golpea al rojo', '¿Puedes golpear al rojo?', 1],
      ['Golpea al rojo', 'Necesito que empujes al azul', 3], ['Salta sobre el azul', 'Salta sobre el azul', 0], ['Salta sobre el azul', 'Vamos a saltar sobre el azul', 1], ['Salta sobre el azul', 'Salta sobre el del medio', 1],
      ['Salta sobre el azul', '¿Puedes saltar sobre el bullicio azul?', 2], ['Golpea al verde', 'Golpea al verde y salta sobre el azul', '>=1'], ['¿Puedes golpear al verde?', '¿Puedes golpear al verde?', 0],
      ['¿Puedes golpear al verde?', 'Golpea al verde', 1], ['Empuja al azul', 'Necesito que empujes al azul', 1], ['Golpea al de la derecha', 'Salta sobre el verde', 2], ['Golpea al rojo', 'Hay que golpear al rojo', 1],
      ['Golpea al rojo', 'Pega al rojo', 1]],
    pt: [['Bate no vermelho', 'Bate no vermelho', 0], ['Bate no vermelho', 'Empurra o vermelho', 1], ['Bate no vermelho', 'Bate no da esquerda', 1], ['Bate no vermelho', 'Você pode bater no vermelho?', 1],
      ['Bate no vermelho', 'Preciso que você empurre o azul', 3], ['Pula no azul', 'Pula no azul', 0], ['Pula no azul', 'Vamos pular no azul', 1], ['Pula no azul', 'Pula no do meio', 1],
      ['Pula no azul', 'Você pode pular no barulho azul?', 2], ['Bate no verde', 'Bate no verde e pula no azul', '>=1'], ['Você pode bater no verde?', 'Você pode bater no verde?', 0],
      ['Você pode bater no verde?', 'Bate no verde', 1], ['Empurra o azul', 'Preciso que você empurre o azul', 1], ['Bate no da direita', 'Pula no verde', 2], ['Bate no vermelho', 'Tem que bater no vermelho', 1],
      ['Bate no vermelho', 'Bate no barulho vermelho', 1]],
    de: [['Schlag den Roten!', 'Schlag den Roten!', 0], ['Schlag den Roten!', 'Schieb den Roten!', 1], ['Schlag den Roten!', 'Schlag den Linken!', 1], ['Schlag den Roten!', 'Kannst du den Roten schlagen?', 1],
      ['Schlag den Roten!', 'Du musst den Blauen schieben!', 3], ['Spring auf den Blauen!', 'Spring auf den Blauen!', 0], ['Spring auf den Blauen!', 'Lass uns auf den Blauen springen!', 1],
      ['Spring auf den Blauen!', 'Spring auf den Mittleren!', 1], ['Spring auf den Blauen!', 'Kannst du auf den blauen Krachmacher springen?', 2], ['Schlag den Grünen!', 'Schlag den Grünen und spring auf den Blauen!', '>=1'],
      ['Kannst du den Grünen schlagen?', 'Kannst du den Grünen schlagen?', 0], ['Kannst du den Grünen schlagen?', 'Schlag den Grünen!', 1], ['Schieb den Blauen!', 'Du musst den Blauen schieben!', 1],
      ['Schlag den Rechten!', 'Spring auf den Grünen!', 2], ['Schlag den Roten!', 'Lass uns den Roten schlagen!', 1], ['Schlag den Roten!', 'Schlag den roten Krachmacher!', 1]],
    zh: [['[打|dǎ] [红色|hóng sè] [的|de] ！', '[打|dǎ] [红色|hóng sè] [的|de] ！', 0], ['[打|dǎ] [红色|hóng sè] [的|de] ！', '[推|tuī] [红色|hóng sè] [的|de] ！', 1],
      ['[打|dǎ] [红色|hóng sè] [的|de] ！', '[打|dǎ] [左边|zuǒ biān] [的|de] ！', 1], ['[打|dǎ] [红色|hóng sè] [的|de] ！', '[请|qǐng] [打|dǎ] [红色|hóng sè] [的|de] ！', 1],
      ['[打|dǎ] [红色|hóng sè] [的|de] ！', '[能不能|néng bù néng] [推|tuī] [蓝色|lán sè] [的|de] ？', 3], ['[跳|tiào] [到|dào] [蓝色|lán sè] [的|de] [身上|shēn shang] ！', '[跳|tiào] [到|dào] [蓝色|lán sè] [的|de] [身上|shēn shang] ！', 0],
      ['[跳|tiào] [到|dào] [蓝色|lán sè] [的|de] [身上|shēn shang] ！', '[快|kuài] [跳|tiào] [到|dào] [蓝色|lán sè] [的|de] [身上|shēn shang] ！', 1],
      ['[跳|tiào] [到|dào] [蓝色|lán sè] [的|de] [身上|shēn shang] ！', '[跳|tiào] [到|dào] [中间|zhōng jiān] [的|de] [身上|shēn shang] ！', 1],
      ['[打|dǎ] [绿色|lǜ sè] [的|de] ！', '[打|dǎ] [绿色|lǜ sè] [的|de] [闹闹|nào nao] ！', 1], ['[打|dǎ] [绿色|lǜ sè] [的|de] ！', '[帮|bāng] [我|wǒ] [打|dǎ] [绿色|lǜ sè] [的|de] ！', 1],
      ['[请|qǐng] [打|dǎ] [绿色|lǜ sè] [的|de] ！', '[请|qǐng] [打|dǎ] [绿色|lǜ sè] [的|de] ！', 0], ['[请|qǐng] [打|dǎ] [绿色|lǜ sè] [的|de] ！', '[打|dǎ] [绿色|lǜ sè] [的|de] ！', 1],
      ['[推|tuī] [蓝色|lán sè] [的|de] ！', '[我|wǒ] [要|yào] [你|nǐ] [推|tuī] [蓝色|lán sè] [的|de] ！', 1], ['[打|dǎ] [右边|yòu biān] [的|de] ！', '[跳|tiào] [到|dào] [绿色|lǜ sè] [的|de] [身上|shēn shang] ！', 2],
      ['[打|dǎ] [红色|hóng sè] [的|de] ！', '[揍|zòu] [红色|hóng sè] [的|de] ！', 1], ['[打|dǎ] [红色|hóng sè] [的|de] ！', '[打|dǎ] [红色|hóng sè] [的|de] [闹闹|nào nao] ！', 1]],
    ja: [['[赤|あか]い の を [打|う]って ！', '[赤|あか]い の を [打|う]って ！', 0], ['[赤|あか]い の を [打|う]って ！', '[赤|あか]い の を [押|お]して ！', 1],
      ['[赤|あか]い の を [打|う]って ！', '[左|ひだり] の を [打|う]って ！', 1], ['[赤|あか]い の を [打|う]って ！', '[赤|あか]い の を [打|う]って ください ！', 1],
      ['[赤|あか]い の を [打|う]って ！', '[青|あお]い の を [押|お]して くれる ？', 3], ['[青|あお]い やつ に [跳|と]んで ！', '[青|あお]い やつ に [跳|と]んで ！', 0],
      ['[青|あお]い やつ に [跳|と]んで ！', '[青|あお]い やつ に [跳|と]んで ほしい ！', 1], ['[青|あお]い やつ に [跳|と]んで ！', '[真|ま]ん[中|なか] の やつ に [跳|と]んで ！', 1],
      ['[緑|みどり] の を [打|う]って ！', '[緑|みどり] の ガヤガヤ を [打|う]って ！', 1], ['[緑|みどり] の を [打|う]って ！', '[緑|みどり] の を [叩|たた]いて ！', 1],
      ['[緑|みどり] の を [打|う]って ください ！', '[緑|みどり] の を [打|う]って ください ！', 0], ['[緑|みどり] の を [打|う]って ください ！', '[緑|みどり] の を [打|う]って ！', 1],
      ['[青|あお]い の を [押|お]して ！', '[青|あお]い の を [押|お]して ちょうだい ！', 1], ['[右|みぎ] の を [打|う]って ！', '[緑|みどり] の やつ に [跳|と]んで ！', 2],
      ['[赤|あか]い の を [打|う]って ！', '[赤|あか]い の を [殴|なぐ]って ！', 1], ['[赤|あか]い の を [打|う]って ！', '[赤|あか]い ガヤガヤ を [打|う]って ！', 1]],
  };
  function tests() {
    const G0 = (_.api && _.api.G) || {}, l = G0.lang || 'es', out = { lang: l, pass: 0, fail: 0, fails: [] };
    if (!G0.running || !FX.on) return Object.assign(out, { fail: 1, fails: ['no noise fight running'] });
    const ctx = _.api.ctx ? _.api.ctx() : undefined, cj = (l === 'zh' || l === 'ja') && typeof CJK !== 'undefined';
    const forms = t => (cj ? [CJK.chars(t, { lang: l }), CJK.roman(t, { lang: l })] : [t]);
    for (const [a, b, want] of CASES[l] || []) {
      const A = forms(a), B = forms(b);
      for (let i = 0; i < A.length; i++) {
        let n = null, why = '';
        try { const ra = _.P.parse(A[i], ctx), rb = _.P.parse(B[i], ctx), fa = facets(ra, l), fb = facets(rb, l), c = compare(fb, fa); n = c ? c.n : null; why = JSON.stringify(fa) + ' → ' + JSON.stringify(fb); } catch (e) { why = String(e); }
        const ok = typeof want === 'number' ? n === want : n != null && n >= +String(want).slice(2);
        if (ok) out.pass++; else { out.fail++; out.fails.push(`«${A[i]}» → «${B[i]}»: ${n} (want ${want}) ${why}`); }
      }
    }
    return out;
  }
  function dots(pad) { const out = [], P0 = MER.PADS[pad]; for (const g of Object.values(GROUPS)) if (g.root && g.root.visible && g.pad === pad) out.push({ x: P0.x + g.root.position.x, z: P0.z + g.root.position.z, kind: 'foe', alert: g.alert > 0.5 }); return out; }
  function init(game) { G = game; hookBattle(); hookMusic(); MER.tick(tick); }
  MER.INITS.push(init);
  return { fight, battle, group, GROUPS, dots, model, mesh, KINDS, FX, tests, CASES,
    rule: { frameOf, facets, compare, verbMaps, MULT },
    get fighting() { return fighting; } };
})();
