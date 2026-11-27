'use strict';
// POCKET: the pocket radio (A1, 2026-11-27; DESIGN.md 21.16). Once a save has heard three weeks of the quiz show in all
// (QUIZ.S().heard ≥ 3), Radio Alba sends its listener a little radio, with a note in the language. From then on a 📻 chip
// sits in the top corner's counters: it tunes Radio Alba (RADIO.tune('pocket'): the quiz show, the detective serial, the
// station's shows) anywhere in today's world, outdoors or in. It has no signal (the chip goes grey) in the Past and the
// Future, in the final act's places (FIN.quiet), and while a fight, a scene, a panel or a talk is up. A red dot: something
// new on air (a quiz week waiting, a new serial part, the serial's question). No key: KeyR is taken (domino.js, phonk.js).
// A save that was already past three weeks when this arrived gets it when the next week airs.
//   POCKET.init(game) · outdoor(dt) (READ.update: the chip, the gift) · has() · why(anyway) ('' when it works, else the reason;
//   anyway: as if you had one)
//   · open() · S() · _ (tests: T, gift(), paint(), news())
// State: G.state.read.pocket (saved with the game): { got (ms), wait (the week it waits for, for saves already past 3) }

const POCKET = (() => {
  let G = null;
  const L = () => READ.lang;
  const esc = READ.esc;
  const T = { force: false };
  const NEED = 3;
  // Radio Alba's note with the gift (zh / ja: CJK.md notation)
  const NOTE = {
    es: ['¡Gracias por escucharnos cada semana! Este radio de bolsillo es para usted: así nos puede llevar a todas partes.', 'Thank you for listening every week! This pocket radio is for you: now you can take us everywhere.'],
    pt: ['Muito obrigado por escutar a gente toda semana! Este radinho de bolso é pra você: assim você leva a gente pra todo lugar.', 'Thank you so much for listening every week! This little pocket radio is for you: now you can take us everywhere.'],
    de: ['Danke, dass du uns jede Woche zuhörst! Dieses Taschenradio ist für dich: So kannst du uns überallhin mitnehmen.', 'Thank you for listening every week! This pocket radio is for you: now you can take us everywhere.'],
    zh: ['[谢谢|xiè xie] [你|nǐ] [每周|měi zhōu] [都|dōu] [听|tīng] [我们|wǒ men] [的|de] [节目|jié mù] ！ [这|zhè] [台|tái] [小|xiǎo] [收音机|shōu yīn jī] [送给|sòng gěi] [你|nǐ] ， [以后|yǐ hòu] [走到|zǒu dào] [哪里|nǎ lǐ] [都|dōu] [能|néng] [听到|tīng dào] [我们|wǒ men] 。', 'Thank you for listening to our shows every week! This little radio is a present for you: from now on you can hear us wherever you go.'],
    ja: ['[毎週|まいしゅう] [聞|き]いて くれて 、 ありがとう ！ この ポケット ラジオ は あなた へ の プレゼント です 。 これ で 、 どこ でも わたしたち の [番組|ばんぐみ] が [聞|き]けます よ 。', 'Thank you for listening every week! This pocket radio is a present for you: now you can hear our shows anywhere.'],
  };
  const S = () => { const r = READ.S(), o = r.pocket || (r.pocket = {}); o.v = 1; return o; };
  const has = () => !!S().got;
  const started = () => typeof QUIZ !== 'undefined' && QUIZ.started && QUIZ.started() && READ.on('radio');
  const nowWorld = () => { try { return typeof TIME === 'undefined' || !TIME.world || TIME.world() === 'now'; } catch (e) { return true; } };

  // ------------------------------------------------------------ where it works: '' when it does, else why not (the chip's title)
  function why(anyway) {
    if (!G) return 'Not now.';
    if (!has() && !anyway) return 'You don’t have a pocket radio yet.';
    if (!started()) return 'Radio Alba isn’t on the air yet.';
    if (!nowWorld()) return 'No signal here: Radio Alba only reaches today’s world.';
    if (typeof FIN !== 'undefined' && FIN.quiet && FIN.quiet()) return 'No signal here: it’s too quiet.';
    if (typeof document !== 'undefined' && /(^|\s)(in-battle|on-title)(\s|$)/.test(document.body.className)) return 'Not now: you’re busy.';
    if (G.journalOpen || (G.sim && G.sim.lock)) return 'Not now: finish what you’re doing first.';
    if (typeof STORY !== 'undefined' && (STORY.busy || STORY.line)) return 'Not now: someone’s talking.';
    if ((typeof READER !== 'undefined' && READER.isOpen) || (typeof QUIZ !== 'undefined' && QUIZ.UI && QUIZ.UI.isOpen)) return 'Not now: finish what you’re doing first.';
    return '';
  }
  // something new on air: a quiz week waiting, a new serial part, or the serial's question
  function news() {
    try {
      if (!started()) return false;
      const q = QUIZ.S(); if ((q.aired || 0) > (q.heard || 0)) return true;
      if (typeof SERIAL !== 'undefined' && SERIAL.on && SERIAL.on()) {
        const n = SERIAL.aired(), c = SERIAL.content(), h = SERIAL.S().heard;
        if (c && c.parts.some(p => p.n <= n && !h[p.id])) return true;
        if (SERIAL._.needGuess && SERIAL._.needGuess()) return true;
      }
    } catch (e) { /* */ }
    return false;
  }

  // ------------------------------------------------------------ the chip in the top corner's counters
  let chip = null, last = '';
  function chipEl() {
    if (chip) return chip;
    const box = typeof document !== 'undefined' && document.getElementById('counters'); if (!box) return null;
    if (!document.getElementById('prd-css')) {
      const st = document.createElement('style'); st.id = 'prd-css';
      st.textContent = `#counters .prd-chip button { border: 0; background: transparent; cursor: pointer; padding: 0 2px; font-size: 15px; }
#counters .prd-chip.off button { filter: grayscale(1); opacity: .45; cursor: help; }
#counters .prd-chip button { font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif; }
#counters .prd-chip .prd-dot.hidden { display: none; }
#counters .prd-chip .prd-dot { position: absolute; top: 3px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: #e2574c; box-shadow: 0 0 0 2px #fffaf0; }
#counters .prd-chip.off .prd-dot { display: none; }
#card.prd-card canvas.prd-art { display: block; margin: 0 auto 4px; width: 150px; height: 94px; }
#card.prd-card .prd-title { font: 800 20px Bahnschrift, "Segoe UI", sans-serif; margin: 2px 0 6px; }
#card.prd-card .prd-say { font-size: 19px; line-height: 1.45; margin: 4px 0 8px; }`;
      document.head.appendChild(st);
    }
    chip = document.createElement('span'); chip.className = 'chip prd-chip hidden'; chip.id = 'chip-pocket';
    chip.innerHTML = '<button type="button" aria-label="Pocket radio">📻</button><i class="prd-dot hidden"></i>';
    chip.querySelector('button').onclick = e => { e.stopPropagation(); open(); };
    const music = box.querySelector('#music'); const at = music ? music.closest('.chip') : null;
    box.insertBefore(chip, at);
    return chip;
  }
  function paint() {
    const el = chipEl(); if (!el) return;
    const show = has() && started(), w = show ? why() : '', nw = show && !w && news(), key = [show, w, nw].join('|');
    if (key === last) return; last = key;
    el.classList.toggle('hidden', !show); el.classList.toggle('off', !!w);
    el.querySelector('.prd-dot').classList.toggle('hidden', !nw);
    el.title = w || `Pocket radio: tune in to Radio Alba${nw ? ' (something new is on!)' : ''}`;
  }
  async function open() {
    const w = why();
    if (w) { try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(`📻 ${w}`); } catch (e) { /* */ } return null; }
    try { if (typeof Sound !== 'undefined') Sound.play('click'); } catch (e) { /* */ }
    const r = await RADIO.tune('pocket');
    last = ''; paint();
    return r;
  }

  // ------------------------------------------------------------ the gift: after three weeks heard (or, for older saves, the next week)
  function drawRadio(cv) {
    const c = cv && cv.getContext && cv.getContext('2d'); if (!c) return;
    const w = cv.width, h = cv.height; c.clearRect(0, 0, w, h); c.lineJoin = 'round'; c.lineCap = 'round';
    const rr = (x, y, ww, hh, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + ww, y, x + ww, y + hh, r); c.arcTo(x + ww, y + hh, x, y + hh, r); c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + ww, y, r); c.closePath(); };
    c.save(); c.translate(w / 2, h / 2 + 8); c.rotate(-0.06);
    c.strokeStyle = '#2b2235'; c.lineWidth = 5; c.beginPath(); c.moveTo(42, -40); c.lineTo(70, -86); c.stroke();
    c.fillStyle = '#c9c9c9'; c.beginPath(); c.arc(70, -86, 6, 0, Math.PI * 2); c.fill(); c.stroke();
    rr(-84, -44, 168, 92, 18); c.fillStyle = '#e86a5a'; c.fill(); c.lineWidth = 5; c.stroke();
    rr(-70, -32, 82, 68, 10); c.fillStyle = '#f2e6c8'; c.fill(); c.lineWidth = 3.5; c.stroke();
    c.strokeStyle = 'rgba(43,34,53,.45)'; c.lineWidth = 3; for (let y = -22; y <= 26; y += 9) { c.beginPath(); c.moveTo(-62, y); c.lineTo(4, y); c.stroke(); }
    c.strokeStyle = '#2b2235'; c.lineWidth = 4; c.fillStyle = '#fbf6e7'; c.beginPath(); c.arc(46, -8, 17, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(46, -8); c.lineTo(56, -18); c.stroke();
    c.fillStyle = '#2b2235'; c.beginPath(); c.arc(46, 28, 7, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  async function gift() {
    const s = S(); if (s.got) return false;
    s.got = Date.now(); delete s.wait; READ.save();
    const l = L(), n = NOTE[l] || NOTE.es, sta = (typeof RADIO !== 'undefined' && RADIO.STATION) ? (RADIO.STATION[l] || RADIO.STATION.en) : 'Radio Alba 98.6';
    try {
      if (typeof UI !== 'undefined' && UI.card) {
        chipEl();                                                  // (its style sheet styles the card too)
        const p = UI.card(`<canvas class="prd-art" width="360" height="224"></canvas><div class="prd-title">📻 A parcel from ${esc(READ.plain(sta))}</div>`
          + `<p class="prd-say">«${READ.html(n[0])}»</p><div class="row"><button data-act="en">EN</button><button data-act="say" data-text="${esc(READ.plain(n[0]))}">🔊</button></div><div class="en">${esc(n[1])}</div>`
          + `<div class="sub">A pocket radio! Click 📻 in the top corner to tune in to Radio Alba anywhere in today’s world. E to close</div>`, { kind: 'prd-card' });
        drawRadio(document.querySelector('#card canvas.prd-art'));
        await p;
      }
    } catch (e) { console.error('[pocket] gift', e); }
    try { if (typeof Sound !== 'undefined') Sound.play('chest'); } catch (e) { /* */ }
    last = ''; paint();
    return true;
  }
  let tick = 1, base = null, giving = false;
  function outdoor(dt) {
    if (!G || !G.state || (tick -= dt || 0) > 0) return;
    tick = 1;
    paint();
    if (has() || giving || !started()) return;
    const q = QUIZ.S(), s = S();
    if (base == null) base = q.heard || 0;                       // (this session's start: a save already past three waits a week)
    if ((q.heard || 0) < NEED && !T.force) return;
    if (base >= NEED && !T.force) {
      if (s.wait == null) { s.wait = q.aired || 0; READ.save(); }
      if ((q.aired || 0) <= s.wait) return;
    }
    if (why(true)) return;                                       // (the gift waits until you're free, in today's world)
    giving = true; gift().finally(() => { giving = false; });
  }
  function init(game) { G = game; S(); base = null; last = ''; }

  return { init, outdoor, has, why, open, S, NOTE, _: { T, gift, paint, news, drawRadio, get base() { return base; }, set base(v) { base = v; } } };
})();
