'use strict';
// Port Brisa's two time bosses (DESIGN.md 20.1b "T4a"): plug-ins on battle/flow.js (BATTLE._.plugins), fought through TIME.fight so
// the world's tense rules apply (battle/timebattle.js).
//   'fog_octopus', the Fog Octopus (La Golondrina's captain's cabin, long ago): the gray fog that came aboard and stopped the ship in
//     an instant. Phase 1: commands told as memories land («{mimo} saltó…», «{mimo} golpeó…»; a «y» chain hits harder), the present
//     only confuses {mimo}; its fog ink is dodged out loud (battle/react.js). Three hits and the fog thins: it has forgotten what was
//     going on aboard when it came, and only a story brings it back (PTPTXT.TASKS boss1, boss2: «Estaban subiendo las velas cuando
//     llegaste», «Mientras todos hablaban, él estaba escuchando»); each one brings its color back, then it gives back Elio's echo.
//   'gray_albatross', the Gray Albatross (the harbor office's roof, tomorrow): a huge gray seabird sitting on the dark beacon, its
//     wings over the light. Phase 1: plans for {mimo} (the Future's rule: «{mimo} saltará…», chains too) knock the gray off its
//     feathers; its gusts are dodged out loud. Three hits and it folds its wings: «Nobody wishes anything here anymore»; only wishes
//     open them (PTFTXT.TASKS wish1, wish2: «Ojalá que vuelvan los barcos», «Quiero que el faro brille otra vez»). A wish said in
//     today's words gets its tip (answerAsk: the gardens' pattern, GDBOSS.answerAsk).
// Each has its own song (port_time_music.js: 'boss_pb_octopus', 'boss_pb_albatross'), bestiary line, icon and voice; neither takes your
// last heart.   PTBOSS.fightOctopus() · PTBOSS.fightAlbatross() · PTBOSS.letter('past' | 'future')
const PTBOSS = (() => {
  const BT = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = BT && BT._;
  const Q = () => (typeof PORTT !== 'undefined' ? PORTT : null);
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
  const PT = () => (typeof PTPTXT !== 'undefined' ? PTPTXT : null), FT = () => (typeof PTFTXT !== 'undefined' ? PTFTXT : null);

  // a material that drains to gray (uGray 1) and fills back with color (uGray 0)
  function grayable(start, key) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad }), u = { uGray: { value: start } };
    m.onBeforeCompile = sh => { sh.uniforms.uGray = u.uGray; sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.86, l * 0.92), uGray); }'); };
    m.customProgramCacheKey = () => 'pbBossGray' + (key || '');
    return { m, u };
  }
  const anchorsOf = (body, list) => { const a = {}; for (const [n, p] of list) { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); a[n] = o; } return a; };

  // ------------------------------------------------------------ the Fog Octopus's model (a round head, big sleepy eyes, six curling arms;
  // wrapped in fog puffs; gray until it remembers, then a warm red)
  function octoModel() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const k = PAST.API.Kit(), KG = PAST.API.KG, gm = grayable(1, 'o');
    k.add(KG.sphere, 0, 2.0, 0, 1.15, 1.05, 1.0, '#c9433a', { ink: 0.016 }).add(KG.sphere, 0, 2.75, -0.15, 0.85, 0.7, 0.8, '#d0574c', { ink: 0.012 });
    for (const s of [-1, 1]) k.add(KG.sphere, s * 0.42, 2.15, 0.82, 0.26, 0.3, 0.12, '#f4efe2', { ink: 0.006 }).add(KG.ball6, s * 0.42, 2.12, 0.92, 0.1, 0.13, 0.05, '#2b2235', { ink: 0 }).add(KG.sphere, s * 0.42, 2.38, 0.86, 0.28, 0.08, 0.1, '#a8332c', { ink: 0 });
    for (let j = 0; j < 8; j++) k.add(KG.ball6, (j % 4 - 1.5) * 0.4, 2.5 + Math.floor(j / 4) * 0.4, -0.7 + (j % 2) * 0.1, 0.1, 0.1, 0.06, '#e8908a', { ink: 0 });
    const arms = [];
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * TAU + 0.26, arm = new THREE.Group(); arm.position.set(Math.cos(ang) * 0.7, 1.2, Math.sin(ang) * 0.7); arm.rotation.y = -ang; body.add(arm);
      const ka = PAST.API.Kit();
      for (let j = 0; j < 6; j++) { const r = 0.3 - j * 0.04, x = 0.35 + j * 0.42, y = -0.3 - Math.sin(j * 0.55) * 0.55 + j * 0.08; ka.add(KG.sphere, x, y, 0, r, r * 0.9, r, '#c9433a', { ink: 0.008 }); if (j % 2) ka.add(KG.ball6, x, y - r * 0.6, 0, r * 0.35, 0.05, r * 0.35, '#f2b0a8', { ink: 0 }); }
      ka.build(arm, { mat: gm.m }); arms.push(arm);
    }
    k.build(body, { mat: gm.m });
    const tex = TK.canvasTex(64, 64, c => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(190,188,200,0.85)'); g.addColorStop(1, 'rgba(190,188,200,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
    const puffs = []; for (let j = 0; j < 8; j++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.scale.setScalar(1.6); root.add(s); puffs.push({ s, a: j / 8 * TAU }); }
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#d8d4e6', transparent: true, opacity: 0.2, depthWrite: false })); gl.scale.setScalar(4.6); gl.position.y = 1.8; root.add(gl);
    const anchors = anchorsOf(body, [['top', [0, 3.3, 0]], ['mid', [0, 1.6, 0.6]], ['head', [0, 2.6, 0.5]], ['face', [0, 2.2, 1.0]], ['feet', [0, 0.05, 0]]]);
    return { root, body, gl, gm, arms, puffs, anchors, kind: 'fog_octopus', scale: 1, radius: 1.5, height: 3.3, parts: [], labelH: 4.0, hover: 0, L: {} };
  }
  function poseOcto(h, F, t) {
    const fog = FXO ? 1 - FXO.color : 1;
    if (h.gm) h.gm.u.uGray.value += (fog - h.gm.u.uGray.value) * 0.05;
    h.body.position.y = Math.sin(t * 1.3) * 0.08;
    (h.arms || []).forEach((a, j) => { a.rotation.z = Math.sin(t * 1.8 + j * 1.1) * 0.22; a.rotation.x = Math.sin(t * 1.2 + j) * 0.08; });
    (h.puffs || []).forEach((p, j) => { const r = 1.5 + Math.sin(t + j) * 0.2; p.s.position.set(Math.cos(p.a + t * 0.3) * r, 1.0 + Math.sin(t * 0.8 + j) * 0.6, Math.sin(p.a + t * 0.3) * r); p.s.material.opacity = 0.75 * fog; });
    h.gl.material.opacity = 0.14 + 0.06 * Math.sin(t * 2) + (FXO ? FXO.color * 0.2 : 0);
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }
  // ------------------------------------------------------------ the Gray Albatross's model (a big seabird, wings spread over the beacon;
  // gray until wished free, then white with black wingtips and a yellow beak)
  function albaModel() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const k = PAST.API.Kit(), KG = PAST.API.KG, gm = grayable(1, 'a');
    k.add(KG.sphere, 0, 1.6, 0, 0.9, 0.75, 1.3, '#f4f2ee', { ink: 0.016 }).add(KG.sphere, 0, 2.3, 0.95, 0.5, 0.48, 0.5, '#f8f6f2', { ink: 0.012 });
    k.add(KG.cone, 0, 2.22, 1.6, 0.14, 0.75, 0.16, '#f2c94c', { rx: Math.PI / 2, ink: 0.008 });
    for (const s of [-1, 1]) k.add(KG.ball6, s * 0.24, 2.42, 1.3, 0.07, 0.08, 0.05, '#2b2235', { ink: 0 }).add(KG.sphere, s * 0.24, 2.52, 1.28, 0.12, 0.04, 0.06, '#8a8690', { ink: 0 });
    k.add(KG.sphere, 0, 1.5, -1.25, 0.35, 0.18, 0.5, '#e8e6e2', { ink: 0.008 });
    for (const s of [-1, 1]) k.rod([s * 0.3, 0.9, 0.1], [s * 0.35, 0.15, 0.25], 0.07, '#d8a070', 0.006).add(KG.sphere, s * 0.35, 0.08, 0.4, 0.2, 0.06, 0.28, '#d8a070', { ink: 0.004 });
    const wings = [];
    for (const s of [-1, 1]) {
      const w = new THREE.Group(); w.position.set(s * 0.75, 1.9, 0.1); body.add(w);
      const kw = PAST.API.Kit();
      kw.add(KG.sphere, s * 1.3, 0, 0, 1.5, 0.12, 0.6, '#f0eee8', { ink: 0.01 }).add(KG.sphere, s * 2.7, -0.05, -0.1, 0.9, 0.1, 0.42, '#3a3640', { ink: 0.008 });
      for (let j = 0; j < 4; j++) kw.add(KG.sphere, s * (0.8 + j * 0.6), -0.02, -0.45, 0.32, 0.06, 0.2, '#dcd8d0', { ink: 0 });
      kw.build(w, { mat: gm.m }); wings.push(w);
    }
    k.build(body, { mat: gm.m });
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#c8ccd8', transparent: true, opacity: 0.18, depthWrite: false })); gl.scale.setScalar(5.0); gl.position.y = 1.8; root.add(gl);
    const anchors = anchorsOf(body, [['top', [0, 2.9, 0.6]], ['mid', [0, 1.6, 0.8]], ['head', [0, 2.4, 1.0]], ['face', [0, 2.3, 1.4]], ['feet', [0, 0.05, 0]]]);
    return { root, body, gl, gm, wings, anchors, kind: 'gray_albatross', scale: 1, radius: 1.6, height: 3.0, parts: [], labelH: 3.8, hover: 0, L: {} };
  }
  function poseAlba(h, F, t) {
    const soft = FXA ? Math.min(1, FXA.hits / 3 * 0.5 + FXA.answered * 0.25) : 0, fold = FXA && FXA.phase === 2 && FXA.answered < 2 ? 1 : 0;
    if (h.gm) h.gm.u.uGray.value += ((1 - soft) - h.gm.u.uGray.value) * 0.05;
    const flap = FXA && FXA.flap ? Math.sin(t * 9) * 0.5 : Math.sin(t * 1.4) * 0.12;
    (h.wings || []).forEach((w, j) => { w.rotation.z = (j ? -1 : 1) * (flap - fold * 0.9); w.scale.x = 1 - fold * 0.35; });
    h.body.position.y = Math.sin(t * 1.1) * 0.06;
    h.gl.material.opacity = 0.14 + 0.05 * Math.sin(t * 2);
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }

  // ------------------------------------------------------------ the battle's hooks: species, models, labels, the bestiary
  const KINDS = ['fog_octopus', 'gray_albatross'];
  function hook() {
    try { if (typeof BOSS_MUSIC !== 'undefined' && BOSS_MUSIC.SONG) { BOSS_MUSIC.SONG.fog_octopus = 'boss_pb_octopus'; BOSS_MUSIC.SONG.gray_albatross = 'boss_pb_albatross'; } } catch (e) { /* */ }
    if (!_) return;
    const SP = { fog_octopus: PT() ? PT().SPECIES : null, gray_albatross: FT() ? FT().SPECIES : null };
    for (const [id, table] of Object.entries(SP)) if (table) for (const [lg, sp] of Object.entries(table)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species[id]) { Lg.species[id] = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
    const M = _.M;
    if (M && !M.pbHooked) {
      M.pbHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (KINDS.includes(String(k || '')) ? String(k) : k0(k));
      M.build = o => (o && o.kind === 'fog_octopus' ? octoModel() : o && o.kind === 'gray_albatross' ? albaModel() : b0(o));
      M.pose = (h, F, t, dt) => (h && h.kind === 'fog_octopus' ? poseOcto(h, F, t, dt) : h && h.kind === 'gray_albatross' ? poseAlba(h, F, t, dt) : p0(h, F, t, dt));
      M.brighten = (h, k) => (h && KINDS.includes(h.kind) ? undefined : br0(h, k));
    }
    const U = _.UI;
    if (U && U.label && !U.pbHooked) { U.pbHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && KINDS.includes(f.species) ? bossLabel(f) : html); }; }
    if (_.RW && _.RW.LORE) {
      if (PT() && !_.RW.LORE['boss:fog_octopus']) _.RW.LORE['boss:fog_octopus'] = PT().LORE;
      if (FT() && !_.RW.LORE['boss:gray_albatross']) _.RW.LORE['boss:gray_albatross'] = FT().LORE;
    }
    if (_.RW && _.RW.KIND_EN) { _.RW.KIND_EN.fog_octopus = 'the Fog Octopus'; _.RW.KIND_EN.gray_albatross = 'the Gray Albatross'; }
    if (_.UI && _.UI.ICON) {
      if (!_.UI.ICON.fog_octopus) _.UI.ICON.fog_octopus = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><g fill="#c9433a" stroke="#2b2235" stroke-width="3"><path d="M14 40 Q8 54 16 58 M24 42 Q22 56 28 60 M40 42 Q42 56 36 60 M50 40 Q56 54 48 58" fill="none"/><ellipse cx="32" cy="28" rx="18" ry="17"/></g><circle cx="25" cy="28" r="4" fill="#f4efe2" stroke="#2b2235" stroke-width="2"/><circle cx="39" cy="28" r="4" fill="#f4efe2" stroke="#2b2235" stroke-width="2"/></svg>';
      if (!_.UI.ICON.gray_albatross) _.UI.ICON.gray_albatross = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M4 30 Q18 18 30 30 Q46 18 60 30 Q46 26 34 36 L30 36 Q18 26 4 30 Z" fill="#f0eee8" stroke="#2b2235" stroke-width="3"/><circle cx="32" cy="30" r="6" fill="#f8f6f2" stroke="#2b2235" stroke-width="3"/><path d="M32 33 L32 42" stroke="#f2c94c" stroke-width="4"/></svg>';
    }
    _.plugins = _.plugins || {}; _.plugins.fog_octopus = PO; _.plugins.gray_albatross = PA;
    try { if (typeof BFX !== 'undefined' && BFX.VOICES) { if (!BFX.VOICES.fog_octopus) BFX.VOICES.fog_octopus = { m: 50, vow: ['o', 'u', 'o'], len: 0.14, gap: 0.06 }; if (!BFX.VOICES.gray_albatross) BFX.VOICES.gray_albatross = { m: 64, vow: ['a', 'e', 'a'], len: 0.1, gap: 0.05 }; } } catch (e) { /* (no battle sounds) */ }
  }
  function bossLabel(f) {
    const l = lang(), octo = f.species === 'fog_octopus', N = octo ? (PT() ? PT().NAMES.boss : {}) : (FT() ? FT().NAMES.boss : {});
    const name = isC() && typeof CJK !== 'undefined' ? CJK.html(N[l] || N.en || '', { lang: l }) : esc(N[l] || N.en || '');
    const FX = octo ? FXO : FXA, left = FX ? Math.max(0, 3 - FX.hits) : 3, p2 = FX && FX.phase === 2;
    return `<div class="bt-chips"><span class="bt-chip name">${name}</span></div><div class="bt-hpbar"><i style="width:${Math.round(100 * (p2 ? (2 - FX.answered) / 2 : left / 3))}%"></i><span>${p2 ? (octo ? '🌫 ?' : '💬 ?') : (octo ? '🐙 ' : '🪶 ') + left}</span></div>`;
  }
  // an answer in the box, graded as yours (not a command): PORTT.grade with the world's task; a miss the grader knows (now, tomorrow,
  // a wish said as plain today) comes back to the fight as kind 'miss' with its tip for the coach, instead of {mimo}'s «¿…?»
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
  // a wave thrown at you or {mimo} (fog ink, a gust): where it's coming from, then dodge it out loud (react.js opens its box)
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
    if (FX === FXA) FXA.flap = true;
    const Tm = BG.t + 0.8, keyc = high ? 'ArrowDown' : 'ArrowUp';
    const tp = K.timingWindow(Tm, keyc, () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
    const spr = waveSprite(dTxt.replace(/[!！¡]/g, '').trim().slice(0, 18) || '…', col), a = ST.worldOf(f, 'face'), b = ST.worldOf(tgt, high ? 'top' : 'feet');
    ST.prop(spr); spr.position.copy(a);
    await K.along(0.8, u => { spr.position.lerpVectors(a, b, u * 1.06); spr.position.y += Math.sin(u * Math.PI) * (high ? 0.45 : 0.12); spr.material.rotation = Math.sin(u * 12) * 0.15; });
    const grade = await tp;
    ST.dropProp(spr); if (FX === FXA) FXA.flap = false;
    K.dodgeResult(f, tgt, grade, 1, {});
    if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
    await K.wait(0.4);
  }
  const rung = (K, T0, what) => { try { if (K.UI && K.UI.rung) K.UI.rung(`${what}: <b>«${esc(Q().plainT(fillM((T0.model || {})[lang()] || '')))}»</b>`); } catch (e) { /* */ } };

  // ------------------------------------------------------------ the Fog Octopus (the Past)
  let FXO = null;
  const fo = key => lineOf(PT() && PT().FIGHT, key);
  const sayO = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fo(key); K.say(st0, t, { cls, en, dur }); };
  const PO = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'fog_octopus'); if (!f) { FXO = null; return; }
      FXO = { f, hits: 0, phase: 1, turn: 0, answered: 0, color: 0, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.past = [];
      playSong('boss_pb_octopus');
    },
    floor: f => (f && f.species === 'fog_octopus' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXO) return 'flee';
      const f = FXO.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.2, dist: 11 });
      sayO(K, f, 'intro', 3.4); K.emit('boss', { foe: f });
      await K.wait(3.2);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXO.phase === 1) {
          if (FXO.turn === 0) { sayO(K, FXO.coachSt, 'coach', 4.4, 'coach'); await K.wait(3.4); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[ptboss] tac turn', e); } }
          const r = await K.askOrFlee('command');
          const past = isTense(r, ['pret', 'impf']);
          FXO.turn++;
          await K.perform(r);
          if (past) {
            const n = r && r.clauses ? r.clauses.filter(c => c.tb && ['pret', 'impf'].includes(c.tb.tense)).length : 1;
            FXO.hits = Math.min(3, FXO.hits + (n >= 2 ? 2 : 1)); ST.star(ST.worldOf(f, 'head'), '#fff3a0', 1.1); K.emit('knockdown'); K.refreshLabels(); sayO(K, f, 'ouch', 1.8, 'foe boss');
            try { if (ST.S && ST.S.fx && ST.S.fx.puff) { const p = ST.worldOf(f, 'head'); ST.S.fx.puff(p.x, p.y, p.z, 12, 0.35, '#c8c4cc'); } } catch (e) { /* */ }
            await K.wait(1.0);
          } else { sayO(K, FXO.coachSt, 'now', 2.6, 'coach'); await K.wait(1.4); }
          if (FXO.hits >= 3) { await octoForgets(K); continue; }
          await wave(K, FXO, PT() && PT().FIGHT, 'ink', ['#d8d4e6', '#4a4458']);
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[ptboss] tac after', e); } }
        } else {
          const T0 = FXO.answered === 0 ? PT().TASKS.boss1 : PT().TASKS.boss2;
          rung(K, T0, 'The Fog Octopus · tell what was going on');
          const r = await answerAsk(K, T0, PT().TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.past.push(L0); toast(`${L0} · ${r.grade.why}${r.grade.tip ? ' · ' + r.grade.tip : ''}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXO.answered++; FXO.color = FXO.answered / 2; K.refreshLabels(); Sound.play('chime');
            if (FXO.answered >= 2) { await octoGives(K); return 'win'; }
            sayO(K, f, 'q2', 4.0); await K.wait(3.4);
          } else {
            const [t, en] = fo('answer'); K.say(FXO.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.6 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXO && FXO.phase === 1) await wave(K, FXO, PT() && PT().FIGHT, 'ink', ['#d8d4e6', '#4a4458']); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function octoForgets(K) {
    const { A: AC, ST } = K, f = FXO.f;
    FXO.phase = 2; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); ST.shake(0.2, 0.3); Sound.play('pip');
    await K.wait(0.6);
    sayO(K, f, 'fogged', 4.6); await K.wait(3.8);
    sayO(K, FXO.coachSt, 'answer', 3.2, 'coach'); await K.wait(1.8);
  }
  async function octoGives(K) {
    const { A: AC, ST } = K, f = FXO.f;
    FXO.color = 1;
    sayO(K, f, 'remember', 3.0); Sound.play('chime'); await K.wait(2.4);
    sayO(K, f, 'win', 5.0); ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 9 });
    await K.wait(3.8);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the Gray Albatross (the Future)
  let FXA = null;
  const fa = key => lineOf(FT() && FT().FIGHT, key);
  const sayA = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fa(key); K.say(st0, t, { cls, en, dur }); };
  const PA = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'gray_albatross'); if (!f) { FXA = null; return; }
      FXA = { f, hits: 0, phase: 1, turn: 0, answered: 0, flap: false, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.future = [];
      playSong('boss_pb_albatross');
    },
    floor: f => (f && f.species === 'gray_albatross' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXA) return 'flee';
      const f = FXA.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.2, dist: 11.5 });
      sayA(K, f, 'intro', 3.6); K.emit('boss', { foe: f });
      await K.wait(3.2);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXA.phase === 1) {
          if (FXA.turn === 0) { sayA(K, FXA.coachSt, 'coach', 4.6, 'coach'); await K.wait(3.6); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[ptboss] tac turn', e); } }
          const r = await K.askOrFlee('command');
          const fut = isTense(r, ['fut', 'cond']);
          FXA.turn++;
          await K.perform(r);
          if (fut) {
            const n = r && r.clauses ? r.clauses.filter(c => c.tb && ['fut', 'cond'].includes(c.tb.tense)).length : 1;
            FXA.hits = Math.min(3, FXA.hits + (n >= 2 ? 2 : 1)); Sound.play('poof'); ST.star(ST.worldOf(f, 'mid'), '#e8e6f2', 1.2); K.emit('knockdown'); K.refreshLabels(); sayA(K, f, 'ouch', 1.8, 'foe boss'); await K.wait(1.0);
          } else { sayA(K, FXA.coachSt, 'now', 2.6, 'coach'); await K.wait(1.4); }
          if (FXA.hits >= 3) { await albaFolds(K); continue; }
          await wave(K, FXA, FT() && FT().FIGHT, 'gust', ['#e0e4ee', '#4a5266']);
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[ptboss] tac after', e); } }
        } else {
          const T0 = FXA.answered === 0 ? FT().TASKS.wish1 : FT().TASKS.wish2;
          rung(K, T0, 'The Gray Albatross · say a wish');
          const r = await answerAsk(K, T0, FT().TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.future.push(L0); toast(`${L0} · ${r.grade.why}${r.grade.tip ? ' · ' + r.grade.tip : ''}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXA.answered++; K.refreshLabels(); Sound.play('chime');
            if (FXA.answered >= 2) { await albaGives(K); return 'win'; }
            sayA(K, f, 'q2', 3.6); await K.wait(3.0);
          } else {
            if (r && r.gkind && r.gkind !== 'none') { sayA(K, f, 'today', 2.2, 'foe boss'); await K.wait(1.2); }
            const [t, en] = fa('wish'); K.say(FXA.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.6 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXA && FXA.phase === 1) await wave(K, FXA, FT() && FT().FIGHT, 'gust', ['#e0e4ee', '#4a5266']); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function albaFolds(K) {
    const { A: AC, ST } = K, f = FXA.f;
    FXA.phase = 2; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 9 }); Sound.play('pip');
    await K.wait(0.8);
    sayA(K, f, 'fold', 4.8); await K.wait(4.0);
    sayA(K, FXA.coachSt, 'wish', 3.2, 'coach'); await K.wait(1.8);
  }
  async function albaGives(K) {
    const { A: AC, ST } = K, f = FXA.f;
    FXA.flap = true;
    sayA(K, f, 'win', 5.2); Sound.play('chime'); ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 9.5 });
    await K.wait(4.0);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the fights (through TIME.fight: the world's tense, its realm), on the
  // harbor arena (port_battle.js) when it's there
  const AT = () => { const b = BATTLE._ && BATTLE._.arenaBuilders; return b && b.harbor ? { x: -230, z: -80, biome: 'harbor' } : { x: -230, z: -80 }; };
  async function fightOctopus() {
    hook();
    return TIME.fight({ boss: 'fog_octopus', foes: [{ kind: 'fog_octopus', color: 'red', size: 'big', giant: 1, hp: 40 }], place: AT(), tb: { scene: () => false } });
  }
  async function fightAlbatross() {
    hook();
    return TIME.fight({ boss: 'gray_albatross', foes: [{ kind: 'gray_albatross', color: 'white', size: 'big', giant: 1, hp: 40 }], place: AT(), tb: { noGlimpse: true } });     // (no glimpse: its gusts are its own attacks, dodged out loud)
  }
  try { hook(); } catch (e) { console.error('[ptboss] hooks', e); }
  return { init: () => { try { hook(); } catch (e) { console.error('[ptboss] hooks', e); } }, hook, fightOctopus, fightAlbatross, letter, octoModel, albaModel, PO, PA,
    get FXO() { return FXO; }, get FXA() { return FXA; } };
})();
