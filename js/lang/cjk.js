'use strict';
// Chinese and Japanese (DESIGN.md 13.5, game/CJK.md): the text engine behind zh and ja. One global, CJK, loaded right
// after lexicon.js. It follows the save's language (LEX.lang) and mode (G.state.script, once main.js calls CJK.bind(game)).
//   The notation:  zh  [你好|nǐ hǎo] ， [我|wǒ] [是|shì] [罗莎|Luó shā] 。      ja  [猫|ねこ] が [好|す]き です 。
//   isCJK(l) · lang() · mode() 'roman' | 'chars' · setMode(m) · bind(game) · onChange(fn)
//   parse(src) → tokens { s, r, kind: 'han' | 'kana' | 'punct' | 'latin' | 'slot' } · split(src) → raw token strings
//   html(src, o) <ruby> HTML for the mode. o: { lang, mode, n (typewriter budget), ruby: true | 'always' | false, cap, expose }
//   plain(src) the mode's plain text · roman(src) pinyin / rōmaji · chars(src) characters (speech) · len(src) for html's n
//   canon(text, l) the key typed answers are compared by · same(a, b) · similar(a, b) 0..1 · contains(text, src)
//   typed(text) → units · wordOf(src) · matchAt(word, units, i): character- and tone-aware matching (shop.js, LEX.heard)
//   addSource(x) feeds the dictionary (strings, arrays, objects with zh / ja fields) · candidates(raw) (the IME's list)
//   seen(src) · used(typed, expected) · known(ch) · learn(chars) (the script school) · mastery(ch) · stats() · THRESH
//   validate(src) → [problems] · validateAll() · attachIME(input) · font(l) · say(src) · pick(T, l, fb) · text(T, l, fb)
// The character gimmick (chars mode): a character's reading shows as ruby until it's known. Known = read in THRESH lines
// and typed or picked right THRESH times (Han: 6 lines and 3 times; kana: 4 and 2), or learned at the script school.

const CJK = (() => {
  const isCJK = l => l === 'zh' || l === 'ja';
  let G = null, testMode = null;
  const listeners = [];
  const lang = () => (typeof LEX !== 'undefined' && LEX.lang) || (typeof UI !== 'undefined' && UI.lang) || 'es';
  function mode(l) {
    if (!isCJK(l || lang())) return 'roman';
    const m = testMode || (G && G.state && G.state.script);
    return m === 'chars' ? 'chars' : 'roman';
  }
  function setMode(m) {
    m = m === 'chars' ? 'chars' : 'roman';
    if (G && G.state) { G.state.script = m; testMode = null; } else testMode = m;
    for (const f of listeners) { try { f(m); } catch (e) { console.error('[cjk]', e); } }
  }
  const bind = game => { G = game; };
  const onChange = fn => { listeners.push(fn); };

  // ---------------------------------------------------------------- characters
  const isHan = c => /[㐀-䶿一-鿿豈-﫿々-〇]/.test(c);
  const isKana = c => (c >= 'ぁ' && c <= 'ゟ') || (c >= 'ァ' && c <= 'ヿ' && c !== '・') || (c >= 'ㇰ' && c <= 'ㇿ');
  const isPunct = c => !isHan(c) && ((c >= '　' && c <= '〿') || (c >= '！' && c <= '／') || (c >= '：' && c <= '＠')
    || (c >= '［' && c <= '｀') || (c >= '｛' && c <= '･') || '“”‘’…—–·・▬'.includes(c));
  const hasCJK = s => /[　-ヿ㐀-䶿一-鿿＀-￯]|\[[^\]|]*\|/.test(String(s == null ? '' : s));
  const toHira = s => String(s).replace(/[ァ-ヶヽヾ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const toKata = s => String(s).replace(/[ぁ-ゖゝゞ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
  const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------------------------------------------------------------- kana ↔ rōmaji (Hepburn out; Hepburn and wāpuro in)
  // MORA: a mora (1–2 hiragana) → Hepburn, built from the gojūon rows, then the exceptions, the yōon and the extended kana.
  const MORA = new Map(), V5 = 'aiueo';
  [['', 'あいうえお'], ['k', 'かきくけこ'], ['g', 'がぎぐげご'], ['s', 'さしすせそ'], ['z', 'ざじずぜぞ'], ['t', 'たちつてと'], ['d', 'だぢづでど'],
    ['n', 'なにぬねの'], ['h', 'はひふへほ'], ['b', 'ばびぶべぼ'], ['p', 'ぱぴぷぺぽ'], ['m', 'まみむめも'], ['r', 'らりるれろ'], ['', 'ぁぃぅぇぉ']]
    .forEach(([c, ks]) => [...ks].forEach((k, i) => MORA.set(k, c + V5[i])));
  'しshi ちchi つtsu ふfu じji ぢji づzu やya ゆyu よyo ゃya ゅyu ょyo わwa ゎwa ゐi ゑe をo んn ゔvu ゕka ゖke'.split(' ').forEach(p => MORA.set(p[0], p.slice(1)));
  [...'きぎしじちぢにひびぴみり'].forEach(k => {          // きゃ kya, しゃ sha, ちゃ cha, じゃ ja …
    const st = MORA.get(k).slice(0, -1), y = /^(sh|ch|j)$/.test(st) ? '' : 'y';
    [...'ゃゅょ'].forEach((s, i) => MORA.set(k + s, st + y + 'auo'[i]));
  });
  ('しぇshe じぇje ちぇche てぃti でぃdi てゅtyu でゅdyu とぅtu どぅdu ふぁfa ふぃfi ふぇfe ふぉfo ふゅfyu うぃwi うぇwe うぉwo ゔぁva ゔぃvi ゔぇve '
    + 'ゔぉvo つぁtsa つぃtsi つぇtse つぉtso いぇye くぁkwa ぐぁgwa').split(' ').forEach(p => MORA.set(p.slice(0, 2), p.slice(2)));
  // ROMA: what you type → kana. Wāpuro and learner spellings first (ti = ち, la = ら), then everything MORA knows.
  const ROMA = new Map(), addR = (r, k) => { if (!ROMA.has(r)) ROMA.set(r, k); };
  ('si=し ti=ち tu=つ hu=ふ zi=じ di=ぢ du=づ wo=を sya=しゃ syu=しゅ syo=しょ tya=ちゃ tyu=ちゅ tyo=ちょ cya=ちゃ cyu=ちゅ cyo=ちょ zya=じゃ zyu=じゅ '
    + 'zyo=じょ jya=じゃ jyu=じゅ jyo=じょ dya=ぢゃ dyu=ぢゅ dyo=ぢょ thi=てぃ dhi=でぃ thu=てゅ dhu=でゅ twu=とぅ dwu=どぅ la=ら li=り lu=る le=れ lo=ろ '
    + 'lya=りゃ lyu=りゅ lyo=りょ xa=ぁ xi=ぃ xu=ぅ xe=ぇ xo=ぉ xya=ゃ xyu=ゅ xyo=ょ xtu=っ xtsu=っ ltu=っ ltsu=っ xwa=ゎ xn=ん ca=か cu=く co=こ ci=し '
    + 'ce=せ qa=くぁ qi=くぃ qe=くぇ qo=くぉ').split(' ').forEach(p => { const [r, k] = p.split('='); addR(r, k); });
  for (const [k, r] of MORA) if (!/^[ぁぃぅぇぉゃゅょゎゐゑをぢづゕゖん]/.test(k)) addR(r, k);

  // Latin → hiragana. o.final: a last lone n is ん (while typing it might still become な). Long vowels may come as
  // macrons (ō) or oh; nn and n' are ん, a doubled consonant is っ, m before b / p / m is ん.
  function toKana(s, o = {}) {
    s = String(s).toLowerCase().normalize('NFC').replace(/[āâ]/g, 'aa').replace(/[īî]/g, 'ii').replace(/[ūû]/g, 'uu').replace(/[ēê]/g, 'ee')
      .replace(/[ōô]/g, 'ou').replace(/oh(?=[^aiueoy]|$)/g, 'ou');
    let out = '';
    for (let i = 0; i < s.length;) {
      const c = s[i], c1 = s[i + 1] || '', c2 = s[i + 2] || '';
      if (c === "'") { i++; continue; }
      if (c === '-') { out += 'ー'; i++; continue; }
      if (c === 'n' && !/[aiueoy]/.test(c1)) {
        if (c1 === "'") { out += 'ん'; i += 2; continue; }
        if (c1 === 'n') { out += 'ん'; i += /[aiueoy]/.test(c2) ? 1 : 2; continue; }     // (Hepburn's "konnichiwa": the 2nd n starts に)
        if (!c1 && !o.final) { out += 'n'; i++; continue; }
        out += 'ん'; i++; continue;
      }
      if (c === 'm' && /[bpm]/.test(c1)) { out += 'ん'; i++; continue; }
      if ((c === c1 && /[bcdfghjkpqrstvwxyz]/.test(c)) || (c === 't' && c1 === 'c' && c2 === 'h')) { out += 'っ'; i++; continue; }
      let k = 4;
      while (k > 0 && !ROMA.has(s.substr(i, k))) k--;
      if (k) { out += ROMA.get(s.substr(i, k)); i += k; } else { out += c; i++; }
    }
    return out;
  }
  // kana → Hepburn: macrons for long vowels (not across o.bounds, where a word's parts meet: 思う omou), っ doubles the next
  // consonant, ん before a vowel or y is n'. o.flat (for canon): no macrons, ー dropped, no apostrophes.
  const MAC = { a: 'ā', i: 'ī', u: 'ū', e: 'ē', o: 'ō' };
  const longer = s => (MAC[s.slice(-1)] ? s.slice(0, -1) + MAC[s.slice(-1)] : s);
  function romaji(kana, o = {}) {
    const s = toHira(kana), B = o.bounds;
    let out = '', dbl = false;
    for (let i = 0; i < s.length;) {
      const ch = s[i];
      if (ch === 'っ') { dbl = true; i++; continue; }
      if (ch === 'ー') { if (!o.flat) out = longer(out); i++; continue; }
      const two = s.substr(i, 2);
      let len = 2, r = two.length === 2 ? MORA.get(two) : null;
      if (!r) { len = 1; r = MORA.get(ch); }
      if (!r) { out += ch; dbl = false; i++; continue; }
      const last = out.slice(-1);
      if (!o.flat && len === 1 && !(B && B.has(i)) && ((ch === 'う' && (last === 'o' || last === 'u')) || (ch === 'お' && last === 'o')
        || (ch === 'あ' && last === 'a') || (ch === 'え' && last === 'e'))) { out = longer(out); i++; continue; }
      if (ch === 'ん' && !o.flat) { const nx = MORA.get(s.substr(i + 1, 2)) || MORA.get(s[i + 1] || ''); if (nx && /^[aiueoy]/.test(nx)) r = "n'"; }
      if (dbl) { r = (r.startsWith('ch') ? 't' : r[0]) + r; dbl = false; }
      out += r; i += len;
    }
    return out;
  }

  // ---------------------------------------------------------------- pinyin
  // every toneless syllable (ü is written u here: lü = lu, nüe = nue), as the finals each initial takes
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
  const SYL_X = new Set(['m', 'n', 'ng', 'hm', 'hng', 'r', 'e']);     // (interjections and erhua's r: fine in the notation, never guessed)
  const toneless = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/v/g, 'u').replace(/[^a-z]/g, '');
  const TONES = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ' };
  // nǐ from ni + 3: the mark goes on a or e, on the o of ou, else on the last vowel (v and u: are ü)
  function markTone(syl, t) {
    const s = String(syl).replace(/v|u:/g, 'ü').replace(/V|U:/g, 'Ü');
    if (!(t >= 1 && t <= 4)) return s;
    const low = s.toLowerCase();
    let k = low.search(/[ae]/);
    if (k < 0) k = low.indexOf('ou');
    if (k < 0) for (let j = low.length - 1; j >= 0; j--) if ('iouü'.includes(low[j])) { k = j; break; }
    if (k < 0) return s;
    const m = TONES[low[k]][t - 1];
    return s.slice(0, k) + (s[k] === low[k] ? m : m.toUpperCase()) + s.slice(k + 1);
  }
  const toneOf = syl => { const d = String(syl).normalize('NFD'); return /\u0304/.test(d) ? 1 : /\u0301/.test(d) ? 2 : /\u030c/.test(d) ? 3 : /\u0300/.test(d) ? 4 : 0; };
  // a word's syllables joined, with an apostrophe before a, o or e inside it: Xī'ān, Mǎ'ěrtǎ
  const pyJoin = syls => syls.map((s, k) => (k && /^[aoeāáǎàōóǒòēéěè]/i.test(s) ? "'" + s : s)).join('');
  // toneless letters → syllables (the fewest pieces; an apostrophe forces a break; a stray letter stays on its own)
  function segment(s) {
    const out = [];
    for (const p of String(s).toLowerCase().split("'")) {
      const n = p.length, best = new Array(n + 1).fill(Infinity), prev = new Array(n + 1).fill(-1);
      best[0] = 0;
      for (let i = 0; i < n; i++) {
        if (best[i] === Infinity) continue;
        for (let k = 1; k <= 6 && i + k <= n; k++) {
          const c = best[i] + (SYL.has(p.slice(i, i + k)) ? 1 : k === 1 ? 10 : Infinity);
          if (c <= best[i + k]) { best[i + k] = c; prev[i + k] = i; }        // (a tie goes to the longer first syllable: ping an)
        }
      }
      const seq = [];
      for (let j = n; j > 0; j = prev[j]) seq.unshift(p.slice(prev[j], j));
      out.push(...seq);
    }
    return out;
  }

  // ---------------------------------------------------------------- the notation
  const PUNCT_ASCII = { '，': ',', '、': ',', '。': '.', '．': '.', '！': '!', '？': '?', '：': ':', '；': ';', '（': '(', '）': ')', '「': '"', '」': '"',
    '『': '"', '』': '"', '“': '"', '”': '"', '‘': "'", '’': "'", '《': '"', '》': '"', '〈': '"', '〉': '"', '【': '[', '】': ']', '〔': '(', '〕': ')',
    '～': '~', '〜': '~', '・': ' ', '\u3000': ' ' };
  const OPENERS = '（「『“‘《〈【〔';
  const asciiPunct = s => [...s].map(c => (PUNCT_ASCII[c] !== undefined ? PUNCT_ASCII[c] : c)).join('').replace(/…+/g, '…').replace(/—+/g, '—');
  const guess = s => (/[\u3040-\u30ff]/.test(s) ? 'ja' : /\[[^\]|]+\|[^\]]*[a-zA-Zü]/.test(s) ? 'zh' : null);
  const P_CACHE = new Map();
  // Tokens: { kind, s (surface), sp (a space before it), segs: [{ s, r, han }] (words), r (the reading: zh syllables with
  // spaces, ja hiragana), part ('wa' | 'e' | 'o' for the particles は へ を), slot + v ({w.key:pl}) }. A word is a bracket
  // group glued to its kana: [好|す]き, お[茶|ちゃ], [日本|にほん][語|ご]. Cached: don't change what it returns.
  function parse(src, l) {
    src = String(src == null ? '' : src);
    const key = (l || '') + '\u0001' + src, hit = P_CACHE.get(key);
    if (hit) return hit;
    const raw = [];
    let i = 0, sp = true;
    const push = t => { t.sp = sp; sp = false; raw.push(t); };
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { sp = true; i++; continue; }
      if (c === '[') {
        const j = src.indexOf(']', i + 1), bar = src.indexOf('|', i + 1);
        if (j > 0 && bar > i && bar < j) {
          const s = src.slice(i + 1, bar).trim(), r = src.slice(bar + 1, j).trim().replace(/\s+/g, ' ');
          push({ kind: 'han', s, segs: [{ s, r, han: true }] }); i = j + 1; continue;
        }
      }
      if (c === '{') {
        const j = src.indexOf('}', i + 1), m = j > i ? src.slice(i + 1, j).match(/^([a-z]+(?:\.[a-z0-9_]+)?)(?::(pl|f))?$/i) : null;
        if (m) { push({ kind: 'slot', s: src.slice(i, j + 1), slot: m[1], v: m[2] || '' }); i = j + 1; continue; }
      }
      let j = i + 1;
      if (isKana(c)) { while (j < src.length && isKana(src[j])) j++; push({ kind: 'kana', s: src.slice(i, j), segs: [{ s: src.slice(i, j), r: null, han: false }] }); }
      else if (isHan(c)) { while (j < src.length && isHan(src[j])) j++; push({ kind: 'han', s: src.slice(i, j), segs: [{ s: src.slice(i, j), r: null, han: true }] }); }
      else if (isPunct(c)) { while ((c === '…' || c === '—') && src[j] === c) j++; push({ kind: 'punct', s: src.slice(i, j) }); }
      else {
        while (j < src.length && !/\s/.test(src[j]) && src[j] !== '[' && src[j] !== '{' && !isKana(src[j]) && !isHan(src[j]) && !isPunct(src[j])) j++;
        push({ kind: 'latin', s: src.slice(i, j) });
      }
      i = j;
    }
    const out = [], ja = (l || guess(src)) === 'ja';
    for (const t of raw) {                    // glue a word's pieces (no space between them) into one token
      const p = out[out.length - 1];
      if (p && !t.sp && t.segs && p.segs) { p.segs = p.segs.concat(t.segs); p.s += t.s; if (t.kind === 'han') p.kind = 'han'; continue; }
      out.push(Object.assign({}, t, t.segs ? { segs: t.segs.slice() } : {}));
    }
    for (const t of out) {
      if (!t.segs) continue;
      if (t.segs.every(g => g.r || !g.han)) t.r = ja ? t.segs.map(g => toHira(g.han ? g.r : g.s)).join('') : t.segs.filter(g => g.han).map(g => g.r).join(' ');
      if (t.kind === 'kana') t.part = { 'は': 'wa', 'へ': 'e', 'を': 'o' }[t.s] || '';
    }
    if (P_CACHE.size > 800) P_CACHE.clear();
    P_CACHE.set(key, out);
    return out;
  }
  // the raw tokens of a line (brackets kept whole), for code that works word by word (the hushed's blanked-out words)
  function split(src) {
    const out = [];
    let cur = '', depth = 0;
    for (const c of String(src == null ? '' : src)) {
      if (c === '[') depth++; else if (c === ']') depth = Math.max(0, depth - 1);
      if (/\s/.test(c) && !depth) { if (cur) out.push(cur); cur = ''; } else cur += c;
    }
    if (cur) out.push(cur);
    return out;
  }

  // ---------------------------------------------------------------- the dictionary
  // Built from every notation string the game registers: LEX's items (zh / ja, alt, pl, f), lines.js (LINES, SIGN), the
  // names in CJK.md, anything given to addSource, and every string html / plain render. It powers the IME's candidates,
  // characters typed in answers (canon) and readings for Han written without brackets.
  const D = { zh: { words: new Map(), keys: new Map(), chars: new Map(), en: new Map() }, ja: { words: new Map(), keys: new Map(), kana: new Map(), en: new Map() } };
  const added = new Set();
  const keyOf = (l, r) => (l === 'zh' ? toneless(r) : canonKana(toHira(r)));
  const indexAdd = (M, k, v) => { if (!k) return; let s = M.get(k); if (!s) M.set(k, s = new Set()); s.add(v); };
  function addWord(l, s, r) {
    if (!s || !r) return;
    if (r === r.toUpperCase() && r !== r.toLowerCase()) r = r.toLowerCase();       // (a sign's CAPITALS are just how it's painted)
    const W = D[l].words;
    let e = W.get(s);
    if (!e) W.set(s, e = { s, r, n: 0, rs: {} });
    e.n++; e.rs[r] = (e.rs[r] || 0) + 1;
    if (e.rs[r] > (e.rs[e.r] || 0)) e.r = r;
    indexAdd(D[l].keys, keyOf(l, r), s);
    if (l === 'ja') indexAdd(D.ja.kana, toHira(r), s);
  }
  function addChar(ch, syl) { const C = D.zh.chars; let e = C.get(ch); if (!e) C.set(ch, e = {}); e[syl] = (e[syl] || 0) + 1; }
  const topReading = ch => { const e = D.zh.chars.get(ch); let b = '', n = 0; if (e) for (const k in e) if (e[k] > n) { n = e[k]; b = k; } return b; };
  function addStr(src, l) {
    src = String(src);
    if (!hasCJK(src) || added.has(l + src)) return;
    added.add(l + src);
    for (const t of parse(src, l)) {
      if (!t.segs) continue;
      if (l === 'zh') {
        for (const g of t.segs) {
          if (!g.han || !g.r) continue;
          const ch = [...g.s], sy = g.r.split(' ');
          addWord('zh', g.s, g.r);
          if (ch.length === sy.length) ch.forEach((c, k) => { addChar(c, sy[k]); if (ch.length > 1) addWord('zh', c, sy[k]); });
        }
        if (t.segs.length > 1 && t.r) addWord('zh', t.s, t.r);
      } else {
        for (const g of t.segs) if (g.han && g.r) addWord('ja', g.s, toHira(g.r));
        if (t.r && t.kind === 'han' && t.segs.length > 1) addWord('ja', t.s, t.r);                // with its okurigana: 好き
        if (t.kind === 'kana' && /[ァ-ヺ]/.test(t.s)) addWord('ja', t.s, toHira(t.s));     // katakana words: ロサ
      }
    }
  }
  // strings, arrays, and objects (their zh / ja fields, any depth): CJK.addSource(LINES), CJK.addSource(MY_TABLE)
  function addSource(x, l, d = 0) {
    if (x == null || d > 6) return;
    if (typeof x === 'string') { const L = l || guess(x) || (isCJK(lang()) ? lang() : null); if (isCJK(L)) addStr(x, L); return; }
    if (Array.isArray(x)) { x.forEach(v => addSource(v, l, d + 1)); return; }
    if (typeof x === 'object') for (const k of Object.keys(x)) {
      if (k === 'zh' || k === 'ja') addSource(x[k], k, d + 1);
      else if (!/^(es|pt|de|en)$/.test(k) && x[k] && typeof x[k] === 'object') addSource(x[k], l, d + 1);
    }
  }
  const surface = (src, l) => parse(src, l).map(t => (t.kind === 'slot' ? '' : t.s)).join('');
  const NAMES = { zh: '[米莫|Mǐ mò] [罗莎|Luó shā] [布鲁诺|Bù lǔ nuò] [诺娅|Nuò yà] [玛尔塔|Mǎ ěr tǎ] [雨果|Yǔ guǒ] [西罗|Xī luó] [玛尔加|Mǎ ěr jiā] '
    + '[玛丽娜|Mǎ lì nà] [巴托洛|Bā tuō luò] [拉洛|Lā luò] [莫甘娜|Mò gān nà] [但丁|Dàn dīng] [坡坡|Pō po] [奥罗拉|Ào luó lā] [阿尔巴|Ā ěr bā] '
    + '[磨坊镇|Mò fáng zhèn] [静水村|Jìng shuǐ cūn] [镜湖|Jìng hú] [寂静|Jì jìng] [古塔|gǔ tǎ]',
    ja: 'ミモ ロサ ブルーノ ノア マルタ ウーゴ シロ マルガ マリーナ バルトロ ラロ モルガナ ダンテ ポー オーロラ アルバ モリナール レマンソ '
    + '[鏡湖|かがみこ] [静寂|せいじゃく] [古|ふる]い [塔|とう]' };
  let scanned = false, lexN = -1;
  function ensure() {
    if (!scanned) {
      scanned = true;
      addStr(NAMES.zh, 'zh'); addStr(NAMES.ja, 'ja');
      if (typeof LINES !== 'undefined') addSource(LINES);
      if (typeof SIGN !== 'undefined') addSource(SIGN);
    }
    if (typeof LEX === 'undefined' || !LEX.ids) return;
    const ids = LEX.ids();
    if (ids.length === lexN) return;
    lexN = ids.length;
    for (const id of ids) {
      const it = LEX.item(id);
      if (!it) continue;
      for (const l of ['zh', 'ja']) {
        if (!it[l]) continue;
        addSource([it[l], it.alt && it.alt[l], it.pl && it.pl[l], it.f && it.f[l]], l);
        if (it.en && typeof it[l] === 'string') D[l].en.set(surface(it[l], l), it.en);     // (the IME shows what a word means)
      }
    }
  }
  // ja numerals in kanji: a number followed by a counter or 番 is read the Sino-Japanese way (さん, ろく), with the sound
  // changes of the counter (六本 ろっぽん, 三本 さんぼん, 三階 さんがい, 四時 よじ), not by the native reading of the kanji
  // (三 み, 六 む) that the dictionary learned from 三つ / 六つ. A counter is [reading, kind, the readings it gives 4 / 7 / 9,
  // the reading after a 3 if different]; kind: 'p' h→p / b (本 杯 匹 分), 'k' っ before the k / s sound (回 個 冊 階), '' none.
  const JA_DIGIT = { 0: 'れい', 1: 'いち', 2: 'に', 3: 'さん', 4: 'よん', 5: 'ご', 6: 'ろく', 7: 'なな', 8: 'はち', 9: 'きゅう' };
  const JA_NUMC = { '〇': 0, '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '百': 100, '千': 1000, '万': 10000 };
  const JA_NATIVE = { 1: 'ひとつ', 2: 'ふたつ', 3: 'みっつ', 4: 'よっつ', 5: 'いつつ', 6: 'むっつ', 7: 'ななつ', 8: 'やっつ', 9: 'ここのつ' };
  const JA_DAYS = { 2: 'ふつか', 3: 'みっか', 4: 'よっか', 5: 'いつか', 6: 'むいか', 7: 'なのか', 8: 'ようか', 9: 'ここのか', 10: 'とおか', 14: 'じゅうよっか', 20: 'はつか', 24: 'にじゅうよっか' };
  const JA_TIME4 ={ 4: 'よ', 7: 'しち', 9: 'く' };
  const JA_CTR = {
    '本': ['ほん', 'p'], '杯': ['はい', 'p'], '匹': ['ひき', 'p'], '分': ['ふん', 'p'], '回': ['かい', 'k'], '個': ['こ', 'k'], '冊': ['さつ', 'k'],
    '課': ['か', 'k'], '歳': ['さい', 'k'], '頭': ['とう', 'k'], '週間': ['しゅうかん', 'k'], '階': ['かい', 'k', null, 'がい'], '軒': ['けん', 'k', null, 'げん'],
    '番線': ['ばんせん', ''], '番目': ['ばんめ', ''], '番': ['ばん', ''], '枚': ['まい', ''], '人': ['にん', '', { 4: 'よ' }], '台': ['だい', ''],
    '年': ['ねん', '', JA_TIME4], '時': ['じ', '', JA_TIME4], '月': ['がつ', '', { 4: 'し', 7: 'しち', 9: 'く' }], '円': ['えん', '', { 4: 'よ' }],
    '号': ['ごう', ''], '線': ['せん', ''], '度': ['ど', ''], '点': ['てん', ''], '倍': ['ばい', ''], '秒': ['びょう', ''], '目': ['め', ''],
  };
  const JA_P = { 'ほ': ['ぽ', 'ぼ'], 'は': ['ぱ', 'ば'], 'ひ': ['ぴ', 'び'], 'ふ': ['ぷ', 'ぶ'] };
  function jaNumVal(chs) {
    let total = 0, sec = 0, cur = 0;
    const pos = chs.length > 1 && chs.every(c => JA_NUMC[c] < 10);       // (二〇二四: place by place)
    for (const c of chs) {
      const d = JA_NUMC[c];
      if (pos) cur = cur * 10 + d;
      else if (d < 10) cur = cur * 10 + d;
      else if (d < 10000) { sec += (cur || 1) * d; cur = 0; }
      else { total += ((sec + cur) || 1) * d; sec = 0; cur = 0; }
    }
    return total + sec + cur;
  }
  // a number's kana; ctr = the counter after it ([reading, kind, …]) or null
  function jaNumKana(n, ctr) {
    if (n === 0) return JA_DIGIT[0];
    const o = n % 10, t = Math.floor(n / 10) % 10, h = Math.floor(n / 100) % 10, th = Math.floor(n / 1000) % 10, man = Math.floor(n / 10000);
    const kind = ctr ? ctr[1] : '', fun = !!ctr && ctr[0] === 'ふん';
    // does the last sound of the number take a っ before this counter? (1 6 8 10: いっぽん ろっぽん はっぽん じゅっぽん)
    const sok = !!ctr && !!kind && (o ? [1, 6, 8].includes(o) : t > 0);
    let s = '';
    if (man) s += (man === 1 ? 'いち' : jaNumKana(man, null)) + 'まん';
    if (th) s += th === 1 ? 'せん' : th === 3 ? 'さんぜん' : th === 8 ? 'はっせん' : JA_DIGIT[th] + 'せん';
    if (h) s += h === 1 ? 'ひゃく' : h === 3 ? 'さんびゃく' : h === 6 ? 'ろっぴゃく' : h === 8 ? 'はっぴゃく' : JA_DIGIT[h] + 'ひゃく';
    if (t) s += (t === 1 ? '' : JA_DIGIT[t]) + (!o && sok ? 'じゅっ' : 'じゅう');
    if (o) {
      const d = (ctr && ctr[2] && ctr[2][o]) || JA_DIGIT[o];
      s += sok && (o === 1 || o === 6 || o === 8) ? { 1: 'いっ', 6: 'ろっ', 8: 'はっ' }[o] : d;
    }
    if (!ctr) return s;
    let c = ctr[0];
    const voiced3 = o === 3 && !!kind;
    if (kind === 'p') {
      const f = c[0], row = JA_P[f];
      if (row && (sok || (fun && (o === 3 || o === 4)))) c = row[0] + c.slice(1);
      else if (row && o === 3 && !fun) c = row[1] + c.slice(1);
    } else if (voiced3 && ctr[3]) c = ctr[3];
    return s + c;
  }
  // at text[i] (ja): the reading of the numeral run that starts here, with a counter after it when there is one, or null
  // → { s, r, n }
  function jaNumberAt(ch, i) {
    let j = i;
    while (j < ch.length && JA_NUMC[ch[j]] !== undefined) j++;
    if (j === i) return null;
    const run = ch.slice(i, j), val = jaNumVal(run);
    if (run.length === 1 && val < 10 && ch[j] === 'つ' && JA_NATIVE[val]) return { s: run[0] + 'つ', r: JA_NATIVE[val], n: 2, ctr: true };
    if (ch[j] === '日' && val >= 2 && val <= 31) return { s: run.join('') + '日', r: JA_DAYS[val] || jaNumKana(val, null) + 'にち', n: run.length + 1, ctr: true };
    for (const len of [2, 1]) {
      const c = ch.slice(j, j + len).join(''), ctr = JA_CTR[c];
      if (!ctr || c.length !== len) continue;
      if (c === '人' && val > 0 && val <= 2) return null;                  // (ひとり, ふたり)
      return { s: run.join('') + c, r: jaNumKana(val, ctr), n: run.length + len, ctr: true };
    }
    return { s: run.join(''), r: jaNumKana(val, null), n: run.length };
  }
  // Han written without brackets (typed answers, a slip in the data): the longest dictionary words, else each character's
  // most common reading. ja keeps its kana as they are. → [{ s, r }] (r '' when nothing is known)
  function lookup(text, l) {
    ensure();
    const W = D[l].words, ch = [...text], out = [];
    for (let i = 0; i < ch.length;) {
      let hit = null;
      if (l === 'ja') {
        const nb = jaNumberAt(ch, i);
        if (nb) {
          // (a longer dictionary word that starts with the number still wins when no counter follows: 一緒, 三日月)
          let dict = null;
          if (!nb.ctr) for (let k = Math.min(10, ch.length - i); k > nb.n && !dict; k--) { const piece = ch.slice(i, i + k).join(''), e = W.get(piece); if (e) dict = true; }
          if (!dict) { out.push({ s: nb.s, r: nb.r, n: nb.n }); i += nb.n; continue; }
        }
      }
      for (let k = Math.min(10, ch.length - i); k >= 1 && !hit; k--) {
        const piece = ch.slice(i, i + k).join(''), e = W.get(piece);
        if (e && (k > 1 || isHan(piece) || l === 'zh')) hit = { s: piece, r: e.r, n: k };
      }
      if (!hit) hit = { s: ch[i], r: l === 'zh' ? topReading(ch[i]) : isKana(ch[i]) ? toHira(ch[i]) : '', n: 1 };
      out.push(hit); i += hit.n;
    }
    return out;
  }

  // ---------------------------------------------------------------- rendering: units → html, plain, len
  // A unit is what the typewriter shows at once and what a ruby sits on: { t, rt (the reading, or ''), fade, ch (the
  // characters it shows, for mastery), w (the woven word it belongs to), cjk, sp (a space before it), cost }.
  const LANGTAG = { zh: { chars: 'zh-Hans', roman: 'zh-Latn' }, ja: { chars: 'ja', roman: 'ja-Latn' } };
  const WA_WORDS = { 'こんにちは': 'konnichiwa', 'こんばんは': 'konbanwa', 'では': 'dewa', 'には': 'niwa', 'とは': 'towa', 'からは': 'karawa', 'までは': 'madewa' };
  // ja rōmaji, names: capitalized (the katakana names of CJK.md's table, and any word with an honorific after it), the
  // honorific joined with a hyphen (Rosa-san, Giru-san, Mori-sensei). Loanwords (フェリー, パン) stay lowercase. addNames()
  // takes more katakana names.
  const JA_NAMES = new Set(NAMES.ja.split(' ').filter(s => /^[ァ-ヿ]+$/.test(s))
    .concat('ニコ ビセンテ エレナ ギル カンデ ピオ パコ ロシオ ルチョ マイテ エフライン ルペ チェペ ルス リタ ルペ'.split(' ')));
  const HONORIFIC = new Set(['さん', 'くん', 'ちゃん', 'さま', '様', '先生', 'せんせい']);
  const addNames = list => { (Array.isArray(list) ? list : String(list || '').split(/\s+/)).forEach(s => { if (s) JA_NAMES.add(s); }); };
  // ja rōmaji, long vowels: うう / おう that cross where two words meet inside one reading stay two letters (湖 mizuumi, not
  // mizūmi). A short list: the reading → where it splits.
  const JA_SPLIT = { 'みずうみ': [2], 'あおうみ': [2], 'こうま': [1] };
  const splitAt = k => new Set(JA_SPLIT[k] || []);
  const SMALL = new Set([...'ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ']);
  const LETTER = /[a-zà-ÿāáǎēéěīíǐōóǒūúǔǖǘǚǜ]/i;
  function morae(s) {                      // kana → morae: きょ, って, ルー stay together
    const c = [...s], out = [];
    for (let i = 0; i < c.length; i++) {
      let m = c[i];
      if ((m === 'っ' || m === 'ッ') && i + 1 < c.length && !SMALL.has(c[i + 1]) && c[i + 1] !== 'ー') m += c[++i];
      while (i + 1 < c.length && (SMALL.has(c[i + 1]) || c[i + 1] === 'ー')) m += c[++i];
      out.push(m);
    }
    return out;
  }
  const mimoSrc = l => { const n = (typeof UI !== 'undefined' && UI.mimoName) || 'Mimo'; return n === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : n; };
  // a line's tokens with its slots ({w.key}, {w.key:pl}, {mimo}) filled in; a word slot's tokens carry w: { id, en }
  function expand(src, l, o) {
    const out = [];
    for (const t of parse(src, l)) {
      if (t.kind !== 'slot') { out.push(t); continue; }
      let s2 = null, w = null;
      if (t.slot === 'mimo') s2 = mimoSrc(l);
      else if (typeof LEX !== 'undefined' && LEX.item(t.slot)) {
        const it = LEX.item(t.slot);
        if (o.expose) LEX.expose(t.slot);
        s2 = (t.v === 'pl' && it.pl && it.pl[l]) || (t.v === 'f' && it.f && it.f[l]) || it[l] || it.en || t.slot;
        w = { id: t.slot, en: t.v === 'pl' ? (it.enPl || (it.en || '') + 's') : (it.en || '') };
      }
      if (s2 === null) { out.push({ kind: 'latin', s: t.s, sp: t.sp }); continue; }
      parse(s2, l).forEach((x, k) => out.push(Object.assign({}, x, { w, sp: k ? x.sp : t.sp })));
    }
    return out;
  }
  // ja: a word's segments with their hiragana [{ s, k, han }] (Han without a reading comes from the dictionary)
  function jaSegs(t) {
    if (t.segs.every(g => g.r || !g.han)) return t.segs.map(g => ({ s: g.s, k: toHira(g.han ? g.r : g.s), han: g.han }));
    return lookup(t.s, 'ja').map(p => ({ s: p.s, k: p.r || '', han: [...p.s].some(isHan) }));
  }
  // zh: a word's characters with their syllables [{ s, r }] (a bracket whose count is off keeps its reading whole)
  function zhChars(t) {
    const out = [], each = (s, r) => { const c = [...s], sy = String(r || '').split(' '); if (sy.length === c.length) c.forEach((x, k) => out.push({ s: x, r: sy[k] })); else out.push({ s, r }); };
    for (const g of t.segs) {
      if (!g.han) out.push({ s: g.s, r: '' });
      else if (g.r) each(g.s, g.r);
      else lookup(g.s, 'zh').forEach(p => each(p.s, p.r));
    }
    return out;
  }
  function romanWord(t, l) {
    if (l === 'zh') { const syl = []; zhChars(t).forEach(c => syl.push(...(c.r ? c.r.split(' ') : [c.s]))); return pyJoin(syl); }
    if (t.part) return t.part;
    const segs = jaSegs(t), kana = segs.map(g => g.k || g.s).join(''), bounds = new Set();
    if (WA_WORDS[kana]) return WA_WORDS[kana];
    let n = 0; segs.forEach(g => { const k = g.k || g.s; if (n) bounds.add(n); for (const b of splitAt(k)) bounds.add(n + b); n += k.length; });
    return romaji(kana, { bounds });
  }
  function romanUnits(toks, l, o) {
    const U = [], sentences = o.cap !== false;          // (sentences start with a capital, in pinyin and rōmaji alike)
    let capNext = o.cap !== false, prevOpen = false;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      let text, closeP = false, openP = false, name = false;
      if (t.kind === 'punct') { text = asciiPunct(t.s); openP = OPENERS.includes(t.s[0]); closeP = !openP; }
      else if (t.kind === 'latin') { text = t.s; closeP = /^[,.!?;:)\]…]+$/.test(t.s); openP = /^[(\["“¿¡]+$/.test(t.s); }
      else text = t.segs ? romanWord(t, l) : t.s;
      if (!text) continue;
      if (l === 'ja' && t.segs) {        // (names: Rosa-san, Mori-sensei)
        const last = U[U.length - 1], nx = toks[i + 1];
        if (HONORIFIC.has(t.s) && t.sp && last && last.name) { last.t += '-' + text; last.cost = last.t.length; continue; }
        name = JA_NAMES.has(t.s) || (!HONORIFIC.has(t.s) && !!nx && !!nx.segs && nx.sp && HONORIFIC.has(nx.s));
        if (name) text = text.replace(LETTER, c => c.toUpperCase());
      }
      if (capNext && !closeP && !openP && LETTER.test(text)) { text = text.replace(LETTER, c => c.toUpperCase()); capNext = false; }
      U.push({ t: text, rt: '', ch: [], w: t.w || null, cjk: false, sp: U.length > 0 && !closeP && !prevOpen, cost: text.length, name });
      prevOpen = openP;
      if (sentences && /[.!?]["”]?$/.test(text)) capNext = true;
    }
    return U;
  }
  function charUnits(toks, l, o) {
    const U = [], ruby = o.ruby === undefined ? true : o.ruby;
    const furi = k => ([...k].every(c => c === 'ー' || known(c, l)) ? k : romaji(k, { bounds: splitAt(k) }));      // (furigana in kana once you know those kana)
    const push = (t, reading, ch, w) => {
      const need = ruby === 'always' || (ruby && !ch.every(c => known(c, l))), fade = !!ruby && !need && ch.some(c => fading(c, l));
      U.push({ t, rt: reading && (need || fade) ? reading : '', fade, ch, w: w || null, cjk: true, sp: false, cost: 2 * [...t].length });
    };
    let prevLatin = false;
    for (const t of toks) {
      const w = t.w || null;
      if (t.kind === 'latin') { U.push({ t: t.s, rt: '', ch: [], w, cjk: false, sp: prevLatin && !!t.sp, cost: t.s.length }); prevLatin = true; continue; }
      prevLatin = false;
      if (t.kind === 'punct') { U.push({ t: t.s, rt: '', ch: [], w, cjk: true, sp: false, cost: 1 }); continue; }
      if (!t.segs) continue;
      if (l === 'zh') { for (const c of zhChars(t)) push(c.s, c.r ? pyJoin(c.r.split(' ')) : '', [...c.s].filter(isHan), w); continue; }
      const segs = jaSegs(t), wa = !!WA_WORDS[segs.map(g => g.k || g.s).join('')];      // (こんにちは: its は reads wa)
      segs.forEach((g, gi) => {
        if (g.han) { push(g.s, g.k ? furi(g.k) : '', [...g.s].filter(isHan), w); return; }
        const ms = morae(g.s);
        ms.forEach((m, mi) => push(m, t.part || (wa && gi === segs.length - 1 && mi === ms.length - 1 && m === 'は' ? 'wa' : romaji(m)), [...m].filter(c => c !== 'ー'), w));
      });
    }
    return U;
  }
  const plainish = src => !hasCJK(src) && !/\{(mimo|[a-z]+\.[a-z0-9_]+)/i.test(String(src == null ? '' : src));
  function units(src, o = {}) {
    const l = o.lang || (isCJK(lang()) ? lang() : guess(String(src)) || 'zh'), m = o.mode || mode(l);
    if (o.register !== false) addSource(String(src), l);
    const toks = expand(src, l, o);
    return { l, m, U: m === 'chars' ? charUnits(toks, l, o) : romanUnits(toks, l, o) };
  }
  // HTML for the mode: <ruby> over characters you don't know yet (o.ruby 'always': over all of them, false: none), the
  // woven words of slots in <span class="w">, the whole in <span class="cjk …" lang="zh-Hans" …>. o.n reveals that much.
  function html(src, o = {}) {
    if (plainish(src)) return escH(String(src == null ? '' : src).slice(0, o.n === undefined ? undefined : Math.max(0, o.n)));
    const { l, m, U } = units(src, o);
    let out = '', left = o.n === undefined ? Infinity : o.n, wOpen = null, rubies = 0;
    for (const u of U) {
      if (left <= 0) break;
      if (u.w !== wOpen && wOpen) { out += '</span>'; wOpen = null; }
      if (u.sp) { out += ' '; if (--left <= 0) break; }
      if (u.w && u.w !== wOpen) { out += `<span class="w" data-en="${escH(u.w.en)}">`; wOpen = u.w; }
      const vis = u.cjk ? u.t : u.t.slice(0, Math.max(0, left));
      left -= u.cost;
      let body = escH(vis);
      if (u.rt && vis === u.t) { body = `<ruby>${body}<rt${u.fade ? ' class="cjk-fade"' : ''}>${escH(u.rt)}</rt></ruby>`; rubies++; }
      out += body;
    }
    if (wOpen) out += '</span>';
    return `<span class="cjk cjk-${l} cjk-${m}${rubies ? ' cjk-ruby' : ''}${o.cls ? ' ' + o.cls : ''}" lang="${LANGTAG[l][m]}">${out}</span>`;
  }
  function plain(src, o = {}) {
    if (plainish(src)) return String(src == null ? '' : src);
    return units(src, Object.assign({ ruby: false }, o)).U.map(u => (u.sp ? ' ' : '') + u.t).join('');
  }
  const len = (src, o = {}) => (plainish(src) ? String(src == null ? '' : src).length : units(src, Object.assign({ ruby: false }, o)).U.reduce((a, u) => a + u.cost + (u.sp ? 1 : 0), 0));
  const roman = (src, o = {}) => plain(src, Object.assign({}, o, { mode: 'roman' }));
  const chars = (src, o = {}) => plain(src, Object.assign({}, o, { mode: 'chars' }));

  // ---------------------------------------------------------------- typed answers
  // canon(text, l): the key answers are compared by (a key, not for showing). zh: toneless pinyin (ü = v = u), no spaces or
  // punctuation, tone digits dropped, characters through the dictionary. ja: rōmaji the same way: kana and katakana alike,
  // kanji through the dictionary, Hepburn = wāpuro (shi/si, tsu/tu, chi/ti, fu/hu, ji/zi, o/wo), long vowels collapsed
  // (ō = ou = oo = oh = o), and は / へ / を = wa / e / o wherever they are (typed the wāpuro way too).
  const defLang = text => (isCJK(lang()) ? lang() : guess(String(text == null ? '' : text)) || 'zh');
  function canonKana(h) {
    const loose = toHira(h).replace(/は/g, 'わ').replace(/へ/g, 'え').replace(/を/g, 'お').replace(/ぢ/g, 'じ').replace(/づ/g, 'ず');
    return romaji(loose, { flat: true }).toLowerCase().replace(/ou/g, 'o').replace(/([aiueo])\1+/g, '$1').replace(/[^a-z]/g, '');
  }
  function canon(text, l) {
    l = l || defLang(text);
    const toks = expand(String(text == null ? '' : text), l, {});
    if (l === 'zh') {
      let out = '';
      for (const t of toks) {
        if (t.segs) zhChars(t).forEach(c => { out += toneless(c.r || ''); });
        else if (t.kind === 'latin') out += toneless(t.s);
      }
      return out;
    }
    return canonKana(kanaOf(toks));
  }
  // ja: a text as loose hiragana (kanji through the dictionary, rōmaji converted, は / へ / を as わ / え / お)
  function kanaOf(toks) {
    if (!Array.isArray(toks)) toks = expand(String(toks == null ? '' : toks), 'ja', {});
    let kana = '';
    for (const t of toks) {
      if (t.segs) kana += jaSegs(t).map(g => g.k || g.s).join('');
      else if (t.kind === 'latin') kana += toKana(t.s.replace(/[^a-zA-Z'\-āīūēōâîûêô]/g, ''), { final: true });
    }
    return toHira(kana).replace(/は/g, 'わ').replace(/へ/g, 'え').replace(/を/g, 'お').replace(/ぢ/g, 'じ').replace(/づ/g, 'ず');
  }
  function same(a, b, l) { l = l || defLang(b); const x = canon(a, l); return !!x && x === canon(b, l); }
  function lev(a, b) {
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  function similar(a, b, l) {
    l = l || defLang(b);
    const x = canon(a, l), y = canon(b, l);
    return x && y ? 1 - lev(x, y) / Math.max(x.length, y.length) : 0;
  }
  // zh: a text's toneless syllables (characters through the dictionary, letters segmented)
  function sylList(text) {
    const out = [];
    for (const t of expand(String(text == null ? '' : text), 'zh', {})) {
      if (t.segs) zhChars(t).forEach(c => String(c.r || '').split(' ').forEach(s => { const x = toneless(s); if (x) out.push(x); }));
      else if (t.kind === 'latin') segment(t.s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/v/g, 'u').replace(/[^a-z']/g, '')).forEach(s => out.push(s));
    }
    return out;
  }
  // Does the typed text say this word somewhere? (Tell Mimo: «跳！», «tiào ba», «とんで！»). zh goes syllable by syllable,
  // so «da» doesn't match inside «dan»; ja looks for the word's rōmaji in the whole.
  function contains(text, src, l) {
    l = l || defLang(src);
    if (l === 'ja') {          // (kana first: collapsing long vowels can run words together, を + うって → "otte")
      const k = kanaOf(src), w = canon(src, l);
      return (!!k && kanaOf(text).includes(k)) || (!!w && canon(text, l).includes(w));
    }
    const S = sylList(text), W = sylList(src);
    if (!W.length) return false;
    for (let i = 0; i + W.length <= S.length; i++) if (W.every((s, k) => S[i + k] === s)) return true;
    return false;
  }

  // ---------------------------------------------------------------- typed text, unit by unit (the shop's orders, LEX.heard)
  // typed(text, l) → { U, marks }: zh: a character { han, ch, syl (toneless, from the dictionary), grp (inside a longer word
  // the dictionary knows) } or a pinyin syllable { syl, tone, toneTyped } (a mark or a digit gives the tone); ja: a kanji
  // { han, ch }, a kana { k (hiragana) } (rōmaji turns into kana) or a stray letter { bad }; both: digits { digit, n }.
  // marks[i]: ',' or '.' before unit i. wordOf(src, l): a word in the notation, ready to match (zh: ch / syl / tone per
  // character; ja: segs [{ han, s, k }]). matchAt(w, U, i, l, o) → { j, homo, toneBad, kana, short } or null: does the word start
  // at unit i? Characters typed must be the word's own (大 is not 打, though both are «da»; o.homo: a zh character that only
  // sounds the same counts, flagged homo); pinyin matches by syllable, and a tone typed that isn't the word's is toneBad
  // (never on 一 / 不, which change tone); ja kana or rōmaji may spell a kanji word (kana: true), and long vowels may be left
  // out (short: true; «to» can be とお) or spelled another way (ō = ou = oo = o).
  // segment(), but the way pinyin is written: inside a word a syllable starting with a / o / e gets an apostrophe (Xī'ān,
  // as pyJoin writes it), so without one «dangao» is dàn gāo (蛋糕), not dàng āo
  function segOrtho(s) {
    const n = s.length, best = new Array(n + 1).fill(Infinity), prev = new Array(n + 1).fill(-1);
    best[0] = 0;
    for (let i = 0; i < n; i++) {
      if (best[i] === Infinity) continue;
      for (let k = 1; k <= 6 && i + k <= n; k++) {
        const piece = s.slice(i, i + k), c = best[i] + (SYL.has(piece) ? (i > 0 && /^[aoe]/.test(piece) ? 1.01 : 1) : k === 1 ? 10 : Infinity);
        if (c <= best[i + k]) { best[i + k] = c; prev[i + k] = i; }
      }
    }
    const seq = [];
    for (let j = n; j > 0; j = prev[j]) seq.unshift(s.slice(prev[j], j));
    return seq;
  }
  function pinyinUnits(run, U) {
    for (const m of run.matchAll(/([^1-5']+)([1-5]?)|'/g)) {
      if (!m[1]) continue;
      const letters = [];
      for (const c of m[1].normalize('NFD')) {
        if (/[̀-ͯ]/.test(c)) { const t = { '̄': 1, '́': 2, '̌': 3, '̀': 4 }[c] || 0; if (t && letters.length) letters[letters.length - 1].t = t; continue; }
        if (/[a-z]/i.test(c)) letters.push({ c: c.toLowerCase() === 'v' ? 'u' : c.toLowerCase(), t: 0 });
      }
      if (!letters.length) continue;
      const syls = segOrtho(letters.map(x => x.c).join(''));
      let k = 0;
      syls.forEach((sy, n) => {
        const span = letters.slice(k, k + sy.length); k += sy.length;
        let tone = Math.max(0, ...span.map(x => x.t)), byHand = tone > 0;
        if (n === syls.length - 1 && m[2]) { tone = +m[2] === 5 ? 0 : +m[2]; byHand = true; }
        U.push({ syl: sy, tone, toneTyped: byHand, raw: tone ? markTone(sy, tone) : sy });
      });
    }
  }
  function typed(text, l) {
    l = l || lang();
    const U = [], marks = [], s = String(text == null ? '' : text).normalize('NFKC');
    const mark = m => { if (!marks[U.length] || m === '.') marks[U.length] = m; };
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[0-9]/.test(c)) { let j = i; while (j < s.length && /[0-9]/.test(s[j])) j++; U.push({ digit: true, n: parseInt(s.slice(i, j), 10), raw: s.slice(i, j) }); i = j; continue; }
      if (isHan(c)) {
        let j = i; while (j < s.length && isHan(s[j])) j++;
        if (l === 'zh') for (const p of lookup(s.slice(i, j), 'zh')) {
          const cs = [...p.s], sy = String(p.r || '').split(' ').filter(Boolean);
          cs.forEach((ch, k) => U.push({ han: true, ch, syl: toneless(sy.length === cs.length ? sy[k] : topReading(ch)), raw: ch, grp: cs.length > 1 }));
        } else for (const ch of s.slice(i, j)) U.push({ han: true, ch, raw: ch });
        i = j; continue;
      }
      if (l === 'ja' && isKana(c) && c !== '・') { U.push({ k: toHira(c), raw: c }); i++; continue; }
      if (l === 'zh' && /[A-Za-zÀ-ɏ̀-ͯ:]/.test(c)) { let j = i; while (j < s.length && /[A-Za-zÀ-ɏ̀-ͯ:'1-5]/.test(s[j])) j++; pinyinUnits(s.slice(i, j), U); i = j; continue; }
      if (l === 'ja' && /[A-Za-zāīūēōâîûêô'-]/.test(c)) {
        let j = i; while (j < s.length && /[A-Za-zāīūēōâîûêô'-]/.test(s[j])) j++;
        for (const ch of toKana(s.slice(i, j), { final: true })) U.push(/[a-z']/i.test(ch) ? { bad: true, raw: ch } : { k: toHira(ch), raw: ch });
        i = j; continue;
      }
      if (/[、，,;；]/.test(c)) mark(',');
      else if (/[。.！!？?]/.test(c)) mark('.');
      i++;
    }
    return { U, marks };
  }
  const W_CACHE = new Map();
  function wordOf(src, l) {
    src = String(src == null ? '' : src); l = l || defLang(src);
    const key = l + '\u0001' + src, hit = W_CACHE.get(key);
    if (hit) return hit;
    const w = { src, l }, toks = expand(src, l, {}).filter(t => t.segs);
    if (l === 'zh') {
      w.ch = []; w.syl = []; w.tone = [];
      for (const t of toks) for (const c of zhChars(t)) {
        if (![...c.s].every(isHan)) continue;
        const sy = String(c.r || '').split(' ');
        [...c.s].forEach((ch, k) => { w.ch.push(ch); w.syl.push(toneless(sy[k] || '')); w.tone.push(toneOf(sy[k] || '')); });
      }
    } else {
      w.segs = [];
      for (const t of toks) for (const g of jaSegs(t)) w.segs.push({ han: g.han, s: g.s, k: toHira(g.k || g.s) });
      w.kana = w.segs.map(g => g.k).join('');
    }
    if (W_CACHE.size > 3000) W_CACHE.clear();
    W_CACHE.set(key, w);
    return w;
  }
  const looseK = k => String(k).replace(/は/g, 'わ').replace(/へ/g, 'え').replace(/を/g, 'お').replace(/ぢ/g, 'じ').replace(/づ/g, 'ず');
  const SMALL_K = 'ぁぃぅぇぉゃゅょゎ';
  // kana → morae for matching: っ joins what follows, small kana what comes before; ー stays on its own (a long mark)
  function moraList(k) {
    const c = [...k], out = [];
    for (let i = 0; i < c.length; i++) {
      let m = c[i];
      if (m === 'っ' && i + 1 < c.length && c[i + 1] !== 'ー') m += c[++i];
      while (i + 1 < c.length && SMALL_K.includes(c[i + 1])) m += c[++i];
      out.push(m);
    }
    return out;
  }
  const vowelOfM = m => { const r = m ? romaji(m) : ''; return /[aiueo]$/.test(r) ? r.slice(-1) : ''; };
  // a long mark: ー, or a vowel that only stretches the one before it (おう, おお, うう, ああ, いい, えい, ええ)
  function isLongM(m, prev) {
    if (m === 'ー') return true;
    const v = vowelOfM(prev);
    return (m === 'う' && (v === 'o' || v === 'u')) || (m === 'お' && v === 'o') || (m === 'あ' && v === 'a') || (m === 'い' && (v === 'i' || v === 'e')) || (m === 'え' && v === 'e');
  }
  function moraAt(U, q) {
    const u = U[q];
    if (!u || u.han || u.bad || u.digit || !u.k) return null;
    let m = u.k, len = 1;
    if (m === 'っ' && U[q + 1] && U[q + 1].k && !U[q + 1].han && U[q + 1].k !== 'ー') { m += U[q + 1].k; len = 2; }
    while (U[q + len] && U[q + len].k && !U[q + len].han && SMALL_K.includes(U[q + len].k)) { m += U[q + len].k; len++; }
    return { m, len };
  }
  // a reading (hiragana) against the units from p → the unit after it, or -1. last: it ends the word, so its last mora may
  // only be dropped if it's ー, or う / お after an o or a u (st.short records a dropped one). を typed is only を (rōmaji
  // «o» may be either, but を typed as a kana is the particle, not the お of おいくら)
  function kanaAt(k, U, p, last, st) {
    const em = moraList(k);
    let q = p, prev = '';
    for (let a = 0; a < em.length; a++) {
      const m = em[a], longE = a > 0 && isLongM(m, prev), im = moraAt(U, q);
      if (im && looseK(im.m) === looseK(m) && !(im.m.includes('を') && !m.includes('を'))) { q += im.len; prev = m; continue; }
      if (im && longE && isLongM(im.m, prev)) { q += im.len; prev = m; continue; }
      if (longE && (a < em.length - 1 || !last || /^[うおー]$/.test(m))) { prev = m; if (st) st.short = true; continue; }
      if (im && a > 0 && isLongM(im.m, prev)) { q += im.len; a--; continue; }      // an extra long mark typed (oh, ou)
      return -1;
    }
    return q;
  }
  function matchAt(w, U, i, l, o = {}) {
    l = l || w.l;
    if (l === 'zh') {
      const n = w.syl.length;
      if (!n || i + n > U.length) return null;
      let homo = false, toneBad = false;
      for (let k = 0; k < n; k++) {
        const u = U[i + k];
        if (!u || u.digit || u.bad) return null;
        if (u.han) { if (u.ch === w.ch[k]) continue; if (o.homo && u.syl && u.syl === w.syl[k] && !u.grp) { homo = true; continue; } return null; }
        if (u.syl !== w.syl[k]) return null;
        if (u.toneTyped && u.tone && w.tone[k] && u.tone !== w.tone[k] && !/^[一不]$/.test(w.ch[k])) toneBad = true;
      }
      return { j: i + n, homo, toneBad, kana: false };
    }
    // all in kana (or rōmaji) first, the reading as one (みっつ: a っ where a kanji's reading ends), then kanji and kana mixed
    const st = {}, hanW = w.segs.some(g => g.han);
    if (U[i] && !U[i].han) { const q = kanaAt(w.kana, U, i, true, st); if (q > i) return { j: q, homo: false, toneBad: false, kana: hanW, short: !!st.short }; }
    let p = i, kana = false;
    st.short = false;
    for (let s = 0; s < w.segs.length; s++) {
      const g = w.segs[s];
      if (g.han && U[p] && U[p].han) {
        const cs = [...g.s];
        for (let k = 0; k < cs.length; k++) if (!U[p + k] || !U[p + k].han || U[p + k].ch !== cs[k]) return null;
        p += cs.length; continue;
      }
      if (g.han) kana = true;
      const q = kanaAt(g.k, U, p, s === w.segs.length - 1, st);
      if (q < 0) return null;
      p = q;
    }
    return p > i ? { j: p, homo: false, toneBad: false, kana, short: !!st.short } : null;
  }

  // ---------------------------------------------------------------- the character gimmick: mastery per character
  // Per language, per character: { r: lines it was read in, u: times typed or picked right, k: known, l: learned at the
  // script school }. Saved with LEX (toJSON / fromJSON). A reading fades out the moment its character becomes known.
  const THRESH = { han: { read: 6, used: 3 }, kana: { read: 4, used: 2 } };
  let MS = { zh: {}, ja: {} };
  const fadeAt = new Map();
  const tracked = (c, l) => (l === 'zh' ? isHan(c) : isHan(c) || (isKana(c) && c !== 'ー'));
  const rec = (l, c) => { const T = MS[l] || (MS[l] = {}); return T[c] || (T[c] = { r: 0, u: 0 }); };
  function known(c, l) { const s = (MS[l || lang()] || {})[c]; return !!(s && (s.k || s.l)); }
  function fading(c, l) { const t = fadeAt.get(l + c); return !!t && Date.now() - t < 6000; }
  function promote(l, c, s) {
    const T = isHan(c) ? THRESH.han : THRESH.kana;
    if (s.k || s.r < T.read || s.u < T.used) return false;
    s.k = 1; fadeAt.set(l + c, Date.now());
    return true;
  }
  const listOf = x => [...String(Array.isArray(x) ? x.join('') : x == null ? '' : x)];
  // A line was read (character mode only): each character shown in it counts once. Returns those that just became known.
  function seen(src, o = {}) {
    const l = o.lang || lang();
    if (!isCJK(l) || src == null || (mode(l) !== 'chars' && !o.force)) return [];
    const set = new Set(), now = [];
    for (const u of units(src, { lang: l, mode: 'chars', ruby: false }).U) u.ch.forEach(c => { if (tracked(c, l)) set.add(c); });
    for (const c of set) { const s = rec(l, c); s.r++; if (promote(l, c, s)) now.push(c); }
    return now;
  }
  // An answer was right: credit the characters typed or picked (only those in the expected word or its reading, when
  // it's given). Returns those that just became known.
  function used(typed, expected, o = {}) {
    const l = o.lang || lang();
    if (!isCJK(l) || typed == null) return [];
    let set = new Set(listOf(typed).filter(c => tracked(c, l)));
    if (expected != null) {
      const ok = new Set();
      for (const t of expand(String(expected), l, {})) {
        if (!t.segs) continue;
        [...t.s].forEach(c => ok.add(c));
        if (l === 'ja') jaSegs(t).forEach(g => [...(g.k || '')].forEach(c => { ok.add(c); ok.add(toKata(c)); }));
      }
      set = new Set([...set].filter(c => ok.has(c)));
    }
    const now = [];
    for (const c of set) { const s = rec(l, c); s.u++; if (promote(l, c, s)) now.push(c); }
    return now;
  }
  // the script school: learn characters on purpose (known from then on), or take them back
  function learn(list, l) {
    l = l || lang();
    const out = [];
    for (const c of listOf(list)) if (tracked(c, l)) { const s = rec(l, c); if (!s.l) { s.l = 1; out.push(c); fadeAt.set(l + c, Date.now()); } }
    return out;
  }
  function forget(list, l) { l = l || lang(); for (const c of listOf(list)) { const s = (MS[l] || {})[c]; if (s) { s.k = 0; s.l = 0; } } }
  const mastery = (c, l) => { const s = (MS[l || lang()] || {})[c] || { r: 0, u: 0 }; return { read: s.r, used: s.u, known: !!(s.k || s.l), learned: !!s.l }; };
  function stats(l) {
    l = l || lang();
    const T = MS[l] || {}, all = Object.keys(T);
    return { tracked: all.length, known: all.filter(c => T[c].k || T[c].l), learned: all.filter(c => T[c].l), list: all };
  }
  const toJSON = () => MS;
  function fromJSON(o) { MS = { zh: Object.assign({}, o && o.zh), ja: Object.assign({}, o && o.ja) }; fadeAt.clear(); }
  function reset() { MS = { zh: {}, ja: {} }; fadeAt.clear(); }

  // ---------------------------------------------------------------- checking the notation (CJK.md)
  // The problems in one string, as short sentences ([] when it's fine).
  function validate(src, l) {
    src = String(src == null ? '' : src).replace(/(^| )\*(?=\S)/g, '$1').replace(/(\S)\*(?= |$)/g, '$1');      // (*starred* words, the ones a hushed line keeps: the stars aren't tokens)
    l = l || guess(src) || defLang(src);
    const P = [], add = m => { if (!P.includes(m)) P.push(m); };
    if (/[[\]{}]/.test(src.replace(/\[[^[\]]*\]/g, '').replace(/\{[^{}]*\}/g, ''))) add('a [ ] or { } without its partner, or a bracket inside a bracket');
    if (/ {2,}/.test(src)) add('two spaces in a row: tokens are separated by single spaces');
    if (/^\s|\s$/.test(src)) add('a space at the start or the end');
    for (const m of src.matchAll(/\[([^[\]|]*)\]/g)) add(`[${m[1]}] has no |reading`);
    for (const m of src.matchAll(/\[([^[\]|]*)\|([^[\]]*)\]/g)) {
      const s = m[1].trim(), r = m[2].trim(), ch = [...s], tag = `[${s}|${r}]`;
      if (!s || !r) { add(`${tag}: an empty side`); continue; }
      if (!ch.every(isHan)) add(`${tag}: only Han characters go in the brackets (kana and okurigana stay outside)`);
      if (l !== 'zh') { if (!/^[ぁ-ゖー]+$/.test(r)) add(`${tag}: the reading should be hiragana`); continue; }
      const sy = r.split(/\s+/);
      if (sy.length !== ch.length) add(`${tag}: ${ch.length} character${ch.length > 1 ? 's' : ''} but ${sy.length} syllable${sy.length > 1 ? 's' : ''}`);
      for (const y of sy) {
        const nfc = y.normalize('NFC'), bare = nfc.normalize('NFD').replace(/[̀́̄̌]/g, '').normalize('NFC');
        const marks = (nfc.normalize('NFD').match(/[̀́̄̌]/g) || []).length;
        if (!/^[a-zA-ZüÜ]+$/.test(bare)) { add(`${tag}: «${y}» has something other than letters and tone marks`); continue; }
        if (!SYL.has(toneless(bare)) && !SYL_X.has(toneless(bare))) add(`${tag}: «${y}» isn't a pinyin syllable`);
        if (marks > 1) add(`${tag}: «${y}» has two tone marks`);
        else if (marks === 1 && markTone(bare, toneOf(nfc)) !== nfc) add(`${tag}: the tone mark of «${y}» goes on another vowel: «${markTone(bare, toneOf(nfc))}»`);
      }
    }
    const toks = parse(src, l);
    toks.forEach((t, i) => {
      if (t.segs && t.segs.some(g => g.han && !g.r)) add(`«${t.segs.filter(g => g.han && !g.r).map(g => g.s).join('')}»: Han outside brackets (give it its reading)`);
      if (l === 'zh' && t.segs && t.segs.some(g => !g.han)) add(`«${t.s}»: kana in Chinese text`);
      if (t.kind === 'latin' && /^[,.!?;:]+$/.test(t.s)) add(`«${t.s}»: use full-width punctuation (${l === 'zh' ? '，。！？：；' : '、。！？'})`);
      if (i > 0 && !t.sp) add(`«${t.s}» is stuck to the token before it: every token (punctuation too) gets a space before it`);
      if (t.kind === 'slot' && t.slot !== 'mimo' && typeof LEX !== 'undefined' && LEX.ids().length && !LEX.item(t.slot)) add(`{${t.slot}}: no such word`);
      if (l === 'ja' && t.segs && t.segs.length > 1) {
        const last = t.segs[t.segs.length - 1];
        if (!last.han && /^[はをへ]$/.test(last.s) && t.segs[t.segs.length - 2].han) add(`«${t.s}»: the particle ${last.s} is glued to its word (make it its own token)`);
      }
      if (l === 'ja' && t.kind === 'kana' && t.s.length > 1 && /を$/.test(t.s)) add(`«${t.s}»: を is a particle (its own token)`);
    });
    return P;
  }
  // Every zh / ja string the game has (LEX items, LINES, SIGN) → [{ where, src, problems }]
  function validateAll() {
    const out = [];
    const walk = (where, x, l) => {
      if (typeof x === 'string' && x) { const p = validate(x, l); if (p.length) out.push({ where, src: x, problems: p }); }
      else if (Array.isArray(x)) x.forEach((v, i) => walk(`${where}[${i}]`, v, l));
    };
    if (typeof LEX !== 'undefined') for (const id of LEX.ids()) {
      const it = LEX.item(id);
      for (const l of ['zh', 'ja']) if (it && it[l]) { walk(`${id}.${l}`, it[l], l); if (it.alt) walk(`${id}.alt.${l}`, it.alt[l], l); if (it.pl) walk(`${id}.pl.${l}`, it.pl[l], l); }
    }
    if (typeof LINES !== 'undefined') for (const k of Object.keys(LINES)) for (const l of ['zh', 'ja']) if (LINES[k][l]) walk(`${k}.${l}`, LINES[k][l], l);
    if (typeof SIGN !== 'undefined') for (const l of ['zh', 'ja']) if (SIGN[l]) walk(`SIGN.${l}`, SIGN[l], l);
    return out;
  }

  // ---------------------------------------------------------------- the in-game IME: candidates
  // candidates(raw, l) → [{ s (what goes in), r (its reading), en (meaning, for LEX words), rest (letters left composing) }].
  // zh: words and characters whose toneless pinyin is the letters (or the whole run converted word by word), then words
  // starting with them, then words covering their start. ja: words read that way (kanji, katakana), the run converted word
  // by word, the hiragana, the katakana, then words covering its start.
  const score = (s, l) => { const e = D[l].words.get(s); return (D[l].en.has(s) ? 1000 : 0) + (e ? e.n : 0); };
  const byFreq = (set, l) => [...(set || [])].sort((a, b) => score(b, l) - score(a, l));
  function readingOf(s, l) {
    const e = D[l].words.get(s);
    if (l === 'zh') return pyJoin((e ? e.r : lookup(s, 'zh').map(p => p.r).join(' ')).split(' ').filter(Boolean));
    return romaji(e ? e.r : lookup(s, 'ja').map(p => p.r || p.s).join(''));
  }
  function convert(key, l) {                // the cheapest cover of a run by dictionary words (zh: letters; ja: kana, which may pass)
    const n = key.length, best = new Array(n + 1).fill(Infinity), prev = new Array(n + 1).fill(null), M = l === 'zh' ? D.zh.keys : D.ja.kana;
    best[0] = 0;
    for (let i = 0; i < n; i++) {
      if (best[i] === Infinity) continue;
      if (l === 'ja' && best[i] + 1 < best[i + 1]) { best[i + 1] = best[i] + 1; prev[i + 1] = { i, s: key[i], kana: true }; }
      for (let k = 1; k <= Math.min(24, n - i); k++) {
        const set = M.get(key.slice(i, i + k)), c = best[i] + (l === 'ja' && k === 1 ? 1.5 : 1);
        if (set && c < best[i + k]) { best[i + k] = c; prev[i + k] = { i, s: byFreq(set, l)[0] }; }
      }
    }
    if (best[n] === Infinity) return '';
    let s = '', j = n, words = 0;
    while (j > 0) { const p = prev[j]; s = p.s + s; if (!p.kana) words++; j = p.i; }
    return l === 'zh' && words < 2 ? '' : s;
  }
  const restAfter = (raw, k) => { let n = 0, i = 0; for (; i < raw.length && n < k; i++) if (/[a-z]/i.test(raw[i])) n++; return raw.slice(i).replace(/^'+/, ''); };
  function rawRest(raw, pre) { for (let j = 1; j <= raw.length; j++) if (toKana(raw.slice(0, j), { final: true }) === pre) return raw.slice(j); return null; }
  function candidates(raw, l) {
    l = l || lang(); ensure();
    const out = [], have = new Set();
    const add = (s, rest = '') => { const k = s + '|' + rest; if (!s || have.has(k)) return; have.add(k); out.push({ s, r: readingOf(s, l), en: D[l].en.get(s) || '', rest }); };
    if (l === 'zh') {
      const key = toneless(raw);
      if (!key) return out;
      const exact = byFreq(D.zh.keys.get(key), 'zh');
      if (!exact.length) add(convert(key, 'zh'));
      exact.forEach(s => add(s));
      if (key.length >= 2) { const more = []; for (const [k, set] of D.zh.keys) if (k.length > key.length && k.startsWith(key)) more.push(...set); byFreq(more, 'zh').slice(0, 6).forEach(s => add(s)); }
      for (let k = key.length - 1; k >= 1 && out.length < 27; k--) byFreq(D.zh.keys.get(key.slice(0, k)), 'zh').slice(0, 4).forEach(s => add(s, restAfter(raw, k)));
      return out.slice(0, 27);
    }
    const kana = toKana(raw, { final: true });
    if (!kana) return out;
    byFreq(D.ja.keys.get(canonKana(kana)), 'ja').forEach(s => add(s));
    const sent = convert(kana, 'ja');
    if (sent && sent !== kana) add(sent);
    add(kana); add(toKata(kana));
    for (let k = kana.length - 1; k >= 1 && out.length < 27; k--) {
      const rest = rawRest(raw, kana.slice(0, k));
      if (rest !== null) byFreq(D.ja.kana.get(kana.slice(0, k)), 'ja').forEach(s => add(s, rest));
    }
    return out.slice(0, 27);
  }

  // ---------------------------------------------------------------- the in-game IME: keys
  // In character mode, typing letters into an attached box composes: zh shows the letters and lists candidates as you type
  // (Space or Enter takes the highlighted one, 1–9 picks, Tab / arrows move); ja turns rōmaji into kana as you type, Space or
  // Tab lists the candidates, 1–9 or a click picks, Enter commits. Shift+letter types a Latin capital; punctuation turns
  // full-width; Esc undoes. A real OS IME still works: while it composes, these keys are left alone. In pinyin mode,
  // a tone digit after a syllable puts the mark on it (ni3 → nǐ). One capture listener on window, so a box's own Enter / Tab /
  // Esc handlers only see the keys the IME doesn't use; every change fires an 'input' event.
  const IME = { inputs: new WeakSet(), c: null, box: null, self: false, os: false, installed: false };
  const FW = { zh: { ',': '，', '.': '。', '?': '？', '!': '！', ':': '：', ';': '；', '(': '（', ')': '）' },
    ja: { ',': '、', '.': '。', '?': '？', '!': '！', ':': '：', ';': '；', '(': '（', ')': '）', '[': '「', ']': '」' } };
  function attachIME(el) {
    if (!el || IME.inputs.has(el)) return el;
    IME.inputs.add(el);
    if (!IME.installed) { IME.installed = true; addEventListener('keydown', onKey, true); }
    el.addEventListener('blur', () => { if (IME.c && IME.c.el === el) finish(); });
    el.addEventListener('pointerdown', () => { if (IME.c && IME.c.el === el) finish(); });
    el.addEventListener('input', () => { if (!IME.self && IME.c && IME.c.el === el) end(); });
    el.addEventListener('compositionstart', () => { IME.os = true; if (IME.c && IME.c.el === el) finish(); });
    el.addEventListener('compositionend', () => { IME.os = false; });
    return el;
  }
  function onKey(e) {
    const el = e.target;
    if (!el || !IME.inputs.has(el) || e.isComposing || e.keyCode === 229 || IME.os) return;
    const l = lang();
    if (!isCJK(l)) return;
    if (mode(l) !== 'chars') { if (l === 'zh') toneKey(e, el); return; }
    const c = IME.c && IME.c.el === el ? IME.c : null, k = e.key;
    const eat = () => { e.preventDefault(); e.stopImmediatePropagation(); };
    if (e.ctrlKey || e.metaKey || e.altKey) { if (c) finish(); return; }
    if (/^[a-z]$/i.test(k) && (c || !e.shiftKey)) { eat(); if (!c) begin(el); Object.assign(IME.c, { raw: IME.c.raw + k.toLowerCase(), open: false, sel: 0 }); update(); return; }
    if (c) {
      const list = c.list || [];
      switch (k) {
        case "'": eat(); c.raw += "'"; update(); return;
        case '-': if (l === 'ja') { eat(); c.raw += '-'; c.open = false; update(); return; } break;
        case 'Backspace': eat(); c.raw = c.raw.slice(0, -1); c.open = false; c.sel = 0; if (c.raw) update(); else cancel(); return;
        case 'Escape': eat(); if (c.open) { c.open = false; update(true); } else cancel(); return;
        case 'Enter': eat(); if (l === 'zh' ? list.length : c.open) pick(c.sel); else finish(); return;
        case ' ': eat(); if (l === 'zh') { if (list.length) pick(c.sel); else finish(); } else move(c.open ? 1 : 0); return;
        case 'Tab': eat(); move(e.shiftKey ? -1 : 1); return;
        case 'ArrowDown': case 'ArrowRight': eat(); move(1); return;
        case 'ArrowUp': case 'ArrowLeft': eat(); move(-1); return;
        case 'PageDown': eat(); move(9); return;
        case 'PageUp': eat(); move(-9); return;
      }
      if (/^[1-9]$/.test(k) && (l === 'zh' || c.open) && list.length) { eat(); pick(Math.floor(c.sel / 9) * 9 + (+k) - 1); return; }
      if (!FW[l][k] && !/^[0-9]$/.test(k)) { eat(); return; }          // (other keys do nothing while composing)
      if (l === 'zh' && list.length) pick(c.sel); else finish();       // (punctuation and digits: commit first, then type them)
    }
    if (FW[l][k]) { eat(); insert(el, FW[l][k]); }
  }
  function begin(el) {
    const a = el.selectionStart == null ? el.value.length : el.selectionStart, b = el.selectionEnd == null ? a : el.selectionEnd;
    if (b > a) el.value = el.value.slice(0, a) + el.value.slice(b);
    IME.c = { el, start: a, len: 0, raw: '', list: [], sel: 0, open: false };
  }
  const fire = el => { IME.self = true; try { el.dispatchEvent(new Event('input', { bubbles: true })); } finally { IME.self = false; } };
  function put(c, text) {
    const el = c.el, v = el.value, p = c.start + text.length;
    el.value = v.slice(0, c.start) + text + v.slice(c.start + c.len);
    c.len = text.length;
    try { el.setSelectionRange(p, p); } catch (e) { /* (not a text box) */ }
    fire(el);
  }
  function insert(el, text) {
    const a = el.selectionStart == null ? el.value.length : el.selectionStart, b = el.selectionEnd == null ? a : el.selectionEnd;
    el.value = el.value.slice(0, a) + text + el.value.slice(b);
    try { el.setSelectionRange(a + text.length, a + text.length); } catch (e) { /* (not a text box) */ }
    fire(el);
  }
  function update(keep) {
    const c = IME.c, l = lang();
    if (!c) return;
    if (!keep) c.list = candidates(c.raw, l);
    const sel = c.list[c.sel];
    put(c, l === 'zh' ? c.raw : c.open && sel ? sel.s + toKana(sel.rest || '') : toKana(c.raw));
    drawBox();
  }
  function move(d) {
    const c = IME.c, n = c ? (c.list || []).length : 0;
    if (!n) return;
    if (lang() === 'ja' && !c.open) { c.open = true; c.sel = 0; } else c.sel = ((c.sel + d) % n + n) % n;
    update(true);
  }
  function pick(i) {
    const c = IME.c, x = c && (c.list || [])[i];
    if (!x) return;
    put(c, x.s);
    if (x.rest) { Object.assign(c, { start: c.start + x.s.length, len: 0, raw: x.rest, open: false, sel: 0 }); update(); } else end();
  }
  function finish() { const c = IME.c; if (!c) return; if (lang() === 'ja' && !c.open) put(c, toKana(c.raw, { final: true })); end(); }
  function cancel() { const c = IME.c; if (c) put(c, ''); end(); }
  function end() { IME.c = null; if (IME.box) IME.box.style.display = 'none'; }
  // the candidate box, just above the text box (below it when there's no room)
  function drawBox() {
    const c = IME.c, l = lang();
    if (!c) { end(); return; }
    let b = IME.box;
    if (!b) {
      b = IME.box = document.createElement('div'); b.id = 'cjk-ime';
      b.addEventListener('pointerdown', e => { e.preventDefault(); const it = e.target.closest('[data-i]'); if (it) pick(+it.dataset.i); });
      b.addEventListener('mousedown', e => e.preventDefault());
      document.body.appendChild(b);
    }
    const list = c.list || [], showList = l === 'zh' || c.open, page = Math.floor(c.sel / 9) * 9, tag = LANGTAG[l].chars;
    const tip = l === 'zh' ? (list.length ? 'Space / Enter: the highlighted one · 1–9: pick · Tab: next · Esc: undo' : 'No characters for that yet · Enter keeps the letters')
      : showList ? '1–9 or click: pick · Space / Tab: next · Enter: use it · Esc: back to kana' : 'Space: kanji & katakana · Enter: keep the kana';
    b.innerHTML = `<div class="ime-head"><b lang="${tag}">${escH(l === 'zh' ? c.raw : toKana(c.raw))}</b><small>${tip}</small></div>`
      + (showList && list.length ? '<div class="ime-list">' + list.slice(page, page + 9).map((x, k) => `<span class="ime-c${page + k === c.sel ? ' on' : ''}" data-i="${page + k}">`
        + `<kbd>${k + 1}</kbd><b lang="${tag}">${escH(x.s)}${x.rest ? '<i>…</i>' : ''}</b><small>${escH(x.r)}${x.en ? ' · ' + escH(x.en) : ''}</small></span>`).join('')
        + (list.length > 9 ? `<span class="ime-more">${page / 9 + 1}/${Math.ceil(list.length / 9)}</span>` : '') + '</div>' : '');
    b.style.display = 'block';
    const r = c.el.getBoundingClientRect(), h = b.offsetHeight, w = b.offsetWidth;
    b.style.left = Math.max(6, Math.min(innerWidth - w - 6, r.left)) + 'px';
    b.style.top = (r.top - h - 8 >= 4 ? r.top - h - 8 : r.bottom + 8) + 'px';
  }
  // pinyin mode: a tone digit right after a syllable puts its mark on it (ni3 → nǐ, lv4 → lǜ; 5 = neutral, no mark)
  function toneKey(e, el) {
    if (!/^[1-5]$/.test(e.key) || e.ctrlKey || e.metaKey || e.altKey) return;
    const pos = el.selectionStart;
    if (pos == null || pos !== el.selectionEnd) return;
    const run = (el.value.slice(0, pos).match(/[a-zA-ZüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙ]+$/) || [''])[0];
    const flat = run.normalize('NFD').replace(/[̀́̄̌]/g, '').normalize('NFC');
    if (!run || flat.length !== run.length) return;
    const segs = segment(toneless(flat)), last = segs[segs.length - 1] || '';
    if (!SYL.has(last) && !SYL_X.has(last)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const syl = flat.slice(flat.length - last.length), marked = markTone(syl, +e.key), at = pos - syl.length;
    el.value = el.value.slice(0, at) + marked + el.value.slice(pos);
    try { el.setSelectionRange(at + marked.length, at + marked.length); } catch (err) { /* (not a text box) */ }
    fire(el);
  }

  // ---------------------------------------------------------------- fonts, speech, picking a language's text
  // System fonts only. HTML: anything with lang="zh-Hans" / lang="ja" gets its stack (html() sets it). Canvas: while the
  // game is in zh or ja, every ctx.font gets the stack added before its generic family, so signs, boards and the mini-map
  // draw the right glyphs (Japanese kanji shapes, not Chinese ones) without each file knowing.
  const FONTS = { zh: '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Noto Sans SC"',
    ja: '"Yu Gothic UI", "Yu Gothic", "Meiryo", "Hiragino Sans", "Noto Sans CJK JP", "Noto Sans JP"' };
  const font = l => FONTS[l || lang()] || '';
  (function canvasFonts() {
    if (typeof CanvasRenderingContext2D === 'undefined') return;
    const P = CanvasRenderingContext2D.prototype, d = Object.getOwnPropertyDescriptor(P, 'font');
    if (!d || !d.set || !d.get) return;
    const GEN = /,?\s*(sans-serif|serif|monospace|cursive|fantasy|system-ui)\s*$/i;
    Object.defineProperty(P, 'font', { configurable: true, enumerable: d.enumerable, get() { return d.get.call(this); },
      set(v) {
        const l = lang();
        if (isCJK(l) && typeof v === 'string' && !v.includes(l === 'zh' ? 'YaHei' : 'Yu Gothic')) {
          const m = v.match(GEN);
          v = m ? v.slice(0, m.index) + ', ' + FONTS[l] + ', ' + m[1] : v + ', ' + FONTS[l] + ', sans-serif';
        }
        d.set.call(this, v);
      } });
  })();
  (function css() {
    if (typeof document === 'undefined' || document.getElementById('cjk-css')) return;
    const s = document.createElement('style'); s.id = 'cjk-css';
    s.textContent = `
      [lang="zh-Hans"] { font-family: ${FONTS.zh}, sans-serif; }
      [lang="ja"] { font-family: ${FONTS.ja}, sans-serif; }
      .cjk ruby { ruby-position: over; ruby-align: center; }
      .cjk rt { font: 600 .58em/1.1 "Segoe UI", system-ui, sans-serif; letter-spacing: 0; opacity: .82; text-transform: none; }
      .cjk-ja rt { font-family: "Segoe UI", ${FONTS.ja}, sans-serif; }
      .cjk.cjk-ruby { line-height: 2.05; }
      .cjk rt.cjk-fade { animation: cjkfade 2.4s ease-in .8s forwards; }
      @keyframes cjkfade { to { opacity: 0; } }
      #cjk-ime { position: fixed; z-index: 40; display: none; max-width: min(560px, calc(100vw - 12px)); background: #fffaf0; color: #2b2235; border: 2.5px solid #2b2235;
        border-radius: 12px; padding: 6px 9px 7px; box-shadow: 0 5px 0 rgba(43,34,53,.2); font: 600 14px "Segoe UI", system-ui, sans-serif; pointer-events: auto; }
      #cjk-ime .ime-head { display: flex; align-items: baseline; gap: 10px; }
      #cjk-ime .ime-head b { font-size: 18px; border-bottom: 2px dotted #d6453a; }
      #cjk-ime .ime-head small { font-size: 11px; opacity: .6; }
      #cjk-ime .ime-list { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 5px; }
      #cjk-ime .ime-c { display: inline-flex; align-items: baseline; gap: 4px; padding: 2px 7px; border-radius: 8px; border: 2px solid rgba(43,34,53,.15); background: #fff; cursor: pointer; }
      #cjk-ime .ime-c.on, #cjk-ime .ime-c:hover { border-color: #2b2235; background: #fff3c4; }
      #cjk-ime .ime-c kbd { font: 800 10px "Segoe UI", sans-serif; opacity: .6; }
      #cjk-ime .ime-c b { font-size: 20px; color: #d6453a; } #cjk-ime .ime-c b i { font-size: 12px; opacity: .6; }
      #cjk-ime .ime-c small { font-size: 11px; opacity: .7; }
      #cjk-ime .ime-more { align-self: center; font-size: 11px; opacity: .55; }`;
    document.head.appendChild(s);
  })();
  // Say a zh / ja text (notation) with a zh-CN / ja-JP voice, in characters (a voice can't read pinyin). false: no voice.
  function say(src, l) {
    l = l || lang();
    if (typeof Sound === 'undefined' || !Sound.say || src == null) return false;
    if (!isCJK(l)) return Sound.say(String(src), l);
    const text = chars(src, { lang: l }).replace(/[{}]/g, '');
    return Sound.say(text, l === 'zh' ? 'zh-CN' : 'ja-JP') || Sound.say(text, l);
  }
  // pickLang (core.js): a table's text for a language, English (never Spanish) when zh / ja is missing. text(): the same,
  // as plain text in the mode (for a canvas).
  const pickT = (T, l, fb) => (typeof pickLang === 'function' ? pickLang(T, l, fb) : T && (T[l || lang()] || T.es));
  const text = (T, l, fb) => { l = l || lang(); const v = pickT(T, l, fb); return isCJK(l) && typeof v === 'string' ? plain(v, { lang: l }) : v; };
  const tag = (l, m) => (isCJK(l || lang()) ? LANGTAG[l || lang()][m || mode(l)] : (l || lang()));

  return { isCJK, lang, mode, setMode, bind, onChange, isHan, isKana, isPunct, hasCJK, toHira, toKata, toKana, romaji,
    toneless, markTone, toneOf, pyJoin, segment, parse, split, addSource, addNames, lookup, dict: D, ensure, morae, units, html, plain, len, roman, chars,
    canon, same, similar, contains, typed, wordOf, matchAt, looseK, THRESH, seen, used, known, learn, forget, mastery, stats, toJSON, fromJSON, reset, validate, validateAll,
    candidates, attachIME, ime: IME, font, FONTS, say, pick: pickT, text, tag,
    // tests: type into an attached box as if from the keyboard ('nihao ', with {Enter} {Tab} {Esc} {Backspace} {Shift} keys)
    _type(el, keys) {
      const K = { Enter: 'Enter', Tab: 'Tab', Esc: 'Escape', Backspace: 'Backspace', Down: 'ArrowDown', Up: 'ArrowUp' };
      for (const m of String(keys).matchAll(/\{(\w+)\}|./gu)) {
        const key = m[1] ? K[m[1]] || m[1] : m[0], ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        if (el.dispatchEvent(ev) && key.length === 1) { const a = el.selectionStart, b = el.selectionEnd; el.value = el.value.slice(0, a) + key + el.value.slice(b); el.setSelectionRange(a + 1, a + 1); fire(el); }
      }
      return el.value;
    } };
})();
