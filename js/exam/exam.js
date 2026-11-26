'use strict';
// EXAM: language tests (DESIGN.md 21.2; EX1). Part A, the Academy's level exams, and the engine the exam hall (C) and the tests
// hidden in the world (D) build on.
//   • The Academy of Alba (academy.js, house 8 on the west street) holds a level exam for A1, A2, B1 and B2. When your overall
//     level (DICT.bands().overall) reaches one you haven't passed, a letter comes from the Academy; the exam stays open after
//     that, and the next one up is always open. Nothing ever blocks the story.
//   • Four parts, each out of 25 whatever its length: Listening (clips through SPEECH, two plays each), Reading, Writing (one
//     or two tasks with three points each) and Speaking (a typed talk with the examiner, graded with TALK.judge). A pass is 60
//     of 100 with no part under 10. You can stop between parts; a certificate needs all four parts of one attempt.
//   • Each part logs into DICT.log: 'listen' (or 'read' with no voice), 'read', 'write' (new), 'talk', at the exam's band.
//   • The results: a certificate (on the level page: METER.sections), a cheer, a title and a cosmetic for Mimo on the first pass,
//     and "What to practice": missed words into the flashcards, grammar slips with where to practice them.
// The API (C and D build on it):
//   EXAM.add(lang, { tasks, slots, pics, lines, letter, examiner, idk })   a language's content (content_<lang>.js)
//   EXAM.paper(def) · EXAM.run(paper | id | { band }, o) → Promise<attempt>   a paper: { id, lang, band, kind, title,
//        sections: [{ id, part, skill, title, max, min, time, tasks: [ids] | slots: [...] }], pass: { total, each } | fn(att) }
//   EXAM.level(band) → the level exam's paper (a fresh draw of tasks) · EXAM.start(band) / EXAM.resume(band) (the Academy's menu)
//   EXAM.single(task | id, { band, skill, title }) → Promise<attempt>   one task anywhere, logged like the exam's (D: the radio
//        quiz, pen pals…; EXAM.task1 is the same) · EXAM.task(id, lang) / EXAM.tasksOf(lang, band, part, slot) look tasks up
//   EXAM.grade.item(item, answer) · .write(text, task, band) · .turn(text, turn, band) · .short(text, want)   the graders, as plain functions
//   EXAM.type(name, { score, resolve })   a new item type (C: a real exam's own shapes); its view goes in EXAMUI.TYPES[name]
//   EXAM.letter(def) · EXAM.state · EXAM.certs() · EXAM.open(band) · EXAM.attempts(filter) · EXAM.init(game) · EXAM.update(dt, t, you)
// State: G.state.exam (saved with the game). Tests: EXAM._.tests(lang) · EXAM._.check(lang) · EXAM._.t (driving the panel).

const EXAM = (() => {
  let G = null;
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = l => { l = l || L(); return l === 'zh' || l === 'ja'; };
  const BANDS = ['A0', 'A1', 'A2', 'B1', 'B2'];
  const PARTS = ['listen', 'read', 'write', 'speak'];
  const PART = {
    listen: { skill: 'listen', en: 'Listening', icon: '🎧' },
    read: { skill: 'read', en: 'Reading', icon: '📖' },
    write: { skill: 'write', en: 'Writing', icon: '✍️' },
    speak: { skill: 'talk', en: 'Speaking', icon: '💬' },
  };
  const MAX = 25, PASS = 60, EACH = 10;
  const LANGNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[’']/g, "'");
  const arr = x => (x == null ? [] : Array.isArray(x) ? x : [x]);
  const round = (v, step = 0.5) => Math.round(v / step) * step;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ------------------------------------------------------------ the level exams: what each band's paper is made of
  // Each part's list is its slots: one task (one turn, in Speaking) of that slot is drawn from the band's pool per attempt.
  // Every part is out of 25 whatever its length.
  const LEVEL = {
    1: { listen: ['voicemail', 'announce', 'dialogue'], read: ['sign', 'message', 'ad'], write: ['message'], speak: ['intro', 'likes', 'picture', 'day'] },
    2: { listen: ['voicemail', 'weather', 'dialogue'], read: ['email', 'ad', 'article'], write: ['note', 'email'], speak: ['intro', 'picture', 'past', 'plans', 'prefer'] },
    3: { listen: ['interview', 'story'], read: ['article', 'forum'], write: ['email', 'forum'], speak: ['picture', 'story', 'opinion', 'compare', 'problem'] },
    4: { listen: ['debate', 'report'], read: ['article', 'review'], write: ['formal', 'essay'], speak: ['picture', 'hypo', 'argue', 'counter', 'abstract'] },
  };
  // the speaking turn's points by grade (TALK.judge); not understood twice is 0
  const TURN_PTS = { S: 5, A: 4.25, B: 3.5, C: 2.5, D: 1 };
  const WRITE_MAX = 12.5, TURN_MAX = 5;
  // first passes: a title, a cosmetic for Mimo (TALK.cosmetic; switch it on or off on the journal's People page), coins
  const REWARD = {
    1: { title: 'First Words', cos: 'exam.a1', cosName: 'the Academy’s A1 rosette', coins: 20 },
    2: { title: 'Everyday Speaker', cos: 'exam.a2', cosName: 'the Academy’s A2 scarf', coins: 30 },
    3: { title: 'Independent Speaker', cos: 'exam.b1', cosName: 'the Academy’s B1 quill', coins: 40 },
    4: { title: 'Fluent Speaker', cos: 'exam.b2', cosName: 'the Academy’s B2 laurel', coins: 50 },
  };

  // ------------------------------------------------------------ content (content_<lang>.js: EXAM.add)
  const C = {};
  const fresh = () => ({ tasks: new Map(), slots: {}, pics: {}, lines: {}, letter: {}, examiner: {}, academy: {}, idk: [], practice: {} });
  function add(lang, def = {}) {
    const c = C[lang] || (C[lang] = fresh());
    for (const t of arr(def.tasks)) if (t && t.id) { t.lang = lang; c.tasks.set(t.id, t); }
    for (const k of ['slots', 'pics', 'lines', 'letter', 'examiner', 'academy', 'practice']) if (def[k]) Object.assign(c[k], def[k]);
    if (def.idk) c.idk = c.idk.concat(def.idk);
    if (isC(lang) && typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(def); } catch (e) { /* (the IME learns them later) */ } }
    return c;
  }
  const content = (l = L()) => C[l] || null;
  const ready = (l = L()) => { try { return !!(C[l] && C[l].tasks.size && typeof DICT !== 'undefined' && DICT.ready(l)); } catch (e) { return false; } };
  const task = (id, l) => { for (const lg of l ? [l] : Object.keys(C)) { const t = C[lg] && C[lg].tasks.get(id); if (t) return t; } return null; };
  const tasksOf = (l, band, part, slot) => [...((C[l] && C[l].tasks.values()) || [])].filter(t => t.band === band && t.part === part && (!slot || t.slot === slot));
  // a line in the content: [text, english] or { t, en } → { t, en }
  const lineOf = x => (!x ? null : Array.isArray(x) ? { t: x[0], en: x[1] || '' } : typeof x === 'string' ? { t: x, en: '' } : { t: x.t != null ? x.t : x.text, en: x.en || '' });
  const linesOf = x => (!x || (Array.isArray(x) && !x.length) ? [] : Array.isArray(x) && (Array.isArray(x[0]) || (x[0] && typeof x[0] === 'object')) ? x.map(lineOf) : [lineOf(x)]);
  // a named line of the examiner's (lines.hello, lines.ack…): one at random, or the n-th
  function says(key, n, l = L()) {
    const c = content(l), v = c && c.lines && c.lines[key]; if (!v) return null;
    const list = linesOf(v);
    return list[n == null ? Math.floor(Math.random() * list.length) : Math.min(n, list.length - 1)] || null;
  }

  // ------------------------------------------------------------ chance, seeded (an attempt draws the same paper after a reload)
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = s => [...String(s)].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);
  function shuffle(list, R) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ------------------------------------------------------------ slots: the words a task draws per attempt (A1–A2 templates)
  // task.vars: { day: 'day', time: 'hour' } (name → a bank of content.slots). In a line, {day} is the value's text, {day.at} one of
  // its forms ('en la panadería'), and in the English {day} is its English. {day~} is another value from the same bank (a false
  // statement, a distractor said in the clip). A value: { t, en, opt (as an option), ans (short answers), num, icon, word }.
  function varsFor(t, att) {
    const out = {}; if (!t.vars) return out;
    const c = content(t.lang), R = rng(hash(t.id) ^ (att ? att.seed : 1)), used = {};
    for (const [name, bank] of Object.entries(t.vars)) {
      const list = (c && c.slots[bank]) || [];
      if (!list.length) continue;
      const taken = used[bank] || (used[bank] = new Set());
      let i = Math.floor(R() * list.length), guard = 0;
      while (taken.has(i) && guard++ < 40) i = Math.floor(R() * list.length);
      taken.add(i);
      out[name] = { bank, i, v: list[i] };
      // the other value ({name~}): any other one in the bank
      let j = Math.floor(R() * list.length); guard = 0;
      while ((j === i || taken.has(j)) && guard++ < 40) j = Math.floor(R() * list.length);
      out[name + '~'] = { bank, i: j, v: list[j] };
    }
    return out;
  }
  function fillVars(s, V, en) {
    if (s == null) return '';
    return String(s).replace(/\{([a-zA-Z0-9_]+~?)(?:\.([a-zA-Z]+))?\}/g, (m, name, field) => {
      const x = V[name]; if (!x || !x.v) return m;
      const v = x.v;
      if (en) return String((field && v[field + 'En']) || v.en || v.t || '');
      return String(field ? (v[field] != null ? v[field] : v.t) : v.t);
    });
  }

  // ------------------------------------------------------------ a task as one attempt shows it (vars filled, options in order)
  // → { id, part, band, slot, kind, title, intro, voices, lines: [{ who, text, en }], text: [{ t, en }], items: [rItem], … }
  // rItem: { k (index), type, ask: { t, en }, opts: [{ t, en, icon }], key (index | true | false | 'n' | [order] | [pairs]), want,
  //          model, pts, words (the key words, for "What to practice") }
  function resolve(t, att) {
    if (!t) return null;
    const V = varsFor(t, att), R = rng(hash(t.id + '#o') ^ (att ? att.seed : 3));
    const L1 = x => { const l = lineOf(x); return l ? { t: fillVars(l.t, V), en: fillVars(l.en, V, true) } : null; };
    const out = Object.assign({}, t, { V, title: L1(t.title), intro: L1(t.intro) });
    if (t.lines) out.lines = t.lines.map(l => ({ who: l.who, text: fillVars(l.text != null ? l.text : l.t, V), en: fillVars(l.en, V, true) }));
    if (t.text) out.text = linesOf(t.text).map(l => ({ t: fillVars(l.t, V), en: fillVars(l.en, V, true) }));
    // (C: several recordings in one task, each with its own plays (DELE's five short dialogues), and several short texts (notices, ads))
    const LS = x => linesOf(x || []).map(l => ({ t: fillVars(l.t, V), en: fillVars(l.en, V, true) }));
    if (t.clips) out.clips = t.clips.map(c => ({ label: L1(c.label), lines: (c.lines || []).map(l => ({ who: l.who, text: fillVars(l.text != null ? l.text : l.t, V), en: fillVars(l.en, V, true) })) }));
    if (t.blocks) out.blocks = t.blocks.map(b => ({ label: L1(b.label), kind: b.kind || '', head: LS(b.head), text: LS(b.text) }));
    if (t.prompt) out.prompt = linesOf(t.prompt).map(l => ({ t: fillVars(l.t, V), en: fillVars(l.en, V, true) }));
    if (t.points) out.points = t.points.map(p => Object.assign({}, p, { t: L1(p.t) }));
    if (t.ask) out.ask = linesOf(t.ask).map(l => ({ t: fillVars(l.t, V), en: fillVars(l.en, V, true) }));
    if (t.simpler) out.simpler = L1(t.simpler);
    if (t.model) out.model = Array.isArray(t.model) ? L1(t.model) : { t: fillVars(t.model, V), en: '' };
    if (t.items) out.items = t.items.map((it, k) => resolveItem(it, k, V, R, t));
    return out;
  }
  const optOf = v => ({ t: v.opt != null ? v.opt : v.t, en: v.en || '', icon: v.icon || '' });
  function resolveItem(it, k, V, R, t) {
    const L1 = x => { const l = lineOf(x); return l ? { t: fillVars(l.t, V), en: fillVars(l.en, V, true) } : null; };
    const o = { k, type: it.type, ask: L1(it.ask), pts: it.pts || (it.type === 'match' ? (it.pairs || []).length : 1), words: arr(it.words).slice(), raw: it };
    if (it.type === 'mc' || it.type === 'gap') {
      let opts, key;
      if (it.var && V[it.var]) {
        const x = V[it.var], list = (content(t.lang).slots[x.bank] || []);
        const others = shuffle(list.map((v, i) => i).filter(i => i !== x.i), R).slice(0, (it.n || 3) - 1);
        const idx = shuffle([x.i].concat(others), R);
        opts = idx.map(i => optOf(list[i])); key = idx.indexOf(x.i);
        if (x.v.word || x.v.ans) o.words.push(x.v.word || arr(x.v.ans)[0]);
      } else {
        const base = (it.opts || []).map(L1), order = shuffle(base.map((_, i) => i), R);
        opts = order.map(i => Object.assign({ icon: (it.icons || [])[i] || '' }, base[i])); key = order.indexOf(it.key || 0);
      }
      Object.assign(o, { opts, key });
      if (it.type === 'gap') o.text = L1(it.text);
    } else if (it.type === 'tf' || it.type === 'tfn') {
      o.key = it.key;
    } else if (it.type === 'short') {
      let want = it.want ? Object.assign({}, it.want) : { any: true };
      if (it.var && V[it.var]) {
        const v = V[it.var].v;
        want = v.num != null ? { number: v.num, numberWords: arr(v.ans) } : { lemmas: arr(v.ans || v.word || v.t) };
        o.model = String(v.model || v.t || arr(v.ans)[0]);
        if (v.word || v.ans) o.words.push(v.word || arr(v.ans)[0]);
      } else o.model = it.model ? fillVars(Array.isArray(it.model) ? it.model[0] : it.model, V) : '';
      o.want = want;
    } else if (it.type === 'match' && it.letters) {
      // (C: matching to labels the text already shows: ads A–J, three people, "nobody"; pairs are [left line, label index]; no shuffle)
      Object.assign(o, { left: (it.pairs || []).map(p => L1(p[0])), opts: arr(it.labels).map(L1), key: (it.pairs || []).map(p => p[1]) });
    } else if (it.type === 'match') {
      const left = (it.pairs || []).map(p => L1(p[0])), right = (it.pairs || []).map(p => L1(p[1]));
      const extra = arr(it.extra).map(L1), all = right.concat(extra), order = shuffle(all.map((_, i) => i), R);
      Object.assign(o, { left, opts: order.map(i => all[i]), key: left.map((_, i) => order.indexOf(i)) });
    } else if (it.type === 'order') {
      const parts = (it.parts || []).map(L1), order = shuffle(parts.map((_, i) => i), R);
      Object.assign(o, { opts: order.map(i => parts[i]), key: parts.map((_, i) => order.indexOf(i)) });
    } else if (TYPES[it.type] && TYPES[it.type].resolve) Object.assign(o, TYPES[it.type].resolve(it, V, R, t) || {});
    return o;
  }
  // ------------------------------------------------------------ the graders
  // An item: an answer → 0..1. mc / gap: the option's index · tf: true | false · tfn: true | false | 'n' · short: the text (its content
  // only, READ's content check: accents and case don't matter) · match: [the option picked for each left item] · order: [indices]
  const TYPES = {
    mc: { score: (it, a) => (a === it.key ? 1 : 0) },
    gap: { score: (it, a) => (a === it.key ? 1 : 0) },
    tf: { score: (it, a) => (a === it.key ? 1 : 0) },
    tfn: { score: (it, a) => (a === it.key ? 1 : 0) },
    short: { score: (it, a, l) => shortOK(a, it.want, l) ? 1 : 0 },
    match: { score: (it, a) => { const k = it.key || []; if (!Array.isArray(a) || !k.length) return 0; return k.filter((x, i) => a[i] === x).length / k.length; } },
    order: { score: (it, a) => { const k = it.key || []; if (!Array.isArray(a) || a.length !== k.length) return 0; return k.every((x, i) => a[i] === x) ? 1 : 0; } },
  };
  function type(name, def) { TYPES[name] = Object.assign(TYPES[name] || {}, def); return TYPES[name]; }
  function scoreItem(it, a, l = L()) {
    if (a == null || a === '') return 0;
    const T = TYPES[it.type]; if (!T || !T.score) return 0;
    try { return clamp(+T.score(it, a, l) || 0, 0, 1); } catch (e) { console.error('[exam] item', e); return 0; }
  }
  // "I don't know", in any of the five and in English (an answer that's only that is never an answer)
  const IDK = { es: ['no sé', 'no se', 'no lo sé', 'no lo se', 'ni idea', 'no entiendo', 'no comprendo', 'no tengo idea'], pt: ['não sei', 'nao sei', 'sei lá', 'sei la', 'não entendi', 'nao entendi', 'não entendo', 'nao entendo', 'nem ideia', 'não faço ideia'],
    de: ['ich weiß es nicht', 'ich weiss es nicht', 'weiß nicht', 'weiss nicht', 'keine ahnung', 'ich verstehe nicht', 'verstehe nicht', 'versteh ich nicht'], zh: ['我不知道', '不知道', '不懂', '不明白', '听不懂', '不清楚', 'bu zhi dao', 'buzhidao', 'bu zhidao', 'bu dong', 'budong', 'bu ming bai', 'bu mingbai', 'bumingbai', 'ting bu dong', 'tingbudong', 'bu qing chu', 'bu qingchu'],
    ja: ['わかりませんでした', 'わかりません', 'わからない', 'わかんない', '分かりません', '分からない', '知りません', 'しりません', '知らない', 'wakarimasendeshita', 'wakarimasen', 'wakaranai', 'wakannai', 'shirimasen', 'shiranai'], en: ["i don't know", 'i dont know', 'idk', 'no idea', 'dunno', 'i do not know', 'not sure'] };
  // (zh / ja fillers around it: «嗯», «对不起», «ちょっと», «すみません», and 我 / wo left over from «wo bu zhi dao»)
  const FILL_CJ = ['嗯', '呃', '啊', '哎', '那个', '对不起', '抱歉', '我', 'ちょっと', 'すみません', 'ごめんなさい', 'ごめん', 'ええと', 'えっと', 'あの', 'うーん', 'ええ', 'en', 'nage', 'duibuqi', 'baoqian', 'wo', 'chotto', 'sumimasen', 'gomen', 'gomennasai', 'eto', 'etto', 'ano', 'un', 'ee'].map(nrm);
  function idkOnly(text, l = L()) {
    let t = ' ' + nrm(text) + ' ';
    const list = IDK[l] || [], extra = (content(l) && content(l).idk) || [];
    for (const p of list.concat(extra, IDK.en).sort((a, b) => b.length - a.length)) t = t.split(nrm(p)).join(' ');
    t = t.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    if (!t) return true;
    const left = t.split(' ').filter(w => w.length > 1 || /[぀-ヿ㐀-鿿]/.test(w));
    // (what's left is only fillers: «pues», «eh», «hmm», «sorry»)
    return left.every(w => /^(eh+|em+|um+|hm+|mm+|ah+|oh+|pues|bueno|also|naja|na|ja|si|sim|no|nao|nein|sorry|perdon|desculpa|entschuldigung|y|e|und|o|ou|oder)$/.test(w) || FILL_CJ.includes(w));
  }
  function shortOK(a, want, l = L()) {
    const text = String(a == null ? '' : a).trim();
    if (!text || idkOnly(text, l)) return false;
    try { return !!READ._.contentCheck(text, want || { any: true }, l).ok; } catch (e) { console.error('[exam] short', e); return false; }
  }
  // the words of an analysis that count (not punctuation)
  const wordsOf = a => ((a && a.words) || []).filter(w => w && !w.punct);
  // a want in content files may name a picture's things: lemmas: '@pic' → the language's words for the picture
  function resolveWant(want, turn, l = L()) {
    const w = Object.assign({}, want || {});
    const pic = turn && (turn.pic || (turn.card && turn.card.pic));          // (C: a speaking card's picture counts too)
    if (w.lemmas === '@pic' && pic) { const c = content(l); w.lemmas = ((c && c.pics[pic]) || []).slice(); if (!w.need) w.need = 2; }
    return w;
  }
  // one spoken turn → { understood, s (0..5), grade, r }
  function gradeTurn(text, turn, band, l = L()) {
    const raw = String(text == null ? '' : text).trim();
    if (!raw) return { understood: false, s: 0, empty: true };
    if (idkOnly(raw, l)) return { understood: false, s: 0, idk: true };
    let r = null;
    try { r = TALK.judge(raw, resolveWant(turn.want, turn, l), { band, bridge: false, help: 0, lang: l, focus: turn.focus, tips: turn.tips }); } catch (e) { console.error('[exam] turn', e); }
    if (!r || r.noPack || !r.understood) return { understood: false, s: 0, r };
    const grade = r.grade && TURN_PTS[r.grade] != null ? r.grade : 'C';
    return { understood: true, grade, s: TURN_PTS[grade], r, fixed: fixedOnly(raw, r.a, (r.errors || []).filter(e => !e.want)) };
  }
  // sentences, for checking a writing task's points one by one
  function sentencesOf(text) {
    return String(text || '').replace(/\r/g, '').split(/\n+|(?<=[.!?。！？…])\s*/u).map(s => s.trim()).filter(s => /[\p{L}\p{N}]/u.test(s));
  }
  // one writing task → { score (0..12.5), points: [bool], acc, range, len, words, errors, fixed, tips, zero }
  //   the points (6): each of the three (task.points[].want, TALK's want keys) said in a sentence, or across two in a row
  //   accuracy (0–4): DICT.check's real mistakes per 10 words (a minor one counts half; an accent slip is free)
  //   range (0–1.5): a connector that isn't «and», a sentence with two clauses, a word above the exam's level
  //   length (0–1): within the task's words (zh / ja: the dictionary's words)
  //   Accuracy and range count in proportion to the points made (at least a quarter): a perfect text about something else fails.
  // C: a form (DELE A1 / Goethe A1 writing, part 1): one field per line of the answer, each checked for its kind of content
  // (a name, a number, a date, an email, some words, or a want through READ's check) → a writing grade (a point per field)
  const FIELD = { name: v => /^[\p{L}][\p{L}'’. -]*$/u.test(v) && v.length >= 2, number: v => /\d/.test(v), date: v => /\d/.test(v) || /\p{L}{3,}/u.test(v),
    email: v => /\S+@\S+\.\S+/.test(v), text: v => /[\p{L}\p{N}]/u.test(v) };
  function gradeForm(text, t, band, l = L()) {
    const vals = String(text == null ? '' : text).split('\n').map(v => v.trim()), F = t.form || [];
    const out = { score: 0, max: WRITE_MAX, points: [], acc: 4, range: 0, len: 1, words: 0, errors: [], fixed: String(text || ''), tips: [], zero: '', form: true };
    F.forEach((f, i) => { const v = vals[i] || ''; const ok = !!v && !idkOnly(v, l) && (f.want ? shortOK(v, f.want, l) : (FIELD[f.kind || 'text'] || FIELD.text)(v)); out.points.push(ok); });
    out.words = vals.filter(Boolean).length;
    if (!out.words) { out.zero = 'empty'; out.acc = 0; out.len = 0; return out; }
    out.score = round(WRITE_MAX * out.points.filter(Boolean).length / Math.max(1, F.length), 0.5);
    return out;
  }
  function gradeWrite(text, t, band, l = L()) {
    if (t && t.form) return gradeForm(text, t, band, l);
    const raw = String(text == null ? '' : text).trim(), P = (t.points || []).length || 3;
    const out = { score: 0, max: WRITE_MAX, points: [], acc: 0, range: 0, len: 0, words: 0, errors: [], fixed: raw, tips: [], zero: '' };
    if (!raw) { out.zero = 'empty'; return out; }
    let a = null; try { a = DICT.analyze(raw); } catch (e) { a = null; }
    const ws = wordsOf(a); out.words = ws.length;
    if (idkOnly(raw, l)) { out.zero = 'idk'; return out; }
    if (ws.length < Math.ceil((t.min || 10) / 3)) { out.zero = 'short'; return out; }
    const known = ws.filter(w => !w.unknown || w.name || w.pos === 'name' || /^\d+$/.test(w.t)).length;
    if (known / Math.max(1, ws.length) < 0.5) { out.zero = 'notlang'; return out; }
    const ss = sentencesOf(raw), chunks = ss.concat(ss.slice(1).map((s, i) => ss[i] + ' ' + s));
    for (const p of t.points || []) {
      const want = resolveWant(p.want, t, l);
      out.points.push(chunks.some(c => { if (idkOnly(c, l)) return false; try { const r = TALK.judge(c, want, { band, bridge: false, accents: false, lang: l }); return !!(r && r.understood && r.met); } catch (e) { return false; } }));
    }
    const met = out.points.filter(Boolean).length, content6 = 6 * met / P;
    let chk = null; try { chk = DICT.check(raw, { player: true }); } catch (e) { chk = null; }
    const errs = chk ? chk.errors || [] : [];
    const major = errs.filter(e => e.sev === 'major' && !e.free).length, minor = errs.filter(e => e.sev !== 'major' && !e.free).length;
    const rate = (major + minor * 0.5) / Math.max(1, ws.length) * 10;
    out.acc = rate === 0 ? 4 : rate <= 0.5 ? 3.5 : rate <= 1 ? 3 : rate <= 1.6 ? 2 : rate <= 2.5 ? 1 : 0;
    const A = (chk && chk.a) || a || {}, weak = ((TALK.LT && TALK.LT[l] && TALK.LT[l].weak) || []).map(nrm);
    const conn = (A.connectors || []).some(c => !weak.includes(nrm(c)));
    const clauses = ss.some(s => { try { const x = DICT.analyze(s); return (x.clauses || 0) >= 2 || (x.verbs || []).length >= 2; } catch (e) { return false; } });
    const above = wordsOf(A).some(w => !w.unknown && ['n', 'v', 'adj', 'adv'].includes(w.pos) && (w.band || 0) > band);
    out.range = (conn ? 0.5 : 0) + (clauses ? 0.5 : 0) + (above ? 0.5 : 0);
    const n = ws.length, lo = t.min || 10, hi = t.max || lo * 3;
    out.len = n >= lo && n <= hi * 1.5 ? 1 : n >= lo * 0.75 ? 0.5 : 0;
    out.score = round(content6 + (out.acc + out.range) * Math.max(0.25, met / P) + out.len, 0.25);
    out.errors = errs; out.tips = [...new Set(errs.filter(e => !e.free).map(e => e.tip).filter(Boolean))];
    // (your text said right with the real mistakes fixed; a free accent tip, or a name the pack doesn't know, never rewrites it)
    out.fixed = fixedOnly(raw, A, errs);
    return out;
  }
  function fixedOnly(raw, a, errs) {
    const real = (errs || []).filter(e => !e.free);
    if (!real.length) return raw;
    try { const p = DICT.pack(); if (p && typeof p.fix === 'function') return p.fix(a, real) || raw; } catch (e) { /* */ }
    return raw;
  }
  // ------------------------------------------------------------ the save: G.state.exam
  // { v, n (attempts so far), invited: { band: t }, letters: { band: t }, pending (a letter waiting to be shown), visited,
  //   attempts: [att] (the last ones), cur: { band: attId } (an attempt you've paused), certs: { band: cert }, seen: { taskId: n },
  //   cards: [{ id, lang, t, en, g, icon }] (exam words in the flashcards), got: { band: true } (first-pass rewards) }
  const MEM = {};
  function S() {
    const st = G && G.state; const o = st ? (st.exam || (st.exam = {})) : MEM;
    o.v = 1; o.n = o.n || 0; o.invited = o.invited || {}; o.letters = o.letters || {}; o.attempts = o.attempts || []; o.cur = o.cur || {};
    o.certs = o.certs || {}; o.seen = o.seen || {}; o.cards = o.cards || []; o.got = o.got || {};
    return o;
  }
  const save = () => { if (G && G.save) try { G.save(); } catch (e) { /* */ } };
  const passed = b => !!S().certs[b];
  // the levels you may sit: every one you've been invited to, and the one after the highest you've passed
  function open(b) {
    const s = S(); if (b < 1 || b > 4) return false;
    const top = Math.max(0, ...Object.keys(s.certs).map(Number));
    return !!s.invited[b] || b <= top + 1;
  }
  const attById = id => S().attempts.find(a => a.id === id) || null;
  function attempts(f) { const s = S(); return s.attempts.filter(a => !f || Object.entries(f).every(([k, v]) => a[k] === v)); }

  // ------------------------------------------------------------ papers (C: EXAM.paper) and the level exam's draw
  const PAPERS = {};
  function paper(def) { if (def && def.id) PAPERS[def.id] = Object.assign({ kind: 'mock', pass: { total: PASS, each: EACH } }, def); return PAPERS[def.id]; }
  // draw the level exam: per slot, the task you've seen least (then by chance); speaking: one turn per slot
  function level(band, l = L()) {
    const T = LEVEL[band]; if (!T) return null;
    const s = S(), R = rng(hash(l + band + ':' + s.n) ^ (Date.now() & 0xffff));
    const pick = (part, slot) => {
      const pool = tasksOf(l, band, part, slot); if (!pool.length) return null;
      const lo = Math.min(...pool.map(t => s.seen[t.id] || 0)), least = pool.filter(t => (s.seen[t.id] || 0) === lo);
      return least[Math.floor(R() * least.length)].id;
    };
    const sections = PARTS.map(p => ({ id: p, part: p, skill: PART[p].skill, title: { en: PART[p].en }, max: MAX, min: EACH, tasks: T[p].map(sl => pick(p, sl)).filter(Boolean) }));
    return { id: 'level.' + band, kind: 'level', lang: l, band, title: { en: `${BANDS[band]} level exam` }, sections, pass: { total: PASS, each: EACH } };
  }
  // a new attempt at a paper (its tasks fixed now, so a pause and a reload give back the same paper)
  function newAttempt(p) {
    const s = S(); s.n++;
    const att = { id: 'x' + s.n + '.' + Date.now().toString(36), n: s.n, lang: p.lang || L(), band: p.band, kind: p.kind || 'level', paper: p.id, title: p.title,
      seed: (hash(p.id) ^ (Date.now() & 0x7fffffff)) >>> 0, at: Date.now(), sections: p.sections.map(x => Object.assign({}, x, { tasks: (x.tasks || []).slice() })),
      pass: p.pass, res: {}, done: false, total: 0, passedIt: false, missed: [], grammar: [] };
    // (C: a practice paper in a real format keeps its format, level, timing and whether it's one section on its own)
    if (p.format) Object.assign(att, { format: p.format, level: p.level, key: p.key, timed: !!p.timed, drill: p.drill || null });
    for (const sec of att.sections) for (const id of sec.tasks) s.seen[id] = s.n;
    s.attempts.push(att);
    // (the last 10 are kept, and always a paused one and the ones behind a certificate: its review)
    const keep = new Set(Object.values(s.cur).concat(Object.values(s.certs).map(c => c.att), Object.values(s.curMock || {}), [att.id]));
    while (s.attempts.length > 10) { const i = s.attempts.findIndex(a => !keep.has(a.id)); if (i < 0) break; s.attempts.splice(i, 1); }
    if (att.kind === 'level') s.cur[att.band] = att.id;
    else if (att.kind === 'mock') (s.curMock || (s.curMock = {}))[att.paper] = att.id;
    return att;
  }
  // a part's score out of its max (25), from its results
  function sectionScore(sec, res) {
    if (!res) return 0;
    const max = sec.max || MAX;
    // (one result per task or turn: a repeat never counts twice)
    const once = (list, key) => { const seen = new Set(); return (list || []).filter(x => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; }); };
    const step = sec.step || 0.5;
    // (a choice of two writing tasks counts once; HSK's 书写 is a writing part made of items)
    if (sec.part === 'write' && sec.kind !== 'items') { const ts = once(res.tasks, x => x.slotOf || x.id); return clamp(round(max * ts.reduce((a, x) => a + (x.score || 0), 0) / (WRITE_MAX * Math.max(1, sec.tasks.length)), step), 0, max); }
    if (sec.part === 'speak') { const ts = once(res.turns, x => x.id); return clamp(round(max * ts.reduce((a, x) => a + (x.s || 0), 0) / (TURN_MAX * Math.max(1, sec.tasks.length)), step), 0, max); }
    const it = once(res.items, x => (x.task || '') + '#' + x.k), pts = it.reduce((a, x) => a + (x.pts || 1), 0);
    // (a timed part handed in at 0 counts the items it never reached as blank: the whole paper's points are the denominator)
    const all = Math.max(pts, res.ptsAll || 0);
    return clamp(round(max * it.reduce((a, x) => a + (x.s || 0) * (x.pts || 1), 0) / Math.max(1, all), step), 0, max);
  }
  // a part is finished: score it, log it (DICT.log at the band), note the words met, save
  function finishSection(att, secId, res) {
    const sec = att.sections.find(x => x.id === secId); if (!sec) return null;
    res.score = sectionScore(sec, res); res.done = true; res.at = Date.now();
    att.res[secId] = res;
    const band = att.band || 1;
    try {
      if (sec.part === 'listen' || sec.part === 'read' || sec.kind === 'items') {
        const skill = sec.kind === 'items' && sec.part === 'write' ? 'write' : sec.part === 'read' || res.mode === 'read' ? 'read' : 'listen';
        for (const x of res.items || []) DICT.log(skill, band, x.s || 0);
        for (const txt of res.texts || []) { try { DICT.metAll(DICT.analyze(isC(att.lang) && typeof CJK !== 'undefined' ? CJK.chars(txt, { lang: att.lang }) : txt), skill === 'listen' ? 'heard' : 'read'); } catch (e) { /* */ } }
      } else if (sec.part === 'write') {
        // (a task with three points counts as three results; a part of one task (A1) as five, so one exam can show the band)
        const n = Math.max(3, Math.ceil(6 / Math.max(1, sec.tasks.length)));
        for (const x of res.tasks || []) DICT.log('write', band, (x.score || 0) / WRITE_MAX, n);
      } else if (sec.part === 'speak') {
        for (const x of res.turns || []) DICT.log('talk', band, (x.s || 0) / TURN_MAX);
        DICT.log('talk', band, (res.score || 0) / (sec.max || MAX));          // (and the examiner's mark for the whole talk)
      }
    } catch (e) { console.error('[exam] log', e); }
    save();
    return res;
  }
  // the whole attempt: every part done → the total, passed or not, and what to practice
  function finish(att) {
    const sc = {}; let total = 0;
    for (const sec of att.sections) { sc[sec.id] = att.res[sec.id] ? att.res[sec.id].score || 0 : 0; total += sc[sec.id]; }
    att.total = round(total, 0.5); att.scores = sc; att.done = true; att.end = Date.now();
    // (C: a practice paper is scored and passed the way its format is: formats.js)
    if (att.kind === 'mock' && typeof MOCK !== 'undefined') {
      try { MOCK.finish(att); } catch (e) { console.error('[exam] mock', e); }
      practice(att); save(); return att;
    }
    const P = att.pass || { total: PASS, each: EACH };
    if (typeof P === 'function') { const r = P(att) || {}; att.passedIt = !!r.passed; att.why = r.why || ''; }
    else {
      const low = att.sections.filter(sec => sc[sec.id] < (sec.min != null ? sec.min : P.each || 0));
      att.passedIt = att.total >= (P.total || PASS) && !low.length;
      att.why = att.passedIt ? '' : low.length ? low.map(sec => `${(sec.title && sec.title.en) || sec.id} ${fmt(sc[sec.id])}/${sec.max || MAX}`).join(', ') + `: each part needs ${P.each || EACH}` : `${fmt(att.total)}/100: a pass is ${P.total || PASS}`;
    }
    const s = S();
    if (att.kind === 'level') {
      if (s.cur[att.band] === att.id) delete s.cur[att.band];
      practice(att);
      if (att.passedIt) {
        const old = s.certs[att.band];
        if (!old || att.total > old.total) s.certs[att.band] = { band: att.band, total: att.total, scores: sc, at: att.end, att: att.id, title: REWARD[att.band] ? REWARD[att.band].title : '', lang: att.lang, n: (old && old.n || 0) + 1 };
        else old.n = (old.n || 0) + 1;
        if (!s.got[att.band]) { s.got[att.band] = Date.now(); att.reward = reward(att.band); }
      }
    }
    save();
    return att;
  }
  const fmt = v => (Math.round(v * 2) / 2).toString().replace(/\.0$/, '');

  // ------------------------------------------------------------ rewards: a title and a cosmetic for Mimo (talk.js TALK.cosmetic)
  function reward(band) {
    const R = REWARD[band]; if (!R) return null;
    const got = { title: R.title, coins: R.coins, cos: null };
    if (G && G.state) G.state.coins = (G.state.coins || 0) + R.coins;
    try { if (typeof TALK !== 'undefined' && TALK.state && TALK._.COS[R.cos]) { TALK.state.cos[R.cos] = { on: true, from: 'academy' }; got.cos = R.cosName; } } catch (e) { console.error('[exam] reward', e); }
    return got;
  }
  // the cosmetics: paper-craft things on Mimo's rig (actors.js mimo(): body, ears; its front faces +z)
  function cosmetics() {
    if (typeof TALK === 'undefined' || !TALK.cosmetic || typeof TK === 'undefined') return;
    const H = Math.PI / 2;
    const P = (geo, col, pos, sc, o) => TK.part(geo, col, pos, sc, o || { ink: 0.006 });
    TALK.cosmetic('exam.a1', { name: { en: REWARD[1].cosName }, build(M) {
      if (!M || !M.body) return null;
      const g = new THREE.Group(); g.position.set(-0.13, 0.36, 0.29); g.rotation.set(-0.25, -0.35, 0);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(P(TK.G.sphere, i % 2 ? '#3f6fb5' : '#5b8fd6', [Math.cos(a) * 0.045, Math.sin(a) * 0.045, 0], [0.032, 0.032, 0.01])); }
      g.add(P(TK.G.cyl, '#fff3c4', [0, 0, 0.012], [0.035, 0.012, 0.035], { rot: [H, 0, 0], ink: 0.005 }));
      g.add(P(TK.G.box, '#3f6fb5', [-0.022, -0.075, -0.004], [0.026, 0.07, 0.008], { rot: [0, 0, 0.25], ink: 0.004 }));
      g.add(P(TK.G.box, '#c2412f', [0.022, -0.075, -0.004], [0.026, 0.07, 0.008], { rot: [0, 0, -0.25], ink: 0.004 }));
      M.body.add(g); return g;
    } });
    TALK.cosmetic('exam.a2', { name: { en: REWARD[2].cosName }, build(M) {
      if (!M || !M.body) return null;
      const g = new THREE.Group(); g.position.set(0, 0.43, 0);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.038, 8, 28), TK.toon('#8a2f45', { rim: 0.2 })); ring.rotation.x = H; g.add(ring);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(P(TK.G.box, '#e0a020', [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3], [0.03, 0.06, 0.03], { rot: [0, -a, 0], ink: 0 })); }
      g.add(P(TK.G.box, '#8a2f45', [0.14, -0.1, 0.25], [0.07, 0.16, 0.02], { rot: [0.2, 0.3, 0.12], ink: 0.005 }));
      g.add(P(TK.G.box, '#e0a020', [0.152, -0.19, 0.27], [0.07, 0.025, 0.02], { rot: [0.2, 0.3, 0.12], ink: 0.004 }));
      M.body.add(g); return g;
    } });
    TALK.cosmetic('exam.b1', { name: { en: REWARD[3].cosName }, build(M) {
      if (!M || !M.ears || !M.ears[1]) return null;
      const g = new THREE.Group(); g.position.set(0.05, 0.1, -0.03); g.rotation.set(0.15, 0, -0.55);
      g.add(P(TK.G.sphere, '#fffaf0', [0, 0.16, 0], [0.035, 0.16, 0.008], { ink: 0.006 }));
      g.add(P(TK.G.box, '#2b2235', [0, 0.16, 0.004], [0.004, 0.28, 0.004], { ink: 0 }));
      g.add(P(TK.G.box, '#c9a24a', [0, -0.01, 0], [0.012, 0.06, 0.012], { ink: 0.004 }));
      M.ears[1].add(g); return g;
    } });
    TALK.cosmetic('exam.b2', { name: { en: REWARD[4].cosName }, build(M) {
      if (!M || !M.body) return null;
      const g = new THREE.Group(); g.position.set(0.13, 0.36, 0.29); g.rotation.set(-0.25, 0.35, 0);
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const a = -1.2 + i * 0.5; g.add(P(TK.G.sphere, '#e0b030', [s * Math.cos(a) * 0.055, Math.sin(a) * 0.055, 0], [0.02, 0.032, 0.008], { rot: [0, 0, s * (a + 0.6)], ink: 0.004 })); }
      g.add(P(TK.G.cyl, '#f2d060', [0, -0.005, 0.01], [0.026, 0.01, 0.026], { rot: [H, 0, 0], ink: 0.005 }));
      M.body.add(g); return g;
    } });
  }

  // ------------------------------------------------------------ what to practice: missed words → the flashcards; grammar slips
  // A word you missed in Listening or Reading (an item's key words) goes to the flashcards: one of Mimo's own words is made due
  // now; a dictionary word Mimo doesn't have yet joins the deck as a new card (registered with LEX as 'x.<dictionary id>', and
  // again on every load from state.exam.cards). A spelling slip in Writing or Speaking does the same. Other slips are grouped by
  // DICT.check's code, with the tip and where to practice.
  const WHERE = {
    tense: 'The tenses: Chapter 4’s time cracks teach them a step at a time (each world’s pattern card), and the Past and the Future ask for nothing else.',
    conj: 'Verb endings (I, you, she…): Bruno’s training yard by the bell tower, «a bit of everything»: every answer comes with the rule.',
    agree: 'Agreement (gender and number): Bruno’s training yard (the colors), and the shops, where you ask for things.',
    article: 'Articles: Bruno’s training yard, and Mimo’s words in the journal (each one shows its article).',
    serestar: 'ser and estar: free talk with Doña Rosa (how you are, what things are like).',
    gustar: '«gustar»: small talk anywhere in town (what you like), and Grandma Mei’s menu.',
    prep: 'Little words (prepositions): the reading in Alba’s library: they’re easiest to pick up in stories.',
    contract: 'Contractions (no, na, do, da…): the books in Alba’s library.',
    order: 'Word order: Bruno’s training yard (whole sentences), and the library’s books, read aloud.',
    case: 'Cases (der / den / dem): Bruno’s training yard, and the shops, where you ask for things.',
    aux: 'haben or sein: the Past’s pattern cards (Chapter 4), where everything is told in the past.',
    sep: 'Separable verbs: free talk in town (your plans for the day).',
    measure: 'Measure words: the shops (one of something, two of something), and Grandma Mei’s restaurant.',
    particle: 'Particles (は, が, を, に…): Bruno’s training yard, and the library’s books.',
    adj: 'Adjectives: free talk in town (what things are like).',
    polite: 'Polite and plain forms: talk with the adults in town, who answer politely.',
    neg: 'Saying no (不 / 没): small talk in town.',
    qword: 'Questions: the phone and small talk, where you ask things back.',
    want: 'What the task asked for: read the task again, and answer each of its points.',
    spell: 'Spelling: these words are in your flashcards now.',
    other: 'Talk freely with the people of Alba: they say your sentences back the right way.',
  };
  function toDeck(entryId, l = L()) {
    if (typeof LEX === 'undefined' || typeof DICT === 'undefined' || !entryId) return null;
    const e = DICT.entry(entryId); if (!e) return null;
    const t = Date.now() / 1000;
    if (e.lex && LEX.item(e.lex) && LEX.item(e.lex)[l]) {
      const s = LEX.st(e.lex);
      if (s.stage >= LEX.STAGE.LEARNING) s.due = Math.min(s.due || t, t); else { LEX.expose(e.lex); s.intro = t; }
      return { id: e.lex, t: e.lemma, en: e.en };
    }
    const id = 'x.' + e.id, card = { id, lang: l, t: e.lemma, en: String(e.en || '').split(/[;,]/)[0].trim(), g: e.pos === 'n' ? e.g || null : null };
    registerCard(card);
    const s = S(); if (!s.cards.some(c => c.id === id)) s.cards.push(card);
    while (s.cards.length > 300) s.cards.shift();
    LEX.expose(id); const st = LEX.st(id); st.intro = t;
    return { id, t: e.lemma, en: card.en };
  }
  function registerCard(c) {
    if (typeof LEX === 'undefined' || !c || !c.id) return;
    const it = Object.assign({}, LEX.item(c.id) || {}, { id: c.id, kind: 'word', en: c.en || '', exam: true });
    it[c.lang] = c.t; if (c.g) it.g = Object.assign({}, it.g || {}, { [c.lang]: c.g });
    LEX.register([it]);
  }
  // a word the content names («lunes», '[星期一|xīng qī yī]') → its dictionary id
  function entryIdOf(w, l = L()) {
    if (!w) return null;
    try {
      const k = isC(l) && typeof CJK !== 'undefined' ? CJK.chars(String(w), { lang: l }).replace(/\s+/g, '') : String(w).replace(/^(el|la|los|las|un|una|o|a|os|as|um|uma|der|die|das|den|dem|ein|eine)\s+/i, '');
      const list = DICT.find(k) || [];
      const exact = list.find(e => nrm(isC(l) ? CJK.chars(e.lemma, { lang: l }).replace(/\s+/g, '') : e.lemma) === nrm(k));
      return (exact || list[0] || {}).id || null;
    } catch (e) { return null; }
  }
  function practice(att) {
    const l = att.lang || L(), words = new Map(), gram = new Map();
    for (const sec of att.sections) {
      const res = att.res[sec.id]; if (!res) continue;
      if (sec.part === 'listen' || sec.part === 'read') for (const x of res.items || []) if ((x.s || 0) < 1) for (const w of x.words || []) { const id = entryIdOf(w, l); if (id && !words.has(id)) words.set(id, w); }
      const errs = sec.part === 'write' ? (res.tasks || []).flatMap(x => x.errors || []) : sec.part === 'speak' ? (res.turns || []).flatMap(x => x.errors || []) : [];
      for (const e of errs) {
        if (!e || e.free) continue;
        const fam = String(e.code || 'other').split('.')[0];
        if (fam === 'spell' && e.fix) { const id = entryIdOf(e.fix, l); if (id && !words.has(id)) words.set(id, e.fix); continue; }
        if (fam === 'accent' || fam === 'bridge') continue;
        const g = gram.get(fam) || { code: fam, n: 0, tips: [] }; g.n++; if (e.tip && g.tips.length < 2 && !g.tips.includes(e.tip)) g.tips.push(e.tip); gram.set(fam, g);
      }
    }
    att.missed = [];
    for (const [id] of [...words].slice(0, 12)) { const c = toDeck(id, l); if (c) att.missed.push(c); }
    att.grammar = [...gram.values()].sort((a, b) => b.n - a.n).slice(0, 6).map(g => Object.assign(g, { where: ((content(l) || {}).practice || {})[g.code] || WHERE[g.code] || WHERE.other }));
    return att;
  }
  // ------------------------------------------------------------ the invitation: a letter from the Academy
  // Every 10 s of play (45 if DICT.bands() ever takes over 5 ms), once you've met Rosa: when your overall level reaches one you
  // haven't passed or been invited to, the levels up to it open and a letter comes. It waits until you're free (no scene, fight,
  // panel or room) and shows once; the side quest "The Academy's letter" follows it.
  let tickT = 6, every = 10, lastMs = 0;
  function free() {
    if (!G || typeof document === 'undefined') return false;
    if (typeof STORY !== 'undefined' && (STORY.busy || STORY.line)) return false;
    const bc = document.body.className;
    if (/(^|\s)(in-battle|on-title)(\s|$)/.test(bc) || /(^|\s)[\w-]+-open(\s|$)/.test(bc)) return false;
    if (G.journalOpen || (G.sim && G.sim.lock) || (typeof Input !== 'undefined' && Input.typing)) return false;
    if ((typeof READER !== 'undefined' && READER.isOpen) || (typeof TALK !== 'undefined' && TALK.busy) || (typeof EXAMUI !== 'undefined' && EXAMUI.isOpen)) return false;
    if (document.querySelector('.panel:not(.hidden), #card:not(.hidden), #letter:not(.hidden), #choose:not(.hidden), #talk:not(.hidden)')) return false;
    if (G.indoors && G.indoors() && !(typeof ACADEMY !== 'undefined' && ACADEMY.inside)) return false;
    return true;
  }
  function invite(lv) {
    const s = S(); let b = 0;
    for (let x = Math.min(4, lv); x >= 1; x--) if (!s.invited[x] && !passed(x)) { b = x; break; }
    if (!b) return 0;
    for (let x = 1; x <= b; x++) if (!s.invited[x]) s.invited[x] = Date.now();
    s.pending = b; save();
    return b;
  }
  async function showLetter(b) {
    const s = S(); s.pending = 0; s.letters[b] = Date.now(); save();
    try { if (typeof UI !== 'undefined' && UI.toast) UI.toast('📨 A letter from the Academy of Alba'); } catch (e) { /* */ }
    try { if (typeof EXAMUI !== 'undefined') await EXAMUI.letter(b); } catch (e) { console.error('[exam] letter', e); }
  }
  function update(dt, t, you) {
    if (!G || !G.state) return;
    if (typeof ACADEMY !== 'undefined' && ACADEMY.outdoor) { try { ACADEMY.outdoor(dt, t, you); } catch (e) { console.error('[academy]', e); ACADEMY.outdoor = null; } }
    if ((tickT -= dt) > 0) return;
    tickT = every;
    const f = G.state.flags || {};
    if (!f.hatched || !f.rosa || !ready()) return;
    const s = S();
    if (s.pending) { if (free()) showLetter(s.pending); return; }
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0; let lv = 0;
    try { lv = DICT.bands().overall | 0; } catch (e) { return; }
    lastMs = (typeof performance !== 'undefined' ? performance.now() : 0) - t0; every = lastMs > 5 ? 45 : 10;
    if (lv >= 1 && invite(lv) && free()) showLetter(s.pending);
  }
  const nextInvited = () => { const s = S(); for (let b = 1; b <= 4; b++) if (s.invited[b] && !s.certs[b]) return b; return 0; };
  function quest() {
    const door = () => (typeof ACADEMY !== 'undefined' && ACADEMY.door ? ACADEMY.door() : null);
    return {
      id: 'academy', kind: 'side',
      get title() { return 'The Academy’s letter'; },
      get giver() { return 'a letter from the Academy of Alba'; },
      started: st => !!(st.exam && st.exam.letters && Object.keys(st.exam.letters).length) && ready(),
      steps: [
        { text: 'Visit the Academy, on the west street', why: 'A letter came from the Academy of Alba: your language is ready for its next level exam.', done: st => !!(st.exam && st.exam.visited), target: door, hint: '{mimo} points down the west street, toward the road to Remanso.' },
        { get text() { const b = nextInvited(); return b ? `Pass the ${BANDS[b]} exam at the Academy` : 'Pass the exam at the Academy'; }, why: 'Four parts, 25 points each. A pass is 60, with at least 10 in every part. You can stop between parts.',
          done: () => !nextInvited(), target: () => (typeof ACADEMY !== 'undefined' && ACADEMY.inside && ACADEMY.desk ? ACADEMY.desk() : door()), hint: '{mimo} points at the examiner’s desk.' },
      ],
      story: [
        { when: st => !!(st.exam && st.exam.visited), text: 'The Academy of Alba is the half-timbered house at the end of the west street. Its level exams have four parts: listening, reading, writing and speaking.' },
        { when: st => !!(st.exam && st.exam.certs && Object.keys(st.exam.certs).length), get text() { const c = Object.keys(S().certs).map(b => BANDS[b]).join(', '); return `Your certificates from the Academy: ${c}. They hang on the Academy’s wall, and on your journal’s level page.`; } },
      ],
    };
  }

  // ------------------------------------------------------------ running exams (the panel is exam_ui.js)
  function start(band) { const p = level(band); if (!p) return Promise.resolve(null); const att = newAttempt(p); save(); return EXAMUI.run(att); }
  function resume(band) { const att = attById(S().cur[band]); return att ? EXAMUI.run(att) : start(band); }
  function run(p, o = {}) {
    if (typeof p === 'string') p = PAPERS[p];
    else if (p && p.band && !p.sections) p = level(p.band, p.lang);
    if (!p) return Promise.resolve(null);
    const att = newAttempt(p); save();
    return EXAMUI.run(att, o);
  }
  // D: one task anywhere, logged like the exam's (a radio quiz, a pen pal's letter, a job interview's questions)
  function single(t, o = {}) { if (typeof t === 'string') t = task(t); return t ? EXAMUI.single(t, o) : Promise.resolve(null); }
  function letterCard(def) { return EXAMUI.letterCard(def); }
  const certs = () => Object.assign({}, S().certs);
  const paused = b => { const id = S().cur[b]; const a = id && attById(id); return a && !a.done ? a : null; };

  // ------------------------------------------------------------ checks and tests (EXAM._.check(lang) · EXAM._.tests(lang); the game never calls them)
  // check: the content's shape: every slot of every band has two tasks or more, every line has its English, items are well
  // formed, banks and pictures exist, and zh / ja text passes CJK.validate (with the slot words filled in)
  function check(l = L()) {
    const out = [], c = C[l]; if (!c) return ['no exam content for ' + l];
    const bad = (id, what) => out.push(`${id}: ${what}`);
    const line = (id, where, x) => { const ln = lineOf(x); if (!ln || !ln.t) bad(id, where + ': empty'); else if (!ln.en) bad(id, where + ': no English'); return ln; };
    const cj = isC(l) && typeof CJK !== 'undefined';
    const valid = (id, where, s) => { if (!cj || !s) return; for (const p of CJK.validate(String(s).replace(/\{[^}]+\}/g, 'X').replace(/⟦[^⟧]*⟧/g, 'X'), l) || []) bad(id, `${where}: ${p}`); };
    for (const band of [1, 2, 3, 4]) for (const p of PARTS) for (const slot of LEVEL[band][p]) { const n = tasksOf(l, band, p, slot).length; if (n < 2) out.push(`${BANDS[band]} ${p} ${slot}: ${n} task${n === 1 ? '' : 's'} (two are needed, so a retake differs)`); }
    for (const t of c.tasks.values()) {
      if (!PARTS.includes(t.part)) bad(t.id, 'part ' + t.part);
      if (!(t.band >= 1 && t.band <= 4)) bad(t.id, 'band ' + t.band);
      for (const [v, bank] of Object.entries(t.vars || {})) if (!(c.slots[bank] || []).length) bad(t.id, `vars.${v}: no bank ${bank}`);
      const att = { seed: 7 }, r = resolve(t, att);
      if (t.part === 'listen' || t.part === 'read') {
        if (t.part === 'listen' && !(t.lines || []).length) bad(t.id, 'no lines');
        if (t.part === 'read' && !(t.text || []).length) bad(t.id, 'no text');
        for (const ln of t.lines || []) { if (!ln.en) bad(t.id, 'a line with no English'); if (!t.voices || !t.voices[ln.who]) bad(t.id, `no voice for ${ln.who}`); }
        for (const ln of r.lines || []) { valid(t.id, 'line', ln.text); if (/\{[a-zA-Z]/.test(ln.text)) bad(t.id, 'a slot left in: ' + ln.text); }
        for (const s of linesOf(t.text || [])) { if (!s.en) bad(t.id, 'a sentence with no English'); }
        for (const s of r.text || []) { valid(t.id, 'text', s.t); if (/\{[a-zA-Z]/.test(s.t)) bad(t.id, 'a slot left in: ' + s.t); }
        for (const b of t.blocks || []) { if (b.label) line(t.id, 'blocks.label', b.label); for (const x of linesOf(b.head || []).concat(t.textOwn ? linesOf(b.text || []) : [])) { if (!x.en) bad(t.id, 'a block’s line with no English'); valid(t.id, 'block', x.t); } }
        for (const c of t.clips || []) if (c.label) { line(t.id, 'clips.label', c.label); valid(t.id, 'clips.label', lineOf(c.label).t); }
        for (const x of linesOf(t.head || [])) { if (!x.en) bad(t.id, 'head: no English'); valid(t.id, 'head', x.t); }
        if (!(t.items || []).length) bad(t.id, 'no items');
        (t.items || []).forEach((it, k) => {
          const w = `items[${k}]`, ri = r.items[k];
          if (!TYPES[it.type]) bad(t.id, `${w}: type ${it.type}`);
          if (it.ask) { line(t.id, w + '.ask', it.ask); valid(t.id, w + '.ask', lineOf(it.ask).t); }
          if ((it.type === 'mc' || it.type === 'gap') && !it.var) { if (!(it.opts || []).length) bad(t.id, w + ': no options'); (it.opts || []).forEach((o, j) => { line(t.id, `${w}.opts[${j}]`, o); valid(t.id, w + '.opt', lineOf(o).t); }); }
          if (it.type === 'tf' && typeof it.key !== 'boolean') bad(t.id, w + ': tf key must be true / false');
          if (it.type === 'tfn' && ![true, false, 'n'].includes(it.key)) bad(t.id, w + ': tfn key must be true / false / n');
          if (it.type === 'short' && !it.want && !it.var) bad(t.id, w + ': short needs a want or a var');
          if (it.type === 'short' && !it.var && !it.model) bad(t.id, w + ': short needs a model');
          if (it.type === 'match' && it.letters) {
            (it.labels || []).forEach((lb, j) => { line(t.id, `${w}.labels[${j}]`, lb); valid(t.id, w, lineOf(lb).t); });
            (it.pairs || []).forEach((pr, j) => { line(t.id, `${w}.pairs[${j}][0]`, pr[0]); valid(t.id, w, lineOf(pr[0]).t); if (!(pr[1] >= 0 && pr[1] < (it.labels || []).length)) bad(t.id, `${w}.pairs[${j}]: label ${pr[1]} isn’t one of the labels`); });
          } else if (it.type === 'match') (it.pairs || []).forEach((pr, j) => { line(t.id, `${w}.pairs[${j}][0]`, pr[0]); line(t.id, `${w}.pairs[${j}][1]`, pr[1]); valid(t.id, w, lineOf(pr[0]).t); valid(t.id, w, lineOf(pr[1]).t); });
          if (it.var && !(t.vars || {})[it.var]) bad(t.id, `${w}: var ${it.var} isn’t in vars`);
          if (ri && ri.opts) ri.opts.forEach(o => valid(t.id, w + '.opt', o.t));
          if (ri && ri.model) valid(t.id, w + '.model', ri.model);
        });
      } else if (t.part === 'write' && t.items) {
        // (C: a writing part made of items, HSK's 书写: checked like a reading task's items above would be)
        if (!(t.items || []).length) bad(t.id, 'no items');
      } else if (t.part === 'write') {
        (t.prompt ? linesOf(t.prompt) : []).forEach(x => { if (!x.en) bad(t.id, 'prompt: no English'); valid(t.id, 'prompt', x.t); });
        if (t.form) {
          // (C: a form to fill in, one field per line of the answer)
          (t.form || []).forEach((f, k) => { line(t.id, `form[${k}]`, f.label); valid(t.id, 'form', lineOf(f.label).t); });
          if (!t.model) bad(t.id, 'no model'); if (!t.weak) bad(t.id, 'no weak answer (for the tests)');
          continue;
        }
        if ((t.points || []).length !== 3 && !(t.mock && (t.points || []).length >= 2)) bad(t.id, `${(t.points || []).length} points (three are wanted)`);
        (t.points || []).forEach((p, k) => { line(t.id, `points[${k}]`, p.t); valid(t.id, 'point', lineOf(p.t).t); if (!p.want) bad(t.id, `points[${k}]: no want`); });
        if (!(t.min > 0 && t.max > t.min)) bad(t.id, 'min / max');
        if (!t.model) bad(t.id, 'no model'); else valid(t.id, 'model', typeof t.model === 'string' ? t.model : lineOf(t.model).t);
        if (!t.weak) bad(t.id, 'no weak answer (for the tests)'); else valid(t.id, 'weak', t.weak);
      } else if (t.part === 'speak') {
        if (!t.ask) bad(t.id, 'no ask'); else linesOf(t.ask).forEach(x => { if (!x.en) bad(t.id, 'ask: no English'); valid(t.id, 'ask', x.t); });
        if (t.simpler) { line(t.id, 'simpler', t.simpler); valid(t.id, 'simpler', lineOf(t.simpler).t); }
        if (!t.goal) bad(t.id, 'no goal'); if (!t.want) bad(t.id, 'no want');
        if (!t.model) bad(t.id, 'no model'); else { line(t.id, 'model', t.model); valid(t.id, 'model', lineOf(t.model).t); }
        const pic = t.pic || (t.card && t.card.pic);
        if (pic && t.want && t.want.lemmas === '@pic' && !(c.pics[pic] || []).length) bad(t.id, `no words for the picture ${pic}`);
        if (pic && typeof EXAMUI !== 'undefined' && !EXAMUI.PICS[pic]) bad(t.id, `no picture ${pic}`);
        if (t.card) { const cd = t.card; if (cd.title) { line(t.id, 'card.title', cd.title); valid(t.id, 'card.title', lineOf(cd.title).t); } for (const x of linesOf(cd.lines || []).concat(linesOf(cd.list || []))) { if (!x.en) bad(t.id, 'card: a line with no English'); valid(t.id, 'card', x.t); } }
      }
    }
    for (const k of ['hello', 'again', 'moveOn', 'ack', 'speakIntro', 'speakEnd', 'pass', 'fail', 'tf', 'welcome', 'begin', 'bye', 'rules']) if (!c.lines[k]) out.push('lines.' + k + ': missing'); else linesOf(c.lines[k]).forEach(x => { if (!x.en) out.push(`lines.${k}: no English`); valid('lines.' + k, k, x.t); });
    for (const x of linesOf(c.letter.body || [])) { if (!x.en) out.push('letter: no English'); valid('letter', 'body', x.t); }
    for (const [bank, list] of Object.entries(c.slots)) list.forEach((v, i) => { if (!v.en) out.push(`slots.${bank}[${i}]: no English`); valid(`slots.${bank}`, i, v.t); valid(`slots.${bank}`, i, v.opt); });
    for (const k of ['name', 'sign', 'cert', 'chalk']) if (!c.academy[k]) out.push('academy.' + k + ': missing'); else valid('academy', k, c.academy[k]);
    for (const x of c.academy.board || []) valid('academy', 'board', lineOf(x).t);
    valid('examiner', 'name', c.examiner.name); valid('examiner', 'sign', c.examiner.sign);
    return out;
  }
  // a whole paper, graded without the panel: mode per part 'model' | 'nose' | 'weak' | 'english' | 'wrong' → { scores, total, passed, why }
  function simulate(band, mode, l = L()) {
    const T = LEVEL[band], s = S(), keepSeen = Object.assign({}, s.seen);
    const p = level(band, l); s.seen = keepSeen;
    const att = { seed: 99 + band, band, lang: l, sections: p.sections }, scores = {}, how = part => (typeof mode === 'string' ? mode : mode[part] || 'model');
    const idk = { es: 'No sé.', pt: 'Não sei.', de: 'Ich weiß es nicht.', zh: '我不知道。', ja: 'わかりません。' }[l];
    for (const sec of p.sections) {
      const m = how(sec.part), res = { items: [], tasks: [], turns: [] };
      for (const id of sec.tasks) {
        const t = resolve(task(id, l), att);
        if (sec.part === 'listen' || sec.part === 'read') for (const it of t.items) {
          const a = m === 'model' ? (it.type === 'short' ? it.model : Array.isArray(it.key) ? it.key.slice() : it.key) : m === 'nose' ? (it.type === 'short' ? idk : null) : m === 'wrong' ? (it.type === 'short' ? idk : it.type === 'tf' ? !it.key : it.type === 'tfn' ? (it.key === true ? false : true) : Array.isArray(it.key) ? it.key.map((x, i, k) => k[(i + 1) % k.length]) : (it.key + 1) % (it.opts || [1]).length) : (it.type === 'short' ? (t.model ? '' : '') : null);
          res.items.push({ task: id, k: it.k, s: scoreItem(it, a, l), pts: it.pts || 1 });
        } else if (sec.part === 'write') {
          const text = m === 'model' ? (t.model && t.model.t) : m === 'weak' ? t.weak : m === 'english' ? 'I am writing to tell you that I am fine and I will come back on Saturday. Thank you very much.' : idk;
          res.tasks.push(Object.assign({ id }, gradeWrite(text, t, band, l)));
        } else {
          const text = m === 'model' ? (t.model && t.model.t) : m === 'english' || m === 'weak' ? (t.model && t.model.en) : idk;
          res.turns.push(Object.assign({ id }, gradeTurn(text, t, band, l)));
        }
      }
      scores[sec.id] = sectionScore(sec, res);
    }
    const total = round(Object.values(scores).reduce((a, b) => a + b, 0), 0.5), low = PARTS.filter(x => scores[x] < EACH);
    return { scores, total, passed: total >= PASS && !low.length, low };
  }
  function tests(l = L()) {
    const was = typeof LEX !== 'undefined' ? LEX.lang : l; if (typeof LEX !== 'undefined') LEX.lang = l;
    const fails = [], ok = (cond, what) => { if (!cond) fails.push(what); return cond; }, t0 = Date.now(), counts = { tasks: 0, items: 0, write: 0, speak: 0 };
    try {
      const problems = check(l); problems.forEach(p => fails.push('check: ' + p));
      const idk = { es: 'No sé.', pt: 'Não sei.', de: 'Ich weiß es nicht.', zh: '我不知道。', ja: 'わかりません。' }[l];
      for (const t of C[l].tasks.values()) {
        counts.tasks++;
        for (const seed of [3, 17]) {
          const r = resolve(t, { seed });
          if (t.part === 'listen' || t.part === 'read' || (t.part === 'write' && t.items)) for (const it of r.items) {
            if (seed === 3) counts.items++;
            const right = it.type === 'short' ? it.model : Array.isArray(it.key) ? it.key.slice() : it.key;
            ok(scoreItem(it, right, l) === 1, `${t.id} #${it.k} (${it.type}): the right answer scores ${scoreItem(it, right, l)} («${right}»)`);
            if (it.type === 'short') { ok(scoreItem(it, idk, l) === 0, `${t.id} #${it.k}: «${idk}» scores`); ok(scoreItem(it, 'I don’t know', l) === 0, `${t.id} #${it.k}: English scores`); }
            else if (it.type === 'mc' || it.type === 'gap') ok(scoreItem(it, (it.key + 1) % it.opts.length, l) === 0, `${t.id} #${it.k}: a wrong option scores`);
          }
          if (seed !== 3) continue;
          if (t.part === 'write' && !t.items) {
            counts.write++;
            const g = gradeWrite(r.model.t, r, t.band, l), w = gradeWrite(t.weak, r, t.band, l), n = gradeWrite(idk, r, t.band, l);
            ok(g.score >= 10, `${t.id}: the model scores ${g.score}/12.5 (points ${g.points}, accuracy ${g.acc}, range ${g.range}, length ${g.len}, ${g.words} words; ${g.errors.filter(e => !e.free).map(e => e.code + ' «' + e.fix + '»').join(', ')})`);
            ok(w.score < 5, `${t.id}: the weak text scores ${w.score}/12.5 (points ${w.points})`);
            ok(n.score === 0, `${t.id}: «${idk}» scores ${n.score}`);
          }
          if (t.part === 'speak') {
            counts.speak++;
            const g = gradeTurn(r.model.t, r, t.band, l), n = gradeTurn(idk, r, t.band, l), e = gradeTurn(r.model.en, r, t.band, l);
            ok(g.understood && g.s >= 3.5, `${t.id}: the model is ${g.understood ? g.grade : 'not understood'} (${g.r && g.r.missing ? 'missing ' + g.r.missing.join(',') : ''} ${g.r && g.r.errors ? g.r.errors.filter(x => !x.free).map(x => x.code + ' «' + x.fix + '»').join(', ') : ''})`);
            ok(n.s === 0, `${t.id}: «${idk}» scores ${n.s}`); ok(e.s === 0, `${t.id}: English scores ${e.s}`);
          }
        }
      }
      for (const band of [1, 2, 3, 4]) {
        const m = simulate(band, 'model', l), n = simulate(band, 'nose', l), w = simulate(band, { write: 'weak' }, l), sp = simulate(band, { speak: 'english' }, l), x = simulate(band, { listen: 'wrong', read: 'wrong' }, l);
        ok(m.passed, `${BANDS[band]}: the model answers don’t pass (${JSON.stringify(m.scores)})`);
        ok(!n.passed, `${BANDS[band]}: «${idk}» everywhere passes`);
        ok(!w.passed && w.low.includes('write') && w.low.length === 1, `${BANDS[band]}: weak writing should fail Writing only (${JSON.stringify(w.scores)})`);
        ok(!sp.passed && sp.low.includes('speak') && sp.low.length === 1, `${BANDS[band]}: English speaking should fail Speaking only (${JSON.stringify(sp.scores)})`);
        ok(!x.passed && x.low.includes('listen') && x.low.includes('read'), `${BANDS[band]}: wrong answers should fail Listening and Reading (${JSON.stringify(x.scores)})`);
        // a retake differs: draw, mark it seen, draw again
        const s = S(), keep = Object.assign({}, s.seen);
        const p1 = level(band, l), ids1 = p1.sections.flatMap(x2 => x2.tasks); ids1.forEach(id => { s.seen[id] = 1e6; });
        const ids2 = level(band, l).sections.flatMap(x2 => x2.tasks); s.seen = keep;
        const same = ids2.filter(id => ids1.includes(id)).length;
        ok(same <= ids1.length / 2, `${BANDS[band]}: a retake repeats ${same} of ${ids1.length} tasks`);
      }
    } catch (e) { fails.push('threw: ' + (e && e.stack || e)); }
    finally { if (typeof LEX !== 'undefined') LEX.lang = was; }
    return { lang: l, ok: !fails.length, fails, counts, ms: Date.now() - t0 };
  }

  // ------------------------------------------------------------ init
  function init(game) {
    G = game; S();
    for (const c of S().cards) { try { registerCard(c); } catch (e) { /* */ } }
    try { cosmetics(); } catch (e) { console.error('[exam] cosmetics', e); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'academy')) QUESTS.LIST.push(quest());
    if (typeof METER !== 'undefined' && METER.sections && typeof EXAMUI !== 'undefined' && !METER.sections.includes(EXAMUI.shelfHTML)) METER.sections.push(EXAMUI.shelfHTML);
    if (typeof ACADEMY !== 'undefined' && ACADEMY.init) { try { ACADEMY.init(game); } catch (e) { console.error('[academy]', e); } }
  }

  return {
    init, update, add, content, ready, task, tasksOf, paper, level, run, start, resume, single, task1: single, type, letter: letterCard, certs, open, passed, paused, attempts,
    grade: { item: scoreItem, write: gradeWrite, turn: gradeTurn, short: shortOK, section: sectionScore },
    BANDS, PARTS, PART, LEVEL, REWARD, MAX, PASS, EACH, TURN_PTS, WRITE_MAX, TURN_MAX, LANGNAME, PAPERS, TYPES,
    get state() { return S(); }, get game() { return G; }, get lang() { return L(); },
    _: { C, S, save, resolve, varsFor, fillVars, lineOf, linesOf, says, newAttempt, finishSection, finish, practice, toDeck, registerCard, entryIdOf, idkOnly, sentencesOf, resolveWant,
      rng, hash, shuffle, invite, showLetter, free, quest, nextInvited, attById, fmt, wordsOf, WHERE, IDK, check, tests, simulate, get lastMs() { return lastMs; }, get every() { return every; } },
  };
})();
