'use strict';
// The Sunken Ruins' two time bosses (DESIGN.md 20.1b "next, the Sunken Ruins"; game/TIME.md "The Sunken Ruins (T4b)"): plug-ins on
// battle/flow.js (BATTLE._.plugins), fought through TIME.fight so the world's tense rules apply (battle/timebattle.js).
//   'clay_parrot', the Clay Parrot (the temple's roof terrace, long ago): the parrot missing from the frieze over the temple's door,
//     woken gray by the flood. It repeats everything it hears… a little bit wrong (never mean: its wrong versions are just silly).
//     Phase 1: commands told as memories land («{mimo} saltó…», «{mimo} golpeó…»; a «y» chain of two past clauses is two hits), the
//     present only confuses {mimo}; its nose dive (up high: «¡Agáchate!») and its clay pellets (down low: «¡Salta!») are dodged out
//     loud (battle/react.js). Three hits and its clay cracks: it squawks the night's reports wrong («La granjera dijo que había visto…
//     ¡una gallina!») and you put them right, passing on what they really said (RUPTXT.TASKS boss1, boss2); each one brings its
//     colors back; then it says right, once, what it heard the young man whisper to the river: Elio's echo.
//   'gray_moray', the Gray Moray (under the sunken temple's bell, tomorrow): it only comes out to bite. Plans land next turn, so a plan
//     for when it's back in its hole splashes; on the turns it stays out, catching its breath, one lands. A plan tied to its moment,
//     «Cuando salga, {mimo} la golpeará» (pt «Quando ela sair…», de «Sobald sie rauskommt, …», zh 它一出来，…就…, ja 出てきたら…),
//     springs as it comes out: ×2, no bite («y» chains: two hits). Its bite (up high: «¡Agáchate!») and its tail (down low: «¡Salta!»)
//     are dodged out loud. Three hits and it curls up and says its fears; you doubt them (RUFTXT.TASKS moray1, moray2: «No creo que la
//     campana te aplaste», «No creo que se asusten de ti»), its color comes back, and it gives back the words a man said to the bell.
// Each has its own song (ruins_time_music.js: 'boss_ru_parrot', 'boss_ru_moray'), bestiary line, icon and voice; neither takes your
// last heart.   RUBOSS.fightParrot() · RUBOSS.fightMoray() · RUBOSS.letter('past' | 'future')
const RUBOSS = (() => {
  const BT = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = BT && BT._;
  const Q = () => (typeof RUINT !== 'undefined' ? RUINT : null);
  const toast = s => UI.toast(Q() && Q().cjRun ? Q().cjRun(s) : s);
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
  const PT = () => (typeof RUPTXT !== 'undefined' ? RUPTXT : null), FT = () => (typeof RUFTXT !== 'undefined' ? RUFTXT : null);

  // a material that drains to gray (uGray 1) and fills back with color (uGray 0)
  function grayable(start, key) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad }), u = { uGray: { value: start } };
    m.onBeforeCompile = sh => { sh.uniforms.uGray = u.uGray; sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.84, l * 0.8), uGray); }'); };
    m.customProgramCacheKey = () => 'ruBossGray' + (key || '');
    return { m, u };
  }
  const anchorsOf = (body, list) => { const a = {}; for (const [n, p] of list) { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); a[n] = o; } return a; };

  // ------------------------------------------------------------ the Clay Parrot's model (a big round parrot of clay, cracks on its
  // chest, wings out; gray clay until it repeats right, then green, red and blue, its beak yellow)
  function parrotModel() {
    const root = new THREE.Group(), inner = new THREE.Group(), body = new THREE.Group(); root.add(inner); inner.add(body); inner.scale.setScalar(0.78);
    const k = PAST.API.Kit(), KG = PAST.API.KG, gm = grayable(1, 'p');
    k.add(KG.sphere, 0, 1.7, 0, 0.95, 1.15, 0.85, '#4fae4a', { ink: 0.016 }).add(KG.sphere, 0, 1.45, 0.5, 0.6, 0.7, 0.4, '#f2c94c', { ink: 0.01 });
    k.add(KG.sphere, 0, 2.95, 0.15, 0.68, 0.64, 0.62, '#4fae4a', { ink: 0.014 }).add(KG.sphere, 0, 3.05, 0.55, 0.4, 0.32, 0.3, '#f4efe2', { ink: 0.006 });
    k.add(KG.cone, 0, 2.82, 0.95, 0.2, 0.5, 0.24, '#f2b02a', { rx: Math.PI / 2 + 0.7, ink: 0.008 }).add(KG.sphere, 0, 2.66, 0.82, 0.16, 0.1, 0.14, '#3a3046', { ink: 0 });
    for (const s of [-1, 1]) k.add(KG.ball6, s * 0.24, 3.12, 0.74, 0.08, 0.1, 0.05, '#2b2235', { ink: 0 }).add(KG.sphere, s * 0.24, 3.12, 0.7, 0.13, 0.13, 0.06, '#f4efe2', { ink: 0 });
    for (let j = 0; j < 4; j++) k.add(KG.cone, (j - 1.5) * 0.18, 3.6 + (j % 2) * 0.1, -0.05, 0.08, 0.36, 0.06, '#c9433a', { rz: (j - 1.5) * 0.3, ink: 0.004 });
    k.add(KG.cone, 0, 0.75, -0.55, 0.32, 1.4, 0.16, '#3f6fc0', { rx: -0.5, ink: 0.008 });
    for (const s of [-1, 1]) k.rod([s * 0.32, 0.65, 0.2], [s * 0.36, 0.12, 0.32], 0.07, '#8a8a8a', 0.004).add(KG.sphere, s * 0.36, 0.08, 0.4, 0.22, 0.06, 0.26, '#8a8a8a', { ink: 0.004 });
    // cracks in its clay (dark lines on the chest)
    for (const [x, y, rz] of [[-0.2, 1.8, 0.6], [0.25, 1.4, -0.5], [0.05, 2.1, 0.2]]) k.box(x, y, 0.82, 0.04, 0.36, 0.02, '#3a2a20', { rz, ink: 0 });
    const wings = [];
    for (const s of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(s * 0.8, 2.0, -0.05); body.add(w);
      const kw = PAST.API.Kit();
      kw.add(KG.sphere, s * 0.6, -0.15, 0, 0.75, 0.32, 0.5, '#c9433a', { rz: s * 0.5, ink: 0.01 }).add(KG.sphere, s * 1.2, -0.45, -0.05, 0.5, 0.2, 0.36, '#3f6fc0', { rz: s * 0.6, ink: 0.008 });
      kw.build(w, { mat: gm.m }); wings.push(w);
    }
    k.build(body, { mat: gm.m });
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#e8d4b0', transparent: true, opacity: 0.18, depthWrite: false })); gl.scale.setScalar(4.4); gl.position.y = 1.9; root.add(gl);
    const anchors = anchorsOf(body, [['top', [0, 3.8, 0]], ['mid', [0, 1.7, 0.7]], ['head', [0, 3.0, 0.5]], ['face', [0, 2.9, 1.0]], ['feet', [0, 0.05, 0]]]);
    return { root, body, gl, gm, wings, anchors, kind: 'clay_parrot', scale: 1, radius: 1.2, height: 3.0, parts: [], labelH: 3.6, hover: 0, L: {} };
  }
  function poseParrot(h, F, t) {
    const gray = FXP ? 1 - FXP.color : 1;
    if (h.gm) h.gm.u.uGray.value += (gray - h.gm.u.uGray.value) * 0.05;
    const flap = FXP && FXP.flap ? Math.sin(t * 12) * 0.6 : Math.sin(t * 1.6) * 0.12;
    (h.wings || []).forEach((w, j) => { w.rotation.z = (j ? -1 : 1) * flap; });
    h.body.position.y = Math.abs(Math.sin(t * 2.0)) * 0.08;
    h.body.rotation.z = Math.sin(t * 1.1) * 0.06;
    h.gl.material.opacity = 0.12 + 0.05 * Math.sin(t * 2) + (FXP ? FXP.color * 0.15 : 0);
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }

  // ------------------------------------------------------------ the battle's hooks: species, models, labels, the bestiary
  const KINDS = ['clay_parrot', 'gray_moray'];
  const NAMEOF = kind => (kind === 'clay_parrot' ? (PT() ? PT().NAMES.boss : {}) : (FT() ? FT().NAMES.boss : {}));
  function hook() {
    try { if (typeof BOSS_MUSIC !== 'undefined' && BOSS_MUSIC.SONG) { BOSS_MUSIC.SONG.clay_parrot = 'boss_ru_parrot'; BOSS_MUSIC.SONG.gray_moray = 'boss_ru_moray'; } } catch (e) { /* */ }
    if (!_) return;
    const SP = { clay_parrot: PT() ? PT().SPECIES : null, gray_moray: FT() ? FT().SPECIES : null };
    for (const [id, table] of Object.entries(SP)) if (table) for (const [lg, sp] of Object.entries(table)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species[id]) { Lg.species[id] = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
    const M = _.M;
    if (M && !M.ruHooked) {
      M.ruHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (KINDS.includes(String(k || '')) ? String(k) : k0(k));
      M.build = o => (o && o.kind === 'clay_parrot' ? parrotModel() : o && o.kind === 'gray_moray' && MORAY.model ? MORAY.model() : b0(o));
      M.pose = (h, F, t, dt) => (h && h.kind === 'clay_parrot' ? poseParrot(h, F, t, dt) : h && h.kind === 'gray_moray' && MORAY.pose ? MORAY.pose(h, F, t, dt) : p0(h, F, t, dt));
      M.brighten = (h, k) => (h && KINDS.includes(h.kind) ? undefined : br0(h, k));
    }
    const U = _.UI;
    if (U && U.label && !U.ruHooked) { U.ruHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && KINDS.includes(f.species) ? bossLabel(f) : html); }; }
    if (_.RW && _.RW.LORE) {
      if (PT() && !_.RW.LORE['boss:clay_parrot']) _.RW.LORE['boss:clay_parrot'] = PT().LORE;
      if (FT() && !_.RW.LORE['boss:gray_moray']) _.RW.LORE['boss:gray_moray'] = FT().LORE;
    }
    if (_.RW && _.RW.KIND_EN) { _.RW.KIND_EN.clay_parrot = 'the Clay Parrot'; _.RW.KIND_EN.gray_moray = 'the Gray Moray'; }
    if (_.UI && _.UI.ICON) {
      if (!_.UI.ICON.clay_parrot) _.UI.ICON.clay_parrot = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g stroke="#2b2235" stroke-width="3"><ellipse cx="30" cy="38" rx="15" ry="18" fill="#4fae4a"/><circle cx="34" cy="18" r="11" fill="#4fae4a"/><path d="M42 16 L54 22 L43 26 Z" fill="#f2b02a"/><path d="M18 40 Q8 48 14 58" fill="none" stroke="#c9433a" stroke-width="6"/></g><circle cx="37" cy="16" r="3" fill="#2b2235"/></svg>';
      if (!_.UI.ICON.gray_moray) _.UI.ICON.gray_moray = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M6 50 Q20 30 34 38 Q46 44 52 24" fill="none" stroke="#2b2235" stroke-width="13" stroke-linecap="round"/><path d="M6 50 Q20 30 34 38 Q46 44 52 24" fill="none" stroke="#8a8f88" stroke-width="8" stroke-linecap="round"/><circle cx="52" cy="21" r="3" fill="#f2c94c" stroke="#2b2235" stroke-width="2"/></svg>';
    }
    _.plugins = _.plugins || {}; _.plugins.clay_parrot = PP; if (MORAY.plugin) _.plugins.gray_moray = MORAY.plugin;
    // zh / ja: the bosses' own names can trip the battle's word reader (ja ウツボ holds うつ, «hit»): in these two fights a command
    // that doesn't read is read once more with the boss's name (and «it») left out; it's the only foe, so it's still the one meant
    if (_.P && !_.P.ruNames) {
      const p0 = _.P.parse;
      _.P.parse = function (text, ctx) {
        const r = p0.call(this, text, ctx);
        if (r && r.ok) return r;
        const BG = _.flow && _.flow.G, f = BG && BG.running && (BG.foes || []).find(x => KINDS.includes(x.species)), l = lang();
        if (!f || (l !== 'zh' && l !== 'ja')) return r;
        const tb = f.species === 'clay_parrot' ? PT() : FT(), sp = tb && tb.SPECIES[l]; if (!sp) return r;
        const names = [sp.w].concat(sp.alt || []).flatMap(w => { const o = [Q().plainT(w)]; try { o.push(CJK.chars(w, { lang: l }), CJK.roman(w, { lang: l })); } catch (e) { /* */ } return o; }).concat(l === 'zh' ? ['它', 'tā', 'ta'] : ['それ', 'sore']).filter(Boolean);
        let t2 = String(text);
        for (const w of names) { const e = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); t2 = t2.replace(new RegExp(l === 'ja' ? e + '\\s*(を|に|wo|ni)?' : e, 'gi'), ' '); }
        t2 = t2.replace(/\s+/g, ' ').trim();
        if (!t2 || t2 === String(text).trim()) return r;
        const r2 = p0.call(this, t2, ctx);
        return r2 && r2.ok ? Object.assign(r2, { raw: text }) : r;
      };
      _.P.ruNames = true;
    }
    try { if (typeof BFX !== 'undefined' && BFX.VOICES) { if (!BFX.VOICES.clay_parrot) BFX.VOICES.clay_parrot = { m: 76, vow: ['a', 'e', 'a'], len: 0.08, gap: 0.04 }; if (!BFX.VOICES.gray_moray) BFX.VOICES.gray_moray = { m: 44, vow: ['o', 'u', 'o'], len: 0.16, gap: 0.07 }; } } catch (e) { /* (no battle sounds) */ }
  }
  function bossLabel(f) {
    const l = lang(), parrot = f.species === 'clay_parrot', N = NAMEOF(f.species);
    const name = isC() && typeof CJK !== 'undefined' ? CJK.html(N[l] || N.en || '', { lang: l }) : esc(N[l] || N.en || '');
    const FX = parrot ? FXP : MORAY.FX(), left = FX ? Math.max(0, 3 - FX.hits) : 3, p2 = FX && FX.phase === 2;
    return `<div class="bt-chips"><span class="bt-chip name">${name}</span></div><div class="bt-hpbar"><i style="width:${Math.round(100 * (p2 ? (2 - FX.answered) / 2 : left / 3))}%"></i><span>${p2 ? (parrot ? '🗣 ?' : '💬 ?') : (parrot ? '🦜 ' : '🌊 ') + left}</span></div>`;
  }
  // an answer in the box, graded as yours (not a command): RUINT.grade with the world's task; a miss the grader knows (now, tomorrow,
  // the parrot's own silly version) comes back to the fight as kind 'miss' with its tip for the coach, instead of {mimo}'s «¿…?»
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
      const frame = Q().plainT(fillM((T0.frame || {})[lg] || '')), chips = ((T0.chips || {})[lg] || []).map(([x, e]) => `${lw(Q().plainT(fillM(x)))} (${e})`).join(' · ');
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
  // a wave thrown at you or {mimo} (a nose dive up high, clay pellets down low, a bite, a tail wave): where it's coming from, then dodge
  // it out loud (react.js opens its box). high: up high (duck) or down low (jump); undefined: either
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
    if (FX === FXP) FXP.flap = true;
    const Tm = BG.t + 0.8, keyc = high ? 'ArrowDown' : 'ArrowUp';
    const tp = K.timingWindow(Tm, keyc, () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
    const spr = waveSprite(dTxt.replace(/[!！¡]/g, '').trim().slice(0, 18) || '…', col), a = ST.worldOf(f, 'face'), b = ST.worldOf(tgt, high ? 'top' : 'feet');
    ST.prop(spr); spr.position.copy(a);
    await K.along(0.8, u => { spr.position.lerpVectors(a, b, u * 1.06); spr.position.y += Math.sin(u * Math.PI) * (high ? 0.45 : 0.12); spr.material.rotation = Math.sin(u * 12) * 0.15; });
    const grade = await tp;
    ST.dropProp(spr); if (FX === FXP) FXP.flap = false;
    K.dodgeResult(f, tgt, grade, 1, {});
    if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
    await K.wait(0.4);
  }
  const rung = (K, T0, what) => { try { if (K.UI && K.UI.rung) K.UI.rung(`${what}: <b>«${esc(Q().plainT(fillM((T0.model || {})[lang()] || '')))}»</b>`); } catch (e) { /* */ } };

  // ------------------------------------------------------------ the Clay Parrot (the Past)
  let FXP = null;
  const fp = key => lineOf(PT() && PT().FIGHT, key);
  const sayP = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fp(key); K.say(st0, t, { cls, en, dur }); };
  const PP = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'clay_parrot'); if (!f) { FXP = null; return; }
      FXP = { f, hits: 0, phase: 1, turn: 0, answered: 0, color: 0, flap: false, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.past = [];
      playSong('boss_ru_parrot');
    },
    floor: f => (f && f.species === 'clay_parrot' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXP) return 'flee';
      const f = FXP.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.2, dist: 11 });
      sayP(K, f, 'intro', 3.6); K.emit('boss', { foe: f });
      await K.wait(3.4);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXP.phase === 1) {
          if (FXP.turn === 0) { sayP(K, FXP.coachSt, 'coach', 4.4, 'coach'); await K.wait(3.4); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[ruboss] tac turn', e); } }
          const r = await K.askOrFlee('command');
          const past = isTense(r, ['pret', 'impf']);
          FXP.turn++;
          await K.perform(r);
          if (past) {
            const n = r && r.clauses ? r.clauses.filter(c => c.tb && ['pret', 'impf'].includes(c.tb.tense)).length : 1;
            FXP.hits = Math.min(3, FXP.hits + (n >= 2 ? 2 : 1)); ST.star(ST.worldOf(f, 'head'), '#f2c94c', 1.1); K.emit('knockdown'); K.refreshLabels(); sayP(K, f, 'ouch', 1.8, 'foe boss');
            try { if (ST.S && ST.S.fx && ST.S.fx.puff) { const p = ST.worldOf(f, 'mid'); ST.S.fx.puff(p.x, p.y, p.z, 12, 0.35, '#b8957a'); } } catch (e) { /* */ }
            await K.wait(1.0);
          } else { sayP(K, FXP.coachSt, 'now', 2.6, 'coach'); await K.wait(1.4); }
          if (FXP.hits >= 3) { await parrotCracks(K); continue; }
          const dive = FXP.turn % 2 === 1;
          await wave(K, FXP, PT() && PT().FIGHT, dive ? 'dive' : 'pellets', dive ? ['#e8f0d8', '#3f7a30'] : ['#e8d4b0', '#7a4a2a'], dive);
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[ruboss] tac after', e); } }
        } else {
          const T0 = FXP.answered === 0 ? PT().TASKS.boss1 : PT().TASKS.boss2;
          rung(K, T0, 'The Clay Parrot · put it right: what did they really say?');
          const r = await answerAsk(K, T0, PT().TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.past.push(L0); toast(`${L0} · ${r.grade.why}${r.grade.tip ? ' · ' + r.grade.tip : ''}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXP.answered++; FXP.color = FXP.answered / 2; K.refreshLabels(); Sound.play('chime');
            if (FXP.answered >= 2) { await parrotGives(K); return 'win'; }
            sayP(K, f, 'q2', 4.6); await K.wait(4.0);
          } else {
            const [t, en] = fp('answer'); K.say(FXP.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.6 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXP && FXP.phase === 1) await wave(K, FXP, PT() && PT().FIGHT, 'pellets', ['#e8d4b0', '#7a4a2a'], false); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function parrotCracks(K) {
    const { A: AC, ST } = K, f = FXP.f;
    FXP.phase = 2; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); ST.shake(0.2, 0.3); Sound.play('crunch');
    await K.wait(0.6);
    sayP(K, f, 'cracked', 5.4); await K.wait(4.8);
    sayP(K, FXP.coachSt, 'answer', 3.2, 'coach'); await K.wait(1.8);
  }
  async function parrotGives(K) {
    const { A: AC, ST } = K, f = FXP.f;
    FXP.color = 1; FXP.flap = true;
    sayP(K, f, 'remember', 3.2); Sound.play('chime'); await K.wait(2.6);
    FXP.flap = false;
    sayP(K, f, 'win', 5.6); ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 9 });
    await K.wait(4.4);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the Gray Moray (tomorrow): a long gray moray in the holes under the
  // bell. It only comes out to bite. Plans land next turn (the Future's rule), so a plan for when it's back in its hole splashes; on
  // the turns it stays out, catching its breath, a plan lands. A plan tied to its moment, «Cuando salga, {mimo} la golpeará», lands
  // right then: it springs as the moray comes out, the bite never comes (×2; a «y» chain is two hits). Three hits and it curls up in
  // its hole and says its fears; doubt them (RUFTXT.TASKS moray1, moray2) and its color comes back; it gives back Elio's echo.
  function morayModel() {
    const root = new THREE.Group(), inner = new THREE.Group(), body = new THREE.Group(); root.add(inner); inner.add(body); inner.scale.setScalar(0.9);
    const KG = PAST.API.KG, gm = grayable(1, 'm'), segs = [];
    for (let j = 0; j < 9; j++) {
      const u = j / 8, s = new THREE.Group(), r = 0.5 - j * 0.03, kk = PAST.API.Kit(); s.position.set(0, 0.2 + u * 3.3, -0.7 + Math.sin(u * Math.PI * 0.85) * 1.0); s.userData.z0 = s.position.z; body.add(s);
      kk.add(KG.sphere, 0, 0, 0, r, 0.36, r * 1.05, '#7f8a4a', { ink: 0.01 });
      for (let q = 0; q < 3; q++) kk.add(KG.ball6, (q - 1) * r * 0.6, 0.05, r * 0.85, 0.07, 0.07, 0.03, '#f2c94c', { ink: 0 });
      kk.add(KG.cone, 0, 0, -r * 0.9, 0.06, 0.26, 0.1, '#5f6a3a', { rx: -Math.PI / 2, ink: 0 });
      kk.build(s, { mat: gm.m }); segs.push(s);
    }
    const head = new THREE.Group(); head.position.set(0, 3.75, 0.35); body.add(head);
    const kh = PAST.API.Kit();
    kh.add(KG.sphere, 0, 0.05, 0.35, 0.55, 0.5, 0.95, '#7f8a4a', { ink: 0.014 }).add(KG.sphere, 0, -0.28, 0.6, 0.46, 0.22, 0.8, '#8a9a52', { ink: 0.008 }).add(KG.sphere, 0, -0.12, 1.12, 0.3, 0.1, 0.2, '#3a2a30', { ink: 0 });
    for (const s of [-1, 1]) kh.add(KG.sphere, s * 0.3, 0.2, 0.62, 0.14, 0.14, 0.1, '#f2c94c', { ink: 0.004 }).add(KG.ball6, s * 0.31, 0.2, 0.7, 0.06, 0.08, 0.04, '#2b2235', { ink: 0 });
    for (let q = 0; q < 5; q++) kh.add(KG.cone, (q - 2) * 0.12, -0.08, 0.98, 0.03, 0.1, 0.03, '#f4efe2', { rx: Math.PI, ink: 0 });
    kh.build(head, { mat: gm.m });
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#cfe3ea', transparent: true, opacity: 0.16, depthWrite: false })); gl.scale.setScalar(4.6); gl.position.y = 2.2; root.add(gl);
    const anchors = anchorsOf(body, [['top', [0, 4.4, 0.3]], ['mid', [0, 2.0, 0.2]], ['head', [0, 3.8, 0.4]], ['face', [0, 3.7, 1.1]], ['feet', [0, 0.05, -0.6]]]);
    return { root, body, gl, gm, segs, head, anchors, kind: 'gray_moray', scale: 1, radius: 1.3, height: 3.6, parts: [], labelH: 4.4, hover: 0, L: {}, rise: 0 };
  }
  function poseMoray(h, F, t, dt) {
    const FX = FXM, gray = FX ? 1 - FX.color : 1;
    if (h.gm) h.gm.u.uGray.value += (gray - h.gm.u.uGray.value) * 0.05;
    const want = !FX || FX.out || FX.lunge || FX.phase === 2 ? (FX && FX.phase === 2 ? 0.5 : 1) : 0;
    h.rise += (want - h.rise) * Math.min(1, (dt || 0.016) * 4);
    h.body.position.y = -0.8 - 2.9 * (1 - h.rise);          // (out: rising from the sea, its tail in the water; in: only its eyes over the surface)
    h.body.position.z = FX && FX.lunge ? 0.9 : 0;
    (h.segs || []).forEach((s, j) => { s.position.x = Math.sin(t * 2.2 - j * 0.6) * 0.18 * (0.4 + j * 0.1); s.rotation.z = Math.sin(t * 2.2 - j * 0.6) * 0.15; });
    if (h.head) { h.head.position.x = Math.sin(t * 2.2 - 5) * 0.2; h.head.rotation.y = Math.sin(t * 0.8) * 0.25; h.head.rotation.x = FX && FX.lunge ? -0.5 : Math.sin(t * 1.4) * 0.06; }
    h.gl.material.opacity = 0.1 + 0.05 * Math.sin(t * 2) + (FX ? FX.color * 0.15 : 0);
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }
  let FXM = null;
  const fm = key => lineOf(FT() && FT().FIGHT, key);
  const sayM = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fm(key); K.say(st0, t, { cls, en, dur }); };
  // «Cuando salga, {mimo} la golpeará»: the moment, read off the front (or the end) of what you say; the rest is the plan. mood: 'S'
  // (the subjunctive; de: the present; zh: 等… / 一…就; ja: 〜たら) or 'B' (the indicative or the future after «cuando»)
  const WHENOUT = {
    es: { when: ['cuando'], good: ['salga'], bad: ['sale', 'saldra'] },
    pt: { when: ['quando'], good: ['sair'], bad: ['sai', 'saira'] },
    de: { when: ['wenn', 'sobald'], good: ['rauskommt', 'herauskommt', 'auftaucht', 'rausschaut'], bad: [] },
  };
  const nrmW = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¡!¿?.,;:«»"“”]/g, '');
  function whenOut(text, lg) {
    const raw = String(text || '').replace(/[¡!¿?]/g, ' ').trim();
    if (lg === 'zh' || lg === 'ja') {
      const flat = raw.replace(/\s+/g, ''), rom = nrmW(raw).replace(/[^a-z]/g, '');
      const hit = lg === 'zh' ? (/出来/.test(flat) || /chulai/.test(rom)) : (/出て?(き|来)?たら|でて?きたら|でたら|出て(く|来)る(時|とき)|でてくる(時|とき)/.test(flat) || /de(te)?(ki)?tara|detekurutoki/.test(rom));
      if (!hit) return null;
      const roman = !/[぀-ヿ一-鿿]/.test(raw);          // (typed in pinyin / rōmaji: the words keep their spaces)
      let rest;
      if (roman) { const c2 = raw.search(/[，,、]/); rest = c2 >= 0 ? raw.slice(c2 + 1).trim() : raw.replace(/^.*?(chu\s*lai(\s*le)?|(de)?\s*te\s*ki\s*ta\s*ra|de\s*ta\s*ra)\s*/i, ''); rest = rest.replace(/^(jiu|sorekara)\s+/i, ''); }
      else { const cut = flat.search(/[，,、]/); rest = cut >= 0 ? flat.slice(cut + 1) : (lg === 'zh' ? flat.replace(/^.*?出来(了|的时候)?/, '') : flat.replace(/^.*?(たら|時|とき)/, '')); rest = rest.replace(/^(就|それから)/, ''); }
      if (!rest || rest.length < 2) return null;
      const good = lg === 'zh' ? /^(等|它一|一)|的时候/.test(flat) || /deng|yi/.test(rom.slice(0, 8)) : /たら|(時|とき)/.test(flat) || /tara|toki/.test(rom);
      return { mood: good ? 'S' : 'B', rest };
    }
    const W = WHENOUT[lg]; if (!W) return null;
    const parts = raw.split(/\s+/), n = parts.map(nrmW);
    const wi = n.findIndex(x => W.when.includes(x)); if (wi < 0) return null;
    let ti = -1, mood = 'S', end = -1;
    for (let j = wi + 1; j < Math.min(n.length, wi + 6); j++) {
      if (W.good.includes(n[j])) { ti = j; end = j; break; }
      if (W.bad.includes(n[j])) { ti = j; mood = 'B'; end = j; break; }
      if (lg === 'de' && n[j] === 'kommt' && (n[j - 1] === 'raus' || n[j - 1] === 'heraus')) { ti = j; end = j; break; }
      if (lg === 'de' && /^(raus|heraus)kommen$|^auftauchen$/.test(n[j]) && n[j + 1] === 'wird') { ti = j; mood = 'B'; end = j + 1; break; }
    }
    if (ti < 0) return null;
    const rest = parts.slice(0, wi).concat(parts.slice(end + 1)).join(' ').replace(/^[\s,]+|[\s,]+$/g, '').replace(/^(entonces|então|dann)\s+/i, '');
    if (!rest || rest.split(/\s+/).length < 2) return null;
    return { mood, rest };
  }
  // the player's command, read with its moment first (the parser wrapped for this one ask)
  async function askWhen(K) {
    const Pp = _ && _.P; if (!Pp) return K.askOrFlee('command');
    const parse0 = Pp.parse, lg = lang(), f = FXM.f;
    const sp = FT() && FT().SPECIES[lg], noun = sp ? (Q().isCl(lg) ? Q().plainT(sp.w) : sp.w) : '';
    Pp.parse = function (text, ctx) {
      const w = whenOut(text, lg);
      if (w) {
        let rest = w.rest;
        // (the battle's parser names its foes: the pronouns for the moray become its name; de: the verb-first main clause after
        // «sobald …,» is put back in the order the parser reads, «Mimo wird …»)
        const mi = String(Q().mimoName() || 'Mimo').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (lg === 'zh') rest = rest.replace(/它/g, noun).replace(/\bta\b/gi, noun); else if (lg === 'ja') rest = rest.replace(/(それ|あいつ|彼女)/g, noun).replace(/\b(sore|aitsu|kanojo)\b/gi, noun);
        else if (lg === 'es') rest = rest.replace(/\bella\b/gi, 'la ' + noun);
        else if (lg === 'pt') rest = rest.replace(/\bnela\b/gi, 'na ' + noun).replace(/\bdela\b/gi, 'da ' + noun).replace(/\bela\b/gi, 'a ' + noun);
        else if (lg === 'de') rest = rest.replace(new RegExp('^(\\S+)\\s+(' + mi + ')\\b', 'i'), '$2 $1').replace(/\bsie\b/gi, 'die ' + noun).replace(/\bihr\b/gi, 'der ' + noun);
        let r2 = parse0.call(this, rest, ctx);
        if (!(r2 && r2.ok) && Q().isCl(lg)) { const bare = lg === 'zh' ? rest.replace(new RegExp(noun + '|它', 'g'), '') : rest.replace(new RegExp('(' + noun + '|ウツボ|うつぼ|それ|あいつ|彼女)\\s*(を|に)?', 'g'), ''); if (bare !== rest) r2 = parse0.call(this, bare, ctx); }          // (no object: the only foe)
        if (r2 && r2.ok && r2.kind === 'command' && r2.clauses && r2.clauses.length) {
          for (const c of r2.clauses) { c.target = f; if (lg !== 'es' && lg !== 'pt') { c.errors = (c.errors || []).filter(e => !['tbFut', 'tbCond'].includes(e.kind)); c.tbWrong = false; } }
          return Object.assign(r2, { raw: text, ruWhen: w, previewHtml: `<b>⚠ ${esc(Q().fillEn('A plan for when it comes out'))}</b>` });
        }
      }
      return parse0.call(this, text, ctx);
    };
    try { return await K.askOrFlee('command'); } finally { Pp.parse = parse0; }
  }
  // the plans that land this turn: on the moray if it's out, into the water if it's in its hole
  async function landPlans(K) {
    const { G: BG, A: AC, ST } = K, f = FXM.f, TAC = _ && _.tac;
    const due = (BG.tbQueue || []).filter(e => e.turn < BG.turn);
    if (due.length && !FXM.out) {
      BG.tbQueue = (BG.tbQueue || []).filter(e => e.turn >= BG.turn);
      ST.shot('focus', AC.mimo, f, { up: 0.6, dist: 9 });
      try { const p = ST.worldOf(f, 'feet'); if (ST.S && ST.S.fx && ST.S.fx.puff) ST.S.fx.puff(p.x, p.y + 0.2, p.z, 14, 0.4, '#cfe3ea'); } catch (e) { /* */ }
      Sound.play('swoosh'); sayM(K, f, 'hole', 1.8, 'foe boss'); await K.wait(1.0);
      sayM(K, FXM.coachSt, 'missTip', 5.2, 'coach'); await K.wait(3.6);
    } else if (due.length) {
      FXM.hits = Math.min(3, FXM.hits + Math.min(2, due.length));
    }
    if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[ruboss] tac turn', e); } }
    if (due.length && FXM.out) { ST.star(ST.worldOf(f, 'head'), '#cfe3ea', 1.1); K.emit('knockdown'); K.refreshLabels(); sayM(K, f, 'ouch', 1.8, 'foe boss'); await K.wait(1.0); }
  }
  // a plan tied to its moment: set, it waits for the moray to come out
  async function setAmbush(K, r) {
    const { A: AC, ST } = K, f = FXM.f;
    let letter = 'B', mult = 1;
    try { (K.judge || _.flow.judge)(r); letter = (r.grade && r.grade.letter) || 'B'; mult = (r.grade && r.grade.mult) || 1; } catch (e) { /* */ }
    if (r.ruWhen.mood === 'B' && RANK.indexOf(letter) < 2) letter = 'B';
    if ((lang() === 'es' || lang() === 'pt') && r.clauses.some(c => c.tb && c.tb.tense !== 'fut' && c.tb.tense !== 'cond') && RANK.indexOf(letter) < 2) letter = 'B';
    LETTERS.future.push(letter);
    const why = r.ruWhen.mood === 'B' ? (lang() === 'es' ? 'After «cuando», for what’s still to come: «cuando salga»' : lang() === 'pt' ? 'After «quando», for what’s still to come: «quando ela sair»' : 'The moment: «sobald sie rauskommt»') : letter === 'S' ? 'Tied to its moment!' : 'The plan: say what {mimo} will do';
    toast(`${letter} · ${Q().fillEn(why)}`);
    K.say(AC.you, r.raw, { cls: 'you', dur: 2.4 });
    FXM.ambush = { clauses: r.clauses, letter, mult };
    ST.shot('action', AC.mimo, f, { yaw: -0.05, up: 0.3 });
    try { const H = _.tac && _.tac.h; if (H && H.pop) H.pop(f, '⚠', { color: '#ffb347', size: 38, rise: 0.3, life: 1.4 }); ST.ring(f, '#ffb347', 1.8); } catch (e) { /* */ }
    try { (K.setMood || _.flow.setMood)(AC.mimo, 'perk', 1.4); } catch (e) { /* */ }
    await K.wait(1.4);
  }
  // it comes out to bite… and {mimo} is already there
  async function spring(K) {
    const { A: AC, ST } = K, f = FXM.f, am = FXM.ambush, MOVES = K.MOVES || (_.flow && _.flow.MOVES); FXM.ambush = null;
    FXM.lunge = true; FXM.out = true; ST.shot('action', AC.mimo, f, { yaw: -0.06, up: 0.3 });
    Sound.play('swoosh'); await K.wait(0.45);
    sayM(K, f, 'ambush', 2.2, 'foe shout boss');
    try { const H = _.tac && _.tac.h; if (H && H.pop) H.pop(f, 'WHEN!', { color: '#ffb347', size: 36, dy: 0.5 }); } catch (e) { /* */ }
    for (const c of am.clauses) {
      Object.assign(c, { target: f, tacMult: 2, tacSub: 'WHEN ×2', power: am.mult || 1 });
      try { await (MOVES[c.verb] || MOVES.hit)(c); } catch (e) { console.error('[ruboss] spring', e); }
    }
    FXM.hits = Math.min(3, FXM.hits + (am.clauses.length >= 2 ? 2 : 1));
    ST.star(ST.worldOf(f, 'head'), '#f2c94c', 1.2); K.emit('knockdown'); K.refreshLabels(); sayM(K, f, 'ouch', 1.8, 'foe boss');
    await K.wait(1.0); FXM.lunge = false; FXM.out = false;
  }
  const PM = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'gray_moray'); if (!f) { FXM = null; return; }
      FXM = { f, hits: 0, phase: 1, turn: 0, answered: 0, color: 0, out: false, lunge: false, ambush: null, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.future = [];
      playSong('boss_ru_moray');
    },
    floor: f => (f && f.species === 'gray_moray' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXM) return 'flee';
      const f = FXM.f, TAC = _ && _.tac;
      f.hz = Math.min(f.hz, -5.6); BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;          // (in the sea behind the deck's rail: it comes up out of the water)
      FXM.out = true;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.2, dist: 11.5 });
      sayM(K, f, 'intro', 3.8); K.emit('boss', { foe: f });
      await K.wait(3.4); FXM.out = false;
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXM.phase === 1) {
          if (FXM.turn === 0) { sayM(K, FXM.coachSt, 'coach', 5.0, 'coach'); await K.wait(3.8); }
          await landPlans(K);
          if (FXM.hits >= 3) { await morayCurls(K); continue; }
          const r = await askWhen(K);
          FXM.turn++;
          if (r && r.ruWhen) await setAmbush(K, r);
          else await K.perform(r);
          if (FXM.ambush) await spring(K);
          else {
            const bite = FXM.turn % 2 === 1;
            FXM.out = true; await wave(K, FXM, FT() && FT().FIGHT, bite ? 'bite' : 'tail', bite ? ['#e8f0d8', '#4a5a2a'] : ['#cfe3ea', '#2f5a66'], bite);
            FXM.out = FXM.turn % 2 === 0;          // (every other turn it stays out, catching its breath: a plan said now lands)
            if (FXM.out) { sayM(K, f, 'stays', 2.4, 'foe boss'); await K.wait(1.2); }
          }
          if (FXM.hits >= 3) { await morayCurls(K); continue; }
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[ruboss] tac after', e); } }
        } else {
          const T0 = FXM.answered === 0 ? FT().TASKS.moray1 : FT().TASKS.moray2;
          rung(K, T0, 'The Gray Moray · doubt its fear');
          const r = await answerAsk(K, T0, FT().DTIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.future.push(L0); toast(`${L0} · ${r.grade.why}${r.grade.tip ? ' · ' + r.grade.tip : ''}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXM.answered++; FXM.color = FXM.answered / 2; K.refreshLabels(); Sound.play('chime');
            if (FXM.answered >= 2) { await morayGives(K); return 'win'; }
            sayM(K, f, 'q2', 4.4); await K.wait(3.8);
          } else {
            const [t, en] = fm('answer'); K.say(FXM.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.6 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXM && FXM.phase === 1) { FXM.out = true; await wave(K, FXM, FT() && FT().FIGHT, 'bite', ['#e8f0d8', '#4a5a2a'], true); FXM.out = false; } },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function morayCurls(K) {
    const { A: AC, ST } = K, f = FXM.f;
    FXM.phase = 2; FXM.out = false; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 9 }); Sound.play('pip');
    await K.wait(0.8);
    sayM(K, f, 'curl', 5.4); await K.wait(4.6);
    sayM(K, FXM.coachSt, 'answer', 3.2, 'coach'); await K.wait(1.8);
  }
  async function morayGives(K) {
    const { A: AC, ST } = K, f = FXM.f;
    FXM.color = 1; FXM.out = true;
    sayM(K, f, 'remember', 3.6); Sound.play('chime'); await K.wait(3.0);
    sayM(K, f, 'win', 6.2); ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 10 });
    await K.wait(5.0);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }
  const MORAY = { model: morayModel, pose: poseMoray, plugin: PM, FX: () => FXM, whenOut };

  // ------------------------------------------------------------ the fights (through TIME.fight: the world's tense, its realm), on the
  // canyon's arenas (ruins_time_battle.js) when they're there
  const arena = (name, x, z) => { const b = BATTLE._ && BATTLE._.arenaBuilders; return b && b[name] ? { x, z, biome: name } : { x, z, biome: 'temple' }; };
  async function fightParrot() {
    hook();
    return TIME.fight({ boss: 'clay_parrot', foes: [{ kind: 'clay_parrot', color: 'green', size: 'big', giant: 1, hp: 40 }], place: arena('riverbank', 142, -12), tb: { scene: () => false } });
  }
  async function fightMoray() {
    hook();
    return TIME.fight({ boss: 'gray_moray', foes: [{ kind: 'gray_moray', color: 'green', size: 'big', giant: 1, hp: 40 }], place: arena('flooded', 142, -18), tb: { noGlimpse: true, scene: () => false } });     // (no glimpse: it shows nothing before it bites; its bite and its tail are its own, dodged out loud)
  }
  try { hook(); } catch (e) { console.error('[ruboss] hooks', e); }
  return { init: () => { try { hook(); } catch (e) { console.error('[ruboss] hooks', e); } }, hook, fightParrot, fightMoray, letter, parrotModel, morayModel, PP, PM, MORAY, answerAsk, wave, rung, grayable, anchorsOf, lineOf, LETTERS, isTense, whenOut,
    get FXP() { return FXP; }, get FXM() { return FXM; } };
})();
