'use strict';
// CLUB: the book club at Alba's library (DESIGN.md 21.2 D, the reading half of the tests hidden in the world; D1).
// The librarian hosts it. "The book club" joins his menu (LIBRARY.person.options) after your first book. This month's picks,
// one per band, are posted only on the library's notice board, in the language (the board's lines come from the content's
// librarian.notice, which this file turns into a live list): reading the board is how you know which book to read.
// Two regulars sit in the reading nook's armchairs. At a meeting the librarian asks 3–4 comprehension items (multiple
// choice, true / false / not said, a short answer judged by content; EXAM.grade.item, DICT.log('read', band, score) each),
// then one opinion question you type like a talk turn (EXAM.grade.turn, S–D, DICT.log('talk', band, points / 5)), and each
// regular gives their own take. Rewards: coins by band (+5 for all right), a stamp on the club card (the journal's Reading
// page), and reading glasses for Mimo after three meetings. A pick moves on once it's been discussed.
// Also here: a notice quest. A paper on the library's door says the library's cat is lost, where she was last seen and where
// to bring her; nothing on the map points there (after two minutes Mimo gives the English).
//   CLUB.add(lang, { name, members, host, tf, lines, notice, cat })   club_<lang>.js (books: READ.add(lang, { books }) with
//        a `club` part each: { items, opinion, takes }; the shape is at the top of club_es.js)
//   CLUB.on() · started() · picks() · meeting(book) → Promise<result> · S() · init(game) · outdoor(dt, t, you) (READ.update)
//   CLUB.journal (READ.more) · CLUB._ (tests: CLUB._.tests(lang), CLUB._.t)
// State: G.state.read.club (saved with the game).

const CLUB = (() => {
  let G = null;
  const L = () => READ.lang;
  const isCJ = l => l === 'zh' || l === 'ja';
  const esc = READ.esc, fill = READ.fill;
  const H = s => READ.html(s), P = s => READ.plain(s);
  const snd = k => { try { if (typeof Sound !== 'undefined') Sound.play(k); } catch (e) { /* */ } };
  const toast = t => { try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(t); } catch (e) { /* */ } };
  const line = x => (!x ? null : Array.isArray(x) ? { t: x[0], en: x[1] || '' } : typeof x === 'string' ? { t: x, en: '' } : { t: x.t != null ? x.t : x.text, en: x.en || '' });
  const COINS = [0, 6, 9, 12, 15], GLASSES_AT = 3, HINT_S = 120;
  const T = { auto: null, hold: false, fast: false, mute: false, last: null };          // tests: answer for you, keep the end open, no speech

  // ------------------------------------------------------------ content
  const C = {};
  function add(lang, def = {}) {
    const o = C[lang] || (C[lang] = {});
    for (const [k, v] of Object.entries(def)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] ? Object.assign(o[k], v) : v;
    if (isCJ(lang) && typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(strings(lang).map(x => x.s)); } catch (e) { /* */ } }
    return o;
  }
  const cfg = (l = L()) => C[l] || null;
  // the club's books, its own first: an older library book with a club part (content_<lang>.js, club.after: true) is picked
  // only once its band's club books have been discussed, so this month's picks never change under a player's feet
  const clubBooks = () => { const all = READ.list('books').filter(b => b.club); return all.filter(b => !b.club.after).concat(all.filter(b => b.club.after)); };
  function on() { return !!(cfg() && READ.on('books') && clubBooks().length && typeof LIBRARY !== 'undefined'); }
  function started() {
    if (!on() || !G || !G.state || !G.state.flags.hatched) return false;
    const r = READ.S(); return !!(r.lib && r.lib.met) && Object.values(r.books || {}).some(b => b && b.done);
  }

  // ------------------------------------------------------------ the save: G.state.read.club
  // { intro, done: { bookId: { at, right, of, grade, coins } }, meetings, coins, cat: { read (play time), seen, found, back } }
  function S() {
    const r = READ.S(), o = r.club || (r.club = {});
    o.v = 1; o.done = o.done || {}; o.meetings = o.meetings || 0; o.coins = o.coins || 0; o.cat = o.cat || {};
    return o;
  }
  // this month's picks: per band, the first club book not discussed yet
  function picks() {
    const s = S(), out = {};
    for (const b of [1, 2, 3, 4]) out[b] = clubBooks().find(x => (x.band || 1) === b && !s.done[x.id]) || null;
    return out;
  }
  const isPick = b => { const p = picks()[b.band || 1]; return !!p && p.id === b.id; };
  const finished = b => { const r = READ.S().books[b.id]; return !!(r && r.done); };
  const ready = () => Object.values(picks()).filter(b => b && finished(b));

  // ------------------------------------------------------------ the notice board (library.js reads librarian.notice each time)
  // The content's own lines show when the club isn't running; while it runs, the board is the club's: its heading, this month's
  // picks two to a line (A1 · A2, B1 · B2) and where it meets. (Four lines at most, so the Read card keeps its roomy layout;
  // signs.js's compact grid for five lines or more wraps long lines too, since 2026-11-26.)
  const BASE = {};
  function noticeLines(l) {
    const c = cfg(l), base = BASE[l] || [];
    if (!c || !c.notice || !started() || L() !== l) return base;
    const n = c.notice, pk = picks(), one = b => ({ t: fill(line(n.pick).t).replace('{band}', READ.BAND(b)).replace('{title}', pk[b].title), en: line(n.pick).en.replace('{band}', READ.BAND(b)).replace('{title}', pk[b].en || '') });
    const out = [{ text: line(n.head).t, en: line(n.head).en }], sep = l === 'zh' ? ' ； ' : l === 'ja' ? ' ・ ' : ' · ';
    for (const pair of [[1, 2], [3, 4]]) {
      const got = pair.filter(b => pk[b]).map(one);
      if (got.length) out.push({ text: got.map(x => x.t).join(sep), en: got.map(x => x.en).join(' · ') });
    }
    if (out.length === 1) out.push({ text: line(n.none).t, en: line(n.none).en });
    out.push({ text: line(n.meet).t, en: line(n.meet).en });
    return out;
  }
  function hookNotice() {
    for (const l of Object.keys(C)) {
      const c = READ.content(l), lib = c && c.librarian;
      if (!lib || lib.__club) continue;
      BASE[l] = (lib.notice || []).slice();
      try {
        Object.defineProperty(lib, 'notice', { configurable: true, enumerable: true, get: () => noticeLines(l), set: v => { BASE[l] = (v || []).slice(); } });
        Object.defineProperty(lib, '__club', { value: true, enumerable: false });
      } catch (e) { console.error('[club] notice', e); }
      // the librarian's own club lines join his lines (said in his bubble, mixed by the weave like the rest): club_*
      const cl = cfg(l) && cfg(l).lib;
      if (cl && lib.lines) for (const [k, v] of Object.entries(cl)) lib.lines['club_' + k] = v;
    }
  }

  // ------------------------------------------------------------ the meeting (QUIZ's #qz overlay, in the club's green)
  const U = () => QUIZ.UI, IT = () => QUIZ.ITEMS;
  const TURN = () => (typeof EXAM !== 'undefined' && EXAM.TURN_PTS) || { S: 5, A: 4.25, B: 3.5, C: 2.5, D: 1 };
  const STEP = ['S', 'A', 'B', 'C', 'D'];
  const PRAISE = { S: 'Perfect!', A: 'Very good!', B: 'Good!', C: 'Almost!', D: 'Like this:' };
  const LANGNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  const pickL = (arr, k) => (arr && arr.length ? line(arr[Math.abs(k | 0) % arr.length]) : { t: '', en: '' });
  const ttl = (s, b) => String(s || '').replace(/\{title\}/g, b.title || '');
  const ttlEn = (s, b) => String(s || '').replace(/\{title\}/g, b.en || '');
  function youFace(cv) {
    if (!cv || !cv.getContext) return;
    const c = cv.getContext('2d'), w = cv.width; c.clearRect(0, 0, w, w);
    c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 3, 0, Math.PI * 2); c.fillStyle = '#d9f0ea'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#2b2235'; c.stroke();
    c.fillStyle = '#2b2235'; c.font = `900 ${Math.round(w * 0.26)}px Bahnschrift, "Segoe UI", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('YOU', w / 2, w / 2 + 2);
  }
  async function meeting(book) {
    if (!book || !book.club || U().isOpen) return null;
    const c = cfg(); if (!c) return null;
    const band = book.band || 1, lang = L(), club = book.club, s = S(), k0 = s.meetings + 1;
    if (!s.intro) { s.intro = Date.now(); READ.save(); }          // (a meeting means you've joined the club)
    const members = c.members || {}, mids = Object.keys(members);
    const libName = typeof LIBRARY !== 'undefined' && LIBRARY.person ? LIBRARY.person.nameSrc : 'the librarian';
    const libLook = c.libLook || { skin: '#b97f56', hair: '#e2ddd3', dress: '#5a7a4a', glasses: true, stache: true, hairdo: 'bald', bg: '#d9f0ea' };
    const voices = Object.assign({ lib: { name: libName, look: libLook, pitch: (c.host || {}).pitch || 0.84, rate: (c.host || {}).rate || 0.96 } }, members);
    for (const [who, v] of Object.entries(voices)) { try { SPEECH.speaker('club.' + who, { pitch: v.pitch != null ? v.pitch : 1, rate: v.rate || 1 }); } catch (e) { /* */ } }
    const nameOf = who => (who === 'me' ? 'You' : who === 'mimo' ? READ.mimo() : P((voices[who] || {}).name || who));
    const items = (club.items || []).map((raw, k) => IT().resolve(raw, k, QUIZ._.hash(book.id) ^ (k0 * 131)));
    const tf = c.tf || null, res = { book: book.id, right: 0, of: items.length, grade: null, pts: 0, coins: 0, done: false };
    const r = U().open('club');
    r.innerHTML = `<div class="qz-shade"></div><div class="qz-card"><div class="qz-top"><canvas class="qz-logo" width="208" height="128"></canvas>`
      + `<div class="qz-ttl"><b>${H(c.name)}</b><small>${H(book.title)} <span class="en">${esc(book.en || '')}</span></small></div><span><i class="qz-chip">${READ.BAND(band)}</i></span><button class="qz-x" title="Leave (Esc)">✕</button></div>`
      + `<div class="qz-body"><div class="qz-side"><div class="qz-cover"><span class="cv"></span><span><b>${H(book.title)}</b><small>${esc(book.en || '')} · ${READ.BAND(band)}</small></span></div>`
      + `<div class="qz-cast">${['lib'].concat(mids, ['mimo']).map(w => `<div class="qz-who" data-who="${esc(w)}"><canvas width="112" height="112"></canvas><span>${esc(nameOf(w))}</span><small>${esc(w === 'lib' ? 'the host' : w === 'mimo' ? 'listening' : (members[w].role || 'a regular'))}</small></div>`).join('')}</div>`
      + `<p class="qz-note">The club meets in the reading nook. Tap anyone’s line for the English; 🔊 to hear it.</p><p class="qz-note qz-score"></p></div>`
      + `<div class="qz-main"><div class="qz-feed"></div></div></div>`
      + `<div class="qz-foot"><span class="nt">Questions about the book first, then what you think of it.</span><span class="sp"></span><button class="qz-btn hidden" data-a="close">Close ▸</button></div></div>`;
    const card = r.querySelector('.qz-card'), feed = card.querySelector('.qz-feed'), main = card.querySelector('.qz-main'), scoreEl = card.querySelector('.qz-score');
    QUIZ.UI.logo(card.querySelector('.qz-logo'), 'club');
    try { const cv = READER.coverCanvas(book, 156, 216); card.querySelector('.qz-cover .cv').appendChild(cv); } catch (e) { /* */ }
    card.querySelectorAll('.qz-who').forEach(d => { const w = d.dataset.who, cv = d.querySelector('canvas'); if (w === 'mimo') U().face(cv, 'mimo'); else U().face(cv, (voices[w] || {}).look); });
    let closed = false, finishR = null;
    const fin = new Promise(rs => { finishR = rs; });
    const finish = () => { if (closed) return; closed = true; try { SPEECH.stop(); } catch (e) { /* */ } finishR(); };
    card.querySelector('.qz-x').onclick = finish;
    const closeB = card.querySelector('[data-a="close"]'); closeB.onclick = finish;
    U().keys(e => { if (e.code === 'Escape') { finish(); return true; } if (e.code === 'Enter' && res.done) { finish(); return true; } return false; });
    const quiet = () => T.fast || T.mute || !!T.auto;
    const sleep = ms => new Promise(rs => setTimeout(rs, quiet() ? 0 : ms));
    let talkQ = Promise.resolve();
    const say = (who, text) => { if (quiet()) return; talkQ = talkQ.then(() => (closed ? null : SPEECH.say(text, { lang, who: 'club.' + who }).catch(() => null))); };
    const setScore = () => { scoreEl.innerHTML = `Right so far: <b>${res.right}</b> of ${items.length}${res.grade ? ` · your opinion: <i class="qz-grade qz-g${res.grade.toLowerCase()}">${res.grade}</i>` : ''}`; };
    function bubble(who, text, en, o = {}) {
      const d = document.createElement('div'); d.className = 'qz-bub' + (who === 'me' ? ' me' : '');
      d.innerHTML = `<canvas width="112" height="112"></canvas><div class="b"><span class="who">${esc(nameOf(who))}</span>${o.html != null ? o.html : H(text)}${en ? `<span class="en hidden">${esc(en)}</span>` : ''}${who !== 'me' && text ? ' <button class="qz-mini" type="button" data-say title="Hear it">🔊</button>' : ''}</div>`;
      feed.appendChild(d);
      const cv = d.querySelector('canvas'); if (who === 'me') youFace(cv); else if (who === 'mimo') U().face(cv, 'mimo'); else U().face(cv, (voices[who] || {}).look);
      d.querySelector('.b').onclick = e => { if (e.target.closest('[data-say]')) return; const x = d.querySelector('.en'); if (x) x.classList.toggle('hidden'); };
      const sb = d.querySelector('[data-say]'); if (sb) sb.onclick = () => { try { SPEECH.say(text, { lang, who: 'club.' + who }); } catch (e) { /* */ } };
      card.querySelectorAll('.qz-who.talk').forEach(x => x.classList.remove('talk')); const w = card.querySelector(`.qz-who[data-who="${who}"]`); if (w) w.classList.add('talk');
      if (o.speak !== false && who !== 'me' && text) say(who, text);
      main.scrollTop = main.scrollHeight;
      return d;
    }
    // one comprehension item: the librarian asks, you answer in place, a regular reacts
    function askItem(it, n) {
      return new Promise(resolve => {
        bubble('lib', it.ask.t, it.ask.en);
        const box = document.createElement('div');
        box.innerHTML = IT().html(it, n, { tf, head: false, say: false, placeholder: `A short answer, in ${LANGNAME[lang] || 'the language'}` });
        const q = box.querySelector('.qz-q');
        if (it.type !== 'short' && q.querySelector('.oen')) { const b = document.createElement('button'); b.className = 'qz-mini'; b.type = 'button'; b.textContent = 'EN'; b.title = 'The options in English'; b.onclick = () => { q.querySelectorAll('.oen').forEach(x => x.classList.toggle('hidden')); b.classList.toggle('on'); }; q.insertBefore(b, q.firstChild); }
        if (it.type === 'short' || it.type === 'match') { const b = document.createElement('button'); b.className = 'qz-btn'; b.type = 'button'; b.dataset.a = 'ans'; b.textContent = 'Answer ▸'; b.style.marginTop = '7px'; q.insertBefore(b, q.querySelector('.qz-res')); }
        feed.appendChild(box); main.scrollTop = main.scrollHeight;
        const A = {}; let done = false;
        const settle = () => {
          if (done || closed) return;
          const a = IT().answer(box, it, A); if (!IT().answered(a)) return;
          done = true;
          const sc = IT().score(it, a, lang);
          try { DICT.log('read', band, sc); } catch (e) { /* */ }
          if (sc >= 1) res.right++;
          IT().mark(box, it, a, sc, { tf });
          const ab = q.querySelector('[data-a="ans"]'); if (ab) ab.remove();
          setScore(); snd(sc >= 1 ? 'learned' : 'review');
          const who = mids.length ? mids[n % mids.length] : 'lib', ln = pickL(sc >= 1 ? c.lines.right : c.lines.wrong, n + k0);
          bubble(who, ln.t, ln.en);
          sleep(650).then(() => resolve(sc));
        };
        IT().wire(box, [it], A, { change: () => { if (it.type !== 'short' && it.type !== 'match') settle(); }, enter: () => settle() });
        const ab = q.querySelector('[data-a="ans"]'); if (ab) ab.onclick = settle;
        const inp = q.querySelector('.qz-sh'); if (inp && !T.auto) setTimeout(() => inp.focus(), 60);
        if (T.auto) setTimeout(() => { IT().put(box, it, IT().auto(it, T.auto === 'wrong' ? 'wrong' : T.auto === 'nose' ? 'nose' : 'model', lang), A); settle(); if (!done) { done = true; try { DICT.log('read', band, 0); } catch (e) { /* */ } resolve(0); } }, 10);
      });
    }
    // the opinion: a talk turn (EXAM.grade.turn: TALK.judge's grades). A first miss is asked again in simpler words; a second
    // shows a model (D). Help: a starter (one grade down), then the model (D).
    function askOpinion() {
      return new Promise(resolve => {
        const op = club.opinion || {}, ask = line(op.ask) || { t: '', en: '' };
        bubble('lib', ask.t, ask.en);
        const w = document.createElement('div'); w.className = 'qz-q';
        w.innerHTML = `<div class="qz-h" style="margin:0">Your turn: what do you think? Answer in ${esc(LANGNAME[lang] || 'the language')}</div><div class="qz-tip hidden" data-help></div>`
          + `<input class="qz-say" autocomplete="off" spellcheck="false" placeholder="${esc(`In ${LANGNAME[lang] || 'the language'}, in your own words…`)}"><div class="qz-ctl"><button class="qz-btn main" type="button" data-a="say">Say it ▸</button><button class="qz-btn" type="button" data-a="help">Help</button></div><div class="qz-res hidden"></div>`;
        feed.appendChild(w); main.scrollTop = main.scrollHeight;
        const inp = w.querySelector('.qz-say'), helpEl = w.querySelector('[data-help]'), resEl = w.querySelector('.qz-res'), helpB = w.querySelector('[data-a="help"]'), sayB = w.querySelector('[data-a="say"]');
        if (isCJ(lang) && typeof CJK !== 'undefined' && CJK.mode(lang) === 'chars' && CJK.attachIME) try { CJK.attachIME(inp); } catch (e) { /* */ }
        if (!T.auto) setTimeout(() => inp.focus(), 60);
        let help = 0, tries = 0, busy = false, over = false;
        const end = () => { over = true; inp.disabled = true; sayB.disabled = true; helpB.disabled = true; setScore(); resolve(); };
        function showModel(why) {
          if (over) return;
          const m = line(op.model) || { t: '', en: '' };
          res.grade = 'D'; res.pts = TURN().D; try { DICT.log('talk', band, TURN().D / 5); } catch (e) { /* */ }
          resEl.className = 'qz-res no'; resEl.innerHTML = `<i class="qz-grade qz-gd">D</i>${why === 'help' ? 'No grade this time: you saw an answer. Say it out loud once!' : 'That’s two tries. Here’s one way to say it.'}`;
          bubble('lib', m.t, m.en, { html: `${esc(PRAISE.D)} «${H(m.t)}»` });
          end();
        }
        helpB.onclick = () => {
          if (over || busy) return; help++; snd('click');
          if (help === 1 && op.starter) { helpEl.innerHTML = `<b>Start with:</b> ${H(op.starter)}`; helpEl.classList.remove('hidden'); helpB.textContent = 'Show me'; inp.focus(); }
          else showModel('help');
        };
        async function submit() {
          const text = inp.value.trim(); if (!text || busy || over) return;
          busy = true; bubble('me', text, '', { html: esc(text), speak: false });
          let g = null;
          try { g = EXAM.grade.turn(text, { want: op.want || { any: true }, focus: op.focus }, band, lang); } catch (e) { console.error('[club] turn', e); }
          busy = false;
          if (!g || !g.understood) {
            tries++; snd('wrong');
            if (tries >= 2) return showModel('tries');
            const sm = line(op.simple) || ask;
            bubble('lib', sm.t, sm.en);
            resEl.className = 'qz-res no'; resEl.textContent = g && g.idk ? 'Have a go: any opinion is fine, with a reason if you can.' : `Say a bit more, in ${LANGNAME[lang] || 'the language'}: what you think, and why.`;
            inp.value = ''; inp.focus();
            return;
          }
          let grade = g.grade || 'B'; if (help) grade = STEP[Math.min(3, STEP.indexOf(grade) + help)];
          res.grade = grade; res.pts = TURN()[grade];
          try { DICT.log('talk', band, res.pts / 5); } catch (e) { /* */ }
          const errs = ((g.r && g.r.errors) || []).filter(e => !e.free), tips = [...new Set(errs.map(e => e.tip).filter(Boolean))].slice(0, 2);
          const fixed = g.fixed && g.fixed !== text ? `<div class="qz-fix">${typeof READER !== 'undefined' && READER.markFix && !isCJ(lang) ? READER.markFix(text, g.fixed) : H(g.fixed)}</div>` : '';
          resEl.className = 'qz-res ' + (grade === 'S' || grade === 'A' ? 'ok' : 'no');
          resEl.innerHTML = `<i class="qz-grade qz-g${grade.toLowerCase()}">${grade}</i>${esc(PRAISE[grade])}${fixed}${tips.map(t => `<div class="qz-tip">${esc(t)}</div>`).join('')}`
            + (grade === 'A' && !errs.length ? '<div class="qz-tip">For an S, add a reason or a detail.</div>' : '');
          snd(grade === 'S' || grade === 'A' ? 'learned' : 'review');
          end();
        }
        sayB.onclick = submit;
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
        if (T.auto) setTimeout(() => { if (T.auto === 'model') inp.value = isCJ(lang) && typeof CJK !== 'undefined' ? CJK.plain(fill(line(op.model).t), { lang }) : fill(line(op.model).t); else inp.value = T.auto === 'english' ? 'I liked the book because it was funny.' : QUIZ.ITEMS.IDK[lang]; submit().then(() => { if (!over) { inp.value = T.auto === 'english' ? 'I really liked it.' : QUIZ.ITEMS.IDK[lang]; submit(); } }); }, 10);
      });
    }
    // the reward: coins, a stamp on the club card, Mimo's glasses after three meetings
    function wrapUp() {
      const allRight = items.length > 0 && res.right === items.length;
      const coins = COINS[band] + (allRight ? 5 : 0);
      if (G && G.state) G.state.coins = (G.state.coins || 0) + coins;
      s.coins += coins; s.meetings++; s.done[book.id] = { at: Date.now(), right: res.right, of: items.length, grade: res.grade, coins };
      res.coins = coins; res.done = true;
      const cos = s.meetings >= GLASSES_AT ? QUIZ._.giveCos('club.glasses', 'club') : null;
      READ.save();
      const th = pickL(c.lines.thanks, k0);
      bubble('lib', ttl(th.t, book), ttlEn(th.en, book));
      const nextP = picks()[band];
      const box = document.createElement('div'); box.className = 'qz-prize';
      box.innerHTML = `<span class="big">${res.right} / ${items.length}</span><span class="it">🪙 +${coins} coins${allRight ? ' (5 for all right)' : ''}</span><span class="it">📚 A stamp on your club card (${s.meetings} meeting${s.meetings === 1 ? '' : 's'})</span>`
        + (cos ? `<span class="it">👓 ${esc(READ.mimo())} got ${esc(cos)}! (switch it on or off on the People page)</span>` : s.meetings < GLASSES_AT ? `<span class="it" style="opacity:.75">👓 Reading glasses for ${esc(READ.mimo())} after ${GLASSES_AT} meetings</span>` : '')
        + `<span class="it" style="opacity:.8">${nextP ? `Next month’s ${READ.BAND(band)} book goes up on the notice board.` : `That was the last ${READ.BAND(band)} club book for now.`}</span>`;
      feed.appendChild(box); main.scrollTop = main.scrollHeight;
      snd('chest'); setScore();
      closeB.classList.remove('hidden'); setTimeout(() => closeB.focus(), 40);
      card.querySelector('.qz-foot .nt').textContent = 'Comprehension counts toward your reading, your opinion toward your speaking.';
      T.last = Object.assign({}, res);
    }
    (async () => {
      try {
        const op = pickL(c.lines.open, k0);
        bubble('lib', ttl(op.t, book), ttlEn(op.en, book));
        await sleep(700);
        for (let n = 0; n < items.length && !closed; n++) await askItem(items[n], n + 1);
        if (closed) return;
        if (club.opinion) await askOpinion();
        if (closed) return;
        for (const m of mids) { const tk = line((club.takes || {})[m]); if (tk && tk.t && !closed) { await sleep(600); bubble(m, tk.t, tk.en); } }
        if (closed) return;
        await sleep(600);
        wrapUp();
        if (T.auto && !T.hold) setTimeout(finish, 20);
      } catch (e) { console.error('[club] meeting', e); finish(); }
    })();
    try { await fin; return res; } finally { U().close(); }
  }

  // ------------------------------------------------------------ the librarian's menu: "The book club"
  async function choose(title, opts) {
    const was = G.sim.lock; G.sim.lock = 1;
    try { return await UI.choose(title, opts); } finally { G.sim.lock = was; }
  }
  const sayLib = async (key, i, vars) => { try { if (typeof LIBRARY !== 'undefined' && LIBRARY.person && LIBRARY.person.lineCount(key)) return await LIBRARY.person.say(key, i, vars); } catch (e) { console.error('[club] say', e); } return false; };
  async function menuRun() {
    if (!started()) return null;
    const s = S(), p = LIBRARY.person;
    if (!s.intro) { s.intro = Date.now(); READ.save(); for (let i = 0; i < p.lineCount('club_intro'); i++) await sayLib('club_intro', i); }
    const rd = ready();
    if (!rd.length) {
      await sayLib('club_board', (s.boardN = (s.boardN || 0) + 1) % Math.max(1, p.lineCount('club_board')));
      try { STORY.think('The notice board by the door says which books the club is reading this month.', 4.5); } catch (e) { /* */ }
      return null;
    }
    const book = rd.length === 1 ? rd[0] : await choose('The book club: which meeting?', rd.map(b => ({ label: `«${P(b.title)}» · ${READ.BAND(b.band)}`, sub: b.en || '', value: b })));
    return book ? meeting(book) : null;
  }
  const OPTION = { id: 'club', get label() { return 'The book club'; }, get sub() { return ready().length ? 'you’ve read this month’s book: join the meeting' : 'this month’s books are on the notice board'; }, when: () => started(), run: () => menuRun() };
  const CAT_OPTION = { id: 'club.cat', get label() { const c = cfg(); return `${c && c.cat ? P(c.cat.name) : 'The cat'} is back!`; }, sub: 'bring the lost cat home', when: () => on() && !!S().cat.found && !S().cat.back, run: () => catBack() };

  // ------------------------------------------------------------ the regulars in the reading nook's armchairs (the library's room)
  let RIGS = null, SLEEPCAT = null;
  function chairs() {
    const N = (typeof LIBRARY !== 'undefined' && LIBRARY.SPOT && LIBRARY.SPOT.nook) || { x: -4.9, z: 1.2 };
    return [[N.x - 1.2, N.z - 0.6, 0.9], [N.x + 1.1, N.z + 0.9, -2.3]];
  }
  function buildRigs(parent) {
    const c = cfg(); if (!c || typeof ZHF === 'undefined') return [];
    const out = [];
    Object.values(c.members || {}).slice(0, 2).forEach((m, i) => {
      const [ax, az, ry] = chairs()[i];
      const p = ZHF.person(Object.assign({ skin: '#e0b088', hair: '#3a2b26', shirt: '#3f6fb5', pants: '#4a4038' }, m.rig || {}), { sit: true, seatY: 0.57 });
      const bk = ZHF.Kit(); bk.box(0, -0.02, 0.05, 0.18, 0.24, 0.05, m.book || '#a8322c', { ink: 0.006 }).box(0, -0.02, 0.078, 0.14, 0.2, 0.01, '#fffaf0', { ink: 0 });
      ZHF.bake(p.arms[0].userData.hand, bk);
      p.x = ax + Math.sin(ry) * 0.08; p.z = az + Math.cos(ry) * 0.08; p.y = 0; p.yaw = p.baseYaw = ry; p.pose = 'hold'; p.noTurn = true;
      parent.add(p.root); out.push(p);
    });
    out.g = parent;
    return out;
  }
  function nook(dt, t) {
    if (typeof LIBRARY === 'undefined' || !LIBRARY.inside) return;
    const room = LIBRARY._ && LIBRARY._.ROOM; if (!room || !room.g) return;
    const live = started() && L() in C;
    if (live && (!RIGS || RIGS.g !== room.g || RIGS.lang !== L())) { if (RIGS) RIGS.forEach(p => { if (p.root.parent) p.root.parent.remove(p.root); }); RIGS = buildRigs(room.g); RIGS.lang = L(); }
    if (RIGS) RIGS.forEach(p => { p.root.visible = live; if (live) { p.talking = !!(QUIZ.UI.isOpen && document.body.classList.contains('qz-open') && Math.sin(t * 0.9 + p.x) > 0.6); ZHF.animate(p, dt, t, null); } });
    // the library's cat, home again: asleep on the children's rug
    const home = on() && !!S().cat.back;
    if (home && (!SLEEPCAT || SLEEPCAT.parent !== room.g)) { SLEEPCAT = catModel(true); const K = LIBRARY.SPOT.kids || { x: 5.6, z: 4.2 }; SLEEPCAT.position.set(K.x - 0.7, 0.03, K.z + 0.3); SLEEPCAT.rotation.y = 2.4; SLEEPCAT.scale.setScalar(1.25); room.g.add(SLEEPCAT); }
    if (SLEEPCAT) { SLEEPCAT.visible = home; if (home) SLEEPCAT.children.forEach(m => { m.scale.y = 1 + Math.sin(t * 2.2) * 0.04; }); }
  }

  // ------------------------------------------------------------ the notice quest: the library's lost cat
  const INK = '#2b2235';
  // a little paper cat: white, a gray patch over one eye, a red collar with a gold bell (sitting, or curled up asleep)
  function catModel(sleep) {
    const g = new THREE.Group(), k = ZHF.Kit(), W = '#f6f1e6', GR = '#8a8a96';
    if (sleep) {
      k.ball(0, 0.11, 0, 0.21, 0.11, 0.15, W).ball(0.17, 0.12, 0.07, 0.095, 0.085, 0.09, W).ball(0.15, 0.15, 0.13, 0.035, 0.03, 0.012, GR, { ink: 0 });
      for (const s of [-1, 1]) k.cone(0.2 + s * 0.02, 0.2, 0.07 + s * 0.05, 0.03, 0.06, W, { rz: -0.3 });
      k.rod([-0.18, 0.06, -0.05], [0.05, 0.05, 0.16], 0.03, W);
      k.cyl(0.12, 0.12, 0.06, 0.07, 0.02, '#c2412f', { rz: 1.2, ink: 0.004 });
    } else {
      k.ball(0, 0.16, 0, 0.13, 0.16, 0.12, W).ball(0, 0.36, 0.04, 0.11, 0.1, 0.1, W);
      k.ball(-0.045, 0.375, 0.12, 0.038, 0.034, 0.012, GR, { ink: 0 });
      for (const s of [-1, 1]) { k.cone(s * 0.06, 0.46, 0.03, 0.035, 0.07, W, { rz: -s * 0.25 }); k.ball(s * 0.04, 0.37, 0.125, 0.012, 0.017, 0.008, INK, { ink: 0 }); k.ball(s * 0.05, 0.03, 0.08, 0.035, 0.03, 0.045, W); }
      k.cyl(0, 0.28, 0.03, 0.085, 0.02, '#c2412f', { ink: 0.004 }).ball(0, 0.26, 0.115, 0.02, 0.02, 0.02, '#f2c14e', { ink: 0.003 });
      k.rod([0, 0.06, -0.1], [0.14, 0.09, 0.06], 0.025, W);
    }
    ZHF.bake(g, k);
    return g;
  }
  // the poster on the library's front wall, beside the door (the free-book crate's side, away from the chalkboard)
  let OUT = null;
  const CAT_AT = { x: 16.5, z: -173.3, r: 1.6 };            // (under the willow by the duck pond: town.js's willow at (15.6, −174.2))
  function posterTex() {
    const c0 = cfg(), cat = (c0 && c0.cat) || {}, head = P(line(cat.head || ['¡SE BUSCA!', 'WANTED!']).t), nm = P(cat.name || '');
    return ZHF.canvasTex(256, 320, c => {
      c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 256, 320); c.strokeStyle = 'rgba(43,34,53,.25)'; c.lineWidth = 4; c.strokeRect(4, 4, 248, 312);
      c.fillStyle = '#c2412f'; c.textAlign = 'center'; c.textBaseline = 'middle';
      let px = 40; c.font = `900 ${px}px Bahnschrift, "Segoe UI", "Microsoft YaHei", sans-serif`; while (px > 16 && c.measureText(head).width > 230) { px--; c.font = `900 ${px}px Bahnschrift, "Segoe UI", "Microsoft YaHei", sans-serif`; } c.fillText(head, 128, 34);
      // the cat
      c.lineWidth = 4; c.strokeStyle = INK; c.fillStyle = '#ffffff';
      c.beginPath(); c.ellipse(128, 196, 52, 58, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath(); c.arc(128, 122, 40, 0, Math.PI * 2); c.fill(); c.stroke();
      for (const s of [-1, 1]) { c.beginPath(); c.moveTo(128 + s * 18, 92); c.lineTo(128 + s * 34, 70); c.lineTo(128 + s * 38, 104); c.closePath(); c.fill(); c.stroke(); }
      c.fillStyle = '#8a8a96'; c.beginPath(); c.ellipse(114, 120, 15, 12, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK; for (const s of [-1, 1]) { c.beginPath(); c.arc(128 + s * 14, 120, 4, 0, Math.PI * 2); c.fill(); }
      c.beginPath(); c.moveTo(122, 134); c.lineTo(134, 134); c.lineTo(128, 140); c.closePath(); c.fill();
      c.fillStyle = '#c2412f'; c.fillRect(100, 158, 56, 9); c.fillStyle = '#f2c14e'; c.beginPath(); c.arc(128, 172, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK; px = 30; c.font = `800 ${px}px Bahnschrift, "Segoe UI", "Microsoft YaHei", sans-serif`; while (px > 14 && c.measureText(nm).width > 230) { px--; c.font = `800 ${px}px Bahnschrift, "Segoe UI", "Microsoft YaHei", sans-serif`; } c.fillText(nm, 128, 282);
      c.fillStyle = 'rgba(43,34,53,.45)'; for (let i = 0; i < 2; i++) c.fillRect(40, 300 + i * 7, 176 - i * 40, 3);
    });
  }
  function buildOutside() {
    if (!G || typeof ZHF === 'undefined' || typeof LIBRARY === 'undefined' || !LIBRARY._ || !LIBRARY._.house) return null;
    const h = LIBRARY._.house(), LO = LIBRARY._.OUT; if (!h || !LO || LO.broken) return null;
    const g = new THREE.Group(); g.name = 'club-outside'; g.position.set(h.b.x, h.GY, h.b.z); g.rotation.y = h.yaw; G.w3d.scene.add(g);
    const dx = h.dlx, F = h.front, boardSide = dx + 1.55 > h.b.w / 2 - 0.3 ? -1 : 1, side = -boardSide;
    let lx = dx + side * 1.12; if (Math.abs(lx) > h.b.w / 2 - 0.4) lx = dx - side * 1.12;
    const tex = posterTex(), m = ZHF.plane(0.56, 0.7, tex); m.position.set(lx, 1.55, F + 0.035); g.add(m);
    const k = ZHF.Kit(); k.ball(lx - 0.22, 1.86, F + 0.05, 0.022, 0.022, 0.012, '#c2412f', { ink: 0 }).ball(lx + 0.22, 1.86, F + 0.05, 0.022, 0.022, 0.012, '#c2412f', { ink: 0 }); ZHF.bake(g, k);
    const read = h.world(lx, F + 1.25);
    // the cat under the willow (built now, shown only while the notice's quest is on)
    const cg = new THREE.Group(); cg.name = 'club-cat'; cg.add(catModel(false)); cg.scale.setScalar(1.3);
    cg.position.set(CAT_AT.x, ((typeof TOWN !== 'undefined' && TOWN.GY) || 0.25), CAT_AT.z); cg.rotation.y = -2.2; cg.visible = false; G.w3d.scene.add(cg);
    return { g, poster: m, read, cat: cg, lang: L() };
  }
  const nowWorld = () => { try { return typeof TIME === 'undefined' || !TIME.world || TIME.world() === 'now'; } catch (e) { return true; } };
  function catOn() { const c = cfg(); return started() && !!(c && c.cat) && !S().cat.back; }
  function outside(dt, t) {
    if (!G || typeof TOWN === 'undefined') return;
    const want = catOn();
    if (!OUT && !want) return;
    if (!OUT) { try { OUT = buildOutside() || { broken: true }; } catch (e) { console.error('[club] outside', e); OUT = { broken: true }; } }
    if (OUT.broken) return;
    if (OUT.lang !== L()) { try { OUT.poster.material.map = posterTex(); OUT.poster.material.needsUpdate = true; OUT.lang = L(); } catch (e) { /* */ } }
    const town = G.town && G.town.group, outdoors = !(G.indoors && G.indoors()) && (!town || town.visible) && nowWorld();
    OUT.g.visible = want && outdoors;
    const s = S().cat; OUT.cat.visible = want && outdoors && !!s.read && !s.found;
    if (OUT.cat.visible) { const c0 = OUT.cat.children[0]; if (c0) c0.rotation.z = Math.sin(t * 1.7) * 0.03; }
    if (!OUT.signed && typeof SIGNS !== 'undefined' && SIGNS.add) {
      OUT.signed = true;
      SIGNS.add({ id: 'club-cat-notice', x: OUT.read.x, z: OUT.read.z, r: 1.2, when: () => catOn() && OUT && OUT.g.visible, card: () => catCard() });
    }
  }
  function catCard() {
    const c = cfg(), s = S().cat;
    if (!s.read) { s.read = (G.state.time || 0) + 0.001; READ.save(); }
    const look = { face: '#fffaf0', edge: '#c2412f', ink: INK };
    return { tag: 'A notice on the library’s door', lines: ((c && c.cat && c.cat.notice) || []).map(x => ({ text: line(x).t, en: line(x).en, look })) };
  }
  async function findCat() {
    const s = S().cat, c = cfg(); if (!c || s.found) return;
    s.found = (G.state.time || 0) + 0.001; READ.save();
    snd('learned');
    try { if (G.sim && G.sim.mimo) G.sim.mimo.happy = 2; } catch (e) { /* */ }
    try { STORY.think(c.cat.found_en || 'A white cat with a red collar… it’s the cat from the notice! It purrs and lets you pick it up.', 5); } catch (e) { /* */ }
  }
  async function catBack() {
    const s = S().cat, c = cfg(); if (!c || !s.found || s.back) return;
    s.back = Date.now(); READ.save();
    for (let i = 0; i < LIBRARY.person.lineCount('club_cat'); i++) await sayLib('club_cat', i);
    if (G && G.state) G.state.coins = (G.state.coins || 0) + 15;
    snd('chest'); toast(`🐈 ${P(c.cat.name)} is home: 🪙 +15 coins`);
    READ.save();
  }
  const PROVIDER = {
    interactables() {
      if (!OUT || OUT.broken || !OUT.cat.visible) return [];
      return [{ x: CAT_AT.x, z: CAT_AT.z, r: CAT_AT.r, label: 'Look', run: findCat }];
    },
    tick(dt, Y) {
      if (!OUT || OUT.broken || !OUT.g.visible) return;
      const s = S().cat; if (s.seen || s.read) return;
      if (Math.hypot(OUT.read.x - Y.x, OUT.read.z - Y.z) < 5) {
        s.seen = 1; READ.save();
        const c = cfg(); try { STORY.think(`A paper on the library’s door: «${P(line(c.cat.head).t)}»… somebody lost something.`, 4.5); } catch (e) { /* */ }
      }
    },
  };

  // ------------------------------------------------------------ the journal's Reading page (READ.more): the club card
  const cosOn = id => { try { return !!(typeof TALK !== 'undefined' && TALK.state && TALK.state.cos && TALK.state.cos[id]); } catch (e) { return false; } };
  const journal = {
    show: () => started() && !!S().intro,
    html() {
      if (!started() || !S().intro) return '';
      U().css();
      const s = S(), c = cfg(), done = clubBooks().filter(b => s.done[b.id]);
      return `<h4 class="ph-h">📚 ${H(c.name)}</h4><div class="qz-j"><div class="row">Meetings: <b>${s.meetings}</b> · coins: ${s.coins} · 👓 ${cosOn('club.glasses') ? `${esc(READ.mimo())}’s reading glasses ✓` : `reading glasses for ${esc(READ.mimo())} after ${GLASSES_AT} meetings`}</div>`
        + `<div class="row">This month’s books are on the notice board in Alba’s library.${ready().length ? ' <b>You’ve read one: talk to the librarian to join the meeting.</b>' : ''}</div>`
        + (done.length ? `<div class="qz-stamps">${done.map(b => `<figure><canvas width="92" height="128" data-club-cv="${esc(b.id)}"></canvas><br>${H(b.title)}${s.done[b.id].grade ? ` · ${esc(s.done[b.id].grade)}` : ''}</figure>`).join('')}</div>` : '') + '</div>';
    },
    wire(el) { el.querySelectorAll('canvas[data-club-cv]').forEach(cv => { const b = READ.find('books', cv.dataset.clubCv); if (b && typeof READER !== 'undefined' && READER.coverCanvas) { try { cv.getContext('2d').drawImage(READER.coverCanvas(b, 92, 128), 0, 0); } catch (e) { /* */ } } }); },
  };

  // ------------------------------------------------------------ the side quests
  const ROOM = () => (typeof LIBRARY !== 'undefined' ? LIBRARY.ROOM_AT : null);
  const libDoor = () => { try { const O = LIBRARY._.OUT; return O && !O.broken && O.door ? O.door : null; } catch (e) { return null; } };
  function quest() {
    const board = () => (LIBRARY.inside ? { x: ROOM().x + LIBRARY.SPOT.board.x + 0.75, z: ROOM().z + LIBRARY.SPOT.board.z } : libDoor());
    const desk = () => (LIBRARY.inside ? { x: ROOM().x + LIBRARY.SPOT.talk.x, z: ROOM().z + LIBRARY.SPOT.talk.z } : libDoor());
    const cl = st => (st && st.read && st.read.club) || {};
    return {
      id: 'club', kind: 'side',
      get title() { const c = cfg(); return c ? `The book club: ${P(c.name)}` : 'The book club'; },
      get giver() { return 'the librarian'; },
      started: st => !!cl(st).intro && on(),
      steps: [
        { text: 'Read one of this month’s club books (the library’s notice board says which)', why: 'The club reads one book from each shelf every month. The notice board by the library’s door lists them, in the language.',
          done: () => ready().length > 0 || S().meetings > 0, target: board, hint: '{mimo} points at the notice board by the door.' },
        { text: 'Join the club’s meeting: talk to the librarian', why: 'Two regulars wait in the reading nook. Answer the librarian’s questions about the book, then say what you thought of it.',
          done: () => S().meetings > 0, target: desk, hint: '{mimo} points at the librarian.' },
      ],
      story: [{ when: () => S().meetings > 0, text: 'Alba’s library has a book club: each month one book from each shelf, talked over in the reading nook. The picks go up on the notice board by the door.' }],
    };
  }
  function catQuest() {
    const k = () => S().cat, nm = () => { const c = cfg(); return c && c.cat ? P(c.cat.name) : 'the cat'; };
    const late = at => !!at && ((G.state.time || 0) - at) > HINT_S;
    const cc = () => (cfg() && cfg().cat) || {};
    return {
      id: 'club.cat', kind: 'side',
      get title() { return 'A notice on the library’s door'; },
      get giver() { return 'a notice on the library’s door'; },
      started: st => !!(st && st.read && st.read.club && st.read.club.cat && st.read.club.cat.read) && on(),
      steps: [
        { text: 'Find what the notice on the library’s door asks for', get why() { return late(k().read) ? `${READ.mimo()} remembers the notice: ${cc().where_en || ''}` : 'The notice says what’s lost and where it was last seen. Nothing on the map points there: read it again if you need to.'; },
          done: () => !!k().found, target: () => null, get hint() { return late(k().read) ? `{mimo} remembers: ${cc().where_en || ''}` : '{mimo} looks at you: the notice said where. Read it again?'; } },
        { get text() { return `Bring ${nm()} where the notice says`; }, get why() { return late(k().found) ? `${READ.mimo()} remembers: ${cc().to_en || ''}` : 'The notice says where to bring her.'; },
          done: () => !!k().back, target: () => null, get hint() { return late(k().found) ? `{mimo} remembers: ${cc().to_en || ''}` : '{mimo} looks at you: where did the notice say?'; } },
      ],
      story: [{ when: () => !!k().back, get text() { return `${nm()}, the library’s cat, was lost; a notice on the door said where. Now she sleeps on the children’s rug in the library.`; } }],
    };
  }

  // ------------------------------------------------------------ init, the per-frame update
  function cosmetics() {
    if (typeof TALK === 'undefined' || !TALK.cosmetic || typeof TK === 'undefined' || typeof THREE === 'undefined') return;
    TALK.cosmetic('club.glasses', { name: { en: 'the book club’s reading glasses' }, build(M) {
      if (!M || !M.body) return null;
      const g = new THREE.Group(), mat = TK.toon('#2b2235');
      for (const s of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.011, 6, 18), mat); ring.position.set(s * 0.12, 0.37, 0.318); ring.rotation.y = s * 0.32; g.add(ring); }
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.11, 6), mat); br.rotation.z = Math.PI / 2; br.position.set(0, 0.385, 0.335); g.add(br);
      M.body.add(g); return g;
    } });
  }
  function init(game) {
    G = game; S();
    try { hookNotice(); } catch (e) { console.error('[club] notice', e); }
    try { cosmetics(); } catch (e) { console.error('[club] cosmetics', e); }
    if (typeof LIBRARY !== 'undefined' && LIBRARY.person && LIBRARY.person.options) { if (!LIBRARY.person.options.includes(OPTION)) LIBRARY.person.options.push(OPTION); if (!LIBRARY.person.options.includes(CAT_OPTION)) LIBRARY.person.options.push(CAT_OPTION); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST) { if (!QUESTS.LIST.some(q => q.id === 'club')) QUESTS.LIST.push(quest()); if (!QUESTS.LIST.some(q => q.id === 'club.cat')) QUESTS.LIST.push(catQuest()); }
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (READ.more && !READ.more.includes(journal)) READ.more.push(journal);
  }
  function outdoor(dt, t, you) { if (!G) return; nook(dt, t); outside(dt, t); }

  // ------------------------------------------------------------ checks and tests (CLUB._.tests(lang); the game never calls them)
  function strings(lang) {
    const c = C[lang], out = []; if (!c) return out;
    const put = (where, s) => { if (typeof s === 'string' && s.trim()) out.push({ where, s, l: lang }); };
    put('name', c.name);
    for (const [w, m] of Object.entries(c.members || {})) put('member.' + w, m.name);
    (c.tf || []).forEach((x, i) => put('tf.' + i, x[0]));
    for (const [k, arr] of Object.entries(c.lines || {})) (arr || []).forEach((x, i) => put(`lines.${k}.${i}`, line(x).t));
    for (const [k, arr] of Object.entries(c.lib || {})) (arr || []).forEach((x, i) => put(`lib.${k}.${i}`, line(x).t));
    for (const [k, x] of Object.entries(c.notice || {})) put('notice.' + k, line(x).t);
    if (c.cat) { put('cat.name', c.cat.name); put('cat.head', line(c.cat.head).t); (c.cat.notice || []).forEach((x, i) => put('cat.notice.' + i, line(x).t)); }
    const R = READ._.C[lang];
    for (const b of (R && R.books) || []) {
      if (!b.club) continue;
      (b.club.items || []).forEach((it, i) => { const w = `${b.id}.club${i}`; put(w + '.ask', line(it.ask).t); (it.opts || []).forEach((x, j) => put(`${w}.opt${j}`, line(x).t)); if (it.model) put(w + '.model', line(it.model).t); (it.pairs || []).forEach((p, j) => { put(`${w}.p${j}a`, line(p[0]).t); put(`${w}.p${j}b`, line(p[1]).t); }); });
      const op = b.club.opinion || {}; for (const f of ['ask', 'model', 'simple']) if (op[f]) put(`${b.id}.opinion.${f}`, line(op[f]).t); if (op.starter) put(`${b.id}.opinion.starter`, op.starter);
      for (const [w, x] of Object.entries(b.club.takes || {})) put(`${b.id}.take.${w}`, line(x).t);
    }
    return out;
  }
  function check(langs = ['zh', 'ja']) {
    const bad = []; if (typeof CJK === 'undefined') return bad;
    for (const l of [].concat(langs)) for (const { where, s } of strings(l)) { const p = CJK.validate(fill(s).replace(/\{(band|title)\}/g, 'X'), l); if (p && p.length) bad.push({ where, s, p }); }
    return bad;
  }
  const wordsIn = (b, l) => (b.pages || []).flat().reduce((n, s) => n + (isCJ(l) && typeof CJK !== 'undefined' ? CJK.plain(fill(s[0]), { lang: l, mode: 'chars' }).replace(/[\s\p{P}]/gu, '').length : String(fill(s[0])).split(/\s+/).filter(Boolean).length), 0);
  function tests(l = L()) {
    const was = typeof LEX !== 'undefined' ? LEX.lang : l; if (typeof LEX !== 'undefined') LEX.lang = l;
    const fails = [], ok = (c0, what) => { if (!c0) fails.push(what); return c0; }, counts = { books: 0, items: 0, byBand: {}, words: {} };
    try {
      const c = C[l]; if (!c) return { lang: l, ok: false, fails: ['no club content'] };
      ok(c.name, 'name'); ok(Object.keys(c.members || {}).length === 2 && Object.values(c.members).every(m => m.name && m.look && m.rig && m.role), 'two members with a name, look, rig and role');
      ok((c.tf || []).length === 3 && c.tf.every(x => x[0] && x[1]), 'tf: three labels with English');
      for (const k of ['open', 'right', 'wrong', 'thanks']) ok((c.lines[k] || []).length && c.lines[k].every(x => line(x).en), `lines.${k}: lines with English`);
      for (const k of ['intro', 'board', 'cat']) ok((c.lib[k] || []).length && c.lib[k].every(x => x.text && x.en), `lib.${k}: lines with English`);
      for (const k of ['head', 'pick', 'meet', 'none']) ok(c.notice && line(c.notice[k]) && line(c.notice[k]).en, `notice.${k}`);
      ok(c.notice && /\{band\}/.test(line(c.notice.pick).t) && /\{title\}/.test(line(c.notice.pick).t), 'notice.pick: {band} and {title}');
      ok(c.cat && c.cat.name && line(c.cat.head).en && (c.cat.notice || []).length >= 3 && c.cat.notice.length <= 4 && c.cat.notice.every(x => line(x).en) && c.cat.where_en && c.cat.to_en && c.cat.found_en,
        'cat: a name, a head, a notice of three or four lines (a fifth turns the Read card into its compact grid, which clips long lines), where_en, to_en, found_en');
      const R = READ._.C[l], books = ((R && R.books) || []).filter(b => b.club);
      for (const b of books) {
        counts.books++; counts.byBand[b.band] = (counts.byBand[b.band] || 0) + 1; counts.words[b.id] = wordsIn(b, l);
        ok(b.retell && b.retell.model, `${b.id}: a retell`);
        const items = b.club.items || [];
        ok(items.length >= 3 && items.length <= 4, `${b.id}: ${items.length} club items (3–4)`);
        items.forEach((raw, k) => {
          const w = `${b.id} club #${k + 1}`; counts.items++;
          ok(['mc', 'tf', 'tfn', 'short', 'match'].includes(raw.type) && line(raw.ask) && line(raw.ask).en, w + ': type and question with English');
          if (raw.type === 'mc') ok((raw.opts || []).length >= 3 && raw.opts.every(x => line(x).en) && raw.key >= 0 && raw.key < raw.opts.length, w + ': three options with English, a key');
          if (raw.type === 'short') ok(raw.want && raw.model && line(raw.model).en, w + ': want and model');
          for (const seed of [5, 23]) {
            const it = QUIZ.ITEMS.resolve(raw, k, seed), right = QUIZ.ITEMS.auto(it, 'model', l), sc = QUIZ.ITEMS.score(it, right, l);
            ok(sc === 1, `${w} (${raw.type}): the right answer scores ${sc} («${JSON.stringify(right)}»)`);
            if (raw.type !== 'short') ok(QUIZ.ITEMS.score(it, QUIZ.ITEMS.auto(it, 'wrong', l), l) < 1, `${w}: a wrong answer scores 1`);
            else { ok(QUIZ.ITEMS.score(it, QUIZ.ITEMS.IDK[l], l) === 0, `${w}: «${QUIZ.ITEMS.IDK[l]}» scores`); ok(QUIZ.ITEMS.score(it, 'I don’t know', l) === 0, `${w}: English scores`); }
          }
        });
        const op = b.club.opinion;
        if (ok(op && line(op.ask) && line(op.ask).en && line(op.model) && line(op.model).en && line(op.simple) && op.want, `${b.id}: an opinion with ask, model, simple and want`)) {
          const typed = isCJ(l) && typeof CJK !== 'undefined' ? CJK.plain(fill(line(op.model).t), { lang: l }) : fill(line(op.model).t);
          const g = EXAM.grade.turn(typed, { want: op.want }, b.band, l), n = EXAM.grade.turn(QUIZ.ITEMS.IDK[l], { want: op.want }, b.band, l), e = EXAM.grade.turn(line(op.model).en, { want: op.want }, b.band, l);
          ok(g.understood && (g.grade === 'S' || g.grade === 'A' || g.grade === 'B'), `${b.id}: the opinion's model grades ${g.understood ? g.grade : 'not understood'} ${g.r && g.r.errors ? g.r.errors.filter(x => !x.free).map(x => x.code + ' «' + x.fix + '» ' + (x.tip || '')).join(', ') : ''}`);
          ok(!n.understood, `${b.id}: «${QUIZ.ITEMS.IDK[l]}» is understood as an opinion`); ok(!e.understood, `${b.id}: the English model is understood`);
        }
        for (const m of Object.keys(c.members)) ok(line((b.club.takes || {})[m]) && line(b.club.takes[m]).en, `${b.id}: ${m}'s take`);
      }
      for (const band of [1, 2, 3, 4]) ok((counts.byBand[band] || 0) >= 2, `band ${band}: ${counts.byBand[band] || 0} club books (2 wanted)`);
      if (isCJ(l)) check([l]).forEach(x => fails.push(`CJK ${x.where}: ${x.p.join('; ')}`));
    } catch (e) { fails.push('threw: ' + ((e && e.stack) || e)); }
    finally { if (typeof LEX !== 'undefined') LEX.lang = was; }
    return { lang: l, ok: !fails.length, fails, counts };
  }

  return {
    add, cfg, on, started, picks, ready, meeting, S, init, outdoor, journal, strings, check, tests, OPTION, CAT_OPTION, CAT_AT,
    _: { C, T, noticeLines, hookNotice, menuRun, findCat, catBack, catCard, buildRigs, catModel, quest, catQuest, get OUT() { return OUT; }, get RIGS() { return RIGS; }, get G() { return G; } },
  };
})();
