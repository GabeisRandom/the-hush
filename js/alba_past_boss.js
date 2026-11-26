'use strict';
// The Prompter («el Apuntador», «o Ponto», «der Souffleur», 提词人, プロンプター): Alba long ago's boss, in the prompter's box under the
// old theater's stage (DESIGN.md 18.6 "T1a"; game/TIME.md §9). A plug-in on battle/flow.js (BATTLE._.plugins.prompter), fought
// through TIME.fight, so the Past's tense rules hold (battle/timebattle.js): commands told as memories still replay.
//   What the Hush became down there: a gray figure in the prompter's shell, four masks going round it. Each turn it whispers a
//   lie about that night («La gorra de Elio era azul…»); you correct it in the past («No, la gorra era roja») and a mask cracks.
//   Hits don't hurt it (it's held together by lies); the present only gets "that's now: it already happened". Its whisper flies
//   at you or Mimo («¡Chsss!… por arriba»): dodge. It never takes your last heart. Its fourth lie is each language's own: the
//   line Elio got wrong (es / pt: when he and his dad came; de: the bells; zh: 大家好; ja: 親切). With the four masks gone the
//   shell opens and Elio's echo is free (alba_past_stage.js plays that scene).
//   APBOSS.fight() → the fight's result ({ outcome, grade }) · APBOSS.model() (the figure for the room) · APBOSS.hook()
const APBOSS = (() => {
  const T = () => APTXT;
  const BTX = () => (typeof BATTLE !== 'undefined' && BATTLE._) || null;
  const G = () => (typeof TIME !== 'undefined' && TIME.API ? TIME.API.G : null);
  const lang = () => { const g = G(); return (g && g.state && g.state.lang) || 'es'; };
  const isC = l => l === 'zh' || l === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plain = (s, l = lang()) => (isC(l) && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: l }) : String(s || ''));
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const mimoName = () => { const g = G(); return (g && g.state && g.state.mimoName) || 'Mimo'; };
  const fillMimo = (s, l = lang()) => String(s || '').replace(/\{mimo\}/g, isC(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName());
  const MASKS = 4;
  const ORDER = ['cap', 'stage', 'scared', 'final'];
  let FX = null, maskTex = null;

  // ------------------------------------------------------------ the figure: a wooden shell, a gray hooded shape in it, four masks
  function maskFace() {
    return maskTex || (maskTex = TK.canvasTex(128, 128, (c, w, h) => {
      c.fillStyle = '#efe9dc'; c.beginPath(); c.ellipse(64, 62, 50, 58, 0, 0, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = '#2b2235'; c.stroke();
      c.lineWidth = 5; for (const x of [42, 86]) { c.beginPath(); c.moveTo(x - 12, 50); c.quadraticCurveTo(x, 42, x + 12, 50); c.stroke(); }      // (eyes, half shut)
      c.fillStyle = '#2b2235'; c.beginPath(); c.ellipse(64, 92, 7, 9, 0, 0, TAU); c.fill();                                                        // (a little «o»: shhh)
      c.lineWidth = 7; c.strokeStyle = '#d8cfbd'; c.beginPath(); c.moveTo(64, 112); c.lineTo(64, 74); c.stroke();                                 // (a finger to its lips)
      c.lineWidth = 2.5; c.strokeStyle = '#2b2235'; c.stroke();
    }));
  }
  function model() {
    const A = PAST.API, root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    // the prompter's shell: a half dome of old wood, open to the front
    const k = A.Kit();
    k.add(A.KG.half, 0, 1.05, -0.3, 1.2, 1.25, 1.05, '#6b4a30', { rx: -Math.PI / 2 + 0.22, ink: 0.02 });
    k.add(A.KG.torus, 0, 1.05, -0.12, 1.18, 1.18, 0.5, '#8a5f3e', { ink: 0.012 });
    k.box(0, 0.06, 0.1, 2.3, 0.12, 1.4, '#5a3a24', { ink: 0.015 });
    const shell = new THREE.Group(); body.add(shell); k.build(shell);
    // the gray figure: a hood and a robe, two pale eyes, one long hand raised (shh)
    const f = new THREE.Group(); body.add(f);
    const fk = A.Kit();
    fk.add(A.KG.robe, 0, 0.1, 0.05, 0.9, 1.35, 0.9, '#8d8aa0', { ink: 0.02 });
    fk.add(A.KG.sphere, 0, 1.42, 0.08, 0.36, 0.42, 0.36, '#7c7890', { ink: 0.018 });
    fk.add(A.KG.sphere, 0, 1.38, 0.3, 0.24, 0.26, 0.12, '#2a2538', { ink: 0 });
    for (const s of [-1, 1]) fk.add(A.KG.ball6, s * 0.09, 1.42, 0.4, 0.045, 0.03, 0.02, '#e8f0ff', { ink: 0 });
    fk.rod([0.32, 1.0, 0.2], [0.22, 1.28, 0.42], 0.06, '#8d8aa0', 0.01);
    fk.rod([0.22, 1.28, 0.42], [0.05, 1.36, 0.45], 0.022, '#c9c4d8', 0.006);
    const fmat = TK.toon('#ffffff', { vc: 1, rim: 0.45 }).clone(); fmat.transparent = true;
    fk.build(f, { mat: fmat });
    const face = new THREE.MeshBasicMaterial({ map: maskFace(), transparent: true, side: THREE.DoubleSide });
    const masks = [0, 1, 2, 3].map(i => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.62), face); m.userData.a = i / 4 * TAU; body.add(m); return m; });
    // the echo inside, freed at the end: a small warm light with a red glint (Elio's cap)
    const echo = A.glow('#ffe2a0', 1.2, 0); echo.position.set(0, 1.0, 0.3); body.add(echo);
    const gl = A.glow('#c9c4dc', 3.0, 0.3); gl.position.y = 1.1; body.add(gl);
    const anchors = {};
    [['top', [0, 2.3, 0]], ['mid', [0, 1.0, 0.4]], ['head', [0, 1.45, 0.4]], ['face', [0, 1.38, 0.5]], ['book', [0, 1.1, 0.5]], ['feet', [0, 0.05, 0]]].forEach(([n, p]) => { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); anchors[n] = o; });
    const s = 1.2; root.scale.setScalar(s);
    return { root, body, shell, f, fmat, masks, echo, gl, anchors, kind: 'prompter', scale: s, radius: 1.1 * s, height: 2.4 * s, parts: [], labelH: 2.9, hover: 0, L: { k: 1, whisper: 0, open: 0 } };
  }
  function pose(h, F, t, dt) {
    const L0 = h.L, hits = FX ? FX.hits : 0, d = dt || 0.016;
    L0.whisper = Math.max(0, L0.whisper - d * 1.4);
    L0.open = damp(L0.open, FX && FX.done ? 1 : 0, 1.2, d);
    h.body.position.y = Math.sin(t * 1.2) * 0.05;
    h.f.position.z = Math.sin(t * 0.9) * 0.04 + L0.whisper * 0.12;
    h.f.rotation.z = Math.sin(t * 0.7) * 0.04;
    h.fmat.opacity = 1 - 0.85 * L0.open;
    h.shell.rotation.x = -0.5 * L0.open;
    h.masks.forEach((m, i) => { m.visible = i >= hits && !(FX && FX.done); const a = m.userData.a + t * 0.55; m.position.set(Math.sin(a) * 1.25, 1.15 + Math.sin(t * 1.7 + i) * 0.16, Math.cos(a) * 1.25); m.lookAt(m.position.x * 3, m.position.y, m.position.z * 3 + 4); m.rotation.z = Math.sin(t * 6 + i) * 0.1 * (1 + L0.whisper * 2); });
    h.echo.material.opacity = 0.2 + 0.7 * L0.open + (FX && !FX.done ? 0.08 * (hits / MASKS) : 0);
    h.gl.material.opacity = 0.3 - 0.2 * L0.open;
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }
  function label() {
    const l = lang(), N = T().NAMES.boss, left = FX ? Math.max(0, MASKS - FX.hits) : MASKS;
    return `<div class="bt-chips"><span class="bt-chip name">${isC(l) && typeof CJK !== 'undefined' ? CJK.html(N[l], { lang: l }) : esc(N[l] || N.en)}</span></div><div class="bt-hpbar"><i style="width:${Math.round(100 * left / MASKS)}%"></i><span>${FX && FX.done ? '…' : '🎭 ' + left}</span></div>`;
  }
  // a word as a sprite (the whisper flying at you)
  function wordSprite(text) {
    const cv = document.createElement('canvas'), c = cv.getContext('2d'), font = '900 64px "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif';
    c.font = font; cv.width = Math.min(1024, Math.ceil(c.measureText(text).width) + 56); cv.height = 104;
    c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 14; c.strokeStyle = '#d9cff5'; c.strokeText(text, cv.width / 2, 54); c.fillStyle = '#3a3448'; c.fillText(text, cv.width / 2, 54);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false, depthWrite: false }));
    sp.scale.set(0.55 * cv.width / cv.height, 0.55, 1); sp.renderOrder = 12; return sp;
  }

  // ------------------------------------------------------------ the fight
  const line = (key, l = lang()) => { const L0 = T().FIGHT[key]; return [fillMimo(L0[l] || L0.en, l), String(L0.en || '').replace(/\{mimo\}/g, mimoName())]; };
  const enOf = (L0, l) => String((L0 && (L0['en_' + l] || L0.en)) || '');
  function coach(K, key, dur = 3.0) { const [t, en] = line(key); K.say(FX.coachSt, plain(t), { cls: 'coach', en, dur }); }
  async function whisper(K) {
    const l = lang(), W = T().WHISPERS[FX.cur], f = FX.f;
    if (f.h && f.h.L) f.h.L.whisper = 1;
    snd('swoosh');
    K.say(f, plain(W.lie[l] || W.lie.en), { cls: 'foe shout boss', en: enOf(W.lie, l), dur: K.readTime(plain(W.lie[l] || '')) + 2.4 });
    await K.wait(Math.min(3.2, K.readTime(plain(W.lie[l] || '')) + 0.6));
  }
  // the box: a correction of this lie (APTXT.grade) is a «fix»; a command goes on as a command (it replays, but the masks hold)
  async function askFix(K) {
    const _ = BTX(), Pp = _ && _.P; if (!Pp) return null;
    const l = lang(), W = T().WHISPERS[FX.cur], TK0 = W.task, parse0 = Pp.parse;
    Pp.parse = function (text, ctx) {
      const g = T().grade(TK0, text, l, mimoName());
      if (g.ok) return { ok: true, kind: 'fix', raw: text, grade: g, clauses: [] };
      if (g.kind === 'lie' || g.kind === 'pres' || g.kind === 'wrong') return { ok: true, kind: 'fixwrong', raw: text, grade: g, clauses: [] };
      return parse0.call(this, text, ctx);
    };
    try {
      const frame = plain(fillMimo((TK0.frame || {})[l] || '', l)), chips = ((TK0.chips || {})[l] || []).map(([w, e]) => `${plain(w)} (${e})`).join(' · ');
      const model = plain(fillMimo((TK0.model || {})[l] || '', l));
      return await K.askOrFlee('command', { hint: FX.miss >= 2 ? `Like this: «${model}»` : `«${frame}»${chips ? ' · ___ = ' + chips : ''}` });
    } finally { Pp.parse = parse0; }
  }
  async function crackMask(K, r) {
    const { A: AC, ST } = K, f = FX.f, g = r.grade;
    const letter = 'SABCD'[Math.min(4, 'SABCD'.indexOf(g.letter) + Math.min(2, FX.miss))];
    FX.grades.push(letter); FX.hits++; FX.miss = 0;
    UI.toast(`${letter} · ${g.kind === 'right' && letter === 'S' ? 'That’s how it was!' : g.why}`);
    K.say(AC.you, r.raw, { cls: 'you', dur: 2.0 });
    await K.wait(0.9);
    snd('crack'); ST.shake(0.25, 0.3); ST.star(ST.worldOf(f, 'head'), '#efe9dc', 1.2); K.emit('knockdown'); K.refreshLabels();
    const [t, en] = line('crack'); K.say(f, plain(t), { cls: 'foe shout boss', en, dur: 2.2 });
    await K.wait(1.0);
    coach(K, FX.hits >= MASKS ? 'last' : 'yes', 2.4);
    await K.wait(1.4);
  }
  async function shhAttack(K) {
    const { G: BG, A: AC, ST } = K, f = FX.f, l = lang();
    if (BG.hearts <= 1) { const [t, en] = line('shh'); K.say(f, plain(t), { cls: 'foe', en, dur: 1.6 }); await K.wait(1.2); return; }
    const high = Math.random() < 0.5, tgt = Math.random() < 0.5 ? AC.mimo : AC.you;
    const dw = BG.L && BG.L.dodgeWords ? BG.L.dodgeWords(BG.tier) : null, [shh, shhEn] = line('shh');
    const sTxt = plain(shh), where = (dw && (high ? dw.high : dw.low)) || (high ? '↑' : '↓');
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.7 });
    if (f.h && f.h.L) f.h.L.whisper = 1; snd('swoosh');
    K.say(f, `${sTxt} … ${where}`, { cls: 'foe shout boss', en: `${shhEn}… ${high ? 'up high' : 'down low'}`, dur: K.readTime(sTxt + where) + 2.0 });
    K.emit('shout', { text: sTxt, high, foe: f, boss: true }); K.dodgeHint(true);
    await K.wait(K.readTime(sTxt + where) + 0.15);
    K.emit('windup', { foe: f, high, boss: true });
    const Tm = BG.t + 0.8, key = high ? 'ArrowDown' : 'ArrowUp';
    const tp = K.timingWindow(Tm, key, () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
    const spr = wordSprite(sTxt.replace(/[!！…\s]/g, '') || 'SHH'), a = ST.worldOf(f, 'face'), b = ST.worldOf(tgt, high ? 'top' : 'feet');
    ST.prop(spr); spr.position.copy(a);
    await K.along(0.8, u => { spr.position.lerpVectors(a, b, u * 1.06); spr.position.y += Math.sin(u * Math.PI) * (high ? 0.45 : 0.12); spr.material.rotation = Math.sin(u * 10) * 0.12; });
    const grade = await tp;
    ST.dropProp(spr);
    K.dodgeResult(f, tgt, grade, 1, {});
    if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
    await K.wait(0.4);
  }
  const PLUG = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'prompter'); if (!f) { FX = null; return; }
      FX = { f, hits: 0, miss: 0, misses: 0, turn: 0, cur: ORDER[0], grades: [], done: false, coachSt: { kind: 'noa', x: -3.0, y: 1.6, z: -2.4, talk: 0, flash: 0 } };
      f.isBoss = true;
    },
    floor: f => (f && f.species === 'prompter' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FX) return 'flee';
      const f = FX.f, TAC = BTX() && BTX().tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 11 });
      K.emit('boss', { foe: f });
      for (;;) {
        BG.turn++; K.refreshLabels();
        FX.cur = FX.hits < MASKS ? ORDER[FX.hits] : 'final';
        if (FX.miss >= 3 && FX.hits < MASKS - 1 && FX.cur !== 'final') FX.cur = 'robes';     // (stuck on one lie: it tries another)
        ST.shot('focus', AC.you, f, { up: 0.9, dist: 9.5 });
        await whisper(K);
        if (FX.turn === 0) { coach(K, 'masks', 3.4); await K.wait(2.2); }
        if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[prompter] tac turn', e); } }
        const r = await askFix(K);
        FX.turn++;
        if (!r || r.flee || r === K.FLEE) return 'flee';
        if (r.kind === 'fix') {
          if (FX.cur === 'robes') { FX.miss = 0; }
          await crackMask(K, r);
          if (FX.hits >= MASKS) { await opened(K); return 'win'; }
        } else if (r.kind === 'fixwrong') {
          FX.miss++; FX.misses++; snd('wrong');
          K.say(AC.you, r.raw, { cls: 'you', dur: 1.8 }); await K.wait(1.0);
          coach(K, r.grade.kind === 'lie' ? 'lie' : 'now', 2.8); await K.wait(1.6);
        } else {
          await K.perform(r);
          FX.miss++; FX.misses++;
          coach(K, 'cmd', 3.0); await K.wait(1.6);
        }
        await shhAttack(K);
        if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[prompter] tac after', e); } }
      }
    },
    async foePhase(K) { if (FX && !FX.done) await shhAttack(K); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  // the four masks gone: the shell opens, the gray lets go, and a small warm light is left
  async function opened(K) {
    const { A: AC, ST } = K, f = FX.f;
    FX.done = true; K.refreshLabels();
    ST.shot('focus', AC.mimo, f, { up: 0.8, dist: 8.5 });
    snd('chime'); ST.shake(0.3, 0.5);
    await K.wait(2.2);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.8);
  }
  // the bestiary, the species' names, the model, the label, the plug-in (BATTLE._ hooks, once)
  let hooked = false;
  function hook() {
    const _ = BTX(); if (!_ || hooked) return !!hooked; hooked = true;
    const SP = { es: { w: 'apuntador', pl: 'apuntadores', g: 'm', en: 'prompter' }, pt: { w: 'ponto', pl: 'pontos', g: 'm', en: 'prompter' }, de: { w: 'Souffleur', pl: 'Souffleure', gen: 'Souffleurs', g: 'm', en: 'prompter' },
      zh: { w: '[提词人|tí cí rén]', en: 'prompter', g: 'm', cl: '个', cls: ['个', '位'] }, ja: { w: 'プロンプター', en: 'prompter', g: 'm' } };
    for (const [lg, sp] of Object.entries(SP)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species.prompter) { Lg.species.prompter = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
    const M = _.M;
    if (M && !M.prompterHooked) {
      M.prompterHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (String(k || '') === 'prompter' ? 'prompter' : k0(k));
      M.build = o => (o && o.kind === 'prompter' ? model() : b0(o));
      M.pose = (h, F, t, dt) => (h && h.kind === 'prompter' ? pose(h, F, t, dt) : p0(h, F, t, dt));
      M.brighten = (h, k) => (h && h.kind === 'prompter' ? undefined : br0(h, k));
    }
    const U = _.UI; if (U && U.label && !U.prompterHooked) { U.prompterHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && f.species === 'prompter' ? label() : html); }; }
    const N = T().NAMES.lore;
    if (_.RW && _.RW.LORE && !_.RW.LORE['boss:prompter']) _.RW.LORE['boss:prompter'] = [N.es, N.pt, N.de, N.zh, N.ja, N.en];
    if (_.RW && _.RW.KIND_EN) _.RW.KIND_EN.prompter = 'the Prompter';
    if (_.UI && _.UI.ICON && !_.UI.ICON.prompter) _.UI.ICON.prompter = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M10 56 Q10 14 32 10 Q54 14 54 56 Z" fill="#6b4a30" stroke="#2b2235" stroke-width="3"/><ellipse cx="32" cy="36" rx="13" ry="16" fill="#8d8aa0" stroke="#2b2235" stroke-width="2.5"/><ellipse cx="32" cy="33" rx="8" ry="9" fill="#efe9dc" stroke="#2b2235" stroke-width="2"/><circle cx="32" cy="38" r="2" fill="#2b2235"/><path d="M27 30 q2 -2 4 0 M33 30 q2 -2 4 0" stroke="#2b2235" stroke-width="1.6" fill="none"/></svg>';
    _.plugins = _.plugins || {}; _.plugins.prompter = PLUG;
    if (!_.arenaBuilders || !_.arenaBuilders.theater) { try { if (typeof PAST_SC !== 'undefined' && PAST_SC._ && PAST_SC._.hookBoss) PAST_SC._.hookBoss(); } catch (e) { /* */ } }
    try { if (typeof BFX !== 'undefined' && BFX.VOICES && !BFX.VOICES.prompter) BFX.VOICES.prompter = { m: 58, vow: ['u', 'i', 'u'], len: 0.12, gap: 0.05 }; } catch (e) { /* (no battle sounds) */ }
    return true;
  }
  // the fight (the theater's stage as a memory: past_scenes.js's arena), through TIME.fight: the Past's sepia and tense rules
  async function fight() {
    hook();
    const H = (typeof CEMETERY !== 'undefined' && CEMETERY._ && CEMETERY._.HALL) || { x: -13.5, z: -241 };
    const run = typeof TIME !== 'undefined' && TIME.fight ? TIME.fight : o => G().fight(o);
    const r = await run({ boss: 'prompter', foes: [{ kind: 'prompter', color: 'white', size: 'big', giant: 1, hp: 30 }], place: { biome: 'theater', x: H.x, z: H.z }, tb: { scene: () => false, noGlimpse: true, noQueue: true } });
    const gs = FX ? FX.grades : [], worst = gs.reduce((a, g) => Math.max(a, 'SABCD'.indexOf(g)), 0);
    const letter = !gs.length ? 'C' : 'SABCD'[Math.min(4, worst + (FX && FX.misses > 4 ? 1 : 0))];
    return Object.assign({}, r || {}, { grade: letter, misses: FX ? FX.misses : 0 });
  }
  return { fight, model, hook, ORDER, MASKS, PLUG, get FX() { return FX; } };
})();
