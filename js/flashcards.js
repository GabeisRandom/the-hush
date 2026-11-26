'use strict';
// FLASH: flashcards from Mimo's memory (P6a, DESIGN.md 19: "add flashcards").
// The deck is LEX: every word and phrase you've met or taught Mimo, in the save's language (not the quest keys). LEX's own review
// schedule decides what's due (st.due, the stages), and every answer goes back through LEX.attempt, so the rest of the game knows:
// the weave, Mimo's reviews, the pace, the level page.
//   A session is 10–20 cards: the ones due now first, then the rest of today's, then words you met lately that Mimo doesn't have
//   yet (newest first). A "not yet" comes back once at the end.
//   Two ways: the word or phrase in the language (zh / ja in the save's script, with readings over what you don't know yet; 🔊
//   says it; its picture if it has one) → flip for the meaning. Or the English (and the picture) → type it in the language, graded
//   like everywhere (LEX.check: case, accents and an article don't matter; a tip shows the accents). "Both ways" mixes them: a word
//   you've only met comes the first way, one you know is typed.
//   Answer by typing, or with the buttons: I knew it (1) · Almost (2) · Not yet (3); Enter takes the one the card suggests.
//   A summary at the end. Opened from the journal's Flashcards tab, or its key (KEYS 'cards', F; rebindable in Settings).
//   The world waits (state.teaching, like the phone), but the play-time clock keeps running: it's practice.
// State: G.state.flash { mode, sessions, cards } (the mode you last picked, and totals).
//   FLASH.init(game) · open(mode?) · close() · deck() → { due, today, fresh, all } · FLASH._.t (tests)

const FLASH = (() => {
  let G = null;
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK(L());
  const E = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
  const LANGNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  const langName = () => LANGNAME[L()] || 'the language';
  const now = () => Date.now() / 1000;
  const snd = k => { try { Sound.play(k); } catch (e) { /* */ } };
  const MIN = 10, TARGET = 12, MAX = 20;
  const SKIP = new Set(['key']);                        // (quest keys: things you carry, not words)

  // ------------------------------------------------------------ the deck (read from LEX without making new records)
  const stOf = () => { try { return (LEX.toJSON().S || {})[L()] || {}; } catch (e) { return {}; } };
  function usable(id) {
    const it = LEX.item(id); if (!it || SKIP.has(it.kind)) return false;
    return isC() ? LEX.has(id) : !!(it[L()] && String(it[L()]).trim());
  }
  const endOfDay = () => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime() / 1000; };
  function deck() {
    const SS = stOf(), t = now(), eod = endOfDay(), out = { due: [], today: [], fresh: [], all: [] };
    for (const id in SS) {
      const s = SS[id]; if (!s || !(s.stage >= 1) || !usable(id)) continue;
      out.all.push(id);
      if (s.stage >= 2) { if ((s.due || 0) <= t) out.due.push(id); else if (s.due <= eod) out.today.push(id); }
      else out.fresh.push(id);
    }
    out.due.sort((a, b) => (SS[a].due || 0) - (SS[b].due || 0));
    out.today.sort((a, b) => (SS[a].due || 0) - (SS[b].due || 0));
    out.fresh.sort((a, b) => (SS[b].intro || SS[b].last || 0) - (SS[a].intro || SS[a].last || 0));
    return out;
  }
  // which way a card goes: words you've only met, and phrases, the first way (recognize, then flip); words Mimo knows, typed
  const multi = id => { const it = LEX.item(id) || {}; return it.kind === 'phrase' || it.kind === 'chunk' || /\s/.test(String(it[L()] || '').replace(/\[[^\]]*\]/g, 'x')); };
  function dirFor(id, kind, mode) {
    if (mode === 'l2e' || mode === 'e2l') return mode;
    if (kind === 'new' || multi(id)) return 'l2e';
    const s = stOf()[id] || {};
    if (s.stage >= 3) return 'e2l';
    let h = 7; for (const c of id + new Date().getDate()) h = (h * 31 + c.charCodeAt(0)) >>> 0;     // (learning words: half each way, the same way all day)
    return h % 2 ? 'e2l' : 'l2e';
  }
  function build(mode) {
    const D = deck(), cards = [], want = Math.min(MAX, Math.max(TARGET, D.due.length));
    const add = (id, kind) => { if (cards.length < want && !cards.some(c => c.id === id)) cards.push({ id, kind, dir: dirFor(id, kind, mode) }); };
    D.due.forEach(id => add(id, 'due')); D.today.forEach(id => add(id, 'today')); D.fresh.forEach(id => add(id, 'new'));
    return cards;
  }

  // ------------------------------------------------------------ what a card shows
  const formOf = id => LEX.form(id, { article: true });
  function wordHTML(id, o = {}) {
    const it = LEX.item(id) || {};
    if (isC()) return CJK.html(LEX.src(id), { lang: L(), cap: false, ruby: o.ruby });
    const w = formOf(id);
    return E(it.register === 'swear' && typeof UI !== 'undefined' && UI.swearText ? UI.swearText(w) : w);
  }
  const sayIt = id => { try { if (typeof UI !== 'undefined' && UI.speak) return UI.speak(isC() ? LEX.src(id) : LEX.form(id)); } catch (e) { /* */ } return false; };
  const iconOf = id => { const it = LEX.item(id) || {}; return it.icon && typeof ICONS !== 'undefined' && ICONS.keys.includes(it.icon) ? it.icon : ''; };
  const enOf = id => String((LEX.item(id) || {}).en || '');
  const sizeOf = s => { const n = String(s).replace(/<[^>]+>/g, '').length; return n > 34 ? 'xs' : n > 22 ? 's' : n > 13 ? 'm' : ''; };
  // a typed meaning against the card's English: 2 right, 1 close (a letter or two), 0 no
  function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; }
  const nEn = s => String(s || '').toLowerCase().replace(/\(.*?\)|“.*?”/g, ' ').replace(/[’]/g, "'").replace(/[^a-z' ]/g, ' ').replace(/\b(the|a|an|to|some)\b/g, ' ').replace(/\s+/g, ' ').trim();
  function enScore(typed, en) {
    const t = nEn(typed); if (!t) return 0;
    const senses = String(en).split(/[\/;,!?]| or /).map(nEn).filter(Boolean);
    if (senses.some(s => s === t || (s.length >= 3 && t.length >= 3 && (s.includes(t) || t.includes(s))))) return 2;
    if (senses.some(s => s.length >= 4 && lev(s, t) <= (s.length >= 8 ? 2 : 1))) return 1;
    return 0;
  }

  // ------------------------------------------------------------ the look: the game's paper, a card that flips
  const CSS = `
#fc { position: fixed; inset: 0; z-index: 14; display: grid; place-items: center; background: rgba(20,18,30,.34); font-family: "Segoe UI", system-ui, sans-serif; color: #2b2235; }
#fc.hidden, #fc .hidden { display: none !important; } #fc * { box-sizing: border-box; }
#fc .fc-box { width: min(500px, calc(100vw - 28px)); max-height: calc(100vh - 28px); overflow: auto; background: #fffaf0; border: 3px solid #2b2235; border-radius: 22px; box-shadow: 0 0 0 7px #fff, 0 14px 0 6px rgba(43,34,53,.22); padding: 10px 16px 16px; animation: fc-pop .35s cubic-bezier(.3,1.5,.5,1); }
@keyframes fc-pop { from { transform: scale(.85) rotate(-1deg); opacity: 0; } }
#fc .fc-head { display: flex; align-items: center; gap: 10px; padding-bottom: 8px; margin-bottom: 10px; border-bottom: 2px dashed rgba(43,34,53,.2); }
#fc .fc-title { font: 800 21px Bahnschrift, "Segoe UI", sans-serif; } #fc .fc-sub { font-size: 12px; font-weight: 700; opacity: .6; }
#fc .fc-prog { margin-left: auto; display: flex; align-items: center; gap: 6px; font: 800 12px "Segoe UI", sans-serif; }
#fc .fc-prog i { width: 90px; height: 8px; border-radius: 99px; background: rgba(43,34,53,.12); overflow: hidden; } #fc .fc-prog i b { display: block; height: 100%; background: #21a493; border-radius: 99px; transition: width .3s; }
#fc .fc-x { border: 2px solid #2b2235; border-radius: 9px; background: #fff; font: 800 12px "Segoe UI", sans-serif; padding: 2px 8px; cursor: pointer; }
#fc .fc-card { position: relative; height: 236px; perspective: 1000px; margin: 2px 4px 12px; }
#fc .fc-in { position: absolute; inset: 0; transition: transform .5s cubic-bezier(.4,1.3,.5,1); transform-style: preserve-3d; }
#fc .fc-card.flip .fc-in { transform: rotateY(180deg); }
#fc .fc-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border: 2.5px solid #2b2235; border-radius: 18px; background: #fff; box-shadow: 0 5px 0 rgba(43,34,53,.18);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 26px 16px 14px; text-align: center; transform: rotate(-.6deg); }
#fc .fc-back { transform: rotateY(180deg) rotate(.6deg); background: #fbf6e7; background-image: repeating-linear-gradient(transparent 0 27px, rgba(70,110,170,.16) 27px 28px); }
#fc .fc-tag { position: absolute; top: 9px; left: 12px; font: 800 10.5px "Segoe UI", sans-serif; letter-spacing: .08em; text-transform: uppercase; opacity: .55; }
#fc .fc-kind { position: absolute; top: 8px; right: 10px; font: 900 10.5px Bahnschrift, sans-serif; letter-spacing: .06em; color: #fff; border: 2px solid #2b2235; border-radius: 99px; padding: 0 8px; transform: rotate(3deg); }
#fc .fc-kind.due { background: #e0a020; } #fc .fc-kind.today { background: #e0a020; } #fc .fc-kind.new { background: #21a493; } #fc .fc-kind.again { background: #8a5ab0; }
#fc .fc-pic { width: 84px; height: 84px; }
#fc .fc-word { font: 800 40px Bahnschrift, "Segoe UI", sans-serif; color: #c2412f; line-height: 1.15; overflow-wrap: anywhere; }
#fc .fc-word.m { font-size: 32px; } #fc .fc-word.s { font-size: 25px; } #fc .fc-word.xs { font-size: 20px; }
#fc .fc-word rt { font-size: .42em; color: #6a5a7a; font-weight: 700; }
#fc .fc-en { font: 23px/1.25 "Segoe Print", "Ink Free", cursive; color: #2c2b4a; }
#fc .fc-en.big { font-size: 27px; } #fc .fc-small { font-size: 13px; opacity: .7; }
#fc .fc-say { border: 2px solid #2b2235; border-radius: 99px; background: #fff; font-size: 15px; padding: 1px 9px; cursor: pointer; }
#fc .fc-back .fc-say { position: absolute; right: 10px; bottom: 9px; } #fc .fc-back .fc-pic { width: 60px; height: 60px; } #fc .fc-back { gap: 3px; padding-top: 22px; }
#fc .fc-verdict { font: 800 15px "Segoe UI", sans-serif; } #fc .fc-verdict.ok { color: #13786b; } #fc .fc-verdict.close { color: #a0761a; } #fc .fc-verdict.no { color: #8a4f80; }
#fc .fc-tip { font-size: 13px; color: #a0761a; font-weight: 700; }
#fc .fc-ask { display: flex; gap: 8px; flex-wrap: wrap; }
#fc .fc-ask input { flex: 1; min-width: 0; font: 600 19px "Segoe UI", sans-serif; padding: 7px 11px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; background: #fff; }
#fc .fc-ask input:focus { box-shadow: 0 0 0 3px rgba(33,164,147,.35); } #fc .fc-ask input:disabled { opacity: .55; }
#fc .fc-ask > button, #fc .fc-row button { border: 2.5px solid #2b2235; border-radius: 12px; background: #2b2235; color: #fffaf0; font-weight: 800; padding: 6px 14px; cursor: pointer; }
#fc .fc-hint { font-size: 12.5px; opacity: .7; margin-top: 5px; min-height: 17px; } #fc .fc-hint.given { font: 800 18px Consolas, monospace; letter-spacing: .1em; opacity: 1; color: #c2412f; }
#fc .fc-row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 6px; }
#fc .fc-row button.ghost { background: transparent; color: #2b2235; font-size: 13px; padding: 4px 11px; border-width: 2px; }
#fc .fc-rate { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
#fc .fc-rate button { display: flex; flex-direction: column; align-items: center; gap: 1px; border: 2.5px solid #2b2235; border-radius: 14px; padding: 7px 4px 6px; font: 800 15px "Segoe UI", sans-serif; cursor: pointer; color: #2b2235; box-shadow: 0 3px 0 rgba(43,34,53,.2); }
#fc .fc-rate button small { font: 700 11px "Segoe UI", sans-serif; opacity: .7; } #fc .fc-rate kbd { font: 800 11px "Segoe UI", sans-serif; border: 1.5px solid #2b2235; border-radius: 5px; padding: 0 4px; background: #fffaf0; }
#fc .fc-rate .knew { background: #d8f3ee; } #fc .fc-rate .almost { background: #fbeec8; } #fc .fc-rate .notyet { background: #ece4f1; }
#fc .fc-rate button.pick { outline: 3px solid #e0a020; outline-offset: 2px; transform: translateY(-2px); }
#fc .fc-rate button:hover { filter: brightness(1.04); transform: translateY(-1px); }
#fc .fc-deck h3 { margin: 4px 0 8px; font: 800 18px Bahnschrift, "Segoe UI", sans-serif; }
#fc .fc-counts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 6px 0 12px; }
#fc .fc-count { background: #fff; border: 2px solid rgba(43,34,53,.16); border-radius: 14px; padding: 8px 6px; text-align: center; }
#fc .fc-count b { display: block; font: 900 26px Bahnschrift, sans-serif; } #fc .fc-count span { font-size: 12px; font-weight: 700; opacity: .7; }
#fc .fc-count.due b { color: #c58a10; } #fc .fc-count.new b { color: #13786b; }
#fc .fc-modes { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
#fc .fc-modes button { flex: 1; min-width: 120px; border: 2px solid rgba(43,34,53,.3); border-radius: 12px; background: #fff; padding: 6px 8px; font: 700 13px "Segoe UI", sans-serif; cursor: pointer; }
#fc .fc-modes button.on { border-color: #2b2235; background: #fff3c4; box-shadow: 0 2px 0 rgba(43,34,53,.2); }
#fc .fc-note { font-size: 12.5px; opacity: .72; line-height: 1.45; margin: 6px 0 0; }
#fc .fc-sum .fc-chips { display: flex; gap: 8px; justify-content: center; margin: 8px 0; }
#fc .fc-sum .chipk { border: 2px solid #2b2235; border-radius: 99px; padding: 2px 11px; font: 800 14px "Segoe UI", sans-serif; }
#fc .fc-sum .chipk.knew { background: #d8f3ee; } #fc .fc-sum .chipk.almost { background: #fbeec8; } #fc .fc-sum .chipk.notyet { background: #ece4f1; }
#fc .fc-sum ul { list-style: none; padding: 0; margin: 6px 0; } #fc .fc-sum li { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 10px; background: #fff; border: 1.5px solid rgba(43,34,53,.12); margin: 4px 0; font-size: 15px; }
#fc .fc-sum li b { color: #c2412f; } #fc .fc-sum li button { margin-left: auto; border: 0; background: none; cursor: pointer; font-size: 15px; }
body.fc-open #objective, body.fc-open #compass, body.fc-open #minimap, body.fc-open #help, body.fc-open .bubble, body.fc-open #thought, body.fc-open .prompt, body.fc-open #qtip { display: none !important; }
@media (max-height: 600px) { #fc .fc-card { height: 196px; } #fc .fc-pic { width: 64px; height: 64px; } #fc .fc-word { font-size: 32px; } }`;
  const D = { root: null };
  function dom() {
    if (D.root) return D;
    if (!document.getElementById('fc-css')) { const st = document.createElement('style'); st.id = 'fc-css'; st.textContent = CSS; document.head.appendChild(st); }
    const r = document.createElement('div'); r.id = 'fc'; r.className = 'hidden';
    r.innerHTML = `<div class="fc-box" role="dialog" aria-label="Flashcards"><div class="fc-head"><span class="fc-title">Flashcards</span><span class="fc-sub"></span>`
      + `<span class="fc-prog hidden"><i><b></b></i><span></span></span><button class="fc-x" title="Close (Esc)">✕</button></div><div class="fc-body"></div></div>`;
    document.body.appendChild(r);
    r.addEventListener('pointerdown', e => { if (e.target === r) close(); });
    Object.assign(D, { root: r, sub: r.querySelector('.fc-sub'), prog: r.querySelector('.fc-prog'), bar: r.querySelector('.fc-prog b'), progT: r.querySelector('.fc-prog span'), body: r.querySelector('.fc-body') });
    r.querySelector('.fc-x').onclick = () => (S && S.view === 'card' ? summary() : close());
    return D;
  }

  // ------------------------------------------------------------ the session
  let S = null;            // { mode, cards, i, results, t0, view, card state }
  const save = () => { if (!G || !G.state) return { mode: 'mix', sessions: 0, cards: 0 }; const f = G.state.flash || (G.state.flash = {}); if (!f.mode) f.mode = 'mix'; return f; };
  function deckView() {
    const Dk = deck(), f = save(), mode = (S && S.mode) || f.mode || 'mix';
    S = { mode, view: 'deck' };
    D.prog.classList.add('hidden'); D.sub.textContent = `${langName()} · ${Dk.all.length} in ${mimoName()}’s memory`;
    const ready = Dk.due.length + Dk.today.length + Dk.fresh.length, n = Math.min(Math.max(TARGET, Dk.due.length), MAX, ready);
    const M = [['mix', 'Both ways', 'see it, or type it'], ['l2e', `${langName()} → English`, 'see it, recall it'], ['e2l', `English → ${langName()}`, 'type it']];
    D.body.innerHTML = `<div class="fc-deck"><h3>${ready ? `A round of ${n} card${n === 1 ? '' : 's'}` : 'Nothing to study yet'}</h3>`
      + `<div class="fc-counts"><div class="fc-count due"><b>${Dk.due.length}</b><span>due now</span></div><div class="fc-count"><b>${Dk.today.length}</b><span>later today</span></div><div class="fc-count new"><b>${Dk.fresh.length}</b><span>met, not learned</span></div></div>`
      + `<div class="fc-modes">${M.map(([k, t, s]) => `<button data-mode="${k}" class="${k === mode ? 'on' : ''}"><b>${E(t)}</b><br><small>${E(s)}</small></button>`).join('')}</div>`
      + `<div class="fc-row">${ready ? '<button class="fc-go">Start (Enter)</button>' : ''}<button class="ghost fc-close">Close (Esc)</button></div>`
      + `<p class="fc-note">${ready ? `Due words first, then words you met lately. Your answers go into ${E(mimoName())}’s memory, so the whole game knows what you know. Typed answers forgive accents (the bar under the box types them).`
        : `Every word you meet, in a line, a sign or a fight, lands here. Teach ${E(mimoName())} a few, and come back!`}</p></div>`;
    D.body.querySelectorAll('[data-mode]').forEach(b => { b.onclick = () => { S.mode = b.dataset.mode; save().mode = S.mode; snd('click'); deckView(); }; });
    const go = D.body.querySelector('.fc-go'); if (go) go.onclick = () => start();
    D.body.querySelector('.fc-close').onclick = () => close();
  }
  function start(mode) {
    mode = mode || (S && S.mode) || save().mode || 'mix';
    const cards = build(mode);
    if (!cards.length) { deckView(); return false; }
    S = { mode, cards, i: 0, results: [], again: 0, view: 'card', t: performance.now() };
    snd('page');
    showCard();
    return true;
  }
  function progress() {
    const n = S.cards.length, i = Math.min(S.i + 1, n);
    D.prog.classList.remove('hidden'); D.bar.style.width = Math.round((S.i / n) * 100) + '%'; D.progT.textContent = `${i} / ${n}`;
  }
  const KIND = { due: 'Due', today: 'Due today', new: 'New', again: 'Again' };
  function showCard() {
    const c = S.cards[S.i]; if (!c) { summary(); return; }
    Object.assign(S, { flipped: false, typed: '', pick: null, hints: 0, done: false, t0: performance.now(), verdict: '', tip: '' });
    progress();
    D.sub.textContent = langName();
    const id = c.id, icon = iconOf(id), word = wordHTML(id), en = enOf(id), l2e = c.dir === 'l2e';
    const tag = l2e ? `${langName()} → English` : `English → ${langName()}`;
    const kind = `<span class="fc-kind ${c.again ? 'again' : c.kind}">${KIND[c.again ? 'again' : c.kind]}</span>`;
    const pic = icon ? `<canvas class="fc-pic" width="168" height="168" data-icon="${E(icon)}"></canvas>` : '';
    const front = l2e
      ? `<span class="fc-tag">${E(tag)}</span>${kind}${pic}<div class="fc-word ${sizeOf(word)}">${word}</div><button class="fc-say" title="Hear it">🔊</button>`
      : `<span class="fc-tag">${E(tag)}</span>${kind}${pic}<div class="fc-en big">${E(en)}</div><div class="fc-small">in ${E(langName())}?</div>`;
    const back = `<span class="fc-tag">${E(tag)}</span>${pic}<div class="fc-word ${sizeOf(word)}">${isC() ? CJK.html(LEX.src(id), { lang: L(), cap: false, ruby: 'always' }) : word}</div><div class="fc-en">${E(en)}</div>`
      + `<div class="fc-verdict"></div><div class="fc-tip"></div><button class="fc-say" title="Hear it">🔊</button>`;
    D.body.innerHTML = `<div class="fc-card"><div class="fc-in"><div class="fc-face fc-front">${front}</div><div class="fc-face fc-back">${back}</div></div></div>`
      + `<form class="fc-ask" autocomplete="off"><input spellcheck="false" autocomplete="off"${l2e ? ' data-noacc' : ''} placeholder="${l2e ? 'What does it mean? (or just flip)' : `Type it in ${E(langName())}…`}"><button type="submit">${l2e ? 'Flip' : 'Check'}</button></form>`
      + `<div class="fc-hint">${l2e ? 'Enter or Space: flip · or type the meaning first' : 'Enter: check · Tab: a hint · ?: I don’t know'}</div>`
      + `<div class="fc-rate hidden"><button class="knew" data-r="knew"><span>I knew it</span><small><kbd>1</kbd></small></button><button class="almost" data-r="almost"><span>Almost</span><small><kbd>2</kbd></small></button><button class="notyet" data-r="notyet"><span>Not yet</span><small><kbd>3</kbd></small></button></div>`;
    D.body.querySelectorAll('canvas[data-icon]').forEach(cv => { try { ICONS.draw(cv, cv.dataset.icon); } catch (e) { /* */ } });
    D.body.querySelectorAll('.fc-say').forEach(b => { b.onclick = e => { e.preventDefault(); sayIt(id); }; });
    const form = D.body.querySelector('.fc-ask'), inp = form.querySelector('input');
    S.inp = inp;
    if (typeof CJK !== 'undefined' && CJK.attachIME && !l2e) CJK.attachIME(inp);
    form.addEventListener('submit', e => { e.preventDefault(); e.stopPropagation(); submit(); });
    D.body.querySelectorAll('[data-r]').forEach(b => { b.onclick = () => rate(b.dataset.r); });
    D.body.querySelector('.fc-card').onclick = e => { if (!e.target.closest('button') && !S.flipped) flip(); };
    if (l2e) setTimeout(() => { if (S && S.view === 'card' && S.cards[S.i] === c) sayIt(id); }, 250);
    setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } }, 40);
  }
  const card = () => (S && S.cards ? S.cards[S.i] : null);
  // the hint for a typed card: the first letter, then every other one, then all (like the teach box)
  function hint() {
    const c = card(); if (!c || c.dir !== 'e2l' || S.flipped) return;
    S.hints = Math.min(3, S.hints + 1);
    const spell = isC() ? CJK.roman(LEX.src(c.id), { lang: L(), cap: false }) : LEX.form(c.id);
    const h = D.body.querySelector('.fc-hint');
    h.textContent = [...spell].map((ch, i) => (ch === ' ' ? ' ' : i === 0 || (S.hints >= 2 && i % 2 === 0) || S.hints >= 3 ? ch : '_')).join(' ');
    h.classList.add('given'); snd('click');
    if (S.inp) S.inp.focus();
  }
  function submit() {
    const c = card(); if (!c || S.view !== 'card') return;
    if (S.flipped) { rate(S.pick || 'knew'); return; }
    const text = String(S.inp ? S.inp.value : '').trim();
    if (c.dir === 'l2e') {
      if (!text) { flip(); return; }
      const sc = enScore(text, enOf(c.id));
      S.typed = text; S.pick = sc === 2 ? 'knew' : sc === 1 ? 'almost' : 'notyet';
      S.verdict = sc === 2 ? ['ok', `✓ «${text}»: right!`] : sc === 1 ? ['close', `≈ «${text}»: close`] : ['no', `«${text}»: not quite`];
      flip(); return;
    }
    // English → the language: LEX.check (case, accents and an article don't matter; zh / ja through CJK.canon)
    if (!text) return;
    if (/^\s*[?？]+\s*$/.test(text) || /^(idk|i don'?t know|dunno)$/i.test(text)) { S.pick = 'notyet'; S.verdict = ['no', 'No problem: here it is.']; flip(); return; }
    const r = LEX.check(c.id, text);
    S.typed = text;
    if (r.ok) {
      S.pick = S.hints ? 'almost' : 'knew';
      S.verdict = ['ok', S.hints ? '✓ Right, with a hint' : '✓ Right!'];
      if (isC()) { try { CJK.used(text, LEX.src(c.id), { lang: L() }); } catch (e) { /* */ } }
      else if (typeof ACCENTS !== 'undefined') S.tip = ACCENTS.diff(text, LEX.form(c.id, { article: true }) + ' ' + (LEX.matchForm(c.id, text) || ''), L()).tip;
    } else if (r.close) { S.pick = 'almost'; S.verdict = ['close', `≈ «${text}»: one letter off`]; }
    else { S.pick = 'notyet'; S.verdict = ['no', `«${text}»: not this one`]; snd('wrong'); }
    flip();
  }
  function flip() {
    const c = card(); if (!c || S.flipped) return;
    S.flipped = true; S.ms = performance.now() - S.t0;
    const el = D.body.querySelector('.fc-card'); el.classList.add('flip');
    const v = D.body.querySelector('.fc-verdict'), tp = D.body.querySelector('.fc-tip');
    if (S.verdict) { v.className = 'fc-verdict ' + S.verdict[0]; v.textContent = S.verdict[1]; }
    if (S.tip) tp.textContent = S.tip;
    const form = D.body.querySelector('.fc-ask'); form.classList.add('hidden');
    D.body.querySelector('.fc-hint').textContent = S.pick ? 'Enter takes the one marked · or pick: 1 · 2 · 3' : 'How did it go? 1 · 2 · 3';
    D.body.querySelector('.fc-hint').classList.remove('given');
    const rt = D.body.querySelector('.fc-rate'); rt.classList.remove('hidden');
    rt.querySelectorAll('button').forEach(b => b.classList.toggle('pick', b.dataset.r === S.pick));
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    snd('page');
    if (c.dir === 'e2l') setTimeout(() => { if (S && S.view === 'card' && card() === c) sayIt(c.id); }, 350);
  }
  // the result goes to LEX (LEX.attempt: the same schedule every review in the game uses)
  function rate(r) {
    const c = card(); if (!c || S.view !== 'card') return;
    if (!S.flipped) { flip(); if (!r) return; }
    if (S.done) return; S.done = true;
    const ms = Math.max(600, Math.round(S.ms || (performance.now() - S.t0)));
    const mode = c.kind === 'new' && c.dir === 'l2e' ? 'learn' : 'review';     // (a word only met, seen and recognized: Mimo has it now, not "knew it all along")
    try {
      if (r === 'knew') LEX.attempt(c.id, { ok: true, hints: 0, ms, mode });
      else if (r === 'almost') LEX.attempt(c.id, { ok: true, hints: 1, ms, mode });
      else LEX.attempt(c.id, { ok: false, hints: 0, ms, mode });
    } catch (e) { console.error('[flash] attempt', e); }
    S.results.push({ id: c.id, r, dir: c.dir, kind: c.kind, again: !!c.again });
    snd(r === 'knew' ? 'review' : r === 'almost' ? 'pip' : 'click');
    // (a "not yet" comes back once, at the end of the round)
    if (r === 'notyet' && !c.again && S.cards.length < MAX + 6) S.cards.push({ id: c.id, kind: c.kind, dir: c.dir === 'e2l' ? 'l2e' : c.dir, again: true });
    S.i++;
    if (S.i >= S.cards.length) summary(); else showCard();
  }
  function summary() {
    if (!S || !S.results) { deckView(); return; }
    const res = S.results, first = res.filter(x => !x.again), cnt = k => first.filter(x => x.r === k).length;
    S.view = 'sum';
    D.prog.classList.add('hidden');
    const f = save(); f.sessions = (f.sessions || 0) + (res.length ? 1 : 0); f.cards = (f.cards || 0) + res.length;
    const mins = Math.max(1, Math.round((performance.now() - S.t) / 60000)), later = [...new Set(res.filter(x => x.r !== 'knew').map(x => x.id))];
    const Dk = deck(), next = (() => { const SS = stOf(), t = now(); let m = Infinity; for (const id of Dk.all) { const s = SS[id]; if (s && s.stage >= 2 && s.due > t) m = Math.min(m, s.due - t); } return m; })();
    const nextTxt = Dk.due.length ? `${Dk.due.length} more ${Dk.due.length === 1 ? 'is' : 'are'} due now` : next < Infinity ? `next review in ${next < 90 ? Math.round(next) + ' s' : next < 5400 ? Math.round(next / 60) + ' min' : Math.round(next / 3600) + ' h'}` : '';
    D.body.innerHTML = `<div class="fc-sum"><div class="fc-deck"><h3>${first.length ? 'Round done!' : 'See you soon!'}</h3></div>`
      + (first.length ? `<div class="fc-chips"><span class="chipk knew">✓ ${cnt('knew')} knew</span><span class="chipk almost">≈ ${cnt('almost')} almost</span><span class="chipk notyet">${cnt('notyet')} not yet</span></div>` : '')
      + (later.length ? `<div class="fc-note">${E(mimoName())} will ask about these again soon:</div><ul>${later.slice(0, 8).map(id => `<li><b>${wordHTML(id)}</b><span>${E(enOf(id))}</span><button data-say="${E(id)}" title="Hear it">🔊</button></li>`).join('')}</ul>` : '')
      + `<p class="fc-note">${first.length ? `${res.length} answer${res.length === 1 ? '' : 's'} in about ${mins} min of practice (it counts toward your play time)` : 'Nothing answered this time'}${nextTxt ? ' · ' + nextTxt : ''}.</p>`
      + `<div class="fc-row">${Dk.due.length + Dk.today.length + Dk.fresh.length ? '<button class="fc-again">Another round (Enter)</button>' : ''}<button class="ghost fc-close">Close (Esc)</button></div></div>`;
    D.body.querySelectorAll('[data-say]').forEach(b => { b.onclick = () => sayIt(b.dataset.say); });
    const ag = D.body.querySelector('.fc-again'); if (ag) ag.onclick = () => start(S.mode);
    D.body.querySelector('.fc-close').onclick = () => close();
    if (res.length) snd('learned');
    if (G && G.save) { try { G.save(); } catch (e) { /* */ } }
  }

  // ------------------------------------------------------------ open, close, the key
  const mimoName = () => (G && G.state && G.state.mimoName) || (typeof UI !== 'undefined' && UI.mimoName) || 'Mimo';
  let keys = null, opened = false;
  function canOpen(fromJournal) {
    if (!G || !G.state || !G.state.flags || !G.state.flags.hatched) return false;
    const b = document.body.classList;
    if (b.contains('in-battle') || b.contains('on-title') || b.contains('talk-open') || b.contains('phone-open') || b.contains('fm-open')) return false;
    if ((G.journalOpen && !fromJournal) || G.state.teaching || (typeof STORY !== 'undefined' && (STORY.line || STORY.busy))) return false;
    return true;
  }
  function open(mode, o = {}) {
    if (opened) return true;
    if (!o.force && !canOpen(o.fromJournal)) return false;
    dom(); opened = true;
    if (mode) save().mode = mode;
    S = null;
    D.root.classList.remove('hidden'); document.body.classList.add('fc-open');
    if (typeof Input !== 'undefined') Input.typing = true;
    if (G && G.state) { G.state.teaching = true; G.prompt = null; }
    keys = e => {
      if (!opened) return;
      const inInput = document.activeElement === (S && S.inp) && S && S.view === 'card' && !S.flipped;
      const stop = () => { e.preventDefault(); e.stopPropagation(); };
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Escape') { stop(); if (S && S.view === 'card' && S.results && S.results.length) summary(); else close(); return; }
      if (!S) return;
      if (S.view === 'deck') { if (e.key === 'Enter') { stop(); start(); } else if (KEYS.map.cards && KEYS.map.cards.includes(e.code)) { stop(); close(); } return; }
      if (S.view === 'sum') { if (e.key === 'Enter') { stop(); const ag = D.body.querySelector('.fc-again'); if (ag) start(S.mode); else close(); } else if (KEYS.map.cards && KEYS.map.cards.includes(e.code)) { stop(); close(); } return; }
      // a card
      if (e.key === 'Tab') { stop(); hint(); return; }
      const c = card();
      if (inInput && e.key === ' ' && c && c.dir === 'l2e' && !String(S.inp.value || '').trim()) { stop(); flip(); return; }     // (Space on an empty box flips, like the hint says)
      if (inInput) return;                                        // (the box's own Enter submits it)
      if (e.key === 'Enter' || e.key === ' ') { stop(); if (S.flipped) rate(S.pick || 'knew'); else flip(); return; }
      if (S.flipped && /^[123]$/.test(e.key)) { stop(); rate(['knew', 'almost', 'notyet'][+e.key - 1]); }
    };
    addEventListener('keydown', keys, true);
    snd('page');
    deckView();
    return true;
  }
  function close() {
    if (!opened) return;
    opened = false;
    if (S && S.view === 'card' && S.results && S.results.length) { const f = save(); f.sessions = (f.sessions || 0) + 1; f.cards = (f.cards || 0) + S.results.length; }
    S = null;
    if (D.root) D.root.classList.add('hidden'); document.body.classList.remove('fc-open');
    if (typeof Input !== 'undefined') Input.typing = false;
    if (G && G.state) G.state.teaching = false;
    if (keys) { removeEventListener('keydown', keys, true); keys = null; }
    try { speechSynthesis.cancel(); } catch (e) { /* */ }
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (G && G.save) { try { G.save(); } catch (e) { /* */ } }
  }

  // ------------------------------------------------------------ the journal's Flashcards tab (ui.js UI.journalTabs)
  const TAB = {
    id: 'flash',
    label: state => { if (!state || !state.flags || !state.flags.hatched) return null; const d = deck(); return d.all.length ? `🃏 Flashcards${d.due.length ? ` (${d.due.length})` : ''}` : null; },
    html: () => {
      const d = deck(), f = save(), key = (() => { try { return KEYS.keys('cards').split(' / ')[0]; } catch (e) { return 'F'; } })();
      return `<div class="settings" style="max-width:560px"><h4>Flashcards · ${E(langName())}</h4>`
        + `<div class="meter"><span>Due now</span><b style="font-size:20px">${d.due.length}</b><span>· later today ${d.today.length}</span><span>· met, not learned ${d.fresh.length}</span><span>· ${d.all.length} in ${E(mimoName())}’s memory</span></div>`
        + `<p class="note">A short round (10–20 cards) from ${E(mimoName())}’s memory: the due ones first, then words you met lately. See the word and recall it, or see the English and type it. Your answers feed ${E(mimoName())}’s reviews, so the rest of the game knows what you know.${f.sessions ? ` You’ve done ${f.sessions} round${f.sessions === 1 ? '' : 's'} (${f.cards || 0} cards).` : ''}</p>`
        + `<button class="reset" data-fc-open="1" style="background:#21a493;color:#fff;border-color:#2b2235">🃏 Open the deck (${E(key)})</button></div>`;
    },
    wire(el) {
      const b = el.querySelector('[data-fc-open]');
      if (b) b.onclick = () => { if (typeof UI !== 'undefined' && UI.onJournalClose) UI.onJournalClose(); setTimeout(() => open(null, { fromJournal: true }), 60); };
    },
  };
  function init(game) {
    G = game;
    if (typeof UI !== 'undefined') { UI.journalTabs = UI.journalTabs || []; if (!UI.journalTabs.some(t => t.id === TAB.id)) UI.journalTabs.push(TAB); }
    addEventListener('keydown', e => {
      if (opened || (typeof Input !== 'undefined' && Input.typing) || KEYS.capturing || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (!KEYS.map.cards || !KEYS.map.cards.includes(e.code)) return;
      if (canOpen()) { e.preventDefault(); open(); }
    });
  }

  return {
    init, open, close, deck, TAB,
    get isOpen() { return opened; },
    _: { build, dirFor, enScore, usable,
      t: {
        state: () => S, get open() { return opened; },
        start: m => (opened ? start(m) : (open(m, { force: true }), start(m))),
        flip: () => flip(), rate: r => rate(r), hint: () => hint(),
        type: text => { if (S && S.inp) { S.inp.value = text; submit(); return true; } return false; },
        esc: () => { if (S && S.view === 'card' && S.results && S.results.length) summary(); else close(); },
      } },
  };
})();
