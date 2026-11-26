'use strict';
// BRIDGE: Spanglish in free talk (P6a, DESIGN.md 19: "how does practice with conversations work if you only know some words? can you
// speak spanglish or something to them?"). An English word you used because you don't know it in the language yet, one the
// dictionary can translate, is understood: «Tengo un dog» is heard as «Tengo un perro». The person answers with the word in the
// language, highlighted and glossed (a natural recast: «¡Ah! ¿Tienes un perro?»), and the word counts as met (DICT.met, LEX.expose).
// TALK.judge (talk.js) calls it; the reverse index is built from the language's dictionary entries (their English), once per pack.
//
// A ramp, not a crutch (TALK.level(): 0 A0 … 4 B2):
//   how many English words one answer may bridge: half of its words at A0 and A1, a third at A2, a quarter at B1, one at B2
//     (and never more than the words really in the language: «I want a dog» isn't Spanish, «Yo want un dog» is)
//   what it costs: nothing at A0 and A1; at A2 the first one is free, more cost one step; from B1 any English costs one step
// Never bridged: names, numbers, words the dictionary reads as the language, and English's little words (a, the, I, is, to…).
//   BRIDGE.find(a, l, o) → [{ i (the word's index in a), t (as typed), en, e (the entry), form (the word to put in) }]
//   BRIDGE.apply(raw, a, l, o) → null | { text (the answer with the words put in), words: [{ t, en, id, lemma, form, s, e (its place in text) }],
//                                 free (how many cost nothing), level }
//   BRIDGE.rules(level) → { share, free } · BRIDGE.index(l) (tests) · BRIDGE.lookup(word, l) (tests: «dogs» → perros)

const BRIDGE = (() => {
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = l => typeof CJK !== 'undefined' && CJK.isCJK(l);
  // English's little words: never bridged (they'd turn an English sentence into "the language")
  const STOP = new Set(('a an the i you he she it we they me him her us them my your his its our their mine yours this that these those ' +
    'is am are was were be been being do does did done have has had having will would shall should can could may might must ' +
    'to of in on at for with from by about into onto over under up down out off and or but so if then than as not no yes ok okay ' +
    'oh hi hello hey bye goodbye please thanks thank what who whom whose which where when why how there here very too also just').split(' '));
  const POS = new Set(['n', 'v', 'adj', 'adv']);
  // the English forms of an English word: nouns their plural, verbs their -s, past and -ing (LATIN.EN knows the irregular ones)
  const EN = () => (typeof LATIN !== 'undefined' && LATIN.EN) || null;
  const IX = {};          // lang → Map(english form → [{ e, sense, num, vf }])
  function index(l = L()) {
    let P = null; try { P = typeof DICT !== 'undefined' ? DICT.pack(l) : null; } catch (e) { P = null; }
    if (!P || !P.entries) return null;
    const ix = IX[l];
    if (ix && ix.n === P.entries.size) return ix.map;
    const map = new Map(), E = EN();
    const put = (k, x) => { k = String(k || '').toLowerCase().trim(); if (!k || STOP.has(k) || !/^[a-z][a-z' -]*$/.test(k)) return; let a = map.get(k); if (!a) map.set(k, a = []); a.push(x); };
    for (const e of P.entries.values()) {
      if (!POS.has(e.pos) || e.name || !e.en) continue;
      const senses = String(e.en).replace(/\([^)]*\)/g, ' ').split(/[;,]/);
      senses.forEach((s0, sense) => {
        for (let s of s0.split('/')) {
          s = s.replace(/^\s*to\s+/i, '').replace(/\s+/g, ' ').trim().toLowerCase();
          if (!s || s.split(' ').length > 2) continue;
          put(s, { e, sense });
          if (!E || s.includes(' ')) continue;
          try {
            if (e.pos === 'n') { const p = E.plural(s); if (p && p !== s) put(p, { e, sense, num: 'p' }); }
            if (e.pos === 'v') for (const [vf, f] of [['s3', E.s3(s)], ['past', E.past(s)], ['pp', E.pp(s)], ['ing', E.ing(s)]]) if (f && f !== s) put(f, { e, sense, vf });
          } catch (er) { /* */ }
        }
      });
    }
    // best first: the first sense, the commoner word (its band), a plain form over an inflected one
    for (const [, a] of map) a.sort((x, y) => (x.sense - y.sense) || ((x.e.band || 1) - (y.e.band || 1)) || ((x.num || x.vf ? 1 : 0) - (y.num || y.vf ? 1 : 0)));
    IX[l] = { n: P.entries.size, map };
    return map;
  }
  // the word to put in for it: a plural for an English plural, the dictionary form otherwise (the pack's own check then fixes the
  // ending or the article: «yo querer» → «quiero», «un casa» → «una casa»); zh / ja in the save's script
  function formOf(x, l) {
    const e = x.e;
    if (isC(l)) { try { return CJK.plain(e.lemma, { lang: l, cap: false }); } catch (er) { return null; } }
    let f = e.lemma;
    if (x.num === 'p') { let p = null; try { p = DICT.inflect(e.id, { number: 'p' }); } catch (er) { p = null; } if (p) f = p; else if (e.pl) f = e.pl; }
    return String(f || '').replace(/#.*$/, '') || null;
  }
  function lookup(word, l = L(), prev, next) {
    const map = index(l); if (!map) return null;
    const k = String(word || '').toLowerCase().replace(/[’]/g, "'");
    const a = map.get(k); if (!a || !a.length) return null;
    const x = a[0], form = (x.e.pos === 'v' && verbForm(x, prev, l)) || (x.e.pos === 'adj' && adjForm(x, prev, next, l)) || formOf(x, l);
    return form ? { e: x.e, en: k, form, num: x.num || null, vf: x.vf || null } : null;
  }
  // de: an adjective before its noun takes its ending («eine big Katze» → «eine große Katze»; es / pt: the pack's check fixes those)
  function adjForm(x, prev, next, l) {
    if (l !== 'de' || !next || next.pos !== 'n') return null;
    let pl = null; try { pl = prev && prev.id ? DICT.entry(prev.id) : null; } catch (e) { pl = null; }
    const lem = pl ? String(pl.lemma || '').toLowerCase() : '', det = prev && (prev.pos === 'det' || prev.pos === 'art' || (pl && (pl.det || pl.art)));
    const art = !det ? 'none' : /^(ein|kein|mein|dein|sein|ihr|unser|euer)/.test(lem) ? 'indef' : 'def';
    const nf = next.f || {}, ne = (() => { try { return DICT.entry(next.id); } catch (e) { return null; } })();
    const f = { case: (det && prev.f && prev.f.case) || nf.case || 'nom', gender: nf.gender || (ne && ne.g) || 'm', number: nf.number || 's', art };
    try { return DICT.inflect(x.e.id, f) || null; } catch (e) { return null; }
  }
  // a verb said in English takes the person it's said with (es / pt / de): «Yo want…» → «quiero», «he wants» → «quiere»; after another
  // verb or a little linking word it stays as it is («Quiero eat» → «comer»). With nobody named, it's you (I): you talk about yourself.
  function verbForm(x, prev, l) {
    if (isC(l)) return null;
    if (prev && ((prev.pos === 'v' && prev.f && prev.f.person) || prev.pos === 'prep')) return null;
    let person = x.vf === 's3' ? 3 : 1, number = 's';
    let pe = null; try { pe = prev && prev.id ? DICT.entry(prev.id) : null; } catch (e) { pe = null; }
    if (pe && pe.subj && prev.f && prev.f.person) { person = prev.f.person; number = prev.f.number || 's'; }
    try { return DICT.inflect(x.e.id, { tense: x.vf === 'past' ? 'past' : 'pres', mood: 'ind', person, number }) || null; } catch (e) { return null; }
  }
  // level → how much may be bridged, and how much of it is free
  function rules(level) {
    const lv = Math.max(0, Math.min(4, level | 0));
    return { share: [0.5, 0.5, 1 / 3, 0.25, 0.1][lv], min: 1, free: [Infinity, Infinity, 1, 0, 0][lv], level: lv };
  }
  // the unknown English words of an analysis the dictionary can translate (two-word ones first: «ice cream»)
  function find(a, l = L()) {
    const W = ((a && a.words) || []).filter(w => w && !w.punct);
    const out = [], used = new Set();
    const asc = w => !!w && w.unknown && !w.name && w.pos !== 'name' && /^[A-Za-z][A-Za-z']*$/.test(w.t);
    const eng = w => asc(w) && !STOP.has(w.t.toLowerCase());
    for (let k = 0; k < W.length; k++) {
      const w = W[k], n = W[k + 1], prev = W[k - 1] && !W[k - 1].unknown ? W[k - 1] : null;
      if (used.has(k)) continue;
      if (asc(w) && asc(n)) {
        const two = lookup(w.t + ' ' + n.t, l, prev, W[k + 2]);
        if (two) { out.push(Object.assign({ i: w.i, j: n.i, t: w.t + ' ' + n.t, s: w.s, end: n.e }, two)); used.add(k); used.add(k + 1); continue; }
      }
      if (!eng(w)) continue;
      const one = lookup(w.t, l, prev, n && !n.unknown ? n : null);
      if (one) { out.push(Object.assign({ i: w.i, j: w.i, t: w.t, s: w.s, end: w.e }, one)); used.add(k); }
    }
    return out;
  }
  // the answer with its English words put in the language, as many as the level allows
  function apply(raw, a, l = L(), o = {}) {
    if (!a || !a.words || !raw) return null;
    const found = find(a, l); if (!found.length) return null;
    const R = rules(o.level != null ? o.level : 0);
    const W = a.words.filter(w => !w.punct && !w.name && w.pos !== 'name' && !/^\d+$/.test(w.t));     // (number words count: «um» cat)
    const real = W.filter(w => !w.unknown).length;
    const cap = Math.min(Math.max(R.min, Math.floor(R.share * W.length + 1e-9)), real);
    if (cap <= 0) return null;
    const take = found.slice(0, cap).sort((x, y) => x.s - y.s);
    // (a spelling slip of a word that's in the language, «doy» for «dog», is left to the pack when the English isn't a better read:
    // only words the pack couldn't read, or read as a near miss of something, are bridged)
    let text = '', at = 0;
    const words = [];
    for (const x of take) {
      if (x.s == null || x.end == null || x.s < at) continue;
      let put = x.form;
      if (!isC(l) && /^\p{Lu}/u.test(x.t) && l !== 'de') put = put.charAt(0).toUpperCase() + put.slice(1);
      const sp = isC(l) && text && !/\s$/.test(text + raw.slice(at, x.s)) ? ' ' : '';
      text += raw.slice(at, x.s) + sp;
      words.push({ t: x.t, en: x.en, id: x.e.id, lemma: x.e.lemma, lex: x.e.lex || null, form: put, s: text.length, e: text.length + put.length });
      text += put; at = x.end;
    }
    text += raw.slice(at);
    return words.length ? { text, words, free: R.free, level: R.level } : null;
  }
  // the little interjection a person starts the recast with
  const AH = { es: '¡Ah!', pt: 'Ah!', de: 'Ah!', zh: '[哦|ò] ，', ja: 'あ 、' };
  return { STOP, index, lookup, find, apply, rules, AH };
})();
