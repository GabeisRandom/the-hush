'use strict';
// MAIL: pen pals (D2, DESIGN.md 21.2 D, the writing half). Three per language write to you at Alba's post office (the town
// hall, townhall.js): a kid nearby (A1→A2), a young adult (A2→B1) and an elder beyond the valley (B1→B2), six letters each.
//   • The rhythm: the first writes once the post office is open (after the big one on the hill); the second when your level
//     is A2, the third at B1 (each pen pal's `from`). A letter at band b waits until you're at b − 1. One letter at a time
//     from each: the next comes 12–20 minutes of play after you've posted your reply. Mail waits in the pigeonholes («lista de
//     correos»), with a toast and the side quest «A letter for you».
//   • Writing back: at the desk (or straight from the letter). Their letter beside your page; its 2–3 points tick off as you
//     write (TALK.judge on your sentences); a way to start each point is free; showing the model reply caps it at half.
//   • Grading: EXAM.grade.write (the points as TALK wants, accuracy, variety, length) → an S–D stamp on the envelope, the
//     corrected copy (like the exam's review), DICT.log('write', band, score, 3).
//   • Memory: each point you made is kept with TALK.remember (keys pp_<pal>_<name>, in G.state.talk.facts); their next letter
//     picks it up ({f.pp_chuy_pet|…} slots), and asks again about a point you skipped ({ if: { missed: 'chuy.1.pet' } }).
//   • Rewards: a stamp per letter (the album), small gifts (coins, food for the bag, a phrase for the Phrasebook), a stamp pin
//     for Mimo at six stamps.
//   MAIL.init(game) · tick(dt) · counter() (the clerk) · desk() · album() · read(entry) · write(entry) · open() · quests()
//   · inbox() · _ (tests: MAIL._.tests(lang), MAIL._.t)
// State: G.state.life.mail { pals: { id: { got, ans, due } }, inbox: [{ key, pal, i, at, read, body, sign, rewarded }],
//   sent: [{ key, pal, i, band, text, fixed, score, grade, points, acc, range, len, words, tips, model, at }], stamps, missed, met }

const MAIL = (() => {
  let G = null;
  const P = s => LIFE.P(s);
  const C = () => LIFE.content() || {};
  const pals = () => C().penpals || [];
  const palById = id => pals().find(p => p.id === id) || null;
  const M = () => LIFE.S().mail;
  const ps = id => { const m = M(); return m.pals[id] || (m.pals[id] = { got: 0, ans: 0, due: null }); };
  const keyOf = (id, i) => id + '.' + (i + 1);
  const T = { fast: false, gap: null };
  // the post office is open after the big one on the hill (a postcard needs a few words)
  const open = () => !!(LIFE.ready() && G && G.state && G.state.flags && G.state.flags.hatched && G.state.flags.boss);
  const palOpen = p => open() && LIFE.level() >= (p.from || 0);
  const answered = e => M().sent.some(s => s.key === e.key);
  const unread = () => M().inbox.filter(e => !e.read);
  const toAnswer = () => M().inbox.filter(e => !answered(e));

  // ------------------------------------------------------------ a letter, filled (its tests and slots) and frozen when it arrives
  function compose(p, i) {
    const lt = p.letters[i]; if (!lt) return null;
    const vars = { pal: p.name };
    return { body: LIFE.lines(lt.body, vars), sign: lt.sign ? LIFE.line(lt.sign, vars) : null };
  }
  function viewOf(e) {
    const p = palById(e.pal), lt = p && p.letters[e.i]; if (!lt) return null;
    const ln = x => (x ? { t: x[0], en: x[1] } : null);
    return { key: e.key, i: e.i, band: lt.band, pal: { id: p.id, name: p.name, where: LIFE.line(p.where), look: p.look, voice: p.voice },
      body: (e.body || []).map(ln), sign: ln(e.sign), stamp: lt.stamp, points: lt.points, model: lt.model, min: lt.min, max: lt.max };
  }
  function deliver(p) {
    const st = ps(p.id), i = st.got, c = compose(p, i); if (!c) return null;
    const e = { key: keyOf(p.id, i), pal: p.id, i, at: Date.now(), t: LIFE.now(), read: false, body: c.body.map(l => [l.t, l.en]), sign: c.sign ? [c.sign.t, c.sign.en] : null };
    M().inbox.push(e); st.got = i + 1; st.due = null; M().toast = e.key;
    LIFE.save();
    return e;
  }
  // every couple of seconds: who writes next, and when
  let tickT = 1;
  function tick(dt) {
    if (!G || !G.state || (tickT -= dt) > 0) return;
    tickT = 2;
    if (!open()) return;
    const now = LIFE.now();
    pals().forEach((p, n) => {
      if (!palOpen(p)) return;
      const st = ps(p.id); if (st.got >= p.letters.length) return;
      if (st.got > st.ans) return;
      if (st.due == null) { st.due = now + (T.gap != null ? T.gap : st.got === 0 ? (n === 0 ? 20 : 45) : 900); return; }
      const lt = p.letters[st.got];
      if (now >= st.due && LIFE.level() >= (lt.band || 1) - 1) deliver(p);
    });
    const m = M();
    if (m.toast && LIFE.free()) {
      const e = m.inbox.find(x => x.key === m.toast); m.toast = null;
      const p = e && palById(e.pal);
      if (p) LIFE.toast(`📮 A letter from ${P(p.name)} is waiting for you at the post office (the town hall, west street)`);
    }
  }

  // ------------------------------------------------------------ grading a letter
  const sentences = text => { try { return EXAM._.sentencesOf(text); } catch (e) { return String(text || '').split(/(?<=[.!?。！？])\s*/).filter(Boolean); } };
  const chunksOf = text => { const ss = sentences(text); return ss.concat(ss.slice(1).map((s, i) => ss[i] + ' ' + s)); };
  function meets(chunk, want, band) {
    try { const r = TALK.judge(chunk, EXAM._.resolveWant(want, {}), { band, bridge: false, accents: false }); return r && r.understood && r.met ? r : null; } catch (e) { return null; }
  }
  // which points a text makes (the desk's live ticks)
  function checkPoints(text, lt) {
    const cs = chunksOf(text); if (!cs.length) return (lt.points || []).map(() => false);
    return (lt.points || []).map(pt => cs.some(c => { try { if (EXAM._.idkOnly(c)) return false; } catch (e) { /* */ } return !!meets(c, pt.want, lt.band); }));
  }
  // (an S is a full, rich letter with no real mistakes; one slip makes it an A at best)
  const GRADE = (s, acc) => (s >= 11 && acc >= 4 ? 'S' : s >= 9 ? 'A' : s >= 7 ? 'B' : s >= 4.5 ? 'C' : 'D');
  function grade(lt, text, o = {}) {
    const task = { points: (lt.points || []).map(p => ({ want: p.want })), min: lt.min, max: lt.max };
    let g;
    try { g = EXAM.grade.write(text, task, lt.band || 1, LIFE.L()); } catch (e) { console.error('[mail] grade', e); g = { score: 0, points: [], zero: 'empty', errors: [], tips: [], fixed: text }; }
    let score = g.score || 0; if (o.model) score = Math.min(score, 6.25);
    return Object.assign({}, g, { score, grade: GRADE(score, g.acc || 0), model: !!o.model });
  }
  // what you told them: each point's first sentence that makes it → TALK.remember; a point you skipped → missed
  function remember(p, i, lt, text) {
    const cs = chunksOf(text), m = M(), key = keyOf(p.id, i);
    for (const pt of lt.points || []) {
      let r = null; for (const c of cs) { r = meets(c, pt.want, lt.band); if (r) break; }
      m.missed[key + '.' + pt.id] = !r;
      if (r && pt.remember) {
        try { TALK.remember(pt.remember, r, { who: 'pp:' + p.id }); for (const [k, how] of Object.entries(pt.remember)) if (how && typeof how === 'object') tidy(k); }
        catch (e) { console.error('[mail] remember', e); }
      }
    }
  }
  // a thing you named («Mi perro se llama…», «Mein Hund ist…») is said back as «a dog» in their next letter: a lone singular noun
  // after a possessive or «the» gets the indefinite article (es / pt / de: zh and ja have none), so «¿Tienes {f.key}?» reads right
  // (TALK.remember already turns «my» into «your»: «Mein Hund» is kept as «dein Hund», «mi perro» as «tu perro»)
  const DET = { es: /^(?:mi|tu|su|el|la)\s+/i, pt: /^(?:(?:o|a)\s+)?(?:meu|minha|seu|sua|teu|tua)\s+|^(?:o|a)\s+/i, de: /^(?:mein|meine|meinen|dein|deine|deinen|der|die|das|den)\s+/i };
  const INDEF = { es: { m: 'un', f: 'una' }, pt: { m: 'um', f: 'uma' }, de: { m: 'einen', f: 'eine', n: 'ein' } };
  function tidy(key) {
    const l = LIFE.L(), f = (TALK.facts() || {})[key]; if (!f || !f.id || !DET[l] || typeof DICT === 'undefined') return;
    const e = DICT.entry(f.id), m = String(f.v || '').match(DET[l]); if (!e || e.pos !== 'n' || !m) return;
    const rest = String(f.v).slice(m[0].length), low = rest.toLowerCase(), fem = !!e.fem && low === String(e.fem).toLowerCase();
    if (low !== String(e.lemma).toLowerCase() && !fem) return;       // (plurals and nouns with an adjective stay as they were said)
    f.v = (INDEF[l][fem ? 'f' : e.g] || INDEF[l].m) + ' ' + rest;
  }
  const countWords = text => { try { return EXAM._.wordsOf(DICT.analyze(String(text || ''))).length; } catch (e) { return String(text || '').split(/\s+/).filter(Boolean).length; } };

  // ------------------------------------------------------------ reading, writing, the rewards
  function rewards(e) {
    const p = palById(e.pal), lt = p && p.letters[e.i]; if (!lt || e.rewarded) return [];
    e.rewarded = true; const got = [], m = M();
    if (lt.stamp && lt.stamp.id && !m.stamps[lt.stamp.id]) { m.stamps[lt.stamp.id] = Date.now(); got.push(`📮 a stamp for your album: ${P(Array.isArray(lt.stamp.name) ? lt.stamp.name[0] : lt.stamp.name)}`); }
    const gf = lt.gift || {};
    if (gf.coins) { LIFE.coins(gf.coins); got.push(`🪙 ${gf.coins} coins`); }
    if (gf.item) { LIFE.give(gf.item, gf.n || 1); const it = typeof LEX !== 'undefined' && LEX.item(gf.item); got.push(`🎁 ${gf.n || 1} × ${it ? (it.en || gf.item) : gf.item} (in your bag)`); }
    if (gf.phrase) { const it = LIFE.teach(gf.phrase); if (it) got.push(`📖 a phrase for your Phrasebook: «${P(it[LIFE.L()])}» (${it.en})`); }
    if (gf.note) got.push(`✉️ ${gf.note}`);
    if (Object.keys(m.stamps).length >= 6 && !m.pin) { m.pin = true; const nm = LIFE.cosmetic('life.stamp'); if (nm) got.push(`🎀 for ${(G.state.mimoName || 'Mimo')}: ${nm.en || 'a stamp pin'} (People page)`); }
    LIFE.save();
    return got;
  }
  async function read(e, o = {}) {
    const v = viewOf(e); if (!v) return;
    const first = !e.read; e.read = true;
    if (first) { try { for (const l of v.body) DICT.metAll(DICT.analyze(LIFE.isC() ? CJK.chars(l.t, { lang: LIFE.L() }) : l.t), 'read'); } catch (err) { /* */ } }
    const got = first ? rewards(e) : [];
    const p = palById(e.pal);
    const r = await LIFEUI.letter(v, { canWrite: !answered(e), answered: answered(e), from: `${P(p.name)} · ${P(v.pal.where ? v.pal.where.t : '')}` });
    if (got.length) await LIFEUI.card({ title: 'Inside the envelope', html: `<div class="lf-gift">${got.map(x => LIFE.E(x)).join('<br>')}</div>`, sound: 'learned', narrow: true });
    if (r === 'write' && !answered(e)) await write(e);
  }
  async function write(e) {
    const p = palById(e.pal), lt = p && p.letters[e.i], v = viewOf(e); if (!lt || !v || answered(e)) return;
    const pts = (lt.points || []).map(pt => ({ t: LIFE.line(pt.t), starter: pt.starter ? LIFE.line(pt.starter) : null }));
    const r = await LIFEUI.desk(v, { points: pts, min: lt.min, max: lt.max, model: LIFE.line(lt.model), check: text => checkPoints(text, lt), count: countWords, band: lt.band });
    if (!r || !String(r.text || '').trim()) return;
    return post(e, r.text, { model: r.model });
  }
  // post a reply (the desk, or the tests): grade it, keep what you said, log it, schedule their next letter
  async function post(e, text, o = {}) {
    const p = palById(e.pal), lt = p && p.letters[e.i]; if (!lt) return null;
    const g = grade(lt, text, o);
    if (!g.zero) remember(p, e.i, lt, text);
    try { DICT.log('write', lt.band || 1, (g.score || 0) / 12.5, 3); } catch (err) { /* */ }
    const en = { key: e.key, pal: p.id, i: e.i, band: lt.band, text: String(text), fixed: g.fixed, score: g.score, grade: g.grade, points: g.points, acc: g.acc, range: g.range, len: g.len, words: g.words, tips: (g.tips || []).slice(0, 6), zero: g.zero || '', model: !!o.model, at: Date.now() };
    const m = M(); m.sent = m.sent.filter(s => s.key !== e.key); m.sent.push(en);
    const st = ps(p.id); st.ans = Math.max(st.ans, e.i + 1);
    if (st.ans < p.letters.length) st.due = LIFE.now() + (T.gap != null ? T.gap : 720 + Math.floor(Math.random() * 480));
    LIFE.save();
    if (o.quiet) return en;
    const last = st.ans >= p.letters.length;
    const said = LIFE.said(g.zero ? 'postedBad' : 'posted', 'clerk') || LIFE.said('posted', 'clerk');
    const town = P((LIFE.line(p.town || p.where) || {}).t || '');
    const msg = g.zero ? 'It’s in the post, but there wasn’t much to read.' : last ? `That was ${P(p.name)}’s last letter for now. Your letter is on its way to ${town}, where it will be kept like treasure.` : `On its way to ${town}! ${P(p.name)} should write back in a while.`;
    const v2 = await LIFEUI.posted(en, { to: P(p.name), where: town, stamp: lt.stamp, msg, said });
    if (v2 === 'review') await LIFEUI.review(en, viewOf(e) || {});
    return en;
  }

  // ------------------------------------------------------------ the clerk's counter, the desk, the album
  async function choose(title, opts) {
    const was = G.sim.lock; G.sim.lock = 1;
    try { return await UI.choose(title, opts); } finally { G.sim.lock = was; }
  }
  const clerkSay = ln => (typeof TOWNHALL !== 'undefined' && ln ? TOWNHALL.clerkSay(ln) : null);
  async function counter() {
    if (!LIFE.ready()) return;
    const m = M();
    if (!open()) { await clerkSay(LIFE.said('notYet', 'clerk')); return; }
    if (!m.met) {
      m.met = true; LIFE.save();
      const intro = (C().lines.clerk || {}).pals || [];
      for (const l of LIFE.lines(intro)) await clerkSay(l);
      // (the first pen pal's first letter is already waiting: she hands it over)
      const p0 = pals()[0], st0 = p0 && ps(p0.id);
      if (p0 && palOpen(p0) && st0.got === 0) deliver(p0);
    }
    for (let guard = 0; guard < 6; guard++) {
      const un = unread(), ta = toAnswer(), n = Object.keys(m.stamps).length, opts = [];
      if (un.length) opts.push({ label: `Your mail (${un.length} new)`, sub: un.map(e => P((palById(e.pal) || {}).name)).join(', '), value: 'mail' });
      else if (m.inbox.length) opts.push({ label: 'Your letters', sub: 'read them again', value: 'mail' });
      if (ta.length) opts.push({ label: 'Write back', sub: `${ta.length} letter${ta.length > 1 ? 's' : ''} to answer · the desk by the window`, value: 'write' });
      if (n || m.inbox.length) opts.push({ label: 'Your stamp album', sub: `${n} stamp${n === 1 ? '' : 's'}`, value: 'album' });
      opts.push({ label: 'Ask about the pen pals', sub: nextNote(), value: 'pals' });
      if (typeof JOBS !== 'undefined' && JOBS.offer) for (const jid of ['post', 'interp']) { const o = JOBS.offer(jid); if (o) opts.push({ label: o.label, sub: o.sub, value: o }); }      // (the post job, and from B1 the visitors' desk)
      const v = await choose(TOWNHALL.clerkName(), opts);
      if (!v) { await clerkSay(LIFE.said('bye', 'clerk')); return; }
      if (v === 'mail') { await mailList(); continue; }
      if (v === 'write') { await desk(); continue; }
      if (v === 'album') { await album(); continue; }
      if (v === 'pals') { await clerkSay(LIFE.said('about', 'clerk')); continue; }
      if (v && v.run) { await v.run(); return; }
    }
  }
  function nextNote() {
    const notes = [];
    for (const p of pals()) {
      const st = ps(p.id);
      if (!palOpen(p)) { notes.push(`${P(p.name)}: when your level is ${LIFE.BANDS[p.from || 1]}`); continue; }
      if (st.got >= p.letters.length && st.ans >= p.letters.length) continue;
      if (st.got > st.ans) notes.push(`${P(p.name)}: waiting for your reply`);
      else if (st.due != null) notes.push(`${P(p.name)}: a letter in about ${LIFE.mins(Math.max(0, st.due - LIFE.now()))} min`);
    }
    return notes.slice(0, 3).join(' · ');
  }
  async function mailList() {
    const list = M().inbox.slice().sort((a, b) => (a.read === b.read ? b.at - a.at : a.read ? 1 : -1));
    if (!list.length) return;
    if (list.length === 1) return read(list[0]);
    const v = await choose('Your mail', list.slice(0, 12).map(e => { const p = palById(e.pal); return { label: `${e.read ? '' : '✉️ '}${P(p ? p.name : e.pal)} · letter ${e.i + 1}`, sub: answered(e) ? 'answered' : e.read ? 'not answered yet' : 'new', value: e.key }; }));
    const e = v && list.find(x => x.key === v); if (e) await read(e);
  }
  async function desk() {
    if (!LIFE.ready()) return;
    const ta = toAnswer();
    if (!ta.length) { STORY.think(M().inbox.length ? `No letters to answer right now. ${nextNote() || 'More will come.'}` : 'A writing desk with paper and an inkpot. Letters come to the post counter first.', 5); return; }
    let e = ta[0];
    if (ta.length > 1) { const v = await choose('Write back to…', ta.map(x => { const p = palById(x.pal); return { label: P(p.name), sub: `letter ${x.i + 1} · ${LIFE.BANDS[p.letters[x.i].band]}`, value: x.key }; })); e = v && ta.find(x => x.key === v); }
    if (!e) return;
    if (!e.read) return read(e);
    return write(e);
  }
  async function album() {
    const m = M(), data = { pals: [], count: Object.keys(m.stamps).length, all: 0 };
    for (const p of pals()) {
      const st = ps(p.id); data.all += p.letters.length;
      if (!st.got && !palOpen(p)) { data.pals.push({ id: p.id, name: '?', where: { t: `writes when your level is ${LIFE.BANDS[p.from || 1]}` }, look: null, letters: p.letters.map(lt => ({ stamp: lt.stamp, got: false })) }); continue; }
      data.pals.push({ id: p.id, name: p.name, where: LIFE.line(p.where), look: p.look, letters: p.letters.map((lt, i) => ({ stamp: lt.stamp, got: !!m.stamps[lt.stamp.id] && i < st.got, answered: m.sent.some(s => s.key === keyOf(p.id, i)) })) });
    }
    const pick = await LIFEUI.album(data);
    if (!pick) return;
    const e = m.inbox.find(x => x.key === keyOf(pick.pal, pick.i)); if (!e) return;
    if (pick.kind === 'read') return read(e);
    const s = m.sent.find(x => x.key === e.key); if (s) return LIFEUI.review(s, viewOf(e));
  }

  // ------------------------------------------------------------ the side quest: «A letter for you»
  function quests() {
    const door = () => (typeof TOWNHALL !== 'undefined' ? (TOWNHALL.inside ? TOWNHALL.at('counter') : TOWNHALL.door()) : null);
    const mm = st => (st.life && st.life.mail) || { inbox: [], sent: [] };
    const ans = (st, e) => (mm(st).sent || []).some(s => s.key === e.key);
    return [{
      id: 'life.mail', kind: 'side',
      get title() { return 'A letter for you'; },
      get giver() { return 'the post office, in the town hall'; },
      started: st => !!(mm(st).inbox && mm(st).inbox.length) && LIFE.ready(),
      steps: [
        { text: 'Pick up your letter at the post office (the town hall, on the west street)', why: 'A pen pal from the valley wrote to you. Letters wait at the post counter.', done: st => !(mm(st).inbox || []).some(e => !e.read), target: door, hint: '{mimo} waves an imaginary envelope and points down the west street.' },
        { text: 'Write back at the post office’s desk', why: 'Answer what they asked: each letter has two or three points to write about.', done: st => !(mm(st).inbox || []).some(e => !ans(st, e)), target: () => (typeof TOWNHALL !== 'undefined' ? (TOWNHALL.inside ? TOWNHALL.at('desk') : TOWNHALL.door()) : null), hint: '{mimo} mimes writing with a very big pen.' },
      ],
      story: [{ when: st => (mm(st).sent || []).length > 0, get text() { const n = M().sent.length; return `You’ve written ${n} letter${n === 1 ? '' : 's'} to your pen pals. Their stamps go in your album at the post counter.`; } }],
    }];
  }

  // ------------------------------------------------------------ checks and tests (MAIL._.check / MAIL._.tests; the game never calls them)
  function check(l) {
    const out = [], c = LIFE.content(l); if (!c) return out;
    c.penpals.forEach(p => p.letters.forEach((lt, i) => {
      const w = keyOf(p.id, i);
      (lt.points || []).forEach(pt => { for (const [k] of Object.entries(pt.remember || {})) if (!/^pp_[a-z]+_\w+$/.test(k)) out.push(`${w}.${pt.id}: memory key ${k} (pp_<pal>_<name>)`); });
      const ids = new Set(); for (const pt of lt.points || []) { if (ids.has(pt.id)) out.push(`${w}: two points ${pt.id}`); ids.add(pt.id); }
    }));
    return out;
  }
  function tests(l) {
    const fails = [], counts = { letters: 0 };
    const ok = (cond, what) => { if (!cond) fails.push(what); return cond; };
    const c = LIFE.content(l); if (!c) return { fails: ['no content'], counts };
    const idk = { es: 'No sé.', pt: 'Não sei.', de: 'Ich weiß es nicht.', zh: '我不知道。', ja: 'わかりません。' }[l];
    const facts = TALK.facts(), keep = JSON.parse(JSON.stringify(facts)), missKeep = JSON.parse(JSON.stringify(M().missed));
    const txt = x => { const r = LIFE.raw(x); return r ? (LIFE.isC(l) ? CJK.chars(r.t, { lang: l }) : r.t) : ''; };
    try {
      for (const p of c.penpals) p.letters.forEach((lt, i) => {
        counts.letters++;
        const w = `${p.id}.${i + 1}`, model = txt(lt.model);
        const g = grade(lt, model), wk = grade(lt, LIFE.isC(l) ? CJK.chars(lt.weak, { lang: l }) : lt.weak), n = grade(lt, idk), en = grade(lt, LIFE.raw(lt.model).en);
        ok(g.score >= 10, `${w}: the model scores ${g.score}/12.5 (points ${g.points}, accuracy ${g.acc}, range ${g.range}, length ${g.len}, ${g.words} words; ${(g.errors || []).filter(e => !e.free).map(e => e.code + ' «' + e.fix + '»').join(', ')})`);
        ok(wk.score < 5, `${w}: the weak reply scores ${wk.score}`);
        ok(n.score === 0, `${w}: «${idk}» scores ${n.score}`);
        // (ja reads Latin text as rōmaji, so an English letter can find a stray word: it must stay a D there)
        ok(l === 'ja' ? en.score < 4.5 : en.score === 0, `${w}: the English scores ${en.score}`);
        // memory: the model reply's facts fill the next letter's slots
        const rem = (lt.points || []).filter(pt => pt.remember);
        if (rem.length) {
          for (const k of rem.flatMap(pt => Object.keys(pt.remember))) delete facts[k];
          remember(p, i, lt, model);
          for (const pt of rem) for (const k of Object.keys(pt.remember)) ok(!!facts[k], `${w}.${pt.id}: the model reply leaves no fact ${k}`);
          const nx = p.letters[i + 1];
          if (nx) {
            const src = JSON.stringify(nx.body || []), used = rem.flatMap(pt => Object.keys(pt.remember)).filter(k => src.includes('f.' + k));
            for (const k of used) { const v = facts[k] && facts[k].v; ok(!!v, `${p.id}.${i + 2}: no value for {f.${k}}`); }
          }
        }
      });
    } catch (e) { fails.push('mail threw: ' + (e && e.stack || e)); }
    finally { for (const k of Object.keys(facts)) if (!(k in keep)) delete facts[k]; Object.assign(facts, keep); M().missed = missKeep; }
    return { fails, counts };
  }

  function init(game) { G = game; }
  return {
    init, tick, counter, desk, album, read, write, post, open, quests, grade, checkPoints, countWords,
    inbox: () => M().inbox, pals,
    _: { T, check, tests, deliver, compose, viewOf, remember, keyOf, ps, palById, t: {
      // test hooks: the next letter of every pen pal now; a pen pal's letter now; read / post without the panels
      soon() { for (const p of pals()) { const st = ps(p.id); if (st.got <= st.ans) st.due = LIFE.now(); } tickT = 0; },
      deliver(id) { const p = palById(id); return p ? deliver(p) : null; },
      async post(key, text, o = {}) { const e = M().inbox.find(x => x.key === key); return e ? post(e, text, Object.assign({ quiet: true }, o)) : null; },
    } },
  };
})();
