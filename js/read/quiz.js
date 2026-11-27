'use strict';
// QUIZ: Radio Alba's weekly quiz show (DESIGN.md 21.2 D, the listening half of the tests hidden in the world; D1).
// One original show per language with two hosts, on the radios that are already there (the inn's terrace, the library):
// radio.js lists it first in "what's on?" through RADIO.extra. An episode is the hosts' opener, one segment at natural speed
// (a call-in, news and weather, a story, an interview, an ad break, a lost-and-found), then the quiz: multiple choice,
// true / false / not said, a short answer judged by its content, a who-said-what match. Graded with EXAM's pure graders
// (EXAM.grade.item) and logged per item the way EXAM's parts are: DICT.log('listen', band, score), or 'read' once you've
// shown the words or the computer has no voice for the language.
//   • The schedule: from Rosa's welcome a new week airs every 20 minutes of play and on each story step (a bell, a freed
//     world); up to three wait. A week offers an episode at your level and a bonus round one band up. Reruns are practice:
//     logged, no prizes. Nothing here ever blocks the story.
//   • Prizes: 2 coins a right answer (3 in the bonus round), a sticker for a perfect score (the show's album, on the journal's
//     Reading page), and the regular-listener streak (it starts over only when a third week piles up): the hosts greet you
//     at 3, 5 and 10 weeks, and Mimo gets the show's headphones at 5 and a golden microphone pin at 10 (TALK.cosmetic).
//   QUIZ.add(lang, { show, episodes })   quiz_<lang>.js (the authoring shape is at the top of quiz_es.js)
//   QUIZ.on() · started() · band() · week() · menu(where) · play(ep, o) → Promise<result> · S() · content(lang)
//   QUIZ.init(game) · outdoor(dt) (READ.update) · journal (READ.more) · mapMarks()
//   QUIZ.UI (the #qz overlay: open, close, keys, face, sticker; club.js shares it) · QUIZ.ITEMS (the items view) · QUIZ._ (tests)
// State: G.state.read.quiz (saved with the game).

const QUIZ = (() => {
  let G = null;
  const L = () => READ.lang;
  const isCJ = l => l === 'zh' || l === 'ja';
  const cj = () => isCJ(L()) && typeof CJK !== 'undefined';
  const esc = READ.esc, fill = READ.fill;
  const H = s => READ.html(s), P = s => READ.plain(s);
  const tapWords = s => (typeof READER !== 'undefined' && READER.wordsHTML ? READER.wordsHTML(s) : H(s));      // (the transcript's words, tappable: reader.js)
  const WEEK_S = 1200, QMAX = 3, PLAYS = 2;
  const LANGNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  const snd = k => { try { if (typeof Sound !== 'undefined') Sound.play(k); } catch (e) { /* */ } };
  const toast = t => { try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(t); } catch (e) { /* */ } };
  const T = { auto: null, hold: false, fast: false, mute: false, last: null };          // tests: answer for you, keep the results open, no speech

  // ------------------------------------------------------------ content: QUIZ.add(lang, { show, episodes })
  const C = {};
  function add(lang, def = {}) {
    const o = C[lang] || (C[lang] = { show: null, episodes: [] });
    if (def.show) o.show = Object.assign(o.show || {}, def.show);
    for (const ep of def.episodes || []) {
      ep.lang = lang;
      const i = o.episodes.findIndex(x => x.id === ep.id);
      if (i >= 0) o.episodes[i] = ep; else o.episodes.push(ep);
    }
    if (isCJ(lang) && typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(strings(lang).map(x => x.s)); } catch (e) { /* (the IME learns them later) */ } }
    return o;
  }
  const content = (l = L()) => C[l] || null;
  const show = () => (content() || {}).show || null;
  function on() { const c = content(); return !!(c && c.show && c.episodes.length && READ.on('radio')); }
  function started() { const f = G && G.state && G.state.flags; return !!(f && f.hatched && f.rosa && on()); }

  // ------------------------------------------------------------ the save: G.state.read.quiz
  // { aired (weeks on the air so far), heard (weeks you've listened to), at / st (play time and story steps at the last airing),
  //   streak, best, n (episodes answered), coins, eps: { id: { n, best, max, at, skill } }, stickers: [ids], greet: { n: t }, told }
  function S() {
    const r = READ.S(), o = r.quiz || (r.quiz = {});
    o.v = 1; o.aired = o.aired || 0; o.heard = o.heard || 0; o.streak = o.streak || 0; o.best = o.best || 0; o.n = o.n || 0; o.coins = o.coins || 0;
    o.eps = o.eps || {}; o.stickers = o.stickers || []; o.greet = o.greet || {};
    return o;
  }
  const waiting = () => { const s = S(); return Math.max(0, s.aired - s.heard); };

  // ------------------------------------------------------------ the schedule: a week every 20 minutes of play, or a story step
  // (story steps: the bells, the big Hushling on the hill, and every world freed in Chapter 4)
  function steps() {
    if (!G || !G.state) return 0;
    const f = G.state.flags || {}; let n = (f.bells || 0) + (f.boss ? 1 : 0);
    try { const wf = (G.state.worlds && G.state.worlds.flags) || {}; for (const w of ['past', 'future']) for (const [k, v] of Object.entries(wf[w] || {})) if (v === true && /Free$/.test(k)) n++; } catch (e) { /* */ }
    return n;
  }
  let tickT = 1.5, pending = false;
  function outdoor(dt) {
    if (!G || !G.state || (tickT -= dt || 0) > 0) return;
    tickT = 2;
    if (!started()) return;
    const s = S(), now = G.state.time || 0, st = steps();
    if (s.at == null) { s.at = now; s.st = st; }
    if (!s.aired) air(s, now, st);
    else if (waiting() >= QMAX) { s.at = now; s.st = st; }                    // (three are waiting: the clock waits too)
    else if (now - s.at >= WEEK_S || st > (s.st || 0)) air(s, now, st);
    // (the weekly nudge says nothing about where you are, and stays out of the Past and the Future; the first-time hint about
    // the inn's terrace only comes when you're outdoors in today's Alba, near that terrace)
    if (pending && free() && nowWorld()) { pending = false; announce(); }
    if (!s.told && free() && nowWorld() && nearTerrace()) {
      s.told = 1; READ.save();
      try { STORY.think(`Music from the inn’s terrace… Radio Alba has a quiz show: «${P(show().title)}». Listen, answer, win prizes!`, 5); } catch (e) { /* */ }
    }
  }
  const nowWorld = () => { try { return typeof TIME === 'undefined' || !TIME.world || TIME.world() === 'now'; } catch (e) { return true; } };
  function nearTerrace() {
    if (!G || !G.sim || !G.sim.you || (G.indoors && G.indoors()) || typeof RADIO === 'undefined' || !RADIO.SPOT) return false;
    const Y = G.sim.you, town = G.town && G.town.group;
    return (!town || town.visible) && Math.hypot(RADIO.SPOT.x - Y.x, RADIO.SPOT.z - Y.z) < 22;
  }
  function air(s, now, st) {
    if (waiting() >= QMAX - 1) s.streak = 0;                                  // (a third week piling up: the streak starts over)
    s.aired++; s.at = now; s.st = st;
    pending = true;
    READ.save();
  }
  function announce() {
    const sh = show(); if (!sh) return;
    toast(`📻 Radio Alba: a new week of «${P(sh.title)}» is on the air`);
  }
  // free: no scene, panel, fight or menu is up (the toast waits until then)
  function free() {
    if (!G || typeof document === 'undefined') return false;
    if (typeof STORY !== 'undefined' && (STORY.busy || STORY.line)) return false;
    if (/(^|\s)(in-battle|on-title)(\s|$)/.test(document.body.className)) return false;
    if (G.journalOpen || (G.sim && G.sim.lock)) return false;
    if ((typeof READER !== 'undefined' && READER.isOpen) || openN) return false;
    if (typeof FIN !== 'undefined' && FIN.quiet && FIN.quiet()) return false;            // (the final act's places: it waits until you're out)
    return true;
  }
  function nextMin() { const s = S(); return Math.max(1, Math.ceil((WEEK_S - (((G && G.state.time) || 0) - (s.at || 0))) / 60)); }

  // ------------------------------------------------------------ which episodes: this week's at your level, a bonus round one up
  function band() { let b = 1; try { b = DICT.bands().overall | 0; } catch (e) { /* */ } return Math.max(1, Math.min(4, b)); }
  const list = b => ((content() || {}).episodes || []).filter(e => (b == null || e.band === b) && READ.when(e.when));
  const fresh = b => list(b).filter(e => !S().eps[e.id]);
  function week() {
    const b = band(), up = Math.min(4, b + 1), main = fresh(b)[0] || null;
    return { b, up, main, bonus: fresh(up).find(e => e !== main) || null };
  }
  // a rerun: the one you heard longest ago (at your band or one up, else any)
  function rerunPick() {
    const s = S(), b = band(), heard = list().filter(e => s.eps[e.id]);
    const near = heard.filter(e => e.band === b || e.band === b + 1);
    const pool = near.length ? near : heard.length ? heard : list(b);
    return pool.slice().sort((x, y) => ((s.eps[x.id] || {}).at || 0) - ((s.eps[y.id] || {}).at || 0))[0] || null;
  }
  const KIND = { lost: '🔎', weather: '⛅', news: '📰', callin: '☎', story: '📖', interview: '🎙', ad: '📣', recipe: '🍲', postcard: '✉', debate: '⚖', essay: '💭', game: '🎲' };
  // the radio's "what's on?" (radio.js RADIO.extra): { label, sub, run }
  function menu(where) {
    if (!started()) return [];
    const sh = show(), name = `«${P(sh.title)}»`, s = S(), q = waiting(), out = [];
    if (q > 0) {
      // (a week is one prize play: this week's episode or the bonus round. With both on offer, the menu says so plainly)
      const w = week(), both = !!(w.main && w.bonus), pick = both ? ' · pick one' : '';
      if (w.main) out.push({ label: `🏆 ${name} · this week (${READ.BAND(w.main.band)}) · NEW${pick}`, sub: `${w.main.en || ''}: listen, answer, win coins${both ? ' · one prize play a week: this or the bonus round' : ''}${q > 1 ? ` · ${q} weeks waiting` : ''}`, run: () => play(w.main, { prize: true }) });
      if (w.bonus) out.push({ label: `🏆 ${name} · bonus round (${READ.BAND(w.bonus.band)})${pick}`, sub: `${w.bonus.en || ''}: a level up, 3 coins a right answer${both ? ' · instead of this week’s episode' : ''}`, run: () => play(w.bonus, { prize: true, bonus: true }) });
      if (!w.main && !w.bonus) { const r = rerunPick(); if (r) out.push({ label: `🏆 ${name} · this week: a rerun`, sub: `${r.en || ''}: you’ve heard every new one at your level (no prizes; it keeps your streak)`, run: () => play(r, { week: true }) }); }
    }
    const heard = list().filter(e => s.eps[e.id]).length;
    if (heard || q === 0) out.push({ label: `🏆 ${name} · ${q > 0 ? 'earlier episodes' : `next week in about ${nextMin()} min`}`, sub: 'Hear an episode again: practice, no prizes', run: () => practiceMenu() });
    return out;
  }
  async function practiceMenu() {
    const s = S(), b = band();
    const pool = list().filter(e => s.eps[e.id] || e.band < b);
    if (!pool.length) { toast('Nothing to hear again yet: listen to this week’s episode first.'); return null; }
    const was = G.sim.lock; G.sim.lock = 1; let ep = null;
    try {
      ep = await UI.choose(`«${P(show().title)}»: hear one again (practice)`, pool.map(e => ({ label: `${KIND[e.kind] || '📻'} ${P(e.title)} · ${READ.BAND(e.band)}`,
        sub: `${e.en || ''}${s.eps[e.id] ? ` · best ${s.eps[e.id].best}/${s.eps[e.id].max}` : ''}`, value: e })));
    } finally { G.sim.lock = was; }
    return ep ? play(ep, { practice: true }) : null;
  }

  // ------------------------------------------------------------ the overlay #qz (the quiz and the book club share it)
  const INK = '#2b2235';
  const CSS = `
#qz { position: fixed; inset: 0; z-index: 12; display: grid; place-items: center; color: ${INK}; font-family: "Segoe UI", system-ui, sans-serif; }
#qz.hidden, #qz .hidden { display: none !important; }
#qz * { box-sizing: border-box; }
#qz .qz-shade { position: absolute; inset: 0; background: rgba(20,18,30,.45); }
#qz .qz-card { position: relative; width: min(1060px, calc(100vw - 20px)); height: min(700px, calc(100vh - 24px)); display: flex; flex-direction: column; background: #fbf6e7;
  border: 3px solid ${INK}; border-radius: 18px; box-shadow: 0 0 0 6px #fff, 0 14px 0 6px rgba(43,34,53,.25); overflow: hidden; }
#qz .qz-top { display: flex; align-items: center; gap: 12px; padding: 7px 12px 7px 10px; flex: none; color: #fff3d6; background: linear-gradient(180deg, #6b4428, #4a2e1a); border-bottom: 4px solid #c9a24a; }
#qz.club .qz-top { background: linear-gradient(180deg, #2f5a4a, #1f3f33); }
#qz .qz-logo { width: 104px; height: 64px; flex: none; }
#qz .qz-ttl { display: flex; flex-direction: column; min-width: 0; flex: 1; }
#qz .qz-ttl b { font: 900 23px Bahnschrift, "Segoe UI", sans-serif; letter-spacing: .02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#qz .qz-ttl small { font-size: 13px; opacity: .9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } #qz .qz-ttl small .en { opacity: .75; font-style: italic; }
#qz .qz-chip { font: 800 11px Bahnschrift, "Segoe UI", sans-serif; border-radius: 99px; padding: 2px 8px; background: #fff3d6; color: #4a2e1a; margin-left: 4px; white-space: nowrap; font-style: normal; }
#qz .qz-chip.new { background: #e6a92e; color: ${INK}; } #qz .qz-chip.prac { background: #8a8494; color: #fff; } #qz .qz-chip.bonus { background: #d6453a; color: #fff; }
#qz .qz-x { border: 0; background: transparent; color: inherit; font-size: 22px; font-weight: 800; opacity: .75; cursor: pointer; padding: 0 4px; } #qz .qz-x:hover { opacity: 1; }
#qz .qz-body { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(300px, .92fr) 1.08fr; }
#qz .qz-side { border-right: 2px dashed rgba(43,34,53,.18); padding: 12px 14px; overflow: auto; background: #f4ecd6; }
#qz .qz-main { padding: 12px 16px; overflow: auto; }
#qz .qz-air { display: flex; align-items: center; gap: 8px; font: 900 13px Bahnschrift, sans-serif; letter-spacing: .12em; }
#qz .qz-air .lamp { width: 14px; height: 14px; border-radius: 50%; background: #7a2a22; box-shadow: inset 0 0 0 2px rgba(0,0,0,.25); }
#qz .qz-air.on .lamp { background: #ff4a3a; box-shadow: 0 0 12px 3px rgba(255,74,58,.6); animation: qzpulse 1s ease-in-out infinite; }
@keyframes qzpulse { 50% { opacity: .55; } }
#qz .qz-now { margin-left: auto; font: 700 13px "Segoe UI", sans-serif; letter-spacing: 0; color: #9a3a22; }
#qz .qz-cast { display: flex; flex-wrap: wrap; gap: 8px 6px; margin: 10px 0 6px; }
#qz .qz-who { display: flex; flex-direction: column; align-items: center; width: 84px; text-align: center; }
#qz .qz-who canvas { width: 62px; height: 62px; border-radius: 50%; border: 3px solid transparent; transition: transform .15s; }
#qz .qz-who.talk canvas { border-color: #ff4a3a; transform: scale(1.08); }
#qz .qz-who span { font: 800 12px/1.15 "Segoe UI", sans-serif; margin-top: 2px; } #qz .qz-who small { font-size: 11px; opacity: .65; }
#qz .qz-ctl { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; margin: 6px 0; }
#qz .qz-left { font: 700 12px "Segoe UI", sans-serif; opacity: .65; }
#qz .qz-btn { border: 2.5px solid ${INK}; border-radius: 10px; background: #fffaf0; font: 800 14px "Segoe UI", sans-serif; padding: 5px 12px; cursor: pointer; color: ${INK}; box-shadow: 0 3px 0 rgba(43,34,53,.16); }
#qz .qz-btn:hover { background: #fff3c4; } #qz .qz-btn.main { background: ${INK}; color: #fffaf0; } #qz .qz-btn.main:hover { background: #3d3350; }
#qz .qz-btn.on { background: #21a493; border-color: #21a493; color: #fff; } #qz .qz-btn[disabled] { opacity: .35; cursor: default; }
#qz .qz-note { font-size: 13px; opacity: .8; min-height: 18px; margin: 4px 0; } #qz .qz-note.warn { color: #9a3a22; font-weight: 700; opacity: 1; }
#qz .qz-radioart { display: block; width: 100%; max-width: 330px; height: auto; margin: 16px auto 0; }
#qz .qz-air.on ~ .qz-radioart, #qz .qz-side:has(.qz-air.on) .qz-radioart { animation: qzbob .5s ease-in-out infinite alternate; }
@keyframes qzbob { from { transform: translateY(0) rotate(-.6deg); } to { transform: translateY(-3px) rotate(.6deg); } }
#qz .qz-script { margin-top: 8px; background: #fffdf6; border: 2px solid rgba(43,34,53,.14); border-radius: 12px; padding: 8px 10px; font: 16px/1.5 Georgia, serif; }
#qz .qz-script.en-on .en { display: block; }
#qz .qz-l { margin: 0 0 5px; border-radius: 6px; } #qz .qz-l.frame { opacity: .62; }
#qz .qz-l .who { font: 800 11px "Segoe UI", sans-serif; letter-spacing: .05em; text-transform: uppercase; margin-right: 6px; color: #7a2a3d; }
#qz .qz-l .en { display: none; font: italic 13px/1.35 "Segoe UI", sans-serif; opacity: .72; }
#qz .qz-l.lit { background: #fff0a0; box-shadow: 0 0 0 3px #fff0a0; } #qz .qz-l.ev { background: #d9f0ea; box-shadow: 0 0 0 3px #d9f0ea; }
#qz .qz-sb { border: 0; background: transparent; font-size: 12px; opacity: .35; cursor: pointer; padding: 0 2px; } #qz .qz-sb:hover { opacity: 1; }
#qz .qz-h { font: 800 12px "Segoe UI", sans-serif; letter-spacing: .06em; text-transform: uppercase; opacity: .6; margin: 2px 0 8px; }
#qz .qz-q { background: #fff; border: 2px solid rgba(43,34,53,.13); border-radius: 13px; padding: 9px 12px; margin-bottom: 9px; }
#qz .qz-q .qn { display: inline-block; min-width: 22px; height: 22px; border-radius: 50%; background: ${INK}; color: #fffaf0; font: 800 12px/22px Bahnschrift, sans-serif; text-align: center; margin-right: 7px; }
#qz .qz-q .qt { font-size: 18px; font-weight: 600; } #qz .qz-q .qen, #qz .qz-q .oen { font-size: 13px; font-style: italic; opacity: .72; font-weight: 500; }
#qz .qz-mini { border: 1.5px solid ${INK}; border-radius: 7px; background: transparent; font-size: 11px; font-weight: 800; padding: 0 6px; margin-left: 5px; vertical-align: 2px; cursor: pointer; color: ${INK}; }
#qz .qz-mini.on { background: #fff3c4; }
#qz .qz-opts { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 7px; }
#qz .qz-opt { border: 2px solid rgba(43,34,53,.3); border-radius: 10px; background: #fffaf0; padding: 5px 11px; font: 600 16px "Segoe UI", sans-serif; cursor: pointer; display: inline-flex; flex-direction: column; align-items: flex-start; color: ${INK}; text-align: left; }
#qz .qz-opt:hover { border-color: ${INK}; } #qz .qz-opt.on { background: ${INK}; border-color: ${INK}; color: #fbf6e7; }
#qz .qz-opt .lt { font: 900 11px Bahnschrift, sans-serif; opacity: .55; }
#qz .qz-opt.right { background: #21a493; border-color: #21a493; color: #fff; } #qz .qz-opt.wrong { background: #c2412f; border-color: #c2412f; color: #fff; text-decoration: line-through; }
#qz .qz-sh, #qz .qz-say { width: 100%; margin-top: 7px; font: 600 18px "Segoe UI", sans-serif; padding: 5px 10px; border: 2.5px solid rgba(43,34,53,.35); border-radius: 10px; outline: none; background: #fffef9; }
#qz .qz-sh:focus, #qz .qz-say:focus { border-color: ${INK}; box-shadow: 0 0 0 3px rgba(33,164,147,.25); }
#qz .qz-mrow { display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; } #qz .qz-mrow .l { flex: 1 1 170px; font-weight: 600; } #qz .qz-mrow .qz-opts { margin-top: 0; }
#qz .qz-legend { font-size: 14px; margin-top: 6px; line-height: 1.5; }
#qz .qz-res { margin-top: 6px; font-size: 14px; } #qz .qz-res.ok { color: #13786b; font-weight: 700; } #qz .qz-res.no { color: #9a3a22; }
#qz .qz-q.ok { border-color: #21a493; } #qz .qz-q.no { border-color: #c2412f; }
#qz .qz-foot { flex: none; display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-top: 2px dashed rgba(43,34,53,.2); background: #f7efdc; }
#qz .qz-foot .sp { flex: 1; } #qz .qz-foot .nt { font-size: 13px; opacity: .85; }
#qz .qz-prize { display: flex; flex-wrap: wrap; gap: 8px 14px; align-items: center; background: #fff8e0; border: 2.5px solid #e6a92e; border-radius: 14px; padding: 10px 12px; margin: 2px 0 10px; }
#qz .qz-prize .big { font: 900 24px Bahnschrift, sans-serif; } #qz .qz-prize .it { font: 700 15px "Segoe UI", sans-serif; }
#qz .qz-prize canvas { width: 92px; height: 92px; } #qz .qz-prize figure { margin: 0; display: flex; align-items: center; gap: 8px; }
#qz .qz-bub { display: flex; gap: 8px; align-items: flex-start; margin: 8px 0; } #qz .qz-bub canvas { width: 44px; height: 44px; flex: none; border-radius: 50%; }
#qz .qz-bub.me { flex-direction: row-reverse; } #qz .qz-bub.me .b { background: #e8f6f2; }
#qz .qz-bub .b { background: #fff; border: 2px solid rgba(43,34,53,.15); border-radius: 14px; padding: 7px 11px; font-size: 17px; line-height: 1.4; max-width: 92%; }
#qz .qz-bub .b .en { display: block; font-size: 13px; font-style: italic; opacity: .72; }
#qz .qz-bub .who { display: block; font: 800 11px "Segoe UI", sans-serif; letter-spacing: .05em; text-transform: uppercase; color: #7a2a3d; }
#qz .qz-grade { display: inline-block; font: 900 14px Bahnschrift, "Segoe UI", sans-serif; border-radius: 6px; padding: 0 7px; color: #fff; margin-right: 6px; font-style: normal; }
#qz .qz-gs { background: #e6a92e; } #qz .qz-ga { background: #21a493; } #qz .qz-gb { background: #3f7fd1; } #qz .qz-gc { background: #8a5ab0; } #qz .qz-gd { background: #8a8494; }
#qz .qz-fix mark { background: none; color: #c2412f; font-weight: 800; border-bottom: 2px solid #c2412f; }
#qz .qz-tip { font-size: 13px; opacity: .85; margin-top: 3px; }
#qz .qz-cover { display: flex; gap: 12px; align-items: center; margin: 4px 0 10px; } #qz .qz-cover canvas { width: 78px; height: 108px; border-radius: 3px 7px 7px 3px; box-shadow: 3px 4px 0 rgba(43,34,53,.25); }
#qz .qz-cover b { font: 800 19px Georgia, serif; display: block; } #qz .qz-cover small { opacity: .7; }
@media (max-width: 760px) { #qz .qz-body { grid-template-columns: 1fr; overflow: auto; } #qz .qz-side { border-right: 0; border-bottom: 2px dashed rgba(43,34,53,.18); overflow: visible; } #qz .qz-main { overflow: visible; } #qz .qz-card { height: calc(100vh - 16px); } }
.qz-j { margin: 2px 0 10px; } .qz-j .row { font-size: 14px; margin: 3px 0; } .qz-j .row b { font-weight: 800; }
.qz-album { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0; } .qz-album figure { margin: 0; width: 84px; text-align: center; } .qz-album canvas { width: 70px; height: 70px; }
.qz-album figcaption { font-size: 11px; line-height: 1.2; } .qz-album figure.miss { opacity: .45; }
.qz-stamps { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0; } .qz-stamps figure { margin: 0; width: 70px; text-align: center; font-size: 11px; line-height: 1.2; }
.qz-stamps canvas { width: 46px; height: 64px; border-radius: 2px 5px 5px 2px; box-shadow: 2px 3px 0 rgba(43,34,53,.2); }
`;
  function css() { if (document.getElementById('qz-css')) return; const s = document.createElement('style'); s.id = 'qz-css'; s.textContent = CSS; document.head.appendChild(s); }
  let root = null, openN = 0, keyFn = null, typingWas = false, lockWas = 0;
  function ensure() { css(); if (!root) { root = document.createElement('div'); root.id = 'qz'; root.className = 'hidden'; document.body.appendChild(root); } return root; }
  function open(theme) {
    ensure();
    if (!openN++) {
      typingWas = typeof Input !== 'undefined' ? Input.typing : false;
      if (typeof Input !== 'undefined') Input.typing = true;                    // (the game's keys sleep while the panel is up)
      if (G && G.sim) { lockWas = G.sim.lock || 0; G.sim.lock = 1; }
      document.body.classList.add('qz-open');
    }
    root.className = theme || ''; root.innerHTML = '';
    return root;
  }
  function close() {
    try { if (typeof SPEECH !== 'undefined') SPEECH.stop(); } catch (e) { /* */ }
    try { if (typeof READER !== 'undefined' && READER.glossOpen) READER.hideGloss(); } catch (e) { /* */ }
    if (!root || openN <= 0) return;
    if (!--openN) {
      root.className = 'hidden'; root.innerHTML = '';
      if (typeof Input !== 'undefined') Input.typing = !!typingWas;
      if (G && G.sim) G.sim.lock = lockWas;
      document.body.classList.remove('qz-open'); keys(null);
    }
  }
  function keys(fn) {
    if (keyFn) removeEventListener('keydown', keyFn, true);
    keyFn = fn ? e => {
      const inBox = e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if (inBox && e.code !== 'Escape') return;                              // (typing: the box gets every key but Esc)
      if (fn(e) !== false) { e.preventDefault(); e.stopPropagation(); }
    } : null;
    if (keyFn) addEventListener('keydown', keyFn, true);
  }
  // a face for a canvas (talk_ui.js's paper-cutout portraits); 'mimo' is Mimo's own
  function face(cv, look, mood) {
    if (!cv) return;
    try {
      if (look === 'mimo') { if (typeof TALKUI !== 'undefined' && TALKUI.mimoFace) TALKUI.mimoFace(cv); return; }
      if (typeof TALKUI !== 'undefined' && TALKUI.face) TALKUI.face(cv, look || {}, mood || null);
    } catch (e) { /* (no face: an empty circle) */ }
  }

  // ------------------------------------------------------------ drawings: the show's logo, the stickers (the game's one ink line)
  function logo(cv, kind) {
    if (!cv || !cv.getContext) return;
    const c = cv.getContext('2d'), w = cv.width, h = cv.height;
    c.clearRect(0, 0, w, h); c.lineJoin = 'round'; c.lineCap = 'round';
    const rr = (x, y, ww, hh, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + ww, y, x + ww, y + hh, r); c.arcTo(x + ww, y + hh, x, y + hh, r); c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + ww, y, r); c.closePath(); };
    if (kind === 'club') {
      rr(4, 4, w - 8, h - 8, 12); c.fillStyle = '#fbf3dc'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#c9a24a'; c.stroke();
      c.save(); c.translate(w / 2, h / 2 + 2); const s = h * 0.36;
      c.beginPath(); c.moveTo(0, -s * 0.45); c.quadraticCurveTo(-s * 0.6, -s * 0.8, -s * 1.3, -s * 0.6); c.lineTo(-s * 1.3, s * 0.7); c.quadraticCurveTo(-s * 0.6, s * 0.5, 0, s * 0.85); c.quadraticCurveTo(s * 0.6, s * 0.5, s * 1.3, s * 0.7); c.lineTo(s * 1.3, -s * 0.6); c.quadraticCurveTo(s * 0.6, -s * 0.8, 0, -s * 0.45); c.closePath();
      c.fillStyle = '#fffaf0'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(0, -s * 0.45); c.lineTo(0, s * 0.85); c.stroke();
      c.strokeStyle = '#21a493'; c.lineWidth = 2.4; for (const y of [-0.2, 0.1, 0.4]) { c.beginPath(); c.moveTo(-s * 1.05, y * s); c.lineTo(-s * 0.2, y * s + 3); c.moveTo(s * 0.2, y * s + 3); c.lineTo(s * 1.05, y * s); c.stroke(); }
      c.fillStyle = '#c2412f'; c.beginPath(); c.moveTo(s * 0.5, -s * 0.72); c.lineTo(s * 0.75, -s * 0.72); c.lineTo(s * 0.75, -s * 0.05); c.lineTo(s * 0.62, -s * 0.2); c.lineTo(s * 0.5, -s * 0.05); c.closePath(); c.fill();
      c.restore(); return;
    }
    rr(4, 4, w - 8, h - 8, 12); const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffd77a'); g.addColorStop(1, '#e6a92e'); c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    // a ribbon microphone with sound waves either side
    const cx = w / 2, cy = h / 2 - 3, s = h * 0.3;
    c.fillStyle = '#4a2e1a'; c.beginPath(); c.ellipse(cx, cy, s * 0.55, s * 0.8, 0, 0, Math.PI * 2); c.fill(); c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = '#c9a24a'; c.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(cx - s * 0.45, cy + i * s * 0.25); c.lineTo(cx + s * 0.45, cy + i * s * 0.25); c.stroke(); }
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy + s * 0.8); c.lineTo(cx, cy + s * 1.35); c.moveTo(cx - s * 0.5, cy + s * 1.38); c.lineTo(cx + s * 0.5, cy + s * 1.38); c.stroke();
    c.lineWidth = 3; for (const k of [-1, 1]) for (const r of [0.95, 1.4]) { c.beginPath(); c.arc(cx, cy, s * r, k < 0 ? Math.PI * 0.78 : -Math.PI * 0.22, k < 0 ? Math.PI * 1.22 : Math.PI * 0.22); c.stroke(); }
    c.fillStyle = '#fff3d6'; for (const [x, y] of [[w * 0.14, h * 0.25], [w * 0.86, h * 0.72]]) { c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 2.2 : 6; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); }
  }
  // the studio's radio (the side column while the words are hidden): a wooden cabinet, a cloth grille, the dial, two knobs, the
  // show's name on a brass plate
  function radioArt(cv, title) {
    if (!cv || !cv.getContext) return;
    const c = cv.getContext('2d'), w = cv.width, h = cv.height; c.clearRect(0, 0, w, h); c.lineJoin = 'round'; c.lineCap = 'round';
    const rr = (x, y, ww, hh, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + ww, y, x + ww, y + hh, r); c.arcTo(x + ww, y + hh, x, y + hh, r); c.arcTo(x, y + hh, x, y, r); c.arcTo(x, y, x + ww, y, r); c.closePath(); };
    const x0 = 24, y0 = 26, W = w - 48, Hh = h - 52;
    c.fillStyle = 'rgba(43,34,53,.15)'; c.beginPath(); c.ellipse(w / 2, y0 + Hh + 14, W * 0.46, 9, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8a5a32'; c.strokeStyle = INK; c.lineWidth = 5;
    c.beginPath(); c.moveTo(x0, y0 + Hh); c.lineTo(x0, y0 + 56); c.quadraticCurveTo(x0, y0, x0 + 70, y0); c.lineTo(x0 + W - 70, y0); c.quadraticCurveTo(x0 + W, y0, x0 + W, y0 + 56); c.lineTo(x0 + W, y0 + Hh); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(43,34,53,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 10, y0 + 60); c.quadraticCurveTo(x0 + 12, y0 + 14, x0 + 72, y0 + 12); c.stroke();
    const gx = x0 + 22, gy = y0 + 26, gw = W * 0.54, gh = Hh - 52;
    c.fillStyle = '#e9dcb8'; rr(gx, gy, gw, gh, 14); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
    c.save(); rr(gx, gy, gw, gh, 14); c.clip(); c.strokeStyle = 'rgba(90,60,30,.28)'; c.lineWidth = 2;
    for (let x = gx; x < gx + gw; x += 7) { c.beginPath(); c.moveTo(x, gy); c.lineTo(x, gy + gh); c.stroke(); }
    for (let y = gy; y < gy + gh; y += 7) { c.beginPath(); c.moveTo(gx, y); c.lineTo(gx + gw, y); c.stroke(); }
    c.strokeStyle = '#6b4a2e'; c.lineWidth = 6; for (const r of [0.34, 0.22]) { c.beginPath(); c.arc(gx + gw / 2, gy + gh / 2, gh * r * 1.4, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); }
    c.restore();
    const dx = x0 + W * 0.64, dw = W * 0.29;
    c.fillStyle = '#f6e7b4'; rr(dx, gy, dw, 44, 8); c.fill(); c.lineWidth = 3.5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#5a3a22'; c.font = '700 11px "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    [88, 96, 104].forEach((f, i) => c.fillText(String(f), dx + 14 + i * (dw - 28) / 2, gy + 14));
    for (let i = 0; i <= 12; i++) c.fillRect(dx + 8 + i * (dw - 16) / 12, gy + 26, 1.6, i % 3 ? 6 : 11);
    c.fillStyle = '#c2412f'; c.fillRect(dx + 8 + (dw - 16) * 0.53, gy + 20, 3, 22);
    for (const k of [0, 1]) { const kx = dx + dw * (0.25 + k * 0.5), ky = gy + 82; c.fillStyle = '#3a2a22'; c.beginPath(); c.arc(kx, ky, 15, 0, Math.PI * 2); c.fill(); c.lineWidth = 3; c.stroke(); c.strokeStyle = '#c9a24a'; c.beginPath(); c.moveTo(kx, ky); c.lineTo(kx + 9 * Math.cos(k ? 0.6 : -2.2), ky + 9 * Math.sin(k ? 0.6 : -2.2)); c.stroke(); c.strokeStyle = INK; }
    const px = dx - 4, py = gy + gh - 34, pw = dw + 8;
    c.fillStyle = '#d9b24a'; rr(px, py, pw, 30, 6); c.fill(); c.lineWidth = 3; c.stroke();
    c.fillStyle = '#4a2e1a'; let fs = 15; c.font = `900 ${fs}px Bahnschrift, "Segoe UI", "Microsoft YaHei", sans-serif`; const t = String(title || ''); while (fs > 8 && c.measureText(t).width > pw - 10) { fs--; c.font = `900 ${fs}px Bahnschrift, "Segoe UI", "Microsoft YaHei", sans-serif`; } c.fillText(t, px + pw / 2, py + 16);
    c.fillStyle = '#5a3a22'; for (const fx of [x0 + 26, x0 + W - 46]) { c.fillRect(fx, y0 + Hh - 2, 20, 10); c.strokeRect(fx, y0 + Hh - 2, 20, 10); }
    c.strokeStyle = '#c9c9c9'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0 + W - 40, y0 + 4); c.lineTo(x0 + W - 4, y0 - 22); c.stroke(); c.fillStyle = '#c9c9c9'; c.beginPath(); c.arc(x0 + W - 4, y0 - 22, 4, 0, Math.PI * 2); c.fill();
  }
  // a sticker (the show's album): a white die-cut edge, then the drawing. got = false: a dashed outline with a "?"
  const STICKERS = ['ear', 'radio', 'mic', 'phones', 'trophy', 'note', 'star', 'mimo'];
  function sticker(cv, id, got = true) {
    if (!cv || !cv.getContext) return;
    const c = cv.getContext('2d'), W = cv.width, s = W / 100;
    c.clearRect(0, 0, W, cv.height); c.save(); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round';
    if (!got) { c.setLineDash([6, 5]); c.lineWidth = 3; c.strokeStyle = 'rgba(43,34,53,.45)'; c.beginPath(); c.arc(50, 50, 42, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); c.fillStyle = 'rgba(43,34,53,.4)'; c.font = '900 34px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', 50, 52); c.restore(); return; }
    c.translate(50, 50); c.rotate(((STICKERS.indexOf(id) % 3) - 1) * 0.08); c.translate(-50, -50);
    const sh = (fill, draw, lw = 3) => { c.beginPath(); draw(); if (fill) { c.fillStyle = fill; c.fill(); } c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); };
    // the die-cut edge
    c.save(); c.shadowColor = 'rgba(43,34,53,.25)'; c.shadowOffsetY = 3; c.beginPath(); c.arc(50, 50, 44, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); c.restore();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(43,34,53,.25)'; c.beginPath(); c.arc(50, 50, 44, 0, Math.PI * 2); c.stroke();
    if (id === 'ear') {
      sh('#f2c14e', () => { c.moveTo(56, 22); c.bezierCurveTo(30, 18, 26, 48, 36, 58); c.bezierCurveTo(44, 66, 38, 78, 50, 80); c.bezierCurveTo(62, 82, 64, 70, 66, 62); c.bezierCurveTo(78, 44, 74, 24, 56, 22); c.closePath(); });
      c.lineWidth = 3; c.beginPath(); c.moveTo(58, 34); c.bezierCurveTo(46, 32, 44, 46, 52, 50); c.bezierCurveTo(58, 54, 54, 62, 50, 62); c.stroke();
      c.fillStyle = '#fff3a0'; for (const [x, y] of [[24, 30], [78, 70], [80, 30]]) { c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 2 : 6; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); }
    } else if (id === 'radio') {
      sh('#a8784e', () => c.rect(20, 34, 60, 40)); sh('#e6d6b0', () => c.arc(38, 54, 11, 0, Math.PI * 2), 2.4); sh('#f6e7b4', () => c.rect(54, 44, 20, 9), 2.2);
      sh('#3a2a22', () => c.arc(58, 64, 4, 0, Math.PI * 2), 2); sh('#3a2a22', () => c.arc(70, 64, 4, 0, Math.PI * 2), 2);
      c.lineWidth = 2.6; c.beginPath(); c.moveTo(66, 34); c.lineTo(80, 16); c.stroke(); sh('#c2412f', () => c.arc(80, 16, 3, 0, Math.PI * 2), 2);
    } else if (id === 'mic') {
      sh('#9aa3b5', () => c.ellipse(50, 38, 13, 18, 0, 0, Math.PI * 2)); c.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(39, 38 + i * 6); c.lineTo(61, 38 + i * 6); c.stroke(); }
      c.lineWidth = 3; c.beginPath(); c.arc(50, 44, 18, 0.15, Math.PI - 0.15); c.moveTo(50, 62); c.lineTo(50, 76); c.moveTo(38, 78); c.lineTo(62, 78); c.stroke();
    } else if (id === 'phones') {
      c.lineWidth = 6; c.strokeStyle = INK; c.beginPath(); c.arc(50, 54, 28, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.lineWidth = 3.4; c.strokeStyle = '#d6453a'; c.beginPath(); c.arc(50, 54, 28, Math.PI * 1.07, Math.PI * 1.93); c.stroke();
      sh('#d6453a', () => c.ellipse(24, 60, 9, 13, 0, 0, Math.PI * 2)); sh('#d6453a', () => c.ellipse(76, 60, 9, 13, 0, 0, Math.PI * 2));
    } else if (id === 'trophy') {
      sh('#f2c14e', () => { c.moveTo(32, 24); c.lineTo(68, 24); c.quadraticCurveTo(68, 56, 50, 58); c.quadraticCurveTo(32, 56, 32, 24); c.closePath(); });
      c.lineWidth = 3; c.beginPath(); c.arc(30, 34, 8, Math.PI * 0.5, Math.PI * 1.5); c.arc(70, 34, 8, Math.PI * 1.5, Math.PI * 0.5); c.stroke();
      sh('#f2c14e', () => c.rect(45, 58, 10, 10), 2.4); sh('#a8784e', () => c.rect(36, 68, 28, 9), 2.4);
      c.fillStyle = INK; c.font = '900 18px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1', 50, 39);
    } else if (id === 'note') {
      c.fillStyle = INK; c.beginPath(); c.ellipse(36, 68, 9, 7, -0.4, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(66, 62, 9, 7, -0.4, 0, Math.PI * 2); c.fill();
      c.lineWidth = 4; c.beginPath(); c.moveTo(44, 66); c.lineTo(44, 26); c.lineTo(74, 20); c.lineTo(74, 60); c.stroke(); c.lineWidth = 7; c.beginPath(); c.moveTo(44, 30); c.lineTo(74, 24); c.stroke();
      c.fillStyle = '#21a493'; c.beginPath(); c.arc(24, 30, 4, 0, Math.PI * 2); c.fill();
    } else if (id === 'star') {
      sh('#ffd166', () => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 15 : 34; c.lineTo(50 + Math.cos(a) * r, 52 + Math.sin(a) * r); } c.closePath(); });
      c.fillStyle = INK; c.beginPath(); c.arc(44, 50, 2.6, 0, Math.PI * 2); c.arc(56, 50, 2.6, 0, Math.PI * 2); c.fill(); c.lineWidth = 2.4; c.beginPath(); c.arc(50, 55, 5, 0.2, Math.PI - 0.2); c.stroke();
    } else if (id === 'mimo') {
      for (const k of [-1, 1]) { sh('#fbf1df', () => c.ellipse(50 + k * 12, 28, 6, 16, k * 0.25, 0, Math.PI * 2), 2.4); c.fillStyle = '#ff9b88'; c.beginPath(); c.ellipse(50 + k * 12, 30, 2.6, 10, k * 0.25, 0, Math.PI * 2); c.fill(); }
      sh('#fbf1df', () => c.ellipse(50, 60, 24, 21, 0, 0, Math.PI * 2));
      c.fillStyle = INK; for (const k of [-1, 1]) { c.beginPath(); c.ellipse(50 + k * 8, 58, 2.6, 3.4, 0, 0, Math.PI * 2); c.fill(); }
      c.lineWidth = 4.5; c.strokeStyle = INK; c.beginPath(); c.arc(50, 60, 27, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); c.lineWidth = 2.6; c.strokeStyle = '#d6453a'; c.beginPath(); c.arc(50, 60, 27, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      sh('#d6453a', () => c.ellipse(25, 62, 6, 9, 0, 0, Math.PI * 2), 2.2); sh('#d6453a', () => c.ellipse(75, 62, 6, 9, 0, 0, Math.PI * 2), 2.2);
      sh('#2fd0c2', () => { c.moveTo(50, 40); c.lineTo(54, 44); c.lineTo(50, 48); c.lineTo(46, 44); c.closePath(); }, 2);
    }
    c.restore();
  }

  // ------------------------------------------------------------ items: the questions' view (the quiz and the club share it)
  // A raw item (content): { type: 'mc' | 'tf' | 'tfn' | 'short' | 'match', ask: [text, english], at (the line that answers it),
  //   mc: opts: [[text, en], …], key (the right one's index) · tf / tfn: key: true | false | 'n' (not said)
  //   short: want (READ's content keys: lemmas, need, points, number, not…), model: [text, en] · match: pairs: [[left, right], …], extra }
  // resolve() gives it the shape EXAM.grade.item scores (options in a seeded order, key as an index), the same as exam.js's.
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hash = s => [...String(s)].reduce((a, ch) => (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0, 7);
  function shuffle(list, R) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const line = x => (!x ? null : Array.isArray(x) ? { t: x[0], en: x[1] || '' } : typeof x === 'string' ? { t: x, en: '' } : { t: x.t != null ? x.t : x.text, en: x.en || '' });
  const ITEMS = (() => {
    const LET = 'ABCDEFGH';
    const vals = it => (it.type === 'tfn' ? [true, false, 'n'] : [true, false]);
    function resolve(raw, k, seed) {
      const R = rng(hash(((raw.ask && line(raw.ask).t) || '') + '#' + k) ^ (seed || 1));
      const it = { k, type: raw.type, ask: line(raw.ask) || { t: '', en: '' }, at: raw.at, raw, pts: 1 };
      if (raw.type === 'mc') { const base = (raw.opts || []).map(line), order = shuffle(base.map((_, i) => i), R); it.opts = order.map(i => base[i]); it.key = order.indexOf(raw.key || 0); }
      else if (raw.type === 'tf' || raw.type === 'tfn') it.key = raw.key;
      else if (raw.type === 'short') { const m = line(raw.model); it.want = raw.want || { any: true }; it.model = m ? m.t : ''; it.modelEn = m ? m.en : ''; }
      else if (raw.type === 'match') {
        const left = (raw.pairs || []).map(p => line(p[0])), right = (raw.pairs || []).map(p => line(p[1])), all = right.concat((raw.extra || []).map(line));
        const order = shuffle(all.map((_, i) => i), R);
        Object.assign(it, { left, opts: order.map(i => all[i]), key: left.map((_, i) => order.indexOf(i)) });
      }
      return it;
    }
    function html(it, n, o = {}) {
      const tf = o.tf || [['✓', 'True'], ['✗', 'False'], ['?', 'Not said']];
      const head = o.head === false ? '' : `<span class="qn">${n}</span><span class="qt">${H(it.ask.t)}</span>`
        + (o.say !== false ? `<button class="qz-mini" type="button" data-say title="Hear the question">🔊</button>` : '')
        + (it.ask.en ? `<button class="qz-mini" type="button" data-en title="The English">EN</button><div class="qen hidden">${esc(it.ask.en)}</div>` : '');
      let body = '';
      if (it.type === 'mc') body = `<div class="qz-opts">${it.opts.map((op, i) => `<button class="qz-opt" type="button" data-o="${i}"><span><span class="lt">${LET[i]}</span> ${H(op.t)}</span>${op.en ? `<small class="oen hidden">${esc(op.en)}</small>` : ''}</button>`).join('')}</div>`;
      else if (it.type === 'tf' || it.type === 'tfn') body = `<div class="qz-opts">${vals(it).map((v, i) => `<button class="qz-opt" type="button" data-v="${v}"><span>${H(tf[i][0])}</span>${tf[i][1] ? `<small class="oen hidden">${esc(tf[i][1])}</small>` : ''}</button>`).join('')}</div>`;
      else if (it.type === 'short') body = `<input class="qz-sh" autocomplete="off" spellcheck="false" placeholder="${esc(o.placeholder || `A short answer, in ${LANGNAME[L()] || 'the language'}`)}">`;
      else if (it.type === 'match') body = `<div class="qz-legend">${it.opts.map((op, i) => `<b>${LET[i]}</b> ${H(op.t)}${op.en ? ` <small class="oen hidden">(${esc(op.en)})</small>` : ''}`).join(' · ')}</div>`
        + it.left.map((lf, j) => `<div class="qz-mrow"><span class="l">${H(lf.t)}${lf.en ? ` <small class="oen hidden">(${esc(lf.en)})</small>` : ''}</span><span class="qz-opts" data-row="${j}">${it.opts.map((_, i) => `<button class="qz-opt" type="button" data-o="${i}"><span class="lt" style="opacity:1">${LET[i]}</span></button>`).join('')}</span></div>`).join('');
      return `<div class="qz-q" data-k="${it.k}">${head}${body}<div class="qz-res hidden"></div></div>`;
    }
    // o: { say(it), change(it), enter(it, text) }; the answers go to A[k]
    function wire(el, items, A, o = {}) {
      for (const it of items) {
        const q = el.querySelector(`.qz-q[data-k="${it.k}"]`); if (!q) continue;
        const enb = q.querySelector('[data-en]'); if (enb) enb.onclick = () => { q.querySelectorAll('.qen, .oen').forEach(x => x.classList.toggle('hidden')); enb.classList.toggle('on'); };
        const sb = q.querySelector('[data-say]'); if (sb) sb.onclick = () => { if (o.say) o.say(it); };
        if (it.type === 'mc' || it.type === 'tf' || it.type === 'tfn') {
          q.querySelectorAll('.qz-opts > .qz-opt').forEach(b => b.onclick = () => {
            if (q.classList.contains('done')) return;
            q.querySelectorAll('.qz-opts > .qz-opt').forEach(x => x.classList.remove('on')); b.classList.add('on'); snd('click');
            A[it.k] = it.type === 'mc' ? +b.dataset.o : b.dataset.v === 'n' ? 'n' : b.dataset.v === 'true';
            if (o.change) o.change(it);
          });
        } else if (it.type === 'short') {
          const inp = q.querySelector('.qz-sh');
          if (cj() && CJK.mode(L()) === 'chars' && CJK.attachIME) try { CJK.attachIME(inp); } catch (e) { /* */ }
          inp.oninput = () => { A[it.k] = inp.value; if (o.change) o.change(it); };
          inp.addEventListener('keydown', e => { if (e.key === 'Enter' && o.enter) { e.preventDefault(); o.enter(it, inp.value); } });
        } else if (it.type === 'match') {
          const a = A[it.k] = A[it.k] || it.left.map(() => null);
          q.querySelectorAll('[data-row]').forEach(row => row.querySelectorAll('.qz-opt').forEach(b => b.onclick = () => {
            if (q.classList.contains('done')) return;
            row.querySelectorAll('.qz-opt').forEach(x => x.classList.remove('on')); b.classList.add('on'); a[+row.dataset.row] = +b.dataset.o; snd('click');
            if (o.change) o.change(it);
          }));
        }
      }
    }
    // the answer as it is now (a short answer straight from its box)
    function answer(el, it, A) {
      if (it.type === 'short') { const inp = el.querySelector(`.qz-q[data-k="${it.k}"] .qz-sh`); return inp ? inp.value : A[it.k]; }
      return A[it.k];
    }
    const answered = a => !(a == null || a === '' || (Array.isArray(a) && a.some(x => x == null)));
    function score(it, a, l = L()) {
      try { return typeof EXAM !== 'undefined' && EXAM.grade ? EXAM.grade.item(it, a, l) : 0; } catch (e) { console.error('[quiz] grade', e); return 0; }
    }
    function right(it, tf) {
      tf = tf || [['✓', 'True'], ['✗', 'False'], ['?', 'Not said']];
      if (it.type === 'mc') return it.opts[it.key] || { t: '', en: '' };
      if (it.type === 'tf' || it.type === 'tfn') return { t: tf[vals(it).indexOf(it.key)][0], en: tf[vals(it).indexOf(it.key)][1] };
      if (it.type === 'short') return { t: it.model, en: it.modelEn };
      if (it.type === 'match') return { html: it.left.map((lf, j) => `${H(lf.t)} → ${H((it.opts[it.key[j]] || {}).t || '')}`).join(' · '), en: '' };
      return { t: '', en: '' };
    }
    // each item's result in place: the right option green, a wrong pick red, the answer under it
    function mark(el, it, a, s, o = {}) {
      const q = el.querySelector(`.qz-q[data-k="${it.k}"]`); if (!q) return;
      q.classList.add('done', s >= 1 ? 'ok' : 'no');
      if (it.type === 'mc' || it.type === 'tf' || it.type === 'tfn') {
        q.querySelectorAll('.qz-opts > .qz-opt').forEach(b => { const v = it.type === 'mc' ? +b.dataset.o : b.dataset.v === 'n' ? 'n' : b.dataset.v === 'true'; b.classList.remove('on'); if (v === it.key) b.classList.add('right'); else if (v === a) b.classList.add('wrong'); });
      } else if (it.type === 'match') {
        q.querySelectorAll('[data-row]').forEach(row => { const j = +row.dataset.row; row.querySelectorAll('.qz-opt').forEach(b => { const i = +b.dataset.o; b.classList.remove('on'); if (i === it.key[j]) b.classList.add('right'); else if (Array.isArray(a) && a[j] === i) b.classList.add('wrong'); }); });
      } else if (it.type === 'short') { const inp = q.querySelector('.qz-sh'); if (inp) inp.disabled = true; }
      const res = q.querySelector('.qz-res'), rt = right(it, o.tf), rtH = rt.html || H(rt.t);
      res.className = 'qz-res ' + (s >= 1 ? 'ok' : 'no');
      res.innerHTML = (s >= 1 ? `✓ ${esc(o.okWord || 'Right!')}${it.type === 'short' && it.model ? ` <span style="opacity:.75;font-weight:500">${esc(o.likeWord || 'For example:')} ${rtH}</span>` : ''}`
        : `${s > 0 ? '◐' : '✗'} ${esc(o.ansWord || 'The answer:')} ${rtH}${rt.en ? ` <small>(${esc(rt.en)})</small>` : ''}`)
        + (it.at != null && o.where ? ` <button class="qz-mini" type="button" data-at="${it.at}">Where was it said?</button>` : '');
    }
    // tests: the answer a mode gives ('model' right, 'wrong' a wrong one, 'nose' «No sé» / nothing). A zh/ja model is typed
    // the way a player would type it: plain text in the current mode (characters or romanization), never the notation
    const IDK = { es: 'No sé.', pt: 'Não sei.', de: 'Ich weiß es nicht.', zh: '我不知道。', ja: 'わかりません。' };
    const typedAs = (s, l) => (isCJ(l) && typeof CJK !== 'undefined' ? CJK.plain(fill(String(s || '')), { lang: l }) : s);
    function auto(it, how, l = L()) {
      if (how === 'model') return it.type === 'short' ? typedAs(it.model, l) : Array.isArray(it.key) ? it.key.slice() : it.key;
      if (how === 'wrong') {
        if (it.type === 'mc') return (it.key + 1) % it.opts.length;
        if (it.type === 'tf') return !it.key;
        if (it.type === 'tfn') return it.key === true ? false : true;
        if (it.type === 'match') return it.key.map((x, i, k) => k[(i + 1) % k.length]);
        return IDK[l] || 'No sé.';
      }
      return it.type === 'short' ? IDK[l] || 'No sé.' : null;
    }
    // put an answer into the view (tests)
    function put(el, it, a, A) {
      const q = el.querySelector(`.qz-q[data-k="${it.k}"]`); if (!q) return;
      A[it.k] = a;
      if (it.type === 'short') { const inp = q.querySelector('.qz-sh'); if (inp) inp.value = a || ''; }
      else if (it.type === 'mc' && a != null) { const b = q.querySelector(`.qz-opts > .qz-opt[data-o="${a}"]`); if (b) b.classList.add('on'); }
      else if ((it.type === 'tf' || it.type === 'tfn') && a != null) { const b = q.querySelector(`.qz-opts > .qz-opt[data-v="${a}"]`); if (b) b.classList.add('on'); }
      else if (it.type === 'match' && Array.isArray(a)) q.querySelectorAll('[data-row]').forEach(row => { const b = row.querySelector(`.qz-opt[data-o="${a[+row.dataset.row]}"]`); if (b) b.classList.add('on'); });
    }
    return { resolve, html, wire, answer, answered, score, right, mark, auto, put, vals, IDK };
  })();

  // ------------------------------------------------------------ an episode, on the air
  // o: { prize (a new week: coins, a sticker, the streak), bonus (3 coins a right answer), week (this week's rerun: keeps the
  //      streak, no prizes), practice (a rerun: no prizes) } → { total, max, skill, got } | null (closed before locking in)
  const fmt = v => String(Math.round(v * 10) / 10);
  function nextSticker() { const sh = show(), s = S(); return ((sh && sh.stickers) || []).find(x => !s.stickers.includes(x.id)) || null; }
  function giveCos(id, from) {
    try {
      if (typeof TALK === 'undefined' || !TALK.state || !TALK._ || !TALK._.COS || !TALK._.COS[id]) return null;
      const st = TALK.state.cos; if (st[id]) return null;
      st[id] = { on: true, from: from || 'quiz' };
      const n = TALK._.COS[id].name; return (n && (n.en || n[L()])) || id;
    } catch (e) { console.error('[quiz] cosmetic', e); return null; }
  }
  function award(ep, o, res, skill) {
    const s = S(), total = res.reduce((a, x) => a + x.s, 0), max = res.length, perfect = max > 0 && res.every(x => x.s >= 1);
    const rec = s.eps[ep.id] || (s.eps[ep.id] = { n: 0, best: 0 });
    rec.n++; rec.best = Math.max(rec.best || 0, Math.round(total * 10) / 10); rec.max = max; rec.at = Date.now(); rec.skill = skill; s.n++;
    const got = { total, max, perfect, coins: 0, sticker: null, streak: 0, greet: 0, cos: [] };
    if (o.prize || o.week) {
      s.heard = Math.min(s.aired, s.heard + 1); s.streak++; s.best = Math.max(s.best, s.streak); got.streak = s.streak;
      const m = s.streak;
      if ((m === 3 || m === 5 || m === 10 || (m > 10 && m % 5 === 0)) && !s.greet[m]) { s.greet[m] = Date.now(); got.greet = m; }
      if (m >= 5) { const c = giveCos('quiz.phones'); if (c) got.cos.push(c); }
      if (m >= 10) { const c = giveCos('quiz.mic'); if (c) got.cos.push(c); }
    }
    if (o.prize) {
      got.coins = Math.round(total * (o.bonus ? 3 : 2));
      if (perfect) { const st = nextSticker(); if (st) { s.stickers.push(st.id); got.sticker = st; } else got.coins += 3; }
      if (got.coins && G && G.state) { G.state.coins = (G.state.coins || 0) + got.coins; s.coins += got.coins; }
    }
    READ.save();
    return got;
  }
  const pickLine = (arr, k) => (arr && arr.length ? arr[Math.abs(k | 0) % arr.length] : null);
  async function play(ep, o = {}) {
    if (!ep || openN) return null;
    const sh = show(); if (!sh) return null;
    const band = ep.band || 1, lang = L(), s0 = S(), rec0 = s0.eps[ep.id], firstEver = !s0.n;
    const items = (ep.items || []).map((raw, k) => ITEMS.resolve(raw, k, hash(ep.id) ^ (((rec0 && rec0.n) || 0) * 7919 + 13)));
    const hosts = sh.hosts || {}, guests = ep.voices || {}, voices = Object.assign({}, hosts, guests);
    for (const [who, v] of Object.entries(voices)) { try { SPEECH.speaker('qz.' + who, { pitch: v.pitch != null ? v.pitch : 1, rate: v.rate || 1 }); } catch (e) { /* */ } }
    const nameOf = who => P((voices[who] && voices[who].name) || who);
    const roleOf = who => (hosts[who] ? hosts[who].role || 'host' : (guests[who] && guests[who].role) || 'guest');
    const opener = (sh.open || []).map(l => Object.assign({ frame: true }, l)), seg = (ep.lines || []).filter(l => READ.when(l.when));
    const outro = (sh.toQuiz || []).map(l => Object.assign({ frame: true }, l)), all = opener.concat(seg, outro), segAt = opener.length;
    const tf = sh.tf || null, asker = sh.asker || Object.keys(hosts)[1] || Object.keys(hosts)[0];
    const talking = new Set(seg.map(l => l.who)), cast = Object.keys(hosts).concat(Object.keys(guests).filter(w => talking.has(w) && !hosts[w]));
    const chip = o.practice ? '<i class="qz-chip prac">rerun · practice</i>' : o.week ? '<i class="qz-chip prac">rerun · this week</i>' : o.bonus ? '<i class="qz-chip bonus">bonus round</i>' : '<i class="qz-chip new">this week</i>';
    const station = (typeof RADIO !== 'undefined' && RADIO.STATION) ? P(RADIO.STATION[lang] || RADIO.STATION.en) : 'Radio Alba 98.6';
    const r = open('radio');
    r.innerHTML = `<div class="qz-shade"></div><div class="qz-card"><div class="qz-top"><canvas class="qz-logo" width="208" height="128"></canvas>`
      + `<div class="qz-ttl"><b>${H(sh.title)}</b><small>${esc(station)} · ${KIND[ep.kind] || '📻'} ${H(ep.title)} <span class="en">${esc(ep.en || '')}</span></small></div>`
      + `<span><i class="qz-chip">${READ.BAND(band)}</i>${chip}</span><button class="qz-x" title="Close (Esc)">✕</button></div>`
      + `<div class="qz-body"><div class="qz-side"><div class="qz-air"><span class="lamp"></span>ON AIR<span class="qz-now"></span></div>`
      + `<div class="qz-cast">${cast.map(w => `<div class="qz-who" data-who="${esc(w)}"><canvas width="112" height="112"></canvas><span>${esc(nameOf(w))}</span><small>${esc(roleOf(w))}</small></div>`).join('')}</div>`
      + `<div class="qz-ctl"><button class="qz-btn main" data-a="play">▶ Play</button><span class="qz-left"></span><button class="qz-btn ${SPEECH.slow ? 'on' : ''}" data-a="slow" title="About 0.8× speed">🐢 Slower</button>`
      + `<button class="qz-btn" data-a="words">📝 Show the words</button><button class="qz-btn hidden" data-a="en">EN</button></div><div class="qz-note"></div>`
      + `<canvas class="qz-radioart" width="420" height="270"></canvas>`
      + `<div class="qz-script hidden">${all.map((l, i) => `<p class="qz-l${l.frame ? ' frame' : ''}" data-i="${i}"><span class="who">${esc(nameOf(l.who))}</span><span class="tx" data-text="${esc(l.text)}">${tapWords(l.text)}</span><button class="qz-sb" type="button" data-line="${i}" title="Hear this line">🔊</button><span class="en">${esc(l.en || '')}</span></p>`).join('')}</div></div>`
      + `<div class="qz-main"><div class="qz-after"></div><div class="qz-h">The quiz · ${items.length} questions${o.prize ? ` · ${o.bonus ? 3 : 2} coins a right answer` : ''}</div>`
      + (firstEver ? `<p class="qz-note">How it works: listen (two plays), answer, then lock in. A perfect score adds a sticker to your album, and listening every week makes you a regular.</p>` : '')
      + (o.practice || o.week ? '<p class="qz-note">A rerun: no prizes. Your answers still count toward your listening.</p>' : '')
      + `<div class="qz-items">${items.map((it, i) => ITEMS.html(it, i + 1, { tf })).join('')}</div></div></div>`
      + `<div class="qz-foot"><span class="nt">Answer while it plays, or after.</span><span class="sp"></span><button class="qz-btn main" data-a="lock">Lock in my answers ▸</button></div></div>`;
    const card = r.querySelector('.qz-card'), main = card.querySelector('.qz-main'), script = card.querySelector('.qz-script');
    const airEl = card.querySelector('.qz-air'), nowEl = card.querySelector('.qz-now'), pb = card.querySelector('[data-a="play"]'), leftEl = card.querySelector('.qz-left');
    const note = card.querySelector('.qz-side .qz-note'), footNote = card.querySelector('.qz-foot .nt'), lockB = card.querySelector('[data-a="lock"]');
    logo(card.querySelector('.qz-logo'), 'radio');
    radioArt(card.querySelector('.qz-radioart'), P(sh.title));
    card.querySelectorAll('.qz-who').forEach(d => face(d.querySelector('canvas'), (voices[d.dataset.who] || {}).look));
    const A = {};
    let ctl = null, plays = PLAYS, first = true, played = false, peeked = false, readMode = false, locked = false, sure = false, base = 0, result = null;
    const setLeft = () => { leftEl.textContent = locked ? 'replay as often as you like' : plays > 1 ? `${plays} plays left` : plays === 1 ? '1 play left' : 'no plays left'; };
    function light(i) {
      script.querySelectorAll('.qz-l.lit').forEach(x => x.classList.remove('lit')); card.querySelectorAll('.qz-who.talk').forEach(x => x.classList.remove('talk'));
      const l = i >= 0 ? all[i] : null; nowEl.textContent = l ? `🔊 ${nameOf(l.who)}` : '';
      if (!l) return;
      const p = script.querySelector(`.qz-l[data-i="${i}"]`); if (p) { p.classList.add('lit'); if (!script.classList.contains('hidden')) p.scrollIntoView({ block: 'nearest' }); }
      const w = card.querySelector(`.qz-who[data-who="${l.who}"]`); if (w) w.classList.add('talk');
    }
    function stopAudio() {
      if (ctl) { const c = ctl; ctl = null; try { c.stop(); } catch (e) { /* */ } }
      airEl.classList.remove('on'); light(-1);
      pb.textContent = locked || !first ? '▶ Play again' : '▶ Play'; pb.disabled = readMode || (!locked && plays <= 0);
    }
    function playLines(list, from) {
      stopAudio();
      base = from; airEl.classList.add('on'); pb.textContent = '■ Stop'; pb.disabled = false;
      const my = SPEECH.play(list.map(l => ({ text: l.text, who: 'qz.' + l.who })), { lang, gap: band <= 2 ? 0.4 : 0.28, onLine: i => { if (ctl === my) light(i >= 0 ? base + i : -1); } });
      ctl = my;
      return my.done.then(res => {
        if (ctl !== my) return res;
        ctl = null; stopAudio();
        if (!res.ok && !res.stopped) toRead();
        return res;
      });
    }
    function playAll() {
      if (ctl) { stopAudio(); return; }
      if (readMode || (!locked && plays <= 0)) return;
      if (!locked) { plays--; setLeft(); }
      const list = first ? all : seg, from = first ? 0 : segAt; first = false; snd('click');
      playLines(list, from).then(res => { if (res && res.ok && !res.stopped) played = true; });
    }
    function showScript(why) {
      script.classList.remove('hidden'); card.querySelector('[data-a="words"]').classList.add('hidden'); card.querySelector('[data-a="en"]').classList.remove('hidden');
      const art = card.querySelector('.qz-radioart'); if (art) art.classList.add('hidden');
      if (why === 'peek' && !readMode && !locked) { peeked = true; note.textContent = 'With the words showing, your answers count as reading.'; }
    }
    function toRead() {
      if (readMode) return;
      readMode = !locked; showScript('novoice');
      note.textContent = `${SPEECH.NO_VOICE}: read it instead${locked ? '' : ' (your answers count as reading)'}.`; note.classList.add('warn');
      pb.disabled = true; card.querySelector('[data-a="slow"]').disabled = true;
    }
    const sayQ = it => { stopAudio(); try { SPEECH.say(it.ask.t, { lang, who: 'qz.' + asker }).then(res => { if (!res.ok && !readMode) { note.textContent = SPEECH.NO_VOICE; } }); } catch (e) { /* */ } };
    ITEMS.wire(main, items, A, { say: sayQ, change: () => { sure = false; } });
    pb.onclick = () => playAll();
    card.querySelector('[data-a="slow"]').onclick = e => { SPEECH.slow = !SPEECH.slow; e.currentTarget.classList.toggle('on', SPEECH.slow); snd('click'); };
    card.querySelector('[data-a="words"]').onclick = () => { snd('click'); showScript('peek'); };
    card.querySelector('[data-a="en"]').onclick = e => { script.classList.toggle('en-on'); e.currentTarget.classList.toggle('on'); };
    script.querySelectorAll('[data-line]').forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.line; playLines([all[i]], i); });
    if (typeof READER !== 'undefined' && READER.taps) READER.taps(script, { host: r });           // (tap a word in the transcript: its gloss, as in the books)
    setLeft();
    // locking in: grade, log, prizes, the hosts' reaction
    function lockIn() {
      if (locked) return;
      const empty = items.filter(it => !ITEMS.answered(ITEMS.answer(main, it, A))).length;
      if (empty && !sure && !T.auto) { sure = true; footNote.innerHTML = `<b style="color:#9a3a22">${empty} question${empty > 1 ? 's have' : ' has'} no answer yet. Press again to lock in anyway.</b>`; return; }
      const skill = peeked || readMode ? 'read' : 'listen';
      locked = true; stopAudio(); setLeft();
      const res = items.map(it => { const a = ITEMS.answer(main, it, A), sc = ITEMS.score(it, a); try { DICT.log(skill, band, sc); } catch (e) { /* */ } return { it, a, s: sc }; });
      seg.forEach(l => { try { READER.markRead(l.text, skill === 'listen' && played ? 'heard' : 'read'); } catch (e) { /* */ } });
      res.forEach(x => ITEMS.mark(main, x.it, x.a, x.s, { tf, where: true }));
      const got = award(ep, o, res, skill);
      result = { total: got.total, max: got.max, skill, got, ep: ep.id };
      T.last = result;
      showScript('after');
      // the hosts react (and greet a regular), in the language, read out by their voices
      const ratio = got.max ? got.total / got.max : 0, k = hash(ep.id) + S().n;
      const said = [pickLine(got.perfect ? sh.perfect : ratio >= 0.6 ? sh.good : sh.low, k)];
      if (got.greet) { const g = (sh.regular || {})[got.greet] || (sh.regular || {}).more; if (g) said.push(Object.assign({}, g, { text: String(g.text).replace(/\{n\}/g, got.greet), en: String(g.en || '').replace(/\{n\}/g, got.greet) })); }
      if (sh.bye) said.push(pickLine(sh.bye, k));
      const lines = said.filter(Boolean);
      const prize = [`<span class="big">${fmt(got.total)} / ${got.max}</span>`];
      if (o.prize) prize.push(`<span class="it">🪙 +${got.coins} coins</span>`);
      if (o.prize || o.week) prize.push(`<span class="it">📻 Regular listener: ${got.streak} week${got.streak === 1 ? '' : 's'} in a row</span>`);
      if (got.sticker) prize.push(`<figure><canvas width="184" height="184" data-sticker="${esc(got.sticker.id)}"></canvas><span class="it">★ A new sticker!<br>${H(got.sticker.t)} <small style="opacity:.7">(${esc(got.sticker.en || '')})</small></span></figure>`);
      for (const c of got.cos) prize.push(`<span class="it">🎁 ${esc(READ.mimo())} got ${esc(c)}! (switch it on or off on the People page)</span>`);
      if (o.practice || o.week) prize.push('<span class="it">A rerun: no prizes, but it counts as practice.</span>');
      const after = main.querySelector('.qz-after');
      after.innerHTML = `<div class="qz-prize">${prize.join('')}</div>` + lines.map((l, i) => `<div class="qz-bub" data-b="${i}"><canvas width="112" height="112"></canvas><div class="b"><span class="who">${esc(nameOf(l.who))}</span>${H(l.text)}<span class="en hidden">${esc(l.en || '')}</span></div></div>`).join('');
      after.querySelectorAll('.qz-bub').forEach(b => { const l = lines[+b.dataset.b]; face(b.querySelector('canvas'), (voices[l.who] || {}).look); b.onclick = () => b.querySelector('.en').classList.toggle('hidden'); });
      after.querySelectorAll('canvas[data-sticker]').forEach(cv => sticker(cv, cv.dataset.sticker, true));
      main.querySelectorAll('[data-at]').forEach(b => b.onclick = () => {
        const i = segAt + (+b.dataset.at); showScript('after');
        script.querySelectorAll('.qz-l.ev').forEach(x => x.classList.remove('ev'));
        const p = script.querySelector(`.qz-l[data-i="${i}"]`); if (p) { p.classList.add('ev'); p.scrollIntoView({ block: 'nearest' }); }
        if (all[i]) playLines([all[i]], i);
      });
      main.scrollTop = 0;
      snd(got.perfect ? 'learned' : ratio >= 0.5 ? 'chest' : 'review');
      if (got.coins) snd('chest');
      footNote.textContent = `Your answers count toward your ${skill === 'listen' ? 'listening' : 'reading'} (${READ.BAND(band)}). Tap a host’s line for the English.`;
      lockB.textContent = 'Close ▸';
      if (!T.fast && !T.mute && lines.length && !readMode) setTimeout(() => { if (!closed) playLines(lines, -1000); }, 450);
    }
    let closed = false, done = null;
    const fin = new Promise(res => { done = res; });
    const finish = () => { if (closed) return; closed = true; stopAudio(); done(); };
    lockB.onclick = () => (locked ? finish() : lockIn());
    card.querySelector('.qz-x').onclick = finish;
    keys(e => {
      if (e.code === 'Escape') { if (typeof READER !== 'undefined' && READER.glossOpen) READER.hideGloss(); else finish(); return true; }
      if (e.code === 'Space' && !readMode) { playAll(); return true; }
      if (e.code === 'Enter') { if (locked) finish(); else lockIn(); return true; }
      return false;
    });
    try {
      if (T.auto) {
        setTimeout(() => {
          if (T.auto === 'peek') showScript('peek'); else played = true;
          const how = T.auto === 'peek' ? 'model' : T.auto;
          for (const it of items) ITEMS.put(main, it, ITEMS.auto(it, how), A);
          lockIn();
          if (!T.hold) setTimeout(finish, 20);
        }, 20);
      } else {
        await SPEECH.ready();
        if (!closed) { if (!SPEECH.has(lang)) toRead(); else if (!T.mute) playAll(); }
      }
      await fin;
      return result;
    } finally { close(); }
  }

  // ------------------------------------------------------------ the journal's Reading page (read.js READ.more): the album, the streak
  const cosOn = id => { try { return !!(typeof TALK !== 'undefined' && TALK.state && TALK.state.cos && TALK.state.cos[id]); } catch (e) { return false; } };
  const journal = {
    show: () => started() && S().aired > 0,
    html() {
      if (!started() || !S().aired) return '';
      css();
      const sh = show(), s = S(), q = waiting(), sts = sh.stickers || [];
      let h = `<h4 class="ph-h">📻 «${H(sh.title)}» on Radio Alba</h4><div class="qz-j">`
        + `<div class="row">Episodes answered: <b>${s.n}</b> · regular listener: <b>${s.streak}</b> week${s.streak === 1 ? '' : 's'} in a row (best ${s.best}) · coins won: ${s.coins}</div>`
        + `<div class="row">${q > 0 ? `<b>${q}</b> new week${q > 1 ? 's' : ''} waiting on the radio (the inn’s terrace, or the library).` : `The next week airs in about ${nextMin()} min of play, or when the story moves on.`}</div>`
        + `<div class="row">For regulars: 🎧 the show’s headphones ${cosOn('quiz.phones') ? '✓' : '(5 weeks in a row)'} · 🎤 a golden microphone pin ${cosOn('quiz.mic') ? '✓' : '(10 weeks)'}</div>`
        + `<div class="qz-album">${sts.map(st => { const got = s.stickers.includes(st.id); return `<figure class="${got ? '' : 'miss'}"><canvas width="140" height="140" data-qz-st="${esc(st.id)}" data-got="${got ? 1 : 0}"></canvas><figcaption>${got ? H(st.t) : 'a perfect score'}</figcaption></figure>`; }).join('')}</div></div>`;
      return h;
    },
    wire(el) { el.querySelectorAll('canvas[data-qz-st]').forEach(cv => sticker(cv, cv.dataset.qzSt, cv.dataset.got === '1')); },
  };

  // ------------------------------------------------------------ Mimo's prizes (TALK.cosmetic: switched on or off on the People page)
  function cosmetics() {
    if (typeof TALK === 'undefined' || !TALK.cosmetic || typeof TK === 'undefined' || typeof THREE === 'undefined') return;
    const part = (geo, col, pos, sc, o) => TK.part(geo, col, pos, sc, o || { ink: 0.006 });
    TALK.cosmetic('quiz.phones', { name: { en: 'the quiz show’s headphones' }, build(M) {
      if (!M || !M.body) return null;
      const g = new THREE.Group();
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.028, 8, 24, Math.PI), TK.toon('#2b2235')); arc.position.set(0, 0.31, 0.02); g.add(arc);
      for (const s of [-1, 1]) {
        g.add(part(TK.G.cyl, '#d6453a', [s * 0.325, 0.31, 0.02], [0.105, 0.065, 0.105], { rot: [0, 0, Math.PI / 2], ink: 0.008 }));
        g.add(part(TK.G.cyl, '#2b2235', [s * 0.362, 0.31, 0.02], [0.07, 0.02, 0.07], { rot: [0, 0, Math.PI / 2], ink: 0 }));
      }
      M.body.add(g); return g;
    } });
    TALK.cosmetic('quiz.mic', { name: { en: 'the quiz show’s golden microphone pin' }, build(M) {
      if (!M || !M.body) return null;
      const g = new THREE.Group(); g.position.set(0.17, 0.19, 0.285); g.rotation.set(-0.2, 0.45, -0.35);
      g.add(part(TK.G.sphere, '#f2c14e', [0, 0.05, 0], [0.034, 0.044, 0.034], { ink: 0.005 }));
      g.add(part(TK.G.cyl, '#c9a24a', [0, -0.02, 0], [0.012, 0.07, 0.012], { ink: 0.004 }));
      M.body.add(g); return g;
    } });
  }

  // ------------------------------------------------------------ the side quest: the first episode (after that, a toast each week)
  function quest() {
    const spot = () => {
      if (typeof LIBRARY !== 'undefined' && LIBRARY.inside && LIBRARY.ROOM_AT && LIBRARY.SPOT) return { x: LIBRARY.ROOM_AT.x + LIBRARY.SPOT.radio.x + 1.05, z: LIBRARY.ROOM_AT.z + LIBRARY.SPOT.radio.z + 0.35 };
      if (typeof RADIO !== 'undefined' && RADIO.SPOT) return { x: RADIO.SPOT.x - 1.35, z: RADIO.SPOT.z };
      return null;
    };
    const q = s => (s && s.read && s.read.quiz) || {};
    return {
      id: 'quiz', kind: 'side',
      get title() { const sh = show(); return sh ? `«${P(sh.title)}» on Radio Alba` : 'The radio quiz'; },
      get giver() { return 'Radio Alba'; },
      started: s => started() && !!q(s).aired,
      steps: [{ get text() { const sh = show(); return `Listen to this week’s «${sh ? P(sh.title) : ''}» on a radio, and answer the quiz`; },
        why: 'Radio Alba has a quiz show with prizes: coins, stickers, and a streak for regular listeners. There’s a radio on the inn’s terrace, and one in the library.',
        done: s => !!q(s).n, target: spot, hint: '{mimo} perks up its ears: music from the inn’s terrace.' }],
      story: [{ when: s => !!q(s).n, get text() { const sh = show(); return `Radio Alba’s quiz show «${sh ? P(sh.title) : ''}» airs a new week every so often: an episode at your level and a bonus round a level up. Your sticker album and your streak are on the journal’s Reading page.`; } }],
    };
  }
  const PROVIDER = { id: 'quiz', menu };
  function init(game) {
    G = game; S();
    try { cosmetics(); } catch (e) { console.error('[quiz] cosmetics', e); }
    if (typeof RADIO !== 'undefined' && RADIO.extra && !RADIO.extra.includes(PROVIDER)) RADIO.extra.push(PROVIDER);
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(x => x.id === 'quiz')) QUESTS.LIST.push(quest());
    if (READ.more && !READ.more.includes(journal)) READ.more.push(journal);
  }

  // ------------------------------------------------------------ checks and tests (QUIZ._.tests(lang); the game never calls them)
  function strings(lang) {
    const c = C[lang], out = []; if (!c) return out;
    const put = (where, s) => { if (typeof s === 'string' && s.trim()) out.push({ where, s, l: lang }); };
    const sh = c.show || {};
    put('show.title', sh.title);
    for (const k of ['open', 'toQuiz', 'perfect', 'good', 'low', 'bye']) (sh[k] || []).forEach((x, i) => put(`show.${k}.${i}`, x.text));
    for (const [k, x] of Object.entries(sh.regular || {})) put(`show.regular.${k}`, x.text);
    (sh.tf || []).forEach((x, i) => put(`show.tf.${i}`, x[0]));
    (sh.stickers || []).forEach((x, i) => put(`show.sticker.${i}`, x.t));
    for (const [w, v] of Object.entries(sh.hosts || {})) put(`show.host.${w}`, v.name);
    for (const ep of c.episodes) {
      put(ep.id + '.title', ep.title);
      for (const [w, v] of Object.entries(ep.voices || {})) put(`${ep.id}.voice.${w}`, v.name);
      (ep.lines || []).forEach((x, i) => put(`${ep.id}.${i}`, x.text));
      (ep.items || []).forEach((it, i) => {
        const w = `${ep.id}.q${i}`, a = line(it.ask); put(w + '.ask', a && a.t);
        (it.opts || []).forEach((x, j) => put(`${w}.opt${j}`, line(x).t)); if (it.model) put(w + '.model', line(it.model).t);
        (it.pairs || []).forEach((p, j) => { put(`${w}.pair${j}a`, line(p[0]).t); put(`${w}.pair${j}b`, line(p[1]).t); }); (it.extra || []).forEach((x, j) => put(`${w}.extra${j}`, line(x).t));
      });
    }
    return out;
  }
  function check(langs = ['zh', 'ja']) {
    const bad = []; if (typeof CJK === 'undefined') return bad;
    for (const l of [].concat(langs)) for (const { where, s } of strings(l)) { const p = CJK.validate(fill(s), l); if (p && p.length) bad.push({ where, s, p }); }
    return bad;
  }
  const wordsIn = (s, l) => (isCJ(l) && typeof CJK !== 'undefined' ? CJK.plain(fill(s), { lang: l, mode: 'chars' }).replace(/[\s\p{P}]/gu, '').length : String(fill(s)).split(/\s+/).filter(Boolean).length);
  function tests(l = L()) {
    const was = typeof LEX !== 'undefined' ? LEX.lang : l; if (typeof LEX !== 'undefined') LEX.lang = l;
    const fails = [], ok = (c, what) => { if (!c) fails.push(what); return c; }, counts = { episodes: 0, items: 0, byBand: {}, words: {}, types: {} };
    try {
      const c = C[l]; if (!c || !c.show) return { lang: l, ok: false, fails: ['no quiz content'] };
      const sh = c.show, hosts = sh.hosts || {};
      ok(sh.title, 'show: no title'); ok(Object.keys(hosts).length >= 2 && Object.values(hosts).every(h => h.name && h.look), 'show: two hosts, with names and looks');
      for (const k of ['open', 'toQuiz', 'perfect', 'good', 'low']) ok((sh[k] || []).length, `show.${k}: missing`);
      for (const k of ['open', 'toQuiz', 'perfect', 'good', 'low', 'bye']) (sh[k] || []).forEach((x, i) => { ok(x.en, `show.${k}.${i}: no English`); ok(hosts[x.who], `show.${k}.${i}: ${x.who} isn’t a host`); });
      for (const m of [3, 5, 10, 'more']) ok(sh.regular && sh.regular[m] && sh.regular[m].en && hosts[sh.regular[m].who], `show.regular.${m}: missing`);
      ok((sh.tf || []).length === 3 && sh.tf.every(x => x[0] && x[1]), 'show.tf: three labels with English');
      ok((sh.stickers || []).length === 8 && sh.stickers.every(x => STICKERS.includes(x.id) && x.t && x.en), 'show.stickers: eight, with captions');
      const ids = new Set();
      for (const ep of c.episodes) {
        counts.episodes++; counts.byBand[ep.band] = (counts.byBand[ep.band] || 0) + 1;
        ok(!ids.has(ep.id), ep.id + ': the id twice'); ids.add(ep.id);
        ok(ep.band >= 1 && ep.band <= 4, ep.id + ': band'); ok(ep.title && ep.en && KIND[ep.kind], ep.id + ': title, en, kind');
        const V = Object.assign({}, hosts, ep.voices || {});
        for (const [w, v] of Object.entries(ep.voices || {})) ok(v.name && v.look, `${ep.id}: the voice ${w} needs a name and a look`);
        ok((ep.lines || []).length >= 5, ep.id + ': at least five lines');
        let n = 0;
        (ep.lines || []).forEach((x, i) => { ok(x.en, `${ep.id}.${i}: no English`); ok(V[x.who], `${ep.id}.${i}: no voice for ${x.who}`); n += wordsIn(x.text, l); });
        counts.words[ep.id] = n;
        const need = ep.band <= 2 ? 4 : 5; ok((ep.items || []).length >= need, `${ep.id}: ${(ep.items || []).length} questions (${need} wanted)`);
        (ep.items || []).forEach((raw, k) => {
          const w = `${ep.id} #${k + 1}`; counts.items++; counts.types[raw.type] = (counts.types[raw.type] || 0) + 1;
          const a = line(raw.ask);
          ok(['mc', 'tf', 'tfn', 'short', 'match'].includes(raw.type), w + ': type ' + raw.type); ok(a && a.t && a.en, w + ': the question with its English');
          if (raw.at != null) ok(raw.at >= 0 && raw.at < (ep.lines || []).length, w + ': at is out of range');
          if (raw.type === 'mc') { ok((raw.opts || []).length >= 3 && raw.opts.every(x => line(x).en), w + ': three options with English'); ok(raw.key >= 0 && raw.key < (raw.opts || []).length, w + ': key'); }
          if (raw.type === 'tf') ok(typeof raw.key === 'boolean', w + ': a tf key is true or false');
          if (raw.type === 'tfn') ok([true, false, 'n'].includes(raw.key), w + ': a tfn key is true, false or n');
          if (raw.type === 'short') ok(raw.want && raw.model && line(raw.model).en, w + ': a short answer needs a want and a model with its English');
          if (raw.type === 'match') ok((raw.pairs || []).length >= 2 && raw.pairs.every(p => line(p[0]).en && line(p[1]).en), w + ': match pairs with English');
          for (const seed of [3, 17]) {
            const it = ITEMS.resolve(raw, k, seed), right = ITEMS.auto(it, 'model', l), sc = ITEMS.score(it, right, l);
            ok(sc === 1, `${w} (${raw.type}): the right answer scores ${sc} («${JSON.stringify(right)}»)`);
            if (raw.type !== 'short') ok(ITEMS.score(it, ITEMS.auto(it, 'wrong', l), l) < 1, `${w}: a wrong answer scores 1`);
            else { ok(ITEMS.score(it, ITEMS.IDK[l], l) === 0, `${w}: «${ITEMS.IDK[l]}» scores`); ok(ITEMS.score(it, 'I don’t know', l) === 0, `${w}: English scores`); }
          }
        });
      }
      for (const b of [1, 2, 3, 4]) ok((counts.byBand[b] || 0) >= 3, `band ${b}: ${counts.byBand[b] || 0} episodes (3 wanted)`);
      if (isCJ(l)) check([l]).forEach(x => fails.push(`CJK ${x.where}: ${x.p.join('; ')}`));
    } catch (e) { fails.push('threw: ' + ((e && e.stack) || e)); }
    finally { if (typeof LEX !== 'undefined') LEX.lang = was; }
    return { lang: l, ok: !fails.length, fails, counts };
  }

  return {
    add, content, on, started, band, week, menu, play, S, init, outdoor, journal, strings, check, tests,
    UI: { open, close, keys, face, logo, sticker, css, get isOpen() { return openN > 0; } }, ITEMS, STICKERS, WEEK_S, QMAX, KIND,
    get isOpen() { return openN > 0; },
    _: { C, T, steps, air, waiting, rerunPick, practiceMenu, award, nextSticker, giveCos, free, announce, hash, rng, line, fresh, list, quest, journal, get G() { return G; } },
  };
})();
