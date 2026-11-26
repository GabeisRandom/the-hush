'use strict';
// The Quarry Caves in three worlds (DESIGN.md 18.10 "T2b", game/TIME.md "The Quarry Caves (T2b)"): Chapter 4's fourth place, a region TIME dresses
// itself, in Molinar's shape (time_molinar.js is the model).
//   time_quarry.js          QUART: the region, its three cracks, Noa's voice at the camp's entrance, Chapter 4's steps and echoes,
//                           the shared kit (names, saying and demonstrating, the S–D grader for habits and guesses, the ask box,
//                           pattern cards, words), the journal's "Quarry words" page, check() and test hooks
//   quarry_past(_text).js   the miners' camp long ago (the spring after the concert): QR_PAST, 7 people, the main path, 3 side quests
//   quarry_future(_text).js the camp tomorrow (abandoned, the lamps out): QR_FUT, 7 people frozen gray, 3 side quests
//   quarry_past_dungeon.js  QRKIT (a four-room mine kit) and QPDEEP: the old deep gallery (rooms at y 300, z −240, x −430 … −352)
//   quarry_future_dungeon.js QFDEEP: the collapsed deep mine (rooms at y 300, z −210, the same x)
//   quarry_time_boss.js     QRBOSS: Grandma Echo (the Past) and the Gray Mole (the Future), plug-ins on battle/flow.js
//   quarry_time_music.js    six songs (each world's area, dungeon and boss) and the miners' song (and Pío's whistle of it)
// The cracks (open with CH4.open('quarry'): after the lake's two echoes): by the mine's mouth (today ↔ the Past), by the bunkhouse
// (today ↔ the Future), at the camp's entrance (all three; Noa speaks there). State: TIME.state('quarry', 'past' | 'future' | 'now');
// flags: TIME.flag('past', 'qrSong' | 'qrDeep'), ('future', 'qrFree' | 'qrWarn'), ('now', 'qrPropped').
// The grammar (TIME.md §8, rung 3): the Past, the imperfect for habits («antes los mineros cantaban», «siempre», «cada día»); the
// Future, the future of guessing («¿Dónde estará?», «serán las ocho»). Each language its own (pt imperfeito / futuro do presente;
// de Präteritum + früher, immer, jeden Tag / «werden … wohl»; zh 以前 / 那时候 + 常常 / 每天 / 可能 · 大概 · 会; ja ～ていました /
// ～たものです / ～でしょう · ～かもしれません).
const QUART = (() => {
  if (typeof TIME === 'undefined') return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd;
  const G = () => A.G;
  const lang = () => A.lang();
  const isCl = l => l === 'zh' || l === 'ja';
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const L = (en, es, pt, de, zh, ja, o) => Object.assign({ en, es, pt, de, zh, ja }, o || {});
  const esc = s => A.esc(s);
  const wait = s => STORY.wait(s);
  const lock = on => { const g = G(); if (!g) return; g.sim.lock = on ? 1 : 0; if (!on) g.cam.override = null; };
  const shot = (pos, look, dur = 0.9) => { G().cam.override = { pos, look, dur }; };
  const mimoName = () => (G() && G().state && G().state.mimoName) || 'Mimo';
  const plainT = s => A.plainT(s);
  const down = (letter, n) => 'SABCD'[Math.max(0, Math.min(4, 'SABCD'.indexOf(letter) + n))];

  // ------------------------------------------------------------ where things are (checked with the probe in every world)
  const CEN = { x: 88, z: -266 }, RAD = 30;
  const CRACK = { past: { x: 80.6, z: -276.0 }, future: { x: 97.0, z: -270.5 }, gate: { x: 90.5, z: -255.5 } };
  const MOUTH = { x: 88, z: -276.6 };          // the mine's mouth (each world's way into its deep mine)
  // its reach in the other worlds: the camp's bowl and the top of the road up to it
  const inside = (x, z) => {
    try { return CAVES.bowlE(x, z) < 1.06 || (CAVES.roadDist(x, z) < 5.4 && z < -242 && z > -262); } catch (e) { return Math.hypot(x - CEN.x, z - CEN.z) < RAD; }
  };

  // ------------------------------------------------------------ the save's part
  const st = w => TIME.state('quarry', w);
  const R0 = s => (s && s.worlds && s.worlds.r && s.worlds.r.quarry) || {};
  const sp = s => R0(s).past || {}, sf = s => R0(s).future || {}, sn = s => R0(s).now || {};
  const seenIn = (s, k) => !!(s && s.worlds && s.worlds.seen && s.worlds.seen[k]);
  const echoIn = (s, w) => !!(s && s.ch4 && s.ch4.echoes && s.ch4.echoes['quarry.' + w]);

  // ------------------------------------------------------------ names: each language's own cast (QPTXT.CAST, QFTXT.CAST)
  const NOA = L('Noa', 'Noa', 'Noa', 'Noa', '[诺娅|Nuò yà]', 'ノア');
  const casts = () => [typeof QPTXT !== 'undefined' ? QPTXT.CAST : {}, typeof QFTXT !== 'undefined' ? QFTXT.CAST : {}];
  const nameOf = (T, l = lang()) => (!T ? '' : isCl(l) ? plainT(T[l] || T.en) : T[l] || T.en);
  const enName = (T, l) => { if (!T) return ''; if (l === 'es') return T.en; if (isCl(l)) { try { return CJK.roman(T[l], { lang: l }); } catch (e) { return T.en; } } return T[l] || T.en; };
  const fillMimo = (t, l = lang()) => String(t || '').replace(/\{mimo\}/g, isCl(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName());
  function fillEn(t, l = lang()) {
    let s = String(t || '');
    for (const C of casts()) s = s.replace(/\{([a-z]+)\}/g, (m, k) => (C[k] ? enName(C[k], l) : m));
    return s.replace(/\{mimo\}/g, mimoName()).replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }
  const enOf = (T, l) => (T && (T['en_' + l] || T.en)) || '';

  // ------------------------------------------------------------ words: the slots in a line's English ({w.qr_*}) and the marks of a
  // demonstration are met as they're said (LEX.expose), so the weave brings them in a few at a time and review keeps them
  const SLOT = /\{(w\.[a-z_]+)(?::(?:pl|f))?\}/g;
  function meet(T, marks) {
    if (typeof LEX === 'undefined') return;
    try {
      const en = String((T && T.en) || ''); let m; SLOT.lastIndex = 0;
      while ((m = SLOT.exec(en))) if (LEX.item(m[1])) LEX.expose(m[1]);
      const l = lang(), M = Array.isArray(marks) ? marks : (marks && marks[l]) || [];
      for (const x of M) if (typeof x === 'string' && LEX.item(x)) LEX.expose(x);
      if (T && T.words) T.words.forEach(id => { if (LEX.item(id)) LEX.expose(id); });
    } catch (e) { /* */ }
  }
  // a word you'll be asked for next: from now on it shows in the language, glossed
  const introduce = id => { try { if (STORY.introduce) STORY.introduce(id); else LEX.expose(id); } catch (e) { /* */ } };

  // ------------------------------------------------------------ saying things (mixed by the weave; a demonstration shows the
  // marked words glossed, whole in the language; the hushed keep only their *starred* words)
  function say(p, T) { if (!p || !T) return Promise.resolve(); const l = lang(); meet(T); p.lines = { en: fillEn(enOf(T, l), l), [l]: fillMimo(T[l] || '', l) }; return STORY.sayInline(p); }
  function demo(p, T, marks) {
    if (!p || !T) return Promise.resolve();
    meet(T, marks);
    const l = lang(), T2 = { en: fillEn(enOf(T, l), l) }; LANGS.forEach(x => { T2[x] = fillMimo(T[x] || '', x); });
    return STORY.demoLine(p, T2, marks);
  }
  function hushed(p, T) { if (!p || !T) return Promise.resolve(); const l = lang(); return STORY.sayHushed ? STORY.sayHushed(p, fillMimo(T[l] || '', l), fillEn(enOf(T, l), l)) : say(p, T); }
  const think = (s, d) => STORY.think(fillEn(s), d);
  const you = s => STORY.you(fillEn(s));
  // a two-shot from your side (time_alba.js's way)
  function frame2(p, side = 1, dist = 4.4) {
    if (!p) return;
    const Y = G().sim.you, dx = p.x - Y.x, dz = p.z - Y.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, y = p.y != null ? p.y : gy(p.x, p.z);
    shot(V((p.x + Y.x) / 2 - ux * dist * 0.55 + uz * side * 2.2, y + 2.4, (p.z + Y.z) / 2 - uz * dist * 0.55 - ux * side * 2.2), V((p.x + Y.x) / 2, y + 1.25, (p.z + Y.z) / 2));
  }
  // a thing you can look at: its word said aloud, shown in the language (glossed), and met; then a line about it
  function lookAt(id, line, dur = 5) {
    try { if (typeof LEX !== 'undefined' && LEX.item(id)) { introduce(id); const l = lang(), w = isCl(l) ? plainT(LEX.src(id)) : LEX.form(id, { article: true }); try { UI.speak(w); } catch (e) { /* (no voice) */ } } } catch (e) { /* */ }
    think(line, dur);
  }

  // ------------------------------------------------------------ the pattern cards (the grammar point, shown once)
  function css() {
    if (document.getElementById('qrt-css')) return;
    const s = document.createElement('style'); s.id = 'qrt-css';
    s.textContent = `.card.qr-card .ex { display: grid; grid-template-columns: auto auto; gap: 4px 14px; justify-content: center; margin: 10px 0 6px; font-size: 18px; }
.card.qr-card .ex b { color: #9a5a22; } .card.qr-card.fut .ex b, .card.qr-card.fut .tag { color: #5a62b0; }
.card.qr-card .note { max-width: 450px; margin: 6px auto 0; font-size: 14px; line-height: 1.45; } .card.qr-card .tag { color: #9a5a22; }
.card.qr-card .rows { text-align: left; max-width: 450px; margin: 8px auto 0; font-size: 14px; line-height: 1.5; }
.qr-words { columns: 2; column-gap: 18px; font-size: 13px; line-height: 1.5; margin: 6px 0 10px; } .qr-words li { break-inside: avoid; } .qr-words .no { opacity: .45; }`;
    document.head.appendChild(s);
  }
  const tHTML = (t, l) => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l, ruby: 'always' }) : esc(t));
  async function card(C, fut) {
    css();
    const l = lang(), c = C && C[l]; if (!c) return;
    const ex = (c.ex || []).map(([w, e]) => `<b>${tHTML(fillMimo(w, l), l)}</b><span>${esc(e)}</span>`).join('');
    await UI.card(`<div class="tag">${esc(fillEn(C.tag, l))}</div>${ex ? `<div class="ex">${ex}</div>` : ''}<div class="note">${esc(fillEn(c.note, l))}</div><div class="sub">E</div>`, { kind: 'qr-card' + (fut ? ' fut' : '') });
  }

  // ------------------------------------------------------------ grading what you say (S–D: one letter down per miss; "I don't
  // know", the whole sentence on «?», counts as two). T: want (the right form: S; an A with an accent missing or none of `more`),
  // alt (right, a little off: A), aux (de: B), person (the right time, someone else: B), aspect (the Past: one time, not a habit,
  // «cantaron» for «cantaban»: B), and the misses with a tip: pres (now), past (yesterday, in the Future), fut (tomorrow, in the
  // Past). Items: a string as a word (zh / ja: CJK.contains), a list: all of them.
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const fold = (s, lg) => { let t = nrm(s); if (lg === 'de') t = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'); return t; };
  const words = (s, lg) => ' ' + fold(s, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const hasCJ = (text, src, l) => {
    if (typeof CJK === 'undefined') return false;
    try { const ch = CJK.chars(src, { lang: l }).replace(/\s+/g, ''); if (/[぀-ヿ一-鿿]/.test(ch) && String(text || '').replace(/\s+/g, '').includes(ch)) return true; } catch (e) { /* */ }
    try { if (CJK.contains(text, src, l)) return true; } catch (e) { /* */ }
    // (pinyin typed as whole words, «kěnéng» / «keneng», can split the wrong way, ken + eng: match the word's letters joined)
    if (l === 'zh') { try { const py = nrm(CJK.roman(src, { lang: 'zh' })).replace(/[^a-z]/g, ''); if (py.length >= 4 && nrm(text).replace(/[^a-z]/g, '').includes(py)) return true; } catch (e) { /* */ } }
    return false;
  };
  function has(text, item, lg) {
    if (Array.isArray(item)) return item.every(x => has(text, x, lg));
    if (isCl(lg)) return hasCJ(text, item, lg);
    return words(text, lg).includes(' ' + fold(item, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ');
  }
  const accented = (text, item, lg) => { if (isCl(lg) || Array.isArray(item)) return true; const t = ' ' + String(text).toLowerCase().replace(/[¡!¿?.,;:«»"“”()]/g, ' ').replace(/\s+/g, ' ') + ' '; return t.includes(' ' + String(item).toLowerCase() + ' '); };
  const showForm = x => (Array.isArray(x) ? x.join(' … ') : x);
  const exact = (text, item, lg) => (isCl(lg) ? has(text, item, lg) : Array.isArray(item) ? item.every(x => exact(text, x, lg)) : accented(text, item, lg));
  function grade(T, text, lg, TIPS = {}) {
    const model = plainT(fillMimo((T.model || {})[lg] || '', lg)).replace(/\s*[.。]\s*$/, '');
    const tip = k => String((((T.tips || {})[k] || TIPS[k] || {})[lg]) || '').replace('{form}', model);
    const first = (key, fn = has) => ((T[key] || {})[lg] || []).find(x => fn(text, x, lg));
    // a veto: the right form, but said the other way («nunca» missing in «¿cantaba?» → «no, nunca cantaba»)
    const v = first('veto'); if (v) return { ok: false, kind: 'veto', why: tip('veto') };
    // one time, not a habit («cantaron», zh 唱了, ja 歌いました): checked first, so a bare verb's A or a habit word can't hide it
    const as0 = first('aspect', exact); if (as0) return { ok: true, letter: 'B', kind: 'aspect', why: tip('aspect') || `«${model}»` };
    // the right form: an accent missing costs nothing (P6a, accents.js; tip: the accented form), unless what you typed is, as typed,
    // another form the task tells apart («canto», I sing, for «cantó», he sang: then the A stays, and why says why)
    const w = first('want');
    if (w) {
      const mo = !((T.more || {})[lg] || []).length || T.more[lg].some(x => has(text, x, lg));
      const others = ['alt', 'aux', 'person', 'aspect', 'past', 'pres', 'fut', 'miss'].flatMap(k => ((T[k] || {})[lg] || []).flat());
      const ac = typeof ACCENTS !== 'undefined' ? ACCENTS.judge(text, w, lg, { others }) : { keep: !accented(text, w, lg), why: `Accent: «${plainT(showForm(w))}»`, tip: '' };
      return { ok: true, letter: !ac.keep && mo ? 'S' : 'A', kind: 'right', why: ac.keep ? ac.why : !mo ? tip('more') || `Right! The whole sentence for an S: «${model}»` : 'Just right!', tip: ac.tip || '' };
    }
    const a = first('alt'); if (a) return { ok: true, letter: 'A', kind: 'alt', why: tip('alt') || 'Right!' };
    const x = first('aux'); if (x) return { ok: true, letter: 'B', kind: 'aux', why: tip('aux') || `«${model}»` };
    // the wrong person, aspect or time: the exact spelling first («canto», I sing, is now, not «cantó» without its accent)
    for (const fn of [exact, has]) {
      const p = first('person', fn); if (p) return { ok: true, letter: 'B', kind: 'person', why: tip('person') || `«${model}»` };
      const asp = first('aspect', fn); if (asp) return { ok: true, letter: 'B', kind: 'aspect', why: tip('aspect') || `«${model}»` };
      for (const k of ['past', 'pres', 'fut', 'miss']) { const m = first(k, fn); if (m) return { ok: false, kind: k, why: tip(k) }; }
    }
    return { ok: false, kind: 'none' };
  }
  // one task, asked until it's said (or you close the box): the frame and the chips on the box, the model on «?»
  // o: { icon, tips, title, hint, onMiss(g, misses) }
  async function ask(T, o = {}) {
    const lg = lang(), tips = o.tips || {};
    const frame = plainT(fillMimo((T.frame || {})[lg] || '', lg)), chips = ((T.chips || {})[lg] || []).map(([w, e]) => `${plainT(fillMimo(w, lg))} (${e})`).join(' · ');
    const modelRaw = fillMimo((T.model || {})[lg] || '', lg), model = plainT(modelRaw);
    if (T.words) T.words.forEach(introduce);
    let misses = 0;
    for (;;) {
      const r = await UI.command({ name: mimoName(), icon: o.icon || 'star', title: fillEn(o.title || T.title, lg), verbs: [], model: modelRaw, modelEn: fillEn((T.model || {}).en || '', lg), placeholder: `«${frame}»`,
        hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}. ${o.hint ? fillEn(o.hint) + ' ' : ''}Stuck? ? shows the whole sentence.` });
      if (!r || r.cancelled) return null;
      const h = document.getElementById('command-hint'), peeked = !!(h && /^Try/.test(h.textContent || ''));
      const g = grade(T, r.text, lg, tips);
      if (g.ok) {
        const letter = down(g.letter, misses + (peeked ? 2 : 0)), why = g.why === 'Just right!' && (misses || peeked) ? (peeked ? 'Right, with the example' : 'Right, on another try') : g.why;
        UI.toast(`${letter} · ${why}${g.tip ? ' · ' + g.tip : ''}`); snd(letter === 'S' ? 'chest' : 'review');
        try { if (T.words && typeof LEX !== 'undefined') T.words.forEach(id => { if (LEX.item(id) && LEX.heard(id, r.text)) LEX.attempt(id, { ok: true, hints: misses + (peeked ? 2 : 0), ms: r.ms || 4000, mode: 'teach' }); }); } catch (e) { /* */ }
        return { letter, text: r.text, ms: r.ms, kind: g.kind };
      }
      misses++; snd('wrong'); try { G().sim.mimo.tiltT = 1.4; } catch (e) { /* */ }
      if (o.onMiss) { try { await o.onMiss(g, misses); } catch (e) { /* */ } }
      think(g.kind !== 'none' && g.why ? g.why : misses >= 2 ? `Like this: «${model}»` : `Not quite… «${frame}»${chips ? ' · ' + chips : ''}`, 6.5);
    }
  }
  // Mimo's moves, told in the world's time: a memory in the Past (PTXT.PV's 3rd-person preterites); a plan in the Future
  // (MOLT.planTask, Molinar's rung: «{mimo} empujará…»)
  const EN_V = { 'v.push': 'pushed', 'v.jump': 'jumped', 'v.sing': 'sang', 'v.hit': 'hit', 'v.climb': 'climbed', 'v.dig': 'dug' };
  const PRES = {
    'v.push': { es: ['empuja', 'empujar', 'empujo'], pt: ['empurra', 'empurrar'], de: ['schiebt', 'schieb', 'schieben'], zh: ['[推|tuī]'], ja: ['[押|お]して', '[押|お]す', '[押|お]します'] },
    'v.jump': { es: ['salta', 'saltar', 'brinca'], pt: ['pula', 'pular', 'salta'], de: ['springt', 'spring', 'springen'], zh: ['[跳|tiào]'], ja: ['[跳|と]んで', '[跳|と]ぶ', '[跳|と]びます'] },
    'v.sing': { es: ['canta', 'cantar', 'canto'], pt: ['canta', 'cantar'], de: ['singt', 'sing', 'singen'], zh: ['[唱|chàng]', '[唱歌|chàng gē]'], ja: ['[歌|うた]って', '[歌|うた]う', '[歌|うた]います'] },
    'v.hit': { es: ['golpea', 'golpear', 'pega'], pt: ['bate', 'bater'], de: ['schlägt', 'schlag', 'schlagen'], zh: ['[打|dǎ]'], ja: ['[打|う]って', '[叩|たた]いて', '[打|う]つ'] },
    'v.climb': { es: ['trepa', 'trepar', 'sube', 'subir'], pt: ['sobe', 'subir'], de: ['klettert', 'kletter', 'klettern'], zh: ['[爬|pá]'], ja: ['[登|のぼ]って', '[登|のぼ]る'] },
  };
  const chipOf = (f, lg) => (Array.isArray(f) ? (lg === 'de' ? f[f.length - 1] : f.join(' ')) : f);
  function memTask(M) {
    const pv = (typeof PTXT !== 'undefined' && PTXT.PV[M.verb]) || {}, chips = {};
    LANGS.forEach(lg => { const f = (pv[lg] || [])[0]; if (f) chips[lg] = [[chipOf(f, lg), EN_V[M.verb] || '']]; });
    return { title: M.title, frame: M.frame, chips, model: M.model, more: M.more, words: M.words, want: { es: pv.es, pt: pv.pt, de: pv.de, zh: pv.zh, ja: pv.ja }, alt: { de: pv.de2 }, pres: PRES[M.verb] || {},
      tips: { pres: { es: 'That’s now. In the Past, {mimo} only moves in memories: «{form}».', pt: 'That’s now. In the Past, {mimo} only moves in memories: «{form}».', de: 'That’s now. In the Past: «{form}».', zh: 'It already happened: 了 after the verb, «{form}».', ja: 'That’s now. In the Past: ～た, «{form}».' },
        alt: { de: 'Right! In speech Germans would say «{form}».' } } };
  }
  const planTask = M => (typeof MOLT !== 'undefined' && MOLT && MOLT.planTask ? Object.assign(MOLT.planTask(M), { words: M.words }) : null);

  // ------------------------------------------------------------ the people TIME builds (TIME.people), by world and id
  function person(w, id) {
    const list = TIME.people && TIME.people.all['quarry:' + w]; if (!list) return null;
    const P = list.find(q => q.def.id === id); if (!P) return null;
    P.api.name = nameOf(P.def.name); return P;
  }
  const who = (w, id) => { const P = person(w, id); return P ? P.api : null; };

  // ------------------------------------------------------------ Noa, through the crack at the camp's entrance (DESIGN.md 18.5)
  const TXT = {
    'noa.open1': L('It’s Noa! Can you hear me? This crack carries the whole camp to me… and two more of Elio’s echoes: one in the {w.qr_mine} long ago, one in the {w.qr_mine} tomorrow.',
      '¡Soy Noa! ¿Me oyes? Esta grieta me trae todo el campamento… y dos ecos más de Elio: uno en la mina de antes, otro en la mina de mañana.',
      'É a Noa! Você me ouve? Esta fenda me traz o acampamento inteiro… e mais dois ecos do Elio: um na mina de antigamente, outro na mina de amanhã.',
      'Ich bin’s, Noa! Hörst du mich? Dieser Riss trägt mir das ganze Lager zu … und noch zwei Echos von Elio: eins in der Mine von früher, eins in der Mine von morgen.',
      '[是|shì] [我|wǒ] ， [诺娅|Nuò yà] ！ [你|nǐ] [听得见|tīng de jiàn] [吗|ma] ？ [这|zhè] [道|dào] [裂缝|liè fèng] [把|bǎ] [整个|zhěng gè] [营地|yíng dì] [的|de] [声音|shēng yīn] [带|dài] [给|gěi] [我|wǒ] … [还有|hái yǒu] [艾利欧|Ài lì ōu] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] ： [一|yī] [个|gè] [在|zài] [从前|cóng qián] [的|de] [矿|kuàng] [里|lǐ] ， [一|yī] [个|gè] [在|zài] [明天|míng tiān] [的|de] [矿|kuàng] [里|lǐ] 。',
      'ノア だ よ ！ [聞|き]こえる ？ この [裂|さ]け[目|め] から 、 キャンプ の [音|おと] が ぜんぶ [聞|き]こえる … それ と 、 エリオ の こだま が あと [二|ふた]つ 。 [昔|むかし] の [鉱山|こうざん] に [一|ひと]つ 、 [明日|あした] の [鉱山|こうざん] に [一|ひと]つ 。'),
    'noa.open2': L('Long ago, the {w.qr_spring} after the concert, a quiet boy stayed with the {w.qr_miner:pl}. They sang every day as they worked. He only listened.',
      'Hace mucho, la primavera después del concierto, un niño callado se quedó con los mineros. Ellos cantaban cada día mientras trabajaban. Él solo escuchaba.',
      'Há muito tempo, na primavera depois do concerto, um menino calado ficou com os mineiros. Eles cantavam todo dia enquanto trabalhavam. Ele só escutava.',
      'Vor langer Zeit, im Frühling nach dem Konzert, blieb ein stiller Junge bei den Bergleuten. Sie sangen jeden Tag bei der Arbeit. Er hörte nur zu.',
      '[很久|hěn jiǔ] [以前|yǐ qián] ， [音乐会|yīn yuè huì] [后|hòu] [的|de] [那|nà] [个|gè] [春天|chūn tiān] ， [一个|yī gè] [不|bù] [说话|shuō huà] [的|de] [男孩|nán hái] [跟|gēn] [矿工|kuàng gōng] [们|men] [住|zhù] [在|zài] [一起|yī qǐ] 。 [矿工|kuàng gōng] [们|men] [每天|měi tiān] [一边|yī biān] [干活|gàn huó] [一边|yī biān] [唱歌|chàng gē] 。 [他|tā] [只是|zhǐ shì] [听|tīng] 。',
      'ずっと [昔|むかし] 、 コンサート の あと の [春|はる] 、 [無口|むくち] な [男|おとこ] の [子|こ] が [鉱夫|こうふ] たち と いっしょ に いた の 。 みんな [毎日|まいにち] 、 [働|はたら]き ながら [歌|うた]って いた 。 その [子|こ] は [聞|き]いて いる だけ だった 。'),
    'noa.open3': L('Step into the Past: the miners of then will remember him. In there, tell how things used to be, what people did {w.qr_everyday}. Through the crack by the mine’s mouth, or this one.',
      'Entra en el Ayer: los mineros de entonces lo recordarán. Allí, cuenta cómo eran las cosas antes, lo que la gente hacía cada día. Por la grieta junto a la boca de la mina, o por esta.',
      'Entra no Ontem: os mineiros daquela época vão se lembrar dele. Lá, conta como as coisas eram antes, o que as pessoas faziam todo dia. Pela fenda perto da boca da mina, ou por esta.',
      'Geh ins Gestern: Die Bergleute von damals werden sich an ihn erinnern. Erzähl dort, wie es früher war, was die Leute jeden Tag taten. Durch den Riss am Eingang der Mine oder durch diesen hier.',
      '[去|qù] [昨天|zuó tiān] [吧|ba] ： [那时候|nà shí hou] [的|de] [矿工|kuàng gōng] [会|huì] [记得|jì de] [他|tā] 。 [在|zài] [那里|nà lǐ] ， [说说|shuō shuo] [以前|yǐ qián] [是|shì] [什么|shén me] [样子|yàng zi] ， [大家|dà jiā] [每天|měi tiān] [做|zuò] [什么|shén me] 。 [从|cóng] [矿|kuàng] [口|kǒu] [旁边|páng biān] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[昨日|きのう] へ [行|い]って 。 その ころ の [鉱夫|こうふ] たち が 、 かれ を [覚|おぼ]えて いる はず 。 そこ で は 、 [昔|むかし] は どう だった か 、 みんな が [毎日|まいにち] [何|なに] を して いた か を [話|はな]して ね 。 [鉱山|こうざん] の [入|い]り[口|ぐち] の そば の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から 。'),
    'noa.past1': L('That was his voice… He wanted to sing too, and he never dared. Now it’s free. Thank you.',
      'Esa era su voz… Él también quería cantar, y nunca se atrevió. Ahora está libre. Gracias.',
      'Era a voz dele… Ele também queria cantar, e nunca teve coragem. Agora está livre. Obrigada.',
      'Das war seine Stimme … Er wollte auch singen und hat sich nie getraut. Jetzt ist sie frei. Danke.',
      '[那|nà] [是|shì] [他|tā] [的|de] [声音|shēng yīn] … [他|tā] [也|yě] [想|xiǎng] [唱歌|chàng gē] ， [可是|kě shì] [一直|yī zhí] [不|bù] [敢|gǎn] 。 [现在|xiàn zài] [它|tā] [自由|zì yóu] [了|le] 。 [谢谢|xiè xie] [你|nǐ] 。',
      'あれ は かれ の [声|こえ] … かれ も [歌|うた]いたかった の に 、 [一度|いちど] も [歌|うた]えなかった 。 やっと [自由|じゆう] に なった ね 。 ありがとう 。'),
    'noa.past2': L('Now tomorrow. In the Future the {w.qr_mine} is abandoned, the camp is {w.qr_empty} and the lamps are out. Someone is still there, by the fire pit. Go through the crack by the bunkhouse, or this one.',
      'Ahora, el mañana. En el Mañana la mina está abandonada, el campamento vacío y las lámparas apagadas. Alguien sigue allí, junto a la fogata. Entra por la grieta junto a la barraca, o por esta.',
      'Agora, o amanhã. No Amanhã a mina está abandonada, o acampamento vazio e as lâmpadas apagadas. Alguém ainda está lá, perto da fogueira. Entra pela fenda perto do alojamento, ou por esta.',
      'Jetzt das Morgen. Im Morgen ist die Mine verlassen, das Lager leer, und die Lampen sind aus. Jemand ist noch da, bei der Feuerstelle. Geh durch den Riss an der Baracke oder durch diesen hier.',
      '[现在|xiàn zài] [去|qù] [明天|míng tiān] 。 [在|zài] [明天|míng tiān] ， [矿|kuàng] [被|bèi] [废弃|fèi qì] [了|le] ， [营地|yíng dì] [空|kōng] [了|le] ， [灯|dēng] [也|yě] [灭|miè] [了|le] 。 [火堆|huǒ duī] [旁边|páng biān] [还有|hái yǒu] [一个|yī gè] [人|rén] 。 [走|zǒu] [宿舍|sù shè] [旁边|páng biān] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[次|つぎ] は [明日|あした] 。 [明日|あした] の [鉱山|こうざん] は [見捨|みす]てられて 、 キャンプ は からっぽ 。 ランプ も [消|き]えて いる 。 でも 、 たき[火|び] の そば に 、 まだ だれ か いる 。 [宿舎|しゅくしゃ] の そば の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から [行|い]って 。'),
    'noa.fut1': L('He’ll sing with them one day. I can almost hear it already.',
      'Algún día cantará con ellos. Ya casi puedo oírlo.',
      'Um dia ele vai cantar com eles. Eu já quase consigo ouvir.',
      'Eines Tages wird er mit ihnen singen. Ich kann es schon fast hören.',
      '[总有一天|zǒng yǒu yī tiān] [他|tā] [会|huì] [跟|gēn] [他们|tā men] [一起|yī qǐ] [唱歌|chàng gē] 。 [我|wǒ] [好像|hǎo xiàng] [已经|yǐ jīng] [听到|tīng dào] [了|le] 。',
      'いつか 、 かれ は みんな と [歌|うた]う でしょう 。 もう [聞|き]こえる [気|き] が する 。'),
    'noa.fut2': L('That’s both of the quarry’s echoes. The next cracks will open in the Bloom Gardens… I’ll call you when they do.',
      'Ya tienes los dos ecos de la cantera. Las próximas grietas se abrirán en los Jardines en Flor… Te llamaré cuando se abran.',
      'Você já tem os dois ecos da pedreira. As próximas fendas vão se abrir nos Jardins em Flor… Eu te chamo quando abrirem.',
      'Das sind beide Echos vom Steinbruch. Die nächsten Risse öffnen sich in den Blütengärten … Ich rufe dich, wenn es so weit ist.',
      '[采石场|cǎi shí chǎng] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] [都|dōu] [找到|zhǎo dào] [了|le] 。 [下|xià] [一|yī] [道|dào] [裂缝|liè fèng] [会|huì] [在|zài] [花园谷|Huā yuán gǔ] [打开|dǎ kāi] … [到|dào] [时候|shí hou] [我|wǒ] [会|huì] [叫|jiào] [你|nǐ] 。',
      'これ で [採石場|さいせきじょう] の こだま は [二|ふた]つ と も そろった 。 [次|つぎ] の [裂|さ]け[目|め] は [花園|はなぞの] で [開|ひら]く … その とき は [呼|よ]ぶ ね 。'),
  };
  // Elio's echoes here (CH4.word): the Past's, the boy who listened and never sang; the Future's, what the man would still like to say
  const ECHO = {
    past: L('I wanted to sing too.', 'Yo también quería cantar.', 'Eu também queria cantar.', 'Ich wollte auch singen.',
      '[那时候|nà shí hou] ， [我|wǒ] [也|yě] [想|xiǎng] [唱歌|chàng gē] 。', 'ぼく も 、 [歌|うた]いたかった 。', { where: 'the Quarry Caves, long ago' }),
    future: L('This time, I’ll sing with you.', 'Esta vez, cantaré con ustedes.', 'Desta vez, eu vou cantar com vocês.', 'Diesmal werde ich mit euch singen.',
      '[这|zhè] [一|yī] [次|cì] ， [我|wǒ] [会|huì] [跟|gēn] [你们|nǐ men] [一起|yī qǐ] [唱|chàng] 。', '[今度|こんど] は 、 みんな と いっしょ に [歌|うた]います 。', { where: 'the Quarry Caves, tomorrow' }),
  };
  if (typeof CH4 !== 'undefined') { CH4.word('quarry', 'past', ECHO.past); CH4.word('quarry', 'future', ECHO.future); }

  // Noa's voice comes out of the crack: it flares while she talks (its glow swells), and her name tag is hers
  let flare = 0;
  function noaP() { const c = CRACK.gate, y = gy(c.x, c.z); return { id: 'noa', name: nameOf(NOA), x: c.x, y: y + 0.3, z: c.z, top: 2.5, talking: false }; }
  async function noaSay(key) { flare = 1; snd('chime'); const p = noaP(); try { G().w3d.fx.sparkle(p.x, p.y + 1.4, p.z, 12, ['#bfe4ff', '#fff3c8', '#ffd7a0']); } catch (e) { /* */ } await say(p, TXT[key]); }
  function lookGate() { const c = CRACK.gate, y = gy(c.x, c.z), Y = G().sim.you, dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1; shot(V(c.x + dx / d * 5.2 + dz / d * 2.4, y + 2.4, c.z + dz / d * 5.2 - dx / d * 2.4), V(c.x, y + 1.5, c.z), 1.0); }
  // the crack card's examples, each language's own: a habit, a habit word, a guess, a guess about the hour
  const CRACK_EX = { es: ['antes los mineros cantaban', 'cada día', '¿dónde estará?', 'serán las ocho'], pt: ['antes os mineiros cantavam', 'todo dia', 'onde estará?', 'serão oito horas'],
    de: ['früher sangen die Bergleute', 'jeden Tag', 'wo wird er wohl sein?', 'es wird wohl acht Uhr sein'],
    zh: ['[以前|yǐ qián] [矿工|kuàng gōng] [们|men] [每天|měi tiān] [唱歌|chàng gē]', '[每天|měi tiān]', '[他|tā] [可能|kě néng] [在|zài] [哪里|nǎ lǐ] ？', '[大概|dà gài] [八|bā] [点|diǎn] [了|le]'],
    ja: ['[昔|むかし] は [毎日|まいにち] [歌|うた]って いました', '[毎日|まいにち]', 'どこ に いる でしょう ？', '[八時|はちじ] でしょう'] };
  async function crackCard() {
    css();
    const l = lang(), nm = w => { const t = TIME.RULES[w].name[l] || TIME.RULES[w].name.en; return isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t); };
    const ex = (CRACK_EX[l] || CRACK_EX.es).map(t => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t)));
    await UI.card(`<div class="tag">The quarry’s time cracks</div><div class="rows">`
      + `• By the <b>mine’s mouth</b>: today ↔ «${nm('past')}», the camp about 40 years ago, the mine in its best years.<br>`
      + `• By the <b>bunkhouse</b>: today ↔ «${nm('future')}», the camp if nobody speaks up.<br>`
      + `• Here, at the <b>camp’s entrance</b>: all three. Noa’s voice comes through this one: report to her here.<br>`
      + `In the Past, tell <b>how things used to be</b>, what people did every day («${ex[0]}», «${ex[1]}»). In the Future nobody knows where anyone is: <b>guess</b> («${ex[2]}», «${ex[3]}»).</div><div class="sub">E</div>`, { kind: 'qr-card' });
  }
  async function noaOpen() {
    lock(true);
    try {
      lookGate(); await wait(0.9);
      await noaSay('noa.open1'); await noaSay('noa.open2'); await noaSay('noa.open3');
      flare = 0; await crackCard();
      TIME.seen('quarry.noa', true); G().save();
    } finally { flare = 0; lock(false); }
    think('Into the Past, to the forewoman by the mine’s mouth. The crack by the mine’s mouth leads there, and so does this one.', 6);
  }
  async function reportPast() {
    lock(true);
    try { lookGate(); await wait(0.6); await noaSay('noa.past1'); await noaSay('noa.past2'); st('past').reported = true; G().save(); } finally { flare = 0; lock(false); }
    think('Next: the camp tomorrow. The crack by the bunkhouse leads there.', 5);
  }
  async function reportFuture() {
    lock(true);
    try {
      lookGate(); await wait(0.6); await noaSay('noa.fut1'); await noaSay('noa.fut2'); st('future').reported = true;
      try { if (typeof QUESTS !== 'undefined' && QUESTS.tick) QUESTS.tick(); } catch (e) { /* */ }
      G().save();
    } finally { flare = 0; lock(false); }
  }

  // ------------------------------------------------------------ the region: TIME dresses both worlds (quarry_past.js fills DRESS.past,
  // quarry_future.js DRESS.future); while you're inside a world's deep mine the dungeon does its own look, so `look` steps aside
  const DRESS = {
    past: { edge: 'The memory ends here… The camp of long ago is only this bowl in the mountains. Let’s stay where it happened.' },
    future: { edge: 'Past the camp, tomorrow’s gray fog is too thick to see. Let’s turn back.', k: () => 0.12 },
  };
  Object.defineProperty(DRESS.past, 'look', { get: () => (typeof QPDEEP !== 'undefined' && QPDEEP && QPDEEP.inside ? null : 'past'), enumerable: true, configurable: true });
  Object.defineProperty(DRESS.future, 'look', { get: () => (typeof QFDEEP !== 'undefined' && QFDEEP && QFDEEP.inside ? null : 'future'), enumerable: true, configurable: true });
  Object.assign(TIME.STEPS, { impfhab: 'the imperfect for habits (antes los mineros cantaban, siempre, cada día)', futprob: 'the future of guessing (¿dónde estará?, serán las ocho, habrá…)' });
  const songOf = w => () => {
    if (w === 'past') return typeof QR_PAST !== 'undefined' && QR_PAST && QR_PAST.song ? QR_PAST.song() : 'qr_past';
    return typeof QR_FUT !== 'undefined' && QR_FUT && QR_FUT.song ? QR_FUT.song() : 'qr_future';
  };
  TIME.region('quarry', {
    name: { now: 'The Miners’ Camp', past: 'The Miners’ Camp, long ago', future: 'The Miners’ Camp · tomorrow' },
    color: { past: '#b9853e', future: '#6b6e80' },
    center: CEN, radius: RAD, inside,
    open: () => (typeof CH4 !== 'undefined' ? CH4.open('quarry') : false),
    grammar: { past: ['impfhab'], future: ['futprob'] },
    songs: { past: songOf('past'), future: songOf('future') },
    dress: DRESS,
    init: api => init(api),
    tick: (api, dt) => tick(dt),
    changed: (api, fw, tw) => { for (const M of [typeof QR_PAST !== 'undefined' && QR_PAST, typeof QR_FUT !== 'undefined' && QR_FUT]) if (M && M.changed) { try { M.changed(fw, tw); } catch (e) { console.error('[quarry] changed', e); } } },
  });
  TIME.crack('quarry.mouth', { region: 'quarry', x: CRACK.past.x, z: CRACK.past.z, worlds: ['now', 'past'] });
  TIME.crack('quarry.bunk', { region: 'quarry', x: CRACK.future.x, z: CRACK.future.z, worlds: ['now', 'future'] });
  TIME.crack('quarry.gate', { region: 'quarry', x: CRACK.gate.x, z: CRACK.gate.z, worlds: ['now', 'past', 'future'] });

  function init(api) {
    try { registerWords(); } catch (e) { console.error('[quarry] words', e); }
    try { addTab(); } catch (e) { console.error('[quarry] journal', e); }
    for (const [M, tag] of [[typeof QR_PAST !== 'undefined' && QR_PAST, 'past'], [typeof QR_FUT !== 'undefined' && QR_FUT, 'future'],
      [typeof QPDEEP !== 'undefined' && QPDEEP, 'past deep'], [typeof QFDEEP !== 'undefined' && QFDEEP, 'future deep'], [typeof QRBOSS !== 'undefined' && QRBOSS, 'bosses']])
      if (M && M.init) { try { M.init(api.G, api); } catch (e) { console.error('[quarry] init ' + tag, e); } }
  }

  // ------------------------------------------------------------ every frame, in any world: Noa (her first words here, the reports)
  let idle = 0;
  const busyNow = g => STORY.busy || STORY.line || g.sim.lock || g.journalOpen || g.state.teaching || TIME.busy
    || document.body.classList.contains('in-battle') || document.body.classList.contains('on-title') || (g.indoorMod && g.indoorMod() && g.indoorMod() !== TIME);
  function tick(dt) {
    const g = G(); if (!g || !g.state) return;
    flare = Math.max(0, flare - dt * 0.35);
    const M = TIME._.VIS && TIME._.VIS['quarry.gate']; if (M && M.glow) { const k = 1 + flare * 0.9; M.glow.scale.set(3.4 * k, 4.2 * k, 1); }
    if (!TIME.open('quarry') || busyNow(g)) { idle = 0; return; }
    const w = TIME.world(), Y = g.sim.you, c = CRACK.gate, d = Math.hypot(Y.x - c.x, Y.z - c.z), s = g.state;
    const P = sp(s), F = sf(s);
    let run = null;
    if (w === 'now' && !TIME.seen('quarry.noa') && d < 7) run = noaOpen;
    else if (d < 3.4 && (w === 'now' || TIME.regionNow() === 'quarry')) {
      if (echoIn(s, 'past') && !P.reported) run = reportPast;
      else if (echoIn(s, 'future') && !F.reported && P.reported) run = reportFuture;
    }
    if (!run) { idle = 0; return; }
    if ((idle += dt) < 0.6) return;
    idle = 0; STORY.run(run);
  }

  // ------------------------------------------------------------ Chapter 4 here: the main quest's steps, in order (CH4.ORDER)
  // where the compass points: someone in the world they're in, or the crack that leads there from where you are
  function via(want, whoFn) {
    const w = TIME.world(), C = TIME.CRACKS;
    if (w === want) return whoFn ? whoFn() : null;
    const c = want === 'past' ? (w === 'future' ? C['quarry.gate'] : C['quarry.mouth'])
      : want === 'future' ? (w === 'past' ? C['quarry.gate'] : C['quarry.bunk'])
      : (w === 'past' ? C['quarry.mouth'] : C['quarry.bunk']);
    const nm = { past: 'the Past', future: 'the Future', now: 'today' }[want];
    return c ? { x: c.x, z: c.z, hint: `{mimo} looks at the time crack: ${nm} is through there.` } : null;
  }
  const gateT = () => ({ x: CRACK.gate.x, z: CRACK.gate.z, hint: '{mimo} looks at the time crack at the camp’s entrance. Noa’s voice is in it.' });
  // examples inside English text (steps, quests, hints): each language's own, zh / ja in the mode's text
  const SX = {
    habit3: { es: ['escuchaba', 'se sentaba'], pt: ['escutava', 'sentava'], de: ['er hörte zu', 'er saß'], zh: ['[他|tā] [每天|měi tiān] [听|tīng]', '[他|tā] [常常|cháng cháng] [坐|zuò] [在|zài] [那里|nà lǐ]'], ja: ['[聞|き]いて いました', '[座|すわ]って いました'] },
    habit: { es: ['antes los mineros cantaban', 'cada día', 'siempre'], pt: ['antes os mineiros cantavam', 'todo dia', 'sempre'], de: ['früher sangen die Bergleute', 'jeden Tag', 'immer'],
      zh: ['[以前|yǐ qián] [矿工|kuàng gōng] [们|men] [每天|měi tiān] [唱歌|chàng gē]', '[常常|cháng cháng]'], ja: ['[昔|むかし] は [毎日|まいにち] [歌|うた]って いました', 'いつも'] },
    mem: { es: ['{mimo} empujó la vagoneta'], pt: ['O {mimo} empurrou o vagonete'], de: ['{mimo} hat den Wagen geschoben'], zh: ['{mimo} [推|tuī] [了|le] [矿车|kuàng chē]'], ja: ['{mimo} が トロッコ を [押|お]した'] },
    guess: { es: ['estarán en el pueblo', 'serán las ocho', 'habrá cartas'], pt: ['estarão na cidade', 'serão oito horas', 'haverá cartas'], de: ['sie werden wohl im Dorf sein', 'es wird wohl acht Uhr sein'],
      zh: ['[他们|tā men] [可能|kě néng] [在|zài] [村子|cūn zi] [里|lǐ]', '[大概|dà gài] [八|bā] [点|diǎn] [了|le]'], ja: ['[町|まち] に いる でしょう', '[八時|はちじ] でしょう'] },
    door: { es: ['habrá agua', 'estará a la izquierda'], pt: ['haverá água', 'estará à esquerda'], de: ['da wird wohl Wasser sein', 'er wird wohl links sein'],
      zh: ['[里面|lǐ miàn] [可能|kě néng] [有|yǒu] [水|shuǐ]', '[他|tā] [可能|kě néng] [在|zài] [左边|zuǒ biān]'], ja: ['[水|みず] が ある でしょう', '[左|ひだり] に いる でしょう'] },
    mole: { es: ['estará a la izquierda'], pt: ['estará à esquerda'], de: ['er wird wohl links sein'], zh: ['[它|tā] [可能|kě néng] [在|zài] [左边|zuǒ biān]'], ja: ['[左|ひだり] に いる でしょう'] },
  };
  function sx(k, labels) {
    const l = lang(), a = (SX[k] || {})[l] || (SX[k] || {}).es || [];
    return a.map((t, i) => { let s = fillMimo(t, l); if (isCl(l)) s = plainT(s); return `«${s}»` + (labels && labels[i] ? ` (${labels[i]})` : ''); }).join(', ');
  }
  const pastT = id => () => via('past', () => (typeof QR_PAST !== 'undefined' && QR_PAST ? QR_PAST.target(id) : null));
  const futT = id => () => via('future', () => (typeof QR_FUT !== 'undefined' && QR_FUT ? QR_FUT.target(id) : null));
  const heardN = s => ['lamp', 'smith', 'efrain'].filter(k => sp(s).heard && sp(s).heard[k]).length;
  const WAKE = ['lucho', 'maite', 'paco', 'rocio'];
  const PSTEPS = [
    { _tt: true, text: 'The Quarry Caves: listen to Noa at the time crack by the camp’s entrance',
      why: 'Since the lake’s two echoes came home, something shimmers at the miners’ camp’s entrance. Noa’s voice is in it.',
      done: s => seenIn(s, 'quarry.noa'), target: gateT, hint: '{mimo} sniffs the air at the camp’s entrance. A shimmer?' },
    { _tt: true, get text() { return fillEn('In the Past: find {boss}, the forewoman, by the mine’s mouth'); },
      get why() { return fillEn('About 40 years ago, the spring after the concert, the mine was in its best years and the miners sang every day as they worked. But the deep gallery has gone quiet. {boss} runs the camp. Through the crack by the mine’s mouth, or the one at the entrance.'); },
      done: s => !!sp(s).met, target: pastT('boss'), hint: '{mimo} points at a woman with a clipboard, by the mine’s mouth.' },
    { _tt: true, get text() { return fillEn('Tell young {cande} about the quiet boy ({n}/2)'); }, n: s => Math.min(2, sp(s).candeQ || 0),
      get why() { return fillEn(`Young {cande}, the forewoman’s daughter, remembers a boy who came every afternoon. Tell her what he used to do: ${sx('habit3')}.`); },
      done: s => !!sp(s).cande, target: pastT('cande'), hint: '{mimo} points at a little girl on the office porch.' },
    { _tt: true, get text() { return fillEn('Hear how the deep gallery used to be ({n}/3), then tell {boss}'); }, n: s => heardN(s),
      get why() { return fillEn(`The lamplighter, the blacksmith and young {efrain} each remember the deep gallery’s old days. Then tell {boss} how it used to be: ${sx('habit')}.`); },
      done: s => !!sp(s).joined, target: () => via('past', () => (typeof QR_PAST !== 'undefined' && QR_PAST ? QR_PAST.target(heardN(G().state) >= 3 ? 'boss' : 'heard') : null)), hint: '{mimo} tugs your sleeve toward a miner of then.' },
    { _tt: true, text: 'The old deep gallery: bring back how it used to be ({n}/3)', n: s => Math.min(3, sp(s).floors || 0),
      get why() { return fillEn(`Inside, the gallery forgot its old days: tell it what the miners did there every day, and tell {mimo} what it did, as a memory (${sx('mem')}).`); },
      done: s => (sp(s).floors || 0) >= 3, target: pastT('door'), hint: '{mimo} looks at the mine’s mouth. The deep gallery is down there.' },
    { _tt: true, text: 'At the bottom: calm Grandma Echo and free Elio’s echo',
      why: 'An old echo bat hangs at the bottom of the deep gallery. She swallowed something that hums like a boy’s voice.',
      done: s => echoIn(s, 'past'), target: pastT('door'), hint: '{mimo} looks down into the mine. Grandma Echo is at the very bottom.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack by the camp’s entrance',
      why: 'Elio’s echo is free. Tell Noa: her voice comes through the crack at the camp’s entrance, in any of the three times.',
      done: s => !!sp(s).reported, target: gateT, hint: '{mimo} looks at the time crack at the camp’s entrance.' },
  ];
  const FSTEPS = [
    { _tt: true, get text() { return fillEn('In the Future: find {cande} by the cold fire pit'); },
      get why() { return fillEn('In the camp tomorrow the mine is abandoned and the lamps are out. Someone is still talking, by the fire pit. Through the crack by the bunkhouse, or the one at the entrance.'); },
      done: s => !!sf(s).met, target: futT('cande'), hint: '{mimo} points at someone by the fire pit… the only one with any color.' },
    { _tt: true, text: 'Guess where everyone will be: wake the frozen miners ({n}/4)', n: s => WAKE.filter(k => sf(s).woke && sf(s).woke[k]).length,
      get why() { return fillEn(`They froze waiting for an answer nobody knows. Guess, in tomorrow’s words, and look around for clues: ${sx('guess')}.`); },
      done: s => WAKE.every(k => sf(s).woke && sf(s).woke[k]), target: () => via('future', () => (typeof QR_FUT !== 'undefined' && QR_FUT ? QR_FUT.target('frozen') : null)), hint: '{mimo} tugs your sleeve toward someone gray.' },
    { _tt: true, text: 'The collapsed mine: find Chepe ({n}/3)', n: s => Math.min(3, sf(s).floors || 0),
      get why() { return fillEn(`Chepe went down into the old mine and never came back up. Inside, guess what’s behind each door and where he’ll be: ${sx('door')}.`); },
      done: s => (sf(s).floors || 0) >= 3, target: futT('door'), hint: '{mimo} looks at the mine’s mouth, half fallen in.' },
    { _tt: true, text: 'At the bottom: guess the Gray Mole’s moves, and free Elio’s echo',
      get why() { return fillEn(`Something big and gray digs at the bottom of the mine. Guess where it will come out: ${sx('mole')}.`); },
      done: s => echoIn(s, 'future'), target: futT('door'), hint: '{mimo} looks down into the collapsed mine.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack by the camp’s entrance',
      why: 'Both of the quarry’s echoes are free. Tell Noa, at the crack at the camp’s entrance.',
      done: s => !!sf(s).reported, target: gateT, hint: '{mimo} looks at the time crack at the camp’s entrance.' },
  ];
  if (typeof CH4 !== 'undefined') {
    CH4.steps('quarry', 'past', PSTEPS);
    CH4.steps('quarry', 'future', FSTEPS);
    CH4.story('quarry', [
      { when: s => seenIn(s, 'quarry.noa'), text: 'Noa’s voice came through the crack at the miners’ camp: two more of Elio’s echoes are here, one long ago, one tomorrow.' },
      { when: s => !!sp(s).cande, text: 'Long ago, a quiet boy sat on a crate every afternoon and listened to the miners sing. He never sang along.' },
      { when: s => echoIn(s, 'past'), text: 'At the bottom of the old deep gallery, Grandma Echo remembered how it used to be, and gave back Elio’s voice: he wanted to sing too.' },
      { when: s => !!sf(s).met, text: 'Tomorrow, the camp is empty. Only Cande still sits by the cold fire pit, guessing where everyone went.' },
      { when: s => echoIn(s, 'future'), text: 'The Gray Mole was outguessed, and Chepe came home. Elio’s voice, tomorrow: this time, he’ll sing with them.' },
    ]);
  }

  // ------------------------------------------------------------ the words of both worlds (QPTXT.WORDS, QFTXT.WORDS): registered in
  // Mimo's memory (caves.js's way), met in the lines, the demonstrations and the Looks, listed in the journal
  const wordLists = () => [typeof QPTXT !== 'undefined' ? QPTXT.WORDS || [] : [], typeof QFTXT !== 'undefined' ? QFTXT.WORDS || [] : []];
  function registerWords() {
    if (typeof LEX === 'undefined') return 0;
    let n = 0;
    for (const list of wordLists()) { const add = list.filter(w => !LEX.item(w.id)).map(w => Object.assign({ kind: 'word' }, w)); LEX.register(add); n += add.length; }
    // (zh / ja: the dictionary that reads typed answers knows these too)
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const list of wordLists()) for (const w of list) for (const l of ['zh', 'ja']) if (w[l]) CJK.addSource(w[l]); } catch (e) { /* */ }
    return n;
  }
  function wordsHTML() {
    css();
    const l = lang(), [P, F] = wordLists(), seen = id => typeof LEX !== 'undefined' && LEX.seen(id);
    const row = w => { const t = w[l] || ''; return `<li class="${seen(w.id) ? '' : 'no'}">${seen(w.id) ? '✓ ' : ''}<b>${tHTML(t, l)}</b> <span class="en">${esc(w.en)}</span></li>`; };
    const n = list => list.filter(w => seen(w.id)).length;
    return `<div class="mt"><h4 class="ph-h">Quarry words <small>${n(P) + n(F)} / ${P.length + F.length}</small></h4><p class="note">The miners’ camp long ago and tomorrow: every word you meet there, in the lines, the demonstrations and the things you look at (✓ once you’ve met it). Mimo keeps them for review.</p>`
      + `<h5>Long ago <small>${n(P)} / ${P.length}</small></h5><ul class="qr-words">${P.map(row).join('')}</ul>`
      + `<h5>Tomorrow <small>${n(F)} / ${F.length}</small></h5><ul class="qr-words">${F.map(row).join('')}</ul></div>`;
  }
  function addTab() {
    if (typeof UI === 'undefined') return;
    UI.journalTabs = UI.journalTabs || [];
    if (UI.journalTabs.some(t => t.id === 'qr-words')) return;
    UI.journalTabs.push({ id: 'qr-words', label: () => (G() && TIME.open('quarry') && TIME.seen('quarry.noa') ? 'Quarry words' : null), html: () => wordsHTML(), wire() { /* */ } });
  }

  // ------------------------------------------------------------ every zh / ja string against CJK.md's rules: [] when all's well
  // (a walk through every table: any string under a zh or ja key that's written in the notation; English glosses beside it are skipped)
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return ['no CJK'];
    const out = [];
    const v = (s, l, where) => {
      if (!s || typeof s !== 'string' || !/[[぀-ヿ一-鿿]/.test(s)) return;
      if (/[A-Za-z]{2,}/.test(s.replace(/\[[^\]]*\]/g, '').replace(/\{[^}]*\}/g, ''))) return;     // (an English tip or note that quotes a word)
      const p = CJK.validate(s.replace(/\*/g, '').replace(/\{[^}]+\}/g, l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ').replace(/___/g, l === 'zh' ? '[它|tā]' : 'それ'), l);
      if (p.length) out.push(`${where} (${l}): ${p.join('; ')} «${s}»`);
    };
    const under = (x, l, where) => { if (typeof x === 'string') v(x, l, where); else if (Array.isArray(x)) x.forEach((y, i) => under(y, l, where + '.' + i)); else if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) { if (k !== 'cl' && k !== 'cls') under(y, l, where + '.' + k); } };
    const seenO = new Set();
    const walk = (o, where, depth = 0) => {
      if (!o || typeof o !== 'object' || seenO.has(o) || depth > 9) return; seenO.add(o);
      if (Array.isArray(o)) { o.forEach((y, i) => walk(y, where + '.' + i, depth + 1)); return; }
      for (const [k, y] of Object.entries(o)) {
        if (k === 'cl' || k === 'cls' || k === 'tips' || k === 'TIPS') continue;
        if (k === 'zh' || k === 'ja') under(y, k, where + '.' + k);
        else if (y && typeof y === 'object') walk(y, where + '.' + k, depth + 1);
      }
    };
    walk({ TXT, ECHO, NOA, CRACK_EX, SX, PRES }, 'quart');
    if (typeof QPTXT !== 'undefined') walk(QPTXT, 'past');
    if (typeof QFTXT !== 'undefined') walk(QFTXT, 'future');
    if (typeof QRMUSIC !== 'undefined' && QRMUSIC.TEXT) walk(QRMUSIC.TEXT, 'music');
    return out;
  }

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the save goes to the test slot)
  // setup(o): the save after Chapter 3 (MOLT._.t.setup: Alba's echoes, Molinar open), Molinar's echoes in, every region open
  // (CH4._.t.openAll), the camp as Chapter 1 left it (the miners helped, the gong rung); o.seen === false: Noa's first words still to come
  function setup(o = {}) {
    if (typeof MOLT !== 'undefined' && MOLT && MOLT._ && MOLT._.t) MOLT._.t.setup();
    else if (typeof TIME_ALBA !== 'undefined' && TIME_ALBA._ && TIME_ALBA._.t) TIME_ALBA._.t.setup();
    if (typeof CH4 !== 'undefined') { CH4._.t.give('molinar', 'past'); CH4._.t.give('molinar', 'future'); CH4._.t.openAll(); }
    const g = G(), f = g.state.flags;
    Object.assign(f, { lakeFree: true, camp: true, quarry: true, cande: true, mineOpen: true, caveFree: true });
    const cs = g.state.caves || (g.state.caves = {}); cs.helped = cs.helped || {};
    if (typeof CAVES !== 'undefined') CAVES.MINERS.forEach(m => { if (!cs.helped[m.id]) cs.helped[m.id] = 'S'; });
    cs.chepe = true;
    try { if (typeof LEX !== 'undefined' && !LEX.taught('v.sing')) LEX.attempt('v.sing', { ok: true, hints: 0, ms: 3000, mode: 'teach' }); } catch (e) { /* */ }
    if (o.seen !== false) TIME.seen('quarry.noa', true);
    // o.prior: Molinar's and the lake's paths done and reported too (so the main quest points here)
    if (o.prior) for (const [R, id] of [[typeof MOLT !== 'undefined' && MOLT, 'molinar'], [typeof LAKET !== 'undefined' && LAKET, 'lake']]) {
      if (!R || !R._ || !R._.t || !R._.t.at) continue;
      try { R._.t.at('future.top'); TIME.state(id, 'future').reported = true; TIME.state(id, 'past').reported = true; if (typeof CH4 !== 'undefined') { CH4._.t.give(id, 'past'); CH4._.t.give(id, 'future'); } } catch (e) { console.error('[quarry] setup prior', id, e); }
    }
    // (tests: until the lake's own steps are registered, the main quest stops before the lake; put the quarry's in, before the "coming soon")
    const main = typeof QUESTS !== 'undefined' && QUESTS.LIST.find(q => q.id === 'main');
    if (main && !main.steps.some(x => x.ch4 === 'quarry')) {
      const i = main.steps.findIndex(x => x.ch4 === 'soon'); const add = PSTEPS.concat(FSTEPS);
      if (i >= 0) main.steps.splice(i, 0, ...add); else main.steps.push(...add);
    }
    TIME._.fast.on = true; TIME.refresh();
    return TIME.open('quarry');
  }
  function near(id) {
    const c = CRACK[id] || (id === 'mouth' ? { x: MOUTH.x, z: MOUTH.z + 2.6 } : null); if (!c) return null;
    const g = G(), Y = g.sim.you; Y.x = c.x + 1.3; Y.z = c.z + 1.0; g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
    return { x: Y.x, z: Y.z };
  }
  async function go(w, at) { const p = at || { x: CRACK.gate.x + 1.4, z: CRACK.gate.z + 1.2, yaw: 0 }; const r = await TIME.go(w, { region: 'quarry', at: p, quick: true }); return r && TIME.world(); }
  // put the save at a step of the quarry's path (everything before it done): 'past.deep' (the Past's deep gallery next), 'past.top'
  // (its boss next), 'future' (the Past reported), 'future.deep', 'future.top'
  function at(step) {
    const P = st('past'), F = st('future'), pm = P.deep || (P.deep = {}), fm = F.deep || (F.deep = {});
    TIME.seen('quarry.noa', true);
    Object.assign(P, { demo: true, met: true, candeQ: 2, cande: true, heard: { lamp: true, smith: true, efrain: true }, joined: true });
    if (step === 'past.deep') return step;
    Object.assign(pm, { seen0: true, seen1: true, seen2: true, lamps: true, cart: true, done0: true, ambush: true, echo: true, done1: true, sang: true, bridge: true, done2: true, memCard: true });
    P.floors = 3;
    if (step === 'past.top') return step;
    Object.assign(pm, { seen3: true, boss: true, done3: true }); TIME.flag('past', 'qrDeep', true);
    if (typeof CH4 !== 'undefined') CH4._.t.give('quarry', 'past'); P.reported = true;
    if (step === 'future') { TIME.refresh(); return step; }
    Object.assign(F, { met: true, woke: { lucho: 'S', maite: 'S', paco: 'S', rocio: 'S' }, open: true });
    if (step === 'future.deep') { TIME.refresh(); return step; }
    Object.assign(fm, { seen0: true, seen1: true, seen2: true, rubble: true, door0: true, done0: true, ambush: true, door1: true, done1: true, tunnel: true, done2: true });
    F.floors = 3; TIME.refresh();
    return step;
  }
  // the crack probe (TIME.md §13): what answers E within 3 steps, and the solids within 2, in the world you're in
  function probe(x, z) {
    const room = G().indoorMod && G().indoorMod(), L0 = room ? room.interactables() : STORY._test.interactables().slice();
    if (!room) for (const P0 of STORY.extra || []) { try { if (P0.interactables) L0.push(...P0.interactables()); } catch (e) { /* */ } }
    const es = L0.filter(it => !it.crack && Math.hypot(it.x - x, it.z - z) < 3).map(it => `${it.label}@${(+it.x).toFixed(1)},${(+it.z).toFixed(1)}`);
    const [a, b] = WORLD.pushOut(x, z, 2); return { e: es, solid: Math.hypot(a - x, b - z) > 0.01 };
  }
  // a driver for tests in a hidden tab (game time only moves with __g.go): Molinar's (MOLT._.t.drv), shared
  const drv = (typeof MOLT !== 'undefined' && MOLT && MOLT._ && MOLT._.t && MOLT._.t.drv) || null;

  return { CEN, RAD, CRACK, MOUTH, DRESS, TXT, ECHO, NOA, PSTEPS, FSTEPS, WAKE, L, LANGS, isCl, lang, nameOf, enName, fillMimo, fillEn, say, demo, hushed, think, you, frame2, lookAt, meet, introduce,
    card, css, grade, ask, memTask, planTask, has, person, who, lock, shot, wait, mimoName, plainT, down, st, sp, sf, sn, via, check, sx, registerWords, inside,
    get flare() { return flare; }, set flare(v) { flare = v; },
    _: { noaOpen, reportPast, reportFuture, crackCard, tick, wordsHTML, t: { setup, near, go, probe, at, check: () => check(), get drv() { return drv || (typeof MOLT !== 'undefined' && MOLT && MOLT._.t.drv); } } } };
})();
