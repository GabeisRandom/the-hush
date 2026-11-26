'use strict';
// SPEECH: the voices for reading and listening (DESIGN.md 15.4 and 15.6; the contract is ../../FLUENT.md, section C).
// Written for js/read/ (audio.js's Sound.say stays as it is): the browser's speechSynthesis, with
//   • voices picked by language, the same preferences as Sound.say (es-MX first; zh: Mandarin only, never Cantonese)
//   • a pitch and a rate per speaker, so two people sound different (and a different voice each, when there are two)
//   • natural speed (rate 1.0) or a slower one (SPEECH.slow), sentence by sentence, with a callback for the lit sentence
//   • stop, at any time
//   • no voice for the language (the user's PC has only English voices, so Chrome uses Google's online ones; the test
//     browser has none at all): `has(lang)` says so at once, `play` resolves { ok: false, why: 'novoice' } and the panels
//     show the transcript straight away. Nothing here ever hangs or throws: every utterance has a watchdog.
//
//   SPEECH.has(lang) → bool          SPEECH.ready(ms) → Promise (the voice list has loaded, or ms passed)
//   SPEECH.say(text, o) → Promise<{ ok, why }>          o: { lang, who, pitch, rate, onStart }
//   SPEECH.play(lines, o) → { stop(), done: Promise<{ ok, why, stopped }> }
//        lines: [{ text, who }]; o: { lang, onLine(i, line) (i = -1 at the end), from, gap (s) }
//   SPEECH.stop() · SPEECH.speaking · SPEECH.slow (true: about 0.8×) · SPEECH.speaker(id, { pitch, rate, voice })
//   SPEECH.textOf(src, lang): what the voice reads (zh/ja notation → characters; {mimo} → the player's name for Mimo)
//   SPEECH.NO_VOICE: the line the panels show when there's no voice

const SPEECH = (() => {
  const PREF = { es: ['es-MX', 'es-US', 'es-419', 'es-'], pt: ['pt-BR', 'pt-'], de: ['de-DE', 'de-AT', 'de-CH', 'de-'], zh: ['zh-CN', 'cmn', 'zh-TW'], ja: ['ja-JP', 'ja-'] };
  const NOT = { zh: /(^|[-_])(hk|yue|mo)([-_]|$)/i };                 // (never Cantonese)
  const NO_VOICE = 'No voice for this language on this computer';
  const syn = () => (typeof window !== 'undefined' && window.speechSynthesis) || null;
  const clamp01 = (v, a, b) => Math.max(a, Math.min(b, v));
  let voices = [], loaded = false, slow = false, speaking = false, duckT = 0;
  const waiting = [], keep = new Set();
  function load() {
    const s = syn();
    if (!s) { loaded = true; flush(); return; }
    try { voices = s.getVoices() || []; } catch (e) { voices = []; }
    if (voices.length) { loaded = true; flush(); }
  }
  function flush() { waiting.splice(0).forEach(f => { try { f(); } catch (e) { /* (a waiter) */ } }); }
  try {
    const s = syn();
    if (s) { load(); if (s.addEventListener) s.addEventListener('voiceschanged', load); else s.onvoiceschanged = load; }
    else loaded = true;
  } catch (e) { loaded = true; }
  // the voice list loads late in Chrome, and never fires at all in a browser without voices: wait a little, never forever
  function ready(ms = 1200) {
    if (loaded) return Promise.resolve(true);
    load(); if (loaded) return Promise.resolve(true);
    return new Promise(r => { const t = setTimeout(() => { loaded = true; r(false); }, ms); waiting.push(() => { clearTimeout(t); r(true); }); });
  }
  const tag = v => String(v.lang || '').replace(/_/g, '-').toLowerCase();
  // every voice for a language, best first
  function voicesFor(lang) {
    if (!loaded) load();
    const out = [], want = PREF[lang] || [lang + '-'];
    for (const w0 of want) {
      const w = w0.toLowerCase();
      for (const v of voices) {
        const t = tag(v);
        const ok = w.endsWith('-') ? (t === w.slice(0, -1) || t.startsWith(w)) : t.startsWith(w);
        if (ok && !out.includes(v) && !(NOT[lang] && NOT[lang].test(t))) out.push(v);
      }
    }
    // (P7b: the most natural first, as js/voices.js ranks them, with the one picked in Settings first and online ones last while
    // there's no connection; without voices.js, local voices first: they work offline and start at once)
    if (typeof VOICES !== 'undefined' && VOICES.order) { try { return VOICES.order(lang, out); } catch (e) { /* (the old order) */ } }
    return out.sort((a, b) => (b.localService ? 1 : 0) - (a.localService ? 1 : 0));
  }
  const has = lang => voicesFor(lang).length > 0;

  // ------------------------------------------------------------ speakers: a pitch, a rate and a voice each
  const SPK = {};
  const hash = s => [...String(s || 'x')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  function speaker(id, o) { if (o) SPK[id] = Object.assign(SPK[id] || {}, o); return profile(id); }
  function profile(id) {
    const o = SPK[id] || {}, h = hash(id);
    return { pitch: o.pitch != null ? o.pitch : 0.88 + (h % 33) / 100, rate: o.rate != null ? o.rate : 0.97 + ((h >> 5) % 7) / 100, voice: o.voice };
  }
  // what the voice reads: zh/ja notation as characters, {mimo} as the player's name for Mimo, no stray marks
  function textOf(src, lang) {
    let s = String(src == null ? '' : src);
    const mimo = (typeof UI !== 'undefined' && UI.mimoName) || 'Mimo';
    s = s.replace(/\{mimo\}/g, mimo).replace(/\{[^}]*\}/g, '').replace(/\*/g, '');
    if ((lang === 'zh' || lang === 'ja') && typeof CJK !== 'undefined') { try { s = CJK.chars(s, { lang }); } catch (e) { /* (plain text) */ } }
    return s.replace(/[«»“”"]/g, '').replace(/\s+/g, ' ').trim();
  }

  // ------------------------------------------------------------ one utterance (never hangs: a watchdog on the start and the end)
  let gen = 0;
  function say(text, o = {}) {
    return new Promise(res => {
      const s = syn(), lang = o.lang || (typeof LEX !== 'undefined' ? LEX.lang : 'es');
      const list = voicesFor(lang);
      const t = textOf(text, lang);
      if (!s || !list.length) return res({ ok: false, why: 'novoice' });
      if (!t) return res({ ok: true, why: 'empty' });
      const p = o.who ? profile(o.who) : { pitch: 1, rate: 1 };
      const v = o.voiceObj || (typeof p.voice === 'number' ? list[p.voice % list.length] : list[0]);
      let u;
      try { u = new SpeechSynthesisUtterance(t); } catch (e) { return res({ ok: false, why: 'novoice' }); }
      u.voice = v; u.lang = v.lang;
      // (P7b: the speed from Settings, and this computer's own voices a touch slower: they rush; js/voices.js)
      const vs = typeof VOICES !== 'undefined' ? (VOICES.rate || 1) * (v.localService ? 0.95 : 1) : 1;
      u.rate = clamp01((o.rate != null ? o.rate : p.rate) * (slow ? 0.8 : 1) * vs, 0.5, 1.6);
      u.pitch = clamp01(o.pitch != null ? o.pitch : p.pitch, 0.5, 1.8);
      let started = false, fin = false;
      const end = r => {
        if (fin) return; fin = true; clearTimeout(t1); clearTimeout(t2); keep.delete(u);
        // (P7b) an online voice that failed or never started (no internet): this computer's own voice says it instead
        if (!r.ok && !started && !v.localService && !o._local && !/interrupted|canceled/.test(r.why || '')) {
          const lv = list.find(x => x.localService);
          if (lv) { if (typeof VOICES !== 'undefined' && VOICES.failed) VOICES.failed(v); res(say(text, Object.assign({}, o, { voiceObj: lv, _local: true }))); return; }
        }
        res(r);
      };
      u.onstart = () => { started = true; if (o.onStart) try { o.onStart(); } catch (e) { /* (a callback) */ } };
      u.onend = () => end({ ok: true });
      u.onerror = e => { const why = (e && e.error) || 'error'; end({ ok: why === 'interrupted' || why === 'canceled', stopped: why === 'interrupted' || why === 'canceled', why }); };
      keep.add(u);                       // (Chrome drops utterances it isn't holding on to, and their onend never comes)
      const est = 1400 + t.length * 95 / u.rate;
      const t1 = setTimeout(() => { if (!started) { try { s.cancel(); } catch (e) { /* */ } end({ ok: false, why: 'nostart' }); } }, o.startWait || (v.localService ? 4000 : 1800));
      const t2 = setTimeout(() => end({ ok: started, why: 'timeout' }), est + 5000);
      try { s.speak(u); } catch (e) { end({ ok: false, why: 'throw' }); }
    });
  }
  // keep the area's music down while a voice talks
  function duck(on) {
    if (typeof Sound === 'undefined' || !Sound.duck) return;
    if (on && !duckT) { const f = () => { try { Sound.duck('read-speech', 0.28, 0.6); } catch (e) { /* */ } }; f(); duckT = setInterval(f, 300); }
    if (!on && duckT) { clearInterval(duckT); duckT = 0; try { Sound.duck('read-speech', 1); } catch (e) { /* */ } }
  }
  function stop() {
    gen++; speaking = false; duck(false);
    const s = syn(); if (s) try { s.cancel(); } catch (e) { /* */ }
  }
  // a list of lines, one after the other, each in its speaker's voice; onLine(i) as each one starts (−1 at the end)
  function play(lines, o = {}) {
    stop();
    const my = ++gen, lang = o.lang || (typeof LEX !== 'undefined' ? LEX.lang : 'es');
    const cb = (i, l) => { if (o.onLine) try { o.onLine(i, l); } catch (e) { console.error('[speech]', e); } };
    const ctl = { stopped: false, stop() { ctl.stopped = true; if (gen === my) stop(); } };
    ctl.done = (async () => {
      await ready();
      if (!has(lang)) return { ok: false, why: 'novoice' };
      // two speakers sound different: their own pitch, and their own voice when the language has more than one
      const list = voicesFor(lang), who = [...new Set(lines.map(l => l.who || ''))];
      speaking = true; duck(true);
      let any = false;
      try {
        for (let i = o.from || 0; i < lines.length; i++) {
          if (ctl.stopped || gen !== my) return { ok: true, stopped: true };
          const l = lines[i]; cb(i, l);
          const p = profile(l.who || ''), k = who.indexOf(l.who || '');
          const voiceObj = typeof p.voice === 'number' ? list[p.voice % list.length] : list[k % list.length];
          const r = await say(l.text, { lang, who: l.who, voiceObj });
          if (ctl.stopped || gen !== my) return { ok: true, stopped: true };
          if (r.ok) any = true;
          else if (!any && (r.why === 'nostart' || r.why === 'novoice' || r.why === 'throw')) return { ok: false, why: r.why === 'novoice' ? 'novoice' : 'nostart' };
          if (o.gap) await new Promise(rr => setTimeout(rr, o.gap * 1000));
        }
      } finally { if (gen === my) { speaking = false; duck(false); } }
      cb(-1, null);
      return { ok: true };
    })();
    return ctl;
  }
  return {
    has, ready, voicesFor, say, play, stop, speaker, profile, textOf, NO_VOICE,
    get speaking() { return speaking; },
    get slow() { return slow; }, set slow(v) { slow = !!v; },
    get voices() { return voices.slice(); },
  };
})();
