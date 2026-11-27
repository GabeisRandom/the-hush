'use strict';
// Everything on top of the 3D view: speech bubbles, thoughts, prompts, the teach box, Noa's
// letters and notebook pages, the journal, the title screen, cards, toasts and fades.

const UI = (() => {
  // The teach, command and naming boxes are <form>s whose submit handlers only exist while a box is open; a stray
  // submit any other time (Enter in a field that kept focus, a click as the box closes) would reload the page and lose
  // everything since the last save. No form in the game ever navigates. (Capture phase: the boxes' own handlers still run.)
  document.addEventListener('submit', e => e.preventDefault(), true);
  let lang = 'es';
  const gloss = id => (LEX.item(id) || {}).en || '';
  // {w.key} → the word in the current language, highlighted, glossed on hover; also counts as seeing it.
  // {w.key} is a word in its base form, {w.key:pl} its plural
  const WRE = /\{(w\.[a-z_]+)(:pl)?\}/g;
  const formOf = (id, pl) => LEX.form(id, { pl: !!pl });
  // zh / ja (CJK.md): lines and words are written in the notation; CJK renders them for the mode (pinyin / rōmaji, or the
  // characters with their readings over them until you know them). Everything below takes that branch only for zh / ja.
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK(lang);
  function words(text, o = {}) {
    if (isC()) return CJK.html(text, { lang, expose: o.expose !== false });
    return esc(text).replace(WRE, (_, id, pl) => {
      if (o.expose !== false) LEX.expose(id);
      return `<span class="w" data-en="${esc(gloss(id) + (pl ? 's' : ''))}">${esc(formOf(id, pl))}</span>`;
    });
  }
  const plainText = text => (isC() ? CJK.plain(text, { lang }) : String(text == null ? '' : text).replace(WRE, (_, id, pl) => formOf(id, pl)));
  const plainLen = text => (isC() ? CJK.len(text, { lang }) : plainText(text).length);
  // what a voice should read: characters for zh / ja (a voice can't read pinyin), else the plain line
  const sayText = text => (isC() ? CJK.chars(String(text == null ? '' : text), { lang }) : plainText(text));
  // say it with the language's voice (zh-CN / ja-JP for zh / ja); false when this PC has no such voice
  const speak = text => (isC() ? CJK.say(text, lang) : Sound.say(text, lang));
  const sayWord = id => speak(isC() ? LEX.src(id) : LEX.form(id));
  // a lines.js line; a zh / ja line that isn't written yet comes back without text, so the English weave is used (never Spanish)
  function lineFor(key, tier) {
    const L = line(key, lang, tier);
    return isC() && !(typeof LINES !== 'undefined' && LINES[key] && LINES[key][lang]) ? Object.assign({}, L, { text: '' }) : L;
  }
  // the first n visible letters of a line, keeping the highlights
  function partial(text, n) {
    if (isC()) return CJK.html(text, { lang, n });
    let out = '', left = n;
    for (const part of text.split(/(\{w\.[a-z_]+(?::pl)?\})/)) {
      if (left <= 0) break;
      const m = part.match(/^\{(w\.[a-z_]+)(:pl)?\}$/);
      if (m) { const w = formOf(m[1], m[2]); out += `<span class="w" data-en="${esc(gloss(m[1]) + (m[2] ? 's' : ''))}">${esc(w.slice(0, left))}</span>`; left -= w.length; }
      else { out += esc(part.slice(0, left)); left -= part.length; }
    }
    return out;
  }

  // ------------------------------------------------------------ the weave (DESIGN.md 12.4)
  // English text with slots: {w.key} (a word Mimo can learn), {c.key} (an everyday word), with :pl
  // or :f. A slot shows the word in the language if Mimo knows it, or if the weave has brought it
  // in (with a small English gloss the first few times). Otherwise it shows the English word.
  const SLOT = /\{([wc]\.[a-z_]+)(?::(pl|f))?\}/g;
  function enOf(id, v) { const it = LEX.item(id) || {}; return v === 'pl' ? (it.enPl || it.en + 's') : (it.en || id); }
  function tlOf(id, v) { if (isC()) return LEX.src(id, { pl: v === 'pl', f: v === 'f' }); const it = LEX.item(id) || {}; if (v === 'pl' && it.pl) return it.pl[lang]; if (v === 'f' && it.f && it.f[lang]) return it.f[lang]; return it[lang] || id; }
  function slotMode(id, W) {
    if (isC() && !LEX.has(id)) return 'en';           // (zh / ja: a word with no text in the language yet stays English)
    if (LEX.taught(id)) return 'tl';
    const it = LEX.item(id); if (!it) return 'en';
    if (it.kind === 'chunk') return it.rank < Math.floor(W * 18) ? 'new' : 'en';
    // a word you've only seen: in the language once the weave has let it in (a few at a time), not the moment you see it
    return LEX.admitted(id) ? 'new' : 'en';
  }
  // Whole lines in the language arrive gradually too: from a weave of 0.48 a growing share of lines (always the same ones,
  // picked by their key) are said in the language with the English under them; from 0.70, every line.
  function fullLine(key, W) {
    if (W >= 0.7) return true;
    if (W < 0.48) return false;
    let h = 2166136261; const k = String(key || ''); for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 1000) / 1000 < (W - 0.48) / 0.22;
  }
  // The pieces of a woven line: { s } plain text, or { s, id, tl, en, gl } a slot.
  function weaveParts(text, o = {}) {
    const parts = [], W = LEX.weave();
    let last = 0, m;
    text = text.replace(/\{mimo\}/g, UI.mimoName || 'Mimo');
    SLOT.lastIndex = 0;
    while ((m = SLOT.exec(text))) {
      if (m.index > last) parts.push({ s: text.slice(last, m.index) });
      const id = m[1], v = m[2], mode = o.english ? 'en' : slotMode(id, W);
      let s = mode === 'en' ? enOf(id, v) : tlOf(id, v);
      const before = text.slice(0, m.index).trimEnd(), start = !before || /[.!?…:]$/.test(before), after = text[m.index + m[0].length];
      if (start) s = cap(s);
      if (start && mode !== 'en' && lang === 'es' && (after === '!' || after === '?')) s = (after === '!' ? '¡' : '¿') + s;
      const p = { s, id, tl: mode !== 'en' };
      if (p.tl && isC()) {        // zh / ja: keep the notation, so the word shows with its reading (p.s is its plain text in the mode)
        p.src = LEX.src(id, { pl: v === 'pl', f: v === 'f' }); p.cap = !!start;
        p.s = CJK.plain(p.src, { lang, cap: p.cap }); p.len = CJK.len(p.src, { lang, cap: p.cap });
      }
      if (p.tl) { p.en = enOf(id, v); if (mode === 'new' && LEX.wv(id) < 3) p.gl = p.en; }
      parts.push(p);
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push({ s: text.slice(last) });
    return parts;
  }
  // Count a line's woven words once, when it's said (so glosses fade after a few times).
  const noteWoven = parts => parts.forEach(p => { if (p.tl) LEX.woven(p.id); });
  function partsHTML(parts, n = 1e9) {
    let out = '', left = n;
    for (const p of parts) {
      if (left <= 0) break;
      if (p.src) {
        const budget = left; left -= p.len;
        out += `<span class="w" data-en="${esc(p.en)}">${CJK.html(p.src, { lang, n: budget, cap: p.cap })}</span>` + (p.gl && left >= 0 ? `<span class="gl">(${esc(p.gl)})</span>` : '');
        continue;
      }
      const vis = p.s.slice(0, left); left -= p.s.length;
      if (!p.id || !p.tl) { out += esc(vis); continue; }
      out += `<span class="w" data-en="${esc(p.en)}">${esc(vis)}</span>` + (p.gl && left >= 0 ? `<span class="gl">(${esc(p.gl)})</span>` : '');
    }
    return out;
  }
  const partsLen = parts => parts.reduce((a, p) => a + (p.len !== undefined ? p.len : p.s.length), 0);
  const weave = (text, o) => partsHTML(weaveParts(text, o));
  const weavePlain = (text, o) => weaveParts(text, o).map(p => p.s).join('');

  // ------------------------------------------------------------ bubbles and prompts (placed every frame)
  function place(el, p, dy = 0) {
    if (!p) { el.style.visibility = 'hidden'; return; }
    const w = el.offsetWidth || 200, h = el.offsetHeight || 60;
    el.style.left = clamp(p.x, w / 2 + 8, innerWidth - w / 2 - 8) + 'px';
    el.style.top = clamp(p.y + dy, h + 8, innerHeight - 8) + 'px';
    el.style.visibility = p.on ? 'visible' : 'hidden';
  }
  // EN: a line's whole English, on request, for that line only (DESIGN.md 16, playtest 5: never under a line by default; the
  // next line starts without it again)
  let showEn = false, enLine = null;
  $('bubble').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.act === 'en') showEn = !showEn;
    if (b.dataset.act === 'say' && UI.onSay) UI.onSay();
    UI._lineKey = '';
  });
  // L: { who, name, parts (a woven English line) or text (a line in the language), html (a demonstration's marked line, shown
  //      once it's out), en (the English, for EN), say, shown, len, full } or null. who 'you' is your own line (no tools).
  function drawLine(L) {
    const el = $('bubble');
    if (!L) { el.classList.remove('on'); UI._lineKey = ''; return; }
    if (L !== enLine) { enLine = L; showEn = false; }
    const key = (L.text || '') + (L.parts ? L.parts.length + L.len : '') + Math.floor(L.shown) + showEn + L.full;
    if (key !== UI._lineKey) {
      UI._lineKey = key;
      const tools = L.who === 'you' || L.who === 'mimo' ? '' : `<span class="tools">${L.say ? '<button data-act="say" title="Hear it in the language">🔊</button>' : ''}<button data-act="en" title="Show this line in English">EN</button></span>`;
      const body = L.parts ? partsHTML(L.parts, Math.floor(L.shown)) : L.full && L.html ? L.html : partial(L.text, Math.floor(L.shown));
      const english = L.full && L.en && showEn && L.en !== plainText(L.text || '') ? `<div class="en">${esc(L.en)}</div>` : '';
      el.className = 'bubble on' + (L.who === 'you' ? ' you' : '') + (L.hushed ? ' hushed' : '');
      el.innerHTML = `<div class="who">${esc(L.name)}${tools}</div><div class="line">${body}</div>${english}${L.full ? '<div class="more">E ▸</div>' : ''}`;
      if (L.full && L.text) words(L.text);          // count the words as seen once the line is out
    }
    el.classList.add('on');
    // zh / ja in character mode: once it's out, the line counts as read for each character in it (its woven words too)
    if (L.full && !L._read && isC()) { L._read = true; if (L.text) CJK.seen(L.text, { lang }); (L.parts || []).forEach(p => { if (p.src) CJK.seen(p.src, { lang }); }); }
  }

  // ------------------------------------------------------------ the teach box
  // Mimo asks what something is called, and you type it (Tab: a hint). If you don't know it, say so
  // ("I don't know", or type ? or idk): the box shows you the word and says it, and you type it once
  // to teach Mimo (DESIGN.md 12.6). Resolves { ok, hints, ms, tries, learned } once Mimo has the
  // word (learned: you were shown it), or { ok: false, cancelled: true }.
  const IDK = new Set(['idk', 'i dont know', 'i don t know', 'dont know', 'dunno', 'no se', 'no lo se', 'nao sei', 'weiss nicht', 'weiß nicht', 'ich weiss nicht', 'ich weiß nicht', 'keine ahnung']);
  const IDK_CJK = new Set(['buzhidao', 'wakaranai', 'wakarimasen', 'shiranai', 'shirimasen']);
  const saysIdk = text => /^\s*[?？]+\s*$/.test(text) || IDK.has(norm(text)) || (isC() && IDK_CJK.has(CJK.canon(text, lang)));
  function teach(id, o = {}) {
    return new Promise(resolve => {
      const box = $('teach'), input = $('teach-input'), hintEl = $('teach-hint'), learnEl = $('teach-learn');
      const it = LEX.item(id) || {}, word = LEX.form(id);
      // zh / ja: the hints spell what you type (pinyin / rōmaji); in character mode the last one adds the characters
      const cj = isC(), src = cj ? LEX.src(id) : '', spell = cj ? CJK.roman(src, { lang, cap: false }) : word, chars = cj && CJK.mode(lang) === 'chars';
      ICONS.draw($('teach-pic'), it.icon);
      $('teach-title').textContent = o.title || (o.review ? `${o.name} wants to check: what's this again?` : `${o.name} wants to know what this is called`);
      box.classList.remove('learn'); learnEl.innerHTML = '';
      let hints = 0, tries = 0, learning = false;
      const t0 = performance.now();
      const showHint = () => {
        hintEl.textContent = hints ? [...spell].map((ch, i) => (i === 0 || (hints >= 2 && i % 2 === 0) || hints >= 3 ? ch : '_')).join(' ') + (chars && hints >= 3 ? ` = ${CJK.chars(src, { lang })}` : '')
          : (o.review ? 'From memory! (? if you forgot it)' : chars ? `Type it in ${lang === 'zh' ? 'pinyin, then pick the characters' : 'rōmaji (Space for kanji)'} · Tab: a hint · ?: I don’t know` : 'Type the word · Tab: a hint · ?: I don’t know');
        hintEl.classList.toggle('given', hints > 0);
      };
      // you don't know it: here it is, out loud; type it once to teach Mimo
      const learn = () => {
        if (learning) return;
        learning = true; box.classList.add('learn');
        $('teach-title').textContent = o.review ? 'No problem! Here it is again:' : 'No problem! It’s called…';
        learnEl.innerHTML = `<b>${cj ? CJK.html(src, { lang, ruby: 'always' }) : esc(LEX.form(id, { article: true }))}</b><span>${esc(it.en || '')}</span><button type="button" title="Hear it">🔊</button>`;
        learnEl.querySelector('button').onclick = () => { speak(cj ? src : word); input.focus(); };
        setTimeout(() => speak(cj ? src : word), 120);
        if (chars) CJK.seen(src, { lang });
        hintEl.textContent = chars ? `Type ${spell}, then pick ${CJK.chars(src, { lang })}, to teach ${o.name}` : `Type it to teach ${o.name}`; hintEl.classList.remove('given');
        input.value = ''; input.placeholder = chars ? spell : word; input.focus();
        if (UI.onLearn) UI.onLearn(id);
      };
      input.value = ''; input.placeholder = 'type the word…'; showHint();
      box.classList.remove('hidden'); Input.typing = true;
      setTimeout(() => input.focus(), 30);
      const done = r => { box.classList.add('hidden'); box.classList.remove('learn'); input.placeholder = 'type the word…'; Input.typing = false; input.blur(); cleanup(); resolve(r); };
      const submit = e => {
        e.preventDefault();
        if (!learning && saysIdk(input.value)) { learn(); return; }
        const r = LEX.check(id, input.value);
        if (r.empty) return;
        if (r.ok) {
          if (cj) { const now = CJK.used(input.value, src, { lang }); if (now.length) setTimeout(() => toast(`✓ You know ${now.join(' ')} now: ${now.length > 1 ? 'their readings fade' : 'its reading fades'} away`), 900); }
          done({ ok: true, hints, ms: performance.now() - t0, tries, typed: input.value, learned: learning }); return;
        }
        tries++;
        if (!learning) { hints = Math.min(3, hints + 1); showHint(); }
        box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
        if (UI.onWrong) UI.onWrong(r.close);
        input.select();
      };
      const key = e => {
        if (e.isComposing || e.keyCode === 229) { e.stopPropagation(); return; }     // (a system IME is composing: its keys are its own)
        if (e.key === 'Tab') { e.preventDefault(); if (!learning) { hints = Math.min(3, hints + 1); showHint(); } }
        if (e.key === 'Escape') { e.preventDefault(); done({ ok: false, cancelled: true, hints }); }
        e.stopPropagation();
      };
      const hintBtn = () => { hints = Math.min(3, hints + 1); showHint(); input.focus(); };
      const idkBtn = () => learn();
      const cancel = () => done({ ok: false, cancelled: true, hints });
      $('teach-form').addEventListener('submit', submit); input.addEventListener('keydown', key);
      $('teach-hintbtn').addEventListener('click', hintBtn); $('teach-idk').addEventListener('click', idkBtn); $('teach-cancel').addEventListener('click', cancel);
      function cleanup() { $('teach-form').removeEventListener('submit', submit); input.removeEventListener('keydown', key); $('teach-hintbtn').removeEventListener('click', hintBtn); $('teach-idk').removeEventListener('click', idkBtn); $('teach-cancel').removeEventListener('click', cancel); }
    });
  }
  // "Tell Mimo": you type a sentence and Mimo acts on the world with the verb it hears (DESIGN.md 14.2:
  // verbs are the keys). o: { name, title, icon, verbs: [every verb id to listen for], hint }.
  // Resolves { verb, text, ms } (verb: the id heard in any word, or null) or { cancelled: true }.
  // The chips show the verbs Mimo already knows, in the language.
  function command(o = {}) {
    return new Promise(resolve => {
      const box = $('command'), input = $('command-input'), hintEl = $('command-hint');
      ICONS.draw($('command-pic'), o.icon || 'star');
      $('command-title').textContent = o.title || `What should ${o.name} do?`;
      const known = (o.verbs || []).filter(id => LEX.item(id) && LEX.taught(id)), cj = isC();
      const wordHTML = (id, ruby) => (cj ? CJK.html(LEX.src(id), { lang, ruby }) : esc(LEX.form(id)));       // (zh / ja: with its reading)
      const chips = known.length ? `${esc(o.name)} knows: ` + known.map(id => `<span class="vchip" title="${esc((LEX.item(id) || {}).en || '')}">${wordHTML(id)}</span>`).join('') : '';
      hintEl.innerHTML = (o.hint ? esc(o.hint) + (chips ? '<br>' : '') : '') + chips;
      input.value = ''; box.classList.remove('hidden'); Input.typing = true;
      input.placeholder = o.placeholder || 'tell Mimo what to do…';
      setTimeout(() => input.focus(), 30);
      const t0 = performance.now(), helpBtn = $('command-help');
      // o.answer: the verb that does the job (or o.model: a whole sentence, for questions).
      // "I don't know" shows it, says it, and you type it
      const hasHelp = (o.answer && LEX.item(o.answer)) || o.model;
      helpBtn.style.display = hasHelp ? '' : 'none';
      const help = () => {
        if (o.model) {
          hintEl.innerHTML = `Try: <span class="vchip">${cj ? CJK.html(o.model, { lang, ruby: 'always' }) : esc(o.model)}</span>${o.modelEn ? ` <i>(${esc(o.modelEn)})</i>` : ''}. Type it!`;
          speak(cj ? o.model : o.model.replace(/[¿?¡!«»]/g, '')); input.value = ''; input.placeholder = cj ? CJK.roman(o.model, { lang }) : o.model; input.focus(); return;
        }
        const it = LEX.item(o.answer) || {}, w = LEX.form(o.answer);
        hintEl.innerHTML = `Try telling ${esc(o.name)}: <span class="vchip">${wordHTML(o.answer, 'always')}</span> <i>(${esc(it.en || '')})</i>. Type it!`;
        sayWord(o.answer); input.value = ''; input.placeholder = cj ? CJK.roman(LEX.src(o.answer), { lang, cap: false }) : w; input.focus();
      };
      const done = r => { box.classList.add('hidden'); Input.typing = false; input.placeholder = 'tell Mimo what to do…'; input.blur(); cleanup(); resolve(r); };
      const submit = e => {
        e.preventDefault();
        const text = input.value.trim(); if (!text) return;
        if (hasHelp && saysIdk(text)) { help(); return; }
        let verb = null;
        if (cj) {                  // zh / ja: no spaces between words, so look for each verb anywhere in what you typed
          let slip = null;         // (a verb heard with a tone typed wrong counts when no verb was heard right, with a note)
          for (const id of o.verbs || []) {
            const info = {};
            if (!LEX.item(id) || !LEX.heard(id, text, info)) continue;
            if (!info.tone) { verb = id; break; }
            if (!slip) slip = { id, tone: info.tone };
          }
          if (!verb && slip) { verb = slip.id; setTimeout(() => toast(`${o.name || 'Mimo'} got it! Tone: «${slip.tone}»`), 300); }
          if (verb) CJK.used(text, LEX.src(verb), { lang });
        } else {
          const words = norm(text).replace(/[^a-z0-9ßäöü\s]/g, ' ').split(/\s+/).filter(Boolean);
          for (const id of o.verbs || []) if (LEX.item(id) && words.some(w => LEX.check(id, w).ok)) { verb = id; break; }
        }
        done({ verb, text, ms: performance.now() - t0 });
      };
      const key = e => { if (e.isComposing || e.keyCode === 229) { e.stopPropagation(); return; } if (e.key === 'Escape') { e.preventDefault(); done({ cancelled: true }); } e.stopPropagation(); };
      const cancel = () => done({ cancelled: true });
      $('command-form').addEventListener('submit', submit); input.addEventListener('keydown', key); $('command-cancel').addEventListener('click', cancel); helpBtn.addEventListener('click', help);
      function cleanup() { $('command-form').removeEventListener('submit', submit); input.removeEventListener('keydown', key); $('command-cancel').removeEventListener('click', cancel); helpBtn.removeEventListener('click', help); }
    });
  }
  // A one-line text box (naming Mimo).
  function ask(title, value) {
    return new Promise(resolve => {
      const box = $('ask'), input = $('ask-input');
      $('ask-title').textContent = title; input.value = value;
      box.classList.remove('hidden'); Input.typing = true; setTimeout(() => { input.focus(); input.select(); }, 30);
      const submit = e => { e.preventDefault(); const v = input.value.trim().slice(0, 14) || value; box.classList.add('hidden'); Input.typing = false; $('ask-form').removeEventListener('submit', submit); input.blur(); resolve(v); };
      $('ask-form').addEventListener('submit', submit);
      input.onkeydown = e => e.stopPropagation();
    });
  }
  // A little menu: pick one (click, a number key, or ↑/↓ then E / Enter; Esc for none). Resolves the
  // option's value, or null.
  function choose(title, options) {
    return new Promise(resolve => {
      let el = $('choose');
      if (!el) { el = document.createElement('div'); el.id = 'choose'; el.className = 'panel hidden'; document.body.appendChild(el); }
      let sel = 0;
      const draw = () => {
        el.innerHTML = `<div class="title">${esc(title)}</div>` + options.map((o, i) => `<button data-i="${i}" class="${i === sel ? 'on' : ''}"><kbd>${i + 1}</kbd><span>${esc(o.label)}${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</span></button>`).join('')
          + `<button data-i="-1" class="cancel">Not now (Esc)</button>`;
        el.querySelectorAll('button').forEach(b => b.onclick = () => done(+b.dataset.i));
      };
      const done = i => { removeEventListener('keydown', key, true); el.classList.add('hidden'); resolve(i >= 0 ? options[i].value : null); };
      const stop = e => { e.preventDefault(); e.stopPropagation(); };
      const key = e => {
        if (/^(Digit|Numpad)[1-9]$/.test(e.code) && +e.code.slice(-1) <= options.length) { stop(e); done(+e.code.slice(-1) - 1); }
        else if (e.code === 'Escape') { stop(e); done(-1); }
        else if (e.code === 'ArrowUp' || e.code === 'KeyW') { stop(e); sel = (sel + options.length - 1) % options.length; draw(); }
        else if (e.code === 'ArrowDown' || e.code === 'KeyS') { stop(e); sel = (sel + 1) % options.length; draw(); }
        else if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') { stop(e); done(sel); }
      };
      draw(); el.classList.remove('hidden');
      setTimeout(() => addEventListener('keydown', key, true), 150);
    });
  }
  // Wait for E / Enter / Space / click. (A card's own buttons, EN and 🔊, don't close it: EN is how you get the English.)
  function waitKey() {
    return new Promise(resolve => {
      const k = e => { if (['KeyE', 'Enter', 'Space', 'Escape'].includes(e.code)) { e.preventDefault(); off(); } };
      const c = e => { if (e && e.target && e.target.closest && e.target.closest('#card button[data-act]')) return; off(); };
      const off = () => { removeEventListener('keydown', k, true); removeEventListener('pointerdown', c, true); setTimeout(resolve, 10); };
      setTimeout(() => { addEventListener('keydown', k, true); addEventListener('pointerdown', c, true); }, 250);
    });
  }
  // A card in the middle: a found word, or one of Noa's notebook pages.
  async function card(html, o = {}) {
    const el = $('card'); el.innerHTML = html; el.className = 'card ' + (o.kind || ''); el.classList.remove('hidden');
    if (o.icon) ICONS.draw(el.querySelector('canvas'), o.icon);
    el.querySelectorAll('[data-act="en"]').forEach(b => b.onclick = e => { e.stopPropagation(); el.querySelector('.en').classList.toggle('show'); fitCard(el); });
    el.querySelectorAll('[data-act="say"]').forEach(b => b.onclick = e => { e.stopPropagation(); speak(b.dataset.text); });
    if (o.say) setTimeout(() => speak(o.say), 300);
    fitCard(el); setTimeout(() => fitCard(el), 350);          // (again once its fonts are in)
    await waitKey();
    el.classList.add('hidden'); el.style.top = el.style.zoom = '';
  }
  // (a small window: a card too tall for its usual spot moves down until it's whole, and one taller than the window shrinks
  // to fit it; every card, every language. signs.js's Read card uses it too. Its CSS top (30%, or a kind's own) stays the spot)
  function fitCard(el = $('card')) {
    if (!el || el.classList.contains('hidden')) return;
    el.style.top = el.style.zoom = '';
    const vh = innerHeight, pad = 8, h = el.offsetHeight; if (!h) return;
    if (h > vh - 2 * pad) { el.style.zoom = ((vh - 2 * pad) / h).toFixed(3); el.style.top = '50%'; return; }
    const at = parseFloat(getComputedStyle(el).top) || vh * 0.3, top = Math.max(pad + h / 2, Math.min(at, vh - pad - h / 2));
    if (Math.abs(top - at) > 0.5) el.style.top = top + 'px';
  }
  addEventListener('resize', () => fitCard());
  // (zh / ja: a new word shows with its reading over it, whatever you know)
  const reveal = id => card(`<canvas width="140" height="140"></canvas><div class="big">${isC() ? CJK.html(LEX.src(id), { lang, ruby: 'always' }) : esc(LEX.form(id))}</div><div class="sub">A new word! Remember it… <b>E</b></div>`,
    { kind: 'reveal', icon: (LEX.item(id) || {}).icon, say: isC() ? LEX.src(id) : LEX.form(id) });
  function page(key, id) {
    // (DESIGN.md 16: like a demonstration, Noa's page is in her language with its word highlighted and glossed small, the picture
    // beside it; the whole English is on request, EN, never under the page by default)
    const L = lineFor(key, 1), under = false;
    if (L.text && isC()) CJK.seen(L.text, { lang });
    // (P7a: mixed by the weave for a beginner, its word always in the language and glossed: js/mixlines.js UI.pageCap)
    const cap = (UI.pageCap && UI.pageCap(key, id)) || (L.text ? words(L.text).replace(/(<span class="w" data-en="([^"]*)">[\s\S]*?<\/span>)/, '$1<span class="gl">($2)</span>') : weave(L.weave || L.en));
    return card(`<div class="tag">Noa's notebook</div><canvas width="130" height="130"></canvas><div class="caption">${cap}</div>`
      + `<div class="row">${L.text ? `<button data-act="say" data-text="${esc(sayText(L.text))}">🔊</button>` : ''}<button data-act="en">EN</button></div><div class="en ${under ? 'show' : ''}">${esc(L.en)}</div><div class="sub">E to close</div>`,
    { kind: 'page', icon: (LEX.item(id) || {}).icon });
  }
  // Noa's letters: English with Noa's words (shown as «word» with the meaning on hover).
  function letterHTML(i) {
    const Lt = LETTERS[i];
    const body = Lt.body.map(p => '<p>' + esc(p).replace(/\{(w\.[a-z_]+)\}/g, (_, id) => { LEX.expose(id); return `<span class="w" data-en="${esc(gloss(id))}">«${isC() ? CJK.html(LEX.src(id), { lang }) : esc(LEX.form(id))}»</span><span class="gl">(${esc(gloss(id))})</span>`; })
      .replace(/▬+/g, m => `<span class="erased">${'&nbsp;'.repeat(m.length * 2)}</span>`) + '</p>').join('');
    return `<div class="date">${esc(Lt.date)}</div>${body}`;
  }
  async function letter(i, o = {}) {
    const el = $('letter'); el.querySelector('.paper').innerHTML = letterHTML(i);
    el.querySelector('.paper').classList.toggle('torn', !!LETTERS[i].erased);
    el.querySelector('.next').textContent = o.last ? (o.lastLabel || 'Fold the letters ▸') : 'Next ▸';
    el.classList.remove('hidden'); Sound.play('page');
    await waitKey();
    el.classList.add('hidden');
  }
  // ------------------------------------------------------------ small things
  // (a full-screen panel is up: the radio quiz and the book club, the exam, the town hall / pen pals / jobs. A toast then waits,
  // so it never lands on the panel's header, and shows once the panel closes, in order; one already showing when a panel
  // opens goes back in line too)
  const PANEL_UP = /(^|\s)(qz|ex|lf)-open(\s|$)/, heldToasts = [];
  let heldT = 0;
  const panelUp = () => PANEL_UP.test(document.body.className);
  function holdToast(text) { if (!heldToasts.includes(text) && heldToasts.push(text) > 8) heldToasts.shift(); if (!heldT) heldT = setInterval(flushToasts, 400); }
  function flushToasts() {
    if (panelUp()) return;
    clearInterval(heldT); heldT = 0;
    heldToasts.splice(0).forEach((t, i) => setTimeout(() => toast(t), i * 350));
  }
  function toast(text) {
    if (panelUp()) { holdToast(text); return; }
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = text; $('toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3200);
  }
  try {
    new MutationObserver(() => { const box = $('toasts'); if (!box || !panelUp()) return; for (const el of [...box.children]) { if (!el.classList.contains('out')) holdToast(el.textContent); el.remove(); } })
      .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  } catch (e) { /* (no body yet: toasts only wait from the next one on) */ }
  function fade(to, ms = 600) { const el = $('fade'); el.style.transition = `opacity ${ms}ms`; el.style.opacity = to; return sleep(ms + 20); }
  async function chapter(title, sub) { const el = $('chapter'); el.innerHTML = `<div class="t">${esc(title)}</div><div class="s">${esc(sub || '')}</div>`; el.classList.add('on'); await sleep(2600); el.classList.remove('on'); await sleep(500); }
  // The goal line at the top left (HTML: it can hold woven words). kind: 'main' | 'side' (quests.js builds the MAIN / SIDE tag,
  // the step and, under a side quest, the main quest's next step; its CSS is there too: DESIGN.md 16)
  let objKey = '';
  function objective(html, kind = 'main') {
    const el = $('objective'), key = html + kind;
    if (key === objKey) return; objKey = key;
    const k1 = a => esc((KEYS.map[a] || []).map(c => KEYS.name(c))[0] || '—');
    el.innerHTML = html ? `${html}<span class="keys"><kbd>${k1('look')}</kbd> ask ${esc(UI.mimoName || 'Mimo')} the way · <kbd>${k1('journal')}</kbd> quest log</span>` : '';
    el.className = (html ? 'on ' : '') + kind;
    $('help-mimo').textContent = UI.mimoName || 'Mimo';
  }
  // The compass strip at the top: the directions, and markers for quest goals.
  // marks: [{ x, z, kind: 'main' | 'side', tracked }]
  const DIRS = [['N', Math.PI], ['NE', 0.75 * Math.PI], ['E', 0.5 * Math.PI], ['SE', 0.25 * Math.PI], ['S', 0], ['SW', -0.25 * Math.PI], ['W', -0.5 * Math.PI], ['NW', -0.75 * Math.PI]];
  let compassBuilt = false;
  function compass(on, yaw, you, marks = []) {
    const el = $('compass');
    el.classList.toggle('on', !!on);
    if (!on) return;
    if (!compassBuilt) {
      compassBuilt = true;
      el.innerHTML = DIRS.map(([n]) => `<span class="d ${n.length > 1 ? 'minor' : ''} ${n === 'N' ? 'n' : ''}">${n}</span>`).join('') + '<span class="m"></span><span class="m"></span><span class="m"></span>';
    }
    const W = el.clientWidth, half = W / 2, span = 1.75;            // ±100° shows across the strip
    const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = -Math.cos(yaw), rz = Math.sin(yaw);
    const angOf = (dx, dz) => Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz);
    el.querySelectorAll('.d').forEach((d, i) => {
      const a = angOf(Math.sin(DIRS[i][1]), Math.cos(DIRS[i][1]));
      d.style.display = Math.abs(a) < span ? '' : 'none';
      d.style.left = (half + (a / span) * (half - 14)) + 'px';
    });
    el.querySelectorAll('.m').forEach((m, i) => {
      const k = marks[i];
      if (!k) { m.style.display = 'none'; return; }
      const dx = k.x - you.x, dz = k.z - you.z, dist = Math.hypot(dx, dz);
      let a = angOf(dx, dz), edge = '';
      if (a > span * 0.92) { a = span * 0.92; edge = 'r'; } else if (a < -span * 0.92) { a = -span * 0.92; edge = 'l'; }
      m.style.display = '';
      m.style.left = (half + (a / span) * (half - 14)) + 'px';
      m.className = `m ${k.kind} ${k.tracked ? 'tracked' : ''} ${dist < 4 ? 'here' : ''}`;
      const icon = k.kind === 'main' ? '★' : '◆', d = dist < 4 ? 'here' : Math.round(dist) + 'm';
      const txt = edge === 'l' ? `◀${icon}` : edge === 'r' ? `${icon}▶` : icon;
      const html = `${txt}${k.tracked ? `<small>${d}</small>` : ''}`;
      if (m._html !== html) { m._html = html; m.innerHTML = html; }
    });
  }
  function counters(pages, nWords) { $('count-pages').textContent = pages; $('count-words').textContent = nWords; }
  const LANGNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  function journal(open, state) {
    const el = $('journal');
    if (!open) { el.classList.add('hidden'); Input.typing = false; return; }
    const hasBag = (state.coins || 0) > 0 || Object.keys(state.bag || {}).length > 0 || !!state.flags.ch1;
    let tab = (el.dataset.tab === 'bag' && !hasBag) ? 'quests' : (el.dataset.tab || 'quests');
    // pages other modules add (UI.journalTabs: { id, label(state) → its button text, or null to hide it; html(state); wire(el, state) }):
    // free talk's "My Spanish" and People (js/talk/meter.js), the reading log (js/read/)
    const extra = (UI.journalTabs || []).filter(t => { try { return !!(t && t.id && t.label(state)); } catch (e) { return false; } });
    if (!['quests', 'words', 'phrases', 'bag', 'letters', 'pages', 'settings'].includes(tab) && !extra.some(t => t.id === tab)) tab = 'quests';
    // phrases: slang, swears and everyday expressions the townsfolk teach you (LEX items of kind 'phrase' you've been taught,
    // plus town life's, which it keeps in its own save: the smokers' slang and the swearer's words)
    const phrases = LEX.taughtList().map(id => LEX.item(id)).filter(it => it && it.kind === 'phrase' && it[lang])
      .map(it => ({ id: it.id, said: it.register === 'swear' ? swearText(isC() ? CJK.plain(it[lang], { lang }) : it[lang]) : it[lang], en: it.en || '', note: it.note || '', region: it.region || '', register: it.register, voice: it[lang] }));
    if (typeof TOWNLIFE !== 'undefined' && TOWNLIFE.phrasebook) {
      try { for (const p of TOWNLIFE.phrasebook()) if (p.learned && !phrases.some(q => q.id === p.id)) phrases.push({ id: p.id, said: p.shown, en: p.en || '', note: p.note || '', region: p.region || (p.from ? `from ${p.from}` : ''), register: p.register, voice: p.phrase }); } catch (e) { /* (town life not set up yet) */ }
    }
    // a strip over the tabs, from other modules (UI.journalHead: [fn(state) → html]; meter.js: play time and the bar to your next level)
    const head = (UI.journalHead || []).map(f => { try { return f(state) || ''; } catch (e) { return ''; } }).filter(Boolean).join('');
    // every page, in the order they've always had (P7b: hud.js sorts them into a few sections with sub-tabs, and puts Save,
    // Title and Close in the corner; without hud.js, the old single row). An extra page may carry group: 'story' | 'words' | …
    const pages = [{ id: 'quests', label: 'Quests' }, { id: 'words', label: `${state.mimoName}'s words` }]
      .concat(phrases.length ? [{ id: 'phrases', label: `Phrasebook (${phrases.length})` }] : [], hasBag ? [{ id: 'bag', label: `Bag 🪙 ${state.coins || 0}` }] : [])
      .concat(extra.map(t => ({ id: t.id, label: (() => { try { return String(t.label(state)); } catch (e) { return t.id; } })(), group: t.group })))
      .concat([{ id: 'letters', label: 'Noa\'s letters' }, { id: 'pages', label: `Notebook pages (${state.pages.length})` }, { id: 'settings', label: '⚙ Settings' }]);
    let html = typeof HUD !== 'undefined' && HUD.journalNav ? HUD.journalNav(pages, tab, state, head)
      : (head ? `<div class="jhead">${head}</div>` : '') + '<div class="tabs">' + pages.map(p => `<button data-tab="${esc(p.id)}" class="${tab === p.id ? 'on' : ''}">${esc(p.label)}</button>`).join('')
        + `<button class="savebtn" title="Save your game now (${esc(KEYS.keys('save'))} or Ctrl+S)">💾 Save</button><button class="quit" title="Save, then go back to the title screen to switch saves">Save &amp; title</button><button class="close">Close (${esc(KEYS.keys('journal').split(' / ')[0])})</button></div>`;
    html += '<div class="body">';
    // every word Mimo can learn: the world's, the verbs, and what the shops sell
    const shopItems = typeof SHOP !== 'undefined' && SHOP.ITEMS ? (Array.isArray(SHOP.ITEMS) ? SHOP.ITEMS : Object.entries(SHOP.ITEMS).map(([id, v]) => Object.assign({ id }, v))) : [];
    const allWords = () => { const ids = new Set(WORDS.map(w => w.id)); ['v.jump', 'v.hit', 'v.throw', 'v.push', 'v.eat', 'v.swim', 'w.coin'].concat(shopItems.map(i => i.id)).forEach(id => ids.add(id)); return [...ids].map(id => LEX.item(id)).filter(Boolean); };
    if (tab === 'quests') {
      // the quest log (quests.js: the main quest, then the side quests by place, then what's done); the weave's meter after it
      const w = Math.round(LEX.weave() * 100);
      html += typeof QUESTS !== 'undefined' ? QUESTS.html() : '';
      html += `<div class="meter"><span>${LANGNAME[lang]} in conversations</span><i><b style="width:${w}%"></b></i><span>${w}%</span><small>It grows as ${esc(state.mimoName)} learns, and faster the quicker you pick words up.</small></div>`;
    } else if (tab === 'words') {
      // words you've seen; ones you haven't learned show "?" and a Learn it button that shows and says them
      const list = allWords().filter(w => LEX.seen(w.id));
      html += list.length ? '<div class="words">' + list.map(w => {
        const s = LEX.st(w.id), shown = LEX.taught(w.id) || s.peek;
        const dots = [1, 2, 3, 4].map(k => `<i class="${s.stage >= k ? 'f' : ''}"></i>`).join('');
        return `<div class="wcard ${LEX.taught(w.id) ? 'taught' : ''}"><canvas data-icon="${w.icon}" width="56" height="56"></canvas><b>${shown ? (isC() ? CJK.html(LEX.src(w.id), { lang }) : esc(LEX.form(w.id, { article: true }))) : '?'}</b><span>${esc(w.en)}</span>`
          + (shown ? `<button data-hear="${w.id}" title="Hear it">🔊</button>` : `<button data-learn="${w.id}">Learn it</button>`) + `<span class="dots">${dots}</span></div>`;
      }).join('') + '</div>' : '<p class="empty">No words yet.</p>';
      html += `<p class="note">? = seen, but not learned yet: <b>Learn it</b> shows you the word and says it. Dots: seen → taught → known → mastered. Pace right now: ${LEX.pace().toFixed(2)}× · working set ${LEX.open()}/${LEX.limit()}</p>`;
    } else if (tab === 'bag' && UI.bagTab) {
      // (P6b: Mimo's hearts, what each food does, and feeding it out of a fight: js/pantry.js)
      try { html += UI.bagTab.html(state); } catch (e) { console.error('[journal] bag', e); html += '<p class="empty">The bag couldn’t be shown.</p>'; }
    } else if (tab === 'bag') {
      // coins and food (food heals in battle: «¡come la manzana!»)
      const bag = state.bag || {}, ids = Object.keys(bag).filter(id => bag[id] > 0);
      const healOf = id => { const it = shopItems.find(i => i.id === id); return it && it.heal ? it.heal : 0; };
      html += `<div class="meter"><span>🪙 ${state.coins || 0} coins</span><small>You earn coins in fights (more for better sentences) and spend them at Molinar's market, by asking for things.</small></div>`;
      html += ids.length ? '<div class="words">' + ids.map(id => {
        const it = LEX.item(id) || { en: id }, n = bag[id], h = healOf(id);
        return `<div class="wcard taught"><canvas data-icon="${it.icon || ''}" width="56" height="56"></canvas><b>${n} × ${esc(LEX.taught(id) || LEX.seen(id) ? LEX.form(id, { pl: n > 1 }) : it.en)}</b><span>${esc(it.en || '')}${h ? ` · heals ${'♥'.repeat(h)}` : ''}</span></div>`;
      }).join('') + '</div>' : '<p class="empty">Your bag is empty.</p>';
    } else if (tab === 'phrases') {
      // grouped like a real phrasebook: everyday expressions, then slang by where it's from, then the swears (bleepable)
      const reg = it => it.register === 'swear' ? 'swear' : it.register === 'slang' ? 'slang' : 'casual';
      const groups = [['casual', 'Everyday expressions'], ['slang', 'Slang'], ['swear', 'Swearing (handle with care)']];
      for (const [r, title] of groups) {
        const list = phrases.filter(it => reg(it) === r); if (!list.length) continue;
        html += `<h4 class="ph-h">${title}</h4><div class="phrases">` + list.map(it => {
          return `<div class="phrase"><b>${isC() && r !== 'swear' ? CJK.html(it.said, { lang }) : esc(it.said)}</b><span>${esc(it.en)}</span>${it.region ? `<i>${esc(it.region)}</i>` : ''}${it.note ? `<small>${esc(it.note)}</small>` : ''}`
            + (r === 'swear' && KEYS.opts.bleep ? '' : `<button data-say="${esc(it.voice)}" title="Hear it">🔊</button>`) + '</div>';
        }).join('') + '</div>';
      }
    } else if (extra.some(t => t.id === tab)) {
      try { html += extra.find(t => t.id === tab).html(state) || ''; } catch (e) { console.error('[journal] ' + tab, e); html += '<p class="empty">This page couldn’t be shown.</p>'; }
    } else if (tab === 'letters') html += LETTERS.map((_, i) => `<div class="mini-letter ${LETTERS[i].erased ? 'torn' : ''}">${letterHTML(i)}</div>`).join('');
    else if (tab === 'settings') html += settingsHTML();
    else html += state.pages.length ? state.pages.map(k => { const m = UI.pageMini && UI.pageMini(k); if (m) return m; const L = lineFor(k, 1); return `<div class="mini-page"><b>${L.text ? words(L.text, { expose: false }) : esc(L.en)}</b><span>${esc(L.en)}</span></div>`; }).join('') : '<p class="empty">No pages found yet. Noa pinned them around the forest.</p>';
    el.innerHTML = html + '</div>';
    el.querySelectorAll('canvas[data-icon]').forEach(cv => ICONS.draw(cv, cv.dataset.icon));
    el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { el.dataset.tab = b.dataset.tab; journal(true, state); });
    // Track: your own choice is the only way a side quest gets the focus (quests.js track(id, 'user'))
    el.querySelectorAll('[data-track]').forEach(b => b.onclick = () => {
      const id = b.dataset.track; QUESTS.track(id, 'user'); Sound.play('click');
      toast(id === 'main' ? '★ Back to the main quest' : '◆ Tracking a side quest. The main quest stays in the corner.');
      journal(true, state);
    });
    el.querySelectorAll('[data-learn]').forEach(b => b.onclick = () => { const id = b.dataset.learn; LEX.st(id).peek = true; LEX.expose(id); sayWord(id); journal(true, state); });
    el.querySelectorAll('[data-hear]').forEach(b => b.onclick = () => sayWord(b.dataset.hear));
    el.querySelectorAll('[data-say]').forEach(b => b.onclick = () => { if (b.dataset.say) speak(b.dataset.say); });
    // zh / ja: pinyin / rōmaji or characters (Settings)
    el.querySelectorAll('[data-script]').forEach(b => b.onclick = () => {
      CJK.setMode(b.dataset.script); Sound.play('click'); UI._lineKey = ''; objKey = '';
      toast(b.dataset.script === 'chars' ? (lang === 'zh' ? 'Characters, with pinyin over them until you know them' : 'Kana & kanji, with readings over them until you know them') : (lang === 'zh' ? 'Pinyin' : 'Rōmaji'));
      journal(true, state);
    });
    el.querySelector('.close').onclick = () => UI.onJournalClose && UI.onJournalClose();
    el.querySelector('.quit').onclick = () => UI.onQuitToTitle && UI.onQuitToTitle();
    el.querySelector('.savebtn').onclick = () => { Sound.play('click'); if (UI.onSaveNow) UI.onSaveNow(); };
    // Settings: click a key, then press the new one (Esc cancels)
    const changed = () => { helpBar(); if (UI.onKeysChanged) UI.onKeysChanged(); };
    el.querySelectorAll('[data-bind]').forEach(b => b.onclick = () => {
      KEYS.capturing = b.dataset.bind; journal(true, state);
      const onKey = e => {
        e.preventDefault(); e.stopPropagation();
        removeEventListener('keydown', onKey, true);
        const a = KEYS.capturing; KEYS.capturing = null;
        if (e.code !== 'Escape' && a) { KEYS.set(a, e.code); Sound.play('click'); changed(); }
        journal(true, state);
      };
      addEventListener('keydown', onKey, true);
    });
    el.querySelectorAll('[data-opt]').forEach(i => { i.onchange = i.oninput = () => { KEYS.setOpt(i.dataset.opt, i.type === 'checkbox' ? i.checked : +i.value); changed(); }; });
    const rs = el.querySelector('.settings .reset'); if (rs) rs.onclick = () => { KEYS.reset(); Sound.play('click'); changed(); journal(true, state); };
    { const T = extra.find(t => t.id === tab); if (T && T.wire) try { T.wire(el, state); } catch (e) { console.error('[journal] ' + tab, e); } }
    if (tab === 'bag' && UI.bagTab && UI.bagTab.wire) try { UI.bagTab.wire(el, state); } catch (e) { console.error('[journal] bag', e); }
    if (tab === 'settings') for (const P of UI.settingsParts || []) { if (P && P.wire) try { P.wire(el, state); } catch (e) { console.error('[settings] ' + (P.id || ''), e); } }
    el.classList.remove('hidden');
  }
  function settingsHTML() {
    const groups = [['Moving', ['up', 'down', 'left', 'right', 'run', 'jump']], ['Camera', ['camLeft', 'camRight', 'camUp', 'camDown', 'zoomIn', 'zoomOut']],
      ['Doing things', ['interact', 'look', 'journal', 'save', 'phone', 'cards', 'help'].filter(a => KEYS.map[a])]];
    let s = `<div class="settings"><p class="note">Click a key, then press the key you want for it (Esc cancels). Dragging with the mouse and the mouse wheel still move the camera too.</p>`;
    if (isC()) {           // zh / ja: shown and typed in pinyin / rōmaji, or in characters (CJK.md)
      const m = CJK.mode(lang), zh = lang === 'zh';
      s += `<h4>Writing</h4><div class="krow"><span>${zh ? 'Chinese' : 'Japanese'} is shown and typed in</span><span class="seg">`
        + `<button data-script="roman" class="${m === 'roman' ? 'on' : ''}">${zh ? 'Pinyin' : 'Rōmaji'}</button>`
        + `<button data-script="chars" class="${m === 'chars' ? 'on' : ''}">${zh ? '<span lang="zh-Hans">汉字</span> Characters' : '<span lang="ja">かな・漢字</span> Kana &amp; kanji'}</button></span></div>`
        + `<p class="note">${zh ? 'Characters: pinyin shows over each character until you know it (read it in a few lines, type it right a few times). You type pinyin, then pick the characters: Space or Enter takes the first, 1–9 picks.'
          : 'Kana & kanji: rōmaji shows over the kana you don’t know yet, and readings over the kanji, until you know them. You type rōmaji, which turns into kana; Space lists kanji and katakana, 1–9 picks, Enter keeps it.'}</p>`;
    }
    for (const [title, acts] of groups) {
      s += `<h4>${title}</h4>`;
      for (const a of acts) {
        const cap = KEYS.capturing === a;
        s += `<div class="krow"><span>${esc(KEYS.LABEL[a].replace('Mimo', UI.mimoName))}</span><button data-bind="${a}" class="${cap ? 'cap' : ''}">${cap ? 'Press a key…' : esc(KEYS.keys(a))}</button></div>`;
      }
    }
    s += `<h4>Options</h4>`
      + `<label class="krow"><span>Invert the camera's up and down</span><input type="checkbox" data-opt="invertY" ${KEYS.opts.invertY ? 'checked' : ''}></label>`
      + `<label class="krow"><span>Camera turning speed</span><input type="range" min="0.4" max="2" step="0.1" value="${KEYS.opts.camSpeed || 1}" data-opt="camSpeed"></label>`
      + `<label class="krow"><span>Show the mini-map</span><input type="checkbox" data-opt="minimap" ${KEYS.opts.minimap !== false ? 'checked' : ''}></label>`
      + `<label class="krow"><span>Bleep swear words (m***)</span><input type="checkbox" data-opt="bleep" ${KEYS.opts.bleep ? 'checked' : ''}></label>`;
    // more sections from other modules (UI.settingsParts: [{ id, html() → markup, wire(el, state) }]: the voices, js/voices.js)
    for (const P of UI.settingsParts || []) { try { s += (P && P.html && P.html()) || ''; } catch (e) { console.error('[settings] ' + ((P && P.id) || ''), e); } }
    s += `<button class="reset">Reset to the defaults</button></div>`;
    return s;
  }
  // a swear word as shown: bleeped (first letter of each word + ***) when Settings asks for it
  const swearText = s => (KEYS.opts.bleep ? String(s).replace(/[\p{L}']{2,}/gu, w => w[0] + '*'.repeat(Math.max(3, w.length - 1))) : String(s));
  // the little "Saved" chip in the corner (every save, by hand or automatic)
  let savedT = null;
  function savedChip() {
    let el = $('saved-chip');
    if (!el) { el = document.createElement('div'); el.id = 'saved-chip'; el.textContent = '💾 Saved'; document.body.appendChild(el); }
    el.classList.add('on'); clearTimeout(savedT); savedT = setTimeout(() => el.classList.remove('on'), 1600);
  }
  // the key help along the bottom of the screen, from the current bindings (P7b: hud.js draws a short one, «H all keys»)
  function helpBar() {
    if (typeof HUD !== 'undefined' && HUD.helpBar) { try { HUD.helpBar(true); return; } catch (e) { console.error('[hud] help bar', e); } }
    const el = $('help'); if (!el) return;
    const K = a => `<kbd>${esc((KEYS.map[a] || []).map(c => KEYS.name(c))[0] || '—')}</kbd>`;
    const mv = ['up', 'left', 'down', 'right'].map(a => KEYS.name(KEYS.map[a][0] || '?')).join('');
    const cm = ['camLeft', 'camRight', 'camUp', 'camDown'].map(a => KEYS.name(KEYS.map[a][0] || '?')).join('');
    el.innerHTML = `<kbd>${esc(mv)}</kbd> move · <kbd>${esc(cm)}</kbd> camera · ${K('jump')} jump · ${K('run')} run · ${K('interact')} talk / read · ${K('look')} ask <span id="help-mimo">${esc(UI.mimoName)}</span> the way · ${K('journal')} journal &amp; settings · ${K('cards')} flashcards · ${K('save')} save · <kbd>M</kbd> music`;
  }
  // zh / ja: the in-game IME on the boxes you answer in (it only acts in character mode), and the Settings switch's look
  if (typeof CJK !== 'undefined') { CJK.attachIME($('teach-input')); CJK.attachIME($('command-input')); }
  { const st = document.createElement('style'); st.textContent = '.settings .seg { display: flex; gap: 6px; } .settings .seg button { min-width: 0; } .settings .seg button.on { background: var(--ink); color: var(--paper); }'; document.head.appendChild(st); }
  return {
    get lang() { return lang; }, set lang(l) { lang = l; },
    words, plainText, plainLen, partial, place, drawLine, teach, command, ask, choose, waitKey, card, fitCard, reveal, page, letter, toast, panelUp, fade, chapter, objective, compass, counters, journal, helpBar,
    weave, weaveParts, weavePlain, partsHTML, partsLen, noteWoven, swearText, savedChip, fullLine,
    sayText, speak, lineFor, LANGNAME,           // (zh / ja: what to speak, saying it with the right voice, lines that never fall back to Spanish)
    onSay: null, onWrong: null, onJournalClose: null, onQuitToTitle: null, onSaveNow: null, _lineKey: '', mimoName: 'Mimo',
    journalTabs: [],          // (more journal pages: js/talk/meter.js, js/read/; see journal())
    journalHead: [],          // (a strip over the journal's tabs: meter.js's play time and level bar)
    settingsParts: [],        // (more Settings sections: js/voices.js, the voice for each language; see settingsHTML())
  };
})();
