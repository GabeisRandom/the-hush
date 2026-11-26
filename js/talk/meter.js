'use strict';
// METER: two journal pages (ui.js UI.journalTabs) for free talk (DESIGN.md 15.3).
//   "My Spanish" (My Portuguese, My German, My Chinese, My Japanese): your estimated level, A0 → B2, from DICT.bands(): for words,
//   speaking, reading and listening; the headwords you know and the ones that are familiar; and the next step. Every number is
//   an estimate and says so: the game only sees what you've done in it.
//   "People": everyone you can bond with (talk.js), their rank, what's next, what they remember about you, and Mimo's gifts
//   from them (switch them on or off).
// Shown only in a language with a dictionary pack (the level page) and conversations (People). METER.init(game) · html(state)

const METER = (() => {
  let G = null;
  const METER_SECTIONS = [];          // (METER.sections: fn() → html, shown under the level bar; js/exam/ adds the certificates)
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK(L());
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const B = ['A0', 'A1', 'A2', 'B1', 'B2'];
  const MY = { es: ['My Spanish', 'Mi español'], pt: ['My Portuguese', 'Meu português'], de: ['My German', 'Mein Deutsch'],
    zh: ['My Chinese', '[我|wǒ] [的|de] [中文|zhōng wén]'], ja: ['My Japanese', 'わたし の [日本語|にほんご]'] };
  const txt = s => (isC() ? CJK.html(s, { lang: L(), ruby: 'always' }) : E(s));
  // shown once the language has a pack and either free talk here or something already measured (reading, listening…)
  const measured = () => { try { const J = DICT.toJSON(), l = L(); return Object.keys((J.M || {})[l] || {}).length > 0 || Object.values((J.LOG || {})[l] || {}).some(a => a && a.length); } catch (e) { return false; } };
  const on = () => { try { return typeof DICT !== 'undefined' && DICT.ready() && ((typeof TALK !== 'undefined' && TALK.ready()) || measured()); } catch (e) { return false; } };
  const letter = s => (s >= 0.95 ? 'S' : s >= 0.8 ? 'A' : s >= 0.62 ? 'B' : s >= 0.45 ? 'C' : 'D');
  const GRC = { S: '#e0a020', A: '#21a493', B: '#3f7fc9', C: '#8a5ab0', D: '#8a8f9e' };
  const CSS = `
.mt { max-width: 760px; } .mt .mt-top { display: flex; gap: 14px; align-items: center; margin-bottom: 8px; }
.mt .mt-badge { flex: 0 0 auto; width: 84px; height: 84px; border-radius: 50%; display: grid; place-items: center; background: #21a493; color: #fff; border: 4px solid #2b2235; box-shadow: 0 4px 0 rgba(43,34,53,.2); }
.mt .mt-badge b { font: 900 30px Bahnschrift, "Segoe UI", sans-serif; line-height: 1; } .mt .mt-badge small { display: block; font-size: 10px; font-weight: 800; letter-spacing: .06em; opacity: .85; text-align: center; }
.mt h3 { margin: 0; font: 800 22px Bahnschrift, "Segoe UI", sans-serif; } .mt h3 span { font-size: 16px; opacity: .65; margin-left: 6px; }
.mt .mt-est { font-size: 13px; opacity: .72; margin-top: 2px; line-height: 1.35; }
.mt .mt-row { display: grid; grid-template-columns: 120px 52px 1fr; gap: 4px 10px; align-items: center; background: #fff; border: 2px solid rgba(43,34,53,.12); border-radius: 14px; padding: 9px 12px; margin-bottom: 8px; }
.mt .mt-row .k { font-weight: 800; font-size: 15px; } .mt .mt-row .b { font: 900 18px Bahnschrift, sans-serif; text-align: center; border-radius: 9px; padding: 2px 0; color: #fff; background: #3f7fc9; }
.mt .mt-row .b.none { background: #c8c3d2; } .mt .mt-bar { height: 10px; border-radius: 99px; background: rgba(43,34,53,.1); overflow: hidden; } .mt .mt-bar i { display: block; height: 100%; border-radius: 99px; background: #e0a020; }
.mt .mt-row .d { grid-column: 2 / 4; font-size: 13px; line-height: 1.38; opacity: .85; } .mt .mt-row .d b { color: #2b2235; }
.mt .mt-words { display: flex; flex-wrap: wrap; gap: 5px; margin: 4px 0 10px; } .mt .mt-words span { background: #fff; border: 1.5px solid rgba(43,34,53,.15); border-radius: 99px; padding: 1px 9px; font-size: 13px; }
.mt .mt-words span.k3 { border-color: #21a493; } .mt .mt-gr { display: inline-block; font: 900 12px Bahnschrift, sans-serif; color: #fff; border-radius: 99px; padding: 0 7px; border: 2px solid #2b2235; }
@media (max-width: 560px) { .mt .mt-row { grid-template-columns: 1fr 52px; } .mt .mt-row .mt-bar { grid-column: 1 / 3; } .mt .mt-row .d { grid-column: 1 / 3; } }
.mt .mt-next { background: #fff; border: 2px solid #2b2235; border-radius: 16px; padding: 10px 14px; margin: 4px 0 12px; box-shadow: 0 3px 0 rgba(43,34,53,.15); }
.mt .mt-nl { display: flex; align-items: center; gap: 10px; } .mt .mt-nl .lv { font: 900 17px Bahnschrift, sans-serif; color: #fff; background: #21a493; border: 2px solid #2b2235; border-radius: 9px; padding: 1px 8px; }
.mt .mt-nl .lv.nx { background: #fffaf0; color: #2b2235; } .mt .mt-nl .mt-bar { flex: 1; height: 16px; border: 2px solid #2b2235; background: #f3eee2; }
.mt .mt-nl .mt-bar i { background: linear-gradient(90deg, #e0a020, #f2c14e); }
.mt .mt-nt { font-size: 13.5px; line-height: 1.4; margin-top: 6px; } .mt .mt-nt b { font-size: 15px; } .mt .mt-nt small { display: block; opacity: .7; margin-top: 2px; }
#journal .jhead { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 18px; padding: 8px 14px 7px; border-bottom: 2px dashed rgba(43,34,53,.14); font: 600 13px "Segoe UI", sans-serif; }
#journal .jhead .jh-time b { font: 800 14px Bahnschrift, "Segoe UI", sans-serif; }
#journal .jhead .jh-lvl { display: inline-flex; align-items: center; gap: 7px; cursor: pointer; border: 0; background: transparent; padding: 0; font: inherit; color: inherit; }
#journal .jhead .jh-b { color: #fff; background: #21a493; border: 2px solid #2b2235; border-radius: 8px; padding: 0 6px; font: 900 13px Bahnschrift, sans-serif; }
#journal .jhead .jh-b.nx { background: #fffaf0; color: #2b2235; }
#journal .jhead .jh-bar { width: 130px; height: 9px; border-radius: 99px; background: rgba(43,34,53,.12); overflow: hidden; display: inline-block; }
#journal .jhead .jh-bar i { display: block; height: 100%; background: #e0a020; border-radius: 99px; }
.pp { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
.pp .pc { background: #fff; border: 2px solid rgba(43,34,53,.14); border-radius: 16px; padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.pp .pc .top { display: flex; gap: 10px; align-items: center; } .pp .pc canvas { width: 56px; height: 56px; flex: 0 0 auto; }
.pp .pc b.nm { font: 800 18px Bahnschrift, "Segoe UI", sans-serif; display: block; } .pp .pc .st { color: #e0a020; letter-spacing: 2px; font-size: 15px; } .pp .pc small { font-size: 12px; opacity: .7; }
.pp .pc .nx { font-size: 13px; line-height: 1.35; } .pp .pc .nx.ready { color: #13786b; font-weight: 700; }
.pp .pc ul { margin: 2px 0 0; padding-left: 16px; font-size: 12.5px; line-height: 1.4; } .pp .cos button { border: 2px solid #2b2235; border-radius: 9px; background: #fffaf0; font: 800 12px "Segoe UI", sans-serif; padding: 1px 9px; cursor: pointer; margin-left: 6px; }
.pp .cos button.on { background: #2b2235; color: #fffaf0; }
`;
  function css() { if (document.getElementById('meter-css')) return; const s = document.createElement('style'); s.id = 'meter-css'; s.textContent = CSS; document.head.appendChild(s); }

  // ------------------------------------------------------------ how a skill is going: its recent results (DICT's log)
  function evidence(skill, band) {
    let all = [];
    try { const LOG = DICT.toJSON().LOG || {}; all = ((LOG[L()] || {})[skill] || []).slice(); } catch (e) { all = []; }
    const next = Math.min(4, band + 1), at = all.filter(x => x.b >= next).slice(-8);
    const avg = at.length ? at.reduce((s, x) => s + x.s, 0) / at.length : 0;
    const recent = all.slice(-10), ravg = recent.length ? recent.reduce((s, x) => s + x.s, 0) / recent.length : 0;
    return { n: all.length, next, at: at.length, avg, recent: recent.length, ravg };
  }
  const SKILL = {
    talk: { k: 'Speaking', what: 'answers in free talk', where: 'Talking freely with people (each rank is a band harder), small talk, and texting on the phone' },
    read: { k: 'Reading', what: 'questions about what you read', where: 'Books in Alba’s library and Noa’s diary pages' },
    listen: { k: 'Listening', what: 'questions about what you heard', where: 'The radio, overheard talk, and voice notes' },
    // (EX1, DESIGN.md 21.2: the fourth skill; js/exam/ logs it)
    write: { k: 'Writing', what: 'marks for your writing', where: 'The Academy’s level exams, on the west street' },
  };
  function skillRow(skill, band) {
    const S = SKILL[skill], ev = evidence(skill, band);
    let d;
    if (!ev.n) d = `No ${S.what} yet. ${S.where} will show it.`;
    else if (band >= 4) d = `B2, from your last ${ev.recent} ${S.what} (average <span class="mt-gr" style="background:${GRC[letter(ev.ravg)]}">${letter(ev.ravg)}</span>). That’s the top of what this game measures.`;
    else {
      const need = Math.max(0, 5 - ev.at);
      d = `From your last ${Math.min(ev.n, 60)} ${S.what}${ev.recent ? ` (lately <span class="mt-gr" style="background:${GRC[letter(ev.ravg)]}">${letter(ev.ravg)}</span> on average)` : ''}. `
        + `<b>Next, ${B[ev.next]}:</b> ${ev.at ? `${ev.at} answer${ev.at > 1 ? 's' : ''} at ${B[ev.next]} or harder so far, averaging <span class="mt-gr" style="background:${GRC[letter(ev.avg)]}">${letter(ev.avg)}</span>. ` : ''}`
        + (need ? `About ${need} more at ${B[ev.next]}, at B or better on average, would show it. ` : ev.avg < 0.7 ? `A few more at B or better would show it. ` : '')
        + `<i>(${S.where})</i>`;
    }
    const pct = band >= 4 ? 100 : Math.round(Math.min(1, ev.at / 5) * Math.min(1, ev.avg / 0.7) * 100);
    return `<div class="mt-row"><span class="k">${S.k}</span><span class="b ${band ? '' : 'none'}">${B[band]}</span><span class="mt-bar"><i style="width:${pct}%"></i></span><span class="d">${d}</span></div>`;
  }
  // a few of the words you know best (the newest first), as their lemmas
  function sampleWords(n = 24) {
    let M = {}; try { M = (DICT.toJSON().M || {})[L()] || {}; } catch (e) { M = {}; }
    const content = id => { const e = DICT.entry(id); return e && ['n', 'v', 'adj', 'adv', 'phrase'].includes(e.pos); };     // (the words that carry meaning, not «de» or «el»)
    const ids = Object.keys(M).filter(id => content(id) && DICT.level(id) >= 2).sort((a, b) => (M[b].t || 0) - (M[a].t || 0)).slice(0, n);
    return ids.map(id => { const e = DICT.entry(id); const lv = DICT.level(id); return e ? `<span class="${lv >= 3 ? 'k3' : ''}" title="${E(e.en || '')}${lv >= 3 ? ' · known' : ' · familiar'}">${isC() ? CJK.html(e.lemma, { lang: L() }) : E(e.lemma)}</span>` : ''; }).join('');
  }
  // the play time in this save (main.js counts state.time while the game runs), as "3 h 12 min"
  const played = () => { const m = Math.floor(((G && G.state && G.state.time) || 0) / 60); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
  const num = n => Number(n || 0).toLocaleString();
  // the bar from your level to the next one (DICT.progress: the words that would lift your overall level), and what it says
  function nextHTML() {
    const p = DICT.progress(), b = DICT.bands();
    const say = p.via === 'top' ? `<b>${B[4]}: the top of what this game measures.</b> Keep reading, listening, writing and talking: it all still counts.`
      : p.via === 'answers' ? `<b>${B[p.next]} needs better answers now</b> (free talk, reading, listening, writing): your words are already at the top this game measures.`
      : `<b>${num(p.have)} / ${num(p.need)} words to ${B[p.next]}.</b>${p.also ? ' Better answers in free talk, reading, listening and writing would lift it too.' : ''}`
        + `<small>${B[p.level]} → ${B[p.next]}: about ${num(Math.max(0, p.need - p.have))} more words you’ve shown the game.${b.overall > b.words ? ' (Your answers are already ahead of your words.)' : ''}</small>`;
    return `<div class="mt-next"><div class="mt-nl"><b class="lv">${B[p.level]}</b><span class="mt-bar"><i style="width:${Math.round(p.pct * 100)}%"></i></span><b class="lv nx">${B[p.next]}</b></div><div class="mt-nt">${say}</div></div>`;
  }
  function levelHTML() {
    css();
    if (!on()) return '<p class="empty">The level page needs this language’s dictionary, which isn’t in the game yet.</p>';
    const b = DICT.bands(), v = b.vocab || { known: 0, familiar: 0, est: 0 }, my = MY[L()] || MY.es, S = DICT.WORD_STEPS;
    let h = `<div class="mt"><div class="mt-top"><div class="mt-badge"><div><b>${B[b.overall]}</b><small>ESTIMATE</small></div></div><div><h3>${E(my[0])}<span>${txt(my[1])}</span></h3>`
      + `<div class="mt-est"><b>Your level is an estimate from the words you’ve shown the game.</b> It also weighs how your answers went. You probably know more than it can see, and it moves as you play. ⏱ ${played()} played in this save.</div></div></div>`;
    h += nextHTML();
    // (other modules' sections under the level bar: METER.sections, [fn() → html]; js/exam/ puts the certificates here)
    for (const f of METER_SECTIONS) { try { h += f() || ''; } catch (e) { console.error('[meter] section', e); } }
    // words: from where your band starts to the next one
    const lo = S[b.words], nxt = b.next, wd = b.words >= 4 ? `About ${num(v.est)} headwords: that’s the top of what this game measures for now.`
      : `You know about <b>${num(v.known)}</b> headwords, and <b>${num(v.familiar)}</b> more are familiar (counted as half): about <b>${num(v.est)}</b>. <b>Next, ${B[b.words + 1]}:</b> ${num(v.est)} / ${num(nxt)} headwords, so roughly ${num(Math.max(0, nxt - v.est))} to go.`;
    const wpct = b.words >= 4 ? 100 : Math.round(Math.max(0, Math.min(1, (v.est - lo) / Math.max(1, nxt - lo))) * 100);
    h += `<div class="mt-row"><span class="k">Words</span><span class="b ${b.words ? '' : 'none'}">${B[b.words]}</span><span class="mt-bar"><i style="width:${wpct}%"></i></span><span class="d">${wd} <i>(A word is known when you’ve used it right, or ${E((G && G.state && G.state.mimoName) || 'Mimo')} knows it; familiar when you’ve met it in context a few times.)</i></span></div>`;
    h += skillRow('talk', b.talk) + skillRow('read', b.read) + skillRow('listen', b.listen) + skillRow('write', b.write || 0);
    const ws = sampleWords();
    if (ws) h += `<h4 class="ph-h">Words you’ve been using and meeting</h4><div class="mt-words">${ws}</div>`;
    h += `<p class="note">How it’s worked out: each skill’s level is the highest band where your last five or more results at that band (or harder) average a B or better. Words: A1 from about ${num(S[1])} headwords you’ve shown, A2 ${num(S[2])}, B1 ${num(S[3])}, B2 ${num(S[4])}. `
      + `(Common rule-of-thumb sizes are about 500, 1,000, 2,000 and 4,000 words; the steps here are lower because the game only counts the words you’ve shown it, which is less than you know.) The overall level never runs more than one step ahead of your words.</p>`;
    return h + '</div>';
  }
  // the journal's strip over its tabs (ui.js UI.journalHead): play time, always; your level and the bar to the next, once the
  // language's dictionary is in (a click opens "My <language>")
  function headHTML() {
    css();
    let h = `<span class="jh-time" title="Time played in this save">⏱ <b>${played()}</b> played</span>`;
    try {
      if (typeof DICT !== 'undefined' && DICT.ready()) {
        const p = DICT.progress(), lab = p.via === 'words' ? `${num(p.have)} / ${num(p.need)} words to ${B[p.next]}` : p.via === 'answers' ? `${B[p.next]}: better answers now` : 'the top this game measures';
        h += `<button class="jh-lvl" ${on() ? 'data-tab="talk-level"' : ''} title="Your level: an estimate from the words you’ve shown the game"><b class="jh-b">${B[p.level]}</b><span class="jh-bar"><i style="width:${Math.round(p.pct * 100)}%"></i></span>${p.via === 'top' ? '' : `<b class="jh-b nx">${B[p.next]}</b>`}<small>${lab}</small></button>`;
      }
    } catch (e) { /* (no level yet: the play time alone) */ }
    return h;
  }

  // ------------------------------------------------------------ People: the bonds
  const FACT = { home: 'where you’re from', fruit: 'the fruit you like', mimoFood: 'what {mimo} likes to eat', likesAlba: 'whether you like Alba', breakfast: 'what you had for breakfast',
    plan: 'your plans', siblings: 'how many brothers and sisters you have', family: 'your family', did: 'what you did', mood: 'how you were', food: 'the food you like', next: 'what you were going to do next',
    // (wave 2's new memory keys, es and pt)
    kid: 'what you were like as a kid', story: 'a story you told', dream: 'your dream', festival: 'what you think of the Festival of Voices', name: 'a name you told them',
    books: 'the books you like', sport: 'your sport', hobby: 'your hobby', hanabi: 'whether you like fireworks', back: 'when you’d go back to, if you could', job: 'your work or studies', childhood: 'your childhood', game: 'the game you like', trip: 'your best trip', childhoodFood: 'a food from your childhood' };
  function peopleHTML() {
    css();
    const list = TALK.bonds().filter(b => b.met);
    if (!list.length) return '<p class="empty">Nobody yet. Once you’ve met people, “Talk freely” with them: each rank is a real conversation, one level harder.</p>';
    const mimo = (G && G.state && G.state.mimoName) || 'Mimo';
    let h = `<p class="note">Talk freely with someone (E, then “Talk freely”). Each rank is a conversation one level harder: small talk (A1), your plans (A2), a story from your past (B1), an opinion with reasons (B1+), and “what would you do if…” (B2). They remember what you tell them.</p><div class="pp">`;
    for (const b of list) {
      const nx = b.next, stars = '★'.repeat(b.rank) + '☆'.repeat(5 - b.rank);
      const nxt = nx.done ? 'Every rank done. You’re close friends.' : nx.ready ? `Rank ${nx.rank} is ready: ${E(nx.kind || '')} (${B[nx.band] || ''}). Talk freely!`
        : `Rank ${nx.rank || ''}${nx.kind ? ` (${E(nx.kind)}, ${B[nx.band] || ''})` : ''}: ${E(nx.why || '')}.`;
      const facts = b.facts.map(f => `<li>${E((FACT[f.key] || f.key).replace('{mimo}', mimo))}: <b>${isC() ? CJK.html(f.v, { lang: L() }) : E(f.v)}</b></li>`).join('');
      h += `<div class="pc"><div class="top"><canvas data-pface="${E(b.id)}" width="112" height="112"></canvas><div><b class="nm">${txt(b.name)}</b><span class="st">${stars}</span><br><small>${E(b.where)}</small></div></div>`
        + `<div class="nx ${nx.ready ? 'ready' : ''}">${nxt}</div>` + (facts ? `<small>${b.her === 'him' ? 'He' : b.her === 'her' ? 'She' : 'They'} remember${b.her === 'them' ? '' : 's'}:</small><ul>${facts}</ul>` : '') + '</div>';
    }
    const cos = TALK.cosmetics();
    if (cos.length) h += `</div><h4 class="ph-h">${E(mimo)}’s gifts</h4><div class="pp"><div class="pc cos">${cos.map(c => `<div>${E((c.name && c.name.en) || c.id)} <button data-cos="${E(c.id)}" class="${c.on ? 'on' : ''}">${c.on ? 'On' : 'Off'}</button></div>`).join('')}</div>`;
    const later = TALK.bonds().filter(b => !b.met).length;
    h += '</div>' + (later ? `<p class="note">${later} more ${later > 1 ? 'people' : 'person'} to meet on your travels.</p>` : '');
    return h;
  }
  function wirePeople(el) {
    el.querySelectorAll('canvas[data-pface]').forEach(cv => { try { TALKUI.face(cv, TALK.lookOf(cv.dataset.pface), null); } catch (e) { /* */ } });
    el.querySelectorAll('[data-cos]').forEach(b => b.onclick = () => { const c = TALK.cosmetics().find(x => x.id === b.dataset.cos); TALK.setCosmetic(b.dataset.cos, !(c && c.on)); try { Sound.play('click'); } catch (e) { /* */ } if (typeof UI !== 'undefined' && G) UI.journal(true, G.state); });
  }

  const TABS = [
    { id: 'talk-level', label: () => (on() ? (MY[L()] || MY.es)[0] : null), html: () => levelHTML(), wire() { /* */ } },
    { id: 'talk-people', label: () => { try { return TALK.ready() && TALK.bonds().some(b => b.met) ? 'People' : null; } catch (e) { return null; } }, html: () => peopleHTML(), wire: el => wirePeople(el) },
  ];
  function init(game) {
    G = game;
    if (typeof UI !== 'undefined') { UI.journalTabs = UI.journalTabs || []; for (const t of TABS) if (!UI.journalTabs.some(x => x.id === t.id)) UI.journalTabs.push(t); }
    if (typeof UI !== 'undefined') { UI.journalHead = UI.journalHead || []; if (!UI.journalHead.includes(headHTML)) UI.journalHead.push(headHTML); }
  }
  return { init, html: () => levelHTML(), people: () => peopleHTML(), head: () => headHTML(), TABS, evidence, sections: METER_SECTIONS, SKILL };
})();
