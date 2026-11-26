'use strict';
// DICT: the dictionary and grammar layer under free talk (js/talk/) and reading and listening (js/read/).
// DESIGN.md 15; the contract is ../../FLUENT.md (read it before touching this).
//
// One pack per language (js/dict/es.js, pt.js, de.js, zh.js, ja.js) registers a builder with DICT.register(lang, make).
// The pack is built (word list parsed, every form indexed) the first time something needs it, so a game only pays for
// its own language. DICT dispatches to the save's language (LEX.lang).
//
// It also keeps the learner's side, per language: every headword you read, hear, look up or use, and a short log of
// how your talking, reading and listening go. The level page (talk/) reads both. Saved with LEX (lexicon.js).

const DICT = (() => {
  const makers = {}, packs = {};
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const BANDS = ['A0', 'A1', 'A2', 'B1', 'B2'];          // an entry's band is 1..4 (A1..B2); a learner's estimate is 0..4
  const now = () => Date.now() / 1000;
  const today = () => Math.floor(Date.now() / 86400000);

  // ------------------------------------------------------------ packs
  function register(lang, make) { makers[lang] = make; delete packs[lang]; }
  function pack(lang = L()) {
    if (lang in packs) return packs[lang];
    if (!makers[lang]) return null;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : 0);
    try { packs[lang] = makers[lang](); } catch (e) { console.error('DICT: the ' + lang + ' pack failed to build', e); packs[lang] = null; }
    if (packs[lang]) packs[lang].buildMs = Math.round((typeof performance !== 'undefined' ? performance.now() : 0) - t0);
    return packs[lang];
  }
  const ready = (lang = L()) => !!pack(lang);
  const call = (fn, fb) => (...a) => { const p = pack(); return p && typeof p[fn] === 'function' ? p[fn](...a) : fb(...a); };

  // fallbacks for a language with no pack yet: split on spaces, know nothing
  const splitWords = text => {
    const out = []; const re = /[\p{L}\p{M}\p{N}'’-]+/gu; let m;
    while ((m = re.exec(String(text || '')))) out.push({ t: m[0], s: m.index, e: m.index + m[0].length, word: true });
    return out;
  };

  const entry = id => { const p = pack(); return p && p.entries ? p.entries.get(id) || null : null; };
  const tokens = call('tokens', splitWords);
  const analyze = call('analyze', text => ({ text: String(text || ''), lang: L(), words: splitWords(text).map((w, i) => Object.assign(w, { i, unknown: true, sugg: [] })),
    verbs: [], time: null, times: [], neg: false, question: /[?？]/.test(String(text || '')), numbers: [], connectors: [], clauses: 0, unknown: [], none: true }));
  const gloss = call('gloss', () => null);
  const inflect = call('inflect', () => null);
  const find = call('find', () => []);
  // Analyze and check in one go: { a (the analysis), errors, fixed (the sentence said right), major, minor }.
  // opts.focus: the error codes this moment is about (they're reported first); opts.player: true when it's the
  // player's own words (never gender the player: both forms of an adjective about «yo/eu/ich» are right).
  function check(text, opts = {}) {
    const p = pack(), a = analyze(text, opts);
    if (!p || typeof p.check !== 'function') return { a, errors: [], fixed: String(text || ''), major: 0, minor: 0, none: true };
    let errors = [];
    try { errors = p.check(a, opts) || []; } catch (e) { console.error('DICT.check', e); errors = []; }
    if (opts.focus && opts.focus.length) errors.sort((x, y) => (opts.focus.includes(y.code.split('.')[0]) ? 1 : 0) - (opts.focus.includes(x.code.split('.')[0]) ? 1 : 0));
    let fixed = String(text || '');
    try { if (errors.length && typeof p.fix === 'function') fixed = p.fix(a, errors); } catch (e) { console.error('DICT.fix', e); }
    // (P6a, DESIGN.md 19: a word only an accent away from right, «comi» for «comí», «Kase» for «Käse», never costs a grade: the
    // error stays, as a friendly tip, marked free; minor counts the others. «Kaese» (ae for ä) is right as typed: no tip. «porque»
    // for «por qué» is more than an accent: it counts.)
    try { if (typeof ACCENTS !== 'undefined' && ACCENTS.isLat(L())) for (const e of errors) if (e.code === 'accent' && Array.isArray(e.at) && a.words[e.at[0]] && a.words[e.at[1]]) { const typed = String(a.text || '').slice(a.words[e.at[0]].s, a.words[e.at[1]].e); if (ACCENTS.same(typed, e.fix, L())) { e.free = true; e.tip = ACCENTS.exactly(typed, e.fix, L()) ? '' : ACCENTS.tip(e.fix, L(), typed); } } } catch (e) { /* */ }
    return { a, errors, fixed, major: errors.filter(e => e.sev === 'major').length, minor: errors.filter(e => e.sev !== 'major' && !e.free).length };
  }
  // every entry with this topic tag, up to a band (for content checks and for NPCs picking words to use)
  function tagged(tag, band = 4) {
    const p = pack(); if (!p || !p.entries) return [];
    const out = []; for (const e of p.entries.values()) if (e.band <= band && e.tags && e.tags.includes(tag)) out.push(e);
    return out;
  }
  const size = (lang = L()) => { const p = pack(lang); return p && p.entries ? p.entries.size : 0; };

  // ------------------------------------------------------------ the learner's words
  // M[lang][id] = { r: read or heard in context, g: looked up, u: used right, x: used wrong, t: last time, d: days used, dl: last day used }
  let M = { es: {}, pt: {}, de: {}, zh: {}, ja: {} };
  const st = id => { const m = M[L()] || (M[L()] = {}); return m[id] || (m[id] = { r: 0, g: 0, u: 0, x: 0, t: 0, d: 0, dl: 0 }); };
  // how: 'read' | 'heard' (met in context) · 'gloss' (looked it up) · 'used' (typed it, right) · 'wrong' (typed it, wrong)
  function met(id, how) {
    if (!id) return;
    const s = st(id); s.t = now();
    if (how === 'read' || how === 'heard') s.r++;
    else if (how === 'gloss') s.g++;
    else if (how === 'used') { s.u++; const d = today(); if (s.dl !== d) { s.d++; s.dl = d; } }
    else if (how === 'wrong') s.x++;
    // a headword that's also a LEX item (entry.lex) counts toward Mimo's word too, when you use it right
    if (how === 'used' && typeof LEX !== 'undefined') { const e = entry(id); if (e && e.lex && LEX.item(e.lex)) LEX.attempt(e.lex, { ok: true, mode: 'talk', ms: 3000 }); }
  }
  // Every content word of an analysis you just read or heard (READ calls this per sentence), or used (TALK, per answer).
  function metAll(a, how) { if (a && a.words) for (const w of a.words) if (w.id && !w.unknown) met(w.id, how); }
  // 0 new · 1 seen · 2 familiar (met in context 5+ times, and not looked up more than once in the last few) · 3 known
  // (used right twice, or Mimo knows it) · 4 strong (used right on 3+ different days)
  function level(id) {
    const m = M[L()] && M[L()][id];
    const e = entry(id);
    let lexKnown = false;
    if (e && e.lex && typeof LEX !== 'undefined' && LEX.item(e.lex)) lexKnown = LEX.st(e.lex).stage >= LEX.STAGE.KNOWN;
    if (!m) return lexKnown ? 3 : 0;
    if (m.u >= 2 && m.d >= 3) return 4;
    if (m.u >= 2 || lexKnown) return 3;
    if (m.r >= 5 && m.g <= Math.max(1, m.r / 6)) return 2;
    return (m.r || m.g || m.u || m.x) ? 1 : 0;
  }
  // How much of a text you'd understand: the share of its word tokens (names and numbers aside) at level 2 or more.
  // For the library's covers ("You know 94% of the words") and for picking what's at your level (aim: about 95%).
  function coverage(text) {
    const a = typeof text === 'string' ? analyze(text) : text;
    let n = 0, k = 0; const unknown = new Set();
    for (const w of (a.words || [])) {
      if (w.pos === 'name' || w.pos === 'num' || w.punct) continue;
      n++;
      if (w.id && level(w.id) >= 2) k++; else if (w.id) unknown.add(w.id);
    }
    return { words: n, known: k, share: n ? k / n : 1, unknown: [...unknown] };
  }
  // vocabulary size: known (3+) and familiar (2) headwords; est = known + half the familiar ones
  function vocab(lang = L()) {
    const m = M[lang] || {}; let known = 0, familiar = 0;
    const cur = L();
    // (level() reads the current language; count another language's by its raw numbers)
    for (const id in m) {
      const lv = lang === cur ? level(id) : (m[id].u >= 2 ? 3 : (m[id].r >= 5 ? 2 : 1));
      if (lv >= 3) known++; else if (lv === 2) familiar++;
    }
    // Mimo's words that have no headword yet still count
    if (lang === cur && typeof LEX !== 'undefined') {
      const p = pack(lang), linked = new Set();
      if (p && p.entries) for (const e of p.entries.values()) if (e.lex) linked.add(e.lex);
      for (const id of LEX.ids()) { const it = LEX.item(id); if (!it || it.kind === 'phrase' || it.kind === 'number' || linked.has(id)) continue; if (LEX.st(id).stage >= LEX.STAGE.KNOWN) known++; }
    }
    return { known, familiar, est: Math.round(known + familiar / 2) };
  }

  // ------------------------------------------------------------ how it's going (for the level page)
  // LOG[lang][skill] = recent results, newest last: { b: the band asked (1..4), s: score 0..1 (S 1, A .85, B .7, C .5, D .2), t }
  // skills: 'talk' (an answer in free talk), 'read' (a book's questions or retelling), 'listen' (the radio, overheard talk, voice notes),
  // 'write' (EX1, DESIGN.md 21.2: a piece of writing, from the Academy's exams, later pen pals; a save without any has the same
  // numbers as before). n: how many results this one counts as (1–5; an exam's writing task counts 3: it has three points)
  let LOG = {};
  const GRADE_SCORE = { S: 1, A: 0.85, B: 0.7, C: 0.5, D: 0.2 };
  function log(skill, band, score, n = 1) {
    if (typeof score === 'string') score = GRADE_SCORE[score] != null ? GRADE_SCORE[score] : 0;
    const l = LOG[L()] || (LOG[L()] = {}); const a = l[skill] || (l[skill] = []);
    const k = Math.max(1, Math.min(5, n | 0 || 1));
    for (let i = 0; i < k; i++) a.push({ b: Math.max(1, Math.min(4, band | 0 || 1)), s: Math.max(0, Math.min(1, +score || 0)), t: now() });
    while (a.length > 60) a.shift();
  }
  // A skill's estimated band (0..4): the highest band where your last 5+ results there (or above) average 0.7 or better.
  function skillBand(skill, lang = L()) {
    const a = ((LOG[lang] || {})[skill] || []);
    let best = 0;
    for (let b = 1; b <= 4; b++) {
      const r = a.filter(x => x.b >= b).slice(-8);
      if (r.length >= 5 && r.reduce((s, x) => s + x.s, 0) / r.length >= 0.7) best = b;
    }
    return best;
  }
  // words → band. (The cleanup pass, 2026-11-20: was 80 / 400 / 1,000 / 2,000, which called 400 words "A2" and 1,000 "B1".)
  // Common rule-of-thumb sizes are about A1 500, A2 1,000, B1 2,000, B2 4,000 words. This estimate only counts the words you've
  // shown the game (used right, or Mimo's; met in context counts half), which is less than what you actually know, so the steps
  // sit below those sizes, but not far: A1 200, A2 650, B1 1,500, B2 3,000. (The packs have about 1,700–2,150 headwords now, so
  // B2 by words waits for the 4,000; the overall level can still reach B2 through your answers.) Nothing locks on these: free
  // talk's ranks also take Mimo's words (talk.js LEX_STEPS), whichever is higher.
  const WORD_STEPS = [0, 200, 650, 1500, 3000];
  function wordBand(lang = L()) { const v = vocab(lang).est; let b = 0; for (let i = 1; i < WORD_STEPS.length; i++) if (v >= WORD_STEPS[i]) b = i; return b; }
  // overall: never more than one step above your vocabulary, and pulled toward the skills you've actually shown
  // (write: EX1's fourth skill; a skill you haven't shown (0) doesn't count, so a save with no writing yet keeps its old level)
  function overallOf(words, talk, read, listen, write = 0) {
    const shown = [talk, read, listen, write].filter(b => b > 0);
    const skills = shown.length ? Math.round(shown.reduce((s, b) => s + b, 0) / shown.length) : words;
    return Math.min(words + 1, Math.max(Math.min(words, skills), Math.round((words + skills) / 2)));
  }
  function bands(lang = L()) {
    const words = wordBand(lang), talk = skillBand('talk', lang), read = skillBand('read', lang), listen = skillBand('listen', lang), write = skillBand('write', lang);
    return { words, talk, read, listen, write, overall: overallOf(words, talk, read, listen, write), vocab: vocab(lang), next: WORD_STEPS[Math.min(4, words + 1)] };
  }
  // How far your overall level is from the next one (the level page's and the journal's bar): the words that would lift it, from
  // where your words' band starts. { level, next, have, need, lo, pct (0..1), via: 'words' | 'answers' (only better answers can,
  // at the words' top) | 'top' (B2), also (true: better answers would lift it too) }
  function progress(lang = L()) {
    const b = bands(lang), have = b.vocab.est;
    if (b.overall >= 4) return { level: 4, next: 4, have, need: have, lo: 0, pct: 1, via: 'top', also: false };
    let w = -1; for (let x = b.words + 1; x <= 4; x++) if (overallOf(x, b.talk, b.read, b.listen, b.write) > b.overall) { w = x; break; }
    const shown = [b.talk, b.read, b.listen, b.write].filter(x => x > 0), behind = shown.length > 0 && Math.round(shown.reduce((s, x) => s + x, 0) / shown.length) < b.words;
    if (w < 0) return { level: b.overall, next: b.overall + 1, have, need: null, lo: 0, pct: 1, via: 'answers', also: true };
    const lo = WORD_STEPS[b.words], need = WORD_STEPS[w];
    return { level: b.overall, next: b.overall + 1, have, need, lo, pct: Math.max(0, Math.min(1, (have - lo) / Math.max(1, need - lo))), via: 'words', also: behind };
  }

  // ------------------------------------------------------------ saving (through LEX.toJSON / fromJSON)
  const toJSON = () => ({ M, LOG });
  function fromJSON(o) {
    M = Object.assign({ es: {}, pt: {}, de: {}, zh: {}, ja: {} }, (o && o.M) || {});
    LOG = Object.assign({}, (o && o.LOG) || {});
  }
  function reset() { M = { es: {}, pt: {}, de: {}, zh: {}, ja: {} }; LOG = {}; }

  return {
    LANGS, BANDS, register, pack, ready, size,
    entry, find, tokens, analyze, check, gloss, inflect, tagged,
    met, metAll, level, coverage, vocab, st,
    log, skillBand, wordBand, bands, progress, overallOf, GRADE_SCORE, WORD_STEPS,
    toJSON, fromJSON, reset,
    get lang() { return L(); },
  };
})();
