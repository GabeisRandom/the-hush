'use strict';
// LIFEUI: the panels for LIFE (D2): a pen pal's letter (tap any word for its meaning, 🔊, EN on request), the writing desk
// (their letter beside your page, its points ticking off as you write), the envelope you post (a grade stamp), the corrected
// copy (like the exam review), the stamp album, result cards, the shift panel (customers, a board, your answer) and the
// debate view (the mayor, both speakers, the crowd; TALK.turn drives it like the phone's chats).
//   LIFEUI.letter(lt, o) · desk(lt, o) · posted(res, o) · review(entry, lt) · album(data) · card(def) · shift(def)
//   · debate(def) → a TALK view · drawStamp(cv, stamp) · isOpen · close() · _ (tests: LIFEUI._.T)
// Everything here is an overlay (#lf), drawn in the game's paper style; Esc closes or steps back.

const LIFEUI = (() => {
  const L = () => LIFE.L();
  const cj = () => LIFE.isC() && typeof CJK !== 'undefined';
  const E = s => LIFE.E(s);
  const P = s => LIFE.P(s);
  const INK = '#2b2235', TEAL = '#2f6f6a';
  const T = { fast: false, auto: null, last: null };
  const wait = ms => (T.fast || !ms ? Promise.resolve() : new Promise(r => setTimeout(r, ms)));
  const snd = k => LIFE.snd(k);
  const LANGNAME = LIFE.LANGNAME;
  const GRADE_EN = { S: 'Rich and right', A: 'Right (a small slip, or short)', B: 'One real mistake', C: 'Several mistakes', D: 'The model was shown' };

  // ------------------------------------------------------------ the overlay
  const CSS = `
#lf { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; font-family: "Trebuchet MS", "Segoe UI", system-ui, sans-serif; color: ${INK}; -webkit-font-smoothing: antialiased; }
#lf.hidden, #lf .hidden { display: none !important; }
#lf * { box-sizing: border-box; }
#lf .lf-shade { position: absolute; inset: 0; background: rgba(30,22,40,.45); }
#lf .lf-card { position: relative; width: min(1060px, calc(100vw - 16px)); max-height: calc(100vh - 16px); display: flex; flex-direction: column; background: #fffaf0; border: 3px solid ${INK}; border-radius: 20px; box-shadow: 0 0 0 6px #fff, 0 12px 0 5px rgba(43,34,53,.22); overflow: hidden; }
#lf .lf-card.narrow { width: min(720px, calc(100vw - 16px)); }
#lf .lf-head { display: flex; align-items: center; gap: 12px; padding: 9px 16px; border-bottom: 2px dashed rgba(43,34,53,.2); background: linear-gradient(90deg, #e7f2ef, #fffaf0); }
#lf .lf-head b { font: 800 20px Bahnschrift, "Segoe UI", sans-serif; } #lf .lf-head .sub { font-weight: 700; opacity: .7; font-size: 14px; } #lf .lf-head .sp { flex: 1; }
#lf .lf-head .x { border: 2.5px solid ${INK}; border-radius: 50%; width: 30px; height: 30px; font-weight: 900; background: #fff; cursor: pointer; }
#lf .lf-body { padding: 14px 20px; overflow: auto; flex: 1; min-height: 0; }
#lf .lf-foot { display: flex; align-items: center; gap: 8px; padding: 9px 16px; border-top: 2px dashed rgba(43,34,53,.2); background: #fff6e2; flex-wrap: wrap; }
#lf .lf-foot .nt { font-size: 13px; opacity: .75; } #lf .lf-foot .sp { flex: 1; }
#lf button { font: inherit; font-weight: 800; font-size: 14px; color: ${INK}; background: #fffaf0; border: 2.5px solid ${INK}; border-radius: 12px; padding: 5px 12px; cursor: pointer; box-shadow: 0 3px 0 rgba(43,34,53,.18); }
#lf button:hover { background: #fff3c4; } #lf button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(43,34,53,.18); }
#lf button.main { background: ${TEAL}; color: #fff; } #lf button.main:hover { background: #3a8a83; }
#lf button.sm { font-size: 11px; padding: 0 7px; border-width: 2px; border-radius: 8px; box-shadow: none; }
#lf button:disabled { opacity: .45; cursor: default; }
#lf ruby rt { font-size: 52%; font-weight: 600; opacity: .85; }
#lf .en { display: block; font-size: 13px; opacity: .72; font-weight: 600; margin-top: 2px; } #lf .en.hide { display: none; }
#lf .lf-w { cursor: help; border-bottom: 1.5px dotted rgba(47,111,106,.55); color: inherit; }
#lf .lf-w:hover { background: #fff3c4; }
#lf .lf-gl { position: fixed; z-index: 31; max-width: 300px; background: #fff; border: 2.5px solid ${INK}; border-radius: 12px; padding: 6px 10px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 0 rgba(43,34,53,.2); pointer-events: none; }
#lf .lf-gl i { display: block; font-weight: 600; font-size: 12px; opacity: .7; font-style: normal; }
#lf .lf-paper { position: relative; background: #fffdf6; border: 2px solid rgba(43,34,53,.25); border-radius: 6px; padding: 18px 22px 16px; font: 600 18px/1.65 Georgia, "Times New Roman", serif;
  background-image: repeating-linear-gradient(transparent, transparent 29px, rgba(63,111,181,.13) 30px); box-shadow: 3px 4px 0 rgba(43,34,53,.12); }
#lf .lf-paper p { margin: 0 0 6px; } #lf .lf-paper .lf-sig { text-align: right; font-style: italic; margin-top: 6px; }
#lf .lf-paper .lf-from { font: 700 13px "Segoe UI", sans-serif; opacity: .7; margin-bottom: 8px; padding-right: 92px; }
#lf .lf-paper canvas.lf-stamp { float: right; margin: -8px -10px 6px 12px; width: 66px; height: 82px; transform: rotate(4deg); }
#lf .lf-paper.post { transform: rotate(-1deg); }
#lf .lf-cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 16px; }
#lf .lf-cols .lf-paper { font-size: 15.5px; line-height: 1.55; max-height: 46vh; overflow: auto; }
#lf .lf-pts { list-style: none; margin: 10px 0 0; padding: 0; }
#lf .lf-pts li { display: flex; gap: 8px; align-items: flex-start; padding: 5px 8px; margin: 4px 0; border: 2px solid rgba(43,34,53,.18); border-radius: 10px; background: #fff; font-size: 14.5px; }
#lf .lf-pts li .ck { flex: none; width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid rgba(43,34,53,.35); display: grid; place-items: center; font-weight: 900; font-size: 13px; }
#lf .lf-pts li.ok .ck { background: #2f8f4e; border-color: #2f8f4e; color: #fff; } #lf .lf-pts li.no .ck { background: #c2412f; border-color: #c2412f; color: #fff; }
#lf .lf-pts li .st { display: block; margin-top: 3px; font-size: 13px; color: ${TEAL}; font-weight: 700; cursor: pointer; }
#lf textarea { width: 100%; min-height: 250px; resize: vertical; font: 600 17px/1.55 Georgia, serif; padding: 12px 14px; border: 2.5px solid ${INK}; border-radius: 12px; background: #fffdf6;
  background-image: repeating-linear-gradient(transparent, transparent 25px, rgba(63,111,181,.12) 26px); background-position: 0 11px; }
#lf[data-lang="zh"] textarea, #lf[data-lang="zh"] .lf-paper { font-family: Cambria, "Times New Roman", serif; }   /* (Georgia on Windows breaks pīnyīn's third tone: ǎ ǒ ǔ show as a˘) */
#lf .lf-count { font-size: 13px; font-weight: 800; opacity: .75; } #lf .lf-count.ok { color: #2f8f4e; opacity: 1; }
#lf .lf-grade { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; color: #fff; font: 900 18px Bahnschrift, sans-serif; border: 2.5px solid ${INK}; vertical-align: middle; }
#lf .g-S { background: #d9a72c; } #lf .g-A { background: #21a493; } #lf .g-B { background: #3f6fb5; } #lf .g-C { background: #8a4f7d; } #lf .g-D { background: #8a8a92; }
#lf .lf-env { display: grid; place-items: center; margin: 6px auto 10px; }
#lf .lf-env canvas { width: min(520px, 86vw); height: auto; }
#lf .lf-fix b.tk-red, #lf .lf-fix .tk-red { color: #c2412f; text-decoration: underline; }
#lf .lf-box { border: 2px solid rgba(43,34,53,.18); border-radius: 12px; background: #fff; padding: 9px 12px; margin: 8px 0; }
#lf .lf-note { font-size: 13.5px; opacity: .78; }
#lf .lf-album { display: grid; gap: 14px; }
#lf .lf-pal { border: 2px solid rgba(43,34,53,.18); border-radius: 14px; padding: 8px 12px; background: #fff; }
#lf .lf-pal h3 { margin: 0 0 6px; font: 800 17px Bahnschrift, sans-serif; display: flex; align-items: center; gap: 8px; }
#lf .lf-pal h3 canvas { width: 40px; height: 40px; border-radius: 50%; border: 2px solid ${INK}; }
#lf .lf-stamps { display: flex; flex-wrap: wrap; gap: 8px; }
#lf .lf-stamps .sl { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 84px; font-size: 11px; text-align: center; }
#lf .lf-stamps canvas { width: 60px; height: 74px; } #lf .lf-stamps .sl.no canvas { opacity: .25; filter: grayscale(1); }
#lf .lf-stamps .sl button { font-size: 10.5px; padding: 0 5px; border-width: 2px; border-radius: 7px; box-shadow: none; }
#lf .lf-who { display: flex; align-items: center; gap: 12px; }
#lf .lf-who canvas { width: 92px; height: 92px; border-radius: 50%; border: 3px solid ${INK}; background: #fff; flex: none; }
#lf .lf-who .nm { font: 800 16px Bahnschrift, sans-serif; } #lf .lf-who .rl { font-size: 13px; opacity: .7; }
#lf .lf-bub { position: relative; background: #fff; border: 2.5px solid ${INK}; border-radius: 16px; padding: 8px 12px; font-size: 17px; font-weight: 700; line-height: 1.5; box-shadow: 0 3px 0 rgba(43,34,53,.15); margin: 6px 0; }
#lf .lf-bub .say { margin-left: 6px; } #lf .lf-bub .hid { filter: blur(6px); user-select: none; }
#lf .lf-sh { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; align-items: start; }
#lf .lf-board { border: 3px solid #6b4a2e; border-radius: 12px; background: #fff7e6; padding: 8px 12px; font-size: 15px; }
#lf .lf-board h4 { margin: 0 0 6px; font: 800 15px Bahnschrift, sans-serif; color: #6b4a2e; }
#lf .lf-board table { border-collapse: collapse; width: 100%; } #lf .lf-board td, #lf .lf-board th { padding: 3px 6px; border-bottom: 1px dashed rgba(107,74,46,.35); text-align: left; }
#lf .lf-board .big { font: 800 22px Bahnschrift, sans-serif; }
#lf .lf-opts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
#lf .lf-opts button { font-size: 15px; } #lf .lf-opts button.right { background: #2f8f4e; color: #fff; } #lf .lf-opts button.wrong { background: #c2412f; color: #fff; }
#lf .lf-say { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
#lf .lf-say input { flex: 1; min-width: 0; font: 700 17px "Segoe UI", sans-serif; padding: 8px 12px; border: 2.5px solid ${INK}; border-radius: 12px; background: #fff; }
#lf .lf-goal { font-size: 14px; font-weight: 700; color: ${TEAL}; margin: 4px 0; }
#lf .lf-rung { font-size: 14px; margin: 4px 0; } #lf .lf-rung b { color: #6b4a2e; }
#lf .lf-fb { margin-top: 8px; } #lf .lf-fb .tip { font-size: 13.5px; opacity: .85; }
#lf .lf-prog { display: flex; gap: 5px; } #lf .lf-prog i { width: 12px; height: 12px; border-radius: 50%; border: 2px solid ${TEAL}; } #lf .lf-prog i.f { background: ${TEAL}; } #lf .lf-prog i.now { box-shadow: 0 0 0 3px #ffd166; }
#lf .lf-env-big { text-align: center; } #lf .lf-env-big .msg { font: 800 19px Bahnschrift, sans-serif; margin: 4px 0; }
#lf .lf-gift { margin: 8px auto; padding: 8px 12px; border: 2px dashed #d9a72c; border-radius: 12px; background: #fff8e1; font-weight: 700; max-width: 560px; }
#lf .lf-dv { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; height: min(760px, calc(100vh - 16px)); }
#lf .lf-stage { display: grid; grid-template-columns: 1fr 1.1fr 1fr; gap: 8px; align-items: end; padding: 8px 14px 4px; background: linear-gradient(#e7f2ef, #fffaf0); border-bottom: 2px dashed rgba(43,34,53,.2); }
#lf .lf-stage .pp { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 13px; text-align: center; }
#lf .lf-stage .pp canvas { width: 76px; height: 76px; border-radius: 50%; border: 3px solid ${INK}; background: #fff; }
#lf .lf-stage .pp.mayor canvas { width: 92px; height: 92px; border-color: #d9a72c; }
#lf .lf-stage .pp.talking canvas { box-shadow: 0 0 0 4px #ffd166; }
#lf .lf-stage .pp b { font: 800 14px Bahnschrift, sans-serif; } #lf .lf-stage .pp .pos { font-size: 12px; opacity: .75; max-width: 220px; }
#lf .lf-meter { grid-column: 1 / -1; height: 14px; border: 2px solid ${INK}; border-radius: 8px; overflow: hidden; display: flex; margin-top: 4px; }
#lf .lf-meter i { display: block; height: 100%; transition: width .6s; } #lf .lf-meter .a { background: #3f6fb5; } #lf .lf-meter .b { background: #e6a92e; }
#lf .lf-log { overflow: auto; padding: 8px 14px; display: flex; flex-direction: column; gap: 6px; }
#lf .lf-m { max-width: 82%; padding: 7px 11px; border-radius: 14px; border: 2px solid rgba(43,34,53,.25); background: #fff; font-size: 16px; font-weight: 600; line-height: 1.45; }
#lf .lf-m .who { display: block; font: 800 12px Bahnschrift, sans-serif; opacity: .7; }
#lf .lf-m.me { align-self: flex-end; background: #e7f2ef; border-color: ${TEAL}; }
#lf .lf-m.sys { align-self: center; max-width: 94%; background: transparent; border: none; font-size: 13.5px; opacity: .8; text-align: center; }
#lf .lf-m.mimo { align-self: flex-end; background: #fff8e1; border-color: #d9a72c; font-size: 14.5px; }
#lf .lf-m.mimo ul { margin: 4px 0 0 16px; padding: 0; font-size: 13px; }
#lf .lf-m .gr { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; color: #fff; font: 900 13px Bahnschrift, sans-serif; margin-left: 6px; border: 2px solid ${INK}; }
#lf .lf-m.new { border-style: dashed; background: #fffdf6; }
#lf .lf-vote { text-align: center; padding: 8px; } #lf .lf-vote .tally { font: 900 30px Bahnschrift, sans-serif; } #lf .lf-vote .tally .a { color: #3f6fb5; } #lf .lf-vote .tally .b { color: #c98a1c; }
#lf .lf-vote .hands { font-size: 22px; letter-spacing: 2px; margin: 4px 0; min-height: 30px; }
@media (max-width: 760px) { #lf .lf-cols, #lf .lf-sh { grid-template-columns: 1fr; } #lf .lf-stage { grid-template-columns: 1fr 1fr 1fr; } #lf textarea { min-height: 170px; } }
`;
  let root = null, openN = 0, keyFn = null, gl = null;
  function dom() {
    if (root) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'lf'; root.className = 'hidden'; document.body.appendChild(root);
    addEventListener('keydown', e => { if (!root || root.classList.contains('hidden') || !keyFn) return; if (keyFn(e) !== false) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
  const game = () => LIFE.game;
  function open() {
    dom();
    root.innerHTML = '<div class="lf-shade"></div>'; root.classList.remove('hidden');
    try { root.dataset.lang = LIFE.L(); } catch (e) { /* */ }
    if (!openN) { document.body.classList.add('lf-open'); if (typeof Input !== 'undefined') Input.typing = true; const g = game(); if (g && g.state) { g.state.teaching = true; g.prompt = null; } }
    openN = 1;
    return root;
  }
  function close() {
    if (!root) return;
    keyFn = null; root.classList.add('hidden'); root.innerHTML = ''; hideGloss();
    if (openN) { openN = 0; document.body.classList.remove('lf-open'); if (typeof Input !== 'undefined') Input.typing = false; const g = game(); if (g && g.state) g.state.teaching = false; }
    try { if (typeof SPEECH !== 'undefined') SPEECH.stop(); } catch (e) { /* */ }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  const keys = fn => { keyFn = fn; };
  // a card: { title, sub, narrow } → { el, head, body, foot, x }
  function frame(o = {}) {
    const r = open();
    const card = document.createElement('div'); card.className = 'lf-card' + (o.narrow ? ' narrow' : '') + (o.cls ? ' ' + o.cls : '');
    card.innerHTML = `<div class="lf-head"><b>${E(o.title || '')}</b><span class="sub">${E(o.sub || '')}</span><span class="sp"></span><button class="x" title="Close (Esc)">✕</button></div><div class="lf-body"></div><div class="lf-foot"><span class="nt"></span><span class="sp"></span></div>`;
    r.appendChild(card);
    return { el: card, head: card.querySelector('.lf-head'), body: card.querySelector('.lf-body'), foot: card.querySelector('.lf-foot'), note: card.querySelector('.nt'), x: card.querySelector('.x') };
  }
  const btn = (label, cls, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls || ''; b.textContent = label; if (fn) b.onclick = fn; return b; };

  // ------------------------------------------------------------ lines: in the language, words you can tap, EN on request
  function tl(s) { return cj() ? CJK.html(String(s || ''), { lang: L() }) : E(s); }
  function glossHTML(s) {
    const src = String(s || '');
    if (cj()) {
      const ch = CJK.mode(L()) === 'chars';
      // (tokens are space-separated, but a zh reading has spaces inside its brackets: «[远方|yuǎn fāng]» stays one token)
      return (src.match(/[^\s[]*\[[^\]]*\][^\s[]*|\S+/g) || []).map(c => (/[\p{L}\p{N}]/u.test(c) && !/^\{/.test(c) ? `<span class="lf-w" data-w="${E(CJK.chars(c, { lang: L() }))}">${CJK.html(c, { lang: L() })}</span>` : CJK.html(c, { lang: L() }))).join(ch ? '' : ' ');
    }
    let toks = []; try { toks = DICT.tokens(src) || []; } catch (e) { toks = []; }
    if (!toks.length) return E(src);
    let out = '', at = 0;
    for (const t of toks) { out += E(src.slice(at, t.s)); out += t.word !== false && /\p{L}/u.test(t.t) ? `<span class="lf-w" data-w="${E(t.t)}">${E(src.slice(t.s, t.e))}</span>` : E(src.slice(t.s, t.e)); at = t.e; }
    return out + E(src.slice(at));
  }
  let enN = 0;
  function lineHTML(ln, o = {}) {
    if (!ln) return '';
    const id = 'lfen' + (++enN);
    return `<span class="tl">${ln.plain ? E(ln.t) : o.gloss ? glossHTML(ln.t) : tl(ln.t)}</span>${ln.en && o.en !== false ? ` <button class="sm" data-en="${id}" type="button" title="The English">EN</button><span class="en hide" id="${id}">${E(ln.en)}</span>` : ''}`;
  }
  function wire(el) {
    el.querySelectorAll('[data-en]').forEach(b => { b.onclick = e => { e.stopPropagation(); const t = el.querySelector('#' + b.dataset.en); if (t) t.classList.toggle('hide'); }; });
    el.querySelectorAll('.lf-w[data-w]').forEach(w => { w.onclick = e => { e.stopPropagation(); showGloss(w); }; });
  }
  function showGloss(w) {
    hideGloss();
    let g = null; try { g = DICT.gloss(w.dataset.w); } catch (e) { g = null; }
    gl = document.createElement('div'); gl.className = 'lf-gl';
    gl.innerHTML = g ? (g.form ? E(g.form) : `${E(P(g.lemma))}<i>${E(g.en || '')}</i>`) : `${E(w.dataset.w)}<i>(not in the dictionary)</i>`;
    root.appendChild(gl);
    const r = w.getBoundingClientRect(); gl.style.left = Math.max(8, Math.min(innerWidth - 310, r.left)) + 'px'; gl.style.top = Math.max(8, r.top - gl.offsetHeight - 8) + 'px';
    if (g && g.id) { try { DICT.met(g.id, 'gloss'); } catch (e) { /* */ } }
    setTimeout(hideGloss, 3200);
  }
  function hideGloss() { if (gl && gl.parentNode) gl.parentNode.removeChild(gl); gl = null; }
  function speak(lines, who, o = {}) {
    try {
      if (typeof SPEECH === 'undefined') return null;
      if (o.voice) SPEECH.speaker(who, o.voice);
      return SPEECH.play(lines.map(l => ({ text: l.t, who })), { lang: L(), gap: 0.35 });
    } catch (e) { return null; }
  }

  // ------------------------------------------------------------ stamps (the album, the letters): perforated, a color, an icon, a value
  function drawStamp(cv, s, o = {}) {
    if (!cv || !cv.getContext) return;
    const c = cv.getContext('2d'), W = cv.width, Hh = cv.height; c.clearRect(0, 0, W, Hh);
    const col = (s && s.color) || '#3f6fb5';
    c.fillStyle = '#fffdf6'; c.fillRect(0, 0, W, Hh);
    c.globalCompositeOperation = 'destination-out'; const r = W / 26;
    for (let x = r * 1.4; x < W; x += r * 2.6) { c.beginPath(); c.arc(x, 0, r, 0, Math.PI * 2); c.arc(x, Hh, r, 0, Math.PI * 2); c.fill(); }
    for (let y = r * 1.4; y < Hh; y += r * 2.6) { c.beginPath(); c.arc(0, y, r, 0, Math.PI * 2); c.arc(W, y, r, 0, Math.PI * 2); c.fill(); }
    c.globalCompositeOperation = 'source-over';
    const m = W * 0.1; c.fillStyle = col; c.fillRect(m, m, W - 2 * m, Hh - 2 * m - W * 0.2);
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.arc(W / 2, Hh * 0.38, W * 0.3, 0, Math.PI * 2); c.fill();
    if (s && s.icon && typeof ICONS !== 'undefined') { const ic = document.createElement('canvas'); ic.width = ic.height = 128; try { ICONS.draw(ic, s.icon); c.drawImage(ic, W * 0.18, Hh * 0.12, W * 0.64, W * 0.64); } catch (e) { /* */ } }
    c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
    const nm = P(Array.isArray(s && s.name) ? s.name[0] : (s && s.name) || ''); let px = Math.round(W * 0.13); c.font = `800 ${px}px Bahnschrift, "Segoe UI", sans-serif`; while (px > 6 && c.measureText(nm).width > W * 0.86) { px--; c.font = `800 ${px}px Bahnschrift, "Segoe UI", sans-serif`; }
    c.fillText(nm, W / 2, Hh - W * 0.16);
    c.fillStyle = '#fffdf6'; c.font = `900 ${Math.round(W * 0.15)}px Bahnschrift, sans-serif`; c.textAlign = 'right'; c.fillText(String((s && s.value) || 1), W - m * 1.6, m * 2.6);
    if (o.cancel) { c.strokeStyle = 'rgba(43,34,53,.55)'; c.lineWidth = W * 0.025; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-W * 0.1, Hh * (0.2 + i * 0.12)); c.bezierCurveTo(W * 0.3, Hh * (0.12 + i * 0.12), W * 0.6, Hh * (0.3 + i * 0.12), W * 1.1, Hh * (0.2 + i * 0.12)); c.stroke(); } }
  }
  function face(cv, look, mood) { try { TALKUI.face(cv, look || null, mood || null); } catch (e) { /* */ } }

  // ------------------------------------------------------------ a pen pal's letter
  // lt: { key, pal: { id, name, where, look, voice }, band, body: [lines], sign: line, stamp }; o: { canWrite, answered, title }
  function letter(lt, o = {}) {
    return new Promise(resolve => {
      const f = frame({ title: o.title || `A letter from ${P(lt.pal.name)}`, sub: `${P(lt.pal.where && lt.pal.where.t || '')} · ${LIFE.BANDS[lt.band] || ''}`, narrow: true });
      const body = lt.body || [];
      f.body.innerHTML = `<div class="lf-paper"><canvas class="lf-stamp" width="132" height="164"></canvas><div class="lf-from">${E(o.from || '')}</div>`
        + body.map(l => `<p>${lineHTML(l, { gloss: true })}</p>`).join('') + (lt.sign ? `<div class="lf-sig">${lineHTML(lt.sign, { gloss: true })}</div>` : '') + '</div>'
        + `<p class="lf-note" style="margin-top:8px">Tap any word for its meaning. EN shows a line in English.</p>`;
      drawStamp(f.body.querySelector('canvas.lf-stamp'), lt.stamp, { cancel: true }); wire(f.body);
      const done = v => { keys(null); close(); resolve(v); };
      let ctl = null;
      const hear = btn('🔊 Hear it', '', () => { if (ctl && ctl.stop) { ctl.stop(); ctl = null; return; } ctl = speak(body.concat(lt.sign ? [lt.sign] : []), 'pp.' + lt.pal.id, { voice: lt.pal.voice }); });
      f.foot.appendChild(hear);
      if (o.canWrite) f.foot.appendChild(btn('✍️ Write back now', 'main', () => done('write')));
      f.foot.appendChild(btn(o.canWrite ? 'Later' : 'Fold the letter', o.canWrite ? '' : 'main', () => done('close')));
      if (o.answered) f.note.textContent = 'You’ve answered this one.';
      f.x.onclick = () => done('close');
      snd('page');
      keys(e => { if (e.code === 'Escape') done('close'); else if (e.code === 'Enter' && o.canWrite && document.activeElement.tagName !== 'BUTTON') done('write'); else return false; });
      if (T.auto) setTimeout(() => done(o.canWrite ? 'write' : 'close'), 10);
    });
  }

  // ------------------------------------------------------------ the writing desk
  // o: { points: [{ t: line, starter: line }], min, max, model: line, check(text) → [bool], count(text) → n, to: 'Chuy', band }
  function desk(lt, o = {}) {
    return new Promise(resolve => {
      const f = frame({ title: `Write back to ${P(lt.pal.name)}`, sub: `${LIFE.BANDS[lt.band] || ''} · ${o.min}–${o.max} words` });
      f.body.innerHTML = `<div class="lf-cols"><div><div class="lf-paper">${(lt.body || []).map(l => `<p>${lineHTML(l, { gloss: true })}</p>`).join('')}${lt.sign ? `<div class="lf-sig">${tl(lt.sign.t)}</div>` : ''}</div>`
        + `<ul class="lf-pts">${(o.points || []).map((p, k) => `<li data-k="${k}"><span class="ck">${k + 1}</span><span>${lineHTML(p.t)}${p.starter ? `<span class="st" data-st="${k}">✎ A way to start: ${tl(p.starter.t)}</span>` : ''}</span></li>`).join('')}</ul></div>`
        + `<div><textarea spellcheck="false" placeholder="Write in ${E(LANGNAME[L()] || 'the language')}…"></textarea><div style="display:flex;align-items:center;gap:8px;margin-top:4px"><span class="lf-count">0 words</span><span class="sp" style="flex:1"></span></div>`
        + `<div class="lf-box hidden lf-model"><b>One way to write it</b> <span class="lf-note">(copying it costs half the marks)</span><div>${o.model ? lineHTML(o.model) : ''}</div></div></div></div>`;
      wire(f.body);
      const ta = f.body.querySelector('textarea'), cnt = f.body.querySelector('.lf-count'), lis = [...f.body.querySelectorAll('.lf-pts li')];
      if (cj() && CJK.mode(L()) === 'chars' && CJK.attachIME) { try { CJK.attachIME(ta); } catch (e) { /* */ } }
      let modelShown = false, tmr = null;
      const count = () => (o.count ? o.count(ta.value) : String(ta.value).split(/\s+/).filter(Boolean).length);
      const upd = () => {
        const w = count(); cnt.textContent = `${w} word${w === 1 ? '' : 's'} (${o.min}–${o.max})`; cnt.classList.toggle('ok', w >= o.min && w <= o.max * 1.5);
        clearTimeout(tmr); tmr = setTimeout(() => { let ok = []; try { ok = o.check ? o.check(ta.value) : []; } catch (e) { ok = []; } lis.forEach((li, k) => { li.classList.toggle('ok', !!ok[k]); li.querySelector('.ck').textContent = ok[k] ? '✓' : String(k + 1); }); }, 450);
      };
      ta.oninput = upd;
      f.body.querySelectorAll('[data-st]').forEach(s => { s.onclick = () => { const p = o.points[+s.dataset.st]; const txt = cj() ? (CJK.mode(L()) === 'chars' ? CJK.chars(p.starter.t, { lang: L() }) : CJK.plain(p.starter.t, { lang: L() })) : P(p.starter.t); const ins = String(txt).replace(/_{2,}/g, '').trim(); ta.value = (ta.value.trim() ? ta.value.replace(/\s*$/, ' ') : '') + ins + (cj() ? '' : ' '); ta.focus(); upd(); }; });
      const mb = btn('Show me one way', '', () => { modelShown = true; f.body.querySelector('.lf-model').classList.remove('hidden'); mb.disabled = true; f.note.textContent = 'With the model shown, this letter counts half.'; });
      if (o.model) f.foot.appendChild(mb);
      let sure = false;
      const post = btn('📮 Post it', 'main', () => {
        const w = count();
        if (w < Math.ceil(o.min * 0.6) && !sure) { sure = true; f.note.innerHTML = `<b>${w} of at least ${o.min} words.</b> Press again to post it anyway.`; return; }
        done({ text: ta.value.trim(), model: modelShown });
      });
      const later = btn('Not now', '', () => done(null));
      f.foot.append(later, post);
      const done = v => { clearTimeout(tmr); keys(null); close(); resolve(v); };
      f.x.onclick = () => done(null);
      keys(e => { if (e.code === 'Escape') { done(null); return true; } return false; });
      setTimeout(() => ta.focus(), 60);
      upd();
      if (T.auto) setTimeout(() => { ta.value = T.auto(lt) || ''; upd(); done({ text: ta.value, model: false }); }, 10);
    });
  }

  // ------------------------------------------------------------ the envelope you post, with its grade stamp
  function envelope(cv, res, o) {
    const c = cv.getContext('2d'), W = cv.width, Hh = cv.height; c.clearRect(0, 0, W, Hh);
    c.fillStyle = '#f7ecd2'; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.roundRect ? c.roundRect(20, 20, W - 40, Hh - 40, 18) : c.rect(20, 20, W - 40, Hh - 40); c.fill(); c.stroke();
    c.lineWidth = 3; c.strokeStyle = 'rgba(43,34,53,.35)'; c.beginPath(); c.moveTo(20, 20); c.lineTo(W / 2, Hh * 0.55); c.lineTo(W - 20, 20); c.stroke();
    c.fillStyle = INK; c.textAlign = 'left';
    const fitT = (t, px, wt, y) => { const s = P(t || ''); let p = px; c.font = `${wt} ${p}px Georgia, serif`; while (p > 10 && c.measureText(s).width > W * 0.56) { p--; c.font = `${wt} ${p}px Georgia, serif`; } c.fillText(s, W * 0.36, y); };
    fitT(o.to, 30, 700, Hh * 0.7); fitT(o.where, 22, 600, Hh * 0.8);
    const st = document.createElement('canvas'); st.width = 132; st.height = 164; drawStamp(st, o.stamp || { color: '#d6453a', icon: 'letter', name: '' }); c.drawImage(st, W - 140, 36, 92, 114);
    // the grade, stamped in red ink
    c.save(); c.translate(W * 0.2, Hh * 0.68); c.rotate(-0.25); c.strokeStyle = '#c2412f'; c.fillStyle = '#c2412f'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 56, 0, Math.PI * 2); c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 46, 0, Math.PI * 2); c.stroke();
    c.font = '900 62px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(res.grade || '?', 0, 4); c.restore();
  }
  // res: { grade, score, points, zero }; o: { to, where, stamp, said: line (the clerk), gift } → 'review' | 'close'
  function posted(res, o = {}) {
    return new Promise(resolve => {
      const f = frame({ title: 'Posted!', sub: `${Math.round(res.score * 2) / 2} / 12.5`, narrow: true });
      f.body.innerHTML = `<div class="lf-env-big"><div class="lf-env"><canvas width="640" height="400"></canvas></div><div class="msg">${E(o.msg || 'Your letter is on its way.')}</div>`
        + (o.said ? `<div class="lf-bub" style="max-width:560px;margin:6px auto">${lineHTML(o.said)}</div>` : '') + (o.extra ? `<div class="lf-gift">${o.extra}</div>` : '') + '</div>';
      envelope(f.body.querySelector('canvas'), res, o); wire(f.body);
      snd(res.grade === 'S' || res.grade === 'A' ? 'learned' : 'page');
      const done = v => { keys(null); close(); resolve(v); };
      f.foot.append(btn('See the fixes', '', () => done('review')), btn('Done', 'main', () => done('close')));
      f.x.onclick = () => done('close');
      keys(e => { if (e.code === 'Escape' || e.code === 'Enter') { done('close'); return true; } return false; });
      if (T.auto) setTimeout(() => done(T.hold ? 'hold' : 'close'), 10);
    });
  }
  // the corrected copy, like the exam's review
  const ZERO = { empty: 'nothing written', idk: '“I don’t know” isn’t a letter', short: 'too short to mark', notlang: 'not enough of it is in the language' };
  function review(en, lt, o = {}) {
    return new Promise(resolve => {
      const f = frame({ title: `Your letter to ${P(lt.pal.name)}`, sub: 'with the fixes' });
      const pts = lt.points || [];
      f.body.innerHTML = `<div class="lf-box"><b>What ${E(P(lt.pal.name))} asked</b><ul class="lf-pts">${pts.map((p, k) => `<li class="${(en.points || [])[k] ? 'ok' : 'no'}"><span class="ck">${(en.points || [])[k] ? '✓' : '✗'}</span><span>${lineHTML(LIFE.line(p.t))}</span></li>`).join('')}</ul></div>`
        + `<p class="lf-note">Points ${fmt(6 * (en.points || []).filter(Boolean).length / Math.max(1, pts.length))}/6 · accuracy ${fmt(en.acc || 0)}/4 · variety ${fmt(en.range || 0)}/1.5 · length ${fmt(en.len || 0)}/1 (${en.words || 0} words)${en.model ? ' · the model was shown: half marks' : ''}${en.zero ? ` · <b>${E(ZERO[en.zero] || '')}</b>` : ''} · <span class="lf-grade g-${E(en.grade || 'D')}" title="${E(GRADE_EN[en.grade] || '')}">${E(en.grade || '?')}</span></p>`
        + `<div class="lf-box"><b>You wrote:</b><div>${tl(en.text || '—')}</div></div>`
        + (en.fixed && en.fixed !== en.text ? `<div class="lf-box lf-fix"><b>Said right:</b><div>${fixHTML(en.text, en.fixed)}</div></div>` : (en.text && !en.zero ? '<p class="lf-note">No mistakes found. Well written!</p>' : ''))
        + ((en.tips || []).length ? `<div class="lf-box">${en.tips.slice(0, 5).map(t => `<p class="lf-note" style="margin:2px 0">• ${E(t)}</p>`).join('')}</div>` : '')
        + (lt.model ? `<div class="lf-box"><b>One way to write it:</b><div>${lineHTML(LIFE.line(lt.model))}</div></div>` : '');
      wire(f.body);
      const done = () => { keys(null); close(); resolve(); };
      f.foot.appendChild(btn('Done', 'main', done)); f.x.onclick = done;
      keys(e => { if (e.code === 'Escape' || e.code === 'Enter') { done(); return true; } return false; });
      if (T.auto && !T.hold) setTimeout(done, 10);
    });
  }
  const fmt = v => (Math.round(v * 2) / 2).toString().replace(/\.0$/, '');
  function fixHTML(a, b) { try { return TALK.diffHTML(a, b).html; } catch (e) { return tl(b); } }

  // ------------------------------------------------------------ the album: every pen pal's stamps, your letters
  // data: { pals: [{ id, name, where, look, letters: [{ stamp, got, read, answered, key }] }], count, all }; o.onPick(kind, palId, i)
  function album(data, o = {}) {
    return new Promise(resolve => {
      const f = frame({ title: 'Your stamp album', sub: `${data.count} of ${data.all} stamps` });
      f.body.innerHTML = `<div class="lf-album">${data.pals.map(p => `<div class="lf-pal"><h3><canvas width="80" height="80" data-face="${E(p.id)}"></canvas>${E(P(p.name))} <span class="lf-note">${E(P(p.where && p.where.t || ''))}</span></h3><div class="lf-stamps">`
        + p.letters.map((x, i) => `<div class="sl ${x.got ? '' : 'no'}"><canvas width="120" height="148" data-st="${E(p.id)}:${i}"></canvas><span>${x.got ? E(P(Array.isArray(x.stamp.name) ? x.stamp.name[0] : x.stamp.name || '')) : '?'}</span>${x.got ? `<span><button data-read="${E(p.id)}:${i}">read</button>${x.answered ? ` <button data-rev="${E(p.id)}:${i}">yours</button>` : ''}</span>` : ''}</div>`).join('')
        + '</div></div>').join('') || '<p class="lf-note">No letters yet.</p>'}</div>`;
      data.pals.forEach(p => { const cv = f.body.querySelector(`canvas[data-face="${p.id}"]`); if (cv) face(cv, p.look); p.letters.forEach((x, i) => { const sc = f.body.querySelector(`canvas[data-st="${p.id}:${i}"]`); if (sc) drawStamp(sc, x.stamp, { cancel: x.got }); }); });
      const done = v => { keys(null); close(); resolve(v || null); };
      f.body.querySelectorAll('[data-read]').forEach(b => { b.onclick = () => { const [id, i] = b.dataset.read.split(':'); done({ kind: 'read', pal: id, i: +i }); }; });
      f.body.querySelectorAll('[data-rev]').forEach(b => { b.onclick = () => { const [id, i] = b.dataset.rev.split(':'); done({ kind: 'review', pal: id, i: +i }); }; });
      f.foot.appendChild(btn('Close', 'main', () => done(null))); f.x.onclick = () => done(null);
      keys(e => { if (e.code === 'Escape') { done(null); return true; } return false; });
      if (T.auto) setTimeout(() => done(null), 10);
    });
  }

  // ------------------------------------------------------------ a result card: { title, sub, who: { name, look, role }, lines: [line], html, buttons: [{ label, value, main }] }
  function card(def = {}) {
    return new Promise(resolve => {
      const f = frame({ title: def.title || '', sub: def.sub || '', narrow: true });
      f.body.innerHTML = (def.who ? `<div class="lf-who"><canvas width="184" height="184"></canvas><div><div class="nm">${E(P(def.who.name || ''))}</div><div class="rl">${E(def.who.role || '')}</div></div></div>` : '')
        + (def.lines || []).map(l => `<div class="lf-bub">${lineHTML(l)}</div>`).join('') + (def.html || '');
      if (def.who) face(f.body.querySelector('.lf-who canvas'), def.who.look, def.mood);
      wire(f.body);
      if (def.say && def.lines && def.lines.length) speak(def.lines, def.say.who || 'life.card', { voice: def.say.voice });
      const done = v => { keys(null); close(); resolve(v); };
      const bs = def.buttons && def.buttons.length ? def.buttons : [{ label: 'OK', value: 'ok', main: true }];
      for (const b of bs) f.foot.appendChild(btn(b.label, b.main ? 'main' : '', () => done(b.value)));
      f.x.onclick = () => done(null);
      keys(e => { if (e.code === 'Escape') { done(null); return true; } if (e.code === 'Enter') { done(bs.find(b => b.main) ? bs.find(b => b.main).value : bs[0].value); return true; } return false; });
      if (def.sound) snd(def.sound);
      if (T.auto && !T.hold) setTimeout(() => done((bs.find(b => b.main) || bs[0]).value), 10);
    });
  }

  // ------------------------------------------------------------ a shift: customers one by one, a board, your answer
  // def: { title, sub, band, boss: { name, look }, intro: line, tasks: [task], pay(score) → coins }
  // task: { kind: 'say' | 'pick', who: { name, look, voice }, lines: [line], listen, board: html, goal, want, judge(text) → r,
  //         starter: line, model: line, options: [{ html, value }], answer, after: line, wrong: line, skill }
  // → { grades: [], quit, results: [{ grade, score }] }
  function shift(def) {
    return new Promise(resolve => {
      const f = frame({ title: def.title || 'A shift', sub: def.sub || '' });
      const res = { grades: [], results: [], quit: false };
      let k = 0, finished = false;
      const prog = document.createElement('span'); prog.className = 'lf-prog'; f.head.insertBefore(prog, f.head.querySelector('.sp'));
      const paint = () => { prog.innerHTML = def.tasks.map((_, i) => `<i class="${i < k ? 'f' : ''} ${i === k ? 'now' : ''}"></i>`).join(''); };
      const end = q => { if (finished) return; finished = true; res.quit = !!q; keys(null); close(); resolve(res); };
      f.x.onclick = () => end(true);
      const next = () => { k++; if (k >= def.tasks.length) return end(false); run(); };
      function run() {
        paint();
        const t = def.tasks[k], who = t.who || {}, band = def.band || 1;
        f.body.innerHTML = `<div class="lf-sh"><div><div class="lf-who"><canvas width="184" height="184"></canvas><div><div class="nm">${E(P(who.name || ''))}</div><div class="rl">${E(who.role || '')}</div></div></div>`
          + `<div class="lf-lines">${(t.lines || []).map(l => `<div class="lf-bub"><span class="${t.listen ? 'hid' : ''}">${lineHTML(l, { en: !t.listen && !t.noEn })}</span>${t.noSpeak ? '' : '<button class="sm say" type="button">🔊</button>'}</div>`).join('')}</div>`
          + (t.listen ? '<button class="sm reveal" type="button">Show the words</button>' : '') + `<div class="lf-goal">✎ ${E(t.goal || '')}</div><div class="lf-rung"></div>`
          + (t.kind === 'pick' ? `<div class="lf-pick">${t.prompt || ''}</div><div class="lf-opts">${(t.options || []).map((o, i) => `<button type="button" data-o="${i}">${o.html}</button>`).join('')}</div>`
            : t.kind === 'write' ? `<ul class="lf-pts">${(t.points || []).map((p, i) => `<li data-k="${i}"><span class="ck">${i + 1}</span><span>${p.t ? lineHTML(p.t) : ''}${p.starter ? `<span class="st" data-st="${i}">✎ A way to start: ${tl(p.starter.t)}</span>` : ''}</span></li>`).join('')}</ul>`
              + `<textarea spellcheck="false" style="min-height:150px" placeholder="Write in ${E(LANGNAME[L()] || 'the language')}…"></textarea><div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap"><span class="lf-count">0 words</span><span style="flex:1"></span><button class="sm model" type="button">Show me one way</button><button class="main go" type="button">Hand it in</button></div>`
              + `<div class="lf-box hidden lf-model"><b>One way to write it</b> <span class="lf-note">(copying it costs half the marks)</span><div>${t.model ? lineHTML(t.model) : ''}</div></div>`
            : `<div class="lf-say"><input autocomplete="off" spellcheck="false" placeholder="Say it in ${E(LANGNAME[L()] || 'the language')}…"><button class="main go" type="button">Say it</button><button class="help" type="button" title="Help (Tab)">?</button></div>`)
          + `<div class="lf-fb"></div></div><div>${t.board ? `<div class="lf-board">${t.board}</div>` : ''}</div></div>`;
        face(f.body.querySelector('.lf-who canvas'), who.look);
        wire(f.body);
        const bubs = [...f.body.querySelectorAll('.lf-bub')], fb = f.body.querySelector('.lf-fb'), rung = f.body.querySelector('.lf-rung');
        let peeked = false, played = false;
        const sayAll = () => { played = true; const c = speak(t.lines || [], 'life.c' + k, { voice: who.voice }); if (c && c.done && t.listen) c.done.then(r => { if (r && !r.ok && !r.stopped) reveal(); }); };
        const reveal = () => { peeked = true; f.body.querySelectorAll('.hid').forEach(x => x.classList.remove('hid')); const rv = f.body.querySelector('.reveal'); if (rv) rv.remove(); };
        bubs.forEach(b => { const s = b.querySelector('.say'); if (s) s.onclick = sayAll; });
        const rv = f.body.querySelector('.reveal'); if (rv) rv.onclick = reveal;
        if (t.listen && typeof SPEECH !== 'undefined') { SPEECH.ready(800).then(() => { if (!SPEECH.has(L())) reveal(); }); }
        if (!T.fast && !t.noSpeak) setTimeout(sayAll, 250);
        let tries = 0, help = 0;
        const finish = (grade, score, extra) => {
          res.grades.push(grade); res.results.push({ grade, score, kind: t.kind, peeked });
          try {
            if (t.kind === 'write') { /* (its grader logs 'write') */ }
            else if (t.kind === 'pick' || t.skill === 'read') DICT.log(t.listen && !peeked ? 'listen' : 'read', band, score);
            else { DICT.log('talk', band, grade); if (t.listen && !peeked && played) DICT.log('listen', band, score); }
          } catch (e) { /* */ }
          const after = grade === 'D' ? null : t.after;
          fb.innerHTML = (extra || '') + (after ? `<div class="lf-bub">${lineHTML(after)}</div>` : '');
          wire(fb);
          if (after) speak([after], 'life.c' + k, { voice: who.voice });
          const nb = btn(k + 1 < def.tasks.length ? 'Next ▸' : 'Finish ▸', 'main', next); fb.appendChild(nb); setTimeout(() => nb.focus(), 30);
          keys(e => { if (e.code === 'Escape') { end(true); return true; } if (e.code === 'Enter') { next(); return true; } return false; });
          if (T.auto) setTimeout(next, 10);
        };
        if (t.kind === 'pick') {
          const bs = [...f.body.querySelectorAll('[data-o]')];
          bs.forEach(b => { b.onclick = () => {
            const o = t.options[+b.dataset.o]; if (!o) return;
            if (o.value === t.answer) { b.classList.add('right'); bs.forEach(x => { x.disabled = true; }); snd('chest'); finish(tries ? 'B' : 'S', tries ? 0.5 : 1, `<div class="lf-note">✓ ${tries ? 'Right, the second time.' : 'Right!'}</div>`); return; }
            b.classList.add('wrong'); b.disabled = true; tries++; snd('wrong');
            if (tries >= 2) { const rt = bs.find(x => t.options[+x.dataset.o].value === t.answer); if (rt) rt.classList.add('right'); bs.forEach(x => { x.disabled = true; }); finish('D', 0, `<div class="lf-note">${t.why ? E(t.why) : 'The right one is marked green.'}</div>`); return; }
            fb.innerHTML = `<div class="lf-note">Not that one. ${t.hint ? E(t.hint) : 'Read it again.'}</div>`;
          }; });
          keys(e => { if (e.code === 'Escape') { end(true); return true; } return false; });
          if (T.auto) setTimeout(() => { const i = (t.options || []).findIndex(o => o.value === t.answer); const b = bs[T.auto === 'wrong' ? (i + 1) % bs.length : i]; if (b) b.onclick(); if (T.auto === 'wrong') { const b2 = bs[(i + 2) % bs.length]; if (b2 && !b2.disabled) b2.onclick(); } }, 10);
          return;
        }
        // a written task (Radio Alba's news item): the points tick off as you write, like the letters' desk; t.grade(text, { model })
        // → { grade, score 0..1, points, fixed, tips, zero }; showing the model costs half the marks
        if (t.kind === 'write') {
          const ta = f.body.querySelector('textarea'), cnt = f.body.querySelector('.lf-count'), lis = [...f.body.querySelectorAll('.lf-pts li')];
          const go = f.body.querySelector('.go'), mb = f.body.querySelector('button.model');
          if (cj() && CJK.mode(L()) === 'chars' && CJK.attachIME) { try { CJK.attachIME(ta); } catch (e) { /* */ } }
          let shown = false, tmr = null, sure = false;
          const count = () => (t.count ? t.count(ta.value) : String(ta.value).split(/\s+/).filter(Boolean).length);
          const upd = () => {
            const w = count(); cnt.textContent = `${w} word${w === 1 ? '' : 's'} (${t.min}–${t.max})`; cnt.classList.toggle('ok', w >= t.min && w <= t.max * 1.5);
            clearTimeout(tmr); tmr = setTimeout(() => { let okp = []; try { okp = t.check ? t.check(ta.value) : []; } catch (e) { okp = []; } lis.forEach((li, i) => { li.classList.toggle('ok', !!okp[i]); li.querySelector('.ck').textContent = okp[i] ? '✓' : String(i + 1); }); }, 450);
          };
          ta.oninput = upd;
          f.body.querySelectorAll('[data-st]').forEach(s => { s.onclick = () => { const p = t.points[+s.dataset.st]; if (!p || !p.starter) return; const txt = cj() ? (CJK.mode(L()) === 'chars' ? CJK.chars(p.starter.t, { lang: L() }) : CJK.plain(p.starter.t, { lang: L() })) : P(p.starter.t); const ins = String(txt).replace(/_{2,}/g, '').trim(); ta.value = (ta.value.trim() ? ta.value.replace(/\s*$/, ' ') : '') + ins + (cj() ? '' : ' '); ta.focus(); upd(); }; });
          if (mb) mb.onclick = () => { shown = true; f.body.querySelector('.lf-model').classList.remove('hidden'); mb.disabled = true; };
          const submit = () => {
            const text = ta.value.trim(); if (!text) return;
            const w = count();
            if (w < Math.ceil(t.min * 0.6) && !sure) { sure = true; fb.innerHTML = `<div class="lf-note"><b>${w} of at least ${t.min} words.</b> Press again to hand it in anyway.</div>`; return; }
            clearTimeout(tmr);
            let r = null; try { r = t.grade(text, { model: shown }); } catch (e) { console.error('[lifeui] write', e); r = { grade: 'D', score: 0 }; }
            T.last = { task: k, text, r };
            ta.disabled = true; go.disabled = true; if (mb) mb.disabled = true;
            const g = r.grade || 'D';
            lis.forEach((li, i) => { const okp = (r.points || [])[i]; li.classList.toggle('ok', !!okp); li.classList.toggle('no', !okp); li.querySelector('.ck').textContent = okp ? '✓' : '✗'; });
            const fix = r.fixed && r.fixed !== text ? `<div class="lf-box lf-fix">${fixHTML(text, r.fixed)}</div>` : '';
            const tips = (r.tips || []).slice(0, 3).map(x => `<div class="lf-note tip">• ${E(x)}</div>`).join('');
            snd(g === 'S' || g === 'A' ? 'chest' : 'page');
            finish(g, typeof r.score === 'number' ? r.score : ({ S: 1, A: 0.85, B: 0.7, C: 0.5, D: 0.2 })[g], `<div><span class="lf-grade g-${g}" title="${E(GRADE_EN[g] || '')}">${g}</span> ${r.zero ? E(ZERO[r.zero] || '') : shown ? 'With the model shown, it counts half.' : ''}</div>${fix}${tips}`);
          };
          go.onclick = submit;
          keys(e => { if (e.code === 'Escape') { end(true); return true; } return false; });
          setTimeout(() => ta.focus(), 60); upd();
          if (T.auto) setTimeout(() => { ta.value = typeof T.auto === 'function' ? T.auto(t) : T.auto === 'english' ? 'I do not know, sorry' : textOf(t.model); upd(); sure = true; submit(); }, 10);
          return;
        }
        const inp = f.body.querySelector('.lf-say input'), go = f.body.querySelector('.lf-say .go'), hb = f.body.querySelector('.lf-say .help');
        if (cj() && CJK.mode(L()) === 'chars' && CJK.attachIME) { try { CJK.attachIME(inp); } catch (e) { /* */ } }
        const showRung = () => { const x = help === 1 ? t.starter || t.model : t.model; if (!x) return; rung.innerHTML = `<b>${help === 1 && t.starter ? 'Start like this:' : 'You could say:'}</b> ${tl(x.t)} <span class="lf-note">${E(x.en || '')}</span>`; };
        hb.onclick = () => { if (help >= 2) return; help++; if (help === 1 && !t.starter) help = 2; showRung(); inp.focus(); };
        const submit = () => {
          const text = inp.value.trim(); if (!text) return;
          let r = null;
          try { r = t.judge ? t.judge(text, { band, help }) : judgeSay(text, t, band, help); } catch (e) { console.error('[lifeui] judge', e); r = { understood: false }; }
          T.last = { task: k, text, r };
          if (!r || !r.understood || r.wrong) {
            tries++; snd('wrong');
            if (tries >= 2) { help = 2; showRung(); inp.disabled = true; go.disabled = true; finish('D', 0.2, `<div class="lf-note">${E(r && r.note ? r.note : 'Here’s one way to say it (above).')}</div>`); return; }
            fb.innerHTML = `<div class="lf-bub">${lineHTML(r && r.wrongLine ? r.wrongLine : t.wrong || LIFE.said('again', 'shift') || { t: '…?', en: 'Sorry?' })}</div>${r && r.note ? `<div class="lf-note">${E(r.note)}</div>` : ''}`; wire(fb);
            inp.select(); return;
          }
          let g = r.grade || 'A'; if (help >= 2) g = 'D'; else if (help === 1 && g === 'S') g = 'A';
          inp.disabled = true; go.disabled = true; hb.disabled = true;
          const fix = r.fixed && r.fixed !== text ? `<div class="lf-box lf-fix">${fixHTML(text, r.fixed)}</div>` : '';
          const tips = (r.tips || []).slice(0, 2).map(x => `<div class="lf-note tip">• ${E(x)}</div>`).join('');
          snd(g === 'S' || g === 'A' ? 'chest' : 'page');
          finish(g, ({ S: 1, A: 0.85, B: 0.7, C: 0.5, D: 0.2 })[g], `<div><span class="lf-grade g-${g}" title="${E(GRADE_EN[g] || '')}">${g}</span> ${E(r.note || '')}</div>${fix}${tips}`);
        };
        go.onclick = submit; inp.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); submit(); } };
        keys(e => { if (e.code === 'Escape') { end(true); return true; } if (e.code === 'Tab') { hb.onclick(); return true; } return false; });
        setTimeout(() => inp.focus(), 60);
        if (T.auto) setTimeout(() => { inp.value = typeof T.auto === 'function' ? T.auto(t) : T.auto === 'model' ? textOf(t.model) : T.auto === 'english' ? 'I do not know, sorry' : textOf(t.model); submit(); if (!finished && f.body.querySelector('.lf-say input') === inp && !inp.disabled) { inp.value = T.auto === 'english' ? 'Sorry, I really do not understand' : textOf(t.model); submit(); } }, 10);
      }
      run();
    });
  }
  const textOf = ln => (!ln ? '' : cj() ? CJK.chars(ln.t, { lang: L() }) : P(ln.t));
  // the default judge of a spoken answer: TALK.judge with the task's want (the Spanglish bridge on)
  function judgeSay(text, t, band, help) {
    try { if (EXAM._.idkOnly(text, L())) return { understood: false }; } catch (e) { /* */ }
    const r = TALK.judge(text, t.want || { any: true }, { band, help: Math.min(help, 2), shown: help >= 2, focus: t.focus, tips: t.tips });
    if (r && r.understood && r.a) { try { if (!(r.errors || []).some(e => e.sev === 'major' && !e.free)) DICT.metAll(r.a, 'used'); } catch (e) { /* */ } }
    if (r && r.understood && !r.met && (r.missing || []).length) r.note = (r.tips || [])[0] || '';
    return r;
  }

  // ------------------------------------------------------------ the debate: a TALK view (TALK.turn drives it), with the stage
  // def: { title, sub, people: { mayor: { name, look }, a: { name, look, pos }, b: {…} }, side: 'a' | 'b', band }
  // the view: npc(line) (line.who: 'mayor' | 'a' | 'b') · you(text) → { grade, miss } · mimo({ diff, tips, model }) · input(task)
  //   · model(x) · sys(text) · teach(pre) · line(who, ln) (the debate's own lines) · meter(k) (0..1, your side's share) · vote(o) · close()
  function debate(def) {
    const r = open();
    const card = document.createElement('div'); card.className = 'lf-card lf-dv';
    const pp = (key, cls) => { const p = def.people[key] || {}; return `<div class="pp ${cls || ''}" data-p="${key}"><canvas width="184" height="184"></canvas><b>${E(P(p.name || ''))}</b><span class="pos">${E(p.pos || '')}</span></div>`; };
    card.innerHTML = `<div class="lf-stage">${pp('a')}${pp('mayor', 'mayor')}${pp('b')}<div class="lf-meter"><i class="a" style="width:50%"></i><i class="b" style="width:50%"></i></div></div>`
      + `<div class="lf-log"></div><div class="lf-foot" style="flex-direction:column;align-items:stretch"><div class="lf-goal"></div><div class="lf-rung"></div>`
      + `<div class="lf-say" style="margin:0"><input autocomplete="off" spellcheck="false" placeholder="Say it in ${E(LANGNAME[L()] || 'the language')}…" disabled><button class="main go" type="button" disabled>Say it</button><button class="help" type="button" title="Help (Tab)">?</button></div></div>`;
    r.appendChild(card);
    ['a', 'mayor', 'b'].forEach(k => face(card.querySelector(`[data-p="${k}"] canvas`), (def.people[k] || {}).look));
    const log = card.querySelector('.lf-log'), inp = card.querySelector('input'), go = card.querySelector('.go'), hb = card.querySelector('.help'), goalEl = card.querySelector('.lf-goal'), rungEl = card.querySelector('.lf-rung');
    if (cj() && CJK.mode(L()) === 'chars' && CJK.attachIME) { try { CJK.attachIME(inp); } catch (e) { /* */ } }
    const add = (cls, html) => { const d = document.createElement('div'); d.className = 'lf-m ' + cls; d.innerHTML = html; log.appendChild(d); wire(d); d.scrollIntoView({ block: 'end' }); return d; };
    const talking = k => card.querySelectorAll('.pp').forEach(x => x.classList.toggle('talking', x.dataset.p === k));
    let pending = null, rungs = [], help = 0, alive = true;
    const showRung = () => { const K = ['', 'Start like this', 'For example', 'You could say']; const n = Math.min(3, help), x = rungs[n - 1] || rungs.slice(0, n).reverse().find(Boolean); rungEl.innerHTML = n && x ? `<b>${K[n]}:</b> ${tl(x.t)} <span class="lf-note">${E(x.en || '')}</span>` : ''; };
    const submit = () => { const t = inp.value.trim(); if (!pending || !t) return; const f = pending; pending = null; inp.value = ''; inp.disabled = true; go.disabled = true; f({ text: t, help }); };
    go.onclick = submit; inp.onkeydown = e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); submit(); } };
    hb.onclick = () => { if (!pending || help >= 3 || !rungs.some(Boolean)) return; help++; while (help < 3 && !rungs[help - 1]) help++; showRung(); inp.focus(); };
    keys(e => { if (e.code === 'Tab') { hb.onclick(); return true; } if (e.code === 'Escape') { view.quit(); return true; } return false; });
    const nameOf = k => P((def.people[k] || {}).name || '');
    const view = {
      async npc(line) {
        if (!alive) return;
        const k = line.who && def.people[line.who] ? line.who : 'mayor';
        talking(k);
        add(k === 'mayor' ? 'mayor' : 'them', `<span class="who">${E(nameOf(k))}</span>${lineHTML(line)}`);
        const c = speak([line], 'life.dv.' + k, { voice: (def.people[k] || {}).voice });
        if (c && c.done && !T.fast) await Promise.race([c.done, wait(Math.min(9000, 900 + P(line.t).length * 70))]); else await wait(T.fast ? 0 : 500);
        talking(null);
      },
      line(k, ln) { return view.npc(Object.assign({}, ln, { who: k })); },
      async teach(pre) {
        if (!alive || !pre || !pre.words || !pre.words.length) return;
        add('new', `<span class="who">✨ New ${pre.words.length > 1 ? 'words' : 'word'} for the next question</span>${pre.words.map(w => `<b>${w.src && cj() ? CJK.html(w.src, { lang: L(), cap: false }) : E(w.t)}</b> <i>${E(w.en)}</i>`).join(' · ')}`);
        await wait(300);
      },
      you(text) {
        const d = add('me', E(text));
        return { grade(g) { d.insertAdjacentHTML('beforeend', `<span class="gr g-${E(g)}" title="${E(GRADE_EN[g] || '')}">${E(g)}</span>`); }, miss() { d.insertAdjacentHTML('beforeend', ' <b>?</b>'); snd('wrong'); } };
      },
      async mimo(m) {
        const nm = E((game() && game().state && game().state.mimoName) || 'Mimo');
        add('mimo', `<span class="who">${nm}</span>${m.diff ? `<div class="lf-fix">${m.diff}</div>` : m.model ? `<div>${tl(m.model.t)}</div>` : ''}${m.tips && m.tips.length ? `<ul>${m.tips.slice(0, 3).map(t => `<li>${E(t)}</li>`).join('')}</ul>` : ''}`);
        await wait(200);
      },
      async model(x) { help = 3; showRung(); if (x) add('sys', 'They didn’t follow. Here’s one way to say it (you can say it your way too):'); inp.focus(); },
      sys(text) { add('sys', E(text)); },
      input(task) {
        if (!alive) return Promise.resolve(null);
        rungs = task.rungs || []; help = task.help || 0;
        goalEl.textContent = '✎ ' + (task.goal || 'Answer in your own words.'); showRung();
        inp.disabled = false; go.disabled = false; setTimeout(() => inp.focus(), 30);
        return new Promise(res => { pending = res; if (T.auto) setTimeout(() => { inp.value = typeof T.auto === 'function' ? T.auto(task) : ''; submit(); }, 10); });
      },
      meter(k) { const a = card.querySelector('.lf-meter .a'), b = card.querySelector('.lf-meter .b'); const v = Math.max(0.05, Math.min(0.95, k)); a.style.width = (def.side === 'a' ? v : 1 - v) * 100 + '%'; b.style.width = (def.side === 'a' ? 1 - v : v) * 100 + '%'; },
      // the vote: o: { forA, forB, total, lines: [line], won, prize } → resolves when you close it
      vote(o) {
        return new Promise(res => {
          inp.disabled = true; go.disabled = true; goalEl.textContent = ''; rungEl.innerHTML = '';
          const d = add('sys', ''); d.className = 'lf-vote'; d.style.alignSelf = 'stretch';
          const sideA = def.side === 'a';
          d.innerHTML = `<div class="hands"></div><div class="tally"><span class="a">0</span> · <span class="b">0</span></div><div class="lf-note">${E(nameOf('a'))} (${E((def.people.a || {}).short || 'for')}) · ${E(nameOf('b'))} (${E((def.people.b || {}).short || 'against')})</div>`;
          const hands = d.querySelector('.hands'), ta = d.querySelector('.tally .a'), tb = d.querySelector('.tally .b');
          let i = 0; const n = o.forA + o.forB;
          const step = () => {
            if (!alive) return res();
            if (i < n) { const isA = i < o.forA; hands.textContent += isA ? '🟦' : '🟧'; if (isA) ta.textContent = String(i + 1); else tb.textContent = String(i - o.forA + 1); i++; setTimeout(step, T.fast ? 0 : 70); return; }
            snd(o.won ? 'learned' : 'page');
            const fin = document.createElement('div'); fin.innerHTML = (o.lines || []).map(l => `<div class="lf-bub" style="text-align:left">${lineHTML(l)}</div>`).join('') + (o.prize ? `<div class="lf-gift">${o.prize}</div>` : '');
            d.appendChild(fin); wire(fin);
            const b = btn('Done', 'main', () => { res(); }); d.appendChild(b); setTimeout(() => b.focus(), 30); d.scrollIntoView({ block: 'end' });
            keys(e => { if (e.code === 'Enter' || e.code === 'Escape') { res(); return true; } return false; });
            if (T.auto) setTimeout(res, 10);
            void sideA;
          };
          step();
        });
      },
      quit() { if (pending) { const f = pending; pending = null; f(null); } alive = false; },
      close() { alive = false; if (pending) { const f = pending; pending = null; f(null); } keys(null); close(); },
      get alive() { return alive; },
    };
    return view;
  }

  return {
    letter, desk, posted, review, album, card, shift, debate, drawStamp, lineHTML, glossHTML, tl, wire, speak, fixHTML, close,
    get isOpen() { return !!openN; },
    _: { T, frame, judgeSay, textOf, get root() { return root; } },
  };
})();
