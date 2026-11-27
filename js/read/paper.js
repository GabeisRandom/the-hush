'use strict';
// PAPER: «El Eco del Valle», the valley's weekly paper, on the rack in Alba's library (A1, 2026-11-27; DESIGN.md 21.16). The
// corner store sells the day's headlines (townlife.js); the library keeps the weekly edition, written for B1–B2 readers.
// Four hand-written editions per language (B1, B1, B2, B2), one a week from the quiz show's week «start» on (quiz.js's
// S().aired, the same weeks as the detective serial). An edition: the lead story, a second story, a letter to the editor,
// a column and small ads, all about Alba's own town life (true at any point in a save: nothing about the story's events);
// then the parts made fresh from the episode kit's banks (kit_<lang>.js): the weather for three days and a lost-and-found
// ad. Five reading questions (four hand-written, one on a made part), 2 coins a right answer the first time.
// When the save has Radio Alba's reporter job (A2's jobs.js: G.state.life.jobs.news, G.state.life.news[]), a box reprints
// the player's own items for the six o'clock news in this language, newest first, as they were typed (or says the first
// one is still to come).
//   PAPER.add(lang, { mast, sub, start, labels, desk, weather, found, tf, editions })   paper_<lang>.js (the shape is at its top)
//   PAPER.on() · out() · open(where) · read(ed, o) · edition(n) (with its made parts) · mast() · S() · init(game) · journal
//   PAPER.tests(l) · check(l) · strings(l) · _ (T: test flags)
// State: G.state.read.paper (saved with the game): { read: { edId: { at, right, of, coins, skill, again } }, coins }

const PAPER = (() => {
  let G = null;
  const L = () => READ.lang;
  const isCJ = l => l === 'zh' || l === 'ja';
  const esc = READ.esc, P = s => READ.plain(s), H = s => READ.html(s);
  const line = x => (!x ? null : Array.isArray(x) ? { t: x[0], en: x[1] || '' } : typeof x === 'string' ? { t: x, en: '' } : { t: x.t != null ? x.t : x.text, en: x.en || '' });
  const snd = k => { try { if (typeof Sound !== 'undefined') Sound.play(k); } catch (e) { /* */ } };
  const tapWords = s => (typeof READER !== 'undefined' && READER.wordsHTML ? READER.wordsHTML(s) : H(s));
  const LANGNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  const COIN = 2;
  const T = { auto: null, hold: false, last: null };          // tests: answer for you ('model' | 'wrong'), keep the card open
  const SECS = ['lead', 'news', 'letter', 'column'];

  // ------------------------------------------------------------ content
  const C = {};
  function add(lang, def = {}) {
    const o = C[lang] || (C[lang] = { editions: [] });
    for (const k of ['mast', 'sub', 'start', 'labels', 'desk', 'weather', 'found', 'tf', 'empty']) if (def[k] != null) o[k] = def[k];
    for (const e of def.editions || []) { e.lang = lang; const i = o.editions.findIndex(x => x.id === e.id); if (i >= 0) o.editions[i] = e; else o.editions.push(e); }
    o.editions.sort((a, b) => a.n - b.n);
    built.clear();
    if (isCJ(lang) && typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(strings(lang).map(x => x.s)); } catch (e) { /* */ } }
    return o;
  }
  const content = (l = L()) => C[l] || null;
  const on = () => { const c = content(); return !!(c && c.mast && c.editions.length && READ.on()); };
  const mast = () => { const c = content(); return c && c.mast ? P(line(c.mast).t) : ''; };
  function S() {
    const r = READ.S(), o = r.paper || (r.paper = {});
    o.v = 1; o.read = o.read || {}; o.coins = o.coins || 0;
    return o;
  }
  // editions out so far: from the quiz show's week «start» on, one a week
  function out() {
    if (!on() || typeof QUIZ === 'undefined' || !QUIZ.started()) return 0;
    const c = content();
    return Math.max(0, Math.min(c.editions.length, (QUIZ.S().aired || 0) - (c.start || 3) + 1));
  }
  const isRead = e => !!S().read[e.id];

  // ------------------------------------------------------------ an edition with its made parts (the kit's banks, seeded by its id)
  const built = new Map();
  const banks = l => (typeof KIT !== 'undefined' && KIT._ && KIT._.C[l] ? KIT._.C[l].banks : null);
  function made(ed, l) {
    const c = C[l], B = banks(l), K = typeof KIT !== 'undefined' ? KIT._ : null, out0 = { weather: [], found: null, item: null };
    if (!B || !K) return out0;
    const fill = (s, V) => K.fillStr(s, V);
    // the weather: three days in a row, three skies
    const w = c.weather;
    if (w && B.sky && B.day && B.day.length) {
      const R = K.rng(K.hash(ed.id + '|weather')), tags = w.tags || ['warm', 'wet'];
      const skies = B.sky.filter(s => (s.tags || []).some(t => tags.includes(t))), used = new Set();
      const d0 = Math.floor(R() * Math.max(1, B.day.length - 2));
      for (let i = 0; i < 3 && skies.length; i++) {
        const d = B.day[(d0 + i) % B.day.length];
        let pool = skies.filter(s => !used.has(s.id)); if (!pool.length) pool = skies;
        const s = pool[Math.floor(R() * pool.length) % pool.length]; used.add(s.id);
        const row = s.n != null && w.rowT ? w.rowT : w.row, V = { d, s };
        out0.weather.push({ t: fill(row[0], V), en: fill(row[1], V), d, s });
      }
    }
    // the lost-and-found ad
    const f = c.found;
    if (f && B.item && B.item.length && B.place && B.place.length) {
      const R = K.rng(K.hash(ed.id + '|found')), i = B.item[Math.floor(R() * B.item.length) % B.item.length], p = B.place[Math.floor(R() * B.place.length) % B.place.length];
      out0.found = { t: fill(f.ad[0], { i, p }), en: fill(f.ad[1], { i, p }), i, p };
    }
    // the question on a made part: odd editions the weather, even ones the lost-and-found ad
    const R = K.rng(K.hash(ed.id + '|q'));
    if (ed.n % 2 && out0.weather.length >= 2 && w && w.ask) {
      const day = out0.weather[1], tags = w.tags || ['warm', 'wet'], seen = new Set([P(day.s.short)]), opts = [[day.s.short, day.s.shortEn || '']];
      const others = B.sky.filter(s => (s.tags || []).some(t => tags.includes(t))).slice();
      for (let k = others.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [others[k], others[j]] = [others[j], others[k]]; }
      for (const s of others) { const v = P(s.short); if (seen.has(v)) continue; seen.add(v); opts.push([s.short, s.shortEn || '']); if (opts.length >= 3) break; }
      if (opts.length >= 3) out0.item = { type: 'mc', ask: [fill(w.ask[0], { d: day.d }), fill(w.ask[1], { d: day.d })], opts, key: 0, made: 'weather' };
    } else if (out0.found && f.ask) {
      const it = out0.found.i, seen = new Set([P(it.t)]), opts = [[it.t, it.en || '']], others = B.item.slice();
      for (let k = others.length - 1; k > 0; k--) { const j = Math.floor(R() * (k + 1)); [others[k], others[j]] = [others[j], others[k]]; }
      for (const x of others) { const v = P(x.t); if (seen.has(v)) continue; seen.add(v); opts.push([x.t, x.en || '']); if (opts.length >= 3) break; }
      if (opts.length >= 3) out0.item = { type: 'mc', ask: [fill(f.ask[0], { p: out0.found.p }), fill(f.ask[1], { p: out0.found.p })], opts, key: 0, made: 'found' };
    }
    return out0;
  }
  // the whole edition: its paragraphs in reading order (each section's text, the ads, the made parts), its five questions
  function build(ed, l = ed.lang || L()) {
    const key = `${l}|${ed.id}`; if (built.has(key)) return built.get(key);
    const paras = [], at = {};
    for (const sec of SECS) { const s = ed[sec]; if (!s) continue; at[sec] = paras.length; (s.text || []).forEach(x => paras.push(Object.assign({ sec }, line(x)))); }
    at.ads = paras.length; (ed.ads || []).forEach(x => paras.push(Object.assign({ sec: 'ads' }, line(x))));
    const m = made(ed, l);
    if (m.found) { at.found = paras.length; paras.push({ sec: 'ads', t: m.found.t, en: m.found.en, made: true }); }
    at.weather = paras.length; m.weather.forEach(x => paras.push({ sec: 'weather', t: x.t, en: x.en, made: true }));
    const items = (ed.items || []).slice();
    if (m.item) items.push(Object.assign({}, m.item, { at: m.item.made === 'weather' ? at.weather + 1 : at.found }));
    const b = Object.assign({}, ed, { paras, at, made: m, items });
    built.set(key, b);
    return b;
  }
  const edition = n => { const c = content(); const e = c && c.editions.find(x => x.n === n); return e ? build(e) : null; };

  // ------------------------------------------------------------ Radio Alba's reporter: the player's items (A2's G.state.life.news)
  function desk(l = L()) {
    const life = G && G.state && G.state.life; if (!life) return null;
    const job = life.jobs && life.jobs.news, hired = !!(job && job.rank > 0);
    if (!hired && !Array.isArray(life.news)) return null;                 // (no reporter job in this save: no box)
    return (Array.isArray(life.news) ? life.news : []).filter(x => x && x.lang === l && String(x.text || '').trim()).slice(-3).reverse();
  }
  function deskHTML(list) {
    const c = content(), d = c.desk || {}, ti = line(d.title) || { t: '', en: '' };
    let h = `<div class="pp-box pp-desk"><h4>${H(ti.t)} <span class="en">${esc(ti.en)}</span></h4>`;
    if (!list.length) { const e = line(d.empty) || { t: '', en: '' }; h += `<p class="pp-p" data-text="${esc(e.t)}">${tapWords(e.t)}<span class="en">${esc(e.en)}</span></p>`; }
    for (const x of list) h += `<div class="pp-item"><b>${H(x.title || '')}</b>${x.titleEn ? ` <span class="en">${esc(x.titleEn)}</span>` : ''}<p class="pp-typed">${esc(x.text)}</p><small>✎ your item for Radio Alba${x.grade ? ` · ${esc(x.grade)}` : ''}</small></div>`;
    return h + '</div>';
  }

  // ------------------------------------------------------------ the rack: this week's edition, or the back issues
  const choose = async (title, opts) => { const was = G.sim.lock; G.sim.lock = 1; try { return await UI.choose(title, opts); } finally { G.sim.lock = was; } };
  const think = (t, s) => { try { STORY.think(t, s || 4); } catch (e) { /* */ } };
  async function open() {
    if (!on()) return null;
    const c = content(), n = out(), name = `«${mast()}»`;
    if (!n) { think(`The paper rack is empty for now. A card says: ${name}, a new edition every week.`, 4.5); return null; }
    const eds = c.editions.filter(e => e.n <= n).map(e => build(e)), fresh = eds.filter(e => !isRead(e));
    if (fresh.length === 1 && eds.length === 1) return read(fresh[0]);
    const opts = eds.slice().reverse().map(e => {
      const r = S().read[e.id], hd = line(e.lead.head);
      return { label: `📰 ${name} No. ${e.n}: ${P(hd.t)} · ${READ.BAND(e.band)}${r ? '' : ' · NEW'}`, sub: `${hd.en}${r ? ` · read: ${r.right}/${r.of} (again: practice, no coins)` : ` · ${COIN} coins a right answer`}`, value: e };
    });
    const e = await choose(`${name}: ${n < c.editions.length ? 'the newest edition, or an older one' : 'every edition so far'}${n < c.editions.length ? ' (a new one every week)' : ''}`, opts);
    return e ? read(e) : null;
  }

  // ------------------------------------------------------------ reading an edition: the page, then five questions
  const CSS = `
#qz.paper .qz-top { background: linear-gradient(180deg, #45434c, #2a2830); border-bottom-color: #c9c1ae; }
#qz .pp-body { flex: 1; min-height: 0; display: grid; grid-template-columns: 1.3fr .95fr; }
#qz .pp-page { overflow: auto; padding: 12px 18px 16px; background: #f4f0e4; border-right: 2px dashed rgba(43,34,53,.18); font: 16px/1.5 Georgia, "Times New Roman", serif; color: #24222a; }
#qz .pp-mast { text-align: center; border-bottom: 4px double #24222a; margin-bottom: 10px; }
#qz .pp-name { font: 900 34px/1.08 Georgia, "Times New Roman", serif; letter-spacing: .05em; }
#qz .pp-line { display: flex; justify-content: space-between; gap: 8px; font: 700 11.5px "Segoe UI", sans-serif; border-top: 1.5px solid #24222a; padding: 3px 0; margin-top: 5px; text-transform: uppercase; letter-spacing: .06em; }
#qz .pp-kick { display: block; font: 800 11px "Segoe UI", sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #8a2f2f; }
#qz .pp-lead h2 { font: 900 27px/1.13 Georgia, serif; margin: 2px 0 3px; }
#qz .pp-sec h3 { font: 800 19px/1.2 Georgia, serif; margin: 2px 0 3px; }
#qz .pp-hen { display: none; font: italic 13px "Segoe UI", sans-serif; opacity: .7; margin: -2px 0 4px; }
#qz .pp-by { font: italic 13.5px Georgia, serif; opacity: .78; margin: 0 0 6px; }
#qz .pp-p { margin: 0 0 8px; border-radius: 4px; } #qz .pp-p .en, #qz .pp-box h4 .en, #qz .pp-item .en { display: none; font: italic 13px/1.35 "Segoe UI", sans-serif; opacity: .7; }
#qz .pp-page.en-on .pp-p .en, #qz .pp-page.en-on .pp-hen, #qz .pp-page.en-on .pp-box h4 .en, #qz .pp-page.en-on .pp-item .en { display: block; }
#qz .pp-p.ev { background: #d9f0ea; box-shadow: 0 0 0 3px #d9f0ea; }
#qz .pp-cols { column-count: 2; column-gap: 22px; column-rule: 1px solid rgba(36,34,42,.28); margin-top: 8px; }
#qz .pp-sec { margin-bottom: 12px; } #qz .pp-sec + .pp-sec { border-top: 1px solid rgba(36,34,42,.28); padding-top: 8px; }
#qz .pp-lead { border-bottom: 1.5px solid #24222a; padding-bottom: 6px; }
#qz .pp-letter { font-style: italic; }
#qz .pp-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
#qz .pp-box { border: 2px solid #24222a; padding: 7px 10px; background: #fbf8ef; break-inside: avoid; }
#qz .pp-box h4 { font: 900 13px "Segoe UI", sans-serif; letter-spacing: .08em; text-transform: uppercase; margin: 0 0 5px; }
#qz .pp-box .pp-p { font-size: 15px; margin-bottom: 5px; } #qz .pp-ads .pp-p { border-bottom: 1px dashed rgba(36,34,42,.3); padding-bottom: 4px; }
#qz .pp-desk { grid-column: 1 / -1; background: #fff6dd; } #qz .pp-item { margin: 4px 0 8px; } #qz .pp-typed { margin: 2px 0; font-size: 15.5px; }
#qz .pp-item small { font: 600 11.5px "Segoe UI", sans-serif; opacity: .65; }
#qz .pp-side { overflow: auto; padding: 12px 16px; }
#qz .pp-tools { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; margin: 0 0 8px; }
@media (max-width: 760px) { #qz .pp-body { grid-template-columns: 1fr; overflow: auto; } #qz .pp-page { overflow: visible; border-right: 0; border-bottom: 2px dashed rgba(43,34,53,.18); } #qz .pp-side { overflow: visible; } #qz .pp-cols { column-count: 1; } #qz .pp-boxes { grid-template-columns: 1fr; } }
`;
  function css() { QUIZ.UI.css(); if (document.getElementById('pp-css')) return; const s = document.createElement('style'); s.id = 'pp-css'; s.textContent = CSS; document.head.appendChild(s); }
  // the header's little picture: a folded paper (the game's one ink line)
  function logo(cv) {
    const c = cv && cv.getContext && cv.getContext('2d'); if (!c) return;
    const w = cv.width, h = cv.height; c.clearRect(0, 0, w, h); c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = '#2b2235';
    c.save(); c.translate(w / 2, h / 2 + 4); c.rotate(-0.08);
    c.fillStyle = '#fbf6e7'; c.fillRect(-62, -44, 124, 88); c.strokeRect(-62, -44, 124, 88);
    c.fillStyle = '#2b2235'; c.fillRect(-50, -34, 100, 12);
    c.lineWidth = 3; for (const [x0, x1] of [[-50, -4], [6, 50]]) for (let y = -12; y <= 32; y += 9) { c.beginPath(); c.moveTo(x0, y); c.lineTo(x1 - ((y * 7) % 11), y); c.stroke(); }
    c.restore();
  }
  function secHTML(b, sec) {
    const s = b[sec]; if (!s) return '';
    const lab = (content().labels || {})[sec], hd = line(s.head) || { t: '', en: '' }, by = line(s.by), kick = line(lab);
    const ps = b.paras.map((p, i) => Object.assign({ i }, p)).filter(p => p.sec === sec && !p.made);
    return `<section class="pp-sec pp-${sec}">${kick ? `<span class="pp-kick">${H(kick.t)}</span>` : ''}${sec === 'lead' ? '<h2' : '<h3'} class="pp-h">${H(hd.t)}${sec === 'lead' ? '</h2>' : '</h3>'}<div class="pp-hen">${esc(hd.en)}</div>`
      + (by ? `<p class="pp-by">${H(by.t)}</p>` : '')
      + ps.map(p => `<p class="pp-p" data-i="${p.i}" data-text="${esc(p.t)}">${tapWords(p.t)}<span class="en">${esc(p.en)}</span></p>`).join('') + '</section>';
  }
  function pageHTML(b) {
    const c = content(), lab = c.labels || {}, sub = line(c.sub) || { t: '', en: '' }, no = line(lab.no) || { t: 'Nº', en: '' };
    const ads = b.paras.map((p, i) => Object.assign({ i }, p)).filter(p => p.sec === 'ads'), wx = b.paras.map((p, i) => Object.assign({ i }, p)).filter(p => p.sec === 'weather');
    const box = (cls, lb, ps) => { const l0 = line(lb) || { t: '', en: '' }; return `<div class="pp-box ${cls}"><h4>${H(l0.t)} <span class="en">${esc(l0.en)}</span></h4>${ps.map(p => `<p class="pp-p" data-i="${p.i}" data-text="${esc(p.t)}">${tapWords(p.t)}<span class="en">${esc(p.en)}</span></p>`).join('')}</div>`; };
    const dk = desk();
    return `<div class="pp-mast"><div class="pp-name">${H(line(c.mast).t)}</div><div class="pp-line"><span>${H(sub.t)}</span><span>${H(no.t)} ${b.n}</span><span>${H((line(lab.town) || { t: 'Alba' }).t)}</span></div></div>`
      + secHTML(b, 'lead') + `<div class="pp-cols">${secHTML(b, 'news')}${secHTML(b, 'letter')}${secHTML(b, 'column')}</div>`
      + `<div class="pp-boxes">${wx.length ? box('pp-weather', lab.weather, wx) : ''}${box('pp-ads', lab.ads, ads)}${dk ? deskHTML(dk) : ''}</div>`;
  }
  async function read(b, o = {}) {
    if (!b || !G) return null;
    if (!b.paras) b = build(b);
    const c = content(), lang = L(), s = S(), first = !s.read[b.id] && !o.practice, tf = c.tf || null;
    css();
    const items = b.items.map((raw, k) => QUIZ.ITEMS.resolve(raw, k, QUIZ._.hash(b.id) ^ (((s.read[b.id] && s.read[b.id].again) || 0) * 7919 + 29)));
    const r = QUIZ.UI.open('paper');
    const chip = first ? '<i class="qz-chip new">new edition</i>' : '<i class="qz-chip prac">read again · practice</i>';
    r.innerHTML = `<div class="qz-shade"></div><div class="qz-card"><div class="qz-top"><canvas class="qz-logo" width="208" height="128"></canvas>`
      + `<div class="qz-ttl"><b>${H(line(c.mast).t)}</b><small>📰 No. ${b.n} · ${H(line(b.lead.head).t)} <span class="en">${esc(line(b.lead.head).en)}</span></small></div>`
      + `<span><i class="qz-chip">${READ.BAND(b.band)}</i>${chip}</span><button class="qz-x" title="Close (Esc)">✕</button></div>`
      + `<div class="pp-body"><div class="pp-page">${pageHTML(b)}</div><div class="pp-side"><div class="pp-tools"><button class="qz-btn" data-a="en">EN under the text</button><span class="qz-note">Tap a word for what it means.</span></div><div class="qz-after"></div>`
      + `<div class="qz-h">Your reading · ${items.length} questions${first ? ` · ${COIN} coins a right answer` : ''}</div>`
      + (first ? '' : '<p class="qz-note">Read again: no coins. Your answers still count toward your reading.</p>')
      + `<div class="qz-items">${items.map((it, i) => QUIZ.ITEMS.html(it, i + 1, { tf, say: false, placeholder: `A short answer, in ${LANGNAME[lang] || 'the language'}` })).join('')}</div></div></div>`
      + `<div class="qz-foot"><span class="nt">Read the paper, then answer. Every answer is in it.</span><span class="sp"></span><button class="qz-btn main" data-a="lock">Lock in my answers ▸</button></div></div>`;
    const card = r.querySelector('.qz-card'), page = card.querySelector('.pp-page'), side = card.querySelector('.pp-side'), lockB = card.querySelector('[data-a="lock"]'), foot = card.querySelector('.qz-foot .nt');
    logo(card.querySelector('.qz-logo'));
    card.querySelector('[data-a="en"]').onclick = e => { page.classList.toggle('en-on'); e.currentTarget.classList.toggle('on'); snd('click'); };
    if (typeof READER !== 'undefined' && READER.taps) READER.taps(page, { host: r });
    const A = {}; let locked = false, sure = false, result = null;
    QUIZ.ITEMS.wire(side, items, A, { change: () => { sure = false; } });
    function lockIn() {
      if (locked) return;
      const empty = items.filter(it => !QUIZ.ITEMS.answered(QUIZ.ITEMS.answer(side, it, A))).length;
      if (empty && !sure && !T.auto) { sure = true; foot.innerHTML = `<b style="color:#9a3a22">${empty} question${empty > 1 ? 's have' : ' has'} no answer yet. Press again to lock in anyway.</b>`; return; }
      locked = true;
      const res = items.map(it => { const a = QUIZ.ITEMS.answer(side, it, A), sc = QUIZ.ITEMS.score(it, a, lang); try { DICT.log('read', b.band, sc); } catch (e) { /* */ } return { it, a, s: sc }; });
      b.paras.forEach(p => { try { READER.markRead(p.t, 'read'); } catch (e) { /* */ } });
      res.forEach(x => QUIZ.ITEMS.mark(side, x.it, x.a, x.s, { tf, where: true, ansWord: 'The answer:' }));
      side.querySelectorAll('[data-at]').forEach(btn => { btn.textContent = 'Where is it?'; btn.onclick = () => { page.querySelectorAll('.pp-p.ev').forEach(x => x.classList.remove('ev')); const p = page.querySelector(`.pp-p[data-i="${btn.dataset.at}"]`); if (p) { p.classList.add('ev'); p.scrollIntoView({ block: 'center' }); } }; });
      const total = res.reduce((a, x) => a + x.s, 0), max = res.length, perfect = max > 0 && res.every(x => x.s >= 1);
      let coins = 0;
      if (first) {
        coins = Math.round(total * COIN);
        s.read[b.id] = { at: Date.now(), right: Math.round(total * 10) / 10, of: max, coins, skill: 'read' };
        if (coins) { G.state.coins = (G.state.coins || 0) + coins; s.coins += coins; }
      } else if (s.read[b.id]) s.read[b.id].again = (s.read[b.id].again || 0) + 1;
      READ.save();
      const fmt = x => (Math.round(x * 10) / 10).toString();
      const prize = [`<span class="big">${fmt(total)} / ${max}</span>`];
      if (first) prize.push(`<span class="it">🪙 +${coins} coins (${COIN} a right answer, the first time you read an edition)</span>`);
      else prize.push('<span class="it">Read again: no coins, but it counts as practice.</span>');
      if (perfect) prize.push(`<span class="it">${esc(READ.mimo())} nods: every answer right!</span>`);
      const nx = out() < c.editions.length ? 'A new edition comes out next week.' : 'That’s every edition so far: read any of them again from the rack.';
      side.querySelector('.qz-after').innerHTML = `<div class="qz-prize">${prize.join('')}</div><p class="qz-note">${esc(nx)}</p>`;
      side.scrollTop = 0;
      snd(perfect ? 'learned' : total / Math.max(1, max) >= 0.5 ? 'chest' : 'review'); if (coins) snd('chest');
      foot.textContent = `Your answers count toward your reading (${READ.BAND(b.band)}). “Where is it?” shows the line in the paper.`;
      lockB.textContent = 'Close ▸';
      result = { id: b.id, total, max, first, coins };
      T.last = result;
    }
    let closed = false, done = null;
    const fin = new Promise(res => { done = res; });
    const finish = () => { if (closed) return; closed = true; done(); };
    lockB.onclick = () => (locked ? finish() : lockIn());
    card.querySelector('.qz-x').onclick = finish;
    QUIZ.UI.keys(e => {
      if (e.code === 'Escape') { if (typeof READER !== 'undefined' && READER.glossOpen) READER.hideGloss(); else finish(); return true; }
      if (e.code === 'Enter') { if (locked) finish(); else lockIn(); return true; }
      return false;
    });
    try {
      if (T.auto) setTimeout(() => {
        for (const it of items) QUIZ.ITEMS.put(side, it, QUIZ.ITEMS.auto(it, T.auto, lang), A);
        lockIn(); if (!T.hold) setTimeout(finish, 20);
      }, 20);
      await fin;
      return result;
    } finally { QUIZ.UI.close(); }
  }

  // ------------------------------------------------------------ the journal's Reading page (READ.more)
  const journal = {
    show: () => on() && Object.keys(S().read).length > 0,
    html() {
      if (!on() || !Object.keys(S().read).length) return '';
      QUIZ.UI.css();
      const c = content(), s = S(), n = out();
      let h = `<h4 class="ph-h">📰 ${H(line(c.mast).t)}: ${Object.keys(s.read).length} of ${c.editions.length} editions read</h4><div class="qz-j">`;
      for (const e of c.editions) {
        if (e.n > n && !s.read[e.id]) continue;
        const r = s.read[e.id], hd = line(e.lead.head);
        h += `<div class="row"><b>No. ${e.n}</b> · ${H(hd.t)} <span style="opacity:.7;font-style:italic">${esc(hd.en)}</span> · ${READ.BAND(e.band)}${r ? ` · ${r.right}/${r.of}` : ' · <i>on the library’s rack, not read yet</i>'}</div>`;
      }
      return h + '<div class="row" style="opacity:.75">The rack is in the library, by the east window.</div></div>';
    },
  };
  function init(game) {
    G = game; S();
    if (READ.more && !READ.more.includes(journal)) READ.more.push(journal);
  }

  // ------------------------------------------------------------ checks and tests (PAPER.tests(l); the game never calls them)
  function strings(lang) {
    const c = C[lang], out0 = []; if (!c) return out0;
    const put = (where, s) => { if (typeof s === 'string' && s.trim()) out0.push({ where, s, l: lang }); };
    put('mast', line(c.mast) && line(c.mast).t); put('sub', line(c.sub) && line(c.sub).t);
    for (const [k, v] of Object.entries(c.labels || {})) put('labels.' + k, line(v) && line(v).t);
    for (const k of ['title', 'empty']) put('desk.' + k, line((c.desk || {})[k]) && line((c.desk || {})[k]).t);
    if (c.weather) { put('weather.row', c.weather.row && c.weather.row[0]); put('weather.rowT', c.weather.rowT && c.weather.rowT[0]); put('weather.ask', c.weather.ask && c.weather.ask[0]); }
    if (c.found) { put('found.ad', c.found.ad && c.found.ad[0]); put('found.ask', c.found.ask && c.found.ask[0]); }
    (c.tf || []).forEach((x, i) => put('tf.' + i, x[0]));
    for (const e of c.editions) {
      for (const sec of SECS) { const s = e[sec]; if (!s) continue; put(`${e.id}.${sec}.head`, line(s.head) && line(s.head).t); if (s.by) put(`${e.id}.${sec}.by`, line(s.by).t); (s.text || []).forEach((x, i) => put(`${e.id}.${sec}.${i}`, line(x).t)); }
      (e.ads || []).forEach((x, i) => put(`${e.id}.ad${i}`, line(x).t));
      (e.items || []).forEach((it, i) => { const w = `${e.id}.q${i}`; put(w + '.ask', line(it.ask).t); (it.opts || []).forEach((x, j) => put(`${w}.opt${j}`, line(x).t)); if (it.model) put(w + '.model', line(it.model).t); });
    }
    return out0;
  }
  function check(langs = ['zh', 'ja']) {
    const bad = []; if (typeof CJK === 'undefined') return bad;
    for (const l of [].concat(langs)) for (const { where, s } of strings(l)) { const p = CJK.validate(READ.fill(s).replace(/\{\w+\.\w+\^?\}/g, '').replace(/ {2,}/g, ' ').trim(), l); if (p && p.length) bad.push({ where, s, p }); }     // (the made parts' placeholders are filled from the kit: tests validate those filled)
    return bad;
  }
  const wordsIn = (s, l) => (isCJ(l) ? CJK.plain(READ.fill(s), { lang: l, mode: 'chars' }).replace(/[\s\p{P}]/gu, '').length : String(READ.fill(s)).split(/\s+/).filter(Boolean).length);
  const typedAs = (s, l) => (isCJ(l) ? CJK.plain(READ.fill(String(s || '')), { lang: l }) : READ.fill(String(s || '')));
  function tests(l = L()) {
    const was = typeof LEX !== 'undefined' ? LEX.lang : l; if (typeof LEX !== 'undefined') LEX.lang = l;
    const fails = [], ok = (c0, what) => { if (!c0) fails.push(what); return c0; }, counts = { editions: 0, items: 0, words: {}, grades: {}, made: {} };
    try {
      const c = C[l]; if (!c || !c.mast) return { lang: l, ok: false, fails: ['no paper'] };
      ok(line(c.mast) && line(c.mast).en && line(c.sub) && line(c.sub).en, 'mast and sub, with English');
      for (const k of ['lead', 'news', 'letter', 'column', 'ads', 'weather', 'no', 'town']) ok(line((c.labels || {})[k]), `labels.${k}`);
      ok(line((c.desk || {}).title) && line(c.desk.title).en && line(c.desk.empty) && line(c.desk.empty).en, 'desk: title and empty, with English');
      ok(c.weather && c.weather.row && c.weather.rowT && c.weather.ask && c.found && c.found.ad && c.found.ask, 'weather (row, rowT, ask) and found (ad, ask)');
      ok((c.tf || []).length === 3, 'tf: three labels');
      ok(c.editions.length === 4 && c.editions.every((e, i) => e.n === i + 1), 'four editions, numbered 1–4');
      const K = typeof KIT !== 'undefined' ? KIT._ : null;
      for (const e of c.editions) {
        counts.editions++;
        const w = e.id, b = build(e, l);
        ok(e.band === (e.n <= 2 ? 3 : 4), `${w}: band ${e.band} (editions 1–2 B1, 3–4 B2)`);
        for (const sec of SECS) ok(e[sec] && line(e[sec].head) && line(e[sec].head).en && (e[sec].text || []).length && e[sec].text.every(x => line(x).en), `${w}.${sec}: head and text, with English`);
        ok((e.ads || []).length >= 2 && e.ads.every(x => line(x).en), `${w}: two ads or more, with English`);
        let n = 0; for (const p of b.paras) if (!p.made) n += wordsIn(p.t, l);
        counts.words[w] = n;
        const lo = isCJ(l) ? (e.band === 3 ? 480 : 600) : (e.band === 3 ? 300 : 380);
        ok(n >= lo, `${w}: ${n} ${isCJ(l) ? 'characters' : 'words'} (${lo}+ wanted)`);
        // the made parts: there, filled, agreeing (the pack's grammar check), and a question on one of them
        ok(b.made.weather.length === 3 && b.made.found, `${w}: the made weather (3 days) and lost-and-found ad`);
        counts.made[w] = b.made.item ? b.made.item.made : 'none';
        for (const p of b.paras.filter(x => x.made)) {
          ok(!/\{\w+\.\w+\^?\}/.test(p.t + p.en), `${w}: an unfilled placeholder in «${p.t}» / «${p.en}»`);
          if (!isCJ(l) && typeof DICT !== 'undefined' && DICT.check) { let r = null; try { r = DICT.check(READ.fill(p.t)); } catch (er) { /* */ } const major = r ? r.errors.filter(x => x.sev === 'major' && !x.free) : []; ok(!major.length, `${w}: «${p.t}» ${major.map(x => x.code + ' → «' + x.fix + '»').join(', ')}`); }
          if (isCJ(l)) { const pr = CJK.validate(READ.fill(p.t), l); ok(!(pr && pr.length), `${w}: CJK «${p.t}» ${(pr || []).join('; ')}`); }
        }
        ok((e.items || []).length === 4 && b.items.length === 5, `${w}: ${(e.items || []).length} hand-written items (4 wanted) and ${b.items.length} in all (5 wanted)`);
        b.items.forEach((raw, k) => {
          counts.items++; const iw = `${w} #${k + 1} (${raw.type}${raw.made ? ', made' : ''})`;
          ok(['mc', 'tf', 'tfn', 'short', 'match'].includes(raw.type) && line(raw.ask) && line(raw.ask).en, iw + ': type and question with English');
          ok(raw.at != null && raw.at >= 0 && raw.at < b.paras.length, iw + ': at (a paragraph of the edition)');
          if (raw.type === 'mc') ok((raw.opts || []).length >= 3 && raw.opts.every(x => line(x).en) && raw.key >= 0 && raw.key < raw.opts.length, iw + ': options with English, a key');
          if (raw.type === 'short') ok(raw.want && raw.model && line(raw.model).en, iw + ': want and model');
          if (raw.made) ok(!/\{\w+\.\w+\^?\}/.test(JSON.stringify(raw)), iw + ': an unfilled placeholder');
          for (const seed of [3, 17]) {
            const it = QUIZ.ITEMS.resolve(raw, k, seed), right = QUIZ.ITEMS.auto(it, 'model', l), sc = QUIZ.ITEMS.score(it, right, l);
            ok(sc === 1, `${iw}: the right answer scores ${sc} («${JSON.stringify(right)}»)`);
            if (raw.type !== 'short') ok(QUIZ.ITEMS.score(it, QUIZ.ITEMS.auto(it, 'wrong', l), l) < 1, `${iw}: a wrong answer scores 1`);
            else { ok(QUIZ.ITEMS.score(it, QUIZ.ITEMS.IDK[l], l) === 0, `${iw}: «${QUIZ.ITEMS.IDK[l]}» scores`); ok(QUIZ.ITEMS.score(it, 'I don’t know', l) === 0, `${iw}: English scores`); }
          }
          if (raw.type === 'short' && typeof EXAM !== 'undefined') { const g = EXAM.grade.turn(typedAs(line(raw.model).t, l), { want: { any: true } }, e.band, l), gr = g && g.understood ? g.grade : 'NU'; counts.grades[gr] = (counts.grades[gr] || 0) + 1; ok(gr === 'S' || gr === 'A', `${iw}: the model grades ${gr}`); }
        });
      }
      ok(Object.values(counts.made).filter(x => x === 'weather').length >= 1 && Object.values(counts.made).filter(x => x === 'found').length >= 1, 'a made question on the weather and one on the lost-and-found ad');
      // the reporter's box: built from A2's shape, empty or not
      if (G && G.state) {
        const st = G.state, had = Object.prototype.hasOwnProperty.call(st, 'life'), keep = st.life;
        try {
          st.life = { jobs: { news: { rank: 3 } }, news: [{ at: 1, day: 3, story: 'bread', lang: l, script: '', band: 3, title: line(c.mast).t, titleEn: 'test', text: 'x', grade: 'A', score: 0.8 }] };
          const d1 = desk(l); ok(d1 && d1.length === 1 && /pp-desk/.test(deskHTML(d1)), 'desk: a box with an item');
          st.life = { jobs: { news: { rank: 1 } } };
          const d2 = desk(l); ok(d2 && d2.length === 0 && /pp-desk/.test(deskHTML(d2)), 'desk: hired, no items yet: the box says so');
          st.life = { jobs: { news: { rank: 0 } } };
          ok(desk(l) === null, 'desk: no reporter job: no box');
        } catch (er) { fails.push('desk threw: ' + er); }
        finally { if (had) st.life = keep; else delete st.life; }
      }
      if (isCJ(l)) check([l]).forEach(x => fails.push(`CJK ${x.where}: ${x.p.join('; ')}`));
    } catch (e) { fails.push('threw: ' + ((e && e.stack) || e)); }
    finally { if (typeof LEX !== 'undefined') LEX.lang = was; }
    return { lang: l, ok: !fails.length, fails, counts };
  }

  return {
    add, content, on, out, open, read, edition, mast, S, init, journal, strings, check, tests,
    _: { C, T, build, made, desk, deskHTML, pageHTML, built },
  };
})();
