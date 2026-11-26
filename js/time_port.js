'use strict';
// Port Brisa in three worlds (DESIGN.md 20.1b "T4a", game/TIME.md "Port Brisa (T4a)"): Chapter 4's seventh place, a region TIME
// dresses itself, in the gardens' shape (time_gardens.js is the model).
//   time_port.js             PORTT: the region, its three cracks, Noa's voice in the plaza, Chapter 4's steps and echoes, the shared
//                            kit (names, saying and demonstrating, the S–D grader, the ask box, pattern cards, words), today's port
//                            set aside in the other worlds (its people, the fort boat, the big ship and the boats at anchor), the
//                            journal's «Harbor words» page, check() and test hooks
//   port_past(_text).js      the port long ago (its busiest years, the fort new): PT_PAST, 7 people, 3 side quests
//   port_future(_text).js    the port tomorrow (empty and gray, people frozen until someone wishes something for them): PT_FUT
//   port_past_dungeon.js     PT_PSHIP: aboard La Golondrina, frozen in the fog (rooms at y 300, z −60, x −430 … −352)
//   port_future_dungeon.js   PT_FOFFICE: the harbor office tomorrow, up to its dark beacon (rooms at y 300, z −30, the same x)
//   port_time_boss.js        PTBOSS: the Fog Octopus (the Past) and the Gray Albatross (the Future), plug-ins on battle/flow.js
//   port_time_music.js       PTMUSIC: six songs (each world's area, dungeon and boss)
// The cracks (open with CH4.open('port'): after the Frost Peaks' two echoes): on the promenade by the ferry pier (today ↔ the Past),
// on the south street by the beach (today ↔ the Future), where the main street comes into the plaza (all three; Noa speaks there).
// State: TIME.state('port', 'past' | 'future' | 'now'); flags: TIME.flag('past', 'pbPlaque' | 'pbShip'), ('future', 'pbFree' |
// 'pbWish'), ('now', 'pbGulls').
// The grammar (TIME.md §8, rung 6): the Past, «estaba + -ando» cut off by the preterite, told as a story («Mientras {mimo} estaba
// pescando, llegó el barco»); the Future, the present subjunctive for wishes («Ojalá que vuelva el barco», «Quiero que…»). Each
// language its own: pt estava + gerúndio / perfeito, «tomara que», «quero que»; de «gerade», «während», «als» with the Präteritum,
// «hoffentlich», «ich wünsche mir, dass…» (the verb last); zh 正在…的时候 + 了, 希望 / 但愿 / 要是…就好了; ja 〜ているとき / 〜ていたら,
// 〜てほしい / 〜ますように.
const PORTT = (() => {
  if (typeof TIME === 'undefined') return null;
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
  const B = () => (G() && G().port) || null;

  // ------------------------------------------------------------ where things are (checked with the probe in every world)
  const CEN = { x: -205, z: -82 }, RAD = 46;
  const CRACK = { past: { x: -232.0, z: -83.6 }, future: { x: -216.0, z: -67.4 }, gate: { x: -207.6, z: -89.0 } };
  const PIERS = [{ z: -106, x1: -250, w: 3 }, { z: -86.5, x1: -253.5, w: 3.2 }, { z: -71, x1: -257.5, w: 3.4 }];
  // its reach in the other worlds: inside the walls, the three piers and the beach (the east gate is the edge)
  const inside = (x, z) => {
    if (x > -166.6 || z < -117.6 || z > -45.8) return false;
    if (x > -236.3) return true;
    if (z > -64.5 && x > -246) return true;                                            // (the beach, round the quay's end)
    return PIERS.some(p => Math.abs(z - p.z) < p.w / 2 - 0.15 && x > p.x1 + 0.4);
  };

  // ------------------------------------------------------------ the save's part
  const st = w => TIME.state('port', w);
  const R0 = s => (s && s.worlds && s.worlds.r && s.worlds.r.port) || {};
  const sp = s => R0(s).past || {}, sf = s => R0(s).future || {}, sn = s => R0(s).now || {};
  const seenIn = (s, k) => !!(s && s.worlds && s.worlds.seen && s.worlds.seen[k]);
  const echoIn = (s, w) => !!(s && s.ch4 && s.ch4.echoes && s.ch4.echoes['port.' + w]);

  // ------------------------------------------------------------ names: each language's own cast (PTPTXT.CAST, PTFTXT.CAST)
  const NOA = L('Noa', 'Noa', 'Noa', 'Noa', '[诺娅|Nuò yà]', 'ノア');
  const casts = () => [typeof PTPTXT !== 'undefined' ? PTPTXT.CAST : {}, typeof PTFTXT !== 'undefined' ? PTFTXT.CAST : {}];
  const nameOf = (T, l = lang()) => (!T ? '' : isCl(l) ? plainT(T[l] || T.en) : T[l] || T.en);
  const enName = (T, l) => { if (!T) return ''; if (l === 'es') return T.en; if (isCl(l)) { try { return CJK.roman(T[l], { lang: l }); } catch (e) { return T.en; } } return T[l] || T.en; };
  const fillMimo = (t, l = lang()) => String(t || '').replace(/\{mimo\}/g, isCl(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName());
  function fillEn(t, l = lang()) {
    let s = String(t || '');
    for (const C of casts()) s = s.replace(/\{([a-z]+)\}/g, (m, k) => (C[k] ? enName(C[k], l) : m));
    return s.replace(/\{mimo\}/g, mimoName()).replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }
  const enOf = (T, l) => (T && (T['en_' + l] || T.en)) || '';

  // ------------------------------------------------------------ words: the slots in a line's English ({w.pb_*}, {w.pf_*}) and the
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
  // (bare 汉字 / かな in an English tip, «正在», «希望», follow the reading mode: romanized for a player who reads roman)
  const lower1 = s => String(s).charAt(0).toLowerCase() + String(s).slice(1);
  const cjRun = (s, l = lang()) => (isCl(l) && typeof CJK !== 'undefined' && CJK.plain ? String(s).replace(/[぀-ヿ一-鿿][぀-ヿ一-鿿…]*/g, m => { try { return lower1(CJK.plain(m, { lang: l })); } catch (e) { return m; } }) : s);
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
    if (document.getElementById('pbt-css')) return;
    const s = document.createElement('style'); s.id = 'pbt-css';
    s.textContent = `.card.pb-card .ex { display: grid; grid-template-columns: auto auto; gap: 4px 14px; justify-content: center; margin: 10px 0 6px; font-size: 18px; }
.card.pb-card .ex b { color: #2f6f9a; } .card.pb-card.fut .ex b, .card.pb-card.fut .tag { color: #6a5aa8; }
.card.pb-card .note { max-width: 470px; margin: 6px auto 0; font-size: 14px; line-height: 1.45; } .card.pb-card .tag { color: #2f6f9a; }
.card.pb-card .rows { text-align: left; max-width: 470px; margin: 8px auto 0; font-size: 14px; line-height: 1.5; }
.pb-words { columns: 2; column-gap: 18px; font-size: 13px; line-height: 1.5; margin: 6px 0 10px; } .pb-words li { break-inside: avoid; } .pb-words .no { opacity: .45; }`;
    document.head.appendChild(s);
  }
  const tHTML = (t, l) => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l, ruby: 'always' }) : esc(t));
  async function card(C, fut) {
    css();
    const l = lang(), c = C && C[l]; if (!c) return;
    const ex = (c.ex || []).map(([w, e]) => `<b>${tHTML(fillMimo(w, l), l)}</b><span>${esc(e)}</span>`).join('');
    await UI.card(`<div class="tag">${esc(fillEn(c.tag || C.tag, l))}</div>${ex ? `<div class="ex">${ex}</div>` : ''}<div class="note">${esc(fillEn(c.note, l))}</div><div class="sub">E</div>`, { kind: 'pb-card' + (fut ? ' fut' : '') });
  }

  // ------------------------------------------------------------ grading what you say (S–D: one letter down per miss; «?», the whole
  // sentence, counts as two). T: want (S; an A with an accent missing or none of `more`), alt (A), and right-but-off answers that
  // are a B with a tip: aux, person, aspect (two things one after the other, or once instead of going on: «cargó»), sudden (the
  // sudden thing told as going on: «llegaba»), mood (a wish in the indicative: «ojalá que vuelven»), order (de: after «dass» the
  // verb goes last); and the misses with a tip: past, pres, fut, miss. Items: a string as a word or phrase (zh / ja: CJK.contains),
  // a list: all of them. (the gardens' grader, kept here so the port stands on its own)
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const fold = (s, lg) => { let t = nrm(s); if (lg === 'de') t = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'); return t; };
  const words = (s, lg) => ' ' + fold(s, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const hasCJ = (text, src, l) => {
    if (typeof CJK === 'undefined') return false;
    try { const ch = CJK.chars(src, { lang: l }).replace(/\s+/g, ''); if (/[぀-ヿ一-鿿]/.test(ch) && String(text || '').replace(/\s+/g, '').includes(ch)) return true; } catch (e) { /* */ }
    try { if (CJK.contains(text, src, l)) return true; } catch (e) { /* */ }
    if (l === 'zh') { try { const py = nrm(CJK.roman(src, { lang: 'zh' })).replace(/[^a-z]/g, ''); if (py.length >= 4 && nrm(text).replace(/[^a-z]/g, '').includes(py)) return true; } catch (e) { /* */ } }
    if (l === 'ja') { try { const ro = nrm(CJK.roman(src, { lang: 'ja' })).replace(/[^a-z]/g, ''); if (ro.length >= 4 && nrm(text).replace(/[^a-z]/g, '').includes(ro)) return true; } catch (e) { /* */ } }
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
  // de: after «dass» the verb goes last («…, dass die Schiffe zurückkommen»): a B with a tip when the wanted verb is there but not last
  function orderSlip(T, text, lg) {
    const O = (T.order || {})[lg]; if (!O || !O.length || lg !== 'de') return false;
    const w = words(text, lg).trim().split(' '); if (!w.includes('dass')) return false;
    const after = w.slice(w.lastIndexOf('dass') + 1), last = after[after.length - 1] || '', vs = O.map(v => fold(v, lg));
    return !vs.includes(last) && after.some(x => vs.includes(x));
  }
  // (typing only the blank counts as the frame filled in: «cargando» for «El chico estaba ___ cajas»)
  function grade(T, text, lg, TIPS = {}) {
    const g = grade0(T, text, lg, TIPS);
    if (g.ok || g.kind === 'veto') return g;          // (the fill only rescues a miss: it never lifts an A to an S)
    const fr = plainT(fillMimo((T.frame || {})[lg] || '', lg));
    if (!fr.includes('___') || !String(text || '').trim()) return g;
    // (a listed miss of more than one word, said whole, is that miss: «Estás buscando conchas» isn't the frame filled in)
    if (!isCl(lg) && ['pres', 'fut', 'past'].some(k => ((T[k] || {})[lg] || []).some(x => Array.isArray(x) && x.length > 1 && exact(text, x, lg)))) return g;     // (not zh / ja: their match reads the sounds, and «huì» is in «huílai»)
    const n = isCl(lg) ? String(text).replace(/\s+/g, '').length : words(text, lg).trim().split(' ').length;
    if (n > (isCl(lg) ? 8 : 3)) return g;
    // (the blank with its neighbors, «cargando cajas», fills the frame in order; a short sentence of its own, «Los barcos vuelven»,
    // doesn't: its words would land out of order)
    if (!isCl(lg)) {
      const tw = words(text, lg).trim().split(' '), [pre, post] = fr.split('___').map(s => words(s, lg).trim().split(' ').filter(Boolean));
      const fw = new Set([...pre, ...post]);
      let ok = false;
      for (let a = 0; a <= tw.length && !ok; a++) for (let b = tw.length; b > a && !ok; b--) {
        const A = tw.slice(0, a), F = tw.slice(a, b), Bw = tw.slice(b);
        if (F.length <= 3 && !F.some(w => fw.has(w)) && A.every((w, i) => pre[pre.length - A.length + i] === w) && Bw.every((w, i) => post[i] === w)) ok = true;
      }
      if (!ok) return g;
    }
    const frRaw = fillMimo((T.frame || {})[lg] || '', lg), chips = ((T.chips || {})[lg] || []).map(c => c[0]);
    const items = ['want', 'alt', 'aspect', 'sudden', 'mood', 'person', 'pres', 'fut', 'past', 'miss'].flatMap(k => ((T[k] || {})[lg] || []).flat()).filter(x => typeof x === 'string');
    if (!chips.some(c => has(text, c, lg)) && !items.some(x => !has(frRaw.replace(/___/g, ' '), x, lg) && has(text, x, lg))) return g;
    const g2 = grade0(T, fr.replace('___', String(text).trim()), lg, TIPS);
    return g2.ok ? g2 : g;
  }
  const BKEYS = ['aux', 'person', 'aspect', 'sudden', 'mood'];
  function grade0(T, text, lg, TIPS = {}) {
    const model = plainT(fillMimo((T.model || {})[lg] || '', lg)).replace(/\s*[.。]\s*$/, '');
    const tip = k => String((((T.tips || {})[k] || TIPS[k] || {})[lg]) || '').replace('{form}', model);
    const first = (key, fn = has) => ((T[key] || {})[lg] || []).find(x => fn(text, x, lg));
    const v = first('veto'); if (v) return { ok: false, kind: 'veto', why: tip('veto') };
    // a form that counts less, found by its exact spelling first, so a bare verb's A can't hide it («llegaba», «vuelven»)
    for (const k of ['aspect', 'sudden', 'mood']) { const x0 = first(k, exact); if (x0) return { ok: true, letter: 'B', kind: k, why: tip(k) || `«${model}»` }; }
    const w = first('want');
    // (a wanted form found only without its accent, when that spelling is itself a listed miss: «está» for «estaba»…)
    if (w && !first('want', exact)) for (const k of ['past', 'pres', 'fut']) { const m = first(k, exact); if (m) return { ok: false, kind: k, why: tip(k) }; }
    if (w) {
      if (orderSlip(T, text, lg)) return { ok: true, letter: 'B', kind: 'order', why: tip('order') || `The verb goes last after «dass»: «${model}»` };
      const mo = !((T.more || {})[lg] || []).length || T.more[lg].some(x => has(text, x, lg));
      const others = ['alt', 'aux', 'person', 'aspect', 'sudden', 'mood', 'past', 'pres', 'fut', 'miss'].flatMap(k => ((T[k] || {})[lg] || []).flat());
      const ac = typeof ACCENTS !== 'undefined' ? ACCENTS.judge(text, w, lg, { others }) : { keep: !accented(text, w, lg), why: `Accent: «${plainT(showForm(w))}»`, tip: '' };
      return { ok: true, letter: !ac.keep && mo ? 'S' : 'A', kind: 'right', why: ac.keep ? ac.why : !mo ? tip('more') || `Right! The whole sentence for an S: «${model}»` : 'Just right!', tip: ac.tip || '' };
    }
    const a = first('alt'); if (a) return { ok: true, letter: 'A', kind: 'alt', why: tip('alt') || 'Right!' };
    for (const fn of [exact, has]) {
      for (const k of BKEYS) { const x = first(k, fn); if (x) return { ok: true, letter: 'B', kind: k, why: tip(k) || `«${model}»` }; }
      for (const k of ['past', 'pres', 'fut', 'miss']) { const m = first(k, fn); if (m) return { ok: false, kind: k, why: tip(k) }; }
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
  // in the Future, a wish («Quiero que {mimo} suba»: the subjunctive, this rung's own; WISHV below)
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
  // the subjunctive (and each language's own wish) for {mimo}'s moves tomorrow: want, the indicative after «que» (mood, a B), the
  // present alone (a miss), the future plan (an A: it's tomorrow, but not a wish)
  const WISHV = {
    'v.climb': { es: ['suba', 'trepe'], pt: ['suba'], de: ['klettert', 'hochklettert', 'raufklettert'], zh: '[爬|pá]', ja: '[登|のぼ]って', ind: { es: ['sube', 'trepa'], pt: ['sobe'] }, fut: { es: ['subirá', 'trepará'], pt: ['subirá'], de: [['wird', 'klettern']] } },
    'v.push': { es: ['empuje'], pt: ['empurre'], de: ['schiebt', 'wegschiebt'], zh: '[推|tuī]', ja: '[押|お]して', ind: { es: ['empuja'], pt: ['empurra'] }, fut: { es: ['empujará'], pt: ['empurrará'], de: [['wird', 'schieben']] } },
    'v.jump': { es: ['salte', 'brinque'], pt: ['pule', 'salte'], de: ['springt'], zh: '[跳|tiào]', ja: '[跳|と]んで', ind: { es: ['salta', 'brinca'], pt: ['pula', 'salta'] }, fut: { es: ['saltará'], pt: ['pulará'], de: [['wird', 'springen']] } },
    'v.call': { es: ['llame'], pt: ['chame'], de: ['ruft', 'herbeiruft'], zh: '[叫|jiào]', ja: '[呼|よ]んで', ind: { es: ['llama'], pt: ['chama'] }, fut: { es: ['llamará'], pt: ['chamará'], de: [['wird', 'rufen']] } },
    'v.blow': { es: ['sople'], pt: ['sopre'], de: ['pustet', 'wegpustet'], zh: '[吹|chuī]', ja: '[吹|ふ]いて', ind: { es: ['sopla'], pt: ['sopra'] }, fut: { es: ['soplará'], pt: ['soprará'], de: [['wird', 'pusten']] } },
    'v.light': { es: ['ilumine', 'encienda'], pt: ['ilumine', 'acenda'], de: ['anzündet', 'leuchtet'], zh: '[点亮|diǎn liàng]', ja: '[照|て]らして', ind: { es: ['ilumina', 'enciende'], pt: ['ilumina', 'acende'] }, fut: { es: ['iluminará'], pt: ['iluminará'], de: [['wird', 'leuchten']] } },
  };
  const WISH_HEAD = { es: ['quiero que', 'ojalá', 'espero que', 'quiero'], pt: ['quero que', 'tomara que', 'espero que', 'oxalá'], de: ['dass', 'hoffentlich'], zh: ['[希望|xī wàng]', '[要|yào]', '[但愿|dàn yuàn]'], ja: ['ほしい', 'ように'] };
  function wishTask(Mm) {
    const W = WISHV[Mm.verb] || {}, T = { title: Mm.title, frame: Mm.frame, model: Mm.model, more: Mm.more, words: Mm.words, chips: Mm.chips, want: {}, mood: {}, pres: {}, alt: {}, tips: {} };
    T.want.es = W.es.map(f => ['que', f]); T.want.pt = W.pt.map(f => ['que', f]); T.want.de = W.de.map(f => ['dass', f]).concat(W.de.map(f => ['hoffentlich', f]));
    T.want.zh = [['[希望|xī wàng]', W.zh], ['[但愿|dàn yuàn]', W.zh], ['[要|yào]', W.zh]]; T.want.ja = [[W.ja, 'ほしい'], [W.ja.replace(/って$|んで$|いて$|して$/, ''), 'ますように']];
    T.mood = { es: (W.ind.es || []).map(f => ['que', f]), pt: (W.ind.pt || []).map(f => ['que', f]) };
    T.alt = { es: W.fut.es, pt: W.fut.pt, de: W.fut.de };
    const PV = (typeof PTXT !== 'undefined' && PTXT.PV && PTXT.PV[Mm.verb]) || {};
    T.pres = { es: W.ind.es, pt: W.ind.pt }; T.past = { es: PV.es, pt: PV.pt, de: PV.de, zh: PV.zh, ja: PV.ja };
    T.tips = {
      mood: { es: 'Almost! After «quiero que», the subjunctive: «{form}».', pt: 'Almost! After «quero que», the subjunctive: «{form}».' },
      alt: { es: 'Right, that’s tomorrow! As a wish, the subjunctive: «{form}».', pt: 'Right, that’s tomorrow! As a wish, the subjunctive: «{form}».', de: 'Right, that’s tomorrow! As a wish: «{form}».' },
      pres: { es: 'That’s today. Tomorrow, say it as a wish: «{form}».', pt: 'That’s today. Tomorrow, say it as a wish: «{form}».', de: 'That’s today. As a wish: «{form}».', zh: 'Say it as a wish (希望): «{form}».', ja: 'Say it as a wish (～てほしい): «{form}».' },
      past: { es: 'That’s yesterday! A wish: «{form}».', pt: 'That’s yesterday! A wish: «{form}».', de: 'That’s yesterday! A wish: «{form}».', zh: 'That’s yesterday (了)! A wish: «{form}».', ja: 'That’s yesterday (～た)! A wish: «{form}».' },
      order: { de: 'Right! After «dass», the verb goes last: «{form}».' },
    };
    T.order = { de: W.de };
    return T;
  }

  // ------------------------------------------------------------ the people TIME builds (TIME.people), by world and id
  function person(w, id) {
    const list = TIME.people && TIME.people.all['port:' + w]; if (!list) return null;
    const P = list.find(q => q.def.id === id); if (!P) return null;
    P.api.name = nameOf(P.def.name); return P;
  }
  const who = (w, id) => { const P = person(w, id); return P ? P.api : null; };
  // (people on a pier stand on its boards, 0.75 up; TIME's person kit stands them on the ground under it)
  function liftOn(w, id, y) { const P = person(w, id); if (P) { P.g.position.y = y; P.api.y = y; } }

  // ------------------------------------------------------------ today's port, set aside in another world: its people, the fort boat,
  // Yuki's cat, the travelers' suitcases (and tomorrow the gulls); main.js hides the port's group whenever a room is on (TIME counts
  // as one), so in this region's other worlds it's shown again and run (showToday). Today's ships and boats at anchor are part of
  // the city's one merged mesh: a cloned material with world-space holes hides just them (holesOn), with its shadow.
  function hideToday(api, o = {}) {
    const g = G(), Bp = B(); if (!Bp) return [];
    const out = [], hide = obj => { if (obj && obj.visible) { api.hide(obj); out.push(obj); } };
    (Bp.people || []).forEach(p => hide(p.root));
    const O = Bp.objects || {};
    hide(O.boatG);
    const stat = new Set(O.statics || []);
    for (const c of Bp.group.children) {
      if (c.isInstancedMesh) { if (o.future) hide(c); continue; }
      if (c.isMesh && !stat.has(c) && c.geometry && c.geometry.boundingSphere && c !== Bp.group.children[0]) hide(c);     // (the cat, the suitcases; never the sand)
    }
    for (const ob of g.w3d.scene.children) if (ob.visible && /^(read|diary|townlife|tl-|store|signs?-)/i.test(ob.name || '') && Math.hypot(ob.position.x - CEN.x, ob.position.z - CEN.z) < 52) hide(ob);
    parkToday(true);
    return out;
  }
  // today's people have small fixed solids (port.js, port_play.js): parked while they're away, back when today comes back
  let parked = null;
  function parkToday(on) {
    const Bp = B(); if (!Bp) return;
    if (on && !parked) {
      parked = [];
      const at = Bp.people.map(p => [p.def ? p.def.x : p.x, p.def ? p.def.z : p.z]).concat(Bp.people.map(p => [p.x, p.z]));
      for (const c of WORLD.colliders) if (!c.obox && Math.abs((c.r || 0) - 0.4) < 0.01 && at.some(([x, z]) => Math.abs(c.x - x) < 0.02 && Math.abs(c.z - z) < 0.02)) { parked.push([c, c.x, c.z]); c.x = OFF; c.z = OFF; }
    } else if (!on && parked) { for (const [c, x, z] of parked) { c.x = x; c.z = z; } parked = null; }
  }
  let paT = 0;
  function showToday(dt, keepHidden) {
    const g = G(), Bp = B(); if (!Bp || !Bp.group) return;
    const room = g.indoorMod && g.indoorMod(); if (room && room !== TIME) return;
    Bp.group.visible = true; paT += dt;
    const Y = g.sim.you;
    try { Bp.update(dt, paT, { x: Y.x, z: Y.z, y: Y.ry }); } catch (e) { /* */ }
    if (keepHidden) for (const o of keepHidden) if (o) o.visible = false;      // (the port's own update may show its things again)
  }
  // world-space holes in the city's merged mesh (x0, z0, x1, z1, y0, y1): the big ship and its gangplank, the four boats at anchor
  const HOLES = [[-255.4, -68.95, -241.4, -63.4, -1.8, 11.5], [-246.0, -70.4, -244.5, -68.9, 0.92, 1.7],
    [-254.6, -101.8, -250.2, -97.4, -1.6, 0.7], [-261.8, -79.6, -257.4, -75.2, -1.6, 0.7], [-249.8, -115.4, -245.4, -111.0, -1.6, 0.7], [-245.6, -96.8, -241.2, -92.4, -1.6, 0.7]];
  let HM = null;
  function holeMats() {
    if (HM) return HM;
    const Bp = B(), S = Bp && Bp.objects && Bp.objects.statics; if (!S || S.length < 1) return null;
    const ua = { value: HOLES.map(h => new THREE.Vector4(h[0], h[1], h[2], h[3])) }, ub = { value: HOLES.map(h => new THREE.Vector2(h[4], h[5])) };
    const hook = (m, key) => {
      m.onBeforeCompile = sh => {
        sh.uniforms.uHoleA = ua; sh.uniforms.uHoleB = ub;
        sh.vertexShader = 'varying vec3 vHoleW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vHoleW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
        sh.fragmentShader = `varying vec3 vHoleW;\nuniform vec4 uHoleA[${HOLES.length}];\nuniform vec2 uHoleB[${HOLES.length}];\n` + sh.fragmentShader.replace('void main() {',
          `void main() {\n  for (int i = 0; i < ${HOLES.length}; i++) { vec4 a = uHoleA[i]; vec2 b = uHoleB[i]; if (vHoleW.x > a.x && vHoleW.x < a.z && vHoleW.z > a.y && vHoleW.z < a.w && vHoleW.y > b.x && vHoleW.y < b.y) discard; }`);
      };
      m.customProgramCacheKey = () => 'pbHoles' + key;
      return m;
    };
    HM = { mesh: S[0], hull: S[1] || null, m0: S[0].material, h0: S[1] ? S[1].material : null,
      m1: hook(S[0].material.clone(), 'm'), h1: S[1] ? hook(S[1].material.clone(), 'h') : null,
      d1: hook(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), 'd') };
    return HM;
  }
  function holesOn(on) {
    const H = holeMats(); if (!H) return;
    H.mesh.material = on ? H.m1 : H.m0; H.mesh.customDepthMaterial = on ? H.d1 : undefined;
    if (H.hull) H.hull.material = on ? H.h1 : H.h0;
  }

  // ------------------------------------------------------------ Noa, through the crack in the plaza (DESIGN.md 18.5)
  const TXT = {
    'noa.open1': L('It’s Noa! Can you hear me? This crack smells of salt and tar… and it carries two more of Elio’s echoes: one in the {w.harbor} long ago, one in the {w.harbor} tomorrow.',
      '¡Soy Noa! ¿Me oyes? Esta grieta huele a sal y a brea… y trae dos ecos más de Elio: uno en el puerto de antes, otro en el puerto de mañana.',
      'É a Noa! Você me ouve? Esta fenda tem cheiro de sal e de piche… e traz mais dois ecos do Elio: um no porto de antigamente, outro no porto de amanhã.',
      'Ich bin’s, Noa! Hörst du mich? Dieser Riss riecht nach Salz und Teer … und er trägt noch zwei Echos von Elio: eins im Hafen von früher, eins im Hafen von morgen.',
      '[是|shì] [我|wǒ] ， [诺娅|Nuò yà] ！ [你|nǐ] [听得见|tīng de jiàn] [吗|ma] ？ [这|zhè] [道|dào] [裂缝|liè fèng] [有|yǒu] [海盐|hǎi yán] [的|de] [味道|wèi dao] … [还有|hái yǒu] [艾利欧|Ài lì ōu] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] ： [一|yī] [个|gè] [在|zài] [从前|cóng qián] [的|de] [港口|gǎng kǒu] ， [一|yī] [个|gè] [在|zài] [明天|míng tiān] [的|de] [港口|gǎng kǒu] 。',
      'ノア だ よ ！ [聞|き]こえる ？ この [裂|さ]け[目|め] は [潮|しお] の におい が する … それ と 、 エリオ の こだま が あと [二|ふた]つ 。 [昔|むかし] の [港|みなと] に [一|ひと]つ 、 [明日|あした] の [港|みなと] に [一|ひと]つ 。'),
    'noa.open2': L('Years after the concert, Elio came here, a {w.pb_teen} now. He worked on the docks all spring, loading the ships… and he never said a word to anyone.',
      'Años después del concierto, Elio llegó aquí, ya adolescente. Trabajó en el muelle toda la primavera, cargando los barcos… y nunca le dijo una palabra a nadie.',
      'Anos depois do concerto, o Elio chegou aqui, já adolescente. Trabalhou no cais a primavera inteira, carregando os navios… e nunca disse uma palavra a ninguém.',
      'Jahre nach dem Konzert kam Elio hierher, schon ein Jugendlicher. Er hat den ganzen Frühling im Hafen gearbeitet und die Schiffe beladen … und er hat nie ein Wort gesagt.',
      '[音乐会|yīn yuè huì] [过|guò] [了|le] [好几|hǎo jǐ] [年|nián] ， [艾利欧|Ài lì ōu] [来到|lái dào] [这里|zhè lǐ] ， [已经|yǐ jīng] [是|shì] [个|gè] [少年|shào nián] [了|le] 。 [他|tā] [在|zài] [码头|mǎ tóu] [干|gàn] [了|le] [一|yī] [个|gè] [春天|chūn tiān] [的|de] [活|huó] ， [装|zhuāng] [船|chuán] … [可是|kě shì] [他|tā] [从来|cóng lái] [没|méi] [跟|gēn] [谁|shéi] [说|shuō] [过|guò] [一句|yī jù] [话|huà] 。',
      'コンサート から [何年|なんねん] も たって 、 エリオ は ここ に [来|き]た 。 もう [少年|しょうねん] に なって いた 。 [春|はる] の [間|あいだ] ずっと 、 [港|みなと] で [船|ふね] に [荷物|にもつ] を [積|つ]んで いた … でも 、 だれ に も [一言|ひとこと] も [話|はな]さなかった 。'),
    'noa.open3': L('Step into the Past and tell me what happened there, like a story: what was going on, and what came and cut it off. «While… was…, … came». Through the crack by the ferry pier, or this one.',
      'Entra en el Ayer y cuéntame lo que pasó allí, como un cuento: lo que estaba pasando, y lo que llegó de repente. «Mientras… estaba…, llegó…». Por la grieta junto al muelle del ferry, o por esta.',
      'Entra no Ontem e me conta o que aconteceu lá, como uma história: o que estava acontecendo, e o que chegou de repente. «Enquanto… estava…, chegou…». Pela fenda perto do píer da balsa, ou por esta.',
      'Geh ins Gestern und erzähl mir, was dort passiert ist, wie eine Geschichte: was gerade geschah, und was plötzlich dazwischenkam. «Während …, kam …». Durch den Riss am Fährsteg oder durch diesen hier.',
      '[去|qù] [昨天|zuó tiān] ， [像|xiàng] [讲|jiǎng] [故事|gù shi] [一样|yī yàng] [告诉|gào su] [我|wǒ] [那里|nà lǐ] [发生|fā shēng] [了|le] [什么|shén me] ： [正在|zhèng zài] [做|zuò] [什么|shén me] [的|de] [时候|shí hou] ， [什么|shén me] [来|lái] [了|le] 。 [从|cóng] [渡船|dù chuán] [码头|mǎ tóu] [旁|páng] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[昨日|きのう] へ [行|い]って 、 そこ で [何|なに] が あった か 、 [話|はなし] みたい に [教|おし]えて 。 「 … して いる とき 、 … が [来|き]ました 」 。 フェリー の [桟橋|さんばし] の そば の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から 。'),
    'noa.past1': L('That was his voice… All that time on the docks, he was listening to all of you. He never said it… and now he has. Thank you.',
      'Esa era su voz… Todo ese tiempo en el muelle, estaba escuchándolos a todos. Nunca lo dijo… y ahora sí. Gracias.',
      'Era a voz dele… Todo aquele tempo no cais, ele estava escutando todo mundo. Nunca disse… e agora disse. Obrigada.',
      'Das war seine Stimme … Die ganze Zeit im Hafen hat er euch allen zugehört. Er hat es nie gesagt … und jetzt schon. Danke.',
      '[那|nà] [是|shì] [他|tā] [的|de] [声音|shēng yīn] … [在|zài] [码头|mǎ tóu] [的|de] [那些|nà xiē] [日子|rì zi] ， [他|tā] [一直|yī zhí] [在|zài] [听|tīng] [大家|dà jiā] [说话|shuō huà] 。 [他|tā] [从来|cóng lái] [没|méi] [说|shuō] [过|guò] … [现在|xiàn zài] [说|shuō] [出来|chū lai] [了|le] 。 [谢谢|xiè xie] [你|nǐ] 。',
      'あれ は かれ の [声|こえ] … [港|みなと] に いた [間|あいだ] 、 ずっと みんな の [話|はなし] を [聞|き]いて いた ん だ ね 。 [一度|いちど] も [言|い]わなかった けど … やっと [言|い]えた 。 ありがとう 。'),
    'noa.past2': L('Now tomorrow. In the Future the {w.harbor} is empty and gray: the ships are gone, and the people froze, waiting for someone to wish something for them. Marino is still there, on the quay. Through the crack by the beach, or this one.',
      'Ahora, el mañana. En el Mañana el puerto está vacío y gris: los barcos se fueron, y la gente se quedó congelada, esperando que alguien desee algo para ellos. Marino sigue allí, en el muelle. Por la grieta junto a la playa, o por esta.',
      'Agora, o amanhã. No Amanhã o porto está vazio e cinza: os navios foram embora, e as pessoas congelaram, esperando que alguém deseje alguma coisa para elas. O Marino ainda está lá, no cais. Pela fenda perto da praia, ou por esta.',
      'Jetzt das Morgen. Im Morgen ist der Hafen leer und grau: Die Schiffe sind fort, und die Leute sind erstarrt. Sie warten darauf, dass ihnen jemand etwas wünscht. Marino ist noch da, am Kai. Durch den Riss am Strand oder durch diesen hier.',
      '[现在|xiàn zài] [去|qù] [明天|míng tiān] 。 [在|zài] [明天|míng tiān] ， [港口|gǎng kǒu] [又|yòu] [空|kōng] [又|yòu] [灰|huī] ： [船|chuán] [都|dōu] [走|zǒu] [了|le] ， [大家|dà jiā] [都|dōu] [冻|dòng] [住|zhù] [了|le] ， [在|zài] [等|děng] [有人|yǒu rén] [为|wèi] [他们|tā men] [许|xǔ] [个|gè] [愿|yuàn] 。 [马里诺|Mǎ lǐ nuò] [还|hái] [在|zài] [码头|mǎ tóu] [上|shang] 。 [走|zǒu] [海滩|hǎi tān] [旁|páng] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[次|つぎ] は [明日|あした] 。 [明日|あした] の [港|みなと] は からっぽ で [灰色|はいいろ] 。 [船|ふね] は みんな いなく なって 、 [人|ひと] たち は [固|かた]まって しまった 。 だれ か が [願|ねが]って くれる の を [待|ま]って いる の 。 マリノ は まだ [岸壁|がんぺき] に いる よ 。 [浜辺|はまべ] の そば の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から [行|い]って 。'),
    'noa.fut1': L('He wants them to know he never forgot them. I hope he tells them himself, one day.',
      'Quiere que sepan que nunca los olvidó. Ojalá que un día se lo diga él mismo.',
      'Ele quer que eles saibam que nunca esqueceu ninguém. Tomara que um dia ele mesmo diga.',
      'Er wünscht sich, dass sie es wissen: Er hat sie nie vergessen. Hoffentlich sagt er es ihnen eines Tages selbst.',
      '[他|tā] [希望|xī wàng] [他们|tā men] [知道|zhī dào] ， [他|tā] [从来|cóng lái] [没有|méi yǒu] [忘记|wàng jì] [他们|tā men] 。 [但愿|dàn yuàn] [有|yǒu] [一天|yī tiān] [他|tā] [能|néng] [亲口|qīn kǒu] [告诉|gào su] [他们|tā men] 。',
      'みんな を [忘|わす]れなかった こと 、 [知|し]って ほしい ん だ ね 。 いつか 、 [自分|じぶん] で [言|い]えます ように 。'),
    'noa.fut2': L('That’s both of the port’s echoes. The next cracks will open in the Sunken Ruins… I’ll call you when they do.',
      'Ya tienes los dos ecos del puerto. Las próximas grietas se abrirán en las Ruinas Hundidas… Te llamaré cuando se abran.',
      'Você já tem os dois ecos do porto. As próximas fendas vão se abrir nas Ruínas Submersas… Eu te chamo quando abrirem.',
      'Das sind beide Echos des Hafens. Die nächsten Risse öffnen sich in den Versunkenen Ruinen … Ich rufe dich, wenn es so weit ist.',
      '[港口|gǎng kǒu] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] [都|dōu] [找到|zhǎo dào] [了|le] 。 [下|xià] [一|yī] [道|dào] [裂缝|liè fèng] [会|huì] [在|zài] [沉没|chén mò] [的|de] [遗迹|yí jì] [打开|dǎ kāi] … [到|dào] [时候|shí hou] [我|wǒ] [会|huì] [叫|jiào] [你|nǐ] 。',
      'これ で [港|みなと] の こだま は [二|ふた]つ と も そろった 。 [次|つぎ] の [裂|さ]け[目|め] は [沈|しず]んだ [遺跡|いせき] で [開|ひら]く … その とき は [呼|よ]ぶ ね 。'),
  };
  // Elio's echoes here (CH4.word): the Past's, the boy who listened to the docks talk and never said so; the Future's, the man's wish
  const ECHO = {
    past: L('While you were all talking, I was learning to talk again.', 'Mientras ustedes hablaban, yo estaba aprendiendo a hablar otra vez.', 'Enquanto vocês conversavam, eu estava aprendendo a falar de novo.',
      'Während ihr geredet habt, habe ich wieder sprechen gelernt.', '[你们|nǐ men] [聊天|liáo tiān] [的|de] [时候|shí hou] ， [我|wǒ] [正在|zhèng zài] [重新|chóng xīn] [学|xué] [说话|shuō huà] 。',
      'みなさん が [話|はな]して いる とき 、 ぼく は もう [一度|いちど] [話|はな]す こと を [学|まな]んで いました 。', { where: 'Port Brisa, long ago' }),
    future: L('I want you to know I never forgot you.', 'Quiero que sepan que nunca los olvidé.', 'Quero que vocês saibam que eu nunca esqueci vocês.', 'Hoffentlich wisst ihr, dass ich euch nie vergessen habe.',
      '[我|wǒ] [希望|xī wàng] [你们|nǐ men] [知道|zhī dào] ， [我|wǒ] [从来|cóng lái] [没有|méi yǒu] [忘记|wàng jì] [你们|nǐ men] 。', 'みなさん に [知|し]って ほしい です 。 ぼく は 、 みなさん を [一度|いちど] も [忘|わす]れません でした 。', { where: 'Port Brisa, tomorrow' }),
  };
  if (typeof CH4 !== 'undefined') { CH4.word('port', 'past', ECHO.past); CH4.word('port', 'future', ECHO.future); }

  // Noa's voice comes out of the crack: it flares while she talks (its glow swells), and her name tag is hers
  let flare = 0;
  function noaP() { const c = CRACK.gate, y = gy(c.x, c.z); return { id: 'noa', name: nameOf(NOA), x: c.x, y: y + 0.3, z: c.z, top: 2.5, talking: false }; }
  async function noaSay(key) { flare = 1; snd('chime'); const p = noaP(); try { G().w3d.fx.sparkle(p.x, p.y + 1.4, p.z, 12, ['#bfe4ff', '#fff3c8', '#9fd8e8']); } catch (e) { /* */ } await say(p, TXT[key]); }
  function lookGate() { const c = CRACK.gate, y = gy(c.x, c.z), Y = G().sim.you, dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1; shot(V(c.x + dx / d * 5.2 + dz / d * 2.4, y + 2.4, c.z + dz / d * 5.2 - dx / d * 2.4), V(c.x, y + 1.5, c.z), 1.0); }
  // the crack card's examples, each language's own: a story of then, the sudden thing, a wish, a wish for someone
  const CRACK_EX = { es: ['estaba pescando', 'cuando llegó el barco', 'ojalá que vuelva', 'quiero que…'], pt: ['estava pescando', 'quando o navio chegou', 'tomara que volte', 'quero que…'],
    de: ['ich fischte gerade', 'als das Schiff kam', 'hoffentlich kommt es zurück', 'ich wünsche mir, dass …'],
    zh: ['[正在|zhèng zài] [钓鱼|diào yú] [的|de] [时候|shí hou]', '[船|chuán] [来|lái] [了|le]', '[希望|xī wàng] [船|chuán] [回来|huí lai]', '[但愿|dàn yuàn] …'],
    ja: ['[釣|つ]り を して いる とき', '[船|ふね] が [来|き]ました', '[船|ふね] が [戻|もど]って ほしい', '… ます ように'] };
  async function crackCard() {
    css();
    const l = lang(), nm = w => { const t = TIME.RULES[w].name[l] || TIME.RULES[w].name.en; return isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t); };
    const ex = (CRACK_EX[l] || CRACK_EX.es).map(t => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t)));
    await UI.card(`<div class="tag">Port Brisa’s time cracks</div><div class="rows">`
      + `• On the <b>promenade, by the ferry pier</b>: today ↔ «${nm('past')}», the port in its busiest years, the sea fort brand new.<br>`
      + `• On the <b>south street, by the beach</b>: today ↔ «${nm('future')}», the port if nobody speaks up.<br>`
      + `• Here, where the main street comes into the <b>plaza</b>: all three. Noa’s voice comes through this one: report to her here.<br>`
      + `In the Past, <b>tell it like a story</b>: what was going on, and what cut it off («${ex[0]}», «${ex[1]}»). In the Future everyone froze waiting for a wish: <b>wish something for them</b> («${ex[2]}», «${ex[3]}»).</div><div class="sub">E</div>`, { kind: 'pb-card' });
  }
  async function noaOpen() {
    lock(true);
    try {
      lookGate(); await wait(0.9);
      await noaSay('noa.open1'); await noaSay('noa.open2'); await noaSay('noa.open3');
      flare = 0; await crackCard();
      TIME.seen('port.noa', true); G().save();
    } finally { flare = 0; lock(false); }
    think('Into the Past, to the harbor master of then, by the white harbor office. The crack by the ferry pier leads there, and so does this one.', 6);
  }
  async function reportPast() {
    lock(true);
    try { lookGate(); await wait(0.6); await noaSay('noa.past1'); await noaSay('noa.past2'); st('past').reported = true; G().save(); } finally { flare = 0; lock(false); }
    think('Next: the port tomorrow. The crack by the beach leads there.', 5);
  }
  async function reportFuture() {
    lock(true);
    try {
      lookGate(); await wait(0.6); await noaSay('noa.fut1'); await noaSay('noa.fut2'); st('future').reported = true;
      try { if (typeof QUESTS !== 'undefined' && QUESTS.tick) QUESTS.tick(); } catch (e) { /* */ }
      G().save();
    } finally { flare = 0; lock(false); }
  }

  // ------------------------------------------------------------ the region: TIME dresses both worlds (port_past.js fills DRESS.past,
  // port_future.js DRESS.future); while you're inside a world's dungeon, the dungeon does its own look, so `look` steps aside
  const DRESS = {
    past: { edge: 'The memory ends here… The port of long ago is only inside its walls. Let’s stay where it happened.' },
    future: { edge: 'Past the walls, tomorrow’s gray fog is too thick to see. Let’s turn back.', k: () => 0.12 },
  };
  Object.defineProperty(DRESS.past, 'look', { get: () => (typeof PT_PSHIP !== 'undefined' && PT_PSHIP && PT_PSHIP.inside ? null : 'past'), enumerable: true, configurable: true });
  Object.defineProperty(DRESS.future, 'look', { get: () => (typeof PT_FOFFICE !== 'undefined' && PT_FOFFICE && PT_FOFFICE.inside ? null : 'future'), enumerable: true, configurable: true });
  Object.assign(TIME.STEPS, { progint: 'a story: «estaba + -ando» cut off by the preterite (mientras, cuando)', subjwish: 'the present subjunctive for wishes (ojalá que, quiero que, espero que)' });
  const songOf = w => () => {
    if (w === 'past') return typeof PT_PAST !== 'undefined' && PT_PAST && PT_PAST.song ? PT_PAST.song() : 'past';
    return typeof PT_FUT !== 'undefined' && PT_FUT && PT_FUT.song ? PT_FUT.song() : 'future';
  };
  TIME.region('port', {
    name: { now: 'Port Brisa', past: 'Port Brisa, long ago', future: 'Port Brisa · tomorrow' },
    color: { past: '#c98a3a', future: '#6f6b84' },
    center: CEN, radius: RAD, inside,
    open: () => (typeof CH4 !== 'undefined' ? CH4.open('port') : false),
    grammar: { past: ['progint'], future: ['subjwish'] },
    songs: { past: songOf('past'), future: songOf('future') },
    dress: DRESS,
    init: api => init(api),
    tick: (api, dt) => tick(dt),
    changed: (api, fw, tw) => {
      if (tw === 'now') { holesOn(false); parkToday(false); try { const Bp = B(); if (Bp && Bp.setBell) Bp.setBell(!!G().state.flags.portFree); } catch (e) { /* */ } }
      for (const Mm of [typeof PT_PAST !== 'undefined' && PT_PAST, typeof PT_FUT !== 'undefined' && PT_FUT]) if (Mm && Mm.changed) { try { Mm.changed(fw, tw); } catch (e) { console.error('[port] changed', e); } }
    },
  });
  TIME.crack('port.ferry', { region: 'port', x: CRACK.past.x, z: CRACK.past.z, worlds: ['now', 'past'] });
  TIME.crack('port.beach', { region: 'port', x: CRACK.future.x, z: CRACK.future.z, worlds: ['now', 'future'] });
  TIME.crack('port.plaza', { region: 'port', x: CRACK.gate.x, z: CRACK.gate.z, worlds: ['now', 'past', 'future'] });

  function init(api) {
    try { registerWords(); } catch (e) { console.error('[port] words', e); }
    try { addTab(); } catch (e) { console.error('[port] journal', e); }
    try { if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['ドラ', 'マリノ', 'キノ', 'テレ', 'ウェイ', 'ユキ', 'エロイ', 'エリオ', 'アベル', 'ツバメ', 'ミソ']); } catch (e) { /* */ }
    for (const [Mm, tag] of [[typeof PT_PAST !== 'undefined' && PT_PAST, 'past'], [typeof PT_FUT !== 'undefined' && PT_FUT, 'future'],
      [typeof PT_PSHIP !== 'undefined' && PT_PSHIP, 'past ship'], [typeof PT_FOFFICE !== 'undefined' && PT_FOFFICE, 'future office'], [typeof PTBOSS !== 'undefined' && PTBOSS, 'bosses']])
      if (Mm && Mm.init) { try { Mm.init(api.G, api); } catch (e) { console.error('[port] init ' + tag, e); } }
  }

  // ------------------------------------------------------------ every frame, in any world: Noa (her first words here, the reports)
  let idle = 0;
  const busyNow = g => STORY.busy || STORY.line || g.sim.lock || g.journalOpen || g.state.teaching || TIME.busy
    || document.body.classList.contains('in-battle') || document.body.classList.contains('on-title') || (g.indoorMod && g.indoorMod() && g.indoorMod() !== TIME);
  function tick(dt) {
    const g = G(); if (!g || !g.state) return;
    flare = Math.max(0, flare - dt * 0.35);
    const Mv = TIME._.VIS && TIME._.VIS['port.plaza']; if (Mv && Mv.glow) { const k = 1 + flare * 0.9; Mv.glow.scale.set(3.4 * k, 4.2 * k, 1); }
    if (!TIME.open('port') || busyNow(g)) { idle = 0; return; }
    const w = TIME.world(), Y = g.sim.you, c = CRACK.gate, d = Math.hypot(Y.x - c.x, Y.z - c.z), s = g.state;
    const P = sp(s), F = sf(s);
    let run = null;
    if (w === 'now' && !TIME.seen('port.noa') && d < 7) run = noaOpen;
    else if (d < 3.4 && (w === 'now' || TIME.regionNow() === 'port')) {
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
    const c = want === 'past' ? (w === 'future' ? C['port.plaza'] : C['port.ferry'])
      : want === 'future' ? (w === 'past' ? C['port.plaza'] : C['port.beach'])
      : (w === 'past' ? C['port.ferry'] : C['port.beach']);
    const nm = { past: 'the Past', future: 'the Future', now: 'today' }[want];
    return c ? { x: c.x, z: c.z, hint: `{mimo} looks at the time crack: ${nm} is through there.` } : null;
  }
  const gateT = () => ({ x: CRACK.gate.x, z: CRACK.gate.z, hint: '{mimo} looks at the time crack in the plaza. Noa’s voice is in it.' });
  // examples inside English text (steps, quests, hints): each language's own, zh / ja in the mode's text
  const SX = {
    story: { es: ['estaba cargando cajas', 'cuando llegó la niebla'], pt: ['estava carregando caixas', 'quando a neblina chegou'], de: ['er lud gerade Kisten', 'als der Nebel kam'],
      zh: ['[正在|zhèng zài] [搬|bān] [箱子|xiāng zi]', '[雾|wù] [来|lái] [了|le]'], ja: ['[箱|はこ] を [運|はこ]んで いました', '[霧|きり] が [来|き]ました'] },
    sailors: { es: ['estaban cantando', 'estaban subiendo las velas'], pt: ['estavam cantando', 'estavam içando as velas'], de: ['sie sangen gerade', 'sie hissten gerade die Segel'],
      zh: ['[正在|zhèng zài] [唱歌|chàng gē]', '[正在|zhèng zài] [升|shēng] [帆|fān]'], ja: ['[歌|うた]って いました', '[帆|ほ] を [揚|あ]げて いました'] },
    mem: { es: ['{mimo} trepó por el mástil'], pt: ['O {mimo} subiu no mastro'], de: ['{mimo} ist am Mast hochgeklettert'], zh: ['{mimo} [爬|pá] [上|shàng] [了|le] [桅杆|wéi gān]'], ja: ['{mimo} が マスト に [登|のぼ]った'] },
    wish: { es: ['ojalá que vuelvan los barcos', 'quiero que…'], pt: ['tomara que os navios voltem', 'quero que…'], de: ['hoffentlich kommen die Schiffe zurück', 'ich wünsche mir, dass …'],
      zh: ['[希望|xī wàng] [船|chuán] [都|dōu] [回来|huí lai]', '[但愿|dàn yuàn] …'], ja: ['[船|ふね] が [戻|もど]って ほしい', '… ます ように'] },
    mwish: { es: ['quiero que {mimo} suba'], pt: ['quero que o {mimo} suba'], de: ['ich wünsche mir, dass {mimo} hochklettert'], zh: ['[我|wǒ] [希望|xī wàng] {mimo} [爬|pá] [上去|shàng qù]'], ja: ['{mimo} に [登|のぼ]って ほしい'] },
    plaque: { es: ['la flota estaba pescando', 'cuando llegó la tormenta'], pt: ['a frota estava pescando', 'quando a tempestade chegou'], de: ['die Flotte fischte gerade', 'als der Sturm kam'],
      zh: ['[船队|chuán duì] [正在|zhèng zài] [捕鱼|bǔ yú]', '[暴风雨|bào fēng yǔ] [来|lái] [了|le]'], ja: ['[船団|せんだん] が [漁|りょう] を して いる とき', '[嵐|あらし] が [来|き]ました'] },
  };
  function sx(k, labels) {
    const l = lang(), a = (SX[k] || {})[l] || (SX[k] || {}).es || [];
    return a.map((t, i) => { let s = fillMimo(t, l); if (isCl(l)) s = plainT(s); return `«${s}»` + (labels && labels[i] ? ` (${labels[i]})` : ''); }).join(', ');
  }
  const pastT = id => () => via('past', () => (typeof PT_PAST !== 'undefined' && PT_PAST ? PT_PAST.target(id) : null));
  const futT = id => () => via('future', () => (typeof PT_FUT !== 'undefined' && PT_FUT ? PT_FUT.target(id) : null));
  const HEARD = ['fishmonger', 'fisher', 'quino'];
  const heardN = s => HEARD.filter(k => sp(s).heard && sp(s).heard[k]).length;
  const WAKE = ['dora', 'quino', 'tere', 'wei'];
  const PSTEPS = [
    { _tt: true, text: 'Port Brisa: listen to Noa at the time crack in the plaza',
      why: 'Since the Frost Peaks’ two echoes came home, something shimmers where the main street comes into Port Brisa’s plaza. Noa’s voice is in it.',
      done: s => seenIn(s, 'port.noa'), target: gateT, hint: '{mimo} sniffs the air in the plaza. A shimmer… and salt?' },
    { _tt: true, get text() { return fillEn('In the Past: find {master}, the harbor master of then, by the white harbor office'); },
      get why() { return fillEn('Years after the concert, the port was in its busiest years and the sea fort was brand new. But a gray fog came in with a ship. {master} runs the harbor. Through the crack by the ferry pier, or the one in the plaza.'); },
      done: s => !!sp(s).met, target: pastT('master'), hint: '{mimo} points at a woman in a navy coat, by the white office on the quay.' },
    { _tt: true, get text() { return fillEn('Young {dora}’s questions: what was going on when the fog came? ({n}/2)'); }, n: s => Math.min(2, sp(s).doraQ || 0),
      get why() { return fillEn(`Young {dora}, the harbor master’s daughter, followed the quiet boy everywhere. Answer her like a story: ${sx('story')}.`); },
      done: s => !!sp(s).dora, target: pastT('dora'), hint: '{mimo} points at a little girl on the promenade.' },
    { _tt: true, get text() { return fillEn('Hear what was going on aboard ({n}/3), then tell {master}'); }, n: s => heardN(s),
      get why() { return fillEn(`The fishmonger, the old fisherman and young {quino} each saw something. Then tell {master} what the sailors were doing: ${sx('sailors')}.`); },
      done: s => !!sp(s).joined, target: () => via('past', () => (typeof PT_PAST !== 'undefined' && PT_PAST ? PT_PAST.target(heardN(G().state) >= 3 ? 'master' : 'heard') : null)), hint: '{mimo} tugs your sleeve toward someone of then.' },
    { _tt: true, get text() { return fillEn('Aboard {ship}: bring the frozen moments back ({n}/3)'); }, n: s => Math.min(3, sp(s).floors || 0),
      get why() { return fillEn(`Everyone aboard froze the moment the fog came. Tell the ship what was going on, and the moment plays on. Tell {mimo} what it did, as a memory (${sx('mem')}).`); },
      done: s => (sp(s).floors || 0) >= 3, target: pastT('ship'), hint: '{mimo} looks at the gray ship at the long pier.' },
    { _tt: true, text: 'In the captain’s cabin: face the fog itself and free Elio’s echo',
      why: 'Something gray and many-armed fills the captain’s cabin. It hums like a boy’s voice.',
      done: s => echoIn(s, 'past'), target: pastT('ship'), hint: '{mimo} looks at the gray ship. The cabin is at its stern.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack in the plaza',
      why: 'Elio’s echo is free. Tell Noa: her voice comes through the crack in the plaza, in any of the three times.',
      done: s => !!sp(s).reported, target: gateT, hint: '{mimo} looks at the time crack in the plaza.' },
  ];
  const FSTEPS = [
    { _tt: true, text: 'In the Future: find Marino on the gray quay',
      why: 'In the port tomorrow the ships are gone and everyone froze, gray. Someone is still talking, on the quay. Through the crack by the beach, or the one in the plaza.',
      done: s => !!sf(s).met, target: futT('marino'), hint: '{mimo} points at someone on the quay… the only one with any color.' },
    { _tt: true, text: 'Wish something for the frozen harbor folk ({n}/4)', n: s => WAKE.filter(k => sf(s).woke && sf(s).woke[k]).length,
      get why() { return fillEn(`They froze waiting for someone to wish something for them. Say a wish for each, in tomorrow’s words: ${sx('wish')}.`); },
      done: s => WAKE.every(k => sf(s).woke && sf(s).woke[k]), target: () => via('future', () => (typeof PT_FUT !== 'undefined' && PT_FUT ? PT_FUT.target('frozen') : null)), hint: '{mimo} tugs your sleeve toward someone gray.' },
    { _tt: true, text: 'The harbor office tomorrow: up to the dark beacon ({n}/3)', n: s => Math.min(3, sf(s).floors || 0),
      get why() { return fillEn(`The ships can’t find the harbor in the fog. Climb the old office to its beacon: say your wishes, and tell {mimo} what you want it to do (${sx('mwish')}).`); },
      done: s => (sf(s).floors || 0) >= 3, target: futT('office'), hint: '{mimo} looks at the white harbor office’s door.' },
    { _tt: true, text: 'On the roof: soften the Gray Albatross and free Elio’s echo',
      get why() { return fillEn(`A huge gray bird sits on the beacon, its wings over the light. It only listens to wishes: ${sx('wish')}.`); },
      done: s => echoIn(s, 'future'), target: futT('office'), hint: '{mimo} looks up at the office’s roof.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack in the plaza',
      why: 'Both of the port’s echoes are free. Tell Noa, at the crack in the plaza.',
      done: s => !!sf(s).reported, target: gateT, hint: '{mimo} looks at the time crack in the plaza.' },
  ];
  if (typeof CH4 !== 'undefined') {
    CH4.steps('port', 'past', PSTEPS);
    CH4.steps('port', 'future', FSTEPS);
    CH4.story('port', [
      { when: s => seenIn(s, 'port.noa'), text: 'Noa’s voice came through the crack in Port Brisa’s plaza: two more of Elio’s echoes are here, one long ago, one tomorrow.' },
      { when: s => !!sp(s).dora, text: 'Long ago, a quiet teenager loaded the ships at Port Brisa all spring. He never said a word… but young Dora saw him listening to everyone.' },
      { when: s => echoIn(s, 'past'), text: 'In the captain’s cabin of La Golondrina, the Fog Octopus remembered what was going on and gave back Elio’s voice: while the docks were talking, he was learning to talk again.' },
      { when: s => !!sf(s).met, text: 'Tomorrow, the harbor is empty. Everyone froze waiting for a wish; only Marino still talks.' },
      { when: s => echoIn(s, 'future'), text: 'The Gray Albatross heard the harbor’s wishes and flew off to bring the ships home. Elio’s voice, tomorrow: he wants them to know he never forgot them.' },
    ]);
  }

  // ------------------------------------------------------------ the words of both worlds (PTPTXT.WORDS, PTFTXT.WORDS): registered in
  // Mimo's memory (caves.js's way), met in the lines, the demonstrations and the Looks, listed in the journal
  const wordLists = () => [typeof PTPTXT !== 'undefined' ? PTPTXT.WORDS || [] : [], typeof PTFTXT !== 'undefined' ? PTFTXT.WORDS || [] : []];
  function registerWords() {
    if (typeof LEX === 'undefined') return 0;
    let n = 0;
    for (const list of wordLists()) { const add = list.filter(w => !LEX.item(w.id)).map(w => Object.assign({ kind: 'word' }, w)); LEX.register(add); n += add.length; }
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const list of wordLists()) for (const w of list) for (const l of ['zh', 'ja']) if (w[l]) CJK.addSource(w[l]); } catch (e) { /* */ }
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const T0 of [typeof PTPTXT !== 'undefined' && PTPTXT, typeof PTFTXT !== 'undefined' && PTFTXT]) if (T0) for (const tab of [T0.LINES, T0.DEMO]) for (const x of Object.values(tab || {})) for (const l of ['zh', 'ja']) if (x && x[l]) CJK.addSource(x[l]); } catch (e) { /* */ }
    return n;
  }
  function wordsHTML() {
    css();
    const l = lang(), [P, F] = wordLists(), seen = id => typeof LEX !== 'undefined' && LEX.seen(id);
    const row = w => { const t = w[l] || ''; return `<li class="${seen(w.id) ? '' : 'no'}">${seen(w.id) ? '✓ ' : ''}<b>${tHTML(t, l)}</b> <span class="en">${esc(w.en)}</span></li>`; };
    const n = list => list.filter(w => seen(w.id)).length;
    return `<div class="mt"><h4 class="ph-h">Harbor words <small>${n(P) + n(F)} / ${P.length + F.length}</small></h4><p class="note">Port Brisa long ago and tomorrow: every word you meet there, in the lines, the demonstrations and the things you look at (✓ once you’ve met it). Mimo keeps them for review.</p>`
      + `<h5>Long ago <small>${n(P)} / ${P.length}</small></h5><ul class="pb-words">${P.map(row).join('')}</ul>`
      + `<h5>Tomorrow <small>${n(F)} / ${F.length}</small></h5><ul class="pb-words">${F.map(row).join('')}</ul></div>`;
  }
  function addTab() {
    if (typeof UI === 'undefined') return;
    UI.journalTabs = UI.journalTabs || [];
    if (UI.journalTabs.some(t => t.id === 'pb-words')) return;
    UI.journalTabs.push({ id: 'pb-words', group: 'words', label: () => (G() && TIME.open('port') && TIME.seen('port.noa') ? 'Harbor words' : null), html: () => wordsHTML(), wire() { /* */ } });
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
    walk({ TXT, ECHO, NOA, CRACK_EX, SX, WISHV }, 'portt');
    if (typeof PTPTXT !== 'undefined') walk(PTPTXT, 'past');
    if (typeof PTFTXT !== 'undefined') walk(PTFTXT, 'future');
    if (typeof PTMUSIC !== 'undefined' && PTMUSIC.TEXT) walk(PTMUSIC.TEXT, 'music');
    // (the hushed lines: as many *starred* words in each language as in the English)
    for (const T0 of [typeof PTPTXT !== 'undefined' && PTPTXT, typeof PTFTXT !== 'undefined' && PTFTXT]) for (const [k, T] of Object.entries((T0 && T0.LINES) || {})) {
      const n = s => (String(s || '').match(/\*[^*]+\*/g) || []).length, ne = n(T.en); if (!ne) continue;
      for (const l of LANGS) if (n(T[l]) !== ne) out.push(`${k} (${l}): ${n(T[l])} starred words, the English has ${ne}`);
    }
    // (every {w.*} slot in an English line is a word Mimo knows; no word id shared between the two worlds or with anyone else's)
    if (typeof LEX !== 'undefined') {
      const ids = new Set();
      const slots = (o, where) => { for (const [k, T] of Object.entries(o || {})) { const en = String((T && T.en) || ''); let m; SLOT.lastIndex = 0; while ((m = SLOT.exec(en))) if (!LEX.item(m[1])) out.push(`${where}.${k}: no word «${m[1]}»`); } };
      for (const [T0, tag] of [[typeof PTPTXT !== 'undefined' && PTPTXT, 'past'], [typeof PTFTXT !== 'undefined' && PTFTXT, 'future']]) {
        if (!T0) continue; slots(T0.LINES, tag + '.LINES'); slots(T0.DEMO, tag + '.DEMO'); slots(T0.FIGHT, tag + '.FIGHT');
        for (const w of T0.WORDS || []) { if (ids.has(w.id)) out.push(`${tag}: word id ${w.id} twice`); ids.add(w.id); for (const l of ['es', 'pt', 'de', 'zh', 'ja']) if (!w[l]) out.push(`${tag}: ${w.id} has no ${l}`); }
      }
      slots(TXT, 'portt.TXT');
    }
    return out;
  }

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the save goes to the test slot)
  // setup(o): the gardens' setup with every earlier region's path done (GARDT._.t.setup()), the gardens and the Frost Peaks finished
  // and reported with their echoes, today's port as Chapter 1 left it (bell 6 rung), the port open; o.seen === false: Noa's first
  // words still to come
  function setup(o = {}) {
    if (typeof PEAKT !== 'undefined' && PEAKT && PEAKT._ && PEAKT._.t && PEAKT._.t.setup) {
      PEAKT._.t.setup();
      try { if (PEAKT._.t.at) PEAKT._.t.at('future.top'); } catch (e) { console.error('[port] setup peaks', e); }
    } else if (typeof GARDT !== 'undefined' && GARDT && GARDT._ && GARDT._.t) {
      GARDT._.t.setup();
      try { GARDT._.t.at('future.top'); TIME.state('gardens', 'past').reported = true; TIME.state('gardens', 'future').reported = true; } catch (e) { console.error('[port] setup gardens', e); }
    }
    try { TIME.state('gardens', 'past').reported = true; TIME.state('gardens', 'future').reported = true; } catch (e) { /* */ }
    if (typeof CH4 !== 'undefined') { CH4._.t.give('gardens', 'past'); CH4._.t.give('gardens', 'future'); CH4._.t.give('peaks', 'past'); CH4._.t.give('peaks', 'future'); }
    try { TIME.state('peaks', 'past').reported = true; TIME.state('peaks', 'future').reported = true; } catch (e) { /* */ }
    const g = G(), f = g.state.flags;
    Object.assign(f, { portRoad: true, nico: true, portGate: true, port: true, dora: true, askedAll: true, doraTold: true, ticket: true, boatCalled: true, fortLanded: true, portFree: true, portSixth: true });
    f.bells = Math.max(f.bells || 0, 6);
    const ps = g.state.port || (g.state.port = {}); ps.asked = ps.asked || {}; ps.trav = ps.trav || {};
    for (const id of ['greta', 'rui', 'wei', 'yuki', 'omar']) ps.asked[id] = ps.asked[id] || 'S';
    for (const id of ['amaia', 'nuno', 'ilse']) ps.trav[id] = ps.trav[id] || 'S';
    ps.eloyWhen = true; ps.crabsDone = true; ps.crabs = 3; ps.travDone = true; ps.quinoHow = true;
    try { if (typeof LEX !== 'undefined') for (const id of ['v.call', 'v.climb', 'v.push', 'v.jump']) if (LEX.item(id) && !LEX.taught(id)) LEX.attempt(id, { ok: true, hints: 0, ms: 3000, mode: 'teach' }); } catch (e) { /* */ }
    if (typeof CH4 !== 'undefined') CH4._.t.openAll(true);
    if (o.seen !== false) TIME.seen('port.noa', true);
    const main = typeof QUESTS !== 'undefined' && QUESTS.LIST.find(q => q.id === 'main');
    if (main && !main.steps.some(x => x.ch4 === 'port')) {
      const i = main.steps.findIndex(x => x.ch4 === 'soon'); const add = PSTEPS.concat(FSTEPS);
      if (i >= 0) main.steps.splice(i, 0, ...add); else main.steps.push(...add);
    }
    TIME._.fast.on = true; TIME.refresh();
    return TIME.open('port');
  }
  function near(id) {
    const c = CRACK[id] || (id === 'ship' ? { x: -236.8, z: -69.2 } : id === 'office' ? { x: -229.0, z: -95.2 } : null); if (!c) return null;
    const g = G(), Y = g.sim.you; Y.x = c.x + 1.3; Y.z = c.z - 1.0; g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
    return { x: Y.x, z: Y.z };
  }
  async function go(w, at) { const p = at || { x: CRACK.gate.x + 1.4, z: CRACK.gate.z + 1.4, yaw: Math.PI }; const r = await TIME.go(w, { region: 'port', at: p, quick: true }); return r && TIME.world(); }
  // put the save at a step of the port's path (everything before it done): 'past.ship' (the Past's ship next), 'past.top' (its boss
  // next), 'future' (the Past reported), 'future.office', 'future.top'
  function at(step) {
    const P = st('past'), F = st('future'), pm = P.ship || (P.ship = {}), fm = F.office || (F.office = {});
    TIME.seen('port.noa', true);
    Object.assign(P, { met: true, doraQ: 2, dora: true, heard: { fishmonger: true, fisher: true, quino: true }, joined: true });
    if (step === 'past.ship') { TIME.refresh(); return step; }
    Object.assign(pm, { seen0: true, seen1: true, seen2: true, sails: true, mast: true, done0: true, ambush: true, soup: true, crate: true, done1: true, tally: true, barrels: true, book: true, done2: true, memCard: true });
    P.floors = 3;
    if (step === 'past.top') { TIME.refresh(); return step; }
    Object.assign(pm, { seen3: true, boss: true, done3: true }); TIME.flag('past', 'pbShip', true);
    if (typeof CH4 !== 'undefined') CH4._.t.give('port', 'past'); P.reported = true;
    if (step === 'future') { TIME.refresh(); return step; }
    Object.assign(F, { met: true, woke: { dora: 'S', quino: 'S', tere: 'S', wei: 'S' }, open: true });
    if (step === 'future.office') { TIME.refresh(); return step; }
    Object.assign(fm, { seen0: true, seen1: true, seen2: true, shelf: true, done0: true, ambush: true, radio: true, done1: true, climb: true, lamp: true, done2: true });
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

  return { CEN, RAD, CRACK, DRESS, TXT, ECHO, NOA, PSTEPS, FSTEPS, WAKE, HEARD, L, LANGS, isCl, lang, nameOf, enName, fillMimo, fillEn, cjRun, say, demo, hushed, think, you, frame2, lookAt, meet, introduce,
    card, css, grade, ask, memTask, wishTask, has, person, who, liftOn, lock, shot, wait, mimoName, plainT, down, st, sp, sf, sn, via, check, sx, registerWords, inside, hideToday, showToday, holesOn, parkToday, B,
    get flare() { return flare; }, set flare(v) { flare = v; },
    _: { noaOpen, reportPast, reportFuture, crackCard, tick, wordsHTML, HOLES, t: { setup, near, go, probe, at, check: () => check(), get drv() { return drv(); } } } };
})();
