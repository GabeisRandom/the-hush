'use strict';
// HUD (P7b, playtest 7: "we've added a lot of stuff so now our taskbar kinda look like a UI nightmare, can we try to fix this?").
// The calm layout, in the game's paper look. Nothing is gone; it's sorted:
//   • The journal: its pages in five sections, Story · Words · <Mimo> · People · Settings, like folder tabs; the section's own
//     pages as small sub-tabs under them (each section remembers the page you last had open); Save, Title and Close as small
//     buttons in the top corner, next to the play time. ui.js journal() lists the pages and asks HUD.journalNav for the header
//     (without this file it draws its old single row). A page another module adds (UI.journalTabs) can say its section with
//     `group: 'story' | 'words' | 'mimo' | 'people' | 'settings'`; else a known id's, else '…-words' pages go under Words, the
//     rest under Story.
//   • The help bar: the few keys you need now (move, talk, ask Mimo the way, the journal; flashcards and the phone while they
//     have something for you) and «H all keys», which opens every key in a card (KEYS.map.help, H by default; Esc closes it).
//   • The top corner's chips (♥, coins, Noa's pages, words, the phone, music): one paper strip, every chip the same height.
//   • The quest tracker and the compass sized so they never run into each other, a small window too. The tracker's own keys
//     line is hidden: the same keys are on the help bar.
// HUD.journalNav(pages, tab, state, head) · HUD.groupOf(page) · HUD.SECTIONS · HUD.helpBar() · HUD.keys(open?) · HUD.keysOpen
const HUD = (() => {
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mimo = () => (typeof UI !== 'undefined' && UI.mimoName) || 'Mimo';

  // ------------------------------------------------------------ the journal's sections
  const SECTIONS = [
    { id: 'story', label: 'Story', icon: '📜' },
    { id: 'words', label: 'Words', icon: '🔤' },
    { id: 'mimo', label: null, icon: '🐾' },          // (Mimo's own name)
    { id: 'people', label: 'People', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ];
  // each section's pages, in this order (pages it doesn't name come after, in the order they were added)
  const ORDER = {
    story: ['quests', 'ch4-words', 'letters', 'pages', 'read'],
    words: ['words', 'phrases', 'flash', 'talk-level', 'ap-words', 'ml-words', 'lk-words', 'qr-words'],
    mimo: ['bag', 'bestiary'],
    people: ['talk-people'],
    settings: ['settings'],
  };
  const GROUP = {};
  for (const [s, ids] of Object.entries(ORDER)) ids.forEach(id => { GROUP[id] = s; });
  function groupOf(p) {
    const g = p && (p.group || GROUP[p.id]);
    if (g && ORDER[g]) return g;
    const id = String((p && p.id) || '');
    return /words$/.test(id) ? 'words' : /people/.test(id) ? 'people' : 'story';
  }
  const rank = (sec, id) => { const i = ORDER[sec].indexOf(id); return i < 0 ? 100 : i; };
  // "Phrasebook (12)" → the name and a little count
  const split = label => { const m = /^(.*?)\s*\((\d+)\)\s*$/.exec(String(label)); return m ? { text: m[1], count: m[2] } : { text: String(label), count: '' }; };
  const last = {};                        // section → the page last open in it
  function journalNav(pages, tab, state, head) {
    css();
    const by = {}; SECTIONS.forEach(s => { by[s.id] = []; });
    pages.forEach((p, i) => { p._i = i; by[groupOf(p)].push(p); });
    SECTIONS.forEach(s => by[s.id].sort((a, b) => rank(s.id, a.id) - rank(s.id, b.id) || a._i - b._i));
    const cur = pages.find(p => p.id === tab) || pages[0], sec = groupOf(cur);
    last[sec] = cur.id;
    const target = s => (by[s.id].some(p => p.id === last[s.id]) ? last[s.id] : by[s.id][0].id);
    const due = (() => { const f = by.words.find(p => p.id === 'flash'); return f ? split(f.label).count : ''; })();
    const jk = (() => { try { return KEYS.keys('journal').split(' / ')[0]; } catch (e) { return 'Tab'; } })();
    const sk = (() => { try { return KEYS.keys('save'); } catch (e) { return 'P'; } })();
    let h = `<div class="jtop"><div class="jhead${head ? '' : ' jh-none'}">${head || ''}</div><div class="jact">`
      + `<button class="savebtn" title="Save your game now (${E(sk)} or Ctrl+S)">💾 Save</button>`
      + `<button class="quit" title="Save, then go back to the title screen to switch saves">⏏ Title</button>`
      + `<button class="close" title="Close the journal (${E(jk)})">✕ <kbd>${E(jk)}</kbd></button></div></div>`;
    h += '<div class="jsecs">' + SECTIONS.filter(s => by[s.id].length).map(s => {
      const name = s.id === 'mimo' ? (state && state.mimoName) || mimo() : s.label, n = s.id === 'words' && due ? due : '';
      return `<button data-tab="${E(target(s))}" class="jsec ${s.id === sec ? 'on' : ''}" title="${E(by[s.id].map(p => split(p.label).text).join(' · '))}"><i>${s.icon}</i><span>${E(name)}</span>${n ? `<b class="jbadge" title="Flashcards due">${E(n)}</b>` : ''}</button>`;
    }).join('') + '</div>';
    const subs = by[sec];
    if (subs.length > 1) h += '<div class="jsubs">' + subs.map(p => { const t = split(p.label); return `<button data-tab="${E(p.id)}" class="${p.id === cur.id ? 'on' : ''}">${E(t.text)}${t.count ? `<small>${E(t.count)}</small>` : ''}</button>`; }).join('') + '</div>';
    return h;
  }

  // ------------------------------------------------------------ the help bar: what you need now, and H for the rest
  const K1 = a => { try { return (KEYS.map[a] || []).map(c => KEYS.name(c))[0] || ''; } catch (e) { return ''; } };
  const helpKey = () => K1('help') || 'H';
  function extras() {
    const out = [];
    try {
      if (typeof FLASH !== 'undefined' && FLASH.deck && FLASH.TAB && G && G.state && FLASH.TAB.label(G.state)) { const n = FLASH.deck().due.length; if (n) out.push([K1('cards'), `flashcards <b class="hb-n">${n}</b>`]); }
    } catch (e) { /* (no deck yet) */ }
    try {
      if (typeof PHONE !== 'undefined' && PHONE.available && PHONE.available()) { const n = PHONE.unread(); if (n) out.push([K1('phone'), `phone <b class="hb-n">${n > 9 ? '9+' : n}</b>`]); }
    } catch (e) { /* (no phone yet) */ }
    return out;
  }
  let helpKeyNow = '';
  function helpBar(force) {
    css();
    const el = document.getElementById('help'); if (!el) return;
    const mv = ['up', 'left', 'down', 'right'].map(a => { try { return KEYS.name((KEYS.map[a] || ['?'])[0] || '?'); } catch (e) { return '?'; } }).join('');
    const items = [[mv, 'move'], [K1('interact'), 'talk / use'], [K1('look'), `ask <span id="help-mimo">${E(mimo())}</span> the way`], [K1('journal'), 'journal']].concat(extras());
    const key = JSON.stringify(items) + helpKey();
    if (key === helpKeyNow && !force && document.getElementById('help-mimo')) return;
    helpKeyNow = key;
    el.innerHTML = items.filter(([k]) => k).map(([k, t]) => `<span class="hk"><kbd>${E(k)}</kbd> ${t}</span>`).join('<i class="hb-dot">·</i>')
      + `<i class="hb-dot">·</i><button class="hk hb-all" type="button" title="Every key in the game"><kbd>${E(helpKey())}</kbd> all keys</button>`;
    el.querySelector('.hb-all').onclick = e => { e.currentTarget.blur(); keys(); };
  }

  // ------------------------------------------------------------ every key, in a card (H)
  const groupsOfKeys = () => [
    ['Moving', ['up', 'down', 'left', 'right', 'run', 'jump']],
    ['Camera', ['camLeft', 'camRight', 'camUp', 'camDown', 'zoomIn', 'zoomOut']],
    ['Doing things', ['interact', 'look', 'journal', 'cards', 'phone', 'save', 'help']],
  ];
  function keysHTML() {
    const kb = a => { try { return (KEYS.map[a] || []).map(c => `<kbd>${E(KEYS.name(c))}</kbd>`).join(' ') || '<kbd>—</kbd>'; } catch (e) { return '<kbd>—</kbd>'; } };
    const lab = a => E(String((KEYS.LABEL && KEYS.LABEL[a]) || a).replace('Mimo', mimo()));
    let h = `<div class="kh-head"><b>All the keys</b><button class="kh-x" type="button" title="Close (${E(helpKey())} or Esc)">✕</button></div><div class="kh-cols">`;
    for (const [title, acts] of groupsOfKeys()) {
      h += `<section><h4>${title}</h4>` + acts.filter(a => KEYS.map[a]).map(a => `<div class="kr"><span class="kk">${kb(a)}</span><span>${lab(a)}</span></div>`).join('');
      if (title === 'Camera') h += '<div class="kr"><span class="kk"><kbd>drag</kbd></span><span>Drag with the mouse to turn the camera; the wheel zooms</span></div>';
      h += '</section>';
    }
    h += '<section><h4>Anywhere</h4>'
      + '<div class="kr"><span class="kk"><kbd>M</kbd></span><span>Music on or off (the ♪ in the corner too)</span></div>'
      + '<div class="kr"><span class="kk"><kbd>Ctrl</kbd> <kbd>S</kbd></span><span>Save the game</span></div>'
      + '<div class="kr"><span class="kk"><kbd>Esc</kbd></span><span>Close a box; run from a fight</span></div>'
      + '<div class="kr"><span class="kk"><kbd>Tab</kbd></span><span>In a box: a hint</span></div>'
      + '<div class="kr"><span class="kk"><kbd>?</kbd></span><span>Typed in a box: “I don’t know”, and you’re shown the word</span></div></section>';
    return h + '</div><p class="kh-note">Change any key in the journal: ⚙ Settings.</p>';
  }
  let keysOpen = false;
  function keys(open) {
    css();
    const want = open === undefined ? !keysOpen : !!open;
    let el = document.getElementById('keyhelp');
    if (want && !el) { el = document.createElement('div'); el.id = 'keyhelp'; document.body.appendChild(el); el.addEventListener('pointerdown', e => { if (e.target === el) keys(false); }); }
    if (!el) { keysOpen = false; return false; }
    if (want) {
      el.innerHTML = `<div class="kh-card">${keysHTML()}</div>`;
      el.querySelector('.kh-x').onclick = () => keys(false);
      el.classList.add('on');
      try { if (typeof Sound !== 'undefined') Sound.play('page'); } catch (e) { /* */ }
    } else el.classList.remove('on');
    keysOpen = want;
    return want;
  }
  // H opens it only while exploring (not the title, a fight, a minigame's or the phone's own panel: body.…-open) and nothing is typed
  const helpVisible = () => !/(^|\s)(on-title|in-battle|[\w-]+-open)(\s|$)/.test(document.body.className);
  const boxOpen = () => !!document.querySelector('.panel:not(.hidden), #journal:not(.hidden), #choose:not(.hidden), #card:not(.hidden), #letter:not(.hidden)');
  const typingNow = () => { const a = document.activeElement; return !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable); };
  addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (keysOpen && e.code === 'Escape') { e.preventDefault(); keys(false); return; }
    const codes = (KEYS.map && KEYS.map.help) || ['KeyH'];
    if (!codes.includes(e.code) || KEYS.capturing || typingNow() || (typeof Input !== 'undefined' && Input.typing)) return;
    if (!keysOpen && (!helpVisible() || boxOpen())) return;
    e.preventDefault(); keys();
  });

  // ------------------------------------------------------------ the look
  let cssOn = false;
  function css() {
    if (cssOn || typeof document === 'undefined') return; cssOn = true;
    const st = document.createElement('style'); st.id = 'hud-css';
    st.textContent = `
/* the journal: folder tabs for the sections, pills for their pages, the actions in the corner */
#journal .jtop { display: flex; align-items: center; gap: 10px; padding: 8px 10px 7px 16px; }
#journal .jtop .jhead { flex: 1; min-width: 0; padding: 0; border: 0; }
#journal .jact { flex: none; display: flex; gap: 6px; }
#journal .jact button { border: 2px solid var(--ink); border-radius: 99px; background: transparent; font: 800 12px "Segoe UI", sans-serif; padding: 3px 11px; white-space: nowrap; }
#journal .jact button:hover { background: #fff3c4; }
#journal .jact .close { background: var(--ink); color: var(--paper); }
#journal .jact .close:hover { background: #4a3d57; }
#journal .jact kbd { font: 800 10px "Segoe UI", sans-serif; border: 1.5px solid currentColor; border-radius: 4px; padding: 0 3px; margin-left: 3px; }
#journal .jsecs { display: flex; gap: 6px; padding: 4px 14px 0; border-bottom: 3px solid var(--ink); overflow-x: auto; scrollbar-width: none; flex: none; }
#journal .jsecs::-webkit-scrollbar { display: none; }
#journal .jsec { position: relative; flex: none; display: flex; align-items: center; gap: 7px; margin-bottom: -3px; padding: 7px 16px 7px; border: 3px solid var(--ink); border-bottom: 0;
  border-radius: 14px 14px 0 0; background: #ece2cc; color: var(--ink); font: 800 15px Bahnschrift, "Segoe UI", sans-serif; letter-spacing: .01em; opacity: .8; }
#journal .jsec:hover { opacity: 1; background: #f4ecd9; }
#journal .jsec.on { background: var(--paper); opacity: 1; padding-bottom: 10px; z-index: 1; }
#journal .jsec i { font-style: normal; font-size: 15px; line-height: 1; }
#journal .jsec span { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#journal .jbadge { min-width: 18px; height: 18px; box-sizing: border-box; border-radius: 99px; background: #e8457a; color: #fff; font: 800 11px/18px "Segoe UI", sans-serif; text-align: center; padding: 0 5px; }
#journal .jsubs { flex: none; display: flex; flex-wrap: wrap; gap: 6px; padding: 11px 16px 3px; }
#journal .jsubs button { border: 2px solid rgba(43,34,53,.22); border-radius: 99px; background: #fff; font: 700 13px "Segoe UI", sans-serif; padding: 3px 13px; }
#journal .jsubs button:hover { border-color: var(--ink); }
#journal .jsubs button.on { border-color: var(--ink); background: var(--ink); color: var(--paper); }
#journal .jsubs button small { margin-left: 6px; font-weight: 800; opacity: .65; }
@media (max-width: 760px), (max-height: 520px) {
  #journal .jsec { padding: 5px 10px 6px; font-size: 13px; gap: 5px; } #journal .jsec.on { padding-bottom: 8px; } #journal .jsec i { font-size: 13px; }
  #journal .jact button { padding: 2px 8px; font-size: 11px; } #journal .jtop { padding: 6px 8px 5px 12px; } #journal .jsubs { padding: 8px 12px 2px; }
}
/* the help bar: a few keys and «H all keys» */
#help { display: flex; align-items: center; gap: 2px 7px; flex-wrap: wrap; max-width: calc(100vw - 300px); padding: 5px 11px; border-radius: 99px; background: rgba(255,250,240,.9); box-shadow: 0 3px 0 rgba(43,34,53,.14); line-height: 1.5; }
#help .hk { white-space: nowrap; }
#help .hb-dot { font-style: normal; opacity: .35; }
#help .hb-all { border: 0; background: transparent; padding: 0; font: inherit; color: inherit; cursor: pointer; opacity: .75; }
#help .hb-all:hover { opacity: 1; text-decoration: underline; }
#help .hb-n { display: inline-block; min-width: 15px; border-radius: 99px; background: #e8457a; color: #fff; font: 800 10px/15px "Segoe UI", sans-serif; text-align: center; padding: 0 4px; }
@media (max-width: 700px) { #help { display: none; } }
/* every key (H) */
#keyhelp { position: fixed; inset: 0; z-index: 12; display: none; place-items: center; background: rgba(20,18,30,.18); }
#keyhelp.on { display: grid; }
#keyhelp .kh-card { width: min(760px, calc(100vw - 40px)); max-height: calc(100vh - 60px); overflow: auto; background: var(--paper); border: 3px solid var(--ink); border-radius: 20px;
  box-shadow: 0 0 0 6px #fff, 0 14px 0 5px rgba(43,34,53,.2); padding: 14px 18px 12px; animation: popin2 .3s ease-out; }
#keyhelp .kh-head { display: flex; align-items: center; justify-content: space-between; font: 800 20px Bahnschrift, "Segoe UI", sans-serif; margin-bottom: 6px; }
#keyhelp .kh-x { border: 2px solid var(--ink); border-radius: 99px; background: var(--ink); color: var(--paper); font-weight: 800; width: 30px; height: 30px; padding: 0; }
#keyhelp .kh-cols { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 4px 18px; }
#keyhelp h4 { margin: 10px 0 5px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; opacity: .6; }
#keyhelp .kr { display: flex; align-items: center; gap: 10px; padding: 3px 0; font-size: 14px; font-weight: 600; border-bottom: 1.5px dashed rgba(43,34,53,.1); }
#keyhelp .kk { flex: 0 0 112px; display: flex; gap: 4px; flex-wrap: wrap; }
#keyhelp kbd { font: 800 12px "Segoe UI", sans-serif; border: 2px solid var(--ink); border-radius: 6px; padding: 0 6px; background: #fff; box-shadow: 0 2px 0 rgba(43,34,53,.2); }
#keyhelp .kh-note { margin: 10px 0 0; font-size: 13px; opacity: .7; }
body.on-title #keyhelp, body.in-battle #keyhelp { display: none !important; }
/* the top corner's chips: one paper strip, one height */
#counters { gap: 0; align-items: center; padding: 0 3px; height: 32px; box-sizing: border-box; border-radius: 99px; background: rgba(255,250,240,.94); box-shadow: 0 3px 0 rgba(43,34,53,.18); }
#counters .chip { position: relative; display: inline-block; height: 26px; line-height: 26px; min-width: 48px; box-sizing: border-box; padding: 0 9px; text-align: center;
  background: transparent; box-shadow: none; border-radius: 99px; font: 800 13px/26px Bahnschrift, "Segoe UI", sans-serif; white-space: nowrap; }
#counters .chip:not(.hidden) ~ .chip:not(.hidden)::before { content: ""; position: absolute; left: -0.75px; top: 7px; bottom: 7px; width: 1.5px; border-radius: 1px; background: rgba(43,34,53,.15); }
#counters .chip.hp-chip.low::before, #counters .chip.hp-chip.low + .chip::before { display: none; }
#counters .chip button { display: inline-block; height: 26px; line-height: 26px; min-width: 20px; vertical-align: top; font: 800 14px/26px "Segoe UI Symbol", "Segoe UI", sans-serif; }
#counters #music:not(.on) { opacity: .4; }
/* the quest tracker and the compass: never on top of each other (the tracker's keys are on the help bar) */
html body #objective { max-width: min(360px, calc(50vw - 130px)); }
html body #objective .keys { display: none; }
html body #compass { width: clamp(150px, calc(100vw - 2 * min(360px, 50vw - 130px) - 112px), 420px); }`;
    document.head.appendChild(st);
  }

  // ------------------------------------------------------------ setup: the game (STORY.init), and the help bar kept current
  let G = null;
  if (typeof STORY !== 'undefined' && STORY.init && !STORY.init._hud) {
    const init0 = STORY.init;
    STORY.init = function (game) { G = game; try { css(); helpBar(true); } catch (e) { console.error('[hud]', e); } return init0.apply(this, arguments); };
    STORY.init._hud = true;
  }
  setInterval(() => { try { if (G && document.getElementById('help')) helpBar(); } catch (e) { /* */ } }, 1000);
  css();

  return { SECTIONS, ORDER, groupOf, journalNav, helpBar, keys, get keysOpen() { return keysOpen; }, _: { split, last, extras, keysHTML } };
})();
