'use strict';
// The Mirror Lake's two time bosses (DESIGN.md 18.10 "T2a"): plug-ins on battle/flow.js (BATTLE._.plugins), fought through
// TIME.fight so the world's tense rules apply (battle/timebattle.js: the Past's commands are memories, the Future's are plans).
//   'frog_king', the Frog King (the frogs' grotto, long ago): young and very vain. He hides among two look-alike guards on the
//     lily pads (three frogs, one crown), and they swap pads after every round: the lake's own rule, say which one («{mimo} saltó
//     sobre la rana de la izquierda»). Three memories that land on him and he sulks; then he asks you three vain questions about
//     himself, and you tell him what he did, to his face, with the irregular past (LPTXT.BOSSQ: «Hiciste mucho ruido», «Dijiste
//     "¡Silencio!"», «Trajiste su voz»). He gives back what he swallowed: Elio's echo.
//   'gray_toad', the Gray Toad (the drowned grotto, tomorrow): old, huge and gray, croaking dark predictions. Each round it shows
//     which way it will jump (it rises: high; it crouches: low); predicting it («El sapo saltará por arriba») makes it miss and
//     {mimo} counters; plans for {mimo} land next turn. Three of those and it croaks its darkest predictions: you answer each with
//     a promise in the irregular future (LFTXT.BOSSQ: «¡Todos vendrán!», «¡Podremos cruzar!»).
// Each has its own song (lake_time_music.js, set as the fight starts), bestiary line, icon and voice.
//   LKBOSS.fightKing() · LKBOSS.fightToad() · LKBOSS.letter('past' | 'future')
const LKBOSS = (() => {
  const BT = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = BT && BT._;
  const lang = () => (typeof LAKET !== 'undefined' && LAKET ? LAKET.lang() : 'es');
  const isC = () => lang() === 'zh' || lang() === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mimoName = () => (typeof LAKET !== 'undefined' && LAKET ? LAKET.mimoName() : 'Mimo');
  const fillM = s => (typeof LAKET !== 'undefined' && LAKET ? LAKET.fillMimo(s, lang()) : String(s || '').replace(/\{mimo\}/g, 'Mimo'));
  const lineOf = (TAB, key) => { const T = TAB[key] || {}, l = lang(); return [fillM(T[l] || T.en || ''), String((T['en_' + l] || T.en) || '').replace(/\{mimo\}/g, mimoName())]; };
  const teach = k => { try { if (typeof LAKET !== 'undefined' && LAKET) LAKET.teach(k); } catch (e) { /* */ } };
  const RANK = 'SABCD';
  const LETTERS = { past: [], future: [] };
  function letter(w) { const L0 = LETTERS[w] || []; if (!L0.length) return 'B'; const avg = L0.reduce((a, x) => a + RANK.indexOf(x), 0) / L0.length; return RANK[Math.max(0, Math.min(4, Math.round(avg)))]; }
  const playSong = name => { try { if (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(name)) Sound.setSong(name); } catch (e) { /* */ } };
  const isTense = (r, ts) => !!(r && r.clauses && r.clauses.some(c => c.tb && ts.includes(c.tb.tense)));

  // ------------------------------------------------------------ the crown (the king is a frog like his guards, but for this)
  function crownMesh(s = 1) {
    const g = new THREE.Group(), k = PAST.API.Kit(), KG = PAST.API.KG;
    k.add(KG.cyl, 0, 0, 0, 0.2, 0.12, 0.2, '#f2c14e', { ink: 0.008 });
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; k.add(KG.cone4, Math.cos(a) * 0.15, 0.12, Math.sin(a) * 0.15, 0.055, 0.14, 0.055, '#f2c14e', { ink: 0.006 }); }
    k.add(KG.ball6, 0, 0.02, 0.19, 0.04, 0.04, 0.04, '#e0503f', { ink: 0 }); k.build(g); g.scale.setScalar(s); return g;
  }
  // the Gray Toad's model: a big frog, gone gray and lumpy (its own materials, so other frogs keep their color)
  // (pale: the battle names foes by color, and the Gray Toad is built on a white frog, «el blanco», so it reads gray-white)
  const GRAY = new THREE.Color('#c9c7d2');
  function grayModel(h) {
    h.root.traverse(o => { if (o.isMesh && o.material && o.material.color && !o.material.isLineBasicMaterial) { const m = o.material.clone(); const l = m.color.r * 0.3 + m.color.g * 0.55 + m.color.b * 0.15; m.color.setRGB(l, l, l * 1.06).lerp(GRAY, 0.5); o.material = m; } });
    return h;
  }

  // ------------------------------------------------------------ the battle's hooks: species, models, labels, the bestiary
  let hooked = false;
  function species() {
    const SP = _ && typeof LFTXT !== 'undefined' ? LFTXT.SPECIES : null;
    if (SP) for (const [lg, sp] of Object.entries(SP)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species.gray_toad) { Lg.species.gray_toad = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
  }
  function hook() {
    species();
    if (!_ || hooked) return; hooked = true;
    const M = _.M;
    if (M && !M.lkHooked) {
      M.lkHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (String(k || '') === 'gray_toad' ? 'gray_toad' : k0(k));
      M.build = o => {
        if (o && o.kind === 'gray_toad') { const h = grayModel(b0(Object.assign({}, o, { kind: 'frog', size: 'big', color: 'white' }))); h.kind = 'gray_toad'; return h; }
        return b0(o);
      };
      M.pose = (h, F, t, dt) => { if (h && h.kind === 'gray_toad') { h.kind = 'frog'; try { return p0(h, F, t, dt); } finally { h.kind = 'gray_toad'; } } return p0(h, F, t, dt); };
      M.brighten = (h, k) => { if (h && h.kind === 'gray_toad') return undefined; return br0(h, k); };
    }
    const U = _.UI;
    if (U && U.label && !U.lkHooked) { U.lkHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && (f.lkKing || f.species === 'gray_toad') ? bossLabel(f) : html); }; }
    if (_.RW && _.RW.LORE) {
      if (typeof LPTXT !== 'undefined' && !_.RW.LORE['boss:frog_king']) _.RW.LORE['boss:frog_king'] = LPTXT.LORE;
      if (typeof LFTXT !== 'undefined' && !_.RW.LORE['boss:gray_toad']) _.RW.LORE['boss:gray_toad'] = LFTXT.LORE;
    }
    if (_.RW && _.RW.KIND_EN) { _.RW.KIND_EN.gray_toad = 'the Gray Toad'; _.RW.KIND_EN.frog_king = 'the Frog King'; }
    if (_.UI && _.UI.ICON) {
      if (!_.UI.ICON.frog_king) _.UI.ICON.frog_king = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse cx="32" cy="42" rx="20" ry="14" fill="#5aa04a" stroke="#2b2235" stroke-width="3"/><circle cx="23" cy="30" r="6" fill="#fff" stroke="#2b2235" stroke-width="2.5"/><circle cx="41" cy="30" r="6" fill="#fff" stroke="#2b2235" stroke-width="2.5"/><path d="M20 20 L24 10 L32 18 L40 10 L44 20 Z" fill="#f2c14e" stroke="#2b2235" stroke-width="2.5"/></svg>';
      if (!_.UI.ICON.gray_toad) _.UI.ICON.gray_toad = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse cx="32" cy="40" rx="24" ry="16" fill="#8f8c98" stroke="#2b2235" stroke-width="3"/><circle cx="21" cy="27" r="6" fill="#d8d6e0" stroke="#2b2235" stroke-width="2.5"/><circle cx="43" cy="27" r="6" fill="#d8d6e0" stroke="#2b2235" stroke-width="2.5"/><path d="M20 46 Q32 52 44 46" fill="none" stroke="#2b2235" stroke-width="2.5"/></svg>';
    }
    _.plugins = _.plugins || {}; _.plugins.frog_king = PK; _.plugins.gray_toad = PT;
    try { if (typeof BFX !== 'undefined' && BFX.VOICES) { if (!BFX.VOICES.frog_king) BFX.VOICES.frog_king = { m: 50, vow: ['o', 'a', 'o'], len: 0.11, gap: 0.04 }; if (!BFX.VOICES.gray_toad) BFX.VOICES.gray_toad = { m: 38, vow: ['o', 'u', 'o'], len: 0.18, gap: 0.07 }; } } catch (e) { /* (no battle sounds) */ }
    // predictions that come true, for the Gray Toad's count
    try { const TB = _.tense; if (TB && TB.on && !TB.lkHooked) { TB.lkHooked = true; TB.on('predict', (f, right) => { if (FXT && f === FXT.f && right) FXT.rightTurn = FXT.turnNo; }); } } catch (e) { /* */ }
  }
  function bossLabel(f) {
    const l = lang(), king = !!f.lkKing, N = king ? LPTXT.NAMES.boss : LFTXT.NAMES.boss;
    const name = isC() && typeof CJK !== 'undefined' ? CJK.html(N[l] || N.en, { lang: l }) : esc(N[l] || N.en);
    const FX = king ? FXK : FXT, p2 = FX && FX.phase === 2, left = FX ? Math.max(0, 3 - FX.hits) : 3, max = king ? 3 : 2;
    return `<div class="bt-chips"><span class="bt-chip name">${king ? '👑 ' : ''}${name}</span></div><div class="bt-hpbar"><i style="width:${Math.round(100 * (p2 ? (max - FX.answered) / max : left / 3))}%"></i><span>${p2 ? '?' : (king ? '👑 ' : '🌫 ') + left}</span></div>`;
  }
  // an answer in the box, graded as yours (not a command): MOLT.grade with the world's task
  async function answerAsk(K, T0, tips) {
    const Pp = _ && _.P; if (!Pp) return null;
    const parse0 = Pp.parse, lg = lang(); let tip = null;
    Pp.parse = function (text, ctx) {
      const g = MOLT.grade(T0, text, lg, tips);
      if (g.ok) return { ok: true, kind: 'answer', raw: text, grade: g, clauses: [], untaught: [], previewHtml: '<b>Your answer</b>' };
      tip = (g.kind === 'pres' || g.kind === 'past' || g.kind === 'person') && g.why ? String(g.why).replace(/«([^»]*)»/g, (m, x) => '«' + MOLT.plainT(x) + '»') : null;
      const r0 = parse0.call(this, text, ctx);
      // a wrong tense the grader knows comes back to the fight with its tip, instead of Mimo's «¿…?»
      if (tip && (!r0 || !r0.ok)) return { ok: true, kind: 'miss', raw: text, grade: g, clauses: [], untaught: [], previewHtml: '' };
      return r0;
    };
    try {
      const frame = MOLT.plainT(fillM((T0.frame || {})[lg] || '')), chips = ((T0.chips || {})[lg] || []).map(([x, e]) => `${MOLT.plainT(x)} (${e})`).join(' · ');
      const r = await K.askOrFlee('command', { hint: `«${frame}» · ___ = ${chips}` });
      if (r && r.kind !== 'answer' && tip) r.tip = tip;
      return r;
    } finally { Pp.parse = parse0; }
  }

  // ------------------------------------------------------------ the Frog King (the Past)
  let FXK = null;
  const fk = key => lineOf(LPTXT.FIGHT, key);
  const sayK = (K, st0, key, dur, cls = 'foe shout boss') => { teach('f.' + key); const [t, en] = fk(key); K.say(st0, t, { cls, en, dur }); };
  const PK = {
    setup(K) {
      const { G: BG } = K, frogs = BG.foes.filter(x => x.species === 'frog'); if (frogs.length < 1) { FXK = null; return; }
      const king = frogs[Math.min(1, frogs.length - 1)];
      FXK = { king, hits: 0, phase: 1, turn: 0, answered: 0, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      king.isBoss = true; king.lkKing = true; LETTERS.past = [];
      try { const h = king.h, a = h && h.anchors && (h.anchors.head || h.anchors.top); if (a && a.add) { const c = crownMesh(1.2); c.position.set(0, 0.12, 0); a.add(c); king.crown = c; } } catch (e) { /* (no crown: it still has the label) */ }
      playSong('boss_lk_king');
    },
    floor: f => (f && f.lkKing ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXK) return 'flee';
      const f = FXK.king, TAC = _ && _.tac, api = _ && _.api;
      BG.winLine = null;
      for (const x of BG.foes) { x.x = x.hx; x.z = x.hz; x.hidden = false; }      // (all three on their pads from the start)
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 11 });
      sayK(K, f, 'intro', 3.2); K.emit('boss', { foe: f });
      await K.wait(2.8);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXK.phase === 1) {
          if (FXK.turn === 0) { sayK(K, FXK.coachSt, 'coach', 4.2, 'coach'); await K.wait(3.2); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[lkboss] tac turn', e); } }
          const r = await K.askOrFlee('command');
          const past = isTense(r, ['pret', 'impf']), onKing = !!(r && r.clauses && r.clauses.some(c => c.target === f));
          await K.perform(r);
          FXK.turn++;
          if (past && onKing) { FXK.hits++; ST.star(ST.worldOf(f, 'head'), '#ffe08a', 1.1); K.emit('knockdown'); K.refreshLabels(); sayK(K, f, 'hit', 1.8); await K.wait(1.0); }
          else if (past) { sayK(K, FXK.coachSt, 'wrong', 2.6, 'coach'); await K.wait(1.4); }
          else { sayK(K, FXK.coachSt, 'now', 2.6, 'coach'); await K.wait(1.4); }
          if (FXK.hits >= 3) { await toSulk(K); continue; }
          await frogsTurn(K);
          if (api && api.frogsHop && BG.foes.filter(x => x.species === 'frog' && x.alive && !x.gone).length >= 2) { sayK(K, f, 'hop', 1.6, 'foe boss'); try { await api.frogsHop(); } catch (e) { /* */ } }
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[lkboss] tac after', e); } }
        } else {
          const keys = ['noise', 'said', 'brought'], T0 = LPTXT.BOSSQ[keys[FXK.answered]];
          const r = await answerAsk(K, T0, LPTXT.TIPS_KING);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.past.push(L0); UI.toast(`${L0} · ${r.grade.why}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXK.answered++; K.refreshLabels();
            if (FXK.answered >= 3) { await giveUp(K); return 'win'; }
            sayK(K, f, 'sulk', 1.6, 'foe boss'); await K.wait(1.2);
            sayK(K, f, 'q' + (FXK.answered + 1), 3.4); await K.wait(2.8);
          } else {
            const [t, en] = fk('answer'); K.say(FXK.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.6 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXK && FXK.phase === 1) await frogsTurn(K); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  // the frogs' turn: one or two of them leap at you (never your last heart)
  async function frogsTurn(K) {
    const { G: BG } = K;
    const list = BG.foes.filter(x => x.alive && !x.gone && !x.calmed).sort(() => Math.random() - 0.5).slice(0, 2);
    for (const x of list) {
      if (BG.hearts <= 1) break;
      try { await K.foeAttack(x); } catch (e) { if (e === K.FLEE) throw e; }
      if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
      await K.wait(0.1);
    }
  }
  async function toSulk(K) {
    const { G: BG, A: AC, ST } = K, f = FXK.king;
    FXK.phase = 2; K.refreshLabels();
    // the guards splash off their pads: it's just him now
    for (const x of BG.foes) if (x !== f && x.alive) { x.alive = false; x.gone = true; x.hp = 0; try { ST.splash(x.x, x.z, 0.6); } catch (e) { /* */ } }
    K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); ST.shake(0.25, 0.3); Sound.play('croak');
    await K.wait(0.8);
    sayK(K, f, 'phase2', 3.4); await K.wait(2.8);
    sayK(K, f, 'q1', 3.4); await K.wait(2.6);
    sayK(K, FXK.coachSt, 'answer', 3.2, 'coach'); await K.wait(1.8);
  }
  async function giveUp(K) {
    const { A: AC, ST } = K, f = FXK.king;
    sayK(K, f, 'win', 5.0); Sound.play('chime'); ST.shot('focus', AC.mimo, f, { up: 0.8, dist: 9 });
    await K.wait(3.4);
    if (f.crown) f.crown.visible = false;
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the Gray Toad (the Future)
  let FXT = null;
  const ft = key => lineOf(LFTXT.FIGHT, key);
  const sayT = (K, st0, key, dur, cls = 'foe shout boss') => { teach('f.' + key); const [t, en] = ft(key); K.say(st0, t, { cls, en, dur }); };
  const PT = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'gray_toad'); if (!f) { FXT = null; return; }
      FXT = { f, hits: 0, phase: 1, turn: 0, turnNo: 0, rightTurn: -1, answered: 0, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.future = [];
      playSong('boss_lk_toad');
    },
    floor: f => (f && f.species === 'gray_toad' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXT) return 'flee';
      const f = FXT.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 12 });
      sayT(K, f, 'intro', 3.6); K.emit('boss', { foe: f });
      await K.wait(3.0);
      for (;;) {
        BG.turn++; FXT.turnNo = BG.turn; K.refreshLabels();
        if (FXT.phase === 1) {
          if (FXT.turn === 0) { sayT(K, FXT.coachSt, 'coach', 4.4, 'coach'); await K.wait(3.4); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[lkboss] tac turn', e); } }
          const r = await K.askOrFlee('command');
          const fut = isTense(r, ['fut', 'cond']), pred = !!(r && r.patterns && r.patterns.includes('predict'));
          await K.perform(r);
          FXT.turn++;
          if (fut) { FXT.hits++; Sound.play('poof'); ST.star(ST.worldOf(f, 'mid'), '#d8d4e6', 1.2); K.emit('knockdown'); K.refreshLabels(); sayT(K, f, 'plan', 1.8, 'foe boss'); await K.wait(1.0); }
          else if (!pred) { sayT(K, FXT.coachSt, 'now', 2.6, 'coach'); await K.wait(1.4); }
          if (FXT.hits >= 3) { await toPromise(K); continue; }
          if (BG.hearts > 1) { try { await K.foeAttack(f); } catch (e) { if (e === K.FLEE) throw e; } }
          if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
          if (FXT.rightTurn === BG.turn) { FXT.hits++; K.refreshLabels(); sayT(K, f, 'missed', 2.0, 'foe boss'); await K.wait(1.0); if (FXT.hits >= 3) { await toPromise(K); continue; } }
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[lkboss] tac after', e); } }
        } else {
          const keys = ['come', 'cross'], T0 = LFTXT.BOSSQ[keys[FXT.answered]];
          const r = await answerAsk(K, T0, LFTXT.TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.future.push(L0); UI.toast(`${L0} · ${r.grade.why}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXT.answered++; K.refreshLabels();
            if (FXT.answered >= 2) { await stops(K); return 'win'; }
            sayT(K, f, 'shrink', 2.4); await K.wait(1.8);
            sayT(K, f, 'd2', 3.4); await K.wait(2.6);
          } else {
            const [t, en] = ft('promise'); K.say(FXT.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.6 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXT && FXT.phase === 1 && K.G.hearts > 1) await K.foeAttack(FXT.f); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function toPromise(K) {
    const { A: AC, ST } = K, f = FXT.f;
    FXT.phase = 2; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 9 }); ST.shake(0.3, 0.35); Sound.play('croak');
    await K.wait(1.0);
    sayT(K, f, 'phase2', 3.6); await K.wait(3.0);
    sayT(K, f, 'd1', 3.4); await K.wait(2.6);
    sayT(K, FXT.coachSt, 'promise', 3.4, 'coach'); await K.wait(2.0);
  }
  async function stops(K) {
    const { A: AC, ST } = K, f = FXT.f;
    sayT(K, f, 'win', 4.6); Sound.play('chime'); ST.shot('focus', AC.mimo, f, { up: 0.8, dist: 9 });
    await K.wait(3.2);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the fights (through TIME.fight: the world's tense, its realm)
  async function fightKing() {
    hook();
    return TIME.fight({ boss: 'frog_king', foes: [{ kind: 'frog', color: 'green', size: 'small' }, { kind: 'frog', color: 'green', size: 'small' }, { kind: 'frog', color: 'green', size: 'small' }],
      place: { x: -200, z: -137, biome: 'lake' }, tb: { scene: () => false } });
  }
  async function fightToad() {
    hook();
    return TIME.fight({ boss: 'gray_toad', foes: [{ kind: 'gray_toad', color: 'white', size: 'big', giant: 1.5, hp: 40 }], place: { x: -200, z: -137, biome: 'lake' }, tb: {} });
  }
  try { hook(); } catch (e) { console.error('[lkboss] hooks', e); }
  return { init: () => { try { hook(); } catch (e) { console.error('[lkboss] hooks', e); } }, hook, fightKing, fightToad, letter, PK, PT,
    get FXK() { return FXK; }, get FXT() { return FXT; } };
})();
