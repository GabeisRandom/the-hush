'use strict';
// The Gray Marsh's two time bosses (game/TIME.md §25 "The Gray Marsh (T4c)"): plug-ins on battle/flow.js (BATTLE._.plugins), fought
// through TIME.fight so the world's tense rules apply (battle/timebattle.js).
//   'lantern_moth', the Lantern Moth (the Lantern House's top, long ago): a great gray moth that hatched from a lantern that sank on
//     Lantern Night; it drinks light, and with it what people remember. Phase 1: commands told as memories land («{mimo} saltó…»; a «y»
//     chain of two past clauses is two hits), the present only confuses {mimo}; the scene and the deed in one sentence, «Mientras la
//     polilla bebía la luz, {mimo} saltó sobre ella» (the imperfect going on, the preterite cutting in), is a STORY ×2 (storyOut reads
//     the scene off the front or the end: es «mientras» + the imperfect or «estaba + -ando»; the other languages theirs); its moth dust
//     (up high: «¡Agáchate!») and its wing gusts (down low: «¡Salta!») are dodged out loud. Three hits and its dust is gone: it doesn't
//     remember the night, and you tell it (MHPTXT.TASKS moth1, moth2); each answer brings its colors back; then it gives back Elio's
//     words.
//   'stone_gargoyle', the Stone Gargoyle (the Stone Chapel's belfry, tomorrow): a gargoyle of stone on the stone bell. Plans bounce off
//     stone (CLANK, no harm). Imagine it as something else and, for that turn, it is: «Si fueras de cristal, {mimo} te golpearía» (ifOut:
//     «si» + the imperfect subjunctive + a material, the second half in the conditional; the other languages theirs): it turns to glass,
//     ice, sand, paper, wood… and the hit lands ×2 (IMAGINE ×2; a «y» chain of two, two hits). «si eres» (a real if) still works, graded
//     B; «si serías» does nothing (the coach says why). Its swoop (up high) and its tail (down low) are dodged out loud. Three hits and it
//     says its fears; you answer each with a what-if (MHFTXT.TASKS garg1, garg2: «Si se rieran, me reiría con ellos»).
// Each has its own song (marsh_time_music.js: 'boss_mh_moth', 'boss_mh_gargoyle'), bestiary line, icon and voice; neither takes your last
// heart.   MHBOSS.fightMoth() · MHBOSS.fightGargoyle() · MHBOSS.letter('past' | 'future') · MHBOSS.storyOut(text, lang) · MHBOSS.ifOut(text, lang)
const MHBOSS = (() => {
  const BT = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = BT && BT._;
  const Q = () => (typeof MARSHT !== 'undefined' ? MARSHT : null);
  const toast = s => UI.toast(Q() && Q().cjRun ? Q().cjRun(s) : s);
  const lang = () => (Q() ? Q().lang() : 'es');
  const isC = () => lang() === 'zh' || lang() === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fillM = s => (Q() ? Q().fillMimo(s, lang()) : String(s || '').replace(/\{mimo\}/g, 'Mimo'));
  const lineOf = (TAB, key) => { const T = (TAB || {})[key] || {}, l = lang(); return [fillM(T[l] || T.es || T.en || ''), Q() ? Q().fillEn(T.en || '') : String(T.en || '')]; };
  const RANK = 'SABCD';
  const LETTERS = { past: [], future: [] };
  function letter(w) { const L0 = LETTERS[w] || []; if (!L0.length) return 'B'; const avg = L0.reduce((a, x) => a + RANK.indexOf(x), 0) / L0.length; return RANK[Math.max(0, Math.min(4, Math.round(avg)))]; }
  const playSong = name => { try { if (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(name)) Sound.setSong(name); } catch (e) { /* */ } };
  const isTense = (r, ts) => !!(r && r.clauses && r.clauses.some(c => c.tb && ts.includes(c.tb.tense)));
  const PT = () => (typeof MHPTXT !== 'undefined' ? MHPTXT : null), FT = () => (typeof MHFTXT !== 'undefined' ? MHFTXT : null);
  const nrmW = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¡!¿?.,;:«»"“”]/g, '');

  // a material that drains to gray (uGray 1) and fills back with color (uGray 0); uTint / uTintK: a material imagined for a turn
  function grayable(start, key) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad }), u = { uGray: { value: start }, uTint: { value: new THREE.Color('#ffffff') }, uTintK: { value: 0 } };
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = u.uGray; sh.uniforms.uTint = u.uTint; sh.uniforms.uTintK = u.uTintK;
      sh.fragmentShader = 'uniform float uGray; uniform vec3 uTint; uniform float uTintK;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.84, l * 0.8), uGray); diffuseColor.rgb = mix(diffuseColor.rgb, uTint * (0.55 + 0.6 * l), uTintK); }');
    };
    m.customProgramCacheKey = () => 'mhBossGray' + (key || '');
    return { m, u };
  }
  const anchorsOf = (body, list) => { const a = {}; for (const [n, p] of list) { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); a[n] = o; } return a; };

  // ------------------------------------------------------------ the Lantern Moth's model (a big round moth: a fuzzy body, feathery
  // antennae, four wings with eyespots; gray dust until it remembers, then warm amber and cream, its eyespots orange)
  function mothModel() {
    const root = new THREE.Group(), inner = new THREE.Group(), body = new THREE.Group(); root.add(inner); inner.add(body); inner.scale.setScalar(0.7);
    const k = PAST.API.Kit(), KG = PAST.API.KG, gm = grayable(1, 'm');
    k.add(KG.sphere, 0, 2.0, 0, 0.55, 0.95, 0.55, '#c9a46a', { ink: 0.014 }).add(KG.sphere, 0, 2.95, 0.1, 0.42, 0.38, 0.4, '#e8d6a8', { ink: 0.012 });
    for (let i = 0; i < 5; i++) k.add(KG.torus, 0, 1.4 + i * 0.26, 0, 0.5 - Math.abs(i - 2) * 0.05, 0.5 - Math.abs(i - 2) * 0.05, 0.05, '#8a6a3a', { rx: Math.PI / 2, ink: 0 });
    for (const s of [-1, 1]) {
      k.add(KG.ball6, s * 0.18, 3.0, 0.42, 0.13, 0.13, 0.08, '#2b2235', { ink: 0 });
      for (let j = 0; j < 6; j++) k.rod([s * 0.12, 3.25, 0.25], [s * (0.35 + j * 0.06), 3.8 + j * 0.06, 0.4 + j * 0.05], 0.02, '#8a6a3a', 0).add(KG.cone, s * (0.4 + j * 0.06), 3.75 + j * 0.06, 0.45 + j * 0.05, 0.05, 0.14, 0.02, '#c9a46a', { rz: s * 1.2, ink: 0 });
      for (const [y, z] of [[1.4, 0.3], [1.8, 0.35], [2.2, 0.3]]) k.rod([s * 0.3, y, z], [s * 0.8, y - 0.5, z + 0.2], 0.03, '#6a5030', 0);
    }
    const wings = [];
    for (const s of [-1, 1]) for (const front of [1, 0]) {
      const w = new THREE.Group(); w.position.set(s * 0.45, front ? 2.4 : 1.7, -0.1); body.add(w);
      const kw = PAST.API.Kit(), sx = front ? 1.6 : 1.1, sy = front ? 1.2 : 0.9;
      kw.add(KG.sphere, s * sx * 0.9, front ? 0.35 : -0.25, 0, sx, sy, 0.06, front ? '#d9b878' : '#c9a46a', { rz: s * (front ? 0.35 : -0.25), ink: 0.01 });
      kw.add(KG.sphere, s * sx * 1.05, front ? 0.45 : -0.3, 0.07, 0.36, 0.36, 0.04, '#e8823a', { ink: 0 }).add(KG.sphere, s * sx * 1.05, front ? 0.45 : -0.3, 0.1, 0.18, 0.18, 0.03, '#2b2235', { ink: 0 });
      kw.add(KG.sphere, s * sx * 0.55, front ? 0.15 : -0.1, 0.07, 0.5, 0.12, 0.03, '#f4efe2', { rz: s * 0.4, ink: 0 });
      kw.build(w, { mat: gm.m }); w.userData.s = s; w.userData.front = front; wings.push(w);
    }
    k.build(body, { mat: gm.m });
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffe6a0', transparent: true, opacity: 0.16, depthWrite: false })); gl.scale.setScalar(5.2); gl.position.y = 2.2; root.add(gl);
    const anchors = anchorsOf(body, [['top', [0, 4.0, 0]], ['mid', [0, 2.0, 0.6]], ['head', [0, 3.0, 0.4]], ['face', [0, 2.95, 0.8]], ['feet', [0, 0.6, 0]]]);
    return { root, body, gl, gm, wings, anchors, kind: 'lantern_moth', scale: 1, radius: 1.4, height: 3.6, parts: [], labelH: 4.4, hover: 0, L: {} };
  }
  function poseMoth(h, F, t) {
    const gray = FXL ? 1 - FXL.color : 1;
    if (h.gm) h.gm.u.uGray.value += (gray - h.gm.u.uGray.value) * 0.05;
    const fast = FXL && FXL.flap, a = fast ? Math.sin(t * 16) * 0.7 : Math.sin(t * 3.2) * 0.35;
    (h.wings || []).forEach(w => { w.rotation.y = w.userData.s * (a * (w.userData.front ? 1 : 0.8)); w.rotation.z = w.userData.s * a * 0.25; });
    h.body.position.y = 0.2 + Math.sin(t * 1.8) * 0.2;
    h.body.rotation.z = Math.sin(t * 0.9) * 0.08;
    h.gl.material.opacity = 0.12 + 0.06 * Math.sin(t * 2.4) + (FXL ? FXL.color * 0.2 : 0);
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }

  // ------------------------------------------------------------ the Stone Gargoyle's model (crouched on its perch: a horned head, folded
  // wings, a curled tail, claws; stone gray; for a turn it can be imagined as glass, ice, sand, paper, wood…)
  function gargModel() {
    const root = new THREE.Group(), inner = new THREE.Group(), body = new THREE.Group(); root.add(inner); inner.add(body); inner.scale.setScalar(0.85);
    const k = PAST.API.Kit(), KG = PAST.API.KG, gm = grayable(0, 'g');
    const S0 = '#8d8a84', S1 = '#7d7a74', S2 = '#a39f97';
    k.add(KG.cyl, 0, 0.35, 0, 1.0, 0.7, 0.9, S1, { ink: 0.016 });
    k.add(KG.sphere, 0, 1.55, 0, 0.85, 1.0, 0.75, S0, { ink: 0.016 }).add(KG.sphere, 0, 2.75, 0.35, 0.55, 0.5, 0.55, S2, { ink: 0.014 });
    k.add(KG.sphere, 0, 2.55, 0.8, 0.32, 0.22, 0.3, S0, { ink: 0.01 });
    for (const s of [-1, 1]) {
      k.add(KG.cone, s * 0.35, 3.25, 0.25, 0.1, 0.55, 0.1, S1, { rz: -s * 0.5, ink: 0.008 }).add(KG.ball6, s * 0.2, 2.85, 0.82, 0.08, 0.08, 0.05, '#f2c94c', { ink: 0 });
      k.add(KG.cone, s * 0.12, 2.42, 1.02, 0.04, 0.16, 0.04, '#f4efe2', { rx: Math.PI, ink: 0 });
      k.add(KG.sphere, s * 0.7, 0.75, 0.55, 0.25, 0.4, 0.3, S1, { ink: 0.008 });
      for (let j = 0; j < 3; j++) k.add(KG.cone, s * (0.6 + j * 0.12), 0.38, 0.85, 0.05, 0.18, 0.05, S2, { rx: Math.PI / 2, ink: 0 });
    }
    const wings = [];
    for (const s of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(s * 0.6, 2.1, -0.35); body.add(w);
      const kw = PAST.API.Kit();
      kw.add(KG.sphere, s * 0.9, 0.3, -0.1, 1.0, 0.85, 0.12, S1, { rz: s * 0.5, ink: 0.012 });
      for (let j = 0; j < 3; j++) kw.rod([s * 0.1, 0.6, -0.05], [s * (1.2 + j * 0.3), 1.1 - j * 0.6, -0.1], 0.06, S0, 0.004);
      kw.build(w, { mat: gm.m }); w.userData.s = s; wings.push(w);
    }
    const tail = new THREE.Group(); tail.position.set(0, 0.6, -0.8); body.add(tail);
    const kt = PAST.API.Kit(); for (let j = 0; j < 6; j++) kt.add(KG.sphere, Math.sin(j * 0.9) * 0.3, j * 0.12, -j * 0.28, 0.22 - j * 0.02, 0.22 - j * 0.02, 0.22 - j * 0.02, S0, { ink: 0.006 }); kt.add(KG.cone, Math.sin(5.4) * 0.3, 0.75, -1.8, 0.14, 0.3, 0.06, S1, { rx: -Math.PI / 2, ink: 0 }); kt.build(tail, { mat: gm.m });
    k.build(body, { mat: gm.m });
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#e8e4dc', transparent: true, opacity: 0.0, depthWrite: false })); gl.scale.setScalar(5); gl.position.y = 1.8; root.add(gl);
    const anchors = anchorsOf(body, [['top', [0, 3.6, 0]], ['mid', [0, 1.6, 0.7]], ['head', [0, 2.8, 0.4]], ['face', [0, 2.7, 1.0]], ['feet', [0, 0.05, 0]]]);
    return { root, body, gl, gm, wings, tail, anchors, kind: 'stone_gargoyle', scale: 1, radius: 1.3, height: 3.4, parts: [], labelH: 4.2, hover: 0, L: {} };
  }
  function poseGarg(h, F, t) {
    const FX = FXG;
    if (h.gm) {
      h.gm.u.uGray.value += (((FX && FX.color > 0) ? 0 : 0) - h.gm.u.uGray.value) * 0.05;
      const want = FX && FX.mat ? 1 : 0; h.gm.u.uTintK.value += (want - h.gm.u.uTintK.value) * 0.12;
      if (FX && FX.mat && MATS[FX.mat]) h.gm.u.uTint.value.set(MATS[FX.mat].col);
    }
    const spread = FX && (FX.swoop || FX.phase === 2) ? 0.9 : 0.15 + Math.sin(t * 0.6) * 0.04;
    (h.wings || []).forEach(w => { w.rotation.z = w.userData.s * spread * 0.6; w.rotation.y = w.userData.s * spread * 0.4; });
    if (h.tail) h.tail.rotation.y = Math.sin(t * 1.3) * 0.3 + (FX && FX.lash ? Math.sin(t * 12) * 0.5 : 0);
    h.body.position.y = FX && FX.swoop ? 0.6 + Math.abs(Math.sin(t * 6)) * 0.3 : 0;
    h.gl.material.opacity = FX && FX.mat ? 0.35 + 0.1 * Math.sin(t * 5) : FX ? FX.color * 0.25 : 0;
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }
  // what the gargoyle can be imagined as, for one turn: its look (a tint) and the words for it in each language
  const MATS = {
    glass: { col: '#bfe8ff' }, ice: { col: '#e8f6ff' }, sand: { col: '#e8cf9a' }, paper: { col: '#f6f0e0' }, wood: { col: '#a8743f' }, fog: { col: '#d8d6e4' }, wax: { col: '#f2e2b0' }, snow: { col: '#ffffff' }, mud: { col: '#8a6a4a' }, cotton: { col: '#fbf8f2' },
  };
  const MAT_WORDS = {
    es: { glass: ['cristal', 'vidrio'], ice: ['hielo'], sand: ['arena'], paper: ['papel'], wood: ['madera'], fog: ['niebla'], wax: ['cera'], snow: ['nieve'], mud: ['barro'], cotton: ['algodon'] },
    pt: { glass: ['vidro', 'cristal'], ice: ['gelo'], sand: ['areia'], paper: ['papel'], wood: ['madeira'], fog: ['nevoa', 'neblina'], wax: ['cera'], snow: ['neve'], mud: ['lama', 'barro'], cotton: ['algodao'] },
    de: { glass: ['glas'], ice: ['eis'], sand: ['sand'], paper: ['papier'], wood: ['holz'], fog: ['nebel'], wax: ['wachs'], snow: ['schnee'], mud: ['schlamm', 'matsch'], cotton: ['watte', 'baumwolle'] },
    zh: { glass: ['玻璃', 'boli', 'bo li'], ice: ['冰', 'bing'], sand: ['沙', 'sha zi'], paper: ['纸'], wood: ['木', 'mu tou', 'mutou'], fog: ['雾'], wax: ['蜡'], snow: ['雪'], mud: ['泥', 'ni ba'], cotton: ['棉', 'mian hua', 'mianhua'] },
    ja: { glass: ['ガラス', 'garasu'], ice: ['氷', 'こおり', 'koori'], sand: ['砂', 'すな', 'suna'], paper: ['紙', 'kami'], wood: ['木', 'ki'], fog: ['霧', 'kiri'], wax: ['蝋', 'rou'], snow: ['雪', 'ゆき', 'yuki'], mud: ['泥', 'どろ', 'doro'], cotton: ['綿', 'wata'] },
  };

  // ------------------------------------------------------------ the battle's hooks: species, models, labels, the bestiary
  const KINDS = ['lantern_moth', 'stone_gargoyle'];
  const NAMEOF = kind => (kind === 'lantern_moth' ? (PT() ? PT().NAMES.boss : {}) : (FT() ? FT().NAMES.boss : {}));
  function hook() {
    try { if (typeof BOSS_MUSIC !== 'undefined' && BOSS_MUSIC.SONG) { BOSS_MUSIC.SONG.lantern_moth = 'boss_mh_moth'; BOSS_MUSIC.SONG.stone_gargoyle = 'boss_mh_gargoyle'; } } catch (e) { /* */ }
    if (!_) return;
    const SP = { lantern_moth: PT() ? PT().SPECIES : null, stone_gargoyle: FT() ? FT().SPECIES : null };
    for (const [id, table] of Object.entries(SP)) if (table) for (const [lg, sp] of Object.entries(table)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species[id]) { Lg.species[id] = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
    const Mo = _.M;
    if (Mo && !Mo.mhHooked) {
      Mo.mhHooked = true; const b0 = Mo.build, p0 = Mo.pose, br0 = Mo.brighten, k0 = Mo.kindOf;
      Mo.kindOf = k => (KINDS.includes(String(k || '')) ? String(k) : k0(k));
      Mo.build = o => (o && o.kind === 'lantern_moth' ? mothModel() : o && o.kind === 'stone_gargoyle' ? gargModel() : b0(o));
      Mo.pose = (h, F, t, dt) => (h && h.kind === 'lantern_moth' ? poseMoth(h, F, t, dt) : h && h.kind === 'stone_gargoyle' ? poseGarg(h, F, t, dt) : p0(h, F, t, dt));
      Mo.brighten = (h, k) => (h && KINDS.includes(h.kind) ? undefined : br0(h, k));
    }
    const U = _.UI;
    if (U && U.label && !U.mhHooked) { U.mhHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && KINDS.includes(f.species) ? bossLabel(f) : html); }; }
    if (_.RW && _.RW.LORE) {
      if (PT() && !_.RW.LORE['boss:lantern_moth']) _.RW.LORE['boss:lantern_moth'] = loreArr(PT().LORE);
      if (FT() && !_.RW.LORE['boss:stone_gargoyle']) _.RW.LORE['boss:stone_gargoyle'] = loreArr(FT().LORE);
    }
    if (_.RW && _.RW.KIND_EN) { _.RW.KIND_EN.lantern_moth = 'the Lantern Moth'; _.RW.KIND_EN.stone_gargoyle = 'the Stone Gargoyle'; }
    if (_.UI && _.UI.ICON) {
      if (!_.UI.ICON.lantern_moth) _.UI.ICON.lantern_moth = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g stroke="#2b2235" stroke-width="3"><ellipse cx="17" cy="28" rx="14" ry="12" fill="#d9b878"/><ellipse cx="47" cy="28" rx="14" ry="12" fill="#d9b878"/><ellipse cx="20" cy="46" rx="9" ry="8" fill="#c9a46a"/><ellipse cx="44" cy="46" rx="9" ry="8" fill="#c9a46a"/><ellipse cx="32" cy="36" rx="5" ry="14" fill="#8a6a3a"/></g><circle cx="16" cy="27" r="4" fill="#e8823a"/><circle cx="48" cy="27" r="4" fill="#e8823a"/></svg>';
      if (!_.UI.ICON.stone_gargoyle) _.UI.ICON.stone_gargoyle = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g stroke="#2b2235" stroke-width="3"><path d="M6 30 Q16 8 26 26 Z" fill="#7d7a74"/><path d="M58 30 Q48 8 38 26 Z" fill="#7d7a74"/><ellipse cx="32" cy="40" rx="14" ry="16" fill="#8d8a84"/><circle cx="32" cy="22" r="10" fill="#a39f97"/><path d="M24 14 L22 4 M40 14 L42 4" fill="none"/></g><circle cx="28" cy="22" r="2.4" fill="#f2c94c"/><circle cx="36" cy="22" r="2.4" fill="#f2c94c"/></svg>';
    }
    _.plugins = _.plugins || {}; _.plugins.lantern_moth = PMO; _.plugins.stone_gargoyle = PGA;
    try { if (typeof BFX !== 'undefined' && BFX.VOICES) { if (!BFX.VOICES.lantern_moth) BFX.VOICES.lantern_moth = { m: 70, vow: ['i', 'u', 'i'], len: 0.12, gap: 0.06 }; if (!BFX.VOICES.stone_gargoyle) BFX.VOICES.stone_gargoyle = { m: 40, vow: ['o', 'a', 'o'], len: 0.18, gap: 0.08 }; } } catch (e) { /* (no battle sounds) */ }
  }
  const loreArr = T => (T ? ['es', 'pt', 'de', 'zh', 'ja'].map(l => T[l] || T.en || '').concat([T.en || '']) : []);
  function bossLabel(f) {
    const l = lang(), moth = f.species === 'lantern_moth', N = NAMEOF(f.species);
    const name = isC() && typeof CJK !== 'undefined' ? CJK.html(N[l] || N.en || '', { lang: l }) : esc(N[l] || N.es || N.en || '');
    const FX = moth ? FXL : FXG, left = FX ? Math.max(0, 3 - FX.hits) : 3, p2 = FX && FX.phase === 2;
    return `<div class="bt-chips"><span class="bt-chip name">${name}</span></div><div class="bt-hpbar"><i style="width:${Math.round(100 * (p2 ? (2 - FX.answered) / 2 : left / 3))}%"></i><span>${p2 ? (moth ? '🕯 ?' : '💭 ?') : (moth ? '🦋 ' : '🗿 ') + left}</span></div>`;
  }
  // an answer in the box, graded as yours (not a command): MARSHT.grade with the world's task; a miss the grader knows comes back to the
  // fight as kind 'miss' with its tip for the coach, instead of {mimo}'s «¿…?»
  async function answerAsk(K, T0, tips) {
    const Pp = _ && _.P; if (!Pp || !Q()) return null;
    const parse0 = Pp.parse, lg = lang(); let tip = null, kind = null;
    Pp.parse = function (text, ctx) {
      const g = Q().grade(T0, text, lg, tips);
      if (g.ok) return { ok: true, kind: 'answer', raw: text, grade: g, clauses: [], untaught: [], previewHtml: '<b>Your answer</b>' };
      kind = g.kind; tip = g.kind !== 'none' && g.why ? g.why : null;
      const r0 = parse0.call(this, text, ctx);
      if (tip && (!r0 || !r0.ok)) return { ok: true, kind: 'miss', raw: text, grade: g, clauses: [], untaught: [], previewHtml: '' };
      return r0;
    };
    try {
      const lw = s => (Q().isCl(lg) ? s.charAt(0).toLowerCase() + s.slice(1) : s);
      const frame = Q().plainT(fillM((T0.frame || {})[lg] || '')), chips = ((T0.chips || {})[lg] || []).map(([x, e]) => `${lw(Q().plainT(fillM(x)))}${e ? ' (' + e + ')' : ''}`).join(' · ');
      const r = await K.askOrFlee('command', { hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}` });
      if (r && r.kind !== 'answer') { if (tip) r.tip = tipText(tip, T0, lg); r.gkind = kind; }
      return r;
    } finally { Pp.parse = parse0; }
  }
  function tipText(tip, T0, lg) {
    if (!Q().isCl(lg)) return tip;
    if (typeof CJK !== 'undefined' && CJK.mode && CJK.mode() === 'roman') return Q().cjRun ? Q().cjRun(tip) : tip;
    const mN = fillM((T0.model || {})[lg] || '').replace(/\s*[.。]\s*$/, ''), mP = Q().plainT(mN);
    return mP && tip.includes(mP) ? tip.replace(mP, mN) : tip;
  }
  // a wave thrown at you or {mimo} (moth dust up high, a wing gust down low, a swoop, a tail): where it's coming from, then dodge it out
  // loud (react.js opens its box). high: up high (duck) or down low (jump)
  function waveSprite(text, col) {
    const cv = document.createElement('canvas'), c = cv.getContext('2d'), font = '900 64px "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif';
    c.font = font; cv.width = Math.min(1024, Math.ceil(c.measureText(text).width) + 56); cv.height = 104;
    c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 14; c.strokeStyle = col[0]; c.strokeText(text, cv.width / 2, 54); c.fillStyle = col[1]; c.fillText(text, cv.width / 2, 54);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false, depthWrite: false }));
    sp.scale.set(0.55 * cv.width / cv.height, 0.55, 1); sp.renderOrder = 12; return sp;
  }
  async function wave(K, FX, TAB, key, col, high0) {
    const { G: BG, A: AC, ST } = K, f = FX.f;
    if (BG.hearts <= 1) return;
    const high = high0 === undefined ? Math.random() < 0.5 : high0, tgt = Math.random() < 0.5 ? AC.mimo : AC.you;
    const dw = BG.L && BG.L.dodgeWords ? BG.L.dodgeWords(BG.tier) : null, [cry, cryEn] = lineOf(TAB, key);
    const dTxt = isC() && typeof CJK !== 'undefined' ? CJK.plain(cry, { lang: lang() }) : cry, where = (dw && (high ? dw.high : dw.low)) || (high ? '↑' : '↓');
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.7 });
    K.say(f, `${dTxt} … ${where}`, { cls: 'foe shout boss', en: `${cryEn} ${high ? 'up high' : 'down low'}`, dur: K.readTime(dTxt + where) + 2.0 });
    K.emit('shout', { text: dTxt, high, foe: f, boss: true }); K.dodgeHint(true);
    await K.wait(K.readTime(dTxt + where) + 0.15);
    K.emit('windup', { foe: f, high, boss: true });
    if (FX === FXL) FXL.flap = true; if (FX === FXG) { if (high) FXG.swoop = true; else FXG.lash = true; }
    const Tm = BG.t + 0.8, keyc = high ? 'ArrowDown' : 'ArrowUp';
    const tp = K.timingWindow(Tm, keyc, () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
    const spr = waveSprite(dTxt.replace(/[!！¡]/g, '').trim().slice(0, 18) || '…', col), a = ST.worldOf(f, 'face'), b = ST.worldOf(tgt, high ? 'top' : 'feet');
    ST.prop(spr); spr.position.copy(a);
    await K.along(0.8, u => { spr.position.lerpVectors(a, b, u * 1.06); spr.position.y += Math.sin(u * Math.PI) * (high ? 0.45 : 0.12); spr.material.rotation = Math.sin(u * 12) * 0.15; });
    const grade = await tp;
    ST.dropProp(spr); if (FX === FXL) FXL.flap = false; if (FX === FXG) { FXG.swoop = false; FXG.lash = false; }
    K.dodgeResult(f, tgt, grade, 1, {});
    if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
    await K.wait(0.4);
  }
  const rung = (K, T0, what) => { try { if (K.UI && K.UI.rung) K.UI.rung(`${what}: <b>«${esc(Q().plainT(fillM((T0.model || {})[lang()] || '')))}»</b>`); } catch (e) { /* */ } };
  // the battle's parser names its foes: a pronoun for the boss becomes its name (es «ella» → «la polilla»; «te» → the gargoyle)
  const bossNoun = (tab, lg) => { const sp = tab && tab.SPECIES && tab.SPECIES[lg]; return sp ? (Q().isCl(lg) ? Q().plainT(sp.w) : sp.w) : ''; };

  // ------------------------------------------------------------ the Lantern Moth (the Past)
  // «Mientras la polilla bebía la luz, {mimo} saltó sobre ella»: the scene read off the front (or the end) of what you say; the rest is
  // the memory. mood: 'S' (the imperfect, or «estaba + -ando»), 'B' (the scene told in the preterite: «mientras la polilla bebió»)
  //   pt «Enquanto a mariposa bebia a luz, {mimo} pulou nela» (the imperfect, or «estava + -ndo»; the perfeito in the scene: B);
  //   de «Während die Motte das Licht trank, sprang {mimo} auf sie» (German tells the scene in the Präteritum too: a «während» clause is
  //   the scene); zh «蛾子正在喝光的时候，{mimo}跳了上去» (正在 / 在…的时候; 了 inside the scene: B); ja «蛾が光を飲んでいる間に、{mimo}が飛び
  //   かかった» (〜ている間 / 〜ているとき; 〜たとき: B)
  const STORYOUT = {
    es: { when: ['mientras'], impf: /^(estaba|estaban)$|(aba|abas|aban|ia|ias|ian)$/, pret: /(o|io|aron|ieron|e|aste|iste)$/ },
    pt: { when: ['enquanto'], impf: /^(estava|estavam)$|(ava|avam|ia|iam)$/, pret: /(ou|eu|iu|aram|eram|iram)$/ },
    de: { when: ['wahrend'], any: true },
  };
  function storyOut(text, lg) {
    const raw = String(text || '').replace(/[¡!¿?]/g, ' ').trim();
    if (lg === 'zh' || lg === 'ja') {
      const parts = raw.split(/[，,、;；]/).map(s => s.trim()).filter(Boolean); if (parts.length < 2) return null;
      const isScene = s => { const f = s.replace(/\s+/g, ''), r = nrmW(s).replace(/[^a-z]/g, ''); return lg === 'zh' ? /正在|在.+?(的时候|时)|的时候/.test(f) || /zhengzai|deshihou/.test(r) : /(て|で)(いる|いた|る)(間|あいだ|とき|時)|間に|あいだに|(た|だ)(とき|時)/.test(f) || /(te|de)(iru|ita|ru)(aida|toki)|aidani|(ta|da)toki/.test(r); };
      const i = parts.findIndex(isScene); if (i < 0) return null;
      const scene = parts[i], rest = parts.filter((_, j) => j !== i).join('、'), f = scene.replace(/\s+/g, '');
      if (!rest) return null;
      const B = lg === 'zh' ? /了/.test(f) && !/正在/.test(f) : /(た|だ)(とき|時)/.test(f) || /(ta|da)toki/.test(nrmW(scene).replace(/[^a-z]/g, ''));
      return { mood: B ? 'B' : 'S', rest };
    }
    const W = STORYOUT[lg]; if (!W) return null;
    const cut = raw.search(/[,;]/); if (cut < 0) return null;
    const a = raw.slice(0, cut).trim(), b = raw.slice(cut + 1).trim();
    const partOf = s => { const n = s.split(/\s+/).map(nrmW); return n.some(x => W.when.includes(x)) ? n : null; };
    let scene = partOf(a), rest = b; if (!scene) { scene = partOf(b); rest = a; }
    if (!scene || !rest || rest.split(/\s+/).length < 2) return null;
    if (W.any) return { mood: 'S', rest };
    const verbs = scene.filter(x => !W.when.includes(x) && x.length > 3);
    const impf = verbs.some(x => W.impf.test(x)), pret = !impf && verbs.some(x => W.pret.test(x));
    if (!impf && !pret) return null;
    return { mood: impf ? 'S' : 'B', rest };
  }
  // the other languages: what {mimo} does in the rest of the sentence, found by its verb (in any tense: a memory, a what-if), then
  // given to the battle as that verb's plain command (each verb one clause: a «y» chain stays two)
  const VSTEM = {
    pt: { 'v.hit': /\b(bat|soc)/, 'v.jump': /\b(pul|salt)/, 'v.blow': /\b(sopr|assopr)/, 'v.push': /\bempurr/, 'v.throw': /\b(jog|arremess|lanc)/, 'v.dig': /\b(cav|escav)/, 'v.light': /\b(ilumin|acend)/, 'v.swim': /\bnad/, 'v.climb': /\b(subi|sobe|escal)/, 'v.sing': /\bcant/ },
    // (German verbs may carry a separable particle: «wegpusten», «umgeschoben»)
    de: Object.fromEntries(Object.entries({ 'v.hit': 'schlag|schlug|geschlagen|hau(?!s)|gehauen', 'v.jump': 'spring|sprang|gesprungen|hupf|gehupft', 'v.blow': 'pust|gepustet|blas|blies|geblasen', 'v.push': 'schieb|schob|geschoben', 'v.throw': 'wirf|werf|warf|geworfen',
      'v.dig': 'grab|grub|gegraben|buddel', 'v.light': 'leucht|beleucht|geleuchtet', 'v.swim': 'schwimm|schwamm|geschwommen', 'v.climb': 'kletter|geklettert', 'v.sing': 'sing|sang|gesungen' }).map(([k, v]) => [k, new RegExp('\\b(?:weg|um|hoch|an|ab|auf|aus|los|zu|nieder|runter|rauf|drauf|ein|kaputt)?(' + v + ')')])),
    zh: { 'v.hit': /打|揍|敲|踢/, 'v.jump': /跳|蹦|踩/, 'v.blow': /吹/, 'v.push': /推/, 'v.throw': /扔|丢|投/, 'v.dig': /挖/, 'v.light': /照|点亮/, 'v.swim': /游/, 'v.climb': /爬/, 'v.sing': /唱/ },
    ja: { 'v.hit': /叩|たた|殴|なぐ|打|うっ|パンチ/, 'v.jump': /跳|(?<!吹き)飛|とん|(?<!ふき)とび|とぶ|ジャンプ/, 'v.blow': /吹|ふい|ふく|ふけ/, 'v.push': /押|おし|おす|おせ/, 'v.throw': /投|なげ/, 'v.dig': /掘|ほっ|ほる/, 'v.light': /照|てら/, 'v.swim': /泳|およ/, 'v.climb': /登|のぼ/, 'v.sing': /歌|うた/ },
  };
  const VROM = {
    zh: { 'v.hit': /\b(da|zou|qiao|ti)\b/, 'v.jump': /\b(tiao|beng|cai)\b/, 'v.blow': /\bchui\b/, 'v.push': /\btui\b/, 'v.throw': /\b(reng|diu|tou)\b/, 'v.dig': /\bwa\b/, 'v.light': /\bzhao\b/, 'v.swim': /\byou yong\b|\byou guo\b/, 'v.climb': /\bpa\b/, 'v.sing': /\bchang\b/ },
    ja: { 'v.hit': /tata|nagu|utte|panchi/, 'v.jump': /ton(de|da)|tobi|tobu|janpu/, 'v.blow': /fui|fuku|fuke/, 'v.push': /oshi|osu\b|ose\b/, 'v.throw': /nage/, 'v.dig': /hott|horu/, 'v.light': /tera/, 'v.swim': /oyo/, 'v.climb': /nobo/, 'v.sing': /uta/ },
  };
  function verbsIn(text, lg) {
    const T0 = VSTEM[lg]; if (!T0) return [];
    const raw = String(text || ''), flat = raw.replace(/\s+/g, ''), low = nrmW(raw), hits = [];
    for (const [id, re] of Object.entries(T0)) {
      let m = (lg === 'zh' || lg === 'ja' ? flat : low).search(re);
      if (m < 0 && VROM[lg] && VROM[lg][id]) m = low.search(VROM[lg][id]);
      if (m >= 0 && LEX.item(id)) hits.push([m, id]);
    }
    return hits.sort((a, b) => a[0] - b[0]).map(h => h[1]);
  }
  function compose(self, parse0, ctx, ids, f) {
    let base = null;
    for (const id of ids) {
      const r = parse0.call(self, String(LEX.form(id)), Object.assign({}, ctx, { tbSkip: true }));
      if (!(r && r.ok && r.kind === 'command' && r.clauses && r.clauses.length)) continue;
      for (const c of r.clauses) c.target = f;
      if (!base) base = r; else base.clauses = base.clauses.concat(r.clauses);
    }
    return base;
  }
  async function askStory(K, FX) {
    const Pp = _ && _.P; if (!Pp) return K.askOrFlee('command');
    const parse0 = Pp.parse, lg = lang(), noun = bossNoun(PT(), lg);
    Pp.parse = function (text, ctx) {
      const w = storyOutAny(text, lg);
      if (w) {
        let rest = w.rest, r2 = null;
        if (lg === 'es') { rest = rest.replace(/\b(sobre|a|contra)\s+ella\b/gi, '$1 la ' + noun).replace(/\bella\b/gi, 'la ' + noun); r2 = parse0.call(this, rest, ctx); }
        else r2 = compose(this, parse0, ctx, verbsIn(rest, lg), FX.f);
        if (r2 && r2.ok && r2.kind === 'command' && r2.clauses && r2.clauses.length) { for (const c of r2.clauses) c.target = FX.f; return Object.assign(r2, { raw: text, mhStory: w, previewHtml: `<b>📖 ${esc(Q().fillEn('A story: the scene and the deed'))}</b>` }); }
      }
      const r0 = parse0.call(this, text, ctx);
      if (r0 && r0.ok && r0.kind === 'command' && lg === 'es' && /\bella\b/i.test(text)) for (const c of r0.clauses || []) if (!c.target) c.target = FX.f;
      return r0;
    };
    try { return await K.askOrFlee('command'); } finally { Pp.parse = parse0; }
  }
  let FXL = null;
  const fl = key => lineOf(PT() && PT().FIGHT, key);
  const sayL = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fl(key); K.say(st0, t, { cls, en, dur }); };
  const PMO = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'lantern_moth'); if (!f) { FXL = null; return; }
      FXL = { f, hits: 0, phase: 1, turn: 0, answered: 0, color: 0, flap: false, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.past = [];
      playSong('boss_mh_moth');
    },
    floor: f => (f && f.species === 'lantern_moth' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXL) return 'flee';
      const f = FXL.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.2, dist: 11 });
      sayL(K, f, 'intro', 3.8); K.emit('boss', { foe: f });
      await K.wait(3.6);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXL.phase === 1) {
          if (FXL.turn === 0) { sayL(K, FXL.coachSt, 'coach', 5.6, 'coach'); await K.wait(4.4); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[mhboss] tac turn', e); } }
          const r = await askStory(K, FXL);
          FXL.turn++;
          if (r && r.mhStory) {
            // the scene and the deed in one sentence: the memory replays ×2
            const L0 = r.mhStory.mood === 'S' ? 'S' : 'B'; LETTERS.past.push(L0);
            toast(`${L0} · ${Q().fillEn(L0 === 'S' ? 'A story: the scene going on, the deed cutting in!' : 'The scene was still going on: tell it as the scene, not as what happened.')}`);
            for (const c of r.clauses) Object.assign(c, { tacMult: (c.tacMult || 1) * 2, tacSub: 'STORY ×2' });
            sayL(K, FXL.coachSt, 'story', 2.6, 'coach');
          }
          const past = isTense(r, ['pret', 'impf']) || !!(r && r.mhStory);
          await K.perform(r);
          if (past) {
            const n = r && r.clauses ? r.clauses.filter(c => !c.tb || ['pret', 'impf'].includes(c.tb.tense)).length : 1;
            FXL.hits = Math.min(3, FXL.hits + (n >= 2 || (r && r.mhStory) ? 2 : 1)); ST.star(ST.worldOf(f, 'head'), '#f2c94c', 1.1); K.emit('knockdown'); K.refreshLabels(); sayL(K, f, 'ouch', 1.8, 'foe boss');
            try { if (ST.S && ST.S.fx && ST.S.fx.puff) { const p = ST.worldOf(f, 'mid'); ST.S.fx.puff(p.x, p.y, p.z, 14, 0.4, '#c8c4b8'); } } catch (e) { /* */ }
            await K.wait(1.0);
          } else { sayL(K, FXL.coachSt, 'now', 2.6, 'coach'); await K.wait(1.4); }
          if (FXL.hits >= 3) { await mothForgets(K); continue; }
          const dust = FXL.turn % 2 === 1;
          await wave(K, FXL, PT() && PT().FIGHT, dust ? 'dust' : 'gust', dust ? ['#e8e4d8', '#6a5a3a'] : ['#f2ead8', '#8a6a3a'], dust);
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[mhboss] tac after', e); } }
        } else {
          const T0 = FXL.answered === 0 ? PT().TASKS.moth1 : PT().TASKS.moth2;
          rung(K, T0, 'The Lantern Moth · tell it the night');
          const r = await answerAsk(K, T0, PT().TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.past.push(L0); toast(`${L0} · ${r.grade.why}${r.grade.tip ? ' · ' + r.grade.tip : ''}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXL.answered++; FXL.color = FXL.answered / 2; K.refreshLabels(); Sound.play('chime');
            if (FXL.answered >= 2) { await mothRemembers(K); return 'win'; }
            sayL(K, f, 'q2', 4.4); await K.wait(3.8);
          } else {
            const [t, en] = fl('answer'); K.say(FXL.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.6 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXL && FXL.phase === 1) await wave(K, FXL, PT() && PT().FIGHT, 'gust', ['#f2ead8', '#8a6a3a'], false); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function mothForgets(K) {
    const { A: AC, ST } = K, f = FXL.f;
    FXL.phase = 2; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); ST.shake(0.15, 0.3); Sound.play('swoosh');
    await K.wait(0.6);
    sayL(K, f, 'forgot', 5.6); await K.wait(5.0);
    sayL(K, FXL.coachSt, 'answer', 3.2, 'coach'); await K.wait(1.8);
  }
  async function mothRemembers(K) {
    const { A: AC, ST } = K, f = FXL.f;
    FXL.color = 1; FXL.flap = true;
    sayL(K, f, 'remember', 3.4); Sound.play('chime'); await K.wait(2.8);
    FXL.flap = false;
    sayL(K, f, 'win', 5.8); ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 9 });
    await K.wait(4.6);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the Stone Gargoyle (tomorrow)
  // «Si fueras de cristal, {mimo} te golpearía»: the what-if read off the front (or the end); its material, its mood; the second half
  // (the conditional) turned into the command it imagines. mood: 'S' (the imperfect subjunctive), 'B' (a real if: «si eres de…»), 'X'
  // (the conditional right after «si»: «si serías»: nothing happens); main: 'S' (the conditional), 'B' (the future or the present)
  const IFOUT = {
    es: { si: ['si'], good: ['fueras', 'fueses', 'fuera', 'fuese', 'estuvieras', 'estuvieses'], real: ['eres', 'es', 'estas', 'esta'], cond: ['serias', 'seria', 'estarias'], of: ['de', 'del'] },
  };
  const ES_IMP = { haria: 'haz', pondria: 'pon', saldria: 'sal', diria: 'di', iria: 've', subiria: 'sube', trepar: 'trepa' };
  // es: the second half's verb, conditional (golpearía, saltaría) → the command (golpea, salta); future → the command too (graded B)
  const ES_KEEP = ['por', 'para', 'era', 'eras', 'sera', 'seria', 'fuera', 'fueras', 'madera', 'cera', 'afuera', 'primera', 'tercera', 'espera', 'escalera', 'pera'];
  function esMain(t) {
    let main = 'S';
    // (no \b: a word ending in «á» or «é» has no word boundary after it in a JS regex)
    const out = String(t).replace(/(^|[^a-zñáéíóúü])([a-zñáéíóúü]+?)([aei])r(ía|ia|ías|ias|á|a|é|e|án|an)(?![a-zñáéíóúü])/gi, (m, pre, stem, v, end) => {
      const word = m.slice(pre.length), lw = nrmW(word); if (ES_KEEP.includes(lw)) return m;
      const e = nrmW(end); if (e === 'a' || e === 'e' || e === 'an') main = 'B';
      if (ES_IMP[lw]) return pre + ES_IMP[lw];
      return pre + stem + (v === 'a' ? 'a' : 'e');
    });
    return { text: out, main };
  }
  // the other languages' what-ifs: pt «Se você fosse de vidro, {mimo} bateria em você» (the imperfeito do subjuntivo: S; «se você é /
  // for»: a real if, B; «se seria»: X; the second half in the futuro do pretérito: S, the future or «vai»: B); de «Wenn du aus Glas
  // wärst, würde {mimo} dich schlagen» (Konjunktiv II: S; «wenn du … bist»: B; «würde»: S, «wird»: B); zh «要是你是玻璃做的，{mimo}就会
  // 打你» (要是 / 如果 / 假如, then 会 or 能: S; no 会: B; 了: X); ja «もしガラスだったら、{mimo}は叩くでしょう» (〜たら / 〜なら / 〜ば, then
  // でしょう / だろう: S; the bare verb: B; the past た at the end: X)
  const IFX = {
    pt: { si: ['se'], good: x => /(ss[ea]|ssem|sses)$/.test(x) && !['esse', 'essa', 'esses', 'essas', 'nesse', 'nessa', 'desse', 'dessa'].includes(x), real: ['e', 'es', 'esta', 'for', 'fores', 'estiver', 'forem'], cond: /(ria|rias|riam)$/, mainS: /(ria|rias|riam|riamos)$/, mainB: /(ra|rao|remos)$|^vai$|^vou$/ },
    de: { si: ['wenn', 'falls'], good: ['warst', 'ware', 'warest', 'hattest', 'hatte', 'konntest', 'konnte'], real: ['bist', 'ist'], mainS: ['wurde', 'wurdest', 'wurden', 'konnte', 'konntest'], mainB: ['wird', 'wirst'] },
  };
  function ifOutOther(text, lg) {
    const raw = String(text || '').replace(/[¡!¿?。！？]/g, ' ').trim();
    const MW = MAT_WORDS[lg] || {}, matIn = s => { const f = s.replace(/\s+/g, ''), n = ' ' + nrmW(s) + ' '; for (const [k, list] of Object.entries(MW)) if (list.some(w => (/[぀-ヿ一-鿿]/.test(w) ? f.includes(w) : n.includes(' ' + nrmW(w) + ' ')))) return k; return null; };
    if (lg === 'zh' || lg === 'ja') {
      const parts = raw.split(/[，,、;；]/).map(s => s.trim()).filter(Boolean); if (parts.length < 2) return null;
      const ifRe = lg === 'zh' ? /要是|如果|假如|假设|万一|的话/ : /もし|たら|なら|れば|えば|けば|せば|てば|めば|ねば|べば|げば/, ifRom = lg === 'zh' ? /\b(yao ?shi|ru ?guo|jia ?ru|jia ?she|de ?hua)\b/ : /\bmoshi\b|tara\b|nara\b|reba\b/;
      const i = parts.findIndex(s => ifRe.test(s.replace(/\s+/g, '')) || ifRom.test(nrmW(s))); if (i < 0) return null;
      const clause = parts[i], rest = parts.filter((_, j) => j !== i).join('、'), all = raw.replace(/\s+/g, ''), rr = nrmW(rest);
      if (!rest) return null;
      let mood = 'S', main = 'S';
      if (lg === 'zh') { const rf = rest.replace(/\s+/g, ''), would = /会|能|可以/.test(rf) || /\b(hui|neng|ke ?yi)\b/.test(rr); if ((/了/.test(rf) || /\ble\b/.test(rr)) && !would) mood = 'X'; if (!would) main = 'B'; void all; }
      else { if (/(た|だ|ました)$/.test(rest.replace(/\s+/g, '')) || /(ta|da|mashita)$/.test(rr.replace(/[^a-z]/g, ''))) mood = 'X'; if (!/でしょう|だろう|のに|かも/.test(rest.replace(/\s+/g, '')) && !/(deshou|darou|noni|kamo)/.test(rr.replace(/[^a-z]/g, ''))) main = 'B'; }
      return { mood, mat: matIn(clause), rest, main };
    }
    const W = IFX[lg]; if (!W) return null;
    const cut = raw.search(/[,;]/); if (cut < 0) return null;
    const a = raw.slice(0, cut).trim(), b = raw.slice(cut + 1).trim();
    const isIf = s => { const n = s.split(/\s+/).map(nrmW); return n.some(x => W.si.includes(x)) ? n : null; };
    let clause = isIf(a), rest = b, cl = a; if (!clause) { clause = isIf(b); rest = a; cl = b; }
    if (!clause || !rest) return null;
    const has = (list, x) => (typeof list === 'function' ? list(x) : list instanceof RegExp ? list.test(x) : list.includes(x));
    let mood = null;
    if (clause.some(x => has(W.good, x))) mood = 'S'; else if (W.cond && clause.some(x => has(W.cond, x))) mood = 'X'; else if (clause.some(x => has(W.real, x))) mood = 'B';
    if (!mood) return null;
    const n = rest.split(/\s+/).map(nrmW), main = n.some(x => has(W.mainS, x)) ? 'S' : n.some(x => has(W.mainB, x)) ? 'B' : 'S';
    return { mood, mat: matIn(cl), rest, main };
  }
  function ifOut(text, lg) {
    if (lg !== 'es') return ifOutOther(text, lg);
    const W = IFOUT[lg]; if (!W) return null;
    const raw = String(text || '').replace(/[¡!¿?]/g, ' ').trim();
    const cut = raw.search(/[,;]/); if (cut < 0) return null;
    const a = raw.slice(0, cut).trim(), b = raw.slice(cut + 1).trim();
    const isIf = s => { const n = s.split(/\s+/).map(nrmW); return n[0] === 'si' || n.includes('si') ? n : null; };
    let clause = isIf(a), rest = b; if (!clause) { clause = isIf(b); rest = a; }
    if (!clause || !rest) return null;
    let mood = null;
    if (clause.some(x => W.good.includes(x))) mood = 'S'; else if (clause.some(x => W.cond.includes(x))) mood = 'X'; else if (clause.some(x => W.real.includes(x))) mood = 'B';
    if (!mood) return null;
    const MW = MAT_WORDS[lg] || {}; let mat = null;
    for (const [k, list] of Object.entries(MW)) if (list.some(w => clause.includes(nrmW(w)))) { mat = k; break; }
    if (!mat) return { mood, mat: null, rest, main: 'S' };
    const m = esMain(rest); return { mood, mat, rest: m.text.replace(/\bte\b\s*/gi, '').replace(/\ba\s+ti\b/gi, '').trim(), main: m.main };
  }
  async function askIf(K, FX) {
    const Pp = _ && _.P; if (!Pp) return K.askOrFlee('command');
    const parse0 = Pp.parse, lg = lang(), noun = bossNoun(FT(), lg);
    Pp.parse = function (text, ctx) {
      const w = ifOutAny(text, lg);
      if (w && w.mat && w.mood !== 'X' && lg !== 'es') {
        const r3 = compose(this, parse0, ctx, verbsIn(w.rest, lg), FX.f);
        if (r3) return Object.assign(r3, { raw: text, mhIf: w, previewHtml: `<b>💭 ${esc(Q().fillEn('Imagine it: ' + w.mat))}</b>` });
      }
      if (w && w.mat && w.mood !== 'X' && lg === 'es') {
        let rest = w.rest;
        if (lg === 'es' && !new RegExp('\\b' + noun + '\\b', 'i').test(rest)) rest = rest.replace(/^(\S+\s+)?(\S+)/, (m0, who0, v) => (who0 ? who0 : '') + v + ' a la ' + noun);
        let r2 = parse0.call(this, rest, Object.assign({}, ctx, { tbSkip: true }));
        if (!(r2 && r2.ok)) r2 = parse0.call(this, w.rest, Object.assign({}, ctx, { tbSkip: true }));
        if (r2 && r2.ok && r2.kind === 'command' && r2.clauses && r2.clauses.length) { for (const c of r2.clauses) c.target = FX.f; return Object.assign(r2, { raw: text, mhIf: w, previewHtml: `<b>💭 ${esc(Q().fillEn('Imagine it: ' + w.mat))}</b>` }); }
      }
      if (w && w.mood === 'X') return { ok: true, kind: 'miss', raw: text, mhIf: w, clauses: [], untaught: [], previewHtml: '' };
      return parse0.call(this, text, ctx);
    };
    try { return await K.askOrFlee('command'); } finally { Pp.parse = parse0; }
  }
  let FXG = null;
  const fg = key => lineOf(FT() && FT().FIGHT, key);
  const sayG = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fg(key); K.say(st0, t, { cls, en, dur }); };
  const PGA = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'stone_gargoyle'); if (!f) { FXG = null; return; }
      FXG = { f, hits: 0, phase: 1, turn: 0, answered: 0, color: 0, mat: null, swoop: false, lash: false, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.future = [];
      playSong('boss_mh_gargoyle');
    },
    floor: f => (f && f.species === 'stone_gargoyle' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXG) return 'flee';
      const f = FXG.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.2, dist: 11 });
      sayG(K, f, 'intro', 3.8); K.emit('boss', { foe: f });
      await K.wait(3.6);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXG.phase === 1) {
          if (FXG.turn === 0) { sayG(K, FXG.coachSt, 'coach', 5.8, 'coach'); await K.wait(4.6); }
          const r = await askIf(K, FXG);
          FXG.turn++;
          if (r && r.kind === 'miss' && r.mhIf) {
            LETTERS.future.push('C'); sayG(K, FXG.coachSt, 'condsi', 4.0, 'coach'); await K.wait(2.6);
          } else if (r && r.mhIf) {
            // imagined as something else: for this turn, it is; the hit lands ×2
            const w = r.mhIf, L0 = w.mood === 'S' && w.main === 'S' ? 'S' : 'B'; LETTERS.future.push(L0);
            toast(`${L0} · ${Q().fillEn(L0 === 'S' ? 'Imagined! For one turn, it’s ' + w.mat + '.' : w.mood === 'B' ? 'A real if, as if it could happen any day… imagine it instead (the what-if form).' : 'Imagined! Now the second half: what WOULD happen.')}`);
            FXG.mat = w.mat; K.refreshLabels(); Sound.play('chime');
            ST.shot('focus', AC.mimo, f, { up: 0.9, dist: 9 }); sayG(K, f, 'mat_' + w.mat, 2.2, 'foe boss'); await K.wait(1.4);
            for (const c of r.clauses) Object.assign(c, { tacMult: 2, tacSub: 'IMAGINE ×2' });
            await K.perform(r);
            FXG.hits = Math.min(3, FXG.hits + (r.clauses.length >= 2 ? 2 : 1)); ST.star(ST.worldOf(f, 'head'), '#f2c94c', 1.2); K.emit('knockdown'); K.refreshLabels(); sayG(K, f, 'ouch', 1.8, 'foe boss');
            await K.wait(1.0); FXG.mat = null;
          } else if (r && r.kind === 'command') {
            // a plain plan or command: it bounces off the stone before {mimo} even moves (CLANK, no harm)
            try { ST.shake(0.12, 0.25); Sound.play('land', 14); Sound.play('crack'); if (ST.S && ST.S.fx && ST.S.fx.puff) { const p = ST.worldOf(f, 'mid'); ST.S.fx.puff(p.x, p.y, p.z, 8, 0.2, '#b8b4ac'); } } catch (e) { /* */ }
            sayG(K, f, 'stone', 2.2, 'foe boss'); await K.wait(1.2); sayG(K, FXG.coachSt, 'hint', 4.2, 'coach'); await K.wait(2.6);
          } else if (r) { await K.perform(r); }
          if (FXG.hits >= 3) { await gargCurls(K); continue; }
          const swoop = FXG.turn % 2 === 1;
          await wave(K, FXG, FT() && FT().FIGHT, swoop ? 'swoop' : 'tail', swoop ? ['#e8e4dc', '#4a4844'] : ['#d8d4cc', '#5a5650'], swoop);
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[mhboss] tac after', e); } }
        } else {
          const T0 = FXG.answered === 0 ? FT().TASKS.garg1 : FT().TASKS.garg2;
          rung(K, T0, 'The Stone Gargoyle · answer its fear with a what-if');
          const r = await answerAsk(K, T0, FT().TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.future.push(L0); toast(`${L0} · ${r.grade.why}${r.grade.tip ? ' · ' + r.grade.tip : ''}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXG.answered++; FXG.color = FXG.answered / 2; K.refreshLabels(); Sound.play('chime');
            if (FXG.answered >= 2) { await gargGives(K); return 'win'; }
            sayG(K, f, 'q2', 4.4); await K.wait(3.8);
          } else {
            const [t, en] = fg('answer'); K.say(FXG.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.6 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXG && FXG.phase === 1) await wave(K, FXG, FT() && FT().FIGHT, 'tail', ['#d8d4cc', '#5a5650'], false); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function gargCurls(K) {
    const { A: AC, ST } = K, f = FXG.f;
    FXG.phase = 2; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 9 }); Sound.play('pip');
    await K.wait(0.8);
    sayG(K, f, 'curl', 5.6); await K.wait(4.8);
    sayG(K, FXG.coachSt, 'answer', 3.2, 'coach'); await K.wait(1.8);
  }
  async function gargGives(K) {
    const { A: AC, ST } = K, f = FXG.f;
    FXG.color = 1;
    sayG(K, f, 'remember', 3.6); Sound.play('chime'); await K.wait(3.0);
    sayG(K, f, 'win', 6.0); ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 10 });
    await K.wait(4.8);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the fights (through TIME.fight: the world's tense, its realm), on the
  // marsh's arenas (marsh_time_battle.js) when they're there
  const arena = (name, x, z) => { const b = BATTLE._ && BATTLE._.arenaBuilders; return b && b[name] ? { x, z, biome: name } : { x, z, biome: 'marsh' }; };
  async function fightMoth() {
    hook();
    return TIME.fight({ boss: 'lantern_moth', foes: [{ kind: 'lantern_moth', color: 'yellow', size: 'big', giant: 1, hp: 40 }], place: arena('lanternlake', -14, -330), tb: { scene: () => false } });
  }
  async function fightGargoyle() {
    hook();
    return TIME.fight({ boss: 'stone_gargoyle', foes: [{ kind: 'stone_gargoyle', color: 'white', size: 'big', giant: 1, hp: 40 }], place: arena('stonewood', -45, -372), tb: { noGlimpse: true, noQueue: true, scene: () => false } });
  }
  try { hook(); } catch (e) { console.error('[mhboss] hooks', e); }
  // (the other languages' readers are added by marsh_text_pt.js … _ja.js: MHBOSS.addLang(lang, { storyOut, ifOut, matWords })
  function addLang(l, o = {}) { if (o.story) STORYOUT[l] = o.story; if (o.ifout) IFOUT[l] = o.ifout; if (o.mats) MAT_WORDS[l] = o.mats; if (o.storyFn) STORY_FN[l] = o.storyFn; if (o.ifFn) IF_FN[l] = o.ifFn; }
  const STORY_FN = {}, IF_FN = {};
  const storyOutAny = (text, lg) => (STORY_FN[lg] ? STORY_FN[lg](text) : storyOut(text, lg));
  const ifOutAny = (text, lg) => (IF_FN[lg] ? IF_FN[lg](text) : ifOut(text, lg));
  return { init: () => { try { hook(); } catch (e) { console.error('[mhboss] hooks', e); } }, hook, fightMoth, fightGargoyle, letter, mothModel, gargModel, PMO, PGA, answerAsk, wave, rung, grayable, anchorsOf, lineOf, LETTERS, isTense,
    storyOut: storyOutAny, ifOut: ifOutAny, addLang, MATS, MAT_WORDS, STORYOUT, IFOUT, IFX, verbsIn,
    get FXL() { return FXL; }, get FXG() { return FXG; } };
})();
