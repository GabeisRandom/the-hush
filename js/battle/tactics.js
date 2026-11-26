'use strict';
// Battle skills (DESIGN.md 17.3, playtest 5: "ABCDEG"). Ways to fight with more of the language, each one taught by Bruno at
// the training yard (js/tactics_yard.js: a demonstration, then a practice fight with focus 'tac:<key>') before any fight
// uses it, and unlocked by the story:
//   A  Read their tells (from the start): a foe says what it's about to do («¡Voy a saltar!», «¡Me escondo detrás de la
//      roca!»), and the counter uses it («¡Cuando salte, golpéalo!» ×2, «¡Empuja la roca!» ×2).
//   D  Pick your target by description (after the hill): look-alikes told apart by «el que tiene el escudo roto», «el más grande».
//   B  Combos (after bell 1): «Primero…, luego…, y al final…»: every clause after the first hits harder.
//   E  Talk them down, or talk your way out (after bell 2): reasons, deals, compliments, a polite goodbye.
//   C  Team orders (after bell 8): «Bruno, protege a Mimo mientras yo distraigo al grande».
// Every one in es / pt / de / zh / ja with its own grammar, graded S–D like any command (the slips go into the clause, so
// flow.js's gradeOf counts them). flow.js calls in at a few hooks (_.tac.specs / begin / turn / judge / attackers /
// foeAttack / perform / afterFoes / explain / lesson) and hands over its internals as _.flow. P.parse is wrapped: this file
// takes off what it adds to a sentence (a «cuando…» clause, a description, the connectors) and lets the parser read the rest.
// State: game.state.tac = { A: time learned, … } (saved with the game). Tests: BATTLE._.tac.force = 'ADBEC' (all on),
// G.auto.tell = 'leap' | 'hide' | false.
(() => {
  const B = window.BATTLE, _ = B && B._;
  if (!_ || !_.P) return;
  const P = _.P, T = (_.tac = _.tac || {});
  const X = () => _.flow;
  const CJ = () => (typeof CJK !== 'undefined' ? CJK : null);
  const nrm = P.nrm;

  // ------------------------------------------------------------ which skills are on
  const KEYS = ['A', 'D', 'B', 'E', 'C'];
  const INFO = {
    A: { name: 'Read their tells', sub: 'they say what they’ll do: use it', wait: '' },
    D: { name: 'Pick by description', sub: 'the one with the broken shield, the biggest one', wait: 'after the big Hushling on the hill' },
    B: { name: 'Combos', sub: 'first…, then…, and at the end…', wait: 'after the first bell' },
    E: { name: 'Talk them down', sub: 'reasons, deals, compliments, a polite goodbye', wait: 'after the second bell' },
    C: { name: 'Team orders', sub: 'Bruno, protect Mimo while I…', wait: 'after the eighth bell' },
  };
  const UNLOCK = { A: () => true, D: f => !!f.boss, B: f => (f.bells || 0) >= 1, E: f => (f.bells || 0) >= 2, C: f => (f.bells || 0) >= 8 };
  const gameState = () => { const g = _.RW && _.RW.game; return (g && g.state) || null; };
  T.force = null;
  T.unlocked = k => { if (T.force != null) return T.force.includes(k); const s = gameState(); return !!(s && UNLOCK[k] && UNLOCK[k](s.flags || {})); };
  T.learned = k => { if (T.force != null) return T.force.includes(k); const s = gameState(); return !!(s && s.tac && s.tac[k]); };
  T.learn = k => { const s = gameState(); if (s && !(s.tac && s.tac[k])) { (s.tac || (s.tac = {}))[k] = Date.now(); return true; } return false; };
  // in a fight: a lesson has only its own skill on; tutorials none; else unlocked and learned
  T.on = k => {
    const x = X(); if (!x) return false;
    const G = x.G;
    if (G.practice) return G.focus === 'tac:' + k;
    if (G.tutorial) return false;
    return T.unlocked(k) && T.learned(k);
  };
  const bossFight = G => !!(G.boss || G.arma || G.bossId);
  T.INFO = INFO; T.KEYS = KEYS;

  // ------------------------------------------------------------ helpers
  const H = (T.h = {});
  // the words of a sentence, with where each one is: [{ raw, n, i, j, comma: a comma right after it }]
  H.toks = text => {
    const out = [], re = /[^\s¡!¿?.,;:«»"“”„()…\-–—]+/g; let m;
    while ((m = re.exec(text))) out.push({ raw: m[0], n: nrm(m[0]), i: m.index, j: m.index + m[0].length });
    for (let k = 0; k < out.length; k++) out[k].comma = /[,;:]/.test(text.slice(out[k].j, k + 1 < out.length ? out[k + 1].i : text.length));
    return out;
  };
  // the text of a run of words, and the sentence without some of them
  H.text = (text, ts) => (ts.length ? ts.map(t => t.raw).join(' ') : '');
  H.seq = (t, k, seq) => seq.every((w, j) => t[k + j] && t[k + j].n === w);
  H.find = (t, seqs, from = 0) => { for (let k = from; k < t.length; k++) for (const s of seqs) if (H.seq(t, k, s)) return { k, len: s.length, seq: s }; return null; };
  // a word against forms: exact, or one letter off on a long one (a spelling slip)
  H.match = (n, forms) => {
    for (const f of forms) if (nrm(f) === n) return { form: f, typo: false };
    if (n.length >= 5) for (const f of forms) { const x = nrm(f); if (x.length >= 5 && P.near1(n, x)) return { form: f, typo: true }; }
    return null;
  };
  H.gender = f => { const L = X().G.L; return (f && L.species[f.species] && L.species[f.species].g) || 'm'; };
  H.unwrap = s => String(s || '').replace(/^[¡¿]/, '').replace(/\s*[!！?？.。]+\s*$/, '').trim();
  H.lc1 = s => s.charAt(0).toLowerCase() + s.slice(1);
  H.err = (list, kind, major) => list.push({ kind, major: !!major || P.MAJOR.has(kind) });
  // a line from this file's tables, for the battle's language: [text, English] (f: a creature: {name} and the gender)
  const lx = () => LX[X().G.lang] || LX.es;
  H.line = (key, f) => {
    const t = lx(), g = f ? H.gender(f) : null;
    const l = (g === 'f' && t[key + 'F']) || (g === 'n' && t[key + 'N']) || t[key] || LX.es[key];
    const name = X().G.name || 'Mimo';
    return l ? [String(l[0]).replace(/\{name\}/g, name), String(l[1]).replace(/\{name\}/g, name)] : [key, key];
  };
  H.plain = s => { const C = CJ(), l = X().G.lang; return C && (l === 'zh' || l === 'ja') ? C.plain(String(s), { lang: l, cap: false }) : String(s); };
  H.foeSay = (f, key, o = {}) => { const [t, en] = H.line(key, f); X().say(f, t, Object.assign({ cls: 'foe shout', en, dur: 2.4 }, o)); return t; };
  H.coach = key => X().coachSay(H.line(key));
  // a tip in the corner (English with the language in «»), the first times only (o.always: every time)
  H.tip = (key, o = {}) => {
    const x = X(), G = x.G, s = (lx().tips || {})[key] || (LX.es.tips || {})[key];
    if (!s) return;
    G.tacTips = G.tacTips || {};
    if (G.tacTips[key] && !o.always) return;
    G.tacTips[key] = 1;
    const st = typeof LEX !== 'undefined' && LEX.st ? LEX.st('x.tacTip.' + key) : null;
    if (st && !o.always) { st.n = (st.n || 0) + 1; if (st.n > 4) return; }
    x.UI.tip(String(s).replace(/«([^»]+)»/g, (m, w) => `<b class="tl">«${x.UI.esc(w)}»</b>`).replace(/\{name\}/g, x.UI.esc(G.name)));
  };
  H.pop = (f, text, o = {}) => { const x = X(); x.UI.pop(x.ST.worldOf(f, 'top').add(new THREE.Vector3(o.dx || 0, o.dy || 0.3, 0)), text, x.G.t, Object.assign({ color: '#ffd166', size: 30 }, o)); };
  // the verbs that hit something (a counter or a rock needs one)
  H.attackVerb = v => !['eat', 'sing', 'climb', 'blow', 'call'].includes(v);
  // which foe a few words point at: a pronoun gives the gender, a kind or a color narrows it (CJK: by notation)
  H.byWords = (ts, foes) => {
    const L = X().G.L, I = P.indexLang(L);
    let list = foes.slice(), said = false;
    for (const t of ts) {
      const s = P.look(I.species, t.n); if (s) { list = list.filter(f => f.species === s.key); said = true; continue; }
      const a = I.adjs && I.adjs.get(t.n); if (a) { list = list.filter(f => P.hasTrait(f, a.key)); said = true; continue; }
      if (L.code === 'de') { const d = P.deAdj(I, t.n); if (d) { list = list.filter(f => P.hasTrait(f, d.key)); said = true; } }
    }
    return said ? list : null;
  };

  // ------------------------------------------------------------ the parser, wrapped
  // Whole-turn sentences first (talking, team orders: their sections push to T.whole), then a sentence of clauses: combos
  // (their section sets T.chunks) or one clause through T.one (a «cuando…» counter, the rock, a description), else the parser.
  T.whole = []; T.single = [];
  const parse0 = P.parse;
  T.parse0 = parse0;
  T.one = (text, ctx) => {
    for (const p of T.single) {
      if (!T.on(p.k) || (ctx.tacNo && ctx.tacNo.includes(p.id))) continue;
      let r = null;
      try { r = p.fn(String(text), ctx); } catch (e) { console.error('[tactics]', p.id, e); }
      if (r) return r;
    }
    return parse0(text, ctx);
  };
  P.parse = (text, ctx) => {
    const x = X();
    if (!x || !x.G.running || !ctx || !ctx.foes || !ctx.L || ctx.tacSkip) return parse0(text, ctx);
    if (!ctx.maxClauses && T.on('B')) ctx.maxClauses = 4;
    for (const p of T.whole) {
      if (!T.on(p.k)) continue;
      let r = null;
      try { r = p.fn(String(text), ctx); } catch (e) { console.error('[tactics]', p.id, e); }
      if (r) return r;
    }
    if (T.chunks && T.on('B')) { const r = T.chunks(String(text), ctx); if (r) return r; }
    return T.one(text, ctx);
  };

  // ------------------------------------------------------------ the hooks flow.js calls
  T.specsHooks = []; T.beginHooks = []; T.judgeHooks = []; T.turnHooks = []; T.afterHooks = []; T.explainHooks = []; T.lessons = {};
  T.specs = (specs, opts) => { for (const h of T.specsHooks) try { h(specs, opts); } catch (e) { console.error('[tactics] specs', e); } };
  T.begin = opts => {
    const G = X().G;
    G.tacOut = null; G.tacLesson = null; G.tacTips = {}; G.tacRocks = [];
    for (const h of T.beginHooks) try { h(opts); } catch (e) { console.error('[tactics] begin', e); }
  };
  T.judge = r => {
    for (const c of r.clauses || []) { c.tacMult = 1; c.tacSub = null; c.tacRun = null; }
    for (const h of T.judgeHooks) try { h(r); } catch (e) { console.error('[tactics] judge', e); }
    for (const c of r.clauses || []) if (c.tacMult === 1) c.tacMult = 0;
  };
  T.turn = async () => { for (const h of T.turnHooks) try { await h(); } catch (e) { console.error('[tactics] turn', e); } };
  T.afterFoes = async () => { for (const h of T.afterHooks) try { await h(); } catch (e) { console.error('[tactics] after', e); } };
  T.explain = r => { for (const h of T.explainHooks) { try { if (h(r)) return true; } catch (e) { console.error('[tactics] explain', e); } } return false; };
  T.perform = async r => { const fn = r.tacPerform; if (fn) await fn(r); };
  T.lesson = async () => {
    const x = X(), G = x.G, k = String(G.focus || '').slice(4), run = T.lessons[k];
    G.winLine = null;
    if (!run) { await x.intro(); await x.coachSay('pDone'); return 'done'; }
    return run(x, G);
  };

  // ------------------------------------------------------------ the tables: what each language says
  const LX = (T.LX = {});
  LX.es = {
    leap: ['¡Voy a saltar!', 'I’m going to jump!'], go: ['¡Allá voy!', 'Here I come!'], hide: ['¡Me escondo detrás de la roca!', 'I’m hiding behind the rock!'],
    out: ['¡Ya salgo!', 'I’m coming out!'], ouch: ['¡Ay! ¿Cómo lo sabías?', 'Ow! How did you know?'], rockHit: ['¡Mi roca!', 'My rock!'],
    noLeap: ['¿No salta?', 'Isn’t it jumping?'], behind: ['¡Está detrás de la roca!', 'It’s behind the rock!'], noRock: ['¿Qué roca?', 'What rock?'],
    exA: ['¡Cuando salte, golpéalo!', 'When it jumps, hit it!'],
    aHello: ['¡Hoy, a escuchar! Antes de moverse, los calladitos dicen lo que van a hacer.', 'Today: listening! Before they move, hushlings say what they’re going to do.'],
    aDemo: ['¿Oíste? «Voy a saltar». Entonces le digo a {name}: «¡Cuando salte, golpéalo!»', 'Hear that? “I’m going to jump.” So I tell {name}: “When it jumps, hit it!”'],
    aWhy: ['Después de «cuando», «salta» se vuelve «salte». Y «golpéalo» es «golpea» + «lo».', 'After «cuando», «salta» becomes «salte». And «golpéalo» is «golpea» + «lo» (it).'],
    aYou: ['¡Ahora tú! Escucha al muñeco y usa lo que dice.', 'Now you! Listen to the dummy and use what it says.'],
    aGot: ['¡Eso es! ¡Leíste su señal!', 'That’s it! You read its tell!'],
    aMissed: ['¡Uy, saltó! Escucha lo que dice y úsalo.', 'Oops, it jumped! Listen to what it says, and use it.'],
    aHide: ['¡Mira! Se esconde detrás de la roca: así los golpes no pasan. Dile a {name}: «¡Empuja la roca!»', 'Look! It hides behind the rock: hits won’t get through. Tell {name}: “Push the rock!”'],
    aRockWhy: ['«Empuja la roca», sin «a»: la «a» es para alguien, no para cosas.', '«Empuja la roca», with no «a»: «a» is for someone, not for things.'],
    tips: {
      tellLeap: 'It said what it’s going to do! Use it: «Cuando salte, golpéalo» (when it jumps, hit it) for a COUNTER ×2.',
      tellHide: 'It’s behind the rock: hits only do half. Push the rock over onto it: «Empuja la roca» (×2).',
    },
    why: {
      mood: 'After «cuando», something that hasn’t happened yet takes the subjunctive: «cuando salte» (not «cuando salta»): the «-a» of «salta» turns into «-e».',
      person: '«salte» is for it (he / she); «saltes» would be you: «Cuando salte, golpéalo».',
      rockA: 'Things take no «a»: «empuja la roca». The «a» goes before someone: «empuja al armadillo».',
    },
    slip: { mood: 'Mood slip (cuando + salte)', person: 'Person slip', rockA: '«a» slip (no «a» for things)' },
    soft: { tacPron: 'Say who: «golpéalo»' },
    gloss: { salte: 'jumps (after «cuando»)', 'golpéalo': 'hit it', 'golpéala': 'hit it (feminine)', roca: 'rock', escondo: 'I hide (me escondo)', 'detrás': 'behind',
      voy: 'I’m going (voy a = I’m going to)', saltar: 'to jump', 'allá': 'there', antes: 'before', moverse: 'moving', dicen: 'they say', van: 'they’re going (van a = are going to)',
      'oíste': 'did you hear', entonces: 'so / then', digo: 'I say', vuelve: 'becomes (se vuelve)', usa: 'use', dice: 'it says', 'leíste': 'you read', 'señal': 'sign / tell',
      pasan: 'get through', 'así': 'that way', cosas: 'things', alguien: 'someone', 'sabías': 'you knew', salgo: 'I come out', 'úsalo': 'use it', 'saltó': 'it jumped', golpes: 'hits', escuchar: 'listening' },
  };
  LX.pt = {
    leap: ['Vou pular!', 'I’m going to jump!'], go: ['Lá vou eu!', 'Here I go!'], hide: ['Vou me esconder atrás da pedra!', 'I’m hiding behind the rock!'],
    out: ['Pronto, saí!', 'Okay, I’m out!'], ouch: ['Ai! Como você sabia?', 'Ow! How did you know?'], rockHit: ['Minha pedra!', 'My rock!'],
    noLeap: ['Não vai pular?', 'Isn’t it going to jump?'], behind: ['Tá atrás da pedra!', 'It’s behind the rock!'], noRock: ['Que pedra?', 'What rock?'],
    exA: ['Quando ele pular, bate nele!', 'When it jumps, hit it!'],
    aHello: ['Hoje, ouvidos atentos! Antes de atacar, os caladinhos dizem o que vão fazer.', 'Today, ears open! Before they attack, hushlings say what they’re going to do.'],
    aDemo: ['Ouviu? «Vou pular». Então eu digo pro {name}: «Quando ele pular, bate nele!»', 'Hear that? “I’m going to jump.” So I tell {name}: “When it jumps, hit it!”'],
    aWhy: ['Depois de «quando», o verbo fica igual ao infinitivo: «quando ele pular». E «nele» é «em» + «ele».', 'After «quando», the verb looks like the infinitive: «quando ele pular» (the future subjunctive). And «nele» is «em» + «ele».'],
    aYou: ['Agora você! Escuta o boneco e usa o que ele diz.', 'Now you! Listen to the dummy and use what it says.'],
    aGot: ['Isso! Você leu o sinal!', 'That’s it! You read its tell!'],
    aMissed: ['Opa, pulou! Escuta o que ele diz e usa.', 'Oops, it jumped! Listen to what it says, and use it.'],
    aHide: ['Olha! Ele se escondeu atrás da pedra: assim os golpes não passam. Diz pro {name}: «Empurra a pedra!»', 'Look! It hid behind the rock: hits won’t get through. Tell {name}: “Push the rock!”'],
    aRockWhy: ['«Empurra a pedra»: direto, sem «em».', '«Empurra a pedra»: straight, with no «em».'],
    tips: {
      tellLeap: 'It said what it’s going to do! Use it: «Quando ele pular, bate nele» (when it jumps, hit it) for a COUNTER ×2.',
      tellHide: 'It’s behind the rock: hits only do half. Push the rock over onto it: «Empurra a pedra» (×2).',
    },
    why: {
      mood: 'After «quando», something still to come takes the future subjunctive, which for most verbs looks like the infinitive: «quando ele pular» (not «quando ele pula»).',
      person: '«pular» here is for it (ele / ela): «Quando ele pular, bate nele».',
      rockA: 'Push takes what it moves straight: «empurra a pedra» (no «em» / «na»).',
    },
    slip: { mood: 'Mood slip (quando + pular)', person: 'Person slip', rockA: 'Linking-word slip' },
    soft: { tacPron: 'Say who: «bate nele»' },
    gloss: { pular: 'to jump (quando ele pular = when it jumps)', pedra: 'rock / stone', 'atrás': 'behind', esconder: 'hide', nele: 'on him / it (em + ele)', nela: 'on her / it (em + ela)',
      sabia: 'knew', 'saí': 'I came out', quando: 'when', ouvidos: 'ears', atentos: 'alert', dizem: 'they say', 'vão': 'they’re going to', fazer: 'do', ouviu: 'did you hear',
      'então': 'so', digo: 'I say', depois: 'after', verbo: 'verb', fica: 'becomes', igual: 'the same', escuta: 'listen', usa: 'use', diz: 'says', leu: 'you read',
      sinal: 'sign / tell', golpes: 'hits', passam: 'get through', direto: 'straight', sem: 'without', escondeu: 'hid', pronto: 'okay / done', pulou: 'it jumped', 'lá': 'there' },
  };
  LX.de = {
    leap: ['Ich springe gleich!', 'I’m about to jump!'], go: ['Achtung, ich komme!', 'Look out, here I come!'], hide: ['Ich verstecke mich hinter dem Stein!', 'I’m hiding behind the rock!'],
    out: ['Ich komme raus!', 'I’m coming out!'], ouch: ['Au! Woher wusstest du das?', 'Ow! How did you know?'], rockHit: ['Mein Stein!', 'My rock!'],
    noLeap: ['Kein Sprung?', 'No jump?'], behind: ['Hinter dem Stein!', 'Behind the rock!'], noRock: ['Welcher Stein?', 'What rock?'],
    exA: ['Wenn sie springt, schlag sie!', 'When it jumps, hit it!'],
    aHello: ['Heute wird zugehört! Bevor sie angreifen, sagen die Schweiglinge, was sie vorhaben.', 'Today we listen! Before they attack, hushlings say what they’re up to.'],
    aDemo: ['Gehört? „Ich springe gleich.“ Also sage ich {name}: „Wenn sie springt, schlag sie!“', 'Heard that? “I’m about to jump.” So I tell {name}: “When it jumps, hit it!”'],
    aWhy: ['Nach „wenn“ kommt das Verb ans Ende: „wenn sie springt“. Und „sie“, weil es „die Puppe“ ist: der → er / ihn, die → sie, das → es.', 'After „wenn“ the verb goes to the end: „wenn sie springt“. And „sie“ because it’s „die Puppe“: der → er / ihn, die → sie, das → es.'],
    aYou: ['Jetzt du! Hör der Puppe zu und nutze, was sie sagt.', 'Now you! Listen to the dummy and use what it says.'],
    aGot: ['Genau! Du hast das Zeichen gelesen!', 'Exactly! You read its tell!'],
    aMissed: ['Hoppla, gesprungen! Hör zu, was sie sagt, und nutze es.', 'Whoops, it jumped! Listen to what it says, and use it.'],
    aHide: ['Schau! Sie versteckt sich hinter dem Stein: So kommen Schläge nicht durch. Sag {name}: „Schieb den Stein!“', 'Look! It’s hiding behind the rock: hits won’t get through. Tell {name}: “Push the rock!”'],
    aRockWhy: ['„hinter dem Stein“ (Dativ: wo?), aber „schieb den Stein“ (Akkusativ: was?).', '„hinter dem Stein“ (dative: where?), but „schieb den Stein“ (accusative: what?).'],
    tips: {
      tellLeap: 'It said what it’s going to do! Use it: «Wenn er springt, schlag ihn!» (when it jumps, hit it) for a COUNTER ×2. «er / sie / es» goes with der / die / das.',
      tellHide: 'It’s behind the rock: hits only do half. Push the rock over onto it: «Schieb den Stein!» (×2).',
    },
    why: {
      order: 'In a «wenn» clause the verb goes to the very end: «wenn er springt» (not «wenn springt er»).',
      ending: 'For he / she / it the verb ends in -t: «er springt», «sie hüpft».',
      subject: 'German needs who in the «wenn» clause: «wenn er springt» (er / sie / es, as the noun’s der / die / das).',
      pronCase: 'Who you hit takes the accusative: «schlag ihn» (not «ihm»).',
      rockCase: '«Schieb den Stein» takes the accusative: «den». «Hinter dem Stein» is where (dative).',
    },
    slip: { order: 'Word-order slip (verb at the end)', ending: 'Ending slip', subject: 'Missing «er / sie / es»', pronCase: 'Case slip (ihn)', rockCase: 'Case slip (den Stein)' },
    soft: { tacPron: 'Say who: «schlag ihn»' },
    gloss: { springe: 'I jump', gleich: 'in a moment', verstecke: 'I hide (mich: myself)', hinter: 'behind', Stein: 'rock / stone', wenn: 'when / if', springt: 'jumps',
      ihn: 'him / it', woher: 'how / from where', wusstest: 'did you know', raus: 'out', Achtung: 'look out', komme: 'I come', zugehört: 'listened', bevor: 'before',
      angreifen: 'attack', vorhaben: 'are up to', 'Gehört': 'heard', also: 'so', sage: 'I say', Verb: 'verb', Ende: 'end', 'Hör': 'listen (hör zu)', nutze: 'use',
      Zeichen: 'sign / tell', gelesen: 'read', Schau: 'look', 'Schläge': 'hits', durch: 'through', schieb: 'push', aber: 'but', Puppe: 'dummy', Sprung: 'jump', gesprungen: 'jumped' },
  };
  LX.zh = {
    leap: ['[我|wǒ] [要|yào] [跳|tiào] [了|le] ！', 'I’m going to jump!'], go: ['[看|kàn] [我|wǒ] [的|de] ！', 'Watch this!'],
    hide: ['[我|wǒ] [躲|duǒ] [到|dào] [石头|shí tou] [后面|hòu miàn] [去|qù] ！', 'I’m hiding behind the rock!'], out: ['[我|wǒ] [出来|chū lái] [了|le] ！', 'I’m coming out!'],
    ouch: ['[哎哟|āi yō] ！ [你|nǐ] [怎么|zěn me] [知道|zhī dào] [的|de] ？', 'Ow! How did you know?'], rockHit: ['[我|wǒ] [的|de] [石头|shí tou] ！', 'My rock!'],
    noLeap: ['[不|bú] [跳|tiào] [了|le] ？', 'Not jumping?'], behind: ['[它|tā] [在|zài] [石头|shí tou] [后面|hòu miàn] ！', 'It’s behind the rock!'], noRock: ['[哪|nǎ] [块|kuài] [石头|shí tou] ？', 'Which rock?'],
    exA: ['[它|tā] [跳|tiào] [的|de] [时候|shí hou] ， [打|dǎ] [它|tā] ！', 'When it jumps, hit it!'],
    aHello: ['[今天|jīn tiān] [我们|wǒ men] [练|liàn] [听|tīng] ！ [小默默|xiǎo mò mò] [动|dòng] [之前|zhī qián] [会|huì] [先|xiān] [说|shuō] [要|yào] [做|zuò] [什么|shén me] 。', 'Today we practice listening! Before hushlings move, they first say what they’re going to do.'],
    aDemo: ['[听到|tīng dào] [了|le] [吗|ma] ？ [它|tā] [说|shuō] [要|yào] [跳|tiào] 。 [所以|suǒ yǐ] [我|wǒ] [对|duì] {mimo} [说|shuō] ： [它|tā] [跳|tiào] [的|de] [时候|shí hou] ， [打|dǎ] [它|tā] ！', 'Hear that? It said it’s going to jump. So I tell {name}: “When it jumps, hit it!”'],
    aWhy: ['[的|de] [时候|shí hou] ： [就是|jiù shì] [那个|nà ge] [时间|shí jiān] 。 [也|yě] [可以|kě yǐ] [说|shuō] ： [它|tā] [一|yí] [跳|tiào] [就|jiù] [打|dǎ] [它|tā] ！', '…的时候 means “when …” (at that time). You can also say «它一跳就打它！»: as soon as it jumps, hit it.'],
    aYou: ['[现在|xiàn zài] [轮到|lún dào] [你|nǐ] [了|le] ！ [听|tīng] [稻草人|dào cǎo rén] [说|shuō] [什么|shén me] ， [然后|rán hòu] [用|yòng] [上|shàng] 。', 'Your turn now! Listen to what the dummy says, then use it.'],
    aGot: ['[对|duì] [了|le] ！ [你|nǐ] [听懂|tīng dǒng] [了|le] ！', 'That’s it! You understood it!'],
    aMissed: ['[哎呀|āi ya] ， [它|tā] [跳|tiào] [了|le] ！ [好好|hǎo hǎo] [听|tīng] ， [然后|rán hòu] [用|yòng] [上|shàng] 。', 'Oops, it jumped! Listen carefully, then use it.'],
    aHide: ['[看|kàn] ！ [它|tā] [躲|duǒ] [在|zài] [石头|shí tou] [后面|hòu miàn] ， [打|dǎ] [不|bù] [到|dào] 。 [对|duì] {mimo} [说|shuō] ： [把|bǎ] [石头|shí tou] [推倒|tuī dǎo] ！', 'Look! It’s hiding behind the rock: hits can’t reach it. Tell {name}: “Push the rock over!”'],
    aRockWhy: ['[把|bǎ] [石头|shí tou] [推倒|tuī dǎo] ： [推|tuī] ， [结果|jié guǒ] [是|shì] [倒|dǎo] 。', '把石头推倒: push it, and the result: over (倒).'],
    tips: {
      tellLeap: 'It said what it’s going to do! Use it: «它跳的时候，打它！» (when it jumps, hit it) for a COUNTER ×2.',
      tellHide: 'It’s behind the rock: hits only do half. Push the rock over onto it: «把石头推倒！» (×2).',
    },
    why: {
      de: 'In «…的时候» (when …), 的 links the clause to 时候: «它跳的时候», not «它跳时候».',
      jiu: '«一…就…» needs both halves: «它一跳就打它» (as soon as it jumps, hit it).',
      ba: 'With 把 the verb needs a result: «把石头推倒» (push the rock over), not «把石头推».',
    },
    slip: { jiu: '就 slip', ba: '把 slip' },
    soft: { tacPron: 'Say who: «打它»' },
    gloss: { 时候: 'time (…的时候 = when …)', 躲: 'hide', 后面: 'behind', 石头: 'rock / stone', 推倒: 'push over', 它: 'it', 就: 'then (一…就 = as soon as)', 怎么: 'how',
      知道: 'know', 出来: 'come out', 听: 'listen', 练: 'practice', 之前: 'before', 先: 'first', 说: 'say', 做: 'do', 什么: 'what', 听到: 'heard', 所以: 'so', 对: 'to / right',
      轮到: 'turn comes to', 用: 'use', 听懂: 'understand (by ear)', 哎呀: 'oops', 好好: 'carefully', 看: 'look', 把: '(what’s acted on comes first)', 结果: 'result', 倒: 'over / fall',
      哎哟: 'ouch', 哪: 'which', 块: '(measure word: a rock)', 要: 'going to', 动: 'move', 会: 'will', 今天: 'today', 现在: 'now', 然后: 'then', 就是: 'is exactly', 那个: 'that',
      时间: 'time', 也: 'also', 可以: 'can', 一: 'one (一…就 = as soon as)', 去: 'go', 吗: '(question)' },
  };
  LX.ja = {
    leap: ['[跳|と]ぶ ぞ ！', 'I’m gonna jump!'], go: ['えいっ ！', 'Hyah!'], hide: ['[岩|いわ] の [後|うし]ろ に [隠|かく]れる ぞ ！', 'I’m hiding behind the rock!'],
    out: ['[出|で]て きた ぞ ！', 'I’m out!'], ouch: ['いてっ ！ なんで わかった ？', 'Ow! How did you know?'], rockHit: ['おれ の [岩|いわ] ！', 'My rock!'],
    noLeap: ['[跳|と]ばない の ？', 'It’s not jumping?'], behind: ['[岩|いわ] の [後|うし]ろ だ ！', 'It’s behind the rock!'], noRock: ['どの [岩|いわ] ？', 'Which rock?'],
    exA: ['[跳|と]んだら 、 [叩|たた]いて ！', 'When it jumps, hit it!'],
    aHello: ['[今日|きょう] は [聞|き]く [練習|れんしゅう] です 。 だまりっこ は [動|うご]く [前|まえ] に 、 [何|なに] を する か [言|い]います 。', 'Today we practice listening. Before hushlings move, they say what they’ll do.'],
    aDemo: ['[聞|き]こえました か ？ 「 [跳|と]ぶ ぞ 」 。 だから {mimo} に こう [言|い]います 。 「 [跳|と]んだら 、 [叩|たた]いて ！ 」', 'Did you hear? “I’m gonna jump.” So I tell {name} this: “When it jumps, hit it!”'],
    aWhy: ['[跳|と]んだ に 「 ら 」 を つける と 、 「 [跳|と]んだら 」 。 「 [跳|と]んだ とき 」 と いう [意味|いみ] です 。', 'Add «ら» to «跳んだ» (jumped) and you get «跳んだら»: “when it jumps / once it has jumped”.'],
    aYou: ['[今度|こんど] は あなた の [番|ばん] です 。 かかし の [言葉|ことば] を よく [聞|き]いて 、 [使|つか]って ください 。', 'Now it’s your turn. Listen closely to the dummy’s words and use them.'],
    aGot: ['そう です ！ ちゃんと [聞|き]こえました ね ！', 'That’s it! You heard it right!'],
    aMissed: ['あっ 、 [跳|と]ばれました ！ よく [聞|き]いて 、 [使|つか]って ください 。', 'Ah, it jumped! Listen closely and use it.'],
    aHide: ['[見|み]て ！ [岩|いわ] の [後|うし]ろ に [隠|かく]れました 。 [攻撃|こうげき] が [届|とど]きません 。 {mimo} に 「 [岩|いわ] を [押|お]して ！ 」 と [言|い]って ください 。', 'Look! It hid behind the rock. Attacks won’t reach it. Tell {name}: “Push the rock!”'],
    aRockWhy: ['[押|お]す もの に は 「 を 」 ： [岩|いわ] を [押|お]して 。', 'What you push takes «を»: 岩を押して.'],
    tips: {
      tellLeap: 'It said what it’s going to do! Use it: «跳んだら、叩いて！» (when it jumps, hit it) for a COUNTER ×2.',
      tellHide: 'It’s behind the rock: hits only do half. Push the rock over onto it: «岩を押して！» (×2).',
    },
    why: {
      tara: 'The tara-form is the past form + ら: 跳ぶ → 跳んだ → «跳んだら» (not «跳ぶたら»).',
      wo: 'What you act on takes を: «岩を押して».',
    },
    slip: { tara: 'たら slip' },
    soft: { tacWo: 'を dropped', tacPron: 'Say who' },
    gloss: { 跳ぶ: 'jump', 跳んだら: 'when it jumps', 岩: 'rock', 後ろ: 'behind', 隠れる: 'hide', 出て: 'come out', わかった: 'knew / understood', 聞く: 'listen', 練習: 'practice',
      動く: 'move', 前: 'before', 何: 'what', 言います: 'say', 聞こえました: 'could hear', だから: 'so', こう: 'like this', 叩いて: 'hit', 今度: 'this time', 番: 'turn',
      言葉: 'words', よく: 'closely', 使って: 'use', ちゃんと: 'properly', 見て: 'look', 攻撃: 'attack', 届きません: 'won’t reach', 押して: 'push', 意味: 'meaning',
      つける: 'attach', とき: 'when / time', 隠れました: 'hid', 跳ばれました: 'it jumped (on us)', いてっ: 'ow', なんで: 'why / how', 跳ばない: 'not jumping' },
  };
  // the slips' names, the why's and the glosses join the battle language's own tables (without overwriting any)
  T.mergeLang = () => {
    for (const [code, t] of Object.entries(LX)) {
      const L = _.LANGS && _.LANGS[code]; if (!L) continue;
      L.slip = Object.assign({}, t.slip || {}, L.slip || {});
      L.soft = Object.assign({}, t.soft || {}, L.soft || {});
      L.why = Object.assign({}, t.why || {}, L.why || {});
      L.gloss = Object.assign({}, t.gloss || {}, L.gloss || {});
    }
  };
  T.mergeLang();
})();

// ================================================================ A · Read their tells
// A foe says what it's about to do, at the start of your turn (one at a time, about every other turn; never a boss):
//   leap: «¡Voy a saltar!» It leaps at you in the foes' turn (2 ♥ if you don't duck ↓), unless your command counters it:
//         «¡Cuando salte, golpéalo!» · «Quando ele pular, bate nele!» · «Wenn er springt, schlag ihn!» · «它跳的时候，打它！» ·
//         «跳んだら、叩いて！»: Mimo waits, meets it in the air: COUNTER ×2, and it sits the next round out.
//   hide: «¡Me escondo detrás de la roca!» It hides behind a rock that drops in front of it: hits only do half, and it skips
//         attacking, until «¡Empuja la roca!» (×2: the rock tips onto it) or it comes out two rounds later. (Once Mimo knows push.)
// The «cuando» clause is graded on its own grammar (es: the subjunctive «salte»; pt: the future subjunctive «pular»; de: the
// verb at the end and er / sie / es; zh: 的时候 / 一…就; ja: the たら form), and the pronoun for who on its gender.
(() => {
  const _ = window.BATTLE._, P = _.P, T = _.tac, H = T.h;
  if (!T || !H) return;
  const X = () => _.flow;
  const CJ = () => (typeof CJK !== 'undefined' ? CJK : null);
  const nrm = P.nrm;
  const LEAPERS = ['hushling', 'hushbig', 'frog', 'kernel', 'popcorn', 'dummy'];
  const HIDERS = ['hushling', 'hushbig', 'beetle', 'armadillo', 'kernel', 'dummy'];

  // ---------------------------------------------------------------- reading the counter: es / pt
  const ROM = {
    es: {
      conj: [['tan', 'pronto', 'como'], ['en', 'cuanto'], ['cuando'], ['apenas']],
      ok: ['salte', 'brinque'], mood: ['salta', 'brinca', 'saltar', 'brincar', 'saltara', 'brincara', 'saltaria'], person: ['saltes', 'brinques', 'salten', 'brinquen', 'salto', 'brinco'],
      subj: { 'él': 'm', 'ella': 'f', el: 'm' }, verb: 'salte',
      // what's said to the one that told: «golpéalo», «salta sobre él»
      pronEnd: [['sobre', 'el'], ['sobre', 'ella'], ['encima', 'de', 'el'], ['encima', 'de', 'ella'], ['a', 'el'], ['a', 'ella'], ['encima']],
      pronG: n => (n === 'ella' ? 'f' : n === 'el' ? 'm' : null),
      clitic: { lo: 'm', la: 'f', le: null },
      says: { hit: g => (g === 'f' ? 'golpéala' : 'golpéalo'), jump: g => `salta sobre ${g === 'f' ? 'ella' : 'él'}`, push: g => (g === 'f' ? 'empújala' : 'empújalo') },
      subjSay: g => (g === 'f' ? 'ella' : 'él'),
    },
    pt: {
      conj: [['assim', 'que'], ['logo', 'que'], ['quando']],
      ok: ['pular', 'saltar'], mood: ['pula', 'salta', 'pule', 'salte', 'pulando', 'saltando', 'pulara'], person: ['pulares', 'pularem', 'pulo', 'pulou'],
      subj: { ele: 'm', ela: 'f' }, verb: 'pular',
      pronEnd: [['em', 'cima', 'dele'], ['em', 'cima', 'dela'], ['nele'], ['nela'], ['dele'], ['dela'], ['ele'], ['ela']],
      pronG: n => (/ela$/.test(n) ? 'f' : /ele$/.test(n) ? 'm' : null),
      clitic: {},
      says: { hit: g => `bate ${g === 'f' ? 'nela' : 'nele'}`, jump: g => `pula em cima ${g === 'f' ? 'dela' : 'dele'}`, push: g => `empurra ${g === 'f' ? 'ela' : 'ele'}`, throw: g => `joga ${g === 'f' ? 'nela' : 'nele'}` },
      subjSay: g => (g === 'f' ? 'ela' : 'ele'),
    },
  };
  function romWhen(text, ctx) {
    const x = X(), G = x.G, L = ctx.L, R = ROM[L.code];
    const t = H.toks(text);
    const hit = H.find(t, R.conj);
    if (!hit) return null;
    const ci = hit.k, cEnd = ci + hit.len, verbs = new Set(Object.values(L.verbs).flatMap(v => v.forms.map(nrm)));
    const isVerb = n => verbs.has(n) || Object.keys(R.clitic).some(c => n.endsWith(c) && verbs.has(n.slice(0, -c.length)));
    const all = R.ok.concat(R.mood, R.person);
    // the clause: from the connector to its comma; or, said first with no comma, through its verb (and who, after it)
    let wEnd;
    const whenFirst = ci === 0 || t.slice(0, ci).every(w => ctx.voc && ctx.voc.has(w.n) || w.n === 'mimo');
    if (whenFirst) {
      wEnd = t.length;
      for (let k = cEnd; k < t.length; k++) if (t[k].comma) { wEnd = k + 1; break; }
      if (wEnd === t.length) {
        const vk = t.findIndex((w, k) => k >= cEnd && H.match(w.n, all));
        if (vk < 0) return null;
        let k = vk + 1;
        while (k < t.length && !isVerb(t[k].n)) k++;
        wEnd = k;
      }
    } else wEnd = t.length;
    const W = t.slice(cEnd, wEnd), M = whenFirst ? t.slice(wEnd) : t.slice(0, ci);
    const vi = W.findIndex(w => H.match(w.n, all));
    if (vi < 0) return { ok: false, raw: text, reason: 'tac:whenVerb' };
    const vw = W[vi], vm = H.match(vw.n, all), errors = [], fixes = [];
    if (vm.typo) fixes.push('spelling');
    if (R.mood.map(nrm).includes(nrm(vm.form))) H.err(errors, 'mood');
    else if (R.person.map(nrm).includes(nrm(vm.form))) H.err(errors, 'person');
    // who: a pronoun (gender), or a kind / a color
    const subjT = W.filter((w, k) => k !== vi);
    let subj = null, subjG = null, subjFoes = null;
    if (subjT.length === 1 && R.subj[subjT[0].raw.toLowerCase()] !== undefined) { subj = 'pron'; subjG = R.subj[subjT[0].raw.toLowerCase()]; if (L.code === 'es' && subjT[0].raw.toLowerCase() === 'el') fixes.push('accent'); }
    else if (subjT.length) { subjFoes = H.byWords(subjT, ctx.foes); subj = 'np'; }
    return finishWhen({ text, ctx, L, errors, fixes, whenFirst, subj, subjG, subjFoes, subjText: H.text(text, subjT), conj: H.text(text, t.slice(ci, cEnd)).toLowerCase(), main: M, R });
  }
  // the order after the clause: who is a pronoun («golpéalo», «bate nele», «schlag ihn»), or anyone the parser can read
  function romMain(text, M, L, R) {
    let ts = M.slice(), g, pron = false, accent = false;
    while (ts.length && /^(y|e|entonces|ent[aã]o|luego|dann|so)$/.test(ts[0].n)) ts.shift();
    // a pronoun at the end of the first order («sobre él», «nele», «em cima dela», before «y luego…» if there's more;
    // «encima» alone just goes: «sáltale encima»)
    const conj = (L.conj || []).map(s => s.map(nrm)), cj = ts.findIndex((w, k) => k > 0 && conj.some(s => H.seq(ts, k, s)));
    const end = cj > 0 ? cj : ts.length;
    for (const seq of R.pronEnd) {
      const k = end - seq.length;
      if (k >= 1 && H.seq(ts, k, seq)) {
        const last = ts[end - 1], pg = R.pronG(last.n);
        if (pg) { g = pg; pron = true; }
        if (L.code === 'es' && last.n === 'el' && last.raw.toLowerCase() !== 'él') accent = true;
        ts = ts.slice(0, k).concat(ts.slice(end));
        break;
      }
    }
    // a clitic on the verb: golpéalo → golpea + lo
    const words = ts.map(w => w.raw);
    if (!pron && ts.length) {
      const verbs = new Set(Object.values(L.verbs).flatMap(v => v.forms.map(nrm)));
      for (const [c, cg] of Object.entries(R.clitic)) {
        const w = ts[0];
        if (w.n.length > c.length + 2 && w.n.endsWith(c) && verbs.has(w.n.slice(0, -c.length)) && !verbs.has(w.n)) {
          const base = [...Object.values(L.verbs).flatMap(v => v.forms)].find(f => nrm(f) === w.n.slice(0, -c.length));
          words[0] = base; g = cg; pron = true; break;
        }
        if (verbs.has(w.n) && w.n.endsWith(c) && w.n.length > c.length + 3) { g = cg; pron = true; break; }   // («golpéalo», «empújalo»: forms the parser has)
      }
    }
    return { text: words.join(' '), g, pron, accent };
  }

  // ---------------------------------------------------------------- reading the counter: de
  const DE = {
    conj: [['wenn'], ['sobald']], ok: ['springt', 'hüpft'], ending: ['springen', 'hüpfen', 'spring', 'springe', 'hüpf', 'hüpfe', 'springst', 'hüpfst', 'sprang', 'gesprungen'],
    subj: { er: 'm', sie: 'f', es: 'n' }, acc: { m: 'ihn', f: 'sie', n: 'es' },
    says: { hit: a => `schlag ${a}`, jump: a => `spring auf ${a}`, push: a => `schieb ${a}`, attack: a => `greif ${a} an` },
  };
  function deWhen(text, ctx) {
    const L = ctx.L, t = H.toks(text);
    const hit = H.find(t, DE.conj);
    if (!hit) return null;
    const ci = hit.k, cEnd = ci + 1, all = DE.ok.concat(DE.ending);
    const verbs = new Set(Object.values(L.verbs).flatMap(v => v.forms.map(nrm)));
    const whenFirst = ci === 0 || t.slice(0, ci).every(w => w.n === 'mimo' || (ctx.voc && ctx.voc.has(w.n)));
    let wEnd = t.length;
    if (whenFirst) {
      for (let k = cEnd; k < t.length; k++) if (t[k].comma) { wEnd = k + 1; break; }
      if (wEnd === t.length) { const vk = t.findIndex((w, k) => k >= cEnd && H.match(w.n, all)); if (vk < 0) return null; wEnd = vk + 1; while (wEnd < t.length && !verbs.has(t[wEnd].n) && t[wEnd].n !== 'dann') wEnd++; }
    }
    const W = t.slice(cEnd, wEnd), M = whenFirst ? t.slice(wEnd) : t.slice(0, ci);
    const vi = W.findIndex(w => H.match(w.n, all));
    if (vi < 0) return { ok: false, raw: text, reason: 'tac:whenVerb' };
    const errors = [], fixes = [], vm = H.match(W[vi].n, all);
    if (vm.typo) fixes.push('spelling');
    if (DE.ending.map(nrm).includes(nrm(vm.form))) H.err(errors, 'ending');
    if (vi !== W.length - 1) H.err(errors, 'order');
    const subjT = W.filter((w, k) => k !== vi);
    let subj = null, subjG = null, subjFoes = null;
    if (!subjT.length) H.err(errors, 'subject');
    else if (subjT.length === 1 && DE.subj[subjT[0].n]) { subj = 'pron'; subjG = DE.subj[subjT[0].n]; }
    else {
      subj = 'np'; subjFoes = H.byWords(subjT, ctx.foes);
      const a = subjT[0].n; if (/^(den|dem|des)$/.test(a)) H.err(errors, 'case');
    }
    // the order: «schlag ihn» (ihn / sie / es; «ihm» is the dative)
    let ts = M.slice(); while (ts.length && /^(dann|so|und)$/.test(ts[0].n)) ts.shift();
    let g = null, pron = false;
    const pi = ts.findIndex((w, k) => k > 0 && /^(ihn|sie|es|ihm)$/.test(w.n) && !(ts[k + 1] && /^(auf|an)$/.test(ts[k + 1].n) && w.n === 'ihm'));
    if (pi > 0) {
      const p = ts[pi].n; pron = true;
      g = p === 'ihn' ? 'm' : p === 'sie' ? 'f' : p === 'es' ? 'n' : null;
      if (p === 'ihm') H.err(errors, 'pronCase');
      const cut = pi > 1 && ts[pi - 1].n === 'auf' ? pi - 1 : pi;
      ts = ts.slice(0, cut).concat(ts.slice(pi + 1));
    }
    return finishWhen({ text, ctx, L, errors, fixes, whenFirst, subj, subjG, subjFoes, subjText: H.text(text, subjT), conj: t[ci].n, mainText: ts.map(w => w.raw).join(' '), mainG: g, mainPron: pron, de: true });
  }

  // ---------------------------------------------------------------- reading the counter: zh / ja (units, CJK.typed)
  const ZH = {
    jump: ['[跳|tiào]', '[蹦|bèng]', '[跳起来|tiào qǐ lái]'], de: '[的|de] [时候|shí hou]', shihou: '[时候|shí hou]', yi: '[一|yī]', jiu: '[就|jiù]', zai: '[再|zài]', deng: '[等|děng]', le: '[了|le]',
    ta: ['[它|tā]', '[他|tā]', '[她|tā]'],
    taOn: ['[到|dào] [它|tā] [身上|shēn shang]', '[到|dào] [它|tā] [上面|shàng miàn]', '[到|dào] [它|tā] [上|shàng]', '[它|tā] [身上|shēn shang]'],
    says: { hit: '[打|dǎ] [它|tā]', jump: '[跳|tiào] [到|dào] [它|tā] [身上|shēn shang]', push: '[推|tuī] [它|tā]' },
  };
  const JA = {
    ok: ['[跳|と]んだら', '[飛|と]んだら', 'ジャンプ したら', '[跳|と]ぶ とき', '[跳|と]ぶ [時|とき]', '[跳|と]んだ とき', 'ジャンプ する とき', '[跳|と]ぶ と'],
    bad: ['[跳|と]ぶたら', '[跳|と]びたら', '[跳|と]んたら', '[飛|と]ぶたら', 'ジャンプ するたら'],
    pron: ['あいつ を', 'そいつ を', 'それ を', 'あいつ', 'そいつ'],
  };
  const W = (src, l) => CJ().wordOf(src, l);
  // the first place one of the words starts at or after unit i: { i, j, src, homo, toneBad } or null
  function cjFind(U, list, l, from = 0, to = U.length) {
    for (let i = from; i < to; i++) for (const src of list) { const m = CJ().matchAt(W(src, l), U, i, l, { homo: true }); if (m && m.j <= to) return Object.assign({ i, src }, m); }
    return null;
  }
  // the units back to text (characters together, syllables / kana with spaces), without some ranges
  function cjText(U, ranges, l, marks) {
    let s = '';
    U.forEach((u, k) => {
      if (ranges.some(([a, b]) => k >= a && k < b)) return;
      if (marks && marks[k] && s) s += l === 'ja' ? '、' : ' ， ';           // (keep the commas: they split a combo)
      if (u.han || l === 'ja') s += u.raw;
      else s += (s && !/\s$/.test(s) ? ' ' : '') + u.raw + ' ';
    });
    return s.trim();
  }
  function zhWhen(text, ctx) {
    const C = CJ(); if (!C) return null;
    const { U, marks } = C.typed(text, 'zh');
    const errors = [], fixes = [];
    let span = null, style = null, wEnd;
    const d = cjFind(U, [ZH.de], 'zh'), sh = d ? null : cjFind(U, [ZH.shihou], 'zh');
    const yi = cjFind(U, [ZH.yi], 'zh');
    if (d) { span = [0, d.j]; style = 'de'; wEnd = d.j; }
    else if (sh) { span = [0, sh.j]; style = 'de'; wEnd = sh.j; H.err(errors, 'de'); }
    else if (yi && cjFind(U, ZH.jump, 'zh', yi.j, yi.j + 3)) {
      const v = cjFind(U, ZH.jump, 'zh', yi.j); style = 'yi'; span = [0, v.j]; wEnd = v.j;
      if (!cjFind(U, [ZH.jiu], 'zh', v.j, v.j + 1)) H.err(errors, 'jiu');
    } else return null;
    // it has to be about jumping
    const v = cjFind(U, ZH.jump, 'zh', 0, wEnd);
    if (!v) return { ok: false, raw: text, reason: 'tac:whenVerb' };
    if (v.homo) fixes.push('spelling'); if (v.toneBad) fixes.push('accent');
    // who (before the verb): 它, or a kind / a color
    const pre = [0, v.i];
    const taSubj = cjFind(U, ZH.ta, 'zh', 0, v.i);
    let subj = null, subjFoes = null;
    if (taSubj) subj = 'pron';
    else if (v.i > (style === 'yi' ? 1 : 0)) {
      const L = ctx.L, list = ctx.foes.filter(f => {
        const sp = L.species[f.species]; if (!sp) return false;
        const words = [sp.w].concat(sp.alt || []); return !!cjFind(U, words, 'zh', pre[0], pre[1]);
      });
      if (list.length) { subj = 'np'; subjFoes = list; }
    }
    // the order: after the clause, without 就 / 再 and «它»
    let m0 = wEnd; const skip = cjFind(U, [ZH.jiu, ZH.zai], 'zh', m0, m0 + 1); if (skip) m0 = skip.j;
    const cut = [[0, m0]]; let pron = false;
    for (let k = m0; k < U.length; k++) {
      const p = cjFind(U, ZH.taOn, 'zh', k, k + 1) || cjFind(U, ZH.ta, 'zh', k, k + 1);
      if (p) { cut.push([p.i, p.j]); pron = true; k = p.j - 1; }
    }
    const mainText = cjText(U, cut, 'zh', marks);
    return finishWhen({ text, ctx, L: ctx.L, errors, fixes, whenFirst: true, subj, subjG: null, subjFoes, subjText: '', mainText, mainG: null, mainPron: pron, zh: style });
  }
  function jaWhen(text, ctx) {
    const C = CJ(); if (!C) return null;
    const { U, marks } = C.typed(text, 'ja');
    const errors = [], fixes = [];
    let m = cjFind(U, JA.ok, 'ja'), bad = false;
    if (!m) { m = cjFind(U, JA.bad, 'ja'); bad = !!m; }
    if (!m) return null;
    if (bad) H.err(errors, 'tara');
    // who (before it): a kind
    let subj = null, subjFoes = null;
    if (m.i > 0) {
      const L = ctx.L, list = ctx.foes.filter(f => { const sp = L.species[f.species]; return sp && !!cjFind(U, [sp.w].concat(sp.alt || []), 'ja', 0, m.i); });
      if (list.length) { subj = 'np'; subjFoes = list; }
    }
    const cut = [[0, m.j]]; let pron = false;
    const p = cjFind(U, JA.pron, 'ja', m.j); if (p) { cut.push([p.i, p.j]); pron = true; }
    const mainText = cjText(U, cut, 'ja', marks);
    return finishWhen({ text, ctx, L: ctx.L, errors, fixes, whenFirst: true, subj, subjG: null, subjFoes, subjText: '', mainText, mainG: null, mainPron: pron, ja: true, jaSrc: m.src });
  }

  // ---------------------------------------------------------------- the clause and the order, together
  const teller = foes => foes.find(f => f.tell && f.tell.kind === 'leap' && f.alive && !f.gone) || null;
  function finishWhen(o) {
    const { ctx, L } = o;
    // the order, read by the parser (anything it reads: «golpea al rojo», «salta sobre la rana», and a description or a combo)
    let main = o.mainText != null ? { text: o.mainText, g: o.mainG, pron: o.mainPron } : romMain(o.text, o.main, L, o.R);
    if (main.accent) o.fixes.push('accent');
    if (!main.text.trim()) return { ok: false, raw: o.text, reason: 'noverb' };
    const sub = Object.assign({}, ctx, { tacNo: (ctx.tacNo || []).concat(['when', 'rock']) });
    const r = T.one(main.text, sub);
    if (!r || !r.ok) return Object.assign({}, r || {}, { ok: false, raw: o.text });
    if (r.kind !== 'command') return { ok: false, raw: o.text, reason: 'noverb' };
    const c = r.clauses[0], tel = teller(ctx.foes);
    // whom the clause is about: the one that told (a pronoun, or nothing), or the kind / color it names
    let about = tel;
    if (o.subj === 'np') about = o.subjFoes && o.subjFoes.length === 1 ? o.subjFoes[0] : o.subjFoes && tel && o.subjFoes.includes(tel) ? tel : (o.subjFoes || [])[0] || null;
    if (o.subj === 'pron' && about && o.subjG && o.subjG !== H.gender(about) && !(L.code === 'de' && o.subjG === 'f' && H.gender(about) === 'f')) H.err(o.errors, 'gender');
    // the order's target: «golpéalo» / «打它» / nothing said → the one the clause is about
    let filled = false;
    if (c.auto && about && H.attackVerb(c.verb)) {
      c.target = about; c.auto = false; filled = true;
      c.desc = Object.assign({ adjs: [], preps: [] }, c.desc || {}, { described: true });     // (the «cuando» clause says who: a missing pronoun is only a note)
      if (main.pron && main.g && main.g !== H.gender(about)) H.err(c.errors, 'gender');
      if (!main.pron && !L.cjk) c.soft = (c.soft || []).concat(['tacPron']);
    }
    c.errors.push(...o.errors); c.fixes.push(...o.fixes);
    c.tacWhen = { about, teller: tel, subj: o.subj };
    // the right sentence: the clause in its right form, then the order (who as a pronoun when it was one)
    const g = about ? H.gender(about) : 'm';
    let whenS, mainS;
    const pronMain = filled;
    const restC = r.clauses.slice(1).map(k => k.canon);
    if (L.code === 'es' || L.code === 'pt') {
      const R = o.R, who = o.subj === 'pron' ? R.subjSay(g) + ' ' : o.subj === 'np' ? o.subjText + ' ' : L.code === 'pt' ? R.subjSay(g) + ' ' : '';
      whenS = L.code === 'es' && o.subj === 'np' ? `${o.conj} ${R.verb} ${o.subjText}` : `${o.conj} ${who}${R.verb}`;
      const first = pronMain && R.says[c.verb] ? R.says[c.verb](g) : c.canon;
      mainS = [first].concat(restC).join(` ${L.joiner} `);
    } else if (L.code === 'de') {
      const who = o.subj === 'np' ? o.subjText : ({ m: 'er', f: 'sie', n: 'es' }[g]);
      whenS = `${o.conj} ${who} springt`;
      const first = pronMain && DE.says[c.verb] ? DE.says[c.verb](DE.acc[g]) : c.canon;
      mainS = [first].concat(restC).join(` ${L.joiner} `);
    } else if (L.code === 'zh') {
      whenS = o.zh === 'yi' ? '[它|tā] [一|yí] [跳|tiào]' : '[它|tā] [跳|tiào] [的|de] [时候|shí hou]';
      const first = pronMain && ZH.says[c.verb] ? ZH.says[c.verb] : c.canon;
      mainS = (o.zh === 'yi' ? '[就|jiù] ' : '') + [first].concat(restC).join(` ${L.joiner} `);
    } else {
      whenS = o.jaSrc && JA.ok.includes(o.jaSrc) ? o.jaSrc : '[跳|と]んだら';
      mainS = [c.canon].concat(restC).join(` ${L.joiner} `);
    }
    let canon;
    if (L.cjk) canon = `${whenS} ${o.zh === 'yi' ? '' : L.code === 'zh' ? '， ' : '、 '}${H.unwrap(mainS)} ！`;
    else if (o.whenFirst) canon = P.wrapS(L, `${whenS}, ${H.lc1(mainS)}`);
    else canon = P.wrapS(L, `${mainS}${L.code === 'de' ? ',' : ''} ${whenS}`);
    const errors = r.clauses.flatMap(k => k.errors), fixes = r.clauses.flatMap(k => k.fixes);
    return Object.assign(r, {
      raw: o.text, canon, errors, fixes, tac: 'A',
      recast: errors.length > 0 || fixes.length > 0 || r.recast,
      words: [...new Set(r.words.concat(['v.jump']))], patterns: [...new Set((r.patterns || []).concat(['when']))],
    });
  }

  // ---------------------------------------------------------------- «¡Empuja la roca!»
  const ROCK = {
    es: { nouns: { roca: 'f', piedra: 'f', 'peña': 'f' }, arts: { la: 'f', una: 'f', el: 'm', un: 'm' }, say: 'empuja la roca', link: ['a', 'al'] },
    pt: { nouns: { pedra: 'f', rocha: 'f' }, arts: { a: 'f', uma: 'f', o: 'm', um: 'm' }, say: 'empurra a pedra', link: ['na', 'no', 'em', 'pra'] },
    de: { nouns: { stein: 'm', felsen: 'm', fels: 'm' }, arts: { den: 'acc', einen: 'acc', der: 'nom', dem: 'dat', die: 'g', das: 'g', ein: 'nom' }, say: 'schieb den Stein' },
  };
  function rockLatin(text, ctx) {
    const L = ctx.L, R = ROCK[L.code]; if (!R) return null;
    const t = H.toks(text).filter(w => !(ctx.voc && ctx.voc.has(w.n)) && w.n !== 'mimo' && !L.fillers.map(nrm).includes(nrm(w.raw)));
    const ni = t.findIndex(w => H.match(w.n, Object.keys(R.nouns)));
    if (ni < 0) return null;
    const vi = t.findIndex(w => H.match(w.n, L.verbs.push ? L.verbs.push.forms : []));
    if (vi < 0 || vi > ni) return null;
    const errors = [], fixes = [], noun = H.match(t[ni].n, Object.keys(R.nouns));
    if (noun.typo) fixes.push('spelling');
    if (H.match(t[vi].n, L.verbs.push.forms).typo) fixes.push('spelling');
    const between = t.slice(vi + 1, ni);
    if (between.length > 2 || t.length > ni + 1) return null;          // (something else is going on: the parser reads it)
    const art = between.length ? between[between.length - 1].n : null, link = between.length > 1 ? between[0].n : null;
    if (L.code === 'de') {
      if (!art) fixes.push('article');
      else if (R.arts[art] === 'g') H.err(errors, 'gender');
      else if (R.arts[art] && R.arts[art] !== 'acc') H.err(errors, 'rockCase');
      else if (!R.arts[art]) return null;
    } else {
      if (art && (R.link || []).includes(art) && between.length === 1) { H.err(errors, 'rockA'); if (art === 'al' || art === 'no') H.err(errors, 'gender'); }
      else if (!art) fixes.push('article');
      else if (R.arts[art] === undefined) return null;
      else if (R.arts[art] !== R.nouns[noun.form]) H.err(errors, 'gender');
      if (link && (R.link || []).includes(link)) H.err(errors, 'rockA');
    }
    return rockResult(text, ctx, errors, fixes, R.say);
  }
  function rockCJ(text, ctx) {
    const C = CJ(), l = ctx.L.code; if (!C) return null;
    const { U } = C.typed(text, l), errors = [], fixes = [];
    if (l === 'zh') {
      const n = cjFind(U, ['[石头|shí tou]', '[石块|shí kuài]', '[岩石|yán shí]', '[大石头|dà shí tou]'], 'zh');
      const v = cjFind(U, ['[推倒|tuī dǎo]', '[推开|tuī kāi]', '[推翻|tuī fān]', '[推|tuī]'], 'zh');
      if (!n || !v) return null;
      if (n.homo || v.homo) fixes.push('spelling'); if (n.toneBad || v.toneBad) fixes.push('accent');
      const ba = cjFind(U, ['[把|bǎ]'], 'zh', 0, n.i);
      if (ba && v.src === '[推|tuī]' && !cjFind(U, ['[一下|yí xià]', '[倒|dǎo]', '[开|kāi]'], 'zh', v.j)) H.err(errors, 'ba');
      return rockResult(text, ctx, errors, fixes, '[把|bǎ] [石头|shí tou] [推倒|tuī dǎo]');
    }
    const n = cjFind(U, ['[岩|いわ]', '[石|いし]', '[大|おお]きい [岩|いわ]'], 'ja');
    const v = cjFind(U, ['[押|お]して', '[押|お]せ', '[押|お]し[倒|たお]して', '[押|お]す', '[押|お]します', '[押|お]しって', '[押|お]すて'], 'ja');
    if (!n || !v || v.i < n.j) return null;
    if (['[押|お]す', '[押|お]します', '[押|お]しって', '[押|お]すて'].includes(v.src)) H.err(errors, 'teForm');
    const wo = cjFind(U, ['を', 'お'], 'ja', n.j, n.j + 1);
    const res = rockResult(text, ctx, errors, fixes, '[岩|いわ] を [押|お]して');
    if (res.ok && !wo) res.clauses[0].soft = ['tacWo'];
    return res;
  }
  function rockResult(text, ctx, errors, fixes, say) {
    const x = X(), L = ctx.L;
    const f = ctx.foes.find(k => k.hiding) || null;
    if (!f) return { ok: false, raw: text, reason: 'tac:noRock' };
    const c = { verb: 'push', baseVerb: 'push', verbShow: L.verbs.push ? L.verbs.push.show : 'push', verbTok: { raw: '' }, target: f, rock: true, auto: false,
      desc: { described: true, adjs: [], preps: [], noun: null }, errors: errors.slice(), fixes: fixes.slice(), words: ['v.push'], untaught: [], canon: say, soft: [] };
    const canon = L.cjk ? say + ' ！' : P.wrapS(L, say);
    return { ok: true, kind: 'command', raw: text, clauses: [c], canon, errors, fixes, eat: false, recast: errors.length > 0 || fixes.length > 0, words: ['v.push'], untaught: [], patterns: ['rock'], tac: 'A' };
  }
  T.single.push({ k: 'A', id: 'when', fn: (text, ctx) => (ctx.L.code === 'de' ? deWhen(text, ctx) : ctx.L.code === 'zh' ? zhWhen(text, ctx) : ctx.L.code === 'ja' ? jaWhen(text, ctx) : ROM[ctx.L.code] ? romWhen(text, ctx) : null) });
  T.single.push({ k: 'A', id: 'rock', fn: (text, ctx) => (ctx.L.cjk ? rockCJ(text, ctx) : rockLatin(text, ctx)) });

  T.explainHooks.push(r => {
    const x = X();
    if (r.reason === 'tac:noRock') { x.setMood(x.A.mimo, 'confused', 1.4); const [t, en] = H.line('noRock'); x.say(x.A.mimo, t, { cls: 'mimo', en, dur: 1.6 }); x.UI.hint('There’s no rock here right now. A foe hides behind one when it says so.', true); return true; }
    if (r.reason === 'tac:whenVerb') { x.setMood(x.A.mimo, 'confused', 1.4); x.mimoLine('noverb', 1.6); x.UI.hint('In the «when» part, say what it said it would do: it jumps.', true); return true; }
    return false;
  });

  // ---------------------------------------------------------------- the grade and the moves
  T.judgeHooks.push(r => {
    for (const c of r.clauses || []) {
      if (c.rock) {
        Object.assign(c, { armored: false, curled: false, flip: false, heavy: false, belly: false, clang: false, bounce: false });
        c.need = Math.min(c.need || 2, 2); c.gap = 0; c.suggest = null;
        c.tacMult *= 2; c.tacSub = 'ROCK ×2'; c.tacRun = rockRun;
        continue;
      }
      if (c.tacWhen) {
        const w = c.tacWhen, f = w.teller;
        if (f && c.target === f && H.attackVerb(c.verb) && f.tell && f.tell.kind === 'leap') { c.tacMult *= 2; c.tacSub = 'COUNTER ×2'; c.tacRun = counterRun; c.need = Math.min(c.need || 2, 2); c.gap = 0; c.suggest = null; }
        else c.tacRun = waitRun;
      }
      if (c.target && c.target.hiding && !c.rock && H.attackVerb(c.verb)) { c.tacMult *= 0.5; c.tacSub = c.tacSub || 'BEHIND THE ROCK'; }
    }
  });

  // a rock, dropped in front of one that hides (gray, lumpy, two stones)
  function makeRock(x0, z0) {
    const g = new THREE.Group();
    const a = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), TK.toon('#a39b8e', { rim: 0.2 }));
    a.scale.set(0.5, 0.44, 0.42); a.position.y = 0.38; a.rotation.set(0.3, 0.7, 0.15); g.add(a);
    const b = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), TK.toon('#8c8578', { rim: 0.12 }));
    b.scale.set(0.22, 0.18, 0.2); b.position.set(-0.3, 0.14, 0.24); g.add(b);
    g.position.set(x0, 0, z0);
    return X().ST.prop(g);
  }
  const eligible = (f, G) => f.alive && !f.gone && !f.calmed && !f.shy && !f.hidden && !f.floating && !f.down && !f.flipped && !f.hiding && !f.isBoss
    && !(f.spec && (f.spec.giant || f.spec.queen)) && !f.states.has('asleep') && !f.noAuto && (!G.practice || f.species === 'dummy');
  // the start of your turn: one of them says what it'll do
  async function tellTurn() {
    const x = X(), G = x.G;
    if (!T.on('A')) return;
    if (G.foes.some(f => f.alive && !f.gone && f.tell)) return;
    const lesson = G.tacLesson && G.tacLesson.k === 'A' ? G.tacLesson : null;
    if (!lesson && (G.turn < 2 || bossFight(G))) return;
    const want = G.auto && G.auto.tell !== undefined ? G.auto.tell : lesson ? lesson.next : null;
    if (want === false) return;
    if (!want && Math.random() > 0.5) return;
    const knowsPush = x.knows('v.push');
    const list = x.targetable().filter(f => eligible(f, G));
    const leap = list.filter(f => LEAPERS.includes(f.species)), hide = knowsPush ? list.filter(f => HIDERS.includes(f.species)) : [];
    let kind = want === 'leap' || want === 'hide' ? want : !hide.length ? 'leap' : !leap.length ? 'hide' : Math.random() < 0.65 ? 'leap' : 'hide';
    if (kind === 'hide' && !hide.length) kind = 'leap';
    if (kind === 'leap' && !leap.length) kind = hide.length ? 'hide' : null;
    if (!kind) return;
    const pool = kind === 'leap' ? leap : hide, f = pool[Math.floor(Math.random() * pool.length)];
    await announce(f, kind);
  }
  function bossFight(G) { return !!(G.boss || G.arma || G.bossId); }
  async function announce(f, kind) {
    const x = X(), G = x.G;
    x.ST.shot('action', f, x.A.mimo, { yaw: 0.05, up: 0.25 });
    x.setMood(f, 'go', 1.8);
    x.squash(f, 0.88, 1.16, 0.08);
    if (G.practice) x.tween(x.A.coach, { point: 1 }, 0.15).then(() => x.wait(0.9)).then(() => x.tween(x.A.coach, { point: 0 }, 0.3));
    if (kind === 'leap') {
      f.tell = { kind: 'leap', turn: G.turn };
      const t = H.foeSay(f, 'leap', { dur: 4.2 });
      x.emit('shout', { text: t, high: true, foe: f, tell: 'leap' });
      H.pop(f, '!', { color: '#ffd166', size: 40, rise: 0.3, life: 1.2 });
      await x.wait(1.0);
      H.tip('tellLeap');
    } else {
      f.tell = null;
      const t = H.foeSay(f, 'hide', { dur: 4.2 });
      x.emit('shout', { text: t, high: false, foe: f, tell: 'hide' });
      await x.wait(0.5);
      await hideBehind(f);
      H.tip('tellHide');
    }
    x.ST.shot('wide');
  }
  async function hideBehind(f) {
    const x = X(), G = x.G;
    const rx = f.hx - (f.radius || 0.45) - 0.55, rz = f.hz + 0.12;
    const g = makeRock(rx, rz);
    g.position.y = 3.2; x.emit('drop');
    await x.tween(g.position, { y: 0 }, 0.32, 'in');
    x.ST.S.fx.puff(rx, 0.05, rz, 7, 0.2, '#cfc6b6'); x.ST.shake(0.25, 0.25);
    f.hiding = { g, turns: 2, x0: f.hx };
    G.tacRocks.push(g);
    f.hx += 0.3;
    await x.arcTo(f, f.hx, f.baseY || 0, f.hz, 0.3, 0.4);
    await x.tween(f, { sx: 1.1, sy: 0.74 }, 0.15);
  }
  async function comeOut(f, quiet) {
    const x = X(), h = f.hiding; if (!h) return;
    f.hiding = null;
    if (!f.alive || f.gone) { x.ST.dropProp(h.g); return; }
    if (!quiet) H.foeSay(f, 'out', { cls: 'foe', dur: 1.6 });
    f.hx = h.x0;
    await x.tween(f, { sx: 1, sy: 1 }, 0.12);
    await x.arcTo(f, f.hx, f.baseY || 0, f.hz, 0.32, 0.5);
    x.tween(h.g.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.3, 'in').then(() => x.ST.dropProp(h.g));
    x.ST.S.fx.puff(h.g.position.x, 0.2, h.g.position.z, 5, 0.16, '#cfc6b6');
  }
  // the foes' turn: one that told you it'd leap goes first; one behind a rock, or dazed, sits out
  async function attackersHook(list) {
    const x = X(), G = x.G;
    let out = list.filter(f => !f.hiding && !f.tacDazed);
    for (const f of G.foes) if (f.tacDazed && f.alive && !f.gone) {
      f.tacDazed = 0;
      const top = x.ST.worldOf(f, 'top'); x.UI.pop(top, '✦ ✦ ✦', G.t, { color: '#fff3a0', size: 22, rise: 0.35, life: 1.1 }); x.ST.star(top, '#fff3a0', 0.5);
      await x.wait(0.45);
    }
    const lp = G.foes.find(f => f.alive && !f.gone && f.tell && f.tell.kind === 'leap');
    if (lp) { if (lp.down || lp.flipped || lp.hiding || lp.states.has('asleep')) lp.tell = null; else out = [lp].concat(out.filter(f => f !== lp)).slice(0, 2); }
    return out;
  }
  // it leaps at you: a big crouch, a high arc, down on your head (duck ↓); 2 ♥ if it lands
  async function leapAttack(f) {
    const x = X(), G = x.G, A = x.A;
    f.tell = null;
    const tgt = Math.random() < 0.5 ? A.mimo : A.you;
    x.setMood(f, 'go');
    x.ST.shot('action', f, tgt, { yaw: 0.04, up: 0.4 });
    const t = H.foeSay(f, 'go', { dur: 1.8 });
    x.emit('shout', { text: t, high: true, foe: f });
    x.dodgeHint(true);
    x.turnTo(f, x.yawTo(f, tgt.x, tgt.z), 0.15);
    await x.tween(f, { sx: 1.32, sy: 0.68, lean: -0.2 }, 0.3, 'out');
    x.emit('windup', { foe: f, high: true });
    const dur = 0.9, T0 = G.t + dur;
    const tp = x.timingWindow(T0, 'ArrowDown', () => x.ST.worldOf(tgt, 'mid'), { onPress: code => x.dodgeMove(tgt, code) });
    const x0 = f.x, z0 = f.z, y0 = f.y, ex = tgt.x + 0.6, ez = tgt.z + 0.05, top = tgt.kind === 'you' ? 1.3 : 0.8;
    x.emit('jump');
    x.tween(f, { sx: 0.84, sy: 1.22, lean: 0 }, 0.12);
    await x.along(dur, u => { f.x = lerp(x0, ex, u); f.z = lerp(z0, ez, u); f.y = lerp(y0, top, u) + Math.sin(Math.PI * u) * 2.0; f.lean = 0.5 * u; });
    const grade = await tp;
    x.dodgeResult(f, tgt, grade, 2);
    x.ST.shake(0.35, 0.3);
    f.lean = 0; f.sx = 1; f.sy = 1;
    await x.along(0.22, u => { f.x = lerp(ex, ex + 0.4, u); f.y = Math.max(f.baseY || 0, top * (1 - u)); });
    await x.hopHome(f, 1.0, 0.5);
    x.turnTo(f, f.baseYaw, 0.2);
    x.setMood(f, 'idle');
    if (f.hp <= 0) { await x.defeat(f); return; }
    x.refreshLabels();
    if (G.tacLesson && G.tacLesson.k === 'A') { G.tacLesson.missed = (G.tacLesson.missed || 0) + 1; await H.coach('aMissed'); }
  }
  // the counter: Mimo waits, ears up; it leaps as it said it would; Mimo meets it in the air (×2), and it lands dazed
  async function counterRun(c) {
    const x = X(), G = x.G, M = x.A.mimo, f = c.target;
    f.tell = null;
    x.setMood(M, 'listen', 1.4);
    x.say(M, '…', { cls: 'mimo', dur: 0.9 });
    x.ST.shot('action', M, f, { yaw: -0.06, up: 0.3 });
    await x.wait(0.5);
    H.foeSay(f, 'go', { dur: 1.3 });
    x.emit('jump');
    await x.tween(f, { sx: 1.25, sy: 0.75 }, 0.16);
    x.tween(f, { sx: 0.86, sy: 1.18 }, 0.1);
    const x0 = f.x, z0 = f.z, y0 = f.y, mx = lerp(x0, M.x, 0.42), mz = lerp(z0, M.z, 0.42);
    await x.along(0.4, u => { f.x = lerp(x0, mx, u); f.z = lerp(z0, mz, u); f.y = y0 + Math.sin(Math.PI * 0.5 * u) * 1.4; });
    G.hitstop = 0.08;
    H.pop(f, 'COUNTER!', { color: '#ffd166', size: 36, dy: 0.5 });
    x.emit('counter');
    G.stats.counters = (G.stats.counters || 0) + 1;
    G.stats.tells = (G.stats.tells || 0) + 1;
    await x.MOVES[c.verb](c);
    if (f.alive && !f.gone) {
      await x.tween(f, { y: f.baseY || 0 }, 0.22, 'in');
      x.squashFoe(f, 1.3, 0.7); x.ST.S.fx.puff(f.x, 0.05, f.z, 6, 0.18);
      f.tacDazed = 1;
      H.foeSay(f, 'ouch', { cls: 'foe', dur: 2.0 });
      await x.hopHome(f, 0.6, 0.45);
    }
    const L = G.tacLesson;
    if (L && L.k === 'A' && !c.demo) { L.got = (L.got || 0) + 1; if (T.learn('A')) learnedBanner('A'); }
  }
  // a «cuando» with nothing to wait for: Mimo waits… and moves anyway
  async function waitRun(c) {
    const x = X(), M = x.A.mimo;
    x.setMood(M, 'listen', 1.2);
    x.say(M, '…', { cls: 'mimo', dur: 0.8 });
    await x.wait(0.6);
    const [t, en] = H.line('noLeap'); x.say(M, t, { cls: 'mimo', en, dur: 1.4 });
    x.setMood(M, 'confused', 1.0);
    await x.wait(0.5);
    await x.MOVES[c.verb](c);
  }
  // the rock: Mimo runs to it and shoves; it tips over onto the one behind it (×2), and crumbles
  async function rockRun(c) {
    const x = X(), G = x.G, M = x.A.mimo, f = c.target, h = f.hiding;
    if (!h) return x.MOVES.push(c);
    const R = h.g.position;
    x.setMood(M, 'go');
    x.ST.shot('action', M, f, { yaw: -0.1, up: 0.1 });
    x.turnTo(M, x.yawTo(M, R.x, R.z), 0.1);
    await x.arcTo(M, R.x - 0.62, 0, R.z, 0.36, 0.35);
    const T0 = G.t + 0.55, gp = x.timingWindow(T0, 'Space', () => x.ST.worldOf(f, 'top'));
    await x.tween(M, { lean: 0.55, sx: 1.18, sy: 0.86 }, 0.4, 'io');
    x.emit('push');
    const rx = R.x, rz = R.z;
    await x.along(0.3, u => { h.g.rotation.z = -u * 1.5; h.g.position.x = rx + u * 0.55; h.g.position.y = Math.sin(u * Math.PI) * 0.25; });
    const grade = await gp;
    G.stats.tells = (G.stats.tells || 0) + 1;
    await x.land(c, 2, grade, x.ST.worldOf(f, 'mid'), false, { knock: 0.2 });
    if (f.alive && !f.gone) H.foeSay(f, 'rockHit', { cls: 'foe', dur: 1.8 });
    x.ST.S.fx.puff(h.g.position.x, 0.3, h.g.position.z, 12, 0.24, '#cfc6b6'); x.ST.shake(0.3, 0.3);
    x.tween(h.g.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.25, 'in').then(() => x.ST.dropProp(h.g));
    f.hiding = null; f.hx = h.x0;
    if (f.alive && !f.gone) { f.tacDazed = 1; x.tween(f, { sx: 1, sy: 1 }, 0.15); x.hopHome(f, 0.5, 0.4); }
    await x.tween(M, { lean: 0, sx: 1, sy: 1 }, 0.15);
    await x.hopHome(M, 0.8, 0.45);
    x.setMood(M, 'idle');
    const L = G.tacLesson;
    if (L && L.k === 'A') L.rock = (L.rock || 0) + 1;
  }
  function learnedBanner(k) {
    const x = X(), G = x.G;
    x.UI.toast(`★ New battle skill: ${T.INFO[k].name}! It’s on in fights from now on.`, G.t, 3.2);
    x.emit('learn', { id: 'tac.' + k });
  }
  T.learnedBanner = learnedBanner;

  T.beginHooks.push(() => { const G = X().G; for (const f of G.foes) { f.tell = null; f.hiding = null; f.tacDazed = 0; } });
  T.turnHooks.push(tellTurn);
  T.afterHooks.push(async () => {
    const G = X().G;
    for (const f of G.foes) if (f.hiding) { if (!f.alive || f.gone) await comeOut(f, true); else if (--f.hiding.turns <= 0) await comeOut(f); }
  });
  T.attackers = attackersHook;
  T.foeAttack = async f => { if (f.tell && f.tell.kind === 'leap' && T.on('A')) { await leapAttack(f); return true; } if (f.hiding) return true; return false; };

  // ---------------------------------------------------------------- the lesson at the yard (focus 'tac:A')
  T.specsHooks.push((specs, opts) => {
    if (!opts.practice || opts.focus !== 'tac:A') return;
    const x = X();
    specs.length = 0;
    for (const s of [{ kind: 'dummy', color: 'red', size: 'small', hp: 9 }, { kind: 'dummy', color: 'blue', size: 'small', hp: 9 }]) specs.push(x.normFoe(s, specs.length));
  });
  // A practice turn loop for the lessons: a tell (or whatever the lesson sets up) before each turn, your command, the coach's
  // word, then the dummies do what they said (leap: no harm in practice) and come out from behind their rocks.
  T.lessonLoop = async (x, G, o = {}) => {
    for (;;) {
      G.turn++;
      x.refreshLabels();
      if (o.before) await o.before();
      await T.turn();
      const r = await x.askOrFlee('command');
      await x.perform(r);
      x.practiceFeedback(r);
      if (G.tacOut) return G.tacOut;
      if (o.after) await o.after(r);
      if (x.allDone()) return 'win';
      for (const f of await T.attackers(x.targetable().filter(k => k.tell))) { if (f.tell && f.tell.kind === 'leap') await leapAttack(f); }
      if (x.allDone()) return 'win';
      await T.afterFoes();
    }
  };
  T.lessons.A = async (x, G) => {
    await x.intro();
    x.ST.shot('coach');
    await H.coach('aHello');
    // the demonstration: a dummy says it, Bruno says the counter, Mimo does it
    const d = G.foes.find(f => f.alive);
    G.tacLesson = { k: 'A', next: 'leap' };
    await announce(d, 'leap');
    await H.coach('aDemo');
    const c = { verb: 'hit', baseVerb: 'hit', target: d, power: 1, tacMult: 2, tacSub: 'COUNTER ×2', errors: [], fixes: [], words: [], desc: { described: true }, demo: true };
    const auto0 = G.auto;
    G.auto = Object.assign({}, auto0 || {}, { timing: 'perfect' });   // (Mimo shows it: nothing to press)
    try { await counterRun(c); } finally { G.auto = auto0; }
    d.hp = d.maxHp;                                    // (the demonstration's hit doesn't count)
    x.refreshLabels();
    await H.coach('aWhy');
    await H.coach('aYou');
    let hideShown = false;
    for (;;) {
      x.setupScaffolds();
      x.UI.rung(`Skill · read their tells: <b>«${x.UI.esc(H.plain(H.line('exA')[0]))}»</b>`);
      G.roundLog0 = G.stats.gradeLog.length;
      await T.lessonLoop(x, G, {
        before: async () => {
          const L = G.tacLesson;
          L.next = L.got && x.knows('v.push') && !hideShown ? 'hide' : 'leap';
        },
        after: async () => {
          const L = G.tacLesson;
          if (L.got === 1 && !L.cheered) { L.cheered = true; await H.coach('aGot'); }
          if (L.next === 'hide' && (L.rock || x.targetable().some(f => f.hiding))) hideShown = true;
        },
      });
      await x.practiceCheer();
      if (!(await x.practiceCard())) break;
      G.round++;
      await newDummies(x, G, 2);
    }
    x.ST.shot('coach');
    await x.coachSay('pDone');
    return 'done';
  };
  // the yard's second hide lesson line, before the first rock: Bruno points at it
  T.turnHooks.push(async () => {
    const x = X(), G = x.G, L = G.tacLesson;
    if (!L || L.k !== 'A' || L.hideTold) return;
    if (x.targetable().some(f => f.hiding)) { L.hideTold = true; await H.coach('aHide'); await H.coach('aRockWhy'); }
  });
  // new dummies for another round of a lesson
  async function newDummies(x, G, n, specs) {
    x.UI.tip(null); x.UI.tagRemove('');
    for (const f of G.foes) { x.UI.labelRemove(f); x.ST.S.scene.remove(f.h.root, f.shadow); if (f.hiding) x.ST.dropProp(f.hiding.g); }
    G.foes.length = 0;
    const colors = x.shuffle(['red', 'blue', 'green', 'yellow', 'white']).slice(0, n);
    const list = (specs || colors.map(c => ({ kind: 'dummy', color: c, size: 'small', hp: 9 }))).map((s, i) => x.normFoe(s, i));
    x.ST.addFoes(list, x.ST.rowSpots(list.length)).forEach(f => { f.id = G.nextId++; f.hp = f.maxHp = f.spec.hp; f.hidden = true; });
    G.lastKey = null; G.glow = null;
    x.ST.shot('coach');
    await x.coachSay('pRound');
    x.ST.shot('wide');
    await x.foesEnter();
  }
  T.newDummies = newDummies;
  T.leapAttack = leapAttack; T.announce = announce; T.comeOut = comeOut;
})();

// ================================================================ D · Pick your target by description
// Some fights (about half, once D is learned) bring a look-alike squad: two or three of a kind, all one color, told apart by
//   shield: they carry round shields (a whole one halves a hit: SHIELD); one is cracked (no shield: ×1.5). Say which by what
//           it has: «al que tiene el escudo roto» · «no que tem o escudo quebrado» · «den mit dem kaputten Schild» ·
//           «盾牌破了的» · «盾が壊れているの».
//   size:   three sizes; the biggest (👑) is their boss: beat it and the rest run off. «al más grande» · «no maior» ·
//           «den größten» · «最大的» · «一番大きいの» (and the smallest: «el más pequeño»…).
// Reading: the description is swapped for a color word the parser knows (in the right form), the parser reads the sentence
// among the foes the description fits (so its own checks of articles, «a», cases and 的 still apply), and the canon gets the
// description back. Grade: the special one picked any other way is an A («Say what makes it different»), with Mimo's
// suggestion; the description's own grammar (que / tiene / roto · tem / maior · mit dem kaputten / -sten · 最…的 · 一番) slips.
(() => {
  const _ = window.BATTLE._, P = _.P, T = _.tac, H = T && T.h;
  if (!T || !H) return;
  const X = () => _.flow;
  const CJ = () => (typeof CJK !== 'undefined' ? CJK : null);
  const nrm = P.nrm;
  const KINDS = ['hushling', 'frog', 'beetle', 'kernel', 'dummy'];

  Object.assign(T.LX.es, {
    chipShield: 'escudo', chipBroken: 'escudo roto',
    dHello: ['¡Hoy, a describir! Cuando son iguales, dile a {name} cómo es el que quieres.', 'Today: describing! When they look the same, tell {name} what the one you want is like.'],
    dDemo: ['Mira: los tres son iguales, pero este tiene el escudo roto. «¡Golpea al que tiene el escudo roto!»', 'Look: all three look the same, but this one has a broken shield. “Hit the one that has the broken shield!”'],
    dWhy: ['«El que tiene…»: para una rana, «la que tiene el escudo roto». Con «golpea»: «al que…», «a la que…».', '«El que tiene…» = the one that has… For a frog (feminine): «la que tiene…». With «golpea»: «al que…», «a la que…».'],
    dYou: ['¡Ahora tú! Los escudos enteros aguantan los golpes. Busca el roto.', 'Now you! Whole shields soak up hits. Find the broken one.'],
    dGot: ['¡Bien dicho! ¡Justo ese!', 'Well said! That very one!'],
    dSize: ['Ahora son de distintos tamaños. El más grande es el jefe: si cae, los demás huyen. «¡Golpea al más grande!»', 'Now they’re different sizes. The biggest one is the boss: if it falls, the rest run off. “Hit the biggest one!”'],
    dSizeWhy: ['«El más grande», «el más pequeño»: «más» y el adjetivo, que concuerda: «la más pequeña».', '«El más grande», «el más pequeño»: «más» + the adjective, which agrees: «la más pequeña».'],
    flee: ['¡El jefe cayó! ¡Corran!', 'The boss fell! Run!'],
    exD: ['¡Golpea al que tiene el escudo roto!', 'Hit the one that has the broken shield!'], exD2: ['¡Golpea al más grande!', 'Hit the biggest one!'],
  });
  Object.assign(T.LX.es.tips, {
    dShield: 'They look the same, but one has a broken shield (whole shields take only half). Say which by what it has: «al que tiene el escudo roto».',
    dSize: 'The biggest one (👑) is their boss: beat it and the rest run off. Say «al más grande» (or «al más pequeño»).',
  });
  Object.assign(T.LX.pt, {
    chipShield: 'escudo', chipBroken: 'escudo quebrado',
    dHello: ['Hoje, vamos descrever! Quando eles são iguais, diz pro {name} como é o que você quer.', 'Today we describe! When they look the same, tell {name} what the one you want is like.'],
    dDemo: ['Olha: os três são iguais, mas esse tem o escudo quebrado. «Bate no que tem o escudo quebrado!»', 'Look: all three look the same, but this one has a broken shield. “Hit the one that has the broken shield!”'],
    dWhy: ['«O que tem…»: «no que tem» é «em» + «o que tem». Pra uma mariposa: «na que tem…».', '«O que tem…» = the one that has… «no que tem» is «em» + «o que tem»; feminine: «na que tem…».'],
    dYou: ['Agora você! Escudo inteiro aguenta o golpe. Procura o quebrado.', 'Now you! A whole shield soaks up the hit. Find the broken one.'],
    dGot: ['Boa! Esse mesmo!', 'Nice! That very one!'],
    dSize: ['Agora eles têm tamanhos diferentes. O maior é o chefe: se ele cair, os outros fogem. «Bate no maior!»', 'Now they’re different sizes. The biggest is the boss: if it falls, the rest run. “Hit the biggest!”'],
    dSizeWhy: ['«O maior», «o menor»: não se diz «o mais grande».', '«O maior» (the biggest), «o menor» (the smallest): not «o mais grande».'],
    flee: ['O chefe caiu! Corre!', 'The boss fell! Run!'],
    exD: ['Bate no que tem o escudo quebrado!', 'Hit the one that has the broken shield!'], exD2: ['Bate no maior!', 'Hit the biggest one!'],
  });
  Object.assign(T.LX.pt.tips, {
    dShield: 'They look the same, but one has a broken shield (whole shields take only half). Say which by what it has: «no que tem o escudo quebrado».',
    dSize: 'The biggest one (👑) is their boss: beat it and the rest run off. Say «no maior» (or «no menor»).',
  });
  Object.assign(T.LX.de, {
    chipShield: 'Schild', chipBroken: 'kaputter Schild',
    dHello: ['Heute beschreiben wir! Wenn sie gleich aussehen, sag {name}, wie der aussieht, den du meinst.', 'Today we describe! When they look the same, tell {name} what the one you mean looks like.'],
    dDemo: ['Schau: Alle drei sehen gleich aus, aber diese hat einen kaputten Schild. „Schlag die mit dem kaputten Schild!“', 'Look: all three look the same, but this one has a broken shield. “Hit the one with the broken shield!”'],
    dWhy: ['„mit“ will den Dativ: „mit dem kaputten Schild“. Vorne steht der Artikel für die, die du meinst: den, die oder das.', '«mit» takes the dative: «mit dem kaputten Schild». In front goes the article for the one you mean: den, die or das.'],
    dYou: ['Jetzt du! Ganze Schilde halten die Schläge ab. Such den kaputten.', 'Now you! Whole shields block hits. Find the broken one.'],
    dGot: ['Gut gesagt! Genau die!', 'Well said! That very one!'],
    dSize: ['Jetzt sind sie verschieden groß. Die größte ist der Boss: Fällt sie, rennen die anderen weg. „Schlag die größte!“', 'Now they’re different sizes. The biggest one is the boss: if it falls, the others run off. “Hit the biggest!”'],
    dSizeWhy: ['„die größte“, „die kleinste“: -st- und die Endung: den größten, die größte, das größte.', '«die größte», «die kleinste»: -st- and the ending: den größten (der), die größte (die), das größte (das).'],
    flee: ['Der Boss ist gefallen! Lauft!', 'The boss fell! Run!'],
    exD: ['Schlag die mit dem kaputten Schild!', 'Hit the one with the broken shield!'], exD2: ['Schlag die größte!', 'Hit the biggest one!'],
  });
  Object.assign(T.LX.de.tips, {
    dShield: 'They look the same, but one has a broken shield (whole shields take only half). Say which by what it has: «den mit dem kaputten Schild».',
    dSize: 'The biggest one (👑) is their boss: beat it and the rest run off. Say «den größten» (or «den kleinsten»).',
  });
  Object.assign(T.LX.zh, {
    chipShield: '[盾牌|dùn pái]', chipBroken: '[破|pò] [盾牌|dùn pái]',
    dHello: ['[今天|jīn tiān] [练|liàn] [描述|miáo shù] ！ [它们|tā men] [长|zhǎng] [得|de] [一样|yí yàng] [的|de] [时候|shí hou] ， [告诉|gào su] {mimo} [你|nǐ] [要|yào] [的|de] [那|nà] [个|gè] [是|shì] [什么|shén me] [样|yàng] [的|de] 。', 'Today we practice describing! When they look the same, tell {name} what the one you want is like.'],
    dDemo: ['[你|nǐ] [看|kàn] ： [三|sān] [个|gè] [都|dōu] [一样|yí yàng] ， [可是|kě shì] [这个|zhè ge] [的|de] [盾牌|dùn pái] [破|pò] [了|le] 。 [打|dǎ] [盾牌|dùn pái] [破|pò] [了|le] [的|de] ！', 'Look: all three are the same, but this one’s shield is broken. “Hit the one whose shield is broken!”'],
    dWhy: ['[的|de] [放|fàng] [在|zài] [描述|miáo shù] [后面|hòu miàn] ： [盾牌|dùn pái] [破|pò] [了|le] [的|de] ， [最|zuì] [大|dà] [的|de] 。', '的 comes after the description: 盾牌破了的 (the one whose shield is broken), 最大的 (the biggest).'],
    dYou: ['[现在|xiàn zài] [轮到|lún dào] [你|nǐ] ！ [好|hǎo] [的|de] [盾牌|dùn pái] [挡|dǎng] [得|de] [住|zhù] ， [找|zhǎo] [破|pò] [的|de] [那|nà] [个|gè] 。', 'Your turn! Good shields block hits: find the broken one.'],
    dGot: ['[说|shuō] [得|de] [好|hǎo] ！ [就是|jiù shì] [它|tā] ！', 'Well said! That’s the one!'],
    dSize: ['[现在|xiàn zài] [它们|tā men] [有|yǒu] [大|dà] [有|yǒu] [小|xiǎo] 。 [最|zuì] [大|dà] [的|de] [是|shì] [老大|lǎo dà] ： [它|tā] [倒|dǎo] [了|le] ， [别的|bié de] [就|jiù] [跑|pǎo] [了|le] 。 [打|dǎ] [最|zuì] [大|dà] [的|de] ！', 'Now they come big and small. The biggest is the boss: if it falls, the rest run. “Hit the biggest one!”'],
    dSizeWhy: ['[最|zuì] ＋ [大|dà] ＋ [的|de] ： [最|zuì] [大|dà] [的|de] ， [最|zuì] [小|xiǎo] [的|de] 。', '最 + adjective + 的: 最大的 (the biggest), 最小的 (the smallest).'],
    flee: ['[老大|lǎo dà] [倒|dǎo] [了|le] ！ [快|kuài] [跑|pǎo] ！', 'The boss is down! Run!'],
    exD: ['[打|dǎ] [盾牌|dùn pái] [破|pò] [了|le] [的|de] ！', 'Hit the one whose shield is broken!'], exD2: ['[打|dǎ] [最|zuì] [大|dà] [的|de] ！', 'Hit the biggest one!'],
  });
  Object.assign(T.LX.zh.tips, {
    dShield: 'They look the same, but one has a broken shield (whole shields take only half). Say which by what it has: «打盾牌破了的！».',
    dSize: 'The biggest one (👑) is their boss: beat it and the rest run off. Say «最大的» (or «最小的»).',
  });
  Object.assign(T.LX.ja, {
    chipShield: '[盾|たて]', chipBroken: '[壊|こわ]れた [盾|たて]',
    dHello: ['[今日|きょう] は [説明|せつめい] の [練習|れんしゅう] です 。 [同|おな]じ に [見|み]える とき は 、 どんな の か を {mimo} に [言|い]って ください 。', 'Today we practice describing. When they look the same, tell {name} what the one you want is like.'],
    dDemo: ['[見|み]て ください 。 [三|さん] [体|たい] とも [同|おな]じ です が 、 これ は [盾|たて] が [壊|こわ]れて います 。 「 [盾|たて] が [壊|こわ]れて いる の を [叩|たた]いて ！ 」', 'Look: all three are the same, but this one’s shield is broken. “Hit the one whose shield is broken!”'],
    dWhy: ['「 [盾|たて] が [壊|こわ]れて いる 」 は 「 の 」 の [前|まえ] に [来|き]ます 。 の ＝ その [子|こ] です 。', '«盾が壊れている» goes right before «の» (the one): 盾が壊れているの = the one whose shield is broken.'],
    dYou: ['[今度|こんど] は あなた です 。 [壊|こわ]れて いない [盾|たて] は [攻撃|こうげき] を [防|ふせ]ぎます 。 [壊|こわ]れた [盾|たて] を [探|さが]して ください 。', 'Your turn. Unbroken shields block attacks: look for the broken one.'],
    dGot: ['いい です ね ！ それ です ！', 'Nice! That’s the one!'],
    dSize: ['[今度|こんど] は [大|おお]きさ が ちがいます 。 [一番|いちばん] [大|おお]きい の が ボス です 。 ボス が [倒|たお]れたら 、 [他|ほか] の は [逃|に]げます 。 「 [一番|いちばん] [大|おお]きい の を [叩|たた]いて ！ 」', 'Now they’re different sizes. The biggest one is the boss. When the boss falls, the others run. “Hit the biggest one!”'],
    dSizeWhy: ['「 [一番|いちばん] 」 ＋ [形容詞|けいようし] ： [一番|いちばん] [大|おお]きい 、 [一番|いちばん] [小|ちい]さい 。', '«一番» + adjective: 一番大きい (the biggest), 一番小さい (the smallest).'],
    flee: ['ボス が やられた ！ [逃|に]げろ ！', 'The boss is down! Run!'],
    exD: ['[盾|たて] が [壊|こわ]れて いる の を [叩|たた]いて ！', 'Hit the one whose shield is broken!'], exD2: ['[一番|いちばん] [大|おお]きい の を [叩|たた]いて ！', 'Hit the biggest one!'],
  });
  Object.assign(T.LX.ja.tips, {
    dShield: 'They look the same, but one has a broken shield (whole shields take only half). Say which by what it has: «盾が壊れているのを叩いて！».',
    dSize: 'The biggest one (👑) is their boss: beat it and the rest run off. Say «一番大きいの» (or «一番小さいの»).',
  });
  const WHY = {
    es: { have: '«tiene» is for it (he / she): «el que tiene el escudo roto».', que: 'A description with a verb starts with «que»: «al que tiene el escudo roto».', desc: 'Describe it: «al que tiene el escudo roto» (the one that has…), «al más grande» (the biggest). «el que» / «la que» go with the creature’s gender.' },
    pt: { have: '«tem» is for it (ele / ela): «o que tem o escudo quebrado».', que: 'A description with a verb starts with «que»: «no que tem o escudo quebrado».', irregular: '«grande» has its own word for “biggest”: «o maior» (not «o mais grande»); «pequeno»: «o menor».', desc: 'Describe it: «no que tem o escudo quebrado», «no maior». «o que» / «a que» go with the creature’s gender.' },
    de: { mitCase: '«mit» takes the dative: «mit dem kaputten Schild» (der Schild → dem).', supEnd: 'After den / die / das the superlative ends in -en for der-words and -e for die- and das-words: «den größten», «die größte», «das größte».', desc: 'Describe it: «den mit dem kaputten Schild», «den größten». The first article goes with the one you mean: den (der), die (die), das (das).' },
    zh: { desc: 'Describe it, then 的: «盾牌破了的» (the one whose shield is broken), «最大的» (the biggest).' },
    ja: { desc: 'Describe it right before の (the one): «盾が壊れているの», «一番大きいの».' },
  };
  const SLIP = { es: { have: 'Verb slip (tiene)', que: '«que» missing' }, pt: { have: 'Verb slip (tem)', que: '«que» missing', irregular: '«maior» slip' }, de: { mitCase: 'Case slip (mit dem)', supEnd: 'Ending slip (-sten)' } };
  for (const l of Object.keys(T.LX)) {
    T.LX[l].why = Object.assign(T.LX[l].why || {}, WHY[l] || {});
    T.LX[l].slip = Object.assign(T.LX[l].slip || {}, SLIP[l] || {});
    T.LX[l].soft = Object.assign(T.LX[l].soft || {}, { tacDesc: 'Say what makes it different' });
  }
  T.mergeLang();

  // ---------------------------------------------------------------- finding the description in what you typed
  // → { kind: 'shield' | 'big' | 'small', i, j (the words / units it covers), errors, fixes, nounBefore (de: the noun right before it) }
  const SH = {
    es: { noun: ['escudo'], broken: { roto: 'm', rota: 'f', quebrado: 'm', quebrada: 'f' }, haveOk: ['tiene', 'tenga'], haveBad: ['tienes', 'tengo', 'tener', 'tienen', 'tenia'], link: ['del', 'con', 'de'], arts: { el: 'm', la: 'f', un: 'm', una: 'f', su: 'm' } },
    pt: { noun: ['escudo'], broken: { quebrado: 'm', quebrada: 'f', rachado: 'm', rachada: 'f' }, haveOk: ['tem', 'tenha'], haveBad: ['tens', 'ter', 'tenho', 'tinha'], link: ['do', 'com', 'de'], arts: { o: 'm', a: 'f', um: 'm', uma: 'f', seu: 'm' } },
  };
  const SUP = {
    es: { more: ['mas'], adj: { grande: ['big', null], grandes: ['big', null], pequeno: ['small', 'm'], pequena: ['small', 'f'], chico: ['small', 'm'], chica: ['small', 'f'], chiquito: ['small', 'm'], chiquita: ['small', 'f'] } },
    pt: { one: { maior: 'big', menor: 'small' }, more: ['mais'], adj: { grande: ['big', null, 'irregular'], pequeno: ['small', 'm'], pequena: ['small', 'f'] } },
  };
  function romDesc(t, L, foes) {
    const S = SH[L.code], U = SUP[L.code];
    if (S) {
      const k = t.findIndex(w => H.match(w.n, S.noun));
      const b = k >= 0 && t[k + 1] ? H.match(t[k + 1].n, Object.keys(S.broken)) : null;
      if (k >= 0 && b) {
        const errors = [], fixes = [];
        if (H.match(t[k].n, S.noun).typo || b.typo) fixes.push('spelling');
        if (S.broken[b.form] !== 'm') H.err(errors, 'gender');
        let s = k;
        const a = t[k - 1] && S.arts[t[k - 1].n];
        if (a) { s = k - 1; if (a !== 'm') H.err(errors, 'gender'); }
        const hn = t[s - 1] ? t[s - 1].n : '', hv = !hn ? null : S.haveBad.map(nrm).includes(hn) ? { form: hn, bad: true } : S.haveOk.map(nrm).includes(hn) ? { form: hn } : H.match(hn, S.haveOk);
        if (hv) {
          if (!a) fixes.push('article');
          s -= 1; if (hv.bad) H.err(errors, 'have'); else if (hv.typo) fixes.push('spelling');
          if (t[s - 1] && t[s - 1].n === 'que') s -= 1; else H.err(errors, 'que');
        } else if (t[s - 1] && S.link.includes(t[s - 1].n)) { s -= 1; if (t[s].n === 'de' && !a) fixes.push('article'); }
        else if (t[k - 1] && (t[k - 1].n === 'del' || t[k - 1].n === 'do')) s = k - 1;
        else return null;
        return { kind: 'shield', i: s, j: k + 2, errors, fixes };
      }
    }
    if (U) {
      for (let i = 0; i < t.length; i++) {
        if (U.one && U.one[t[i].n]) return { kind: U.one[t[i].n], i, j: i + 1, errors: [], fixes: [] };
        if (!U.more.includes(t[i].n) || !t[i + 1]) continue;
        const a = U.adj[t[i + 1].n]; if (!a) continue;
        const errors = []; if (a[2]) H.err(errors, a[2]);
        return { kind: a[0], i, j: i + 2, errors, fixes: [], g: a[1] };
      }
    }
    return null;
  }
  function deDesc(t, L) {
    const k = t.findIndex(w => w.n === 'schild');
    if (k >= 3 && t[k - 3].n === 'mit') {
      const adj = t[k - 1].n, m = adj.match(/^(kaputt|zerbrochen)(e|en|er|es|em)?$/);
      if (m) {
        const errors = [], art = t[k - 2].n;
        if (art !== 'dem') H.err(errors, art === 'der' || art === 'die' ? 'gender' : 'mitCase');
        if ((m[2] || '') !== 'en') H.err(errors, 'ending');
        return { kind: 'shield', i: k - 3, j: k + 1, errors, fixes: [], nounBefore: t[k - 4] && P.look(P.indexLang(L).species, t[k - 4].n) ? k - 4 : -1 };
      }
    }
    for (let i = 0; i < t.length; i++) {
      const m = t[i].n.match(/^(?:(gross)t|(klein)st)(e|en|er|es|em)?$/);     // (größt-en, kleinst-en)
      if (!m) continue;
      const fixes = [], big = !!m[1];
      if (big && !/[öÖ]|oe/.test(t[i].raw)) fixes.push('accent');
      return { kind: big ? 'big' : 'small', i, j: i + 1, errors: [], fixes, end: m[3] || '', art: t[i - 1] ? t[i - 1].n : null };
    }
    return null;
  }
  const CJD = {
    zh: { shield: ['[盾牌|dùn pái] [破|pò] [了|le]', '[盾牌|dùn pái] [坏|huài] [了|le]', '[拿着|ná zhe] [破|pò] [盾牌|dùn pái]', '[有|yǒu] [破|pò] [盾牌|dùn pái]', '[盾|dùn] [破|pò] [了|le]', '[破|pò] [盾牌|dùn pái]'],
      big: ['[最|zuì] [大|dà]'], small: ['[最|zuì] [小|xiǎo]'], say: { shield: '[盾牌|dùn pái] [破|pò] [了|le]', big: '[最|zuì] [大|dà]', small: '[最|zuì] [小|xiǎo]' } },
    ja: { shield: ['[盾|たて] が [壊|こわ]れて いる', '[盾|たて] が [壊|こわ]れてる', '[盾|たて] が [壊|こわ]れた', '[盾|たて] の [壊|こわ]れた', '[壊|こわ]れた [盾|たて] を [持|も]って いる', '[壊|こわ]れた [盾|たて] を [持|も]ってる', '[壊|こわ]れた [盾|たて] の'],
      big: ['[一番|いちばん] [大|おお]きい', '[一番|いちばん] [大|おお]きな'], small: ['[一番|いちばん] [小|ちい]さい', '[一番|いちばん] [小|ちい]さな'],
      say: { shield: '[盾|たて] が [壊|こわ]れて いる', big: '[一番|いちばん] [大|おお]きい', small: '[一番|いちばん] [小|ちい]さい' } },
  };
  // the foes a description fits (a squad's own; else, for a size, the biggest / smallest one here)
  function fits(kind, foes) {
    if (kind === 'shield') return foes.filter(f => f.tacShield === 'broken');
    const own = foes.filter(f => f.tacSize === kind);
    if (own.length) return own;
    const sc = f => (f.h ? f.h.scale : 1) * (f.size === 'big' ? 1.3 : 1), list = foes.filter(f => !f.shy);
    if (list.length < 2) return [];
    const best = kind === 'big' ? Math.max(...list.map(sc)) : Math.min(...list.map(sc));
    const out = list.filter(f => Math.abs(sc(f) - best) < 1e-6);
    return out.length === 1 ? out : [];
  }
  // the description, said right («que tiene el escudo roto», «más pequeña», «mit dem kaputten Schild», «größten»)
  function descSay(kind, f, L) {
    const g = H.gender(f);
    if (L.code === 'es') return kind === 'shield' ? 'que tiene el escudo roto' : kind === 'big' ? 'más grande' : g === 'f' ? 'más pequeña' : 'más pequeño';
    if (L.code === 'pt') return kind === 'shield' ? 'que tem o escudo quebrado' : kind === 'big' ? 'maior' : 'menor';
    if (L.code === 'de') return kind === 'shield' ? 'mit dem kaputten Schild' : (kind === 'big' ? 'größt' : 'kleinst') + (g === 'm' ? 'en' : 'e');
    return (CJD[L.code] || {}).say ? CJD[L.code].say[kind] : '';
  }
  // the color word that stands in for it while the parser reads the sentence
  function stand(f, L) {
    const a = L.adjs[f.color]; if (!a) return null;
    if (L.cjk) return a.forms[0].m;
    if (L.code === 'de') return a.stem + (H.gender(f) === 'm' ? 'en' : 'e');
    return H.gender(f) === 'f' ? a.forms[0].f : a.forms[0].m;
  }
  function descParse(text, ctx) {
    const L = ctx.L, C = CJ();
    let found = null, U = null, marks = null, t = null;
    if (L.cjk) {
      if (!C) return null;
      ({ U, marks } = C.typed(text, L.code));
      const D = CJD[L.code];
      for (const kind of ['shield', 'big', 'small']) {
        for (let i = 0; i < U.length && !found; i++) for (const src of D[kind]) { const m = C.matchAt(C.wordOf(src, L.code), U, i, L.code, { homo: true }); if (m) { found = { kind, i, j: m.j, errors: [], fixes: m.homo ? ['spelling'] : m.toneBad ? ['accent'] : [] }; break; } }
        if (found) break;
      }
      // zh: the description ends in 的 («最大的», «盾牌破了的青蛙»)
      if (found && L.code === 'zh' && !C.matchAt(C.wordOf('[的|de]', 'zh'), U, found.j, 'zh', { homo: true })) H.err(found.errors, 'de');
    } else {
      t = H.toks(text);
      found = L.code === 'de' ? deDesc(t, L) : romDesc(t, L, ctx.foes);
    }
    if (!found) return null;
    const list = fits(found.kind, ctx.foes);
    if (!list.length) return { ok: false, raw: text, reason: found.kind === 'shield' ? 'tac:noShield' : 'none' };
    const f = list[0], ph = stand(f, L);
    if (!ph) return null;
    // the sentence with the color word in its place (de: before a noun said first, «den Frosch mit…» → «den roten Frosch»)
    let text2;
    if (L.cjk) {
      const plainPh = C.chars(ph, { lang: L.code });
      let s = '';
      U.forEach((u, k) => {
        if (k === found.i) s += (s && !/\s$/.test(s) && L.code === 'zh' && !u.han ? ' ' : '') + plainPh + (L.code === 'zh' ? ' ' : '');
        if (k >= found.i && k < found.j) return;
        if (marks && marks[k] && s) s += L.code === 'ja' ? '、' : ' ， ';
        if (u.han || L.code === 'ja') s += u.raw; else s += (s && !/\s$/.test(s) ? ' ' : '') + u.raw + ' ';
      });
      if (found.i >= U.length) s += plainPh;
      text2 = s.trim();
    } else {
      const words = t.map(w => w.raw);
      if (found.nounBefore >= 0 && found.nounBefore !== undefined) { words.splice(found.i, found.j - found.i); words.splice(found.nounBefore, 0, ph); }
      else words.splice(found.i, found.j - found.i, ph);
      text2 = words.join(' ');
    }
    const sub = Object.assign({}, ctx, { foes: ctx.foes.filter(x => list.includes(x) || x.shy), tacNo: (ctx.tacNo || []).concat(['desc']) });
    const r = T.one(text2, sub);
    if (!r || !r.ok || r.kind !== 'command') return r ? Object.assign({}, r, { raw: text }) : null;
    const c = r.clauses.find(k => list.includes(k.target)) || r.clauses[0];
    // the superlative's own agreement (es «la más pequeña», de «den größten»)
    if (found.g && found.g !== H.gender(c.target)) H.err(found.errors, 'gender');
    if (L.code === 'de' && found.end != null && found.kind !== 'shield') { const want = H.gender(c.target) === 'm' ? 'en' : 'e'; if (found.end !== want) H.err(found.errors, 'supEnd'); }
    c.errors.push(...found.errors); c.fixes.push(...found.fixes);
    c.tacDesc = found.kind;
    c.desc = Object.assign({ adjs: [], preps: [] }, c.desc || {}, { described: true });
    // the words: not the stand-in color; the canon: the description back in
    const colorId = 'a.' + c.target.color;
    const typedColor = !L.cjk && t.some(w => { const a = P.indexLang(L).adjs.get(w.n); return a && a.key === c.target.color; });
    if (!typedColor) { c.words = c.words.filter(w => w !== colorId); r.words = r.words.filter(w => w !== colorId); }
    const say = descSay(found.kind, c.target, L);
    const swap = s => {
      if (L.cjk) return String(s).split(ph).join(say);
      const q = ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // (de, a noun said with it: «den roten Frosch» → «den Frosch mit dem kaputten Schild»; a superlative stays in front)
      if (L.code === 'de' && found.kind === 'shield') { const re2 = new RegExp(`(^|[^\\p{L}])${q}\\s+(\\p{Lu}\\p{L}*)`, 'u'); if (re2.test(s)) return String(s).replace(re2, `$1$2 ${say}`); }
      const re = new RegExp(`(^|[^\\p{L}])${q}(?=[^\\p{L}]|$)`, 'iu');
      return String(s).replace(re, `$1${say}`);
    };
    c.canon = swap(c.canon);
    r.canon = swap(r.canon);
    r.errors = r.clauses.flatMap(k => k.errors); r.fixes = r.clauses.flatMap(k => k.fixes);
    r.recast = r.errors.length > 0 || r.fixes.length > 0 || r.recast;
    r.raw = text;
    r.patterns = [...new Set((r.patterns || []).concat(['describe']))];
    return r;
  }
  T.single.push({ k: 'D', id: 'desc', fn: descParse });
  T.descSay = descSay; T.fits = fits;
  T.explainHooks.push(r => {
    if (r.reason !== 'tac:noShield') return false;
    const x = X(); x.setMood(x.A.mimo, 'confused', 1.4); x.mimoLine('none', 1.6); x.UI.hint('None of them has a broken shield here.', true); return true;
  });

  // ---------------------------------------------------------------- the squads: shields, sizes
  T.forceDesc = null;            // tests: 'shield' | 'size'
  let groupN = 0;
  T.specsHooks.push((specs, opts) => {
    const x = X(), G = x.G;
    if (opts.practice) { if (opts.focus === 'tac:D') { specs.length = 0; lessonSquad('shield').forEach(s => specs.push(x.normFoe(s, specs.length))); } return; }
    if (opts.tutorial || opts.boss || G.bossKind || G.bossId || !(T.unlocked('D') && T.learned('D'))) return;
    if (!T.forceDesc && Math.random() > 0.5) return;
    const by = {};
    specs.forEach(s => { if (KINDS.includes(s.kind) && !s.shy && !s.giant && !s.boss && !s.queen) (by[s.kind] = by[s.kind] || []).push(s); });
    const grp = Object.values(by).sort((a, b) => b.length - a.length)[0];
    if (!grp || grp.length < 2) return;
    const kind = T.forceDesc || (grp.length >= 3 && Math.random() < 0.5 ? 'size' : 'shield');
    const known = grp.map(s => s.color).find(c => x.knows('a.' + c)) || ['red', 'blue', 'green', 'yellow', 'white'].find(c => x.knows('a.' + c)) || grp[0].color;
    const id = ++groupN;
    grp.forEach(s => { s.color = known; s.size = grp[0].size; s.tacGroup = id; delete s.tacShield; delete s.tacSize; });
    if (kind === 'shield') { grp.forEach(s => { s.tacShield = 'whole'; }); grp[Math.floor(Math.random() * grp.length)].tacShield = 'broken'; }
    else if (grp.length >= 3) { const o = x.shuffle(grp); o[0].tacSize = 'big'; o[1].tacSize = 'small'; o.slice(2).forEach(s => { s.tacSize = 'mid'; }); }
  });
  function lessonSquad(kind) {
    const x = X(), c = ['red', 'blue', 'green', 'yellow'].find(k => x.knows('a.' + k)) || 'red', id = ++groupN;
    const d = o => Object.assign({ kind: 'dummy', color: c, size: 'small', hp: 8, tacGroup: id }, o);
    if (kind === 'shield') { const k = Math.floor(Math.random() * 3); return [0, 1, 2].map(i => d(i === k ? { tacShield: 'broken' } : { tacShield: 'whole', hp: 4 })); }
    return x.shuffle([d({ tacSize: 'big', hp: 10 }), d({ tacSize: 'mid' }), d({ tacSize: 'small', hp: 6 })]);
  }
  const SCALE = { big: 1.32, mid: 1.0, small: 0.74 };
  function makeShield(broken) {
    const g = new THREE.Group(), wood = TK.toon(broken ? '#a8865c' : '#c9a46c', { rim: 0.2 }), metal = TK.toon('#9aa3ad', { rim: 0.3 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.05, 20, 1, false, broken ? 0.9 : 0, broken ? TAU * 0.7 : TAU), wood);
    disc.rotation.x = Math.PI / 2; g.add(disc);
    const boss = new THREE.Mesh(TK.G.sphere, metal); boss.scale.set(0.07, 0.07, 0.045); boss.position.z = 0.03; g.add(boss);
    if (!broken) g.add(new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.025, 6, 26), metal));
    else {
      const crack = new THREE.Mesh(TK.G.box, TK.toon('#3a2a1a', { rim: 0 })); crack.scale.set(0.025, 0.34, 0.06); crack.rotation.z = 0.55; crack.position.set(-0.04, 0.02, 0.012); g.add(crack);
      const bit = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 3), wood); bit.rotation.set(Math.PI / 2, 0, 0.4); bit.position.set(0.3, -0.34, 0.02); g.add(bit);
    }
    return g;
  }
  T.beginHooks.push(() => {
    const x = X(), G = x.G;
    for (const f of G.foes) {
      const s = f.spec || {};
      f.tacGroup = s.tacGroup || null; f.tacShield = s.tacShield || null; f.tacSize = s.tacSize || null;
      if (f.tacSize && SCALE[f.tacSize] !== 1) {
        const k = SCALE[f.tacSize];
        f.h.root.scale.multiplyScalar(k); f.h.scale *= k; f.h.radius *= k; f.h.height *= k; f.radius *= k; f.height *= k;
        if (f.shadow) f.shadow.scale.multiplyScalar(k);
        if (f.tacSize === 'big') f.hp = f.maxHp = Math.round(f.maxHp * 1.3);
      }
      if (f.tacShield) {
        const sh = makeShield(f.tacShield === 'broken'), sc = f.h.scale || 1;
        sh.position.set(0.2, (f.height / sc) * 0.42, (f.radius / sc) * 0.95); sh.rotation.y = -0.25;
        f.h.root.add(sh); f.tacShieldMesh = sh;
      }
    }
    G.tacDescTold = false;
  });
  // the labels: a shield chip, and a crown on a squad's boss
  const UI0 = _.UI, label0 = UI0.label;
  UI0.label = (f, html) => {
    let extra = '';
    if (f && f.tacShield && f.alive) { const t = T.LX[X().G.lang] || T.LX.es, w = f.tacShield === 'broken' ? t.chipBroken : t.chipShield; extra = ` <span class="bt-chip ${f.tacShield === 'broken' ? 'glow' : ''}">🛡 ${w}</span>`; }
    if (f && f.tacSize === 'big' && f.alive) extra += ' <span class="bt-chip">👑</span>';
    return label0(f, html + extra);
  };
  // the grade: a shield halves, a broken one ×1.5; the special one said any other way is an A, with Mimo's better sentence
  T.judgeHooks.push(r => {
    const x = X(), G = x.G, L = G.L;
    for (const c of r.clauses || []) {
      const f = c.target; if (!f || !H.attackVerb(c.verb)) continue;
      if (f.tacShield === 'whole' && !c.rock) { c.tacMult *= 0.5; c.tacSub = c.tacSub || 'SHIELD ½'; }
      if (f.tacShield === 'broken') { c.tacMult *= 1.5; c.tacSub = c.tacSub || 'NO SHIELD ×1.5'; }
      const special = f.tacShield === 'broken' ? 'shield' : f.tacSize === 'big' || f.tacSize === 'small' ? f.tacSize : null;
      if (special && !c.tacDesc && !c.rock && T.on('D')) {
        c.soft = (c.soft || []).filter(k => k !== 'tacDesc').concat(['tacDesc']);
        try {
          const say = descSay(special, f, L), ph = stand(f, L);
          const base = P.sayAction(L, c.verb === 'grab' ? 'attack' : c.verb, f, { adjs: [f.color] });
          c.suggest = L.cjk ? base.split(ph).join(say) : base.replace(new RegExp(`(^|[^\\p{L}])${ph}(?=[^\\p{L}]|$)`, 'iu'), `$1${say}`);
        } catch (e) { /* (no suggestion) */ }
      }
      if (f.tacGroup) { const prev = c.tacRun; c.tacRun = async k => { await (prev ? prev(k) : x.MOVES[k.verb](k)); await leaderDown(k.target); }; }
    }
  });
  // the boss of a squad falls: the rest run off (beaten, all the same)
  async function leaderDown(f) {
    const x = X(), G = x.G;
    const grp = G.foes.filter(k => k.tacGroup && k.tacGroup === f.tacGroup);
    const lead = grp.find(k => k.tacSize === 'big');
    if (!lead || lead.alive || G.tacFled === f.tacGroup) return;
    const rest = grp.filter(k => k.alive && !k.gone);
    if (!rest.length) return;
    G.tacFled = f.tacGroup;
    await x.wait(0.3);
    H.foeSay(rest[0], 'flee', { dur: 2.0 });
    await x.wait(0.6);
    for (const k of rest) {
      k.alive = false; k.gone = true; x.UI.labelRemove(k);
      G.stats.beaten++; x.earn(x.COINS_FOE);
      x.turnTo(k, Math.PI / 2, 0.1);
    }
    await Promise.all(rest.map(async (k, i) => { await x.wait(i * 0.12); for (let n = 0; n < 3; n++) await x.arcTo(k, k.x + 2.6, k.baseY || 0, k.z + 0.3, 0.26, 0.4); k.hidden = true; }));
    x.updateStain();
  }
  // (a boss that fell some other way, to a dodge's counter: the rest still run, after the foes' turn)
  T.afterHooks.push(async () => { const G = X().G; for (const f of G.foes) if (f.tacSize === 'big' && !f.alive) { await leaderDown(f); break; } });
  // a tip the first time a squad shows up
  T.turnHooks.unshift(async () => {
    const x = X(), G = x.G, L = G.L;
    if (!T.on('D')) return;
    const f = x.targetable().find(k => k.tacShield || k.tacSize);
    if (!f) return;
    if (!G.tacDescTold) { G.tacDescTold = true; H.tip(f.tacShield ? 'dShield' : 'dSize'); }
    // the rung pill: what an S needs here, said with the description
    const sp = x.targetable().find(k => k.tacShield === 'broken') || x.targetable().find(k => k.tacSize === 'big');
    if (!sp) return;
    try {
      const kind = sp.tacShield === 'broken' ? 'shield' : 'big', say = descSay(kind, sp, L), ph = stand(sp, L);
      const base = P.sayAction(L, x.attackVerbs().includes('hit') ? 'hit' : x.attackVerbs()[0] || 'jump', sp, { adjs: [sp.color] });
      const ex = L.cjk ? base.split(ph).join(say) : base.replace(new RegExp(`(^|[^\\p{L}])${ph}(?=[^\\p{L}]|$)`, 'iu'), `$1${say}`);
      x.UI.rung(`Rung D · say what makes it different: <b>«${x.UI.esc(H.plain(ex))}»</b>`);
    } catch (e) { /* (the pill stays as it was) */ }
  });

  // ---------------------------------------------------------------- the lesson at the yard (focus 'tac:D')
  async function demoHit(x, G, f, verb) {
    const c = { verb, baseVerb: verb, target: f, power: 1, errors: [], fixes: [], words: [], desc: { described: true }, tacMult: f.tacShield === 'broken' ? 1.5 : 1, tacSub: f.tacShield === 'broken' ? 'NO SHIELD ×1.5' : null };
    const auto0 = G.auto; G.auto = Object.assign({}, auto0 || {}, { timing: 'perfect' });
    try { x.say(x.A.mimo, P.wrapS(G.L, G.L.verbs[verb] ? G.L.verbs[verb].show : verb), { cls: 'mimo', dur: 1.1 }); await x.wait(0.4); await x.MOVES[verb](c); } finally { G.auto = auto0; }
    f.hp = f.maxHp; x.refreshLabels();
  }
  T.lessons.D = async (x, G) => {
    await x.intro();
    x.ST.shot('coach');
    await H.coach('dHello');
    G.tacLesson = { k: 'D' };
    const broken = G.foes.find(f => f.tacShield === 'broken');
    x.ST.shot('action', x.A.mimo, broken, { yaw: 0.05, up: 0.2 });
    H.pop(broken, '?', { color: '#fff3a0', size: 30 });
    await H.coach('dDemo');
    await demoHit(x, G, broken, 'hit');
    await H.coach('dWhy');
    await H.coach('dYou');
    let round = 0;
    for (;;) {
      x.setupScaffolds();
      x.UI.rung(`Skill · describe it: <b>«${x.UI.esc(H.plain(H.line(round % 2 ? 'exD2' : 'exD')[0]))}»</b>`);
      G.roundLog0 = G.stats.gradeLog.length;
      await T.lessonLoop(x, G, {
        after: async r => {
          const L = G.tacLesson;
          if (r && r.kind === 'command' && r.clauses.some(c => c.tacDesc) && r.grade && r.grade.letter !== 'D') {
            L.got = (L.got || 0) + 1;
            if (T.learn('D')) T.learnedBanner('D');
            if (L.got === 1) await H.coach('dGot');
          }
        },
      });
      await x.practiceCheer();
      if (!(await x.practiceCard())) break;
      G.round++; round++;
      await T.newDummies(x, G, 3, lessonSquad(round % 2 ? 'size' : 'shield'));
      for (const f of G.foes) { f.tacGroup = f.spec.tacGroup; f.tacShield = f.spec.tacShield || null; f.tacSize = f.spec.tacSize || null; }
      T.beginHooks[T.beginHooks.length - 1].call(null);
      G.tacFled = null;
      if (round % 2) { await H.coach('dSize'); await H.coach('dSizeWhy'); }
    }
    x.ST.shot('coach');
    await x.coachSay('pDone');
    return 'done';
  };
})();

// ================================================================ B · Combos
// Up to four moves in one sentence once B is learned (two before, as always), joined by the connectors: «Primero…, luego…
// y al final…» · «Primeiro…, depois… e por fim…» · «Zuerst…, dann… und zum Schluss…» · «先…，然后…，最后…» · «まず…、それから…、
// 最後に…». Each move after the first hits harder: ×1.25, ×1.5, ×1.75 (COMBO 2, 3, 4). Each move is graded like any command
// (the slips of all of them count), so a long combo is a long sentence to get right.
(() => {
  const _ = window.BATTLE._, P = _.P, T = _.tac, H = T && T.h;
  if (!T || !H) return;
  const X = () => _.flow;
  const MORE = {
    es: { first: ['primero'], conj: [['y', 'al', 'final'], ['al', 'final'], ['y', 'por', 'último'], ['por', 'último'], ['y', 'finalmente'], ['finalmente'], ['y', 'entonces'], ['entonces']], words: ['Primero', 'luego', 'y al final'] },
    pt: { first: ['primeiro'], conj: [['e', 'por', 'fim'], ['por', 'fim'], ['e', 'no', 'final'], ['no', 'final'], ['e', 'finalmente'], ['finalmente']], words: ['Primeiro', 'depois', 'e por fim'] },
    de: { first: ['zuerst', 'erst'], conj: [['und', 'zum', 'schluss'], ['zum', 'schluss'], ['und', 'danach'], ['danach'], ['und', 'schließlich'], ['schließlich']], words: ['Zuerst', 'dann', 'und zum Schluss'] },
    zh: { words: ['[先|xiān]', '[然后|rán hòu]', '[最后|zuì hòu]'] },
    ja: { words: ['まず', 'それから', '[最後|さいご]に'] },
  };
  for (const [code, m] of Object.entries(MORE)) {
    const L = _.LANGS && _.LANGS[code]; if (!L || L.cjk) continue;
    L.conj = (m.conj || []).filter(s => !L.conj.some(x => x.join(' ') === s.join(' '))).concat(L.conj);   // (longest first: «y al final» before «y»)
    for (const w of m.first || []) if (!L.fillers.includes(w)) L.fillers.push(w);
    L.I = null;
  }
  Object.assign(T.LX.es, {
    bHello: ['¡Hoy, combos! Puedes encadenar varias acciones en una sola frase.', 'Today: combos! You can chain several moves in one sentence.'],
    bWhy: ['«Primero», «luego», «y al final»: cada acción de más hace el combo más fuerte.', '«Primero» (first), «luego» (then), «y al final» (and finally): every extra move makes the combo stronger.'],
    bYou: ['¡Ahora tú! Tres acciones en una frase.', 'Now you! Three moves in one sentence.'], bGot: ['¡Combo! ¡Así se hace!', 'Combo! That’s how it’s done!'], bLook: ['Mira:', 'Watch:'],
  });
  Object.assign(T.LX.pt, {
    bHello: ['Hoje, combos! Dá pra juntar várias ações numa frase só.', 'Today: combos! You can chain several moves in one sentence.'],
    bWhy: ['«Primeiro», «depois», «e por fim»: cada ação a mais deixa o combo mais forte.', '«Primeiro» (first), «depois» (then), «e por fim» (and finally): every extra move makes the combo stronger.'],
    bYou: ['Agora você! Três ações numa frase.', 'Now you! Three moves in one sentence.'], bGot: ['Combo! É assim que se faz!', 'Combo! That’s how it’s done!'], bLook: ['Olha:', 'Watch:'],
  });
  Object.assign(T.LX.de, {
    bHello: ['Heute: Kombos! Du kannst mehrere Aktionen in einem Satz verbinden.', 'Today: combos! You can chain several moves in one sentence.'],
    bWhy: ['„Zuerst“, „dann“, „und zum Schluss“: Jede Aktion mehr macht die Kombo stärker.', '«Zuerst» (first), «dann» (then), «und zum Schluss» (and finally): every extra move makes the combo stronger.'],
    bYou: ['Jetzt du! Drei Aktionen in einem Satz.', 'Now you! Three moves in one sentence.'], bGot: ['Kombo! Genau so!', 'Combo! Just like that!'], bLook: ['Schau:', 'Watch:'],
  });
  Object.assign(T.LX.zh, {
    bHello: ['[今天|jīn tiān] [练|liàn] [连招|lián zhāo] ！ [一|yí] [句|jù] [话|huà] [里|lǐ] [可以|kě yǐ] [说|shuō] [好几个|hǎo jǐ gè] [动作|dòng zuò] 。', 'Today: combos! You can say several moves in one sentence.'],
    bWhy: ['[先|xiān] 〜 ， [然后|rán hòu] 〜 ， [最后|zuì hòu] 〜 ： [动作|dòng zuò] [越|yuè] [多|duō] ， [连招|lián zhāo] [越|yuè] [强|qiáng] 。', '先… 然后… 最后… (first, then, finally): the more moves, the stronger the combo.'],
    bYou: ['[现在|xiàn zài] [轮到|lún dào] [你|nǐ] ！ [一|yí] [句|jù] [话|huà] ， [三|sān] [个|gè] [动作|dòng zuò] 。', 'Your turn! One sentence, three moves.'], bGot: ['[连招|lián zhāo] ！ [太|tài] [棒|bàng] [了|le] ！', 'Combo! Great!'], bLook: ['[看|kàn] ：', 'Watch:'],
  });
  Object.assign(T.LX.ja, {
    bHello: ['[今日|きょう] は コンボ です 。 [一|ひと]つ の [文|ぶん] で 、 いくつ も の [動|うご]き を つなげられます 。', 'Today: combos. You can chain several moves in one sentence.'],
    bWhy: ['まず 〜 、 それから 〜 、 [最後|さいご]に 〜 。 [動|うご]き が [多|おお]い ほど 、 コンボ は [強|つよ]く なります 。', 'まず… それから… 最後に… (first, then, finally): the more moves, the stronger the combo.'],
    bYou: ['あなた の [番|ばん] です 。 [一|ひと]つ の [文|ぶん] に 、 [動|うご]き を [三|みっ]つ 。', 'Your turn. Three moves in one sentence.'], bGot: ['コンボ ！ その [調子|ちょうし] です ！', 'Combo! Keep it up!'], bLook: ['[見|み]て ください ：', 'Watch:'],
  });
  const STEP = 0.25;
  T.judgeHooks.push(r => {
    if (!T.on('B') || !r.clauses || r.clauses.length < 2) return;
    if (_.chain && _.chain.owns && _.chain.owns()) return;     // (once «y» is learned its rule covers every chain: crits ×1.5 / ×2 / ×2.5, and a slip breaks it, battle/chain.js)
    r.clauses.forEach((c, k) => {
      if (!k || !H.attackVerb(c.verb)) return;
      const m = 1 + STEP * k;
      c.tacMult *= m; c.tacCombo = k + 1;
      c.tacSub = c.tacSub || `COMBO ${k + 1} ×${m}`;
      const prev = c.tacRun;
      c.tacRun = async q => { const x = X(); H.pop(x.A.mimo, `COMBO ${k + 1}!`, { color: '#86f2e8', size: 26 + 4 * k, life: 0.9 }); x.emit('combo', { n: k + 1 }); await (prev ? prev(q) : x.MOVES[q.verb](q)); };
    });
  });
  // the example: three moves on the three dummies, said with the connectors
  function example(x, G, foes) {
    const L = G.L, w = MORE[G.lang].words, verbs = x.attackVerbs();
    const v = [verbs.includes('hit') ? 'hit' : verbs[0], verbs.includes('jump') ? 'jump' : verbs[0], verbs.includes('hit') ? 'hit' : verbs[0]];
    const cl = foes.slice(0, 3).map((f, i) => P.sayClause(L, v[i], f, { adjs: [f.color] }));
    if (L.code === 'zh') return `${w[0]} ${cl[0]} ， ${w[1]} ${cl[1]} ， ${w[2]} ${cl[2]} ！`;
    if (L.code === 'ja') return `${w[0]} ${cl[0]} 、 ${w[1]} ${cl[1]} 、 ${w[2]} ${cl[2]} ！`;
    return P.wrapS(L, `${H.lc1(w[0])} ${cl[0]}, ${w[1]} ${cl[1]} ${w[2]} ${cl[2]}`).replace(/^(¡?)(\p{Ll})/u, (m, a, b) => a + b.toUpperCase());
  }
  T.specsHooks.push((specs, opts) => {
    if (!opts.practice || opts.focus !== 'tac:B') return;
    const x = X(), cs = ['red', 'blue', 'green', 'yellow', 'white'].filter(c => x.knows('a.' + c));
    const colors = (cs.length >= 3 ? x.shuffle(cs) : ['red', 'blue', 'green']).slice(0, 3);
    specs.length = 0; colors.forEach(c => specs.push(x.normFoe({ kind: 'dummy', color: c, size: 'small', hp: 9 }, specs.length)));
  });
  T.lessons.B = async (x, G) => {
    await x.intro();
    x.ST.shot('coach');
    await H.coach('bHello');
    G.tacLesson = { k: 'B' };
    const foes = x.targetable(), ex = example(x, G, foes), look = H.line('bLook');
    await x.coachSay([`${look[0]} «${ex}»`, `${look[1]} three moves in one sentence.`]);
    // Mimo does it: the three moves, each one harder (the demonstration's hits don't count)
    const r = P.parse(H.plain(ex), x.ctx());
    if (r && r.ok && r.kind === 'command') {
      x.judge(r);
      const auto0 = G.auto; G.auto = Object.assign({}, auto0 || {}, { timing: 'perfect' });
      try { x.say(x.A.you, H.plain(ex), { cls: 'you', dur: 2.6 }); for (const c of r.clauses) { if (!c.target.alive) continue; await (c.tacRun ? c.tacRun(c) : x.MOVES[c.verb](c)); } } finally { G.auto = auto0; }
      for (const f of G.foes) { f.hp = f.maxHp; }
      x.refreshLabels();
    }
    await H.coach('bWhy');
    await H.coach('bYou');
    for (;;) {
      x.setupScaffolds();
      x.UI.rung(`Skill · combos: <b>«${x.UI.esc(H.plain(example(x, G, x.targetable().length >= 3 ? x.targetable() : G.foes)))}»</b>`);
      G.roundLog0 = G.stats.gradeLog.length;
      await T.lessonLoop(x, G, {
        after: async q => {
          const L = G.tacLesson;
          if (q && q.kind === 'command' && q.clauses.length >= 3 && q.grade && q.grade.letter !== 'D') {
            L.got = (L.got || 0) + 1;
            if (T.learn('B')) T.learnedBanner('B');
            if (L.got === 1) await H.coach('bGot');
          }
        },
      });
      await x.practiceCheer();
      if (!(await x.practiceCard())) break;
      G.round++;
      await T.newDummies(x, G, 3);
    }
    x.ST.shot('coach');
    await x.coachSay('pDone');
    return 'done';
  };
})();

// ================================================================ E · Talk them down, or talk your way out
// From bell 2 (DESIGN.md 17.3, 7.3). Every regular kind has a taste, and says it (its tell, in the language, with a chip on its
// label) the first turn it's on the field; you read it and answer it in one sentence (a whole turn: T.whole, kind 'tac'):
//   hungry (frogs, bees, worms)              → a deal: «Si te vas, te doy una manzana» (the food comes out of the bag)
//   proud (moths, beetles, crabs)            → a compliment: «¡Qué fuerte eres!», «¡Eres muy bonita!»
//   doubtful (hushlings)                     → a reason: «No queremos pelear porque somos amigos»
//   tired (armadillos, bats, snowballs)      → ask it nicely: «Vete a casa, por favor»
// The right way said well (S, A or B; or a C the second time) calms it: befriended in the bestiary, its word freed, 1 coin
// (a beaten one pays 2), and no hit. The wrong way: it says no, and its tell again. A D: it didn't understand. Never a boss,
// a shadow you haven't lit, the Corn Society or one asleep. «¡Nos vamos! No queremos pelear» ends any fight but a boss's as
// a flight (G.tacOut = 'flee'), with nothing lost. A sentence with a battle verb in it is a command, not talk (it steps aside).
// Graded per language: es «si te vas» (si + the present, not «si te vayas»), «te doy», «eres» and agreement, «porque» + a verb
// in its person, «vete», «nos vamos»; pt «se você for embora» (future subjunctive), «eu te dou», «você é», «a gente é», «vai
// embora», «vamos embora»; de «wenn du gehst, gebe ich dir einen Apfel» (verb last, then verb first, accusative), «du bist
// stark» (no ending), «weil wir Freunde sind» (verb last), «geh bitte», «wir gehen»; zh 如果…就 and the measure word, no 是
// before an adjective, 因为, 请, 我们走吧; ja 帰ったら with あげる (not くれる), い / な adjectives, だから, 帰ってください, 帰ろう.
// Tests: T.forceTaste = 'hungry' | … (every foe that taste); T.eRead(text) → what the reader found.
(() => {
  const _ = window.BATTLE._, P = _.P, T = _.tac, H = T && T.h;
  if (!T || !H) return;
  const X = () => _.flow;
  const CJ = () => (typeof CJK !== 'undefined' ? CJK : null);
  const TASTE = { hushling: 'doubt', hushbig: 'doubt', moth: 'proud', beetle: 'proud', crab: 'proud', armadillo: 'tired', bat: 'tired', snowball: 'tired', frog: 'hungry', bee: 'hungry', worm: 'hungry' };
  const WAY = { hungry: 'deal', proud: 'praise', doubt: 'reason', tired: 'please' };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const bossy = G => !!(G.boss || G.arma || G.bossId || G.plug);
  const talkable = f => !!(f && f.alive && !f.gone && !f.calmed && !f.shy && f.tacTaste && !f.isBoss && !(f.spec && (f.spec.giant || f.spec.queen || (f.spec.shadow && !f.lit)))
    && !(f.states && f.states.has('asleep')) && !['kernel', 'popcorn', 'colonel'].includes(f.species));
  T.talkable = talkable; T.TASTE = TASTE; T.forceTaste = null;

  // ---------------------------------------------------------------- what each language says
  const add = (l, o) => { const t = T.LX[l]; if (!t) return; const { tips, why, slip, soft, gloss, ...rest } = o; Object.assign(t, rest); for (const k of ['tips', 'why', 'slip', 'soft', 'gloss']) if (o[k]) t[k] = Object.assign(t[k] || {}, o[k]); };
  add('es', {
    eHungry: ['¡Qué hambre tengo!', 'I’m so hungry!'], eProud: ['¡Soy el más fuerte de todos!', 'I’m the strongest of all!'], eProudF: ['¡Soy la más bonita de todas!', 'I’m the prettiest of all!'],
    eDoubt: ['¿Por qué peleamos, eh?', 'Why are we even fighting?'], eTired: ['¡Qué sueño! Quiero irme a casa…', 'I’m so sleepy! I want to go home…'],
    eChipHungry: 'tiene hambre', eChipProud: 'orgulloso', eChipProudF: 'orgullosa', eChipDoubt: 'duda', eChipTired: 'cansado', eChipTiredF: 'cansada',
    eYesHungry: ['¡Trato hecho! ¡Ñam!', 'Deal! Yum!'], eYesProud: ['¡Ay, gracias! Eres muy amable.', 'Aw, thanks! You’re very kind.'], eYesDoubt: ['Tienes razón… ¡Adiós!', 'You’re right… Bye!'],
    eYesTired: ['Sí… me voy a dormir. ¡Chao!', 'Yes… I’m off to sleep. Bye!'], eAlmost: ['Mmm… casi me convences.', 'Hmm… you almost convinced me.'], eNo: ['Mmm… no.', 'Hmm… no.'],
    eHuh: ['¿Eh? ¿Qué dices?', 'Huh? What are you saying?'], eByeFoe: ['¡Vale, adiós!', 'Okay, bye!'], eByeMimo: ['¡Chao!', 'Bye!'], eNoOut: ['¡De aquí no se va nadie!', 'Nobody leaves here!'],
    eNoFood: ['¡No tenemos!', 'We don’t have any!'],
    eHello: ['¡Hoy, a hablar! No siempre hay que pelear. Escucha lo que dicen: cada uno quiere algo.', 'Today: talking! You don’t always have to fight. Listen to what they say: each one wants something.'],
    eDemo: ['Este muñeco tiene hambre. Mira: «Si te vas, te doy una manzana».', 'This dummy is hungry. Watch: “If you leave, I’ll give you an apple.”'],
    eWhy: ['Con «si», el verbo va en presente: «si te vas», no «si te vayas». Y «te doy»: yo te doy.', 'With «si» (if), the verb stays in the present: «si te vas», not «si te vayas». And «te doy»: I give (to) you.'],
    eYou: ['¡Ahora tú! Lee lo que dice el otro y convéncelo. Al orgulloso: «¡Qué fuerte eres!».', 'Now you! Read what the other one says and win it over. To the proud one: “How strong you are!”'],
    eGot: ['¡Lo convenciste! ¡Ni un golpe!', 'You won it over! Not a single hit!'],
    eRound: ['Estos quieren otras cosas. Al que duda, dale una razón: «…porque somos amigos». Al cansado, pídeselo: «Vete a casa, por favor».', 'These want other things. Give the doubtful one a reason: “…because we’re friends.” Ask the tired one: “Go home, please.”'],
    eOut: ['Y si una pelea no vale la pena: «¡Nos vamos! No queremos pelear». Así sales sin perder nada.', 'And if a fight isn’t worth it: “We’re leaving! We don’t want to fight.” That way you leave without losing anything.'],
    eOutGot: ['¡Así se sale de una pelea!', 'That’s how you get out of a fight!'], exE: ['Si te vas, te doy una manzana', 'If you leave, I’ll give you an apple'], exE2: ['Vete a casa, por favor', 'Go home, please'],
    eFrames: ['Si te vas, te doy ___', '¡Qué ___ eres!', '¡Nos vamos! No queremos pelear'],
    tips: { eTell: 'Some foes can be talked down: read what each one says. Hungry → a deal «Si te vas, te doy una manzana» · proud → a compliment «¡Qué fuerte eres!» · doubtful → a reason «…porque somos amigos» · tired → ask nicely «Vete a casa, por favor». Or leave the fight: «¡Nos vamos! No queremos pelear».' },
    why: { eSi: 'After «si» (if), Spanish keeps the present: «si te vas» (not «si te vayas»). The subjunctive comes after «cuando».', eGive: '«te doy» = I give you: «doy» is for yo, and «te» says to whom.',
      ePerson: 'Talk to it: «eres» (you are). «es» is he / she / it, «soy» is I.', eConn: '«porque» (because) is one word. «por qué», with an accent, is the question «why?».', eVerb: 'A reason needs a verb: «porque somos amigos», «porque tenemos prisa».',
      ePersonR: 'The verb goes with who: «yo soy», «nosotros somos», «ellos son».', eNum: '«somos» is several of us: «somos amigos» (plural).', eImp: 'To tell it to go, use the command: «vete» (go away). «te vayas» alone isn’t one.',
      eInf: 'A command isn’t the infinitive: «vete» (not «irte»).', eOut: 'You and {name} both leave: «nos vamos» (we’re leaving). «me voy» is only you.' },
    slip: { eSi: '«si» slip (si + present)', eGive: '«te doy» slip', ePerson: 'Person slip (eres)', eConn: '«porque» slip', eVerb: 'Verb missing', ePersonR: 'Person slip', eNum: 'One or more? slip', eImp: 'Command slip (vete)', eInf: 'Command slip (vete)', eOut: 'Person slip (nos vamos)' },
    soft: { eWhy: 'Say why too: «No queremos pelear»', ePlease: 'Ask nicely: «por favor»', eSe: '«vete» (go away), not «ve» (go)', eSer: 'For what it is: «eres»', eWho: 'Say who: «eres»' },
    gloss: { hambre: 'hunger (tener hambre = to be hungry)', tengo: 'I have', 'más': 'most / more', fuerte: 'strong', todos: 'all', bonita: 'pretty', todas: 'all', 'por qué': 'why', peleamos: 'we fight', 'sueño': 'sleepiness (qué sueño = so sleepy)',
      quiero: 'I want', irme: 'to go (away)', casa: 'home / house', trato: 'deal', hecho: 'done (trato hecho = deal!)', gracias: 'thanks', eres: 'you are', amable: 'kind', tienes: 'you have', 'razón': 'reason (tener razón = to be right)',
      'adiós': 'bye', dormir: 'to sleep', chao: 'bye', casi: 'almost', convences: 'you convince', dices: 'you say', vale: 'okay', nadie: 'nobody', tenemos: 'we have', si: 'if', vas: 'you go (te vas = you leave)', doy: 'I give',
      porque: 'because', vete: 'go away', favor: 'favor (por favor = please)', vamos: 'we go (nos vamos = we’re leaving)', queremos: 'we want', pelear: 'to fight', amigos: 'friends', orgulloso: 'proud', orgullosa: 'proud', duda: 'doubts', cansado: 'tired', cansada: 'tired',
      'ñam': 'yum', escucha: 'listen', dicen: 'they say', cada: 'each', algo: 'something', 'muñeco': 'dummy', 'convéncelo': 'convince it', 'pídeselo': 'ask it', 'vale la pena': 'is worth it', sales: 'you leave', perder: 'to lose', nada: 'nothing' },
  });
  add('pt', {
    eHungry: ['Que fome!', 'I’m so hungry!'], eProud: ['Eu sou o mais forte de todos!', 'I’m the strongest of all!'], eProudF: ['Eu sou a mais bonita de todas!', 'I’m the prettiest of all!'],
    eDoubt: ['Por que a gente tá brigando, hein?', 'Why are we even fighting?'], eTired: ['Que sono… quero ir pra casa.', 'I’m so sleepy… I want to go home.'],
    eChipHungry: 'com fome', eChipProud: 'orgulhoso', eChipProudF: 'orgulhosa', eChipDoubt: 'com dúvida', eChipTired: 'cansado', eChipTiredF: 'cansada',
    eYesHungry: ['Fechado! Nham!', 'Deal! Yum!'], eYesProud: ['Ai, obrigado! Você é um amor.', 'Aw, thanks! You’re a sweetheart.'], eYesProudF: ['Ai, obrigada! Você é um amor.', 'Aw, thanks! You’re a sweetheart.'],
    eYesDoubt: ['Você tem razão… Tchau!', 'You’re right… Bye!'], eYesTired: ['É… vou dormir. Tchau!', 'Yeah… I’m off to sleep. Bye!'], eAlmost: ['Hmm… quase me convenceu.', 'Hmm… you almost convinced me.'],
    eNo: ['Hmm… não.', 'Hmm… no.'], eHuh: ['Hã? O que você disse?', 'Huh? What did you say?'], eByeFoe: ['Tá bom, tchau!', 'Okay, bye!'], eByeMimo: ['Tchau!', 'Bye!'], eNoOut: ['Daqui ninguém sai!', 'Nobody leaves here!'],
    eNoFood: ['A gente não tem!', 'We don’t have any!'],
    eHello: ['Hoje, vamos conversar! Nem sempre precisa brigar. Escuta o que eles dizem: cada um quer uma coisa.', 'Today, we talk! You don’t always have to fight. Listen to what they say: each one wants something.'],
    eDemo: ['Esse boneco tá com fome. Olha: «Se você for embora, eu te dou uma maçã».', 'This dummy is hungry. Watch: “If you leave, I’ll give you an apple.”'],
    eWhy: ['Depois de «se», pra algo que ainda vai acontecer: «se você for» (não «se você vai»). E «eu te dou»: eu dou pra você.', 'After «se» (if), for something still to come: «se você for» (the future subjunctive of «ir»; not «se você vai»). And «eu te dou»: I give (to) you.'],
    eYou: ['Agora você! Lê o que o outro diz e convence ele. Pro orgulhoso: «Você é muito forte!».', 'Now you! Read what the other one says and win it over. To the proud one: “You’re very strong!”'],
    eGot: ['Você convenceu! Sem nenhum golpe!', 'You won it over! Without a single hit!'],
    eRound: ['Esses querem outras coisas. Pro que tem dúvida, dá um motivo: «…porque a gente é amigo». Pro cansado, pede: «Vai embora, por favor».', 'These want other things. Give the doubtful one a reason: “…because we’re friends.” Ask the tired one: “Go away, please.”'],
    eOut: ['E se a briga não vale a pena: «Vamos embora! A gente não quer brigar». Assim você sai sem perder nada.', 'And if a fight isn’t worth it: “Let’s go! We don’t want to fight.” That way you leave without losing anything.'],
    eOutGot: ['É assim que se sai de uma briga!', 'That’s how you get out of a fight!'], exE: ['Se você for embora, eu te dou uma maçã', 'If you leave, I’ll give you an apple'], exE2: ['Vai embora, por favor', 'Go away, please'],
    eFrames: ['Se você for embora, eu te dou ___', 'Você é muito ___!', 'Vamos embora! A gente não quer brigar'],
    tips: { eTell: 'Some foes can be talked down: read what each one says. Hungry → a deal «Se você for embora, eu te dou uma maçã» · proud → a compliment «Você é muito forte!» · doubtful → a reason «…porque a gente é amigo» · tired → ask nicely «Vai embora, por favor». Or leave the fight: «Vamos embora! A gente não quer brigar».' },
    why: { eSi: 'After «se» (if) for something still to come, Portuguese uses the future subjunctive: «se você for embora» (not «se você vai embora»). For most verbs it looks like the infinitive.',
      eGive: '«eu te dou» = I give you: «dou» is for eu.', ePerson: 'Talk to it: «você é» (you are). «eu sou» is I.', eConn: '«porque» (because) is one word; «por que» asks «why?».', eVerb: 'A reason needs a verb: «porque a gente é amigo».',
      ePersonR: 'The verb goes with who: «eu sou», «nós somos», but «a gente é» (a gente takes the «ele» form).', eNum: '«somos» is several of us: «somos amigos» (plural).', eImp: 'To tell it to go: «vai embora».',
      eInf: 'A command isn’t the infinitive: «vai embora» (not «ir embora»).', eOut: 'You and {name} both leave: «vamos embora». «vou embora» is only you.' },
    slip: { eSi: '«se» slip (se você for)', eGive: '«eu te dou» slip', ePerson: 'Person slip (você é)', eConn: '«porque» slip', eVerb: 'Verb missing', ePersonR: 'Person slip', eNum: 'One or more? slip', eImp: 'Command slip (vai embora)', eInf: 'Command slip (vai embora)', eOut: 'Person slip (vamos embora)' },
    soft: { eWhy: 'Say why too: «A gente não quer brigar»', ePlease: 'Ask nicely: «por favor»', eSe: '«ir embora» = to leave: «vai embora»', eSer: 'For what it is: «você é»', eWho: 'Say who: «você é»' },
    gloss: { fome: 'hunger (que fome = I’m so hungry)', mais: 'most / more', forte: 'strong', todos: 'all', bonita: 'pretty', todas: 'all', 'brigando': 'fighting', sono: 'sleepiness (que sono = so sleepy)', quero: 'I want', casa: 'home',
      fechado: 'deal! (closed)', nham: 'yum', obrigado: 'thank you', obrigada: 'thank you', amor: 'love (um amor = a sweetheart)', 'você': 'you', tem: 'have', 'razão': 'reason (ter razão = to be right)', tchau: 'bye', dormir: 'to sleep',
      quase: 'almost', convenceu: 'convinced', disse: 'said', 'ninguém': 'nobody', sai: 'leaves', se: 'if', for: 'go (se você for = if you go)', embora: 'away (ir embora = to leave)', dou: 'I give', porque: 'because', favor: 'favor (por favor = please)',
      vamos: 'let’s go / we go', gente: 'people (a gente = we)', quer: 'wants', brigar: 'to fight', amigo: 'friend', orgulhoso: 'proud', orgulhosa: 'proud', 'dúvida': 'doubt', cansado: 'tired', cansada: 'tired', 'é': 'is / you are' },
  });
  add('de', {
    eHungry: ['Ich hab so einen Hunger!', 'I’m so hungry!'], eProud: ['Ich bin der Stärkste von allen!', 'I’m the strongest of all!'], eProudF: ['Ich bin die Schönste von allen!', 'I’m the prettiest of all!'],
    eProudN: ['Ich bin das Stärkste von allen!', 'I’m the strongest of all!'], eDoubt: ['Warum kämpfen wir eigentlich?', 'Why are we even fighting?'], eTired: ['So müde… ich will nach Hause.', 'So tired… I want to go home.'],
    eChipHungry: 'hungrig', eChipProud: 'stolz', eChipDoubt: 'zweifelt', eChipTired: 'müde',
    eYesHungry: ['Abgemacht! Mjam!', 'Deal! Yum!'], eYesProud: ['Oh, danke! Du bist echt nett.', 'Oh, thanks! You’re really nice.'], eYesDoubt: ['Du hast recht… Tschüss!', 'You’re right… Bye!'],
    eYesTired: ['Ja… ich geh schlafen. Tschüss!', 'Yeah… I’m off to sleep. Bye!'], eAlmost: ['Hmm… fast.', 'Hmm… almost.'], eNo: ['Hmm… nein.', 'Hmm… no.'], eHuh: ['Hä? Was sagst du?', 'Huh? What are you saying?'],
    eByeFoe: ['Na gut, tschüss!', 'Fine, bye!'], eByeMimo: ['Tschüss!', 'Bye!'], eNoOut: ['Hier geht keiner weg!', 'Nobody leaves here!'], eNoFood: ['Haben wir nicht!', 'We don’t have any!'],
    eHello: ['Heute reden wir! Man muss nicht immer kämpfen. Hör zu, was sie sagen: Jede will etwas.', 'Today we talk! You don’t always have to fight. Listen to what they say: each one wants something.'],
    eDemo: ['Diese Puppe hat Hunger. Schau: „Wenn du gehst, gebe ich dir einen Apfel.“', 'This dummy is hungry. Watch: “If you go, I’ll give you an apple.”'],
    eWhy: ['Nach „wenn“ kommt das Verb ans Ende: „wenn du gehst“. Danach kommt zuerst das Verb: „gebe ich dir“.', 'After «wenn» the verb goes to the end: «wenn du gehst». Then the next part starts with its verb: «gebe ich dir» (not «ich gebe dir»).'],
    eYou: ['Jetzt du! Lies, was die andere Puppe sagt, und überzeug sie: „Du bist so stark!“', 'Now you! Read what the other dummy says and win it over: “You’re so strong!”'],
    eGot: ['Überzeugt! Ganz ohne Schlag!', 'Won over! Without a single hit!'],
    eRound: ['Diese wollen etwas anderes. Wer zweifelt, braucht einen Grund: „…, weil wir Freunde sind.“ Wer müde ist, den bittest du: „Geh bitte nach Hause!“', 'These want something else. The doubtful one needs a reason: “…because we’re friends.” Ask the tired one: “Please go home!”'],
    eOut: ['Und wenn sich ein Kampf nicht lohnt: „Wir gehen! Wir wollen nicht kämpfen.“ So gehst du, ohne etwas zu verlieren.', 'And if a fight isn’t worth it: “We’re leaving! We don’t want to fight.” That way you leave without losing anything.'],
    eOutGot: ['So kommt man aus einem Kampf raus!', 'That’s how you get out of a fight!'], exE: ['Wenn du gehst, gebe ich dir einen Apfel', 'If you go, I’ll give you an apple'], exE2: ['Geh bitte nach Hause!', 'Please go home!'],
    eFrames: ['Wenn du gehst, gebe ich dir ___', 'Du bist so ___!', 'Wir gehen! Wir wollen nicht kämpfen'],
    tips: { eTell: 'Some foes can be talked down: read what each one says. Hungry → a deal «Wenn du gehst, gebe ich dir einen Apfel» · proud → a compliment «Du bist so stark!» · doubtful → a reason «…, weil wir Freunde sind» · tired → ask nicely «Geh bitte nach Hause!». Or leave the fight: «Wir gehen! Wir wollen nicht kämpfen».' },
    why: { eV2: 'After a «wenn» clause the next part starts with its verb: «…, gebe ich dir einen Apfel» (not «ich gebe dir»).', eGive: '«gebe ich dir» = I give you: «dir» (to you) is the dative.', eDu: 'Say who: «wenn du gehst».',
      ePerson: 'Talk to it: «du bist» (you are). «sie ist» is she / it.', ePred: 'After «bist» an adjective has no ending: «du bist stark» (not «starke»).', eWeil: 'After «weil» the verb goes to the very end: «weil wir Freunde sind».',
      eDenn: 'After «denn» the order stays normal, verb second: «denn wir sind Freunde».', eVerb: 'A reason needs a verb: «weil wir Freunde sind».', ePersonR: 'The verb goes with who: «ich bin», «wir sind», «du bist».',
      eImp: 'Tell it to go with the command: «Geh!» («du gehst» says what it does).', ePl: '«geht» is for several of you: to one, «geh».', eOut: 'You and {name} both leave: «Wir gehen!» («ich gehe» is only you).', eNum: '«wir sind» is several: «Freunde» (plural).' },
    slip: { eV2: 'Word-order slip (verb first)', eGive: 'Giving slip (dir)', eDu: 'Missing «du»', ePerson: 'Person slip (du bist)', ePred: 'Ending slip (no ending after bist)', eWeil: 'Word-order slip (verb last)', eDenn: 'Word-order slip (verb second)',
      eVerb: 'Verb missing', ePersonR: 'Ending slip', eImp: 'Command slip (geh)', ePl: 'Person slip (geh)', eOut: 'Person slip (wir gehen)', eNum: 'One or more? slip' },
    soft: { eWhy: 'Say why too: «Wir wollen nicht kämpfen»', ePlease: 'Ask nicely: «bitte»', eWho: 'Say who: «du bist»' },
    gloss: { hab: 'I have', hunger: 'hunger', 'stärkste': 'strongest', allen: 'all', 'schönste': 'prettiest', warum: 'why', 'kämpfen': 'fight', eigentlich: 'actually / even', 'müde': 'tired', will: 'want', hause: 'home (nach Hause = home)',
      abgemacht: 'deal!', mjam: 'yum', danke: 'thanks', echt: 'really', nett: 'nice', recht: 'right (recht haben = to be right)', 'tschüss': 'bye', schlafen: 'to sleep', fast: 'almost', nein: 'no', sagst: 'you say', keiner: 'nobody',
      wenn: 'if / when', gehst: 'you go', gebe: 'I give', dir: '(to) you', apfel: 'apple', bist: 'you are', stark: 'strong', weil: 'because', freunde: 'friends', sind: 'are', geh: 'go', bitte: 'please', wir: 'we', gehen: 'go', wollen: 'want',
      hungrig: 'hungry', stolz: 'proud', zweifelt: 'doubts' },
  });
  add('zh', {
    eHungry: ['[我|wǒ] [好|hǎo] [饿|è] [啊|a] ！', 'I’m so hungry!'], eProud: ['[我|wǒ] [最|zuì] [厉害|lì hai] [了|le] ！', 'I’m the greatest!'], eDoubt: ['[我们|wǒ men] [为什么|wèi shén me] [要|yào] [打架|dǎ jià] ？', 'Why are we even fighting?'],
    eTired: ['[好|hǎo] [困|kùn] … [我|wǒ] [想|xiǎng] [回家|huí jiā] 。', 'So sleepy… I want to go home.'],
    eChipHungry: '[饿|è] [了|le]', eChipProud: '[骄傲|jiāo ào]', eChipDoubt: '[疑惑|yí huò]', eChipTired: '[困|kùn] [了|le]',
    eYesHungry: ['[成交|chéng jiāo] ！ [好|hǎo] [吃|chī] ！', 'Deal! Yummy!'], eYesProud: ['[谢谢|xiè xie] ！ [你|nǐ] [真|zhēn] [好|hǎo] 。', 'Thanks! You’re so nice.'], eYesDoubt: ['[你|nǐ] [说|shuō] [得|de] [对|duì] … [再见|zài jiàn] ！', 'You’re right… Bye!'],
    eYesTired: ['[好|hǎo] … [我|wǒ] [回家|huí jiā] [睡觉|shuì jiào] [了|le] 。 [再见|zài jiàn] ！', 'Okay… I’m going home to sleep. Bye!'], eAlmost: ['[差|chà] [一点|yī diǎn] ！', 'Almost!'], eNo: ['[不|bù] [行|xíng] 。', 'Nope.'],
    eHuh: ['[啊|á] ？ [你|nǐ] [说|shuō] [什么|shén me] ？', 'Huh? What did you say?'], eByeFoe: ['[好|hǎo] [吧|ba] ， [再见|zài jiàn] ！', 'Fine, bye!'], eByeMimo: ['[再见|zài jiàn] ！', 'Bye!'],
    eNoOut: ['[谁|shéi] [也|yě] [别|bié] [想|xiǎng] [走|zǒu] ！', 'Nobody leaves!'], eNoFood: ['[我们|wǒ men] [没有|méi yǒu] ！', 'We don’t have any!'],
    eHello: ['[今天|jīn tiān] [我们|wǒ men] [练|liàn] [说话|shuō huà] ！ [不|bù] [一定|yī dìng] [要|yào] [打|dǎ] 。 [听|tīng] [它们|tā men] [说|shuō] [什么|shén me] ： [每|měi] [个|gè] [都|dōu] [想|xiǎng] [要|yào] [东西|dōng xi] 。', 'Today we practice talking! You don’t always have to fight. Listen to what they say: each one wants something.'],
    eDemo: ['[这个|zhè ge] [稻草人|dào cǎo rén] [饿|è] [了|le] 。 [你|nǐ] [看|kàn] ： [如果|rú guǒ] [你|nǐ] [走|zǒu] ， [我|wǒ] [就|jiù] [给|gěi] [你|nǐ] [一|yī] [个|gè] [苹果|píng guǒ] 。', 'This dummy is hungry. Watch: “If you go, I’ll give you an apple.”'],
    eWhy: ['[如果|rú guǒ] [说|shuō] [条件|tiáo jiàn] ， [就|jiù] [说|shuō] [结果|jié guǒ] 。 [苹果|píng guǒ] [用|yòng] [个|gè] ： [一|yī] [个|gè] [苹果|píng guǒ] 。', '如果 gives the condition, 就 the result: 如果你走，我就… And apples take 个: 一个苹果.'],
    eYou: ['[现在|xiàn zài] [轮到|lún dào] [你|nǐ] [了|le] ！ [听|tīng] [另|lìng] [一个|yī gè] [说|shuō] [什么|shén me] ， [夸|kuā] [它|tā] ： [你|nǐ] [真|zhēn] [厉害|lì hai] ！', 'Your turn! Listen to what the other one says, and praise it: “You’re so awesome!”'],
    eGot: ['[你|nǐ] [说服|shuō fú] [它|tā] [了|le] ！ [一|yī] [下|xià] [都|dōu] [没|méi] [打|dǎ] ！', 'You convinced it! Without a single hit!'],
    eRound: ['[这|zhè] [两个|liǎng gè] [想|xiǎng] [要|yào] [别的|bié de] 。 [有|yǒu] [疑惑|yí huò] [的|de] ， [给|gěi] [它|tā] [一个|yī gè] [理由|lǐ yóu] ： [因为|yīn wèi] [我们|wǒ men] [是|shì] [朋友|péng you] 。 [困|kùn] [了|le] [的|de] ， [就|jiù] [说|shuō] ： [请|qǐng] [你|nǐ] [回家|huí jiā] [吧|ba] 。', 'These two want other things. Give the doubtful one a reason: “because we’re friends”. To the sleepy one, say: “Please go home.”'],
    eOut: ['[如果|rú guǒ] [不|bù] [想|xiǎng] [打|dǎ] ， [就|jiù] [说|shuō] ： [我们|wǒ men] [走|zǒu] [吧|ba] ！ [我们|wǒ men] [不|bù] [想|xiǎng] [打架|dǎ jià] 。', 'If you don’t want to fight, say: “Let’s go! We don’t want to fight.”'],
    eOutGot: ['[这样|zhè yàng] [就|jiù] [能|néng] [离开|lí kāi] [了|le] ！', 'That’s how you get out of a fight!'], exE2: ['[请|qǐng] [你|nǐ] [回家|huí jiā] [吧|ba] ！', 'Please go home!'], exE: ['[如果|rú guǒ] [你|nǐ] [走|zǒu] ， [我|wǒ] [就|jiù] [给|gěi] [你|nǐ] [一|yī] [个|gè] [苹果|píng guǒ] ！', 'If you go, I’ll give you an apple!'],
    eFrames: ['[如果|rú guǒ] [你|nǐ] [走|zǒu] ， [我|wǒ] [就|jiù] [给|gěi] [你|nǐ] ___', '[你|nǐ] [真|zhēn] ___ ！', '[我们|wǒ men] [走|zǒu] [吧|ba] ！'],
    tips: { eTell: 'Some foes can be talked down: read what each one says. Hungry → a deal «[如果|rú guǒ] [你|nǐ] [走|zǒu] ， [我|wǒ] [就|jiù] [给|gěi] [你|nǐ] [一|yī] [个|gè] [苹果|píng guǒ]» · proud → praise «[你|nǐ] [真|zhēn] [厉害|lì hai]» · doubtful → a reason «[因为|yīn wèi] [我们|wǒ men] [是|shì] [朋友|péng you]» · sleepy → ask nicely «[请|qǐng] [你|nǐ] [回家|huí jiā] [吧|ba]». Or leave the fight: «[我们|wǒ men] [走|zǒu] [吧|ba]».' },
    why: { eShi: 'Adjectives don’t take 是: «你真厉害», «你很漂亮» (not «你是漂亮»).', eGive: 'Say what you’ll give: «我就给你一个苹果».', eGei: 'Say to whom: 给你 (give you).', eConn: '为什么 asks «why?»: «because» is 因为.',
      ePerson: 'Talk to it: 你 (you).', eVerb: 'A reason needs something after 因为: «因为我们是朋友».', eOut: 'You and {mimo} both leave: 我们走吧 (我 is only you).' },
    slip: { eShi: '是 slip', eGive: '给 slip', eGei: '给你 slip', eConn: '因为 slip', ePerson: 'Person slip (你)', eVerb: 'Reason missing', eOut: 'Person slip (我们)' },
    soft: { eJiu: '如果… 就: add 就', ePlease: 'Ask nicely: 请', eWho: 'Say who: 我们', eWhy: 'Say why too: 我们不想打架' },
    gloss: { 饿: 'hungry', 厉害: 'awesome / strong', 为什么: 'why', 打架: 'fight', 困: 'sleepy', 回家: 'go home', 骄傲: 'proud', 疑惑: 'doubtful', 成交: 'deal!', 好吃: 'yummy', 谢谢: 'thanks', 真: 'really', 再见: 'bye',
      睡觉: 'sleep', 差: 'lack (差一点 = almost)', 一点: 'a little', 行: 'okay', 别: 'don’t', 走: 'go / leave', 没有: 'don’t have', 如果: 'if', 就: 'then', 给: 'give', 苹果: 'apple', 条件: 'condition', 结果: 'result',
      另: 'other', 夸: 'praise', 说服: 'convince', 理由: 'reason', 因为: 'because', 朋友: 'friend', 请: 'please', 离开: 'leave', 东西: 'something', 每: 'each', 说话: 'talk', 一定: 'necessarily', 这样: 'like this', 能: 'can' },
  });
  add('ja', {
    eHungry: ['おなか すいた よ ！', 'I’m so hungry!'], eProud: ['おれ が [一番|いちばん] [強|つよ]い ！', 'I’m the strongest!'], eDoubt: ['なんで けんか する の ？', 'Why are we fighting?'],
    eTired: ['ねむい … [家|いえ] に [帰|かえ]りたい 。', 'Sleepy… I want to go home.'],
    eChipHungry: 'はらぺこ', eChipProud: 'いばってる', eChipDoubt: 'まよってる', eChipTired: 'ねむい',
    eYesHungry: ['[決|き]まり ！ いただきます ！', 'Deal! Thanks for the food!'], eYesProud: ['えへへ 、 ありがとう ！', 'Hehe, thanks!'], eYesDoubt: ['そう だ ね … じゃあ ね ！', 'You’re right… See you!'],
    eYesTired: ['うん … [帰|かえ]って [寝|ね]る 。 バイバイ ！', 'Yeah… I’ll go home and sleep. Bye-bye!'], eAlmost: ['うーん … もう [少|すこ]し 。', 'Hmm… almost.'], eNo: ['うーん … いや だ 。', 'Hmm… no.'],
    eHuh: ['え ？ なに ？', 'Huh? What?'], eByeFoe: ['じゃあ ね ！', 'See you!'], eByeMimo: ['バイバイ ！', 'Bye-bye!'], eNoOut: ['だれ も [逃|に]がさない ぞ ！', 'Nobody gets away!'], eNoFood: ['ない よ ！', 'We don’t have any!'],
    eHello: ['[今日|きょう] は [話|はな]す [練習|れんしゅう] です 。 いつも たたかう [必要|ひつよう] は ありません 。 [何|なに] を [言|い]って いる か 、 よく [聞|き]いて ください 。', 'Today we practice talking. You don’t always have to fight. Listen closely to what they say.'],
    eDemo: ['この かかし は おなか が すいて います 。 [見|み]て ください 。 「 [帰|かえ]ったら 、 りんご を あげる よ 」 。', 'This dummy is hungry. Watch: “If you go home, I’ll give you an apple.”'],
    eWhy: ['「 [帰|かえ]ったら 」 は 「 [帰|かえ]った 」 ＋ 「 ら 」 です 。 [自分|じぶん] が あげる とき は 「 あげる 」 。 「 くれる 」 は [相手|あいて] が くれる とき です 。', '«帰ったら» = «帰った» + «ら» (if you go home). When you give, it’s «あげる»; «くれる» is when someone gives to you.'],
    eYou: ['あなた の [番|ばん] です 。 もう [一体|いったい] の [言葉|ことば] を よく [聞|き]いて 、 ほめて ください 。 「 [強|つよ]い ね ！ 」', 'Your turn. Listen to the other one, and praise it: “You’re strong!”'],
    eGot: ['[説得|せっとく] できました ね ！ [一回|いっかい] も たたかって いません ！', 'You won it over! Without fighting once!'],
    eRound: ['こんど は ちがう もの が ほしい よう です 。 まよって いる [子|こ] に は [理由|りゆう] を 。 「 ともだち だ から 」 。 ねむい [子|こ] に は 「 [帰|かえ]って ください 」 。', 'These want other things. Give the unsure one a reason: “because we’re friends”. Tell the sleepy one: “Please go home.”'],
    eOut: ['たたかう [意味|いみ] が ない とき は 、 「 [帰|かえ]ろう ！ けんか したくない 」 。 これ で 、 [何|なに] も [失|うしな]わず に [抜|ぬ]けられます 。', 'When there’s no point fighting: “Let’s go home! We don’t want to fight.” That way you get out without losing anything.'],
    eOutGot: ['こう やって たたかい から [抜|ぬ]ける ん です ！', 'That’s how you get out of a fight!'], exE2: ['[帰|かえ]って ください', 'Please go home'], exE: ['[帰|かえ]ったら 、 りんご を あげる よ', 'If you go home, I’ll give you an apple'],
    eFrames: ['[帰|かえ]ったら 、 ___ を あげる よ', '[強|つよ]い ね ！', '[帰|かえ]ろう ！ けんか したくない'],
    tips: { eTell: 'Some foes can be talked down: read what each one says. Hungry → a deal «[帰|かえ]ったら 、 りんご を あげる よ» · proud → praise «[強|つよ]い ね ！» · unsure → a reason «ともだち だ から» · sleepy → ask nicely «[帰|かえ]って ください». Or leave the fight: «[帰|かえ]ろう ！ けんか したくない».' },
    why: { eAgeru: 'When you give, it’s «あげる» (帰ったら、りんごをあげる). «くれる» is someone giving to you.', eKara: 'After a noun, «から» needs «だ»: «ともだち だ から» (because we’re friends).', eConn: 'なんで / どうして ask «why?»: «because» is から after the reason.',
      eRude: '«帰れ» is a rude order. Ask nicely: «帰って ください».', ePerson: 'Praise it, not yourself: «強い ね！»', eGive: 'Say what you’ll give: «りんご を あげる».' },
    slip: { eAgeru: 'あげる slip', eKara: 'から slip', eConn: 'から slip', eRude: 'Too rude', ePerson: 'Person slip', eGive: 'Giving slip' },
    soft: { ePlease: 'Ask nicely: ください', eVol: 'Let’s: 帰ろう', eWhy: 'Say why too: けんか したくない' },
    gloss: { おなか: 'belly (おなかがすいた = hungry)', すいた: 'empty', 一番: 'the most', 強: 'strong', なんで: 'why', けんか: 'fight', ねむい: 'sleepy', 家: 'home', 帰: 'go home', はらぺこ: 'starving', いばってる: 'acting big', まよってる: 'unsure',
      決: 'settled', いただきます: 'thanks for the food', ありがとう: 'thank you', じゃあ: 'well then', 寝: 'sleep', バイバイ: 'bye-bye', 少: 'a little', いや: 'no', なに: 'what', 逃: 'escape', ない: 'none', あげる: 'give (to someone)',
      りんご: 'apple', から: 'because', ください: 'please', ともだち: 'friend', したくない: 'don’t want to do', 練習: 'practice', 必要: 'need', 説得: 'persuasion', 理由: 'reason', 意味: 'point / meaning', 失: 'lose', 抜: 'get out' },
  });
  T.mergeLang();

  // ---------------------------------------------------------------- reading what you said: es / pt / de (word sequences)
  // [words (normalized), tag, the right form]; within a list, longer first
  const LAT = {
    es: {
      out: [[['nos', 'vamos', 'a', 'casa']], [['nos', 'vamos']], [['vamonos']], [['nos', 'largamos']], [['nos', 'marchamos']], [['me', 'voy'], 'person', 'nos vamos'], [['me', 'marcho'], 'person', 'nos vamos'], [['se', 'van'], 'person', 'nos vamos']],
      why: [['no', 'queremos'], ['no', 'quiero'], ['no', 'vamos', 'a'], ['adios'], ['chao'], ['hasta', 'luego'], ['porque'], ['nos', 'vemos']],
      please: [[['puedes', 'irte']], [['te', 'puedes', 'ir']], [['podrias', 'irte']], [['vete']], [['vayase']], [['marchate']], [['alejate']], [['te', 'vayas'], 'mood', 'vete'], [['irte'], 'inf', 'vete'], [['irse'], 'inf', 'vete'], [['ve', 'a', 'casa'], 'se', 'vete a casa']],
      polite: [['por', 'favor'], ['porfa'], ['porfavor'], ['puedes'], ['podrias']], politeAdd: ', por favor',
      ifw: ['si'],
      leave: [[['nos', 'dejas', 'en', 'paz']], [['te', 'vas']], [['te', 'marchas']], [['nos', 'dejas']], [['te', 'alejas']], [['te', 'vayas'], 'mood', 'te vas'], [['te', 'marches'], 'mood', 'te marchas'], [['nos', 'dejes'], 'mood', 'nos dejas'],
        [['se', 'va'], 'person', 'te vas'], [['me', 'voy'], 'person', 'te vas'], [['nos', 'vamos'], 'person', 'te vas'], [['vas'], 'bare', 'te vas'], [['irte'], 'mood', 'te vas']],
      give: [[['te', 'voy', 'a', 'dar']], [['te', 'doy']], [['te', 'dare']], [['te', 'regalo']], [['le', 'doy']], [['te', 'da'], 'person', 'te doy'], [['te', 'das'], 'person', 'te doy'], [['te', 'dan'], 'person', 'te doy'], [['te', 'damos'], 'person', 'te doy'],
        [['te', 'dar'], 'inf', 'te doy'], [['darte'], 'inf', 'te doy'], [['dar'], 'inf', 'te doy'], [['doy'], 'pron', 'te doy'], [['dare'], 'pron', 'te daré']],
      give0: 'te doy',
      be: [[['eres']], [['es'], 'person', 'eres'], [['soy'], 'person', 'eres'], [['son'], 'person', 'eres'], [['estas'], 'estar', 'eres']], be0: 'eres', que: ['que', 'como', 'tan'],
      adjs: { fuerte: 'mf', valiente: 'mf', elegante: 'mf', genial: 'mf', increible: 'mf', grande: 'mf', amable: 'mf', bonito: 'm', bonita: 'f', lindo: 'm', linda: 'f', guapo: 'm', guapa: 'f', precioso: 'm', preciosa: 'f',
        hermoso: 'm', hermosa: 'f', rapido: 'm', rapida: 'f', listo: 'm', lista: 'f', simpatico: 'm', simpatica: 'f', bueno: 'm', buena: 'f', fantastico: 'm', fantastica: 'f', maravilloso: 'm', maravillosa: 'f' },
      most: { art: { el: 'm', la: 'f' }, mas: 'mas' },
      conn: [[['porque']], [['por', 'que'], 'bad', 'porque'], [['xq'], 'bad', 'porque'], [['pq'], 'bad', 'porque']],
      verbs: { ser: ['soy', 'eres', 'es', 'somos', 'son'], estar: ['estoy', 'estás', 'está', 'estamos', 'están'], querer: ['quiero', 'quieres', 'quiere', 'queremos', 'quieren'], tener: ['tengo', 'tienes', 'tiene', 'tenemos', 'tienen'],
        poder: ['puedo', 'puedes', 'puede', 'podemos', 'pueden'], ir: ['voy', 'vas', 'va', 'vamos', 'van'], necesitar: ['necesito', 'necesitas', 'necesita', 'necesitamos', 'necesitan'], venir: ['vengo', 'vienes', 'viene', 'venimos', 'vienen'],
        hacer: ['hago', 'haces', 'hace', 'hacemos', 'hacen'], pelear: ['peleo', 'peleas', 'pelea', 'peleamos', 'pelean'], buscar: ['busco', 'buscas', 'busca', 'buscamos', 'buscan'] },
      be1: 'ser', prons: { yo: 0, nosotros: 3, nosotras: 3, ellos: 4, ellas: 4, ustedes: 4, ella: 2, usted: 2 }, friend: { sg: ['amigo', 'amiga'], pl: ['amigos', 'amigas'] },
      arts: { un: 'm', una: 'f', el: 'm', la: 'f', unos: 'm', unas: 'f', los: 'm', las: 'f', mi: 'mf', este: 'm', esta: 'f' }, art: { m: 'un', f: 'una' },
    },
    pt: {
      out: [[['a', 'gente', 'vai', 'embora']], [['nos', 'vamos', 'embora']], [['estamos', 'indo', 'embora']], [['vamos', 'embora']], [['vamos', 'nessa']], [['eu', 'vou', 'embora'], 'person', 'vamos embora'], [['vou', 'embora'], 'person', 'vamos embora']],
      why: [['nao', 'queremos'], ['nao', 'quer'], ['nao', 'quero'], ['tchau'], ['ate', 'mais'], ['ate', 'logo'], ['porque']],
      please: [[['voce', 'pode', 'ir', 'embora']], [['pode', 'ir', 'embora']], [['vai', 'embora']], [['va', 'embora']], [['vai', 'pra', 'casa']], [['va', 'pra', 'casa']], [['ir', 'embora'], 'inf', 'vai embora']],
      polite: [['por', 'favor'], ['pode'], ['poderia']], politeAdd: ', por favor',
      ifw: ['se'],
      leave: [[['voce', 'for', 'embora']], [['tu', 'fores', 'embora']], [['for', 'embora']], [['fores', 'embora']], [['for', 'pra', 'casa']], [['nos', 'deixar', 'em', 'paz']], [['deixar', 'a', 'gente', 'em', 'paz']],
        [['voce', 'vai', 'embora'], 'mood', 'você for embora'], [['vai', 'embora'], 'mood', 'for embora'], [['va', 'embora'], 'mood', 'for embora'], [['ir', 'embora'], 'mood', 'for embora'], [['eu', 'for', 'embora'], 'person', 'você for embora'], [['formos', 'embora'], 'person', 'você for embora']],
      give: [[['eu', 'te', 'dou']], [['vou', 'te', 'dar']], [['te', 'dou']], [['te', 'darei']], [['dou', 'pra', 'voce']], [['dou']], [['te', 'da'], 'person', 'te dou'], [['te', 'dar'], 'inf', 'te dou']],
      give0: 'eu te dou',
      be: [[['voce', 'e']], [['tu', 'es']], [['voce', 'sou'], 'person', 'você é'], [['eu', 'sou'], 'person', 'você é'], [['voce', 'sao'], 'person', 'você é'], [['voce', 'esta'], 'estar', 'você é'], [['voce', 'ta'], 'estar', 'você é']], be0: 'você é', que: ['que', 'como', 'tao'],
      adjs: { forte: 'mf', legal: 'mf', elegante: 'mf', incrivel: 'mf', grande: 'mf', valente: 'mf', inteligente: 'mf', bonito: 'm', bonita: 'f', lindo: 'm', linda: 'f', corajoso: 'm', corajosa: 'f', rapido: 'm', rapida: 'f',
        esperto: 'm', esperta: 'f', fofo: 'm', fofa: 'f', simpatico: 'm', simpatica: 'f', bom: 'm', boa: 'f', maravilhoso: 'm', maravilhosa: 'f' },
      most: { art: { o: 'm', a: 'f' }, mas: 'mais' },
      conn: [[['porque']], [['por', 'que'], 'bad', 'porque'], [['pq'], 'bad', 'porque']],
      verbs: { ser: ['sou', 'és', 'é', 'somos', 'são'], estar: ['estou', 'está', 'está', 'estamos', 'estão'], querer: ['quero', 'quer', 'quer', 'queremos', 'querem'], ter: ['tenho', 'tem', 'tem', 'temos', 'têm'],
        poder: ['posso', 'pode', 'pode', 'podemos', 'podem'], ir: ['vou', 'vai', 'vai', 'vamos', 'vão'], precisar: ['preciso', 'precisa', 'precisa', 'precisamos', 'precisam'] },
      be1: 'ser', prons: { eu: 0, voce: 2, ele: 2, ela: 2, nos: 3, voces: 4, eles: 4, elas: 4, gente: 2 }, friend: { sg: ['amigo', 'amiga'], pl: ['amigos', 'amigas'] },
      arts: { um: 'm', uma: 'f', o: 'm', a: 'f', uns: 'm', umas: 'f', os: 'm', as: 'f' }, art: { m: 'um', f: 'uma' },
    },
    de: {
      out: [[['lass', 'uns', 'gehen']], [['lasst', 'uns', 'gehen']], [['wir', 'hauen', 'ab']], [['wir', 'gehen']], [['gehen', 'wir']], [['wir', 'verschwinden']], [['ich', 'gehe'], 'person', 'wir gehen'], [['ich', 'geh'], 'person', 'wir gehen'], [['wir', 'geht'], 'ending', 'wir gehen']],
      why: [['wir', 'wollen', 'nicht'], ['ich', 'will', 'nicht'], ['tschuss'], ['bis', 'dann'], ['weil'], ['denn'], ['kein', 'streit']],
      please: [[['kannst', 'du', 'bitte', 'gehen']], [['kannst', 'du', 'gehen']], [['konntest', 'du', 'gehen']], [['geh', 'nach', 'hause']], [['geh', 'heim']], [['geh', 'weg']], [['geh']], [['gehe']], [['du', 'gehst'], 'mood', 'geh'], [['gehst'], 'mood', 'geh'], [['geht'], 'person', 'geh']],
      polite: [['bitte'], ['kannst'], ['konntest']], politeAdd: ' bitte', politeAfter: true,
      ifw: ['wenn', 'falls'],
      leave: [[['weggehst']], [['gehst']], [['abhaust']], [['verschwindest']], [['heimgehst']], [['gehen'], 'ending', 'gehst'], [['geht'], 'ending', 'gehst'], [['gehe'], 'ending', 'gehst'], [['weggehen'], 'ending', 'weggehst']],
      give: [[['gebe', 'ich', 'dir']], [['geb', 'ich', 'dir']], [['kriegst', 'du']], [['bekommst', 'du']], [['ich', 'gebe', 'dir'], 'order', 'gebe ich dir'], [['ich', 'geb', 'dir'], 'order', 'geb ich dir'], [['gebe', 'ich', 'dich'], 'case', 'gebe ich dir'],
        [['ich', 'gebe', 'dich'], 'case', 'gebe ich dir'], [['gibt', 'ich', 'dir'], 'ending', 'gebe ich dir'], [['gebe', 'dir'], 'pron', 'gebe ich dir']],
      give0: 'gebe ich dir',
      be: [[['du', 'bist']], [['bist', 'du']], [['du', 'ist'], 'ending', 'du bist'], [['du', 'bin'], 'person', 'du bist'], [['sie', 'ist'], 'person', 'du bist'], [['er', 'ist'], 'person', 'du bist'], [['es', 'ist'], 'person', 'du bist']], be0: 'du bist', que: ['wie', 'so', 'was'],
      stems: ['stark', 'schon', 'hubsch', 'toll', 'mutig', 'schnell', 'klug', 'gross', 'suss', 'lieb', 'nett', 'super', 'elegant', 'prima', 'cool', 'wunderschon', 'fantastisch', 'kraftig', 'witzig'],
      conn: [[['weil'], 'weil'], [['denn'], 'denn']],
      verbs: { sein: ['bin', 'bist', 'ist', 'sind', 'sind'], wollen: ['will', 'willst', 'will', 'wollen', 'wollen'], haben: ['habe', 'hast', 'hat', 'haben', 'haben'], konnen: ['kann', 'kannst', 'kann', 'können', 'können'],
        mussen: ['muss', 'musst', 'muss', 'müssen', 'müssen'], gehen: ['gehe', 'gehst', 'geht', 'gehen', 'gehen'], mogen: ['mag', 'magst', 'mag', 'mögen', 'mögen'], brauchen: ['brauche', 'brauchst', 'braucht', 'brauchen', 'brauchen'],
        kampfen: ['kämpfe', 'kämpfst', 'kämpft', 'kämpfen', 'kämpfen'] },
      be1: 'sein', prons: { ich: 0, du: 1, er: 2, es: 2, wir: 3 }, friend: { sg: ['freund', 'freundin'], pl: ['freunde', 'freundinnen'] },
      arts: { einen: 'm', eine: 'f', ein: 'n', den: 'm', die: 'f', das: 'n', der: 'x', dem: 'x' }, art: { m: 'einen', f: 'eine', n: 'ein' },
    },
  };
  for (const C of Object.values(LAT)) {
    C.vIdx = new Map();
    for (const [lemma, forms] of Object.entries(C.verbs)) forms.forEach((f, p) => { const n = P.nrm(f); if (!C.vIdx.has(n)) C.vIdx.set(n, { lemma, p }); });
  }
  const seek = (t, list, from = 0, to = t.length, skip) => {
    for (let k = from; k < to; k++) {
      if (skip && skip(k)) continue;
      for (const e of list) { const s = e[0]; if (k + s.length <= to && s.every((w, j) => t[k + j].n === w && !(skip && skip(k + j)))) return { k, len: s.length, tag: e[1] || 'ok', to: e[2] }; }
    }
    return null;
  };
  const seekAny = (t, seqs) => seqs.some(s => seek(t, [[s]]));
  const clauseEnd = (t, from, max = t.length) => { for (let k = from; k < max; k++) if (t[k].comma) return k + 1; return max; };
  const matchCase = (was, to) => (was && was[0] !== was[0].toLowerCase() ? to.charAt(0).toUpperCase() + to.slice(1) : to);
  // the sentence with its fixes: { k, len, to } replaces words; len 0 puts words in (before word k, after it with after, or at the end)
  function applyFx(text, t, list) {
    let s = String(text);
    const endPos = s.replace(/[\s!?.¡¿…»"”]+$/u, '').length;
    const ops = list.map(o => (o.len ? { a: t[o.k].i, b: t[o.k + o.len - 1].j, to: o.to, rep: true } : o.after ? { a: t[o.k - 1].j, b: t[o.k - 1].j, to: o.to }
      : o.k < t.length ? { a: t[o.k].i, b: t[o.k].i, to: o.to + ' ' } : { a: endPos, b: endPos, to: /^[\s,;]/.test(o.to) ? o.to : ' ' + o.to })).sort((p, q) => q.a - p.a || q.b - p.b);
    let last = Infinity;
    for (const o of ops) { if (o.b > last) continue; s = s.slice(0, o.a) + (o.rep ? matchCase(s.slice(o.a, o.b), o.to) : o.to) + s.slice(o.b); last = o.a; }
    return s;
  }
  function foodIn(t, skip) {
    const I = P.indexLang(X().G.L);
    if (!I.foods) return null;
    for (let k = 0; k < t.length; k++) { if (skip && skip(k)) continue; const m = P.look(I.foods, t[k].n); if (m) return Object.assign({ k, word: t[k].raw }, m); }
    return null;
  }
  // a compliment's adjective: es / pt { g, pl }; de { end } (an ending after «bist» is a slip)
  function adjOf(C, n) {
    if (C.adjs) {
      if (C.adjs[n]) return { g: C.adjs[n] };
      if (n.endsWith('es') && C.adjs[n.slice(0, -2)] === 'mf') return { g: 'mf', pl: true };
      if (n.endsWith('s') && C.adjs[n.slice(0, -1)]) return { g: C.adjs[n.slice(0, -1)], pl: true };
      return null;
    }
    for (const s of C.stems) { if (n === s) return { end: '' }; const e = n.slice(s.length); if (n.startsWith(s) && ['e', 'en', 'er', 'es', 'em'].includes(e)) return { end: e }; }
    return null;
  }
  const regender = (raw, g) => (/^bo[am]$/i.test(raw) ? (g === 'f' ? 'boa' : 'bom') : g === 'f' ? raw.replace(/o(s?)$/i, 'a$1') : raw.replace(/a(s?)$/i, 'o$1'));
  function latRead(text, ctx) {
    const L = ctx.L, C = LAT[L.code]; if (!C) return null;
    const t = H.toks(text), ways = [], used = new Set(), I = P.indexLang(L);
    // a battle verb in it: it's a command, not talk
    if (t.some(w => I.verbs.has(w.n))) return null;
    const skip = k => used.has(k), take = (k, n) => { for (let i = k; i < k + n; i++) used.add(i); };
    const W = way => { const w = { way, errors: [], fixes: [], soft: [], fx: [] }; ways.push(w); return w; };
    const fixAt = (w, h, to) => w.fx.push({ k: h.k, len: h.len, to });
    // a deal: «si te vas, te doy una manzana» · «se você for embora, eu te dou…» · «wenn du gehst, gebe ich dir…»
    const si = seek(t, C.ifw.map(s => [[s]]));
    let food = null;
    if (si) {
      const give = seek(t, C.give, 0, t.length, k => k === si.k);
      const end = clauseEnd(t, si.k + 1, give && give.k > si.k ? give.k : t.length);
      const lv = seek(t, C.leave, si.k + 1, end), busy = new Set([si.k]);
      for (const h of [give, lv]) if (h) for (let i = h.k; i < h.k + h.len; i++) busy.add(i);
      food = foodIn(t, k => busy.has(k));                // (not «te» in «te doy»: that's no «té»)
      if (give || food) {
        const w = W('deal');
        if (!lv) return { fail: 'tac:dealVerb' };
        if (lv.tag === 'mood' || lv.tag === 'person' || lv.tag === 'ending') { H.err(w.errors, lv.tag === 'mood' ? 'eSi' : lv.tag === 'ending' ? 'ending' : 'ePerson'); fixAt(w, lv, lv.to); }
        else if (lv.tag === 'bare') { w.soft.push('eSe'); fixAt(w, lv, lv.to); }
        if (L.code === 'de') {          // «wenn du gehst»: who, and the verb at the end of its clause
          const cl = t.slice(si.k + 1, end), last = end - 1;
          let noDu = false;
          if (cl.some(x => x.n === 'ich')) H.err(w.errors, 'ePerson');
          else if (!cl.some(x => x.n === 'du')) { noDu = true; H.err(w.errors, 'eDu'); w.fx.push({ k: si.k + 1, len: 0, to: 'du' }); }
          if (lv.k + lv.len - 1 !== last && !lv.tag.match(/mood|person/)) {
            H.err(w.errors, 'order');
            const words = (noDu ? ['du'] : []).concat(cl.filter((x, i) => si.k + 1 + i < lv.k || si.k + 1 + i >= lv.k + lv.len).map(x => x.raw), [lv.to || t.slice(lv.k, lv.k + lv.len).map(x => x.raw).join(' ')]);
            w.fx = w.fx.filter(o => o.k < si.k + 1 || o.k >= end);
            w.fx.push({ k: si.k + 1, len: end - si.k - 1, to: words.join(' ') });
          }
        }
        take(si.k, end - si.k);
        if (!give) { H.err(w.errors, 'eGive'); if (food) w.fx.push({ k: food.k > 0 && C.arts[t[food.k - 1].n] ? food.k - 1 : food.k, len: 0, to: C.give0 }); }
        else {
          take(give.k, give.len);
          const fine = give.tag === 'ok' || (give.tag === 'order' && give.k < si.k);    // (de: «Ich gebe dir…, wenn du gehst» is right)
          if (!fine) { H.err(w.errors, give.tag === 'order' ? 'eV2' : give.tag === 'case' ? 'case' : give.tag === 'ending' ? 'ending' : 'eGive'); fixAt(w, give, give.to); }
        }
        if (!food) return { fail: 'tac:dealFood' };
        // the food's article (de: the accusative)
        const ak = food.k - 1, art = ak >= 0 ? t[ak].n : null, ag = art != null ? C.arts[art] : undefined, fg = food.g || 'm';
        if (ag === undefined) { if (!food.mass && !food.pl) { w.fixes.push('article'); w.fx.push({ k: food.k, len: 0, to: C.art[fg] || C.art.m }); } }
        else if (L.code === 'de') { if (ag === 'x' || (fg === 'm' && ag === 'n')) { H.err(w.errors, 'case'); w.fx.push({ k: ak, len: 1, to: C.art[fg] }); } else if (ag !== fg && !(fg === 'n' && ag === 'n')) { H.err(w.errors, 'gender'); w.fx.push({ k: ak, len: 1, to: C.art[fg] }); } }
        else if (ag !== 'mf' && ag !== fg) { H.err(w.errors, 'gender'); w.fx.push({ k: ak, len: 1, to: C.art[fg] }); }
        take(Math.max(0, ak), food.k - Math.max(0, ak) + 1);
        w.food = food;
      }
    }
    // leaving together: «¡Nos vamos!» (nothing else counts then)
    const o = seek(t, C.out, 0, t.length, skip);
    if (o) {
      const w = { way: 'out', errors: [], fixes: [], soft: [], fx: [] };
      if (o.tag !== 'ok') { H.err(w.errors, o.tag === 'ending' ? 'ending' : 'eOut'); fixAt(w, o, o.to); }
      if (!seekAny(t, C.why)) w.soft.push('eWhy');
      return { t, out: w, used };
    }
    // ask it nicely: «Vete a casa, por favor»
    const pl = seek(t, C.please, 0, t.length, skip);
    if (pl) {
      const w = W('please'); take(pl.k, pl.len);
      if (pl.tag !== 'ok') { if (pl.tag === 'se') w.soft.push('eSe'); else H.err(w.errors, { mood: 'eImp', inf: 'eInf', person: 'ePl' }[pl.tag] || 'eImp'); fixAt(w, pl, pl.to); }
      if (!seekAny(t, C.polite)) { w.soft.push('ePlease'); w.fx.push(C.politeAfter ? { k: pl.k + 1, len: 0, to: C.politeAdd, after: true } : { k: t.length, len: 0, to: C.politeAdd }); }
    }
    // a compliment: «¡Qué fuerte eres!» · «Você é muito forte!» · «Du bist so stark!»
    const ak = t.findIndex((w, k) => !skip(k) && adjOf(C, w.n));
    if (ak >= 0) {
      const be = seek(t, C.be, 0, t.length, skip), que = t.slice(0, ak).some(w => C.que.includes(w.n));
      if (be || que) {
        const w = W('praise'), a = adjOf(C, t[ak].n);
        w.adj = Object.assign({ k: ak, raw: t[ak].raw }, a);
        if (C.most && t[ak - 1] && t[ak - 1].n === C.most.mas && t[ak - 2] && C.most.art[t[ak - 2].n]) w.adj.art = { k: ak - 2, g: C.most.art[t[ak - 2].n] };
        if (be) {
          take(be.k, be.len);
          if (be.tag === 'estar') { w.soft.push('eSer'); fixAt(w, be, be.to); }
          else if (be.tag !== 'ok') { H.err(w.errors, be.tag === 'ending' ? 'ending' : 'ePerson'); fixAt(w, be, be.to); }
        } else {
          w.soft.push('eWho');
          const so = L.code === 'de' ? t.slice(0, ak).findIndex(x => x.n === 'so') : -1;      // (de «So stark!» → «Du bist so stark!»)
          w.fx.push(so >= 0 ? { k: so, len: 1, to: C.be0 + ' so' } : { k: ak + 1, len: 0, to: C.be0 });
        }
        if (L.code === 'de' && a.end) { H.err(w.errors, 'ePred'); w.fx.push({ k: ak, len: 1, to: t[ak].raw.slice(0, t[ak].raw.length - a.end.length) }); }
        take(ak, 1);
      }
    }
    // a reason: «… porque somos amigos» · «… porque a gente é amigo» · «…, weil wir Freunde sind»
    const cn = seek(t, C.conn, 0, t.length, skip);
    if (cn) {
      const w = W('reason'); take(cn.k, cn.len);
      if (cn.tag === 'bad') { H.err(w.errors, 'eConn'); fixAt(w, cn, cn.to); }
      const from = cn.k + cn.len, end = clauseEnd(t, from);
      let vk = -1;
      for (let k = from; k < end; k++) if (C.vIdx.has(t[k].n) && !(L.code === 'pt' && t[k].n === 'e' && t[k].raw !== 'é')) { vk = k; break; }
      if (vk < 0) H.err(w.errors, 'eVerb');
      else {
        const V = C.vIdx.get(t[vk].n), forms = C.verbs[V.lemma];
        let right = t[vk].raw;
        const pk = t.slice(from, vk).map(x => x.n).reverse().find(n => C.prons[n] !== undefined);
        if (pk !== undefined) {
          const want = C.prons[pk];
          if (forms[want] && P.nrm(forms[want]) !== t[vk].n && !(want === 2 && V.p === 1 && L.code === 'pt')) { H.err(w.errors, 'ePersonR'); right = forms[want]; }
        }
        if (V.lemma === C.be1 && t[vk + 1] && C.friend) {
          const pIdx = pk !== undefined ? C.prons[pk] : V.p, pl = pIdx >= 3, nx = t[vk + 1].n;
          if (pl && C.friend.sg.includes(nx) && !(L.code === 'pt' && pk === 'gente')) { H.err(w.errors, 'eNum'); w.fx.push({ k: vk + 1, len: 1, to: C.friend.pl[C.friend.sg.indexOf(nx)] }); }
        }
        if (L.code === 'de') {          // «weil»: the verb last · «denn»: the verb second
          const lastK = end - 1 - (t[end - 1] && t[end - 1].comma && end - 1 > vk ? 0 : 0);
          if (cn.tag === 'weil' && vk !== lastK) {
            H.err(w.errors, 'eWeil');
            const words = t.slice(from, end).filter((x, i) => from + i !== vk).map(x => x.raw).concat([right]);
            w.fx.push({ k: from, len: end - from, to: words.join(' ') });
            right = null;
          } else if (cn.tag === 'denn' && vk !== from + 1 && vk === lastK && end - from > 2) {
            H.err(w.errors, 'eDenn');
            const rest = t.slice(from, end).filter((x, i) => from + i !== vk).map(x => x.raw);
            w.fx.push({ k: from, len: end - from, to: [rest[0], right].concat(rest.slice(1)).join(' ') });
            right = null;
          }
        }
        if (right && right !== t[vk].raw) w.fx.push({ k: vk, len: 1, to: right });
      }
    }
    if (!ways.length) return null;
    const named = H.byWords(t.filter((w, k) => !used.has(k)), ctx.foes.filter(talkable));
    return { t, ways, used, named, food };
  }

  // ---------------------------------------------------------------- reading what you said: zh / ja (units, CJK.typed)
  const ZE = {
    out: [['[我们|wǒ men] [先|xiān] [走|zǒu] [了|le]'], ['[我们|wǒ men] [回家|huí jiā] [吧|ba]'], ['[我们|wǒ men] [走|zǒu] [吧|ba]'], ['[咱们|zán men] [走|zǒu] [吧|ba]'], ['[我们|wǒ men] [走|zǒu] [了|le]'], ['[我们|wǒ men] [走|zǒu]'],
      ['[我|wǒ] [先|xiān] [走|zǒu] [了|le]', 'person'], ['[我|wǒ] [走|zǒu] [了|le]', 'person'], ['[走|zǒu] [吧|ba]', 'who']],
    why: ['[不|bù] [想|xiǎng] [打架|dǎ jià]', '[不要|bú yào] [打架|dǎ jià]', '[再见|zài jiàn]', '[因为|yīn wèi]', '[别|bié] [打|dǎ] [了|le]'],
    please: [['[请|qǐng] [你|nǐ] [回家|huí jiā]'], ['[请|qǐng] [你|nǐ] [离开|lí kāi]'], ['[请|qǐng] [你|nǐ] [走|zǒu]'], ['[请|qǐng] [回家|huí jiā]'], ['[请|qǐng] [离开|lí kāi]'], ['[请|qǐng] [走|zǒu]'],
      ['[你|nǐ] [回家|huí jiā] [吧|ba]', 'soft'], ['[你|nǐ] [走|zǒu] [吧|ba]', 'soft'], ['[回家|huí jiā] [吧|ba]', 'soft'], ['[走|zǒu] [开|kāi]', 'soft']],
    ifw: ['[如果|rú guǒ]', '[要是|yào shi]'], go: ['[回家|huí jiā]', '[离开|lí kāi]', '[走|zǒu]'], jiu: ['[就|jiù]'], gei: ['[给|gěi]'], ni: ['[你|nǐ]'],
    adjs: ['[了不起|liǎo bu qǐ]', '[厉害|lì hai]', '[漂亮|piào liang]', '[好看|hǎo kàn]', '[可爱|kě ài]', '[勇敢|yǒng gǎn]', '[聪明|cōng ming]', '[强|qiáng]', '[帅|shuài]', '[棒|bàng]', '[美|měi]'],
    shi: ['[是|shì]'], de: ['[的|de]'], others: ['[他|tā]', '[她|tā]', '[它|tā]', '[我|wǒ]'], because: ['[因为|yīn wèi]'], whyQ: ['[为什么|wèi shén me]'], nums: ['[一|yī]', '[两|liǎng]', '[三|sān]'],
  };
  const JE = {
    out: [['[帰|かえ]りましょう'], ['もう [行|い]こう'], ['[帰|かえ]ろう'], ['[行|い]こう'], ['[逃|に]げよう'], ['[帰|かえ]ります'], ['[帰|かえ]る', 'vol']],
    why: ['けんか したくない', 'たたかいたくない', 'じゃあ ね', 'バイバイ', 'さようなら', 'から'],
    please: [['[帰|かえ]って ください'], ['[帰|かえ]って くれる'], ['[帰|かえ]って くれない'], ['どいて ください'], ['[帰|かえ]れ', 'rude'], ['どけ', 'rude'], ['[帰|かえ]って', 'soft'], ['どいて', 'soft']],
    ifw: [['[帰|かえ]って くれたら'], ['[帰|かえ]ったら'], ['[行|い]ったら'], ['どいたら'], ['[帰|かえ]るなら'], ['[帰|かえ]るたら', 'tara'], ['[帰|かえ]りたら', 'tara']],
    give: [['あげます'], ['あげる'], ['やる'], ['くれます', 'ageru'], ['くれる', 'ageru'], ['もらう', 'ageru']],
    adjI: ['かっこいい', 'かわいい', 'すごい', '[強|つよ]い', '[速|はや]い', 'やさしい', '[美|うつく]しい', 'えらい', '[大|おお]きい'], adjNa: ['きれい', 'すてき', 'りっぱ'],
    da: ['だ'], na: ['な'], kara: ['から', 'ので'], karaNoun: ['ともだち から', 'なかま から', '[友達|ともだち] から'], soreKara: ['それから'], whyQ: ['なぜ', 'どうして', 'なんで'], self: ['わたし', 'ぼく', 'おれ'], wo: ['を'],
  };
  const Wd = (src, l) => CJ().wordOf(src, l);
  function cf(U, list, l, from = 0, to = U.length, skip) {
    for (let i = from; i < to; i++) {
      if (skip && skip(i)) continue;
      for (const e of list) { const src = Array.isArray(e) ? e[0] : e; const m = CJ().matchAt(Wd(src, l), U, i, l, { homo: true }); if (m && m.j <= to && !(skip && [...Array(m.j - i).keys()].some(d => skip(i + d)))) return Object.assign({ i, src, tag: (Array.isArray(e) && e[1]) || 'ok' }, m); }
    }
    return null;
  }
  // the food you named, among the battle's foods (zh: with its measure word)
  function cjFood(U, l, from = 0) {
    const G = X().G;
    for (let i = from; i < U.length; i++) for (const f of Object.values(G.foods || {})) for (const w of [f.w].concat(f.alt || [])) { const m = w && CJ().matchAt(Wd(w, l), U, i, l, { homo: true }); if (m) return { i, j: m.j, id: f.id, w: f.w }; }
    return null;
  }
  const clOf = id => (_.foodCl ? _.foodCl(id) : '个') || '个';
  function cjRead(text, ctx) {
    const C = CJ(), L = ctx.L, l = L.code; if (!C) return null;
    // a battle verb in it (not 打 in 打架): it's a command, not talk
    const r0 = T.parse0(text, Object.assign({}, ctx, { tacSkip: true }));
    if (r0 && r0.ok && r0.kind === 'command') return null;
    const { U } = C.typed(text, l), ways = [], used = new Set();
    const skip = i => used.has(i), take = (a, b) => { for (let i = a; i < b; i++) used.add(i); };
    const W = way => { const w = { way, errors: [], fixes: [], soft: [] }; ways.push(w); return w; };
    let food = null;
    if (l === 'zh') {
      const Z = ZE, iff = cf(U, Z.ifw, l);
      if (iff) {
        const gei = cf(U, Z.gei, l, iff.j);
        food = cjFood(U, l, iff.j);
        if (gei || food) {
          const w = W('deal'), go = cf(U, Z.go, l, iff.j, gei ? gei.i : food ? food.i : U.length);
          if (!go) return { fail: 'tac:dealVerb' };
          if (!gei) H.err(w.errors, 'eGive'); else if (!cf(U, Z.ni, l, gei.j, gei.j + 1)) H.err(w.errors, 'eGei');
          if (!cf(U, Z.jiu, l, go.j, gei ? gei.i + 1 : U.length)) w.soft.push('eJiu');
          if (!food) return { fail: 'tac:dealFood' };
          const num = cf(U, Z.nums, l, Math.max(0, food.i - 2), food.i);
          if (num) {
            const cl = clOf(food.id), u = U[num.j], py = (L.clPinyin && L.clPinyin[cl]) || 'gè', clKey = C.canon(`[${cl}|${py}]`, 'zh');
            const ok = food.i - num.j === 1 && u && (u.han ? u.ch === cl : u.syl === clKey);
            if (!ok) H.err(w.errors, 'measure');
          }
          w.food = food; take(iff.i, food.j);
        }
      }
      const o = cf(U, Z.out, l, 0, U.length, skip);
      if (o) {
        const w = { way: 'out', errors: [], fixes: [], soft: [] };
        if (o.tag === 'person') H.err(w.errors, 'eOut'); else if (o.tag === 'who') w.soft.push('eWho');
        if (!Z.why.some(s => cf(U, [s], l))) w.soft.push('eWhy');
        return { U, out: w };
      }
      const pl = cf(U, Z.please, l, 0, U.length, skip);
      if (pl) { const w = W('please'); take(pl.i, pl.j); if (pl.tag === 'soft') w.soft.push('ePlease'); }
      const ad = cf(U, Z.adjs, l, 0, U.length, skip);
      if (ad) {
        const w = W('praise'); w.adj = { src: ad.src };
        const shi = cf(U, Z.shi, l, Math.max(0, ad.i - 3), ad.i);
        if (shi && !cf(U, Z.de, l, ad.j)) H.err(w.errors, 'eShi');
        if (cf(U, Z.others, l, 0, ad.i) && !cf(U, Z.ni, l, 0, ad.i)) H.err(w.errors, 'ePerson');
        take(ad.i, ad.j);
      }
      const bc = cf(U, Z.because, l, 0, U.length, skip), wq = !bc && cf(U, Z.whyQ, l, 0, U.length, skip);
      if (bc || (wq && !/[?？]\s*$/.test(String(text)))) {
        const w = W('reason'), at = bc || wq;
        if (!bc) H.err(w.errors, 'eConn');
        if (U.length - at.j < 2) H.err(w.errors, 'eVerb');
      }
    } else {
      const J = JE, iff = cf(U, J.ifw, l);
      if (iff) {
        const give = cf(U, J.give, l, iff.j);
        food = cjFood(U, l, iff.j);
        if (give || food) {
          const w = W('deal');
          if (iff.tag === 'tara') H.err(w.errors, 'tara');
          if (!give) H.err(w.errors, 'eGive'); else if (give.tag === 'ageru') H.err(w.errors, 'eAgeru');
          if (!food) return { fail: 'tac:dealFood' };
          if (!cf(U, J.wo, l, food.j, food.j + 1)) w.soft.push('tacWo');
          w.food = food; take(iff.i, give ? give.j : food.j);
        }
      }
      const o = cf(U, J.out, l, 0, U.length, skip);
      if (o) {
        const w = { way: 'out', errors: [], fixes: [], soft: [] };
        if (o.tag === 'vol') w.soft.push('eVol');
        if (!J.why.some(s => cf(U, [s], l))) w.soft.push('eWhy');
        return { U, out: w };
      }
      const pl = cf(U, J.please, l, 0, U.length, skip);
      if (pl) { const w = W('please'); take(pl.i, pl.j); if (pl.tag === 'soft') w.soft.push('ePlease'); else if (pl.tag === 'rude') H.err(w.errors, 'eRude'); }
      const ai = cf(U, J.adjI, l, 0, U.length, skip), an = !ai && cf(U, J.adjNa, l, 0, U.length, skip);
      if (ai || an) {
        const w = W('praise'), a = ai || an; w.adj = { src: a.src, na: !!an };
        if (ai && cf(U, J.da, l, a.j, a.j + 1)) H.err(w.errors, 'iAdj');
        const na = an && cf(U, J.na, l, a.j, a.j + 1), next = na ? U[na.j] : null;
        if (na && (!next || (next.k && /^[ねよ]$/.test(next.k)))) H.err(w.errors, 'iAdj');      // (きれい な ね: no; きれい な はね: fine)
        if (cf(U, J.self, l, 0, a.i)) H.err(w.errors, 'ePerson');
        take(a.i, a.j);
      }
      const sk = cf(U, J.soreKara, l), kn = cf(U, J.karaNoun, l), ka = cf(U, J.kara, l, 0, U.length, i => skip(i) || (sk && i >= sk.i && i < sk.j));
      const wq = !ka && cf(U, J.whyQ, l, 0, U.length, skip);
      if ((ka && ka.i > 0) || (wq && !/[?？]\s*$/.test(String(text)))) {
        const w = W('reason');
        if (kn) H.err(w.errors, 'eKara'); else if (!ka) H.err(w.errors, 'eConn');
      }
    }
    if (!ways.length) return null;
    const cands = ctx.foes.filter(talkable);
    const named = cands.filter(f => { const sp = L.species[f.species]; return sp && cf(U, [sp.w].concat(sp.alt || []), l, 0, U.length, skip); });
    return { U, ways, named: named.length ? named : null, food };
  }
  // the right sentence, zh / ja: a model of the way you took, with your food or adjective in it
  function cjCanon(l, way, f, F, w) {
    const G = X().G, food = w && w.food ? G.foods[w.food.id] : null;
    if (l === 'zh') {
      if (way === 'out') return '[我们|wǒ men] [走|zǒu] [吧|ba] ！ [我们|wǒ men] [不|bù] [想|xiǎng] [打架|dǎ jià] 。';
      if (way === 'deal') { const cl = clOf(food ? food.id : 'w.apple'), py = (G.L.clPinyin && G.L.clPinyin[cl]) || 'gè'; return `[如果|rú guǒ] [你|nǐ] [走|zǒu] ， [我|wǒ] [就|jiù] [给|gěi] [你|nǐ] [一|yī] [${cl}|${py}] ${food ? food.w : '[苹果|píng guǒ]'} ！`; }
      if (way === 'praise') return `[你|nǐ] [真|zhēn] ${(w && w.adj && w.adj.src) || '[厉害|lì hai]'} ！`;
      if (way === 'please') return '[请|qǐng] [你|nǐ] [回家|huí jiā] [吧|ba] ！';
      return '[因为|yīn wèi] [我们|wǒ men] [是|shì] [朋友|péng you] ！';
    }
    if (way === 'out') return '[帰|かえ]ろう ！ けんか したくない 。';
    if (way === 'deal') return `[帰|かえ]ったら 、 ${food ? food.w : 'りんご'} を あげる よ ！`;
    if (way === 'praise') return `${(w && w.adj && w.adj.src) || '[強|つよ]い'} ${w && w.adj && w.adj.na ? 'だ ね' : 'ね'} ！`;
    if (way === 'please') return '[帰|かえ]って ください ！';
    return 'ともだち だ から 、 [帰|かえ]って ください ！';
  }

  // ---------------------------------------------------------------- the whole-turn reader: who it's for, the grade, the canon
  const lx = () => T.LX[X().G.lang] || T.LX.es;
  function eRead(text, ctx) {
    if (ctx.tacInner) return null;
    const L = ctx.L, F = L.cjk ? cjRead(text, ctx) : latRead(text, ctx);
    if (!F) return null;
    if (F.fail) return { ok: false, raw: text, reason: F.fail };
    const x = X(), G = x.G;
    if (F.out) {
      if (bossy(G)) return { ok: false, raw: text, reason: 'tac:noOut' };
      return result(text, ctx, F, F.out, null, [F.out]);
    }
    const cands = bossy(G) ? [] : ctx.foes.filter(talkable);           // (a boss fight: nobody listens)
    if (!cands.length) return ctx.shy ? null : { ok: false, raw: text, reason: 'tac:noTalk' };
    const pool = F.named && F.named.length ? F.named : cands;
    let f = null, w = null;
    for (const way of F.ways) { const m = pool.find(k => WAY[k.tacTaste] === way.way); if (m) { f = m; w = way; break; } }
    if (!f) {
      if (ctx.shy) return null;                    // (a shy one here, and nothing here wants this: the shy one's talk)
      f = pool[0]; w = F.ways[0];
    }
    // a deal pays in food from the bag (practice: anything)
    if (w.way === 'deal' && w.food && !G.practice && !(G.bag[w.food.id] > 0)) return { ok: false, raw: text, reason: 'tac:noFood', word: w.food.word || (G.foods[w.food.id] || {}).w };
    // a compliment agrees with who it's for (es / pt; «el más / la más» too)
    if (w.way === 'praise' && w.adj && !L.cjk && L.code !== 'de') {
      const g = H.gender(f);
      if (w.adj.g && w.adj.g !== 'mf' && w.adj.g !== g) { H.err(w.errors, 'gender'); w.fx.push({ k: w.adj.k, len: 1, to: regender(w.adj.raw, g) }); }
      if (w.adj.art && w.adj.art.g !== g) { H.err(w.errors, 'gender'); w.fx.push({ k: w.adj.art.k, len: 1, to: L.code === 'es' ? (g === 'f' ? 'la' : 'el') : (g === 'f' ? 'a' : 'o') }); }
    }
    return result(text, ctx, F, w, f, F.ways);
  }
  function result(text, ctx, F, w, f, ways) {
    const L = ctx.L, errors = ways.flatMap(k => k.errors), fixes = ways.flatMap(k => k.fixes), soft = ways.flatMap(k => k.soft);
    let canon;
    if (L.cjk) canon = errors.length || soft.length ? cjCanon(L.code, w.way, f, F, w) : String(text).trim();
    else canon = applyFx(text, F.t, ways.flatMap(k => k.fx));
    const G = X().G, food = w.food ? w.food.id : null;
    const words = [food].filter(id => id && typeof LEX !== 'undefined' && LEX.item(id));
    if (f && L.species[f.species] && F.named && F.named.includes(f)) words.push('n.' + f.species);
    const en = { deal: 'a deal', praise: 'a compliment', reason: 'a reason', please: 'ask it to go', out: 'talk your way out: you both leave the fight' }[w.way];
    const fits = f && WAY[f.tacTaste] === w.way;
    const tacPreview = w.way === 'out' ? `${en}${bossy(G) ? '' : ' <span class="bonus">nothing lost</span>'}` : `talk → ${f ? `the ${{ hungry: 'hungry', proud: 'proud', doubt: 'doubtful', tired: 'tired' }[f.tacTaste]} ${f.species}` : 'them'}: ${en}${fits ? ' <span class="bonus">that’s what it wants</span>' : ' <span class="warn">it wants something else</span>'}`;
    return {
      ok: true, kind: 'tac', tac: 'E', raw: text, canon, errors, fixes, soft, clauses: [], words, untaught: [], patterns: ['talk-' + w.way],
      key: P.tokenize(text).map(t => t.n).join(' '), recast: errors.length > 0 || fixes.length > 0 || soft.length > 0,
      tacWay: w.way, tacFoe: f, tacFood: food, tacPreview, tacPerform: perform,
    };
  }
  T.whole.push({ k: 'E', id: 'talk', fn: eRead });
  T.eRead = (text, ctx) => { const x = X(); const c = ctx || x.ctx(); return { found: c.L.cjk ? cjRead(text, c) : latRead(text, c), r: eRead(text, c) }; };

  // ---------------------------------------------------------------- what happens: it's won over, it says no, or you all leave
  async function perform(r) {
    const x = X(), G = x.G, A = x.A, M = A.mimo, g = r.grade || { letter: 'C' };
    x.facing('foes');
    if (r.recast) {
      x.noteMistake({ kind: 'grammar', typed: r.raw, right: r.canon, errors: [...new Set(r.errors.map(e => e.kind).concat(r.fixes || []))], grade: g.letter });
      x.say(M, P.recastHTML(r.canon, r.raw, x.UI.esc), { html: true, cls: 'mimo', dur: 2.8 });
      G.stats.recasts++; x.emit('recast');
      await x.wait(1.1);
    }
    if (r.tacWay === 'out') { await talkOut(r); return; }
    const f = r.tacFoe;
    if (!f || !f.alive) { await x.wait(0.6); return; }
    x.ST.shot('action', M, f, { yaw: -0.05 });
    x.turnTo(f, x.yawTo(f, A.you.x, A.you.z), 0.2);
    x.setMood(f, 'listen', 1.2);
    await x.wait(0.7);
    x.showGrade(f, { right: true });
    const fits = WAY[f.tacTaste] === r.tacWay;
    if (g.letter === 'D') { H.foeSay(f, 'eHuh', { cls: 'foe', dur: 2.0 }); x.setMood(M, 'confused', 1.4); await x.wait(1.4); }
    else if (!fits) {
      H.foeSay(f, 'eNo', { cls: 'foe', dur: 1.6 }); x.setMood(M, 'confused', 1.4); x.squash(f, 1.1, 0.9, 0.08);
      await x.wait(1.5);
      H.foeSay(f, 'e' + cap(f.tacTaste), { cls: 'foe', dur: 3.0 });
      await x.wait(1.2);
    } else if (g.letter === 'C' && !f.tacSwayed) {
      f.tacSwayed = true;
      H.foeSay(f, 'eAlmost', { cls: 'foe', dur: 2.0 }); x.setMood(f, 'happy', 1.0);
      await x.wait(1.5);
    } else await calm(f, r);
    x.turnTo(f, f.baseYaw, 0.3);
    await x.mimoReact(g.letter);
    x.ST.shot('wide');
  }
  // won over: what it wanted (the food thrown to it, hearts, a nod, a yawn), then it waves and goes home
  async function calm(f, r) {
    const x = X(), G = x.G, A = x.A, M = A.mimo, ST = x.ST;
    const top = () => ST.worldOf(f, 'top');
    if (f.tacTaste === 'hungry') {
      const id = r.tacFood, ball = new THREE.Mesh(TK.G.sphere, TK.toon(id === 'w.fish' ? '#8fb6d8' : id === 'w.bread' ? '#d9a35a' : id === 'w.honey' ? '#f2b632' : '#e2574c', { rim: 0.2 }));
      ball.scale.setScalar(0.16); ST.S.scene.add(ball);
      const p0 = ST.worldOf(M, 'top'), p1 = ST.worldOf(f, 'mid');
      x.squash(M, 1.15, 0.88, 0.06); x.emit('throw');
      await x.along(0.5, u => ball.position.set(lerp(p0.x, p1.x, u), lerp(p0.y, p1.y, u) + Math.sin(u * Math.PI) * 1.1, lerp(p0.z, p1.z, u)));
      ST.S.scene.remove(ball);
      if (id && !G.practice && G.bag[id] > 0) { G.bag[id]--; G.stats.used[id] = (G.stats.used[id] || 0) + 1; x.refreshBag(); }
      for (let i = 0; i < 3; i++) await x.squash(f, 1.12, 0.9, 0.06);
      x.emit('eat');
    } else if (f.tacTaste === 'proud') {
      for (let i = 0; i < 3; i++) x.wait(i * 0.18).then(() => H.pop(f, '♥', { color: '#ff8fb3', size: 26 + i * 4, dx: (i - 1) * 0.3, rise: 0.6, life: 1.2 }));
      x.tween(f, { tint: 1 }, 0.6, 'io');
    } else if (f.tacTaste === 'tired') { H.pop(f, 'z z z', { color: '#c9d6ff', size: 24, rise: 0.5, life: 1.4 }); await x.tween(f, { sy: 0.86, sx: 1.08 }, 0.4, 'io'); x.tween(f, { sy: 1, sx: 1 }, 0.3); }
    else { await x.squash(f, 0.92, 1.1, 0.12); await x.squash(f, 0.92, 1.1, 0.12); }
    x.setMood(f, 'happy', 4);
    H.foeSay(f, 'eYes' + cap(f.tacTaste), { cls: 'foe', dur: 2.4 });
    x.emit('befriend');
    const p = top(); ST.S.fx.sparkle(p.x, p.y, p.z, 22, ['#ffd166', '#ff9bb3', '#a8f0c0']); ST.note(p);
    f.calmed = true; f.alive = false; f.befriended = true;
    G.stats.befriended++; G.stats.talked = (G.stats.talked || 0) + 1;
    x.earn(1);                                       // (a beaten one pays 2: talking pays a little less, and costs no hit)
    x.UI.labelRemove(f); x.UI.tagRemove(`pos:${f.id}`); x.UI.tagRemove(`part:${f.id}:`);
    if (!r.demo && _.api && _.api.freeWord) _.api.freeWord(f);
    x.updateStain();
    await x.wait(1.3);
    x.turnTo(f, Math.PI / 2, 0.15);
    for (let i = 0; i < 3; i++) await x.arcTo(f, f.x + 2.4, f.baseY || 0, f.z + 0.3, 0.3, 0.5);
    f.hidden = true; f.gone = true;
    const L = G.tacLesson;
    if (L && L.k === 'E' && !r.demo) { L.got = (L.got || 0) + 1; if (T.learn('E')) T.learnedBanner('E'); }
  }
  // «¡Nos vamos!»: everyone says bye, and the fight ends as a flight (flow.js: G.tacOut)
  async function talkOut(r) {
    const x = X(), G = x.G, A = x.A;
    const foes = x.targetable().filter(f => !f.shy && !f.hidden);
    x.ST.shot('wide');
    if (foes[0]) x.showGrade(foes[0], { right: true });
    if (r.grade && r.grade.letter === 'D') { if (foes[0]) H.foeSay(foes[0], 'eHuh', { cls: 'foe', dur: 2.0 }); await x.wait(1.4); return; }
    const [t, en] = H.line('eByeMimo'); x.say(A.mimo, t, { cls: 'mimo', en, dur: 1.8 });
    x.tween(A.you, { point: 1 }, 0.15).then(() => x.wait(0.6)).then(() => x.tween(A.you, { point: 0 }, 0.3));
    await x.wait(0.6);
    foes.forEach((f, i) => { x.setMood(f, 'happy', 2.5); x.squash(f, 1.1, 0.9, 0.08); if (i === 0) H.foeSay(f, 'eByeFoe', { cls: 'foe', dur: 2.0 }); });
    await x.wait(1.3);
    G.stats.talkedOut = (G.stats.talkedOut || 0) + 1;
    const L = G.tacLesson;
    if (L && L.k === 'E') L.out = (L.out || 0) + 1;
    G.tacOut = 'flee';
  }

  // ---------------------------------------------------------------- the tells, the chips, the frames and the tip
  T.beginHooks.push(() => { const G = X().G; for (const f of G.foes) { f.tacTaste = T.forceTaste || (f.spec && f.spec.tacTaste) || TASTE[f.species] || null; f.tacTold = false; f.tacSwayed = false; } G.tacTalkTold = false; });
  async function tellMoods() {
    const x = X(), G = x.G;
    if (!T.on('E') || bossy(G)) return;
    const list = x.targetable().filter(f => talkable(f) && !f.tacTold && !f.hidden);
    if (!list.length) return;
    x.ST.shot('wide');
    for (const f of list.slice(0, 2)) {
      f.tacTold = true;
      x.setMood(f, 'go', 1.4); x.squash(f, 0.9, 1.12, 0.08);
      if (G.practice) x.tween(x.A.coach, { point: 1 }, 0.15).then(() => x.wait(0.8)).then(() => x.tween(x.A.coach, { point: 0 }, 0.3));
      const t = H.foeSay(f, 'e' + cap(f.tacTaste), { cls: 'foe', dur: 4.2 });
      x.emit('shout', { text: t, high: false, foe: f });
      await x.wait(1.0);
    }
    x.refreshLabels();
    if (!G.tacTalkTold) {
      G.tacTalkTold = true;
      H.tip('eTell');
      const fr = lx().eFrames || T.LX.es.eFrames;
      G.frames = G.frames.filter(k => !String(k.pat).startsWith('talk-'));
      G.frames.unshift({ text: fr[0], pat: 'talk-deal', uses: 2 }, { text: fr[2], pat: 'talk-out', uses: 2 });
      x.renderFrames();
    }
  }
  T.turnHooks.push(tellMoods);
  const UI0 = _.UI, label0 = UI0.label;
  UI0.label = (f, html) => {
    if (f && f.tacTold && talkable(f) && T.on('E')) {
      const t = lx(), key = 'eChip' + cap(f.tacTaste), g = H.gender(f), w = (g === 'f' && t[key + 'F']) || t[key] || T.LX.es[key];
      const chip = `<span class="bt-chip state">${X().UI.esc(w)}</span>`;
      html = /<\/div>/.test(html) ? html.replace('</div>', chip + '</div>') : html + chip;
    }
    return label0(f, html);
  };
  // what went wrong before a turn was used
  T.explainHooks.push(r => {
    const x = X(), G = x.G, M = x.A.mimo;
    const hint = s => x.UI.hint(s, true);
    switch (r.reason) {
      case 'tac:noTalk': x.setMood(M, 'confused', 1.4); x.mimoLine('none', 1.6); hint('Nobody here can be talked down right now: bosses, shadows you haven’t lit and sleepers don’t listen.'); return true;
      case 'tac:noOut': { const f = x.targetable()[0]; if (f) H.foeSay(f, 'eNoOut', { cls: 'foe shout', dur: 2.2 }); hint('You can’t talk your way out of a boss fight.'); return true; }
      case 'tac:dealVerb': x.setMood(M, 'confused', 1.4); x.mimoLine('noverb', 1.6); hint(`In the «if» part, say what it should do: «${H.plain(lx().exE[0])}».`); return true;
      case 'tac:dealFood': x.setMood(M, 'confused', 1.4); x.mimoLine('noverb', 1.6); hint(`A deal needs food from the bag: «${H.plain(lx().exE[0])}».`); return true;
      case 'tac:noFood': {
        x.setMood(M, 'sad', 1.4); const [t, en] = H.line('eNoFood'); x.say(M, t, { cls: 'mimo', en, dur: 1.8 });
        const have = x.bagFoods().map(id => `«${H.plain(x.foodThe(id))}»`).join(', ');
        hint(`There’s no «${H.plain(r.word || '')}» in the bag.${have ? ' Offer what you have: ' + have + '.' : ' The bag is empty: try another way, or «' + H.plain(lx().eFrames[2]) + '».'}`); return true;
      }
    }
    return false;
  });

  // ---------------------------------------------------------------- the lesson at the yard (focus 'tac:E')
  const dummy = (color, taste) => ({ kind: 'dummy', color, size: 'small', hp: 9, tacTaste: taste });
  T.specsHooks.push((specs, opts) => {
    if (!opts.practice || opts.focus !== 'tac:E') return;
    const x = X(); specs.length = 0;
    [dummy('red', 'hungry'), dummy('blue', 'proud')].forEach(s => specs.push(x.normFoe(s, specs.length)));
  });
  T.lessons.E = async (x, G) => {
    await x.intro();
    x.ST.shot('coach');
    await H.coach('eHello');
    G.tacLesson = { k: 'E', got: 0 };
    // the demonstration: the hungry one says so; Bruno's deal; it takes the apple and goes home
    const d = G.foes.find(f => f.tacTaste === 'hungry'), apple = G.foods['w.apple'] ? 'w.apple' : Object.keys(G.foods)[0] || null;
    if (d) {
      d.tacTold = true; x.setMood(d, 'go', 1.4);
      x.tween(x.A.coach, { point: 1 }, 0.15).then(() => x.wait(0.8)).then(() => x.tween(x.A.coach, { point: 0 }, 0.3));
      H.foeSay(d, 'eHungry', { cls: 'foe', dur: 3.5 });
      await x.wait(1.4);
      x.refreshLabels();
      await H.coach('eDemo');
      x.say(x.A.coach, H.plain(H.line('exE')[0]) + (G.L.cjk ? '' : '.'), { cls: 'coach', dur: 2.4 });
      await x.wait(0.6);
      await calm(d, { demo: true, tacFood: apple, grade: { letter: 'S' } });
    }
    await H.coach('eWhy');
    await H.coach('eYou');
    let round = 0;
    for (;;) {
      x.setupScaffolds();
      x.UI.rung(`Skill · talk them down: <b>«${x.UI.esc(H.plain(H.line(round % 2 ? 'exE2' : 'exE')[0]))}»</b>`);
      G.roundLog0 = G.stats.gradeLog.length;
      const out = await T.lessonLoop(x, G, {
        after: async r => { const L = G.tacLesson; if (r && r.kind === 'tac' && r.tac === 'E' && L.got === 1 && !L.cheered) { L.cheered = true; await H.coach('eGot'); } },
      });
      if (out === 'flee') {                 // (talking your way out of practice: Bruno laughs, and the round's done)
        G.tacOut = null;
        x.ST.shot('coach'); await H.coach('eOutGot');
        for (const f of G.foes) if (f.alive && !f.calmed) { f.alive = false; x.UI.labelRemove(f); }
        if (T.learn('E')) T.learnedBanner('E');
      }
      await x.practiceCheer();
      if (!(await x.practiceCard())) break;
      G.round++; round++;
      await T.newDummies(x, G, 2, round % 2 ? [dummy('green', 'doubt'), dummy('yellow', 'tired')] : [dummy('red', 'hungry'), dummy('blue', 'proud')]);
      for (const f of G.foes) { f.tacTaste = f.spec.tacTaste; f.tacTold = false; f.tacSwayed = false; }
      if (round % 2) { x.ST.shot('coach'); await H.coach('eRound'); await H.coach('eOut'); }
    }
    x.ST.shot('coach');
    await x.coachSay('pDone');
    return 'done';
  };
  T.eCalm = calm;
})();

// ================================================================ C · Team orders
// From bell 8 (DESIGN.md 17.3, 13.1): one sentence, several people, each verb in its own person (T.whole, kind 'tac'):
//   tú to Mimo «golpea al rojo» · Bruno by name «Bruno, protege a Mimo» · yo «yo distraigo al grande» · nosotros «¡Saltemos
//   todos!», «¡Golpeemos al rojo!» · ustedes / ellos (Mimo and Bruno) «¡Empujen la roca!», «Bruno y Mimo, golpeen al azul»,
//   joined by «mientras» / «y luego» / commas: «Bruno, protege a Mimo mientras yo distraigo al grande».
// What each does: Mimo's moves as always; Bruno runs in and strikes (when he's on the field: the yard, the Gray Marsh); you
// throw a stone; «protege / protejo» guards Mimo, you or everyone for the foes' next turn (an attack on them is blocked);
// «distraigo / distrae» keeps a foe busy: it doesn't attack this round, and hits on it this turn are ×1.5; «we» is everyone
// at once (Mimo, Bruno if he's there, and your stone); «you two» is Mimo and Bruno.
// The Gray Marsh (marsh_battle.js): its «you all / let's» hook steps aside once C is on (it checks for this k 'C' reader);
// C reads the same forms through the shared table, team.js TEAM (read / strip / forms), with the same moves (Bruno strikes,
// «let's» adds your stone), counts G.stats.team (the marsh's drill), and «¡Iluminemos!» keeps its double flash (c.marshTeam).
// Graded per language: es -en / -emos (not «golpean», «golpeamos»), «yo distraigo»; pt «batam», «vamos bater», «eu distraio»;
// de «schlagt», «schlagen wir», «ich lenke … ab» but «während ich … ablenke» (verb last, joined); zh 你们 / 我们…吧 / 我来…;
// ja みんな、…て / …よう / わたしが…る (the plain form for yourself), ブルーノは…て.
(() => {
  const _ = window.BATTLE._, P = _.P, T = _.tac, H = T && T.h;
  if (!T || !H || typeof TEAM === 'undefined') return;
  const X = () => _.flow;
  const CJ = () => (typeof CJK !== 'undefined' ? CJK : null);
  const add = (l, o) => { const t = T.LX[l]; if (!t) return; const { tips, why, slip, soft, gloss, ...rest } = o; Object.assign(t, rest); for (const k of ['tips', 'why', 'slip', 'soft', 'gloss']) if (o[k]) t[k] = Object.assign(t[k] || {}, o[k]); };
  add('es', {
    cHello: ['¡Hoy, en equipo! En una sola frase, dile a cada uno qué hacer, y cada verbo con su persona.', 'Today: as a team! In one sentence, tell each one what to do, each verb in its person.'],
    cDemo: ['Mira: «Mimo, golpea al grande mientras yo lo distraigo».', 'Watch: “Mimo, hit the big one while I distract it.”'],
    cWhy: ['A Mimo: «golpea». Yo: «distraigo». Todos: «¡golpeemos!». Ustedes dos: «¡golpeen!».', 'To Mimo: «golpea» (tú). Me: «distraigo» (yo). All of us: «¡golpeemos!» (nosotros). You two: «¡golpeen!» (ustedes).'],
    cYou: ['¡Ahora tú! Danos órdenes a Mimo y a mí en una frase: «Bruno, protege a Mimo mientras yo distraigo al grande».', 'Now you! Give Mimo and me orders in one sentence: “Bruno, protect Mimo while I distract the big one.”'],
    cGot: ['¡Así se trabaja en equipo!', 'That’s teamwork!'], cWe: ['Y todos juntos: «¡Golpeemos al rojo!». O ustedes dos: «¡Golpeen al azul!».', 'And all together: “Let’s hit the red one!” Or you two: “Hit the blue one!”'],
    cOk: ['¡Voy!', 'On it!'], cGuard: ['¡Yo te cubro!', 'I’ve got you covered!'], cHey: ['¡Eh, tú! ¡Por aquí!', 'Hey, you! Over here!'], cBlock: ['¡Bloqueado!', 'Blocked!'], cAll: ['¡Todos juntos!', 'All together!'], cToma: ['¡Toma!', 'Take that!'],
    exC: ['Bruno, protege a Mimo mientras yo distraigo al grande', 'Bruno, protect Mimo while I distract the big one'], exC2: ['¡Golpeemos al rojo!', 'Let’s hit the red one!'], cFrames: ['Bruno, ___ mientras yo ___', '¡___emos! · ¡___en!'],
    tips: { cTeam: 'Team orders: one sentence, each verb in its person. «Bruno, protege a Mimo mientras yo distraigo al grande» · all of us: «¡Golpeemos al rojo!» (you throw a stone too) · you two: «¡Golpeen al rojo!».',
      cSolo: 'Team orders: say what you do yourself too: «Mimo, golpea al rojo mientras yo distraigo al azul» (a distracted foe doesn’t attack, and takes ×1.5) · all of us: «¡Golpeemos al rojo!» (you throw a stone too).' },
    why: { cMe: 'What you do yourself takes the yo form: «yo distraigo», «yo protejo», «yo lanzo».', cYou: 'To two or more, the ustedes form: «¡golpeen!», «¡protejan!» («golpean» says what they do).',
      cWe: 'All of us, you too: «¡golpeemos!» («golpeamos» says what we do).', cOne: 'To one (Bruno or {name}): «protege», «golpea».', cWhich: 'Say which one: its color, its size, or where it is.' },
    slip: { cMe: 'Person slip (yo)', cYou: 'Person slip (ustedes)', cWe: 'Person slip (nosotros)', cOne: 'Person slip (tú)', cWhich: 'Say which one' },
    gloss: { protege: 'protect', distraigo: 'I distract', distrae: 'distract', mientras: 'while', golpeemos: 'let’s hit', golpeen: 'hit (you all)', protejan: 'protect (you all)', cubro: 'I cover', bloqueado: 'blocked', juntos: 'together',
      toma: 'take that', 'aquí': 'here', equipo: 'team', persona: 'person', 'órdenes': 'orders', 'frase': 'sentence', cada: 'each', danos: 'give us', distraigo: 'I distract', 'lo distraigo': 'I distract it' },
  });
  add('pt', {
    cHello: ['Hoje, em equipe! Numa frase só, diz pra cada um o que fazer, cada verbo com a sua pessoa.', 'Today, as a team! In one sentence, tell each one what to do, each verb in its person.'],
    cDemo: ['Olha: «Mimo, bate no grande enquanto eu distraio ele».', 'Watch: “Mimo, hit the big one while I distract it.”'],
    cWhy: ['Pro Mimo: «bate». Eu: «distraio». Todo mundo: «vamos bater!». Vocês dois: «batam!».', 'To Mimo: «bate» (você). Me: «distraio» (eu). All of us: «vamos bater!» (nós). You two: «batam!» (vocês).'],
    cYou: ['Agora você! Dá ordens pro Mimo e pra mim numa frase: «Bruno, protege o Mimo enquanto eu distraio o grande».', 'Now you! Give Mimo and me orders in one sentence: “Bruno, protect Mimo while I distract the big one.”'],
    cGot: ['É assim que se trabalha em equipe!', 'That’s teamwork!'], cWe: ['E todo mundo junto: «Vamos bater no vermelho!». Ou vocês dois: «Batam no azul!».', 'And all together: “Let’s hit the red one!” Or you two: “Hit the blue one!”'],
    cOk: ['Já vou!', 'On it!'], cGuard: ['Deixa comigo!', 'Leave it to me!'], cHey: ['Ei, você! Aqui!', 'Hey, you! Over here!'], cBlock: ['Bloqueado!', 'Blocked!'], cAll: ['Todos juntos!', 'All together!'], cToma: ['Toma!', 'Take that!'],
    exC: ['Bruno, protege o Mimo enquanto eu distraio o grande', 'Bruno, protect Mimo while I distract the big one'], exC2: ['Vamos bater no vermelho!', 'Let’s hit the red one!'], cFrames: ['Bruno, ___ enquanto eu ___', 'Vamos ___! · ___em!'],
    tips: { cTeam: 'Team orders: one sentence, each verb in its person. «Bruno, protege o Mimo enquanto eu distraio o grande» · all of us: «Vamos bater no vermelho!» (you throw a stone too) · you two: «Batam no vermelho!».',
      cSolo: 'Team orders: say what you do yourself too: «Mimo, bate no vermelho enquanto eu distraio o azul» (a distracted foe doesn’t attack, and takes ×1.5) · all of us: «Vamos bater no vermelho!».' },
    why: { cMe: 'What you do yourself takes the eu form: «eu distraio», «eu protejo», «eu jogo».', cYou: 'To two or more, the vocês form: «batam!», «protejam!» («batem» says what they do).',
      cWe: 'All of us: «vamos bater!» («batemos» says what we do).', cOne: 'To one (Bruno or {name}): «protege», «bate».', cWhich: 'Say which one: its color, its size, or where it is.' },
    slip: { cMe: 'Person slip (eu)', cYou: 'Person slip (vocês)', cWe: 'Person slip (nós)', cOne: 'Person slip (você)', cWhich: 'Say which one' },
    gloss: { protege: 'protect', distraio: 'I distract', distrai: 'distract', enquanto: 'while', batam: 'hit (you all)', vamos: 'let’s', protejam: 'protect (you all)', deixa: 'leave it', comigo: 'with me', bloqueado: 'blocked', juntos: 'together', equipe: 'team', pessoa: 'person', ordens: 'orders' },
  });
  add('de', {
    cHello: ['Heute im Team! In einem Satz sagst du jedem, was er tun soll, jedes Verb in seiner Person.', 'Today, as a team! In one sentence, tell each one what to do, each verb in its person.'],
    cDemo: ['Schau: „Mimo, schlag die Große, während ich sie ablenke!“', 'Watch: “Mimo, hit the big one while I distract it!”'],
    cWhy: ['Zu Mimo: „schlag“. Ich: „ich lenke … ab“, aber nach „während“ zusammen am Ende: „ablenke“. Alle: „Schlagen wir!“ Ihr zwei: „Schlagt!“', 'To Mimo: «schlag» (du). Me: «ich lenke … ab», but after «während» it goes to the end, joined: «ablenke». All of us: «Schlagen wir!» (wir). You two: «Schlagt!» (ihr).'],
    cYou: ['Jetzt du! Gib Mimo und mir Befehle in einem Satz: „Bruno, schütz Mimo, während ich die Große ablenke!“', 'Now you! Give Mimo and me orders in one sentence: “Bruno, protect Mimo while I distract the big one!”'],
    cGot: ['Das ist Teamwork!', 'That’s teamwork!'], cWe: ['Und alle zusammen: „Schlagen wir die Rote!“ Oder ihr zwei: „Schlagt die Blaue!“', 'And all together: “Let’s hit the red one!” Or you two: “Hit the blue one!”'],
    cOk: ['Bin dabei!', 'On it!'], cGuard: ['Ich decke dich!', 'I’ve got you covered!'], cHey: ['He, du! Hierher!', 'Hey, you! Over here!'], cBlock: ['Geblockt!', 'Blocked!'], cAll: ['Alle zusammen!', 'All together!'], cToma: ['Da!', 'Take that!'],
    exC: ['Bruno, schütz Mimo, während ich die Große ablenke', 'Bruno, protect Mimo while I distract the big one'], exC2: ['Schlagen wir die Rote!', 'Let’s hit the red one!'], cFrames: ['Bruno, ___, während ich ___', '___en wir! · ___t!'],
    tips: { cTeam: 'Team orders: one sentence, each verb in its person. «Bruno, schütz Mimo, während ich den Großen ablenke» · all of us: «Schlagen wir den Roten!» (you throw a stone too) · you two: «Schlagt den Roten!».',
      cSolo: 'Team orders: say what you do yourself too: «Mimo, schlag den Roten, während ich den Blauen ablenke» (a distracted foe doesn’t attack, and takes ×1.5) · all of us: «Schlagen wir den Roten!».' },
    why: { cMe: 'What you do yourself takes the ich form: «ich lenke … ab», «ich schütze», «ich werfe».', cSub: 'After «während» the verb goes to the end, a separable one joined: «während ich den Großen ablenke».',
      cMain: 'In a main clause the separable verb splits: «ich lenke den Großen ab».', cYou: 'To two or more, the ihr form: «Schlagt!», «Schützt!».', cWe: 'All of us: «Schlagen wir!» (the verb first, then wir).', cOne: 'To one (Bruno or {name}): «schütz», «schlag» (du).', cWhich: 'Say which one: its color, its size, or where it is.' },
    slip: { cMe: 'Person slip (ich)', cSub: 'Word-order slip (verb last)', cMain: 'Word-order slip (… ab)', cYou: 'Person slip (ihr)', cWe: 'Person slip (wir)', cOne: 'Person slip (du)', cWhich: 'Say which one' },
    soft: { cWe: 'Say «wir»: «Schlagen wir!»' },
    gloss: { 'schütz': 'protect', ablenke: 'distract (ablenken)', lenke: 'distract (lenke … ab)', 'während': 'while', schlagt: 'hit (you all)', schlagen: 'hit (schlagen wir = let’s hit)', decke: 'cover', geblockt: 'blocked', zusammen: 'together', befehle: 'orders', satz: 'sentence', jedem: 'everyone' },
  });
  add('zh', {
    cHello: ['[今天|jīn tiān] [练|liàn] [团队|tuán duì] [合作|hé zuò] ！ [一|yī] [句|jù] [话|huà] [告诉|gào su] [每个|měi gè] [人|rén] [做|zuò] [什么|shén me] 。', 'Today we practice teamwork! In one sentence, tell each one what to do.'],
    cDemo: ['[你|nǐ] [看|kàn] ： {mimo} [打|dǎ] [大|dà] [的|de] ， [我|wǒ] [来|lái] [引开|yǐn kāi] [它|tā] ！', 'Watch: “Mimo, hit the big one, I’ll lure it away!”'],
    cWhy: ['[对|duì] {mimo} ： [打|dǎ] 。 [自己|zì jǐ] ： [我|wǒ] [来|lái] [引开|yǐn kāi] 。 [大家|dà jiā] ： [我们|wǒ men] [一起|yī qǐ] [打|dǎ] [吧|ba] ！ [你们|nǐ men] [两个|liǎng gè] ： [你们|nǐ men] [打|dǎ] ！', 'To Mimo: 打. Yourself: 我来引开 (I’ll lure it away). All of us: 我们一起打吧！ You two: 你们打！'],
    cYou: ['[现在|xiàn zài] [轮到|lún dào] [你|nǐ] [了|le] ！ [一|yī] [句|jù] [话|huà] [给|gěi] [我|wǒ] [和|hé] {mimo} [下|xià] [命令|mìng lìng] ： [布鲁诺|Bù lǔ nuò] [保护|bǎo hù] {mimo} ， [我|wǒ] [来|lái] [引开|yǐn kāi] [大|dà] [的|de] ！', 'Your turn! Give {mimo} and me orders in one sentence: “Bruno, protect {mimo}, I’ll lure the big one away!”'],
    cGot: ['[这|zhè] [就是|jiù shì] [团队|tuán duì] [合作|hé zuò] ！', 'That’s teamwork!'], cWe: ['[大家|dà jiā] [一起|yī qǐ] ： [我们|wǒ men] [一起|yī qǐ] [打|dǎ] [红色|hóng sè] [的|de] [吧|ba] ！ [或者|huò zhě] [你们|nǐ men] [打|dǎ] [蓝色|lán sè] [的|de] ！', 'All together: “Let’s hit the red one!” Or: “You two, hit the blue one!”'],
    cOk: ['[来|lái] [了|le] ！', 'On it!'], cGuard: ['[我|wǒ] [保护|bǎo hù] [你|nǐ] ！', 'I’ve got you!'], cHey: ['[喂|wèi] ！ [这边|zhè biān] ！', 'Hey! Over here!'], cBlock: ['[挡住|dǎng zhù] [了|le] ！', 'Blocked!'], cAll: ['[大家|dà jiā] [一起|yī qǐ] ！', 'All together!'], cToma: ['[看|kàn] [招|zhāo] ！', 'Take that!'],
    exC: ['[布鲁诺|Bù lǔ nuò] [保护|bǎo hù] {mimo} ， [我|wǒ] [来|lái] [引开|yǐn kāi] [大|dà] [的|de] ！', 'Bruno, protect Mimo, I’ll lure the big one away!'], exC2: ['[我们|wǒ men] [一起|yī qǐ] [打|dǎ] [红色|hóng sè] [的|de] [吧|ba] ！', 'Let’s hit the red one!'],
    cFrames: ['[布鲁诺|Bù lǔ nuò] ___ ， [我|wǒ] [来|lái] ___', '[我们|wǒ men] [一起|yī qǐ] ___ [吧|ba] ！ · [你们|nǐ men] ___ ！'],
    tips: { cTeam: 'Team orders: one sentence, a subject for each. «[布鲁诺|Bù lǔ nuò] [保护|bǎo hù] {mimo} ， [我|wǒ] [来|lái] [引开|yǐn kāi] [大|dà] [的|de]» · all of us: «[我们|wǒ men] [一起|yī qǐ] [打|dǎ] [红色|hóng sè] [的|de] [吧|ba]» (you throw a stone too) · you two: «[你们|nǐ men] [打|dǎ] [红色|hóng sè] [的|de]».',
      cSolo: 'Team orders: say what you do yourself too: «{mimo} [打|dǎ] [红色|hóng sè] [的|de] ， [我|wǒ] [来|lái] [引开|yǐn kāi] [蓝色|lán sè] [的|de]» (a distracted foe doesn’t attack, and takes ×1.5) · all of us: «[我们|wǒ men] [一起|yī qǐ] [打|dǎ] [吧|ba]».' },
    why: { cWe: '«Let’s» is 我们 (一起) … 吧: «我们一起打吧».', cYou: '你们 is for two or more: Bruno and {mimo}.', cMe: 'What you do yourself: 我来 + the verb: «我来引开大的».', cWhich: 'Say which one: its color, its size, or where it is.' },
    slip: { cWe: '吧 slip', cYou: 'Person slip (你们)', cMe: 'Person slip (我)', cOne: 'Person slip', cWhich: 'Say which one' },
    soft: { cBa: '«Let’s»: add 吧', cLai: '我来…: I’ll do it' },
    gloss: { 团队: 'team', 合作: 'cooperation', 句: '(measure word: a sentence)', 告诉: 'tell', 每个: 'each', 人: 'person', 引开: 'lure away / distract', 自己: 'yourself', 来: '(I’ll) do it', 大家: 'everyone', 一起: 'together', 吧: 'let’s',
      你们: 'you (all)', 两个: 'two', 命令: 'orders', 保护: 'protect', 下: 'give (下命令)', 和: 'and', 或者: 'or', 喂: 'hey', 这边: 'over here', 挡住: 'block', 招: 'move (看招 = take that)' },
  });
  add('ja', {
    cHello: ['[今日|きょう] は チームワーク です 。 [一|ひと]つ の [文|ぶん] で 、 みんな に [何|なに] を する か [言|い]って ください 。', 'Today: teamwork. In one sentence, tell everyone what to do.'],
    cDemo: ['[見|み]て ください 。 「 {mimo} 、 [大|おお]きい の を [打|う]って ！ わたし が [引|ひ]きつける ！ 」', 'Watch: “Mimo, hit the big one! I’ll draw it!”'],
    cWhy: ['{mimo} に は 「 [打|う]って 」 。 [自分|じぶん] の こと は 「 [引|ひ]きつける 」 。 みんな で は 「 [打|う]とう ！ 」 。 ふたり に は 「 みんな 、 [打|う]って ！ 」 。', 'To Mimo: 打って (te-form). Yourself: 引きつける (plain: I’ll do it). All of us: 打とう！ (let’s). You two: みんな、打って！'],
    cYou: ['あなた の [番|ばん] です 。 [一|ひと]つ の [文|ぶん] で わたし と {mimo} に [指示|しじ] して ください 。 「 ブルーノ は {mimo} を [守|まも]って 、 わたし が [大|おお]きい の を [引|ひ]きつける ！ 」', 'Your turn. Give {mimo} and me orders in one sentence: “Bruno, protect {mimo}, I’ll draw the big one!”'],
    cGot: ['これ が チームワーク です ！', 'That’s teamwork!'], cWe: ['みんな で 「 [赤|あか]い の を [打|う]とう ！ 」 。 ふたり に は 「 みんな 、 [青|あお]い の を [打|う]って ！ 」 。', 'All together: “Let’s hit the red one!” To the two of them: “Everyone, hit the blue one!”'],
    cOk: ['[行|い]きます ！', 'On it!'], cGuard: ['まかせて ！', 'Leave it to me!'], cHey: ['おい ！ こっち だ ！', 'Hey! Over here!'], cBlock: ['[防|ふせ]いだ ！', 'Blocked!'], cAll: ['みんな で ！', 'All together!'], cToma: ['えいっ ！', 'Take that!'],
    exC: ['ブルーノ は {mimo} を [守|まも]って 、 わたし が [大|おお]きい の を [引|ひ]きつける ！', 'Bruno, protect Mimo, I’ll draw the big one!'], exC2: ['[赤|あか]い の を [打|う]とう ！', 'Let’s hit the red one!'],
    cFrames: ['ブルーノ は ___て 、 わたし が ___る', '___よう ！ · みんな 、 ___て ！'],
    tips: { cTeam: 'Team orders: one sentence, each verb in its form. «ブルーノ は {mimo} を [守|まも]って 、 わたし が [大|おお]きい の を [引|ひ]きつける» · all of us: «[赤|あか]い の を [打|う]とう» (you throw a stone too) · you two: «みんな 、 [赤|あか]い の を [打|う]って».',
      cSolo: 'Team orders: say what you do yourself too: «{mimo} 、 [赤|あか]い の を [打|う]って 、 わたし が [青|あお]い の を [引|ひ]きつける» (a distracted foe doesn’t attack, and takes ×1.5) · all of us: «[打|う]とう ！».' },
    why: { cMe: 'What you’ll do yourself takes the plain form: «わたしが引きつける» (not 引きつけて).', cOne: 'Asking someone takes the te-form: «ブルーノはミモを守って».', cWe: 'Let’s: the volitional form, «打とう» / «押そう».', cWhich: 'Say which one: its color, its size, or where it is.' },
    slip: { cMe: 'Form slip (plain form)', cOne: 'Form slip (te-form)', cWe: 'Form slip (～よう)', cYou: 'Person slip', cWhich: 'Say which one' },
    soft: { cWho: 'Say who: みんな' },
    gloss: { チームワーク: 'teamwork', 文: 'sentence', 引: 'draw (引きつける = draw its attention)', 自分: 'yourself', こと: 'things', ふたり: 'the two', 番: 'turn', 指示: 'orders', 守: 'protect', まかせて: 'leave it to me', おい: 'hey', こっち: 'over here', 防: 'block' },
  });
  T.mergeLang();

  // ---------------------------------------------------------------- the forms: who does what (es / pt / de), normalized
  // [form, verb, person, right form if it's a slip]; person: one (tú to Mimo or Bruno) · you (ustedes) · we · me (yo)
  const F = (list, verb) => list.map(([w, p, to]) => ({ w, verb, p, to }));
  const CT = {
    es: { split: /(\s*(?:[,;]|\bmientras(?:\s+que)?\b|\by\s+luego\b|\by\s+(?=bruno\b|yo\b))\s*)/i, whileRe: /mientras/i, i: ['yo'], and: ['y'], hitIdx: 'hit', stone: ['una', 'piedra', 'la', 'piedrita'],
      forms: [...F([['protejo', 'me'], ['protege', 'one'], ['protegeme', 'one'], ['protegenos', 'one'], ['protejan', 'you'], ['protejamos', 'we'], ['protegen', 'you', 'protejan'], ['protegemos', 'we', 'protejamos'], ['proteger', 'one', 'protege']], 'protect'),
        ...F([['distraigo', 'me'], ['distrae', 'one'], ['distraelo', 'one'], ['distraela', 'one'], ['distraigan', 'you'], ['distraigamos', 'we'], ['distraen', 'you', 'distraigan'], ['distraemos', 'we', 'distraigamos'], ['distraer', 'one', 'distrae']], 'distract'),
        ...F([['lanzo', 'me'], ['tiro', 'me'], ['golpeo', 'me'], ['salto', 'me'], ['empujo', 'me']], 'throw')],
      meBad: { protege: 'protejo', proteger: 'protejo', distrae: 'distraigo', distraer: 'distraigo', distraes: 'distraigo', lanza: 'lanzo', lanzar: 'lanzo', tira: 'tiro' },
      allyMe: ['mi', 'protegeme'], allyUs: ['nosotros', 'protegenos', 'todos'] },
    pt: { split: /(\s*(?:[,;]|\benquanto\b|\be\s+depois\b|\be\s+(?=bruno\b|eu\b))\s*)/i, whileRe: /enquanto/i, i: ['eu'], and: ['e'], stone: ['uma', 'pedra', 'a', 'pedrinha'],
      forms: [...F([['protejo', 'me'], ['protege', 'one'], ['proteja', 'one'], ['protejam', 'you'], ['protejamos', 'we'], ['protegem', 'you', 'protejam'], ['protegemos', 'we', 'vamos proteger']], 'protect'),
        ...F([['distraio', 'me'], ['distrai', 'one'], ['distraia', 'one'], ['distraiam', 'you'], ['distraiamos', 'we'], ['distraem', 'you', 'distraiam'], ['distraimos', 'we', 'vamos distrair']], 'distract'),
        ...F([['jogo', 'me'], ['atiro', 'me'], ['bato', 'me'], ['pulo', 'me'], ['empurro', 'me']], 'throw')],
      multi: [[['vamos', 'proteger'], 'protect', 'we'], [['vamos', 'distrair'], 'distract', 'we']],
      meBad: { protege: 'protejo', proteger: 'protejo', distrai: 'distraio', distrair: 'distraio', joga: 'jogo', jogar: 'jogo' },
      allyMe: ['mim', 'me'], allyUs: ['nos', 'gente', 'todos'] },
    de: { split: /(\s*(?:[,;]|\bwährend\b|\bund\s+dann\b|\bund\s+(?=bruno\b|ich\b))\s*)/i, whileRe: /während/i, i: ['ich'], and: ['und'], stone: ['einen', 'stein', 'den'],
      forms: [...F([['schutze', 'me'], ['schutz', 'one'], ['schutzt', 'you'], ['schutzen', 'we']], 'protect'), ...F([['ablenke', 'me'], ['lenke', 'me'], ['lenk', 'one'], ['lenkt', 'you'], ['lenken', 'we']], 'distract'), ...F([['werfe', 'me'], ['schlage', 'me'], ['springe', 'me'], ['schiebe', 'me']], 'throw')],
      meBad: { schutzt: 'schütze', schutz: 'schütze', schutzen: 'schütze', lenkt: 'lenke', lenk: 'lenke', ablenken: 'ablenke', ablenkt: 'ablenke', wirft: 'werfe', werfen: 'werfe' },
      allyMe: ['mich'], allyUs: ['uns'] },
  };
  const ZT = { bruno: ['[布鲁诺|Bù lǔ nuò]'], me: ['[我|wǒ]'], notMe: ['[我们|wǒ men]'], lai: ['[来|lái]'], protect: ['[保护|bǎo hù]'], distract: ['[引开|yǐn kāi]', '[吸引|xī yǐn]'], throw: ['[扔|rēng]'], allyMe: ['[我|wǒ]'], allyUs: ['[我们|wǒ men]'] };
  const JT = { bruno: ['ブルーノ'], me: ['わたし', 'ぼく', 'おれ', 'あたし'], all: ['みんな', 'ふたり とも'],
    verbs: { protect: { te: '[守|まも]って', vol: '[守|まも]ろう', pol: '[守|まも]りましょう', dict: '[守|まも]る' }, distract: { te: '[引|ひ]きつけて', vol: '[引|ひ]きつけよう', pol: '[引|ひ]きつけましょう', dict: '[引|ひ]きつける' }, throw: { te: '[投|な]げて', vol: '[投|な]げよう', pol: '[投|な]げましょう', dict: '[投|な]げる' } } };
  const brunoOn = () => { const x = X(), C = x && x.A.coach; return !!(C && !C.hidden && /bruno/i.test(x.G.coachName || '')); };
  T.brunoOn = brunoOn;
  const isMimo = n => n === 'mimo' || X().G.voc.has(n);
  // a stand-in verb Mimo knows, to read who a part is about («yo distraigo al grande» → «golpea al grande»)
  function hitShow(L) { const x = X(), vs = x.attackVerbs().filter(v => !['attack', 'grab', 'throw'].includes(v)), v = vs.includes('hit') ? 'hit' : vs[0] || 'hit'; return { v, show: L.verbs[v] ? L.verbs[v].show : v }; }
  const subParse = (text, ctx) => { const r = P.parse(text, Object.assign({}, ctx, { tacInner: true, maxClauses: 1 })); if (r && r.ok && r.kind === 'command') X().judge(r); return r; };
  // the command clause a part parsed to (talk, a deal or a time realm's scene parse fine but have no clause: null)
  const cmdOf = r => (r && r.ok && r.kind === 'command' && r.clauses && r.clauses[0]) || null;
  // the errors a parsed part brings: its slips, a target it needed and didn't get, «which one?»
  function partErrors(c, errors, fixes, soft) {
    errors.push(...(c.errors || [])); fixes.push(...(c.fixes || [])); soft.push(...(c.soft || []));
    if (c.need && c.said < c.need) { if (c.said === 1) H.err(errors, 'target', true); else soft.push('part'); }
    if (c.ambiguous && !c.ambiguous.untaught) { if (c.need >= 2) H.err(errors, 'cWhich', true); else soft.push('cWhich'); }
  }

  // ---------------------------------------------------------------- reading a team order: es / pt / de
  function latParts(text, l) {
    const C = CT[l], bits = String(text).split(C.split), out = [];
    let sub = false, voc = null;
    for (let i = 0; i < bits.length; i += 2) {
      const s = bits[i], sep = i ? bits[i - 1] : '';
      if (i) sub = C.whileRe.test(sep);
      const t = H.toks(s);
      if (!t.length) continue;
      if (t.every(w => w.n === 'bruno' || isMimo(w.n) || C.and.includes(w.n))) {        // a name alone: who the next part is for
        const b = t.some(w => w.n === 'bruno'), m = t.some(w => isMimo(w.n));
        voc = b && m ? 'both' : b ? 'bruno' : 'mimo'; continue;
      }
      out.push({ i, text: s, sub, voc }); voc = null;
    }
    return out;
  }
  function latPart(p, ctx) {
    const L = ctx.L, l = L.code, C = CT[l];
    const t = H.toks(p.text), errors = [], fixes = [], soft = [];
    let voc = p.voc, k0 = 0;
    while (k0 < t.length && (t[k0].n === 'bruno' || isMimo(t[k0].n) || (k0 > 0 && C.and.includes(t[k0].n) && t[k0 + 1] && (t[k0 + 1].n === 'bruno' || isMimo(t[k0 + 1].n))))) {
      if (!C.and.includes(t[k0].n)) { const b = t[k0].n === 'bruno'; voc = !voc ? (b ? 'bruno' : 'mimo') : (voc === 'bruno') !== b || voc === 'both' ? 'both' : voc; }
      k0++;
    }
    const rest = t.slice(k0), out = { p, voc, errors, fixes, soft, words: [] };
    const iK = rest.findIndex(w => C.i.includes(w.n));
    // my own forms (protect / distract / throw; and the yo form of anything)
    let fm = null, fk = -1;
    for (let k = 0; k < rest.length && !fm; k++) {
      if (C.multi) for (const [seq, verb, person] of C.multi) if (seq.every((w, j) => rest[k + j] && rest[k + j].n === w)) { fm = { verb, p: person, len: seq.length }; fk = k; }
      if (fm) break;
      const e = C.forms.find(x => x.w === rest[k].n);
      if (e) { fm = Object.assign({ len: 1 }, e); fk = k; }
      else if (iK >= 0 && k > iK && C.meBad[rest[k].n]) { fm = { verb: /prot|schu/.test(rest[k].n) ? 'protect' : /distra|lenk/.test(rest[k].n) ? 'distract' : 'throw', p: 'me', bad: C.meBad[rest[k].n], len: 1 }; fk = k; }
    }
    // the doer
    if (iK >= 0 || (fm && fm.p === 'me')) out.who = 'me';
    else if (fm && (fm.p === 'you' || fm.p === 'we')) out.who = fm.p;
    else if (!fm) {
      const tr = TEAM.read(p.text, l);
      if (tr.verb && (tr.person === 'we' || tr.person === 'you')) {
        const st = TEAM.strip(p.text, l);
        if (!st) return null;
        out.who = tr.person; out.team = tr;
        for (const s of tr.slips || []) { if (s === 'spelling') fixes.push('spelling'); else if (s === 'ending') H.err(errors, tr.person === 'we' ? 'cWe' : 'cYou'); else soft.push(s === 'wir' ? 'cWe' : 'cWe'); }
        const words = H.toks(st.text).filter(w => w.n !== 'bruno' && !isMimo(w.n) && !C.and.includes(w.n) && w.n !== 'todos' && w.n !== 'alle').map(w => w.raw).join(' ');
        const r = subParse(words, ctx);
        if (!r || !r.ok) return { fail: r ? r.reason : 'noverb', word: r && r.word };
        if (!cmdOf(r)) return null;          // (talk, a deal…: no battle command in it, so no team order either)
        out.r = r; out.c = r.clauses[0]; out.verb = out.c.verb;
        partErrors(out.c, errors, fixes, soft);
        out.canon = teamCanon(r.canon, tr.verb, tr.person, l);
        if (voc === 'bruno') { H.err(errors, 'cOne'); }
        return out;
      }
      out.who = voc === 'bruno' ? 'bruno' : voc === 'both' ? 'you' : 'mimo';
    } else out.who = voc === 'bruno' ? 'bruno' : voc === 'both' ? 'you' : 'mimo';
    if (voc === 'both' && fm && fm.p === 'one') H.err(errors, 'cYou');
    // the verb's form for its person
    if (fm) {
      out.verb = fm.verb;
      const at = k0 + fk;
      let right = null;
      const meForm = l === 'de' && fm.verb === 'distract' ? (p.sub ? 'ablenke' : 'lenke') : null;      // (de: «ich lenke … ab», «während ich … ablenke»)
      if (out.who === 'me' && fm.p !== 'me') { H.err(errors, 'cMe'); right = meForm || fm.bad || (C.forms.find(x => x.verb === fm.verb && x.p === 'me') || {}).w; }
      else if (fm.bad) { H.err(errors, 'cMe'); right = meForm || fm.bad; }
      else if (fm.to) { H.err(errors, fm.p === 'we' ? 'cWe' : fm.p === 'you' ? 'cYou' : 'cOne'); right = fm.to; }
      out.fix = right ? { k: at, len: fm.len, to: right } : null;
      // de: «ich lenke … ab» in a main clause; «während ich … ablenke» (the verb last, joined)
      if (l === 'de' && out.who === 'me' && fm.verb === 'distract') {
        const lastK = t.length - 1, joined = t[at].n.startsWith('ab');
        if (p.sub && (!joined || at !== lastK)) { H.err(errors, 'cSub'); out.reorder = 'sub'; }
        else if (!p.sub && joined) { H.err(errors, 'cMain'); out.reorder = 'main'; }
      } else if (l === 'de' && out.who === 'me' && p.sub && at !== t.length - 1) { H.err(errors, 'cSub'); out.reorder = 'subv'; }
      // who it's for: protect → an ally; distract / throw → a foe (read with a stand-in verb)
      const after = t.slice(at + fm.len);
      if (fm.verb === 'protect') {
        const ns = after.map(w => w.n).concat([t[at].n]);
        out.ally = ns.some(n => isMimo(n)) ? 'mimo' : ns.some(n => C.allyUs.includes(n)) ? 'all' : ns.some(n => C.allyMe.includes(n)) ? 'you' : out.who === 'mimo' ? 'you' : 'mimo';
        if (out.who === 'mimo' && out.ally === 'mimo') out.ally = 'you';
        return out;
      }
      const words = (l === 'de' && out.who === 'me' && !p.sub ? after.filter((w, i) => !(w.n === 'ab' && i === after.length - 1)) : t.slice(k0, at).concat(after).filter(w => !C.i.includes(w.n)))
        .filter(w => !(fm.verb === 'throw' && C.stone.includes(w.n)) && !(l === 'de' && fm.verb === 'distract' && w.n === 'ab')).map(w => w.raw);
      const hs = hitShow(L), r = subParse(hs.show + ' ' + words.join(' '), ctx);
      if (!r || !r.ok) return { fail: r ? r.reason : 'noverb', word: r && r.word };
      if (!cmdOf(r)) return null;
      out.r = r; out.c = r.clauses[0];
      if (l === 'pt' && fm.verb === 'distract') out.c.errors = out.c.errors.filter(e => e.kind !== 'prep');     // («distraio o grande»: straight, unlike «bate no…», the stand-in)
      partErrors(out.c, errors, fixes, soft);
      return out;
    }
    // the one form of a battle verb, to Mimo or to Bruno: the parser reads it
    const r = subParse(rest.map(w => w.raw).join(' '), ctx);
    if (!r || !r.ok) return r && r.reason === 'empty' ? null : { fail: r ? r.reason : 'noverb', word: r && r.word };
    if (!cmdOf(r)) return null;          // (a part that's talk or a deal, «Bruno, gracias»: not a team order)
    out.r = r; out.c = r.clauses[0]; out.verb = out.c.verb; out.canon = r.canon;
    if (voc === 'both') { H.err(errors, 'cYou'); out.canon = teamCanon(r.canon, 'v.' + out.c.baseVerb, 'you', l); }     // («Bruno y Mimo, golpea…»: two of them → «golpeen»)
    partErrors(out.c, errors, fixes, soft);
    return out;
  }
  // the one form in a sentence swapped back to a team form (marsh_battle.js teamCanon's way, when that file isn't here)
  function teamCanon(canon, verb, person, l) {
    if (_.marsh && _.marsh.teamCanon) return _.marsh.teamCanon(canon, verb, person, l);
    const fm = TEAM.forms(verb, l); if (!fm) return canon;
    const one = fm.one[0], to = (fm[person] || [])[0], s = String(canon), i = s.toLowerCase().indexOf(one.toLowerCase());
    return i < 0 || !to ? s : s.slice(0, i) + to + s.slice(i + one.length);
  }

  // ---------------------------------------------------------------- reading a team order: zh / ja
  function cjParts(text) {
    const out = [];
    let voc = '';
    for (const s of String(text).split(/\s*(?:[，,、；;]|然后|それから)\s*/)) {
      if (!s.trim()) continue;
      if (/^\s*(?:布鲁诺|ブルーノ|米莫|ミモ|bruno|mimo|bulunuo|buruuno|みんな|みなさん|ふたり\s*とも|minna|futari\s*tomo)\s*[!！]?\s*$/i.test(s)) { voc += s + ' '; continue; }     // (a name alone, or みんな: who the next part is for)
      out.push({ i: out.length, text: voc + s }); voc = '';
    }
    return out;
  }
  const has = (text, src, l) => CJ().contains(text, src, l);
  function cjPart(p, ctx) {
    const L = ctx.L, l = L.code, s = p.text, errors = [], fixes = [], soft = [], out = { p, errors, fixes, soft, words: [] };
    const named = /bruno/i.test(s) || (l === 'zh' ? ZT.bruno : JT.bruno).some(w => has(s, w, l));
    const tr = TEAM.read(s, l);
    let verb = null, form = null;
    if (l === 'zh') {
      for (const v of ['protect', 'distract', 'throw']) if (ZT[v].some(w => has(s, w, l))) { verb = v; break; }
      const me = ZT.me.some(w => has(s, w, l)) && !ZT.notMe.some(w => has(s, w, l)) && !(verb === 'protect' && /保护我|bao ?hu ?wo/i.test(s.replace(/\s/g, ' ')));
      out.who = tr.person === 'we' ? 'we' : tr.person === 'you' ? 'you' : me ? 'me' : named ? 'bruno' : 'mimo';
      if (out.who === 'we' && (tr.slips || []).length) soft.push('cBa');
      if (out.who === 'me' && !ZT.lai.some(w => has(s, w, l))) soft.push('cLai');
    } else {
      for (const v of ['protect', 'distract', 'throw']) for (const [k, src] of Object.entries(JT.verbs[v])) if (!verb && has(s, src, l)) { verb = v; form = k === 'pol' ? 'vol' : k; }
      const me = JT.me.some(w => has(s, w, l)), all = JT.all.some(w => has(s, w, l));
      if (verb) out.who = form === 'vol' ? 'we' : me ? 'me' : all ? 'you' : named ? 'bruno' : 'mimo';
      else out.who = tr.person === 'we' ? 'we' : tr.person === 'you' && all ? 'you' : me ? 'me' : named ? 'bruno' : 'mimo';
      if (verb && out.who === 'me' && form !== 'dict') H.err(errors, 'cMe');
      if (verb && (out.who === 'bruno' || out.who === 'mimo' || out.who === 'you') && form === 'dict') H.err(errors, 'cOne');
    }
    // the rest of the part, as a command to Mimo: the doer's words go, the verb becomes 打 / 打って
    let rest = s.replace(/bruno/ig, ' ');
    const drop = l === 'zh' ? ['布鲁诺', '米莫', '你们', '我们', '咱们', '一起', '吧', '我来', '来', '我'] : ['ブルーノ', 'ミモ', 'みんな', 'ふたりとも', 'わたし', 'ぼく', 'おれ', 'あたし'];
    if (l === 'zh') {
      for (const w of drop) rest = rest.split(w).join(' ');
      rest = rest.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\b(?:bulunuo|mimo|women|nimen|zanmen|yiqi|wo\s*lai|wo|lai|ba)\b/gi, ' ');     // (typed in pinyin)
    } else {
      for (const w of drop) rest = rest.replace(new RegExp(w + '\\s*[はが、]?'), ' ');
      rest = rest.replace(/\b(?:buruuno|bruuno|mimo|minna|futari\s*tomo|watashi|boku|ore|atashi)\b\s*(?:(?:ga|wa)\b)?/gi, ' ');     // (typed in rōmaji)
    }
    if (verb === 'protect') {
      const ally = l === 'zh' ? (/米莫|mimo|mǐ ?mò/i.test(s) ? 'mimo' : /我们|women|wǒ ?men/i.test(s) ? 'all' : /保护我|bao ?hu ?wo|bǎo ?hù ?wǒ/i.test(s) ? 'you' : out.who === 'mimo' ? 'you' : 'mimo') : (/ミモ|mimo/i.test(s) ? 'mimo' : out.who === 'mimo' ? 'you' : 'mimo');
      out.verb = 'protect'; out.ally = ally;
      return out;
    }
    if (verb) {
      const srcs = l === 'zh' ? ZT[verb] : Object.values(JT.verbs[verb]);
      const hs = hitShow(L).show;
      for (const src of srcs) {
        const ch = CJ().chars(src, { lang: l }).replace(/\s/g, ''), ro = CJ().roman(src, { lang: l, cap: false }).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s/g, '');
        rest = rest.split(ch).join(' ' + CJ().chars(hs, { lang: l }) + ' ');
        rest = rest.replace(new RegExp(ro.split('').join('\\s*'), 'ig'), ' ' + CJ().chars(hs, { lang: l }) + ' ');
      }
      if (verb === 'throw') rest = rest.replace(/石头|石|いし/g, ' ');
    } else if (out.who === 'we' || out.who === 'you') { const st = TEAM.strip(s, l); if (!st) return null; rest = st.text.replace(/bruno/ig, ' '); }
    const r = subParse(rest.trim() || CJ().chars(hitShow(L).show, { lang: l }), ctx);
    if (!r || !r.ok) return r && r.reason === 'empty' ? null : { fail: r ? r.reason : 'noverb', word: r && r.word };
    if (!cmdOf(r)) return null;
    out.r = r; out.c = r.clauses[0]; out.verb = verb || out.c.verb; out.team = verb ? null : tr;
    partErrors(out.c, errors, fixes, soft);
    return out;
  }
  // the right sentence, zh / ja, part by part
  function cjCanon(l, acts) {
    const G = X().G, ally = a => (l === 'zh' ? { mimo: '{mimo}', you: '[我|wǒ]', all: '[我们|wǒ men]' } : { mimo: '{mimo} を', you: 'わたし を', all: 'わたしたち を' })[a.ally || 'mimo'];
    const tgt = a => { if (!a.r) return ''; const s = String(a.r.canon).replace(/\s*[！!。]\s*$/, ''), toks = s.split(' '); return l === 'zh' ? toks.slice(1).join(' ') : toks.slice(0, -1).join(' '); };
    const one = a => (a.r ? String(a.r.canon).replace(/\s*[！!]\s*$/, '') : '');
    const V = (a, f) => (a.verb === 'protect' || a.verb === 'distract' || a.verb === 'throw' ? (l === 'zh' ? ZT[a.verb][0] : JT.verbs[a.verb][f]) : null);
    const parts = acts.map(a => {
      if (l === 'zh') {
        const v = V(a), body = a.verb === 'protect' ? `${v} ${ally(a)}` : v ? `${v} ${tgt(a)}` : one(a);
        return a.who === 'we' ? `[我们|wǒ men] [一起|yī qǐ] ${body} [吧|ba]` : a.who === 'you' ? `[你们|nǐ men] ${body}` : a.who === 'me' ? `[我|wǒ] [来|lái] ${body}` : a.who === 'bruno' ? `[布鲁诺|Bù lǔ nuò] ${body}` : body;
      }
      const f = a.who === 'we' ? 'vol' : a.who === 'me' ? 'dict' : 'te', v = V(a, f);
      const body = a.verb === 'protect' ? `${ally(a)} ${v}` : v ? `${tgt(a)} ${v}` : a.who === 'we' && a.team ? (TEAM.forms(a.team.verb, 'ja') || { we: [one(a)] }).we[0] : one(a);
      const full = a.who === 'we' && !v && a.team ? `${tgt(a)} ${body}`.trim() : body;
      return a.who === 'you' ? `みんな 、 ${full}` : a.who === 'me' ? `わたし が ${full}` : a.who === 'bruno' ? `ブルーノ は ${full}` : full;
    });
    return parts.join(l === 'zh' ? ' ， ' : ' 、 ') + ' ！';
  }

  // ---------------------------------------------------------------- the whole-turn reader
  function cRead(text, ctx) {
    if (ctx.tacInner) return null;
    const x = X(), G = x.G, L = ctx.L, l = L.code;
    if (!L.cjk && !CT[l]) return null;
    const parts = L.cjk ? cjParts(text) : latParts(text, l);
    if (!parts.length || parts.length > 3) return null;
    const acts = [];
    for (const p of parts) { const a = L.cjk ? cjPart(p, ctx) : latPart(p, ctx); if (!a) return null; if (a.fail) return { ok: false, raw: text, reason: a.fail, word: a.word }; acts.push(a); }
    if (!acts.some(a => a.who !== 'mimo')) return null;             // (only Mimo: an ordinary command)
    if (acts.some(a => a.who === 'bruno' || a.who === 'you') && !brunoOn()) return { ok: false, raw: text, reason: 'tac:noBruno' };
    const errors = acts.flatMap(a => a.errors), fixes = acts.flatMap(a => a.fixes), soft = acts.flatMap(a => a.soft);
    let canon;
    if (L.cjk) canon = errors.length || fixes.length || soft.length ? cjCanon(l, acts) : String(text).trim();
    else {
      const bits = String(text).split(CT[l].split);
      for (const a of acts) {
        let s = a.p.text;
        const t = H.toks(s);
        if (a.reorder && a.fix === undefined) a.fix = null;
        if (a.reorder === 'sub' || a.reorder === 'main' || a.reorder === 'subv') {
          const vk = t.findIndex(w => CT.de.forms.some(f => f.w === w.n && f.p === 'me') || CT.de.meBad[w.n]), v = a.fix ? a.fix.to : t[vk].raw;
          const stem = v.replace(/^ab/i, ''), others = t.filter((w, k) => k !== vk && !(w.n === 'ab' && a.verb === 'distract')).map(w => w.raw);
          s = a.reorder === 'main' ? [others[0], stem].concat(others.slice(1), a.verb === 'distract' ? ['ab'] : []).join(' ') : others.concat([a.verb === 'distract' ? 'ab' + stem.toLowerCase() : v]).join(' ');
        } else if (a.fix) s = s.slice(0, t[a.fix.k].i) + a.fix.to + s.slice(t[a.fix.k + a.fix.len - 1].j);
        else if (a.canon && a.who !== 'me' && a.r && (a.r.recast || a.team || a.voc === 'both')) {
          const names = []; for (const w of t) { if (w.n === 'bruno' || isMimo(w.n) || CT[l].and.includes(w.n)) names.push(w.raw); else break; }     // (the names said first stay)
          const lead = (s.match(/^[\s¡¿«"]*/) || [''])[0], tail = (s.match(/[\s!?.»"]*$/) || [''])[0];
          s = lead + (names.length ? names.join(' ') + ', ' : '') + H.unwrap(a.canon).replace(/^\p{Lu}/u, m => (names.length || a.p.i > 0 ? m.toLowerCase() : m)) + tail;
        }
        bits[a.p.i] = (/^\s/.test(bits[a.p.i]) ? ' ' : '') + s;
      }
      canon = bits.join('');
    }
    const who = { mimo: G.name, bruno: 'Bruno', me: 'you', we: 'all of you', you: `${G.name} and Bruno` };
    const what = a => (a.verb === 'protect' ? `protect ${a.ally === 'all' ? 'everyone' : a.ally === 'you' ? 'you' : G.name}` : a.verb === 'distract' ? `distract ${a.c ? 'it' : ''}` : a.who === 'me' ? 'a stone' : a.verb);
    const tacPreview = 'team: ' + acts.map(a => `${who[a.who]} → ${what(a)}`).join(' · ') + ' <span class="bonus">team order</span>';
    const words = [...new Set(acts.flatMap(a => (a.r && a.r.words) || []))];
    return {
      ok: true, kind: 'tac', tac: 'C', raw: text, canon, errors, fixes, soft, clauses: [], words, untaught: acts.flatMap(a => (a.r && a.r.untaught) || []), patterns: ['team'],
      key: P.tokenize(text).map(t => t.n).join(' '), recast: errors.length > 0 || fixes.length > 0 || (soft.length > 0 && canon !== String(text).trim()), tacActs: acts, tacPreview, tacPerform: perform,
    };
  }
  T.whole.push({ k: 'C', id: 'team', fn: cRead });
  T.cRead = (text, ctx) => cRead(text, ctx || X().ctx());

  // ---------------------------------------------------------------- what happens
  const say = (st, key, cls) => { const x = X(), [t, en] = H.line(key); x.say(st, t, { cls, en, dur: 1.6 }); };
  async function brunoStrike(c) {
    const x = X(), { G, A, ST } = x, B = A.coach, f = c.target;
    if (!B || B.hidden || !f || !f.alive || f.gone) return;
    say(B, 'cOk', 'coach');
    const tx = f.x - (f.x > B.x ? 1 : -1) * (0.75 + (f.radius || 0.4)), tz = f.z + 0.35;
    await x.arcTo(B, tx, 0, tz, 0.4, 0.7);
    x.squash(B, 1.2, 0.82, 0.06);
    const keep = G.badgePending; if (keep && c.first) G.badgePending = keep; else G.badgePending = null;
    await x.land(Object.assign({}, c, { crit: false, weakHit: false, sneak: false }), 1, 'good', ST.worldOf(f, 'mid'), true, { knock: 0.25 });
    await x.hopHome(B, 0.8, 0.45);
  }
  async function stone(c) {
    const x = X(), { G, A, ST } = x, Y = A.you, f = c.target;
    if (!Y || !f || !f.alive || f.gone) return;
    say(Y, 'cToma', 'you');
    const ball = new THREE.Mesh(TK.G.sphere, TK.toon('#9a958c', { rim: 0.1 })); ball.scale.setScalar(0.09); ST.S.scene.add(ball);
    const p0 = ST.worldOf(Y, 'top'), p1 = ST.worldOf(f, 'mid');
    x.squash(Y, 1.1, 0.9, 0.06); x.emit('throw');
    await x.along(0.42, u => ball.position.set(lerp(p0.x, p1.x, u), lerp(p0.y, p1.y, u) + Math.sin(u * Math.PI), lerp(p0.z, p1.z, u)));
    ST.S.scene.remove(ball);
    if (!c.first) G.badgePending = null;
    await x.land(Object.assign({}, c, { crit: false, weakHit: false, sneak: false, partKey: null }), 1, 'good', p1, true, { knock: 0.15 });
  }
  const actorOf = who => { const A = X().A; return who === 'bruno' ? A.coach : who === 'me' ? A.you : A.mimo; };
  async function guardUp(a) {
    const x = X(), G = x.G, A = x.A, by = a.who === 'we' || a.who === 'you' ? (brunoOn() ? A.coach : A.you) : actorOf(a.who);
    G.tacGuard = { turn: G.turn, who: a.ally || 'mimo', by };
    const at = a.ally === 'you' ? A.you : A.mimo;
    say(by, 'cGuard', by === A.coach ? 'coach' : by === A.you ? 'you' : 'mimo');
    if (by !== at && by) { await x.arcTo(by, at.x + 0.9, 0, at.z + 0.25, 0.35, 0.5); x.squash(by, 1.15, 0.88, 0.06); }
    H.pop(at, '🛡', { color: '#86f2e8', size: 34, rise: 0.4, life: 1.4 });
    await x.wait(0.4);
    if (by !== at && by) await x.hopHome(by, 0.6, 0.4);
    G.stats.guards = (G.stats.guards || 0) + 1;
  }
  async function distract(a) {
    const x = X(), G = x.G, f = a.c && a.c.target, by = actorOf(a.who === 'we' || a.who === 'you' ? 'me' : a.who);
    if (!f || !f.alive) return;
    f.tacDistracted = G.turn;
    say(by, 'cHey', by === x.A.coach ? 'coach' : by === x.A.you ? 'you' : 'mimo');
    for (let i = 0; i < 2; i++) { await x.squash(by, 0.9, 1.15, 0.08); }
    x.turnTo(f, x.yawTo(f, by.x, by.z), 0.2);
    x.setMood(f, 'confused', 2.2);
    H.pop(f, 'DISTRACTED', { color: '#ffd166', size: 26, rise: 0.4, life: 1.3 });
    await x.wait(0.5);
  }
  async function perform(r) {
    const x = X(), G = x.G, A = x.A, M = A.mimo, g = r.grade || { letter: 'C', mult: 0.7 };
    x.facing('foes');
    if (r.recast) {
      x.noteMistake({ kind: 'grammar', typed: r.raw, right: r.canon, errors: [...new Set(r.errors.map(e => e.kind).concat(r.fixes || []))], grade: g.letter });
      x.say(M, P.recastHTML(r.canon, r.raw, x.UI.esc), { html: true, cls: 'mimo', dur: 2.8 });
      G.stats.recasts++; x.emit('recast');
      await x.wait(1.1);
    }
    const acts = r.tacActs;
    for (const a of acts) if (a.c) { a.c.power = g.mult; a.c.first = false; }
    const firstHit = acts.find(a => a.c && a.verb !== 'distract' && a.verb !== 'protect');
    if (firstHit) firstHit.c.first = true;
    for (const a of acts) { if (a.verb === 'protect') await guardUp(a); else if (a.verb === 'distract') await distract(a); }
    for (const a of acts) {
      if (a.verb === 'protect' || a.verb === 'distract' || !a.c) continue;
      const c = a.c;
      if (!c.target || !c.target.alive || c.target.gone) { const alt = x.targetable().filter(f => !f.shy)[0]; if (!alt) continue; c.target = alt; }
      if (c.target.tacDistracted === G.turn && H.attackVerb(c.verb)) { c.tacMult = (c.tacMult || 1) * 1.5; c.tacSub = c.tacSub || 'DISTRACTED ×1.5'; }
      if (a.who === 'me') { await stone(c); continue; }
      if (a.who === 'bruno') { await brunoStrike(c); continue; }
      if (a.who === 'we' || a.who === 'you') { say(a.who === 'we' ? A.you : M, a.who === 'we' ? 'cAll' : 'cOk', a.who === 'we' ? 'you' : 'mimo'); await x.wait(0.3); }
      if (c.verb === 'light' && _.marsh && a.who !== 'mimo') c.marshTeam = a.who;      // (the marsh's light, said together: its double flash; marsh_battle.js)
      await (c.tacRun ? c.tacRun(c) : x.MOVES[c.verb](c));
      if (c.verb === 'light') continue;
      if ((a.who === 'we' || a.who === 'you') && brunoOn() && H.attackVerb(c.verb)) await brunoStrike(c);
      if (a.who === 'we' && H.attackVerb(c.verb)) await stone(c);
      if (x.allDone()) break;
    }
    if (G.badgePending) { const f = x.targetable()[0] || G.foes[0]; if (f) x.showGrade(f); G.badgePending = null; }
    G.stats.team = (G.stats.team || 0) + 1;
    await x.wait(0.15);
    await x.mimoReact(g.letter);
    const L = G.tacLesson;
    if (L && L.k === 'C' && g.letter !== 'D') { L.got = (L.got || 0) + 1; if (T.learn('C')) T.learnedBanner('C'); }
    x.ST.shot('wide');
  }
  // the foes' turn: a distracted one sits it out; one going for the guarded one is blocked
  const attackers0 = T.attackers;
  T.attackers = async list => {
    const G = X().G, out = await attackers0(list);
    return out.filter(f => f.tacDistracted !== G.turn);
  };
  const foeAttack0 = T.foeAttack;
  T.foeAttack = async f => {
    const x = X(), G = x.G, gd = G.tacGuard;
    if (gd && gd.turn === G.turn && !(f.tell && f.tell.kind === 'leap')) {
      const toMimo = Math.random() < 0.5, guarded = gd.who === 'all' || (gd.who === 'mimo') === toMimo;
      if (guarded) { await blocked(f, toMimo ? x.A.mimo : x.A.you, gd); return true; }
      const r0 = Math.random; Math.random = () => { Math.random = r0; return toMimo ? 0.25 : 0.75; };     // (flow.js picks its target with the next Math.random(): the one we rolled, not the guarded one)
    }
    return foeAttack0 ? foeAttack0(f) : false;
  };
  async function blocked(f, tgt, gd) {
    const x = X(), { G, ST } = x, by = gd.by || x.A.coach;
    const [txt, en] = G.L.shout(G.tier, tgt === x.A.mimo, true);
    x.setMood(f, 'go'); x.say(f, txt, { cls: 'foe shout', en, dur: 1.6 }); x.emit('shout', { text: txt, high: true, foe: f });
    await x.wait(0.6);
    if (by && by !== tgt) await x.arcTo(by, tgt.x + 0.7, 0, tgt.z + 0.1, 0.2, 0.3);
    const x0 = f.x, z0 = f.z, ex = tgt.x + 1.0, ez = tgt.z + 0.05;
    x.emit('jump');
    await x.along(0.35, u => { f.x = lerp(x0, ex, u); f.z = lerp(z0, ez, u); f.y = (f.baseY || 0) + Math.sin(Math.PI * u) * 0.6; });
    x.emit('block', { foe: f, kind: 'guard' }); ST.shake(0.25, 0.25); G.hitstop = 0.06;
    x.UI.pop(ST.worldOf(tgt, 'top'), 'BLOCKED!', G.t, { color: '#86f2e8', size: 32 });
    if (by) say(by, 'cBlock', by === x.A.coach ? 'coach' : by === x.A.you ? 'you' : 'mimo');
    await x.hopHome(f, 1.0, 0.5);
    if (by && by !== tgt) await x.hopHome(by, 0.6, 0.4);
    x.setMood(f, 'idle');
    G.stats.blocks = (G.stats.blocks || 0) + 1;
  }
  T.beginHooks.push(() => { const G = X().G; G.tacGuard = null; G.tacTeamTold = false; for (const f of G.foes) f.tacDistracted = 0; });
  // the frames and the tip, the first turn team orders are on
  T.turnHooks.push(async () => {
    const x = X(), G = x.G;
    if (!T.on('C') || G.tacTeamTold) return;
    G.tacTeamTold = true;
    const t = T.LX[G.lang] || T.LX.es;
    H.tip(brunoOn() ? 'cTeam' : 'cSolo');
    G.frames = G.frames.filter(k => k.pat !== 'team');
    G.frames.unshift({ text: t.cFrames[0], pat: 'team', uses: 2 }, { text: t.cFrames[1], pat: 'team', uses: 2 });
    x.renderFrames();
  });
  T.explainHooks.push(r => {
    if (r.reason !== 'tac:noBruno') return false;
    const x = X(); x.setMood(x.A.mimo, 'confused', 1.4); x.mimoLine('which', 1.4);
    x.UI.hint(`Bruno isn’t in this fight. Say what you do yourself and what ${x.G.name} does («${H.plain((T.LX[x.G.lang] || T.LX.es).exC2[0])}»: all of us, you throw a stone too).`, true);
    return true;
  });

  // ---------------------------------------------------------------- the lesson at the yard (focus 'tac:C')
  const dummy = (color, size, hp) => ({ kind: 'dummy', color, size, hp: hp || 9 });
  T.specsHooks.push((specs, opts) => {
    if (!opts.practice || opts.focus !== 'tac:C') return;
    const x = X(); specs.length = 0;
    [dummy('red', 'small'), dummy('blue', 'big', 12)].forEach(s => specs.push(x.normFoe(s, specs.length)));
  });
  T.lessons.C = async (x, G) => {
    await x.intro();
    x.ST.shot('coach');
    await H.coach('cHello');
    G.tacLesson = { k: 'C', got: 0 };
    // the demonstration: Bruno distracts the big one, Mimo hits it (×1.5); the hit doesn't count
    const big = G.foes.find(f => f.size === 'big') || G.foes[0];
    await H.coach('cDemo');
    if (big) {
      const auto0 = G.auto; G.auto = Object.assign({}, auto0 || {}, { timing: 'perfect' });
      try {
        await distract({ who: 'bruno', c: { target: big } });
        const c = { verb: 'hit', baseVerb: 'hit', target: big, power: 1, tacMult: 1.5, tacSub: 'DISTRACTED ×1.5', errors: [], fixes: [], words: [], desc: { described: true } };
        x.say(x.A.mimo, P.wrapS(G.L, G.L.verbs.hit ? G.L.verbs.hit.show : 'hit'), { cls: 'mimo', dur: 1.1 });
        await x.MOVES.hit(c);
      } finally { G.auto = auto0; }
      big.hp = big.maxHp; big.tacDistracted = 0; x.refreshLabels();
    }
    await H.coach('cWhy');
    await H.coach('cYou');
    let round = 0;
    for (;;) {
      x.setupScaffolds();
      x.UI.rung(`Skill · team orders: <b>«${x.UI.esc(H.plain(H.line(round % 2 ? 'exC2' : 'exC')[0]))}»</b>`);
      G.roundLog0 = G.stats.gradeLog.length;
      await T.lessonLoop(x, G, {
        before: async () => { G.tacGuard = null; },
        after: async r => {
          const L = G.tacLesson;
          if (r && r.kind === 'tac' && r.tac === 'C' && L.got === 1 && !L.cheered) { L.cheered = true; await H.coach('cGot'); }
          // a guard up: a dummy swings, and the guard blocks it
          if (G.tacGuard && G.tacGuard.turn === G.turn) { const d = x.targetable().find(f => f.species === 'dummy' && f.tacDistracted !== G.turn); if (d) await blocked(d, G.tacGuard.who === 'you' ? x.A.you : x.A.mimo, G.tacGuard); }
        },
      });
      await x.practiceCheer();
      if (!(await x.practiceCard())) break;
      G.round++; round++;
      await T.newDummies(x, G, 3, [dummy('red', 'small'), dummy('blue', 'big', 12), dummy('green', 'small')]);
      if (round % 2) { x.ST.shot('coach'); await H.coach('cWe'); }
    }
    x.ST.shot('coach');
    await x.coachSay('pDone');
    return 'done';
  };
})();
