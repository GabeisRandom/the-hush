'use strict';
// Mimo's lines and Noa's notebook pages, mixed by the weave (DESIGN.md 20, P7a: "mimo and noa's notebook have same issue as
// armadillo with monolingual text"). Like the foes' lines (battle/foelines.js, P6b): nothing whole in the language for a
// beginner with its English under it. The English line, with the words you know in the language (the weave, MIX), the line's
// key word in the language and glossed, whole lines in the language only as the weave rises (UI.fullLine), and the English on
// request (EN).
//  - Mimo's bubbles in a fight, from every module (flow.js, tactics.js, timebattle.js, the realms' plug-ins): the ones that come
//    with their English (o.en). What stays whole: Mimo saying your command back (no English, or a recast in HTML) and a line
//    marked o.demo (Mimo showing a sentence's form: a demonstration).
//  - Noa's notebook pages (UI.page: the forest's five and one at each bell, ui.js asks UI.pageCap): the page's own word always in
//    the language, highlighted and glossed (its picture is beside it); the journal's Notebook pages tab the same (UI.pageMini),
//    with an EN button on each page instead of the English under it. (Her letters were already English with her words in them;
//    her diary in the Reading tab stays in the language on purpose: it's reading practice, with tap-to-gloss and EN.)
//   MIXLINES.page(key, id, o) → { html, full } · MIXLINES.mimo(text, en) → { html, full } · MIXLINES.mini(key)
const MIXLINES = (() => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isC = () => typeof CJK !== 'undefined' && typeof UI !== 'undefined' && CJK.isCJK(UI.lang);
  const mixOn = () => { try { return typeof MIX !== 'undefined' && MIX.ok(); } catch (e) { return false; } };

  // ------------------------------------------------------------ Mimo, in a fight
  function mimo(text, en) {
    if (typeof STORY === 'undefined' || !STORY.mixHTML) return null;
    return STORY.mixHTML(String(text), String(en), { key: 'mimo:' + en });
  }
  const _ = typeof BATTLE !== 'undefined' && BATTLE._;
  if (_ && _.UI && _.UI.say) {
    const say0 = _.UI.say;
    _.UI.say = function (actor, text, t, o = {}) {
      if (actor && actor.kind === 'mimo' && o && o.en && !o.html && !o.demo && !o.whole) {
        try { const m = mimo(text, o.en); if (m && m.html) return say0.call(this, actor, m.html, t, Object.assign({}, o, { html: true })); }
        catch (e) { console.error('[mimo lines]', e); }
      }
      return say0.apply(this, arguments);
    };
  }

  // ------------------------------------------------------------ Noa's pages
  // the word each page shows (its picture): the forest's from story.js, the bells' here
  const BELL = { 'page.tower': 'w.tower', 'page.mill': 'w.tower', 'page.lake': 'w.mountain', 'page.caves': 'w.flower', 'page.gardens': 'w.flower', 'page.peaks': 'w.snow',
    'page.port': 'w.fort', 'page.ruins': 'w.temple', 'page.marsh': 'w.tower' };
  const seenIds = {};
  function idOf(key) {
    if (seenIds[key]) return seenIds[key];
    try { const p = typeof STORY !== 'undefined' && STORY.PAGES && STORY.PAGES.find(q => q.key === key); if (p && p.word) return p.word; } catch (e) { /* */ }
    const id = BELL[key];
    return id && typeof LEX !== 'undefined' && LEX.item(id) ? id : key === 'page.ruins' && LEX.item('w.bell') ? 'w.bell' : null;
  }
  // o.count: it's being read now (the woven words count once, and the page's word is seen)
  function page(key, id, o = {}) {
    if (typeof UI === 'undefined' || typeof LEX === 'undefined') return null;
    if (id) seenIds[key] = id; else id = idOf(key);
    const L = UI.lineFor(key, 1); if (!L || !L.text) return null;
    const t = String(L.text), en = String(L.en || ''), it = id ? LEX.item(id) : null, l = UI.lang;
    if (UI.fullLine('page:' + key, LEX.weave()) || !en) {
      // whole in the language, as the weave rises: its word highlighted and glossed (the page's old look)
      const h = UI.words(t, { expose: !!o.count });
      return { html: h.replace(/(<span class="w" data-en="([^"]*)">[\s\S]*?<\/span>)/, '$1<span class="gl">($2)</span>'), full: true };
    }
    const pl = !!(id && t.includes('{' + id + ':pl}'));
    let en2 = en, slot = null;
    if (it && it.en) {
      let m = null;
      for (const enW of pl ? [it.enPl || it.en + 's', it.en] : [it.en, it.enPl || it.en + 's']) if (!m) m = en.match(new RegExp(`\\b${escRe(enW)}\\b`, 'i'));     // (zh / ja say «山» where the English says "mountains")
      if (m) {
        const before = en.slice(0, m.index);
        slot = { enText: m[0], start: /^[¡¿"“«\s]*$/.test(before) || /[.!?:]\s*$/.test(before) };
        en2 = before + 'Qzq0x' + en.slice(m.index + m[0].length);
      }
    }
    let tl = t.replace(/\{mimo\}/g, UI.mimoName || 'Mimo');
    tl = isC() ? tl.replace(/\{(w\.[a-z_]+)(:pl)?\}/g, (m0, i, p) => LEX.src(i, { pl: !!p })) : UI.plainText(tl);
    let ps = null;
    if (mixOn()) { try { ps = MIX.parts(tl, en2, {}); } catch (e) { ps = null; } }
    if (!ps || !ps.length) ps = [{ s: en2 }];
    const out = [];
    for (const p of ps) {
      if (p.tl || !p.s || !/Qzq0x/.test(p.s)) { out.push(p); continue; }
      for (const seg of p.s.split(/(Qzq0x)/)) {
        if (seg !== 'Qzq0x') { if (seg) out.push({ s: seg }); continue; }
        const q = { id, tl: true, en: slot.enText, gl: slot.enText.toLowerCase() };
        if (isC()) { q.src = LEX.src(id, { pl }); q.cap = !!slot.start; q.s = CJK.plain(q.src, { lang: l, cap: q.cap }); q.len = CJK.len(q.src, { lang: l, cap: q.cap }); }
        else { const f = LEX.form(id, { pl }); q.s = slot.start ? f.charAt(0).toUpperCase() + f.slice(1) : f; }
        out.push(q);
      }
    }
    if (o.count) {
      try { if (mixOn()) MIX.note(out.filter(p => p.tl && (p.lex || p.did))); } catch (e) { /* */ }
      if (id) LEX.expose(id);
      if (isC()) for (const p of out) if (p.src) try { CJK.seen(p.src, { lang: l }); } catch (e) { /* */ }
    }
    let h = UI.partsHTML(out);
    // (a page whose English doesn't name its word, like the Bloom Gardens' «flor»: the word under the line, with its meaning)
    if (it && !slot) h += `<span class="pg-word"> · «${isC() ? CJK.html(LEX.src(id), { lang: l }) : esc(LEX.form(id))}» <span class="gl">(${esc(it.en)})</span></span>`;
    return { html: h, full: false };
  }
  // the journal's Notebook pages tab: each page mixed, its English on an EN button
  function mini(key) {
    const L = UI.lineFor(key, 1), m = page(key, null, { count: false });
    const body = m ? m.html : L.text ? UI.words(L.text, { expose: false }) : esc(L.en);
    return `<div class="mini-page"><b>${body}</b>${L.en && (!m || !m.full || L.text) ? `<span class="mp-en" hidden>${esc(L.en)}</span><button type="button" class="mp-enb" title="Show this page in English">EN</button>` : ''}</div>`;
  }
  if (typeof UI !== 'undefined') {
    UI.pageCap = (key, id) => { try { const m = page(key, id, { count: true }); return m ? m.html : null; } catch (e) { console.error('[noa pages]', e); return null; } };
    UI.pageMini = key => { try { return mini(key); } catch (e) { console.error('[noa pages]', e); return null; } };
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('click', e => {
      const b = e.target && e.target.closest && e.target.closest('.mp-enb'); if (!b) return;
      const s = b.parentElement && b.parentElement.querySelector('.mp-en'); if (s) { s.hidden = !s.hidden; b.classList.toggle('on', !s.hidden); }
    });
    const st = document.createElement('style');
    st.textContent = '.mini-page { position: relative; } .mini-page .mp-enb { position: absolute; top: 6px; right: 8px; font: 700 11px "Segoe UI", sans-serif; padding: 1px 6px; border-radius: 6px; border: 1.5px solid var(--ink, #2b2235); background: #fff; cursor: pointer; } .mini-page .mp-enb.on { background: var(--ink, #2b2235); color: #fff; } .mini-page b { padding-right: 34px; } .mini-page .mp-en[hidden] { display: none; } .card .caption .pg-word, .mini-page .pg-word { white-space: nowrap; }';
    document.head.appendChild(st);
  }
  return { page, mini, mimo, idOf, BELL };
})();
