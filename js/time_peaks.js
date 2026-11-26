'use strict';
// The Frost Peaks in three worlds (DESIGN.md 20 "T3b", game/TIME.md "The Frost Peaks (T3b)"): Chapter 4's sixth place, a region TIME
// dresses itself, in Molinar's and the quarry's shape (time_quarry.js is the model).
//   time_peaks.js            PEAKT: the region, its three cracks, Noa's voice at Escarcha's gate, Chapter 4's steps and echoes, the
//                            shared kit (names, saying and demonstrating, the S–D grader, the ask box, pattern cards, words), the
//                            journal's "Peaks words" page, check() and test hooks
//   peaks_past(_text).js     Escarcha long ago (the next winter after the concert, its clocks newly made): PK_PAST, 7 people, the
//                            night a boy got lost in the snow, 3 side quests
//   peaks_future(_text).js   Escarcha tomorrow (snowed in, every clock stopped, its people frozen): PK_FUT, 8 people, 3 side quests
//   peaks_past_dungeon.js    PK_PCAVE: the White Hollow, the ice cave under the tower's crag (QRKIT's rooms, at y 300, z −120)
//   peaks_future_dungeon.js  PK_FTOWER: the Ice Clock Tower tomorrow, frozen, going up (MOLMILL's rooms, at y 300, z −90)
//   peaks_time_boss.js       PKBOSS: the Blizzard Owl (the Past) and the Gray Cuckoo (the Future), plug-ins on battle/flow.js
//   peaks_time_music.js      PKMUSIC: six songs (each world's area, dungeon and boss) and the cuckoo clock's little tune
// The cracks (open with CH4.open('peaks'): after the gardens' two echoes): by the workshop (today ↔ the Past), on the square's west
// side (today ↔ the Future), just inside the village gate (all three; Noa speaks there). State: TIME.state('peaks', 'past' |
// 'future' | 'now'); flags: TIME.flag('past', 'pkCuckoo' | 'pkCave'), ('future', 'pkFree' | 'pkWarn'), ('now', 'pkShutters').
// The grammar (TIME.md §8, rung 5): the Past, the preterite against the imperfect in one story («cuando llegué, nevaba»; «eran las
// doce cuando sonó la campana»); the Future, the conditional for advice and guesses («yo que tú, iría…», «sería mejor…», «serían las
// tres», «tendría frío»). Each language its own (pt perfeito / imperfeito, «no seu lugar, eu iria», «seria melhor»; de Präteritum
// and Perfekt with «als … schneite», «an deiner Stelle würde ich…», «es wäre besser…», «es könnte drei Uhr sein»; zh 的时候 /
// 正在…的时候 against 了, 要是我是你，我会… / 最好… / 可能; ja ～たとき ～ていました, ～たほうがいいです / わたしだったら～ます / ～でしょう).
const PEAKT = (() => {
  if (typeof TIME === 'undefined' || typeof PEAKS === 'undefined') return null;
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
  const P0 = PEAKS, LEDGE = P0.LEDGE, DOOR = P0.DOOR, VY = P0.VY, LY = P0.LY;
  const CEN = { x: 214, z: -262 }, RAD = 34;
  const CRACK = { past: { x: 214.4, z: -263.0 }, future: { x: 199.4, z: -256.6 }, gate: { x: 188.8, z: -259.6 } };
  const CAVE = { x: 235.0, z: -273.8, look: { x: 236.6, z: -272.4 } };      // the White Hollow's mouth, in the crag beside the tower (the Past)
  // its reach in the other worlds: the village, the path up to the tower's ledge, the ledge
  const inside = (x, z) => {
    try {
      if (P0.villageE(x, z) < 1.06) return true;
      const p = P0.pathInfo(x, z); if (p && p.d < 2.6 && p.t > -0.15 && p.t < 1.15) return true;
      return Math.hypot(x - LEDGE.x, z - LEDGE.z) < LEDGE.r + 0.5;
    } catch (e) { return Math.hypot(x - CEN.x, z - CEN.z) < RAD; }
  };

  // ------------------------------------------------------------ the save's part
  const st = w => TIME.state('peaks', w);
  const R0 = s => (s && s.worlds && s.worlds.r && s.worlds.r.peaks) || {};
  const sp = s => R0(s).past || {}, sf = s => R0(s).future || {}, sn = s => R0(s).now || {};
  const seenIn = (s, k) => !!(s && s.worlds && s.worlds.seen && s.worlds.seen[k]);
  const echoIn = (s, w) => !!(s && s.ch4 && s.ch4.echoes && s.ch4.echoes['peaks.' + w]);

  // ------------------------------------------------------------ names: each language's own cast (PKPTXT.CAST, PKFTXT.CAST)
  const NOA = L('Noa', 'Noa', 'Noa', 'Noa', '[诺娅|Nuò yà]', 'ノア');
  const casts = () => [typeof PKPTXT !== 'undefined' ? PKPTXT.CAST : {}, typeof PKFTXT !== 'undefined' ? PKFTXT.CAST : {}];
  const nameOf = (T, l = lang()) => (!T ? '' : isCl(l) ? plainT(T[l] || T.en) : T[l] || T.en);
  const enName = (T, l) => { if (!T) return ''; if (l === 'es') return T.en; if (isCl(l)) { try { return CJK.roman(T[l], { lang: l }); } catch (e) { return T.en; } } return T[l] || T.en; };
  const fillMimo = (t, l = lang()) => String(t || '').replace(/\{mimo\}/g, isCl(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName());
  function fillEn(t, l = lang()) {
    let s = String(t || '');
    for (const C of casts()) s = s.replace(/\{([a-z]+)\}/g, (m, k) => (C[k] ? enName(C[k], l) : m));
    return s.replace(/\{mimo\}/g, mimoName()).replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }
  const enOf = (T, l) => (T && (T['en_' + l] || T.en)) || '';

  // ------------------------------------------------------------ words: the slots in a line's English ({w.pkp_*}, {w.pkf_*}) and the
  // marks of a demonstration are met as they're said (LEX.expose), so the weave brings them in a few at a time and review keeps them
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

  // ------------------------------------------------------------ saying things (mixed by the weave; a demonstration shows the marked
  // words glossed, whole in the language; the frozen keep only their *starred* words)
  function say(p, T) { if (!p || !T) return Promise.resolve(); const l = lang(); meet(T); p.lines = { en: fillEn(enOf(T, l), l), [l]: fillMimo(T[l] || '', l) }; return STORY.sayInline(p); }
  function demo(p, T, marks) {
    if (!p || !T) return Promise.resolve();
    meet(T, marks);
    const l = lang(), T2 = { en: fillEn(enOf(T, l), l) }; LANGS.forEach(x => { T2[x] = fillMimo(T[x] || '', x); });
    return STORY.demoLine(p, T2, marks);
  }
  function hushed(p, T) { if (!p || !T) return Promise.resolve(); const l = lang(); return STORY.sayHushed ? STORY.sayHushed(p, fillMimo(T[l] || '', l), fillEn(enOf(T, l), l)) : say(p, T); }
  const think = (s, d) => { meet({ en: s }); return STORY.think(fillEn(s), d); };
  const you = s => { meet({ en: s }); return STORY.you(fillEn(s)); };
  // a two-shot from your side
  function frame2(p, side = 1, dist = 4.4) {
    if (!p) return;
    const Y = G().sim.you, dx = p.x - Y.x, dz = p.z - Y.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, y = p.y != null ? p.y : gy(p.x, p.z);
    shot(V((p.x + Y.x) / 2 - ux * dist * 0.55 + uz * side * 2.2, y + 2.4, (p.z + Y.z) / 2 - uz * dist * 0.55 - ux * side * 2.2), V((p.x + Y.x) / 2, y + 1.25, (p.z + Y.z) / 2));
  }
  // a thing you can look at: its word said aloud, shown in the language (glossed), and met; then a line about it (its other
  // words met too)
  function lookAt(id, line, dur = 5) {
    try { if (typeof LEX !== 'undefined' && LEX.item(id)) { introduce(id); const l = lang(), w = isCl(l) ? plainT(LEX.src(id)) : LEX.form(id, { article: true }); try { UI.speak(w); } catch (e) { /* (no voice) */ } } } catch (e) { /* */ }
    think(line, dur);
  }

  // ------------------------------------------------------------ the pattern cards (the grammar point, shown once)
  function css() {
    if (document.getElementById('pkt-css')) return;
    const s = document.createElement('style'); s.id = 'pkt-css';
    s.textContent = `.card.pk-card .ex { display: grid; grid-template-columns: auto auto; gap: 4px 14px; justify-content: center; margin: 10px 0 6px; font-size: 18px; }
.card.pk-card .ex b { color: #4a6f9a; } .card.pk-card.fut .ex b, .card.pk-card.fut .tag { color: #6a5aa8; }
.card.pk-card .note { max-width: 460px; margin: 6px auto 0; font-size: 14px; line-height: 1.45; } .card.pk-card .tag { color: #4a6f9a; }
.card.pk-card .rows { text-align: left; max-width: 460px; margin: 8px auto 0; font-size: 14px; line-height: 1.5; }
.pk-words { columns: 2; column-gap: 18px; font-size: 13px; line-height: 1.5; margin: 6px 0 10px; } .pk-words li { break-inside: avoid; } .pk-words .no { opacity: .45; }`;
    document.head.appendChild(s);
  }
  const tHTML = (t, l) => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l, ruby: 'always' }) : esc(t));
  async function card(C, fut) {
    css();
    const l = lang(), c = C && C[l]; if (!c) return;
    const ex = (c.ex || []).map(([w, e]) => `<b>${tHTML(fillMimo(w, l), l)}</b><span>${esc(e)}</span>`).join('');
    await UI.card(`<div class="tag">${esc(fillEn(C.tag, l))}</div>${ex ? `<div class="ex">${ex}</div>` : ''}<div class="note">${esc(fillEn(c.note, l))}</div><div class="sub">E</div>`, { kind: 'pk-card' + (fut ? ' fut' : '') });
  }

  // ------------------------------------------------------------ grading what you say (S–D: one letter down per miss; "I don't know",
  // the whole sentence on «?», counts as two). T: want (S; an A with an accent missing or none of `more`), alt (A), aux (de: B), person
  // (the right time, someone else: B), aspect (the Past: the other past where this one is needed, «nevó» for «nevaba»: B), and the
  // misses with a tip: pres (now), past (in the Future), fut (in the Past), plan (in the Future: «quitará», a plan, not advice), miss.
  // Items: a string as a word (zh / ja: CJK.contains), a list: all of them.
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const fold = (s, lg) => { let t = nrm(s); if (lg === 'de') t = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'); return t; };
  const words = (s, lg) => ' ' + fold(s, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const hasCJ = (text, src, l) => {
    if (typeof CJK === 'undefined') return false;
    try { const ch = CJK.chars(src, { lang: l }).replace(/\s+/g, ''); if (/[぀-ヿ一-鿿]/.test(ch) && String(text || '').replace(/\s+/g, '').includes(ch)) return true; } catch (e) { /* */ }
    try { if (CJK.contains(text, src, l)) return true; } catch (e) { /* */ }
    if (l === 'zh') { try { const py = nrm(CJK.roman(src, { lang: 'zh' })).replace(/[^a-z]/g, ''); if (py.length >= 4 && nrm(text).replace(/[^a-z]/g, '').includes(py)) return true; } catch (e) { /* */ } }
    if (l === 'ja') { try { const rj = nrm(CJK.roman(src, { lang: 'ja' })).replace(/[^a-z]/g, ''); if (rj.length >= 5 && nrm(text).replace(/[^a-z]/g, '').includes(rj)) return true; } catch (e) { /* */ } }
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
    const v = first('veto'); if (v) return { ok: false, kind: 'veto', why: tip('veto') };
    // the other past where this one is needed («nevó» for «nevaba»): checked first, so a bare verb's A can't hide it
    const as0 = first('aspect', exact); if (as0) return { ok: true, letter: 'B', kind: 'aspect', why: tip('aspect') || `«${model}»` };
    // the right form: an accent missing costs nothing (accents.js; tip: the accented form), unless what you typed is, as typed,
    // another form the task tells apart («llego», I arrive, for «llegó»: then the A stays, and why says why)
    const w = first('want');
    if (w) {
      const mo = !((T.more || {})[lg] || []).length || T.more[lg].some(x => has(text, x, lg));
      const others = ['alt', 'aux', 'person', 'aspect', 'past', 'pres', 'fut', 'plan', 'miss'].flatMap(k => ((T[k] || {})[lg] || []).flat());
      const ac = typeof ACCENTS !== 'undefined' ? ACCENTS.judge(text, w, lg, { others }) : { keep: !accented(text, w, lg), why: `Accent: «${plainT(showForm(w))}»`, tip: '' };
      return { ok: true, letter: !ac.keep && mo ? 'S' : 'A', kind: 'right', why: ac.keep ? ac.why : !mo ? tip('more') || `Right! The whole sentence for an S: «${model}»` : 'Just right!', tip: ac.tip || '' };
    }
    const a = first('alt'); if (a) return { ok: true, letter: 'A', kind: 'alt', why: tip('alt') || 'Right!' };
    const x = first('aux'); if (x) return { ok: true, letter: 'B', kind: 'aux', why: tip('aux') || `«${model}»` };
    for (const fn of [exact, has]) {
      const p = first('person', fn); if (p) return { ok: true, letter: 'B', kind: 'person', why: tip('person') || `«${model}»` };
      const asp = first('aspect', fn); if (asp) return { ok: true, letter: 'B', kind: 'aspect', why: tip('aspect') || `«${model}»` };
      for (const k of ['past', 'pres', 'fut', 'plan', 'miss']) { const m = first(k, fn); if (m) return { ok: false, kind: k, why: tip(k) }; }
    }
    return { ok: false, kind: 'none' };
  }
  // one task, asked until it's said (or you close the box): the frame and the chips on the box, the model on «?»
  // o: { icon, tips, title, hint, onMiss(g, misses) }
  // (a box's title and hint don't go through the weave: a word slot there shows its English)
  const enSlots = s => String(s || '').replace(/\{(w\.[a-z_]+)(?::(pl|f))?\}/g, (m, id, pl) => { try { const it = LEX.item(id); if (!it) return m; const e = String(it.en || '').replace(/\s*\(.*\)$/, ''); return pl === 'pl' ? (/s$/.test(e) ? e : e + 's') : e; } catch (e) { return m; } });
  async function ask(T, o = {}) {
    const lg = lang(), tips = o.tips || {};
    const frame = plainT(fillMimo((T.frame || {})[lg] || '', lg)), chips = ((T.chips || {})[lg] || []).map(([w, e]) => `${plainT(fillMimo(w, lg))} (${e})`).join(' · ');
    const modelRaw = fillMimo((T.model || {})[lg] || '', lg), model = plainT(modelRaw);
    if (T.words) T.words.forEach(introduce);
    let misses = 0;
    for (;;) {
      const r = await UI.command({ name: mimoName(), icon: o.icon || 'star', title: enSlots(fillEn(o.title || T.title, lg)), verbs: [], model: modelRaw, modelEn: enSlots(fillEn((T.model || {}).en || '', lg)), placeholder: `«${frame}»`,
        hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}. ${o.hint ? enSlots(fillEn(o.hint)) + ' ' : ''}Stuck? ? shows the whole sentence.` });
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
  // Mimo's moves long ago, told as memories (PTXT.PV's 3rd-person preterites: «{mimo} sopló…»)
  const EN_V = { 'v.push': 'pushed', 'v.jump': 'jumped', 'v.hit': 'hit', 'v.climb': 'climbed', 'v.blow': 'blew', 'v.sing': 'sang' };
  const PRES = {
    'v.blow': { es: ['sopla', 'soplar', 'soplo'], pt: ['sopra', 'soprar'], de: ['pustet', 'puste', 'pusten', 'bläst'], zh: ['[吹|chuī]'], ja: ['[吹|ふ]いて', '[吹|ふ]く', '[吹|ふ]きます'] },
    'v.push': { es: ['empuja', 'empujar', 'empujo'], pt: ['empurra', 'empurrar'], de: ['schiebt', 'schieb', 'schieben'], zh: ['[推|tuī]'], ja: ['[押|お]して', '[押|お]す', '[押|お]します'] },
    'v.jump': { es: ['salta', 'saltar', 'brinca'], pt: ['pula', 'pular', 'salta'], de: ['springt', 'spring', 'springen'], zh: ['[跳|tiào]'], ja: ['[跳|と]んで', '[跳|と]ぶ', '[跳|と]びます'] },
    'v.climb': { es: ['trepa', 'trepar', 'sube', 'subir'], pt: ['sobe', 'subir'], de: ['klettert', 'kletter', 'klettern'], zh: ['[爬|pá]'], ja: ['[登|のぼ]って', '[登|のぼ]る'] },
    'v.hit': { es: ['golpea', 'golpear', 'pega'], pt: ['bate', 'bater'], de: ['schlägt', 'schlag', 'schlagen'], zh: ['[打|dǎ]'], ja: ['[打|う]って', '[叩|たた]いて', '[打|う]つ'] },
    'v.sing': { es: ['canta', 'cantar', 'canto'], pt: ['canta', 'cantar'], de: ['singt', 'sing', 'singen'], zh: ['[唱|chàng]'], ja: ['[歌|うた]って', '[歌|うた]う'] },
  };
  const chipOf = (f, lg) => (Array.isArray(f) ? (lg === 'de' ? f[f.length - 1] : f.join(' ')) : f);
  function memTask(M) {
    const pv = (typeof PTXT !== 'undefined' && PTXT.PV[M.verb]) || {}, chips = {};
    LANGS.forEach(lg => { const f = (pv[lg] || [])[0]; if (f) chips[lg] = [[chipOf(f, lg), EN_V[M.verb] || '']]; });
    const plus = M.plus || {}, want = {}; LANGS.forEach(lg => { want[lg] = (pv[lg] || []).concat(plus[lg] || []); });
    return { title: M.title, frame: M.frame, chips, model: M.model, more: M.more, words: M.words, want, alt: { de: pv.de2 }, pres: PRES[M.verb] || {},
      tips: { pres: { es: 'That’s now. In the Past, {mimo} only moves in memories: «{form}».', pt: 'That’s now. In the Past, {mimo} only moves in memories: «{form}».', de: 'That’s now. In the Past: «{form}».', zh: 'It already happened: 了 after the verb, «{form}».', ja: 'That’s now. In the Past: ～た, «{form}».' },
        alt: { de: 'Right! In speech Germans would say «{form}».' } } };
  }

  // ------------------------------------------------------------ the people TIME builds (TIME.people), by world and id
  function person(w, id) {
    const list = TIME.people && TIME.people.all['peaks:' + w]; if (!list) return null;
    const P = list.find(q => q.def.id === id); if (!P) return null;
    P.api.name = nameOf(P.def.name); return P;
  }
  const who = (w, id) => { const P = person(w, id); return P ? P.api : null; };

  // ------------------------------------------------------------ today's Escarcha (peaks.js): its people, Lía's pinwheel; hidden in the
  // other worlds (TIME unhides them when the world goes off)
  function hideToday(api) {
    const B = P0.built; if (!B) return;
    (B.people || []).forEach(p => { if (p.root) api.hide(p.root); });
    try { if (B.objects && B.objects.pinwheel && B.objects.pinwheel.g) api.hide(B.objects.pinwheel.g); } catch (e) { /* */ }
    for (const o of G().w3d.scene.children) if (o.visible && /^(read|diary|townlife|tl-|store)/i.test(o.name || '') && Math.hypot(o.position.x - 205, o.position.z + 258) < 40) api.hide(o);
  }
  // (today's Tobías and Lía: their Talk items have no `who`, so they're matched by where they stand)
  const todayP = id => { const B = P0.built; return B && B.people ? B.people.find(p => p.id === id) || null : null; };
  const todayApi = (id, nm) => { const p = todayP(id); return p ? { id, name: nm, x: p.x, y: p.y, z: p.z, top: p.kid ? 1.8 : 2.2, get talking() { return p.talking; }, set talking(v) { p.talking = v; } } : null; };

  // ------------------------------------------------------------ Noa, through the crack inside the village gate (DESIGN.md 18.5)
  const TXT = {
    'noa.open1': L('It’s Noa! Can you hear me? The wind up here carries my voice through this crack… and two more of Elio’s echoes: one in Escarcha long ago, one in Escarcha tomorrow.',
      '¡Soy Noa! ¿Me oyes? El viento de aquí arriba lleva mi voz por esta grieta… y dos ecos más de Elio: uno en la Escarcha de antes, otro en la Escarcha de mañana.',
      'É a Noa! Você me ouve? O vento aqui de cima leva a minha voz por esta fenda… e mais dois ecos do Elio: um na Escarcha de antigamente, outro na Escarcha de amanhã.',
      'Ich bin’s, Noa! Hörst du mich? Der Wind hier oben trägt meine Stimme durch diesen Riss … und noch zwei Echos von Elio: eins im Escarcha von früher, eins im Escarcha von morgen.',
      '[是|shì] [我|wǒ] ， [诺娅|Nuò yà] ！ [你|nǐ] [听得见|tīng de jiàn] [吗|ma] ？ [山|shān] [上|shang] [的|de] [风|fēng] [把|bǎ] [我|wǒ] [的|de] [声音|shēng yīn] [吹|chuī] [进|jìn] [这|zhè] [道|dào] [裂缝|liè fèng] … [还有|hái yǒu] [艾利欧|Ài lì ōu] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] ： [一|yī] [个|gè] [在|zài] [从前|cóng qián] [的|de] [霜村|Shuāng cūn] ， [一|yī] [个|gè] [在|zài] [明天|míng tiān] [的|de] [霜村|Shuāng cūn] 。',
      'ノア だ よ ！ [聞|き]こえる ？ ここ の [風|かぜ] が 、 この [裂|さ]け[目|め] から わたし の [声|こえ] を [運|はこ]んで くれる … それ と 、 エリオ の こだま が あと [二|ふた]つ 。 [昔|むかし] の エスカルチャ に [一|ひと]つ 、 [明日|あした] の エスカルチャ に [一|ひと]つ 。'),
    'noa.open2': L('Long ago, the winter after the concert, a quiet boy came up the pass in a {w.pkp_blizzard}. He got lost in the {w.snow}… and the clockmaker of then went out and found him.',
      'Hace mucho, el invierno después del concierto, un niño callado subió el paso en medio de una ventisca. Se perdió en la nieve… y la relojera de entonces salió a buscarlo y lo encontró.',
      'Há muito tempo, no inverno depois do concerto, um menino calado subiu a passagem no meio de uma nevasca. Ele se perdeu na neve… e a relojoeira daquela época saiu, procurou e o encontrou.',
      'Vor langer Zeit, im Winter nach dem Konzert, kam ein stiller Junge mitten im Schneesturm über den Pass. Er hat sich im Schnee verlaufen … und die Uhrmacherin von damals ist hinausgegangen und hat ihn gefunden.',
      '[很久|hěn jiǔ] [以前|yǐ qián] ， [音乐会|yīn yuè huì] [后|hòu] [的|de] [那|nà] [个|gè] [冬天|dōng tiān] ， [一个|yī gè] [不|bù] [说话|shuō huà] [的|de] [男孩|nán hái] [冒|mào] [着|zhe] [暴风雪|bào fēng xuě] [上|shàng] [了|le] [山口|shān kǒu] 。 [他|tā] [在|zài] [雪|xuě] [里|lǐ] [迷路|mí lù] [了|le] … [那时候|nà shí hou] [的|de] [钟表匠|zhōng biǎo jiàng] [出去|chū qù] [找到|zhǎo dào] [了|le] [他|tā] 。',
      'ずっと [昔|むかし] 、 コンサート の あと の [冬|ふゆ] 、 [無口|むくち] な [男|おとこ] の [子|こ] が [吹雪|ふぶき] の [中|なか] 、 [峠|とうげ] を [登|のぼ]って きた の 。 [雪|ゆき] の [中|なか] で [迷子|まいご] に なって … その ころ の [時計職人|とけいしょくにん] が [探|さが]し に [出|で]て 、 [見|み]つけた の 。'),
    'noa.open3': L('Step into the Past and ask the village about that night. Up there, tell it like a story: what it was like («it was snowing») and what happened («he went out»). Through the crack by the workshop, or this one.',
      'Entra en el Ayer y pregunta en el pueblo por aquella noche. Allí, cuéntalo como una historia: cómo era todo («nevaba») y qué pasó («salió»). Por la grieta junto al taller, o por esta.',
      'Entra no Ontem e pergunta no vilarejo sobre aquela noite. Lá, conta como uma história: como estava tudo («nevava») e o que aconteceu («saiu»). Pela fenda perto da oficina, ou por esta.',
      'Geh ins Gestern und frag im Dorf nach jener Nacht. Erzähl es dort wie eine Geschichte: wie es war («es schneite») und was passiert ist («er ist hinausgegangen»). Durch den Riss bei der Werkstatt oder durch diesen hier.',
      '[去|qù] [昨天|zuó tiān] [吧|ba] ， [问问|wèn wen] [村|cūn] [里|lǐ] [的|de] [人|rén] [那天|nà tiān] [晚上|wǎn shang] [的|de] [事|shì] 。 [在|zài] [那里|nà lǐ] ， [像|xiàng] [讲|jiǎng] [故事|gù shi] [一样|yī yàng] [说|shuō] ： [当时|dāng shí] [是|shì] [什么|shén me] [样子|yàng zi] ， “ [正在|zhèng zài] [下雪|xià xuě] ” ， [发生|fā shēng] [了|le] [什么|shén me] ， “ [他|tā] [出去|chū qù] [了|le] ” 。 [从|cóng] [工坊|gōng fáng] [旁边|páng biān] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[昨日|きのう] へ [行|い]って 、 あの [夜|よる] の こと を [村|むら] の [人|ひと] に [聞|き]いて 。 そこ で は 、 お[話|はなし] の よう に [話|はな]して ね 。 どんな [様子|ようす] だった か 「 [雪|ゆき] が [降|ふ]って いました 」 、 [何|なに] が あった か 「 [出|で]かけました 」 。 [工房|こうぼう] の そば の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から 。'),
    'noa.past1': L('That was his voice… he was cold and scared, and someone came for him. Now it’s free. Thank you.',
      'Esa era su voz… tenía frío y miedo, y alguien fue a buscarlo. Ahora está libre. Gracias.',
      'Era a voz dele… ele estava com frio e com medo, e alguém foi buscá-lo. Agora está livre. Obrigada.',
      'Das war seine Stimme … ihm war kalt, er hatte Angst, und jemand ist ihn holen gegangen. Jetzt ist sie frei. Danke.',
      '[那|nà] [是|shì] [他|tā] [的|de] [声音|shēng yīn] … [他|tā] [又|yòu] [冷|lěng] [又|yòu] [怕|pà] ， [有人|yǒu rén] [去|qù] [找|zhǎo] [了|le] [他|tā] 。 [现在|xiàn zài] [它|tā] [自由|zì yóu] [了|le] 。 [谢谢|xiè xie] [你|nǐ] 。',
      'あれ は かれ の [声|こえ] … [寒|さむ]くて 、 こわかった けど 、 だれ か が [迎|むか]え に [来|き]て くれた 。 やっと [自由|じゆう] に なった ね 。 ありがとう 。'),
    'noa.past2': L('Now tomorrow. In the Future, Escarcha is snowed in and every {w.clock} has stopped. Someone is still talking, in the square. Go through the crack on the square’s west side, or this one.',
      'Ahora, el mañana. En el Mañana, Escarcha está enterrada en la nieve y todos los relojes se pararon. Alguien sigue hablando, en la plaza. Entra por la grieta del lado oeste de la plaza, o por esta.',
      'Agora, o amanhã. No Amanhã, Escarcha está soterrada na neve e todos os relógios pararam. Alguém ainda está falando, na praça. Entra pela fenda do lado oeste da praça, ou por esta.',
      'Jetzt das Morgen. Im Morgen ist Escarcha eingeschneit, und alle Uhren sind stehen geblieben. Jemand redet noch, auf dem Platz. Geh durch den Riss an der Westseite vom Platz oder durch diesen hier.',
      '[现在|xiàn zài] [去|qù] [明天|míng tiān] 。 [在|zài] [明天|míng tiān] ， [霜村|Shuāng cūn] [被|bèi] [大雪|dà xuě] [埋|mái] [了|le] ， [所有|suǒ yǒu] [的|de] [钟|zhōng] [都|dōu] [停|tíng] [了|le] 。 [广场|guǎng chǎng] [上|shang] [还有|hái yǒu] [一个|yī gè] [人|rén] [在|zài] [说话|shuō huà] 。 [走|zǒu] [广场|guǎng chǎng] [西边|xī biān] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[次|つぎ] は [明日|あした] 。 [明日|あした] の エスカルチャ は [雪|ゆき] に うもれて 、 [時計|とけい] が ぜんぶ [止|と]まって いる 。 [広場|ひろば] で 、 まだ だれ か が [話|はな]して いる 。 [広場|ひろば] の [西|にし] がわ の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から [行|い]って 。'),
    'noa.fut1': L('If anyone got lost in the snow… he’d go and look for them. I’m sure of it.',
      'Si alguien se perdiera en la nieve… él iría a buscarlo. Estoy segura.',
      'Se alguém se perdesse na neve… ele iria procurar. Tenho certeza.',
      'Wenn sich jemand im Schnee verlaufen würde … er würde ihn suchen gehen. Da bin ich sicher.',
      '[要是|yào shi] [有人|yǒu rén] [在|zài] [雪|xuě] [里|lǐ] [迷路|mí lù] … [他|tā] [一定|yī dìng] [会|huì] [去|qù] [找|zhǎo] 。 [我|wǒ] [相信|xiāng xìn] 。',
      'もし だれ か が [雪|ゆき] の [中|なか] で [迷子|まいご] に なったら … かれ は きっと [探|さが]し に [行|い]く でしょう 。'),
    'noa.fut2': L('That’s both of the Frost Peaks’ echoes. The next cracks will open in Port Brisa, by the sea… I’ll call you when they do.',
      'Ya tienes los dos ecos de los Picos Helados. Las próximas grietas se abrirán en Puerto Brisa, junto al mar… Te llamaré cuando se abran.',
      'Você já tem os dois ecos dos Picos Gelados. As próximas fendas vão se abrir em Porto Brisa, perto do mar… Eu te chamo quando abrirem.',
      'Das sind beide Echos von den Frostgipfeln. Die nächsten Risse öffnen sich in Port Brisa, am Meer … Ich rufe dich, wenn es so weit ist.',
      '[霜峰|Shuāng fēng] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] [都|dōu] [找到|zhǎo dào] [了|le] 。 [下|xià] [一|yī] [道|dào] [裂缝|liè fèng] [会|huì] [在|zài] [海边|hǎi biān] [的|de] [微风港|Wēi fēng gǎng] [打开|dǎ kāi] … [到|dào] [时候|shí hou] [我|wǒ] [会|huì] [叫|jiào] [你|nǐ] 。',
      'これ で [霜|しも] の [峰|みね] の こだま は [二|ふた]つ と も そろった 。 [次|つぎ] の [裂|さ]け[目|め] は 、 [海|うみ] の そば の ブリサ [港|こう] で [開|ひら]く … その とき は [呼|よ]ぶ ね 。'),
  };
  // Elio's echoes here (CH4.word): the Past's, the boy lost in the snow and found; the Future's, the man's advice to everyone
  const ECHO = {
    past: L('It was snowing, and I got lost… and someone found me.', 'Nevaba, me perdí… y alguien me encontró.', 'Nevava, eu me perdi… e alguém me encontrou.', 'Es schneite, ich habe mich verlaufen … und jemand hat mich gefunden.',
      '[那时候|nà shí hou] [正在|zhèng zài] [下雪|xià xuě] ， [我|wǒ] [迷路|mí lù] [了|le] … [有人|yǒu rén] [找到|zhǎo dào] [了|le] [我|wǒ] 。', '[雪|ゆき] が [降|ふ]って いて 、 [迷子|まいご] に なった … でも 、 だれ か が [見|み]つけて くれた 。', { where: 'the Frost Peaks, long ago' }),
    future: L('If I were you, I’d never leave anyone alone in the snow.', 'Yo que ustedes, nunca dejaría a nadie solo en la nieve.', 'No lugar de vocês, eu nunca deixaria ninguém sozinho na neve.', 'An eurer Stelle würde ich niemanden allein im Schnee lassen.',
      '[要是|yào shi] [我|wǒ] [是|shì] [你们|nǐ men] ， [我|wǒ] [不会|bù huì] [让|ràng] [任何|rèn hé] [人|rén] [一个人|yī gè rén] [留|liú] [在|zài] [雪|xuě] [里|lǐ] 。', 'わたし だったら 、 だれ も [雪|ゆき] の [中|なか] に ひとり に しません 。', { where: 'the Frost Peaks, tomorrow' }),
  };
  if (typeof CH4 !== 'undefined') { CH4.word('peaks', 'past', ECHO.past); CH4.word('peaks', 'future', ECHO.future); }

  // Noa's voice comes out of the crack: it flares while she talks (its glow swells), and her name tag is hers
  let flare = 0;
  function noaP() { const c = CRACK.gate, y = gy(c.x, c.z); return { id: 'noa', name: nameOf(NOA), x: c.x, y: y + 0.3, z: c.z, top: 2.5, talking: false }; }
  async function noaSay(key) { flare = 1; snd('chime'); const p = noaP(); try { G().w3d.fx.sparkle(p.x, p.y + 1.4, p.z, 12, ['#bfe4ff', '#fff3c8', '#e6f4ff']); } catch (e) { /* */ } await say(p, TXT[key]); }
  function lookGate() { const c = CRACK.gate, y = gy(c.x, c.z), Y = G().sim.you, dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1; shot(V(c.x + dx / d * 5.2 + dz / d * 2.4, y + 2.4, c.z + dz / d * 5.2 - dx / d * 2.4), V(c.x, y + 1.5, c.z), 1.0); }
  // the crack card's examples, each language's own: a story with both pasts, the hour in the past, advice, a guess
  const CRACK_EX = { es: ['cuando llegué, nevaba', 'eran las doce', 'yo que tú, iría…', 'serían las tres'], pt: ['quando eu cheguei, nevava', 'era meia-noite', 'no seu lugar, eu iria…', 'seriam três horas'],
    de: ['als ich ankam, schneite es', 'es war Mitternacht', 'an deiner Stelle würde ich gehen', 'es könnte drei Uhr sein'],
    zh: ['[我|wǒ] [到|dào] [的|de] [时候|shí hou] ， [正在|zhèng zài] [下雪|xià xuě]', '[那时|nà shí] [是|shì] [十二|shí èr] [点|diǎn]', '[要是|yào shi] [我|wǒ] [是|shì] [你|nǐ] ， [我|wǒ] [会|huì] [去|qù]', '[可能|kě néng] [是|shì] [三|sān] [点|diǎn]'],
    ja: ['[着|つ]いた とき 、 [雪|ゆき] が [降|ふ]って いました', '[十二時|じゅうにじ] でした', 'わたし だったら 、 [行|い]きます', '[三時|さんじ] でしょう'] };
  async function crackCard() {
    css();
    const l = lang(), nm = w => { const t = TIME.RULES[w].name[l] || TIME.RULES[w].name.en; return isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t); };
    const ex = (CRACK_EX[l] || CRACK_EX.es).map(t => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t)));
    await UI.card(`<div class="tag">Escarcha’s time cracks</div><div class="rows">`
      + `• By the <b>workshop</b>: today ↔ «${nm('past')}», Escarcha about 40 years ago, its clocks brand new.<br>`
      + `• On the <b>square’s west side</b>: today ↔ «${nm('future')}», Escarcha if nobody speaks up.<br>`
      + `• Here, just inside the <b>gate</b>: all three. Noa’s voice comes through this one: report to her here.<br>`
      + `In the Past, tell <b>a story</b>: how it was and what happened, both pasts in one sentence («${ex[0]}», «${ex[1]}»). In the Future the clocks stopped and people froze: give <b>advice</b> and make <b>guesses</b> («${ex[2]}», «${ex[3]}»).</div><div class="sub">E</div>`, { kind: 'pk-card' });
  }
  async function noaOpen() {
    lock(true);
    try {
      lookGate(); await wait(0.9);
      await noaSay('noa.open1'); await noaSay('noa.open2'); await noaSay('noa.open3');
      flare = 0; await crackCard();
      TIME.seen('peaks.noa', true); G().save();
    } finally { flare = 0; lock(false); }
    think('Into the Past, to the clockmaker of then at the workshop. The crack by the workshop leads there, and so does this one.', 6);
  }
  async function reportPast() {
    lock(true);
    try { lookGate(); await wait(0.6); await noaSay('noa.past1'); await noaSay('noa.past2'); st('past').reported = true; G().save(); } finally { flare = 0; lock(false); }
    think('Next: Escarcha tomorrow. The crack on the square’s west side leads there.', 5);
  }
  async function reportFuture() {
    lock(true);
    try {
      lookGate(); await wait(0.6); await noaSay('noa.fut1'); await noaSay('noa.fut2'); st('future').reported = true;
      try { if (typeof QUESTS !== 'undefined' && QUESTS.tick) QUESTS.tick(); } catch (e) { /* */ }
      G().save();
    } finally { flare = 0; lock(false); }
  }

  // ------------------------------------------------------------ the region: TIME dresses both worlds (peaks_past.js fills DRESS.past,
  // peaks_future.js DRESS.future); while you're inside a world's dungeon the dungeon does its own look, so `look` steps aside
  const DRESS = {
    past: { edge: 'The memory ends here… Long ago, Escarcha is only this little village and the tower’s ledge. Let’s stay where it happened.' },
    future: { edge: 'Past the village, tomorrow’s snow is too deep to wade through. Let’s turn back.', k: () => 0.12 },
  };
  Object.defineProperty(DRESS.past, 'look', { get: () => (typeof PK_PCAVE !== 'undefined' && PK_PCAVE && PK_PCAVE.inside ? null : 'past'), enumerable: true, configurable: true });
  Object.defineProperty(DRESS.future, 'look', { get: () => (typeof PK_FTOWER !== 'undefined' && PK_FTOWER && PK_FTOWER.inside ? null : 'future'), enumerable: true, configurable: true });
  Object.assign(TIME.STEPS, { pretimpf: 'the preterite against the imperfect in one story (cuando llegué, nevaba; eran las doce cuando sonó la campana)', condadv: 'the conditional for advice and guesses (yo que tú, iría…; sería mejor…; serían las tres)' });
  const songOf = w => () => {
    if (w === 'past') return typeof PK_PAST !== 'undefined' && PK_PAST && PK_PAST.song ? PK_PAST.song() : 'pk_past';
    return typeof PK_FUT !== 'undefined' && PK_FUT && PK_FUT.song ? PK_FUT.song() : 'pk_future';
  };
  TIME.region('peaks', {
    name: { now: 'Escarcha', past: 'Escarcha, long ago', future: 'Escarcha · tomorrow' },
    color: { past: '#a8865a', future: '#6c7086' },
    center: CEN, radius: RAD, inside,
    open: () => (typeof CH4 !== 'undefined' ? CH4.open('peaks') : false),
    grammar: { past: ['pretimpf'], future: ['condadv'] },
    songs: { past: songOf('past'), future: songOf('future') },
    dress: DRESS,
    init: api => init(api),
    tick: (api, dt) => tick(dt),
    changed: (api, fw, tw) => { for (const M of [typeof PK_PAST !== 'undefined' && PK_PAST, typeof PK_FUT !== 'undefined' && PK_FUT]) if (M && M.changed) { try { M.changed(fw, tw); } catch (e) { console.error('[peaks] changed', e); } } },
  });
  TIME.crack('peaks.workshop', { region: 'peaks', x: CRACK.past.x, z: CRACK.past.z, worlds: ['now', 'past'] });
  TIME.crack('peaks.square', { region: 'peaks', x: CRACK.future.x, z: CRACK.future.z, worlds: ['now', 'future'] });
  TIME.crack('peaks.gate', { region: 'peaks', x: CRACK.gate.x, z: CRACK.gate.z, worlds: ['now', 'past', 'future'] });

  function init(api) {
    try { registerWords(); } catch (e) { console.error('[peaks] words', e); }
    try { addTab(); } catch (e) { console.error('[peaks] journal', e); }
    for (const [M, tag] of [[typeof PK_PAST !== 'undefined' && PK_PAST, 'past'], [typeof PK_FUT !== 'undefined' && PK_FUT, 'future'],
      [typeof PK_PCAVE !== 'undefined' && PK_PCAVE, 'past cave'], [typeof PK_FTOWER !== 'undefined' && PK_FTOWER, 'future tower'], [typeof PKBOSS !== 'undefined' && PKBOSS, 'bosses']])
      if (M && M.init) { try { M.init(api.G, api); } catch (e) { console.error('[peaks] init ' + tag, e); } }
  }

  // ------------------------------------------------------------ every frame, in any world: Noa (her first words here, the reports)
  let idle = 0;
  const busyNow = g => STORY.busy || STORY.line || g.sim.lock || g.journalOpen || g.state.teaching || TIME.busy
    || document.body.classList.contains('in-battle') || document.body.classList.contains('on-title') || (g.indoorMod && g.indoorMod() && g.indoorMod() !== TIME);
  function tick(dt) {
    const g = G(); if (!g || !g.state) return;
    flare = Math.max(0, flare - dt * 0.35);
    const M = TIME._.VIS && TIME._.VIS['peaks.gate']; if (M && M.glow) { const k = 1 + flare * 0.9; M.glow.scale.set(3.4 * k, 4.2 * k, 1); }
    if (!TIME.open('peaks') || busyNow(g)) { idle = 0; return; }
    const w = TIME.world(), Y = g.sim.you, c = CRACK.gate, d = Math.hypot(Y.x - c.x, Y.z - c.z), s = g.state;
    const P = sp(s), F = sf(s);
    let run = null;
    if (w === 'now' && !TIME.seen('peaks.noa') && d < 7) run = noaOpen;
    else if (d < 3.4 && (w === 'now' || TIME.regionNow() === 'peaks')) {
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
    const c = want === 'past' ? (w === 'future' ? C['peaks.gate'] : C['peaks.workshop'])
      : want === 'future' ? (w === 'past' ? C['peaks.gate'] : C['peaks.square'])
      : (w === 'past' ? C['peaks.workshop'] : C['peaks.square']);
    const nm = { past: 'the Past', future: 'the Future', now: 'today' }[want];
    return c ? { x: c.x, z: c.z, hint: `{mimo} looks at the time crack: ${nm} is through there.` } : null;
  }
  const gateT = () => ({ x: CRACK.gate.x, z: CRACK.gate.z, hint: '{mimo} looks at the time crack inside the gate. Noa’s voice is in it.' });
  // examples inside English text (steps, quests, hints): each language's own, zh / ja in the mode's text
  const SX = {
    story: { es: ['cuando el niño llegó, nevaba', 'eran las doce cuando sonó la campana'], pt: ['quando o menino chegou, nevava', 'era meia-noite quando o sino tocou'],
      de: ['als der Junge kam, schneite es', 'es war Mitternacht, als die Glocke läutete'],
      zh: ['[男孩|nán hái] [来|lái] [的|de] [时候|shí hou] ， [正在|zhèng zài] [下雪|xià xuě]', '[钟|zhōng] [响|xiǎng] [的|de] [时候|shí hou] ， [是|shì] [十二|shí èr] [点|diǎn]'],
      ja: ['[男|おとこ] の [子|こ] が [来|き]た とき 、 [雪|ゆき] が [降|ふ]って いました', '[鐘|かね] が [鳴|な]った とき 、 [十二時|じゅうにじ] でした'] },
    mem: { es: ['{mimo} sopló la nieve'], pt: ['O {mimo} soprou a neve'], de: ['{mimo} hat den Schnee weggepustet'], zh: ['{mimo} [吹|chuī] [了|le] [雪|xuě]'], ja: ['{mimo} が [雪|ゆき] を [吹|ふ]いた'] },
    advice: { es: ['yo que tú, me pondría el abrigo', 'sería mejor esperar'], pt: ['no seu lugar, eu vestiria o casaco', 'seria melhor esperar'], de: ['an deiner Stelle würde ich den Mantel anziehen', 'es wäre besser zu warten'],
      zh: ['[要是|yào shi] [我|wǒ] [是|shì] [你|nǐ] ， [我|wǒ] [会|huì] [穿|chuān] [上|shang] [大衣|dà yī]', '[最好|zuì hǎo] [等|děng] [一|yī] [等|děng]'], ja: ['わたし だったら 、 コート を [着|き]ます', '[待|ま]った ほう が いい です'] },
    guess: { es: ['serían las tres', 'iría a la panadería'], pt: ['seriam três horas', 'iria para a padaria'], de: ['es könnte drei Uhr sein', 'sie würde zur Bäckerei gehen'],
      zh: ['[可能|kě néng] [是|shì] [三|sān] [点|diǎn]', '[它|tā] [可能|kě néng] [会|huì] [去|qù] [面包店|miàn bāo diàn]'], ja: ['[三時|さんじ] でしょう', 'パン[屋|や] に [行|い]く でしょう'] },
    tower: { es: ['yo que tú, soplaría la nieve', 'serían las tres'], pt: ['no seu lugar, eu sopraria a neve', 'seriam três horas'], de: ['an deiner Stelle würde ich den Schnee wegpusten', 'es könnte drei Uhr sein'],
      zh: ['[要是|yào shi] [我|wǒ] [是|shì] [你|nǐ] ， [我|wǒ] [会|huì] [吹|chuī] [雪|xuě]', '[可能|kě néng] [是|shì] [三|sān] [点|diǎn]'], ja: ['わたし だったら 、 [雪|ゆき] を [吹|ふ]きます', '[三時|さんじ] でしょう'] },
    advice2: { es: ['yo que tú, saltaría sobre el cuco'], pt: ['no seu lugar, eu pularia no cuco'], de: ['an deiner Stelle würde ich auf den Kuckuck springen'],
      zh: ['[要是|yào shi] [我|wǒ] [是|shì] [你|nǐ] ， [我|wǒ] [会|huì] [打|dǎ] [布谷鸟|bù gǔ niǎo]'], ja: ['わたし だったら 、 カッコウ を [打|う]ちます'] },
    hour: { es: ['serían las cuatro'], pt: ['seriam quatro horas'], de: ['es könnte vier Uhr sein'], zh: ['[可能|kě néng] [是|shì] [四|sì] [点|diǎn]'], ja: ['[四時|よじ] でしょう'] },
  };
  function sx(k, labels) {
    const l = lang(), a = (SX[k] || {})[l] || (SX[k] || {}).es || [];
    return a.map((t, i) => { let s = fillMimo(t, l); if (isCl(l)) s = plainT(s); return `«${s}»` + (labels && labels[i] ? ` (${labels[i]})` : ''); }).join(', ');
  }
  const pastT = id => () => via('past', () => (typeof PK_PAST !== 'undefined' && PK_PAST ? PK_PAST.target(id) : null));
  const futT = id => () => via('future', () => (typeof PK_FUT !== 'undefined' && PK_FUT ? PK_FUT.target(id) : null));
  const HEARD = ['driver', 'pili', 'ines'];
  const heardN = s => HEARD.filter(k => sp(s).heard && sp(s).heard[k]).length;
  const WAKE = ['rafa', 'clara', 'nando', 'pili'];
  const PSTEPS = [
    { _tt: true, text: 'The Frost Peaks: listen to Noa at the time crack inside Escarcha’s gate',
      why: 'Since the gardens’ two echoes came home, something shimmers just inside Escarcha’s gate. Noa’s voice is in it.',
      done: s => seenIn(s, 'peaks.noa'), target: gateT, hint: '{mimo} sniffs the cold air inside the gate. A shimmer?' },
    { _tt: true, get text() { return fillEn('In the Past: find {master}, the clockmaker of then, at the workshop'); },
      get why() { return fillEn('About 40 years ago, the winter after the concert, Escarcha’s clocks were brand new. {master}, the clockmaker, remembers the night a boy got lost in the snow. Through the crack by the workshop, or the one inside the gate.'); },
      done: s => !!sp(s).met, target: pastT('master'), hint: '{mimo} points at a woman in a leather apron, by the workshop.' },
    { _tt: true, text: 'Ask Escarcha about that night ({n}/3)', n: s => heardN(s),
      get why() { return fillEn(`{driver} brought the boy up the pass, little {pili} saw him at the inn, and young {ines} rang the alarm bell. Each tells a piece: tell it back with both pasts, ${sx('story')}.`); },
      done: s => heardN(s) >= 3, target: pastT('heard'), hint: '{mimo} tugs your sleeve toward someone of then.' },
    { _tt: true, get text() { return fillEn('Tell {master} the whole story'); },
      get why() { return fillEn(`What was it like, and what happened? One sentence, both pasts: ${sx('story')}.`); },
      done: s => !!sp(s).joined, target: pastT('master'), hint: '{mimo} points at the clockmaker, by the workshop.' },
    { _tt: true, text: 'The White Hollow: follow the night’s trail ({n}/3)', n: s => Math.min(3, sp(s).floors || 0),
      get why() { return fillEn(`Under the tower’s crag, the ice cave remembers that night. Tell each room how it was and what happened, and tell {mimo} what it did, as a memory (${sx('mem')}).`); },
      done: s => (sp(s).floors || 0) >= 3, target: pastT('cave'), hint: '{mimo} looks up at the dark hollow in the crag, beside the tower.' },
    { _tt: true, text: 'At the bottom: calm the Blizzard Owl and free Elio’s echo',
      why: 'Something huge and white nests at the bottom of the hollow, wrapped in its own storm. It hums like a boy’s voice.',
      done: s => echoIn(s, 'past'), target: pastT('cave'), hint: '{mimo} looks into the White Hollow. The storm is at the very bottom.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack inside Escarcha’s gate',
      why: 'Elio’s echo is free. Tell Noa: her voice comes through the crack inside the gate, in any of the three times.',
      done: s => !!sp(s).reported, target: gateT, hint: '{mimo} looks at the time crack inside the gate.' },
  ];
  const FSTEPS = [
    { _tt: true, get text() { return fillEn('In the Future: find {lia} in the snowed-in square'); },
      get why() { return fillEn('Tomorrow, Escarcha is buried in snow and every clock has stopped. Someone is still talking in the square. Through the crack on the square’s west side, or the one inside the gate.'); },
      done: s => !!sf(s).met, target: futT('lia'), hint: '{mimo} points at someone in the square… the only one with any color.' },
    { _tt: true, text: 'Give advice and make guesses: wake Escarcha ({n}/4)', n: s => WAKE.filter(k => sf(s).woke && sf(s).woke[k]).length,
      get why() { return fillEn(`They froze when the clocks stopped, each stuck on a problem. Look around for a clue, then advise them or guess, in tomorrow’s words: ${sx('advice')}; ${sx('guess')}.`); },
      done: s => WAKE.every(k => sf(s).woke && sf(s).woke[k]), target: futT('frozen'), hint: '{mimo} tugs your sleeve toward someone gray.' },
    { _tt: true, get text() { return fillEn('Wake old {tobias} at the workshop'); },
      get why() { return fillEn('The old clockmaker froze with his hand on his own stopped clock. He knows the tower. Give him advice: where would you go?'); },
      done: s => !!sf(s).open, target: futT('tobias'), hint: '{mimo} points at the old clockmaker, gray by the workshop.' },
    { _tt: true, text: 'Tomorrow’s tower: up to the stopped clock ({n}/3)', n: s => Math.min(3, sf(s).floors || 0),
      get why() { return fillEn(`Inside, ice and silence. Give {mimo} and {lia} advice, and guess what time it was when everything stopped: ${sx('tower')}.`); },
      done: s => (sf(s).floors || 0) >= 3, target: futT('door'), hint: '{mimo} looks at the tower’s door, half buried in snow.' },
    { _tt: true, text: 'At the top: outguess the Gray Cuckoo and free Elio’s echo',
      get why() { return fillEn(`The great clock’s cuckoo froze half out of its door, gray as stone. Advise {mimo} (${sx('advice2')}), and guess the hour it calls (${sx('hour')}).`); },
      done: s => echoIn(s, 'future'), target: futT('door'), hint: '{mimo} looks up at the top of the tower.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack inside Escarcha’s gate',
      why: 'Both of the Frost Peaks’ echoes are free. Tell Noa, at the crack inside the gate.',
      done: s => !!sf(s).reported, target: gateT, hint: '{mimo} looks at the time crack inside the gate.' },
  ];
  if (typeof CH4 !== 'undefined') {
    CH4.steps('peaks', 'past', PSTEPS);
    CH4.steps('peaks', 'future', FSTEPS);
    CH4.story('peaks', [
      { when: s => seenIn(s, 'peaks.noa'), text: 'Noa’s voice came through the crack inside Escarcha’s gate: two more of Elio’s echoes are here, one long ago, one tomorrow.' },
      { when: s => heardN(s) >= 3, text: 'Long ago, on a snowy night, a quiet boy came up the pass on a mule wagon, ate soup at the inn without a word, and went out again into the blizzard.' },
      { when: s => echoIn(s, 'past'), text: 'At the bottom of the White Hollow, the Blizzard Owl heard the whole story and let the boy’s voice go: it was snowing, he got lost… and someone found him.' },
      { when: s => !!sf(s).met, text: 'Tomorrow, Escarcha is buried in snow. Every clock stopped at the same moment, and only Lía is still talking.' },
      { when: s => echoIn(s, 'future'), text: 'The Gray Cuckoo sang the hour again, and every clock in Escarcha started. Elio’s voice, tomorrow: never leave anyone alone in the snow.' },
    ]);
  }

  // ------------------------------------------------------------ the words of both worlds (PKPTXT.WORDS, PKFTXT.WORDS): registered in
  // Mimo's memory (caves.js's way), met in the lines, the demonstrations and the Looks, listed in the journal
  const wordLists = () => [typeof PKPTXT !== 'undefined' ? PKPTXT.WORDS || [] : [], typeof PKFTXT !== 'undefined' ? PKFTXT.WORDS || [] : []];
  function registerWords() {
    if (typeof LEX === 'undefined') return 0;
    let n = 0;
    for (const list of wordLists()) { const add = list.filter(w => !LEX.item(w.id)).map(w => Object.assign({ kind: 'word' }, w)); LEX.register(add); n += add.length; }
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const list of wordLists()) for (const w of list) for (const l of ['zh', 'ja']) if (w[l]) CJK.addSource(w[l]); } catch (e) { /* */ }
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const T of [PKPTXT, PKFTXT]) if (T && T.TASKS) for (const t of Object.values(T.TASKS)) for (const l of ['zh', 'ja']) { const m = t.model && t.model[l]; if (m) CJK.addSource(m); } } catch (e) { /* */ }
    return n;
  }
  function wordsHTML() {
    css();
    const l = lang(), [P, F] = wordLists(), seen = id => typeof LEX !== 'undefined' && LEX.seen(id);
    const row = w => { const t = w[l] || ''; return `<li class="${seen(w.id) ? '' : 'no'}">${seen(w.id) ? '✓ ' : ''}<b>${tHTML(t, l)}</b> <span class="en">${esc(w.en)}</span></li>`; };
    const n = list => list.filter(w => seen(w.id)).length;
    return `<div class="mt"><h4 class="ph-h">Peaks words <small>${n(P) + n(F)} / ${P.length + F.length}</small></h4><p class="note">Escarcha long ago and tomorrow: every word you meet there, in the lines, the demonstrations and the things you look at (✓ once you’ve met it). Mimo keeps them for review.</p>`
      + `<h5>Long ago <small>${n(P)} / ${P.length}</small></h5><ul class="pk-words">${P.map(row).join('')}</ul>`
      + `<h5>Tomorrow <small>${n(F)} / ${F.length}</small></h5><ul class="pk-words">${F.map(row).join('')}</ul></div>`;
  }
  function addTab() {
    if (typeof UI === 'undefined') return;
    UI.journalTabs = UI.journalTabs || [];
    if (UI.journalTabs.some(t => t.id === 'pk-words')) return;
    UI.journalTabs.push({ id: 'pk-words', label: () => (G() && TIME.open('peaks') && TIME.seen('peaks.noa') ? 'Peaks words' : null), html: () => wordsHTML(), wire() { /* */ } });
  }

  // ------------------------------------------------------------ every zh / ja string against CJK.md's rules: [] when all's well
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return ['no CJK'];
    const out = [];
    const v = (s, l, where) => {
      if (!s || typeof s !== 'string' || !/[[぀-ヿ一-鿿]/.test(s)) return;
      if (/[A-Za-z]{2,}/.test(s.replace(/\[[^\]]*\]/g, '').replace(/\{[^}]*\}/g, ''))) return;
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
    walk({ TXT, ECHO, NOA, CRACK_EX, SX, PRES }, 'peakt');
    if (typeof PKPTXT !== 'undefined') walk(PKPTXT, 'past');
    if (typeof PKFTXT !== 'undefined') walk(PKFTXT, 'future');
    if (typeof PKMUSIC !== 'undefined' && PKMUSIC.TEXT) walk(PKMUSIC.TEXT, 'music');
    if (typeof PKBOSS !== 'undefined' && PKBOSS && PKBOSS.TEXT) walk(PKBOSS.TEXT, 'boss');
    return out;
  }
  // every word of both worlds is met somewhere (a line's slot, a demonstration's marks, a Look): the ids never met, [] when all's well
  function cover() {
    const ids = new Set(); const S = JSON.stringify([TXT, typeof PKPTXT !== 'undefined' ? PKPTXT : {}, typeof PKFTXT !== 'undefined' ? PKFTXT : {}, SX], (k, v) => (k === 'WORDS' ? undefined : v));     // (the word lists themselves don't count)
    let m; const re = /w\.pk[pf]_[a-z_]+/g; while ((m = re.exec(S))) ids.add(m[0]);
    for (const M of [typeof PK_PAST !== 'undefined' && PK_PAST, typeof PK_FUT !== 'undefined' && PK_FUT, typeof PK_PCAVE !== 'undefined' && PK_PCAVE, typeof PK_FTOWER !== 'undefined' && PK_FTOWER])
      if (M) for (const L0 of (M.LOOKS || []).concat(M.SEEN || [])) { ids.add(L0.id); let k; const r2 = /w\.pk[pf]_[a-z_]+/g; while ((k = r2.exec(L0.line))) ids.add(k[0]); }
    return wordLists().flat().map(w => w.id).filter(id => !ids.has(id));
  }

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the save goes to the test slot)
  // setup(o): the gardens' setup (every earlier region done) with the gardens finished and reported, today's Escarcha as Chapter 1 left
  // it (the clocks set, the tower's bell rung), the peaks open; o.seen === false: Noa's first words still to come
  function setup(o = {}) {
    if (typeof GARDT !== 'undefined' && GARDT && GARDT._ && GARDT._.t) {
      GARDT._.t.setup();
      try { GARDT._.t.at('future.top'); TIME.state('gardens', 'past').reported = true; TIME.state('gardens', 'future').reported = true; } catch (e) { console.error('[peaks] setup gardens', e); }
      if (typeof CH4 !== 'undefined') { CH4._.t.give('gardens', 'past'); CH4._.t.give('gardens', 'future'); }
    } else if (typeof QUART !== 'undefined' && QUART && QUART._ && QUART._.t) { QUART._.t.setup({ prior: true }); if (typeof CH4 !== 'undefined') CH4._.t.openAll(); }
    const g = G(), f = g.state.flags;
    Object.assign(f, { peaks: true, liaSeen: true, drift: true, tobias: true, clocksSet: true, towerOpen: true, peaksFree: true });
    f.bells = Math.max(f.bells || 0, 5);
    const ps = g.state.peaks || (g.state.peaks = {}); ps.set = ps.set || {}; for (const c of P0.CLOCKS) ps.set[c.id] = ps.set[c.id] || 'S';
    try { if (typeof LEX !== 'undefined' && !LEX.taught('v.blow')) LEX.attempt('v.blow', { ok: true, hints: 0, ms: 3000, mode: 'teach' }); } catch (e) { /* */ }
    if (o.seen !== false) TIME.seen('peaks.noa', true);
    const main = typeof QUESTS !== 'undefined' && QUESTS.LIST.find(q => q.id === 'main');
    if (main && !main.steps.some(x => x.ch4 === 'peaks')) {
      const i = main.steps.findIndex(x => x.ch4 === 'soon'); const add = PSTEPS.concat(FSTEPS);
      if (i >= 0) main.steps.splice(i, 0, ...add); else main.steps.push(...add);
    }
    TIME._.fast.on = true; TIME.refresh();
    return TIME.open('peaks');
  }
  function near(id) {
    const c = CRACK[id] || (id === 'cave' ? { x: CAVE.look.x + 0.6, z: CAVE.look.z + 0.6 } : id === 'door' ? { x: DOOR.x, z: DOOR.z + 2.2 } : id === 'workshop' ? { x: 206.2, z: -264.6 } : id === 'square' ? { x: 205, z: -255.6 } : null); if (!c) return null;
    const g = G(), Y = g.sim.you; Y.x = c.x + (CRACK[id] ? 1.3 : 0); Y.z = c.z + (CRACK[id] ? 1.0 : 0); g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
    return { x: Y.x, z: Y.z };
  }
  async function go(w, at) { const p = at || { x: CRACK.gate.x + 1.4, z: CRACK.gate.z + 1.2, yaw: Math.PI / 2 }; const r = await TIME.go(w, { region: 'peaks', at: p, quick: true }); return r && TIME.world(); }
  // put the save at a step of the peaks' path (everything before it done): 'past.cave' (the Past's White Hollow next), 'past.top' (its
  // boss next), 'future' (the Past reported), 'future.tower', 'future.top'
  function at(step) {
    const P = st('past'), F = st('future'), pm = P.cave || (P.cave = {}), fm = F.tower || (F.tower = {});
    TIME.seen('peaks.noa', true);
    Object.assign(P, { met: true, demo: true, arrived: 'S', heard: { driver: true, pili: true, ines: true }, joined: true });
    if (step === 'past.cave') return step;
    Object.assign(pm, { seen0: true, seen1: true, seen2: true, r0story: true, r0snow: true, done0: true, ambush: true, r1story: true, done1: true, r2bridge: true, r2jump: true, done2: true, memCard: true });
    P.floors = 3;
    if (step === 'past.top') return step;
    Object.assign(pm, { seen3: true, boss: true, done3: true }); TIME.flag('past', 'pkCave', true);
    if (typeof CH4 !== 'undefined') CH4._.t.give('peaks', 'past'); P.reported = true;
    if (step === 'future') { TIME.refresh(); return step; }
    Object.assign(F, { met: true, woke: { rafa: 'S', clara: 'S', nando: 'S', pili: 'S' }, tobias: 'S', open: true });
    if (step === 'future.tower') { TIME.refresh(); return step; }
    Object.assign(fm, { seen0: true, seen1: true, seen2: true, r0light: true, r0snow: true, done0: true, ambush: true, r1gears: true, done1: true, r2guess: 'S', r2push: true, done2: true });
    F.floors = 3; TIME.refresh();
    return step;
  }
  // the crack probe (TIME.md §13): what answers E within 3 steps, and the solids within 2, in the world you're in
  function probe(x, z) {
    const room = G().indoorMod && G().indoorMod(), L0 = room ? room.interactables() : STORY._test.interactables().slice();
    if (!room) for (const P1 of STORY.extra || []) { try { if (P1.interactables) L0.push(...P1.interactables()); } catch (e) { /* */ } }
    const es = L0.filter(it => !it.crack && Math.hypot(it.x - x, it.z - z) < 3).map(it => `${it.label}@${(+it.x).toFixed(1)},${(+it.z).toFixed(1)}`);
    const [a, b] = WORLD.pushOut(x, z, 2); return { e: es, solid: Math.hypot(a - x, b - z) > 0.01 };
  }
  const drv = () => (typeof MOLT !== 'undefined' && MOLT && MOLT._ && MOLT._.t && MOLT._.t.drv) || null;

  return { CEN, RAD, CRACK, CAVE, DOOR, LEDGE, VY, LY, DRESS, TXT, ECHO, NOA, PSTEPS, FSTEPS, WAKE, HEARD, L, LANGS, isCl, lang, nameOf, enName, fillMimo, fillEn, say, demo, hushed, think, you, frame2, lookAt, meet, introduce,
    card, css, grade, ask, memTask, has, person, who, lock, shot, wait, mimoName, plainT, down, st, sp, sf, sn, via, check, sx, registerWords, inside, hideToday, todayP, todayApi,
    get flare() { return flare; }, set flare(v) { flare = v; },
    _: { noaOpen, reportPast, reportFuture, crackCard, tick, wordsHTML, cover, t: { setup, near, go, probe, at, cover: () => cover(), check: () => check(), get drv() { return drv(); } } } };
})();
