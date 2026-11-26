'use strict';
// Signs you can read. The user: "fix the signs, make them all readable". Every sign, board, plaque and poster with words
// on it in the 3D world has big bold letters with strong contrast, reads from both sides (never blank or mirrored from
// behind), is in the save's language (repainted when it changes), and E «Read» opens a card: the words big, a 🔊 to hear
// them, and their English on request (EN, or T: never under them by default, DESIGN.md 17.3).
//
// One global, SIGNS. signs.js loads after the world's files and before main.js; the files call it while main.js builds
// them, and check `typeof SIGNS !== 'undefined'` first, so their own test pages still work without it.
//   SIGNS.paint(c, w, h, o)    paints a sign board on a canvas: a colored edge, a cream face, the words in bold ink as big
//                              as they fit, and an optional paper-cutout icon (ICONS) at one end.
//                              o: { text, edge, face, ink, icon, iconSide: 'L' | 'R', weight, size (of h) }
//   SIGNS.fit(c, text, maxW, px, weight, family)   the biggest font up to px that fits maxW (sets c.font, returns px)
//   SIGNS.board(draw)          calls draw(lang) now, and again whenever the language changes (another save loads)
//   SIGNS.add(def)             a sign you can Read with E, registered where it's built (the same id replaces it):
//                              { id, x, z, y?, r, when?() → bool, card(lang) → card }
//   SIGNS.read(card)           the Read card (async: resolves once it's closed). card: { tag, lines: [{ text, en, say?,
//                              hush?: [char index], look?: { face, edge, ink } }], note? }. A line's say defaults to its text
//                              without arrows; say: '' hides its 🔊. Files with their own E lists (the corn maze, the
//                              cemetery, town life, the minigames, the dominoes, Adi, the houses) call it too.
//   for main.js: build(scene) → { group, update(dt, t, you) }, init(game), interactables() (story.js asks, outdoors)

const SIGNS = (() => {
  const INK = '#2b2235', PAPER = '#fffaf0', FONT = 'Bahnschrift, "Segoe UI", sans-serif';
  const lang = () => (typeof UI !== 'undefined' && UI.lang) || 'es';
  let G = null;
  // zh / ja (CJK.md): a sign's text may be in the notation ([面包|miàn bāo]); boards paint it as plain text in the mode
  // (pinyin / rōmaji or characters), the Read card shows it with its readings. Canvas fonts get CJK glyphs from cjk.js.
  const cjkOn = () => typeof CJK !== 'undefined' && CJK.isCJK(lang());
  const plainOf = t => (cjkOn() ? CJK.plain(String(t == null ? '' : t), { lang: lang() }) : t);
  const boardKey = () => lang() + (cjkOn() ? ':' + CJK.mode(lang()) : '');      // (repaint when the language or its mode changes)

  // ------------------------------------------------------------ painting
  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function fit(c, text, maxW, px, weight = 800, family = FONT) {
    let s = Math.round(px); c.font = `${weight} ${s}px ${family}`;
    while (s > 10 && c.measureText(text).width > maxW) { s -= 1; c.font = `${weight} ${s}px ${family}`; }
    return s;
  }
  function paint(c, w, h, o) {
    const b = Math.max(5, Math.round(h * 0.09)), r = h * 0.16;
    c.clearRect(0, 0, w, h);
    rr(c, 0, 0, w, h, r); c.fillStyle = o.edge || '#8a5f3e'; c.fill();
    rr(c, b, b, w - 2 * b, h - 2 * b, r * 0.6); c.fillStyle = o.face || PAPER; c.fill();
    let x0 = b * 2, x1 = w - b * 2;
    if (o.icon && typeof ICONS !== 'undefined') {           // the icon sits at one end (a signpost's: by the post)
      const s = h - b * 2.4, left = o.iconSide !== 'R', ix = left ? b * 1.3 : w - b * 1.3 - s;
      c.drawImage(ICONS.canvas(o.icon, 128), ix, (h - s) / 2, s, s);
      if (left) x0 = ix + s + b * 0.4; else x1 = ix - b * 0.4;
    }
    const text = plainOf(o.text);
    const px = fit(c, text, x1 - x0, h * (o.size || 0.6), o.weight || 800);
    c.fillStyle = o.ink || INK; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, (x0 + x1) / 2, h / 2 + px * 0.06);
  }
  // two paper-cutout icons the plaza's signpost needs (icons.js has the bread and the apple)
  (function addIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const has = k => ICONS.keys.includes(k);
    if (!has('bell')) ICONS.add('bell', (c, p, h) => {
      h.shape(c, p, h.ell(0, -32, 6, 5), '#c99a3a');
      h.shape(c, p, cc => { cc.moveTo(-28, 22); cc.quadraticCurveTo(-20, 16, -19, -2); cc.quadraticCurveTo(-17, -30, 0, -30); cc.quadraticCurveTo(17, -30, 19, -2); cc.quadraticCurveTo(20, 16, 28, 22); cc.closePath(); }, '#e6b84a');
      h.shape(c, p, h.ell(0, 26, 7, 6), '#c99a3a');
      if (p) h.dot(c, -8, -12, 4, 'rgba(255,255,255,0.6)');
    });
    if (!has('gate')) ICONS.add('gate', (c, p, h) => {      // a town gate: an arch, and the way out through it
      h.shape(c, p, cc => { cc.moveTo(-32, 32); cc.lineTo(-32, -4); cc.quadraticCurveTo(-32, -36, 0, -36); cc.quadraticCurveTo(32, -36, 32, -4); cc.lineTo(32, 32); cc.lineTo(17, 32); cc.lineTo(17, 0); cc.quadraticCurveTo(17, -20, 0, -20); cc.quadraticCurveTo(-17, -20, -17, 0); cc.lineTo(-17, 32); cc.closePath(); }, '#e9dcc0');
      if (p) { c.fillStyle = '#7fbf6a'; c.fillRect(-15, 18, 30, 12); c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(0, 6, 6, 0, TAU); c.fill(); }
    });
  })();

  // ------------------------------------------------------------ boards that follow the language
  const BOARDS = [];
  function redraw(b, l) { b.key = l; try { b.draw(l); } catch (e) { console.error('[signs]', e); } }
  function board(draw) { const b = { draw, key: null }; BOARDS.push(b); redraw(b, lang()); b.key = boardKey(); return b; }

  // ------------------------------------------------------------ signs you can read with E (outdoors; story.js asks)
  const LIST = new Map();
  function add(def) { if (def && def.id) LIST.set(def.id, def); return def; }
  function interactables() {
    if (!G || !G.state || !G.state.flags || !G.state.flags.hatched) return [];
    if (G.indoorMod && G.indoorMod()) return [];
    const Y = G.sim.you, out = [];
    for (const d of LIST.values()) {
      if (Math.abs(d.x - Y.x) > d.r + 2 || Math.abs(d.z - Y.z) > d.r + 2) continue;
      if (d.when && !d.when()) continue;
      out.push({ x: d.x, z: d.z, y: d.y, r: d.r, label: 'Read', run: () => read(d.card(lang())) });
    }
    return out;
  }

  // ------------------------------------------------------------ the Read card
  const sayOf = L => (L.say !== undefined ? L.say : String(L.text).replace(/[←→↑↓✕♥·]/g, ' ').replace(/\s+/g, ' ').trim());
  function say(text) {
    if (!text || typeof Sound === 'undefined' || !Sound.say) return;
    const ok = cjkOn() ? CJK.say(text, lang()) : Sound.say(text, lang());       // (zh / ja: in characters, with a zh-CN / ja-JP voice)
    if (!ok && typeof UI !== 'undefined' && UI.toast) UI.toast('No voice for this language is installed on this PC');
  }
  function lineHTML(L, i) {
    const t = String(L.text), hush = new Set(L.hush || []), cj = cjkOn() && CJK.hasCJK(t);
    if (cj) CJK.seen(t, { lang: lang() });            // (reading a sign counts for its characters)
    const word = cj ? CJK.html(t, { lang: lang() }) : hush.size ? t.split('').map((ch, k) => (hush.has(k) && ch !== ' ' ? `<span class="sg-hush">${esc(ch)}</span>` : esc(ch))).join('') : esc(t);
    const lk = L.look || {}, style = `--face:${lk.face || PAPER};--edge:${lk.edge || '#8a5f3e'};--ink2:${lk.ink || INK}`;
    return `<div class="sg-row"><div class="sg-top"><div class="sg-board${(cj ? CJK.len(t, { lang: lang() }) : t.length) > 20 ? ' sm' : ''}" style="${style}">${word}</div>`
      + (sayOf(L) ? `<button class="sg-say" data-i="${i}" title="Hear it">🔊</button>` : '<span class="sg-nosay"></span>') + '</div>'
      + `<div class="sg-en">${esc(L.en || '')}</div></div>`;        // (always three cells: a long board lines them up in a grid)
  }
  // E (or Enter, Space, Esc, a click) closes it; the 🔊 buttons, or Q, read it out; EN, or T, shows the English. The keys are
  // caught before the game sees them, so the E that closes the card can't open it again.
  function waitClose(sayAll, toggleEn) {
    return new Promise(resolve => {
      const map = typeof KEYS !== 'undefined' && KEYS.map ? KEYS.map : {};
      const close = new Set(['Enter', 'Space', 'Escape', 'KeyE'].concat(map.interact || [])), hear = new Set(map.look || ['KeyQ']);
      let on = false;
      const off = () => { if (on) { removeEventListener('keydown', key, true); removeEventListener('pointerdown', ptr, true); } on = false; setTimeout(resolve, 10); };
      const key = e => {
        const en = e.code === 'KeyT' && !close.has(e.code) && !hear.has(e.code);
        if (!close.has(e.code) && !hear.has(e.code) && !en) return;
        e.preventDefault(); e.stopPropagation();
        if (e.repeat) return;                      // (the E that opened the card, held down)
        if (en) { if (toggleEn) toggleEn(); } else if (close.has(e.code)) off(); else sayAll();
      };
      const ptr = e => { if (e.target && e.target.closest && e.target.closest('.sg-say, .sg-enb')) return; off(); };
      setTimeout(() => { on = true; addEventListener('keydown', key, true); addEventListener('pointerdown', ptr, true); }, 250);
    });
  }
  let open = false;
  async function read(card) {
    const el = typeof document !== 'undefined' && $('card');
    if (!card || !el || open) return;
    css(); open = true;
    const lines = (card.lines || []).filter(L => L && L.text);
    const sim = G && G.sim, was = sim ? sim.lock : 0;
    if (sim) sim.lock = 1;                         // (you stand and read)
    const keyName = a => (typeof KEYS !== 'undefined' && KEYS.keys ? KEYS.keys(a).split(' / ')[0] : '');
    const note = card.note ? (typeof UI !== 'undefined' && UI.weave ? UI.weave(card.note) : esc(card.note)) : '';
    el.innerHTML = (card.tag ? `<div class="tag">${esc(card.tag)}</div>` : '') + `<div class="sg-list">${lines.map(lineHTML).join('')}</div>`
      + (note ? `<div class="note">${note}</div>` : '')
      + `<div class="sub"><b>${esc(keyName('interact') || 'E')}</b> to close · 🔊 or <b>${esc(keyName('look') || 'Q')}</b> to hear it`
      + (lines.some(L => L.en) ? ` · <button type="button" class="sg-enb" title="The English (T)">EN</button>` : '') + '</div>';
    el.className = 'card sign-card' + (lines.length > 4 ? ' compact' : '');      // (a long board: smaller rows, so it fits)
    el.querySelectorAll('.sg-say').forEach(b => { b.onclick = e => { e.stopPropagation(); say(sayOf(lines[+b.dataset.i])); }; });
    const toggleEn = () => el.classList.toggle('en-on');          // (the English of every line on the card, on request)
    const enb = el.querySelector('.sg-enb'); if (enb) enb.onclick = e => { e.stopPropagation(); toggleEn(); };
    if (typeof Sound !== 'undefined' && Sound.play) Sound.play('page');
    try { await waitClose(() => say(lines.map(sayOf).filter(Boolean).join('. ')), toggleEn); }
    finally {
      el.className = 'card hidden'; el.innerHTML = ''; open = false;
      if (sim && sim.lock === 1) sim.lock = was || 0;
    }
  }
  let cssDone = false;
  function css() {
    if (cssDone || typeof document === 'undefined') return;
    cssDone = true;
    const s = document.createElement('style'); s.id = 'signs-css';
    s.textContent = `
      #card.sign-card { top: 44%; width: min(500px, calc(100vw - 40px)); max-width: none; max-height: calc(100vh - 40px); overflow-y: auto; box-sizing: border-box; padding: 14px 22px; }
      .sign-card .sg-list { display: flex; flex-direction: column; gap: 12px; margin: 10px 0 8px; }
      .sign-card .sg-row { display: flex; flex-direction: column; align-items: center; gap: 4px; }
      .sign-card .sg-top { display: flex; align-items: center; justify-content: center; gap: 10px; max-width: 100%; }
      .sign-card .sg-board { font: 800 34px/1.1 Bahnschrift, "Segoe UI", sans-serif; color: var(--ink2); background: var(--face); border: 4px solid var(--edge); border-radius: 12px;
        padding: 7px 18px 6px; box-shadow: 0 3px 0 rgba(43,34,53,.2); overflow-wrap: anywhere; }
      .sign-card .sg-board.sm { font-size: 25px; }
      .sign-card .sg-say { flex: 0 0 auto; width: 44px; height: 44px; border-radius: 50%; border: 2.5px solid var(--ink); background: #fff; font-size: 20px; line-height: 1; padding: 0; cursor: pointer; }
      .sign-card .sg-say:hover { background: #fff3c4; }
      .sign-card .sg-en { font: italic 600 16px "Segoe UI", sans-serif; color: var(--ink); opacity: .8; }
      .sign-card:not(.en-on) .sg-en { display: none; }
      .sign-card.compact:not(.en-on) .sg-en { display: block; visibility: hidden; }
      .sign-card .sg-enb { font: 800 12px "Segoe UI", sans-serif; color: var(--ink); border: 2px solid var(--ink); border-radius: 8px; background: #fff; padding: 1px 8px; cursor: pointer; }
      .sign-card.en-on .sg-enb { background: #fff3c4; }
      .sign-card .sg-hush { color: #a39db2; text-shadow: 0 0 6px rgba(163,157,178,.8); }
      .sign-card.compact .sg-list { display: grid; grid-template-columns: max-content max-content max-content; justify-content: center; align-items: center; gap: 6px 10px; margin: 8px 0 6px; }
      .sign-card.compact .sg-row, .sign-card.compact .sg-top { display: contents; }
      .sign-card.compact .sg-board { justify-self: end; font-size: 24px; padding: 4px 12px 3px; border-width: 3px; }
      .sign-card.compact .sg-say { width: 34px; height: 34px; font-size: 16px; }
      .sign-card.compact .sg-en { font-size: 14px; text-align: left; }
      .sign-card .note { font: 17px/1.35 "Segoe Print", "Ink Free", cursive; margin: 4px 0 2px; }
      .sign-card .sub b { font-weight: 800; }`;
    document.head.appendChild(s);
  }

  // ------------------------------------------------------------ for main.js
  function update() {
    const l = lang(), k = boardKey();
    for (const b of BOARDS) if (b.key !== k) { redraw(b, l); b.key = k; }
  }
  function build(scene) {
    const group = new THREE.Group(); group.name = 'signs';
    if (scene) scene.add(group);
    return { group, update };
  }
  function init(game) { G = game; css(); update(); }

  return { paint, fit, board, add, read, interactables, build, init, update, lang, text: plainOf, get list() { return [...LIST.values()]; }, get boards() { return BOARDS.length; } };
})();
