'use strict';
// The Bloom Gardens in three worlds (DESIGN.md 20 "T3a", game/TIME.md "The Bloom Gardens (T3a)"): Chapter 4's fifth place, a region
// TIME dresses itself, in Molinar's and the quarry's shape (time_quarry.js is the model).
//   time_gardens.js           GARDT: the region, its three cracks, Noa's voice on the green, Chapter 4's steps and echoes, the shared
//                             kit (names, saying and demonstrating, the S–D grader, the ask box, pattern cards, words), today's
//                             gardens set aside in the other worlds, the journal's "Garden words" page, check() and test hooks
//   gardens_past(_text).js    the valley long ago (the summer after the concert, the greenhouse new): GD_PAST, 7 people, 3 side quests
//   gardens_future(_text).js  the valley tomorrow (gray and wilted, people frozen until asked nicely): GD_FUT, 7 people, 3 side quests
//   gardens_past_dungeon.js   GDKIT (MOLMILL's rooms dressed as glass halls) and GD_PHOUSE: the new greenhouse inside (rooms at y 300,
//                             z −180, x −430 … −352)
//   gardens_future_dungeon.js GD_FHOUSE: the greenhouse tomorrow (rooms at y 300, z −150, the same x)
//   gardens_time_boss.js      GDBOSS: the Faded Bloom (the Past) and the Thorn Warden (the Future), plug-ins on battle/flow.js
//   gardens_time_music.js     GDMUSIC: six songs (each world's area, dungeon and boss)
// The cracks (open with CH4.open('gardens'): after the quarry's two echoes): by the great greenhouse (today ↔ the Past), by the hives
// (today ↔ the Future), on the green's north edge where the road comes in (all three; Noa speaks there). State:
// TIME.state('gardens', 'past' | 'future' | 'now'); flags: TIME.flag('past', 'gdPaint' | 'gdHouse'), ('future', 'gdFree' |
// 'gdWarn'), ('now', 'gdLavender').
// The grammar (TIME.md §8, rung 4): the Past, the imperfect for descriptions («era», «había», «estaba lleno de…»); the Future, the
// conditional for politeness and wishes («podría», «querría», «me encantaría»). Each language its own (pt imperfeito / futuro do
// pretérito; de Präteritum of sein and haben, «es gab» / Konjunktiv II; zh 以前 + 是 / 有 / 满是 / 能不能, 可以…吗, 想, 希望; ja ～でした /
// ～がありました / ～でいっぱいでした / ～ていただけますか, ～たいです, ～といいですね).
const GARDT = (() => {
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
  const GA = () => (typeof GARDENS !== 'undefined' ? GARDENS : null);

  // ------------------------------------------------------------ where things are (checked with the probe in every world)
  const CEN = { x: 198, z: -71 }, RAD = 36;
  const CRACK = { past: { x: 208.4, z: -61.6 }, future: { x: 209.2, z: -68.4 }, gate: { x: 198.6, z: -87.0 } };
  const DOOR = { x: 198.0, z: -61.6 };          // the great greenhouse's door (each world's way into its greenhouse)
  // its reach in the other worlds: the valley's floor, and the foot of the road down into it
  const inside = (x, z) => {
    const g = GA(); if (!g || !g.valDist) return Math.hypot(x - CEN.x, z - CEN.z) < RAD;
    try { return g.valDist(x, z) < 0.6 || (g.roadDist(x, z) < 3.0 && z > -93 && z < -80); } catch (e) { return Math.hypot(x - CEN.x, z - CEN.z) < RAD; }
  };

  // ------------------------------------------------------------ the save's part
  const st = w => TIME.state('gardens', w);
  const R0 = s => (s && s.worlds && s.worlds.r && s.worlds.r.gardens) || {};
  const sp = s => R0(s).past || {}, sf = s => R0(s).future || {}, sn = s => R0(s).now || {};
  const seenIn = (s, k) => !!(s && s.worlds && s.worlds.seen && s.worlds.seen[k]);
  const echoIn = (s, w) => !!(s && s.ch4 && s.ch4.echoes && s.ch4.echoes['gardens.' + w]);

  // ------------------------------------------------------------ names: each language's own cast (GPTXT.CAST, GFTXT.CAST)
  const NOA = L('Noa', 'Noa', 'Noa', 'Noa', '[诺娅|Nuò yà]', 'ノア');
  const casts = () => [typeof GPTXT !== 'undefined' ? GPTXT.CAST : {}, typeof GFTXT !== 'undefined' ? GFTXT.CAST : {}];
  const nameOf = (T, l = lang()) => (!T ? '' : isCl(l) ? plainT(T[l] || T.en) : T[l] || T.en);
  const enName = (T, l) => { if (!T) return ''; if (l === 'es') return T.en; if (isCl(l)) { try { return CJK.roman(T[l], { lang: l }); } catch (e) { return T.en; } } return T[l] || T.en; };
  const fillMimo = (t, l = lang()) => String(t || '').replace(/\{mimo\}/g, isCl(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName());
  function fillEn(t, l = lang()) {
    let s = String(t || '');
    for (const C of casts()) s = s.replace(/\{([a-z]+)\}/g, (m, k) => (C[k] ? enName(C[k], l) : m));
    return s.replace(/\{mimo\}/g, mimoName()).replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }
  const enOf = (T, l) => (T && (T['en_' + l] || T.en)) || '';

  // ------------------------------------------------------------ words: the slots in a line's English ({w.gd_*}) and the marks of a
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
  // (bare 汉字 / かな in an English tip, «会», «能不能», follow the reading mode: romanized for a player who reads roman)
  const lower1 = s => String(s).charAt(0).toLowerCase() + String(s).slice(1);     // (a word in mid-sentence: «huì», not «Huì»)
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
    if (document.getElementById('gdt-css')) return;
    const s = document.createElement('style'); s.id = 'gdt-css';
    s.textContent = `.card.gd-card .ex { display: grid; grid-template-columns: auto auto; gap: 4px 14px; justify-content: center; margin: 10px 0 6px; font-size: 18px; }
.card.gd-card .ex b { color: #b0523a; } .card.gd-card.fut .ex b, .card.gd-card.fut .tag { color: #5a62b0; }
.card.gd-card .note { max-width: 460px; margin: 6px auto 0; font-size: 14px; line-height: 1.45; } .card.gd-card .tag { color: #b0523a; }
.card.gd-card .rows { text-align: left; max-width: 460px; margin: 8px auto 0; font-size: 14px; line-height: 1.5; }
.gd-words { columns: 2; column-gap: 18px; font-size: 13px; line-height: 1.5; margin: 6px 0 10px; } .gd-words li { break-inside: avoid; } .gd-words .no { opacity: .45; }`;
    document.head.appendChild(s);
  }
  const tHTML = (t, l) => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l, ruby: 'always' }) : esc(t));
  async function card(C, fut) {
    css();
    const l = lang(), c = C && C[l]; if (!c) return;
    const ex = (c.ex || []).map(([w, e]) => `<b>${tHTML(fillMimo(w, l), l)}</b><span>${esc(e)}</span>`).join('');
    await UI.card(`<div class="tag">${esc(fillEn(C.tag, l))}</div>${ex ? `<div class="ex">${ex}</div>` : ''}<div class="note">${esc(fillEn(c.note, l))}</div><div class="sub">E</div>`, { kind: 'gd-card' + (fut ? ' fut' : '') });
  }

  // ------------------------------------------------------------ grading what you say (S–D: one letter down per miss; «?», the whole
  // sentence, counts as two). T: want (S; an A with an accent missing or none of `more`), alt (A), aux / person / aspect (B), and
  // the misses with a tip: past, pres, fut, miss (a bare command where a gentle request is wanted). Items: a string as a word (zh /
  // ja: CJK.contains), a list: all of them. (time_quarry.js's grader, kept here so the gardens stand on their own)
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
  // (typing only the blank counts as the frame filled in: «tenía» for «Elio ___ una gorra roja»)
  function grade(T, text, lg, TIPS = {}) {
    const g = grade0(T, text, lg, TIPS);
    if (g.ok || g.kind === 'veto') return g;          // (the fill only rescues a miss: it never lifts an A to an S)
    const fr = plainT(fillMimo((T.frame || {})[lg] || '', lg));
    if (!fr.includes('___') || !String(text || '').trim()) return g;
    const n = isCl(lg) ? String(text).replace(/\s+/g, '').length : words(text, lg).trim().split(' ').length;
    if (n > (isCl(lg) ? 8 : 3)) return g;
    // (only when what you typed is itself a chip, or a listed form that the frame doesn't already hold)
    const frRaw = fillMimo((T.frame || {})[lg] || '', lg), chips = ((T.chips || {})[lg] || []).map(c => c[0]);
    const items = ['want', 'alt', 'aspect', 'person', 'pres', 'fut', 'past', 'miss'].flatMap(k => ((T[k] || {})[lg] || []).flat()).filter(x => typeof x === 'string');
    if (!chips.some(c => has(text, c, lg)) && !items.some(x => !has(frRaw.replace(/___/g, ' '), x, lg) && has(text, x, lg))) return g;
    const g2 = grade0(T, fr.replace('___', String(text).trim()), lg, TIPS);
    return g2.ok ? g2 : g;
  }
  function grade0(T, text, lg, TIPS = {}) {
    const model = plainT(fillMimo((T.model || {})[lg] || '', lg)).replace(/\s*[.。]\s*$/, '');
    const tip = k => String((((T.tips || {})[k] || TIPS[k] || {})[lg]) || '').replace('{form}', model);
    const first = (key, fn = has) => ((T[key] || {})[lg] || []).find(x => fn(text, x, lg));
    const v = first('veto'); if (v) return { ok: false, kind: 'veto', why: tip('veto') };
    // the right form, said another way that counts less (once instead of how it was: «fue»; a plan instead of a request: «podrás»):
    // the exact spelling first, so a bare verb's A can't hide it
    const as0 = first('aspect', exact); if (as0) return { ok: true, letter: 'B', kind: 'aspect', why: tip('aspect') || `«${model}»` };
    const w = first('want');
    // (a wanted form found only without its accent, when that spelling is itself a listed miss: «konnten» is the past, not «könnten»)
    if (w && !first('want', exact)) for (const k of ['past', 'pres', 'fut']) { const m = first(k, exact); if (m) return { ok: false, kind: k, why: tip(k) }; }
    if (w) {
      const mo = !((T.more || {})[lg] || []).length || T.more[lg].some(x => has(text, x, lg));
      const others = ['alt', 'aux', 'person', 'aspect', 'past', 'pres', 'fut', 'miss'].flatMap(k => ((T[k] || {})[lg] || []).flat());
      const ac = typeof ACCENTS !== 'undefined' ? ACCENTS.judge(text, w, lg, { others }) : { keep: !accented(text, w, lg), why: `Accent: «${plainT(showForm(w))}»`, tip: '' };
      return { ok: true, letter: !ac.keep && mo ? 'S' : 'A', kind: 'right', why: ac.keep ? ac.why : !mo ? tip('more') || `Right! The whole sentence for an S: «${model}»` : 'Just right!', tip: ac.tip || '' };
    }
    const a = first('alt'); if (a) return { ok: true, letter: 'A', kind: 'alt', why: tip('alt') || 'Right!' };
    const x = first('aux'); if (x) return { ok: true, letter: 'B', kind: 'aux', why: tip('aux') || `«${model}»` };
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
  // a plan in the Future (MOLT.planTask: «{mimo} empujará…»)
  const memTask = M => {
    const Q = typeof QUART !== 'undefined' && QUART && QUART.memTask ? QUART : typeof MOLT !== 'undefined' && MOLT && MOLT.memTask ? MOLT : null;
    if (!Q) return null;
    const T = Object.assign(Q.memTask(M), { words: M.words });
    // (tomorrow's plan, «subirá», in the Past: a tip that it's the wrong time, not a bare «not quite»; MFTXT.FV has the forms)
    const fv = typeof MFTXT !== 'undefined' && MFTXT && MFTXT.FV ? MFTXT.FV[M.verb] : null;
    if (fv) {
      T.fut = {}; LANGS.forEach(l => { T.fut[l] = [...(fv[l] || []), ...((fv.ir || {})[l] || [])]; });
      T.tips = Object.assign({}, T.tips, { fut: { es: 'That’s a plan, for tomorrow! In the Past, {mimo} moves in memories: «{form}».', pt: 'That’s a plan, for tomorrow! In the Past, {mimo} moves in memories: «{form}».',
        de: 'That’s a plan, for tomorrow! In the Past: «{form}».', zh: 'That’s tomorrow (会)! It already happened: «{form}».', ja: 'That’s a plan, for tomorrow! In the Past: ～た, «{form}».' } });
    }
    return T;
  };
  const planTask = M => (typeof MOLT !== 'undefined' && MOLT && MOLT.planTask ? Object.assign(MOLT.planTask(M), { words: M.words }) : null);

  // ------------------------------------------------------------ the people TIME builds (TIME.people), by world and id
  function person(w, id) {
    const list = TIME.people && TIME.people.all['gardens:' + w]; if (!list) return null;
    const P = list.find(q => q.def.id === id); if (!P) return null;
    P.api.name = nameOf(P.def.name); return P;
  }
  const who = (w, id) => { const P = person(w, id); return P ? P.api : null; };

  // ------------------------------------------------------------ today's gardens, set aside in another world: its people, the show's
  // entries and the judges' things (and tomorrow the flower fields, the bees and the clear glass); main.js hides the gardens' group
  // whenever a room is on (TIME counts as one), so in this region's other worlds it's shown again and run (showToday)
  function hideToday(api, o = {}) {
    const g = G(), B = g && g.gardens; if (!B) return [];
    const out = [], hide = obj => { if (obj && obj.visible) { api.hide(obj); out.push(obj); } };
    (B.people || []).forEach(p => hide(p.root));
    const O = B.objects || {};
    Object.values(O.ents || {}).forEach(e => hide(e.group));
    Object.values(O.props || {}).forEach(p => hide(p));
    if (o.future) { (O.flowers || []).forEach(im => hide(im)); (O.bees || []).forEach(b => hide(b.s)); hide(O.glass); }
    for (const ob of g.w3d.scene.children) if (ob.visible && /^(read|diary|townlife|tl-|store|signs?-)/i.test(ob.name || '') && Math.hypot(ob.position.x - CEN.x, ob.position.z - CEN.z) < 48) hide(ob);
    return out;
  }
  let gaT = 0;
  function showToday(dt, keepHidden) {
    const g = G(), B = g && g.gardens; if (!B || !B.group) return;
    const room = g.indoorMod && g.indoorMod(); if (room && room !== TIME) return;
    B.group.visible = true; gaT += dt;
    const Y = g.sim.you;
    try { B.update(dt, gaT, { x: Y.x, z: Y.z, y: Y.ry }); } catch (e) { /* */ }
    if (keepHidden) for (const o of keepHidden) if (o) o.visible = false;      // (the gardens' own sync may show its props again)
  }

  // ------------------------------------------------------------ Noa, through the crack on the green (DESIGN.md 18.5)
  const TXT = {
    'noa.open1': L('It’s Noa! Can you hear me? This crack smells of the whole valley… and it carries two more of Elio’s echoes: one in the {w.greenhouse} long ago, one in the {w.greenhouse} tomorrow.',
      '¡Soy Noa! ¿Me oyes? Esta grieta huele a todo el valle… y trae dos ecos más de Elio: uno en el invernadero de antes, otro en el invernadero de mañana.',
      'É a Noa! Você me ouve? Esta fenda tem o cheiro do vale inteiro… e traz mais dois ecos do Elio: um na estufa de antigamente, outro na estufa de amanhã.',
      'Ich bin’s, Noa! Hörst du mich? Dieser Riss riecht nach dem ganzen Tal … und er trägt noch zwei Echos von Elio: eins im Gewächshaus von früher, eins im Gewächshaus von morgen.',
      '[是|shì] [我|wǒ] ， [诺娅|Nuò yà] ！ [你|nǐ] [听得见|tīng de jiàn] [吗|ma] ？ [这|zhè] [道|dào] [裂缝|liè fèng] [有|yǒu] [整个|zhěng gè] [山谷|shān gǔ] [的|de] [花香|huā xiāng] … [还有|hái yǒu] [艾利欧|Ài lì ōu] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] ： [一|yī] [个|gè] [在|zài] [从前|cóng qián] [的|de] [温室|wēn shì] [里|lǐ] ， [一|yī] [个|gè] [在|zài] [明天|míng tiān] [的|de] [温室|wēn shì] [里|lǐ] 。',
      'ノア だ よ ！ [聞|き]こえる ？ この [裂|さ]け[目|め] は 、 [谷|たに] じゅう の [花|はな] の におい が する … それ と 、 エリオ の こだま が あと [二|ふた]つ 。 [昔|むかし] の [温室|おんしつ] に [一|ひと]つ 、 [明日|あした] の [温室|おんしつ] に [一|ひと]つ 。'),
    'noa.open2': L('Long ago, the {w.gd_summer} after the concert, a quiet boy helped the old gardener here every day. He never said what this place meant to him.',
      'Hace mucho, el verano después del concierto, un niño callado ayudaba aquí al viejo jardinero cada día. Nunca dijo lo que este lugar significaba para él.',
      'Há muito tempo, no verão depois do concerto, um menino calado ajudava o velho jardineiro aqui todo dia. Ele nunca disse o que este lugar significava pra ele.',
      'Vor langer Zeit, im Sommer nach dem Konzert, half ein stiller Junge hier jeden Tag dem alten Gärtner. Er hat nie gesagt, was ihm dieser Ort bedeutete.',
      '[很久|hěn jiǔ] [以前|yǐ qián] ， [音乐会|yīn yuè huì] [后|hòu] [的|de] [那个|nà ge] [夏天|xià tiān] ， [一个|yī gè] [安静|ān jìng] [的|de] [男孩|nán hái] [每天|měi tiān] [在|zài] [这里|zhè lǐ] [帮|bāng] [老|lǎo] [园丁|yuán dīng] 。 [他|tā] [从来|cóng lái] [没|méi] [说|shuō] [过|guò] [这里|zhè lǐ] [对|duì] [他|tā] [意味|yì wèi] [着|zhe] [什么|shén me] 。',
      'ずっと [昔|むかし] 、 コンサート の あと の [夏|なつ] 、 [無口|むくち] な [男|おとこ] の [子|こ] が [毎日|まいにち] 、 ここ で [年寄|としよ]り の [庭師|にわし] を [手伝|てつだ]って いた の 。 この [場所|ばしょ] が [大切|たいせつ] だ と は 、 [一度|いちど] も [言|い]わなかった 。'),
    'noa.open3': L('Step into the Past: the people of then will remember him. In there, describe how things were: «it was…», «there was…». Through the crack by the greenhouse, or this one.',
      'Entra en el Ayer: la gente de entonces lo recordará. Allí, describe cómo eran las cosas: «era…», «había…». Por la grieta junto al invernadero, o por esta.',
      'Entra no Ontem: o pessoal daquela época vai se lembrar dele. Lá, descreve como as coisas eram: «era…», «havia…». Pela fenda perto da estufa, ou por esta.',
      'Geh ins Gestern: Die Leute von damals werden sich an ihn erinnern. Beschreib dort, wie es war: «es war …», «es gab …». Durch den Riss am Gewächshaus oder durch diesen hier.',
      '[去|qù] [昨天|zuó tiān] [吧|ba] ： [那时候|nà shí hou] [的|de] [人|rén] [会|huì] [记得|jì de] [他|tā] 。 [在|zài] [那里|nà lǐ] ， [说说|shuō shuo] [以前|yǐ qián] [是|shì] [什么|shén me] [样子|yàng zi] ： “ [以前|yǐ qián] [是|shì] … ” “ [以前|yǐ qián] [有|yǒu] … ” 。 [从|cóng] [温室|wēn shì] [旁边|páng biān] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[昨日|きのう] へ [行|い]って 。 その ころ の [人|ひと] たち が 、 かれ を [覚|おぼ]えて いる はず 。 そこ で は 、 どんな [様子|ようす] だった か [話|はな]して ね 。 「 … でした 」 「 … が ありました 」 。 [温室|おんしつ] の そば の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から 。'),
    'noa.past1': L('That was his voice… He loved it here. He never said it… and now he has. Thank you.',
      'Esa era su voz… Le encantaba este lugar. Nunca lo dijo… y ahora sí. Gracias.',
      'Era a voz dele… Ele adorava este lugar. Nunca disse… e agora disse. Obrigada.',
      'Das war seine Stimme … Er hat es hier geliebt. Er hat es nie gesagt … und jetzt schon. Danke.',
      '[那|nà] [是|shì] [他|tā] [的|de] [声音|shēng yīn] … [他|tā] [很|hěn] [喜欢|xǐ huan] [这里|zhè lǐ] 。 [他|tā] [从来|cóng lái] [没|méi] [说|shuō] [过|guò] … [现在|xiàn zài] [说|shuō] [出来|chū lai] [了|le] 。 [谢谢|xiè xie] [你|nǐ] 。',
      'あれ は かれ の [声|こえ] … ここ が [大好|だいす]き だった ん だ ね 。 [一度|いちど] も [言|い]わなかった けど … やっと [言|い]えた 。 ありがとう 。'),
    'noa.past2': L('Now tomorrow. In the Future the gardens are gray and {w.gd_wilted}, and the people froze, waiting for a kind word. Flora is still there, on the green. Through the crack by the hives, or this one.',
      'Ahora, el mañana. En el Mañana los jardines están grises y marchitos, y la gente se quedó congelada, esperando una palabra amable. Flora sigue allí, en el prado de la feria. Por la grieta junto a las colmenas, o por esta.',
      'Agora, o amanhã. No Amanhã os jardins estão cinza e murchos, e as pessoas congelaram, esperando uma palavra gentil. A Flora ainda está lá, no gramado da feira. Pela fenda perto das colmeias, ou por esta.',
      'Jetzt das Morgen. Im Morgen sind die Gärten grau und verwelkt, und die Leute sind erstarrt, weil sie auf ein freundliches Wort warten. Flora ist noch da, auf der Festwiese. Durch den Riss bei den Bienenstöcken oder durch diesen hier.',
      '[现在|xiàn zài] [去|qù] [明天|míng tiān] 。 [在|zài] [明天|míng tiān] ， [花园|huā yuán] [又|yòu] [灰|huī] [又|yòu] [枯萎|kū wěi] ， [大家|dà jiā] [都|dōu] [冻|dòng] [住|zhù] [了|le] ， [在|zài] [等|děng] [一句|yī jù] [客气|kè qi] [的|de] [话|huà] 。 [芙洛拉|Fú luò lā] [还|hái] [在|zài] [草地|cǎo dì] [上|shang] 。 [走|zǒu] [蜂箱|fēng xiāng] [旁边|páng biān] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[次|つぎ] は [明日|あした] 。 [明日|あした] の [庭|にわ] は [灰色|はいいろ] で 、 しおれて いる 。 みんな 、 やさしい [言葉|ことば] を [待|ま]って [固|かた]まって しまった 。 フローラ は まだ [広場|ひろば] に いる よ 。 [巣箱|すばこ] の そば の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から [行|い]って 。'),
    'noa.fut1': L('He wants to plant flowers with them again. I think he will, one day.',
      'Quiere volver a plantar flores con ellos. Creo que algún día lo hará.',
      'Ele quer plantar flores com eles de novo. Acho que um dia ele vai.',
      'Er will wieder mit ihnen Blumen pflanzen. Ich glaube, eines Tages tut er es.',
      '[他|tā] [想|xiǎng] [再|zài] [跟|gēn] [他们|tā men] [一起|yī qǐ] [种花|zhòng huā] 。 [我|wǒ] [相信|xiāng xìn] [总有一天|zǒng yǒu yī tiān] [他|tā] [会|huì] 。',
      'また みんな と [花|はな] を [植|う]えたい ん だ ね 。 いつか きっと そう する と [思|おも]う 。'),
    'noa.fut2': L('That’s both of the gardens’ echoes. The next cracks will open in the Frost Peaks… I’ll call you when they do.',
      'Ya tienes los dos ecos de los jardines. Las próximas grietas se abrirán en los Picos Helados… Te llamaré cuando se abran.',
      'Você já tem os dois ecos dos jardins. As próximas fendas vão se abrir nos Picos Gelados… Eu te chamo quando abrirem.',
      'Das sind beide Echos der Gärten. Die nächsten Risse öffnen sich in den Frostgipfeln … Ich rufe dich, wenn es so weit ist.',
      '[花园谷|Huā yuán gǔ] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] [都|dōu] [找到|zhǎo dào] [了|le] 。 [下|xià] [一|yī] [道|dào] [裂缝|liè fèng] [会|huì] [在|zài] [霜峰|Shuāng fēng] [打开|dǎ kāi] … [到|dào] [时候|shí hou] [我|wǒ] [会|huì] [叫|jiào] [你|nǐ] 。',
      'これ で [花園|はなぞの] の こだま は [二|ふた]つ と も そろった 。 [次|つぎ] の [裂|さ]け[目|め] は [霜|しも] の [峰|みね] で [開|ひら]く … その とき は [呼|よ]ぶ ね 。'),
  };
  // Elio's echoes here (CH4.word): the Past's, the boy who never said what the place meant to him; the Future's, the man's wish
  const ECHO = {
    past: L('This garden was my favorite place.', 'Este jardín era mi lugar favorito.', 'Este jardim era o meu lugar favorito.', 'Dieser Garten war mein Lieblingsort.',
      '[那时候|nà shí hou] ， [这个|zhè ge] [花园|huā yuán] [是|shì] [我|wǒ] [最|zuì] [喜欢|xǐ huan] [的|de] [地方|dì fang] 。', 'この [庭|にわ] は 、 ぼく の いちばん [好|す]きな [場所|ばしょ] でした 。', { where: 'the Bloom Gardens, long ago' }),
    future: L('I’d love to plant flowers with you again.', 'Me encantaría volver a plantar flores con ustedes.', 'Eu adoraria plantar flores com vocês de novo.', 'Ich würde so gern wieder mit euch Blumen pflanzen.',
      '[我|wǒ] [希望|xī wàng] [能|néng] [再|zài] [跟|gēn] [你们|nǐ men] [一起|yī qǐ] [种花|zhòng huā] 。', 'また みんな と いっしょ に [花|はな] を [植|う]えたい です 。', { where: 'the Bloom Gardens, tomorrow' }),
  };
  if (typeof CH4 !== 'undefined') { CH4.word('gardens', 'past', ECHO.past); CH4.word('gardens', 'future', ECHO.future); }

  // Noa's voice comes out of the crack: it flares while she talks (its glow swells), and her name tag is hers
  let flare = 0;
  function noaP() { const c = CRACK.gate, y = gy(c.x, c.z); return { id: 'noa', name: nameOf(NOA), x: c.x, y: y + 0.3, z: c.z, top: 2.5, talking: false }; }
  async function noaSay(key) { flare = 1; snd('chime'); const p = noaP(); try { G().w3d.fx.sparkle(p.x, p.y + 1.4, p.z, 12, ['#bfe4ff', '#fff3c8', '#ffd7e8']); } catch (e) { /* */ } await say(p, TXT[key]); }
  function lookGate() { const c = CRACK.gate, y = gy(c.x, c.z), Y = G().sim.you, dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1; shot(V(c.x + dx / d * 5.2 + dz / d * 2.4, y + 2.4, c.z + dz / d * 5.2 - dx / d * 2.4), V(c.x, y + 1.5, c.z), 1.0); }
  // the crack card's examples, each language's own: a description of then, a person of then, a gentle request, a wish
  const CRACK_EX = { es: ['había una fuente', 'era muy callado', '¿podría…?', 'me encantaría…'], pt: ['havia uma fonte', 'era muito calado', 'poderia…?', 'eu adoraria…'],
    de: ['es gab einen Brunnen', 'er war sehr still', 'könnten Sie …?', 'ich würde so gern …'],
    zh: ['[以前|yǐ qián] [有|yǒu] [一个|yī gè] [喷泉|pēn quán]', '[那时候|nà shí hou] [他|tā] [很|hěn] [安静|ān jìng]', '[能不能|néng bu néng] … ？', '[我|wǒ] [希望|xī wàng] …'],
    ja: ['[噴水|ふんすい] が ありました', '[静|しず]か でした', '… いただけます か', '… と いい です ね'] };
  async function crackCard() {
    css();
    const l = lang(), nm = w => { const t = TIME.RULES[w].name[l] || TIME.RULES[w].name.en; return isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t); };
    const ex = (CRACK_EX[l] || CRACK_EX.es).map(t => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t)));
    await UI.card(`<div class="tag">The gardens’ time cracks</div><div class="rows">`
      + `• By the <b>great greenhouse</b>: today ↔ «${nm('past')}», the gardens about 40 years ago, the greenhouse brand new.<br>`
      + `• By the <b>hives</b>: today ↔ «${nm('future')}», the gardens if nobody speaks up.<br>`
      + `• Here, where the road comes onto the <b>green</b>: all three. Noa’s voice comes through this one: report to her here.<br>`
      + `In the Past, <b>describe how things were</b> («${ex[0]}», «${ex[1]}»). In the Future everyone froze waiting for a kind word: <b>ask nicely, and say your wishes</b> («${ex[2]}», «${ex[3]}»).</div><div class="sub">E</div>`, { kind: 'gd-card' });
  }
  async function noaOpen() {
    lock(true);
    try {
      lookGate(); await wait(0.9);
      await noaSay('noa.open1'); await noaSay('noa.open2'); await noaSay('noa.open3');
      flare = 0; await crackCard();
      TIME.seen('gardens.noa', true); G().save();
    } finally { flare = 0; lock(false); }
    think('Into the Past, to the old gardener by the great greenhouse. The crack by the greenhouse leads there, and so does this one.', 6);
  }
  async function reportPast() {
    lock(true);
    try { lookGate(); await wait(0.6); await noaSay('noa.past1'); await noaSay('noa.past2'); st('past').reported = true; G().save(); } finally { flare = 0; lock(false); }
    think('Next: the gardens tomorrow. The crack by the hives leads there.', 5);
  }
  async function reportFuture() {
    lock(true);
    try {
      lookGate(); await wait(0.6); await noaSay('noa.fut1'); await noaSay('noa.fut2'); st('future').reported = true;
      try { if (typeof QUESTS !== 'undefined' && QUESTS.tick) QUESTS.tick(); } catch (e) { /* */ }
      G().save();
    } finally { flare = 0; lock(false); }
  }

  // ------------------------------------------------------------ the region: TIME dresses both worlds (gardens_past.js fills DRESS.past,
  // gardens_future.js DRESS.future); while you're inside a world's greenhouse the dungeon does its own look, so `look` steps aside
  const DRESS = {
    past: { edge: 'The memory ends here… The gardens of long ago are only this valley. Let’s stay where it happened.' },
    future: { edge: 'Past the valley, tomorrow’s gray fog is too thick to see. Let’s turn back.', k: () => 0.12 },
  };
  Object.defineProperty(DRESS.past, 'look', { get: () => (typeof GD_PHOUSE !== 'undefined' && GD_PHOUSE && GD_PHOUSE.inside ? null : 'past'), enumerable: true, configurable: true });
  Object.defineProperty(DRESS.future, 'look', { get: () => (typeof GD_FHOUSE !== 'undefined' && GD_FHOUSE && GD_FHOUSE.inside ? null : 'future'), enumerable: true, configurable: true });
  Object.assign(TIME.STEPS, { impfdesc: 'the imperfect for descriptions (era, había, estaba lleno de…)', condpol: 'the conditional for politeness and wishes (podría, querría, me encantaría)' });
  const songOf = w => () => {
    if (w === 'past') return typeof GD_PAST !== 'undefined' && GD_PAST && GD_PAST.song ? GD_PAST.song() : 'past';
    return typeof GD_FUT !== 'undefined' && GD_FUT && GD_FUT.song ? GD_FUT.song() : 'future';
  };
  TIME.region('gardens', {
    name: { now: 'The Bloom Gardens', past: 'The Bloom Gardens, long ago', future: 'The Bloom Gardens · tomorrow' },
    color: { past: '#d08a4a', future: '#6f6b84' },
    center: CEN, radius: RAD, inside,
    open: () => (typeof CH4 !== 'undefined' ? CH4.open('gardens') : false),
    grammar: { past: ['impfdesc'], future: ['condpol'] },
    songs: { past: songOf('past'), future: songOf('future') },
    dress: DRESS,
    init: api => init(api),
    tick: (api, dt) => tick(dt),
    changed: (api, fw, tw) => { for (const M of [typeof GD_PAST !== 'undefined' && GD_PAST, typeof GD_FUT !== 'undefined' && GD_FUT]) if (M && M.changed) { try { M.changed(fw, tw); } catch (e) { console.error('[gardens] changed', e); } } },
  });
  TIME.crack('gardens.glass', { region: 'gardens', x: CRACK.past.x, z: CRACK.past.z, worlds: ['now', 'past'] });
  TIME.crack('gardens.hives', { region: 'gardens', x: CRACK.future.x, z: CRACK.future.z, worlds: ['now', 'future'] });
  TIME.crack('gardens.green', { region: 'gardens', x: CRACK.gate.x, z: CRACK.gate.z, worlds: ['now', 'past', 'future'] });

  function init(api) {
    try { registerWords(); } catch (e) { console.error('[gardens] words', e); }
    try { addTab(); } catch (e) { console.error('[gardens] journal', e); }
    try { if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['ミドリ', 'ベント', 'ダリア', 'ローラ', 'エリオ']); } catch (e) { /* */ }
    for (const [M, tag] of [[typeof GD_PAST !== 'undefined' && GD_PAST, 'past'], [typeof GD_FUT !== 'undefined' && GD_FUT, 'future'],
      [typeof GD_PHOUSE !== 'undefined' && GD_PHOUSE, 'past house'], [typeof GD_FHOUSE !== 'undefined' && GD_FHOUSE, 'future house'], [typeof GDBOSS !== 'undefined' && GDBOSS, 'bosses']])
      if (M && M.init) { try { M.init(api.G, api); } catch (e) { console.error('[gardens] init ' + tag, e); } }
  }

  // ------------------------------------------------------------ every frame, in any world: Noa (her first words here, the reports)
  let idle = 0;
  const busyNow = g => STORY.busy || STORY.line || g.sim.lock || g.journalOpen || g.state.teaching || TIME.busy
    || document.body.classList.contains('in-battle') || document.body.classList.contains('on-title') || (g.indoorMod && g.indoorMod() && g.indoorMod() !== TIME);
  function tick(dt) {
    const g = G(); if (!g || !g.state) return;
    flare = Math.max(0, flare - dt * 0.35);
    const M = TIME._.VIS && TIME._.VIS['gardens.green']; if (M && M.glow) { const k = 1 + flare * 0.9; M.glow.scale.set(3.4 * k, 4.2 * k, 1); }
    if (!TIME.open('gardens') || busyNow(g)) { idle = 0; return; }
    const w = TIME.world(), Y = g.sim.you, c = CRACK.gate, d = Math.hypot(Y.x - c.x, Y.z - c.z), s = g.state;
    const P = sp(s), F = sf(s);
    let run = null;
    if (w === 'now' && !TIME.seen('gardens.noa') && d < 7) run = noaOpen;
    else if (d < 3.4 && (w === 'now' || TIME.regionNow() === 'gardens')) {
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
    const c = want === 'past' ? (w === 'future' ? C['gardens.green'] : C['gardens.glass'])
      : want === 'future' ? (w === 'past' ? C['gardens.green'] : C['gardens.hives'])
      : (w === 'past' ? C['gardens.glass'] : C['gardens.hives']);
    const nm = { past: 'the Past', future: 'the Future', now: 'today' }[want];
    return c ? { x: c.x, z: c.z, hint: `{mimo} looks at the time crack: ${nm} is through there.` } : null;
  }
  const gateT = () => ({ x: CRACK.gate.x, z: CRACK.gate.z, hint: '{mimo} looks at the time crack on the green. Noa’s voice is in it.' });
  // examples inside English text (steps, quests, hints): each language's own, zh / ja in the mode's text
  const SX = {
    boy: { es: ['era muy callado', 'tenía una gorra roja'], pt: ['era muito calado', 'tinha um boné vermelho'], de: ['er war sehr still', 'er hatte eine rote Mütze'],
      zh: ['[那时候|nà shí hou] [他|tā] [很|hěn] [安静|ān jìng]', '[他|tā] [戴|dài] [着|zhe] [红|hóng] [帽子|mào zi]'], ja: ['[静|しず]か でした', '[赤|あか]い [帽子|ぼうし] を かぶって いました'] },
    inside: { es: ['había una fuente', 'estaba lleno de mariposas'], pt: ['havia uma fonte', 'estava cheia de borboletas'], de: ['es gab einen Brunnen', 'es war voller Schmetterlinge'],
      zh: ['[以前|yǐ qián] [有|yǒu] [一个|yī gè] [喷泉|pēn quán]', '[满是|mǎn shì] [蝴蝶|hú dié]'], ja: ['[噴水|ふんすい] が ありました', 'ちょう で いっぱい でした'] },
    mem: { es: ['{mimo} trepó por la enredadera'], pt: ['O {mimo} subiu pela trepadeira'], de: ['{mimo} ist an der Ranke geklettert'], zh: ['{mimo} [爬|pá] [了|le] [上去|shàng qù]'], ja: ['{mimo} が つる を [登|のぼ]った'] },
    polite: { es: ['¿podría darme la llave?', 'querría…', 'me encantaría…'], pt: ['poderia me dar a chave?', 'gostaria…', 'eu adoraria…'], de: ['könnten Sie …?', 'ich hätte gern …', 'ich würde so gern …'],
      zh: ['[能不能|néng bu néng] … ？', '[我|wǒ] [想|xiǎng] …', '[我|wǒ] [希望|xī wàng] …'], ja: ['… いただけます か', '… たい です', '… と いい です ね'] },
    plan: { es: ['{mimo} empujará la maceta'], pt: ['O {mimo} empurrará o vaso'], de: ['{mimo} wird den Blumentopf schieben'], zh: ['{mimo} [会|huì] [推|tuī] [花盆|huā pén]'], ja: ['{mimo} が [植木鉢|うえきばち] を [押|お]す つもり です'] },
    wish: { es: ['me encantaría ver las flores', 'querría oír las abejas'], pt: ['eu adoraria ver as flores', 'gostaria de ouvir as abelhas'], de: ['ich würde so gern die Blumen sehen', 'ich hätte gern …'],
      zh: ['[我|wǒ] [希望|xī wàng] [再|zài] [看到|kàn dào] [花|huā]'], ja: ['また [花|はな] が [見|み]たい です'] },
    paint: { es: ['el cielo era azul', 'las rosas eran rojas'], pt: ['o céu era azul', 'as rosas eram vermelhas'], de: ['der Himmel war blau', 'die Rosen waren rot'],
      zh: ['[天空|tiān kōng] [是|shì] [蓝色|lán sè] [的|de]'], ja: ['[空|そら] は [青|あお] でした'] },
  };
  function sx(k, labels) {
    const l = lang(), a = (SX[k] || {})[l] || (SX[k] || {}).es || [];
    return a.map((t, i) => { let s = fillMimo(t, l); if (isCl(l)) s = plainT(s); return `«${s}»` + (labels && labels[i] ? ` (${labels[i]})` : ''); }).join(', ');
  }
  const pastT = id => () => via('past', () => (typeof GD_PAST !== 'undefined' && GD_PAST ? GD_PAST.target(id) : null));
  const futT = id => () => via('future', () => (typeof GD_FUT !== 'undefined' && GD_FUT ? GD_FUT.target(id) : null));
  const HEARD = ['glazier', 'keeper', 'painter'];
  const heardN = s => HEARD.filter(k => sp(s).heard && sp(s).heard[k]).length;
  const WAKE = ['tomasa', 'polo', 'lola', 'melisa'];
  const PSTEPS = [
    { _tt: true, text: 'The Bloom Gardens: listen to Noa at the time crack on the green',
      why: 'Since the quarry’s two echoes came home, something shimmers where the road comes down onto the gardens’ green. Noa’s voice is in it.',
      done: s => seenIn(s, 'gardens.noa'), target: gateT, hint: '{mimo} sniffs the air on the green. A shimmer… and roses?' },
    { _tt: true, get text() { return fillEn('In the Past: find {gardener}, the head gardener, by the great greenhouse'); },
      get why() { return fillEn('About 40 years ago, the summer after the concert, the great greenhouse was brand new. But its inside has gone gray. {gardener} looks after the gardens. Through the crack by the greenhouse, or the one on the green.'); },
      done: s => !!sp(s).met, target: pastT('gardener'), hint: '{mimo} points at an old man in a straw hat, by the greenhouse door.' },
    { _tt: true, get text() { return fillEn('Describe the quiet boy to young {melisa} ({n}/2)'); }, n: s => Math.min(2, sp(s).melisaQ || 0),
      get why() { return fillEn(`Young {melisa}, the beekeeper’s daughter, was the boy’s friend. Play her remembering game: describe him, ${sx('boy')}.`); },
      done: s => !!sp(s).melisa, target: pastT('melisa'), hint: '{mimo} points at a little girl by the beehives.' },
    { _tt: true, get text() { return fillEn('Hear what the greenhouse was like inside ({n}/3), then tell {gardener}'); }, n: s => heardN(s),
      get why() { return fillEn(`The glazier, the beekeeper and the painter each remember the inside. Then describe it to {gardener}: ${sx('inside')}.`); },
      done: s => !!sp(s).joined, target: () => via('past', () => (typeof GD_PAST !== 'undefined' && GD_PAST ? GD_PAST.target(heardN(G().state) >= 3 ? 'gardener' : 'heard') : null)), hint: '{mimo} tugs your sleeve toward someone of then.' },
    { _tt: true, text: 'The new greenhouse: bring back how it was ({n}/3)', n: s => Math.min(3, sp(s).floors || 0),
      get why() { return fillEn(`Inside, each hall forgot how it looked: describe it, and the color comes back. Tell {mimo} what it did, as a memory (${sx('mem')}).`); },
      done: s => (sp(s).floors || 0) >= 3, target: pastT('door'), hint: '{mimo} looks at the greenhouse door.' },
    { _tt: true, text: 'In the dome: wake the Faded Bloom and free Elio’s echo',
      why: 'A giant flower stands gray in the middle of the dome. It hums like a boy’s voice.',
      done: s => echoIn(s, 'past'), target: pastT('door'), hint: '{mimo} looks at the greenhouse. The dome is at its heart.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack on the green',
      why: 'Elio’s echo is free. Tell Noa: her voice comes through the crack on the green, in any of the three times.',
      done: s => !!sp(s).reported, target: gateT, hint: '{mimo} looks at the time crack on the green.' },
  ];
  const FSTEPS = [
    { _tt: true, text: 'In the Future: find Flora on the gray green',
      why: 'In the gardens tomorrow everything is gray and wilted. Someone is still talking, on the green. Through the crack by the hives, or the one on the green.',
      done: s => !!sf(s).met, target: futT('flora'), hint: '{mimo} points at someone on the green… the only one with any color.' },
    { _tt: true, text: 'Ask nicely: wake the four frozen gardeners ({n}/4)', n: s => WAKE.filter(k => sf(s).woke && sf(s).woke[k]).length,
      get why() { return fillEn(`They froze waiting for a kind word. Ask them gently, or say a wish, in tomorrow’s words: ${sx('polite')}.`); },
      done: s => WAKE.every(k => sf(s).woke && sf(s).woke[k]), target: () => via('future', () => (typeof GD_FUT !== 'undefined' && GD_FUT ? GD_FUT.target('frozen') : null)), hint: '{mimo} tugs your sleeve toward someone gray.' },
    { _tt: true, text: 'The greenhouse tomorrow: get through, politely ({n}/3)', n: s => Math.min(3, sf(s).floors || 0),
      get why() { return fillEn(`Hedge animals block the halls, and the fountain is dry. Ask nicely, say your wishes, and give {mimo} its plans (${sx('plan')}).`); },
      done: s => (sf(s).floors || 0) >= 3, target: futT('door'), hint: '{mimo} looks at the greenhouse door, the thorns cut away.' },
    { _tt: true, text: 'In the gray dome: soften the Thorn Warden and free Elio’s echo',
      get why() { return fillEn(`Something made of thorns holds the dome. It only listens to polite words, and to wishes: ${sx('wish')}.`); },
      done: s => echoIn(s, 'future'), target: futT('door'), hint: '{mimo} looks at the greenhouse.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack on the green',
      why: 'Both of the gardens’ echoes are free. Tell Noa, at the crack on the green.',
      done: s => !!sf(s).reported, target: gateT, hint: '{mimo} looks at the time crack on the green.' },
  ];
  if (typeof CH4 !== 'undefined') {
    CH4.steps('gardens', 'past', PSTEPS);
    CH4.steps('gardens', 'future', FSTEPS);
    CH4.story('gardens', [
      { when: s => seenIn(s, 'gardens.noa'), text: 'Noa’s voice came through the crack on the gardens’ green: two more of Elio’s echoes are here, one long ago, one tomorrow.' },
      { when: s => !!sp(s).melisa, text: 'Long ago, a quiet boy in a red cap watered the new greenhouse every day. He never said a word… but young Melisa saw him smile.' },
      { when: s => echoIn(s, 'past'), text: 'In the dome of the new greenhouse, the Faded Bloom remembered its color and gave back Elio’s voice: the gardens were his favorite place.' },
      { when: s => !!sf(s).met, text: 'Tomorrow, the gardens are gray. Everyone froze waiting for a kind word; only Flora still talks.' },
      { when: s => echoIn(s, 'future'), text: 'The Thorn Warden heard a wish said out loud and let go. Elio’s voice, tomorrow: he’d love to plant flowers with them again.' },
    ]);
  }

  // ------------------------------------------------------------ the words of both worlds (GPTXT.WORDS, GFTXT.WORDS): registered in
  // Mimo's memory (caves.js's way), met in the lines, the demonstrations and the Looks, listed in the journal
  const wordLists = () => [typeof GPTXT !== 'undefined' ? GPTXT.WORDS || [] : [], typeof GFTXT !== 'undefined' ? GFTXT.WORDS || [] : []];
  function registerWords() {
    if (typeof LEX === 'undefined') return 0;
    let n = 0;
    for (const list of wordLists()) { const add = list.filter(w => !LEX.item(w.id)).map(w => Object.assign({ kind: 'word' }, w)); LEX.register(add); n += add.length; }
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const list of wordLists()) for (const w of list) for (const l of ['zh', 'ja']) if (w[l]) CJK.addSource(w[l]); } catch (e) { /* */ }
    return n;
  }
  function wordsHTML() {
    css();
    const l = lang(), [P, F] = wordLists(), seen = id => typeof LEX !== 'undefined' && LEX.seen(id);
    const row = w => { const t = w[l] || ''; return `<li class="${seen(w.id) ? '' : 'no'}">${seen(w.id) ? '✓ ' : ''}<b>${tHTML(t, l)}</b> <span class="en">${esc(w.en)}</span></li>`; };
    const n = list => list.filter(w => seen(w.id)).length;
    return `<div class="mt"><h4 class="ph-h">Garden words <small>${n(P) + n(F)} / ${P.length + F.length}</small></h4><p class="note">The Bloom Gardens long ago and tomorrow: every word you meet there, in the lines, the demonstrations and the things you look at (✓ once you’ve met it). Mimo keeps them for review.</p>`
      + `<h5>Long ago <small>${n(P)} / ${P.length}</small></h5><ul class="gd-words">${P.map(row).join('')}</ul>`
      + `<h5>Tomorrow <small>${n(F)} / ${F.length}</small></h5><ul class="gd-words">${F.map(row).join('')}</ul></div>`;
  }
  function addTab() {
    if (typeof UI === 'undefined') return;
    UI.journalTabs = UI.journalTabs || [];
    if (UI.journalTabs.some(t => t.id === 'gd-words')) return;
    UI.journalTabs.push({ id: 'gd-words', label: () => (G() && TIME.open('gardens') && TIME.seen('gardens.noa') ? 'Garden words' : null), html: () => wordsHTML(), wire() { /* */ } });
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
    walk({ TXT, ECHO, NOA, CRACK_EX, SX }, 'gardt');
    if (typeof GPTXT !== 'undefined') walk(GPTXT, 'past');
    if (typeof GFTXT !== 'undefined') walk(GFTXT, 'future');
    if (typeof GDMUSIC !== 'undefined' && GDMUSIC.TEXT) walk(GDMUSIC.TEXT, 'music');
    // (the hushed lines: as many *starred* words in each language as in the English)
    for (const T0 of [GPTXT, GFTXT]) for (const [k, T] of Object.entries((T0 && T0.LINES) || {})) {
      const n = s => (String(s || '').match(/\*[^*]+\*/g) || []).length, ne = n(T.en); if (!ne) continue;
      for (const l of LANGS) if (n(T[l]) !== ne) out.push(`${k} (${l}): ${n(T[l])} starred words, the English has ${ne}`);
    }
    return out;
  }

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the save goes to the test slot)
  // setup(o): the quarry's setup with every earlier region's path done (QUART._.t.setup({ prior: true })), the quarry finished and
  // reported, today's gardens as Chapter 1 left them (the bell rung), the gardens open; o.seen === false: Noa's first words still to come
  function setup(o = {}) {
    if (typeof QUART !== 'undefined' && QUART && QUART._ && QUART._.t) {
      QUART._.t.setup({ prior: true });
      try { QUART._.t.at('future.top'); TIME.state('quarry', 'past').reported = true; TIME.state('quarry', 'future').reported = true; } catch (e) { console.error('[gardens] setup quarry', e); }
    }
    if (typeof CH4 !== 'undefined') { CH4._.t.give('quarry', 'past'); CH4._.t.give('quarry', 'future'); }
    const g = G(), f = g.state.flags;
    Object.assign(f, { gardensRoad: true, flora: true, gardenGate: true, gardens: true, melisa: true, allLiked: true, showDone: true, greenOpen: true, gardensFree: true });
    f.bells = Math.max(f.bells || 0, 4);
    const gs = g.state.gardens || (g.state.gardens = {}); gs.liked = gs.liked || {}; gs.judged = gs.judged || {};
    for (const id of ['tomasa', 'polo', 'lola']) gs.liked[id] = gs.liked[id] || 'S';
    for (const k of ['big', 'pretty', 'sweet']) gs.judged[k] = gs.judged[k] || 'S';
    try { if (typeof LEX !== 'undefined' && !LEX.taught('v.climb')) LEX.attempt('v.climb', { ok: true, hints: 0, ms: 3000, mode: 'teach' }); } catch (e) { /* */ }
    if (o.seen !== false) TIME.seen('gardens.noa', true);
    const main = typeof QUESTS !== 'undefined' && QUESTS.LIST.find(q => q.id === 'main');
    if (main && !main.steps.some(x => x.ch4 === 'gardens')) {
      const i = main.steps.findIndex(x => x.ch4 === 'soon'); const add = PSTEPS.concat(FSTEPS);
      if (i >= 0) main.steps.splice(i, 0, ...add); else main.steps.push(...add);
    }
    TIME._.fast.on = true; TIME.refresh();
    return TIME.open('gardens');
  }
  function near(id) {
    const c = CRACK[id] || (id === 'door' ? { x: DOOR.x, z: DOOR.z - 1.6 } : null); if (!c) return null;
    const g = G(), Y = g.sim.you; Y.x = c.x + 1.3; Y.z = c.z - 1.0; g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
    return { x: Y.x, z: Y.z };
  }
  async function go(w, at) { const p = at || { x: CRACK.gate.x + 1.4, z: CRACK.gate.z + 1.4, yaw: Math.PI }; const r = await TIME.go(w, { region: 'gardens', at: p, quick: true }); return r && TIME.world(); }
  // put the save at a step of the gardens' path (everything before it done): 'past.house' (the Past's greenhouse next), 'past.top' (its
  // boss next), 'future' (the Past reported), 'future.house', 'future.top'
  function at(step) {
    const P = st('past'), F = st('future'), pm = P.house || (P.house = {}), fm = F.house || (F.house = {});
    TIME.seen('gardens.noa', true);
    Object.assign(P, { met: true, melisaQ: 2, melisa: true, heard: { glazier: true, keeper: true, painter: true }, joined: true });
    if (step === 'past.house') return step;
    Object.assign(pm, { seen0: true, seen1: true, seen2: true, fountain: true, vine: true, done0: true, ambush: true, butterflies: true, done1: true, bridge: true, cap: true, done2: true, memCard: true });
    P.floors = 3;
    if (step === 'past.top') return step;
    Object.assign(pm, { seen3: true, boss: true, done3: true }); TIME.flag('past', 'gdHouse', true);
    if (typeof CH4 !== 'undefined') CH4._.t.give('gardens', 'past'); P.reported = true;
    if (step === 'future') { TIME.refresh(); return step; }
    Object.assign(F, { met: true, woke: { tomasa: 'S', polo: 'S', lola: 'S', melisa: 'S' }, open: true });
    if (step === 'future.house') { TIME.refresh(); return step; }
    Object.assign(fm, { seen0: true, seen1: true, seen2: true, rabbit: true, pot: true, done0: true, ambush: true, fountain: true, done1: true, bear: true, vine: true, done2: true });
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

  return { CEN, RAD, CRACK, DOOR, DRESS, TXT, ECHO, NOA, PSTEPS, FSTEPS, WAKE, HEARD, L, LANGS, isCl, lang, nameOf, enName, fillMimo, fillEn, cjRun, say, demo, hushed, think, you, frame2, lookAt, meet, introduce,
    card, css, grade, ask, memTask, planTask, has, person, who, lock, shot, wait, mimoName, plainT, down, st, sp, sf, sn, via, check, sx, registerWords, inside, hideToday, showToday,
    get flare() { return flare; }, set flare(v) { flare = v; },
    _: { noaOpen, reportPast, reportFuture, crackCard, tick, wordsHTML, t: { setup, near, go, probe, at, check: () => check(), get drv() { return drv(); } } } };
})();
