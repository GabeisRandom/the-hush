'use strict';
// zh: the Chinese dictionary pack (DESIGN.md 15.2; the contract is game/FLUENT.md, the notation game/CJK.md).
// Mandarin, Simplified characters. DICT.register('zh', make): make() parses the word list at the bottom of this file (one
// headword per line), builds the indexes, links LEX's words and returns the pack (entries, tokens, analyze, check, fix,
// gloss, inflect, find, connectors, fillers).
//
// What you type can be characters (with or without spaces), pinyin with tone marks, tone digits or no tones (with or
// without spaces), or a mix. It becomes a row of units (a character, a pinyin syllable with the tone you typed, a number,
// a Latin word, punctuation), and a lattice picks the cheapest cover by dictionary words: a word costs about 1 (+0.5 for
// each typed tone that isn't the word's, +0.15 for a space inside it in pinyin, +0.6 in characters), an unknown unit 4.
// Context rules then choose between words that sound the same (只 after a number is the measure word, «ma» at the end is
// 吗, «he» before a drink is 喝). Notation ([吃|chī] …) is read too: brackets are word breaks and readings pick the sense.
//
// A headword line:   苹果 píng guǒ n1 apple #个 @food =w.apple
//   the characters (#tag when two headwords share them: 只#cl) · one syllable per character · part of speech + band
//   (n v adj adv pron det prep conj num int cl name phrase part; 1 A1 … 4 B2) · the English · then any of:
//   #个,只 measure words (#- none needed) · @food,drink tags · =w.apple LEX ids (the first is entry.lex) · + or - (val)
//   %flags: tp / tf / tn (a past / future / other point-time word) · hab (habitual: 常常) · q (a question word) · qq (only
//   ever a question: 为什么) · sfp (sentence-final particle) · st (stative verb: 不 even in the past) · mod (takes a verb
//   after it: 想 要 会) · conn (connector) · hypo · fut · ng (an adjective that doesn't take 很) · p1 p2 p3 pl formal
//   (pronouns) · d (这 那 每 几: a measure word follows) · part (a partitive measure word: 杯 块 些) · dur (a duration)
//   · ncl (fine without a measure word) · asp (了 过 着) · neg (不 没) · fill (a filler) · zai (住在: 在 after the verb)

(() => {
  if (typeof DICT === 'undefined' || typeof CJK === 'undefined') return;
  const W = [];                       // the word list, in chunks (the bottom of this file)

  // ------------------------------------------------------------ pinyin
  const SYL = new Set();
  ('|a ai an ang ao e ei en eng er o ou;b|a ai an ang ao ei en eng i ian iao ie in ing o u;p|a ai an ang ao ei en eng i ian iao ie in ing o ou u;'
    + 'm|a ai an ang ao e ei en eng i ian iao ie in ing iu o ou u;f|a an ang ei en eng o ou u;d|a ai an ang ao e ei en eng i ia ian iao ie ing iu ong ou u uan ui un uo;'
    + 't|a ai an ang ao e ei eng i ian iao ie ing ong ou u uan ui un uo;n|a ai an ang ao e ei en eng i ian iang iao ie in ing iu ong ou u uan ue uo;'
    + 'l|a ai an ang ao e ei eng i ia ian iang iao ie in ing iu o ong ou u uan ue un uo;g|a ai an ang ao e ei en eng ong ou u ua uai uan uang ui un uo;'
    + 'k|a ai an ang ao e ei en eng ong ou u ua uai uan uang ui un uo;h|a ai an ang ao e ei en eng ong ou u ua uai uan uang ui un uo;'
    + 'j|i ia ian iang iao ie in ing iong iu u uan ue un;q|i ia ian iang iao ie in ing iong iu u uan ue un;x|i ia ian iang iao ie in ing iong iu u uan ue un;'
    + 'zh|a ai an ang ao e ei en eng i ong ou u ua uai uan uang ui un uo;ch|a ai an ang ao e en eng i ong ou u ua uai uan uang ui un uo;'
    + 'sh|a ai an ang ao e ei en eng i ou u ua uai uan uang ui un uo;r|an ang ao e en eng i ong ou u ua uan ui un uo;'
    + 'z|a ai an ang ao e ei en eng i ong ou u uan ui un uo;c|a ai an ang ao e en eng i ong ou u uan ui un uo;s|a ai an ang ao e en eng i ong ou u uan ui un uo;'
    + 'y|a an ang ao e i in ing o ong ou u uan ue un;w|a ai an ang ei en eng o u')
    .split(';').forEach(g => { const [ini, fin] = g.split('|'); fin.split(' ').forEach(f => SYL.add(ini + f)); });
  SYL.add('r');                                   // (erhua's 儿, typed on its own: yihuir, nar, wanr)
  const MARK = new Map();                         // ǎ → ['a', 3]
  [['a', 'āáǎà'], ['e', 'ēéěè'], ['i', 'īíǐì'], ['o', 'ōóǒò'], ['u', 'ūúǔù'], ['u', 'ǖǘǚǜ']].forEach(([b, m]) =>
    [...m].forEach((c, k) => { MARK.set(c, [b, k + 1]); MARK.set(c.toUpperCase(), [b, k + 1]); }));
  MARK.set('ü', ['u', 0]); MARK.set('Ü', ['u', 0]);
  const toneless = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/v/g, 'u').replace(/[^a-z]/g, '');
  const toneOf = y => { const d = String(y).normalize('NFD'); return /̄/.test(d) ? 1 : /́/.test(d) ? 2 : /̌/.test(d) ? 3 : /̀/.test(d) ? 4 : 0; };
  const pyShow = py => CJK.pyJoin(String(py).split(' '));
  // a syllable as written in the word list → [toneless, tone] (no Unicode normalizing: it runs for every syllable at build)
  function sylInfo(y) {
    let base = '', tone = 0;
    for (const c of y) {
      const m = MARK.get(c);
      if (m) { base += m[0]; if (m[1]) tone = m[1]; continue; }
      if (c >= '̀' && c <= 'ͯ') { tone = { '̄': 1, '́': 2, '̌': 3, '̀': 4 }[c] || tone; continue; }   // (a decomposed mark)
      const l = c.toLowerCase();
      if (l >= 'a' && l <= 'z') base += l === 'v' ? 'u' : l;
    }
    return [base, tone];
  }
  // letters → syllables, the way pinyin is written (fewest pieces; inside a word a syllable starting with a / o / e has
  // an apostrophe, so «dangao» is dàn gāo). → [[start, end), …] or null when a letter is left over (not pinyin)
  function segOrtho(s) {
    const n = s.length, best = new Array(n + 1).fill(Infinity), prev = new Array(n + 1).fill(-1);
    best[0] = 0;
    for (let i = 0; i < n; i++) {
      if (best[i] === Infinity) continue;
      for (let k = 1; k <= 6 && i + k <= n; k++) {
        const p = s.slice(i, i + k);
        if (!SYL.has(p)) continue;
        const c = best[i] + (p === 'r' ? 1.3 : i > 0 && /^[aoe]/.test(p) ? 1.01 : 1);
        if (c <= best[i + k]) { best[i + k] = c; prev[i + k] = i; }
      }
    }
    if (best[n] === Infinity) return null;
    const out = [];
    for (let j = n; j > 0; j = prev[j]) out.unshift([prev[j], j]);
    return out;
  }

  // ------------------------------------------------------------ numbers
  const NUMC = { '零': 0, '〇': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '百': 100, '千': 1000, '万': 10000, '亿': 100000000 };
  const NUMPY = { ling: '零', yi: '一', er: '二', liang: '两', san: '三', si: '四', wu: '五', liu: '六', qi: '七', ba: '八', jiu: '九', shi: '十', bai: '百', qian: '千', wan: '万' };
  const NUM_R = { '零': 'líng', '〇': 'líng', '一': 'yī', '二': 'èr', '两': 'liǎng', '三': 'sān', '四': 'sì', '五': 'wǔ', '六': 'liù', '七': 'qī', '八': 'bā', '九': 'jiǔ', '十': 'shí', '百': 'bǎi', '千': 'qiān', '万': 'wàn', '亿': 'yì' };
  function numVal(chars) {
    let total = 0, sec = 0, cur = 0;
    for (const c of chars) {
      const d = NUMC[c];
      if (d < 10) cur = cur * 10 + d;
      else if (d < 10000) { sec += (cur || 1) * d; cur = 0; }
      else { total += ((sec + cur) || 1) * d; sec = 0; cur = 0; }
    }
    return total + sec + cur;
  }
  const FW_DIGIT = c => (c >= '０' && c <= '９' ? String.fromCharCode(c.charCodeAt(0) - 0xFEE0) : c);
  const isDigit = c => /[0-9０-９]/.test(c);

  // ------------------------------------------------------------ English forms (for glosses: 吃了 → ate)
  const IRR = ('be was been;have had had;do did done;go went gone;come came come;eat ate eaten;drink drank drunk;see saw seen;say said said;'
    + 'speak spoke spoken;take took taken;give gave given;get got gotten;make made made;buy bought bought;sell sold sold;write wrote written;'
    + 'read read read;sleep slept slept;sit sat sat;stand stood stood;run ran run;swim swam swum;sing sang sung;think thought thought;'
    + 'know knew known;find found found;leave left left;meet met met;teach taught taught;begin began begun;bring brought brought;'
    + 'wear wore worn;win won won;lose lost lost;fly flew flown;fall fell fallen;feel felt felt;hear heard heard;hold held held;keep kept kept;'
    + 'let let let;put put put;send sent sent;spend spent spent;tell told told;understand understood understood;become became become;'
    + 'break broke broken;choose chose chosen;draw drew drawn;drive drove driven;forget forgot forgotten;grow grew grown;hit hit hit;'
    + 'hurt hurt hurt;ride rode ridden;steal stole stolen;throw threw thrown;wake woke woken;cut cut cut;pay paid paid;catch caught caught;'
    + 'fight fought fought;feed fed fed;build built built;lend lent lent;hang hung hung;dig dug dug;blow blew blown;bite bit bitten;'
    + 'hide hid hidden;shake shook shaken;sweep swept swept;set set set;cost cost cost;light lit lit;mean meant meant;freeze froze frozen;'
    + 'forgive forgave forgiven;show showed shown;lie lay lain;ring rang rung;shoot shot shot;shut shut shut;stick stuck stuck;sting stung stung;'
    + 'lead led led;bend bent bent;deal dealt dealt;dream dreamt dreamt;smell smelt smelt;spell spelt spelt;learn learned learned;'
    + 'wind wound wound;slide slid slid;spin spun spun;split split split;quit quit quit;bet bet bet;rise rose risen;tear tore torn;'
    + 'bear bore borne;swear swore sworn;fit fit fit;weep wept wept;seek sought sought;arise arose arisen;awake awoke awoken;'
    + 'can could could;will would would')
    .split(';').reduce((m, s) => { const [a, b, c] = s.split(' '); m[a] = [b, c]; return m; }, {});
  const DBL = new Set('stop plan shop drop chat jog hug rob nod beg clap hop skip ship step trip tap wrap admit prefer refer regret control swim sit run get cut set put hit win begin forget dig spin shut quit bet fit grab drag rub chop knit pat pet ban fan jam mop nap rip sob tug wag zip'.split(' '));
  const enVerb = en => { const s = String(en || '').split(/[,;/(]/)[0].trim().replace(/^to /, ''); const m = s.match(/^(\S+)(.*)$/); return m ? [m[1], m[2]] : ['', '']; };
  function enPast(en) {
    const [v, rest] = enVerb(en); if (!v) return en;
    let p = IRR[v] ? IRR[v][0] : null;
    if (!p) p = /e$/.test(v) ? v + 'd' : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + 'ied' : DBL.has(v) ? v + v.slice(-1) + 'ed' : v + 'ed';
    return p + rest;
  }
  function enPart(en) { const [v, rest] = enVerb(en); if (!v) return en; return (IRR[v] ? IRR[v][1] : enPast(v)) + rest; }
  function enIng(en) {
    const [v, rest] = enVerb(en); if (!v) return en;
    const g = v === 'be' ? 'being' : /ie$/.test(v) ? v.slice(0, -2) + 'ying' : /[^eoy]e$/.test(v) ? v.slice(0, -1) + 'ing' : DBL.has(v) ? v + v.slice(-1) + 'ing' : v + 'ing';
    return g + rest;
  }
  const enBase = en => { const [v, rest] = enVerb(en); return v ? v + rest : en; };

  // ------------------------------------------------------------ the word list → entries
  const POS = { n: 1, v: 1, adj: 1, adv: 1, pron: 1, det: 1, prep: 1, conj: 1, num: 1, int: 1, cl: 1, name: 1, phrase: 1, part: 1 };
  function parseLine(line, n) {
    const t = line.split(/\s+/);
    let head = t[0], tag = '';
    const h = head.indexOf('#');
    if (h > 0) { tag = head.slice(h + 1); head = head.slice(0, h); }
    const chars = [...head], k = chars.length;
    if (!k || !chars.every(c => CJK.isHan(c))) return null;
    const py = t.slice(1, 1 + k);
    if (py.length !== k) return null;
    const info = py.map(sylInfo);
    if (info.some(([b]) => !SYL.has(b) && b !== 'm' && b !== 'n' && b !== 'ng')) return null;
    const m = (t[1 + k] || '').match(/^([a-z]+)([1-4])$/);
    if (!m || !POS[m[1]]) return null;
    const e = { id: 'zh:' + head + (tag ? '#' + tag : ''), ch: head, py: py.join(' '), lemma: '[' + head + '|' + py.join(' ') + ']', pos: m[1], band: +m[2],
      en: '', tags: [], fl: {}, n, syl: info.map(x => x[0]), tone: info.map(x => x[1]) };
    const en = [];
    for (const x of t.slice(2 + k)) {
      if (x[0] === '#' && x.length > 1) { if (x === '#-') e.fl.ncl = true; else { e.cls = x.slice(1).split(','); e.cl = e.cls[0]; } }
      else if (x[0] === '@' && x.length > 1) e.tags.push(...x.slice(1).split(','));
      else if (x[0] === '=' && x.length > 1) { e.lexs = x.slice(1).split(','); e.lex = e.lexs[0]; }
      else if (x[0] === '%' && x.length > 1) x.slice(1).split(',').forEach(f => { e.fl[f] = true; });
      else if (x === '+' || x === '-') e.val = x;
      else en.push(x);
    }
    e.en = en.join(' ');
    return e;
  }

  // ------------------------------------------------------------ the pack
  function make() {
    const E = new Map(), byCh = new Map(), bySyl = new Map(), phrases = new Map(), bad = [], dups = [];
    let maxLen = 1, order = 0;
    const push = (M, k, v) => { let a = M.get(k); if (!a) M.set(k, a = []); a.push(v); };
    function add(e, lattice = true) {
      E.set(e.id, e);
      if (!lattice) { if (!phrases.has(e.ch)) phrases.set(e.ch, e); return; }
      push(byCh, e.ch, e); push(bySyl, e.syl[0], e);
      maxLen = Math.max(maxLen, [...e.ch].length);
    }
    for (const chunk of W) for (const raw of chunk.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('//')) continue;
      const e = parseLine(line, order++);
      if (!e) { bad.push(line); continue; }
      if (E.has(e.id)) { dups.push(e.id); continue; }
      add(e);
    }
    const first = ch => (byCh.get(ch) || [])[0] || null;
    const clEntry = ch => (byCh.get(ch) || []).find(e => e.pos === 'cl') || first(ch);

    // ------------------------------------------------------------ LEX's words (every one resolves to a headword)
    const linked = new Set();
    for (const e of E.values()) if (e.lexs) e.lexs.forEach(x => linked.add(x));
    let lexN = -1, autoN = 0;
    function syncLex() {
      if (typeof LEX === 'undefined' || !LEX.ids) return;
      const ids = LEX.ids();
      if (ids.length === lexN) return;
      lexN = ids.length;
      for (const id of ids) {
        if (linked.has(id)) continue;
        const it = LEX.item(id);
        if (!it || typeof it.zh !== 'string' || !it.zh) continue;
        linked.add(id);
        const toks = CJK.parse(it.zh, 'zh').filter(t => t.segs && t.r);
        const ch = toks.map(t => t.s).join(''), py = toks.map(t => t.r).join(' ');
        if (!ch || [...ch].length !== py.split(' ').length) continue;
        const have = (byCh.get(ch) || [])[0] || phrases.get(ch);
        if (have) { if (!have.lex) have.lex = id; (have.lexs = have.lexs || []).push(id); continue; }
        const one = toks.length === 1, k = it.kind;
        const pos = !one || k === 'phrase' ? 'phrase' : k === 'verb' || /^v\./.test(id) ? 'v' : k === 'number' ? 'num' : /^a\./.test(id) ? 'adj' : 'n';
        const e = { id: 'zh:' + ch + (E.has('zh:' + ch) ? '#' + id : ''), ch, py, lemma: one ? `[${ch}|${py}]` : it.zh, pos, band: k === 'phrase' ? 3 : 2,
          en: it.en || '', tags: [], fl: {}, lex: id, lexs: [id], n: order++, auto: true, syl: py.split(' ').map(toneless), tone: py.split(' ').map(toneOf) };
        add(e, one);
        autoN++;
      }
    }
    syncLex();

    // ------------------------------------------------------------ typed text → units
    // { k: 'han', ch } · { k: 'py', syl (toneless), tone, tt (typed), run, first, cap } · { k: 'num', v } · { k: 'latin', t, cap }
    // · { k: 'punct', p }; all with s, e (the span in the text) and gap (a space before it)
    const LETTER = c => /[A-Za-z]/.test(c) || MARK.has(c);
    function runEnd(s, i) {
      let j = i;
      while (j < s.length) {
        const c = s[j];
        if (LETTER(c) || /[̀-ͯ]/.test(c)) { j++; continue; }
        if ((c === "'" || c === '’') && LETTER(s[j + 1] || '')) { j++; continue; }
        if (c === ':' && /[uU]/.test(s[j - 1] || '')) { j++; continue; }
        if (/[1-5]/.test(c) && j > i && (LETTER(s[j - 1]) || /[̀-ͯ:]/.test(s[j - 1])) && !isDigit(s[j + 1] || '')) { j++; continue; }
        break;
      }
      return j;
    }
    let runN = 0;
    const CAPS = /[A-ZĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛÜ]/;
    function pinyinRun(s, i, j, X, gap) {
      const pieces = [];
      let cur = [];
      for (let p = i; p < j; p++) {
        const c = s[p];
        if (c === "'" || c === '’') { if (cur.length) pieces.push({ L: cur }); cur = []; continue; }
        if (/[1-5]/.test(c)) { if (cur.length) pieces.push({ L: cur, d: +c, di: p }); cur = []; continue; }
        if (/[̀-ͯ]/.test(c)) { const t = { '̄': 1, '́': 2, '̌': 3, '̀': 4 }[c]; if (t && cur.length) cur[cur.length - 1].t = t; continue; }
        if (c === ':') continue;
        const mk = MARK.get(c), lc = c.toLowerCase();
        cur.push({ c: mk ? mk[0] : lc === 'v' ? 'u' : lc, t: mk ? mk[1] : 0, i: p });
      }
      if (cur.length) pieces.push({ L: cur });
      const out = [];
      for (const pc of pieces) {
        const str = pc.L.map(x => x.c).join(''), seg = segOrtho(str);
        if (!seg) { X.push({ k: 'latin', t: s.slice(i, j), s: i, e: j, gap, cap: CAPS.test(s[i]) }); return; }
        seg.forEach(([a, b], q) => {
          const L = pc.L.slice(a, b), last = q === seg.length - 1;
          let tone = Math.max(0, ...L.map(x => x.t)), tt = tone > 0, e = L[L.length - 1].i + 1;
          if (last && pc.d) { tone = pc.d === 5 ? 0 : pc.d; tt = true; e = pc.di + 1; }
          out.push({ k: 'py', syl: str.slice(a, b), tone, tt, s: L[0].i, e });
        });
      }
      const run = ++runN;
      out.forEach((u, q) => { u.gap = q ? false : gap; u.run = run; u.first = !q; u.cap = !q && CAPS.test(s[i]); X.push(u); });
    }
    function unitize(s) {
      const X = [], N = s.length;
      let gap = false;
      for (let i = 0; i < N;) {
        const c = s[i];
        if (/\s/.test(c)) { gap = true; i++; continue; }
        if (CJK.isHan(c)) { X.push({ k: 'han', ch: c, s: i, e: i + 1, gap }); gap = false; i++; continue; }
        if (isDigit(c)) {
          let j = i, v = '';
          while (j < N && (isDigit(s[j]) || (s[j] === '.' && v && isDigit(s[j + 1] || '')))) { v += FW_DIGIT(s[j]); j++; }
          X.push({ k: 'num', v: parseFloat(v), s: i, e: j, gap }); gap = false; i = j; continue;
        }
        if (LETTER(c)) { const j = runEnd(s, i); pinyinRun(s, i, j, X, gap); gap = false; i = j; continue; }
        if (CJK.isKana(c)) { let j = i + 1; while (j < N && CJK.isKana(s[j])) j++; X.push({ k: 'latin', t: s.slice(i, j), s: i, e: j, gap }); gap = false; i = j; continue; }
        let j = i + 1;
        if ('…。.!！?？-—'.includes(c)) while (j < N && s[j] === c) j++;
        X.push({ k: 'punct', p: s.slice(i, j), s: i, e: j, gap }); gap = false; i = j;
      }
      return X;
    }
    // notation ([我|wǒ] [吃|chī] [了|le] 。) → the characters as text, and units that know each bracket and its reading
    function unitizeSrc(src) {
      const X = [];
      let text = '', grp = 0, prevLatin = false;
      for (const t of CJK.parse(src, 'zh')) {
        if (t.kind === 'slot') continue;
        if (t.kind === 'latin') {
          if (prevLatin && t.sp) text += ' ';
          const s0 = text.length; text += t.s;
          if (/^[0-9]+$/.test(t.s)) X.push({ k: 'num', v: +t.s, s: s0, e: text.length, gap: true });
          else X.push({ k: 'latin', t: t.s, s: s0, e: text.length, gap: true, cap: CAPS.test(t.s[0]) });
          prevLatin = true; continue;
        }
        prevLatin = false;
        if (t.kind === 'punct') { const s0 = text.length; text += t.s; X.push({ k: 'punct', p: t.s, s: s0, e: text.length, gap: true }); continue; }
        if (!t.segs) continue;
        grp++;
        let firstU = true;
        for (const g of t.segs) {
          if (!g.han) { const s0 = text.length; text += g.s; X.push({ k: 'latin', t: g.s, s: s0, e: text.length, gap: true }); firstU = true; continue; }
          const cs = [...g.s], sy = String(g.r || '').split(' '), ok = sy.length === cs.length, cap = ok && CAPS.test(sy[0]);
          cs.forEach((c, q) => { const s0 = text.length; text += c; X.push({ k: 'han', ch: c, s: s0, e: text.length, gap: firstU, hard: firstU, grp, rs: ok ? sy[q] : null, cap }); firstU = false; });
        }
      }
      return { text, X };
    }

    // ------------------------------------------------------------ the cheapest cover
    function toneMis(e, k, u, nu) {
      const dt = e.tone[k], tt = u.tone;
      if (!u.tt || dt === tt || !dt) return false;
      const c = [...e.ch][k];
      if (c === '一' || c === '不') return false;          // (they change tone in speech)
      // (a third tone before another one is said as a second: but only if a third tone, or no typed tone, follows: «jí tā» is not 几 他)
      if (dt === 3 && tt === 2 && (!nu || nu.k !== 'py' || !nu.tt || nu.tone === 3 || (e.tone[k + 1] === 3))) return false;
      return true;
    }
    // toneless pinyin: the most common of the words that sound alike (shi 是, zai 在, hui 会, qian 钱 …)
    const TOP = new Set([...'是在有的他那一不没也会要去就和还吗把很好这个大小多想对家天上下里买学做住请跟比到只等玩手爱见书新进远长太真贵快慢鱼水茶菜狗猫花钱叫课次后白']);
    // (a word of several syllables beats the same sounds split into single syllables: «jita» is 吉他, not 几 他)
    const LONGER = 0.25;
    const INTENS = new Set(['很', '太', '非常', '真', '有点', '有点儿', '特别', '比较', '更', '最', '挺', '多么', '十分', '越来越']);
    const PRE_V = new Set(['不', '没', '没有', '别', '也', '都', '就', '还', '想', '要', '会', '能', '可以', '应该', '一起', '已经', '常常', '经常']);
    const readOK = (e, k, rs) => toneless(rs) === e.syl[k] && (!e.tone[k] || !toneOf(rs) || toneOf(rs) === e.tone[k]);
    // a pinyin syllable can be a numeral only if the tone typed (if any) is the numeral's (一 changes its tone; a third tone
    // may be typed as a second before another third)
    const NUM_T = { ling: 2, er: 4, liang: 3, san: 1, si: 4, wu: 3, liu: 4, qi: 1, ba: 1, jiu: 3, shi: 2, bai: 3, qian: 1, wan: 4 };
    const numTone = u => !u.tt || u.syl === 'yi' || u.tone === NUM_T[u.syl] || (NUM_T[u.syl] === 3 && u.tone === 2);
    function cover(X, notation) {
      const n = X.length, best = new Array(n + 1).fill(Infinity), back = new Array(n + 1).fill(null);
      const hanRun = new Array(n + 1).fill(0), pyRun = new Array(n + 1).fill(0);
      for (let i = n - 1; i >= 0; i--) { hanRun[i] = X[i].k === 'han' ? hanRun[i + 1] + 1 : 0; pyRun[i] = X[i].k === 'py' ? pyRun[i + 1] + 1 : 0; }
      const sentStart = i => { for (let q = i - 1; q >= 0; q--) return X[q].k === 'punct' && /[.。!！?？]/.test(X[q].p); return true; };
      // (after a colon, a quote or an ellipsis a capital may just start what's said: a word that fits the tones typed wins there, a
      //  name beats a word they don't fit: «“Hēi!”» is 嘿, «：Lǚ cūnzhǎng» is 吕村长)
      const softStart = i => i > 0 && X[i - 1].k === 'punct' && /[:：“"«「『（(*…]/.test(X[i - 1].p);
      const relax = (j, c, ed) => { if (c < best[j] - 1e-9) { best[j] = c; back[j] = ed; } };
      best[0] = 0;
      for (let i = 0; i < n; i++) {
        const b = best[i];
        if (b === Infinity) continue;
        const u = X[i];
        if (u.k === 'punct') { relax(i + 1, b, { t: 'punct', i, j: i + 1 }); continue; }
        if (u.k === 'num') { relax(i + 1, b + 1, { t: 'num', i, j: i + 1, v: u.v }); continue; }
        if (u.k === 'latin') { relax(i + 1, b + 2, { t: u.cap && !sentStart(i) ? 'name' : 'unk', i, j: i + 1 }); continue; }
        if (u.k === 'han') {
          const R = hanRun[i];
          for (let L = Math.min(R, maxLen); L >= 1; L--) {
            let key = '', gaps = 0, cross = false;
            for (let q = i; q < i + L; q++) { key += X[q].ch; if (q > i) { if (X[q].gap) gaps++; if (X[q].hard) cross = true; } }
            if (cross) continue;
            if ((key === '一点' || key === '一点儿') && i > 0 && X[i - 1].k === 'han' && '十二三四五六七八九两零'.includes(X[i - 1].ch)) continue;
            const list = byCh.get(key);
            if (!list) continue;
            let cands = list, c0 = 1 + 0.01 * list[0].band + 0.6 * gaps;
            if (notation) {
              const sc = list.map(e => ({ e, m: e.syl.reduce((m, y, k) => m + (X[i + k].rs && !readOK(e, k, X[i + k].rs) ? 1 : 0), 0) }));
              sc.sort((a, z) => a.m - z.m || a.e.n - z.e.n);
              cands = sc.map(x => x.e); c0 += 0.5 * sc[0].m;
            }
            relax(i + L, b + c0, { t: 'w', i, j: i + L, cands });
          }
          if (NUMC[u.ch] !== undefined) {
            let L = 0;
            while (L < R && L < 12 && NUMC[X[i + L].ch] !== undefined && !(L && X[i + L].hard)) L++;
            const chs = X.slice(i, i + L).map(x => x.ch);
            relax(i + L, b + 1.02, { t: 'num', i, j: i + L, v: numVal(chs), chs });
          }
          if (notation && u.hard) {          // a whole bracket the dictionary doesn't know: a name, or one unknown word
            let L = 1;
            while (i + L < n && X[i + L].grp === u.grp) L++;
            relax(i + L, b + (u.cap ? 0.5 : 1 + 1.5 * L), { t: u.cap ? 'name' : 'unk', i, j: i + L });     // (known words inside it win: [每个人|…] is 每 个 人)
          }
          relax(i + 1, b + 4, { t: 'unk', i, j: i + 1 });
          continue;
        }
        // a pinyin syllable: every headword whose syllables start here (with a nudge from the word before: 很 → an
        // adjective, a number → a measure word, 不 / 想 → a verb or adjective)
        const R = pyRun[i], ends = new Map(), pb = back[i], pe = pb && pb.t === 'w' ? pb.cands[0] : null;
        const isNumB = pb && (pb.t === 'num' || (pe && (pe.pos === 'num' || pe.fl.d)));
        // (and a noun after a verb or a measure word; 着 / 了 / 过 right after a verb)
        const afterV = !!pe && (pe.pos === 'v' && !pe.fl.mod) || (!!pe && pe.pos === 'cl');
        const nudge = e => (pe && INTENS.has(pe.ch) && e.pos === 'adj' ? -0.8 : 0) + (isNumB && (e.pos === 'cl' || e.ch === '点') ? -0.3 : 0)
          + (pe && PRE_V.has(pe.ch) && (e.pos === 'v' || e.pos === 'adj') ? -0.2 : 0) + (pe && /^(不|没|别|很)$/.test(pe.ch) && e.pos === 'n' ? 0.3 : 0)
          + (afterV && e.pos === 'n' ? -0.2 : 0) + (pe && pe.pos === 'v' && e.fl.asp ? -0.6 : 0);
        for (const e of bySyl.get(u.syl) || []) {
          const L = e.syl.length;
          if (L > R) continue;
          let ok = true, mis = 0, gaps = 0, neut = 0;
          for (let k = 0; k < L; k++) {
            const x = X[i + k];
            if (x.syl !== e.syl[k]) { ok = false; break; }
            if (k && x.gap) gaps++;
            if (toneMis(e, k, x, X[i + k + 1])) mis++;
            else if (x.tt && x.tone && !e.tone[k] && L === 1) neut++;      // (a full tone typed on a one-syllable neutral word: zhè is 这, not 着)
          }
          if (!ok) continue;
          let a = ends.get(L);
          if (!a) ends.set(L, a = []);
          // (pinyin is ambiguous, so rarer words cost more: «wo shi» is 我是, not 卧室; and «shi» alone is 是 before 十)
          // (a one-syllable surname typed in lowercase is rarely meant: «liú» is 留 before 刘)
          // (a space typed inside a rarer word counts more: «nin yao dian» is 要 点, not 药店; «quan zhidao» 全 知道, not 全职 到)
          const nd = nudge(e);
          a.push({ e, c: 1 + 0.35 * (e.band - 1) + 0.9 * mis + 0.4 * neut + (e.band === 4 ? 0.6 : e.band === 3 ? 0.45 : 0.15) * gaps - (TOP.has(e.ch) ? 0.2 : 0) - LONGER * (L - 1) + nd + (e.pos === 'name' && L === 1 && !u.cap ? 0.4 : 0) - (e.pos === 'name' && u.cap && !mis && !sentStart(i) ? 0.3 : 0)
            + (e.auto && mis ? 1.5 : 0), mis, nd });          // (a story's own word read with a tone that isn't its: «tā fàng» is 她放, not 塌方)
        }
        for (const [L, a] of ends) {
          a.sort((x, y) => x.c - y.c || x.e.n - y.e.n);
          relax(i + L, b + a[0].c, { t: 'w', i, j: i + L, cands: a.map(x => x.e), mis: a.map(x => x.mis), nds: a.map(x => x.nd), py: true });
        }
        if (NUMPY[u.syl] && numTone(X[i])) {       // (a typed tone has to fit: «yī wǎn» is 一碗, not 一万; «liú» is 留, not 六)
          let L = 0;
          while (L < R && L < 12 && NUMPY[X[i + L].syl] && numTone(X[i + L])) L++;
          for (let k = L; k >= 1; k--) {
            const chs = X.slice(i, i + k).map(x => NUMPY[x.syl]);
            relax(i + k, b + (k > 1 ? 1.02 : 1.25), { t: 'num', i, j: i + k, v: numVal(chs), chs, py: true });
          }
        }
        if (u.cap && u.first) {             // a capitalized run (a name typed in pinyin): Maria, Ana
          // (in mid-sentence a capital is a name over any but the commonest words: «yī zhī Yīn shīfu» is 殷师傅, not 阴)
          let L = 1;
          while (i + L < n && X[i + L].run === u.run) L++;
          relax(i + L, b + (sentStart(i) ? 3.5 : softStart(i) ? 2 : 1.2), { t: 'name', i, j: i + L });
        }
        relax(i + 1, b + 4, { t: 'unk', i, j: i + 1 });
      }
      const T = [];
      for (let j = n; j > 0;) { const ed = back[j]; T.unshift(ed); j = ed.i; }
      const out = [];                        // one unknown word for a run of unknown units (no space or bracket between)
      for (const t of T) {
        const p = out[out.length - 1], u = X[t.i];
        if (t.t === 'unk' && p && p.t === 'unk' && u.k === X[p.i].k && u.k !== 'latin' && !u.gap && !u.hard && (u.k !== 'py' || u.run === X[p.i].run)) { p.j = t.j; continue; }
        out.push(Object.assign({}, t));
      }
      return out;
    }

    // ------------------------------------------------------------ context: which of the words that sound alike
    const E0 = t => (t && t.t === 'w' ? t.cands[0] : null);
    function pick(t, f) {          // (never against the tones you typed: a word they fit beats one they don't)
      const lo = t.mis ? Math.min(...t.mis) : 0;
      const k = t.cands.findIndex((e, q) => (!t.mis || t.mis[q] === lo) && f(e));
      if (k > 0) {
        const e = t.cands[k]; t.cands = [e].concat(t.cands.filter(x => x !== e));
        if (t.mis) t.mis = [t.mis[k]].concat(t.mis.filter((x, q) => q !== k));
        if (t.nds) t.nds = [t.nds[k]].concat(t.nds.filter((x, q) => q !== k));
      }
      return k >= 0;
    }
    function disamb(T, X) {
      const isNum = t => !!t && (t.t === 'num' || (!!E0(t) && E0(t).pos === 'num'));
      const isDet = t => isNum(t) || (!!E0(t) && !!E0(t).fl.d);
      const endAt = k => { const t = T[k]; return !t || (t.t === 'punct' && /[.。!！?？]/.test(X[t.i].p)); };
      const q = X.some(u => u.k === 'punct' && /[?？]/.test(u.p));
      for (let k = 0; k < T.length; k++) {
        const t = T[k];
        if (t.t !== 'w' || t.cands.length < 2) continue;
        // (a tone you typed that fits a word exactly beats a commoner word it doesn't fit: «shī» is 诗, not 是; «huī» 灰, «zhèn» 镇;
        // unless the words around chose it: «hen hao4» is 很好 with a tone slip, not 很号)
        // (a nudge both words get doesn't count: «yào yóu» is 要游, «liǎng bèi» 两倍, as the tones say)
        if (t.py && t.mis && t.mis[0] > 0 && t.mis.some(m => m === 0)) {
          let kb = -1;
          t.mis.forEach((m, q) => { if (m === 0 && (kb < 0 || (t.nds ? t.nds[q] : 0) < (t.nds ? t.nds[kb] : 0))) kb = q; });
          const eb = t.cands[kb];
          if (!(t.nds && t.nds[0] < (t.nds[kb] || 0) - 0.1)) pick(t, e => e === eb);
        }
        const prev = T[k - 1], next = T[k + 1], nx = E0(next), pv = E0(prev);
        // (a numeral typed toneless right before a verb, an adjective or a little word is rarely the number: «wo jiu lai» is 就;
        // before a noun or a measure word it stays one: «jiu ge ren» 九个人, «san pingguo» 三 苹果, which then lacks its 个)
        // (and before a noun, an adjective or a surname that sounds the same: «bai yeye» 白爷爷, «jiu shouji» 旧手机; with no such reading
        // it stays a number, «san pingguo», so the missing measure word is caught)
        if (t.py && !X[t.i].tt && t.j - t.i === 1 && E0(t).pos === 'num' && NUMPY[X[t.i].syl] && t.cands.some(e => e.pos !== 'num') && nx
          && !(prev && (prev.t === 'num' || (pv && (pv.pos === 'num' || pv.ch === '第'))))) {
          if (['v', 'adj', 'adv', 'pron', 'prep', 'conj', 'part', 'det'].includes(nx.pos)) pick(t, e => e.pos !== 'num');
          else if (nx.pos === 'n' && !nx.fl.ncl && !nx.tags.includes('time')) pick(t, e => e.pos === 'adj' || (e.pos === 'name' && nx.tags.some(g => g === 'people' || g === 'family')));
        }
        // «zhe» after a verb is 着 (看着书), unless a measure word or a number follows (看这本书); a word before it that can be a verb
        // is the verb then: «huá zhe chuán» is 划着船, not 滑 这 船
        if (t.py && !X[t.i].tt && t.cands.some(e => e.ch === '着') && t.cands.some(e => e.ch === '这')) {
          const canV = !!pv && (pv.pos === 'v' || (prev.t === 'w' && prev.py && prev.cands.some(e => e.pos === 'v')));
          const zhe = canV && !(nx && (nx.pos === 'cl' || nx.pos === 'num')) && !(next && next.t === 'num');
          if (zhe && pv.pos !== 'v') pick(prev, e => e.pos === 'v');
          pick(t, e => e.ch === (zhe ? '着' : '这'));
          continue;
        }
        // a measure word after a number or 这 (in pinyin only a common one, or one with a noun after it, or an adjective and a noun:
        // «zhe shu hen hao» is 这书, not 这束; «yì cháng dà yǔ» 一场大雨)
        const nounNext = !!nx && (nx.pos === 'n' || (nx.pos === 'adj' && !!E0(T[k + 2]) && E0(T[k + 2]).pos === 'n'));
        if (isDet(prev) && t.cands.some(e => e.pos === 'cl' && (!t.py || e.band <= 2 || nounNext))) { pick(t, e => e.pos === 'cl' && (!t.py || e.band <= 2 || nounNext)); continue; }
        if (E0(t).pos === 'cl' && !isDet(prev)) pick(t, e => e.pos !== 'cl');
        if (!t.py) continue;
        // pinyin: words that sound the same
        if (pv && /^(很|太|非常|真|有点|有点儿|特别|比较|更|最|挺|多么)$/.test(pv.ch) && t.cands.some(e => e.pos === 'adj')) { pick(t, e => e.pos === 'adj'); continue; }
        // an adjective before 的 after a verb («chi tian de»: 吃甜的, the sweet ones)
        // (not a much rarer one: «chi fan de ren» is 吃饭的人, not 吃烦的人)
        if (nx && nx.ch === '的' && pv && pv.pos === 'v' && t.cands.some(e => e.pos === 'adj' && e.band <= t.cands[0].band + 2)) { pick(t, e => e.pos === 'adj' && e.band <= t.cands[0].band + 2); continue; }
        // «hui» is 回 (go back) before a direction or a place («hui lai», «hui xuexiao», «hui zhongguo»), 会 (can, will) otherwise
        if (t.cands.some(e => e.ch === '回') && t.cands.some(e => e.ch === '会') && !X[t.i].tt) {
          const place = !!nx && (nx.pos === 'n' || nx.pos === 'name') && nx.tags.some(g => /^(place|town|school|home|shop)$/.test(g));
          const dir = !!nx && /^(来|去|到|国|头|家|过)$/.test(nx.ch);
          if (place || dir) { pick(t, e => e.ch === '回'); continue; }
        }
        if (endAt(k + 1) && t.cands.some(e => e.fl.sfp)) { pick(t, e => e.fl.sfp); continue; }
        if (t.cands.some(e => e.ch === '喝') && t.cands.some(e => e.ch === '和')) {
          pick(t, e => e.ch === ((nx && (nx.tags.includes('drink') || nx.fl.asp)) || endAt(k + 1) ? '喝' : '和')); continue;
        }
        if (t.cands.some(e => e.ch === '得') && pv && pv.pos === 'v' && nx && (nx.pos === 'adj' || /^(很|非常|太|真|不)$/.test(nx.ch))) { pick(t, e => e.ch === '得'); continue; }
        if (t.cands.some(e => e.ch === '地') && pv && (pv.pos === 'adj' || pv.pos === 'adv') && nx && nx.pos === 'v') { pick(t, e => e.ch === '地'); continue; }
        if (t.cands.some(e => e.fl.q) && t.cands.some(e => !e.fl.q)) {      // 哪儿 or 那儿: a question mark, or «ni … nar»
          const ma = T.some(x => E0(x) && E0(x).ch === '吗'), you = E0(T[0]) && /^(你|你们|您)$/.test(E0(T[0]).ch);
          pick(t, e => ((q || you) && !ma ? !!e.fl.q : !e.fl.q));
        }
        // (a verb before 了 / 过 / 着; but adjectives and nouns take 了 too, so not a much rarer verb: «da le» is 打了, «shu le» 输了,
        // «shao le» 少了, not 烧了; «duo chang shijian le» 时间了, not 实践了; and after a number it's the noun: «si shi nian le» 四十年了)
        if (nx && nx.fl.asp && t.cands[0].pos !== 'v' && !(pv && pv.pos === 'v') && !(prev && (prev.t === 'num' || (pv && (pv.pos === 'num' || pv.pos === 'cl')))))
          pick(t, e => e.pos === 'v' && e.band <= t.cands[0].band + (t.cands[0].pos === 'adj' ? 1 : 2));
      }
      // numbers said in pinyin that sound like a word (shí wǔ: 十五 or 食物?) before a measure word
      for (let k = 0; k + 1 < T.length; k++) {
        const t = T[k], nx = E0(T[k + 1]);
        if (t.t === 'w' && t.py && nx && nx.pos === 'cl' && E0(t).pos !== 'num') {
          const us = X.slice(t.i, t.j);
          if (us.every(u => NUMPY[u.syl] && numTone(u))) Object.assign(t, { t: 'num', chs: us.map(u => NUMPY[u.syl]) }, { v: numVal(us.map(u => NUMPY[u.syl])) });
        }
      }
      // a name after 叫 / 姓 (我叫王小明): the rest of the clause, when it's short and has no verb, pronoun or question word
      for (let k = 0; k < T.length; k++) {
        const e = E0(T[k]);
        if (!e || e.pos !== 'v' || (e.ch !== '叫' && e.ch !== '姓')) continue;
        let j = k + 1, n = 0, ok = true;
        while (j < T.length && T[j].t !== 'punct') {
          const x = E0(T[j]);
          if (x && (x.pos === 'v' || x.pos === 'pron' || x.fl.q || x.fl.sfp || x.fl.asp)) { ok = false; break; }
          n += X[T[j].j - 1].e - X[T[j].i].s; j++;
        }
        if (!ok || j === k + 1 || n > 12) continue;
        const one = j === k + 2 && T[k + 1];
        if (one && (one.t === 'name' || (E0(one) && E0(one).pos === 'name'))) continue;
        if (e.ch === '叫' && one && E0(one) && (E0(one).pos === 'n' || E0(one).pos === 'pron')) continue;
        T.splice(k + 1, j - k - 1, { t: 'name', i: T[k + 1].i, j: T[j - 1].j });
      }
    }

    // ------------------------------------------------------------ the analysis
    const PUNCT_FW = { ',': '，', '.': '。', '!': '！', '?': '？', ':': '：', ';': '；', '(': '（', ')': '）' };
    const has = (w, ...cs) => !!w && !!w.ch && cs.includes(w.ch);
    const F = (w, f) => { const e = w && w.id ? E.get(w.id) : null; return !!(e && e.fl[f]); };
    // characters without a headword: their reading from the notation, else from CJK's dictionary, else bare
    function hanSrc(chars, X, i, j) {
      const rs = X.slice(i, j).map(u => u.rs);
      if (rs.length === [...chars].length && rs.every(Boolean)) return `[${chars}|${rs.join(' ')}]`;
      const L = CJK.lookup(chars, 'zh');
      if (L.every(p => p.r && p.r.split(' ').length === [...p.s].length)) return L.map(p => `[${p.s}|${p.r}]`).join(' ');
      return chars;
    }
    let charIdx = null, keyList = null;
    function sugg(raw, han) {              // an unknown word: headwords with its characters, or one or two letters off
      const out = new Set();
      if (han) {
        if (!charIdx) { charIdx = new Map(); for (const e of E.values()) if (e.pos !== 'phrase') for (const c of new Set(e.ch)) push(charIdx, c, e); }
        for (const c of raw) for (const e of (charIdx.get(c) || []).slice(0, 3)) if (out.size < 3) out.add(e.id);
        return [...out];
      }
      const key = toneless(raw);
      if (key.length < 3) return [];
      if (!keyList) keyList = [...E.values()].filter(e => e.pos !== 'phrase').map(e => [e.syl.join(''), e]);
      const lim = key.length >= 7 ? 2 : 1;
      for (const [k, e] of keyList) if (Math.abs(k.length - key.length) <= lim && lev(k, key) <= lim) { out.add(e.id); if (out.size >= 3) break; }
      return [...out];
    }
    function mkWords(T, X, text) {
      return T.map((t, idx) => {
        const s = X[t.i].s, e = X[t.j - 1].e, raw = text.slice(s, e);
        const w = { t: raw, i: idx, s, e, id: null, lemma: null, pos: null, en: '', tags: [], band: 0, f: {}, unknown: false, sugg: [], punct: false, name: false };
        if (t.t === 'punct') return Object.assign(w, { punct: true, pos: 'punct', src: PUNCT_FW[raw] || raw });
        if (t.t === 'num') {
          const chs = t.chs ? t.chs.join('') : null, ent = chs ? first(chs) : null;
          return Object.assign(w, { pos: 'num', num: t.v, en: String(t.v), id: ent ? ent.id : null, lemma: ent ? ent.lemma : null, band: ent ? ent.band : 1, ch: chs || raw,
            src: chs ? `[${chs}|${t.chs.map(c => NUM_R[c]).join(' ')}]` : raw, py: !!t.py,
            tl: !!t.py && X.slice(t.i, t.j).every(u => !u.tt), lastSyl: t.py ? X[t.j - 1].syl : null, syls: t.py ? X.slice(t.i, t.j).map(u => u.syl) : null });
        }
        const han = X[t.i].k === 'han';
        if (t.t === 'name') return Object.assign(w, { name: true, pos: 'name', ch: han ? raw : null, src: han ? hanSrc(raw, X, t.i, t.j) : raw.replace(/\s+/g, ' ') });
        if (t.t === 'unk') return Object.assign(w, { unknown: true, ch: han ? raw : null, src: han ? hanSrc(raw, X, t.i, t.j) : raw, sugg: sugg(raw, han) });
        const en = t.cands[0];
        Object.assign(w, { id: en.id, lemma: en.lemma, pos: en.pos, en: en.en, tags: en.tags, band: en.band, ch: en.ch, src: en.lemma, py: !!t.py });
        if (en.pos === 'name') w.name = true;
        if (en.cl) w.cl = en.cl;
        if (en.lex) w.lex = en.lex;
        if (en.val) w.val = en.val;
        if (t.cands.length > 1) w.alts = t.cands.slice(1).map(x => x.id);
        // (a tone that doesn't fit, in a short run typed as one word that the list only reads as several words, isn't a tone slip:
        //  it's a word the list doesn't have: «rènde» 认得 is no 人 + 的 with a wrong tone)
        if (t.py && t.mis && t.mis[0]) {
          const run = X[t.i].run;
          let a = t.i, b = t.j;
          while (a > 0 && X[a - 1].k === 'py' && X[a - 1].run === run) a--;
          while (b < X.length && X[b].k === 'py' && X[b].run === run) b++;
          if (!(b - a >= 2 && b - a <= 4 && (a < t.i || b > t.j))) w.toneBad = true;
        }
        if (en.pos === 'num' && [...en.ch].every(c => NUMC[c] !== undefined)) w.num = numVal([...en.ch]);
        if (t.py) {
          w.typed = X.slice(t.i, t.j).map(u => (u.tt && u.tone ? CJK.markTone(u.syl, u.tone) : u.syl)).join(''); w.tl = X.slice(t.i, t.j).every(u => !u.tt);
          w.ttone = X.slice(t.i, t.j).map(u => (u.tt ? u.tone : 0)); w.run = X[t.i].run; w.gap = !!X[t.i].gap;      // (for fix: what you typed)
          w.gapIn = X.slice(t.i + 1, t.j).some(u => u.gap);                                                       // (a space typed inside it)
        }
        return w;
      });
    }
    // features: a verb's 了 / 过 / 着 / 在 and its 不 / 没; a pronoun's person and number; 们
    function feats(ws) {
      const real = ws.filter(w => !w.punct);
      for (let k = 0; k < real.length; k++) {
        const w = real[k], pv = real[k - 1], pv2 = real[k - 2], nx = real[k + 1];
        if (w.pos === 'pron') {
          const e = E.get(w.id);
          if (e) { const p = e.fl.p1 ? 1 : e.fl.p2 ? 2 : e.fl.p3 ? 3 : 0; if (p) { w.f.person = p; w.f.number = e.fl.pl ? 'p' : 's'; } if (e.fl.formal) w.f.formal = true; }
        }
        if (w.pos === 'n' && has(nx, '们')) w.f.number = 'p';
        if (w.pos !== 'v' && w.pos !== 'adj') continue;
        if (has(nx, '了')) { w.f.tense = w.pos === 'v' ? 'past' : 'pres'; w.f.asp = 'le'; }
        else if (has(nx, '过') && F(nx, 'asp')) { w.f.tense = 'perf'; w.f.asp = 'guo'; }
        else if (has(nx, '着') && F(nx, 'asp')) { w.f.tense = 'pres'; w.f.asp = 'zhe'; }
        if (has(pv, '在', '正在', '正') && w.pos === 'v') { w.f.asp = 'prog'; w.f.tense = 'pres'; }
        const ng = has(pv, '不', '没', '没有', '别') ? pv : (pv && pv.pos === 'adv' && has(pv2, '不', '没', '没有') ? pv2 : null);
        if (ng) { w.f.neg = true; if (has(ng, '没', '没有') && w.f.asp !== 'guo') w.f.tense = 'past'; if (has(ng, '别')) w.f.mood = 'imp'; }
      }
    }
    const CLAUSE_P = /[，,。.！!？?；;：:…]/;
    function clausesOf(ws) {
      const C = [];
      let cur = [];
      ws.forEach((w, k) => {
        if (w.punct) { if (CLAUSE_P.test(w.t) || CLAUSE_P.test(w.src || '')) { if (cur.length) C.push(cur); cur = []; } return; }
        if (F(w, 'conn') && cur.length) { C.push(cur); cur = []; }
        cur.push(k);
      });
      if (cur.length) C.push(cur);
      return C;
    }
    // 以后 / 之后 on its own (opening the clause, or after its subject: «以后我会…», «我以后想…») or after a length of time
    // («十年以后», «三个月以后», «一会儿以后») is "later, in the future"; after an event («下课以后») it's only "after"
    const UNIT = /^(年|天|月|个月|星期|周|礼拜|小时|钟头|分钟|秒|会儿|阵子)$/, NUM_UNIT = /^[一二三四五六七八九十两几半]+(年|天|个月|月|星期|周|小时|分钟)$/;
    function laterAt(W2) {
      return W2.some((w, k) => {
        if (!has(w, '以后', '之后') || W2.slice(0, k).some(x => x.pos === 'v' || x.pos === 'adj')) return false;     // («离开港口几年以后»: after an event)
        const p = W2[k - 1], p2 = W2[k - 2];
        if (!p) return true;
        if (k === 1 && (p.pos === 'pron' || p.name || p.pos === 'name')) return true;
        if (F(p, 'dur') || (p.ch && NUM_UNIT.test(p.ch))) return true;
        return !!p.ch && UNIT.test(p.ch) && !!p2 && (p2.pos === 'num' || p2.num != null || p2.pos === 'cl');
      });
    }
    // (carry: the time of a clause of time words alone before a comma, «明天，我去…», «十年以后，我想…»)
    function timeOf(W2, carry) {
      const verb = W2.find(w => w.pos === 'v'), pred = verb || W2.find(w => w.pos === 'adj');
      let lastW = W2[W2.length - 1];
      for (let k = W2.length - 1; k > 0 && F(W2[k], 'sfp') && !has(W2[k], '了'); k--) lastW = W2[k - 1];
      if (W2.some(w => F(w, 'hypo'))) return 'hypo';
      if (pred && has(lastW, '了') && W2.some(w => has(w, '要', '快', '就要', '快要'))) return 'future';
      if (W2.some(w => w.f.asp === 'guo' || (w.pos === 'v' && w.f.asp === 'le') || (w.f.neg && w.f.tense === 'past'))) return 'past';
      if (pred && (W2.some(w => F(w, 'tp')) || carry === 'past')) return 'past';
      if (verb && !F(verb, 'st') && has(lastW, '了')) return 'past';
      if (pred && (W2.some(w => F(w, 'tf')) || carry === 'future' || laterAt(W2) || W2.some(w => has(w, '打算', '准备', '将', '将要')))) return 'future';
      return pred ? 'present' : null;
    }
    function sentence(ws, text) {
      const C = clausesOf(ws), times = [];
      let first = null, clauses = 0, carry = null;
      for (const c of C) {
        const W2 = c.map(k => ws[k]), t = timeOf(W2, carry);
        carry = null;
        if (W2.some(w => w.pos === 'v' || w.pos === 'adj')) clauses++;
        else {
          const nx = ws[c[c.length - 1] + 1];
          if (nx && nx.punct && /[，,、]/.test(nx.t)) carry = W2.some(w => F(w, 'tp')) ? 'past' : W2.some(w => F(w, 'tf')) || laterAt(W2) ? 'future' : null;
        }
        if (t) { if (!times.includes(t)) times.push(t); if (!first) first = t; }
      }
      const real = ws.filter(w => !w.punct);
      const lastW = real[real.length - 1];
      const aNotA = real.some((w, k) => w.t && real[k + 2] && (has(real[k + 1], '不') || (has(real[k + 1], '没有') && has(w, '有'))) && (real[k + 2].t.startsWith(w.t) || has(w, '有')));
      let subject = null;
      if (C.length) for (const k of C[0]) {
        const w = ws[k];
        if (w.pos === 'v' || w.pos === 'adj') break;
        if (w.pos === 'pron' && w.f.person) { subject = { person: w.f.person, number: w.f.number }; if (w.f.formal) subject.formal = true; break; }
        if ((w.pos === 'n' && !w.tags.includes('time') && !F(w, 'tp') && !F(w, 'tf') && !F(w, 'tn') && !F(w, 'rel')) || w.name) { subject = { person: 3, number: w.f.number || 's' }; break; }
      }
      return { text, lang: 'zh', words: ws,
        verbs: ws.filter(w => w.pos === 'v').map(w => w.i),
        time: times.includes('hypo') ? 'hypo' : first, times,
        neg: ws.some(w => F(w, 'neg')),
        question: /[?？]/.test(text) || (!!lastW && has(lastW, '吗')) || ws.some(w => F(w, 'q') || F(w, 'qq')) || aNotA,
        numbers: ws.filter(w => w.num != null).map(w => w.num),
        connectors: ws.filter(w => F(w, 'conn')).map(w => w.ch),
        clauses, subject,
        unknown: ws.filter(w => w.unknown).map(w => w.i) };
    }
    function analyze(text, opts = {}) {
      syncLex();
      const raw = String(text == null ? '' : text);
      try {
        const notation = /\[[^\]|]+\|[^\]]*\]/.test(raw);
        let X, plain;
        if (notation) { const r = unitizeSrc(raw); X = r.X; plain = r.text; } else { plain = raw.normalize('NFC'); X = unitize(plain); }
        const T = cover(X, notation);
        disamb(T, X);
        const ws = mkWords(T, X, plain);
        feats(ws);
        const a = sentence(ws, plain);
        if (notation) a.src = raw;
        return a;
      } catch (e) {
        console.error('DICT zh: analyze', e);
        return { text: raw, lang: 'zh', words: [], verbs: [], time: null, times: [], neg: false, question: /[?？]/.test(raw), numbers: [], connectors: [], clauses: 0, subject: null, unknown: [] };
      }
    }

    // ------------------------------------------------------------ the checks (only what's sure: a false alarm is far worse than a miss)
    const ANIMAL_CL = new Set(['只', '条', '头', '匹', '尾']);
    const THINGS = new Set(['food', 'drink', 'animal', 'clothes', 'home', 'transport', 'tech', 'school', 'shop', 'nature', 'music', 'sport', 'hobby', 'art', 'money']);
    // a noun read from toneless pinyin that could be another word: no measure-word error unless every reading would have one
    function guessNoun(w, clCh) {
      if (!w.tl || !w.alts || !w.alts.length) return false;
      // (only another noun can fill a noun's slot: 毛 the measure word doesn't count as a reading of «mao» after 个)
      return w.alts.some(id => { const a = E.get(id); return !!a && a.pos === 'n' && (!a.cl || a.fl.ncl || (!!clCh && !!a.cls && a.cls.includes(clCh))); });
    }
    // do these words, typed in pinyin, also spell one headword? (shi + chang: 市场)
    function formsWord(list) {
      const syl = [];
      for (const w of list) { const e = w.id && E.get(w.id); if (!e) return false; syl.push(...e.syl); }
      return (bySyl.get(syl[0]) || []).some(e => e.syl.length === syl.length && e.syl.every((y, k) => y === syl[k]));
    }
    function check(a, opts = {}) {
      const errs = [];
      if (!a || a.lang !== 'zh' || !a.words || !a.words.length) return errs;
      const ws = a.words, mode = opts.mode || CJK.mode('zh');
      const real = ws.filter(w => !w.punct);
      if (!real.length || real.filter(w => w.unknown).length / real.length > 0.34) return errs;
      const P = src => CJK.plain(src, { lang: 'zh', mode, cap: false });
      const Q = src => '«' + P(src) + '»';
      const S = k => (ws[k] ? ws[k].src || ws[k].t : '');
      const add = (code, sev, i, j, src, tip) => {
        if (errs.some(x => x.at[0] <= j && i <= x.at[1] && x.code.split('.')[0] === code.split('.')[0])) return;
        errs.push({ code, sev, at: [i, j], fix: src ? P(src) : '', tip, _src: src });
      };
      const C = clausesOf(ws);
      const anyHas = (...cs) => ws.some(w => has(w, ...cs));
      for (const c of C) {
        const n = c.length, at = q => (q >= 0 && q < n ? ws[c[q]] : null);
        const tp = c.findIndex(k => F(ws[k], 'tp')), tf = c.findIndex(k => F(ws[k], 'tf'));
        // neg: 不有 → 没有 · 没是 → 不是 · 不…过 → 没…过
        for (let q = 0; q + 1 < n; q++) {
          const w = at(q), nx = at(q + 1);
          if (has(w, '不') && has(nx, '有')) { add('neg.you', 'major', c[q], c[q + 1], '[没有|méi yǒu]', `${Q('[有|yǒu]')} is never negated with ${Q('[不|bù]')}: say ${Q('[没有|méi yǒu]')}.`); continue; }
          if (has(w, '没', '没有') && has(nx, '是', '可以')) { const s2 = '[不|bù] ' + S(c[q + 1]); add('neg.shi', 'major', c[q], c[q + 1], s2, `${Q(S(c[q + 1]))} takes ${Q('[不|bù]')}, not ${Q(S(c[q]))}: ${Q(s2)}.`); continue; }
          if (has(w, '不') && nx.pos === 'v' && has(at(q + 2), '过') && F(at(q + 2), 'asp')) {
            const s2 = `[没|méi] ${S(c[q + 1])} ${S(c[q + 2])}`;
            add('neg.guo', 'major', c[q], c[q + 2], s2, `With ${Q('[过|guò]')} ("ever"), say no with ${Q('[没|méi]')}: ${Q(s2)}.`);
          }
        }
        // neg: a past time word, then 不 + an action verb → 没 (and no 了): 我昨天不去 → 我昨天没去
        if (tp >= 0 && !c.some(k => F(ws[k], 'hab'))) for (let q = tp + 1; q + 1 < n; q++) {
          const v = at(q + 1);
          if (!has(at(q), '不') || v.pos !== 'v' || F(v, 'st') || F(v, 'mod') || F(v, 'cop') || has(v, '有')) continue;
          let le = -1;
          for (let r = q + 2; r < n; r++) if (has(at(r), '了')) le = r;
          const parts = ['[没|méi]'];
          for (let r = q + 1; r <= (le >= 0 ? le : q + 1); r++) if (!has(at(r), '了')) parts.push(S(c[r]));
          const s2 = parts.join(' ');
          add('neg.past', 'major', c[q], c[le >= 0 ? le : q + 1], s2, `After ${Q(S(c[tp]))}, say it didn't happen with ${Q('[没|méi]')}, not ${Q('[不|bù]')}: ${Q(s2)}.`);
          break;
        }
        // neg: 没 + verb + 了 → no 了 (我昨天没吃了饭 → 我昨天没吃饭)
        for (let q = 0; q + 2 < n; q++) {
          if (!has(at(q), '没', '没有') || at(q + 1).pos !== 'v' || !has(at(q + 2), '了')) continue;
          if (c.slice(0, q).some(k => ws[k].num != null || F(ws[k], 'dur') || has(ws[k], '好久', '很久', '多久', '已经', '好几'))) continue;
          const obj = at(q + 3) && at(q + 3).pos === 'n';
          if (!((tp >= 0 && tp < q) || obj)) continue;
          const s2 = `${S(c[q])} ${S(c[q + 1])}`;
          add('neg.le', 'major', c[q], c[q + 2], s2, `With ${Q('[没|méi]')}, drop ${Q('[了|le]')}: ${Q(s2)}.`);
        }
        // tense: a future time word with a finished 了 (我明天去了 → 我明天去), in a one-clause sentence
        if (tf >= 0 && C.length === 1 && !anyHas('就', '快', '要', '会', '已经', '都', '才', '再', '不', '没', '没有', '别', '快要', '就要', '该')) {
          let le = n - 1;
          while (le > 0 && F(at(le), 'sfp') && !has(at(le), '了')) le--;
          if (has(at(le), '了') && c.slice(tf + 1, le).some(k => ws[k].pos === 'v'))
            add('tense.fut', 'major', c[le], c[le], '', `${Q(S(c[tf]))} is still to come, so leave out ${Q('[了|le]')}.`);
        }
        // order: a time word after the verb → before it (我去商店昨天 → 我昨天去商店)
        {
          const v = c.findIndex(k => ws[k].pos === 'v' || ws[k].pos === 'adj');
          let last = n - 1;
          while (last > 0 && (F(at(last), 'sfp') || has(at(last), '了'))) last--;
          const t = at(last), vb = at(v), pv = at(last - 1), pv2 = at(last - 2);
          const tGuess = !!t && !!t.tl && (t.alts || []).some(id => { const a = E.get(id); return !a || !(a.fl.tp || a.fl.tf || a.fl.tn); });
          // (not a time word inside a bigger noun: «住一个晚上» and «哭了一个晚上» are a length of time, «上个星期六» and «的那天晚上»
          // a phrase; nor «到了冬天»)
          const inPhrase = !!pv && (pv.pos === 'cl' || (!!pv2 && (pv2.pos === 'det' || pv2.pos === 'num' || pv2.num != null)) || (has(pv, '了') && has(pv2, '到', '等')));
          if (v >= 0 && last > v && t && !tGuess && (F(t, 'tp') || F(t, 'tf') || F(t, 'tn')) && !F(t, 'rel') && pv && !inPhrase
            && !F(vb, 'cop') && !F(vb, 'mod') && !F(vb, 'st') && !F(vb, 'clause')
            && !has(pv, '到', '等', '从', '直到', '等到', '在', '是', '于', '的', '每', '这', '那', '上', '下', '和', '跟', '去', '回', '回到') && pv.pos !== 'prep' && pv.pos !== 'det' && pv.num == null
            && !c.slice(v + 1, last).some(k => ws[k].pos === 'v' || F(ws[k], 'tp') || F(ws[k], 'tf') || F(ws[k], 'tn'))) {
            const ins = v > 0 && (at(0).pos === 'pron' || at(0).pos === 'n' || at(0).name) ? 1 : 0;
            const parts = [S(c[last])];
            for (let r = ins; r < last; r++) parts.push(S(c[r]));
            const s2 = parts.join(' ');
            add('order.time', 'major', c[ins], c[last], s2, `Time words go before the verb: ${Q((ins ? S(c[0]) + ' ' : '') + s2)}.`);
          }
        }
        // order: 也 before the subject (也我喜欢 → 我也喜欢)
        if (n >= 2 && has(at(0), '也') && at(1).pos === 'pron') {
          const s2 = `${S(c[1])} ${S(c[0])}`;
          add('order.ye', 'major', c[0], c[1], s2, `${Q(S(c[0]))} goes after the subject: ${Q(s2)}.`);
        }
        // adj: 是 + an adjective → 很 + the adjective (我是累 → 我很累; a question: 你是累吗 → 你累吗)
        for (let q = 0; q + 1 < n; q++) {
          const adj = at(q + 1), after = at(q + 2);
          if (!has(at(q), '是') || adj.pos !== 'adj' || F(adj, 'ng')) continue;
          // (never on a toneless guess: «shichang» might be 市场, not 是长)
          if ((adj.tl && adj.alts && adj.alts.length) || ((at(q).tl || adj.tl) && formsWord([at(q), adj]))) continue;
          if (after && !(F(after, 'sfp') && !has(after, '了'))) continue;
          if (has(at(q - 1), '就', '真', '可', '倒', '才', '正', '还', '不', '也', '都', '总', '就是', '真是', '只是', '要是', '还是', '可是', '但是', '于是', '不是', '是')) continue;
          if (!after || F(after, 'sfp')) {
            let nk = c[q + 1] + 1;
            const comma = ws[nk] && ws[nk].punct && /[，,；;]/.test(ws[nk].t);
            while (ws[nk] && ws[nk].punct) nk++;
            if (comma && has(ws[nk], '但是', '可是', '不过', '然而', '但', '就是', '只是', '可')) continue;
          }
          const s2 = has(after, '吗') ? S(c[q + 1]) : `[很|hěn] ${S(c[q + 1])}`;
          add('adj.shi', 'major', c[q], c[q + 1], s2, `Adjectives don't take ${Q('[是|shì]')}: ${Q(s2 + (has(after, '吗') ? ' [吗|ma]' : ''))}.`);
        }
        // qword: 吗 with a question word (你叫什么名字吗 → 你叫什么名字？) or with 去不去
        const ma = c.findIndex(k => has(ws[k], '吗'));
        if (ma > 0) {
          let bad = -1, span = 1;
          // (什么 / 谁 / 哪儿 can mean "something / someone / somewhere" with 吗 — 你要去哪儿吗？ 有什么问题吗？ — but not
          // right before 吗 after a plain action verb with no 要 / 想 / 有 / 了 / 在 around: 你去哪儿吗？)
          const soft = c.some(k => F(ws[k], 'mod') || F(ws[k], 'asp') || has(ws[k], '有', '在', '正在', '点', '一点', '一点儿', '些', '一些', '要', '想', '会', '能', '可以', '需要', '打算', '准备', '没有', '没', '别'));
          const act = c.some(k => ws[k].pos === 'v' && !F(ws[k], 'st') && !F(ws[k], 'mod') && !F(ws[k], 'cop'));
          for (let q = 0; q < ma && bad < 0; q++) {
            const w = at(q);
            if (F(w, 'qq') && !has(at(q - 1), '不', '好')) bad = q;
            else if (F(w, 'q') && (has(at(q - 1), '是', '叫', '姓') || has(at(q + 1), '是') || (has(at(q - 1), '在') && q + 1 === ma))) bad = q;
            else if (F(w, 'q') && q + 1 === ma && act && !soft) bad = q;
            else if (q + 2 < ma && w.t && has(at(q + 1), '不') && at(q + 2).t.startsWith(w.t)) { bad = q; span = 3; }
            else if (q + 1 < ma && has(w, '有') && has(at(q + 1), '没有')) { bad = q; span = 2; }
          }
          if (bad >= 0) {
            const what = c.slice(bad, bad + span).map(k => S(k)).join(' ');
            add('qword', 'major', c[ma], c[ma], '', `${Q(what)} already makes it a question, so leave out ${Q('[吗|ma]')}.`);
          }
        }
      }
      // measure words: after a number or 这 / 那 / 几 / 每
      for (let k = 0; k + 1 < ws.length; k++) {
        const d = ws[k], nx = ws[k + 1];
        // (a number or 这 / 那 / 几 / 每; not 一点 / 一些, which take no measure word)
        if (d.punct || nx.punct || !(d.num != null || F(d, 'd'))) continue;
        const two = d.ch === '二' && !has(ws[k - 1], '第') && !(ws[k - 1] && ws[k - 1].num != null);
        if (nx.pos === 'cl') {
          // (a measure word read from toneless pinyin is a guess unless it's a common one: «fei er ming», a name, is no 二名)
          const clE = E.get(nx.id), sure = !nx.tl || (!!clE && clE.band <= 2);
          if (two && !F(nx, 'part2') && sure) { const s2 = '[两|liǎng]'; add('measure.liang', 'major', k, k, s2, `Before a measure word, 2 is ${Q(s2)}: ${Q(s2 + ' ' + S(k + 1))}.`); }
          let j = k + 2, N = null;
          while (j < ws.length && j <= k + 5) {
            const w = ws[j];
            if (w.punct || w.unknown || w.name || ['v', 'pron', 'num', 'cl', 'det', 'prep', 'conj'].includes(w.pos)) break;
            if (w.pos === 'n') { N = w; break; }
            j++;
          }
          // (two nouns in a row is a compound the list doesn't have — 电影票, 故事书 — so its head is unknown: no guess)
          if (N && ws[j + 1] && !ws[j + 1].punct && (ws[j + 1].pos === 'n' || ws[j + 1].unknown)) N = null;
          const NE = N && E.get(N.id), CL = E.get(nx.id);
          // (名 and 位 count any person: 一名画家, 一位妈妈)
          const anyone = !!CL && !!NE && !!CL.fl.ppl && (NE.tags.includes('people') || NE.tags.includes('family') || (!!NE.cls && NE.cls.some(c => c === '位' || c === '名')));
          // (and a rarer noun read from toneless pinyin is a guess too: «yi ben fang cuo de shu» is 放, not 房)
          if (NE && NE.cls && CL && !CL.fl.part && !NE.cls.includes(CL.ch) && !guessNoun(N, CL.ch) && sure && !anyone && !(N.tl && NE.band >= 3)) {
            const right = clEntry(NE.cl);
            if (!right) continue;
            const whole = `${S(k)} ${right.lemma} ${N.src}`;
            if (CL.ch === '个') add('measure.ge', 'minor', k + 1, k + 1, right.lemma, `${Q('[个|gè]')} works, but ${Q(N.src)} usually takes ${Q(right.lemma)}: ${Q(whole)}.`);
            else add('measure.wrong', NE.tags.includes('animal') && ANIMAL_CL.has(CL.ch) ? 'minor' : 'major', k + 1, k + 1, right.lemma, `${Q(N.src)} takes the measure word ${Q(right.lemma)}: ${Q(whole)}.`);
          }
          continue;
        }
        if (nx.pos !== 'n') continue;
        const NE = E.get(nx.id);
        if (!NE || !NE.cl || NE.fl.ncl || guessNoun(nx, null)) continue;
        // (a toneless noun of one syllable that's also a measure word's: «you yi shan men» may well be 一扇门, not 一山; or one typed with
        // a space inside that starts like one: «yi ke tang» is 一颗糖, not 一课堂)
        if (nx.tl && (NE.syl.length === 1 || nx.gapIn) && (bySyl.get(NE.syl[0]) || []).some(e => e.pos === 'cl' && e.syl.length === 1)) continue;
        // (a toneless number whose syllables also spell a word: «zhe jiu shi tuandui» may well be 就是)
        if (d.tl && d.syls && d.syls.length > 1 && (bySyl.get(d.syls[0]) || []).some(e => e.pos !== 'num' && e.syl.length === d.syls.length && e.syl.every((y, q) => y === d.syls[q]))) continue;
        // (a toneless number whose last syllable is also a measure word: «yi wan mifan» may well be 一碗米饭)
        if (d.tl && d.lastSyl && (bySyl.get(d.lastSyl) || []).some(e => e.pos === 'cl' && e.syl.length === 1)) continue;
        if (ws[k + 2] && !ws[k + 2].punct && (ws[k + 2].pos === 'n' || ws[k + 2].unknown)) continue;
        if (F(d, 'd') && (has(d, '这', '那', '哪') ? !NE.tags.some(t => THINGS.has(t)) : !has(d, '几', '每'))) continue;
        // (a number typed with a capital before a person is a surname: «Shí shīfu» 石师傅, «Liǔ xiānsheng» 柳先生)
        if (d.num != null && /^[A-ZĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ]/.test(d.t || '') && (NE.tags.includes('people') || NE.tags.includes('family'))) continue;
        const right = clEntry(NE.cl);
        if (!right) continue;
        const s2 = `${two ? '[两|liǎng]' : S(k)} ${right.lemma} ${S(k + 1)}`;
        add('measure.missing', 'major', k, k + 1, s2, `Between ${Q(S(k))} and ${Q(S(k + 1))} goes a measure word: ${Q(s2)}.`);
      }
      // tone (pinyin mode only, and only an A): a tone typed that isn't the word's
      if (mode === 'roman') ws.forEach((w, k) => {
        if (!w.toneBad || !w.typed || !w.id) return;
        const e = E.get(w.id);
        if (e) add('tone', 'minor', k, k, e.lemma, `Tone: ${Q(e.lemma)}, not «${w.typed}».`);
      });
      return errs;
    }

    // ------------------------------------------------------------ fix: the sentence said right (plain text in the mode; the notation in a.fixedSrc)
    function fix(a, errors) {
      const ws = (a && a.words) || [], mode = CJK.mode('zh');
      const ops = (errors || []).filter(x => x && x.at && x._src !== undefined).map(x => ({ i: x.at[0], j: x.at[1], src: x._src })).sort((x, y) => x.i - y.i || y.j - x.j);
      const parts = [];
      let k = 0;
      const keep = q => parts.push({ src: ws[q].src || ws[q].t, w: ws[q] });
      for (const op of ops) {
        if (op.i < k) continue;
        while (k < op.i) keep(k++);
        if (op.src) parts.push({ src: op.src });
        k = op.j + 1;
      }
      while (k < ws.length) keep(k++);
      // (the words you got right stay as you typed them in pinyin: joined, with your neutral tones; «zhège» isn't "corrected" to «zhè gè»)
      const BR = /^\[([^\]|]+)\|([^\]]+)\]$/, neutral = y => y.normalize('NFD').replace(/[̀́̄̌]/g, '').normalize('NFC');
      const toned = new Set(ws.filter(w => w.ttone && w.ttone.some(x => x > 0)).map(w => w.run));
      const out = [];
      for (const p of parts) {
        const w = p.w;
        let s = p.src;
        const m = w && w.py && w.ttone ? String(s).match(BR) : null;
        if (m && toned.has(w.run)) {
          const sy = m[2].split(' ');
          if (sy.length === w.ttone.length) s = `[${m[1]}|${sy.map((y, q) => (w.ttone[q] === 0 ? neutral(y) : y)).join(' ')}]`;
        }
        const last = out[out.length - 1], lm = m && last && last.w ? String(last.src).match(BR) : null;
        if (lm && w.run === last.w.run && !w.gap) { const m2 = s.match(BR); last.src = `[${lm[1]}${m2[1]}|${lm[2]} ${m2[2]}]`; last.w = w; continue; }
        out.push({ src: s, w: m ? w : null });
      }
      const src = out.map(p => p.src).filter(Boolean).join(' ');
      if (a) a.fixedSrc = src;
      return CJK.plain(src, { lang: 'zh', mode });
    }

    // ------------------------------------------------------------ gloss: what a word means (a verb with its 了 / 没 / 过 too)
    const ASP_EN = { '了': 'done', '过': 'ever, before', '着': 'ongoing', '在': 'in the middle of', '正在': 'in the middle of', '不': 'not', '没': 'not (did not)', '没有': 'not (did not)', '别': "don't" };
    function gloss(surface, ctx) {
      syncLex();
      const raw = String(surface == null ? '' : surface).trim();
      if (!raw) return null;
      const mode = (ctx && ctx.mode) || CJK.mode('zh');
      const P = src => CJK.plain(src, { lang: 'zh', mode, cap: false });
      const lab = e => `${e.ch} ${pyShow(e.py)}`;
      let ws;
      if (ctx && ctx.a && ctx.i != null && ctx.a.words && ctx.a.words[ctx.i]) {       // a word tapped in an analysis: with its 了 / 没 around it
        const all = ctx.a.words, w = all[ctx.i];
        ws = [w];
        for (let k = ctx.i - 1; k >= 0 && ws.length < 3 && (has(all[k], '不', '没', '没有', '别', '在', '正在') && w.pos === 'v'); k--) ws.unshift(all[k]);
        for (let k = ctx.i + 1; k < all.length && (has(all[k], '了', '过', '着') && F(all[k], 'asp') && (w.pos === 'v' || w.pos === 'adj')); k++) { ws.push(all[k]); break; }
      } else ws = analyze(raw).words.filter(w => !w.punct);
      if (!ws.length) return null;
      const head = ws.find(w => w.id && !(F(w, 'neg') || F(w, 'asp') || has(w, '在', '正在')) || w.unknown || w.name) || ws[0];
      const he = head.id ? E.get(head.id) : null;
      const label = ctx && ctx.a ? ws.map(w => w.t).join('') : raw;
      if (!he) {
        const ph = phrases.get(ws.map(w => w.ch || w.t).join(''));
        if (ph) return { id: ph.id, lemma: ph.lemma, en: ph.en, pos: ph.pos, form: `${label}: ${ph.en}`, band: ph.band };
        return head.name ? { id: null, lemma: null, en: '(a name)', pos: 'name', form: `${label}: a name` } : null;
      }
      const pre = ws.slice(0, ws.indexOf(head)), post = ws.slice(ws.indexOf(head) + 1);
      const others = pre.concat(post).filter(w => !(has(w, '不', '没', '没有', '别', '在', '正在', '了', '过', '着')));
      const base = { id: he.id, lemma: he.lemma, en: he.en, pos: he.pos, band: he.band, ch: he.ch, py: pyShow(he.py), tags: he.tags, cl: he.cl || null, lex: he.lex || null };
      if (ws.length === 1 || others.length) {
        if (others.length) {
          const ph = phrases.get(ws.map(w => w.ch || w.t).join('')) || first(ws.map(w => w.ch || w.t).join(''));
          if (ph) return Object.assign(base, { id: ph.id, lemma: ph.lemma, en: ph.en, pos: ph.pos, form: `${label}: ${ph.en}` });
          return Object.assign(base, { form: `${label}: ${ws.map(w => w.en || w.t).join(' + ')}` });
        }
        return Object.assign(base, { form: `${label}: ${he.en} (${lab(he)}${he.cl ? ', measure word ' + he.cl : ''})` });
      }
      const neg = pre.find(w => has(w, '不', '没', '没有', '别')), prog = pre.find(w => has(w, '在', '正在'));
      const asp = post.find(w => has(w, '了', '过', '着'));
      let en = he.en;
      if (he.pos === 'v') {
        if (neg && has(neg, '别')) en = "don't " + enBase(he.en) + '!';
        else if (neg && asp && has(asp, '过')) en = 'have never ' + enPart(he.en);
        else if (neg && has(neg, '没', '没有')) en = "didn't " + enBase(he.en);
        else if (neg) en = "don't " + enBase(he.en);
        else if (asp && has(asp, '了')) en = enPast(he.en);
        else if (asp && has(asp, '过')) en = 'have ' + enPart(he.en) + ' (before)';
        else if (prog || (asp && has(asp, '着'))) en = enIng(he.en);
      } else if (he.pos === 'adj') {
        if (neg) en = 'not ' + he.en;
        if (asp && has(asp, '了')) en = (neg ? 'not ' : '') + he.en + ' (now)';
      }
      const bits = ws.map(w => (w === head ? `${lab(he)}, ${he.en}` : `${w.ch} ${w.id && E.get(w.id) ? pyShow(E.get(w.id).py) : ''}, ${ASP_EN[w.ch] || w.en}`.replace(/ ,/, ',')));
      return Object.assign(base, { en, form: `${label}: ${en} (${bits.join(', + ')})` });
    }

    // ------------------------------------------------------------ inflect: a headword in another form (notation)
    function inflect(id, f = {}) {
      const e = E.get(id);
      if (!e) return null;
      if (e.pos === 'v') {
        if (f.neg) {
          if (f.mood === 'imp') return '[别|bié] ' + e.lemma;
          if (f.tense === 'perf') return '[没|méi] ' + e.lemma + ' [过|guò]';
          return (f.tense === 'past' ? '[没|méi] ' : '[不|bù] ') + e.lemma;
        }
        if (f.tense === 'past') return e.lemma + ' [了|le]';
        if (f.tense === 'perf') return e.lemma + ' [过|guò]';
        if (f.tense === 'fut') return '[会|huì] ' + e.lemma;
        if (f.tense === 'cond') return '[会|huì] ' + e.lemma;
        if (f.asp === 'prog' || f.aspect === 'prog' || f.form === 'ger') return '[在|zài] ' + e.lemma;
        if (f.asp === 'zhe') return e.lemma + ' [着|zhe]';
        return e.lemma;
      }
      if (e.pos === 'adj' && f.neg) return '[不|bù] ' + e.lemma;
      if ((e.pos === 'n' && e.tags.includes('people')) || (e.pos === 'pron' && /^[我你他她它]$/.test(e.ch))) if (f.number === 'p') return `[${e.ch}们|${e.py} men]`;
      return e.lemma;
    }

    // ------------------------------------------------------------ find: every headword a word could be (characters, pinyin, a form)
    function find(word) {
      syncLex();
      const raw = String(word == null ? '' : word).trim();
      if (!raw) return [];
      const out = [], add = e => { if (e && !out.includes(e)) out.push(e); };
      let ch = raw, readings = null;
      if (/\[[^\]|]+\|/.test(raw)) { const toks = CJK.parse(raw, 'zh').filter(t => t.segs); ch = toks.map(t => t.s).join(''); readings = toks.map(t => t.r || '').join(' '); }
      if (ch && [...ch].every(c => CJK.isHan(c))) {
        const list = byCh.get(ch) || [];
        if (readings) list.filter(e => toneless(e.py) === toneless(readings)).forEach(add);
        list.forEach(add);
        if (phrases.has(ch)) add(phrases.get(ch));
      } else if (/^[A-Za-zÀ-ɏ̀-ͯ'’:1-5\s]+$/.test(raw)) {
        const X = unitize(raw.normalize('NFC'));
        if (X.length && X.every(u => u.k === 'py')) {
          const L = (bySyl.get(X[0].syl) || []).filter(e => e.syl.length === X.length && e.syl.every((y, k) => y === X[k].syl) && !X.some((u, k) => toneMis(e, k, u)));
          L.sort((x, y) => x.band - y.band || x.n - y.n).forEach(add);
        }
      }
      if (!out.length) {
        const a = analyze(raw), core = a.words.filter(w => w.id && !w.punct && !F(w, 'neg') && !F(w, 'asp') && !has(w, '在', '正在'));
        if (core.length === 1) { add(E.get(core[0].id)); (core[0].alts || []).forEach(id => add(E.get(id))); }
      }
      if (!out.length) {          // a LEX phrase, by its characters
        const p = phrases.get([...String(raw)].filter(c => !/\s/.test(c) && !CJK.isPunct(c) && !/[!?,.]/.test(c)).join(''));
        if (p) add(p);
      }
      return out;
    }

    // ------------------------------------------------------------ tokens: the words of a line, for display (tap a word)
    function srcTokens(s) {
      const out = [];
      let i = 0;
      while (i < s.length) {
        if (/\s/.test(s[i])) { i++; continue; }
        let j = i, depth = 0;
        while (j < s.length && (depth || !/\s/.test(s[j]))) { if (s[j] === '[') depth++; else if (s[j] === ']') depth = Math.max(0, depth - 1); j++; }
        const tok = s.slice(i, j), surf = tok.replace(/\[([^\]|]*)\|[^\]]*\]/g, '$1').replace(/^\*+|\*+$/g, '');
        const word = /[㐀-鿿豈-﫿A-Za-z0-9]/.test(surf) && !/^\{/.test(surf);
        const e = word ? first(surf) : null;
        out.push({ t: surf, s: i, e: j, word, src: tok, id: e ? e.id : null });
        i = j;
      }
      return out;
    }
    function tokens(text) {
      const raw = String(text == null ? '' : text);
      if (/\[[^\]|]+\|[^\]]*\]/.test(raw)) return srcTokens(raw);
      return analyze(raw).words.map(w => ({ t: w.t, s: w.s, e: w.e, word: !w.punct, id: w.id || null }));
    }

    // ------------------------------------------------------------ the pack
    const all = [...E.values()];
    return {
      lang: 'zh', entries: E, tokens, analyze, check, fix, gloss, inflect, find,
      connectors: all.filter(e => e.fl.conn).map(e => e.ch),
      fillers: all.filter(e => e.fl.fill).map(e => e.ch),
      src: id => (E.get(id) ? E.get(id).lemma : null),
      sync: syncLex,
      stats() {
        const bands = [0, 0, 0, 0, 0], pos = {};
        for (const e of E.values()) { if (e.auto) continue; bands[e.band]++; pos[e.pos] = (pos[e.pos] || 0) + 1; }
        return { headwords: [...E.values()].filter(e => !e.auto).length, auto: autoN, bands, pos, bad: bad.slice(), dups: dups.slice() };
      },
      // LEX's words in Chinese that don't resolve to a headword (should be none)
      lexMissing() {
        syncLex();
        const out = [];
        if (typeof LEX !== 'undefined') for (const id of LEX.ids()) {
          const it = LEX.item(id);
          if (!it || typeof it.zh !== 'string' || !it.zh) continue;
          const hit = find(it.zh).some(e => e.lex === id || (e.lexs && e.lexs.includes(id)));
          if (!hit) out.push(id);
        }
        return out;
      },
      _: { unitize, cover, segOrtho, byCh, bySyl, phrases },
    };
  }

  function lev(a, b) {
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }

  DICT.register('zh', make);

  // ================================================================ the word list (one headword per line; see the top)
  W.push(`
// ---- people words, pronouns, question words
我 wǒ pron1 I, me %p1
你 nǐ pron1 you %p2
您 nín pron1 you (polite) %p2,formal
他 tā pron1 he, him @people %p3
她 tā pron1 she, her @people %p3
它 tā pron1 it %p3
我们 wǒ men pron1 we, us %p1,pl
你们 nǐ men pron1 you (all of you) %p2,pl
他们 tā men pron1 they, them @people %p3,pl
她们 tā men pron1 they (women) @people %p3,pl
它们 tā men pron2 they (things, animals) %p3,pl
咱们 zán men pron2 we (you and I) %p1,pl
自己 zì jǐ pron2 oneself, own
大家 dà jiā pron2 everyone @people %p3,pl
别人 bié rén pron2 other people @people %p3,pl
谁 shéi pron1 who %q
什么 shén me pron1 what %q
哪 nǎ det1 which %qq,d
哪里 nǎ lǐ pron1 where %q
哪儿 nǎ r pron1 where %q
这里 zhè lǐ pron1 here @place
这儿 zhè r pron1 here @place
那里 nà lǐ pron1 there @place
那儿 nà r pron1 there @place
怎么 zěn me adv1 how; why %qq
怎么样 zěn me yàng pron1 how is it, how about %qq
怎样 zěn yàng pron3 how %qq
为什么 wèi shén me adv1 why %qq
多少 duō shao num1 how many, how much %qq
几 jǐ num1 how many; a few %qq,d
多久 duō jiǔ adv2 how long %qq
什么时候 shén me shí hou pron1 when %qq
干什么 gàn shén me phrase2 what are you doing, what for %qq
这 zhè det1 this %d
那 nà det1 that %d
这些 zhè xiē det1 these %pl
那些 nà xiē det1 those %pl
这样 zhè yàng adv2 like this, so
那样 nà yàng adv3 like that
这么 zhè me adv2 so, this
那么 nà me conj2 then, so; that %conj
每 měi det1 every %d
某 mǒu det4 a certain %d
各 gè det3 each
其他 qí tā pron3 other, others
别的 bié de pron2 other, else
所有 suǒ yǒu adj3 all %ng
一切 yī qiè pron3 everything
任何 rèn hé pron3 any
// ---- particles
的 de part1 's, of (links a description to a noun)
地 de part3 -ly (links a manner to a verb)
地#n dì n3 ground, floor @nature
得 de part2 (links a verb to how it's done: 跑得快)
得#v děi v3 must, have to %mod,st
了 le part1 done; (a change) %asp,sfp
过 guò part1 ever, have done before %asp
过#v guò v2 cross, pass; spend (a day)
着 zhe part2 -ing (ongoing) %asp
吗 ma part1 (makes a yes/no question) %sfp
呢 ne part1 and…? what about…? %sfp
吧 ba part1 let's; …right? %sfp
啊 a part1 oh; ah (softens a sentence) %sfp
呀 ya part2 oh! %sfp
嘛 ma part3 (it's obvious); come on %sfp
啦 la part3 (了 + 啊) %sfp
们 men part1 (more than one person)
// ---- no, yes, greetings, little words
不 bù adv1 not, no %neg
没 méi adv1 not (didn't); don't have %neg
没有 méi yǒu v1 not have; didn't %neg
别 bié adv1 don't %neg
不要 bù yào adv2 don't; not want %neg,mod =ph.zc.buyao
不用 bù yòng adv3 no need to %neg,mod
对 duì adj1 right, correct %ng =c.yes
对#prep duì prep2 to, toward, for
是的 shì de int2 yes, that's right
好 hǎo adj1 good, well; OK +
好的 hǎo de int1 OK, all right
行 xíng v2 OK, will do; be fine %st
可以 kě yǐ v1 can, may %mod,st
你好 nǐ hǎo int1 hello =w.hello
您好 nín hǎo int1 hello (polite)
早上好 zǎo shang hǎo int2 good morning
晚上好 wǎn shang hǎo int2 good evening
晚安 wǎn ān int2 good night
再见 zài jiàn int1 goodbye
拜拜 bái bái int2 bye-bye
谢谢 xiè xie v1 thank you =c.thanks
不客气 bù kè qi phrase1 you're welcome
对不起 duì bu qǐ phrase1 sorry =ph.love.siento
没关系 méi guān xi phrase1 it doesn't matter, it's OK
没事 méi shì phrase2 it's nothing, no problem
请 qǐng v1 please; invite =c.please
请问 qǐng wèn phrase2 excuse me, may I ask
欢迎 huān yíng v2 welcome
欢迎光临 huān yíng guāng lín phrase3 welcome (to our shop) =ph.gm.huanying
喂 wèi int1 hello (on the phone); hey
嗯 èn int1 mm, uh-huh %fill
呃 è int3 er, uh %fill
哦 ò int1 oh, I see %fill
哎 āi int2 hey; oh %fill
哇 wā int2 wow
嘿 hēi int2 hey
哎呀 āi yā int2 oh no, oops =ph.sw.zh.aiya
糟糕 zāo gāo adj3 oh no, terrible - =ph.sw.zh.zaogao
加油 jiā yóu int3 come on! you can do it! =ph.kf.jiayou
// ---- numbers
零 líng num1 zero
一 yī num1 one =n.1
二 èr num1 two =n.2
两 liǎng num1 two (before a measure word)
三 sān num1 three =n.3,c.three
四 sì num1 four =n.4
五 wǔ num1 five =n.5
六 liù num1 six =n.6
七 qī num1 seven =n.7
八 bā num1 eight =n.8
九 jiǔ num1 nine =n.9
十 shí num1 ten =n.10
十一 shí yī num1 eleven =n.11
十二 shí èr num1 twelve =n.12
十三 shí sān num1 thirteen =n.13
十四 shí sì num1 fourteen =n.14
十五 shí wǔ num1 fifteen =n.15
十六 shí liù num1 sixteen =n.16
十七 shí qī num1 seventeen =n.17
十八 shí bā num1 eighteen =n.18
十九 shí jiǔ num1 nineteen =n.19
二十 èr shí num1 twenty =n.20
百 bǎi num1 hundred
千 qiān num1 thousand
万 wàn num2 ten thousand
亿 yì num3 hundred million
半 bàn num2 half
第 dì part2 (makes an ordinal: 第一 first)
一些 yī xiē num1 some, a few
一点 yī diǎn num1 a little
一点儿 yī diǎn r num1 a little
有点 yǒu diǎn adv2 a bit, rather
有点儿 yǒu diǎn r adv2 a bit, rather
一下 yī xià num2 a moment, (do it) once
一会儿 yī huì r n3 a little while %dur
// ---- measure words
个 gè cl1 (the everyday measure word)
只#cl zhī cl1 (animals; one of a pair)
本 běn cl1 (books)
张 zhāng cl2 (flat things: paper, tables, beds, tickets, photos)
块 kuài cl1 piece; yuan (money) %part
件 jiàn cl2 (clothes; matters)
条 tiáo cl2 (long things: fish, roads, rivers, trousers)
辆 liàng cl3 (vehicles)
杯 bēi cl1 a cup of, a glass of %part
瓶 píng cl2 a bottle of %part
碗 wǎn cl2 a bowl of %part
双 shuāng cl2 a pair of %part
位 wèi cl2 (people, polite) %ppl
口 kǒu cl2 (people in a family); a mouthful %part
家#cl jiā cl1 (shops, restaurants, companies)
片 piàn cl3 a slice of, a piece of %part
支 zhī cl3 (pens; songs; teams)
朵 duǒ cl3 (flowers, clouds)
棵 kē cl3 (trees, plants)
座 zuò cl3 (mountains, bridges, buildings, towers)
所 suǒ cl3 (schools, houses)
间 jiān cl2 (rooms)
层 céng cl3 floor, layer %part
封 fēng cl3 (letters)
首 shǒu cl3 (songs, poems)
部 bù cl3 (films; phones)
台 tái cl3 (machines)
门#cl mén cl3 (school subjects)
节 jié cl2 (class periods)
场 chǎng cl3 (games, films, rain showers)
次 cì cl1 time(s) %part
遍 biàn cl3 time(s) (all the way through) %part
顿 dùn cl3 (meals)
份 fèn cl3 a portion of, a copy of %part
盘 pán cl3 a plate of; a game of %part
颗 kē cl3 (small round things: candy, stars, teeth, hearts)
粒 lì cl4 a grain of %part
匹 pǐ cl4 (horses)
头#cl tóu cl4 (cows, pigs)
道 dào cl3 (dishes; questions)
套 tào cl4 a set of %part
束 shù cl4 a bunch of %part
扇 shàn cl4 (doors, windows)
盏 zhǎn cl4 (lamps)
顶 dǐng cl4 (hats)
罐 guàn cl4 a can of, a jar of %part
包 bāo cl3 a pack of, a bag of %part
袋 dài cl4 a bag of %part
箱 xiāng cl4 a box of, a case of %part
盒 hé cl4 a box of %part
根 gēn cl3 (long thin things: bananas, sticks)
句 jù cl3 (sentences)
篇 piān cl3 (articles, essays)
种 zhǒng cl2 kind of, type of %part
些 xiē cl1 some %part
群 qún cl3 a group of, a crowd of %part
滴 dī cl4 a drop of %part
副 fù cl4 a pair of (glasses, gloves) %part
架 jià cl4 (planes, pianos)
艘 sōu cl4 (ships, boats)
幅 fú cl4 (paintings)
段 duàn cl3 a section of, a stretch of %part
阵 zhèn cl4 a gust of, a burst of %part
趟 tàng cl3 a trip %part
枚 méi cl4 (coins, medals)
元 yuán cl2 yuan (money) %part
毛 máo cl3 ten cents %part
角 jiǎo cl3 ten cents %part
斤 jīn cl3 half a kilo %part
公斤 gōng jīn cl3 kilogram %part
公里 gōng lǐ cl3 kilometer %part
米#cl mǐ cl3 meter %part
// ---- linking words
和 hé conj1 and, with
跟 gēn prep2 with; and
因为 yīn wèi conj1 because %conj
所以 suǒ yǐ conj1 so, therefore %conj
但是 dàn shì conj1 but %conj
可是 kě shì conj2 but %conj
不过 bù guò conj3 but, however %conj
然后 rán hòu conj2 then, after that %conj
而且 ér qiě conj2 and also, what's more %conj
或者 huò zhě conj2 or %conj
还是 hái shì conj2 or (in a question); still %conj
虽然 suī rán conj2 although %conj
如果 rú guǒ conj2 if %conj,hypo
要是 yào shi conj3 if %conj,hypo
假如 jiǎ rú conj4 if, suppose %conj,hypo
万一 wàn yī conj4 in case %conj,hypo
的话 de huà part3 if (…的话) %hypo
因此 yīn cǐ conj3 therefore %conj
于是 yú shì conj3 so, and then %conj
接着 jiē zhe conj3 next, then %conj
后来 hòu lái n2 later, afterwards %conj
只要 zhǐ yào conj3 as long as %conj,hypo
只有 zhǐ yǒu conj3 only if %conj
不但 bù dàn conj3 not only %conj
并且 bìng qiě conj3 and, besides %conj
而 ér conj3 and, while, but %conj
另外 lìng wài conj3 besides, in addition %conj
比如 bǐ rú conj3 for example %conj
例如 lì rú conj3 for example %conj
其实 qí shí adv3 actually %conj
总之 zǒng zhī conj4 in short %conj
首先 shǒu xiān adv3 first of all %conj
其次 qí cì adv3 next, secondly %conj
最后 zuì hòu adv2 finally, at last %conj
然而 rán ér conj3 however %conj
否则 fǒu zé conj3 otherwise %conj
要不然 yào bù rán conj4 otherwise %conj
即使 jí shǐ conj3 even if %conj,hypo
无论 wú lùn conj3 no matter %conj
不管 bù guǎn conj3 no matter %conj
尽管 jǐn guǎn conj3 even though %conj
既然 jì rán conj3 since, now that %conj
一边 yī biān adv3 while (一边…一边) %conj
一方面 yī fāng miàn conj4 on the one hand %conj
// ---- prepositions
从 cóng prep1 from
往 wǎng prep2 toward
向 xiàng prep3 toward, to
朝 cháo prep3 facing, toward
比 bǐ prep2 than, compared to
把 bǎ prep3 (puts the object before the verb)
把#cl bǎ cl2 (things with a handle: chairs, knives, umbrellas, keys)
被 bèi prep3 by (something is done to it)
离 lí prep2 from (how far)
关于 guān yú prep3 about
为了 wèi le prep3 in order to, for
替 tì prep4 for, in place of
除了 chú le prep3 except, besides
通过 tōng guò prep3 through, by
按照 àn zhào prep3 according to
根据 gēn jù prep2 according to, based on
随着 suí zhe prep3 along with, as
沿着 yán zhe prep4 along
自从 zì cóng prep4 since
对于 duì yú prep3 as for, toward
// ---- adverbs
很 hěn adv1 very
太 tài adv1 too; so
非常 fēi cháng adv2 very, extremely
真 zhēn adv1 really, truly
最 zuì adv2 most, -est
更 gèng adv3 even more
比较 bǐ jiào adv3 rather, fairly
也 yě adv1 also, too
都 dōu adv1 all, both
还 hái adv1 still; also; even
还#v huán v2 give back, return
就 jiù adv2 just, then, right away
才 cái adv2 only then; only
又 yòu adv2 again (already happened)
再 zài adv1 again (not yet); then
已经 yǐ jīng adv2 already
先 xiān adv1 first, before
另 lìng det3 another, other
起 qǐ v3 rise, get up; start
时 shí n3 time; when (…的时候) %ncl
店 diàn n3 shop, store #家,个 @shop
城 chéng n3 city, town #座,个 @town
一起 yī qǐ adv1 together
一直 yī zhí adv3 all along; straight
一定 yī dìng adv3 surely, must
一共 yī gòng adv3 altogether
只 zhǐ adv2 only
刚 gāng adv3 just
刚刚 gāng gāng adv3 just now
马上 mǎ shàng adv3 right away
常常 cháng cháng adv2 often %hab
经常 jīng cháng adv3 often %hab
总是 zǒng shì adv3 always %hab
老是 lǎo shì adv4 always (annoyingly) %hab
通常 tōng cháng adv3 usually %hab
从来 cóng lái adv3 always, ever (从来不: never) %hab
有时候 yǒu shí hou adv2 sometimes %hab
有时 yǒu shí adv3 sometimes %hab
偶尔 ǒu ěr adv3 now and then %hab
往往 wǎng wǎng adv3 often, tend to %hab
终于 zhōng yú adv3 at last, finally
突然 tū rán adv3 suddenly
当然 dāng rán adv3 of course
可能 kě néng adv2 maybe; possible
也许 yě xǔ adv3 perhaps
大概 dà gài adv3 probably, about
特别 tè bié adv3 especially; special
十分 shí fēn adv3 very, fully
相当 xiāng dāng adv3 quite
差不多 chà bu duō adv3 almost, about the same
几乎 jī hū adv2 almost
正好 zhèng hǎo adv3 just right, happen to
越来越 yuè lái yuè adv3 more and more
慢慢 màn màn adv2 slowly
互相 hù xiāng adv3 each other
到处 dào chù adv3 everywhere
顺便 shùn biàn adv3 on the way, by the way
本来 běn lái adv3 originally, at first
仍然 réng rán adv3 still
好像 hǎo xiàng adv3 seem, look like
正在 zhèng zài adv2 (in the middle of doing)
正 zhèng adv3 just (now); exactly
一样 yī yàng adj3 the same %ng
一般 yī bān adj3 ordinary; usually %hab
全 quán adj3 whole, all %ng
全部 quán bù n3 all, the whole
`);
  W.push(`
// ---- verbs: being, having, moving
是 shì v1 be (is, am, are) %cop,st
有 yǒu v1 have; there is %st
在 zài v1 be at, be in; (doing) now %st
像 xiàng v3 be like, look like %st
姓 xìng v2 be surnamed %st
叫 jiào v1 be called; call, shout %st
属 shǔ v4 be born in the year of (the zodiac) %st
去 qù v1 go
来 lái v1 come
回 huí v1 go back, return
到 dào v1 arrive; to, until
走 zǒu v1 walk; leave, go
跑 pǎo v2 run
飞 fēi v2 fly
游 yóu v3 swim =v.swim
爬 pá v3 climb, crawl =v.climb
跳 tiào v2 jump =v.jump
坐 zuò v1 sit; take (a bus, a train) %zai
站 zhàn v2 stand %zai
躺 tǎng v3 lie down %zai
住 zhù v1 live (somewhere); stay %zai
停 tíng v3 stop, park %zai
出 chū v2 go out, come out
进 jìn v2 enter, come in
出去 chū qù v2 go out
出来 chū lái v2 come out
进去 jìn qù v2 go in
进来 jìn lái v2 come in
回来 huí lái v2 come back
回去 huí qù v2 go back
回家 huí jiā v1 go home @home
上#v shàng v2 go up; get on; go to (class, work)
下#v xià v2 go down; get off
上来 shàng lái v3 come up
上去 shàng qù v3 go up
下来 xià lái v3 come down
下去 xià qù v3 go down
过来 guò lái v3 come over
过去#v guò qù v3 go over, pass by
起来 qǐ lái v3 get up, rise
离开 lí kāi v3 leave
出发 chū fā v3 set off @travel
到达 dào dá v4 arrive @travel
经过 jīng guò v3 pass by, go through
搬 bān v3 move, carry
搬家 bān jiā v3 move house @home
带 dài v3 bring, take along
拿 ná v2 take, hold, carry
放 fàng v3 put; let go %zai
送 sòng v2 give (a gift); see off, take someone
给 gěi v1 give; for, to
接 jiē v3 pick up, meet; catch
找 zhǎo v2 look for, find
找到 zhǎo dào v2 find (and get it)
丢 diū v3 lose; throw
扔 rēng v3 throw, throw away =v.throw
投 tóu v4 throw, cast
推 tuī v3 push =v.push
拉 lā v3 pull
推倒 tuī dǎo v4 push over
推翻 tuī fān v4 knock over
推掌 tuī zhǎng v4 palm strike (kung fu) @sport =v.palm
打 dǎ v1 hit; play (a ball game); make (a call) =v.hit
踢 tī v3 kick @sport
踩 cǎi v4 step on, stomp
揍 zòu v4 beat up
敲 qiāo v3 knock, tap
砸 zá v4 smash
蹦 bèng v4 hop, bounce
抓 zhuā v4 catch, grab
抓到 zhuā dào v4 catch (and get)
抱 bào v3 hug, hold in your arms
摸 mō v4 touch, stroke
碰 pèng v4 bump, touch; run into
握手 wò shǒu v3 shake hands
指 zhǐ v3 point
抬 tái v3 lift, carry (together)
举 jǔ v3 raise, lift
摔 shuāi v4 fall, drop
倒 dǎo v4 fall over
掉 diào v3 drop, fall
// ---- verbs: seeing, saying, thinking
看 kàn v1 look, watch, read =c.look
看见 kàn jiàn v1 see
看到 kàn dào v2 see
见 jiàn v2 see, meet
见面 jiàn miàn v3 meet (each other)
听 tīng v1 listen, hear
听见 tīng jiàn v2 hear
听说 tīng shuō v2 hear (that), they say %clause
说 shuō v1 say, speak %clause
说话 shuō huà v1 talk, speak
讲 jiǎng v3 tell, speak, explain
谈 tán v3 talk, discuss
聊天 liáo tiān v3 chat
告诉 gào su v2 tell %clause
问 wèn v2 ask %clause
回答 huí dá v2 answer
介绍 jiè shào v2 introduce
解释 jiě shì v3 explain
讨论 tǎo lùn v3 discuss
商量 shāng liang v3 talk over
同意 tóng yì v3 agree %st
反对 fǎn duì v3 oppose
建议 jiàn yì v3 suggest; a suggestion
答应 dā ying v4 promise, agree
骂 mà v4 scold, curse
吵架 chǎo jià v3 quarrel
打架 dǎ jià v4 fight
开玩笑 kāi wán xiào v3 joke
叫做 jiào zuò v4 be called %st
读 dú v1 read (aloud), study
写 xiě v1 write
画 huà v2 draw, paint @art
唱 chàng v2 sing @music
唱歌 chàng gē v2 sing (songs) @music =v.sing
跳舞 tiào wǔ v2 dance @music
想 xiǎng v1 want to; think; miss %mod,st,clause
想念 xiǎng niàn v4 miss (someone) %st
觉得 jué de v2 feel, think %st,clause
认为 rèn wéi v3 think, believe %st,clause
以为 yǐ wéi v3 thought (wrongly) %st,clause
知道 zhī dào v2 know (a fact) %st,clause
认识 rèn shi v1 know (a person) %st
懂 dǒng v2 understand %st
明白 míng bai v3 understand; clear %st
了解 liǎo jiě v3 understand, know well %st
理解 lǐ jiě v3 understand %st
记得 jì de v3 remember %st,clause
记住 jì zhù v4 remember, memorize
忘 wàng v3 forget %clause
忘记 wàng jì v3 forget %clause
相信 xiāng xìn v3 believe %st
怀疑 huái yí v3 doubt %st
考虑 kǎo lǜ v3 think over %clause
决定 jué dìng v3 decide %clause
发现 fā xiàn v3 find out, discover %clause
猜 cāi v3 guess %clause
梦见 mèng jiàn v4 dream of
希望 xī wàng v2 hope %st,clause
打算 dǎ suàn v3 plan to %fut,mod,clause
准备 zhǔn bèi v2 get ready; plan to %fut,mod,clause
计划 jì huà v3 plan %fut,mod
// ---- verbs: wanting, can, must
要 yào v1 want; will; need %mod,fut
会 huì v1 can (know how); will %mod,fut,st
能 néng v1 can, be able to %mod,st
应该 yīng gāi v3 should %mod,st
需要 xū yào v3 need %mod,st
愿意 yuàn yì v3 be willing %mod,st
敢 gǎn v3 dare %mod,st
必须 bì xū adv3 must
可能#v kě néng v3 may, might %mod,st
喜欢 xǐ huan v1 like %st,mod +
爱 ài v1 love %st,mod +
讨厌 tǎo yàn v3 hate, dislike %st -
怕 pà v2 fear, be afraid of %st
害怕 hài pà v3 be scared %st
担心 dān xīn v3 worry %st
关心 guān xīn v3 care about %st
放心 fàng xīn v3 rest easy, not worry
小心 xiǎo xīn v3 be careful
注意 zhù yì v3 pay attention
羡慕 xiàn mù v3 envy %st
感谢 gǎn xiè v3 thank
谢谢#v xiè xie v4 thank (someone)
// ---- verbs: daily life
吃 chī v1 eat @food =v.eat
吃掉 chī diào v3 eat up @food
喝 hē v1 drink @drink
做 zuò v1 do, make
做饭 zuò fàn v2 cook @food
尝 cháng v3 taste @food
炒 chǎo v4 stir-fry @food
煮 zhǔ v4 boil @food
烤 kǎo v4 roast, bake @food
切 qiē v4 cut @food
点菜 diǎn cài v3 order food =ph.gm.diancai
买 mǎi v1 buy @shop
卖 mài v2 sell @shop
花#v huā v3 spend (money, time) @money
付钱 fù qián v3 pay @money
付 fù v4 pay @money
换 huàn v3 change, exchange
借 jiè v3 borrow; lend
还钱 huán qián v4 pay back @money
用 yòng v1 use; with
睡 shuì v2 sleep
睡觉 shuì jiào v1 sleep, go to bed
睡着 shuì zháo v3 fall asleep =a.asleep
醒 xǐng v3 wake up
起床 qǐ chuáng v2 get up
洗 xǐ v2 wash
洗澡 xǐ zǎo v3 take a bath, shower
刷牙 shuā yá v3 brush your teeth
洗手 xǐ shǒu v3 wash your hands
穿 chuān v2 wear, put on @clothes
戴 dài v3 wear (a hat, glasses) @clothes
脱 tuō v3 take off @clothes
打扫 dǎ sǎo v3 clean (up) @home
收拾 shōu shi v3 tidy up @home
休息 xiū xi v2 rest
等 děng v2 wait (for)
等等 děng deng v2 wait a moment =c.wait
开 kāi v1 open; drive; turn on
关 guān v3 close; turn off
开门 kāi mén v2 open the door
关门 guān mén v3 close the door
打开 dǎ kāi v3 open, turn on
打电话 dǎ diàn huà v1 make a phone call @tech
接电话 jiē diàn huà v3 answer the phone @tech
上网 shàng wǎng v3 go online @tech
玩 wán v2 play, have fun @hobby
玩儿 wán r v2 play, have fun @hobby
工作 gōng zuò v1 work @work
上班 shàng bān v2 go to work @work
下班 xià bān v3 get off work @work
加班 jiā bān v3 work overtime @work
上课 shàng kè v2 go to class @school
下课 xià kè v3 finish class @school
学 xué v2 learn @school
学习 xué xí v1 study, learn @school
教 jiāo v2 teach @school
练习 liàn xí v3 practice @school
复习 fù xí v3 review @school
考试 kǎo shì v2 take an exam; exam @school
毕业 bì yè v3 graduate @school
留学 liú xué v3 study abroad @school
开始 kāi shǐ v2 begin, start %mod
完 wán v2 finish, be over
完成 wán chéng v3 complete
结束 jié shù v3 end, finish
继续 jì xù v3 continue %mod
帮 bāng v2 help
帮助 bāng zhù v2 help
帮忙 bāng máng v3 help (out)
照顾 zhào gù v3 look after
陪 péi v3 keep someone company
让 ràng v2 let, make (someone do)
叫#v jiào v3 ask, tell (someone to do)
请#v qǐng v2 invite; treat (to a meal)
邀请 yāo qǐng v3 invite
参加 cān jiā v3 take part in, join
旅游 lǚ yóu v2 travel; tourism @travel
旅行 lǚ xíng v3 travel @travel
参观 cān guān v3 visit (a place) @travel
散步 sàn bù v3 take a walk
逛街 guàng jiē v3 go shopping, stroll the streets @shop
跑步 pǎo bù v2 run, jog @sport
游泳 yóu yǒng v2 swim @sport =v.swim
锻炼 duàn liàn v2 exercise @sport
运动#v yùn dòng v2 do sports @sport
骑 qí v3 ride (a bike, a horse) @transport
开车 kāi chē v2 drive (a car) @transport
坐车 zuò chē v3 take a bus, ride @transport
迷路 mí lù v3 get lost @travel
笑 xiào v2 laugh, smile
哭 kū v2 cry
生气 shēng qì adj2 angry =a.angry
生病 shēng bìng v2 get sick @health
看病 kàn bìng v3 see a doctor @health
发烧 fā shāo v3 have a fever @health
咳嗽 ké sou v3 cough @health
感冒 gǎn mào v3 catch a cold; a cold @health
疼 téng adj3 hurt, ache @health
死 sǐ v3 die
出生 chū shēng v3 be born %zai
长大 zhǎng dà v3 grow up
结婚 jié hūn v3 marry @family
离婚 lí hūn v4 divorce @family
恋爱 liàn ài v4 be in love
约会 yuē huì v3 go on a date; a date
照相 zhào xiàng v3 take a photo @hobby
拍照 pāi zhào v3 take a photo @hobby
钓鱼 diào yú v4 fish @hobby
爬山 pá shān v3 climb a mountain, hike @sport
滑冰 huá bīng v4 skate @sport
滑雪 huá xuě v4 ski @sport
弹 tán v3 play (the piano, the guitar) @music
画画 huà huà v2 draw pictures @art
养 yǎng v4 raise, keep (a pet)
种#v zhòng v4 plant, grow @nature
浇水 jiāo shuǐ v4 water (plants) @nature
寄 jì v3 send (by post)
收到 shōu dào v3 receive
收 shōu v3 receive, accept
发 fā v3 send; give out
发生 fā shēng v3 happen
变 biàn v3 change, become
变成 biàn chéng v3 turn into
成为 chéng wéi v3 become
试 shì v3 try
选 xuǎn v3 choose
选择 xuǎn zé v3 choose; a choice
比赛#v bǐ sài v3 compete
赢 yíng v3 win
输 shū v3 lose (a game)
认输 rèn shū v4 give up, admit defeat
算 suàn v3 count; consider
数 shǔ v4 count
修 xiū v4 repair, fix
修理 xiū lǐ v3 repair
打印 dǎ yìn v3 print @tech
下载 xià zài v4 download @tech
保护 bǎo hù v3 protect
救 jiù v4 save, rescue
偷 tōu v4 steal
骗 piàn v3 trick, lie to
躲 duǒ v4 hide
藏 cáng v4 hide
藏好 cáng hǎo v4 hide well
逃 táo v4 run away, escape
追 zhuī v4 chase
赶 gǎn v3 hurry; catch (a train)
迟到 chí dào v3 be late
搬到 bān dào v4 move to
往#v wǎng v4 go toward
转 zhuǎn v3 turn
`);
  W.push(`
// ---- describing words
大 dà adj1 big; old (age) =a.big
小 xiǎo adj1 small, little =a.small
多 duō adj1 many, much
少 shǎo adj1 few, little
坏 huài adj3 bad; broken -
新 xīn adj2 new
旧 jiù adj3 old (things)
老 lǎo adj2 old (people, friends)
年轻 nián qīng adj3 young
长 cháng adj2 long
长#v zhǎng v3 grow
短 duǎn adj3 short (length)
高 gāo adj1 tall, high
矮 ǎi adj3 short (height)
胖 pàng adj3 fat, plump
瘦 shòu adj3 thin
快 kuài adj1 fast; soon
慢 màn adj2 slow
早 zǎo adj1 early
晚 wǎn adj1 late
远 yuǎn adj2 far
近 jìn adj2 near
冷 lěng adj1 cold @weather
热 rè adj1 hot @weather
暖和 nuǎn huo adj3 warm @weather
凉快 liáng kuai adj3 cool @weather
贵 guì adj2 expensive @money
便宜 pián yi adj2 cheap @money
漂亮 piào liang adj1 pretty, beautiful +
好看 hǎo kàn adj2 good-looking; good (to watch) +
难看 nán kàn adj3 ugly -
美 měi adj3 beautiful +
美丽 měi lì adj3 beautiful +
帅 shuài adj3 handsome, cool +
可爱 kě ài adj3 cute, lovely +
丑 chǒu adj4 ugly -
干净 gān jìng adj3 clean
脏 zāng adj3 dirty
忙 máng adj2 busy
累 lèi adj1 tired @feeling
困 kùn adj3 sleepy @feeling
饿 è adj1 hungry @food
渴 kě adj2 thirsty @drink
饱 bǎo adj3 full (after eating) @food
高兴 gāo xìng adj1 happy, glad @feeling +
快乐 kuài lè adj2 happy @feeling +
开心 kāi xīn adj3 happy, having fun @feeling +
幸福 xìng fú adj3 happy (in life) @feeling +
难过 nán guò adj3 sad, upset @feeling -
伤心 shāng xīn adj3 heartbroken @feeling -
紧张 jǐn zhāng adj3 nervous @feeling
害羞 hài xiū adj3 shy @feeling
无聊 wú liáo adj3 bored, boring @feeling -
着急 zháo jí adj3 worried, in a hurry @feeling
激动 jī dòng adj3 excited @feeling
感动 gǎn dòng adj3 moved, touched @feeling
满意 mǎn yì adj3 satisfied @feeling +
失望 shī wàng adj3 disappointed @feeling -
寂寞 jì mò adj4 lonely @feeling -
孤单 gū dān adj3 lonely @feeling -
骄傲 jiāo ào adj3 proud @feeling
放松 fàng sōng v3 relax @feeling
有意思 yǒu yì si adj2 interesting +
有趣 yǒu qù adj3 interesting, fun +
好玩 hǎo wán adj3 fun +
好吃 hǎo chī adj1 delicious @food + =ph.gm.haochi
不错 bù cuò adj2 not bad, pretty good +
口味 kǒu wèi n3 taste (what you like to eat) #种 @food
好喝 hǎo hē adj2 tasty (to drink) @drink +
难吃 nán chī adj3 tastes bad @food -
好听 hǎo tīng adj3 nice to hear @music +
舒服 shū fu adj3 comfortable, well @health +
健康 jiàn kāng adj3 healthy @health +
容易 róng yì adj3 easy
难 nán adj2 hard, difficult
简单 jiǎn dān adj3 simple
复杂 fù zá adj3 complicated
重要 zhòng yào adj3 important
有名 yǒu míng adj3 famous
著名 zhù míng adj3 famous
聪明 cōng ming adj3 clever +
笨 bèn adj3 stupid, clumsy -
努力 nǔ lì adj3 hard-working; work hard +
认真 rèn zhēn adj3 serious, careful +
热情 rè qíng adj3 warm, enthusiastic +
友好 yǒu hǎo adj3 friendly +
安静 ān jìng adj3 quiet
吵 chǎo adj3 noisy
热闹 rè nao adj3 lively, bustling
奇怪 qí guài adj3 strange
不同 bù tóng adj3 different %ng
差 chà adj3 poor, bad; short of
棒 bàng adj3 great +
厉害 lì hai adj3 amazing; fierce
酷 kù adj4 cool +
满 mǎn adj3 full
空 kōng adj3 empty
轻 qīng adj3 light (weight)
重 zhòng adj3 heavy
深 shēn adj3 deep; dark (color)
浅 qiǎn adj4 shallow; light (color)
亮 liàng adj3 bright
暗 àn adj4 dark, dim
甜 tián adj3 sweet @food
酸 suān adj3 sour @food
苦 kǔ adj3 bitter @food
辣 là adj3 spicy @food
咸 xián adj3 salty @food
香 xiāng adj3 fragrant, smells good
臭 chòu adj4 smelly
新鲜 xīn xiān adj3 fresh @food
安全 ān quán adj3 safe
危险 wēi xiǎn adj3 dangerous
方便 fāng biàn adj3 convenient
清楚 qīng chu adj3 clear
正确 zhèng què adj3 correct
错 cuò adj2 wrong %ng
真的 zhēn de adv2 really, truly
假 jiǎ adj3 fake %ng
主要 zhǔ yào adj2 main %ng
普通 pǔ tōng adj3 ordinary, common
可怜 kě lián adj3 poor (thing), pitiful
幸运 xìng yùn adj4 lucky +
倒霉 dǎo méi adj4 unlucky -
老实 lǎo shi adj4 honest
诚实 chéng shí adj3 honest +
勇敢 yǒng gǎn adj3 brave +
懒 lǎn adj3 lazy -
马虎 mǎ hu adj3 careless -
耐心 nài xīn adj3 patient +
客气 kè qi adj3 polite; formal
随便 suí biàn adj3 casual; as you like
合适 hé shì adj3 suitable, right
干 gān adj4 dry
湿 shī adj4 wet
圆 yuán adj4 round
直 zhí adj4 straight
宽 kuān adj4 wide
窄 zhǎi adj4 narrow
硬 yìng adj4 hard, stiff
软 ruǎn adj4 soft
厚 hòu adj3 thick
薄 báo adj4 thin (flat things)
够 gòu adj3 enough
久 jiǔ adj3 long (time)
好久 hǎo jiǔ adv3 a long time %dur
很久 hěn jiǔ adv3 a long time %dur
// ---- colors
颜色 yán sè n2 color #种
红色 hóng sè n1 red @color =a.red
红 hóng adj2 red @color
蓝色 lán sè n1 blue @color =a.blue
蓝 lán adj2 blue @color
绿色 lǜ sè n1 green @color =a.green
绿 lǜ adj2 green @color
黄色 huáng sè n1 yellow @color =a.yellow
黄 huáng adj2 yellow @color
白色 bái sè n1 white @color =a.white
白 bái adj2 white @color
黑色 hēi sè n1 black @color
黑 hēi adj2 black; dark @color
紫色 zǐ sè n3 purple @color
粉色 fěn sè n3 pink @color
粉红色 fěn hóng sè n3 pink @color
橙色 chéng sè n3 orange (color) @color
灰色 huī sè n3 gray @color
棕色 zōng sè n4 brown @color
金色 jīn sè n3 golden @color
银色 yín sè n4 silver @color
// ---- where
上 shàng n1 on, above, up =p.top
下 xià n1 under, below, down =p.bottom
上面 shàng miàn n2 on top, above
下面 xià miàn n2 below, under
上边 shàng bian n2 above
下边 xià bian n2 below
左边 zuǒ biān n1 the left =p.left
右边 yòu biān n1 the right =p.right
左 zuǒ n2 left
右 yòu n2 right
中间 zhōng jiān n2 the middle =p.middle
里 lǐ n1 in, inside
里面 lǐ miàn n2 inside
里边 lǐ bian n2 inside
外 wài n2 outside
外面 wài miàn n2 outside
外边 wài bian n2 outside
前 qián n1 front; before
前面 qián miàn n1 in front
前边 qián bian n2 in front
后 hòu n1 back; after
后面 hòu miàn n1 behind
后边 hòu bian n2 behind
旁边 páng biān n2 beside, next to
对面 duì miàn n3 across from
附近 fù jìn n3 nearby
东 dōng n2 east
西 xī n2 west
南 nán n2 south
北 běi n2 north
东边 dōng biān n2 the east (side)
西边 xī biān n2 the west (side)
南边 nán biān n2 the south (side)
北边 běi biān n2 the north (side) =c.north
中 zhōng n3 middle; in
周围 zhōu wéi n3 around, the surroundings
底 dǐ n3 bottom
地方 dì fang n2 place #个 %ncl
这边 zhè biān pron3 this side, over here
那边 nà biān pron3 over there
// ---- when
时间 shí jiān n1 time #- %ncl
时候 shí hou n1 time, moment #- %ncl,rel
昨天 zuó tiān n1 yesterday @time %tp
今天 jīn tiān n1 today @time %tn
明天 míng tiān n1 tomorrow @time %tf
前天 qián tiān n2 the day before yesterday @time %tp
后天 hòu tiān n2 the day after tomorrow @time %tf
早上 zǎo shang n1 (early) morning @time %tn
上午 shàng wǔ n1 morning @time %tn
中午 zhōng wǔ n1 noon @time %tn
下午 xià wǔ n1 afternoon @time %tn
晚上 wǎn shang n1 evening, night @time %tn
夜里 yè lǐ n3 at night @time %tn
现在 xiàn zài n1 now @time %tn
刚才 gāng cái n3 just now @time %tp
去年 qù nián n2 last year @time %tp
今年 jīn nián n1 this year @time %tn
明年 míng nián n1 next year @time %tf
前年 qián nián n3 the year before last @time %tp
后年 hòu nián n3 the year after next @time %tf
上个月 shàng ge yuè n2 last month @time %tp
下个月 xià ge yuè n2 next month @time %tf
这个月 zhè ge yuè n2 this month @time %tn
上周 shàng zhōu n3 last week @time %tp
下周 xià zhōu n3 next week @time %tf
这周 zhè zhōu n3 this week @time %tn
上星期 shàng xīng qī n2 last week @time %tp
下星期 xià xīng qī n2 next week @time %tf
周末 zhōu mò n2 the weekend @time %tn
昨晚 zuó wǎn n3 last night @time %tp
今晚 jīn wǎn n2 tonight @time %tn
最近 zuì jìn n2 recently, lately @time %tn
以前 yǐ qián n2 before; in the past @time %rel
以后 yǐ hòu n2 after; later @time %rel
之前 zhī qián n3 before @time %rel
之后 zhī hòu n3 after @time %rel
小时候 xiǎo shí hou n3 as a child @time %rel
将来 jiāng lái n3 the future @time %tf
未来 wèi lái n4 the future @time %tf
过去 guò qù n3 the past @time %rel
那时候 nà shí hou n3 at that time @time %rel
当时 dāng shí n3 back then @time %rel
星期 xīng qī n1 week #个 @time %ncl
周 zhōu n3 week @time %ncl
星期一 xīng qī yī n1 Monday @time %tn
星期二 xīng qī èr n1 Tuesday @time %tn
星期三 xīng qī sān n1 Wednesday @time %tn
星期四 xīng qī sì n1 Thursday @time %tn
星期五 xīng qī wǔ n1 Friday @time %tn
星期六 xīng qī liù n1 Saturday @time %tn
星期天 xīng qī tiān n1 Sunday @time %tn
星期日 xīng qī rì n2 Sunday @time %tn
天 tiān n1 day; sky @time %ncl
年 nián n1 year @time %ncl
月 yuè n1 month; moon @time %ncl
日 rì n2 day; sun @time %ncl
号 hào n1 date; number %ncl
点 diǎn n1 o'clock; point @time %ncl
分钟 fēn zhōng n1 minute @time %ncl,dur
小时 xiǎo shí n1 hour #个 @time %ncl,dur
秒 miǎo n3 second @time %ncl
分 fēn n1 minute; point; cent %ncl
刻 kè n3 quarter of an hour @time %ncl
半天 bàn tiān n3 half a day; ages @time %dur
世纪 shì jì n3 century #个 @time %ncl
岁 suì n1 years old %ncl
生日 shēng rì n1 birthday #个 @time
节日 jié rì n3 holiday, festival #个 @time
假期 jià qī n3 holidays, vacation #个 @time
春天 chūn tiān n2 spring @time,weather %tn
夏天 xià tiān n2 summer @time,weather %tn
秋天 qiū tiān n2 autumn @time,weather %tn
冬天 dōng tiān n2 winter @time,weather %tn
季节 jì jié n3 season #个 @time
每天 měi tiān adv1 every day @time %hab
每年 měi nián adv2 every year @time %hab
天天 tiān tiān adv3 every day @time %hab
平时 píng shí n4 usually, normally @time %hab
`);
  W.push(`
// ---- people and family
人 rén n1 person, people #个,位,口 @people %ncl
朋友 péng you n1 friend #个,位 @people =c.friend
好朋友 hǎo péng you n2 good friend, best friend #个,位 @people
男朋友 nán péng you n3 boyfriend #个 @people
女朋友 nǚ péng you n3 girlfriend #个 @people
家人 jiā rén n2 family (members) #个,位 @family
家 jiā n1 home; family #个 @home,family
家庭 jiā tíng n3 family #个 @family
爸爸 bà ba n1 dad #个,位 @family
妈妈 mā ma n1 mom #个,位 @family
父亲 fù qīn n3 father #个,位 @family
母亲 mǔ qīn n3 mother #个,位 @family
父母 fù mǔ n3 parents @family %ncl
哥哥 gē ge n1 older brother #个 @family
姐姐 jiě jie n1 older sister #个 @family
弟弟 dì di n1 younger brother #个 @family
妹妹 mèi mei n1 younger sister #个 @family
兄弟 xiōng dì n3 brothers #个 @family
姐妹 jiě mèi n3 sisters #个 @family
儿子 ér zi n1 son #个 @family
女儿 nǚ ér n1 daughter #个 @family
孩子 hái zi n1 child #个 @family,people %ncl
爷爷 yé ye n1 grandpa (dad's dad) #个,位 @family
奶奶 nǎi nai n1 grandma (dad's mom) #个,位 @family
外公 wài gōng n3 grandpa (mom's dad) #个,位 @family
外婆 wài pó n3 grandma (mom's mom) #个,位 @family
姥姥 lǎo lao n4 grandma (mom's mom) #个,位 @family
叔叔 shū shu n3 uncle; mister #个,位 @family,people
阿姨 ā yí n3 aunt; auntie #个,位 @family,people
舅舅 jiù jiu n4 uncle (mom's brother) #个,位 @family
丈夫 zhàng fu n2 husband #个,位 @family
妻子 qī zi n2 wife #个,位 @family
老公 lǎo gōng n4 husband (casual) #个 @family
老婆 lǎo po n4 wife (casual) #个 @family
宝宝 bǎo bao n4 baby #个 @family
孙子 sūn zi n3 grandson #个 @family
孙女 sūn nǚ n4 granddaughter #个 @family
亲戚 qīn qi n3 relative #个,位 @family
男人 nán rén n2 man #个 @people
女人 nǚ rén n2 woman #个 @people
男孩 nán hái n2 boy #个 @people
女孩 nǚ hái n2 girl #个 @people
男生 nán shēng n3 boy, male student #个 @people
女生 nǚ shēng n3 girl, female student #个 @people
小孩 xiǎo hái n2 child, kid #个 @people
老人 lǎo rén n3 old person #个,位 @people
先生 xiān sheng n1 Mr.; sir; husband #个,位 @people
小姐 xiǎo jie n1 Miss; young lady #个,位 @people
女士 nǚ shì n3 Ms., madam #个,位 @people
客人 kè rén n3 guest #个,位 @people
邻居 lín jū n3 neighbor #个,位 @people
同学 tóng xué n1 classmate #个,位 @school,people
同事 tóng shì n3 colleague #个,位 @work,people
老板 lǎo bǎn n3 boss, shop owner #个,位 @work,people
老师 lǎo shī n1 teacher #个,位 @school,people =w.teacher
学生 xué sheng n1 student #个 @school,people
医生 yī shēng n1 doctor #个,位 @health,work
大夫 dài fu n3 doctor #个,位 @health,work
护士 hù shi n3 nurse #个,位 @health,work
服务员 fú wù yuán n2 waiter, waitress #个,位 @work
司机 sī jī n3 driver #个,位 @work,transport
警察 jǐng chá n3 police officer #个,位 @work
厨师 chú shī n4 cook, chef #个,位 @work,food
面包师 miàn bāo shī n4 baker #个,位 @work,food =w.baker
农民 nóng mín n4 farmer #个,位 @work,people
工人 gōng rén n4 worker #个,位,名 @work,people
律师 lǜ shī n3 lawyer #个,位 @work
记者 jì zhě n3 reporter #个,位 @work
演员 yǎn yuán n3 actor #个,位 @work,art
歌手 gē shǒu n4 singer #个,位 @music
音乐家 yīn yuè jiā n4 musician #个,位 @music =w.musician
画家 huà jiā n4 painter #个,位 @art
作家 zuò jiā n3 writer #个,位 @story
裁缝 cái feng n4 tailor, seamstress #个,位 @work =w.seamstress
邮递员 yóu dì yuán n4 mail carrier #个,位 @work =w.postman
园丁 yuán dīng n4 gardener #个,位 @work,nature =w.gardener
工程师 gōng chéng shī n4 engineer #个,位 @work
科学家 kē xué jiā n4 scientist #个,位 @work
校长 xiào zhǎng n3 principal #个,位 @school
经理 jīng lǐ n3 manager #个,位 @work
运动员 yùn dòng yuán n4 athlete #个,位 @sport
师父 shī fu n4 master (of a martial art or craft) #个,位 @people,sport
师傅 shī fu n3 master (of a trade); driver #个,位 @people,work
英雄 yīng xióng n4 hero #个,位 @story
国王 guó wáng n3 king #个,位 @story
王 wáng n3 king; Wang (a surname) #个,位 @story =w.king
公主 gōng zhǔ n4 princess #个,位 @story
王子 wáng zǐ n4 prince #个,位 @story
皇后 huáng hòu n4 queen #个,位 @story
后#chess hòu n4 queen (chess) @hobby =w.queen
// ---- the body and health
身体 shēn tǐ n2 body; health #个 @body,health
头 tóu n2 head #个 @body =n.head
头发 tóu fa n2 hair #根 @body %ncl
脸 liǎn n3 face #张 @body
眼睛 yǎn jing n2 eye #只,双 @body
耳朵 ěr duo n3 ear #只 @body
鼻子 bí zi n3 nose #个 @body
嘴 zuǐ n3 mouth #张 @body
嘴巴 zuǐ ba n4 mouth #张 @body
牙 yá n3 tooth #颗 @body
牙齿 yá chǐ n4 tooth #颗 @body
手 shǒu n2 hand #只,双 @body
手指 shǒu zhǐ n4 finger #根,个 @body
胳膊 gē bo n4 arm #只,条 @body
腿 tuǐ n3 leg #条 @body
脚 jiǎo n3 foot #只,双 @body
肚子 dù zi n3 belly, tummy #个 @body
心 xīn n3 heart #颗 @body,feeling =w.heart
脖子 bó zi n4 neck #个 @body
背#n bèi n4 back (of the body) @body
皮肤 pí fū n3 skin @body
声音 shēng yīn n3 sound; voice #个 @body,music
尾巴 wěi ba n3 tail #条 @animal =n.tail
翅膀 chì bǎng n4 wing #只,对 @animal =n.wing
壳 ké n4 shell #个 @animal =n.shell
病 bìng n2 illness #场 @health
医院 yī yuàn n1 hospital #家,所 @place,health
药 yào n2 medicine #种,片,颗,粒 @health
头疼 tóu téng adj3 have a headache @health
受伤 shòu shāng v4 get hurt @health
伤 shāng n4 wound @health
// ---- home and things
房子 fáng zi n1 house #个,座 @home =w.house
房间 fáng jiān n2 room #个,间 @home
客厅 kè tīng n3 living room #个,间 @home
卧室 wò shì n4 bedroom #个,间 @home
厨房 chú fáng n3 kitchen #个,间 @home,food
洗手间 xǐ shǒu jiān n2 bathroom, restroom #个,间 @home
厕所 cè suǒ n3 toilet #个 @home
门 mén n2 door; gate #个,扇,道 @home =w.door
窗户 chuāng hu n2 window #个,扇 @home =w.window
窗 chuāng n3 window #个,扇 @home
床 chuáng n1 bed #张 @home =w.bed
桌子 zhuō zi n1 table, desk #张 @home =w.table
桌 zhuō n3 table #张 @home
椅子 yǐ zi n1 chair #把 @home =w.chair
沙发 shā fā n3 sofa #个,张 @home
灯 dēng n3 lamp, light #个,盏 @home =w.lamp
钟 zhōng n3 clock; bell #个,座,口 @home =w.clock,w.bell
时钟 shí zhōng n4 clock #个 @home
杯子 bēi zi n1 cup, glass #个,只 @home =w.cup
盘子 pán zi n3 plate #个,只 @home =w.plate
碗#n wǎn n3 bowl #个,只 @home
筷子 kuài zi n3 chopsticks #双,根 @home,food
勺子 sháo zi n4 spoon #把 @home,food
刀 dāo n4 knife #把 @home
叉子 chā zi n4 fork #把 @home
冰箱 bīng xiāng n3 fridge #个,台 @home
电视 diàn shì n1 TV #个,台 @home,tech
电脑 diàn nǎo n1 computer #台,个 @tech
手机 shǒu jī n2 cell phone #个,部 @tech
电话 diàn huà n1 telephone; phone call #个,部 @tech
地毯 dì tǎn n4 rug, carpet #块,张 @home =w.rug
烤炉 kǎo lú n4 oven #个,台 @home =w.oven
烤箱 kǎo xiāng n4 oven #个,台 @home
空调 kōng tiáo n3 air conditioner #个,台 @home
洗衣机 xǐ yī jī n3 washing machine #台 @home
钥匙 yào shi n3 key #把 @home
毯子 tǎn zi n4 blanket #条 @home =w.blanket
被子 bèi zi n4 quilt #条 @home
镜子 jìng zi n3 mirror #面,个 @home
楼 lóu n2 building; floor #座,层 @town %ncl
楼梯 lóu tī n4 stairs #个 @home
电梯 diàn tī n3 elevator #部,个 @home
花园 huā yuán n3 garden #个,座 @nature,home =w.garden
院子 yuàn zi n4 courtyard, yard #个 @home
墙 qiáng n3 wall #面 @home
屋子 wū zi n4 room; house #间,个 @home
东西 dōng xi n1 thing, stuff #个,件 %ncl
礼物 lǐ wù n3 gift, present #个,份,件 @shop
照片 zhào piàn n3 photo #张 @hobby =w.photo
书 shū n1 book #本 @school =w.book
本子 běn zi n3 notebook #个,本 @school
笔 bǐ n2 pen #支,个 @school
铅笔 qiān bǐ n3 pencil #支,根 @school
纸 zhǐ n2 paper #张 @school =w.paper
信 xìn n3 letter #封 @story =w.letter
信封 xìn fēng n3 envelope #个
邮票 yóu piào n4 stamp #张,枚
报纸 bào zhǐ n2 newspaper #份,张 =w.newspaper
杂志 zá zhì n3 magazine #本
包#n bāo n3 bag #个 @clothes
书包 shū bāo n3 schoolbag #个 @school
伞 sǎn n3 umbrella #把 @weather
箱子 xiāng zi n3 box, suitcase #个,只
行李 xíng li n4 luggage #件 @travel
行李箱 xíng li xiāng n2 suitcase #个 @travel
垃圾 lā jī n3 trash @home %ncl
蜡烛 là zhú n4 candle #支,根 =w.candle
马灯 mǎ dēng n4 lantern (oil lamp) #盏,个 =w.lantern
绳子 shéng zi n4 rope #根,条 =w.rope
船桨 chuán jiǎng n4 oar #把,只 =w.oar
锤子 chuí zi n4 hammer #把 =w.hammer
剪刀 jiǎn dāo n4 scissors #把 =w.scissors
唱片 chàng piàn n4 record (vinyl) #张 @music =w.record
怀表 huái biǎo n4 pocket watch #块,只 =k.pocketWatch
手表 shǒu biǎo n2 wristwatch #块,只
表 biǎo n3 watch; form #块,张
眼镜 yǎn jìng n3 glasses #副 @clothes
玩具 wán jù n4 toy #个,件 @hobby
// ---- clothes
衣服 yī fu n1 clothes #件,套 @clothes
衬衫 chèn shān n3 shirt #件 @clothes
裤子 kù zi n3 trousers #条 @clothes
裙子 qún zi n3 skirt, dress #条 @clothes
鞋 xié n3 shoe #双,只 @clothes
鞋子 xié zi n3 shoes #双,只 @clothes
袜子 wà zi n3 socks #双,只 @clothes
帽子 mào zi n3 hat, cap #顶,个 @clothes =w.hat
外套 wài tào n4 coat, jacket #件 @clothes
大衣 dà yī n4 overcoat #件 @clothes
毛衣 máo yī n4 sweater #件 @clothes
围巾 wéi jīn n4 scarf #条 @clothes
手套 shǒu tào n4 gloves #副,双,只 @clothes
围裙 wéi qún n4 apron #条,件 @clothes
头巾 tóu jīn n4 headband, headscarf #条,块 @clothes
口袋 kǒu dai n4 pocket #个 @clothes
戒指 jiè zhi n4 ring #枚,个 @clothes
项链 xiàng liàn n4 necklace #条 @clothes
`);
  W.push(`
// ---- food
饭 fàn n1 rice; a meal #碗,顿 @food
米饭 mǐ fàn n1 (cooked) rice #碗 @food
米 mǐ n2 rice (grain) @food %ncl
菜 cài n1 dish; vegetables #个,道,盘 @food
面包 miàn bāo n1 bread #个,块,片 @food =w.bread
面条 miàn tiáo n2 noodles #碗,根 @food
面 miàn n2 noodles; flour #碗 @food =w.noodles
拉面 lā miàn n4 hand-pulled noodles #碗 @food
饺子 jiǎo zi n2 dumplings, jiaozi #个,盘 @food =w.jiaozi
包子 bāo zi n3 steamed bun #个 @food =w.baozi
馄饨 hún tun n4 wontons #碗,个 @food =w.wonton
春卷 chūn juǎn n4 spring roll #个,根 @food =w.springroll
粥 zhōu n4 rice porridge #碗 @food
汤 tāng n3 soup #碗 @food =w.soup
肉 ròu n2 meat #块,片 @food
鸡肉 jī ròu n3 chicken (meat) #块 @food
牛肉 niú ròu n2 beef #块 @food
猪肉 zhū ròu n3 pork #块 @food
羊肉 yáng ròu n2 lamb #块 @food
鸡蛋 jī dàn n1 egg #个 @food
蛋 dàn n3 egg #个,颗 @food
蛋糕 dàn gāo n2 cake #块,个 @food =w.cake
饼干 bǐng gān n3 cookie, cracker #块,片 @food =w.cookie
糖 táng n3 sugar; candy #颗,块 @food =w.candy
糖果 táng guǒ n4 candy #颗 @food
巧克力 qiǎo kè lì n3 chocolate #块 @food =w.chocolate
冰淇淋 bīng qí lín n4 ice cream #个,盒 @food =w.icecream
口香糖 kǒu xiāng táng n4 chewing gum #片,块 @food =w.gum
奶酪 nǎi lào n4 cheese #块 @food =w.cheese
蜂蜜 fēng mì n4 honey #罐,瓶 @food =w.honey
水果 shuǐ guǒ n1 fruit #个,种 @food
苹果 píng guǒ n1 apple #个 @food =w.apple
香蕉 xiāng jiāo n3 banana #根,个 @food
橙子 chéng zi n3 orange #个 @food =w.orange
橘子 jú zi n4 tangerine #个 @food
梨 lí n3 pear #个 @food =w.pear
西瓜 xī guā n2 watermelon #个,块,片 @food
葡萄 pú tao n2 grape #颗,个 @food
草莓 cǎo méi n4 strawberry #颗,个 @food
桃子 táo zi n4 peach #个 @food
芒果 máng guǒ n4 mango #个 @food
蔬菜 shū cài n4 vegetables @food %ncl
土豆 tǔ dòu n4 potato #个 @food
西红柿 xī hóng shì n3 tomato #个 @food
白菜 bái cài n4 Chinese cabbage #棵,个 @food
玉米 yù mǐ n4 corn #根,个 @food,nature =w.corn
玉米粒 yù mǐ lì n4 corn kernel #颗,粒,个 @food =n.kernel
爆米花 bào mǐ huā n4 popcorn #颗,粒,个,包 @food =n.popcorn
瓜子 guā zǐ n4 sunflower seeds #颗,粒,把 @food
豆腐 dòu fu n4 tofu #块 @food
饼 bǐng n4 flatbread, pancake #张,个 @food
月饼 yuè bǐng n4 mooncake #个,块 @food
汉堡 hàn bǎo n4 hamburger #个 @food
比萨 bǐ sà n4 pizza #个,块 @food
三明治 sān míng zhì n4 sandwich #个 @food
早饭 zǎo fàn n2 breakfast #顿 @food
早餐 zǎo cān n3 breakfast #顿 @food
午饭 wǔ fàn n2 lunch #顿 @food
午餐 wǔ cān n3 lunch #顿 @food
晚饭 wǎn fàn n2 dinner #顿 @food
晚餐 wǎn cān n3 dinner #顿 @food
零食 líng shí n4 snack #种,包 @food
甜点 tián diǎn n4 dessert, sweets #个,份 @food
盐 yán n3 salt @food %ncl
醋 cù n4 vinegar @food %ncl
酱油 jiàng yóu n4 soy sauce @food %ncl
油 yóu n4 oil @food %ncl
辣椒 là jiāo n4 chili pepper #个 @food
姜 jiāng n4 ginger #块 @food
菜单 cài dān n3 menu #份,张 @food
// ---- drinks
水 shuǐ n1 water #杯,瓶 @drink =w.water
茶 chá n1 tea #杯 @drink =w.tea
绿茶 lǜ chá n3 green tea #杯 @drink
花茶 huā chá n4 flower tea #杯 @drink
咖啡 kā fēi n1 coffee #杯 @drink
牛奶 niú nǎi n1 milk #杯,瓶 @drink
果汁 guǒ zhī n3 juice #杯,瓶 @drink =w.juice
汽水 qì shuǐ n4 soda #瓶,罐,杯 @drink =w.soda
可乐 kě lè n3 cola #瓶,罐,杯 @drink
饮料 yǐn liào n3 drink #杯,瓶 @drink
热水 rè shuǐ n3 hot water #杯 @drink
豆浆 dòu jiāng n4 soy milk #杯 @drink
酸奶 suān nǎi n4 yogurt #杯,瓶 @drink
// ---- animals
动物 dòng wù n3 animal #只,种 @animal
猫 māo n1 cat #只 @animal =w.cat
狗 gǒu n1 dog #只,条 @animal
鸟 niǎo n3 bird #只 @animal =w.bird
小鸟 xiǎo niǎo n3 little bird #只 @animal
鱼 yú n2 fish #条 @animal,food
马 mǎ n3 horse; knight (chess) #匹 @animal =w.knight
牛 niú n3 cow, ox #头 @animal
猪 zhū n3 pig #头,只 @animal
羊 yáng n3 sheep, goat #只 @animal
鸡 jī n3 chicken #只 @animal
鸭子 yā zi n4 duck #只 @animal
兔子 tù zi n3 rabbit #只 @animal
老鼠 lǎo shǔ n4 mouse, rat #只 @animal
熊猫 xióng māo n3 panda #只 @animal
老虎 lǎo hǔ n3 tiger #只 @animal
狮子 shī zi n4 lion #只,头 @animal
熊 xióng n4 bear #只,头 @animal
猴子 hóu zi n4 monkey #只 @animal
大象 dà xiàng n4 elephant #头,只 @animal
象 xiàng n4 elephant; bishop (chess) #头,只 @animal =w.bishop
龙 lóng n3 dragon #条 @animal,fantasy
蛇 shé n4 snake #条 @animal
狐狸 hú li n4 fox #只 @animal =w.fox
狼 láng n4 wolf #只,头 @animal
鹿 lù n4 deer #只,头 @animal
蝴蝶 hú dié n4 butterfly #只 @animal
蜜蜂 mì fēng n4 bee #只 @animal =w.bee,n.bee
蚂蚁 mǎ yǐ n4 ant #只 @animal
蛾子 é zi n4 moth #只 @animal =n.moth
飞蛾 fēi é n4 moth #只 @animal
甲虫 jiǎ chóng n4 beetle #只 @animal =n.beetle
甲壳虫 jiǎ ké chóng n4 beetle #只 @animal
青蛙 qīng wā n4 frog #只 @animal =n.frog
犰狳 qiú yú n4 armadillo #只 @animal =n.armadillo
蝙蝠 biān fú n4 bat #只 @animal =n.bat
乌鸦 wū yā n4 crow #只 @animal =w.crow
金丝雀 jīn sī què n4 canary #只 @animal =w.canary
螃蟹 páng xiè n4 crab #只 @animal
海豚 hǎi tún n4 dolphin #只,条 @animal
鲸鱼 jīng yú n4 whale #条,头 @animal
虫子 chóng zi n4 bug, insect #只,条 @animal
宠物 chǒng wù n4 pet #只,个 @animal
鼠 shǔ n4 rat (zodiac) @animal
虎 hǔ n4 tiger (zodiac) @animal
兔 tù n4 rabbit (zodiac) @animal
猴 hóu n4 monkey (zodiac) @animal
// ---- nature and weather
天气 tiān qì n1 weather @weather %ncl
太阳 tài yáng n2 sun #个 @nature,weather
月亮 yuè liang n3 moon #个 @nature
星星 xīng xing n3 star #颗 @nature =w.star
天空 tiān kōng n4 sky @nature
云 yún n4 cloud #朵,片 @weather
雨 yǔ n2 rain #场 @weather
雪 xuě n2 snow #场 @weather =w.snow
风 fēng n3 wind #阵,场 @weather
冰 bīng n3 ice #块 @weather =w.ice
雾 wù n4 fog #场 @weather
彩虹 cǎi hóng n4 rainbow #道,条 @weather
晴 qíng adj2 sunny, clear @weather
阴 yīn adj2 cloudy, overcast @weather
晴天 qíng tiān n3 a sunny day @weather
下雨 xià yǔ v1 rain @weather
下雪 xià xuě v2 snow @weather
刮风 guā fēng v3 be windy @weather
打雷 dǎ léi v4 thunder @weather
山 shān n1 mountain, hill #座 @nature =w.mountain
山坡 shān pō n4 hillside, hill #个,片 @nature =c.hill
河 hé n2 river #条 @nature
湖 hú n3 lake #个,片 @nature
海 hǎi n2 sea #片 @nature
海边 hǎi biān n3 seaside #个 @nature
岛 dǎo n4 island #个,座 @nature =w.island
树 shù n1 tree #棵 @nature =w.tree
树林 shù lín n4 woods #片 @nature
森林 sēn lín n3 forest #片 @nature =c.forest
花 huā n1 flower #朵,束,支 @nature =w.flower
草 cǎo n3 grass #棵,根 @nature %ncl
叶子 yè zi n3 leaf #片 @nature
石头 shí tou n2 stone, rock #块 @nature =w.stone,n.stone
石子 shí zǐ n4 pebble #块,颗 @nature
小石子 xiǎo shí zǐ n4 pebble #块,颗 @nature =o.light
大石头 dà shí tou n4 big rock #块 @nature =o.heavy
蘑菇 mó gu n4 mushroom #个,朵 @nature,food =w.mushroom
玫瑰 méi gui n4 rose #朵,束 @nature =w.rose
向日葵 xiàng rì kuí n4 sunflower #朵,棵 @nature =w.sunflower
郁金香 yù jīn xiāng n4 tulip #朵 @nature =w.tulip
薰衣草 xūn yī cǎo n4 lavender #棵,束 @nature =w.lavender
蜂箱 fēng xiāng n4 beehive #个 @nature =w.hive
温室 wēn shì n4 greenhouse #个,座 @nature =w.greenhouse
水晶 shuǐ jīng n4 crystal #块,颗 @nature =w.crystal
田野 tián yě n4 fields, open country #片 @nature =c.field
田 tián n4 field #块,片 @nature
农场 nóng chǎng n4 farm #个,座 @nature
草地 cǎo dì n4 lawn, meadow #片,块 @nature
沙子 shā zi n4 sand @nature %ncl
土 tǔ n4 earth, soil @nature %ncl
火 huǒ n3 fire @nature %ncl
空气 kōng qì n3 air @nature %ncl
地球 dì qiú n3 the Earth @nature
世界 shì jiè n3 the world @place
自然 zì rán n3 nature @nature
环境 huán jìng n3 environment @nature
风景 fēng jǐng n4 scenery, view @nature
`);
  W.push(`
// ---- places and town
城市 chéng shì n2 city #个,座 @town,place
农村 nóng cūn n4 countryside #个 @place
村子 cūn zi n4 village #个,座 @place =c.village
村 cūn n4 village #个 @place
小镇 xiǎo zhèn n4 small town #个,座 @town
镇 zhèn n4 town #个 @town
街 jiē n3 street #条 @town
街道 jiē dào n2 street #条 @town
路 lù n2 road, way #条 @town
马路 mǎ lù n3 road, street #条 @town
路上 lù shang n3 on the way
一路 yī lù adv4 all the way
桥 qiáo n3 bridge #座 @town =w.bridge
广场 guǎng chǎng n4 square, plaza #个,座 @town
商店 shāng diàn n1 shop, store #家,个 @shop,town
超市 chāo shì n3 supermarket #家,个 @shop
市场 shì chǎng n3 market #个 @shop
饭馆 fàn guǎn n2 restaurant #家,个 @food,town
饭店 fàn diàn n1 restaurant; hotel #家,个 @food,town
餐馆 cān guǎn n4 restaurant #家,个 @food,town
餐厅 cān tīng n3 restaurant, dining hall #家,个 @food
中餐馆 zhōng cān guǎn n4 Chinese restaurant #家,个 @food
咖啡馆 kā fēi guǎn n4 café #家,个 @drink,town
面包店 miàn bāo diàn n4 bakery #家,个 @food,shop
银行 yín háng n2 bank #家,个 @money,town
邮局 yóu jú n3 post office #个,家 @town
图书馆 tú shū guǎn n2 library #个,座 @school,town
博物馆 bó wù guǎn n4 museum #个,座 @town,art
电影院 diàn yǐng yuàn n2 cinema #家,个 @hobby,town
剧院 jù yuàn n4 theater #个,座 @art,town
宾馆 bīn guǎn n2 hotel #家,个 @travel
机场 jī chǎng n2 airport #个 @travel,transport
火车站 huǒ chē zhàn n2 train station #个 @transport
车站 chē zhàn n3 station, stop #个 @transport
站#n zhàn n3 station, stop #个 @transport
地铁站 dì tiě zhàn n4 subway station #个 @transport
加油站 jiā yóu zhàn n3 gas station #个,座 @transport
公司 gōng sī n2 company #家,个 @work
办公室 bàn gōng shì n3 office #个,间 @work
工厂 gōng chǎng n4 factory #家,个,座 @work
学校 xué xiào n1 school #所,个 @school
大学 dà xué n2 university #所,个 @school
中学 zhōng xué n3 middle school, high school #所,个 @school
小学 xiǎo xué n3 primary school #所,个 @school
教室 jiào shì n2 classroom #个,间 @school
操场 cāo chǎng n4 sports ground #个 @school,sport
体育馆 tǐ yù guǎn n4 gym, stadium #个,座 @sport
公园 gōng yuán n2 park #个,座 @place
动物园 dòng wù yuán n3 zoo #个,座 @place,animal
游泳池 yóu yǒng chí n4 swimming pool #个 @sport
教堂 jiào táng n4 church #座,个 @town
寺庙 sì miào n4 temple #座,个 @town
塔 tǎ n3 tower; pagoda #座 @town =w.tower
古塔 gǔ tǎ n4 old tower #座 @hush
钟楼 zhōng lóu n4 bell tower #座 @town,hush
墓地 mù dì n4 cemetery #个,片 @place =w.cemetery
坟墓 fén mù n4 grave, tomb #座,个 @place =w.grave
迷宫 mí gōng n4 maze #个,座 @place =w.maze
洞 dòng n4 hole; cave #个 @nature
山洞 shān dòng n4 cave #个 @nature
洞穴 dòng xué n4 cave #个 @nature
矿 kuàng n4 mine #个,座 @place
营地 yíng dì n4 camp #个 @place
港口 gǎng kǒu n4 port, harbor #个,座 @place
灯塔 dēng tǎ n4 lighthouse #座 @place
小卖部 xiǎo mài bù n4 corner shop #个,家 @shop
杂货店 zá huò diàn n4 general store #家,个 @shop
报亭 bào tíng n4 newsstand #个 @shop
国家 guó jiā n3 country #个 @place
国 guó n2 country, nation #个 @place
外国 wài guó n3 a foreign country @place
中国 Zhōng guó name1 China @place
美国 Měi guó name1 the USA @place
英国 Yīng guó name2 the UK @place
法国 Fǎ guó name2 France @place
德国 Dé guó name2 Germany @place
日本 Rì běn name2 Japan @place
韩国 Hán guó name2 South Korea @place
西班牙 Xī bān yá name2 Spain @place
葡萄牙 Pú táo yá name3 Portugal @place
巴西 Bā xī name3 Brazil @place
墨西哥 Mò xī gē name3 Mexico @place
加拿大 Jiā ná dà name3 Canada @place
意大利 Yì dà lì name3 Italy @place
俄罗斯 É luó sī name3 Russia @place
印度 Yìn dù name3 India @place
澳大利亚 Ào dà lì yà name3 Australia @place
北京 Běi jīng name1 Beijing @place
上海 Shàng hǎi name2 Shanghai @place
成都 Chéng dū name3 Chengdu @place
哈尔滨 Hā ěr bīn name4 Harbin @place
香港 Xiāng gǎng name3 Hong Kong @place
台湾 Tái wān name3 Taiwan @place
广州 Guǎng zhōu name3 Guangzhou @place
西安 Xī ān name3 Xi'an @place
长城 Cháng chéng name2 the Great Wall @place
欧洲 Ōu zhōu name3 Europe @place
亚洲 Yà zhōu name3 Asia @place
中国人 Zhōng guó rén n1 Chinese person #个,位 @people
美国人 Měi guó rén n2 American (person) #个,位 @people
外国人 wài guó rén n3 foreigner #个,位 @people
// ---- languages
中文 zhōng wén n1 Chinese (language) @language
汉语 hàn yǔ n1 Chinese (language) @language
英语 yīng yǔ n2 English @language
英文 yīng wén n2 English @language
日语 rì yǔ n3 Japanese @language
西班牙语 xī bān yá yǔ n3 Spanish @language
法语 fǎ yǔ n3 French @language
德语 dé yǔ n3 German @language
葡萄牙语 pú táo yá yǔ n4 Portuguese @language
韩语 hán yǔ n3 Korean @language
语言 yǔ yán n3 language #种,门 @language
汉字 hàn zì n2 Chinese character #个 @language
字 zì n1 character, written word #个 @language
词 cí n3 word #个 @language
词典 cí diǎn n3 dictionary #本 @language
句子 jù zi n3 sentence #个,句 @language
意思 yì si n2 meaning #个 @language
拼音 pīn yīn n4 pinyin @language
声调 shēng diào n4 tone (of a syllable) @language
书法 shū fǎ n4 calligraphy @art,language
名字 míng zi n1 name #个 =w.name
// ---- getting around
车 chē n1 car; vehicle #辆 @transport
汽车 qì chē n2 car #辆 @transport
出租车 chū zū chē n1 taxi #辆 @transport
公共汽车 gōng gòng qì chē n2 bus #辆 @transport
公交车 gōng jiāo chē n3 bus #辆 @transport
列 liè cl4 (trains)
火车 huǒ chē n1 train #列,辆 @transport =w.train
飞机 fēi jī n1 airplane #架 @transport
地铁 dì tiě n3 subway #辆,列 @transport
自行车 zì xíng chē n3 bicycle #辆 @transport
船 chuán n2 boat, ship #艘,条,只 @transport
摩托车 mó tuō chē n4 motorbike #辆 @transport
票 piào n2 ticket #张 @travel
车票 chē piào n3 (bus, train) ticket #张 @travel
机票 jī piào n3 plane ticket #张 @travel
护照 hù zhào n3 passport #本 @travel
地图 dì tú n3 map #张 @travel
// ---- school
课 kè n2 class, lesson #节,门 @school
课文 kè wén n3 text (of a lesson) #篇 @school
作业 zuò yè n3 homework @school %ncl
问题 wèn tí n2 question, problem #个 @school
题 tí n3 question (on a test) #道 @school
答案 dá àn n3 answer #个 @school
成绩 chéng jì n3 grade, result #个 @school
数学 shù xué n3 math @school
历史 lì shǐ n3 history @school
科学 kē xué n3 science @school
音乐 yīn yuè n2 music @music
美术 měi shù n4 art (class) @art
体育 tǐ yù n3 sports, PE @sport
年级 nián jí n3 grade, year (in school) @school %ncl
知识 zhī shi n3 knowledge @school
专业 zhuān yè n3 major (at university) #个 @school
黑板 hēi bǎn n3 blackboard #块 @school
橡皮 xiàng pí n4 eraser #块 @school
尺子 chǐ zi n4 ruler #把 @school
寒假 hán jià n3 winter vacation #个 @school,time
暑假 shǔ jià n3 summer vacation #个 @school,time
学期 xué qī n3 semester #个 @school
水平 shuǐ píng n3 level @school
// ---- work and money
工作#n gōng zuò n1 job, work #份,个 @work
钱 qián n1 money @money %ncl
人民币 rén mín bì n4 RMB, yuan @money %ncl
价格 jià gé n3 price #个 @money,shop
价钱 jià qian n4 price @money,shop
金币 jīn bì n4 gold coin #枚,个 @money =w.coin
硬币 yìng bì n4 coin #枚,个 @money
红包 hóng bāo n4 red envelope (gift money) #个 @money
信用卡 xìn yòng kǎ n2 credit card #张 @money
卡 kǎ n3 card #张 @money
生意 shēng yi n3 business @work
工资 gōng zī n3 wages, pay @work %ncl
会议 huì yì n3 meeting #个,场 @work
机会 jī huì n3 chance #个 @work
经验 jīng yàn n3 experience @work
打折 dǎ zhé v3 give a discount @shop
免费 miǎn fèi adj3 free (of charge) @money %ng
购物 gòu wù v3 go shopping @shop
// ---- phones, screens, stories, music, games, sport
电子邮件 diàn zǐ yóu jiàn n3 email #封 @tech
网 wǎng n3 the internet; a net @tech
网站 wǎng zhàn n3 website #个 @tech
游戏 yóu xì n2 game #个 @hobby,tech
照相机 zhào xiàng jī n3 camera #台,个 @tech
短信 duǎn xìn n3 text message #条 @tech
密码 mì mǎ n3 password, code #个 @tech
暗号 àn hào n4 password, secret signal #个 =w.password
口令 kǒu lìng n4 password (spoken) #个
视频 shì pín n4 video #个,段 @tech
电影 diàn yǐng n1 movie, film #部,场 @hobby,art
节目 jié mù n3 program, show #个 @hobby
新闻 xīn wén n3 news #条 @hobby
故事 gù shi n3 story #个 @story
小说 xiǎo shuō n3 novel #本,部 @story
诗 shī n4 poem #首 @story,art =w.poem
画#n huà n3 painting, picture #幅,张 @art
歌 gē n2 song #首,支 @music
歌曲 gē qǔ n4 song #首 @music
吉他 jí tā n4 guitar #把 @music
钢琴 gāng qín n3 piano #架,台 @music
鼓 gǔ n4 drum #面,个 @music
锣 luó n4 gong #面,个 @music =w.gong
笛子 dí zi n4 flute #支,根 @music
乐器 yuè qì n4 musical instrument #件,种 @music
爱好 ài hào n3 hobby #个 @hobby
兴趣 xìng qù n3 interest #个 @hobby
运动 yùn dòng n2 sport, exercise #个,种 @sport
足球 zú qiú n2 soccer, football #个,场 @sport
篮球 lán qiú n2 basketball #个,场 @sport
网球 wǎng qiú n3 tennis @sport
乒乓球 pīng pāng qiú n3 ping-pong @sport
羽毛球 yǔ máo qiú n3 badminton @sport
排球 pái qiú n4 volleyball @sport
球 qiú n3 ball #个 @sport
比赛 bǐ sài n3 match, competition #场,个 @sport
武术 wǔ shù n4 martial arts @sport
功夫 gōng fu n3 kung fu; skill, effort @sport
太极拳 tài jí quán n4 tai chi @sport
拳 quán n4 fist; a boxing style @sport
武馆 wǔ guǎn n4 martial-arts school #个,家 @sport
棋 qí n4 board game; a move in it #盘 @hobby
象棋 xiàng qí n4 Chinese chess #盘,副 @hobby
国际象棋 guó jì xiàng qí n4 (international) chess #盘,副 @hobby =w.chess
跳棋 tiào qí n4 checkers #盘,副 @hobby =w.checkers
围棋 wéi qí n4 go (the board game) #盘 @hobby
扑克 pū kè n4 playing cards #副,张 @hobby
牌 pái n4 card; sign #张 @hobby
风筝 fēng zheng n4 kite #个,只 @hobby =w.kite
车#chess jū n4 rook (chess) @hobby =w.rook
兵 bīng n4 soldier; pawn (chess) #个 @hobby =w.pawn
卒 zú n4 pawn (Chinese chess) @hobby
将军 jiāng jūn n4 general; check! @hobby
`);
  W.push(`
// ---- the Hush, the bells, the story
寂静 jì jìng n4 silence @hush =c.silence
寂静#name Jì jìng name2 the Hush @hush
沉默 chén mò adj4 silent; silence @hush
回声 huí shēng n4 echo #个 @hush
铃 líng n4 small bell #个 @hush
默默 mò mò adv4 silently
小默默 xiǎo mò mò n4 Hushling #只,个 @hush =n.hushling
大默默 dà mò mò n4 big Hushling #只,个 @hush =n.hushbig
稻草人 dào cǎo rén n4 scarecrow; straw dummy #个 @hush =w.scarecrow,n.dummy
假人 jiǎ rén n4 dummy #个
上校 shàng xiào n4 colonel #位,个 @story =n.colonel
玉米棒 yù mǐ bàng n4 corncob #根,个 @food
雪球 xuě qiú n4 snowball #个 @weather =n.snowball
雪人 xuě rén n4 snowman #个 @weather
魔法 mó fǎ n4 magic @fantasy
魔术 mó shù n4 magic trick @fantasy
怪物 guài wu n4 monster #个,只 @fantasy
鬼 guǐ n4 ghost; "it" (in tag) #个,只 @fantasy
精灵 jīng líng n4 fairy, spirit #个,只 @fantasy
宝石 bǎo shí n4 gem #颗,块 @fantasy
宝藏 bǎo zàng n4 treasure @fantasy
冒险 mào xiǎn v4 go on an adventure; take a risk @story
旅程 lǚ chéng n4 journey #段 @travel
任务 rèn wu n4 task, mission #个 @story
秘密 mì mì n4 secret #个 @story
线索 xiàn suǒ n4 clue #条,个 @story
日记 rì jì n3 diary #本,篇 @story
页 yè n3 page @story %ncl
勇士 yǒng shì n4 warrior #个,位 @story
战斗 zhàn dòu v4 fight, battle @story
打败 dǎ bài v4 defeat @story
醒来 xǐng lái v4 wake up
唤醒 huàn xǐng v4 wake (someone) up @hush
恢复 huī fù v4 recover, restore
消失 xiāo shī v4 disappear @hush
出现 chū xiàn v3 appear @hush
力量 lì liang n4 strength, power @story
光 guāng n3 light #道,束 @nature
影子 yǐng zi n4 shadow #个 @nature
黑暗 hēi àn adj4 dark; darkness @hush
王国 wáng guó n4 kingdom #个 @story
城堡 chéng bǎo n4 castle #座 @story
风车 fēng chē n4 windmill #个,座 @place
磨坊 mò fáng n4 mill #座,个 @place
采石场 cǎi shí chǎng n4 quarry #个,座 @place
矿工 kuàng gōng n4 miner #个,位 @work
锣厅 luó tīng n4 the Gong Hall @hush
花展 huā zhǎn n4 flower show #个,场 @hush
蜂后 fēng hòu n4 queen bee #只 @animal
霜 shuāng n4 frost @weather
钟表匠 zhōng biǎo jiàng n4 clockmaker #个,位 @work
// ---- names (CJK.md)
米莫 Mǐ mò name1 Mimo @hush
罗莎 Luó shā name1 Rosa @hush
布鲁诺 Bù lǔ nuò name1 Bruno @hush
诺娅 Nuò yà name1 Noa @hush
玛尔塔 Mǎ ěr tǎ name1 Marta @hush
尼科 Ní kē name1 Nico @hush
维森特 Wéi sēn tè name2 Vicente @hush
雨果 Yǔ guǒ name2 Hugo @hush
西罗 Xī luó name2 Ciro @hush
玛尔加 Mǎ ěr jiā name2 Marga @hush
玛丽娜 Mǎ lì nà name2 Marina @hush
巴托洛 Bā tuō luò name2 Bartolo @hush
拉洛 Lā luò name2 Lalo @hush
莫甘娜 Mò gān nà name2 Morgana @hush
但丁 Dàn dīng name2 Dante @hush
坡坡 Pō po name2 Poe @hush
奥罗拉 Ào luó lā name2 Aurora @hush
坎德 Kǎn dé name2 Cande @hush
芙洛拉 Fú luò lā name3 Flora @hush
梅丽莎 Méi lì shā name3 Melisa @hush
莉娅 Lì yà name3 Lía @hush
托比亚斯 Tuō bǐ yà sī name3 Tobías @hush
龙龙 Lóng long name2 Longlong @hush
阿尔巴 Ā ěr bā name1 Alba @hush
磨坊镇 Mò fáng zhèn name2 Molinar @hush
静水村 Jìng shuǐ cūn name2 Remanso @hush
镜湖 Jìng hú name3 the Mirror Lake @hush
大磨坊 Dà mò fáng name4 the Great Mill @hush
花园谷 Huā yuán gǔ name4 the Bloom Gardens @hush
霜峰 Shuāng fēng name4 the Frost Peaks @hush
霜村 Shuāng cūn name4 Escarcha (the frost village) @hush
冰钟楼 Bīng zhōng lóu name4 the Ice Clock Tower @hush
微风港 Wēi fēng gǎng name4 Port Brisa @hush
梅园 Méi yuán name3 the Plum Garden (Grandma Mei's) @food
梅 Méi name2 Mei (a surname) @people
林 Lín name2 Lin (a surname) @people
陈 Chén name2 Chen (a surname) @people
胡 Hú name3 Hu (a surname) @people
李 Lǐ name2 Li (a surname) @people
刘 Liú name3 Liu (a surname) @people
何 Hé name3 He (a surname) @people
赵 Zhào name3 Zhao (a surname) @people
孙 Sūn name3 Sun (a surname) @people
大爷 dà ye n4 grandpa, old sir (respectful) #位,个 @people
// ---- Grandpa Chen's cards, New Year, the festivals
斗地主 dòu dì zhǔ n4 Fight the Landlord (a card game) @hobby
地主 dì zhǔ n4 landlord @hobby
炸弹 zhà dàn n4 bomb #个,颗 @hobby
炸弹王 zhà dàn wáng n4 the Bomb King @hobby
王炸 wáng zhà n4 the rocket (both jokers) @hobby
顺子 shùn zi n4 straight (in cards) #个 @hobby
对子 duì zi n4 pair (in cards) #个 @hobby
小王 xiǎo wáng n4 small joker @hobby
大王 dà wáng n4 big joker; great king @hobby
出牌 chū pái v4 play a card @hobby
洗牌 xǐ pái v4 shuffle (cards) @hobby
发牌 fā pái v4 deal (cards) @hobby
春节 chūn jié n2 Spring Festival (Chinese New Year) @time
除夕 chú xī n4 New Year's Eve @time
元宵节 yuán xiāo jié n4 Lantern Festival @time
端午节 duān wǔ jié n4 Dragon Boat Festival @time
中秋节 zhōng qiū jié n4 Mid-Autumn Festival @time
新年 xīn nián n2 New Year @time
年兽 nián shòu n4 the Nian (a New Year monster) @fantasy
鞭炮 biān pào n4 firecrackers @hobby
灯笼 dēng long n4 (paper) lantern #个,盏 @home
对联 duì lián n4 New Year couplets #副 @art
福 fú n4 good fortune, blessing @story
生肖 shēng xiào n4 zodiac animal #个 @animal
汤圆 tāng yuán n4 sweet rice balls #个,碗 @food
年糕 nián gāo n4 New Year cake #块 @food
舞狮 wǔ shī n4 lion dance @art
龙舟 lóng zhōu n4 dragon boat #条,艘 @transport
蒲牢 Pú láo name4 Pulao (the bell dragon) @fantasy
屈原 Qū Yuán name4 Qu Yuan (the poet) @story
恭喜 gōng xǐ v4 congratulate; congratulations
发财 fā cái v4 get rich @money
团圆 tuán yuán v4 be together again (family) @family
祝 zhù v3 wish (someone something)
祝贺 zhù hè v3 congratulate
// ---- talking about yourself
家乡 jiā xiāng n4 hometown #个 @place
老家 lǎo jiā n4 hometown, family home #个 @place
生活 shēng huó n3 life; live @home
梦想 mèng xiǎng n4 dream, wish #个 @feeling
理想 lǐ xiǎng n3 ideal, dream #个
梦 mèng n3 dream (asleep) #个,场
性格 xìng gé n3 personality #个,种 @people
习惯 xí guàn n3 habit; be used to #个,种
经历 jīng lì n3 experience (what you went through) #段,个
回忆 huí yì n3 memory #个,段
感觉 gǎn jué v3 feel; a feeling %st
心情 xīn qíng n3 mood #种 @feeling
情况 qíng kuàng n3 situation #种,个
事情 shì qing n2 matter, thing #件,个 %ncl
事 shì n2 matter, thing; job #件,个 %ncl
办法 bàn fǎ n3 way, method #个,种
方法 fāng fǎ n3 method #个,种
原因 yuán yīn n3 reason #个
结果 jié guǒ n3 result; in the end #个 %conj
目的 mù dì n3 aim, purpose #个
意见 yì jiàn n3 opinion #个,条
看法 kàn fǎ n3 view, opinion #个,种
想法 xiǎng fǎ n4 idea, way of thinking #个,种
主意 zhǔ yi n3 idea, plan #个
文化 wén huà n3 culture #种 @art
传统 chuán tǒng n4 tradition; traditional #个,种
社会 shè huì n3 society
关系 guān xi n3 relationship #个,种 @people
友谊 yǒu yì n3 friendship #段 @people
爱情 ài qíng n3 love (romantic) #段,份 @feeling
感情 gǎn qíng n3 feelings, affection #份,种 @feeling
态度 tài du n3 attitude #个,种
能力 néng lì n3 ability #个,种
压力 yā lì n3 pressure, stress #个,种 @feeling
年龄 nián líng n3 age
个子 gè zi n3 height, build #个 @body
样子 yàng zi n3 look, appearance #个,种
味道 wèi dao n4 taste, flavor #种,个 @food
礼貌 lǐ mào n3 manners; polite
笑话 xiào hua n3 joke #个
大学生 dà xué shēng n3 university student #个,位 @school,people
留学生 liú xué shēng n4 international student #个,位 @school,people
小学生 xiǎo xué shēng n4 schoolchild #个 @school,people
`);
  W.push(`
// ---- more of the A2–B1 core (HSK 2–4)
男 nán adj2 male %ng
女 nǚ adj2 female %ng
班 bān n2 class (group of students) #个 @school
笔记本 bǐ jì běn n2 notebook; laptop #个,本,台 @school,tech
变化 biàn huà n2 change #个,种
词语 cí yǔ n2 words, expressions #个 @language
多么 duō me adv2 how (…!)
感兴趣 gǎn xìng qù v2 be interested %st
黄河 Huáng hé name2 the Yellow River @place
长江 Cháng jiāng name3 the Yangtze River @place
极 jí adv2 extremely
检查 jiǎn chá v2 check, examine
解决 jiě jué v2 solve
普通话 pǔ tōng huà n2 Mandarin (standard Chinese) @language
请假 qǐng jià v2 ask for time off @work
起飞 qǐ fēi v2 take off @transport
提高 tí gāo v2 raise, improve
为 wèi prep2 for
影响 yǐng xiǎng v2 influence, affect; effect
遇到 yù dào v2 run into, come across
越 yuè adv2 the more (越…越)
字典 zì diǎn n2 dictionary #本 @language
作用 zuò yòng n2 effect, use #个
要求 yāo qiú v2 ask for, require; a demand
北方 běi fāng n2 the north @place
南方 nán fāng n2 the south @place
春 chūn n2 spring @time,weather %tn
夏 xià n2 summer @time,weather %tn
秋 qiū n2 autumn @time,weather %tn
冬 dōng n2 winter @time,weather %tn
举行 jǔ xíng v2 hold (an event)
安排 ān pái v3 arrange; plan
按时 àn shí adv3 on time
包括 bāo kuò v3 include
保证 bǎo zhèng v3 promise, guarantee
报名 bào míng v3 sign up
抱歉 bào qiàn adj3 sorry
标准 biāo zhǔn n3 standard
表格 biǎo gé n3 form, table #张,份
表示 biǎo shì v3 show, express
表演 biǎo yǎn v3 perform; a performance @art
表扬 biǎo yáng v3 praise
不得不 bù dé bù adv3 have to
不仅 bù jǐn conj3 not only %conj
部分 bù fen n3 part #个 %ncl
擦 cā v3 wipe, clean
材料 cái liào n3 material #种,份
超过 chāo guò v3 exceed
成功 chéng gōng v3 succeed; success
成熟 chéng shú adj3 mature, ripe
乘坐 chéng zuò v3 ride, take (transport) @transport
吃惊 chī jīng adj3 surprised @feeling
重新 chóng xīn adv3 again, anew
出差 chū chāi v3 go on a business trip @work
粗心 cū xīn adj3 careless -
打扮 dǎ ban v3 dress up @clothes
打扰 dǎ rǎo v3 disturb
打针 dǎ zhēn v3 get an injection @health
大约 dà yuē adv3 about, roughly
当#v dāng v3 be, work as
导游 dǎo yóu n3 tour guide #个,位 @travel,work
到底 dào dǐ adv3 after all; in the end
道歉 dào qiàn v3 apologize
得意 dé yì adj3 pleased with yourself
低 dī adj3 low
地点 dì diǎn n3 place, location #个
地址 dì zhǐ n3 address #个
调查 diào chá v3 investigate, survey
动作 dòng zuò n3 movement, action #个
堵车 dǔ chē v3 be stuck in traffic @transport
断 duàn v3 break, snap
对话 duì huà n3 dialogue #段,个 @language
儿童 ér tóng n3 children @people
发展 fā zhǎn v3 develop
法律 fǎ lǜ n3 law
翻译 fān yì v3 translate; translator @language
烦恼 fán nǎo adj3 worried; worries @feeling
方面 fāng miàn n3 side, aspect #个
方向 fāng xiàng n3 direction #个
放弃 fàng qì v3 give up
丰富 fēng fù adj3 rich, plentiful
负责 fù zé v3 be in charge of
富 fù adj3 rich @money
改变 gǎi biàn v3 change
干#v gàn v3 do
高级 gāo jí adj3 advanced, high-level
工具 gōng jù n3 tool #个,种
共同 gòng tóng adj3 common, shared
估计 gū jì v3 reckon, estimate %clause
鼓励 gǔ lì v3 encourage
故意 gù yì adv3 on purpose
顾客 gù kè n3 customer #个,位 @shop
挂 guà v3 hang
关键 guān jiàn n3 the key (point)
观众 guān zhòng n3 audience @art
管理 guǎn lǐ v3 manage
广播 guǎng bō n3 broadcast, radio
广告 guǎng gào n3 advertisement #个,条
规定 guī dìng n3 rule; stipulate #个,条
国际 guó jì adj3 international %ng
果然 guǒ rán adv3 sure enough
过程 guò chéng n3 process #个
海洋 hǎi yáng n3 ocean @nature
汗 hàn n3 sweat @body
好处 hǎo chu n3 benefit #个
号码 hào mǎ n3 number #个
盒子 hé zi n3 box #个
后悔 hòu huǐ v3 regret %st
互联网 hù lián wǎng n3 the internet @tech
活动 huó dòng n3 activity, event #个,项
活泼 huó po adj3 lively
获得 huò dé v3 get, win
积极 jī jí adj3 active, positive
积累 jī lěi v3 build up
基础 jī chǔ n3 foundation, basics
及时 jí shí adv3 in time
技术 jì shù n3 technology; skill @tech
家具 jiā jù n3 furniture #件,套 @home
坚持 jiān chí v3 keep at it, persist
减肥 jiǎn féi v3 lose weight @health
减少 jiǎn shǎo v3 reduce
降低 jiàng dī v3 lower
交 jiāo v3 hand in; make (friends)
交流 jiāo liú v3 communicate, exchange
交通 jiāo tōng n3 traffic @transport
郊区 jiāo qū n3 suburbs @place
教授 jiào shòu n3 professor #个,位 @school
教育 jiào yù n3 education @school
接受 jiē shòu v3 accept
节约 jié yuē v3 save, use less
进行 jìn xíng v3 carry out, be underway
禁止 jìn zhǐ v3 forbid
精彩 jīng cǎi adj3 wonderful, brilliant +
精神 jīng shen n3 spirit, energy
经济 jīng jì n3 economy
京剧 jīng jù n3 Beijing opera @art,music
竟然 jìng rán adv3 to everyone's surprise
竞争 jìng zhēng v3 compete
究竟 jiū jìng adv3 after all, exactly
举办 jǔ bàn v3 hold, host (an event)
拒绝 jù jué v3 refuse
距离 jù lí n3 distance
聚会 jù huì n3 party, get-together #个,次 @hobby
可惜 kě xī adj3 what a pity
肯定 kěn dìng adv3 definitely; sure
恐怕 kǒng pà adv3 I'm afraid (that)
矿泉水 kuàng quán shuǐ n3 mineral water #瓶 @drink
困难 kùn nan n3 difficulty; difficult #个
垃圾桶 lā jī tǒng n3 trash can #个 @home
来不及 lái bu jí v3 be too late to
来得及 lái de jí v3 still have time to
来自 lái zì v3 come from
浪费 làng fèi v3 waste
浪漫 làng màn adj3 romantic
冷静 lěng jìng adj3 calm
理发 lǐ fà v3 get a haircut
力气 lì qi n3 strength
俩 liǎ num3 the two of, both
连 lián prep3 even
联系 lián xì v3 contact, get in touch
零钱 líng qián n3 small change @money
留 liú v3 stay; leave (behind)
流 liú v3 flow
流利 liú lì adj3 fluent @language
流行 liú xíng adj3 popular, in fashion
乱 luàn adj3 messy
麻烦 má fan adj3 troublesome; trouble; to bother
毛巾 máo jīn n3 towel #条 @home
民族 mín zú n3 ethnic group #个
难道 nán dào adv3 could it really be that
难受 nán shòu adj3 feel bad, uncomfortable @feeling
内 nèi n3 inside, within
内容 nèi róng n3 content
弄 nòng v3 do, make, handle
排队 pái duì v3 stand in line
判断 pàn duàn v3 judge, decide
批评 pī píng v3 criticize
脾气 pí qi n3 temper @people
破 pò adj3 broken, torn
普遍 pǔ biàn adj3 common, widespread
其中 qí zhōng n3 among them
千万 qiān wàn adv3 be sure to; by all means
轻松 qīng sōng adj3 relaxed, easy
穷 qióng adj3 poor @money
区别 qū bié n3 difference #个
取 qǔ v3 take, get, fetch
缺点 quē diǎn n3 shortcoming #个
缺少 quē shǎo v3 lack
却 què adv3 but, yet
确实 què shí adv3 really, indeed
入口 rù kǒu n3 entrance #个
稍微 shāo wēi adv3 a little
申请 shēn qǐng v3 apply for
甚至 shèn zhì adv3 even
生命 shēng mìng n3 life
省 shěng v3 save (money, time); province
剩 shèng v3 be left over
失败 shī bài v3 fail; failure
实际 shí jì adj3 real, actual
实在 shí zài adv3 really, honestly
使 shǐ v3 make, cause
使用 shǐ yòng v3 use
是否 shì fǒu adv3 whether
适合 shì hé v3 suit, fit
适应 shì yìng v3 adapt, get used to
收入 shōu rù n3 income @money
首都 shǒu dū n3 capital (city)
受不了 shòu bu liǎo v3 can't stand
受到 shòu dào v3 receive, get
熟悉 shú xī adj3 familiar
数量 shù liàng n3 amount
数字 shù zì n3 number, digit #个
顺利 shùn lì adj3 smooth, without a hitch
顺序 shùn xù n3 order, sequence
说明 shuō míng v3 explain, show
速度 sù dù n3 speed
特点 tè diǎn n3 feature #个
提 tí v3 carry; mention
提供 tí gōng v3 provide
提前 tí qián adv3 ahead of time
提醒 tí xǐng v3 remind
条件 tiáo jiàn n3 condition #个
停止 tíng zhǐ v3 stop
挺 tǐng adv3 quite, rather
通知 tōng zhī v3 notify; notice
同情 tóng qíng v3 feel for, sympathize
同时 tóng shí n3 at the same time
推迟 tuī chí v3 postpone
完全 wán quán adv3 completely
卫生间 wèi shēng jiān n3 bathroom #个 @home
温度 wēn dù n3 temperature @weather
文章 wén zhāng n3 article, essay #篇
污染 wū rǎn n3 pollution @nature
无 wú v3 not have, without
误会 wù huì v3 misunderstand; misunderstanding
吸引 xī yǐn v3 attract
现代 xiàn dài n3 modern times; modern
相反 xiāng fǎn adj3 opposite
详细 xiáng xì adj3 detailed
响 xiǎng v3 ring, make a sound
消息 xiāo xi n3 news, message #个,条
小吃 xiǎo chī n3 snack #种 @food
小伙子 xiǎo huǒ zi n3 young man #个 @people
效果 xiào guǒ n3 effect, result #个
辛苦 xīn kǔ adj3 hard, tiring
信息 xìn xī n3 information #条
信心 xìn xīn n3 confidence
兴奋 xīng fèn adj3 excited @feeling
许多 xǔ duō num3 many, a lot of
严格 yán gé adj3 strict
严重 yán zhòng adj3 serious
研究 yán jiū v3 research, study
演出 yǎn chū n3 performance, show #场 @art
阳光 yáng guāng n3 sunshine @weather
以 yǐ prep3 with, by means of
艺术 yì shù n3 art @art
引起 yǐn qǐ v3 cause, give rise to
印象 yìn xiàng n3 impression #个
永远 yǒng yuǎn adv3 forever
优点 yōu diǎn n3 strong point #个
优秀 yōu xiù adj3 excellent +
幽默 yōu mò adj3 humorous, funny +
尤其 yóu qí adv3 especially
由 yóu prep3 by; from
由于 yóu yú conj3 because of, due to %conj
愉快 yú kuài adj3 happy, pleasant @feeling +
与 yǔ conj3 and, with
语法 yǔ fǎ n3 grammar @language
预习 yù xí v3 prepare a lesson @school
原来 yuán lái adv3 originally; so that's it
原谅 yuán liàng v3 forgive
阅读 yuè dú v3 read; reading @school
允许 yǔn xǔ v3 allow
暂时 zàn shí adv3 for now
责任 zé rèn n3 responsibility
增加 zēng jiā v3 increase
照 zhào v3 shine; take (a photo)
真正 zhēn zhèng adj3 real, true
整理 zhěng lǐ v3 sort out, tidy
正常 zhèng cháng adj3 normal
正式 zhèng shì adj3 formal, official
证明 zhèng míng v3 prove; proof
之 zhī part3 of (formal 的)
支持 zhī chí v3 support
值得 zhí de v3 be worth it
直接 zhí jiē adj3 direct
植物 zhí wù n3 plant #棵,种 @nature
职业 zhí yè n3 job, profession #个,种 @work
只好 zhǐ hǎo adv3 can only, have to
质量 zhì liàng n3 quality
至少 zhì shǎo adv3 at least
制造 zhì zào v3 make, manufacture
重点 zhòng diǎn n3 key point
重视 zhòng shì v3 take seriously, value
专门 zhuān mén adv3 specially
赚 zhuàn v3 earn @money
准确 zhǔn què adj3 accurate
准时 zhǔn shí adj3 on time
仔细 zǐ xì adj3 careful, thorough
自信 zì xìn adj3 confident +
总结 zǒng jié v3 sum up
租 zū v3 rent
最好 zuì hǎo adv3 had better; best
尊重 zūn zhòng v3 respect
左右 zuǒ yòu n3 about, more or less
作者 zuò zhě n3 author #个,位 @story
座位 zuò wèi n3 seat #个
// ---- B2 (HSK 5): a start
安慰 ān wèi v4 comfort
熬夜 áo yè v4 stay up late
包含 bāo hán v4 contain
保持 bǎo chí v4 keep, maintain
抱怨 bào yuàn v4 complain
避免 bì miǎn v4 avoid
表达 biǎo dá v4 express @language
补充 bǔ chōng v4 add, supplement
采取 cǎi qǔ v4 adopt, take (measures)
参与 cān yù v4 take part
承认 chéng rèn v4 admit
处理 chǔ lǐ v4 deal with
传播 chuán bō v4 spread
创造 chuàng zào v4 create
辞职 cí zhí v4 quit a job @work
存 cún v4 save, store
达到 dá dào v4 reach, achieve
打工 dǎ gōng v4 work a (part-time) job @work
担任 dān rèn v4 serve as
耽误 dān wu v4 delay
等待 děng dài v4 wait
发挥 fā huī v4 bring into play
发明 fā míng v4 invent; invention
分析 fēn xī v4 analyze
奋斗 fèn dòu v4 strive
感激 gǎn jī v4 be grateful
告别 gào bié v4 say goodbye
沟通 gōu tōng v4 communicate
观察 guān chá v4 observe
合作 hé zuò v4 cooperate
纪念 jì niàn v4 commemorate; souvenir
建立 jiàn lì v4 set up, build
交换 jiāo huàn v4 exchange
接触 jiē chù v4 come into contact with
节省 jié shěng v4 save, economize
尽力 jìn lì v4 do your best
克服 kè fú v4 overcome
夸 kuā v4 praise
录音 lù yīn v4 record (sound); recording
面对 miàn duì v4 face
描写 miáo xiě v4 describe
培养 péi yǎng v4 train, foster
欺负 qī fu v4 bully
启发 qǐ fā v4 inspire
签 qiān v4 sign
抢 qiǎng v4 grab, snatch
劝 quàn v4 persuade, advise
确认 què rèn v4 confirm
忍不住 rěn bu zhù v4 can't help (doing)
撒谎 sā huǎng v4 lie, tell a lie
晒 shài v4 bask, dry in the sun
伤害 shāng hài v4 hurt, harm
设计 shè jì v4 design
实现 shí xiàn v4 come true; realize
失去 shī qù v4 lose
收获 shōu huò n4 gains, harvest
说服 shuō fú v4 convince
损失 sǔn shī n4 loss
逃避 táo bì v4 escape, avoid
挑战 tiǎo zhàn n4 challenge
体会 tǐ huì v4 understand (from experience)
体验 tǐ yàn v4 experience (first-hand)
挑 tiāo v4 choose, pick
推荐 tuī jiàn v4 recommend
退休 tuì xiū v4 retire @work
吓 xià v4 scare
想象 xiǎng xiàng v4 imagine
享受 xiǎng shòu v4 enjoy
欣赏 xīn shǎng v4 appreciate, enjoy
形成 xíng chéng v4 form
修改 xiū gǎi v4 revise
宣布 xuān bù v4 announce
训练 xùn liàn v4 train; training @sport
演讲 yǎn jiǎng v4 give a speech
摇 yáo v4 shake, wave
咬 yǎo v4 bite
拥有 yōng yǒu v4 have, own
犹豫 yóu yù v4 hesitate
预订 yù dìng v4 book, reserve
赞成 zàn chéng v4 approve, agree with
摘 zhāi v4 pick (fruit, flowers)
争论 zhēng lùn v4 argue
争取 zhēng qǔ v4 strive for
挣 zhèng v4 earn @money
执行 zhí xíng v4 carry out
指导 zhǐ dǎo v4 guide, coach
治疗 zhì liáo v4 treat (an illness) @health
主持 zhǔ chí v4 host, preside over
祝福 zhù fú v4 bless; good wishes
抓紧 zhuā jǐn v4 make the most of (time)
追求 zhuī qiú v4 pursue
总共 zǒng gòng adv4 in total
组织 zǔ zhī v4 organize; organization
遵守 zūn shǒu v4 obey, follow
作品 zuò pǐn n4 work (of art) #个,部 @art
`);
  W.push(`
// ---- wave 2: words the zh talk and reading content needs (js/talk/content_zh.js, js/read/content_zh.js)
一家人 yī jiā rén n2 one family; the whole family @family
有空 yǒu kòng v2 be free, have time %st
村长 cūn zhǎng n4 village head #个,位 @people,town
笼 lóng cl4 a steamer basket of %part
评论 píng lùn v4 comment; a comment #条 @tech
语音 yǔ yīn n4 voice message #条,个 @tech
表情包 biǎo qíng bāo n4 sticker (in a chat app) #个,张 @tech
扫码 sǎo mǎ v4 scan a QR code @tech,money
水果摊 shuǐ guǒ tān n4 fruit stall #个 @shop
摊 tān n4 stall #个 @shop
果园 guǒ yuán n4 orchard #个,片 @nature
越南 Yuè nán name2 Vietnam @place
故事书 gù shi shū n2 storybook #本 @story
哈哈 hā hā int1 haha
大声 dà shēng adv2 loudly, out loud
小声 xiǎo shēng adv2 quietly, in a low voice
聊 liáo v2 chat
聊聊 liáo liao v2 have a chat
运气 yùn qi n3 luck @feeling
道理 dào li n3 sense, reason («有道理»: that makes sense)
笔友 bǐ yǒu n3 pen pal #个,位 @people
漫画 màn huà n3 comic book; comics #本,部 @art,hobby
山谷 shān gǔ n3 valley #个,条 @nature
池塘 chí táng n3 pond #个 @nature
干活 gàn huó v3 work, do a job @work
划船 huá chuán v3 row a boat @sport,transport
庆祝 qìng zhù v3 celebrate
重复 chóng fù v3 repeat
烟花 yān huā n3 fireworks #个,场 @hobby
平安 píng ān adj3 safe and sound +
加入 jiā rù v3 join
旅馆 lǚ guǎn n3 inn, small hotel #家,个 @travel,town
火车票 huǒ chē piào n2 train ticket #张 @travel
南方人 nán fāng rén n3 southerner #个 @people
北方人 běi fāng rén n3 northerner #个 @people
收音机 shōu yīn jī n3 radio (the set) #台,个 @tech
电台 diàn tái n3 radio station #个 @tech
明信片 míng xìn piàn n3 postcard #张 @travel
整天 zhěng tiān adv3 all day long @time
身边 shēn biān n3 at your side, around you
打招呼 dǎ zhāo hu v3 say hello, greet
挤 jǐ adj3 crowded, packed
准 zhǔn adj3 accurate, on target
锅 guō n3 pot, wok #口,个 @home
坏人 huài rén n3 bad person, villain #个 @people
点心 diǎn xin n3 snack, little cake #块,个 @food
宝贝 bǎo bèi n4 treasure; darling #个,件 @fantasy
神仙 shén xiān n4 immortal (in folk tales) #位,个 @fantasy
嫦娥 Cháng é name4 Chang'e (the lady in the moon) @story
后羿 Hòu Yì name4 Hou Yi (the archer) @story
射 shè v4 shoot (an arrow) @sport
射箭 shè jiàn v4 shoot arrows; archery @sport
弓 gōng n4 bow (for arrows) #张,把 @sport
木筏 mù fá n4 raft #只,个 @transport
渔民 yú mín n4 fisherman #个,位 @work
码头 mǎ tóu n4 pier, wharf #个,座 @place
隧道 suì dào n4 tunnel #条 @place
矿井 kuàng jǐng n4 mine shaft #个,口 @place
铁匠 tiě jiàng n4 blacksmith #个,位 @work
铸 zhù v4 cast (metal)
铜 tóng n4 copper, bronze
灰 huī n4 dust, ash
泥 ní n4 mud; clay
声音节 Shēng yīn jié name4 the Festival of Voices @hush
年夜饭 nián yè fàn n4 New Year's Eve dinner #顿 @food,time
家常菜 jiā cháng cài n4 home-style dish #道,个 @food
汁 zhī n4 juice (in cooking) @food
搅 jiǎo v4 stir, beat (eggs)
眼泪 yǎn lèi n4 tears #滴 @body,feeling
善良 shàn liáng adj4 kind-hearted +
平静 píng jìng adj4 calm, still
神秘 shén mì adj4 mysterious
神奇 shén qí adj4 magical, amazing +
疯 fēng adj4 crazy
根本 gēn běn adv4 at all, simply
缘分 yuán fèn n4 fate (that brings people together)
群聊 qún liáo n4 group chat #个 @tech
手气 shǒu qì n4 luck (at a draw, at cards) @hobby
最佳 zuì jiā adj4 the very best
心里话 xīn lǐ huà n4 what's really on your mind
手艺 shǒu yì n4 craft, skill (a cook's)
充实 chōng shí adj4 full (a day, a life)
怪不得 guài bu de adv4 no wonder
难怪 nán guài adv4 no wonder
谦虚 qiān xū adj4 modest +
武器 wǔ qì n4 weapon #件,种
做法 zuò fǎ n4 way of making it #种
眼光 yǎn guāng n4 an eye (for good things), taste
一辈子 yī bèi zi n4 a whole lifetime @time
游记 yóu jì n4 travel book #本,篇 @travel,story
拜年 bài nián v4 wish a happy New Year @time
远方 yuǎn fāng n4 faraway places @place
心愿 xīn yuàn n4 wish, dream #个
茶馆 chá guǎn n4 teahouse #家,个 @drink,town
惊喜 jīng xǐ n4 a (nice) surprise #个 @feeling
志愿者 zhì yuàn zhě n4 volunteer #个,位 @people
服务台 fú wù tái n4 front desk #个 @place
结尾 jié wěi n4 ending #个 @story
毛茸茸 máo róng róng adj4 fluffy
细节 xì jié n4 detail #个
拼图 pīn tú n4 jigsaw puzzle #幅,个 @hobby
口哨 kǒu shào n4 whistle @music
偶然 ǒu rán adv4 by chance
规矩 guī ju n4 rule, custom #个,条
轮到 lún dào v4 be someone's turn
打呼噜 dǎ hū lu v4 snore
听众 tīng zhòng n4 listener, audience #位,个 @people
生日歌 shēng rì gē n2 birthday song #首 @music
钓 diào v3 fish, angle (钓鱼: go fishing) @hobby
`);
  W.push(`
// ---- everyday words a learner types (home, school, weather, food, travel, feelings; found missing by the exams helper)
烹饪 pēng rèn n4 cooking @food,home
学费 xué fèi n3 tuition, school fees #笔 @school,money
日落 rì luò n3 sunset @nature,time
日出 rì chū n3 sunrise @nature,time
阳台 yáng tái n3 balcony #个 @home
湖水 hú shuǐ n3 lake water @nature
浴室 yù shì n3 bathroom #个,间 @home
租房 zū fáng v3 rent a flat @home
房租 fáng zū n3 rent (money) #笔 @home,money
公寓 gōng yù n3 apartment #套,个 @home
宿舍 sù shè n2 dorm #个,间 @school,home
校园 xiào yuán n3 campus #个 @school
食堂 shí táng n2 canteen, dining hall #个 @school,food
奖学金 jiǎng xué jīn n4 scholarship #笔,个 @school,money
课程 kè chéng n3 course, curriculum #门,个 @school
气温 qì wēn n3 air temperature @weather
阴天 yīn tiān n2 overcast day @weather
多云 duō yún adj2 cloudy @weather
潮湿 cháo shī adj4 damp, humid @weather
干燥 gān zào adj4 dry @weather
沙拉 shā lā n3 salad #份,盘 @food
买单 mǎi dān v3 pay the bill @food,money
外卖 wài mài n2 takeout, delivery food #份,个 @food
签证 qiān zhèng n3 visa #个,张 @travel
酒店 jiǔ diàn n2 hotel #家,个 @travel
景点 jǐng diǎn n3 tourist attraction #个 @travel
路口 lù kǒu n2 crossing, intersection #个 @travel,place
红绿灯 hóng lǜ dēng n3 traffic light #个 @travel,place
健身 jiàn shēn v3 work out, keep fit @sport,health
网络 wǎng luò n3 the network, the internet @tech
邮件 yóu jiàn n3 email, mail #封 @tech
商场 shāng chǎng n2 shopping mall #个,家 @shop,place
付款 fù kuǎn v3 pay (an amount) @shop,money
面试 miàn shì v3 interview; a job interview #个,次 @work
沙滩 shā tān n3 beach #个 @nature,place
夜晚 yè wǎn n3 night, evening @time
早晨 zǎo chen n3 early morning @time
傍晚 bàng wǎn n3 dusk, early evening @time
小提琴 xiǎo tí qín n4 violin #把 @music
相机 xiàng jī n3 camera #个,台 @tech,hobby
发音 fā yīn n3 pronunciation @school
理由 lǐ yóu n3 reason #个
门口 mén kǒu n2 doorway, entrance #个 @home,place
雨伞 yǔ sǎn n2 umbrella #把 @weather,home
钱包 qián bāo n2 wallet #个 @money
瓶子 píng zi n2 bottle, jar #个 @home
肥皂 féi zào n3 soap #块 @home
牙膏 yá gāo n3 toothpaste #支 @home
`);
  W.push(`
// ---- DX-CJK (the B2 round, 2026-11-27): words the letters and debates asked for (game/words_needed.txt)
学会 xué huì v2 learn (and be able to), master
学到 xué dào v3 learn, pick up (knowledge)
豆沙 dòu shā n4 sweet red bean paste @food
莲蓉 lián róng n4 lotus seed paste @food
赏月 shǎng yuè v4 admire the moon (at Mid-Autumn) @nature
青菜 qīng cài n3 leafy greens #棵,把 @food
合不拢嘴 hé bù lǒng zuǐ phrase4 can't stop smiling @feeling
姑姑 gū gu n3 aunt (father's sister) #个,位 @family,people
夜 yè n3 night @time
主厨 zhǔ chú n4 head chef #个,位 @work,food
居然 jū rán adv4 to one's surprise, actually
办 bàn v3 do, handle; hold (a party)
派对 pài duì n3 party #个,场 @hobby
渔歌 yú gē n4 fishing song #首 @music
面馆 miàn guǎn n3 noodle shop #家,个 @food,shop
徒弟 tú dì n4 apprentice #个,位 @work,people
粗 cū adj3 thick, coarse
像样 xiàng yàng adj4 decent, presentable +
妈 mā n2 mom @family,people
暖 nuǎn adj3 warm +
兰州 Lán zhōu name3 Lanzhou @place
昆明 Kūn míng name3 Kunming @place
普洱 Pǔ ěr name4 Pu'er (a town in Yunnan) @place
茶篓 chá lǒu n4 tea-picking basket #个 @drink
觉 jiào n3 sleep («睡不着觉»: can't sleep)
年纪 nián jì n3 age (of a person)
烧 shāo v3 burn; cook, roast
柴 chái n4 firewood #根 @nature
自由 zì yóu n3 freedom; free +
急 jí adj3 in a hurry, anxious; urgent
快递 kuài dì n3 express delivery, courier #个,件 @shop
快餐 kuài cān n3 fast food #份 @food
整 zhěng adj3 whole, entire
边 biān n3 side, edge
可 kě adv3 (for emphasis) really, do
规律 guī lǜ n4 pattern, rule; regular (生活很规律)
取消 qǔ xiāo v3 cancel, do away with
摆 bǎi v3 set out, put; display
校医 xiào yī n4 school doctor, school nurse #个,位 @school,health
红薯 hóng shǔ n3 sweet potato #个,块 @food
管 guǎn v3 manage, be in charge of; mind
卫生 wèi shēng n3 hygiene; clean
公平 gōng píng adj3 fair +
证 zhèng n4 certificate, card (卫生证, 学生证) #张,个
// ---- measure words (B1–B2)
名#cl míng cl3 (people, formal: 一名学生) %ppl
项 xiàng cl4 (items, tasks, rules)
笔#cl bǐ cl4 a sum of (money) %part
批 pī cl4 a batch of, a group of %part
堆 duī cl4 a pile of, a heap of %part
串 chuàn cl4 a string of, a bunch of %part
届 jiè cl4 (sessions, graduating classes, events held every year) %part
排#cl pái cl4 a row of %part
组#cl zǔ cl4 a group of, a set of %part
// ---- work and careers
职位 zhí wèi n4 position, post #个 @work
简历 jiǎn lì n4 résumé, CV #份 @work
招聘 zhāo pìn v4 recruit, hire @work
应聘 yìng pìn v4 apply for a job @work
录取 lù qǔ v4 admit, accept (to a school or a job) @school,work
奖金 jiǎng jīn n4 bonus, prize money #笔 @money,work
休假 xiū jià v4 take time off, be on holiday @work
员工 yuán gōng n3 employee, staff #个,名,位 @work,people
职员 zhí yuán n4 office worker, clerk #个,名,位 @work,people
秘书 mì shū n4 secretary #个,位 @work,people
会计 kuài jì n4 accountant; accounting #个,位 @work,money
编辑 biān jí n4 editor; edit #个,位 @work
设计师 shè jì shī n4 designer #个,位 @work,art
程序员 chéng xù yuán n4 programmer #个,名 @work,tech
领导 lǐng dǎo n3 leader, boss; lead #个,位 @work
企业 qǐ yè n4 company, enterprise #家,个 @work
行业 háng yè n4 industry, line of business #个 @work
部门 bù mén n4 department #个 @work
团队 tuán duì n4 team #个,支 @work
效率 xiào lǜ n4 efficiency @work
合同 hé tong n4 contract #份 @work
失业 shī yè v4 lose one's job, be unemployed - @work
就业 jiù yè v4 find work; employment @work
兼职 jiān zhí n4 part-time job #份,个 @work
全职 quán zhí adj4 full-time @work %ng
升职 shēng zhí v4 be promoted @work
培训 péi xùn v4 train (staff); training @work
实习 shí xí v4 do an internship @work,school
业务 yè wù n4 business, line of work #项 @work
客户 kè hù n4 client, customer #个,位 @work,shop
项目 xiàng mù n4 project; item #个,项 @work
成就 chéng jiù n4 achievement #个,项
优势 yōu shì n4 advantage, strength #个
汇报 huì bào v4 report (to a boss) @work
职场 zhí chǎng n4 the workplace @work
工作日 gōng zuò rì n4 working day @work,time
能干 néng gàn adj4 capable, able +
专家 zhuān jiā n4 expert #个,位 @people
退休金 tuì xiū jīn n4 pension #笔,份 @money,work
农民工 nóng mín gōng n4 migrant worker #个,名 @work,people
// ---- health and the body
疾病 jí bìng n4 illness, disease #种 @health
病毒 bìng dú n4 virus #种 @health,tech
细菌 xì jūn n4 germs, bacteria #种 @health
感染 gǎn rǎn v4 infect; get infected @health
伤口 shāng kǒu n4 wound, cut #个,道 @health,body
骨头 gǔ tou n3 bone @body
血 xuè n3 blood #滴 @body
心脏 xīn zàng n4 heart (the organ) #颗,个 @body,health
肺 fèi n4 lung #个 @body
胃 wèi n4 stomach #个 @body
肌肉 jī ròu n4 muscle #块 @body
大脑 dà nǎo n4 brain #个 @body
嗓子 sǎng zi n3 throat; voice #个 @body
肩膀 jiān bǎng n3 shoulder #个 @body
膝盖 xī gài n4 knee #个 @body
腰 yāo n3 waist, lower back @body
胸 xiōng n4 chest @body
手术 shǒu shù n4 operation, surgery #个,次,台 @health
病人 bìng rén n3 patient, sick person #个,位 @health,people
诊所 zhěn suǒ n4 clinic #家,个 @health,place
药店 yào diàn n3 pharmacy #家,个 @health,shop
挂号 guà hào v4 register (at a hospital) @health
康复 kāng fù v4 get well, recover (fully) @health
预防 yù fáng v4 prevent @health
营养 yíng yǎng n4 nutrition @health,food
睡眠 shuì mián n4 sleep @health
失眠 shī mián v4 can't sleep, have insomnia - @health
过敏 guò mǐn v4 be allergic; allergy @health
症状 zhèng zhuàng n4 symptom #个,种 @health
体重 tǐ zhòng n4 body weight @health,body
身高 shēn gāo n3 height (of a person) @body
心理 xīn lǐ n4 psychology, state of mind @health
疲劳 pí láo adj4 tired, fatigued - @health
痛苦 tòng kǔ adj4 painful, suffering - @feeling
健身房 jiàn shēn fáng n3 gym #家,个 @sport,place
救护车 jiù hù chē n4 ambulance #辆 @health,transport
急诊 jí zhěn n4 emergency (room) @health
医疗 yī liáo n4 medical care @health
保险 bǎo xiǎn n4 insurance #份 @money,health
呼吸 hū xī v4 breathe; breathing @body,health
晕 yūn v4 feel dizzy; faint @health
吐 tù v4 vomit, throw up @health
去世 qù shì v4 pass away @people
寿命 shòu mìng n4 lifespan @health
体检 tǐ jiǎn n4 physical checkup #次 @health
牙医 yá yī n3 dentist #个,位 @health,work
近视 jìn shì adj4 nearsighted @health,body
// ---- compounds the game's lines use, so new single characters don't split them (边境, not 边 + 境)
就是 jiù shì v1 is just, is exactly; that is %cop,st
包#v bāo v2 wrap; make (dumplings: 包饺子)
心里 xīn lǐ n2 in one's heart, in one's mind
排#v pái v4 line up; put in order
成 chéng v3 become, turn into; (成了) it worked
刷 shuā v3 brush; paint
保管 bǎo guǎn v4 keep, look after (something)
等级 děng jí n3 level, grade (the Academy's level exams) #个
排练 pái liàn v4 rehearse
命名 mìng míng v4 name (after)
摆渡 bǎi dù v4 ferry (people across)
沼泽 zhǎo zé n4 marsh, swamp #片 @nature,place
边境 biān jìng n4 border, frontier @place
夜市 yè shì n3 night market #个 @shop,town
可疑 kě yí adj4 suspicious
燃烧 rán shāo v4 burn
沙堆 shā duī n4 pile of sand @nature
泉 quán n4 spring (of water) @nature
咋 zǎ adv4 how, why (casual, in the north)
扎 zhā v4 prick; dive into
冒 mào v4 give off, rise (smoke, steam); brave (a risk)
悬崖 xuán yá n4 cliff #个,座 @nature,place
石堤 shí dī n4 stone dike #条,道 @place
字迹 zì jì n4 handwriting
四川 Sì chuān name3 Sichuan @place
名人 míng rén n4 famous person, celebrity #个,位 @people
辈子 bèi zi n4 lifetime («这辈子»: in this life)
邮差 yóu chāi n4 mail carrier #个,位 @work,people
缩 suō v4 shrink, curl up
成立 chéng lì v4 found, set up
压 yā v4 press, push down
忍 rěn v4 bear, put up with
小猫 xiǎo māo n2 kitten #只 @animal
灯塔岛 Dēng tǎ dǎo name4 Lighthouse Island @place,hush
// ---- the two B1 jobs (A2's «life jobs» lines in words_needed.txt)
采访 cǎi fǎng v4 interview (for the news) @work
访客 fǎng kè n4 visitor #位,个 @people
中级 zhōng jí adj4 intermediate (level) %ng @school
柜台 guì tái n3 counter (in a shop or an office) #个 @shop
招 zhāo v4 recruit, take on; wave (to someone)
整个 zhěng gè det3 whole, entire
改 gǎi v3 change, correct
房 fáng n4 room; house («四号房») #间
含 hán v4 contain («不含坚果»: no nuts in it)
坚果 jiān guǒ n4 nut(s) #颗 @food
借书证 jiè shū zhèng n4 library card #张 @school
隔壁 gé bì n3 next door @home,place
走廊 zǒu láng n4 corridor, hall #条 @home
邮船 yóu chuán n4 mail boat #艘,条 @transport
稍等 shāo děng phrase3 one moment, please
查 chá v3 check, look up
话语 huà yǔ n4 words, speech
进步 jìn bù v3 improve, make progress; progress +
辩论 biàn lùn v4 debate; argue #场
疑问 yí wèn n4 question, doubt #个
话筒 huà tǒng n4 microphone #个 @tech
直播 zhí bō v4 broadcast live, stream live @tech
念 niàn v3 read aloud; miss (someone)
播 bō v4 broadcast, put on (the radio) @tech
记下 jì xià v3 note down, write down
传 chuán v3 pass on, spread («传到»: reach)
转述 zhuǎn shù v4 relay, report (what someone said)
稿子 gǎo zi n4 draft, news copy #篇,份,条
配方 pèi fāng n4 recipe, formula #个
倍 bèi cl4 times, -fold («多一倍»: twice as many) %part
豆角 dòu jiǎo n4 green beans @food
菜园 cài yuán n4 vegetable garden #个,块 @nature
丰收 fēng shōu n4 a good harvest +
全校 quán xiào n4 the whole school @school
图书管理员 tú shū guǎn lǐ yuán n4 librarian #个,位 @work,people
读者 dú zhě n3 reader #个,位 @people
生 shēng v3 give birth to; be born («生了五只小猫»)
眼 yǎn n3 eye (in compounds: 眼里) @body
眼#cl yǎn cl4 a look («看了我一眼») %part
贴 tiē v4 stick, put up (a notice)
海报 hǎi bào n4 poster #张 @art
队 duì n3 team; line (of people) #个,支 @sport
领先 lǐng xiān v4 lead, be ahead
船身 chuán shēn n4 (a boat's) hull; a boat length
银河 yín hé n4 the Milky Way @nature
航线 háng xiàn n4 route (of a boat or a plane) #条 @transport
组织者 zǔ zhī zhě n4 organizer #个,位 @people
期待 qī dài v4 look forward to, expect @feeling
诗歌 shī gē n4 poetry, poems #首 @art
镇上 zhèn shang n3 in town @town
错误 cuò wù n3 mistake, error #个 -
记 jì v3 remember; write down
生效 shēng xiào v4 take effect
回合 huí hé cl4 round, turn (in a fight or a game: 三回合) %part
小事 xiǎo shì n3 small matter, trifle #件
再见面 zài jiàn miàn v3 meet again (not 再见 + 面)
只能 zhǐ néng adv2 can only, have to
上船 shàng chuán v3 get on a boat, board @transport
下船 xià chuán v3 get off a boat @transport
提到 tí dào v3 mention
粽叶 zòng yè n4 bamboo leaves (for zongzi) @food
市政府 shì zhèng fǔ n4 city government, city hall @town
镇政府 zhèn zhèng fǔ n4 town hall, town government @town
地里 dì li n2 in the field(s) @nature
屋里 wū li n2 in the room, indoors @home
好几 hǎo jǐ num3 quite a few, several
总 zǒng adv2 always; (in) total; after all
另一半 lìng yī bàn n4 the other half; (someone's) partner
班#cl bān cl3 (a scheduled run: 这班车, 一班船) %part
中心 zhōng xīn n3 center #个 @place
清洁工 qīng jié gōng n3 cleaner, street sweeper #个,位 @work,people
织 zhī v3 knit, weave @hobby
煤气 méi qì n4 (cooking) gas @home
悬念 xuán niàn n4 suspense
招式 zhāo shì n4 move (in martial arts) #个,套 @sport
绝招 jué zhāo n4 special move, secret trick #个
亲眼 qīn yǎn adv4 with one's own eyes
暖气 nuǎn qì n3 heating @home
`);
  W.push(`
// ---- news and media (B1–B2)
媒体 méi tǐ n4 the media @tech
报道 bào dào v4 report (the news); a report #篇,条 @tech
电视台 diàn shì tái n3 TV station #家,个 @tech
频道 pín dào n4 (TV) channel #个 @tech
主持人 zhǔ chí rén n4 host, presenter #个,位 @work,people
标题 biāo tí n4 headline, title #个
宣传 xuān chuán v4 publicize, promote
发表 fā biǎo v4 publish; give (a speech)
出版 chū bǎn v4 publish (a book) @story
事件 shì jiàn n4 event, incident #个
事故 shì gù n3 accident #个,场 -
社交 shè jiāo n4 social life, socializing
播放 bō fàng v4 play, broadcast @tech
真相 zhēn xiàng n4 the truth (of what happened) #个
谣言 yáo yán n4 rumor #个,条 -
公开 gōng kāi adj4 public, open; make public
报告 bào gào n3 report; report on #份,个
统计 tǒng jì v4 count up; statistics
数据 shù jù n4 data #个,组 @tech
最新 zuì xīn adj3 latest, newest %ng
热门 rè mén adj4 popular, in demand %ng
话题 huà tí n3 topic (of conversation) #个
头条 tóu tiáo n4 headline, top story #个,条
记录 jì lù v3 record, write down; a record #个,项
纪录片 jì lù piàn n4 documentary #部 @art
电视剧 diàn shì jù n3 TV series #部 @art
舆论 yú lùn n4 public opinion
网红 wǎng hóng n4 internet celebrity #个,位 @tech,people
点赞 diǎn zàn v4 like (a post) @tech
转发 zhuǎn fā v4 share, forward (a post) @tech
关注 guān zhù v4 follow; pay attention to @tech
评价 píng jià v4 evaluate, judge; an assessment #个
报社 bào shè n4 newspaper office #家,个 @work
爆炸 bào zhà v4 explode; explosion -
失踪 shī zōng v4 go missing -
现场 xiàn chǎng n4 the scene, on the spot @place
紧急 jǐn jí adj4 urgent, emergency
// ---- environment and climate
气候 qì hòu n3 climate @weather,nature
全球 quán qiú n4 the whole world, global @place
资源 zī yuán n4 resources #种 @nature
能源 néng yuán n4 energy (source) #种 @nature
回收 huí shōu v4 recycle; collect back @nature
塑料 sù liào n4 plastic @home
雾霾 wù mái n4 smog @weather
排放 pái fàng v4 give off, emit (gases)
灾害 zāi hài n4 disaster #场,种 @nature -
地震 dì zhèn n3 earthquake #场,次 @nature -
台风 tái fēng n4 typhoon #场,个 @weather
暴雨 bào yǔ n4 rainstorm #场 @weather
物种 wù zhǒng n4 species #个,种 @nature,animal
灭绝 miè jué v4 die out, become extinct -
生态 shēng tài n4 ecology @nature
太阳能 tài yáng néng n4 solar energy @nature
石油 shí yóu n4 oil, petroleum @nature
煤 méi n4 coal @nature
环保 huán bǎo adj4 green, eco-friendly; protecting the environment %ng +
砍 kǎn v4 chop, cut down
野生 yě shēng adj4 wild (animals, plants) %ng @nature,animal
可持续 kě chí xù adj4 sustainable %ng @nature
降温 jiàng wēn v4 cool down; the temperature drops @weather
升温 shēng wēn v4 warm up; the temperature rises @weather
雪山 xuě shān n3 snowy mountain #座 @nature
河流 hé liú n4 river #条 @nature
湖泊 hú pō n4 lake #个 @nature
草原 cǎo yuán n3 grassland, prairie #片 @nature
土壤 tǔ rǎng n4 soil @nature
水源 shuǐ yuán n4 water source @nature
缺水 quē shuǐ v4 be short of water @nature
节能 jié néng v4 save energy @nature
低碳 dī tàn adj4 low-carbon %ng @nature
绿化 lǜ huà v4 plant trees and grass, make greener @nature
塑料袋 sù liào dài n3 plastic bag #个 @shop
分类 fēn lèi v4 sort, classify («垃圾分类»: sorting rubbish)
保护区 bǎo hù qū n4 nature reserve #个 @nature,place
雨林 yǔ lín n4 rainforest #片 @nature
极端 jí duān adj4 extreme
// ---- technology and the internet
科技 kē jì n4 science and technology @tech
网页 wǎng yè n4 web page #个 @tech
软件 ruǎn jiàn n4 software, app #个 @tech
硬件 yìng jiàn n4 hardware @tech
程序 chéng xù n4 (computer) program; procedure #个 @tech
键盘 jiàn pán n4 keyboard #个 @tech
鼠标 shǔ biāo n4 (computer) mouse #个 @tech
屏幕 píng mù n4 screen #块,个 @tech
账号 zhàng hào n4 (online) account #个 @tech
登录 dēng lù v4 log in @tech
上传 shàng chuán v4 upload @tech
搜索 sōu suǒ v4 search (online) @tech
点击 diǎn jī v4 click @tech
输入 shū rù v4 type in, enter @tech
删除 shān chú v4 delete @tech
保存 bǎo cún v4 save, keep @tech
复制 fù zhì v4 copy @tech
文件 wén jiàn n3 file, document #个,份 @tech,work
数码 shù mǎ adj4 digital %ng @tech
智能 zhì néng adj4 smart, intelligent %ng @tech
人工智能 rén gōng zhì néng n4 artificial intelligence @tech
机器人 jī qì rén n4 robot #个,台 @tech
机器 jī qì n3 machine #台,个 @tech
设备 shè bèi n4 equipment, device #台,个,套 @tech
充电 chōng diàn v3 charge (a battery) @tech
无线 wú xiàn adj4 wireless %ng @tech
黑客 hēi kè n4 hacker #个,名 @tech,people
网购 wǎng gòu v4 shop online @tech,shop
应用 yìng yòng v4 apply, use; app #个 @tech
功能 gōng néng n4 function, feature #个,种 @tech
系统 xì tǒng n4 system #个,套 @tech
版本 bǎn běn n4 version #个 @tech
更新 gēng xīn v4 update @tech
升级 shēng jí v4 upgrade @tech
实验 shí yàn n4 experiment #个,次 @school
图片 tú piàn n3 picture, image #张 @tech
自拍 zì pāi v4 take a selfie @tech
网友 wǎng yǒu n4 online friend, internet user #个,位 @tech,people
博客 bó kè n4 blog #个 @tech
粉丝 fěn sī n4 fan(s), followers #个,位 @tech,people
平板 píng bǎn n4 tablet (computer) #个,台 @tech
电子 diàn zǐ adj4 electronic %ng @tech
在线 zài xiàn adj4 online %ng @tech
离线 lí xiàn adj4 offline %ng @tech
链接 liàn jiē n4 link #个,条 @tech
二维码 èr wéi mǎ n4 QR code #个 @tech
充电器 chōng diàn qì n4 charger #个 @tech
耳机 ěr jī n3 headphones, earphones #副,个 @tech
网速 wǎng sù n4 internet speed @tech
流量 liú liàng n4 (mobile) data; flow @tech
发明家 fā míng jiā n4 inventor #个,位 @people
操作 cāo zuò v4 operate, work (a machine)
安装 ān zhuāng v4 install @tech
卸载 xiè zài v4 uninstall @tech
电子书 diàn zǐ shū n4 e-book #本 @tech
游戏机 yóu xì jī n4 game console #台,个 @tech,hobby
硬盘 yìng pán n4 hard drive #个,块 @tech
`);
  W.push(`
// ---- society and community, everyday law
社区 shè qū n4 community, neighborhood #个 @town
居民 jū mín n4 resident #个,位 @people,town
公民 gōng mín n4 citizen #个,位 @people
人口 rén kǒu n4 population @people
政府 zhèng fǔ n4 government @town
法院 fǎ yuàn n4 court (of law) #个,家 @place
派出所 pài chū suǒ n4 police station #个,家 @place
犯罪 fàn zuì v4 commit a crime; crime -
小偷 xiǎo tōu n3 thief #个,名 @people -
抢劫 qiǎng jié v4 rob -
骗子 piàn zi n4 cheat, swindler #个 @people -
违法 wéi fǎ v4 break the law; illegal -
合法 hé fǎ adj4 legal, lawful
罚款 fá kuǎn v4 fine; a fine #笔 @money
权利 quán lì n4 right(s) #项,个
义务 yì wù n4 duty, obligation #项,个
平等 píng děng adj4 equal +
证据 zhèng jù n4 evidence, proof #个,条
身份证 shēn fèn zhèng n4 ID card #张 @travel
登记 dēng jì v4 register, check in
投票 tóu piào v4 vote
选举 xuǎn jǔ n4 election #次,场
捐 juān v4 donate, give
慈善 cí shàn n4 charity
贫穷 pín qióng adj4 poor; poverty -
老年人 lǎo nián rén n3 old people, the elderly #个,位 @people
年轻人 nián qīng rén n3 young people #个 @people
习俗 xí sú n4 custom #个,种
宗教 zōng jiào n4 religion #个,种
公共 gōng gòng adj4 public %ng @town
设施 shè shī n4 facilities #个,种 @town
矛盾 máo dùn n4 contradiction, conflict #个 -
冲突 chōng tū n4 conflict, clash #个,场 -
现象 xiàn xiàng n4 phenomenon #个,种
改革 gǎi gé v4 reform
制度 zhì dù n4 system (of rules) #个,种
政策 zhèng cè n4 policy #个,项
和平 hé píng n4 peace +
战争 zhàn zhēng n4 war #场 -
军队 jūn duì n4 army, troops #支 @people
士兵 shì bīng n4 soldier #个,名 @people
道德 dào dé n4 morals, ethics
法官 fǎ guān n4 judge #个,位 @work,people
房东 fáng dōng n4 landlord #个,位 @home,people
押金 yā jīn n4 deposit #笔 @money,home
签名 qiān míng v4 sign (your name); signature
手续 shǒu xù n4 procedures, formalities
证书 zhèng shū n4 certificate #张,个 @school
执照 zhí zhào n4 license (to practice) #张,个
驾照 jià zhào n4 driver's license #本,张 @transport
罚 fá v4 punish, fine
抗议 kàng yì v4 protest
规则 guī zé n3 rule #条,个
秩序 zhì xù n4 order (in a place, a crowd)
文明 wén míng n4 civilization; civilized, polite
公益 gōng yì n4 public good, charity work
捐款 juān kuǎn v4 donate money; a donation #笔 @money
救助 jiù zhù v4 help, rescue (people in need)
残疾人 cán jí rén n4 disabled person #个,位 @people
孤儿 gū ér n4 orphan #个 @people
养老 yǎng lǎo v4 provide for the elderly; live in retirement
养老院 yǎng lǎo yuàn n4 home for the elderly #家,个 @place
福利 fú lì n4 welfare, benefits
待遇 dài yù n4 pay and conditions; treatment
纠纷 jiū fēn n4 dispute #个,场 -
起诉 qǐ sù v4 sue -
判决 pàn jué v4 rule (in court); a verdict
监狱 jiān yù n4 prison #个,座 @place -
逮捕 dài bǔ v4 arrest -
案件 àn jiàn n4 (legal) case #个
报警 bào jǐng v4 call the police
偷窃 tōu qiè v4 steal; theft -
邻里 lín lǐ n4 neighbors, the neighborhood @people
物业 wù yè n4 property management #家,个 @home
投诉 tóu sù v4 complain (officially); a complaint
赔偿 péi cháng v4 compensate; compensation @money
违反 wéi fǎn v4 break (a rule), violate -
批准 pī zhǔn v4 approve, permit
团体 tuán tǐ n4 group, organization #个
协会 xié huì n4 association #个
成员 chéng yuán n4 member #个,名,位 @people
会员 huì yuán n4 member (of a club) #个,名,位 @people
// ---- education and science
学历 xué lì n4 education (level), qualifications @school
学位 xué wèi n4 (university) degree #个 @school
硕士 shuò shì n4 master's degree; master's student #个,位 @school
博士 bó shì n4 doctorate, PhD; doctor (title) #个,位 @school
本科 běn kē n4 undergraduate (course) @school
研究生 yán jiū shēng n4 graduate student #个,名 @school,people
课本 kè běn n3 textbook #本 @school
教材 jiào cái n4 teaching materials, textbook #本,套 @school
分数 fēn shù n3 mark, score; fraction #个 @school
及格 jí gé v3 pass (a test) @school
学问 xué wen n4 learning, knowledge
理论 lǐ lùn n4 theory #个,种
实践 shí jiàn v4 practice, put into practice
物理 wù lǐ n4 physics @school
化学 huà xué n4 chemistry @school
生物 shēng wù n4 biology; living things @school,nature
地理 dì lǐ n3 geography @school
哲学 zhé xué n4 philosophy @school
心理学 xīn lǐ xué n4 psychology @school
文学 wén xué n3 literature @school,story
词汇 cí huì n4 vocabulary @language
单词 dān cí n3 word (in a vocabulary list) #个 @language
结论 jié lùn n4 conclusion #个
观点 guān diǎn n4 point of view #个,种
步骤 bù zhòu n4 step (in a process) #个
实验室 shí yàn shì n4 laboratory #个,间 @school,place
学术 xué shù n4 academic (work), scholarship
论文 lùn wén n4 thesis, paper #篇 @school
题目 tí mù n3 topic, title; question #个,道 @school
提问 tí wèn v3 ask a question
掌握 zhǎng wò v4 master, grasp
宇宙 yǔ zhòu n4 universe @nature
星球 xīng qiú n4 planet #个,颗 @nature
太空 tài kōng n4 outer space @nature
月球 yuè qiú n4 the moon (as a body in space) @nature
科幻 kē huàn n4 science fiction @story
公式 gōng shì n4 formula #个 @school
计算 jì suàn v4 calculate, count
测量 cè liáng v4 measure
证实 zhèng shí v4 confirm, prove
假设 jiǎ shè v4 suppose; hypothesis
原理 yuán lǐ n4 principle #个
智力 zhì lì n4 intelligence
天才 tiān cái n4 genius #个 +
进修 jìn xiū v4 take further training
课堂 kè táng n3 classroom; class #个 @school
讲座 jiǎng zuò n4 lecture, talk #个,场 @school
幼儿园 yòu ér yuán n3 kindergarten #个,所 @school
高中 gāo zhōng n3 high school #个,所 @school
初中 chū zhōng n3 middle school #个,所 @school
学院 xué yuàn n3 college, academy #个,所 @school
班级 bān jí n4 class (a group of students) #个 @school
教练 jiào liàn n3 coach, trainer #个,位 @sport,people
辅导 fǔ dǎo v4 tutor, coach
补习 bǔ xí v4 take extra lessons
考上 kǎo shàng v4 get into (a school, by passing its exam)
毕业生 bì yè shēng n4 graduate #个,名 @school,people
文凭 wén píng n4 diploma #张,个 @school
奖状 jiǎng zhuàng n4 certificate of merit #张 @school
`);
  W.push(`
// ---- opinions and abstract ideas, and the words of arguing and linking
立场 lì chǎng n4 standpoint, position
否定 fǒu dìng v4 deny, reject; negative
显然 xiǎn rán adv4 obviously, clearly
似乎 sì hū adv3 it seems, apparently
毕竟 bì jìng adv3 after all
反而 fǎn ér adv3 on the contrary, instead
必要 bì yào adj4 necessary %ng
基本 jī běn adj3 basic; basically
具体 jù tǐ adj4 specific, concrete
抽象 chōu xiàng adj4 abstract
明显 míng xiǎn adj4 obvious, clear
合理 hé lǐ adj4 reasonable, sensible +
消极 xiāo jí adj4 negative, passive -
乐观 lè guān adj4 optimistic +
悲观 bēi guān adj4 pessimistic -
客观 kè guān adj4 objective
主观 zhǔ guān adj4 subjective
坏处 huài chu n3 disadvantage, harm #个 -
意义 yì yì n4 meaning, significance #个
价值 jià zhí n4 value, worth #个
事实 shì shí n4 fact #个
现实 xiàn shí n4 reality; realistic
角度 jiǎo dù n4 angle, point of view #个
程度 chéng dù n4 degree, extent
范围 fàn wéi n4 range, scope #个
因素 yīn sù n4 factor #个
相同 xiāng tóng adj3 the same, identical %ng
类似 lèi sì adj4 similar %ng
相比 xiāng bǐ v4 compare (with)
对比 duì bǐ v4 contrast, compare; a contrast
总的来说 zǒng de lái shuō phrase4 all in all, overall %conj
另一方面 lìng yī fāng miàn conj4 on the other hand %conj
从而 cóng ér conj4 thus, and so %conj
而是 ér shì conj4 but rather (不是…而是…) %conj
可见 kě jiàn conj4 so you can see that, which shows %conj
总而言之 zǒng ér yán zhī phrase4 in a word, in short %conj
换句话说 huàn jù huà shuō phrase4 in other words %conj
也就是说 yě jiù shì shuō phrase4 that is to say %conj
除此之外 chú cǐ zhī wài phrase4 apart from this, besides %conj
与此同时 yǔ cǐ tóng shí phrase4 at the same time, meanwhile %conj
哪怕 nǎ pà conj4 even if %conj,hypo
除非 chú fēi conj4 unless %conj,hypo
以免 yǐ miǎn conj4 so as not to, lest %conj
因而 yīn ér conj4 thus, as a result %conj
况且 kuàng qiě conj4 moreover, besides %conj
何况 hé kuàng conj4 let alone, all the more %conj
或许 huò xǔ adv4 perhaps, maybe
在我看来 zài wǒ kàn lái phrase3 in my view %conj
据说 jù shuō v4 it is said, they say
据 jù prep4 according to
至于 zhì yú prep4 as for, as to
一旦 yī dàn conj4 once, if ever %conj,hypo
不如 bù rú v3 not as good as; might as well
与其 yǔ qí conj4 rather than (与其…不如…) %conj
宁可 nìng kě conj4 would rather %conj
不然 bù rán conj3 otherwise, or else %conj
加上 jiā shàng conj4 plus, on top of that %conj
反正 fǎn zhèng adv4 anyway, in any case
幸亏 xìng kuī adv4 luckily, fortunately
简直 jiǎn zhí adv4 simply, practically
绝对 jué duì adv4 absolutely
相对 xiāng duì adv4 relatively
整体 zhěng tǐ n4 the whole, overall
集体 jí tǐ n4 group, collective
自我 zì wǒ n4 self, oneself
观念 guān niàn n4 idea, way of thinking #个,种
思想 sī xiǎng n4 thought, thinking #个,种
原则 yuán zé n4 principle #个,条
// ---- feelings
情绪 qíng xù n4 mood, emotions @feeling
愤怒 fèn nù adj4 angry, furious - @feeling
烦 fán adj4 annoyed, fed up - @feeling
委屈 wěi qu adj4 wronged, hurt - @feeling
惭愧 cán kuì adj4 ashamed - @feeling
尴尬 gān gà adj4 awkward, embarrassed - @feeling
自豪 zì háo adj4 proud + @feeling
满足 mǎn zú v4 satisfy; satisfied + @feeling
嫉妒 jí dù v4 be jealous (of), envy - @feeling
恨 hèn v4 hate - @feeling
好奇 hào qí adj3 curious @feeling
安心 ān xīn adj4 at ease, with peace of mind + @feeling
不安 bù ān adj4 uneasy, anxious - @feeling
恐惧 kǒng jù n4 fear, dread - @feeling
心疼 xīn téng v4 feel for, hate to see (someone hurt); love dearly @feeling
感受 gǎn shòu n4 feeling, experience; feel @feeling
冷淡 lěng dàn adj4 cold, indifferent - @feeling
郁闷 yù mèn adj4 down, frustrated - @feeling
沮丧 jǔ sàng adj4 dejected, low - @feeling
珍惜 zhēn xī v4 treasure, cherish + @feeling
怀念 huái niàn v4 miss, remember fondly @feeling
舍不得 shě bu de v4 hate to part with, can't bear to @feeling
心动 xīn dòng v4 be tempted; feel your heart beat faster @feeling
心烦 xīn fán adj4 upset, troubled - @feeling
内疚 nèi jiù adj4 guilty - @feeling
感慨 gǎn kǎi v4 be moved, sigh with feeling @feeling
欣慰 xīn wèi adj4 gratified, relieved + @feeling
痛快 tòng kuai adj4 delighted, to one's heart's content + @feeling
激情 jī qíng n4 passion, enthusiasm @feeling
热爱 rè ài v4 love (deeply) + @feeling
慌 huāng adj4 flustered, nervous - @feeling
慌张 huāng zhāng adj4 flustered, in a fluster - @feeling
忍受 rěn shòu v4 endure, put up with @feeling
感恩 gǎn ēn v4 be thankful + @feeling
敬佩 jìng pèi v4 admire, respect + @feeling
失落 shī luò adj4 let down, feeling lost - @feeling
开朗 kāi lǎng adj4 cheerful, outgoing + @feeling
乐意 lè yì v4 be glad to, be willing to + @feeling
烦躁 fán zào adj4 irritable, restless - @feeling
`);
  W.push(`
// ---- travel, culture and the arts
航班 háng bān n3 flight #个 @travel
登机 dēng jī v4 board (a plane) @travel
降落 jiàng luò v3 land (a plane) @travel
目的地 mù dì dì n4 destination #个 @travel
名胜古迹 míng shèng gǔ jì phrase4 famous sights and historic places @travel
展览 zhǎn lǎn n4 exhibition #个,场 @art
歌剧 gē jù n4 opera #部,场 @music,art
戏剧 xì jù n4 drama, theater #部,场 @art
舞蹈 wǔ dǎo n4 dance #个,段 @art,music
摄影 shè yǐng v4 take photographs; photography @art,hobby
诗人 shī rén n4 poet #个,位 @art,people
风俗 fēng sú n4 custom, folkways #个,种
特色 tè sè n4 special feature, specialty; distinctive
当地 dāng dì n3 local; the place itself @place
外地 wài dì n4 other parts of the country, out of town @place
国外 guó wài n3 abroad @place,travel
出国 chū guó v3 go abroad @travel
住宿 zhù sù n4 accommodation, lodging @travel
导航 dǎo háng v4 navigate; navigation (on a phone) @tech,travel
景色 jǐng sè n3 scenery, view @nature,travel
古老 gǔ lǎo adj4 ancient, age-old
艺术家 yì shù jiā n4 artist #个,位 @art,people
风格 fēng gé n4 style #种
创作 chuàng zuò v4 create (a work of art); creation @art
导演 dǎo yǎn n4 (film) director #个,位 @art,people
门票 mén piào n3 admission ticket #张 @travel
观光 guān guāng v4 go sightseeing @travel
度假 dù jià v4 go on holiday @travel
背包 bèi bāo n3 backpack #个 @travel,clothes
攻略 gōng lüè n4 (travel) guide, tips #个,份 @travel
古镇 gǔ zhèn n4 old town #个,座 @travel,town
节奏 jié zòu n4 rhythm, pace @music
乐队 yuè duì n4 band (of musicians) #个,支 @music
剧本 jù běn n4 script, play #个,部 @art,story
角色 jué sè n4 role, character #个 @art,story
主角 zhǔ jué n4 lead role, main character #个,位 @art,story
情节 qíng jié n4 plot #个 @story
结局 jié jú n4 ending, outcome #个 @story
名著 míng zhù n4 classic (book) #部,本 @story
油画 yóu huà n4 oil painting #幅,张 @art
手工 shǒu gōng n4 handmade; handicraft @art,hobby
陶瓷 táo cí n4 pottery, ceramics @art
古代 gǔ dài n3 ancient times @time
当代 dāng dài n4 present-day, contemporary @time
朝代 cháo dài n4 dynasty #个 @time
皇帝 huáng dì n4 emperor #个,位 @people
遗产 yí chǎn n4 heritage; inheritance #份,个
神话 shén huà n4 myth #个 @story
故宫 Gù gōng name3 the Forbidden City @place
// ---- money and shopping
优惠 yōu huì adj3 discounted, a good deal + @shop,money
现金 xiàn jīn n3 cash @money
银行卡 yín háng kǎ n3 bank card #张 @money
存款 cún kuǎn n4 savings, deposit #笔 @money
取钱 qǔ qián v3 take out money @money
汇款 huì kuǎn v4 send money, transfer @money
贷款 dài kuǎn n4 loan #笔 @money
利息 lì xī n4 interest (on money) @money
账单 zhàng dān n4 bill #张,份 @money
收据 shōu jù n4 receipt #张 @money,shop
发票 fā piào n4 receipt, invoice #张 @money,shop
退货 tuì huò v4 return (goods) @shop
品牌 pǐn pái n4 brand #个 @shop
商品 shāng pǐn n4 goods, product #件,个,种 @shop
产品 chǎn pǐn n4 product #个,种,件 @shop,work
消费 xiāo fèi v4 spend, consume; spending @money
省钱 shěng qián v3 save money @money
存钱 cún qián v3 save money (in the bank) @money
预算 yù suàn n4 budget #个,笔 @money
投资 tóu zī v4 invest; investment @money
股票 gǔ piào n4 stock, share #支 @money
赚钱 zhuàn qián v3 earn money, make money @money,work
欠 qiàn v4 owe @money
费用 fèi yòng n4 cost, expenses #笔 @money
收费 shōu fèi v4 charge (a fee) @money
纸币 zhǐ bì n4 banknote #张 @money
送货 sòng huò v4 deliver (goods) @shop
收银台 shōu yín tái n4 checkout, cash desk #个 @shop
砍价 kǎn jià v4 haggle, bargain @shop
讲价 jiǎng jià v4 bargain (over the price) @shop
划算 huá suàn adj4 worth it, a good deal + @shop,money
富裕 fù yù adj4 well-off, prosperous + @money
税 shuì n4 tax @money
成本 chéng běn n4 cost (of making something) @money,work
利润 lì rùn n4 profit @money,work
网店 wǎng diàn n4 online shop #家,个 @shop,tech
供应 gōng yìng v4 supply
需求 xū qiú n4 demand, need #个,种
涨价 zhǎng jià v4 go up in price @shop,money
降价 jiàng jià v4 go down in price, cut prices @shop,money
物价 wù jià n4 prices (of things in general) @money
财富 cái fù n4 wealth, riches #笔 @money
金钱 jīn qián n4 money (as a thing in life) @money
找钱 zhǎo qián v4 give change @shop,money
账户 zhàng hù n4 (bank) account #个 @money
余额 yú é n4 balance (of an account) @money
转账 zhuǎn zhàng v4 transfer (money) @money
支付 zhī fù v4 pay @money
手续费 shǒu xù fèi n4 service charge, fee #笔 @money
优惠券 yōu huì quàn n4 coupon #张 @shop
会员卡 huì yuán kǎ n4 membership card #张 @shop
积分 jī fēn n4 (reward) points @shop
售货员 shòu huò yuán n3 shop assistant #个,位,名 @shop,people
营业 yíng yè v4 do business, be open @shop
开张 kāi zhāng v4 open for business (a new shop) @shop
营业时间 yíng yè shí jiān n4 opening hours @shop,time
打烊 dǎ yàng v4 close for the night (a shop) @shop
// ---- housing and city life
住房 zhù fáng n4 housing #套 @home
出租 chū zū v4 rent out; for rent @home
装修 zhuāng xiū v4 renovate, do up @home
电器 diàn qì n4 electrical appliance #件,台 @home,tech
小区 xiǎo qū n4 housing estate, residential compound #个 @home,town
市中心 shì zhōng xīn n3 city center @town
停车 tíng chē v3 park (a car) @transport,town
停车场 tíng chē chǎng n3 car park, parking lot #个 @transport,town
人行道 rén xíng dào n4 pavement, sidewalk #条 @town
建筑 jiàn zhù n4 building, architecture #座,个 @town
高楼 gāo lóu n4 tall building #座 @town
大楼 dà lóu n3 (big) building #座 @town
拥挤 yōng jǐ adj4 crowded - @town
水电费 shuǐ diàn fèi n4 water and electricity bills #笔 @home,money
房价 fáng jià n4 house prices @home,money
胡同 hú tòng n4 hutong, alley #条 @town
小巷 xiǎo xiàng n4 lane, alley #条 @town
十字路口 shí zì lù kǒu n3 crossroads #个 @town
地板 dì bǎn n4 floor #块 @home
天花板 tiān huā bǎn n4 ceiling @home
门铃 mén líng n4 doorbell #个 @home
衣柜 yī guì n3 wardrobe #个 @home
窗帘 chuāng lián n3 curtain #个 @home
床单 chuáng dān n3 (bed) sheet #条,张 @home
牙刷 yá shuā n3 toothbrush #把,支 @home
吸尘器 xī chén qì n4 vacuum cleaner #台,个 @home
微波炉 wēi bō lú n4 microwave #台,个 @home,food
自来水 zì lái shuǐ n4 tap water @home
居住 jū zhù v4 live, reside @home
日常 rì cháng adj4 everyday, daily %ng
租金 zū jīn n4 rent (money) #笔 @home,money
合租 hé zū v4 share a flat (and the rent) @home
室友 shì yǒu n3 roommate, flatmate #个,位 @home,people
`);
  W.push(`
// ---- the club books' words (A1's «read» lines in words_needed.txt)
寓言 yù yán n4 fable #个 @story
望 wàng v4 look into the distance; hope
拍 pāi v4 pat, slap; take (a photo), film
大腿 dà tuǐ n4 thigh @body
爸 bà n2 dad @family,people
雪白 xuě bái adj4 snow-white %ng @color
瘸 qué adj4 lame, limping
拄 zhǔ v4 lean on (a stick)
用来 yòng lái v4 be used for
父子 fù zǐ n4 father and son @family
人家 rén jiā n4 household, family @people
钻 zuān v4 squeeze into, burrow; drill
争 zhēng v4 argue over, quarrel; compete for
快门 kuài mén n4 shutter (of a camera) @tech
喷嚏 pēn tì n4 sneeze («打喷嚏») @body,health
打喷嚏 dǎ pēn tì v4 sneeze @health
单独 dān dú adv4 alone, on one's own
年底 nián dǐ n4 the end of the year @time
怪 guài v3 blame; strange, odd
本事 běn shi n4 skill, ability
练 liàn v3 practice, train
练功 liàn gōng v4 practice martial arts @sport
悄悄 qiāo qiāo adv4 quietly, secretly
犯 fàn v4 commit, make (a mistake: 犯错)
犯错 fàn cuò v4 make a mistake
靠 kào v4 rely on, live on; lean against
盆 pén n4 basin, (flower) pot #个 @home
盆#cl pén cl4 a pot of, a basin of %part
歪歪扭扭 wāi wāi niǔ niǔ adj4 crooked, wobbly %ng
网上 wǎng shàng n4 online, on the internet @tech
勺 sháo n4 spoon #把 @home
勺#cl sháo cl4 a spoonful of %part
捏 niē v4 pinch
称 chēng v4 weigh; call (称为)
飘 piāo v4 drift, float, waft
在意 zài yì v4 mind, care about
一半 yī bàn n3 half
细 xì adj3 thin, fine
一模一样 yī mú yī yàng phrase4 exactly alike
方便面 fāng biàn miàn n3 instant noodles #包,碗 @food
灵魂 líng hún n4 soul #个
板凳 bǎn dèng n4 stool, bench #条,个 @home
`);
  W.push(`
// ---- the radio kit's, the detective serial's and the paper's words (A1's «read: kit / serial / paper zh» lines)
木匠 mù jiang n4 carpenter #个,位 @people,work
木工房 mù gōng fáng n4 woodworking shop #个,间,家 @place,work
捡 jiǎn v4 pick up
阅览室 yuè lǎn shì n4 reading room #个,间 @place,school
灭 miè v4 go out (a light, a fire); put out
集市 jí shì n4 market, fair #个 @place,shop
换物 huàn wù v4 swap things (换物集市: a swap market)
音 yīn n4 sound; (musical) note #个 @music
约 yuē v3 arrange to meet; ask out
电费 diàn fèi n4 electricity bill @money,home
人手 rén shǒu n4 staff, hands (人手不够: short-handed) @work
坚强 jiān qiáng adj4 strong (in spirit), tough +
围 wéi v4 surround, gather around
庙会 miào huì n4 temple fair #个,场 @place
摩天轮 mó tiān lún n4 Ferris wheel #个,座
灯谜 dēng mí n4 lantern riddle #个,条
糖葫芦 táng hú lu n4 candied haws on a stick #串,根 @food
雪仗 xuě zhàng n4 snowball fight (打雪仗) #场 @sport
清理 qīng lǐ v4 clean up, clear out
意外 yì wài n3 accident; surprise; unexpected
金鱼 jīn yú n4 goldfish #条,只 @animal
旱冰鞋 hàn bīng xié n4 roller skates #双 @sport
鼓掌 gǔ zhǎng v4 clap, applaud
心平气和 xīn píng qì hé phrase4 calmly, keeping calm
橱窗 chú chuāng n4 shop window #个 @shop
明灯 míng dēng n4 bright lamp; a guiding light #盏
馒头 mán tou n3 steamed bun #个 @food
马戏团 mǎ xì tuán n4 circus #个
播音员 bō yīn yuán n4 announcer #个,位 @people,work
访谈 fǎng tán n4 interview #个,次
开通 kāi tōng v4 open (a line, a service)
知心 zhī xīn adj4 understanding, close (知心热线: an advice line) +
提议 tí yì n4 proposal; propose #个
珍贵 zhēn guì adj4 precious, valuable +
侄女 zhí nǚ n4 niece #个 @family,people
团结 tuán jié v4 unite; united +
思考 sī kǎo v4 think (deeply), think it through
广播剧 guǎng bō jù n4 radio drama #部,个
漏掉 lòu diào v4 miss, leave out
茉莉 mò lì n4 jasmine (茉莉花茶: jasmine tea) #朵 @nature
鱼鳞 yú lín n4 fish scales #片
针法 zhēn fǎ n4 stitch (knitting) #种
编织 biān zhī v4 knit, weave
平针 píng zhēn n4 plain stitch
活动室 huó dòng shì n4 community room, activity room #个,间 @place
樟脑丸 zhāng nǎo wán n4 mothball #颗,个
缝纫机 féng rèn jī n4 sewing machine #台 @home
棉袄 mián ǎo n4 padded jacket #件 @clothes
整齐 zhěng qí adj3 neat, tidy, even +
脑袋 nǎo dai n4 head @body
老伴 lǎo bàn n4 spouse (of an old couple) #个 @family,people
泡 pào v4 brew (tea), soak
凶 xiōng adj4 fierce -
淡 dàn adj4 faint, light, weak (tea, a color)
闭 bì v4 close (the eyes, the mouth)
戳 chuō v4 poke
灵 líng adj4 sharp (a nose), clever; working (a remedy)
墨 mò n4 ink (墨汁) #瓶,块 @art
春联 chūn lián n4 New Year couplets #副,对 @story
毛笔字 máo bǐ zì n4 brush calligraphy #个 @art
发抖 fā dǒu v4 shiver, tremble
撞 zhuàng v4 hit, crash into, bump into
缺 quē v4 lack, be short of
窝 wō n4 nest, kennel, den #个 @animal,home
搭 dā v4 put up, build; take (a bus, a boat)
案子 àn zi n4 case (a crime, a mystery) #个,件
狗粮 gǒu liáng n4 dog food @animal,food
怀里 huái lǐ n4 in your arms (抱在怀里)
专栏 zhuān lán n4 column (in a newspaper) #个
版 bǎn n4 edition, page (of a paper) #个
登 dēng v4 climb; print, publish (in a paper)
失主 shī zhǔ n4 owner (of a lost thing) #个,位 @people
失物 shī wù n4 lost property #件
领取 lǐng qǔ v4 collect, claim
奖品 jiǎng pǐn n4 prize #个,份
亲手 qīn shǒu adv4 by hand, personally
蚊子 wén zi n3 mosquito #只 @animal
同志 tóng zhì n4 comrade (编辑同志们: dear editors) #个,位 @people
跤 jiāo n4 a fall (摔了一跤) #-
窍门 qiào mén n4 trick, knack, tip #个
蒸 zhēng v4 steam
出售 chū shòu v4 sell; for sale
车筐 chē kuāng n4 bike basket #个
报酬 bào chou n4 pay, reward #份,笔 @money
蜈蚣 wú gōng n4 centipede #条,只 @animal
竹竿 zhú gān n4 bamboo pole #根
灯罩 dēng zhào n4 lampshade #个 @home
厨艺 chú yì n4 cooking skills @food
学员 xué yuán n4 student (of a course), trainee #个,名,位 @people,school
拆 chāi v4 pull down, take apart; open (a letter)
展开 zhǎn kāi v4 launch, unfold, open up
记忆 jì yì n3 memory #段,个
发言 fā yán v4 speak (at a meeting); a speech
钉 dìng v4 nail (something)
发愁 fā chóu v4 worry
粘 zhān v4 stick, glue
撒 sǎ v4 sprinkle, scatter
葱 cōng n3 scallion, spring onion #根 @food
葱花 cōng huā n4 chopped spring onion @food
合唱团 hé chàng tuán n4 choir #个 @music
团员 tuán yuán n4 member (of a group) #个,名,位 @people
礼堂 lǐ táng n4 assembly hall, auditorium #个,座 @place,school
谱 pǔ n4 sheet music, score #张,本 @music
两全其美 liǎng quán qí měi phrase4 the best of both worlds, satisfying both sides
巴士 bā shì n4 bus #辆 @transport
采纳 cǎi nà v4 adopt (an idea), accept
欢呼 huān hū v4 cheer
盼 pàn v4 look forward to, hope for
运货 yùn huò v4 carry goods, deliver
实话 shí huà n4 the truth (说实话: to tell the truth)
唐诗 Táng shī n4 Tang poetry #首 @story
车库 chē kù n4 garage #个,间 @home,transport
贝斯 bèi sī n4 bass (guitar) #把 @music
// (and the words the measure-word checks tripped on: 大叔 read as 大书, 镇长 as 镇 + 长, 薄薄 as 宝宝, 那一刻 as 那一课)
大叔 dà shū n3 uncle, (a middle-aged) man #个,位 @people
镇长 zhèn zhǎng n4 town mayor #个,位 @people,town
薄薄 báo báo adj4 very thin, paper-thin %ng
那一刻 nà yī kè phrase4 that moment
演 yǎn v3 act, perform, put on (a show)
划 huá v3 row (a boat), paddle
场#ch cháng cl4 (a spell of: rain, snow, an illness) %part
柳 liǔ n4 willow; Liu (a surname) #棵 @nature
敲门 qiāo mén v3 knock (at the door)
扑 pū v4 pounce, throw yourself at
设 shè v4 set up (a trap), establish
陷阱 xiàn jǐng n4 trap #个
面具 miàn jù n4 mask #个,张
石磨 shí mò n4 millstone #个,盘 @home
镇子 zhèn zi n4 (small) town #个,座 @town
阵子 zhèn zi n3 a while, a period of time %ncl @time
一阵子 yī zhèn zi n4 a while (过一阵子: after a while) %ncl @time
仨 sā num4 three (casual: 我们仨, the three of us)
铺 pù n4 shop (铁匠铺: a smithy); bunk (上下铺: bunk beds) #个,家
该 gāi v3 should; be (someone's) turn (该你了)
嗓门 sǎng mén n4 voice (大嗓门: a loud voice)
呱 guā int4 croak (a frog)
人们 rén men n2 people (in general) %ncl @people
// (Chapter 5's first lines: the city and the casual words of the register lessons)
正午城 Zhèng wǔ chéng name3 Meridiana (the city of Chapter 5) @place
正午 zhèng wǔ n4 noon @time %tn
哥们 gē men n4 buddy, mate (casual) #个 @people
咱 zán pron4 we, us (casual: you and I) %p1,pl
呗 bei part4 (casual: that's just how it is) %sfp
哈 hā int3 ha (a laugh); hey
不好意思 bù hǎo yì si phrase2 sorry, excuse me; embarrassed
// (words the game's lines use that pinyin read as other words with the wrong tone: 去不了 as 去不聊, 盖的 as 改的, 两倍 as 两杯)
了#liao liǎo v3 (after 得 / 不: manage to; can't: 去不了, 受不了)
盖 gài v4 build (a house); cover
样 yàng cl3 kind, sort (两样东西: two things) %part
挡 dǎng v4 block, keep out
圈 quān cl4 a lap, a round, a ring (跑三圈, 一圈又一圈) %part
散 sàn v4 break up, scatter, clear (the fog)
呼 hū v4 breathe out; call out (呼呼: whoosh, snore)
缝 féng v4 sew
屋 wū n3 room, house (进屋) #间
永 yǒng adv4 forever (the character 永)
通 tōng v3 go through, be open (路通了)
叮 dīng int4 ding (a bell)
荡 dàng v4 swing, sway
运 yùn v3 carry, transport
超 chāo adv4 super (超喜欢)
派 pài v4 send (派来)
随时 suí shí adv3 at any time
埋 mái v4 bury
大雪 dà xuě n4 heavy snow @weather
愿 yuàn n4 wish (许个愿) #个
剪纸 jiǎn zhǐ n4 paper cutting @art
归 guī v4 belong to (归…管)
区 qū n4 area, district, zone #个 @place
静 jìng adj4 quiet, still
货 huò n4 goods, cargo
落 luò v4 fall, land (落在)
治 zhì v4 treat, cure
盯 dīng v4 stare at, keep an eye on
活 huó v3 live, be alive
填空 tián kòng v4 fill in the blanks
嗨 hāi int3 hi; hey
呜 wū int4 boo-hoo; whoo
叼 diāo v4 hold in the mouth
配 pèi v4 match; deserve (配得上)
烂 làn adj4 rotten; terrible
马步 mǎ bù n4 horse stance (蹲马步)
气 qì n3 breath, air; anger (喘口气) %ncl
赶集 gǎn jí v4 go to the market (on fair day)
晃 huàng v4 sway, shake
攒 zǎn v4 save up (money)
零花钱 líng huā qián n4 pocket money @money
婶 shěn n4 aunt (秀兰婶) @family,people
姐 jiě n3 older sister; (after a name) sister @family,people
清 qīng adj4 clear (分不清: can't tell apart)
沉 chén v4 sink
旁 páng n4 side, beside
身上 shēn shang n3 on you, on your body
柏树 bǎi shù n4 cypress #棵 @nature
朗读 lǎng dú v4 read aloud
朗读会 lǎng dú huì n4 reading (an event where people read aloud) #场,个
`);
  // @@ (more word chunks go above this line)
})();
