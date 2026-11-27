'use strict';
// KIT: the radio quiz show's episode kit (A1, 2026-11-27; DESIGN.md 21.16). The show's hand-written episodes run out after
// three a band, so once a band's are all heard, QUIZ.week() asks the kit for the next one: a template from kit_<lang>.js,
// filled from slot banks (people, places, things, numbers, events, opinions) with a seeded pick. Episode n of band b is
// always the same episode, so its id («es.k3.7») is all the save keeps, and QUIZ's reruns rebuild it from there.
// The fills always agree: every bank entry carries its own forms (article, gender, number, the zh measure word, the ja
// counter), and templates only use those forms, never inflect. KIT.tests(l) builds a pile of episodes and checks each one.
//   KIT.add(lang, { banks: { name: [entry…] }, templates: [template…] })   kit_<lang>.js (the shape is at the top of kit_es.js)
//   KIT.on(lang) · next(band, heard) → episode · episode(id) → episode | null · build(lang, band, n) · strings(l) · check(l)
//   KIT.tests(l, per) → { ok, fails, counts }   (the game never calls it)
// A template:
//   { id, band, kind (quiz.js KIND), title: [text, en] | [[text, en]…] (variants),
//     slots: { name: 'bank' | { bank, tag } } (distinct entries per bank, in order),
//     lines: [[who, [text, en], [text, en]…]…]   who: a host id, or '$slot' (a guest: the entry's name, role, look, pitch, rate)
//     items: [item…] }   an item as in quiz.js (mc, tf, tfn, short, match), with {slot.field} anywhere; extra keys:
//       alt: [item…] (variants: one is picked) · mc pool: { slot, f, fe } (the right option is the slot's [f, fe], the wrong
//       ones two other entries' from the same bank) · want.number: '{slot.n}' (a number after the fill)
// Placeholders: {slot.field}, {slot.field^} (capital first letter: a sentence start). {mimo} is left for READ.fill.

const KIT = (() => {
  const L = () => READ.lang;
  const isCJ = l => l === 'zh' || l === 'ja';
  const C = {};
  const cache = new Map();
  function add(lang, def = {}) {
    const o = C[lang] || (C[lang] = { banks: {}, templates: [] });
    for (const [k, v] of Object.entries(def.banks || {})) o.banks[k] = v.map((e, i) => Object.assign({ id: e.id != null ? e.id : k + i }, e));
    for (const t of def.templates || []) { const i = o.templates.findIndex(x => x.id === t.id); if (i >= 0) o.templates[i] = t; else o.templates.push(t); }
    cache.clear();
    if (isCJ(lang) && typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(strings(lang).map(x => x.s)); } catch (e) { /* (the IME learns them later) */ } }
    return o;
  }
  const on = (l = L()) => !!(C[l] && C[l].templates.length);
  const tplsAt = (l, band) => (C[l] ? C[l].templates.filter(t => t.band === band) : []);

  // ------------------------------------------------------------ the seeded pick
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = s => [...String(s)].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);
  const pickOf = (arr, R) => arr[Math.floor(R() * arr.length) % arr.length];
  const variants = x => (Array.isArray(x) && Array.isArray(x[0]) ? x : [x]);
  const cap = s => (s ? s[0].toLocaleUpperCase() + s.slice(1) : s);

  // fill {slot.field} (and {slot.field^}) in a string from the episode's slots; a bank's own text may hold another slot's
  // placeholder («Participaron {n.w} personas»), so the fill runs until nothing changes
  function fillStr(s, V) {
    let out = String(s);
    for (let k = 0; k < 4; k++) {
      const next = out.replace(/\{(\w+)\.(\w+)(\^?)\}/g, (m, slot, f, up) => {
        const e = V[slot]; if (!e || e[f] == null) return m;
        const v = String(e[f]); return up ? cap(v) : v;
      });
      if (next === out) break; out = next;
    }
    return out;
  }
  function fillDeep(x, V) {
    if (typeof x === 'string') {
      const m = /^\{(\w+)\.(\w+)\}$/.exec(x);                       // (a lone placeholder for a list: want.lemmas: '{pb.doL}')
      if (m && V[m[1]] && Array.isArray(V[m[1]][m[2]])) return V[m[1]][m[2]].map(y => fillStr(y, V));
      return fillStr(x, V);
    }
    if (Array.isArray(x)) return x.map(y => fillDeep(y, V));
    if (x && typeof x === 'object') { const o = {}; for (const [k, v] of Object.entries(x)) o[k] = fillDeep(v, V); return o; }
    return x;
  }

  // ------------------------------------------------------------ building an episode: template t, slots, variants, items
  function pickSlots(l, t, R) {
    const B = C[l].banks, V = {}, used = {};
    for (const [name, spec0] of Object.entries(t.slots || {})) {
      const spec = typeof spec0 === 'string' ? { bank: spec0 } : spec0, bank = B[spec.bank] || [];
      const u = used[spec.bank] || (used[spec.bank] = new Set());
      let pool = bank.filter(e => !u.has(e.id) && (!spec.tag || (e.tags || []).includes(spec.tag)));
      if (!pool.length) pool = bank.filter(e => !spec.tag || (e.tags || []).includes(spec.tag));
      const e = pool.length ? pickOf(pool, R) : {};
      u.add(e.id); V[name] = e;
    }
    return V;
  }
  function makeItem(raw0, V, l, R) {
    const raw = raw0.alt ? pickOf([raw0].concat(raw0.alt.map(a => Object.assign({}, raw0, a, { alt: null }))), R) : raw0;
    const it = fillDeep(Object.assign({}, raw, { alt: undefined, pool: undefined }), V);
    delete it.alt; delete it.pool;
    if (raw.type === 'mc' && raw.pool) {
      const p = raw.pool, right = V[p.slot] || {}, bank = (C[l].banks[p.bank || p.slotBank] || C[l].banks[right._bank] || []);
      const rt = [String(right[p.f] || ''), String(right[p.fe] || '')];
      const others = []; const seen = new Set([rt[0]]), mix = bank.slice();
      for (let i = mix.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [mix[i], mix[j]] = [mix[j], mix[i]]; }
      for (const e of mix) {
        const v = String(e[p.f] || ''); if (!v || seen.has(v)) continue; seen.add(v); others.push([v, String(e[p.fe] || '')]); if (others.length >= 2) break;
      }
      it.opts = [rt].concat(others); it.key = 0;
    }
    if (it.want && typeof it.want.number === 'string') it.want.number = Number(it.want.number);
    return it;
  }
  function build(l, band, n) {
    const id = `${l}.k${band}.${n}`;
    if (cache.has(id)) return cache.get(id);
    const T = tplsAt(l, band); if (!T.length) return null;
    const t = T[(n - 1) % T.length], R = rng(hash(`${id}|${t.id}`));
    const V = pickSlots(l, t, R);
    for (const [name, spec0] of Object.entries(t.slots || {})) { const b = typeof spec0 === 'string' ? spec0 : spec0.bank; if (V[name]) V[name]._bank = b; }
    const title = fillDeep(pickOf(variants(t.title), R), V);
    const voices = {}, lines = [];
    for (const ln of t.lines) {
      const who0 = ln[0], v = fillDeep(pickOf(ln.slice(1), R), V);
      let who = who0;
      if (who0[0] === '$') {
        who = who0.slice(1); const e = V[who] || {};
        voices[who] = voices[who] || { name: e.label || e.name || who, role: e.role || 'a caller', look: e.look || { skin: '#e0b088', hair: '#3a2b26', dress: '#3f6fb5', bg: '#e6f0ff' }, pitch: e.pitch || 1, rate: e.rate || 1 };
      }
      lines.push({ who, text: v[0], en: v[1] || '' });
    }
    const items = (t.items || []).map(raw => makeItem(raw, V, l, R));
    const ep = { id, band, kind: t.kind || 'news', title: title[0], en: title[1] || '', voices, lines, items, lang: l, kit: t.id, n };
    cache.set(id, ep);
    return ep;
  }
  const parse = id => { const m = /^([a-z]{2})\.k([1-4])\.(\d+)$/.exec(String(id || '')); return m ? { l: m[1], band: +m[2], n: +m[3] } : null; };
  function episode(id) { const p = parse(id); return p && on(p.l) ? build(p.l, p.band, p.n) : null; }
  // the next episode at a band that the save hasn't heard (heard: QUIZ's S().eps)
  function next(band, heard = {}, l = L()) {
    if (!on(l) || !tplsAt(l, band).length) return null;
    for (let n = 1; n <= 999; n++) { const id = `${l}.k${band}.${n}`; if (!heard[id]) return build(l, band, n); }
    return null;
  }

  // ------------------------------------------------------------ checks (zh / ja notation) and tests
  function strings(l) {
    const c = C[l], out = []; if (!c) return out;
    const put = (where, s) => { if (typeof s === 'string' && s.trim()) out.push({ where, s, l }); };
    const walk = (where, x) => { if (typeof x === 'string') put(where, x); else if (Array.isArray(x)) x.forEach((v, i) => walk(`${where}[${i}]`, v)); else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) if (!['look', 'id', 'tags', 'en', 'pitch', 'rate', 'role'].includes(k) && !/En$|^en[A-Z]/.test(k)) walk(`${where}.${k}`, v); };
    for (const [k, bank] of Object.entries(c.banks)) bank.forEach((e, i) => walk(`bank.${k}[${i}]`, e));
    return out;
  }
  // (a template's own text is checked through the episodes it builds: tests() validates every built string)
  function check(l = L()) {
    const bad = []; if (typeof CJK === 'undefined' || !isCJ(l)) return bad;
    for (const { where, s } of strings(l)) { const p = CJK.validate(READ.fill(s), l); if (p && p.length) bad.push({ where, s, p }); }
    return bad;
  }
  const wordsIn = (s, l) => (isCJ(l) ? CJK.plain(READ.fill(s), { lang: l, mode: 'chars' }).replace(/[\s\p{P}]/gu, '').length : String(READ.fill(s)).split(/\s+/).filter(Boolean).length);
  const typedAs = (s, l) => (isCJ(l) ? CJK.plain(READ.fill(String(s || '')), { lang: l }) : READ.fill(String(s || '')));
  // per: episodes per band. Every episode: the QUIZ checks (lines, items, voices, English), every placeholder filled, no bank
  // entry twice, no word twice in a row, CJK.validate on every string, each item's right answer scoring 1 and a wrong one
  // less, «no sé» and English scoring 0 on short answers, each short answer's model grading S or A (EXAM.grade.turn), and
  // every line read by the pack's grammar check with no major error (what a slot fill that doesn't agree would trip).
  function tests(l = L(), per = 24, o = {}) {
    const was = typeof LEX !== 'undefined' ? LEX.lang : l; if (typeof LEX !== 'undefined') LEX.lang = l;
    const fails = [], ok = (c0, what) => { if (!c0) fails.push(what); return c0; };
    const counts = { episodes: 0, items: 0, templates: {}, words: {}, grades: {}, lineErrors: 0 };
    const seenFail = new Set(), once = (key, what) => { if (seenFail.has(key)) return; seenFail.add(key); fails.push(what); };
    try {
      if (!on(l)) return { lang: l, ok: false, fails: ['no kit'] };
      const sh = (QUIZ.content(l) || {}).show || {}, hosts = sh.hosts || {};
      for (const band of [1, 2, 3, 4]) {
        ok(tplsAt(l, band).length >= 2, `band ${band}: ${tplsAt(l, band).length} templates (2 wanted)`);
        const W = counts.words[band] = [1e9, 0];
        for (let n = 1; n <= per; n++) {
          cache.delete(`${l}.k${band}.${n}`);
          const ep = build(l, band, n); if (!ep) { fails.push(`${l}.k${band}.${n}: no episode`); continue; }
          counts.episodes++; counts.templates[ep.kit] = (counts.templates[ep.kit] || 0) + 1;
          const w = `${ep.id} (${ep.kit})`, V = Object.assign({}, hosts, ep.voices);
          const js = JSON.stringify([ep.title, ep.en, ep.lines, ep.items]);
          const left = js.match(/\{(?!mimo\})[a-zA-Z]\w*\.\w+\^?\}/g); if (left) once('ph' + ep.kit + left[0], `${w}: unfilled ${left.slice(0, 3).join(' ')}`);
          ok(ep.lines.length >= 5, `${w}: ${ep.lines.length} lines`);
          let nw = 0;
          ep.lines.forEach((x, i) => { if (!x.en) once('en' + ep.kit + i, `${w}.${i}: no English`); if (!V[x.who]) once('who' + ep.kit + x.who, `${w}.${i}: no voice for ${x.who}`); nw += wordsIn(x.text, l); });
          W[0] = Math.min(W[0], nw); W[1] = Math.max(W[1], nw);
          for (const [k, v] of Object.entries(ep.voices)) if (!(v.name && v.look)) once('voice' + ep.kit + k, `${w}: the voice ${k} needs a name and a look`);
          // no bank entry twice, no word twice in a row
          const dbl = ep.lines.map(x => READ.plain(x.text)).join(' ').match(/(^|[\s«“"¡¿])(\p{L}{3,})[\s,]+\2(?=[\s.,!?»”"]|$)/iu);
          if (dbl && !isCJ(l)) once('dbl' + ep.kit + dbl[2], `${w}: a word twice in a row: «${dbl[2]} ${dbl[2]}»`);
          const need = band <= 2 ? 4 : 5; ok(ep.items.length >= need, `${w}: ${ep.items.length} items (${need} wanted)`);
          ep.items.forEach((raw, k) => {
            counts.items++;
            const iw = `${w} #${k + 1} (${raw.type})`;
            ok(['mc', 'tf', 'tfn', 'short', 'match'].includes(raw.type) && raw.ask && raw.ask[0] && raw.ask[1], iw + ': type and the question with its English');
            if (raw.at != null) ok(raw.at >= 0 && raw.at < ep.lines.length, iw + ': at is out of range');
            if (raw.type === 'mc') { ok((raw.opts || []).length >= 3 && raw.opts.every(x => x[0] && x[1]), iw + ': three options with English'); ok(new Set(raw.opts.map(x => READ.plain(x[0]))).size === raw.opts.length, iw + `: two options read the same (${raw.opts.map(x => x[0]).join(' / ')})`); }
            if (raw.type === 'short') ok(raw.want && raw.model && raw.model[1], iw + ': want and model with English');
            for (const seed of [3, 17]) {
              const it = QUIZ.ITEMS.resolve(raw, k, seed), right = QUIZ.ITEMS.auto(it, 'model', l), sc = QUIZ.ITEMS.score(it, right, l);
              if (sc !== 1) once('r' + iw, `${iw}: the right answer scores ${sc} («${JSON.stringify(right)}»)`);
              if (raw.type !== 'short') { if (QUIZ.ITEMS.score(it, QUIZ.ITEMS.auto(it, 'wrong', l), l) >= 1) once('w' + iw, `${iw}: a wrong answer scores 1`); }
              else { if (QUIZ.ITEMS.score(it, QUIZ.ITEMS.IDK[l], l) !== 0) once('i' + iw, `${iw}: «${QUIZ.ITEMS.IDK[l]}» scores`); if (QUIZ.ITEMS.score(it, 'I don’t know', l) !== 0) once('e' + iw, `${iw}: English scores`); }
            }
            if (raw.type === 'short' && typeof EXAM !== 'undefined' && !o.fast) {
              const g = EXAM.grade.turn(typedAs(raw.model[0], l), { want: { any: true } }, band, l), gr = g && g.understood ? g.grade : 'NU';
              counts.grades[gr] = (counts.grades[gr] || 0) + 1;
              if (gr !== 'S' && gr !== 'A') once('g' + ep.kit + k + gr, `${iw}: the model «${raw.model[0]}» grades ${gr} ${((g && g.r && g.r.errors) || []).filter(x => !x.free).map(x => x.code + ' «' + x.fix + '»').join(', ')}`);
            }
          });
          // every line through the pack's grammar check: a fill that doesn't agree would show here
          if (!o.fast && typeof DICT !== 'undefined' && DICT.check) for (const [i, x] of ep.lines.entries()) {
            let r = null; try { r = DICT.check(isCJ(l) ? CJK.plain(READ.fill(x.text), { lang: l, mode: 'chars' }) : READ.fill(x.text)); } catch (e) { /* */ }
            const major = r ? r.errors.filter(e => e.sev === 'major' && !e.free) : [];
            if (major.length) { counts.lineErrors++; once('L' + ep.kit + i + major[0].code, `${w}.${i}: «${x.text}» ${major.map(e => e.code + ' → «' + e.fix + '»').join(', ')}`); }
          }
          if (isCJ(l) && typeof CJK !== 'undefined') {
            const all = [ep.title].concat(ep.lines.map(x => x.text), ...ep.items.map(it => [it.ask && it.ask[0], it.model && it.model[0]].concat((it.opts || []).map(x => x[0]), (it.pairs || []).flatMap(p => [p[0][0], p[1][0]]))));
            for (const s of all.filter(Boolean)) { const p = CJK.validate(READ.fill(s), l); if (p && p.length) once('cjk' + ep.kit + s, `${w}: CJK ${s}: ${p.join('; ')}`); }
          }
        }
      }
      if (isCJ(l)) check(l).forEach(x => fails.push(`CJK ${x.where}: ${x.p.join('; ')}`));
    } catch (e) { fails.push('threw: ' + ((e && e.stack) || e)); }
    finally { if (typeof LEX !== 'undefined') LEX.lang = was; }
    return { lang: l, ok: !fails.length, fails, counts };
  }

  return { add, on, next, episode, build, strings, check, tests, parse, _: { C, cache, rng, hash, fillStr, fillDeep, tplsAt, pickSlots, makeItem } };     // (paper.js fills its weather and ads from the banks)
})();
