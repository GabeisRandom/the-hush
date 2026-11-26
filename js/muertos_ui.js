'use strict';
// The Día de Muertos panels (muertos.js; Spanish games only): a cream paper card under a string of papel picado, for the
// festival's lessons and its step-by-step commands (the altar, the bread, the paper, the rhymes, the interviews), and a
// call bar at the bottom of the screen for the night. Typed Spanish is matched without accents, case or punctuation.
// One global, MUI:
//   MUI.bind(game)
//   MUI.lesson({ title, sub, face, name, intro: [es, en], items: [{ id, es, en, note, sit, keys }], recall, outro: [es, en] })
//        → { done, clean: { id: bool } } | { quit }: each item copied (echo), then said from a situation (recall)
//   MUI.steps(steps, { title, sub, face, name }) → { done, grades: ['S'…'D'] } | { quit }
//        a step: { kind, big, gl, note, sit, art (html, or fn(el) that draws into it), say: [es, en], model, modelEn,
//                  keys (any of them said = ok) or check(text) → { ok, why, note, minor, said }, placeholder, echo, voice,
//                  onOk(result, text) (async: an animation before the next step), then(result) }
//        No fail states: after two misses the model shows, and saying it then is a D.
//   MUI.hud: open(title, { theme: 'dr' }?), call({ icon, title, sub, bar, model, modelEn, check }) → 'S'…'D' | 'quit', fb(html, ok), close()
//        (theme 'dr': Dominican bunting instead of papel picado, for domino.js's barrio chapters)
//   text: MUI.N (normalized), MUI.has(text, phrases), MUI.idk(text), MUI.sayES(text), MUI.esc
//   tests: MUI.cur / MUI.hcur ({ model, submit(text), idk(), hint() }) while a card or the bar waits; MUI.fast skips pauses
// Needs core.js, icons.js and audio.js; UI and Input at run time.

const MUI = (() => {
  let G = null;
  const bind = g => { G = g; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const N = s => norm(String(s == null ? '' : s).replace(/['’]/g, ' '));
  // does the text say one of these (whole words, in order)?
  const has = (text, list) => { const n = ' ' + N(text) + ' '; return (Array.isArray(list) ? list : [list]).some(k => k && n.includes(' ' + N(k) + ' ')); };
  const idk = t => /^\s*[?¿]+\s*$/.test(String(t || '')) || ['idk', 'i dont know', 'i don t know', 'dont know', 'no se', 'no lo se', 'ni idea'].includes(N(t));
  const hintOf = (s, n) => [...String(s)].map((ch, i) => (!/[a-záéíóúñü]/i.test(ch) || i === 0 || n >= 3 || (n >= 2 && i % 2 === 0) ? ch : '_')).join('');
  const sayES = s => { try { Sound.say(String(s).replace(/[¿?¡!«»"“”]/g, ''), 'es'); } catch (e) { /* no voice */ } };
  const snd = k => { try { Sound.play(k); } catch (e) { /* */ } };
  const wait = s => (typeof STORY !== 'undefined' && STORY.wait && document.hidden ? STORY.wait(s) : new Promise(r => setTimeout(r, s * 1000)));
  const GR = ['S', 'A', 'B', 'C', 'D'];
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const PRAISE = [['¡Eso!', 'That’s it!'], ['¡Muy bien!', 'Very good!'], ['¡Qué padre!', 'How cool!'], ['¡Perfecto!', 'Perfect!']];

  // a string of papel picado for the card's top edge (drawn once: six flags, each with its cut-outs)
  let PP = null;
  function strip() {
    if (PP) return PP;
    const cv = document.createElement('canvas'); cv.width = 312; cv.height = 34; const c = cv.getContext('2d');
    const cols = ['#e2337f', '#f39a1e', '#7b4bb0', '#1fa3a0', '#f5c518', '#3fa34d'];
    c.strokeStyle = '#2b2235'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 3); c.lineTo(312, 3); c.stroke();
    cols.forEach((col, i) => {
      const x = i * 52 + 4, w = 44;
      c.fillStyle = col; c.beginPath(); c.moveTo(x, 3); c.lineTo(x + w, 3); c.lineTo(x + w, 26);
      for (let k = 0; k < 5; k++) c.quadraticCurveTo(x + w - k * (w / 5) - w / 10, 32, x + w - (k + 1) * (w / 5), 26);
      c.closePath(); c.fill();
      c.globalCompositeOperation = 'destination-out';
      c.beginPath(); c.arc(x + w / 2, 14, 4.5, 0, TAU); c.fill();
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + w / 2 + s * 13, 9); c.lineTo(x + w / 2 + s * 16, 14); c.lineTo(x + w / 2 + s * 13, 19); c.lineTo(x + w / 2 + s * 10, 14); c.closePath(); c.fill(); }
      for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x + 7 + k * 10, 23, 1.6, 0, TAU); c.fill(); }
      c.globalCompositeOperation = 'source-over';
    });
    return (PP = cv.toDataURL());
  }
  // (theme 'dr', for Don Fello's barrio: a string of triangle flags in blue, red, white, yellow and green, like the colmado's)
  let BU = null;
  function bunting() {
    if (BU) return BU;
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 26; const c = cv.getContext('2d');
    const cols = ['#1f4fa0', '#d9493b', '#fffaf0', '#ffd166', '#4f9a5a'];
    c.strokeStyle = '#5b3a22'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 3); c.lineTo(300, 3); c.stroke();
    for (let i = 0; i < 10; i++) { c.fillStyle = cols[i % 5]; c.beginPath(); c.moveTo(i * 30 + 3, 3); c.lineTo(i * 30 + 27, 3); c.lineTo(i * 30 + 15, 22); c.closePath(); c.fill(); c.strokeStyle = 'rgba(43,34,53,.5)'; c.lineWidth = 1; c.stroke(); }
    return (BU = cv.toDataURL());
  }
  const CSS = () => `
#muov { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; font-family: "Trebuchet MS", "Segoe UI", system-ui, sans-serif; color: #2b2235; -webkit-font-smoothing: antialiased; }
#muov.hidden, #muov .hidden { display: none !important; } #muov * { box-sizing: border-box; }
#muov .sh { position: absolute; inset: 0; background: radial-gradient(circle at 50% 40%, rgba(70,30,70,.38), rgba(30,14,40,.62)); }
#muov .pn { position: relative; width: min(1120px, calc(100vw - 16px)); max-height: calc(100vh - 16px); background: #fff8ec; border: 3px solid #2b2235; border-radius: 20px; box-shadow: 0 0 0 6px #fff, 0 12px 0 5px rgba(43,34,53,.25); overflow: hidden; }
#muov .pp { height: 34px; background: url(${strip()}) repeat-x 0 0; border-bottom: 2px dashed rgba(43,34,53,.15); }
#muov .hd { display: flex; align-items: center; gap: 12px; padding: 6px 16px 8px; }
#muov .hd b { font: 800 21px Bahnschrift, "Segoe UI", sans-serif; } #muov .hd .t { font-weight: 800; opacity: .65; }
#muov .hd .dots { margin-left: auto; display: flex; gap: 4px; flex-wrap: wrap; max-width: 46%; } #muov .hd .dots i { width: 11px; height: 11px; border-radius: 50%; border: 2px solid #e2337f; } #muov .hd .dots i.f { background: #f39a1e; border-color: #c76a10; } #muov .hd .dots i.now { box-shadow: 0 0 0 3px #ffd166; }
#muov button { font: inherit; font-weight: 800; font-size: 14px; color: #2b2235; background: #fff8ec; border: 2.5px solid #2b2235; border-radius: 12px; padding: 4px 11px; cursor: pointer; box-shadow: 0 3px 0 rgba(43,34,53,.18); }
#muov button:hover { background: #ffe7c2; } #muov button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(43,34,53,.18); }
#muov button.go { background: #e2337f; color: #fff; } #muov button.go:hover { background: #f0479a; }
#muov kbd { font: 800 11px "Segoe UI", sans-serif; border: 1.5px solid currentColor; border-radius: 5px; padding: 0 4px; margin-left: 3px; }
#muov .bd { display: grid; grid-template-columns: 220px 1fr; gap: 18px; padding: 10px 22px 18px; overflow: auto; max-height: calc(100vh - 100px); }
#muov .who { display: flex; flex-direction: column; align-items: center; gap: 9px; }
#muov .who canvas { width: 108px; height: 108px; border-radius: 50%; border: 3px solid #2b2235; background: #ffe9c9; }
#muov .who .nm { font: 800 15px Bahnschrift, sans-serif; text-align: center; }
#muov .bub { position: relative; background: #fff; border: 2.5px solid #2b2235; border-radius: 16px; padding: 8px 12px; font-size: 17px; font-weight: 700; line-height: 1.45; box-shadow: 0 3px 0 rgba(43,34,53,.15); }
#muov .bub i { display: block; font-size: 12.5px; font-weight: 600; opacity: .7; margin-top: 3px; line-height: 1.35; }
#muov .bub .mu-enb { float: right; font: 800 11px "Segoe UI", sans-serif; color: #2b2235; background: #fffaf0; border: 2px solid #2b2235; border-radius: 8px; padding: 0 6px; margin: 0 0 2px 8px; cursor: pointer; box-shadow: none; }
#muov .cd { background: #fff; border: 3px solid #2b2235; border-radius: 18px; padding: 12px 18px 14px; box-shadow: 0 5px 0 rgba(43,34,53,.15); display: flex; flex-direction: column; gap: 7px; align-self: start; }
#muov .cd.ok { box-shadow: 0 0 0 4px #1fa3a0, 0 5px 0 rgba(43,34,53,.15); }
#muov .cd .kind { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #c2185b; }
#muov .cd .big { font: 900 36px Bahnschrift, "Segoe UI", sans-serif; color: #c2185b; line-height: 1.2; }
#muov .cd .art { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; }
#muov .cd .art canvas { max-width: 100%; border-radius: 14px; }
#muov .cd .gl { font-size: 18px; font-weight: 800; line-height: 1.4; } #muov .cd .note { font-size: 14px; opacity: .82; line-height: 1.45; }
#muov .cd .sit { font-size: 19px; font-weight: 800; line-height: 1.35; }
#muov .cd form { display: flex; gap: 8px; }
#muov .cd input { flex: 1; min-width: 0; font: 600 21px "Segoe UI", sans-serif; padding: 6px 10px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; }
#muov .cd input:focus { box-shadow: 0 0 0 3px rgba(226,51,127,.3); }
#muov .cd .hint { font: 700 15px "Trebuchet MS", sans-serif; min-height: 22px; line-height: 1.45; }
#muov .cd .hint.no { color: #b3261e; } #muov .cd .hint.ok { color: #13786b; } #muov .cd .hint.tip { color: #c2185b; letter-spacing: .05em; font-size: 18px; }
#muov .cd .row { display: flex; gap: 8px; align-items: center; font-size: 12px; font-weight: 700; flex-wrap: wrap; } #muov .cd .row span { opacity: .6; }
#muov .shake { animation: mu-shake .35s; } @keyframes mu-shake { 20% { transform: translateX(-8px); } 45% { transform: translateX(7px); } 70% { transform: translateX(-4px); } }
.mu-gr { display: inline-block; font: 900 15px Bahnschrift, sans-serif; color: #fff; border: 2.5px solid #2b2235; border-radius: 99px; padding: 0 10px; margin-right: 6px; transform: rotate(-3deg); }
.mu-gr.S { background: #e0a020; } .mu-gr.A { background: #1fa3a0; } .mu-gr.B { background: #3f7fc9; } .mu-gr.C { background: #8a5ab0; } .mu-gr.D { background: #8a8f9e; }
body.mu-open #objective, body.mu-open #counters, body.mu-open #help, body.mu-open #compass, body.mu-open #minimap, body.mu-open .bubble, body.mu-open #thought, body.mu-open .prompt { display: none !important; }
@media (max-width: 860px) { #muov .bd { grid-template-columns: 1fr; } #muov .who { flex-direction: row; } }
#muhud { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 11; width: min(600px, calc(100vw - 24px)); background: #fff8ec; border: 3px solid #2b2235; border-radius: 18px; box-shadow: 0 0 0 5px #fff, 0 10px 0 4px rgba(43,34,53,.22); padding: 0 14px 12px; font-family: "Trebuchet MS", "Segoe UI", sans-serif; color: #2b2235; overflow: hidden; }
#muhud.hidden { display: none; } #muhud * { box-sizing: border-box; }
#muhud .pp { height: 26px; margin: 0 -14px 4px; background: url(${strip()}) repeat-x 0 -4px; }
#muhud.dr .pp { background: url(${bunting()}) repeat-x 0 0; } #muhud.dr .hd { color: #1f4fa0; } #muhud.dr button.go { background: #d9493b; color: #fff; }
#muhud.dr .bar b { background: linear-gradient(90deg, #1f4fa0, #d9493b); }
#muhud .hd { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #c2185b; }
#muhud .cue { display: flex; align-items: center; gap: 12px; margin-top: 3px; }
#muhud canvas { width: 64px; height: 64px; border-radius: 14px; background: #3a2a4a; border: 3px solid #2b2235; flex: 0 0 auto; }
#muhud .t { font: 800 19px Bahnschrift, "Segoe UI", sans-serif; line-height: 1.25; } #muhud .sub { font-size: 13px; font-weight: 700; opacity: .72; line-height: 1.4; }
#muhud form { display: flex; gap: 8px; margin-top: 8px; }
#muhud input { flex: 1; min-width: 0; font: 600 20px "Segoe UI", sans-serif; padding: 5px 10px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; }
#muhud button { font: inherit; font-weight: 800; font-size: 15px; color: #2b2235; border: 2.5px solid #2b2235; border-radius: 12px; padding: 4px 12px; background: #fff8ec; cursor: pointer; } #muhud button.go { background: #f39a1e; color: #2b2235; }
#muhud .fb { min-height: 22px; margin-top: 6px; font-weight: 800; font-size: 15px; line-height: 1.45; } #muhud .fb.ok { color: #13786b; } #muhud .fb.no { color: #b3261e; }
#muhud .bar { height: 10px; border-radius: 99px; background: rgba(43,34,53,.12); overflow: hidden; margin-top: 7px; } #muhud .bar b { display: block; height: 100%; background: linear-gradient(90deg, #f39a1e, #f5c518); transition: width .3s; }
body.mu-hud .bubble, body.mu-hud #thought, body.mu-hud .prompt, body.mu-hud #objective { display: none !important; }
`;
  function css() { if (document.getElementById('mu-css')) return; const s = document.createElement('style'); s.id = 'mu-css'; s.textContent = CSS(); document.head.appendChild(s); }

  // ================================================================ the card
  const OV = { root: null, keys: null, open: false };
  const st = { fast: false, cur: null, hcur: null };
  function open(o) {
    css();
    if (!OV.root) { const r = document.createElement('div'); r.id = 'muov'; r.className = 'hidden'; r.innerHTML = '<div class="sh"></div><div class="pn"></div>'; document.body.appendChild(r); OV.root = r; OV.pn = r.querySelector('.pn'); }
    OV.pn.innerHTML = `<div class="pp"></div><div class="hd"><b></b><span class="t"></span><span class="dots"></span><button type="button" class="stop">Stop <kbd>Esc</kbd></button></div>
<div class="bd"><div class="who"><canvas width="108" height="108"></canvas><div class="nm"></div><div class="bub"></div></div>
<div class="cd"><div class="kind"></div><div class="big"></div><div class="art"></div><div class="gl"></div><div class="note"></div><div class="sit"></div>
<form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Say it</button></form><div class="hint"></div>
<div class="row"><button type="button" class="idk">Show me (?)</button><span>Tab: a hint · Esc: stop</span></div></div></div>`;
    const q = s => OV.pn.querySelector(s);
    const E = { title: q('.hd b'), sub: q('.hd .t'), dots: q('.dots'), stop: q('.stop'), face: q('.who canvas'), nm: q('.who .nm'), bub: q('.bub'), cd: q('.cd'), kind: q('.kind'), big: q('.big'), art: q('.art'), gl: q('.gl'),
      note: q('.note'), sit: q('.sit'), form: q('form'), input: q('input'), hint: q('.hint'), idk: q('.idk'), quit: null };
    E.title.textContent = o.title || ''; E.sub.textContent = o.sub || ''; E.nm.textContent = o.name || '';
    try { if (typeof ICONS !== 'undefined') ICONS.draw(E.face, o.face || 'star'); } catch (e) { /* */ }
    OV.root.classList.remove('hidden'); document.body.classList.add('mu-open'); OV.open = true;
    if (OV.keys) removeEventListener('keydown', OV.keys, true);
    OV.keys = e => { if (e.isComposing) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (E.quit) E.quit(); } else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); if (st.cur) st.cur.hint(); } };
    addEventListener('keydown', OV.keys, true);
    E.stop.onclick = () => { if (E.quit) E.quit(); };
    Input.typing = true; if (G) { G.state.teaching = true; G.prompt = null; }
    return E;
  }
  function close() {
    if (!OV.root) return;
    OV.root.classList.add('hidden'); document.body.classList.remove('mu-open'); OV.open = false;
    if (OV.keys) { removeEventListener('keydown', OV.keys, true); OV.keys = null; }
    Input.typing = false; if (G) G.state.teaching = false; st.cur = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  // a line in the bubble, by the weave like every line (DESIGN.md 17.3): mixed (the English with the words you know in Spanish),
  // whole in Spanish as the weave rises; its English only on request (EN on the bubble), never under it by default
  const bub = (E, l) => {
    E.bub.classList.toggle('hidden', !l); if (!l) { E.bub.innerHTML = ''; return; }
    const t = l[0], en = l[1];
    if (!t) { E.bub.innerHTML = en ? `<i>${esc(en)}</i>` : ''; return; }
    let html = esc(t);
    try { if (en && typeof STORY !== 'undefined' && STORY.mixHTML) html = STORY.mixHTML(t, en, { key: 'mu:' + en }).html; } catch (e) { /* (as written) */ }
    E.bub.innerHTML = (en ? '<button type="button" class="mu-enb" title="This line in English">EN</button>' : '') + html + (en ? `<i class="hidden">${esc(en)}</i>` : '');
    const b = E.bub.querySelector('.mu-enb'), tr = E.bub.querySelector('i');
    if (b) b.onclick = ev => { ev.stopPropagation(); tr.classList.toggle('hidden'); if (E.input) E.input.focus(); };
  };
  const dots = (E, i, n) => { E.dots.innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'f' : ''} ${k === i ? 'now' : ''}"></i>`).join(''); };
  // one step: → { ok, grade, clean, text, r } | 'quit'
  function step(E, s, i, n) {
    return new Promise(res => {
      let tries = 0, hints = 0, shown = !!s.echo, done = false;
      dots(E, i, n);
      if (s.say) bub(E, s.say);
      E.cd.classList.remove('ok');
      E.kind.textContent = s.kind || '';
      E.big.innerHTML = s.big ? esc(s.big) : ''; E.big.classList.toggle('hidden', !s.big);
      E.art.innerHTML = ''; if (typeof s.art === 'function') { try { s.art(E.art); } catch (e) { console.error('[mui] art', e); } } else if (s.art) E.art.innerHTML = s.art;
      E.art.classList.toggle('hidden', !s.art);
      E.gl.innerHTML = s.gl || ''; E.gl.classList.toggle('hidden', !s.gl);
      E.note.innerHTML = s.note || ''; E.note.classList.toggle('hidden', !s.note);
      E.sit.innerHTML = s.sit || ''; E.sit.classList.toggle('hidden', !s.sit);
      E.idk.classList.toggle('hidden', !!s.echo || !s.model);
      E.input.value = ''; E.input.placeholder = s.placeholder || (s.echo ? s.model : 'say it in Spanish…'); E.input.disabled = false;
      const tip = (html, cls) => { E.hint.className = 'hint ' + (cls || ''); E.hint.innerHTML = html || ''; };
      tip(s.help || (s.echo ? 'Type it just like that (accents and ¿¡ don’t matter)' : ''), '');
      if (s.voice) setTimeout(() => sayES(s.voice), 160);
      setTimeout(() => E.input.focus(), 40);
      const fin = v => { if (done) return; done = true; st.cur = null; E.quit = null; res(v); };
      E.quit = () => fin('quit');
      const showModel = () => { shown = true; tip(`Here: <b>«${esc(s.model)}»</b>${s.modelEn ? ` <i>(${esc(s.modelEn)})</i>` : ''}. Type it!`, ''); sayES(s.model); E.input.value = ''; E.input.focus(); };
      const submit = async text => {
        const t = String(text || '').trim(); if (!t || done || E.input.disabled) return;
        if (!s.echo && s.model && idk(t)) { showModel(); return; }
        let c;
        try { c = s.check ? (s.check(t) || {}) : { ok: has(t, s.keys || [s.model]) }; } catch (e) { console.error('[mui] check', e); c = { ok: false }; }
        if (c.ok) {
          const grade = s.echo ? 'S' : shown ? 'D' : GR[Math.min(3, tries + Math.min(1, hints) + (c.minor ? 1 : 0))];
          E.input.disabled = true; E.cd.classList.add('ok'); snd(s.echo ? 'learned' : grade === 'S' ? 'perfect' : 'review');
          tip(`${s.echo ? '' : `<span class="mu-gr ${grade}">${grade}</span>`}✓ ${esc(c.said || t)}${c.note ? ' · ' + c.note : ''}${s.after ? ' · ' + s.after : ''}`, 'ok');
          if (s.big && !s.echo) E.big.classList.remove('hidden');
          const r = { ok: true, grade, clean: !tries && !hints && !shown, text: t, r: c };
          try { if (s.onOk) await s.onOk(c, t); } catch (e) { console.error('[mui] onOk', e); }
          if (!st.fast) await wait(c.pause || 1.1);
          try { if (s.then) s.then(r); } catch (e) { console.error('[mui] then', e); }
          fin(r); return;
        }
        tries++; snd('wrong');
        E.cd.classList.remove('shake'); void E.cd.offsetWidth; E.cd.classList.add('shake');
        if (s.model && tries >= 2 && !shown) { shown = true; tip((c.why ? c.why + '<br>' : '') + `Try: <b>«${esc(s.model)}»</b>${s.modelEn ? ` <i>(${esc(s.modelEn)})</i>` : ''}`, 'no'); }
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
  // a lesson: every item copied, then (recall) each one said from a situation, in a new order
  async function lesson(o) {
    const items = o.items, rec = o.recall !== false, n = items.length * (rec ? 2 : 1), clean = {};
    const E = open(o);
    if (o.intro) bub(E, o.intro);
    try {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (i && it.say) bub(E, it.say);
        const r = await step(E, { kind: 'New · type it to learn it', big: it.es, gl: `“${esc(it.en)}”`, note: esc(it.note || ''), art: it.art, model: it.es, keys: it.keys, echo: true, voice: it.es }, i, n);
        if (r === 'quit') return { quit: true };
      }
      if (rec) {
        bub(E, o.recallLine || ['¡Muy bien! Ahora, sin mirar.', 'Great! Now, without looking.']);
        const order = shuffle(items.map((_, i) => i));
        for (let k = 0; k < order.length; k++) {
          const it = items[order[k]];
          const r = await step(E, { kind: 'From memory · what do you say?', sit: esc(it.sit || it.en), art: it.artRecall, model: it.es, modelEn: it.en, keys: it.keys }, items.length + k, n);
          if (r === 'quit') return { quit: true };
          clean[it.id] = r.clean;
          bub(E, r.clean ? pick(PRAISE) : ['Bien. Esa la repasamos otra vez.', 'Good. We’ll go over that one again.']);
        }
      }
      if (o.outro) {
        bub(E, o.outro);
        E.kind.textContent = 'Done!'; E.big.classList.remove('hidden'); E.big.innerHTML = items.map(it => esc(it.es)).join(' · '); E.big.style.fontSize = '22px';
        [E.gl, E.sit, E.art, E.idk].forEach(x => x.classList.add('hidden')); E.note.classList.remove('hidden'); E.note.textContent = o.outroNote || 'They’re in your journal’s Phrasebook now.';
        E.hint.className = 'hint'; E.hint.textContent = 'Enter: carry on'; E.cd.classList.add('ok'); snd('chest'); E.input.value = ''; E.input.placeholder = '(Enter)'; E.input.disabled = false;
        if (!st.fast) await new Promise(res => { const go = () => { st.cur = null; E.quit = null; res(); }; E.form.onsubmit = e => { e.preventDefault(); go(); }; E.quit = go; st.cur = { model: '', submit: go, idk: go, hint() {} }; setTimeout(() => E.input.focus(), 40); });
        E.big.style.fontSize = '';
      }
      return { done: true, clean };
    } finally { close(); }
  }

  // ================================================================ the call bar (the night)
  const H = { el: null, q: null, res: null, keys: null };
  const hud = {
    open(title, theme) {
      css();
      if (!H.el) {
        const el = document.createElement('div'); el.id = 'muhud'; el.className = 'hidden';
        el.innerHTML = `<div class="pp"></div><div class="hd"></div><div class="cue"><canvas width="128" height="128"></canvas><div><div class="t"></div><div class="sub"></div></div></div><form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Say it!</button><button type="button" class="help">?</button></form><div class="fb"></div><div class="bar"><b></b></div>`;
        document.body.appendChild(el); H.el = el;
        const q = s => el.querySelector(s); H.q = { hd: q('.hd'), cv: q('canvas'), t: q('.t'), sub: q('.sub'), form: q('form'), input: q('input'), help: q('.help'), fb: q('.fb'), bar: q('.bar b') };
        H.q.form.addEventListener('submit', e => { e.preventDefault(); const r = H.res; if (r) { H.res = null; r(H.q.input.value); } });
        H.q.help.onclick = () => { if (st.hcur) st.hcur.idk(); H.q.input.focus(); };
      }
      H.q.hd.textContent = title || ''; H.el.classList.toggle('dr', !!(theme && theme.theme === 'dr')); H.el.classList.remove('hidden'); document.body.classList.add('mu-hud');
      H.keys = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); const r = H.res; if (r) { H.res = null; r('\u0000quit'); } } };
      addEventListener('keydown', H.keys, true);
      Input.typing = true; if (G) { G.state.teaching = true; G.prompt = null; }
    },
    close() {
      if (!H.el) return;
      H.el.classList.add('hidden'); document.body.classList.remove('mu-hud');
      if (H.keys) { removeEventListener('keydown', H.keys, true); H.keys = null; }
      Input.typing = false; if (G) G.state.teaching = false; st.hcur = null;
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    },
    fb(html, ok) { if (!H.q) return; H.q.fb.className = 'fb ' + (ok === undefined ? '' : ok ? 'ok' : 'no'); H.q.fb.innerHTML = html || ''; },
    cue(o) {
      const Q = H.q; Q.t.innerHTML = o.title || ''; Q.sub.innerHTML = o.sub || ''; Q.bar.style.width = Math.round((o.bar || 0) * 100) + '%';
      try { if (o.draw) { const c = Q.cv.getContext('2d'); c.clearRect(0, 0, 128, 128); o.draw(c, 128); } else if (o.icon && typeof ICONS !== 'undefined') ICONS.draw(Q.cv, o.icon); } catch (e) { /* */ }
    },
    // ask until it's said (or shown and said): → 'S'…'D', or 'quit'
    async call(o) {
      hud.cue(o); const Q = H.q; let tries = 0, shown = false;
      Q.input.value = ''; Q.input.placeholder = o.placeholder || 'say it in Spanish…'; hud.fb(o.help || '');
      setTimeout(() => Q.input.focus(), 30);
      st.hcur = { model: o.testAnswer || o.model, submit: v => { const r = H.res; if (r) { H.res = null; Q.input.value = v; r(v); } }, idk() { shown = true; hud.fb(`Say: <b>«${esc(o.model)}»</b>${o.modelEn ? ` <i>(${esc(o.modelEn)})</i>` : ''}`); sayES(o.model); }, hint() {} };
      for (;;) {
        const text = await new Promise(r => { H.res = r; });
        if (text && text[0] === '\u0000') { st.hcur = null; return text.slice(1); }
        const t = String(text || '').trim(); if (!t) continue;
        if (idk(t)) { st.hcur.idk(); Q.input.value = ''; continue; }
        let c; try { c = o.check ? (o.check(t) || {}) : { ok: has(t, o.keys || [o.model]) }; } catch (e) { c = { ok: false }; }
        if (c.ok) {
          const g = shown ? 'D' : GR[Math.min(3, tries + (c.minor ? 1 : 0))];
          snd(g === 'S' ? 'perfect' : 'review'); hud.fb(`<span class="mu-gr ${g}">${g}</span>✓ ${esc(t)}${c.note ? ' · ' + c.note : ''}`, true);
          Q.input.value = ''; st.hcur = null; return g;
        }
        tries++; snd('wrong');
        if (tries >= 2 && !shown) { shown = true; hud.fb((c.why ? c.why + ' ' : '') + `Try: <b>«${esc(o.model)}»</b>`, false); sayES(o.model); }
        else hud.fb(c.why || 'Not quite! (? shows it)', false);
        Q.input.select();
      }
    },
    get open_() { return !!(H.el && !H.el.classList.contains('hidden')); },
  };

  return { bind, esc, N, has, idk, hintOf, sayES, pick, shuffle, GR, lesson, steps, hud, close, css, strip,
    get cur() { return st.cur; }, get hcur() { return st.hcur; }, get fast() { return st.fast; }, set fast(v) { st.fast = !!v; }, get isOpen() { return OV.open; } };
})();
