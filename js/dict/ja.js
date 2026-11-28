'use strict';
// ja: the Japanese dictionary pack (DESIGN.md 15.2; the contract is game/FLUENT.md, the notation game/CJK.md).
// DICT.register('ja', make): make() parses the word list at the bottom of this file (one headword per line), writes out
// every form of every verb and adjective (書く → 書きます 書いた 書いている 書きたい 書ける 書こう 書けば 書かれる 書かせる …,
// in kanji and in kana), links LEX's words and returns the pack (entries, tokens, analyze, check, fix, gloss, inflect,
// find, connectors, fillers).
//
// What you type can be kanji and kana, kana alone, or rōmaji (Hepburn or wāpuro, long vowels as ō, ou, oo, oh or left
// out), with or without spaces. It becomes a row of units (a kanji, a kana, a number, a Latin word, punctuation) and a
// lattice picks the cheapest cover by dictionary forms. Keys are loose about long vowels (がっこう = がっこ), は / を / へ
// typed as wa / o / e, and ぢ / づ, but only inside one word, so を + うって stays two words.
//
// A headword line:   食べる たべる vi1 eat @food =v.eat %vt,act
//   the word (#tag when two headwords share it) · its reading in hiragana (left out for a kana word) · part of speech +
//   band: n v adv pron det part conj num int cl name phrase, or a verb or adjective class: vg (godan) vi (ichidan)
//   vs (する) vk (来る) ai (い-adjective) an (な-adjective); 1 A1 (N5) … 4 B2 (N2) · the English · then any of:
//   #匹,頭 counters · @food tags · =v.eat LEX ids · + / - (val) · %flags: vt (takes を) · act (an action: done で a place)
//   · ni (existence or arrival: に a place) · place (a place you go to) · path (a way you go along) · tp / tf / tn (a
//   past / future / other time word) · tni (a time that takes に: 三時, 月曜日) · q (question word) · conn · hyp · fut ·
//   p1 p2 p3 (pronouns) · hon (さん, 先生) · ga (takes が for its object: 好き, わかる) · cop (です) · fill

(() => {
  if (typeof DICT === 'undefined' || typeof CJK === 'undefined') return;
  const W = [];                       // the word list, in chunks (the bottom of this file)
  const isHan = c => CJK.isHan(c), toHira = s => CJK.toHira(s), isKanaC = c => CJK.isKana(c);
  const hasHan = s => [...String(s)].some(isHan);

  // ------------------------------------------------------------ rōmaji → hiragana (CJK.toKana's rules), keeping each kana's place
  const ROMA = new Map(), addR = (r, k) => { if (r && !ROMA.has(r)) ROMA.set(r, k); };
  ('si=し ti=ち tu=つ hu=ふ zi=じ di=ぢ du=づ wo=を sya=しゃ syu=しゅ syo=しょ tya=ちゃ tyu=ちゅ tyo=ちょ cya=ちゃ cyu=ちゅ cyo=ちょ zya=じゃ zyu=じゅ '
    + 'zyo=じょ jya=じゃ jyu=じゅ jyo=じょ dya=ぢゃ dyu=ぢゅ dyo=ぢょ thi=てぃ dhi=でぃ la=ら li=り lu=る le=れ lo=ろ xa=ぁ xi=ぃ xu=ぅ xe=ぇ xo=ぉ '
    + 'xya=ゃ xyu=ゅ xyo=ょ xtu=っ xtsu=っ ltu=っ ltsu=っ xn=ん ca=か cu=く co=こ ci=し ce=せ').split(' ').forEach(p => { const [r, k] = p.split('='); addR(r, k); });
  for (let c = 0x3041; c <= 0x3094; c++) { const k = String.fromCharCode(c); if (!/[ぁぃぅぇぉゃゅょゎゐゑをぢづゕゖんっ]/.test(k)) addR(CJK.romaji(k), k); }
  [...'きぎしじちぢにひびぴみり'].forEach(k => [...'ゃゅょ'].forEach(s => addR(CJK.romaji(k + s), k + s)));
  ['しぇ', 'じぇ', 'ちぇ', 'てぃ', 'でぃ', 'とぅ', 'どぅ', 'ふぁ', 'ふぃ', 'ふぇ', 'ふぉ', 'うぃ', 'うぇ', 'ゔぁ', 'ゔぃ', 'ゔぇ', 'ゔぉ', 'つぁ', 'いぇ'].forEach(k => addR(CJK.romaji(k), k));
  const MAC = { 'ā': 'aa', 'â': 'aa', 'ī': 'ii', 'î': 'ii', 'ū': 'uu', 'û': 'uu', 'ē': 'ee', 'ê': 'ee', 'ō': 'ou', 'ô': 'ou' };
  // rōmaji s[i..j) → units { ch (hiragana), s, e } pushed on out; a letter that isn't rōmaji → { bad: true }
  function romaRun(s, i, j, out) {
    const L = [];
    for (let p = i; p < j; p++) { const c = s[p].toLowerCase(), m = MAC[c]; if (m) L.push({ c: m[0], p }, { c: m[1], p }); else L.push({ c, p }); }
    for (let q = 1; q < L.length; q++) if (L[q].c === 'h' && L[q - 1].c === 'o' && !/[aiueoy]/.test((L[q + 1] || {}).c || '')) L[q].c = 'u';      // (oh = ō)
    const put = (ch, a, b, x) => out.push(Object.assign({ ch, s: L[a].p, e: L[b].p + 1 }, x || {}));
    for (let q = 0; q < L.length;) {
      const c = L[q].c, c1 = (L[q + 1] || {}).c || '', c2 = (L[q + 2] || {}).c || '';
      if (c === "'" || c === '’') { q++; continue; }
      if (c === '-') { put('ー', q, q); q++; continue; }
      if (c === 'n' && !/[aiueoy]/.test(c1)) {
        if (c1 === "'" || c1 === '’') { put('ん', q, q + 1); q += 2; continue; }
        if (c1 === 'n') { const k = /[aiueoy]/.test(c2) ? 1 : 2; put('ん', q, q + k - 1); q += k; continue; }
        put('ん', q, q); q++; continue;
      }
      if (c === 'm' && /[bpm]/.test(c1)) { put('ん', q, q); q++; continue; }
      if ((c === c1 && /[bcdfghjkpqrstvwxyz]/.test(c)) || (c === 't' && c1 === 'c' && c2 === 'h')) { put('っ', q, q); q++; continue; }
      let k = Math.min(4, L.length - q), key = '';
      for (; k > 0; k--) { key = ''; for (let z = q; z < q + k; z++) key += L[z].c; if (ROMA.has(key)) break; }
      if (!k) { put(c, q, q, { bad: true }); q++; continue; }
      for (const ch of ROMA.get(key)) put(ch, q, q + k - 1);
      q += k;
    }
  }

  // ------------------------------------------------------------ loose keys: long vowels, は / を / へ, ぢ / づ
  const LOOSE = { 'は': 'わ', 'を': 'お', 'へ': 'え', 'ぢ': 'じ', 'づ': 'ず' };
  const VOW = {};
  for (let c = 0x3041; c <= 0x3094; c++) { const k = String.fromCharCode(c), r = CJK.romaji(k); if (/[aiueo]$/.test(r)) VOW[k] = r.slice(-1); }
  Object.assign(VOW, { 'ゃ': 'a', 'ゅ': 'u', 'ょ': 'o', 'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o' });
  // a kana that only stretches the one before it (ō: おう, おお; ū: うう; ē: えい, ええ; ā: ああ; ー)
  const isExt = (ch, prev) => { if (ch === 'ー') return true; const v = VOW[prev]; return (ch === 'う' && (v === 'o' || v === 'u')) || (ch === 'お' && v === 'o') || (ch === 'い' && (v === 'e' || v === 'i')) || (ch === 'え' && v === 'e') || (ch === 'あ' && v === 'a'); };
  // ティ / ディ / トゥ key as ち / じ / つ: «ti» is ち in wāpuro but ティ in Hepburn (pātī: パーティー)
  const SMALLX = { 'てぃ': 'ち', 'でぃ': 'じ', 'とぅ': 'つ' };
  // (no regexes: these run for every form of every word at build time; lkState / lkTail let a stem be keyed once)
  function lkState(str, prev = '') {
    str = String(str);
    let out = '';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      let c = str[i];
      if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf) || (code >= 0xf900 && code <= 0xfaff) || code === 0x3005) { out += c; prev = ''; continue; }
      if (code >= 0x30a1 && code <= 0x30f6) c = String.fromCharCode(code - 0x60);
      if (prev && SMALLX[prev + c]) { out = out.slice(0, -1) + SMALLX[prev + c]; prev = SMALLX[prev + c]; continue; }
      if (prev && isExt(c, prev)) { prev = 'ー'; continue; }          // (a long vowel is one stretch: けいえい is けえ, not け)
      out += LOOSE[c] || c; prev = c;
    }
    return [out, prev];
  }
  const looseKey = str => lkState(str)[0];
  const TAIL = new Map();          // an ending's key after a given kana (the same few dozen endings, again and again)
  function lkTail(x, prev) { const k = prev + '\u0001' + x; let v = TAIL.get(k); if (v === undefined) { v = lkState(x, prev)[0]; TAIL.set(k, v); } return v; }

  // ------------------------------------------------------------ the notation: 食べる + たべる → [食|た]べる
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function notate(s, r) {
    s = String(s); r = toHira(r || s);
    if (!hasHan(s)) return s;
    const parts = [];
    for (const c of s) { const h = isHan(c), p = parts[parts.length - 1]; if (p && p.h === h) p.t += c; else parts.push({ h, t: c }); }
    // (the usual shapes without a RegExp: 猫 · 食べる · お茶)
    if (parts.length === 1) return '[' + s + '|' + r + ']';
    if (parts.length === 2 && parts[0].h) { const k = toHira(parts[1].t); return r.endsWith(k) && r.length > k.length ? '[' + parts[0].t + '|' + r.slice(0, -k.length) + ']' + parts[1].t : null; }
    if (parts.length === 2 && parts[1].h) { const k = toHira(parts[0].t); return r.startsWith(k) && r.length > k.length ? parts[0].t + '[' + parts[1].t + '|' + r.slice(k.length) + ']' : null; }
    const m = r.match(new RegExp('^' + parts.map(p => (p.h ? '(.+?)' : '(' + escRe(toHira(p.t)) + ')')).join('') + '$'));
    if (!m) return null;
    return parts.map((p, k) => (p.h ? `[${p.t}|${m[k + 1]}]` : p.t)).join('');
  }

  // ------------------------------------------------------------ English forms (for glosses: 食べました → ate)
  const IRR = ('be was been;have had had;do did done;go went gone;come came come;eat ate eaten;drink drank drunk;see saw seen;say said said;'
    + 'speak spoke spoken;take took taken;give gave given;get got gotten;make made made;buy bought bought;sell sold sold;write wrote written;'
    + 'read read read;sleep slept slept;sit sat sat;stand stood stood;run ran run;swim swam swum;sing sang sung;think thought thought;'
    + 'know knew known;find found found;leave left left;meet met met;teach taught taught;begin began begun;bring brought brought;'
    + 'wear wore worn;win won won;lose lost lost;fly flew flown;fall fell fallen;feel felt felt;hear heard heard;hold held held;keep kept kept;'
    + 'put put put;send sent sent;tell told told;understand understood understood;become became become;break broke broken;choose chose chosen;'
    + 'draw drew drawn;drive drove driven;forget forgot forgotten;grow grew grown;hit hit hit;hurt hurt hurt;ride rode ridden;throw threw thrown;'
    + 'wake woke woken;cut cut cut;pay paid paid;catch caught caught;fight fought fought;build built built;lend lent lent;hang hung hung;'
    + 'blow blew blown;bite bit bitten;hide hid hidden;shake shook shaken;show showed shown;lie lay lain;ring rang rung;shut shut shut;'
    + 'learn learned learned;rise rose risen;can could could;spend spent spent;lead led led;sweep swept swept')
    .split(';').reduce((m, s) => { const [a, b, c] = s.split(' '); m[a] = [b, c]; return m; }, {});
  const DBL = new Set('stop plan shop drop chat jog hug rob nod beg clap hop skip step trip tap wrap swim sit run get cut set put hit win begin forget dig shut grab drag rub chop pat pet nap rip'.split(' '));
  const enVerb = en => { const s = String(en || '').split(/[,;/(]/)[0].trim().replace(/^to /, ''); const m = s.match(/^(\S+)(.*)$/); return m ? [m[1], m[2]] : ['', '']; };
  function enPast(en) { const [v, r] = enVerb(en); if (!v) return en; const p = IRR[v] ? IRR[v][0] : /e$/.test(v) ? v + 'd' : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + 'ied' : DBL.has(v) ? v + v.slice(-1) + 'ed' : v + 'ed'; return p + r; }
  function enPart(en) { const [v, r] = enVerb(en); if (!v) return en; return (IRR[v] ? IRR[v][1] : enPast(v)) + r; }
  function enIng(en) { const [v, r] = enVerb(en); if (!v) return en; return (v === 'be' ? 'being' : /ie$/.test(v) ? v.slice(0, -2) + 'ying' : /[^eoy]e$/.test(v) ? v.slice(0, -1) + 'ing' : DBL.has(v) ? v + v.slice(-1) + 'ing' : v + 'ing') + r; }
  const enBase = en => { const [v, r] = enVerb(en); return v ? v + r : en; };

  // ------------------------------------------------------------ the word list → entries
  const POSMAP = { n: ['n'], v: ['v'], vg: ['v', 'godan'], vi: ['v', 'ichidan'], vs: ['v', 'suru'], vk: ['v', 'kuru'], ai: ['adj', 'i-adj'], an: ['adj', 'na-adj'],
    adv: ['adv'], pron: ['pron'], det: ['det'], part: ['part'], conj: ['conj'], num: ['num'], int: ['int'], cl: ['cl'], name: ['name'], phrase: ['phrase'] };
  function parseLine(line, n) {
    const t = line.split(/\s+/);
    let head = t[0], tag = '';
    const h = head.indexOf('#');
    if (h > 0) { tag = head.slice(h + 1); head = head.slice(0, h); }
    let k = 1, read;
    if (/^[a-z]+[1-4]$/.test(t[1] || '')) read = toHira(head); else { read = t[1]; k = 2; }
    if (!read || !/^[ぁ-ゖー]+$/.test(read)) return null;
    const m = (t[k] || '').match(/^([a-z]+)([1-4])$/);
    if (!m || !POSMAP[m[1]]) return null;
    let lemma = notate(head, read);
    if (!lemma) return null;
    lemma = lemma.replace(/\]([はをへ])$/, '] $1');          // (実は: CJK.md wants a final は / を / へ as its own token)
    const [pos, cls] = POSMAP[m[1]];
    const e = { id: 'ja:' + head + (tag ? '#' + tag : ''), s: head, r: read, lemma, pos, cls: cls || null, band: +m[2], en: '', tags: [], fl: {}, n };
    const en = [];
    for (const x of t.slice(k + 1)) {
      if (x[0] === '#' && x.length > 1) { e.counters = x.slice(1).split(','); e.cl = e.counters[0]; }
      else if (x[0] === '@' && x.length > 1) e.tags.push(...x.slice(1).split(','));
      else if (x[0] === '=' && x.length > 1) { e.lexs = x.slice(1).split(','); e.lex = e.lexs[0]; }
      else if (x[0] === '%' && x.length > 1) x.slice(1).split(',').forEach(f => { e.fl[f] = true; });
      else if (x === '+' || x === '-') e.val = x;
      else en.push(x);
    }
    e.en = en.join(' ');
    return e;
  }

  // ------------------------------------------------------------ every form of a verb or adjective: [surface, reading, features, extra cost]
  const ROWS = { 'う': 'わいうえお', 'く': 'かきくけこ', 'ぐ': 'がぎぐげご', 'す': 'さしすせそ', 'つ': 'たちつてと', 'ぬ': 'なにぬねの', 'ぶ': 'ばびぶべぼ', 'む': 'まみむめも', 'る': 'らりるれろ' };
  const TE = { 'う': 'って', 'く': 'いて', 'ぐ': 'いで', 'す': 'して', 'つ': 'って', 'ぬ': 'んで', 'ぶ': 'んで', 'む': 'んで', 'る': 'って' };
  const past = te => te.slice(0, -1) + (te.slice(-1) === 'て' ? 'た' : 'だ');
  // the endings that hang off a verb's stems; st: { i (ます-stem), a (ない-stem), te, pot (可能 stem, ichidan-like), pass, caus, vol, ba, imp }
  // one table for every verb: [stem, ending, features (shared: never changed), extra cost]
  const VEND = [];
  {
    const V = (k, x, f, c) => VEND.push([k, x, Object.freeze(f), c || 0]);
    V('dict', '', { tense: 'pres', form: 'dict' });
    V('i', 'ます', { tense: 'pres', polite: true }); V('i', 'ません', { tense: 'pres', polite: true, neg: true });
    V('i', 'ました', { tense: 'past', polite: true }); V('i', 'ませんでした', { tense: 'past', polite: true, neg: true });
    V('i', 'ましょう', { mood: 'vol', polite: true }); V('i', 'ませんか', { tense: 'pres', polite: true, neg: true, q: true });
    V('ta', '', { tense: 'past' }); V('ta', 'り', { form: 'tari' });
    V('a', 'ない', { tense: 'pres', neg: true }); V('a', 'なかった', { tense: 'past', neg: true });
    V('a', 'ないで', { form: 'te', neg: true }); V('a', 'なくて', { form: 'te', neg: true });
    V('a', 'なければ', { cond: 'ba', neg: true }); V('a', 'なかったら', { cond: 'tara', neg: true });
    V('a', 'なくても', { form: 'te', neg: true, mo: true }); V('a', 'なく', { form: 'adv', neg: true });
    V('te', '', { form: 'te' }); V('te', 'も', { form: 'te', mo: true });
    // (very polite requests, one word with the verb: やっていただけませんか, 来てくださいますか; polite, never a mistake)
    for (const x of ['いただけませんか', 'いただけますか', 'いただけませんでしょうか', 'いただけますでしょうか', 'くださいませんか', 'くださいますか', 'くださいませんでしょうか', 'くださいますでしょうか'])
      V('te', x, { tense: 'pres', polite: true, q: true, req: true }, 0.2);
    [['いる', { tense: 'pres' }], ['います', { tense: 'pres', polite: true }], ['いた', { tense: 'past' }], ['いました', { tense: 'past', polite: true }],
      ['いない', { tense: 'pres', neg: true }], ['いません', { tense: 'pres', polite: true, neg: true }], ['いなかった', { tense: 'past', neg: true }],
      ['いませんでした', { tense: 'past', polite: true, neg: true }], ['る', { tense: 'pres' }], ['た', { tense: 'past' }], ['ない', { tense: 'pres', neg: true }],
      ['ます', { tense: 'pres', polite: true }]]
      .forEach(([x, f]) => V('te', x, Object.assign({ asp: 'prog' }, f)));
    [['たい', { tense: 'pres' }], ['たくない', { tense: 'pres', neg: true }], ['たかった', { tense: 'past' }], ['たくなかった', { tense: 'past', neg: true }],
      ['たいです', { tense: 'pres', polite: true }], ['たかったです', { tense: 'past', polite: true }], ['たくないです', { tense: 'pres', neg: true, polite: true }]]
      .forEach(([x, f]) => V('i', x, Object.assign({ want: true }, f)));
    // (potential: every form; the casual ら-less potential, passive and causative: the common ones)
    const KEEP = { pot: 'る ます ない ません た ました なかった て なかったら なくて', pot2: 'る ます ない ません', pass: 'る ます ない た ました て', caus: 'る ます ない ません た ました て' };
    for (const [k, b] of [['pot', { pot: true }], ['pot2', { pot: true }], ['pass', { pass: true }], ['caus', { caus: true }]])
      [['る', { tense: 'pres' }], ['ます', { tense: 'pres', polite: true }], ['ない', { tense: 'pres', neg: true }], ['ません', { tense: 'pres', polite: true, neg: true }],
        ['た', { tense: 'past' }], ['ました', { tense: 'past', polite: true }], ['なかった', { tense: 'past', neg: true }], ['て', { form: 'te' }],
        ['なかったら', { cond: 'tara', neg: true }], ['なくて', { form: 'te', neg: true }]]
        .forEach(([x, f]) => { if (KEEP[k].split(' ').includes(x)) V(k, x, Object.assign({}, f, b)); });
    V('pot', 'たら', { pot: true, cond: 'tara' });
    V('vol', '', { mood: 'vol' });
    V('ba', '', { cond: 'ba' }); V('ta', 'ら', { cond: 'tara' });
    V('imp', '', { mood: 'imp' });
    V('i', 'ながら', { form: 'nagara' });
    V('i', '', { form: 'stem' }, 0.6);
    // (〜ず / 〜ずに: without doing, 言わずに; 〜ちゃう / 〜じゃう: the casual 〜てしまう, 帰っちゃう, 読んじゃった)
    V('zu', 'ず', { neg: true, form: 'zu' }, 1); V('zu', 'ずに', { neg: true, form: 'zuni' }, 1);     // (a written form: みず is 水 before 見ず, みずに 水に)
    [['う', { tense: 'pres' }], ['った', { tense: 'past' }], ['います', { tense: 'pres', polite: true }], ['いました', { tense: 'past', polite: true }], ['って', { form: 'te' }]]
      .forEach(([x, f]) => V('cha', x, Object.assign({ chau: true }, f)));
  }
  function verbEndings(st) {
    const out = [];
    for (const [k, x, f, c] of VEND) { const s = st[k]; if (s != null) out.push([s + x, f, c]); }
    return out;
  }
  // a verb's stems from its dictionary form (in kanji or in kana) → verbEndings; kuru changes its kana (来る くる / 来ます きます)
  function verbStems(d, cls, kana) {
    const o = stems0(d, cls, kana);
    if (o) { o.ta = past(o.te); o.cha = o.te.slice(0, -1) + (o.te.slice(-1) === 'で' ? 'じゃ' : 'ちゃ'); }
    return o;
  }
  // (the honorific -aru verbs: ございます, くださいます, いらっしゃいます, おっしゃい, なさい)
  const HON_ARU = /(ござる|くださる|下さる|いらっしゃる|おっしゃる|仰る|なさる)$/;
  function stems0(d, cls, kana) {
    if (cls === 'suru') {
      const P = d.slice(0, -2);
      return { dict: d, i: P + 'し', a: P + 'し', zu: P + 'せ', te: P + 'して', pot: P + 'でき', pass: P + 'され', caus: P + 'させ', vol: P + 'しよう', ba: P + 'すれば', imp: P + 'しろ' };
    }
    if (cls === 'kuru') {            // (来る keeps its kanji and changes its reading: [来|き]ます, [来|こ]ない)
      const P = d.slice(0, -2), k = c => P + (kana ? c : '来');
      return { dict: d, i: k('き'), a: k('こ'), zu: k('こ'), te: k('き') + 'て', pot: k('こ') + 'られ', pot2: k('こ') + 'れ', pass: k('こ') + 'られ', caus: k('こ') + 'させ', vol: k('こ') + 'よう', ba: k('く') + 'れば', imp: k('こ') + 'い' };
    }
    if (cls === 'ichidan') {
      const S = d.slice(0, -1);
      return { dict: d, i: S, a: S, zu: S, te: S + 'て', pot: S + 'られ', pot2: S + 'れ', caus: S + 'させ', vol: S + 'よう', ba: S + 'れば', imp: S + 'ろ' };
    }
    const last = d.slice(-1), R = ROWS[last];
    if (!R) return null;
    const S = d.slice(0, -1), hon = last === 'る' && HON_ARU.test(d);
    let te = S + TE[last];
    if (/(行|い|ゆ)く$/.test(d) && (d === '行く' || d === 'いく' || d === 'ゆく' || /行く$/.test(d))) te = S + 'って';
    return { dict: d, i: hon ? S + 'い' : S + R[1], a: d === 'ある' ? '' : S + R[0], zu: d === 'ある' ? null : S + R[0], te, pot: S + R[3], pass: S + R[0] + 'れ', caus: S + R[0] + 'せ', vol: S + R[4] + 'う', ba: S + R[3] + 'ば', imp: hon ? S + 'い' : S + R[3] };
  }
  function adjForms(e) {          // [surface, reading, f, cost] for an い- or な-adjective
    const out = [];
    if (e.cls === 'i-adj') {
      // (a word that ends in いい bends like いい: かっこいい → かっこよかった, 気持ちいい → 気持ちよくない)
      const yoi = e.s !== 'いい' && /いい$/.test(e.s) && /いい$/.test(e.r);
      const bases = e.s === 'いい' || e.s === '良い' ? [['よ', 'よ'], ['良', 'よ']] : yoi ? [[e.s.slice(0, -2) + 'よ', e.r.slice(0, -2) + 'よ']] : [[e.s.slice(0, -1), e.r.slice(0, -1)]];
      if (e.s === 'いい' || yoi) { out.push([e.s, e.r, { tense: 'pres' }, 0], [e.s + 'です', e.r + 'です', { tense: 'pres', polite: true }, 0]); }
      for (const [bs, br] of bases) [['い', { tense: 'pres' }], ['いです', { tense: 'pres', polite: true }], ['くない', { tense: 'pres', neg: true }],
        ['かった', { tense: 'past' }], ['くなかった', { tense: 'past', neg: true }], ['くて', { form: 'te' }], ['く', { form: 'adv' }], ['ければ', { cond: 'ba' }],
        ['かったら', { cond: 'tara' }], ['くありません', { tense: 'pres', neg: true, polite: true }], ['くありませんでした', { tense: 'past', neg: true, polite: true }],
        ['くないです', { tense: 'pres', neg: true, polite: true }], ['かったです', { tense: 'past', polite: true }], ['くなかったです', { tense: 'past', neg: true, polite: true }],
        ['そう', { form: 'sou' }], ['すぎる', { form: 'too' }], ['さ', { form: 'noun' }], ['くなくて', { form: 'te', neg: true }], ['くなく', { form: 'adv', neg: true }], ['くても', { form: 'te', mo: true }]]
        .forEach(([x, f]) => { if (!((e.s === 'いい' && bs === 'よ' || yoi) && /^い/.test(x))) out.push([bs + x, br + x, f, 0]); });
      return out;
    }
    const S = e.s, R = e.r;
    [['', { form: 'stem' }], ['な', { form: 'attr' }], ['に', { form: 'adv' }], ['だ', { tense: 'pres' }], ['です', { tense: 'pres', polite: true }],
      ['でした', { tense: 'past', polite: true }], ['だった', { tense: 'past' }], ['じゃない', { tense: 'pres', neg: true }], ['ではない', { tense: 'pres', neg: true }],
      ['じゃないです', { tense: 'pres', neg: true, polite: true }], ['じゃありません', { tense: 'pres', neg: true, polite: true }], ['ではありません', { tense: 'pres', neg: true, polite: true }],
      ['じゃなかった', { tense: 'past', neg: true }], ['ではなかった', { tense: 'past', neg: true }], ['じゃありませんでした', { tense: 'past', neg: true, polite: true }],
      ['ではありませんでした', { tense: 'past', neg: true, polite: true }], ['で', { form: 'te' }], ['なら', { cond: 'nara' }], ['でしょう', { mood: 'vol', polite: true }],
      ['じゃなくて', { form: 'te', neg: true }], ['ではなくて', { form: 'te', neg: true }], ['じゃなくても', { form: 'te', neg: true, mo: true }], ['さ', { form: 'noun' }]]
      .forEach(([x, f]) => out.push([S + x, R + x, f, 0]));
    if (/い$/.test(S)) {        // a な-adjective that looks like an い-one (きれい, きらい): the forms learners make by mistake
      const s0 = S.slice(0, -1), r0 = R.slice(0, -1);
      [[S + 'くない', R + 'くない', { tense: 'pres', neg: true }, 'じゃない'], [s0 + 'くない', r0 + 'くない', { tense: 'pres', neg: true }, 'じゃない'],
        [S + 'かった', R + 'かった', { tense: 'past' }, 'だった'], [s0 + 'かった', r0 + 'かった', { tense: 'past' }, 'だった'],
        [s0 + 'かったです', r0 + 'かったです', { tense: 'past', polite: true }, 'でした'], [S + 'くないです', R + 'くないです', { tense: 'pres', neg: true, polite: true }, 'じゃないです']]
        .forEach(([s, r, f, right]) => out.push([s, r, Object.assign({ err: 'na', right }, f), 0.3]));
    }
    return out;
  }
  // the copula: だ / です and their forms (one headword, 'ja:です')
  const COP = [['だ', { tense: 'pres' }], ['です', { tense: 'pres', polite: true }], ['でした', { tense: 'past', polite: true }], ['だった', { tense: 'past' }],
    ['じゃない', { tense: 'pres', neg: true }], ['ではない', { tense: 'pres', neg: true }], ['じゃないです', { tense: 'pres', neg: true, polite: true }],
    ['じゃありません', { tense: 'pres', neg: true, polite: true }], ['ではありません', { tense: 'pres', neg: true, polite: true }], ['じゃなかった', { tense: 'past', neg: true }],
    ['ではなかった', { tense: 'past', neg: true }], ['じゃありませんでした', { tense: 'past', neg: true, polite: true }], ['ではありませんでした', { tense: 'past', neg: true, polite: true }],
    ['でしょう', { mood: 'vol', polite: true }], ['だろう', { mood: 'vol' }], ['なら', { cond: 'nara' }], ['である', { tense: 'pres' }], ['でしたら', { cond: 'tara', polite: true }], ['だったら', { cond: 'tara' }],
    ['じゃなくて', { form: 'te', neg: true }], ['ではなくて', { form: 'te', neg: true }], ['じゃなくても', { form: 'te', neg: true, mo: true }]];

  // ------------------------------------------------------------ numbers and counters
  const NUMK = { '零': 0, '〇': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '百': 100, '千': 1000, '万': 10000 };
  function numVal(chars) {
    let total = 0, sec = 0, cur = 0;
    for (const c of chars) { const d = NUMK[c]; if (d < 10) cur = cur * 10 + d; else if (d < 10000) { sec += (cur || 1) * d; cur = 0; } else { total += ((sec + cur) || 1) * d; sec = 0; cur = 0; } }
    return total + sec + cur;
  }
  const KNUM = n => { const o = '〇一二三四五六七八九'; if (n <= 10) return n === 10 ? '十' : o[n]; const t = Math.floor(n / 10), u = n % 10; return (t > 1 ? o[t] : '') + '十' + (u ? o[u] : ''); };
  // number words in kana, 1–99 and round hundreds and thousands
  const KANA_NUM = new Map();
  {
    const ones = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'], alt = { 4: ['し', 'よ'], 7: ['しち'], 9: ['く'] };
    const tens = ['', 'じゅう', 'にじゅう', 'さんじゅう', 'よんじゅう', 'ごじゅう', 'ろくじゅう', 'ななじゅう', 'はちじゅう', 'きゅうじゅう'];
    for (let n = 1; n < 100; n++) {
      const t = Math.floor(n / 10), u = n % 10;
      [ones[u]].concat(n < 10 ? alt[u] || [] : (alt[u] || []).filter(x => x !== 'よ')).forEach(o => KANA_NUM.set(tens[t] + o, n));
    }
    'ひゃく にひゃく さんびゃく よんひゃく ごひゃく ろっぴゃく ななひゃく はっぴゃく きゅうひゃく'.split(' ').forEach((k, i) => KANA_NUM.set(k, (i + 1) * 100));
    'せん にせん さんぜん よんせん ごせん ろくせん ななせん はっせん きゅうせん'.split(' ').forEach((k, i) => KANA_NUM.set(k, (i + 1) * 1000));
    'いちまん にまん さんまん よんまん ごまん じゅうまん ひゃくまん'.split(' ').forEach((k, i) => KANA_NUM.set(k, [10000, 20000, 30000, 40000, 50000, 100000, 1000000][i]));
    KANA_NUM.set('れい', 0); KANA_NUM.set('ぜろ', 0); KANA_NUM.set('ゼロ', 0);
  }
  // counters: the reading for 1–10 and 何 (sound changes included); then the reading after a bigger number
  const CNT = {
    'つ': ['ひとつ ふたつ みっつ よっつ いつつ むっつ ななつ やっつ ここのつ とお いくつ', 'つ'],
    '人': ['ひとり ふたり さんにん よにん ごにん ろくにん ななにん はちにん きゅうにん じゅうにん なんにん', 'にん'],
    '匹': ['いっぴき にひき さんびき よんひき ごひき ろっぴき ななひき はっぴき きゅうひき じゅっぴき なんびき', 'ひき'],
    '本': ['いっぽん にほん さんぼん よんほん ごほん ろっぽん ななほん はっぽん きゅうほん じゅっぽん なんぼん', 'ほん'],
    '杯': ['いっぱい にはい さんばい よんはい ごはい ろっぱい ななはい はっぱい きゅうはい じゅっぱい なんばい', 'はい'],
    '冊': ['いっさつ にさつ さんさつ よんさつ ごさつ ろくさつ ななさつ はっさつ きゅうさつ じゅっさつ なんさつ', 'さつ'],
    '枚': ['いちまい にまい さんまい よんまい ごまい ろくまい ななまい はちまい きゅうまい じゅうまい なんまい', 'まい'],
    '個': ['いっこ にこ さんこ よんこ ごこ ろっこ ななこ はっこ きゅうこ じゅっこ なんこ', 'こ'],
    '台': ['いちだい にだい さんだい よんだい ごだい ろくだい ななだい はちだい きゅうだい じゅうだい なんだい', 'だい'],
    '回': ['いっかい にかい さんかい よんかい ごかい ろっかい ななかい はっかい きゅうかい じゅっかい なんかい', 'かい'],
    '階': ['いっかい にかい さんがい よんかい ごかい ろっかい ななかい はっかい きゅうかい じゅっかい なんがい', 'かい'],
    '歳': ['いっさい にさい さんさい よんさい ごさい ろくさい ななさい はっさい きゅうさい じゅっさい なんさい', 'さい'],
    '時': ['いちじ にじ さんじ よじ ごじ ろくじ しちじ はちじ くじ じゅうじ なんじ', 'じ'],
    '分': ['いっぷん にふん さんぷん よんぷん ごふん ろっぷん ななふん はっぷん きゅうふん じゅっぷん なんぷん', 'ふん'],
    '円': ['いちえん にえん さんえん よえん ごえん ろくえん ななえん はちえん きゅうえん じゅうえん なんえん', 'えん'],
    '年': ['いちねん にねん さんねん よねん ごねん ろくねん ななねん はちねん きゅうねん じゅうねん なんねん', 'ねん'],
    '日': ['ついたち ふつか みっか よっか いつか むいか なのか ようか ここのか とおか なんにち', 'にち'],
    '月#month': ['いちがつ にがつ さんがつ しがつ ごがつ ろくがつ しちがつ はちがつ くがつ じゅうがつ なんがつ', 'がつ'],
    'か月': ['いっかげつ にかげつ さんかげつ よんかげつ ごかげつ ろっかげつ ななかげつ はっかげつ きゅうかげつ じゅっかげつ なんかげつ', 'かげつ'],
    '時間': ['いちじかん にじかん さんじかん よじかん ごじかん ろくじかん ななじかん はちじかん くじかん じゅうじかん なんじかん', 'じかん'],
    '週間': ['いっしゅうかん にしゅうかん さんしゅうかん よんしゅうかん ごしゅうかん ろくしゅうかん ななしゅうかん はっしゅうかん きゅうしゅうかん じゅっしゅうかん なんしゅうかん', 'しゅうかん'],
    '番': ['いちばん にばん さんばん よんばん ごばん ろくばん ななばん はちばん きゅうばん じゅうばん なんばん', 'ばん'],
    '度': ['いちど にど さんど よんど ごど ろくど ななど はちど きゅうど じゅうど なんど', 'ど'],
    '足': ['いっそく にそく さんぞく よんそく ごそく ろくそく ななそく はっそく きゅうそく じゅっそく なんぞく', 'そく'],
    '着': ['いっちゃく にちゃく さんちゃく よんちゃく ごちゃく ろくちゃく ななちゃく はっちゃく きゅうちゃく じゅっちゃく なんちゃく', 'ちゃく'],
    '軒': ['いっけん にけん さんげん よんけん ごけん ろっけん ななけん はっけん きゅうけん じゅっけん なんげん', 'けん'],
    '頭': ['いっとう にとう さんとう よんとう ごとう ろくとう ななとう はっとう きゅうとう じゅっとう なんとう', 'とう'],
    '羽': ['いちわ にわ さんわ よんわ ごわ ろくわ ななわ はちわ きゅうわ じゅうわ なんわ', 'わ'],
    '通': ['いっつう につう さんつう よんつう ごつう ろくつう ななつう はっつう きゅうつう じゅっつう なんつう', 'つう'],
    '曲': ['いっきょく にきょく さんきょく よんきょく ごきょく ろっきょく ななきょく はっきょく きゅうきょく じゅっきょく なんきょく', 'きょく'],
    '部': ['いちぶ にぶ さんぶ よんぶ ごぶ ろくぶ ななぶ はちぶ きゅうぶ じゅうぶ なんぶ', 'ぶ'],
  };
  const CNT_EN = { 'つ': 'things', '人': 'people', '匹': 'small animals', '本': 'long things', '杯': 'cups, glasses', '冊': 'books', '枚': 'flat things', '個': 'small things',
    '台': 'machines, vehicles', '回': 'times', '階': 'floors', '歳': 'years old', '時': "o'clock", '分': 'minutes', '円': 'yen', '年': 'years', '日': 'days; the date',
    '月#month': 'month (of the year)', 'か月': 'months', '時間': 'hours', '週間': 'weeks', '番': 'number', '度': 'times; degrees', '足': 'pairs (shoes, socks)',
    '着': 'clothes', '軒': 'houses', '頭': 'large animals', '羽': 'birds', '通': 'letters', '曲': 'songs, pieces of music', '部': 'copies' };
  // what a counter is called, and the counter you'd use for a 1–10 form: say(cnt, n) → the reading
  const cntSay = (c, n) => { const T = CNT[c]; if (!T) return null; const L = T[0].split(' '); return n >= 1 && n <= 10 ? L[n - 1] : null; };

  // a form of a headword: its stem (as written and as read) + an ending; s and r are built only when asked for
  class Rec {
    constructor(e, f, ss, rs, x, c) { this.e = e; this.f = f; this.ss = ss; this.rs = rs; this.x = x; this.c = c; }
    get s() { return this.ss + this.x; }
    get r() { return this.rs + this.x; }
  }

  // ------------------------------------------------------------ the pack
  function make() {
    const E = new Map(), F = new Map(), bad = [], dups = [], T0 = performance.now(), PT = {};
    let order = 0, maxLen = 1;
    const push = (k, v) => { let a = F.get(k); if (!a) F.set(k, a = []); a.push(v); if (k.length > maxLen) maxLen = k.length; };
    function addForm(e, s, r, f, c) {
      const rec = new Rec(e, f, s, r || s, '', c || 0);
      const k1 = looseKey(s);
      push(k1, rec);
      if (r && r !== s) { const k2 = looseKey(r); if (k2 !== k1) push(k2, rec); }
    }
    // Verbs and adjectives: the build only indexes where their forms start (STEMS: 書 / か for 書く); every form is written
    // out the first time typed text reaches that stem (expand), so the cost is paid word by word, as the words are used.
    const STEMS = new Map();
    let lazyN = 0;
    function expand(e) {
      if (e._x) return;
      e._x = true;
      if (e.pos !== 'v') { adjForms(e).forEach(([s, r, f, c]) => addForm(e, s, r, f, c)); return; }
      const SS = verbStems(e.s, e.cls, !hasHan(e.s)), RS = verbStems(e.r, e.cls, true);
      const cs = {}, cr = {};
      for (const [k, x, f, c] of VEND) {
        const ss = SS[k], rs = RS[k];
        if (ss == null || rs == null) continue;
        const A = cs[k] || (cs[k] = lkState(ss)), B = cr[k] || (cr[k] = lkState(rs));
        const k1 = A[0] + lkTail(x, A[1]), k2 = ss === rs ? k1 : B[0] + lkTail(x, B[1]), rec = new Rec(e, f, ss, rs, x, c);
        push(k1, rec);
        if (k2 !== k1) push(k2, rec);
      }
      if (e.cls === 'suru' && e.s.length > 2) addForm(e, e.s.slice(0, -2), e.r.slice(0, -2), { form: 'noun' }, 0);
    }
    // the keys a word's forms all start with: the common part of its stems, as written and as read (来る: 来; くる: く き こ)
    function stemKeys(e) {
      const out = new Set();
      if (e.pos === 'v') {
        for (const [d, kana] of [[e.s, !hasHan(e.s)], [e.r, true]]) {
          const st = verbStems(d, e.cls, kana), vals = ['dict', 'i', 'a', 'te', 'ta', 'pot', 'pass', 'caus', 'vol', 'ba', 'imp'].map(k => st[k]).filter(v => v);
          let pre = vals[0] || '';
          for (const v of vals) { let k = 0; while (k < pre.length && k < v.length && pre[k] === v[k]) k++; pre = pre.slice(0, k); }
          if (pre) out.add(looseKey(pre)); else vals.forEach(v => out.add(looseKey(v.slice(0, 1))));
        }
      } else if (e.cls === 'i-adj') (e.s === 'いい' || e.s === '良い' ? ['い', 'よ', '良'] : /いい$/.test(e.s) && /いい$/.test(e.r) ? [e.s.slice(0, -2), e.r.slice(0, -2)]
        : [e.s.slice(0, -1) || e.s.slice(0, 1), e.r.slice(0, -1) || e.r.slice(0, 1)]).forEach(b => out.add(looseKey(b)));
      else { out.add(looseKey(e.s)); out.add(looseKey(e.r)); }
      out.delete('');
      return out;
    }
    const ensure = key => { for (let p = 1; p <= key.length; p++) { const se = STEMS.get(key.slice(0, p)); if (se) for (const e of se) if (!e._x) expand(e); } };
    // (for a word written out exactly, like LEX's [跳|と]んで: only the words whose written stems it starts with; a form's
    //  surface is its written stem + an ending, so nothing else can be it, and the build stays quick)
    function writtenStems(e) {
      if (e._ws !== undefined) return e._ws;
      let w;
      if (e.pos !== 'v') w = e.cls === 'na-adj' ? [e.s] : e.s === 'いい' || e.s === '良い' ? ['い', 'よ', '良'] : /いい$/.test(e.s) ? [e.s.slice(0, -2)] : [e.s.slice(0, -1)];
      else {
        const st = verbStems(e.s, e.cls, !hasHan(e.s));
        w = st ? [...new Set(Object.values(st).filter(v => v))] : null;
        if (w && e.cls === 'suru') w.push(e.s.slice(0, -2));
      }
      return (e._ws = w ? w.filter(x => x) : null);
    }
    const mayForm = (e, s) => { const w = writtenStems(e); return !w || w.some(x => s.startsWith(x)); };
    // (→ the word itself when it's written in its dictionary form, 回す: nothing needs writing out for that)
    const ensureFor = (s, key) => {
      for (let p = 1; p <= key.length; p++) { const se = STEMS.get(key.slice(0, p)); if (se) for (const e of se) if (e.s === s) return e; }
      for (let p = 1; p <= key.length; p++) { const se = STEMS.get(key.slice(0, p)); if (se) for (const e of se) if (!e._x && mayForm(e, s)) expand(e); }
      return null;
    };
    function addEntry(e) {
      E.set(e.id, e);
      if ((e.pos === 'v' || e.pos === 'adj') && e.cls) {
        if (e.pos === 'v' && (!verbStems(e.s, e.cls, !hasHan(e.s)) || !verbStems(e.r, e.cls, true))) { addForm(e, e.s, e.r, {}, 0); return; }
        for (const k of stemKeys(e)) { let a = STEMS.get(k); if (!a) STEMS.set(k, a = []); a.push(e); if (k.length + 14 > maxLen) maxLen = k.length + 14; }
        lazyN++;
      } else if (e.fl.cop) COP.forEach(([s, f]) => addForm(e, s, s, f, 0));
      else addForm(e, e.s, e.r, {}, 0);
    }
    for (const chunk of W) for (const raw of chunk.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('//')) continue;
      const e = parseLine(line, order++);
      if (!e) { bad.push(line); continue; }
      if (E.has(e.id)) { dups.push(e.id); continue; }
      addEntry(e);
    }
    PT.words = Math.round(performance.now() - T0);
    // the counters, with every 1–10 form (三匹 さんびき) and 何 (何匹 なんびき)
    for (const key of Object.keys(CNT)) {
      const c = key.split('#')[0], [list, base] = CNT[key], id = 'ja:' + key;
      if (E.has(id)) continue;
      const e = { id, s: c, r: base, lemma: notate(c, base) || c, pos: 'cl', cls: null, band: /^(つ|人|匹|本|枚|個|円|時|分|歳|年|月#month|日|回)$/.test(key) ? 1 : 2,
        en: '(counts ' + CNT_EN[key] + ')', tags: ['number'], fl: { cnt: true }, n: order++, counter: key };
      E.set(id, e);
      addForm(e, c, base, { counter: key }, 0.1);
      list.split(' ').forEach((r, k) => {
        if (k === 10) { addForm(e, (c === 'つ' ? '' : '何') + c, r, { counter: key, num: null, q: true }, 0.1); return; }
        const n = k + 1, s = c === 'つ' && n === 10 ? '十' : KNUM(n) + c;
        addForm(e, s, r, { counter: key, num: n }, 0.1);
      });
    }
    const NUMF = new Map();
    for (const [k, v] of KANA_NUM) NUMF.set(looseKey(k), v);
    const first = s => { const k = looseKey(s); ensure(k); return (F.get(k) || []).find(r => r.s === s || r.r === s) || null; };

    // ------------------------------------------------------------ LEX's words (every one resolves to a headword)
    const linked = new Set();
    for (const e of E.values()) if (e.lexs) e.lexs.forEach(x => linked.add(x));
    let lexN = -1, autoN = 0;
    const plainOf = src => CJK.parse(src, 'ja').filter(t => t.segs).map(t => t.s).join('');
    const readOf = src => CJK.parse(src, 'ja').filter(t => t.segs).map(t => t.r || toHira(t.s)).join('');
    function syncLex() {
      if (typeof LEX === 'undefined' || !LEX.ids) return;
      const ids = LEX.ids();
      if (ids.length === lexN) return;
      lexN = ids.length;
      for (const id of ids) {
        if (linked.has(id)) continue;
        const it = LEX.item(id);
        if (!it || typeof it.ja !== 'string' || !it.ja) continue;
        linked.add(id);
        const toks = CJK.parse(it.ja, 'ja').filter(t => t.segs);
        const s = toks.map(t => t.s).join(''), r = toks.map(t => t.r || toHira(t.s)).join('');
        if (!s) continue;
        const one = toks.length === 1, k0 = looseKey(s);
        const look = () => (F.get(k0) || []).find(x => x.s === s && x.e.pos !== 'part');
        let hit = one ? look() : null;
        if (one && !hit) { const d = ensureFor(s, k0); hit = d ? { e: d } : look(); }          // (a verb's form, like [跳|と]んで: write out only the words it could be)
        if (hit) { const e = hit.e; if (!e.lex) e.lex = id; (e.lexs = e.lexs || []).push(id); continue; }
        const e = { id: 'ja:' + s + (E.has('ja:' + s) ? '#' + id : ''), s, r, lemma: one ? (notate(s, r) || it.ja) : it.ja, pos: one && it.kind !== 'phrase' ? (it.kind === 'verb' ? 'v' : 'n') : 'phrase',
          cls: null, band: it.kind === 'phrase' ? 3 : 2, en: it.en || '', tags: [], fl: {}, lex: id, lexs: [id], n: order++, auto: true };
        E.set(e.id, e);
        addForm(e, s, r, {}, one ? 0 : 0.5);
        autoN++;
      }
    }
    PT.counters = Math.round(performance.now() - T0);
    syncLex();
    PT.lex = Math.round(performance.now() - T0);

    // ------------------------------------------------------------ typed text → units
    // { k: 'han', ch } · { k: 'kana', ch (hiragana), kata, rom (typed in rōmaji), cap } · { k: 'num', v } · { k: 'latin', t, cap } · { k: 'punct', p };
    // all with s, e (the span in the text) and gap (a space before it); notation adds hard (a word starts here) and grp
    const FWD = c => (c >= '０' && c <= '９' ? String.fromCharCode(c.charCodeAt(0) - 0xFEE0) : c);
    // a name's honorific typed in rōmaji: «Wataru-san», «Matsuoka-sensei», or «Wataru san» after a capitalized word
    const HON_R = /^(san|chan|kun|sama|sensei|sensē|senpai|sempai|dono)$/i, HON_TAIL = /^(.+?)-(san|chan|kun|sama|sensei|sensē|senpai|sempai|dono)$/i;
    function unitize(text) {
      const X = [], N = text.length;
      let gap = false, lastRun = null;
      // rōmaji text[a..b) → kana units (one run), or one Latin unit; → the run's first unit (null for a Latin one)
      const romaPush = (a, b, gap0) => {
        const out = [], cap = /[A-ZĀĪŪĒŌ]/.test(text[a]);
        romaRun(text, a, b, out);
        if (!out.length || out.some(u => u.bad)) { X.push({ k: 'latin', t: text.slice(a, b), s: a, e: b, gap: gap0, cap }); return null; }
        const k0 = X.length;
        out.forEach((u, q) => X.push({ k: 'kana', ch: u.ch, s: u.s, e: u.e, gap: q ? false : gap0, rom: true, run: a, first: !q, cap: !q && cap }));
        return X[k0];
      };
      for (let i = 0; i < N;) {
        const c = text[i];
        if (/\s/.test(c)) { gap = true; i++; continue; }
        if (/[A-Za-zāīūēōâîûêôĀĪŪĒŌ]/.test(c)) {
          let j = i;
          while (j < N && /[A-Za-zāīūēōâîûêôĀĪŪĒŌ'’-]/.test(text[j])) j++;
          const tok = text.slice(i, j), hm = tok.match(HON_TAIL);
          if (hm) {             // (the word before the honorific is a name, whatever it spells: 渡る, 待つ…)
            const h = i + hm[1].length, u0 = romaPush(i, h, gap);
            if (u0) u0.honNext = true;
            romaPush(h + 1, j, true);
            lastRun = null;
          } else {
            if (HON_R.test(tok) && lastRun && lastRun.cap && gap) lastRun.honNext = true;
            lastRun = romaPush(i, j, gap);
          }
          gap = false; i = j; continue;
        }
        lastRun = null;
        if (isHan(c)) { X.push({ k: 'han', ch: c, s: i, e: i + 1, gap }); gap = false; i++; continue; }
        if (isKanaC(c)) { X.push({ k: 'kana', ch: toHira(c), s: i, e: i + 1, gap, kata: /[ァ-ヺ]/.test(c) }); gap = false; i++; continue; }
        if (/[0-9０-９]/.test(c)) { let j = i, v = ''; while (j < N && /[0-9０-９]/.test(text[j])) { v += FWD(text[j]); j++; } X.push({ k: 'num', v: +v, s: i, e: j, gap }); gap = false; i = j; continue; }
        let j = i + 1;
        if ('…。.!！?？、,'.includes(c)) while (j < N && text[j] === c) j++;
        X.push({ k: 'punct', p: text.slice(i, j), s: i, e: j, gap }); gap = false; i = j;
      }
      return X;
    }
    function unitizeSrc(src) {
      const X = [];
      let text = '', grp = 0, prevLatin = false;
      for (const t of CJK.parse(src, 'ja')) {
        if (t.kind === 'slot') continue;
        if (t.kind === 'latin') {
          if (prevLatin && t.sp) text += ' ';
          const s0 = text.length; text += t.s;
          X.push(/^[0-9]+$/.test(t.s) ? { k: 'num', v: +t.s, s: s0, e: text.length, gap: true } : { k: 'latin', t: t.s, s: s0, e: text.length, gap: true, cap: /^[A-Z]/.test(t.s) });
          prevLatin = true; continue;
        }
        prevLatin = false;
        if (t.kind === 'punct') { const s0 = text.length; text += t.s; X.push({ k: 'punct', p: t.s, s: s0, e: text.length, gap: true }); continue; }
        if (!t.segs) continue;
        grp++;
        let firstU = true;
        for (const g of t.segs) for (const c of g.s) {
          const s0 = text.length; text += c;
          X.push(isHan(c) ? { k: 'han', ch: c, s: s0, e: text.length, gap: firstU, hard: firstU, grp } : { k: 'kana', ch: toHira(c), s: s0, e: text.length, gap: firstU, hard: firstU, grp, kata: /[ァ-ヺ]/.test(c) });
          firstU = false;
        }
      }
      return { text, X };
    }

    // ------------------------------------------------------------ the cheapest cover
    const recCost = r => 1 + 0.12 * (r.e.band - 1) + r.c + (r.e.pos === 'part' ? -0.05 : 0) + (r.e.fl.top ? -0.05 : 0);
    // rōmaji's "as spelled": long vowels written one way (ー as its vowel, おう as おお, えい as ええ), so ō, ou, oo and ー match
    const VK = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' }, SEMIR = new Map();
    function semiR(s) {
      let k = SEMIR.get(s);
      if (k !== undefined) return k;
      k = '';
      let pv = '';
      for (const c0 of semi(s)) {
        let c = c0;
        if (c === 'ー') c = VK[pv] || c;
        else if (c === 'う' && pv === 'o') c = 'お';
        else if (c === 'い' && pv === 'e') c = 'え';
        k += c;
        pv = VOW[c] || (c === 'っ' || c === 'ん' ? pv : '');
      }
      SEMIR.set(s, k);
      return k;
    }
    // a form as spelled (katakana as hiragana, は / を / へ as わ / お / え), long vowels kept: for exact matching
    const SEMI = new Map();
    function semi(s) {
      let k = SEMI.get(s);
      if (k !== undefined) return k;
      k = '';
      for (let q = 0; q < s.length; q++) { const code = s.charCodeAt(q); const c = code >= 0x30a1 && code <= 0x30f6 ? String.fromCharCode(code - 0x60) : s[q]; k += LOOSE[c] || c; }
      SEMI.set(s, k);
      return k;
    }
    // a unit typed in katakana (ー too): for the katakana run and its cost
    const kataU = x => !!x && x.k === 'kana' && !x.rom && (!!x.kata || x.ch === 'ー');
    const KATA_RE = /[ァ-ヺ]/, HIRA_RE = /[ぁ-ゖ]/;
    function cover(X, notation) {
      const n = X.length, best = new Array(n + 1).fill(Infinity), back = new Array(n + 1).fill(null);
      const relax = (j, c, ed) => { if (c < best[j] - 1e-9) { best[j] = c; back[j] = ed; } };
      const sentStart = i => { for (let q = i - 1; q >= 0; q--) return X[q].k === 'punct' && /[.。!！?？]/.test(X[q].p); return true; };
      best[0] = 0;
      for (let i = 0; i < n; i++) {
        const b = best[i];
        if (b === Infinity) continue;
        const u = X[i];
        if (u.k === 'punct') { relax(i + 1, b, { t: 'punct', i, j: i + 1 }); continue; }
        if (u.k === 'num') { relax(i + 1, b + 1, { t: 'num', i, j: i + 1, v: u.v }); continue; }
        if (u.k === 'latin') { relax(i + 1, b + 2, { t: u.cap && !sentStart(i) ? 'name' : 'unk', i, j: i + 1 }); continue; }
        // (kana and kanji must match a form exactly; rōmaji may leave long vowels out or spell them another way, but a
        // form spelled exactly as typed is preferred: «mou» is もう, «mo» is も)
        let key = '', ex = '', exs = '', prev = '', gaps = 0, rom = false, kataAll = true, hira = false, kata = false;
        const honAt = q0 => {
          if (q0 >= n) return false;
          if (X[q0].k === 'han') return X[q0].ch === '様' || (X[q0].ch === '先' && !!X[q0 + 1] && X[q0 + 1].ch === '生');
          let s = '';
          for (let q = q0; q < n && q < q0 + 4 && X[q].k === 'kana'; q++) { s += X[q].ch; if (/^(さん|くん|ちゃん|さま|せんせい)$/.test(s)) return true; }
          return false;
        };
        // (a number in kanji is one run: 十五枚 is 十五 + 枚, not 十 + 五枚; words don't start in the middle of it)
        const midNum = u.k === 'han' && NUMK[u.ch] !== undefined && i > 0 && X[i - 1].k === 'han' && NUMK[X[i - 1].ch] !== undefined && !u.hard;
        for (let j = i; j < n && !midNum; j++) {
          const x = X[j];
          if ((x.k !== 'han' && x.k !== 'kana') || (j > i && x.hard)) break;
          if (j > i && x.gap) gaps++;
          if (x.rom) rom = true;
          if (!kataU(x)) kataAll = false;
          if (x.k === 'kana' && !x.rom && x.ch !== 'ー') { if (x.kata) kata = true; else hira = true; }
          if (x.k === 'han') { key += x.ch; ex += x.ch; exs += x.ch; prev = ''; }
          else {
            ex += LOOSE[x.ch] || x.ch; exs += x.ch;
            if (prev && SMALLX[prev + x.ch]) { key = key.slice(0, -1) + SMALLX[prev + x.ch]; prev = SMALLX[prev + x.ch]; }
            else if (prev && isExt(x.ch, prev)) prev = 'ー';
            else { key += LOOSE[x.ch] || x.ch; prev = x.ch; }
          }
          if (key.length > maxLen) break;
          const se = STEMS.get(key);
          if (se) for (const e of se) if (!e._x) expand(e);
          const list = F.get(key);
          if (list) {
            const sc = [];
            const exR = rom ? semiR(ex) : '';
            for (const r of list) {
              // (typed in kana or kanji: the very spelling, お is not を; in rōmaji wa / o / e may be は / を / へ, and a long
              // vowel may be ō, ou or oo: «chīzu» is チーズ, «chizu» 地図)
              // (but a word that starts with は / を / へ is never typed wa / o / e: «waite» is 湧いて, not 履いて; only the particles are)
              const same = rom ? (semiR(r.s) === exR || semiR(r.r) === exR) && !(r.r.length > 1 && /^[はをへ]/.test(r.r) && exs[0] !== r.r[0]) : toHira(r.s) === exs || toHira(r.r) === exs;
              if (!rom && !same) continue;
              // (a loose match costs more; a space the player typed is a word break unless nothing else reads: «wo shimashita»
              // is を しました, not 押しました; katakana read as a word that isn't written in katakana costs a little more)
              // (and a word read across hiragana and katakana is rarely meant: は + カレ is no 計れ)
              // (and a name is written as a name: みずの is 水の, not 水野; なお is なお, not ナオ; a name in kanji or katakana typed in
              //  hiragana costs more)
              // (unless an honorific follows: ふみたくん is 文田くん; in rōmaji a name is one typed with a capital or an honorific after it:
              //  «junbi» is 準備, not ジュン + …)
              // (a place's name isn't: «tokyo ni ikimasu» is 東京)
              const nameKana = r.e.pos === 'name' && !r.e.tags.includes('place') && (rom ? !u.cap && !u.honNext : (hasHan(r.s) && !hasHan(exs)) || (KATA_RE.test(r.s) && !HIRA_RE.test(r.s) && hira)) && !honAt(j + 1);
              sc.push({ r, c: recCost(r) + (same ? -0.1 : 0.7) + gaps * 3 + (kataAll && !KATA_RE.test(r.s) ? 0.6 : 0) + (hira && kata && !(KATA_RE.test(r.s) && HIRA_RE.test(r.s)) ? 1 : 0) + (nameKana ? (rom ? 1 : 2) : 0) - (r.e.pos === 'name' && rom && u.cap && !sentStart(i) ? 0.3 : 0) });
            }
            if (sc.length) {
              sc.sort((a, z) => a.c - z.c || a.r.e.n - z.r.e.n);
              relax(j + 1, b + sc[0].c, { t: 'w', i, j: j + 1, cands: sc.map(x => x.r) });
            }
          }
          const nv = NUMF.get(key);
          if (nv !== undefined) relax(j + 1, b + 1.08 + 0.4 * gaps, { t: 'num', i, j: j + 1, v: nv });
        }
        if (u.k === 'han' && NUMK[u.ch] !== undefined) {
          let L = 0;
          while (i + L < n && X[i + L].k === 'han' && NUMK[X[i + L].ch] !== undefined && !(L && X[i + L].hard)) L++;
          relax(i + L, b + 1.02, { t: 'num', i, j: i + L, v: numVal(X.slice(i, i + L).map(x => x.ch)) });
        }
        if (notation && u.hard) {            // a whole bracket the dictionary doesn't know: a name, or one unknown word
          let L = 1;
          while (i + L < n && X[i + L].grp === u.grp) L++;
          relax(i + L, b + 1 + 1.5 * L, { t: X.slice(i, i + L).every(x => x.kata) ? 'name' : 'unk', i, j: i + L });
        }
        if (u.k === 'kana' && u.rom && (u.cap || u.honNext) && u.first) {     // a capitalized rōmaji word: maybe a name (Maria, Gabi); before an honorific, surely
          let L = 1;
          while (i + L < n && X[i + L].run === u.run) L++;
          relax(i + L, b + (u.honNext ? 0.2 : sentStart(i) ? 3.5 : 1.6), { t: 'name', i, j: i + L });
        }
        // a katakana run the dictionary doesn't know as a whole (a name, a loanword) is one unknown word, not kana words that happen to
        // fit: ポスター is not ?・巣・?, ミノル not 見・乗る (a known katakana word, or a few words written in katakana, still win; the
        // run may start after a known one: カレー + ?ライス)
        if (kataU(u) && u.ch !== 'ー') {
          let L = 1;
          while (i + L < n && kataU(X[i + L]) && !X[i + L].hard && !X[i + L].gap) L++;
          if (L >= 2) relax(i + L, b + 1 + 0.6 * L, { t: 'unk', i, j: i + L });
        }
        relax(i + 1, b + (u.k === 'han' ? 4 : 3), { t: 'unk', i, j: i + 1 });
      }
      const T = [];
      for (let j = n; j > 0;) { const ed = back[j]; T.unshift(ed); j = ed.i; }
      const out = [];
      for (const t of T) {
        const p = out[out.length - 1], u = X[t.i];
        if (t.t === 'unk' && p && p.t === 'unk' && (u.k === 'han' || u.k === 'kana') && X[p.i].k !== 'latin' && !u.gap && !u.hard) { p.j = t.j; continue; }
        out.push(Object.assign({}, t));
      }
      return out;
    }

    // ------------------------------------------------------------ context: which of the words that read alike
    const R0 = t => (t && t.t === 'w' ? t.cands[0] : null);
    const pickR = (t, f) => { const k = t.cands.findIndex(f); if (k > 0) { const r = t.cands[k]; t.cands = [r].concat(t.cands.filter(x => x !== r)); } return k >= 0; };
    function disamb(T, X) {
      for (let k = 0; k < T.length; k++) {
        const t = T[k];
        if (t.t !== 'w' || t.cands.length < 2) continue;
        const next = T[k + 1], nr = R0(next), pr = R0(T[k - 1]);
        // a particle can't come right before another particle: が を → 蛾 を (the moth); but の can (赤いのを, 行くのが)
        if (t.cands[0].e.pos === 'part' && t.cands[0].s !== 'の' && nr && nr.e.pos === 'part' && !/^(の|か|よ|ね|な|も|は|から|まで|だけ|しか|って)$/.test(nr.s) && t.cands.some(r => r.e.pos === 'n')) { pickR(t, r => r.e.pos === 'n'); continue; }
        // さん after a name or a noun is the honorific (also after a name the dictionary doesn't know: 航さん); before a counter it's 3
        const pt = T[k - 1];
        // (and after a word written in katakana, whatever it matched: ミノルさん is a name, not 実る + 三)
        if (t.cands.some(r => r.e.fl.hon) && pt && (pt.t === 'name' || pt.t === 'unk' || (pr && (pr.e.pos === 'name' || pr.e.pos === 'n'))
          || (pt.t === 'w' && X.slice(pt.i, pt.j).every(u => u.kata || u.ch === 'ー')))) { pickR(t, r => r.e.fl.hon); continue; }
        // 〜ておく: おきます after a て-form is 置く (do it in advance), not 起きる (頼んでおきます)
        if (pr && pr.e.pos === 'v' && pr.f.form === 'te' && t.cands[0].e.id !== 'ja:置く' && t.cands.some(r => r.e.id === 'ja:置く')) { pickR(t, r => r.e.id === 'ja:置く'); continue; }
        // «katta» after に is 勝った (you beat someone, 試合に勝った), not 買った
        if (pr && pr.e.pos === 'part' && pr.s === 'に' && t.cands[0].e.id === 'ja:買う' && t.cands.some(r => r.e.id === 'ja:勝つ')) { pickR(t, r => r.e.id === 'ja:勝つ'); continue; }
        // a potential form after を, or a potential て-form before ください / くれる / いる…, is another verb's plain form: «heya wo kaete»
        // is 変えて, not 買えて (the potential takes が)
        const potOff = t.cands[0].f.pot && t.cands.some(r => r.e.pos === 'v' && !r.f.pot && !r.f.pass) && ((pr && pr.e.pos === 'part' && pr.s === 'を')
          || (t.cands[0].f.form === 'te' && nr && (nr.e.id === 'ja:ください' || /^(くれ|くださ|もら|いただ|おく|おき|しま|み)/.test(nr.s))));
        if (potOff) { pickR(t, r => r.e.pos === 'v' && !r.f.pot && !r.f.pass); continue; }
        // and after が, the potential is the likely one: 車が入れない is "cars can't get in" (入る), not "don't put in" (入れる);
        // with a を earlier in the clause (and no が), another verb's plain form is: 電話を一本かけました is 掛けました, not 書けました
        if (pr && pr.e.pos === 'part' && pr.s === 'が' && t.cands[0].e.pos === 'v' && !t.cands[0].f.pot && t.cands.some(r => r.e.pos === 'v' && r.f.pot && r.e !== t.cands[0].e)) { pickR(t, r => r.e.pos === 'v' && r.f.pot); continue; }
        if (t.cands[0].f.pot && t.cands.some(r => r.e.pos === 'v' && !r.f.pot && !r.f.pass && r.e !== t.cands[0].e)) {
          let wo = false;
          for (let q = k - 1; q >= 0; q--) { const x = T[q], r0 = R0(x); if (!x || x.t === 'punct' || (r0 && r0.e.pos === 'part' && r0.s === 'が')) break; if (r0 && r0.e.pos === 'part' && r0.s === 'を') { wo = true; break; } }
          if (wo) { pickR(t, r => r.e.pos === 'v' && !r.f.pot && !r.f.pass && r.e !== t.cands[0].e); continue; }
        }
        // a verb's dictionary form right before です / でした, when the same kana is also a noun, is the noun: «sanmon no toku desu» is
        // 得です, not 解くです (a learner's «taberu desu» has no noun to be, so it's still caught)
        if (t.cands[0].e.pos === 'v' && t.cands[0].f.form === 'dict' && nr && nr.e.fl.cop && /^(です|でした)$/.test(nr.s) && t.cands.some(r => r.e.pos === 'n')) { pickR(t, r => r.e.pos === 'n'); continue; }
        // (and a volitional never comes before です: 二倍だそうです is だそう, not 出そう です)
        if (t.cands[0].f.mood === 'vol' && nr && nr.e.fl.cop && /^(です|でした)$/.test(nr.s) && t.cands.some(r => r.f.mood !== 'vol')) { pickR(t, r => r.f.mood !== 'vol'); continue; }
        // a noun right before な, when the same reading is a な-adjective, is the adjective: «shinchou na» is 慎重な, not 身長な
        if (t.cands[0].e.pos === 'n' && nr && nr.s === 'な' && t.cands.some(r => r.e.cls === 'na-adj')) { pickR(t, r => r.e.cls === 'na-adj'); continue; }
        // a verb's form right before を / が (or は, but not 〜ては) is a noun that reads the same: «shita wo» is 下を, not したを;
        // «ike ga» is 池が, not 行けが
        if (t.cands[0].e.pos === 'v' && nr && nr.e.pos === 'part' && (/^(を|が)$/.test(nr.s) || (nr.s === 'は' && t.cands[0].f.form !== 'te')) && t.cands.some(r => r.e.pos === 'n')) { pickR(t, r => r.e.pos === 'n'); continue; }
      }
      // names: an unknown word (or a katakana one) right before さん / くん / ちゃん / 先生 / 様 (a katakana word that only matched a word
      // written in kanji or hiragana is a name there: セイジさん, not 政治さん)
      for (let k = 0; k + 1 < T.length; k++) {
        const t = T[k], nr = R0(T[k + 1]);
        if (nr && nr.e.fl.hon && (t.t === 'unk' || (t.t === 'w' && X.slice(t.i, t.j).every(u => u.kata || u.ch === 'ー') && (R0(t).e.pos !== 'n' || !KATA_RE.test(R0(t).e.s))))) t.t = 'name';
      }
      // names: a katakana run the dictionary doesn't know as one word, after 私は / ぼくは … and before です / だ / the end, or after 名前は
      const kat = t => X.slice(t.i, t.j).every(u => u.k === 'kana' && !u.rom && (u.kata || u.ch === 'ー'));
      const wordIs = (t, ...fs) => !!t && t.t === 'w' && fs.includes(R0(t).s);
      for (let k = 2; k < T.length; k++) {
        if (!wordIs(T[k - 1], 'は') || !(wordIs(T[k - 2], '私', '僕', 'ぼく', 'わたし', '俺', 'おれ', 'あたし', '名前', 'なまえ'))) continue;
        const named = wordIs(T[k - 2], '名前', 'なまえ');
        let e = k;
        while (e < T.length && T[e].t !== 'punct' && kat(T[e]) && (e === k || X[T[e].i].gap === false)) e++;
        if (e === k) continue;
        const after = T[e];
        if (!named && after && after.t !== 'punct' && !wordIs(after, 'です', 'だ', 'でした')) continue;
        const run = T.slice(k, e);
        if (run.length === 1 && run[0].t === 'w') continue;
        if (run.every(x => x.t === 'w')) continue;
        T.splice(k, e - k, { t: 'name', i: T[k].i, j: T[e - 1].j });
      }
    }

    // ------------------------------------------------------------ the analysis
    const JA_PUNCT = { ',': '、', '.': '。', '!': '！', '?': '？', ':': '：' };
    // です / でした written as their own token (好きです → [好|す]き です), the way the game's lines and rōmaji show them
    const desu = s => String(s).replace(/([^\s])(です|でした|でしょう)$/, '$1 $2');
    // a する-verb written as its noun + する (勉強します → [勉強|べんきょう] します, benkyō shimasu)
    function suruSplit(e, src) {
      if (!e.s || e.s.length <= 2) return src;
      const ns = e.s.slice(0, -2), nr = e.r.slice(0, -2);
      for (const head of [notate(ns, nr) || ns, nr, ns]) if (head && src.startsWith(head) && src.length > head.length && !/^\s/.test(src.slice(head.length))) return head + ' ' + src.slice(head.length);
      return src;
    }
    const has = (w, ...ss) => !!w && !!w.form && ss.includes(w.form);
    const FL = (w, f) => { const e = w && w.id ? E.get(w.id) : null; return !!(e && e.fl[f]); };
    const isPart = (w, ...ss) => !!w && w.pos === 'part' && (!ss.length || ss.includes(w.form));
    const kanaNum = n => { const o = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'], t = ['', 'じゅう', 'にじゅう', 'さんじゅう', 'よんじゅう', 'ごじゅう', 'ろくじゅう', 'ななじゅう', 'はちじゅう', 'きゅうじゅう']; return n > 0 && n < 100 ? t[Math.floor(n / 10)] + o[n % 10] : ''; };
    let keyList = null;
    function sugg(us) {
      if (!us.every(u => u.k === 'kana')) return [];
      const key = looseKey(us.map(u => u.ch).join(''));
      if (key.length < 3) return [];
      if (!keyList) keyList = [...E.values()].filter(e => e.pos !== 'phrase' && e.pos !== 'part').map(e => [looseKey(e.r), e]);
      const out = [];
      for (const [k, e] of keyList) if (Math.abs(k.length - key.length) <= 1 && lev(k, key) <= 1) { out.push(e.id); if (out.length >= 3) break; }
      return out;
    }
    function mkWords(T, X, text) {
      return T.map((t, idx) => {
        const s = X[t.i].s, e = X[t.j - 1].e, raw = text.slice(s, e), us = X.slice(t.i, t.j), typedKana = us.every(u => u.k === 'kana');
        const w = { t: raw, i: idx, s, e, id: null, lemma: null, pos: null, en: '', tags: [], band: 0, f: {}, unknown: false, sugg: [], punct: false, name: false };
        if (t.t === 'punct') return Object.assign(w, { punct: true, pos: 'punct', src: JA_PUNCT[raw] || raw });
        if (t.t === 'num') {
          const k = typedKana ? us.map(u => u.ch).join('') : '';
          return Object.assign(w, { pos: 'num', num: t.v, en: String(t.v), src: typedKana ? k : us[0].k === 'num' ? raw : (kanaNum(t.v) ? `[${raw}|${kanaNum(t.v)}]` : raw) });
        }
        if (t.t === 'name') return Object.assign(w, { name: true, pos: 'name', src: typedKana && us.every(u => u.rom) ? raw.replace(/\s+/g, ' ') : raw });
        if (t.t === 'unk') return Object.assign(w, { unknown: true, src: typedKana && us.every(u => u.rom) ? us.map(u => u.ch).join('') : raw, sugg: sugg(us) });
        const r = t.cands[0], en = r.e;
        Object.assign(w, { id: en.id, lemma: en.lemma, pos: r.f.form === 'noun' ? 'n' : en.pos, en: en.en, tags: en.tags, band: en.band, f: Object.assign({}, r.f), cls: en.cls, form: r.s, read: r.r });
        if (en.pos === 'name') w.name = true;
        if (en.counters) { w.counters = en.counters; w.cl = en.cl; }
        if (en.lex) w.lex = en.lex;
        if (en.val) w.val = en.val;
        if (r.f.counter) { w.counter = r.f.counter; if (r.f.num !== undefined) w.num = r.f.num; }
        // (a headword that is a number in kanji, 十五 二十 百, has its value)
        if (en.pos === 'num' && w.num === undefined && [...r.s].every(c => NUMK[c] !== undefined)) w.num = numVal([...r.s]);
        const alts = [...new Set(t.cands.slice(1).map(x => x.e.id))].filter(x => x !== en.id);
        if (alts.length) w.alts = alts;
        // written back the way it was typed: kana stays kana; kanji (or rōmaji) gets the dictionary's kanji with readings
        const kataTyped = us.some(u => u.kata);
        if (en.pos === 'part') w.src = r.s;
        else if (typedKana && !us.some(u => u.rom) && !hasHan(r.s)) w.src = kataTyped ? raw : toHira(r.r) === r.s ? r.s : raw;
        else if (typedKana && !us.some(u => u.rom)) w.src = toHira(r.r);
        else w.src = notate(r.s, r.r) || r.s;
        if (en.cls === 'suru' && r.f.form !== 'noun') w.src = suruSplit(en, w.src);
        if (en.pos !== 'part' && !en.fl.cop) w.src = desu(w.src);
        return w;
      });
    }
    const isPred = w => !!w && !w.punct && !!w.id && (w.pos === 'v' || w.pos === 'adj') && !!(w.f.tense || w.f.mood || w.f.cond)
      && !['te', 'stem', 'attr', 'adv', 'nagara', 'noun', 'sou', 'too', 'tari', 'zu', 'zuni'].includes(w.f.form);
    // the sentences of an analysis: [[word indices]] split at 。！？
    function sentencesOf(ws) {
      const S = [];
      let cur = [];
      ws.forEach((w, k) => { if (w.punct) { if (/[。.！!？?]/.test(w.t) && cur.length) { S.push(cur); cur = []; } return; } cur.push(k); });
      if (cur.length) S.push(cur);
      return S;
    }
    function sentence(ws, text) {
      const real = ws.filter(w => !w.punct), preds = real.filter(isPred);
      const times = [];
      const addT = t => { if (t && !times.includes(t)) times.push(t); };
      // (なければ + なりません / いけません is "must", not "if")
      const must = (w, k) => w.f.cond === 'ba' && w.f.neg && real[k + 1] && (real[k + 1].id === 'ja:なる' || /^(いけ|行け|だめ|ダメ)/.test(real[k + 1].form || ''));
      if (real.some((w, k) => (w.f.cond && !must(w, k) && !w.f.must) || has(w, 'もし'))) addT('hypo');
      if (preds.some(w => w.f.tense === 'past')) addT('past');
      if (real.some(w => FL(w, 'fut')) || (real.some(w => FL(w, 'tf')) && preds.some(w => w.f.tense === 'pres'))) addT('future');
      if (preds.some(w => w.f.tense === 'pres' || w.f.mood)) addT('present');
      const lastW = real[real.length - 1];
      let subject = null;
      for (let k = 0; k + 1 < real.length; k++) {
        if (isPred(real[k])) break;
        if ((real[k].pos === 'pron' || real[k].pos === 'n' || real[k].name) && isPart(real[k + 1], 'は', 'が')) {
          const e = E.get(real[k].id);
          subject = { person: e && e.fl.p1 ? 1 : e && e.fl.p2 ? 2 : 3, number: e && e.fl.pl ? 'p' : 's' };
          break;
        }
      }
      return { text, lang: 'ja', words: ws,
        verbs: ws.filter(w => isPred(w) && w.pos === 'v').map(w => w.i),
        time: times.includes('hypo') ? 'hypo' : times[0] || null, times,
        neg: real.some(w => w.f.neg),
        question: /[?？]/.test(text) || isPart(lastW, 'か') || real.some(w => FL(w, 'q') || w.f.q),
        numbers: real.filter(w => w.num != null).map(w => w.num),
        connectors: real.filter(w => FL(w, 'conn')).map(w => w.form),
        clauses: preds.length, subject,
        unknown: ws.filter(w => w.unknown).map(w => w.i) };
    }
    // an answer typed in English: only Latin words, and most of them are English (not rōmaji: «the», «is», «my», or a word
    // that can't be spelled in kana) → none of it is read as Japanese. «I make pasta» is not いる 負け パスタ.
    const ENG_WORDS = new Set(('i a the is am are was were been my your his her its our their you she they this that these those and or but with have has had '
      + 'like love want make makes made name hello hi yes please thanks thank good very what how who where when why which not dont can will would should could '
      + 'of in on at for from by about eat eats drink play going live work study speak know think need help just also because').split(' '));
    function englishAnswer(plain, X) {
      if (!X.length || !X.every(u => u.k === 'latin' || u.k === 'num' || u.k === 'punct' || (u.k === 'kana' && u.rom))) return false;
      const toks = plain.match(/[A-Za-zāīūēōâîûêôĀĪŪĒŌ'’-]+/g) || [];
      let eng = 0, all = 0;
      toks.forEach((t, n) => {
        if (n > 0 && /^[A-ZĀĪŪĒŌ]/.test(t)) return;
        all++;
        const out = [];
        romaRun(t, 0, t.length, out);
        const roma = out.length > 0 && !out.some(u => u.bad);
        const lw = t.toLowerCase().replace(/['’]/g, '');
        if (ENG_WORDS.has(lw)) eng += roma && !/^(i|a|you|she|the|my)$/.test(lw) ? 0.5 : 1;
        else if (!roma) eng++;
      });
      return all > 0 && eng > 0 && eng / all >= 0.5;
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
        const english = !notation && englishAnswer(plain, X);
        if (english) ws.forEach(w => { if (!w.punct) Object.assign(w, { id: null, lemma: null, pos: null, en: '', tags: [], band: 0, f: {}, unknown: true, name: false, sugg: [], src: w.t, num: undefined }); });
        const a = sentence(ws, plain);
        if (notation) a.src = raw;
        return a;
      } catch (e) {
        console.error('DICT ja: analyze', e);
        return { text: raw, lang: 'ja', words: [], verbs: [], time: null, times: [], neg: false, question: /[?？]/.test(raw), numbers: [], connectors: [], clauses: 0, subject: null, unknown: [] };
      }
    }

    // ------------------------------------------------------------ a headword in a given form: { s, r } (features must all match)
    const FORMS = new Map();
    function formsOf(e) {
      let L = FORMS.get(e.id);
      if (L) return L;
      L = [];
      if (e.pos === 'v' && e.cls) {
        const SS = verbStems(e.s, e.cls, !hasHan(e.s)), RS = verbStems(e.r, e.cls, true);
        if (SS && RS) { const a = verbEndings(SS), b = verbEndings(RS); a.forEach(([s, f], k) => L.push({ s, r: b[k][0], f })); }
      } else if (e.pos === 'adj' && e.cls) adjForms(e).forEach(([s, r, f]) => { if (!f.err) L.push({ s, r, f }); });
      else if (e.fl.cop) COP.forEach(([s, f]) => L.push({ s, r: s, f }));
      FORMS.set(e.id, L);
      return L;
    }
    const FKEYS = ['tense', 'polite', 'neg', 'asp', 'want', 'pot', 'pass', 'caus', 'mood', 'cond', 'form', 'q', 'must', 'mo'];
    function formOf(e, f) {
      const want = {};
      for (const k of FKEYS) if (f[k] !== undefined && f[k] !== false && !(k === 'form' && f[k] === 'dict')) want[k] = f[k];
      return formsOf(e).find(x => FKEYS.every(k => (x.f[k] === undefined || x.f[k] === false || (k === 'form' && x.f[k] === 'dict') ? undefined : x.f[k]) === want[k])) || null;
    }
    // a word put into another form, written the way the word was typed (kana stays kana)
    function reform(w, f) {
      const e = E.get(w.id), x = e && formOf(e, f);
      if (!x) return null;
      const out = w.src && !hasHan(w.src) && hasHan(x.s) ? toHira(x.r) : (notate(x.s, x.r) || x.s);
      return desu(e.cls === 'suru' ? suruSplit(e, out) : out);
    }

    // ------------------------------------------------------------ the checks (only what's sure: a false alarm is far worse than a miss)
    const GA_OK_NEXT = /^(な|に|なる|なり|なっ)/;
    const OBJ_TAGS = new Set(['food', 'drink', 'clothes', 'home', 'school', 'tech', 'hobby', 'music', 'art', 'story', 'money', 'shop', 'transport', 'sport', 'color', 'number', 'language']);
    const OBJ_CNT = new Set(['つ', '人', '匹', '本', '杯', '冊', '枚', '個', '台', '足', '着', '軒', '頭', '羽', '通', '曲', '部']);
    const NI_OK = new Set(['ja:書く', 'ja:描く', 'ja:投げる', 'ja:打つ', 'ja:片付ける', 'ja:使う', 'ja:作る', 'ja:話す', 'ja:聞く', 'ja:教える', 'ja:歌う']);
    function check(a, opts = {}) {
      const errs = [];
      if (!a || a.lang !== 'ja' || !a.words || !a.words.length) return errs;
      const ws = a.words, mode = opts.mode || CJK.mode('ja');
      const real = ws.filter(w => !w.punct);
      if (!real.length || real.filter(w => w.unknown).length / real.length > 0.34) return errs;
      const P = src => CJK.plain(src, { lang: 'ja', mode, cap: false });
      const Q = src => '«' + P(src) + '»';
      const S = k => (ws[k] ? ws[k].src || ws[k].t : '');
      const add = (code, sev, i, j, src, tip) => {
        if (errs.some(x => x.at[0] <= j && i <= x.at[1])) return;
        errs.push({ code, sev, at: [i, j], fix: src ? P(src) : '', tip, _src: src });
      };
      const nextReal = k => { for (let q = k + 1; q < ws.length; q++) if (!ws[q].punct) return q; return -1; };
      const isNoun = w => !!w && (w.pos === 'n' || w.pos === 'pron' || w.name);
      const animate = w => !!w && (w.pos === 'pron' || w.name || w.tags.includes('people') || w.tags.includes('animal') || w.tags.includes('family'));
      const anyWo = sen => sen.some(k => isPart(ws[k], 'を'));
      for (const sen of sentencesOf(ws)) {
        const at = q => (q >= 0 && q < sen.length ? ws[sen[q]] : null), n = sen.length;
        for (let q = 0; q < n; q++) {
          const w = at(q), prev = at(q - 1), next = at(q + 1), next2 = at(q + 2);
          // particle: を before 好き / 嫌い / 上手 / 分かる / できる / ほしい → が
          if (isPart(w, 'を') && next && FL(next, 'ga') && !(next.f.form === 'attr' || next.f.form === 'adv') && !(next2 && next2.id && GA_OK_NEXT.test(next2.form || '') && next2.pos === 'v')) {
            add('particle.ga', 'major', sen[q], sen[q], 'が', `${Q(E.get(next.id).lemma)} takes ${Q('が')} for what you like, know or want, not ${Q('を')}: ${Q(S(sen[q - 1]) + ' が ' + next.src)}.`);
            continue;
          }
          // particle: a place に + an action → で (図書館に勉強します → 図書館で勉強します)
          if (isPart(w, 'に') && prev && FL(prev, 'place')) {
            let j = q + 1;
            let objPlace = false;
            while (j < n && ((isNoun(at(j)) && isPart(at(j + 1), 'を')) || isPart(at(j), 'を') || at(j).pos === 'adv' || at(j).num != null)) { if (FL(at(j), 'place')) objPlace = true; j++; }
            const v = at(j), nounSuru = !!v && v.f.form === 'noun' && !!at(j + 1) && at(j + 1).id === 'ja:する';     // (勉強 します, typed apart)
            // (a place に + する is choosing it: どんなお店にしたいですか; and some verbs take に for where a thing goes or who hears it:
            //  黒板に書く, 庭に池を作る, 教室にメールを書く, 港に話す)
            if (v && FL(v, 'act') && !objPlace && !(j === q + 1 && v.id === 'ja:する') && !NI_OK.has(v.id) && ((v.pos === 'v' && v.f.form !== 'stem' && v.f.form !== 'noun') || nounSuru))
              add('particle.de', 'major', sen[q], sen[q], 'で', `Where something is done takes ${Q('で')}: ${Q(prev.src + ' で')}.`);
            continue;
          }
          // particle: a place で + いる / 住む → に (公園で猫がいます → 公園に猫がいます)
          if (isPart(w, 'で') && prev && (FL(prev, 'place') || FL(prev, 'loc'))) {
            let j = q + 1;
            while (j < n && ((isNoun(at(j)) && isPart(at(j + 1), 'が', 'は', 'も')) || isPart(at(j), 'が', 'は', 'も'))) j++;
            const v = at(j);
            if (v && v.pos === 'v' && FL(v, 'ni') && !v.f.form && !/^いられ/.test(v.form || ''))
              add('particle.ni', 'major', sen[q], sen[q], 'に', `Where someone or something is (or lives) takes ${Q('に')}: ${Q(prev.src + ' に')}.`);
            continue;
          }
          // particle: a place を + 行く / 来る / 帰る → に (学校を行きます → 学校に行きます)
          if (isPart(w, 'を') && prev && FL(prev, 'place') && !FL(prev, 'path') && next && next.pos === 'v' && FL(next, 'go')) {
            add('particle.dest', 'major', sen[q], sen[q], 'に', `Where you go takes ${Q('に')} (or ${Q('へ')}): ${Q(prev.src + ' に ' + next.src)}.`);
            continue;
          }
          // particle: a clock time or a day で + a verb → に (七時で起きます → 七時に起きます)
          if (isPart(w, 'で') && prev && (FL(prev, 'tni') || ['時', '月#month'].includes(prev.counter)) && prev.num !== null && next && next.pos === 'v' && FL(next, 'when')) {
            add('particle.time', 'major', sen[q], sen[q], 'に', `A clock time or a day takes ${Q('に')}: ${Q(prev.src + ' に')}.`);
            continue;
          }
          // particle: a thing が + a verb that takes an object → を (本が読みます → 本を読みます)
          // (only a noun that's clearly a thing: 農家が寄付して, farmers giving, is right; and X が する is a sense: 音がする, 味がする)
          if (isPart(w, 'が') && prev && isNoun(prev) && !animate(prev) && prev.tags.some(g => OBJ_TAGS.has(g)) && !FL(prev, 'place') && next && next.pos === 'v' && FL(next, 'vt') && next.id !== 'ja:する' && next.f.form !== 'stem' && !anyWo(sen)
            && !(next.f.pot || next.f.pass || next.f.want || next.f.caus || next.f.mood) && !(next.f.form === 'te' && next2 && next2.form && /^あ/.test(next2.read || ''))) {
            add('particle.o', 'major', sen[q], sen[q], 'を', `What you ${enBase(next.en)} takes ${Q('を')}: ${Q(prev.src + ' を ' + next.src)}.`);
            continue;
          }
          // adj: 高いでした → 高かったです · 高いだった → 高かった · 高いじゃない → 高くない
          // (but 早いじゃないですか / 高いじゃないか is "isn't it!", said on purpose)
          if (w.pos === 'adj' && w.cls === 'i-adj' && w.f.tense === 'pres' && !w.f.polite && !w.f.neg && next && FL(next, 'cop') && !(/^(じゃない|じゃないです|ではない|ではないです)$/.test(next.form) && isPart(next2, 'か'))) {
            const tgt = has(next, 'でした') ? { tense: 'past', polite: true } : has(next, 'だった') ? { tense: 'past' } : /^(じゃない|ではない)$/.test(next.form) ? { tense: 'pres', neg: true }
              : /^(じゃありません|ではありません|じゃないです)$/.test(next.form) ? { tense: 'pres', neg: true, polite: true } : /^(じゃなかった|ではなかった)$/.test(next.form) ? { tense: 'past', neg: true } : null;
            const fx = tgt && reform(w, tgt);
            if (fx) { add('adj.i', 'major', sen[q], sen[q + 1], fx, `An い-adjective changes itself: ${Q(fx)}, not ${Q(w.src + ' ' + next.src)}.`); continue; }
          }
          // adj: 静か公園 → 静かな公園 (a な-adjective before a noun; not across a comma or a pause: お見事…コインをどうぞ)
          if (w.pos === 'adj' && w.cls === 'na-adj' && w.f.form === 'stem' && !FL(w, 'cmp') && next && next.pos === 'n' && !next.counter && !next.f.form && sen[q + 1] === sen[q] + 1) {
            const fx = reform(w, { form: 'attr' });
            if (fx) { add('adj.na', 'major', sen[q], sen[q], fx, `A な-adjective takes ${Q('な')} before a noun: ${Q(fx + ' ' + next.src)}.`); continue; }
          }
          // adj: 高いな山 / 赤いのりんご → 高い山 / 赤いりんご
          if (w.pos === 'adj' && w.cls === 'i-adj' && w.f.tense === 'pres' && !w.f.polite && isPart(next, 'な', 'の') && next2 && next2.pos === 'n') {
            add('adj.i', 'major', sen[q], sen[q + 1], w.src, `An い-adjective goes straight before its noun: ${Q(w.src + ' ' + next2.src)}.`);
            continue;
          }
          // adj: a な-adjective said like an い-one (きれいくない → きれいじゃない)
          if (w.f.err === 'na') {
            const e = E.get(w.id), fx = e && (notate(e.s + w.f.right, e.r + w.f.right) || e.s + w.f.right);
            if (fx) { add('adj.na', 'major', sen[q], sen[q], w.src && !hasHan(w.src) ? e.r + w.f.right : fx, `${Q(e.lemma)} is a な-adjective: ${Q(w.src && !hasHan(w.src) ? e.r + w.f.right : fx)}.`); continue; }
          }
          // polite: a plain verb + です (行くです → 行きます; not a word in quotes: 「話す」です)
          if (w.pos === 'v' && w.cls && !w.f.polite && (w.f.form === 'dict' || w.f.tense) && !w.f.want && next && FL(next, 'cop') && /^(です|でした)$/.test(next.form) && !(next2 && isPart(next2, 'か') && false) && sen[q + 1] === sen[q] + 1) {
            const fx = reform(w, Object.assign({}, w.f, { polite: true, tense: has(next, 'でした') ? 'past' : w.f.tense || 'pres' }));
            if (fx) { add('polite.verb', 'minor', sen[q], sen[q + 1], fx, `A verb shows politeness itself: ${Q(fx)}.`); continue; }
          }
        }
        // tense: a past time word with a non-past main verb (昨日映画を見ます → 見ました), or a future one with a past verb
        const tp = sen.findIndex(k => FL(ws[k], 'tp')), tf = sen.findIndex(k => FL(ws[k], 'tf'));
        // (the main verb: the last one that isn't describing a noun, 書いたリズム; a sentence that ends in a request, 読んでください, has none)
        let mainQ = -1, lastQ = n - 1;
        while (lastQ >= 0 && isPart(at(lastQ))) lastQ--;
        const req = lastQ >= 0 && (at(lastQ).id === 'ja:ください' || (at(lastQ).pos === 'v' && at(lastQ).f.form === 'te'));
        if (!req) for (let q = n - 1; q >= 0; q--) if (isPred(at(q)) && !(at(q + 1) && (isNoun(at(q + 1)) || at(q + 1).unknown))) { mainQ = q; break; }
        const main = at(mainQ);
        const subPast = q0 => sen.slice(q0 + 1, mainQ).some(k => isPred(ws[k]) && ws[k].f.tense === 'past');
        // (a time word is the verb's time only when it stands alone or takes は / に / も: 来月の試験, 昨日と同じ, 昨日が見える,
        //  去年の倍, 明日では, 来年から, or 明日… said and left hanging, are about something else)
        // (and より compares: 去年より三つも多いです)
        const asTime = q0 => !isPart(at(q0 + 1), 'の', 'と', 'が', 'を', 'で', 'では', 'から', 'まで', 'より') && !(ws[sen[q0] + 1] && ws[sen[q0] + 1].punct && /[…‥]/.test(ws[sen[q0] + 1].t));
        if (main && tp >= 0 && tp < mainQ && asTime(tp) && tf < 0 && !subPast(tp) && main.f.tense === 'pres' && !main.f.cond && !main.f.mood && !has(main, 'つもり')) {
          const fx = reform(main, Object.assign({}, main.f, { tense: 'past' }));
          if (fx) add('tense.past', 'major', sen[mainQ], sen[mainQ], fx, `After ${Q(S(sen[tp]))}, use the past: ${Q(fx)}.`);
        }
        // (a change or a decision already made is past whatever its time: 来週の教室は木曜日になりました, これから…することにしました)
        const decided = main && (['ja:なる', 'ja:変わる', 'ja:決まる'].includes(main.id) || (main.id === 'ja:する' && isPart(at(mainQ - 1), 'に') && at(mainQ - 2) && /^(こと|事)$/.test(at(mainQ - 2).form || '')));
        if (main && tf >= 0 && tf < mainQ && asTime(tf) && !decided && main.f.tense === 'past' && !main.f.cond && tp < 0) {
          const fx = reform(main, Object.assign({}, main.f, { tense: 'pres' }));
          if (fx) add('tense.fut', 'major', sen[mainQ], sen[mainQ], fx, `${Q(S(sen[tf]))} hasn't happened yet: ${Q(fx)}.`);
        }
      }
      // polite (only an A): です / ます in one sentence and plain forms in another, in the same answer
      {
        // (a sentence's final form is its last word before the closing particles; one that ends in a request, a noun or a phrase has none;
        //  one inside 「quotes」 is someone else's words: 「わたしが上ります！」 in a plain answer is fine)
        const inQuote = k => {
          let d = 0, s = 0;
          for (let j = 0; j < k; j++) if (ws[j].punct) { const t = ws[j].t; d += (t.match(/[「『“]/g) || []).length - (t.match(/[」』”]/g) || []).length; s += (t.match(/"/g) || []).length; }
          return d > 0 || s % 2 === 1;
        };
        const finals = sentencesOf(ws).map(sen => { for (let q = sen.length - 1; q >= 0; q--) { const w = ws[sen[q]]; if (w.pos === 'part') continue; return isPred(w) || (FL(w, 'cop') && w.f.tense) ? sen[q] : -1; } return -1; }).filter(k => k >= 0 && !inQuote(k));
        const pol = finals.filter(k => ws[k].f.polite), plain = finals.filter(k => !ws[k].f.polite && !ws[k].f.mood);
        if (pol.length && plain.length) for (const k of plain) {
          const fx = reform(ws[k], Object.assign({}, ws[k].f, { polite: true, form: undefined }));
          if (fx) add('polite', 'minor', k, k, fx, `You were using です / ます; keep it up: ${Q(fx)}.`);
        }
      }
      // measure: the counter for the thing counted (猫を三つ → 猫を三匹, 三人の猫 → 三匹の猫)
      for (let k = 0; k < ws.length; k++) {
        const c = ws[k];
        if (!c.counter || c.num == null || c.num < 1 || c.num > 10 || !OBJ_CNT.has(c.counter)) continue;     // (十年, 三時間, 二回: how long or how often, never what's counted)
        if (c.counter === '部' && c.num === 1 && isPart(ws[k + 1], 'の')) continue;                             // (一部の住民: some of the residents)
        if (ws[k + 1] && ws[k + 1].counter && ws[k + 1].num != null) continue;                                    // (本は一人五冊まで: five each)
        let N = null;
        const p1 = ws[k - 1], p2 = ws[k - 2];
        // (二つのグループ: what's counted is the noun after の, when there is one; one the dictionary doesn't count, or doesn't know, isn't judged)
        if (isPart(ws[k + 1], 'の') && ws[k + 2] && (isNoun(ws[k + 2]) || ws[k + 2].unknown)) N = ws[k + 2].counters ? ws[k + 2] : null;
        else if (p1 && isNoun(p1) && p1.counters) N = p1;
        else if (p1 && isPart(p1, 'が', 'を', 'は', 'も') && p2 && isNoun(p2) && p2.counters) N = p2;
        if (!N) continue;
        const ck = c.counter, okList = N.counters.concat(N.counters.includes('個') ? ['つ'] : N.counters.includes('つ') ? ['個'] : []);
        if (okList.includes(ck.split('#')[0]) || okList.includes(ck)) continue;
        const right = N.cl, say = cntSay(right, c.num);
        if (!say) continue;
        const cs = right === 'つ' && c.num === 10 ? '十' : KNUM(c.num) + right;
        const fx = c.src && !hasHan(c.src) ? say : (notate(cs, say) || cs);
        if (N.tags.includes('animal') && ['匹', '頭', '羽'].includes(ck)) continue;          // (a big dog can be 頭, a rabbit 羽: fine)
        const sev = ['つ', '個'].includes(ck) && !N.counters.includes('人') ? 'minor' : 'major';
        add('measure', sev, k, k, fx, `${Q(N.src)} is counted with ${Q(notate(right, CNT[right] ? CNT[right][1] : '') || right)}: ${Q(fx)}.`);
      }
      return errs;
    }

    // ------------------------------------------------------------ fix: the sentence said right (plain text in the mode; the notation in a.fixedSrc)
    function fix(a, errors) {
      const ws = (a && a.words) || [], mode = CJK.mode('ja');
      const ops = (errors || []).filter(x => x && x.at && x._src !== undefined).map(x => ({ i: x.at[0], j: x.at[1], src: x._src })).sort((x, y) => x.i - y.i || y.j - x.j);
      const parts = [];
      let k = 0;
      for (const op of ops) {
        if (op.i < k) continue;
        while (k < op.i) { parts.push(ws[k].src || ws[k].t); k++; }
        if (op.src) parts.push(op.src);
        k = op.j + 1;
      }
      while (k < ws.length) { parts.push(ws[k].src || ws[k].t); k++; }
      const src = parts.filter(Boolean).join(' ');
      if (a) a.fixedSrc = src;
      return CJK.plain(src, { lang: 'ja', mode });
    }

    // ------------------------------------------------------------ gloss: what a word means, and what form it's in (食べました: ate (食べる, polite past))
    function enOf(e, f) {
      const en = e.en;
      if (e.pos === 'v' && !e.fl.cop) {
        const core = enBase(en);
        if (f.form === 'noun') return en;
        if (f.form === 'zu' || f.form === 'zuni') return 'without ' + enIng(en);
        if (f.chau && f.form !== 'te') return (f.tense === 'past' ? 'ended up ' : 'end up ') + enIng(en);
        if (f.want) return (f.neg ? (f.tense === 'past' ? "didn't want to " : "don't want to ") : f.tense === 'past' ? 'wanted to ' : 'want to ') + core;
        if (f.pot) return (f.neg ? (f.tense === 'past' ? "couldn't " : "can't ") : f.tense === 'past' ? 'could ' : 'can ') + core;
        if (f.pass) return (f.tense === 'past' ? 'was ' : 'is ') + (f.neg ? 'not ' : '') + enPart(en);
        if (f.caus) return 'make / let (someone) ' + core;
        if (f.asp === 'prog') return (f.tense === 'past' ? (f.neg ? "wasn't " : 'was ') : (f.neg ? "isn't " : 'is ')) + enIng(en);
        if (f.mood === 'vol') return "let's " + core;
        if (f.mood === 'imp') return core + '!';
        if (f.cond) return (f.neg ? "if (you) don't " : 'if (you) ') + core;
        if (f.form === 'te') return f.neg ? 'without ' + enIng(en) : core + ' (and…)';
        if (f.form === 'nagara') return 'while ' + enIng(en);
        if (f.neg) return (f.tense === 'past' ? "didn't " : "don't ") + core;
        if (f.tense === 'past') return enPast(en);
        return core;
      }
      if (e.pos === 'adj') {
        if (f.form === 'adv') return en + ' (as an adverb)';
        if (f.err) return (f.tense === 'past' ? 'was ' : '') + (f.neg ? 'not ' : '') + en + ' (said like an い-adjective)';
        return (f.tense === 'past' ? (f.neg ? 'was not ' : 'was ') : f.neg ? 'not ' : '') + en;
      }
      if (e.fl.cop) return f.tense === 'past' ? (f.neg ? "wasn't" : 'was') : f.neg ? "isn't" : en;
      return en;
    }
    function fdesc(e, f) {
      const d = [];
      if (e.pos !== 'v' && e.pos !== 'adj' && !e.fl.cop) return '';
      if (f.form === 'noun') return 'the noun';
      if (f.err) return 'should be ' + f.right;
      d.push(f.polite ? 'polite' : (f.tense || f.mood) && !f.cond ? 'plain' : '');
      if (f.asp === 'prog') d.push('ている');
      if (f.want) d.push('たい (want to)');
      if (f.pot) d.push('potential (can)');
      if (f.pass) d.push('passive');
      if (f.caus) d.push('causative');
      if (f.neg) d.push('negative');
      if (f.tense === 'past') d.push('past');
      if (f.form === 'te') d.push('て-form');
      if (f.form === 'stem') d.push('ます-stem');
      if (f.form === 'attr') d.push('before a noun (な)');
      if (f.form === 'adv') d.push('adverb (に / く)');
      if (f.form === 'nagara') d.push('ながら (while)');
      if (f.form === 'tari') d.push('たり (things like)');
      if (f.form === 'zu' || f.form === 'zuni') d.push('ずに (without)');
      if (f.chau) d.push('ちゃう (casual てしまう)');
      if (f.mo) d.push('ても (even if)');
      if (f.mood === 'vol') d.push("volitional (let's)");
      if (f.mood === 'imp') d.push('command');
      if (f.cond === 'ba') d.push('ば (if)');
      if (f.cond === 'tara') d.push('たら (if, when)');
      if (f.cond === 'nara') d.push('なら (if)');
      if (f.form === 'dict' && d.filter(Boolean).length <= 1) return 'dictionary form';
      return d.filter(Boolean).join(' ');
    }
    function gloss(surface, ctx) {
      syncLex();
      const raw = String(surface == null ? '' : surface).trim();
      if (!raw) return null;
      const mode = (ctx && ctx.mode) || CJK.mode('ja');
      let ws;
      if (ctx && ctx.a && ctx.i != null && ctx.a.words && ctx.a.words[ctx.i]) ws = [ctx.a.words[ctx.i]];
      else ws = analyze(raw).words.filter(w => !w.punct);
      if (!ws.length) return null;
      const head = ws.find(w => w.id && w.pos !== 'part') || ws[0];
      const e = head.id ? E.get(head.id) : null;
      const label = ctx && ctx.a ? head.t : raw;
      if (!e) return head.name ? { id: null, lemma: null, en: '(a name)', pos: 'name', form: `${label}: a name` } : null;
      const lem = e.s + (mode === 'roman' ? ' ' + CJK.romaji(e.r) : hasHan(e.s) ? ' ' + e.r : '');
      const base = { id: e.id, lemma: e.lemma, en: e.en, pos: e.pos, band: e.band, cls: e.cls, tags: e.tags, cl: e.cl || null, lex: e.lex || null, f: head.f };
      if (head.counter) {
        const what = head.num != null ? `${head.num} (${CNT_EN[head.counter] || 'counted'})` : `how many (${CNT_EN[head.counter] || 'counted'})`;
        return Object.assign(base, { en: what, form: `${label}: ${what}` });
      }
      if (ws.length > 1 && ws.filter(w => w.pos !== 'part').length > 1) {
        const ph = (F.get(looseKey(ws.map(w => w.form || w.t).join(''))) || []).find(r => r.e.pos === 'phrase');
        if (ph) return Object.assign(base, { id: ph.e.id, lemma: ph.e.lemma, en: ph.e.en, pos: 'phrase', form: `${label}: ${ph.e.en}` });
        return Object.assign(base, { form: `${label}: ${ws.map(w => (w.id ? enOf(E.get(w.id), w.f) : w.t)).join(' + ')}` });
      }
      const en = enOf(e, head.f), d = fdesc(e, head.f);
      const isBase = !d || d === 'dictionary form' || (e.pos === 'adj' && d === 'plain') || head.form === e.s;
      if (e.pos !== 'v' && e.pos !== 'adj' && !e.fl.cop || (isBase && head.form === e.s))
        return Object.assign(base, { form: `${label}: ${e.en} (${lem}${e.cl ? ', counted with ' + e.cl : ''})` });
      return Object.assign(base, { en, form: `${label}: ${en} (${lem}, ${d})` });
    }

    // ------------------------------------------------------------ inflect: a headword in another form (notation)
    function inflect(id, f = {}) {
      const e = E.get(id);
      if (!e) return null;
      if ((e.pos === 'v' && e.cls) || (e.pos === 'adj' && e.cls) || e.fl.cop) {
        const x = formOf(e, Object.assign({ tense: f.mood || f.cond || f.form ? undefined : f.tense || 'pres' }, f));
        return x ? notate(x.s, x.r) || x.s : null;
      }
      return e.lemma;
    }

    // ------------------------------------------------------------ find: every headword a word could be (kanji, kana, rōmaji, any form)
    function find(word) {
      syncLex();
      const raw = String(word == null ? '' : word).trim();
      if (!raw) return [];
      const out = [], addE = e => { if (e && !out.includes(e)) out.push(e); };
      let s = [...raw].filter(c => !/\s/.test(c) && !CJK.isPunct(c) && !/[!?,.]/.test(c)).join(''), r = null;
      if (/\[[^\]|]+\|/.test(raw)) { s = plainOf(raw); r = readOf(raw); }
      const keys = [looseKey(s)];
      if (r) keys.push(looseKey(r));
      if (/^[A-Za-zāīūēōâîûêô'’-]+$/.test(s)) { const us = []; romaRun(s, 0, s.length, us); if (us.length && !us.some(u => u.bad)) keys.push(looseKey(us.map(u => u.ch).join(''))); }
      for (const k of keys) {
        ensure(k);
        const base = x => (x.s === x.e.s || x.r === x.e.r ? 1 : 0), exact = x => (x.s === s || x.r === s ? 1 : 0);
        const L = (F.get(k) || []).slice().sort((x, y) => exact(y) * 2 + base(y) - exact(x) * 2 - base(x) || x.e.band - y.e.band);
        for (const rec of L) addE(rec.e);
      }
      if (!out.length) {
        const a = analyze(raw), core = a.words.filter(w => w.id && !w.punct && w.pos !== 'part');
        if (core.length === 1) { addE(E.get(core[0].id)); (core[0].alts || []).forEach(id => addE(E.get(id))); }
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
        const word = [...surf].some(c => isHan(c) || isKanaC(c) || /[A-Za-z0-9]/.test(c)) && !/^\{/.test(surf);
        const rec = word ? first(surf) : null;
        out.push({ t: surf, s: i, e: j, word, src: tok, id: rec ? rec.e.id : null });
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
      lang: 'ja', entries: E, tokens, analyze, check, fix, gloss, inflect, find,
      connectors: all.filter(e => e.fl.conn).map(e => e.s),
      fillers: all.filter(e => e.fl.fill).map(e => e.s),
      src: id => (E.get(id) ? E.get(id).lemma : null),
      sync: syncLex,
      stats() {
        const bands = [0, 0, 0, 0, 0], pos = {};
        let forms = 0;
        for (const L of F.values()) forms += L.length;
        for (const e of E.values()) { if (e.auto) continue; bands[e.band]++; pos[e.pos] = (pos[e.pos] || 0) + 1; }
        // (forms: written out so far; verbs and adjectives get theirs the first time they're met — lazy, expanded)
        return { headwords: all.filter(e => !e.auto).length, auto: autoN, bands, pos, forms, keys: F.size, lazy: lazyN, expanded: all.filter(e => e._x).length,
          bad: bad.slice(), dups: dups.slice(), phases: PT };
      },
      lexMissing() {
        syncLex();
        const out = [];
        if (typeof LEX !== 'undefined') for (const id of LEX.ids()) {
          const it = LEX.item(id);
          if (!it || typeof it.ja !== 'string' || !it.ja) continue;
          if (!find(it.ja).some(e => e.lex === id || (e.lexs && e.lexs.includes(id)))) out.push(id);
        }
        return out;
      },
      _: { unitize, cover, looseKey, romaRun, F, formOf },
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

  DICT.register('ja', make);

  // ================================================================ the word list (one headword per line; see the top)
  W.push(`
// ---- particles and the copula
は part1 (topic: as for…)
が part1 (subject); but
を part1 (object)
に part1 at, in, to; at (a time)
で part1 at (where something is done); by, with
へ part1 to, toward
と part1 and, with; (quotes)
の part1 's, of; (the one)
も part1 also, too; even
か part1 (question); or
ね part1 …right? isn't it
よ part1 (I tell you)
よね part2 right? (checking)
から part1 from; because, so %conn
まで part1 until, as far as
より part2 than
や part2 and (among others)
など part3 and so on
だけ part2 only, just =w.ml_only
しか part2 only (with a negative)
ばかり part3 nothing but
くらい part2 about, around
ぐらい part2 about, around
ごろ part2 about (a time)
ずつ part3 each
って part2 (quoting: they say)
けど part2 but, though %conn
けれど part3 but %conn
けれども part3 however %conn
ので part2 because, so %conn
のに part3 even though %conn
し part3 and (what's more) %conn
な part3 don't (…な!); (a feeling)
わ part3 (soft feeling)
ぞ part4 (emphasis)
かな part2 I wonder
とか part3 things like, or something
ほど part3 to the point of
について part2 about
として part3 as
です v1 be (is, am, are) %cop
// ---- people words and question words
私 わたし pron1 I, me %p1
僕 ぼく pron1 I, me (boys, casual) %p1
俺 おれ pron3 I, me (rough) %p1
あなた pron1 you %p2
君 きみ pron2 you (casual) %p2
彼 かれ pron2 he, him; boyfriend %p3 @people
彼女 かのじょ pron2 she, her; girlfriend %p3 @people
私たち わたしたち pron1 we, us %p1,pl
僕たち ぼくたち pron2 we (boys) %p1,pl
彼ら かれら pron3 they %p3,pl
みんな pron1 everyone %p3,pl @people
皆さん みなさん pron1 everyone (polite) %p3,pl @people
自分 じぶん pron2 oneself, myself
誰 だれ pron1 who %q
どなた pron2 who (polite) %q
何 なに pron1 what %q
何#nan なん pron1 what (なんですか) %q
何か なにか pron2 something
誰か だれか pron2 someone
どこか pron2 somewhere
何も なにも pron2 nothing (with a negative)
誰も だれも pron2 no one (with a negative)
どこ pron1 where %q
いつ pron1 when %q
どう adv1 how %q
どうして adv1 why %q
なぜ adv2 why %q
どんな det1 what kind of %q
どれ pron1 which one %q
どの det1 which %q
どちら pron2 which (of two); where (polite) %q
どっち pron2 which (of two) %q
いくら adv1 how much %q
いくつ adv1 how many; how old %q
どのくらい adv2 how long, how much %q
これ pron1 this (one)
それ pron1 that (one)
あれ pron1 that (one over there)
この det1 this
その det1 that
あの det1 that (over there)
ここ pron1 here @place %loc
そこ pron1 there @place %loc
あそこ pron1 over there @place %loc
こちら pron2 this way; this person
そちら pron3 that way
あちら pron3 over there
こんな det2 this kind of
そんな det2 that kind of
あんな det3 that kind of
こう adv2 like this
そう adv1 so, like that
// ---- linking words
そして conj1 and, and then %conn
それから conj1 and then, after that %conn
でも conj1 but; even %conn
しかし conj2 however %conn
だから conj2 so, that's why %conn
それで conj3 and so %conn
それに conj3 besides %conn
または conj3 or %conn
つまり conj3 in other words %conn
ところで conj3 by the way %conn
じゃあ conj1 well then %conn
では conj2 well then
もし adv2 if (もし…たら) %hyp
例えば たとえば adv3 for example %conn
// ---- how much, how often
とても adv1 very
すごく adv2 really, very
少し すこし adv1 a little
ちょっと adv1 a little; a moment
たくさん adv1 a lot, many
もっと adv1 more
一番 いちばん adv1 most; number one
よく adv1 often; well
時々 ときどき adv1 sometimes
いつも adv1 always
あまり adv1 not very (with a negative)
全然 ぜんぜん adv2 not at all (with a negative)
まだ adv1 still; not yet
もう adv1 already; anymore
すぐ adv1 right away, soon
また adv1 again
一緒に いっしょに adv1 together
ゆっくり adv1 slowly
本当に ほんとうに adv1 really
本当 ほんとう n1 the truth; real
多分 たぶん adv1 probably, maybe
きっと adv2 surely
ぜひ adv2 by all means
大体 だいたい adv2 mostly, about
特に とくに adv2 especially
初めて はじめて adv1 for the first time
最初 さいしょ n2 the first, the beginning
最後 さいご n2 the last, the end
先に さきに adv2 first, ahead
後で あとで adv1 later
ずっと adv2 all along; much (more)
やっと adv2 at last
急に きゅうに adv3 suddenly
ちょうど adv2 exactly, just
たいてい adv2 usually
なかなか adv2 quite; (not) easily
けっこう adv3 quite, fairly
かなり adv3 fairly
まっすぐ adv1 straight
だんだん adv2 gradually
しっかり adv3 firmly, properly
はっきり adv3 clearly
ほとんど adv2 almost
必ず かならず adv2 without fail
いっぱい adv2 full; a lot
ほか n2 other, else
// ---- greetings and set phrases
こんにちは int1 hello =w.hello
こんばんは int1 good evening
おはよう int1 good morning
おはようございます phrase1 good morning (polite)
さようなら int1 goodbye
じゃあね int1 see you
またね int1 see you
ありがとう int1 thank you =c.thanks
ありがとうございます phrase1 thank you (polite)
どうも adv1 thanks; very much
すみません phrase1 excuse me; sorry
ごめんなさい phrase1 I'm sorry
ごめん int2 sorry (casual)
お願いします おねがいします phrase1 please =c.please
お願い おねがい n1 a favor, a request
ください phrase1 please (give me); please (do)
どうぞ adv1 please, go ahead
いただきます phrase1 thanks for the food (before eating)
ごちそうさま phrase1 thanks for the meal (after eating)
いらっしゃいませ phrase2 welcome (in a shop)
はじめまして phrase1 nice to meet you
よろしく adv1 nice to meet you; please treat me well
おやすみなさい phrase1 good night
おやすみ int1 good night (casual)
いってきます phrase2 I'm off (leaving home)
ただいま phrase2 I'm home
おかえり int2 welcome home
はい int1 yes =c.yes
いいえ int1 no
うん int1 yeah
ううん int2 nope
ええ int2 yes (polite)
いや int3 no
なるほど int2 I see
もしもし int2 hello (on the phone)
えっと int1 um %fill
ええと int2 um %fill
あのう int2 um, excuse me %fill
まあ int2 well %fill
さあ int3 well, come on %fill
ほら int2 look!
おい int3 hey
やった int2 yay, I did it
おめでとう int2 congratulations
// ---- numbers and honorifics
一 いち num1 one =n.1
二 に num1 two =n.2
三 さん num1 three =n.3,c.three
四 よん num1 four =n.4
五 ご num1 five =n.5
六 ろく num1 six =n.6
七 なな num1 seven =n.7
八 はち num1 eight =n.8
九 きゅう num1 nine =n.9
十 じゅう num1 ten =n.10
十一 じゅういち num1 eleven =n.11
十二 じゅうに num1 twelve =n.12
十三 じゅうさん num1 thirteen =n.13
十四 じゅうよん num1 fourteen =n.14
十五 じゅうご num1 fifteen =n.15
十六 じゅうろく num1 sixteen =n.16
十七 じゅうなな num1 seventeen =n.17
十八 じゅうはち num1 eighteen =n.18
十九 じゅうきゅう num1 nineteen =n.19
二十 にじゅう num1 twenty =n.20
百 ひゃく num1 hundred
千 せん num1 thousand
万 まん num2 ten thousand
半 はん n1 half
ゼロ num1 zero
さん n1 Mr., Ms. (after a name) %hon @people
くん n2 (after a boy's name) %hon
ちゃん n1 (after a kid's or friend's name) %hon
様 さま n3 Mr., Ms. (very polite) %hon
先生 せんせい n1 teacher; (after a name) Dr., Master #人 %hon @school,people =w.teacher
// ---- when
今日 きょう n1 today @time %tn
明日 あした n1 tomorrow @time %tf
昨日 きのう n1 yesterday @time %tp
おととい n2 the day before yesterday @time %tp
あさって n2 the day after tomorrow @time %tf
今朝 けさ n2 this morning @time %tn
今晩 こんばん n1 tonight @time %tn
今夜 こんや n2 tonight @time %tn
昨夜 ゆうべ n3 last night @time %tp
毎日 まいにち n1 every day @time
毎朝 まいあさ n1 every morning @time
毎晩 まいばん n1 every night @time
毎週 まいしゅう n1 every week @time
毎月 まいつき n2 every month @time
毎年 まいとし n2 every year @time
今週 こんしゅう n1 this week @time %tn
先週 せんしゅう n1 last week @time %tp
来週 らいしゅう n1 next week @time %tf
今月 こんげつ n1 this month @time %tn
先月 せんげつ n1 last month @time %tp
来月 らいげつ n1 next month @time %tf
今年 ことし n1 this year @time %tn
去年 きょねん n1 last year @time %tp
来年 らいねん n1 next year @time %tf
今 いま n1 now @time %tn
朝 あさ n1 morning @time
昼 ひる n1 noon, daytime @time
夜 よる n1 night @time
晩 ばん n2 evening @time
午前 ごぜん n1 a.m., morning @time
午後 ごご n1 p.m., afternoon @time
夕方 ゆうがた n2 early evening @time
週末 しゅうまつ n2 the weekend @time %tn
時間#n じかん n1 time @time
時#n とき n1 time; when (…時) @time
前 まえ n1 before; in front @place %loc
後 あと n2 after, later
後ろ うしろ n1 behind @place %loc
さっき adv3 a moment ago @time %tp
この前 このまえ n2 the other day @time %tp
今度 こんど n2 next time; this time @time
将来 しょうらい n2 the future @time %tf
昔 むかし n2 long ago, the old days @time
最近 さいきん n2 lately @time
これから adv2 from now on @time %tf
月曜日 げつようび n1 Monday @time %tni
火曜日 かようび n1 Tuesday @time %tni
水曜日 すいようび n1 Wednesday @time %tni
木曜日 もくようび n1 Thursday @time %tni
金曜日 きんようび n1 Friday @time %tni
土曜日 どようび n1 Saturday @time %tni
日曜日 にちようび n1 Sunday @time %tni
誕生日 たんじょうび n1 birthday @time %tni
春 はる n1 spring @time,weather
夏 なつ n1 summer @time,weather
秋 あき n1 autumn @time,weather
冬 ふゆ n1 winter @time,weather
季節 きせつ n3 season @time
週 しゅう n2 week @time
年#n とし n2 year; age @time
月#n つき n2 moon; month @nature,time
日#n ひ n2 day; sun @time
休み やすみ n1 rest; holiday, day off @time
夏休み なつやすみ n1 summer vacation @time,school
`);
  W.push(`
// ---- verbs: ichidan (る-verbs)
いる vi1 be (someone is there), stay %ni,top
見る みる vi1 look, see, watch %vt,act
食べる たべる vi1 eat %vt,act =v.eat @food
寝る ねる vi1 sleep, go to bed %when
起きる おきる vi1 get up, wake up %when
着る きる vi1 wear, put on (clothes) %vt @clothes
出る でる vi1 go out, leave; appear %when
出かける でかける vi1 go out %when
開ける あける vi1 open %vt
閉める しめる vi1 close %vt
教える おしえる vi1 teach, tell %vt,act @school
覚える おぼえる vi1 remember, memorize %vt
忘れる わすれる vi1 forget %vt
借りる かりる vi1 borrow %vt
浴びる あびる vi1 take (a shower) %vt
できる vi1 can, be able to; be made %ga
降りる おりる vi1 get off @transport
つける vi1 turn on %vt
入れる いれる vi1 put in %vt
疲れる つかれる vi1 get tired @feeling
生まれる うまれる vi1 be born %when
上げる あげる vi1 give; raise %vt
くれる vi1 give (to me)
始める はじめる vi2 begin %vt,when
続ける つづける vi2 continue %vt
答える こたえる vi2 answer
考える かんがえる vi2 think about %vt
見える みえる vi2 can be seen
聞こえる きこえる vi2 can be heard
投げる なげる vi2 throw =v.throw %vt,act
捨てる すてる vi2 throw away %vt
決める きめる vi2 decide %vt
調べる しらべる vi2 look up, check %vt,act
集める あつめる vi2 collect %vt
止める とめる vi2 stop (something) %vt
晴れる はれる vi2 clear up (weather) @weather
遅れる おくれる vi2 be late
慣れる なれる vi2 get used to
見せる みせる vi2 show %vt
助ける たすける vi2 help, save %vt
逃げる にげる vi2 run away
負ける まける vi2 lose
落ちる おちる vi2 fall
変える かえる vi2 change (something) %vt
片付ける かたづける vi2 tidy up %vt,act @home
過ぎる すぎる vi2 pass; be too much
見つける みつける vi2 find %vt
間違える まちがえる vi2 make a mistake %vt
消える きえる vi2 go out, disappear @hush
比べる くらべる vi3 compare %vt
迎える むかえる vi3 welcome, go to meet %vt
伝える つたえる vi3 tell, pass on %vt
信じる しんじる vi3 believe %vt
感じる かんじる vi3 feel %vt
植える うえる vi3 plant %vt @nature
育てる そだてる vi3 raise, grow %vt
ほめる vi3 praise %vt
足りる たりる vi3 be enough
並べる ならべる vi3 line up %vt
建てる たてる vi3 build %vt
受ける うける vi3 receive; take (an exam) %vt
届ける とどける vi3 deliver %vt
分ける わける vi3 divide, share %vt
着替える きがえる vi3 change clothes @clothes
覚める さめる vi3 wake up
冷える ひえる vi3 get cold
燃える もえる vi3 burn
// ---- verbs: godan (う-verbs)
会う あう vg1 meet %when
言う いう vg1 say
歌う うたう vg1 sing %vt,act =v.sing @music
買う かう vg1 buy %vt,act @shop
吸う すう vg3 breathe in
使う つかう vg1 use %vt,act
手伝う てつだう vg2 help %vt,act
習う ならう vg1 learn (from someone) %vt,act @school
洗う あらう vg1 wash %vt,act
笑う わらう vg2 laugh, smile
思う おもう vg1 think
違う ちがう vg2 be different; be wrong
払う はらう vg2 pay %vt @money
もらう vg1 receive, get %vt
拾う ひろう vg3 pick up %vt
向かう むかう vg3 head for %go
間に合う まにあう vg3 be in time
似合う にあう vg2 suit, look good on
戦う たたかう vg3 fight %act
行く いく vg1 go %go,when,top
書く かく vg1 write %vt,act
聞く きく vg1 listen; ask %vt,act
歩く あるく vg1 walk %act
働く はたらく vg1 work %act @work
泣く なく vg2 cry
着く つく vg2 arrive %go,when
開く あく vg2 open (by itself)
置く おく vg2 put %vt
引く ひく vg2 pull; (water) go down
弾く ひく vg2 play (the piano, the guitar) %vt,act @music
咲く さく vg2 bloom @nature
描く かく vg3 draw, paint %vt,act @art
動く うごく vg2 move
吹く ふく vg3 blow =v.blow %vt
叩く たたく vg3 hit, tap %vt
磨く みがく vg2 brush, polish %vt
脱ぐ ぬぐ vg2 take off (clothes) %vt @clothes
泳ぐ およぐ vg1 swim %act =v.swim @sport
急ぐ いそぐ vg2 hurry
騒ぐ さわぐ vg3 make noise
話す はなす vg1 speak, talk %vt,act
貸す かす vg1 lend %vt
返す かえす vg2 give back %vt
出す だす vg1 take out; send %vt
押す おす vg1 push =v.push %vt
消す けす vg1 turn off; erase %vt
探す さがす vg2 look for %vt,act
渡す わたす vg2 hand over %vt
直す なおす vg2 fix %vt
落とす おとす vg2 drop %vt
無くす なくす vg3 lose %vt =w.ml_lose
起こす おこす vg3 wake (someone) up %vt
引っ越す ひっこす vg2 move (house) @home
待つ まつ vg1 wait %vt,act =c.wait
持つ もつ vg1 hold, have, carry %vt
立つ たつ vg1 stand
勝つ かつ vg2 win
打つ うつ vg3 hit =v.hit %vt,act
死ぬ しぬ vg2 die
遊ぶ あそぶ vg1 play, have fun %act @hobby
呼ぶ よぶ vg2 call %vt
跳ぶ とぶ vg3 jump =v.jump
飛ぶ とぶ vg1 fly
選ぶ えらぶ vg2 choose %vt
並ぶ ならぶ vg3 line up
喜ぶ よろこぶ vg3 be glad
運ぶ はこぶ vg3 carry %vt
学ぶ まなぶ vg3 learn %vt,act
飲む のむ vg1 drink %vt,act @drink
読む よむ vg1 read %vt,act
休む やすむ vg1 rest; take a day off %act
住む すむ vg1 live (somewhere) %ni
頼む たのむ vg2 ask (a favor) %vt
楽しむ たのしむ vg3 enjoy %vt
込む こむ vg2 be crowded
盗む ぬすむ vg3 steal %vt
進む すすむ vg3 go forward
取る とる vg1 take %vt
撮る とる vg2 take (a photo) %vt,act @hobby
作る つくる vg1 make %vt,act
帰る かえる vg1 go home, go back %go,when
入る はいる vg1 enter, go in %go
分かる わかる vg1 understand %ga
ある vg1 there is; have (things)
知る しる vg2 know
乗る のる vg1 ride, get on @transport
終わる おわる vg1 end, finish
始まる はじまる vg2 begin %when
座る すわる vg2 sit %ni
走る はしる vg1 run %act @sport
降る ふる vg1 fall (rain, snow) @weather
登る のぼる vg2 climb =v.climb
困る こまる vg2 be in trouble
触る さわる vg3 touch
送る おくる vg2 send %vt
売る うる vg2 sell %vt @shop
切る きる vg1 cut %vt
曲がる まがる vg2 turn
止まる とまる vg2 stop; land (on a branch) =w.gd_land
泊まる とまる vg2 stay (the night) %ni @travel
集まる あつまる vg3 gather
決まる きまる vg3 be decided
頑張る がんばる vg1 do your best
怒る おこる vg2 get angry @feeling
踊る おどる vg2 dance %act @music
守る まもる vg3 protect %vt
戻る もどる vg2 go back %go,when
眠る ねむる vg3 sleep
要る いる vg2 need %ga
なる vg1 become
やる vg2 do (casual) %vt
かかる vg2 take (time, money)
上がる あがる vg2 go up
下がる さがる vg3 go down
変わる かわる vg3 change
見つかる みつかる vg3 be found
助かる たすかる vg3 be a help
光る ひかる vg3 shine
祈る いのる vg3 pray
くださる vg3 give (to me, polite)
// ---- verbs: する and 来る
する vs1 do %vt,act
来る くる vk1 come %go,when,top
勉強する べんきょうする vs1 study %vt,act @school
料理する りょうりする vs1 cook %vt,act @food
練習する れんしゅうする vs1 practice %vt,act
散歩する さんぽする vs1 take a walk %act
買い物する かいものする vs1 go shopping %act @shop
掃除する そうじする vs1 clean %vt,act @home
洗濯する せんたくする vs1 do the laundry %act @home
電話する でんわする vs1 phone @tech
結婚する けっこんする vs2 get married %when @family
運動する うんどうする vs2 exercise %act @sport
旅行する りょこうする vs2 travel @travel
留学する りゅうがくする vs3 study abroad @school
仕事する しごとする vs2 work %act @work
質問する しつもんする vs2 ask a question
説明する せつめいする vs2 explain %vt
紹介する しょうかいする vs2 introduce %vt
準備する じゅんびする vs2 prepare %vt
予約する よやくする vs2 book, reserve %vt
注文する ちゅうもんする vs2 order (food) %vt @food
心配する しんぱいする vs2 worry @feeling
安心する あんしんする vs3 feel relieved @feeling
卒業する そつぎょうする vs2 graduate %when @school
入学する にゅうがくする vs3 start school @school
出発する しゅっぱつする vs2 set off %when @travel
到着する とうちゃくする vs3 arrive %go
連絡する れんらくする vs2 get in touch
約束する やくそくする vs2 promise
失敗する しっぱいする vs3 fail
成功する せいこうする vs3 succeed
経験する けいけんする vs3 experience %vt
研究する けんきゅうする vs3 research %vt,act
相談する そうだんする vs3 talk over, consult
案内する あんないする vs3 show around %vt
招待する しょうたいする vs3 invite %vt
感謝する かんしゃする vs3 be grateful
期待する きたいする vs3 expect, hope
計画する けいかくする vs3 plan %vt
生活する せいかつする vs2 live (a life) %act
運転する うんてんする vs2 drive %vt,act @transport
復習する ふくしゅうする vs2 review (lessons) %vt,act @school
予習する よしゅうする vs3 prepare (lessons) %vt @school
遅刻する ちこくする vs2 be late @school
返事する へんじする vs3 reply
ジャンプする vs2 jump
ジャンプ n2 a jump
パンチ n3 a punch
ダンス n2 dance @music
`);
  W.push(`
// ---- い-adjectives
大きい おおきい ai1 big =a.big
小さい ちいさい ai1 small, little =a.small
大きな おおきな det1 big (before a noun)
小さな ちいさな det1 small (before a noun)
新しい あたらしい ai1 new
古い ふるい ai1 old (things)
いい ai1 good, nice +
良い よい ai2 good +
悪い わるい ai1 bad -
高い たかい ai1 high, tall; expensive
安い やすい ai1 cheap
低い ひくい ai1 low; short
長い ながい ai1 long
短い みじかい ai1 short
多い おおい ai1 many, a lot
少ない すくない ai1 few, little
暑い あつい ai1 hot (weather) @weather
熱い あつい ai2 hot (to the touch)
寒い さむい ai1 cold (weather) @weather
冷たい つめたい ai1 cold (to the touch)
暖かい あたたかい ai1 warm @weather
涼しい すずしい ai1 cool @weather
近い ちかい ai1 near
遠い とおい ai1 far
早い はやい ai1 early
速い はやい ai1 fast
遅い おそい ai1 late; slow
難しい むずかしい ai1 difficult
優しい やさしい ai2 kind, gentle + =w.gd_kind
易しい やさしい ai2 easy
楽しい たのしい ai1 fun, enjoyable @feeling +
面白い おもしろい ai1 interesting, funny +
つまらない ai1 boring -
美味しい おいしい ai1 delicious @food +
まずい ai2 tastes bad @food -
甘い あまい ai1 sweet @food
辛い からい ai1 spicy @food
しょっぱい ai3 salty @food
苦い にがい ai3 bitter @food
酸っぱい すっぱい ai3 sour @food
忙しい いそがしい ai1 busy
嬉しい うれしい ai1 happy, glad @feeling +
悲しい かなしい ai2 sad @feeling -
寂しい さびしい ai2 lonely @feeling - =w.pf_lonely
怖い こわい ai2 scary; scared @feeling
恥ずかしい はずかしい ai2 embarrassed @feeling
痛い いたい ai1 it hurts, painful @health
眠い ねむい ai2 sleepy @feeling
可愛い かわいい ai1 cute +
かっこいい ai2 cool +
すごい ai1 amazing; very +
ひどい ai3 terrible -
強い つよい ai1 strong
弱い よわい ai1 weak
重い おもい ai2 heavy
軽い かるい ai2 light
広い ひろい ai1 wide, roomy
狭い せまい ai1 narrow, cramped =w.pkp_narrow
明るい あかるい ai1 bright; cheerful
暗い くらい ai1 dark
太い ふとい ai2 thick
細い ほそい ai2 thin
若い わかい ai1 young
汚い きたない ai1 dirty
うるさい ai1 noisy; annoying
危ない あぶない ai1 dangerous
丸い まるい ai2 round
深い ふかい ai2 deep
浅い あさい ai3 shallow
固い かたい ai3 hard
柔らかい やわらかい ai3 soft =w.pkf_soft
薄い うすい ai3 thin; light (color) =w.pkf_thin
珍しい めずらしい ai3 rare, unusual
正しい ただしい ai3 right, correct
詳しい くわしい ai3 detailed
素晴らしい すばらしい ai3 wonderful + =w.lp_magnificent
懐かしい なつかしい ai3 nostalgic
羨ましい うらやましい ai3 envious
親しい したしい ai3 close (friends)
くやしい ai3 frustrating (after losing) @feeling -
ずるい ai3 unfair, sneaky -
おしい ai3 so close!
赤い あかい ai1 red =a.red @color
青い あおい ai1 blue =a.blue @color
白い しろい ai1 white =a.white @color
黒い くろい ai1 black @color
黄色い きいろい ai1 yellow =a.yellow @color
茶色い ちゃいろい ai2 brown @color
欲しい ほしい ai1 want (a thing) %ga =w.pf_iwant
ない ai1 there isn't; not
// ---- な-adjectives
好き すき an1 like %ga +
嫌い きらい an1 dislike, hate %ga -
大好き だいすき an1 love, really like %ga +
大嫌い だいきらい an2 really hate %ga -
上手 じょうず an1 good at %ga
下手 へた an1 bad at %ga
得意 とくい an2 good at, a strong point %ga,cmp
苦手 にがて an2 bad at, not my thing %ga,cmp
きれい an1 pretty; clean +
静か しずか an1 quiet
賑やか にぎやか an2 lively
元気 げんき an1 well, energetic +
有名 ゆうめい an1 famous
親切 しんせつ an1 kind +
便利 べんり an1 convenient
不便 ふべん an2 inconvenient
大切 たいせつ an1 important, precious
大事 だいじ an2 important %cmp
大変 たいへん an1 hard, tough; very
簡単 かんたん an2 easy, simple
暇 ひま an1 free (not busy)
丈夫 じょうぶ an2 sturdy, healthy
大丈夫 だいじょうぶ an1 OK, all right +
同じ おなじ det1 the same
いろいろ an1 various
特別 とくべつ an2 special %cmp
自由 じゆう an2 free %cmp
安全 あんぜん an2 safe %cmp
危険 きけん an3 dangerous %cmp
幸せ しあわせ an2 happy @feeling +
残念 ざんねん an2 a pity, too bad
無理 むり an2 impossible, too much %cmp
必要 ひつよう an2 necessary %cmp
変 へん an2 strange
ハンサム an2 handsome
素敵 すてき an2 lovely +
真面目 まじめ an2 serious, hard-working
正直 しょうじき an3 honest %cmp
複雑 ふくざつ an3 complicated
丁寧 ていねい an3 polite, careful =w.gd_polite
確か たしか an3 certain; I think %cmp
楽 らく an2 easy, comfortable
嫌 いや an2 unpleasant; no way -
平気 へいき an3 fine, not bothered %cmp
退屈 たいくつ an3 bored, boring
不思議 ふしぎ an3 mysterious @fantasy
最高 さいこう an2 the best + %cmp
最低 さいてい an3 the worst - %cmp
// ---- colors and feelings
色 いろ n1 color @color
赤 あか n1 red @color
青 あお n1 blue @color
白 しろ n1 white @color
黒 くろ n1 black @color
緑 みどり n1 green =a.green @color
黄色 きいろ n2 yellow @color
茶色 ちゃいろ n2 brown @color
紫 むらさき n3 purple @color
ピンク n2 pink @color
灰色 はいいろ n3 gray @color
金色 きんいろ n3 gold @color
銀色 ぎんいろ n3 silver @color
水色 みずいろ n3 light blue @color
気持ち きもち n2 feeling @feeling
心 こころ n2 heart, mind =w.heart @feeling
愛 あい n3 love @feeling
夢 ゆめ n2 dream
希望 きぼう n3 hope
気分 きぶん n3 mood @feeling
涙 なみだ n3 tears @body
笑顔 えがお n3 smile @body
`);
  W.push(`
// ---- people and family
人#n ひと n1 person #人 @people
男 おとこ n1 man #人 @people
女 おんな n1 woman #人 @people
男の人 おとこのひと n1 man #人 @people
女の人 おんなのひと n1 woman #人 @people
男の子 おとこのこ n1 boy #人 @people
女の子 おんなのこ n1 girl #人 @people
子供 こども n1 child #人 @people,family
大人 おとな n1 adult #人 @people
友達 ともだち n1 friend #人 =c.friend @people
家族 かぞく n1 family #人 @family
父 ちち n1 (my) father #人 @family
母 はは n1 (my) mother #人 @family
お父さん おとうさん n1 father, dad #人 @family
お母さん おかあさん n1 mother, mom #人 @family
兄 あに n1 (my) older brother #人 @family
姉 あね n1 (my) older sister #人 @family
弟 おとうと n1 younger brother #人 @family
妹 いもうと n1 younger sister #人 @family
お兄さん おにいさん n1 older brother #人 @family
お姉さん おねえさん n1 older sister #人 @family
兄弟 きょうだい n1 brothers and sisters #人 @family
両親 りょうしん n1 parents #人 @family
祖父 そふ n2 (my) grandfather #人 @family
祖母 そぼ n2 (my) grandmother #人 @family
おじいさん n1 grandfather; old man #人 @family
おばあさん n1 grandmother; old woman #人 @family
おじいちゃん n2 grandpa #人 @family
おばあちゃん n2 grandma #人 @family
おじさん n2 uncle; mister #人 @family
おばさん n2 aunt; ma'am #人 @family
息子 むすこ n2 son #人 @family
娘 むすめ n2 daughter #人 @family
夫 おっと n2 husband #人 @family
妻 つま n2 wife #人 @family
赤ちゃん あかちゃん n2 baby #人 @family
孫 まご n3 grandchild #人 @family
親 おや n3 parent #人 @family
恋人 こいびと n3 boyfriend, girlfriend #人 @people
仲間 なかま n2 friend, teammate #人 @people
学生 がくせい n1 student #人 @school,people
生徒 せいと n2 pupil #人 @school,people
留学生 りゅうがくせい n2 international student #人 @school,people
医者 いしゃ n1 doctor #人 @health,work
看護師 かんごし n3 nurse #人 @health,work
警察官 けいさつかん n3 police officer #人 @work
会社員 かいしゃいん n2 office worker #人 @work
店員 てんいん n2 shop clerk #人 @work,shop
社長 しゃちょう n3 company president #人 @work
歌手 かしゅ n2 singer #人 @music
パン屋 ぱんや n2 bakery; baker #軒 =w.baker @food,shop %place
仕立屋 したてや n4 tailor #人 =w.seamstress @work
郵便屋 ゆうびんや n4 mail carrier #人 =w.postman @work
庭師 にわし n4 gardener #人 =w.gardener @work,nature
音楽家 おんがくか n3 musician #人 =w.musician @music
料理人 りょうりにん n3 cook #人 @food,work
農家 のうか n3 farmer #人 @work
客 きゃく n2 guest; customer #人 @people
お客さん おきゃくさん n2 guest; customer #人 @people
隣 となり n2 next door, next to @place %loc
近所 きんじょ n3 neighborhood @place
王 おう n3 king #人 @story
キング n3 king (chess) =w.king @hobby
クイーン n3 queen (chess) =w.queen @hobby
ナイト n3 knight (chess) =w.knight @hobby
ビショップ n4 bishop (chess) =w.bishop @hobby
ルーク n4 rook (chess) =w.rook @hobby
ポーン n4 pawn (chess) =w.pawn @hobby
チェス n2 chess =w.chess @hobby
チェッカー n4 checkers =w.checkers @hobby
// ---- animals
動物 どうぶつ n1 animal #匹 @animal
犬 いぬ n1 dog #匹 @animal
猫 ねこ n1 cat #匹 =w.cat @animal
鳥 とり n1 bird #羽 =w.bird @animal
魚 さかな n1 fish #匹 @animal,food
馬 うま n2 horse #頭 @animal
牛 うし n2 cow #頭 @animal
豚 ぶた n2 pig #頭,匹 @animal
羊 ひつじ n3 sheep #頭,匹 @animal
鶏 にわとり n3 chicken #羽 @animal
うさぎ n2 rabbit #羽,匹 @animal
熊 くま n3 bear #頭,匹 @animal
猿 さる n3 monkey #匹 @animal
象 ぞう n2 elephant #頭 @animal
ライオン n2 lion #頭,匹 @animal
虎 とら n3 tiger #頭,匹 @animal
パンダ n2 panda #頭,匹 @animal
きつね n2 fox #匹 =w.fox @animal
たぬき n3 raccoon dog #匹 @animal
ねずみ n3 mouse #匹 @animal
蛇 へび n3 snake #匹 @animal
竜 りゅう n3 dragon #匹 @animal,fantasy
亀 かめ n3 turtle #匹 @animal
カエル n2 frog #匹 =n.frog @animal
カラス n3 crow #羽 =w.crow @animal
虫 むし n2 bug, insect #匹 @animal
蝶 ちょう n3 butterfly #匹 @animal =w.gd_butterfly
蛾 が n4 moth #匹 =n.moth @animal
カブトムシ n3 beetle #匹 =n.beetle @animal
アルマジロ n4 armadillo #匹 =n.armadillo @animal
コウモリ n4 bat #匹 =n.bat @animal
ハチ n3 bee #匹 =w.bee,n.bee @animal
カナリア n4 canary #羽 =w.canary @animal
金魚 きんぎょ n2 goldfish #匹 =k.mtFish @animal
ペット n2 pet #匹 @animal
だまりっこ n2 Hushling #匹 =n.hushling @hush
大だまりっこ おおだまりっこ n3 big Hushling #匹 =n.hushbig @hush
かかし n3 scarecrow; straw dummy =w.scarecrow,n.dummy @hush
コーン n3 corn kernel; corn =n.kernel @food
ポップコーン n3 popcorn =n.popcorn @food
大佐 たいさ n4 colonel #人 =n.colonel @story
雪玉 ゆきだま n3 snowball #個,つ =n.snowball @weather
トウモロコシ n3 corn #本 =w.corn @food
// ---- the body and health
体 からだ n1 body @body
頭#n あたま n1 head =n.head @body
顔 かお n1 face @body
目 め n1 eye @body
耳 みみ n1 ear @body
鼻 はな n1 nose @body
口 くち n1 mouth @body
歯 は n1 tooth #本 @body
手 て n1 hand @body
足#n あし n1 foot, leg #本 @body
指 ゆび n2 finger #本 @body
髪 かみ n2 hair @body
首 くび n2 neck @body
背中 せなか n3 back @body
お腹 おなか n1 stomach, belly @body
肩 かた n3 shoulder @body
声 こえ n1 voice @body,music
しっぽ n3 tail =n.tail @animal
羽#n はね n3 wing; feather =n.wing @animal
甲羅 こうら n4 shell =n.shell @animal
病気 びょうき n1 illness @health
風邪 かぜ n1 a cold @health
熱 ねつ n2 fever @health
薬 くすり n1 medicine @health
けが n3 injury @health
病院 びょういん n1 hospital #軒 @health,place %place
// ---- home and things
家 いえ n1 house, home #軒 =w.house @home %place
うち n1 home, my house @home %place
部屋 へや n1 room @home %place
台所 だいどころ n2 kitchen @home %place
トイレ n1 toilet, restroom @home %place
お風呂 おふろ n1 bath @home
玄関 げんかん n3 entrance hall @home
庭 にわ n2 garden, yard =w.garden @home,nature %place
窓 まど n1 window #枚 =w.window @home
ドア n1 door #枚 =w.door @home
戸 と n3 door @home
机 つくえ n1 desk #台 @home
テーブル n1 table #台 =w.table @home
椅子 いす n1 chair =w.chair @home
ベッド n1 bed #台 =w.bed @home
本#n ほん n1 book #冊 =w.book @school
ノート n1 notebook #冊 @school
紙 かみ n1 paper #枚 =w.paper @school
ペン n1 pen #本 @school
鉛筆 えんぴつ n1 pencil #本 @school
消しゴム けしごむ n2 eraser #個,つ @school
かばん n1 bag #個,つ @clothes
傘 かさ n1 umbrella #本 @weather
鍵 かぎ n2 key #本,個 @home
時計 とけい n1 clock, watch #台,個 =w.clock @home
電話 でんわ n1 telephone; a phone call (電話を一本: one call) #台,本,通 @tech
携帯 けいたい n2 cell phone #台 @tech
スマホ n2 smartphone #台 @tech
パソコン n1 computer #台 @tech
テレビ n1 TV #台 @tech
ラジオ n2 radio #台 @tech
カメラ n1 camera #台 @tech
冷蔵庫 れいぞうこ n2 fridge #台 @home
エアコン n2 air conditioner #台 @home
電気 でんき n1 electricity; the light @home
ランプ n3 lamp =w.lamp @home
ランタン n4 lantern =w.lantern @home
ろうそく n3 candle #本 =w.candle @home
カップ n2 cup #個,つ =w.cup @home
コップ n1 glass, cup #個,つ @home
皿 さら n1 plate #枚 =w.plate @home
箸 はし n2 chopsticks #本 @home,food
スプーン n1 spoon #本 @home
フォーク n1 fork #本 @home
ナイフ n1 knife #本 @home
じゅうたん n4 rug, carpet #枚 =w.rug @home
オーブン n3 oven #台 =w.oven @home
毛布 もうふ n3 blanket #枚 =w.blanket @home
はさみ n3 scissors =w.scissors @home
ハンマー n4 hammer #本 =w.hammer @home
ロープ n3 rope #本 =w.rope @home
オール n4 oar #本 =w.oar @transport
レコード n3 record (vinyl) #枚 =w.record @music
手紙 てがみ n1 letter #通 =w.letter @story
写真 しゃしん n1 photo #枚 =w.photo @hobby
名前 なまえ n1 name =w.name
新聞 しんぶん n1 newspaper #部 =w.newspaper
雑誌 ざっし n1 magazine #冊
地図 ちず n1 map #枚 @travel
切手 きって n1 stamp #枚
封筒 ふうとう n2 envelope #枚
箱 はこ n1 box #個,つ
物 もの n1 thing, stuff
こと n1 thing, matter
おもちゃ n2 toy #個,つ @hobby
プレゼント n1 present, gift #個,つ @shop
懐中時計 かいちゅうどけい n4 pocket watch #個 =k.pocketWatch
鐘 かね n3 bell =w.bell @hush
銅鑼 どら n4 gong =w.gong @music
水晶 すいしょう n4 crystal #個 =w.crystal @nature
巣箱 すばこ n4 beehive; birdhouse #個 =w.hive @nature
温室 おんしつ n4 greenhouse =w.greenhouse @nature %place
帽子 ぼうし n1 hat, cap #個,つ =w.hat @clothes
// ---- clothes
服 ふく n1 clothes #着,枚 @clothes
洋服 ようふく n1 clothes #着,枚 @clothes
シャツ n1 shirt #枚 @clothes
ズボン n1 trousers #本 @clothes
スカート n1 skirt #枚 @clothes
コート n1 coat #着,枚 @clothes
セーター n1 sweater #枚 @clothes
靴 くつ n1 shoes #足 @clothes
靴下 くつした n1 socks #足 @clothes
眼鏡 めがね n1 glasses @clothes
ネクタイ n1 tie #本 @clothes
着物 きもの n2 kimono #着,枚 @clothes
浴衣 ゆかた n3 yukata (summer kimono) #着,枚 @clothes
エプロン n3 apron #枚 @clothes
指輪 ゆびわ n3 ring #個,つ @clothes
お面 おめん n4 (festival) mask #個,つ @clothes
はちまき n4 headband #本 @clothes
`);
  W.push(`
// ---- food and drink
ご飯 ごはん n1 rice; a meal #杯 @food
朝ご飯 あさごはん n1 breakfast @food
昼ご飯 ひるごはん n1 lunch @food
晩ご飯 ばんごはん n1 dinner @food
夕ご飯 ゆうごはん n2 dinner @food
食べ物 たべもの n1 food @food
飲み物 のみもの n1 drink @drink
料理 りょうり n1 cooking; a dish @food
パン n1 bread #枚,個 =w.bread @food
肉 にく n1 meat @food
牛肉 ぎゅうにく n1 beef @food
豚肉 ぶたにく n1 pork @food
鶏肉 とりにく n1 chicken (meat) @food
卵 たまご n1 egg #個,つ @food
野菜 やさい n1 vegetables @food
果物 くだもの n1 fruit #個,つ @food
りんご n1 apple #個,つ =w.apple @food
バナナ n1 banana #本 @food
みかん n2 tangerine #個,つ @food
オレンジ n1 orange #個,つ =w.orange @food
梨 なし n3 pear #個,つ =w.pear @food
いちご n2 strawberry #個,つ @food
ぶどう n2 grapes @food
すいか n2 watermelon #個,つ @food
桃 もも n3 peach #個,つ @food
トマト n2 tomato #個,つ @food
じゃがいも n3 potato #個,つ @food
にんじん n3 carrot #本 @food
玉ねぎ たまねぎ n3 onion #個,つ @food
きのこ n3 mushroom #本,個 =w.mushroom @food,nature
米 こめ n2 rice (grains) @food
寿司 すし n1 sushi #個,つ @food
天ぷら てんぷら n1 tempura @food
ラーメン n1 ramen #杯 =w.noodles @food
うどん n2 udon noodles #杯 @food
そば n2 soba noodles #杯 @food
カレー n1 curry @food
おにぎり n2 rice ball #個,つ @food
弁当 べんとう n2 boxed lunch #個,つ @food
お弁当 おべんとう n2 boxed lunch #個,つ @food
味噌汁 みそしる n2 miso soup #杯 @food
スープ n2 soup #杯 =w.soup @food
サラダ n2 salad @food
ケーキ n1 cake #個,つ =w.cake @food
クッキー n2 cookie #枚 =w.cookie @food
チーズ n2 cheese #枚 =w.cheese @food
はちみつ n3 honey =w.honey @food
チョコレート n2 chocolate #枚 =w.chocolate @food
アイス n2 ice cream #本,個 =w.icecream @food
飴 あめ n2 candy #個,つ =w.candy @food
ガム n3 chewing gum #枚 =w.gum @food
お菓子 おかし n1 sweets, snacks #個,つ @food
餃子 ぎょうざ n2 gyoza (dumplings) #個,つ =w.jiaozi @food
肉まん にくまん n3 steamed bun #個,つ =w.baozi @food
ワンタン n4 wontons =w.wonton @food
春巻き はるまき n4 spring roll #本 =w.springroll @food
たこ焼き たこやき n3 takoyaki #個,つ @food
焼きそば やきそば n3 fried noodles @food
かき氷 かきごおり n3 shaved ice #杯 @food
綿あめ わたあめ n4 cotton candy #本 @food
砂糖 さとう n2 sugar @food
塩 しお n2 salt @food
醤油 しょうゆ n2 soy sauce @food
味 あじ n2 taste, flavor @food
お茶 おちゃ n1 (green) tea #杯 =w.tea @drink
茶 ちゃ n3 tea #杯 @drink
紅茶 こうちゃ n1 black tea #杯 @drink
コーヒー n1 coffee #杯 @drink
牛乳 ぎゅうにゅう n1 milk #杯,本 @drink
ミルク n2 milk #杯 @drink
水 みず n1 water #杯,本 =w.water @drink
お水 おみず n1 water #杯 @drink
ジュース n1 juice #杯,本 =w.juice @drink
ソーダ n3 soda #本,杯 =w.soda @drink
ウーロン茶 うーろんちゃ n3 oolong tea #杯 @drink
// ---- nature and weather
天気 てんき n1 weather @weather
雨 あめ n1 rain @weather
雪 ゆき n1 snow =w.snow @weather
風 かぜ n1 wind @weather
雲 くも n2 cloud @weather
晴れ はれ n2 sunny weather @weather
曇り くもり n2 cloudy weather @weather
台風 たいふう n3 typhoon @weather
虹 にじ n3 rainbow @weather
氷 こおり n2 ice =w.ice @weather
空 そら n1 sky @nature
太陽 たいよう n2 the sun @nature
星 ほし n1 star =w.star @nature
山 やま n1 mountain =w.mountain @nature %place
川 かわ n1 river #本 @nature %path
海 うみ n1 sea @nature %place
湖 みずうみ n2 lake @nature %place
池 いけ n1 pond @nature
島 しま n2 island =w.island @nature %place
森 もり n1 forest =c.forest @nature %place
林 はやし n2 woods @nature
木 き n1 tree #本 =w.tree @nature
花 はな n1 flower #本 =w.flower @nature
草 くさ n2 grass @nature
葉 は n3 leaf #枚 @nature
葉っぱ はっぱ n3 leaf #枚 @nature
石 いし n1 stone =w.stone,n.stone @nature
岩 いわ n3 rock =o.heavy @nature
小石 こいし n3 pebble =o.light @nature
砂 すな n3 sand @nature
土 つち n3 earth, soil @nature
火 ひ n2 fire @nature
光 ひかり n3 light @nature
野原 のはら n3 field, meadow =c.field @nature %place
丘 おか n3 hill =c.hill @nature %place
畑 はたけ n3 field (of crops) @nature %place
道 みち n1 road, way @town %path
橋 はし n1 bridge =w.bridge @town %path
自然 しぜん n3 nature @nature
世界 せかい n2 the world @place
地球 ちきゅう n3 the Earth @nature
バラ n3 rose #本 =w.rose @nature
ひまわり n3 sunflower #本 =w.sunflower @nature
チューリップ n4 tulip #本 =w.tulip @nature
ラベンダー n4 lavender =w.lavender @nature
桜 さくら n2 cherry blossom #本 @nature
// ---- places
町 まち n1 town @town %place
村 むら n1 village =c.village @town %place
都会 とかい n3 big city @town
田舎 いなか n2 the countryside @place %place
国 くに n1 country @place %place
所 ところ n1 place @place
場所 ばしょ n2 place, spot @place %place
店 みせ n1 shop, store #軒 @shop,town %place
お店 おみせ n1 shop #軒 @shop %place
スーパー n1 supermarket #軒 @shop %place
コンビニ n2 convenience store #軒 @shop %place
デパート n1 department store #軒 @shop %place
本屋 ほんや n1 bookstore #軒 @shop %place
花屋 はなや n2 flower shop #軒 @shop %place
八百屋 やおや n2 greengrocer #軒 @shop %place
喫茶店 きっさてん n1 café #軒 @drink,town %place
カフェ n2 café #軒 @drink %place
レストラン n1 restaurant #軒 @food %place
食堂 しょくどう n1 dining hall, diner #軒 @food %place
銀行 ぎんこう n1 bank #軒 @money %place
郵便局 ゆうびんきょく n1 post office #軒 @town %place
図書館 としょかん n1 library @school,town %place
公園 こうえん n1 park @town %place
駅 えき n1 station @transport %place
空港 くうこう n2 airport @transport,travel %place
港 みなと n2 port, harbor @travel %place
学校 がっこう n1 school @school %place
大学 だいがく n1 university @school %place
高校 こうこう n2 high school @school %place
中学校 ちゅうがっこう n2 middle school @school %place
小学校 しょうがっこう n2 primary school @school %place
教室 きょうしつ n1 classroom @school %place
会社 かいしゃ n1 company, office @work %place
事務所 じむしょ n3 office @work %place
工場 こうじょう n3 factory @work %place
ホテル n1 hotel #軒 @travel %place
旅館 りょかん n3 Japanese inn #軒 @travel %place
映画館 えいがかん n2 cinema @hobby %place
美術館 びじゅつかん n2 art museum @art %place
博物館 はくぶつかん n3 museum @town %place
動物園 どうぶつえん n2 zoo @animal %place
神社 じんじゃ n2 shrine @town %place
お寺 おてら n2 temple @town %place
寺 てら n3 temple @town %place
教会 きょうかい n3 church @town %place
広場 ひろば n2 square, plaza @town %place
交差点 こうさてん n2 crossroads @town
信号 しんごう n2 traffic light @town
角 かど n2 corner @town
通り とおり n2 street, avenue @town %path
建物 たてもの n2 building @town
ビル n2 (office) building @town
塔 とう n3 tower =w.tower @town %place
墓 はか n3 grave =w.grave @place
墓地 ぼち n4 cemetery =w.cemetery @place %place
迷路 めいろ n4 maze =w.maze @place %place
洞窟 どうくつ n4 cave @nature %place
採石場 さいせきじょう n4 quarry @place %place
劇場 げきじょう n3 theater @art %place
売店 ばいてん n4 stand, kiosk #軒 @shop %place
雑貨屋 ざっかや n4 general store #軒 @shop %place
キオスク n4 kiosk @shop %place
屋台 やたい n4 food stall #軒 @food %place
道路 どうろ n3 road @town %path
坂 さか n3 slope @town %path
階段 かいだん n2 stairs @home %path
廊下 ろうか n3 hallway @home %path
入り口 いりぐち n2 entrance @town
出口 でぐち n2 exit @town
外 そと n1 outside @place %loc
中 なか n1 inside, in @place %loc
上 うえ n1 on, above, up =p.top @place %loc
下 した n1 under, below =p.bottom @place %loc
左 ひだり n1 left =p.left @place %loc
右 みぎ n1 right =p.right @place %loc
真ん中 まんなか n2 the middle =p.middle @place %loc
横 よこ n2 the side, beside @place %loc
近く ちかく n2 nearby @place %loc
向こう むこう n3 the other side, over there @place %loc
東 ひがし n1 east @place
西 にし n1 west @place
南 みなみ n1 south @place
北 きた n1 north =c.north @place
日本 にほん name1 Japan @place %place
アメリカ name1 America @place %place
中国 ちゅうごく name1 China @place %place
韓国 かんこく name2 South Korea @place %place
イギリス name2 the UK @place %place
フランス name2 France @place %place
ドイツ name2 Germany @place %place
スペイン name2 Spain @place %place
ブラジル name2 Brazil @place %place
メキシコ name3 Mexico @place %place
カナダ name3 Canada @place %place
イタリア name2 Italy @place %place
東京 とうきょう name1 Tokyo @place %place
大阪 おおさか name2 Osaka @place %place
京都 きょうと name2 Kyoto @place %place
博多 はかた name3 Hakata @place %place
沖縄 おきなわ name3 Okinawa @place %place
富士山 ふじさん name2 Mount Fuji @place %place
外国 がいこく n2 foreign country @place %place
// ---- languages
日本語 にほんご n1 Japanese (language) @language
英語 えいご n1 English @language
中国語 ちゅうごくご n1 Chinese @language
スペイン語 すぺいんご n2 Spanish @language
フランス語 ふらんすご n2 French @language
ドイツ語 どいつご n2 German @language
ポルトガル語 ぽるとがるご n3 Portuguese @language
韓国語 かんこくご n2 Korean @language
言葉 ことば n1 word; language @language
漢字 かんじ n1 kanji (Chinese characters) @language
ひらがな n1 hiragana @language
カタカナ n1 katakana @language
文 ぶん n2 sentence @language
意味 いみ n1 meaning @language
日本人 にほんじん n1 Japanese (person) #人 @people
外国人 がいこくじん n1 foreigner #人 @people
アメリカ人 あめりかじん n1 American (person) #人 @people
// ---- getting around
電車 でんしゃ n1 train =w.train @transport
汽車 きしゃ n4 steam train @transport
車 くるま n1 car #台 @transport
自転車 じてんしゃ n1 bicycle #台 @transport
バス n1 bus #台 @transport
タクシー n1 taxi #台 @transport
地下鉄 ちかてつ n1 subway @transport
飛行機 ひこうき n1 airplane @transport
船 ふね n2 ship, boat @transport
フェリー n3 ferry @transport
新幹線 しんかんせん n2 bullet train @transport
切符 きっぷ n1 ticket #枚 @travel
チケット n2 ticket #枚 @travel
旅行 りょこう n1 trip, travel @travel
旅 たび n3 journey @travel
荷物 にもつ n1 luggage #個,つ @travel
お土産 おみやげ n2 souvenir #個,つ @travel
パスポート n2 passport @travel
`);
  W.push(`
// ---- school and work
授業 じゅぎょう n1 class, lesson @school
宿題 しゅくだい n1 homework @school
試験 しけん n2 exam @school
テスト n1 test @school
問題 もんだい n1 question, problem @school
答え こたえ n2 answer @school
クラス n1 class (group) @school
教科書 きょうかしょ n2 textbook #冊 @school
辞書 じしょ n1 dictionary #冊 @school
数学 すうがく n2 math @school
歴史 れきし n2 history @school
科学 かがく n3 science @school
音楽 おんがく n1 music @music
美術 びじゅつ n2 art @art
体育 たいいく n2 PE, sports class @sport
寺子屋 てらこや n4 terakoya (an old village school) @school %place
仕事 しごと n1 work, job @work
会議 かいぎ n2 meeting @work
休憩 きゅうけい n3 a break @work
給料 きゅうりょう n3 pay, salary @money
お金 おかね n1 money @money
値段 ねだん n2 price @money,shop
コイン n2 coin #枚 =w.coin @money
財布 さいふ n2 wallet @money
買い物 かいもの n1 shopping @shop
セール n3 sale @shop
// ---- phones, stories, music, games, sport
メール n1 email #通 @tech
インターネット n2 the internet @tech
ネット n2 the internet @tech
ゲーム n1 game @hobby,tech
アプリ n3 app @tech
パスワード n3 password @tech
合言葉 あいことば n4 password (spoken) =w.password
映画 えいが n1 movie, film #本 @hobby,art
ドラマ n2 TV drama @hobby
アニメ n1 anime @hobby,art
漫画 まんが n1 manga, comics #冊 @hobby,art
小説 しょうせつ n2 novel #冊 @story
物語 ものがたり n3 story, tale @story
話 はなし n1 story; talk @story
歌 うた n1 song #曲 @music
曲#n きょく n3 piece of music @music
ピアノ n1 piano #台 @music
ギター n1 guitar #本,台 @music
太鼓 たいこ n3 drum @music
楽器 がっき n2 musical instrument @music
趣味 しゅみ n1 hobby @hobby
スポーツ n1 sports @sport
サッカー n1 soccer @sport
野球 やきゅう n1 baseball @sport
テニス n1 tennis @sport
バスケ n2 basketball @sport
水泳 すいえい n2 swimming @sport
試合 しあい n2 match, game @sport
勝負 しょうぶ n3 match, contest @sport
絵 え n1 picture, painting #枚 @art
詩 し n4 poem =w.poem @art,story
将棋 しょうぎ n3 shogi @hobby
駒 こま n4 (shogi) piece @hobby
歩 ふ n4 pawn (shogi) =k.sgFu @hobby
王手 おうて n4 check (shogi) @hobby
パーティー n1 party @hobby
祭り まつり n2 festival @hobby
夏祭り なつまつり n3 summer festival @hobby
花火 はなび n2 fireworks @hobby
盆踊り ぼんおどり n4 Bon dance @music
金魚すくい きんぎょすくい n4 goldfish scooping @hobby
くじ n4 lottery ticket @hobby
凧 たこ n3 kite =w.kite @hobby
じゃんけん n2 rock-paper-scissors @hobby
かくれんぼ n3 hide-and-seek @hobby
鬼ごっこ おにごっこ n3 tag (the game) @hobby
鬼 おに n3 ogre; "it" (in tag) @fantasy
缶バッジ かんばっじ n4 button badge =k.anBadge @hobby
でんでん太鼓 でんでんだいこ n4 den-den drum =k.mtDenden @music
ばち n4 drumsticks =k.mtBachi @music
ファンクラブ n4 fan club @hobby
メダル n3 medal @sport
カラオケ n2 karaoke @music
ステップ n3 step @music
練習 れんしゅう n1 practice
`);
  W.push(`
// ---- the Hush, the bells, the story
静寂 せいじゃく n4 silence; the Hush =c.silence @hush
魔法 まほう n3 magic @fantasy
宝 たから n3 treasure @fantasy
秘密 ひみつ n3 secret @story
冒険 ぼうけん n3 adventure @story
力 ちから n2 strength, power @story
影 かげ n3 shadow @nature
闇 やみ n4 darkness @hush
敵 てき n3 enemy @story
戦い たたかい n3 fight, battle @story
勇者 ゆうしゃ n4 hero @story
鏡 かがみ n3 mirror @home
風車 ふうしゃ n3 windmill @place
女王蜂 じょおうばち n4 queen bee #匹 @animal
霜 しも n4 frost @weather
峰 みね n4 peak @nature
時計塔 とけいとう n4 clock tower @place %place
鉱夫 こうふ n4 miner #人 @work
キャンプ n2 camp @place %place
花園 はなぞの n4 flower garden @nature %place
フラワーショー n4 flower show @hush
日記 にっき n2 diary #冊 @story
黄金 おうごん n4 gold @fantasy
粒 つぶ n4 grain, kernel @food
盤 ばん n4 (game) board @hobby
持ち駒 もちごま n4 pieces in hand (shogi) @hobby
棋譜 きふ n4 game record (shogi) @hobby
詰将棋 つめしょうぎ n4 mate puzzle (shogi) @hobby
縁台 えんだい n4 bench (outdoor) @home
一局 いっきょく n4 a game (of shogi) @hobby
扇子 せんす n4 folding fan @hobby
やぐら n4 festival drum tower @hobby
線香花火 せんこうはなび n4 sparkler #本 @hobby
中華料理 ちゅうかりょうり n3 Chinese food @food
ライブ n3 live show, concert @music
// ---- names (CJK.md)
ミモ name1 Mimo @hush
ロサ name1 Rosa @hush
ブルーノ name1 Bruno @hush
ノア name1 Noa @hush
マルタ name1 Marta @hush
ニコ name1 Nico @hush
ビセンテ name2 Vicente @hush
ウーゴ name2 Hugo @hush
シロ name2 Ciro @hush
マルガ name2 Marga @hush
マリーナ name2 Marina @hush
バルトロ name2 Bartolo @hush
ラロ name2 Lalo @hush
モルガナ name2 Morgana @hush
ダンテ name2 Dante @hush
ポー name2 Poe @hush
オーロラ name2 Aurora @hush
カンデ name2 Cande @hush
ピオ name3 Pío @hush
エレナ name3 Elena @hush
ギル name3 Gil @hush
フローラ name3 Flora @hush
メリッサ name3 Melisa @hush
リア name3 Lía @hush
トビアス name3 Tobías @hush
アルバ name1 Alba @hush
モリナール name2 Molinar @hush
レマンソ name2 Remanso @hush
エスカルチャ name4 Escarcha @hush
鏡湖 かがみこ name3 the Mirror Lake @hush
大風車 だいふうしゃ name4 the Great Mill @hush
メイ name2 Mei @people
オトハ name2 Otoha @people
ススム name2 Susumu @people
ナツ name2 Natsu @people
テツ name2 Tetsu @people
シゲ name2 Shige @people
// ---- talking about yourself
出身 しゅっしん n2 where you're from
専攻 せんこう n4 major (at university) @school
住所 じゅうしょ n2 address
年齢 ねんれい n3 age
性格 せいかく n3 personality @people
予定 よてい n2 plan, schedule (…予定です: a plan) %fut
計画 けいかく n3 plan
つもり n2 intention, plan (…つもり) %fut
経験 けいけん n3 experience
思い出 おもいで n2 memory
理由 りゆう n2 reason
意見 いけん n2 opinion
考え かんがえ n2 idea, thought
方法 ほうほう n3 method, way
習慣 しゅうかん n3 habit
人生 じんせい n3 life
文化 ぶんか n2 culture @art
社会 しゃかい n3 society
関係 かんけい n3 relationship
友情 ゆうじょう n4 friendship @people
恋 こい n3 love (romantic) @feeling
自信 じしん n3 confidence
興味 きょうみ n2 interest
機会 きかい n3 opportunity
経済 けいざい n4 economy
環境 かんきょう n3 environment @nature
健康 けんこう n2 health @health
平和 へいわ n3 peace
戦争 せんそう n3 war
未来 みらい n3 the future @time %tf
過去 かこ n3 the past @time
時代 じだい n3 era, times @time
頃 ころ n2 time, when (子供の頃)
ため n2 for, in order to
方 ほう n2 side, direction (…の方が)
方#kata かた n2 person (polite); way of (…方)
気 き n2 spirit, mind (気をつける)
様子 ようす n3 state, how something looks
場合 ばあい n3 case, situation
全部 ぜんぶ n1 all, everything
半分 はんぶん n2 half
以上 いじょう n3 more than; that's all
以下 いか n3 less than
以外 いがい n3 except, other than
次 つぎ n1 next
先 さき n2 ahead; first
違い ちがい n3 difference
番号 ばんごう n2 number
数 かず n3 number, amount
久しぶり ひさしぶり n2 long time no see
// ---- more adverbs
もちろん adv2 of course
実は じつは adv2 actually, to tell the truth
やっぱり adv2 as I thought, after all
やはり adv3 as expected
結局 けっきょく adv3 in the end
確かに たしかに adv3 certainly
絶対 ぜったい adv3 absolutely, definitely
全く まったく adv3 completely; (not) at all
少しずつ すこしずつ adv3 little by little
どんどん adv3 quickly, more and more
そろそろ adv3 soon, it's about time
しばらく adv3 for a while
決して けっして adv3 never (with a negative)
なるべく adv3 as much as possible
できるだけ adv3 as much as you can
一生懸命 いっしょうけんめい adv3 as hard as you can
偶然 ぐうぜん adv3 by chance
一人で ひとりで adv2 alone, by yourself
みんなで adv2 all together
ちゃんと adv3 properly
きちんと adv3 neatly, exactly
すっかり adv3 completely
ますます adv3 more and more
もう少し もうすこし adv2 a little more
`);
  W.push(`
// ---- more verbs (N3–N2)
確かめる たしかめる vi3 make sure %vt
似る にる vi3 look like
生きる いきる vi2 live, be alive
治る なおる vg3 get better @health
治す なおす vg3 cure @health
増える ふえる vi3 increase
減る へる vg3 decrease
届く とどく vg3 reach, arrive
起こる おこる vg3 happen
割れる われる vi3 break, crack
壊れる こわれる vi2 break (down)
壊す こわす vg2 break (something) %vt
汚れる よごれる vi3 get dirty
貯める ためる vi3 save (money) %vt @money
隠れる かくれる vi3 hide
隠す かくす vg3 hide (something) %vt
失う うしなう vg4 lose %vt
戻す もどす vg3 put back %vt
願う ねがう vg3 wish, hope
叫ぶ さけぶ vg3 shout
黙る だまる vg3 fall silent @hush
静まる しずまる vg4 grow quiet @hush
鳴る なる vg2 ring, sound @hush
鳴らす ならす vg3 ring (a bell) %vt @hush
響く ひびく vg4 echo, resound @hush
取り戻す とりもどす vg4 get back %vt @hush
目覚める めざめる vi4 wake up @hush
倒す たおす vg3 knock down, beat %vt
倒れる たおれる vi3 fall down
救う すくう vg4 save, rescue %vt
追う おう vg4 chase %vt
追いかける おいかける vi3 chase %vt
捕まえる つかまえる vi3 catch %vt
参る まいる vg4 (humble) go, come; give up
指す さす vg4 point; play (shogi) %vt
輝く かがやく vg4 shine
育つ そだつ vg3 grow up
枯れる かれる vi4 wither
凍る こおる vg3 freeze @weather
溶ける とける vi3 melt
曇る くもる vg3 cloud over @weather
温める あたためる vi3 warm up %vt
焼く やく vg3 grill, bake %vt,act @food
炒める いためる vi4 stir-fry %vt @food
混ぜる まぜる vi3 mix %vt @food
煮る にる vi4 simmer %vt @food
味わう あじわう vg4 taste, savor %vt
食事する しょくじする vs2 have a meal %act @food
寝坊する ねぼうする vs3 oversleep
受け取る うけとる vg3 receive %vt
預ける あずける vi4 leave (with someone) %vt
申し込む もうしこむ vg4 apply, sign up
待ち合わせる まちあわせる vi3 meet up
知らせる しらせる vi3 let (someone) know %vt
思い出す おもいだす vg2 remember, recall %vt
気づく きづく vg3 notice
疑う うたがう vg4 doubt %vt
迷う まよう vg3 get lost; be unsure
悩む なやむ vg3 worry, be troubled @feeling
驚く おどろく vg3 be surprised @feeling
感動する かんどうする vs3 be moved @feeling
緊張する きんちょうする vs3 be nervous @feeling
飾る かざる vg3 decorate %vt
祝う いわう vg3 celebrate %vt
誘う さそう vg3 invite %vt
付き合う つきあう vg3 go out (with); keep company
愛する あいする vs3 love %vt @feeling
つなぐ vg3 connect; hold (hands) %vt
開く#hiraku ひらく vg3 open; hold (a party)
閉じる とじる vi3 close %vt
過ごす すごす vg3 spend (time) %vt
暮らす くらす vg3 live (a life)
働かせる はたらかせる vi4 put to work %vt
務める つとめる vi4 serve as
勤める つとめる vi3 work for (a company) %ni @work
通う かよう vg2 go to (regularly), commute
乾く かわく vg3 dry, be thirsty
濡れる ぬれる vi3 get wet
掛ける かける vi2 hang; call (a phone); wear (glasses) %vt
履く はく vg2 put on (shoes, trousers) %vt @clothes
被る かぶる vg2 put on (a hat) %vt @clothes
片付く かたづく vg4 be tidied up
続く つづく vg2 continue
離れる はなれる vi3 move away, leave
近づく ちかづく vg3 get close
渡る わたる vg2 cross %vt
通る とおる vg2 pass, go through
止む やむ vg3 stop (rain)
吠える ほえる vi4 bark
鳴く なく vg3 cry, sing (animals)
飼う かう vg2 keep (a pet) %vt @animal
釣る つる vg3 fish, catch (a fish) %vt,act @hobby
数える かぞえる vi2 count %vt
計る はかる vg3 measure %vt
足す たす vg3 add %vt
引き分ける ひきわける vi4 draw (a game)
引き分け ひきわけ n3 a draw, a tie @hobby
勝ち かち n3 a win @hobby
負け まけ n3 a loss @hobby
`);
  W.push(`
// ---- more of the A2–B1 core
会話 かいわ n2 conversation @language
文法 ぶんぽう n2 grammar @language
発音 はつおん n2 pronunciation @language
単語 たんご n2 word, vocabulary @language
作文 さくぶん n2 composition @school
翻訳 ほんやく n3 translation @language
通訳 つうやく n3 interpreter @language
用事 ようじ n2 something to do, an errand
都合 つごう n3 how things suit you
具合 ぐあい n3 condition (health) @health
調子 ちょうし n3 condition, shape
気温 きおん n3 temperature @weather
天気予報 てんきよほう n2 weather forecast @weather
空気 くうき n2 air @nature
地震 じしん n2 earthquake @nature
火事 かじ n2 fire (a building on fire)
事故 じこ n2 accident
警察 けいさつ n2 the police
交通 こうつう n2 traffic @transport
景色 けしき n2 scenery, view @nature
音 おと n2 sound @music
形 かたち n2 shape
数字 すうじ n3 number, digit
アルバイト n2 part-time job @work
バイト n2 part-time job @work
社員 しゃいん n3 employee #人 @work
上司 じょうし n4 boss #人 @work
同僚 どうりょう n4 colleague #人 @work
お客様 おきゃくさま n3 customer (polite) #人 @shop
受付 うけつけ n3 reception desk @work
会場 かいじょう n3 venue @place %place
会議室 かいぎしつ n3 meeting room @work %place
売り場 うりば n3 (shop) counter, floor @shop %place
先輩 せんぱい n2 senior (at school, work) #人 @school,people
後輩 こうはい n3 junior #人 @school,people
同級生 どうきゅうせい n3 classmate #人 @school,people
部活 ぶかつ n3 school club @school
学年 がくねん n3 school year @school
成績 せいせき n3 grades @school
点 てん n2 point, score @school
レポート n2 report, paper @school
発表 はっぴょう n3 presentation @school
本棚 ほんだな n2 bookshelf @home
引き出し ひきだし n3 drawer @home
壁 かべ n2 wall @home
床 ゆか n3 floor @home
屋根 やね n3 roof @home
門 もん n2 gate @home
押し入れ おしいれ n3 closet @home
棚 たな n3 shelf @home
カーテン n2 curtain #枚 @home
布団 ふとん n2 futon #枚 @home
枕 まくら n3 pillow @home
タオル n2 towel #枚 @home
石けん せっけん n2 soap #個 @home
歯ブラシ はぶらし n2 toothbrush #本 @home
シャワー n1 shower @home
ごみ n2 trash @home
ごみ箱 ごみばこ n3 trash can @home
電池 でんち n3 battery #本,個 @tech
機械 きかい n3 machine #台 @tech
電子レンジ でんしれんじ n3 microwave #台 @home
洗濯機 せんたくき n2 washing machine #台 @home
掃除機 そうじき n3 vacuum cleaner #台 @home
ストーブ n2 heater #台 @home
扇風機 せんぷうき n3 electric fan #台 @home
自動車 じどうしゃ n2 car #台 @transport
バイク n2 motorbike #台 @transport
トラック n3 truck #台 @transport
エレベーター n2 elevator #台 @home
道具 どうぐ n3 tool @home
材料 ざいりょう n3 ingredients, material @food
レシピ n3 recipe @food
鍋 なべ n3 pot; hotpot @food
フライパン n3 frying pan #枚 @food
包丁 ほうちょう n3 kitchen knife #本 @food
ジャム n3 jam @food
バター n2 butter @food
油 あぶら n3 oil @food
ソース n2 sauce @food
みそ n3 miso @food
豆腐 とうふ n2 tofu @food
納豆 なっとう n3 natto @food
えび n3 shrimp #匹 @food
いか n3 squid @food
たこ#octo たこ n3 octopus #匹 @food
ハンバーガー n2 hamburger #個,つ @food
ピザ n2 pizza #枚 @food
パスタ n1 pasta @food
オムライス n2 omelet rice @food
ハンバーグ n2 hamburger steak #個 @food
アイスクリーム n2 ice cream @food
ソフトクリーム n3 soft-serve ice cream @food
コーラ n2 cola #本,杯 @drink
ポテト n2 potato, fries @food
フライドポテト n2 french fries @food
ポテトチップス n3 potato chips @food
ヨーグルト n2 yogurt @food
ドーナツ n2 doughnut #個,つ @food
パンケーキ n2 pancake #枚 @food
コロッケ n3 croquette #個 @food
キャベツ n2 cabbage #個 @food
レタス n2 lettuce #個 @food
ピーマン n3 green pepper #個 @food
チョコ n2 chocolate (short) @food
アパート n2 apartment (small) #軒 @home
マンション n2 apartment (condo) #軒 @home
ソファ n3 sofa #台 @home
プール n2 swimming pool @hobby
ジム n2 gym @hobby
バスケットボール n2 basketball @hobby
コンサート n2 concert @music
ビデオ n3 video @tech
ファイル n3 file @tech
コピー n3 copy @tech
プリント n3 printout, handout #枚
ホームページ n3 website @tech
リモコン n3 remote control #台 @tech
スマートフォン n3 smartphone #台 @tech
ノートパソコン n3 laptop #台 @tech
サンドイッチ n2 sandwich #個,つ @food
スパゲッティ n2 spaghetti @food
ステーキ n3 steak #枚 @food
デザート n2 dessert @food
朝食 ちょうしょく n3 breakfast @food
昼食 ちゅうしょく n3 lunch @food
夕食 ゆうしょく n3 dinner @food
メニュー n2 menu @food
会計 かいけい n3 the bill, the check @money
お釣り おつり n3 change (money) @money
現金 げんきん n3 cash @money
カード n2 card #枚 @money
料金 りょうきん n3 fee, fare @money
無料 むりょう n3 free (of charge) @money
貯金 ちょきん n3 savings @money
背 せ n2 height (of a person) @body
髪の毛 かみのけ n3 hair @body
ひげ n3 beard @body
身長 しんちょう n3 height @body
体重 たいじゅう n3 weight @body
平日 へいじつ n3 weekday @time
休日 きゅうじつ n3 day off @time
祝日 しゅくじつ n3 public holiday @time
お正月 おしょうがつ n2 New Year @time
夜中 よなか n3 the middle of the night @time
宇宙 うちゅう n3 space, the universe @nature
植物 しょくぶつ n3 plant @nature
種 たね n3 seed @nature
枝 えだ n3 branch #本 @nature
竹 たけ n3 bamboo #本 @nature
松 まつ n3 pine #本 @nature
雷 かみなり n3 thunder @weather
嵐 あらし n3 storm @weather
霧 きり n3 fog @weather
波 なみ n3 wave @nature
海岸 かいがん n3 coast @nature %place
ビーチ n3 beach @nature %place
谷 たに n3 valley @nature %place
滝 たき n3 waterfall @nature %place
楽しみ たのしみ n2 something to look forward to @feeling
目標 もくひょう n3 goal
目的 もくてき n3 purpose
努力 どりょく n3 effort
能力 のうりょく n4 ability
才能 さいのう n4 talent
態度 たいど n4 attitude
印象 いんしょう n4 impression
原因 げんいん n3 cause
結果 けっか n3 result
規則 きそく n3 rule
ルール n3 rule
不安 ふあん an3 anxious, uneasy @feeling
普通 ふつう an2 normal, ordinary
立派 りっぱ an3 splendid
熱心 ねっしん an3 eager
新鮮 しんせん an3 fresh @food
急 きゅう an3 sudden, steep
重要 じゅうよう an3 important %cmp
美しい うつくしい ai3 beautiful +
厳しい きびしい ai3 strict
大人しい おとなしい ai3 quiet, well-behaved
おかしい ai2 funny; strange
細かい こまかい ai3 fine, detailed
苦しい くるしい ai3 painful, hard
激しい はげしい ai4 intense
怪しい あやしい ai4 suspicious
ぬるい ai4 lukewarm
注意する ちゅういする vs2 be careful; warn
見学する けんがくする vs3 visit (to learn)
参加する さんかする vs2 take part
応援する おうえんする vs3 cheer for %vt
協力する きょうりょくする vs3 cooperate
優勝する ゆうしょうする vs3 win (a tournament)
合格する ごうかくする vs3 pass (an exam) @school
発表する はっぴょうする vs3 present, announce %vt
確認する かくにんする vs3 check, confirm %vt
用意する よういする vs2 get ready %vt
利用する りようする vs3 use %vt
入院する にゅういんする vs3 go into hospital @health
我慢する がまんする vs3 put up with %vt
反対する はんたいする vs3 be against
賛成する さんせいする vs3 agree
想像する そうぞうする vs3 imagine %vt
成長する せいちょうする vs3 grow (up)
発見する はっけんする vs4 discover %vt
まず adv2 first (of all) %conn
次に つぎに adv2 next %conn
最後に さいごに adv2 finally %conn
今まで いままで adv2 until now
いつか pron3 someday
主に おもに adv3 mainly
直接 ちょくせつ adv3 directly
割と わりと adv4 relatively
ほぼ adv4 almost
さらに adv4 what's more %conn
すでに adv4 already
いってらっしゃい phrase2 see you (to someone leaving)
おかえりなさい phrase2 welcome home
お疲れ様 おつかれさま phrase2 good work, thanks for your hard work
お大事に おだいじに phrase3 get well soon
気をつけて きをつけて phrase2 take care, be careful
よろしくお願いします よろしくおねがいします phrase1 nice to meet you; please (help me)
失礼します しつれいします phrase2 excuse me (coming in, leaving)
申し訳ありません もうしわけありません phrase3 I'm very sorry
どういたしまして phrase1 you're welcome
お元気で おげんきで phrase3 take care (goodbye)
お#pre お part2 (polite prefix: お元気, お名前)
ご#pre ご part3 (polite prefix: ご家族, ご両親)
ございます phrase1 (polite) there is; is (ありがとうございます)
それぞれ adv3 each, respectively
好み このみ n3 taste, what you like
まあまあ adv2 so-so
`);
  W.push(`
// ---- wave 2 (js/talk/content_ja.js, js/read/content_ja.js): words the Japanese conversations and books need
ん part2 (explaining: …んです, …んだ)
敬語 けいご n3 polite language (keigo) @language
ため口 ためぐち n3 casual speech (talking as equals) @language
文通 ぶんつう n3 writing letters to each other (pen pals) @language,people
宝物 たからもの n2 treasure
三味線 しゃみせん n3 shamisen (a three-stringed lute) @music
音頭 おんど n3 ondo (a festival dance song) @music
夫婦 ふうふ n3 married couple @family
亡くなる なくなる vg3 pass away (said gently)
相手 あいて n3 the other person; partner @people
年上 としうえ n3 older (than someone) @people
仲良く なかよく adv2 on good terms, as friends @people
仲良し なかよし n2 good friends @people
勇気 ゆうき n3 courage @feeling +
諦める あきらめる vi3 give up %vt
謝る あやまる vg3 apologize
連れる つれる vi2 take along, bring (a person) %vt
一人っ子 ひとりっこ n2 only child @family
両方 りょうほう n2 both
町長 ちょうちょう n3 mayor (of a town) @people,town
正解 せいかい n3 the right answer
覚悟 かくご n4 resolve, being ready for something
悩み なやみ n3 worry, trouble @feeling
世話 せわ n3 care, looking after (世話をする)
恥ずかしがり屋 はずかしがりや n3 a shy person @people
了解 りょうかい n3 got it, OK
名乗る なのる vg3 say your name, introduce yourself
真似る まねる vi3 imitate, copy %vt
若者 わかもの n3 young people @people
年寄り としより n3 old people @people
悲しみ かなしみ n3 sadness @feeling -
溶かす とかす vg3 melt (something) %vt
覚ます さます vg3 wake (someone) up %vt
ほこり n3 dust
のぞく vg3 peek, look in %vt
冷やす ひやす vg3 chill, cool %vt
スタンプ n2 stamp; sticker (in a chat)
はんこ n3 seal, rubber stamp
字 じ n2 handwriting; a written character @language
合う あう vg2 fit, match; (…合う) each other
知り合う しりあう vg3 get to know (each other) @people
故郷 ふるさと n3 hometown @place
メッセージ n2 message (a text) @tech
しまう vg2 put away; (…てしまう) end up doing, do by mistake %vt
係 かかり n3 the person in charge (of something) @school,work
びっくりする vs2 be surprised @feeling
夕日 ゆうひ n2 the setting sun, sunset @nature
恋しい こいしい ai3 missed, longed for (家族が恋しい) @feeling
字幕 じまく n3 subtitles
子 こ n1 child; (…の子) girl, boy @people
間 あいだ n2 between; while (…の間)
一緒 いっしょ n2 together (一緒に)
まま n3 as it is (…たまま: still …ing)
まわり n2 around, the area around
回る まわる vg2 go around, turn
まとめる vi3 put together, sum up %vt
オムレツ n2 omelet @food
焦げる こげる vi3 burn (food), get scorched
焼き魚 やきざかな n2 grilled fish @food
奥 おく n3 the back, the far end, deep inside
温かい あたたかい ai2 warm (food, drinks, a heart) +
外す はずす vg3 take off, undo, set free; miss %vt
閉まる しまる vg2 close, be shut
のせる vi3 put on top %vt
リーダー n2 leader, boss @people,work
一日中 いちにちじゅう adv3 all day long @time
じっと adv3 still, without moving; fixedly
かも part3 maybe (…かもしれない) =w.lp_maybe
ニュース n1 news
明かり あかり n3 a light, a lamp
ようこそ int2 welcome!
間違い まちがい n2 a mistake
ぐつぐつ adv3 bubbling, boiling hard
あら int2 oh! (soft surprise)
アナ name2 Ana @people
ベア name2 Bea @people
ミラ name2 Mila @people
ベラ name2 Vera @people
リタ name2 Rita @people
エミール name2 Emil @people
ハルカ name3 Haruka @people
タクミ name3 Takumi @people
ミサキ name3 Misaki @people
タケシ name3 Takeshi @people
リク name3 Riku @people
ハナ name3 Hana @people
サエコ name3 Saeko @people
ルカ name3 Luca @people
文田 ふみた name3 Fumita (Alba's librarian) @people
// ---- food and drink
メロン n2 melon @food
レモン n2 lemon @food
さくらんぼ n2 cherry @food
柿 かき n2 persimmon @food
マンゴー n3 mango @food
パイナップル n3 pineapple @food
きゅうり n2 cucumber @food
餅 もち n2 mochi (rice cake) @food
メロンパン n2 melon bread (a sweet bun) @food
あんパン n2 sweet bean bun @food
カレーパン n2 curry bun @food
あんこ n3 sweet bean paste @food
梅干し うめぼし n3 pickled plum (umeboshi) @food
鮭 さけ n2 salmon @food
海苔 のり n2 nori (dried seaweed) @food
昆布 こんぶ n3 kombu (kelp) @food
出汁 だし n3 dashi (soup stock) @food
わかめ n3 wakame (seaweed) @food
ねぎ n2 green onion @food
麦茶 むぎちゃ n2 barley tea @drink
シロップ n3 syrup @food
香り かおり n3 smell, fragrance
炊く たく vg3 cook (rice) %vt,act @food
握る にぎる vg3 grip; shape (rice into onigiri) %vt
沸く わく vg3 boil (water)
沸騰 ふっとう n4 boiling
三角 さんかく n3 triangle
// ---- home, places, the town
市場 いちば n2 market @town,shop
果物屋 くだものや n2 fruit shop @shop,town
時計屋 とけいや n3 clock shop; clockmaker @shop,town
宿 やど n3 inn, a place to stay @travel
灯台 とうだい n3 lighthouse @place
鉱山 こうざん n3 mine @place
トンネル n3 tunnel @place
桟橋 さんばし n4 pier @place
いかだ n4 raft @transport
縁側 えんがわ n4 veranda (along a Japanese house) @home
畳 たたみ n3 tatami mat @home
障子 しょうじ n4 shoji (a paper sliding door) @home
こたつ n2 kotatsu (a heated low table) @home
風鈴 ふうりん n3 wind chime @home
提灯 ちょうちん n3 paper lantern
回覧板 かいらんばん n4 the neighborhood notice board (passed house to house) @town
当番 とうばん n3 (someone's) turn, duty, shift @work
大会 たいかい n3 tournament, big event
田んぼ たんぼ n2 rice field @nature
// ---- nature, seasons, the year
梅雨 つゆ n3 the rainy season (June) @weather,time
紅葉 こうよう n3 autumn leaves @nature
花見 はなみ n2 cherry-blossom viewing @nature,hobby
雪だるま ゆきだるま n2 snowman @weather
流れ星 ながれぼし n3 shooting star @nature
蝉 せみ n3 cicada @animal
蛍 ほたる n3 firefly @animal
鶴 つる n3 crane (the bird) @animal
お盆 おぼん n3 Obon (the summer days for the ancestors) @time
体操 たいそう n2 exercises (calisthenics) @sport
虫取り むしとり n3 bug catching @hobby
網 あみ n3 net
// ---- stories and school
昔話 むかしばなし n2 folk tale @story
恩返し おんがえし n3 repaying a kindness @story
布 ぬの n3 cloth
織る おる vg3 weave %vt
罠 わな n4 trap
おばけ n2 ghost @fantasy
絵本 えほん n2 picture book @story
読書 どくしょ n3 reading (books) @hobby
推理小説 すいりしょうせつ n4 mystery novel @story
音読 おんどく n4 reading aloud @school
国語 こくご n3 Japanese (the school subject) @school
`);
  W.push(`
// ---- very polite requests (〜ていただけませんか, 〜てくださいませんか), when typed with spaces in rōmaji
いただける vi3 be able to receive (humble: 〜ていただけませんか = would you …) %vt
くださいます phrase3 (polite) gives, does for me (〜てくださいますか)
くださいません phrase3 (polite) doesn't give (〜てくださいませんか: would you please …)
くださいませ phrase3 (very polite) please (…てくださいませ)
番線 ばんせん n3 platform number (六番線: platform 6) @travel,place
線 せん n3 line (a train line, a drawn line) @travel
`);
  W.push(`
// ---- DX-CJK (the B2 round, 2026-11-27): grammar words, and the words the letters, debates, jobs and club books asked for
たち n2 (after people) the plural: 子どもたち, 生徒たち @people
達 たち n3 (the plural, in kanji: 私達) @people
子ども こども n1 child (also 子供) @family,people
べき part3 should (…べきだ, …べきです)
ござる vg3 (very polite) be, there is: ございます
いらっしゃる vg3 (honorific) come, go, be: いらっしゃいます
おっしゃる vg3 (honorific) say: おっしゃいます
なさる vg4 (honorific) do: なさいます
替える かえる vi3 change, replace (one thing for another) %vt
換える かえる vi4 exchange %vt
スケート n3 skating @sport
転ぶ ころぶ vg3 fall over
倍 ばい cl3 times, -fold (二倍: twice as much)
二等賞 にとうしょう n4 second prize
まるで adv3 just like, as if (まるで…のように)
料理長 りょうりちょう n4 head chef @work,food
距離 きょり n4 distance
寮 りょう n3 dormitory @school,home
技 わざ n4 technique, skill
真っ白 まっしろ an3 pure white @color
タブレット n3 tablet (computer) @tech
オンライン n3 online @tech
つながる vg3 connect, be connected
画面 がめん n3 screen @tech
怖がる こわがる vg3 be afraid (of) @feeling
痛める いためる vi4 hurt (a part of the body: 腰を痛める) %vt @health
手放す てばなす vg4 let go of, part with %vt
旦那 だんな n4 husband (旦那さん: someone's husband) @family
恐れる おそれる vi4 fear @feeling
一生 いっしょう n3 a lifetime; all your life
満足する まんぞくする vs3 be satisfied; satisfaction + @feeling
ボール n2 ball @sport
禁止する きんしする vs3 ban, forbid; a ban %vt
当たる あたる vg3 hit, strike; win (a prize)
幸い さいわい adv4 fortunately
グラウンド n3 sports ground @sport,school
放課後 ほうかご n3 after school @school,time
張る はる vg3 stretch, put up (a net, a tent) %vt
動かす うごかす vg3 move (something): 体を動かす, exercise %vt
旅行者 りょこうしゃ n4 traveler @travel,people
中級 ちゅうきゅう n4 intermediate (level) @school
観光 かんこう n3 sightseeing @travel
観光案内所 かんこうあんないじょ n4 tourist information office @travel,place
募集する ぼしゅうする vs4 recruit, look for (people); recruitment %vt @work
討論する とうろんする vs4 debate, discuss; a debate
毎回 まいかい n3 every time @time
ナッツ n3 nuts @food
チーム n2 team @sport
天の川 あまのがわ n4 the Milky Way @nature
インタビュー n4 interview @work
記者 きしゃ n4 reporter, journalist #人 @work,people
原稿 げんこう n4 manuscript, draft @work
放送する ほうそうする vs4 broadcast; a broadcast @tech
生放送 なまほうそう n4 live broadcast @tech
担当する たんとうする vs4 be in charge (of) @work
採用する さいようする vs4 hire, take on; adopt %vt @work
対応する たいおうする vs4 deal with, handle; correspond
行列 ぎょうれつ n4 queue, line (of people)
役 やく n3 role, part; use
役に立つ やくにたつ vg3 be useful, help
任せる まかせる vi4 leave (it) to (someone), entrust %vt
乗せる のせる vi3 give (someone) a ride, take on board %vt
移る うつる vg3 move (to another place)
別 べつ n3 another, separate (別の)
中止する ちゅうしする vs4 cancel, call off; cancellation %vt
郵便 ゆうびん n3 mail, post
配達する はいたつする vs4 deliver; delivery %vt
申し訳 もうしわけ n4 excuse (申し訳ありません: I'm very sorry)
少々 しょうしょう adv3 a little, a moment (少々お待ちください)
号室 ごうしつ cl4 room number (四号室)
付く#tsuku つく vg3 come with, be attached (朝食付き)
アレルギー n3 allergy @health
読者 どくしゃ n4 reader #人 @people
残る のこる vg3 remain, be left
残り のこり n3 the rest, what's left
飼い主 かいぬし n4 (pet) owner #人 @animal,people
貼る はる vg3 stick, put up (a poster) %vt
ポスター n3 poster #枚
レース n3 race (a contest) @sport
キャプテン n3 captain @sport,people
元 もと n4 former (元漁師); origin
誇らしい ほこらしい ai4 proud + @feeling
待ち遠しい まちどおしい ai4 can't wait for, long-awaited @feeling
マイク n3 microphone @tech
コース n3 course, route
観光客 かんこうきゃく n3 tourist #人 @travel,people
記事 きじ n4 (news) article
取材する しゅざいする vs4 gather news, report on; news gathering @work
他 ほか n2 other, else (the kanji form of ほか)
見守る みまもる vg4 watch over %vt
探偵 たんてい n4 detective #人 @story,people
推理 すいり n4 deduction, reasoning
証拠 しょうこ n4 evidence, proof
判断する はんだんする vs4 judge, decide; judgment
すれ違う すれちがう vg4 pass each other
面 めん n4 side, aspect; mask
遠慮する えんりょする vs4 hold back, refrain; reserve
遠慮なく えんりょなく adv4 without holding back, feel free
やりとり n4 exchange, back-and-forth
済む すむ vg3 be finished, be settled; get by
代わり かわり n3 a substitute; instead (の代わりに)
作者 さくしゃ n4 author #人 @story,people
不満 ふまん n4 dissatisfaction, complaint - @feeling
譲る ゆずる vg4 give up (a seat) for someone, hand over %vt
つかまる vg3 hold on (to); be caught
// ---- words the game's own lines use, so new short words don't split them (仮面, not 仮 + 面)
仮面 かめん n3 mask @art
路面電車 ろめんでんしゃ n4 tram, streetcar @transport
バイバイ int2 bye-bye
足元 あしもと n3 at your feet, underfoot
ボール紙 ぼーるがみ n4 cardboard
ターン n3 turn (in a game)
思い切り おもいきり adv4 with all your might, as much as you like
カレーライス n2 curry and rice @food
ライス n3 rice (on a plate) @food
`);
  W.push(`
// ---- work and careers (N3–N2)
職業 しょくぎょう n3 occupation, job @work
職場 しょくば n3 workplace @work
就職する しゅうしょくする vs3 get a job @work
転職する てんしょくする vs4 change jobs @work
退職する たいしょくする vs4 leave a job, retire @work
辞める やめる vi3 quit (a job, a school) %vt @work
求人 きゅうじん n4 job opening @work
応募する おうぼする vs4 apply (for a job, a contest) @work
面接 めんせつ n3 (job) interview @work
履歴書 りれきしょ n4 résumé, CV #枚 @work
収入 しゅうにゅう n4 income @money,work
ボーナス n3 bonus @money,work
残業する ざんぎょうする vs3 work overtime @work
出張する しゅっちょうする vs3 go on a business trip @work,travel
部下 ぶか n4 subordinate, member of your team #人 @work,people
部長 ぶちょう n4 department head #人 @work,people
課長 かちょう n4 section chief #人 @work,people
営業 えいぎょう n4 sales; being open for business @work
経営する けいえいする vs4 run, manage (a business) %vt @work
企業 きぎょう n4 company, enterprise @work
業界 ぎょうかい n4 industry, the business world @work
部署 ぶしょ n4 department, section @work
責任 せきにん n3 responsibility
任務 にんむ n4 duty, mission
プロジェクト n4 project @work
書類 しょるい n3 documents, papers #枚 @work
契約する けいやくする vs4 sign a contract; a contract @work
取引 とりひき n4 dealings, a deal @work,money
顧客 こきゃく n4 client, customer #人 @work,shop
製品 せいひん n4 product @work
生産する せいさんする vs4 produce, make %vt @work
技術者 ぎじゅつしゃ n4 engineer, technician #人 @work,people
専門家 せんもんか n4 expert, specialist #人 @people
弁護士 べんごし n4 lawyer #人 @work,people
会計士 かいけいし n4 accountant #人 @work,people
公務員 こうむいん n4 civil servant #人 @work,people
パート n3 part-time work @work
正社員 せいしゃいん n4 full-time employee #人 @work,people
フリーランス n4 freelance; freelancer @work
給与 きゅうよ n4 pay, salary @money,work
昇進する しょうしんする vs4 be promoted @work
出世 しゅっせ n4 getting ahead (in a career) @work
資格 しかく n4 qualification, license @work,school
スキル n4 skill @work
成果 せいか n4 results, outcome
効率 こうりつ n4 efficiency
休暇 きゅうか n4 holiday, time off @work,time
有給 ゆうきゅう n4 paid (leave) @work
通勤する つうきんする vs4 commute (to work) @work,transport
勤務する きんむする vs4 work (somewhere), be on duty @work
雇う やとう vg4 hire, employ %vt @work
指示する しじする vs4 instruct; instructions @work
報告する ほうこくする vs3 report; a report @work
打ち合わせ うちあわせ n4 (planning) meeting @work
締め切り しめきり n3 deadline @work,time
スケジュール n3 schedule @time
引き受ける ひきうける vi4 take on (a job, a task) %vt @work
断る ことわる vg3 refuse, turn down %vt
挑戦する ちょうせんする vs4 take on a challenge; a challenge
// ---- health and the body (N3–N2)
症状 しょうじょう n4 symptom @health
治療する ちりょうする vs4 treat (an illness); treatment @health
手術する しゅじゅつする vs4 operate; an operation @health
退院する たいいんする vs3 leave hospital @health
診察する しんさつする vs4 examine (a patient); a medical exam @health
診断する しんだんする vs4 diagnose; a diagnosis @health
検査する けんさする vs4 test, check; a test @health
薬局 やっきょく n3 pharmacy @health,shop
処方 しょほう n4 prescription @health
注射 ちゅうしゃ n4 injection, shot @health
患者 かんじゃ n4 patient #人 @health,people
歯医者 はいしゃ n3 dentist #人 @health,people
救急車 きゅうきゅうしゃ n3 ambulance #台 @health,transport
怪我 けが n3 injury, wound @health
骨折する こっせつする vs4 break a bone @health
傷 きず n4 wound, cut, scratch @health
咳 せき n3 cough @health
くしゃみ n3 sneeze @health
鼻水 はなみず n4 runny nose @health
頭痛 ずつう n4 headache @health
腹痛 ふくつう n4 stomachache @health
吐き気 はきけ n4 nausea, feeling sick @health
疲れ つかれ n3 tiredness @health
ストレス n3 stress @health
睡眠 すいみん n4 sleep @health
栄養 えいよう n4 nutrition @health,food
体力 たいりょく n4 stamina, physical strength @health
免疫 めんえき n4 immunity @health
血液 けつえき n4 blood @body,health
心臓 しんぞう n4 heart (the organ) @body
肺 はい n4 lung @body
筋肉 きんにく n4 muscle @body
皮膚 ひふ n4 skin @body
脳 のう n4 brain @body
腕 うで n3 arm @body
膝 ひざ n3 knee @body
喉 のど n3 throat @body
唇 くちびる n4 lips @body
まぶた n4 eyelid @body
眉 まゆ n4 eyebrow @body
汗 あせ n3 sweat @body
呼吸する こきゅうする vs4 breathe; breathing @body
予防する よぼうする vs4 prevent; prevention %vt @health
回復する かいふくする vs4 recover; recovery @health
健診 けんしん n4 health checkup @health
体調 たいちょう n3 (physical) condition @health
痛み いたみ n3 pain, ache @health
かゆい ai3 itchy @health
だるい ai4 sluggish, heavy (from tiredness) @health
めまい n4 dizziness @health
ウイルス n4 virus @health
感染する かんせんする vs4 be infected, spread; infection @health
マスク n3 (face) mask #枚 @health
消毒する しょうどくする vs4 disinfect %vt @health
手洗い てあらい n3 hand-washing; washroom @health,home
ダイエット n3 diet (to lose weight) @health
痩せる やせる vi3 lose weight, get thin @health
寿命 じゅみょう n4 life span @health
介護する かいごする vs4 care for (the elderly, the sick); care @health,people
障害 しょうがい n4 disability; obstacle @health
車いす くるまいす n4 wheelchair #台 @health
メンタル n4 mental (health) @health
カウンセリング n4 counseling @health
規則正しい きそくただしい ai4 regular, orderly (a life) @health
早起き はやおき n3 getting up early @time
深呼吸する しんこきゅうする vs4 take a deep breath @health
// ---- everyday words the game's lines use, so the new ones don't split them
席 せき n2 seat #つ @place
増やす ふやす vg3 increase (something) %vt
やめる vi2 stop, give up (doing) %vt
責任者 せきにんしゃ n4 person in charge #人 @work,people
余裕 よゆう n4 room, margin; time or money to spare
四角 しかく n3 square @color
こっち pron2 this way, here (casual) @place %loc
そっち pron2 that way, there (casual) @place %loc
あっち pron2 over there (casual) @place %loc
`);
  W.push(`
// ---- news and media (N3–N2)
報道する ほうどうする vs4 report (the news); coverage @tech
番組 ばんぐみ n3 (TV, radio) program @tech
司会 しかい n4 hosting, chairing (a show, a meeting)
司会者 しかいしゃ n4 host, MC #人 @people
アナウンサー n3 announcer #人 @work,people
視聴者 しちょうしゃ n4 viewer #人 @people
出版する しゅっぱんする vs4 publish %vt @story
情報 じょうほう n3 information
話題 わだい n3 topic (of conversation)
事件 じけん n3 incident, case
現場 げんば n4 the scene, the site @place
見出し みだし n4 headline
広告 こうこく n4 advertisement #枚
宣伝する せんでんする vs4 advertise, promote %vt
世論 よろん n4 public opinion
評判 ひょうばん n4 reputation
真実 しんじつ n4 truth
事実 じじつ n4 fact
発言する はつげんする vs4 speak up, say (in a meeting); a remark
記録する きろくする vs4 record; a record %vt
統計 とうけい n4 statistics
調査する ちょうさする vs4 investigate, survey; a survey %vt
データ n3 data @tech
最新 さいしん n4 latest, newest
速報 そくほう n4 news flash
中継 ちゅうけい n4 (live) broadcast, relay @tech
生中継 なまちゅうけい n4 live broadcast @tech
特集 とくしゅう n4 feature, special edition
投稿する とうこうする vs4 post (online) @tech
動画 どうが n3 video @tech
配信する はいしんする vs4 stream, put out (online) @tech
フォロワー n4 follower @tech,people
コメント n3 comment @tech
ブログ n3 blog @tech
炎上する えんじょうする vs4 go up in flames; get flamed (online)
拡散する かくさんする vs4 spread (online)
// ---- environment and climate (N3–N2)
温暖化 おんだんか n4 global warming @nature,weather
気候 きこう n4 climate @weather
汚染する おせんする vs4 pollute; pollution - @nature
公害 こうがい n4 pollution (as a public harm) - @nature
資源 しげん n4 resources @nature
再利用する さいりようする vs4 reuse %vt @nature
リサイクル n3 recycling @nature
分別する ぶんべつする vs4 sort (rubbish) %vt @nature
節約する せつやくする vs3 save, economize %vt @money
節電 せつでん n4 saving electricity @nature
エネルギー n3 energy @nature
電力 でんりょく n4 electric power @tech
石油 せきゆ n4 oil, petroleum @nature
太陽光 たいようこう n4 sunlight; solar power @nature
排気ガス はいきがす n4 exhaust fumes - @nature
二酸化炭素 にさんかたんそ n4 carbon dioxide @nature
森林 しんりん n4 forest @nature
海洋 かいよう n4 the ocean; marine @nature
生物 せいぶつ n4 living things; biology @nature
絶滅する ぜつめつする vs4 die out, become extinct - @nature,animal
保護する ほごする vs4 protect; protection %vt
災害 さいがい n4 disaster - @nature
津波 つなみ n4 tsunami @nature
噴火する ふんかする vs4 erupt (a volcano) @nature
異常気象 いじょうきしょう n4 extreme weather @weather
水不足 みずぶそく n4 water shortage @nature
大気 たいき n4 the atmosphere, the air @nature
酸素 さんそ n4 oxygen @nature
生態系 せいたいけい n4 ecosystem @nature
環境問題 かんきょうもんだい n4 environmental problem @nature
エコ n4 eco-friendly; ecology @nature
持続可能 じぞくかのう an4 sustainable @nature
プラスチック n3 plastic
レジ袋 れじぶくろ n4 plastic shopping bag #枚 @shop
使い捨て つかいすて n4 disposable, throwaway
有害 ゆうがい an4 harmful -
減らす へらす vg3 reduce, cut down %vt
// ---- technology and the internet (N3–N2)
技術 ぎじゅつ n3 technology, technique, skill @tech
装置 そうち n4 device, equipment @tech
機能 きのう n4 function, feature @tech
性能 せいのう n4 performance (of a machine) @tech
操作する そうさする vs4 operate, use (a device) %vt @tech
設定する せっていする vs4 set up; settings %vt @tech
充電する じゅうでんする vs4 charge (a battery) %vt @tech
充電器 じゅうでんき n4 charger #個 @tech
電源 でんげん n4 power (supply), the power switch @tech
ソフト n4 software @tech
ウェブサイト n4 website @tech
サイト n4 (web)site @tech
アカウント n4 account @tech
ログインする ろぐいんする vs4 log in @tech
ダウンロードする だうんろーどする vs3 download %vt @tech
アップロードする あっぷろーどする vs4 upload %vt @tech
検索する けんさくする vs4 search (online) %vt @tech
入力する にゅうりょくする vs4 input, type in %vt @tech
削除する さくじょする vs4 delete %vt @tech
保存する ほぞんする vs4 save, keep %vt @tech
印刷する いんさつする vs3 print %vt @tech
プログラム n3 program @tech
ロボット n3 robot #台 @tech
人工知能 じんこうちのう n4 artificial intelligence @tech
デジタル an4 digital @tech
通信 つうしん n4 communication(s) @tech
接続する せつぞくする vs4 connect; connection @tech
故障する こしょうする vs3 break down; a breakdown @tech
修理する しゅうりする vs3 repair; repairs %vt
発明する はつめいする vs4 invent; an invention %vt
開発する かいはつする vs4 develop %vt @tech
実験する じっけんする vs3 experiment; an experiment @school
科学者 かがくしゃ n4 scientist #人 @school,people
惑星 わくせい n4 planet @nature
衛星 えいせい n4 satellite @tech
画像 がぞう n4 image, picture @tech
自撮り じどり n4 selfie @tech
キーボード n4 keyboard @tech
マウス n4 (computer) mouse @tech
普及する ふきゅうする vs4 spread, become common
使用する しようする vs4 use; use %vt
進歩する しんぽする vs4 progress, advance; progress
発達する はったつする vs4 develop, grow
揃う そろう vg3 be all there, gather; match
コショウ n3 pepper (also the mule's name) @food
`);
  W.push(`
// ---- society and community, everyday law (N3–N2)
地域 ちいき n4 region, area; the local community @place
住民 じゅうみん n4 resident #人 @people,town
市民 しみん n4 citizen (of a city) #人 @people
国民 こくみん n4 the people (of a country), citizen #人 @people
人口 じんこう n3 population @people
政府 せいふ n4 government
政治 せいじ n4 politics
法律 ほうりつ n4 law
裁判 さいばん n4 trial
裁判所 さいばんしょ n4 court (of law) @place
警官 けいかん n4 police officer #人 @people
犯罪 はんざい n4 crime -
犯人 はんにん n4 criminal, culprit #人 @people
泥棒 どろぼう n3 thief #人 @people -
詐欺 さぎ n4 fraud, scam -
違反する いはんする vs4 break (a rule), violate; a violation -
罰金 ばっきん n4 fine (money) @money
権利 けんり n4 right(s)
義務 ぎむ n4 duty, obligation
平等 びょうどう an4 equal; equality +
差別する さべつする vs4 discriminate; discrimination %vt -
証明書 しょうめいしょ n4 certificate #枚
身分証明書 みぶんしょうめいしょ n4 ID card #枚
申請する しんせいする vs4 apply (for a visa, a permit) %vt
届け出る とどけでる vi4 report, notify (officially) %vt
手続き てつづき n4 procedure, formalities
登録する とうろくする vs4 register %vt
投票する とうひょうする vs4 vote
選挙 せんきょ n4 election
寄付する きふする vs4 donate; a donation %vt @money
募金 ぼきん n4 fundraising, collecting money @money
ボランティア n3 volunteer; volunteering @people
福祉 ふくし n4 welfare
貧困 ひんこん n4 poverty -
格差 かくさ n4 gap, inequality -
少子化 しょうしか n4 falling birthrate
高齢化 こうれいか n4 aging (of society)
高齢者 こうれいしゃ n4 elderly person #人 @people
世代 せだい n4 generation
宗教 しゅうきょう n4 religion
公共 こうきょう n4 public
施設 しせつ n4 facility @place
制度 せいど n4 system (of rules)
政策 せいさく n4 policy
改革する かいかくする vs4 reform; a reform %vt
軍隊 ぐんたい n4 army, troops
兵士 へいし n4 soldier #人 @people
道徳 どうとく n4 morals, ethics
マナー n3 manners
秩序 ちつじょ n4 order (in society)
治安 ちあん n4 public safety (how safe a place is)
被害 ひがい n4 damage, harm -
被害者 ひがいしゃ n4 victim #人 @people
加害者 かがいしゃ n4 perpetrator #人 @people
証人 しょうにん n4 witness #人 @people
弁償する べんしょうする vs4 pay for (damage) %vt @money
賠償 ばいしょう n4 compensation @money
苦情 くじょう n4 complaint -
トラブル n3 trouble -
解決する かいけつする vs3 solve, settle %vt
支援する しえんする vs4 support; support %vt
助け合う たすけあう vg4 help each other
地元 じもと n4 local area, hometown @place
町内会 ちょうないかい n4 neighborhood association @town
自治体 じちたい n4 local government @town
役所 やくしょ n4 government office, town hall @place,town
市役所 しやくしょ n3 city hall @place,town
区役所 くやくしょ n4 ward office @place,town
// ---- education and science (N3–N2)
教育 きょういく n3 education @school
学歴 がくれき n4 educational background @school
学位 がくい n4 (university) degree @school
大学院 だいがくいん n4 graduate school @school
修士 しゅうし n4 master's (degree) @school
博士 はかせ n4 doctor (PhD); professor, scientist (in stories) #人 @school,people
学部 がくぶ n4 faculty (of a university) @school
講義 こうぎ n4 lecture @school
単位 たんい n4 (university) credit; unit @school
不合格 ふごうかく n4 failing (an exam) - @school
受験する じゅけんする vs4 take an (entrance) exam @school
進学する しんがくする vs4 go on to higher education @school
奨学金 しょうがくきん n4 scholarship @school,money
学費 がくひ n4 school fees, tuition @school,money
参考書 さんこうしょ n4 study guide #冊 @school
課題 かだい n4 assignment, task @school
論文 ろんぶん n4 thesis, paper @school
理論 りろん n4 theory
実践 じっせん n4 practice (not just theory)
物理 ぶつり n4 physics @school
化学 かがく n4 chemistry @school
生物学 せいぶつがく n4 biology @school
地理 ちり n4 geography @school
哲学 てつがく n4 philosophy @school
心理学 しんりがく n4 psychology @school
文学 ぶんがく n3 literature @school,story
経済学 けいざいがく n4 economics @school
語彙 ごい n4 vocabulary @language
知識 ちしき n3 knowledge
知恵 ちえ n4 wisdom
学問 がくもん n4 learning, scholarship
結論 けつろん n4 conclusion
仮説 かせつ n4 hypothesis
証明する しょうめいする vs4 prove; proof %vt
分析する ぶんせきする vs4 analyze; analysis %vt
観察する かんさつする vs4 observe; observation %vt
計算する けいさんする vs3 calculate %vt
公式 こうしき n4 formula; official
原理 げんり n4 principle
教師 きょうし n4 teacher #人 @school,people
講師 こうし n4 lecturer, instructor #人 @school,people
校長 こうちょう n4 principal (of a school) #人 @school,people
幼稚園 ようちえん n3 kindergarten @school,place
保育園 ほいくえん n4 nursery school @school,place
専門学校 せんもんがっこう n4 vocational school @school,place
塾 じゅく n4 cram school @school,place
講座 こうざ n4 course, class (for adults) @school
学者 がくしゃ n4 scholar, researcher #人 @school,people
言語 げんご n4 language @language
カウンター n3 counter (in a shop, an office) @shop
ばっちり adv4 perfectly, just right
`);
  W.push(`
// ---- opinions and abstract ideas, and the words of arguing and linking (N3–N2)
それにもかかわらず conj4 nevertheless, despite that %conn
にもかかわらず phrase4 in spite of, although %conn
したがって conj4 therefore, so %conn
ところが conj3 however, but (to your surprise) %conn
ただし conj4 however, but (a condition) %conn
なお conj4 also, in addition; still more %conn
すなわち conj4 that is, namely %conn
要するに ようするに adv4 in short, basically %conn
一方 いっぽう conj4 on the other hand; meanwhile %conn
それとも conj3 or (in a question) %conn
あるいは conj4 or, perhaps %conn
もしくは conj4 or (formal) %conn
なぜなら conj3 because (…からだ) %conn
だって conj3 but, because (casual) %conn
それなのに conj4 and yet, even so %conn
しかも conj4 moreover, what's more %conn
そのうえ conj4 besides, on top of that %conn
おまけに adv4 to make matters worse, on top of that %conn
実際 じっさい adv4 actually, in fact
むしろ adv4 rather, if anything
かえって adv4 on the contrary, instead
最初に さいしょに adv3 first, at first
一般的に いっぱんてきに adv4 generally, in general
基本的に きほんてきに adv4 basically
主張する しゅちょうする vs4 claim, insist; a claim
議論する ぎろんする vs4 argue, discuss; a discussion
説得する せっとくする vs4 persuade %vt
納得する なっとくする vs4 be convinced, accept
理解する りかいする vs3 understand; understanding %vt
評価する ひょうかする vs4 evaluate, rate; an evaluation %vt
批判する ひはんする vs4 criticize; criticism %vt
比較する ひかくする vs4 compare; a comparison %vt
価値 かち n4 value, worth
意義 いぎ n4 significance, meaning
不要 ふよう an4 unnecessary
可能 かのう an4 possible
不可能 ふかのう an4 impossible
当然 とうぜん an4 natural, of course
正確 せいかく an4 accurate, exact
明らか あきらか an4 clear, obvious
具体的 ぐたいてき an4 concrete, specific
抽象的 ちゅうしょうてき an4 abstract
客観的 きゃっかんてき an4 objective
主観的 しゅかんてき an4 subjective
積極的 せっきょくてき an4 positive, active, willing +
消極的 しょうきょくてき an4 passive, negative -
前向き まえむき an4 positive, forward-looking +
否定的 ひていてき an4 negative -
肯定的 こうていてき an4 positive, affirmative +
現実的 げんじつてき an4 realistic
理想 りそう n4 ideal
現実 げんじつ n4 reality
事情 じじょう n4 circumstances, reasons
状況 じょうきょう n4 situation
状態 じょうたい n4 state, condition
条件 じょうけん n4 condition, terms
傾向 けいこう n4 tendency, trend
影響する えいきょうする vs4 influence, affect; influence
効果 こうか n4 effect
変化する へんかする vs4 change; a change
共通 きょうつう n4 common, shared (共通の)
特徴 とくちょう n4 characteristic, feature
長所 ちょうしょ n4 strong point, merit +
短所 たんしょ n4 weak point, fault -
メリット n4 advantage, merit +
デメリット n4 disadvantage -
問題点 もんだいてん n4 the problem, a weak point
解決策 かいけつさく n4 solution
手段 しゅだん n4 means, way
立場 たちば n4 standpoint, position
観点 かんてん n4 point of view
視点 してん n4 viewpoint, perspective
価値観 かちかん n4 values, sense of values
常識 じょうしき n4 common sense
偏見 へんけん n4 prejudice -
本音 ほんね n4 what you really think
建前 たてまえ n4 what you say in public
// ---- feelings (N3–N2)
感情 かんじょう n4 emotion, feelings @feeling
喜び よろこび n3 joy + @feeling
怒り いかり n4 anger - @feeling
反省する はんせいする vs4 reflect on (your mistakes) @feeling
憧れる あこがれる vi4 long for, admire @feeling
悔しい くやしい ai3 frustrating, galling - @feeling
切ない せつない ai4 heartrending, wistful @feeling
悲しむ かなしむ vg3 grieve, be sad - @feeling
落ち込む おちこむ vg4 feel down - @feeling
落ち着く おちつく vg3 calm down, settle + @feeling
焦る あせる vg4 be in a rush, panic - @feeling
慌てる あわてる vi4 panic, be flustered - @feeling
意外 いがい an4 unexpected, surprising @feeling
夢中 むちゅう an4 absorbed (in), crazy (about) @feeling
必死 ひっし an4 desperate, frantic @feeling
素直 すなお an4 honest, frank; obedient + @feeling
思いやり おもいやり n4 consideration, kindness + @feeling
幸福 こうふく n4 happiness + @feeling
不幸 ふこう an4 unhappy, unfortunate - @feeling
リラックス n3 relaxation; relaxed @feeling
癒す いやす vg4 heal, soothe %vt @feeling
癒やし いやし n4 comfort, healing @feeling
わくわく adv3 excited, thrilled @feeling
どきどき adv3 (heart) pounding, nervous @feeling
いらいら adv3 irritated, on edge @feeling
がっかり adv3 disappointed @feeling
びっくり adv3 surprised @feeling
うっとり adv4 entranced, enchanted @feeling
内容 ないよう n3 content(s), what's in it
`);
  W.push(`
// ---- travel, culture and the arts (N3–N2)
観光地 かんこうち n4 tourist spot @travel %place
名所 めいしょ n4 famous place, sight @travel %place
民宿 みんしゅく n4 guesthouse, B&B #軒 @travel %place
宿泊する しゅくはくする vs4 stay (at a hotel) @travel
キャンセルする きゃんせるする vs3 cancel %vt
滞在する たいざいする vs4 stay (somewhere) @travel
乗り換える のりかえる vi3 change (trains, buses) @transport
乗り換え のりかえ n3 transfer, change (of trains) @transport
往復 おうふく n4 round trip @travel
片道 かたみち n4 one way @travel
航空券 こうくうけん n4 plane ticket #枚 @travel
手荷物 てにもつ n4 hand luggage @travel
スーツケース n3 suitcase @travel
両替する りょうがえする vs4 change (money) %vt @money,travel
海外 かいがい n3 abroad, overseas @place,travel
国内 こくない n4 domestic, within the country @place
地方 ちほう n4 region; the provinces @place
風景 ふうけい n4 scenery, landscape @nature
名物 めいぶつ n4 local specialty @food,travel
特産 とくさん n4 local product @food,travel
記念 きねん n4 commemoration, memory
記念品 きねんひん n4 keepsake, souvenir
ガイド n3 guide @travel,people
ツアー n3 tour @travel
演劇 えんげき n4 drama, theater @art
芝居 しばい n4 play (on stage); acting @art
展示する てんじする vs4 display, exhibit %vt @art
展覧会 てんらんかい n4 exhibition @art
作品 さくひん n3 work (of art) @art
作家 さっか n3 writer, author #人 @art,people
芸術 げいじゅつ n4 art @art
芸術家 げいじゅつか n4 artist #人 @art,people
画家 がか n4 painter #人 @art,people
俳優 はいゆう n4 actor #人 @art,people
監督 かんとく n4 director; coach #人 @art,people
脚本 きゃくほん n4 script, screenplay @art
詩人 しじん n4 poet #人 @art,people
伝説 でんせつ n4 legend @story
神話 しんわ n4 myth @story
行事 ぎょうじ n4 (yearly) event @time
儀式 ぎしき n4 ceremony
伝統的 でんとうてき an4 traditional
文化財 ぶんかざい n4 cultural asset
遺跡 いせき n4 ruins, historic remains @travel %place
城 しろ n3 castle @travel %place
茶道 さどう n4 tea ceremony @art
書道 しょどう n4 calligraphy @art
和食 わしょく n3 Japanese food @food
// ---- money and shopping (N3–N2)
価格 かかく n4 price @money,shop
割引する わりびきする vs4 discount; a discount %vt @shop,money
安売り やすうり n4 sale, bargain sale @shop
税金 ぜいきん n4 tax @money
消費税 しょうひぜい n4 consumption tax @money
クレジットカード n3 credit card #枚 @money
支払う しはらう vg3 pay %vt @money
支払い しはらい n3 payment @money
払い戻す はらいもどす vg4 refund %vt @money
返金 へんきん n4 refund @money
レシート n3 receipt #枚 @shop
領収書 りょうしゅうしょ n4 receipt (formal) #枚 @shop,money
小銭 こぜに n4 small change, coins @money
預金 よきん n4 savings, deposit @money
銀行口座 ぎんこうこうざ n4 bank account @money
口座 こうざ n4 (bank) account @money
振り込む ふりこむ vg4 transfer (money) %vt @money
振込 ふりこみ n4 (bank) transfer @money
ローン n4 loan @money
借金 しゃっきん n4 debt - @money
利子 りし n4 interest (on money) @money
給料日 きゅうりょうび n4 payday @money,time
家計 かけい n4 household budget @money,home
物価 ぶっか n4 prices (of things) @money
値上がり ねあがり n4 price rise @money
値下がり ねさがり n4 price fall @money
高価 こうか an4 expensive, costly @money
安価 あんか an4 cheap, inexpensive @money
お得 おとく an3 a good deal, worth it + @shop
品物 しなもの n3 goods, article @shop
商品 しょうひん n3 product, merchandise @shop
品質 ひんしつ n4 quality @shop
ブランド n3 brand @shop
中古 ちゅうこ n4 secondhand, used @shop
新品 しんぴん n4 brand-new item @shop
通販 つうはん n4 mail order, online shopping @shop
返品する へんぴんする vs4 return (goods) %vt @shop
交換する こうかんする vs3 exchange, swap %vt
配送 はいそう n4 delivery @shop
送料 そうりょう n4 shipping cost @shop,money
在庫 ざいこ n4 stock (in a shop) @shop
売り切れ うりきれ n3 sold out @shop
定価 ていか n4 list price @shop,money
レジ n3 cash register, checkout @shop
// ---- housing and city life (N3–N2)
住宅 じゅうたく n4 housing, residence @home
住まい すまい n4 home, where you live @home
家賃 やちん n3 rent @home,money
敷金 しききん n4 deposit (for renting) @home,money
不動産 ふどうさん n4 real estate @home
引っ越し ひっこし n3 moving (house) @home
大家 おおや n4 landlord #人 @home,people
管理人 かんりにん n4 caretaker, building manager #人 @home,people
一戸建て いっこだて n4 detached house @home
間取り まどり n4 floor plan, layout @home
リビング n3 living room @home
寝室 しんしつ n4 bedroom @home
和室 わしつ n4 Japanese-style room @home
洋室 ようしつ n4 Western-style room @home
家具 かぐ n3 furniture @home
家電 かでん n4 home appliances @home,tech
暖房 だんぼう n4 heating @home
冷房 れいぼう n4 air conditioning (cooling) @home
都市 とし n4 city @town
都心 としん n4 city center @town %place
郊外 こうがい n4 suburbs @town %place
住宅街 じゅうたくがい n4 residential area @town %place
商店街 しょうてんがい n3 shopping street @town,shop %place
繁華街 はんかがい n4 downtown, busy area @town %place
駅前 えきまえ n3 in front of the station @town %place
歩道 ほどう n4 sidewalk @town
横断歩道 おうだんほどう n3 crosswalk @town
渋滞 じゅうたい n4 traffic jam @transport
混雑する こんざつする vs4 be crowded; congestion @town
騒音 そうおん n4 noise - @town
ごみ出し ごみだし n4 putting out the rubbish @home
近所付き合い きんじょづきあい n4 getting along with the neighbors @people
売り切れる うりきれる vi3 sell out, be sold out @shop
零時 れいじ n3 midnight, twelve o'clock @time %tni
登場する とうじょうする vs4 appear (in a story, on stage) @story
登場人物 とうじょうじんぶつ n4 character (in a story) #人 @story,people
紙芝居 かみしばい n4 picture-card show (kamishibai) @art,story
ベレー帽 べれーぼう n4 beret @clothes
上る のぼる vg3 go up, climb (stairs, a slope)
下りる おりる vi3 go down, come down (a mountain, stairs)
`);
  W.push(`
// ---- the game's own words that had no headword yet (verbs and adjectives, so their forms are known: 回して, 崩れた, きつかった)
回す まわす vg2 turn (something), spin %vt
彫る ほる vg4 carve %vt @art
積む つむ vg3 load, pile up %vt
測る はかる vg3 measure %vt
塗る ぬる vg3 paint, spread (on) %vt
こねる vi4 knead %vt @food
剥く むく vg4 peel %vt @food =w.ml_peel
挽く ひく vg4 grind (coffee, flour) %vt @food
きしむ vg4 creak
建て直す たてなおす vg4 rebuild %vt
掃く はく vg3 sweep %vt @home
覆う おおう vg4 cover %vt
訪ねる たずねる vi3 visit %vt
立ち止まる たちどまる vg3 stop (walking), stand still
繕う つくろう vg4 mend %vt =w.lp_to_mend
漕ぐ こぐ vg4 row (a boat), pedal %vt =w.lp_to_row
膨らむ ふくらむ vg4 swell, puff up =w.lf_to_puff_up
掘る ほる vg3 dig %vt
研ぐ とぐ vg4 sharpen; wash (rice) %vt
当てる あてる vi3 guess; hit; put (on) %vt
崩れる くずれる vi4 collapse, crumble
匂う におう vg3 smell (of), give off a smell =w.gd_smell
拭く ふく vg3 wipe %vt @home
放す はなす vg4 let go (of), set free %vt =w.gd_letgo
下げる さげる vi2 lower, hang %vt
よける vi4 dodge, step aside =w.gd_stepaside
降ろす おろす vg3 unload, take down, drop off %vt
揚げる あげる vi3 deep-fry; hoist (a flag) %vt @food
導く みちびく vg4 guide, lead %vt
すする vg4 slurp, sip %vt @food
スケートする すけーとする vs3 skate @sport
蒸発する じょうはつする vs4 evaporate @nature
干上がる ひあがる vg4 dry up @nature
湧き出る わきでる vi4 spring up, gush out (water) @nature
滑る すべる vg3 slip, slide
滴る したたる vg4 drip
溢れる あふれる vi4 overflow
透明 とうめい an4 transparent, see-through
頑固 がんこ an4 stubborn -
青白い あおじろい ai4 pale
硬い かたい ai3 hard, stiff
厚い あつい ai3 thick
滑りやすい すべりやすい ai4 slippery =w.pkp_slippery
険しい けわしい ai4 steep; harsh =w.pkp_steep
ほこりっぽい ai4 dusty
ありがたい ai3 grateful; welcome +
緩い ゆるい ai4 loose; gentle (a slope) =w.pkf_loose
きつい ai3 tight; hard, tough
// ---- verbs (N3–N2)
向く むく vg3 face, turn (toward); suit
向ける むける vi3 turn (something) toward, aim %vt
扱う あつかう vg3 handle, treat, deal with %vt
争う あらそう vg3 compete, fight, argue
与える あたえる vi3 give, award %vt
表す あらわす vg3 show, express %vt
現れる あらわれる vi3 appear, show up
移す うつす vg3 move (something), transfer %vt
訴える うったえる vi3 complain, appeal; sue %vt
補う おぎなう vg4 make up for, supplement %vt
抑える おさえる vi3 hold down, control, keep in %vt
劣る おとる vg4 be inferior (to)
傾く かたむく vg4 lean, tilt
囲む かこむ vg3 surround %vt
重ねる かさねる vi3 pile up, stack; repeat %vt
稼ぐ かせぐ vg3 earn (money) %vt @money
叶う かなう vg4 come true (a wish)
叶える かなえる vi4 make (a wish) come true %vt
構う かまう vg3 mind, care (構わない: it doesn't matter)
効く きく vg3 work, be effective (a medicine) @health
刻む きざむ vg4 chop finely; carve %vt @food
築く きずく vg4 build (up) %vt
崩す くずす vg4 break down, knock down; break (a bill) %vt
砕く くだく vg4 crush, smash %vt
加わる くわわる vg4 join, be added
加える くわえる vi3 add %vt
削る けずる vg4 shave, sharpen (a pencil); cut down %vt
冷める さめる vi3 get cold, cool down @food
冷ます さます vg4 cool (something) %vt @food
支える ささえる vi3 support, hold up %vt
沈む しずむ vg3 sink; set (the sun)
沈める しずめる vi4 sink (something) %vt
従う したがう vg3 obey, follow
縛る しばる vg4 tie up, bind %vt
生じる しょうじる vi4 arise, occur
占める しめる vi4 occupy, take up (a share) %vt
湿る しめる vg4 get damp
絞る しぼる vg4 wring, squeeze %vt
示す しめす vg3 show, point out %vt
迫る せまる vg4 approach, draw near; press
優れる すぐれる vi4 excel, be excellent +
済ませる すませる vi3 finish, get (it) done %vt
備える そなえる vi3 prepare (for); be equipped with
耕す たがやす vg4 plow, till %vt @nature
頼る たよる vg3 rely on, depend on
保つ たもつ vg4 keep, maintain %vt
縮む ちぢむ vg4 shrink
縮める ちぢめる vi4 shorten, shrink %vt
散らかす ちらかす vg3 mess up, scatter %vt @home
散る ちる vg3 fall, scatter (leaves, petals) @nature
尽きる つきる vi4 run out, be used up
尽くす つくす vg4 do all you can; serve %vt
潰す つぶす vg4 crush; kill (time) %vt
潰れる つぶれる vi4 be crushed; go bankrupt
詰める つめる vi3 pack, stuff, fill %vt
詰まる つまる vg4 be blocked, be packed
照らす てらす vg4 light up, shine on %vt
解く とく vg3 solve; untie %vt
整う ととのう vg4 be ready, be in order
整える ととのえる vi4 arrange, put in order %vt
唱える となえる vi4 chant, recite %vt
眺める ながめる vi3 gaze at, look out over %vt
流す ながす vg3 let flow, wash away; play (music) %vt
流れる ながれる vi3 flow, run; be played (music)
嘆く なげく vg4 grieve, lament -
慰める なぐさめる vi4 comfort, console %vt
怠ける なまける vi4 be lazy, slack off -
憎む にくむ vg4 hate %vt -
逃す のがす vg4 miss (a chance), let escape %vt
濁る にごる vg4 get muddy, become cloudy
抜く ぬく vg3 pull out; skip (a meal) %vt
抜ける ぬける vi3 come out, fall out; get through
除く のぞく vg4 remove, exclude %vt
剥がす はがす vg4 peel off, tear off %vt
果たす はたす vg4 fulfil, carry out %vt
省く はぶく vg4 leave out, cut out %vt
含む ふくむ vg3 contain, include %vt
含める ふくめる vi4 include %vt
防ぐ ふせぐ vg3 prevent, defend against %vt
外れる はずれる vi3 come off; miss, be wrong
離す はなす vg3 separate, take away %vt
震える ふるえる vi3 shake, tremble
触れる ふれる vi3 touch; mention
誇る ほこる vg4 be proud of, boast
埋める うめる vi3 bury, fill in %vt
見直す みなおす vg4 look over again, review %vt
実る みのる vg4 bear fruit, ripen @nature
結ぶ むすぶ vg3 tie, connect %vt
恵まれる めぐまれる vi4 be blessed with
設ける もうける vi4 set up, establish %vt
求める もとめる vi3 ask for, seek, demand %vt
基づく もとづく vg4 be based on
破る やぶる vg3 tear; break (a promise) %vt
破れる やぶれる vi3 tear, be torn
揺れる ゆれる vi3 shake, sway
許す ゆるす vg3 forgive, allow %vt
汚す よごす vg3 make dirty %vt
詫びる わびる vi4 apologize
割る わる vg3 break (a plate), split; divide %vt
預かる あずかる vg3 look after, keep (for someone) %vt
浮かぶ うかぶ vg3 float; come to mind
浮かべる うかべる vi4 float (something); call to mind %vt
奪う うばう vg3 take away, rob %vt -
追いつく おいつく vg3 catch up
送り出す おくりだす vg4 send off, see off %vt
収める おさめる vi4 put away; achieve, obtain %vt
治める おさめる vi4 govern, rule %vt
及ぶ およぶ vg4 reach, extend (to)
及ぼす およぼす vg4 have (an effect) on %vt
傷つける きずつける vi3 hurt, injure %vt -
傷つく きずつく vg3 get hurt -
競う きそう vg4 compete
区切る くぎる vg4 divide, mark off %vt
悔やむ くやむ vg4 regret -
好む このむ vg4 like, prefer %vt
転がる ころがる vg3 roll, tumble
探る さぐる vg4 search, feel around for; spy on %vt
避ける さける vi3 avoid %vt
刺す さす vg3 stab, sting %vt
定める さだめる vi4 decide, set (a rule) %vt
仕上げる しあげる vi4 finish (off), complete %vt
生かす いかす vg4 make use of, make the most of %vt
締める しめる vi3 tighten, tie (a belt, a tie) %vt
責める せめる vi4 blame %vt -
揃える そろえる vi3 put in order, get together %vt
備わる そなわる vg4 be equipped with, be provided
耐える たえる vi4 bear, endure
高める たかめる vi4 raise, improve %vt
蓄える たくわえる vi4 store, save up %vt
試す ためす vg3 try, test %vt
突く つく vg4 poke, push; strike %vt
継ぐ つぐ vg4 succeed to, take over %vt
包む つつむ vg3 wrap %vt
努める つとめる vi4 try hard, endeavor
積もる つもる vg3 pile up (snow)
貫く つらぬく vg4 go through; stick to (your beliefs) %vt
照れる てれる vi4 be shy, be embarrassed
問い合わせる といあわせる vi4 inquire %vt
遠ざかる とおざかる vg4 move away, go far off
溶け込む とけこむ vg4 blend in, fit in
解ける とける vi4 come untied; be solved
振り返る ふりかえる vg4 look back
越える こえる vi3 go over, cross
超える こえる vi4 exceed, go beyond
聖歌 せいか n4 hymn @music
聖歌隊 せいかたい n4 choir @music
得 とく n4 profit, gain; a good deal +
限り かぎり n4 as long as; the limit
もったいない ai3 wasteful, what a waste
意地悪 いじわる an3 mean, nasty -
裏 うら n3 the back, the reverse side
表 おもて n3 the front, the surface; outside
っけ part3 (trying to remember: …again? wasn't it?)
カッコー n4 cuckoo #羽 @animal
湧く わく vg4 spring up, gush out (water) @nature
剥がれる はがれる vi4 come off, peel off
`);
  W.push(`
// ---- describing words: い- and な-adjectives (N3–N2)
鋭い するどい ai4 sharp, keen
著しい いちじるしい ai4 remarkable, marked
荒い あらい ai4 rough, wild (the sea, breathing)
勇ましい いさましい ai4 brave, gallant +
偉い えらい ai3 great, admirable; important
幼い おさない ai3 very young, little; childish
賢い かしこい ai3 wise, clever +
濃い こい ai3 dark (a color), thick, strong (coffee)
騒がしい さわがしい ai4 noisy, loud
鈍い にぶい ai4 dull, slow
等しい ひとしい ai4 equal
貧しい まずしい ai3 poor -
乏しい とぼしい ai4 scarce, lacking -
尊い とうとい ai4 precious, noble
眩しい まぶしい ai3 dazzling, too bright
頼もしい たのもしい ai4 reliable, promising +
好ましい このましい ai4 desirable, pleasant
望ましい のぞましい ai4 desirable, advisable
ふさわしい ai4 suitable, fitting
素早い すばやい ai4 quick, nimble
慌ただしい あわただしい ai4 hectic, rushed
情けない なさけない ai4 pitiful, shameful -
申し訳ない もうしわけない ai3 sorry, inexcusable
頼りない たよりない ai4 unreliable -
物足りない ものたりない ai4 not quite enough, unsatisfying
面倒くさい めんどうくさい ai3 a hassle, bothersome
可愛らしい かわいらしい ai4 lovely, sweet +
子どもっぽい こどもっぽい ai4 childish
大人っぽい おとなっぽい ai4 grown-up, mature-looking
若々しい わかわかしい ai4 youthful
たくましい ai4 strong, sturdy, tough
心強い こころづよい ai4 reassuring +
心細い こころぼそい ai4 helpless, uneasy -
力強い ちからづよい ai4 powerful, strong
粘り強い ねばりづよい ai4 persistent, tenacious
我慢強い がまんづよい ai4 patient
曖昧 あいまい an4 vague, ambiguous
鮮やか あざやか an4 vivid, bright
穏やか おだやか an4 calm, gentle +
気軽 きがる an4 casual, easy (気軽に)
気楽 きらく an4 easygoing, carefree
器用 きよう an4 skillful, good with your hands +
不器用 ぶきよう an4 clumsy
強力 きょうりょく an4 powerful, strong
謙虚 けんきょ an4 humble, modest +
厳重 げんじゅう an4 strict, tight (security)
豪華 ごうか an4 luxurious, gorgeous
盛ん さかん an4 thriving, popular
爽やか さわやか an4 refreshing, fresh +
柔軟 じゅうなん an4 flexible
速やか すみやか an4 prompt, speedy
素朴 そぼく an4 simple, unpretentious
率直 そっちょく an4 frank, straightforward
単純 たんじゅん an3 simple
適切 てきせつ an4 appropriate, proper
手軽 てがる an4 easy, handy
独特 どくとく an4 unique, characteristic
平凡 へいぼん an4 ordinary, common
豊富 ほうふ an4 abundant, rich
明確 めいかく an4 clear, definite
有効 ゆうこう an4 valid, effective
有能 ゆうのう an4 capable, competent
愉快 ゆかい an4 pleasant, cheerful +
余計 よけい an4 unnecessary, extra; all the more
冷静 れいせい an4 calm, cool-headed
安易 あんい an4 easy (too easy), careless
異常 いじょう an4 abnormal, unusual
大げさ おおげさ an4 exaggerated, over the top
真剣 しんけん an3 serious, earnest
地味 じみ an3 plain, sober (a color, a style)
派手 はで an3 flashy, showy
上品 じょうひん an4 elegant, refined +
下品 げひん an4 vulgar -
見事 みごと an4 splendid, wonderful +
微妙 びみょう an4 subtle; so-so, iffy
妙 みょう an4 strange, odd
迷惑 めいわく an3 trouble, a nuisance (迷惑をかける) -
面倒 めんどう an3 trouble, bother; a hassle
贅沢 ぜいたく an4 luxury, extravagant
質素 しっそ an4 simple, frugal
頑丈 がんじょう an4 sturdy, solid
快適 かいてき an4 comfortable +
不自然 ふしぜん an4 unnatural
主要 しゅよう an4 main, principal
重大 じゅうだい an4 serious, important
深刻 しんこく an4 serious, grave -
じゅうぶん an3 enough, plenty (じゅうぶんに)
正式 せいしき an4 formal, official
公平 こうへい an4 fair, impartial +
健全 けんぜん an4 healthy, sound
優秀 ゆうしゅう an4 excellent, outstanding +
貴重 きちょう an4 precious, valuable
高級 こうきゅう an4 high-class, luxury
確実 かくじつ an4 certain, sure
着実 ちゃくじつ an4 steady
順調 じゅんちょう an4 smooth, going well +
活発 かっぱつ an4 lively, active
誠実 せいじつ an4 sincere, honest +
慎重 しんちょう an4 careful, cautious
わずか an4 only, slight, a few
// ---- adverbs and the words that colour a sentence (N3–N2)
相変わらず あいかわらず adv4 as usual, as always
改めて あらためて adv4 again, anew
案外 あんがい adv4 unexpectedly, surprisingly
一応 いちおう adv3 just in case; more or less
一気に いっきに adv4 all at once, in one go
一斉に いっせいに adv4 all together, all at once
今にも いまにも adv4 at any moment
必ずしも かならずしも adv4 not necessarily (…ない)
かつて adv4 once, formerly
早速 さっそく adv3 at once, right away
ざっと adv4 roughly, briefly
次第に しだいに adv4 gradually
実に じつに adv4 truly, really
しばしば adv4 often, frequently
少なくとも すくなくとも adv3 at least
せっかく adv3 with effort; kindly (せっかくの…)
相当 そうとう adv4 considerably, quite
互いに たがいに adv4 mutually, each other
お互い おたがい n3 each other
直ちに ただちに adv4 immediately
たちまち adv4 in an instant
絶えず たえず adv4 constantly
たとえ adv4 even if (たとえ…ても)
単に たんに adv4 merely, simply
ちっとも adv3 not at all (…ない)
ついでに adv3 while you're at it
次々 つぎつぎ adv4 one after another
常に つねに adv4 always
到底 とうてい adv4 (not) possibly (…ない)
ついに adv3 finally, at last
とっくに adv4 long ago, already
何しろ なにしろ adv4 anyway, at any rate
何とか なんとか adv3 somehow; something or other
再び ふたたび adv4 again, once more
ふと adv3 suddenly, by chance
別に べつに adv3 (not) particularly (…ない)
まさに adv4 exactly, just, truly
真っ先に まっさきに adv4 first of all
間もなく まもなく adv3 soon, shortly
自ら みずから adv4 oneself, personally
無論 むろん adv4 of course
最も もっとも adv3 most
専ら もっぱら adv4 mainly, exclusively
元々 もともと adv3 originally, from the start
やがて adv4 soon, before long
ようやく adv4 at last, finally
わざと adv3 on purpose
わざわざ adv3 go to the trouble of
いきなり adv3 suddenly, without warning
いずれ adv4 sooner or later; either
一層 いっそう adv4 even more
いったい adv4 (what) on earth
今さら いまさら adv4 now (after all this time), too late
一切 いっさい adv4 (not) at all; everything
うっかり adv3 carelessly, by mistake
おそらく adv3 probably
思い切って おもいきって adv4 boldly, taking the plunge
主として しゅとして adv4 mainly
概して がいして adv4 generally
くれぐれも adv4 (please) be sure to
極めて きわめて adv4 extremely
こっそり adv3 secretly, quietly
さっさと adv4 quickly, without delay
ずいぶん adv3 quite, very
せめて adv4 at least
たまたま adv4 by chance
てっきり adv4 surely (but wrongly)
どうせ adv3 anyway, after all
どうにか adv4 somehow
とにかく adv3 anyway, at any rate
共に ともに adv4 together, with
何より なにより adv3 above all, more than anything
本来 ほんらい adv4 originally, by nature
まさか adv3 no way!, surely not
未だに いまだに adv4 still (even now)
めったに adv3 rarely (…ない)
もしかしたら adv3 maybe, perhaps
もしかすると adv4 perhaps
よほど adv4 very, greatly
突然 とつぜん adv3 suddenly
同時 どうじ n3 the same time (同時に)
堂々 どうどう adv4 confidently, boldly (堂々と)
例える たとえる vi4 compare (to), liken %vt
でっかい ai4 huge (casual)
幼なじみ おさななじみ n4 childhood friend #人 @people
なじみ n4 familiarity, an old acquaintance (おなじみの: familiar)
こそ part3 (emphasis: this very…, だからこそ: that's exactly why)
全国 ぜんこく n3 the whole country, nationwide @place
小さじ こさじ n4 teaspoon (in a recipe) #杯 @food
大さじ おおさじ n4 tablespoon (in a recipe) #杯 @food
シフト n4 (work) shift @work
お見事 おみごと int4 well done!, bravo! +
子育て こそだて n4 raising children @family
中心 ちゅうしん n3 center, middle
表紙 ひょうし n4 (book) cover @story
ずれる vi4 slip out of place; be off (a time, a clock)
おすすめ n3 recommendation; recommended
彼氏 かれし n3 boyfriend #人 @people
グループ n3 group #つ @people
はがき n3 postcard #枚 @school
ぶつかる vg3 bump into, crash into
ぶつける vi3 hit, bump (something) against %vt
つらい ai3 hard, painful (to bear) -
たきぎ n4 firewood @nature
おしまい n3 the end, over (おしまいだ: that's it)
によると phrase3 according to
だそう phrase3 they say, I hear (…だそうです)
`);
  W.push(`
// ---- the radio kit's, the detective serial's and the paper's words (A1's «read: kit / serial / paper ja» lines)
七夕 たなばた n3 Tanabata, the star festival (7 July) @time
梅 うめ n3 plum, Japanese apricot (梅雨: the rainy season) @nature,food
折り紙 おりがみ n3 origami, folded paper @hobby,art
恐竜 きょうりゅう n3 dinosaur #匹,頭 @animal
交換会 こうかんかい n4 swap meet @town
雪合戦 ゆきがっせん n4 snowball fight @sport
マラソン n3 marathon (読書マラソン: a reading marathon) @sport
歩行者天国 ほこうしゃてんごく n4 car-free street (a street closed to cars on set days) @town %place
コーナー n4 corner; a segment (of a show) @tech
提案する ていあんする vs4 propose, suggest; a proposal %vt
げた n4 geta, wooden sandals (下駄) #足 @clothes
銭湯 せんとう n4 public bathhouse #軒 @town %place
つばき n4 camellia (椿; つばきのあぶら: camellia hair oil) @nature
床屋 とこや n3 barber, barbershop #軒 @town,people %place
クイズ n2 quiz @hobby
ごま n3 sesame (胡麻) @food
めい n3 niece (姪) #人 @family,people
寒がり さむがり n4 someone who feels the cold @people
話しかける はなしかける vi3 talk to, speak to
仕掛ける しかける vi4 set (a trap); start %vt
順番 じゅんばん n3 turn, order
巡礼 じゅんれい n4 pilgrimage
サイズ n3 size
立てる たてる vi2 stand (something) up; make (a plan) %vt
あいづち n4 little words that show you're listening (うん, へえ, なるほど)
多め おおめ n4 a bit more (than usual)
少なめ すくなめ n4 a bit less (than usual)
二十日 はつか n3 the twentieth (of a month); twenty days @time %tni
中#chu ちゅう n3 during, in the middle of (準備中, 仕事中, 電話中) @time
// (Chapter 5's first lines: the city, its people, and the words of the register lessons)
メリディアナ name3 Meridiana (the city of Chapter 5) @place
ヘレン name3 Helen (Meridiana) @people
マーティン name3 Martin (Meridiana) @people
オリー name3 Olly (Meridiana) @people
事務室 じむしつ n3 office (at a school, a station) @work %place
ねえ int2 hey, say (casual)
アナウンス n3 announcement @tech
// ---- the people of the radio kit, the serial and the paper (names: a name is read as one, not as 北 + 村 or 水 + の)
ダイキチ name3 Daikichi (the quiz show's host) @people
マロ name3 Maro (a little white dog) @animal
キウイ name3 Kiwi (a parrot) @animal
ゴマ name3 Goma (a hen) @animal
タロウ name3 Tarō (a dog) @animal
イツキ name3 Itsuki (a boy, 8) @people
カエデ name3 Kaede (a girl, 9) @people
トモキ name3 Tomoki (a boy, 12) @people
ナオ name3 Nao (a girl, 11) @people
アユミ name3 Ayumi (a caller on the advice line) @people
ジュン name3 Jun (a caller on the advice line) @people
リナ name3 Rina (a caller on the advice line) @people
コタロウ name3 Kotarō (Fudeko's grandson, 10) @people
アカネ name3 Akane (a schoolgirl, 11) @people
ハツ name3 Hatsu (a letter writer, 82) @people
ヨネ name3 Yone (the columnist) @people
ユウナ name3 Yūna (a girl, 5) @people
ミナミ name3 Minami (a girl, 12) @people
北村 きたむら name3 Kitamura (a pet owner, Alba) @people
西川 にしかわ name3 Nishikawa (a pet owner, Molinar) @people
早苗 さなえ name3 Sanae (the mail carrier) @people
大吾 だいご name3 Daigo (the carpenter, Molinar) @people
汐里 しおり name3 Shiori (the fisher, Remanso) @people
吉川 よしかわ name3 Yoshikawa (a caller, Molinar) @people
谷口 たにぐち name3 Taniguchi (an organizer) @people
木下 きのした name3 Kinoshita (a teacher, an organizer) @people
大森 おおもり name3 Ōmori (an organizer) @people
内田 うちだ name3 Uchida (a caller in the debate) @people
前田 まえだ name3 Maeda (a caller in the debate) @people
平野 ひらの name3 Hirano (a caller in the debate) @people
坂本 さかもと name3 Sakamoto (a caller in the debate) @people
菊江 きくえ name3 Kikue (a guest on the memories show, 87) @people
徳三 とくぞう name3 Tokuzō (a guest on the memories show, 92) @people
筆子 ふでこ name3 Fudeko (the serial's detective) @people
花井 はない name3 Hanai (the florist) @people
湯川 ゆかわ name3 Yukawa (the bathhouse keeper) @people
山中 やまなか name3 Yamanaka (the barber) @people
水野 みずの name3 Mizuno (the paper's reporter) @people
美里 みさと name3 Misato (the paper's reporter) @people
星野 ほしの name3 Hoshino (a retired teacher) @people
村上 むらかみ name3 Murakami (a letter writer) @people
岡本 おかもと name3 Okamoto (the columnist) @people
丸山 まるやま name3 Maruyama (the origami teacher) @people
島田 しまだ name3 Shimada (the vegetable seller) @people
栄吉 えいきち name3 Eikichi (a man, 90) @people
浦島太郎 うらしまたろう name3 Urashima Tarō (the folk tale) @story
`);
  // @@ (more word chunks go above this line)
})();
