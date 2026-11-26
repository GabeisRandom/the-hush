'use strict';
// Molinar in three worlds (DESIGN.md 18.6 "T1c", game/TIME.md §11): the first region TIME dresses itself (no room module of its
// own), so this file and its siblings are the model for the seven regions after it.
//   time_molinar.js        MOLT: the region, its three cracks, Noa's voice at the west gate, Chapter 4's steps and echoes, the
//                          shared kit (names, saying and demonstrating, the S–D grader, the ask box, pattern cards) and test hooks
//   molinar_past(_text).js   Molinar long ago: the dressing, its 8 people, the main path and 3 side quests, the spare millstone
//   molinar_future(_text).js Molinar tomorrow: the gray dressing, 7 frozen people woken by promises, 3 side quests, the warning
//   molinar_past_mill.js   MPMILL: the Great Mill being built (rooms at y 300, z −360, x −430 / −404 / −378 / −352)
//   molinar_future_mill.js MFMILL: the silent Great Mill (rooms at y 300, z −330, the same x)
//   molinar_time_boss.js   the first armadillo (the Past) and the Gray Miller (the Future): plug-ins on battle/flow.js
//   molinar_time_music.js  six songs: each world's area, dungeon and boss
// The cracks (open with CH4.open('molinar'): after Alba's two echoes): by the Great Mill's door (today ↔ the Past), in the market
// square (today ↔ the Future), by the west gate (all three; Noa speaks there). State: TIME.state('molinar', 'past' | 'future' |
// 'now'); flags: TIME.flag('past', 'molStone' | 'molBuilt'), ('future', 'molFree' | 'molWarn' | 'molMarket'), ('now', 'molOiled').
const MOLT = (() => {
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

  // ------------------------------------------------------------ where things are
  const CEN = { x: 214, z: -151 }, RAD = 45;
  const CRACK = { mill: { x: 231.6, z: -166.8 }, market: { x: 224.6, z: -150.6 }, gate: { x: 176.2, z: -155.4 } };
  const DOOR = { x: 240, z: -167.3 };          // the Great Mill's door, from its forecourt (the way into each world's dungeon)

  // ------------------------------------------------------------ the save's part
  const st = w => TIME.state('molinar', w);
  const R0 = s => (s && s.worlds && s.worlds.r && s.worlds.r.molinar) || {};
  const sp = s => R0(s).past || {}, sf = s => R0(s).future || {}, sn = s => R0(s).now || {};
  const seenIn = (s, k) => !!(s && s.worlds && s.worlds.seen && s.worlds.seen[k]);
  const echoIn = (s, w) => !!(s && s.ch4 && s.ch4.echoes && s.ch4.echoes['molinar.' + w]);

  // ------------------------------------------------------------ names: each language's own cast (MPTXT.CAST, MFTXT.CAST)
  const NOA = L('Noa', 'Noa', 'Noa', 'Noa', '[诺娅|Nuò yà]', 'ノア');
  const casts = () => [typeof MPTXT !== 'undefined' ? MPTXT.CAST : {}, typeof MFTXT !== 'undefined' ? MFTXT.CAST : {}];
  // a speaker's name tag (zh / ja: the mode's text), and a name inside an English line (zh / ja: romanized)
  const nameOf = (T, l = lang()) => (!T ? '' : isCl(l) ? plainT(T[l] || T.en) : T[l] || T.en);
  const enName = (T, l) => { if (!T) return ''; if (l === 'es') return T.en; if (isCl(l)) { try { return CJK.roman(T[l], { lang: l }); } catch (e) { return T.en; } } return T[l] || T.en; };
  const fillMimo = (t, l = lang()) => String(t || '').replace(/\{mimo\}/g, isCl(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName());
  function fillEn(t, l = lang()) {
    let s = String(t || '');
    for (const C of casts()) s = s.replace(/\{([a-z]+)\}/g, (m, k) => (C[k] ? enName(C[k], l) : m));
    return s.replace(/\{mimo\}/g, mimoName()).replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }
  const enOf = (T, l) => (T && (T['en_' + l] || T.en)) || '';

  // ------------------------------------------------------------ the words of both worlds (MPTXT.WORDS, MFTXT.WORDS): about 100 per
  // world, registered in Mimo's memory (LEX, like caves.js, the lake and the quarry), each introduced (seen, and let into the weave)
  // the moment the line, demonstration or Look that teaches it is said, and listed on the journal's "Molinar words" tab.
  // Table rows: key ~ en ~ es ~ pt ~ de ~ zh ~ ja ~ where (the keys of the lines, demonstrations and Looks that teach it, in that
  // world's own tables). es / pt / de: a leading article gives the gender (el / la / los / las, o / a / os / as, der / die / das; a
  // plural article is kept as the word's own); «=» keeps the text as it is («=ayer», «=el año pasado»); «;» adds accepted forms.
  // A key «@id» lists a word Mimo already has (c.hill, v.sing, or the other world's w.ml_*): taught and listed, not registered again.
  // A line's own {w.ml_*} slots are introduced as it's said, so the word shows in the language, glossed, right where it's used.
  const ARTS = { es: { el: 'm', la: 'f', los: 'm', las: 'f' }, pt: { o: 'm', a: 'f', os: 'm', as: 'f' }, de: { der: 'm', die: 'f', das: 'n' } };
  const PLURAL_ART = { los: 1, las: 1, os: 1, as: 1 };
  const WORDS = { past: [], future: [] }, BYKEY = {};
  function parseWords(src, world) {
    const pre = world === 'past' ? 'p:' : 'f:', out = [];
    String(src || '').split('\n').map(r => r.trim()).filter(r => r && !r.startsWith('//')).forEach(row => {
      const c = row.split('~').map(x => x.trim()); if (c.length < 8) return;
      const [key, en, es, pt, de, zh, ja, where] = c, keys = where.split(/\s*,\s*/).filter(Boolean).map(k => pre + k);
      if (key[0] === '@') { out.push({ id: key.slice(1), ref: true, keys, world }); return; }
      // (en: the gloss the weave shows, its parentheses dropped; enFull: what the journal lists, «sails (of a mill)»)
      const it = { id: 'w.ml_' + key, kind: 'word', en: en.replace(/\s*\([^)]*\)/g, '').trim() || en, enFull: en, g: {}, alt: {}, world, keys };
      for (const [l, v0] of [['es', es], ['pt', pt], ['de', de]]) {
        const [v, ...alts] = v0.split(';').map(s => s.trim());
        if (alts.length) it.alt[l] = alts;
        if (v[0] === '=') { it[l] = v.slice(1); continue; }
        const m = v.match(/^(\S+)\s+(.+)$/), a = m && m[1].toLowerCase(), g = a && ARTS[l][a];
        if (g) { it[l] = m[2]; it.g[l] = g; if (PLURAL_ART[a]) (it.art || (it.art = {}))[l] = a; } else it[l] = v;
      }
      for (const [l, v0] of [['zh', zh], ['ja', ja]]) { const [v, ...alts] = v0.split(';').map(s => s.trim()); it[l] = v; if (alts.length) it.alt[l] = alts; }
      if (!Object.keys(it.g).length) delete it.g;
      if (!Object.keys(it.alt).length) delete it.alt;
      out.push(it);
    });
    return out;
  }
  let wordsOk = false;
  function registerWords() {
    if (wordsOk || typeof LEX === 'undefined') return 0;
    if (typeof MPTXT !== 'undefined') WORDS.past = parseWords(MPTXT.WORDS, 'past');
    if (typeof MFTXT !== 'undefined') WORDS.future = parseWords(MFTXT.WORDS, 'future');
    const own = WORDS.past.concat(WORDS.future).filter(w => !w.ref);
    const add = own.filter(w => !LEX.item(w.id)).map(w => { const o = Object.assign({}, w); delete o.keys; delete o.world; return o; });
    LEX.register(add);
    for (const w of WORDS.past.concat(WORDS.future)) for (const k of w.keys) (BYKEY[k] || (BYKEY[k] = [])).push(w.id);
    // (zh / ja: the dictionary that reads typed answers and the IME know these too)
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const w of own) for (const l of ['zh', 'ja']) if (w[l]) CJK.addSource(w[l]); } catch (e) { /* */ }
    wordsOk = true;
    return add.length;
  }
  const introduce = id => { try { if (typeof LEX === 'undefined' || !LEX.item(id)) return; if (STORY.introduce) STORY.introduce(id); else LEX.expose(id); } catch (e) { /* */ } };
  // a line, a demonstration or a Look is said: the words it teaches are met (its key's words, and its own {w.ml_*} slots)
  const SLOT = /\{(w\.ml_[a-z0-9_]+)(?::(?:pl|f))?\}/g;
  function teach(T, text) {
    if (!wordsOk) registerWords();
    if (T && T._mk) for (const id of BYKEY[T._mk] || []) introduce(id);
    const en = String(text != null ? text : (T && (T.en || T.t)) || ''); let m; SLOT.lastIndex = 0;
    while ((m = SLOT.exec(en))) introduce(m[1]);
  }
  // a save from before these words were registered: what its passed steps already showed counts as met (seen only, not let into the
  // weave), so the journal's ticks match what the player heard. Once per save loaded.
  let caughtFor = null;
  function catchUp() {
    const g = G(); if (!wordsOk || !g || !g.state || caughtFor === g.state || typeof LEX === 'undefined' || !TIME.open('molinar')) return;
    caughtFor = g.state;
    const P = sp(g.state), F = sf(g.state), pm = P.mill || {}, fm = F.mill || {}, keys = [];
    const on = (c, ...ks) => { if (c) keys.push(...ks); };
    on(P.demo, 'p:wife.demo'); on(P.helperDemo, 'p:helper.demo'); on((P.asked || 0) >= 1, 'p:builder.q1'); on((P.asked || 0) >= 2, 'p:builder.q2');
    on(pm.seen0, 'p:room1'); on(pm.seen1, 'p:room2'); on(pm.seen2, 'p:room3'); on(pm.done3, 'p:room4', 'p:q.finished');
    on(pm.done0, 'p:q.crank'); on(pm.done1, 'p:q.lever'); on(pm.done2, 'p:q.sails');
    on(P.stoneAsked, 'p:stone.demo'); on(P.stoneTold, 'p:q.stone'); on(P.wheelAsked, 'p:wheel.demo'); on(P.wheelDone, 'p:q.wheel', 'p:master.oil'); on(P.marblesAsked, 'p:marbles.demo');
    on(F.met, 'f:trigo.demo1', 'f:trigo.demo2', 'f:trigo.wake', 'f:trigo.seal'); on(F.open, 'f:trigo.open'); on(F.warned, 'f:warn'); on(F.woke && F.woke.tomas, 'f:tomas.awake');
    on(fm.seen0, 'f:room1', 'f:tube.seal'); on(fm.seen1, 'f:tube.oil'); on(fm.seen2, 'f:tube.turn');
    for (const k of keys) for (const id of BYKEY[k] || []) { try { if (LEX.item(id)) LEX.expose(id); } catch (e) { /* */ } }
  }
  const seenWord = id => { try { return typeof LEX !== 'undefined' && !!LEX.item(id) && LEX.seen(id); } catch (e) { return false; } };
  // a word as the journal and a Look show it: es / pt / de with its article, zh / ja in the mode's text (the notation for CJK.html)
  function wordShown(id, l = lang()) {
    if (typeof LEX === 'undefined' || !LEX.item(id)) return '';
    const it = LEX.item(id);
    if (isCl(l)) return it[l] || '';
    try { return LEX.form(id, { article: true }) || it[l] || ''; } catch (e) { return it[l] || ''; }
  }
  function wordsHTML() {
    if (!wordsOk) registerWords();
    css();
    const l = lang(), cj = isCl(l) && typeof CJK !== 'undefined';
    const row = w => { const it = typeof LEX !== 'undefined' && LEX.item(w.id); if (!it || !it[l]) return ''; const ok = seenWord(w.id), t = wordShown(w.id, l);
      return `<li class="${ok ? '' : 'no'}">${ok ? '✓ ' : ''}<b>${cj ? CJK.html(t, { lang: l, cap: false }) : esc(t)}</b> <span class="en">${esc(it.enFull || it.en || '')}</span></li>`; };
    const n = list => list.filter(w => seenWord(w.id)).length;
    const part = (k, title, note) => (WORDS[k].length ? `<h5>${title} <small>${n(WORDS[k])} / ${WORDS[k].length}</small></h5><p class="note">${note}</p><ul class="ml-words">${WORDS[k].map(row).join('')}</ul>` : '');
    const all = WORDS.past.concat(WORDS.future);
    return `<div class="mt"><h4 class="ph-h">Molinar words <small>${n(all)} / ${all.length}</small></h4><p class="note">Every word Molinar’s other worlds teach: in what people say, in their demonstrations, and in the things you can look at (✓ once you’ve met it). Mimo keeps them for review.</p>`
      + part('past', 'Molinar, long ago', 'The Great Mill being built, the old market, the first cart, the clock shop, the miller’s family’s kitchen.')
      + part('future', 'Molinar, tomorrow', 'The stopped sails, the gray flour, the empty market, what’s left, and the plans that wake the town.') + '</div>';
  }
  function addTab() {
    if (typeof UI === 'undefined') return;
    UI.journalTabs = UI.journalTabs || [];
    if (UI.journalTabs.some(t => t.id === 'ml-words')) return;
    UI.journalTabs.push({ id: 'ml-words', label: () => (G() && G().state && TIME.open('molinar') && TIME.seen('molinar.noa') ? 'Molinar words' : null), html: () => wordsHTML(), wire() { /* */ } });
  }

  // ------------------------------------------------------------ saying things (mixed by the weave; a demonstration shows the
  // marked words glossed, whole in the language; the hushed keep only their *starred* words). Each teaches its words (above).
  function say(p, T) { if (!p || !T) return Promise.resolve(); teach(T); const l = lang(); p.lines = { en: fillEn(enOf(T, l), l), [l]: fillMimo(T[l] || '', l) }; return STORY.sayInline(p); }
  function demo(p, T, marks) {
    if (!p || !T) return Promise.resolve();
    teach(T);
    const l = lang(), T2 = { en: fillEn(enOf(T, l), l) }; LANGS.forEach(x => { T2[x] = fillMimo(T[x] || '', x); });
    return STORY.demoLine(p, T2, marks);
  }
  function hushed(p, T) { if (!p || !T) return Promise.resolve(); teach(T); const l = lang(); return STORY.sayHushed ? STORY.sayHushed(p, fillMimo(T[l] || '', l), fillEn(T.en, l)) : say(p, T); }
  // a thing to Look at (MPTXT.LOOKS / MFTXT.LOOKS: { id: its word, t: what it is, in English with {w.ml_*} slots }): the word in the
  // language, said aloud and glossed, then what it is
  function look(T, dur = 6.5) {
    if (!T) return;
    const t = typeof T.t === 'function' ? T.t() : T.t;
    teach(T, t);
    const l = lang(), id = T.id, w = id ? wordShown(id, l) : '', it = id && typeof LEX !== 'undefined' && LEX.item(id);
    const shown = !w || !isCl(l) ? w : (() => { try { return CJK.plain(w, { lang: l, cap: false }); } catch (e) { return plainT(w); } })();     // (a word: no capital)
    STORY.think(fillEn((w && it ? `«${shown}» (${it.en}). ` : '') + (t || '')), dur);
    if (w) { try { UI.speak(UI.sayText(w)); } catch (e) { /* (no voice on this computer) */ } }
  }
  const think = (s, d) => STORY.think(fillEn(s), d);
  const you = s => STORY.you(fillEn(s));
  // a two-shot from your side (time_alba.js's way)
  function frame2(p, side = 1, dist = 4.4) {
    const Y = G().sim.you, dx = p.x - Y.x, dz = p.z - Y.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, y = p.y != null ? p.y : gy(p.x, p.z);
    shot(V((p.x + Y.x) / 2 - ux * dist * 0.55 + uz * side * 2.2, y + 2.4, (p.z + Y.z) / 2 - uz * dist * 0.55 - ux * side * 2.2), V((p.x + Y.x) / 2, y + 1.25, (p.z + Y.z) / 2));
  }

  // ------------------------------------------------------------ the pattern cards (the grammar point, shown once, then in the journal's way)
  function css() {
    if (document.getElementById('molt-css')) return;
    const s = document.createElement('style'); s.id = 'molt-css';
    s.textContent = `.card.mol-card .ex { display: grid; grid-template-columns: auto auto; gap: 4px 14px; justify-content: center; margin: 10px 0 6px; font-size: 18px; }
.card.mol-card .ex b { color: #b05a1e; } .card.mol-card.fut .ex b, .card.mol-card.fut .tag { color: #6a4fc0; }
.card.mol-card .note { max-width: 440px; margin: 6px auto 0; font-size: 14px; line-height: 1.45; } .card.mol-card .tag { color: #b05a1e; }
.card.mol-card .rows { text-align: left; max-width: 440px; margin: 8px auto 0; font-size: 14px; line-height: 1.5; }
.ml-words { columns: 2; column-gap: 18px; font-size: 13px; line-height: 1.5; margin: 6px 0 10px; } .ml-words li { break-inside: avoid; } .ml-words .no { opacity: .45; }`;
    document.head.appendChild(s);
  }
  async function card(C, fut) {
    css();
    const l = lang(), c = C && C[l]; if (!c) return;
    const ex = (c.ex || []).map(([w, e]) => `<b>${isCl(l) && typeof CJK !== 'undefined' ? CJK.html(w, { lang: l, ruby: 'always' }) : esc(w)}</b><span>${esc(e)}</span>`).join('');
    await UI.card(`<div class="tag">${esc(fillEn(C.tag, l))}</div>${ex ? `<div class="ex">${ex}</div>` : ''}<div class="note">${esc(fillEn(c.note, l))}</div><div class="sub">E</div>`, { kind: 'mol-card' + (fut ? ' fut' : '') });
  }

  // ------------------------------------------------------------ grading what you say (S–D: one letter down per miss; "I don't
  // know", the whole sentence on «?», counts as two). T: want (the right form: S; an A with an accent missing or none of `more`),
  // alt (right, a little off: A), aux (de: haben / sein: B), person (the right time, someone else: B), past (yesterday, in the
  // Future), pres (now): not ok, with a tip. Items: a string as a word (zh / ja: CJK.contains), a list: all of them.
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const fold = (s, lg) => { let t = nrm(s); if (lg === 'de') t = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'); return t; };
  const words = (s, lg) => ' ' + fold(s, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const hasCJ = (text, src, l) => {
    if (typeof CJK === 'undefined') return false;
    try { const ch = CJK.chars(src, { lang: l }).replace(/\s+/g, ''); if (/[぀-ヿ一-鿿]/.test(ch) && String(text || '').replace(/\s+/g, '').includes(ch)) return true; } catch (e) { /* */ }
    try { return !!CJK.contains(text, src, l); } catch (e) { return false; }
  };
  function has(text, item, lg) {
    if (Array.isArray(item)) return item.every(x => has(text, x, lg));
    if (isCl(lg)) return hasCJ(text, item, lg);
    return words(text, lg).includes(' ' + fold(item, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ');
  }
  // the item typed with its accents (es / pt / de)
  const accented = (text, item, lg) => { if (isCl(lg) || Array.isArray(item)) return true; const t = ' ' + String(text).toLowerCase().replace(/[¡!¿?.,;:«»"“”()]/g, ' ').replace(/\s+/g, ' ') + ' '; return t.includes(' ' + String(item).toLowerCase() + ' '); };
  const showForm = x => (Array.isArray(x) ? x.join(' … ') : x);
  // the item as typed, accents and all (es / pt / de; zh / ja: has)
  const exact = (text, item, lg) => (isCl(lg) ? has(text, item, lg) : Array.isArray(item) ? item.every(x => exact(text, x, lg)) : accented(text, item, lg));
  function grade(T, text, lg, TIPS = {}) {
    const model = plainT(fillMimo((T.model || {})[lg] || '', lg)).replace(/\s*[.。]\s*$/, '');
    const tip = k => String((((T.tips || {})[k] || TIPS[k] || {})[lg]) || '').replace('{form}', model);
    const first = (key, fn = has) => ((T[key] || {})[lg] || []).find(x => fn(text, x, lg));
    // the right form: an accent missing costs nothing (P6a, accents.js; tip: the accented form), unless what you typed is, as typed,
    // another form the task tells apart («empujo», I push, for «empujó», he pushed: then the A stays, and why says why)
    const w = first('want');
    if (w) {
      const mo = !((T.more || {})[lg] || []).length || T.more[lg].some(x => has(text, x, lg));
      const others = ['alt', 'aux', 'person', 'past', 'pres', 'aspect', 'fut', 'other'].flatMap(k => ((T[k] || {})[lg] || []).flat());
      const ac = typeof ACCENTS !== 'undefined' ? ACCENTS.judge(text, w, lg, { others }) : { keep: !accented(text, w, lg), why: `Accent: «${plainT(showForm(w))}»`, tip: '' };
      return { ok: true, letter: !ac.keep && mo ? 'S' : 'A', kind: 'right', why: ac.keep ? ac.why : !mo ? tip('more') || `Right! The whole sentence for an S: «${model}»` : 'Just right!', tip: ac.tip || '' };
    }
    const a = first('alt'); if (a) return { ok: true, letter: 'A', kind: 'alt', why: tip('alt') || 'Right!' };
    const x = first('aux'); if (x) return { ok: true, letter: 'B', kind: 'aux', why: tip('aux') || `«${model}»` };
    // the wrong person or time: the exact spelling first («trabajo», I work, is now, not «trabajó» without its accent)
    for (const fn of [exact, has]) {
      const p = first('person', fn); if (p) return { ok: true, letter: 'B', kind: 'person', why: tip('person') || `«${model}»` };
      const pa = first('past', fn); if (pa) return { ok: false, kind: 'past', why: tip('past') };
      const pr = first('pres', fn); if (pr) return { ok: false, kind: 'pres', why: tip('pres') };
    }
    return { ok: false, kind: 'none' };
  }
  // one task, asked until it's said (or you close the box): the frame and the chips on the box, the model on «?»
  // o: { icon, tips, title, hint, onMiss(g, misses) }
  async function ask(T, o = {}) {
    const lg = lang(), tips = o.tips || {};
    const frame = plainT(fillMimo((T.frame || {})[lg] || '', lg)), chips = ((T.chips || {})[lg] || []).map(([w, e]) => `${plainT(fillMimo(w, lg))} (${e})`).join(' · ');
    const modelRaw = fillMimo((T.model || {})[lg] || '', lg), model = plainT(modelRaw);
    let misses = 0;
    for (;;) {
      const r = await UI.command({ name: mimoName(), icon: o.icon || 'star', title: fillEn(o.title || T.title, lg), verbs: [], model: modelRaw, modelEn: fillEn((T.model || {}).en || '', lg), placeholder: `«${frame}»`,
        hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}. ${o.hint ? o.hint + ' ' : ''}Stuck? ? shows the whole sentence.` });
      if (!r || r.cancelled) return null;
      const h = document.getElementById('command-hint'), peeked = !!(h && /^Try/.test(h.textContent || ''));
      const g = grade(T, r.text, lg, tips);
      if (g.ok) {
        const letter = down(g.letter, misses + (peeked ? 2 : 0)), why = g.why === 'Just right!' && (misses || peeked) ? (peeked ? 'Right, with the example' : 'Right, on another try') : g.why;
        UI.toast(`${letter} · ${why}${g.tip ? ' · ' + g.tip : ''}`); snd(letter === 'S' ? 'chest' : 'review');
        return { letter, text: r.text, ms: r.ms, kind: g.kind };
      }
      misses++; snd('wrong'); try { G().sim.mimo.tiltT = 1.4; } catch (e) { /* */ }
      if (o.onMiss) { try { await o.onMiss(g, misses); } catch (e) { /* */ } }
      think(g.kind !== 'none' && g.why ? g.why : misses >= 2 ? `Like this: «${model}»` : `Not quite… «${frame}»${chips ? ' · ' + chips : ''}`, 6.5);
    }
  }
  // Mimo's moves, told in the world's time: a memory (the Past: PTXT.PV's forms) or a plan (the Future: MFTXT.FV's)
  const EN_V = { 'v.push': ['pushed', 'will push'], 'v.climb': ['climbed', 'will climb'], 'v.jump': ['jumped', 'will jump'], 'v.blow': ['blew', 'will blow'] };
  const PRES_BLOW = { es: ['sopla', 'soplar', 'soplo'], pt: ['sopra', 'soprar'], de: ['pustet', 'puste', 'pusten', 'bläst'], zh: ['[吹|chuī]'], ja: ['[吹|ふ]いて', '[吹|ふ]く'] };
  const presOf = v => (v === 'v.blow' ? PRES_BLOW : (typeof MPTXT !== 'undefined' && MPTXT.MEM_PRES[v]) || {});
  const chipOf = (f, lg) => (Array.isArray(f) ? (lg === 'de' ? f[f.length - 1] : f.join(' ')) : f);
  function memTask(M) {
    const pv = (typeof PTXT !== 'undefined' && PTXT.PV[M.verb]) || {}, chips = {};
    LANGS.forEach(lg => { const f = (pv[lg] || [])[0]; if (f) chips[lg] = [[chipOf(f, lg), (EN_V[M.verb] || [''])[0]]]; });
    return { title: M.title, frame: M.frame, chips, model: M.model, more: M.more, want: { es: pv.es, pt: pv.pt, de: pv.de, zh: pv.zh, ja: pv.ja }, alt: { de: pv.de2 }, pres: presOf(M.verb),
      tips: { pres: { es: 'That’s now. In the Past, {mimo} only moves in memories: «{form}».', pt: 'That’s now. In the Past, {mimo} only moves in memories: «{form}».', de: 'That’s now. In the Past: «{form}».', zh: 'It already happened: 了 after the verb, «{form}».', ja: 'That’s now. In the Past: ～た, «{form}».' },
        alt: { de: 'Right! In speech Germans would say «{form}».' } } };
  }
  function planTask(M) {
    const fv = (typeof MFTXT !== 'undefined' && MFTXT.FV[M.verb]) || {}, pv = (typeof PTXT !== 'undefined' && PTXT.PV[M.verb]) || {}, chips = {};
    LANGS.forEach(lg => { const f = (fv[lg] || [])[0]; if (f) chips[lg] = [[lg === 'de' ? f[f.length - 1] : chipOf(f, lg), (EN_V[M.verb] || ['', ''])[1]]]; });
    return { title: M.title, frame: M.frame, chips, model: M.model, more: M.more, want: { es: fv.es, pt: fv.pt, de: fv.de, zh: fv.zh, ja: fv.ja }, alt: fv.ir || {}, pres: presOf(M.verb),
      past: { es: pv.es, pt: pv.pt, de: pv.de, zh: pv.zh, ja: pv.ja },
      tips: { pres: { es: 'That’s today. Tomorrow needs a plan: «{form}».', pt: 'That’s today. Tomorrow needs a plan: «{form}».', de: 'That’s today. A plan: «{form}».', zh: 'That’s today: 会 / 要 before the verb, «{form}».', ja: 'That’s today: a plan, «{form}».' },
        past: { es: 'That’s yesterday! A plan: «{form}».', pt: 'That’s yesterday! A plan: «{form}».', de: 'That’s yesterday! A plan: «{form}».', zh: 'That’s yesterday (了)! A plan: «{form}».', ja: 'That’s yesterday (～た)! A plan: «{form}».' },
        alt: { es: '«ir a» works too! Tomorrow’s own words: «{form}».', pt: '«ir» + the verb works too! The futuro do presente: «{form}».' } } };
  }

  // ------------------------------------------------------------ the people TIME builds (TIME.people), by world and id
  function person(w, id) {
    const list = TIME.people && TIME.people.all['molinar:' + w]; if (!list) return null;
    const P = list.find(q => q.def.id === id); if (!P) return null;
    P.api.name = nameOf(P.def.name); return P;
  }
  const who = (w, id) => { const P = person(w, id); return P ? P.api : null; };

  // ------------------------------------------------------------ Noa, through the west gate's crack (DESIGN.md 18.5)
  const TXT = {
    'noa.open1': L('Can you hear me? It’s Noa. I’m still inside the great clock… but every crack in time carries my voice.',
      '¿Me oyes? Soy Noa. Sigo dentro del gran reloj… pero cada grieta del tiempo lleva mi voz.',
      'Você me ouve? É a Noa. Eu ainda estou dentro do grande relógio… mas cada fenda do tempo leva a minha voz.',
      'Hörst du mich? Ich bin’s, Noa. Ich bin immer noch in der großen Uhr … aber jeder Zeitriss trägt meine Stimme.',
      '[你|nǐ] [听得见|tīng de jiàn] [我|wǒ] [吗|ma] ？ [我|wǒ] [是|shì] [诺娅|Nuò yà] 。 [我|wǒ] [还|hái] [在|zài] [大钟|dà zhōng] [里|lǐ] … [可是|kě shì] [每|měi] [一|yī] [道|dào] [时间|shí jiān] [裂缝|liè fèng] [都|dōu] [能|néng] [传|chuán] [来|lái] [我|wǒ] [的|de] [声音|shēng yīn] 。',
      '[聞|き]こえる ？ ノア だ よ 。 まだ [大時計|おおどけい] の [中|なか] に いる けど … [時|とき] の [裂|さ]け[目|め] は 、 ぜんぶ わたし の [声|こえ] を [運|はこ]んで くれる の 。'),
    'noa.open2': L('Two more of Elio’s echoes are here: one in Molinar long ago, one in Molinar tomorrow.',
      'Aquí hay dos ecos más de Elio: uno en el Molinar de antes, otro en el Molinar de mañana.',
      'Aqui tem mais dois ecos do Elio: um na Molinar de antigamente, outro na Molinar de amanhã.',
      'Hier sind noch zwei Echos von Elio: eins im Molinar von früher, eins im Molinar von morgen.',
      '[这里|zhè lǐ] [还有|hái yǒu] [艾利欧|Ài lì ōu] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] ： [一|yī] [个|gè] [在|zài] [从前|cóng qián] [的|de] [磨坊镇|Mò fáng zhèn] ， [一|yī] [个|gè] [在|zài] [明天|míng tiān] [的|de] [磨坊镇|Mò fáng zhèn] 。',
      'ここ に は 、 エリオ の こだま が あと [二|ふた]つ ある 。 [昔|むかし] の モリナール に [一|ひと]つ 、 [明日|あした] の モリナール に [一|ひと]つ 。'),
    'noa.open3': L('Long ago, a quiet boy came through here, alone and hungry. Step into the Past: the miller’s family at the Great Mill will remember him. Through the crack by the mill’s door, or this one.',
      'Hace mucho, un niño callado pasó por aquí, solo y con hambre. Entra en el Ayer: la familia del molinero, junto al Gran Molino, lo recordará. Por la grieta junto a la puerta del molino, o por esta.',
      'Há muito tempo, um menino calado passou por aqui, sozinho e com fome. Entra no Ontem: a família do moleiro, do lado do Grande Moinho, vai se lembrar dele. Pela fenda perto da porta do moinho, ou por esta.',
      'Vor langer Zeit kam ein stiller Junge hier vorbei, allein und hungrig. Geh ins Gestern: Die Familie des Müllers bei der Großen Mühle wird sich an ihn erinnern. Durch den Riss an der Mühlentür oder durch diesen hier.',
      '[很久|hěn jiǔ] [以前|yǐ qián] ， [一个|yī gè] [不|bù] [说话|shuō huà] [的|de] [男孩|nán hái] [经过|jīng guò] [这里|zhè lǐ] ， [又|yòu] [孤单|gū dān] [又|yòu] [饿|è] 。 [去|qù] [昨天|zuó tiān] [吧|ba] ： [大磨坊|Dà mò fáng] [旁边|páng biān] [磨坊主|mò fáng zhǔ] [一家|yī jiā] [会|huì] [记得|jì de] [他|tā] 。 [从|cóng] [磨坊|mò fáng] [门口|mén kǒu] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      'ずっと [昔|むかし] 、 [無口|むくち] な [男|おとこ] の [子|こ] が 、 [一人|ひとり] で おなか を すかせて ここ を [通|とお]った の 。 [昨日|きのう] へ [行|い]って 。 [大風車|だいふうしゃ] の そば の [粉屋|こなや] さん [一家|いっか] が 、 [覚|おぼ]えて いる はず 。 [風車|ふうしゃ] の ドア の そば の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から 。'),
    'noa.past1': L('That was his voice. A thank-you he never said… until now. Thank you, too.',
      'Esa era su voz. Un gracias que nunca dijo… hasta ahora. Gracias a ti también.',
      'Era a voz dele. Um obrigado que ele nunca disse… até agora. Obrigada a você também.',
      'Das war seine Stimme. Ein Danke, das er nie gesagt hat … bis jetzt. Danke auch dir.',
      '[那|nà] [是|shì] [他|tā] [的|de] [声音|shēng yīn] 。 [一|yī] [句|jù] [他|tā] [从来|cóng lái] [没|méi] [说|shuō] [出口|chū kǒu] [的|de] [谢谢|xiè xie] … [直到|zhí dào] [现在|xiàn zài] 。 [也|yě] [谢谢|xiè xie] [你|nǐ] 。',
      'あれ は かれ の [声|こえ] 。 [一度|いちど] も [言|い]えなかった 「 ありがとう 」 … やっと [言|い]えた ね 。 あなた に も 、 ありがとう 。'),
    'noa.past2': L('Now tomorrow. In the Future, Molinar’s sails have stopped and everyone has gone gray. Someone there is still talking, by the Great Mill. Go through the crack in the market square, or this one.',
      'Ahora, el mañana. En el Mañana, las aspas de Molinar se pararon y todos se volvieron grises. Alguien sigue hablando allí, junto al Gran Molino. Entra por la grieta de la plaza del mercado, o por esta.',
      'Agora, o amanhã. No Amanhã, as pás de Molinar pararam e todo mundo ficou cinza. Alguém ainda fala lá, do lado do Grande Moinho. Entra pela fenda da praça do mercado, ou por esta.',
      'Jetzt das Morgen. Im Morgen stehen Molinars Flügel still, und alle sind grau geworden. Jemand redet dort noch, bei der Großen Mühle. Geh durch den Riss auf dem Marktplatz oder durch diesen hier.',
      '[现在|xiàn zài] [去|qù] [明天|míng tiān] 。 [在|zài] [明天|míng tiān] ， [磨坊镇|Mò fáng zhèn] [的|de] [风帆|fēng fān] [停|tíng] [了|le] ， [大家|dà jiā] [都|dōu] [变|biàn] [灰|huī] [了|le] 。 [大磨坊|Dà mò fáng] [旁边|páng biān] [还有|hái yǒu] [人|rén] [在|zài] [说话|shuō huà] 。 [走|zǒu] [市场|shì chǎng] [上|shàng] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[次|つぎ] は [明日|あした] 。 [明日|あした] の モリナール で は 、 [羽根|はね] が [止|と]まって 、 みんな [灰色|はいいろ] に なって いる 。 でも 、 [大風車|だいふうしゃ] の そば で 、 まだ [話|はな]して いる [人|ひと] が いる 。 [市場|いちば] の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から [行|い]って 。'),
    'noa.fut1': L('He’ll come back and say it out loud. I believe him… and I believe you.',
      'Volverá y lo dirá en voz alta. Le creo… y te creo a ti.',
      'Ele vai voltar e vai dizer em voz alta. Eu acredito nele… e acredito em você.',
      'Er wird zurückkommen und es laut sagen. Ich glaube ihm … und ich glaube dir.',
      '[他|tā] [会|huì] [回来|huí lai] ， [会|huì] [大声|dà shēng] [说|shuō] [出来|chū lai] 。 [我|wǒ] [相信|xiāng xìn] [他|tā] … [也|yě] [相信|xiāng xìn] [你|nǐ] 。',
      'かれ は きっと [戻|もど]って きて 、 [大|おお]きな [声|こえ] で [言|い]う よ 。 わたし は [信|しん]じる … あなた の こと も 。'),
    'noa.fut2': L('That’s both of Molinar’s echoes. The next cracks will open by the lake, west of Alba… I’ll call you when they do.',
      'Ya tienes los dos ecos de Molinar. Las próximas grietas se abrirán junto al lago, al oeste de Alba… Te llamaré cuando se abran.',
      'Você já tem os dois ecos de Molinar. As próximas fendas vão se abrir perto do lago, a oeste de Alba… Eu te chamo quando abrirem.',
      'Das sind beide Echos von Molinar. Die nächsten Risse öffnen sich am See, westlich von Alba … Ich rufe dich, wenn es so weit ist.',
      '[磨坊镇|Mò fáng zhèn] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] [都|dōu] [找到|zhǎo dào] [了|le] 。 [下|xià] [一|yī] [道|dào] [裂缝|liè fèng] [会|huì] [在|zài] [阿尔巴|Ā ěr bā] [西边|xī biān] [的|de] [湖|hú] [边|biān] [打开|dǎ kāi] … [到|dào] [时候|shí hou] [我|wǒ] [会|huì] [叫|jiào] [你|nǐ] 。',
      'これ で モリナール の こだま は [二|ふた]つ と も そろった 。 [次|つぎ] の [裂|さ]け[目|め] は 、 アルバ の [西|にし] の [湖|みずうみ] の そば で [開|ひら]く … その とき は [呼|よ]ぶ ね 。'),
  };
  // Elio's echoes here (CH4.word): the Past's, the thanks he never said; the Future's, what the man would still like to say
  const ECHO = {
    past: L('Thank you for the soup and the bread. That autumn, here, I wasn’t hungry.', 'Gracias por la sopa y el pan. Aquel otoño, aquí no pasé hambre.',
      'Obrigado pela sopa e pelo pão. Naquele outono, aqui eu não passei fome.', 'Danke für die Suppe und das Brot. In jenem Herbst habe ich hier nicht gehungert.',
      '[谢谢|xiè xie] [你们|nǐ men] [的|de] [汤|tāng] [和|hé] [面包|miàn bāo] 。 [那|nà] [年|nián] [秋天|qiū tiān] ， [我|wǒ] [在|zài] [这里|zhè lǐ] [没有|méi yǒu] [挨饿|ái è] 。',
      'スープ と パン 、 ありがとう ございました 。 あの [秋|あき] 、 ここ で は おなか が すきません でした 。', { where: 'Molinar, long ago' }),
    future: L('I’ll come back to Molinar, and this time I’ll say thank you out loud.', 'Volveré a Molinar, y esta vez daré las gracias en voz alta.',
      'Voltarei a Molinar, e desta vez agradecerei em voz alta.', 'Ich werde nach Molinar zurückkommen, und diesmal werde ich laut Danke sagen.',
      '[我|wǒ] [会|huì] [回到|huí dào] [磨坊镇|Mò fáng zhèn] ， [这|zhè] [一|yī] [次|cì] [我|wǒ] [会|huì] [大声|dà shēng] [说|shuō] [谢谢|xiè xie] 。',
      'また モリナール に [来|き]ます 。 [今度|こんど] は 、 [大|おお]きな [声|こえ] で 「 ありがとう 」 と [言|い]う つもり です 。', { where: 'Molinar, tomorrow' }),
  };
  if (typeof CH4 !== 'undefined') { CH4.word('molinar', 'past', ECHO.past); CH4.word('molinar', 'future', ECHO.future); }

  // Noa's voice comes out of the crack: it flares while she talks (its glow swells), and her name tag is hers
  let flare = 0;
  function noaP() { const c = CRACK.gate, y = gy(c.x, c.z); return { id: 'noa', name: nameOf(NOA), x: c.x, y: y + 0.3, z: c.z, top: 2.5, talking: false }; }
  async function noaSay(key) { flare = 1; snd('chime'); const p = noaP(); try { G().w3d.fx.sparkle(p.x, p.y + 1.4, p.z, 12, ['#bfe4ff', '#fff3c8', '#ffd7a0']); } catch (e) { /* */ } await say(p, TXT[key]); }
  function lookGate() { const c = CRACK.gate, y = gy(c.x, c.z), Y = G().sim.you, dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1; shot(V(c.x + dx / d * 5.2 + dz / d * 2.4, y + 2.4, c.z + dz / d * 5.2 - dx / d * 2.4), V(c.x, y + 1.5, c.z), 1.0); }
  // the crack card's examples, each language's own: I did, did you?, we will
  const CRACK_EX = { es: ['preparé', '¿preparaste?', 'moleremos'], pt: ['preparei', 'você preparou?', 'moeremos'], de: ['ich habe gekocht', 'hast du gekocht?', 'wir werden mahlen'],
    zh: ['[我|wǒ] [做|zuò] [了|le]', '[你|nǐ] [做|zuò] [了|le] [吗|ma] ？', '[我们|wǒ men] [会|huì] [磨|mó]'], ja: ['[作|つく]りました', '[作|つく]りました か ？', '[挽|ひ]く つもり です'] };
  async function crackCard() {
    css();
    const l = lang(), nm = w => { const t = TIME.RULES[w].name[l] || TIME.RULES[w].name.en; return isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t); };
    const ex = (CRACK_EX[l] || CRACK_EX.es).map(t => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t)));
    await UI.card(`<div class="tag">Molinar’s time cracks</div><div class="rows">`
      + `• By the <b>Great Mill’s door</b>: today ↔ «${nm('past')}», Molinar about 40 years ago, the Great Mill being built.<br>`
      + `• In the <b>market square</b>: today ↔ «${nm('future')}», Molinar if nobody speaks up.<br>`
      + `• Here, by the <b>west gate</b>: all three. Noa’s voice comes through this one: report to her here.<br>`
      + `In the Past, people will ask what <b>you</b> did, and you answer about yourself («${ex[0]}», «${ex[1]}»). In the Future, you promise what everyone <b>will</b> do («${ex[2]}»).</div><div class="sub">E</div>`, { kind: 'mol-card' });
  }
  async function noaOpen() {
    lock(true);
    try {
      lookGate(); await wait(0.9);
      await noaSay('noa.open1'); await noaSay('noa.open2'); await noaSay('noa.open3');
      flare = 0; await crackCard();
      TIME.seen('molinar.noa', true); G().save();
    } finally { flare = 0; lock(false); }
    think('Into the Past, to the miller’s family at the Great Mill. The crack by the mill’s door leads there, and so does this one.', 6);
  }
  async function reportPast() {
    lock(true);
    try { lookGate(); await wait(0.6); await noaSay('noa.past1'); await noaSay('noa.past2'); st('past').reported = true; G().save(); } finally { flare = 0; lock(false); }
    think('Next: Molinar tomorrow. The crack in the market square leads there.', 5);
  }
  async function reportFuture() {
    lock(true);
    try {
      lookGate(); await wait(0.6); await noaSay('noa.fut1'); await noaSay('noa.fut2'); st('future').reported = true;
      try { if (typeof QUESTS !== 'undefined' && QUESTS.tick) QUESTS.tick(); } catch (e) { /* */ }
      G().save();
    } finally { flare = 0; lock(false); }
  }

  // ------------------------------------------------------------ the region: TIME dresses both worlds (molinar_past.js fills DRESS.past,
  // molinar_future.js DRESS.future); while you're inside a world's dungeon the dungeon does its own look, so `look` steps aside
  const DRESS = {
    past: { edge: 'The memory ends here… Molinar of long ago is only this town. Let’s stay where it happened.' },
    future: { edge: 'Past the town, tomorrow’s gray fog is too thick to see. Let’s turn back.', k: () => 0.12 },
  };
  Object.defineProperty(DRESS.past, 'look', { get: () => (typeof MPMILL !== 'undefined' && MPMILL.inside ? null : 'past'), enumerable: true, configurable: true });
  Object.defineProperty(DRESS.future, 'look', { get: () => (typeof MFMILL !== 'undefined' && MFMILL.inside ? null : 'future'), enumerable: true, configurable: true });
  Object.assign(TIME.STEPS, { pret12: 'the preterite, I and you (preparé, ¿preparaste?, subí, ¿subiste?)', futall: 'the future in every person (moleré, molerás, molerá, moleremos, molerán)' });
  const songOf = w => () => {
    if (w === 'past') return typeof MOL_PAST !== 'undefined' && MOL_PAST.song ? MOL_PAST.song() : 'mol_past';
    return typeof MOL_FUT !== 'undefined' && MOL_FUT.song ? MOL_FUT.song() : 'mol_future';
  };
  TIME.region('molinar', {
    name: { now: 'Molinar', past: 'Molinar, long ago', future: 'Molinar · tomorrow' },
    color: { past: '#c98a3a', future: '#6f6b84' },
    center: CEN, radius: RAD,
    open: () => (typeof CH4 !== 'undefined' ? CH4.open('molinar') : false),
    grammar: { past: ['pret12'], future: ['futall'] },
    songs: { past: songOf('past'), future: songOf('future') },
    dress: DRESS,
    init: api => init(api),
    tick: (api, dt) => tick(dt),
    changed: (api, fw, tw) => { for (const M of [typeof MOL_PAST !== 'undefined' && MOL_PAST, typeof MOL_FUT !== 'undefined' && MOL_FUT]) if (M && M.changed) { try { M.changed(fw, tw); } catch (e) { console.error('[molinar] changed', e); } } },
  });
  TIME.crack('molinar.mill', { region: 'molinar', x: CRACK.mill.x, z: CRACK.mill.z, worlds: ['now', 'past'] });
  TIME.crack('molinar.market', { region: 'molinar', x: CRACK.market.x, z: CRACK.market.z, worlds: ['now', 'future'] });
  TIME.crack('molinar.gate', { region: 'molinar', x: CRACK.gate.x, z: CRACK.gate.z, worlds: ['now', 'past', 'future'] });

  function init(api) {
    try { registerWords(); } catch (e) { console.error('[molinar] words', e); }
    try { addTab(); } catch (e) { console.error('[molinar] journal', e); }
    for (const [M, tag] of [[typeof MOL_PAST !== 'undefined' && MOL_PAST, 'past'], [typeof MOL_FUT !== 'undefined' && MOL_FUT, 'future'],
      [typeof MPMILL !== 'undefined' && MPMILL, 'past mill'], [typeof MFMILL !== 'undefined' && MFMILL, 'future mill'], [typeof MOLBOSS !== 'undefined' && MOLBOSS, 'bosses']])
      if (M && M.init) { try { M.init(api.G, api); } catch (e) { console.error('[molinar] init ' + tag, e); } }
  }

  // ------------------------------------------------------------ every frame, in any world: Noa (her first words here, the reports)
  let idle = 0;
  const busyNow = g => STORY.busy || STORY.line || g.sim.lock || g.journalOpen || g.state.teaching || TIME.busy
    || document.body.classList.contains('in-battle') || document.body.classList.contains('on-title') || (g.indoorMod && g.indoorMod() && g.indoorMod() !== TIME);
  function tick(dt) {
    const g = G(); if (!g || !g.state) return;
    if (caughtFor !== g.state) { try { catchUp(); } catch (e) { console.error('[molinar] words catch-up', e); } }
    // the crack flares while she talks
    flare = Math.max(0, flare - dt * 0.35);
    const M = TIME._.VIS && TIME._.VIS['molinar.gate']; if (M && M.glow) { const k = 1 + flare * 0.9; M.glow.scale.set(3.4 * k, 4.2 * k, 1); }
    if (!TIME.open('molinar') || busyNow(g)) { idle = 0; return; }
    const w = TIME.world(), Y = g.sim.you, c = CRACK.gate, d = Math.hypot(Y.x - c.x, Y.z - c.z), s = g.state;
    const P = sp(s), F = sf(s);
    let run = null;
    if (w === 'now' && !TIME.seen('molinar.noa') && d < 7) run = noaOpen;
    else if (d < 3.4 && (w === 'now' || TIME.regionNow() === 'molinar')) {
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
    const c = want === 'past' ? (w === 'future' ? C['molinar.gate'] : C['molinar.mill'])
      : want === 'future' ? (w === 'past' ? C['molinar.gate'] : C['molinar.market'])
      : (w === 'past' ? C['molinar.mill'] : C['molinar.market']);
    const nm = { past: 'the Past', future: 'the Future', now: 'today' }[want];
    return c ? { x: c.x, z: c.z, hint: `{mimo} looks at the time crack: ${nm} is through there.` } : null;
  }
  const gateT = () => ({ x: CRACK.gate.x, z: CRACK.gate.z, hint: '{mimo} looks at the time crack by Molinar’s west gate. Noa’s voice is in it.' });
  // examples inside English text (steps, quests, hints): each language's own, zh / ja in the mode's text
  const SX = {
    did: { es: ['trabajé', 'subí'], pt: ['trabalhei', 'subi'], de: ['ich habe gearbeitet', 'ich bin gestiegen'], zh: ['[我|wǒ] [干活|gàn huó] [了|le]', '[我|wǒ] [爬|pá] [了|le]'], ja: ['[働|はたら]きました', '[登|のぼ]りました'] },
    mem: { es: ['{mimo} empujó la piedra'], pt: ['O {mimo} empurrou a pedra'], de: ['{mimo} hat den Stein geschoben'], zh: ['{mimo} [推|tuī] [了|le] [石头|shí tou]'], ja: ['{mimo} が [石|いし] を [押|お]した'] },
    found: { es: ['Encontré…'], pt: ['Encontrei…'], de: ['Ich habe … gefunden'], zh: ['[我|wǒ] [找到|zhǎo dào] [了|le] …'], ja: ['… [見|み]つけた'] },
    wake: { es: ['llevaremos', 'venderás', 'comprarán', 'sonará'], pt: ['levaremos', 'venderá', 'comprarão', 'tocará'], de: ['werden wir … bringen', 'wirst du … verkaufen', 'werden die Kinder … kaufen', 'wird deine Uhr … schlagen'],
      zh: ['[我们|wǒ men] [会|huì] [送|sòng]', '[你|nǐ] [会|huì] [卖|mài]', '[孩子|hái zi] [们|men] [会|huì] [买|mǎi]', '[钟|zhōng] [会|huì] [响|xiǎng]'], ja: ['[運|はこ]ぶ つもり です', '[売|う]ります', '[買|か]う でしょう', '[鳴|な]る でしょう'] },
    plan: { es: ['{mimo} soplará'], pt: ['O {mimo} soprará'], de: ['{mimo} wird pusten'], zh: ['{mimo} [会|huì] [吹|chuī]'], ja: ['{mimo} が [吹|ふ]く つもり'] },
    market: { es: ['Tomás traerá…', 'cantaremos'], pt: ['O Tomás levará…', 'cantaremos'], de: ['Tomás wird … mitbringen', 'wir werden singen'], zh: ['[托马斯|Tuō mǎ sī] [会|huì] [带|dài] …', '[我们|wǒ men] [会|huì] [唱歌|chàng gē]'], ja: ['トマス さん は … [持|も]って くる でしょう', '[歌|うた]う つもり です'] },
  };
  // «a», «b» (labels: «a» (we), «b» (you)…)
  function sx(k, labels) {
    const l = lang(), a = (SX[k] || {})[l] || (SX[k] || {}).es || [];
    return a.map((t, i) => { let s = fillMimo(t, l); if (isCl(l)) s = plainT(s); return `«${s}»` + (labels && labels[i] ? ` (${labels[i]})` : ''); }).join(', ');
  }
  const pastT = id => () => via('past', () => (typeof MOL_PAST !== 'undefined' ? MOL_PAST.target(id) : null));
  const futT = id => () => via('future', () => (typeof MOL_FUT !== 'undefined' ? MOL_FUT.target(id) : null));
  // (_tt: TIME_ALBA._.t.setup marks the main quest's earlier steps done for tests; these keep their own)
  const PSTEPS = [
    { _tt: true, text: 'Molinar: listen to Noa at the time crack by the west gate',
      why: 'Since Alba’s two echoes came home, something shimmers by Molinar’s west gate. Noa’s voice is in it.',
      done: s => seenIn(s, 'molinar.noa'), target: gateT, hint: '{mimo} sniffs the air by Molinar’s west gate. A shimmer?' },
    { _tt: true, get text() { return fillEn('In the Past: find the miller’s family at the Great Mill'); },
      get why() { return fillEn('About 40 years ago, a quiet boy came through Molinar, alone and hungry. The miller’s family fed him. Find them by the Great Mill, which is still being built. Through the crack by the mill’s door, or the one by the west gate.'); },
      done: s => !!sp(s).met, target: pastT('wife'), hint: '{mimo} points at a woman with a basket of bread, by the Great Mill.' },
    { _tt: true, get text() { return fillEn('Answer {builder}, the head builder, to help build the mill ({n}/2)'); }, n: s => Math.min(2, sp(s).asked || 0),
      get why() { return fillEn(`The builders can’t finish the Great Mill: a young armadillo rolls around at the top. {builder} needs hands, but first she asks what you did. Answer about yourself: ${sx('did')}.`); },
      done: s => !!sp(s).joined, target: pastT('builder'), hint: '{mimo} points at the head builder, by the plans table.' },
    { _tt: true, text: 'The Great Mill, being built: finish its floors and write them in the log ({n}/3)', n: s => Math.min(3, sp(s).floors || 0),
      get why() { return fillEn(`Inside, {mimo} moves only in memories: tell it what it did (${sx('mem')}). On every floor, write in the builders’ log what you did.`); },
      done: s => (sp(s).floors || 0) >= 3, target: pastT('door'), hint: '{mimo} looks at the Great Mill’s door. The way up is inside.' },
    { _tt: true, text: 'At the top of the mill: calm the first armadillo and free Elio’s echo',
      why: 'The young armadillo rolls around where the bell will hang. It found something shiny… something that hums like a voice.',
      done: s => echoIn(s, 'past'), target: pastT('door'), hint: '{mimo} looks up at the Great Mill. The armadillo is at the very top.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack by the west gate',
      why: 'Elio’s thank-you is free. Tell Noa: her voice comes through the crack by Molinar’s west gate, in any of the three times.',
      done: s => !!sp(s).reported, target: gateT, hint: '{mimo} looks at the time crack by the west gate.' },
  ];
  const FSTEPS = [
    { _tt: true, get text() { return fillEn('In the Future: find {trigo} by the silent Great Mill'); },
      get why() { return fillEn('In Molinar tomorrow the sails have stopped and everyone has gone gray. Someone is still talking by the Great Mill. Through the crack in the market square, or the one by the west gate.'); },
      done: s => !!sf(s).met, target: futT('trigo'), hint: '{mimo} points at someone by the Great Mill… the only one with any color.' },
    { _tt: true, text: 'Wake the people of tomorrow: promise each what they will do ({n}/4)', n: s => ['marga', 'tomas', 'lupe', 'ciro'].filter(k => sf(s).woke && sf(s).woke[k]).length,
      get why() { return fillEn(`They’re frozen until someone promises them a tomorrow. Promise in tomorrow’s words, and mind who: ${sx('wake', ['we', 'you', 'they', 'it'])}.`); },
      done: s => ['marga', 'tomas', 'lupe', 'ciro'].every(k => sf(s).woke && sf(s).woke[k]), target: () => via('future', () => (typeof MOL_FUT !== 'undefined' ? MOL_FUT.target('frozen') : null)), hint: '{mimo} tugs your sleeve toward someone gray.' },
    { _tt: true, text: 'The silent Great Mill: wake its floors ({n}/3)', n: s => Math.min(3, sf(s).floors || 0),
      get why() { return fillEn(`Gray Hush clogs the mill. Inside, {mimo} follows plans (${sx('plan')}), and the seals want promises.`); },
      done: s => (sf(s).floors || 0) >= 3, target: futT('door'), hint: '{mimo} looks at the Great Mill’s door. Its gray seal has cracked.' },
    { _tt: true, text: 'At the top: stop the Gray Miller with a promise, and free Elio’s echo',
      why: 'The Gray Miller grinds words into dust. Hits won’t stop him: promise what the town will do.',
      done: s => echoIn(s, 'future'), target: futT('door'), hint: '{mimo} looks up at the silent Great Mill.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack by the west gate',
      why: 'Both of Molinar’s echoes are free. Tell Noa, at the crack by the west gate.',
      done: s => !!sf(s).reported, target: gateT, hint: '{mimo} looks at the time crack by the west gate.' },
  ];
  if (typeof CH4 !== 'undefined') {
    CH4.steps('molinar', 'past', PSTEPS);
    CH4.steps('molinar', 'future', FSTEPS);
    CH4.story('molinar', [
      { when: s => seenIn(s, 'molinar.noa'), text: 'Noa’s voice came through the crack by Molinar’s west gate: two more of Elio’s echoes are here, one long ago, one tomorrow.' },
      { when: s => !!sp(s).met, text: 'Long ago, the miller’s family fed a quiet boy in a red cap. He ate everything, and never said a word.' },
      { when: s => echoIn(s, 'past'), text: 'At the top of the Great Mill, still being built, the first armadillo gave back what it had found: Elio’s thank-you.' },
      { when: s => !!sf(s).met, text: 'Tomorrow, Molinar has gone gray. Only Trigo still talks, every day, to the silent mill.' },
      { when: s => echoIn(s, 'future'), text: 'The Gray Miller stopped for a promise. Elio’s voice, tomorrow: he’ll come back and say thank you out loud.' },
    ]);
  }

  // ------------------------------------------------------------ every zh / ja string against CJK.md's rules: [] when all's well
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return ['no CJK'];
    const out = [], v = (s, l, where) => { if (!s || typeof s !== 'string') return; const p = CJK.validate(s.replace(/\*/g, '').replace(/\{[^}]+\}/g, l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ').replace(/___/g, l === 'zh' ? '[它|tā]' : 'それ'), l); if (p.length) out.push(`${where} (${l}): ${p.join('; ')} «${s}»`); };
    const each = (T, where) => { for (const l of ['zh', 'ja']) if (T && T[l]) [].concat(T[l]).forEach(x => (Array.isArray(x) ? x.forEach(y => (Array.isArray(y) ? y.forEach(z => v(z, l, where)) : v(y, l, where))) : v(x, l, where))); };
    const marks = (M, where) => { for (const [k, m] of Object.entries(M || {})) for (const l of ['zh', 'ja']) (m[l] || []).forEach(x => v(x[0], l, where + ' ' + k)); };
    const tasks = (Ts, where) => { for (const [k, T] of Object.entries(Ts || {})) { for (const f of ['frame', 'model', 'want', 'alt', 'aux', 'person', 'pres', 'past', 'more']) each(T[f], `${where} ${k} ${f}`); for (const l of ['zh', 'ja']) ((T.chips || {})[l] || []).forEach(c => v(c[0], l, `${where} ${k} chip`)); } };
    const cards = (Cs, where) => { for (const [k, C] of Object.entries(Cs || {})) for (const l of ['zh', 'ja']) ((C[l] && C[l].ex) || []).forEach(e => v(e[0], l, where + ' card ' + k)); };
    for (const [k, T] of Object.entries(TXT)) each(T, k);
    for (const [k, T] of Object.entries(ECHO)) each(T, 'echo ' + k);
    each(NOA, 'noa'); each(CRACK_EX, 'crack card'); for (const [k, T] of Object.entries(SX)) each(T, 'examples ' + k);
    for (const X of [typeof MPTXT !== 'undefined' && MPTXT, typeof MFTXT !== 'undefined' && MFTXT]) {
      if (!X) continue;
      const tag = X === MPTXT ? 'past' : 'future';
      for (const key of ['CAST', 'LINES', 'DEMO', 'FIGHT', 'NAMES', 'LOGQ']) for (const [k, T] of Object.entries(X[key] || {})) each(T, `${tag} ${key} ${k}`);
      for (const [k, T] of Object.entries(X.LOOKS || {})) if (T && T.w) each(T.w, `${tag} look ${k}`);
      marks(X.MARKS, tag + ' mark'); marks(X.LOGQ_MARKS, tag + ' logmark'); tasks(X.TASKS, tag + ' task'); cards(X.CARDS, tag);
      for (const [k, M] of Object.entries(X.MEM || {})) { each(M.frame, `${tag} mem ${k}`); each(M.model, `${tag} mem ${k}`); each(M.more, `${tag} mem ${k}`); }
      for (const [k, M] of Object.entries(X.PLAN || {})) { each(M.frame, `${tag} plan ${k}`); each(M.model, `${tag} plan ${k}`); each(M.more, `${tag} plan ${k}`); }
      for (const [k, F] of Object.entries(X.FV || {})) { each(F, `${tag} fv ${k}`); }
      for (const [k, P] of Object.entries(X.MEM_PRES || {})) each(P, `${tag} pres ${k}`);
      for (const [k, sp0] of Object.entries(X.SPECIES || {})) if (isCl(k)) v(sp0.w, k, tag + ' species');
      if (X.LORE) { v(X.LORE[3], 'zh', tag + ' lore'); v(X.LORE[4], 'ja', tag + ' lore'); }
    }
    each(PRES_BLOW, 'pres blow');
    // the words: every zh / ja form valid; every word taught somewhere that exists (a line, a demonstration, a Look, a log
    // question, a fight line), every Look's word registered, every {w.ml_*} slot a registered word, no word in both worlds' tables
    if (!wordsOk) registerWords();
    const tables = { past: typeof MPTXT !== 'undefined' ? MPTXT : null, future: typeof MFTXT !== 'undefined' ? MFTXT : null }, keysOf = {};
    for (const [w, X] of Object.entries(tables)) {
      if (!X) continue;
      const pre = w === 'past' ? 'p:' : 'f:', ks = keysOf[w] = new Set();
      for (const key of ['LINES', 'DEMO', 'LOOKS', 'LOGQ', 'FIGHT']) for (const T of Object.values(X[key] || {})) if (T && T._mk) ks.add(T._mk);
      for (const [k, T] of Object.entries(X.LOOKS || {})) {
        if (!T.id || (typeof LEX !== 'undefined' && !LEX.item(T.id))) out.push(`${w} look ${k}: no word «${T.id}»`);
        if (T._mk && !(BYKEY[T._mk] || []).includes(T.id)) out.push(`${w} look ${k}: «${T.id}» doesn’t list it as where it’s taught`);
      }
      for (const key of ['LINES', 'DEMO', 'LOOKS']) for (const [k, T] of Object.entries(X[key] || {})) {
        const en = String((T && (T.en || (typeof T.t === 'string' ? T.t : ''))) || ''); let m; SLOT.lastIndex = 0;
        while ((m = SLOT.exec(en))) if (typeof LEX !== 'undefined' && !LEX.item(m[1])) out.push(`${w} ${key} ${k}: slot {${m[1]}} isn’t a word`);
      }
    }
    const ownIds = {};
    for (const [w, list] of Object.entries(WORDS)) for (const it of list) {
      if (!it.ref) { for (const l of ['zh', 'ja']) v(it[l], l, 'word ' + it.id); if (ownIds[it.id]) out.push(`word ${it.id}: in both worlds’ tables`); ownIds[it.id] = w; }
      else if (typeof LEX !== 'undefined' && !LEX.item(it.id)) out.push(`word @${it.id} (${w}): not in Mimo’s memory`);
      if (!it.keys.length) out.push(`word ${it.id} (${w}): taught nowhere`);
      for (const k of it.keys) if (keysOf[w] && !keysOf[w].has(k)) out.push(`word ${it.id} (${w}): «${k}» is no line, demonstration or Look`);
      for (const l of LANGS) if (!it.ref && !it[l]) out.push(`word ${it.id}: no ${l}`);
    }
    return out;
  }

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the save goes to the test slot)
  // setup(o): the save after Chapter 3 with Alba's echoes in and Molinar open (o.seen: Noa's first words already heard) ·
  // near(id): stand by a crack ('mill', 'market', 'gate') · go(world): step across here at once · check()
  function setup(o = {}) {
    if (typeof TIME_ALBA !== 'undefined' && TIME_ALBA._ && TIME_ALBA._.t) TIME_ALBA._.t.setup();
    if (typeof CH4 !== 'undefined') { CH4._.t.give('alba', 'past'); CH4._.t.give('alba', 'future'); }
    // (the save after Chapter 3 has rung all eight bells: the Great Mill is free today)
    const g = G(); Object.assign(g.state.flags, { molinar: true, ciro: true, millFree: true }); if (g.molinar && g.molinar.setMillHushed) g.molinar.setMillHushed(false, true);
    if (o.seen !== false) TIME.seen('molinar.noa', true);
    // (tests: until Alba's own steps are registered, the main quest stops at Alba; put Molinar's in, before the "coming soon")
    const main = typeof QUESTS !== 'undefined' && QUESTS.LIST.find(q => q.id === 'main');
    if (main && !main.steps.some(x => x.ch4 === 'molinar')) {
      const i = main.steps.findIndex(x => x.ch4 === 'soon'); const add = PSTEPS.concat(FSTEPS);
      if (i >= 0) main.steps.splice(i, 0, ...add); else main.steps.push(...add);
    }
    TIME._.fast.on = true; TIME.refresh();
    return TIME.open('molinar');
  }
  function near(id) {
    const c = CRACK[id]; if (!c) return null;
    const g = G(), Y = g.sim.you; Y.x = c.x + 1.3; Y.z = c.z + 1.0; g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
    return { x: Y.x, z: Y.z };
  }
  async function go(w, at) { const p = at || { x: CRACK.gate.x + 1.6, z: CRACK.gate.z + 1.2, yaw: 0 }; const r = await TIME.go(w, { region: 'molinar', at: p, quick: true }); return r && TIME.world(); }
  // put the save at a step of Molinar's path (everything before it done): 'past.mill' (inside the Past's mill next), 'past.top'
  // (its boss next), 'future' (the Past reported), 'future.mill', 'future.top'
  function at(step) {
    const P = st('past'), F = st('future'), pm = P.mill || (P.mill = {}), fm = F.mill || (F.mill = {});
    TIME.seen('molinar.noa', true);
    Object.assign(P, { demo: true, met: true, helperDemo: true, asked: 2, joined: true });
    if (step === 'past.mill') return step;
    Object.assign(pm, { seen0: true, seen1: true, seen2: true, stones: [true, true], crank: true, done0: true, ambush: true, wheel: true, lever: true, done1: true, mast: true, sails: true, done2: true, memCard: true });
    P.floors = 3;
    if (step === 'past.top') return step;
    Object.assign(pm, { seen3: true, boss: true, done3: true }); TIME.flag('past', 'molBuilt', true);
    if (typeof CH4 !== 'undefined') CH4._.t.give('molinar', 'past'); P.reported = true;
    if (step === 'future') { TIME.refresh(); return step; }
    Object.assign(F, { met: true, woke: { marga: 'S', tomas: 'S', lupe: 'S', ciro: 'S' }, open: true });
    if (step === 'future.mill') { TIME.refresh(); return step; }
    Object.assign(fm, { seen0: true, seen1: true, seen2: true, dustPlan: true, dust: true, done0: true, ambush: true, gearPlan: true, gear: true, lever: true, turning: true, done1: true, clothPlan: true, cloth: true, turn: true, done2: true });
    F.floors = 3; TIME.refresh();
    return step;
  }
  // the crack probe (TIME.md §13): what answers E within 3 steps, and the solids within 2, in the world you're in
  function probe(x, z) {
    const room = G().indoorMod && G().indoorMod(), L0 = room ? room.interactables() : STORY._test.interactables().slice();
    if (!room) for (const P0 of STORY.extra || []) { try { if (P0.interactables) L0.push(...P0.interactables()); } catch (e) { /* */ } }
    const es = L0.filter(it => !it.crack && Math.hypot(it.x - x, it.z - z) < 3).map(it => `${it.label}@${it.x.toFixed(1)},${it.z.toFixed(1)}`);
    const [a, b] = WORLD.pushOut(x, z, 2); return { e: es, solid: Math.hypot(a - x, b - z) > 0.01 };
  }

  // a driver for tests in a hidden tab (game time only moves with __g.go): step until a box or a menu shows, reading the lines,
  // closing cards; type into the box; press E on the nearest thing with a label; drive a fight through the battle's test API
  const drv = {
    cardOn() { const e = document.getElementById('card'); return e && !e.classList.contains('hidden') ? e.textContent.replace(/\s+/g, ' ').slice(0, 220) : null; },
    boxOn() { const e = document.getElementById('command'); return e && !e.classList.contains('hidden') ? { title: document.getElementById('command-title').textContent, hint: document.getElementById('command-hint').textContent.slice(0, 200) } : null; },
    chooseOn() { const e = document.getElementById('choose'); return e && !e.classList.contains('hidden') ? e.textContent.replace(/\s+/g, ' ').slice(0, 200) : null; },
    async adv() { for (let k = 0; k < 400 && STORY.line && !STORY.line.full; k++) { __g.step(1); await null; } if (!STORY.line) return; Input.force = { interact: true }; __g.step(1); Input.force = null; for (let k = 0; k < 4; k++) { await null; __g.step(1); } },
    async run(sec = 20) {
      const log = [], t0 = performance.now(); let idle = 0;
      while (performance.now() - t0 < sec * 1000) {
        await __g.go(0.2);
        if (document.body.classList.contains('in-battle')) { log.push({ battle: true }); break; }
        const L = __g.lineNow();
        if (L) { const last = log[log.length - 1]; if (!last || last.text !== String(L.text).slice(0, 150)) log.push({ who: L.name || L.who, text: String(L.text).slice(0, 150) }); await drv.adv(); idle = 0; continue; }
        const c = drv.cardOn(); if (c) { const last = log[log.length - 1]; if (!last || last.card !== c) log.push({ card: c }); await new Promise(r => setTimeout(r, 280)); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true })); await new Promise(r => setTimeout(r, 280)); idle = 0; continue; }
        if (drv.boxOn()) { log.push({ box: drv.boxOn() }); break; }
        if (drv.chooseOn()) { log.push({ choose: drv.chooseOn() }); break; }
        if (!STORY.busy && !G().sim.lock) { if (++idle > 5) break; } else idle = 0;
      }
      return log;
    },
    async type(text) { if (!drv.boxOn()) return 'no box'; const i = document.getElementById('command-input'); i.value = text; document.getElementById('command-form').requestSubmit(); await __g.go(0.3); return [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).slice(-2); },
    async E(label, near) {
      const room = G().indoorMod && G().indoorMod(), its = room ? room.interactables() : STORY._test.interactables().concat(...(STORY.extra || []).map(p => { try { return p.interactables ? p.interactables() : []; } catch (e) { return []; } }));
      const p = near || G().sim.you, c = its.filter(i => i.label === label || String(i.label || '').includes(label)).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
      if (!c.length) return 'no ' + label; const it = c[0]; const run = STORY.talkMenu ? STORY.talkMenu(it) : it.run; STORY.run(() => run()); await __g.go(0.3); return 'ok ' + (it.who || it.label);
    },
    pick(i) { const b = document.querySelector(`#choose button[data-i="${i}"]`); if (b) b.click(); return !!b; },
    // textFn(api) → the command to send; teach / echo prompts are answered from what they ask for
    async fight(textFn, sec = 30) {
      const B = BATTLE._.api, t0 = performance.now(), sent = [];
      while (performance.now() - t0 < sec * 1000) {
        if (!B.G.running && !document.body.classList.contains('in-battle')) break;
        if (B.G.running && !B.G.auto) B.G.auto = { timing: 'perfect', dodge: 'perfect', dialog: true };
        const pd = B.G.pending;
        if (pd && pd.kind === 'command') { const t = textFn(B); sent.push(t); B.submit(t); }
        else if (pd && pd.kind === 'echo') { B.submit(pd.answer || ''); sent.push('(echo)'); }
        else if (pd && pd.kind === 'teach') { const w = typeof LEX !== 'undefined' && pd.id ? (isCl(lang()) ? LEX.src(pd.id) : LEX.form(pd.id)) : ''; B.submit(isCl(lang()) ? plainT(w) : w); sent.push('(teach ' + pd.id + ')'); }
        await __g.go(0.2);
      }
      return { sent: sent.slice(-6), n: sent.length, running: B.G.running, inBattle: document.body.classList.contains('in-battle') };
    },
  };

  return { CEN, RAD, CRACK, DOOR, DRESS, TXT, ECHO, NOA, PSTEPS, FSTEPS, L, LANGS, isCl, lang, nameOf, enName, fillMimo, fillEn, say, demo, hushed, think, you, frame2,
    card, css, grade, ask, memTask, planTask, has, person, who, lock, shot, wait, mimoName, plainT, down, st, sp, sf, sn, via, check, sx,
    WORDS, look, teach, registerWords, wordsHTML, wordShown, get BYKEY() { return BYKEY; },
    get flare() { return flare; }, set flare(v) { flare = v; },
    _: { noaOpen, reportPast, reportFuture, crackCard, tick, catchUp: () => { caughtFor = null; catchUp(); }, t: { setup, near, go, probe, at, check: () => check(), drv } } };
})();
