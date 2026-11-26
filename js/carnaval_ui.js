'use strict';
// The Carnaval panels (carnaval.js; Portuguese games only). A cream card with a strip of confetti and paper streamers along
// its top, for Malu's lessons and step-by-step tasks (the costumes, the bateria, the marchinhas, the route, the estandarte),
// and a call bar at the bottom of the screen for the scenes out in the world (the bateria, the parade).
// Typed Portuguese is matched without accents, case or punctuation (core.js norm): «Vira à direita!» = "vira a direita".
// One global, CVUI:
//   CVUI.bind(game)
//   CVUI.lesson({ title, sub, face, name, intro: [pt, en], items: [{ id, pt, en, note, sit, keys }], recall, outro: [pt, en] })
//        → { done, clean: { id: bool } } | { quit }: each item copied (echo), then said from a situation (recall); then
//        every item with an id goes into the journal's Phrasebook
//   CVUI.steps(steps, { title, sub, face, name, intro: [pt, en] }) → { done, grades: ['S'…'D'] } | { quit }
//        a step: { kind, big (html), art (html, or fn(el) that draws into it), gl (html), note (html), say: [pt, en], model,
//                  modelEn, echo (the model shown from the start), keys (any of them said = ok) or check(text) → { ok, why,
//                  minor, note, said }, placeholder, voice, onOk(r, text, el) (async: an animation before the next step),
//                  then(r), live(text, artEl) (called as you type) }
//        Grades: right first time S, then A, B…; a small slip (minor) costs one; after two misses the model shows, and
//        saying it then is a D. No fail states.
//   CVUI.hud: open(title), cue({ icon, title, sub, bar }), call({ model, modelEn, keys | check, placeholder })
//             → 'S'…'D' | 'quit' | (interrupt(why)) why, fb(html, ok), interrupt(why), close()
//   text: CVUI.N (normalized), CVUI.has(text, phrases), CVUI.idk(text), CVUI.say(text), CVUI.esc, CVUI.hintOf(text, n)
//   the Phrasebook: CVUI.teach(id) (stage 3, its review pushed far off), CVUI.keepFar(ids)
//   tests: CVUI.cur / CVUI.hcur ({ model, submit(text), idk(), hint() }) while a card or the bar waits; CVUI.fast skips pauses
// Needs core.js, icons.js and audio.js; UI, LEX and Input at run time.

const CVUI = (() => {
  let G = null;
  const bind = g => { G = g; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const N = s => norm(String(s == null ? '' : s).replace(/['’]/g, ' '));
  // does the text say one of these (whole words, in order)?
  const has = (text, list) => { const n = ' ' + N(text) + ' '; return (Array.isArray(list) ? list : [list]).some(k => k && n.includes(' ' + N(k) + ' ')); };
  const idk = t => /^\s*\?+\s*$/.test(String(t || '')) || ['idk', 'i dont know', 'i don t know', 'dont know', 'nao sei', 'sei la', 'nao lembro', 'help'].includes(N(t));
  // a hint: the first letter of each word, the rest as dots (n 2: every other letter too, n 3: the lot)
  const hintOf = (s, n = 1) => String(s).split(/(\s+)/).map(w => /^\s+$/.test(w) ? w : [...w].map((ch, i) => (!/[a-záàâãéêíóôõúçü]/i.test(ch) || i === 0 || n >= 3 || (n >= 2 && i % 2 === 0) ? ch : '·')).join('')).join('');
  const say = s => { try { Sound.say(String(s).replace(/[«»"“”]/g, '').replace(/\{|\}/g, ''), 'pt'); } catch (e) { /* no voice */ } };
  const snd = k => { try { Sound.play(k); } catch (e) { /* */ } };
  const tick = ms => new Promise(r => setTimeout(r, ms));
  const GR = ['S', 'A', 'B', 'C', 'D'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const PRAISE = [['Isso!', 'That’s it!'], ['Muito bem!', 'Very good!'], ['Arrasou!', 'Nailed it!'], ['Show!', 'Great!'], ['Mandou bem!', 'Nice one!']];
  const STATE = { fast: false, cur: null, hcur: null, open: false };

  // ============================================================ the Phrasebook (LEX items of kind 'phrase', pt only)
  const nowS = () => Date.now() / 1000;
  function teach(id) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || LEX.lang !== 'pt') return;
    const s = LEX.st(id), t = nowS(); LEX.expose(id);
    if (s.stage < 3) s.stage = 3;
    s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 30 * 86400; s.last = t;
  }
  function keepFar(ids) {
    if (typeof LEX === 'undefined' || LEX.lang !== 'pt') return;
    const t = nowS();
    for (const id of ids) { if (!LEX.item(id)) continue; const s = LEX.st(id); if (s.stage >= 2 && s.due < t + 86400) { s.due = t + 30 * 86400; s.str = Math.max(s.str || 0, 30 * 86400); } }
  }

  // ============================================================ the look: confetti and streamers along the card's top
  let STRIP = null;
  function strip() {
    if (STRIP) return STRIP;
    const cv = document.createElement('canvas'); cv.width = 360; cv.height = 30; const c = cv.getContext('2d');
    const cols = ['#ff4f9a', '#ffd23f', '#19b37a', '#2f7fe0', '#8a4fd8', '#ff8a2a'];
    // two streamers (serpentinas) curling along, then confetti dots and bits scattered over them
    [[4, '#ff4f9a', 0], [16, '#2f7fe0', 1.7]].forEach(([y0, col, ph]) => { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= 360; x += 2) { const y = y0 + Math.sin(x / 13 + ph) * 4 + Math.sin(x / 5.3 + ph) * 1.6; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); });
    const R = rng(77);
    for (let i = 0; i < 46; i++) { c.fillStyle = cols[i % cols.length]; const x = R() * 360, y = 2 + R() * 26; if (i % 3) { c.beginPath(); c.arc(x, y, 1.6 + R() * 1.8, 0, TAU); c.fill(); } else { c.save(); c.translate(x, y); c.rotate(R() * 3); c.fillRect(-3, -1.5, 6, 3); c.restore(); } }
    return (STRIP = cv.toDataURL());
  }
  const CSS = () => `
#cvov { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; font-family: "Trebuchet MS", "Segoe UI", system-ui, sans-serif; color: #2b2235; -webkit-font-smoothing: antialiased; }
#cvov.hidden, #cvov .hidden { display: none !important; } #cvov * { box-sizing: border-box; }
#cvov .sh { position: absolute; inset: 0; background: radial-gradient(circle at 50% 35%, rgba(60,30,80,.32), rgba(25,15,45,.6)); }
#cvov .pn { position: relative; width: min(1120px, calc(100vw - 16px)); max-height: calc(100vh - 16px); background: #fffaf0; border: 3px solid #2b2235; border-radius: 20px; box-shadow: 0 0 0 6px #fff, 0 0 0 9px #ff4f9a, 0 14px 0 8px rgba(43,34,53,.22); overflow: hidden; }
#cvov .cf { height: 30px; background: url(${strip()}) repeat-x 0 0, linear-gradient(90deg, #fff3c4, #ffe0ef, #d9f4ff); border-bottom: 2px dashed rgba(43,34,53,.15); }
#cvov .hd { display: flex; align-items: center; gap: 12px; padding: 6px 16px 8px; }
#cvov .hd b { font: 800 21px Bahnschrift, "Segoe UI", sans-serif; } #cvov .hd .t { font-weight: 800; opacity: .65; }
#cvov .hd .dots { margin-left: auto; display: flex; gap: 4px; flex-wrap: wrap; max-width: 46%; } #cvov .hd .dots i { width: 11px; height: 11px; border-radius: 50%; border: 2px solid #ff4f9a; } #cvov .hd .dots i.f { background: #ffd23f; border-color: #c79a10; } #cvov .hd .dots i.now { box-shadow: 0 0 0 3px #7fe0ff; }
#cvov button { font: inherit; font-weight: 800; font-size: 14px; color: #2b2235; background: #fffaf0; border: 2.5px solid #2b2235; border-radius: 12px; padding: 4px 11px; cursor: pointer; box-shadow: 0 3px 0 rgba(43,34,53,.18); }
#cvov button:hover { background: #fff0c2; } #cvov button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(43,34,53,.18); }
#cvov button.go { background: #19b37a; color: #fff; } #cvov button.go:hover { background: #22c98a; }
#cvov kbd { font: 800 11px "Segoe UI", sans-serif; border: 1.5px solid currentColor; border-radius: 5px; padding: 0 4px; margin-left: 3px; }
#cvov .bd { display: grid; grid-template-columns: 220px 1fr; gap: 18px; padding: 10px 22px 18px; overflow: auto; max-height: calc(100vh - 100px); }
#cvov .who { display: flex; flex-direction: column; align-items: center; gap: 9px; }
#cvov .who canvas { width: 108px; height: 108px; border-radius: 50%; border: 3px solid #2b2235; background: #fff3c4; }
#cvov .who .nm { font: 800 15px Bahnschrift, sans-serif; text-align: center; }
#cvov .bub { position: relative; background: #fff; border: 2.5px solid #2b2235; border-radius: 16px; padding: 8px 12px; font-size: 17px; font-weight: 700; line-height: 1.45; box-shadow: 0 3px 0 rgba(43,34,53,.15); }
#cvov .bub i { display: block; font-size: 12.5px; font-weight: 600; opacity: .7; margin-top: 3px; line-height: 1.35; }
#cvov .bub .cv-enb { float: right; font-size: 11px; padding: 0 6px; border-width: 2px; border-radius: 8px; box-shadow: none; margin: 0 0 2px 8px; }
#cvov .cd { background: #fff; border: 3px solid #2b2235; border-radius: 18px; padding: 12px 18px 14px; box-shadow: 0 5px 0 rgba(43,34,53,.15); display: flex; flex-direction: column; gap: 7px; align-self: start; }
#cvov .cd.ok { box-shadow: 0 0 0 4px #19b37a, 0 5px 0 rgba(43,34,53,.15); }
#cvov .cd .kind { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #d6286f; }
#cvov .cd .big { font: 900 34px Bahnschrift, "Segoe UI", sans-serif; color: #d6286f; line-height: 1.2; }
#cvov .cd .art { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 10px; }
#cvov .cd .art canvas { max-width: 100%; border-radius: 14px; }
#cvov .cd .gl { font-size: 17px; font-weight: 800; line-height: 1.4; } #cvov .cd .note { font-size: 14px; opacity: .8; line-height: 1.45; }
#cvov .cd form { display: flex; gap: 8px; }
#cvov .cd input { flex: 1; min-width: 0; font: 600 21px "Segoe UI", sans-serif; padding: 6px 10px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; }
#cvov .cd input:focus { box-shadow: 0 0 0 3px rgba(255,79,154,.35); }
#cvov .cd .hint { font: 700 15px "Trebuchet MS", sans-serif; min-height: 22px; line-height: 1.45; } #cvov .cd .hint.no { color: #d6286f; } #cvov .cd .hint.ok { color: #13786b; }
#cvov .cd .row { display: flex; gap: 8px; align-items: center; font-size: 12px; font-weight: 700; flex-wrap: wrap; } #cvov .cd .row span { opacity: .6; }
#cvov .shake { animation: cv-shake .35s; } @keyframes cv-shake { 20% { transform: translateX(-8px); } 45% { transform: translateX(7px); } 70% { transform: translateX(-4px); } }
#cvov .gr, #cvhud .gr { display: inline-block; font: 900 15px Bahnschrift, sans-serif; color: #fff; border: 2.5px solid #2b2235; border-radius: 99px; padding: 0 10px; margin-right: 6px; transform: rotate(-3deg); }
.cv-S { background: #e0a020; } .cv-A { background: #21a493; } .cv-B { background: #3f7fc9; } .cv-C { background: #8a5ab0; } .cv-D { background: #8a8f9e; }
#cvov .lyr { font: 700 18px/1.65 "Trebuchet MS", sans-serif; background: #fff8e6; border: 2px dashed rgba(43,34,53,.25); border-radius: 14px; padding: 8px 16px; text-align: left; min-width: min(460px, 100%); }
#cvov .lyr p { margin: 0; } #cvov .lyr .call { color: #2f5fb5; } #cvov .lyr .resp { color: #d6286f; padding-left: 1.2em; } #cvov .lyr .now { background: #ffe36b; border-radius: 6px; } #cvov .lyr .gap { letter-spacing: .12em; opacity: .55; }
#cvov .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; } #cvov .confetti i { position: absolute; top: -12px; width: 8px; height: 12px; border-radius: 2px; animation: cv-fall 1.6s linear forwards; }
@keyframes cv-fall { to { transform: translateY(520px) rotate(540deg); opacity: .2; } }
body.cv-open #objective, body.cv-open #counters, body.cv-open #help, body.cv-open #compass, body.cv-open #minimap, body.cv-open .bubble, body.cv-open #thought, body.cv-open .prompt { display: none !important; }
@media (max-width: 860px) { #cvov .bd { grid-template-columns: 1fr; } #cvov .who { flex-direction: row; } }
#cvhud { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 11; width: min(600px, calc(100vw - 24px)); background: #fffaf0; border: 3px solid #2b2235; border-radius: 18px;
  box-shadow: 0 0 0 5px #fff, 0 0 0 8px #ffd23f, 0 10px 0 6px rgba(43,34,53,.22); padding: 10px 14px 12px; font-family: "Trebuchet MS", "Segoe UI", sans-serif; color: #2b2235; }
#cvhud.hidden { display: none; } #cvhud * { box-sizing: border-box; }
#cvhud .hd { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #d6286f; }
#cvhud .cue { display: flex; align-items: center; gap: 12px; margin-top: 3px; }
#cvhud .ic { width: 62px; height: 62px; border-radius: 14px; background: #ffd23f; display: grid; place-items: center; font: 900 30px "Segoe UI Symbol", "Segoe UI Emoji", sans-serif; border: 3px solid #2b2235; flex: 0 0 auto; box-shadow: inset 0 0 0 3px #ff4f9a; overflow: hidden; }
#cvhud .ic canvas { width: 56px; height: 56px; }
#cvhud .t { font: 800 20px Bahnschrift, "Segoe UI", sans-serif; line-height: 1.2; } #cvhud .sub { font-size: 13px; font-weight: 700; opacity: .7; }
#cvhud form { display: flex; gap: 8px; margin-top: 8px; }
#cvhud input { flex: 1; min-width: 0; font: 600 21px "Segoe UI", sans-serif; padding: 5px 10px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; } #cvhud input:focus { box-shadow: 0 0 0 3px rgba(255,79,154,.3); }
#cvhud button { font: inherit; font-weight: 800; font-size: 15px; color: #2b2235; border: 2.5px solid #2b2235; border-radius: 12px; padding: 4px 12px; background: #fffaf0; cursor: pointer; } #cvhud button.go { background: #19b37a; color: #fff; }
#cvhud .fb { min-height: 22px; margin-top: 6px; font-weight: 800; font-size: 15px; line-height: 1.5; } #cvhud .fb.ok { color: #13786b; } #cvhud .fb.no { color: #d6286f; }
#cvhud .bar { height: 10px; border-radius: 99px; background: rgba(43,34,53,.12); overflow: hidden; margin-top: 7px; } #cvhud .bar b { display: block; height: 100%; background: linear-gradient(90deg, #ff4f9a, #ffd23f, #19b37a); transition: width .3s; }
body.cv-hud .bubble, body.cv-hud #thought, body.cv-hud .prompt, body.cv-hud #objective { display: none !important; }
`;
  function css() { if (document.getElementById('cv-css')) return; const s = document.createElement('style'); s.id = 'cv-css'; s.textContent = CSS(); document.head.appendChild(s); }

  // ============================================================ the overlay
  const OV = { root: null, panel: null, keys: null };
  function open(html, onKey) {
    css();
    if (!OV.root) { const r = document.createElement('div'); r.id = 'cvov'; r.className = 'hidden'; r.innerHTML = '<div class="sh"></div><div class="pn"></div>'; document.body.appendChild(r); OV.root = r; OV.panel = r.querySelector('.pn'); }
    OV.panel.innerHTML = html; OV.root.classList.remove('hidden'); document.body.classList.add('cv-open');
    if (OV.keys) removeEventListener('keydown', OV.keys, true);
    OV.keys = e => { if (e.isComposing || e.keyCode === 229) return; if (onKey) onKey(e); };
    addEventListener('keydown', OV.keys, true);
    STATE.open = true; Input.typing = true;
    if (G) { G.state.teaching = true; G.prompt = null; }
    return OV.panel;
  }
  function close() {
    if (!OV.root) return;
    OV.root.classList.add('hidden'); document.body.classList.remove('cv-open');
    if (OV.keys) { removeEventListener('keydown', OV.keys, true); OV.keys = null; }
    STATE.open = false; Input.typing = false;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (G) G.state.teaching = false;
  }
  function face(cv, icon) { try { if (cv && typeof ICONS !== 'undefined') ICONS.draw(cv, icon || 'star'); } catch (e) { /* no icon */ } }
  // A teacher's line in their bubble, by the weave like every line (DESIGN.md 17.3): mixed (the English with the words you know in
  // Portuguese), whole in Portuguese as the weave rises; its English only on request (EN on the bubble), never under it by default
  function sayBub(el, pt, en, input) {
    if (!el) return;
    if (!pt) { el.innerHTML = ''; return; }
    let html = esc(pt);
    try { if (en && typeof STORY !== 'undefined' && STORY.mixHTML) html = STORY.mixHTML(pt, en, { key: 'cv:' + en }).html; } catch (e) { /* (as written) */ }
    el.innerHTML = (en ? '<button type="button" class="cv-enb" title="This line in English">EN</button>' : '') + html + (en ? `<i class="hidden">${esc(en)}</i>` : '');
    const b = el.querySelector('.cv-enb'), tr = el.querySelector('i');
    if (b) b.onclick = e => { e.stopPropagation(); tr.classList.toggle('hidden'); if (input) input.focus(); };
  }
  // a shower of paper confetti over the card (a right answer in a song)
  function confetti(n = 26) {
    if (!OV.panel) return;
    let box = OV.panel.querySelector('.confetti'); if (!box) { box = document.createElement('div'); box.className = 'confetti'; OV.panel.appendChild(box); }
    const cols = ['#ff4f9a', '#ffd23f', '#19b37a', '#2f7fe0', '#8a4fd8', '#ff8a2a'];
    for (let i = 0; i < n; i++) { const el = document.createElement('i'); el.style.left = (Math.random() * 100) + '%'; el.style.background = cols[i % cols.length]; el.style.animationDelay = (Math.random() * 0.4) + 's'; el.style.transform = `rotate(${Math.random() * 180}deg)`; box.appendChild(el); setTimeout(() => el.remove(), 2200); }
  }

  // ============================================================ steps: one card after another, each a typed answer
  async function steps(list, o = {}) {
    const html = `<div class="cf"></div><div class="hd"><b>${esc(o.title || '')}</b><span class="t">${esc(o.sub || '')}</span><span class="dots"></span><button type="button" class="stop">Stop <kbd>Esc</kbd></button></div>
<div class="bd"><div class="who"><canvas width="108" height="108"></canvas><div class="nm"></div><div class="bub"></div></div>
<div class="cd"><div class="kind"></div><div class="art"></div><div class="big"></div><div class="gl"></div><div class="note"></div>
<form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Say it</button></form><div class="hint"></div>
<div class="row"><button type="button" class="idk">I don’t know (?)</button><span>Tab: a hint · Esc: stop</span></div></div></div>`;
    let quit = false, curFn = null;
    const P = open(html, e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); quit = true; if (curFn) curFn('quit'); }
      else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); if (STATE.cur) STATE.cur.hint(); }
    });
    const q = s => P.querySelector(s);
    const E = { dots: q('.dots'), bub: q('.bub'), cd: q('.cd'), kind: q('.kind'), art: q('.art'), big: q('.big'), gl: q('.gl'), note: q('.note'), form: q('form'), input: q('input'), hint: q('.hint'), idk: q('.idk') };
    face(q('.who canvas'), o.face); q('.who .nm').textContent = o.name || '';
    q('.stop').onclick = () => { quit = true; if (curFn) curFn('quit'); };
    const bubble = (pt, en) => { sayBub(E.bub, pt, en, E.input); E.bub.classList.toggle('hidden', !pt); };
    bubble(...(o.intro || []));
    const grades = [];
    try {
      for (let i = 0; i < list.length && !quit; i++) {
        const s = list[i];
        if (s.skip && s.skip()) continue;
        E.dots.innerHTML = list.map((_, k) => `<i class="${k < i ? 'f' : ''} ${k === i ? 'now' : ''}"></i>`).join('');
        if (s.say) bubble(s.say[0], s.say[1]);
        E.cd.classList.remove('ok'); E.kind.textContent = s.kind || '';
        E.art.innerHTML = ''; if (typeof s.art === 'function') s.art(E.art); else if (s.art) E.art.innerHTML = s.art;
        E.art.classList.toggle('hidden', !s.art);
        const model = typeof s.model === 'function' ? s.model() : (s.model || '');
        let shown = !!s.echo;
        const showBig = () => { E.big.textContent = model; E.big.classList.toggle('hidden', !model); };
        if (s.big) { E.big.innerHTML = s.big; E.big.classList.remove('hidden'); } else if (shown) showBig(); else E.big.classList.add('hidden');
        E.gl.innerHTML = s.gl || ''; E.gl.classList.toggle('hidden', !s.gl);
        E.note.innerHTML = s.note || ''; E.note.classList.toggle('hidden', !s.note);
        E.input.value = ''; E.input.placeholder = s.placeholder || (shown ? model : 'say it in Portuguese…');
        E.hint.className = 'hint'; E.hint.innerHTML = s.help || (shown ? 'Type it just like that (accents are optional).' : '');
        E.idk.classList.toggle('hidden', shown || !model);
        if (s.voice) setTimeout(() => say(s.voice === true ? model : s.voice), 200);
        // (live: a step that shows something as you type, e.g. baile.js's rhyme notebook)
        if (s.live) { const L = () => { try { s.live(E.input.value, E.art); } catch (e) { console.warn('[cvui] live', e); } }; E.input.oninput = L; L(); } else E.input.oninput = null;
        setTimeout(() => E.input.focus(), 40);
        let tries = 0, hints = 0, busy = false;
        const r = await new Promise(res => {
          curFn = v => { curFn = null; STATE.cur = null; res(v); };
          const reveal = auto => {
            if (!model) return; shown = true; showBig(); E.input.value = ''; E.input.placeholder = model;
            E.hint.className = 'hint no'; E.hint.innerHTML = (auto ? 'It’s ' : 'Here: ') + `<b>${esc(model)}</b>${s.modelEn ? ` <i>(${esc(s.modelEn)})</i>` : ''}. Type it!`;
            E.idk.classList.add('hidden'); say(model); E.input.focus();
          };
          const check = async text => {
            const t = String(text || '').trim(); if (!t || busy) return;
            if (!shown && model && idk(t)) { reveal(false); return; }
            let ok = false, minor = false, why = '', note = '', said = model;
            if (s.check) { const c = s.check(t) || {}; ok = !!c.ok; minor = !!c.minor; why = c.why || ''; note = c.note || ''; if (c.said) said = c.said; }
            else { const keys = [model].concat(s.keys || []).filter(Boolean); ok = has(t, keys); }
            if (ok) {
              busy = true;
              const g = GR[Math.min(4, tries + (minor ? 1 : 0) + (shown && !s.echo ? 2 : 0) + (hints > 1 ? 1 : 0))];
              E.cd.classList.add('ok'); snd(g === 'S' ? 'perfect' : 'review');
              E.hint.className = 'hint ok'; E.hint.innerHTML = `<span class="gr cv-${g}">${g}</span>✓ ${said ? esc(said) : ''}${note ? ' · ' + note : ''}`;
              E.input.blur();
              const out = { ok: true, grade: g, text: t, tries, shown, minor };
              try { if (s.onOk) await s.onOk(out, t, E.art); } catch (e) { console.warn('[cvui] onOk', e); }
              if (!STATE.fast) await tick(s.onOk ? 500 : 1000);
              if (curFn) curFn(out);
              return;
            }
            tries++; snd('wrong');
            E.cd.classList.remove('shake'); void E.cd.offsetWidth; E.cd.classList.add('shake');
            if (tries >= 2 && !shown && model) reveal(true);
            else { E.hint.className = 'hint no'; E.hint.innerHTML = why || (shown ? `Not quite: copy <b>${esc(model)}</b>` : 'Not quite. Try again! (Tab: a hint · ?: show me)'); }
            E.input.select();
          };
          STATE.cur = { get model() { return model; }, step: s, submit: check, idk: () => reveal(false),
            hint() { if (!model || shown) return; hints++; E.hint.className = 'hint'; E.hint.innerHTML = `<b style="letter-spacing:.06em">${esc(hintOf(model, hints))}</b>`; E.input.focus(); } };
          E.form.onsubmit = e => { e.preventDefault(); check(E.input.value); };
          E.idk.onclick = () => STATE.cur && STATE.cur.idk();
        });
        if (r === 'quit' || quit) return { quit: true };
        grades.push(r.grade);
        if (s.then) { try { s.then(r); } catch (e) { console.warn('[cvui] then', e); } }
      }
      return { done: true, grades };
    } finally { STATE.cur = null; close(); }
  }

  // ============================================================ a lesson: copy each phrase, then say each from a situation
  async function lesson(o) {
    const items = o.items, rec = o.recall !== false;
    const echo = items.map((it, i) => ({ kind: 'New · type it to learn it', echo: true, model: it.pt, modelEn: it.en, keys: it.keys, voice: it.pt,
      gl: `“${esc(it.en)}”`, note: esc(it.note || ''), say: it.say || (i === 0 && o.intro ? o.intro : null) }));
    const order = rec ? shuffle(items.map((_, i) => i)) : [];
    const recall = order.map((i, k) => ({ kind: 'From memory · what do you say?', model: items[i].pt, modelEn: items[i].en, keys: items[i].keys, gl: esc(items[i].sit || items[i].en),
      say: k === 0 ? (o.recallLine || ['Agora, sem olhar!', 'Now, without looking!']) : pick(PRAISE), idx: i }));
    const r = await steps(echo.concat(recall), { title: o.title, sub: o.sub, face: o.face, name: o.name, intro: o.intro });
    if (r.quit) return r;
    const clean = {};
    recall.forEach((s, k) => { const it = items[s.idx]; if (it.id) clean[it.id] = r.grades[items.length + k] === 'S'; });
    for (const it of items) if (it.id) teach(it.id);
    if (items.some(it => it.id)) { try { UI.toast('New in your journal’s Phrasebook: ' + items.filter(it => it.id).map(it => '«' + it.pt + '»').join(' · ')); } catch (e) { /* */ } }
    return { done: true, clean, grades: r.grades };
  }

  // ============================================================ the call bar (scenes in the world: the bateria, the parade)
  const HUD = { el: null, res: null, keys: null, q: null };
  function hudOpen(title) {
    css();
    if (!HUD.el) {
      const el = document.createElement('div'); el.id = 'cvhud'; el.className = 'hidden';
      el.innerHTML = `<div class="hd"></div><div class="cue"><div class="ic"></div><div><div class="t"></div><div class="sub"></div></div></div><form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Call it!</button><button type="button" class="help">?</button></form><div class="fb"></div><div class="bar"><b></b></div>`;
      document.body.appendChild(el); HUD.el = el;
      const q = s => el.querySelector(s); HUD.q = { hd: q('.hd'), ic: q('.ic'), t: q('.t'), sub: q('.sub'), form: q('form'), input: q('input'), help: q('.help'), fb: q('.fb'), bar: q('.bar b') };
      HUD.q.form.addEventListener('submit', e => { e.preventDefault(); const r = HUD.res; if (r) { HUD.res = null; r(HUD.q.input.value); } });
      HUD.q.help.onclick = () => { if (STATE.hcur) STATE.hcur.idk(); HUD.q.input.focus(); };
    }
    HUD.q.hd.textContent = title || ''; HUD.el.classList.remove('hidden'); document.body.classList.add('cv-hud');
    if (HUD.keys) removeEventListener('keydown', HUD.keys, true);
    HUD.keys = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); interrupt('quit'); } };
    addEventListener('keydown', HUD.keys, true);
    Input.typing = true; if (G) { G.state.teaching = true; G.prompt = null; }
  }
  function hudClose() {
    if (!HUD.el) return;
    HUD.el.classList.add('hidden'); document.body.classList.remove('cv-hud');
    if (HUD.keys) { removeEventListener('keydown', HUD.keys, true); HUD.keys = null; }
    Input.typing = false; if (G) G.state.teaching = false; STATE.hcur = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function hudCue(o) {
    const Q = HUD.q; if (!Q) return;
    Q.ic.innerHTML = '';
    if (o.iconKey && typeof ICONS !== 'undefined') { const cv = document.createElement('canvas'); cv.width = cv.height = 112; ICONS.draw(cv, o.iconKey); Q.ic.appendChild(cv); } else Q.ic.textContent = o.icon || '♪';
    Q.t.innerHTML = o.title || ''; Q.sub.innerHTML = o.sub || ''; Q.bar.style.width = Math.round((o.bar || 0) * 100) + '%';
  }
  const hudFb = (html, ok) => { if (!HUD.q) return; HUD.q.fb.className = 'fb ' + (ok === undefined ? '' : ok ? 'ok' : 'no'); HUD.q.fb.innerHTML = html || ''; };
  // a scene can end a call early (time ran out, the song moved on): call() resolves with why
  function interrupt(why) { const r = HUD.res; if (r) { HUD.res = null; r('\u0000' + why); } }
  // ask for one call until it's said (or shown, then moved on): → its grade, or 'quit' / an interrupt's why
  async function hudCall(o) {
    const Q = HUD.q, model = o.model || '', keys = [model].concat(o.keys || []).filter(Boolean);
    let tries = 0, shown = false;
    Q.input.value = ''; Q.input.placeholder = o.placeholder || 'call it in Portuguese…'; setTimeout(() => Q.input.focus(), 30);
    STATE.hcur = { model, submit(t) { if (HUD.res) { const r = HUD.res; HUD.res = null; Q.input.value = t; r(t); } },
      idk() { shown = true; hudFb(`Say <b>${esc(model)}</b>${o.modelEn ? ` (${esc(o.modelEn)})` : ''}`); say(model); } };
    for (;;) {
      const text = await new Promise(r => { HUD.res = r; });
      if (text && text[0] === '\u0000') { STATE.hcur = null; return text.slice(1); }
      const t = String(text || '').trim(); if (!t) continue;
      if (idk(t)) { STATE.hcur && STATE.hcur.idk(); Q.input.value = ''; continue; }
      let ok = false, minor = false, why = '';
      if (o.check) { const c = o.check(t) || {}; ok = !!c.ok; minor = !!c.minor; why = c.why || ''; } else ok = has(t, keys);
      if (ok) {
        const g = GR[Math.min(4, (shown ? 2 : 0) + tries + (minor ? 1 : 0))];
        snd(g === 'S' ? 'perfect' : 'review');
        hudFb(`<span class="gr cv-${g}">${g}</span>✓ ${esc(t)}`, true);
        Q.input.value = ''; STATE.hcur = null; return g;
      }
      tries++; snd('wrong');
      if (tries >= 3) { hudFb(`<span class="gr cv-D">D</span>It’s <b>${esc(model)}</b>. Onward!`, false); Q.input.value = ''; STATE.hcur = null; return 'D'; }
      hudFb(why || (tries >= 2 ? `Try <b>${esc(model)}</b>` : 'Not that one! (? shows it)'), false); Q.input.select();
    }
  }

  return {
    bind, esc, N, has, idk, hintOf, say, teach, keepFar, steps, lesson, confetti, face, open, close, GR, pick, shuffle, PRAISE,
    hud: { open: hudOpen, close: hudClose, cue: hudCue, call: hudCall, fb: hudFb, interrupt, get on() { return !!(HUD.el && !HUD.el.classList.contains('hidden')); } },
    get open_() { return STATE.open; }, get busy() { return STATE.open || !!(HUD.el && !HUD.el.classList.contains('hidden')); },
    get cur() { return STATE.cur; }, get hcur() { return STATE.hcur; },
    get fast() { return STATE.fast; }, set fast(v) { STATE.fast = !!v; },
  };
})();
