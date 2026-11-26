'use strict';
// DEBATE: the town debates (D2, DESIGN.md 21.2 D, B1–B2 speaking), at the council hall upstairs in the town hall (townhall.js).
//   • One topic a "month" (40 minutes of play), six per language, in turn; each comes back later. They open after the first
//     bell, once your level is A2 (the debate is B1; from B1 on, the turns ask for B2: a comparison, a «si…» proposal).
//   • The flow: the mayor frames the topic; two neighbors make their case (natively written, B1–B2, through the weave); you pick
//     a side; then three turns with TALK.turn in the hall's own view (LIFEUI.debate): (1) your opinion with reasons; (2) the
//     other side's counterargument, which you answer (a reason, and a contrast word: «pero», «sin embargo»… — checked here,
//     on top of TALK.judge; without one the turn counts as a B at most); (3) a closing line (B2: a proposal with «si…»).
//     Each turn logs 'talk' (TALK.turn).
//   • The vote: the room leans a little toward one side to begin with (each topic's `lean`, 0.45–0.55), then each turn moves
//     it (S +0.08, A +0.06, B +0.03, C −0.02, D −0.05), plus a small chance (±0.03): an A or S average always wins. A win is 30
//     coins (the first: a paper megaphone for Mimo and a phrase); a loss, the mayor's thanks and 5 coins.
//   DEBATE.init(game) · menu() (the mayor) · run(topic, side) · topic() · boardLine() · open() · running · quests() · _ (tests)
// State: G.state.life.hall { start, done: { id: { month, side, won, grades, at } }, wins, played, mega }

const DEBATE = (() => {
  let G = null;
  const P = s => LIFE.P(s), E = s => LIFE.E(s);
  const C = () => LIFE.content() || {};
  const H = () => LIFE.S().hall;
  const MONTH = 2400, N = 41, DELTA = { S: 0.08, A: 0.06, B: 0.03, C: -0.02, D: -0.05 }, CHANCE = 0.03;
  const T = { fast: false, chance: null };
  const flags = () => (G && G.state && G.state.flags) || {};
  const open = () => !!(LIFE.ready() && G && G.state && flags().hatched && (flags().bells || 0) >= 1 && LIFE.level() >= 2 && (C().debates || []).length);
  let running = false;
  function month() { const h = H(); if (h.start == null) { h.start = LIFE.now(); LIFE.save(); } return Math.max(0, Math.floor((LIFE.now() - h.start) / MONTH)); }
  const left = () => MONTH - ((LIFE.now() - (H().start || 0)) % MONTH);
  function topic() { const ds = C().debates || []; return ds.length ? ds[month() % ds.length] : null; }
  const doneNow = d => { const r = d && H().done[d.id]; return !!(r && r.month === month()); };
  const hall = k => { const v = ((C().lines || {}).mayor || {})[k]; return v; };
  function boardLine() {
    if (!open()) return null;
    const d = topic(), tp = hall('board'); if (!d || !tp) return null;
    return LIFE.line(tp, { topic: LIFE.line(d.title) });
  }
  // a speaker: a bond person (TALK's name and look) or one of the content's own
  function person(x) {
    if (!x) return { name: '', look: null };
    let name = x.name ? P(x.name) : '', look = x.look || null;
    if (x.who) { try { if (!name) name = P(TALK.nameOf(x.who)); if (!look) look = TALK.lookOf(x.who); } catch (e) { /* */ } }
    return { name, look, voice: x.voice, pos: x.pos ? P(LIFE.frag(x.pos).t) : '', short: x.short ? P(LIFE.frag(x.short).t) : '', shortEn: x.short ? LIFE.frag(x.short).en : '' };
  }
  const mayor = () => { const m = C().mayor || {}; return { name: P(m.short || m.name || 'Mayor'), look: m.look, voice: m.voice }; };
  async function choose(title, opts) { const was = G.sim.lock; G.sim.lock = 1; try { return await UI.choose(title, opts); } finally { G.sim.lock = was; } }
  const msay = ln => (typeof TOWNHALL !== 'undefined' && ln ? TOWNHALL.mayorSay(ln) : null);

  // ------------------------------------------------------------ the mayor's menu
  async function menu() {
    if (!LIFE.ready()) return;
    const m = mayor();
    if (!open()) {
      await msay(LIFE.line(LIFE.pick(hall('hello') || []) || null));
      const why = (flags().bells || 0) < 1 ? 'after the first bell rings again' : `when your level is A2 (now ${LIFE.BANDS[LIFE.level()]})`;
      STORY.think(`Town debates are held here once a month, ${why}. They’re in ${LIFE.LANGNAME[LIFE.L()] || 'the language'}, at B1–B2.`, 6);
      return;
    }
    const d = topic(), done = doneNow(d), opts = [];
    if (!done) opts.push({ label: `Speak at this month’s debate`, sub: `«${P(LIFE.line(d.title).t)}» · ${LIFE.band() >= 3 ? 'B2' : 'B1'} · three turns, then the vote`, value: 'go' });
    else opts.push({ label: 'This month’s debate', sub: `you spoke already: the next one in about ${LIFE.mins(left())} min`, value: 'wait' });
    opts.push({ label: 'Ask about the debates', value: 'about' });
    const v = await choose(m.name, opts);
    if (v === 'go') return run(d);
    if (v === 'wait') return msay(LIFE.line(LIFE.pick(hall('wait') || []) || null));
    if (v === 'about') { for (const l of LIFE.lines(hall('about') || [])) await msay(l); }
  }

  // ------------------------------------------------------------ one debate
  const CONTRAST = { es: /\b(pero|sin embargo|aunque|en cambio|no obstante|mientras que|por otro lado|al contrario|entiendo|es verdad que|tiene raz[oó]n)\b/i,
    pt: /\b(mas|por[eé]m|contudo|no entanto|embora|enquanto|por outro lado|ao contr[aá]rio|entendo|[eé] verdade que|tem raz[aã]o)\b/i,
    de: /\b(aber|jedoch|trotzdem|dennoch|obwohl|allerdings|andererseits|im gegenteil|stimmt zwar|zwar|verstehe)\b/i,
    zh: /(但是|可是|不过|然而|虽然|尽管|另一方面|相反|我明白|我理解|没错|有道理|danshi|keshi|buguo|suiran)/i,
    ja: /(でも|しかし|けれど|けど|ですが|一方|ところが|たしかに|確かに|とはいえ|それでも|demo|shikashi|keredo|kedo|tashikani)/i };
  const hasContrast = (text, l = LIFE.L()) => (CONTRAST[l] || CONTRAST.es).test(LIFE.isC(l) && typeof CJK !== 'undefined' ? CJK.chars(String(text || ''), { lang: l }) + ' ' + String(text || '') : String(text || ''));
  const REACT = () => { const R = hall('react') || {}; return [{ if: { grade: ['S', 'A'] }, say: { any: R.good || [['¡Muy bien dicho!', 'Very well said!']] } }, { say: { any: R.ok || [['Gracias.', 'Thank you.']] } }]; };
  // the little examples in the goals, in the language you're speaking
  const HINT = { es: { but: 'entiendo, pero…', if: 'si…, …' }, pt: { but: 'entendo, mas…', if: 'se…, …' }, de: { but: 'ich verstehe, aber…', if: 'wenn…, würde…' },
    zh: { but: '我明白，但是……', if: '如果……，就……' }, ja: { but: 'たしかに…。でも…', if: 'もし…たら、…' } };
  function turns(d, side, b) {
    const me = side, them = side === 'a' ? 'b' : 'a', mods = (d.models || {})[side === 'a' ? 'for' : 'against'] || [];
    const S = hall('starters') || {};
    const by = (who, l) => (l ? Object.assign({}, l, { who }) : null);
    return [
      { id: 'open', ask: [by('mayor', LIFE.line(LIFE.pick(hall('yourTurn') || []) || ['¿Y tú qué opinas?', 'And what do you think?'], { pos: LIFE.frag(d[me].pos) }))],
        goal: `Say what you think (${(LIFE.frag(d[me].short) || {}).en || 'your side'}), and why: an opinion with a reason.`, want: { any: true, opinion: true, reason: true }, starter: S.open || null, model: mods[0], react: REACT(), band: b },
      { id: 'counter', ask: LIFE.lines(d[them].counter).map(l => by(them, l)).concat([by('mayor', LIFE.line(LIFE.pick(hall('answer') || []) || ['¿Qué le respondes?', 'What do you say to that?']))]),
        goal: `Answer their point: say what you think of it («${(HINT[LIFE.L()] || HINT.es).but}») and give a reason${b >= 4 ? ', comparing the two ideas' : ''}.`, want: Object.assign({ any: true, reason: true }, b >= 4 ? { compare: true } : {}), starter: S.counter || null, model: mods[1], react: REACT(), band: b },
      { id: 'close', ask: [by('mayor', LIFE.line(LIFE.pick(hall('lastWord') || []) || ['Una última palabra.', 'One last word.']))],
        goal: b >= 4 ? `Close with a proposal: «${(HINT[LIFE.L()] || HINT.es).if}» (what would happen if…).` : 'Close: say your opinion again in a sentence or two.', want: b >= 4 ? { any: true, time: 'hypo' } : { any: true, opinion: true }, starter: (b >= 4 ? S.closeB2 : S.close) || null, model: mods[2], react: REACT(), band: b },
    ];
  }
  // the vote: where the room starts (the topic's lean for your side), each turn's grade, a small chance
  function tally(d, side, grades, chance) {
    const base = side === 'a' ? (d.lean != null ? d.lean : 0.5) : 1 - (d.lean != null ? d.lean : 0.5);
    const lean = Math.max(0.1, Math.min(0.9, base + grades.reduce((a, g) => a + (DELTA[g] || 0), 0) + (chance != null ? chance : (Math.random() * 2 - 1) * CHANCE)));
    let you = Math.round(N * lean); if (you * 2 === N) you += lean >= 0.5 ? 1 : -1;
    return { you, them: N - you, won: you > N - you, lean };
  }
  async function run(d, side) {
    if (!d || running) return null;
    running = true;
    const b = LIFE.band() >= 3 ? 4 : 3;
    let view = null, res = null;
    try {
      const A = person(d.a), Bp = person(d.b), M = mayor();
      if (!side) {
        const v = await choose(P(LIFE.line(d.title).t), [{ label: `Speak ${A.short || 'for'}`, sub: A.pos, value: 'a' }, { label: `Speak ${Bp.short || 'against'}`, sub: Bp.pos, value: 'b' }]);
        if (!v) return null;
        side = v;
      }
      stage(d, A, Bp, true);
      view = LIFEUI.debate({ title: P(LIFE.line(d.title).t), people: { mayor: Object.assign({}, M, { pos: P(LIFE.line(d.title).t) }), a: A, b: Bp }, side, band: b });
      // the mayor frames it, each side makes its case
      for (const l of LIFE.lines(d.mayor)) { if (!view.alive) break; await view.line('mayor', l); }
      for (const k of ['a', 'b']) for (const l of LIFE.lines(d[k].say)) { if (!view.alive) break; await view.line(k, l); }
      view.sys(`You speak ${side === 'a' ? (A.short || 'for') : (Bp.short || 'against')}. Three turns, then the townsfolk vote.`);
      const ctx = { view, who: null, band: b, grades: [], coins: 0, force: new Set(), scene: { id: 'debate.' + d.id } };
      const grades = [];
      let k = 0;
      for (const tn of turns(d, side, b)) {
        if (!view.alive) break;
        const r = await TALK.turn(tn, ctx);
        if (!r || r.quit) break;
        let g = r.r && r.r.grade ? r.r.grade : 'D';
        // the counterargument: answered, or only restated? (a contrast word: «pero», «sin embargo», «aunque»…)
        if (tn.id === 'counter' && r.r && r.r.understood && !hasContrast(r.r.text) && ['S', 'A'].includes(g)) {
          g = 'B';
          await view.mimo({ tips: [`Answer their point first: ${({ es: '«Entiendo, pero…», «Es verdad que…, sin embargo…»', pt: '«Entendo, mas…», «É verdade que…, porém…»', de: '«Ich verstehe das, aber…», «Das stimmt zwar, trotzdem…»', zh: '«我明白，但是…»，«虽然…，可是…»', ja: '«たしかに…。でも…»，«…ですが、…»' })[LIFE.L()] || '«…, pero…»'}. This answer counts as a B.`] });
        }
        grades.push(g); k++;
        view.meter(tally(d, side, grades, 0).lean);
      }
      if (grades.length < 3) { view.close(); return { quit: true }; }
      // the vote
      const chance = T.chance != null ? T.chance : (Math.random() * 2 - 1) * CHANCE;
      const t = tally(d, side, grades, chance), h = H();
      h.done[d.id] = { month: month(), side, won: t.won, grades, at: Date.now() }; h.played++; if (t.won) h.wins++;
      let prize = '';
      if (t.won) {
        LIFE.coins(30); prize = '🪙 30 coins';
        if (!h.mega) { h.mega = true; const nm = LIFE.cosmetic('life.mega'); if (nm) prize += ` · for ${E(G.state.mimoName || 'Mimo')}: ${E(nm.en || 'a paper megaphone')} (People page)`; const ph = (hall('phrase') || null); if (ph) { const it = LIFE.teach(ph); if (it) prize += ` · 📖 «${E(P(it[LIFE.L()]))}» (${E(it.en)})`; } }
      } else { LIFE.coins(5); prize = '🪙 5 coins, with the town’s thanks'; }
      LIFE.save();
      stagePaddles(t, side);
      const fa = side === 'a' ? t.you : t.them, fb = N - fa;
      const lines = LIFE.lines([LIFE.pick(hall(t.won ? 'win' : 'lose') || [])].filter(Boolean), { pos: LIFE.frag(d[side].pos) });
      await view.vote({ forA: fa, forB: fb, won: t.won, lines, prize });
      res = { won: t.won, grades, tally: t };
      return res;
    } catch (e) { console.error('[debate]', e); return null; }
    finally { running = false; try { if (view) view.close(); } catch (e) { /* */ } stage(null); }
  }
  // the 3D hall: the two speakers at their lecterns, the townsfolk on the benches, you at the microphone
  const CROWD = [{ skin: '#e6b48c', hair: '#3a2b26', dress: '#3f6fb5' }, { skin: '#c98e62', hair: '#2e2420', dress: '#e0743c' }, { skin: '#f0c7a0', hair: '#c98a4a', dress: '#2f8f4e' }, { skin: '#a8714a', hair: '#1f1a1a', dress: '#8a4f7d' },
    { skin: '#e6b48c', hair: '#d8d8d8', dress: '#7a5236', old: true }, { skin: '#f0c7a0', hair: '#5a3a22', dress: '#e6a92e' }, { skin: '#8a5a3c', hair: '#1f1a1a', dress: '#d6453a' }, { skin: '#efc29a', hair: '#8a8a92', dress: '#4f8a7a', old: true },
    { skin: '#c98e62', hair: '#7a3f2a', dress: '#5b8fd6' }, { skin: '#e6b48c', hair: '#2e2420', dress: '#c2412f' }];
  let crowd = [];
  function stage(d, A, Bp, on) {
    if (typeof TOWNHALL === 'undefined' || !TOWNHALL.inside) return;
    TOWNHALL.clearExtras(); crowd = [];
    if (!d || !on) { if (G) G.cam.override = null; return; }
    const S = TOWNHALL.SPOT;
    TOWNHALL.person(A.look, S.spkA, { yaw: 0.55 }); TOWNHALL.person(Bp.look, S.spkB, { yaw: -0.55 });
    TOWNHALL.SEATS.forEach((p, i) => { if (i % 6 === 5) return; crowd.push(TOWNHALL.person(CROWD[i % CROWD.length], { x: p.x, z: p.z + 0.05 }, { sit: true, seatY: 0.47, yaw: Math.PI, noTurn: true })); });
    try { const at = TOWNHALL.at('you'); const Y = G.sim.you; Y.x = at.x; Y.z = at.z; Y.yaw = Math.PI; G.sim.snap(); } catch (e) { /* */ }
    TOWNHALL.shot('debate');
  }
  function stagePaddles(t, side) {
    crowd.forEach((p, i) => { p.pose = i / Math.max(1, crowd.length) < t.you / N ? 'cheer' : 'hands'; });
    if (typeof TOWNHALL !== 'undefined' && TOWNHALL.inside) TOWNHALL.shot('vote');
    void side;
  }

  // ------------------------------------------------------------ the side quest: «The town debate»
  function quests() {
    return [{
      id: 'life.hall', kind: 'side',
      get title() { return 'The town debate'; },
      get giver() { return 'the town hall’s notice board'; },
      started: () => open(),
      steps: [{ text: 'Speak at this month’s debate in the town hall', why: 'Once a month the town debates a local question upstairs in the town hall. Give your opinion, answer the other side, and the townsfolk vote.',
        done: () => doneNow(topic()), target: () => (typeof TOWNHALL !== 'undefined' ? (TOWNHALL.inside ? TOWNHALL.at('mayorTalk') : TOWNHALL.door()) : null), hint: '{mimo} clears its throat, very seriously.' }],
      story: [{ when: st => !!(st.life && st.life.hall && st.life.hall.played), get text() { const h = H(); return `You’ve spoken at ${h.played} town debate${h.played === 1 ? '' : 's'}, and won ${h.wins}.`; } }],
    }];
  }

  // ------------------------------------------------------------ checks and tests (DEBATE._.tests; the game never calls them)
  function check(l) {
    const out = [], c = LIFE.content(l); if (!c) return out;
    if ((c.debates || []).length && !((c.lines || {}).mayor || {}).yourTurn) out.push('lines.mayor: yourTurn, answer, lastWord, win, lose, board');
    for (const d of c.debates || []) { if (!(d.lean >= 0.45 && d.lean <= 0.55)) out.push(`debate ${d.id}: lean ${d.lean} (0.45–0.55)`); for (const s of ['a', 'b']) if (!(d[s] && (d[s].who || d[s].name))) out.push(`debate ${d.id}.${s}: who or name`); }
    return out;
  }
  function tests(l) {
    const fails = [], counts = { debates: 0 }, ok = (cond, what) => { if (!cond) fails.push(what); return cond; };
    const c = LIFE.content(l); if (!c) return { fails: ['no content'], counts };
    const txt = x => { const r = LIFE.raw(x); return r ? (LIFE.isC(l) ? CJK.chars(r.t, { lang: l }) : r.t) : ''; };
    const idk = { es: 'No sé.', pt: 'Não sei.', de: 'Ich weiß es nicht.', zh: '我不知道。', ja: 'わかりません。' }[l];
    try {
      for (const d of c.debates || []) {
        counts.debates++;
        for (const side of ['a', 'b']) for (const b of [3, 4]) {
          const ts = turns(d, side, b);
          ts.forEach((tn, i) => {
            const m = txt(tn.model), w = `${d.id}.${side}.${['B1', 'B2'][b - 3]}.${tn.id}`;
            const g = EXAM.grade.turn(m, tn, b, l);
            ok(g.understood && g.s >= 4.25, `${w}: the model is ${g.understood ? g.grade : 'not understood'} («${m}»${g.r && g.r.missing && g.r.missing.length ? ', missing ' + g.r.missing.join(',') : ''}${g.r && g.r.errors ? ' ' + g.r.errors.filter(x => !x.free).map(x => x.code + ' «' + x.fix + '»').join(', ') : ''})`);
            if (tn.id === 'counter') ok(hasContrast(m, l), `${w}: the model has no contrast word`);
            ok(!EXAM.grade.turn(idk, tn, b, l).s, `${w}: «${idk}» scores`);
          });
        }
        // an A average always wins; all D's lose
        for (const side of ['a', 'b']) {
          ok(tally(d, side, ['A', 'A', 'A'], -CHANCE).won, `${d.id}.${side}: an A average can lose`);
          ok(tally(d, side, ['S', 'A', 'B'], -CHANCE).won, `${d.id}.${side}: S, A, B can lose`);
          ok(!tally(d, side, ['D', 'D', 'C'], CHANCE).won, `${d.id}.${side}: D, D, C can win`);
        }
      }
      ok(hasContrast({ es: 'Entiendo, pero no estoy de acuerdo.', pt: 'Entendo, mas não concordo.', de: 'Ich verstehe das, aber ich sehe es anders.', zh: '我明白，但是我不同意。', ja: 'たしかに。でも、ちがうと思います。' }[l], l), 'hasContrast misses a contrast');
      ok(!hasContrast({ es: 'Los coches son malos porque hacen ruido.', pt: 'Os carros são ruins porque fazem barulho.', de: 'Autos sind schlecht, weil sie laut sind.', zh: '汽车不好，因为很吵。', ja: '車は うるさい から よくない です。' }[l], l), 'hasContrast sees one that isn’t there');
    } catch (e) { fails.push('debate threw: ' + (e && e.stack || e)); }
    return { fails, counts };
  }

  function init(game) { G = game; }
  return {
    init, menu, run, topic, month, boardLine, open, quests, hasContrast,
    get running() { return running; },
    _: { T, tally, turns, check, tests, person, DELTA, N, MONTH },
  };
})();
