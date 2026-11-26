'use strict';
// ACCENTS: the letters an English keyboard doesn't have (P6a, DESIGN.md 19: "im punished for not using accents but how could i?").
//
// 1. Grading: the rule, game-wide. A missing or wrong accent (es á é í ó ú ñ ü · pt ã õ ç á é í ó ú â ê ô à · de ä ö ü ß, also
//    typed as ae / oe / ue / ss) never costs a grade. It's graded as if typed right, with a small, friendly tip showing the
//    accented form («comí»). The one exception: the accent makes another word that the task tells apart (es «empujo», I push, for
//    «empujó», he pushed; de «wurde», became, for «würde», would). Then the tip explains the difference and the grade stays where
//    it was. Each grader decides that its own way, with these:
//      ACCENTS.fold(s, l)              the comparison key: lower case, no accents (ñ → n, ç → c, ß → ss; de: ae / oe / ue → a / o / u)
//      ACCENTS.match(typed, right, l)  null (more than accents apart) or { exact } (exact: case aside; ae / oe / ue / ss = ä / ö / ü / ß)
//      ACCENTS.span(text, item, l)     item in text, give or take accents, whole words: { typed (as typed), exact } or null
//      ACCENTS.tip(right, l, typed)    'Tip: «comí», with its accent'
//      ACCENTS.pair(typed, right, l)   when the typed spelling is a word of its own (the dictionary packs, DICT): { typed, right,
//                                      typedEn, rightEn, same (one headword), diff ['tense', 'person', …], grammar, why }, else null
//      ACCENTS.judge(text, item, l, o) for a task grader that found item give or take accents: { exact, keep (the exception: keep the
//                                      lower grade), why (what tells the two apart), tip (the friendly tip, when it costs nothing) }
//                                      o.others: the task's other forms (now, someone else…): typed exactly, that's the exception too
//      ACCENTS.word(typed, right, l)   the same for one word a grader already picked out («cantara» read as «cantará»)
//      ACCENTS.respell(word, l, test)  the spellings with accents the dictionary knows for a word («cantara» → «cantará»)
//      ACCENTS.free(kind)              a grader's soft note that's only an accent ('accent', 'umlaut'): never counted, shown as a tip
//      ACCENTS.split(soft)             a grader's soft notes [{ kind, why }] → { soft (the ones that still count), tips, tip (one line) }
// 2. Typing them: the accent bar under every text box where you type es / pt / de (zh / ja use the IME), and typed shortcuts
//    (es / pt a' → á, n~ → ñ, u: → ü; pt a~ → ã, a^ → â, a` → à, c, → ç; de a: or a" → ä, ss is ß already; Backspace right after
//    one undoes it). The bar attaches itself when a box is focused: no module has to know about it. data-noacc on a box opts out.

const ACCENTS = (() => {
  const LAT = new Set(['es', 'pt', 'de']);
  const lang = () => (typeof LEX !== 'undefined' && LEX.lang) || 'es';
  const isLat = l => LAT.has(l || lang());
  // ------------------------------------------------------------ comparing
  const BASE = {}; [['a', 'áàâãäå'], ['e', 'éèêë'], ['i', 'íìîï'], ['o', 'óòôõö'], ['u', 'úùûü'], ['n', 'ñ'], ['c', 'ç'], ['y', 'ýÿ']].forEach(([b, s]) => { for (const c of s) BASE[c] = b; });
  const base = c => BASE[c] || c;
  const low = s => String(s == null ? '' : s).normalize('NFC').toLowerCase();
  // words only: punctuation (¿¡«»…) out, one space between words
  const plain = s => low(s).replace(/[^\p{L}\p{N}'’\s-]/gu, ' ').replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();
  function fold(s, l = lang()) {
    let t = plain(s).replace(/ß/g, 'ss').replace(/[^\x00-\x7f]/g, base);
    if (l === 'de') t = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
    return t;
  }
  const UML = { 'ä': 'a', 'ö': 'o', 'ü': 'u' };
  // typed against right, letter by letter: null when they're more than accents apart, else { exact }. ae / oe / ue typed for
  // ä / ö / ü (de), and ss for ß, are exact: that's how German is typed without the keys.
  function match(typed, right, l = lang()) {
    const t = plain(typed), r = plain(right);
    let i = 0, j = 0, exact = true;
    while (j < r.length) {
      const rc = r[j], tc = t[i];
      if (tc === rc) { i++; j++; continue; }
      if (UML[rc] && t[i] === UML[rc] && t[i + 1] === 'e') { i += 2; j++; continue; }        // (Muell, schoen: exact)
      if (rc === 'ß' && t[i] === 's' && t[i + 1] === 's') { i += 2; j++; continue; }        // (gross: exact)
      if (rc === 's' && r[j + 1] === 's' && tc === 'ß') { i++; j += 2; continue; }           // (muß for muss: the old spelling)
      if (tc !== undefined && base(tc) === base(rc) && /[a-z]/.test(base(rc))) { exact = false; i++; j++; continue; }   // (an accent missing, added or wrong)
      return null;
    }
    return i === t.length ? { exact } : null;
  }
  const same = (a, b, l) => !!match(a, b, l);
  const exactly = (a, b, l) => { const m = match(a, b, l); return !!(m && m.exact); };
  // item (one word or several) in text, whole words, give or take accents: what was typed there, and whether it's exact
  function span(text, item, l = lang()) {
    const T = plain(text).split(' ').filter(Boolean), I = plain(item).split(' ').filter(Boolean);
    if (!I.length) return null;
    let best = null;
    for (let k = 0; k + I.length <= T.length; k++) {
      const typed = T.slice(k, k + I.length).join(' '), m = match(typed, I.join(' '), l);
      if (m && (!best || (m.exact && !best.exact))) best = { typed, exact: m.exact, at: k };
      if (best && best.exact) break;
    }
    return best;
  }
  // ------------------------------------------------------------ the friendly tip
  const MARK = c => (/[ãõ]/.test(c) ? 'tilde' : c === 'ñ' ? 'ñ' : c === 'ç' ? 'ç' : c === 'ß' ? 'ß' : /[äöü]/.test(c) ? 'umlaut' : 'accent');
  const ART = { accent: 'its accent', tilde: 'its tilde (~)', 'ñ': 'its ñ', 'ç': 'its ç', 'ß': 'its ß', umlaut: 'its umlaut' };
  // what's missing, compared with what you typed (or every mark in the word, without it)
  function marksOf(right, typed, l) {
    const r = plain(right), t = typed == null ? null : plain(typed), kinds = new Set();
    if (t != null) {
      let i = 0;
      for (let j = 0; j < r.length; j++) {
        const rc = r[j], tc = t[i];
        if (UML[rc] && tc === UML[rc] && t[i + 1] === 'e') { i += 2; continue; }
        if (rc === 'ß' && tc === 's' && t[i + 1] === 's') { i += 2; continue; }
        if (tc !== rc && /[^\x00-\x7f]/.test(rc)) kinds.add(MARK(rc));
        else if (tc !== rc && /[^\x00-\x7f]/.test(tc || '')) kinds.add('accent');      // (an accent where none goes: «tú» for «tu»)
        i++;
      }
    }
    if (!kinds.size) for (const c of r) if (/[^\x00-\x7f]/.test(c) && /\p{L}/u.test(c)) kinds.add(MARK(c));
    return [...kinds];
  }
  function tip(right, l = lang(), typed) {
    const r = String(right == null ? '' : right).trim(); if (!r) return '';
    const k = marksOf(r, typed, l);
    if (typed != null && !/[^\x00-\x7f]/.test(r) && /[^\x00-\x7f]/.test(String(typed))) return `Tip: «${r}», no accent`;
    return `Tip: «${r}»` + (k.length === 1 ? `, with ${ART[k[0]]}` : k.length > 1 ? ', with its accents' : '');
  }
  // (open: Spanish's ¿ ¡, on the bar too: the same keyboard trouble as an accent)
  const free = kind => kind === 'accent' || kind === 'umlaut' || kind === 'open';
  // a grader's soft notes ([{ kind, why }]), split: the ones that still count (a style note…) and the accent tips, as one line
  // ('Accent: «frío»' → 'Tip: «frío»')
  const tipLine = why => { const s = String(why || '').trim(); if (!s) return ''; const t = s.replace(/^(?:the\s+)?(?:accent|umlaut)s?\s*:\s*/i, ''); return 'Tip: ' + (t === s ? s : t); };
  function split(list) {
    const soft = [], tips = [];
    for (const s of list || []) (s && free(s.kind) ? tips : soft).push(s);
    return { soft, tips, tip: [...new Set(tips.map(s => tipLine(s.why)).filter(Boolean))].join(' · ') };
  }

  // ------------------------------------------------------------ is the typed spelling a word of its own? (the dictionary packs)
  const packOf = l => { try { return typeof DICT !== 'undefined' && DICT.pack ? DICT.pack(l) : null; } catch (e) { return null; } };
  const candsOf = (P, w) => { try { return P && P._ && P._.cands ? P._.cands({ t: w, s: 0, e: w.length, word: true }) || [] : []; } catch (e) { return []; } };
  const enOf = (P, c, w) => {
    try { const g = P._.glossOf(c, w); const m = String(g.form || '').match(/^[^:]+:\s*(.+?)\s*(?:\(.*\))?$/); return (m && m[1]) || c.e.en || ''; } catch (e) { return (c && c.e && c.e.en) || ''; }
  };
  const FEAT = ['tense', 'mood', 'person', 'number', 'form', 'k2'];
  // the tenses a task tells apart: what you typed has to be one of these, said plainly (indicative), for the accent to make "another
  // word" a task would mark: «empujo» (now) for «empujó» (then), «wurde» for «würde», «pode» for «pôde». A form nobody at this point
  // would mean, «cantara» (a subjunctive) for «cantará», is only an accent away: it costs nothing. So is another person alone
  // («fahrt» for «fährt»: the subject says who), and another word altogether («esta» for «está», «papa» for «papá»).
  const TELLS = new Set(['pres', 'past', 'impf', 'fut', 'cond']);
  // the typed word against the right one (one word each, an accent apart): null when the typed spelling isn't a word by itself,
  // else what each one means and what tells them apart. grammar: one headword in another tense or mood (see TELLS).
  function pair(typed, right, l = lang()) {
    if (!isLat(l)) return null;
    const tw = plain(typed).split(' '), rw = plain(right).split(' ');
    if (tw.length !== rw.length) return null;
    const P = packOf(l); if (!P) return null;
    for (let k = 0; k < tw.length; k++) {
      const m = match(tw[k], rw[k], l); if (!m || m.exact) continue;
      const tc = candsOf(P, tw[k]).filter(c => c.exact && !c.via); if (!tc.length) continue;       // (not a word as typed: only an accent missing)
      const rc = candsOf(P, rw[k]).filter(c => c.exact);
      // the reading of the typed word closest to the right one: the same headword first, then the same person
      let best = null, bestR = rc[0] || null, bestScore = -1;
      for (const c of tc) for (const r of rc.length ? rc : [null]) {
        const s = (r && c.e === r.e ? 10 : 0) + (r && c.f.person === r.f.person ? 2 : 0) + (r && c.f.number === r.f.number ? 1 : 0);
        if (s > bestScore) { bestScore = s; best = c; bestR = r; }
      }
      const sameHead = !!(bestR && best.e === bestR.e);
      const diff = sameHead ? FEAT.filter(f => (best.f[f] || '') !== (bestR.f[f] || '')) : ['word'];
      if (!diff.length) continue;                     // (two spellings of one form: no difference in meaning)
      const typedEn = enOf(P, best, tw[k]), rightEn = bestR ? enOf(P, bestR, rw[k]) : '';
      const grammar = sameHead && diff.some(f => f === 'tense' || f === 'mood' || f === 'k2') && TELLS.has(best.f.tense) && best.f.mood !== 'subj' && !best.f.form;
      const mk = marksOf(rw[k], tw[k], l), wi = mk.length === 1 ? `with ${ART[mk[0]]}` : 'with its accents';
      const why = typedEn && rightEn ? `«${tw[k]}» is “${typedEn}”; «${rw[k]}», ${wi}, is “${rightEn}”` : `«${tw[k]}» is another word; ${wi}: «${rw[k]}»`;
      return { typed: tw[k], right: rw[k], typedEn, rightEn, same: sameHead, diff, grammar, why };
    }
    return null;
  }
  // a grader found item in text, give or take accents. o.others: the task's other forms (now, another person, another time…).
  // → { found, exact, keep, why, tip, typed }: keep is the exception (keep the lower grade: why says why); otherwise tip is the
  // friendly note and nothing is lost.
  function judge(text, item, l = lang(), o = {}) {
    if (!isLat(l)) return { found: true, exact: true, keep: false, why: '', tip: '' };
    const items = Array.isArray(item) ? item : [item], typedAll = [], rights = [];
    let exact = true, keep = false, why = '';
    for (const it of items) {
      if (typeof it !== 'string') continue;
      const sp = span(text, it, l);
      if (!sp) return { found: false, exact: false, keep: false, why: '', tip: '' };
      if (sp.exact) continue;
      exact = false; typedAll.push(sp.typed); rights.push(String(it));
      if (keep) continue;
      // the exception: what you typed is, exactly, one of the task's other forms, or (the dictionary) the same verb in another
      // tense, mood or person, or the same noun in the other number
      const other = (o.others || []).find(x => typeof x === 'string' && exactly(sp.typed, x, l) && !exactly(x, it, l));
      const p = pair(sp.typed, it, l);
      if (other || (p && p.same && p.grammar)) { keep = true; why = p ? p.why : `«${sp.typed}» is another form here; with the accent: «${it}»`; }
    }
    return { found: true, exact, keep, why, tip: exact || keep ? '' : tip(rights.join(' … '), l, typedAll.join(' … ')), typed: typedAll.join(' … ') };
  }
  // the words of what you typed that are only an accent away from the right sentence's (a battle's recast): the tip for them
  function diff(typed, right, l = lang()) {
    if (!isLat(l)) return { pairs: [], tip: '' };
    const R = plain(right).split(' ').filter(Boolean), pairs = [];
    for (const t of plain(typed).split(' ').filter(Boolean)) {
      const r = R.find(x => { const m = match(t, x, l); return m && !m.exact; });
      if (r && !pairs.some(p => p[1] === r)) pairs.push([t, r]);
    }
    return { pairs, tip: pairs.length ? tip(pairs.map(p => p[1]).join(' … '), l, pairs.map(p => p[0]).join(' … ')) : '' };
  }
  // one word a grader already picked out: typed (as typed) for right
  function word(typed, right, l = lang(), o = {}) {
    if (!isLat(l) || !typed || !right) return { exact: true, keep: false, why: '', tip: '' };
    return judge(typed, right, l, o);
  }
  // the spellings with accents the dictionary knows for a word typed without them, best first (test: a reading's features)
  function respell(w, l = lang(), test) {
    const P = packOf(l); if (!P) return [];
    const out = [];
    for (const c of candsOf(P, w)) {
      if (c.exact || c.via || !c.w || (test && !test(c.f || {}, c.e))) continue;
      if (!same(w, c.w, l)) continue;
      if (!out.includes(c.w)) out.push(c.w);
    }
    return out;
  }

  // ------------------------------------------------------------ the accent bar and the typed shortcuts
  const LETTERS = { es: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'], pt: ['ã', 'õ', 'ç', 'á', 'é', 'í', 'ó', 'ú', 'â', 'ê', 'ô', 'à'], de: ['ä', 'ö', 'ü', 'ß'] };
  // the shortcuts: the letter, then the mark (two keys typed one after the other)
  const SHORT = {
    es: { "'": { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }, '~': { n: 'ñ' }, ':': { u: 'ü' } },
    pt: { "'": { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }, '~': { a: 'ã', o: 'õ' }, '^': { a: 'â', e: 'ê', o: 'ô' }, '`': { a: 'à' }, ',': { c: 'ç' } },
    de: { ':': { a: 'ä', o: 'ö', u: 'ü' }, '"': { a: 'ä', o: 'ö', u: 'ü' } },
  };
  const HOWTO = {
    es: "a' → á · e' → é · i' → í · o' → ó · u' → ú · n~ → ñ · u: → ü",
    pt: "a' → á · a~ → ã · o~ → õ · c, → ç · a^ → â · e^ → ê · o^ → ô · a` → à",
    de: 'a: → ä · o: → ö · u: → ü (or a" o" u"; ae oe ue and ss count too)',
  };
  const title = l => `Click a letter to type it (Shift+click: a capital). Or type it: ${HOWTO[l] || ''}. Backspace right after a shortcut undoes it. Accents never cost a grade.`;
  // (the buttons' selector outranks a box's own «form button» rule: the teach box paints its buttons ink-dark)
  const CSS = `.acc-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 3px; flex: 0 0 100%; order: 99; margin: 5px 0 0; padding: 0; min-width: 0; font: 700 12px "Segoe UI", system-ui, sans-serif; color: #2b2235; grid-column: 1 / -1; }
.panel > .acc-bar { grid-column: 2; }
.acc-bar.hidden { display: none !important; }
.acc-bar > button[data-c] { min-width: 25px; height: 24px; margin: 0; padding: 0 4px; border: 2px solid #2b2235; border-radius: 7px; background: #fff; color: #2b2235; font: 800 14px "Segoe UI", system-ui, sans-serif; line-height: 1; cursor: pointer; box-shadow: 0 2px 0 rgba(43,34,53,.18); }
.acc-bar > button[data-c]:hover { background: #fff3c4; } .acc-bar > button[data-c]:active { transform: translateY(1px); box-shadow: none; }
.acc-bar > .acc-k { margin-left: 4px; font-size: 11px; font-weight: 700; opacity: .6; cursor: help; white-space: nowrap; }`;
  let cssOn = false;
  function css() { if (cssOn || typeof document === 'undefined') return; cssOn = true; const s = document.createElement('style'); s.id = 'acc-css'; s.textContent = CSS; document.head.appendChild(s); }
  const isText = el => !!el && ((el.tagName === 'INPUT' && /^(text|search|)$/i.test(el.type || '')) || el.tagName === 'TEXTAREA') && !el.readOnly && !(el.dataset && el.dataset.noacc != null);
  // type s at the caret (or over the selection), then tell the box (its own listeners preview, count…)
  function insert(el, s) {
    if (!el) return;
    const a = el.selectionStart != null ? el.selectionStart : el.value.length, b = el.selectionEnd != null ? el.selectionEnd : a;
    if (typeof el.setRangeText === 'function') el.setRangeText(s, a, b, 'end'); else { el.value = el.value.slice(0, a) + s + el.value.slice(b); }
    undo = null;
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { /* */ }
  }
  // where the bar goes: under the box's row (in the row when it's a flex row: it wraps onto its own line), else right after the box
  function host(el) {
    const p = el.parentElement; if (!p) return null;
    let cs = null; try { cs = getComputedStyle(p); } catch (e) { cs = null; }
    const row = cs && /flex/.test(cs.display) && !/column/.test(cs.flexDirection);
    return { parent: p, row };
  }
  function attach(el) {
    if (!isText(el) || typeof document === 'undefined') return null;
    css();
    const l = lang();
    let bar = el._accBar;
    if (bar && !bar.isConnected) bar = el._accBar = null;
    if (!isLat(l)) { if (bar) bar.classList.add('hidden'); return null; }
    if (!bar) {
      const h = host(el); if (!h) return null;
      bar = document.createElement('div'); bar.className = 'acc-bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Accents');
      bar.addEventListener('pointerdown', e => { if (e.target.closest('button')) e.preventDefault(); });      // (the box keeps the focus)
      bar.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
      bar.addEventListener('click', e => {
        const b = e.target.closest('button[data-c]'); if (!b) return;
        e.preventDefault(); e.stopPropagation();
        const c = b.dataset.c, up = e.shiftKey && c !== 'ß' && !/[¿¡]/.test(c) ? c.toUpperCase() : c;
        if (document.activeElement !== el) { try { el.focus({ preventScroll: true }); } catch (er) { el.focus(); } }
        insert(el, up);
      });
      if (h.row) { h.parent.style.flexWrap = 'wrap'; h.parent.appendChild(bar); }
      else el.insertAdjacentElement('afterend', bar);
      el._accBar = bar;
    }
    if (bar.dataset.lang !== l) {
      bar.dataset.lang = l; bar.title = title(l);
      bar.innerHTML = LETTERS[l].map(c => `<button type="button" tabindex="-1" data-c="${c}">${c}</button>`).join('') + `<span class="acc-k">⌨ ${l === 'de' ? 'a: → ä' : "a' → á"}…</span>`;
    }
    bar.classList.remove('hidden');
    return bar;
  }
  // the shortcuts: on each letter typed, the two before the caret («a'» → «á»); Backspace right after puts them back
  let undo = null;
  function onInput(e) {
    const el = e.target;
    if (!isText(el) || e.isComposing || !isLat()) return;
    if (e.inputType !== 'insertText' || !e.data || e.data.length !== 1) { undo = null; return; }
    const S = SHORT[lang()], m = S && S[e.data]; if (!m) { undo = null; return; }
    const pos = el.selectionStart; if (pos == null || pos < 2 || el.selectionEnd !== pos) return;
    const prev = el.value[pos - 2], to = m[prev.toLowerCase()]; if (!to) return;
    const out = prev === prev.toUpperCase() && prev !== prev.toLowerCase() ? to.toUpperCase() : to;
    el.setRangeText(out, pos - 2, pos, 'end');
    undo = { el, pos: pos - 1, from: prev + e.data, to: out };
  }
  function onKey(e) {
    if (isText(e.target) && !(e.target._accBar && e.target._accBar.isConnected)) { try { attach(e.target); } catch (er) { /* */ } }     // (a box focused while the window wasn't: no focusin)
    if (!undo) return;
    const el = e.target;
    if (e.key !== 'Backspace' || el !== undo.el || e.ctrlKey || e.altKey || e.metaKey) { if (e.key && e.key.length === 1 || e.key === 'Backspace') undo = null; return; }
    const u = undo; undo = null;
    if (el.selectionStart !== u.pos || el.selectionEnd !== u.pos || el.value.slice(u.pos - 1, u.pos) !== u.to) return;
    e.preventDefault();
    el.setRangeText(u.from, u.pos - 1, u.pos, 'end');
    try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (er) { /* */ }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('focusin', e => { try { attach(e.target); } catch (er) { console.error('[accents]', er); } }, true);
    document.addEventListener('input', e => { try { onInput(e); } catch (er) { console.error('[accents]', er); } }, true);
    document.addEventListener('keydown', e => { try { onKey(e); } catch (er) { /* */ } }, true);
  }

  return { LETTERS, SHORT, HOWTO, fold, match, same, exactly, span, tip, free, split, tipLine, pair, judge, word, diff, respell, attach, insert, plain, isLat,
    _: { marksOf, get undo() { return undo; } } };
})();
