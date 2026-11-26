'use strict';
// Chaining moves with «and» (DESIGN.md 20, P7a: "teach "and" in the target language so users can do multiple attacks then make
// combos do crit dmg but punish the user more for errors the longer the attack sentence is").
//   es «¡Salta sobre el rojo y golpea al azul!» · «A, B y C» · pt «… e …» · de «… und …» · zh «…，然后…» / «…再…» · ja the
//   て-form chain «跳んで、打って！».
// A skill on Bruno's board (Y, from his second lesson on): the demonstration, then a practice; doing it once turns it on. Then one
// sentence takes up to three actions (four with B's «primero… luego… al final»), resolved in turn:
//   - the later hits are critical: the 2nd ×1.5, the 3rd ×2 (a 4th ×2.5), each with a «CHAIN n · CRIT» pop;
//   - the risk grows with the length: a slip anywhere (a B or worse: a misspelling, a wrong form, a missing joining word) breaks
//     the chain and nothing lands. With three actions or more, Mimo also stumbles and loses the next turn (the foes go twice);
//   - each action is graded on its own, and so is each joining word: «A B» (no «y») or a list without «y» before its last action
//     is a joining-word slip; zh needs 然后 / 再 (a comma alone isn't enough); ja chains with the て-form;
//   - the grade pill says it all while you type: each action's letter, each «y», the crits, and what a slip would cost.
// Accents never cost (the parser's accent tips stay tips). Takes over B's combo steps when both are on (tactics.js asks
// _.chain.owns()). The reaction box's counter command («¡Agáchate y golpea!») is the same rule (battle/react.js).
// Tests: BATTLE._.tac.force = 'Y…', BATTLE._.chain.last (the last chain judged).
(() => {
  const B = window.BATTLE, _ = B && B._;
  if (!_ || !_.P || !_.tac || !_.tac.h || !_.UI) return;
  const P = _.P, T = _.tac, H = T.h, X = () => _.flow;
  const CJ = () => (typeof CJK !== 'undefined' ? CJK : null);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const MULT = [1, 1.5, 2, 2.5];
  const on = () => { try { return !!T.on('Y'); } catch (e) { return false; } };
  // the joining word, as said and as shown
  const J = { es: 'y', pt: 'e', de: 'und', zh: '[然后|rán hòu]', ja: '、' };
  const JSHOW = { es: '«y»', pt: '«e»', de: '«und»', zh: '«然后»', ja: 'the て-form' };
  // the words that start one of B's combos («primero…»): those keep B's own wording
  const FIRST = { es: ['primero'], pt: ['primeiro'], de: ['zuerst', 'erst'] };

  // ------------------------------------------------------------ the board, the slip's name and its why
  T.INFO.Y = { name: 'Chain moves with “and”', sub: 'two or three moves in one sentence: critical hits, but a slip costs the whole chain', wait: 'after Bruno’s second lesson' };
  if (!T.KEYS.includes('Y')) T.KEYS.splice(Math.max(0, (T.KEYS.includes('R') ? T.KEYS.indexOf('R') : T.KEYS.indexOf('A')) + 1), 0, 'Y');
  const un0 = T.unlocked;
  T.unlocked = k => {
    if (k !== 'Y') return un0(k);
    if (T.force != null) return T.force.includes(k);
    const g = _.RW && _.RW.game, s = g && g.state;
    return !!(s && s.flags && (s.flags.lessons || 0) >= 2);
  };
  const WHY = {
    es: ['Joining-word slip («y»)', 'Joining actions: «y» goes before the last one. Two: «Salta sobre el rojo y golpea al azul». Three: «A, B y C» (a comma between the first two, then «y»).'],
    pt: ['Joining-word slip («e»)', 'Joining actions: «e» goes before the last one. Two: «Pula no vermelho e bate no azul». Three: «A, B e C» (a comma between the first two, then «e»).'],
    de: ['Joining-word slip («und»)', 'Joining actions: «und» goes before the last one. Two: «Spring auf den Roten und schlag den Blauen». Three: «A, B und C» (a comma between the first two, then «und»).'],
    zh: ['Joining-word slip (然后)', 'Between two actions, put 然后 (or 再): «[跳|tiào] ， [然后|rán hòu] [打|dǎ] ！». A comma alone doesn’t join them.'],
    ja: ['Joining slip (て-form)', 'Chain actions with the て-form: «[跳|と]んで 、 [打|う]って ！». The plain form or the 〜ろ / 〜べ form doesn’t chain them.'],
  };
  for (const [l, [slip, why]] of Object.entries(WHY)) {
    const L = _.LANGS && _.LANGS[l]; if (!L) continue;
    L.slip = L.slip || {}; if (!L.slip.join) L.slip.join = slip;
    L.why = L.why || {}; if (!L.why.join) L.why.join = why;
  }

  // ------------------------------------------------------------ reading the joining words
  // es / pt / de: where each action starts (a verb Mimo knows), and what joins it to the one before: a joining word (any of the
  // language's: «y», «y luego», «luego»; B's «al final»…), a comma, or nothing
  function analyze(text, L, ctx) {
    const I = P.indexLang(L), toks = H.toks(text);
    const skip = t => I.voc.has(t.n) || I.fill.has(t.n) || !!(ctx && ctx.voc && ctx.voc.has(t.n));
    const first = toks.findIndex(t => !skip(t));
    if (first < 0) return null;
    const vIdx = [];
    for (let k = first; k < toks.length; k++) if (!skip(toks[k]) && P.look(I.verbs, toks[k].n)) vIdx.push(k);
    if (vIdx.length < 2 || vIdx[0] !== first) return null;        // (it has to start with an action: «cuando…», talk and team orders aren't chains)
    const joins = [];
    for (let a = 1; a < vIdx.length; a++) {
      const k = vIdx[a]; let used = null;
      for (const seq of I.conj) { const s = k - seq.length; if (s > vIdx[a - 1] && seq.every((w, j) => toks[s + j].n === w)) { used = { kind: 'conj', words: toks.slice(s, k).map(t => t.raw).join(' '), at: s }; break; } }
      if (!used) used = toks[k - 1].comma ? { kind: 'comma', words: ',', at: k } : { kind: 'none', words: '', at: k };
      joins.push(used);
    }
    return { n: vIdx.length, joins, toks, vIdx };
  }
  // the sentence with the joining word put in where it was missing (so the parser reads every action), from what you typed
  function repaired(text, an, w) {
    let out = '', last = 0;
    an.joins.forEach((jn, a) => {
      if (jn.kind === 'conj') return;
      const t = an.toks[an.vIdx[a + 1]];
      out += text.slice(last, t.i).replace(/[,;:]\s*$/, ' ').replace(/\s*$/, ' ') + w + ' ';
      last = t.i;
    });
    return out + text.slice(last);
  }
  // zh: how many 然后 / 再 / 接着 / 之后 there are (然后再 counts once); ja: それから / そして / あと / 次に
  const CJW = { zh: [['[然后|rán hòu]', '[再|zài]'], ['[然后|rán hòu]'], ['[再|zài]'], ['[接着|jiē zhe]'], ['[之后|zhī hòu]']], ja: [['それから'], ['そして'], ['あと'], ['[次|つぎ]に']] };
  function countJoinsCJ(text, l) {
    const C = CJ(); if (!C) return 0;
    let U; try { U = C.typed(text, l).U || []; } catch (e) { return 0; }
    const words = CJW[l].map(seq => seq.map(s => C.wordOf(s, l)));
    let n = 0;
    for (let i = 0; i < U.length;) {
      let hit = null;
      for (const seq of words) {
        let j = i, ok = true;
        for (const w of seq) { const m = C.matchAt(w, U, j, l); if (!m) { ok = false; break; } j = m.j; }
        if (ok && (!hit || j > hit)) hit = j;
      }
      if (hit) { n++; i = hit; } else i++;
    }
    return n;
  }
  // marks each joining word on the parse: a slip on the action after a missing one; and the sentence said back with «y»
  function markJoins(r, text, ctx, an) {
    const L = ctx.L, l = L.code, n = r.clauses.length;
    let joins;
    if (l === 'zh' || l === 'ja') {
      let k = countJoinsCJ(text, l);
      joins = [];
      for (let a = 0; a < n - 1; a++) {
        const c = r.clauses[a];
        if (l === 'ja' && c.cj && c.cj.form === 'te') { joins.push({ ok: true, word: 'て' }); continue; }
        if (k > 0) { k--; joins.push({ ok: true, word: l === 'zh' ? '然后' : 'それから' }); continue; }
        joins.push({ ok: false, word: '' });
      }
    } else {
      if (!an || an.n !== n) return;
      joins = an.joins.map((jn, a) => ({ ok: jn.kind === 'conj' || (jn.kind === 'comma' && a < n - 2), word: jn.words }));
    }
    joins.forEach((jn, a) => { if (!jn.ok) r.clauses[a + 1].errors.push({ kind: 'join', major: false }); });
    r.chainJoins = joins;
    r.errors = r.clauses.flatMap(c => c.errors);
    if (joins.some(j => !j.ok)) r.recast = true;
    // said back as a list joined by «y» (B's «primero… luego…» keep their own words)
    const firstW = (FIRST[l] || []).map(P.nrm), raw = H.toks(text).map(t => t.n);
    if (l === 'ja') r.canon = r.clauses.map((c, k) => (k < n - 1 && c.cj && c.cj.form !== 'te' && c.cj.verbSrc && L.verbs[c.baseVerb] ? String(c.canon).replace(c.cj.verbSrc, L.verbs[c.baseVerb].show) : c.canon)).join(' 、 ') + ' ！';     // (said back chained: the て-form)
    else if (l !== 'zh' && !raw.some(w => firstW.includes(w))) {
      const cs = r.clauses.map(c => c.canon), w = J[l];
      r.canon = P.wrapS(L, cs.length === 2 ? `${cs[0]} ${w} ${cs[1]}` : `${cs.slice(0, -1).join(', ')} ${w} ${cs[cs.length - 1]}`);
    }
  }
  // the parser, wrapped: more actions per sentence once «and» is on, the missing joining words read and graded
  const parse1 = P.parse;
  P.parse = (text, ctx) => {
    const x = X();
    if (!x || !x.G.running || !ctx || !ctx.L || ctx.tacSkip || ctx.tacInner || !on()) return parse1(text, ctx);
    if (!ctx.maxClauses) ctx.maxClauses = T.on('B') ? 4 : 3;
    let r = parse1(text, ctx);
    try {
      if (ctx.L.cjk) { if (r && r.ok && r.kind === 'command' && r.clauses.length >= 2) markJoins(r, text, ctx, null); return r; }
      const an = analyze(String(text), ctx.L, ctx);
      if (!an || an.n < 2) return r;
      if (!(r && r.ok && r.kind === 'command' && r.clauses.length === an.n) && an.joins.some(j => j.kind !== 'conj')) {
        const r2 = parse1(repaired(String(text), an, J[ctx.L.code] || 'y'), Object.assign({}, ctx));
        if (r2 && r2.ok && r2.kind === 'command' && r2.clauses.length === an.n) { r2.raw = text; r = r2; }
      }
      if (r && r.ok && r.kind === 'command' && r.clauses.length === an.n) markJoins(r, text, ctx, an);
    } catch (e) { console.error('[chain] parse', e); }
    return r;
  };

  // ------------------------------------------------------------ the crits, or the broken chain
  const api = { last: null, owns: on, analyze, countJoinsCJ, MULT };
  T.judgeHooks.push(r => {
    if (!on() || r.kind !== 'command' || !r.clauses || r.clauses.length < 2 || r.eat) return;
    const x = X(), n = r.clauses.length;
    const per = r.clauses.map(c => x.gradeOf({ kind: 'command', clauses: [c], raw: r.raw, canon: r.canon }).letter);
    const g = x.gradeOf(r), broken = g.slips > 0;
    r.chain = { n, per, joins: r.chainJoins || [], broken, stumble: broken && n >= 3, mults: [] };
    if (broken) r.clauses.forEach((c, k) => { c.tacMult = 0; c.crit = false; c.tacSub = null; c.tacRun = k === 0 ? (() => brokenRun(r)) : (async () => {}); });
    else r.clauses.forEach((c, k) => {
      if (!k || !H.attackVerb(c.verb)) return;
      const m = MULT[Math.min(k, MULT.length - 1)];
      c.tacMult = (c.tacMult || 1) * m; c.tacSub = `CRIT ×${m}`; c.tacCombo = k + 1; r.chain.mults[k] = m;
      const prev = c.tacRun;
      c.tacRun = async q => { const y = X(); H.pop(y.A.mimo, `CHAIN ${k + 1} · CRIT!`, { color: '#ffb627', size: 26 + 4 * k, life: 0.95 }); y.emit('combo', { n: k + 1 }); await (prev ? prev(q) : y.MOVES[q.verb](q)); };
    });
    api.last = { raw: String(r.raw || '').trim(), chain: r.chain };
  });
  // the chain breaks: Mimo sets off, trips over the words, and nothing lands (three or more: it stumbles, and the foes go again)
  async function brokenRun(r) {
    const x = X(), G = x.G, M = x.A.mimo, f = r.clauses[0].target;
    x.setMood(M, 'go');
    if (f) x.ST.shot('action', M, f, { yaw: -0.1 });
    await x.tween(M, { sx: 1.2, sy: 0.82, lean: -0.2 }, 0.1);
    x.emit('jump');
    if (f) await x.arcTo(M, M.x + (f.x - M.x) * 0.3, 0, M.z + (f.z - M.z) * 0.3, 0.3, 0.5);
    x.setMood(M, 'confused', 1.8);
    await x.tween(M, { lean: 0.9, sy: 0.7, sx: 1.2 }, 0.12, 'in');
    x.ST.S.fx.puff(M.x, 0.05, M.z, 8, 0.2); x.ST.shake(0.25, 0.25); x.emit('miss');
    H.pop(M, 'CHAIN BROKEN', { color: '#ff9b88', size: 30, life: 1.4 });
    if (G.badgePending && f) x.showGrade(f);
    G.stats.chainsBroken = (G.stats.chainsBroken || 0) + 1;
    await x.wait(0.5);
    await x.tween(M, { lean: 0, sy: 1, sx: 1 }, 0.25, 'back');
    await x.hopHome(M, 0.5, 0.4);
    if (r.chain && r.chain.stumble && !x.allDone()) await stumble();
    x.setMood(M, 'idle');
  }
  async function stumble() {
    const x = X(), G = x.G, M = x.A.mimo;
    H.pop(M, 'STUMBLE: a turn lost', { color: '#ff9b88', size: 26, dy: 0.75, life: 1.9 });
    x.setMood(M, 'sad', 2.6);
    for (let i = 0; i < 3; i++) { x.ST.star(x.ST.worldOf(M, 'top'), '#fff3a0', 0.5); await x.wait(0.22); }
    H.tip('stumble');
    G.stats.stumbles = (G.stats.stumbles || 0) + 1;
    await x.wait(0.3);
    await x.foePhase();             // (the turn Mimo lost: the foes go now, then again as usual)
  }
  // the grade pill while you type: each action's letter and joining word, the crits, and the risk
  function pill(ch) {
    const x = X(), G = x.G, l = G.lang, name = esc(G.name);
    const seg = ch.per.map((g, k) => {
      const j = k ? ch.joins[k - 1] : null;
      const jw = j ? (j.ok ? `<span class="dim">${esc(j.word || (l === 'ja' ? 'て' : '·'))}</span> ` : `<span class="warn">${j.word ? esc(j.word) : JSHOW[l]}?</span> `) : '';
      return `${jw}<span class="pw g${g}">${k + 1} ${g}</span>`;
    }).join(' ');
    if (ch.broken) return ` <span class="chn">⛓ ${seg} <span class="warn">· broken: nothing lands${ch.stumble ? `, and ${name} stumbles (a turn lost)` : ''}</span></span>`;
    const crits = ch.mults.map((m, k) => (m ? `${k + 1}: CRIT ×${m}` : '')).filter(Boolean).join(' · ');
    return ` <span class="chn">⛓ ${seg} <span class="bonus">${crits}</span> <span class="dim">· a slip ${ch.n >= 3 ? `breaks it and ${name} stumbles` : 'breaks it: nothing lands'}</span></span>`;
  }
  const pv0 = _.UI.preview;
  _.UI.preview = function (h) {
    try {
      const x = X(), G = x && x.G, inp = x && x.UI.U.e && x.UI.U.e.input, L = api.last;
      if (h && L && G && G.running && G.pending && G.pending.kind === 'command' && inp && inp.value.trim() === L.raw && on()) h += pill(L.chain);
    } catch (e) { /* */ }
    return pv0.call(this, h);
  };
  { const s = document.createElement('style'); s.textContent = '#battle-ui .bt-preview .chn { white-space: nowrap; margin-left: 4px; } #battle-ui .bt-preview .chn .pw { margin-left: 2px; } #battle-ui .bt-preview .chn .warn { color: #b8403a; }'; document.head.appendChild(s); }

  // ------------------------------------------------------------ the lesson at the yard (focus 'tac:Y')
  const LINES = {
    es: { yHello: ['¡Hoy, una palabra pequeña pero muy útil: «y»! Con «y», {name} hace dos cosas en una sola frase.', 'Today, a small but very useful word: «y» (and)! With «y», {name} does two things in one sentence.'],
      yWhy: ['La segunda acción es un golpe crítico: ¡pega una vez y media! Con tres acciones, la tercera pega el doble.', 'The second move is a critical hit: one and a half times as strong! With three moves, the third hits double.'],
      yRisk: ['Pero ojo: si te equivocas, la cadena se rompe y {name} no hace nada. Con tres acciones, además se tropieza y pierde un turno.', 'But careful: one slip and the chain breaks, and {name} does nothing. With three moves, {name} also trips and loses a turn.'],
      yThree: ['¿Tres? Una coma entre las dos primeras y «y» antes de la última: «A, B y C».', 'Three? A comma between the first two, and «y» before the last: «A, B y C».'],
      yYou: ['¡Ahora tú! Dos acciones con «y».', 'Now you! Two moves with «y».'], yGot: ['¡Una cadena! ¡Así se hace!', 'A chain! That’s how it’s done!'],
      yTrip: ['¡Uy, se rompió la cadena! Despacio: cada palabra cuenta.', 'Oops, the chain broke! Slowly: every word counts.'] },
    pt: { yHello: ['Hoje, uma palavra pequena, mas muito útil: «e»! Com «e», o {name} faz duas coisas numa frase só.', 'Today, a small but very useful word: «e» (and)! With «e», {name} does two things in one sentence.'],
      yWhy: ['A segunda ação é um golpe crítico: bate uma vez e meia! Com três ações, a terceira bate em dobro.', 'The second move is a critical hit: one and a half times as strong! With three moves, the third hits double.'],
      yRisk: ['Mas cuidado: se você errar, a corrente se quebra e o {name} não faz nada. Com três ações, ele ainda tropeça e perde a vez.', 'But careful: one slip and the chain breaks, and {name} does nothing. With three moves, {name} also trips and loses a turn.'],
      yThree: ['Três? Uma vírgula entre as duas primeiras e «e» antes da última: «A, B e C».', 'Three? A comma between the first two, and «e» before the last: «A, B e C».'],
      yYou: ['Agora você! Duas ações com «e».', 'Now you! Two moves with «e».'], yGot: ['Uma corrente! É assim que se faz!', 'A chain! That’s how it’s done!'],
      yTrip: ['Opa, a corrente quebrou! Devagar: cada palavra conta.', 'Oops, the chain broke! Slowly: every word counts.'] },
    de: { yHello: ['Heute ein kleines, aber sehr nützliches Wort: „und“! Mit „und“ macht {name} zwei Sachen in einem Satz.', 'Today, a small but very useful word: «und» (and)! With «und», {name} does two things in one sentence.'],
      yWhy: ['Die zweite Aktion ist ein kritischer Treffer: anderthalbmal so stark! Bei drei Aktionen trifft die dritte doppelt.', 'The second move is a critical hit: one and a half times as strong! With three moves, the third hits double.'],
      yRisk: ['Aber Vorsicht: Ein Fehler, und die Kette reißt. Dann macht {name} gar nichts. Bei drei Aktionen stolpert {name} auch noch und setzt eine Runde aus.', 'But careful: one slip and the chain breaks, and {name} does nothing. With three moves, {name} also trips and sits out a round.'],
      yThree: ['Drei? Ein Komma zwischen den ersten beiden und „und“ vor der letzten: „A, B und C“.', 'Three? A comma between the first two, and «und» before the last: «A, B und C».'],
      yYou: ['Jetzt du! Zwei Aktionen mit „und“.', 'Now you! Two moves with «und».'], yGot: ['Eine Kette! Genau so!', 'A chain! Just like that!'],
      yTrip: ['Hoppla, die Kette ist gerissen! Langsam: Jedes Wort zählt.', 'Whoops, the chain broke! Slowly: every word counts.'] },
    zh: { yHello: ['[今天|jīn tiān] [学|xué] [一个|yī gè] [小|xiǎo] [词|cí] ： [然后|rán hòu] 。 [用|yòng] [然后|rán hòu] ， {mimo} [一|yī] [句|jù] [话|huà] [能|néng] [做|zuò] [两|liǎng] [件|jiàn] [事|shì] 。', 'Today, a little word: 然后 (and then). With 然后, {name} does two things in one sentence.'],
      yWhy: ['[第二|dì èr] [个|gè] [动作|dòng zuò] [是|shì] [暴击|bào jī] ： [一|yī] [点|diǎn] [五|wǔ] [倍|bèi] ！ [三|sān] [个|gè] [动作|dòng zuò] [的话|de huà] ， [第三|dì sān] [个|gè] [是|shì] [两|liǎng] [倍|bèi] 。', 'The second move is a critical hit: one and a half times! With three moves, the third hits double.'],
      yRisk: ['[可是|kě shì] [小心|xiǎo xīn] ： [说错|shuō cuò] [一个|yī gè] [地方|dì fang] ， [连招|lián zhāo] [就|jiù] [断|duàn] [了|le] ， {mimo} [什么|shén me] [都|dōu] [不|bù] [做|zuò] 。 [三|sān] [个|gè] [动作|dòng zuò] [说错|shuō cuò] [的话|de huà] ， {mimo} [还|hái] [会|huì] [摔倒|shuāi dǎo] ， [停|tíng] [一|yī] [回合|huí hé] 。', 'But careful: one slip and the chain breaks, and {name} does nothing. With three moves, {name} also trips and sits out a round.'],
      yThree: ['[三|sān] [个|gè] [动作|dòng zuò] ？ [每|měi] [两|liǎng] [个|gè] [中间|zhōng jiān] [都|dōu] [加|jiā] [然后|rán hòu] [或者|huò zhě] [再|zài] 。', 'Three moves? Put 然后 or 再 between each two.'],
      yYou: ['[现在|xiàn zài] [轮到|lún dào] [你|nǐ] [了|le] ！ [两|liǎng] [个|gè] [动作|dòng zuò] ， [中间|zhōng jiān] [用|yòng] [然后|rán hòu] 。', 'Your turn! Two moves, with 然后 between them.'],
      yGot: ['[连上|lián shàng] [了|le] ！ [太|tài] [棒|bàng] [了|le] ！', 'Chained! Great!'],
      yTrip: ['[哎呀|āi ya] ， [连招|lián zhāo] [断|duàn] [了|le] ！ [慢|màn] [一点|yī diǎn] ， [每|měi] [个|gè] [词|cí] [都|dōu] [重要|zhòng yào] 。', 'Oops, the chain broke! A bit slower: every word counts.'] },
    ja: { yHello: ['[今日|きょう] は 、 [動|うご]き を つなげる [練習|れんしゅう] です 。 て[形|けい] で つなげる と 、 {mimo} は [一|ひと]つ の [文|ぶん] で [二|ふた]つ の こと を します 。', 'Today we practice chaining moves. Chain them with the て-form, and {name} does two things in one sentence.'],
      yWhy: ['[二|ふた]つ[目|め] の [動|うご]き は クリティカル です ！ [三|みっ]つ なら 、 [三|みっ]つ[目|め] は [二倍|にばい] です 。', 'The second move is a critical hit (×1.5)! With three, the third hits double.'],
      yRisk: ['でも [気|き] を つけて ください 。 [一|ひと]つ でも [間違|まちが]える と 、 つながり が [切|き]れて 、 {mimo} は [何|なに] も しません 。 [三|みっ]つ の とき は 、 {mimo} が ころんで 、 [一回|いっかい] [休|やす]み です 。', 'But careful: one slip and the chain breaks, and {name} does nothing. With three, {name} also trips and sits out a turn.'],
      yThree: ['[三|みっ]つ なら 、 [全部|ぜんぶ] て[形|けい] で つなげます 。 「 [跳|と]んで 、 [打|う]って 、 [押|お]して ！ 」', 'Three? Chain them all with the て-form: «跳んで、打って、押して！» (jump, hit, push!).'],
      yYou: ['あなた の [番|ばん] です 。 [二|ふた]つ の [動|うご]き を 、 て[形|けい] で つなげて ください 。', 'Your turn. Chain two moves with the て-form.'],
      yGot: ['つながりました ！ その [調子|ちょうし] です ！', 'Chained! Keep it up!'], yTrip: ['あっ 、 つながり が [切|き]れました ！ ゆっくり 、 [一|ひと]つ ずつ 。', 'Ah, the chain broke! Slowly, one at a time.'] },
  };
  const TIPS = {
    es: 'Three actions and a slip: {name} stumbled and lost a turn, so the foes go again. With «y», shorter is safer.',
    pt: 'Three actions and a slip: {name} stumbled and lost a turn, so the foes go again. With «e», shorter is safer.',
    de: 'Three actions and a slip: {name} stumbled and lost a turn, so the foes go again. With «und», shorter is safer.',
    zh: 'Three actions and a slip: {name} stumbled and lost a turn, so the foes go again. With 然后, shorter is safer.',
    ja: 'Three actions and a slip: {name} stumbled and lost a turn, so the foes go again. Shorter chains are safer.',
  };
  for (const [l, t] of Object.entries(LINES)) {
    const X0 = T.LX[l]; if (!X0) continue;
    for (const [k, v] of Object.entries(t)) if (!X0[k]) X0[k] = v;
    X0.tips = X0.tips || {}; if (!X0.tips.stumble) X0.tips.stumble = TIPS[l];
  }
  const DEMO = BATTLE._.tacDemo || (BATTLE._.tacDemo = {});
  DEMO.Y = {
    es: '¿Ves? «¡Salta sobre el rojo y golpea al azul!» Con «y», {mimo} hace las dos cosas. ¡Y el segundo golpe pega más fuerte!',
    pt: 'Viu? «Pula no vermelho e bate no azul!» Com «e», o {mimo} faz as duas coisas. E o segundo golpe bate mais forte!',
    de: 'Siehst du? „Spring auf den Roten und schlag den Blauen!“ Mit „und“ macht {mimo} beides. Und der zweite Treffer ist stärker!',
    zh: '[看到|kàn dào] [了|le] [吗|ma] ？ [跳|tiào] [到|dào] [红色|hóng sè] [的|de] [身上|shēn shang] ， [然后|rán hòu] [打|dǎ] [蓝色|lán sè] [的|de] ！ [用|yòng] [然后|rán hòu] ， {mimo} [两|liǎng] [件|jiàn] [事|shì] [都|dōu] [做|zuò] ， [第二|dì èr] [下|xià] [更|gèng] [狠|hěn] ！',
    ja: '[分|わ]かります か ？ 「 [赤|あか]い やつ に [跳|と]んで 、 [青|あお]い の を [打|う]って ！ 」 て[形|けい] で つなげる と 、 {mimo} は [両方|りょうほう] やります 。 [二|ふた]つ[目|め] は もっと [強|つよ]い です よ ！',
    en: 'See? “Jump on the red one and hit the blue one!” With “and”, {mimo} does both. And the second hit is stronger!',
    marks: { es: [['y', 'and'], ['las dos cosas', 'both things'], ['más fuerte', 'harder']], pt: [['e', 'and'], ['as duas coisas', 'both things'], ['mais forte', 'harder']],
      de: [['und', 'and'], ['beides', 'both'], ['stärker', 'stronger']], zh: [['[然后|rán hòu]', 'and then'], ['[两|liǎng] [件|jiàn] [事|shì]', 'two things'], ['[更|gèng] [狠|hěn]', 'harder']],
      ja: [['[跳|と]んで', 'jump, and… (て-form)'], ['[両方|りょうほう]', 'both'], ['[強|つよ]い', 'strong']] },
  };
  T.specsHooks.push((specs, opts) => {
    if (!opts.practice || opts.focus !== 'tac:Y') return;
    const x = X(), cs = ['red', 'blue', 'green', 'yellow', 'white'].filter(c => x.knows('a.' + c));
    const colors = (cs.length >= 2 ? x.shuffle(cs) : ['red', 'blue']).slice(0, cs.length >= 3 ? 3 : 2);
    specs.length = 0; colors.forEach(c => specs.push(x.normFoe({ kind: 'dummy', color: c, size: 'small', hp: 9 }, specs.length)));
  });
  // the example: two (or three) moves on the dummies, by color, joined the language's way
  function example(x, G, foes, n = 2) {
    const L = G.L, verbs = x.attackVerbs(), v = [verbs.includes('jump') ? 'jump' : verbs[0], verbs.includes('hit') ? 'hit' : verbs[0], verbs.includes('jump') ? 'jump' : verbs[0]];
    const cl = foes.slice(0, n).map((f, i) => P.sayClause(L, v[i], f, { adjs: [f.color] }));
    if (L.code === 'zh') return cl.join(' ， [然后|rán hòu] ') + ' ！';
    if (L.code === 'ja') return cl.join(' 、 ') + ' ！';
    return P.wrapS(L, cl.length === 2 ? `${cl[0]} ${J[L.code]} ${cl[1]}` : `${cl.slice(0, -1).join(', ')} ${J[L.code]} ${cl[cl.length - 1]}`);
  }
  T.lessons.Y = async (x, G) => {
    await x.intro();
    x.ST.shot('coach');
    await H.coach('yHello');
    G.tacLesson = { k: 'Y', got: 0 };
    const foes = x.targetable(), ex = example(x, G, foes, 2), look = H.line('bLook');
    await x.coachSay([`${look[0]} «${ex}»`, `${look[1]} two moves in one sentence.`]);
    // Mimo does it: the second hit is a CRIT (the demonstration's hits don't count)
    const r = P.parse(H.plain(ex), x.ctx());
    if (r && r.ok && r.kind === 'command') {
      x.judge(r);
      const auto0 = G.auto; G.auto = Object.assign({}, auto0 || {}, { timing: 'perfect' });
      try { x.say(x.A.you, H.plain(ex), { cls: 'you', dur: 2.6 }); for (const c of r.clauses) { if (!c.target.alive) continue; await (c.tacRun ? c.tacRun(c) : x.MOVES[c.verb](c)); } } finally { G.auto = auto0; }
      for (const f of G.foes) f.hp = f.maxHp;
      x.refreshLabels();
    }
    await H.coach('yWhy');
    await H.coach('yRisk');
    if (foes.length >= 3) await H.coach('yThree');
    await H.coach('yYou');
    for (;;) {
      x.setupScaffolds();
      const fs = x.targetable().length >= 2 ? x.targetable() : G.foes;
      x.UI.rung(`Skill · chain moves with ${JSHOW[G.lang]}: <b>«${x.UI.esc(H.plain(example(x, G, fs, 2)))}»</b>`);
      G.roundLog0 = G.stats.gradeLog.length;
      await T.lessonLoop(x, G, {
        after: async q => {
          const L = G.tacLesson;
          if (!q || q.kind !== 'command' || !q.chain) return;
          if (!q.chain.broken) { L.got++; if (T.learn('Y')) T.learnedBanner('Y'); if (L.got === 1) await H.coach('yGot'); }
          else if (!L.tripTold) { L.tripTold = true; await H.coach('yTrip'); }
        },
      });
      await x.practiceCheer();
      if (!(await x.practiceCard())) break;
      G.round++;
      await T.newDummies(x, G, Math.min(3, Math.max(2, ['red', 'blue', 'green', 'yellow', 'white'].filter(c => x.knows('a.' + c)).length)));
    }
    x.ST.shot('coach');
    await x.coachSay('pDone');
    return 'done';
  };

  // ------------------------------------------------------------ zh / ja: every notation string here (CJK.md)
  api.check = () => {
    if (typeof CJK === 'undefined' || !CJK.validate) return [];
    const out = [], chk = (where, s, l) => { const p = CJK.validate(s, l); if (p.length) out.push({ where, src: s, problems: p }); };
    for (const l of ['zh', 'ja']) {
      for (const [k, v] of Object.entries(LINES[l])) chk(k, v[0], l);
      chk('DEMO.Y', DEMO.Y[l], l); DEMO.Y.marks[l].forEach(([w]) => chk('DEMO.Y mark', w, l));
      CJW[l].forEach(seq => seq.forEach(s => chk('join', s, l)));
      for (const m of WHY[l][1].match(/«([^»]+)»/g) || []) chk('why', m.slice(1, -1), l);
    }
    chk('J zh', J.zh, 'zh');
    return out;
  };
  api.example = example;
  _.chain = api;
})();
