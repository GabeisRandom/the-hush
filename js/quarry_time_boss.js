'use strict';
// The Quarry Caves' two time bosses (DESIGN.md 18.10 "T2b"): plug-ins on battle/flow.js (BATTLE._.plugins), fought through
// TIME.fight so the world's tense rules apply (battle/timebattle.js).
//   'echo_grandma', Grandma Echo (the old deep gallery, long ago): the oldest echo bat, white with age, who swallowed a little
//     voice. Phase 1: commands told as memories land («{mimo} saltó…», «{mimo} cantó…»: a song is two hits); the present only
//     confuses {mimo}; and she's an echo bat: say the same thing twice in a row and she copies it (no hit, she cackles). Three
//     hits and she's dizzy and nostalgic: she asks how it used to be, and you tell her, in the imperfect (QPTXT.TASKS gallery,
//     boy). She remembers, and gives back Elio's echo. Her echo waves are dodged; she never takes your last heart.
//   'gray_mole', the Gray Mole (the collapsed deep mine, tomorrow): a big gray mole in a cracked miner's helmet, digging in the
//     dark. Phase 1: it dives, and pebbles jump over one of three holes: guess where it will come up, with the future of
//     probability («Estará a la izquierda»): right, and {mimo} bonks it; wrong, and it pops up elsewhere and throws gravel (dodge).
//     Three bonks and it blinks up at the light: it asks two things it can't know (QFTXT.TASKS up, hour), you guess, it stops.
// Each has its own song (quarry_time_music.js: 'boss_qr_echo', 'boss_qr_mole'), bestiary line, icon and voice.
//   QRBOSS.fightEcho() · QRBOSS.fightMole() · QRBOSS.letter('past' | 'future') · QRBOSS.moleModel()
const QRBOSS = (() => {
  const BT = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = BT && BT._;
  const Q = () => (typeof QUART !== 'undefined' ? QUART : null);
  const lang = () => (Q() ? Q().lang() : 'es');
  const isC = () => lang() === 'zh' || lang() === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mimoName = () => (Q() ? Q().mimoName() : 'Mimo');
  const fillM = s => (Q() ? Q().fillMimo(s, lang()) : String(s || '').replace(/\{mimo\}/g, 'Mimo'));
  const lineOf = (TAB, key) => { const T = (TAB || {})[key] || {}, l = lang(); return [fillM(T[l] || T.en || ''), Q() ? Q().fillEn(T.en || '') : String(T.en || '')]; };
  const RANK = 'SABCD';
  const LETTERS = { past: [], future: [] };
  function letter(w) { const L0 = LETTERS[w] || []; if (!L0.length) return 'B'; const avg = L0.reduce((a, x) => a + RANK.indexOf(x), 0) / L0.length; return RANK[Math.max(0, Math.min(4, Math.round(avg)))]; }
  const playSong = name => { try { if (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(name)) Sound.setSong(name); } catch (e) { /* */ } };
  const isTense = (r, ts) => !!(r && r.clauses && r.clauses.some(c => c.tb && ts.includes(c.tb.tense)));
  const PT = () => (typeof QPTXT !== 'undefined' ? QPTXT : null), FT = () => (typeof QFTXT !== 'undefined' ? QFTXT : null);

  // ------------------------------------------------------------ the Gray Mole's model (round, gray, a cracked helmet with a dead lamp)
  function moleModel() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const k = PAST.API.Kit(), KG = PAST.API.KG;
    k.add(KG.sphere, 0, 0.95, 0, 1.0, 0.95, 0.9, '#8d8a96').add(KG.sphere, 0, 0.7, 0.35, 0.7, 0.55, 0.62, '#a6a2ae', { ink: 0.012 });
    k.add(KG.sphere, 0, 1.25, 0.82, 0.2, 0.15, 0.18, '#e8a0b4', { ink: 0.01 });
    for (const s of [-1, 1]) {
      k.add(KG.ball6, s * 0.3, 1.5, 0.74, 0.08, 0.03, 0.03, '#2b2235', { ink: 0 });
      k.add(KG.sphere, s * 0.85, 0.55, 0.55, 0.32, 0.18, 0.3, '#a6a2ae', { ink: 0.012 });
      for (let j = -1; j <= 1; j++) k.add(KG.cone, s * 0.9 + j * 0.12, 0.42, 0.86, 0.05, 0.28, 0.05, '#e8e4dc', { rx: Math.PI / 2 - 0.3, ink: 0.006 });
    }
    k.add(KG.half, 0, 1.72, -0.05, 0.62, 0.42, 0.62, '#b8a46a').add(KG.cyl, 0, 1.74, -0.02, 0.7, 0.04, 0.7, '#b8a46a', { ink: 0.01 });
    k.add(KG.cyl, 0, 1.95, 0.5, 0.14, 0.18, 0.14, '#6a6870', { rx: Math.PI / 2, ink: 0.008 });
    k.box(0.2, 1.98, 0.2, 0.3, 0.02, 0.02, '#2b2235', { rz: 0.5, ink: 0 });
    const inner = new THREE.Group(); body.add(inner); k.build(inner);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#b8b4c8', transparent: true, opacity: 0.2, depthWrite: false })); gl.scale.setScalar(3.6); gl.position.y = 1.0; root.add(gl);
    const anchors = {};
    [['top', [0, 2.3, 0]], ['mid', [0, 1.0, 0.4]], ['head', [0, 1.5, 0.5]], ['face', [0, 1.3, 0.85]], ['feet', [0, 0.05, 0]]].forEach(([n, p]) => { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); anchors[n] = o; });
    return { root, body, inner, gl, anchors, kind: 'gray_mole', scale: 1, radius: 1.1, height: 2.2, parts: [], labelH: 2.8, hover: 0, L: {} };
  }
  function poseMole(h, F, t) {
    const under = FXM ? FXM.under : 0;
    h.body.position.y = -2.4 * under + Math.sin(t * 2.2) * 0.04 * (1 - under);
    h.inner.rotation.y = Math.sin(t * 1.6) * 0.2;
    h.inner.rotation.z = FXM && FXM.phase === 2 ? Math.sin(t * 3) * 0.08 : 0;
    h.gl.material.opacity = (0.16 + 0.06 * Math.sin(t * 2)) * (1 - under);
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }

  // ------------------------------------------------------------ the battle's hooks: species, models, labels, the bestiary
  function hook() {
    if (!_) return;     // (every piece below is guarded, so it runs again safely: the species that loaded later join in)
    const SP = { echo_grandma: PT() ? PT().SPECIES : null, gray_mole: FT() ? FT().SPECIES : null };
    for (const [id, table] of Object.entries(SP)) if (table) for (const [lg, sp] of Object.entries(table)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species[id]) { Lg.species[id] = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
    const M = _.M;
    if (M && !M.qrHooked) {
      M.qrHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (String(k || '') === 'echo_grandma' ? 'echo_grandma' : String(k || '') === 'gray_mole' ? 'gray_mole' : k0(k));
      M.build = o => {
        if (o && o.kind === 'gray_mole') return moleModel();
        if (o && o.kind === 'echo_grandma') { const h = b0(Object.assign({}, o, { kind: 'bat', color: 'white', size: 'big' })); h.kind = 'echo_grandma'; return h; }
        return b0(o);
      };
      M.pose = (h, F, t, dt) => {
        if (h && h.kind === 'gray_mole') return poseMole(h, F, t, dt);
        if (h && h.kind === 'echo_grandma') { h.kind = 'bat'; try { return p0(h, F, t, dt); } finally { h.kind = 'echo_grandma'; } }
        return p0(h, F, t, dt);
      };
      M.brighten = (h, k) => {
        if (h && h.kind === 'gray_mole') return undefined;
        if (h && h.kind === 'echo_grandma') { h.kind = 'bat'; try { return br0(h, k); } finally { h.kind = 'echo_grandma'; } }
        return br0(h, k);
      };
    }
    const U = _.UI;
    if (U && U.label && !U.qrHooked) { U.qrHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && (f.species === 'echo_grandma' || f.species === 'gray_mole') ? bossLabel(f) : html); }; }
    if (_.RW && _.RW.LORE) {
      if (PT() && !_.RW.LORE['boss:echo_grandma']) _.RW.LORE['boss:echo_grandma'] = PT().LORE;
      if (FT() && !_.RW.LORE['boss:gray_mole']) _.RW.LORE['boss:gray_mole'] = FT().LORE;
    }
    if (_.RW && _.RW.KIND_EN) { _.RW.KIND_EN.echo_grandma = 'Grandma Echo'; _.RW.KIND_EN.gray_mole = 'the Gray Mole'; }
    if (_.UI && _.UI.ICON) {
      if (!_.UI.ICON.echo_grandma) _.UI.ICON.echo_grandma = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M6 30 Q16 14 24 26 Q32 18 40 26 Q48 14 58 30 Q46 30 40 40 Q32 34 24 40 Q18 30 6 30 Z" fill="#e8e4f4" stroke="#2b2235" stroke-width="3"/><circle cx="32" cy="34" r="9" fill="#f4efe2" stroke="#2b2235" stroke-width="3"/><circle cx="28" cy="32" r="2.6" fill="none" stroke="#2b2235" stroke-width="1.6"/><circle cx="36" cy="32" r="2.6" fill="none" stroke="#2b2235" stroke-width="1.6"/></svg>';
      if (!_.UI.ICON.gray_mole) _.UI.ICON.gray_mole = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse cx="32" cy="40" rx="20" ry="16" fill="#8d8a96" stroke="#2b2235" stroke-width="3"/><path d="M14 26 Q32 4 50 26 Z" fill="#b8a46a" stroke="#2b2235" stroke-width="3"/><circle cx="32" cy="42" r="4" fill="#e8a0b4" stroke="#2b2235" stroke-width="2"/><path d="M24 36 L28 36 M36 36 L40 36" stroke="#2b2235" stroke-width="2.4"/></svg>';
    }
    _.plugins = _.plugins || {}; _.plugins.echo_grandma = PE; _.plugins.gray_mole = PM;
    try { if (typeof BFX !== 'undefined' && BFX.VOICES) { if (!BFX.VOICES.echo_grandma) BFX.VOICES.echo_grandma = { m: 71, vow: ['e', 'o', 'e'], len: 0.09, gap: 0.05 }; if (!BFX.VOICES.gray_mole) BFX.VOICES.gray_mole = { m: 47, vow: ['u', 'o', 'u'], len: 0.12, gap: 0.05 }; } } catch (e) { /* (no battle sounds) */ }
  }
  function bossLabel(f) {
    const l = lang(), echo = f.species === 'echo_grandma', N = echo ? (PT() ? PT().NAMES.boss : {}) : (FT() ? FT().NAMES.boss : {});
    const name = isC() && typeof CJK !== 'undefined' ? CJK.html(N[l] || N.en || '', { lang: l }) : esc(N[l] || N.en || '');
    const FX = echo ? FXE : FXM, left = FX ? Math.max(0, 3 - FX.hits) : 3, p2 = FX && FX.phase === 2;
    return `<div class="bt-chips"><span class="bt-chip name">${name}</span></div><div class="bt-hpbar"><i style="width:${Math.round(100 * (p2 ? (2 - FX.answered) / 2 : left / 3))}%"></i><span>${p2 ? '?' : (echo ? '🦇 ' : '🕳 ') + left}</span></div>`;
  }
  // an answer in the box, graded as yours (not a command): QUART.grade with the world's task
  async function answerAsk(K, T0, tips) {
    const Pp = _ && _.P; if (!Pp || !Q()) return null;
    const parse0 = Pp.parse, lg = lang(); let tip = null;
    Pp.parse = function (text, ctx) {
      const g = Q().grade(T0, text, lg, tips);
      if (g.ok) return { ok: true, kind: 'answer', raw: text, grade: g, clauses: [], untaught: [], previewHtml: '<b>Your answer</b>' };
      tip = g.kind !== 'none' && g.why ? g.why : null;
      const r0 = parse0.call(this, text, ctx);
      // a wrong tense the grader knows comes back to the fight with its tip, instead of Mimo's «¿…?»
      if (tip && (!r0 || !r0.ok)) return { ok: true, kind: 'miss', raw: text, grade: g, clauses: [], untaught: [], previewHtml: '' };
      return r0;
    };
    try {
      const frame = Q().plainT(fillM((T0.frame || {})[lg] || '')), chips = ((T0.chips || {})[lg] || []).map(([x, e]) => `${Q().plainT(x)} (${e})`).join(' · ');
      const r = await K.askOrFlee('command', { hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}` });
      if (r && r.kind !== 'answer' && tip) r.tip = tip;
      return r;
    } finally { Pp.parse = parse0; }
  }
  // a wave thrown at you or {mimo} (an echo's cry, a fistful of gravel): where it's coming from, then dodge it
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

  // ------------------------------------------------------------ Grandma Echo (the Past)
  let FXE = null;
  const fe = key => lineOf(PT() && PT().FIGHT, key);
  const sayE = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fe(key); K.say(st0, t, { cls, en, dur }); };
  const verbOf = r => { try { const c = (r && r.clauses || []).find(x => x.verb); return c ? c.verb : null; } catch (e) { return null; } };
  const PE = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'echo_grandma'); if (!f) { FXE = null; return; }
      FXE = { f, hits: 0, phase: 1, turn: 0, answered: 0, last: null, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.past = [];
      playSong('boss_qr_echo');
    },
    floor: f => (f && f.species === 'echo_grandma' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXE) return 'flee';
      const f = FXE.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 11 });
      sayE(K, f, 'intro', 3.0); K.emit('boss', { foe: f });
      await K.wait(2.8);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXE.phase === 1) {
          if (FXE.turn === 0) { sayE(K, FXE.coachSt, 'coach', 4.2, 'coach'); await K.wait(3.2); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[qrboss] tac turn', e); } }
          const r = await K.askOrFlee('command');
          const past = isTense(r, ['pret', 'impf']), v = verbOf(r), copied = past && v && v === FXE.last;
          FXE.turn++;
          if (copied) {
            // she's an echo: the same thing twice, and she copies it back
            sayE(K, f, 'copy', 2.0, 'foe boss'); Sound.play('pip'); ST.shake(0.15, 0.2); await K.wait(1.4);
            const [t, en] = fe('coach'); K.say(FXE.coachSt, t, { cls: 'coach', en, dur: 3.2 }); await K.wait(1.8);
          } else {
            await K.perform(r);
            FXE.last = v;
            if (past) { const n = v === 'sing' ? 2 : 1; FXE.hits = Math.min(3, FXE.hits + n); ST.star(ST.worldOf(f, 'head'), '#fff3a0', 1.1); K.emit('knockdown'); K.refreshLabels(); sayE(K, f, 'ouch', 1.8, 'foe boss'); await K.wait(1.0); }
            else { sayE(K, FXE.coachSt, 'now', 2.6, 'coach'); await K.wait(1.4); }
          }
          if (FXE.hits >= 3) { await echoDizzy(K); continue; }
          await wave(K, FXE, PT() && PT().FIGHT, 'sweep', ['#e8e4f4', '#5a4a7a']);
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[qrboss] tac after', e); } }
        } else {
          const T0 = FXE.answered === 0 ? PT().TASKS.gallery : PT().TASKS.boy;
          const r = await answerAsk(K, T0, PT().TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.past.push(L0); UI.toast(`${L0} · ${r.grade.why}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXE.answered++; K.refreshLabels();
            if (FXE.answered >= 2) { await echoGives(K); return 'win'; }
            sayE(K, f, 'q2', 3.6); await K.wait(3.0);
          } else {
            const [t, en] = fe('answer'); K.say(FXE.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.4 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXE && FXE.phase === 1) await wave(K, FXE, PT() && PT().FIGHT, 'sweep', ['#e8e4f4', '#5a4a7a']); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function echoDizzy(K) {
    const { A: AC, ST } = K, f = FXE.f;
    FXE.phase = 2; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); ST.shake(0.25, 0.3); Sound.play('pip');
    await K.wait(0.8);
    sayE(K, f, 'dizzy', 4.2); await K.wait(3.6);
    sayE(K, FXE.coachSt, 'answer', 3.2, 'coach'); await K.wait(1.8);
  }
  async function echoGives(K) {
    const { A: AC, ST } = K, f = FXE.f;
    sayE(K, f, 'remember', 3.0); Sound.play('chime'); await K.wait(2.4);
    sayE(K, f, 'win', 4.6); ST.shot('focus', AC.mimo, f, { up: 0.8, dist: 9 });
    await K.wait(3.4);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the Gray Mole (the Future)
  let FXM = null;
  const fm = key => lineOf(FT() && FT().FIGHT, key);
  const sayM = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fm(key); K.say(st0, t, { cls, en, dur }); };
  const SIDES = ['left', 'middle', 'right'], OFF = [-2.3, 0, 2.3];
  const PM = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'gray_mole'); if (!f) { FXM = null; return; }
      FXM = { f, hits: 0, phase: 1, turn: 0, answered: 0, hole: 1, lastHole: -1, under: 0, holes: [], coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.future = [];
      playSong('boss_qr_mole');
    },
    floor: f => (f && f.species === 'gray_mole' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXM) return 'flee';
      const f = FXM.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      // three holes in a row, as you see them: left, middle, right
      FXM.holes = OFF.map(dx => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.75, 18), new THREE.MeshBasicMaterial({ color: '#141018' })); m.rotation.x = -Math.PI / 2; m.position.set(f.hx + dx, 0.03, f.hz); ST.prop(m); return m; });
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 11 });
      sayM(K, f, 'intro', 3.4); K.emit('boss', { foe: f });
      // (no commands in this fight, only guesses: the Future's plan rung, tip and queue stay out of it; the rung shows a guess)
      const rung = T0 => { try { if (K.UI && K.UI.rung) K.UI.rung(`The Gray Mole · guess, in tomorrow’s words: <b>«${esc(Q().plainT(fillM((T0.model || {})[lang()] || '')))}»</b>`); } catch (e) { /* */ } };
      rung(FT().moleTask('left'));
      await K.wait(3.0);
      try {
        for (;;) {
          BG.turn++; K.refreshLabels();
          if (FXM.phase === 1) {
            if (FXM.turn === 0) { sayM(K, FXM.coachSt, 'coach', 4.4, 'coach'); await K.wait(3.4); }
            // it dives, and the pebbles jump over where it'll come up (the camera looks down on all three holes)
            ST.shot('focus', { x: f.hx + OFF[0], z: f.hz }, { x: f.hx + OFF[2], z: f.hz }, { up: 0.1, pitch: 0.42, dist: 10.5 });
            let h = (Math.random() * 3) | 0; if (h === FXM.lastHole) h = (h + 1 + ((Math.random() * 2) | 0)) % 3; FXM.hole = h; FXM.lastHole = h;
            sayM(K, f, 'dive', 1.6, 'foe boss'); Sound.play('land', 6);
            await K.along(0.5, u => { FXM.under = u; }); f.x = f.hx + OFF[h];
            for (let k = 0; k < 3; k++) { const p = FXM.holes[h].position; ST.star(new THREE.Vector3(p.x, 0.3 + k * 0.15, p.z), '#c8c0b0', 0.7); if (ST.S && ST.S.fx && ST.S.fx.puff) ST.S.fx.puff(p.x, 0.2, p.z, 5, 0.18, '#a8a098'); Sound.play('pip'); await K.wait(0.35); }
            const T0 = FT().moleTask(SIDES[h]);
            const r = await answerAsk(K, T0, FT().TIPS);
            FXM.turn++;
            await K.along(0.35, u => { FXM.under = 1 - u; });
            if (r && r.kind === 'answer') {
              const L0 = r.grade.letter; LETTERS.future.push(L0); UI.toast(`${L0} · ${r.grade.why}`);
              K.say(AC.you, r.raw, { cls: 'you', dur: 1.8 }); await K.wait(0.8);
              FXM.hits++; Sound.play('land', 12); ST.star(ST.worldOf(f, 'head'), '#fff3a0', 1.2); ST.shake(0.2, 0.25); K.emit('knockdown'); K.refreshLabels();
              sayM(K, f, 'bonk', 2.0, 'foe boss'); await K.wait(1.4);
              if (FXM.hits >= 3) { await moleDazed(K); continue; }
            } else {
              const [t, en] = fm('missed'); K.say(FXM.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.4 }); await K.wait(1.6);
              sayM(K, f, 'laugh', 1.6, 'foe boss'); await K.wait(0.8);
              await wave(K, FXM, FT() && FT().FIGHT, 'gravel', ['#d9d6e4', '#4a4656']);
            }
          } else {
            const T0 = FXM.answered === 0 ? FT().TASKS.up : FT().TASKS.hour;
            rung(T0);
            const r = await answerAsk(K, T0, FT().TIPS);
            if (r && r.kind === 'answer') {
              const L0 = r.grade.letter; LETTERS.future.push(L0); UI.toast(`${L0} · ${r.grade.why}`);
              K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
              FXM.answered++; K.refreshLabels();
              if (FXM.answered >= 2) { await moleStops(K); return 'win'; }
              sayM(K, f, 'q2', 3.4); await K.wait(2.8);
            } else {
              const [t, en] = fm('guess'); K.say(FXM.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.4 }); await K.wait(2.2);
            }
          }
        }
      } finally { (FXM && FXM.holes || []).forEach(m => { try { ST.dropProp(m); } catch (e) { /* */ } }); }
    },
    async foePhase(K) { if (FXM && FXM.phase === 1) await wave(K, FXM, FT() && FT().FIGHT, 'gravel', ['#d9d6e4', '#4a4656']); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function moleDazed(K) {
    const { A: AC, ST } = K, f = FXM.f;
    FXM.phase = 2; FXM.under = 0; f.x = f.hx; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); Sound.play('crunch');
    await K.wait(0.8);
    sayM(K, f, 'dazed', 4.2); await K.wait(3.6);
    sayM(K, FXM.coachSt, 'guess', 3.2, 'coach'); await K.wait(1.8);
  }
  async function moleStops(K) {
    const { A: AC, ST } = K, f = FXM.f;
    sayM(K, f, 'win', 4.6); Sound.play('chime'); ST.shot('focus', AC.mimo, f, { up: 0.8, dist: 9 });
    await K.wait(3.4);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the fights (through TIME.fight: the world's tense, its realm)
  async function fightEcho() {
    hook();
    return TIME.fight({ boss: 'echo_grandma', foes: [{ kind: 'echo_grandma', color: 'white', size: 'big', giant: 1.15, hp: 40 }], place: { x: 88, z: -276, biome: 'cave' }, tb: { scene: () => false } });
  }
  async function fightMole() {
    hook();
    return TIME.fight({ boss: 'gray_mole', foes: [{ kind: 'gray_mole', color: 'white', size: 'big', giant: 1, hp: 40 }], place: { x: 88, z: -276, biome: 'cave' }, tb: { noGlimpse: true, noQueue: true } });
  }
  try { hook(); } catch (e) { console.error('[qrboss] hooks', e); }
  return { init: () => { try { hook(); } catch (e) { console.error('[qrboss] hooks', e); } }, hook, fightEcho, fightMole, letter, moleModel, PE, PM,
    get FXE() { return FXE; }, get FXM() { return FXM; } };
})();
