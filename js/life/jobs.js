'use strict';
// JOBS: part-time jobs in Alba (D2, DESIGN.md 21.2 D, the speaking half). Five, in every language with LIFE content:
//   the bakery (Marta, at her door: STORY.talkHooks) · the library (the librarian's menu: LIBRARY.person.options) · the inn
//   (a «help wanted» card at Alba's inn bar: INTERIORS.hook) · the ferry (Bartolo on Remanso's pier, once he has his words
//   back: STORY.talkHooks) · the post office (the clerk at the town hall's counter).
//   • The interview: a TALK.play scene with the employer's portrait and the help ladder, at your level (A1 at least):
//     A1 3 turns (intro · which days · do you like…), A2 4 (intro · past experience · days and times · why, with a reason),
//     B1 5 (+ a work situation), B2 5 (experience · availability · why · «what would you do if…» · why you). Logged 'talk'
//     (TALK.turn). A pass is an average of 3.5 of EXAM's turn points (S 5 … D 1), with at most one turn given up on. A retry
//     waits 10 minutes of play and draws other questions where the bank has them. A promotion interview one band up opens
//     two work days after a hire.
//   • Shifts: up to three a work day (LIFE.day()), 4–9 small tasks each in the shift panel (LIFEUI.shift): say it ('talk',
//     TALK.judge or SHOP.parse) or pick it ('read'; 'listen' when the words stay hidden). Pay 8 / 12 / 16 / 20 coins by
//     rank, more for good answers.
//       bakery: a customer orders aloud (hidden from B1), you say it back (SHOP.parse: what and how many, agreement, measure
//         words), then the total (the price board); B1–B2: a change of mind, a recommendation, a complaint
//       library: shelve returned books by their title and back cover, then tell a reader where a shelf is (the map)
//       inn: the ledger and the price: which room is free, the price for N nights, breakfast; B1–B2 a problem, advice
//       ferry: the timetable and the fares: the next ferry, a ticket's price, a group's total; B1–B2 the fog, a lost ticket
//       post: sort letters into pigeonholes by their address, then a parcel's price from the rate card
//   Two more from B1 (2026-11-26, A2; MIN: below B1 the boss says when to come back):
//       interp: the visitors' desk at the town hall (the clerk hires; offered at her counter). An English-speaking visitor
//         says what they need (CASES, below: one shared English bank); you say it to the right person in the language
//         (the clerk at the counter, or Marisa / Bartolo / the librarian / Marta on the desk's ☎), judged on every part of
//         the request (each case's `needs`); then you pass their answer back by picking the right English (hidden at B2,
//         🔊 to replay: 'listen', or 'read' after a peek). B2 adds one stressed visitor a shift: soften it («¿Sería posible…?»).
//       news: a reporter for Radio Alba's news (the quiz show's co-host hires; offered on the radio and the town board).
//         A story of the day (STORIES, gated by the save where it touches the story): ask two townsfolk a real question about
//         it (B2: an open one), pick what they told you, then write the news item (LIFEUI's 'write' task, EXAM.grade.write,
//         logged 'write'): what happened · what someone said (B2: reported speech) · (B2) what comes next. Each item is kept
//         in G.state.life.news (for a later newspaper).
//   JOBS.init(game) · menu(id) · offer(id) → { label, sub, run } · open() · boardLines() · quests() · _ (tests, the generators)
// State: G.state.life.jobs[id] { rank, tries, last, shiftDay, shifts, earned, hiredDay, used } · G.state.life.news [{ at, day, story, lang, band, title, text, grade, score }]

const JOBS = (() => {
  let G = null;
  const P = s => LIFE.P(s), L = () => LIFE.L(), E = s => LIFE.E(s);
  const C = () => LIFE.content() || {};
  const B = LIFE.BANDS;
  const PAY = [0, 8, 12, 16, 20], SHIFTS = 3, RETRY = 600, PROMO_DAYS = 2;
  const IDS = ['bakery', 'library', 'inn', 'ferry', 'post', 'interp', 'news'];
  const EN = { bakery: 'the bakery', library: 'the library', inn: 'the inn', ferry: 'the ferry', post: 'the post office', interp: 'the visitors’ desk', news: 'Radio Alba’s news' };
  const ICON = { bakery: '🥖', library: '📚', inn: '🛎', ferry: '⛴', post: '📮', interp: '🗣', news: '📰' };
  const MIN = { interp: 3, news: 3 };           // (the lowest band a job hires at: B1)
  const minOf = id => MIN[id] || 1;
  const T = { fast: false };
  const js = id => { const s = LIFE.S().jobs; return s[id] || (s[id] = { rank: 0, tries: 0, last: -1e9, shiftDay: 0, shifts: 0, earned: 0, hiredDay: 0, used: {} }); };
  const flags = () => (G && G.state && G.state.flags) || {};
  const open = () => !!(LIFE.ready() && G && G.state && flags().hatched && flags().boss);
  // each job's own gate: the library needs the library (READ's books in this language), the ferry needs Bartolo's words back,
  // the news needs the radio
  function jobOn(id) {
    if (!open() || !C().jobs[id]) return false;
    if (id === 'library') return typeof LIBRARY !== 'undefined' && typeof READ !== 'undefined' && READ.on && READ.on('books');
    if (id === 'ferry') return !!flags().bartolo;
    if (id === 'news') return typeof RADIO !== 'undefined';
    return true;
  }
  const shiftsLeft = st => (st.shiftDay === LIFE.day() ? Math.max(0, SHIFTS - st.shifts) : SHIFTS);
  const canPromote = st => st.rank > 0 && st.rank < 4 && LIFE.level() >= st.rank && LIFE.day() - (st.hiredDay || 0) >= PROMO_DAYS && LIFE.now() - st.last >= RETRY;
  // the employer: a name and a portrait (their own look in the game when they have one: TALK.lookOf('baker'), the clerk's)
  const bossOf = id => {
    const J = C().jobs[id] || {}, bs = J.boss || {};
    let look = bs.look || null;
    if (!look && bs.who === 'clerk') look = (C().clerk || {}).look || null;
    else if (!look && bs.who) { try { look = TALK.lookOf(bs.who); } catch (e) { look = null; } }
    return { name: P(bs.name || ''), look, role: P(((J.title || [])[0]) || ''), voice: bs.voice };
  };
  async function choose(title, opts) {
    const was = G.sim.lock; G.sim.lock = 1;
    try { return await UI.choose(title, opts); } finally { G.sim.lock = was; }
  }
  // a line of the employer's, in a card with their portrait (no 3D rig needed: they're wherever they work)
  async function bossSay(id, key, html, buttons) {
    const J = C().jobs[id] || {}, ls = LIFE.lines((J.lines || {})[key] || []);
    return LIFEUI.card({ title: `${ICON[id]} ${P(((J.title || [])[0]) || EN[id])}`, who: bossOf(id), lines: ls, html: html || '', buttons, say: { who: 'life.job.' + id, voice: (J.boss || {}).voice } });
  }

  // ------------------------------------------------------------ the menu (and the offer other menus show)
  function offer(id) {
    if (!jobOn(id)) return null;
    const st = js(id), J = C().jobs[id], early = !st.rank && LIFE.band() < minOf(id);
    const sub = st.rank ? `${B[st.rank]} · ${shiftsLeft(st)} of ${SHIFTS} shifts left today` : early ? `from ${B[minOf(id)]} (your level is ${B[LIFE.level()]})` : st.tries && RETRY - (LIFE.now() - st.last) > 0 ? `try again in about ${LIFE.mins(RETRY - (LIFE.now() - st.last))} min` : 'help wanted: a short interview';
    return { label: st.rank ? `${ICON[id]} Work at ${P(J.title[0])}` : `${ICON[id]} The job at ${P(J.title[0])}`, sub, run: () => menu(id) };
  }
  async function menu(id) {
    const J = C().jobs[id]; if (!J || !jobOn(id)) return;
    const s = LIFE.S(); s.jobsSeen = true;
    for (let guard = 0; guard < 4; guard++) {
      const st = js(id), lv = LIFE.band(), opts = [];
      if (!st.rank) {
        const wait = RETRY - (LIFE.now() - st.last);
        if (lv < minOf(id)) opts.push({ label: 'Apply for the job', sub: `this job hires from ${B[minOf(id)]}: your level is ${B[LIFE.level()]}`, value: 'early' });
        else if (st.tries && wait > 0) opts.push({ label: 'Apply for the job', sub: `${bossOf(id).name} said to come back in about ${LIFE.mins(wait)} min`, value: 'wait' });
        else opts.push({ label: 'Apply for the job', sub: `a short interview in ${LIFE.LANGNAME[L()] || 'the language'}, at your level (${B[lv]}) · ${SLOTS[lv].length} questions`, value: 'apply' });
      } else {
        const left = shiftsLeft(st);
        opts.push(left > 0 ? { label: 'Work a shift', sub: `${left} of ${SHIFTS} left today · about ${PAY[st.rank]} coins · ${B[st.rank]}`, value: 'shift' }
          : { label: 'Work a shift', sub: `that’s all for today: the next work day starts in about ${LIFE.mins(LIFE.dayLeft())} min`, value: 'tired' });
        if (canPromote(st)) opts.push({ label: `Ask for a promotion (${B[st.rank + 1]})`, sub: 'an interview one level up: better pay, harder customers', value: 'promo' });
      }
      opts.push({ label: 'About the job', value: 'about' });
      const v = await choose(`${bossOf(id).name} · ${P(J.title[0])}`, opts);
      if (!v) return;
      if (v === 'apply') return interview(id, lv);
      if (v === 'promo') return interview(id, Math.min(4, js(id).rank + 1), true);
      if (v === 'shift') return shift(id);
      if (v === 'about') { await bossSay(id, 'about', `<p class="lf-note">Pay: ${PAY.slice(1).map((p, i) => `${B[i + 1]} ${p}`).join(' · ')} coins a shift, more for good answers. Up to ${SHIFTS} shifts a work day (20 minutes of play, or a new day).</p>`); continue; }
      if (v === 'wait') { await bossSay(id, 'retry'); return; }
      if (v === 'tired') { await bossSay(id, 'tired'); return; }
      if (v === 'early') { await bossSay(id, 'early', `<p class="lf-note">This job hires from ${E(B[minOf(id)])}. Letters, debates and the other jobs all raise your level.</p>`); return; }
    }
  }

  // ------------------------------------------------------------ the interview (TALK.play at your band)
  const SLOTS = { 1: ['intro', 'days', 'why'], 2: ['intro', 'past', 'times', 'why'], 3: ['intro', 'past', 'times', 'why', 'situation'], 4: ['past', 'times', 'why', 'hypo', 'whyYou'] };
  const OWN = ['why', 'situation', 'hypo'];
  function bankFor(id, slot, b) {
    const J = C().jobs[id] || {}, I = C().interview || {};
    const src = OWN.includes(slot) && J[slot] ? J[slot] : I[slot];
    if (!src) return [];
    for (let x = b; x >= 1; x--) if (src[x] && src[x].length) return src[x];
    for (let x = b + 1; x <= 4; x++) if (src[x] && src[x].length) return src[x];
    return [];
  }
  function defaultReact() {
    const R = (C().interview || {}).react || {};
    return [{ if: { grade: ['S', 'A'] }, say: { any: R.good || [['Muy bien.', 'Very good.']] } }, { say: { any: R.ok || [['Ajá.', 'I see.']] } }];
  }
  // one variant per slot; a retry avoids the one asked last time
  function draw(id, b, st) {
    const out = [];
    for (const slot of SLOTS[b]) {
      const bank = bankFor(id, slot, b); if (!bank.length) continue;
      const k = slot + b, last = st.used[k];
      let i = Math.floor(Math.random() * bank.length); if (bank.length > 1 && i === last) i = (i + 1) % bank.length;
      st.used[k] = i;
      const tn = Object.assign({}, bank[i], { id: slot, band: b });
      if (!tn.react) tn.react = defaultReact();
      out.push(tn);
    }
    return out;
  }
  const MARK = { reason: { es: '«porque…»', pt: '«porque…»', de: '«weil…»', zh: '«因为…»', ja: '«…から»' }, opinion: { es: '«creo que…»', pt: '«acho que…»', de: '«ich finde…»', zh: '«我觉得…»', ja: '«…と思います»' },
    compare: { es: '«más… que…»', pt: '«mais… do que…»', de: '«…er als…»', zh: '«比…»', ja: '«…より…»' }, hypo: { es: '«yo… haría»', pt: '«eu… faria»', de: '«ich würde…»', zh: '«如果…就…»', ja: '«…たら»' } };
  function workOn(log) {
    const out = new Set(), l = L();
    for (const x of log) for (const c of x.errors || []) {
      if (c === 'want.reason') out.add(`Give a reason: ${MARK.reason[l]}`);
      else if (c === 'want.opinion') out.add(`Say what you think: ${MARK.opinion[l]}`);
      else if (c === 'want.compare') out.add(`Compare: ${MARK.compare[l]}`);
      else if (c === 'want.time') out.add('Use the time the question asks about: the past for experience, the future for plans, the conditional for «what would you do».');
      else if (c === 'want.min') out.add('Say a little more: a whole sentence or two.');
      else { const fam = String(c).split('.')[0], w = EXAM._.WHERE && EXAM._.WHERE[fam]; if (w && !['accent', 'bridge', 'spell'].includes(fam)) out.add(w); }
    }
    if (log.some(x => x.grade === 'D')) out.add('When you don’t follow a question, try the help (Tab): a way to start, an example, then a model.');
    return [...out].slice(0, 4);
  }
  async function interview(id, b, promo) {
    const J = C().jobs[id], st = js(id), I = C().interview || {};
    b = Math.max(minOf(id), Math.min(4, b));
    const turns = draw(id, b, st);
    if (!turns.length) return;
    const boss = bossOf(id);
    const sc = { id: `job.${id}.${b}`, band: b, title: { en: `${promo ? 'Promotion' : 'Job'} interview · ${EN[id]}` },
      open: LIFE.lines((J.lines || {})[promo ? 'promo' : 'open'] || (J.lines || {}).open || []), turns, close: LIFE.lines((J.lines || {}).close || I.close || []) };
    const n0 = TALK._.T.log.length;
    let res = null;
    try { res = await TALK.play(sc, { person: { name: boss.name, look: boss.look } }); } catch (e) { console.error('[jobs] interview', e); }
    if (!res || res.quit || !(res.grades || []).length) return null;
    const log = TALK._.T.log.slice(n0), pts = res.grades.map(g => (EXAM.TURN_PTS || {})[g] || 0), avg = pts.reduce((a, x) => a + x, 0) / Math.max(1, pts.length);
    const gaveUp = log.filter(x => x.grade === 'D').length;
    const pass = avg >= 3.5 && gaveUp <= 1;
    st.tries++; st.last = LIFE.now(); st.lastBand = b;
    const row = `<div style="margin:8px 0">${res.grades.map(g => `<span class="lf-grade g-${E(g)}" style="margin-right:4px">${E(g)}</span>`).join('')} <span class="lf-note">average ${Math.round(avg * 10) / 10} of 5 (a pass is 3.5)</span></div>`;
    if (pass) {
      const first = !Object.values(LIFE.S().jobs).some(j => j && j.rank > 0);
      st.rank = Math.max(st.rank, b); st.hiredDay = LIFE.day();
      let extra = '';
      if (first) { LIFE.coins(10); const nm = LIFE.cosmetic('life.badge'); extra = `<div class="lf-gift">🪙 10 coins to start${nm ? ` · for ${E(G.state.mimoName || 'Mimo')}: ${E(nm.en || 'a staff badge')} (People page)` : ''}</div>`; }
      LIFE.save();
      await bossSay(id, promo ? 'promoted' : 'hired', row + `<p><b>${promo ? 'Promoted' : 'Hired'}: ${E(B[b])}.</b> Work a shift from ${E(boss.name)}’s menu: about ${PAY[b]} coins each, up to ${SHIFTS} a work day.</p>` + extra, [{ label: 'Great!', value: 'ok', main: true }]);
      return true;
    }
    LIFE.save();
    const wk = workOn(log);
    await bossSay(id, 'notYet', row + (wk.length ? `<div class="lf-box"><b>What to work on</b>${wk.map(x => `<p class="lf-note" style="margin:3px 0">• ${E(x)}</p>`).join('')}</div>` : '') + `<p class="lf-note">You can try again in about ${LIFE.mins(RETRY)} minutes of play, with other questions.</p>`, [{ label: 'I’ll come back', value: 'ok', main: true }]);
    return false;
  }

  // ------------------------------------------------------------ shifts
  const R = n => Math.floor(Math.random() * n);
  const pickN = (list, n) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  const S0 = () => C().shifts || {};
  const people = id => (S0()[id] && S0()[id].people) || [];
  const someone = (id, i) => { const ps = people(id); return ps.length ? ps[i % ps.length] : { name: '', look: null }; };
  const fillL = (x, vars) => LIFE.line(x, vars);
  const want = (w, vars) => { if (!w) return { any: true }; const o = Object.assign({}, w); for (const [k, v] of Object.entries(o)) if (typeof v === 'string' && v[0] === '@') { const n = vars[v.slice(1)]; o[k] = typeof n === 'number' ? [n, n] : n; } return o; };
  // numbers as words where the language writes them out in a model sentence (es / pt / de); digits in zh / ja
  function num(n, g) {
    const l = L();
    if (LIFE.isC(l) || n > 20) return String(n);
    try { return SHOP.numWord(n, l, g || 'f'); } catch (e) { return String(n); }
  }
  // ---------- the bakery
  const GOODS = ['w.bread', 'w.cake', 'w.cookie'];
  const EN_NOUN = { 'w.bread': ['loaf of bread', 'loaves of bread'], 'w.cake': ['cake', 'cakes'], 'w.cookie': ['cookie', 'cookies'] };
  const ZH_NUM = ['零', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十'], ZH_PY = ['líng', 'yī', 'liǎng', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ', 'shí'];
  const JA_NUM = ['', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'];
  function itemText(id, n) {
    const l = L(), G2 = (C().goods || {})[id] || {};
    if (l === 'zh') return `[${ZH_NUM[n]}|${ZH_PY[n]}] ${G2.cl || '[个|gè]'} ${G2.w || ''}`.trim();
    if (l === 'ja') return `${G2.w || ''} を ${JA_NUM[n]}`.trim();
    const it = LEX.item(id) || {}, g = (it.g && it.g[l]) || 'm';
    const noun = n === 1 ? it[l] : ((it.pl && it.pl[l]) || it[l]);
    let w = ''; try { w = SHOP.numWord(n, l, g, 'acc'); } catch (e) { w = String(n); }
    return `${w} ${noun}`;
  }
  function orderLine(items) {
    const l = L(), sh = S0().bakery || {}, and = sh.and || ' y ';
    const parts = items.map(x => itemText(x.id, x.n));
    const t = parts.length > 1 ? parts.slice(0, -1).join(LIFE.isC(l) ? ' ' + (sh.comma || '、') + ' ' : ', ') + and + parts[parts.length - 1] : parts[0];
    const ep = items.map(x => `${x.n} ${x.n === 1 ? EN_NOUN[x.id][0] : EN_NOUN[x.id][1]}`);
    return { t, en: ep.length > 1 ? ep.slice(0, -1).join(', ') + ' and ' + ep[ep.length - 1] : ep[0] };
  }
  function anOrder(b) {
    const k = b <= 1 ? 1 + R(2) : 2 + (Math.random() < 0.35 ? 1 : 0), maxN = b <= 1 ? 3 : 4;
    const items = pickN(GOODS, Math.min(k, GOODS.length)).map(id => ({ id, n: 1 + R(maxN) }));
    // (never a total of one coin: «son una monedas» isn't a sentence anyone says)
    if (items.reduce((a, x) => a + x.n * (SHOP.PRICE[x.id] || 0), 0) < 2) items[0].n = 2;
    return items;
  }
  const totalOf = items => items.reduce((a, x) => a + x.n * (SHOP.PRICE[x.id] || 0), 0);
  function sayBack(items, text) {
    let r = null; try { r = SHOP.parse(text, L(), 'bakery', {}); } catch (e) { r = null; }
    if (!r || !(r.items || []).length) return { understood: false, note: 'Say what they ordered: how many, and what.' };
    const want = new Map(items.map(x => [x.id, x.n])), got = new Map(); for (const it of r.items) got.set(it.id, (got.get(it.id) || 0) + (it.n || 1));
    const same = want.size === got.size && [...want].every(([k, v]) => got.get(k) === v);
    if (!same) return { understood: true, wrong: true, note: 'That’s not quite what they ordered: listen again (🔊).' };
    const errs = (r.errors || []).filter(e => e && e.kind !== 'polite' && e.kind !== 'bossy');
    let fixed = text; for (const e of errs) if (e.typed && e.fix) fixed = fixed.replace(e.typed, e.fix);
    return { understood: true, grade: errs.length > 1 ? 'C' : errs.length ? 'B' : 'S', fixed, tips: errs.length && r.why ? [r.why] : [] };
  }
  const idkOnly = text => { try { return EXAM._.idkOnly(text, L()); } catch (e) { return false; } };
  // a time (the ferry): «a las cuatro y media», «16:30» (the pack reads 16.5) and «las 4» all say the hour
  // (zh / ja: an hour in Han numerals before 点 / 時 is read here too: the pack reads «十一点» as 十 + 一点, «a little»)
  const HAN = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  function hanHours(text) {
    if (!LIFE.isC()) return [];
    let s = String(text || ''); try { s = CJK.chars(s, { lang: L() }); } catch (e) { /* typed text stays as it is */ }
    const out = [];
    for (const m of s.matchAll(/([零〇一二两三四五六七八九十]{1,3})\s*[点點時时]/g)) {
      const t = m[1], k = t.indexOf('十');
      const n = k < 0 ? HAN[t] : (k === 0 ? 1 : HAN[t[0]]) * 10 + (t[k + 1] ? HAN[t[k + 1]] : 0);
      if (Number.isFinite(n)) out.push(n);
    }
    return out;
  }
  function timeJudge(h) {
    return (text, o) => {
      if (idkOnly(text)) return { understood: false };
      let r = null; try { r = TALK.judge(text, { number: true }, { band: o.band, help: Math.min(o.help, 2), shown: o.help >= 2 }); } catch (e) { r = null; }
      const hh = hanHours(text);
      if ((!r || !r.understood) && hh.length) r = { understood: true, grade: 'A', numbers: [] };
      if (!r || !r.understood) return { understood: false, note: 'Say the time.' };
      const ok = (r.numbers || []).concat(hh).some(n => [h, h % 12 || 12].includes(Math.floor(n)));
      return ok ? r : { understood: true, wrong: true, note: 'Look at the time again on the board.' };
    };
  }
  function totalJudge(total) {
    return (text, o) => {
      if (idkOnly(text)) return { understood: false };
      let r = null; try { r = TALK.judge(text, { number: true }, { band: o.band, help: Math.min(o.help, 2), shown: o.help >= 2 }); } catch (e) { r = null; }
      if (!r || !r.understood) return { understood: false, note: 'Say the total in coins.' };
      if (!(r.numbers || []).includes(total)) return { understood: true, wrong: true, note: 'Not quite: add it up again (the prices are on the board).' };
      return r;
    };
  }
  function bakeryBoard() {
    const sh = S0().bakery || {}, bd = sh.board || {};
    const rows = GOODS.map(id => { const it = LEX.item(id) || {}, n = SHOP.PRICE[id] || 0; return `<tr><td>${LIFEUI.tl(LIFE.isC() ? ((C().goods || {})[id] || {}).w || it[L()] : it[L()])}</td><td class="big">${n}</td><td>${LIFEUI.tl(n === 1 ? (bd.coin || ['moneda'])[0] : (bd.coins || ['monedas'])[0])}</td></tr>`; }).join('');
    return `<h4>${LIFEUI.tl((bd.title || ['Precios'])[0])}</h4><table>${rows}</table>`;
  }
  function bakeryTasks(b) {
    const sh = S0().bakery || {}, tasks = [], n = b <= 1 ? 2 : 3, board = bakeryBoard();
    for (let i = 0; i < n; i++) {
      const who = Object.assign({ voice: { pitch: 0.9 + (i % 3) * 0.15 } }, someone('bakery', i + R(3)));
      const first = anOrder(b), o1 = orderLine(first);
      const greet = LIFE.line(LIFE.pick(sh.greet || []) || ['¡Hola!', 'Hi!']), req = fillL(LIFE.pick(sh.order || []) || ['Quiero {order}, por favor.', 'I’d like {order}, please.'], { order: o1 });
      const back = sh.back || {};
      tasks.push({ kind: 'say', who, lines: [greet, req].filter(Boolean), listen: b >= 3, board, goal: back.goal || 'Say the order back, to check it.', judge: (text) => sayBack(first, text),
        starter: back.starter ? fillL(back.starter, { order: o1 }) : null, model: fillL(back.model || ['{order}, ¿verdad?', '{order}, right?'], { order: o1 }), after: LIFE.line(LIFE.pick(back.yes || []) || null) });
      let items = first;
      if (b >= 3 && i === 1 && sh.change) {
        const second = anOrder(b), o2 = orderLine(second); items = second;
        tasks.push({ kind: 'say', who, lines: [fillL(LIFE.pick(sh.change), { order: o2 })], listen: true, board, goal: back.goal2 || 'They changed their mind: say the new order back.', judge: (text) => sayBack(second, text),
          model: fillL(back.model || ['{order}', '{order}'], { order: o2 }), after: LIFE.line(LIFE.pick(back.yes || []) || null) });
      }
      const tot = totalOf(items), tt = sh.total || {};
      tasks.push({ kind: 'say', who, lines: [LIFE.line(LIFE.pick(tt.ask || []) || ['¿Cuánto es?', 'How much is it?'])], board, goal: tt.goal || 'Tell them the total, in coins.', judge: totalJudge(tot),
        starter: tt.starter ? LIFE.line(tt.starter) : null, model: fillL(tt.model || ['Son {total} monedas.', 'That’s {total} coins.'], { total: { t: num(tot), en: String(tot) } }), after: LIFE.line(LIFE.pick(tt.after || []) || null) });
    }
    const extra = [];
    if (b >= 3 && (sh.recommend || []).length) extra.push(Object.assign({ kind: 'say' }, specTask(LIFE.pick(sh.recommend), {}, someone('bakery', 5), board)));
    if (b >= 4 && (sh.complaint || []).length) extra.push(Object.assign({ kind: 'say' }, specTask(LIFE.pick(sh.complaint), {}, someone('bakery', 6), board)));
    return tasks.concat(extra);
  }
  // a content task ({ ask, goal, want, starter, model, after, listen }) with its vars filled
  function specTask(sp, vars, who, board) {
    const clock = sp.clock === '@hour' ? vars.hour : sp.clock;
    return { kind: 'say', who: who || {}, lines: LIFE.lines(sp.ask, vars), listen: !!sp.listen, board, goal: sp.goal, want: want(sp.want, vars), judge: clock ? timeJudge(clock) : undefined,
      starter: sp.starter ? fillL(sp.starter, vars) : null, model: fillL(sp.model, vars), after: sp.after ? LIFE.line(LIFE.pick(Array.isArray(sp.after[0]) ? sp.after : [sp.after]), vars) : null, tips: sp.tips };
  }
  // ---------- the library
  function libraryTasks(b) {
    const sh = S0().library || {}, secs = sh.sections || [], books = (sh.books || []).filter(x => (x.band || 1) <= Math.max(2, b + 1) && (x.band || 1) >= Math.max(1, b - 2));
    const pool = books.length >= 4 ? books : sh.books || [];
    const boss = bossOf('library'), tasks = [];
    const opts = secs.map(s => ({ html: LIFEUI.tl(LIFE.line(s.name).t), value: s.id }));
    for (const bk of pickN(pool, b <= 2 ? 4 : 5)) {
      const t = LIFE.line(bk.t), bl = LIFE.line(bk.blurb);
      tasks.push({ kind: 'pick', skill: 'read', who: boss, lines: [LIFE.line(LIFE.pick(sh.pick || []) || ['¿Dónde va este?', 'Where does this one go?'])], goal: (sh.pickGoal || 'Read the title and the back cover, then pick its shelf.'),
        prompt: `<div class="lf-box" style="background:#fffdf6"><b style="font-size:18px">«${LIFEUI.glossHTML(t.t)}»</b><div style="margin-top:4px">${LIFEUI.glossHTML(bl.t)}</div></div>`, options: opts, answer: bk.s, hint: 'Look at what the back cover is about.' });
    }
    const s = LIFE.pick(secs.filter(x => x.key));
    if (s && sh.answer) {
      const vars = { section: LIFE.frag(s.name), where: LIFE.frag(s.where) };
      const map = `<h4>${LIFEUI.tl(((sh.board || {}).title || ['El mapa', 'The map'])[0])}</h4><table>${secs.map(x => `<tr><td><b>${LIFEUI.tl(LIFE.line(x.name).t)}</b></td><td>${LIFEUI.tl(LIFE.line(x.where).t)}</td></tr>`).join('')}</table>`;
      tasks.push(Object.assign(specTask({ ask: LIFE.pick(sh.ask || []), goal: sh.answer.goal, want: { lemmas: s.key }, starter: sh.answer.starter, model: sh.answer.model, after: sh.answer.after }, vars, someone('library', R(4)), map), { kind: 'say' }));
    }
    return tasks;
  }
  // ---------- the inn
  function innTasks(b) {
    const sh = S0().inn || {}, price = sh.price || 5, rooms = sh.rooms || 6;
    const free = pickN(Array.from({ length: rooms }, (_, i) => i + 1), 2).sort((a, c) => a - c), nights = 2 + R(3);
    const vars = { room: free[0], room2: free[1], nights, total: nights * price, price };
    const bd = sh.board || {};
    const ledger = `<h4>${LIFEUI.tl((bd.title || ['Recepción'])[0])}</h4><table>${Array.from({ length: rooms }, (_, i) => i + 1).map(k => `<tr><td>${LIFEUI.tl((bd.room || ['Habitación'])[0])} ${k}</td><td>${free.includes(k) ? `<b style="color:#2f8f4e">${LIFEUI.tl((bd.free || ['libre'])[0])}</b>` : LIFEUI.tl((bd.taken || ['ocupada'])[0])}</td></tr>`).join('')}</table>`
      + `<p class="big" style="margin:6px 0 2px">${price} ${LIFEUI.tl((bd.night || ['monedas por noche'])[0])}</p><p>${LIFEUI.tl((bd.breakfast || [''])[0])}</p>`;
    const list = (sh.tasks || []).filter(t => (t.band || 1) <= b);
    const must = list.filter(t => t.core), rest = pickN(list.filter(t => !t.core), Math.max(0, (b <= 1 ? 3 : 4) - must.length));
    return must.concat(rest).map((t, i) => specTask(t, vars, someone('inn', i + R(2)), ledger));
  }
  // ---------- the ferry
  const hm = (h, m) => `${h}:${String(m).padStart(2, '0')}`;
  function ferryTasks(b) {
    const sh = S0().ferry || {}, times = sh.times || [[9, 0], [11, 30], [14, 0], [16, 30], [19, 0]], fares = sh.fares || { one: 3, ret: 5, kid: 1 };
    const k = 1 + R(times.length - 2), now = times[k - 1], nowM = now[1] + 15 >= 60 ? [now[0] + 1, now[1] - 45] : [now[0], now[1] + 15];
    const next = times[k], cancel = times[Math.min(times.length - 1, k + 1)];
    const adults = 2 + R(2), kids = 2 + R(2);       // (never «1 niños»: the ask says the number as digits before a plural)
    const vars = { now: hm(nowM[0], nowM[1]), time: hm(next[0], next[1]), hour: next[0], cancel: hm(cancel[0], cancel[1]), one: fares.one, ret: fares.ret, kid: fares.kid, adults, kids, group: adults * fares.one + kids * fares.kid };
    const bd = sh.board || {};
    const board = `<h4>${LIFEUI.tl((bd.title || ['Horario'])[0])}</h4><p>${LIFEUI.tl((bd.now || ['Ahora:'])[0])} <b class="big">${vars.now}</b></p><table>${times.map(t => `<tr><td class="big">${hm(t[0], t[1])}</td><td>${LIFEUI.tl((bd.to || ['a la isla'])[0])}</td><td>${b >= 3 && t === cancel ? `<b style="color:#c2412f">${LIFEUI.tl((bd.cancelled || ['cancelado: niebla'])[0])}</b>` : ''}</td></tr>`).join('')}</table>`
      + `<table style="margin-top:6px"><tr><td>${LIFEUI.tl((bd.one || ['ida'])[0])}</td><td class="big">${fares.one}</td></tr><tr><td>${LIFEUI.tl((bd.ret || ['ida y vuelta'])[0])}</td><td class="big">${fares.ret}</td></tr><tr><td>${LIFEUI.tl((bd.kid || ['niños, ida'])[0])}</td><td class="big">${fares.kid}</td></tr></table>`;
    const list = (sh.tasks || []).filter(t => (t.band || 1) <= b);
    const must = list.filter(t => t.core), rest = pickN(list.filter(t => !t.core), Math.max(0, (b <= 1 ? 3 : 4) - must.length));
    return must.concat(rest).map((t, i) => specTask(t, vars, someone('ferry', i + R(2)), board));
  }
  // ---------- the post office
  function postTasks(b) {
    const sh = S0().post || {}, streets = sh.streets || [], towns = sh.towns || [], names = sh.names || [];
    const boxes = streets.map(s => ({ id: 'alba:' + s.id, label: LIFE.line(s.box || s.name) })).concat(towns.map(t => ({ id: t.id, label: LIFE.line(t.name) })));
    const opts = boxes.map(x => ({ html: LIFEUI.tl(x.label.t), value: x.id }));
    const tasks = [], boss = bossOf('post');
    for (let i = 0; i < (b <= 2 ? 5 : 6); i++) {
      const inAlba = Math.random() < 0.55 || !towns.length, nm = LIFE.pick(names) || 'Ana', no = 1 + R(40);
      let lines, answer;
      // (zh / ja write the number after the street with its counter: «北街12号», «北通り12番地»; names and towns are in the notation)
      const addr = x => (LIFE.isC() ? `${P(LIFE.line(x).t)}${no}${sh.no ? P(LIFE.line(sh.no).t) : ''}` : `${P(LIFE.line(x).t)} ${no}`);
      if (inAlba) { const s = LIFE.pick(streets); lines = [P(nm), addr(s.name), P(LIFE.line(sh.alba || ['Alba', 'Alba']).t)]; answer = 'alba:' + s.id; }
      else { const t = LIFE.pick(towns); lines = [P(nm), addr(LIFE.pick(t.streets || [['Calle Mayor', 'Main Street']])), P(LIFE.line(t.name).t)]; answer = t.id; }
      tasks.push({ kind: 'pick', skill: 'read', who: boss, lines: [LIFE.line(LIFE.pick(sh.pick || []) || ['¿Y esta carta?', 'And this letter?'])], goal: sh.pickGoal || 'Read the address, then put the letter in its pigeonhole.',
        prompt: `<div class="lf-box" style="background:#f7ecd2;font:600 18px/1.5 Georgia,serif;max-width:340px">${lines.map(x => E(x)).join('<br>')}</div>`, options: opts, answer, hint: 'Read the street, or the town, on the last lines.' });
    }
    const t = LIFE.pick(towns.filter(x => (sh.rates || {})[x.id])), kg = 2 + R(4);      // (2 to 5 kilos: never «1 kilos»)
    if (t && sh.parcel) {
      const rate = sh.rates[t.id], price = kg <= 2 ? rate[0] : rate[1];
      const vars = { town: LIFE.frag(t.name), kg, price };
      const bd = sh.board || {};
      const card = `<h4>${LIFEUI.tl((bd.title || ['Tarifas'])[0])}</h4><table><tr><th></th><th>${LIFEUI.tl((bd.small || ['hasta 2 kg'])[0])}</th><th>${LIFEUI.tl((bd.big || ['más de 2 kg'])[0])}</th></tr>${towns.filter(x => sh.rates[x.id]).map(x => `<tr><td>${LIFEUI.tl(LIFE.line(x.name).t)}</td><td class="big">${sh.rates[x.id][0]}</td><td class="big">${sh.rates[x.id][1]}</td></tr>`).join('')}</table>`;
      tasks.push(specTask(Object.assign({}, sh.parcel, { want: { number: '@price' } }), vars, someone('post', R(4)), card));
    }
    return tasks;
  }
  // ---------- the visitors' desk (interp): one English bank, the same facts in every language (content: shifts.interp)
  // the visitors (English speakers passing through) and their cases: { id, band, to (who answers: clerk · inn · ferry ·
  // library · bakery, from shifts.interp.to), vis, en (what they say), need (each part a full request carries, for the tip;
  // the content's `needs` are the same parts as lemma groups), opts ([right, wrong, wrong]: what you tell them back) }
  const VIS = {
    ellen: { name: 'Ellen', role: 'a hiker', look: { skin: '#f0c7a0', hair: '#c98a4a', hairdo: 'pony', dress: '#2f8f4e', hat: 'cap', hatColor: '#e0743c' } },
    okafor: { name: 'Mr Okafor', role: 'a dad, off the morning train', look: { skin: '#6b4a32', hair: '#1f1a1a', hairdo: 'short', dress: '#3f6fb5' } },
    priya: { name: 'Priya', role: 'a student on a walking trip', look: { skin: '#b07850', hair: '#1f1a1a', hairdo: 'long', dress: '#8a4f7d', glasses: true } },
    walt: { name: 'Walt', role: 'a retired birdwatcher', look: { skin: '#f0c7a0', hair: '#d8d8d8', hairdo: 'short', dress: '#7a5236', hat: 'flat', old: true } },
    jo: { name: 'Jo', role: 'a parent on holiday', look: { skin: '#e6b48c', hair: '#5a3a22', hairdo: 'bun', dress: '#e6a92e' } },
    sam: { name: 'Sam', role: 'a backpacker', look: { skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#c2412f' } },
    noor: { name: 'Noor', role: 'a very tired traveler', look: { skin: '#c98e62', hair: '#1f1a1a', hairdo: 'long', dress: '#21a493' } },
    tom: { name: 'Tom', role: 'a traveler with a train to catch', look: { skin: '#f0c7a0', hair: '#8a5a2c', hairdo: 'short', dress: '#5b8fd6', beard: true } },
    lind: { name: 'Mr Lindqvist', role: 'a dad with a birthday cake', look: { skin: '#f0c7a0', hair: '#e6c46a', hairdo: 'short', dress: '#7a2f45', glasses: true } },
  };
  const CASES = [
    { id: 'room', band: 3, to: 'inn', vis: 'ellen', en: 'Hi! Could you ask if the inn has a room for two nights? It’s just for me.', need: ['a room', 'for two nights'],
      opts: ['Yes: room 4 is free, at 5 coins a night with breakfast.', 'Sorry: the inn is full for the next two nights.', 'Room 4 is free, but breakfast costs extra.'] },
    { id: 'ferry', band: 3, to: 'ferry', vis: 'okafor', en: 'When does the next ferry to Lighthouse Island leave? And can we bring our bikes?', need: ['when the next ferry leaves', 'the bikes'],
      opts: ['At four o’clock, and bikes travel free.', 'At four o’clock, but bikes aren’t allowed on board.', 'Not until tomorrow morning, and bikes cost two coins.'] },
    { id: 'umbrella', band: 3, to: 'clerk', vis: 'priya', en: 'I left my blue umbrella in the square this morning. Has anyone handed one in?', need: ['an umbrella', 'that it’s blue'],
      opts: ['Yes: a blue one was handed in, and you can pick it up here at the counter.', 'No umbrellas have been handed in today.', 'Someone handed in a red umbrella, not a blue one.'] },
    { id: 'books', band: 3, to: 'library', vis: 'walt', en: 'Can I borrow books from the library? I’m only staying in Alba for a week.', need: ['borrowing books', 'only a week'],
      opts: ['Yes: they’ll make you a visitor’s card; just tell them where you’re staying.', 'No: only people who live in Alba can borrow books.', 'Yes, but it costs ten coins a week.'] },
    { id: 'nuts', band: 3, to: 'bakery', vis: 'jo', en: 'Does the bakery have any bread without nuts? My son is allergic.', need: ['bread', 'without nuts', 'the allergy'],
      opts: ['Yes: the white bread and the corn bread have no nuts, but the cakes do.', 'No: all their bread has nuts in it.', 'Only the cakes are made without nuts.'] },
    { id: 'stamp', band: 3, to: 'clerk', vis: 'sam', en: 'I’d like to send this postcard abroad, to Canada. How much is a stamp?', need: ['the postcard', 'how much the stamp is'],
      opts: ['Three coins to go abroad; if it’s posted before five today, it leaves tomorrow.', 'Two coins, and it leaves next week.', 'They can’t send post abroad from here.'] },
    // B2: a stressed visitor (gently: tired or worried, never angry). Say it kindly, and soften it: «¿Sería posible…?»
    { id: 'noise', band: 4, to: 'inn', vis: 'noor', en: 'I’m so sorry to bother you, but I really can’t sleep: there’s music in the room next door every night. Would it be possible to change rooms?', need: ['the music next door', 'not sleeping', 'changing rooms'],
      opts: ['Marisa is very sorry: you’ll get room 6, the quietest one, and tomorrow’s breakfast is free.', 'There are no other rooms, but Marisa will talk to the neighbors.', 'Room 6 is free, but you’ll have to pay for breakfast.'] },
    { id: 'cancel', band: 4, to: 'ferry', vis: 'tom', en: 'The morning ferry was cancelled, and I’m worried I’ll miss my train. Is there any other way to get across today?', need: ['the cancelled ferry', 'another way across today'],
      opts: ['The mail boat leaves at twelve, and Bartolo will ask the mail carrier to take you.', 'There’s no way across until tomorrow.', 'The ferry has simply moved to twelve o’clock.'] },
    { id: 'cake', band: 4, to: 'bakery', vis: 'lind', en: 'I ordered a birthday cake for today, but it says «Happy birthday, Pedro», and my son is called Leo! Could anything be done?', need: ['the birthday cake', 'the wrong name'],
      opts: ['It was Marta’s mistake: come back in half an hour for «Leo» in chocolate, plus free cookies.', 'They can’t change the cake, but they’ll give the money back.', 'Come back tomorrow for a brand-new cake.'] },
  ];
  // a softened request (B2's stressed visitors): a conditional, «could you…», «sorry to…»
  const POLITE = { es: /\b(podr[ií]a[ns]?|ser[ií]a|habr[ií]a|quisiera|le importar[ií]a|disculpe|perdone|perd[oó]n)\b/i,
    pt: /\b(poderia[m]?|seria|haveria|gostaria|desculpe|com licen[cç]a|por gentileza)\b/i,
    de: /\b(k[öo]nnten?|w[äa]re|w[üu]rden?|h[äa]tten?|entschuldigung|entschuldigen|verzeihung|tut mir leid)\b/i,
    zh: /(能不能|可不可以|可以.*吗|麻烦|请问|不好意思|打扰|对不起|nengbuneng|keyi|mafan|qingwen|buhaoyisi|darao|duibuqi)/i,
    ja: /(いただけ|いただきたい|もらえ|くださいません|でしょうか|ませんか|すみません|申し訳|恐れ入り|itadake|moraema|deshouka|masenka|sumimasen|moushiwake)/i };
  // (the tip, in CJK.md notation for zh / ja: P() shows it in the player's script)
  const SOFT = { es: 'Disculpe, ¿sería posible…?', pt: 'Desculpe, seria possível…?', de: 'Entschuldigung, wäre es möglich, …?', zh: '[不好意思|bù hǎo yì si] ， [能不能|néng bù néng] …… ？', ja: 'すみません 、 … て いただけません か' };
  const politeOK = (text, l = L()) => { const p = POLITE[l]; if (!p) return true; let s = String(text || ''); if (LIFE.isC(l)) { try { s += ' ' + CJK.canon(s, l); } catch (e) { /* */ } } return p.test(s); };
  function official(k) {
    const o = ((S0().interp || {}).to || {})[k] || {};
    let look = o.look || null, name = o.name ? P(o.name) : '';
    if (o.who === 'clerk') { const c = C().clerk || {}; look = look || c.look || null; name = name || P(c.name || ''); }
    else if (o.who) { try { look = look || TALK.lookOf(o.who); if (!name) name = P(TALK.nameOf(o.who)); } catch (e) { /* */ } }
    const pl = o.place ? LIFE.frag(o.place) : null;
    return { name, look, role: pl ? P(pl.t) : '', placeEn: pl ? pl.en : '', phone: !!o.phone, hello: o.hello || null, voice: o.voice };
  }
  function interpJudge(cs, L2, b) {
    return (text, o) => {
      if (idkOnly(text)) return { understood: false };
      let r = null; try { r = TALK.judge(text, { any: true }, { band: o.band, help: Math.min(o.help, 2), shown: o.help >= 2, bridge: false }); } catch (e) { r = null; }
      if (!r || !r.understood) return { understood: false, note: `Say what they need in ${LIFE.LANGNAME[L()] || 'the language'}.` };
      const miss = [];
      (L2.needs || []).forEach((g, i) => { let m = null; try { m = TALK.judge(text, { lemmas: g }, { band: o.band, bridge: false }); } catch (e) { m = null; } if (!(m && m.understood && m.met)) miss.push(cs.need[i] || 'a part of it'); });
      if (miss.length) return { understood: true, wrong: true, note: `Pass on everything they asked: ${miss.join(', ')}.` };
      if (cs.band >= 4 && !politeOK(text) && ['S', 'A'].includes(r.grade || 'A')) return Object.assign({}, r, { grade: 'B', note: 'They’re upset: soften it, as a polite request.', tips: [`Soften it: «${P(SOFT[L()] || 'Excuse me, would it be possible…?')}».`].concat(r.tips || []) });
      return r;
    };
  }
  function interpTasks(b, o = {}) {
    const sh = S0().interp || {}, cases = sh.cases || {};
    const pool = CASES.filter(c => cases[c.id] && official(c.to).name), easy = pool.filter(c => c.band <= 3), hard = pool.filter(c => c.band >= 4);
    const picks = o.all ? pool.filter(c => c.band <= b) : b >= 4 && hard.length ? pickN(easy, 2).concat(pickN(hard, 1)) : pickN(easy, 3);
    const tasks = [], lang = LIFE.LANGNAME[L()] || 'the language';
    for (const cs of picks) {
      const L2 = cases[cs.id], off = official(cs.to), vis = VIS[cs.vis] || { name: 'A visitor', role: '' };
      const hello = off.hello ? LIFE.line(off.hello) : null;
      const card = `<h4>🗣 ${E(vis.name)} <span style="font-weight:600;opacity:.7">(${E(vis.role)})</span></h4>`
        + (off.phone ? `<p>☎ You call <b>${E(off.name)}</b> at ${E(off.placeEn || off.role)} on the desk’s phone.</p>${hello ? `<p class="big" style="font-size:16px">«${LIFEUI.tl(hello.t)}»</p><p class="lf-note">${E(hello.en)}</p>` : ''}` : `<p>You turn to <b>${E(off.name)}</b> at ${E(off.placeEn || off.role)}.</p>`);
      tasks.push({ kind: 'say', who: { name: vis.name, look: vis.look, role: vis.role }, lines: [{ t: cs.en, en: '', plain: true }], noSpeak: true, board: card,
        goal: `${off.phone ? '☎ ' : ''}Tell ${off.name} what ${vis.name} needs, in ${lang}${cs.band >= 4 ? ', kindly: they’re upset, so soften it' : ''}.`,
        judge: interpJudge(cs, L2, b), starter: L2.starter ? LIFE.line(L2.starter) : null, model: LIFE.line(L2.model), after: LIFE.line(LIFE.pick(sh.ack || []) || null) });
      const order = pickN([0, 1, 2], 3);
      tasks.push({ kind: 'pick', who: { name: off.name, look: off.look, role: off.role, voice: off.voice }, lines: [LIFE.line(L2.answer)], listen: b >= 4, noEn: true, goal: `Now tell ${vis.name} what ${off.name} said: pick it in English.`,
        options: order.map(i => ({ html: E(cs.opts[i]), value: i })), answer: 0, hint: b >= 4 ? 'Listen again (🔊), or show the words.' : 'Read it again: what did they say?' });
    }
    return tasks;
  }
  // ---------- Radio Alba's news (news): the story of the day (content: shifts.news.stories, the same facts in every language)
  // { id, gate (only while it's true in the save), picks: per interviewee [right, wrong, wrong] in English: what they told you }
  const STORIES = [
    { id: 'bread', picks: [['A new bread from her grandmother’s recipe, with corn and honey: the first batch sold out by nine.', 'A recipe from the city that took her a month to get right.', 'A rye bread with nuts, sold only on Sundays.'],
      ['He queued at seven and it was worth it: he’ll buy more for his grandchildren.', 'He didn’t like it: it’s too sweet.', 'He hasn’t tried it yet.']] },
    { id: 'garden', picks: [['The school garden gave its first harvest: tomatoes and beans; the class will cook soup for the whole school on Friday.', 'The birds ate most of the harvest.', 'They’ll sell all the vegetables at the market.'],
      ['Her bean plant grew taller than she is, and she watered it every morning.', 'She doesn’t like gardening at all.', 'Her tomatoes were the biggest in the valley.']] },
    { id: 'kittens', picks: [['Five kittens were born behind the poetry shelf, and he’s looking for homes for them.', 'A cat has been chewing the library’s books.', 'The library is closing for a week because of the cats.'],
      ['She wants the little gray one, and her parents said yes.', 'She’s allergic to cats.', 'She wants all five kittens.']] },
    { id: 'race', picks: [['The kids’ team won the boat race by one boat length, in borrowed boats.', 'The race was cancelled because of fog.', 'The fishermen’s team won again.'],
      ['He rowed in the same race fifty years ago and came last; he cried with joy today.', 'He thinks the race is too dangerous for kids.', 'He built all the boats himself.']] },
    { id: 'stars', gate: () => !!flags().bartolo, picks: [['From now on, on Saturday nights the ferry will take people to the island to see the stars; kids go free.', 'The ferry will stop running at night.', 'A new, bigger ferry is being built.'],
      ['With no lights on the island you can see the Milky Way, and he’ll bring his telescope for everyone.', 'He’d rather watch the stars from his window.', 'He thinks the trip is too expensive.']] },
    { id: 'festival', gate: () => !!(G && G.state && G.state.ch4 && G.state.ch4.fin && G.state.ch4.fin.speech), picks: [['The Festival of Voices is back, and anyone can sing on the stage, even with mistakes.', 'The festival is cancelled this year.', 'Only trained singers can take part.'],
      ['He’ll sing with his class: he’s nervous, but he can’t wait.', 'He doesn’t like singing.', 'He’ll play the drums instead of singing.']] },
  ];
  const storyOn = s => { try { return !s.gate || !!s.gate(); } catch (e) { return false; } };
  // an open question (B2): what, how, why, when, where, who… (the pack's ids)
  const QIDS = { es: ['es:qué', 'es:cómo', 'es:cuándo', 'es:dónde', 'es:quién', 'es:cuánto', 'es:cuál'], pt: ['pt:que', 'pt:como#q', 'pt:como', 'pt:quando', 'pt:onde', 'pt:quem', 'pt:quanto', 'pt:qual'],
    de: ['de:was', 'de:wie', 'de:warum', 'de:wann', 'de:wo', 'de:wer', 'de:welcher', 'de:wieso', 'de:weshalb', 'de:woher', 'de:wohin'],
    zh: ['zh:什么', 'zh:什么时候', 'zh:怎么', 'zh:怎样', 'zh:为什么', 'zh:哪里', 'zh:哪儿', 'zh:哪个', 'zh:哪些', 'zh:谁', 'zh:多少', 'zh:几', 'zh:怎么样', 'zh:哪'],
    ja: ['ja:何', 'ja:どう', 'ja:どうして', 'ja:なぜ', 'ja:いつ', 'ja:どこ', 'ja:誰', 'ja:どんな', 'ja:いくら', 'ja:どれ', 'ja:どの', 'ja:どちら'] };
  // (zh / ja in CJK.md notation: openQ() shows them in the player's script)
  const OPENQ = { es: ['¿Cómo…?', '¿Por qué…?'], pt: ['Como…?', 'Por que…?'], de: ['Wie…?', 'Warum…?'], zh: ['[怎么|zěn me] …… ？', '[为什么|wèi shén me] …… ？'], ja: ['どうして … か', 'どう … か'] };
  const openQ = () => (OPENQ[L()] || ['How…?', 'Why…?']).map(s => `«${P(s)}»`).join(', ');
  function questionJudge(lemmas, b) {
    return (text, o) => {
      if (idkOnly(text)) return { understood: false };
      let r = null; try { r = TALK.judge(text, { lemmas }, { band: o.band, help: Math.min(o.help, 2), shown: o.help >= 2, bridge: false }); } catch (e) { r = null; }
      if (!r || !r.understood) return { understood: false, note: `Ask your question in ${LIFE.LANGNAME[L()] || 'the language'}.` };
      if (!r.met) return { understood: true, wrong: true, note: 'Ask about today’s story: use one of its words (the card).' };
      const a = r.a || (() => { try { return DICT.analyze(text); } catch (e) { return null; } })();
      if (!(a && a.question) && !/[?？]\s*$/.test(String(text).trim())) return { understood: true, wrong: true, note: 'Make it a question (end it with «?»).' };
      const ids = new Set(((a && a.words) || []).map(w => w.id));
      const open = [...ids].some(id => id && (QIDS[L()] || []).some(q => id === q || id.startsWith(q + '#')));      // (a pack may tag one: pt:quando#q)
      if (b >= 4 && !open && ['S', 'A'].includes(r.grade || 'A')) return Object.assign({}, r, { grade: 'B', note: 'At B2, ask an open question: how, why, what…', tips: [`An open question gets a real answer: ${openQ()}.`].concat(r.tips || []) });
      return r;
    };
  }
  // a speaker in a story: a bond person ({ who }) or the content's own ({ name, look, role })
  function newsPerson(p) {
    let name = p.name ? P(p.name) : '', look = p.look || null;
    if (p.who === 'clerk') { const c = C().clerk || {}; look = look || c.look || null; name = name || P(c.name || ''); }
    else if (p.who) { try { look = look || TALK.lookOf(p.who); if (!name) name = P(TALK.nameOf(p.who)); } catch (e) { /* */ } }
    return { name, look, role: p.role ? P(LIFE.frag(p.role).t) : '', voice: p.voice };
  }
  // G.state.life.news[]: { at (ms), day (LIFE.day), story, lang, script ('roman' | 'chars' for zh / ja, '' otherwise: how the text was typed),
  //   band (3 B1 · 4 B2), title (the story's title, in the content's form: [漢字|reading] for zh / ja), titleEn, text (the player's item, as typed),
  //   grade ('S'…'D'), score (0–1) }: the newest last, at most 200
  function saveNews(s, L2, b, text, g) {
    const st = LIFE.S(), list = st.news || (st.news = []), ti = LIFE.line(L2.title) || {};
    const script = LIFE.isC(L()) ? (((G && G.state && G.state.script) === 'chars') ? 'chars' : 'roman') : '';
    list.push({ at: Date.now(), day: LIFE.day(), story: s.id, lang: L(), script, band: b, title: ti.t || '', titleEn: ti.en || '', text: String(text), grade: g.grade, score: Math.round((g.score || 0) * 100) / 100 });
    if (list.length > 200) list.splice(0, list.length - 200);
    LIFE.save();
  }
  function newsTasks(b, o = {}) {
    const sh = S0().news || {}, all = sh.stories || {};
    const pool = STORIES.filter(s => all[s.id] && (o.all || storyOn(s)));
    if (!pool.length) return [];
    const st = o.all ? {} : js('news');
    const s = o.story ? (pool.find(x => x.id === o.story) || pool[0]) : (LIFE.pick(pool.filter(x => x.id !== st.lastStory)) || pool[0]);
    if (!o.all) st.lastStory = s.id;
    const L2 = all[s.id], title = LIFE.line(L2.title) || { t: '', en: '' }, tasks = [], notes = [];
    const people = (L2.people || []).map(newsPerson);
    const card = `<h4>📰 ${LIFEUI.tl(title.t)}</h4><p class="lf-note">${E(title.en)}</p><p>${people.map(p => `<b>${LIFEUI.tl(p.name)}</b>${p.role ? ` (${LIFEUI.tl(p.role)})` : ''}`).join(' · ')}</p>`;
    people.forEach((who, i) => {
      const q = (L2.q || [])[i]; if (!q) return;
      tasks.push({ kind: 'say', who, lines: [LIFE.line(q.greet || LIFE.pick(sh.greet || []) || null)].filter(Boolean), board: card,
        goal: b >= 4 ? `Interview ${who.name}: ask an open question about the story (${openQ()}).` : `Interview ${who.name}: ask a question about the story.`,
        judge: questionJudge(L2.lemmas || [], b), starter: q.starter ? LIFE.line(q.starter) : null, model: LIFE.line(q.model) });
      const order = pickN([0, 1, 2], 3), ans = LIFE.lines(q.answer);
      tasks.push({ kind: 'pick', who, lines: ans, listen: b >= 4, noEn: true, goal: `What did ${who.name} tell you? Pick the right note for your notebook.`, options: order.map(k => ({ html: E((s.picks[i] || [])[k] || ''), value: k })), answer: 0,
        hint: b >= 4 ? 'Listen again (🔊), or show the words.' : 'Read what they said again.' });
      notes.push({ who, lines: ans });
    });
    // the news item
    const Pt = sh.points || {}, Sx = sh.starters || {};
    const pts = [{ id: 'what', t: Pt.what, starter: Sx.what, want: { lemmas: L2.lemmas || [], time: 'past' } }, { id: 'said', t: b >= 4 ? (Pt.reported || Pt.said) : Pt.said, starter: Sx.said, want: { lemmas: sh.said || [] } }]
      .concat(b >= 4 ? [{ id: 'next', t: Pt.next, starter: Sx.next, want: sh.nextWant || { any: true, time: 'future' } }] : []);      // (zh marks the future with a word: its content gives the words)
    const [min, max] = (sh.len || {})[b] || (b >= 4 ? [45, 130] : [25, 90]);
    const lt = { band: b, min, max, points: pts.map(p => ({ want: p.want })) };
    const boss = bossOf('news');
    const board = `<h4>📝 ${E('Your notes')}</h4>` + notes.map(n => `<p><b>${LIFEUI.tl(n.who.name)}:</b> ${n.lines.map(l => LIFEUI.tl(l.t)).join(' ')}</p>`).join('') + card;
    tasks.push({ kind: 'write', who: boss, lines: [LIFE.line(sh.write || null)].filter(Boolean), board, min, max,
      goal: `Write the news item for the six o’clock bulletin (${min}–${max} words).`,
      points: pts.map(p => ({ t: LIFE.line(p.t), starter: p.starter ? LIFE.line(p.starter) : null })),
      model: LIFE.line(L2.model), check: text => MAIL.checkPoints(text, lt), count: MAIL.countWords,
      grade(text, go = {}) {
        const g = MAIL.grade(lt, text, { model: !!go.model });
        if (!go.test) { try { DICT.log('write', b, (g.score || 0) / 12.5, 3); } catch (e) { /* */ } if (!g.zero) saveNews(s, L2, b, text, { grade: g.grade, score: (g.score || 0) / 12.5 }); }
        return { grade: g.grade, score: (g.score || 0) / 12.5, points: g.points, fixed: g.fixed, tips: (g.tips || []).slice(0, 4), zero: g.zero || '', words: g.words };
      } });
    return tasks;
  }
  const GEN = { bakery: bakeryTasks, library: libraryTasks, inn: innTasks, ferry: ferryTasks, post: postTasks, interp: interpTasks, news: newsTasks };
  async function shift(id) {
    const st = js(id), J = C().jobs[id]; if (!st.rank || !GEN[id]) return;
    if (st.shiftDay !== LIFE.day()) { st.shiftDay = LIFE.day(); st.shifts = 0; }
    if (st.shifts >= SHIFTS) return bossSay(id, 'tired');
    const b = st.rank, tasks = GEN[id](b);
    if (!tasks.length) return;
    await bossSay(id, 'shift', '', [{ label: 'Let’s go!', value: 'go', main: true }]);
    const res = await LIFEUI.shift({ title: `${ICON[id]} ${P(J.title[0])}`, sub: `${B[b]} · a shift`, band: b, tasks });
    if (!res || res.quit) { LIFE.save(); return null; }
    const sc = res.results.map(x => x.score || 0), avg = sc.reduce((a, x) => a + x, 0) / Math.max(1, sc.length);
    const tips = res.grades.filter(g => g === 'S' || g === 'A').length;
    const coins = Math.round(PAY[b] * (0.4 + 0.6 * avg)) + Math.min(6, tips);
    LIFE.coins(coins); st.shifts++; st.earned = (st.earned || 0) + coins; st.done = (st.done || 0) + 1; LIFE.save();
    await bossSay(id, avg >= 0.7 ? 'goodShift' : 'okShift', `<div style="margin:6px 0">${res.grades.map(g => `<span class="lf-grade g-${E(g)}" style="margin-right:3px">${E(g)}</span>`).join('')}</div><div class="lf-gift">🪙 +${coins} coins · ${Math.max(0, SHIFTS - st.shifts)} shift${SHIFTS - st.shifts === 1 ? '' : 's'} left today</div>`, [{ label: 'Done', value: 'ok', main: true }]);
    return { coins, avg, grades: res.grades };
  }

  // ------------------------------------------------------------ the town board's lines, the side quest
  // (four ads at most: the jobs you don't have yet, the B1 ones first once you're at B1)
  function boardLines() {
    if (!open()) return [];
    const c = C(), lv = LIFE.band(), up = id => (minOf(id) > 1 && lv >= minOf(id) ? 1 : 0);
    const ids = IDS.filter(id => { const J = c.jobs[id]; return J && J.ad && jobOn(id) && !js(id).rank; }).sort((a, b) => up(b) - up(a));
    return ids.slice(0, 4).map(id => LIFE.line(c.jobs[id].ad));
  }
  function quests() {
    const anyHired = st => Object.values((st.life && st.life.jobs) || {}).some(j => j && j.rank > 0);
    const anyShift = st => Object.values((st.life && st.life.jobs) || {}).some(j => j && (j.done || 0) > 0);
    return [{
      id: 'life.jobs', kind: 'side',
      get title() { return 'Help wanted'; },
      get giver() { return 'the town hall’s notice board'; },
      started: st => !!(st.life && st.life.jobsSeen) && LIFE.ready(),
      steps: [
        { text: 'Get a part-time job in Alba (the bakery, the library, the inn, the ferry or the post office; from B1, the visitors’ desk or Radio Alba’s news)', why: 'Each job starts with a short interview at your level. Talk to the person in charge.', done: anyHired, target: () => ({ x: 3, z: -154.5 }), hint: '{mimo} sniffs toward the bakery: Marta is hiring.' },
        { text: 'Work your first shift', why: 'Shifts pay coins, up to three a work day.', done: anyShift, target: () => null, hint: '{mimo} rolls up its imaginary sleeves.' },
      ],
      story: [{ when: anyShift, get text() { const s = LIFE.S().jobs, e = Object.values(s).reduce((a, j) => a + ((j && j.earned) || 0), 0); return `You work part-time in Alba. You’ve earned ${e} coins so far.`; } }],
    }];
  }

  // ------------------------------------------------------------ the hooks: Marta and Bartolo (STORY.talkHooks), the librarian, the inn
  function talkHook(it) {
    if (!it || !open()) return null;
    if (it.who === 'baker') { const o = offer('bakery'); return o ? [o] : null; }
    let who = null; try { who = TALK._.whoIs(it); } catch (e) { who = null; }
    if (who === 'bartolo') { const o = offer('ferry'); return o ? [o] : null; }
    return null;
  }
  const INN_CARD = { x: -0.15, z: -2.55 };
  function hooks() {
    if (typeof STORY !== 'undefined' && STORY.talkHooks && !STORY.talkHooks.includes(talkHook)) STORY.talkHooks.push(talkHook);
    // Radio Alba's news: on the radio's menu, like the quiz show (RADIO.extra providers: menu(where) → [{ label, sub, run }])
    if (typeof RADIO !== 'undefined' && Array.isArray(RADIO.extra) && !RADIO.extra.some(p => p && p._life)) {
      RADIO.extra.push({ _life: true, menu() { const o = offer('news'); return o ? [{ label: o.label, sub: o.sub, run: () => menu('news') }] : []; } });
    }
    if (typeof LIBRARY !== 'undefined' && LIBRARY.person && LIBRARY.person.options && !LIBRARY.person.options.some(o => o._life)) {
      LIBRARY.person.options.push({ _life: true, get label() { const o = offer('library'); return o ? o.label : 'The library job'; }, get sub() { const o = offer('library'); return o ? o.sub : ''; }, when: () => jobOn('library'), run: () => menu('library') });
    }
    if (typeof INTERIORS !== 'undefined' && INTERIORS.hook) {
      const here = ctx => ctx && ctx.door && ctx.door.kind === 'inn' && ctx.door.town === 'alba' && !ctx.floor && jobOn('inn');
      INTERIORS.hook({
        extras(ctx) { return here(ctx) ? [{ x: INN_CARD.x, z: INN_CARD.z, r: 1.15, label: js('inn').rank ? 'Work' : 'Read', run: () => innCard() }] : null; },
        props(ctx) { return here(ctx) ? [{ x: -0.85, y: 1.12, z: -3.25, rot: 0.3, draw: k => { k.box(0, 0.12, 0, 0.36, 0.26, 0.03, '#fffaf0', { ink: 0.005 }); k.box(0, 0.2, 0.017, 0.26, 0.04, 0.005, '#c2412f', { ink: 0 }); k.box(0, 0.11, 0.017, 0.22, 0.02, 0.005, '#2b2235', { ink: 0 }); k.box(0, 0.06, 0.017, 0.18, 0.02, 0.005, '#2b2235', { ink: 0 }); k.box(0, -0.03, -0.06, 0.3, 0.02, 0.14, '#8a5f3e', { ink: 0.004 }); } }] : null; },
      });
    }
  }
  async function innCard() {
    const J = C().jobs.inn; if (!J) return;
    if (!js('inn').rank) { const ad = J.ad ? LIFE.line(J.ad) : null; if (ad) await SIGNS.read({ tag: 'A card on the bar', lines: [{ text: ad.t, en: ad.en, look: { face: '#fffaf0', edge: '#c2412f', ink: '#2b2235' } }] }); }
    return menu('inn');
  }

  // ------------------------------------------------------------ checks and tests (JOBS._.check / JOBS._.tests; the game never calls them)
  function check(l) {
    const out = [], c = LIFE.content(l); if (!c) return out;
    for (const id of IDS) if (!c.jobs[id]) out.push('no job ' + id);
    for (const [id, J] of Object.entries(c.jobs)) { if (!J.title) out.push(`job ${id}: no title`); for (const k of ['open', 'hired', 'notYet', 'shift', 'goodShift', 'okShift', 'tired', 'retry', 'about'].concat(minOf(id) > 1 ? ['early'] : [])) if (!(J.lines || {})[k]) out.push(`job ${id}: no lines.${k}`); }
    // the visitors' desk: every case in the language (its needs match the English parts), every official; the news: every story
    const I2 = (c.shifts || {}).interp || {};
    for (const cs of CASES) {
      const x = (I2.cases || {})[cs.id]; if (!x) { out.push(`shifts.interp: no case ${cs.id}`); continue; }
      if (!Array.isArray(x.needs) || x.needs.length !== cs.need.length || x.needs.some(g => !Array.isArray(g) || !g.length)) out.push(`shifts.interp.${cs.id}: needs (${cs.need.length} groups: ${cs.need.join(' · ')})`);
      if (!x.model || !x.answer) out.push(`shifts.interp.${cs.id}: model and answer`);
      const o = (I2.to || {})[cs.to]; if (!o || !(o.name || o.who)) out.push(`shifts.interp: no official ${cs.to}`); else if (o.phone && !o.hello) out.push(`shifts.interp.to.${cs.to}: the phone's hello`);
    }
    const N2 = (c.shifts || {}).news || {};
    if (!N2.points || !N2.points.what || !N2.points.said || !N2.points.next || !(N2.said || []).length) out.push('shifts.news: points (what, said, reported, next) and said');
    for (const s of STORIES) {
      const x = (N2.stories || {})[s.id]; if (!x) { out.push(`shifts.news: no story ${s.id}`); continue; }
      if (!x.title || !(x.lemmas || []).length || !x.model || (x.people || []).length !== 2 || (x.q || []).length !== 2) out.push(`shifts.news.${s.id}: title, lemmas, model, 2 people, 2 questions`);
      (x.q || []).forEach((q, i) => { if (!q.model || !q.answer) out.push(`shifts.news.${s.id}.q[${i}]: model and answer`); });
    }
    for (const slot of ['intro', 'days', 'past', 'times', 'whyYou']) if (!(c.interview || {})[slot]) out.push('interview: no ' + slot);
    const S = c.shifts || {};
    if (!S.bakery || !S.bakery.order || !S.bakery.back || !S.bakery.total) out.push('shifts.bakery: order, back, total');
    if (!S.library || !(S.library.sections || []).length || (S.library.books || []).length < 8) out.push('shifts.library: sections and 8+ books');
    else for (const bk of S.library.books) if (!S.library.sections.some(s => s.id === bk.s)) out.push('shifts.library: a book on no shelf: ' + bk.s);
    if (!S.inn || !(S.inn.tasks || []).length) out.push('shifts.inn: tasks');
    if (!S.ferry || !(S.ferry.tasks || []).length) out.push('shifts.ferry: tasks');
    if (!S.post || !(S.post.streets || []).length || !(S.post.towns || []).length) out.push('shifts.post: streets and towns');
    return out;
  }
  function tests(l) {
    const fails = [], counts = { turns: 0, shiftTasks: 0 }, ok = (cond, what) => { if (!cond) fails.push(what); return cond; };
    const c = LIFE.content(l); if (!c) return { fails: ['no content'], counts };
    const idk = { es: 'No sé.', pt: 'Não sei.', de: 'Ich weiß es nicht.', zh: '我不知道。', ja: 'わかりません。' }[l];
    const txt = x => { const r = LIFE.raw(x); return r ? (LIFE.isC(l) ? CJK.chars(r.t, { lang: l }) : r.t) : ''; };
    const en = x => { const r = LIFE.raw(x); return r ? r.en : ''; };
    const turnsOf = id => { const J = c.jobs[id] || {}, all = []; for (const [slot, src] of Object.entries(Object.assign({}, c.interview, { why: J.why, situation: J.situation, hypo: J.hypo }))) if (src && typeof src === 'object' && slot !== 'react' && slot !== 'close') for (const [b, list] of Object.entries(src)) for (const tn of LIFE.arr(list)) all.push({ slot, b: +b, tn }); return all; };
    const seen = new Set();
    try {
      for (const id of IDS) for (const { slot, b, tn } of turnsOf(id)) {
        if (seen.has(tn)) continue; seen.add(tn); counts.turns++;
        const w = `${id}.${slot}.${b}`, m = txt(tn.model);
        const g = EXAM.grade.turn(m, tn, b, l), n = EXAM.grade.turn(idk, tn, b, l), e = EXAM.grade.turn(en(tn.model), tn, b, l);
        ok(g.understood && g.s >= 4.25, `${w}: the model is ${g.understood ? g.grade : 'not understood'} («${m}»${g.r && g.r.missing && g.r.missing.length ? ', missing ' + g.r.missing.join(',') : ''}${g.r && g.r.errors ? ' ' + g.r.errors.filter(x => !x.free).map(x => x.code + ' «' + x.fix + '»').join(', ') : ''})`);
        // (ja reads Latin text as rōmaji, so an English answer can find a stray と or 円: it must stay below a pass, B)
        ok(!n.s, `${w}: «${idk}» scores`); ok(l === 'ja' ? e.s < 3.5 : !e.s, `${w}: English scores ${e.s} (${en(tn.model)})`);
      }
      // each band's draw has a turn for every slot (from the band the job hires at)
      for (const id of IDS) for (const b of [1, 2, 3, 4]) { if (b < minOf(id)) continue; const st = { used: {} }; const d = draw(id, b, st); ok(d.length === SLOTS[b].length, `${id} ${B[b]}: ${d.length} of ${SLOTS[b].length} turns`); }
      // shifts: every generator at every band makes tasks; the models pass their own judges, and a wrong total is caught
      // (the visitors' desk: every case; the news: every story, whatever the save's gates; their write models grade S or A)
      const was = LIFEUI._.T.fast; LIFEUI._.T.fast = true;
      const runs = [];
      for (const id of IDS) for (const b of [1, 2, 3, 4]) {
        if (b < minOf(id)) continue;
        if (id === 'interp') runs.push({ id, b, make: () => interpTasks(b, { all: true }) });
        else if (id === 'news') for (const s of STORIES) runs.push({ id, b, story: s.id, make: () => newsTasks(b, { story: s.id, all: true }) });
        else runs.push({ id, b, make: () => GEN[id](b) });
      }
      for (const { id, b, story, make } of runs) {
        const w0 = `${id}${story ? '.' + story : ''} ${B[b]}`;
        let ts = []; try { ts = make(); } catch (e2) { fails.push(`${w0}: the generator threw ${e2 && e2.stack || e2}`); continue; }
        ok(ts.length >= 3, `${w0}: only ${ts.length} tasks`);
        for (const t of ts) {
          counts.shiftTasks++;
          if (t.kind === 'pick') { ok((t.options || []).some(o => o.value === t.answer), `${w0}: a pick with no right option (${t.answer})`); ok(!(t.options || []).some(o => !o.html), `${w0}: an empty option`); continue; }
          if (t.kind === 'write') {
            const m = LIFEUI._.textOf(t.model), g = t.grade(m, { test: true }), n = t.grade(idk, { test: true });
            ok(['S', 'A'].includes(g.grade), `${w0}: the news model grades ${g.grade} (${Math.round(g.score * 125) / 10}/12.5, points ${g.points}, ${g.words} words${(g.tips || []).length ? '; ' + g.tips.join(' | ') : ''}) «${m}»`);
            ok(n.grade === 'D', `${w0}: «${idk}» grades ${n.grade} as a news item`);
            counts.news = (counts.news || 0) + 1; continue;
          }
          const m = LIFEUI._.textOf(t.model);
          const r = t.judge ? t.judge(m, { band: b, help: 0 }) : LIFEUI._.judgeSay(m, t, b, 0);
          // (the two B1 jobs' models must be S or A: they're the examples a B1–B2 player copies)
          const top = minOf(id) > 1 ? ['S', 'A'] : ['S', 'A', 'B'];
          ok(r && r.understood && !r.wrong && top.includes(r.grade || 'A'), `${w0}: the model «${m}» isn’t accepted (${r ? (r.wrong ? 'wrong: ' + (r.note || '') : r.understood ? r.grade + ' ' + (r.missing || []).join(',') + ' ' + (r.errors || []).filter(x => !x.free).map(x => x.code + '«' + x.fix + '»').join(',') + ' ' + (r.note || '') : 'not understood') : 'null'})`);
          const n2 = t.judge ? t.judge(idk, { band: b, help: 0 }) : LIFEUI._.judgeSay(idk, t, b, 0);
          ok(!n2 || !n2.understood || n2.wrong, `${w0}: «${idk}» is accepted for «${m}»`);
          // (an English request or question never passes the B1 jobs: the visitor's own words, said back)
          if (minOf(id) > 1 && t.lines && t.lines[0] && t.lines[0].plain) { const e2 = t.judge(t.lines[0].t, { band: b, help: 0 }); ok(!e2 || !e2.understood || e2.wrong, `${w0}: the visitor's English is accepted («${t.lines[0].t}»)`); }
        }
      }
      LIFEUI._.T.fast = was;
      // the bakery's total: a wrong number is caught
      const items = [{ id: 'w.bread', n: 2 }], tj = totalJudge(totalOf(items));
      let three = { zh: '一共三枚金币。', ja: 'ぜんぶで三コインです。' }[l] || '3'; try { if (!LIFE.isC(l)) three = SHOP.numWord(3, l, 'f'); } catch (e3) { three = '3'; }
      const bad = tj(three, { band: 1, help: 0 });
      ok(bad && bad.wrong, `bakery: a wrong total isn’t caught`);
    } catch (e) { fails.push('jobs threw: ' + (e && e.stack || e)); }
    return { fails, counts };
  }

  function init(game) { G = game; try { hooks(); } catch (e) { console.error('[jobs] hooks', e); } }
  return {
    init, menu, offer, open, jobOn, boardLines, quests, interview, shift,
    get state() { return LIFE.S().jobs; }, IDS, PAY, SHIFTS,
    _: { T, js, draw, bankFor, SLOTS, GEN, orderLine, anOrder, totalOf, sayBack, totalJudge, itemText, check, tests, talkHook, innCard, workOn,
      MIN, minOf, CASES, VIS, STORIES, storyOn, interpTasks, newsTasks, interpJudge, questionJudge, politeOK, official, newsPerson },
  };
})();
