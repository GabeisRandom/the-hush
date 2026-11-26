'use strict';
// The credits (Chapter 4's finale, «Toda voz cuenta»): a screen of its own over the game, drawn frame by frame from the game's loop
// (FIN.tick → FINCRED.frame), so tests can step it. Alba at night, and the whole town floating paper lanterns that rise this time
// (on Lantern Night, his sank); «Fin»; then the program scrolls by: the speech as a script, with the lines you whispered in your own
// hand and their letters; the cast of each place, long ago, today and tomorrow; the finale's songs; your journey. E speeds it up;
// at the end, E closes it. No real names (the user's own can be added on request).
//   FINCRED.roll() → Promise (resolves when it's closed) · on · song() · frame(dt) · init(game)
const FINCRED = (() => {
  if (typeof FIN === 'undefined' || typeof FINTXT === 'undefined') return null;
  let G = null, C = null;
  const X = () => FINTXT;
  const lang = () => (G && G.state && G.state.lang) || 'es';
  const isCl = l => l === 'zh' || l === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pick = (T, l = lang()) => (T ? T[l] || T.es || T.en || '' : '');
  const tH = (t, l = lang()) => FIN.tHTML(t, l);
  const plain = (t, l = lang()) => FIN.plainT(t, l);

  function css() {
    if (document.getElementById('fincred-css')) return;
    const s = document.createElement('style'); s.id = 'fincred-css';
    s.textContent = `#fin-cred { position: fixed; inset: 0; z-index: 61; background: #0a0b1e; overflow: hidden; color: #f4ecdc; font-family: Bahnschrift, "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif; }
#fin-cred canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
#fin-cred .fin { position: absolute; left: 0; right: 0; top: 34%; text-align: center; opacity: 0; pointer-events: none; }
#fin-cred .fin .big { font: italic 700 clamp(56px, 9vw, 110px) Georgia, "Yu Mincho", "Microsoft YaHei", serif; color: #ffd98a; text-shadow: 0 4px 0 #000, 0 0 30px rgba(255,200,110,.35); }
#fin-cred .fin .en { font-size: 16px; opacity: .7; margin-top: 4px; }
#fin-cred .roll { position: absolute; left: 50%; width: min(620px, 90vw); transform: translateX(-50%); top: 0; text-align: center; opacity: 0; }
#fin-cred .roll h2 { font: italic 700 40px Georgia, "Yu Mincho", "Microsoft YaHei", serif; color: #ffd98a; margin: 0 0 4px; text-shadow: 0 3px 0 #000; }
#fin-cred .roll h3 { font: 800 14px Bahnschrift, "Segoe UI", sans-serif; letter-spacing: .3em; text-transform: uppercase; color: #ffd98a; margin: 46px 0 12px; opacity: .9; }
#fin-cred .roll .sub { opacity: .75; font-size: 15px; }
#fin-cred .roll .ln { font-size: 18px; line-height: 1.45; margin: 7px 0; text-shadow: 0 2px 0 #000; }
#fin-cred .roll .ln.you { font-family: "Segoe Print", "Segoe Script", "Comic Sans MS", cursive; color: #bfe0ff; }
#fin-cred .roll .ln .gr { display: inline-block; margin-left: 8px; font: 800 13px Bahnschrift, sans-serif; color: #ffd98a; border: 1.5px solid #ffd98a; border-radius: 4px; padding: 0 5px; vertical-align: 2px; }
#fin-cred .roll .ln.act { margin-top: 18px; font: 800 13px Bahnschrift, sans-serif; letter-spacing: .25em; color: #ffd98a; }
#fin-cred .roll .cast { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 14px; font-size: 14px; text-align: center; }
#fin-cred .roll .cast .pl { grid-column: 1 / 4; margin-top: 14px; font-weight: 800; color: #ffe6b0; font-size: 15px; }
#fin-cred .roll .cast .hd { font-weight: 800; opacity: .75; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }
#fin-cred .roll .cast .cw.past { color: #f1d39a; } #fin-cred .roll .cast .cw.future { color: #c9d6ff; }
#fin-cred .roll .row { font-size: 16px; margin: 5px 0; } #fin-cred .roll .row b { color: #ffd98a; }
#fin-cred .roll .last { margin-top: 70px; font: italic 700 34px Georgia, "Yu Mincho", "Microsoft YaHei", serif; color: #ffd98a; }
#fin-cred .key { position: absolute; right: 18px; bottom: 14px; font-size: 13px; opacity: .55; } #fin-cred .key kbd { border: 1.5px solid currentColor; border-radius: 5px; padding: 0 5px; }`;
    document.head.appendChild(s);
  }

  // ------------------------------------------------------------ the program
  const CASTS = () => [
    ['alba', typeof APTXT !== 'undefined' && APTXT && APTXT.CAST, ['Doña Rosa', 'Bruno', 'Marta', 'Nico', 'Hugo', 'Tina'], typeof AFTXT !== 'undefined' && AFTXT && AFTXT.NAMES && ['beto', 'sofi', 'luci', 'sami', 'nilo', 'tadeo'].reduce((o, k) => { if (AFTXT.NAMES[k]) o[k] = AFTXT.NAMES[k]; return o; }, {})],
    ['molinar', typeof MPTXT !== 'undefined' && MPTXT && MPTXT.CAST, ['Marga', 'Ciro', 'Tomás', 'Lupe'], typeof MFTXT !== 'undefined' && MFTXT && MFTXT.CAST],
    ['lake', typeof LPTXT !== 'undefined' && LPTXT && LPTXT.CAST, ['Lalo', 'Marina', 'Bartolo', 'Vicente'], typeof LFTXT !== 'undefined' && LFTXT && LFTXT.CAST],
    ['quarry', typeof QPTXT !== 'undefined' && QPTXT && QPTXT.CAST, ['Cande', 'Pío', 'Efraín', 'Paco', 'Rocío'], typeof QFTXT !== 'undefined' && QFTXT && QFTXT.CAST],
    ['gardens', typeof GPTXT !== 'undefined' && GPTXT && GPTXT.CAST, ['Flora', 'Melisa', 'Tomasa', 'Polo'], typeof GFTXT !== 'undefined' && GFTXT && GFTXT.CAST],
    ['peaks', typeof PKPTXT !== 'undefined' && PKPTXT && PKPTXT.CAST, ['Lía', 'Tobías', 'Rafa', 'Inés'], typeof PKFTXT !== 'undefined' && PKFTXT && PKFTXT.CAST],
    ['port', typeof PTPTXT !== 'undefined' && PTPTXT && PTPTXT.CAST, ['Marino', 'Dora', 'Quino', 'Eloy'], typeof PTFTXT !== 'undefined' && PTFTXT && PTFTXT.CAST],
    ['ruins', typeof RUPTXT !== 'undefined' && RUPTXT && RUPTXT.CAST, ['Fermín', 'Elvira', 'Tula', 'Darío', 'Nadia', 'Salomé'], typeof RUFTXT !== 'undefined' && RUFTXT && RUFTXT.CAST],
    ['marsh', typeof MHPTXT !== 'undefined' && MHPTXT && MHPTXT.CAST, ['Lucero', 'Tadeo', 'Ramiro', 'Lolo', 'Mati'], typeof MHFTXT !== 'undefined' && MHFTXT && MHFTXT.CAST],
  ];
  // a cast table's names in the language (zh / ja: the mode's text), the first few
  function names(T, n = 6) {
    if (!T || typeof T !== 'object') return [];
    const l = lang(), out = [];
    for (const v of Object.values(T)) { const s = v && typeof v === 'object' ? (v[l] || v.es || v.en) : typeof v === 'string' ? v : ''; if (s && typeof s === 'string') { const p = plain(s, l); if (p && !out.includes(p)) out.push(p); } if (out.length >= n) break; }
    return out;
  }
  function programHTML() {
    const l = lang(), S0 = FIN.st(), Sl = X().SLIP[l] || X().SLIP.es;
    const motto = typeof PTXT !== 'undefined' && PTXT.NAMES && PTXT.NAMES.motto ? PTXT.pick(PTXT.NAMES.motto, l) : X().CREDITS.motto.es;
    let h = `<h2>«${tH(motto, l)}»</h2><div class="sub">${esc(X().CREDITS.sub)}</div>`;
    // the speech as a script: his lines, and yours in your own hand
    h += `<h3>${esc(X().CREDITS.speech)}</h3>`;
    const ln = (t, cls, gr) => `<div class="ln ${cls || ''}">${tH(t, l)}${gr ? `<span class="gr">${esc(gr)}</span>` : ''}</div>`;
    for (const it of X().SPEECH) {
      if (it.act) { const RL = TIME.RULES[it.act]; h += `<div class="ln act">${['I', 'II', 'III'][{ past: 0, now: 1, future: 2 }[it.act]]} · «${tH(RL.name[l] || '', l)}»</div>`; continue; }
      if (it.echo || it.pick) { const W = FIN.echo(it.echo || it.pick); if (W) h += ln(W[l] || W.es || ''); continue; }
      if (it.bridge) { const T = X().TASKS[it.bridge], y = (S0.lines || {})[it.bridge]; h += ln(y || (T.model || {})[l] || '', 'you', (S0.bridges || {})[it.bridge]); continue; }
      if (it.line) { h += ln(pick(X().LINES[it.line], l)); continue; }
      if (it.laugh) { h += ln(Sl.slip) + ln(Sl.joke); continue; }
      if (it.thanks) h += ln(Sl.right);
    }
    if (S0.letter) h += `<div class="row" style="margin-top:14px">The curtain call: <b>${esc(S0.letter)}</b></div>`;
    // the cast: each place, long ago · today · tomorrow
    h += `<h3>${esc(X().CREDITS.cast)}</h3><div class="cast">`;
    const nm = k => FIN.nameOf(k);
    h += `<div class="pl">${esc(nm('elio'))} · ${esc(nm('noa'))} · ${esc(G.state.mimoName || 'Mimo')}</div>`;
    for (const [r, P0, today, F0] of CASTS()) {
      const pn = (typeof CH4 !== 'undefined' && CH4.NAMES[r]) || r;
      h += `<div class="pl">${esc(pn.replace(/^the /, 'The '))}</div>`;
      X().CREDITS.times.forEach((t, i) => { h += `<div class="hd">${esc(t)}</div>`; });
      const cols = [names(P0), today, names(F0)], n = Math.max(...cols.map(c => c.length));
      for (let i = 0; i < n; i++) ['past', 'now', 'future'].forEach((w, j) => { h += `<div class="cw ${w}">${esc(cols[j][i] || '')}</div>`; });
    }
    h += `</div>`;
    // the songs: the finale's own (every song in the valley was made for this game)
    h += `<h3>${esc(X().CREDITS.songs)}</h3>`;
    const T = (typeof FINMUSIC !== 'undefined' && FINMUSIC && FINMUSIC.TITLES) || {};
    for (const k of ['fin_rise', 'fin_clock', 'fin_speech', 'fin_bells', 'fin_credits']) if (T[k]) h += `<div class="row">«${esc(T[k])}»</div>`;
    h += `<div class="row" style="opacity:.75">…and every song in the valley, each written for this game.</div>`;
    // your journey: hours at each level, the words you've taught {mimo}, Elio's eighteen words and their letters
    h += `<h3>${esc(X().CREDITS.journey)}</h3>`;
    const bt = ((G.state.bandTime || {})[l]) || {}, fmt = s => { const m = Math.floor((s || 0) / 60); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
    const bands = ['A0', 'A1', 'A2', 'B1', 'B2'].filter(b => bt[b]);
    if (bands.length) h += `<div class="row">${bands.map(b => `<b>${b}</b> ${fmt(bt[b])}`).join(' · ')}</div>`;
    try { const n = typeof LEX !== 'undefined' && LEX.taughtList ? LEX.taughtList().length : 0; if (n) h += `<div class="row">Words ${esc(G.state.mimoName || 'Mimo')} knows: <b>${n}</b></div>`; } catch (e) { /* */ }
    const ech = (G.state.ch4 && G.state.ch4.echoes) || {}, el = Object.values(ech);
    if (el.length) h += `<div class="row">Elio’s words: <b>${el.length} / 18</b> · ${el.map(x => esc(x)).join(' ')}</div>`;
    h += `<div class="last">${tH(pick(X().CREDITS.thanks, l), l)}</div><div class="sub">${esc(l === 'en' ? '' : X().CREDITS.thanks.en)}</div>`;
    h += `<div class="last" style="font-size:26px;margin-top:40px">«${tH(motto, l)}»</div><div style="height:45vh"></div>`;
    return h;
  }

  // ------------------------------------------------------------ the screen: night over Alba, lanterns rising; «Fin»; the roll
  const FIN_T = 6.5, SPEED = 42;
  function roll() {
    return new Promise(res => {
      css();
      const el = document.createElement('div'); el.id = 'fin-cred';
      el.innerHTML = `<canvas></canvas><div class="fin"><div class="big"></div><div class="en"></div></div><div class="roll"></div><div class="key"><kbd>E</kbd> ▸▸</div>`;
      document.body.appendChild(el);
      const l = lang(), end = X().CREDITS.end;
      el.querySelector('.fin .big').innerHTML = tH(pick(end, l), l);
      el.querySelector('.fin .en').textContent = l === 'en' ? '' : end.en;
      el.querySelector('.roll').innerHTML = programHTML();
      const R = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
      const lan = []; for (let i = 0; i < 70; i++) lan.push({ x: R(), t0: R() * 26, v: 0.035 + R() * 0.03, s: 0.5 + R() * 0.8, ph: R() * 6.28, warm: R() < 0.7 });
      C = { el, cv: el.querySelector('canvas'), fin: el.querySelector('.fin'), roll: el.querySelector('.roll'), t: 0, y: 0, lan, res, fastK: 1, done: false };
      const key = e => { if (!C) return; if (['KeyE', 'Enter', 'Space', 'Escape'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); if (C.done) close(); else C.fastK = C.fastK > 1 ? 1 : 7; } };
      C.key = key; addEventListener('keydown', key, true);
    });
  }
  function close() {
    if (!C) return;
    const c0 = C; C = null;
    removeEventListener('keydown', c0.key, true);
    c0.el.style.transition = FIN.fast() ? 'none' : 'opacity 1s'; c0.el.style.opacity = '0';
    setTimeout(() => c0.el.remove(), FIN.fast() ? 0 : 1050);
    c0.res();
  }
  function frame(dt) {
    if (!C) return;
    const c0 = C; c0.t += Math.min(0.05, Math.max(0, dt || 0)) * (c0.t > FIN_T ? c0.fastK : 1);
    const t = c0.t;
    c0.fin.style.opacity = String(Math.max(0, Math.min(1, t / 1.2, (FIN_T - t) / 1.0)));
    if (t > FIN_T - 0.5) {
      c0.roll.style.opacity = '1';
      c0.y = (t - FIN_T + 0.5) * SPEED;
      const H = c0.roll.scrollHeight || 3000;
      c0.roll.style.transform = `translate(-50%, ${Math.round(innerHeight - c0.y)}px)`;
      if (!c0.done && c0.y > H + innerHeight * 0.1 - innerHeight * 0.55) { c0.done = true; c0.fastK = 1; }
      if (c0.done && c0.y > H + innerHeight * 0.4) close();
    }
    draw(c0, t);
  }
  function draw(c0, t) {
    const cv = c0.cv, dpr = Math.min(1.5, window.devicePixelRatio || 1), W = Math.max(2, Math.round(innerWidth * dpr)), H = Math.max(2, Math.round(innerHeight * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const c = cv.getContext('2d'), S = Math.min(W, H);
    const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0a0b1e'); sky.addColorStop(0.7, '#22224a'); sky.addColorStop(1, '#3a2a48');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 80; i++) { c.globalAlpha = 0.3 + 0.3 * Math.sin(t * 1.3 + i); c.fillStyle = '#fff6dc'; c.fillRect(((i * 97) % 100) / 100 * W, ((i * 61) % 100) / 100 * H * 0.55, 1.5 * dpr, 1.5 * dpr); }
    c.globalAlpha = 1;
    c.fillStyle = '#fff4d0'; c.beginPath(); c.arc(W * 0.82, H * 0.16, S * 0.05, 0, TAU); c.fill();
    // the lanterns, rising from the town into the night (they sank once; not this time)
    for (const L0 of c0.lan) {
      const u = (t - L0.t0 * 0.35); if (u < 0) continue;
      const y = H * (0.86 - u * L0.v), x = W * L0.x + Math.sin(u * 0.7 + L0.ph) * S * 0.02, s = S * 0.016 * L0.s * (0.6 + 0.4 * Math.max(0, y / H));
      if (y < -s * 4) { L0.t0 = t / 0.35 + Math.random() * 2; continue; }
      const g1 = c.createRadialGradient(x, y, 0, x, y, s * 4); g1.addColorStop(0, L0.warm ? 'rgba(255,190,100,0.5)' : 'rgba(170,200,255,0.45)'); g1.addColorStop(1, 'rgba(255,190,100,0)');
      c.fillStyle = g1; c.beginPath(); c.arc(x, y, s * 4, 0, TAU); c.fill();
      c.fillStyle = L0.warm ? '#ffd98a' : '#dfe8ff'; c.beginPath(); c.ellipse(x, y, s * 0.7, s, 0, 0, TAU); c.fill();
    }
    // Alba's skyline: the bell tower, the theater's gable, rooftops, lit windows
    const base = H * 0.86, ink = '#120f22';
    c.fillStyle = ink; c.fillRect(0, base, W, H - base);
    const roofs = [[0.02, 0.07, 0.06], [0.1, 0.09, 0.08], [0.2, 0.06, 0.05], [0.28, 0.1, 0.09], [0.6, 0.08, 0.07], [0.7, 0.11, 0.1], [0.8, 0.07, 0.06], [0.9, 0.09, 0.08]];
    for (const [x0, w0, h0] of roofs) { c.beginPath(); c.moveTo(W * x0, base); c.lineTo(W * x0, base - H * h0); c.lineTo(W * (x0 + w0 / 2), base - H * (h0 + 0.04)); c.lineTo(W * (x0 + w0), base - H * h0); c.lineTo(W * (x0 + w0), base); c.fill(); c.fillStyle = '#ffd98a'; c.fillRect(W * (x0 + w0 * 0.4), base - H * h0 * 0.6, W * 0.008, H * 0.014); c.fillStyle = ink; }
    c.fillRect(W * 0.43, base - H * 0.34, W * 0.06, H * 0.34); c.beginPath(); c.moveTo(W * 0.42, base - H * 0.34); c.lineTo(W * 0.46, base - H * 0.42); c.lineTo(W * 0.5, base - H * 0.34); c.fill();
    c.fillStyle = '#ffd98a'; c.beginPath(); c.arc(W * 0.46, base - H * 0.27, W * 0.008, 0, TAU); c.fill(); c.fillStyle = ink;
    c.beginPath(); c.moveTo(W * 0.5, base); c.lineTo(W * 0.5, base - H * 0.16); c.lineTo(W * 0.55, base - H * 0.22); c.lineTo(W * 0.6, base - H * 0.16); c.lineTo(W * 0.6, base); c.fill();
  }
  const has = n => typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(n);
  return {
    roll, frame, init(game) { G = game; },
    song: () => (has('fin_credits') ? 'fin_credits' : null),
    get on() { return !!C; },
    _: { programHTML, close, get C() { return C; }, t: { end() { if (C) { C.t = 1e4; C.done = true; close(); } } } },
  };
})();
