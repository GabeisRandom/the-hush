'use strict';
// Alba tomorrow (Round T1b, DESIGN.md 18.6; game/TIME.md §15): Chapter 4's Future part in Alba, the healed tomorrow after Chapter 3
// (future.js), grown into a world of its own. With alba_future_text.js (AFTXT: every word, the graders), alba_future_hall.js
// (ALBA_FUT_HALL: the old theater tomorrow, four rooms at y 300, and two interiors), alba_future_boss.js (the Laughing Gallery)
// and alba_future_music.js (its songs).
//   The main path (CH4.steps('alba', 'future')), right after Alba's Past:
//     1 Noa, through the duck pond's three-way crack: one place stayed gray in the healed tomorrow, the old theater
//     2 Marta wants the Festival of Voices held there (her promise first, if «A promise for the festival» isn't done yet)
//     3 plan it: Tito, Sofi and Beto say what they'll do (1st person), you write it in Marta's notebook (3rd person: «Tito tocará…»)
//     4 the theater's sealed doors, in the Old Quarter (the north gate opens in tomorrow): a promise, and «Nadie se reirá»
//     5 inside: the foyer (plans land next turn), the balconies (predictions), the fly loft («si» traps)   (alba_future_hall.js)
//     6 the Laughing Gallery, on the stage (alba_future_boss.js)    7 the echo: «¡Gracias, Alba!» (CH4.word / CH4.give)
//     8 the Festival of Voices in the theater (Marta waits out front)    9 💬 report to Noa at the duck pond's crack
//   The people of tomorrow: Tito and Nico (future.js, older), Beto (the solar tram's driver), Sofi (the painter), Tadeo (the
//   carpenter), and inside: Luci (the new librarian), Sami (the newcomer, afraid to speak), Nilo (the baker's apprentice).
//   Side quests: «The time capsule» (today changes tomorrow), «The dry pond» (a warning from tomorrow changes today), «Sami's
//   first words», «The guest book of tomorrow», «Bread for the festival».
// Progress: TIME.flag('future', 'af.*') (and 'now', 'af.capsule' / 'af.pond'); TIME.state('alba', 'future') for the details;
// grades TIME.grade('af.*'). Test hooks: ALBA_FUT._.t (setup, go, near, check).
const ALBA_FUT = (() => {
  if (typeof TIME === 'undefined' || typeof AFTXT === 'undefined') return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, X = AFTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const isCl = l => l === 'zh' || l === 'ja';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const lock = on => { const g = G(); g.sim.lock = on ? 1 : 0; if (!on) g.cam.override = null; };
  const shot = (pos, look, dur = 0.9) => { G().cam.override = { pos, look, dur }; };
  const mimoName = () => (G() && G().state.mimoName) || 'Mimo';
  const plainT = s => A.plainT(s);
  const esc = s => A.esc(s);
  const down = (letter, n) => 'SABCD'[Math.max(0, Math.min(4, 'SABCD'.indexOf(letter) + n))];
  const F = k => !!TIME.flag('future', k), setF = (k, v = true) => TIME.flag('future', k, v);
  const N = k => !!TIME.flag('now', k);
  const ST = () => TIME.state('alba', 'future');
  const futureDone = () => !!(G() && G().state.flags && G().state.flags.futureDone);
  const inFuture = () => TIME.world() === 'future' && typeof FUTURE !== 'undefined' && FUTURE.inside;
  const HALL = () => (typeof ALBA_FUT_HALL !== 'undefined' ? ALBA_FUT_HALL : null);
  const inHall = () => { const H = HALL(); return !!(H && H.inside); };

  // ------------------------------------------------------------ words in lines: {mimo}, {cat}, {language}
  const LANG_EN = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  const fillMimo = (t, l = lang()) => { const n = mimoName(); return String(t || '').replace(/\{mimo\}/g, isCl(l) && n === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : n); };
  const fillEn = (t, l = lang()) => String(t || '').replace(/\{mimo\}/g, mimoName()).replace(/\{cat\}/g, (X.NAMES.cat['en_' + l] || X.NAMES.cat.en)).replace(/\{language\}/g, LANG_EN[l] || 'it')
    .replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  const nameOf = (id, l = lang()) => { const T = X.NAMES[id]; return T ? plainT(T[l] || T.en) : id; };
  const lineOf = (T, l = lang()) => ({ en: fillEn(T.en, l), [l]: fillMimo(T[l] || '', l) });
  function sayT(p, T) { if (!p || !T) return Promise.resolve(); p.lines = lineOf(T); return STORY.sayInline(p); }
  const say = (p, key) => sayT(p, X.LINES[key]);
  function demo(p, key) {
    const D = X.DEMO[key]; if (!p || !D) return Promise.resolve();
    const T = { en: fillEn(D.en) }; ['es', 'pt', 'de', 'zh', 'ja'].forEach(l => { T[l] = fillMimo(D[l] || '', l); });
    return STORY.demoLine(p, T, X.MARKS[key]);
  }
  function hushed(p, key) { const H = X.HUSH[key], l = lang(); return STORY.sayHushed(p, H[l] || '', H.en, { key: 'af.hush.' + key }); }
  // a two-shot from your side (future_scenes.js's way)
  function frame2(p, side = 1, dist = 4.4) {
    const Y = G().sim.you, dx = p.x - Y.x, dz = p.z - Y.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, y = p.y !== undefined ? p.y : gy(p.x, p.z);
    shot(V((p.x + Y.x) / 2 - ux * dist * 0.55 + uz * side * 2.2, y + 2.4, (p.z + Y.z) / 2 - uz * dist * 0.55 - ux * side * 2.2), V((p.x + Y.x) / 2, y + 1.25, (p.z + Y.z) / 2));
  }

  // ------------------------------------------------------------ a task: the box, graded S–D (one letter down per miss; "I don't
  // know", the whole sentence on «?», counts as two). o: { icon, title, hint, dir (a prediction: what the mask showed) }
  const IFW = { es: 'si', pt: 'se', de: 'wenn', zh: '如果', ja: 'たら' };
  function missMsg(g, frame, chips, model, misses) {
    if (misses >= 2) return `Like this: «${model}»`;
    switch (g.kind) {
      case 'today': return `«${g.heard || '…'}» is today. Tomorrow needs tomorrow’s words: «${frame}» (? shows an example)`;
      case 'positive': return `That’s just what it’s afraid of! Tell it the opposite: «${frame}»`;
      case 'nodir': return `From where? ${chips} (? shows an example)`;
      case 'nosi': return `A trap starts with «${IFW[lang()] || 'if'}» (if): «${frame}»`;
      case 'nofuture': return `If that happens… then what WILL happen? «${frame}»`;
      case 'present': return `That’s a «want», for now. A wish is what you WOULD like: «${frame}»`;
      case 'wrongverb': return `That’s a tomorrow, but not this one: «${frame}»${chips ? ' · ' + chips : ''}`;
      default: return `Not quite… «${frame}»${chips ? ' · ' + chips : ''}`;
    }
  }
  async function ask(key, o = {}) {
    const T = X.TASKS[key], l = lang(); if (!T) return null;
    const frame = plainT(fillMimo((T.frame || {})[l] || '', l)), chips = ((T.chips || {})[l] || []).map(([w, e]) => `${plainT(w)} (${e})`).join(' · ');
    const M = o.dir === 'down' && T.modelDown ? T.modelDown : T.model, modelRaw = fillMimo(M[l] || '', l), model = plainT(modelRaw);
    let misses = 0;
    for (;;) {
      const r = await UI.command({ name: mimoName(), icon: o.icon || 'star', title: fillEn(o.title || T.title, l), verbs: [], model: modelRaw, modelEn: fillEn(M.en, l), placeholder: `«${frame}»`,
        hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}. ${o.hint || 'Tomorrow needs tomorrow’s words.'} Stuck? ? shows the whole sentence.` });
      if (!r || r.cancelled) return null;
      const h = document.getElementById('command-hint'), peeked = !!(h && /^Try/.test(h.textContent || ''));
      const g = X.grade(key, r.text, l, { dir: o.dir });
      if (g.ok) {
        const letter = down(g.letter, misses + (peeked ? 2 : 0));
        let why = String(g.reason || 'tomorrow’s words');
        if (letter !== g.letter && /^(tomorrow’s words|a prediction|a trap|a wish)$/.test(why)) why = peeked ? `${why}, with the example` : `${why}, on another try`;
        UI.toast(`${letter} · ${why}${g.tip ? ' · ' + g.tip : ''}`); snd(letter === 'S' ? 'chest' : 'review');      // (g.tip: an accent tip, P6a)
        try { if (typeof DICT !== 'undefined' && DICT.ready && DICT.ready() && DICT.metAll) DICT.metAll(DICT.analyze(r.text), 'used'); } catch (e) { /* (the dictionary keeps its own count) */ }
        return { letter, text: r.text, g };
      }
      misses++; snd('wrong'); G().sim.mimoSay('…?', 1.4); G().sim.mimo.tiltT = 1.4;
      STORY.think(missMsg(g, frame, chips, model, misses), 6.5);
    }
  }

  // ------------------------------------------------------------ where things are (tomorrow's Alba, the Old Quarter)
  const AT = {
    tram: { x: -16.6, z: -119.9 }, tramSign: { x: -13.0, z: -118.3 }, beto: { x: -13.4, z: -121.7, yaw: 1.25 },
    board: { x: -14.0, z: -134.6 }, easel: { x: 9.3, z: -172.7 }, sofi: { x: 10.6, z: -171.7, yaw: -2.45 },
    capsule: { x: 17.6, z: -176.0 }, grate: { x: 6.2, z: -181.8 },
    door: { x: -13.5, z: -234.75 }, doorSpot: { x: -13.5, z: -233.2 }, tadeo: { x: -16.7, z: -231.3, yaw: 2.45 }, martaFore: { x: -10.3, z: -229.6, yaw: -2.6 },
    forecourt: { x: -13.5, z: -229.8, yaw: Math.PI },
  };
  const crackAt = id => TIME.CRACKS['alba.' + id] || { x: id === 'pond' ? 4.5 : -9.4, z: id === 'pond' ? -168.5 : -128.8 };
  const doorOf = (id, fb) => { try { const g = G(), d = INTERIORS && INTERIORS.doors ? INTERIORS.doors(g).find(q => q.id === id) : null; return d ? { x: d.x, z: d.z, yaw: d.yaw } : fb; } catch (e) { return fb; } };
  const bakeryDoor = () => doorOf('alba-bakery', { x: 3.73, z: -156.93, yaw: -0.25 });
  const libraryDoor = () => doorOf('alba-house-12', { x: -7.65, z: -160.77, yaw: -1.57 });
  // tomorrow's Old Quarter: the road from the north gate and the theater's forecourt (the rest is tomorrow's fog)
  const OQ = [{ x0: -17.6, x1: -2.6, z0: -223.4, z1: -192.0 }, { x0: -22.8, x1: -3.6, z0: -235.2, z1: -221.0 }];
  const inOQ = (x, z) => OQ.some(b => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1);
  const northOpen = () => futureDone() && F('af.noa1');

  // ------------------------------------------------------------ the people of tomorrow, outdoors (past.js's person kit: one mesh
  // and one ink hull each). Tito, Nico, Marta, Rosa and Bruno are future.js's; inside, Luci, Sami and Nilo are the hall's.
  const LOOKS = {
    beto: { skin: '#e6b48c', hair: '#c4552c', hairdo: 'short', dress: '#3d6fa8', vest: '#f2c14e', hat: 'cap', hatColor: '#3d7fd1', h: 1.05 },
    sofi: { skin: '#8a5a3c', hair: '#2a1d1a', hairdo: 'bun', dress: '#f2c14e', apron: '#f4efe4', shawl: '#e0503f', h: 0.99 },
    tadeo: { skin: '#c98e62', hair: '#3a2b26', hairdo: 'short', dress: '#6f5a44', apron: '#a8784e', hat: 'flat', hatColor: '#5a5048', stache: true, hair2: '#3a2b26', h: 1.07 },
  };
  const PPL = {};          // id → { g, body, api, solid, ph }
  function makePerson(id, look, at, parent) {
    if (typeof PAST === 'undefined' || !PAST.API || !PAST.API.personKit) return null;
    const { k, top } = PAST.API.personKit(look), g = new THREE.Group(), body = new THREE.Group(); g.add(body); k.build(body);
    const h = look.h || (look.kid ? 0.78 : 1); g.scale.setScalar(h);
    const y = gy(at.x, at.z); g.position.set(at.x, y, at.z); g.rotation.y = at.yaw || 0; g.visible = false; g.name = 'alba-future-' + id;
    (parent || G().w3d.scene).add(g);
    return { id, g, body, h, ph: (id.length * 1.37) % 6.28, api: { id, name: nameOf(id), x: at.x, y, z: at.z, top: top * h + 0.1, talking: false, yaw: at.yaw || 0 } };
  }
  function person(id) {
    if (PPL[id]) return PPL[id];
    const at = AT[id], P = makePerson(id, LOOKS[id], at); if (!P) return null;
    P.solid = { x: A.OFF, z: A.OFF, _x: at.x, _z: at.z, r: 0.42, time: true }; WORLD.extra.push(P.solid);
    return (PPL[id] = P);
  }
  const papi = id => { const P = person(id); if (P) P.api.name = nameOf(id); return P ? P.api : null; };
  function showPeople(on) { for (const id of Object.keys(LOOKS)) { const P = on ? person(id) : PPL[id]; if (!P) continue; P.g.visible = on; P.solid.x = on ? P.solid._x : A.OFF; P.solid.z = on ? P.solid._z : A.OFF; } }
  function animatePeople(dt, t) {
    const Y = G().sim.you;
    for (const P of Object.values(PPL)) {
      if (!P.g.visible) continue;
      const a = P.api, near = Math.hypot(Y.x - a.x, Y.z - a.z) < 4.5;
      P.body.position.y = a.talking ? Math.abs(Math.sin(t * 12 + P.ph)) * 0.05 : 0;
      P.body.rotation.z = Math.sin(t * 1.2 + P.ph) * 0.03;
      P.g.rotation.y = dampAngle(P.g.rotation.y, near || a.talking ? Math.atan2(Y.x - a.x, Y.z - a.z) : a.yaw, 4, dt);
    }
  }
  // future.js's people (Marta, Tito, Nico…): the Talk item's person
  const futP = id => { const B = typeof FUTURE !== 'undefined' && FUTURE._ && FUTURE._.B(); return (B && B.byId[id]) || null; };

  // ------------------------------------------------------------ tomorrow's things (each a merged mesh and its ink: two draws)
  const Kit = () => CAVES.Kit(), KG = () => CAVES.GEO;
  const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); return sp; };
  const signTex = (lines, o = {}) => TK.canvasTex(o.w || 256, o.h || 160, (c, w, h) => {
    c.fillStyle = o.bg || '#2f4a3c'; c.fillRect(0, 0, w, h); c.strokeStyle = o.rim || '#e8d9b0'; c.lineWidth = 6; c.strokeRect(5, 5, w - 10, h - 10);
    const font = isCl(lang()) ? '"Noto Sans SC","Microsoft YaHei","Yu Gothic",sans-serif' : 'Bahnschrift,"Segoe UI",sans-serif';
    c.fillStyle = o.ink || '#fff7e2'; c.textAlign = 'center'; c.textBaseline = 'middle';
    lines.forEach((s, i) => { let fs = i ? (o.fs2 || 22) : (o.fs || 30); c.font = `800 ${fs}px ${font}`; while (c.measureText(s).width > w - 24 && fs > 12) { fs -= 2; c.font = `800 ${fs}px ${font}`; } c.fillText(s, w / 2, (h / (lines.length + 1)) * (i + 1)); });
  });
  // the solar tram at its stop (the cross street by the main street), its sign, the plaza's notice board, Sofi's easel
  function makeTown() {
    const g = new THREE.Group(); g.name = 'alba-future-town';
    const k = Kit(), GG = KG(), t = AT.tram, y = gy(t.x, t.z);
    k.at(t.x, y, t.z, Math.PI / 2);
    k.box(0, 0.32, 0, 1.9, 0.3, 4.8, '#3f6f62', { ink: 0.02 }).box(0, 1.25, 0, 1.86, 1.6, 4.7, '#f2e6c8', { ink: 0.02 });                   // the floor and the body
    k.box(0, 1.5, 0, 1.92, 0.7, 4.5, '#5a8fb8', { ink: 0.01 }).box(0, 0.62, 0, 1.92, 0.2, 4.72, '#e0503f', { ink: 0.008 });             // the windows' band, a red stripe
    k.box(0, 2.12, 0, 1.7, 0.12, 4.5, '#3f6f62', { ink: 0.015 });                                                                      // the roof
    for (let i = 0; i < 3; i++) k.box(0, 2.24, -1.4 + i * 1.4, 1.5, 0.05, 1.2, '#22345a', { rx: 0.08, ink: 0.008 });                      // the solar panels
    for (const s of [-1, 1]) for (const zz of [-1.6, 1.6]) k.add(GG.cyl, s * 0.86, 0.22, zz, 0.26, 0.12, 0.26, '#2b2235', { rz: Math.PI / 2, ink: 0 });   // the wheels
    k.box(0.95, 1.05, 1.2, 0.04, 1.2, 0.7, '#c9a86a', { ink: 0.006 });                                                                 // the door
    k.free();
    for (let i = -6; i <= 6; i++) for (const s of [-0.55, 0.55]) k.box(t.x + i * 0.9, y + 0.03, t.z + s, 0.06, 0.04, 0.06, '#7a7470', { ink: 0 });      // the rails' spikes
    for (const s of [-0.55, 0.55]) k.box(t.x, y + 0.02, t.z + s, 12, 0.03, 0.08, '#8a8480', { ink: 0 });                                     // the rails
    const s = AT.tramSign, ys = gy(s.x, s.z); k.add(GG.cyl6, s.x, ys + 1.15, s.z, 0.05, 2.3, 0.05, '#3a3036', { ink: 0.008 });
    const b = AT.board, yb = gy(b.x, b.z); for (const d of [-0.62, 0.62]) k.add(GG.cyl6, b.x, yb + 0.8, b.z + d, 0.05, 1.6, 0.05, '#6b4a30', { ink: 0.008 });
    k.box(b.x, yb + 1.25, b.z, 0.08, 0.9, 1.4, '#8a5f3e', { ink: 0.012 }).box(b.x, yb + 1.78, b.z, 0.3, 0.08, 1.6, '#6b4a30', { ink: 0.008 });
    const e = AT.easel, ye = gy(e.x, e.z); k.add(GG.cyl6, e.x - 0.3, ye + 0.75, e.z - 0.1, 0.03, 1.5, 0.03, '#8a5f3e', { rz: 0.15, ink: 0.006 }).add(GG.cyl6, e.x + 0.3, ye + 0.75, e.z - 0.1, 0.03, 1.5, 0.03, '#8a5f3e', { rz: -0.15, ink: 0.006 }).add(GG.cyl6, e.x, ye + 0.7, e.z + 0.25, 0.03, 1.4, 0.03, '#8a5f3e', { rx: -0.3, ink: 0.006 });
    k.box(e.x, ye + 0.92, e.z - 0.05, 0.75, 0.05, 0.08, '#6b4a30', { ink: 0.004 });
    k.build(g);
    // the sign, the board's notices, the painting: canvases (redrawn when the language or the pond changes)
    const plane = (w, h, x, yy, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide })); m.position.set(x, yy, z); m.rotation.y = ry; g.add(m); return m; };
    const signP = plane(0.9, 0.56, s.x, ys + 2.05, s.z, Math.PI / 2), boardP = plane(1.3, 0.8, b.x + 0.05, yb + 1.25, b.z, Math.PI / 2), paint = plane(0.7, 0.55, e.x, ye + 1.24, e.z - 0.02, 0);
    paint.rotation.y = Math.atan2(1.3, 1.0);           // (it faces Sofi and the plaza side; she paints the pond behind it)
    let key = '';
    const draw = () => {
      const l = lang(), full = N('af.pond'); key = l + (isCl(l) && typeof CJK !== 'undefined' && CJK.mode ? CJK.mode(l) : '') + full;
      signP.material.map = signTex([plainT(X.NAMES.tram[l] || X.NAMES.tram.en), '⏱ 5′ · ☀']); signP.material.needsUpdate = true;
      boardP.material.map = signTex([plainT(X.SIGNS.board.lines[0][l] || ''), '♪ ♫'], { bg: '#f4ead2', ink: '#5a3a28', rim: '#8a5f3e', w: 320, h: 200 }); boardP.material.needsUpdate = true;
      paint.material.map = TK.canvasTex(140, 110, (c, w, h) => {
        c.fillStyle = '#9ad1f0'; c.fillRect(0, 0, w, h); c.fillStyle = '#7fbf6a'; c.fillRect(0, 60, w, 50);
        c.fillStyle = full ? '#4fa8cc' : '#c9b69a'; c.beginPath(); c.ellipse(70, 80, 46, 16, 0, 0, TAU); c.fill();
        c.fillStyle = '#fdf8ee'; for (const [x, yy] of [[55, 78], [85, 82]]) { c.beginPath(); c.ellipse(x, yy, 6, 4, 0, 0, TAU); c.fill(); }
        c.fillStyle = '#5f9a45'; c.beginPath(); c.arc(112, 52, 18, 0, TAU); c.fill(); c.fillStyle = '#6b4a30'; c.fillRect(110, 55, 4, 22);
        c.strokeStyle = '#6b4a30'; c.lineWidth = 6; c.strokeRect(0, 0, w, h);
      }); paint.material.needsUpdate = true;
    };
    draw();
    return { obj: g, solids: [{ obox: 1, x: t.x, z: t.z, hw: 2.45, hd: 1.0, rot: 0 }, { x: s.x, z: s.z, r: 0.14 }, { obox: 1, x: b.x, z: b.z, hw: 0.12, hd: 0.72, rot: 0 }, { x: e.x, z: e.z, r: 0.42 }],
      update() { const l = lang(), k2 = l + (isCl(l) && typeof CJK !== 'undefined' && CJK.mode ? CJK.mode(l) : '') + N('af.pond'); if (k2 !== key) draw(); } };
  }
  // the laughing face (the Gallery's masks, on the theater tomorrow and inside it)
  let FACE = null;
  const laughFace = () => FACE || (FACE = TK.canvasTex(128, 128, c => {
    c.fillStyle = '#e9e6ef'; c.beginPath(); c.ellipse(64, 64, 52, 58, 0, 0, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = '#2b2235'; c.stroke();
    c.lineWidth = 6; for (const x of [42, 86]) { c.beginPath(); c.arc(x, 52, 11, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    c.fillStyle = '#2b2235'; c.beginPath(); c.moveTo(28, 72); c.quadraticCurveTo(64, 128, 100, 72); c.quadraticCurveTo(64, 90, 28, 72); c.fill();
    c.fillStyle = '#8d8aa0'; c.beginPath(); c.ellipse(64, 99, 13, 6, 0, 0, TAU); c.fill();
  }));
  // the old theater tomorrow, still gray: its doors sealed with Hush (felt-gray, breathing), three laughing masks over them, gray
  // motes; the seal melts with your words (af.seal)
  function makeGrayTheater() {
    const g = new THREE.Group(), d = AT.door, y = gy(d.x, d.z); g.name = 'alba-future-gray-theater';
    const seal = new THREE.Group(); seal.position.set(d.x, y, d.z + 0.14); g.add(seal);
    for (let i = 0; i < 12; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: i % 2 ? '#8f8aa3' : '#a29db4', transparent: true, opacity: 0.95, depthWrite: false })); sp.position.set(((i % 4) - 1.5) * 0.55, 0.5 + Math.floor(i / 4) * 0.75, 0.1); sp.scale.setScalar(1.35); seal.add(sp); }
    const masks = [-3.4, 0, 3.4].map((dx, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.05), new THREE.MeshBasicMaterial({ map: laughFace(), transparent: true, side: THREE.DoubleSide })); m.position.set(d.x + dx, y + 4.1 + (i === 1 ? 0.5 : 0), d.z + 0.2); g.add(m); return m; });
    const n = 70, pos = new Float32Array(n * 3), seeds = []; for (let i = 0; i < n; i++) seeds.push({ x: d.x + (Math.random() - 0.5) * 20, z: d.z + 2 + Math.random() * 9, y: 0.4 + Math.random() * 6, ph: Math.random() * 9 });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: TK.glowTex, color: '#b8b4c8', size: 0.4, transparent: true, opacity: 0.6, depthWrite: false })); pts.frustumCulled = false; g.add(pts);
    let melt = F('af.seal') ? 0 : 1;
    return { obj: g, update(dt, t) {
      const want = F('af.seal') ? 0 : ST().sealHalf ? 0.55 : 1; melt = damp(melt, want, 1.4, dt);
      seal.visible = melt > 0.02; seal.children.forEach((sp, i) => { sp.material.opacity = (0.8 + 0.15 * Math.sin(t * 1.3 + i)) * melt; sp.scale.setScalar((1.3 + Math.sin(t * 0.9 + i) * 0.08) * (0.6 + 0.4 * melt)); });
      masks.forEach((m, i) => { m.rotation.z = Math.sin(t * 2.2 + i * 2) * 0.12; m.position.y = y + 4.1 + (i === 1 ? 0.5 : 0) + Math.sin(t * 1.6 + i) * 0.08; });
      for (let i = 0; i < n; i++) { const m = seeds[i]; pos[i * 3] = m.x + Math.sin(t * 0.2 + m.ph) * 1.2; pos[i * 3 + 1] = y + m.y + Math.sin(t * 0.33 + m.ph * 2) * 0.5; pos[i * 3 + 2] = m.z + Math.cos(t * 0.17 + m.ph) * 1.2; }
      geo.attributes.position.needsUpdate = true;
    } };
  }
  // after the Gallery: the theater dressed for the festival (bunting from its front, lanterns, Sofi's poster on the door)
  function makeLitTheater() {
    const g = new THREE.Group(), d = AT.door, y = gy(d.x, d.z); g.name = 'alba-future-lit-theater';
    const pcs = [], cone = new THREE.ConeGeometry(1, 1, 4), COLS = ['#e2453a', '#ffd84a', '#3f7fc9', '#5fae4f', '#ff8fb1', '#fdf8ee'];
    const lines = [[[d.x - 6.8, y + 5.2, d.z + 0.2], [d.x - 8.5, y + 3.0, d.z + 6.5]], [[d.x + 6.8, y + 5.2, d.z + 0.2], [d.x + 8.5, y + 3.0, d.z + 6.5]], [[d.x - 5, y + 5.6, d.z + 0.2], [d.x + 5, y + 5.6, d.z + 0.2]]];
    lines.forEach(([a, b], j) => { for (let i = 0; i <= 12; i++) { const u = i / 12, x = lerp(a[0], b[0], u), yy = lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 0.7, z = lerp(a[2], b[2], u); pcs.push({ geo: cone, m: TK.M4(x, yy - 0.2, z, 0.2, 0.36, 0.04, Math.atan2(b[0] - a[0], b[2] - a[2]) + Math.PI / 2, Math.PI), color: COLS[(i + j) % COLS.length] }); } });
    for (const s of [-1, 1]) { const x = d.x + s * 8.5, z = d.z + 6.5, yy = gy(x, z); pcs.push({ geo: TK.G.cyl, m: TK.M4(x, yy + 1.6, z, 0.07, 3.2, 0.07), color: '#6b4a30' }); }
    const m = new THREE.Mesh(TK.merge(pcs), TK.toon('#ffffff', { vc: 1, rim: 0.15 })); g.add(m);
    const lights = [-4.5, -1.5, 1.5, 4.5].map(dx => { const s = glow('#ffd28a', 1.4, 0.6); s.position.set(d.x + dx, y + 5.35, d.z + 0.3); g.add(s); return s; });
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.0), new THREE.MeshLambertMaterial({ color: '#ffffff' })); poster.position.set(d.x + 2.25, y + 1.6, d.z + 0.08); g.add(poster);
    let key = '';
    const draw = () => { const l = lang(); key = l; poster.material.map = signTex([plainT(X.SIGNS.poster.lines[0][l] || ''), '♪ ★ ♪'], { bg: '#c9443a', ink: '#fffaf0', rim: '#ffd84a', w: 200, h: 270, fs: 24 }); poster.material.needsUpdate = true; };
    draw();
    return { obj: g, update(dt, t) { if (lang() !== key) draw(); lights.forEach((s, i) => { s.material.opacity = 0.5 + 0.12 * Math.sin(t * 2.4 + i); }); } };
  }
  // the time capsule: today a little mound with a painted stone; tomorrow the same, grassed over, until it's dug up (then the open tin)
  function makeCapsule(kind) {
    const g = new THREE.Group(), c = AT.capsule, y = gy(c.x, c.z); g.position.set(c.x, y, c.z); g.name = 'alba-future-capsule-' + kind;
    const k = Kit(), GG = KG();
    const mound = new THREE.Group(); g.add(mound);
    const mk = Kit(); mk.add(GG.sphere, 0, 0.02, 0, 0.55, 0.14, 0.45, kind === 'now' ? '#7a5a3e' : '#6f8a4a', { ink: 0.01 });
    if (kind === 'future') for (let i = 0; i < 6; i++) mk.add(GG.cone, Math.cos(i) * 0.3, 0.16, Math.sin(i * 1.7) * 0.25, 0.04, 0.22, 0.04, '#5f9a45', { ink: 0 });
    mk.build(mound);
    k.box(0.55, 0.16, -0.2, 0.26, 0.32, 0.16, kind === 'now' ? '#cfc6b8' : '#a8a296', { ry: 0.3, ink: 0.01 });          // the painted stone
    k.add(GG.sphere, 0.55, 0.26, -0.11, 0.06, 0.06, 0.01, '#e2453a', { ink: 0 }).add(GG.sphere, 0.5, 0.2, -0.11, 0.05, 0.05, 0.01, '#3f7fc9', { ink: 0 }).add(GG.sphere, 0.6, 0.18, -0.11, 0.05, 0.05, 0.01, '#ffd84a', { ink: 0 });
    k.build(g);
    if (kind !== 'future') return g;
    // (tomorrow: once it's dug up, the tin stands open by the hole, its notes rolled up inside)
    const open = new THREE.Group(); open.visible = false; g.add(open);
    const ok = Kit(); ok.add(GG.cyl, -0.45, 0.14, 0.2, 0.22, 0.26, 0.22, '#b8c4cc', { ink: 0.01 }).add(GG.cyl, -0.2, 0.06, 0.5, 0.24, 0.04, 0.24, '#a8b4bc', { rx: 0.9, ink: 0.008 });
    for (let i = 0; i < 4; i++) ok.add(GG.cyl6, -0.45 + (i % 2 - 0.5) * 0.1, 0.32, 0.2 + (i > 1 ? 0.06 : -0.06), 0.025, 0.2, 0.025, ['#fdf8ee', '#ffe9b0', '#e8f4ff', '#ffd6e0'][i], { ink: 0 });
    ok.add(GG.sphere, 0, 0, 0, 0.42, 0.06, 0.36, '#3a2a20', { ink: 0 }); ok.build(open);
    return { obj: g, update() { const dug = F('af.capDug'); open.visible = dug; mound.visible = !dug; } };
  }
  // the duck pond's little channel, at its north end: clogged with leaves, or (once Hugo heard the warning) clean, water trickling
  function makeGrate(clean) {
    const g = new THREE.Group(), p = AT.grate, y = gy(p.x, p.z); g.position.set(p.x, y, p.z); g.name = 'alba-future-grate-' + (clean ? 'clean' : 'clogged');
    const k = Kit(), GG = KG();
    for (const s of [-1, 1]) k.box(s * 0.45, 0.12, -0.6, 0.18, 0.24, 1.6, '#9a9488', { ink: 0.01 });
    k.box(0, 0.02, -0.6, 0.72, 0.04, 1.6, clean ? '#4fa8cc' : '#6b5a44', { ink: 0 });
    for (let i = 0; i < 5; i++) k.box(-0.28 + i * 0.14, 0.15, 0.1, 0.03, 0.26, 0.04, '#4a4a52', { ink: 0 });
    k.box(0, 0.28, 0.1, 0.76, 0.04, 0.06, '#4a4a52', { ink: 0.004 });
    if (!clean) for (let i = 0; i < 14; i++) k.add(GG.sphere, (Math.sin(i * 2.3) * 0.32), 0.1 + (i % 3) * 0.07, 0.15 + Math.cos(i * 1.7) * 0.18, 0.12, 0.04, 0.09, ['#8a6a3a', '#a07a3a', '#6f5a2e', '#b08a4a'][i % 4], { ry: i, ink: 0 });
    k.build(g);
    if (!clean) return g;
    const drops = glow('#bfe8ff', 0.7, 0.5); drops.position.set(0, 0.12, 0.35); g.add(drops);
    return { obj: g, update(dt, t) { drops.material.opacity = 0.35 + 0.15 * Math.sin(t * 6); drops.position.z = 0.35 + ((t * 0.8) % 0.4); } };
  }
  // tomorrow's duck pond, full again (future.js hides the town's water: tomorrow's pond is dry unless Hugo was warned), two ducks
  function makePondWater() {
    const g = new THREE.Group(); g.name = 'alba-future-pond';
    const lakes = (G().town && G().town.pond) ? [G().town.pond.A, G().town.pond.B] : [{ x: 6.4, z: -177.2, r: 3.7 }, { x: 12.2, z: -179.6, r: 3.1 }];
    const mat = new THREE.MeshLambertMaterial({ color: '#5fb3d6', transparent: true, opacity: 0.88 });
    for (const L of lakes) { const m = new THREE.Mesh(new THREE.CircleGeometry(L.r - 0.12, 40), mat); m.rotation.x = -Math.PI / 2; m.position.set(L.x, gy(L.x, L.z) + 0.07, L.z); g.add(m); }
    const k = Kit(), GG = KG(), ducks = new THREE.Group(); g.add(ducks);
    for (const [i, L] of lakes.entries()) { const dx = L.x + (i ? -0.6 : 0.8), dz = L.z + (i ? 0.4 : -0.6), yy = gy(L.x, L.z) + 0.1; k.add(GG.sphere, dx, yy + 0.12, dz, 0.24, 0.16, 0.34, '#fdf8ee', { ink: 0.008 }).add(GG.sphere, dx, yy + 0.32, dz + 0.24, 0.12, 0.12, 0.12, i ? '#3f8a5a' : '#fdf8ee', { ink: 0.006 }).add(GG.cone, dx, yy + 0.3, dz + 0.4, 0.05, 0.12, 0.05, '#f2a03a', { rx: Math.PI / 2, ink: 0 }); }
    k.build(ducks, { shadow: false });
    return { obj: g, update(dt, t) { ducks.position.set(Math.sin(t * 0.3) * 0.4, Math.sin(t * 2) * 0.02, Math.cos(t * 0.25) * 0.3); } };
  }

  // ------------------------------------------------------------ the effects: what one world's deeds change in the others
  TIME.effect('albaF.town', { region: 'alba', when: s => !!(s && s.flags && s.flags.futureDone), show: { future: () => makeTown() } });
  TIME.effect('albaF.gray', { region: 'alba', when: s => !!(s && s.flags && s.flags.futureDone) && !F('af.boss'), show: { future: () => makeGrayTheater() } });
  TIME.effect('albaF.lit', { region: 'alba', when: () => F('af.boss'), show: { future: () => makeLitTheater() },
    act: { future: { x: AT.door.x + 2.25, z: AT.door.z + 1.1, r: 1.6, label: 'Read', run: () => readSign('poster') } } });
  TIME.effect('albaF.capsule', { region: 'alba', when: () => N('af.capsule'), show: { now: () => makeCapsule('now'), future: () => makeCapsule('future') },
    act: { now: { x: AT.capsule.x - 0.6, z: AT.capsule.z + 0.6, r: 1.7, label: 'Look', run: async () => STORY.think('The kids’ time capsule is buried here, by the willow. «See you in ten years, box!»', 5) },
      future: s => (F('af.capDug') ? { x: AT.capsule.x - 0.6, z: AT.capsule.z + 0.6, r: 1.7, label: 'Read', run: () => capsuleCard() } : null) } });
  TIME.effect('albaF.pond', { region: 'alba', when: () => N('af.pond'),
    show: { now: () => makeGrate(true), future: () => makePondWater() }, before: { now: () => makeGrate(false) },
    act: { now: { x: AT.grate.x, z: AT.grate.z + 1.0, r: 1.6, label: 'Look', run: async () => STORY.think('The duck pond’s little channel, swept clean. Hugo says he’ll do it every autumn.', 5) },
      future: { x: 4.2, z: -174.6, r: 2.0, label: 'Look', run: async () => STORY.think('The duck pond is full, and the ducks are back. Somebody kept a promise, every autumn.', 5) } } });

  // ------------------------------------------------------------ reading a sign (SIGNS.read: each line in the language, EN on request)
  function readSign(key) {
    const S0 = X.SIGNS[key], l = lang(); if (!S0) return null;
    if (typeof SIGNS !== 'undefined' && SIGNS.read) return SIGNS.read({ tag: S0.tag, lines: S0.lines.map(T => ({ text: plainT(T[l] || T.en), en: T.en })) });
    STORY.think(`«${plainT(S0.lines[0][l] || '')}»`, 4); return null;
  }
  // a person's own lines, in turn
  const chatN = {};
  function chat(id) {
    const p = papi(id); if (!p) return null;
    let list = X.CHAT[id] || [];
    if (id === 'sofi' && N('af.pond')) list = X.CHAT.sofiFull.concat(list);
    if (id === 'tadeo' && F('af.seal')) list = X.CHAT.tadeoAfter;
    if (!list.length) return null;
    return sayT(p, list[(chatN[id] = (chatN[id] || 0) + 1) % list.length]);
  }

  // ------------------------------------------------------------ 1 · Noa, through the duck pond's three-way crack (her voice: the
  // crack flares, her name over it); 9 · the report, the same way
  const noaP = () => { const c = crackAt('pond'); return { id: 'noa', name: nameOf('noa'), x: c.x, y: gy(c.x, c.z) + 0.35, z: c.z, top: 1.95 }; };
  let flareG = null;
  function flare(on) {
    const c = crackAt('pond'), g = G();
    if (!flareG) { flareG = glow('#fff1c8', 4.4, 0); flareG.position.set(c.x, gy(c.x, c.z) + 1.45, c.z); flareG.renderOrder = 5; g.w3d.scene.add(flareG); }
    flareG.visible = on;
    if (on) { g.w3d.fx.sparkle(c.x, gy(c.x, c.z) + 1.5, c.z, 22, ['#ffe6a8', '#d8e4ff', '#fff3c8']); snd('chime'); }
  }
  async function noaScene(keys, after) {
    const g = G(), Y = g.sim.you, c = crackAt('pond'), cy = gy(c.x, c.z), p = noaP();
    lock(true);
    try {
      g.sim.mimo.tiltT = 1.6; flare(true);
      const dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1;
      shot(V(Y.x + dx / d * 2.6 + dz / d * 1.8, cy + 2.2, Y.z + dz / d * 2.6 - dx / d * 1.8), V(c.x, cy + 1.4, c.z), 1.0);
      await wait(1.0);
      for (const k of keys) await say(p, k);
      if (after) after();
      g.save();
    } finally { flare(false); lock(false); }
  }
  const noaStart = async () => { await noaScene(['n.f1', 'n.f2', 'n.f3', 'n.f4'], () => { setF('af.noa1'); TIME.refresh(); }); STORY.think('Through the duck pond’s crack (or the main street’s), into tomorrow. Marta is by the bell tower.', 5.5); };
  const noaReport = async () => { await noaScene(['n.r1', 'n.r2', 'n.r3'], () => { setF('af.report'); }); STORY.think('Alba’s two echoes are free. Molinar’s time cracks are opening, east of Alba.', 5.5); };
  const noaAgain = () => noaScene(['n.again']);

  // ------------------------------------------------------------ 2 · Marta wants the festival in the old theater (her promise first,
  // if «A promise for the festival» isn't done: time_alba.js's scene, so that side quest goes on as it should)
  async function martaScene() {
    const M = futP('marta'); if (!M) return;
    const had = !!TIME.flag('future', 'promised');
    if (!had) { if (typeof TIME_ALBA !== 'undefined' && TIME_ALBA && TIME_ALBA.promiseScene) await TIME_ALBA.promiseScene(); if (!TIME.flag('future', 'promised')) return; }
    lock(true);
    try {
      frame2(M); await wait(0.4);
      if (had) await say(M, 'm.t1');
      await say(M, 'm.t2'); await say(M, 'm.t3'); await say(M, 'm.t4');
      setF('af.marta'); G().save();
    } finally { lock(false); }
    STORY.think('Tito is right here, Sofi paints by the duck pond, Beto drives the tram on the main street. Ask them!', 5.5);
  }
  const martaLine = key => async () => { const M = futP('marta'); if (!M) return; lock(true); try { frame2(M); await say(M, key); } finally { lock(false); } };

  // ------------------------------------------------------------ 3 · the plan: each one says theirs (I'll…), you write it down (they'll…)
  const PLANS = ['tito', 'sofi', 'beto'];
  const plans = () => ST().plans || (ST().plans = {});
  const planN = s => { const P = s && s.worlds && s.worlds.r && s.worlds.r.alba && s.worlds.r.alba.future && s.worlds.r.alba.future.plans; return P ? PLANS.filter(k => P[k]).length : 0; };
  async function planScene(id) {
    const p = id === 'tito' ? futP('tito') : papi(id); if (!p) return;
    lock(true); try { frame2(p, -1); await demo(p, 'd.' + id); } finally { lock(false); }
    const r = await ask('p.' + id, { icon: 'star' });
    if (!r) { STORY.think(`${p.name} is waiting for you to write the plan in Marta’s notebook.`, 4); return; }
    plans()[id] = r.text; TIME.grade('af.plan.' + id, r.letter); snd('page');
    const n = PLANS.filter(k => plans()[k]).length;
    if (n >= 3) { setF('af.plan'); G().save(); await notebookCard(); STORY.think('The festival has a plan! Now: the old theater, in the Old Quarter, past the north gate.', 6); }
    else { G().save(); UI.toast(`Marta’s notebook: ${n}/3 plans`); }
  }
  async function notebookCard() {
    const rows = PLANS.map(id => `<tr><td style="padding:3px 10px;font-weight:800;text-align:left">${esc(nameOf(id))}</td><td style="padding:3px 6px;font-size:17px;text-align:left">«${esc(plans()[id] || '')}»</td></tr>`).join('');
    await UI.card(`<div class="tag">Marta’s notebook · the Festival of Voices</div><table style="margin:8px auto 4px;border-collapse:collapse">${rows}</table><div class="sub" style="font-size:13px;opacity:.8;max-width:360px;margin:0 auto">Music, posters, and a tram for everyone, in tomorrow’s words.</div><div class="sub">E</div>`);
  }
  // who to ask next (the compass): the nearest one whose plan isn't written yet
  function nextPlanner() {
    const Y = G().sim.you, list = PLANS.filter(id => !plans()[id]).map(id => { const p = id === 'tito' ? futP('tito') : (PPL[id] ? PPL[id].api : AT[id]); return p ? { x: p.x, z: p.z, id } : null; }).filter(Boolean);
    list.sort((a, b) => Math.hypot(a.x - Y.x, a.z - Y.z) - Math.hypot(b.x - Y.x, b.z - Y.z));
    const p = list[0]; return p ? { x: p.x, z: p.z, hint: `{mimo} points at ${nameOf(p.id, 'en')}. What will they do at the festival?` } : null;
  }

  // ------------------------------------------------------------ 4 · the sealed doors: Tadeo, the seal's whisper, a promise, «Nadie se reirá»
  const doorP = () => { const d = AT.door; return { id: 'seal', name: '…', x: d.x, y: gy(d.x, d.z) + 0.2, z: d.z + 0.3, top: 2.3 }; };
  async function sealScene() {
    const T = papi('tadeo'), s = ST(); if (!T) return;
    if (!s.sealSeen) {
      lock(true);
      try {
        const d = AT.door, y = gy(d.x, d.z);
        shot(V(d.x + 4.6, y + 2.8, d.z + 7.4), V(d.x, y + 1.6, d.z), 1.0); await wait(0.9);
        await say(T, 't.t1'); await say(T, 't.t2');
        G().sim.mimo.scared = 2.5; await hushed(doorP(), 'seal'); G().sim.mimo.scared = 0;
        frame2(T, 1); await demo(T, 'd.tadeo');
        s.sealSeen = true; G().save();
      } finally { lock(false); }
    }
    if (!s.sealHalf) {
      const r = await ask('s.promise', { icon: 'star' }); if (!r) { STORY.think('The gray doors are still listening…', 4); return; }
      s.sealHalf = r.letter; TIME.grade('af.sealPromise', r.letter);
      lock(true); try { const d = AT.door; G().w3d.fx.sparkle(d.x, gy(d.x, d.z) + 1.4, d.z + 0.4, 18, ['#ffd166', '#fff3a0']); snd('crack'); await wait(0.6); await say(T, 't.half'); } finally { lock(false); }
      G().save();
    }
    const r2 = await ask('s.nadie', { icon: 'star' }); if (!r2) { STORY.think('Half the seal is gone. It’s still afraid everyone will laugh…', 4.5); return; }
    TIME.grade('af.sealNadie', r2.letter);
    lock(true);
    try {
      const d = AT.door, y = gy(d.x, d.z);
      shot(V(d.x + 3.8, y + 2.4, d.z + 5.8), V(d.x, y + 1.5, d.z), 0.8);
      snd('crack'); setF('af.seal'); await wait(1.4); snd('wood'); snd('chime');
      G().w3d.fx.sparkle(d.x, y + 1.6, d.z + 0.4, 26, ['#ffd166', '#fff3a0', '#9ff5e8']);
      await say(T, 't.open');
      G().save();
    } finally { lock(false); }
    STORY.think('The theater is open. Go in (E at its doors).', 4.5);
  }
  function doorRun() {
    if (!F('af.marta') || !F('af.plan')) { STORY.think('The theater’s doors are sealed with gray, cold as felt. Marta wanted a plan first…', 5); return null; }
    if (!F('af.seal')) return sealScene();
    const H = HALL(); return H ? H.enter(0) : null;
  }

  // ------------------------------------------------------------ 8 · the Festival of Voices: Marta out front, then the night inside
  async function festScene() {
    const M = futP('marta'); if (!M) return;
    lock(true); try { frame2(M); await say(M, 'fe.marta1'); } finally { lock(false); }
    const H = HALL(); if (H && H.festival) await H.festival();
    setF('af.fest'); G().save();
    try { if (typeof FSCN !== 'undefined' && FSCN.gather) FSCN.gather(); } catch (e) { /* */ }
    STORY.think('The theater sings again. Noa is waiting at the duck pond’s time crack.', 6);
  }

  // ------------------------------------------------------------ ◆ the time capsule: Beto tomorrow; the kids today, by the willow
  const CAPNOTES = { beto: X.CAPNOTES ? X.CAPNOTES.beto : null, sofi: X.CAPNOTES ? X.CAPNOTES.sofi : null, luci: X.CAPNOTES ? X.CAPNOTES.luci : null };
  async function capAsk() {
    const B = papi('beto'); if (!B) return;
    lock(true); try { frame2(B); await say(B, 'c.beto1'); await say(B, 'c.beto2'); setF('af.capAsked'); G().save(); } finally { lock(false); }
    STORY.think('A time capsule by the duck pond’s willow, that nobody buried… What if someone reminded the kids, today?', 6);
  }
  let KIDS = null;
  const KID_LOOK = { luci: { kid: true, skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'braids', dress: '#8a5ab0', apron: '#c9b3f0', glasses: true, ribbon: '#e86a9a', h: 0.72 },
    beto: { kid: true, skin: '#e6b48c', hair: '#c4552c', hairdo: 'short', dress: '#4f9a5a', hat: 'cap', hatColor: '#3d7fd1', h: 0.78 },
    sofi: { kid: true, skin: '#8a5a3c', hair: '#2a1d1a', hairdo: 'tails', dress: '#f2c14e', ribbon: '#e0503f', h: 0.76 } };
  function kids(on) {
    if (on && !KIDS) { KIDS = {}; const c = AT.capsule; [['luci', { x: c.x - 1.3, z: c.z + 1.3, yaw: 2.5 }], ['beto', { x: c.x + 0.3, z: c.z + 1.7, yaw: Math.PI }], ['sofi', { x: c.x + 1.5, z: c.z + 0.7, yaw: -2.3 }]].forEach(([id, at]) => { const P = makePerson('kid-' + id, KID_LOOK[id], at); if (P) { P.api.name = nameOf(id); KIDS[id] = P; } }); }
    if (KIDS) for (const P of Object.values(KIDS)) { P.g.visible = on; if (on) P.api.name = nameOf(P.id.replace('kid-', '')); }
  }
  async function capToday() {
    const c = AT.capsule, y = gy(c.x, c.z);
    kids(true); if (!KIDS || !KIDS.luci) return;
    lock(true);
    try {
      shot(V(c.x - 3.4, y + 2.6, c.z + 5.0), V(c.x, y + 0.9, c.z + 0.6), 0.9); await wait(0.8);
      await say(KIDS.luci.api, 'c.luci0'); await demo(KIDS.beto.api, 'd.cap'); await say(KIDS.sofi.api, 'c.sofi0'); await say(KIDS.luci.api, 'c.luci1');
    } finally { lock(false); }
    const r = await ask('c.you', { icon: 'star' });
    if (!r) { kids(false); STORY.think('The kids are still waiting for your note, by the willow.', 4); return; }
    TIME.state('alba', 'now').capNote = r.text; TIME.grade('af.capNote', r.letter);
    lock(true);
    try {
      await say(KIDS.luci.api, 'c.bury');
      G().w3d.fx.puff(c.x, y + 0.1, c.z, 10, 0.25, '#8a6a4a'); snd('land', 8); await wait(0.5);
      TIME.flag('now', 'af.capsule', true); TIME.refresh();
      G().w3d.fx.sparkle(c.x, y + 0.5, c.z, 16, ['#fff3a0', '#9ff5a0']); snd('learned'); await wait(0.8);
      G().save();
    } finally { lock(false); kids(false); }
    STORY.think('A time capsule, buried today… Ten years from now, tomorrow, it will still be here.', 6);
  }
  async function capsuleCard() {
    const l = lang(), you = (TIME.state('alba', 'now').capNote) || '…';
    const note = (T, who) => `<div style="margin:6px auto;padding:6px 12px;background:#fffaf0;border-radius:8px;max-width:420px;text-align:left;box-shadow:0 2px 0 rgba(43,34,53,.15)"><span style="font-size:17px">«${T ? (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(T[l] || '', { lang: l }) : esc(T[l] || '')) : esc(who.t)}»</span> <small style="opacity:.65">· ${esc(who.n)}</small></div>`;
    await UI.card(`<div class="tag">The time capsule · ten years later</div>`
      + note(CAPNOTES.beto, { n: nameOf('beto') }) + note(CAPNOTES.sofi, { n: nameOf('sofi') }) + note(CAPNOTES.luci, { n: nameOf('luci') }) + note(null, { t: you, n: 'you' })
      + `<div class="sub" style="font-size:13px;opacity:.8">A tram driver, a painter, a librarian… and you.</div><div class="sub">E</div>`);
  }
  async function capDig() {
    const c = AT.capsule, y = gy(c.x, c.z), g = G(), sim = g.sim, M = sim.mimo;
    const r = await ask('c.dig', { icon: 'dig' }); if (!r) return;
    TIME.grade('af.capDig', r.letter);
    lock(true);
    try {
      shot(V(c.x - 3.0, y + 2.3, c.z + 4.4), V(c.x, y + 0.6, c.z), 0.9);
      sim.mimoGo({ x: c.x + 0.7, z: c.z + 0.6 }, c); await wait(0.8);
      for (let i = 0; i < 4; i++) { M.hop = { t: 0 }; snd('land', 5 + i * 2); g.w3d.fx.puff(c.x + (Math.random() - 0.5) * 0.4, y + 0.1, c.z + (Math.random() - 0.5) * 0.4, 7, 0.22, '#8a6a4a'); await wait(0.32); }
      setF('af.capDug'); TIME.refresh(); snd('chest'); await wait(0.6);
      sim.mimoGo(null, null);
    } finally { lock(false); }
    await capsuleCard();
    g.save();
    STORY.think('Beto would love to see this. He’s at the solar tram’s stop, on the main street.', 5.5);
  }
  async function capTold() {
    const B = papi('beto'); if (!B) return;
    lock(true); try { frame2(B); await say(B, 'c.beto3'); setF('af.capTold'); G().state.coins = (G().state.coins || 0) + 30; UI.toast('+30 coins'); G().save(); } finally { lock(false); }
  }

  // ------------------------------------------------------------ ◆ the dry pond: Sofi tomorrow, Hugo today
  async function pondAsk() {
    const S0 = papi('sofi'); if (!S0) return;
    lock(true); try { frame2(S0); await say(S0, 'p.sofi1'); await demo(S0, 'd.pond'); setF('af.pondAsked'); G().save(); } finally { lock(false); }
    STORY.think('A warning from tomorrow… Hugo sweeps the main street, today.', 5);
  }
  async function hugoWarn(it) {
    const p = it && it.p; if (!p) return;
    lock(true); try { frame2(p); await say(p, 'p.hugo1'); } finally { p.talking = false; lock(false); }
    const r = await ask('p.warn', { icon: 'star' }); if (!r) return;
    TIME.grade('af.pondWarn', r.letter);
    lock(true);
    try { frame2(p); await say(p, 'p.hugo2'); TIME.flag('now', 'af.pond', true); TIME.refresh(); const gr = AT.grate; G().w3d.fx.sparkle(gr.x, gy(gr.x, gr.z) + 0.4, gr.z, 16, ['#bfe8ff', '#fff3a0']); snd('learned'); G().save(); }
    finally { p.talking = false; lock(false); }
    STORY.think('A warning from tomorrow, heard today. How does tomorrow’s duck pond look now?', 5.5);
  }
  const hugoAgain = it => { const p = it && it.p; if (!p) return null; return sayT(p, X.LINES['p.hugo3']); };
  async function pondSeen() {
    const S0 = papi('sofi'); if (!S0) return;
    lock(true); try { frame2(S0); await say(S0, 'p.sofi2'); setF('af.pondSeen'); G().state.coins = (G().state.coins || 0) + 30; UI.toast('+30 coins'); G().save(); } finally { lock(false); }
  }

  // ------------------------------------------------------------ things to press E on (TIME.spot: one world, Alba's region)
  const SP = (id, def) => TIME.spot('albaF.' + id, Object.assign({ region: 'alba' }, def));
  for (const id of Object.keys(LOOKS)) SP('p.' + id, { world: 'future', x: () => (PPL[id] ? PPL[id].api.x : AT[id].x), z: () => (PPL[id] ? PPL[id].api.z : AT[id].z), r: 2.3, label: 'Talk', who: 'future:' + id,
    p: () => papi(id), when: () => futureDone() && !!PPL[id] && PPL[id].g.visible, run: () => chat(id) });
  SP('tram', { world: 'future', x: AT.tram.x - 0.8, z: AT.tram.z - 1.6, r: 1.7, label: 'Look', when: futureDone, run: async () => STORY.think('A little tram with solar panels on its roof. Tomorrow’s Alba runs on sunshine.', 5) });
  SP('tramSign', { world: 'future', x: AT.tramSign.x + 0.7, z: AT.tramSign.z, r: 1.3, label: 'Read', when: futureDone, run: () => readSign('tram') });
  SP('board', { world: 'future', x: AT.board.x + 0.9, z: AT.board.z, r: 1.6, label: 'Read', when: futureDone, run: () => readSign('board') });
  SP('easel', { world: 'future', x: AT.easel.x + 0.6, z: AT.easel.z + 0.6, r: 1.1, label: 'Look', when: futureDone,
    run: async () => STORY.think(N('af.pond') ? 'Sofi’s painting of the duck pond… and behind it, the real one, full of water. They look the same now.' : 'Sofi’s painting: the duck pond full of water, with ducks. The real one, behind it, is dry.', 5.5) });
  SP('bakery', { world: 'future', x: () => bakeryDoor().x, z: () => bakeryDoor().z, r: 1.7, label: 'Go in', when: futureDone, run: () => (HALL() ? HALL().enter('bakery') : null) });
  SP('library', { world: 'future', x: () => libraryDoor().x, z: () => libraryDoor().z, r: 1.7, label: 'Go in', when: futureDone, run: () => (HALL() ? HALL().enter('library') : null) });
  SP('door', { world: 'future', x: AT.doorSpot.x, z: AT.doorSpot.z, r: 2.0, label: () => (F('af.seal') ? 'Go in' : F('af.plan') ? 'The sealed doors' : 'Look'), when: () => northOpen(), run: () => doorRun() });
  SP('capDig', { world: 'future', x: AT.capsule.x - 0.6, z: AT.capsule.z + 0.6, r: 1.8, label: 'Dig', when: () => N('af.capsule') && !F('af.capDug'), run: () => capDig() });
  SP('capToday', { world: 'now', x: AT.capsule.x - 0.6, z: AT.capsule.z + 0.6, r: 1.8, label: 'The time capsule', when: () => F('af.capAsked') && !N('af.capsule'), run: () => capToday() });
  SP('grate', { world: 'now', x: AT.grate.x, z: AT.grate.z + 1.0, r: 1.6, label: 'Look', when: () => futureDone() && !N('af.pond'),
    run: async () => STORY.think(F('af.pondAsked') ? 'The little channel that feeds the duck pond, choked with leaves. Sofi said: warn Hugo…' : 'A little stone channel, full of dead leaves. It feeds the duck pond.', 5) });

  // ------------------------------------------------------------ Talk menus: tomorrow's people (and Hugo, today)
  // Marta's, on their own: while one of these is there, time_alba.js's "The festival" steps aside (one festival entry at a time;
  // her main-quest scene runs the promise first when it isn't done)
  function martaOffers() {
    const out = [], main = (label, run) => out.push({ label, sub: '★ main quest', run });
    if (!G() || !futureDone() || TIME.world() !== 'future') return out;
    if (F('af.noa1') && !F('af.marta')) main('The festival, in the old theater', martaScene);
    else if (F('af.marta') && !F('af.plan')) out.push({ label: 'The notebook', run: martaLine('m.later') });
    else if (F('af.plan') && !F('af.seal')) out.push({ label: 'The theater', run: martaLine('m.plan') });
    if (F('af.boss') && !F('af.fest')) main('The Festival of Voices!', festScene);
    return out;
  }
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || !futureDone()) return null;
    const w = TIME.world(), out = [], main = (label, run) => out.push({ label, sub: '★ main quest', run }), side = (label, run, isNew) => out.push({ label, sub: isNew ? '◆ side quest' : '', run });
    if (w === 'future') {
      if (it.who === 'future:marta') out.push(...martaOffers());
      if (it.who === 'future:tito' && F('af.marta') && !plans().tito) main('The festival’s plan', () => planScene('tito'));
      if (it.who === 'future:sofi') {
        if (F('af.marta') && !plans().sofi) main('The festival’s plan', () => planScene('sofi'));
        if (!F('af.pondAsked')) side('The duck pond', pondAsk, true); else if (N('af.pond') && !F('af.pondSeen')) side('The duck pond', pondSeen, true);
      }
      if (it.who === 'future:beto') {
        if (F('af.marta') && !plans().beto) main('The festival’s plan', () => planScene('beto'));
        if (!F('af.capAsked')) side('When you were kids', capAsk, true); else if (F('af.capDug') && !F('af.capTold')) side('The time capsule', capTold, true);
      }
      if (it.who === 'future:tadeo' && F('af.plan') && !F('af.seal')) main('The sealed doors', sealScene);
    } else if (w === 'now') {
      if (it.who === 'hugo' && F('af.pondAsked')) side('The duck pond', () => (N('af.pond') ? hugoAgain(it) : hugoWarn(it)), !N('af.pond'));
    }
    return out.length ? out : null;
  });

  // ------------------------------------------------------------ the main quest (Chapter 4, Alba's Future: after Alba's Past) and its story
  const fw = (s, k) => !!(s && s.worlds && s.worlds.flags && s.worlds.flags.future && s.worlds.flags.future[k]);
  const nw = (s, k) => !!(s && s.worlds && s.worlds.flags && s.worlds.flags.now && s.worlds.flags.now[k]);
  const at = (o, hint) => (o ? { x: o.x, z: o.z, hint } : null);
  const nearCrack = (ids, hint) => { const Y = G().sim.you; let best = null, bd = 1e9; for (const id of ids) { const c = crackAt(id), d = Math.hypot(Y.x - c.x, Y.z - c.z); if (d < bd) { bd = d; best = c; } } return at(best, hint); };
  const viaFuture = who => { const w = TIME.world(); if (w === 'future') return who(); if (w === 'past') return at(crackAt('pond'), '{mimo} looks at the time crack by the duck pond: tomorrow is through there.'); return nearCrack(['street', 'pond'], '{mimo} looks at the time crack: tomorrow is through there.'); };
  const viaNow = who => { const w = TIME.world(); if (w === 'now') return who(); return w === 'future' ? nearCrack(['street', 'pond'], '{mimo} looks at the time crack: today is through there.') : nearCrack(['yard', 'pond'], '{mimo} looks at the time crack: today is through there.'); };
  const viaTheater = hint => () => { if (inHall()) { const H = HALL(); return H && H.target ? H.target() : null; } return viaFuture(() => at(AT.doorSpot, hint)); };
  const roomsN = s => ['af.foyer', 'af.balc', 'af.loft'].filter(k => fw(s, k)).length;
  const STEPS = [
    { text: 'At the duck pond’s time crack: listen to Noa',
      why: 'Noa can hear every crack from inside the great {w.clock}. The boy’s words are free; now she has something to say about tomorrow. Walk up to the time crack by the duck pond.',
      done: s => fw(s, 'af.noa1'), target: () => at(crackAt('pond'), '{mimo} looks at the time crack by the duck pond. Noa?'), hint: '{mimo} looks at the time crack by the duck pond. Noa?' },
    { text: 'In tomorrow: talk to Marta by the bell tower',
      why: 'Through the duck pond’s time crack (or the main street’s) into tomorrow’s Alba. Marta is planning the Festival of Voices by the bell tower, and she has an idea about where.',
      done: s => fw(s, 'af.marta'), target: () => viaFuture(() => { const M = futP('marta'); return M ? at(M, '{mimo} points at Marta, by the bell tower.') : null; }), hint: '{mimo} points toward the bell tower, in tomorrow.' },
    { text: 'Plan the festival: ask Tito, Sofi and Beto what they’ll do ({n}/3)', n: s => planN(s),
      why: 'Marta wants everyone’s plans in her notebook. Tito is by the bell tower, Sofi paints by the duck pond, Beto drives the tram on the main street. Hear each plan, then write it in tomorrow’s words.',
      done: s => fw(s, 'af.plan'), target: () => viaFuture(() => nextPlanner()), hint: '{mimo} looks around tomorrow’s Alba: Tito, Sofi, Beto…' },
    { text: 'The old theater, past the north gate: open its sealed doors',
      why: 'North of tomorrow’s Alba, through the north gate, in the Old Quarter: the theater is the one gray place left. Tadeo the carpenter is trying to open its doors.',
      done: s => fw(s, 'af.seal'), target: () => viaFuture(() => at(PPL.tadeo ? PPL.tadeo.api : AT.tadeo, '{mimo} points north, past the north gate: the old theater.')), hint: '{mimo} points north, past the north gate: the old theater.' },
    { text: 'Inside the theater: the foyer, the balconies, the fly loft ({n}/3)', n: s => roomsN(s),
      why: 'Gray masks fill tomorrow’s theater. In here, a plan happens next, a prediction sees it coming, and «si» sets a trap. Tadeo knows the way up.',
      done: s => fw(s, 'af.loft'), target: viaTheater('{mimo} points at the theater’s doors.'), hint: '{mimo} points at the theater’s doors.' },
    { text: 'On the stage: face the Laughing Gallery',
      why: 'Rows of gray seats with laughing masks: the fear of being laughed at, grown huge. Elio’s last words are inside it.',
      done: s => fw(s, 'af.boss'), target: viaTheater('{mimo}’s ears go flat. The stage!'), hint: '{mimo}’s ears go flat. The stage!' },
    { text: 'On the stage: Elio’s echo',
      why: 'The Gallery is quiet at last. Something is left on the stage: a light, and a voice.',
      done: s => !!(s && s.ch4 && s.ch4.echoes && s.ch4.echoes['alba.future']), target: viaTheater('{mimo} looks at the light on the stage.'), hint: '{mimo} looks at the light on the stage.' },
    { text: 'Tell Marta the theater is free: the Festival of Voices!',
      why: 'Tadeo ran to fetch Marta. She’s waiting in front of the theater.',
      done: s => fw(s, 'af.fest'), target: () => viaFuture(() => at(AT.martaFore, '{mimo} points at Marta, in front of the theater.')), hint: '{mimo} points at Marta, in front of the theater.' },
    { report: 'noa_af', text: '💬 Report to Noa at the duck pond’s time crack',
      why: 'Both of Alba’s echoes are free. Noa is listening at the duck pond’s three-way crack.',
      done: s => fw(s, 'af.report'), target: () => at(crackAt('pond'), '{mimo} looks at the time crack by the duck pond.'), hint: '{mimo} looks at the time crack by the duck pond.' },
  ];
  STEPS.forEach(st => { st._d0 = st.done; st.alba_future = true; });
  if (typeof CH4 !== 'undefined') {
    CH4.steps('alba', 'future', STEPS);
    CH4.word('alba', 'future', X.ECHO);
    CH4.story('alba', [
      { when: s => fw(s, 'af.noa1'), text: 'Noa spoke through the duck pond’s crack: even in the healed tomorrow, one place stayed gray. The old theater, where the Hush was born.' },
      { when: s => fw(s, 'af.plan'), text: 'In tomorrow’s Alba, everyone had a plan for the Festival of Voices: Tito’s guitar, Sofi’s posters, Beto’s tram. Marta wanted it in the old theater.' },
      { when: s => fw(s, 'af.seal'), text: 'The theater’s doors were sealed by a fear: «everyone will laugh». A promise and «nobody will laugh» opened them.' },
      { when: s => fw(s, 'af.boss'), text: 'On the stage, the Laughing Gallery: the fear of being laughed at, grown huge. «We’ll listen», you promised for the audience, and it went quiet.' },
      { when: s => fw(s, 'af.fest'), text: 'Elio’s last words came back, «Thank you, Alba!», and the Festival of Voices filled the theater again, forty years later.' },
    ]);
  }
  const isStep = i => { try { const m = QUESTS.LIST.find(q => q.id === 'main'); return !!(m && QUESTS.current(m) === STEPS[i]); } catch (e) { return false; } };
  // the side quests out here (the library's and the bakery's are alba_future_hall.js's)
  const hugoAt = () => { const p = G() && G().town && (G().town.people || []).find(q => q.id === 'hugo'); return p ? at(p, '{mimo} points at Hugo the sweeper, on the main street.') : null; };
  if (typeof QUESTS !== 'undefined') {
    const add = q => { if (!QUESTS.LIST.some(x => x.id === q.id)) QUESTS.LIST.push(q); };
    add({ id: 'af.capsule', kind: 'side', title: 'The time capsule', giver: 'Beto, at the solar tram’s stop (Alba, tomorrow)', started: s => fw(s, 'af.capAsked'), steps: [
      { text: 'Today: bury the kids’ time capsule, by the duck pond’s willow', why: 'Beto, Sofi and Luci meant to bury a time capsule when they were kids, and forgot. Step back to today: the willow by the duck pond.',
        done: s => nw(s, 'af.capsule'), target: () => viaNow(() => at(AT.capsule, '{mimo} sniffs at the willow by the duck pond.')), hint: '{mimo} sniffs at the willow by the duck pond.' },
      { text: 'Tomorrow: dig up the time capsule by the willow', why: 'Ten years later, it should still be there. Tell {mimo} what it will do.',
        done: s => fw(s, 'af.capDug'), target: () => viaFuture(() => at(AT.capsule, '{mimo} sniffs at the willow: something’s buried here!')), hint: '{mimo} sniffs at the willow: something’s buried here!' },
      { text: 'Tomorrow: show Beto what was in it', why: 'Beto drives the solar tram, on the main street.',
        done: s => fw(s, 'af.capTold'), target: () => viaFuture(() => at(PPL.beto ? PPL.beto.api : AT.beto, '{mimo} points at Beto, by the solar tram.')), hint: '{mimo} points at Beto, by the solar tram.' } ] });
    add({ id: 'af.pond', kind: 'side', title: 'The dry pond', giver: 'Sofi, painting by the duck pond (Alba, tomorrow)', started: s => fw(s, 'af.pondAsked'), steps: [
      { text: 'Today: warn Hugo the sweeper about the duck pond', why: 'In tomorrow, the duck pond is dry: leaves blocked its little channel, and nobody cleaned it. Step back to today and warn Hugo, in tomorrow’s words: «si…».',
        done: s => nw(s, 'af.pond'), target: () => viaNow(hugoAt), hint: '{mimo} points at Hugo the sweeper, on the main street.' },
      { text: 'Tomorrow: look at the duck pond, and tell Sofi', why: 'A warning heard today… has tomorrow changed?',
        done: s => fw(s, 'af.pondSeen'), target: () => viaFuture(() => at(PPL.sofi ? PPL.sofi.api : AT.sofi, '{mimo} points at Sofi, by the duck pond.')), hint: '{mimo} points at Sofi, by the duck pond.' } ] });
  }

  // ------------------------------------------------------------ every frame (main.js, after TIME.late): the north gate, tomorrow's
  // people, the Old Quarter in tomorrow (shown, its edge kept), the theater's gray, Marta out front, Noa at the crack
  let wasP = false, cemHid = null, lastOk = null, edgeT = 0, noaIdle = 0;
  const FOG_G = new THREE.Color('#a3a1ae');
  function oldQuarter(on, dt) {
    const g = G(), cem = g.cemetery; if (!cem || !cem.group) return;
    const Y = g.sim.you;
    if (on) {
      cem.group.visible = Math.hypot(Y.x + 35, Y.z + 240) < 175;
      if (!cemHid) {
        cemHid = [];
        const E = cem.objects && cem.objects.eras && cem.objects.eras.now;
        if (E) { (E.people || []).forEach(P => { if (P && P.g) { cemHid.push([P.g, P.g.visible]); P.g.visible = false; } }); if (E.parts && E.parts.cemetery) { cemHid.push([E.parts.cemetery, E.parts.cemetery.visible]); E.parts.cemetery.visible = false; } }
      }
      edgeT = Math.max(0, edgeT - dt);
      if (Y.z < -194.8 && !g.sim.lock) {
        if (inOQ(Y.x, Y.z)) lastOk = { x: Y.x, z: Y.z };
        else if (lastOk) { Y.x = lastOk.x; Y.z = lastOk.z; if (edgeT <= 0) { edgeT = 7; STORY.think('Past here, tomorrow’s fog is too thick to see. Let’s turn back.', 4); } }
      } else lastOk = Y.z < -190 ? { x: Y.x, z: Y.z } : lastOk;
    } else if (cemHid) { cemHid.forEach(([o, v]) => { o.visible = v; }); cemHid = null; lastOk = null; }
  }
  function theaterGray() {
    const g = G(), Y = g.sim.you, d = AT.door, dist = Math.hypot(Y.x - d.x, Y.z - (d.z + 5));
    const k = 1 - 0.7 * smoothstep(36, 12, dist);
    if (k > 0.995) return;
    try { FUTURE._.tintK(k); } catch (e) { /* */ }
    const fog = g.w3d.scene.fog; fog.color.lerp(FOG_G, 0.7 * (1 - k)); fog.near = lerp(fog.near, 14, 1 - k); fog.far = lerp(fog.far, 78, 1 - k);
    g.fx.birds = 0;
  }
  function placeMarta() { const M = futP('marta'); if (!M) return; const a = AT.martaFore; if (Math.abs(M.x - a.x) > 0.01 || Math.abs(M.z - a.z) > 0.01) { M.x = a.x; M.z = a.z; M.y = gy(a.x, a.z); M.yaw = a.yaw; } }
  function noaCheck(dt) {
    const g = G();
    if (!futureDone() || STORY.busy || STORY.line || g.sim.lock || g.journalOpen || inHall() || document.body.classList.contains('in-battle') || TIME.busy) { noaIdle = 0; return; }
    const room = g.indoorMod && g.indoorMod(); if (room && room !== FUTURE && !(typeof PAST !== 'undefined' && room === PAST) && room !== TIME) { noaIdle = 0; return; }
    const due1 = isStep(0), due9 = !!(QUESTS.reportDue && QUESTS.reportDue('noa_af'));
    if (!due1 && !due9) { noaIdle = 0; return; }
    const Y = g.sim.you, c = crackAt('pond'); if (Math.hypot(Y.x - c.x, Y.z - c.z) > 3.6) { noaIdle = 0; return; }
    if ((noaIdle += dt) < 0.6) return; noaIdle = 0;
    STORY.run(due1 ? noaStart : noaReport);
  }
  function late(dt) {
    const g = G(); if (!g || !g.state || !g.state.flags || document.body.classList.contains('on-title')) return;
    const t = g.w3d.time.value, open = northOpen();
    if (typeof FUTURE !== 'undefined' && FUTURE._ && FUTURE._.northOpen && FUTURE._.north !== open) FUTURE._.northOpen(open);
    const fut = inFuture(), hall = inHall(), showP = fut && !hall && futureDone();
    if (showP !== wasP) { showPeople(showP); wasP = showP; }
    if (showP) animatePeople(dt, t);
    oldQuarter(fut && open && !hall, dt);
    if (showP && !F('af.boss')) theaterGray();
    if (fut && F('af.boss') && !F('af.fest')) placeMarta();
    if (flareG && flareG.visible) flareG.material.opacity = 0.55 + 0.25 * Math.sin(t * 3);
    noaCheck(dt);
  }
  // the minimap's dots: tomorrow's people out here too
  if (typeof TIME.dots === 'function') { const dots0 = TIME.dots; TIME.dots = () => { const out = dots0() || []; if (TIME.world() === 'future' && !inHall()) for (const P of Object.values(PPL)) if (P.g.visible) out.push({ x: P.api.x, z: P.api.z }); return out; }; }

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the save goes to the test slot)
  // setup(o): the save just after Chapter 3 with Alba's Past echo found (TIME_ALBA._.t.setup), Chapter 4's earlier steps done,
  //   and this part's own steps as they really are; o.step (1–10): the progress put in place up to that main step
  // go(step): setup, then into tomorrow by the bell tower · near(id): stand there · check(): every zh / ja string
  const PROGRESS = [[], ['af.noa1'], ['promised', 'festAsked', 'af.marta'], ['af.plan'], ['af.seal'], ['af.foyer', 'af.balc', 'af.loft'], ['af.boss'], ['echo'], ['af.fest'], ['af.report']];
  function setup(o = {}) {
    if (typeof TIME_ALBA !== 'undefined' && TIME_ALBA && TIME_ALBA._ && TIME_ALBA._.t) TIME_ALBA._.t.setup(o);
    try { if (typeof CH4 !== 'undefined') CH4._.t.give('alba', 'past'); } catch (e) { /* */ }
    const main = QUESTS.LIST.find(q => q.id === 'main');
    if (main) main.steps.forEach(st => { if (st.alba_future && st._d0) st.done = st._d0; });
    const fl = G().state.worlds.flags.future, s = ST();
    if (o.reset !== false) {
      for (const k of Object.keys(fl)) if (/^af\./.test(k)) delete fl[k];
      for (const k of Object.keys(G().state.worlds.flags.now)) if (/^af\./.test(k)) delete G().state.worlds.flags.now[k];
      for (const k of Object.keys(s)) delete s[k];
      try { const E = G().state.ch4 && G().state.ch4.echoes; if (E) delete E['alba.future']; } catch (e) { /* */ }
    }
    const n = Math.max(0, Math.min(10, o.step || 1));
    for (let i = 1; i < n; i++) for (const k of PROGRESS[i]) { if (k === 'echo') { try { CH4._.t.give('alba', 'future'); } catch (e) { /* */ } } else fl[k] = true; }
    if (n > 3) s.plans = { tito: 'Tito tocará la guitarra.', sofi: 'Sofi pintará los carteles.', beto: 'Beto llevará a todos en el tranvía.' };
    if (n > 4) { s.sealSeen = true; s.sealHalf = 'S'; }
    TIME.refresh();
    return { world: TIME.world(), step: n };
  }
  async function go(step = 2, at0) {
    setup({ step });
    const at1 = at0 || (step >= 4 ? { x: -13.5, z: -228.5, yaw: Math.PI } : { x: -19.0, z: -156.6, yaw: Math.PI });
    if (TIME.world() !== 'future') await TIME.go('future', { region: 'alba', at: at1 }); else TIME._.teleport(at1);
    return TIME.world();
  }
  function near(id) {
    const g = G(), Y = g.sim.you;
    const spots = { pond: crackAt('pond'), street: crackAt('street'), door: AT.doorSpot, tadeo: AT.tadeo, beto: AT.beto, sofi: AT.sofi, capsule: AT.capsule, grate: AT.grate, board: AT.board, tram: AT.tram, bakery: bakeryDoor(), library: libraryDoor(), forecourt: AT.forecourt };
    if (id === 'marta' || id === 'tito') { const p = futP(id); if (p) spots[id] = { x: p.x, z: p.z }; }
    if (id === 'hugo') { const h = hugoAt(); if (h) spots.hugo = h; }
    const p = spots[id]; if (!p) return null;
    const off = id === 'pond' || id === 'street' ? 1.6 : 1.3;
    Y.x = p.x + off; Y.z = p.z + (id === 'door' ? 1.2 : 0.9); g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
    return { x: Y.x, z: Y.z };
  }

  return { AT, STEPS, late, chat, readSign, noaStart, noaReport, noaAgain, martaScene, martaOffers, planScene, sealScene, festScene, capAsk, capToday, capDig, capTold, pondAsk, hugoWarn, pondSeen,
    _: { t: { setup, go, near, check: () => AFTXT.check() }, ask, say, sayT, demo, hushed, frame2, lock, shot, wait, nameOf, fillMimo, fillEn, makePerson, laughFace, glow, signTex, Kit, KG, futP, papi, PPL,
      F, setF, N, ST, inFuture, inHall, isStep, plans, viaFuture, viaTheater, flare, kids, LOOKS, KID_LOOK, oldQuarter } };
})();
