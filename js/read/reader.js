'use strict';
// READER: the panels for reading and listening (DESIGN.md 15.4; FLUENT.md C). One overlay, #rd, in the game's paper-and-ink look:
//   • books: the cover ("You know 82% of the words", DICT.coverage), pages, tap any word for DICT.gloss (and DICT.met(id,
//     'gloss')), 🔊 per sentence and for the whole page with the sentence lit up, English on request, DICT.metAll(…, 'read') per
//     sentence read (CJK.seen in zh/ja, so the ruby fades as usual). After the last page Mimo asks what happened: retell it,
//     or answer 2–3 questions in your own words, graded S–D by READ.judge; DICT.log('read', band, grade) per answer.
//   • single pages (Noa's diary, notes): the same page, a diary's paper, then a question or two.
//   • listening (the radio, overheard talk): plays the lines at natural speed in two voices (SPEECH), the words hidden until
//     you answer or ask for them; no voice for the language → the words at once, and the answer counts as reading.
//   READER.book(book, o) · READER.page(item, o) · READER.listen(show, o) · READER.ask(qs, o) · READER.isOpen · READER.close()
//   (all async; each resolves when its panel closes, with { grades, done })

const READER = (() => {
  const L = () => READ.lang, isCJ = l => l === 'zh' || l === 'ja', cj = () => isCJ(L()) && typeof CJK !== 'undefined';
  const esc = READ.esc, fill = READ.fill;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const LANGNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };

  // ------------------------------------------------------------ the look (injected once)
  const CSS = `
#rd { position: fixed; inset: 0; z-index: 12; display: grid; place-items: center; color: #2b2235; font-family: "Segoe UI", system-ui, sans-serif; }
#rd.hidden, #rd .hidden { display: none !important; }
#rd * { box-sizing: border-box; }
#rd .rd-shade { position: absolute; inset: 0; background: rgba(20,18,30,.38); }
#rd.dock { place-items: end center; pointer-events: none; } #rd.dock .rd-shade { display: none; } #rd.dock .rd-card { pointer-events: auto; margin-bottom: 14px; width: min(700px, calc(100vw - 28px)); max-height: 47vh; }
#rd .rd-card { position: relative; width: min(780px, calc(100vw - 28px)); max-height: calc(100vh - 40px); display: flex; flex-direction: column; background: #fbf6e7; border: 3px solid #2b2235; border-radius: 18px;
  box-shadow: 0 0 0 6px #fff, 0 14px 0 6px rgba(43,34,53,.22); overflow: hidden; }
#rd .rd-top { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 2px dashed rgba(43,34,53,.2); }
#rd .rd-top .t { font: 800 19px Bahnschrift, "Segoe UI", sans-serif; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#rd .rd-top .k { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .55; }
#rd .rd-band, .rd-j .rd-band { display: inline-block; font: 800 11px Bahnschrift, "Segoe UI", sans-serif; border: 2px solid #2b2235; border-radius: 99px; padding: 0 7px; background: #fff; font-style: normal; }
#rd .rd-x { border: 0; background: transparent; font-size: 20px; font-weight: 800; padding: 0 4px; opacity: .6; } #rd .rd-x:hover { opacity: 1; }
#rd .rd-body { overflow: auto; padding: 18px 28px 14px; font: 22px/1.65 Georgia, "Times New Roman", serif; flex: 1; min-height: 120px; }
#rd .rd-s { border-radius: 6px; transition: background .2s, box-shadow .2s; }
#rd .rd-s.lit { background: #fff0a0; box-shadow: 0 0 0 3px #fff0a0; }
#rd .rd-w { cursor: pointer; border-radius: 4px; } #rd .rd-w:hover { background: rgba(33,164,147,.16); } #rd .rd-w.on { background: rgba(33,164,147,.32); }
#rd .w { color: inherit; font-weight: inherit; border-bottom: 0; cursor: pointer; } #rd .w:hover::after { display: none; }
#rd .rd-sb { font-size: 12px; border: 0; background: transparent; opacity: .3; padding: 0 2px 0 3px; vertical-align: 3px; cursor: pointer; } #rd .rd-sb:hover { opacity: 1; }
#rd .rd-en { display: none; font: italic 15px/1.4 "Segoe UI", sans-serif; opacity: .72; margin: 1px 0 9px; }
#rd .showen .rd-en { display: block; }
#rd .rd-para { margin: 0 0 4px; }
#rd .rd-foot { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 14px; border-top: 2px dashed rgba(43,34,53,.2); }
#rd .rd-foot .sp { flex: 1; }
#rd .rd-btn { border: 2.5px solid #2b2235; border-radius: 10px; background: transparent; font: 800 14px "Segoe UI", sans-serif; padding: 5px 12px; cursor: pointer; }
#rd .rd-btn:hover { background: #fff3c4; } #rd .rd-btn.main { background: #2b2235; color: #fffaf0; } #rd .rd-btn.main:hover { background: #3d3350; }
#rd .rd-btn.on { background: #21a493; color: #fff; border-color: #21a493; } #rd .rd-btn[disabled] { opacity: .35; cursor: default; }
#rd .rd-note { font-size: 13px; opacity: .72; } #rd .rd-note.warn { color: #9a3a22; opacity: 1; font-weight: 700; }
#rd .rd-pg { font: 700 13px "Segoe UI", sans-serif; opacity: .6; }
#rd.diary .rd-card { background: #f4f0ff; } #rd.diary .rd-body { font: 21px/1.75 "Segoe Print", "Ink Free", cursive; color: #2c2b4a; background-image: repeating-linear-gradient(transparent 0 35px, rgba(90,90,170,.16) 35px 36px); }
#rd .rd-cover { display: grid; grid-template-columns: 210px 1fr; gap: 20px; padding: 18px 22px; overflow: auto; }
#rd .rd-cover canvas { width: 210px; height: 290px; border-radius: 6px 12px 12px 6px; box-shadow: 4px 6px 0 rgba(43,34,53,.25); }
#rd .rd-cover h2 { margin: 0; font: 800 28px Georgia, serif; } #rd .rd-cover .en { font-style: italic; opacity: .7; margin: 2px 0 8px; }
#rd .rd-cover .by { font-size: 13px; opacity: .65; } #rd .rd-cover p { font-size: 15px; line-height: 1.5; }
#rd .rd-meter { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; font-size: 15px; font-weight: 800; margin: 12px 0 6px; }
#rd .rd-meter i { flex: 0 0 180px; height: 12px; border-radius: 99px; background: rgba(43,34,53,.12); overflow: hidden; } #rd .rd-meter i b { display: block; height: 100%; background: #21a493; border-radius: 99px; }
#rd .rd-meter small { flex-basis: 100%; font-weight: 500; font-size: 13px; opacity: .7; }
#rd .rd-gloss { position: fixed; z-index: 14; background: #2b2235; color: #fffaf0; border-radius: 12px; padding: 8px 12px 9px; max-width: 300px; box-shadow: 0 6px 0 rgba(43,34,53,.25); font-family: "Segoe UI", sans-serif; }
#rd .rd-gloss b { font: 800 20px Bahnschrift, "Segoe UI", sans-serif; } #rd .rd-gloss .f { font-size: 14px; margin-top: 2px; } #rd .rd-gloss small { display: block; opacity: .7; font-size: 12px; margin-top: 2px; }
#rd .rd-gloss button { border: 1.5px solid #fffaf0; color: #fffaf0; background: transparent; border-radius: 7px; font-size: 12px; margin-left: 6px; padding: 0 6px; vertical-align: 3px; }
#rd .rd-ask { padding: 14px 18px; overflow: auto; font-family: "Segoe UI", sans-serif; }
#rd .rd-qrow { display: flex; gap: 12px; align-items: flex-start; }
#rd .rd-mimo { flex: 0 0 54px; height: 54px; }
#rd .rd-q { flex: 1; background: #fff; border-radius: 16px; border: 2px solid rgba(43,34,53,.15); padding: 9px 13px; font-size: 20px; line-height: 1.4; }
#rd .rd-q .who { display: block; font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #13786b; }
#rd .rd-q button { border: 1.5px solid #2b2235; border-radius: 7px; background: transparent; font-size: 11px; font-weight: 800; padding: 0 6px; margin-left: 6px; vertical-align: 3px; }
#rd .rd-q .qen { font-size: 14px; font-style: italic; opacity: .7; }
#rd .mx .w { color: #d6453a; font-weight: 800; border-bottom: 2px dotted #d6453a; cursor: help; position: relative; } #rd .mx .w:hover::after { display: block; }
#rd .mx .gl { font-size: .7em; } #rd .rd-q .qtl { font-size: 16px; margin-top: 3px; padding-top: 3px; border-top: 1px dashed rgba(43,34,53,.2); color: #5b4a6b; }
#rd .rd-nw { margin: 8px 0 0 66px; padding: 6px 10px; border-radius: 12px; background: #fffbe6; border: 2px solid #e8c547; font-size: 15px; }
#rd .rd-nw .lab { display: block; font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: #a0761a; margin-bottom: 3px; }
#rd .rd-nw .nw { display: inline-flex; align-items: center; gap: 5px; background: #fff; border: 1.5px solid rgba(43,34,53,.18); border-radius: 10px; padding: 2px 8px 2px 4px; margin: 2px 6px 2px 0; }
#rd .rd-nw .nw img { width: 30px; height: 30px; } #rd .rd-nw .nw b { background: linear-gradient(transparent 55%, #ffe36e 55%); } #rd .rd-nw .nw i { font-size: 13px; opacity: .72; }
#rd .rd-nw .nw button { margin-left: 2px; }
#rd .rd-help { margin: 8px 0 0 66px; font-size: 16px; } #rd .rd-help .lab { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; opacity: .55; margin-right: 6px; }
#rd .rd-form { display: flex; gap: 8px; margin: 10px 0 0 66px; }
#rd .rd-form input { flex: 1; min-width: 0; font: 600 19px "Segoe UI", sans-serif; padding: 6px 10px; border: 2.5px solid #2b2235; border-radius: 10px; outline: none; background: #fff; }
#rd .rd-form input:focus { box-shadow: 0 0 0 3px rgba(33,164,147,.35); }
#rd .rd-arow { display: flex; gap: 8px; margin: 8px 0 0 66px; align-items: center; flex-wrap: wrap; }
#rd .rd-fb { margin: 10px 0 0 66px; padding: 9px 12px; border-radius: 12px; background: #fff; border: 2px solid rgba(43,34,53,.12); font-size: 15px; }
#rd .rd-fb .say { font-size: 18px; } #rd .rd-fb .fix { margin-top: 5px; font-size: 17px; } #rd .rd-fb .tip { margin-top: 3px; font-size: 13px; opacity: .8; }
#rd .rd-fb mark { background: none; color: #c2412f; font-weight: 800; border-bottom: 2px solid #c2412f; }
#rd .rd-grade, .rd-j .rd-grade { display: inline-block; font: 900 14px Bahnschrift, "Segoe UI", sans-serif; border-radius: 6px; padding: 0 7px; color: #fff; font-style: normal; margin-right: 6px; }
.rd-gs { background: #e6a92e; } .rd-ga { background: #21a493; } .rd-gb { background: #3f7fd1; } .rd-gc { background: #8a5ab0; } .rd-gd, .rd-gx { background: #8a8494; }
#rd .rd-sum { padding: 16px 20px; font-size: 16px; } #rd .rd-sum .big { font: 800 22px Bahnschrift, "Segoe UI", sans-serif; margin-bottom: 6px; }
#rd .rd-sum ul { margin: 8px 0; padding-left: 20px; } #rd .rd-sum li { margin: 3px 0; }
#rd .rd-lctl { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 14px 0; }
#rd .rd-now { padding: 8px 16px 4px; font-size: 15px; min-height: 30px; }
#rd .rd-now .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #c2412f; margin-right: 7px; animation: rdpulse 1s ease-in-out infinite; vertical-align: 0; }
@keyframes rdpulse { 50% { opacity: .25; } }
#rd .rd-scroll { overflow: auto; flex: 1; min-height: 0; }
#rd .rd-lt { padding: 4px 22px 10px; font: 19px/1.55 Georgia, serif; }
#rd .rd-lt.showen .rd-en { display: block; }
#rd .rd-l { margin: 0 0 6px; } #rd .rd-l .who { font: 800 12px "Segoe UI", sans-serif; letter-spacing: .05em; text-transform: uppercase; margin-right: 6px; }
#rd .rd-l.lit { background: #fff0a0; border-radius: 6px; box-shadow: 0 0 0 3px #fff0a0; }
#rd .rd-shelf { padding: 12px 16px; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
#rd .rd-bk { display: flex; gap: 10px; align-items: center; text-align: left; background: #fff; border: 2px solid rgba(43,34,53,.18); border-radius: 12px; padding: 8px; cursor: pointer; font: 600 14px "Segoe UI", sans-serif; }
#rd .rd-bk:hover, #rd .rd-bk.sel { border-color: #2b2235; background: #fff3c4; }
#rd .rd-bk canvas { width: 46px; height: 64px; border-radius: 3px 6px 6px 3px; flex: 0 0 auto; }
#rd .rd-bk b { display: block; font: 800 15px Georgia, serif; } #rd .rd-bk small { display: block; opacity: .65; }
.rd-j .ph-h { margin: 14px 0 6px; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; opacity: .65; }
.rd-jgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
.rd-jcard { display: flex; flex-direction: column; gap: 3px; align-items: flex-start; padding: 9px 11px; border-radius: 14px; background: #fff; border: 2px solid rgba(43,34,53,.15); }
.rd-jcard b { font: 700 16px Georgia, serif; } .rd-jcard span { font-size: 12px; opacity: .7; } .rd-jcard.rd-diary { background: #f4f0ff; } .rd-jcard.rd-miss { opacity: .5; border-style: dashed; }
.rd-jcard button { border: 2px solid #2b2235; border-radius: 8px; background: transparent; font-size: 12px; font-weight: 800; padding: 1px 9px; margin-top: 3px; cursor: pointer; }
.rd-jlist div { padding: 4px 0; font-size: 15px; } .rd-jlist span { opacity: .65; font-size: 13px; } .rd-jlist small { display: block; margin-left: 24px; font-size: 12px; opacity: .7; }
`;
  function css() { if (document.getElementById('rd-css')) return; const s = document.createElement('style'); s.id = 'rd-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ------------------------------------------------------------ the overlay: one panel at a time; keys are ours while it's open
  let root = null, openN = 0, keyFn = null, typingWas = false, lockWas = 0, glossEl = null;
  function ensure() {
    css();
    if (!root) { root = document.createElement('div'); root.id = 'rd'; root.className = 'hidden'; document.body.appendChild(root); root.addEventListener('pointerdown', e => { if (glossEl && !glossEl.contains(e.target) && !e.target.closest('.rd-w')) hideGloss(); }); }
    return root;
  }
  function open(cls) {
    ensure();
    if (!openN++) {
      typingWas = typeof Input !== 'undefined' ? Input.typing : false;
      if (typeof Input !== 'undefined') Input.typing = true;                 // (the game's keys sleep while a panel is up)
      const G = READ.G; if (G && G.sim && !G.journalOpen) { lockWas = G.sim.lock || 0; G.sim.lock = 1; }
    }
    root.className = cls || '';
    root.innerHTML = '';
    return root;
  }
  function close() {
    SPEECH.stop(); hideGloss();
    if (!root) return;
    if (openN > 0 && !--openN) {
      root.className = 'hidden'; root.innerHTML = '';
      if (typeof Input !== 'undefined') Input.typing = !!typingWas;
      const G = READ.G; if (G && G.sim && !G.journalOpen) G.sim.lock = lockWas;
      setKeys(null);
    }
  }
  function setKeys(fn) {
    if (keyFn) removeEventListener('keydown', keyFn, true);
    keyFn = fn ? e => {
      const inBox = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
      if (inBox && e.code !== 'Escape') return;                              // (typing: the box gets every key but Esc)
      if (fn(e) !== false) { e.preventDefault(); e.stopPropagation(); }
    } : null;
    if (keyFn) addEventListener('keydown', keyFn, true);
  }
  const say = (txt, ms) => { if (typeof UI !== 'undefined' && UI.toast) UI.toast(txt); };
  const click = () => { if (typeof Sound !== 'undefined') try { Sound.play('click'); } catch (e) { /* */ } };
  const pageSnd = () => { if (typeof Sound !== 'undefined') try { Sound.play('page'); } catch (e) { /* */ } };

  // ------------------------------------------------------------ words you can tap: es/pt/de through DICT.tokens, zh/ja by notation token
  const CJ_CHUNK = /(?:[^\s[\]]*\[[^\]]*\])+[^\s[\]]*|\S+/g;
  const CJ_PUNCT = /^[。、，！？「」『』（）：；…—・,.!?:;()«»"“”]+$/;
  function wordsHTML(src) {
    const text = fill(src), l = L();
    if (cj()) {
      const roman = CJK.mode(l) !== 'chars', chunks = text.match(CJ_CHUNK) || [];
      let out = '';
      chunks.forEach((ch, i) => {
        const pun = CJ_PUNCT.test(ch);
        if (roman && i && !pun) out += ' ';
        out += pun ? CJK.html(ch, { lang: l }) : `<span class="rd-w" data-src="${esc(ch)}">${CJK.html(ch, { lang: l })}</span>`;
      });
      return out;
    }
    let toks = [];
    try { toks = DICT.tokens(text) || []; } catch (e) { toks = []; }
    let out = '', at = 0;
    for (const t of toks) {
      if (t.s < at) continue;
      if (t.s > at) out += esc(text.slice(at, t.s));
      const w = text.slice(t.s, t.e);
      out += t.word === false ? esc(w) : `<span class="rd-w" data-w="${esc(w)}">${esc(w)}</span>`;
      at = t.e;
    }
    return out + esc(text.slice(at));
  }
  const sayText = src => SPEECH.textOf(src, L());
  // "read": every word of a sentence you read (or heard) counts toward your vocabulary; zh/ja: the ruby's fading counts it too
  function markRead(src, how = 'read') {
    const text = fill(src);
    try { DICT.metAll(DICT.analyze(cj() ? CJK.chars(text, { lang: L() }) : text), how); } catch (e) { /* */ }
    if (cj()) try { CJK.seen(text, { lang: L() }); } catch (e) { /* */ }
  }

  // ------------------------------------------------------------ the gloss card (tap a word)
  function hideGloss() { if (glossEl) { glossEl.remove(); glossEl = null; } if (root) root.querySelectorAll('.rd-w.on').forEach(x => x.classList.remove('on')); }
  function glossOf(el, item) {
    const src = el.dataset.src, w = el.dataset.w, l = L();
    const surface = src ? CJK.chars(src, { lang: l }) : w;
    const ctxEl = el.closest('[data-text]'), ctx = ctxEl ? { text: fill(ctxEl.dataset.text) } : {};
    // the piece's own glossary wins (its author knows the context, and covers what the pack lacks or reads wrong);
    // the tap still counts for the pack's headword when there's one with this very spelling
    const own = (item && item.gloss) || {}, key = src || w, own1 = own[key] || own[surface] || own[String(surface).toLowerCase()];
    let g = null;
    if (own1) {
      g = { en: own1, own: true };
      try { const n = READ._.NORM(surface), e = (DICT.find(surface) || []).find(x => READ._.NORM(x.lemma) === n); if (e) g.id = e.id; } catch (e) { /* */ }
    } else { try { g = DICT.gloss(surface, ctx); } catch (e) { g = null; } }
    if (g && g.id) try { DICT.met(g.id, 'gloss'); } catch (e) { /* */ }
    return { g, surface, src };
  }
  function showGloss(el, item) {
    hideGloss();
    const { g, surface, src } = glossOf(el, item), l = L();
    el.classList.add('on');
    const read = src && cj() ? CJK.roman(src, { lang: l }) : '';
    glossEl = document.createElement('div'); glossEl.className = 'rd-gloss';
    const pos = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', pron: 'pronoun', det: 'determiner', prep: 'preposition', conj: 'conjunction', num: 'number', int: 'interjection', name: 'name', phrase: 'phrase', part: 'particle', cl: 'measure word' };
    glossEl.innerHTML = `<b>${esc(surface)}</b>${read && read !== surface ? ` <small style="display:inline">${esc(read)}</small>` : ''}<button data-say>🔊</button>`
      + (g ? `<div class="f">${esc(g.form || (g.lemma && g.lemma !== surface ? `${g.lemma}: ${g.en}` : g.en) || '')}</div>${g.pos ? `<small>${esc(pos[g.pos] || g.pos)}${g.lemma && !g.form ? '' : ''}</small>` : ''}`
        : `<div class="f">Not in ${esc(READ.mimo())}’s dictionary yet.</div><small>Guess from the sentence, or ask for the English.</small>`);
    root.appendChild(glossEl);
    const r = el.getBoundingClientRect(), gw = glossEl.offsetWidth, gh = glossEl.offsetHeight;
    glossEl.style.left = Math.max(8, Math.min(innerWidth - gw - 8, r.left + r.width / 2 - gw / 2)) + 'px';
    glossEl.style.top = (r.top - gh - 10 > 8 ? r.top - gh - 10 : r.bottom + 10) + 'px';
    glossEl.querySelector('[data-say]').onclick = e => { e.stopPropagation(); speakNow([{ text: src || surface, who: 'gloss' }]); };
  }
  function wireTaps(container, item) {
    container.querySelectorAll('.rd-w').forEach(el => el.onclick = e => { e.stopPropagation(); click(); showGloss(el, item); });
  }

  // speech with highlighting; no voice → a note (once a panel) instead of a hang
  let voiceNoteShown = false;
  function speakNow(lines, o = {}) {
    const ctl = SPEECH.play(lines.map(x => ({ text: x.text, who: x.who || 'narrator' })), { lang: L(), onLine: o.onLine });
    ctl.done.then(r => { if (!r.ok && o.onFail) o.onFail(r); else if (!r.ok && !voiceNoteShown) { voiceNoteShown = true; say(SPEECH.NO_VOICE); } });
    return ctl;
  }

  // ------------------------------------------------------------ the cover (a book's look: drawn on a canvas)
  function coverCanvas(item, w = 420, h = 580) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d'), col = (item.cover && item.cover.bg) || '#5a3a6b', ink = (item.cover && item.cover.ink) || '#fff6d8', k = w / 420;
    c.fillStyle = col; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, 0, 22 * k, h);                                             // the spine
    c.strokeStyle = ink; c.globalAlpha = 0.55; c.lineWidth = 4 * k; c.strokeRect(40 * k, 26 * k, w - 66 * k, h - 52 * k); c.globalAlpha = 1;
    drawEmblem(c, (item.cover && item.cover.icon) || 'book', w / 2 + 9 * k, h * 0.6, 110 * k, ink);
    // the title, wrapped
    c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle';
    const title = READ.plain(item.title || ''), words = title.split(/\s+/), lines = []; let cur = '';
    c.font = `800 ${Math.round(40 * k)}px Georgia, serif`;
    for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (c.measureText(t).width > w - 110 * k && cur) { lines.push(cur); cur = wd; } else cur = t; }
    if (cur) lines.push(cur);
    lines.slice(0, 4).forEach((ln, i) => c.fillText(ln, w / 2 + 9 * k, 92 * k + i * 46 * k));
    c.font = `700 ${Math.round(20 * k)}px "Segoe UI", sans-serif`; c.globalAlpha = 0.85; c.fillText(READ.BAND(item.band), w / 2 + 9 * k, h - 56 * k); c.globalAlpha = 1;
    return cv;
  }
  // small emblems, drawn with the one ink line: moon, pot, bell, book, star, leaf, wave, key, sun
  function drawEmblem(c, kind, x, y, s, ink) {
    c.save(); c.translate(x, y); c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = s * 0.06; c.lineCap = 'round'; c.lineJoin = 'round';
    const circ = (cx, cy, r, f) => { c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); f ? c.fill() : c.stroke(); };
    if (kind === 'moon') {
      circ(0, 0, s * 0.62, false);
      c.globalAlpha = 0.9; c.beginPath(); c.ellipse(-s * 0.1, s * 0.08, s * 0.16, s * 0.24, -0.3, 0, Math.PI * 2); c.fill();          // the rabbit, sitting
      c.beginPath(); c.ellipse(-s * 0.17, -s * 0.24, s * 0.05, s * 0.16, -0.35, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(-s * 0.04, -s * 0.26, s * 0.05, s * 0.16, 0.15, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(s * 0.12, s * 0.22, s * 0.16, s * 0.08, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    } else if (kind === 'pot') {
      c.beginPath(); c.moveTo(-s * 0.6, -s * 0.1); c.quadraticCurveTo(-s * 0.62, s * 0.55, 0, s * 0.58); c.quadraticCurveTo(s * 0.62, s * 0.55, s * 0.6, -s * 0.1); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.72, -s * 0.12); c.lineTo(s * 0.72, -s * 0.12); c.stroke();
      for (const dx of [-0.25, 0, 0.25]) { c.beginPath(); c.moveTo(dx * s, -s * 0.28); c.bezierCurveTo((dx - 0.12) * s, -s * 0.45, (dx + 0.12) * s, -s * 0.55, dx * s, -s * 0.72); c.stroke(); }
    } else if (kind === 'bell') {
      c.beginPath(); c.moveTo(-s * 0.55, s * 0.4); c.quadraticCurveTo(-s * 0.48, -s * 0.5, 0, -s * 0.55); c.quadraticCurveTo(s * 0.48, -s * 0.5, s * 0.55, s * 0.4); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.68, s * 0.42); c.lineTo(s * 0.68, s * 0.42); c.stroke(); circ(0, s * 0.56, s * 0.1, true); circ(0, -s * 0.66, s * 0.08, false);
      for (const a of [-1, 1]) { c.beginPath(); c.arc(0, 0, s * 0.85, -Math.PI / 2 + a * 0.9 - 0.25, -Math.PI / 2 + a * 0.9 + 0.25); c.stroke(); }
    } else if (kind === 'key') {
      circ(-s * 0.35, 0, s * 0.22, false); c.beginPath(); c.moveTo(-s * 0.13, 0); c.lineTo(s * 0.6, 0); c.moveTo(s * 0.4, 0); c.lineTo(s * 0.4, s * 0.18); c.moveTo(s * 0.55, 0); c.lineTo(s * 0.55, s * 0.14); c.stroke();
    } else if (kind === 'sun') {
      circ(0, 0, s * 0.3, false); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; c.beginPath(); c.moveTo(Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42); c.lineTo(Math.cos(a) * s * 0.62, Math.sin(a) * s * 0.62); c.stroke(); }
    } else if (kind === 'leaf') {
      c.beginPath(); c.moveTo(0, s * 0.62); c.quadraticCurveTo(-s * 0.62, 0, 0, -s * 0.62); c.quadraticCurveTo(s * 0.62, 0, 0, s * 0.62); c.stroke(); c.beginPath(); c.moveTo(0, s * 0.62); c.lineTo(0, -s * 0.4); c.stroke();
    } else {                                                        // an open book
      c.beginPath(); c.moveTo(0, -s * 0.3); c.quadraticCurveTo(-s * 0.3, -s * 0.48, -s * 0.66, -s * 0.36); c.lineTo(-s * 0.66, s * 0.38); c.quadraticCurveTo(-s * 0.3, s * 0.26, 0, s * 0.44); c.quadraticCurveTo(s * 0.3, s * 0.26, s * 0.66, s * 0.38); c.lineTo(s * 0.66, -s * 0.36); c.quadraticCurveTo(s * 0.3, -s * 0.48, 0, -s * 0.3); c.lineTo(0, s * 0.44); c.stroke();
    }
    c.restore();
  }
  // a little Mimo for the question bubble (teal, two long ears), as SVG
  const MIMO_SVG = '<svg class="rd-mimo" viewBox="0 0 54 54"><ellipse cx="18" cy="14" rx="5" ry="13" fill="#2fb3a1" stroke="#2b2235" stroke-width="2.5" transform="rotate(-14 18 14)"/><ellipse cx="34" cy="13" rx="5" ry="13" fill="#2fb3a1" stroke="#2b2235" stroke-width="2.5" transform="rotate(12 34 13)"/><ellipse cx="27" cy="34" rx="18" ry="16" fill="#2fb3a1" stroke="#2b2235" stroke-width="2.5"/><ellipse cx="27" cy="39" rx="10" ry="8" fill="#fff6dc"/><circle cx="21" cy="31" r="2.6" fill="#2b2235"/><circle cx="33" cy="31" r="2.6" fill="#2b2235"/><ellipse cx="16" cy="37" rx="3" ry="1.8" fill="#ff9b9b"/><ellipse cx="38" cy="37" rx="3" ry="1.8" fill="#ff9b9b"/></svg>';

  // ------------------------------------------------------------ pages (a book, a diary page, a note): tap, 🔊, EN, page turns
  // o: { start, st (the save's record: .page), diary (the diary's look), last ('Done ▸' label), title }
  // → 'end' (past the last page) | 'close'
  function pages(item, o = {}) {
    return new Promise(resolve => {
      const P = item.pages || [item.text || []], N = P.length;
      let i = Math.max(0, Math.min(N - 1, o.start || 0)), en = false, ctl = null;       // (EN starts off in every piece: on request, DESIGN.md 17.3)
      const marked = new Set();
      const card = document.createElement('div'); card.className = 'rd-card';
      root.className = o.diary ? 'diary' : ''; root.innerHTML = '<div class="rd-shade"></div>'; root.appendChild(card);
      const stopAudio = () => { if (ctl) { ctl.stop(); ctl = null; } card.querySelectorAll('.lit').forEach(x => x.classList.remove('lit')); const b = card.querySelector('[data-a="page"]'); if (b) b.classList.remove('on'); };
      const markPage = k => { if (marked.has(k)) return; marked.add(k); P[k].forEach(s => markRead(s[0])); };
      function draw() {
        hideGloss();
        const body = P[i].map((s, k) => `<span class="rd-s" data-k="${k}" data-text="${esc(s[0])}">${wordsHTML(s[0])}<button class="rd-sb" data-k="${k}" title="Hear this sentence">🔊</button></span> <span class="rd-en">${esc(s[1] || '')}</span>`).join('');
        card.innerHTML = `<div class="rd-top"><span class="k">${esc(o.kind || (o.diary ? 'Noa’s diary' : 'Reading'))}</span><span class="t">${READ.html(item.title || '')}</span><i class="rd-band">${READ.BAND(item.band)}</i><button class="rd-x" data-a="x" title="Close (Esc)">✕</button></div>`
          + `<div class="rd-body ${en ? 'showen' : ''}"><div class="rd-para">${body}</div></div>`
          + `<div class="rd-foot"><button class="rd-btn" data-a="prev" ${i ? '' : 'disabled'}>◀</button><span class="rd-pg">${N > 1 ? `page ${i + 1} / ${N}` : ''}</span>`
          + `<button class="rd-btn" data-a="page" title="Read the page aloud (Space)">🔊 ${N > 1 ? 'Page' : 'Read it'}</button><button class="rd-btn ${en ? 'on' : ''}" data-a="en" title="English under each sentence (T)">EN</button>`
          + `<span class="rd-note sp"></span><button class="rd-btn main" data-a="next">${i < N - 1 ? 'Next ▶' : esc(o.last || 'Done ▸')}</button></div>`;
        wireTaps(card, item);
        card.querySelectorAll('.rd-sb').forEach(b => b.onclick = e => { e.stopPropagation(); playFrom(+b.dataset.k, true); });
        card.querySelector('[data-a="x"]').onclick = () => finish('close');
        card.querySelector('[data-a="prev"]').onclick = () => turn(-1);
        card.querySelector('[data-a="next"]').onclick = () => turn(1);
        card.querySelector('[data-a="page"]').onclick = () => (ctl ? stopAudio() : playFrom(0, false));
        card.querySelector('[data-a="en"]').onclick = () => toggleEN();
        if (o.st) o.st.page = i;
      }
      function playFrom(k, one) {
        stopAudio();
        const lines = (one ? [P[i][k]] : P[i].slice(k)).map(s => ({ text: s[0], who: o.voice || 'narrator' }));
        const pb = card.querySelector('[data-a="page"]'); if (!one && pb) pb.classList.add('on');
        const my = speakNow(lines, {
          onLine: j => { card.querySelectorAll('.rd-s.lit').forEach(x => x.classList.remove('lit')); if (j >= 0) { const el = card.querySelector(`.rd-s[data-k="${one ? k : k + j}"]`); if (el) { el.classList.add('lit'); el.scrollIntoView({ block: 'nearest' }); } } },
          onFail: () => { const n = card.querySelector('.rd-note'); if (n) { n.textContent = SPEECH.NO_VOICE; n.classList.add('warn'); } },
        });
        ctl = my;
        my.done.then(() => { if (ctl === my) stopAudio(); });
      }
      function toggleEN() { en = !en; click(); const b = card.querySelector('.rd-body'); b.classList.toggle('showen', en); card.querySelector('[data-a="en"]').classList.toggle('on', en); }
      function turn(d) {
        stopAudio();
        if (d > 0) markPage(i);
        if (d > 0 && i >= N - 1) return finish('end');
        const j = i + d; if (j < 0 || j >= N) return;
        i = j; pageSnd(); draw(); card.querySelector('.rd-body').scrollTop = 0;
      }
      function finish(how) { stopAudio(); setKeys(null); resolve(how); }
      setKeys(e => {
        const c = e.code;
        if (c === 'Escape') { if (glossEl) hideGloss(); else finish('close'); }
        else if (c === 'ArrowRight' || c === 'KeyD' || c === 'KeyE' || c === 'Enter') turn(1);
        else if (c === 'ArrowLeft' || c === 'KeyA') turn(-1);
        else if (c === 'Space') { if (ctl) stopAudio(); else playFrom(0, false); }
        else if (c === 'KeyT' || c === 'Tab') toggleEN();
        else return false;
      });
      draw();
    });
  }

  // ------------------------------------------------------------ the cover: the look, the coverage, and where you stopped
  function coverage(item) {
    const all = (item.pages || [item.text || []]).flat().map(s => fill(s[0])).join(' ');
    try { const c = DICT.coverage(cj() ? CJK.chars(all, { lang: L() }) : all); return c; } catch (e) { return null; }
  }
  function coverView(item, st) {
    return new Promise(resolve => {
      const c = coverage(item), pct = c ? Math.round(c.share * 100) : null;
      const how = pct == null ? '' : pct >= 95 ? 'Easy reading for you: the sweet spot is about 95%.' : pct >= 85 ? 'A good stretch: tap the words you don’t know.' : pct >= 60 ? 'Hard, but you can do it: tap words as you go, and use 🔊.' : pct >= 30 ? 'Very hard for now. Try it anyway: every word you tap or hear counts.'
        : 'Most of these words are new to you, and that’s fine: tap them as you go, use 🔊 and EN. Every word you meet here counts toward knowing it.';
      const resume = st && !st.done && st.page > 0;
      const card = document.createElement('div'); card.className = 'rd-card';
      root.className = ''; root.innerHTML = '<div class="rd-shade"></div>'; root.appendChild(card);
      card.innerHTML = `<div class="rd-top"><span class="k">${esc(item.shelf || 'A book from Alba’s library')}</span><span class="t"></span><button class="rd-x" data-a="x">✕</button></div>`
        + `<div class="rd-cover"><div class="cv"></div><div><h2 class="rd-ttl" title="Tap for the title in English" style="cursor:pointer">${READ.html(item.title)}</h2><div class="en hidden">${esc(item.en || '')}</div><div class="by">${esc(item.by || '')}${item.from ? ' · ' + esc(item.from) : ''} · <i class="rd-band">${READ.BAND(item.band)}</i> · ${esc(String(item.words || words(item)))} words</div>`
        + (item.blurb ? `<p>${esc(item.blurb)}</p>` : '')
        + (pct != null ? `<div class="rd-meter"><span>You know ${pct}% of the words</span><i><b style="width:${pct}%"></b></i><small>${esc(how)}${c && c.unknown ? ` About ${c.unknown.length} words are new to you.` : ''}</small></div>` : '')
        + (st && st.done ? `<p class="rd-note">You’ve read it${st.times > 1 ? ` ${st.times} times` : ''}.${st.grades && st.grades.length ? ` Best answer: ${READ.best(st.grades)}.` : ''}</p>` : '')
        + `<div class="rd-foot" style="border:0;padding:8px 0 0">${resume ? `<button class="rd-btn main" data-a="go">Go on from page ${st.page + 1} ▶</button><button class="rd-btn" data-a="restart">Start over</button>` : `<button class="rd-btn main" data-a="go">${st && st.done ? 'Read it again ▶' : 'Start reading ▶'}</button>`}<button class="rd-btn" data-a="x">Not now</button></div></div></div>`;
      card.querySelector('.cv').appendChild(coverCanvas(item));
      // (the title's English on request, a tap: DESIGN.md 17.3, never under it by default)
      card.querySelector('.rd-ttl').onclick = () => card.querySelector('.rd-cover .en').classList.toggle('hidden');
      const done = v => { setKeys(null); resolve(v); };
      card.querySelectorAll('[data-a="x"]').forEach(b => b.onclick = () => done('close'));
      card.querySelector('[data-a="go"]').onclick = () => done(resume ? 'resume' : 'start');
      const rs = card.querySelector('[data-a="restart"]'); if (rs) rs.onclick = () => done('start');
      setKeys(e => { if (e.code === 'Escape') done('close'); else if (e.code === 'Enter' || e.code === 'KeyE' || e.code === 'Space') done(resume ? 'resume' : 'start'); else return false; });
    });
  }
  const words = item => (item.pages || [item.text || []]).flat().reduce((n, s) => n + (cj() ? (CJK.plain(s[0], { lang: L(), mode: 'chars' }).replace(/[\s\p{P}]/gu, '').length) : String(s[0]).split(/\s+/).filter(Boolean).length), 0);

  // ------------------------------------------------------------ questions: Mimo asks, you answer in your own words, S–D
  const PRAISE = {
    es: { S: '¡Perfecto!', A: '¡Muy bien!', B: '¡Bien!', C: '¡Casi!', D: 'Así:' }, pt: { S: 'Perfeito!', A: 'Muito bem!', B: 'Boa!', C: 'Quase!', D: 'Assim:' },
    de: { S: 'Perfekt!', A: 'Sehr gut!', B: 'Gut!', C: 'Fast!', D: 'So:' },
    zh: { S: '[太棒了|tài bàng le] ！', A: '[很|hěn] [好|hǎo] ！', B: '[不错|bù cuò] ！', C: '[差不多|chà bu duō] ！', D: '[这样|zhè yàng] [说|shuō] ：' },
    ja: { S: '[完璧|かんぺき] ！', A: 'すごい ！', B: 'いい ね ！', C: 'おしい ！', D: 'こう いう ：' },
  };
  // Mimo's questions and lines are mixed by the weave like every line (js/talk/mix.js, DESIGN.md 16): the English with the words
  // you know in the language, whole lines in the language only as the weave rises. The book itself stays in the language.
  const mixOn = () => typeof MIX !== 'undefined' && MIX.ok();
  const mixQ = (t, en) => (mixOn() && t && en ? MIX.line(fill(t), fill(en), { count: true }) : { full: true, html: READ.html(t || ''), under: false });
  const PRAISE_EN = { S: 'Perfect!', A: 'Very good!', B: 'Good!', C: 'Almost!', D: 'Like this:' };
  const praise = g => mixQ((PRAISE[L()] || PRAISE.es)[g] || '', PRAISE_EN[g]).html;
  // the ids of the words a piece uses (its sentences, its lines): those count as met for its questions
  function textIds(item) {
    const out = new Set(); if (!mixOn() || !item) return out;
    const src = [].concat(...(item.pages || [item.text || []])).map(s => s && s[0]).concat((item.lines || []).map(l => l && l.text)).filter(Boolean);
    for (const s of src) for (const w of MIX.words(fill(s))) out.add(w.id);
    return out;
  }
  const MORE = { es: '(porque…, cuando…, y después…)', pt: '(porque…, quando…, e depois…)', de: '(weil…, als…, und dann…)', zh: '(因为…, 然后…)', ja: '(から…, それから…)' };
  function markFix(orig, fixed) {
    const A = String(orig).trim().split(/\s+/), B = String(fixed).trim().split(/\s+/), n = A.length, m = B.length;
    if (cj()) return esc(fixed);
    const k = s => READ._.NORM(s).replace(/[^\p{L}\p{N}]/gu, '') + '|' + s;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = k(A[i]) === k(B[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (j < m) { if (i < n && k(A[i]) === k(B[j])) { out.push(esc(B[j])); i++; j++; } else if (i < n && dp[i + 1][j] >= dp[i][j + 1]) i++; else { out.push(`<mark>${esc(B[j])}</mark>`); j++; } }
    return out.join(' ');
  }
  // one question → { grade: 'S'…'D' | null (skipped), text }
  function askOne(q, o) {
    return new Promise(resolve => {
      const m = o.mount, band = o.band || 1, lang = L();
      let help = 0, tries = 0, busy = false, doneV = null;
      // the question mixed by the weave (EN: the whole English; 🔊: hear it and see it in the language)
      const qx = mixQ(q.ask, q.en);
      // words the model needs that the piece didn't use and you don't know yet: shown first, with their English and a picture
      const nws = mixOn() && q.model ? MIX.newWords(fill(q.model), { inText: o.inText || new Set() }).slice(0, 3) : [];
      nws.forEach(w => { try { DICT.met(w.id, 'heard'); } catch (e) { /* */ } });
      const nwHTML = nws.length ? `<div class="rd-nw"><span class="lab">✨ ${nws.length > 1 ? 'Words' : 'A word'} you may need</span>${nws.map((w, k) => `<span class="nw">${w.icon ? `<img src="${w.icon}" alt="">` : ''}<b>${w.src && cj() ? CJK.html(w.src, { lang, cap: false }) : esc(w.t)}</b><i>${esc(w.en)}</i><button type="button" data-nw="${k}" title="Hear it">🔊</button></span>`).join('')}</div>` : '';
      m.innerHTML = `<div class="rd-ask"><div class="rd-qrow">${MIMO_SVG}<div class="rd-q"><span class="who">${esc(READ.mimo())} asks${o.n > 1 ? ` · ${o.k + 1} of ${o.n}` : ''}</span><span class="qt mx">${qx.html}</span><button data-a="say" title="Hear it">🔊</button><button data-a="en">EN</button><div class="qen ${qx.full && qx.under ? '' : 'hidden'}">${esc(q.en || '')}</div>${qx.full ? '' : `<div class="qtl hidden">${READ.html(q.ask)}</div>`}</div></div>${nwHTML}`
        + `<div class="rd-help hidden"></div><form class="rd-form"><input class="rd-in" autocomplete="off" spellcheck="false" placeholder="Answer in ${LANGNAME[lang] || 'the language'}, in your own words…"><button class="rd-btn main" type="submit">Answer</button></form>`
        + `<div class="rd-fb hidden"></div><div class="rd-arow"><button class="rd-btn" type="button" data-a="help">Help</button><button class="rd-btn" type="button" data-a="skip">Skip</button><span class="rd-note">${esc(o.note || '')}</span></div></div>`;
      const input = m.querySelector('.rd-in'), fb = m.querySelector('.rd-fb'), hp = m.querySelector('.rd-help'), form = m.querySelector('.rd-form');
      if (cj() && CJK.mode(lang) === 'chars' && CJK.attachIME) try { CJK.attachIME(input); } catch (e) { /* */ }
      setTimeout(() => input.focus(), 60);
      const qsay = () => { speakNow([{ text: q.ask, who: 'mimo-q' }]); const tl = m.querySelector('.qtl'); if (tl) tl.classList.remove('hidden'); };
      m.querySelector('[data-a="say"]').onclick = qsay;
      m.querySelectorAll('[data-nw]').forEach(b => { b.onclick = () => { const w = nws[+b.dataset.nw]; if (w) speakNow([{ text: w.src || w.t, who: 'mimo-q' }]); }; });
      m.querySelector('[data-a="en"]').onclick = () => m.querySelector('.qen').classList.toggle('hidden');
      const helpBtn = m.querySelector('[data-a="help"]');
      const RUNG = ['', 'Start with', 'Hint', 'Like this'];
      function showHelp() {
        help++;
        const rung = help === 1 && !q.starter ? 2 : help;
        if (rung >= 3 || (help >= 2 && !q.hint && !q.example)) return model('help');
        const v = rung === 1 ? READ.html(q.starter) : q.example ? READ.html(q.example) : esc(q.hint);
        hp.innerHTML = `<span class="lab">${RUNG[rung]}</span>${v}`; hp.classList.remove('hidden');
        helpBtn.textContent = 'Show me'; input.focus();
      }
      function next(v) {
        doneV = v;
        const row = m.querySelector('.rd-arow'); form.classList.add('hidden');
        row.innerHTML = `<button class="rd-btn main" type="button" data-a="next">${o.k + 1 < o.n ? 'Next question ▶' : 'Done ▸'}</button>`;
        row.querySelector('[data-a="next"]').onclick = () => resolve(doneV);
        setTimeout(() => row.querySelector('[data-a="next"]').focus(), 30);
      }
      function model(why) {
        fb.innerHTML = `<div class="say mx"><i class="rd-grade rd-gd">D</i>${praise('D')} «${READ.html(q.model || '')}»</div><div class="tip">${why === 'help' ? 'No grade this time: you saw the answer. Say it out loud once!' : 'That’s two tries. Here’s one way to say it.'}</div>`;
        fb.classList.remove('hidden'); hp.classList.add('hidden');
        if (q.model) speakNow([{ text: q.model, who: 'mimo-q' }], { onFail: () => {} });
        next({ grade: 'D', text: input.value, model: true });
      }
      helpBtn.onclick = () => { if (!busy) { click(); showHelp(); } };
      m.querySelector('[data-a="skip"]').onclick = () => { if (!busy) resolve({ grade: null, skipped: true }); };
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const text = input.value.trim(); if (!text || busy) return;
        busy = true; input.disabled = true;
        let r; try { r = await READ.judge(text, q.want || { any: true }, { band, help, lang, q, gloss: o.gloss }); } catch (err) { console.error('[reader]', err); r = { met: true, grade: 'A', understood: true, errors: [], fixed: text }; }
        busy = false; input.disabled = false;
        if (r.met && r.grade) {
          // (a word shown before the question that you then used counts as taught: in the language in lines from now on)
          if (nws.length && mixOn() && r.grade !== 'D') try { const used = new Set((DICT.analyze(text).words || []).map(w => w.id)); nws.forEach(w => { if (used.has(w.id)) MIX.taught(w.id); }); } catch (e2) { /* */ }
          const fixed = r.fixed && r.fixed !== text ? `<div class="fix">${markFix(text, r.fixed)}</div>` : '';
          const tips = (r.tips || []).slice(0, 2).map(t => `<div class="tip">${esc(t)}</div>`).join('');
          fb.innerHTML = `<div class="say mx"><i class="rd-grade rd-g${r.grade.toLowerCase()}">${r.grade}</i>${praise(r.grade)} ${q.yes ? READ.html(q.yes) : ''}</div>${fixed}${tips}`
            + (r.grade === 'A' && !(r.errors || []).length && !fixed ? `<div class="tip">Right! For an S, add a reason or a detail ${esc(MORE[lang] || '')}.</div>` : '');
          fb.classList.remove('hidden'); hp.classList.add('hidden');
          if (typeof Sound !== 'undefined') try { Sound.play(r.grade === 'S' || r.grade === 'A' ? 'learned' : 'review'); } catch (e2) { /* */ }
          return next({ grade: r.grade, text, r });
        }
        tries++;
        if (typeof Sound !== 'undefined') try { Sound.play('wrong'); } catch (e2) { /* */ }
        if (tries >= 2) return model('tries');
        const why = r.wrong ? 'Not quite. Look again: the answer is in the text.' : !r.understood ? `${READ.mimo()} doesn’t understand yet. Use ${LANGNAME[lang] || 'the language'}’s words, from the text if you like.` : 'Say a bit more: who, what, where?';
        // (asked again: in simpler words once questions come whole in the language; until then the mixed question again)
        const again = q.simple && (!mixOn() || qx.full) ? READ.html(q.simple) : qx.html;
        fb.innerHTML = `<div class="say mx">🤔 ${again}</div><div class="tip">${esc(why)}</div>`;
        fb.classList.remove('hidden'); input.select();
      });
      setKeys(e => { if (e.code === 'Escape') { resolve({ grade: null, skipped: true, closed: true }); return true; } if (e.code === 'Enter' && doneV) { resolve(doneV); return true; } return false; });
    });
  }
  // a list of questions → grades, logged per answer: DICT.log(skill, band, grade) (skill: 'read' | 'listen', or a function)
  async function ask(qs, o = {}) {
    qs = (qs || []).filter(q => q && READ.when(q.when));
    const out = [];
    for (let k = 0; k < qs.length; k++) {
      const r = await askOne(qs[k], Object.assign({}, o, { k, n: qs.length }));
      if (r.closed) { out.closed = true; break; }
      if (!r.grade) { out.push(null); continue; }
      const skill = typeof o.skill === 'function' ? o.skill() : (o.skill || 'read');
      try { DICT.log(skill, o.band || 1, r.grade); } catch (e) { /* */ }
      out.push(r.grade);
      if (o.onGrade) try { o.onGrade(r.grade, qs[k], skill); } catch (e) { /* */ }
    }
    return out;
  }
  // the end card: your grades, and what they count toward
  function summary(title, grades, o = {}) {
    return new Promise(resolve => {
      const card = document.createElement('div'); card.className = 'rd-card';
      root.className = o.diary ? 'diary' : ''; root.innerHTML = '<div class="rd-shade"></div>'; root.appendChild(card);
      const gs = grades.filter(Boolean), skill = o.skillName || 'reading';
      card.innerHTML = `<div class="rd-top"><span class="k">${esc(o.kind || 'Done')}</span><span class="t">${READ.html(title || '')}</span><button class="rd-x" data-a="x">✕</button></div><div class="rd-sum">`
        + `<div class="big">${gs.length ? gs.map(g => `<i class="rd-grade rd-g${g.toLowerCase()}">${g}</i>`).join('') : ''} ${esc(o.headline || (gs.length ? 'Well read!' : 'Done.'))}</div>`
        + (gs.length ? `<p>Your answers count toward your ${esc(skill)} level (${esc(READ.BAND(o.band || 1))} answers so far: ${esc(String(levelCount(o.skill || 'read', o.band)))}).</p>` : '<p class="rd-note">No answers this time. You can answer next time you open it.</p>')
        + (o.more ? `<p>${o.more}</p>` : '') + `<div class="rd-foot" style="border:0;padding:6px 0 0"><span class="sp"></span><button class="rd-btn main" data-a="x">Close</button></div></div>`;
      const done = () => { setKeys(null); resolve(); };
      card.querySelectorAll('[data-a="x"]').forEach(b => b.onclick = done);
      setKeys(e => { if (['Escape', 'Enter', 'KeyE', 'Space'].includes(e.code)) done(); else return false; });
    });
  }
  function levelCount(skill, band) {
    try { const l = (DICT.toJSON().LOG || {})[L()] || {}; return ((l[skill] || []).filter(x => !band || x.b === band)).length; } catch (e) { return 0; }
  }
  // Mimo asks what happened: retell it, or 2–3 questions
  function choice(title, opts) {
    return new Promise(resolve => {
      const card = document.createElement('div'); card.className = 'rd-card';
      root.className = ''; root.innerHTML = '<div class="rd-shade"></div>'; root.appendChild(card);
      card.innerHTML = `<div class="rd-top"><span class="k">The end</span><span class="t">${READ.html(title)}</span><button class="rd-x" data-a="x">✕</button></div><div class="rd-ask"><div class="rd-qrow">${MIMO_SVG}<div class="rd-q"><span class="who">${esc(READ.mimo())}</span>${esc(READ.mimo())} bounces up and down: it wants to know what happened! Tell it in your own words.</div></div>`
        + `<div class="rd-arow">${opts.map((op, i) => `<button class="rd-btn ${i ? '' : 'main'}" data-i="${i}">${esc(op.label)}${op.sub ? ` <small style="font-weight:500;opacity:.7">${esc(op.sub)}</small>` : ''}</button>`).join('')}</div></div>`;
      const done = v => { setKeys(null); resolve(v); };
      card.querySelectorAll('[data-i]').forEach(b => b.onclick = () => done(opts[+b.dataset.i].value));
      card.querySelector('[data-a="x"]').onclick = () => done(null);
      setKeys(e => { const d = /^Digit([1-9])$/.exec(e.code); if (d && opts[+d[1] - 1]) done(opts[+d[1] - 1].value); else if (e.code === 'Escape') done(null); else return false; });
    });
  }
  function askPanel(title, o = {}) {
    const card = document.createElement('div'); card.className = 'rd-card';
    root.className = o.diary ? 'diary' : ''; root.innerHTML = '<div class="rd-shade"></div>'; root.appendChild(card);
    card.innerHTML = `<div class="rd-top"><span class="k">${esc(o.kind || 'Your turn')}</span><span class="t">${READ.html(title || '')}</span></div><div class="mount"></div>`;
    return card.querySelector('.mount');
  }

  // ------------------------------------------------------------ a book, start to finish
  async function book(b, o = {}) {
    const st = READ.record('books', b.id), band = b.band || 1, res = { done: false, grades: [] };
    open('');
    try {
      const go = await coverView(b, st);
      if (go === 'close') return res;
      const end = await pages(b, { start: go === 'resume' ? st.page : 0, st, kind: b.shelf || 'Reading' });
      READ.save();
      if (end !== 'end') return res;
      st.done = true; st.page = 0; st.times = (st.times || 0) + 1; st.t = Date.now(); res.done = true;
      READ.save();
      const opts = [];
      if (b.retell) opts.push({ label: 'Tell the story', sub: 'in a few sentences', value: 'retell' });
      if (b.q && b.q.length) opts.push({ label: `Answer ${b.q.length} questions`, sub: 'short answers', value: 'q' });
      opts.push({ label: 'Not now', value: null });
      const how = opts.length > 1 ? await choice(b.title, opts) : null;
      if (how) {
        const mount = askPanel(b.title, { kind: how === 'retell' ? 'Tell the story' : 'Questions' });
        const qs = how === 'retell' ? [b.retell] : b.q;
        res.grades = await ask(qs, { mount, band, skill: 'read', gloss: b.gloss, inText: textIds(b), note: how === 'retell' ? 'Two or three key things are enough.' : '' });
        st.grades = (st.grades || []).concat(res.grades.filter(Boolean)).slice(-12);
        READ.save();
        if (!res.grades.closed) await summary(b.title, res.grades, { band, kind: 'Book finished', skill: 'read', more: b.after ? READ.html(b.after) : '' });
      }
      if (o.onDone) try { o.onDone(res); } catch (e) { /* */ }
      return res;
    } finally { close(); }
  }
  // a single page (Noa's diary, a note): the page, then its question(s)
  async function page(item, o = {}) {
    const res = { grades: [] }, band = item.band || 1;
    open(o.diary ? 'diary' : '');
    try {
      const end = await pages(item, { diary: !!o.diary, kind: o.kind || (o.diary ? 'Noa’s diary' : 'A note'), last: item.q && item.q.length && !o.noAsk ? 'Answer ▸' : 'Close', voice: o.voice || 'noa' });
      if (end !== 'end' || !item.q || !item.q.length || o.noAsk) return res;
      const mount = askPanel(item.title || '', { diary: !!o.diary, kind: o.kind || 'Your turn' });
      res.grades = await ask(item.q, { mount, band, skill: 'read', gloss: item.gloss, inText: textIds(item) });
      if (o.onGrades) try { o.onGrades(res.grades); } catch (e) { /* */ }
      return res;
    } finally { close(); }
  }

  // ------------------------------------------------------------ listening: the radio, overheard talk
  // show: { id, title, en, band, kind, lines: [{ who, text, en, when }], q, voices: { who: { name, pitch, rate, voice } } }
  // o: { dock (stay out of the way of the scene), station, names: { who: 'Ana' }, onLine(i, line), icon }
  async function listen(show, o = {}) {
    const lines = (show.lines || []).filter(l => READ.when(l.when)), band = show.band || 1, res = { grades: [], heard: false, read: false };
    for (const [who, v] of Object.entries(show.voices || {})) SPEECH.speaker(who, v);
    const nameOf = who => READ.plain((o.names && o.names[who]) || (show.voices && show.voices[who] && show.voices[who].name) || who);
    open(o.dock ? 'dock' : '');
    let ctl = null, peeked = false, readMode = false, played = false, closed = false;
    const card = document.createElement('div'); card.className = 'rd-card';
    root.innerHTML = '<div class="rd-shade"></div>'; root.appendChild(card);
    card.innerHTML = `<div class="rd-top"><span class="k">${esc(o.icon || '📻')} ${esc(o.station || '')}</span><span class="t">${show.title ? READ.html(show.title) : esc(show.en || '')}</span><i class="rd-band">${READ.BAND(band)}</i><button class="rd-x" data-a="x" title="Close (Esc)">✕</button></div>`
      + `<div class="rd-lctl"><button class="rd-btn main" data-a="play">▶ Play</button><button class="rd-btn ${SPEECH.slow ? 'on' : ''}" data-a="slow" title="About 0.8× speed">🐢 Slower</button><button class="rd-btn" data-a="words">📝 Show the words</button><button class="rd-btn hidden" data-a="en">EN</button><span class="rd-note"></span></div>`
      + `<div class="rd-scroll"><div class="rd-now"></div><div class="rd-lt hidden">${lines.map((l, i) => `<p class="rd-l rd-s" data-k="${i}" data-text="${esc(l.text)}"><span class="who">${esc(nameOf(l.who))}</span>${wordsHTML(l.text)}<span class="rd-en">${esc(l.en || '')}</span></p>`).join('')}</div><div class="mount"></div></div>`;
    const lt = card.querySelector('.rd-lt'), now = card.querySelector('.rd-now'), note = card.querySelector('.rd-note'), mount = card.querySelector('.mount');
    wireTaps(lt, show);
    const showWords = why => {
      lt.classList.remove('hidden'); card.querySelector('[data-a="words"]').classList.add('hidden'); card.querySelector('[data-a="en"]').classList.remove('hidden');
      if (why === 'peek' && !readMode) { peeked = true; note.textContent = 'With the words showing, your answer counts as reading.'; }
    };
    const light = i => { lt.querySelectorAll('.lit').forEach(x => x.classList.remove('lit')); const el = i >= 0 && lt.querySelector(`.rd-l[data-k="${i}"]`); if (el) { el.classList.add('lit'); if (!lt.classList.contains('hidden')) el.scrollIntoView({ block: 'nearest' }); } };
    const toRead = () => { readMode = true; showWords('novoice'); note.textContent = SPEECH.NO_VOICE + ': read it instead.'; note.classList.add('warn'); card.querySelector('[data-a="play"]').disabled = true; card.querySelector('[data-a="slow"]').disabled = true; };
    let asked = null;
    const startAsk = () => {
      if (asked || closed) return asked;
      asked = (async () => {
        res.grades = await ask(show.q, { mount, band, gloss: show.gloss, inText: textIds({ lines }), skill: () => (peeked || readMode ? 'read' : 'listen'), onGrade: () => showWords('after') });
        showWords('after');
        lines.forEach(l => markRead(l.text, played && !readMode && !peeked ? 'heard' : 'read'));
        res.heard = played && !readMode; res.read = readMode || peeked;
        mount.innerHTML = `<div class="rd-foot" style="border:0"><span class="rd-note sp">${res.grades.filter(Boolean).length ? 'Answers logged under ' + (res.read ? 'reading' : 'listening') + '.' : ''}</span><button class="rd-btn main" data-a="close2">Close</button></div>`;
        mount.querySelector('[data-a="close2"]').onclick = () => finish();
        setKeys(e => { if (['Escape', 'Enter', 'KeyE'].includes(e.code)) finish(); else return false; });
      })();
      return asked;
    };
    let finishR; const fin = new Promise(r => { finishR = r; });
    const finish = () => { if (closed) return; closed = true; if (ctl) ctl.stop(); finishR(); };
    function play() {
      if (ctl) { ctl.stop(); ctl = null; now.innerHTML = ''; card.querySelector('[data-a="play"]').textContent = '▶ Play again'; light(-1); return; }
      card.querySelector('[data-a="play"]').textContent = '■ Stop';
      const my = SPEECH.play(lines.map(l => ({ text: l.text, who: l.who })), { lang: L(), gap: 0.25,
        onLine: (i, l) => { light(i); now.innerHTML = i >= 0 ? `<span class="dot"></span><b>${esc(nameOf(l.who))}</b>` : ''; if (o.onLine) try { o.onLine(i, l); } catch (e) { /* */ } } });
      ctl = my;
      my.done.then(r => {
        if (ctl !== my) return; ctl = null;
        card.querySelector('[data-a="play"]').textContent = '▶ Play again'; now.innerHTML = ''; light(-1);
        if (o.onLine) try { o.onLine(-1, null); } catch (e) { /* */ }
        if (!r.ok) { toRead(); startAsk(); return; }
        if (!r.stopped) { played = true; startAsk(); }
      });
    }
    card.querySelector('[data-a="x"]').onclick = finish;
    card.querySelector('[data-a="play"]').onclick = () => { click(); play(); };
    card.querySelector('[data-a="slow"]').onclick = e => { SPEECH.slow = !SPEECH.slow; e.target.classList.toggle('on', SPEECH.slow); click(); };
    card.querySelector('[data-a="words"]').onclick = () => { click(); showWords('peek'); startAsk(); };
    card.querySelector('[data-a="en"]').onclick = e => { lt.classList.toggle('showen'); e.target.classList.toggle('on'); };
    setKeys(e => { if (e.code === 'Escape') finish(); else if (e.code === 'Space' && !readMode) play(); else return false; });
    try {
      await SPEECH.ready();
      if (!SPEECH.has(L())) { toRead(); startAsk(); }
      else play();
      await fin;
      return res;
    } finally { if (ctl) ctl.stop(); if (o.onLine) try { o.onLine(-1, null); } catch (e) { /* */ } close(); }
  }

  // ------------------------------------------------------------ a shelf: pick a book (the library)
  function shelf(books, o = {}) {
    open('');
    return new Promise(resolve => {
      const card = document.createElement('div'); card.className = 'rd-card';
      root.innerHTML = '<div class="rd-shade"></div>'; root.appendChild(card);
      const st = READ.S().books;
      card.innerHTML = `<div class="rd-top"><span class="k">${esc(o.kind || 'The shelves')}</span><span class="t">${esc(o.title || '')}</span><button class="rd-x" data-a="x">✕</button></div>`
        + (books.length ? `<div class="rd-shelf">${books.map((b, i) => { const r = st[b.id]; return `<button class="rd-bk" data-i="${i}"><span class="cv"></span><span><b>${READ.html(b.title)}</b><small>${esc(b.en || '')}</small><small><i class="rd-band">${READ.BAND(b.band)}</i> ${r && r.done ? '✓ read' : r && r.page ? 'reading' : ''}${r && r.grades && r.grades.length ? ' · ' + READ.best(r.grades) : ''}</small></span></button>`; }).join('')}</div>`
          : `<div class="rd-sum"><p>${esc(o.empty || 'This shelf is empty for now. More books are on their way.')}</p></div>`)
        + `<div class="rd-foot"><span class="rd-note sp">${esc(o.note || 'Tap a book to see its cover.')}</span><button class="rd-btn" data-a="x">Close</button></div>`;
      card.querySelectorAll('.rd-bk').forEach(b => { const bk = books[+b.dataset.i]; b.querySelector('.cv').appendChild(coverCanvas(bk, 92, 128)); b.onclick = () => done(bk); });
      const done = v => { setKeys(null); close(); resolve(v); };
      card.querySelectorAll('[data-a="x"]').forEach(b => b.onclick = () => done(null));
      setKeys(e => { const d = /^Digit([1-9])$/.exec(e.code); if (d && books[+d[1] - 1]) done(books[+d[1] - 1]); else if (e.code === 'Escape') done(null); else return false; });
    });
  }

  return {
    book, page, listen, ask, shelf, close, coverCanvas, wordsHTML, markRead, markFix, speakNow,
    get isOpen() { return openN > 0; },
    _: { pages, coverView, coverage, askOne, choice, summary, glossOf, showGloss, hideGloss, open, words, get root() { return root; } },
  };
})();
