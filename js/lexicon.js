'use strict';
// The language engine (v1). It keeps the language track separate from the story track
// (DESIGN.md 7.10). Every word or pattern is an item with its own memory state; the pace
// controller decides how fast new items may arrive, from how you're actually doing.
//
// Item ids: words use 'w.<key>' (w.tree), battle words follow the grey-box scheme
// (v.jump, a.red, n.beetle). Battle code registers its own items with LEX.register().

const LEX = (() => {
  const items = {};
  const STAGE = { NEW: 0, SEEN: 1, LEARNING: 2, KNOWN: 3, MASTERED: 4 };
  let lang = 'es';
  let S = { es: {}, pt: {}, de: {}, zh: {}, ja: {} };          // learner state per language: id -> state
  let W = { es: [], pt: [], de: [], zh: [], ja: [] };          // recent attempts per language (rolling window)
  const now = () => Date.now() / 1000;
  // zh / ja (CJK.md): items hold the notation ([苹果|píng guǒ], [猫|ねこ]); form() gives it as plain text in the mode
  // (苹果 or píngguǒ), src() the notation itself (for CJK.html's ruby), and typed answers go through CJK.canon.
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK(lang);
  const has = id => !!(items[id] && items[id][lang]);
  function src(id, o = {}) {
    const it = items[id]; if (!it) return id;
    if (!isC()) return form(id, o);
    return (o.pl && it.pl && it.pl[lang]) || (o.f && it.f && it.f[lang]) || it[lang] || it.en || id;
  }

  function register(list) { list.forEach(it => { items[it.id] = it; }); }
  function st(id) {
    const L = S[lang];
    return L[id] || (L[id] = { stage: 0, str: 0, due: 0, seen: 0, ok: 0, bad: 0, hints: 0, last: 0, intro: 0 });
  }
  const item = id => items[id];
  // The word in the current language. o.article adds the article ("el árbol", "o pássaro", "der Baum").
  function form(id, o = {}) {
    const it = items[id]; if (!it) return id;
    if (isC()) return CJK.plain(src(id, o), { lang, cap: false });      // (a word, not a sentence: no capital, like «manzana»)
    const w = o.pl && it.pl ? it.pl[lang] : it[lang];
    if (!o.article || !it.g) return w;
    if (it.art && it.art[lang]) return it.art[lang] + ' ' + w;   // e.g. "el agua"
    const A = { es: { m: 'el', f: 'la' }, pt: { m: 'o', f: 'a' }, de: { m: 'der', f: 'die', n: 'das' } }[lang];
    return (A[it.g[lang]] || '') + ' ' + w;
  }
  function accepted(id) {
    const it = items[id]; if (!it) return [];
    if (isC()) return [it[lang]].concat((it.alt && it.alt[lang]) || [], (it.pl && it.pl[lang]) || []).filter(Boolean);
    const w = it[lang], list = [w];
    if (it.g) {
      const g = it.g[lang];
      const arts = { es: { m: ['el', 'un'], f: ['la', 'una', 'el'] }, pt: { m: ['o', 'um'], f: ['a', 'uma'] }, de: { m: ['der', 'ein'], f: ['die', 'eine'], n: ['das', 'ein'] } }[lang][g] || [];
      arts.forEach(a => list.push(a + ' ' + w));
    }
    (it.alt && it.alt[lang] || []).forEach(a => list.push(a));
    return list;
  }
  // Is this typed text the word? Ignores accents, case and an article. Returns the exact form too,
  // so the game can show the right spelling back ("maca" → "maçã").
  function check(id, text) {
    if (isC()) {            // zh / ja: tones, macrons, kana vs kanji, Hepburn vs wāpuro don't matter (CJK.canon)
      const n = CJK.canon(text, lang);
      if (!n) return { ok: false, empty: !String(text == null ? '' : text).trim() };
      const forms = accepted(id);
      if (forms.some(f => CJK.same(text, f, lang))) return { ok: true, exact: form(id) };
      return { ok: false, close: forms.some(f => { const k = CJK.canon(f, lang); return k.length > 4 && lev(n, k) === 1; }) };
    }
    const n = norm(text);
    if (!n) return { ok: false, empty: true };
    const ok = accepted(id).some(a => norm(a) === n);
    if (ok) return { ok: true, exact: form(id) };
    // one letter off on a longer word: close, but not accepted for teaching
    const w = norm(form(id));
    const close = w.length > 4 && lev(n.split(' ').pop(), w) === 1;
    return { ok: false, close };
  }
  // The accepted form you typed, spelled properly and without its article ("seta" for w.mushroom,
  // "árbol" for "el arbol"), or null.
  function matchForm(id, text) {
    if (isC()) { const a = accepted(id).find(f => CJK.same(text, f, lang)); return a ? CJK.plain(a, { lang, cap: false }) : null; }
    const n = norm(text); const a = accepted(id).find(x => norm(x) === n); return a ? a.split(' ').pop() : null;
  }
  // Tell Mimo: does a typed sentence use this word anywhere? (es / pt / de: any word of it passes check.) zh / ja, which
  // don't put spaces between words, look through it unit by unit (CJK.typed / matchAt): characters typed are compared as
  // characters (大 is not 打, though both are «da»); pinyin by syllable, tones optional, and a tone typed wrong still counts
  // (info.tone: the right one, for a note) unless another word Mimo could know has the tones typed (dà is 大 big, not 打 hit),
  // like the battle parser; kana or rōmaji may spell a word written with kanji, but other kanji don't (売って isn't 打って).
  function heard(id, text, info) {
    if (!isC()) return norm(text).replace(/[^a-z0-9ßäöü\s]/g, ' ').split(/\s+/).filter(Boolean).some(w => check(id, w).ok);
    if (!CJK.typed) return accepted(id).some(f => CJK.contains(text, f, lang));
    const { U, marks } = CJK.typed(text, lang);
    let slip = null;
    for (const f of accepted(id)) {
      const w = CJK.wordOf(f, lang);
      for (let i = 0; i < U.length; i++) {
        const m = CJK.matchAt(w, U, i, lang);
        if (!m || marks.slice(i + 1, m.j).some(Boolean)) continue;
        if (!m.toneBad) { if (info) delete info.tone; return true; }
        if (!slip && !toneElsewhere(id, U.slice(i, m.j))) slip = f;
      }
    }
    if (slip && info) info.tone = CJK.roman(slip, { lang, cap: false });
    return !!slip;
  }
  // zh: another word (not this one) with these syllables and the tones typed: dà → 大 (a.big), so not 打 (v.hit)
  let zhWords = null, zhWordsN = -1;
  function toneElsewhere(id, U) {
    const ids = Object.keys(items);
    if (!zhWords || zhWordsN !== ids.length) {
      zhWords = new Map(); zhWordsN = ids.length;
      for (const k of ids) {
        const it = items[k];
        if (!it || !it.zh) continue;
        for (const f of [it.zh].concat((it.alt && it.alt.zh) || [])) {
          const w = CJK.wordOf(f, 'zh'), key = w.syl.join(' ');
          if (!key) continue;
          let a = zhWords.get(key); if (!a) zhWords.set(key, a = []);
          a.push({ id: k, w });
        }
      }
    }
    return (zhWords.get(U.map(u => u.syl).join(' ')) || []).some(x => x.id !== id && U.every((u, k) => !(u.toneTyped && u.tone) || u.tone === x.w.tone[k]));
  }
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  // ------------------------------------------------------------ memory model
  function expose(id) {
    if (isC() && !has(id)) return;        // (zh / ja: a word with no text in the language yet is never "seen", so never asked)
    const s = st(id);
    if (s.stage < STAGE.SEEN) { s.stage = STAGE.SEEN; s.intro = now(); }
    s.last = now();
  }
  // Speed is judged by word length: a moment to think, then time to type each letter. So long
  // words and slow typists don't look like slow learning.
  const quickMs = len => 2200 + 350 * len, slowMs = len => 5000 + 900 * len;
  function lenOf(id) {
    if (isC()) return Math.max(3, CJK.canon(src(id), lang).length) + (CJK.mode(lang) === 'chars' ? 2 : 0);   // (letters typed, plus a pick)
    const f = form(id); return typeof f === 'string' && f ? Math.max(3, f.replace(/\s+/g, '').length) : 5;
  }
  // One retrieval attempt. mode: 'teach' | 'review' | 'command' | 'echo' | 'learn' | 'talk'
  function attempt(id, { ok, hints = 0, ms = 4000, mode = 'review' } = {}) {
    const s = st(id), t = now(), len = lenOf(id);
    const away = t - (s.last || 0), fresh = !s.ok && !s.bad;   // seconds since you last saw it; first time asked
    s.seen++; s.last = t; s.hints += hints;
    const quick = ms <= quickMs(len);
    if (ok && hints === 0) {
      s.ok++;
      s.str = s.str ? s.str * (quick ? 2.6 : 2.0) : (quick ? 90 : 45);   // seconds until the next look
      if (s.stage < STAGE.LEARNING) s.stage = STAGE.LEARNING;
      if (s.ok >= 2 && s.stage < STAGE.KNOWN) s.stage = STAGE.KNOWN;
      // Right the first time you're asked, quickly, with no hints, and not something you saw a
      // moment ago: you already have this word. Knew it before, or picked it up from one glimpse:
      // the game treats both the same and counts it as known (DESIGN.md 12.8).
      if (fresh && quick && away > 90 && mode !== 'echo' && mode !== 'learn' && s.stage < STAGE.KNOWN) { s.stage = STAGE.KNOWN; s.str = Math.max(s.str, 600); s.knew = true; }
      if (s.str > 3 * 86400 && s.ok >= 4) s.stage = STAGE.MASTERED;
    } else if (ok) {
      s.str = Math.max(30, (s.str || 30) * 1.15);
      if (s.stage < STAGE.LEARNING) s.stage = STAGE.LEARNING;
    } else {
      s.bad++;
      s.str = Math.max(20, (s.str || 20) * 0.5);
      if (s.stage > STAGE.LEARNING) s.stage = STAGE.LEARNING;
    }
    s.due = t + s.str;
    const win = W[lang];
    win.push({ ok: ok && hints === 0, hinted: hints > 0, ms, len, mode, t });
    if (win.length > 24) win.shift();
  }

  // You didn't know it, so the game showed you the word and you typed it in (DESIGN.md 12.6). Mimo
  // has it now (LEARNING), it comes back for a review soon, and the pace controller counts a miss,
  // so the game knows to slow down (that's the level test working).
  function learnt(id) {
    attempt(id, { ok: false, hints: 3, ms: 15000, mode: 'learn' });
    const s = st(id);
    if (s.stage < STAGE.LEARNING) s.stage = STAGE.LEARNING;
    s.str = 30; s.due = now() + 30;
  }

  // ------------------------------------------------------------ the pace controller
  // How you're doing lately, as one number: about 0.5 (slow down) to 2 (bring it on).
  function pace() {
    const win = W[lang];
    if (win.length < 3) return 1;
    const acc = win.filter(a => a.ok).length / win.length;
    // speed relative to the word's length: below 1 is quicker than "quick", above 1 slower than "slow"
    const fast = win.reduce((a, b) => a + b.ms / quickMs(b.len || 6), 0) / win.length;
    const slow = win.reduce((a, b) => a + b.ms / slowMs(b.len || 6), 0) / win.length;
    let p = acc >= 0.9 ? 1.6 : acc >= 0.78 ? 1.15 : acc >= 0.6 ? 0.8 : 0.55;
    if (acc >= 0.9 && fast < 0.85) p += 0.4;
    if (slow > 1) p -= 0.15;
    return clamp(p, 0.5, 2);
  }
  // Words you've started but not yet got (the working set). Slower learners get a smaller one,
  // so the game reviews before it adds more.
  // the working set: words being learned right now (numbers from the shops don't count: they'd crowd out new words)
  // (slang, swears and set expressions are kind 'phrase': learned on the side, so they neither fill Mimo's working set
  // nor push the weave toward whole sentences in the language; numbers don't fill the working set either)
  const isPhrase = id => !!(items[id] && items[id].kind === 'phrase');
  const open = () => Object.keys(S[lang]).filter(id => S[lang][id].stage === STAGE.LEARNING && !(items[id] && (items[id].kind === 'number' || items[id].kind === 'phrase'))).length;
  const limit = () => Math.round(3 + 2.5 * pace());
  const mayIntroduce = () => open() < limit();
  function due(n = 5) {
    const t = now();
    return Object.keys(S[lang]).filter(id => S[lang][id].stage >= STAGE.LEARNING && S[lang][id].due <= t)
      .sort((a, b) => S[lang][a].due - S[lang][b].due).slice(0, n);
  }
  const taughtList = () => Object.keys(S[lang]).filter(id => S[lang][id].stage >= STAGE.LEARNING && items[id]);
  // The weave (DESIGN.md 12.4, reworked in 14.8): how much of what people say is in the language, 0 to 1.
  // weaveTarget() follows the evidence: words you've taught Mimo and kept, words that passed a spot check, and your pace
  // (only once there are enough attempts to judge it). weave(), what the lines use, walks toward the target slowly
  // (tick, every frame you play): at most +0.01 a minute, so one quick «manzana» can't flip the game into the language.
  //   taught words are always in the language; words you've only seen come in a few at a time (admitted), glossed at first
  //   from about 0.48 a growing share of lines (the same ones each time) are whole sentences in the language with the
  //   English under them, and by 0.70 all of them; from 0.92 the English only on request
  let SW = { es: null, pt: null, de: null, zh: null, ja: null };      // the weave the lines use, per language (saved with the rest)
  function weaveTarget() {
    const n = W[lang].length, p = 1 + (pace() - 1) * Math.min(1, n / 12);     // (pace counts fully after 12 attempts)
    let taught = 0, known = 0, checked = 0;
    for (const id in S[lang]) {
      if (!items[id] || isPhrase(id) || items[id].kind === 'number') continue;
      const s = S[lang][id];
      if (s.stage >= STAGE.LEARNING) taught++;
      if (s.stage >= STAGE.KNOWN) known++;
      if (s.chk > 0 && s.stage < STAGE.LEARNING) checked++;      // (a woven word you showed you understood)
    }
    return clamp(0.02 + (p - 1) * 0.1 + taught * 0.016 + known * 0.014 + checked * 0.012, 0, 1);
  }
  function weave() { const s = SW[lang]; return typeof s === 'number' ? s : Math.min(weaveTarget(), 0.2); }
  // Words you've only seen (not taught) come into the English lines a few at a time: the budget grows with the weave,
  // the oldest-seen word first. A spot check you miss sends a word back to English for a while.
  const admitBudget = () => Math.floor(weave() * 30);
  const admittable = id => { const it = items[id], s = S[lang][id]; return it && s && (it.kind === 'word' || !it.kind) && /^w\./.test(id) && s.stage === STAGE.SEEN && !s.adm && (s.noAdm || 0) < now(); };
  let admitT = 0;
  function tick(dt) {
    const t = weaveTarget(); let s = SW[lang];
    if (typeof s !== 'number') s = Math.min(t, 0.2);     // (a new game starts near nothing; an older save at most a fifth of the way)
    s = t > s ? Math.min(t, s + dt * 0.01 / 60) : Math.max(t, s - dt * 0.03 / 60);
    SW[lang] = s;
    if ((admitT -= dt) > 0) return;
    admitT = 8;                                            // (look every 8 s of play: one word at a time)
    const L = S[lang], have = Object.keys(L).filter(id => L[id].adm && L[id].stage < STAGE.LEARNING).length;
    if (have >= admitBudget()) return;
    const next = Object.keys(L).filter(admittable).sort((a, b) => (L[a].intro || 0) - (L[b].intro || 0))[0];
    if (next) L[next].adm = true;
  }
  // a woven word may show in the language (taught words always do: see ui.js slotMode)
  const admitted = id => { const s = S[lang][id]; return !!(s && s.adm); };
  // Spot checks (DESIGN.md 14.8): now and then the game asks about a word it has been weaving in, to see if it's really
  // landed: one that's been woven at least 3 times and not checked in the last 10 minutes. ok counts toward the weave;
  // a miss sends the word back to English for 10 minutes and nudges the weave down a little.
  function checkDue() {
    const L = S[lang], t = now();
    const c = Object.keys(L).filter(id => { const s = L[id]; return s.adm && s.stage === STAGE.SEEN && (s.wv || 0) >= 3 && (s.chkAt || 0) < t - 600 && items[id]; });
    return c.length ? c[Math.floor(Math.random() * c.length)] : null;
  }
  function checkResult(id, ok) {
    const s = st(id); s.chkAt = now();
    if (ok === null) return;                       // (skipped: no harm, asked again another time)
    if (ok) { s.chk = (s.chk || 0) + 1; return; }
    s.chk = 0; s.adm = false; s.noAdm = now() + 600; s.wv = 0;
    if (typeof SW[lang] === 'number') SW[lang] = Math.max(0, SW[lang] - 0.02);
  }
  // How many times a word has been woven into a line (its small English gloss shows the first few times).
  const wv = id => st(id).wv || 0;
  function woven(id) { const s = st(id); s.wv = (s.wv || 0) + 1; expose(id); }
  // A rough level for picking how hard a line or a battle should be: 1 (just starting) to 3.
  function tier() {
    const known = Object.keys(S[lang]).filter(id => S[lang][id].stage >= STAGE.KNOWN && !isPhrase(id)).length;     // (slang doesn't make the lines harder)
    const p = pace();
    if (known >= 14 || (known >= 8 && p >= 1.5)) return 3;
    if (known >= 5 || (known >= 3 && p >= 1.4)) return 2;
    return 1;
  }

  return {
    STAGE, register, item, form, src, has, accepted, matchForm, check, heard, expose, attempt, learnt, pace, open, limit, mayIntroduce, due, tier, weave, wv, woven,
    weaveTarget, tick, admitted, checkDue, checkResult, ids: () => Object.keys(items),
    get lang() { return lang; }, set lang(l) { lang = l; if (!S[l]) S[l] = {}; if (!W[l]) W[l] = []; },
    st, seen: id => st(id).stage >= STAGE.SEEN, taught: id => st(id).stage >= STAGE.LEARNING, taughtList,
    knownCount: () => Object.values(S[lang]).filter(s => s.stage >= STAGE.KNOWN).length,
    // (C: the characters you know in zh / ja, CJK's mastery, saved per save)
    // (D: the dictionary's side, DICT (dict/dict.js): every headword you've read, heard, looked up or used, and the level log)
    toJSON: () => ({ S, W, SW, C: typeof CJK !== 'undefined' ? CJK.toJSON() : undefined, D: typeof DICT !== 'undefined' ? DICT.toJSON() : undefined }),
    fromJSON(o) {
      if (o && o.S) { S = Object.assign({ es: {}, pt: {}, de: {}, zh: {}, ja: {} }, o.S); W = Object.assign({ es: [], pt: [], de: [], zh: [], ja: [] }, o.W || {}); SW = Object.assign({ es: null, pt: null, de: null, zh: null, ja: null }, o.SW || {}); }
      if (typeof CJK !== 'undefined') CJK.fromJSON(o && o.C);
      if (typeof DICT !== 'undefined') DICT.fromJSON(o && o.D);
    },
    reset() { S = { es: {}, pt: {}, de: {}, zh: {}, ja: {} }; W = { es: [], pt: [], de: [], zh: [], ja: [] }; SW = { es: null, pt: null, de: null, zh: null, ja: null }; if (typeof CJK !== 'undefined') CJK.reset(); if (typeof DICT !== 'undefined') DICT.reset(); },
    // tests: set the weave the lines use right away (skipping the slow walk)
    _setWeave(v) { SW[lang] = v; },
    // tests: pretend to be a faster or slower learner
    _simulate(id, ok, ms, hints = 0) { attempt(id, { ok, ms, hints, mode: 'sim' }); },
  };
})();
