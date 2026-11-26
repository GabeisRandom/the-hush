'use strict';
// TALKUI: the conversation panel for free talk (talk.js; DESIGN.md 15.3). A paper card on the right (the whole screen on a
// small window): the person's portrait and name, the conversation so far, what to answer (in English), help, and a box to type
// in (the in-game IME in zh / ja character mode). Their lines mixed by the weave (js/talk/mix.js), with 🔊; the English only on
// request (DESIGN.md 17.3: EN in the header for every line, or tap a line for its own), never under a line by default;
// your lines with their grade chip (S gold, A teal, B blue, C purple, D gray, like «Prosa»); after a mistake, Mimo says your
// sentence right, with the changed words in red, and each mistake's one-line tip. Esc leaves.
//   TALKUI.open(header) → the view TALK drives: npc(line) · you(text) → { grade(g), miss() } · mimo({ diff, tips, model }) ·
//     input(task) → { text, help } | null · model(line) · sys(text) · end(summary) · close() · submit(text) · help() · quit()
//   TALKUI.face(canvas, look, mood) draws a portrait in the game's paper style (also used by the phone and the journal)
//   TALKUI.mimoFace(canvas) · TALKUI.speak(text) → false when there's no voice for the language
// Needs core.js (esc, norm), lexicon.js (LEX.lang, LEX.weave), cjk.js (zh / ja), audio.js (Sound.say); UI and Input at run time.

const TALKUI = (() => {
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK(L());
  const E = s => (typeof esc === 'function' ? esc(s) : String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
  const T = () => (typeof TALK !== 'undefined' ? TALK._.T : { fast: true });
  const wait = ms => (T().fast || !ms ? Promise.resolve() : new Promise(r => setTimeout(r, ms)));
  const LANGNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  // a line in the language as HTML: ruby in zh / ja (CJK.html, which also counts the characters as read)
  const textHTML = t => (isC() ? CJK.html(t, { lang: L() }) : E(t));
  const plain = t => (isC() ? CJK.plain(t, { lang: L() }) : String(t || ''));
  function speak(t) {
    try {
      if (isC()) return CJK.say(t, L());
      return typeof Sound !== 'undefined' && Sound.say ? Sound.say(String(t).replace(/[«»"“”]/g, ''), L()) : false;
    } catch (e) { return false; }
  }
  let voiceNoted = false;
  const sayOrNote = t => { const ok = speak(t); if (!ok && !voiceNoted) { voiceNoted = true; try { UI.toast(`No ${LANGNAME[L()] || ''} voice on this computer: the words are all on screen.`); } catch (e) { /* */ } } return ok; };

  // ============================================================ portraits: flat paper cutouts with an ink line (the game's style)
  const INK = '#2b2235';
  function face(cv, look, mood) {
    if (!cv || !cv.getContext) return;
    const c = cv.getContext('2d'), W = cv.width, s = W / 112;
    const P = Object.assign({ skin: '#efc29a', hair: '#4a2f27', dress: '#8a4f7d' }, look || {});
    c.clearRect(0, 0, W, cv.height); c.save(); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
    const shape = (fill, draw, lw = 3.2) => { c.beginPath(); draw(); if (fill) { c.fillStyle = fill; c.fill(); } c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); };
    const ell = (x, y, rx, ry, rot = 0, a0 = 0, a1 = Math.PI * 2) => c.ellipse(x, y, rx, ry, rot, a0, a1);
    // the disc behind, then the shoulders (their clothes) and the neck
    c.save(); c.beginPath(); c.arc(56, 56, 54, 0, Math.PI * 2); c.fillStyle = P.bg || '#ffe9c2'; c.fill(); c.clip();
    shape(P.dress, () => ell(56, 122, 46, 34));
    if (P.apron) shape(P.apron, () => { c.moveTo(38, 112); c.quadraticCurveTo(56, 100, 74, 112); c.lineTo(72, 130); c.lineTo(40, 130); c.closePath(); }, 2.4);
    shape(P.skin, () => c.rect(49, 76, 14, 14), 2.6);
    c.restore();
    const kid = !!P.kid, hy = kid ? 58 : 54, hr = kid ? 27 : 29;
    const hairdo = P.hairdo || (P.bun ? 'bun' : '');
    // hair behind the head (long hair, pony, pigtails, a bun)
    if (hairdo === 'long') shape(P.hair, () => { c.moveTo(56 - hr - 3, hy - 4); c.quadraticCurveTo(56 - hr - 8, hy + 30, 56 - hr + 2, hy + 36); c.lineTo(56 + hr - 2, hy + 36); c.quadraticCurveTo(56 + hr + 8, hy + 30, 56 + hr + 3, hy - 4); c.closePath(); });
    if (hairdo === 'pigtails') [-1, 1].forEach(k => shape(P.hair, () => ell(56 + k * (hr + 6), hy + 8, 8, 12, k * 0.3)));
    if (hairdo === 'pony') shape(P.hair, () => ell(56 + hr + 2, hy + 6, 7, 14, -0.4));
    if (hairdo === 'bun') shape(P.hair, () => c.arc(56, hy - hr - 2, 10, 0, Math.PI * 2));
    // the head and ears
    [-1, 1].forEach(k => shape(P.skin, () => ell(56 + k * hr, hy + 3, 5, 7), 2.6));
    shape(P.skin, () => ell(56, hy, hr, hr + 1));
    // the hair on top (none for the bald, but a fringe at the sides)
    if (hairdo === 'bald') [-1, 1].forEach(k => shape(P.hair, () => ell(56 + k * (hr - 3), hy - 4, 5, 9, k * 0.2), 2.4));
    else shape(P.hair, () => { c.moveTo(56 - hr - 1, hy + 2); c.bezierCurveTo(56 - hr, hy - hr - 10, 56 + hr, hy - hr - 10, 56 + hr + 1, hy + 2); c.quadraticCurveTo(56 + 10, hy - 14, 56 - 4, hy - 12); c.quadraticCurveTo(56 - 16, hy - 10, 56 - hr - 1, hy + 2); c.closePath(); });
    // the face: eyes (happy: closed arcs), blush, mouth by mood
    const happy = mood === 'happy' || (P.eyes === 'happy' && mood !== 'sad' && mood !== 'surprised');
    c.lineWidth = 3; c.strokeStyle = INK; c.fillStyle = INK;
    [-1, 1].forEach(k => { const ex = 56 + k * 11, ey = hy + 2; c.beginPath(); if (happy) { c.arc(ex, ey + 2, 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } else if (mood === 'surprised') { c.arc(ex, ey, 4.2, 0, Math.PI * 2); c.fill(); } else { ell(ex, ey, 3.2, 4.4); c.fill(); } });
    c.fillStyle = 'rgba(255,120,120,.45)'; [-1, 1].forEach(k => { c.beginPath(); ell(56 + k * 18, hy + 11, 6, 3.6); c.fill(); });
    c.beginPath(); c.lineWidth = 2.8;
    if (mood === 'sad') c.arc(56, hy + 22, 7, Math.PI * 1.15, Math.PI * 1.85);
    else if (mood === 'surprised') { c.fillStyle = INK; ell(56, hy + 17, 3.6, 4.6); c.fill(); }
    else c.arc(56, hy + 11, 8, Math.PI * 0.18, Math.PI * 0.82);
    c.stroke();
    if (P.stache) shape(P.hair, () => { ell(50, hy + 13, 7, 3.2, 0.2); ell(62, hy + 13, 7, 3.2, -0.2); }, 2.2);
    if (P.beard) shape(P.hair, () => { c.moveTo(56 - hr + 4, hy + 8); c.quadraticCurveTo(56, hy + hr + 16, 56 + hr - 4, hy + 8); c.quadraticCurveTo(56, hy + 22, 56 - hr + 4, hy + 8); c.closePath(); }, 2.4);
    if (P.glasses) { c.lineWidth = 2.4; c.strokeStyle = INK; [-1, 1].forEach(k => { c.beginPath(); c.arc(56 + k * 11, hy + 2, 7.2, 0, Math.PI * 2); c.stroke(); }); c.beginPath(); c.moveTo(52, hy + 1); c.lineTo(60, hy + 1); c.stroke(); }
    // hats
    const hc = P.hatColor;
    if (P.hat === 'straw') { shape('#e8c46a', () => ell(56, hy - hr + 4, hr + 16, 7)); shape('#e8c46a', () => { c.moveTo(56 - 17, hy - hr + 3); c.quadraticCurveTo(56, hy - hr - 24, 56 + 17, hy - hr + 3); c.closePath(); }); shape('#d9493b', () => c.rect(56 - 16, hy - hr - 3, 32, 5), 2); }
    else if (P.hat === 'chef') shape('#ffffff', () => { c.moveTo(56 - 20, hy - hr + 6); c.lineTo(56 - 18, hy - hr - 10); c.arc(56 - 10, hy - hr - 16, 10, Math.PI, Math.PI * 1.9); c.arc(56 + 4, hy - hr - 20, 11, Math.PI * 1.1, Math.PI * 1.95); c.arc(56 + 14, hy - hr - 12, 8, Math.PI * 1.3, Math.PI * 0.2); c.lineTo(56 + 20, hy - hr + 6); c.closePath(); });
    else if (P.hat === 'cap') { shape(hc || '#3d7fd1', () => { c.moveTo(56 - hr, hy - 6); c.bezierCurveTo(56 - hr, hy - hr - 12, 56 + hr, hy - hr - 12, 56 + hr, hy - 6); c.closePath(); }); shape(hc || '#3d7fd1', () => ell(56 + 14, hy - 6, 18, 4.5, -0.05), 2.6); }
    else if (P.hat === 'band') shape(hc || '#d9493b', () => c.rect(56 - hr + 1, hy - 15, hr * 2 - 2, 7), 2.4);
    else if (P.hat === 'scarf') shape(hc || '#f2c14e', () => { c.moveTo(56 - hr - 2, hy + 4); c.bezierCurveTo(56 - hr, hy - hr - 12, 56 + hr, hy - hr - 12, 56 + hr + 2, hy + 4); c.quadraticCurveTo(56, hy - 12, 56 - hr - 2, hy + 4); c.closePath(); });
    else if (P.hat === 'beret') shape(hc || '#3a3040', () => ell(56 + 4, hy - hr + 2, hr + 4, 9, -0.12));
    else if (P.hat === 'flat') { shape(hc || '#6b5a4a', () => { c.moveTo(56 - hr, hy - 8); c.bezierCurveTo(56 - hr + 2, hy - hr - 6, 56 + hr - 2, hy - hr - 6, 56 + hr, hy - 8); c.closePath(); }); shape(hc || '#6b5a4a', () => ell(56 + 6, hy - 8, hr + 2, 4), 2.4); }
    c.restore();
  }
  // Mimo, for Mimo's lines: its round cream body, long ears with pink insides, the teal gem
  function mimoFace(cv) {
    if (!cv || !cv.getContext) return;
    const c = cv.getContext('2d'), s = cv.width / 64; c.clearRect(0, 0, cv.width, cv.height); c.save(); c.scale(s, s); c.lineWidth = 2.4; c.strokeStyle = INK; c.lineJoin = 'round';
    const sh = (f, d) => { c.beginPath(); d(); c.fillStyle = f; c.fill(); c.stroke(); };
    [-1, 1].forEach(k => { sh('#fbf1df', () => c.ellipse(32 + k * 9, 16, 5.5, 13, k * 0.25, 0, Math.PI * 2)); c.beginPath(); c.ellipse(32 + k * 9, 17, 2.6, 8.5, k * 0.25, 0, Math.PI * 2); c.fillStyle = '#ff9b88'; c.fill(); });
    sh('#fbf1df', () => c.ellipse(32, 40, 20, 18, 0, 0, Math.PI * 2));
    c.fillStyle = INK; [-1, 1].forEach(k => { c.beginPath(); c.ellipse(32 + k * 7, 38, 2.4, 3.2, 0, 0, Math.PI * 2); c.fill(); });
    c.fillStyle = 'rgba(255,120,120,.45)'; [-1, 1].forEach(k => { c.beginPath(); c.ellipse(32 + k * 12, 44, 3.6, 2.2, 0, 0, Math.PI * 2); c.fill(); });
    sh('#2fd0c2', () => { c.moveTo(32, 23); c.lineTo(36, 27); c.lineTo(32, 31); c.lineTo(28, 27); c.closePath(); });
    c.restore();
  }

  // ============================================================ the look
  const CSS = `
#talk { position: fixed; z-index: 12; right: 14px; top: 58px; bottom: 14px; width: min(460px, calc(100vw - 28px)); display: flex; font-family: "Segoe UI", system-ui, sans-serif; color: #2b2235; }
#talk.hidden, #talk .hidden { display: none !important; } #talk * { box-sizing: border-box; }
#talk .tk-card { flex: 1; min-height: 0; display: flex; flex-direction: column; background: #fffaf0; border: 3px solid #2b2235; border-radius: 20px; box-shadow: 0 0 0 6px #fff, 0 12px 0 5px rgba(43,34,53,.18); overflow: hidden; }
#talk .tk-head { display: flex; align-items: center; gap: 10px; padding: 9px 10px 8px 12px; background: #f6ead2; border-bottom: 2px dashed rgba(43,34,53,.22); }
#talk .tk-face { width: 58px; height: 58px; flex: 0 0 auto; }
#talk .tk-who { flex: 1; min-width: 0; } #talk .tk-name { display: block; font: 800 19px Bahnschrift, "Segoe UI", sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#talk .tk-sub { display: block; font-size: 12px; font-weight: 600; opacity: .72; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } #talk .tk-sub .st { color: #e0a020; letter-spacing: 1px; }
#talk .tk-head button { border: 2px solid #2b2235; border-radius: 9px; background: #fff; font: 800 12px "Segoe UI", sans-serif; padding: 3px 8px; cursor: pointer; flex: 0 0 auto; }
#talk .tk-head button.off { opacity: .45; }
#talk .tk-log { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 40px 10px 12px; display: flex; flex-direction: column; gap: 7px; }
#talk .tk-m { max-width: 92%; padding: 7px 11px 6px; border-radius: 15px; font-size: 17px; line-height: 1.38; position: relative; word-wrap: break-word; }
#talk .tk-m.them { align-self: flex-start; background: #fff; border: 2px solid rgba(43,34,53,.16); border-bottom-left-radius: 4px; }
#talk .tk-m.me { align-self: flex-end; background: #dcf4ef; border: 2px solid rgba(33,164,147,.4); border-bottom-right-radius: 4px; margin-right: -28px; }
#talk .tk-m.me.miss { opacity: .62; border-style: dashed; } #talk .tk-m.me .q { font-weight: 800; color: #8a8f9e; margin-left: 6px; }
#talk .tk-m .tk-en { display: block; font-size: 13px; font-style: italic; opacity: .66; margin-top: 2px; line-height: 1.3; }
#talk:not(.en-on) .tk-en.help { display: none; } #talk .en-1 .tk-en.help { display: block; } #talk .tk-m.them .tk-t { cursor: pointer; }
#talk .tk-tl { display: block; font-size: 14px; margin-top: 3px; padding-top: 3px; border-top: 1px dashed rgba(43,34,53,.2); color: #5b4a6b; }
#talk .tk-m .gl { font-size: .72em; }
#talk .mx-new, #talk .tk-nw b { background: linear-gradient(transparent 55%, #ffe36e 55%); color: #2b2235; font-weight: 800; border-bottom: 0; }
#talk .tk-m.tk-teach { background: #fffbe6; border: 2px solid #e8c547; }
#talk .tk-tag { display: block; font: 800 11px "Segoe UI", sans-serif; letter-spacing: .06em; text-transform: uppercase; color: #a0761a; margin-bottom: 3px; }
#talk .tk-nws { display: flex; flex-wrap: wrap; gap: 6px; margin: 2px 0 5px; } #talk .tk-nw { display: inline-flex; align-items: center; gap: 5px; background: #fff; border: 1.5px solid rgba(43,34,53,.18); border-radius: 10px; padding: 2px 8px 2px 4px; font-size: 16px; }
#talk .tk-nw img { width: 30px; height: 30px; } #talk .tk-nw i { font-size: 12.5px; opacity: .72; }
#talk .tk-echo .tk-fix button { border: 0; background: #fff; border-radius: 8px; font: 800 16px "Segoe UI", sans-serif; padding: 1px 7px; margin: 1px 2px 1px 0; cursor: pointer; color: #13786b; }
#talk .tk-echo small { display: block; font-size: 12px; opacity: .7; margin-top: 2px; }
#talk .tk-rung .tk-nwl { display: block; font: 600 12px "Segoe UI", sans-serif; color: #a0761a; margin-top: 1px; }
#talk .tk-m.tk-bridge .tk-nwl { display: block; font: 600 12.5px "Segoe UI", sans-serif; color: #a0761a; margin-top: 2px; }
#talk .tk-m .tk-say { position: absolute; right: -32px; top: 3px; border: 0; background: none; font-size: 16px; cursor: pointer; padding: 2px; }
#talk .tk-m.typing { font-weight: 800; letter-spacing: 3px; color: #8a8f9e; }
#talk .tk-gr { display: inline-block; font: 900 13px Bahnschrift, sans-serif; color: #fff; border: 2px solid #2b2235; border-radius: 99px; padding: 0 8px; margin-left: 7px; vertical-align: 1px; }
#talk .tk-gr.g-S { background: #e0a020; } #talk .tk-gr.g-A { background: #21a493; } #talk .tk-gr.g-B { background: #3f7fc9; } #talk .tk-gr.g-C { background: #8a5ab0; } #talk .tk-gr.g-D { background: #8a8f9e; }
#talk .tk-mimo { align-self: stretch; display: flex; gap: 8px; align-items: flex-start; background: #e9fbf8; border: 2px dashed #21a493; border-radius: 14px; padding: 6px 10px 7px 6px; font-size: 15px; margin-right: -28px; }
#talk .tk-mimo canvas { width: 34px; height: 34px; flex: 0 0 auto; } #talk .tk-mimo b.nm { color: #13786b; font-size: 12px; letter-spacing: .05em; text-transform: uppercase; display: block; }
#talk .tk-fix { font-size: 17px; font-weight: 600; } #talk .tk-red { color: #d6453a; font-weight: 800; border-bottom: 2px solid rgba(214,69,58,.45); }
#talk .tk-tips { margin: 3px 0 0; padding-left: 17px; font-size: 13px; line-height: 1.35; }
#talk .tk-sys { align-self: center; font-size: 12px; font-weight: 700; background: #f0e6d2; border-radius: 9px; padding: 2px 10px; text-align: center; }
#talk .tk-mem { align-self: stretch; background: #fbf3df; border-left: 4px solid #d8b56a; border-radius: 6px; padding: 6px 10px; font: 16px/1.45 "Segoe Print", "Ink Free", cursive; }
#talk .tk-mem .tk-en { font-family: "Segoe UI", sans-serif; font-size: 12.5px; font-style: italic; opacity: .7; display: block; }
#talk .tk-card2 { align-self: stretch; background: #fff; border: 2.5px solid #2b2235; border-radius: 14px; padding: 8px 12px 10px; text-align: center; margin-right: -28px; }
#talk .tk-card2 .big { font: 800 20px Bahnschrift, "Segoe UI", sans-serif; } #talk .tk-card2 .st { color: #e0a020; font-size: 20px; letter-spacing: 2px; }
#talk .tk-card2 ul { list-style: none; padding: 0; margin: 6px 0 0; text-align: left; font-size: 14px; } #talk .tk-card2 li { margin: 3px 0; }
#talk .tk-card2 .row { display: flex; gap: 5px; justify-content: center; flex-wrap: wrap; margin-top: 4px; }
#talk .tk-card2 button { margin-top: 8px; border: 2.5px solid #2b2235; border-radius: 11px; background: #2b2235; color: #fffaf0; font-weight: 800; padding: 5px 16px; cursor: pointer; }
#talk .tk-task { padding: 7px 12px 3px; border-top: 2px dashed rgba(43,34,53,.22); background: #fff; }
#talk .tk-goal { font-weight: 800; font-size: 14px; line-height: 1.3; } #talk .tk-goal::before { content: "✎ "; color: #21a493; }
#talk .tk-rung { font-size: 14px; line-height: 1.35; margin-top: 2px; } #talk .tk-rung b { color: #c2412f; font-size: 15.5px; } #talk .tk-rung i { display: block; font-size: 12px; opacity: .65; }
#talk .tk-rung .k { font: 800 10.5px "Segoe UI", sans-serif; letter-spacing: .07em; text-transform: uppercase; color: #8a4f80; margin-right: 4px; }
#talk .tk-row { display: flex; gap: 6px; align-items: center; margin-top: 4px; } #talk .tk-row button { font: 800 11.5px "Segoe UI", sans-serif; border: 2px solid #2b2235; background: #fffaf0; border-radius: 9px; padding: 1px 9px; cursor: pointer; }
#talk .tk-row .note { font-size: 11.5px; opacity: .6; margin-left: auto; text-align: right; }
#talk .tk-inp { display: flex; gap: 8px; padding: 6px 12px 12px; background: #fff; }
#talk .tk-inp input { flex: 1; min-width: 0; font: 600 18px "Segoe UI", sans-serif; padding: 7px 11px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; background: #fff; }
#talk .tk-inp input:focus { box-shadow: 0 0 0 3px rgba(33,164,147,.35); } #talk .tk-inp input:disabled { opacity: .5; }
#talk .tk-inp button { border: 2.5px solid #2b2235; border-radius: 12px; background: #2b2235; color: #fffaf0; font-weight: 800; padding: 6px 14px; cursor: pointer; }
#talk.shake .tk-card { animation: tk-shake .35s; } @keyframes tk-shake { 20% { transform: translateX(-7px); } 45% { transform: translateX(6px); } 70% { transform: translateX(-3px); } }
@media (max-width: 720px) { #talk { inset: 0; width: auto; } #talk .tk-card { border-radius: 0; border-width: 0; box-shadow: none; } }
@media (max-height: 560px) { #talk { top: 6px; bottom: 6px; } #talk .tk-face { width: 42px; height: 42px; } #talk .tk-m { font-size: 15px; } #talk .tk-head { padding: 5px 10px; } #talk .tk-inp input { font-size: 16px; padding: 5px 9px; } }
@media (max-width: 380px) { #talk .tk-log { padding-right: 34px; } #talk .tk-m { font-size: 15.5px; } }
body.talk-open #objective, body.talk-open #compass, body.talk-open #minimap, body.talk-open #help, body.talk-open .bubble, body.talk-open #thought, body.talk-open .prompt { display: none !important; }
`;
  const D = { root: null };
  function dom() {
    if (D.root) return D;
    if (!document.getElementById('talk-css')) { const st = document.createElement('style'); st.id = 'talk-css'; st.textContent = CSS; document.head.appendChild(st); }
    const r = document.createElement('div'); r.id = 'talk'; r.className = 'hidden';
    r.innerHTML = `<div class="tk-card"><div class="tk-head"><canvas class="tk-face" width="116" height="116"></canvas><div class="tk-who"><b class="tk-name"></b><small class="tk-sub"></small></div>`
      + `<button class="tk-en" title="Help: each line in English under it">EN</button><button class="tk-x" title="Leave (Esc)">✕</button></div>`
      + `<div class="tk-log"></div><div class="tk-task hidden"><div class="tk-goal"></div><div class="tk-rung"></div><div class="tk-row"><button class="tk-help" type="button">Help (Tab)</button><span class="note"></span></div></div>`
      + `<form class="tk-inp" autocomplete="off"><input spellcheck="false" autocomplete="off"><button type="submit">Send</button></form></div>`;
    document.body.appendChild(r);
    const q = s => r.querySelector(s);
    Object.assign(D, { root: r, face: q('.tk-face'), name: q('.tk-name'), sub: q('.tk-sub'), en: q('.tk-en'), x: q('.tk-x'), log: q('.tk-log'), task: q('.tk-task'),
      goal: q('.tk-goal'), rung: q('.tk-rung'), helpB: q('.tk-help'), note: q('.tk-row .note'), form: q('.tk-inp'), input: q('.tk-inp input') });
    if (typeof CJK !== 'undefined' && CJK.attachIME) CJK.attachIME(D.input);
    D.form.addEventListener('submit', e => { e.preventDefault(); e.stopPropagation(); if (V) V.submit(D.input.value); });
    D.helpB.onclick = () => { if (V) V.help(); };
    D.x.onclick = () => { if (V) V.quit(); };
    D.en.onclick = () => { if (!V) return; V.en = !V.en; try { TALK.state.en = V.en; } catch (e) { /* */ } r.classList.toggle('en-on', V.en); D.en.classList.toggle('off', !V.en); };
    return D;
  }
  // A line mixed by the weave (js/talk/mix.js): its HTML, and whether it came out whole in the language. Without MIX (the test
  // pages), the line in the language (its English on request, like every line).
  const mixOn = () => typeof MIX !== 'undefined' && MIX.ok();
  function mixed(t, en, o) {
    if (mixOn()) return MIX.line(t, en, o);
    return { full: true, html: textHTML(t), en, under: false };
  }
  // the line's HTML in a bubble: the mix, its English (help: EN, or a tap on the line), the line in the language once you hear it
  function lineHTML(t, en, o) {
    const m = mixed(t, en, o);
    return `<span class="tk-t">${m.html}</span>${en ? `<span class="tk-en help">${E(en)}</span>` : ''}${!m.full && t ? `<span class="tk-tl hidden">${textHTML(t)}</span>` : ''}`;
  }
  const tapEn = el => { const t = el && el.querySelector('.tk-t'); if (t) t.onclick = () => el.classList.toggle('en-1'); return el; };
  // A help rung in the language. An example's new words (talk.js: up to 3) are taught right there: highlighted, with their English
  // after it, and from then on they count as taught in this talk (in the language in the lines that follow).
  function rungHTML(x, task) {
    if (!x.teach || !x.teach.length || !mixOn()) return textHTML(x.t);
    if (!x.taughtNow) { x.taughtNow = true; x.teach.forEach(w => { try { if (task && task.force) task.force.add(w.id); DICT.met(w.id, 'heard'); } catch (e) { /* */ } }); }
    return MIX.tlHTML(x.t, new Map(x.teach.map(w => [w.id, w.en]))) + `<small class="tk-nwl">${x.teach.map(w => `${w.src && isC() ? CJK.html(w.src, { lang: L(), cap: false }) : E(w.t)} = ${E(w.en)}`).join(' · ')}</small>`;
  }
  const scroll = () => { if (D.log) D.log.scrollTop = 1e6; };
  function add(cls, html) { const el = document.createElement('div'); el.className = cls; el.innerHTML = html; D.log.appendChild(el); scroll(); return el; }
  const stars = n => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
  const BANDS = ['A0', 'A1', 'A2', 'B1', 'B2'];

  // ============================================================ the view (one conversation at a time)
  let V = null;
  const game = () => (typeof TALK !== 'undefined' && TALK.game) || null;
  function open(h = {}) {
    dom();
    if (V) V.close();
    D.log.innerHTML = ''; D.task.classList.add('hidden'); D.input.value = ''; D.form.classList.remove('hidden');
    D.name.textContent = h.name || ''; face(D.face, h.look, null);
    const band = BANDS[h.band] || '';
    D.sub.innerHTML = h.small ? `Small talk · ${E(band)}` : h.rankUp ? `<span class="st">${stars(h.rank || 0)}</span> · rank ${h.rankUp} · ${E(band)}${h.title ? ' · ' + E(h.title) : ''}`
      : (h.rank != null ? `<span class="st">${stars(h.rank)}</span> · ${E(band)}` : E(band));
    // (EN is a help button: the lines are mixed by the weave, and the whole English is there when you ask for it, never under a
    // line by default, whole lines in the language included: DESIGN.md 17.3. It starts off in every talk, so one press long ago
    // can't put the English back under everything.)
    const en = false;
    D.root.classList.toggle('en-on', en); D.en.classList.toggle('off', !en);
    D.input.placeholder = `Say it in ${LANGNAME[L()] || 'the language'}…`;
    D.root.classList.remove('hidden'); document.body.classList.add('talk-open');
    if (typeof Input !== 'undefined') Input.typing = true;
    { const g = game(); if (g && g.state) { g.state.teaching = true; g.prompt = null; } }
    let pending = null, helpN = 0, rungs = [], done = null, lastFace = null, curTask = null;
    const keys = e => {
      if (!V || V !== view) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); view.quit(); }
      else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); view.help(); }
      else if (done && (e.key === 'Enter' || e.key === ' ') && document.activeElement !== D.input) { e.preventDefault(); e.stopPropagation(); const f = done; done = null; f(); }
    };
    addEventListener('keydown', keys, true);
    const showRung = () => {
      const K = ['', 'Start like this', 'For example', 'You could say'];
      const n = Math.min(3, helpN), x = rungs[n - 1] || rungs.slice(0, n).reverse().find(Boolean);
      if (!n || !x) { D.rung.innerHTML = ''; return; }
      D.rung.innerHTML = `<span class="k">${K[n]}</span><b>${rungHTML(x, curTask)}</b>${x.en ? `<i>${E(x.en)}</i>` : ''}`;
      D.helpB.classList.toggle('hidden', n >= 3);
      D.note.textContent = n >= 3 ? 'With the model shown, this answer is a D' : n === 1 ? 'Help costs a grade step' : 'Two steps of help: a B at best';
    };
    const moodFace = mood => { if (mood === lastFace) return; lastFace = mood; face(D.face, h.look, mood); };
    const view = {
      en,
      get waiting() { return !!pending || !!done; },
      async npc(line) {
        if (!D.root || V !== view) return;
        const len = plain(line.t).length;
        if (!T().fast) { const ty = add('tk-m them typing', '•••'); await wait(Math.min(1100, 260 + len * 18)); ty.remove(); }
        if (V !== view) return;
        // (mixed by the weave, the words taught in this talk in the language; 🔊 says the whole line and shows it written)
        const el = tapEn(add('tk-m them', `${lineHTML(line.t, line.en, { force: line.force, count: true })}<button class="tk-say" title="Hear it in ${E(LANGNAME[L()] || 'the language')}">🔊</button>`));
        el.querySelector('.tk-say').onclick = () => { sayOrNote(line.t); const tl = el.querySelector('.tk-tl'); if (tl) { tl.classList.remove('hidden'); scroll(); } };
        if (line.mood) moodFace(line.mood); else if (lastFace) moodFace(null);
        await wait(140);
      },
      // New words before a question (talk.js preteach): the person uses them in a sentence (the model, as an example), each one
      // highlighted with its English and a picture where there is one; then Mimo says them back
      async teach(pre) {
        if (V !== view || !pre || !pre.words || !pre.words.length) return;
        const ws = pre.words, mark = new Map(ws.map(w => [w.id, w.en]));
        const wordHTML = w => (w.src && isC() ? CJK.html(w.src, { lang: L(), cap: false }) : E(w.t));
        if (!T().fast) { const ty = add('tk-m them typing', '•••'); await wait(700); ty.remove(); }
        if (V !== view) return;
        const sent = pre.line && pre.line.t ? (mixOn() ? MIX.tlHTML(pre.line.t, mark) : textHTML(pre.line.t)) : '';
        // (the new words glossed, the sentence they're in without its English: that's on request, EN or a tap)
        const el = tapEn(add('tk-m them tk-teach', `<span class="tk-tag">✨ New ${ws.length > 1 ? 'words' : 'word'} for ${h.name ? E(h.name) + '’s' : 'the'} next question</span>`
          + `<div class="tk-nws">${ws.map(w => `<span class="tk-nw">${w.icon ? `<img src="${w.icon}" alt="">` : ''}<b>${wordHTML(w)}</b><i>${E(w.en)}</i></span>`).join('')}</div>`
          + (sent ? `<span class="tk-t">«${sent}»</span><span class="tk-en help">${E(pre.line.en || '')}</span>` : '') + `<button class="tk-say" title="Hear it">🔊</button>`));
        el.querySelector('.tk-say').onclick = () => sayOrNote(pre.line && pre.line.t ? pre.line.t : ws.map(w => w.src || w.t).join(', '));
        await wait(500);
        if (V !== view) return;
        const nm = E(nmMimo());
        const echo = add('tk-mimo tk-echo', `<canvas width="68" height="68"></canvas><div><b class="nm">${nm}</b><div class="tk-fix">${ws.map((w, k) => `<button type="button" data-k="${k}" title="Hear it">${wordHTML(w)}!</button>`).join(' ')}</div><small>${nm} says the new ${ws.length > 1 ? 'words' : 'word'} back. Try ${ws.length > 1 ? 'them' : 'it'} in your answer!</small></div>`);
        mimoFace(echo.querySelector('canvas'));
        echo.querySelectorAll('button[data-k]').forEach(b => { b.onclick = () => { const w = ws[+b.dataset.k]; sayOrNote(w.src || w.t); }; });
        try { Sound.play('babble'); } catch (e) { /* */ }
        await wait(500);
      },
      // The Spanglish bridge (talk/bridge.js, P6a): the English words you used, said back in the language by the person, each one
      // highlighted, with its English under the line («¡Ah! ¿Tienes un perro?» · perro = dog). b: { echo, ah, words: [{ id, form, lemma, en }] }
      async bridge(b) {
        if (V !== view || !b || !b.echo) return;
        if (!T().fast) { const ty = add('tk-m them typing', '•••'); await wait(650); ty.remove(); }
        if (V !== view) return;
        const ws = (b.words || []).filter(w => w && w.form), line = (b.ah ? b.ah + ' ' : '') + b.echo;
        const mark = new Map(ws.filter(w => w.id).map(w => [w.id, w.en]));
        const glo = ws.map(w => `<b>${isC() && w.lemma ? CJK.html(w.lemma, { lang: L(), cap: false }) : E(w.form)}</b> = ${E(w.en)}`).join(' · ');
        const el = add('tk-m them tk-bridge', `<span class="tk-t">${mixOn() ? MIX.tlHTML(line, mark) : textHTML(line)}</span><small class="tk-nwl">${glo}</small><button class="tk-say" title="Hear it">🔊</button>`);
        el.querySelector('.tk-say').onclick = () => sayOrNote(line);
        moodFace('happy');
        await wait(350);
      },
      you(text) {
        const el = add('tk-m me', `<span>${E(text)}</span>`);
        return {
          grade(g) { el.insertAdjacentHTML('beforeend', `<span class="tk-gr g-${E(g)}" title="${E(GRADE_EN[g] || '')}">${E(g)}</span>`); scroll(); },
          miss() { el.classList.add('miss'); el.insertAdjacentHTML('beforeend', '<span class="q" title="They didn’t follow">?</span>'); D.root.classList.remove('shake'); void D.root.offsetWidth; D.root.classList.add('shake'); try { Sound.play('wrong'); } catch (e) { /* */ } },
        };
      },
      async mimo(m) {
        if (V !== view) return;
        const nm = E(nmMimo());
        const body = (m.diff ? `<div class="tk-fix">${m.diff}</div>` : m.model ? `<div class="tk-fix">${textHTML(m.model.t)}</div>` : '')
          + (m.tips && m.tips.length ? `<ul class="tk-tips">${m.tips.map(t => `<li>${E(t)}</li>`).join('')}</ul>` : '');
        const el = add('tk-mimo', `<canvas width="68" height="68"></canvas><div><b class="nm">${nm}</b>${body}</div>`);
        mimoFace(el.querySelector('canvas'));
        await wait(200);
      },
      async model(x) {
        helpN = 3; showRung();
        if (x) add('tk-sys', 'They didn’t follow. Here’s one way to say it (you can say it your way too):');
        D.input.focus();
      },
      sys(text) { add('tk-sys', E(text)); },
      input(task) {
        if (V !== view) return Promise.resolve(null);
        rungs = task.rungs || []; helpN = task.help || 0; curTask = task;
        D.task.classList.remove('hidden');
        // (the goal is English; the things in it you know come in the language, woven from the turn's own words)
        if (task.goal && task.goalSrc && mixOn()) D.goal.innerHTML = MIX.html(task.goalSrc, task.goal, { pos: ['n', 'adj'], noFull: true, force: task.force });
        else D.goal.textContent = task.goal || 'Answer in your own words.';
        D.helpB.classList.toggle('hidden', helpN >= 3 || !rungs.some(Boolean)); D.note.textContent = '';
        showRung(); D.input.disabled = false; D.input.value = '';
        setTimeout(() => { if (V === view) D.input.focus(); }, 30);
        scroll();
        return new Promise(res => { pending = res; });
      },
      submit(text) {
        const t = String(text == null ? '' : text).trim();
        if (!pending || !t) return false;
        if (t === '?' || /^(idk|i don'?t know|help)$/i.test(t)) { view.help(); D.input.value = ''; return true; }
        const f = pending; pending = null; D.input.value = ''; D.input.disabled = true;
        f({ text: t, help: helpN }); return true;
      },
      help() { if (!pending || helpN >= 3 || !rungs.some(Boolean)) return false; helpN++; while (helpN < 3 && !rungs[helpN - 1]) helpN++; showRung(); try { Sound.play('click'); } catch (e) { /* */ } D.input.focus(); return true; },
      quit() {
        if (pending) { const f = pending; pending = null; f(null); return true; }
        if (done) { const f = done; done = null; f(); return true; }
        view.close(); return true;
      },
      next() { if (done) { const f = done; done = null; f(); return true; } return false; },
      async end(sum) {
        if (V !== view) return;
        D.task.classList.add('hidden'); D.input.disabled = true; D.form.classList.add('hidden');
        if (sum.rank) D.sub.innerHTML = `<span class="st">${stars(sum.rank.rank)}</span> · rank ${sum.rank.rank} · ${E(band)}`;
        const gs = sum.grades || [];
        if (sum.rank && sum.rank.memory) {
          add('tk-sys', 'A memory');
          for (const ln of TALK.linesOf(sum.rank.memory)) { await wait(T().fast ? 0 : 500); tapEn(add('tk-mem', lineHTML(TALK.fill(ln.t, {}), TALK.fill(ln.en, {}, true), { count: true }))); }
        }
        let html = '';
        if (sum.rank) {
          const got = sum.rank.got || [];
          const li = g => g.kind === 'phrase' ? `📖 Phrasebook: <b>${textHTML(g.t)}</b> (${E(g.en)})` : g.kind === 'coins' ? `🪙 ${g.n} coins` : g.kind === 'cosmetic' ? `🎀 For ${E(nmMimo())}: ${E((g.name && g.name.en) || g.id)} (switch it on or off in the journal, People)`
            : g.kind === 'number' ? `📱 ${E(sum.name)} gave you a phone number: press ${E(phoneKey())} for the phone` : E(g.text || '');
          html += `<div class="big">${E(sum.name)}</div><div class="st">${stars(sum.rank.rank)}</div><div>Rank ${sum.rank.rank}!</div>${got.length ? `<ul>${got.map(g => `<li>${li(g)}</li>`).join('')}</ul>` : ''}`;
          try { Sound.play('learned'); } catch (e) { /* */ }
        } else html += `<div class="big">${E(sum.name || '')}</div>`;
        if (gs.length) html += `<div class="row">${gs.map(g => `<span class="tk-gr g-${E(g)}">${E(g)}</span>`).join('')}</div>`;
        if (sum.coins) html += `<div style="margin-top:4px">🪙 +${sum.coins}</div>`;
        html += `<button type="button">Done (Enter)</button>`;
        const card = add('tk-card2', html);
        return new Promise(res => { done = res; card.querySelector('button').onclick = () => { if (done) { const f = done; done = null; f(); } }; setTimeout(() => { try { card.querySelector('button').focus(); } catch (e) { /* */ } }, 30); });
      },
      close() {
        if (V !== view) return;
        removeEventListener('keydown', keys, true);
        if (pending) { const f = pending; pending = null; f(null); }
        V = null; D.root.classList.add('hidden'); document.body.classList.remove('talk-open');
        if (typeof Input !== 'undefined') Input.typing = false;
        const g = game(); if (g && g.state) g.state.teaching = false;
        try { speechSynthesis.cancel(); } catch (e) { /* */ }
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      },
    };
    V = view;
    return view;
  }
  const GRADE_EN = { S: 'Rich and right', A: 'Right (a small slip, or short)', B: 'One real mistake', C: 'Several mistakes', D: 'The model was shown' };
  const nmMimo = () => { const g = game(); return (g && g.state && g.state.mimoName) || 'Mimo'; };
  const phoneKey = () => { try { return KEYS.keys('phone').split(' / ')[0]; } catch (e) { return 'C'; } };
  return { open, face, mimoFace, speak, textHTML, get view() { return V; }, get isOpen() { return !!V; } };
})();
