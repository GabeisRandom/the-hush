// ============================================================ Chapter 4, «Elio's words»: the thread across the three worlds
// (DESIGN.md 18.5, game/TIME.md §15). Written by the lead, 2026-11-18, as the shared base for the region helpers.
//
// The story: when the theater laughed (Chapter 2), Elio's voice broke. What he never got to say drifted out with the first Hush,
// into every region's yesterday and tomorrow: one echo in each region's Past, one in its Future (18 in all: Alba's two first,
// then two in each of the eight bells' regions). Each echo is a line in Elio's own voice, freed when that world's boss falls.
// Noa, still caught in the great clock, speaks through every region's three-way crack: she gives each region's goal, and you
// report back to her there. With all 18, Elio can finally give the speech he never finished (the finale, built later).
//
// The regions open one after another, so the grammar climbs step by step (TIME.md §8): Alba's cracks open after Chapter 3, and
// each next region's when the one before has both its echoes.
//
// For region files (time_<region>.js, loaded after this one):
//   TIME.region(id, { open: () => CH4.open(id), … })          its cracks open in turn
//   CH4.steps(region, world, [ … ])                              that world's main-quest steps, in QUESTS's shape ({ text, why,
//                                                                done(s), target(), hint, n(s), report }); the Past's go before
//                                                                the Future's, region by region, in CH4.ORDER
//   CH4.story(region, [{ when(s), text }])                       lines for the main quest's story log
//   CH4.word(region, world, { es, pt, de, zh, ja, en, where })   the echo's line in Elio's voice (zh / ja in CJK.md's notation;
//                                                                `where`: a short English caption, "Molinar, long ago")
//   await CH4.give(region, world, letter)                        the echo is freed: a card with his line, a chime, saved
//   CH4.got(region, world) · CH4.done(region) · CH4.count() · CH4.TOTAL · CH4.started()
// Tests: CH4._.t.openAll(true) opens every built region's cracks; CH4._.t.give(region, world) frees an echo without the card.
const CH4 = (() => {
  const ORDER = ['alba', 'molinar', 'lake', 'quarry', 'gardens', 'peaks', 'port', 'ruins', 'marsh'];
  const NAMES = { alba: 'Alba', molinar: 'Molinar', lake: 'the Mirror Lake', quarry: 'the Quarry Caves', gardens: 'the Bloom Gardens',
    peaks: 'the Frost Peaks', port: 'Port Brisa', ruins: 'the Sunken Ruins', marsh: 'the Gray Marsh' };
  const TOTAL = ORDER.length * 2;
  const STEPS = {}, WORDS = {}, STORY_L = {};
  const G = () => (typeof TIME !== 'undefined' && TIME.API ? TIME.API.G : null);
  const lang = () => { const g = G(); return (g && g.state && g.state.lang) || 'es'; };
  const isC = l => l === 'zh' || l === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tHTML = (t, l) => (isC(l) && typeof CJK !== 'undefined' ? CJK.html(String(t || ''), { lang: l }) : esc(t));
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* */ } };
  const RANK = { S: 5, A: 4, B: 3, C: 2, D: 1 };

  // ------------------------------------------------------------ state: state.ch4 = { echoes: { 'alba.past': 'S', … }, at: { 'alba.past': time }, openAll }
  function st() {
    const g = G(), s = g && g.state; if (!s) return { echoes: {}, at: {} };
    if (!s.ch4) s.ch4 = { echoes: {}, at: {} };
    if (!s.ch4.echoes) s.ch4.echoes = {};
    if (!s.ch4.at) s.ch4.at = {};
    return s.ch4;
  }
  const key = (r, w) => r + '.' + w;
  const got = (r, w) => st().echoes[key(r, w)] || null;
  const done = r => !!got(r, 'past') && !!got(r, 'future');
  const count = () => Object.keys(st().echoes).length;
  const started = () => { const g = G(), s = g && g.state; return !!(s && s.flags && s.flags.futureDone); };
  // a region's cracks: Alba's after Chapter 3, every other when the one before it has both its echoes
  function open(r) {
    const g = G(), s = g && g.state; if (!s || !s.flags || !s.flags.futureDone) return false;
    const i = ORDER.indexOf(r); if (i < 0) return false;
    if (i === 0 || st().openAll) return true;
    return done(ORDER[i - 1]);
  }

  function steps(r, w, list) { (STEPS[r] || (STEPS[r] = {}))[w] = (list || []).map(x => Object.assign(x, { ch4: r, ch4w: w })); }
  function story(r, list) { (STORY_L[r] || (STORY_L[r] = [])).push(...(list || [])); }
  function word(r, w, def) { WORDS[key(r, w)] = def; }

  // ------------------------------------------------------------ freeing an echo
  async function give(r, w, letter = 'B', o = {}) {
    const S = st(), k = key(r, w), was = S.echoes[k];
    S.echoes[k] = was && (RANK[was] || 0) >= (RANK[letter] || 0) ? was : (letter || 'B');
    if (!S.at[k]) S.at[k] = Date.now();
    const g = G();
    if (!o.quiet && typeof UI !== 'undefined' && UI.card) {
      snd('learned');
      const l = lang(), W = WORDS[k] || {}, line = W[l] || W.es || '', en = W.en || '';
      const where = W.where || `${NAMES[r] || r}, ${w === 'past' ? 'long ago' : 'tomorrow'}`;
      await UI.card(`<div class="tag">Elio’s words · ${count()} / ${TOTAL}</div>`
        + `<div class="big" style="font-size:24px;line-height:1.35;max-width:520px;margin:0 auto">«${tHTML(line, l)}»</div>`
        + (en && l !== 'en' ? `<div class="en">${esc(en)}</div>` : '')
        + `<div class="sub" style="font-size:14px;opacity:.85;margin-top:8px">${esc(where)} · an echo of the speech he never finished</div><div class="sub">E</div>`);
    }
    try { if (g && g.save) g.save(); } catch (e) { /* */ }
    try { if (typeof TIME !== 'undefined' && TIME.refresh) TIME.refresh(); } catch (e) { /* */ }
    return S.echoes[k];
  }

  // ------------------------------------------------------------ the journal: "Elio's words" (every echo found so far, in order)
  function pageHTML() {
    const l = lang();
    let h = `<div class="mt"><h4 class="ph-h">Elio’s words <small>${count()} / ${TOTAL}</small></h4>`
      + `<p class="note">When the theater laughed, Elio’s voice broke. What he never got to say is scattered through every place’s yesterday and tomorrow. Each world’s boss holds one echo.</p><ol class="ch4-words">`;
    for (const r of ORDER) for (const w of ['past', 'future']) {
      const k = key(r, w), L = got(r, w), W = WORDS[k];
      if (L && W) h += `<li><b>«${tHTML(W[l] || W.es || '', l)}»</b>${W.en && l !== 'en' ? ` <span class="en">${esc(W.en)}</span>` : ''} <small>· ${esc(W.where || (NAMES[r] + (w === 'past' ? ', long ago' : ', tomorrow')))} · ${esc(L)}</small></li>`;
      else if (STEPS[r] && STEPS[r][w]) h += `<li style="opacity:.55">… <small>${esc(NAMES[r])}, ${w === 'past' ? 'long ago' : 'tomorrow'}</small></li>`;
    }
    return h + '</ol></div>';
  }
  function addTab() {
    if (typeof UI === 'undefined') return;
    UI.journalTabs = UI.journalTabs || [];
    if (UI.journalTabs.some(t => t.id === 'ch4-words')) return;
    UI.journalTabs.push({ id: 'ch4-words', label: () => (started() && (count() > 0 || TIME.seen('ch4.open')) ? 'Elio’s words' : null), html: () => pageHTML(), wire() { /* */ } });
  }

  // ------------------------------------------------------------ the main quest: Chapter 4 takes the place of "(coming soon!)"
  // The opening step (OPENING) is done when the cracks' first scene has played (time_alba.js); a region helper may replace it
  // (CH4.OPENING = { … }) with Noa's own scene. Then each built region's Past steps, then its Future steps, in ORDER. After the last
  // built region, a "coming soon" step points on to the next.
  const OPENING = {
    text: 'Chapter 4: Elio’s words. Find the time cracks in Alba',
    why: 'Noa is still caught in the great {w.clock}. «Find the place where his voice stopped, and give it back.» Since you came home, something shimmers in the air around Alba…',
    done: s => !!(s && s.worlds && s.worlds.seen && (s.worlds.seen['ch4.open'] || s.worlds.seen['alba.cracks'])),
    target: () => { const c = typeof TIME !== 'undefined' && TIME.CRACKS['alba.pond']; return c ? { x: c.x, z: c.z, hint: '{mimo} sniffs the air by the duck pond. A shimmer?' } : null; },
    hint: '{mimo} sniffs the air by the duck pond. A shimmer?',
  };
  function addCh4() {
    const main = typeof QUESTS !== 'undefined' && QUESTS.LIST.find(q => q.id === 'main'); if (!main || main.steps.some(x => x.ch4)) return;
    for (let i = main.steps.length - 1; i >= 0; i--) { const t = main.steps[i].text; if (typeof t === 'string' && /^Chapter 4/.test(t) && /coming soon/i.test(t)) main.steps.splice(i, 1); }
    const op = Object.assign({ ch4: 'open' }, CH4.OPENING || OPENING);
    main.steps.push(op);
    let next = null;
    for (const r of ORDER) {
      const S = STEPS[r];
      if (!S || (!S.past && !S.future)) { next = r; break; }
      if (S.past) main.steps.push(...S.past);
      if (S.future) main.steps.push(...S.future);
      if (STORY_L[r]) main.story.push(...STORY_L[r]);
    }
    if (next) main.steps.push({ ch4: 'soon', text: `Chapter 4 goes on in ${NAMES[next]}, long ago and tomorrow (coming soon!)`,
      why: `Noa’s voice is quiet for now. The time cracks in ${NAMES[next]} will open soon, and two more of Elio’s echoes are waiting there.`, done: () => false, target: () => null, hint: '{mimo} yawns. The next cracks aren’t open yet.' });
    else if (CH4.FINALE && CH4.FINALE.length) { main.steps.push(...CH4.FINALE); if (CH4.FINALE_STORY) main.story.push(...CH4.FINALE_STORY); }     // (the finale, finale.js: the tower, the stage, the valley)
    else main.steps.push({ ch4: 'soon', text: 'Chapter 4: the stage where his voice stopped (coming soon!)',
      why: 'All of Elio’s echoes are back. The old theater is waiting, in all three times at once.', done: () => false, target: () => null, hint: '{mimo} looks toward the Old Quarter.' });
  }
  if (typeof QUESTS !== 'undefined') {
    const init0 = QUESTS.init;
    QUESTS.init = function (game) { init0.call(this, game); try { addCh4(); } catch (e) { console.error('[quests: chapter 4]', e); } try { addTab(); } catch (e) { console.error('[chapter 4: journal]', e); } };
  }

  // ------------------------------------------------------------ test hooks
  const t = {
    openAll(on = true) { st().openAll = !!on; try { TIME.refresh(); } catch (e) { /* */ } return on; },
    give(r, w, letter = 'S') { return give(r, w, letter, { quiet: true }); },
    reset() { const s = st(); s.echoes = {}; s.at = {}; s.openAll = false; },
  };

  return { ORDER, NAMES, TOTAL, OPENING, open, steps, story, word, give, got, done, count, started, page: pageHTML, _: { t, st, STEPS, WORDS } };
})();
