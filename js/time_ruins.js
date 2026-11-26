'use strict';
// The Sunken Ruins in three worlds (DESIGN.md 20.1b "next, the Sunken Ruins", 21.1; game/TIME.md "The Sunken Ruins (T4b)"): Chapter 4's
// eighth place, a region TIME dresses itself, in the port's shape (time_port.js is the model).
//   time_ruins.js            RUINT: the region, its three cracks (two of them stand on a boardwalk tomorrow: their height follows the
//                            world, from this file's tick), Noa's voice by the beach, Chapter 4's steps and echoes, the shared kit
//                            (names, saying and demonstrating, the S–D grader, the ask box, pattern cards, memories and «cuando» plans
//                            for {mimo}, words), today's canyon set aside in the other worlds (its people, the ship, the dig camp and
//                            its solids), the journal's «Ruins words» page, check() and test hooks
//   time_ruins_land.js       the two lands (TIME.land): a green canyon with its river long ago, the sea over the ruins tomorrow
//   ruins_past(_text).js     the first dig long ago, the morning after the river's flood: RU_PAST, 7 people, 3 side quests
//   ruins_future(_text).js   the drowned dig tomorrow, its people on boardwalks, frozen gray on a "when?" or a fear: RU_FUT
//   ruins_past_dungeon.js    RU_PTEMPLE: the temple the day it was first opened (rooms at y 300, z 0, x −430 … −352)
//   ruins_future_dungeon.js  RU_FTEMPLE: the sunken temple, half underwater, its tide going in and out (rooms at y 300, z 30)
//   ruins_time_boss.js       RUBOSS: the Clay Parrot (the Past) and the Gray Moray (the Future), plug-ins on battle/flow.js
//   ruins_time_battle.js     the 'riverbank' and 'flooded' battle arenas;  ruins_time_music.js: RUMUSIC, six songs
// The cracks (open with CH4.open('ruins'): after Port Brisa's two echoes): in the old town (today ↔ the Past), at the camp's edge on
// the way to the old town (today ↔ the Future), at the head of the beach where the gully starts (all three; Noa speaks there).
// State: TIME.state('ruins', 'past' | 'future' | 'now'); flags: TIME.flag('past', 'ruOpen' | 'ruMark' | 'ruPhoto'), ('future',
// 'ruFree' | 'ruCasts' (the warning told)), ('now', 'ruCasts' (today's Salomé made the casts)).
// The grammar (TIME.md §8, rung 7): the Past, the pluperfect («Cuando llegamos, el río ya había bajado») and what someone said («Dijo
// que había visto una luz»); the Future, «cuando» + the subjunctive for what's to come («Cuando baje la marea, buscaremos…») and doubt
// («No creo que se hunda», «Dudo que…»). Each language its own: pt «tinha + particípio», «disse que…», «quando» + the futuro do
// subjuntivo, «não acho que / duvido que»; de the Plusquamperfekt with «als» and «schon», «Sie hat gesagt, dass …», «wenn / sobald» +
// the present, «Ich glaube nicht / Ich bezweifle, dass …» (the verb last); zh 已经…了 / 早就…了, 她说… / 听说…, 等…的时候 / 一…就…,
// 我不觉得… / 不一定 / 恐怕; ja もう〜ていた, 〜と言っていました, 〜たら / 〜とき, 〜とは思いません / 〜かもしれません.
const RUINT = (() => {
  if (typeof TIME === 'undefined' || typeof RUINS === 'undefined') return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, OFF = A.OFF;
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
  const B = () => (typeof RUINS !== 'undefined' && RUINS.built) || null;

  // ------------------------------------------------------------ where things are (checked with the probe in every world)
  const CEN = { x: 142, z: 12 }, RAD = 50;
  const CRACK = { past: { x: 136.4, z: -0.6 }, future: { x: 140.2, z: 11.0 }, gate: { x: 136.8, z: 40.6 } };
  // tomorrow's sea over the canyon floor (TIME.land's flood, time_ruins_land.js), and the boardwalks' tops over it
  const WATER_Y = 2.5, DECK_Y = 2.9;
  // its reach in the other worlds: the canyon's floor and the beach (its red walls are the edge, as today)
  const inside = (x, z) => RUINS.inBox(x, z) && RUINS.openDist(x, z) < 0.9;

  // ------------------------------------------------------------ the save's part
  const st = w => TIME.state('ruins', w);
  const R0 = s => (s && s.worlds && s.worlds.r && s.worlds.r.ruins) || {};
  const sp = s => R0(s).past || {}, sf = s => R0(s).future || {}, sn = s => R0(s).now || {};
  const seenIn = (s, k) => !!(s && s.worlds && s.worlds.seen && s.worlds.seen[k]);
  const echoIn = (s, w) => !!(s && s.ch4 && s.ch4.echoes && s.ch4.echoes['ruins.' + w]);

  // ------------------------------------------------------------ names: each language's own cast for the new people of then
  // (RUPTXT.CAST, RUFTXT.CAST); today's archaeologists keep their names everywhere (ruins_scenes.js)
  const NOA = L('Noa', 'Noa', 'Noa', 'Noa', '[诺娅|Nuò yà]', 'ノア');
  const casts = () => [typeof RUPTXT !== 'undefined' ? RUPTXT.CAST : {}, typeof RUFTXT !== 'undefined' ? RUFTXT.CAST : {}];
  const nameOf = (T, l = lang()) => (!T ? '' : isCl(l) ? plainT(T[l] || T.en) : T[l] || T.en);
  const enName = (T, l) => { if (!T) return ''; if (l === 'es') return T.en; if (isCl(l)) { try { return CJK.roman(T[l], { lang: l }); } catch (e) { return T.en; } } return T[l] || T.en; };
  const fillMimo = (t, l = lang()) => String(t || '').replace(/\{mimo\}/g, isCl(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName());
  function fillEn(t, l = lang()) {
    let s = String(t || '');
    for (const C of casts()) s = s.replace(/\{([a-z]+)\}/g, (m, k) => (C[k] ? enName(C[k], l) : m));
    return s.replace(/\{mimo\}/g, mimoName()).replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }
  const enOf = (T, l) => (T && (T['en_' + l] || T.en)) || '';

  // ------------------------------------------------------------ words: the slots in a line's English ({w.rup_*}, {w.ruf_*}) and the
  // marks of a demonstration are met as they're said (LEX.expose), so the weave brings them in a few at a time and review keeps them
  const SLOT = /\{(w\.[a-z_]+)(?::(?:pl|f))?\}/g;
  function meet(T, marks) {
    if (typeof LEX === 'undefined') return;
    try {
      const en = String((T && T.en) || ''); let m; SLOT.lastIndex = 0;
      while ((m = SLOT.exec(en))) if (LEX.item(m[1])) LEX.expose(m[1]);
      const l = lang(), Mk = Array.isArray(marks) ? marks : (marks && marks[l]) || [];
      for (const x of Mk) if (typeof x === 'string' && LEX.item(x)) LEX.expose(x);
      if (T && T.words) T.words.forEach(id => { if (LEX.item(id)) LEX.expose(id); });
    } catch (e) { /* */ }
  }
  const introduce = id => { try { if (STORY.introduce) STORY.introduce(id); else LEX.expose(id); } catch (e) { /* */ } };

  // ------------------------------------------------------------ saying things (mixed by the weave; a demonstration shows the marked
  // words glossed, whole in the language; the hushed keep only their *starred* words)
  function say(p, T) { if (!p || !T) return Promise.resolve(); const l = lang(); meet(T); p.lines = { en: fillEn(enOf(T, l), l), [l]: fillMimo(T[l] || '', l) }; return STORY.sayInline(p); }
  function demo(p, T, marks) {
    if (!p || !T) return Promise.resolve();
    meet(T, marks);
    const l = lang(), T2 = { en: fillEn(enOf(T, l), l) }; LANGS.forEach(x => { T2[x] = fillMimo(T[x] || '', x); });
    return STORY.demoLine(p, T2, marks);
  }
  function hushed(p, T) { if (!p || !T) return Promise.resolve(); const l = lang(); return STORY.sayHushed ? STORY.sayHushed(p, fillMimo(T[l] || '', l), fillEn(enOf(T, l), l)) : say(p, T); }
  // (bare 汉字 / かな in an English tip, «已经», «たら», follow the reading mode: romanized for a player who reads roman)
  const lower1 = s => String(s).charAt(0).toLowerCase() + String(s).slice(1);
  const cjRun = (s, l = lang()) => (isCl(l) && typeof CJK !== 'undefined' && CJK.plain ? String(s).replace(/[぀-ヿ一-鿿][぀-ヿ一-鿿…]*/g, m => { try { return lower1(CJK.plain(m, { lang: l })); } catch (e) { return m; } }) : s);
  // (an English note with its examples in CJK.md's notation, «[我|wǒ] [不|bù] [觉得|jué de]…»: each example in the reading mode, its
  // words spaced in roman)
  const brRun = (s, l = lang()) => (isCl(l) && typeof CJK !== 'undefined' && CJK.plain ? String(s).replace(/(?:[぀-ヿ一-鿿〜…]+\s*)*\[[^\]]+\](?:[^[\]A-Za-z«»()"]*\[[^\]]+\])*[぀-ヿ一-鿿。、，]*/g, m => { try { return CJK.plain(m.trim(), { lang: l }) + (/\s$/.test(m) ? ' ' : ''); } catch (e) { return m; } }) : s);
  const think = (s, d) => STORY.think(cjRun(fillEn(s)), d);
  const you = s => STORY.you(fillEn(s));
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
    if (document.getElementById('rut-css')) return;
    const s = document.createElement('style'); s.id = 'rut-css';
    s.textContent = `.card.ru-card .ex { display: grid; grid-template-columns: auto auto; gap: 4px 14px; justify-content: center; margin: 10px 0 6px; font-size: 18px; }
.card.ru-card .ex b { color: #a8532f; } .card.ru-card.fut .ex b, .card.ru-card.fut .tag { color: #2f6f9a; }
.card.ru-card .note { max-width: 470px; margin: 6px auto 0; font-size: 14px; line-height: 1.45; } .card.ru-card .tag { color: #a8532f; }
.card.ru-card .rows { text-align: left; max-width: 470px; margin: 8px auto 0; font-size: 14px; line-height: 1.5; }
.ru-words { columns: 2; column-gap: 18px; font-size: 13px; line-height: 1.5; margin: 6px 0 10px; } .ru-words li { break-inside: avoid; } .ru-words .no { opacity: .45; }`;
    document.head.appendChild(s);
  }
  const tHTML = (t, l) => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l, ruby: 'always' }) : esc(t));
  async function card(C, fut) {
    css();
    const l = lang(), c = C && C[l]; if (!c) return;
    const ex = (c.ex || []).map(([w, e]) => `<b>${tHTML(fillMimo(w, l), l)}</b><span>${esc(e)}</span>`).join('');
    await UI.card(`<div class="tag">${esc(cjRun(brRun(fillEn(c.tag || C.tag, l), l), l))}</div>${ex ? `<div class="ex">${ex}</div>` : ''}<div class="note">${esc(cjRun(brRun(fillEn(c.note, l), l), l))}</div><div class="sub">E</div>`, { kind: 'ru-card' + (fut ? ' fut' : '') });
  }

  // ------------------------------------------------------------ grading what you say (S–D: one letter down per miss; «?», the whole
  // sentence, counts as two). T: want (S; an A with an accent missing or none of `more`), alt (A), and right-but-off answers that are
  // a B with a tip: aux (de: hatte / war), person, tense (it happened, but it had already happened: «bajó» for «había bajado»; the
  // perfect «ha bajado»), shift (what someone said, not moved back: «dijo que ha visto»), mood (the indicative after «cuando» or «no
  // creo que»: «cuando baja», «no creo que se hunde»), when (tomorrow's plan, but not tied to its moment: say «cuando…»), order (de:
  // the verb last after «dass»); and the misses with a tip: past, pres, fut, miss. Items: a string as a word or phrase (zh / ja:
  // CJK.contains), a list: all of them, in any order. (the port's grader, kept here so the ruins stand on their own)
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const fold = (s, lg) => { let t = nrm(s); if (lg === 'de') t = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'); return t; };
  const words = (s, lg) => ' ' + fold(s, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const hasCJ = (text, src, l) => {
    if (typeof CJK === 'undefined') return false;
    try { const ch = CJK.chars(src, { lang: l }).replace(/\s+/g, ''); if (/[぀-ヿ一-鿿]/.test(ch) && String(text || '').replace(/\s+/g, '').includes(ch)) return true; } catch (e) { /* */ }
    try { if (CJK.contains(text, src, l)) return true; } catch (e) { /* */ }
    if (l === 'zh') { try { const py = nrm(CJK.roman(src, { lang: 'zh' })).replace(/[^a-z]/g, ''); if (py.length >= 4 && nrm(text).replace(/[^a-z]/g, '').includes(py)) return true; } catch (e) { /* */ } }
    if (l === 'ja') { try { const ro = nrm(CJK.roman(src, { lang: 'ja' })).replace(/[^a-z]/g, ''); if (ro.length >= 4 && nrm(text).replace(/[^a-z]/g, '').includes(ro)) return true; } catch (e) { /* */ } }
    // (a short word typed in rōmaji / pinyin, «ōmu», «guāng»: as a whole word)
    try { const ws = s => ' ' + nrm(s).replace(/[^a-z]+/g, ' ').trim() + ' ', rw = ws(CJK.roman(src, { lang: l })); if (rw.trim().length >= 2 && ws(text).includes(rw)) return true; } catch (e) { /* */ }
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
  // de: after «dass» the verb goes last («…, dass das Wasser sinkt»): a B with a tip when the wanted verb is there but not last
  function orderSlip(T, text, lg) {
    const O = (T.order || {})[lg]; if (!O || !O.length || lg !== 'de') return false;
    const w = words(text, lg).trim().split(' '); if (!w.includes('dass')) return false;
    const after = w.slice(w.lastIndexOf('dass') + 1), last = after[after.length - 1] || '', vs = O.map(v => fold(v, lg));
    return !vs.includes(last) && after.some(x => vs.includes(x));
  }
  const LESS = ['tense', 'shift', 'mood'];
  const BKEYS = ['aux', 'person', 'tense', 'shift', 'mood', 'when'];
  const MISS = ['past', 'pres', 'fut', 'miss'];
  // (typing only the blank counts as the frame filled in: «bajado» for «Cuando llegamos, el río ya había ___.»)
  function grade(T, text, lg, TIPS = {}) {
    const g = grade0(T, text, lg, TIPS);
    if (g.ok || g.kind === 'veto') return g;          // (the fill only rescues a miss: it never lifts an A to an S)
    const fr = plainT(fillMimo((T.frame || {})[lg] || '', lg));
    if (!fr.includes('___') || !String(text || '').trim()) return g;
    // (a listed miss of more than one word, said whole, is that miss: «Dice que vio una luz» isn't the frame filled in)
    if (!isCl(lg) && ['pres', 'fut', 'past'].some(k => ((T[k] || {})[lg] || []).some(x => Array.isArray(x) && x.length > 1 && exact(text, x, lg)))) return g;
    const n = isCl(lg) ? String(text).replace(/\s+/g, '').length : words(text, lg).trim().split(' ').length;
    if (n > (isCl(lg) ? 8 : 3)) return g;
    // (zh / ja: a fill is about as long as the blank's chip; «我觉得神庙会沉» is a whole sentence of its own, not «沉» in the blank)
    if (isCl(lg) && typeof CJK !== 'undefined' && CJK.chars && /[぀-ヿ一-鿿]/.test(text)) {
      const cm = Math.max(1, ...((T.chips || {})[lg] || []).map(c => { try { return CJK.chars(fillMimo(c[0], lg), { lang: lg }).replace(/\s+/g, '').length; } catch (e) { return 4; } }));
      if (n > cm + 3) return g;
    }
    // (the blank with its neighbors fills the frame in order; a short sentence of its own doesn't: its words would land out of order)
    if (!isCl(lg)) {
      const tw = words(text, lg).trim().split(' '), [pre, post] = fr.split('___').map(s => words(s, lg).trim().split(' ').filter(Boolean));
      const fw = new Set([...pre, ...post]);
      let ok = false;
      for (let a = 0; a <= tw.length && !ok; a++) for (let b = tw.length; b > a && !ok; b--) {
        const A0 = tw.slice(0, a), F = tw.slice(a, b), Bw = tw.slice(b);
        if (F.length <= 3 && !F.some(w => fw.has(w)) && A0.every((w, i) => pre[pre.length - A0.length + i] === w) && Bw.every((w, i) => post[i] === w)) ok = true;
      }
      if (!ok) return g;
    }
    const frRaw = fillMimo((T.frame || {})[lg] || '', lg), chips = ((T.chips || {})[lg] || []).map(c => c[0]);
    const items = ['want', 'alt', ...BKEYS, ...MISS].flatMap(k => ((T[k] || {})[lg] || []).flat()).filter(x => typeof x === 'string');
    if (!chips.some(c => has(text, c, lg)) && !items.some(x => !has(frRaw.replace(/___/g, ' '), x, lg) && has(text, x, lg))) return g;
    const g2 = grade0(T, fr.replace('___', String(text).trim()), lg, TIPS);
    return g2.ok ? g2 : g;
  }
  function grade0(T, text, lg, TIPS = {}) {
    const model = plainT(fillMimo((T.model || {})[lg] || '', lg)).replace(/\s*[.。]\s*$/, '');
    const tip = k => String((((T.tips || {})[k] || TIPS[k] || {})[lg]) || '').replace('{form}', model);
    const first = (key, fn = has) => ((T[key] || {})[lg] || []).find(x => fn(text, x, lg));
    const v = first('veto'); if (v) return { ok: false, kind: 'veto', why: tip('veto') };
    // a form that counts less, found by its exact spelling first, so a bare verb's A can't hide it («bajó», «baja»)
    for (const k of LESS) { const x0 = first(k, exact); if (x0) return { ok: true, letter: 'B', kind: k, why: tip(k) || `«${model}»` }; }
    const w = first('want');
    // (a wanted form found only without its accent, when that spelling is itself a listed miss: «bajé» for «baje»…)
    if (w && !first('want', exact)) for (const k of ['past', 'pres', 'fut']) { const m = first(k, exact); if (m) return { ok: false, kind: k, why: tip(k) }; }
    if (w) {
      if (orderSlip(T, text, lg)) return { ok: true, letter: 'B', kind: 'order', why: tip('order') || `The verb goes last after «dass»: «${model}»` };
      const mo = !((T.more || {})[lg] || []).length || T.more[lg].some(x => has(text, x, lg));
      const others = ['alt', ...BKEYS, ...MISS].flatMap(k => ((T[k] || {})[lg] || []).flat());
      const ac = typeof ACCENTS !== 'undefined' ? ACCENTS.judge(text, w, lg, { others }) : { keep: !accented(text, w, lg), why: `Accent: «${plainT(showForm(w))}»`, tip: '' };
      return { ok: true, letter: !ac.keep && mo ? 'S' : 'A', kind: 'right', why: ac.keep ? ac.why : !mo ? tip('more') || `Right! The whole sentence for an S: «${model}»` : 'Just right!', tip: ac.tip || '' };
    }
    const a = first('alt'); if (a) return { ok: true, letter: 'A', kind: 'alt', why: tip('alt') || 'Right!' };
    for (const fn of [exact, has]) {
      for (const k of BKEYS) { const x = first(k, fn); if (x) return { ok: true, letter: 'B', kind: k, why: tip(k) || `«${model}»` }; }
      for (const k of MISS) { const m = first(k, fn); if (m) return { ok: false, kind: k, why: tip(k) }; }
    }
    return { ok: false, kind: 'none' };
  }
  // one task, asked until it's said (or you close the box): the frame and the chips on the box, the model on «?»
  // o: { icon, tips, title, hint, onMiss(g, misses) }
  async function ask(T, o = {}) {
    const lg = lang(), tips = o.tips || {};
    const frame = plainT(fillMimo((T.frame || {})[lg] || '', lg)), chips = ((T.chips || {})[lg] || []).map(([w, e]) => `${isCl(lg) ? lower1(plainT(fillMimo(w, lg))) : plainT(fillMimo(w, lg))} (${e})`).join(' · ');
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
        UI.toast(cjRun(`${letter} · ${why}${g.tip ? ' · ' + g.tip : ''}`)); snd(letter === 'S' ? 'chest' : 'review');
        try { if (T.words && typeof LEX !== 'undefined') T.words.forEach(id => { if (LEX.item(id) && LEX.heard(id, r.text)) LEX.attempt(id, { ok: true, hints: misses + (peeked ? 2 : 0), ms: r.ms || 4000, mode: 'teach' }); }); } catch (e) { /* */ }
        return { letter, text: r.text, ms: r.ms, kind: g.kind };
      }
      misses++; snd('wrong'); try { G().sim.mimo.tiltT = 1.4; } catch (e) { /* */ }
      if (o.onMiss) { try { await o.onMiss(g, misses); } catch (e) { /* */ } }
      think(g.kind !== 'none' && g.why ? g.why : misses >= 2 ? `Like this: «${model}»` : `Not quite… «${frame}»${chips ? ' · ' + chips : ''}`, 6.5);
    }
  }
  // {mimo}'s moves, told in the world's time: a memory in the Past (PTXT.PV's 3rd-person preterites, through QUART / MOLT's memTask);
  // tomorrow, a plan tied to its moment («Cuando baje el agua, {mimo} nadará…»: whenTask below)
  const memTask = Mm => {
    const Q = typeof QUART !== 'undefined' && QUART && QUART.memTask ? QUART : typeof MOLT !== 'undefined' && MOLT && MOLT.memTask ? MOLT : null;
    if (!Q) return null;
    const T = Object.assign(Q.memTask(Mm), { words: Mm.words });
    const fv = typeof MFTXT !== 'undefined' && MFTXT && MFTXT.FV ? MFTXT.FV[Mm.verb] : null;
    if (fv) {
      T.fut = {}; LANGS.forEach(l => { T.fut[l] = [...(fv[l] || []), ...((fv.ir || {})[l] || [])]; });
      T.tips = Object.assign({}, T.tips, { fut: { es: 'That’s a plan, for tomorrow! In the Past, {mimo} moves in memories: «{form}».', pt: 'That’s a plan, for tomorrow! In the Past, {mimo} moves in memories: «{form}».',
        de: 'That’s a plan, for tomorrow! In the Past: «{form}».', zh: 'That’s tomorrow (会)! It already happened: «{form}».', ja: 'That’s a plan, for tomorrow! In the Past: ～た, «{form}».' } });
    }
    return T;
  };
  // tomorrow's moments (the trigger of a «cuando» plan) in each language: the subjunctive (es), the futuro do subjuntivo (pt), the
  // present after «wenn / sobald» (de), 等… / 一…就 (zh), 〜たら (ja); ind: the indicative (a B: "after «cuando», the subjunctive");
  // fut: the future inside the clause (a B too: «cuando bajará»)
  const TRIG = {
    low: { es: ['baje'], pt: ['baixar'], de: ['sinkt', 'zurückgeht', 'zuruckgeht'], zh: '[退|tuì]', ja: '[引|ひ]いたら', ind: { es: ['baja'], pt: ['baixa'] }, fut: { es: ['bajará'], pt: ['baixará'], de: [['sinken', 'wird']] } },
    high: { es: ['suba'], pt: ['subir'], de: ['steigt'], zh: '[涨|zhǎng]', ja: '[満|み]ちたら', ind: { es: ['sube'], pt: ['sobe'] }, fut: { es: ['subirá'], pt: ['subirá'], de: [['steigen', 'wird']] } },
    out: { es: ['salga'], pt: ['sair'], de: ['rauskommt', 'herauskommt', 'auftaucht'], zh: '[出来|chū lai]', ja: '[出|で]て きたら', ind: { es: ['sale'], pt: ['sai'] }, fut: { es: ['saldrá'], pt: ['sairá'], de: [['rauskommen', 'wird'], ['auftauchen', 'wird']] } },
  };
  const WHEN = { es: 'cuando', pt: 'quando', de: ['wenn', 'sobald'], zh: ['[等|děng]', '[一|yī]'], ja: null };
  // {mimo}'s «cuando» plan: Mm = { verb, trig ('low' | 'high' | 'out'), title, frame, model, more, words, chips }. want: «cuando» + the
  // moment + the plan (in any order); mood: the moment in the indicative or the future (B); when: the plan with no moment (B); pres,
  // past: a miss with a tip
  function whenTask(Mm) {
    const Tg = TRIG[Mm.trig] || TRIG.low, PV = (typeof PTXT !== 'undefined' && PTXT.PV && PTXT.PV[Mm.verb]) || {};
    const fv = Mm.fv || (typeof RUFTXT !== 'undefined' && RUFTXT.FV && RUFTXT.FV[Mm.verb]) || (typeof MFTXT !== 'undefined' && MFTXT && MFTXT.FV && MFTXT.FV[Mm.verb]) || {};     // (tomorrow's own table first: the Molinar's has no «nadará»)
    const T = { title: Mm.title, frame: Mm.frame, model: Mm.model, more: Mm.more, words: Mm.words, chips: Mm.chips, want: {}, mood: {}, when: {}, pres: {}, past: {}, tips: {} };
    const plan = l => (fv[l] || []).concat(((fv.ir || {})[l] || [])).concat(l === 'de' ? (Mm.dePres || []) : []).concat(l === 'ja' ? (Mm.jaPlan || []) : []);
    for (const l of ['es', 'pt']) { T.want[l] = Tg[l].flatMap(t => plan(l).map(p => [WHEN[l], t, p])); T.mood[l] = [...(Tg.ind[l] || []), ...(Tg.fut[l] || [])].flatMap(t => plan(l).map(p => [WHEN[l], t, p])); T.when[l] = plan(l); }
    T.want.de = Tg.de.flatMap(t => WHEN.de.flatMap(c => plan('de').map(p => [c, t].concat(Array.isArray(p) ? p : [p]))));
    T.mood.de = (Tg.fut.de || []).map(x => ['wenn'].concat(x)); T.when.de = plan('de');
    T.want.zh = [['[等|děng]', Tg.zh].concat(Mm.zhVerb ? [Mm.zhVerb] : []), ['[一|yī]', Tg.zh, '[就|jiù]'].concat(Mm.zhVerb ? [Mm.zhVerb] : [])]; T.when.zh = plan('zh');
    T.want.ja = [[Tg.ja].concat(Mm.jaVerb ? [Mm.jaVerb] : [])]; T.when.ja = plan('ja');
    T.pres = { es: Mm.pres && Mm.pres.es, pt: Mm.pres && Mm.pres.pt }; T.past = { es: PV.es, pt: PV.pt, de: PV.de, zh: PV.zh, ja: PV.ja };
    T.tips = {
      mood: { es: 'Almost! After «cuando», for what’s still to come, the subjunctive: «{form}».', pt: 'Almost! After «quando», for what’s still to come, the futuro do subjuntivo: «{form}».', de: 'Almost! After «wenn», German says the future with the present: «{form}».' },
      when: { es: 'That’s a plan! Now say WHEN: «{form}».', pt: 'That’s a plan! Now say WHEN: «{form}».', de: 'That’s a plan! Now say WHEN: «{form}».', zh: 'That’s a plan! Now say when (等…): «{form}».', ja: 'That’s a plan! Now say when (～たら): «{form}».' },
      pres: { es: 'That’s today. Tomorrow, tie the plan to its moment: «{form}».', pt: 'That’s today. Tomorrow, tie the plan to its moment: «{form}».' },
      past: { es: 'That’s yesterday! Tomorrow: «{form}».', pt: 'That’s yesterday! Tomorrow: «{form}».', de: 'That’s yesterday! Tomorrow: «{form}».', zh: 'That’s yesterday (了)! Tomorrow: «{form}».', ja: 'That’s yesterday (～た)! Tomorrow: «{form}».' },
    };
    return T;
  }

  // ------------------------------------------------------------ the people TIME builds (TIME.people), by world and id
  function person(w, id) {
    const list = TIME.people && TIME.people.all['ruins:' + w]; if (!list) return null;
    const P = list.find(q => q.def.id === id); if (!P) return null;
    P.api.name = nameOf(P.def.name); return P;
  }
  const who = (w, id) => { const P = person(w, id); return P ? P.api : null; };
  // (tomorrow everyone stands on a boardwalk over the sea; TIME's person kit stands them on the ground under it)
  function liftOn(w, id, y) { const P = person(w, id); if (P) { P.g.position.y = y; P.api.y = y; } }

  // ------------------------------------------------------------ today's canyon, set aside in another world: its people, «El Viento
  // Sur» at the pier, Fermín's barrow by the old slide, Gaspar's map, the dig mounds; long ago also the dig camp (one merged mesh and
  // its ink) and the sand-drifted temple top with the Door of Days (ruins_past.js builds them as they were). main.js hides the canyon's
  // group whenever a room is on (TIME counts as one), so in this region's other worlds it's shown again and run (showToday). The dig
  // camp's solids (its tents, canopy, hammock, desk…) are parked in both worlds: long ago it isn't there, tomorrow the boardwalks run
  // over it.
  const nearMesh = (o, x, z, r) => { if (!o || !o.geometry) return false; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const c = o.geometry.boundingSphere.center; return Math.hypot(c.x - x, c.z - z) < r; };
  function campMeshes() { const Bp = B(); return Bp ? Bp.group.children.filter(c => c.isMesh && nearMesh(c, 147.7, 18.4, 1.5) && c.geometry.boundingSphere.radius > 8) : []; }
  function templeMeshes() { const Bp = B(); return Bp ? Bp.group.children.filter(c => c.isMesh && nearMesh(c, 141.9, -25.2, 1.0) && c.geometry.boundingSphere.radius > 6) : []; }
  function hideToday(api, o = {}) {
    const g = G(), Bp = B(); if (!Bp) return [];
    const out = [], hide = obj => { if (obj && obj.visible) { api.hide(obj); out.push(obj); } };
    (Bp.people || []).forEach(p => hide(p.root));
    const O = Bp.objects || {};
    hide(O.ship);
    if (O.mounds) Object.values(O.mounds).forEach(m => hide(m.g));
    for (const c of Bp.group.children) {
      if (c.isMesh && (nearMesh(c, 143.4, 40.6, 1.0) || nearMesh(c, 152.2, 10.2, 0.8))) hide(c);          // (Fermín's barrow and bucket by the old slide, Gaspar's map)
    }
    if (o.past || o.future) campMeshes().forEach(hide);          // (tomorrow the camp is drowned: its canopy and tent tops would poke through the boardwalks)
    if (o.past) {
      templeMeshes().forEach(hide);
      if (O.door) { hide(O.door.g); hide(O.door.sign); }
      for (const c of Bp.group.children) if (c.isMesh && c.material && c.material.type === 'MeshBasicMaterial' && nearMesh(c, 142, -22.4, 0.6) && c.geometry.boundingSphere.radius < 3) hide(c);     // (the Door of Days' dark doorway)
    }
    for (const ob of g.w3d.scene.children) if (ob.visible && /^(read|diary|townlife|tl-|store|signs?-)/i.test(ob.name || '') && Math.hypot(ob.position.x - CEN.x, ob.position.z - CEN.z) < 60) hide(ob);
    parkToday(true);
    return out;
  }
  let parked = null;
  function parkToday(on) {
    if (on && !parked) {
      parked = [];
      for (const c of WORLD.colliders) if (c.x > 133 && c.x < 161 && c.z > 8 && c.z < 29.5 && RUINS.openDist(c.x, c.z) < 0.5 && Math.abs((c.r || 0) - 0.32) > 0.001) { parked.push([c, c.x, c.z]); c.x = OFF; c.z = OFF; }
    } else if (!on && parked) { for (const [c, x, z] of parked) { c.x = x; c.z = z; } parked = null; }
  }
  let paT = 0;
  function showToday(dt, keepHidden) {
    const g = G(), Bp = B(); if (!Bp || !Bp.group) return;
    const room = g.indoorMod && g.indoorMod(); if (room && room !== TIME) return;
    Bp.group.visible = true; paT += dt;
    const Y = g.sim.you;
    try { Bp.update(dt, paT, { x: Y.x, z: Y.z, y: Y.ry }); } catch (e) { /* */ }
    if (keepHidden) for (const o of keepHidden) if (o) o.visible = false;      // (the canyon's own update may show its people again)
  }
  // the two cracks that stand on a boardwalk tomorrow: their height follows the world (TIME.crack takes one height; TIME._.VIS is the
  // crack's mesh), and so does the height of the E that steps through them
  const DECKED = ['ruins.gate', 'ruins.future'];
  const crackY = c => (TIME.world() === 'future' && TIME.regionNow() === 'ruins' ? DECK_Y : gy(c.x, c.z));
  function cracksY() {
    for (const id of DECKED) {
      const c = TIME.CRACKS[id], Mv = TIME._.VIS && TIME._.VIS[id]; if (!c || !Mv) continue;
      const y = crackY(c); if (Math.abs(Mv.g.position.y - y) > 0.005) Mv.g.position.y = y;
    }
  }

  // ------------------------------------------------------------ Noa, through the crack by the beach (DESIGN.md 18.5)
  const TXT = {
    'noa.open1': L('It’s Noa! Can you hear me? This crack smells of sand and old stone… and it carries two more of Elio’s echoes: one in the {w.rup_canyon} long ago, one in the {w.rup_canyon} tomorrow.',
      '¡Soy Noa! ¿Me oyes? Esta grieta huele a arena y a piedra vieja… y trae dos ecos más de Elio: uno en el cañón de antes, otro en el cañón de mañana.',
      'É a Noa! Você me ouve? Esta fenda tem cheiro de areia e de pedra velha… e traz mais dois ecos do Elio: um no cânion de antigamente, outro no cânion de amanhã.',
      'Ich bin’s, Noa! Hörst du mich? Dieser Riss riecht nach Sand und altem Stein … und er trägt noch zwei Echos von Elio: eins in der Schlucht von früher, eins in der Schlucht von morgen.',
      '[是|shì] [我|wǒ] ， [诺娅|Nuò yà] ！ [你|nǐ] [听得见|tīng de jiàn] [吗|ma] ？ [这|zhè] [道|dào] [裂缝|liè fèng] [有|yǒu] [沙子|shā zi] [和|hé] [老|lǎo] [石头|shí tou] [的|de] [味道|wèi dao] … [还有|hái yǒu] [艾利欧|Ài lì ōu] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] ： [一|yī] [个|gè] [在|zài] [从前|cóng qián] [的|de] [峡谷|xiá gǔ] ， [一|yī] [个|gè] [在|zài] [明天|míng tiān] [的|de] [峡谷|xiá gǔ] 。',
      'ノア だ よ ！ [聞|き]こえる ？ この [裂|さ]け[目|め] は [砂|すな] と [古|ふる]い [石|いし] の におい が する … それ と 、 エリオ の こだま が あと [二|ふた]つ 。 [昔|むかし] の [谷|たに] に [一|ひと]つ 、 [明日|あした] の [谷|たに] に [一|ひと]つ 。'),
    'noa.open2': L('Years after the port, Elio came down this coast, a young man now. He worked at the first {w.rup_dig} here, long ago, when the canyon was still green. And one night, the {w.rup_river} flooded…',
      'Años después del puerto, Elio bajó por esta costa, ya un joven. Trabajó aquí en la primera excavación, hace mucho, cuando el cañón todavía era verde. Y una noche, el río se desbordó…',
      'Anos depois do porto, o Elio desceu por esta costa, já um rapaz. Trabalhou aqui na primeira escavação, há muito tempo, quando o cânion ainda era verde. E uma noite, o rio transbordou…',
      'Ein paar Jahre nach dem Hafen kam Elio diese Küste herunter, schon ein junger Mann. Er hat hier bei der ersten Ausgrabung gearbeitet, vor langer Zeit, als die Schlucht noch grün war. Und eines Nachts trat der Fluss über die Ufer …',
      '[离开|lí kāi] [港口|gǎng kǒu] [几|jǐ] [年|nián] [以后|yǐ hòu] ， [艾利欧|Ài lì ōu] [沿着|yán zhe] [海岸|hǎi àn] [来到|lái dào] [这里|zhè lǐ] ， [已经|yǐ jīng] [是|shì] [个|gè] [年轻人|nián qīng rén] [了|le] 。 [很|hěn] [久|jiǔ] [以前|yǐ qián] ， [峡谷|xiá gǔ] [还是|hái shi] [绿|lǜ] [的|de] ， [他|tā] [在|zài] [这里|zhè lǐ] [的|de] [第一|dì yī] [次|cì] [挖掘|wā jué] [中|zhōng] [帮|bāng] [过|guò] [忙|máng] 。 [有|yǒu] [一|yī] [天|tiān] [夜里|yè lǐ] ， [河水|hé shuǐ] [涨|zhǎng] [了|le] [起来|qǐ lai] …',
      '[港|みなと] の [何年|なんねん] か [後|あと] 、 エリオ は この [海岸|かいがん] を [下|くだ]って きた 。 もう [青年|せいねん] に なって いた 。 ずっと [昔|むかし] 、 [谷|たに] が まだ [緑|みどり] だった ころ 、 ここ の [最初|さいしょ] の [発掘|はっくつ] で [働|はたら]いて いた の 。 そして ある [夜|よる] 、 [川|かわ] が あふれた …'),
    'noa.open3': L('Step into the Past and find out what had happened that night: «When we arrived, the river had already…». And listen to what people tell you: «She said that…». Through the crack in the old town, or this one.',
      'Entra en el Ayer y averigua qué había pasado esa noche: «Cuando llegamos, el río ya había…». Y escucha lo que cuenta la gente: «Dijo que…». Por la grieta del pueblo viejo, o por esta.',
      'Entra no Ontem e descobre o que tinha acontecido naquela noite: «Quando chegamos, o rio já tinha…». E escuta o que as pessoas contam: «Disse que…». Pela fenda da cidade velha, ou por esta.',
      'Geh ins Gestern und finde heraus, was in jener Nacht passiert war: «Als wir ankamen, war der Fluss schon …». Und hör zu, was die Leute erzählen: «Sie hat gesagt, dass …». Durch den Riss in der Altstadt oder durch diesen hier.',
      '[去|qù] [昨天|zuó tiān] ， [弄清楚|nòng qīng chu] [那|nà] [天|tiān] [夜里|yè lǐ] [发生|fā shēng] [了|le] [什么|shén me] ： “ [我们|wǒ men] [到|dào] [的|de] [时候|shí hou] ， [河水|hé shuǐ] [已经|yǐ jīng] … [了|le] ” 。 [也|yě] [听听|tīng ting] [大家|dà jiā] [怎么|zěn me] [说|shuō] ： “ [她|tā] [说|shuō] … ” 。 [走|zǒu] [老城|lǎo chéng] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[昨日|きのう] へ [行|い]って 、 あの [夜|よる] [何|なに] が あった か [調|しら]べて 。 「 [着|つ]いた とき 、 [川|かわ] は もう … 」 。 それ から 、 みんな の [話|はなし] を [聞|き]いて 。 「 … と [言|い]って いました 」 。 [古|ふる]い [町|まち] の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から 。'),
    'noa.past1': L('That was his voice… The earth kept it, all these years. Thank you.',
      'Esa era su voz… La tierra la guardó todos estos años. Gracias.',
      'Era a voz dele… A terra guardou a voz dele todos esses anos. Obrigada.',
      'Das war seine Stimme … Die Erde hat sie all die Jahre bewahrt. Danke.',
      '[那|nà] [是|shì] [他|tā] [的|de] [声音|shēng yīn] … [这么|zhè me] [多|duō] [年|nián] ， [土地|tǔ dì] [一直|yī zhí] [替|tì] [他|tā] [保存|bǎo cún] [着|zhe] 。 [谢谢|xiè xie] [你|nǐ] 。',
      'あれ は かれ の [声|こえ] … [土|つち] が ずっと [守|まも]って いて くれた ん だ ね 。 ありがとう 。'),
    'noa.past2': L('Now tomorrow. In the Future the {w.sea} has come into the canyon: the dig is underwater, and the archaeologists live on {w.ruf_boardwalk:pl}, frozen gray, each on a «when?» or a fear. Tula is still talking. Through the crack at the camp’s edge, or this one.',
      'Ahora, el mañana. En el Mañana el mar entró en el cañón: la excavación está bajo el agua, y los arqueólogos viven en pasarelas, congelados, grises, cada uno con un «¿cuándo?» o con un miedo. Tula todavía habla. Por la grieta al borde del campamento, o por esta.',
      'Agora, o amanhã. No Amanhã o mar entrou no cânion: a escavação está debaixo d’água, e os arqueólogos vivem em passarelas, congelados, cinza, cada um com um «quando?» ou com um medo. A Tula ainda fala. Pela fenda na beira do acampamento, ou por esta.',
      'Jetzt das Morgen. Im Morgen ist das Meer in die Schlucht gekommen: Die Ausgrabung liegt unter Wasser, und die Archäologen leben auf Stegen, erstarrt und grau, jeder bei einem «Wann?» oder einer Angst. Tula redet noch. Durch den Riss am Rand des Lagers oder durch diesen hier.',
      '[现在|xiàn zài] [去|qù] [明天|míng tiān] 。 [在|zài] [明天|míng tiān] ， [海水|hǎi shuǐ] [灌进|guàn jìn] [了|le] [峡谷|xiá gǔ] ： [挖掘|wā jué] [现场|xiàn chǎng] [在|zài] [水|shuǐ] [下|xià] ， [考古|kǎo gǔ] [队员|duì yuán] [住|zhù] [在|zài] [栈道|zhàn dào] [上|shang] ， [都|dōu] [冻|dòng] [住|zhù] [了|le] ， [每|měi] [个|gè] [人|rén] [都|dōu] [停|tíng] [在|zài] [一|yī] [个|gè] “ [什么|shén me] [时候|shí hou] ？ ” [或者|huò zhě] [一|yī] [个|gè] [担心|dān xīn] [上|shang] 。 [图拉|Tú lā] [还|hái] [在|zài] [说话|shuō huà] 。 [走|zǒu] [营地|yíng dì] [边上|biān shang] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[次|つぎ] は [明日|あした] 。 [明日|あした] の [谷|たに] に は [海|うみ] が [入|はい]って きて 、 [発掘|はっくつ] の [現場|げんば] は [水|みず] の [下|した] 。 [考古学者|こうこがくしゃ] たち は [板|いた] の [道|みち] の [上|うえ] で [暮|く]らして いる けど 、 みんな [灰色|はいいろ] に [固|かた]まって いる 。 「 いつ ？ 」 か 、 [不安|ふあん] の まま 。 トゥラ は まだ [話|はな]せる よ 。 キャンプ の [端|はし] の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から 。'),
    'noa.fut1': L('When he steps on the stage again… I don’t think his voice will shake either.',
      'Cuando vuelva a subir al escenario… yo tampoco creo que le tiemble la voz.',
      'Quando ele subir no palco de novo… eu também não acho que a voz dele trema.',
      'Wenn er wieder auf der Bühne steht … ich glaube auch nicht, dass seine Stimme zittert.',
      '[等|děng] [他|tā] [再|zài] [站|zhàn] [上|shàng] [舞台|wǔ tái] [的|de] [时候|shí hou] … [我|wǒ] [也|yě] [不|bù] [觉得|jué de] [他|tā] [的|de] [声音|shēng yīn] [会|huì] [发抖|fā dǒu] 。',
      'また [舞台|ぶたい] に [立|た]ったら … わたし も 、 かれ の [声|こえ] が ふるえる とは [思|おも]わない 。'),
    'noa.fut2': L('That’s both of the Ruins’ echoes: sixteen now. The last two are in the gray marsh at the foot of the Old Tower… I’ll call you when its cracks open.',
      'Ya tienes los dos ecos de las Ruinas: ya son dieciséis. Los dos últimos están en la ciénaga gris, al pie de la Torre Vieja… Te llamaré cuando se abran sus grietas.',
      'Você já tem os dois ecos das Ruínas: já são dezesseis. Os dois últimos estão no pântano cinzento, ao pé da Torre Velha… Eu te chamo quando as fendas de lá abrirem.',
      'Das sind beide Echos der Ruinen: jetzt sind es sechzehn. Die letzten zwei sind im grauen Sumpf am Fuß des Alten Turms … Ich rufe dich, wenn sich die Risse dort öffnen.',
      '[遗迹|yí jì] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] [都|dōu] [找到|zhǎo dào] [了|le] ， [一共|yī gòng] [十六|shí liù] [个|gè] [了|le] 。 [最后|zuì hòu] [两|liǎng] [个|gè] [在|zài] [古塔|Gǔ tǎ] [脚下|jiǎo xià] [的|de] [灰色|huī sè] [沼泽|zhǎo zé] … [等|děng] [那里|nà lǐ] [的|de] [裂缝|liè fèng] [打开|dǎ kāi] [了|le] ， [我|wǒ] [就|jiù] [叫|jiào] [你|nǐ] 。',
      'これ で [遺跡|いせき] の こだま は [二|ふた]つ と も そろった 。 [全部|ぜんぶ] で [十六|じゅうろく] 。 [最後|さいご] の [二|ふた]つ は [古|ふる]い [塔|とう] の ふもと の [灰色|はいいろ] の [沼|ぬま] に ある … そこ の [裂|さ]け[目|め] が [開|ひら]いたら 、 [呼|よ]ぶ ね 。'),
  };
  // Elio's echoes here (CH4.word): the Past's, the young man at the first dig, what the people there had told him; the Future's, the
  // man on his way back to the stage where his voice broke
  const ECHO = {
    past: L('They told me the earth kept everything. It had kept my voice, too.', 'Me dijeron que la tierra lo guardaba todo. También había guardado mi voz.', 'Me disseram que a terra guardava tudo. Ela também tinha guardado a minha voz.',
      'Man hat mir gesagt, dass die Erde alles bewahrt. Sie hatte auch meine Stimme bewahrt.',
      '[大家|dà jiā] [跟|gēn] [我|wǒ] [说|shuō] ， [土地|tǔ dì] [会|huì] [把|bǎ] [一切|yī qiè] [都|dōu] [保存|bǎo cún] [下来|xià lai] 。 [原来|yuán lái] ， [它|tā] [早就|zǎo jiù] [保存|bǎo cún] [了|le] [我|wǒ] [的|de] [声音|shēng yīn] 。',
      '[土|つち] は なんでも [守|まも]って くれる と [言|い]われました 。 ぼく の [声|こえ] も 、 もう [守|まも]って くれて いた ん です 。', { where: 'the Sunken Ruins, long ago' }),
    future: L('When I step on the stage again, I doubt my voice will shake.', 'Cuando suba otra vez al escenario, dudo que me tiemble la voz.', 'Quando eu subir no palco de novo, duvido que a minha voz trema.',
      'Wenn ich wieder auf der Bühne stehe, bezweifle ich, dass meine Stimme zittert.',
      '[等|děng] [我|wǒ] [再|zài] [站|zhàn] [上|shàng] [舞台|wǔ tái] [的|de] [时候|shí hou] ， [我|wǒ] [不|bù] [觉得|jué de] [我|wǒ] [的|de] [声音|shēng yīn] [会|huì] [发抖|fā dǒu] 。',
      'また [舞台|ぶたい] に [立|た]ったら 、 [声|こえ] が ふるえる とは [思|おも]いません 。', { where: 'the Sunken Ruins, tomorrow' }),
  };
  if (typeof CH4 !== 'undefined') { CH4.word('ruins', 'past', ECHO.past); CH4.word('ruins', 'future', ECHO.future); }

  // Noa's voice comes out of the crack: it flares while she talks (its glow swells), and her name tag is hers
  let flare = 0;
  function noaP() { const c = CRACK.gate, y = crackY(c); return { id: 'noa', name: nameOf(NOA), x: c.x, y: y + 0.3, z: c.z, top: 2.5, talking: false }; }
  async function noaSay(key) { flare = 1; snd('chime'); const p = noaP(); try { G().w3d.fx.sparkle(p.x, p.y + 1.4, p.z, 12, ['#bfe4ff', '#fff3c8', '#9fd8e8']); } catch (e) { /* */ } await say(p, TXT[key]); }
  function lookGate() { const c = CRACK.gate, y = crackY(c), Y = G().sim.you, dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1; shot(V(c.x + dx / d * 5.2 + dz / d * 2.4, y + 2.4, c.z + dz / d * 5.2 - dx / d * 2.4), V(c.x, y + 1.5, c.z), 1.0); }
  // the crack card's examples, each language's own: what had happened, what someone said, a «when», a doubt
  const CRACK_EX = { es: ['el río ya había bajado', 'dijo que había visto…', 'cuando baje la marea', 'no creo que…'], pt: ['o rio já tinha baixado', 'disse que tinha visto…', 'quando a maré baixar', 'não acho que…'],
    de: ['der Fluss war schon gesunken', 'sie hat gesagt, dass …', 'sobald das Wasser sinkt', 'ich glaube nicht, dass …'],
    zh: ['[河水|hé shuǐ] [已经|yǐ jīng] [退|tuì] [了|le]', '[她|tā] [说|shuō] …', '[等|děng] [潮水|cháo shuǐ] [退|tuì] [了|le]', '[我|wǒ] [不|bù] [觉得|jué de] …'],
    ja: ['[川|かわ] は もう [引|ひ]いて いた', '… と [言|い]って いました', '[潮|しお] が [引|ひ]いたら', '… とは [思|おも]いません'] };
  async function crackCard() {
    css();
    const l = lang(), nm = w => { const t = TIME.RULES[w].name[l] || TIME.RULES[w].name.en; return isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t); };
    const ex = (CRACK_EX[l] || CRACK_EX.es).map(t => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t)));
    await UI.card(`<div class="tag">The Sunken Ruins’ time cracks</div><div class="rows">`
      + `• In the <b>old town</b>, by the broken columns: today ↔ «${nm('past')}», the canyon green, its river running, the temple just dug free.<br>`
      + `• At the <b>camp’s edge</b>, on the way to the old town: today ↔ «${nm('future')}», the canyon if nobody speaks up.<br>`
      + `• Here, at the <b>head of the beach</b>: all three. Noa’s voice comes through this one: report to her here.<br>`
      + `In the Past, find out <b>what had happened before</b> («${ex[0]}») and pass on <b>what people said</b> («${ex[1]}»). In the Future, everyone froze on a «when?» or a fear: <b>tell them when</b> («${ex[2]}») and <b>doubt the fears</b> («${ex[3]}»).</div><div class="sub">E</div>`, { kind: 'ru-card' });
  }
  async function noaOpen() {
    lock(true);
    try {
      lookGate(); await wait(0.9);
      await noaSay('noa.open1'); await noaSay('noa.open2'); await noaSay('noa.open3');
      flare = 0; await crackCard();
      TIME.seen('ruins.noa', true); G().save();
    } finally { flare = 0; lock(false); }
    think('Into the Past, to the professor of the first dig, at the temple. The crack in the old town leads there, and so does this one.', 6);
  }
  async function reportPast() {
    lock(true);
    try { lookGate(); await wait(0.6); await noaSay('noa.past1'); await noaSay('noa.past2'); st('past').reported = true; G().save(); } finally { flare = 0; lock(false); }
    think('Next: the canyon tomorrow. The crack at the camp’s edge leads there.', 5);
  }
  async function reportFuture() {
    lock(true);
    try {
      lookGate(); await wait(0.6); await noaSay('noa.fut1'); await noaSay('noa.fut2'); st('future').reported = true;
      try { if (typeof QUESTS !== 'undefined' && QUESTS.tick) QUESTS.tick(); } catch (e) { /* */ }
      G().save();
    } finally { flare = 0; lock(false); }
  }

  // ------------------------------------------------------------ the region: TIME dresses both worlds (ruins_past.js fills DRESS.past,
  // ruins_future.js DRESS.future); while you're inside a world's dungeon, the dungeon does its own look, so `look` steps aside
  const DRESS = {
    past: { edge: 'The memory ends at the canyon’s red walls. Let’s stay where it happened.' },
    future: { edge: 'Past the boardwalks there’s only deep gray water. Let’s turn back.', k: () => 0.12 },
  };
  Object.defineProperty(DRESS.past, 'look', { get: () => (typeof RU_PTEMPLE !== 'undefined' && RU_PTEMPLE && RU_PTEMPLE.inside ? null : 'past'), enumerable: true, configurable: true });
  Object.defineProperty(DRESS.future, 'look', { get: () => (typeof RU_FTEMPLE !== 'undefined' && RU_FTEMPLE && RU_FTEMPLE.inside ? null : 'future'), enumerable: true, configurable: true });
  Object.assign(TIME.STEPS, { plupf: 'what had happened before, and what someone said (había + participle; dijo que…)', whendoubt: '«cuando» + the subjunctive for what’s to come, and doubt (no creo que, dudo que)' });
  const songOf = w => () => {
    if (w === 'past') return typeof RU_PAST !== 'undefined' && RU_PAST && RU_PAST.song ? RU_PAST.song() : 'past';
    return typeof RU_FUT !== 'undefined' && RU_FUT && RU_FUT.song ? RU_FUT.song() : 'future';
  };
  TIME.region('ruins', {
    name: { now: 'The Sunken Ruins', past: 'The Sunken Ruins, long ago', future: 'The Sunken Ruins · tomorrow' },
    color: { past: '#c98a3a', future: '#6f6b84' },
    center: CEN, radius: RAD, inside,
    open: () => (typeof CH4 !== 'undefined' ? CH4.open('ruins') : false),
    grammar: { past: ['plupf'], future: ['whendoubt'] },
    songs: { past: songOf('past'), future: songOf('future') },
    dress: DRESS,
    init: api => init(api),
    tick: (api, dt) => tick(dt),
    changed: (api, fw, tw) => {
      if (tw === 'now') parkToday(false);
      cracksY();
      for (const Mm of [typeof RU_PAST !== 'undefined' && RU_PAST, typeof RU_FUT !== 'undefined' && RU_FUT]) if (Mm && Mm.changed) { try { Mm.changed(fw, tw); } catch (e) { console.error('[ruins] changed', e); } }
    },
  });
  TIME.crack('ruins.old', { region: 'ruins', x: CRACK.past.x, z: CRACK.past.z, worlds: ['now', 'past'] });
  TIME.crack('ruins.future', { region: 'ruins', x: CRACK.future.x, z: CRACK.future.z, worlds: ['now', 'future'] });
  TIME.crack('ruins.gate', { region: 'ruins', x: CRACK.gate.x, z: CRACK.gate.z, worlds: ['now', 'past', 'future'] });
  for (const id of DECKED) { const c = TIME.CRACKS[id]; if (c) Object.defineProperty(c, 'y', { get: () => (TIME.world() === 'future' && TIME.regionNow() === 'ruins' ? DECK_Y : undefined), enumerable: true, configurable: true }); }

  function init(api) {
    try { registerWords(); } catch (e) { console.error('[ruins] words', e); }
    try { addTab(); } catch (e) { console.error('[ruins] journal', e); }
    try { if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['エルビラ', 'フェルミン', 'サロメ', 'ダリオ', 'ナディア', 'ガスパル', 'トゥラ', 'エリオ', 'ノア']); } catch (e) { /* */ }
    for (const [Mm, tag] of [[typeof RU_PAST !== 'undefined' && RU_PAST, 'past'], [typeof RU_FUT !== 'undefined' && RU_FUT, 'future'],
      [typeof RU_PTEMPLE !== 'undefined' && RU_PTEMPLE, 'past temple'], [typeof RU_FTEMPLE !== 'undefined' && RU_FTEMPLE, 'future temple'], [typeof RUBOSS !== 'undefined' && RUBOSS, 'bosses']])
      if (Mm && Mm.init) { try { Mm.init(api.G, api); } catch (e) { console.error('[ruins] init ' + tag, e); } }
  }

  // ------------------------------------------------------------ every frame, in any world: Noa (her first words here, the reports)
  let idle = 0;
  const busyNow = g => STORY.busy || STORY.line || g.sim.lock || g.journalOpen || g.state.teaching || TIME.busy
    || document.body.classList.contains('in-battle') || document.body.classList.contains('on-title') || (g.indoorMod && g.indoorMod() && g.indoorMod() !== TIME);
  function tick(dt) {
    const g = G(); if (!g || !g.state) return;
    cracksY();
    flare = Math.max(0, flare - dt * 0.35);
    const Mv = TIME._.VIS && TIME._.VIS['ruins.gate']; if (Mv && Mv.glow) { const k = 1 + flare * 0.9; Mv.glow.scale.set(3.4 * k, 4.2 * k, 1); }
    if (!TIME.open('ruins') || busyNow(g)) { idle = 0; return; }
    const w = TIME.world(), Y = g.sim.you, c = CRACK.gate, d = Math.hypot(Y.x - c.x, Y.z - c.z), s = g.state;
    const P = sp(s), F = sf(s);
    let run = null;
    if (w === 'now' && !TIME.seen('ruins.noa') && d < 7) run = noaOpen;
    else if (d < 3.4 && (w === 'now' || TIME.regionNow() === 'ruins')) {
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
    const c = want === 'past' ? (w === 'future' ? C['ruins.gate'] : C['ruins.old'])
      : want === 'future' ? (w === 'past' ? C['ruins.gate'] : C['ruins.future'])
      : (w === 'past' ? C['ruins.old'] : C['ruins.future']);
    const nm = { past: 'the Past', future: 'the Future', now: 'today' }[want];
    return c ? { x: c.x, z: c.z, hint: `{mimo} looks at the time crack: ${nm} is through there.` } : null;
  }
  const gateT = () => ({ x: CRACK.gate.x, z: CRACK.gate.z, hint: '{mimo} looks at the time crack by the beach. Noa’s voice is in it.' });
  // examples inside English text (steps, quests, hints): each language's own, zh / ja in the mode's text
  const SX = {
    plup: { es: ['el río ya había bajado', 'alguien había abierto la puerta'], pt: ['o rio já tinha baixado', 'alguém tinha aberto a porta'], de: ['der Fluss war schon gesunken', 'jemand hatte die Tür geöffnet'],
      zh: ['[河水|hé shuǐ] [已经|yǐ jīng] [退|tuì] [了|le]', '[有人|yǒu rén] [早就|zǎo jiù] [打开|dǎ kāi] [了|le] [门|mén]'], ja: ['[川|かわ] は もう [引|ひ]いて いました', 'だれ か が もう [戸|と] を [開|あ]けて いました'] },
    said: { es: ['dijo que había visto una luz'], pt: ['disse que tinha visto uma luz'], de: ['sie hat gesagt, dass sie ein Licht gesehen hatte'], zh: ['[她|tā] [说|shuō] [她|tā] [看见|kàn jiàn] [了|le] [一|yī] [道|dào] [光|guāng]'], ja: ['[光|ひかり] を [見|み]た と [言|い]って いました'] },
    mem: { es: ['{mimo} cavó en el barro'], pt: ['O {mimo} cavou na lama'], de: ['{mimo} hat im Schlamm gegraben'], zh: ['{mimo} [在|zài] [泥|ní] [里|lǐ] [挖|wā] [了|le]'], ja: ['{mimo} が [泥|どろ] を [掘|ほ]った'] },
    when: { es: ['cuando baje la marea…'], pt: ['quando a maré baixar…'], de: ['sobald das Wasser sinkt, …'], zh: ['[等|děng] [潮水|cháo shuǐ] [退|tuì] [了|le] …'], ja: ['[潮|しお] が [引|ひ]いたら …'] },
    doubt: { es: ['no creo que se hunda', 'dudo que…'], pt: ['não acho que afunde', 'duvido que…'], de: ['ich glaube nicht, dass er einstürzt', 'ich bezweifle, dass …'], zh: ['[我|wǒ] [不|bù] [觉得|jué de] [它|tā] [会|huì] [塌|tā]', '[不|bù] [一定|yī dìng] …'], ja: ['[崩|くず]れる とは [思|おも]いません', '… かもしれません'] },
    mwhen: { es: ['cuando baje el agua, {mimo} nadará'], pt: ['quando a água baixar, o {mimo} vai nadar'], de: ['sobald das Wasser sinkt, schwimmt {mimo}'], zh: ['[等|děng] [水|shuǐ] [退|tuì] [了|le] ， {mimo} [就|jiù] [游|yóu] [过去|guò qu]'], ja: ['[水|みず] が [引|ひ]いたら 、 {mimo} が [泳|およ]ぎます'] },
    mark: { es: ['el agua había llegado hasta la piedra roja'], pt: ['a água tinha chegado até a pedra vermelha'], de: ['das Wasser war bis zum roten Stein gestiegen'], zh: ['[水|shuǐ] [已经|yǐ jīng] [涨|zhǎng] [到|dào] [了|le] [红|hóng] [石头|shí tou]'], ja: ['[水|みず] は [赤|あか]い [石|いし] まで [来|き]て いました'] },
  };
  function sx(k, labels) {
    const l = lang(), a = (SX[k] || {})[l] || (SX[k] || {}).es || [];
    return a.map((t, i) => { let s = fillMimo(t, l); if (isCl(l)) s = plainT(s); return `«${s}»` + (labels && labels[i] ? ` (${labels[i]})` : ''); }).join(', ');
  }
  const pastT = id => () => via('past', () => (typeof RU_PAST !== 'undefined' && RU_PAST ? RU_PAST.target(id) : null));
  const futT = id => () => via('future', () => (typeof RU_FUT !== 'undefined' && RU_FUT ? RU_FUT.target(id) : null));
  const HEARD = ['farmer', 'fisher', 'fermin'];
  const heardN = s => HEARD.filter(k => sp(s).heard && sp(s).heard[k]).length;
  const toldN = s => HEARD.filter(k => sp(s).told && sp(s).told[k]).length;
  const WHENS = ['fermin', 'nadia'], FEARS = ['gaspar', 'elvira'], WAKE = WHENS.concat(FEARS);
  const wokeIn = (s, list) => list.filter(k => sf(s).woke && sf(s).woke[k]).length;
  const PSTEPS = [
    { _tt: true, text: 'The Sunken Ruins: listen to Noa at the time crack by the beach',
      why: 'Since Port Brisa’s two echoes came home, something shimmers at the head of the beach, where the gully goes up to the camp. Noa’s voice is in it. (Quino’s ship sails here from Port Brisa.)',
      done: s => seenIn(s, 'ruins.noa'), target: gateT, hint: '{mimo} sniffs the air on the beach. A shimmer… and wet earth?' },
    { _tt: true, get text() { return fillEn('In the Past: find {professor}, at the temple’s trench'); },
      get why() { return fillEn('Long ago the canyon was green and the river still ran. The first dig had just found the temple’s door… and one night the river flooded. {professor} runs the dig. Through the crack in the old town, or the one by the beach.'); },
      done: s => !!sp(s).met, target: pastT('professor'), hint: '{mimo} points at a woman in a sun hat, by a trench in front of the temple.' },
    { _tt: true, get text() { return fillEn('Young {elvira}’s questions: what had happened? ({n}/2)'); }, n: s => Math.min(2, sp(s).elviraQ || 0),
      get why() { return fillEn(`Young {elvira}, a student at the dig, wants to know what had happened before they got there this morning: ${sx('plup')}.`); },
      done: s => !!sp(s).elvira, target: pastT('elvira'), hint: '{mimo} points at a young woman by the Wall of Days, a notebook in her hand.' },
    { _tt: true, get text() { return toldN(G() && G().state) ? fillEn('Tell {professor} what each one said ({n}/3)') : fillEn('Hear what they saw last night ({n}/3), then tell {professor}'); }, n: s => (toldN(s) ? toldN(s) : heardN(s)),
      get why() { return fillEn(`{farmer}, {fisher} and young {fermin} each saw something in the night. Then tell {professor} what they said: ${sx('said')}.`); },
      done: s => !!sp(s).joined, target: () => via('past', () => (typeof RU_PAST !== 'undefined' && RU_PAST ? RU_PAST.target(heardN(G().state) >= 3 ? 'professor' : 'heard') : null)), hint: '{mimo} tugs your sleeve toward someone of then.' },
    { _tt: true, text: 'The temple, the day it was first opened: follow his lamp ({n}/3)', n: s => Math.min(3, sp(s).floors || 0),
      get why() { return fillEn(`The quiet young man went in last night with his lamp. In each hall, work out what had happened before you, and tell {mimo} what it did, as a memory (${sx('mem')}).`); },
      done: s => (sp(s).floors || 0) >= 3, target: pastT('temple'), hint: '{mimo} looks at the dark doorway of the temple.' },
    { _tt: true, text: 'At the top of the temple: face the Clay Parrot and free Elio’s echo',
      why: 'Something up there repeats every word it hears… always a little wrong.',
      done: s => echoIn(s, 'past'), target: pastT('temple'), hint: '{mimo} looks at the temple’s doorway. Squawk?' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack by the beach',
      why: 'Elio’s echo is free. Tell Noa: her voice comes through the crack at the head of the beach, in any of the three times.',
      done: s => !!sp(s).reported, target: gateT, hint: '{mimo} looks at the time crack by the beach.' },
  ];
  const FSTEPS = [
    { _tt: true, text: 'In the Future: find Tula on the boardwalks',
      why: 'Tomorrow the sea has come into the canyon. The archaeologists live on boardwalks over the drowned dig, frozen gray. Someone is still talking. Through the crack at the camp’s edge, or the one by the beach.',
      done: s => !!sf(s).met, target: futT('tula'), hint: '{mimo} points at someone on the boardwalk… the only one with any color.' },
    { _tt: true, text: 'Give Fermín and Nadia a «when» ({n}/2)', n: s => wokeIn(s, WHENS),
      get why() { return fillEn(`They froze on a question: «When…?». Tell each one when, in tomorrow’s words: ${sx('when')}.`); },
      done: s => wokeIn(s, WHENS) >= 2, target: () => via('future', () => (typeof RU_FUT !== 'undefined' && RU_FUT ? RU_FUT.target('whens') : null)), hint: '{mimo} tugs your sleeve toward someone gray.' },
    { _tt: true, text: 'Doubt Gaspar’s and Elvira’s fears ({n}/2)', n: s => wokeIn(s, FEARS),
      get why() { return fillEn(`They froze on a fear about tomorrow. Tula knows how to answer a fear: doubt it, ${sx('doubt')}.`); },
      done: s => wokeIn(s, FEARS) >= 2, target: () => via('future', () => (typeof RU_FUT !== 'undefined' && RU_FUT ? RU_FUT.target(sf(G().state).doubtCard ? 'fears' : 'tula') : null)), hint: '{mimo} tugs your sleeve toward someone gray.' },
    { _tt: true, text: 'The sunken temple, half underwater ({n}/3)', n: s => Math.min(3, sf(s).floors || 0),
      get why() { return fillEn(`The tide goes in and out in the halls. Tie {mimo}’s moves to the moment: ${sx('mwhen')}.`); },
      done: s => (sf(s).floors || 0) >= 3, target: futT('temple'), hint: '{mimo} looks at the temple’s half-drowned doorway.' },
    { _tt: true, text: 'In the bell shaft: calm the Gray Moray and free Elio’s echo',
      get why() { return fillEn(`Something lives in the holes of the flooded shaft. It only comes out to bite. Plans land next turn… but a plan for «when it comes out» lands right then.`); },
      done: s => echoIn(s, 'future'), target: futT('temple'), hint: '{mimo} looks at the temple’s doorway, half in the water.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack by the beach',
      why: 'Both of the Ruins’ echoes are free. Tell Noa, at the crack at the head of the beach.',
      done: s => !!sf(s).reported, target: gateT, hint: '{mimo} looks at the time crack by the beach.' },
  ];
  if (typeof CH4 !== 'undefined') {
    CH4.steps('ruins', 'past', PSTEPS);
    CH4.steps('ruins', 'future', FSTEPS);
    CH4.story('ruins', [
      { when: s => seenIn(s, 'ruins.noa'), text: 'Noa’s voice came through a crack on the Sunken Ruins’ beach: two more of Elio’s echoes are here, one long ago, one tomorrow.' },
      { when: s => !!sp(s).joined, text: 'Long ago, a quiet young man helped at the first dig. The night the river flooded, he carried the notebooks up to a cave, woke little Fermín… and spoke to him. By morning he had gone.' },
      { when: s => echoIn(s, 'past'), text: 'At the top of the temple, the Clay Parrot heard the night told right and gave back Elio’s voice: they had told him the earth kept everything, and it had kept his voice, too.' },
      { when: s => !!sf(s).met, text: 'Tomorrow, the sea is over the ruins. Everyone froze on a «when?» or a fear; only Tula still talks.' },
      { when: s => echoIn(s, 'future'), text: 'In the flooded bell shaft, the Gray Moray let its fears go. Elio’s voice, tomorrow: when he steps on the stage again, he doubts it will shake.' },
    ]);
  }

  // ------------------------------------------------------------ the words of both worlds (RUPTXT.WORDS, RUFTXT.WORDS): registered in
  // Mimo's memory (caves.js's way), met in the lines, the demonstrations and the Looks, listed in the journal
  const wordLists = () => [typeof RUPTXT !== 'undefined' ? RUPTXT.WORDS || [] : [], typeof RUFTXT !== 'undefined' ? RUFTXT.WORDS || [] : []];
  function registerWords() {
    if (typeof LEX === 'undefined') return 0;
    let n = 0;
    for (const list of wordLists()) { const add = list.filter(w => !LEX.item(w.id)).map(w => Object.assign({ kind: 'word' }, w)); LEX.register(add); n += add.length; }
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const list of wordLists()) for (const w of list) for (const l of ['zh', 'ja']) if (w[l]) CJK.addSource(w[l]); } catch (e) { /* */ }
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const T0 of [typeof RUPTXT !== 'undefined' && RUPTXT, typeof RUFTXT !== 'undefined' && RUFTXT]) if (T0) for (const tab of [T0.LINES, T0.DEMO]) for (const x of Object.values(tab || {})) for (const l of ['zh', 'ja']) if (x && x[l]) CJK.addSource(x[l]); } catch (e) { /* */ }
    return n;
  }
  function wordsHTML() {
    css();
    const l = lang(), [P, F] = wordLists(), seen = id => typeof LEX !== 'undefined' && LEX.seen(id);
    const row = w => { const t = w[l] || ''; return `<li class="${seen(w.id) ? '' : 'no'}">${seen(w.id) ? '✓ ' : ''}<b>${tHTML(t, l)}</b> <span class="en">${esc(w.en)}</span></li>`; };
    const n = list => list.filter(w => seen(w.id)).length;
    return `<div class="mt"><h4 class="ph-h">Ruins words <small>${n(P) + n(F)} / ${P.length + F.length}</small></h4><p class="note">The Sunken Ruins long ago and tomorrow: every word you meet there, in the lines, the demonstrations and the things you look at, the land itself too (✓ once you’ve met it). Mimo keeps them for review.</p>`
      + `<h5>Long ago <small>${n(P)} / ${P.length}</small></h5><ul class="ru-words">${P.map(row).join('')}</ul>`
      + `<h5>Tomorrow <small>${n(F)} / ${F.length}</small></h5><ul class="ru-words">${F.map(row).join('')}</ul></div>`;
  }
  function addTab() {
    if (typeof UI === 'undefined') return;
    UI.journalTabs = UI.journalTabs || [];
    if (UI.journalTabs.some(t => t.id === 'ru-words')) return;
    UI.journalTabs.push({ id: 'ru-words', group: 'words', label: () => (G() && TIME.open('ruins') && TIME.seen('ruins.noa') ? 'Ruins words' : null), html: () => wordsHTML(), wire() { /* */ } });
  }

  // ------------------------------------------------------------ every zh / ja string against CJK.md's rules: [] when all's well
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
    walk({ TXT, ECHO, NOA, CRACK_EX, SX, TRIG }, 'ruint');
    for (const [Mm, tag] of [[typeof RU_PTEMPLE !== 'undefined' && RU_PTEMPLE, 'past temple'], [typeof RU_FTEMPLE !== 'undefined' && RU_FTEMPLE, 'future temple']]) if (Mm && Mm.ROOM_LINES) walk(Mm.ROOM_LINES, tag);
    if (typeof RUPTXT !== 'undefined') walk(RUPTXT, 'past');
    if (typeof RUFTXT !== 'undefined') walk(RUFTXT, 'future');
    if (typeof RUMUSIC !== 'undefined' && RUMUSIC.TEXT) walk(RUMUSIC.TEXT, 'music');
    // (the hushed lines: as many *starred* words in each language as in the English)
    for (const T0 of [typeof RUPTXT !== 'undefined' && RUPTXT, typeof RUFTXT !== 'undefined' && RUFTXT]) for (const [k, T] of Object.entries((T0 && T0.LINES) || {})) {
      const n = s => (String(s || '').match(/\*[^*]+\*/g) || []).length, ne = n(T.en); if (!ne) continue;
      if ((String(T.en).match(/\*[^*]+\*/g) || []).some(x => /\s/.test(x))) out.push(`${k} (en): a starred phrase; the English stars one word each (story.js hushLine)`);
      for (const l of LANGS) if (n(T[l]) !== ne) out.push(`${k} (${l}): ${n(T[l])} starred words, the English has ${ne}`);
    }
    // (every {w.*} slot in an English line is a word Mimo knows; no word id shared between the two worlds or with anyone else's)
    if (typeof LEX !== 'undefined') {
      const ids = new Set();
      const slots = (o, where) => { for (const [k, T] of Object.entries(o || {})) { const en = String((T && T.en) || ''); let m; SLOT.lastIndex = 0; while ((m = SLOT.exec(en))) if (!LEX.item(m[1])) out.push(`${where}.${k}: no word «${m[1]}»`); } };
      for (const [T0, tag] of [[typeof RUPTXT !== 'undefined' && RUPTXT, 'past'], [typeof RUFTXT !== 'undefined' && RUFTXT, 'future']]) {
        if (!T0) continue; slots(T0.LINES, tag + '.LINES'); slots(T0.DEMO, tag + '.DEMO'); slots(T0.FIGHT, tag + '.FIGHT');
        for (const w of T0.WORDS || []) { if (ids.has(w.id)) out.push(`${tag}: word id ${w.id} twice`); ids.add(w.id); for (const l of ['es', 'pt', 'de', 'zh', 'ja']) if (!w[l]) out.push(`${tag}: ${w.id} has no ${l}`); }
      }
      slots(TXT, 'ruint.TXT');
      for (const [Mm, tag] of [[typeof RU_PTEMPLE !== 'undefined' && RU_PTEMPLE, 'past temple'], [typeof RU_FTEMPLE !== 'undefined' && RU_FTEMPLE, 'future temple']]) if (Mm && Mm.ROOM_LINES) slots(Mm.ROOM_LINES, tag);
    }
    return out;
  }

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the save goes to the test slot)
  // setup(o): the port's setup with every earlier region's path done (PORTT._.t.setup()), Port Brisa finished and reported with its
  // echoes, today's ruins as Chapter 1 left them (bell 7 rung), the ruins open; o.seen === false: Noa's first words still to come
  function setup(o = {}) {
    if (typeof PORTT !== 'undefined' && PORTT && PORTT._ && PORTT._.t && PORTT._.t.setup) {
      PORTT._.t.setup();
      try { if (PORTT._.t.at) PORTT._.t.at('future.top'); } catch (e) { console.error('[ruins] setup port', e); }
    }
    try { TIME.state('port', 'past').reported = true; TIME.state('port', 'future').reported = true; } catch (e) { /* */ }
    if (typeof CH4 !== 'undefined') { CH4._.t.give('port', 'past'); CH4._.t.give('port', 'future'); }
    try { TIME.flag('future', 'pbFree', true); } catch (e) { /* */ }
    const g = G(), f = g.state.flags;
    Object.assign(f, { ruins: true, ruinsDig: true, ruinsSlide: true, ruinsChief: true, ruinsThings: true, ruinsWall: true, ruinsDoor: true, ruinsFree: true, ruinsReport: true });
    f.bells = Math.max(f.bells || 0, 7);
    const r = g.state.ruins || (g.state.ruins = {});
    Object.assign(r, { found: ['alarm', 'towel', 'glasses', 'comb'], given: { dario: 'S', nadia: 'S', salome: 'S', gaspar: 'S' }, panels: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }, hatAsked: true, hatDug: true, suns: [0, 1, 2], tula: true, shards: [0, 1, 2, 3], tulaDone: true, quickDig: true });
    try { if (typeof LEX !== 'undefined') for (const id of ['v.dig', 'v.swim', 'v.climb', 'v.push', 'v.jump', 'v.hit']) if (LEX.item(id) && !LEX.taught(id)) LEX.attempt(id, { ok: true, hints: 0, ms: 3000, mode: 'teach' }); } catch (e) { /* */ }
    try { if (RUINS.sync) RUINS.sync(true); } catch (e) { /* */ }
    if (typeof CH4 !== 'undefined') CH4._.t.openAll(true);
    if (o.seen !== false) TIME.seen('ruins.noa', true);
    const main = typeof QUESTS !== 'undefined' && QUESTS.LIST.find(q => q.id === 'main');
    if (main && !main.steps.some(x => x.ch4 === 'ruins')) {
      const i = main.steps.findIndex(x => x.ch4 === 'soon'); const add = PSTEPS.concat(FSTEPS);
      if (i >= 0) main.steps.splice(i, 0, ...add); else main.steps.push(...add);
    }
    TIME._.fast.on = true; TIME.refresh();
    return TIME.open('ruins');
  }
  const SPOTS = { temple: { x: 142.0, z: -18.6 }, door: { x: 142.0, z: -18.6 }, camp: { x: 145.4, z: 21.4 }, wall: { x: 128.6, z: 1.2 }, beach: { x: 131.0, z: 41.4 } };
  function near(id) {
    const c = CRACK[id] || SPOTS[id]; if (!c) return null;
    const g = G(), Y = g.sim.you; Y.x = c.x + (CRACK[id] ? 1.3 : 0); Y.z = c.z - (CRACK[id] ? 1.0 : 0); g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
    return { x: Y.x, z: Y.z };
  }
  async function go(w, at) { const p = at || { x: CRACK.gate.x + 1.4, z: CRACK.gate.z - 1.4, yaw: Math.PI }; const r = await TIME.go(w, { region: 'ruins', at: p, quick: true }); return r && TIME.world(); }
  // put the save at a step of the ruins' path (everything before it done): 'past.temple' (the Past's temple next), 'past.top' (its
  // boss next), 'future' (the Past reported), 'future.temple', 'future.top'
  function at(step) {
    const P = st('past'), F = st('future'), pm = P.temple || (P.temple = {}), fm = F.temple || (F.temple = {});
    TIME.seen('ruins.noa', true);
    Object.assign(P, { met: true, elviraQ: 2, elvira: true, heard: { farmer: true, fisher: true, fermin: true }, told: { farmer: 'S', fisher: 'S', fermin: 'S' }, joined: true });
    TIME.flag('past', 'ruOpen', true);
    if (step === 'past.temple') { TIME.refresh(); return step; }
    Object.assign(pm, { seen0: true, seen1: true, seen2: true, steps: true, mud: true, done0: true, ambush: true, note: true, statue: true, done1: true, roof: true, stones: true, done2: true, memCard: true });
    P.floors = 3;
    if (step === 'past.top') { TIME.refresh(); return step; }
    Object.assign(pm, { seen3: true, boss: true, done3: true });
    if (typeof CH4 !== 'undefined') CH4._.t.give('ruins', 'past'); P.reported = true;
    if (step === 'future') { TIME.refresh(); return step; }
    Object.assign(F, { met: true, doubtCard: true, woke: { fermin: 'S', nadia: 'S', gaspar: 'S', elvira: 'S' }, open: true });
    if (step === 'future.temple') { TIME.refresh(); return step; }
    Object.assign(fm, { seen0: true, seen1: true, seen2: true, arch: true, done0: true, ambush: true, fear1: true, shelf: true, done1: true, fear2: true, rope: true, done2: true });
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
  const drv = () => (typeof MOLT !== 'undefined' && MOLT && MOLT._ && MOLT._.t && MOLT._.t.drv) || null;
  // more for tests: talk to someone of a world (their Talk, the first menu item), run a scene inside STORY.run, the last toast, a log
  // made readable, a trip that tries twice (and steps a frame first: in a hidden tab no frame has run yet, and TIME's first frame
  // treats the save as just loaded and undoes a trip made before it), a fight driven by phase (fn(pending kind, B) → text, or null to stop)
  const T2 = {
    async talk(w, id, pick = 0) { const P = who(w, id); if (!P) return 'no ' + id; const g = G(); g.sim.you.x = P.x + 0.6; g.sim.you.z = P.z + 1.4; g.sim.snap(); await __g.go(0.3); const e = await drv().E('Talk'); await __g.go(0.4); if (document.querySelector('#choose button')) await drv().pick(pick); return e; },
    run: fn => new Promise(r => { STORY.run(async () => { try { await fn(); } finally { r(); } }); }),
    toast: () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).slice(-1)[0],
    fmt: L => (L || []).map(x => (x.card ? 'CARD ' + String(x.card).slice(0, 50) : x.box ? 'BOX ' + (x.box.title || '') : x.choose ? 'CHOOSE' : x.battle ? 'BATTLE' : (x.who || '') + ': ' + String(x.text || '').slice(0, 80))),
    async goSafe(w, at) { await __g.go(0.1); let r = await go(w, at); if (!r) { await __g.go(0.5); r = await go(w, at); } await __g.go(0.4); return r && TIME.world(); },
    async fight(fn, sec = 30) {
      const B = BATTLE._.api, t0 = performance.now(), sent = [];
      while (performance.now() - t0 < sec * 1000) {
        if (!B.G.running && !document.body.classList.contains('in-battle')) break;
        if (B.G.running && !B.G.auto) B.G.auto = { timing: 'perfect', dodge: 'perfect', dialog: true };
        const pd = B.G.pending;
        if (pd && pd.kind === 'echo') { B.submit(pd.answer || ''); sent.push('(echo)'); }
        else if (pd && pd.kind === 'teach') { const w = isCl(lang()) ? plainT(LEX.src(pd.id)) : LEX.form(pd.id); B.submit(w); sent.push('(teach ' + pd.id + ')'); }
        else if (pd && pd.kind === 'command') { const t = fn(pd.kind, B); if (t == null) break; sent.push(t); B.submit(t); }
        await __g.go(0.2);
      }
      return { sent: sent.slice(-8), n: sent.length, running: B.G.running, inBattle: document.body.classList.contains('in-battle') };
    },
  };

  // both worlds' words go into Mimo's memory as the script loads (TIME.land.check and the journal can count on them), and again at init
  try { registerWords(); } catch (e) { console.error('[ruins] words', e); }
  return { CEN, RAD, CRACK, DRESS, TXT, ECHO, NOA, PSTEPS, FSTEPS, WAKE, WHENS, FEARS, HEARD, WATER_Y, DECK_Y, L, LANGS, isCl, lang, nameOf, enName, fillMimo, fillEn, cjRun, say, demo, hushed, think, you, frame2, lookAt, meet, introduce,
    card, css, grade, ask, memTask, whenTask, TRIG, has, person, who, liftOn, lock, shot, wait, mimoName, plainT, down, st, sp, sf, sn, via, check, sx, registerWords, inside, hideToday, showToday, parkToday, campMeshes, templeMeshes, B, crackY,
    get flare() { return flare; }, set flare(v) { flare = v; },
    _: { noaOpen, reportPast, reportFuture, crackCard, tick, wordsHTML, t: Object.assign({ setup, near, go, probe, at, check: () => check(), get drv() { return drv(); } }, T2) } };
})();
