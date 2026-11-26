'use strict';
// MIX: every line in free talk, reading and the phone, mixed by the weave (DESIGN.md 16; the weave is 12.4 and 14.8).
// The user: "Everything should be a mix until it all eventually becomes your target language." So a person's line, a
// question, a prompt or one of Mimo's lines is the English line with the words you know shown in the language (glossed
// small the first few times, like the story's weave), and whole sentences in the language only come as the weave rises
// (UI.fullLine: a growing share from 0.48, all of them from 0.70). EN stays a help button.
//
// How a line is mixed: the line in the language is analyzed (DICT; zh / ja one notation chunk at a time), and each word you
// know is matched to the English translation through its gloss (a word's `en`, its plural, a verb's forms: eat, eats, ate,
// eaten, eating), checked against the form it has in the language (comí ↔ ate, not "did … eat"). A match that isn't sure
// (two candidates, a count that doesn't line up, a helper verb in the way) leaves the English.
//   MIX.line(t, en, o) → { full, html, en, under, parts }   o: { key, force (ids taught just now), count (note the woven
//        words: once per line said), noFull, pos (the parts of speech that may swap) }
//   MIX.html(t, en, o) · MIX.parts(t, en, o) · MIX.tlHTML(t, mark) · MIX.note(parts)
//   MIX.newWords(t, o) → the words of a line you haven't met yet (DICT.level < 2, not taught): what to pre-teach
//   MIX.known(id) · MIX.mode(entry) · MIX.taught(id) (you used a pre-taught word right) · MIX.isTaught(id) · MIX.words(t)
// State: G.state.talk.mix { wv: { lang: { id: n } }, taught: { lang: { id: { n, at } } } } (talk.js keeps it in the save).
// Needs lexicon.js (LEX), dict.js (DICT), ui.js (UI.fullLine, UI.partsHTML), cjk.js for zh / ja. Without UI (the test pages)
// it falls back to the line in the language. `under` is always false now (DESIGN.md 17.3: the English only on request, EN).

const MIX = (() => {
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK(L());
  const E = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
  const W = () => { try { return LEX.weave(); } catch (e) { return 0; } };
  function ok() {
    try { return typeof UI !== 'undefined' && typeof UI.partsHTML === 'function' && typeof UI.fullLine === 'function' && typeof LEX !== 'undefined' && typeof LEX.weave === 'function' && typeof DICT !== 'undefined' && DICT.ready(); } catch (e) { return false; }
  }

  // ============================================================ state (in the save, through TALK.state; a memory copy without it)
  const mem = { wv: {}, taught: {} };
  function st() {
    let t = null; try { t = typeof TALK !== 'undefined' ? TALK.state : null; } catch (e) { t = null; }
    if (!t) return mem;
    if (!t.mix || typeof t.mix !== 'object') t.mix = { wv: {}, taught: {} };
    if (!t.mix.wv) t.mix.wv = {}; if (!t.mix.taught) t.mix.taught = {};
    return t.mix;
  }
  const per = k => { const s = st()[k], l = L(); return s[l] || (s[l] = {}); };
  const isTaught = id => !!per('taught')[id];
  function taught(id) { if (!id) return; const t = per('taught'), r = t[id] || (t[id] = { n: 0, at: 0 }); r.n++; r.at = Math.round(Date.now() / 1000); }
  // the learner's record of a headword, read without creating one (DICT.st would)
  const rec = id => { try { const m = DICT.toJSON().M; return (m && m[L()] && m[L()][id]) || null; } catch (e) { return null; } };
  const level = id => { try { return DICT.level(id); } catch (e) { return 0; } };
  // A headword's LEX item (Mimo's word, or an everyday chunk): its own link (entry.lex), else an everyday chunk with the same
  // spelling («sí» is c.yes), or a world word that's the same noun. (Never a battle verb: LEX keeps those as commands, «nada»
  // swim! is not «nada» nothing.)
  let rev = null, revKey = '', revAt = 0;
  const keyOf = s => (isC() ? CJK.chars(String(s), { lang: L() }).replace(/\s+/g, '') : String(s).toLowerCase().trim());
  function revLex() {
    const t = Date.now();
    if (rev && revKey.startsWith(L() + ':') && t - revAt < 3000) return rev;        // (looked at again every few seconds: modules add words)
    const ids = LEX.ids(), k = L() + ':' + ids.length; revAt = t;
    if (rev && revKey === k) return rev;
    rev = new Map(); revKey = k;
    for (const id of ids) { const it = LEX.item(id); if (it && (it.kind === 'chunk' || it.kind === 'word') && it[L()]) { const f = keyOf(it[L()]); if (f && !rev.has(f)) rev.set(f, id); } }
    return rev;
  }
  function lexOf(e) {
    if (!e || typeof LEX === 'undefined') return null;
    let id = e.lex && LEX.item(e.lex) ? e.lex : null;
    if (!id && e.lemma) { const c = revLex().get(keyOf(e.lemma)), it = c && LEX.item(c); if (it && (it.kind === 'chunk' || e.pos === 'n')) id = c; }
    return id && (!isC() || LEX.has(id)) ? id : null;
  }
  // a stable share in 0..1 per word (which of your familiar words come in first: always the same ones)
  const share = id => { let h = 2166136261; const k = String(id); for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };

  // ============================================================ is a word in the language for you? 'tl' (no gloss) · 'new' (glossed at first) · 'en'
  // The story's rules (ui.js slotMode) for Mimo's words, then the dictionary's: known (level 3+) always; a word you've used
  // right, or one taught in a talk, glossed at first; a familiar one (level 2: met in context 5+ times) a growing share of
  // them as the weave rises (none below 0.1, all by 0.6).
  function mode(e, w = W()) {
    if (!e || !e.id) return 'en';
    const lx = lexOf(e);
    if (lx) {
      if (LEX.taught(lx)) return 'tl';
      const it = LEX.item(lx);
      if (it.kind === 'chunk' && it.rank < Math.floor(w * 18)) return 'new';
      if (LEX.admitted(lx)) return 'new';
    }
    const lv = level(e.id);
    if (lv >= 3) return 'tl';
    const r = rec(e.id);
    if (isTaught(e.id) || (r && r.u >= 1)) return 'new';
    if (lv === 2 && share(e.id) < (w - 0.1) / 0.5) return 'new';
    return 'en';
  }
  // known enough not to need teaching (FLUENT: DICT.level < 2 and not taught in LEX is "not met")
  function known(id) {
    const e = entry(id); if (!e) return true;
    const lx = lexOf(e);
    if (lx && LEX.taught(lx)) return true;
    if (isTaught(id) || level(id) >= 2) return true;
    return mode(e) !== 'en';
  }
  const entry = id => { try { return DICT.entry(id); } catch (e) { return null; } };

  // ============================================================ the line in the language, word by word
  // es / pt / de: DICT.analyze's words; zh / ja: the notation's chunks (one word each, with its particles), each analyzed.
  // → [{ t (as written: the surface, or the chunk's plain text), src (zh / ja: the chunk, for ruby), id, pos, f, e, k (order) }]
  const CJ_CHUNK = /(?:[^\s[\]]*\[[^\]]*\])+[^\s[\]]*|\S+/g;
  const CP = ['n', 'v', 'adj', 'adv', 'int', 'num', 'phrase'];
  const cache = new Map();
  function words(t) {
    const l = L(), key = l + '|' + (isC() ? CJK.mode(l) : '') + '|' + t;
    if (cache.has(key)) return cache.get(key);
    const out = [];
    try {
      if (isC()) {
        let k = 0;
        for (const ch of String(t).match(CJ_CHUNK) || []) {
          const chars = CJK.chars(ch, { lang: l }).replace(/\s+/g, '');
          if (!chars || /^[\p{P}\p{S}\d]+$/u.test(chars)) continue;
          const ws = (DICT.analyze(chars).words || []).filter(w => !w.punct && w.id && !w.unknown);
          const main = ws.filter(w => CP.includes(w.pos));
          const w = main.length === 1 ? main[0] : (ws.length === 1 ? ws[0] : null);
          if (!w) { k++; continue; }
          out.push({ t: CJK.plain(ch, { lang: l, cap: false }), src: ch, id: w.id, pos: w.pos, f: w.f || {}, e: entry(w.id), k: k++ });
        }
      } else {
        // (via: 'clitic' when the pack read the word with a pronoun on its end, «Llámelo», «chame-o»; sep: a de particle on its own)
        // (prev: the word before it, for "to" + an infinitive)
        let prev = '';
        (DICT.analyze(t).words || []).forEach((w, k) => {
          if (w.punct) { prev = ''; return; }
          if (w.id && !w.unknown) out.push({ t: w.t, id: w.id, pos: w.pos, f: w.f || {}, e: entry(w.id), name: !!w.name, k, s: w.s, end: w.e, via: w.via || '', sep: !!(w.f && w.f.sep), prev });
          prev = String(w.t || '').toLowerCase();
        });
      }
    } catch (er) { /* (never throws: a line with no words just stays as it is) */ }
    if (cache.size > 600) cache.clear();
    cache.set(key, out);
    return out;
  }

  // ============================================================ English: the forms a gloss can take
  const IRR = {};
  ('arise arose arisen|awake awoke awoken|bear bore born|beat beat beaten|become became become|begin began begun|bend bent bent|bite bit bitten|bleed bled bled|blow blew blown|break broke broken|bring brought brought|build built built|burn burnt burnt|buy bought bought|catch caught caught|choose chose chosen|come came come|cost cost cost|cut cut cut|dig dug dug|do did done|draw drew drawn|dream dreamt dreamt|drink drank drunk|drive drove driven|eat ate eaten|fall fell fallen|feed fed fed|feel felt felt|fight fought fought|find found found|fly flew flown|forget forgot forgotten|forgive forgave forgiven|freeze froze frozen|get got gotten|give gave given|go went gone|grow grew grown|hang hung hung|have had had|hear heard heard|hide hid hidden|hit hit hit|hold held held|hurt hurt hurt|keep kept kept|know knew known|lay laid laid|lead led led|learn learnt learnt|leave left left|lend lent lent|let let let|lie lay lain|light lit lit|lose lost lost|make made made|mean meant meant|meet met met|pay paid paid|put put put|quit quit quit|read read read|ride rode ridden|ring rang rung|rise rose risen|run ran run|say said said|see saw seen|seek sought sought|sell sold sold|send sent sent|set set set|shake shook shaken|shine shone shone|shoot shot shot|show showed shown|shut shut shut|sing sang sung|sink sank sunk|sit sat sat|sleep slept slept|slide slid slid|smell smelt smelt|speak spoke spoken|spend spent spent|spin spun spun|stand stood stood|steal stole stolen|stick stuck stuck|strike struck struck|swear swore sworn|sweep swept swept|swim swam swum|swing swung swung|take took taken|teach taught taught|tear tore torn|tell told told|think thought thought|throw threw thrown|understand understood understood|wake woke woken|wear wore worn|weep wept wept|win won won|write wrote written|fit fit fit|forbid forbade forbidden|bet bet bet|cast cast cast|spread spread spread|mistake mistook mistaken|overcome overcame overcome|dive dove dived')
    .split('|').forEach(s => { const [b, p, pp] = s.split(' '); IRR[b] = { p, pp }; });
  const BOTH = new Set(['learn', 'burn', 'dream', 'smell', 'light', 'hang', 'dive', 'show']);     // (irregular, and regular too)
  const cvc = w => /^[^aeiou]*[aeiou][^aeiouwxy]$/.test(w);
  function vForms(b) {
    const o = { base: [b], s: [], past: [], pp: [], ing: [] }, irr = IRR[b];
    o.s.push(b === 'have' ? 'has' : /(s|x|z|ch|sh|o)$/.test(b) ? b + 'es' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'ies' : b + 's');
    const reg = /e$/.test(b) ? b + 'd' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'ied' : b + 'ed';
    if (irr) { o.past.push(irr.p); o.pp.push(irr.pp); }
    if (!irr || BOTH.has(b)) { o.past.push(reg); o.pp.push(reg); if (cvc(b)) { o.past.push(b + b.slice(-1) + 'ed'); o.pp.push(b + b.slice(-1) + 'ed'); } }
    o.ing.push(/ie$/.test(b) ? b.slice(0, -2) + 'ying' : /[^aeiouy]e$/.test(b) ? b.slice(0, -1) + 'ing' : b + 'ing');
    if (cvc(b)) o.ing.push(b + b.slice(-1) + 'ing');
    return o;
  }
  const NIRR = { man: 'men', woman: 'women', child: 'children', person: 'people', foot: 'feet', tooth: 'teeth', mouse: 'mice', goose: 'geese', fish: 'fish', sheep: 'sheep', deer: 'deer', leaf: 'leaves', knife: 'knives', wife: 'wives', life: 'lives', wolf: 'wolves', half: 'halves', shelf: 'shelves', loaf: 'loaves', thief: 'thieves', potato: 'potatoes', tomato: 'tomatoes', hero: 'heroes', echo: 'echoes', grandchild: 'grandchildren' };
  const plural = w => (NIRR[w] ? [NIRR[w]] : /(s|x|z|ch|sh)$/.test(w) ? [w + 'es'] : /[^aeiou]y$/.test(w) ? [w.slice(0, -1) + 'ies'] : /fe?$/.test(w) ? [w + 's', w.replace(/fe?$/, 'ves')] : [w + 's']);
  // English words a gloss never stands for (helpers, articles, pronouns…): never swapped, in a gloss or in the line
  const STOP = new Set(('a an the to of in on at for with by from up down out off over into onto about as and or but if so than then that this these those it its '
    + 'i me my mine you your yours he him his she her hers we us our ours they them their theirs one ones be am is are was were been being do does did done doing '
    + 'will would shall should can could may might must not let get got there oneself myself yourself itself someone something somebody sb sth').split(' '));
  // glosses that read better as another English word in a line (gustar's gloss is "please (me gusta: I like it)")
  const OVR = { 'es:gustar': ['like'], 'es:encantar': ['love'], 'pt:gostar': ['like'], 'pt:adorar': ['love'], 'de:mögen': ['like'], 'de:gefallen': ['like'], 'de:gern': [], 'es:haber': [], 'pt:haver': [], 'de:werden': [] };
  // Verbs whose subject is the thing liked («me gusta» = it pleases me) never swap: "I [gusta] it", "do you [gusta]?" say it twice.
  // (Their gloss stays "like" / "love" for the new-word cards.) pt «gostar» and de «mögen» work like English, so they swap.
  const NOSWAP = new Set(['es:gustar', 'es:encantar', 'de:gefallen']);
  // a noun's number: «días» isn't "day" ("every [días]"), «día» isn't "days" (a word whose English already ends in -s takes either)
  const numberOK = (F, c) => { const nb = c.f && c.f.number; if (!nb) return true; return nb === 'p' ? F.k === 'npl' || /s$/.test(F.ws[F.ws.length - 1]) : F.k === 'n'; };
  // the little words a line puts before an infinitive itself (so "to" stays English): «a comer», «que comer», «para comer», «zu essen»
  const TO_TL = /^(a|al|de|del|para|por|sin|que|en|con|hasta|ao|à|pra|pro|sem|em|com|até|zu|um|ohne|statt)$/;
  // the language's own "be" (ser / estar / sein / です…): grammar, shown by the frames, never swapped or pre-taught as a word
  const isBe = e => !!e && (/^be\b/.test(String(e.en || '').toLowerCase()) || /^(es:(ser|estar|haber)|pt:(ser|estar|haver)|de:(sein|haben|werden)|ja:(です|だ|ます)|zh:(是|在))$/.test(e.id));
  const vcache = new Map();
  function variants(e) {
    if (!e) return [];
    if (OVR[e.id]) return OVR[e.id];
    if (vcache.has(e.id)) return vcache.get(e.id);
    const out = [];
    const s = String(e.en || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ').replace(/[«»"“”!?¡¿…]/g, ' ');
    for (let v of s.split(/[;,/]|\bor\b/)) {
      v = v.replace(/\b(sb|sth|someone|something|somebody|oneself|one's|etc)\b\.?/g, ' ').replace(/[^a-z' -]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(to|a|an|the) /, '');
      if (!v || v.split(' ').length > 3 || STOP.has(v)) continue;
      out.push(v);
    }
    const r = isBe(e) ? [] : [...new Set(out)];
    vcache.set(e.id, r);
    return r;
  }
  // every English word sequence the word could be: [{ ws: ['ate'], k: 'past' }]
  function formsOf(e) {
    const out = [];
    for (const v of variants(e)) {
      const ws = v.split(' ');
      if (e.pos === 'v') { const F = vForms(ws[0]); for (const k of ['base', 's', 'past', 'pp', 'ing']) for (const f of F[k]) out.push({ ws: [f].concat(ws.slice(1)), k }); }
      else if (e.pos === 'n') { out.push({ ws, k: 'n' }); for (const p of plural(ws[ws.length - 1])) if (p !== ws[ws.length - 1]) out.push({ ws: ws.slice(0, -1).concat(p), k: 'npl' }); }
      else out.push({ ws, k: 'x' });
    }
    return out;
  }

  // ============================================================ the English line, word by word
  // «…» stays as it is (the player's own words said back, a fact in the language): nothing in it is ever swapped
  // A boss's name or title stays whole: «the Gray Miller», «Grandma Echo», «the Frog King» are never woven word by word («the
  // Gray [molinero]», «the [rana] [rey]»). The titles are the battle's kind names that have a capital («Colonel Cob») plus the
  // few that don't, read from BATTLE._.RW.KIND_EN (each boss module adds its own there), so a new boss needs nothing here.
  const BOSS_EXTRA = ['the first armadillo', 'the Great Armadillo', 'Great Armadillo'];
  let nameRe = null, nameKey = '';
  function bossNames() {
    let K = null; try { K = BATTLE._.RW.KIND_EN; } catch (e) { K = null; }
    const list = BOSS_EXTRA.concat(Object.values(K || {}).map(String).filter(v => /\p{Lu}/u.test(v.replace(/^the\s+/i, ''))));
    const key = list.join('|');
    if (key !== nameKey) {
      nameKey = key;
      const fr = [...new Set(list)].sort((a, b) => b.length - a.length).map(v => v.replace(/^the\s+/i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
      nameRe = fr.length ? fr.join('|') : null;
    }
    return nameRe;
  }
  function enTokens(s) {
    const out = [], nm = bossNames(), re = new RegExp('«[^»]*»|' + (nm ? `((?<![\\p{L}'’])(?:the\\s+)?(?:${nm})(?![\\p{L}]))|` : '') + "\\p{L}+(?:['’]\\p{L}+)*", 'giu'); let m, last = 0;
    while ((m = re.exec(s))) {
      const gap = s.slice(last, m.index); last = m.index + m[0].length;
      if (m[0][0] === '«' || m[1]) { out.push({ guard: true, s: m.index, e: last, brk: true }); continue; }
      out.push({ t: m[0], low: m[0].toLowerCase().replace(/’/g, "'"), s: m.index, e: last, brk: /[,.;:!?…—–()"“”]/.test(gap), start: !out.length ? !/\S/.test(s.slice(0, m.index).replace(/[¿¡"“'(«\s]/g, '')) : /[.!?:]["”']?\s*$/.test(gap.replace(/[¿¡"“'(«\s]+$/, '')) || (/…["”']?\s*$/.test(gap.replace(/[¿¡"“'(«\s]+$/, '')) && /^\p{Lu}/u.test(m[0])) });     // (after «…» a lowercase word goes on with the sentence: "had… sung")
    }
    return out;
  }
  const DO = new Set(['do', 'does', 'did', "don't", "doesn't", "didn't"]);
  const MODAL = new Set(['to', 'can', 'could', 'will', 'would', 'should', 'must', 'might', 'may', "let's", 'let', "i'll", "you'll", "we'll", "they'll", "he'll", "she'll", "it'll", "i'd", "you'd", "we'd", "they'd", 'gonna', 'wanna', 'shall', "can't", "won't", "couldn't", "wouldn't", "shouldn't", 'cannot']);
  const BE = new Set(['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', "i'm", "you're", "we're", "they're", "he's", "she's", "it's", "that's", "there's", "isn't", "aren't", "wasn't", "weren't"]);
  const HAVE = new Set(['have', 'has', 'had', "i've", "you've", "we've", "they've", "haven't", "hasn't", "hadn't", "i'd", "you'd", "we'd"]);
  const ADV = new Set(['not', 'never', 'always', 'just', 'also', 'really', 'still', 'already', 'often', 'even', 'only', 'usually', 'sometimes', 'ever', 'all', 'both']);
  const CONJ = new Set(['and', 'but', 'because', 'when', 'that', 'if', 'so', 'while', 'or', 'who', 'which', 'where', 'what', 'how', 'why']);
  // the helper right before a verb (skipping a "not" / "never"…), and do-support anywhere earlier in its clause
  function helperBefore(T, i) { let j = i - 1; while (j >= 0 && !T[j].guard && ADV.has(T[j].low) && !T[j + 1].brk) j--; return j >= 0 && !T[j].guard && !T[j + 1].brk ? T[j].low : ''; }
  // (do-support, or a helper fronted in a question: "Will you bring me…?" is «¿Me traes…?», so «traes» can't take "bring")
  const MODQ = new Set(['will', 'would', 'can', 'could', 'should', 'shall', 'may', 'might', 'must', "won't", "can't", "couldn't", "wouldn't", "shouldn't"]);
  function doSupport(T, i) { for (let j = i - 1; j >= 0; j--) { if (T[j].guard || T[j + 1].brk) return false; if (DO.has(T[j].low) || MODQ.has(T[j].low)) return true; if (CONJ.has(T[j].low)) return false; } return false; }
  // ------------------------------------------------------------ the English slot (the cleanup pass, 2026-11-20)
  // A woven verb has to fit the English slot it takes: finite or not, its tense, and who's doing it. «canta» is "sings" (he /
  // she / it), never "I [canta]" or "they [canta]"; «cantó» is "sang", never "Have you [cantó]"; «cantar» is "(to) sing" or
  // "singing", never "is [cantar]". Where the English can't say for sure, the English stays.
  const SUBJ = { i: [1, 's'], you: [2, '*'], he: [3, 's'], she: [3, 's'], it: [3, 's'], we: [1, 'p'], they: [3, 'p'], this: [3, 's'], that: [3, 's'],
    everyone: [3, 's'], everybody: [3, 's'], everything: [3, 's'], nobody: [3, 's'], someone: [3, 's'], somebody: [3, 's'], something: [3, 's'],
    nothing: [3, 's'], anyone: [3, 's'], anybody: [3, 's'], none: [3, 's'] };
  const CSUBJ = { "i'm": [1, 's'], "you're": [2, '*'], "we're": [1, 'p'], "they're": [3, 'p'], "he's": [3, 's'], "she's": [3, 's'], "it's": [3, 's'], "that's": [3, 's'],
    "i've": [1, 's'], "you've": [2, '*'], "we've": [1, 'p'], "they've": [3, 'p'], "i'll": [1, 's'], "you'll": [2, '*'], "we'll": [1, 'p'], "they'll": [3, 'p'],
    "he'll": [3, 's'], "she'll": [3, 's'], "it'll": [3, 's'], "i'd": [1, 's'], "you'd": [2, '*'], "we'd": [1, 'p'], "they'd": [3, 'p'] };
  const BEP = { am: [1, 's', 'pres'], is: [3, 's', 'pres'], are: [0, 'p', 'pres'], was: [0, 's', 'past'], were: [0, 'p', 'past'] };     // (a plain "is", whose verb can take it along)
  const OBJ = new Set(['me', 'him', 'us', 'them']);                  // ("let me go", "made him cry": a bare infinitive after them)
  const DETS = new Set('the a an my your his our their its these those every each some many few no any another'.split(' '));
  const PREPS = new Set('of in on at from with for near under by inside behind'.split(' '));
  const COORD = new Set(['and', 'or', 'but', 'then']);
  const NOTN = new Set([...STOP, ...CONJ, ...ADV, 'there', 'here', 'very', 'like', 'whoever', 'whatever', 'please', 'yes', 'no', 'oh', 'hey']);
  const LEADW = /^(hey|oh|ok|okay|please|now|so|well|look|listen|come|on|then|and|but|ah|ay|psst|yes|no|here|just|first|quick|quickly|together|always|never|again)$/;
  const LYN = new Set('family fly jelly belly rally ally bully lily july italy reply supply holy ugly silly lonely lovely early only'.split(' '));
  const isAdv = w => ADV.has(w) || /^(hardly|barely|nearly|simply|actually|finally|suddenly|quietly|slowly|quickly|almost|probably|maybe|perhaps|soon|too|once|together|alone|gently|softly|loudly|rarely|seldom|truly|surely|certainly|again|now|then|first|well)$/.test(w) || (/ly$/.test(w) && w.length > 4 && !LYN.has(w));
  // a noun's number from its English: a name is one; men, children, people… are many; fish, sheep, deer either ('*')
  const nounNum = tok => (/^\p{Lu}/u.test(tok.t) && !tok.start ? 's' : /^(fish|sheep|deer)$/.test(tok.low) ? '*' : /(men|children|people|feet|teeth|mice|geese|police)$/.test(tok.low) ? 'p'
    : /[^s]s$/.test(tok.low) && !/(us|is|ss|ous)$/.test(tok.low) ? 'p' : 's');
  const cut = (T, j) => j < 0 || T[j].guard || T[j + 1].brk;        // (token j is in another clause, or a «…» fact)
  // the noun a phrase hangs on: "the Wall of Days", "every clock in Escarcha", "the ducks from the pond"
  function headOf(T, j) {
    for (let n = 0; n < 4; n++) {
      let k = j - 1; while (!cut(T, k) && DETS.has(T[k].low)) k--;
      if (k >= 1 && !cut(T, k) && PREPS.has(T[k].low) && !cut(T, k - 1) && !NOTN.has(T[k - 1].low) && !DETS.has(T[k - 1].low) && !SUBJ[T[k - 1].low]) { j = k - 1; continue; }
      break;
    }
    return j;
  }
  // who does the verb at token i: [person, number] (number '*': either; person 0: any), or 'coord' (after "and", "but": the
  // subject is further back), 'noun' (after "the", "my": a noun's place), 'bare' (after "me", "them": "let me go"), or null
  function subjectOf(T, i) {
    let j = i - 1;
    while (!cut(T, j) && (isAdv(T[j].low) || MODAL.has(T[j].low) || DO.has(T[j].low) || HAVE.has(T[j].low) || BEP[T[j].low] || /^(be|been|being)$/.test(T[j].low)) && !CSUBJ[T[j].low]) j--;
    if (cut(T, j)) return null;
    const w = T[j].low;
    if (CSUBJ[w]) return CSUBJ[w];
    if (SUBJ[w] && w !== 'that') return SUBJ[w];
    if (OBJ.has(w)) return 'bare';
    if (w === 'who' || w === 'that' || w === 'which') {             // a relative: the noun before it
      if (cut(T, j - 1)) return w === 'that' ? SUBJ.that : null;
      const k = headOf(T, j - 1), x = T[k];
      return SUBJ[x.low] || CSUBJ[x.low] || (NOTN.has(x.low) ? null : [3, nounNum(x)]);
    }
    if (COORD.has(w)) return 'coord';
    if (DETS.has(w) || w === 'her') return 'noun';
    if (NOTN.has(w) || BE.has(w)) return null;
    const k = headOf(T, j), x = T[k];
    if (SUBJ[x.low]) return SUBJ[x.low];
    if (NOTN.has(x.low)) return null;
    const and = k >= 2 && T[k - 1].low === 'and' && !cut(T, k - 1) && !cut(T, k - 2);
    return [3, and ? 'p' : nounNum(x)];
  }
  // nothing but adverbs and interjections before it in its sentence (or after "Mimo," / "Hey,"): a command's place
  function leadOf(T, i) {
    let j = i - 1;
    while (j >= 0 && !T[j].guard && (isAdv(T[j].low) || LEADW.test(T[j].low)) && !T[j + 1].brk && !T[j].start) j--;
    if (j < 0 || T[j + 1].start || T[j + 1].brk) return true;
    if (j >= 0 && T[j].start && (isAdv(T[j].low) || LEADW.test(T[j].low))) return true;
    return false;
  }
  // nothing but adverbs and interjections between it and its sentence's start (no comma: "Well played!", "Lost…")
  function startOf(T, i) {
    let j = i - 1;
    while (j >= 0 && !T[j].guard && !T[j + 1].brk && !T[j + 1].start && (isAdv(T[j].low) || LEADW.test(T[j].low))) j--;
    return j < 0 || T[j + 1].start;
  }
  // a question ("…?" before the sentence ends), and one that starts with "Have you…" (a perfect: «encontraste» isn't "found" there)
  const questionAt = (T, i, s) => /^[^.!…]*\?/.test(s.slice(T[i].s));
  function haveQ(T, i, s) {
    if (!questionAt(T, i, s)) return false;
    for (let q = i - 1; q >= 0; q--) { if (T[q].guard) return false; if (HAVE.has(T[q].low)) return q === 0 || T[q].start || T[q].brk; if (T[q + 1].brk || T[q].start) return false; }
    return false;
  }
  // could this form be that person? Its own reading, or the same spelling in that person («quería» is I and he; «canta» is he and
  // the command)
  const icache = new Map();
  function canBe(w, P, N, extra) {
    const f = w.f || {};
    if (!extra && f.person === P && (!f.number || f.number === N)) return true;
    const F = Object.assign({ tense: f.tense, mood: f.mood || 'ind', person: P, number: N }, extra || {}), key = L() + '|' + w.id + '|' + w.t + '|' + JSON.stringify(F);
    if (icache.has(key)) return icache.get(key);
    let ok = false; try { const s = DICT.inflect(w.id, F); ok = !!s && String(s).toLowerCase() === String(w.t).toLowerCase(); } catch (e) { ok = false; }
    if (icache.size > 5000) icache.clear();
    icache.set(key, ok); return ok;
  }
  const canAny = (w, list) => list.some(([P, N, x]) => canBe(w, P, N, x));
  const commandOK = w => canAny(w, [[2, 's', { mood: 'imp', tense: undefined }], [2, 'p', { mood: 'imp', tense: undefined }], [3, 's', { mood: 'imp', tense: undefined, formal: true }]]);
  // the verb's person against the English subject's (you: tú or usted, você, du or Sie; pt "we" can be «a gente»)
  function personOK(subj, w, tl) {
    const [P, N] = subj, l = L();
    if (P === 2 && N === '*') return canAny(w, [[2, 's'], [2, 'p']]) || ((l === 'es' || l === 'pt') && canAny(w, [[3, 's'], [3, 'p']])) || (l === 'de' && /\sSie\b/.test(' ' + tl) && canBe(w, 3, 'p'));
    if (P === 1 && N === 'p' && l === 'pt' && /\ba gente\b/i.test(tl) && canBe(w, 3, 's')) return true;
    if (P === 0) return canAny(w, [[1, N], [2, N], [3, N]]);
    if (N === '*') return canAny(w, [[P, 's'], [P, 'p']]);
    return canBe(w, P, N);
  }
  // ja: a form fits one English word only when it carries no more than it: no "want to" (歌いたい), "can" (歌える), "if" (歌ったら),
  // "let's" (歌いましょう), "not" (歌わない), passive or causative; a past (歌った) for a past, a non-past for a present (or "will"),
  // a ている for "is …ing", a て-form leniently
  function jaOK(k, w, T, i) {
    const f = w.f || {}, h = helperBefore(T, i);
    if (f.want || f.pot || f.pass || f.caus || f.cond || f.neg || f.mood === 'vol' || f.q) return false;
    if (f.form && !/^(te|dict)$/.test(f.form)) return false;
    if (f.mood === 'imp') return k === 'base' && !subjectOf(T, i) && leadOf(T, i);
    if (f.form === 'te') return k !== 'pp';
    // (after "to", "can", "will", "do": a non-past; after "did": a past)
    if (/^(did|didn't)$/.test(h)) return k === 'base' && f.tense === 'past' && !f.asp;
    if (h === 'to' || MODAL.has(h) || DO.has(h)) return k === 'base' && f.tense !== 'past' && !f.asp;
    if (f.asp === 'prog') return k === 'ing' && !!BEP[h] && (f.tense === 'past') === (BEP[h][2] === 'past');
    if (f.tense === 'past') return k === 'past' || (k === 'pp' && HAVE.has(h)) || /^(did|didn't)$/.test(h);
    return k === 'base' || k === 's';
  }
  // may this verb form in the language stand for that English form there? (comí ↔ "ate", not "did … eat"; comer ↔ "to eat";
  // canta ↔ "sings" or "is singing" (the "is" goes with it), never "I [canta]")
  // the other readings of a form, where the pack picked one: German «danke» is "I thank" and "thanks!"; «sehen» is the infinitive
  // as well as "we / they see" and the formal "see!"
  const hcache = new Map();
  function homographs(w) {
    const key = L() + '|' + w.t; if (hcache.has(key)) return hcache.get(key);
    const r = { int: false, inf: false };
    try { const es = DICT.find(w.t) || [], low = String(w.t).toLowerCase(); r.int = es.some(e => e.pos === 'int'); r.inf = es.some(e => e.pos === 'v' && String(e.lemma || '').toLowerCase() === low); } catch (e) { /* */ }
    if (hcache.size > 3000) hcache.clear();
    hcache.set(key, r); return r;
  }
  function verbOK(k, w, T, i, tl, s) {
    if (isC()) return L() !== 'ja' || jaOK(k, w, T, i);              // (zh doesn't inflect)
    const f = w.f || {}, h = helperBefore(T, i), ds = doSupport(T, i);
    const subj = subjectOf(T, i), hg = homographs(w);
    const infSlot = (k === 'base' && (MODAL.has(h) || ds || subj === 'bare')) || (k === 'ing' && !BE.has(h) && !/^(be|been|being)$/.test(h));
    if (f.form === 'inf') return infSlot;
    if (hg.inf && !f.form && infSlot) return true;                    // («Lass mich sehen»: "Let me [sehen]")
    // ("But [danke].": an interjection spelled like the verb, with nothing around it that makes it a verb)
    // (never "[Danke] you": the interjection is the whole "thank you", so that one stays English)
    if (hg.int && T[i + 1] && T[i + 1].low === 'you' && !T[i + 1].brk) return false;
    if (hg.int && (k === 's' || k === 'base') && !MODAL.has(h) && !DO.has(h) && !ds && (subj === null || subj === 'coord') && leadOf(T, i)) return true;
    if (f.form === 'ger') return k === 'ing';
    // a participle: after have / be, after "the" / "a" ("a fried fish"), or on its own at a sentence's start ("Well played!"); never
    // for a simple past whose subject is somewhere before it ("…and [geblieben]", "he [gesagt]": German needs its «hat» / «ist»)
    if (f.form === 'part') return k === 'pp' && (HAVE.has(h) || BE.has(h) || /^(be|been|being|get|got)$/.test(h) || haveQ(T, i, s) || subj === 'noun' || (subj === null && startOf(T, i)));
    if (f.mood === 'subj' || f.tense === 'fut' || f.tense === 'cond') return false;
    if (f.tense === 'perf') return k === 'pp';
    // a finite verb: a finite slot, the same time, the same person
    // (after a helper: "can [canta]", "did [cantó]", "has [cantó]", "he's [cansou]" (he is tired / that has happened): the English
    // there is a bare verb or a participle, not this form; only "is" + -ing is taken along whole, below)
    if (ds || MODAL.has(h) || DO.has(h) || HAVE.has(h) || /^(be|been|being)$/.test(h) || (k !== 'ing' && BE.has(h)) || haveQ(T, i, s) || subj === 'bare') return false;
    // (after "the": a noun's place. Only a noun spelled the same, in the English noun's number: «el paso», «una pelea», never
    // «pruebas» for "a taste")
    if (subj === 'noun') {
      const plEn = /[^s]s$/.test(T[i].low) && !/(us|is|ss)$/.test(T[i].low);
      try { return (DICT.find(w.t) || []).some(e => e.pos === 'n' && (String(e.lemma || '').toLowerCase() === String(w.t).toLowerCase()) === !plEn); } catch (e) { return false; }
    }
    const past = f.tense === 'past' || f.tense === 'impf';
    let who = Array.isArray(subj) ? subj : null;
    if (k === 'ing') {
      // "is singing" whole: a plain am / is / are / was / were right before it (no "isn't": its "not" would go), in the same time;
      // es / pt drop a subject that's in the verb, so "I'm going" can be «voy» too (de keeps its «ich»)
      if (T[i].low === 'going' && T[i + 1] && T[i + 1].low === 'to') return false;          // ("going to": the future, not «voy»)
      const b = T[i - 1]; if (!b || T[i].brk || b.guard) return false;
      const be = BEP[b.low] || ((L() === 'es' || L() === 'pt') && CSUBJ[b.low] && /'(m|re|s)$/.test(b.low) ? [CSUBJ[b.low][0], CSUBJ[b.low][1], 'pres'] : null);
      if (!be || (be[2] === 'past') !== past) return false;
      if (!who || be[0] !== 0) who = be[0] ? [be[0], be[1]] : (who || [0, be[1]]);
    } else if (k === 'past') { if (!past) return false; }
    else if (k === 's' || k === 'base') { if (past) return false; }
    else return false;
    if (f.mood === 'imp') return k === 'base' && ((!who && leadOf(T, i) && !questionAt(T, i, s)) || (who && who[0] === 2 && /!/.test(s.slice(T[i].s, T[i].s + 80))));
    if (!who) {
      if (k === 'base' && subj !== 'coord' && leadOf(T, i)) {
        // no subject at the start: a question with "you" left out ("See?", "Want some bread?"), or a command
        return questionAt(T, i, s) ? personOK([2, '*'], w, tl) : commandOK(w);
      }
      // after "and" or a comma (its subject further back): what the English form says ("sings" is he / she / it), and after "and"
      // in a sentence that starts with a command ("Go and train"), a command
      if (k === 's') return canBe(w, 3, 's');
      if (k === 'base') return canAny(w, [[1, 's'], [2, 's'], [1, 'p'], [2, 'p'], [3, 'p']]) || (subj === 'coord' && commandOK(w) && !/^\s*(i|you|he|she|it|we|they|the|a|an|my|your|his|her|our|their)\b/i.test(sentenceOf(T, i, s)));
      return true;                                                    // (a past says no person: anyone's)
    }
    if (k === 's' && !(who[0] === 3 && who[1] !== 'p') && who[0] !== 0) return false;     // ("sings" is he / she / it)
    if (k === 'base' && who[0] === 3 && who[1] === 's') return false;
    return personOK(who, w, tl);
  }
  // the sentence the verb at token i is in, up to it (for "Go and train": does it start with a subject?)
  function sentenceOf(T, i, s) { let j = i; while (j > 0 && !T[j].start) j--; return s.slice(T[j].s, T[i].s); }

  // ============================================================ mixing: the English line with your words in the language
  // o: { force (ids pre-taught just now: in the language, glossed), pos (allowed parts of speech), w (the weave), pre / post (the
  //      English before and after this stretch, when story.js mixes a line in pieces between its {w.*} slots: who the subject is,
  //      where sentences start, whether it's a question) }
  // → parts in ui.js's weave format: { s } plain, or { s, id, tl: true, en, gl, src, cap, len } (+ lex, did: what to count)
  function parts(t, en, o = {}) {
    const w = o.w != null ? o.w : W(), force = o.force instanceof Set ? o.force : new Set(o.force || []);
    const pre = String(o.pre || ''), full = pre + en + String(o.post || ''), off = pre.length, end0 = off + en.length;
    const T = enTokens(full), TL = words(t), cands = [];
    const first = T.findIndex(x => x.s >= off && x.s < end0);         // (this stretch's words, first to last; the others are context)
    let last = -1; for (let k = T.length - 1; k >= 0; k--) if (T[k].s >= off && T[k].s < end0) { last = k; break; }
    const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    // (a de verb whose particle stands on its own, «Ruf … an»: the verb alone would drop its particle, so it stays English)
    const sepIds = new Set(TL.filter(x => x.sep).map(x => x.id));
    for (const x of TL) {
      if (!x.e || x.name || x.pos === 'name' || !CP.includes(x.pos) || (o.pos && !o.pos.includes(x.pos))) continue;
      // A word with a pronoun on its end stays English, in every person and form: «Llámelo» swapped for "Call" in "Call it
      // from…" would say "it" twice («Llámelo it»). The pack marks them (via 'clitic': «dámelo», «mírala», «tráemelo», «verte»,
      // «comiéndolo», «dime», pt «chame-o», «chamá-la»); a pt hyphen, or an es infinitive / gerund longer than itself, too.
      const clitic = !isC() && (x.via === 'clitic' || (x.pos === 'v' && /-/.test(x.t)) || (x.f && ((x.f.form === 'inf' && fold(x.t) !== fold(x.e.lemma)) || (x.f.form === 'ger' && /(me|te|se|lo|la|le|nos|los|las|les)$/.test(fold(x.t))))));
      if (clitic || x.sep || sepIds.has(x.id) || NOSWAP.has(x.id)) continue;
      const md = force.has(x.id) ? 'new' : mode(x.e, w);
      if (md === 'en') continue;
      cands.push(Object.assign({ md }, x));
    }
    if (!cands.length || first < 0) return [{ s: en }];
    // where each candidate's word could be in the English: every place that fits that form itself (two forms of one verb in a
    // line, «Digo … diría», each need a place that fits them: the 1st person present isn't "says", the conditional is nobody's)
    const hits = new Map();            // id → { tl: [cands], at: [{ i, n, ok: Map(cand index → k) }] }
    for (const c of cands) {
      let g = hits.get(c.id);
      if (!g) { g = { tl: [], at: [] }; hits.set(c.id, g); }
      const ci = g.tl.length; g.tl.push(c);
      for (const F of formsOf(c.e)) {
        for (let i = first; i + F.ws.length - 1 <= last; i++) {
          if (T.slice(i, i + F.ws.length).some((x, j) => x.guard || x.low !== F.ws[j] || (j > 0 && x.brk))) continue;
          if (F.ws.length === 1 && STOP.has(T[i].low)) continue;
          if (HAVE.has(T[i].low) && F.ws[0] === 'have' && T[i + 1] && /(ed|en)$/.test(T[i + 1].low)) continue;       // (have + a participle: a helper)
          if (c.pos === 'v' && !verbOK(F.k, c, T, i, t, full)) continue;
          if (c.pos === 'n' && !numberOK(F, c)) continue;
          const n = F.ws.length;
          let a0 = g.at.find(a => a.i === i && a.n === n);
          if (!a0) g.at.push(a0 = { i, n, ok: new Map() });
          if (!a0.ok.has(ci)) a0.ok.set(ci, F.k);
        }
      }
    }
    // (one place per stretch of English, the longest: «sabes» is "know how to" in "know how to count", «demasiado» "too much")
    for (const [, g] of hits) {
      g.at = g.at.filter(a => !g.at.some(b => b !== a && b.n > a.n && b.i <= a.i && a.i + a.n <= b.i + b.n) && !g.at.some(b => b !== a && b.n === a.n && b.i < a.i && a.i < b.i + b.n));
      g.at.sort((a, b) => a.i - b.i);
    }
    // sure matches only: as many places in the English as times in the line, each form in the place that fits it (in order), each
    // English word claimed once (an English word two different words wanted is 'x', and takes both of their spans down with it)
    const claim = new Map();           // token index → { c, n, first, k } | 'x'
    for (const [, g] of hits) {
      if (!g.at.length || g.at.length !== g.tl.length || g.at.some((a, j) => !a.ok.has(j))) continue;
      g.at.forEach((a, j) => { for (let q = a.i; q < a.i + a.n; q++) claim.set(q, claim.has(q) ? 'x' : { c: g.tl[j], n: a.n, first: q === a.i, k: a.ok.get(j) }); });
    }
    // An infinitive takes the "to" in front along when the verb before it is in the language too: «quiere abrir» is "she [quiere]
    // [abrir]", never "[quiere] to [abrir]". When that verb stays English, so does its "to": "He wanted to [singen] too", never
    // "He wanted [singen] too". Not when the line has its own little word there («voy a comer», «tengo que comer», «zu essen»),
    // or when the "to" is already part of another word ("know how to"). (A "to" that starts its clause goes too: "To [cantar]…")
    const woven = q => { const v = claim.get(q); return !!v && v !== 'x'; };
    for (const [q, v] of [...claim]) {
      if (v === 'x' || !v.first || v.k !== 'base' || !(v.c.f && v.c.f.form === 'inf') || q - 1 < first || claim.has(q - 1) || T[q - 1].low !== 'to' || T[q].brk || T[q - 1].guard) continue;
      if (TO_TL.test(fold(v.c.prev)) || /^(going|have|has|had|ought|used|able)$/.test((T[q - 2] || {}).low || '')) continue;
      if (!(woven(q - 2) && !T[q - 1].brk) && !(T[q - 1].start || T[q - 1].brk || q - 1 === 0)) continue;
      const n = v.n + 1; claim.set(q - 1, { c: v.c, n, first: true, k: v.k });
      for (let d = 0; d < v.n; d++) claim.set(q + d, { c: v.c, n, first: false, k: v.k });
    }
    // The same for "is" + -ing when the line has a plain present: «Inés me enseña» is "Inés [enseña] me", not "Inés is [enseña] me";
    // the camp «canta» is "the camp [canta] again" ("is singing": he / she / it, now). Only a plain am / is / are / was / were (or,
    // es / pt, "I'm", "they're": the verb says who), never "isn't" (its "not" would go) or "be" after a helper ("I'll [espero]").
    // A finite verb in an -ing place that can't take its "is" along stays English. (A gerund keeps it: «estoy comiendo» is "I'm
    // [comiendo]", its «estoy» is the "am".) ja: 歌っている takes a plain "is" along; zh: a plain am / is / are, never "they're"
    // (a zh verb doesn't say who) or "was" (nor when); otherwise zh keeps the English "is" and nothing is lost.
    for (const [q, v] of [...claim]) {
      if (v === 'x' || !v.first || v.k !== 'ing' || !v.c.f || v.c.f.form) continue;
      const b = T[q - 1], bl = b ? b.low : '';
      if (L() === 'zh' && !/^(am|is|are)$/.test(bl)) continue;
      if (L() === 'ja' && v.c.f.asp !== 'prog') continue;
      const takes = isC() || L() === 'de' ? !!BEP[bl] : !!(BEP[bl] || CSUBJ[bl]);
      if (q >= 1 && !claim.has(q - 1) && b && !T[q].brk && !b.guard && takes && q - 1 >= first) {
        const n = v.n + 1; claim.set(q - 1, { c: v.c, n, first: true, k: v.k });
        for (let d = 0; d < v.n; d++) claim.set(q + d, { c: v.c, n, first: false, k: v.k });
      } else if (L() !== 'zh') for (let d = 0; d < v.n; d++) claim.set(q + d, 'x');
    }
    const out = [], tokPart = new Map(), glossed = new Set(); let at = off;
    for (let i = first; i <= last; i++) {
      const v = claim.get(i);
      if (!v || v === 'x' || !v.first) continue;
      if (Array.from({ length: v.n }, (_, d) => claim.get(i + d)).some(x => !x || x === 'x')) continue;
      const tok = T[i], end = T[i + v.n - 1].e;
      const p = partOf(v.c, full.slice(tok.s, end), tok.start);
      let gap = tok.s > at ? full.slice(at, tok.s) : '';
      // (English "a" / "an" goes with the word that follows now: "an [viejos]" → "a [viejos]", "a [ojo]" → "an [ojo]")
      if (!p.src) gap = gap.replace(/\b(a|an|A|An)(\s+)$/, (m, a, sp) => ((/^[aeiouáéíóúàâêôãõäöü]/i.test(p.s.replace(/^[¿¡]/, '')) ? 'an' : 'a').replace(/^a/, a[0]) + sp));
      if (gap) out.push({ s: gap });
      if (p.gl) { if (glossed.has(p.id)) delete p.gl; else glossed.add(p.id); }      // (glossed once a line)
      out.push(p); for (let d = 0; d < v.n; d++) tokPart.set(i + d, p);
      at = end; i += v.n - 1;
    }
    if (at < end0) out.push({ s: full.slice(at, end0) });
    if (L() === 'es' && tokPart.size) openers(T, tokPart, full);
    return out.length ? out : [{ s: en }];
  }
  function partOf(c, enText, start) {
    const lx = lexOf(c.e), p = { id: lx || c.id, tl: true, en: enText.replace(/\s+/g, ' ') };
    if (lx) p.lex = lx; else p.did = c.id;
    if (c.src) {
      p.src = c.src; p.cap = !!start;
      p.s = CJK.plain(c.src, { lang: L(), cap: p.cap }); p.len = CJK.len(c.src, { lang: L(), cap: p.cap });
    } else {
      let s = c.t;
      const keepCap = c.pos === 'name' || (L() === 'de' && c.pos === 'n') || /^\p{Lu}{2,}$/u.test(s.replace(/[^\p{L}]/gu, ''));     // (a shout, «HOLA», stays as it is)
      if (!keepCap) s = s.charAt(0).toLowerCase() + s.slice(1);
      if (start) s = s.charAt(0).toUpperCase() + s.slice(1);
      p.s = s;
    }
    if (c.md === 'new' && wvOf(p) < 3) p.gl = p.en;
    return p;
  }
  // es: a question or exclamation that came out all in Spanish gets its ¿ / ¡ («¡Hola, hola!», «¿Pan?»)
  function openers(T, tokPart, en) {
    let s0 = 0;
    for (let i = 1; i <= T.length; i++) {
      if (i < T.length && !T[i].start) continue;
      const range = T.slice(s0, i);
      if (range.length && range.every((x, j) => !x.guard && tokPart.has(s0 + j))) {
        const tail = en.slice(T[i - 1].e).match(/^[^\p{L}«]*?([.!?…])/u), mk = tail && tail[1], first = tokPart.get(s0);
        if ((mk === '?' || mk === '!') && first && !/^[¿¡]/.test(first.s)) first.s = (mk === '?' ? '¿' : '¡') + first.s;
      }
      s0 = i;
    }
  }
  // how often a woven word has been said (its gloss shows the first three times)
  const wvOf = p => (p.lex ? (LEX.wv ? LEX.wv(p.lex) : 0) : (per('wv')[p.did] || 0));
  // count a line's woven words once, when it's said
  function note(ps) {
    for (const p of ps || []) {
      if (!p || !p.tl) continue;
      try { if (p.lex) LEX.woven(p.lex); else if (p.did) { const v = per('wv'); v[p.did] = (v[p.did] || 0) + 1; } } catch (e) { /* */ }
    }
  }

  // ============================================================ a line: mixed, or (as the weave rises) whole in the language
  // The line in the language as HTML, with some words marked (taught just now: highlighted, with their English)
  function tlHTML(t, mark) {
    const l = L();
    if (!mark || !mark.size) return isC() ? CJK.html(t, { lang: l }) : E(t);
    const ws = words(t);
    if (isC()) {          // (chunk by chunk, so a marked word can be wrapped; spaces between words in pinyin / rōmaji)
      let out = '', cap = true;
      const roman = CJK.mode(l) !== 'chars';
      for (const ch of String(t).match(CJ_CHUNK) || []) {
        const pun = /^[\p{P}\p{S}]+$/u.test(ch), w = !pun && ws.find(x => x.src === ch && mark.has(x.id)), h = CJK.html(ch, { lang: l, cap });
        out += (out && roman && !pun ? ' ' : '') + (w ? `<span class="w mx-new" data-en="${E(mark.get(w.id) || '')}">${h}</span>` : h);
        cap = pun ? /[。！？.!?「『“]/.test(ch) || cap : false;
      }
      return out;
    }
    let out = '', at = 0;
    for (const w of ws) {
      if (!mark.has(w.id) || w.s == null || w.s < at) continue;
      out += E(t.slice(at, w.s)) + `<span class="w mx-new" data-en="${E(mark.get(w.id) || '')}">${E(t.slice(w.s, w.end))}</span>`;
      at = w.end;
    }
    return out + E(t.slice(at));
  }
  function line(t, en, o = {}) {
    t = String(t == null ? '' : t); en = String(en == null ? '' : en);
    const fallback = { full: true, html: tlHTML(t), en, under: false, parts: null, say: t };     // (under: never by default, DESIGN.md 17.3)
    if (!t) return { full: false, html: E(en), en, under: false, parts: [{ s: en }], say: '' };
    if (!en || !ok()) return fallback;
    try {
      const w = W(), full = !o.noFull && UI.fullLine(o.key || t, w);
      if (full) {
        const force = o.force instanceof Set ? o.force : new Set(o.force || []), mark = new Map();
        if (force.size) for (const x of words(t)) if (force.has(x.id)) mark.set(x.id, glossIn(x, t, en));
        return { full: true, html: tlHTML(t, mark), en, under: false, parts: null, say: t };          // (its English: EN, on request)
      }
      const ps = parts(t, en, Object.assign({ w }, o));
      if (o.count) note(ps);
      return { full: false, html: UI.partsHTML(ps), en, under: false, parts: ps, say: t };
    } catch (e) { console.error('[mix]', e); return fallback; }
  }
  const html = (t, en, o) => line(t, en, o).html;

  // ============================================================ words to teach before a question (DESIGN.md 16; 7.9: hear it, try it, use it)
  // The content words of a line in the language you haven't met yet: not known (DICT.level < 2), not taught to Mimo, not
  // taught in a talk, not already coming in through the weave. o.skip: ids taught just now. o.inText: a set of ids the
  // piece itself used (reading: those count as met). o.en: the line's English (for each word's English in context).
  // → [{ id, t, src, lemma, en (its English here), icon, pos, lex }]
  const TEACH_POS = ['n', 'v', 'adj', 'adv', 'int'];
  function newWords(t, o = {}) {
    if (typeof DICT === 'undefined' || !t) return [];
    const out = [], seen = new Set();
    for (const x of words(t)) {
      if (!x.e || seen.has(x.id) || x.name || !TEACH_POS.includes(x.pos) || isBe(x.e)) continue;
      seen.add(x.id);
      if ((o.skip && o.skip.has && o.skip.has(x.id)) || (o.inText && o.inText.has(x.id)) || known(x.id)) continue;
      const shown = x.src || (L() === 'de' && x.pos === 'n') ? x.t : x.t.charAt(0).toLowerCase() + x.t.slice(1);      // («Voy» → «voy»: a word, not a sentence)
      out.push({ id: x.id, t: shown, src: x.src || null, lemma: x.e.lemma || x.t, en: glossIn(x, t, o.en), icon: iconOf(x.e), pos: x.pos, lex: lexOf(x.e) });
    }
    return out;
  }
  // a word's English in its line: the word it is in the line's translation, when that's sure ("Estoy bien." / "I'm fine." →
  // "fine"), else the pack's reading of the form («comiste: you ate (comer…)» → "you ate"), else its gloss
  function enMatch(x, en) {
    const T = enTokens(en), found = new Set();
    if (!T.length || !x.e) return '';
    for (const F of formsOf(x.e)) for (let i = 0; i + F.ws.length <= T.length; i++) {
      if (T.slice(i, i + F.ws.length).some((y, j) => y.guard || y.low !== F.ws[j] || (j > 0 && y.brk))) continue;
      if (F.ws.length === 1 && STOP.has(T[i].low)) continue;
      found.add(en.slice(T[i].s, T[i + F.ws.length - 1].e).toLowerCase());
    }
    return found.size === 1 ? [...found][0] : '';
  }
  function glossIn(x, t, en) {
    const hit = en ? enMatch(x, en) : '';
    if (hit) return hit;
    let g = null;
    try { g = DICT.gloss(isC() ? CJK.chars(x.src || x.t, { lang: L() }) : x.t, { text: isC() ? CJK.chars(t, { lang: L() }) : t }); } catch (e) { g = null; }
    const form = g && g.form ? String(g.form) : '';
    const m = form.match(/^[^:]+:\s*([^(]+?)\s*(\(|$)/);
    const s = (m && m[1]) || (g && g.en) || (x.e && x.e.en) || '';
    return String(s).replace(/\([^)]*\)/g, '').split(/[;,]/)[0].trim();
  }
  // a picture for a word, where one exists: its LEX item's icon (icons.js), as an image
  const pics = {};
  function iconOf(e) {
    const lx = lexOf(e), key = lx && LEX.item(lx).icon;
    if (!key || typeof ICONS === 'undefined' || !ICONS.keys.includes(key)) return '';
    if (pics[key] === undefined) { try { pics[key] = ICONS.canvas(key, 72).toDataURL(); } catch (er) { pics[key] = ''; } }
    return pics[key];
  }
  // the ids of a line's content words (the audits and the talk's "only known or just-taught" check use it)
  const ids = (t, pos = TEACH_POS) => words(t).filter(x => x.e && !x.name && pos.includes(x.pos) && !isBe(x.e)).map(x => x.id);
  // A new player's words at a point in the story, for the audits (TALK._.audit, READ._.audit), as the current language's DICT
  // ids: 0 meeting the town (the prologue's words, lang/words.js), 1 after the big one on the hill (+ the first fights' verbs
  // and colors, the hushling, yes and thanks), 2 from the first bell on (all of Mimo's words). An estimate, and it says so.
  function baseline(p) {
    const lex = new Set();
    try { if (typeof WORDS !== 'undefined') WORDS.forEach(w => lex.add(w.id)); } catch (e) { /* */ }
    if (p >= 1) {
      try { (BATTLE._.ITEMS || []).forEach(it => { if (/^(v|a)\./.test(it.id) || it.id === 'n.hushling') lex.add(it.id); }); } catch (e) { /* */ }
      lex.add('c.yes'); lex.add('c.thanks');
    }
    if (p >= 2) for (const id of LEX.ids()) { const it = LEX.item(id); if (it && !['phrase', 'number', 'key'].includes(it.kind)) lex.add(id); }
    const out = new Set(), pk = DICT.pack();
    if (pk && pk.entries) for (const e of pk.entries.values()) { const lx = lexOf(e); if (lx && lex.has(lx)) out.add(e.id); }
    return out;
  }

  return {
    ok, line, html, parts, tlHTML, note, words, ids, newWords, known, mode, taught, isTaught, iconOf, glossIn, isBe, baseline,
    _: { variants, formsOf, vForms, plural, enTokens, verbOK, subjectOf, leadOf, canBe, jaOK, share, st, per, cache, TEACH_POS },
  };
})();
