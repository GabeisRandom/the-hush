'use strict';
// SERIAL: Radio Alba's detective serial (A1, 2026-11-27; DESIGN.md 21.16). One original detective per language and one gentle,
// PG case (a radio drama: it never touches the story's own events), told in six weekly parts: B1 (1–3), then B2 (4–6). Part k
// airs with the quiz show's week (start + k − 1; quiz.js's S().aired), and each part plays in quiz.js's player with the serial's
// own frame (its narrator, its "Previously…" line, its sign-off). Clues are spread over parts 1–5 (the journal's case notes
// keep one per part). After part 5 the listeners name the culprit: first an offer to hear the earlier parts again (free), then
// a multiple choice and a short "why". Part 6 is the reveal: a right guess wins the detective's magnifying-glass pin for Mimo;
// a wrong one still gets the whole reveal, kindly, without the pin.
//   SERIAL.add(lang, { show, parts, culprit })   serial_<lang>.js (the shape is at the top of serial_es.js)
//   SERIAL.on() · aired() · menu(where) (radio.js RADIO.extra) · play(part, o) · guess() · S() · init(game) · journal (READ.more)
//   SERIAL.tests(l) · check(l) · strings(l) · _ (T: test flags)
// State: G.state.read.serial (saved with the game): { heard: { partId: { at, right, of, coins } }, guess: { pick, right, why,
//   clue, at }, solved, pin, coins }

const SERIAL = (() => {
  let G = null;
  const L = () => READ.lang;
  const isCJ = l => l === 'zh' || l === 'ja';
  const esc = READ.esc, P = s => READ.plain(s), H = s => READ.html(s);
  const line = x => (!x ? null : Array.isArray(x) ? { t: x[0], en: x[1] || '' } : typeof x === 'string' ? { t: x, en: '' } : { t: x.t != null ? x.t : x.text, en: x.en || '' });
  const snd = k => { try { if (typeof Sound !== 'undefined') Sound.play(k); } catch (e) { /* */ } };
  const toast = t => { try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(t); } catch (e) { /* */ } };
  const LANGNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  const COIN = 2, SOLVE = 10, PIN = 'serial.lens';
  const T = { auto: null, guess: null, hold: false, last: null };       // tests: answer for you (QUIZ._.T does the player), a guess

  // ------------------------------------------------------------ content
  const C = {};
  function add(lang, def = {}) {
    const o = C[lang] || (C[lang] = { show: null, parts: [], culprit: null });
    if (def.show) o.show = Object.assign(o.show || {}, def.show);
    if (def.culprit) o.culprit = def.culprit;
    for (const p of def.parts || []) { p.lang = lang; p.kind = p.kind || 'serial'; const i = o.parts.findIndex(x => x.id === p.id); if (i >= 0) o.parts[i] = p; else o.parts.push(p); }
    o.parts.sort((a, b) => a.n - b.n);
    if (isCJ(lang) && typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(strings(lang).map(x => x.s)); } catch (e) { /* */ } }
    return o;
  }
  const content = (l = L()) => C[l] || null;
  const on = () => { const c = content(); return !!(c && c.show && c.parts.length && typeof QUIZ !== 'undefined' && READ.on('radio')); };
  function S() {
    const r = READ.S(), o = r.serial || (r.serial = {});
    o.v = 1; o.heard = o.heard || {}; o.coins = o.coins || 0;
    return o;
  }
  // parts aired so far: from the quiz show's week «start» on, one a week
  function aired() {
    if (!on() || !QUIZ.started()) return 0;
    const c = content(), start = c.show.start || 2;
    return Math.max(0, Math.min(c.parts.length, (QUIZ.S().aired || 0) - start + 1));
  }
  const parts = () => content().parts;
  const heard = p => !!S().heard[p.id];
  const guessPart = () => (content().culprit && content().culprit.after) || 5;
  const needGuess = () => !!content().culprit && !S().guess && parts().filter(p => p.n <= guessPart()).every(heard);

  // ------------------------------------------------------------ the frame quiz.js plays a part in
  function frame(p) {
    const sh = content().show;
    const recap = p.recap ? [Object.assign({ frame: true, who: sh.narrator || 'narrator' }, { text: line(p.recap).t, en: line(p.recap).en })] : [];
    return Object.assign({}, sh, {
      title: line(sh.title).t, en: line(sh.title).en,
      open: (sh.open || []).concat(recap),
      hosts: sh.voices, asker: sh.narrator || Object.keys(sh.voices)[0],
      perfect: sh.perfect, good: sh.good, low: sh.low, bye: p.n === parts().length && sh.end ? sh.end : sh.bye, regular: {}, stickers: [],     // (end: the last part's sign-off)
    });
  }
  // play a part: the first time it's heard, 2 coins a right answer and its clue goes into the case notes; part 6 settles the guess
  async function play(p, o = {}) {
    if (!p) return null;
    const s = S(), first = !heard(p) && !o.practice, sh = frame(p), c = content();
    const award = (res, skill) => {
      const total = res.reduce((a, x) => a + x.s, 0), max = res.length, got = { total, max, perfect: max > 0 && res.every(x => x.s >= 1), coins: 0, sticker: null, streak: 0, greet: 0, cos: [], extra: [], say: [] };
      if (first) {
        got.coins = Math.round(total * COIN);
        s.heard[p.id] = { at: Date.now(), right: Math.round(total * 10) / 10, of: max, coins: got.coins, skill };
        if (got.coins && G && G.state) { G.state.coins = (G.state.coins || 0) + got.coins; s.coins += got.coins; }
        got.extra.push(`🪙 +${got.coins} coins (${COIN} a right answer, the first time you hear a part)`);
        if (p.clue) got.extra.push(`🔎 A new clue in your case notes (the journal’s Reading page)`);
      } else if (s.heard[p.id]) s.heard[p.id].again = (s.heard[p.id].again || 0) + 1;
      // the reveal: the guess is settled
      if (p.n === parts().length && first && c.culprit) {
        const g = s.guess || {};
        s.solved = Date.now();
        const right = !!g.right;
        got.say = (right ? c.culprit.right : c.culprit.wrong || []).map(x => Object.assign({}, x));
        if (right) {
          const cos = typeof QUIZ !== 'undefined' && QUIZ._ && QUIZ._.giveCos ? QUIZ._.giveCos(PIN, 'serial') : null;
          s.pin = true; if (G && G.state) G.state.coins = (G.state.coins || 0) + SOLVE; s.coins += SOLVE;
          got.extra.push(`🕵 You named the culprit! 🪙 +${SOLVE} coins${cos ? ` and ${READ.mimo()} gets ${cos} (switch it on or off on the People page)` : ''}`);
        } else got.extra.push(`🕵 Not this time: no pin, but the case is closed, and every part stays on the radio to hear again.`);
      }
      READ.save();
      T.last = { part: p.id, total, max, first, solved: !!s.solved };
      return got;
    };
    const chip = first ? '<i class="qz-chip new">new part</i>' : '<i class="qz-chip prac">rerun · free</i>';
    const ep = Object.assign({}, p, { title: `${line(p.title).t} (${p.n}/${parts().length})`, en: line(p.title).en });     // quiz.js shows title + en
    return QUIZ.play(ep, { show: sh, award, chip, practice: !first, serial: true });
  }

  // ------------------------------------------------------------ naming the culprit (after part 5): hear the parts again, then guess
  const choose = async (title, opts) => { const was = G.sim.lock; G.sim.lock = 1; try { return await UI.choose(title, opts); } finally { G.sim.lock = was; } };
  async function guess() {
    const c = content(), cu = c && c.culprit; if (!cu || S().guess) return S().guess || null;
    // first, the offer: any earlier part again, for free
    if (!T.guess) for (;;) {
      const opts = [{ label: '🕵 I’m ready to name the culprit', value: 'go' }].concat(parts().filter(p => p.n <= guessPart() && heard(p)).map(p => ({ label: `🔁 Part ${p.n}: ${P(line(p.title).t)}`, sub: `${line(p.title).en} · hear it again first (free)`, value: p })));
      const v = await choose(`«${P(line(c.show.title).t)}»: before you name the culprit, hear an earlier part again?`, opts);
      if (!v) return null;
      if (v === 'go') break;
      await play(v, { practice: true });
    }
    return guessCard();
  }
  // the guess card: the detective asks, you pick a name and say why (QUIZ's overlay and items)
  function guessCard() {
    const c = content(), cu = c.culprit, sh = c.show, lang = L(), voices = sh.voices, det = sh.detective || Object.keys(voices)[1] || Object.keys(voices)[0];
    const U = QUIZ.UI, IT = QUIZ.ITEMS;
    const pickRaw = { type: 'mc', ask: cu.ask, opts: cu.opts, key: cu.key }, whyRaw = { type: 'short', ask: cu.why.ask, want: cu.why.want || { any: true }, model: cu.why.model };
    const items = [IT.resolve(pickRaw, 0, QUIZ._.hash(cu.ask[0] || '') ^ 77), IT.resolve(whyRaw, 1, 7)];
    return new Promise(resolve => {
      const r = U.open('radio');
      r.innerHTML = `<div class="qz-shade"></div><div class="qz-card"><div class="qz-top"><canvas class="qz-logo" width="208" height="128"></canvas><div class="qz-ttl"><b>${H(line(sh.title).t)}</b><small>🕵 Who did it? <span class="en">${esc(line(sh.title).en)}</span></small></div><span><i class="qz-chip">${READ.BAND(4)}</i></span><button class="qz-x" title="Close (Esc)">✕</button></div>`
        + `<div class="qz-body"><div class="qz-side"><div class="qz-cast">${[det].map(w => `<div class="qz-who" data-who="${esc(w)}"><canvas width="112" height="112"></canvas><span>${esc(P(voices[w].name))}</span><small>${esc(voices[w].role || 'the detective')}</small></div>`).join('')}</div>`
        + `<p class="qz-note">Your case notes (the journal’s Reading page) have a clue from each part. Pick a name, then say why in ${esc(LANGNAME[lang] || 'the language')}: a clue you heard is the best reason.</p></div>`
        + `<div class="qz-main"><div class="qz-feed"></div><div class="qz-items">${items.map((it, i) => IT.html(it, i + 1, { say: false })).join('')}</div></div></div>`
        + `<div class="qz-foot"><span class="nt">The answer comes in the last part, next week.</span><span class="sp"></span><button class="qz-btn main" data-a="lock">Name the culprit ▸</button></div></div>`;
      const card = r.querySelector('.qz-card'), main = card.querySelector('.qz-main'), feed = card.querySelector('.qz-feed'), lockB = card.querySelector('[data-a="lock"]'), foot = card.querySelector('.qz-foot .nt');
      U.logo(card.querySelector('.qz-logo'), 'radio');
      card.querySelectorAll('.qz-who').forEach(d => U.face(d.querySelector('canvas'), (voices[d.dataset.who] || {}).look));
      const ask = line(cu.intro || cu.ask);
      const b = document.createElement('div'); b.className = 'qz-bub';
      b.innerHTML = `<canvas width="112" height="112"></canvas><div class="b"><span class="who">${esc(P(voices[det].name))}</span>${H(ask.t)}<span class="en hidden">${esc(ask.en)}</span></div>`;
      feed.appendChild(b); U.face(b.querySelector('canvas'), voices[det].look); b.onclick = () => b.querySelector('.en').classList.toggle('hidden');
      const A = {};
      IT.wire(main, items, A, {});
      let done = false, closed = false;
      const finish = () => { if (closed) return; closed = true; U.close(); resolve(S().guess || null); };
      card.querySelector('.qz-x').onclick = finish;
      U.keys(e => { if (e.code === 'Escape') { finish(); return true; } if (e.code === 'Enter') { lockB.click(); return true; } return false; });
      lockB.onclick = () => {
        if (done) return finish();
        const a0 = IT.answer(main, items[0], A), a1 = String(IT.answer(main, items[1], A) || '').trim();
        if (!IT.answered(a0) || !a1) { foot.innerHTML = '<b style="color:#9a3a22">Pick a name and say why, then press again.</b>'; return; }
        done = true;
        const right = IT.score(items[0], a0, lang) >= 1, clue = IT.score(items[1], a1, lang) >= 1;
        let grade = null; try { const g = EXAM.grade.turn(a1, { want: { any: true } }, 4, lang); grade = g && g.understood ? g.grade : null; if (grade) DICT.log('talk', 4, (EXAM.TURN_PTS || { S: 5, A: 4.25, B: 3.5, C: 2.5, D: 1 })[grade] / 5); } catch (e) { /* */ }
        try { DICT.log('listen', 4, right ? 1 : 0); } catch (e) { /* */ }
        S().guess = { pick: items[0].opts[a0] ? P(items[0].opts[a0].t) : '', right, why: a1, clue, grade, at: Date.now() };
        READ.save();
        main.querySelectorAll('.qz-opt').forEach(x => { x.disabled = true; }); const inp = main.querySelector('.qz-sh'); if (inp) inp.disabled = true;
        const said = line(cu.thanks || ['…', '']);
        const b2 = document.createElement('div'); b2.className = 'qz-bub';
        b2.innerHTML = `<canvas width="112" height="112"></canvas><div class="b"><span class="who">${esc(P(voices[det].name))}</span>${H(said.t)}<span class="en hidden">${esc(said.en)}</span></div>`;
        feed.appendChild(b2); U.face(b2.querySelector('canvas'), voices[det].look); b2.onclick = () => b2.querySelector('.en').classList.toggle('hidden');
        foot.textContent = `Your guess is in${grade ? ` (your reason: ${grade})` : ''}. The answer airs in the last part${aired() >= parts().length ? ': it’s on the radio now' : ', next week'}.`;
        lockB.textContent = 'Close ▸'; snd('learned');
        try { if (typeof SPEECH !== 'undefined' && !(QUIZ._.T.mute || T.auto)) SPEECH.say(said.t, { lang, who: 'qz.' + det }); } catch (e) { /* */ }
        if (T.auto) setTimeout(finish, 10);
      };
      if (T.auto) setTimeout(() => {
        const pick = T.auto === 'wrong' ? (items[0].key + 1) % items[0].opts.length : items[0].key;
        IT.put(main, items[0], pick, A); IT.put(main, items[1], T.auto === 'wrong' ? 'No sé.' : IT.auto(items[1], 'model', lang), A);
        lockB.click();
      }, 10);
    });
  }

  // ------------------------------------------------------------ the radio's menu (radio.js RADIO.extra): new parts, the guess, reruns
  function menu() {
    if (!on() || !QUIZ.started()) return [];
    const c = content(), s = S(), n = aired(), name = `«${P(line(c.show.title).t)}»`, out = [];
    if (!n) {
      out.push({ label: `🕵 ${name} · a new detective serial, from next week`, sub: `${line(c.show.title).en}: a radio drama in six parts (B1–B2)`, run: async () => { try { STORY.think(line(c.show.teaser || ['', 'A new mystery starts next week on Radio Alba. Ears ready!']).en || 'A new mystery starts next week.', 4); } catch (e) { /* */ } } });
      return out;
    }
    const nextNew = parts().find(p => p.n <= n && !heard(p));
    if (nextNew) {
      const last = nextNew.n === parts().length;
      out.push({ label: `🕵 ${name} · part ${nextNew.n} (${READ.BAND(nextNew.band)}) · NEW`, sub: `${line(nextNew.title).en}${last ? ' · the answer' : ''} · ${COIN} coins a right answer`,
        run: async () => { if (last && needGuess()) { const g = await guess(); if (!g) return null; } return play(nextNew); } });
    } else if (needGuess()) out.push({ label: `🕵 ${name} · who did it? Name the culprit`, sub: 'Before the last part airs: hear the parts again if you like, then guess', run: () => guess() });
    if (Object.keys(s.heard).length) out.push({ label: `🕵 ${name} · ${s.solved ? 'the whole case' : 'earlier parts'}`, sub: 'Hear a part again: free, no prizes', run: () => rerunMenu() });
    if (!nextNew && !needGuess() && !s.solved && n < parts().length) out.push({ label: `🕵 ${name} · part ${n + 1} next week`, sub: 'The next part airs with the quiz show’s next week', run: async () => null });
    return out;
  }
  async function rerunMenu() {
    const c = content(), ps = parts().filter(heard);
    if (!ps.length) return null;
    const p = await choose(`«${P(line(c.show.title).t)}»: hear a part again (free)`, ps.map(x => ({ label: `🕵 Part ${x.n}: ${P(line(x.title).t)} · ${READ.BAND(x.band)}`, sub: line(x.title).en, value: x })));
    return p ? play(p, { practice: true }) : null;
  }

  // ------------------------------------------------------------ the journal's Reading page (READ.more): the case notes
  const journal = {
    show: () => on() && Object.keys(S().heard).length > 0,
    html() {
      if (!on() || !Object.keys(S().heard).length) return '';
      QUIZ.UI.css();
      const c = content(), s = S(), cu = c.culprit || {};
      let h = `<h4 class="ph-h">🕵 ${H(line(c.show.title).t)}: case notes</h4><div class="qz-j">`;
      for (const p of parts()) {
        if (!heard(p)) { if (p.n <= aired()) h += `<div class="row">Part ${p.n}: <i>on the radio now, not heard yet</i></div>`; continue; }
        const cl = line(p.clue);
        h += `<div class="row"><b>Part ${p.n}</b> · ${H(line(p.title).t)}${cl ? `<br>🔎 ${H(cl.t)} <span style="opacity:.7;font-style:italic">${esc(cl.en)}</span>` : ''}</div>`;
      }
      if (s.guess) h += `<div class="row">Your guess: <b>${esc(s.guess.pick)}</b>${s.solved ? (s.guess.right ? ' ✓ right! 🕵' : ' ✗ (the case is closed: hear part 6 again for the answer)') : ' (the answer airs in part 6)'}</div>`;
      else if (needGuess()) h += `<div class="row"><b>Who did it?</b> Name the culprit on the radio before the last part.</div>`;
      if (s.pin) h += `<div class="row">🔍 ${esc(READ.mimo())}’s magnifying-glass pin ✓</div>`;
      return h + '</div>';
    },
  };

  // ------------------------------------------------------------ Mimo's pin (TALK.cosmetic)
  function cosmetics() {
    if (typeof TALK === 'undefined' || !TALK.cosmetic || typeof TK === 'undefined' || typeof THREE === 'undefined') return;
    TALK.cosmetic(PIN, { name: { en: 'the radio detective’s magnifying-glass pin' }, build(M) {
      if (!M || !M.body) return null;
      const g = new THREE.Group(); g.position.set(-0.17, 0.2, 0.29); g.rotation.set(-0.2, -0.45, 0.4);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.009, 6, 16), TK.toon('#c9a24a')); g.add(ring);
      const glass = new THREE.Mesh(new THREE.CircleGeometry(0.032, 16), TK.toon('#d9f0f7')); glass.position.z = 0.002; g.add(glass);
      const handle = TK.part(TK.G.cyl, '#6b4428', [0, -0.065, 0], [0.011, 0.05, 0.011], { ink: 0.004 }); g.add(handle);
      M.body.add(g); return g;
    } });
  }
  // a side quest, for the journal's list
  function quest() {
    const sv = st => (st && st.read && st.read.serial) || {};
    return {
      id: 'serial', kind: 'side',
      get title() { const c = content(); return c ? `Radio Alba’s detective serial: «${P(line(c.show.title).t)}»` : 'Radio Alba’s detective serial'; },
      get giver() { return 'Radio Alba'; },
      started: st => on() && Object.keys(sv(st).heard || {}).length > 0,
      steps: [
        { text: 'Hear the serial’s parts as they air, one a week (the radio: the inn’s terrace, the library, or a pocket radio)', why: 'Each part leaves a clue in your case notes, on the journal’s Reading page.', done: () => parts().filter(p => p.n <= guessPart()).every(heard), target: () => null, hint: '{mimo} hums a spooky tune: the detective serial is on the radio.' },
        { text: 'Name the culprit before the last part', why: 'The detective asks the listeners: who did it, and why?', done: () => !!S().guess, target: () => null, hint: '{mimo} taps its chin: who did it?' },
        { text: 'Hear the last part: the answer', why: 'The detective explains everything in part 6.', done: () => !!S().solved, target: () => null, hint: '{mimo} perks up its ears: the last part is on.' },
      ],
      story: [{ when: () => !!S().solved, get text() { return `Radio Alba aired a detective serial in six parts; ${S().guess && S().guess.right ? 'you named the culprit and won the detective’s pin.' : 'the detective explained it all in the last part.'}`; } }],
    };
  }
  const PROVIDER = { id: 'serial', menu };
  function init(game) {
    G = game; S();
    try { cosmetics(); } catch (e) { console.error('[serial] cosmetics', e); }
    if (typeof RADIO !== 'undefined' && RADIO.extra && !RADIO.extra.includes(PROVIDER)) { const i = RADIO.extra.findIndex(x => x && x.id === 'quiz'); RADIO.extra.splice(i >= 0 ? i + 1 : RADIO.extra.length, 0, PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'serial')) QUESTS.LIST.push(quest());
    if (READ.more && !READ.more.includes(journal)) READ.more.push(journal);
  }

  // ------------------------------------------------------------ checks and tests (SERIAL.tests(l); the game never calls them)
  function strings(lang) {
    const c = C[lang], out = []; if (!c) return out;
    const put = (where, s) => { if (typeof s === 'string' && s.trim()) out.push({ where, s, l: lang }); };
    const sh = c.show || {};
    put('show.title', line(sh.title) && line(sh.title).t);
    for (const k of ['open', 'toQuiz', 'perfect', 'good', 'low', 'bye', 'end']) (sh[k] || []).forEach((x, i) => put(`show.${k}.${i}`, x.text));
    put('show.teaser', line(sh.teaser) && line(sh.teaser).t);
    for (const [w, v] of Object.entries(sh.voices || {})) put(`show.voice.${w}`, v.name);
    (sh.tf || []).forEach((x, i) => put(`show.tf.${i}`, x[0]));
    for (const p of c.parts) {
      put(p.id + '.title', line(p.title).t); if (p.recap) put(p.id + '.recap', line(p.recap).t); if (p.clue) put(p.id + '.clue', line(p.clue).t);
      for (const [w, v] of Object.entries(p.voices || {})) put(`${p.id}.voice.${w}`, v.name);
      (p.lines || []).forEach((x, i) => put(`${p.id}.${i}`, x.text));
      (p.items || []).forEach((it, i) => { const w = `${p.id}.q${i}`; put(w + '.ask', line(it.ask).t); (it.opts || []).forEach((x, j) => put(`${w}.opt${j}`, line(x).t)); if (it.model) put(w + '.model', line(it.model).t); (it.pairs || []).forEach((pp, j) => { put(`${w}.p${j}a`, line(pp[0]).t); put(`${w}.p${j}b`, line(pp[1]).t); }); (it.extra || []).forEach((x, j) => put(`${w}.x${j}`, line(x).t)); });
    }
    const cu = c.culprit;
    if (cu) { put('culprit.ask', line(cu.ask).t); if (cu.intro) put('culprit.intro', line(cu.intro).t); if (cu.thanks) put('culprit.thanks', line(cu.thanks).t); (cu.opts || []).forEach((x, i) => put('culprit.opt' + i, line(x).t)); put('culprit.why.ask', line(cu.why.ask).t); put('culprit.why.model', line(cu.why.model).t); for (const k of ['right', 'wrong']) (cu[k] || []).forEach((x, i) => put(`culprit.${k}.${i}`, x.text)); }
    return out;
  }
  function check(langs = ['zh', 'ja']) {
    const bad = []; if (typeof CJK === 'undefined') return bad;
    for (const l of [].concat(langs)) for (const { where, s } of strings(l)) { const p = CJK.validate(READ.fill(s), l); if (p && p.length) bad.push({ where, s, p }); }
    return bad;
  }
  const wordsIn = (s, l) => (isCJ(l) ? CJK.plain(READ.fill(s), { lang: l, mode: 'chars' }).replace(/[\s\p{P}]/gu, '').length : String(READ.fill(s)).split(/\s+/).filter(Boolean).length);
  const typedAs = (s, l) => (isCJ(l) ? CJK.plain(READ.fill(String(s || '')), { lang: l }) : READ.fill(String(s || '')));
  function tests(l = L()) {
    const was = typeof LEX !== 'undefined' ? LEX.lang : l; if (typeof LEX !== 'undefined') LEX.lang = l;
    const fails = [], ok = (c0, what) => { if (!c0) fails.push(what); return c0; }, counts = { parts: 0, items: 0, words: {}, grades: {} };
    try {
      const c = C[l]; if (!c || !c.show) return { lang: l, ok: false, fails: ['no serial'] };
      const sh = c.show, V0 = sh.voices || {};
      ok(line(sh.title) && line(sh.title).en, 'show.title with English'); ok(Object.keys(V0).length >= 2 && Object.values(V0).every(v => v.name && v.look), 'show.voices: a narrator and a detective, with names and looks');
      ok(V0[sh.narrator] && V0[sh.detective], 'show.narrator and show.detective are voices');
      for (const k of ['open', 'toQuiz', 'perfect', 'good', 'low', 'bye', 'end']) { ok((sh[k] || []).length, `show.${k}`); (sh[k] || []).forEach((x, i) => ok(x.en && V0[x.who], `show.${k}.${i}: English and a show voice`)); }
      ok(line(sh.teaser) && line(sh.teaser).en, 'show.teaser with English');
      ok((sh.tf || []).length === 3, 'show.tf: three labels');
      ok(c.parts.length === 6 && c.parts.every((p, i) => p.n === i + 1), 'six parts, numbered 1–6');
      for (const p of c.parts) {
        counts.parts++;
        const w = p.id, V = Object.assign({}, V0, p.voices || {});
        ok(p.band === (p.n <= 3 ? 3 : 4), `${w}: band ${p.band} (parts 1–3 B1, 4–6 B2)`);
        ok(line(p.title) && line(p.title).en, `${w}: title with English`); if (p.n > 1) ok(line(p.recap) && line(p.recap).en, `${w}: a "Previously…" recap`);
        if (p.n <= 5) ok(line(p.clue) && line(p.clue).en, `${w}: a clue for the case notes`);
        ok((p.lines || []).length >= 8, `${w}: ${(p.lines || []).length} lines (8 wanted)`);
        let n = 0; (p.lines || []).forEach((x, i) => { ok(x.en, `${w}.${i}: English`); ok(V[x.who], `${w}.${i}: no voice for ${x.who}`); n += wordsIn(x.text, l); });
        counts.words[w] = n;
        const lo = isCJ(l) ? (p.band === 3 ? 260 : 330) : (p.band === 3 ? 160 : 200);
        ok(n >= lo, `${w}: ${n} ${isCJ(l) ? 'characters' : 'words'} (${lo}+ wanted)`);
        ok((p.items || []).length === 5, `${w}: ${(p.items || []).length} items (5 wanted)`);
        (p.items || []).forEach((raw, k) => {
          counts.items++; const iw = `${w} #${k + 1} (${raw.type})`;
          ok(['mc', 'tf', 'tfn', 'short', 'match'].includes(raw.type) && line(raw.ask) && line(raw.ask).en, iw + ': type and question with English');
          if (raw.at != null) ok(raw.at >= 0 && raw.at < p.lines.length, iw + ': at out of range');
          if (raw.type === 'mc') ok((raw.opts || []).length >= 3 && raw.opts.every(x => line(x).en) && raw.key >= 0 && raw.key < raw.opts.length, iw + ': options with English, a key');
          if (raw.type === 'short') ok(raw.want && raw.model && line(raw.model).en, iw + ': want and model');
          for (const seed of [3, 17]) {
            const it = QUIZ.ITEMS.resolve(raw, k, seed), right = QUIZ.ITEMS.auto(it, 'model', l), sc = QUIZ.ITEMS.score(it, right, l);
            ok(sc === 1, `${iw}: the right answer scores ${sc} («${JSON.stringify(right)}»)`);
            if (raw.type !== 'short') ok(QUIZ.ITEMS.score(it, QUIZ.ITEMS.auto(it, 'wrong', l), l) < 1, `${iw}: a wrong answer scores 1`);
            else { ok(QUIZ.ITEMS.score(it, QUIZ.ITEMS.IDK[l], l) === 0, `${iw}: «${QUIZ.ITEMS.IDK[l]}» scores`); ok(QUIZ.ITEMS.score(it, 'I don’t know', l) === 0, `${iw}: English scores`); }
          }
          if (raw.type === 'short' && typeof EXAM !== 'undefined') { const g = EXAM.grade.turn(typedAs(line(raw.model).t, l), { want: { any: true } }, p.band, l), gr = g && g.understood ? g.grade : 'NU'; counts.grades[gr] = (counts.grades[gr] || 0) + 1; ok(gr === 'S' || gr === 'A', `${iw}: the model grades ${gr}`); }
        });
      }
      const cu = c.culprit;
      if (ok(cu && line(cu.ask) && (cu.opts || []).length >= 3 && cu.key >= 0 && cu.why && cu.why.want && line(cu.why.model) && (cu.right || []).length && (cu.wrong || []).length && line(cu.thanks), 'culprit: ask, options, key, why (want, model), thanks, right and wrong lines')) {
        const it = QUIZ.ITEMS.resolve({ type: 'short', ask: cu.why.ask, want: cu.why.want, model: cu.why.model }, 1, 7);
        ok(QUIZ.ITEMS.score(it, typedAs(line(cu.why.model).t, l), l) === 1, 'culprit.why: the model names a clue');
        ok(QUIZ.ITEMS.score(it, QUIZ.ITEMS.IDK[l], l) === 0, 'culprit.why: «I don’t know» names no clue');
        for (const k of ['right', 'wrong']) (cu[k] || []).forEach((x, i) => ok(x.en && V0[x.who], `culprit.${k}.${i}: English and a show voice`));
      }
      if (isCJ(l)) check([l]).forEach(x => fails.push(`CJK ${x.where}: ${x.p.join('; ')}`));
    } catch (e) { fails.push('threw: ' + ((e && e.stack) || e)); }
    finally { if (typeof LEX !== 'undefined') LEX.lang = was; }
    return { lang: l, ok: !fails.length, fails, counts };
  }

  return {
    add, content, on, aired, menu, play, guess, S, init, journal, strings, check, tests, PIN,
    _: { C, T, frame, guessCard, rerunMenu, needGuess, quest, PROVIDER },
  };
})();
