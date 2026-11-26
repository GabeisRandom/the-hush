'use strict';
// The Gray Marsh in battle (DESIGN.md 17.1, region 8; REGIONS.md 4): shadows, «ilumina», Bruno at your side, team orders, and
// the Great Shadow's bestiary page. Loaded after battle/rewards.js and battle_fx.js; needs TEAM (team.js) and MARSH (marsh.js).
//   · Shadows: a foe spec with shadow: true is that kind's shadow: a dark shape with glowing eyes, no colors, its label a «?».
//     Its kind keeps its rules (a moth floats, a crab clangs from the front…), but a hit only lands if you say what it really
//     is: its name («¡Golpea a la polilla!») or one of its parts; otherwise it goes right through (flow.js land → MB.through).
//     Or light them first: «¡Ilumina!» (no target; a flash over the whole field: 1 to everyone, 2 said all together, and every
//     shadow shows what it is, colors and all, for the rest of the fight).
//   · Light: «ilumina / ilumina / leucht», 照亮, 照らして (marsh.js teaches it at the fog), in lang.js's verbs in every language;
//     parser.js reads it like sing / blow / call (no target).
//   · Bruno, the ally: a fight started with coach: { name: 'Bruno', ally: true } has him on the field from the start (the marsh's
//     roamers via story.js roamerBattle, the drowned chapel). Team orders (team.js TEAM.strip, one small parse hook here):
//     «¡Golpeen a la polilla!» (ustedes: Mimo and Bruno, a strike each), «¡Golpeemos a la polilla!» (nosotros: you too: Bruno
//     strikes and you throw a stone). G.stats.team counts them (marsh_chapel.js's drill reads it); a clause it read is marked
//     c.marshTeam ('you' | 'we'; r.marshTeam), a name no other file uses.
//     Hand-over: when the general team-orders mechanic is on (battle/tactics.js skill C: _.tac.on('C') with a k 'C' reader in
//     _.tac.whole, or anything setting BATTLE._.teamOrders), this hook steps aside (it only ever reads «you all» / «let's»
//     forms, and only while an ally is on the field), and so do its frame and tip.
//   · The Great Shadow (boss 'shade', marsh_chapel.js): its bestiary page, lore and drops.
//   MB = BATTLE._.marsh: { label(f), preview(c), through(c, p), scaffolds(foes, keys, tips, verbs), skin(root, on), allyOn(),
//     unshade(f), teamCanon(canon, verb, person, l) } (flow.js calls the first four)
(() => {
  if (typeof BATTLE === 'undefined' || !BATTLE._ || !BATTLE._.LANGS || typeof MARSH === 'undefined') return;
  const _ = BATTLE._, L = _.LANGS;
  const put = (o, k, v) => { if (o && o[k] === undefined) o[k] = v; };
  const lines = (lang, t) => { if (L[lang]) for (const [k, v] of Object.entries(t)) put(L[lang].t, k, v); };

  // ================================================================ the words: «ilumina», frames, tips, lines
  const TIP = {
    shadow: n => `Shadows: dark shapes with no colors. A hit only lands if you say what each one really is: look at its shape and name it (${n}). Or light them all up first, and they show what they are.`,
    light: w => `Light («${w}»): a flash over the whole field. A little for everyone, and every shadow shows what it is, for good.`,
    team: (you, we) => `Bruno fights with you. Tell both of you at once («${you}»: {mimo} and Bruno) or everyone, you too («${we}»).`,
  };
  // Spanish
  put(L.es.verbs, 'light', { show: 'ilumina', forms: ['ilumina', 'ilumine', 'alumbra', 'alumbre', 'ilumínalo', 'ilumínala', 'ilumínalos', 'ilumínalas'], en: 'light' });     // (not «iluminá»: the same letters, so «ilumina» would read as it with a missing accent)
  put(L.es.frames, 'lightT', { text: '¡Ilumina!', pat: 'verb' }); put(L.es.frames, 'shadowT', { text: '¡Golpea ___! (¿qué es?)', pat: 'hit+target' });
  put(L.es.frames, 'teamT', { text: '¡Golpeen ___! · ¡Golpeemos ___!', pat: 'hit+target' });
  put(L.es.tips, 'shadow', TIP.shadow('«¡Golpea a la polilla!»') + ' «¡Ilumina!»'); put(L.es.tips, 'light', TIP.light('ilumina')); put(L.es.tips, 'team', TIP.team('¡Golpeen a…!', '¡Golpeemos a…!'));
  put(L.es, 'shadowWord', 'sombra');
  lines('es', { lighting: ['¡Iluminaaa!', 'Light up!'], shadowThrough: ['¡Ji, ji! ¿Qué soy?', 'Hee hee! What am I?'], unshaded: ['¡Ay! ¡Me viste!', 'Ow! You saw me!'],
    teamYou: ['¡Voy!', 'On it!'], teamWe: ['¡Todos juntos!', 'All together!'], youThrow: ['¡Toma!', 'Take that!'] });
  Object.assign(L.es.gloss, { ilumina: 'light up', iluminaaa: 'light up', sombra: 'shadow', sombras: 'shadows', voy: 'I’m going', juntos: 'together', toma: 'take that', 'qué': 'what', soy: 'I am', viste: 'you saw', ji: 'hee' });
  // Portuguese
  put(L.pt.verbs, 'light', { show: 'ilumina', forms: ['ilumina', 'ilumine', 'acende', 'acenda'], en: 'light' });
  put(L.pt.frames, 'lightT', { text: 'Ilumina!', pat: 'verb' }); put(L.pt.frames, 'shadowT', { text: 'Bate ___! (o que é?)', pat: 'hit+target' });
  put(L.pt.frames, 'teamT', { text: 'Batam ___! · Vamos bater ___!', pat: 'hit+target' });
  put(L.pt.tips, 'shadow', TIP.shadow('«Bate na mariposa!»') + ' «Ilumina!»'); put(L.pt.tips, 'light', TIP.light('ilumina')); put(L.pt.tips, 'team', TIP.team('Batam no…!', 'Vamos bater no…!'));
  put(L.pt, 'shadowWord', 'sombra');
  lines('pt', { lighting: ['Iluminaaa!', 'Light up!'], shadowThrough: ['Hi, hi! O que eu sou?', 'Hee hee! What am I?'], unshaded: ['Ai! Você me viu!', 'Ow! You saw me!'],
    teamYou: ['Já vou!', 'On it!'], teamWe: ['Todos juntos!', 'All together!'], youThrow: ['Toma!', 'Take that!'] });
  Object.assign(L.pt.gloss, { ilumina: 'light up', iluminaaa: 'light up', sombra: 'shadow', sombras: 'shadows', 'já': 'right now', vou: 'I’m going', juntos: 'together', toma: 'take that', viu: 'saw', sou: 'I am' });
  // German
  put(L.de.verbs, 'light', { show: 'leucht', forms: ['leucht', 'leuchte', 'leuchtet'], en: 'light' });
  put(L.de.frames, 'lightT', { text: 'Leucht!', pat: 'verb' }); put(L.de.frames, 'shadowT', { text: 'Schlag ___! (was ist es?)', pat: 'hit+target' });
  put(L.de.frames, 'teamT', { text: 'Schlagt ___! · Schlagen wir ___!', pat: 'hit+target' });
  put(L.de.tips, 'shadow', TIP.shadow('«Schlag die Motte!»') + ' «Leucht!»'); put(L.de.tips, 'light', TIP.light('leucht')); put(L.de.tips, 'team', TIP.team('Schlagt den…!', 'Schlagen wir den…!'));
  put(L.de, 'shadowWord', 'Schatten');
  lines('de', { lighting: ['Leuuucht!', 'Light up!'], shadowThrough: ['Hihi! Was bin ich?', 'Hee hee! What am I?'], unshaded: ['Au! Du hast mich gesehen!', 'Ow! You saw me!'],
    teamYou: ['Bin dabei!', 'On it!'], teamWe: ['Alle zusammen!', 'All together!'], youThrow: ['Da!', 'Take that!'] });
  Object.assign(L.de.gloss, { leucht: 'light up', leuuucht: 'light up', schatten: 'shadow(s)', dabei: 'in (on it)', zusammen: 'together', alle: 'all', gesehen: 'seen', bin: 'am', was: 'what' });
  // Chinese and Japanese
  if (L.zh) {
    put(L.zh.verbs, 'light', { show: '[照亮|zhào liàng]', forms: ['[照亮|zhào liàng]', '[照|zhào]', '[点亮|diǎn liàng]'], en: 'light', cj: [['[照亮|zhào liàng]', 'ok'], ['[照|zhào]', 'ok'], ['[点亮|diǎn liàng]', 'ok', 'result']] });
    if (L.zh.frames) { put(L.zh.frames, 'lightT', { text: '[照亮|zhào liàng] ！', pat: 'verb' }); put(L.zh.frames, 'shadowT', { text: '[打|dǎ] ___ ！ （ [是|shì] [什么|shén me] ？ ）', pat: 'hit+target' }); put(L.zh.frames, 'teamT', { text: '[你们|nǐ men] [打|dǎ] ___ ！ · [我们|wǒ men] [一起|yī qǐ] [打|dǎ] ___ [吧|ba] ！', pat: 'hit+target' }); }
    if (L.zh.tips) { put(L.zh.tips, 'shadow', TIP.shadow('«[打|dǎ] [蛾子|é zi] ！»') + ' «[照亮|zhào liàng] ！»'); put(L.zh.tips, 'light', TIP.light('[照亮|zhào liàng]')); put(L.zh.tips, 'team', TIP.team('[你们|nǐ men] [打|dǎ]…！', '[我们|wǒ men] [一起|yī qǐ] [打|dǎ]… [吧|ba] ！')); }
    put(L.zh, 'shadowWord', '[影子|yǐng zi]');
    lines('zh', { lighting: ['[照亮|zhào liàng] ！', 'Light up!'], shadowThrough: ['[嘻嘻|xī xī] ！ [我|wǒ] [是|shì] [什么|shén me] ？', 'Hee hee! What am I?'], unshaded: ['[哎呀|āi yā] ！ [被|bèi] [你|nǐ] [看见|kàn jiàn] [了|le] ！', 'Ow! You saw me!'],
      teamYou: ['[来|lái] [了|le] ！', 'On it!'], teamWe: ['[大家|dà jiā] [一起|yī qǐ] ！', 'All together!'], youThrow: ['[看|kàn] [招|zhāo] ！', 'Take that!'] });
  }
  if (L.ja) {
    put(L.ja.verbs, 'light', { show: '[照|て]らして', forms: ['[照|て]らして'], en: 'light', cj: [['[照|て]らして', 'te'], ['[照|て]らせ', 'imp'], ['[照|て]らす', 'dict'], ['[照|て]らします', 'masu'], ['[光|ひか]って', 'te']] });
    if (L.ja.frames) { put(L.ja.frames, 'lightT', { text: '[照|て]らして ！', pat: 'verb' }); put(L.ja.frames, 'shadowT', { text: '___ を [打|う]って ！ （ [何|なに] ？ ）', pat: 'hit+target' }); put(L.ja.frames, 'teamT', { text: 'みんな 、 ___ を [打|う]って ！ · ___ を [打|う]とう ！', pat: 'hit+target' }); }
    if (L.ja.tips) { put(L.ja.tips, 'shadow', TIP.shadow('«ガ を [打|う]って ！»') + ' «[照|て]らして ！»'); put(L.ja.tips, 'light', TIP.light('[照|て]らして')); put(L.ja.tips, 'team', TIP.team('みんな 、 … を [打|う]って ！', '… を [打|う]とう ！')); }
    put(L.ja, 'shadowWord', '[影|かげ]');
    lines('ja', { lighting: ['[照|て]らして ！', 'Light up!'], shadowThrough: ['ふふっ ！ [何|なん] だ と [思|おも]う ？', 'Hee hee! What am I?'], unshaded: ['わっ ！ [見|み]つかった ！', 'Ow! You saw me!'],
      teamYou: ['[行|い]きます ！', 'On it!'], teamWe: ['みんな で ！', 'All together!'], youThrow: ['えいっ ！', 'Take that!'] });
  }
  ['es', 'pt', 'de'].forEach(k => { delete L[k].I; });        // (the parser indexes each language once: again, with the new words)
  if (L.zh) delete L.zh.I; if (L.ja) delete L.ja.I;
  if (_.VERB_EN) put(_.VERB_EN, 'light', 'light');
  // the language engine's item (marsh.js registered v.light: one object, so nothing's lost)
  const light = typeof LEX !== 'undefined' && LEX.item('v.light');
  if (light) { light.battle = true; if (_.ITEMS && !_.ITEMS.some(x => x.id === 'v.light')) _.ITEMS.push(light); }
  if (typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource('[照亮|zhào liàng] [照|zhào] [点亮|diǎn liàng] [影子|yǐng zi] [嘻嘻|xī xī] [哎呀|āi yā] [看见|kàn jiàn] [看|kàn] [招|zhāo]'); CJK.addSource('[照|て]らして [照|て]らせ [照|て]らす [影|かげ] [見|み]つかった [行|い]きます えいっ'); } catch (e) { /* optional */ } }

  // ================================================================ the look: a shadow skin (battle models and the overworld's)
  // every felt part goes one dark violet; the ink stays ink; the face's dark bits (eyes, mouth) glow; the little light bits hide
  const SH = { body: new THREE.MeshBasicMaterial({ color: '#2a2440', transparent: true, opacity: 0.93 }), eye: new THREE.MeshBasicMaterial({ color: '#fff3a0' }),
    ink: new THREE.MeshBasicMaterial({ color: '#120e1c', side: THREE.BackSide }) };
  const darkOf = m => { const c = m && m.color; return !!c && c.r * 0.3 + c.g * 0.55 + c.b * 0.15 < 0.3; };
  function skin(root, on) {
    if (!root) return;
    root.traverse(o => {
      if (!o.isMesh && !o.isSprite) return;
      const u = o.userData;
      if (on) {
        if (u.shade0) return;
        const m = o.material; if (!m || Array.isArray(m)) return;
        u.shade0 = m; u.shadeVis = o.visible;
        if (o.isSprite) { o.visible = false; return; }
        if (m.side === THREE.BackSide) o.material = SH.ink;
        else if (m.isMeshBasicMaterial && darkOf(m)) o.material = SH.eye;
        else if (m.isMeshBasicMaterial) o.visible = false;
        else o.material = SH.body;
      } else if (u.shade0) {
        if (u.mat0) u.mat0 = u.shade0; else o.material = u.shade0;     // (stage.js's hit flash keeps the material in mat0 while it's white)
        o.visible = u.shadeVis; u.shade0 = null;
      }
    });
  }
  // the overworld's roamers (main.js foeModel: BATTLE.buildFoe(kind, color, { size, shadow }))
  if (BATTLE.buildFoe) { const bf0 = BATTLE.buildFoe; BATTLE.buildFoe = function (kind, color, o = {}) { const g = bf0.call(this, kind, color, o); if (o && o.shadow) try { skin(g, true); } catch (e) { /* (plain) */ } return g; }; }
  // the battle's foes: skinned as the stage sets them up; the Great Shadow's shapes made big (shade: true)
  if (_.STAGE && _.STAGE.setup) {
    const setup0 = _.STAGE.setup;
    _.STAGE.setup = function (o) {
      const r = setup0.apply(this, arguments);
      try {
        for (const f of (r && r.foes) || []) {
          if (!f.spec || !f.spec.shadow) continue;
          f.lit = false; skin(f.h.root, true);
          if (f.spec.shade) { const k = +f.spec.shade > 1 ? +f.spec.shade : 1.7; f.h.root.scale.multiplyScalar(k); f.h.scale *= k; f.h.radius *= k; f.h.height *= k; f.radius = f.h.radius; f.height = f.h.height; f.isShade = true; }
        }
      } catch (e) { console.warn('[marsh battle] shadows', e); }
      return r;
    };
  }

  // ================================================================ the rules
  const F = () => _.flow;
  const Gb = () => (_.flow ? _.flow.G : null);
  const lang = () => { const G = Gb(); return (G && G.lang) || 'es'; };
  const isShadow = f => !!(f && f.spec && f.spec.shadow && !f.lit);
  // Bruno on the field as an ally
  function allyOn() { const K = F(), G = Gb(); return !!(K && G && G.running && G.opts && G.opts.coach && G.opts.coach.ally && K.A.coach && !K.A.coach.hidden); }
  // the general team-orders mechanic is on (battle/tactics.js skill C, or whoever sets BATTLE._.teamOrders): this file's hook steps aside
  function handOver() {
    if (_.teamOrders) return true;
    const T = _.tac; if (!T || typeof T.on !== 'function') return false;
    try { return !!(T.on('C') && (T.whole || []).some(p => p && p.k === 'C')); } catch (e) { return false; }
  }
  const cjPlain = s => (typeof CJK !== 'undefined' && (lang() === 'zh' || lang() === 'ja') ? CJK.plain(s, { lang: lang() }) : s);
  // what you named: the creature (its noun, known or not) or one of its parts
  const named = (c, f) => !!(c.partKey || (c.words || []).includes('n.' + f.species) || (c.desc && c.desc.noun && c.desc.noun.key === f.species));
  // a team order's sentence back in its team form, for the grade's «right sentence» («¡Golpeen a la polilla!»)
  function teamCanon(canon, verb, person, l) {
    if (!canon || typeof TEAM === 'undefined') return canon;
    const fm = TEAM.forms(verb, l); if (!fm) return canon;
    const s = String(canon);
    if (l === 'zh') return person === 'you' ? '[你们|nǐ men] ' + s : '[我们|wǒ men] [一起|yī qǐ] ' + s.replace(/\s*[!！]\s*$/, '') + ' [吧|ba] ！';
    if (l === 'ja') { if (person === 'you') return 'みんな 、 ' + s; const te = fm.one[0], vol = fm.we[0]; return s.includes(te) ? s.replace(te, vol) : s; }
    const one = fm.one[0], to = (fm[person] || [])[0]; if (!one || !to) return s;
    const i = s.toLowerCase().indexOf(one.toLowerCase()); if (i < 0) return s;
    const was = s.slice(i, i + one.length), cap = was.charAt(0) !== was.charAt(0).toLowerCase();
    return s.slice(0, i) + (cap ? to.charAt(0).toUpperCase() + to.slice(1) : to) + s.slice(i + one.length);
  }
  // The parse hook (small, documented above): a «you all» / «let's» form with Bruno on the field reads as the one form, the clauses
  // marked team; and every clause aimed at a shadow is marked through unless you named what it is.
  if (_.P && _.P.parse) {
    const P = _.P, parse0 = P.parse;
    P.parse = function (text, ctx) {
      let r = null, team = null;
      try {
        if (typeof TEAM !== 'undefined' && allyOn() && !handOver()) {
          const t = TEAM.strip(String(text), lang());
          if (t && (t.person === 'you' || t.person === 'we') && t.text && t.text !== String(text)) {
            const r1 = parse0(t.text, ctx);
            if (r1 && r1.ok && r1.kind === 'command') { r = r1; team = t; }
          }
        }
      } catch (e) { console.warn('[marsh battle] team', e); r = null; team = null; }
      if (!r) r = parse0(text, ctx);
      try {
        if (r && r.ok && r.kind === 'command' && r.clauses) {
          if (team) {
            r.marshTeam = team.person; r.raw = String(text);
            const g = TEAM.read(String(text), lang(), { verb: team.verb });
            for (const c of r.clauses) { c.marshTeam = team.person; if (g.slips && g.slips.length && c.fixes && !c.fixes.includes('spelling')) c.fixes.push('spelling'); }
            if (r.canon) r.canon = teamCanon(r.canon, team.verb, team.person, lang());
          }
          for (const c of r.clauses) { const f = c.target; c.through = !!(f && isShadow(f) && !named(c, f)); }
        }
      } catch (e) { console.warn('[marsh battle] parse', e); }
      return r;
    };
  }

  // ================================================================ the moves: light, and Bruno's strikes
  // a flash: a big glow out of Mimo, sparkles everywhere
  function flash(at, k = 1) {
    const K = F(), ST = K.ST, sc = ST.S.scene; if (!sc) return;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3b0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    sp.position.copy(at); sc.add(sp);
    K.along(0.9, u => { const s = Math.sin(Math.PI * u); sp.scale.setScalar(1 + s * 14 * k); sp.material.opacity = s * 0.9; }).then(() => sc.remove(sp));
    ST.S.fx.sparkle(at.x, at.y, at.z, Math.round(26 * k), ['#fff3a0', '#ffffff', '#ffd166']);
    if (ST.S.arena && ST.S.arena.flash) ST.S.arena.flash();
  }
  const sfx = name => { try { if (typeof BFX !== 'undefined' && BFX.fx) BFX.fx(name); } catch (e) { /* (no sound) */ } };
  // a shadow, lit: its colors come back (for the rest of the fight), its name and color show on its label
  async function unshade(f) {
    const K = F(); if (!isShadow(f)) return;
    f.lit = true; skin(f.h.root, false);
    const p = K.ST.worldOf(f, 'top');
    K.ST.S.fx.sparkle(p.x, p.y, p.z, 14, ['#fff3a0', '#ffffff']);
    K.UI.pop(p.clone().add(new THREE.Vector3(0, 0.3, 0)), '!', K.G.t, { color: '#fff3a0', size: 40, rise: 0.4, life: 1.0 });
    K.setMood(f, 'hurt', 0.8);
    const [t, en] = K.line('unshaded'); K.say(f, t, { cls: 'foe', en, dur: 1.6 });
    sfx('unshade');
    K.G.stats.lit = (K.G.stats.lit || 0) + 1;
    K.refreshLabels();
    await K.wait(0.25);
  }
  // «¡Ilumina!»: Mimo shines like a little sun; everyone takes 1 (2 when you said it all together), and the shadows show what they are
  async function actLight(c) {
    const K = F(), { G, A, ST } = K, M = A.mimo, foes = K.targetable().filter(f => !f.shy);
    K.setMood(M, 'perk', 1.8);
    ST.shot('wide');
    const [t0, en0] = K.line('lighting'); K.say(M, t0, { cls: 'mimo', en: en0, dur: 1.6 });
    K.emit('light');
    const T = G.t + 0.7, gp = K.timingWindow(T, 'Space', () => ST.worldOf(M, 'top'));
    await K.tween(M, { sx: 1.16, sy: 1.16 }, 0.4, 'out');
    const grade = await gp;
    sfx('light');
    flash(ST.worldOf(M, 'top'), c.marshTeam === 'we' ? 1.5 : 1);
    if (c.marshTeam && A.coach && !A.coach.hidden) { const [t1, en1] = K.line(c.marshTeam === 'we' ? 'teamWe' : 'teamYou'); K.say(A.coach, t1, { cls: 'coach', en: en1, dur: 1.2 }); G.stats.team = (G.stats.team || 0) + 1; }
    K.tween(M, { sx: 1, sy: 1 }, 0.35, 'back');
    let first = true;
    for (const f of foes) {
      if (!f.alive || f.gone) continue;
      if (isShadow(f)) await unshade(f);
      const p = ST.worldOf(f, 'mid');
      const cc = Object.assign({}, c, { target: f, crit: false, weakHit: false, sneak: false, armored: false, curled: false, belly: false, open: false, bounce: false, flip: false, clang: false, behind: false, through: false, partKey: null });
      if (!first) G.badgePending = null;
      await K.land(cc, c.marshTeam === 'we' ? 2 : 1, grade, p, false, { knock: 0.2 });
      first = false;
      await K.wait(0.05);
    }
    K.refreshLabels();
    K.setMood(M, 'idle');
  }
  if (_.MOVES) _.MOVES.light = c => actLight(c);
  // Bruno runs in and swings (a team order); with «let's», you throw a stone too
  async function allyStrike(c) {
    const K = F(), { G, A, ST } = K, B = A.coach, f = c.target;
    if (!B || B.hidden || !f || !f.alive || f.gone) return;
    const [t, en] = K.line(c.marshTeam === 'we' ? 'teamWe' : 'teamYou'); K.say(B, t, { cls: 'coach', en, dur: 1.2 });
    const cc = () => Object.assign({}, c, { crit: false, weakHit: false, sneak: false, partKey: c.partKey, clang: c.clang, bounce: c.bounce });
    const tx = f.x - (f.x > B.x ? 1.0 : -1.0) * (0.75 + (f.radius || 0.4)), tz = f.z + 0.35;
    await K.arcTo(B, tx, 0, tz, 0.4, 0.7);
    K.squash(B, 1.2, 0.82, 0.06);
    G.badgePending = null;
    await K.land(cc(), 1, 'good', ST.worldOf(f, 'mid'), true, { knock: 0.25 });
    await K.hopHome(B, 0.8, 0.45);
    if (c.marshTeam === 'we' && f.alive && !f.gone && A.you) {
      const Y = A.you, [t2, en2] = K.line('youThrow');
      K.say(Y, t2, { cls: 'you', en: en2, dur: 1.0 });
      const stone = new THREE.Mesh(TK.G.sphere, TK.toon('#9a958c', { rim: 0.1 })); stone.scale.setScalar(0.09); ST.S.scene.add(stone);
      const p0 = ST.worldOf(Y, 'top'), p1 = ST.worldOf(f, 'mid');
      K.squash(Y, 1.1, 0.9, 0.06);
      await K.along(0.42, u => { stone.position.set(lerp(p0.x, p1.x, u), lerp(p0.y, p1.y, u) + Math.sin(u * Math.PI) * 1.0, lerp(p0.z, p1.z, u)); });
      ST.S.scene.remove(stone);
      G.badgePending = null;
      await K.land(cc(), 1, 'good', p1, true, { knock: 0.15 });
    }
  }
  if (_.MOVES) for (const v of ['jump', 'hit', 'throw', 'attack', 'grab', 'push']) {
    const m0 = _.MOVES[v]; if (typeof m0 !== 'function') continue;
    _.MOVES[v] = async function (c) {
      await m0.apply(this, arguments);
      if (c && c.marshTeam && allyOn()) { const G = Gb(); G.stats.team = (G.stats.team || 0) + 1; try { await allyStrike(c); } catch (e) { console.warn('[marsh battle] ally', e); } }     // (it counts even when Mimo's hit already won it)
    };
  }
  // a song, a gust, a call or a climb as a team order: Bruno joins in (and it counts)
  if (_.MOVES) for (const v of ['sing', 'blow', 'call', 'climb']) {
    const m0 = _.MOVES[v]; if (typeof m0 !== 'function') continue;
    _.MOVES[v] = async function (c) {
      if (c && c.marshTeam && allyOn()) { const K = F(), [t, en] = K.line(c.marshTeam === 'we' ? 'teamWe' : 'teamYou'); K.say(K.A.coach, t, { cls: 'coach', en, dur: 1.2 }); K.G.stats.team = (K.G.stats.team || 0) + 1; }
      return m0.apply(this, arguments);
    };
  }

  // ================================================================ flow.js's hooks: the label, the preview, the miss, the frames
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  function label(f) {
    const G = Gb(), Lg = G.L, w = cjPlain(Lg.shadowWord || 'sombra');
    const chips = `<span class="bt-chip name"><i></i> ?</span><span class="bt-chip state">${esc(w)}</span>`;
    const hp = f.maxHp > 12 ? `<div class="bt-hpbar"><i style="width:${Math.round((100 * f.hp) / f.maxHp)}%"></i><span>${f.hp}</span></div>`
      : `<div class="bt-hp">${'<i></i>'.repeat(Math.max(0, f.hp))}${'<i class="gone"></i>'.repeat(Math.max(0, f.maxHp - f.hp))}</div>`;
    return `<div class="bt-chips">${chips}</div>${hp}`;
  }
  function preview(c) {
    const G = Gb();
    if (c.verb === 'light') { const n = F().targetable().filter(isShadow).length; return `light → everyone${c.marshTeam === 'we' ? ' <span class="bonus">all together ×2</span>' : ''}${n ? ` <span class="bonus">${n} shadow${n > 1 ? 's' : ''} show${n > 1 ? '' : 's'} what ${n > 1 ? 'they are' : 'it is'}</span>` : ''}`; }
    const f = c.target; if (!f) return null;
    const team = c.marshTeam === 'you' ? ' <span class="bonus">+ Bruno</span>' : c.marshTeam === 'we' ? ' <span class="bonus">+ Bruno + you</span>' : '';
    if (!isShadow(f)) return null;
    const V = { jump: 'jump', hit: 'hit', throw: 'throw', attack: 'attack', grab: 'grab', push: 'push' }[c.verb] || c.verb;
    if (c.through) return `${V} → a shadow <span class="warn"> it goes right through! Say what it really is, or light it first («${esc(cjPlain((G.L.verbs.light && G.L.verbs.light.show) || 'ilumina'))}»)</span>${team}`;
    return `${V} → the shadow you named <span class="bonus">you said what it is: it lands</span>${team}`;
  }
  function through(c, p) {
    const K = F(), { G, A, ST, UI } = K, f = c.target;
    K.setMood(f, 'happy', 0.9); K.setMood(A.mimo, 'confused', 1.2);
    ST.S.fx.puff(p.x, p.y, p.z, 9, 0.22, '#3a3550');
    UI.pop(p.clone().add(new THREE.Vector3(0.45, 0.35, 0)), 'WHOOSH', G.t, { color: '#c9c4dc', size: 32, sub: 'only a shadow!', dx: 0.25 });
    K.showGrade(f);
    G.stats.through = (G.stats.through || 0) + 1;
    sfx('through');
    const [t, en] = K.line('shadowThrough'); K.say(f, t, { cls: 'foe', en, dur: 1.8 });
    if (G.L.tips.shadow) UI.tip(G.L.tips.shadow.replace('{mimo}', G.name));
  }
  // the frames and tips: shadows (name it, or light it), light, team orders; and no frame or tip that gives away what a shadow is
  const GIVEAWAY = { moth: ['mothT', 'wingT'], beetle: ['beetleT'], armadillo: ['pushT'], frog: ['frogT'], bat: ['batT'], bee: ['likeT'], snowball: ['snowT'], crab: ['behindT'] };
  function scaffolds(foes, keys, tips, verbs) {
    const G = Gb(), Lg = G.L, live = foes.filter(f => f.alive && !f.gone);
    const shades = live.filter(isShadow);
    if (shades.length) {
      for (const sp of Object.keys(GIVEAWAY)) {
        if (!shades.some(f => f.species === sp) || live.some(f => f.species === sp && !isShadow(f))) continue;
        for (const k of GIVEAWAY[sp]) { const i = keys.indexOf(k); if (i >= 0) keys.splice(i, 1); }
        const tip = Lg.tips && Lg.tips[sp]; if (tip) { const j = tips.indexOf(tip); if (j >= 0) tips.splice(j, 1); }
      }
      if (Lg.frames.shadowT) keys.unshift('shadowT');
      if (verbs.includes('light') && Lg.frames.lightT) keys.unshift('lightT');
      if (Lg.tips.shadow) tips.unshift(Lg.tips.shadow.replace('{mimo}', G.name));
    } else if (verbs.includes('light') && Lg.frames.lightT) { keys.push('lightT'); if (Lg.tips.light) tips.push(Lg.tips.light); }
    if (allyOn() && !handOver() && Lg.frames.teamT) { keys.push('teamT'); if (Lg.tips.team) tips.push(Lg.tips.team.replace('{mimo}', G.name)); }
  }
  const MB = { label, preview, through, scaffolds, skin, allyOn, unshade, teamCanon, isShadow, named, actLight, allyStrike };
  _.marsh = MB;

  // ================================================================ the sounds (battle_fx.js's tables, added to: no edits there)
  if (typeof BFX !== 'undefined' && BFX.SOUNDS) {
    // light: a bright swell and a rising shimmer · through: a breathy whoosh and a low chuckle · unshade: a glassy sparkle
    BFX.SOUNDS.light = (t, K) => { K.swell(t, 0.5, 1.2); [79, 83, 86, 91, 95].forEach((m, i) => K.celesta(m, t + 0.05 + i * 0.06, 0.9, 0.9)); K.glock(98, t + 0.36, 0.8); };
    BFX.SOUNDS.through = (t, K) => { K.brush(t, 1.6, 0.35); K.swell(t, 0.3, 0.8); K.vox(50, t + 0.08, 0.16, 0.6, 'u', 'o'); K.vox(53, t + 0.26, 0.14, 0.5, 'o', 'u'); };
    BFX.SOUNDS.unshade = (t, K) => { K.glass(88, t, 0.7, 0.8); K.celesta(93, t + 0.05, 0.8, 0.6); K.chk(t, 0.6); };
  }
  if (typeof BFX !== 'undefined' && BFX.VOICES && BFX.voice) {
    // a shadow speaks low and breathy (a hushling's breath, a fifth down); the Great Shadow lower still (a boss voice)
    BFX.VOICES.shade = { m: 52, vow: ['u', 'o', 'a'], len: 0.11, gap: 0.04, layer: 'breath' };
    const voice0 = BFX.voice;
    BFX.voice = function (st, text, o, G) {
      if (st && st.kind === 'foe' && isShadow(st)) { const s = Object.create(st); s.species = 'shade'; if (st.isShade) s.isBoss = true; return voice0.call(this, s, text, o, G); }
      return voice0.apply(this, arguments);
    };
  }

  // ================================================================ the bestiary: the Great Shadow (marsh_chapel.js records it after its last shape)
  const RW = _.RW;
  if (RW) {
    if (RW.LORE && !RW.LORE['boss:shade']) RW.LORE['boss:shade'] = ['La Gran Sombra vivía en la capilla ahogada. Tomaba la forma de cualquier criatura, pero la luz siempre la mostraba.',
      'A Grande Sombra vivia na capela afogada. Tomava a forma de qualquer criatura, mas a luz sempre a mostrava.',
      'Der Große Schatten lebte in der versunkenen Kapelle. Er nahm die Form jedes Wesens an, aber das Licht zeigte ihn immer.',
      '[大|dà] [影子|yǐng zi] [住|zhù] [在|zài] [沉没|chén mò] [的|de] [教堂|jiào táng] [里|lǐ] 。 [它|tā] [能|néng] [变成|biàn chéng] [任何|rèn hé] [动物|dòng wù] ， [可是|kě shì] [光|guāng] [总是|zǒng shì] [让|ràng] [它|tā] [现形|xiàn xíng] 。',
      '[大|おお]きな [影|かげ] は [沈|しず]んだ [礼拝堂|れいはいどう] に [住|す]んで いた 。 どんな [生|い]き[物|もの] に も なれた が 、 [光|ひかり] は いつも その [正体|しょうたい] を [見|み]せた 。',
      'The Great Shadow lived in the drowned chapel. It took the shape of any creature, but light always showed it for what it was.'];
    if (RW.BOSS_DROPS && !RW.BOSS_DROPS.shade) RW.BOSS_DROPS.shade = ['w.cake', 'w.honey'];
    if (RW.KIND_EN && !RW.KIND_EN.shade) RW.KIND_EN.shade = 'Great Shadow';
    const SHADE_W = { es: 'la Gran Sombra', pt: 'a Grande Sombra', de: 'der Große Schatten', zh: '[大|dà] [影子|yǐng zi]', ja: '[大|おお]きな [影|かげ]' };
    if (RW.beastName) { const bn0 = RW.beastName; RW.beastName = function (key) { if (key === 'boss:shade') { const l = (typeof LEX !== 'undefined' && LEX.lang) || 'es', w = SHADE_W[l] || SHADE_W.es; return { w: RW.showLang ? RW.showLang(w) : esc(cjPlain(w)), en: 'the Great Shadow' }; } return bn0.apply(this, arguments); }; }
    if (typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(RW.LORE['boss:shade'][3]); CJK.addSource(RW.LORE['boss:shade'][4]); CJK.addSource(SHADE_W.zh); CJK.addSource(SHADE_W.ja); } catch (e) { /* optional */ } }
  }
  if (typeof ICONS !== 'undefined' && ICONS.keys && !ICONS.keys.includes('shade')) ICONS.add('shade', (c, p, h) => {
    h.shape(c, p, h.ell(0, 10, 32, 26), '#2f2a44'); h.shape(c, p, h.poly([[-26, -2], [-16, -38], [-6, -12]]), '#2f2a44'); h.shape(c, p, h.poly([[26, -2], [16, -38], [6, -12]]), '#2f2a44');
    if (p) { h.dot(c, -10, 6, 5, '#fff3a0'); h.dot(c, 10, 6, 5, '#fff3a0'); }
  });
  // the Great Shadow in the journal's bestiary (after its last shape): one entry of its own
  MB.recordShade = (grade) => {
    try {
      const b = RW && RW.BEASTS ? RW.BEASTS() : null; if (!b) return;
      const e = b['boss:shade'] || (b['boss:shade'] = { met: Date.now(), won: 0, best: null });
      e.won++; if (!e.first) e.first = Date.now();
      const SC = { S: 4, A: 3, B: 2, C: 1, D: 0 }; if (grade && (!e.best || SC[grade] > SC[e.best])) e.best = grade;
    } catch (e) { console.warn('[marsh battle] bestiary', e); }
  };
})();
