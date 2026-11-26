'use strict';
// READ: reading and listening (DESIGN.md 15.4; the contract is ../../FLUENT.md, section C; the authoring guide is ../../READ.md).
// The core of js/read/: the content registry (books, Noa's diary, radio shows, overheard talk, per language), what you've
// read and heard (G.state.read, saved with the game), the answer judge, the journal's Reading page, the map marks, and the
// one init / update main.js calls. The pieces:
//   speech.js (SPEECH, the voices) · reader.js (READER, the panels) · library.js (LIBRARY, Alba's library, house 12)
//   diary.js (DIARY, Noa's diary pages in regions 1–5) · radio.js (RADIO) · overheard.js (OVERHEARD) · content_es.js …
// Everything hides quietly in a language with no dictionary pack (!DICT.ready()) or no content for it yet.
//
//   READ.add(lang, { librarian, books, diary, radio, overheard, notes })   (content files call this at load)
//   READ.on(kind) → bool        kind: 'books' | 'diary' | 'radio' | 'overheard' (the pack is there and so is content)
//   READ.list(kind) → [items]   READ.find(kind, id) · READ.S() (the save's state) · READ.when(cond) (content conditions)
//   READ.judge(text, want, opts) → Promise<{ grade, met, understood, errors, fixed, tips, wrong, src }>
//        TALK.judge when the talk helper has it (js/talk/), else the local judge below (the same grades, FLUENT.md B)
//   READ.html(src) / READ.plain(src): text for the current language and mode (zh/ja notation → ruby or romanization)
//   READ.init(game) · READ.update(dt, t, you) · READ.mapMarks(dpr) · READ.journalTab · READ._ (tests)

const READ = (() => {
  let G = null;
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const KINDS = ['books', 'diary', 'radio', 'overheard'];
  const C = {};                                                   // C[lang] = { librarian, books: [], diary: [], radio: [], overheard: [], notes: {} }
  const L = () => (G && G.state && G.state.lang) || (typeof LEX !== 'undefined' && LEX.lang) || 'es';
  const isCJ = l => l === 'zh' || l === 'ja';
  const cjOn = () => typeof CJK !== 'undefined' && isCJ(L());
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const mimo = () => (G && G.state && G.state.mimoName) || (typeof UI !== 'undefined' && UI.mimoName) || 'Mimo';
  const fill = s => String(s == null ? '' : s).replace(/\{mimo\}/g, mimo());
  const html = (src, o) => (cjOn() ? CJK.html(fill(src), Object.assign({ lang: L() }, o || {})) : esc(fill(src)));
  const plain = (src, o) => (cjOn() ? CJK.plain(fill(src), Object.assign({ lang: L() }, o || {})) : fill(src));

  // ------------------------------------------------------------ the content registry
  function add(lang, c) {
    const o = C[lang] || (C[lang] = { librarian: null, books: [], diary: [], radio: [], overheard: [], notes: {} });
    if (!c) return o;
    if (c.librarian) o.librarian = Object.assign(o.librarian || {}, c.librarian);
    for (const k of KINDS) for (const it of c[k] || []) {
      const i = o[k].findIndex(x => x.id === it.id);
      it.lang = lang;
      if (i >= 0) o[k][i] = it; else o[k].push(it);
    }
    if (c.notes) Object.assign(o.notes, c.notes);
    if (isCJ(lang) && typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(strings(lang).map(x => x.s)); } catch (e) { /* (the IME learns them later) */ } }
    return o;
  }
  const content = (lang = L()) => C[lang] || null;
  const packOK = () => typeof DICT !== 'undefined' && DICT.ready();
  function on(kind) { const c = content(); return !!(c && packOK() && (kind ? c[kind] && c[kind].length : true)); }
  const list = kind => { const c = content(); return c && c[kind] ? c[kind].filter(x => when(x.when)) : []; };
  const find = (kind, id) => { for (const l of LANGS) { const c = C[l]; const it = c && c[kind] && c[kind].find(x => x.id === id); if (it) return it; } return null; };

  // a content condition: { bells: n } (at least n bells), { bellsBelow: n }, { flag: 'boss' }, { notFlag: 'x' }, { fact: 'clock' }, or a function (state)
  function when(c) {
    if (!c) return true;
    const s = (G && G.state) || { flags: {} }, f = s.flags || {}, b = f.bells || 0;
    if (typeof c === 'function') { try { return !!c(s); } catch (e) { return false; } }
    if (c.bells != null && b < c.bells) return false;
    if (c.bellsBelow != null && b >= c.bellsBelow) return false;
    if (c.flag && !f[c.flag]) return false;
    if (c.notFlag && f[c.notFlag]) return false;
    if (c.fact && !(S().facts || {})[c.fact]) return false;
    return true;
  }

  // ------------------------------------------------------------ the save: G.state.read
  function S() {
    const s = G && G.state ? G.state : (READ._mem || (READ._mem = {}));
    const o = s.read || (s.read = {});
    o.books = o.books || {}; o.diary = o.diary || {}; o.shows = o.shows || {}; o.talks = o.talks || {}; o.facts = o.facts || {}; o.lib = o.lib || {};
    return o;
  }
  const save = () => { if (G && G.save) try { G.save(); } catch (e) { /* */ } };
  // a result for the log (and the journal): kind 'books' | 'diary' | 'shows' | 'talks'
  function record(kind, id, data) {
    const o = S()[kind], r = o[id] || (o[id] = { n: 0, grades: [] });
    Object.assign(r, data || {});
    return r;
  }

  // ------------------------------------------------------------ the judge
  // want (READ.md "Questions"): { lemmas: [any of these], need: [[group], [group]] (one of each group), points: [[…], …] + enough: n
  // (n key points: retellings), not: [a wrong answer], topic: 'food', time: 'past', yesno: true | 'yes' | 'no', number: n,
  // reason: true, opinion: true, compare: true, min: words, any: true }
  // → { grade: 'S'|'A'|'B'|'C'|null (null: missed; the panel re-asks, then shows the model for a D), met, understood,
  //     errors, fixed, tips, wrong, points, src: 'talk' | 'local' }
  const NORM = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[’']/g, "'");
  const flat = s => ' ' + NORM(s).replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const T = {
    yes: { es: ['si', 'claro', 'por supuesto', 'sip'], pt: ['sim', 'claro', 'com certeza'], de: ['ja', 'doch', 'klar', 'genau'], zh: ['是', '对', '嗯', '是的', '对的', '有'], ja: ['はい', 'うん', 'ええ', 'そう'] },
    no: { es: ['no', 'nunca', 'nada'], pt: ['nao', 'nunca', 'nada'], de: ['nein', 'nicht', 'kein', 'nie'], zh: ['不', '没', '没有', '不是'], ja: ['いいえ', 'いや', 'ううん', 'ない', 'ません'] },
    reason: { es: ['porque', 'ya que', 'por eso', 'pues', 'como'], pt: ['porque', 'pois', 'ja que', 'por isso', 'como'], de: ['weil', 'denn', 'da', 'deshalb', 'darum', 'deswegen'], zh: ['因为', '所以', '由于'], ja: ['から', 'ので', 'だから'] },
    opinion: { es: ['creo que', 'pienso que', 'me parece', 'en mi opinion', 'para mi', 'opino que', 'me gusta', 'me encanta'], pt: ['acho que', 'penso que', 'na minha opiniao', 'pra mim', 'para mim', 'me parece', 'eu gosto', 'adoro'], de: ['ich finde', 'ich glaube', 'ich denke', 'meiner meinung', 'fur mich', 'gefallt mir', 'mag ich'], zh: ['我觉得', '我认为', '我想', '我喜欢'], ja: ['と思', 'と おも', 'すき', '好き'] },
    compare: { es: ['mas', 'menos', 'mejor', 'peor', 'tan', 'igual'], pt: ['mais', 'menos', 'melhor', 'pior', 'tao', 'igual'], de: ['mehr', 'weniger', 'besser', 'schlechter', 'als', 'so'], zh: ['比', '更', '最', '一样'], ja: ['より', 'ほう', 'いちばん', '一番'] },
    connect: { es: ['porque', 'pero', 'cuando', 'entonces', 'despues', 'luego', 'aunque', 'mientras', 'por eso', 'asi que', 'tambien', 'ademas', 'si', 'que'], pt: ['porque', 'mas', 'quando', 'entao', 'depois', 'ai', 'embora', 'enquanto', 'por isso', 'tambem', 'alem disso', 'se', 'que'],
      de: ['weil', 'aber', 'wenn', 'als', 'dann', 'danach', 'obwohl', 'dass', 'deshalb', 'auch', 'ausserdem', 'denn'], zh: ['因为', '所以', '但是', '可是', '然后', '如果', '虽然', '还', '也', '后来'], ja: ['から', 'ので', 'でも', 'けど', 'それから', 'そして', 'たら', 'ながら', 'あと'] },
  };
  const cjKey = (s, l) => { try { return CJK.canon(fill(s), l); } catch (e) { return NORM(s); } };
  function hasAny(words, ctx) { return (words || []).some(w => hasWord(w, ctx)); }
  function hasWord(w, ctx) {
    if (ctx.cj) { const k = cjKey(w, ctx.lang); return !!k && ctx.key.includes(k); }
    const n = NORM(w).trim();
    if (!n) return false;
    if (/\s/.test(n)) return ctx.flat.includes(' ' + n + ' ');
    for (const x of ctx.words) {
      if (x.t === n || x.lemma === n) return true;
      if (x.alts && x.alts.includes(n)) return true;
      if (n.length >= 4 && x.t.length >= 4) { let k = 0; const m = Math.min(n.length, x.t.length); while (k < m && n[k] === x.t[k]) k++; if (k >= Math.max(4, m - 2)) return true; }   // (conejo ~ conejos ~ conejito)
    }
    return false;
  }
  function context(text, lang) {
    const ctx = { lang, cj: isCJ(lang) && typeof CJK !== 'undefined', flat: flat(text), words: [], key: '' };
    if (ctx.cj) ctx.key = cjKey(text, lang);
    let a = null;
    try { a = DICT.analyze(text); } catch (e) { a = null; }
    ctx.a = a;
    const ws = a && a.words ? a.words.filter(w => !w.punct) : [];
    ctx.n = ws.length || (ctx.cj ? (ctx.key ? 1 : 0) : ctx.flat.trim().split(' ').filter(Boolean).length);
    ctx.unknown = a && !a.none && a.unknown ? a.unknown.length : 0;
    ctx.words = ws.map(w => {
      const o = { t: NORM(w.t), lemma: w.lemma ? NORM(w.lemma) : '', band: w.band || 0, tags: w.tags || [], alts: [] };
      if (!w.lemma && typeof DICT.find === 'function') { try { o.alts = (DICT.find(w.t) || []).map(e => NORM(e.lemma)); } catch (e) { /* */ } }
      return o;
    });
    return ctx;
  }
  const STEP = ['S', 'A', 'B', 'C', 'D'];
  const down = (g, n = 1) => STEP[Math.min(4, STEP.indexOf(g) + n)];
  // what the answer is about: the content keys (lemmas, need groups, key points, a topic, yes/no, a number, wrong answers).
  // o.form: also the form keys (min, reason, opinion, compare) as requirements (the local judge); TALK treats those as mistakes.
  function contentCheck(text, want, lang, o = {}) {
    const ctx = context(text, lang), a = ctx.a || {}, out = { ok: true, wrong: false, points: 0, ctx };
    let met = true;
    if (want.lemmas && want.lemmas.length) met = met && hasAny(want.lemmas, ctx);
    if (Array.isArray(want.need)) met = met && want.need.every(g => hasAny(Array.isArray(g) ? g : [g], ctx));
    if (want.points) { out.points = want.points.filter(g => hasAny(Array.isArray(g) ? g : [g], ctx)).length; met = met && out.points >= (want.enough || Math.min(2, want.points.length)); }
    if (want.topic) met = met && (ctx.words.some(w => [].concat(want.topic).some(t => w.tags.includes(t))) || hasAny(want.topicWords || [], ctx));
    if (want.yesno) { const y = hasAny(T.yes[lang] || [], ctx), n = hasAny(T.no[lang] || [], ctx); met = met && (want.yesno === 'yes' ? y && !n : want.yesno === 'no' ? n : y || n || (a.verbs || []).length > 0); }
    if (want.number != null && typeof want.number === 'number') met = met && (((a.numbers || []).includes(want.number)) || new RegExp('(^|\\D)' + want.number + '(\\D|$)').test(text) || hasAny(want.numberWords || [], ctx));
    if (o.form) {
      if (want.min) met = met && ctx.n >= want.min;
      if (want.reason) met = met && (hasAny(T.reason[lang] || [], ctx) || (a.connectors || []).some(c => (T.reason[lang] || []).includes(NORM(c))));
      if (want.opinion) met = met && hasAny(T.opinion[lang] || [], ctx);
      if (want.compare) met = met && hasAny(T.compare[lang] || [], ctx);
    }
    if (want.any) met = met && ctx.n >= 1;
    if (want.not && hasAny(want.not, ctx) && !(want.lemmas && hasAny(want.lemmas, ctx))) { met = false; out.wrong = true; }
    out.ok = met;
    return out;
  }
  // Errors the pack can't be sure of: next to a word it doesn't know that the piece's own glossary does (a name, a diminutive,
  // a regional word: «conejito», «chamarra»; or «dios», which a pack without it reads as «di» + «os»). FLUENT.md: a false alarm
  // on a right sentence is far worse than a missed mistake, so those are dropped. opts.gloss: the piece's glossary.
  function trustErrors(errors, a, gloss) {
    if (!gloss || !errors || !errors.length || !a || !a.words) return errors || [];
    const unsure = [];
    a.words.forEach((w, k) => {
      if (w.punct) return;
      const s = String(w.t); if (!gloss[s] && !gloss[s.toLowerCase()]) return;
      let known = false; try { known = (DICT.find(s) || []).some(e => NORM(e.lemma) === NORM(s)); } catch (e) { /* */ }
      if (!known) unsure.push(w.i != null ? w.i : k);
    });
    if (!unsure.length) return errors;
    return errors.filter(e => !(Array.isArray(e.at) && unsure.some(i => i >= e.at[0] - 1 && i <= e.at[1] + 1)));
  }
  function refix(text, a, kept) {
    if (!kept.length) return text;
    try { const p = DICT.pack(); if (p && typeof p.fix === 'function') return p.fix(a, kept) || text; } catch (e) { /* */ }
    return text;
  }
  function localJudge(text, want = {}, opts = {}) {
    const lang = opts.lang || L();
    text = String(text == null ? '' : text).trim();
    const out = { grade: null, met: false, understood: false, errors: [], fixed: text, tips: [], wrong: false, points: 0, rich: [], src: 'local' };
    if (!text) return out;
    let chk = { errors: [], fixed: text, major: 0, minor: 0, none: true };
    try { chk = DICT.check(text, { player: true, focus: want.focus }); } catch (e) { console.error('[read] DICT.check', e); }
    const cc = contentCheck(text, want, lang, { form: true }), ctx = cc.ctx, a = ctx.a || {};
    out.understood = ctx.n > 0 && (chk.none || !ctx.n || ctx.unknown / ctx.n <= 0.5);
    out.points = cc.points; out.wrong = cc.wrong;
    out.met = cc.ok && out.understood;
    if (!out.met) return out;
    // the grade: errors first (only what the pack is sure of), then richness
    const errors = trustErrors((chk.errors || []).slice(), a, opts.gloss);
    if (errors.length !== (chk.errors || []).length) chk.fixed = refix(text, a, errors);
    if (want.time && a && a.time && Array.isArray(a.times) && (a.verbs || []).length && !a.times.includes(want.time) && !errors.some(e => /^tense/.test(e.code)))
      errors.push({ code: 'tense.want', sev: 'major', at: [0, 0], fix: '', tip: want.time === 'past' ? 'This one is about the past: tell it in the past tense.' : want.time === 'future' ? 'This one is about the future: say what will happen.' : 'Mind the tense here.' });
    const major = errors.filter(e => e.sev === 'major' && !e.free).length, minor = errors.filter(e => e.sev !== 'major' && !e.free).length;     // (free: an accent slip, P6a)
    const conn = (a.connectors && a.connectors.length) || hasAny(((DICT.pack && DICT.pack() && DICT.pack().connectors) || T.connect[lang] || []).filter(c => NORM(c) !== 'y' && NORM(c) !== 'e' && NORM(c) !== 'und'), ctx);
    const rich = [];
    if (conn) rich.push('connector');
    if ((a.clauses || 0) >= 2 || (!a.clauses && conn && ctx.n >= 7)) rich.push('clauses');
    if (ctx.n >= (want.min || 3) + 4 || (want.points && out.points > (want.enough || 2))) rich.push('detail');
    if (opts.band && ctx.words.some(w => w.band > opts.band)) rich.push('word');
    out.rich = rich;
    let g = major >= 2 ? 'C' : major === 1 ? 'B' : minor > 0 ? 'A' : rich.length >= 2 ? 'S' : 'A';
    g = down(g, Math.min(3, opts.help || 0));
    if (g === 'D') g = 'C';                                  // (a met answer is never a D: D is for the model shown)
    out.grade = g; out.errors = errors; out.fixed = chk.fixed || text; out.tips = errors.map(e => e.tip).filter(Boolean);
    // words you used right count toward your vocabulary (TALK does this itself for its own answers)
    if (major === 0 && a && a.words) try { DICT.metAll(a, 'used'); } catch (e) { /* */ }
    return out;
  }
  // TALK.judge's want (js/talk/talk.js): content keys topic / lemmas (+ need: a count) / yesno / number / name / any, form keys
  // time / reason / opinion / compare / min. Ours adds need groups, key points and wrong answers, which we check ourselves
  // (contentCheck); TALK gets { any } plus the plain lemmas (for its "extra detail" count) and the form keys, and grades the language.
  function talkWant(want) {
    const lem = [].concat(want.lemmas || [], ...(Array.isArray(want.need) ? want.need : []), ...(want.points || [])).flat().filter(x => typeof x === 'string' && !/\s/.test(x.trim()));
    const tw = { any: true };
    if (lem.length) tw.lemmas = [...new Set(lem)];
    for (const k of ['time', 'reason', 'opinion', 'compare', 'min', 'topic']) if (want[k] !== undefined) tw[k] = want[k];
    return tw;
  }
  function normalize(r) {
    const grade = r.grade || r.g || null, met = r.met != null ? !!r.met : r.ok != null ? !!r.ok : !!grade && grade !== 'D';
    return { grade: met ? grade : null, met, understood: r.understood != null ? !!r.understood : met || !!grade, errors: r.errors || [], fixed: r.fixed || r.recast || '',
      tips: r.tips || (r.errors || []).map(e => e && e.tip).filter(Boolean), wrong: !!r.wrong, points: r.points || 0, rich: Array.isArray(r.rich) ? r.rich : r.rich ? ['rich'] : [], src: 'talk', raw: r };
  }
  async function judge(text, want = {}, opts = {}) {
    const o = Object.assign({ lang: L(), player: true }, opts);
    text = String(text == null ? '' : text).trim();
    if (!o.local && text && typeof TALK !== 'undefined' && TALK && typeof TALK.judge === 'function') {
      try {
        const r = await TALK.judge(text, talkWant(want), { band: o.band, help: o.help || 0, lang: o.lang, tips: o.tips, bridge: false });     // (the Spanglish bridge is free talk's: a book's answer is checked word for word here)
        if (r && typeof r === 'object' && 'understood' in r && !r.noPack) {
          const n = normalize(r);
          if (!r.understood) return Object.assign(n, { met: false, grade: null, understood: false });
          const cc = contentCheck(text, want, o.lang);
          if (!cc.ok) return Object.assign(n, { met: false, grade: null, wrong: cc.wrong, points: cc.points });
          // (TALK's met is false when a form key is missing: that's a real mistake, already in its grade; it's still an answer)
          n.met = true; n.points = cc.points; n.grade = r.grade || 'B';
          const kept = trustErrors(r.errors, r.a, o.gloss);
          if (kept.length !== (r.errors || []).length) {          // (regrade without the errors the pack couldn't be sure of)
            const major = kept.filter(e => e.sev === 'major' && !e.free).length, minor = kept.filter(e => e.sev !== 'major' && !e.free).length;     // (free: an accent slip, P6a)
            let g = major >= 2 ? 'C' : major === 1 ? 'B' : minor > 0 ? 'A' : r.rich ? 'S' : 'A';
            g = down(g, Math.min(2, o.help || 0));
            n.grade = g; n.errors = kept; n.tips = [...new Set(kept.map(e => e.tip).filter(Boolean))]; n.fixed = refix(text, r.a, kept.filter(e => !e.want));
            r.major = major;
          }
          if (n.grade === 'D' && !(o.help >= 3)) n.grade = 'C';
          if (!r.major && r.a) try { DICT.metAll(r.a, 'used'); } catch (e) { /* */ }
          return n;
        }
      } catch (e) { console.error('[read] TALK.judge', e); }
    }
    return localJudge(text, want, o);
  }
  const judgeSource = () => (typeof TALK !== 'undefined' && TALK && typeof TALK.judge === 'function' ? 'talk' : 'local');

  // ------------------------------------------------------------ zh / ja: every string passes CJK.validate (tests: READ._.check())
  function strings(lang) {
    const c = C[lang], out = [];
    if (!c) return out;
    const put = (where, s) => { if (typeof s === 'string' && s.trim()) out.push({ where, s, l: lang }); };
    const qs = (where, q) => (q || []).forEach((x, i) => { put(`${where}.q${i}.ask`, x.ask); put(`${where}.q${i}.model`, x.model); put(`${where}.q${i}.starter`, x.starter); put(`${where}.q${i}.simple`, x.simple); });
    for (const b of c.books) { put(b.id + '.title', b.title); (b.pages || []).forEach((p, i) => p.forEach((s, j) => put(`${b.id}.p${i}.${j}`, s[0]))); qs(b.id, b.q); if (b.retell) qs(b.id + '.retell', [b.retell]); }
    for (const d of c.diary) { put(d.id + '.title', d.title); (d.text || []).forEach((s, j) => put(`${d.id}.${j}`, s[0])); qs(d.id, d.q); }
    for (const r of c.radio) { put(r.id + '.title', r.title); (r.lines || []).forEach((l, j) => put(`${r.id}.${j}`, l.text)); qs(r.id, r.q); }
    for (const t of c.overheard) { (t.lines || []).forEach((l, j) => put(`${t.id}.${j}`, l.text)); qs(t.id, t.q); }
    if (c.librarian && c.librarian.lines) for (const [k, v] of Object.entries(c.librarian.lines)) (Array.isArray(v) ? v : [v]).forEach((x, i) => put(`lib.${k}.${i}`, typeof x === 'string' ? x : x && x.text));
    for (const [k, v] of Object.entries(c.notes || {})) (v.text || []).forEach((s, j) => put(`note.${k}.${j}`, s[0]));
    return out;
  }
  function check() {
    const bad = [];
    if (typeof CJK === 'undefined') return bad;
    for (const l of ['zh', 'ja']) for (const { where, s } of strings(l)) { const p = CJK.validate(s, l); if (p && p.length) bad.push({ where, s, p }); }
    return bad;
  }
  // ------------------------------------------------------------ the audit (DESIGN.md 16): questions ask only for what the piece taught or you know
  // READ._.audit(lang) → { lang, summary, items: [{ id, kind, band, q: [{ ask, outside, want }] }] }. outside: words a question's model
  // needs that the piece never uses and a new player at its band wouldn't know (MIX.baseline; the reader shows them before the
  // question at run time). want: the want's words, when none that would do is in the piece (lemmas: any one; need: each group;
  // points: as many as it asks for).
  function audit(lang = L()) {
    const c = C[lang];
    if (!c || typeof MIX === 'undefined' || typeof DICT === 'undefined' || !DICT.ready(lang)) return { lang, error: 'no content, no pack, or no mix.js' };
    const was = LEX.lang; LEX.lang = lang;          // (DICT and MIX read the language from LEX: switched for this synchronous run only)
    try {
      const cjl = isCJ(lang) && typeof CJK !== 'undefined', base = [0, 1, 2].map(p => MIX.baseline(p));
      const chars = s => (cjl ? CJK.chars(fill(s), { lang }) : fill(s));
      const lemma = id => { const e = DICT.entry(id), s = e ? e.lemma || id : id; return cjl ? CJK.chars(s, { lang }) : s; };
      const pieces = [].concat(c.books.map(x => ['book', x]), c.diary.map(x => ['diary', x]), c.radio.map(x => ['radio', x]), c.overheard.map(x => ['overheard', x]),
        Object.entries(c.notes || {}).map(([k, x]) => ['note', Object.assign({ id: lang + '.note.' + k }, x)]));
      const items = []; let qs = 0, outN = 0, wantN = 0;
      for (const [kind, it] of pieces) {
        const sents = [].concat(...(it.pages || [it.text || []])).map(s => s && s[0]).concat((it.lines || []).map(l => l && l.text)).filter(Boolean);
        const inText = new Set(), flatT = flat(sents.map(chars).join(' '));
        for (const s of sents) for (const w of MIX.words(fill(s))) inText.add(w.id);
        const inT = x => { const k = chars(String(x)); let ids = []; try { ids = (DICT.find(k) || []).map(e => e.id); } catch (e) { ids = []; } return ids.some(id => inText.has(id)) || (cjl ? flatT.includes(NORM(k)) : flatT.includes(flat(k))); };      // (zh / ja: 歌 is in 歌って, as the reader's own check finds it)
        const known = base[Math.min(2, Math.max(0, (it.band || 1) - 1))], rows = [];
        for (const q of [].concat(it.q || [], it.retell ? [Object.assign({ retell: true }, it.retell)] : [])) {
          qs++;
          const outside = [...new Set(MIX.ids(fill(q.model || '')))].filter(id => !inText.has(id) && !known.has(id)).map(lemma);
          const w = q.want || {}, miss = [];
          if (w.lemmas && w.lemmas.length && !w.lemmas.some(inT)) miss.push(w.lemmas.join('/'));
          if (Array.isArray(w.need)) w.need.forEach(g => { g = [].concat(g); if (!g.some(inT)) miss.push(g.join('/')); });
          if (w.points) { const got = w.points.filter(g => [].concat(g).some(inT)).length; if (got < (w.enough || Math.min(2, w.points.length))) w.points.forEach(g => { g = [].concat(g); if (!g.some(inT)) miss.push(g.join('/')); }); }
          if (outside.length) outN++; if (miss.length) wantN++;
          if (outside.length || miss.length) rows.push({ ask: q.retell ? '(retell)' : cjl ? CJK.plain(fill(q.ask || ''), { lang }) : fill(q.ask || ''), outside, want: miss });
        }
        items.push({ id: it.id, kind, band: it.band || 1, q: rows });
      }
      return { lang, summary: { pieces: items.length, questions: qs, modelsOutsideThePiece: outN, wantsOutsideThePiece: wantN }, items: items.filter(x => x.q.length) };
    } catch (e) { console.error('[read] audit', e); return { lang, error: String(e) }; }
    finally { LEX.lang = was; }
  }

  // ------------------------------------------------------------ the journal's Reading page (ui.js UI.journalTabs)
  const BAND = b => (typeof DICT !== 'undefined' && DICT.BANDS ? DICT.BANDS[b] : ['A0', 'A1', 'A2', 'B1', 'B2'][b]) || 'A1';
  const GRADE_CLS = g => 'rd-g' + (g || 'x').toLowerCase();
  const best = gs => (gs || []).reduce((b, g) => (STEP.indexOf(g) < STEP.indexOf(b) ? g : b), 'D');
  const REGION = { 1: 'Molinar and the Windmill Hills', 2: 'Remanso and the Mirror Lake', 3: 'the Quarry Caves', 4: 'the Bloom Gardens', 5: 'the Frost Peaks' };
  function journalHTML() {
    const s = S(), c = content();
    if (!c) return '<p class="empty">Nothing to read in this language yet.</p>';
    let h = '<div class="rd-j">';
    // Noa's diary
    const pages = c.diary.slice().sort((a, b) => a.region - b.region);
    if (pages.length) {
      const found = pages.filter(d => s.diary[d.id]);
      h += `<h4 class="ph-h">Noa’s diary (${found.length}/${pages.length})</h4><div class="rd-jgrid">`;
      for (const d of pages) {
        const r = s.diary[d.id];
        if (!r) { h += `<div class="rd-jcard rd-miss"><b>?</b><span>A page somewhere in ${esc(REGION[d.region] || 'the valley')}</span></div>`; continue; }
        h += `<div class="rd-jcard rd-diary"><i class="rd-band">${BAND(d.band)}</i><b>${html(d.title || d.place || '')}</b><span>${esc(d.en || REGION[d.region] || '')}</span>`
          + (r.grades && r.grades.length ? `<i class="rd-grade ${GRADE_CLS(best(r.grades))}">${best(r.grades)}</i>` : '') + `<button data-rd-open="diary:${esc(d.id)}">Read</button></div>`;
      }
      h += '</div>';
    }
    // books
    const read = c.books.filter(b => s.books[b.id] && (s.books[b.id].done || s.books[b.id].page));
    h += `<h4 class="ph-h">Books (${read.length} of ${c.books.length})</h4>`;
    h += read.length ? '<div class="rd-jgrid">' + read.map(b => {
      const r = s.books[b.id];
      return `<div class="rd-jcard"><i class="rd-band">${BAND(b.band)}</i><b>${html(b.title)}</b><span>${esc(b.en || '')}${r.done ? '' : ' · reading: page ' + ((r.page || 0) + 1)}</span>`
        + (r.grades && r.grades.length ? `<i class="rd-grade ${GRADE_CLS(best(r.grades))}">${best(r.grades)}</i>` : '') + `<button data-rd-open="book:${esc(b.id)}">${r.done ? 'Read again' : 'Go on'}</button></div>`;
    }).join('') + '</div>' : `<p class="empty">No books yet. Alba’s library is on the north street, just off the plaza.</p>`;
    // radio and overheard talk
    const shows = c.radio.filter(x => s.shows[x.id]), talks = c.overheard.filter(x => s.talks[x.id]);
    if (shows.length || talks.length) {
      h += `<h4 class="ph-h">Heard</h4><div class="rd-jlist">`;
      for (const x of shows) { const r = s.shows[x.id]; h += `<div>📻 <b>${html(x.title)}</b> <span>${esc(x.en || '')}</span>${r.grades && r.grades.length ? ` <i class="rd-grade ${GRADE_CLS(best(r.grades))}">${best(r.grades)}</i>` : ''}</div>`; }
      for (const x of talks) { const r = s.talks[x.id]; h += `<div>👂 <b>${esc(x.en || 'Overheard')}</b>${r.grades && r.grades.length ? ` <i class="rd-grade ${GRADE_CLS(best(r.grades))}">${best(r.grades)}</i>` : ''}${x.fact && s.facts[x.fact.id] ? `<small>${esc(x.fact.note || '')}</small>` : ''}</div>`; }
      h += '</div>';
    }
    for (const [k, n] of Object.entries(c.notes || {})) if (s.facts['note.' + k]) h += `<h4 class="ph-h">${esc(n.en || 'A note')}</h4><div class="rd-jgrid"><div class="rd-jcard rd-diary"><b>${html(n.title || '')}</b><button data-rd-open="note:${esc(k)}">Read</button></div></div>`;
    for (const m of MORE) { try { h += m.html() || ''; } catch (e) { console.error('[read] more', e); } }     // (D1: the radio quiz's album, the book club's card)
    h += `<p class="note">Tap any word while you read to see what it means. After a book, ${esc(mimo())} asks you what happened: your answers count toward your reading and listening level.</p>`;
    return h + '</div>';
  }
  // more sections for the Reading page: { show() → bool, html() → string, wire(el) } (D1: quiz.js and club.js push theirs here)
  const MORE = [];
  const journalTab = {
    id: 'read',
    label: () => (on() && (Object.keys(S().books).length || Object.keys(S().diary).length || Object.keys(S().shows).length || Object.keys(S().talks).length || S().lib.met || MORE.some(m => { try { return m.show && m.show(); } catch (e) { return false; } })) ? '📚 Reading' : null),
    html: () => journalHTML(),
    wire(el, state) {
      for (const m of MORE) if (m.wire) { try { m.wire(el, state); } catch (e) { console.error('[read] more', e); } }
      el.querySelectorAll('[data-rd-open]').forEach(b => b.onclick = async () => {
        const [kind, id] = b.dataset.rdOpen.split(':');
        if (typeof Sound !== 'undefined') Sound.play('page');
        try {
          if (kind === 'book' && typeof READER !== 'undefined') { const bk = find('books', id); if (bk) await READER.book(bk, { from: 'journal' }); }
          else if (kind === 'diary' && typeof DIARY !== 'undefined') await DIARY.read(id, { from: 'journal' });
          else if (kind === 'note' && typeof LIBRARY !== 'undefined') await LIBRARY.readNote(id, { from: 'journal' });
        } catch (e) { console.error('[read] journal', e); }
        if (G && G.journalOpen && typeof UI !== 'undefined') UI.journal(true, state);
      });
    },
  };

  // ------------------------------------------------------------ the map marks (minimap.js), the init and the per-frame update
  const MODS = () => [typeof LIBRARY !== 'undefined' && LIBRARY, typeof DIARY !== 'undefined' && DIARY, typeof RADIO !== 'undefined' && RADIO, typeof OVERHEARD !== 'undefined' && OVERHEARD,
    typeof QUIZ !== 'undefined' && QUIZ, typeof CLUB !== 'undefined' && CLUB].filter(Boolean);     // (QUIZ, CLUB: D1's radio quiz and book club)
  function mapMarks(dpr) {
    const out = [];
    for (const M of MODS()) if (M.mapMarks) { try { out.push(...(M.mapMarks(dpr) || [])); } catch (e) { /* */ } }
    return out;
  }
  function init(game) {
    G = game;
    S();
    for (const M of MODS()) if (M.init) { try { M.init(game); } catch (e) { console.error('[read]', e); } }
    if (typeof UI !== 'undefined') { UI.journalTabs = UI.journalTabs || []; if (!UI.journalTabs.includes(journalTab)) UI.journalTabs.push(journalTab); }
  }
  // every frame, outdoors and in (each piece's outdoor(dt, t, you) hides its own things where they don't belong; a piece that
  // throws is switched off, so the game always keeps running)
  const broken = new Set();
  function update(dt, t, you) {
    if (!G) return;
    for (const M of MODS()) if (M.outdoor && !broken.has(M)) { try { M.outdoor(dt, t, you); } catch (e) { console.error('[read] update', e); broken.add(M); } }
  }

  return {
    LANGS, KINDS, add, content, on, list, find, when, S, save, record, judge, judgeSource, localJudge, html, plain, esc, fill, mimo,
    BAND, best, STEP, REGION, strings, check, journalTab, journalHTML, mapMarks, init, update, more: MORE,
    get G() { return G; }, get lang() { return L(); },
    _: { C, NORM, context, hasWord, T, broken, contentCheck, talkWant, trustErrors, audit },
  };
})();
