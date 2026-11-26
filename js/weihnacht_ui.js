'use strict';
// Fiete's Weihnachtsmarkt: the panels, the typed German and the 2D pictures (weihnacht.js; German games only).
// A cream paper card in a gingerbread frame with a piped-icing edge, under a string of market lights, for the lessons and
// the step-by-step tasks (the stalls, the baking, Nikolaus, the presents); and a call bar at the bottom of the screen for
// the market night. Typed German is matched without case, accents or punctuation (ä = ae = a, ß = ss), whole words in
// order, with one typo allowed in a long word (it still counts, with a note).
// One global, WUI:
//   WUI.bind(game)
//   text: WUI.canon(s), WUI.toks(s), WUI.has(text, list) → { ok, typo, i } (each entry a phrase, or an array of phrases that
//     must all be there), WUI.idk(text), WUI.hintOf(s, n), WUI.num(word), WUI.price(text) → { cents, digits } | null,
//     WUI.euro(cents) → '4,50 €', WUI.euroWords(cents) → 'vier Euro fünfzig', WUI.sayDE(s), WUI.esc
//   WUI.lesson({ title, sub, face, name, intro: [de, en], items: [{ id, de, en, note, sit, keys, art, artRecall }], recall,
//     recallLine, outro, outroNote }) → { done, clean: { id: bool } } | { quit }
//   WUI.steps(steps, { title, sub, face, name, intro }) → { done, grades } | { quit }
//     a step: { kind, big, gl, note, sit, art (html, or fn(el) that draws into it), say: [de, en], model, modelEn,
//       keys | check(text) → { ok, grade, minor, why, note, said }, placeholder, echo, voice, help, miss, after,
//       onOk(c, text, E) (async: an animation before the next step), then(r), skip() }
//     No fail states: after two misses the model shows, and saying it then is a D.
//   WUI.hud: open(title), cue(o), call({ icon | draw, title, sub, bar, model, modelEn, keys | check, placeholder }) → 'S'…'D' |
//     'quit', fb(html, ok), close()
//   WUI.art: pictures as canvases (see the second half of this file)
//   tests: WUI.cur / WUI.hcur ({ model, submit(text), idk(), hint() }) while a card or the bar waits; WUI.fast skips pauses;
//     WUI.drive(o) answers everything (lines, menus, cards, the bar) until no scene runs
// Needs core.js, icons.js and audio.js; UI, Input and STORY at run time.

const WUI = (() => {
  let G = null;
  const bind = g => { G = g; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* no audio yet */ } };
  // (game time when the tab is hidden, or in tests: then __g.go drives it)
  const wait = s => (typeof STORY !== 'undefined' && STORY.wait && (document.hidden || st.fast) ? STORY.wait(s) : new Promise(r => setTimeout(r, s * 1000)));
  const GR = ['S', 'A', 'B', 'C', 'D'];
  const worse = (a, b) => GR[Math.max(GR.indexOf(a), GR.indexOf(b))];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const PRAISE = [['Super!', 'Great!'], ['Genau!', 'Exactly!'], ['Toll!', 'Brilliant!'], ['Prima!', 'Excellent!'], ['Klasse!', 'Awesome!']];

  // ================================================================ typed German
  // lower case, no accents or punctuation; ä / ae → a, ö / oe → o, ü / ue → u, ß → ss (both sides go through it); Turkish
  // words too (doener.js): ç ş ğ lose their marks like the rest, and the dotless ı becomes i («Yıldız» = «Yildiz»)
  const canon = s => norm(String(s == null ? '' : s).replace(/['’`´]/g, '').replace(/ı/g, 'i')).replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim();
  const toks = s => canon(s).split(' ').filter(Boolean);
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // one word against another: 0 the same, 1 a typo (one letter off in a word of 5+, two in a word of 10+), -1 not it
  const wEq = (a, b) => (a === b ? 0 : b.length >= 5 && a.length >= 4 && lev(a, b) <= (b.length >= 10 ? 2 : 1) ? 1 : -1);
  function findIn(T, P) {
    if (!P.length) return null;
    for (let i = 0; i + P.length <= T.length; i++) {
      let typo = 0, ok = true;
      for (let j = 0; j < P.length; j++) { const e = wEq(T[i + j], P[j]); if (e < 0) { ok = false; break; } typo += e; }
      if (ok) return { at: i, typo };
    }
    return null;
  }
  // does the text say one of these? An entry is a phrase (its words in order, side by side), or an array of phrases that
  // must all be there (in any order)
  function has(text, list) {
    const T = toks(text), L = Array.isArray(list) ? list : [list];
    for (let i = 0; i < L.length; i++) {
      const k = L[i]; if (!k) continue;
      if (Array.isArray(k)) {
        let typo = 0, ok = true;
        for (const w of k) { const f = findIn(T, toks(w)); if (!f) { ok = false; break; } typo += f.typo; }
        if (ok) return { ok: true, typo: typo > 0, i };
      } else { const f = findIn(T, toks(k)); if (f) return { ok: true, typo: f.typo > 0, i }; }
    }
    return { ok: false };
  }
  const word = (text, w) => toks(text).some(t => wEq(t, canon(w)) >= 0);
  const idk = t => /^\s*\?+\s*$/.test(String(t || '')) || ['idk', 'i dont know', 'i don t know', 'dont know', 'weiss nicht', 'ich weiss nicht', 'keine ahnung', 'hilfe', 'help'].includes(canon(t));
  const hintOf = (s, n) => String(s).split(' ').map(w => [...w].map((ch, i) => (!/[a-zäöüß]/i.test(ch) || i === 0 || n >= 3 || (n >= 2 && i % 2 === 0) ? ch : '_')).join('')).join(' ');
  const sayDE = s => { try { Sound.say(String(s).replace(/[«»„“”"…*]/g, '').replace(/\s+/g, ' ').trim(), 'de'); } catch (e) { /* no voice */ } };

  // numbers in words (0–999): «drei», «fünfzig», «einundzwanzig», «zweihundertfünfzig»
  const NUMW = { null: 0, eins: 1, ein: 1, eine: 1, einen: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, funf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, elf: 11, zwolf: 12,
    dreizehn: 13, vierzehn: 14, funfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19, zwanzig: 20, dreissig: 30, vierzig: 40, funfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
  function num(w) {
    w = canon(w).replace(/ /g, '');
    if (!w) return null;
    if (NUMW[w] !== undefined) return NUMW[w];
    let m = w.match(/^(.*?)hundert(?:und)?(.*)$/);
    if (m) { const h = m[1] ? num(m[1]) : 1, r = m[2] ? num(m[2]) : 0; return h != null && h >= 1 && h < 10 && r != null && r < 100 ? h * 100 + r : null; }
    m = w.match(/^(ein|zwei|drei|vier|funf|sechs|sieben|acht|neun)und(zwanzig|dreissig|vierzig|funfzig|sechzig|siebzig|achtzig|neunzig)$/);
    return m ? NUMW[m[1]] + NUMW[m[2]] : null;
  }
  const ONES = ['null', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
  const TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
  function numWords(n) {
    if (n < 20) return n === 1 ? 'eins' : ONES[n];
    if (n < 100) return (n % 10 ? ONES[n % 10] + 'und' : '') + TENS[Math.floor(n / 10)];
    const h = Math.floor(n / 100), r = n % 100; return (h === 1 ? 'hundert' : ONES[h] + 'hundert') + (r ? numWords(r) : '');
  }
  const euro = c => `${Math.floor(c / 100)},${String(c % 100).padStart(2, '0')} €`;
  const euroWords = c => { const e = Math.floor(c / 100), r = c % 100; return (e === 1 ? 'ein' : numWords(e)) + ' Euro' + (r ? ' ' + numWords(r) : ''); };
  // a price as typed: «drei Euro fünfzig», «drei fünfzig», «4 Euro», «3,50 €», «fünfzig Cent» → { cents, digits } | null
  function price(text) {
    const raw = String(text || '');
    const d = raw.match(/(\d+)\s*(€|euro)?\s*(?:[,.]\s*(\d{1,2})|(\d{1,2}))?/i);
    if (d) {
      const cs = d[3] || d[4] || '', e = +d[1], c = cs ? +(cs.length === 1 && d[3] ? cs + '0' : cs) : 0;
      if (/cent/i.test(raw) && !/euro|€/i.test(raw) && !cs) return { cents: e, digits: true };
      return { cents: e * 100 + c, digits: true };
    }
    const T = toks(raw), N = T.map(w => num(w)), art = w => /^(ein|eine|einen)$/.test(w);
    const ei = T.findIndex(w => w === 'euro' || w === 'euros' || w === 'eur');
    if (ei >= 0) {
      if (!(ei > 0 && N[ei - 1] != null)) return null;
      const j = T[ei + 1] === 'und' ? ei + 2 : ei + 1;
      return { cents: N[ei - 1] * 100 + (j < T.length && N[j] != null && !art(T[j]) ? N[j] : 0), digits: false };
    }
    const ci = T.findIndex(w => w === 'cent');
    if (ci > 0 && N[ci - 1] != null) return { cents: N[ci - 1], digits: false };
    const idx = []; T.forEach((w, i) => { if (N[i] != null && !art(w)) idx.push(i); });
    if (!idx.length) return null;
    const last = idx[idx.length - 1], prev = idx.length > 1 ? idx[idx.length - 2] : -1;
    if (prev === last - 1 && N[last] >= 10 && N[last] < 100) return { cents: N[prev] * 100 + N[last], digits: false };
    return { cents: N[last] * 100, digits: false };
  }

  // ================================================================ the look
  const BULBS = 'radial-gradient(circle at 10px 14px, #ff6a5a 0 5px, transparent 5.6px) 0 0/88px 26px repeat-x,'
    + 'radial-gradient(circle at 32px 15px, #ffd23f 0 5px, transparent 5.6px) 0 0/88px 26px repeat-x,'
    + 'radial-gradient(circle at 54px 14px, #7ee08f 0 5px, transparent 5.6px) 0 0/88px 26px repeat-x,'
    + 'radial-gradient(circle at 76px 15px, #7cc4ff 0 5px, transparent 5.6px) 0 0/88px 26px repeat-x,'
    + 'linear-gradient(#2b2235, #2b2235) 0 7px/100% 2px no-repeat';
  const CSS = `
#wmov { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; font-family: "Trebuchet MS", "Segoe UI", system-ui, sans-serif; color: #2b2235; -webkit-font-smoothing: antialiased; }
#wmov.hidden, #wmov .hidden { display: none !important; } #wmov * { box-sizing: border-box; }
#wmov .sh { position: absolute; inset: 0; background: radial-gradient(circle at 50% 35%, rgba(40,30,60,.34), rgba(14,12,34,.66)); }
#wmov .pn { position: relative; width: min(1100px, calc(100vw - 16px)); max-height: calc(100vh - 16px); background: #fff8ec; border: 7px solid #8b5a2b; border-radius: 24px;
  box-shadow: 0 0 0 3px #2b2235, 0 14px 0 6px rgba(20,14,30,.3); outline: 3px dashed #fffaf0; outline-offset: -13px; overflow: hidden; }
#wmov .lights { height: 26px; background: ${BULBS}; background-color: #1f4d36; filter: drop-shadow(0 2px 3px rgba(255,214,120,.55)); }
#wmov .hd { display: flex; align-items: center; gap: 12px; padding: 2px 18px 9px; background: #1f4d36; color: #fff8ec; }
#wmov .hd b { font: 800 21px Bahnschrift, "Segoe UI", sans-serif; } #wmov .hd .t { font-weight: 700; opacity: .72; }
#wmov .hd .dots { margin-left: auto; display: flex; gap: 4px; flex-wrap: wrap; max-width: 46%; }
#wmov .hd .dots i { width: 11px; height: 11px; border-radius: 50%; border: 2px solid #ffd23f; } #wmov .hd .dots i.f { background: #ffd23f; }
#wmov .hd .dots i.now { background: #ff6a5a; border-color: #fff8ec; box-shadow: 0 0 6px 2px rgba(255,210,63,.7); }
#wmov button { font: inherit; font-weight: 800; font-size: 14px; color: #2b2235; background: #fff8ec; border: 2.5px solid #2b2235; border-radius: 12px; padding: 4px 11px; cursor: pointer; box-shadow: 0 3px 0 rgba(43,34,53,.18); }
#wmov button:hover { background: #ffe9c2; } #wmov button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(43,34,53,.18); }
#wmov button.go { background: #c8322a; color: #fff; } #wmov button.go:hover { background: #dc4336; }
#wmov kbd { font: 800 11px "Segoe UI", sans-serif; border: 1.5px solid currentColor; border-radius: 5px; padding: 0 4px; margin-left: 3px; }
#wmov .bd { display: grid; grid-template-columns: 210px 1fr; gap: 18px; padding: 14px 24px 22px; overflow: auto; max-height: calc(100vh - 100px); }
#wmov .who { display: flex; flex-direction: column; align-items: center; gap: 9px; }
#wmov .who canvas { width: 104px; height: 104px; border-radius: 50%; border: 3px solid #2b2235; background: #ffe9c9; }
#wmov .who .nm { font: 800 15px Bahnschrift, sans-serif; text-align: center; }
#wmov .bub { position: relative; background: #fff; border: 2.5px solid #2b2235; border-radius: 16px; padding: 8px 12px; font-size: 17px; font-weight: 700; line-height: 1.45; box-shadow: 0 3px 0 rgba(43,34,53,.15); }
#wmov .bub i { display: block; font-size: 12.5px; font-weight: 600; opacity: .7; margin-top: 3px; line-height: 1.35; }
#wmov .bub .wm-enb { float: right; font: 800 11px "Segoe UI", sans-serif; color: #2b2235; background: #fffaf0; border: 2px solid #2b2235; border-radius: 8px; padding: 0 6px; margin: 0 0 2px 8px; cursor: pointer; box-shadow: none; }
#wmov .cd { background: #fff; border: 3px solid #2b2235; border-radius: 18px; padding: 12px 18px 14px; box-shadow: 0 5px 0 rgba(43,34,53,.15); display: flex; flex-direction: column; gap: 7px; align-self: start; }
#wmov .cd.ok { box-shadow: 0 0 0 4px #2f9e5c, 0 5px 0 rgba(43,34,53,.15); }
#wmov .cd .kind { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #b8322a; }
#wmov .cd .big { font: 900 34px Bahnschrift, "Segoe UI", sans-serif; color: #b8322a; line-height: 1.2; }
#wmov .cd .art { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 12px; }
#wmov .cd .art canvas { max-width: 100%; }
#wmov .cd .gl { font-size: 18px; font-weight: 800; line-height: 1.4; } #wmov .cd .note { font-size: 14px; opacity: .84; line-height: 1.45; }
#wmov .cd .sit { font-size: 19px; font-weight: 800; line-height: 1.35; }
#wmov .cd form { display: flex; gap: 8px; }
#wmov .cd input { flex: 1; min-width: 0; font: 600 21px "Segoe UI", sans-serif; padding: 6px 10px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; }
#wmov .cd input:focus { box-shadow: 0 0 0 3px rgba(200,50,42,.28); }
#wmov .cd .hint { font: 700 15px "Trebuchet MS", sans-serif; min-height: 22px; line-height: 1.45; }
#wmov .cd .hint.no { color: #b3261e; } #wmov .cd .hint.ok { color: #1d7a45; } #wmov .cd .hint.tip { color: #b8322a; letter-spacing: .06em; font-size: 18px; }
#wmov .cd .row { display: flex; gap: 8px; align-items: center; font-size: 12px; font-weight: 700; flex-wrap: wrap; } #wmov .cd .row span { opacity: .6; }
#wmov .chip { display: inline-block; background: #fdf1d8; border: 2px solid #c79a5a; border-radius: 10px; padding: 1px 8px; margin: 2px 2px; font-weight: 800; }
#wmov .shake { animation: wm-shake .35s; } @keyframes wm-shake { 20% { transform: translateX(-8px); } 45% { transform: translateX(7px); } 70% { transform: translateX(-4px); } }
.wm-gr { display: inline-block; font: 900 15px Bahnschrift, sans-serif; color: #fff; border: 2.5px solid #2b2235; border-radius: 99px; padding: 0 10px; margin-right: 6px; transform: rotate(-3deg); }
.wm-gr.S { background: #e0a020; } .wm-gr.A { background: #2f9e5c; } .wm-gr.B { background: #3f7fc9; } .wm-gr.C { background: #8a5ab0; } .wm-gr.D { background: #8a8f9e; }
body.wm-open #objective, body.wm-open #counters, body.wm-open #help, body.wm-open #compass, body.wm-open #minimap, body.wm-open .bubble, body.wm-open #thought, body.wm-open .prompt { display: none !important; }
@media (max-width: 860px) { #wmov .bd { grid-template-columns: 1fr; } #wmov .who { flex-direction: row; } }
#wmhud { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 11; width: min(620px, calc(100vw - 24px)); background: #fff8ec; border: 5px solid #8b5a2b; border-radius: 18px;
  box-shadow: 0 0 0 3px #2b2235, 0 10px 0 4px rgba(20,14,30,.3); outline: 2.5px dashed #fffaf0; outline-offset: -9px; padding: 0 14px 12px; font-family: "Trebuchet MS", "Segoe UI", sans-serif; color: #2b2235; overflow: hidden; }
#wmhud.hidden { display: none; } #wmhud * { box-sizing: border-box; }
#wmhud .lights { height: 24px; margin: 0 -14px 6px; background: ${BULBS}; background-color: #1f4d36; }
#wmhud .hd { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #b8322a; }
#wmhud .cue { display: flex; align-items: center; gap: 12px; margin-top: 3px; }
#wmhud canvas { width: 64px; height: 64px; border-radius: 14px; background: #1f2a44; border: 3px solid #2b2235; flex: 0 0 auto; }
#wmhud .t { font: 800 19px Bahnschrift, "Segoe UI", sans-serif; line-height: 1.3; } #wmhud .sub { font-size: 13px; font-weight: 700; opacity: .74; line-height: 1.4; }
#wmhud form { display: flex; gap: 8px; margin-top: 8px; }
#wmhud input { flex: 1; min-width: 0; font: 600 20px "Segoe UI", sans-serif; padding: 5px 10px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; }
#wmhud button { font: inherit; font-weight: 800; font-size: 15px; color: #2b2235; border: 2.5px solid #2b2235; border-radius: 12px; padding: 4px 12px; background: #fff8ec; cursor: pointer; } #wmhud button.go { background: #c8322a; color: #fff; }
#wmhud .fb { min-height: 22px; margin-top: 6px; font-weight: 800; font-size: 15px; line-height: 1.45; } #wmhud .fb.ok { color: #1d7a45; } #wmhud .fb.no { color: #b3261e; }
#wmhud .bar { height: 10px; border-radius: 99px; background: rgba(43,34,53,.12); overflow: hidden; margin-top: 7px; } #wmhud .bar b { display: block; height: 100%; background: linear-gradient(90deg, #ffd23f, #ff8a3a); transition: width .3s; }
body.wm-hud .bubble, body.wm-hud #thought, body.wm-hud .prompt, body.wm-hud #objective { display: none !important; }
`;
  function css() { if (document.getElementById('wm-css')) return; const s = document.createElement('style'); s.id = 'wm-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ================================================================ the card
  const OV = { root: null, keys: null, open: false };
  const st = { fast: false, cur: null, hcur: null };
  function open(o) {
    css();
    if (!OV.root) { const r = document.createElement('div'); r.id = 'wmov'; r.className = 'hidden'; r.innerHTML = '<div class="sh"></div><div class="pn"></div>'; document.body.appendChild(r); OV.root = r; OV.pn = r.querySelector('.pn'); }
    OV.pn.innerHTML = `<div class="lights"></div><div class="hd"><b></b><span class="t"></span><span class="dots"></span><button type="button" class="stop">Stop <kbd>Esc</kbd></button></div>
<div class="bd"><div class="who"><canvas width="128" height="128"></canvas><div class="nm"></div><div class="bub"></div></div>
<div class="cd"><div class="kind"></div><div class="big"></div><div class="art"></div><div class="gl"></div><div class="note"></div><div class="sit"></div>
<form autocomplete="off"><input spellcheck="false" autocomplete="off"><button type="submit" class="go">Say it</button></form><div class="hint"></div>
<div class="row"><button type="button" class="idk">Show me (?)</button><span>Tab: a hint · Esc: stop</span></div></div></div>`;
    const q = s => OV.pn.querySelector(s);
    const E = { title: q('.hd b'), sub: q('.hd .t'), dots: q('.dots'), stop: q('.stop'), face: q('.who canvas'), nm: q('.who .nm'), bub: q('.bub'), cd: q('.cd'), kind: q('.kind'), big: q('.big'), art: q('.art'), gl: q('.gl'),
      note: q('.note'), sit: q('.sit'), form: q('form'), input: q('input'), hint: q('.hint'), idk: q('.idk'), quit: null };
    E.title.textContent = o.title || ''; E.sub.textContent = o.sub || ''; E.nm.textContent = o.name || '';
    try { if (typeof ICONS !== 'undefined') ICONS.draw(E.face, o.face || 'star'); } catch (e) { /* */ }
    OV.root.classList.remove('hidden'); document.body.classList.add('wm-open'); OV.open = true;
    if (OV.keys) removeEventListener('keydown', OV.keys, true);
    OV.keys = e => { if (e.isComposing) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (E.quit) E.quit(); } else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); if (st.cur) st.cur.hint(); } };
    addEventListener('keydown', OV.keys, true);
    E.stop.onclick = () => { if (E.quit) E.quit(); };
    Input.typing = true; if (G) { G.state.teaching = true; G.prompt = null; }
    return E;
  }
  function close() {
    if (!OV.root) return;
    OV.root.classList.add('hidden'); document.body.classList.remove('wm-open'); OV.open = false;
    if (OV.keys) { removeEventListener('keydown', OV.keys, true); OV.keys = null; }
    Input.typing = false; if (G) G.state.teaching = false; st.cur = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  // a line in the bubble, by the weave like every line (DESIGN.md 17.3): mixed (the English with the words you know in German),
  // whole in German as the weave rises; its English only on request (EN on the bubble), never under it by default
  const bub = (E, l) => {
    E.bub.classList.toggle('hidden', !l); if (!l) { E.bub.innerHTML = ''; return; }
    const t = l[0], en = l[1];
    if (!t) { E.bub.innerHTML = en ? `<i>${esc(en)}</i>` : ''; return; }
    let html = esc(t);
    try { if (en && typeof STORY !== 'undefined' && STORY.mixHTML) html = STORY.mixHTML(t, en, { key: 'wm:' + en }).html; } catch (e) { /* (as written) */ }
    E.bub.innerHTML = (en ? '<button type="button" class="wm-enb" title="This line in English">EN</button>' : '') + html + (en ? `<i class="hidden">${esc(en)}</i>` : '');
    const b = E.bub.querySelector('.wm-enb'), tr = E.bub.querySelector('i');
    if (b) b.onclick = ev => { ev.stopPropagation(); tr.classList.toggle('hidden'); if (E.input) E.input.focus(); };
  };
  const dots = (E, i, n) => { E.dots.innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'f' : ''} ${k === i ? 'now' : ''}"></i>`).join(''); };
  // a step's picture: html, a canvas, or a function that draws into the element (or returns a canvas to put there)
  const putArt = (el, art) => { el.innerHTML = ''; if (typeof art === 'function') { try { const r = art(el); if (r && r.nodeType) el.appendChild(r); } catch (e) { console.error('[wui] art', e); } } else if (art && art.nodeType) el.appendChild(art); else if (art) el.innerHTML = art; };
  // one step: → { ok, grade, clean, text, r } | 'quit'
  function step(E, s, i, n) {
    return new Promise(res => {
      let tries = 0, hints = 0, shown = !!s.echo, done = false;
      dots(E, i, n);
      if (s.say) bub(E, s.say);
      E.cd.classList.remove('ok');
      E.kind.textContent = s.kind || '';
      E.big.innerHTML = s.big ? esc(s.big) : ''; E.big.classList.toggle('hidden', !s.big);
      putArt(E.art, s.art); E.art.classList.toggle('hidden', !s.art);
      E.gl.innerHTML = s.gl || ''; E.gl.classList.toggle('hidden', !s.gl);
      E.note.innerHTML = s.note || ''; E.note.classList.toggle('hidden', !s.note);
      E.sit.innerHTML = s.sit || ''; E.sit.classList.toggle('hidden', !s.sit);
      E.idk.classList.toggle('hidden', !!s.echo || !s.model);
      E.input.value = ''; E.input.placeholder = s.placeholder || (s.echo ? s.model : 'say it in German…'); E.input.disabled = false;
      const tip = (html, cls) => { E.hint.className = 'hint ' + (cls || ''); E.hint.innerHTML = html || ''; };
      tip(s.help || (s.echo ? 'Type it just like that (capitals, ä ö ü and ß don’t matter: ae oe ue ss work too)' : ''), '');
      if (s.voice) setTimeout(() => sayDE(s.voice), 160);
      setTimeout(() => E.input.focus(), 40);
      const fin = v => { if (done) return; done = true; st.cur = null; E.quit = null; res(v); };
      E.quit = () => fin('quit');
      const showModel = () => { shown = true; tip(`Here: <b>«${esc(s.model)}»</b>${s.modelEn ? ` <i>(${esc(s.modelEn)})</i>` : ''}. Type it!`, ''); sayDE(s.model); E.input.value = ''; E.input.focus(); };
      const submit = async text => {
        const t = String(text || '').trim(); if (!t || done || E.input.disabled) return;
        if (!s.echo && s.model && idk(t)) { showModel(); return; }
        let c;
        try { c = s.check ? (s.check(t) || {}) : (() => { const h = has(t, s.keys || [s.model]); return { ok: h.ok, minor: h.typo, note: h.typo ? `spelled: «${esc(s.model)}»` : '' }; })(); } catch (e) { console.error('[wui] check', e); c = { ok: false }; }
        if (c.ok) {
          let grade = s.echo ? 'S' : shown ? 'D' : GR[Math.min(3, tries + Math.min(1, hints) + (c.minor ? 1 : 0))];
          if (c.grade && !s.echo) grade = worse(grade, c.grade);
          E.input.disabled = true; E.cd.classList.add('ok'); snd(s.echo ? 'learned' : grade === 'S' ? 'perfect' : 'review');
          tip(`${s.echo ? '' : `<span class="wm-gr ${grade}">${grade}</span>`}✓ ${esc(c.said || t)}${c.note ? ' · ' + c.note : ''}${s.after ? ' · ' + s.after : ''}`, 'ok');
          if (s.big) E.big.classList.remove('hidden');
          const r = { ok: true, grade, clean: !tries && !hints && !shown, text: t, r: c };
          st.cur = null;
          try { if (s.onOk) await s.onOk(c, t, E); } catch (e) { console.error('[wui] onOk', e); }
          if (!st.fast) await wait(c.pause || s.pause || 1.1);
          try { if (s.then) s.then(r); } catch (e) { console.error('[wui] then', e); }
          fin(r); return;
        }
        tries++; snd('wrong');
        E.cd.classList.remove('shake'); void E.cd.offsetWidth; E.cd.classList.add('shake');
        if (s.model && tries >= 2 && !shown) { shown = true; tip((c.why ? c.why + '<br>' : '') + `Try: <b>«${esc(s.model)}»</b>${s.modelEn ? ` <i>(${esc(s.modelEn)})</i>` : ''}`, 'no'); sayDE(s.model); }
        else tip(c.why || (shown ? `Copy it: <b>«${esc(s.model)}»</b>` : s.miss || 'Not quite. Try again! (Tab: a hint)'), 'no');
        E.input.select();
      };
      st.cur = { model: s.testAnswer || s.model || '', submit, idk: () => s.model && showModel(), hint: () => { if (!s.model || shown) return; hints = Math.min(3, hints + 1); tip(esc(hintOf(s.model, hints + 1)), 'tip'); E.input.focus(); } };
      E.form.onsubmit = e => { e.preventDefault(); submit(E.input.value); };
      E.idk.onclick = () => st.cur && st.cur.idk();
    });
  }
  async function steps(list, o = {}) {
    const E = open(o), grades = [];
    if (o.intro) bub(E, o.intro);
    try {
      for (let i = 0; i < list.length; i++) {
        if (list[i].skip && list[i].skip()) continue;
        const r = await step(E, list[i], i, list.length);
        if (r === 'quit') return { quit: true };
        grades.push(r.grade);
      }
      return { done: true, grades };
    } finally { close(); }
  }
  // a lesson: every item copied (echo), then (recall) each one said from a situation, in a new order
  async function lesson(o) {
    const items = o.items, rec = o.recall !== false, n = items.length * (rec ? 2 : 1), clean = {};
    const E = open(o);
    if (o.intro) bub(E, o.intro);
    try {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (i && it.say) bub(E, it.say);
        const r = await step(E, { kind: 'New · type it to learn it', big: it.de, gl: `“${esc(it.en)}”`, note: esc(it.note || ''), art: it.art, model: it.de, keys: it.keys, echo: true, voice: it.de }, i, n);
        if (r === 'quit') return { quit: true };
      }
      if (rec) {
        bub(E, o.recallLine || ['Super! Und jetzt ohne Hilfe.', 'Great! And now without help.']);
        const order = shuffle(items.map((_, i) => i));
        for (let k = 0; k < order.length; k++) {
          const it = items[order[k]];
          const r = await step(E, { kind: 'From memory · what do you say?', sit: esc(it.sit || it.en), art: it.artRecall, model: it.de, modelEn: it.en, keys: it.keys }, items.length + k, n);
          if (r === 'quit') return { quit: true };
          clean[it.id] = r.clean;
          bub(E, r.clean ? pick(PRAISE) : ['Gut! Das üben wir noch mal.', 'Good! We’ll practice that one again.']);
        }
      }
      if (o.outro) {
        bub(E, o.outro);
        E.kind.textContent = 'Done!'; E.big.classList.remove('hidden'); E.big.innerHTML = items.map(it => esc(it.de)).join(' · '); E.big.style.fontSize = '22px';
        [E.gl, E.sit, E.art, E.idk].forEach(x => x.classList.add('hidden')); E.note.classList.remove('hidden'); E.note.textContent = o.outroNote || 'They’re in your journal’s Phrasebook now.';
        E.hint.className = 'hint'; E.hint.textContent = 'Enter: carry on'; E.cd.classList.add('ok'); snd('chest'); E.input.value = ''; E.input.placeholder = '(Enter)'; E.input.disabled = false;
        if (!st.fast) await new Promise(res => { const go = () => { st.cur = null; E.quit = null; res(); }; E.form.onsubmit = e => { e.preventDefault(); go(); }; E.quit = go; st.cur = { model: '', submit: go, idk: go, hint() {} }; setTimeout(() => E.input.focus(), 40); });
        E.big.style.fontSize = '';
      }
      return { done: true, clean };
    } finally { close(); }
  }

  // ================================================================ the call bar (the stalls going up, the market night)
  const H = { el: null, q: null, res: null, keys: null };
  const hud = {
    open(title) {
      css();
      if (!H.el) {
        const el = document.createElement('div'); el.id = 'wmhud'; el.className = 'hidden';
        el.innerHTML = `<div class="lights"></div><div class="hd"></div><div class="cue"><canvas width="128" height="128"></canvas><div><div class="t"></div><div class="sub"></div></div></div><form autocomplete="off"><input spellcheck="false" autocomplete="off"><button type="submit" class="go">Say it!</button><button type="button" class="help">?</button></form><div class="fb"></div><div class="bar"><b></b></div>`;
        document.body.appendChild(el); H.el = el;
        const q = s => el.querySelector(s); H.q = { hd: q('.hd'), cv: q('canvas'), t: q('.t'), sub: q('.sub'), form: q('form'), input: q('input'), help: q('.help'), fb: q('.fb'), bar: q('.bar b') };
        H.q.form.addEventListener('submit', e => { e.preventDefault(); const r = H.res; if (r) { H.res = null; r(H.q.input.value); } });
        H.q.help.onclick = () => { if (st.hcur) st.hcur.idk(); H.q.input.focus(); };
      }
      H.q.hd.textContent = title || ''; H.el.classList.remove('hidden'); document.body.classList.add('wm-hud');
      if (H.keys) removeEventListener('keydown', H.keys, true);
      H.keys = e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); const r = H.res; if (r) { H.res = null; r('\u0000quit'); } }
        else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); if (st.hcur) st.hcur.hint(); }
      };
      addEventListener('keydown', H.keys, true);
      Input.typing = true; if (G) { G.state.teaching = true; G.prompt = null; }
    },
    close() {
      if (!H.el) return;
      H.el.classList.add('hidden'); document.body.classList.remove('wm-hud');
      if (H.keys) { removeEventListener('keydown', H.keys, true); H.keys = null; }
      Input.typing = false; if (G) G.state.teaching = false; st.hcur = null;
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    },
    fb(html, ok) { if (!H.q) return; H.q.fb.className = 'fb ' + (ok === undefined ? '' : ok ? 'ok' : 'no'); H.q.fb.innerHTML = html || ''; },
    cue(o) {
      const Q = H.q; Q.t.innerHTML = o.title || ''; Q.sub.innerHTML = o.sub || ''; Q.bar.style.width = Math.round((o.bar || 0) * 100) + '%';
      try { const c = Q.cv.getContext('2d'); c.clearRect(0, 0, 128, 128); if (o.draw) o.draw(c, 128); else if (o.icon && typeof ICONS !== 'undefined') ICONS.draw(Q.cv, o.icon); } catch (e) { /* */ }
    },
    // ask until it's said (or shown and said): → 'S'…'D', or 'quit' (Esc), or what a '\u0000…' interruption carried
    async call(o) {
      hud.cue(o); const Q = H.q; let tries = 0, shown = false, hints = 0;
      Q.input.value = ''; Q.input.placeholder = o.placeholder || 'say it in German…'; hud.fb(o.help || '');
      setTimeout(() => Q.input.focus(), 30);
      const showIt = () => { shown = true; hud.fb(`Say: <b>«${esc(o.model)}»</b>${o.modelEn ? ` <i>(${esc(o.modelEn)})</i>` : ''}`); sayDE(o.model); };
      st.hcur = { model: o.testAnswer || o.model, submit: v => { const r = H.res; if (r) { H.res = null; Q.input.value = v; r(v); } }, idk: showIt,
        hint() { if (shown) return; hints = Math.min(3, hints + 1); hud.fb(`<span style="letter-spacing:.06em;font-size:17px">${esc(hintOf(o.model, hints + 1))}</span>`); } };
      for (;;) {
        const text = await new Promise(r => { H.res = r; });
        if (text && text[0] === '\u0000') { st.hcur = null; return text.slice(1); }
        const t = String(text || '').trim(); if (!t) continue;
        if (idk(t)) { showIt(); Q.input.value = ''; continue; }
        let c; try { c = o.check ? (o.check(t) || {}) : (() => { const h = has(t, o.keys || [o.model]); return { ok: h.ok, minor: h.typo }; })(); } catch (e) { c = { ok: false }; }
        if (c.ok) {
          let g = shown ? 'D' : GR[Math.min(3, tries + Math.min(1, hints) + (c.minor ? 1 : 0))];
          if (c.grade) g = worse(g, c.grade);
          snd(g === 'S' ? 'perfect' : 'review'); hud.fb(`<span class="wm-gr ${g}">${g}</span>✓ ${esc(c.said || t)}${c.note ? ' · ' + c.note : ''}`, true);
          Q.input.value = ''; st.hcur = null; return g;
        }
        tries++; snd('wrong');
        if (tries >= 2 && !shown) { hud.fb((c.why ? c.why + ' ' : '') + `Try: <b>«${esc(o.model)}»</b>`, false); shown = true; sayDE(o.model); }
        else hud.fb(c.why || 'Not quite! (Tab: a hint · ?: show it)', false);
        Q.input.select();
      }
    },
    // interrupt a waiting call (e.g. a timer ran out): it returns what you pass
    poke(what) { const r = H.res; if (r) { H.res = null; r('\u0000' + what); } },
    get isOpen() { return !!(H.el && !H.el.classList.contains('hidden')); },
  };

  // ================================================================ pictures (canvases, drawn in the game's paper style)
  const INK = '#2b2235', PAPER = '#fffaf0';
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  const HAND = '"Segoe Print", "Comic Sans MS", "Bradley Hand", cursive';
  const shapePath = {
    star(c, x, y, r, n = 5, k = 0.45) { c.beginPath(); for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / n, q = i % 2 ? r * k : r; i ? c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : c.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); },
    heart(c, x, y, r) { const w = r * 2.1, h = r * 2, top = y - h * 0.48; c.beginPath(); c.moveTo(x, top + h * 0.3); c.bezierCurveTo(x, top, x - w / 2, top, x - w / 2, top + h * 0.3); c.bezierCurveTo(x - w / 2, top + h * 0.62, x, top + h * 0.78, x, top + h); c.bezierCurveTo(x, top + h * 0.78, x + w / 2, top + h * 0.62, x + w / 2, top + h * 0.3); c.bezierCurveTo(x + w / 2, top, x, top, x, top + h * 0.3); c.closePath(); },
    moon(c, x, y, r) { c.beginPath(); c.arc(x, y, r, Math.PI * 0.35, Math.PI * 1.65, false); c.arc(x + r * 0.55, y - r * 0.1, r * 0.82, Math.PI * 1.5, Math.PI * 0.5, true); c.closePath(); },
    tree(c, x, y, r) { c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.55, y - r * 0.15); c.lineTo(x + r * 0.3, y - r * 0.15); c.lineTo(x + r * 0.75, y + r * 0.6); c.lineTo(x + r * 0.12, y + r * 0.6); c.lineTo(x + r * 0.12, y + r); c.lineTo(x - r * 0.12, y + r); c.lineTo(x - r * 0.12, y + r * 0.6); c.lineTo(x - r * 0.75, y + r * 0.6); c.lineTo(x - r * 0.3, y - r * 0.15); c.lineTo(x - r * 0.55, y - r * 0.15); c.closePath(); },
  };
  const fillInk = (c, fill, lw = 2.2) => { if (fill) { c.fillStyle = fill; c.fill(); } c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); };
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function wrap(c, text, maxW) { const out = []; let line = ''; for (const w of String(text).split(/\s+/)) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
  // Mimo, round and cream with long ears, the teal gem on its forehead (look: { happy, flour, crumbs, hat })
  function mimo(c, x, y, s = 1, o = {}) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = c.lineCap = 'round';
    for (const k of [-1, 1]) { c.beginPath(); c.ellipse(k * 11, -44, 7, 20, k * 0.18, 0, TAU); fillInk(c, '#fbf1df', 2); c.beginPath(); c.ellipse(k * 11, -44, 3.5, 13, k * 0.18, 0, TAU); c.fillStyle = '#ff9b88'; c.fill(); }
    c.beginPath(); c.ellipse(0, -12, 26, 24, 0, 0, TAU); fillInk(c, '#fbf1df', 2.2);
    c.beginPath(); c.ellipse(0, -4, 14, 10, 0, 0, TAU); c.fillStyle = '#fffaf2'; c.fill();
    c.beginPath(); c.moveTo(0, -36); c.lineTo(4, -31); c.lineTo(0, -26); c.lineTo(-4, -31); c.closePath(); fillInk(c, '#2fd0c2', 1.4);
    for (const k of [-1, 1]) {
      if (o.happy) { c.beginPath(); c.arc(k * 9, -15, 4, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke(); }
      else { c.beginPath(); c.ellipse(k * 9, -15, 3, 4.2, 0, 0, TAU); c.fillStyle = INK; c.fill(); c.beginPath(); c.arc(k * 9 + 1, -16.5, 1.2, 0, TAU); c.fillStyle = '#fff'; c.fill(); }
      c.beginPath(); c.ellipse(k * 16, -8, 4.5, 2.6, 0, 0, TAU); c.fillStyle = 'rgba(255,140,150,.55)'; c.fill();
    }
    c.beginPath(); c.arc(0, -8, 3.4, 0.15, Math.PI - 0.15); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke();
    if (o.flour) { c.fillStyle = 'rgba(255,255,255,.95)'; [[-14, -22, 3], [12, -26, 2.4], [-4, -30, 2], [18, -12, 2.6]].forEach(([a, b, r]) => { c.beginPath(); c.arc(a, b, r, 0, TAU); c.fill(); }); }
    if (o.crumbs) { c.fillStyle = '#c98e5a'; [[-6, 0, 1.6], [5, 1, 1.4], [9, -3, 1.2]].forEach(([a, b, r]) => { c.beginPath(); c.arc(a, b, r, 0, TAU); c.fill(); }); }
    c.restore();
  }
  // a cookie in a shape: raw (pale), baked (golden), decorated (icing and sprinkles)
  function cookie(c, kind, x, y, r, look = 'baked') {
    const col = look === 'raw' ? '#f3dfb0' : look === 'hole' ? '#d9b97f' : '#e0a25a';
    (shapePath[kind] || shapePath.star)(c, x, y, r); fillInk(c, col, look === 'hole' ? 1.2 : 2);
    if (look === 'decorated') {
      (shapePath[kind] || shapePath.star)(c, x, y, r * 0.72); c.lineWidth = 2.6; c.strokeStyle = '#ffffff'; c.setLineDash([3, 3]); c.stroke(); c.setLineDash([]);
      ['#ff6a8a', '#7ee08f', '#7cc4ff', '#ffd23f'].forEach((sc, i) => { c.fillStyle = sc; c.fillRect(x - r * 0.3 + (i % 2) * r * 0.45, y - r * 0.15 + Math.floor(i / 2) * r * 0.35, 3, 3); });
    }
  }
  // ---------------- a gingerbread heart with a message piped on it in icing
  function heart(text, W = 260, o = {}) {
    const H0 = Math.round(W * 0.95), cv = mk(W, H0), c = cv.getContext('2d'); c.lineJoin = c.lineCap = 'round';
    const cx = W / 2, r = W * 0.42, cy = H0 * 0.55;
    c.beginPath(); c.moveTo(cx - 18, cy - r * 0.62); c.quadraticCurveTo(cx - 30, 6, cx, 10); c.quadraticCurveTo(cx + 30, 6, cx + 18, cy - r * 0.62); c.lineWidth = 6; c.strokeStyle = o.ribbon || '#d6332a'; c.stroke();
    shapePath.heart(c, cx, cy, r); fillInk(c, '#8a4f24', 3);
    shapePath.heart(c, cx, cy, r * 0.9); c.fillStyle = '#a8652f'; c.fill();
    shapePath.heart(c, cx, cy, r * 0.82); c.lineWidth = 5; c.strokeStyle = '#ffffff'; c.setLineDash([2, 9]); c.stroke(); c.setLineDash([]);
    for (const k of [-1, 1]) for (let i = 0; i < 3; i++) { const a = -0.5 + i * 0.55, px = cx + k * r * 0.5 + Math.cos(a) * 10 * k, py = cy - r * 0.45 + Math.sin(a) * 10; c.beginPath(); c.arc(px, py, 5, 0, TAU); c.fillStyle = ['#ff7aa2', '#7ee08f', '#ffd23f'][i]; c.fill(); }
    const msg = String(text || '').trim();
    if (msg) {
      let px = Math.round(W * 0.13); c.textAlign = 'center'; c.textBaseline = 'middle';
      let lines; for (;;) { c.font = `800 ${px}px ${HAND}`; lines = wrap(c, msg, r * 1.25); if ((lines.length <= 3 && lines.every(l => c.measureText(l).width <= r * 1.35)) || px <= 12) break; px -= 2; }
      const lh = px * 1.15, y0 = cy - (lines.length - 1) * lh / 2 - r * 0.02;
      lines.forEach((l, i) => { c.lineWidth = 4; c.strokeStyle = 'rgba(80,40,15,.55)'; c.strokeText(l, cx, y0 + i * lh); c.fillStyle = '#ffffff'; c.fillText(l, cx, y0 + i * lh); });
    }
    return cv;
  }
  // ---------------- a wish list on lined paper (entries: [text, who?])
  function wish(entries, W = 320, o = {}) {
    const H0 = Math.round(W * 1.12), cv = mk(W, H0), c = cv.getContext('2d');
    c.save(); c.translate(W / 2, H0 / 2); c.rotate(-0.025); c.translate(-W / 2, -H0 / 2);
    rrect(c, 12, 10, W - 24, H0 - 22, 6); fillInk(c, '#fffdf4', 2.4);
    c.strokeStyle = 'rgba(80,130,200,.35)'; c.lineWidth = 1.2; for (let y = 78; y < H0 - 20; y += 30) { c.beginPath(); c.moveTo(20, y); c.lineTo(W - 20, y); c.stroke(); }
    c.strokeStyle = 'rgba(220,60,60,.45)'; c.beginPath(); c.moveTo(46, 18); c.lineTo(46, H0 - 16); c.stroke();
    c.font = `800 ${Math.round(W * 0.068)}px ${HAND}`; c.fillStyle = '#c8322a'; c.textAlign = 'center'; c.fillText(o.title || 'Mein Wunschzettel', W / 2 + 4, 52);
    shapePath.star(c, W - 30, 28, 10); fillInk(c, '#ffd23f', 1.6);
    c.textAlign = 'left'; c.font = `700 ${Math.round(W * 0.052)}px ${HAND}`;
    let y = 72;
    for (const [t, who] of entries) {
      if (y > H0 - 30) break;
      c.fillStyle = who === 'mimo' ? '#1f8a7a' : '#2a4fa8';
      for (const l of wrap(c, (who === 'mimo' ? '🐾 ' : '– ') + t, W - 80)) { c.fillText(l, 54, y + 2); y += 30; }
    }
    c.restore();
    return cv;
  }
  // ---------------- the chalkboard with the stalls' prices (rows: [label, cents | null])
  function board(rows, W = 320, o = {}) {
    const H0 = 70 + rows.length * 34, cv = mk(W, H0), c = cv.getContext('2d');
    rrect(c, 4, 4, W - 8, H0 - 8, 10); fillInk(c, '#8b5a2b', 2.4);
    rrect(c, 16, 16, W - 32, H0 - 32, 6); c.fillStyle = '#1f2f28'; c.fill();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.font = `800 22px ${HAND}`; c.textAlign = 'center'; c.fillText(o.title || 'PREISE', W / 2, 46);
    c.font = `700 18px ${HAND}`;
    rows.forEach(([label, cents, hi], i) => {
      const y = 80 + i * 34; c.textAlign = 'left'; c.fillStyle = hi ? '#ffd23f' : 'rgba(255,255,255,.92)'; c.fillText(label, 30, y);
      c.textAlign = 'right'; c.fillText(cents == null ? '? €' : euro(cents), W - 30, y);
    });
    return cv;
  }
  // ---------------- the baking (chapter 2): one picture per stage of the recipe; st: { stage, shapes: ['star', …] }
  function kitchen(s, W = 460) {
    const H0 = 260, cv = mk(W, H0), c = cv.getContext('2d'); c.lineJoin = c.lineCap = 'round';
    c.fillStyle = '#fbe7c6'; c.fillRect(0, 0, W, H0);
    c.strokeStyle = 'rgba(160,110,60,.18)'; c.lineWidth = 1.2; for (let x = 0; x < W; x += 28) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 150); c.stroke(); } for (let y = 0; y < 150; y += 28) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.fillStyle = '#c98e5a'; c.fillRect(0, 150, W, 110); c.strokeStyle = 'rgba(90,50,20,.35)'; for (let y = 172; y < H0; y += 26) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.beginPath(); c.moveTo(0, 150); c.lineTo(W, 150); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    const st = s.stage || 'ingredients', shapes = s.shapes || [], mx = W - 62, my = 228;
    const bowl = (fill, swirl) => {
      if (fill) { c.beginPath(); c.ellipse(W / 2 - 40, 150, 62, 18, 0, Math.PI, TAU); fillInk(c, fill, 2); }
      if (swirl) { c.beginPath(); for (let a = 0; a < 9; a += 0.2) c.lineTo(W / 2 - 40 + Math.cos(a) * a * 5, 146 + Math.sin(a) * a * 1.4); c.lineWidth = 2.4; c.strokeStyle = swirl; c.stroke(); }
      c.beginPath(); c.moveTo(W / 2 - 108, 146); c.quadraticCurveTo(W / 2 - 104, 216, W / 2 - 40, 216); c.quadraticCurveTo(W / 2 + 24, 216, W / 2 + 28, 146); c.closePath(); fillInk(c, '#7cb6e0', 2.4);
      c.beginPath(); c.ellipse(W / 2 - 40, 146, 68, 9, 0, 0, TAU); fillInk(c, '#a8d4f0', 2);
    };
    const sack = (x, label, col) => { rrect(c, x, 96, 52, 62, 8); fillInk(c, col, 2.2); c.fillStyle = INK; c.font = '800 12px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.fillText(label, x + 26, 132); };
    if (st === 'ingredients' || st === 'mixed' || st === 'egg') {
      bowl(st === 'ingredients' ? null : '#f7ecd2', st === 'egg' ? '#f2c14e' : null);
      if (st === 'ingredients') { sack(18, 'MEHL', '#fdfaf2'); sack(78, 'ZUCKER', '#e8f0fb'); rrect(c, W / 2 + 46, 128, 50, 26, 4); fillInk(c, '#ffe58a', 2); c.fillStyle = INK; c.font = '800 11px Bahnschrift'; c.textAlign = 'center'; c.fillText('Butter', W / 2 + 71, 146); }
      if (st !== 'egg') { c.beginPath(); c.ellipse(W / 2 + 118, 140, 15, 19, 0.2, 0, TAU); fillInk(c, '#fbf6ee', 2.2); }
      else { for (const k of [-1, 1]) { c.beginPath(); c.arc(W / 2 + 118 + k * 18, 146, 12, 0, Math.PI); fillInk(c, '#fbf6ee', 2); } }
    } else if (st === 'dough') {
      c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 26; i++) { c.beginPath(); c.arc(70 + Math.sin(i * 7.1) * 90, 190 + Math.cos(i * 3.3) * 22, 2.2, 0, TAU); c.fill(); }
      c.beginPath(); c.ellipse(W / 2 - 30, 186, 64, 36, 0, 0, TAU); fillInk(c, '#f3dfb0', 2.6);
      c.beginPath(); c.arc(W / 2 - 46, 176, 12, 3.6, 5.6); c.lineWidth = 2; c.strokeStyle = 'rgba(150,110,50,.5)'; c.stroke();
    } else if (st === 'rolled' || st === 'cut') {
      rrect(c, 30, 166, 250, 74, 26); fillInk(c, '#f3dfb0', 2.6);
      if (st === 'rolled') { rrect(c, 296, 176, 120, 22, 11); fillInk(c, '#d9a35a', 2.2); for (const x of [286, 416]) { rrect(c, x, 181, 14, 12, 5); fillInk(c, '#a8673a', 1.8); } }
      shapes.forEach((k, i) => cookie(c, k, 58 + (i % 6) * 38, 186 + Math.floor(i / 6) * 34, 13, 'hole'));
      shapes.slice(0, 12).forEach((k, i) => cookie(c, k, 300 + (i % 3) * 28, 176 + Math.floor(i / 3) * 22, 10, 'raw'));
    } else if (st === 'tray' || st === 'baked' || st === 'decorated') {
      rrect(c, 40, 160, 300, 84, 8); fillInk(c, '#6f7480', 2.6); rrect(c, 50, 168, 280, 68, 5); c.fillStyle = '#8a909c'; c.fill();
      const list = shapes.length ? shapes : ['star', 'heart', 'moon'];
      for (let i = 0; i < 12; i++) cookie(c, list[i % list.length], 76 + (i % 6) * 46, 186 + Math.floor(i / 6) * 34, 13, st === 'tray' ? 'raw' : st);
    } else if (st === 'oven') {
      rrect(c, 70, 40, 240, 200, 16); fillInk(c, '#e8e3da', 2.8);
      rrect(c, 96, 90, 188, 120, 12); fillInk(c, '#3a2b2a', 2.4);
      const g = c.createRadialGradient(190, 160, 6, 190, 150, 100); g.addColorStop(0, 'rgba(255,190,80,.95)'); g.addColorStop(1, 'rgba(255,90,40,.25)'); rrect(c, 104, 98, 172, 104, 9); c.fillStyle = g; c.fill();
      for (let i = 0; i < 4; i++) cookie(c, (shapes[i % Math.max(1, shapes.length)] || 'star'), 130 + i * 40, 168, 12, 'raw');
      for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(120 + i * 70, 64, 9, 0, TAU); fillInk(c, '#2b2235', 1.6); }
      rrect(c, 330, 70, 104, 46, 10); fillInk(c, '#fffaf0', 2.2); c.fillStyle = '#c8322a'; c.font = '800 22px Bahnschrift'; c.textAlign = 'center'; c.fillText(s.timer || '10 Min.', 382, 101);
      c.fillStyle = INK; c.font = '800 15px Bahnschrift'; c.fillText('180 °C', 382, 140);
    } else if (st === 'taste') {
      c.beginPath(); c.ellipse(W / 2 - 40, 196, 120, 32, 0, 0, TAU); fillInk(c, '#fffaf0', 2.4);
      const list = shapes.length ? shapes : ['star', 'heart', 'moon'];
      for (let i = 0; i < 5; i++) cookie(c, list[i % list.length], W / 2 - 120 + i * 40, 190, 14, 'decorated');
    }
    if (st !== 'oven') mimo(c, mx, my, 1.15, { flour: st === 'dough' || st === 'rolled', happy: st === 'taste' || st === 'decorated' || st === 'baked', crumbs: st === 'taste' });
    return cv;
  }
  // ---------------- boots (chapter 3): 'dirty' | 'clean' | 'door' | 'filled'
  function boots(stage, W = 380) {
    const H0 = 240, cv = mk(W, H0), c = cv.getContext('2d'); c.lineJoin = c.lineCap = 'round';
    if (stage === 'door' || stage === 'filled') {
      c.fillStyle = '#f3e1c4'; c.fillRect(0, 0, W, H0);
      rrect(c, W / 2 - 70, 6, 140, 200, 8); fillInk(c, '#8d5733', 2.6); c.beginPath(); c.arc(W / 2 + 46, 116, 6, 0, TAU); fillInk(c, '#e8c35a', 1.6);
      c.fillStyle = '#b07a48'; c.fillRect(0, 200, W, 40); rrect(c, W / 2 - 96, 196, 192, 16, 4); fillInk(c, '#9a6a3a', 2);
    } else { c.fillStyle = '#e8eef4'; c.fillRect(0, 0, W, H0); c.fillStyle = '#c9d4de'; c.fillRect(0, 196, W, 44); }
    const boot = (x, flip) => {
      c.save(); c.translate(x, 200); if (flip) c.scale(-1, 1);
      c.beginPath(); c.moveTo(-22, -110); c.lineTo(18, -110); c.lineTo(20, -36); c.quadraticCurveTo(58, -30, 60, -8); c.lineTo(60, 0); c.lineTo(-24, 0); c.closePath(); fillInk(c, '#d6332a', 2.6);
      c.fillStyle = '#2b2235'; c.fillRect(-24, -8, 84, 8);
      rrect(c, -26, -118, 48, 14, 5); fillInk(c, '#b8232a', 2);
      if (stage === 'dirty') { c.fillStyle = 'rgba(110,70,40,.85)'; [[-8, -50, 10], [26, -20, 9], [6, -82, 7], [44, -14, 6], [-14, -22, 8]].forEach(([a, b, r]) => { c.beginPath(); c.arc(a, b, r, 0, TAU); c.fill(); }); }
      else { c.beginPath(); c.moveTo(-12, -96); c.lineTo(-12, -60); c.lineWidth = 5; c.strokeStyle = 'rgba(255,255,255,.6)'; c.stroke(); }
      c.restore();
    };
    boot(W / 2 - 58, false); boot(W / 2 + 58, true);
    if (stage === 'filled') {
      const tops = [[W / 2 - 64, 82], [W / 2 + 64, 82]];
      for (const [x, y] of tops) {
        c.beginPath(); c.arc(x - 8, y, 12, 0, TAU); fillInk(c, '#f28a1e', 2); c.beginPath(); c.arc(x - 8, y - 12, 3, 0, TAU); c.fillStyle = '#3f8a3c'; c.fill();
        c.beginPath(); c.ellipse(x + 10, y + 2, 8, 6, 0.3, 0, TAU); fillInk(c, '#a8673a', 1.8);
        rrect(c, x + 2, y - 30, 16, 26, 5); fillInk(c, '#c8322a', 1.8); c.beginPath(); c.arc(x + 10, y - 33, 6, 0, TAU); fillInk(c, '#f5cda2', 1.6);
      }
      shapePath.heart(c, W / 2 + 70, 66, 13); fillInk(c, '#8a4f24', 2);
    }
    if (stage !== 'dirty') { // Mimo's little sock beside them
      c.save(); c.translate(W / 2 + 148, 200); c.beginPath(); c.moveTo(-10, -50); c.lineTo(8, -50); c.lineTo(8, -14); c.quadraticCurveTo(22, -12, 22, 0); c.lineTo(-10, 0); c.closePath(); fillInk(c, '#7ee08f', 2);
      c.fillStyle = '#fffaf0'; c.fillRect(-10, -50, 18, 8); c.restore();
      if (stage === 'filled') { cookie(c, 'star', W / 2 + 148, 140, 10, 'decorated'); }
    }
    if (stage === 'clean') for (let i = 0; i < 6; i++) { shapePath.star(c, 40 + i * 60, 30 + (i % 2) * 24, 7, 4, 0.35); fillInk(c, '#fff3a0', 1.2); }
    return cv;
  }
  // ---------------- Fiete's handmade Adventskalender: 24 doors, shuffled (cal: { open: n, ready: bool, pics: [icon per door] })
  const DOOR_ORDER = [17, 3, 21, 9, 14, 6, 1, 23, 11, 19, 4, 15, 8, 22, 12, 2, 18, 7, 24, 10, 5, 16, 13, 20];
  function calendar(cal, W = 360) {
    const H0 = Math.round(W * 0.86), cv = mk(W, H0), c = cv.getContext('2d'); c.lineJoin = c.lineCap = 'round';
    rrect(c, 4, 4, W - 8, H0 - 8, 14); fillInk(c, '#e9d3a8', 2.6);
    rrect(c, 12, 12, W - 24, H0 - 24, 10); c.lineWidth = 5; c.strokeStyle = '#c8322a'; c.setLineDash([10, 6]); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#1f6d46'; c.font = `800 ${Math.round(W * 0.06)}px ${HAND}`; c.textAlign = 'center'; c.fillText('Fietes Adventskalender', W / 2, 44);
    const cols = 6, rows = 4, gw = (W - 44) / cols, gh = (H0 - 72) / rows, n = (cal && cal.open) || 0;
    DOOR_ORDER.forEach((d, i) => {
      const x = 22 + (i % cols) * gw, y = 56 + Math.floor(i / cols) * gh, w = gw - 8, h = gh - 8;
      const opened = d <= n, ready = cal && cal.ready && d === n + 1;
      rrect(c, x, y, w, h, 6);
      if (opened) { fillInk(c, '#fffaf0', 2); const ic = cal.pics && cal.pics[d - 1]; if (ic && typeof ICONS !== 'undefined') { try { c.drawImage(ICONS.canvas(ic, 96), x + w / 2 - h * 0.42, y + h * 0.08, h * 0.84, h * 0.84); } catch (e) { /* */ } } }
      else { fillInk(c, ['#c8322a', '#1f6d46', '#2f5fa8', '#d9a03a'][d % 4], 2); c.fillStyle = '#fffaf0'; c.font = `800 ${Math.round(h * 0.42)}px Bahnschrift, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(d), x + w / 2, y + h / 2 + 1); c.textBaseline = 'alphabetic'; }
      if (ready) { rrect(c, x - 3, y - 3, w + 6, h + 6, 8); c.lineWidth = 4; c.strokeStyle = '#ffd23f'; c.stroke(); }
    });
    return cv;
  }
  // a door's picture, big (for the task card)
  const doorPic = (icon, n) => { const cv = mk(170, 150), c = cv.getContext('2d'); rrect(c, 6, 6, 158, 138, 12); fillInk(c, '#fffaf0', 2.6); try { c.drawImage(ICONS.canvas(icon || 'star', 110), 30, 14, 110, 110); } catch (e) { /* */ } c.fillStyle = '#c8322a'; c.font = '800 20px Bahnschrift'; c.textAlign = 'right'; c.fillText(String(n), 154, 136); return cv; };
  const icon = (key, size = 120) => { try { return ICONS.canvas(key, size); } catch (e) { return mk(size, size); } };
  const row = (...cvs) => el => { el.innerHTML = ''; cvs.forEach(cv => { if (cv) el.appendChild(cv); }); };

  // ================================================================ paper-cutout icons (the market's things, Fiete, Marta)
  (function icons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const add = (k, f) => { if (!ICONS.keys.includes(k)) ICONS.add(k, f); };
    add('wmKid', (c, p, h) => {
      h.shape(c, p, h.ell(0, 10, 26, 26), '#f5cda2');
      h.shape(c, p, cc => { cc.moveTo(-27, -2); cc.bezierCurveTo(-30, -42, 30, -42, 27, -2); cc.closePath(); }, '#d6332a');
      h.shape(c, p, h.rr(-29, -8, 58, 11, 5), '#fffaf0'); h.shape(c, p, h.ell(0, -40, 10, 10), '#fffaf0');
      h.shape(c, p, h.rr(-22, 32, 44, 9, 4), '#e8b23a');
      if (!p) return;
      [-14, 0, 14].forEach(x => { c.beginPath(); c.moveTo(x - 5, -26); c.lineTo(x, -18); c.lineTo(x + 5, -26); c.lineWidth = 2; c.strokeStyle = 'rgba(255,250,240,.8)'; c.stroke(); });
      h.eyes(c, -9, 9, 9, 0.95); [[-15, 18], [-11, 21], [11, 21], [15, 18]].forEach(([x, y]) => h.dot(c, x, y, 1.4, '#b06a3a'));
      h.dot(c, -17, 15, 4.5, 'rgba(255,130,140,.5)'); h.dot(c, 17, 15, 4.5, 'rgba(255,130,140,.5)');
      c.beginPath(); c.arc(0, 19, 7, 0.15, Math.PI - 0.15); c.lineWidth = 2.2; c.strokeStyle = h.INK; c.stroke();
    });
    add('wmMarta', (c, p, h) => {
      h.shape(c, p, h.ell(0, 10, 25, 26), '#e6b48c');
      h.shape(c, p, cc => { cc.moveTo(-26, 6); cc.quadraticCurveTo(-30, -14, -20, -16); cc.lineTo(20, -16); cc.quadraticCurveTo(30, -14, 26, 6); cc.lineTo(20, -4); cc.lineTo(-20, -4); cc.closePath(); }, '#3a2b26');
      h.shape(c, p, h.rr(-20, -24, 40, 12, 3), '#ffffff');
      h.shape(c, p, cc => { cc.arc(-12, -32, 12, 0, TAU); }, '#ffffff'); h.shape(c, p, cc => { cc.arc(12, -32, 12, 0, TAU); }, '#ffffff'); h.shape(c, p, cc => { cc.arc(0, -40, 13, 0, TAU); }, '#ffffff');
      if (!p) return;
      h.eyes(c, -9, 9, 8, 0.9); h.dot(c, -16, 16, 4.5, 'rgba(255,130,140,.45)'); h.dot(c, 16, 16, 4.5, 'rgba(255,130,140,.45)');
      c.beginPath(); c.arc(0, 18, 8, 0.15, Math.PI - 0.15); c.lineWidth = 2.2; c.strokeStyle = h.INK; c.stroke();
    });
    add('wmMandeln', (c, p, h) => {
      h.shape(c, p, h.poly([[-26, -14], [26, -14], [0, 38]]), '#fdf6e6');
      [[-14, -18], [0, -22], [14, -18], [-7, -30], [8, -31], [0, -38]].forEach(([x, y], i) => h.shape(c, p, h.ell(x, y, 8, 5.5, i * 0.7), '#b5652e'));
      if (p) { c.beginPath(); c.moveTo(-18, 2); c.lineTo(18, 2); c.lineWidth = 3; c.strokeStyle = '#d6332a'; c.stroke(); [[-14, -20], [0, -24], [8, -33]].forEach(([x, y]) => h.dot(c, x, y, 1.6, 'rgba(255,255,255,.7)')); }
    });
    add('wmHerz', (c, p, h) => {
      if (p) { c.beginPath(); c.moveTo(-8, -26); c.quadraticCurveTo(0, -46, 8, -26); c.lineWidth = 3; c.strokeStyle = '#d6332a'; c.stroke(); }
      h.shape(c, p, cc => { cc.moveTo(0, -18); cc.bezierCurveTo(0, -34, -32, -34, -32, -12); cc.bezierCurveTo(-32, 6, -8, 18, 0, 32); cc.bezierCurveTo(8, 18, 32, 6, 32, -12); cc.bezierCurveTo(32, -34, 0, -34, 0, -18); cc.closePath(); }, '#9a5a2a');
      if (p) { c.save(); c.scale(0.78, 0.78); c.beginPath(); c.moveTo(0, -16); c.bezierCurveTo(0, -32, -32, -32, -32, -11); c.bezierCurveTo(-32, 6, -8, 18, 0, 31); c.bezierCurveTo(8, 18, 32, 6, 32, -11); c.bezierCurveTo(32, -32, 0, -32, 0, -16); c.lineWidth = 3; c.strokeStyle = '#fff'; c.setLineDash([2, 5]); c.stroke(); c.setLineDash([]); c.restore(); h.dot(c, -12, -12, 3.2, '#ff7aa2'); h.dot(c, 12, -12, 3.2, '#7ee08f'); h.dot(c, 0, 4, 3.2, '#ffd23f'); }
    });
    add('wmPunsch', (c, p, h) => {
      h.shape(c, p, h.rr(-22, -14, 40, 44, 7), '#c8322a'); h.shape(c, p, cc => { cc.arc(20, 6, 11, -1.4, 1.4); }, null, 4);
      h.shape(c, p, h.ell(-2, -14, 20, 5), '#8f1d2c');
      h.shape(c, p, h.ell(12, -16, 9, 9), '#f28a1e');
      if (p) { h.dot(c, 12, -16, 4.5, '#ffd28a'); [-10, 2].forEach(x => { c.beginPath(); c.moveTo(x, -24); c.quadraticCurveTo(x - 6, -32, x, -42); c.lineWidth = 2.2; c.strokeStyle = 'rgba(43,34,53,.45)'; c.stroke(); }); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-12 + i * 10, 10, 2.4, 0, TAU); c.fillStyle = '#fffaf0'; c.fill(); } }
    });
    add('wmWurst', (c, p, h) => {
      h.shape(c, p, h.rr(-38, -6, 76, 14, 7), '#b5532e');
      h.shape(c, p, cc => { cc.moveTo(-26, 0); cc.bezierCurveTo(-26, 24, 26, 24, 26, 0); cc.closePath(); }, '#e2b06a');
      h.shape(c, p, cc => { cc.moveTo(-26, 0); cc.bezierCurveTo(-24, -14, 24, -14, 26, 0); cc.closePath(); }, '#e9bd78');
      if (p) { c.beginPath(); for (let i = 0; i < 7; i++) c.lineTo(-30 + i * 10, -2 + (i % 2) * 5); c.lineWidth = 3; c.strokeStyle = '#f2c41e'; c.stroke(); }
    });
    add('wmReibe', (c, p, h) => {
      h.shape(c, p, h.ell(0, 14, 38, 14), '#fffaf0');
      [[-12, 6], [12, 4], [0, -6]].forEach(([x, y]) => h.shape(c, p, h.ell(x, y, 17, 11), '#e3a440'));
      h.shape(c, p, h.ell(20, -14, 10, 7), '#f3e1b0');
      if (p) [[-16, 4], [8, 2], [-2, -8]].forEach(([x, y]) => h.dot(c, x, y, 2, '#b8762a'));
    });
    add('wmCrepe', (c, p, h) => {
      h.shape(c, p, h.poly([[-24, -22], [24, -22], [0, 34]]), '#f1c97a');
      h.shape(c, p, h.poly([[-16, 6], [16, 6], [0, 34]]), '#fffaf0');
      if (p) { c.beginPath(); for (let i = 0; i < 6; i++) c.lineTo(-18 + i * 7, -16 + (i % 2) * 8); c.lineWidth = 3.4; c.strokeStyle = '#5a3420'; c.stroke(); }
    });
    add('wmPyramide', (c, p, h) => {
      h.shape(c, p, h.rr(-26, 20, 52, 8, 3), '#c98e5a'); h.shape(c, p, h.rr(-20, 2, 40, 6, 3), '#c98e5a'); h.shape(c, p, h.rr(-14, -14, 28, 6, 3), '#c98e5a');
      h.shape(c, p, h.rr(-2, -30, 4, 52, 2), '#8a5f3e');
      h.shape(c, p, h.poly([[-28, -36], [0, -32], [28, -36], [0, -28]]), '#e8c35a');
      if (p) { [-22, -10, 10, 22].forEach(x => { c.fillStyle = '#fffaf0'; c.fillRect(x - 2, 10, 4, 10); h.dot(c, x, 7, 2.6, '#ffb23f'); }); [[-12, -2], [10, -2], [-7, -18], [7, -18]].forEach(([x, y]) => h.dot(c, x, y, 3.4, '#3f8a3c')); }
    });
    add('wmBoot', (c, p, h) => {
      h.shape(c, p, cc => { cc.moveTo(-18, -30); cc.lineTo(10, -30); cc.lineTo(12, 8); cc.quadraticCurveTo(34, 10, 34, 24); cc.lineTo(-18, 24); cc.closePath(); }, '#d6332a');
      h.shape(c, p, h.ell(-6, -32, 10, 9), '#f28a1e'); h.shape(c, p, h.rr(4, -44, 10, 16, 3), '#8a4f24');
    });
    add('wmCookie', (c, p, h) => { h.shape(c, p, cc => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 32; i ? cc.lineTo(Math.cos(a) * r, Math.sin(a) * r) : cc.moveTo(Math.cos(a) * r, Math.sin(a) * r); } cc.closePath(); }, '#e0a25a'); if (p) { h.dot(c, 0, 0, 5, '#fff'); h.dot(c, -9, -6, 2.4, '#ff7aa2'); h.dot(c, 9, -6, 2.4, '#7cc4ff'); h.dot(c, 0, 9, 2.4, '#7ee08f'); } });
    add('wmGift', (c, p, h) => { h.shape(c, p, h.rr(-26, -14, 52, 42, 4), '#2f7fc9'); h.shape(c, p, h.rr(-29, -22, 58, 12, 3), '#3f8fd9'); h.shape(c, p, h.rr(-5, -22, 10, 50, 2), '#ffd23f'); h.shape(c, p, h.ell(-10, -28, 10, 7, 0.4), '#ffd23f'); h.shape(c, p, h.ell(10, -28, 10, 7, -0.4), '#ffd23f'); });
    add('wmCandle', (c, p, h) => { h.shape(c, p, h.rr(-10, -10, 20, 42, 4), '#c8322a'); h.shape(c, p, cc => { cc.moveTo(0, -36); cc.quadraticCurveTo(10, -22, 0, -14); cc.quadraticCurveTo(-10, -22, 0, -36); cc.closePath(); }, '#ffb23f'); if (p) h.dot(c, 0, -20, 3, '#fff3a0'); });
    add('wmSnowman', (c, p, h) => { h.shape(c, p, h.ell(0, 16, 22, 20), '#ffffff'); h.shape(c, p, h.ell(0, -14, 15, 14), '#ffffff'); h.shape(c, p, h.rr(-12, -40, 24, 14, 2), '#2b2235'); if (p) { h.eyes(c, -5, 5, -16, 0.6); c.beginPath(); c.moveTo(0, -12); c.lineTo(12, -9); c.lineTo(0, -8); c.closePath(); c.fillStyle = '#f28a1e'; c.fill(); [6, 16, 26].forEach(y => h.dot(c, 0, y, 2.4, h.INK)); } });
    add('wmNut', (c, p, h) => { h.shape(c, p, h.rr(-14, -2, 28, 34, 4), '#c8322a'); h.shape(c, p, h.ell(0, -12, 14, 13), '#f3d2a8'); h.shape(c, p, h.rr(-14, -42, 28, 20, 3), '#2b2235'); h.shape(c, p, h.rr(-12, -6, 24, 10, 3), '#fffaf0'); if (p) { h.eyes(c, -5, 5, -15, 0.55); c.fillStyle = '#e8c35a'; c.fillRect(-14, 10, 28, 4); c.beginPath(); c.moveTo(-6, -2); c.lineTo(6, -2); c.lineWidth = 2.4; c.strokeStyle = h.INK; c.stroke(); } });
    add('wmScarf', (c, p, h) => { h.shape(c, p, h.rr(-30, -18, 60, 18, 8), '#c8322a'); h.shape(c, p, h.rr(10, -6, 16, 40, 5), '#c8322a'); if (p) [-20, -6, 8].forEach(x => { c.fillStyle = '#fffaf0'; c.fillRect(x, -18, 5, 18); }); });
    add('wmMug', (c, p, h) => { h.shape(c, p, h.rr(-22, -20, 38, 46, 7), '#3f8fd9'); h.shape(c, p, cc => { cc.arc(18, 2, 11, -1.4, 1.4); }, null, 4); if (p) { h.dot(c, -4, 2, 7, '#fffaf0'); h.dot(c, -4, 2, 3, '#c8322a'); } });
    add('wmBook', (c, p, h) => { h.shape(c, p, h.rr(-26, -26, 50, 54, 4), '#1f6d46'); h.shape(c, p, h.rr(-26, -26, 9, 54, 3), '#14502f'); if (p) { c.fillStyle = '#ffd23f'; c.fillRect(-10, -12, 26, 5); c.fillRect(-10, -2, 18, 4); } });
    add('wmBall', (c, p, h) => { h.shape(c, p, h.ell(0, 2, 28, 28), '#fffaf0'); if (p) { h.shape(c, 1, h.poly([[0, -8], [9, -2], [6, 9], [-6, 9], [-9, -2]]), '#2b2235', 1.6); [[0, -24], [22, -6], [14, 20], [-14, 20], [-22, -6]].forEach(([x, y]) => h.dot(c, x * 0.95, y * 0.95 + 2, 4, '#2b2235')); } });
    add('wmPuzzle', (c, p, h) => { h.shape(c, p, cc => { cc.moveTo(-24, -24); cc.lineTo(-6, -24); cc.arc(0, -24, 6, Math.PI, 0); cc.lineTo(24, -24); cc.lineTo(24, -6); cc.arc(24, 0, 6, -Math.PI / 2, Math.PI / 2); cc.lineTo(24, 24); cc.lineTo(-24, 24); cc.closePath(); }, '#d9a03a'); if (p) { c.beginPath(); c.moveTo(-24, 0); c.lineTo(10, 0); c.moveTo(0, 0); c.lineTo(0, 24); c.lineWidth = 1.6; c.strokeStyle = h.INK; c.stroke(); } });
    add('wmMuetze', (c, p, h) => { h.shape(c, p, cc => { cc.moveTo(-26, 10); cc.bezierCurveTo(-28, -30, 28, -30, 26, 10); cc.closePath(); }, '#d6332a'); h.shape(c, p, h.rr(-28, 4, 56, 12, 5), '#fffaf0'); h.shape(c, p, h.ell(0, -28, 10, 10), '#fffaf0'); });
    add('wmStille', (c, p, h) => { [[-14, 4, 16], [10, 0, 18], [0, -12, 16], [-2, 12, 18]].forEach(([x, y, r]) => h.shape(c, p, h.ell(x, y, r, r * 0.85), '#9d98ab')); h.shape(c, p, h.poly([[-18, -16], [14, -26], [26, -40]]), '#b4afbf'); if (p) { h.dot(c, 26, -40, 5, '#d8d4e0'); h.dot(c, -8, 0, 4, '#eef0ff'); h.dot(c, 8, 0, 4, '#eef0ff'); } });
  })();

  // ================================================================ tests: play on through a scene (the game never calls this)
  // Lines (E), menus (o.choose: a number, or a function of the menu's text → which button), cards and the bar (the model,
  // or o.answer(cur) → what to type), typed questions (UI.command: o.say(title) or its model). Stops when no scene runs,
  // or after o.sec seconds.
  async function drive(o = {}) {
    const g = window.__g, log = [], t0 = performance.now(), $q = s => document.querySelector(s);
    while (performance.now() - t0 < (o.sec || 25) * 1000) {
      if (st.cur) { const a = (o.answer && o.answer(st.cur, 'card')) || st.cur.model || ''; log.push('card: ' + a); st.cur.submit(a); await g.go(0.05); continue; }
      if (st.hcur && H.res) { const a = (o.answer && o.answer(st.hcur, 'bar')) || st.hcur.model || ''; log.push('bar: ' + a); st.hcur.submit(a); await g.go(0.05); continue; }
      const ch = $q('#choose:not(.hidden)');
      if (ch) { const bs = [...ch.querySelectorAll('button')], txt = ch.textContent; const i = typeof o.choose === 'function' ? o.choose(txt, bs.map(b => b.textContent)) : (o.choose || 0); log.push('choose: ' + (bs[i] ? bs[i].textContent.slice(0, 44) : '?')); (bs[i] || bs[0]).click(); await g.go(0.1); continue; }
      const cmd = $q('#command:not(.hidden)');
      if (cmd) { const title = ($q('#command-title') || {}).textContent || '', inp = $q('#command-input'); const ans = (o.say && o.say(title)) || (inp && inp.dataset.model) || ''; log.push('say: ' + title.slice(0, 40) + ' → ' + ans); if (inp) { inp.value = ans; $q('#command-form').requestSubmit(); } await g.go(0.1); continue; }
      const card = $q('#card:not(.hidden)');
      if (card && card.textContent.trim()) { log.push('ui-card'); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true, cancelable: true })); await g.go(0.1); await new Promise(r => setTimeout(r, 120)); continue; }
      if (typeof STORY !== 'undefined' && STORY.line) { log.push((STORY.line.name || STORY.line.who || '') + ': ' + String(STORY.line.text || (STORY.line.parts || []).map(p => p.s).join('')).slice(0, 50)); if (STORY.line.full) await g.press(); else await g.go(0.25); continue; }
      if (typeof STORY !== 'undefined' && !STORY.busy && !OV.open && !(o.busy && o.busy())) break;
      await g.go(o.step || 0.15); await null;
    }
    return log;
  }

  return { bind, esc, canon, toks, has, word, idk, hintOf, sayDE, num, numWords, price, euro, euroWords, lev, pick, shuffle, GR, worse, wait, PRAISE,
    lesson, steps, hud, close, css, drive,
    art: { mk, heart, wish, board, kitchen, boots, calendar, doorPic, icon, row, mimo, cookie, shapePath, rrect, fillInk, HAND, DOOR_ORDER },
    get cur() { return st.cur; }, get hcur() { return st.hcur; }, get fast() { return st.fast; }, set fast(v) { st.fast = !!v; }, get isOpen() { return OV.open; } };
})();
