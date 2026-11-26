'use strict';
// Molinar's two time bosses (DESIGN.md 18.6 "T1c"): plug-ins on battle/flow.js (BATTLE._.plugins), fought through TIME.fight so
// the world's tense rules apply (battle/timebattle.js: the Past's commands are memories, the Future's are plans).
//   'armadillo_young', the first armadillo, young and silly (the Great Mill being built, long ago): it rolls about, curled up.
//     Phase 1: commands told as memories land («{mimo} saltó…»; a push told as a memory flips it onto its back: two at once);
//     the present only confuses {mimo}. Three and it's dizzy on its back, giggling, and it asks YOU silly questions about what you
//     did («¿Tú me empujaste?», «¿Subiste hasta aquí?»): answer about yourself, in the past (MPTXT.TASKS pushed / cameUp). It gives
//     back the shiny thing it found: Elio's echo.
//   'gray_miller', the Gray Miller (the silent Great Mill, tomorrow): a gray figure at a gray millstone, grinding words to dust.
//     Phase 1: plans for {mimo} (they land next turn) burst his three gray sacks; he throws gray flour (dodge). Phase 2: hits
//     don't stop the stone: promise what the town will do («El pueblo hablará», «Mañana todos molerán trigo»).
// Each has its own song (molinar_time_music.js: set as the fight starts), bestiary line, icon and voice.
//   MOLBOSS.fightArmadillo() · MOLBOSS.fightMiller() · MOLBOSS.letter('past' | 'future') · MOLBOSS.millerModel() / poseMiller()
const MOLBOSS = (() => {
  const BT = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = BT && BT._;
  const lang = () => (typeof MOLT !== 'undefined' && MOLT ? MOLT.lang() : 'es');
  const isC = () => lang() === 'zh' || lang() === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mimoName = () => (typeof MOLT !== 'undefined' && MOLT ? MOLT.mimoName() : 'Mimo');
  const fillM = s => (typeof MOLT !== 'undefined' && MOLT ? MOLT.fillMimo(s, lang()) : String(s || '').replace(/\{mimo\}/g, 'Mimo'));
  const lineOf = (TAB, key) => { const T = TAB[key] || {}, l = lang(); return [fillM(T[l] || T.en || ''), String(T.en || '').replace(/\{mimo\}/g, mimoName())]; };
  const RANK = 'SABCD';
  const LETTERS = { past: [], future: [] };
  function letter(w) { const L0 = LETTERS[w] || []; if (!L0.length) return 'B'; const avg = L0.reduce((a, x) => a + RANK.indexOf(x), 0) / L0.length; return RANK[Math.max(0, Math.min(4, Math.round(avg)))]; }
  const playSong = name => { try { if (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(name)) Sound.setSong(name); } catch (e) { /* */ } };
  const isTense = (r, ts) => !!(r && r.clauses && r.clauses.some(c => c.tb && ts.includes(c.tb.tense)));

  // ------------------------------------------------------------ the Gray Miller's model (the fight's, and the room's in the mill)
  function millerModel() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const inner = new THREE.Group(); body.add(inner);
    const look = { skin: '#9a96a6', hair: '#6f6b7a', hairdo: 'bald', beard: true, hair2: '#8a8696', dress: '#7d7989', apron: '#a9a6b4', hat: 'flat', hatColor: '#5f5b6b' };
    const { k, top } = PAST.API.personKit(look); k.build(inner); inner.scale.setScalar(1.3);
    // his stone, beside him, and three gray sacks of word-dust
    const stone = new THREE.Group(); stone.position.set(1.5, 0, 0.1); root.add(stone);
    const ks = PAST.API.Kit(), KG = PAST.API.KG;
    ks.add(KG.cyl, 0, 0.32, 0, 1.0, 0.64, 1.0, '#8f8c98').add(KG.cyl, 0, 0.85, 0, 0.9, 0.36, 0.9, '#a09ca8').add(KG.cyl, 0, 0.88, 0, 0.18, 0.4, 0.18, '#6f6c7a', { ink: 0 }).box(0.7, 1.2, 0, 0.1, 0.7, 0.1, '#5a5662'); ks.build(stone);
    const runner = stone.children.slice();      // (the whole stone group turns)
    const sacks = [[-1.1, 0.7], [-0.4, -1.1], [0.9, -1.0]].map(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 0, z); const kk = PAST.API.Kit(); kk.add(KG.sphere, 0, 0.42, 0, 0.42, 0.42, 0.4, '#8e8a96', { ink: 0.014 }).add(KG.sphere, 0, 0.86, 0, 0.16, 0.12, 0.16, '#7a7684', { ink: 0.008 }); kk.build(g); root.add(g); return g; });
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#b8b4c8', transparent: true, opacity: 0.25, depthWrite: false })); gl.scale.setScalar(4); gl.position.y = 1.2; root.add(gl);
    const anchors = {};
    [['top', [0, 2.9, 0]], ['mid', [0, 1.2, 0.4]], ['head', [0, 1.9, 0.45]], ['face', [0, 1.75, 0.6]], ['feet', [0, 0.05, 0]]].forEach(([n, p]) => { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); anchors[n] = o; });
    void runner; void top;
    return { root, body, inner, stone, sacks, gl, anchors, kind: 'gray_miller', scale: 1, radius: 1.1, height: 2.6, parts: [], labelH: 3.2, hover: 0, L: { burst: 0, grind: 1 } };
  }
  function poseMiller(h, F, t, dt) {
    const L0 = h.L, ph2 = FXM && FXM.phase === 2;
    h.stone.rotation.y += (dt || 0.016) * (ph2 ? 2.2 : 1.1) * (FXM && FXM.slow ? Math.max(0.1, 1 - FXM.slow * 0.45) : 1);
    h.body.position.y = Math.sin(t * 1.6) * 0.04;
    h.inner.rotation.y = Math.sin(t * 2.2) * 0.25;              // (he leans into the grinding)
    h.inner.rotation.z = Math.sin(t * 1.1) * 0.04;
    const hits = FXM ? FXM.hits : 0;
    h.sacks.forEach((s, i) => { s.visible = i >= hits; });
    h.gl.material.opacity = 0.2 + 0.1 * Math.sin(t * 2);
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
    void L0;
  }

  // ------------------------------------------------------------ the battle's hooks: species, models, labels, the bestiary
  let hooked = false;
  function hook() {
    if (!_ || hooked) return; hooked = true;
    const SP = { armadillo_young: typeof MPTXT !== 'undefined' ? MPTXT.SPECIES : null, gray_miller: typeof MFTXT !== 'undefined' ? MFTXT.SPECIES : null };
    for (const [id, table] of Object.entries(SP)) if (table) for (const [lg, sp] of Object.entries(table)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species[id]) { Lg.species[id] = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
    const M = _.M;
    if (M && !M.molHooked) {
      M.molHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (String(k || '') === 'armadillo_young' ? 'armadillo_young' : String(k || '') === 'gray_miller' ? 'gray_miller' : k0(k));
      M.build = o => {
        if (o && o.kind === 'gray_miller') return millerModel();
        if (o && o.kind === 'armadillo_young') { const h = b0(Object.assign({}, o, { kind: 'armadillo', size: 'small' })); h.kind = 'armadillo_young'; return h; }
        return b0(o);
      };
      M.pose = (h, F, t, dt) => {
        if (h && h.kind === 'gray_miller') return poseMiller(h, F, t, dt);
        if (h && h.kind === 'armadillo_young') { h.kind = 'armadillo'; try { return p0(h, F, t, dt); } finally { h.kind = 'armadillo_young'; } }
        return p0(h, F, t, dt);
      };
      M.brighten = (h, k) => {
        if (h && h.kind === 'gray_miller') return undefined;
        if (h && h.kind === 'armadillo_young') { h.kind = 'armadillo'; try { return br0(h, k); } finally { h.kind = 'armadillo_young'; } }
        return br0(h, k);
      };
    }
    const U = _.UI;
    if (U && U.label && !U.molHooked) { U.molHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && (f.species === 'armadillo_young' || f.species === 'gray_miller') ? bossLabel(f) : html); }; }
    if (_.RW && _.RW.LORE) {
      if (typeof MPTXT !== 'undefined' && !_.RW.LORE['boss:armadillo_young']) _.RW.LORE['boss:armadillo_young'] = MPTXT.LORE;
      if (typeof MFTXT !== 'undefined' && !_.RW.LORE['boss:gray_miller']) _.RW.LORE['boss:gray_miller'] = MFTXT.LORE;
    }
    if (_.RW && _.RW.KIND_EN) { _.RW.KIND_EN.armadillo_young = 'the first armadillo'; _.RW.KIND_EN.gray_miller = 'the Gray Miller'; }
    if (_.UI && _.UI.ICON) {
      if (!_.UI.ICON.armadillo_young) _.UI.ICON.armadillo_young = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="36" r="20" fill="#7fae5a" stroke="#2b2235" stroke-width="3"/><path d="M14 36 Q32 14 50 36" fill="none" stroke="#2b2235" stroke-width="2.5"/><path d="M20 44 Q32 30 44 44" fill="none" stroke="#2b2235" stroke-width="2"/><circle cx="46" cy="22" r="6" fill="#f2d48a" stroke="#2b2235" stroke-width="2"/><circle cx="47" cy="21" r="1.6" fill="#2b2235"/></svg>';
      if (!_.UI.ICON.gray_miller) _.UI.ICON.gray_miller = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse cx="44" cy="46" rx="14" ry="6" fill="#a09ca8" stroke="#2b2235" stroke-width="3"/><circle cx="24" cy="22" r="9" fill="#9a96a6" stroke="#2b2235" stroke-width="3"/><path d="M12 56 Q14 34 24 32 Q34 34 36 56 Z" fill="#7d7989" stroke="#2b2235" stroke-width="3"/><rect x="15" y="11" width="18" height="5" rx="2" fill="#5f5b6b"/></svg>';
    }
    _.plugins = _.plugins || {}; _.plugins.armadillo_young = PA; _.plugins.gray_miller = PM;
    try { if (typeof BFX !== 'undefined' && BFX.VOICES) { if (!BFX.VOICES.armadillo_young) BFX.VOICES.armadillo_young = { m: 79, vow: ['i', 'i', 'e'], len: 0.06, gap: 0.03 }; if (!BFX.VOICES.gray_miller) BFX.VOICES.gray_miller = { m: 43, vow: ['o', 'u', 'o'], len: 0.16, gap: 0.06 }; } } catch (e) { /* (no battle sounds) */ }
  }
  function bossLabel(f) {
    const l = lang(), young = f.species === 'armadillo_young', N = young ? MPTXT.NAMES.boss : MFTXT.NAMES.boss;
    const name = isC() && typeof CJK !== 'undefined' ? CJK.html(N[l] || N.en, { lang: l }) : esc(N[l] || N.en);
    const FX = young ? FXA : FXM, left = FX ? Math.max(0, 3 - FX.hits) : 3;
    const icon = young ? '🌀' : '🌾', p2 = FX && FX.phase === 2;
    return `<div class="bt-chips"><span class="bt-chip name">${name}</span></div><div class="bt-hpbar"><i style="width:${Math.round(100 * (p2 ? (2 - FX.answered) / 2 : left / 3))}%"></i><span>${p2 ? (young ? '?' : '…') : icon + ' ' + left}</span></div>`;
  }
  const BTX = () => _;
  // an answer in the box, graded as yours (not a command): MOLT.grade with the world's task
  async function answerAsk(K, T0, tips, w) {
    const Pp = _ && _.P; if (!Pp) return null;
    const parse0 = Pp.parse, lg = lang(); let tip = null;
    Pp.parse = function (text, ctx) {
      const g = MOLT.grade(T0, text, lg, tips);
      if (g.ok) return { ok: true, kind: 'answer', raw: text, grade: g, clauses: [], untaught: [], previewHtml: '<b>Your answer</b>' };
      tip = (g.kind === 'pres' || g.kind === 'past') && g.why ? g.why : null;
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

  // ------------------------------------------------------------ the first armadillo (the Past)
  let FXA = null;
  const fa = key => lineOf(MPTXT.FIGHT, key);
  const sayA = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fa(key); K.say(st0, t, { cls, en, dur }); };
  const PA = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'armadillo_young'); if (!f) { FXA = null; return; }
      FXA = { f, hits: 0, phase: 1, turn: 0, answered: 0, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; f.curl = 1; LETTERS.past = [];
      playSong('boss_mol_armadillo');
    },
    floor: f => (f && f.species === 'armadillo_young' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXA) return 'flee';
      const f = FXA.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 11 });
      sayA(K, f, 'intro', 2.8); K.emit('boss', { foe: f });
      await K.wait(2.6);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXA.phase === 1) {
          if (FXA.turn === 0) { sayA(K, FXA.coachSt, 'coach', 3.4, 'coach'); await K.wait(2.8); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[molboss] tac turn', e); } }
          const r = await K.askOrFlee('command');
          const past = isTense(r, ['pret', 'impf']), push = past && r.clauses.some(c => c.verb === 'push');
          await K.perform(r);
          FXA.turn++;
          if (past) {
            FXA.hits = Math.min(3, FXA.hits + (push ? 2 : 1)); ST.star(ST.worldOf(f, 'head'), '#fff3a0', 1.1); K.emit('knockdown'); K.refreshLabels();
            if (push) { sayA(K, FXA.coachSt, 'flip', 2.2, 'coach'); await K.along(0.5, u => { f.curl = 1 - u; f.flip = u; }); await K.wait(0.7); }
          } else { sayA(K, FXA.coachSt, 'now', 2.6, 'coach'); await K.wait(1.4); }
          if (FXA.hits >= 3) { await toDizzy(K); continue; }
          if (f.flip > 0.5) await K.along(0.4, u => { f.flip = 1 - u; f.curl = u; });
          await rollAttack(K);
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[molboss] tac after', e); } }
        } else {
          const T0 = FXA.answered === 0 ? MPTXT.TASKS.pushed : MPTXT.TASKS.cameUp;
          const r = await answerAsk(K, T0, MPTXT.TIPS, 'past');
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.past.push(L0); UI.toast(`${L0} · ${r.grade.why}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXA.answered++; K.refreshLabels();
            if (FXA.answered >= 2) { await giveUp(K); return 'win'; }
            sayA(K, f, 'giggle', 1.6, 'foe boss'); await K.wait(1.3);
            sayA(K, f, 'q2', 3.2); await K.wait(2.6);
          } else {
            const [t, en] = fa('answer'); K.say(FXA.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.4 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXA && FXA.phase === 1) await rollAttack(K); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function rollAttack(K) {
    const { G: BG, ST } = K, f = FXA.f;
    if (BG.hearts <= 1) { sayA(K, f, 'giggle', 1.4, 'foe'); await K.wait(1.0); return; }
    sayA(K, f, 'roll', 1.3, 'foe boss'); f.rolling = true;
    try { await K.foeAttack(f); } finally { f.rolling = false; }
    if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
    void ST;
  }
  async function toDizzy(K) {
    const { A: AC, ST } = K, f = FXA.f;
    FXA.phase = 2; K.refreshLabels();
    await K.along(0.5, u => { f.curl = 1 - u; f.flip = u; });
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); ST.shake(0.25, 0.3); Sound.play('pip');
    await K.wait(0.8);
    sayA(K, f, 'dizzy', 3.6); await K.wait(3.0);
    sayA(K, FXA.coachSt, 'answer', 3.2, 'coach'); await K.wait(1.8);
  }
  async function giveUp(K) {
    const { A: AC, ST } = K, f = FXA.f;
    sayA(K, f, 'win', 4.2); Sound.play('chime'); ST.shot('focus', AC.mimo, f, { up: 0.8, dist: 9 });
    await K.along(0.6, u => { f.flip = 1 - u; f.curl = 0; });
    await K.wait(2.6);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the Gray Miller (the Future)
  let FXM = null;
  const fm = key => lineOf(MFTXT.FIGHT, key);
  const sayM = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fm(key); K.say(st0, t, { cls, en, dur }); };
  const PM = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'gray_miller'); if (!f) { FXM = null; return; }
      FXM = { f, hits: 0, phase: 1, turn: 0, answered: 0, slow: 0, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.future = [];
      playSong('boss_mol_miller');
    },
    floor: f => (f && f.species === 'gray_miller' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXM) return 'flee';
      const f = FXM.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 11 });
      sayM(K, f, 'intro', 3.4); K.emit('boss', { foe: f });
      await K.wait(3.0);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXM.phase === 1) {
          if (FXM.turn === 0) { sayM(K, FXM.coachSt, 'coach', 3.6, 'coach'); await K.wait(2.8); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[molboss] tac turn', e); } }
          const r = await K.askOrFlee('command');
          const fut = isTense(r, ['fut', 'cond']);
          await K.perform(r);
          FXM.turn++;
          if (fut) { FXM.hits++; Sound.play('poof'); ST.star(ST.worldOf(f, 'mid'), '#d8d4e6', 1.2); K.emit('knockdown'); K.refreshLabels(); sayM(K, f, 'sack', 1.8, 'foe boss'); await K.wait(1.0); }
          else { sayM(K, FXM.coachSt, 'now', 2.6, 'coach'); await K.wait(1.4); }
          if (FXM.hits >= 3) { await toPromise(K); continue; }
          await flourAttack(K);
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[molboss] tac after', e); } }
        } else {
          const T0 = FXM.answered === 0 ? MFTXT.TASKS.town : MFTXT.TASKS.grind;
          const r = await answerAsk(K, T0, MFTXT.TIPS, 'future');
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.future.push(L0); UI.toast(`${L0} · ${r.grade.why}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXM.answered++; FXM.slow = FXM.answered; K.refreshLabels();
            if (FXM.answered >= 2) { await stops(K); return 'win'; }
            sayM(K, f, 'slow', 3.0); await K.wait(2.4);
          } else {
            const [t, en] = fm('promise'); K.say(FXM.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.4 }); await K.wait(2.0);
            await flourAttack(K);
          }
        }
      }
    },
    async foePhase(K) { if (FXM && FXM.phase === 1) await flourAttack(K); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  // his gray flour, thrown at you or {mimo}: where it's coming from (your own dodge words), then «¡Polvo!»; dodge it
  function dustSprite(text) {
    const cv = document.createElement('canvas'), c = cv.getContext('2d'), font = '900 64px "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif';
    c.font = font; cv.width = Math.min(1024, Math.ceil(c.measureText(text).width) + 56); cv.height = 104;
    c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 14; c.strokeStyle = '#d9d6e4'; c.strokeText(text, cv.width / 2, 54); c.fillStyle = '#4a4656'; c.fillText(text, cv.width / 2, 54);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false, depthWrite: false }));
    sp.scale.set(0.55 * cv.width / cv.height, 0.55, 1); sp.renderOrder = 12; return sp;
  }
  async function flourAttack(K) {
    const { G: BG, A: AC, ST } = K, f = FXM.f;
    if (BG.hearts <= 1) { sayM(K, f, 'phase2', 2.2, 'foe'); await K.wait(1.4); return; }
    const high = Math.random() < 0.5, tgt = Math.random() < 0.5 ? AC.mimo : AC.you;
    const dw = BG.L && BG.L.dodgeWords ? BG.L.dodgeWords(BG.tier) : null, [dust, dustEn] = fm('dust');
    const dTxt = isC() && typeof CJK !== 'undefined' ? CJK.plain(dust, { lang: lang() }) : dust, where = (dw && (high ? dw.high : dw.low)) || (high ? '↑' : '↓');
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.7 });
    K.say(f, `${dTxt} … ${where}`, { cls: 'foe shout boss', en: `${dustEn} ${high ? 'up high' : 'down low'}`, dur: K.readTime(dTxt + where) + 2.0 });
    K.emit('shout', { text: dTxt, high, foe: f, boss: true }); K.dodgeHint(true);
    await K.wait(K.readTime(dTxt + where) + 0.15);
    K.emit('windup', { foe: f, high, boss: true });
    const Tm = BG.t + 0.8, key = high ? 'ArrowDown' : 'ArrowUp';
    const tp = K.timingWindow(Tm, key, () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
    const spr = dustSprite(dTxt.replace(/[!！¡]/g, '').trim() || '…'), a = ST.worldOf(f, 'face'), b = ST.worldOf(tgt, high ? 'top' : 'feet');
    ST.prop(spr); spr.position.copy(a);
    await K.along(0.8, u => { spr.position.lerpVectors(a, b, u * 1.06); spr.position.y += Math.sin(u * Math.PI) * (high ? 0.45 : 0.12); spr.material.rotation = Math.sin(u * 12) * 0.15; });
    const grade = await tp;
    ST.dropProp(spr);
    K.dodgeResult(f, tgt, grade, 1, {});
    if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
    await K.wait(0.4);
  }
  async function toPromise(K) {
    const { A: AC, ST } = K, f = FXM.f;
    FXM.phase = 2; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); ST.shake(0.3, 0.35); Sound.play('crunch');
    await K.wait(1.0);
    sayM(K, f, 'phase2', 3.6); await K.wait(3.0);
    sayM(K, FXM.coachSt, 'promise', 3.4, 'coach'); await K.wait(2.0);
  }
  async function stops(K) {
    const { A: AC, ST } = K, f = FXM.f;
    FXM.slow = 3; sayM(K, f, 'win', 4.2); Sound.play('chime'); ST.shot('focus', AC.mimo, f, { up: 0.8, dist: 9 });
    await K.wait(3.0);
    if (f.h && f.h.inner) await K.along(1.2, u => { f.h.inner.scale.setScalar(1.3 * (1 - u * 0.15)); f.h.gl.material.opacity = 0.25 + u * 0.6; });
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the fights (through TIME.fight: the world's tense, its realm)
  async function fightArmadillo() {
    hook();
    return TIME.fight({ boss: 'armadillo_young', foes: [{ kind: 'armadillo_young', color: 'green', size: 'big', giant: 1.2, hp: 40 }], place: { x: 240, z: -176 }, tb: { scene: () => false } });
  }
  async function fightMiller() {
    hook();
    return TIME.fight({ boss: 'gray_miller', foes: [{ kind: 'gray_miller', color: 'white', size: 'big', giant: 1, hp: 40 }], place: { x: 240, z: -176 }, tb: {} });
  }
  try { hook(); } catch (e) { console.error('[molboss] hooks', e); }
  return { init: () => { try { hook(); } catch (e) { console.error('[molboss] hooks', e); } }, hook, fightArmadillo, fightMiller, letter, millerModel, poseMiller, PA, PM,
    get FXA() { return FXA; }, get FXM() { return FXM; } };
})();
