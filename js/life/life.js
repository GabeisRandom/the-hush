'use strict';
// LIFE: life in Alba, the writing and speaking half of the tests hidden in the world (DESIGN.md 21.2 D; D2).
//   • Pen pals (mail.js, MAIL): three per language write to you at Alba's post office; you write back at its desk. Each
//     letter is graded like the exams' writing (EXAM.grade.write) and logged as 'write'; what you tell them is kept with
//     TALK.remember and their next letter picks it up.
//   • Part-time jobs (jobs.js, JOBS): the bakery, the library, the inn, the ferry and the post office. An interview (a
//     TALK.play scene at your level, logged 'talk'), then short shifts for coins, three per work day.
//   • Town debates (debate.js, DEBATE): a topic a month at the town hall, B1–B2: your opinion, an answer to the other side,
//     a closing line, then the townsfolk vote.
//   • The building (townhall.js, TOWNHALL): Alba's house 11 on the west street, the town hall and post office downstairs,
//     Leandro the stargazer's flat upstairs (his own door, by the outside stair). The panels are life_ui.js (LIFEUI).
// The API:
//   LIFE.add(lang, { place, clerk, mayor, lines, penpals, jobs, interview, shifts, debates, phrases, goods })  content_<lang>.js
//   LIFE.ready(l) · content(l) · S() (the save: G.state.life) · now() · day() · dayLeft() · level() · band()
//   LIFE.line(x, vars, ctx) → { t, en, who } · fill(s, vars) · P(s) · H(s) · E(s) · coins(n) · give(id, n) · teach(id)
//   LIFE.init(game) · update(dt, t, you) (main.js) · _ (checks and tests: LIFE._.check(lang), LIFE._.tests(lang))
// Nothing here is sent anywhere: what you write stays in your save.

const LIFE = (() => {
  let G = null;
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = (l = L()) => l === 'zh' || l === 'ja';
  const cj = (l = L()) => isC(l) && typeof CJK !== 'undefined';
  const E = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const P = (s, l = L()) => (cj(l) ? CJK.plain(String(s == null ? '' : s), { lang: l }) : String(s == null ? '' : s));
  const H = (s, l = L()) => (cj(l) ? CJK.html(String(s == null ? '' : s), { lang: l }) : E(s));
  const arr = x => (x == null ? [] : Array.isArray(x) ? x : [x]);
  const BANDS = ['A0', 'A1', 'A2', 'B1', 'B2'];
  const LANGNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  const snd = k => { try { if (typeof Sound !== 'undefined') Sound.play(k); } catch (e) { /* */ } };
  const toast = t => { try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(t); } catch (e) { /* */ } };

  // ------------------------------------------------------------ content (content_<lang>.js)
  const C = {};
  const fresh = () => ({ place: {}, clerk: null, mayor: null, lines: {}, penpals: [], jobs: {}, interview: {}, shifts: {}, debates: [], phrases: {}, goods: {} });
  function add(lang, def = {}) {
    const c = C[lang] || (C[lang] = fresh());
    for (const k of ['place', 'lines', 'jobs', 'interview', 'shifts', 'phrases', 'goods']) if (def[k]) Object.assign(c[k], def[k]);
    if (def.clerk) c.clerk = Object.assign(c.clerk || {}, def.clerk);
    if (def.mayor) c.mayor = Object.assign(c.mayor || {}, def.mayor);
    for (const p of arr(def.penpals)) if (p && p.id) { const i = c.penpals.findIndex(x => x.id === p.id); if (i >= 0) c.penpals[i] = p; else c.penpals.push(p); }
    for (const d of arr(def.debates)) if (d && d.id) { const i = c.debates.findIndex(x => x.id === d.id); if (i >= 0) c.debates[i] = d; else c.debates.push(d); }
    registerPhrases(lang, def.phrases);
    if (isC(lang) && typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(def); } catch (e) { /* (the IME learns them later) */ } }
    return c;
  }
  const content = (l = L()) => C[l] || null;
  function ready(l = L()) {
    const c = C[l]; if (!c || !c.penpals.length) return false;
    try { return typeof DICT !== 'undefined' && DICT.ready(l) && typeof TALK !== 'undefined' && typeof EXAM !== 'undefined'; } catch (e) { return false; }
  }
  // Phrasebook entries (LEX kind 'phrase'): ph.life.<lang>.<name>
  function registerPhrases(lang, Pd) {
    if (typeof LEX === 'undefined' || !Pd) return;
    for (const [id, p] of Object.entries(Pd)) {
      const it = Object.assign({}, LEX.item(id) || {}, { id, kind: 'phrase', en: p.en || '', note: p.note || '', register: p.register || 'casual', icon: p.icon || 'letter', region: '' });
      it[lang] = p.t; LEX.register([it]);
    }
  }
  function teach(id) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || !LEX.item(id)[L()]) return null;
    const s = LEX.st(id), t = Date.now() / 1000; LEX.expose(id);
    if (s.stage < 3) s.stage = 3;
    s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 30 * 86400; s.last = t;
    return LEX.item(id);
  }

  // ------------------------------------------------------------ the save: G.state.life
  // { v, day, dayDate, dayStart, mail: { pals, inbox, sent, stamps, got, missed, visits }, jobs: { <id>: {…} }, hall: { … },
  //   news: [ the player's Radio Alba items (jobs.js saveNews: { at, day, story, lang, script, band, title, titleEn, text, grade, score }) ] }
  const MEM = {};
  function S() {
    const st = G && G.state; const o = st ? (st.life || (st.life = {})) : MEM;
    o.v = 1;
    const m = o.mail || (o.mail = {});
    m.pals = m.pals || {}; m.inbox = m.inbox || []; m.sent = m.sent || []; m.stamps = m.stamps || {}; m.got = m.got || {}; m.missed = m.missed || {};
    o.jobs = o.jobs || {};
    const h = o.hall || (o.hall = {});
    h.done = h.done || {}; h.wins = h.wins || 0; h.played = h.played || 0;
    return o;
  }
  const save = () => { if (G && G.save) try { G.save(); } catch (e) { /* */ } };
  const now = () => (G && G.state && +G.state.time) || 0;
  // a work day: 20 minutes of play, or a new calendar date, whichever comes first
  const DAY = 1200;
  function day() {
    const s = S(), d = new Date().toDateString(), t = now();
    if (!s.day || s.dayDate !== d || t - (s.dayStart || 0) >= DAY || t < (s.dayStart || 0)) { s.day = (s.day || 0) + 1; s.dayDate = d; s.dayStart = t; }
    return s.day;
  }
  const dayLeft = () => { day(); return Math.max(0, DAY - (now() - (S().dayStart || 0))); };
  // your level (DICT.bands().overall, 0 A0 … 4 B2), looked at every few seconds at most
  let lvT = -1e9, lv = 0;
  function level() {
    const t = Date.now();
    if (t - lvT > 4000) { lvT = t; try { lv = Math.max(0, Math.min(4, DICT.bands().overall | 0)); } catch (e) { lv = 0; } }
    return T.level != null ? T.level : lv;
  }
  const band = () => Math.max(1, level());
  const mins = s => Math.max(1, Math.round(s / 60));

  // ------------------------------------------------------------ lines
  // A line in the content is [text, english], or { t, en, who }, or { any: [lines] } (one at random), or a test:
  // { if: { fact, nofact, flag, missed, level }, t, else } (missed: a point you skipped in your last letter, 'pal.k').
  // Slots: {name} style keys from vars first (the engine's: {order}, {total}, {pal}, …), then TALK.fill's ({mimo}, {f.key}, {w.key}).
  function holds(c) {
    if (!c) return true;
    const st = S(), facts = (typeof TALK !== 'undefined' && TALK.facts) ? TALK.facts() : {};
    if (c.fact && !arr(c.fact).every(k => facts[k])) return false;
    if (c.nofact && arr(c.nofact).some(k => facts[k])) return false;
    if (c.missed && !arr(c.missed).some(k => st.mail.missed[k])) return false;
    if (c.got && !arr(c.got).every(k => st.mail.missed[k] === false)) return false;
    if (c.flag && !(G && G.state && G.state.flags && G.state.flags[c.flag])) return false;
    if (c.level != null && level() < c.level) return false;
    if (typeof c.test === 'function') { try { if (!c.test(st)) return false; } catch (e) { return false; } }
    return true;
  }
  function raw(x) {
    if (x == null) return null;
    if (Array.isArray(x)) return { t: String(x[0] == null ? '' : x[0]), en: String(x[1] == null ? '' : x[1]), who: x[2] || null };
    if (typeof x === 'string') return { t: x, en: '' };
    if (x.any) return raw(x.any[Math.floor(Math.random() * x.any.length)]);
    if (x.if || x.else !== undefined) return holds(x.if) ? raw(x.t) : x.else !== undefined ? raw(x.else) : null;
    return { t: String(x.t == null ? '' : x.t), en: String(x.en == null ? '' : x.en), who: x.who || null };
  }
  const VAR = /\{([a-zA-Z][\w]*)(?:\|([^{}]*))?\}/g;
  function fillVars(s, vars, en) {
    if (!vars) return String(s == null ? '' : s);
    return String(s == null ? '' : s).replace(VAR, (m, k, fb) => {
      if (!(k in vars)) return m;
      let v = vars[k]; if (v && typeof v === 'object') v = en ? (v.en != null ? v.en : v.t) : v.t;
      return v != null && v !== '' ? String(v) : (fb !== undefined ? fb : '');
    });
  }
  // the whole line, filled: our vars, then TALK's slots ({mimo}, {f.key}, {w.key}; TALK.fill also capitalizes a line's start)
  function fill(s, vars, ctx, en) {
    const a = fillVars(s, vars, en);
    try { return typeof TALK !== 'undefined' && TALK.fill ? TALK.fill(a, ctx || {}, !!en) : a; } catch (e) { return a; }
  }
  function line(x, vars, ctx) { const r = raw(x); if (!r || (!r.t && !r.en)) return null; return { t: fill(r.t, vars, ctx, false), en: fill(r.en, vars, ctx, true), who: r.who }; }
  // a fragment for a slot ({pos}, {where}, {section}): the words as written, never capitalized (TALK.fill capitalizes whole lines)
  function frag(x, vars) { const r = raw(x); if (!r) return null; return { t: fillVars(r.t, vars, false), en: fillVars(r.en, vars, true) }; }
  function lines(x, vars, ctx) {
    if (x == null) return [];
    const list = Array.isArray(x) && x.length && (Array.isArray(x[0]) || (x[0] && typeof x[0] === 'object')) ? x : [x];
    return list.map(y => line(y, vars, ctx)).filter(Boolean);
  }
  const pick = list => (list && list.length ? list[Math.floor(Math.random() * list.length)] : null);
  const said = (key, who, vars) => { const c = content(); const v = c && c.lines && c.lines[who] && c.lines[who][key]; return v ? line(Array.isArray(v) && Array.isArray(v[0]) ? pick(v) : v, vars) : null; };

  // ------------------------------------------------------------ rewards
  function coins(n) { if (G && G.state && n) G.state.coins = (G.state.coins || 0) + n; }
  function give(id, n = 1) { if (!G || !G.state || !id) return; const b = G.state.bag || (G.state.bag = {}); b[id] = (b[id] || 0) + n; }
  function cosmetic(id) { try { if (typeof TALK !== 'undefined' && TALK.state && TALK._.COS[id] && !TALK.state.cos[id]) { TALK.state.cos[id] = { on: true, from: 'life' }; return TALK._.COS[id].name; } } catch (e) { console.error('[life] cosmetic', e); } return null; }
  // Mimo's three: a stamp pin (six stamps in the album), a staff badge (the first job), a paper megaphone (the first debate won)
  function cosmetics() {
    if (typeof TALK === 'undefined' || !TALK.cosmetic || typeof TK === 'undefined') return;
    const Pt = (geo, col, pos, sc, o) => TK.part(geo, col, pos, sc, o || { ink: 0.006 });
    TALK.cosmetic('life.stamp', { name: { en: 'a stamp pin, from the post office' }, build(M) {
      if (!M || !M.body) return null;
      const g = new THREE.Group(); g.position.set(-0.14, 0.3, 0.3); g.rotation.set(-0.2, -0.4, 0.15);
      g.add(Pt(TK.G.box, '#fffaf0', [0, 0, 0], [0.11, 0.13, 0.012], { ink: 0.005 }));
      g.add(Pt(TK.G.box, '#d6453a', [0, 0.005, 0.007], [0.08, 0.095, 0.006], { ink: 0 }));
      g.add(Pt(TK.G.sphere, '#ffd23f', [0, 0.012, 0.012], [0.022, 0.022, 0.006], { ink: 0.003 }));
      M.body.add(g); return g;
    } });
    TALK.cosmetic('life.badge', { name: { en: 'a staff badge, from your first job' }, build(M) {
      if (!M || !M.body) return null;
      const g = new THREE.Group(); g.position.set(0.14, 0.3, 0.3); g.rotation.set(-0.2, 0.4, -0.1);
      g.add(Pt(TK.G.box, '#2f6f6a', [0, 0, 0], [0.13, 0.08, 0.014], { ink: 0.005 }));
      g.add(Pt(TK.G.box, '#fffaf0', [0, 0, 0.008], [0.1, 0.035, 0.006], { ink: 0 }));
      M.body.add(g); return g;
    } });
    TALK.cosmetic('life.mega', { name: { en: 'a paper megaphone, from your first debate won' }, build(M) {
      if (!M || !M.ears || !M.ears[1]) return null;
      const g = new THREE.Group(); g.position.set(0.02, 0.12, 0.02); g.rotation.set(0.3, 0, -0.9);
      g.add(Pt(TK.G.cone || TK.G.cyl, '#f2c14e', [0, 0.1, 0], [0.05, 0.14, 0.05], { ink: 0.006 }));
      g.add(Pt(TK.G.cyl, '#d6453a', [0, 0.02, 0], [0.025, 0.03, 0.025], { ink: 0.004 }));
      M.ears[1].add(g); return g;
    } });
  }

  // ------------------------------------------------------------ the journal's level page: letters, jobs, debates (METER.sections)
  let css = false;
  function style() {
    if (css || typeof document === 'undefined') return; css = true;
    const st = document.createElement('style');
    st.textContent = `.lf-shelf { margin: 10px 0; padding: 8px 12px; border: 2px dashed rgba(43,34,53,.25); border-radius: 14px; background: #fffaf0; }
.lf-shelf .lf-row { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 13.5px; }
.lf-shelf .lf-row span { white-space: nowrap; } .lf-shelf .lf-st { display: inline-flex; gap: 3px; vertical-align: middle; }
.lf-shelf .lf-st canvas { width: 26px; height: 32px; } .lf-shelf .lf-n { opacity: .65; font-size: 12.5px; }`;
    document.head.appendChild(st);
  }
  function shelfHTML() {
    try {
      if (!ready()) return '';
      style();
      const s = S(), c = content(), n = Object.keys(s.mail.stamps).length, all = c.penpals.reduce((a, p) => a + p.letters.length, 0);
      const pals = c.penpals.filter(p => s.mail.pals[p.id] && s.mail.pals[p.id].got > 0).map(p => `${E(P(p.name))} ${s.mail.pals[p.id].got}/${p.letters.length}`);
      const jobs = Object.entries(s.jobs).filter(([id, j]) => j && j.rank > 0 && c.jobs[id]).map(([id, j]) => `${E((c.jobs[id].en || id))} (${BANDS[j.rank]})`);
      return `<div class="lf-shelf"><h4 class="ph-h">📮 Letters, jobs and debates</h4><div class="lf-row"><span>📮 Stamps: <b>${n}</b>/${all}</span>`
        + `<span>✉️ Pen pals: ${pals.length ? pals.join(' · ') : '<span class="lf-n">the post office is in the town hall, on the west street</span>'}</span>`
        + `<span>🧑‍🍳 Jobs: ${jobs.length ? jobs.join(' · ') : '<span class="lf-n">help wanted: see the town board</span>'}</span>`
        + `<span>🏛 Debates: ${s.hall.played ? `${s.hall.wins} won of ${s.hall.played}` : '<span class="lf-n">from B1 talk, at the town hall</span>'}</span></div>`
        + `<p class="lf-n" style="margin:4px 0 0">Your letters count toward Writing; interviews, shifts and debates toward Speaking (shelving and sorting toward Reading).</p></div>`;
    } catch (e) { console.error('[life] shelf', e); return ''; }
  }

  // ------------------------------------------------------------ init, every frame
  const mods = () => [typeof TOWNHALL !== 'undefined' && TOWNHALL, typeof MAIL !== 'undefined' && MAIL, typeof JOBS !== 'undefined' && JOBS, typeof DEBATE !== 'undefined' && DEBATE].filter(Boolean);
  function init(game) {
    G = game; S();
    try { cosmetics(); } catch (e) { console.error('[life] cosmetics', e); }
    for (const M of mods()) if (M.init) { try { M.init(game); } catch (e) { console.error('[life] init', e); } }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST) for (const M of mods()) for (const q of (M.quests ? M.quests() : [])) if (!QUESTS.LIST.some(x => x.id === q.id)) QUESTS.LIST.push(q);
    if (typeof METER !== 'undefined' && METER.sections && !METER.sections.includes(shelfHTML)) METER.sections.push(shelfHTML);
  }
  function update(dt, t, you) {
    if (!G || !G.state) return;
    for (const M of mods()) if (M.tick) { try { M.tick(dt, t, you); } catch (e) { console.error('[life] tick', e); M.tick = null; } }
  }
  // free: no scene, fight, panel or typing (a letter's toast waits for it)
  function free() {
    if (!G || typeof document === 'undefined') return false;
    if (typeof STORY !== 'undefined' && (STORY.busy || STORY.line)) return false;
    const bc = document.body.className;
    if (/(^|\s)(in-battle|on-title)(\s|$)/.test(bc) || /(^|\s)[\w-]+-open(\s|$)/.test(bc)) return false;
    if (G.journalOpen || (G.sim && G.sim.lock) || (typeof Input !== 'undefined' && Input.typing)) return false;
    if ((typeof TALK !== 'undefined' && TALK.busy) || (typeof EXAMUI !== 'undefined' && EXAMUI.isOpen) || (typeof LIFEUI !== 'undefined' && LIFEUI.isOpen)) return false;
    if (document.querySelector('.panel:not(.hidden), #card:not(.hidden), #choose:not(.hidden), #talk:not(.hidden)')) return false;
    if (typeof FIN !== 'undefined' && FIN.quiet && FIN.quiet()) return false;            // (the final act's places: it waits until you're out)
    return true;
  }

  // ------------------------------------------------------------ checks (LIFE._.check(lang): the content's shape; the game never calls it)
  function check(l = L()) {
    const out = [], c = C[l]; if (!c) return ['no life content for ' + l];
    const bad = (w, what) => out.push(`${w}: ${what}`);
    const cjOn = isC(l) && typeof CJK !== 'undefined';
    const valid = (w, s) => { if (!cjOn || !s) return; for (const p of CJK.validate(String(s).replace(/\{[^}]+\}/g, 'X'), l) || []) bad(w, p); };
    const ln = (w, x, need = true) => {
      if (x == null) { if (need) bad(w, 'missing'); return; }
      if (x.any) { x.any.forEach((y, i) => ln(`${w}.any[${i}]`, y)); return; }
      if (x.if || x.else !== undefined) { ln(w + '.t', x.t); if (x.else !== undefined && x.else !== null) ln(w + '.else', x.else); return; }
      const r = raw(x); if (!r || !r.t) { bad(w, 'empty'); return; } if (!r.en) bad(w, 'no English'); valid(w, r.t);
    };
    const lns = (w, x) => { if (x == null) return; const list = Array.isArray(x) && x.length && x[0] && typeof x[0] === 'object' ? x : [x]; list.forEach((y, i) => ln(`${w}[${i}]`, y)); };      // (a list of lines starts with a line, [t, en] or { if, t, else })
    const turn = (w, tn) => {
      if (!tn) { bad(w, 'missing turn'); return; }
      lns(w + '.ask', tn.ask); if (!tn.goal) bad(w, 'no goal'); if (!tn.want) bad(w, 'no want');
      for (const k of ['starter', 'example', 'model']) if (tn[k]) ln(`${w}.${k}`, tn[k]); else if (k !== 'example') bad(w, 'no ' + k);
      if (tn.simpler) ln(w + '.simpler', tn.simpler);
      (tn.react || []).forEach((re, i) => { if (re.say) lns(`${w}.react[${i}]`, re.say); });
    };
    for (const p of c.penpals) {
      if (!p.name || !p.where || !p.letters || !p.letters.length) bad('penpal ' + p.id, 'name, where and letters');
      valid(p.id + '.name', p.name); ln(p.id + '.where', p.where);
      p.letters.forEach((lt, i) => {
        const w = `${p.id}.${i + 1}`;
        if (!(lt.band >= 1 && lt.band <= 4)) bad(w, 'band');
        lns(w + '.body', lt.body); if (lt.sign) ln(w + '.sign', lt.sign);
        if (!(lt.points || []).length || lt.points.length > 3) bad(w, `${(lt.points || []).length} points (2–3)`);
        (lt.points || []).forEach((pt, k) => { ln(`${w}.points[${k}]`, pt.t); if (!pt.want) bad(`${w}.points[${k}]`, 'no want'); if (!pt.id) bad(`${w}.points[${k}]`, 'no id'); if (pt.starter) ln(`${w}.points[${k}].starter`, pt.starter); });
        if (!(lt.min > 0 && lt.max > lt.min)) bad(w, 'min / max');
        if (!lt.model) bad(w, 'no model reply'); else ln(w + '.model', lt.model);
        if (!lt.weak) bad(w, 'no weak reply (for the tests)');
        if (lt.gift && lt.gift.phrase && !c.phrases[lt.gift.phrase]) bad(w, 'gift phrase ' + lt.gift.phrase);
        if (!lt.stamp) bad(w, 'no stamp');
        else { if (!lt.stamp.id || !lt.stamp.icon) bad(w, 'stamp id / icon'); ln(w + '.stamp.name', lt.stamp.name); }
      });
    }
    for (const [id, j] of Object.entries(c.jobs)) {
      if (!j.boss || !j.boss.name) bad('job ' + id, 'no boss'); else valid(`job ${id}.boss`, j.boss.name);
      for (const [k, v] of Object.entries(j.lines || {})) lns(`job ${id}.lines.${k}`, v);
      // (a job that hires from B1, j.min 3, needs its why turns from that band; a higher band may use the one below)
      for (const b of [1, 2, 3, 4]) { if (b < (j.min || 1)) continue; let has = false; for (let x = b; x >= (j.min || b) && !has; x--) has = !!(j.why && arr(j.why[x]).length); if (!has) bad('job ' + id, 'no why turn at band ' + b); }
      for (const [k, v] of Object.entries({ why: j.why, situation: j.situation, hypo: j.hypo })) for (const [b, list] of Object.entries(v || {})) arr(list).forEach((tn, i) => turn(`job ${id}.${k}.${b}[${i}]`, tn));
    }
    for (const [k, v] of Object.entries(c.interview || {})) if (v && typeof v === 'object' && !Array.isArray(v) && k !== 'react') for (const [b, list] of Object.entries(v)) arr(list).forEach((tn, i) => turn(`interview.${k}.${b}[${i}]`, tn));
    for (const d of c.debates) {
      const w = 'debate ' + d.id; ln(w + '.title', d.title); lns(w + '.mayor', d.mayor);
      for (const s of ['a', 'b']) { const x = d[s]; if (!x) { bad(w, 'no side ' + s); continue; } lns(`${w}.${s}.say`, x.say); lns(`${w}.${s}.counter`, x.counter); ln(`${w}.${s}.pos`, x.pos); }
      for (const side of ['for', 'against']) { const m = (d.models || {})[side]; if (!m || m.length < 3) bad(w, 'models.' + side + ': three needed'); else m.forEach((x, i) => ln(`${w}.models.${side}[${i}]`, x)); }
    }
    for (const [k, p] of Object.entries(c.phrases || {})) { if (!p.t || !p.en) bad('phrase ' + k, 't and en'); if (!/^ph\.life\./.test(k)) bad('phrase ' + k, 'ids are ph.life.<lang>.<name>'); valid('phrase ' + k, p.t); }
    for (const M of mods()) if (M._ && M._.check) { try { out.push(...M._.check(l)); } catch (e) { out.push('check threw: ' + e); } }
    return out;
  }

  // ------------------------------------------------------------ tests (LIFE._.tests(lang); the game never calls them)
  const T = { level: null, fast: false };
  function tests(l = L()) {
    const was = typeof LEX !== 'undefined' ? LEX.lang : l; if (typeof LEX !== 'undefined') LEX.lang = l;
    const fails = [], counts = {}, t0 = Date.now();
    try {
      check(l).forEach(p => fails.push('check: ' + p));
      for (const M of mods()) if (M._ && M._.tests) { try { const r = M._.tests(l); fails.push(...(r.fails || [])); Object.assign(counts, r.counts || {}); } catch (e) { fails.push('threw: ' + (e && e.stack || e)); } }
    } finally { if (typeof LEX !== 'undefined') LEX.lang = was; }
    return { lang: l, ok: !fails.length, fails, counts, ms: Date.now() - t0 };
  }

  return {
    add, content, ready, S, save, now, day, dayLeft, DAY, level, band, mins, line, lines, frag, fill, fillVars, raw, holds, pick, said,
    coins, give, teach, cosmetic, free, toast, snd, E, P, H, arr, L, isC, BANDS, LANGNAME, shelfHTML,
    init, update, get game() { return G; },
    _: { C, T, check, tests, registerPhrases, style },
  };
})();
