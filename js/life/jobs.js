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
//   JOBS.init(game) · menu(id) · offer(id) → { label, sub, run } · open() · boardLines() · quests() · _ (tests, the generators)
// State: G.state.life.jobs[id] { rank, tries, last, shiftDay, shifts, earned, hiredDay, used }

const JOBS = (() => {
  let G = null;
  const P = s => LIFE.P(s), L = () => LIFE.L(), E = s => LIFE.E(s);
  const C = () => LIFE.content() || {};
  const B = LIFE.BANDS;
  const PAY = [0, 8, 12, 16, 20], SHIFTS = 3, RETRY = 600, PROMO_DAYS = 2;
  const IDS = ['bakery', 'library', 'inn', 'ferry', 'post'];
  const EN = { bakery: 'the bakery', library: 'the library', inn: 'the inn', ferry: 'the ferry', post: 'the post office' };
  const ICON = { bakery: '🥖', library: '📚', inn: '🛎', ferry: '⛴', post: '📮' };
  const T = { fast: false };
  const js = id => { const s = LIFE.S().jobs; return s[id] || (s[id] = { rank: 0, tries: 0, last: -1e9, shiftDay: 0, shifts: 0, earned: 0, hiredDay: 0, used: {} }); };
  const flags = () => (G && G.state && G.state.flags) || {};
  const open = () => !!(LIFE.ready() && G && G.state && flags().hatched && flags().boss);
  // each job's own gate: the library needs the library (READ's books in this language), the ferry needs Bartolo's words back
  function jobOn(id) {
    if (!open() || !C().jobs[id]) return false;
    if (id === 'library') return typeof LIBRARY !== 'undefined' && typeof READ !== 'undefined' && READ.on && READ.on('books');
    if (id === 'ferry') return !!flags().bartolo;
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
    const st = js(id), J = C().jobs[id];
    const sub = st.rank ? `${B[st.rank]} · ${shiftsLeft(st)} of ${SHIFTS} shifts left today` : st.tries && RETRY - (LIFE.now() - st.last) > 0 ? `try again in about ${LIFE.mins(RETRY - (LIFE.now() - st.last))} min` : 'help wanted: a short interview';
    return { label: st.rank ? `${ICON[id]} Work at ${P(J.title[0])}` : `${ICON[id]} The job at ${P(J.title[0])}`, sub, run: () => menu(id) };
  }
  async function menu(id) {
    const J = C().jobs[id]; if (!J || !jobOn(id)) return;
    const s = LIFE.S(); s.jobsSeen = true;
    for (let guard = 0; guard < 4; guard++) {
      const st = js(id), lv = LIFE.band(), opts = [];
      if (!st.rank) {
        const wait = RETRY - (LIFE.now() - st.last);
        if (st.tries && wait > 0) opts.push({ label: 'Apply for the job', sub: `${bossOf(id).name} said to come back in about ${LIFE.mins(wait)} min`, value: 'wait' });
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
    b = Math.max(1, Math.min(4, b));
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
  const GEN = { bakery: bakeryTasks, library: libraryTasks, inn: innTasks, ferry: ferryTasks, post: postTasks };
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
  function boardLines() {
    if (!open()) return [];
    const c = C(), out = [];
    for (const id of IDS) { const J = c.jobs[id]; if (!J || !jobOn(id) || !J.ad) continue; out.push(LIFE.line(J.ad)); }
    return out.slice(0, 4);
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
        { text: 'Get a part-time job in Alba (the bakery, the library, the inn, the ferry or the post office)', why: 'Each job starts with a short interview at your level. Talk to the person in charge.', done: anyHired, target: () => ({ x: 3, z: -154.5 }), hint: '{mimo} sniffs toward the bakery: Marta is hiring.' },
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
    for (const [id, J] of Object.entries(c.jobs)) { if (!J.title) out.push(`job ${id}: no title`); for (const k of ['open', 'hired', 'notYet', 'shift', 'goodShift', 'okShift', 'tired', 'retry', 'about']) if (!(J.lines || {})[k]) out.push(`job ${id}: no lines.${k}`); }
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
      // each band's draw has a turn for every slot
      for (const id of IDS) for (const b of [1, 2, 3, 4]) { const st = { used: {} }; const d = draw(id, b, st); ok(d.length === SLOTS[b].length, `${id} ${B[b]}: ${d.length} of ${SLOTS[b].length} turns`); }
      // shifts: every generator at every band makes tasks; the models pass their own judges, and a wrong total is caught
      const was = LIFEUI._.T.fast; LIFEUI._.T.fast = true;
      for (const id of IDS) for (const b of [1, 2, 3, 4]) {
        let ts = []; try { ts = GEN[id](b); } catch (e2) { fails.push(`${id} ${B[b]}: the generator threw ${e2}`); continue; }
        ok(ts.length >= 3, `${id} ${B[b]}: only ${ts.length} tasks`);
        for (const t of ts) {
          counts.shiftTasks++;
          if (t.kind === 'pick') { ok((t.options || []).some(o => o.value === t.answer), `${id} ${B[b]}: a pick with no right option (${t.answer})`); continue; }
          const m = LIFEUI._.textOf(t.model);
          const r = t.judge ? t.judge(m, { band: b, help: 0 }) : LIFEUI._.judgeSay(m, t, b, 0);
          ok(r && r.understood && !r.wrong && ['S', 'A', 'B'].includes(r.grade || 'A'), `${id} ${B[b]}: the model «${m}» isn’t accepted (${r ? (r.wrong ? 'wrong' : r.understood ? r.grade + ' ' + (r.missing || []).join(',') + ' ' + (r.errors || []).filter(x => !x.free).map(x => x.code).join(',') : 'not understood') : 'null'})`);
          const n2 = t.judge ? t.judge(idk, { band: b, help: 0 }) : LIFEUI._.judgeSay(idk, t, b, 0);
          ok(!n2 || !n2.understood || n2.wrong, `${id} ${B[b]}: «${idk}» is accepted for «${m}»`);
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
    _: { T, js, draw, bankFor, SLOTS, GEN, orderLine, anOrder, totalOf, sayBack, totalJudge, itemText, check, tests, talkHook, innCard, workOn },
  };
})();
