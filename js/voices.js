'use strict';
// VOICES (P7b, playtest 7: "can you make the text to speech sound less robotic? i know its a robot but still."): which voice
// reads each language, and how.
//   • The most natural voice the system has: Edge's «Microsoft … Online (Natural)», then Chrome's «Google …» (both online), then
//     any other online voice, then this computer's own (Windows: Sabina, Maria, Katja, Haruka, Huihui… in that order). Inside
//     each kind es-MX / es-US / es-419 come before es-ES, pt-BR before pt-PT, de-DE, zh-CN (never Cantonese), ja-JP.
//   • Settings (the journal): a voice picker for each language (the save's own first; the others folded away), a Test button
//     and a speaking-speed slider. Remembered in localStorage (lrpg.voice).
//   • Tuned: this computer's voices a touch slower (they rush) and a hair brighter; a word said on its own slower still, so
//     you hear it; «¡…!» lifted and «¿…?» rising a little; and a slight change from line to line, so repeats don't sound stamped.
//   • Offline-safe: with no connection the online voices are skipped. One that errors or hasn't started after 1.6 s is cut off
//     and the line is said again by this computer's best voice; online voices then rest for 2 minutes. Nothing here throws.
// Sound.say (audio.js), so every 🔊 and line in the game, goes through VOICES.speak; SPEECH (js/read/speech.js) orders its voices
// with VOICES.order and falls back the same way.
//   VOICES.list(lang) → ranked voices · best(lang) → the voice to use (null: none) · speak(text, lang, o) → bool
//   VOICES.order(lang, voices) · tune(voice, text) → { rate, pitch } · failed(voice) · online() · test(lang)
//   VOICES.pref(lang) / setPref(lang, voiceURI|'') · rate / setRate(x) · ready(ms) → Promise
const VOICES = (() => {
  const syn = () => (typeof window !== 'undefined' && window.speechSynthesis) || null;
  const clampV = (v, a, b) => Math.max(a, Math.min(b, v));
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const NAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  const REGION = { es: ['es-mx', 'es-us', 'es-419', 'es-'], pt: ['pt-br', 'pt-'], de: ['de-de', 'de-at', 'de-ch', 'de-'], zh: ['zh-cn', 'cmn', 'zh-tw', 'zh-'], ja: ['ja-jp', 'ja-'] };
  const NOT = { zh: /(^|[-_])(hk|yue|mo)([-_]|$)/i };                    // (never Cantonese)
  // this computer's own voices, best first (Windows' newer voices before the older ones; anything else after these)
  const LOCAL = { es: ['sabina', 'dalia', 'elvira', 'helena', 'laura', 'raul', 'pablo'], pt: ['maria', 'francisca', 'daniel', 'helia'], de: ['katja', 'hedda', 'stefan'],
    zh: ['huihui', 'xiaoxiao', 'yaoyao', 'kangkang'], ja: ['haruka', 'nanami', 'ayumi', 'sayaka', 'ichiro'] };
  const TEST = { es: '¡Hola! ¿Vamos al lago? Hace un día muy bonito.', pt: 'Olá! Vamos ao lago? Está um dia muito bonito.',
    de: 'Hallo! Gehen wir zum See? Heute ist so ein schöner Tag.', zh: '你好！我们去湖边吧？今天天气真好。', ja: 'こんにちは！湖へ行きましょうか。今日はいい天気ですね。' };
  const langOf = l => { const s = String(l || '').toLowerCase(); return s.startsWith('zh') || s.startsWith('cmn') ? 'zh' : s.slice(0, 2); };
  const tag = v => String(v.lang || '').replace(/_/g, '-').toLowerCase();

  // ------------------------------------------------------------ what's remembered
  const KEY = 'lrpg.voice';
  let saved = { voice: {}, rate: 1 };
  try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && typeof s === 'object') saved = { voice: Object.assign({}, s.voice || {}), rate: +s.rate || 1 }; } catch (e) { /* (storage blocked) */ }
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* (storage blocked) */ } };
  const pref = l => saved.voice[langOf(l)] || '';
  function setPref(l, uri) { saved.voice[langOf(l)] = uri || ''; if (!uri) delete saved.voice[langOf(l)]; store(); }
  function setRate(x) { saved.rate = clampV(+x || 1, 0.7, 1.3); store(); }

  // ------------------------------------------------------------ the voices, ranked
  let voices = [];
  const load = () => { try { const s = syn(); voices = s ? s.getVoices() || [] : []; } catch (e) { voices = []; } };
  load();
  const waiting = [];
  try { const s = syn(); if (s) { const on = () => { load(); waiting.splice(0).forEach(f => { try { f(); } catch (e) { /* */ } }); changed(); }; if (s.addEventListener) s.addEventListener('voiceschanged', on); else s.onvoiceschanged = on; } } catch (e) { /* */ }
  function ready(ms = 1200) { if (voices.length) return Promise.resolve(true); load(); if (voices.length) return Promise.resolve(true); return new Promise(r => { const t = setTimeout(() => r(false), ms); waiting.push(() => { clearTimeout(t); r(true); }); }); }
  // online voices are skipped while the computer is offline, and for 2 minutes after one fails
  let netRest = 0;
  const online = () => (typeof navigator === 'undefined' || navigator.onLine !== false) && Date.now() > netRest;
  function failed(v) { if (v && !v.localService) netRest = Date.now() + 120000; }
  const kindOf = v => (/natural/i.test(v.name) ? 'natural' : /google/i.test(v.name) ? 'google' : !v.localService ? 'online' : 'local');
  function score(v, l) {
    const t = tag(v), n = String(v.name).toLowerCase(), want = REGION[l] || [l + '-'];
    let ri = want.findIndex(w => (w.endsWith('-') ? t === w.slice(0, -1) || t.startsWith(w) : t.startsWith(w)));
    if (ri < 0) ri = want.length;
    const k = kindOf(v), base = k === 'natural' ? 300 : k === 'google' ? 200 : k === 'online' ? 120 : 0;
    const li = (LOCAL[l] || []).findIndex(x => n.includes(x));
    return base - ri * 20 + (k === 'local' ? (li < 0 ? 5 : 60 - li * 6) : 0) + (v.default ? 1 : 0);
  }
  function matches(v, l) { const t = tag(v); return (t === l || t.startsWith(l + '-') || (l === 'zh' && t.startsWith('cmn'))) && !(NOT[l] && NOT[l].test(t)); }
  function list(lang) {
    const l = langOf(lang); if (!voices.length) load();
    return voices.filter(v => matches(v, l)).sort((a, b) => score(b, l) - score(a, l));
  }
  // the voice to use: yours if you picked one (and it can speak now), else the best that can
  function best(lang) {
    const L = list(lang); if (!L.length) return null;
    const ok = v => v.localService || online(), p = pref(lang);
    if (p) { const v = L.find(x => x.voiceURI === p || x.name === p); if (v && ok(v)) return v; }
    return L.find(ok) || L[0];
  }
  // SPEECH's list for a language, in this order: the one best() picks first, then by rank (online ones last while offline)
  function order(lang, given) {
    const l = langOf(lang), b = best(l), arr = (given || list(l)).slice();
    const rank = v => (v === b ? 1e4 : 0) + (v.localService || online() ? 1000 : 0) + score(v, l);
    return arr.sort((x, y) => rank(y) - rank(x));
  }

  // ------------------------------------------------------------ how it's said
  const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  function tune(v, text, o = {}) {
    const local = !v || !!v.localService;
    let rate = (local ? 0.9 : 0.96) * (saved.rate || 1), pitch = local ? 1.04 : 1.0;
    const s = String(text || '').trim(), cj = /[぀-ヿ㐀-鿿]/.test(s), n = cj ? s.replace(/[\s。、！？!?]/g, '').length : s.split(/\s+/).filter(Boolean).length;
    if (cj ? n <= 3 : n <= 2) rate *= 0.94;                                         // a word on its own: slower, so you hear it
    if (/[!！]\s*$/.test(s) || /^¡/.test(s)) { pitch += 0.06; rate *= 1.03; }        // a shout lifts
    else if (/[?？]\s*$/.test(s)) pitch += 0.04;                                    // a question rises a little
    pitch += ((hash(s) % 7) - 3) * 0.008;                                           // (±0.024: no two lines stamped the same)
    if (o.rate) rate *= o.rate;
    return { rate: +clampV(rate, 0.5, 1.6).toFixed(3), pitch: +clampV(pitch, 0.6, 1.5).toFixed(3) };
  }
  const keep = new Set();                 // (Chrome drops utterances nobody holds, and their events never come)
  let gen = 0;
  function utter(text, v, l, o, retry) {
    const s = syn(); if (!s || !v) return false;
    let u;
    try { u = new SpeechSynthesisUtterance(text); } catch (e) { return false; }
    u.voice = v; u.lang = v.lang;
    const t = tune(v, text, o); u.rate = t.rate; u.pitch = t.pitch;
    const my = gen;
    let started = false, done = false;
    const fallback = () => {
      if (done || started || !retry || v.localService || my !== gen) return;
      done = true; failed(v);
      const lv = list(l).find(x => x.localService); if (!lv) return;
      try { s.cancel(); } catch (e) { /* */ }
      gen++; utter(text, lv, l, o, false);
    };
    u.onstart = () => { started = true; };
    u.onend = () => { keep.delete(u); if (o.onEnd) try { o.onEnd(); } catch (e) { /* */ } };
    u.onerror = e => { keep.delete(u); const why = (e && e.error) || ''; if (why !== 'interrupted' && why !== 'canceled') fallback(); };
    keep.add(u); setTimeout(() => keep.delete(u), 30000);
    if (!v.localService) setTimeout(fallback, o.startWait || 1600);
    try { s.speak(u); } catch (e) { keep.delete(u); fallback(); return false; }
    return u;
  }
  // say it (what Sound.say does now): true if a voice for the language is there
  function speak(text, lang, o = {}) {
    const s = syn(); if (!s || text == null) return false;
    const l = langOf(lang), v = o.voice || best(l); if (!v) return false;
    const t = String(text).replace(/[{}]/g, '').trim(); if (!t) return true;
    try { s.cancel(); } catch (e) { /* */ }
    gen++;
    return !!utter(t, v, l, o, true);
  }
  const test = (l, voice) => speak(TEST[langOf(l)] || TEST.es, l, voice ? { voice } : {});

  // ------------------------------------------------------------ Settings (the journal): the voice for each language, and the speed
  let G = null;
  function rowHTML(l, open) {
    const L = list(l), b = best(l), p = pref(l);
    if (!L.length) return `<div class="krow vrow"><span>${NAME[l]}</span><i class="vnone">No ${NAME[l]} voice on this computer</i></div>`;
    const where = v => (v.localService ? 'this computer' : 'online');
    const opts = [`<option value="">Best available: ${E(b ? short(b) : '')}</option>`].concat(L.map(v => `<option value="${E(v.voiceURI)}" ${p && (p === v.voiceURI || p === v.name) ? 'selected' : ''}>${E(short(v))} · ${where(v)}${kindOf(v) === 'natural' || kindOf(v) === 'google' ? ' ★' : ''}</option>`));
    return `<div class="krow vrow${open ? ' cur' : ''}"><span>${NAME[l]}</span><span class="vctl"><select data-voice="${l}">${opts.join('')}</select><button data-vtest="${l}" title="Hear it">▶ Test</button></span></div>`;
  }
  const short = v => String(v.name).replace(/^Microsoft\s+/, '').replace(/\s+-\s+.*$/, '').replace(/\s*\(Natural\)/, ' (Natural)');
  const curLang = () => (typeof LEX !== 'undefined' && LEX.lang) || 'es';
  function settingsHTML() {
    css();
    const cur = langOf(curLang()), others = LANGS.filter(l => l !== cur);
    const b = best(cur), net = b && !b.localService;
    return `<h4>Voice</h4>${rowHTML(cur, true)}`
      + `<label class="krow"><span>Speaking speed</span><span class="vctl"><input type="range" min="0.7" max="1.3" step="0.05" value="${saved.rate || 1}" data-vrate><b class="vrate">${(saved.rate || 1).toFixed(2)}×</b></span></label>`
      + `<details class="vmore"><summary>The other languages’ voices</summary>${others.map(l => rowHTML(l)).join('')}</details>`
      + `<p class="note">★ online voices (Google, Microsoft Natural) sound the most natural, but need the internet. Without it, this computer’s own voice takes over by itself.${net ? '' : ' (No online voice is reachable right now: this computer’s own is speaking.)'}</p>`;
  }
  function wire(el) {
    el.querySelectorAll('[data-voice]').forEach(s => { s.onchange = () => { setPref(s.dataset.voice, s.value); test(s.dataset.voice); }; s.onkeydown = e => e.stopPropagation(); });
    el.querySelectorAll('[data-vtest]').forEach(b => { b.onclick = () => { const l = b.dataset.vtest, sel = el.querySelector(`[data-voice="${l}"]`), v = sel && sel.value ? list(l).find(x => x.voiceURI === sel.value) : null; if (!test(l, v) && typeof UI !== 'undefined') UI.toast(`No ${NAME[l]} voice on this computer`); }; });
    const r = el.querySelector('[data-vrate]');
    if (r) { r.oninput = () => { setRate(r.value); const t = el.querySelector('.vrate'); if (t) t.textContent = (+r.value).toFixed(2) + '×'; }; r.onchange = () => test(curLang()); }
  }
  // (the voice list arrives late in Chrome: Settings, if it's open, is drawn again)
  function changed() {
    try { if (G && G.journalOpen && typeof UI !== 'undefined') { const j = document.getElementById('journal'); if (j && j.dataset.tab === 'settings' && !j.classList.contains('hidden')) UI.journal(true, G.state); } } catch (e) { /* */ }
  }
  let cssOn = false;
  function css() {
    if (cssOn) return; cssOn = true;
    const st = document.createElement('style'); st.id = 'voices-css';
    st.textContent = `.settings .vrow .vctl, .settings .krow .vctl { display: flex; align-items: center; gap: 8px; min-width: 0; }
.settings .vrow select { max-width: 330px; min-width: 0; font: 600 13px "Segoe UI", sans-serif; border: 2px solid var(--ink); border-radius: 8px; background: #fff; padding: 3px 6px; }
.settings .vrow button[data-vtest] { min-width: 0; }
.settings .vrow.cur { border-color: var(--teal); }
.settings .vrow .vnone { font-size: 13px; opacity: .6; }
.settings .vrate { font: 800 13px Bahnschrift, "Segoe UI", sans-serif; min-width: 44px; }
.settings .vmore { margin: 4px 0 6px; } .settings .vmore summary { cursor: pointer; font-size: 13px; font-weight: 700; opacity: .7; padding: 3px 2px 6px; }`;
    document.head.appendChild(st);
  }
  if (typeof UI !== 'undefined') { UI.settingsParts = UI.settingsParts || []; if (!UI.settingsParts.some(p => p.id === 'voices')) UI.settingsParts.push({ id: 'voices', html: settingsHTML, wire }); }
  if (typeof STORY !== 'undefined' && STORY.init && !STORY.init._voices) {
    const init0 = STORY.init;
    STORY.init = function (game) { G = game; return init0.apply(this, arguments); };
    STORY.init._voices = true;
  }

  // ------------------------------------------------------------ every 🔊 in the game: Sound.say speaks through here
  if (typeof Sound !== 'undefined' && Sound.say && !Sound.say._voices) {
    const say0 = Sound.say;
    Sound.say = function (text, lang) {
      try { return speak(text, lang); } catch (e) { console.warn('[voices]', e); try { return say0.call(Sound, text, lang); } catch (e2) { return false; } }
    };
    Sound.say._voices = true;
  }

  return {
    list, best, speak, order, tune, failed, online, test, ready, pref, setPref, setRate, kindOf, TEST,
    get rate() { return saved.rate || 1; },
    _: { score, langOf, short, settingsHTML, get voices() { return voices.slice(); } },
  };
})();
