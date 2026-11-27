'use strict';
// LATIN: the engine under the es, pt and de dictionary packs (FLUENT.md; DESIGN.md 15.2). Loaded right after dict.js
// and before es.js / pt.js / de.js. Nothing runs at load: each pack calls LATIN.build(spec) inside its DICT.register
// maker, so a game only pays for its own language.
//
// A spec gives the word list (compact lines, below), the language's morphology (every form of a headword) and its
// grammar checks. This file does the rest: the form index, tokens, the analysis, glosses, fixes, inflect and find,
// plus the checks Spanish and Portuguese share (ROM, at the end).
//
// Word lists: one headword per line, in template strings, parsed in make():
//   @2 food,shop           the band (1 A1 · 2 A2 · 3 B1 · 4 B2) and the tags of the lines after it
//   lemma|code|en|extras   code: the part of speech and the morphology class (each pack reads its own codes)
//                          en: the English; for nouns with a feminine form «brother/sister» (masculine/feminine)
//                          extras, space-separated: pl:… f:… alt:a,b lex:w.id + or - (val: good or bad) and pack flags
//   A lemma «mañana#n» makes the id «es:mañana#n» (two headwords with one spelling).
//
// Readings: every form of every headword is indexed under its key (lower case, no accents: «comí» → «comi»).
// A word typed is looked up by key, then the exact spelling decides: a reading spelled differently is an accent slip
// (minor). Each word keeps all its readings (w._r) and the analysis picks one by context (disambiguate).

const LATIN = (() => {
  // ------------------------------------------------------------ text
  const FOLD = {};
  [['a', 'áàâãäåā'], ['e', 'éèêëē'], ['i', 'íìîïī'], ['o', 'óòôõöō'], ['u', 'úùûüū'], ['n', 'ñ'], ['c', 'ç'], ['y', 'ýÿ']]
    .forEach(([to, from]) => { for (const c of from) FOLD[c] = to; });
  FOLD['ß'] = 'ss'; FOLD['’'] = "'"; FOLD['`'] = "'"; FOLD['´'] = "'"; FOLD['ı'] = 'i';
  const NONASCII = /[^\x00-\x7f]/g;
  const fold1 = c => { const m = FOLD[c]; return m === undefined ? c : m; };
  // the index key: lower case, no accents (ñ → n, ç → c, ß → ss)
  function key(s) {
    s = String(s == null ? '' : s).toLowerCase();
    return s.replace(NONASCII, fold1);
  }
  // a spelling compared exactly, but without case (and ß = ss: the Swiss spelling is right too)
  const low = s => String(s).toLowerCase().replace(/ß/g, 'ss').replace(/[’`´]/g, "'");
  const capF = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const isCap = s => !!s && s.charAt(0) !== s.charAt(0).toLowerCase();
  const uniq = a => [...new Set(a)];
  // give a word the capital of the one it replaces («Comí» → «Fui»)
  const likeCase = (w, model) => (isCap(model) ? capF(w) : w);

  // ------------------------------------------------------------ English (for glosses: «comí: I ate»)
  const EN = (() => {
    const IRR = {};
    ('arise arose arisen|awake awoke awoken|be was been|bear bore born|beat beat beaten|become became become|begin began begun|' +
     'bend bent bent|bet bet bet|bite bit bitten|bleed bled bled|blow blew blown|break broke broken|bring brought brought|' +
     'build built built|burn burned burned|buy bought bought|catch caught caught|choose chose chosen|come came come|cost cost cost|' +
     'cut cut cut|deal dealt dealt|dig dug dug|do did done|draw drew drawn|dream dreamed dreamed|drink drank drunk|drive drove driven|' +
     'eat ate eaten|fall fell fallen|feed fed fed|feel felt felt|fight fought fought|find found found|fly flew flown|forbid forbade forbidden|' +
     'forget forgot forgotten|forgive forgave forgiven|freeze froze frozen|get got gotten|give gave given|go went gone|grow grew grown|' +
     'hang hung hung|have had had|hear heard heard|hide hid hidden|hit hit hit|hold held held|hurt hurt hurt|keep kept kept|know knew known|' +
     'lay laid laid|lead led led|leave left left|lend lent lent|let let let|lie lay lain|light lit lit|lose lost lost|make made made|' +
     'mean meant meant|meet met met|pay paid paid|put put put|quit quit quit|read read read|ride rode ridden|ring rang rung|rise rose risen|' +
     'run ran run|say said said|see saw seen|seek sought sought|sell sold sold|send sent sent|set set set|shake shook shaken|shine shone shone|' +
     'shoot shot shot|show showed shown|shut shut shut|sing sang sung|sink sank sunk|sit sat sat|sleep slept slept|slide slid slid|' +
     'speak spoke spoken|spend spent spent|spin spun spun|spread spread spread|stand stood stood|steal stole stolen|stick stuck stuck|' +
     'sting stung stung|strike struck struck|swear swore sworn|sweep swept swept|swim swam swum|swing swung swung|take took taken|' +
     'teach taught taught|tear tore torn|tell told told|think thought thought|throw threw thrown|understand understood understood|' +
     'wake woke woken|wear wore worn|win won won|write wrote written|upset upset upset|overcome overcame overcome|undo undid undone|' +
     'withdraw withdrew withdrawn|bring brought brought|fit fit fit|shed shed shed|spit spat spat|weep wept wept|bind bound bound|' +
     'feed fed fed|flee fled fled|grind ground ground|kneel knelt knelt|leap leapt leapt|slay slew slain|stink stank stunk|tread trod trodden')
      .split('|').forEach(x => { const [a, b, c] = x.split(' '); IRR[a] = [b, c]; });
    const DBL = new Set(['begin', 'forget', 'prefer', 'admit', 'occur', 'permit', 'regret', 'refer', 'commit', 'control', 'upset', 'equip', 'compel']);
    const dbl = w => DBL.has(w) || (/^[^aeiou]*[aeiou][^aeiouwxy]$/.test(w) && w.length <= 4);
    function s3(w) {
      if (w === 'be') return 'is'; if (w === 'have') return 'has';
      if (/(s|x|z|ch|sh|o)$/.test(w)) return w + 'es';
      if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ies';
      return w + 's';
    }
    function ing(w) {
      if (w === 'be' || w === 'see' || w === 'flee' || w === 'agree') return w + 'ing';
      if (/ie$/.test(w)) return w.slice(0, -2) + 'ying';
      if (/[^aeiouy]e$/.test(w) || /ue$/.test(w)) return w.slice(0, -1) + 'ing';
      if (dbl(w)) return w + w.slice(-1) + 'ing';
      return w + 'ing';
    }
    function past(w) {
      if (IRR[w]) return IRR[w][0];
      if (/e$/.test(w)) return w + 'd';
      if (/[^aeiou]y$/.test(w)) return w.slice(0, -1) + 'ied';
      if (dbl(w)) return w + w.slice(-1) + 'ed';
      return w + 'ed';
    }
    const pp = w => (IRR[w] ? IRR[w][1] : past(w));
    // the first sense, without notes: «think, believe» → «think»; «be (state, place)» → «be»; «to go» → «go»
    // (the notes go first: a note with a comma, «know (a person, a place); meet», gave «know (a person»)
    const first = en => String(en || '').replace(/\(.*?\)/g, '').split(/[;,]/)[0].replace(/^\s*to /, '').trim();
    const SUBJ = { '1s': 'I', '2s': 'you', '3s': 'he/she', '1p': 'we', '2p': 'you all', '3p': 'they' };
    const BE = { pres: { '1s': 'am', '3s': 'is' }, past: { '1s': 'was', '3s': 'was' } };
    // the verb's gloss in a form: verb('eat', { tense: 'past', mood: 'ind', person: 1, number: 's' }) → 'I ate'
    function verb(en, f) {
      const v = first(en); if (!v) return '';
      const sp = v.indexOf(' '), head = sp < 0 ? v : v.slice(0, sp), rest = sp < 0 ? '' : v.slice(sp);
      const pn = f.person ? f.person + (f.number || 's') : '';
      const S = pn ? (f.formal ? 'you' : SUBJ[pn]) : '';
      const be = head === 'be';
      if (f.form === 'inf') return 'to ' + v;
      if (f.form === 'ger') return ing(head) + rest;
      if (f.form === 'part') return pp(head) + rest;
      if (f.mood === 'imp') return capF(v) + '!';
      if (f.mood === 'subj') {
        if (f.tense === 'impf') return '(if) ' + S + ' ' + (be ? 'were' : past(head)) + rest;
        if (f.tense === 'fut') return '(when, if) ' + S + ' ' + (be ? (pn === '1s' ? 'am' : pn === '3s' ? 'is' : 'are') : pn === '3s' ? s3(head) : head) + rest;
        return '(that) ' + S + ' ' + (be ? 'be' : head) + rest;
      }
      if (f.tense === 'past') return S + ' ' + (be ? (BE.past[pn] || 'were') : past(head)) + rest;
      if (f.tense === 'impf') return S + ' ' + (be ? (BE.past[pn] || 'were') : 'used to ' + head) + rest;
      if (f.tense === 'fut') return S + ' will ' + head + rest;
      if (f.tense === 'cond') return S + ' would ' + head + rest;
      if (f.tense === 'perf') return S + ' ' + (pn === '3s' ? 'has ' : 'have ') + pp(head) + rest;
      return S + ' ' + (be ? (BE.pres[pn] || 'are') : pn === '3s' ? s3(head) : head) + rest;
    }
    const PL = { man: 'men', woman: 'women', child: 'children', person: 'people', foot: 'feet', tooth: 'teeth', mouse: 'mice', fish: 'fish',
      sheep: 'sheep', deer: 'deer', knife: 'knives', wife: 'wives', life: 'lives', leaf: 'leaves', half: 'halves', wolf: 'wolves', shelf: 'shelves',
      thief: 'thieves', potato: 'potatoes', tomato: 'tomatoes', hero: 'heroes', series: 'series', news: 'news', police: 'police', people: 'people' };
    function plural(en) {
      const v = first(en); if (!v) return '';
      const m = /^(.*?)(\S+)(\s+(?:of|in|on|for|with)\s.*)?$/.exec(v);
      const pre = m[1], w = m[2], post = m[3] || '';
      let p = PL[w.toLowerCase()];
      if (!p) {
        if (/(s|x|z|ch|sh)$/.test(w)) p = /(ss|es|ics)$/.test(w) || !/s$/.test(w) ? w + 'es' : w;
        else if (/[^aeiou]y$/.test(w)) p = w.slice(0, -1) + 'ies';
        else p = w + 's';
      }
      return pre + p + post;
    }
    return { verb, plural, past, pp, ing, s3, first, SUBJ };
  })();

  // ------------------------------------------------------------ features
  // A reading's features are shared objects made from short keys: 'past.ind.1s', 'imp.2s.fo' (usted), 'part.f.p',
  // 'n.p', 'a.f.s', 'art.m.s.acc' … (only the parts that apply). FLUENT.md's names: person, number, tense, mood, form,
  // gender, case, formal (+ vos for Spanish voseo, sep for a German separable verb's particle).
  const FC = new Map();
  const TENSES = new Set(['pres', 'past', 'impf', 'perf', 'fut', 'cond', 'plpf']), MOODS = new Set(['ind', 'subj', 'imp']);
  const FORMS = new Set(['inf', 'ger', 'part', 'pinf', 'zu']), CASES = new Set(['nom', 'acc', 'dat', 'gen']);
  function feat(k) {
    let f = FC.get(k);
    if (f) return f;
    f = {};
    for (const p of String(k).split('.')) {
      if (!p) continue;
      if (TENSES.has(p)) f.tense = p;
      else if (MOODS.has(p)) f.mood = p;
      else if (FORMS.has(p)) f.form = p;
      else if (CASES.has(p)) f.case = p;
      else if (/^[123][sp]$/.test(p)) { f.person = +p[0]; f.number = p[1]; }
      else if (p === 's' || p === 'p') f.number = p;
      else if (p === 'm' || p === 'f' || p === 'n' || p === 'mf') f.gender = p;
      else if (p === 'fo') f.formal = true;
      else if (p === 'vo') f.vos = true;
      else if (p === 'vt') f.vosotros = true;
      else if (p === 'ap') f.apoc = true;
      else if (p === 'neg') f.neg = true;
      else if (p === 'sep') f.sep = true;
      else if (p === 'k2') { f.mood = 'subj'; f.k2 = true; }
      else if (p === 'att') f.att = true;
      else if (p === 'cmp' || p === 'sup') f.degree = p;
      else if (p === 'wk' || p === 'st' || p === 'mx') f.decl = p;
    }
    if (f.tense && !f.mood) f.mood = 'ind';
    Object.freeze(f);
    FC.set(k, f);
    return f;
  }
  const finite = f => !!(f && f.mood && !f.form);

  // ------------------------------------------------------------ word lists
  // → [{ lemma, hom (the #tag), code, en, ex: { key: value, flag: true }, band, tags }]
  function parseList(text) {
    const out = []; let band = 1, tags = [];
    for (const raw of String(text).split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('//')) continue;
      if (line[0] === '@') {
        const m = /^@(\d)\s*(.*)$/.exec(line);
        if (m) { band = +m[1]; tags = m[2] ? m[2].split(',').map(s => s.trim()).filter(Boolean) : []; }
        continue;
      }
      const p = line.split('|');
      let lemma = p[0].trim(), hom = '';
      const h = lemma.indexOf('#');
      if (h > 0) { hom = lemma.slice(h); lemma = lemma.slice(0, h); }
      const ex = {};
      for (const x of (p[3] || '').trim().split(/\s+/)) {
        if (!x) continue;
        const c = x.indexOf(':');
        if (c > 0) ex[x.slice(0, c)] = x.slice(c + 1).replace(/_/g, ' ');
        else if (x === '+' || x === '-') ex.val = x;
        else ex[x] = true;
      }
      out.push({ lemma, hom, code: (p[1] || '').trim(), en: (p[2] || '').trim(), ex, band, tags });
    }
    return out;
  }

  // ------------------------------------------------------------ tokens
  // words (letters, with inner apostrophes and hyphens: «d'água», «fazê-lo»), numbers («20», «7:30», «1.000», «3º»)
  // and single punctuation marks
  const TOKRE = /(\d+(?:[.,:]\d+)*(?:[ºª°])?)|([\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*(?:-[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*)*)|([^\s\p{L}\p{M}\d])/gu;
  function tokenize(text) {
    const out = []; const s = String(text == null ? '' : text); let m;
    TOKRE.lastIndex = 0;
    while ((m = TOKRE.exec(s))) {
      const t = m[0], tk = { t, s: m.index, e: m.index + t.length, word: !m[3] };
      if (m[1]) tk.num = numVal(t);
      if (m[3]) tk.punct = true;
      out.push(tk);
    }
    return out;
  }
  function numVal(t) {
    const d = t.replace(/[ºª°]$/, '');
    if (/^\d{1,2}:\d{2}$/.test(d)) { const [h, mi] = d.split(':'); return +h + (+mi) / 60; }
    if (/^\d{1,3}([.]\d{3})+$/.test(d)) return +d.replace(/\./g, '');
    if (/^\d+,\d+$/.test(d)) return +d.replace(',', '.');
    if (/^\d{1,3}(,\d{3})+$/.test(d)) return +d.replace(/,/g, '');
    const v = parseFloat(d.replace(',', '.'));
    return isNaN(v) ? null : v;
  }

  // ------------------------------------------------------------ first names (a capitalized one is a name, even when it's
  // also a word: «Rosa», «Esperanza»; and «Ana y Juan» is two people). The game's people are here too.
  const NAMES = new Set(('ana juan maria jose luis carlos pedro pablo jorge miguel antonio manuel francisco javier diego daniel david alejandro andres ' +
    'fernando ricardo roberto sergio raul rafael alberto eduardo enrique hector oscar mario marcos martin mateo santiago sebastian nicolas tomas gabriel ' +
    'samuel lucas hugo bruno ivan adrian alvaro ruben victor emilio ramon felipe gustavo julio cesar ernesto alfonso ignacio joaquin lorenzo guillermo ' +
    'rodrigo esteban gonzalo arturo armando lucia sofia paula laura marta carmen isabel elena pilar teresa rosa julia clara sara raquel beatriz patricia ' +
    'monica silvia cristina andrea natalia valeria camila valentina daniela gabriela mariana fernanda victoria alejandra adriana carolina diana irene ines ' +
    'lola luisa margarita gloria esperanza dolores guadalupe lupe juana josefina rocio alicia eva nuria marina noa paola ximena renata regina abril ' +
    'joao mateus thiago tiago leonardo marcelo andre luiz vinicius caio igor fabio marcio renato julio henrique arthur davi heitor bernardo enzo kaua ' +
    'juliana larissa leticia amanda bruna isabela luana alice helena manuela luiza rafaela malu dita tiao ' +
    'hans peter klaus jurgen michael thomas andreas stefan wolfgang markus christian frank uwe jan lukas leon paul felix jonas max maximilian moritz ' +
    'niklas tim tom ben finn elias noah luca lena lea lisa hannah sophie emma mia marie sabine petra monika ursula claudia katrin nina jana klara greta ' +
    'ida frieda hilde kalle fiete adi otto karl fritz heinz gunter horst ingrid helga erika jutta jens sven torsten dirk oliver ' +
    'john mary mike sam alex james emily jack anne ' +
    'mimo bartolo cande fello kaua morgana dante poe xochi lucha tona nico chago maritza toño yildiz natsu shige tetsu otoha susumu mei chen longlong ' +
    'marcos fiona vo vovo').split(' ').filter(Boolean));

  // ------------------------------------------------------------ distance (suggestions)
  const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
  function edits1(k) {
    const out = [];
    for (let i = 0; i <= k.length; i++) {
      const a = k.slice(0, i), b = k.slice(i);
      if (b) out.push(a + b.slice(1));
      if (b.length > 1) out.push(a + b[1] + b[0] + b.slice(2));
      for (const c of ALPHA) { if (b) out.push(a + c + b.slice(1)); out.push(a + c + b); }
    }
    return out;
  }
  // Levenshtein distance, giving up past max
  function dist(a, b, max = 2) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let best = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  // ------------------------------------------------------------ building a pack
  // spec (each pack's): {
  //   lang, lists: [word list texts], closed: [function-word lists, same format],
  //   entry(e, raw, P): fill e.pos, e.g … from raw.code / raw.ex; return false to skip the line
  //   forms(e, add, P): add(form, fkey) for every form of e, its lemma included (fkey: see feat)
  //   expand(tk, P): candidates for a word the index doesn't know (clitics, umlauts written out, compounds) or null
  //   prior(c) / score(c, i, W, ctx): how likely a reading is, alone / in context (the shared scoring is below)
  //   context(W, P, a): the language's own passes after the shared pick (subjects, separable verbs, periphrases…)
  //   summary(a, W, P): fill a.time, a.times, a.subject, a.clauses (the shared fields are done here)
  //   check(a, opts, P) → [error]; describe(c) → 'preterite, I'; inflect(e, f, P) → form | null; enGloss(c) (optional)
  //   connectors: [lemma], connectorKinds: { lemma: 'reason'|'contrast'|'time'|'add'|'result'|'cond'|'opinion' }, fillers
  // }
  const PUNCT_EDGE = /^[¡!¿?.,;:…"«»“”'’()\-–—\s]+|[¡!¿?.,;:…"«»“”'’()\-–—\s]+$/g;
  function build(spec) {
    const L = spec.lang;
    const P = { lang: L, spec, entries: new Map(), IX: new Map(), PH: new Map(), lemmaKeys: [], lexAuto: [], lexN: -1 };
    let nForms = 0;
    function add(e, form, fk) {
      if (!form) return;
      const r = { e, f: feat(fk || ''), w: form };
      if (form.indexOf(' ') >= 0) return addPhrase(e, form, r);
      const k = key(form);
      const a = P.IX.get(k);
      if (!a) P.IX.set(k, [r]);
      else { for (const x of a) if (x.e === e && x.f === r.f && x.w === form) return; a.push(r); }
      nForms++;
    }
    function addPhrase(e, form, r) {
      const ks = tokenize(form).filter(t => t.word).map(t => key(t.t).replace(/^'+|'+$/g, ''));
      if (!ks.length) return;
      if (ks.length === 1) { const k = ks[0]; const a = P.IX.get(k); if (!a) P.IX.set(k, [Object.assign(r, { w: form.replace(PUNCT_EDGE, '') })]); else a.push(Object.assign(r, { w: form.replace(PUNCT_EDGE, '') })); return; }
      let a = P.PH.get(ks[0]); if (!a) P.PH.set(ks[0], a = []);
      if (!a.some(x => x.e === e && x.ks.join(' ') === ks.join(' '))) { a.push({ e, ks, w: form, f: r.f }); if (a.length > 1) a.sort((x, y) => y.ks.length - x.ks.length); }
    }
    function addEntry(raw) {
      const e = { id: '', lemma: raw.lemma, pos: '', en: raw.en, band: raw.band, tags: raw.tags.slice() };
      if (raw.ex.lex) e.lex = raw.ex.lex;
      if (raw.ex.val) e.val = raw.ex.val;
      if (spec.entry && spec.entry(e, raw, P) === false) return null;
      let id = L + ':' + e.lemma + raw.hom;
      if (P.entries.has(id)) id += '#' + e.pos;
      let n = 2; const base = id; while (P.entries.has(id)) id = base + (n++);
      e.id = id;
      P.entries.set(id, e);
      return e;
    }
    P.addEntry = addEntry;
    P.add = add;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const T = P.times = {}; let t0 = now();
    for (const text of [].concat(spec.closed || [], spec.lists || [])) for (const raw of parseList(text)) addEntry(raw);
    T.parse = Math.round(now() - t0); t0 = now();
    for (const e of P.entries.values()) {
      if (e.pos === 'phrase' || e.lemma.indexOf(' ') >= 0) { add(e, e.lemma, ''); continue; }
      if (spec.forms) spec.forms(e, (form, fk) => add(e, form, fk), P);
      else add(e, e.lemma, '');
    }
    for (const e of P.entries.values()) if (e.pos !== 'phrase' && e.lemma.indexOf(' ') < 0) P.lemmaKeys.push([key(e.lemma), e]);
    P.nForms = nForms;
    T.forms = Math.round(now() - t0); t0 = now();
    linkLex(P);
    T.lex = Math.round(now() - t0);
    P.relink = () => linkLex(P);
    const api = makeApi(P);
    return api;
  }

  // Every LEX item's word in this language resolves to a headword: the headword whose lemma it is gets e.lex (a verb
  // item's command «salta» links its verb). A word that isn't in the list gets a headword of its own (auto, from the
  // item; lexAuto lists them), and so does each phrasebook phrase, so its gloss reads as a whole.
  function linkLex(P) {
    if (typeof LEX === 'undefined' || !LEX.ids) return;
    const ids = LEX.ids(); if (ids.length === P.lexN) return;
    P.lexN = ids.length;
    const L = P.lang;
    for (const id of ids) {
      const it = LEX.item(id); if (!it || !it[L]) continue;
      const words = [String(it[L])].concat((it.alt && it.alt[L]) || []);
      words.forEach((word, wi) => {
        const clean = word.replace(/…/g, ' ').replace(PUNCT_EDGE, '').trim();
        if (!clean) return;
        const toks = tokenize(clean).filter(t => t.word);
        if (toks.length > 1 || it.kind === 'phrase') {
          const ks = toks.map(t => key(t.t).replace(/^'+|'+$/g, ''));
          const ph = (P.PH.get(ks[0]) || []).find(x => x.ks.join(' ') === ks.join(' '));
          if (ph) { if (!ph.e.lex) ph.e.lex = id; return; }
          if (toks.length === 1) {
            const rs = P.IX.get(ks[0]) || [];
            const lem = rs.find(r => key(r.e.lemma) === ks[0]);
            if (lem) { if (!lem.e.lex && wi === 0) lem.e.lex = id; return; }
            if (rs.length && it.kind !== 'phrase') return;
          }
          if (wi > 0) return;
          // a phrase (or a set name, «Grano de Oro»): its own headword
          const e = P.addEntry({ lemma: clean, hom: '', code: 'phrase', en: it.en || '', ex: { lex: id }, band: it.kind === 'phrase' ? 3 : 2, tags: it.kind === 'phrase' ? [] : ['hush'] });
          if (e) { e.pos = 'phrase'; e.auto = true; P.add(e, clean, ''); }
          return;
        }
        const k = key(clean);
        const rs = P.IX.get(k) || [];
        const lem = rs.find(r => key(r.e.lemma) === k && r.e.pos !== 'phrase');
        if (lem) { if (!lem.e.lex) lem.e.lex = id; return; }
        const vb = /^v\./.test(id) || it.kind === 'verb';
        const v = vb && rs.find(r => r.e.pos === 'v');
        if (v) { if (!v.e.lex && wi === 0) v.e.lex = id; return; }
        if (rs.length || wi > 0) return;
        if (P.spec.expand) { const x = P.spec.expand({ t: clean, s: 0, e: clean.length, word: true }, P); if (x && x.length) return; }
        // not in the list: a headword from the item itself
        const g = it.g && it.g[L];
        const pos = it.kind === 'number' ? 'num' : /^a\./.test(id) ? 'adj' : /^p\./.test(id) ? 'adv' : vb ? 'int' : it.kind === 'chunk' ? 'int' : 'n';
        const e = P.addEntry({ lemma: clean, hom: '', code: '', en: it.en || '', ex: { lex: id }, band: 2, tags: [] });
        if (!e) return;
        e.pos = pos; e.auto = true; if (g && pos === 'n') e.g = g;
        if (it.pl && it.pl[L] && pos === 'n') e.pl = it.pl[L];
        // the key carries the gender the way the pack's own nouns do ('f.s', 'm.p'); a bare 'n' would read as neuter («lo maceta»)
        const gk = pos === 'n' && e.g && e.g !== 'mf' ? e.g + '.' : '';
        P.add(e, clean, pos === 'n' ? gk + 's' : '');
        if (e.pl) P.add(e, e.pl, gk + 'p');
        P.lemmaKeys.push([k, e]);
        P.lexAuto.push(id + ' ' + clean);
      });
    }
  }

  // ------------------------------------------------------------ the pack's API
  function makeApi(P) {
    const spec = P.spec, L = P.lang;
    // candidates for one token: [{ e, f, w, exact, via? }]
    function cands(tk) {
      const k = key(tk.t), lw = low(tk.t);
      const rs = P.IX.get(k);
      let out = rs ? rs.map(r => ({ e: r.e, f: r.f, w: r.w, exact: low(r.w) === lw })) : [];
      if (spec.expand) {
        // (clitics and contractions also when the bare word is something else: «dame» isn't in the list, «vámonos» either)
        if (!out.length || spec.expandAlways) { const x = spec.expand(tk, P, out); if (x && x.length) out = out.concat(x); }
      }
      return out;
    }
    // words one or two letters off: ids, best first
    function suggest(t) {
      const k = key(t); if (k.length < 2) return [];
      const found = new Map();
      for (const x of edits1(k)) { const rs = P.IX.get(x); if (rs) for (const r of rs) if (!found.has(r.e.id)) found.set(r.e.id, { e: r.e, d: 1 }); }
      if (found.size < 3 && k.length >= 5) for (const [lk, e] of P.lemmaKeys) {
        if (found.has(e.id) || Math.abs(lk.length - k.length) > 2) continue;
        const d = dist(k, lk, 2); if (d <= 2) found.set(e.id, { e, d });
      }
      return [...found.values()].sort((a, b) => a.d - b.d || a.e.band - b.e.band).slice(0, 4).map(x => x.e.id);
    }
    const NOUNISH = new Set(['n', 'adj', 'num', 'name']);
    function score(c, i, W, ctx) {
      const e = c.e, f = c.f, pos = e.pos;
      let s = (spec.prior ? spec.prior(c) : 0) + (c.exact ? 2 : 0) - 0.12 * ((e.band || 1) - 1);
      // a capital in mid-sentence: the name or the place («Soy de Chile», not the pepper)
      if (!spec.capNouns && !ctx.first && isCap(W[i].t) && (pos === 'name' || e.country)) s += 3;
      const fin = pos === 'v' && finite(f);
      const pv = ctx.prev;
      if (pv) {
        const pe = pv.e;
        if (pe.det || pe.art) { if (NOUNISH.has(pos)) s += 3; else if (fin && !pe.dem) s -= 3; else if (e.det && !pe.predet) s -= 2; }
        if (pe.subj || pe.neg || pe.clitic) { if (fin) s += 3; else if (pos === 'n') s -= 1.5; }
        if (pe.pos === 'prep' && !pe.art) { if (fin) s -= 2; else if (NOUNISH.has(pos) || pos === 'pron' || f.form === 'inf') s += 1; }
      }
      const nx = ctx.next;
      if (e.det || e.art) s += nx && nx.some(n => NOUNISH.has(n.e.pos) || (e.pos === 'prep' && n.e.det)) ? 1.5 : -1.5;
      if (e.det && e.quant && nx && nx.length && nx.every(n => n.e.pos === 'adj' || n.e.pos === 'adv')) s -= 2;   // «muito bonita»: the adverb
      if (e.clitic) s += nx && nx.some(n => n.e.pos === 'v' && finite(n.f)) ? 1.5 : -0.5;
      if (spec.score) s += spec.score(c, i, W, ctx) || 0;
      return s;
    }
    function analyze(text, opts = {}) {
      try { return analyze0(text, opts); }
      catch (err) {
        console.error('DICT ' + L + ': analyze failed', err);
        const words = tokenize(text).map((tk, i) => Object.assign(tk, { i, unknown: !tk.punct, sugg: [], punct: !!tk.punct, name: false }));
        return { text: String(text || ''), lang: L, words, verbs: [], time: null, times: [], neg: false, question: /[?¿]/.test(String(text || '')),
          numbers: [], connectors: [], clauses: 0, subject: null, unknown: words.filter(w => w.unknown).map(w => w.i), phrases: [] };
      }
    }
    function analyze0(text, opts) {
      if (P.lexN >= 0 && typeof LEX !== 'undefined' && LEX.ids().length !== P.lexN) P.relink();
      text = String(text == null ? '' : text);
      const toks = tokenize(text);
      const W = toks.map((tk, i) => {
        const w = { t: tk.t, i, s: tk.s, e: tk.e, id: null, lemma: null, pos: null, en: null, tags: [], band: 0, f: {}, unknown: false, sugg: [], punct: !!tk.punct, name: false };
        Object.defineProperty(w, '_c', { value: tk.punct ? [] : tk.num != null ? [] : cands(tk), writable: true, enumerable: false });
        Object.defineProperty(w, '_r', { value: null, writable: true, enumerable: false });
        if (tk.num != null) { w.pos = 'num'; w.num = tk.num; }
        return w;
      });
      // phrases: «por favor», «sin embargo», a phrasebook line
      const phrases = [];
      for (let i = 0; i < W.length; i++) {
        if (W[i].punct) continue;
        const list = P.PH.get(key(W[i].t).replace(/^'+|'+$/g, ''));
        if (!list) continue;
        for (const ph of list) {
          let j = i, ok = true;
          for (let n = 0; n < ph.ks.length; n++, j++) { if (!W[j] || W[j].punct || key(W[j].t).replace(/^'+|'+$/g, '') !== ph.ks[n]) { ok = false; break; } }
          if (!ok) continue;
          phrases.push({ id: ph.e.id, at: [i, j - 1] });
          for (let n = i; n < j; n++) {
            W[n].phrase = ph.e.id;
            Object.defineProperty(W[n], '_ph', { value: ph.e, writable: true, enumerable: false, configurable: true });
            if (!W[n]._c.length) W[n]._c = [{ e: ph.e, f: ph.f, w: W[n].t, exact: true, inPhrase: true }];
          }
          i = j - 1; break;
        }
      }
      // pick a reading per word: the shared left-to-right pass, then the language's own
      let prev = null;
      for (let i = 0; i < W.length; i++) {
        const w = W[i];
        if (w.punct) { if (!/^['’\-]$/.test(w.t)) prev = null; continue; }
        if (!w._c.length) { prev = null; continue; }
        let nx = null;
        for (let j = i + 1; j < W.length; j++) { if (W[j].punct) break; nx = W[j]._c; break; }
        const ctx = { prev, next: nx, first: !prev && (i === 0 || W.slice(0, i).every(x => x.punct)) };
        let best = null, bs = -1e9;
        for (const c of w._c) { const s = score(c, i, W, ctx); if (s > bs) { bs = s; best = c; } }
        w._r = best; prev = best;
      }
      // a capitalized first name is a name («Rosa» mid-sentence; «Ana» first in the sentence); so is the word after «me llamo»
      for (let i = 0; i < W.length; i++) {
        const w = W[i]; if (w.punct || !isCap(w.t)) continue;
        if (!NAMES.has(key(w.t))) continue;
        if (w._r && w._r.e.pos === 'name') { w.name = true; continue; }
        if (spec.capNouns && w._r && w._r.e.pos === 'n') continue;
        w._r = null; w.name = true; w.pos = 'name';
      }
      // a verb read with a clitic joined to it, right after an article or a determiner («el dios»): not a verb; the word
      // is something the list doesn't know
      for (const w of W) {
        const c = w._r; if (!c || c.via !== 'clitic') continue;
        let k = w.i - 1; while (k >= 0 && W[k].punct && /^['’\-]$/.test(W[k].t)) k--;
        const p = k >= 0 && !W[k].punct ? W[k]._r : null;
        if (c.f.form === 'inf') continue;                                 // (guardarlo, hacerlo: always a verb)
        if (p && (p.e.det || p.e.art)) { const other = w._c.find(x => x.via !== 'clitic'); w._r = other || null; }
      }
      if (spec.context) spec.context(W, P, opts);
      // unknown words and names
      let firstWord = true;
      for (const w of W) {
        if (w.punct) { if (/[.!?¡¿]/.test(w.t)) firstWord = true; continue; }
        const atStart = firstWord; firstWord = false;
        if (w.pos === 'num' && w.num != null) continue;
        if (w._r) continue;
        if (w.name) continue;
        const pw = W.slice(0, w.i).reverse().find(x => !x.punct);
        const afterName = pw && pw._r && (pw._r.e.lemma === spec.callVerb || pw._r.e.base === spec.callVerb);
        if (isCap(w.t) && !spec.capNouns && (!atStart || !suggest(w.t).length || afterName)) { w.name = true; w.pos = 'name'; continue; }
        if (isCap(w.t) && spec.capNouns && (afterName || (!atStart && w.t.length > 2 && spec.isName && spec.isName(w, W)))) { w.name = true; w.pos = 'name'; continue; }
        if (afterName && w.t.length > 1) { w.name = true; w.pos = 'name'; continue; }
        w.unknown = true; w.sugg = suggest(w.t);
      }
      for (const w of W) {
        const c = w._r; if (!c) continue;
        const e = c.e;
        w.id = e.id; w.lemma = e.lemma; w.pos = e.pos; w.en = e.en; w.tags = e.tags; w.band = e.band;
        w.f = Object.assign({}, c.f);
        if (!c.exact && !c.inPhrase) w.spell = c.w;           // the right spelling (an accent, an umlaut)
        if (e.pos === 'name') w.name = true;
        if (e.pos === 'num' && e.num != null) w.num = e.num;
        if (c.num != null) w.num = c.num;
        if (c.via) w.via = c.via;
        const others = uniq(w._c.filter(x => x.e !== e).map(x => x.e.id));
        if (others.length) w.alt = others;
      }
      const a = { text, lang: L, words: W, verbs: [], time: null, times: [], neg: false, question: /[?¿]/.test(text), numbers: [], connectors: [], clauses: 0,
        subject: null, unknown: [], phrases };
      for (const w of W) {
        if (w.unknown) a.unknown.push(w.i);
        if (w.pos === 'v' && finite(w.f) && !w.f.sep) a.verbs.push(w.i);
        if (w._r && w._r.e.neg) a.neg = true;
      }
      a.numbers = spec.numbers ? spec.numbers(W, P) : W.filter(w => w.num != null).map(w => w.num);
      // connectors: single words and phrases («sin embargo»); y / o / und only when they join two clauses
      const CK = spec.connectorSet || (spec.connectorSet = new Set((spec.connectors || []).map(c => key(c))));
      for (const ph of phrases) { const e = P.entries.get(ph.id); if (e && CK.has(key(e.lemma))) a.connectors.push(e.lemma); }
      for (const w of W) {
        if (!w._r || w.phrase && a.connectors.includes((P.entries.get(w.phrase) || {}).lemma)) continue;
        const k = key(w.lemma || '');
        if (!CK.has(k)) continue;
        if (spec.weakConnectors && spec.weakConnectors.includes(k)) {
          const before = a.verbs.some(v => v < w.i), after = a.verbs.some(v => v > w.i);
          if (!before || !after) continue;
        } else if (!a.verbs.length) continue;
        a.connectors.push(w.lemma);
      }
      if (spec.summary) spec.summary(a, W, P, opts);
      else { a.clauses = a.verbs.length; a.times = a.verbs.length ? ['present'] : []; a.time = a.times[0] || null; }
      return a;
    }
    function check(a, opts = {}) {
      if (!a || !a.words) return [];
      let errs = [];
      try { errs = spec.check ? spec.check(a, opts, P) || [] : []; } catch (err) { console.error('DICT ' + L + ': check failed', err); errs = []; }
      // one error per span: a major one hides the minor ones it overlaps (the accent of a verb whose ending is wrong)
      const major = errs.filter(e => e.sev === 'major');
      errs = errs.filter(e => e.sev === 'major' || !major.some(m => m.at[0] <= e.at[1] && e.at[0] <= m.at[1]));
      const out = [];
      for (const e of errs.sort((x, y) => x.at[0] - y.at[0] || (x.sev === 'major' ? -1 : 1))) {
        if (out.some(o => o.at[0] <= e.at[1] && e.at[0] <= o.at[1] && o.fix === e.fix)) continue;
        if (out.some(o => o.at[0] <= e.at[1] && e.at[0] <= o.at[1] && o.sev === 'major' && e.sev === 'major')) continue;
        out.push(e);
      }
      return out;
    }
    // the sentence said right: each error's words replaced by its fix (right to left; a fix starting the sentence keeps
    // the capital)
    function fix(a, errors) {
      const text = a.text, W = a.words;
      const list = (errors || []).filter(e => e && e.at && e.fix != null && W[e.at[0]] && W[e.at[1]]).slice().sort((x, y) => y.at[0] - x.at[0]);
      let out = text, lastStart = Infinity;
      for (const e of list) {
        const s = W[e.at[0]].s, en = W[e.at[1]].e;
        if (en > lastStart) continue;
        let rep = String(e.fix);
        let k = e.at[0] - 1; while (k >= 0 && W[k].punct && !/[.!?¡¿]/.test(W[k].t)) k--;
        const sentStart = k < 0 || (W[k].punct && /[.!?¡¿]/.test(W[k].t));
        if (rep && sentStart && isCap(W[e.at[0]].t)) rep = capF(rep);
        if (!rep) { let s2 = s, e2 = en; if (out[e2] === ' ') e2++; else if (s2 > 0 && out[s2 - 1] === ' ') s2--; out = out.slice(0, s2) + out.slice(e2); }
        else out = out.slice(0, s) + rep + out.slice(en);
        lastStart = s;
      }
      return out;
    }
    function glossOf(c, surface) {
      const e = c.e, f = c.f || {};
      let eng = e.en || '';
      if (spec.enGloss) { const g = spec.enGloss(c); if (g != null) eng = g; }
      else if (e.pos === 'v' && (f.mood || f.form)) eng = EN.verb(e.en, f);
      else if (e.pos === 'n' && f.number === 'p') eng = EN.plural(genderEn(e.en, f.gender));
      else eng = genderEn(e.en, f.gender);
      const desc = spec.describe ? spec.describe(c) : '';
      const same = low(surface) === low(e.lemma);
      const form = surface + ': ' + eng + (desc || !same ? ' (' + [same || c.via === 'compound' ? '' : e.lemma, desc].filter(Boolean).join(', ') + ')' : '');
      return { id: e.id, lemma: e.lemma, en: e.en, pos: e.pos, form, f, band: e.band, tags: e.tags };
    }
    const genderEn = (en, g) => { const m = /^([^/,;()]+)\/([^,;()]+)(.*)$/.exec(en || ''); return m ? (g === 'f' ? m[2] : m[1]) + m[3] : en; };
    function gloss(surface, ctx) {
      try {
        let w = null;
        if (ctx && ctx.words) ctx = { a: ctx };
        if (ctx && ctx.a && ctx.a.words) w = typeof ctx.i === 'number' ? ctx.a.words[ctx.i] : pick(ctx.a, surface, ctx.at);
        else if (ctx && typeof ctx.text === 'string') w = pick(analyze(ctx.text), surface, ctx.at, ctx.i);
        else if (typeof ctx === 'string' && ctx) w = pick(analyze(ctx), surface);
        if (!w) w = analyze(String(surface || '')).words.find(x => !x.punct);
        if (!w || !w._r) return null;
        const g = glossOf(w._r, spec.capNouns && w._r.e.pos === 'n' ? w.t : w._r.e.pos === 'name' ? w.t : w.t.toLowerCase());
        // a form shared by several persons (comía, olía: I or he/she) with no subject that settles it: say all of them
        const r = w._r;
        if (r.e.pos === 'v' && r.f.person && !w._subj) {
          const pns = uniq(w._c.filter(x => x.e === r.e && x.w === r.w && x.f.tense === r.f.tense && x.f.mood === r.f.mood && x.f.person && !x.f.vos && !x.f.formal).map(x => x.f.person + x.f.number));
          if (pns.length > 1) {
            const label = pns.map(pn => EN.SUBJ[pn]).join('/');
            g.form = g.form.replace(/^([^:]+: (?:\((?:that|if|when, if)\) )?)I\b/, '$1' + label).replace(/, I\)$/, ', ' + pns.map(pn => EN.SUBJ[pn]).join(' or ') + ')');
          }
        }
        if (w.phrase) { const pe = P.entries.get(w.phrase); if (pe && pe.id !== g.id) g.phrase = { id: pe.id, lemma: pe.lemma, en: pe.en }; }
        if (w.alt) g.also = w.alt.slice(0, 3).map(id => { const e = P.entries.get(id); return e ? e.lemma + ': ' + e.en : id; });
        return g;
      } catch (err) { console.error('DICT ' + L + ': gloss failed', err); return null; }
    }
    function pick(a, surface, at, i) {
      if (typeof i === 'number' && a.words[i]) return a.words[i];
      const W = a.words.filter(x => !x.punct);
      if (typeof at === 'number') { const w = W.find(x => x.s <= at && at < x.e); if (w) return w; }
      const k = key(String(surface || '').replace(PUNCT_EDGE, ''));
      return W.find(x => key(x.t) === k) || null;
    }
    function find(word) {
      const s = String(word || '').replace(PUNCT_EDGE, '').trim(); if (!s) return [];
      const toks = tokenize(s).filter(t => t.word);
      const out = new Set();
      if (toks.length > 1) {
        const ks = toks.map(t => key(t.t).replace(/^'+|'+$/g, ''));
        for (const ph of P.PH.get(ks[0]) || []) if (ph.ks.join(' ') === ks.join(' ')) out.add(ph.e);
        return [...out];
      }
      for (const c of cands({ t: s, s: 0, e: s.length, word: true })) out.add(c.e);
      return [...out];
    }
    function inflect(id, f) {
      const e = typeof id === 'string' ? P.entries.get(id) : id;
      if (!e || !spec.inflect) return null;
      try { return spec.inflect(e, f || {}, P); } catch (err) { console.error('DICT ' + L + ': inflect failed', err); return null; }
    }
    const tokens = text => tokenize(text).map(t => ({ t: t.t, s: t.s, e: t.e, word: t.word }));
    const pack = {
      lang: L, entries: P.entries, tokens, analyze, check, fix, gloss, inflect, find,
      connectors: (spec.connectors || []).slice(), connectorKinds: Object.assign({}, spec.connectorKinds || {}), fillers: (spec.fillers || []).slice(),
      forms: () => P.nForms, lexAuto: P.lexAuto, _: P,
    };
    P.pack = pack; P.cands = cands; P.suggest = suggest; P.glossOf = glossOf;
    return pack;
  }

  // ------------------------------------------------------------ Romance (es, pt): shared passes and checks
  // R (the language's config, from its spec): skipAdv, objClitics, refl, clauseStart, coord, gustar, timePatterns,
  // perfAux, irA, inversion, tu3 (pt: tu with the 3rd person), pron2clitic, aPron, personalA, contractions, …
  const ROM = (() => {
    const SOFT = /^['’\-]$/;
    const rd = (W, i) => (i >= 0 && W[i] && W[i]._r) || null;
    function nx(W, i, stop = true) { for (let j = i + 1; j < W.length; j++) { if (W[j].punct) { if (stop && !SOFT.test(W[j].t)) return -1; continue; } return j; } return -1; }
    function pv(W, i, stop = true) { for (let j = i - 1; j >= 0; j--) { if (W[j].punct) { if (stop && !SOFT.test(W[j].t)) return -1; continue; } return j; } return -1; }
    const lk = c => (c ? key(c.e.lemma) : '');
    const wk = w => (w ? key(w.t) : '');
    const isFin = c => !!c && c.e.pos === 'v' && finite(c.f);
    const isNoun = (w, c) => !!w && (w.name || (c && (c.e.pos === 'n' || c.e.pos === 'name')));
    const err = (code, sev, at, fix, tip) => ({ code, sev, at, fix, tip });

    // ---- noun phrases: [predet] [det] [adj]* noun [adj]*  (forward from a det or noun; backward from the last word)
    function npFrom(W, i) {
      let j = i, c = rd(W, j), det = -1, pre = [], post = [], head = -1;
      if (c && c.e.predet) { const k = nx(W, j); if (k >= 0 && rd(W, k) && (rd(W, k).e.det || rd(W, k).e.art)) { j = k; c = rd(W, j); } }
      if (c && (c.e.det || c.e.art) && !W[j].name) { det = j; j = nx(W, j); c = rd(W, j); }
      while (j >= 0 && c && c.e.pos === 'adj' && !isNoun(W[j], c)) { pre.push(j); j = nx(W, j); c = rd(W, j); }
      if (j >= 0 && isNoun(W[j], c)) head = j;
      else if (pre.length) { head = pre.pop(); j = head; }
      else return null;
      let k = nx(W, head);
      while (k >= 0 && rd(W, k) && rd(W, k).e.pos === 'adj' && !rd(W, k).e.det) { post.push(k); k = nx(W, k); }
      return { s: det >= 0 ? det : (pre[0] != null ? pre[0] : head), e: post.length ? post[post.length - 1] : head, det, pre, head, post };
    }
    function npEndingAt(W, j) {
      let k = j, head = -1;
      while (k >= 0) {
        const c = rd(W, k);
        if (isNoun(W[k], c)) { head = k; break; }
        if (c && c.e.pos === 'adj' && !c.e.det) { k = pv(W, k); continue; }
        return null;
      }
      if (head < 0) return null;
      let s = head; k = pv(W, head);
      while (k >= 0) { const c = rd(W, k); if (c && c.e.pos === 'adj' && !c.e.det && !isNoun(W[k], c)) { s = k; k = pv(W, k); continue; } break; }
      let det = -1;
      if (k >= 0) {
        const c = rd(W, k);
        if (c && (c.e.det || c.e.art)) { det = k; s = k; k = pv(W, k); const c2 = rd(W, k); if (c2 && c2.e.predet) { s = k; k = pv(W, k); } }
      }
      return { s, e: j, head, det, before: k };
    }
    // gender and number of a noun reading; 'mf' nouns take the determiner's
    function nounGN(W, np) {
      const w = W[np.head], c = rd(W, np.head);
      if (!c) return { g: null, n: 's' };
      let g = c.f.gender || c.e.g || null, n = c.f.number || 's';
      const dc0 = np.det >= 0 ? rd(W, np.det) : null;
      if (dc0 && dc0.f.number === 'p') n = 'p';              // «los perro»: plural meant
      if (c.e.pos === 'adj') { g = c.f.gender && c.f.gender !== 'mf' ? c.f.gender : null; }
      if (g === 'mf' || (c.e.g === 'mf' && !c.f.gender)) { const d = rd(W, np.det); g = d && d.f.gender && d.f.gender !== 'mf' ? d.f.gender : null; }
      if (w.name) return { g: null, n: 's' };
      return { g, n };
    }
    // ---- subjects
    function pronSubj(c, i) {
      const f = c.f;
      return { at: [i, i], person: f.person, number: f.number, gender: f.gender && f.gender !== 'mf' ? f.gender : null, formal: !!c.e.formal, vos: !!c.e.vos, tu: !!c.e.tu, pron: true, key: key(c.e.lemma) };
    }
    function subjectOf(W, v, R) {
      let j = pv(W, v), objCl = false;
      while (j >= 0) {
        const c = rd(W, j); if (!c) break;
        if (c.e.clitic && !c.e.subj) { if (R.objClitics.has(key(c.w))) objCl = true; j = pv(W, j); continue; }
        if (c.e.neg || R.skipAdv.has(lk(c))) { j = pv(W, j); continue; }
        break;
      }
      if (j < 0) return R.inversion ? rightSubj(W, v) : null;
      const c = rd(W, j);
      if (c && c.e.subj) {
        // a pronoun after a preposition is its object, not the verb's subject («gracias a ellas puedo», «con él voy»)
        const pj = pv(W, j), pc = pj >= 0 ? rd(W, pj) : null;
        if (pc && pc.e.pos === 'prep') return null;
        return coord(W, pronSubj(c, j), R);
      }
      if (objCl) return null;
      if (!isNoun(W[j], c) && !(c && c.e.pos === 'adj')) return null;
      let np = npEndingAt(W, j); if (!np) return null;
      // «el hermano de mi madre»: the head is the first noun
      if (np.before >= 0 && R.ofPrep.has(wk(W[np.before]))) { const k = pv(W, np.before); const np2 = k >= 0 ? npEndingAt(W, k) : null; if (np2 && np2.det >= 0) np = { s: np2.s, e: np.e, head: np2.head, det: np2.det, before: np2.before }; }
      if (np.before >= 0 && !R.clauseStart.has(wk(W[np.before])) && !(rd(W, np.before) && (rd(W, np.before).e.time || rd(W, np.before).e.sub))) {
        if (!(R.coord.has(wk(W[np.before])))) return null;
      }
      const hc = rd(W, np.head);
      if (hc && (hc.e.tags.includes('time') || hc.e.coll || hc.e.pos === 'adj' && np.det < 0)) return null;
      // not a subject: a time phrase («este fin de semana»), or a phrase with a preposition in its article («al principio»)
      if (np.det >= 0 && rd(W, np.det) && rd(W, np.det).e.pos === 'prep') return null;
      for (let k = np.s; k <= np.e; k++) { const x = rd(W, k); if ((x && x.e.tags && x.e.tags.includes('time')) || (W[k]._ph && W[k]._ph.tags.includes('time'))) return null; }
      const gn = nounGN(W, np);
      return coord(W, { at: [np.s, np.e], person: 3, number: gn.n, gender: hc && (hc.e.per || hc.f.gender) ? gn.g : gn.g, pron: false, np }, R);
    }
    function rightSubj(W, v) {
      const j = nx(W, v); const c = rd(W, j);
      return c && c.e.subj && !c.e.clitic ? pronSubj(c, j) : null;
    }
    // «mi hermano y yo», «tú y Ana»: the two together
    function coord(W, S, R) {
      const k = pv(W, S.at[0]);
      if (k < 0 || !R.and.has(wk(W[k]))) return S;
      const j = pv(W, k); if (j < 0) return S;
      const c = rd(W, j);
      let T = null;
      if (!c && (W[j].unknown || W[j].name)) T = { at: [j, j], person: 3, number: 's' };   // «Ana y Juan», a name the list doesn't know
      else if (c && c.e.subj) T = pronSubj(c, j);
      else if (isNoun(W[j], c) || (c && c.e.pos === 'adj')) { const np = npEndingAt(W, j); if (np && !(np.det >= 0 && rd(W, np.det) && rd(W, np.det).e.pos === 'prep')) T = { at: [np.s, np.e], person: 3, number: 's' }; }
      if (!T) return S;
      // «X y Y» is one subject only when it opens the clause («Ana y Juan trabajan»; not «…con Rosa y mi hermano compró»)
      const b = pv(W, T.at[0]);
      // (a finite verb right before it, even one that is spelled like a conjunction («é» → «e»), ends the subject: «Meu nome é Alex e eu sou…»)
      if (b >= 0) { const bc = rd(W, b); if (isFin(bc) || !(R.clauseStart.has(wk(W[b])) || (bc && (bc.e.time || bc.e.sub)))) return S; }
      const ps = [S.person, T.person];
      const person = ps.includes(1) ? 1 : ps.includes(2) && !(S.formal && T.formal) ? 2 : 3;
      return { at: [T.at[0], S.at[1]], person, number: 'p', coord: true, pron: false };
    }
    function agrees(f, S, R) {
      if (!f || !f.person) return false;
      const p = f.person, n = f.number;
      if (S.coord) { if (S.person === 1) return p === 1 && n === 'p'; if (S.person === 2) return n === 'p' && (p === 2 || p === 3); return p === 3 && n === 'p'; }
      if (S.formal) return p === 3 && n === S.number;
      if (R.gente3 && S.key === R.gente3) return p === 3 && n === 's';
      if (S.person === 2 && S.number === 's') return (p === 2 && n === 's') || (!!R.tu3 && p === 3 && n === 's');
      return p === S.person && n === S.number;
    }
    // ---- time words: entries with e.time, and the language's patterns over the word keys («la semana pasada»)
    function timeWords(W, R) {
      const out = [];
      for (const w of W) { const c = w._r; if (c && c.e.time && !w.punct) out.push({ s: w.i, e: w.i, t: c.e.time }); }
      if (R.timePatterns && R.timePatterns.length) {
        const idx = []; let str = '';
        for (const w of W) { if (w.punct) { str += ' | '; continue; } idx.push([str.length, w.i]); str += key(w.t) + ' '; }
        const at = pos => { let best = null; for (const [p, i] of idx) { if (p <= pos) best = i; else break; } return best; };
        for (const tp of R.timePatterns) {
          tp.re.lastIndex = 0; let m;
          while ((m = tp.re.exec(str))) {
            const s = at(m.index + (m[0].length - m[0].trimStart().length)), e = at(m.index + m[0].trimEnd().length - 1);
            if (s != null && e != null) { for (let k = out.length - 1; k >= 0; k--) if (out[k].s >= s && out[k].e <= e) out.splice(k, 1); out.push({ s, e, t: tp.t, hace: !!tp.hace }); }
            if (!tp.re.global) break;
          }
        }
      }
      return out.sort((a, b) => a.s - b.s);
    }
    // the time word that governs the verb at v: the nearest before it in the same stretch (a comma right after a
    // sentence-opening time word is fine: «Ayer, comí…»), else the first after it before the clause ends
    // a coordinator at k starts a clause that speaks about now when its verb at v is a stance verb («y quiero dar mi opinión»)
    // or the clause has its own present/future time word («y ahora estoy cansado»); otherwise the past phrase still governs it
    const STANCE = new Set(['querer', 'poder', 'pensar', 'creer', 'esperar', 'saber', 'gustar', 'encantar', 'preferir', 'necesitar', 'opinar', 'achar', 'acreditar', 'gostar', 'precisar']);
    function newClauseNow(W, k, v, TW, R) {
      if (STANCE.has(lk(rd(W, v)))) return true;
      let end = v; while (end + 1 < W.length && !W[end + 1].punct && !R.coord.has(key(W[end + 1].t))) end++;
      return TW.some(t => t.t !== 'past' && t.s > k && t.e <= end);
    }
    function timeFor(W, v, TW, R) {
      let best = null;
      for (const t of TW) {
        if (t.e >= v) continue;
        let ok = true, sawFin = false;
        for (let k = t.e + 1; k < v; k++) {
          const w = W[k];
          // a coordinator after a finite verb starts a new clause: the time phrase's scope ends there («Ontem fui ao mercado e quero…»)
          if (!w.punct && w._r && isFin(w._r)) sawFin = true;
          else if (sawFin && !w.punct && R.coord.has(key(w.t)) && newClauseNow(W, k, v, TW, R)) { ok = false; break; }
          if (w.punct && /[.;:!?¡¿]/.test(w.t)) { ok = false; break; }
          if (w.punct && w.t === ',' && !(k === t.e + 1 && t.s === firstWordIdx(W, t.s))) { ok = false; break; }
          if (!w.punct && R.subBreak.has(key(w.t))) { ok = false; break; }
        }
        if (ok) best = t;
      }
      if (best) return best;
      for (const t of TW) {
        if (t.s <= v) continue;
        let ok = true;
        for (let k = v + 1; k < t.s; k++) { const w = W[k]; if (w.punct || R.subBreak.has(key(w.t)) || (w._r && isFin(w._r))) { ok = false; break; } }
        return ok ? t : null;
      }
      return null;
    }
    function firstWordIdx(W, i) { let k = i; while (k > 0 && !(W[k - 1].punct && /[.!?¡¿]/.test(W[k - 1].t))) k--; while (k < W.length && W[k].punct) k++; return k; }
    // is the verb at v inside a «si / se» clause (hypo)?
    function inIf(W, v, R) {
      for (let k = v - 1; k >= 0; k--) { const w = W[k]; if (w.punct && /[.;!?,]/.test(w.t)) return false; if (!w.punct && R.ifWord.has(key(w.t)) && w._r && w._r.e.pos === 'conj') return true; if (w._r && isFin(w._r) && !w.aux) return false; }
      return false;
    }

    // ---- the context pass: a verb agrees with its subject when one of its readings can; reflexive headwords; auxiliaries
    function context(W, P, R) {
      const TW = timeWords(W, R);
      for (const w of W) {
        const c = w._r; if (!c || w.punct) continue;
        const vs = w._c.filter(x => x.e.pos === 'v' && finite(x.f));
        if (!vs.length) continue;
        const S = subjectOf(W, w.i, R);
        if (!S) continue;
        Object.defineProperty(w, '_subj', { value: S, writable: true, enumerable: false, configurable: true });
        const adjacent = S.at[1] === pv(W, w.i);
        const ok = x => agrees(x.f, S, R) && !(adjacent && x.f.mood === 'imp');
        if (isFin(c) && ok(c)) continue;
        if (!isFin(c) && !(rd(W, pv(W, w.i)) || {}).e) continue;
        // an agreeing reading: spelled as typed, or with an accent the time words back up («ayer ella canto» → cantó)
        const tw = timeFor(W, w.i, TW, R);
        const fits = x => x.exact || (tw && ((tw.t === 'past' && (x.f.tense === 'past' || x.f.tense === 'impf')) || (tw.t === 'future' && x.f.tense === 'fut')));
        const alt = vs.filter(x => ok(x) && fits(x)).sort((a, b) => (b.exact - a.exact))[0];
        if (alt) w._r = alt;
        else if (!isFin(c)) { const v = vs.filter(x => x.exact)[0]; if (v && S.pron && adjacent) w._r = v; }
        else if (c.f.person === 1 && !S.pron && S.np && adjacent) {
          // a noun never takes «yo»: right after one, a word spelled like a first-person verb and like an adjective («un comedor
          // lleno de voces») is the adjective, unless an object follows («mi hermano lleno el vaso»)
          const ad = w._c.find(x => x.e.pos === 'adj' && x.exact && (x.f.number || 's') === S.number);
          const n2 = rd(W, nx(W, w.i));
          if (ad && !(n2 && (n2.e.det || n2.e.art || n2.e.clitic))) w._r = ad;
        }
      }
      // a noun that doesn't fit its determiner or its predicate, when an accent variant does («el papa», «mi papa es
      // alto» → papá): read it as that (the accent check then says so)
      for (const w of W) {
        const c = w._r; if (!c || c.e.pos !== 'n') continue;
        const alts = w._c.filter(x => x !== c && x.e.pos === 'n' && !x.exact);
        if (!alts.length) continue;
        const g0 = c.f.gender || c.e.g, d = rd(W, pv(W, w.i));
        let want = null;
        if (d && (d.e.det || d.e.art) && d.f.gender && d.f.gender !== 'mf' && g0 !== 'mf' && g0 !== d.f.gender) want = d.f.gender;
        else {
          const j = nx(W, w.i), v = rd(W, j);
          if (v && v.e.copula) {
            let k = nx(W, j); while (k >= 0 && rd(W, k) && R.degree.has(lk(rd(W, k)))) k = nx(W, k);
            const a = rd(W, k);
            if (a && a.e.pos === 'adj' && a.f.gender && a.f.gender !== 'mf' && g0 !== 'mf' && a.f.gender !== g0) want = a.f.gender;
          }
        }
        if (!want) continue;
        const alt = alts.find(x => (x.f.gender || x.e.g) === want && (x.f.number || 's') === (c.f.number || 's'));
        if (alt) w._r = alt;
      }
      // a present subjunctive (or a usted command) with nothing before it that calls for one, when the same verb has an
      // indicative spelled with an accent: that's the likelier reading, an accent slip («Hoy desayune pan» → desayuné;
      // «Ayer hable con ella» → hablé). Kept: «Quiero que hable», «Ojalá llueva», «Hable más despacio» (first word),
      // «No hable» (unless a past time word says otherwise)
      if (R.subjTrig) for (const w of W) {
        const c = w._r; if (!c || c.e.pos !== 'v' || !finite(c.f) || c.f.mood === 'ind') continue;
        if (!(c.f.mood === 'subj' || (c.f.mood === 'imp' && c.f.formal))) continue;
        const alts = w._c.filter(x => x.e === c.e && !x.exact && x.f.mood === 'ind' && x.f.person);
        if (!alts.length) continue;
        let trig = false, first = true, neg = false;
        for (let k = w.i - 1; k >= 0; k--) {
          const x = W[k]; if (x.punct) { if (/[.!?¡¿;]/.test(x.t)) break; continue; }
          first = false; const xk = key(x.t);
          if (R.subjTrig.has(xk)) { trig = true; break; }
          if (R.negs && R.negs.has(xk) && k === pv(W, w.i)) neg = true;
        }
        if (trig) continue;
        const tw = timeFor(W, w.i, TW, R);
        if (neg && !(tw && tw.t === 'past')) continue;
        const S = subjectOf(W, w.i, R);
        if (first && !S && !(tw && tw.t === 'past')) continue;
        const alt = alts.find(x => S ? agrees(x.f, S, R) : true);
        if (alt) w._r = alt;
      }
      // reflexive headwords («me levanto» → levantarse) and clitics joined to the verb
      for (const w of W) {
        const c = w._r; if (!c || c.e.pos !== 'v' || c.e.refl) continue;
        const r = w._c.find(x => x.e.refl && x.e.base === c.e.lemma && x.f === c.f && x.w === c.w);
        if (!r) continue;
        let cl = c.cl ? c.cl.map(e => key(e.lemma)) : [];
        const p = pv(W, w.i); const pc = rd(W, p); if (pc && pc.e.clitic) cl.push(key(pc.w));
        const pp = pv(W, p); const ppc = rd(W, pp); if (ppc && ppc.e.clitic) cl.push(key(ppc.w));
        const want = c.f.person ? R.refl[c.f.person + c.f.number] : null;
        if (cl.some(k => (want ? k === want : R.reflAny.has(k)))) w._r = r;
      }
      // auxiliaries: haber/ter + participle (perfect), ir + a + infinitive (future), estar + gerund
      for (const w of W) {
        const c = w._r; if (!isFin(c)) continue;
        let j = nx(W, w.i); while (j >= 0 && rd(W, j) && (R.skipAdv.has(lk(rd(W, j))) || rd(W, j).e.neg)) j = nx(W, j);
        const n = rd(W, j);
        if (R.perfAux.has(lk(c)) && n && n.e.pos === 'v' && n.f.form === 'part') { w.aux = 'perf'; W[j].perf = true; }
        else if (lk(c) === 'ir') {
          if (n && R.irA && key(W[j].t) === 'a') { const k = nx(W, j); const m = rd(W, k); if (m && m.e.pos === 'v' && m.f.form === 'inf') w.aux = 'ir'; }
          else if (n && !R.irA && n.e.pos === 'v' && n.f.form === 'inf') w.aux = 'ir';
        } else if (lk(c) === 'estar' && n && n.e.pos === 'v' && n.f.form === 'ger') w.aux = 'prog';
      }
      W._tw = TW;
    }
    // ---- the summary: time, times, subject, clauses
    function summary(a, W, P, R) {
      const TW = W._tw || timeWords(W, R);
      const times = []; let main = null;
      for (const v of a.verbs) {
        const w = W[v], f = w.f; let t;
        const tw = timeFor(W, v, TW, R);
        if (f.mood === 'imp') t = 'present';
        else if (w.aux === 'perf') t = 'past';
        else if (w.aux === 'ir') t = f.tense === 'impf' ? 'past' : f.tense === 'pres' ? 'future' : f.tense === 'past' ? 'past' : f.tense === 'fut' ? 'future' : 'hypo';
        else if (f.tense === 'past' || f.tense === 'impf' || f.tense === 'plpf' || f.tense === 'perf') t = f.mood === 'subj' && f.tense === 'impf' ? 'hypo' : 'past';
        else if (f.tense === 'fut') t = f.mood === 'subj' ? 'future' : 'future';
        else if (f.tense === 'cond') t = 'hypo';
        else t = tw && tw.t !== 'present' ? tw.t : 'present';
        if (inIf(W, v, R)) t = 'hypo';
        if (!times.includes(t)) times.push(t);
        if (main == null && !W.slice(0, v).some(x => !x.punct && x._r && x._r.e.sub && !R.coord.has(key(x.t)))) main = t;
      }
      if (!a.verbs.length) for (const t of TW) if (!times.includes(t.t)) times.push(t.t);
      a.times = times;
      a.time = times.includes('hypo') ? 'hypo' : main || times[0] || null;
      a.clauses = a.verbs.filter(v => !W[v].aux).length + a.verbs.filter(v => W[v].aux).length;
      for (const v of a.verbs) { const S = subjectOf(W, v, R); if (S) { a.subject = { person: S.person, number: S.number }; if (S.formal) a.subject.formal = true; break; } }
      a.timeWords = TW.map(t => ({ at: [t.s, t.e], t: t.t }));
    }

    // ---- checks
    function check(a, opts, P, R) {
      const W = a.words, out = [];
      const infl = (e, f) => P.pack.inflect(e, f);
      const TW = W._tw || timeWords(W, R);
      const done = new Set();          // words already given a major error
      const push = e => { if (!e) return; out.push(e); if (e.sev === 'major') for (let k = e.at[0]; k <= e.at[1]; k++) done.add(k); };
      if (R.checkFirst) R.checkFirst(a, W, opts, P, push, done);
      // gustar / gostar de first (they'd otherwise look like person slips)
      gustar(W, R, P, infl, push, done);
      // conj: the verb's person against an explicit subject
      for (const v of a.verbs) {
        if (done.has(v)) continue;
        const w = W[v], c = w._r;
        if (R.gustar.has(lk(c))) continue;
        const S = subjectOf(W, v, R); if (!S) continue;
        if (!S.pron && R.copSkip && c.e.copula === 'ser' && S.number === 's' && c.f.number === 'p') continue;   // «mi problema son los vecinos»
        const adjacent = S.at[1] === pv(W, v);
        // a word typed as a real verb form: an accent reading only counts when the time words back it up («Ayer ella canto» →
        // cantó), never to excuse a person slip («yo trabajó» is not «yo trabajo»)
        const typedVerb = w._c.some(x => x.exact && x.e.pos === 'v' && finite(x.f));
        const twv = typedVerb ? timeFor(W, v, TW, R) : null;
        const accFits = x => !typedVerb || x.exact || x === c || (twv && ((twv.t === 'past' && (x.f.tense === 'past' || x.f.tense === 'impf')) || (twv.t === 'future' && x.f.tense === 'fut')));
        if (w._c.some(x => x.e.pos === 'v' && finite(x.f) && accFits(x) && agrees(x.f, S, R) && !(adjacent && x.f.mood === 'imp' && x.f.person === 2))) continue;
        if (c.f.mood === 'imp' && !adjacent) continue;
        const f = { tense: c.f.tense || 'pres', mood: c.f.mood === 'imp' ? 'ind' : c.f.mood, person: S.person, number: S.number };
        if (S.formal) f.person = 3;
        if (R.gente3 && S.key === R.gente3) { f.person = 3; f.number = 's'; }
        if (S.coord && S.person === 2) { f.person = R.vt2p ? 2 : 3; }
        if (S.person === 2 && S.number === 'p' && !S.formal && !S.coord) f.vosotros = true;
        const fx = infl(c.e, f); if (!fx || key(fx) === key(w.t)) continue;
        const who = S.pron ? '«' + W[S.at[0]].t + '»' : 'this subject';
        push(err('conj.person', 'major', [v, v], fx, `With ${who}, the verb is «${fx}».`));
      }
      agree(W, R, P, infl, push, done, opts);
      serestar(W, a, R, P, infl, push, done);
      tense(W, a, R, P, infl, push, done, TW);
      if (R.checkMore) R.checkMore(a, W, opts, P, push, done, { rd, nx, pv, lk, npFrom, npEndingAt, nounGN, subjectOf, err, infl, isFin });
      // accents (minor): a word read as a headword spelled with an accent («arbol» → «árbol»)
      for (const w of W) {
        if (!w.spell || done.has(w.i) || w.punct) continue;
        if (R.lang === 'de') continue;
        const fx = likeCase(w.spell, w.t);
        if (fx === w.t) continue;
        out.push(err('accent', 'minor', [w.i, w.i], fx, `Spelled «${fx}».`));
      }
      return out;
    }
    // ---- agreement: determiner, noun and adjectives; predicate adjectives after ser/estar
    function agree(W, R, P, infl, push, done, opts) {
      const seen = new Set();
      for (const w of W) {
        if (w.punct || seen.has(w.i)) continue;
        const c = w._r; if (!c || !(c.e.det || c.e.art) || w.name) continue;
        const np = npFrom(W, w.i); if (!np || np.det !== w.i) continue;
        for (let k = np.s; k <= np.e; k++) seen.add(k);
        if ([np.det, np.head].concat(np.pre, np.post).some(k => done.has(k))) continue;
        const hc = rd(W, np.head); if (!hc || W[np.head].name) continue;
        // a fixed phrase has no agreement of its own: «a favor» (the «a» is a preposition)
        if (W[np.det].phrase && W[np.det].phrase === W[np.head].phrase) continue;
        // pt: «a» before a masculine noun is the preposition in fixed phrases (estou aqui a trabalho, a pé, a cavalo), but never at the start of a sentence
        if (R.aPrepNouns && wk(W[np.det]) === 'a' && np.head === np.det + 1 && np.det > 0 && !W[np.det - 1].punct && R.aPrepNouns.has(wk(W[np.head]))) continue;
        const dc = rd(W, np.det);
        if (dc.e.inv || hc.e.pos === 'adj' && hc.f.gender === 'mf' && dc.f.gender === 'mf') continue;
        if (dc.e.quant && hc.e.pos === 'adj') continue;                  // «muito bonita», «mucho mejor»: an adverb, never agreeing
        if (R.lang === 'es' && dc.f.gender === 'n' && hc.e.pos === 'adj') continue;   // «lo primero», «lo importante»: the neuter article never agrees
        let g = hc.f.gender || hc.e.g; const hn = hc.f.number || 's';
        if (hc.e.pos === 'adj') g = hc.f.gender;
        if (g === 'mf' || !g) g = dc.f.gender && dc.f.gender !== 'mf' ? dc.f.gender : (hc.e.pos === 'adj' ? null : 'm');
        if (hc.e.g === 'mf' && !hc.f.gender) g = dc.f.gender && dc.f.gender !== 'mf' ? dc.f.gender : null;
        const dn = dc.f.number || 's';
        const n = dn === 'p' || hn === 'p' ? 'p' : 's';
        const detOk = (!g || !dc.f.gender || dc.f.gender === 'mf' || dc.f.gender === g || (hc.e.elf && n === 's' && R.elfOk(dc))) && dn === n;
        const nounOk = hn === n || hc.e.inv || hc.e.pl === hc.e.lemma;
        const bad = [];
        if (!detOk) bad.push(np.det);
        if (!nounOk) bad.push(np.head);
        const adjBad = [];
        for (const k of np.pre.concat(np.post)) {
          if (k === np.head) continue;
          const ac = rd(W, k); if (!ac) continue;
          if (np.post.includes(k) && (ac.e.dep || ac.e.st)) continue;       // «llegué al trabajo cansada»: about the speaker
          const ag = ac.f.gender, an = ac.f.number || 's';
          const gOk = !g || !ag || ag === 'mf' || ag === g;
          if (gOk && an === n) continue;
          // «un vaso de agua frío»: it may go with the noun before «de»
          if (np.post.includes(k) && np.det >= 0) { const b = pv(W, np.s); if (b >= 0 && R.ofPrep.has(wk(W[b]))) continue; }
          if (np.post.includes(k) && np.det < 0) continue;
          adjBad.push(k);
        }
        if (!bad.length && !adjBad.length) continue;
        if (!g && bad.includes(np.det) && dn === n) continue;
        // the whole phrase said right
        const words = [];
        for (let k = np.s; k <= np.e; k++) {
          const x = W[k]; if (x.punct) { continue; }
          const xc = rd(W, k);
          if (k === np.det) words.push(detFix(xc, g, n, hc, R, infl) || x.t);
          else if (k === np.head && hc.e.pos === 'n') words.push(nounOk ? x.t : (infl(hc.e, { number: n, gender: hc.f.gender }) || x.t));
          else if (xc && xc.e.pos === 'adj') words.push(adjBad.includes(k) || (k === np.head && !nounOk) ? (infl(xc.e, { gender: g || xc.f.gender, number: n }) || x.t) : x.t);
          else words.push(x.t);
        }
        const fx = words.join(' ');
        if (key(fx) === key(W.slice(np.s, np.e + 1).filter(x => !x.punct).map(x => x.t).join(' '))) continue;
        const hw = W[np.head].t;
        const isG = !detOk && dn === n || adjBad.some(k => { const ac = rd(W, k); return ac.f.gender && ac.f.gender !== 'mf' && g && ac.f.gender !== g; });
        const tip = isG ? `«${hc.e.pos === 'n' ? (hn === 'p' ? infl(hc.e, { number: 's' }) || hw : hw) : hw}» is ${g === 'f' ? 'feminine' : 'masculine'}: «${fx}».`
          : `${n === 'p' ? 'Plural' : 'Singular'} all through: «${fx}».`;
        push(err(isG ? 'agree.gender' : 'agree.number', 'major', [np.s, np.e], fx, tip));
      }
      // predicate adjectives: «la casa es blanca», «ellos están cansados» (never the speaker's gender: «estoy cansada» is right)
      for (const w of W) {
        const c = w._r; if (!c || c.e.pos !== 'v' || !c.e.copula || !finite(c.f)) continue;
        let j = nx(W, w.i); while (j >= 0 && rd(W, j) && (R.degree.has(lk(rd(W, j))) || rd(W, j).e.neg)) j = nx(W, j);
        if (j < 0 || done.has(j)) continue;
        const ac = rd(W, j); if (!ac || ac.e.pos !== 'adj' && !(ac.e.pos === 'v' && ac.f.form === 'part')) continue;
        if (ac.e.pos === 'v' && c.e.copula === 'ser') continue;           // a passive: «fue construida»
        const k2 = nx(W, j); const n2 = rd(W, k2);
        if (n2 && (n2.e.pos === 'n' || isNoun(W[k2], n2))) continue;        // «es buen chico»: an adjective before a noun
        let S = subjectOf(W, w.i, R);
        if (!S) S = carriedSubj(W, w.i, j, R, c);
        if (S && S.np && rd(W, S.np.head) && rd(W, S.np.head).e.noagree) continue;   // «a gente está cansado(s)»
        const vn = c.f.number || 's', vp = c.f.person || 3;
        const n = S ? (S.formal ? S.number : S.number) : vn;
        let g = null;
        if (S && !S.coord && vp === 3 && !S.formal) g = S.gender || null;
        if (S && S.coord) g = null;
        if (vp !== 3) g = null;                                           // yo / tú / nosotros: never gendered here
        const ag = ac.f.gender, an = ac.f.number || 's';
        const gBad = g && ag && ag !== 'mf' && ag !== g;
        const nBad = an !== n && !(S && S.formal && false);
        if (!gBad && !nBad) continue;
        if (nBad && !S && vp === 3) { /* «es» with no subject: number only when the verb's number is sure */ }
        const fx = ac.e.pos === 'adj' ? infl(ac.e, { gender: gBad ? g : (ag || 'm'), number: n }) : infl(ac.e, { form: 'part', gender: gBad ? g : (ag || 'm'), number: n });
        if (!fx || key(fx) === key(W[j].t)) continue;
        const who = S && S.pron ? '«' + W[S.at[0]].t + '»' : S ? '«' + W.slice(S.at[0], S.at[1] + 1).filter(x => !x.punct).map(x => x.t).join(' ') + '»' : 'the subject';
        push(err(gBad ? 'agree.gender' : 'agree.number', 'major', [j, j], fx, gBad ? `It describes ${who}: «${fx}».` : `${n === 'p' ? 'More than one' : 'Just one'}: «${fx}».`));
      }
    }
    // a dropped subject («Tengo una gata. Es negro y muy bonita.»): the copula opens its sentence and the adjective ends its
    // clause; the subject is the last noun phrase of the sentence before, when that is the only person or animal in it
    // (Spanish and Portuguese only), same number as the verb. Anything less sure («Es necesario que…») is left alone.
    function carriedSubj(W, v, j, R, c) {
      if (R.lang === 'de' || (c.f.person || 3) !== 3) return null;
      let p = v - 1; while (p >= 0 && W[p].punct && /^[¿¡"'«“(]$/.test(W[p].t)) p--;
      if (p < 1 || !W[p].punct || !/^[.!?]$/.test(W[p].t)) return null;
      let q = p - 1; while (q >= 0 && W[q].punct && /^["'»”)]$/.test(W[q].t)) q--;
      if (q < 0 || W[q].punct) return null;
      const np = npEndingAt(W, q); if (!np) return null;
      const hc = rd(W, np.head); if (!hc || W[np.head].name || hc.e.pos !== 'n' || !(hc.e.per || (hc.e.tags && hc.e.tags.includes('animal')))) return null;
      if (np.before >= 0 && !W[np.before].punct && (R.coord.has(wk(W[np.before])) || R.and.has(wk(W[np.before])))) return null;
      let from = np.before; while (from >= 0 && !(W[from].punct && /^[.!?]$/.test(W[from].t))) from--;
      for (let k = from + 1; k < np.s; k++) { const x = rd(W, k); if (x && !W[k].punct && x.e.pos === 'n' && (x.e.per || (x.e.tags && x.e.tags.includes('animal')))) return null; }
      const ac = W[j + 1];
      if (ac && !ac.punct && !(R.coord.has(wk(ac)) || R.and.has(wk(ac)))) return null;
      const gn = nounGN(W, np);
      if (!gn.g || gn.n !== (c.f.number || 's')) return null;
      return { at: [np.s, np.e], person: 3, number: gn.n, gender: gn.g, pron: false, np };
    }
    function detFix(dc, g, n, hc, R, infl) {
      if (hc && hc.e.elf && n === 's' && R.elfDet && R.elfDet[key(dc.e.lemma)]) return R.elfDet[key(dc.e.lemma)];
      return infl(dc.e, { gender: g || 'm', number: n });
    }
    // ---- ser / estar
    function serestar(W, a, R, P, infl, push, done) {
      for (const v of a.verbs) {
        if (done.has(v)) continue;
        const w = W[v], c = w._r; const cop = c.e.copula; if (!cop) continue;
        let j = nx(W, v); while (j >= 0 && rd(W, j) && (R.degree.has(lk(rd(W, j))) || rd(W, j).e.neg)) j = nx(W, j);
        if (j < 0) continue;
        const n = rd(W, j), nk = wk(W[j]);
        const S = subjectOf(W, v, R);
        const person = (S && S.pron && !S.formal) ? S.person : c.f.person;
        const swap = to => { const f = Object.assign({}, c.f); delete f.form; const fx = infl(P.entries.get(R.lang + ':' + to), f); return fx; };
        let to = null, tip = '';
        if (cop === 'ser' && n && n.e.pos === 'adj' && n.e.st && (person === 1 || person === 2)) { to = 'estar'; tip = `How someone is right now takes «estar»`; }
        else if (cop === 'ser' && (person === 1 || person === 2) && (R.here.has(nk) || ((nk === R.inWord || (R.inSet && R.inSet.has(nk))) && (() => { const k = nx(W, j); const d = rd(W, k); const k2 = d && (d.e.det || d.e.art) ? nx(W, k) : k; const h = rd(W, k2); return !!h && h.e.pos === 'n' && h.e.place; })()))) { to = 'estar'; tip = 'Where you are takes «estar»'; }
        else if (cop === 'estar' && n && n.e.pos === 'adj' && n.e.nat) { to = 'ser'; tip = 'Where you’re from takes «ser»'; }
        else if (cop === 'estar' && n && n.e.pos === 'n' && n.e.per && n.e.work) { to = 'ser'; tip = 'A job or what you are takes «ser»'; }
        else if (cop === 'estar' && n && (n.e.art || n.e.det) && R.indef.has(wk(W[j]))) { const k = nx(W, j), h = rd(W, k); if (h && h.e.pos === 'n' && h.e.per && h.e.work) { to = 'ser'; tip = 'A job or what you are takes «ser»'; } }
        else if (cop === 'estar' && R.ofPrep.has(nk)) { const k = nx(W, j), h = rd(W, k); if (h && h.e.country) { to = 'ser'; tip = 'Where you’re from takes «ser»'; } }
        if (!to) continue;
        const fx = swap(to); if (!fx) continue;
        push(err('serestar', 'major', [v, v], fx, `${tip}: «${fx}».`));
      }
    }
    // ---- gustar (es) / gostar de (pt): the language's own (R.gustarCheck), on top of the shared person rule
    function gustar(W, R, P, infl, push, done) { if (R.gustarCheck) R.gustarCheck(W, P, infl, push, done, { rd, nx, pv, lk, npFrom, err, isFin }); }
    // ---- a time word against the verb's tense («ayer como» → comí; «mañana comí» → comeré)
    // «hace / há + a duration» with the PRESENT of one of these means "for (and still)": «Estudio español hace ocho meses», «Moro aqui há dois anos»
    const DURATIVE = new Set(['estudiar', 'vivir', 'trabajar', 'aprender', 'conocer', 'ser', 'estar', 'tener', 'saber', 'esperar', 'jugar', 'practicar', 'residir', 'estudar', 'morar', 'viver', 'trabalhar', 'conhecer', 'ter', 'praticar', 'jogar', 'esperar', 'ficar', 'quedar', 'llevar', 'levar']);
    function tense(W, a, R, P, infl, push, done, TW) {
      if (!TW.length) return;
      for (const v of a.verbs) {
        if (done.has(v)) continue;
        const w = W[v], c = w._r, f = c.f;
        if (f.mood !== 'ind' || w.aux === 'perf' || w.aux === 'ir' || w.aux === 'prog' || R.noTense.has(lk(c))) continue;
        const tw = timeFor(W, v, TW, R); if (!tw) continue;
        if (tw.hace && /que/.test(key((W[nx(W, tw.e)] || {}).t || ''))) continue;
        if (tw.hace && f.tense === 'pres' && DURATIVE.has(lk(c))) continue;
        let to = null, tip = '';
        if (tw.t === 'past' && f.tense === 'pres') { to = { tense: 'past' }; tip = 'the past'; }
        else if (tw.t === 'past' && f.tense === 'fut') { to = { tense: 'past' }; tip = 'the past'; }
        else if (tw.t === 'future' && f.tense === 'past') { to = { tense: 'fut' }; tip = 'the future'; }
        if (!to) continue;
        const fx = R.tenseFix ? R.tenseFix(c, to, infl, W, v) : infl(c.e, Object.assign({ mood: 'ind', person: f.person, number: f.number }, to));
        if (!fx || key(fx) === key(w.t)) continue;
        const word = W.slice(tw.s, tw.e + 1).filter(x => !x.punct).map(x => x.t).join(' ').toLowerCase();
        push(err('tense', 'major', [v, v], fx, `With «${word}», use ${tip}: «${fx}».`));
      }
    }
    return { context, summary, check, subjectOf, npFrom, npEndingAt, timeWords, timeFor, agrees, rd, nx, pv, lk, wk, isFin, err };
  })();

//@@PART4
  return { key, low, capF, isCap, likeCase, uniq, EN, feat, finite, parseList, tokenize, numVal, edits1, dist, build, ROM };
})();
