'use strict';
// The Gray Marsh in three worlds (DESIGN.md 21.1 "a clear lake village … a forest turned to stone"; game/TIME.md §25 "The Gray Marsh
// (T4c)"): Chapter 4's ninth and last place, a region TIME dresses itself, in the Sunken Ruins' shape (time_ruins.js is the model).
//   time_marsh.js            MARSHT: the region, its three cracks, Noa's voice at Candil's landing, Chapter 4's steps and the last two
//                            echoes, the shared kit (names, saying and demonstrating, the S–D grader, the ask box, pattern cards, memories
//                            for {mimo}), today's marsh set aside in the other worlds (its people, Bruno, the dark water, the mist), the
//                            journal's «Marsh words» page, the language packs' merge (MARSHT.add), check() and test hooks
//   time_marsh_land.js       the two lands (TIME.land): the clear lake long ago, the basin turned to stone tomorrow
//   marsh_past(_text).js     Candil long ago, the morning after Lantern Night, the gray settled on the lake: MH_PAST, 7 people, 3 side quests
//   marsh_future(_text).js   Candil tomorrow, turned to stone; only Lucero still talks: MH_FUT
//   marsh_past_dungeon.js    MH_PHOUSE: the Lantern House long ago (rooms at y 300, z −334, x −326 / −300 / −274 / −248)
//   marsh_future_dungeon.js  MH_FCHAPEL: the Stone Chapel tomorrow (rooms at y 300, z −306, same x)
//   marsh_time_boss.js       MHBOSS: the Lantern Moth (the Past) and the Stone Gargoyle (the Future)
//   marsh_time_battle.js     the 'lanternlake' and 'stonewood' arenas;  marsh_time_music.js: MHMUSIC, six songs
//   marsh_text_pt.js / _de / _zh / _ja   each language's lines and tasks, merged in (MARSHT.add, MHPTXT.add, MHFTXT.add)
// The cracks (open with CH4.open('marsh'): after the Sunken Ruins' two echoes): on the road in, before the boardwalk (today ↔ the
// Past), at the causeway's foot in Candil (today ↔ the Future), at Candil's landing where the boardwalk arrives (all three; Noa).
// State: TIME.state('marsh', 'past' | 'future' | 'now'); flags: TIME.flag('past', 'mhOpen' | 'mhNote' | 'mhWillow'), ('future', 'mhFree'
// | 'mhWarn' (the warning told)), ('now', 'mhSong' (today's Nieves teaches Mati the evening song)).
// The grammar (TIME.md §8, rung 8, B2): the Past, a long story with every past in its place (the imperfect sets the scene, «estaba +
// -ando» is cut off, the preterite moves on, the pluperfect steps back, «dijo que…» passes on words); the Future, what isn't so but
// could be: «si» + the imperfect subjunctive + the conditional («Si cantaras, la campana te respondería»). Each language its own: pt
// «estava + -ndo», «tinha + particípio», «disse que…»; «se» + imperfeito do subjuntivo + futuro do pretérito; de the Präteritum of a
// story, the Plusquamperfekt with «nachdem / als / schon», reported speech in the Konjunktiv I; «wenn» + Konjunktiv II, «würde …»;
// zh 那天晚上 / 正在…的时候 / 了 / 已经…了 / 他说…, 要是…就会… / 如果…的话; ja た / ていた / もう〜ていた / 〜と言っていた, 〜たら / 〜ば + 〜だろう / 〜のに.
const MARSHT = (() => {
  if (typeof TIME === 'undefined' || typeof MARSH === 'undefined') return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, OFF = A.OFF;
  const G = () => A.G;
  const lang = () => A.lang();
  const isCl = l => l === 'zh' || l === 'ja';
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const L = (en, es, pt, de, zh, ja, o) => { const r = Object.assign({ en, es }, o || {}); if (pt !== undefined) r.pt = pt; if (de !== undefined) r.de = de; if (zh !== undefined) r.zh = zh; if (ja !== undefined) r.ja = ja; return r; };
  const esc = s => A.esc(s);
  const wait = s => STORY.wait(s);
  const lock = on => { const g = G(); if (!g) return; g.sim.lock = on ? 1 : 0; if (!on) g.cam.override = null; };
  const shot = (pos, look, dur = 0.9) => { G().cam.override = { pos, look, dur }; };
  const mimoName = () => (G() && G().state && G().state.mimoName) || 'Mimo';
  const plainT = s => A.plainT(s);
  const down = (letter, n) => 'SABCD'[Math.max(0, Math.min(4, 'SABCD'.indexOf(letter) + n))];
  const B = () => (typeof MARSH !== 'undefined' && MARSH.built) || null;
  const MS = MARSH;

  // ------------------------------------------------------------ where things are (checked with the probe in every world)
  const CEN = { x: -12, z: -338 }, RAD = 60;
  const CRACK = { past: { x: 5.6, z: -301.4 }, future: { x: -24.2, z: -348.5 }, gate: { x: -16.0, z: -324.0 } };
  // its reach in the other worlds: the basin (the road in from the gate, Candil, the causeway, the chapel), but not the Old Tower's
  // crag and yard (oldtower.js's), nor back past the gate
  const inside = (x, z) => {
    if (z > -266) return false;
    if (Math.hypot(x - MS.YARD.x, z - MS.YARD.z) < MS.YARD.r + 3 || Math.hypot(x - MS.TOWER.x, z - MS.TOWER.z) < 16) return false;
    const r = MS.ROAD.near(x, z); if (r.d < 4.5) return true;
    const t = MS.TPATH.near(x, z); if (t.d < 4 && t.s > MS.TPATH.len - 7) return false;
    return MS.basinDist(x, z) < 1.5;
  };

  // ------------------------------------------------------------ the save's part
  const st = w => TIME.state('marsh', w);
  const R0 = s => (s && s.worlds && s.worlds.r && s.worlds.r.marsh) || {};
  const sp = s => R0(s).past || {}, sf = s => R0(s).future || {}, sn = s => R0(s).now || {};
  const seenIn = (s, k) => !!(s && s.worlds && s.worlds.seen && s.worlds.seen[k]);
  const echoIn = (s, w) => !!(s && s.ch4 && s.ch4.echoes && s.ch4.echoes['marsh.' + w]);

  // ------------------------------------------------------------ names: each language's own cast for the new people of then and tomorrow
  // (MHPTXT.CAST, MHFTXT.CAST); Candil's people of today keep their names everywhere (marsh.js)
  const NOA = L('Noa', 'Noa', 'Noa', 'Noa', '[诺娅|Nuò yà]', 'ノア');
  const casts = () => [typeof MHPTXT !== 'undefined' ? MHPTXT.CAST : {}, typeof MHFTXT !== 'undefined' ? MHFTXT.CAST : {}];
  const nameOf = (T, l = lang()) => (!T ? '' : isCl(l) ? plainT(T[l] || T.en) : T[l] || T.en);
  const enName = (T, l) => { if (!T) return ''; if (l === 'es') return T.en; if (isCl(l)) { try { return CJK.roman(T[l], { lang: l }); } catch (e) { return T.en; } } return T[l] || T.en; };
  const fillMimo = (t, l = lang()) => String(t || '').replace(/\{mimo\}/g, isCl(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName());
  function fillEn(t, l = lang()) {
    let s = String(t || '');
    for (const C of casts()) s = s.replace(/\{([a-z]+)\}/g, (m, k) => (C[k] ? enName(C[k], l) : m));
    return s.replace(/\{mimo\}/g, mimoName()).replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }
  const enOf = (T, l) => (T && (T['en_' + l] || T.en)) || '';

  // ------------------------------------------------------------ words: a line's English slots ({w.mhp_*}, {w.mhf_*}, and words already in
  // the game) and a demonstration's marks are met as they're said (LEX.expose)
  const SLOT = /\{(w\.[a-z_0-9]+|n\.[a-z_]+|c\.[a-z_]+)(?::(?:pl|f))?\}/g;
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
  // words glossed, whole in the language; the hushed (the stone people) keep only their *starred* words)
  function say(p, T) { if (!p || !T) return Promise.resolve(); const l = lang(); meet(T); p.lines = { en: fillEn(enOf(T, l), l), [l]: fillMimo(T[l] || T.es || '', l) }; return STORY.sayInline(p); }
  function demo(p, T, marks) {
    if (!p || !T) return Promise.resolve();
    meet(T, marks);
    const l = lang(), T2 = { en: fillEn(enOf(T, l), l) }; LANGS.forEach(x => { T2[x] = fillMimo(T[x] || '', x); });
    return STORY.demoLine(p, T2, marks);
  }
  function hushed(p, T) { if (!p || !T) return Promise.resolve(); const l = lang(); return STORY.sayHushed ? STORY.sayHushed(p, fillMimo(T[l] || '', l), fillEn(enOf(T, l), l)) : say(p, T); }
  // (bare 汉字 / かな in an English tip follow the reading mode: romanized for a player who reads roman)
  const lower1 = s => String(s).charAt(0).toLowerCase() + String(s).slice(1);
  const cjRun = (s, l = lang()) => (isCl(l) && typeof CJK !== 'undefined' && CJK.plain ? String(s).replace(/[぀-ヿ一-鿿][぀-ヿ一-鿿…]*/g, m => { try { return lower1(CJK.plain(m, { lang: l })); } catch (e) { return m; } }) : s);
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
    if (document.getElementById('mht-css')) return;
    const s = document.createElement('style'); s.id = 'mht-css';
    s.textContent = `.card.mh-card .ex { display: grid; grid-template-columns: auto auto; gap: 4px 14px; justify-content: center; margin: 10px 0 6px; font-size: 18px; }
.card.mh-card .ex b { color: #a8532f; } .card.mh-card.fut .ex b, .card.mh-card.fut .tag { color: #5a6a8a; }
.card.mh-card .note { max-width: 480px; margin: 6px auto 0; font-size: 14px; line-height: 1.45; } .card.mh-card .tag { color: #a8532f; }
.card.mh-card .rows { text-align: left; max-width: 480px; margin: 8px auto 0; font-size: 14px; line-height: 1.5; }
.mh-words { columns: 2; column-gap: 18px; font-size: 13px; line-height: 1.5; margin: 6px 0 10px; } .mh-words li { break-inside: avoid; } .mh-words .no { opacity: .45; }`;
    document.head.appendChild(s);
  }
  const tHTML = (t, l) => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l, ruby: 'always' }) : esc(t));
  async function card(C, fut) {
    css();
    const l = lang(), c = C && (C[l] || C.es); if (!c) return;
    const ex = (c.ex || []).map(([w, e]) => `<b>${tHTML(fillMimo(w, l), l)}</b><span>${esc(e)}</span>`).join('');
    await UI.card(`<div class="tag">${esc(cjRun(brRun(fillEn(c.tag || C.tag, l), l), l))}</div>${ex ? `<div class="ex">${ex}</div>` : ''}<div class="note">${esc(cjRun(brRun(fillEn(c.note, l), l), l))}</div><div class="sub">E</div>`, { kind: 'mh-card' + (fut ? ' fut' : '') });
  }

  // ------------------------------------------------------------ grading what you say (S–D: one letter down per miss; «?», the whole
  // sentence, counts as two). T: want (S; an A with an accent missing or none of `more`), alt (A), and right-but-off answers that are a
  // B with a tip: aux (de: hatte / war), person, tense (the other past: what happened told as the scene, or the scene as what happened;
  // the plain past where it had already happened), shift (what someone said, not stepped back), mood (tomorrow's «si» with the
  // indicative: a real if, not a what-if), real (a real if all through: «si cantas, cantará»), main (the second half not in the
  // conditional: «si cantaras, cantará»), order (de: the verb last); and the misses with a tip: past, pres, fut, condsi (the conditional
  // right after «si»: «si cantarías»), miss. Items: a string as a word or phrase (zh / ja: CJK.contains), a list: all of them, in any
  // order. (the Sunken Ruins' grader, kept here so the marsh stands on its own)
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const fold = (s, lg) => { let t = nrm(s); if (lg === 'de') t = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'); return t; };
  const words = (s, lg) => ' ' + fold(s, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const hasCJ = (text, src, l) => {
    if (typeof CJK === 'undefined') return false;
    try { const ch = CJK.chars(src, { lang: l }).replace(/\s+/g, ''); if (/[぀-ヿ一-鿿]/.test(ch) && String(text || '').replace(/\s+/g, '').includes(ch)) return true; } catch (e) { /* */ }
    try { if (CJK.contains(text, src, l)) return true; } catch (e) { /* */ }
    if (l === 'zh') { try { const py = nrm(CJK.roman(src, { lang: 'zh' })).replace(/[^a-z]/g, ''); if (py.length >= 4 && nrm(text).replace(/[^a-z]/g, '').includes(py)) return true; } catch (e) { /* */ } }
    if (l === 'ja') { try { const ro = nrm(CJK.roman(src, { lang: 'ja' })).replace(/[^a-z]/g, ''); if (ro.length >= 4 && nrm(text).replace(/[^a-z]/g, '').includes(ro)) return true; } catch (e) { /* */ } }
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
  // de: after «dass», «weil», «wenn», «als», «nachdem» the verb goes last; a B with a tip when the wanted verb is there but not last
  // (clause by clause: a comma closes the «wenn» part, and a main clause's own verb right after it, «…, würde er», isn't the slip)
  function orderSlip(T, text, lg) {
    const O = (T.order || {})[lg]; if (!O || !O.length || lg !== 'de') return false;
    const sub = ['dass', 'wenn', 'als', 'nachdem', 'weil', 'ob', 'wahrend', 'bevor', 'obwohl', 'sobald', 'falls'], vs = O.map(v => fold(v, lg));
    for (const seg of String(text || '').split(/[,;.!?:«»]/)) {
      const w = words(seg, lg).trim().split(' ').filter(Boolean), i = Math.max(...sub.map(c => w.lastIndexOf(c))); if (i < 0) continue;
      let after = w.slice(i + 1); const cut = after.findIndex((x, j) => j > 1 && ['wurde', 'wurdest', 'wurden', 'wurdet', 'ware', 'waren', 'hatte', 'hatten', 'konnte', 'konnten'].includes(x) && after.slice(0, j).some(y => vs.includes(y)));
      if (cut > 0) after = after.slice(0, cut);
      const last = after[after.length - 1] || '';
      if (!vs.includes(last) && after.some(x => vs.includes(x))) return true;
    }
    return false;
  }
  const LESS = ['tense', 'shift', 'mood', 'real', 'main'];
  const BKEYS = ['aux', 'person', 'tense', 'shift', 'mood', 'real', 'main', 'when'];
  const MISS = ['past', 'pres', 'fut', 'condsi', 'miss'];
  // (typing only the blank counts as the frame filled in: «escrito» for «Había ___ sus palabras.»)
  function grade(T, text, lg, TIPS = {}) {
    const g = grade0(T, text, lg, TIPS);
    if (g.ok || g.kind === 'veto') return g;          // (the fill only rescues a miss: it never lifts an A to an S)
    const fr = plainT(fillMimo((T.frame || {})[lg] || '', lg));
    if (!fr.includes('___') || !String(text || '').trim()) return g;
    if (!isCl(lg) && ['pres', 'fut', 'past'].some(k => ((T[k] || {})[lg] || []).some(x => Array.isArray(x) && x.length > 1 && exact(text, x, lg)))) return g;
    // (pinyin / rōmaji typed in is counted in words, like the other languages: «hashitte kuru deshou» is a blank's worth)
    const cjText = isCl(lg) && /[぀-ヿ一-鿿]/.test(String(text));
    const n = cjText ? String(text).replace(/\s+/g, '').length : words(text, lg).trim().split(' ').length;
    if (n > (cjText ? 8 : 4)) return g;
    if (isCl(lg) && typeof CJK !== 'undefined' && CJK.chars && /[぀-ヿ一-鿿]/.test(text)) {
      const cm = Math.max(1, ...((T.chips || {})[lg] || []).map(c => { try { return CJK.chars(fillMimo(c[0], lg), { lang: lg }).replace(/\s+/g, '').length; } catch (e) { return 4; } }));
      if (n > cm + 3) return g;
    }
    // (frames with two blanks: «Si ___, la campana te ___.» take two words in order, one per blank)
    const blanks = fr.split('___').length - 1;
    if (blanks > 1 && !isCl(lg)) {
      const tw = words(text, lg).trim().split(' ');
      if (tw.length === blanks) { let f2 = fr; for (const w of String(text).trim().split(/\s+|,\s*/).filter(Boolean)) f2 = f2.replace('___', w); const g2 = grade0(T, f2, lg, TIPS); if (g2.ok) return g2; }
      return g;
    }
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
    // (a form that counts less, found by its exact spelling first, so a bare verb's A can't hide it: «cantas», «salía»)
    for (const k of LESS) { const x0 = first(k, exact); if (x0) return { ok: true, letter: 'B', kind: k, why: tip(k) || `«${model}»` }; }
    // (a miss of more than one word said whole, before a want could hide it: «si cantarías»)
    for (const k of ['condsi']) { const m = first(k, exact); if (m) return { ok: false, kind: k, why: tip(k) }; }
    const w = first('want');
    if (w && !first('want', exact)) for (const k of ['past', 'pres', 'fut']) { const m = first(k, exact); if (m) return { ok: false, kind: k, why: tip(k) }; }
    if (w) {
      if (orderSlip(T, text, lg)) return { ok: true, letter: 'B', kind: 'order', why: tip('order') || `The verb goes last: «${model}»` };
      const mo = !((T.more || {})[lg] || []).length || T.more[lg].some(x => has(text, x, lg));
      const others = ['alt', ...BKEYS, ...MISS].flatMap(k => ((T[k] || {})[lg] || []).flat());
      const ac = typeof ACCENTS !== 'undefined' ? ACCENTS.judge(text, w, lg, { others }) : { keep: !accented(text, w, lg), why: `Accent: «${plainT(showForm(w))}»`, tip: '' };
      return { ok: true, letter: !ac.keep && mo ? 'S' : 'A', kind: 'right', why: ac.keep ? ac.why : !mo ? tip('more') || `Right! The whole sentence for an S: «${model}»` : 'Just right!', tip: ac.tip || '' };
    }
    const a = first('alt');
    if (a) return orderSlip(T, text, lg) ? { ok: true, letter: 'B', kind: 'order', why: tip('order') || `The verb goes last: «${model}»` } : { ok: true, letter: 'A', kind: 'alt', why: tip('alt') || 'Right!' };
    for (const fn of [exact, has]) {
      for (const k of BKEYS) { const x = first(k, fn); if (x) return { ok: true, letter: 'B', kind: k, why: tip(k) || `«${model}»` }; }
      for (const k of MISS) { const m = first(k, fn); if (m) return { ok: false, kind: k, why: tip(k) }; }
    }
    return { ok: false, kind: 'none' };
  }
  // one task, asked until it's said (or you close the box): the frame and the chips on the box, the model on «?»
  async function ask(T, o = {}) {
    const lg = lang(), tips = o.tips || {};
    const frame = plainT(fillMimo((T.frame || {})[lg] || '', lg)), chips = ((T.chips || {})[lg] || []).map(([w, e]) => `${isCl(lg) ? lower1(plainT(fillMimo(w, lg))) : plainT(fillMimo(w, lg))}${e ? ' (' + cjRun(e, lg) + ')' : ''}`).join(' · ');
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
  // a long story told in parts: each part one task in a row (the retelling), each graded, the average returned (o.onPart(i, r) after each)
  async function story(parts, o = {}) {
    const got = [];
    for (let i = 0; i < parts.length; i++) {
      if (o.done && o.done[i]) { got.push(o.done[i]); continue; }
      if (o.before) { try { await o.before(i); } catch (e) { /* */ } }
      const r = await ask(parts[i], { tips: o.tips, icon: o.icon || 'star', title: parts[i].title });
      if (!r) return null;
      got.push(r.letter); if (o.onPart) { try { await o.onPart(i, r); } catch (e) { /* */ } }
    }
    const avg = got.reduce((a, x) => a + 'SABCD'.indexOf(x), 0) / Math.max(1, got.length);
    return { letter: 'SABCD'[Math.max(0, Math.min(4, Math.round(avg)))], parts: got };
  }
  // {mimo}'s moves, told in the world's time: a memory in the Past (PTXT.PV's 3rd-person preterites, through QUART / MOLT's memTask);
  // tomorrow, a what-if (MHFTXT's own tasks: «Si la puerta fuera de madera, {mimo} la empujaría»)
  const memTask = Mm => {
    const Q = typeof QUART !== 'undefined' && QUART && QUART.memTask ? QUART : typeof MOLT !== 'undefined' && MOLT && MOLT.memTask ? MOLT : null;
    if (!Q) return null;
    const T = Object.assign(Q.memTask(Mm), { words: Mm.words });
    const fv = typeof MFTXT !== 'undefined' && MFTXT && MFTXT.FV ? MFTXT.FV[Mm.verb] : null;
    if (fv) {
      T.fut = {}; LANGS.forEach(l => { T.fut[l] = [...(fv[l] || []), ...((fv.ir || {})[l] || [])]; });
      T.tips = Object.assign({}, T.tips, { fut: { es: 'That’s a plan, for tomorrow! Long ago, {mimo} moves in memories: «{form}».', pt: 'That’s a plan, for tomorrow! Long ago, {mimo} moves in memories: «{form}».',
        de: 'That’s a plan, for tomorrow! Long ago: «{form}».', zh: 'That’s tomorrow (会)! It already happened: «{form}».', ja: 'That’s a plan, for tomorrow! Long ago: ～た, «{form}».' } });
    }
    // es/pt: the other past (the imperfect, made from PTXT.PV's preterite: «nadó» → «nadaba») is a B with a tip, and the present (the
    // command form is the 3rd person for regular verbs: «nada») a «that's now» miss, not a plain «not quite»
    const l = lang();
    if (l === 'es' || l === 'pt') {
      let pv = '', it = null;
      try { pv = String(((typeof PTXT !== 'undefined' && PTXT.PV && PTXT.PV[Mm.verb]) || {})[l] && PTXT.PV[Mm.verb][l][0] || ''); it = typeof LEX !== 'undefined' ? LEX.item(Mm.verb) : null; } catch (e) { pv = ''; }
      const im = !pv || /\s/.test(pv) ? '' : l === 'es' ? (/yó$/.test(pv) ? pv.slice(0, -2) + 'ía' : /ió$/.test(pv) ? pv.slice(0, -2) + 'ía' : /ó$/.test(pv) ? pv.slice(0, -1) + 'aba' : '')
        : (/ou$/.test(pv) ? pv.slice(0, -2) + 'ava' : /[ei]u$/.test(pv) ? pv.slice(0, -2) + 'ia' : '');
      if (im) T.tense = Object.assign({}, T.tense, { [l]: [im] });
      const irr = ['haz', 'pon', 'di', 'sal', 'ten', 'ven', 've', 'sé', 'faz', 'põe', 'diz', 'vem', 'vai', 'tem'];
      const pres = it && it[l] ? [it[l], ...(((it.alt || {})[l]) || [])].map(x => String(x).toLowerCase()).filter(x => !/\s/.test(x) && !irr.includes(x)) : [];
      if (pres.length) T.pres = Object.assign({}, T.pres, { [l]: pres });
      const tip = 'Close! That’s the other past, for scenes and habits. This happened once: «{form}».', now = 'That’s now. It already happened, as a memory: «{form}».';
      T.tips = Object.assign({}, T.tips, { tense: { es: tip, pt: tip }, pres: { es: now, pt: now } });
    }
    // de: the present (the command form + «-t», and the 3rd-person forms among its alternatives) is a «that's now» miss too
    if (l === 'de') {
      let it = null; try { it = typeof LEX !== 'undefined' ? LEX.item(Mm.verb) : null; } catch (e) { it = null; }
      const pres = it && it.de ? [String(it.de) + 't', ...(((it.alt || {}).de) || []).filter(x => /t$/.test(x) && !/\s/.test(x))].map(x => String(x).toLowerCase()) : [];
      if (pres.length) { T.pres = Object.assign({}, T.pres, { de: pres }); T.tips = Object.assign({}, T.tips, { pres: Object.assign({}, (T.tips || {}).pres, { de: 'That’s now. It already happened, as a memory: «{form}».' }) }); }
    }
    return T;
  };

  // ------------------------------------------------------------ the people TIME builds (TIME.people), by world and id
  function person(w, id) {
    const list = TIME.people && TIME.people.all['marsh:' + w]; if (!list) return null;
    const P = list.find(q => q.def.id === id); if (!P) return null;
    P.api.name = nameOf(P.def.name); return P;
  }
  const who = (w, id) => { const P = person(w, id); return P ? P.api : null; };

  // ------------------------------------------------------------ today's marsh, set aside in another world: Candil's people and Lucero
  // (marsh.js's own people), the story's Bruno, the wisps and (long ago) the ground mist. main.js hides the marsh's group whenever a
  // room is on (TIME counts as one), so in this region's other worlds it's shown again and run (showToday). marsh.js's own meshes that
  // the lands change (the dark water, the reeds, the dead willows, the boardwalk, the great lantern, the drowned chapel) are found
  // once by what they are (marshMeshes) and swapped by the lands and the dressings.
  let MM = null;
  function marshMeshes() {
    const Bm = B(); if (!Bm) return {};
    if (MM && MM.group === Bm.group) return MM;
    const O = Bm.objects || {}, out = { group: Bm.group, water: O.water, mist: O.mist && O.mist.pts, wisps: O.wisps && O.wisps.pts, chapel: O.chapel, lantern: O.lantern, dock: O.dock, boardwalk: O.boardwalk };
    // (vertex colors, as stored: the kits keep linear colors; compare both ways)
    const lin = new THREE.Color(), cand = hex => { const c = new THREE.Color(hex), c2 = c.clone(); try { c2.convertSRGBToLinear(); } catch (e) { /* */ } return [c, c2]; };
    const hasCol = (m, list) => {
      const a = m.geometry && m.geometry.attributes && m.geometry.attributes.color; if (!a) return false;
      const C0 = list.flatMap(cand), n = Math.min(a.count, 4000), step = Math.max(1, Math.floor(a.count / n));
      for (let i = 0; i < a.count; i += step) { lin.setRGB(a.getX(i), a.getY(i), a.getZ(i)); for (const c of C0) if (Math.abs(lin.r - c.r) + Math.abs(lin.g - c.g) + Math.abs(lin.b - c.b) < 0.012) return true; }
      return false;
    };
    const near = (m, x, z, r) => { if (!m.geometry) return false; if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); const c = m.geometry.boundingSphere.center, p = new THREE.Vector3(c.x, c.y, c.z); m.localToWorld(p); return Math.hypot(p.x - x, p.z - z) < r; };
    for (const c of Bm.group.children) {
      if (!c.isMesh || !c.geometry || !c.geometry.attributes || !c.geometry.attributes.color) continue;
      if (!out.reeds && hasCol(c, ['#8a8a5a', '#7a7d52', '#9a9564']) && !hasCol(c, ['#5a5048'])) out.reeds = c;
      else if (!out.willows && hasCol(c, ['#8f9488']) && hasCol(c, ['#5a5048'])) out.willows = c;
      else if (!out.walk && near(c, (MS.BW.ax + MS.BW.bx) / 2, (MS.BW.az + MS.BW.bz) / 2, 3) && hasCol(c, ['#6f5a46', '#7a6450'])) out.walk = c;
    }
    // the great lantern's column (in Candil's group): a mesh right over the lantern's spot
    const nr = O.near || null; out.lanternMeshes = [];
    if (nr) for (const c of nr.children) if (c.isMesh && c.geometry && !c.geometry.parameters && near(c, MS.LANTERN.x, MS.LANTERN.z, 0.9)) { if (!c.geometry.boundingSphere) c.geometry.computeBoundingSphere(); if (c.geometry.boundingSphere.radius < 4) out.lanternMeshes.push(c); }
    if (O.lantern) out.lanternMeshes.push(O.lantern.pane, O.lantern.glow);
    return (MM = out);
  }
  function hideToday(api, o = {}) {
    const g = G(), Bm = B(); if (!Bm) return [];
    const out = [], hide = obj => { if (obj && obj.visible !== false) { api.hide(obj); out.push(obj); } };
    (Bm.people || []).forEach(p => hide(p.root));
    const Mm = marshMeshes();
    hide(Mm.wisps);
    if (o.past) hide(Mm.mist);
    for (const ob of g.w3d.scene.children) if (ob.visible && /^(read|diary|townlife|tl-|store|signs?-)/i.test(ob.name || '') && Math.hypot(ob.position.x - CEN.x, ob.position.z - CEN.z) < 70) hide(ob);
    brunoAway(true);
    return out;
  }
  // the story's Bruno (sim npc 'bruno') waits in Candil after Chapter 1: in another world he's parked far away, and put back after
  let brunoKeep = null;
  function brunoAway(on) {
    const g = G(); if (!g || !g.sim || !g.sim.npc) return;
    const Bn = g.sim.npc('bruno'); if (!Bn) return;
    const solid = WORLD.extra.find(c => c.npc === 'bruno');
    if (on && !brunoKeep) {
      if (Math.hypot(Bn.x - CEN.x, Bn.z - CEN.z) > RAD + 20) return;
      brunoKeep = { x: Bn.x, z: Bn.z, y: Bn.y, yaw: Bn.yaw };
      Bn.x = OFF; Bn.z = OFF; if (solid) { solid.x = OFF; solid.z = OFF; }
    } else if (!on && brunoKeep) {
      Object.assign(Bn, { x: brunoKeep.x, z: brunoKeep.z, y: brunoKeep.y }); if (brunoKeep.yaw !== undefined) Bn.yaw = brunoKeep.yaw;
      if (solid) { solid.x = brunoKeep.x; solid.z = brunoKeep.z; }
      brunoKeep = null;
    }
  }
  let paT = 0;
  function showToday(dt, keepHidden) {
    const g = G(), Bm = B(); if (!Bm || !Bm.group) return;
    const room = g.indoorMod && g.indoorMod(); if (room && room !== TIME) return;
    Bm.group.visible = true; paT += dt;
    const Y = g.sim.you;
    try { Bm.update(dt, paT, { x: Y.x, z: Y.z, y: Y.ry }); } catch (e) { /* */ }
    if (keepHidden) for (const o of keepHidden) if (o) o.visible = false;      // (the marsh's own update may show its people again)
    if (brunoKeep) { const Bn = g.sim.npc && g.sim.npc('bruno'); if (Bn && Bn.x !== OFF) { brunoKeep = null; brunoAway(true); } }
  }

  // ------------------------------------------------------------ Noa, through the crack at Candil's landing (DESIGN.md 18.5): her lines are
  // in English and Spanish here; marsh_text_pt.js … _ja.js add theirs (MARSHT.add)
  const TXT = {
    'noa.open1': L('It’s Noa! Can you hear me? Here at the foot of the Old Tower… this is the last place. Elio’s last two echoes are here: one long ago, one tomorrow.',
      '¡Soy Noa! ¿Me oyes? Aquí, al pie de la Torre Vieja… este es el último lugar. Aquí están los dos últimos ecos de Elio: uno en el ayer, otro en el mañana.'),
    'noa.open2': L('Long ago there was no marsh here. There was a clear {w.lf_lake}, and Candil was the lamplighters’ village. Elio lived here for a year, ten years after the concert, a young man by then. The gray had followed him all that time. And on {w.mhp_lanternnight}, something happened… and the gray came down over the lake, and it never left.',
      'Hace mucho, aquí no había ninguna ciénaga. Había un lago claro, y Candil era el pueblo de los faroleros. Elio vivió aquí un año, diez años después del concierto, ya casi un hombre. Lo gris lo había seguido todo ese tiempo. Y en la Noche de los Faroles algo pasó… y lo gris bajó sobre el lago, y ya nunca se fue.'),
    'noa.open3': L('Step into the Past and listen to the people who were there. This time, tell the whole story: what was going on, what happened, what had happened before, and what people said. Through the crack on the road in, or this one.',
      'Entra en el Ayer y escucha a la gente que estuvo allí. Esta vez, cuenta la historia entera: lo que pasaba, lo que pasó, lo que ya había pasado y lo que dijo la gente. Por la grieta del camino, o por esta.'),
    'noa.past1': L('«Only fog came out.» It was never a monster. It was a child’s silence… that grew up with him. That night it settled on the lake, and at dawn he climbed to the tower.',
      '«Solo salió niebla.» No era un monstruo. Era el silencio de un niño… que creció con él. Esa noche se quedó sobre el lago, y al amanecer él subió a la torre.'),
    'noa.past2': L('Now tomorrow. If nobody speaks up, Candil turns to stone: the water gone, the willows and the people too. Only Lucero still talks. Through the crack on the causeway, or this one.',
      'Ahora, el mañana. Si nadie habla, Candil se vuelve de piedra: sin agua, los sauces y la gente también. Solo Lucero habla todavía. Por la grieta al pie del camino de piedra, o por esta.'),
    'noa.fut1': L('«I’d laugh with you… and keep on talking.» Did you hear that? That’s the end of his speech. All eighteen of his words are free.',
      '«Me reiría con ustedes… y seguiría hablando.» ¿Lo oíste? Ese es el final de su discurso. Las dieciocho palabras de Elio están libres.'),
    'noa.fut2': L('He’s up there, in the {w.tower}. Take him his words. I’ll be at the {w.clock}: I’ll hear you.',
      'Está arriba, en la torre. Llévale sus palabras. Yo estaré en el reloj: te oiré.'),
  };
  // Elio's last two echoes (CH4.word): the Past's, the young man on Lantern Night, ten years after the concert, the moment no word came
  // (the gray that had followed him since then settled on the lake); the Future's, the man, ready to go back up on the stage where
  // they laughed
  const ECHO = {
    past: L('I had written my words, and everyone was waiting. I opened my mouth… and only fog came out.', 'Había escrito mis palabras, y todos esperaban. Abrí la boca… y solo salió niebla.',
      'Eu tinha escrito as minhas palavras, e todos esperavam. Abri a boca… e só saiu névoa.', 'Ich hatte meine Worte aufgeschrieben, und alle warteten. Ich öffnete den Mund … und es kam nur Nebel heraus.',
      '[我|wǒ] [早就|zǎo jiù] [把|bǎ] [要|yào] [说|shuō] [的|de] [话|huà] [写|xiě] [好|hǎo] [了|le] ， [大家|dà jiā] [都|dōu] [在|zài] [等|děng] 。 [我|wǒ] [张开|zhāng kāi] [嘴|zuǐ] … [出来|chū lai] [的|de] [却|què] [只有|zhǐ yǒu] [雾|wù] 。',
      '[言|い]いたい こと は 、 もう [書|か]いて あった 。 みんな 、 [待|ま]って いた 。 [口|くち] を [開|あ]けたら … [出|で]て きた の は 、 [霧|きり] だけ だった 。', { where: 'the Gray Marsh, long ago' }),
    future: L('If someone laughed again, I’d laugh with you… and keep on talking.', 'Si alguien volviera a reírse, me reiría con ustedes… y seguiría hablando.',
      'Se alguém risse de novo, eu riria junto com vocês… e continuaria falando.', 'Wenn wieder jemand lachen würde, würde ich einfach mitlachen … und weiterreden.',
      '[要是|yào shi] [再|zài] [有人|yǒu rén] [笑|xiào] ， [我|wǒ] [就|jiù] [跟|gēn] [你们|nǐ men] [一起|yī qǐ] [笑|xiào] … [然后|rán hòu] [接着|jiē zhe] [说|shuō] [下去|xià qu] 。',
      'もし また だれ か が [笑|わら]ったら 、 ぼく も いっしょ に [笑|わら]って … そのまま [話|はな]しつづける でしょう 。', { where: 'the Gray Marsh, tomorrow' }),
  };
  if (typeof CH4 !== 'undefined') { CH4.word('marsh', 'past', ECHO.past); CH4.word('marsh', 'future', ECHO.future); }

  // Noa's voice comes out of the crack: it flares while she talks (its glow swells), and her name tag is hers
  let flare = 0;
  function noaP() { const c = CRACK.gate, y = gy(c.x, c.z); return { id: 'noa', name: nameOf(NOA), x: c.x, y: y + 0.3, z: c.z, top: 2.5, talking: false }; }
  async function noaSay(key) { flare = 1; snd('chime'); const p = noaP(); try { G().w3d.fx.sparkle(p.x, p.y + 1.4, p.z, 12, ['#bfe4ff', '#fff3c8', '#ffd77a']); } catch (e) { /* */ } await say(p, TXT[key]); }
  function lookGate() { const c = CRACK.gate, y = gy(c.x, c.z), Y = G().sim.you, dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1; shot(V(c.x + dx / d * 5.2 + dz / d * 2.4, y + 2.4, c.z + dz / d * 5.2 - dx / d * 2.4), V(c.x, y + 1.5, c.z), 1.0); }
  // the crack card's examples, each language's own: the scene, what had happened before, what someone said, a what-if
  const CRACK_EX = { es: ['estaba encendiendo… cuando se apagaron', 'ya se había ido', 'dijo que iba a hablar', 'si cantaras, la campana te respondería'] };
  async function crackCard() {
    css();
    const l = lang(), nm = w => { const t = TIME.RULES[w].name[l] || TIME.RULES[w].name.en; return isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t); };
    const ex = (CRACK_EX[l] || CRACK_EX.es).map(t => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t)));
    await UI.card(`<div class="tag">The Gray Marsh’s time cracks</div><div class="rows">`
      + `• On the <b>road in</b>, before the boardwalk: today ↔ «${nm('past')}», a clear lake, Candil the morning after Lantern Night.<br>`
      + `• On the <b>causeway</b>, just past Candil: today ↔ «${nm('future')}», the marsh if nobody speaks up: turned to stone.<br>`
      + `• Here, on <b>Candil’s south shore</b>, where the boardwalk comes in: all three. Noa’s voice comes through this one: report to her here.<br>`
      + `In the Past, tell the <b>whole story</b>, every past in its place: the scene («${ex[0]}»), what had happened before («${ex[1]}»), what people said («${ex[2]}»). In the Future, everyone turned to stone on a hopeless thought: <b>imagine out loud</b> what would happen («${ex[3]}»).</div><div class="sub">E</div>`, { kind: 'mh-card' });
  }
  async function noaOpen() {
    lock(true);
    try {
      lookGate(); await wait(0.9);
      await noaSay('noa.open1'); await noaSay('noa.open2'); await noaSay('noa.open3');
      flare = 0; await crackCard();
      TIME.seen('marsh.noa', true); G().save();
    } finally { flare = 0; lock(false); }
    think('Into the Past, to the old lamplighter at the Lantern House, in the middle of Candil. The crack on the road in leads there, and so does this one.', 6.5);
  }
  async function reportPast() {
    lock(true);
    try { lookGate(); await wait(0.6); await noaSay('noa.past1'); await noaSay('noa.past2'); st('past').reported = true; G().save(); } finally { flare = 0; lock(false); }
    think('Next: Candil tomorrow. The crack on the causeway leads there.', 5);
  }
  async function reportFuture() {
    lock(true);
    try {
      lookGate(); await wait(0.6); await noaSay('noa.fut1'); await noaSay('noa.fut2'); st('future').reported = true;
      try { if (typeof QUESTS !== 'undefined' && QUESTS.tick) QUESTS.tick(); } catch (e) { /* */ }
      G().save();
    } finally { flare = 0; lock(false); }
    think('All eighteen of Elio’s words. He’s up in the Old Tower… take them to him.', 6);
  }

  // ------------------------------------------------------------ the region: TIME dresses both worlds (marsh_past.js fills DRESS.past,
  // marsh_future.js DRESS.future); while you're inside a world's dungeon, the dungeon does its own look, so `look` steps aside
  const DRESS = {
    past: { edge: 'The memory ends at the lake’s far shore. Let’s stay where it happened.' },
    future: { edge: 'Past here there’s only stone, and stone, and stone. Let’s turn back.', k: () => (typeof MH_FUT !== 'undefined' && MH_FUT && MH_FUT.wakeShare ? 0.12 + 0.7 * MH_FUT.wakeShare() : 0.12) },
  };
  Object.defineProperty(DRESS.past, 'look', { get: () => (typeof MH_PHOUSE !== 'undefined' && MH_PHOUSE && MH_PHOUSE.inside ? null : 'past'), enumerable: true, configurable: true });
  Object.defineProperty(DRESS.future, 'look', { get: () => (typeof MH_FCHAPEL !== 'undefined' && MH_FCHAPEL && MH_FCHAPEL.inside ? null : 'future'), enumerable: true, configurable: true });
  Object.assign(TIME.STEPS, { pastall: 'a long story with every past in its place (the scene, what happened, what had happened before, what someone said)', siimpf: '«si» + the imperfect subjunctive + the conditional: what would happen (si hablara, cambiaría…)' });
  const songOf = w => () => {
    if (w === 'past') return typeof MH_PAST !== 'undefined' && MH_PAST && MH_PAST.song ? MH_PAST.song() : 'past';
    return typeof MH_FUT !== 'undefined' && MH_FUT && MH_FUT.song ? MH_FUT.song() : 'future';
  };
  TIME.region('marsh', {
    name: { now: 'The Gray Marsh', past: 'Candil, long ago', future: 'The Gray Marsh · tomorrow' },
    color: { past: '#c98a3a', future: '#6f6b84' },
    center: CEN, radius: RAD, inside,
    open: () => (typeof CH4 !== 'undefined' ? CH4.open('marsh') : false),
    grammar: { past: ['pastall'], future: ['siimpf'] },
    songs: { past: songOf('past'), future: songOf('future') },
    dress: DRESS,
    init: api => init(api),
    tick: (api, dt) => tick(dt),
    changed: (api, fw, tw) => {
      if (tw === 'now') brunoAway(false);
      for (const Mm of [typeof MH_PAST !== 'undefined' && MH_PAST, typeof MH_FUT !== 'undefined' && MH_FUT]) if (Mm && Mm.changed) { try { Mm.changed(fw, tw); } catch (e) { console.error('[marsh] changed', e); } }
    },
  });
  TIME.crack('marsh.road', { region: 'marsh', x: CRACK.past.x, z: CRACK.past.z, worlds: ['now', 'past'] });
  TIME.crack('marsh.cause', { region: 'marsh', x: CRACK.future.x, z: CRACK.future.z, worlds: ['now', 'future'] });
  TIME.crack('marsh.gate', { region: 'marsh', x: CRACK.gate.x, z: CRACK.gate.z, worlds: ['now', 'past', 'future'] });

  function init(api) {
    try { registerWords(); } catch (e) { console.error('[marsh] words', e); }
    try { addTab(); } catch (e) { console.error('[marsh] journal', e); }
    try { if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['ルセロ', 'タデオ', 'ラミロ', 'ロロ', 'マティ', 'ネベス', 'マリソル', 'カンディル', 'エリオ', 'ノア']); } catch (e) { /* */ }
    for (const [Mm, tag] of [[typeof MH_PAST !== 'undefined' && MH_PAST, 'past'], [typeof MH_FUT !== 'undefined' && MH_FUT, 'future'],
      [typeof MH_PHOUSE !== 'undefined' && MH_PHOUSE, 'lantern house'], [typeof MH_FCHAPEL !== 'undefined' && MH_FCHAPEL, 'stone chapel'], [typeof MHBOSS !== 'undefined' && MHBOSS, 'bosses']])
      if (Mm && Mm.init) { try { Mm.init(api.G, api); } catch (e) { console.error('[marsh] init ' + tag, e); } }
  }

  // ------------------------------------------------------------ every frame, in any world: Noa (her first words here, the reports)
  let idle = 0;
  const busyNow = g => STORY.busy || STORY.line || g.sim.lock || g.journalOpen || g.state.teaching || TIME.busy
    || document.body.classList.contains('in-battle') || document.body.classList.contains('on-title') || (g.indoorMod && g.indoorMod() && g.indoorMod() !== TIME);
  function tick(dt) {
    const g = G(); if (!g || !g.state) return;
    flare = Math.max(0, flare - dt * 0.35);
    const Mv = TIME._.VIS && TIME._.VIS['marsh.gate']; if (Mv && Mv.glow) { const k = 1 + flare * 0.9; Mv.glow.scale.set(3.4 * k, 4.2 * k, 1); }
    if (!TIME.open('marsh') || busyNow(g)) { idle = 0; return; }
    const w = TIME.world(), Y = g.sim.you, c = CRACK.gate, d = Math.hypot(Y.x - c.x, Y.z - c.z), s = g.state;
    const P = sp(s), F = sf(s);
    let run = null;
    if (w === 'now' && !TIME.seen('marsh.noa') && d < 7) run = noaOpen;
    else if (d < 3.4 && (w === 'now' || TIME.regionNow() === 'marsh')) {
      if (echoIn(s, 'past') && !P.reported) run = reportPast;
      else if (echoIn(s, 'future') && !F.reported && P.reported) run = reportFuture;
    }
    if (!run) { idle = 0; return; }
    if ((idle += dt) < 0.6) return;
    idle = 0; STORY.run(run);
  }

  // ------------------------------------------------------------ Chapter 4 here: the main quest's steps, in order (CH4.ORDER: the last)
  // where the compass points: someone in the world they're in, or the crack that leads there from where you are
  function via(want, whoFn) {
    const w = TIME.world(), C = TIME.CRACKS;
    if (w === want) return whoFn ? whoFn() : null;
    const c = want === 'past' ? (w === 'future' ? C['marsh.gate'] : C['marsh.road'])
      : want === 'future' ? (w === 'past' ? C['marsh.gate'] : C['marsh.cause'])
      : (w === 'past' ? C['marsh.road'] : C['marsh.cause']);
    const nm = { past: 'the Past', future: 'the Future', now: 'today' }[want];
    return c ? { x: c.x, z: c.z, hint: `{mimo} looks at the time crack: ${nm} is through there.` } : null;
  }
  const gateT = () => ({ x: CRACK.gate.x, z: CRACK.gate.z, hint: '{mimo} looks at the time crack on Candil’s south shore. Noa’s voice is in it.' });
  // examples inside English text (steps, quests, hints): each language's own (marsh_text_*.js add theirs), zh / ja in the mode's text
  const SX = {
    scene: { es: ['todos estaban esperando', 'el lago estaba quieto'] },
    before: { es: ['ya se había ido', 'había escrito sus palabras'] },
    said: { es: ['dijo que iba a hablar'] },
    mem: { es: ['{mimo} empujó el barril'] },
    story: { es: ['mientras la niebla entraba, él subió'] },
    si: { es: ['si cantaras, todos te oiríamos', 'si hubiera agua, las ranas cantarían'] },
    mif: { es: ['si la puerta fuera de madera, {mimo} la empujaría'] },
    note: { es: ['Ramiro dijo que no se reía de él'] },
    warn: { es: ['si alguien le enseñara la canción de la tarde a Mati, la campana nunca se callaría'] },
  };
  function sx(k, labels) {
    const l = lang(), a = (SX[k] || {})[l] || (SX[k] || {}).es || [];
    return a.map((t, i) => { let s = fillMimo(t, l); if (isCl(l)) s = plainT(s); return `«${s}»` + (labels && labels[i] ? ` (${labels[i]})` : ''); }).join(', ');
  }
  const pastT = id => () => via('past', () => (typeof MH_PAST !== 'undefined' && MH_PAST ? MH_PAST.target(id) : null));
  const futT = id => () => via('future', () => (typeof MH_FUT !== 'undefined' && MH_FUT ? MH_FUT.target(id) : null));
  const HEARD = ['mayor', 'ferry', 'marisol', 'ramiro'];
  const heardN = s => HEARD.filter(k => sp(s).heard && sp(s).heard[k]).length;
  const WAKE = ['marisol', 'ramiro', 'lolo', 'mati'];
  const wokeIn = (s, list) => list.filter(k => sf(s).woke && sf(s).woke[k]).length;
  const PSTEPS = [
    { _tt: true, text: 'The Gray Marsh: listen to Noa at the time crack on Candil’s south shore',
      why: 'Since the Sunken Ruins’ two echoes came home, something shimmers in Candil, where the boardwalk comes in. Noa’s voice is in it. (The old north road, past the cemetery’s gate.)',
      done: s => seenIn(s, 'marsh.noa'), target: gateT, hint: '{mimo} sniffs the air on Candil’s south shore. A shimmer… and lamp oil?' },
    { _tt: true, get text() { return fillEn('In the Past: find {luz}, the old lamplighter, at the Lantern House'); },
      get why() { return fillEn('Long ago, Candil stood on a clear lake. Last night was Lantern Night… and this morning a gray mist lies on the water, and the quiet young man who lived here is gone. {luz} taught him to light the lamps. Through the crack on the road in, or the one on the south shore.'); },
      done: s => !!sp(s).met, target: pastT('luz'), hint: '{mimo} points at an old woman with a lamplighter’s pole, by the tall tower in the middle of Candil.' },
    { _tt: true, get text() { return fillEn(`Hear what happened last night ({n}/4)`); }, n: s => heardN(s),
      get why() { return fillEn(`{luz} wasn’t on the jetty. {mayor}, {ferry}, little {marisol} and little {ramiro} were. Each one tells a piece, and asks you something: the scene (${sx('scene')}), what had happened (${sx('before')}), what someone said (${sx('said')}).`); },
      done: s => heardN(s) >= 4, target: () => via('past', () => (typeof MH_PAST !== 'undefined' && MH_PAST ? MH_PAST.target('heard') : null)), hint: '{mimo} tugs your sleeve toward someone of then.' },
    { _tt: true, get text() { return fillEn('Tell {luz} the whole story, from the beginning'); },
      get why() { return fillEn('Every past in its place: what was going on, what he had done, what happened, what he had said.'); },
      done: s => !!sp(s).told, target: pastT('luz'), hint: '{mimo} points at the old lamplighter by the Lantern House.' },
    { _tt: true, text: 'The Lantern House: follow his light up ({n}/3)', n: s => Math.min(3, sp(s).floors || 0),
      get why() { return fillEn(`The fog got into the Lantern House and is eating its light. On each floor, tell what happened there, and tell {mimo} what it did, as a memory (${sx('mem')}).`); },
      done: s => (sp(s).floors || 0) >= 3, target: pastT('house'), hint: '{mimo} looks at the Lantern House’s door.' },
    { _tt: true, text: 'At the top: face the Lantern Moth and free Elio’s echo',
      why: 'Something up in the lantern room is drinking the light… a great gray moth.',
      done: s => echoIn(s, 'past'), target: pastT('house'), hint: '{mimo} looks up at the dark lantern room. Flutter?' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack on Candil’s south shore',
      why: 'Elio’s echo is free. Tell Noa: her voice comes through the crack on the south shore, in any of the three times.',
      done: s => !!sp(s).reported, target: gateT, hint: '{mimo} looks at the time crack on the south shore.' },
  ];
  const FSTEPS = [
    { _tt: true, text: 'In the Future: find Lucero, the last lamplighter',
      why: 'Tomorrow the marsh is stone: the water gone, the willows, the reeds, the people. One lantern is still lit in Candil. Through the crack on the causeway, or the one on the south shore.',
      done: s => !!sf(s).met, target: futT('lucero'), hint: '{mimo} points at the one warm light in Candil… and someone holding it.' },
    { _tt: true, text: 'Imagine them out of the stone ({n}/4)', n: s => wokeIn(s, WAKE),
      get why() { return fillEn(`Each one turned to stone on a hopeless thought. Answer it with a what-if, out loud: ${sx('si')}.`); },
      done: s => wokeIn(s, WAKE) >= 4, target: () => via('future', () => (typeof MH_FUT !== 'undefined' && MH_FUT ? MH_FUT.target('wake') : null)), hint: '{mimo} tugs your sleeve toward someone of stone.' },
    { _tt: true, text: 'Light the great lantern, all of you together',
      why: 'Lucero has an idea: if everyone imagined it at once… the stone might crack.',
      done: s => !!sf(s).lit, target: futT('lantern'), hint: '{mimo} looks at the great lantern, cold and gray.' },
    { _tt: true, text: 'The Stone Chapel ({n}/3)', n: s => Math.min(3, sf(s).floors || 0),
      get why() { return fillEn(`Inside, everything is stone. Plans bounce off it… but imagine it as something else, and it is: ${sx('mif')}.`); },
      done: s => (sf(s).floors || 0) >= 3, target: futT('chapel'), hint: '{mimo} looks down the causeway at the stone chapel.' },
    { _tt: true, text: 'In the belfry: face the Stone Gargoyle and free Elio’s last echo',
      why: 'A gargoyle of stone sits on the stone bell. Stone can’t be hurt… unless you imagine it can.',
      done: s => echoIn(s, 'future'), target: futT('chapel'), hint: '{mimo} looks up at the chapel’s belfry.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack on Candil’s south shore',
      why: 'All of Elio’s echoes are free. Tell Noa, at the crack on the south shore.',
      done: s => !!sf(s).reported, target: gateT, hint: '{mimo} looks at the time crack on the south shore.' },
  ];
  if (typeof CH4 !== 'undefined') {
    CH4.steps('marsh', 'past', PSTEPS);
    CH4.steps('marsh', 'future', FSTEPS);
    CH4.story('marsh', [
      { when: s => seenIn(s, 'marsh.noa'), text: 'Noa’s voice came through a crack on Candil’s south shore: the last two of Elio’s echoes are here, at the foot of the Old Tower.' },
      { when: s => !!sp(s).told, text: 'Long ago, on Lantern Night, ten years after the concert, the quiet young man had written his words: he was going to speak in front of everyone. A frog hopped onto the planks, little Ramiro laughed at it, and the laugh brought the concert back. No word came. His lantern sank, and the Hush that had followed him since the concert settled over the clear lake. At dawn he climbed to the Old Tower.' },
      { when: s => echoIn(s, 'past'), text: 'At the top of the Lantern House, the Lantern Moth heard the night told right and gave back Elio’s words: he had opened his mouth… and only fog came out. It was never a monster: a child’s silence, grown up with him.' },
      { when: s => !!sf(s).met, text: 'Tomorrow, the marsh has turned to stone, and so has everyone in Candil, each on a hopeless thought. Only Lucero still talks, and keeps one lantern lit.' },
      { when: s => echoIn(s, 'future'), text: 'In the Stone Chapel’s belfry, the Stone Gargoyle let its fears go. Elio’s last words: if someone laughed again, he’d laugh along… and keep on talking.' },
    ]);
  }

  // ------------------------------------------------------------ the words of both worlds (MHPTXT.WORDS, MHFTXT.WORDS): registered in
  // Mimo's memory (caves.js's way), met in the lines, the demonstrations and the Looks, listed in the journal
  const wordLists = () => [typeof MHPTXT !== 'undefined' ? MHPTXT.WORDS || [] : [], typeof MHFTXT !== 'undefined' ? MHFTXT.WORDS || [] : []];
  function registerWords() {
    if (typeof LEX === 'undefined') return 0;
    let n = 0;
    for (const list of wordLists()) { const add = list.filter(w => !LEX.item(w.id)).map(w => Object.assign({ kind: 'word' }, w)); LEX.register(add); n += add.length; }
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const list of wordLists()) for (const w of list) for (const l of ['zh', 'ja']) if (w[l]) CJK.addSource(w[l]); } catch (e) { /* */ }
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const T0 of [typeof MHPTXT !== 'undefined' && MHPTXT, typeof MHFTXT !== 'undefined' && MHFTXT]) if (T0) for (const tab of [T0.LINES, T0.DEMO]) for (const x of Object.values(tab || {})) for (const l of ['zh', 'ja']) if (x && x[l]) CJK.addSource(x[l]); } catch (e) { /* */ }
    return n;
  }
  function wordsHTML() {
    css();
    const l = lang(), [P, F] = wordLists(), seen = id => typeof LEX !== 'undefined' && LEX.seen(id);
    const row = w => { const t = w[l] || ''; return `<li class="${seen(w.id) ? '' : 'no'}">${seen(w.id) ? '✓ ' : ''}<b>${tHTML(t, l)}</b> <span class="en">${esc(w.en)}</span></li>`; };
    const n = list => list.filter(w => seen(w.id)).length;
    return `<div class="mt"><h4 class="ph-h">Marsh words <small>${n(P) + n(F)} / ${P.length + F.length}</small></h4><p class="note">Candil long ago and the marsh tomorrow: every word you meet there, in the lines, the demonstrations and the things you look at, the land itself too (✓ once you’ve met it). Mimo keeps them for review.</p>`
      + `<h5>Long ago <small>${n(P)} / ${P.length}</small></h5><ul class="mh-words">${P.map(row).join('')}</ul>`
      + `<h5>Tomorrow <small>${n(F)} / ${F.length}</small></h5><ul class="mh-words">${F.map(row).join('')}</ul></div>`;
  }
  function addTab() {
    if (typeof UI === 'undefined') return;
    UI.journalTabs = UI.journalTabs || [];
    if (UI.journalTabs.some(t => t.id === 'mh-words')) return;
    UI.journalTabs.push({ id: 'mh-words', group: 'words', label: () => (G() && TIME.open('marsh') && TIME.seen('marsh.noa') ? 'Marsh words' : null), html: () => wordsHTML(), wire() { /* */ } });
  }

  // ------------------------------------------------------------ the language packs: marsh_text_pt.js … _ja.js merge their lines in.
  // MARSHT.add(lang, { TXT: { key: text }, SX: { key: [...] }, CRACK_EX: [...] })
  function add(l, pack) {
    if (!pack) return;
    for (const [k, t] of Object.entries(pack.TXT || {})) if (TXT[k]) TXT[k][l] = t;
    for (const [k, a] of Object.entries(pack.SX || {})) (SX[k] || (SX[k] = {}))[l] = a;
    if (pack.CRACK_EX) CRACK_EX[l] = pack.CRACK_EX;
  }

  // ------------------------------------------------------------ every zh / ja string against CJK.md's rules, every language there: [] when
  // all's well
  function check(o = {}) {
    if (typeof CJK === 'undefined' || !CJK.validate) return ['no CJK'];
    const out = [], LL = o.langs || LANGS;
    const v = (s, l, where) => {
      if (!s || typeof s !== 'string' || !/[[぀-ヿ一-鿿]/.test(s)) return;
      if (/[A-Za-z]{2,}/.test(s.replace(/\[[^\]]*\]/g, '').replace(/\{[^}]*\}/g, ''))) return;     // (an English tip or note that quotes a word)
      const p = CJK.validate(s.replace(/\*/g, '').replace(/\{[^}]+\}/g, l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ').replace(/___/g, l === 'zh' ? '[它|tā]' : 'それ'), l);
      if (p.length) out.push(`${where} (${l}): ${p.join('; ')} «${s}»`);
    };
    const under = (x, l, where) => { if (typeof x === 'string') v(x, l, where); else if (Array.isArray(x)) x.forEach((y, i) => under(y, l, where + '.' + i)); else if (x && typeof x === 'object') for (const [k, y] of Object.entries(x)) { if (k !== 'cl' && k !== 'cls') under(y, l, where + '.' + k); } };
    const seenO = new Set();
    const walk = (o2, where, depth = 0) => {
      if (!o2 || typeof o2 !== 'object' || seenO.has(o2) || depth > 9) return; seenO.add(o2);
      if (Array.isArray(o2)) { o2.forEach((y, i) => walk(y, where + '.' + i, depth + 1)); return; }
      for (const [k, y] of Object.entries(o2)) {
        if (k === 'cl' || k === 'cls' || k === 'tips' || k === 'TIPS' || k === 'DTIPS') continue;
        if (k === 'zh' || k === 'ja') under(y, k, where + '.' + k);
        else if (y && typeof y === 'object') walk(y, where + '.' + k, depth + 1);
      }
    };
    walk({ TXT, ECHO, NOA, CRACK_EX, SX }, 'mht');
    for (const [Mm, tag] of [[typeof MH_PHOUSE !== 'undefined' && MH_PHOUSE, 'lantern house'], [typeof MH_FCHAPEL !== 'undefined' && MH_FCHAPEL, 'stone chapel']]) if (Mm && Mm.ROOM_LINES) walk(Mm.ROOM_LINES, tag);
    if (typeof MHPTXT !== 'undefined') walk(MHPTXT, 'past');
    if (typeof MHFTXT !== 'undefined') walk(MHFTXT, 'future');
    if (typeof MHMUSIC !== 'undefined' && MHMUSIC.TEXT) walk(MHMUSIC.TEXT, 'music');
    // (every language there: each line, demonstration, mark list, card, task's frame and model, fight line and name)
    const need = (T, where) => { for (const l of LL) if (T && typeof T === 'object' && T.en !== undefined && (T[l] === undefined || T[l] === '')) out.push(`${where}: no ${l}`); };
    for (const [k, T] of Object.entries(TXT)) need(T, 'mht.TXT.' + k);
    for (const [T0, tag] of [[typeof MHPTXT !== 'undefined' && MHPTXT, 'past'], [typeof MHFTXT !== 'undefined' && MHFTXT, 'future']]) {
      if (!T0) continue;
      for (const tab of ['CAST', 'LINES', 'DEMO', 'FIGHT', 'NAMES', 'HUSHED']) for (const [k, T] of Object.entries(T0[tab] || {})) need(T, `${tag}.${tab}.${k}`);
      for (const [k, Mk] of Object.entries(T0.MARKS || {})) for (const l of LL) if (!Mk[l]) out.push(`${tag}.MARKS.${k}: no ${l}`);
      for (const [k, C] of Object.entries(T0.CARDS || {})) for (const l of LL) if (!C[l]) out.push(`${tag}.CARDS.${k}: no ${l}`);
      for (const [k, T] of Object.entries(T0.TASKS || {})) for (const l of LL) { if (!(T.frame || {})[l]) out.push(`${tag}.TASKS.${k}: no frame ${l}`); if (!(T.model || {})[l]) out.push(`${tag}.TASKS.${k}: no model ${l}`); if (!((T.want || {})[l] || []).length) out.push(`${tag}.TASKS.${k}: no want ${l}`); }
      for (const [k, T] of Object.entries(T0.MEM || {})) for (const l of LL) { if (!(T.frame || {})[l]) out.push(`${tag}.MEM.${k}: no frame ${l}`); if (!(T.model || {})[l]) out.push(`${tag}.MEM.${k}: no model ${l}`); }
      if (T0.LORE) for (const l of LL) if (!T0.LORE[l]) out.push(`${tag}.LORE: no ${l}`);
      for (const l of LL) if (T0.SPECIES && !T0.SPECIES[l]) out.push(`${tag}.SPECIES: no ${l}`);
    }
    // (the hushed lines: as many *starred* words in each language as in the English)
    for (const T0 of [typeof MHPTXT !== 'undefined' && MHPTXT, typeof MHFTXT !== 'undefined' && MHFTXT]) for (const tab of ['LINES', 'HUSHED']) for (const [k, T] of Object.entries((T0 && T0[tab]) || {})) {
      const n = s => (String(s || '').match(/\*[^*]+\*/g) || []).length, ne = n(T.en); if (!ne) continue;
      if ((String(T.en).match(/\*[^*]+\*/g) || []).some(x => /\s/.test(x))) out.push(`${k} (en): a starred phrase; the English stars one word each (story.js hushLine)`);
      for (const l of LL) if (T[l] !== undefined && n(T[l]) !== ne && !T['en_' + l]) out.push(`${k} (${l}): ${n(T[l])} starred words, the English has ${ne}`);
    }
    // (every {w.*} slot in an English line is a word Mimo knows; no word id shared between the two worlds or with anyone else's, and no
    // new word whose Spanish is already another word's)
    if (typeof LEX !== 'undefined') {
      const ids = new Set();
      const slots = (o2, where) => { for (const [k, T] of Object.entries(o2 || {})) { const en = String((T && T.en) || ''); let m; SLOT.lastIndex = 0; while ((m = SLOT.exec(en))) if (!LEX.item(m[1])) out.push(`${where}.${k}: no word «${m[1]}»`); } };
      const mine = new Set(wordLists().flat().map(w => w.id)), esOf = new Map();
      for (const id of LEX.ids()) { if (mine.has(id)) continue; const it = LEX.item(id); if (it && it.es) { const k = nrm(String(it.es)).replace(/^(el|la|los|las) /, ''); if (!esOf.has(k)) esOf.set(k, id); } }
      for (const [T0, tag] of [[typeof MHPTXT !== 'undefined' && MHPTXT, 'past'], [typeof MHFTXT !== 'undefined' && MHFTXT, 'future']]) {
        if (!T0) continue; slots(T0.LINES, tag + '.LINES'); slots(T0.DEMO, tag + '.DEMO'); slots(T0.FIGHT, tag + '.FIGHT'); slots(T0.HUSHED, tag + '.HUSHED');
        for (const w of T0.WORDS || []) {
          if (ids.has(w.id)) out.push(`${tag}: word id ${w.id} twice`); ids.add(w.id);
          for (const l of LANGS) if (!w[l]) out.push(`${tag}: ${w.id} has no ${l}`);
          const k = nrm(String(w.es || '')).replace(/^(el|la|los|las) /, ''); if (esOf.has(k)) out.push(`${tag}: ${w.id} «${w.es}» is already ${esOf.get(k)}`);
        }
      }
      slots(TXT, 'mht.TXT');
      for (const [Mm, tag] of [[typeof MH_PHOUSE !== 'undefined' && MH_PHOUSE, 'lantern house'], [typeof MH_FCHAPEL !== 'undefined' && MH_FCHAPEL, 'stone chapel']]) if (Mm && Mm.ROOM_LINES) slots(Mm.ROOM_LINES, tag);
    }
    return out;
  }

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the save goes to the test slot)
  // setup(o): the Sunken Ruins' setup with every earlier region's path done (RUINT._.t.setup()), the Ruins finished and reported with
  // both echoes, today's marsh as Chapter 1 left it (bell 8 rung, the chapel's finale, Lucero's report), the marsh open; o.seen ===
  // false: Noa's first words still to come
  function setup(o = {}) {
    if (typeof RUINT !== 'undefined' && RUINT && RUINT._ && RUINT._.t && RUINT._.t.setup) {
      RUINT._.t.setup();
      try { if (RUINT._.t.at) RUINT._.t.at('future.top'); } catch (e) { console.error('[marsh] setup ruins', e); }
    }
    try { TIME.state('ruins', 'past').reported = true; TIME.state('ruins', 'future').reported = true; } catch (e) { /* */ }
    if (typeof CH4 !== 'undefined') { CH4._.t.give('ruins', 'past'); CH4._.t.give('ruins', 'future'); }
    try { TIME.flag('future', 'ruFree', true); } catch (e) { /* */ }
    const g = G(), f = g.state.flags;
    Object.assign(f, { marsh: true, marshBruno: true, lucero: true, marshFog: true, bwJump: true, candil: true, marshPairs: true, marshLantern: true, marshLamps: true, chapelOpen: true, marshFree: true, luceroEighth: true });
    f.bells = Math.max(f.bells || 0, 8);
    const m = g.state.marsh || (g.state.marsh = {});
    Object.assign(m, { told: { twins: 'S', kids: 'S', singers: 'S' }, lamps: [true, true, true, true], fogSeen: true, bwDemo: true });
    try { if (typeof LEX !== 'undefined') for (const id of ['v.light', 'v.swim', 'v.climb', 'v.push', 'v.jump', 'v.hit', 'v.blow', 'v.dig']) if (LEX.item(id) && !LEX.taught(id)) LEX.attempt(id, { ok: true, hints: 0, ms: 3000, mode: 'teach' }); } catch (e) { /* */ }
    try { if (MARSH.sync) MARSH.sync(); } catch (e) { /* */ }
    if (typeof CH4 !== 'undefined') CH4._.t.openAll(true);
    if (o.seen !== false) TIME.seen('marsh.noa', true);
    const main = typeof QUESTS !== 'undefined' && QUESTS.LIST.find(q => q.id === 'main');
    if (main && !main.steps.some(x => x.ch4 === 'marsh')) {
      const i = main.steps.findIndex(x => x.ch4 === 'soon'); const add2 = PSTEPS.concat(FSTEPS);
      if (i >= 0) main.steps.splice(i, 0, ...add2); else main.steps.push(...add2);
    }
    TIME._.fast.on = true; TIME.refresh();
    return TIME.open('marsh');
  }
  const SPOTS = { house: { x: -12.0, z: -330.4 }, door: { x: -12.0, z: -330.4 }, jetty: { x: 0.6, z: -336.0 }, dock: { x: -25.0, z: -331.0 }, shrine: { x: -14.0, z: -343.6 }, chapel: { x: -39.8, z: -369.6 }, road: { x: 8.4, z: -296.4 }, tower: { x: 6.4, z: -366.0 } };
  function near(id) {
    const c = CRACK[id] || SPOTS[id]; if (!c) return null;
    const g = G(), Y = g.sim.you; Y.x = c.x + (CRACK[id] ? 1.3 : 0); Y.z = c.z - (CRACK[id] ? 1.0 : 0); g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
    return { x: Y.x, z: Y.z };
  }
  async function go(w, at2) { const p = at2 || { x: CRACK.gate.x + 1.4, z: CRACK.gate.z + 1.4, yaw: Math.PI }; const r = await TIME.go(w, { region: 'marsh', at: p, quick: true }); return r && TIME.world(); }
  // put the save at a step of the marsh's path (everything before it done): 'past.house' (the Lantern House next), 'past.top' (its boss
  // next), 'future' (the Past reported), 'future.chapel', 'future.top'
  function at(step) {
    const P = st('past'), F = st('future'), ph = P.house || (P.house = {}), fc = F.chapel || (F.chapel = {});
    TIME.seen('marsh.noa', true);
    Object.assign(P, { met: true, heard: { mayor: 'S', ferry: 'S', marisol: 'S', ramiro: 'S' }, told: 'S', storyParts: ['S', 'S', 'S', 'S'] });
    TIME.flag('past', 'mhOpen', true);
    if (step === 'past.house') { TIME.refresh(); return step; }
    Object.assign(ph, { seen0: true, seen1: true, seen2: true, r0: true, barrel: true, done0: true, ambush: true, r1: true, blow: true, done1: true, r2: true, lens: true, done2: true, memCard: true });
    P.floors = 3;
    if (step === 'past.top') { TIME.refresh(); return step; }
    Object.assign(ph, { seen3: true, boss: true, done3: true });
    if (typeof CH4 !== 'undefined') CH4._.t.give('marsh', 'past'); P.reported = true;
    if (step === 'future') { TIME.refresh(); return step; }
    Object.assign(F, { met: true, woke: { marisol: 'S', ramiro: 'S', lolo: 'S', mati: 'S' }, lit: 'S' });
    if (step === 'future.chapel') { TIME.refresh(); return step; }
    Object.assign(fc, { seen0: true, seen1: true, seen2: true, r0: true, door: true, done0: true, ambush: true, r1: true, done1: true, r2: true, slab: true, done2: true });
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
  // made readable, a trip that tries twice (and steps a frame first), a fight driven by phase (fn(pending kind, B) → text, or null)
  const T2 = {
    async talk(w, id, pick = 0) { const P = who(w, id); if (!P) return 'no ' + id; const g = G(); g.sim.you.x = P.x + 0.6; g.sim.you.z = P.z + 1.4; g.sim.snap(); await __g.go(0.3); const e = await drv().E('Talk'); await __g.go(0.4); if (document.querySelector('#choose button')) await drv().pick(pick); return e; },
    run: fn => new Promise(r => { STORY.run(async () => { try { await fn(); } finally { r(); } }); }),
    toast: () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).slice(-1)[0],
    fmt: L0 => (L0 || []).map(x => (x.card ? 'CARD ' + String(x.card).slice(0, 50) : x.box ? 'BOX ' + (x.box.title || '') : x.choose ? 'CHOOSE' : x.battle ? 'BATTLE' : (x.who || '') + ': ' + String(x.text || '').slice(0, 80))),
    async goSafe(w, at2) { await __g.go(0.1); let r = await go(w, at2); if (!r) { await __g.go(0.5); r = await go(w, at2); } await __g.go(0.4); return r && TIME.world(); },
    async fight(fn, sec = 30) {
      const Bt = BATTLE._.api, t0 = performance.now(), sent = [];
      while (performance.now() - t0 < sec * 1000) {
        if (!Bt.G.running && !document.body.classList.contains('in-battle')) break;
        if (Bt.G.running && !Bt.G.auto) Bt.G.auto = { timing: 'perfect', dodge: 'perfect', dialog: true };
        const pd = Bt.G.pending;
        if (pd && pd.kind === 'echo') { Bt.submit(pd.answer || ''); sent.push('(echo)'); }
        else if (pd && pd.kind === 'teach') { const w = isCl(lang()) ? plainT(LEX.src(pd.id)) : LEX.form(pd.id); Bt.submit(w); sent.push('(teach ' + pd.id + ')'); }
        else if (pd && pd.kind === 'command') { const t = fn(pd.kind, Bt); if (t == null) break; sent.push(t); Bt.submit(t); }
        await __g.go(0.2);
      }
      return { sent: sent.slice(-8), n: sent.length, running: Bt.G.running, inBattle: document.body.classList.contains('in-battle') };
    },
  };

  // both worlds' words go into Mimo's memory as the script loads (TIME.land.check and the journal can count on them), and again at init
  try { registerWords(); } catch (e) { console.error('[marsh] words', e); }
  return { CEN, RAD, CRACK, DRESS, TXT, ECHO, NOA, PSTEPS, FSTEPS, WAKE, HEARD, L, LANGS, isCl, lang, nameOf, enName, fillMimo, fillEn, cjRun, brRun, say, demo, hushed, think, you, frame2, lookAt, meet, introduce,
    card, css, grade, ask, story, memTask, has, person, who, lock, shot, wait, mimoName, plainT, down, st, sp, sf, sn, via, check, sx, SX, registerWords, inside, hideToday, showToday, marshMeshes, brunoAway, B, add, nrm,
    get flare() { return flare; }, set flare(v) { flare = v; },
    _: { noaOpen, reportPast, reportFuture, crackCard, tick, wordsHTML, t: Object.assign({ setup, near, go, probe, at, check: o => check(o), get drv() { return drv(); } }, T2) } };
})();
