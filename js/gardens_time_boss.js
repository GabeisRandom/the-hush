'use strict';
// The Bloom Gardens' two time bosses (DESIGN.md 20 "T3a"): plug-ins on battle/flow.js (BATTLE._.plugins), fought through TIME.fight
// so the world's tense rules apply (battle/timebattle.js).
//   'faded_bloom', the Faded Bloom (the new greenhouse's dome, long ago): the greenhouse's heart, a giant flower gone gray the day the
//     boy who watered it left. Phase 1: commands told as memories land («{mimo} saltó…», «{mimo} trepó…»: gray dust flies off its
//     petals); the present only confuses {mimo}; its gray pollen is dodged. Three hits and it closes up: only a description of how it
//     was opens it again (GPTXT.TASKS dome, happy: «Antes había mucha luz», «El niño estaba contento»); each one floods a little color
//     back into its petals, then it remembers it was red and gives back Elio's echo.
//   'thorn_warden', the Thorn Warden (the greenhouse's gray dome, tomorrow): what grew when nobody asked for anything anymore. No
//     commands: it only listens to polite requests. Three rounds, three of its moves (it raises its thorns, it grabs {mimo}, it shuts
//     the windows): ask it nicely to stop (GFTXT.TASKS lower, release, windows: «¿Podrías bajar las espinas, por favor?»); a bare
//     command makes the thorns grow (a lash to dodge), today's plain «¿puedes…?» gets a tip. Then it softens and asks what you'd want:
//     two wishes (wish1, wish2: «Me encantaría ver las flores otra vez», «Querría oír las abejas»).
// Each has its own song (gardens_time_music.js: 'boss_gd_bloom', 'boss_gd_thorn'), bestiary line, icon and voice; neither takes your
// last heart.   GDBOSS.fightBloom() · GDBOSS.fightWarden() · GDBOSS.letter('past' | 'future')
const GDBOSS = (() => {
  const BT = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = BT && BT._;
  const Q = () => (typeof GARDT !== 'undefined' ? GARDT : null);
  const toast = s => UI.toast(Q() && Q().cjRun ? Q().cjRun(s) : s);     // (a tip's bare 汉字 follow the reading mode)
  const lang = () => (Q() ? Q().lang() : 'es');
  const isC = () => lang() === 'zh' || lang() === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fillM = s => (Q() ? Q().fillMimo(s, lang()) : String(s || '').replace(/\{mimo\}/g, 'Mimo'));
  const lineOf = (TAB, key) => { const T = (TAB || {})[key] || {}, l = lang(); return [fillM(T[l] || T.en || ''), Q() ? Q().fillEn(T.en || '') : String(T.en || '')]; };
  const RANK = 'SABCD';
  const LETTERS = { past: [], future: [] };
  function letter(w) { const L0 = LETTERS[w] || []; if (!L0.length) return 'B'; const avg = L0.reduce((a, x) => a + RANK.indexOf(x), 0) / L0.length; return RANK[Math.max(0, Math.min(4, Math.round(avg)))]; }
  const playSong = name => { try { if (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(name)) Sound.setSong(name); } catch (e) { /* */ } };
  const isTense = (r, ts) => !!(r && r.clauses && r.clauses.some(c => c.tb && ts.includes(c.tb.tense)));
  const PT = () => (typeof GPTXT !== 'undefined' ? GPTXT : null), FT = () => (typeof GFTXT !== 'undefined' ? GFTXT : null);

  // a material that drains to gray (uGray 1) and fills back with color (uGray 0)
  function grayable(start) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad }), u = { uGray: { value: start } };
    m.onBeforeCompile = sh => { sh.uniforms.uGray = u.uGray; sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.86, l * 0.92), uGray); }'); };
    m.customProgramCacheKey = () => 'gdBossGray';
    return { m, u };
  }
  const anchorsOf = (body, list) => { const a = {}; for (const [n, p] of list) { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); a[n] = o; } return a; };

  // ------------------------------------------------------------ the Faded Bloom's model (a giant flower: stem, leaves, a ring of petals,
  // a sleepy face in its golden heart; gray until it remembers)
  function bloomModel() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const k = PAST.API.Kit(), KG = PAST.API.KG, gm = grayable(1);
    k.add(KG.cyl6, 0, 1.0, 0, 0.18, 2.0, 0.18, '#5f8a4a', { ink: 0.01 });
    for (let j = 0; j < 4; j++) { const a = j * 1.6; k.add(KG.sphere, Math.cos(a) * 0.7, 0.4 + j * 0.25, Math.sin(a) * 0.7, 0.8, 0.08, 0.32, '#4f9a45', { ry: -a, rz: 0.35, ink: 0.008 }); }
    const inner = new THREE.Group(); inner.position.y = 2.1; body.add(inner);
    const kp = PAST.API.Kit();
    for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU; kp.add(KG.sphere, Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85, 0.9, 0.14, 0.45, j % 2 ? '#d9434f' : '#e8564f', { ry: -a, rz: 0.3, ink: 0.01 }); }
    kp.add(KG.sphere, 0, 0.12, 0, 0.5, 0.3, 0.5, '#f2c94c', { ink: 0.01 });
    for (const s of [-1, 1]) kp.add(KG.ball6, s * 0.17, 0.3, 0.42, 0.06, 0.03, 0.03, '#2b2235', { ink: 0 });
    kp.add(KG.ball6, 0, 0.2, 0.47, 0.08, 0.03, 0.03, '#2b2235', { ink: 0 });
    k.build(body, { mat: gm.m }); kp.build(inner, { mat: gm.m });
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd7a0', transparent: true, opacity: 0.18, depthWrite: false })); gl.scale.setScalar(4.2); gl.position.y = 2.0; root.add(gl);
    const anchors = anchorsOf(body, [['top', [0, 3.0, 0]], ['mid', [0, 1.4, 0.3]], ['head', [0, 2.4, 0.4]], ['face', [0, 2.3, 0.7]], ['feet', [0, 0.05, 0]]]);
    return { root, body, inner, gl, gm, anchors, kind: 'faded_bloom', scale: 1, radius: 1.2, height: 3.0, parts: [], labelH: 3.6, hover: 0, L: {} };
  }
  function poseBloom(h, F, t) {
    const closed = FXB ? FXB.closed : 0;
    h.inner.scale.set(1 - closed * 0.45, 1 + closed * 0.6, 1 - closed * 0.45);
    h.body.rotation.z = Math.sin(t * 1.1) * 0.05;
    h.inner.rotation.y = t * 0.2;
    if (h.gm) { const want = FXB ? 1 - FXB.color : 1; h.gm.u.uGray.value += (want - h.gm.u.uGray.value) * 0.05; }
    h.gl.material.opacity = 0.14 + 0.06 * Math.sin(t * 2) + (FXB ? FXB.color * 0.2 : 0);
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }
  // ------------------------------------------------------------ the Thorn Warden's model (a great round hedge of gray thorns, two
  // thorny arms, a crown of thorns, two pale eyes; it greens as it softens)
  function wardenModel() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const k = PAST.API.Kit(), KG = PAST.API.KG, gm = grayable(1), rn = (() => { let q = 23; return () => ((q = (q * 16807) % 2147483647) / 2147483647); })();
    k.add(TK.G.ico1, 0, 1.4, 0, 1.3, 1.3, 1.1, '#4f8a45', { ink: 0.016 }).add(TK.G.ico1, 0, 2.7, 0.1, 0.8, 0.7, 0.7, '#5f9a4f', { ink: 0.012 });
    for (let j = 0; j < 18; j++) { const a = rn() * TAU, b = rn() * Math.PI - 0.4, x = Math.cos(a) * Math.cos(b) * 1.25, y = 1.4 + Math.sin(b) * 1.2, z = Math.sin(a) * Math.cos(b) * 1.05; k.add(KG.cone, x, y, z, 0.06, 0.32, 0.06, '#3f5a3a', { rz: -a, rx: b, ink: 0 }); }
    for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; k.add(KG.cone, Math.cos(a) * 0.45, 3.35, Math.sin(a) * 0.45, 0.08, 0.5, 0.08, '#3f5a3a', { ink: 0.004 }); }
    const arms = [];
    for (const s of [-1, 1]) { const arm = new THREE.Group(); arm.position.set(s * 1.2, 1.9, 0.2); body.add(arm); const ka = PAST.API.Kit(); ka.rod([0, 0, 0], [s * 1.0, -0.6, 0.6], 0.14, '#4f6a45', 0.008); for (let j = 0; j < 4; j++) ka.add(KG.cone, s * j * 0.25, -j * 0.15, j * 0.15, 0.05, 0.22, 0.05, '#3f5a3a', { rz: s * 1.2, ink: 0 }); ka.build(arm, { mat: gm.m }); arms.push(arm); }
    k.build(body, { mat: gm.m });
    const ke = PAST.API.Kit(); for (const s of [-1, 1]) ke.add(KG.ball6, s * 0.24, 2.8, 0.72, 0.1, 0.12, 0.05, '#e8f4ff', { ink: 0 }); ke.build(body, { shadow: false });
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#b8c4b0', transparent: true, opacity: 0.18, depthWrite: false })); gl.scale.setScalar(4.6); gl.position.y = 1.8; root.add(gl);
    const inner = new THREE.Group(); body.add(inner);
    const anchors = anchorsOf(body, [['top', [0, 3.5, 0]], ['mid', [0, 1.4, 0.6]], ['head', [0, 2.7, 0.6]], ['face', [0, 2.7, 0.9]], ['feet', [0, 0.05, 0]]]);
    return { root, body, inner, gl, gm, arms, anchors, kind: 'thorn_warden', scale: 1, radius: 1.4, height: 3.4, parts: [], labelH: 4.0, hover: 0, L: {} };
  }
  function poseWarden(h, F, t) {
    const soft = FXW ? Math.min(1, FXW.hits / 3 * 0.6 + FXW.answered * 0.2) : 0;
    if (h.gm) h.gm.u.uGray.value += ((1 - soft) - h.gm.u.uGray.value) * 0.05;
    h.body.rotation.z = Math.sin(t * 0.9) * 0.04;
    const grab = FXW && FXW.move === 'grab' ? 1 : 0, up = FXW && FXW.move === 'thorns' ? 1 : 0;
    (h.arms || []).forEach((a, j) => { a.rotation.z = (j ? -1 : 1) * (0.2 + Math.sin(t * 1.7 + j) * 0.15 + up * 0.8); a.rotation.x = -grab * 0.9; });
    h.body.scale.set(1 + up * 0.08, 1 + up * 0.12, 1 + up * 0.08);
    h.gl.material.opacity = 0.14 + 0.05 * Math.sin(t * 2);
    if (F && F.sx) h.body.scale.multiply(new THREE.Vector3(F.sx, F.sy || 1, F.sx));
  }

  // ------------------------------------------------------------ the battle's hooks: species, models, labels, the bestiary
  const KINDS = ['faded_bloom', 'thorn_warden'];
  function hook() {
    try { if (typeof BOSS_MUSIC !== 'undefined' && BOSS_MUSIC.SONG) { BOSS_MUSIC.SONG.faded_bloom = 'boss_gd_bloom'; BOSS_MUSIC.SONG.thorn_warden = 'boss_gd_thorn'; } } catch (e) { /* */ }
    if (!_) return;
    const SP = { faded_bloom: PT() ? PT().SPECIES : null, thorn_warden: FT() ? FT().SPECIES : null };
    for (const [id, table] of Object.entries(SP)) if (table) for (const [lg, sp] of Object.entries(table)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species[id]) { Lg.species[id] = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
    const M = _.M;
    if (M && !M.gdHooked) {
      M.gdHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (KINDS.includes(String(k || '')) ? String(k) : k0(k));
      M.build = o => (o && o.kind === 'faded_bloom' ? bloomModel() : o && o.kind === 'thorn_warden' ? wardenModel() : b0(o));
      M.pose = (h, F, t, dt) => (h && h.kind === 'faded_bloom' ? poseBloom(h, F, t, dt) : h && h.kind === 'thorn_warden' ? poseWarden(h, F, t, dt) : p0(h, F, t, dt));
      M.brighten = (h, k) => (h && KINDS.includes(h.kind) ? undefined : br0(h, k));
    }
    const U = _.UI;
    if (U && U.label && !U.gdHooked) { U.gdHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && KINDS.includes(f.species) ? bossLabel(f) : html); }; }
    if (_.RW && _.RW.LORE) {
      if (PT() && !_.RW.LORE['boss:faded_bloom']) _.RW.LORE['boss:faded_bloom'] = PT().LORE;
      if (FT() && !_.RW.LORE['boss:thorn_warden']) _.RW.LORE['boss:thorn_warden'] = FT().LORE;
    }
    if (_.RW && _.RW.KIND_EN) { _.RW.KIND_EN.faded_bloom = 'the Faded Bloom'; _.RW.KIND_EN.thorn_warden = 'the Thorn Warden'; }
    if (_.UI && _.UI.ICON) {
      if (!_.UI.ICON.faded_bloom) _.UI.ICON.faded_bloom = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 60 L32 34" stroke="#4f8a45" stroke-width="5"/><g fill="#d9434f" stroke="#2b2235" stroke-width="3"><ellipse cx="32" cy="14" rx="9" ry="12"/><ellipse cx="18" cy="26" rx="12" ry="8"/><ellipse cx="46" cy="26" rx="12" ry="8"/><ellipse cx="24" cy="38" rx="10" ry="7"/><ellipse cx="40" cy="38" rx="10" ry="7"/></g><circle cx="32" cy="27" r="8" fill="#f2c94c" stroke="#2b2235" stroke-width="3"/></svg>';
      if (!_.UI.ICON.thorn_warden) _.UI.ICON.thorn_warden = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="38" r="20" fill="#5f8a4f" stroke="#2b2235" stroke-width="3"/><path d="M14 20 L20 30 M50 20 L44 30 M32 8 L32 20 M22 12 L26 22 M42 12 L38 22" stroke="#2b2235" stroke-width="3"/><circle cx="25" cy="36" r="3.5" fill="#e8f4ff" stroke="#2b2235" stroke-width="2"/><circle cx="39" cy="36" r="3.5" fill="#e8f4ff" stroke="#2b2235" stroke-width="2"/></svg>';
    }
    _.plugins = _.plugins || {}; _.plugins.faded_bloom = PB; _.plugins.thorn_warden = PW;
    try { if (typeof BFX !== 'undefined' && BFX.VOICES) { if (!BFX.VOICES.faded_bloom) BFX.VOICES.faded_bloom = { m: 76, vow: ['a', 'o', 'a'], len: 0.11, gap: 0.06 }; if (!BFX.VOICES.thorn_warden) BFX.VOICES.thorn_warden = { m: 43, vow: ['o', 'u', 'o'], len: 0.13, gap: 0.05 }; } } catch (e) { /* (no battle sounds) */ }
  }
  function bossLabel(f) {
    const l = lang(), bloom = f.species === 'faded_bloom', N = bloom ? (PT() ? PT().NAMES.boss : {}) : (FT() ? FT().NAMES.boss : {});
    const name = isC() && typeof CJK !== 'undefined' ? CJK.html(N[l] || N.en || '', { lang: l }) : esc(N[l] || N.en || '');
    const FX = bloom ? FXB : FXW, left = FX ? Math.max(0, 3 - FX.hits) : 3, p2 = FX && FX.phase === 2;
    return `<div class="bt-chips"><span class="bt-chip name">${name}</span></div><div class="bt-hpbar"><i style="width:${Math.round(100 * (p2 ? (2 - FX.answered) / 2 : left / 3))}%"></i><span>${p2 ? (bloom ? '🌸 ?' : '💬 ?') : (bloom ? '🌸 ' : '🌿 ') + left}</span></div>`;
  }
  // an answer in the box, graded as yours (not a command): GARDT.grade with the world's task
  async function answerAsk(K, T0, tips) {
    const Pp = _ && _.P; if (!Pp || !Q()) return null;
    const parse0 = Pp.parse, lg = lang(); let tip = null, kind = null;
    // (the box's preview parses every keystroke too: an answer shows as one, never as «Mimo understood: …»; battle/flow.js preview)
    Pp.parse = function (text, ctx) {
      const g = Q().grade(T0, text, lg, tips);
      if (g.ok) return { ok: true, kind: 'answer', raw: text, grade: g, clauses: [], untaught: [], previewHtml: '<b>Your answer</b>' };
      kind = g.kind; tip = g.kind !== 'none' && g.why ? g.why : null;
      const r0 = parse0.call(this, text, ctx);
      // a miss the grader knows (now, tomorrow, too bossy) comes back to the fight with its tip, instead of {mimo}'s «¿…?»
      if (tip && (!r0 || !r0.ok)) return { ok: true, kind: 'miss', raw: text, grade: g, clauses: [], untaught: [], previewHtml: '' };
      return r0;
    };
    try {
      const lw = s => (Q().isCl(lg) ? s.charAt(0).toLowerCase() + s.slice(1) : s);     // (a chip is a word in mid-sentence: «hěn», not «Hěn»)
      const frame = Q().plainT(fillM((T0.frame || {})[lg] || '')), chips = ((T0.chips || {})[lg] || []).map(([x, e]) => `${lw(Q().plainT(fillM(x)))} (${e})`).join(' · ');
      const r = await K.askOrFlee('command', { hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}` });
      if (r && r.kind !== 'answer') { if (tip) r.tip = tipText(tip, T0, lg); r.gkind = kind; }
      return r;
    } finally { Pp.parse = parse0; }
  }
  // a tip in the coach's bubble: read as roman, romanized first (the bubble keeps «That’s» whole); read as characters, the model
  // goes back to its notation so the bubble's ruby has the right readings («光» is ひかり)
  function tipText(tip, T0, lg) {
    if (!Q().isCl(lg)) return tip;
    if (typeof CJK !== 'undefined' && CJK.mode && CJK.mode() === 'roman') return Q().cjRun ? Q().cjRun(tip) : tip;
    const mN = fillM((T0.model || {})[lg] || '').replace(/\s*[.。]\s*$/, ''), mP = Q().plainT(mN);
    return mP && tip.includes(mP) ? tip.replace(mP, mN) : tip;
  }
  // a wave thrown at you or {mimo} (gray pollen, a thorn lash): where it's coming from, then dodge it
  function waveSprite(text, col) {
    const cv = document.createElement('canvas'), c = cv.getContext('2d'), font = '900 64px "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif';
    c.font = font; cv.width = Math.min(1024, Math.ceil(c.measureText(text).width) + 56); cv.height = 104;
    c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 14; c.strokeStyle = col[0]; c.strokeText(text, cv.width / 2, 54); c.fillStyle = col[1]; c.fillText(text, cv.width / 2, 54);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false, depthWrite: false }));
    sp.scale.set(0.55 * cv.width / cv.height, 0.55, 1); sp.renderOrder = 12; return sp;
  }
  async function wave(K, FX, TAB, key, col) {
    const { G: BG, A: AC, ST } = K, f = FX.f;
    if (BG.hearts <= 1) return;
    const high = Math.random() < 0.5, tgt = Math.random() < 0.5 ? AC.mimo : AC.you;
    const dw = BG.L && BG.L.dodgeWords ? BG.L.dodgeWords(BG.tier) : null, [cry, cryEn] = lineOf(TAB, key);
    const dTxt = isC() && typeof CJK !== 'undefined' ? CJK.plain(cry, { lang: lang() }) : cry, where = (dw && (high ? dw.high : dw.low)) || (high ? '↑' : '↓');
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.7 });
    K.say(f, `${dTxt} … ${where}`, { cls: 'foe shout boss', en: `${cryEn} ${high ? 'up high' : 'down low'}`, dur: K.readTime(dTxt + where) + 2.0 });
    K.emit('shout', { text: dTxt, high, foe: f, boss: true }); K.dodgeHint(true);
    await K.wait(K.readTime(dTxt + where) + 0.15);
    K.emit('windup', { foe: f, high, boss: true });
    const Tm = BG.t + 0.8, keyc = high ? 'ArrowDown' : 'ArrowUp';
    const tp = K.timingWindow(Tm, keyc, () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
    const spr = waveSprite(dTxt.replace(/[!！¡]/g, '').trim().slice(0, 18) || '…', col), a = ST.worldOf(f, 'face'), b = ST.worldOf(tgt, high ? 'top' : 'feet');
    ST.prop(spr); spr.position.copy(a);
    await K.along(0.8, u => { spr.position.lerpVectors(a, b, u * 1.06); spr.position.y += Math.sin(u * Math.PI) * (high ? 0.45 : 0.12); spr.material.rotation = Math.sin(u * 12) * 0.15; });
    const grade = await tp;
    ST.dropProp(spr);
    K.dodgeResult(f, tgt, grade, 1, {});
    if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
    await K.wait(0.4);
  }
  const rung = (K, T0, what) => { try { if (K.UI && K.UI.rung) K.UI.rung(`${what}: <b>«${esc(Q().plainT(fillM((T0.model || {})[lang()] || '')))}»</b>`); } catch (e) { /* */ } };

  // ------------------------------------------------------------ the Faded Bloom (the Past)
  let FXB = null;
  const fb = key => lineOf(PT() && PT().FIGHT, key);
  const sayB = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fb(key); K.say(st0, t, { cls, en, dur }); };
  const PB = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'faded_bloom'); if (!f) { FXB = null; return; }
      FXB = { f, hits: 0, phase: 1, turn: 0, answered: 0, closed: 0, color: 0, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.past = [];
      playSong('boss_gd_bloom');
    },
    floor: f => (f && f.species === 'faded_bloom' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXB) return 'flee';
      const f = FXB.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.2, dist: 11 });
      sayB(K, f, 'intro', 3.2); K.emit('boss', { foe: f });
      await K.wait(3.0);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXB.phase === 1) {
          if (FXB.turn === 0) { sayB(K, FXB.coachSt, 'coach', 4.4, 'coach'); await K.wait(3.4); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[gdboss] tac turn', e); } }
          const r = await K.askOrFlee('command');
          const past = isTense(r, ['pret', 'impf']);
          FXB.turn++;
          await K.perform(r);
          if (past) { FXB.hits = Math.min(3, FXB.hits + 1); ST.star(ST.worldOf(f, 'head'), '#fff3a0', 1.1); K.emit('knockdown'); K.refreshLabels(); sayB(K, f, 'ouch', 1.8, 'foe boss'); try { if (ST.S && ST.S.fx && ST.S.fx.puff) { const p = ST.worldOf(f, 'head'); ST.S.fx.puff(p.x, p.y, p.z, 10, 0.3, '#c8c4cc'); } } catch (e) { /* */ } await K.wait(1.0); }
          else { sayB(K, FXB.coachSt, 'now', 2.6, 'coach'); await K.wait(1.4); }
          if (FXB.hits >= 3) { await bloomCloses(K); continue; }
          await wave(K, FXB, PT() && PT().FIGHT, 'puff', ['#e8e4f4', '#6a6478']);
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[gdboss] tac after', e); } }
        } else {
          const T0 = FXB.answered === 0 ? PT().TASKS.dome : PT().TASKS.happy;
          rung(K, T0, 'The Faded Bloom · describe how it was');
          const r = await answerAsk(K, T0, PT().TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.past.push(L0); toast(`${L0} · ${r.grade.why}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXB.answered++; FXB.color = FXB.answered / 2; FXB.closed = Math.max(0, 1 - FXB.answered * 0.5); K.refreshLabels(); Sound.play('chime');
            if (FXB.answered >= 2) { await bloomGives(K); return 'win'; }
            sayB(K, f, 'q2', 3.8); await K.wait(3.2);
          } else {
            const [t, en] = fb('answer'); K.say(FXB.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.4 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXB && FXB.phase === 1) await wave(K, FXB, PT() && PT().FIGHT, 'puff', ['#e8e4f4', '#6a6478']); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function bloomCloses(K) {
    const { A: AC, ST } = K, f = FXB.f;
    FXB.phase = 2; K.refreshLabels();
    await K.along(0.8, u => { FXB.closed = u; });
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); ST.shake(0.2, 0.3); Sound.play('pip');
    await K.wait(0.6);
    sayB(K, f, 'closed', 5.0); await K.wait(4.2);
    sayB(K, FXB.coachSt, 'answer', 3.2, 'coach'); await K.wait(1.8);
  }
  async function bloomGives(K) {
    const { A: AC, ST } = K, f = FXB.f;
    FXB.color = 1; FXB.closed = 0;
    sayB(K, f, 'remember', 3.0); Sound.play('chime'); await K.wait(2.4);
    sayB(K, f, 'win', 5.0); ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 9 });
    await K.wait(3.8);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the Thorn Warden (the Future)
  let FXW = null;
  const fw = key => lineOf(FT() && FT().FIGHT, key);
  const sayW = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fw(key); K.say(st0, t, { cls, en, dur }); };
  const ROUNDS = [['thorns', 'lower'], ['grab', 'release'], ['dark', 'windows']];
  const PW = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'thorn_warden'); if (!f) { FXW = null; return; }
      FXW = { f, hits: 0, phase: 1, turn: 0, answered: 0, move: null, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.future = [];
      playSong('boss_gd_thorn');
    },
    floor: f => (f && f.species === 'thorn_warden' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXW) return 'flee';
      const f = FXW.f;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.2, dist: 11.5 });
      sayW(K, f, 'intro', 3.6); K.emit('boss', { foe: f });
      await K.wait(3.2);
      // (no commands in this fight, only polite requests and wishes: the Future's plan rung, tip and queue stay out of it)
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXW.phase === 1) {
          if (FXW.turn === 0) { sayW(K, FXW.coachSt, 'coach', 4.6, 'coach'); await K.wait(3.6); }
          const [move, task] = ROUNDS[Math.min(2, FXW.hits)], T0 = FT().TASKS[task];
          FXW.move = move; sayW(K, f, move, 2.4); Sound.play(move === 'grab' ? 'swoosh' : 'crunch'); ST.shake(0.15, 0.3);
          if (move === 'grab') { try { ST.shot('focus', f, AC.mimo, { up: 0.6, dist: 8 }); } catch (e) { /* */ } }
          await K.wait(1.6);
          rung(K, T0, 'The Thorn Warden · ask it nicely');
          const r = await answerAsk(K, T0, FT().TIPS);
          FXW.turn++;
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.future.push(L0); toast(`${L0} · ${r.grade.why}${r.grade.tip ? ' · ' + r.grade.tip : ''}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.0 }); await K.wait(1.0);
            FXW.hits++; FXW.move = null; Sound.play('chime'); ST.star(ST.worldOf(f, 'head'), '#9ff5b8', 1.2); K.emit('knockdown'); K.refreshLabels();
            sayW(K, f, 'loosen', 2.2, 'foe boss'); await K.wait(1.6);
            if (FXW.hits >= 3) { await wardenSoftens(K); continue; }
          } else {
            if (r && r.gkind === 'miss') { sayW(K, f, 'rude', 2.0); ST.shake(0.2, 0.3); await K.wait(1.2); }
            const [t, en] = fw('ask'); K.say(FXW.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.6 }); await K.wait(1.8);
            await wave(K, FXW, FT() && FT().FIGHT, 'lash', ['#c8d4c0', '#3f5a3a']);
          }
        } else {
          const T0 = FXW.answered === 0 ? FT().TASKS.wish1 : FT().TASKS.wish2;
          rung(K, T0, 'The Thorn Warden · say a wish');
          const r = await answerAsk(K, T0, FT().TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.future.push(L0); toast(`${L0} · ${r.grade.why}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXW.answered++; K.refreshLabels(); Sound.play('chime');
            if (FXW.answered >= 2) { await wardenGives(K); return 'win'; }
            sayW(K, f, 'q2', 3.4); await K.wait(2.8);
          } else {
            const [t, en] = fw('wish'); K.say(FXW.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.4 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXW && FXW.phase === 1) await wave(K, FXW, FT() && FT().FIGHT, 'lash', ['#c8d4c0', '#3f5a3a']); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function wardenSoftens(K) {
    const { A: AC, ST } = K, f = FXW.f;
    FXW.phase = 2; FXW.move = null; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 9 }); Sound.play('pip');
    await K.wait(0.8);
    sayW(K, f, 'soft', 4.8); await K.wait(4.0);
    sayW(K, FXW.coachSt, 'wish', 3.2, 'coach'); await K.wait(1.8);
  }
  async function wardenGives(K) {
    const { A: AC, ST } = K, f = FXW.f;
    sayW(K, f, 'win', 5.2); Sound.play('chime'); ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 9.5 });
    await K.wait(4.0);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the fights (through TIME.fight: the world's tense, its realm)
  async function fightBloom() {
    hook();
    return TIME.fight({ boss: 'faded_bloom', foes: [{ kind: 'faded_bloom', color: 'red', size: 'big', giant: 1, hp: 40 }], place: { x: 198, z: -64 }, tb: { scene: () => false } });
  }
  async function fightWarden() {
    hook();
    return TIME.fight({ boss: 'thorn_warden', foes: [{ kind: 'thorn_warden', color: 'green', size: 'big', giant: 1, hp: 40 }], place: { x: 198, z: -64 }, tb: { noGlimpse: true, noQueue: true } });
  }
  try { hook(); } catch (e) { console.error('[gdboss] hooks', e); }
  return { init: () => { try { hook(); } catch (e) { console.error('[gdboss] hooks', e); } }, hook, fightBloom, fightWarden, letter, bloomModel, wardenModel, PB, PW,
    get FXB() { return FXB; }, get FXW() { return FXW; } };
})();
