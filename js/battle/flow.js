'use strict';
// The battle flow and the BATTLE contract (see game/ARCHITECTURE.md):
//   const { outcome, stats } = await BATTLE.start({ renderer, lang, foes, place, tutorial, mimoName, onEvent });
//   BATTLE.update(dt, input) and BATTLE.render() every frame while it runs.
// It owns the game clock and tweens, the turn loop, every move with its Space timing press, foe
// turns with shouted telegraphs and ↑/↓ dodges, recasts, the repeat block, glowing due words,
// talk-downs, the Coach's lessons, the language tier (how precise a command must be for full
// power), the attack rating (S–D: every command's grade sets its power and pops as a badge on the
// hit; see gradeOf), meeting a new kind of creature (meetKinds), the moth's knock-down and the
// beetle's shell, and every call into the language engine (LEX). Ported from the grey box (prototypes/battle).
// Chapter 1 (DESIGN.md 14.2): the armadillo (curled up it shrugs off hits; «empuja» flips it onto its
// back for a turn, belly ×2), the push lesson when a fight meets one before Mimo knows «empuja», food
// from the bag («come la manzana» heals; the Coach teaches «come» the first time you're hurt with food
// in the bag), and the coins a fight earns (per graded command, and per foe beaten).
// Region 2, the Mirror Lake (DESIGN.md 14.5): the frog (a tongue lash, or at the lake a splash), positions
// for every kind («la rana de la izquierda»: when two or more look the same, a command that doesn't say
// which is ambiguous, so Mimo hesitates, picks one, and the grade says so), the Coach's position lesson
// (lessonPositions), the frogs hopping to other lily pads after every foes' turn (frogsHop), and fish to eat.
// Practice in a training yard (practiceMain): BATTLE.start({ practice: true, focus, coach: { name: 'Bruno' } }) sets up
// straw dummies that never hurt, the coach by name cheering every command (with the why for anything under an S), no
// coins, no losing, nothing used up, and a card with the grades and Again / Done; it resolves { outcome: 'done', grades }.
// The Corn Society (bossMain): BATTLE.start({ boss: true, place: { biome: 'cellar' } }): Colonel Cob behind his closed
// husk cape (hits bounce off), his kernel soldiers, the cape thrown open for popcorn bursts (then he can be hit), the hot
// floor at half his hearts that pops every new squad into popcorn (hopping about like the frogs), and «¡Me rindo!».
// The boss contract (DESIGN.md 16, for the music): BATTLE.boss() is opts.boss (true or an id) while a boss fight runs, else null;
// the bosses that don't pass it are known by their foes (bossIdOf: a giant one, or the hill's big Hushling). BATTLE.bossOf(opts)
// tells the same before a fight starts. The Great Mill's giant armadillo (armaMain, below): BATTLE.start({ boss: 'armadillo' }).
// Rewards (battle/rewards.js, _.RW: Mimo's level, freed words, drops, the bestiary) and sounds (js/battle_fx.js, _.fx: voices,
// wind-ups, impacts, blocks, dodges) hook in where they're used; without those files nothing changes.
(() => {
  const B = window.BATTLE, _ = B._;
  const ST = _.STAGE, UI = _.UI, P = _.P;
  const hasLEX = () => typeof LEX !== 'undefined';
  const PERFECT = 0.07, GOOD = 0.16, EARLY = 0.45;
  const FLEE = { flee: true };
  // Plug-in boss fights (2026-11-16, oldtower_boss.js's hooded figure): a module runs a boss of its own on this machinery.
  // _.plugins[id] = { setup(K), main(K), foePhase(K), floor(f, K), end(K, outcome) }, picked by opts.boss; K = kit(), the pieces a fight is made of.
  _.plugins = _.plugins || {};
  const kit = () => ({ G, A, ST, UI, P, emit, wait, tween, along, arcTo, squash, turnTo, yawTo, setMood, say, line, intro, askOrFlee, perform, refreshLabels, foeAttack,
    timingWindow, dodgeMove, dodgeResult, dodgeHint, hurtFoe, readTime, earn, targetable, knows, showWord, mimoReact, fleeScene, loseScene, FLEE });
  const VERB_EN = { jump: 'jump', hit: 'hit', throw: 'throw', attack: 'attack', grab: 'grab (no «an»!)', push: 'push', eat: 'eat', sing: 'sing', climb: 'climb', call: 'call' };
  const COLOR_EN = { red: 'red', blue: 'blue', green: 'green', yellow: 'yellow', white: 'white' };
  const KIND_EN = { hushling: 'hushling', hushbig: 'big one', moth: 'moth', beetle: 'beetle', armadillo: 'armadillo', frog: 'frog', dummy: 'dummy', kernel: 'kernel', popcorn: 'popcorn', colonel: 'colonel', bat: 'bat', bee: 'bee', snowball: 'snowball', crab: 'crab', worm: 'worm' };
  const POS_EN = { left: 'on the left', middle: 'in the middle', right: 'on the right' };
  // [masculine, feminine]: «está dormido» for a hushling, «está dormida» for a moth
  const STATE_LBL = { es: { asleep: ['está dormido', 'está dormida'], angry: ['está enojado', 'está enojada'] }, pt: { asleep: ['tá dormindo', 'tá dormindo'], angry: ['tá bravo', 'tá brava'] }, de: { asleep: ['schläft', 'schläft'], angry: ['wütend', 'wütend'] } };
  const WEAK_NEXT = { tail: 'head', head: 'shell', shell: 'tail' };
  // kinds whose name a fight teaches the first time you meet one (_.NEW_KINDS: a region adds its own, js/ch5/mer_noise.js)
  const NEW_KINDS = _.NEW_KINDS = ['moth', 'beetle', 'armadillo', 'frog', 'dummy', 'kernel', 'popcorn', 'colonel', 'bat', 'bee', 'snowball', 'crab', 'worm'];
  // kinds that swap places after every foes' turn (the frogs on their lily pads, popcorn on the hot floor)
  const HOPPERS = ['frog', 'popcorn'];
  const CORN = ['kernel', 'popcorn', 'colonel'];
  // coins: per graded command, and per foe beaten (or talked down); the colonel giving up is worth more
  const COINS = { S: 3, A: 2, B: 1, C: 1, D: 0 }, COINS_FOE = 2, COINS_BOSS = 10;

  // ------------------------------------------------------------ the attack rating (how correct the sentence was)
  // It sets the move's power. The timing press (PERFECT = +1) is separate: that's timing, this is language.
  //   S  no slips, and as precise as your level asks for (needOf)       ×1.25
  //   A  a small style change, or one rung less precise (an accent is only a tip, P6a) ×1
  //   B  one slip (spelling, gender, a linking word, an ending, an article) ×0.85
  //   C  a big slip (ser/estar, German case, the separable «an»), the target missing when it's needed, or two slips ×0.7
  //   D  three slips or more: Mimo barely understood                    ×0.5
  const GRADES = { S: { mult: 1.25, score: 4 }, A: { mult: 1, score: 3 }, B: { mult: 0.85, score: 2 }, C: { mult: 0.7, score: 1 }, D: { mult: 0.5, score: 0 } };
  const SLIP = { spelling: 'Spelling slip', gender: 'Gender slip', prep: 'Linking-word slip', possessive: 'Whose? slip', article: 'Article missing', ending: 'Ending slip',
    number: 'One or two? slip', stressedA: '«el ala» slip', serestar: 'ser / estar mix-up', case: 'Case slip', particle: '«… an» slip', target: 'Missing the target',
    position: 'Position slip' };
  const SOFT = { accent: 'Accent missing', accentWord: 'The accent changes the word here', style: 'Almost perfect', part: 'Name a part for an S' };
  // two or more look the same and the command didn't say which (like a missing target: C, or a note when a verb is enough)
  const whichText = n => (n >= 3 ? 'Say which one: left, middle or right' : 'Say which one: left or right');

  const G = {
    running: false, run: null, t: 0, tweens: [], waits: [], hitstop: 0, renderer: null, opts: null, L: null, lang: 'es', name: 'Mimo', voc: new Set(),
    tier: 1, pace: 1, hearts: 8, maxHearts: 8, turn: 0, timing: null, pending: null, coachNext: null, resultNext: null, confirmOpen: false,
    foes: [], glow: null, lastKey: null, frames: [], usage: {}, stats: null, auto: null, tutorial: null, showWeak: false, onEvent: () => {},
    nextShh: 0, winLine: null, lastResult: null, log: [],
    bag: {}, items: {}, foods: {},   // food: what's in the bag (id → count), what each heals (id → { heal }), the words for it (id → { w, pl, g, en, mass })
    // practice (G.focus: 'verbs' | 'colors' | 'positions' | 'mixed'; G.round: which round of dummies), the coach's name,
    // the boss (G.boss: { f: the colonel, phase, openTurns, squads }), and the practice card's Done (Esc)
    practice: false, focus: null, round: 0, coachName: 'Coach', boss: null, resultDone: null, resultButtons: false, nextId: 0,
  };
  const A = {};
  // every event goes to the game (main.js's sounds) and to the battle's own sound layer (js/battle_fx.js), if it's loaded
  const emit = (type, extra) => {
    const ev = Object.assign({ type }, extra || {});
    try { G.onEvent(ev); } catch (e) { console.warn('[battle] onEvent', e); }
    if (_.fx && _.fx.on) try { _.fx.on(ev, G); } catch (e) { console.warn('[battle] fx', e); }
  };

  // ------------------------------------------------------------ clock and tweens (all on the game clock G.t)
  const EASE = {
    lin: u => u,
    out: u => 1 - Math.pow(1 - u, 3),
    in: u => u * u * u,
    io: u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    back: u => { const s = 1.7; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); },
  };
  function tween(o, to, dur, ease = 'out', step) {
    return new Promise(res => {
      const from = {};
      for (const k in to) from[k] = o[k];
      G.tweens.push({ o, from, to, t0: G.t, dur: Math.max(0.001, dur), ease: EASE[ease] || ease, step, res });
    });
  }
  const wait = s => new Promise(res => G.waits.push({ at: G.t + s, res }));
  const along = (dur, fn, ease = 'lin') => tween({ u: 0 }, { u: 1 }, dur, ease, fn);
  // through the air to (x, y, z), peaking h above the straight line
  function arcTo(st, x1, y1, z1, dur, h, ease = 'lin') {
    const x0 = st.x, y0 = st.y, z0 = st.z;
    return along(dur, e => { st.x = lerp(x0, x1, e); st.z = lerp(z0, z1, e); st.y = lerp(y0, y1, e) + 4 * h * e * (1 - e); }, ease);
  }
  async function squash(st, sx = 1.25, sy = 0.75, d = 0.08) { await tween(st, { sx, sy }, d); await tween(st, { sx: 1, sy: 1 }, d * 2.4, 'back'); }
  function turnTo(st, yaw, d = 0.14) { let dy = yaw - st.yaw; while (dy > Math.PI) dy -= TAU; while (dy < -Math.PI) dy += TAU; return tween(st, { yaw: st.yaw + dy }, d); }
  const yawTo = (st, x, z) => Math.atan2(x - st.x, z - st.z);
  function setMood(st, mood, dur) { st.mood = mood; st.moodUntil = dur ? G.t + dur : 0; }
  const everyone = () => [A.you, A.mimo, A.coach, ...G.foes].filter(Boolean);
  function tick(dt) {
    G.t += dt;
    for (let i = 0; i < G.tweens.length; i++) {
      const tw = G.tweens[i];
      const u = Math.min(1, (G.t - tw.t0) / tw.dur), e = tw.ease(u);
      for (const k in tw.to) tw.o[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
      if (tw.step) tw.step(e, u);
      if (u >= 1) { G.tweens.splice(i--, 1); tw.res(); }
    }
    for (let i = 0; i < G.waits.length; i++) if (G.t >= G.waits[i].at) { const w = G.waits[i]; G.waits.splice(i--, 1); w.res(); }
    updateTiming();
    for (const a of everyone()) {
      if (a.flash > 0) a.flash = Math.max(0, a.flash - dt);
      if (a.talkUntil && G.t > a.talkUntil) { a.talk = 0; a.talkUntil = 0; }
    }
  }

  // ------------------------------------------------------------ language helpers
  const fill = s => String(s).replace(/\{name\}/g, G.name);
  // a creature's grammatical gender in this language: polilla / mariposa / Motte are feminine
  const genderOf = f => (f && G.L.species[f.species] ? G.L.species[f.species].g : 'm');
  // a line, in the feminine version when it's about a feminine creature («¡Ahora está enojada!», «Sie schwebt!»),
  // or the neuter one for a German das-word («Jetzt ist es wütend!»)
  const line = (key, f) => {
    const g = f ? genderOf(f) : null;
    const l = (g === 'f' && G.L.t[key + 'F']) || (g === 'n' && G.L.t[key + 'N']) || G.L.t[key];
    return l ? [fill(l[0]), fill(l[1])] : [key, key];
  };
  // «la polilla», «o besouro», «der Käfer»
  function theWord(species) {
    const S = G.L.species[species]; if (!S) return species;
    if (G.L.cjk) return S.w;                    // (zh / ja: no articles; the word in the CJK.md notation)
    const A = { es: { m: 'el', f: 'la' }, pt: { m: 'o', f: 'a' }, de: { m: 'der', f: 'die', n: 'das' } }[G.lang];
    return `${A[S.g] || ''} ${S.w}`.trim();
  }
  // Mimo knows a word when the language engine says it was taught (w.<key> from the world counts too)
  function knows(id) {
    if (!hasLEX()) return true;
    if (LEX.taught(id)) return true;
    const w = 'w.' + id.split('.')[1];
    return !!(LEX.item(w) && LEX.taught(w));
  }
  const knownWell = id => hasLEX() && LEX.st(id).stage >= LEX.STAGE.KNOWN;
  function lexAttempt(id, o) { if (!hasLEX() || !LEX.item(id)) return; LEX.attempt(id, o); }
  function registerItems() { if (hasLEX() && !_.registered) { if (_.registerItems) _.registerItems(); else { LEX.register(_.ITEMS); _.registered = true; } } }
  function showWord(id) {
    const L = G.L, [kind, key] = id.split('.');
    if (kind === 'p') return L.positions && L.positions[key] ? L.positions[key].w : key;     // «izquierda», «meio», «links»
    if (kind === 'v') return L.verbs[key] ? L.verbs[key].show : key === 'attack' ? 'greif … an' : key;
    if (kind === 'a') return L.code === 'de' ? (L.adjs[key] ? L.adjs[key].stem : key) : (L.adjs[key] ? L.adjs[key].forms[0].m : key);
    if (kind === 'n') return L.parts[key] ? L.parts[key].w : L.species[key] ? L.species[key].w : key === 'stone' && L.stone ? L.stone.w : key;
    if (kind === 'o') return L.stoneShow ? L.stoneShow[key].split(' ')[1] : key;
    if (kind === 't') { const it = hasLEX() && LEX.item(id); return it ? it[G.lang] : key; }
    if (kind === 'w') { const f = G.foods[id]; if (f) return f.w; const it = hasLEX() && LEX.item(id); return it ? it[G.lang] : key; }
    return key;
  }
  const wordSay = id => P.wrapS(G.L, showWord(id));
  function adjShow(key, g) { const L = G.L; if (!L.adjs[key]) return key; return L.code === 'de' ? L.adjs[key].stem : (g === 'f' ? L.adjs[key].forms[0].f : L.adjs[key].forms[0].m); }
  function glossLex(word) {
    const n = P.nrm(word), L = G.L, I = L.I;
    const v = I.verbs.get(n); if (v) return L.verbs[v.key].en;
    const po = I.pos && I.pos.get(n); if (po) return L.positions[po.key].en;
    const s = I.species.get(n); if (s) return L.species[s.key].en;
    const p = I.parts.get(n); if (p) return L.parts[p.key].en;
    const fd = I.foods && I.foods.get(n); if (fd) { const f = G.foods[fd.id]; return f ? (fd.pl ? f.enPl : f.en) : null; }
    if (L.code === 'de') { const a = P.deAdj(I, n); return a && !a.typo ? L.adjs[a.key].en : null; }
    const a = I.adjs.get(n); return a ? a.keys.map(k => L.adjs[k].en).join(' ') : null;
  }
  function glossify(text) {
    const g = G.L.gloss || {};
    return text.split(/(\s+)/).map(w => {
      const core = w.replace(/^[¡¿«„“"(…]+|[!?.,;:»“”")…]+$/g, '');
      const key = core.toLowerCase();
      const hit = core && (g[key] || glossLex(key));
      return hit ? UI.esc(w).replace(UI.esc(core), `<span class="g" data-g="${UI.esc(hit)}">${UI.esc(core)}</span>`) : UI.esc(w);
    }).join('');
  }

  // ------------------------------------------------------------ food from the bag
  // G.items: what each food heals (the game's table, over battle/lang.js _.FOOD); G.bag: what you carry;
  // G.foods[id] = { id, key, w, pl, g, en, enPl, mass, heal }: its words in this language, from LEX.item(id)
  const foodKey = id => String(id).replace(/^w\./, '');
  function loadFoods(opts) {
    const items = {};
    const put = (id, v) => {
      const o = typeof v === 'number' ? { heal: v } : v || {};
      items[id] = Object.assign(items[id] || {}, typeof o.heal === 'number' ? { heal: o.heal } : {}, o.mass !== undefined ? { mass: !!o.mass } : {});
    };
    for (const [id, v] of Object.entries(_.FOOD || {})) put(id, v);
    if (Array.isArray(opts.items)) opts.items.forEach(x => { if (x && x.id) put(x.id, x); });
    else if (opts.items && typeof opts.items === 'object') for (const [id, v] of Object.entries(opts.items)) put(id, v);
    G.items = items;
    G.foods = {};
    for (const id of Object.keys(items)) {
      const heal = items[id].heal || 0;
      if (heal <= 0) continue;                                 // not food (a hat…)
      // the battle's own words win where they differ (fish: «el pescado» is food, «el pez» swims; both are fine)
      const it = (hasLEX() && LEX.item(id)) || null, fw = (_.FOOD_WORDS || {})[id], own = fw && fw[G.lang];
      if (!own && (!it || !it[G.lang])) continue;            // no words for it yet
      const alt = new Set([...((it && it.alt && it.alt[G.lang]) || []), ...((own && own.alt) || [])]);
      if (own && it && it[G.lang] && P.nrm(it[G.lang]) !== P.nrm(own.w)) alt.add(it[G.lang]);
      const en = (it && it.en) || (fw && fw.en) || foodKey(id);
      G.foods[id] = { id, key: foodKey(id), w: own ? own.w : it[G.lang], pl: own ? own.pl || null : (it.pl && it.pl[G.lang]) || null,
        g: own ? own.g || 'm' : (it.g && it.g[G.lang]) || 'm', en, enPl: (it && it.enPl) || (fw && fw.enPl) || en + 's', mass: !!items[id].mass, heal, alt: [...alt] };
    }
    G.bag = {};
    for (const [id, n] of Object.entries(opts.bag || {})) { const c = Math.max(0, Math.floor(+n || 0)); if (c && G.foods[id]) G.bag[id] = c; }
    // a food the world hasn't named yet (fish, before the lake has its word): the battle's words go into the
    // language engine, so Mimo can learn it like any other
    for (const id of Object.keys(G.bag)) {
      const fw = (_.FOOD_WORDS || {})[id];
      if (!hasLEX() || LEX.item(id) || !fw) continue;
      const by = k => ({ es: fw.es[k], pt: fw.pt[k], de: fw.de[k] });
      LEX.register([{ id, kind: 'word', en: fw.en, enPl: fw.enPl, icon: fw.icon, es: fw.es.w, pt: fw.pt.w, de: fw.de.w, g: by('g'), pl: by('pl'),
        alt: { es: fw.es.alt || [], pt: fw.pt.alt || [], de: fw.de.alt || [] } }]);
    }
    P.setFoods(G.L, Object.values(G.foods));
  }
  const bagFoods = () => Object.keys(G.bag).filter(id => G.bag[id] > 0 && G.foods[id]);
  // «la manzana», «o pão», «der Apfel», «das Brot»
  function foodThe(id) {
    const f = G.foods[id]; if (!f) return id;
    if (G.L.cjk) return f.w;
    const A = { es: { m: 'el', f: 'la' }, pt: { m: 'o', f: 'a' }, de: { m: 'der', f: 'die', n: 'das' } }[G.lang];
    return `${A[f.g] || ''} ${f.w}`.trim();
  }
  function refreshBag() {
    UI.bag(bagFoods().map(id => {
      const f = G.foods[id], the = G.L.cjk ? ['', f.w] : foodThe(id).split(' ');
      return { key: f.key, n: G.bag[id], en: `${f.en}: heals ${f.heal} ♥`, html: `<span class="art">${UI.esc(the.slice(0, -1).join(' '))}</span> ${UI.esc(the[the.length - 1])}` };
    }));
  }
  // the sentence for eating it: «¡Come la manzana!», «Iss den Apfel!» (o: { indef, bare })
  const eatSentence = (id, o) => P.sayEat(G.L, G.foods[id], o);
  // the food to eat now: the one that heals the most without going past full, else the smallest
  function bestFood() {
    const list = bagFoods(); if (!list.length) return null;
    const miss = Math.max(1, G.maxHearts - G.hearts);
    const fit = list.filter(id => G.foods[id].heal <= miss).sort((a, b) => G.foods[b].heal - G.foods[a].heal);
    return fit[0] || list.sort((a, b) => G.foods[a].heal - G.foods[b].heal)[0];
  }

  // how much of what people say is in the language (LEX.weave(), 0 to 1); 1 without the game's engine
  const weaveLevel = () => (hasLEX() && LEX.weave ? LEX.weave() : 1);
  // in an English line, pick out the words in the language («salta», “rojo”)
  const markWords = html => html.replace(/[“«]([^”»]+)[”»]/g, (m, w) => `<b class="tl">«${w}»</b>`);
  // (P7b) the Coach's line for a beginner: its English mixed at your level by the game's weave (STORY.mixHTML: the words you know or
  // are meeting in the language, glossed), the lesson's «words» picked out. null: this line goes whole in the language now.
  function coachMix(txt, en, key) {
    let m = null;
    try { if (typeof STORY !== 'undefined' && STORY.mixHTML && hasLEX() && txt) m = STORY.mixHTML(txt, en, { key: 'coach:' + (typeof key === 'string' ? key : en) }); } catch (e) { m = null; }
    if (m && m.full) return null;
    return markWords(m && m.html ? m.html : UI.esc(en || ''));
  }

  // ------------------------------------------------------------ speech
  function say(st, text, o = {}) {
    UI.say(st, text, G.t, o);
    if (st.kind !== 'you') { st.talk = 1; st.talkUntil = G.t + Math.min(1.3, (o.dur || 2) * 0.6); }
    // a voice: each kind of foe has its own (chirps, grunts, gibberish), a boss a bigger one; Mimo babbles (js/battle_fx.js)
    if (_.fx && _.fx.voice && !o.html && (st.kind === 'foe' || st.kind === 'mimo')) try { _.fx.voice(st, String(text), o, G); } catch (e) { console.warn('[battle] voice', e); }
  }
  // who looks at whom: the party faces the Coach while he talks, Mimo faces you while you teach it
  function facing(mode) {
    if (G.facing === mode) return;
    G.facing = mode;
    const C = A.coach, Y = A.you, M = A.mimo;
    if (mode === 'coach') {
      turnTo(M, yawTo(M, C.x, C.z), 0.25);
      Y.look = clamp(angDiff(Y.yaw, yawTo(Y, C.x, C.z)), -1.3, 1.3);
    } else if (mode === 'you') {
      turnTo(M, yawTo(M, Y.x + 0.6, Y.z + 1.2), 0.25);
      Y.look = clamp(angDiff(Y.yaw, yawTo(Y, M.x, M.z)), -1.3, 1.3);
    } else {
      turnTo(M, M.baseYaw, 0.25);
      Y.look = 0;
    }
  }
  function coachSay(key, o = {}) {
    const [txt, en] = Array.isArray(key) ? key : line(key);
    const C = A.coach;
    if (!C.hidden) facing('coach');
    C.talk = 1; C.talkUntil = G.t + 1.6; setMood(A.mimo, 'perk', 1.4);
    C.point = 0; tween(C, { point: 1 }, 0.15).then(() => tween(C, { point: 0 }, 0.45));
    if (o.look) turnTo(C, yawTo(C, o.look.x, o.look.z), 0.2);
    // The Coach talks at your level, like everyone else (the weave, DESIGN.md 12.4 and 12.7): beginners get the English with the
    // words to learn in the language and picked out, and the line in the language under it; after that, the line in the
    // language, each word glossed on hover, and the English only on request (EN): DESIGN.md 17.3, no full English under a line.
    const W = weaveLevel(), who = o.who || (C.hidden ? G.name : G.coachName || 'Coach');
    // (P7b, for the lead: never a whole line with its translation under it, DESIGN.md 17.3 and REGIONS.md rule 3. A beginner's line
    // is the English mixed at their level like every other line in the game, STORY.mixHTML, with the lesson's «words» picked out;
    // the whole line in the language waits behind a small toggle in the box. Without STORY (battle-test.html): the English.)
    const mixed = W < 0.62 ? coachMix(txt, en, key) : null;
    // zh / ja: the line through CJK (ruby that fades, or pinyin / rōmaji), each word with its meaning on hover; the English has «words» too
    if (G.L.cjk && UI.cj) {
      if (mixed !== null) UI.coach(UI.cj.mix(mixed), UI.cj.line(txt, G.L.gloss), 'tl-toggle', true, who, G.L.name);
      else UI.coach(UI.cj.line(txt, G.L.gloss), UI.cj.mix(UI.esc(en)), '', true, who);
    } else if (mixed !== null) UI.coach(mixed, glossify(txt), 'tl-toggle', true, who, G.L.name);
    else UI.coach(glossify(txt), en, '', false, who);
    const tok = {};
    G.coachTok = tok;
    return new Promise(res => {
      G.coachNext = () => { if (G.coachTok !== tok) return; G.coachNext = null; G.coachTok = null; UI.coachHide(); C.talk = 0; turnTo(C, C.baseYaw, 0.2); res(); };
      if (G.auto && G.auto.dialog) wait(0.35).then(() => { if (G.coachTok === tok && G.coachNext) G.coachNext(); });
    });
  }
  async function coachWhile(key, fn) { const p = coachSay(key); await wait(0.45); await fn(); await p; }
  // lines in a fight without the Coach come from Mimo, with the English underneath (f: the creature it's about)
  function mimoLine(key, dur = 2, f) { const [t, en] = line(key, f); say(A.mimo, t, { cls: 'mimo', en, dur }); }
  function sideLine(key, dur = 2.2, f) { const [t, en] = line(key, f); if (!A.coach.hidden) say(A.coach, t, { cls: 'coach', en, dur }); else say(A.mimo, t, { cls: 'mimo', en, dur }); }

  // ------------------------------------------------------------ the prompt
  function ask(kind, o = {}) {
    return new Promise(res => {
      G.pending = Object.assign({ kind, res, hints: 0, fails: 0, rt0: performance.now() }, o);
      const label = { echo: 'Type it', teach: `Teach ${G.name}`, command: `Tell ${G.name}` }[kind];
      UI.prompt({
        kind, label, icon: kind === 'teach' ? o.id : null, echo: kind === 'echo' ? o.answer : null,
        placeholder: kind === 'command' ? `Tell ${G.name} what to do, then Enter…` : kind === 'teach' ? 'from memory…' : 'type exactly that…',
        hint: o.hint || (kind === 'teach' ? (G.L.teachHint ? G.L.teachHint(typeof CJK !== 'undefined' && CJK.mode() === 'chars') : 'What’s the word? Type it from memory. Stuck? Tab = hint (first letter → more letters → the word).')
          : kind === 'command' && G.turn <= 2 ? G.L.cmdHint || 'Enter = send · Space at the hit = PERFECT · ↑ / ↓ = dodge' : ''),
      });
      renderFrames();
      if (kind !== 'command') UI.frames([]);
      facing(kind === 'teach' ? 'you' : kind === 'echo' && !A.coach.hidden ? 'coach' : 'foes');
      setMood(A.mimo, kind === 'teach' ? 'perk' : 'listen'); setMood(A.you, 'think');
      if (kind === 'command') { ST.shot('wide'); G.nextShh = G.t + 4 + Math.random() * 4; }
    });
  }
  async function askOrFlee(kind, o) { const r = await ask(kind, o); if (r && r.flee) throw FLEE; return r; }
  function finishPrompt(p, v) { G.pending = null; UI.promptHide(); setMood(A.you, 'idle'); if (A.mimo.mood === 'listen' || A.mimo.mood === 'perk') setMood(A.mimo, 'idle'); p.res(v); }
  const sameWords = (a, b) => { if (G.L.cjk && _.cj) return _.cj.same(a, b); const x = P.tokenize(a).map(t => t.n).join(' '), y = P.tokenize(b).map(t => t.n).join(' '); return x === y || (y.length >= 5 && !y.includes(' ') && P.near1(x, y)); };
  function teachForms(id) {
    if (G.L.cjk && _.cj) return _.cj.forms(G.L, id);       // (zh / ja: compared through CJK.canon: tones, kana or kanji, spaces don't matter)
    const L = G.L, [kind, key] = id.split('.');
    if (kind === 'p') {      // «izquierda», «la izquierda», «de la izquierda» · «links», «linke», «den linken» · «Mitte», «in der Mitte»
      const Q = L.positions && L.positions[key]; if (!Q) return [];
      const it = hasLEX() && LEX.item(id), more = (it && it.alt && it.alt[L.code]) || [];
      const de = L.code === 'de' ? [Q.adv, ...['e', 'en', 'er', 'es'].map(e => Q.stem + e)] : [Q.phrase, ...(Q.alt || [])];
      return [...new Set([Q.w, ...de, ...more])];
    }
    if (kind === 'v') return L.verbs[key] ? L.verbs[key].forms : [];
    if (kind === 'a') {
      if (L.code === 'de') return ['', 'e', 'en', 'er'].map(e => L.adjs[key].stem + e);
      const A_ = L.adjs[key]; return A_.forms.flatMap(f => [f.m, f.f]);
    }
    if (kind === 'n') {
      const p = L.parts[key] || L.species[key]; if (!p) return [];
      const arts = p.artSg ? ['el', 'un'] : { es: { m: ['el', 'un'], f: ['la', 'una'] }, pt: { m: ['o', 'um'], f: ['a', 'uma'] }, de: { m: ['der', 'den', 'ein'], f: ['die', 'eine'], n: ['das', 'ein'] } }[L.code][p.g] || [];
      const ws = [p.w].concat(p.alt || []);
      const out = ws.concat(ws.flatMap(w => arts.map(a => a + ' ' + w)));
      if (p.pl && p.pl !== p.w) out.push(p.pl, ({ es: { m: 'los', f: 'las' }, pt: { m: 'os', f: 'as' }, de: { m: 'die', f: 'die', n: 'die' } }[L.code][p.g] || '') + ' ' + p.pl);
      return out;
    }
    return [];
  }
  function teachCheck(p, text) {
    if (G.L.cjk && _.cj) return teachForms(p.id).some(f => _.cj.same(text, f));
    const n = P.tokenize(text).filter(t => !G.voc.has(t.n) && !G.L.I.voc.has(t.n)).map(t => t.n).join(' ');
    return teachForms(p.id).some(f => P.tokenize(f).map(t => t.n).join(' ') === n);
  }
  function maskHint(w, level) {
    if (level >= 3) return w;
    return w.split(' ').map(word => [...word].map((ch, i) => (i === 0 || (level === 2 && i % 2 === 0) ? ch : '_')).join(' ')).join('     ');
  }
  function giveHint() {
    const p = G.pending;
    if (!p || p.kind !== 'teach' || p.hints >= 3) return;
    p.hints++; G.stats.hints++;
    UI.hint((G.L.cjk && _.cj ? _.cj.mask(p.expect, p.hints) : maskHint(p.expect, p.hints)) + (p.hints === 1 ? '      ← Mimo will ask about this one again soon' : ''));
  }
  // "I don't know" (zh / ja: «?», «不知道», «わからない»): the word to teach, how to type the line to copy, or a whole command
  // to try, with its reading shown
  function idk(p) {
    G.stats.hints++;
    if (p.kind === 'teach') {
      p.hints = 3;
      const it = hasLEX() && LEX.item(p.id);
      UI.hint(`It’s «${p.expect}»${it && it.en ? ` (${it.en})` : ''}. Type it to teach ${G.name}.`, true, { ruby: 'always' });
      if (typeof CJK !== 'undefined') CJK.say(p.expect);
      return;
    }
    if (p.kind === 'echo') {
      const chars = typeof CJK !== 'undefined' && CJK.mode() === 'chars';
      UI.hint(`Type «${p.answer}»: ${CJK.roman(p.answer, { cap: false })}${chars ? ', then pick the characters (Space)' : ''}.`, true, { ruby: 'always' });
      return;
    }
    UI.hint(`Try: «${autoCommand()}»`, true, { ruby: 'always' });
    setMood(A.mimo, 'perk', 1.2);
  }
  // zh / ja: characters typed right count toward knowing them (their readings fade)
  function cjUsed(typed, src) {
    const now = _.cj ? _.cj.used(typed, src) : [];
    if (now.length) UI.toast(`✓ You know ${now.join(' ')} now: ${now.length > 1 ? 'their readings fade' : 'its reading fades'} away`, G.t, 2.6);
  }
  function submit(text) {
    const p = G.pending;
    if (!p || G.confirmOpen) return;
    text = String(text || '').trim();
    if (!text) return;
    if (G.L.idk && _.cj && _.cj.isIdk(text)) { idk(p); return; }
    const ms = Math.max(400, performance.now() - p.rt0);
    G.stats.outputs++;
    G.log.push(`[${p.kind}] ${text}`);
    if (p.kind === 'echo') {
      if (sameWords(text, p.answer)) { say(A.you, text, { cls: 'you', dur: 1.4 }); if (hasLEX() && p.id && LEX.item(p.id)) LEX.expose(p.id); if (G.L.cjk) cjUsed(text, p.answer); finishPrompt(p, text); }
      else { UI.hint(`Almost! Type exactly: ${p.answer}`, true); UI.nudge(); noteMistake({ kind: 'echo', typed: text, right: p.answer }); }
      return;
    }
    if (p.kind === 'teach') {
      say(A.you, text, { cls: 'you', dur: 1.4 });
      if (teachCheck(p, text)) {
        emit('teach-ok');
        if (G.L.cjk) cjUsed(text, p.expect);
        lexAttempt(p.id, { ok: true, hints: p.hints, ms, mode: 'teach' });
        G.stats.words.add(p.id);
        finishPrompt(p, text);
        return;
      }
      p.fails++;
      noteMistake({ kind: 'teach', typed: text, right: p.expect, id: p.id });
      emit('teach-wrong');
      setMood(A.mimo, 'confused', 1.4);
      say(A.mimo, G.lang === 'es' ? '¿…?' : '…?', { cls: 'mimo', dur: 1.2 });
      if (p.fails >= 2 && p.hints < p.fails - 1) giveHint();
      else UI.hint('Not quite. Try again, or press Tab for a hint.', true);
      UI.nudge();
      return;
    }
    // picky bees: a sentence about what one likes («¡Te gustan las rosas!») is said to the bees, not to Mimo (the Bloom Gardens)
    const lk = beeLike(text);
    if (lk) { lk.ms = ms; finishPrompt(p, lk); return; }
    const r = P.parse(text, ctx());
    if (!r.ok) { explainFail(r); UI.nudge(); return; }
    // eating: there has to be one in the bag, and room for the hearts it gives back (it isn't used up otherwise)
    const block = r.eat ? eatBlock(r) : null;
    if (block) { explainFail(Object.assign({}, r, { ok: false, reason: block, word: r.clauses[0].food.tok.raw })); UI.nudge(); return; }
    judge(r);
    r.ms = ms;
    if (G.L.cjk && r.kind === 'command') cjUsed(text, r.canon);
    finishPrompt(p, r);
  }
  const eatBlock = r => (!G.bag[r.clauses[0].food.id] ? 'noFood' : G.hearts >= G.maxHearts && !(_.items && _.items.fightFx && _.items.fightFx(r.clauses[0].food.id)) ? 'full' : null);     // (full: a food with a fight effect still goes down, js/pantry.js)
  // an example of eating, from the bag: «¡Come la manzana!»
  const eatExample = () => { const id = bestFood() || Object.keys(G.foods)[0]; return id ? eatSentence(id) : P.wrapS(G.L, showWord('v.eat')); };
  // naming the head or tail of a rolled-up armadillo: they're tucked in until it's pushed onto its back
  function tuckedPart(r) {
    if (r.reason !== 'nopart' && r.reason !== 'none') return false;
    if (!G.foes.some(f => f.species === 'armadillo' && f.alive && !f.gone && !f.flipped)) return false;
    const I = G.L.I, toks = P.tokenize(r.raw);
    if (!toks.some(t => P.look(I.parts, t.n))) return false;
    return r.reason === 'nopart' || toks.some(t => { const s = P.look(I.species, t.n); return s && s.key === 'armadillo'; });
  }
  function explainFail(r) {
    const L = G.L;
    if (_.tac && _.tac.explain && _.tac.explain(r)) return;     // (a battle skill's own «¿…?»: battle/tactics.js)
    if (tuckedPart(r)) r = Object.assign({}, r, { reason: 'tucked' });
    if (!['empty', 'unknownVerb', 'full', 'noFood'].includes(r.reason)) noteMistake({ kind: r.reason, typed: r.raw, word: r.word });
    switch (r.reason) {
      case 'tucked': setMood(A.mimo, 'confused', 1.6); mimoLine('curledHard', 2.2); UI.hint(`It’s rolled up: its head and tail are tucked in. ${knows('v.push') ? `Push it over first: «${pushExample()}».` : 'Something has to flip it over first.'}`, true); return;
      case 'pushPart': setMood(A.mimo, 'confused', 1.4); mimoLine('pushWhole', 1.6); UI.hint(`«${showWord('v.push')}» moves the whole creature, not one part. Say who: «${pushExample()}».`, true); return;
      case 'eatWhat': setMood(A.mimo, 'confused', 1.4); mimoLine('eatWhat', 1.6); UI.hint(bagFoods().length ? `Say what to eat, from the bag: «${eatExample()}».` : 'There’s no food in the bag.', true); return;
      case 'notFood': setMood(A.mimo, 'confused', 1.6); mimoLine('notFood', 1.8); UI.hint(`${G.name} only eats food from the bag${bagFoods().length ? `: «${eatExample()}»` : ''}.`, true); return;
      case 'foodVerb': setMood(A.mimo, 'confused', 1.4); mimoLine('noverb', 1.6); UI.hint(`Food is for eating: «${eatExample()}».`, true); return;
      case 'eatCombo': mimoLine('noverb', 1.6); UI.hint(`Eating takes the whole turn: say just «${eatExample()}».`, true); return;
      case 'noFood': {
        setMood(A.mimo, 'sad', 1.4); mimoLine('noFood', 1.6);
        const have = bagFoods().map(id => `«${foodThe(id)}» ×${G.bag[id]}`).join(', ');
        UI.hint(`There’s no «${r.word}» in the bag.${have ? ' You have: ' + have + '.' : ''}`, true); return;
      }
      case 'full': setMood(A.mimo, 'happy', 1.4); mimoLine('full', 1.6); UI.hint('Your hearts are full: save the food for later.', true); return;
    }
    switch (r.reason) {
      case 'empty': return;
      case 'unknown':
        setMood(A.mimo, 'confused', 1.6); say(A.mimo, L.unknown(r.word)[0], { cls: 'mimo', dur: 1.6 });
        UI.hint(`${G.name} doesn’t know “${r.word}”. Use words it knows.`, true); break;
      case 'unknownVerb':
        setMood(A.mimo, 'confused', 1.6); say(A.mimo, L.unknown(r.word)[0], { cls: 'mimo', dur: 1.6 });
        // you said it from memory, and that is teaching: Mimo picks it up for next time
        lexAttempt(r.id, { ok: true, ms: 4000, mode: 'command' });
        if (knows(r.id)) { learnPop(r.id); UI.hint(`“${r.word}” is new to ${G.name}. It’s learning it now: say it again!`, true); }
        else UI.hint(`${G.name} doesn’t know “${r.word}” yet.`, true);
        break;
      case 'noverb': setMood(A.mimo, 'confused', 1.4); mimoLine('noverb', 1.6); UI.hint(`Start with an action ${G.name} knows, like “${showWord('v.' + (knownVerbs()[0] || 'jump'))}”.`, true); break;
      case 'which': mimoLine('which', 1.6); UI.hint('Which one? More than one matches: add its color or size, or say where it is (left, middle, right).', true); break;
      case 'none': mimoLine('none', 1.6); UI.hint('There isn’t one like that here.', true); break;
      case 'nopart': mimoLine('nopart', 1.6); UI.hint('None of them has that part.', true); break;
      case 'throwWhat': mimoLine('throwWhat', 2); UI.hint('Say what to throw: «a pedrinha» or «o pedrão».', true); break;
      default: mimoLine('noverb', 1.6);
    }
  }
  const targetable = () => G.foes.filter(f => f.alive && !f.calmed && !f.gone);
  const ctx = () => ({ L: G.L, foes: targetable(), knows, voc: G.voc, shy: G.foes.find(f => f.alive && f.shy && !f.calmed) || null });
  function knownVerbs() { return Object.keys(G.L.verbs).map(k => (G.L.verbs[k].as || k)).filter((v, i, a) => a.indexOf(v) === i && knows('v.' + v)); }
  const attackVerbs = () => knownVerbs().filter(v => v !== 'eat');      // eating isn't a move
  // «¡Empuja al armadillo!», for the one in front of you (with its color when there are two)
  function pushExample(f) {
    f = f || targetable().find(x => x.species === 'armadillo' && !x.shy) || targetable().find(x => !x.shy);
    if (!f) return P.wrapS(G.L, showWord('v.push'));
    const d = descOpts(uniqueDesc(f) || []);
    if (knows('n.' + f.species)) d.noun = true;
    return P.sayAction(G.L, 'push', f, d);
  }

  // ------------------------------------------------------------ how precise a command must be (the tier), crits, repeats
  const featuresOf = f => [f.color, f.size].concat(G.lang === 'es' ? [...f.states] : []);
  // The shortest description Mimo knows that picks out f, e.g. ['red'] or ['red', 'big']; the
  // creature's name counts too, as '@moth', and where it stands as '#left' (descOpts turns it into { adjs, noun, pos }).
  // A position comes in only when nothing else tells f apart: «la rana de la izquierda» (among the frogs), «la
  // roja del medio», «la de la derecha». o: { noPos, assumePos (as if Mimo knew left / middle / right), prefer: 'color' }
  function uniqueDesc(f, foes = targetable(), o = {}) {
    const feats = featuresOf(f).filter(k => knows('a.' + k));
    const kind = knows('n.' + f.species) ? '@' + f.species : null;
    const has = (x, k) => (k[0] === '@' ? x.species === k.slice(1) : P.hasTrait(x, k));
    const only = keys => foes.filter(x => keys.every(k => has(x, k))).length === 1;
    for (const k of feats) if (only([k])) return [k];
    if (kind && only([kind])) return [kind];
    const all = kind ? feats.concat([kind]) : feats;
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (only([all[i], all[j]])) return [all[i], all[j]];
    if (foes.length === 1 && all.length) return [all[0]];
    if (o.noPos || foes.length < 2 || !foes.includes(f)) return null;
    // where it stands, among the ones a shorter description leaves (the parser picks the same way: P.posPick)
    const posOK = k => o.assumePos || knows('p.' + k);
    const bases = (kind ? [[kind]] : []).concat([[]], feats.map(k => (kind ? [kind, k] : [k])));
    if (o.prefer === 'color') bases.sort((a, b) => b.length - a.length);
    for (const base of bases) {
      const group = foes.filter(x => base.every(k => has(x, k)));
      if (group.length < 2 || !group.includes(f)) continue;
      const keys = P.posKeysOf(f, group, foes);
      for (const k of ['left', 'right', 'middle']) if (keys.has(k) && posOK(k) && P.posPick(group, k, foes) === f) return base.concat(['#' + k]);
    }
    return null;
  }
  const descOpts = d => ({ adjs: (d || []).filter(k => k[0] !== '@' && k[0] !== '#'), noun: (d || []).some(k => k[0] === '@'), pos: ((d || []).find(k => k[0] === '#') || '').slice(1) || null });
  // f looks like another one, so only where it stands tells it apart: its position word ('left' …), or null
  const posNeeded = (f, foes = targetable()) => {
    if (uniqueDesc(f, foes, { noPos: true })) return null;
    const d = uniqueDesc(f, foes, { assumePos: true }), k = d && d.find(x => x[0] === '#');
    return k ? k.slice(1) : null;
  };
  // the parts worth aiming at: on a beetle, anything but its hard shell
  const softParts = f => (f.parts || []).filter(p => !(f.species === 'beetle' && p === 'shell') && knows('n.' + p));
  function maxRung(f) {
    let r = 1;
    if (uniqueDesc(f)) r = 2;
    if ((f.species === 'hushbig' || f.species === 'beetle') && softParts(f).length) r = 3;
    return r;
  }
  // (practice moves it: colors, positions and mixed ask you to say who whatever your level; verbs never more than a verb)
  const needOf = f => Math.max(1, Math.min(Math.max(G.tier, G.needFloor || 1), maxRung(f), G.needCap || 3));
  const effectiveNeed = () => targetable().filter(f => !f.shy).reduce((m, f) => Math.max(m, needOf(f)), 1);
  function suggestion(c) {
    const f = c.target, o = {};
    if (c.need >= 3 && (f.species === 'hushbig' || f.species === 'beetle')) {
      o.part = f.weakShown ? f.weak : softParts(f)[0];
      if (!o.part) return null;
    } else { const d = uniqueDesc(f); if (!d) return null; Object.assign(o, descOpts(d)); }
    if (c.verb === 'throw') o.obj = c.obj;
    if (c.verb === 'attack') o.adv = c.adv.map(a => a.show);
    return P.sayAction(G.L, c.verb === 'grab' ? 'attack' : c.verb, f, o);
  }
  function judge(r) {
    if (r.kind === 'talk' || r.kind === 'tac') { r.grade = gradeOf(r); return r; }     // ('tac': a battle skill's whole turn, battle/tactics.js)
    if (r.kind === 'like') return r;          // (a picky bee: graded by beeLike)
    if (r.kind !== 'command') return r;
    for (const c of r.clauses) {
      // eating has no target: it's graded on the food's article, case and spelling alone
      if (c.verb === 'eat') { Object.assign(c, { precision: 1, said: 1, need: 0, gap: 0, weakHit: false, armored: false, crit: false, sneak: false, suggest: null }); continue; }
      // a song has no target (it reaches everyone): graded on the verb alone
      if (c.verb === 'sing' || c.verb === 'climb' || c.verb === 'blow' || c.verb === 'call' || c.verb === 'light' || c.verb === 'dig') { Object.assign(c, { precision: 1, said: 1, need: 0, gap: 0, weakHit: false, armored: false, crit: false, sneak: false, suggest: null, flip: false, curled: false, belly: false, bounce: false, open: false, clang: false, behind: false, through: false }); continue; }   // (a climb picks its own: the Bloom Gardens; a call brings the gulls: Port Brisa; light: the Gray Marsh, marsh_battle.js)
      const f = c.target;
      c.precision = c.partKey ? 3 : c.auto ? 1 : 2;          // what Mimo understood
      c.said = c.part ? 3 : c.desc && c.desc.described ? 2 : 1;   // what you said (a word Mimo hasn't learned yet still counts)
      c.need = needOf(f);
      c.gap = Math.max(0, c.need - c.precision);
      c.weakHit = !!(c.partKey && f.weak === c.partKey && f.weakShown);
      // a beetle's shell takes the hit unless you name a soft part
      const shellHit = c.partKey === 'shell' || (f.species === 'beetle' && !c.partKey);
      c.armored = !!(shellHit && !c.weakHit);
      // the Portuguese twist: only «o pedrão» cracks the shell
      if (G.lang === 'pt' && shellHit) {
        const heavy = c.verb === 'throw' && c.obj === 'heavy';
        c.armored = !heavy; if (!heavy) c.weakHit = false;
      }
      // the armadillo: curled up it shrugs off hits (⅓) and a push flips it over; on its back its belly takes ×2
      c.flip = c.curled = c.belly = c.heavy = false;
      if (f.species === 'armadillo') {
        if (f.flipped) c.belly = true;
        else if (c.verb === 'push' && f.isBoss && !(f.dizzy > 0)) c.heavy = c.curled = true;     // (the giant one: too heavy, until it's dizzy)
        else if (c.verb === 'push') c.flip = true;
        else c.curled = true;
      }
      // the colonel: behind his closed husk cape a hit just bounces off; with the cape thrown open he takes ×1.5
      c.bounce = f.species === 'colonel' && !f.capeOpen;
      c.open = f.species === 'colonel' && !!f.capeOpen;
      c.crit =!!(G.glow && G.glow.foe === f && c.words.includes(G.glow.id) && (!G.glow.part || G.glow.part === c.partKey));
      c.sneak = f.states.has('asleep');
      // a crab (Port Brisa): shell and claws face you, so a hit clangs off; said from behind («por detrás») it lands ×2
      c.clang = c.behind = false;
      if (f.species === 'crab') { if (r.behind || f.turned) c.sneak = c.behind = true; else c.clang = true; }
      c.suggest = c.gap > 0 ? suggestion(c) : null;
    }
    if (_.tac && _.tac.judge) _.tac.judge(r);  // (battle skills: tells, descriptions, combos: battle/tactics.js)
    r.grade = gradeOf(r);
    for (const c of r.clauses) c.power = r.grade.mult;
    r.key = P.tokenize(r.canon).map(t => t.n).join(' ');
    r.repeat = !r.eat && G.lastKey === r.key && varietyPossible();     // (foes don't block you eating)
    r.echo = !r.eat && echoes(r.key);                                  // echo bats: the same thing again comes straight back at you (below)
    if (r.echo) r.repeat = false;
    return r;
  }
  // The grade of a command, from what the parser reported. Slips: each kind of grammar slip counts
  // once (a big one twice), each misspelled word once, a missing article once, and leaving out the
  // target when one is needed twice. 0 → S (or A with a style tweak, or no part named where one would
  // be ideal; an accent is only a tip, P6a, unless it makes another word: «salto» for «saltó»), 1 → B, 2 → C, 3+ → D.
  // Two or more look the same and the command didn't say which (c.ambiguous): like a missing target, twice,
  // when your level asks you to say who (Mimo has to guess); only a note (A) when a verb would have been enough.
  function gradeOf(r) {
    let slips = 0, which = null;
    const minor = [], major = [], soft = [];
    const units = r.kind === 'command' ? r.clauses : [{ errors: r.errors || [], fixes: r.fixes || [], soft: r.soft }];
    for (const c of units) {
      for (const k of new Set(c.errors.map(e => e.kind))) { if (P.MAJOR.has(k)) { slips += 2; major.push(k); } else { slips += 1; minor.push(k); } }
      const typos = c.fixes.filter(k => k === 'spelling').length;
      if (typos) { slips += typos; minor.push('spelling'); }
      if (c.fixes.includes('article')) { slips += 1; minor.push('article'); }
      // (es / pt / de: an accent is a tip, never a grade, P6a, accents.js; but «salto» for «saltó» in the Past is another word: the
      // A stays, 'accentWord'. zh: 'accent' is a tone typed wrong, still an A)
      if (c.fixes.includes('accentWord')) soft.push('accentWord');
      else if (c.fixes.includes('accent') && !['es', 'pt', 'de'].includes(G.L && G.L.code)) soft.push('accent');
      if (c.fixes.includes('style') || c.fixes.includes('twist')) soft.push('style');
      if (c.need && c.said < c.need) { if (c.said === 1) { slips += 2; major.push('target'); } else soft.push('part'); }
      if (c.ambiguous && !c.ambiguous.untaught) { which = whichText(c.ambiguous.n); if (c.need >= 2) { slips += 2; major.unshift('which'); } else soft.unshift('which'); }
      for (const k of c.soft || []) soft.push(k);     // (a battle skill's notes, battle/tactics.js: L.soft names them)
    }
    const txt = k => (k === 'which' ? which : (G.L.slip && G.L.slip[k]) || SLIP[k] || 'Slip');     // (zh / ja name their own slips: «的 slip», «を slip»)
    const letter = slips === 0 ? (soft.length ? 'A' : 'S') : slips === 1 ? 'B' : slips === 2 ? 'C' : 'D';
    // (the accent tip: the words you typed that are only an accent away from the sentence said right)
    const ad = typeof ACCENTS !== 'undefined' && r.raw && r.canon && units.some(c => (c.fixes || []).some(k => k === 'accent' || k === 'accentWord')) ? ACCENTS.diff(r.raw, r.canon, G.L && G.L.code) : null;
    const tip = ad && !soft.includes('accentWord') ? ad.tip : '', aw = ad && ad.pairs.length ? `«${ad.pairs[0][0]}» is another word; with its accent: «${ad.pairs[0][1]}»` : '';
    const reason = letter === 'S' ? 'Perfect sentence!' + (tip ? ' · ' + tip : '') : letter === 'A' ? (soft[0] === 'which' ? which : soft[0] === 'accentWord' && aw ? aw : (G.L.soft && G.L.soft[soft[0]]) || SOFT[soft[0]]) : letter === 'B' ? txt(minor[0])
      : letter === 'C' ? (major.length ? txt(major[0]) : 'Two slips') : 'Several slips';
    return { letter, mult: GRADES[letter].mult, reason, slips, tip };
  }
  const varietyPossible = () => attackVerbs().length >= 2 || targetable().some(f => uniqueDesc(f));
  function foeName(f) {
    if (f.species === 'hushbig') return 'the big one';
    if (f.species === 'colonel') return 'the colonel';
    const fight =targetable().filter(x => !x.shy), n = fight.length, mixed = new Set(fight.map(x => x.species)).size > 1 || f.species !== 'hushling';
    const pk = posNeeded(f);   // look-alikes: where it stands («the red small frog on the left»)
    return `the ${COLOR_EN[f.color] || ''}${n > 1 || G.tier >= 2 ? ' ' + f.size : ''} ${mixed ? KIND_EN[f.species] || 'one' : 'one'}${pk ? ' ' + POS_EN[pk] : ''}`.replace(/\s+/g, ' ');     // (a boss's own kind isn't listed: «the red big one»)
  }
  function preview(text) {
    emit('type');
    earTwitch();
    const p = G.pending;
    if (!p || p.kind !== 'command') { UI.preview(''); return; }
    if (!text.trim()) { UI.preview(''); return; }
    { const lk = beeLike(text); if (lk) { UI.preview(likePreview(lk)); return; } }     // (to a picky bee)
    const r = P.parse(text, ctx());
    if (!r.ok) {
      const FAIL = { which: 'which one? add a color, a size or where it is', none: 'no one like that here', pushPart: 'push the whole creature: say who', notFood: 'that isn’t food!',
        eatWhat: 'eat what? name the food', foodVerb: 'food is for eating', eatCombo: 'eating takes the whole turn' };
      const msg = r.reason === 'unknown' ? `<span class="warn">doesn’t know “${UI.esc(r.word)}”</span>`
        : r.reason === 'unknownVerb' ? `<span class="warn">doesn’t know “${UI.esc(r.word)}” yet</span>`
          : tuckedPart(r) ? '<span class="warn">it’s rolled up: its head and tail are tucked in</span>'
            : FAIL[r.reason] ? `<span class="warn">${FAIL[r.reason]}</span>` : `<span class="dim">${UI.esc(G.name)} is listening…</span>`;
      UI.preview(msg);
      return;
    }
    if (r.kind === 'answer' || r.kind === 'miss') { UI.preview(r.previewHtml || ''); return; }     // (an answer to a time boss's question, not a command: its answerAsk)
    if (r.kind === 'talk') { judge(r); UI.preview(`<b>${UI.esc(G.name)} understood:</b> talk to the shy one ${gradePill(r.grade)}`); return; }
    if (r.kind === 'tac') { judge(r); UI.preview(`<b>${UI.esc(G.name)} understood:</b> ${r.tacPreview || 'a whole-turn sentence'} ${gradePill(r.grade)}`); return; }     // (talking them down, team orders: battle/tactics.js)
    judge(r);
    if (r.eat) {
      const c = r.clauses[0], f = G.foods[c.food.id], have = G.bag[c.food.id] || 0;
      const fx = _.items && _.items.fightFx ? _.items.fightFx(c.food.id) : null;     // (what it does besides: js/pantry.js)
      const what = !have ? '<span class="warn"> · there’s none in the bag</span>' : G.hearts >= G.maxHearts && !fx ? '<span class="warn"> · your hearts are full</span>'
        : `<span class="bonus">${G.hearts < G.maxHearts ? `+${Math.min(f.heal, G.maxHearts - G.hearts)} ♥` : ''}${fx ? `${G.hearts < G.maxHearts ? ' · ' : ''}${UI.esc(fx)}` : ''}</span>`;
      let html = `<b>${UI.esc(G.name)} understood:</b> eat → the ${UI.esc(f.en)}${what} ${gradePill(r.grade)}`;
      if (r.untaught.length) html += ` <span class="warn">· new word: “${UI.esc(r.untaught[0].raw)}”</span>`;
      UI.preview(html);
      return;
    }
    const parts = r.clauses.map(c => {
      if (c.verb === 'sing') return `sing → everyone${targetable().some(f => f.species === 'bat') ? ' <span class="bonus">bats get dizzy</span>' : ''}`;
      if (c.verb === 'climb') { const fl = targetable().find(f => f.floating && !f.down && !f.shy); return `climb → ${fl ? foeName(fl) : `${G.name} picks one`} <span class="bonus">from above${fl ? ': knocks it down' : ''}</span>`; }
      if (c.verb === 'blow') { const sb = targetable().some(f => f.species === 'snowball'), fl = targetable().some(f => f.floating && !f.down); return `blow → everyone${sb || fl ? ` <span class="bonus">${[sb ? 'snowballs shrink' : '', fl ? 'fliers fall' : ''].filter(Boolean).join(', ')}</span>` : ''}`; }
      if (c.verb === 'call') { const fl = targetable().some(f => f.floating && !f.down); return `call → the gulls dive at everyone${fl ? ' <span class="bonus">fliers fall</span>' : ''}`; }
      if (_.marsh && _.marsh.preview) { const s = _.marsh.preview(c); if (s) return s; }     // (light, and a shadow whose kind you can't see: the Gray Marsh, marsh_battle.js)
      if (_.ruins && _.ruins.preview) { const s = _.ruins.preview(c); if (s) return s; }     // (dig, and a worm under the sand: the Sunken Ruins, ruins_battle.js)
      const who = c.auto && c.multi ? `${G.name} picks ${foeName(c.target)}` : c.ambiguous ? `${G.name} has to guess: ${foeName(c.target)}?` : foeName(c.target);
      const partEn = c.partKey ? `’s ${G.L.parts[c.partKey].en}${c.partPl || (c.part && c.part.pl) ? 's' : ''}` : '';
      const obj = c.verb === 'throw' ? ` (${{ light: 'pebble', medium: 'stone', heavy: 'big rock' }[c.obj]})` : '';
      let bonus = '';
      if (c.crit) bonus += '<span class="bonus">★ gold word ×2</span>';
      if (c.weakHit) bonus += '<span class="bonus">✦ weak spot ×2</span>';
      if (c.sneak) bonus += '<span class="bonus">surprise ×2</span>';
      if (c.charge) bonus += `<span class="bonus">${'⚡'.repeat(c.charge)}</span>`;
      if (c.armored) bonus += `<span class="warn"> hard shell ½${G.lang === 'pt' ? ': only «o pedrão» cracks it' : c.target.species === 'beetle' ? ': name its head' : ''}</span>`;
      if (c.flip) bonus += '<span class="bonus">flips it over!</span>';
      if (c.belly) bonus += '<span class="bonus">✦ belly ×2</span>';
      if (c.curled) bonus += `<span class="warn"> curled up ⅓${knows('v.push') ? `: «${UI.esc(showWord('v.push'))}» it over first` : ''}</span>`;
      if ((c.verb === 'hit' || c.verb === 'push') && c.target.floating && !c.partKey) bonus += `<span class="warn"> it floats: a ${c.verb} can’t reach</span>`;
      if (c.partKey === 'wing' && c.target.floating) bonus += '<span class="bonus">knocks it down</span>';
      if (c.bounce) bonus += '<span class="warn"> his cape is closed: it bounces off! Beat his soldiers first</span>';
      if (c.clang) bonus += `<span class="warn"> its shell faces you: it clangs off! Say where: «${UI.esc((G.L.behindWord) || 'from behind')}»</span>`;
      if (c.behind) bonus += '<span class="bonus">from behind ×2</span>';
      if (c.open) bonus += '<span class="bonus">cape open ×1.5</span>';
      if (c.ambiguous && !c.ambiguous.untaught) bonus += `<span class="warn"> · which one? say where: ${c.ambiguous.n >= 3 ? 'left, middle or right' : 'left or right'}</span>`;
      return `${VERB_EN[c.verb]}${obj} → ${who}${partEn}${bonus}`;
    });
    let html = `<b>${UI.esc(G.name)} understood:</b> ${parts.join(' <b>+</b> ')} ${gradePill(r.grade)}`;
    if (r.repeat) html += ' <span class="warn">· same as last turn: they’ll block it!</span>';
    if (r.echo) html += ` <span class="warn">· you just said that: the bat will echo it right back at you!</span>`;
    if (r.untaught.length) html += ` <span class="warn">· new word: “${UI.esc(r.untaught[0].raw)}”</span>`;
    UI.preview(html);
  }
  function earTwitch() { const c = ST.S.cast && ST.S.cast.mimo; if (!c) return; const i = Math.random() < 0.5 ? 0 : 1; c.ears[i].v -= 2.5 + Math.random() * 2; }
  // the grade as it stands while you type: «S ×1.25», «B ×0.85 Spelling slip»
  const gradePill = g => (g ? `<span class="pw g${g.letter}">${g.letter} ×${g.mult}</span>${g.letter !== 'S' ? ` <span class="dim">${UI.esc(g.reason)}</span>` : g.tip ? ` <span class="dim">${UI.esc(g.tip)}</span>` : ''}` : '');     // (an S's accent tip, P6a)

  // ------------------------------------------------------------ frames and scaffolds
  function setFrames(keys) { G.frames = keys.filter(k => G.L.frames[k]).map(k => Object.assign({ uses: 2 }, G.L.frames[k])); renderFrames(); }
  function renderFrames() { UI.frames(G.frames.filter(f => f.uses > 0).map(f => f.text)); }
  // a frame made on the spot, like «¡Come la manzana!» from what's in the bag
  function addFrame(fr) { G.frames = G.frames.filter(x => x.pat !== fr.pat || x.text !== fr.text); G.frames.unshift(Object.assign({ uses: 2 }, fr)); renderFrames(); }
  function frameUse(patterns) { for (const f of G.frames) if (f.uses > 0 && patterns.includes(f.pat)) f.uses--; }
  function dodgeTip() {
    const vt = _.react && _.react.tip ? _.react.tip() : null; if (vt) return vt;     // (dodging out loud: battle/react.js)
    const w = G.L.dodgeWords(G.tier);
    return `Foes shout where they’ll hit: «${w.high}» = high → <kbd>↓</kbd> duck · «${w.low}» = low → <kbd>↑</kbd> jump. Press it right as the hit lands.`;
  }
  function dodgeHint(on) {
    if (_.react && _.react.hint && _.react.hint(on)) return;     // (the reaction box instead: battle/react.js)
    if (!on) { UI.dodge(null); return; }
    const w = G.L.dodgeWords(G.tier);
    UI.dodge(G.turn <= 3 || G.tutorial
      ? `<span><q>${UI.esc(w.high)}</q> → <kbd>↓</kbd> duck</span><span><q>${UI.esc(w.low)}</q> → <kbd>↑</kbd> jump</span>`
      : '<span>Listen… <kbd>↑</kbd> jump · <kbd>↓</kbd> duck</span>');
  }
  // an example at the rung you're asked for, made from the foes in front of you, so its gender is
  // right («¡Salta sobre la roja!» with a red moth); the fixed one from lang.js otherwise
  function rungExample(need) {
    const fight = targetable().filter(x => !x.shy && !x.noAuto).sort((a, b) => needOf(b) - needOf(a)), f = fight[0], verbs = attackVerbs();
    const verb = verbs.includes('jump') ? 'jump' : verbs[0];
    if (!f || !verb || verb === 'attack' || verb === 'throw') return G.L.examples[need];
    if (need === 2) { const d = uniqueDesc(f); if (d) return P.sayAction(G.L, verb, f, descOpts(d)); }
    if (need === 3) {
      const part = f.species === 'hushbig' || f.species === 'beetle' ? (f.weakShown ? f.weak : softParts(f)[0]) : null;
      if (part) return P.sayAction(G.L, verbs.includes('hit') ? 'hit' : verb, f, { part });
    }
    return G.L.examples[need];
  }
  function rungPill() {
    if (G.tutorial) return;
    const need = effectiveNeed(), ex = rungExample(need);
    const what = need === 1 ? 'a verb is enough for an S' : need === 2 ? 'say who for an S' : 'aim at a part for an S';
    UI.rung(`Rung ${need} · ${what}: <b>«${UI.esc(ex)}»</b>`);
  }
  function setupScaffolds() {
    rungPill();
    const need = effectiveNeed(), keys = [], tips = [];
    const verbs = knownVerbs(), foes = targetable();
    // the generic frames say «el ___» / «den ___»: only for masculine foes (moths have their own frame, so do armadillos in German: «das ___ Gürteltier»)
    // (the colonel behind his closed cape isn't one to aim at)
    const anyM = foes.filter(f => !f.shy && !f.noAuto).some(f => genderOf(f) === 'm');
    if (need === 2) { if (anyM) { if (verbs.includes('jump')) keys.push('jumpT'); if (verbs.includes('hit')) keys.push('hitT'); } tips.push(G.L.tips.target); }
    if (need === 3) { keys.push('partT'); tips.push(G.L.tips.parts + ' The glowing part is the weak spot (×2); it moves after each weak hit.'); }
    if (G.lang === 'es' && foes.some(f => f.states.has('asleep')) && knows('a.asleep')) { keys.push('rel'); tips.unshift(G.L.tips.twist); }
    if (G.lang === 'pt' && verbs.includes('throw')) { keys.push('pebble', 'boulder'); tips.unshift(G.L.tips.twist); }
    if (G.lang === 'de' && verbs.includes('attack')) { keys.push('bracket'); tips.unshift(G.L.tips.twist); }
    if (G.L.cjk && ST.S.stones.length && verbs.includes('hit')) { keys.push('instrT'); tips.push(G.L.tips.twist); }      // (zh / ja: «用石头打…», «石で…を打って»)
    // moths float (jump, or knock them down by the wings); beetles wear a hard shell (aim for the head);
    // armadillos curl up (push one over, then go for the belly)
    if (foes.some(f => f.species === 'armadillo' && !f.shy)) { if (verbs.includes('push')) keys.unshift('pushT'); tips.unshift(G.arma && G.L.tips.armaBoss ? G.L.tips.armaBoss : G.L.tips.armadillo); }     // (the giant one: push it when it's dizzy)
    if (foes.some(f => f.species === 'beetle' && !f.shy)) { if (verbs.includes('hit')) keys.unshift('beetleT'); tips.unshift(G.L.tips.beetle); }
    if (foes.some(f => f.species === 'moth' && !f.shy)) { if (verbs.includes('jump')) keys.unshift('mothT'); if (verbs.includes('hit')) keys.push('wingT'); tips.unshift(G.L.tips.moth); }
    // frogs hop to other lily pads after every turn
    const frogs = foes.filter(f => f.species === 'frog' && !f.shy);
    if (frogs.length) { if (verbs.includes('jump') && G.L.frames.frogT) keys.unshift('frogT'); if (frogs.length > 1) tips.unshift(G.L.tips.frog); }
    // echo bats copy you (vary every command); a song reaches everyone (the Quarry Caves)
    if (foes.some(f => f.species === 'bat' && !f.shy)) { if (verbs.includes('hit') && G.L.frames.batT) keys.unshift('batT'); if (G.L.tips.bat) tips.unshift(G.L.tips.bat); }
    if (verbs.includes('sing') && G.L.frames.singT) keys.push('singT');
    // picky bees: tell one what it likes (the Bloom Gardens); climb reaches the ones that fly
    if (foes.some(f => f.species === 'bee' && !f.shy)) { if (G.L.frames.likeT) keys.unshift('likeT'); if (G.L.tips.bee) tips.unshift(G.L.tips.bee); }
    if (verbs.includes('climb') && G.L.frames.climbT) { keys.push('climbT'); if (foes.some(f => f.floating) && G.L.tips.climb) tips.push(G.L.tips.climb); }
    // snowballs grow every round you don't hit them (the Frost Peaks); blow knocks the snow off them all
    if (foes.some(f => f.species === 'snowball' && !f.shy)) { if (verbs.includes('hit') && G.L.frames.snowT) keys.unshift('snowT'); if (G.L.tips.snowball) tips.unshift(G.L.tips.snowball); }
    if (verbs.includes('blow') && G.L.frames.blowT) { keys.push('blowT'); if (G.L.tips.blow) tips.push(G.L.tips.blow); }
    // crabs walk sideways, shell and claws to the front: hit them from behind, and say so (Port Brisa); a call brings the gulls
    if (foes.some(f => f.species === 'crab' && !f.shy)) { if (G.L.frames.behindT) keys.unshift('behindT'); if (G.L.tips.crab) tips.unshift(G.L.tips.crab); }
    if (verbs.includes('call') && G.L.frames.callT) { keys.push('callT'); if (G.L.tips.call) tips.push(G.L.tips.call); }
    // sand worms burrow: hit them when they're up, or dig them out (the Sunken Ruins: ruins_battle.js)
    if (foes.some(f => f.species === 'worm' && !f.shy)) { if (verbs.includes('dig') && G.L.frames.digT) keys.unshift('digT'); if (G.L.tips.worm) tips.unshift(G.L.tips.worm); }
    else if (verbs.includes('dig') && G.L.frames.digT) { keys.push('digT'); if (G.L.tips.dig) tips.push(G.L.tips.dig); }
    // practice dummies and kernel soldiers: the kind's name with the color to fill in; the colonel: hit him while his
    // cape is open (closed, the tip says how the fight goes); popcorn: the gender changed («la palomita»)
    const has = k => foes.some(f => f.species === k && !f.shy);
    if (need >= 2 && verbs.includes('hit')) { if (has('dummy')) keys.unshift('dummyT'); if (has('kernel')) keys.unshift('kernelT'); }
    if (has('popcorn') && verbs.includes('jump')) keys.unshift('popT');
    const col = foes.find(f => f.species === 'colonel');
    if (col && col.capeOpen && verbs.includes('hit')) keys.unshift('bossT');
    if (foes.some(f => f.shy)) { keys.push('talk'); tips.unshift(G.L.tips.shy); }
    // look-alikes: say where («de la izquierda · del medio · de la derecha», and a whole sentence)
    const ex = need >= 2 ? posExample() : null;
    if (ex) { keys.unshift('posT'); tips.unshift(G.L.tips.position.replace('{ex}', UI.esc(ex)).replace(/([.!?…。！？]\s*)([»“」”])\./g, '$1$2')); }
    if (varietyPossible()) tips.push('Foes catch on: the exact same command twice in a row gets blocked. A <b>gold</b> word is due for review: use it for a critical hit (×2).');
    // the Corn Society: how the fight goes comes first, until his cape has opened once; on the hot floor, the popcorn's new gender
    if (col && !col.capeOpen && !(G.boss && G.boss.opened)) tips.unshift(G.L.tips.boss);
    if (has('popcorn') && !(col && col.capeOpen)) tips.unshift(G.L.tips.popcorn);
    if (_.marsh && _.marsh.scaffolds) _.marsh.scaffolds(foes, keys, tips, verbs);     // (shadows and light, team orders: the Gray Marsh, marsh_battle.js)
    setFrames(keys);
    if (ex) addFrame({ text: ex, pat: 'position' });
    G.baseTip = tips[0] || null;
    UI.tip(G.baseTip);
  }
  // «¡Salta sobre la rana de la izquierda!»: for the one on the left of the look-alikes, if Mimo knows where-words
  function posExample(f) {
    const foes = targetable(), twins = foes.filter(x => !x.shy && posNeeded(x, foes) && knows('p.' + posNeeded(x, foes)));
    f = f || P.order(twins)[0];
    if (!f) return null;
    const verbs = attackVerbs(), verb = verbs.includes('jump') || !verbs.includes('hit') ? 'jump' : 'hit';
    return P.sayAction(G.L, verb, f, Object.assign(descOpts(uniqueDesc(f, foes, { assumePos: true }) || []), { posStyle: 'adj' }));
  }

  // ------------------------------------------------------------ labels, glow, weak points
  function labelHTML(f) {
    if (_.marsh && _.marsh.label && f.spec && f.spec.shadow && !f.lit) return _.marsh.label(f);     // (a shadow: no name, no color, until it's lit: marsh_battle.js)
    const L = G.L, g = L.species[f.species].g, esc = UI.esc;
    const glowId = G.glow && G.glow.foe === f && !G.glow.part ? G.glow.id : null;
    // A word you know well (tier 3) is a little review on the label: its first letter and a dotted line, «r…», to say from memory.
    // (It used to be a bare «?», which looked like Mimo had forgotten the word: playtest 5. zh / ja keep the whole word.)
    const quiz = id => G.tier >= 3 && !L.cjk && knownWell(id) && glowId !== id;
    const peek = w => `<span class="rv" title="You know this one: say it from memory">${esc(String(w).charAt(0))}…</span>`;
    const chip = (html, id, cls = '') => `<span class="bt-chip ${cls} ${glowId === id ? 'glow' : ''}">${html}</span>`;
    // the name with its article, so you see the gender you need for agreement: «la polilla», «der Käfer»
    const the = L.cjk ? ['', theWord(f.species)] : theWord(f.species).split(' ');
    const parts = [chip(`<i>${esc(the.slice(0, -1).join(' '))}</i> ${esc(the[the.length - 1])}`, 'n.' + f.species, 'name')];
    const cid = 'a.' + f.color, sw = `<span class="sw" style="background:${UI.COL[f.color]}"></span>`;
    if (L.adjs[f.color]) parts.push(chip(quiz(cid) ? sw + peek(adjShow(f.color, g)) : sw + esc(adjShow(f.color, g)), cid, quiz(cid) ? 'quiz' : ''));   // (not the colonel: no color word)
    const zid = 'a.' + f.size;
    parts.push(chip(quiz(zid) ? peek(adjShow(f.size, g)) : esc(adjShow(f.size, g)), zid, quiz(zid) ? 'quiz' : ''));
    for (const s of ['asleep', 'angry']) if (f.states.has(s)) parts.push(chip(esc((L.stateLbl || STATE_LBL[G.lang])[s][g === 'f' ? 1 : 0]), 'a.' + s, 'state'));
    if (f.floating) parts.push(chip(esc(L.labels.floating), 'float', 'state'));
    else if (f.down) parts.push(chip(esc(L.labels.down), 'down', 'state down'));
    else if (f.flipped) parts.push(chip(esc(L.labels.back), 'back', 'state back'));   // an armadillo on its back: «boca arriba»
    else if (f.dizzy > 0 && L.labels.dizzy) parts.push(chip(esc(L.labels.dizzy), 'dizzy', 'state back'));   // the giant armadillo, dizzy: «mareado» (push it now!)
    if (f.species === 'colonel') parts.push(chip(esc(f.capeOpen ? L.labels.capeOpen : L.labels.capeShut), 'cape', 'state' + (f.capeOpen ? ' back' : '')));   // «capa cerrada» / «capa abierta»
    if (f.shy) parts.push(chip(esc((g === 'f' && L.labelsF && L.labelsF.shy) || L.labels.shy), 'shy', 'state'));
    const hp = f.shy ? '' : f.maxHp > 12
      ? `<div class="bt-hpbar"><i style="width:${Math.round((100 * f.hp) / f.maxHp)}%"></i><span>${f.hp}</span></div>`
      : `<div class="bt-hp">${'<i></i>'.repeat(Math.max(0, f.hp))}${'<i class="gone"></i>'.repeat(Math.max(0, f.maxHp - f.hp))}</div>`;
    return `<div class="bt-chips">${parts.join('')}</div>${hp}`;
  }
  // look-alikes: where each one stands, on a little tag on the water in front of it (◀ izquierda · ● medio · derecha ▶),
  // a quiz like the colors at tier 3, gold when it's the word due for review
  function posTag(f) {
    const id = `pos:${f.id}`, pk = f.alive && !f.gone && !f.calmed && !f.shy && !f.hidden ? posNeeded(f) : null;
    if (!pk) { UI.tagRemove(id); return; }
    const pid = 'p.' + pk, glowId = G.glow && G.glow.foe === f && !G.glow.part ? G.glow.id : null;
    const w = G.tier >= 3 && !G.L.cjk && knownWell(pid) && glowId !== pid ? UI.esc(String(showWord(pid)).charAt(0)) + '…' : UI.esc(showWord(pid));     // (a review: «i…», never a bare «?»)
    UI.tag(id, () => new THREE.Vector3(f.hx, 0, f.hz + (f.radius || 0.4) + 0.5), pk === 'left' ? '◀ ' + w : pk === 'right' ? w + ' ▶' : '● ' + w, 'pos' + (glowId === pid ? ' glow' : ''));
  }
  function refreshLabels() {
    for (const f of G.foes) {
      posTag(f);
      if (!f.alive || f.gone || f.calmed) { UI.labelRemove(f); UI.tagRemove(`part:${f.id}:`); continue; }
      UI.label(f, labelHTML(f));
      if (f.species === 'hushbig' || f.species === 'beetle' || f.species === 'moth') {
        for (const p of f.parts) {
          // on the big one, every part; on a beetle, its weak spot; on a moth, its wings (in the plural: «las alas»)
          const worth = f.species === 'hushbig' || (f.species === 'beetle' ? p === f.weak : p === 'wing');
          const show = worth && (knows('n.' + p) || G.showWeak || UI.U.showEN);
          const id = `part:${f.id}:${p}`;
          if (!show) { UI.tagRemove(id); continue; }
          const cls = f.weakShown && f.weak === p ? 'weak' : G.glow && G.glow.foe === f && G.glow.part === p ? 'glow' : '';
          const P_ = G.L.parts[p], pl = p === 'wing';
          const txt = knows('n.' + p) || G.showWeak ? (pl && !G.L.cjk ? (G.lang === 'es' ? 'las ' : G.lang === 'pt' ? 'as ' : 'die ') + (P_.pl || P_.w) : P_.w) : P_.en + (pl ? 's' : '');
          UI.tag(id, () => ST.worldOf(f, p), UI.esc(txt), cls);
        }
      }
    }
    for (const s of ST.S.stones) {
      const id = 'stone:' + s.kind;
      const word = G.lang === 'pt' ? G.L.stoneShow[s.kind] : G.L.stone ? G.L.stone.tag || 'der ' + G.L.stone.w : null;
      if (word && !s.held) UI.tag(id, () => new THREE.Vector3(s.hx, s.r * 1.7 + 0.15, s.hz), UI.esc(word), 'stone'); else UI.tagRemove(id);
    }
  }
  function pickGlow() {
    const field = [];
    for (const f of targetable()) {
      if (f.shy || f.noAuto || (f.spec && f.spec.shadow && !f.lit)) continue;        // (not the colonel behind his closed cape; not a shadow: the Gray Marsh)
      for (const id of ['a.' + f.color, 'a.' + f.size]) if (knows(id)) field.push({ id, foe: f });
      // the creature's name, when there's more than one kind to tell apart (and something Mimo knows can pick this one out:
      // «la palomita» alone is no use with two of them it can't tell apart)
      if (knows('n.' + f.species) && targetable().some(x => x.species !== f.species) && uniqueDesc(f)) field.push({ id: 'n.' + f.species, foe: f });
      if (f.species === 'hushbig') for (const p of f.parts) if (knows('n.' + p)) field.push({ id: 'n.' + p, foe: f, part: p });
      if (f.species === 'beetle' || f.species === 'moth') for (const p of softParts(f)) field.push({ id: 'n.' + p, foe: f, part: p });
      // a look-alike's place in the row («izquierda»), once Mimo knows the word
      const pk = posNeeded(f);
      if (pk && knows('p.' + pk)) field.push({ id: 'p.' + pk, foe: f });
    }
    if (!field.length) { G.glow = null; return; }
    let pick = null;
    if (hasLEX()) {
      for (const id of LEX.due(40)) { const c = field.filter(x => x.id === id && !(x.part && x.part === x.foe.weak)); if (c.length) { pick = c[Math.floor(Math.random() * c.length)]; break; } }
    }
    if (!pick) {
      field.forEach(x => { x.score = -(G.usage[x.id] || 0) * 2 + Math.random() * 1.5 - (x.part && x.part === x.foe.weak ? 3 : 0); });
      field.sort((a, b) => b.score - a.score);
      pick = field[0];
    }
    G.glow = pick;
  }
  function updateWeak() {
    for (const f of G.foes) f.weakShown = !!(f.alive && (f.species === 'hushbig' || f.species === 'beetle') && f.weak && (G.showWeak || knows('n.' + f.weak)));
  }
  function updateStain() {
    if (G.practice || G.boss) return;         // straw dummies and the Corn Society aren't the Hush: no gray around them
    const n = G.foes.length, left = G.foes.filter(f => f.alive && !f.calmed).length;
    if (!n || !left) return;
    tween(ST.S.arena.uni.uStain, { value: 0.3 + 0.7 * left / n }, 0.8, 'io');
  }

  // ------------------------------------------------------------ timing presses
  function timingWindow(T, key, where, o = {}) {
    if (key !== 'Space' && _.react && _.react.wants && _.react.wants()) return _.react.open(T, key, where, o);     // (a dodge said out loud, not pressed: battle/react.js)
    return new Promise(res => {
      G.timing = { T, key, where, res, onPress: o.onPress, t0: G.t };
      const keyHTML = key === 'Space' ? '<kbd>Space</kbd>' : '<kbd>↑</kbd> or <kbd>↓</kbd>';
      UI.ring({ where, T, keyHTML: G.turn <= 3 || G.tutorial ? keyHTML : '' });
    });
  }
  function pressTiming(code) {
    const tm = G.timing;
    if (!tm) return false;
    const d = G.t - tm.T;
    if (d < -EARLY) return false;
    let grade;
    if (code !== tm.key) grade = 'wrong';
    else if (Math.abs(d) <= PERFECT) grade = 'perfect';
    else if (Math.abs(d) <= GOOD) grade = 'good';
    else grade = d < 0 ? 'early' : 'late';
    endTiming(grade, code);
    return true;
  }
  const GRADE = { perfect: ['PERFECT!', '#ffd166', 40], good: ['GOOD', '#8ff0e2', 32], miss: ['MISS', '#d9d1e2', 30], early: ['TOO EARLY', '#d9d1e2', 28], late: ['TOO LATE', '#d9d1e2', 28], wrong: ['WRONG KEY', '#ff9b88', 28] };
  function endTiming(grade, code) {
    const tm = G.timing;
    G.timing = null;
    UI.ringHide();
    if (tm.onPress && code) tm.onPress(code, grade);
    const [txt, col, size] = GRADE[grade] || GRADE.miss;
    // the grade pops on the left, the damage number on the right, so they never sit on each other
    // (the attack's grade badge pops above this one, a beat later)
    UI.pop(tm.where().add(new THREE.Vector3(tm.key === 'Space' ? -0.75 : 0, tm.key === 'Space' ? -0.05 : 0.7, 0)), txt, G.t, { color: col, size, rise: tm.key === 'Space' ? 0.38 : 0.5, life: 0.9 });
    if (grade === 'perfect') { G.stats.perfect++; emit('perfect'); const p = tm.where(); ST.S.fx.sparkle(p.x, p.y, p.z, 14, ['#ffd166', '#fff3a0']); }
    else if (grade !== 'good') emit('miss');
    tm.res(grade);
  }
  function updateTiming() {
    const tm = G.timing;
    if (!tm) return;
    // the test autopilot presses on time; auto.dodge can differ ('miss' lets the foes hit you)
    if (G.auto && (G.auto.timing || G.auto.dodge) && G.t >= tm.T - 0.004) {
      const m = tm.key === 'Space' ? G.auto.timing : G.auto.dodge || G.auto.timing;
      if (m === 'perfect') { pressTiming(tm.key); return; }
      if (m === 'wrong') { pressTiming(tm.key === 'ArrowUp' ? 'ArrowDown' : 'ArrowUp'); return; }
    }
    if (G.t > tm.T + GOOD) endTiming('miss');
  }

  // ------------------------------------------------------------ Mimo's moves (each waits for a Space press at impact)
  const gradeFor = (f, T, spot) => timingWindow(T, 'Space', () => ST.worldOf(f, spot || 'top'));
  function hurtAmount(base, grade, c) {
    let d = base;
    if (grade === 'perfect') d += 1;
    else if (grade !== 'good' && grade !== 'demo') d = Math.max(1, Math.floor(d / 2));
    d = Math.max(1, Math.round(d * (c.power || 1) * (G.practice ? 1 : G.power || 1)));     // (G.power: Mimo's level, battle/rewards.js)
    if (c.sneak) d *= 2;
    if (c.crit) d *= 2;
    if (c.weakHit) d *= 2;
    if (c.belly) d *= 2;                                   // an armadillo on its back
    if (c.armored) d = Math.max(1, Math.floor(d / 2));
    if (c.curled) d = Math.max(1, Math.floor(d / 3));      // an armadillo rolled up into a ball
    if (c.open) d = Math.round(d * 1.5);                   // the colonel with his cape thrown open
    if (c.tacMult && !c.bounce) d = Math.max(1, Math.round(d * c.tacMult));     // battle skills: a counter, a combo, a shield (battle/tactics.js)
    if (c.bounce) d = 0;                                   // …and with it closed
    return _.items && _.items.hit ? _.items.hit(d, c) : d;      // (a spicy or energy snack: the next hit +1, js/pantry.js)
  }
  // damage to a foe (phase 1 of the Corn Society can't take the colonel below half: the floor heats up first)
  function hurtFoe(f, d) {
    f.hp = Math.max(0, f.hp - d);
    f.hitTurn = G.turn;                    // (a snowball hit this round doesn't grow: the Frost Peaks)
    if (G.plug && G.plug.floor) f.hp = Math.max(f.hp, G.plug.floor(f, kit()) || 0);     // (a plug-in boss's own floor: the hooded figure never goes down)
    if (G.boss && f === G.boss.f && G.boss.phase === 1) f.hp = Math.max(f.hp, Math.ceil(f.maxHp / 2));
    if (G.arma && f === G.arma.f && G.arma.phase < 3) f.hp = Math.max(f.hp, armaFloor());     // (the giant armadillo: one phase at a time)
  }
  // a practice dummy takes a hit: it rocks on its post, a good one spins it round, and straw flies
  function strawHit(f, p, d) {
    const s = Math.random() < 0.5 ? 1 : -1;
    f.wobVZ = (f.wobVZ || 0) - Math.min(6, 2.5 + d);
    f.wobVX = (f.wobVX || 0) + s * 1.5;
    if (d >= 3) f.spinV = (f.spinV || 0) + s * (6 + d * 2);
    ST.S.fx.puff(p.x, p.y, p.z, 5 + Math.min(5, d), 0.13, '#e8cf78');
    emit('straw');
  }
  async function hopHome(st, h = 1.2, dur = 0.5) {
    turnTo(st, yawTo(st, st.hx, st.hz), 0.1);
    tween(st, { lean: 0, tilt: 0 }, 0.2);
    await arcTo(st, st.hx, st.baseY || 0, st.hz, dur, h);
    turnTo(st, st.baseYaw, 0.2);
    squash(st, 1.22, 0.8, 0.06);
    if (ST.S.fx) ST.S.fx.puff(st.x, 0, st.z, 3, 0.12);
  }
  async function actJump(c) {
    const M = A.mimo, f = c.target, spot = c.partKey || 'top';
    setMood(M, 'go');
    ST.shot('action', M, f, { yaw: -0.08, up: f.species === 'hushbig' ? 0.6 : 0.2 });
    turnTo(M, yawTo(M, f.x, f.z), 0.1);
    await tween(M, { sx: 1.32, sy: 0.66 }, 0.13, 'out');
    emit('jump');
    const p = ST.worldOf(f, spot);
    const T = G.t + 0.56;
    const gp = gradeFor(f, T, spot);
    tween(M, { sx: 0.8, sy: 1.3 }, 0.09, 'out').then(() => tween(M, { sx: 1, sy: 1 }, 0.3, 'io'));
    ST.S.fx.puff(M.x, 0, M.z, 4, 0.16);
    await arcTo(M, p.x - 0.05, p.y, p.z, 0.56, 1.5 + Math.max(0, p.y - M.y) * 0.25);
    M.sx = 1.38; M.sy = 0.62;
    squashFoe(f, 1.3, 0.62);
    const grade = await gp;
    await land(c, 2, grade, p);
    tween(M, { sx: 1, sy: 1 }, 0.2, 'back');
    if (grade === 'perfect' && G.perks && G.perks.bounce) await perkBounce(f);     // (Mimo's «Big bounce», level 7)
    await hopHome(M, 1.6, 0.55);
    setMood(M, 'idle');
  }
  // «Big bounce»: a PERFECT jump springs on to the next foe for 1 more
  async function perkBounce(f) {
    const next = targetable().find(x => x !== f && !x.shy && !x.calmed);
    if (!next) return;
    const M = A.mimo, p = ST.worldOf(next, 'top');
    emit('jump');
    await arcTo(M, p.x - 0.05, p.y, p.z, 0.4, 1.2);
    squashFoe(next, 1.25, 0.7);
    await land({ target: next, power: 1 }, 1, 'good', p, false, { knock: 0.1 });
    UI.pop(p.clone().add(new THREE.Vector3(-0.6, 0.5, 0)), 'BOUNCE!', G.t, { color: '#86f2e8', size: 26, rise: 0.4, life: 1.0 });
  }
  async function actHit(c) {
    const M = A.mimo, f = c.target, spot = c.partKey || 'mid';
    setMood(M, 'go');
    ST.shot('action', M, f, { yaw: -0.12, up: f.species === 'hushbig' ? 0.4 : 0 });
    const p = ST.worldOf(f, spot);
    const dx = M.x - p.x, dz = M.z - p.z, dl = Math.hypot(dx, dz) || 1;
    const reach = (c.partKey ? 0.42 : f.radius + 0.42);
    const sx = p.x + (dx / dl) * reach, sz = p.z + (dz / dl) * reach;
    turnTo(M, yawTo(M, p.x, p.z), 0.1);
    await tween(M, { sx: 1.22, sy: 0.8, lean: -0.2 }, 0.11, 'out');
    tween(M, { sx: 0.84, sy: 1.14 }, 0.08);
    emit('jump');
    await arcTo(M, sx, Math.max(0, Math.min(p.y - 0.45, 1.6)), sz, 0.28, 0.4);
    const T = G.t + 0.24;
    const gp = gradeFor(f, T, spot);
    M.earWhip = 0.9;
    await tween(M, { lean: -0.45, sx: 1.1, sy: 0.9 }, 0.13, 'out');
    M.earWhip = -2.4;
    await tween(M, { lean: 0.6, sx: 0.88, sy: 1.1 }, 0.1, 'in');
    if (f.floating && !c.partKey) {
      ST.S.fx.puff(p.x - 0.3, p.y - 0.6, p.z, 4, 0.14);
      tween(f, { y: f.baseY + 0.5 }, 0.15).then(() => tween(f, { y: f.baseY }, 0.4, 'io'));
      await gp;
      showGrade(f);
      mimoLine('floating', 2, f);
    } else {
      squashFoe(f, 0.72, 1.18);
      const grade = await gp;
      await land(c, 2, grade, p);
    }
    M.earWhip = 0;
    await tween(M, { lean: 0, sx: 1, sy: 1 }, 0.12);
    await hopHome(M, 0.7, 0.42);
    setMood(M, 'idle');
  }
  async function actThrow(c) {
    const M = A.mimo, f = c.target, kind = c.obj || 'medium', spot = c.partKey || 'mid';
    const stone = ST.S.stones.find(s => s.kind === kind) || ST.S.stones[0];
    setMood(M, 'go'); M.glow = 1; tween(M, { glow: 0 }, 1.2);
    ST.shot('action', M, f, { yaw: -0.1 });
    turnTo(M, yawTo(M, f.x, f.z), 0.1);
    const sm = stone ? stone.m : null;
    if (stone) {
      stone.held = true; UI.tagRemove('stone:' + stone.kind);
      const s0 = sm.position.clone();
      await along(0.3, u => sm.position.set(lerp(s0.x, M.x, u), lerp(s0.y, M.y + 1.3, u) + Math.sin(Math.PI * u) * 0.6, lerp(s0.z, M.z, u)), 'out');
    }
    await tween(M, { sx: 1.22, sy: 0.82, lean: -0.3 }, 0.14);
    const dur = kind === 'light' ? 0.32 : kind === 'heavy' ? 0.8 : 0.5;
    const T = G.t + dur, gp = gradeFor(f, T, spot);
    tween(M, { sx: 0.9, sy: 1.15, lean: 0.35 }, 0.1).then(() => tween(M, { sx: 1, sy: 1, lean: 0 }, 0.3, 'back'));
    emit('jump');
    const p = ST.worldOf(f, spot);
    const missFloat = f.floating && kind !== 'light' && !c.flies;      // (zh / ja: a stone thrown «with» flies: it reaches floaters)
    if (sm) {
      const s0 = sm.position.clone(), arcH = kind === 'heavy' ? 2.4 : kind === 'light' ? 0.6 : 1.4;
      await along(dur, u => { sm.position.set(lerp(s0.x, p.x, u), lerp(s0.y, p.y, u) + 4 * arcH * u * (1 - u), lerp(s0.z, p.z, u)); sm.rotation.x += 0.3; sm.rotation.z += 0.2; });
    } else await wait(dur);
    if (missFloat) {
      tween(f, { y: f.baseY + 0.7 }, 0.12).then(() => tween(f, { y: f.baseY }, 0.5, 'io'));
      if (sm) { const s1 = sm.position.clone(); await along(0.35, u => sm.position.set(s1.x + u * 1.2, Math.max(0.1, s1.y - u * u * 2), s1.z)); }
      await gp;
      showGrade(f);
      mimoLine('tooSlow', 2.2);
    } else {
      ST.S.fx.puff(p.x, p.y, p.z, 6, 0.18, '#d6cfc2');
      const grade = await gp;
      if (G.lang === 'pt' && c.partKey === 'shell' && kind === 'heavy') sideLine('shellCrack');
      squashFoe(f, 1.3, 0.7);
      await land(c, kind === 'heavy' ? 3 : kind === 'light' ? 1 : 2, grade, p);
    }
    if (stone) { stone.held = false; ST.S.fx.puff(stone.hx, 0.1, stone.hz, 5, 0.15); }
    await hopHome(M, 0.4, 0.3);
    setMood(M, 'idle');
  }
  async function actAttack(c) {
    const M = A.mimo, f = c.target, n = c.charge || 0, spot = c.partKey || 'mid';
    setMood(M, 'go');
    ST.shot('action', M, f, { yaw: -0.1 });
    turnTo(M, yawTo(M, f.x, f.z), 0.1);
    for (let i = 0; i < n; i++) {
      M.glow = 1;
      const top = ST.worldOf(M, 'top');
      ST.S.fx.sparkle(top.x, top.y - 0.3, top.z, 8 + i * 4, ['#ffd166', '#fff3a0']);
      UI.pop(top.clone().add(new THREE.Vector3(0, 0.2 + i * 0.12, 0)), '⚡'.repeat(i + 1), G.t, { color: '#ffd166', size: 26, rise: 0.4, life: 0.8 });
      await squash(M, 1.15 + i * 0.05, 0.85, 0.06);
      await wait(0.06);
    }
    tween(M, { glow: 0 }, 0.6);
    const p = ST.worldOf(f, spot);
    const dx = M.x - p.x, dz = M.z - p.z, dl = Math.hypot(dx, dz) || 1;
    const sx = p.x + (dx / dl) * (f.radius + 0.35), sz = p.z + (dz / dl) * (f.radius + 0.35);
    await tween(M, { sx: 1.25, sy: 0.75, lean: -0.3 }, 0.1);
    const T = G.t + 0.3, gp = gradeFor(f, T, spot);
    tween(M, { sx: 0.8, sy: 1.15, lean: 0.5 }, 0.1);
    emit('jump');
    await arcTo(M, sx, f.floating ? f.baseY : 0, sz, 0.3, 0.25, 'in');
    squashFoe(f, 0.7, 1.2);
    const grade = await gp;
    await land(c, 1 + n, grade, p);
    await hopHome(M, 0.8, 0.45);
    setMood(M, 'idle');
  }
  async function actGrab(c) {
    const M = A.mimo, f = c.target;
    setMood(M, 'confused');
    ST.shot('action', M, f);
    const p = ST.worldOf(f, 'mid');
    await arcTo(M, p.x - f.radius - 0.35, 0, p.z, 0.3, 0.3);
    await squash(f, 0.85, 1.12, 0.1);
    await wait(0.2);
    sideLine('grab', 2.4);
    await land(Object.assign({}, c, { power: 1, sneak: false, crit: false, weakHit: false }), 1, 'good', p, true);
    await hopHome(M, 0.6, 0.4);
    setMood(M, 'idle');
  }
  // Push: Mimo runs up, braces and shoves with both paws. A light hit that knocks the foe back; a rolled-up
  // armadillo flips over onto its back instead (flipOver). It can't reach a moth in the air.
  async function actPush(c) {
    const M = A.mimo, f = c.target, big = f.species === 'hushbig';
    setMood(M, 'go');
    ST.shot('action', M, f, { yaw: -0.12, up: big ? 0.4 : 0.05 });
    const p = ST.worldOf(f, 'mid');
    const dx = M.x - p.x, dz = M.z - p.z, dl = Math.hypot(dx, dz) || 1;
    const reach = f.radius + 0.34;
    turnTo(M, yawTo(M, p.x, p.z), 0.1);
    await tween(M, { sx: 1.18, sy: 0.84, lean: -0.15 }, 0.1, 'out');
    emit('jump');
    await arcTo(M, p.x + (dx / dl) * reach, 0, p.z + (dz / dl) * reach, 0.3, 0.35);
    squash(M, 1.15, 0.86, 0.05);
    const T = G.t + 0.3;
    const gp = gradeFor(f, T, 'mid');
    M.earWhip = 0.8;
    await tween(M, { lean: -0.32, sx: 1.2, sy: 0.82 }, 0.18, 'out');        // brace…
    M.earWhip = -2.2;
    await tween(M, { lean: 0.6, sx: 0.84, sy: 1.14, x: M.x - (dx / dl) * 0.2, z: M.z - (dz / dl) * 0.2 }, 0.1, 'in');   // …and shove
    if (f.floating && !c.partKey) {
      ST.S.fx.puff(p.x - 0.3, p.y - 0.6, p.z, 4, 0.14);
      tween(f, { y: f.baseY + 0.4 }, 0.15).then(() => tween(f, { y: f.baseY }, 0.4, 'io'));
      await gp;
      showGrade(f);
      mimoLine('floating', 2, f);
    } else {
      const grade = await gp;
      const flip = c.flip && f.species === 'armadillo' && !f.flipped;
      await land(c, 1, grade, p, false, { knock: flip || c.heavy ? 0 : big ? 0.35 : 1.0 });
      if (flip && f.alive && !f.gone) await flipOver(f);
      else if (c.heavy && f.alive && !f.gone) await armaHeavy(f);     // (the giant armadillo, not dizzy: it only rocks)
    }
    M.earWhip = 0;
    await tween(M, { lean: 0, sx: 1, sy: 1 }, 0.12);
    await hopHome(M, 0.7, 0.45);
    setMood(M, 'idle');
  }
  const MOVES = { jump: actJump, hit: actHit, throw: actThrow, attack: actAttack, grab: actGrab, push: actPush, sing: c => actSing(c), climb: c => actClimb(c), blow: c => actBlow(c), call: c => actCall(c) };     // (sing: the Quarry Caves; climb: the Bloom Gardens, below)
  _.MOVES = MOVES; _.VERB_EN = VERB_EN;     // (kungfu.js adds Master Mei's «推掌», zh only: a push with double power)
  function squashFoe(f, sx, sy) { tween(f, { sx, sy }, 0.06).then(() => tween(f, { sx: 1, sy: 1 }, 0.3, 'back')); }

  // ------------------------------------------------------------ the armadillo: over onto its back, and back into a ball
  // A push pops it into the air; it uncurls on the way and lands on its back, legs waving. For one turn it
  // can't attack and its belly takes ×2 (judge sets c.belly); its head and tail are out, so they can be named.
  async function flipOver(f) {
    f.flipped = 2; f.parts = (f.h.parts || []).slice(); f.rolling = false; f.dizzy = 0;
    setMood(f, 'hurt', 1.1);
    emit('knockdown', { kind: 'flip' });
    const x0 = f.x, away = f.x > A.mimo.x ? 1 : -1;
    await along(0.55, u => {
      f.y = Math.sin(Math.PI * u) * 0.95;
      f.x = lerp(x0, f.hx + away * 0.12, u);
      f.curl = 1 - smoothstep(0.05, 0.55, u);
      f.flip = smoothstep(0.15, 0.85, u);
    });
    f.y = 0; f.curl = 0; f.flip = 1;
    squashFoe(f, 1.3, 0.66);
    ST.S.fx.puff(f.x, 0.05, f.z, 8, 0.22); ST.shake(0.3, 0.25);
    tween(f, { x: f.hx }, 0.3, 'io');
    refreshLabels();
    wait(0.9).then(() => { if (f.alive && f.flipped) sideLine('flipped', 2.4, f); });
  }
  async function rollBack(f) {
    f.flipped = 0; f.parts = [];
    setMood(f, 'go', 0.8);
    emit('rollback');
    ST.shot('action', f, f, { up: 0.1, dist: 7 });
    await wait(0.15);
    await along(0.5, u => { f.y = Math.sin(Math.PI * u) * 0.6; f.flip = 1 - smoothstep(0.1, 0.7, u); f.curl = smoothstep(0.35, 0.95, u); });
    f.y = 0; f.flip = 0; f.curl = 1;
    squashFoe(f, 1.25, 0.75);
    ST.S.fx.puff(f.x, 0.05, f.z, 6, 0.18);
    sideLine('rollBack', 1.9, f);
    refreshLabels();
    await wait(0.35);
  }
  // rolls the ball along the ground to (x, z), turning as far as it goes (and ending upright)
  async function rollTo(f, x, z, dur) {
    const x0 = f.x, z0 = f.z, R = _.M.AR * f.h.scale, s0 = f.spin || 0;
    const dirx = Math.sin(f.yaw), dirz = Math.cos(f.yaw);       // rolling the way it faces turns it forward
    const fwd = (x - x0) * dirx + (z - z0) * dirz, s1 = s0 + Math.round(fwd / R / TAU) * TAU;
    f.rolling = true;
    await along(dur, u => { f.x = lerp(x0, x, u); f.z = lerp(z0, z, u); f.spin = lerp(s0, s1, u); f.y = Math.abs(Math.sin(u * Math.PI * 3)) * 0.05 * (1 - u); }, 'io');
    f.x = x; f.z = z; f.y = 0; f.spin = s1; f.rolling = false;
  }

  // the moment of impact: damage, hit-stop, shake, stars, the number. o.knock: how far it's knocked back
  async function land(c, base, grade, p, quiet, o = {}) {
    const f = c.target;
    if (c.clang) { clangOff(c, p); return; }       // (a crab hit from the front: Port Brisa)
    if (c.bounce) { bounceOff(c, p); return; }
    if (c.through && _.marsh && _.marsh.through && f.spec && f.spec.shadow && !f.lit) { _.marsh.through(c, p); return; }     // (a shadow you didn't name: it goes right through, the Gray Marsh)
    if (c.buried && _.ruins && _.ruins.buried) { _.ruins.buried(c, p); return; }     // (a sand worm under the sand: the hit only sprays sand, the Sunken Ruins: ruins_battle.js)
    const d = hurtAmount(base, grade, c);
    f.flash = 0.2; setMood(f, 'hurt', 0.55);
    const strong = c.crit || c.weakHit || c.belly;
    G.hitstop = clamp(0.045 + d * 0.012, 0.05, 0.13);
    ST.shake(0.32 + d * 0.07, d >= 4 ? 0.9 : 0.35);
    ST.star(p, strong ? '#ffd166' : '#ffffff', 0.75 + Math.min(6, d) * 0.1);
    ST.S.fx.sparkle(p.x, p.y, p.z, 8 + d * 2, strong ? ['#ffd166', '#fff3a0'] : ['#ffffff', '#fff3a0', '#7ff7ea']);
    ST.S.fx.puff(p.x, p.y - 0.2, p.z, 4, 0.15, '#b9b0d0');
    if (d >= 4) ST.ring(f, '#ffffff', 2.4);
    // the damage number on the right says what the hit did (the grade badge above says how good the sentence was)
    const sub = c.tacSub ? c.tacSub : c.crit ? 'CRITICAL!' : c.weakHit ? 'WEAK SPOT!' : c.belly ? 'BELLY ×2!' : c.behind ? 'FROM BEHIND ×2' : c.sneak ? 'SURPRISE ×2' : c.flip ? 'FLIP!' : c.armored || c.curled ? 'HARD SHELL' : null;
    UI.pop(p.clone().add(new THREE.Vector3(0.45, 0.35, 0)), String(d), G.t, { color: strong ? '#ffd166' : '#ffffff', size: strong ? 54 : 44, sub, dx: 0.25 });
    showGrade(f);
    emit('hit', { damage: d, strong, foe: f });
    if (c.armored || c.curled) emit('block', { foe: f, kind: 'shell' });      // (a hard shell or a ball: a clonk)
    if (c.crit) emit('crit');
    // knock back (a little; a push sends it skidding; a dummy on its post rocks instead)
    const kx = f.x, away = f.x > A.mimo.x ? 1 : -1, knock = f.species === 'dummy' ? 0 : o.knock !== undefined ? o.knock : 0.22;
    if (f.species === 'dummy') strawHit(f, p, d);
    if (knock > 0.5) {
      tween(f, { x: kx + away * knock, lean: -0.25 }, 0.16, 'out').then(() => { ST.S.fx.puff(f.x - away * 0.2, 0.05, f.z, 4, 0.14); return wait(0.12); })
        .then(() => tween(f, { x: f.hx, lean: 0 }, 0.5, 'io'));
    } else if (knock > 0) tween(f, { x: kx + away * knock }, 0.08).then(() => tween(f, { x: f.hx }, 0.35, 'back'));
    hurtFoe(f, d);
    G.stats.damage += d;
    if (c.open && f.hp > 0) { const [t, en] = line('bossHurt'); say(f, t, { cls: 'foe', en, dur: 1.7 }); }   // «¡Ay, mi medalla!»
    if (c.belly && f.isBoss && f.hp > 0) { const [t, en] = line('armaHurt'); say(f, t, { cls: 'foe', en, dur: 1.7 }); }   // «¡Ay, mi panza!»
    if (c.weakHit) { sideLine('weak', 1.6); }
    else if (c.curled) {
      if (!G.curlHinted && knows('v.push') && !f.isBoss) { G.curlHinted = true; sideLine('curledHard', 2.6, f); }   // once a fight: push it over first (the giant one: not till it's dizzy, the tip says)
      else sideLine('hard', 1.6);
    }
    else if (c.armored) {
      if (G.lang === 'pt' && knows('v.throw')) sideLine('shellPing', 2.2);
      else if (f.species === 'beetle' && !G.shellHinted) { G.shellHinted = true; sideLine('shellHard', 2.6); }   // once a fight: aim for the head
      else sideLine('hard', 1.6);
    }
    if (f.states.has('asleep')) {
      f.states.delete('asleep'); f.states.add('angry'); f.wokeTurn = G.turn;
      if (c.sneak) sideLine('sneak', 1.5);
      wait(0.6).then(() => sideLine('nowAngry', 1.8, f));
    }
    if (f.hp <= 0) { await wait(0.12); await defeat(f); return; }
    if (c.weakHit && f.species === 'hushbig') await moveWeak(f);
    // a moth hit on the wings falls to the ground: dazed for a round, and in reach of every move
    if (c.partKey === 'wing' && (f.species === 'moth' || f.species === 'bat' || f.species === 'bee') && f.floating) await knockDown(f);
    refreshLabels();
  }
  async function knockDown(f) {
    f.floating = false; f.down = 2;
    setMood(f, 'hurt', 0.9);
    await wait(0.12);
    await tween(f, { baseY: 0, y: 0 }, 0.3, 'in');
    squashFoe(f, 1.35, 0.6);
    ST.S.fx.puff(f.x, 0.05, f.z, 7, 0.2); ST.shake(0.25, 0.2);
    emit('knockdown');
    refreshLabels();
    // said once Mimo is back home, so the line doesn't sit on the grade badge
    wait(0.9).then(() => { if (f.alive && f.down) sideLine('mothDown', 2.2, f); });
  }
  async function riseUp(f) {
    f.down = 0; f.floating = true;
    setMood(f, 'go', 0.7);
    ST.S.fx.puff(f.x, 0.1, f.z, 5, 0.16);
    await tween(f, { baseY: f.hover || 0.95, y: f.hover || 0.95 }, 0.5, 'out');
    sideLine('mothUp', 1.8, f);
    refreshLabels();
    await wait(0.3);
  }
  // ------------------------------------------------------------ the attack rating on screen: a badge over the foe as the hit lands
  function showGrade(f, o = {}) {
    const g = G.badgePending;
    if (!g || !f) return;
    G.badgePending = null;
    // above the foe and to the left: clear of the damage number (it rises on the right), a KO (on its
    // head) and Mimo's bubble (it rides along to the right of Mimo when it lands on top). When you
    // talk, the foe answers in a bubble that opens to its left, so the badge goes right (o.right).
    const dx = (f.species === 'hushbig' ? 1.0 : 0.86) * (o.right ? 1 : -1);
    const pos = ST.worldOf(f, 'top').add(new THREE.Vector3(dx, f.species === 'hushbig' ? 0.55 : f.floating ? 0.6 : 0.85, 0));
    // a beat after the impact (hit-stop holds the game clock), so the hit and the grade read one after the other
    // the first one in a lesson stays up while the Coach explains it
    const explain = G.tutorial && !A.coach.hidden && !gradeTold();
    wait(0.1).then(() => {
      UI.badge(pos, g.letter, g.reason, G.t, { life: explain ? 5.5 : 2.1 });
      emit('grade-' + g.letter.toLowerCase(), { grade: g.letter, reason: g.reason });
      if (g.letter === 'S') { ST.S.fx.sparkle(pos.x, pos.y, pos.z, 18, ['#ffd166', '#fff3a0', '#ffffff']); ST.star(pos, '#ffd166', 1.15); }
      else if (g.letter === 'A') ST.S.fx.sparkle(pos.x, pos.y, pos.z, 8, ['#8ff0e2', '#ffffff']);
    });
  }
  // Mimo's little reaction to the grade, once it's back home: a happy hop for an S, a droop for a D
  async function mimoReact(letter) {
    const M = A.mimo;
    if (letter === 'S') {
      setMood(M, 'happy', 1.8);
      await squash(M, 1.2, 0.82, 0.06);
      const top = ST.worldOf(M, 'top');
      ST.note(top);
      await arcTo(M, M.hx, 0, M.hz, 0.32, 0.45);
      squash(M, 1.15, 0.86, 0.05);
    } else if (letter === 'A') setMood(M, 'happy', 1.1);
    else if (letter === 'C') setMood(M, 'confused', 1.2);
    else if (letter === 'D') setMood(M, 'sad', 1.4);
  }
  // the Coach explains the letter once, the first time one shows up in a lesson (kept with the save, via LEX)
  const gradeTold = () => (hasLEX() ? !!LEX.st('x.gradeTold').told : !!_.gradeTold);
  const markGradeTold = () => { _.gradeTold = true; if (hasLEX()) LEX.st('x.gradeTold').told = 1; };
  async function moveWeak(f) {
    const old = f.weak;
    f.weak = WEAK_NEXT[old] || 'tail';
    updateWeak();
    await wait(0.35);
    // it shields the sore spot and turns a little
    await turnTo(f, f.baseYaw + (f.weak === 'tail' ? -0.4 : f.weak === 'shell' ? 0.5 : 0), 0.25);
    await wait(0.15);
    turnTo(f, f.baseYaw, 0.4);
    if (f.weakShown) { const [t, en] = G.L.weakNow(f.weak); if (!A.coach.hidden) say(A.coach, t, { cls: 'coach', en, dur: 2.2 }); else say(A.mimo, t, { cls: 'mimo', en, dur: 2.2 }); }
  }
  async function defeat(f) {
    if (f.species === 'colonel') return surrender(f);       // he gives up instead
    if (f.species === 'dummy') return topple(f);            // it spins and falls over
    if (f.isBoss && G.arma) return armaDown(f);             // the giant armadillo wakes up from the Hush instead
    f.alive = false; setMood(f, 'hurt');
    UI.labelRemove(f); UI.tagRemove(`part:${f.id}:`); UI.tagRemove(`pos:${f.id}`);
    G.stats.beaten++; earn(COINS_FOE);
    emit('ko', { foe: f });
    freeWord(f);                                            // the word it stole flies free (battle/rewards.js)
    await tween(f, { sy: 1.3, sx: 0.78 }, 0.09, 'out');
    const p = ST.worldOf(f, 'mid');
    ST.S.fx.puff(p.x, p.y, p.z, 14, 0.3 * (f.species === 'hushbig' ? 2 : 1), '#a59cc4');
    ST.S.fx.sparkle(p.x, p.y + 0.3, p.z, 18, [UI.COL[f.color] || '#ffffff', '#fff3a0']);
    ST.star(p, '#ffffff', f.species === 'hushbig' ? 2.2 : 1.3);
    ST.note(ST.worldOf(f, 'top'));
    ST.shake(0.45, 0.5);
    UI.pop(ST.worldOf(f, 'top'), 'KO!', G.t, { color: '#ffffff', size: 40 });
    await tween(f, { sy: 0.05, sx: 1.7 }, 0.16, 'in');
    f.hidden = true; f.gone = true;
    updateStain();
  }

  // ------------------------------------------------------------ foe turns: a shouted telegraph, then a dodge
  const readTime = text => Math.min(2.6, 1.0 + text.length * 0.032) + (G.tier >= 3 ? 0.3 : 0);
  async function foeAttack(f) {
    if (!f.alive || f.calmed || f.shy || f.gone) return;
    if (f.states.has('asleep')) { say(f, 'zzz…', { cls: 'foe small', dur: 1.2 }); await wait(0.8); return; }
    if (_.tac && _.tac.foeAttack && await _.tac.foeAttack(f)) return;     // (what it told you it would do: battle/tactics.js)
    const toMimo = Math.random() < 0.5, tgt = toMimo ? A.mimo : A.you;
    const high = f.tbHigh != null ? f.tbHigh : f.floating ? Math.random() < 0.72 : Math.random() < 0.5;     // (tbHigh: the way it showed it would go, the Future: battle/timebattle.js)
    const [txt, en] = G.L.shout(G.tier, toMimo, high);
    setMood(f, 'go');
    ST.shot('action', f, tgt, { yaw: 0.04, up: f.species === 'hushbig' ? 0.5 : 0.1 });
    say(f, txt, { cls: 'foe shout', en, dur: readTime(txt) + 1.6 });
    emit('shout', { text: txt, high, foe: f });
    dodgeHint(true);
    await wait(readTime(txt));
    emit('windup', { foe: f, high });                     // (a rising wind-up before it moves: js/battle_fx.js)
    const arm = f.species === 'armadillo';
    // a frog lashes its tongue at you; at the lake it may dive in by the dock and splash you instead
    // (tests: G.auto.frog = 'tongue' | 'splash' picks one)
    const frog = f.species === 'frog', splash = frog && ST.S.biome === 'lake' && (G.auto && G.auto.frog ? G.auto.frog === 'splash' : Math.random() < 0.45);
    const headY = tgt.kind === 'you' ? 1.15 : 0.55;
    const yaw0 = f.yaw;
    let ex, ez;
    if (arm) {
      // the armadillo rolls at you: it rocks back, then rolls along the ground (low), or bounces up at the end (high)
      f.rolling = true;
      turnTo(f, yawTo(f, tgt.x, tgt.z), 0.15);
      const s0 = f.spin || 0;
      await along(0.18, u => { f.spin = s0 - Math.sin(Math.PI * u) * 0.5; });
    } else if (frog) {
      // it turns to you, rears up, and its throat swells
      turnTo(f, yawTo(f, tgt.x, tgt.z), 0.15);
      f.croak = 1.0; emit('croak');
      await tween(f, { sx: 0.9, sy: 1.16, lean: -0.16 }, 0.15, 'out');
    } else await tween(f, { sx: 1.25, sy: 0.74, lean: -0.22 }, 0.15, 'out');
    const T = G.t + 0.72, key = high ? 'ArrowDown' : 'ArrowUp';
    const tp = timingWindow(T, key, () => ST.worldOf(tgt, 'mid'), { onPress: code => dodgeMove(tgt, code) });
    const big = f.species === 'hushbig';
    if (frog && !splash) {
      // the tongue: the same wind-up either way; only its last 0.32 s shows whether it goes for the head or the feet
      await tween(f, { sx: 1.1, sy: 0.88, lean: -0.3 }, 0.4, 'io');
      emit('tongue');
      const Q = new THREE.Vector3(tgt.x + 0.05, high ? headY + (tgt.kind === 'you' ? 0.2 : 0.15) : 0.13, tgt.z);
      f.lean = -0.05; f.sx = 0.95; f.sy = 1.06;
      await along(0.32, u => lashAt(f, Q, u), 'out');
      ex = f.x; ez = f.z;
    } else if (splash) {
      // it leaps off its pad and dives in by the end of the dock: the water flies at you, over your head or along the boards
      const x0 = f.x, z0 = f.z, y0 = f.y, wx = Math.max(tgt.x + 1.7, ST.DOCK_END + 0.6), wz = tgt.z + 0.15;
      emit('jump');
      tween(f, { sx: 0.86, sy: 1.18, lean: 0 }, 0.1);
      await along(0.4, u => { f.x = lerp(x0, wx, u); f.z = lerp(z0, wz, u); f.y = y0 + Math.sin(Math.PI * Math.min(1, u * 1.15)) * 1.4 - smoothstep(0.75, 1, u) * 0.5; f.lean = 0.9 * u; });
      f.hidden = true;
      ST.splash(wx, wz, 1.25); emit('splash');
      const to = new THREE.Vector3(tgt.x + 0.1, high ? headY + 0.2 : 0.16, tgt.z);
      ST.spray(new THREE.Vector3(wx, 0.15, wz), to, 0.32, high);
      await wait(0.32);
      ex = wx; ez = wz;
    } else if (arm) {
      emit('roll');
      const x0 = f.x, z0 = f.z, R = _.M.AR * f.h.scale, s0 = f.spin || 0, lift = Math.max(0.05, headY - R - 0.12);
      ex = tgt.x + 0.62; ez = tgt.z + 0.05;
      // (the same roll both ways until the last 0.3 s, so the shout is what tells you which key to press)
      await along(0.72, u => {
        const e = u * 0.55 + u * u * 0.45;
        f.x = lerp(x0, ex, e); f.z = lerp(z0, ez, e);
        f.spin = s0 + Math.hypot(f.x - x0, f.z - z0) / R;
        f.y = high && u > 0.58 ? Math.sin(((u - 0.58) / 0.42) * Math.PI * 0.5) * lift : Math.abs(Math.sin(u * Math.PI * 5)) * 0.035;
      });
    } else {
      // the first hop looks the same either way; only the last 0.32 s shows high or low,
      // so the shout is what tells you which key to press
      const x0 = f.x, z0 = f.z, y0 = f.y;
      ex = tgt.x + (big ? 1.2 : 0.65); ez = tgt.z + 0.05;
      const mx = lerp(x0, ex, 0.55), mz = lerp(z0, ez, 0.55);
      tween(f, { sx: 0.86, sy: 1.18, lean: 0 }, 0.1);
      emit('jump');
      await along(0.4, u => { f.x = lerp(x0, mx, u); f.z = lerp(z0, mz, u); f.y = y0 + Math.sin(Math.PI * u) * (big ? 0.5 : 0.7); });
      await along(0.32, u => {
        f.x = lerp(mx, ex, u); f.z = lerp(mz, ez, u);
        if (high) { f.y = lerp(y0, headY - (big ? 0.6 : 0.25), u) + Math.sin(Math.PI * u) * 0.45; f.lean = 0.45 * u; f.sx = 1 + u * 0.1; f.sy = 1 - u * 0.1; }
        else if (big) { f.y = lerp(y0, 0, u); f.yaw = yaw0 + u * TAU; f.lean = 0.2 * u; }
        else { f.y = lerp(y0, 0.02, u); f.lean = 0.95 * u; f.sy = 1 - 0.2 * u; f.sx = 1 + 0.1 * u; }
      });
      f.yaw = yaw0;
    }
    const grade = await tp;
    dodgeResult(f, tgt, grade, f.states.has('angry') || big || (f.species === 'snowball' && f.snow >= (f.spec && f.spec.giant ? 3 : 2)) ? 2 : 1, splash ? { puff: [tgt.x, headY * 0.6, tgt.z, '#d8f1f8'] } : {});     // (a giant snowman: two hearts only at its biggest)
    f.lean = 0; f.sx = 1; f.sy = 1;
    if (frog && !splash) {
      // the tongue snaps back in, with a gulp
      await tween(f, { lash: 0 }, 0.16, 'in');
      f.lash = 0;
      squash(f, 1.15, 0.88, 0.06);
      turnTo(f, f.baseYaw, 0.25);
      await wait(0.2);
    } else if (splash) {
      // it pops up out of the water and hops back onto its pad
      f.x = ex + 0.35; f.z = ez; f.y = -0.35; f.hidden = false;
      ST.splash(f.x, f.z, 0.55);
      await hopHome(f, 1.5, 0.6);
      ST.perchDip(f.hx, f.hz);
    } else if (arm) {
      // it bounces off, and rolls home backwards
      const bx = f.x, by = f.y, R = _.M.AR * f.h.scale, s1 = f.spin;
      await along(0.28, u => { f.x = bx + u * 0.7; f.y = by * (1 - u) + Math.sin(Math.PI * u) * 0.3; f.spin = s1 - (u * 0.7) / R; });
      f.y = 0;
      await rollTo(f, f.hx, f.hz, 0.6);
      turnTo(f, f.baseYaw, 0.2);
    } else {
      await along(0.2, u => { f.x = lerp(ex, ex - 0.5, u); f.y = Math.max(f.baseY, f.y * (1 - u)); });
      await hopHome(f, 1.0, 0.5);
    }
    setMood(f, 'idle');
    if (f.hp <= 0) { await defeat(f); return; }
    refreshLabels();
    if (f.sleepy && !f.states.has('asleep') && f.wokeTurn !== G.turn) {
      await wait(0.3);
      f.states.delete('angry'); f.states.add('asleep');
      refreshLabels();
      sideLine('sleepAgain', 1.8, f);
    }
  }
  // How a dodge went. Dodged: a PERFECT one counters (1 damage back). Missed: the hearts go (o.puff: [x, y, z, color]
  // of a splash on you); in practice nothing is lost, it just says so. Returns whether you dodged.
  function dodgeResult(f, tgt, grade, dmg, o = {}) {
    dodgeHint(false);
    UI.clearBubbles(f);
    if (grade === 'perfect' || grade === 'good') {
      emit('dodge', { perfect: grade === 'perfect', foe: f });
      if (grade === 'perfect') {
        const p = ST.worldOf(f, 'top'), xc = _.react && _.react.extra ? _.react.extra() : 0;     // (a counter command said out loud, «¡Agáchate y golpea!»: one more, battle/react.js)
        UI.pop(p, xc ? 'COUNTER ×2!' : 'COUNTER!', G.t, { color: '#ffd166', size: xc ? 38 : 32 });
        f.flash = 0.2; hurtFoe(f, (G.perks && G.perks.counter ? 2 : 1) + xc); G.stats.counters++;     // (Mimo's «Counter punch», level 9: 2)
        ST.S.fx.sparkle(p.x, p.y, p.z, 12, ['#ffd166', '#fff3a0']); ST.star(p, '#ffd166', 0.8);
        G.hitstop = 0.07; ST.shake(0.3, 0.3);
        if (f.species === 'dummy') strawHit(f, ST.worldOf(f, 'mid'), 1);
        emit('counter');
      }
      return true;
    }
    if (G.practice) {
      tgt.flash = 0.2; setMood(tgt, 'confused', 0.9);
      squash(tgt, 1.12, 0.88, 0.06);
      UI.pop(ST.worldOf(tgt, 'top'), 'DODGE MISSED', G.t, { color: '#d9d1e2', size: 28, sub: 'no harm done' });
      G.stats.dodgeMissed = (G.stats.dodgeMissed || 0) + 1;
      emit('dodge-missed');
      if (!G.missTold) { G.missTold = true; wait(0.6).then(() => { if (G.running) { const [t, en] = line('pMissed'); say(A.coach, t, { cls: 'coach', en, dur: 2.4 }); } }); }
      return false;
    }
    if (_.items && _.items.hurt) { dmg = _.items.hurt(dmg, f, tgt); if (!dmg) return false; }     // (cheese blocks the next hit: js/pantry.js)
    G.hearts = Math.max(0, G.hearts - dmg);
    UI.hearts(G.hearts, G.maxHearts, G.name, true);
    tgt.flash = 0.25; setMood(tgt, 'hurt', 0.8);
    UI.pop(ST.worldOf(tgt, 'top'), `-${dmg} ♥`, G.t, { color: '#ff9b88', size: 34 });
    ST.star(ST.worldOf(tgt, 'mid'), '#ff9b88', 0.8);
    G.hitstop = 0.09; ST.shake(0.7, 0.6);
    tween(tgt, { x: tgt.hx - 0.4, lean: -0.3 }, 0.1).then(() => tween(tgt, { x: tgt.hx, lean: 0 }, 0.3, 'back'));
    if (o.puff) ST.S.fx.puff(o.puff[0], o.puff[1], o.puff[2], 6, 0.16, o.puff[3]);
    emit('hurt', { hearts: G.hearts, dmg, foe: f });
    // Mimo's «Second wind» (level 12): once a fight, down to 1 ♥, two come back
    if (G.perks && G.perks.second && !G.secondUsed && G.hearts === 1) {
      G.secondUsed = true; G.hearts = Math.min(G.maxHearts, 3);
      wait(0.5).then(() => { if (!G.running) return; UI.hearts(G.hearts, G.maxHearts, G.name, 'heal'); UI.pop(ST.worldOf(A.mimo, 'top'), 'SECOND WIND +2 ♥', G.t, { color: '#7fe0a0', size: 28, rise: 0.6, life: 1.6 }); emit('heal'); });
    }
    return false;
  }
  async function dodgeMove(st, code) {
    if (code === 'ArrowUp') {
      tween(st, { sx: 0.86, sy: 1.16 }, 0.06).then(() => tween(st, { sx: 1, sy: 1 }, 0.2));
      await arcTo(st, st.hx, 0, st.hz, 0.5, 1.2);
      squash(st, 1.2, 0.8, 0.06);
    } else if (code === 'ArrowDown') {
      setMood(st, st.kind === 'mimo' ? 'duck' : 'hurt', 0.45);
      await tween(st, { sy: 0.5, sx: 1.3 }, 0.07);
      await wait(0.32);
      await tween(st, { sy: 1, sx: 1 }, 0.16, 'back');
    }
  }
  async function foePhase() {
    if (G.practice) return practiceFoePhase();   // the dummies: now and then a slow swing to dodge
    if (_.items && _.items.skipFoes && _.items.skipFoes()) return;    // (a quick drink took no turn: the foes don't get one, js/pantry.js)
    if (G.plug && G.plug.foePhase) return G.plug.foePhase(kit());     // (a plug-in boss: its own turn)
    if (G.boss) return cornFoePhase();           // the Corn Society: the squad, or the colonel himself
    if (G.arma) return armaFoePhase();           // the Great Mill's giant armadillo (and its helpers)
    // a knocked-down moth stays dazed on the ground for this round and flutters back up the next
    for (const f of G.foes) {
      if (!f.alive || f.gone || !f.down) continue;
      f.down--;
      if (!f.down) await riseUp(f);
      else { const top = ST.worldOf(f, 'top'); UI.pop(top, '✦ ✦ ✦', G.t, { color: '#fff3a0', size: 22, rise: 0.35, life: 1.1 }); ST.star(top, '#fff3a0', 0.5); await wait(0.6); }
    }
    // an armadillo on its back wriggles for this round, and rolls back into a ball the next (then it can attack again)
    for (const f of G.foes) {
      if (!f.alive || f.gone || !f.flipped) continue;
      f.flipped--;
      if (!f.flipped) await rollBack(f);
      else { const top = ST.worldOf(f, 'top'); UI.pop(top.clone().add(new THREE.Vector3(0, -0.25, 0)), '✦ ✦ ✦', G.t, { color: '#fff3a0', size: 22, rise: 0.35, life: 1.1 }); ST.star(top, '#fff3a0', 0.5); await wait(0.6); }
    }
    // a foe dizzy from Mimo's song (the Quarry Caves) sits this round out
    const dizzy = new Set();
    for (const f of G.foes) {
      if (!f.alive || f.gone || !(f.dazed > 0)) continue;
      f.dazed--; dizzy.add(f);
      const top = ST.worldOf(f, 'top'); UI.pop(top, '♪ ✦ ♪', G.t, { color: '#7ff7ea', size: 22, rise: 0.35, life: 1.1 }); await wait(0.45);
    }
    // a crab turned round by a call (Port Brisa) snaps at the gulls this round instead of at you, and turns back the round after
    for (const f of G.foes) {
      if (!f.alive || f.gone || !(f.turned > 0)) continue;
      f.turned--;
      if (f.turned) dizzy.add(f); else turnTo(f, f.yaw0 !== undefined ? f.yaw0 : f.yaw + Math.PI, 0.3);
    }
    let attackers = G.foes.filter(f => f.alive && !f.calmed && !f.shy && !f.gone && !f.down && !f.flipped && !dizzy.has(f));
    if (attackers.length > 2) attackers = attackers.sort(() => Math.random() - 0.5).slice(0, 2);
    if (_.tac && _.tac.attackers) attackers = await _.tac.attackers(attackers);     // (one told you it'd leap, one hides behind a rock: battle/tactics.js)
    for (const f of attackers) {
      if (f.species === 'bat') emit('screech');
      if (f.species === 'bee') emit('buzz');
      await foeAttack(f);
      if (G.hearts <= 0 || allDone()) return;
      await wait(0.12);
    }
  }
  // aims a frog's tongue at the world point Q and stretches it u (0…1) of the way there (the model draws it from F.lash,
  // F.lashYaw and F.lashPitch: its length in the frog's own units, and its turn and tilt from where the frog faces)
  function lashAt(f, Q, u) {
    const m = ST.worldOf(f, 'mouth'), dx = Q.x - m.x, dy = Q.y - m.y, dz = Q.z - m.z, flat = Math.hypot(dx, dz);
    f.lashYaw = angDiff(f.yaw, Math.atan2(dx, dz));
    f.lashPitch = Math.atan2(dy, flat);
    f.lash = (Math.hypot(flat, dy) / (f.h.scale || 1)) * u;
  }
  // After every foes' turn the frogs swap lily pads (and popcorn on the Corn Society's hot floor swaps spots): each leaps
  // to another one's spot (two swap places, three go round one way or the other), so one named by where it stood may be
  // another one now. Each kind swaps among its own. Asleep, shy or friendly ones sit it out, and one alone has no one to swap with.
  async function frogsHop() {
    const groups = HOPPERS.map(k => G.foes.filter(f => f.species === k && f.alive && !f.gone && !f.calmed && !f.shy && !f.states.has('asleep') && !(f.spec && f.spec.giant))).filter(g => g.length >= 2);     // (a giant frog is too heavy to hop)
    if (!groups.length) return;
    ST.shot('wide');
    UI.tagRemove('pos:');                     // the where-words go while they're in the air
    emit('hop');
    await Promise.all(groups.map(list => {
      const pads = list.map(f => ({ hx: f.hx, hz: f.hz, yaw: f.baseYaw })), n = list.length;
      const shift = n === 2 || Math.random() < 0.5 ? 1 : n - 1;
      return Promise.all(list.map((f, i) => wait(i * 0.12).then(() => frogLeap(f, pads[(i + shift) % n], i))));
    }));
    G.stats.hops = (G.stats.hops || 0) + 1;
    refreshLabels();
    if (!G.swapTold) { G.swapTold = true; sideLine('swapped', 2.2, groups[0][0]); await wait(0.5); }
    await wait(0.2);
  }
  async function frogLeap(f, pad, i) {
    setMood(f, 'go', 1);
    await squash(f, 1.24, 0.72, 0.1);                       // a crouch…
    turnTo(f, yawTo(f, pad.hx, pad.hz), 0.12);
    ST.splash(f.x, f.z, 0.45);
    await arcTo(f, pad.hx, f.baseY || 0, pad.hz, 0.62, 0.8 + i * 0.42);   // …and a leap (each at its own height, so they pass)
    f.hx = pad.hx; f.hz = pad.hz; f.baseYaw = pad.yaw;
    squash(f, 1.3, 0.7, 0.06);
    ST.splash(f.x, f.z, 0.4); ST.perchDip(f.x, f.z);
    turnTo(f, f.baseYaw, 0.22);
  }

  // ------------------------------------------------------------ your turn
  function learnPop(id) {
    const p = ST.worldOf(A.mimo, 'top');
    UI.pop(p.clone().add(new THREE.Vector3(0, 0.4, 0)), '+ ' + showWord(id), G.t, { color: '#86f2e8', size: 24, rise: 0.7, life: 1.6 });
    A.mimo.glow = 1; tween(A.mimo, { glow: 0 }, 1.2);
    ST.S.fx.sparkle(p.x, p.y, p.z, 10, ['#7ff7ea', '#fff3a0']);
    emit('learn', { id });
  }
  function recordWords(r) {
    const s = G.stats;
    for (const id of r.words) { G.usage[id] = (G.usage[id] || 0) + 1; if (!id.startsWith('d.')) s.words.add(id); }
    for (const pat of r.patterns) s.patterns.add(pat);
    // every word you used is a retrieval for the language engine. A word only loses ground when it was itself wrong (playtest 5:
    // "he started forgetting the words for colors"): misspelled, or the wrong one (left for right, ser for estar). A slip in the
    // agreement (la rojo, el polilla) or elsewhere in the sentence is grammar, not that word: it never sets a known color back.
    const bad = new Set();
    const typos = d => { if (!d) return; for (const a of d.adjs || []) if (a && a.typo) for (const k of a.keys || [a.key]) bad.add('a.' + k); if (d.noun && d.noun.typo) bad.add('n.' + d.noun.key); if (d.pos && d.pos.typo) bad.add('p.' + d.pos.key); };
    for (const c of r.clauses || []) {
      typos(c.desc); typos(c.owner);
      if (c.part && c.part.typo) bad.add('n.' + c.part.key);
      if (c.errors.some(e => e.kind === 'serestar')) bad.add('r.estar');
      if (c.errors.some(e => e.kind === 'position')) for (const id of c.words) if (id.startsWith('p.')) bad.add(id);   // left for right
      if (c.verbTypo) bad.add('v.' + c.baseVerb);
    }
    const per = Math.max(800, (r.ms || 4000) / Math.max(1, r.words.length));
    for (const id of r.words) lexAttempt(id, { ok: !bad.has(id), hints: 0, ms: per, mode: r.kind === 'talk' ? 'talk' : 'command' });
    const learned = [];
    for (const u of r.untaught || []) { if (learned.includes(u.id)) continue; lexAttempt(u.id, { ok: true, ms: per, mode: 'command' }); if (knows(u.id)) learned.push(u.id); }
    return learned;
  }
  // Mimo can't tell which one you mean: «¿Cuál?» / «Qual?» / «Welcher?», a look from one look-alike to the next, a «?»
  async function hesitate(c) {
    const M = A.mimo, cands = P.order(c.ambiguous.cands.filter(f => f.alive && !f.gone));
    setMood(M, 'confused', 2.2);
    const [t, en] = line('whichOne', c.target);
    say(M, t, { cls: 'mimo', en, dur: 1.9 });
    emit('which');
    ST.shot('wide');
    for (const f of cands) { await turnTo(M, yawTo(M, f.x, f.z), 0.16); f.flash = 0.12; await wait(0.24); }
    UI.pop(ST.worldOf(M, 'top').add(new THREE.Vector3(0.1, 0.35, 0)), '?', G.t, { color: '#fff3a0', size: 36, rise: 0.4, life: 0.9 });
    await wait(0.3);
    turnTo(M, M.baseYaw, 0.15);
  }
  async function perform(r) {
    const s = G.stats;
    s.commands++;
    facing('foes');
    const key = r.kind === 'talk' ? P.tokenize(r.raw).map(t => t.n).join(' ') : r.key;
    s.cmdCounts[key] = (s.cmdCounts[key] || 0) + 1;
    tween(A.you, { point: 1 }, 0.15).then(() => wait(0.6)).then(() => tween(A.you, { point: 0 }, 0.3));
    say(A.you, r.raw, { cls: 'you', dur: 1.9 });
    const learned = recordWords(r);
    if (r.eat) { await doEat(r, learned); return; }
    if (r.kind === 'like') { frameUse(r.patterns); await doLike(r); G.badgePending = null; learned.forEach(learnPop); ST.shot('wide'); return; }     // (to a picky bee)
    if (r.kind === 'talk') {
      frameUse(r.patterns);
      countGrade(r); G.badgePending = r.grade;
      await doTalk(r);
      G.badgePending = null;
      learned.forEach(learnPop);
      if (!G.foes.some(f => f.shy && f.alive && !f.calmed)) { G.frames = G.frames.filter(f => f.pat !== 'talk'); renderFrames(); }
      return;
    }
    if (r.kind === 'tac') { frameUse(r.patterns || []); countGrade(r); G.badgePending = r.grade; await _.tac.perform(r); G.badgePending = null; learned.forEach(learnPop); return; }     // (talking them down, team orders: battle/tactics.js)
    // an echo bat throws a command you just said straight back at you (the Quarry Caves: echoBack, below)
    if (r.echo) { await echoBack(r); return; }
    // the same command twice in a row gets blocked: no hit, so no grade either
    if (r.repeat) {
      const f = r.clauses[0].target;
      await wait(0.45);
      say(f, line('catchOn')[0], { cls: 'foe', en: line('catchOn')[1], dur: 2.3 });
      setMood(A.mimo, 'sad', 1.6);
      UI.pop(ST.worldOf(f, 'top'), 'BLOCKED', G.t, { color: '#d9d1e2', size: 34 });
      squash(f, 1.15, 0.88, 0.1);
      s.blocked++;
      emit('blocked');
      await wait(1.3);
      return;
    }
    G.lastKey = r.key;
    (G.keyLog || (G.keyLog = [])).push(r.key);  // (what the echo bats remember)
    countGrade(r);
    G.badgePending = r.grade;                  // shown as the first hit lands (showGrade)
    const sugg = r.clauses.find(c => c.suggest);
    // two or more look the same and you didn't say which: Mimo looks from one to the other («¿Cuál?»), then guesses
    const amb = r.clauses.find(c => c.ambiguous);
    if (amb) await hesitate(amb);
    if (r.recast) noteMistake({ kind: 'grammar', typed: r.raw, right: r.canon, errors: [...new Set(r.errors.map(e => e.kind).concat(r.fixes || [], amb && !amb.ambiguous.untaught ? ['which'] : []))], grade: r.grade.letter, about: nounsOf(r) });
    if (r.recast) {
      say(A.mimo, P.recastHTML(r.canon, r.raw, UI.esc), { html: true, cls: 'mimo', dur: 2.8 });
      s.recasts++;
      emit('recast');
      await wait(1.15);
    } else if (sugg) {
      say(A.mimo, P.recastHTML((G.lang === 'es' ? '¿' : '') + sugg.suggest.replace(/^¡/, '').replace(/!$/, '?').replace(/！$/, '？'), r.raw, UI.esc), { html: true, cls: 'mimo', dur: 2.6 });
      await wait(1.0);
    } else {
      say(A.mimo, r.echoLine || P.wrapS(G.L, r.clauses[0].verbShow), { cls: 'mimo', dur: r.echoLine ? 1.8 : 1.1 });     // (echoLine: said back in a time realm's tense, battle/timebattle.js)
      await wait(0.35);
    }
    frameUse(r.patterns);
    for (const c of r.clauses) {
      if (!c.target.alive || c.target.gone) { if (c.auto) { const alt = targetable().filter(f => !f.shy)[0]; if (!alt) continue; c.target = alt; } else continue; }
      if (c.crit) s.crits++;
      await (c.tacRun ? c.tacRun(c) : MOVES[c.verb](c));     // (a counter, a rock, a combo's step: battle/tactics.js)
      if (c.target.shy && c.target.alive) await shyFlee(c.target);
      if (allDone()) break;
    }
    if (G.badgePending) showGrade(r.clauses[0].target);   // nothing landed (it was already gone): show it anyway
    await wait(0.12);
    await mimoReact(r.grade.letter);
    learned.forEach(learnPop);
    if (G.tutorial && !A.coach.hidden && !gradeTold()) {
      markGradeTold();
      await wait(0.3);
      ST.shot('wide');                       // the Coach and the letter, both in view
      await coachSay('gradeIntro', { look: r.clauses[0].target });
    }
    ST.shot('wide');
  }
  function countGrade(r) {
    const g = r.grade;
    if (!g) return;
    G.stats.grades[g.letter]++;
    G.stats.gradeLog.push({ text: r.raw, canon: r.canon, grade: g.letter, reason: g.reason, said: r.kind === 'command' ? Math.max(...r.clauses.map(c => c.said || 1)) : 1, words: (r.words || []).length });
    earn((COINS[g.letter] || 0) + (g.letter === 'S' && G.perks && G.perks.lucky ? 1 : 0));     // (Mimo's «Lucky ears», level 3: +1 for an S)
    if (g.letter === 'S' && G.perks && G.perks.lucky) G.stats.lucky = (G.stats.lucky || 0) + 1;
  }
  // coins: per graded command (S 3, A 2, B 1, C 1, D 0) and per foe beaten (2)
  function earn(n) { if (!n || G.practice) return; G.stats.coins += n; UI.coins(G.stats.coins, true); }   // (practice earns none)
  // the nouns a command was about, with their gender, for the mistakes review («das Gürteltier» is a das-word)
  function nounsOf(r) {
    const L = G.L, out = [];
    for (const c of r.clauses || []) {
      if (c.food) { const f = G.foods[c.food.id]; if (f) out.push({ w: f.w, g: f.g }); continue; }
      if (c.partKey) { const p = L.parts[c.partKey]; out.push({ w: p.w, g: p.g, art: p.artSg }); }
      if (c.target && !c.auto && L.species[c.target.species]) { const s = L.species[c.target.species]; out.push({ w: s.w, g: s.g }); }
    }
    return out.filter((x, i, a) => a.findIndex(y => y.w === x.w) === i);
  }
  // ------------------------------------------------------------ eating: Mimo takes food out of the bag, munches, and gets hearts back
  async function doEat(r, learned) {
    const s = G.stats, c = r.clauses[0], id = c.food.id, f = G.foods[id], M = A.mimo;
    countGrade(r);
    G.badgePending = r.grade;
    if (r.recast) {
      noteMistake({ kind: 'grammar', typed: r.raw, right: r.canon, errors: [...new Set(r.errors.map(e => e.kind).concat(r.fixes || []))], grade: r.grade.letter, about: nounsOf(r) });
      say(M, P.recastHTML(r.canon, r.raw, UI.esc), { html: true, cls: 'mimo', dur: 2.6 });
      s.recasts++; emit('recast');
      await wait(1.1);
    }
    frameUse(r.patterns);
    UI.tip(null);
    G.bag[id] = Math.max(0, (G.bag[id] || 0) - 1);
    s.used[id] = (s.used[id] || 0) + 1;
    refreshBag();
    ST.shot('focus', A.you, M, { up: 0.15, dist: 8.2 });
    setMood(M, 'happy', 3);
    const yaw = M.baseYaw + 0.5;
    turnTo(M, yaw, 0.2);
    const top = ST.worldOf(M, 'top');
    // it pops out of the bag and Mimo holds it up in front of its face
    const food = ST.prop(_.M.food(id));
    food.position.set(M.x + Math.sin(yaw) * 0.4, 0.66, M.z + Math.cos(yaw) * 0.4); food.scale.setScalar(0.01);
    ST.S.fx.puff(food.position.x, food.position.y, food.position.z, 5, 0.14, '#fff3d6');
    await tween(food.scale, { x: 1.7, y: 1.7, z: 1.7 }, 0.25, 'back');
    emit('eat', { id });
    say(M, line('munch')[0], { cls: 'mimo', en: line('munch')[1], dur: 1.9 });
    for (let i = 0; i < 3; i++) {                          // three bites
      await squash(M, 1.2, 0.82, 0.07);
      const k = 1.7 * (1 - (i + 1) / 3.3);
      tween(food.scale, { x: k, y: k, z: k }, 0.08);
      food.rotation.y += 0.9;
      ST.S.fx.puff(food.position.x, food.position.y - 0.1, food.position.z, 2, 0.08, '#f6e7c8');
      await wait(0.14);
    }
    ST.dropProp(food);
    UI.clearBubbles(M);
    const before = G.hearts;
    G.hearts = Math.min(G.maxHearts, G.hearts + f.heal + (G.perks && G.perks.snack ? 1 : 0));     // (Mimo's «Snack pouch», level 5: +1)
    const healed = G.hearts - before;
    s.healed += healed;
    UI.hearts(G.hearts, G.maxHearts, G.name, 'heal');
    if (healed > 0) UI.pop(top.clone().add(new THREE.Vector3(0.25, 0.35, 0)), `+${healed} ♥`, G.t, { color: '#9df0b4', size: 38, life: 1.4 });     // (full, with a food that does something else: no «+0»)
    ST.S.fx.sparkle(top.x, top.y, top.z, 16, ['#9df0b4', '#ffd6e2', '#fff3a0']);
    emit('heal', { amount: healed, hearts: G.hearts });
    showGrade(M);                                          // (on Mimo's left: its bubbles open to the right)
    await arcTo(M, M.hx, 0, M.hz, 0.36, 0.5);
    squash(M, 1.2, 0.8, 0.06);
    turnTo(M, M.baseYaw, 0.2);
    say(M, line('yum')[0], { cls: 'mimo', en: line('yum')[1], dur: 1.6 });
    await wait(0.5);
    await mimoReact(r.grade.letter);
    learned.forEach(learnPop);
    ST.shot('wide');
  }
  // The first time you're hurt with food in the bag and Mimo doesn't know «come», the Coach teaches it
  // (hopping in if this fight had no Coach). If Mimo knows it already, a tip and a frame are enough.
  async function maybeFood() {
    const hurt = G.hearts < G.maxHearts, foods = bagFoods();
    if (!hurt || !foods.length) return;
    if (!knows('v.eat')) { if (!G.eatTold) await lessonEat(); return; }
    if (!G.eatTip && G.hearts <= G.maxHearts - 2) {
      G.eatTip = true;
      addFrame({ text: eatSentence(bestFood()), pat: 'eat' });
      if (!G.tutorial) UI.tip(fill(G.L.tips.eat));
    }
  }
  async function lessonEat() {
    G.eatTold = true;
    const id = bestFood(), M = A.mimo, rung0 = UI.U.e.rung.innerHTML;
    // Mimo looks hungry: a rumble, a droop, a glance at the bag
    ST.shot('party');
    setMood(M, 'sad', 2.4);
    UI.pop(ST.worldOf(M, 'mid').add(new THREE.Vector3(0.35, 0.1, 0)), 'grrr…', G.t, { color: '#ffe3b0', size: 26, rise: 0.45, life: 1.5 });
    say(M, '…', { cls: 'mimo', dur: 1.4 });
    await squash(M, 1.12, 0.88, 0.12);
    await wait(0.9);
    if (A.coach.hidden) await coachIn();
    UI.rung('Lesson · <b>eat</b>');
    await teachWord('v.eat', { demo: 'eat', intro: 'hungry', echoKey: 'echoEat' });
    ST.shot('wide');
    const ex = eatSentence(id);
    await coachSay(G.L.sayEx(ex));
    addFrame({ text: ex, pat: 'eat' });
    G.eatTip = true;
    if (G.tutorial) UI.rung(rung0); else rungPill();
    if (!G.tutorial) UI.tip(fill(G.L.tips.eat));
  }
  // the Coach hops in from the side (fights out in the world have no Coach until one is needed)
  async function coachIn() {
    const C = A.coach;
    C.hidden = false; C.x = C.hx - 5; C.z = C.hz + 0.3; C.y = 0; C.yaw = Math.PI / 2;
    ST.shot('coach');
    await arcTo(C, C.hx - 2.4, 0, C.hz + 0.15, 0.36, 0.6); squash(C, 1.2, 0.8, 0.06);
    await arcTo(C, C.hx, 0, C.hz, 0.36, 0.5); squash(C, 1.2, 0.8, 0.06);
    ST.S.fx.puff(C.x, 0, C.z, 6, 0.2);
    await turnTo(C, C.baseYaw, 0.2);
    G.facing = null;
    await wait(0.15);
  }
  async function doTalk(r) {
    const shy = G.foes.find(f => f.alive && f.shy && !f.calmed);
    if (!shy) { UI.toast('Nobody here wants to talk right now.', G.t); await wait(0.8); return; }
    ST.shot('action', A.mimo, shy, { yaw: -0.05 });
    if (r.recast) { say(A.mimo, P.recastHTML(r.canon, r.raw, UI.esc), { html: true, cls: 'mimo', dur: 2.6 }); G.stats.recasts++; noteMistake({ kind: 'grammar', typed: r.raw, right: r.canon, errors: [...new Set(r.errors.map(e => e.kind).concat(r.fixes || []))], grade: r.grade && r.grade.letter }); }
    await wait(0.9);
    showGrade(shy, { right: true });
    // each new kind sentence calms it a step; it takes two different ones
    const fresh = r.ids.filter(id => !shy.heard.has(id));
    fresh.forEach(id => shy.heard.add(id));
    if (!fresh.length) { say(shy, line('shyAgain')[0], { cls: 'foe', dur: 1.3 }); await wait(0.9); return; }
    shy.calm++;
    if (shy.calm >= 2) {
      say(shy, line('shyJoin')[0], { cls: 'foe', en: line('shyJoin')[1], dur: 2.2 });
      shy.calmed = true; shy.alive = false; shy.befriended = true; G.stats.befriended++;     // (befriended: the bestiary counts it)
      G.stats.beaten++; earn(COINS_FOE);       // talked down counts as beaten
      UI.labelRemove(shy);
      emit('befriend');
      setMood(shy, 'happy');
      tween(shy, { tint: 1 }, 1.2, 'io');
      const p = ST.worldOf(shy, 'top');
      ST.S.fx.sparkle(p.x, p.y, p.z, 24, ['#ffd166', '#ff9bb3', '#a8f0c0']);
      ST.note(p);
      updateStain();
      await wait(1.2);
      say(shy, line('shyVoice')[0], { cls: 'foe', en: line('shyVoice')[1], dur: 2.4 });
      await wait(0.7);
      shy.hx = -2.85; shy.hz = -0.85; shy.baseYaw = Math.PI / 2 - 0.2;
      for (let i = 0; i < 3; i++) {
        const u = (i + 1) / 3;
        await arcTo(shy, lerp(shy.x, shy.hx, u / (u + (1 - u) * 0.5)), 0, lerp(shy.z, shy.hz, u), 0.42, i === 0 ? 1.6 : 0.8);
        squash(shy, 1.2, 0.8, 0.05);
      }
      shy.x = shy.hx; shy.z = shy.hz;
      turnTo(shy, shy.baseYaw, 0.2);
      setMood(A.mimo, 'happy', 2);
      await wait(0.4);
    } else {
      say(shy, line('shyReally')[0], { cls: 'foe', en: line('shyReally')[1], dur: 2.1 });
      squash(shy, 1.1, 0.9); shy.armUp = 1; tween(shy, { armUp: 0 }, 1);
      await wait(1.0);
    }
  }
  async function shyFlee(f) {
    say(f, line('shyScared')[0], { cls: 'foe', en: line('shyScared')[1], dur: 1.8 });
    await wait(0.5);
    f.alive = false; f.gone = true;
    UI.labelRemove(f);
    turnTo(f, Math.PI / 2, 0.1);
    for (let i = 0; i < 3; i++) await arcTo(f, f.x + 2.6, f.baseY || 0, f.z + 0.4, 0.28, 0.4);
    f.hidden = true;
    sideLine('poorShy', 1.8, f);
    updateStain();
  }
  const allDone = () => G.foes.length > 0 && G.foes.every(f => !f.alive || f.calmed || f.gone);

  // ------------------------------------------------------------ the fight loop
  async function fightLoop(cfg = {}) {
    G.lastKey = null; G.keyLog = [];
    for (;;) {
      G.turn++;
      updateWeak(); pickGlow(); refreshLabels();
      await maybeFood();                      // hurt, with food in the bag: the Coach teaches «come» (once)
      if (_.tac && _.tac.turn) await _.tac.turn();     // (a foe tells you what it's about to do: battle/tactics.js)
      if (allDone()) return 'win';            // (moves planned in the Future land at the start of your turn: battle/timebattle.js)
      const r = await askOrFlee('command');
      await perform(r);
      if (G.practice) practiceFeedback(r);    // the coach: «¡Perfecto!» / «¡Muy bien!» / «¡Casi!», and the why
      if (G.tacOut) return G.tacOut;          // (you talked your way out: battle/tactics.js)
      if (allDone()) return 'win';
      if (cfg.beforeFoes) await cfg.beforeFoes(G.turn);
      await foePhase();
      if (G.hearts <= 0) {
        if (!cfg.tutorial) return 'lose';
        await coachSay('retry');
        G.hearts = G.maxHearts; UI.hearts(G.hearts, G.maxHearts, G.name);
      }
      if (allDone()) return 'win';
      if (_.tac && _.tac.afterFoes) await _.tac.afterFoes();
      await frogsHop();                       // the frogs hop to other lily pads: where they were isn't where they are
      await snowGrow();                       // snowballs nobody hit this round grow a size (the Frost Peaks)
      if (cfg.afterFoes) await cfg.afterFoes(G.turn);
      ST.shot('wide');
    }
  }
  async function foesEnter() {
    facing('foes');
    await Promise.all(G.foes.map((f, i) => wait(i * 0.16).then(() => hopIn(f))));
    refreshLabels();
  }
  async function hopIn(f) {
    const x0 = f.x, x1 = f.hx;
    f.hidden = false;
    if (f.species === 'dummy') {               // the coach sets it up: it drops onto its spot with a thud, and rocks
      f.x = x1; f.z = f.hz; f.y = 2.8; f.sx = 0.9; f.sy = 1.12;
      await tween(f, { y: 0 }, 0.42, 'in');
      f.y = 0;
      squash(f, 1.25, 0.76, 0.07);
      f.wobVZ = (f.wobVZ || 0) + (Math.random() < 0.5 ? -3.5 : 3.5);
      ST.S.fx.puff(f.x, 0, f.z, 7, 0.22); ST.shake(0.18, 0.2);
      emit('drop');
      return;
    }
    if (f.species === 'armadillo') {           // it rolls in as a ball
      await rollTo(f, x1, f.hz, 0.9);
      squash(f, 1.2, 0.82);
      ST.S.fx.puff(f.x, 0, f.z, 5, 0.2);
      return;
    }
    await along(0.8, u => {
      f.x = lerp(x0, x1, u);
      f.y = f.baseY + Math.abs(Math.sin(u * Math.PI * 3)) * 0.5 * (1 - u * 0.6);
      f.sy = 1 + Math.sin(u * Math.PI * 6) * 0.12; f.sx = 1 - Math.sin(u * Math.PI * 6) * 0.08;
    });
    f.x = x1; f.y = f.baseY; f.sx = f.sy = 1;
    squash(f, 1.25, 0.78);
    ST.S.fx.puff(f.x, 0, f.z, 5, 0.2);
  }
  async function intro(o = {}) {
    UI.hearts(G.hearts, G.maxHearts, G.name);
    ST.shot(o.shot || 'wide', null, null, { k: 2.2 });
    setMood(A.mimo, 'perk', 1.2);
    squash(A.mimo, 1.2, 0.8, 0.07).then(() => arcTo(A.mimo, A.mimo.hx, 0, A.mimo.hz, 0.4, 0.6)).then(() => squash(A.mimo, 1.2, 0.8, 0.06));
    if (o.foes === false) { await wait(0.6); return; }
    await wait(0.35);
    await foesEnter();
    await wait(0.25);
  }

  // ------------------------------------------------------------ the Coach's lessons
  const teachTip = () => `Teach ${UI.esc(G.name)}: type the word from memory, with only the picture to go on. Stuck? <kbd>Tab</kbd> gives a hint (first letter → more letters → the word). Using a hint brings the word back sooner.`;
  async function coachDemo(verb) {
    const C = A.coach;
    if (verb === 'jump') {
      await tween(C, { sx: 1.2, sy: 0.78 }, 0.12);
      tween(C, { sx: 0.88, sy: 1.15 }, 0.08).then(() => tween(C, { sx: 1, sy: 1 }, 0.3));
      await arcTo(C, C.hx, 0, C.hz, 0.55, 1.1);
      squash(C, 1.25, 0.78, 0.07);
      ST.S.fx.puff(C.x, 0, C.z, 6, 0.2);
    } else if (verb === 'push') {
      // leans in and shoves the air with both arms
      await tween(C, { lean: -0.22, sx: 1.06, sy: 0.95 }, 0.18);
      await tween(C, { lean: 0.32, punch: 1, cheer: 0.25, x: C.hx + 0.55, sx: 0.95, sy: 1.05 }, 0.12, 'in');
      const hands = new THREE.Vector3(C.x + 0.9, 1.0, C.z + 0.3);
      ST.S.fx.puff(hands.x, hands.y - 0.3, hands.z, 6, 0.18); ST.star(hands, '#ffffff', 0.6); ST.shake(0.22);
      await wait(0.28);
      await tween(C, { lean: 0, punch: 0, cheer: 0, x: C.hx, sx: 1, sy: 1 }, 0.32, 'back');
    } else if (verb === 'eat') {
      // a pretend snack: hand to mouth, three big bites
      await tween(C, { point: 0.85 }, 0.16);
      for (let i = 0; i < 3; i++) { await tween(C, { sy: 0.9, sx: 1.06 }, 0.07); await tween(C, { sy: 1, sx: 1 }, 0.09); }
      say(C, line('yum')[0], { cls: 'coach', en: line('yum')[1], dur: 1.4 });
      await tween(C, { point: 0 }, 0.2);
    } else {
      await tween(C, { lean: -0.2, punch: 0 }, 0.14);
      const fist = new THREE.Vector3(C.x + 0.9, 1.1, C.z + 0.3);
      await tween(C, { lean: 0.25, punch: 1, x: C.hx + 0.35 }, 0.1, 'in');
      ST.star(fist, '#ffffff', 0.7); ST.S.fx.puff(fist.x, fist.y - 0.2, fist.z, 4, 0.14); ST.shake(0.25);
      await wait(0.2);
      await tween(C, { lean: 0, punch: 0, x: C.hx }, 0.3, 'back');
    }
  }
  // the accepted form you typed («brinca» for jump), so Mimo says back your word; else the usual one
  function formTyped(id, text) {
    if (!text) return showWord(id);
    const n = P.tokenize(text).filter(t => !G.voc.has(t.n) && !G.L.I.voc.has(t.n)).map(t => t.n).join(' ');
    return teachForms(id).find(f => P.tokenize(f).map(t => t.n).join(' ') === n) || showWord(id);
  }
  async function mimoLearn(id, typed) {
    const M = A.mimo, w = formTyped(id, typed), other = w !== showWord(id);
    M.glow = 1; tween(M, { glow: 0 }, 1.8);
    setMood(M, 'happy', 2.2);
    const p = ST.worldOf(M, 'top');
    ST.S.fx.sparkle(p.x, p.y, p.z, 22, ['#7ff7ea', '#fff3a0']);
    emit('learn', { id });
    await squash(M, 1.25, 0.75, 0.07);
    if (id === 'v.hit') { M.earWhip = -2.4; await tween(M, { lean: 0.55 }, 0.1); M.earWhip = 0; await tween(M, { lean: 0 }, 0.18); }
    else if (id === 'v.push') { M.earWhip = 0.8; await tween(M, { lean: -0.3 }, 0.14); M.earWhip = -2.2; await tween(M, { lean: 0.6 }, 0.09); M.earWhip = 0; await tween(M, { lean: 0 }, 0.2); }
    else if (id === 'v.eat') { for (let i = 0; i < 2; i++) await squash(M, 1.16, 0.85, 0.07); }
    else await arcTo(M, M.hx, 0, M.hz, id === 'v.jump' ? 0.5 : 0.35, id === 'v.jump' ? 1.1 : 0.5);
    squash(M, 1.2, 0.8, 0.06);
    say(M, P.wrapS(G.L, w), { cls: 'mimo', dur: 2.2 });
    UI.toast(`${UI.esc(G.name)} learned «${UI.esc(w)}»${other ? ` (it also knows «${UI.esc(showWord(id))}»)` : ''}`, G.t);
    await wait(1.1);
  }
  async function teachWord(id, o) {
    if (o.demo) { ST.shot('coach'); await coachWhile(o.intro, () => coachDemo(o.demo)); }
    else if (o.intro) await coachSay(o.intro, { look: o.look });
    if (o.echoKey) await coachSay(o.echoKey);
    await askOrFlee('echo', { answer: showWord(id), id });
    await coachSay(o.teachKey || 'teach');
    UI.tip(teachTip());
    ST.shot('party');
    const typed = await askOrFlee('teach', { id, expect: showWord(id), verb: id.split('.')[1] });
    UI.tip(null);
    await mimoLearn(id, typeof typed === 'string' ? typed : null);
  }
  async function lessonVerbs() {
    UI.rung('Lesson · <b>actions</b>');
    ST.shot('coach', null, null, { k: 2.2 });
    await intro({ foes: false, shot: 'coach' });
    await coachSay('hello');
    if (!knows('v.jump')) {
      await teachWord('v.jump', { demo: 'jump', intro: 'watchJump', echoKey: 'echoJump' });
      await coachSay('firstWord');
    }
    ST.shot('wide');
    await foesEnter();
    await coachSay('foeIn');
    UI.tip(`Type the action and press <kbd>Enter</kbd>. When ${UI.esc(G.name)} lands its hit, press <kbd>Space</kbd> right on the impact: PERFECT = +1 damage.`);
    let taughtHit = knows('v.hit');
    G.winLine = 'winVerbs';
    return fightLoop({
      tutorial: true,
      beforeFoes: async turn => { if (turn === 1) { UI.tip(dodgeTip()); ST.shot('coach'); await coachSay('listen'); } },
      afterFoes: async () => {
        if (taughtHit) return;
        taughtHit = true;
        UI.tip(null);
        await teachWord('v.hit', { demo: 'hit', intro: 'newHit', echoKey: 'echoHit' });
        await coachSay('twoWords');
        UI.tip('Foes catch on: the exact same command twice in a row gets blocked. Mix your words up.');
      },
    });
  }
  async function lessonTargets() {
    UI.rung('Lesson · <b>colors</b>');
    await intro({ shot: 'wide' });
    const red = G.foes.find(f => f.color === 'red') || G.foes[0], blue = G.foes.find(f => f.color === 'blue') || G.foes[1] || G.foes[0];
    ST.shot('focus', A.coach, red);
    await coachSay('twoFoes', { look: red });
    if (!knows('a.red')) await teachWord('a.red', { echoKey: 'echoRed', teachKey: 'teachColor' });
    ST.shot('focus', A.coach, blue);
    await coachSay('twoFoesB', { look: blue });
    if (!knows('a.blue')) await teachWord('a.blue', { echoKey: 'echoBlue', teachKey: 'teachColor' });
    ST.shot('wide');
    await coachSay('sayWho');
    setFrames(['jumpT', 'hitT']);
    UI.tip(G.L.tips.target);
    G.winLine = 'winTargets';
    return fightLoop({ tutorial: true });
  }
  async function lessonParts() {
    UI.rung('Lesson · <b>body parts</b>');
    await intro({ shot: 'wide' });
    const big = G.foes.find(f => f.species === 'hushbig') || G.foes[0];
    G.showWeak = true; big.weak = 'tail'; updateWeak(); refreshLabels();
    await coachSay('bigOne', { look: big });
    ST.shot('focus', big, null, { up: 0.6, dist: 7 });
    await coachSay('lookTail', { look: big });
    if (!knows('n.tail')) await teachWord('n.tail', { echoKey: 'echoTail', teachKey: 'teachWord' });
    ST.shot('wide');
    await coachSay('sayPart');
    setFrames(['partT']);
    UI.tip(G.L.tips.parts + ' The glowing part is the weak spot (×2).');
    G.winLine = 'winParts';
    return fightLoop({
      tutorial: true,
      afterFoes: async () => {
        if (big.alive && big.weak === 'head' && !knows('n.head')) {
          ST.shot('focus', big, null, { up: 0.8, dist: 7 });
          await coachSay('weakMoves', { look: big });
          await teachWord('n.head', { intro: 'lookHead', echoKey: null, teachKey: 'teachWord' });
        }
      },
    });
  }

  // ------------------------------------------------------------ win / lose / flee
  async function winScene() {
    emit('win');
    UI.promptHide(); UI.dodge(null); UI.tip(null); UI.rung(null); UI.frames([]); UI.tagRemove('');
    G.glow = null;
    ST.shot('win');
    tween(ST.S.arena.uni.uStain, { value: 0 }, 1.6, 'io');
    if (ST.S.arena.uni.uHeat) tween(ST.S.arena.uni.uHeat, { value: 0 }, 1.6, 'io');   // the hall's floor cools down
    for (let i = 0; i < 7; i++) wait(i * 0.13).then(() => { const x = 0.5 + Math.random() * 4, z = -1.8 + Math.random() * 3.4; ST.S.fx.sparkle(x, 0.2, z, 10, ['#fff3a0', '#a8f0c0', '#ffd166']); });
    setMood(A.mimo, 'happy', 4); setMood(A.you, 'happy', 4);
    tween(A.you, { cheer: 1 }, 0.25, 'back');
    if (!A.coach.hidden) tween(A.coach, { cheer: 1 }, 0.25, 'back');
    for (let i = 0; i < 2; i++) { await squash(A.mimo, 1.25, 0.76, 0.06); await arcTo(A.mimo, A.mimo.hx, 0, A.mimo.hz, 0.42, 0.85); }
    squash(A.mimo, 1.2, 0.8, 0.06);
    mimoLine('win', 2.4);
    await wait(1.3);
    if (G.winLine && !A.coach.hidden) { ST.shot('coach'); await coachSay(G.winLine); ST.shot('win'); }
    // the colonel, white flag and all: «¿No son del Hush? ¡Pero ustedes hablan! ¡Qué valientes!»
    if (G.boss && G.boss.f) {
      const f = G.boss.f, [t, en] = line('bossAfter');
      ST.shot('focus', A.mimo, f, { up: 0.5, dist: 8.5 });
      setMood(f, 'happy', 5);
      say(f, t, { cls: 'foe', en, dur: 3.4 });
      emit('boss-after');
      await wait(2.8);
      ST.shot('win');
    }
    // the giant armadillo, free of the Hush: «¡Qué sueño tan feo! ¡Gracias!»
    if (G.arma && G.arma.f.calmed) {
      const f = G.arma.f;
      ST.shot('focus', A.mimo, f, { up: 0.9, dist: 10 });
      setMood(f, 'happy', 5);
      armaSay('armaAfter', 3.6, 'foe');
      emit('boss-after', { foe: f });
      await squash(f, 1.12, 0.9, 0.1);
      await wait(3.0);
      ST.shot('win');
    }
  }
  async function loseScene() {
    emit('lose');
    UI.promptHide(); UI.dodge(null); UI.tip(null); UI.tagRemove(''); UI.rung(null); UI.frames([]);
    G.foes.forEach(f => UI.labelRemove(f));
    ST.shot('win');
    setMood(A.mimo, 'sad', 6); setMood(A.you, 'hurt', 6);
    tween(A.you, { sy: 0.82, lean: -0.25 }, 0.4, 'out');
    tween(A.mimo, { sy: 0.7, sx: 1.2 }, 0.4, 'out');
    mimoLine('lose', 2.6);
    await wait(1.6);
  }
  async function fleeScene() {
    emit('flee');
    UI.promptHide(); UI.dodge(null); UI.tip(null); UI.tagRemove(''); UI.rung(null); UI.frames([]); G.foes.forEach(f => UI.labelRemove(f));
    ST.shot('flee');
    mimoLine('flee', 1.6);
    for (const st of [A.you, A.mimo]) { turnTo(st, -Math.PI / 2, 0.15); st.run = true; }
    await wait(0.2);
    await along(0.9, u => {
      for (const st of [A.you, A.mimo]) { st.x = st.hx - u * 9; st.y = Math.abs(Math.sin(u * Math.PI * 6)) * 0.12; }
      if (Math.random() < 0.3) ST.S.fx.puff(A.you.x + 0.3, 0, A.you.z, 1, 0.14);
    });
    A.you.run = false;
  }
  // the best sentence of the fight: the best grade, then the most precise, then the richest, then the latest
  function bestCommand() {
    const log = G.stats.gradeLog;
    if (!log.length) return null;
    const b = log.map((x, i) => ({ x, i })).sort((p, q) => (GRADES[q.x.grade].score - GRADES[p.x.grade].score) || (q.x.said - p.x.said) || (q.x.words - p.x.words) || (q.i - p.i))[0].x;
    return { text: b.text, canon: b.canon, grade: b.grade };
  }
  // the whole fight's grade: the average, rounded so an S needs mostly S's
  function battleGrade() {
    const log = G.stats.gradeLog;
    if (!log.length) return null;
    const avg = log.reduce((a, x) => a + GRADES[x.grade].score, 0) / log.length;
    return ['D', 'C', 'B', 'A', 'S'][clamp(Math.floor(avg + 0.4), 0, 4)];
  }
  function results(outcome) {
    const s = G.stats;
    const counts = Object.entries(s.cmdCounts).sort((a, b) => b[1] - a[1]);
    const top = counts[0] || ['', 0];
    // practice: the grades of the whole session up front ({ S, A, B, C, D }), how many rounds, which focus;
    // the boss: whether he gave up, how far it got
    const extra = G.practice ? { grades: Object.assign({}, s.grades), rounds: G.round, focus: G.focus }
      : G.boss ? { boss: { kind: 'corn', surrendered: !!(G.boss.f && G.boss.f.calmed), phase: G.boss.phase, squads: G.boss.squads, popped: G.boss.popped || 0 } }
        : G.arma ? { boss: { kind: 'armadillo', phase: G.arma.phase, freed: !!G.arma.f.calmed } } : {};
    // the rewards (battle/rewards.js): what the card showed, for the game and for tests
    if (G.settled && typeof G.settled === 'object') extra.rewards = G.settled.summary || null;
    extra.freed = (G.freed || []).map(w => w.id);
    return {
      outcome,
      ...extra,
      stats: {
        outputs: s.outputs, words: s.words.size, patterns: s.patterns.size, perfect: s.perfect, hints: s.hints,
        wordList: [...s.words], patternList: [...s.patterns], commands: s.commands, recasts: s.recasts, crits: s.crits,
        counters: s.counters, befriended: s.befriended, blocked: s.blocked, turns: G.turn, damage: s.damage, team: s.team || 0, talked: s.talked || 0,     // (team orders: the marsh's drill reads it; talked down: battle/tactics.js)
        topCommand: top[0], topShare: s.commands ? Math.round((top[1] / s.commands) * 100) : 0, seconds: +(G.t - s.t0).toFixed(1), tier: G.tier,
        mistakes: (G.mistakes || []).map(m => ({ kind: m.kind, typed: m.typed, right: m.right || null, errors: m.errors || [], times: m.times, grade: m.grade || null })),
        // the attack rating: how many of each grade, the best sentence and the whole fight's grade
        grades: Object.assign({}, s.grades), best: bestCommand(), battleGrade: battleGrade(),
        gradeLog: s.gradeLog.map(x => ({ text: x.text, grade: x.grade, reason: x.reason })),
        // coins earned (per graded command, per foe beaten); food eaten (id → count), what's left, hearts it gave back
        coins: s.coins, used: Object.assign({}, s.used), bag: Object.assign({}, G.bag), healed: s.healed, beaten: s.beaten,
        dodgeMissed: s.dodgeMissed || 0, bounced: s.bounced || 0, lucky: s.lucky || 0,
        hearts: G.hearts, maxHearts: G.maxHearts, lvHealed: G.lvHealed || 0,     // (the hearts it ends with carry over to the next fight: js/hearts.js)
      },
    };
  }
  // ------------------------------------------------------------ mistakes, for the review after the battle (DESIGN.md 12.7)
  // m: { kind: 'grammar' (it worked, with slips) | 'teach' | 'echo' | a parse failure reason, typed, right, errors, word, id }
  function noteMistake(m) {
    if (!G.mistakes) G.mistakes = [];
    const same = G.mistakes.find(x => x.kind === m.kind && P.nrm(x.typed) === P.nrm(m.typed) && (x.right || '') === (m.right || ''));
    if (same) { same.times++; return; }
    G.mistakes.push(Object.assign({ times: 1 }, m));
  }
  // «das Gürteltier» is a das-word (neuter); «la manzana» is feminine
  function genderNote(n) {
    const g = n.g, A = { es: { m: 'el', f: 'la' }, pt: { m: 'o', f: 'a' }, de: { m: 'der', f: 'die', n: 'das' } }[G.lang];
    const art = n.art || A[g] || '', kind = g === 'f' ? 'feminine' : g === 'n' ? 'neuter' : 'masculine';
    return G.lang === 'de' ? `«${UI.esc(art)} ${UI.esc(n.w)}» is a ${art}-word (${kind}).` : `«${UI.esc(art)} ${UI.esc(n.w)}» is ${kind}.`;
  }
  // Why it was wrong, in plain English with examples in the language.
  function whyOf(m) {
    const L = G.L, W = L.why || {}, name = UI.esc(G.name), q = s => `«${UI.esc(s)}»`;
    const verb = showWord('v.' + (knownVerbs()[0] || 'jump'));
    switch (m.kind) {
      case 'grammar': {
        const lines = (m.errors || []).map(k => W[k]).filter(Boolean);
        // a gender slip says which word, and what it is
        if ((m.errors || []).includes('gender') && m.about && m.about.length) lines.unshift(m.about.map(genderNote).join(' '));
        return lines;
      }
      case 'pushPart': return [`${q(showWord('v.push'))} moves the whole creature: say who, not which part, like ${q(pushExample())}.`];
      case 'tucked': return [`A rolled-up armadillo has its head and tail tucked in. Push it onto its back first (${q(pushExample())}); then its head, tail and belly are out.`];
      case 'eatWhat': return [`Say what ${name} should eat, with its article: ${q(eatExample())}.`];
      case 'notFood': return [`${name} only eats food from the bag, like ${q(eatExample())}.`];
      case 'foodVerb': return [`Food goes with ${q(showWord('v.eat'))}: ${q(eatExample())}.`];
      case 'eatCombo': return ['Eating takes the whole turn, so it goes on its own, without «and then».'];
      case 'teach': {
        const en = (hasLEX() && m.id && LEX.item(m.id) && LEX.item(m.id).en) || '';
        const close = P.near1 && P.near1(P.nrm(m.typed), P.nrm(m.right));
        return [(close ? 'Almost: one letter was off. ' : '') + `The word${en ? ` for “${UI.esc(en)}”` : ''} is ${q(m.right)}.`];
      }
      case 'echo': return [`Copy it exactly, letter for letter: ${q(m.right)}.`];
      case 'unknown': return [`${q(m.word)} isn’t a word ${name} knows yet. Use the words in the frames at the bottom of the screen.`];
      case 'noverb': return [`Every command starts with an action ${name} knows, like ${q(verb)}.`];
      case 'which': return [`More than one of them matched. Say which one with its color or size, like ${q(L.examples[2])}, or where it is (left, middle or right).`];
      case 'none': return [W.none || 'None of the Hushlings in this fight looked like that. Their colors and sizes are on their labels.'];
      case 'nopart': return ['None of them had that part. The glowing part is shown on its label.'];
      case 'throwWhat': return [W.throwWhat || 'Say what to throw.'];
      default: return [];
    }
  }
  function mistakesHTML() {
    const list = G.mistakes || [];
    const nice = { es: '¡Perfecto!', pt: 'Perfeito!', de: 'Perfekt!' }[G.lang] || G.L.nice || 'Perfect!';
    if (!list.length) return `<div class="mist-none">No mistakes this fight. ${nice}</div>`;
    const shown = list.slice(0, 8);
    return `<div class="mist-head">Your mistakes, and why</div><div class="mists">` + shown.map(m => {
      const better = m.right ? (m.kind === 'grammar' ? P.recastHTML(m.right, m.typed, UI.esc) : `«${UI.esc(m.right)}»`) : '';
      const why = whyOf(m).map(w => `<li>${w}</li>`).join('');
      return `<div class="mist"><div class="m-you">You typed: «${UI.esc(m.typed)}»${m.grade ? ` <span class="gc g${m.grade}">${m.grade}</span>` : ''}${m.times > 1 ? ` <span class="m-x">×${m.times}</span>` : ''}</div>`
        + (better ? `<div class="m-ok">${m.kind === 'grammar' ? 'Better' : 'Right'}: ${better}</div>` : '') + (why ? `<ul class="m-why">${why}</ul>` : '') + '</div>';
    }).join('') + (list.length > shown.length ? `<div class="m-more">…and ${list.length - shown.length} more</div>` : '') + '</div>';
  }
  // one compact row: the fight's grade, how many of each, and your best sentence
  function gradesHTML(r, what = 'fight') {
    const n = Object.values(r.grades).reduce((a, b) => a + b, 0);
    if (!n) return '';
    const counts = ['S', 'A', 'B', 'C', 'D'].filter(k => r.grades[k]).map(k => `<span class="gc g${k}">${k}<small>×${r.grades[k]}</small></span>`).join('');
    const best = r.best ? `<div class="gr-best"><span class="lbl">Best</span> «${UI.esc(r.best.text)}» <span class="gc g${r.best.grade}">${r.best.grade}</span></div>` : '';
    return `<div class="bt-grades"><div class="gb-all g${r.battleGrade}"><b>${r.battleGrade}</b><small>${what}</small></div><div class="gr-info"><div class="gr-counts"><span class="lbl">Grades</span>${counts}</div>${best}</div></div>`;
  }
  // The coin word in the language («monedas», «moedas», «Münzen»), woven like the game's lines: the word
  // in the language with its English on hover, and a small gloss the first few times (LEX.wv, if the game
  // has a coin word; else while the weave is low).
  function coinWordHTML(n) {
    const C = G.L.coins || { one: 'coin', many: 'coins' }, en = n === 1 ? 'coin' : 'coins';
    const id = hasLEX() ? ['w.coin', 'c.coin', 'w.coins', 'c.coins'].find(x => LEX.item(x) && LEX.item(x)[G.lang]) : null;
    const it = id ? LEX.item(id) : null;
    const word = it ? (n === 1 ? it[G.lang] : (it.pl && it.pl[G.lang]) || it[G.lang]) : n === 1 ? C.one : C.many;
    // the first 3 cards (counted on the game's coin word, or on 'x.coins' kept with the save), or while the weave is low
    const key = id || 'x.coins', times = hasLEX() ? (id && LEX.wv ? LEX.wv(id) : LEX.st(key).wv || 0) : 3;
    const fresh = times < 3 || weaveLevel() < 0.62;
    if (hasLEX()) { if (id && LEX.woven) LEX.woven(id); else LEX.st(key).wv = times + 1; }
    return `<span class="g" data-g="${en}">${UI.esc(word)}</span>${fresh ? `<span class="gl">(${en})</span>` : ''}`;
  }
  async function showResult(outcome) {
    // the rewards first (battle/rewards.js): bonus coins, drops into the bag, Mimo's XP and level, the bestiary; kept with the save
    let rw = null;
    if (_.RW && _.RW.settle && !G.practice && !G.settled) { try { rw = G.settled = _.RW.settle(outcome, G); } catch (e) { console.error('[battle] rewards', e); } }
    if (rw && rw.levelUps && rw.levelUps.length) await levelUpScene(rw);
    const r = results(outcome).stats;
    const row = (k, v) => `<tr><td>${k}</td><td>${v}</td></tr>`;
    const title = outcome === 'win' ? 'You won!' : 'Time for a rest';
    const sub = outcome === 'win' ? (G.boss ? 'Colonel Cob gave up: you spoke up, and the Corn Society is on your side now.'
      : G.arma ? 'The Hush let go of the giant armadillo. The bell is free!' : `${UI.esc(G.name)} learned from every word you used.`)
      : 'No harm done. Try again with different words.';
    // the coins, and where they came from: better sentences pay more (S 3 · A 2 · B 1 · C 1), and so does each foe
    const gaveUp = (G.boss && G.boss.f && G.boss.f.calmed) || (G.arma && G.arma.f.calmed) ? 1 : 0, foesN = r.beaten - gaveUp;   // (a boss is worth more)
    const why = ['S', 'A', 'B', 'C'].filter(k => r.grades[k] && COINS[k]).map(k => `<span class="gc g${k}">${k}<small>×${r.grades[k]}</small></span> +${r.grades[k] * COINS[k]}`)
      .concat(foesN ? [`${foesN} beaten +${foesN * COINS_FOE}`] : [], r.talked ? [`${r.talked} talked down +${r.talked}`] : [], gaveUp ? [`${G.arma ? 'the giant armadillo' : 'the colonel'} +${COINS_BOSS}`] : [], r.lucky ? [`Lucky ears +${r.lucky}`] : [], (rw && rw.coinWhy) || []);     // (talked down: 1 each, battle/tactics.js)
    const coins = `<div class="bt-coins"><span class="plus">+${r.coins}</span>${UI.COIN}${coinWordHTML(r.coins)}</div>${why.length ? `<div class="bt-coinwhy">${why.join(' · ')}</div>` : ''}`;
    const ate = Object.entries(r.used).map(([id, n]) => `«${UI.esc(foodThe(id))}»${n > 1 ? ' ×' + n : ''}`).join(', ');
    emit('coins', { coins: r.coins });
    UI.result(`<h2>${title}</h2><div class="sub">${sub}</div>${coins}${rw && rw.html ? rw.html : ''}${gradesHTML(r)}<table>
      ${row('Things you typed in the language', r.outputs)}
      ${row('Different words you used', r.words)}
      ${row('PERFECT hits and dodges · counters', `${r.perfect} · ${r.counters}`)}
      ${row('Hints', r.hints)}
      ${r.crits ? row('Gold-word critical hits', r.crits) : ''}
      ${r.befriended ? row('Talked down', r.befriended) : ''}
      ${ate ? row(`Food eaten · ♥ back`, `${ate} · +${r.healed}`) : ''}
    </table>${mistakesHTML()}<div class="next">Enter ▶</div>`);
    if (rw && _.RW.wire) try { _.RW.wire(UI.U.e.result); } catch (e) { console.warn('[battle] rewards card', e); }     // (the 🔊 buttons)
    return new Promise(res => {
      G.resultNext = () => { G.resultNext = null; UI.result(null); res(); };
      if (G.auto && G.auto.dialog) wait(0.5).then(() => G.resultNext && G.resultNext());
    });
  }

  // ------------------------------------------------------------ running a battle
  // a foe spec { kind: 'hushling' | 'hushling_big' | 'boss' | 'moth' | 'beetle' | 'armadillo', color, size, hp?, floating?, asleep?, shy? }
  // Moths are a bit fragile and float; beetles are tougher (and their shell halves most hits); armadillos
  // are as tough as beetles, but only on their backs do they really get hurt.
  // Practice dummies go down in a few hits; kernel soldiers in one or two (there are squads of them); the colonel is a boss.
  const HP = { hushbig: [22, 22], hushling: [7, 10], moth: [5, 8], beetle: [8, 12], armadillo: [8, 12], frog: [6, 9], dummy: [6, 8], kernel: [3, 4], popcorn: [3, 4], colonel: [24, 24], bat: [5, 8], bee: [6, 9], snowball: [6, 9], crab: [5, 8], worm: [6, 9] };
  function normFoe(s, i) {
    const kind = _.M.kindOf(s.kind);
    // (the colonel has no color word: he's «el coronel», or «el grande»; that way «el amarillo» is always a soldier)
    const color = kind === 'colonel' ? 'gold' : _.M.COLORS[s.color] ? s.color : ['red', 'blue', 'green', 'yellow'][i % 4];
    const size = kind === 'hushbig' || kind === 'colonel' ? 'big' : (s.size === 'big' ? 'big' : 'small');
    const hp = s.hp || HP[kind][size === 'big' ? 1 : 0];
    const floating = s.floating !== undefined ? !!s.floating : kind === 'moth' || kind === 'bat' || kind === 'bee';
    return Object.assign({}, s, { kind, color, size, hp, floating, states: s.states || (s.asleep ? ['asleep'] : []) });
  }
  // the arena: the place's own biome ('meadow' | 'forest' | 'lake') if it says one, the lake anywhere west of
  // x = −120 (the Mirror Lake's region), else what the world says about the spot
  // The boss fight's own machinery: 'corn' (boss: 'corn' | { kind: 'corn' }, or boss: true with the colonel, his soldiers, the
  // cellar or no foes: cornmaze.js) or 'armadillo' (boss: 'armadillo': the Great Mill's top). Any other boss is an ordinary fight.
  function bossKindOf(o) {
    const b = o.boss, k = b && typeof b === 'object' ? b.kind : b;
    if (k === 'armadillo') return 'armadillo';
    if (k === 'corn' || k === 'colonel') return 'corn';
    if (b === true) { const fs = o.foes || []; return !fs.length || fs.some(s => /colonel|kernel|popcorn/.test(String(s && s.kind))) || (o.place && o.place.biome === 'cellar') ? 'corn' : null; }
    return null;
  }
  // The boss contract (the music plays its boss theme): what BATTLE.boss() says while the fight runs. opts.boss as given (true
  // or an id); else a fight with a giant one is that kind's boss (isle.js's frog, mine.js's bat, greenhouse.js's queen bee,
  // icetower.js's snowman) and the hill's big Hushling is 'hill' (story.js); practice never is.
  const GIANT_ID = { frog: 'frog', bat: 'bat', bee: 'bee', snowball: 'snowman', armadillo: 'armadillo', worm: 'worm' };
  function bossIdOf(o = {}) {
    if (o.boss) return o.boss;
    if (o.practice) return null;
    const specs = o.foes && o.foes.length ? o.foes : TUTORIAL_FOES[o.tutorial] || [];
    const kind = s => (_.M && _.M.kindOf ? _.M.kindOf(s.kind) : String(s.kind));
    const giant = specs.find(s => s && (s.giant || s.queen));
    if (giant) return GIANT_ID[kind(giant)] || kind(giant);
    if (specs.some(s => s && kind(s) === 'hushbig')) return 'hill';
    return null;
  }
  function biomeOf(o) {
    const pl = o.place || {};
    if (o.biome || pl.biome) return o.biome || pl.biome;
    if (bossKindOf(o) === 'corn') return 'cellar';   // the Corn Society's hall under the corn maze
    // Port Brisa (its city, its bay, its sea fort; not the road): the harbor arena, when port_battle.js has built it
    try { const PB = typeof PORT !== 'undefined' ? PORT : null; if (_.arenaBuilders && _.arenaBuilders.harbor && PB && PB.areaAt && typeof pl.x === 'number') { const a = PB.areaAt(pl.x, pl.z); if (a && a !== (PB.AREAS && PB.AREAS.road)) return 'harbor'; } } catch (e) { /* no port: as before */ }
    if (typeof pl.x === 'number' && pl.x < -120) return 'lake';
    try {
      const W = window.WORLD;
      if (W && typeof W.biomeAt === 'function') return W.biomeAt(pl.x, pl.z) === 'forest' ? 'forest' : 'meadow';
      if (W && typeof W.isForest === 'function') return W.isForest(pl.x, pl.z) ? 'forest' : 'meadow';
      if (W && typeof W.forestAt === 'function') return W.forestAt(pl.x, pl.z) > 0.5 ? 'forest' : 'meadow';
    } catch (e) { /* the world can't tell; use the meadow */ }
    return 'meadow';
  }
  const TUTORIAL_FOES = {
    verbs: [{ kind: 'hushling', color: 'green', size: 'small', hp: 9 }],
    targets: [{ kind: 'hushling', color: 'red', size: 'small', hp: 6 }, { kind: 'hushling', color: 'blue', size: 'big', hp: 8 }],
    parts: [{ kind: 'hushling_big', color: 'red', hp: 16 }],
  };
  function onKey(ev) {
    if (!G.running) return;
    const inp = UI.U.e.input;
    if (G.pending && !G.confirmOpen && document.activeElement !== inp && ev.key && ev.key.length === 1 && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !G.timing) UI.focusInput();
    if (ev.key === 'Tab' && G.pending && G.pending.kind === 'teach' && document.activeElement !== inp) { ev.preventDefault(); giveHint(); }
  }
  function begin(opts) {
    registerItems();
    G.opts = opts; G.renderer = opts.renderer;
    G.lang = opts.lang || (hasLEX() ? LEX.lang : 'es') || 'es';
    if (!_.LANGS[G.lang]) G.lang = 'es';
    if (hasLEX() && LEX.lang !== G.lang) LEX.lang = G.lang;
    G.L = _.LANGS[G.lang]; P.indexLang(G.L);
    G.name = opts.mimoName || 'Mimo';
    G.voc = new Set([P.nrm(G.name), 'mimo']);
    G.onEvent = typeof opts.onEvent === 'function' ? opts.onEvent : () => {};
    G.tutorial = opts.tutorial || null;
    G.tier = clamp(Math.round(opts.tier || (hasLEX() ? LEX.tier() : 1)), 1, 3);
    G.pace = hasLEX() ? LEX.pace() : 1;
    G.auto = opts.auto || null;
    // practice (no stakes; the focus picks the dummies and how precise a command must be) and the boss
    G.practice = !!opts.practice;
    G.focus = G.practice ? (['verbs', 'colors', 'positions', 'mixed'].includes(opts.focus) || /^tac:[A-Z][a-z]?$/.test(opts.focus || '') ? opts.focus : 'mixed') : null;   // ('tac:A' …: a battle skill's lesson, battle/tactics.js; 'tac:Gp' …: the time battles, battle/timebattle.js)
    G.coachName = (opts.coach && typeof opts.coach === 'object' && opts.coach.name) || (typeof opts.coach === 'string' && opts.coach) || 'Coach';
    G.needFloor = G.practice && G.focus !== 'verbs' ? 2 : 1;
    G.needCap = G.practice && G.focus === 'verbs' ? 1 : 3;
    G.bossKind = bossKindOf(opts);
    G.bossId = bossIdOf(opts) || null;          // (BATTLE.boss(): the music's boss theme)
    G.plug = (typeof G.bossId === 'string' && _.plugins[G.bossId]) || null;     // (a plug-in boss: oldtower_boss.js's 'hooded')
    G.boss = null; G.arma = null; G.round = 1; G.roundLog0 = 0; G.resultDone = null; G.resultButtons = false; G.missTold = false; G.baseTip = null;
    // Mimo's level (battle/rewards.js): more hearts, more power, perks; the words the fight frees; once-a-fight perks
    const lv = _.RW && _.RW.mimo ? _.RW.mimo() : null;
    G.lvl = lv ? lv.lvl : 1; G.power = lv ? lv.power : 1; G.perks = lv ? lv.perks : {}; G.freed = []; G.secondUsed = false; G.settled = null;
    G.t = 0; G.tweens = []; G.waits = []; G.hitstop = 0; G.turn = 0; G.timing = null; G.pending = null; G.coachNext = null; G.resultNext = null;
    G.confirmOpen = false; G.glow = null; G.lastKey = null; G.frames = []; G.usage = {}; G.showWeak = false; G.winLine = null; G.log = []; G.facing = null;
    G.badgePending = null; G.shellHinted = false; G.curlHinted = false; G.eatTold = false; G.eatTip = false; G.swapTold = false;
    G.hearts = G.maxHearts = opts.hearts || (lv && !G.practice ? lv.hearts : 8);
    if (opts.heartsNow && !G.practice) G.hearts = clamp(Math.round(opts.heartsNow), 1, G.maxHearts);   // (tests: start the fight already hurt)
    G.stats = { outputs: 0, commands: 0, cmdCounts: {}, words: new Set(), patterns: new Set(), hints: 0, perfect: 0, recasts: 0, crits: 0, blocked: 0, befriended: 0, counters: 0, damage: 0, t0: 0,
      grades: { S: 0, A: 0, B: 0, C: 0, D: 0 }, gradeLog: [], coins: 0, used: {}, healed: 0, beaten: 0 };
    loadFoods(opts);                           // the bag and the food words, before anything parses
    // the foes: the ones asked for; else practice picks dummies for the focus, the boss starts with the colonel alone
    // (he calls his squads himself), a lesson has its own
    const asked = opts.foes && opts.foes.length ? opts.foes : null;
    const specs = (asked || (G.practice ? practiceFoes(G.focus, G.tier) : G.bossKind === 'corn' ? [{ kind: 'colonel', color: 'yellow', size: 'big' }] : G.bossKind === 'armadillo' ? [ARMA_SPEC] : null)
      || TUTORIAL_FOES[G.tutorial] || TUTORIAL_FOES.verbs).map(normFoe);
    if (G.bossKind === 'corn' && !specs.some(s => s.kind === 'colonel')) specs.unshift(normFoe({ kind: 'colonel', color: 'yellow', size: 'big' }, 0));
    if (G.bossKind === 'armadillo' && !specs.some(s => s.kind === 'armadillo' && s.giant)) specs.unshift(normFoe(ARMA_SPEC, 0));
    if (_.tac && _.tac.specs) _.tac.specs(specs, opts);     // (battle skills: a lesson's dummies, look-alike squads: battle/tactics.js)
    // (at the lake the stones lie on the dock, in front of you)
    const biome = biomeOf(opts), lake = biome === 'lake';
    const stones = G.lang === 'pt' && (knows('v.throw') || G.tutorial === 'twist') ? (lake ? [['light', -2.75, 1.55], ['medium', -1.85, 1.6], ['heavy', -1.1, 1.45]] : [['light', -1.25, 2.0], ['medium', -0.2, 2.45], ['heavy', 0.85, 1.95]])
      : G.lang === 'de' && knows('v.attack') ? [lake ? ['medium', -1.25, 1.6] : ['medium', -0.4, 2.2]]
        : G.L.cjk && knows('n.stone') && knows('v.hit') ? [lake ? ['medium', -1.25, 1.6] : ['medium', -0.4, 2.2]] : [];     // (zh / ja: a stone to hit with, «用石头打…» / «石で…»)
    // the Coach is on the field for lessons, and for an armadillo when Mimo doesn't know «empuja» yet
    // (and in practice: the yard is the coach's)
    const coach = G.practice || !!G.tutorial || (specs.some(s => s.kind === 'armadillo' && !s.shy) && !knows('v.push')) || !!(opts.coach && opts.coach.ally);     // (ally: Bruno fights at your side in the Gray Marsh, marsh_battle.js)
    const set = ST.setup({ biome, foes: specs, coach, stones, yard: G.practice });
    A.you = set.cast.you.st; A.mimo = set.cast.mimo.st; A.coach = set.cast.coach.st;
    G.foes = set.foes;
    G.foes.forEach((f, i) => { f.id = i; f.hp = f.maxHp = f.spec.hp; if (G.tutorial === 'verbs') f.hidden = true; if (f.species === 'snowball') snowSet(f, f.size === 'big' ? 1 : 0, true); });
    beeSetup();                                // (picky bees: what each one wants)
    G.nextId = G.foes.length;
    if (G.practice) ST.S.arena.uni.uStain.value = 0;    // straw dummies: no Hush gray around them
    if (G.bossKind === 'armadillo') armaSetup();
    if (G.plug && G.plug.setup) try { G.plug.setup(kit()); } catch (e) { console.error('[battle] plug-in setup', e); }
    if (G.bossKind === 'corn') {
      // the colonel starts by his husk throne, his cape closed; his surname is part of his name («el Coronel Mazorca»)
      const f = G.foes.find(x => x.species === 'colonel');
      G.boss = { f, phase: 1, openTurns: 0, squads: 0, popped: 0 };
      f.cape = 0; f.capeOpen = false; f.noAuto = true;
      f.x = f.hx + 0.5; f.z = f.hz - 1.5;
      G.foes.forEach(x => { if (x !== f) x.hidden = true; });   // (soldiers passed in opts.foes march out after his speech)
      const nm = (G.L.species.colonel && G.L.species.colonel.name) || '';
      nm.split(' ').slice(-1).forEach(w => { if (w) G.voc.add(P.nrm(w)); });
      ST.S.arena.uni.uStain.value = 0;                 // (they're hiding from the Hush, not part of it)
    }
    UI.mount({
      onSubmit: submit, onInput: preview, onHint: giveHint, onNext: () => { if (G.coachNext) G.coachNext(); else if (G.resultNext && !G.resultButtons) G.resultNext(); },
      onRun: () => { if (G.pending && !G.confirmOpen) { G.confirmOpen = true; UI.confirm(true); } },
      onConfirm: yes => confirmFlee(yes),
    });
    UI.U.noFocus = !!opts.noFocus;
    UI.toggleEN(false);                        // bubbles (shouts, tells, Mimo) are in the language; their English is on request (EN): DESIGN.md 17.3
    G.mistakes = [];                           // every slip, for the review after the battle
    UI.hearts(G.hearts, G.maxHearts, G.name);
    UI.coins(0);
    if (G.practice) UI.bag([]); else refreshBag();   // (practice uses nothing from the bag)
    addEventListener('keydown', onKey, true);
    if (_.tac && _.tac.begin) _.tac.begin(opts);
    G.running = true;
  }
  function confirmFlee(yes) {
    G.confirmOpen = false; UI.confirm(false);
    const p = G.pending;
    if (!yes || !p) { UI.focusInput(); return; }
    finishPrompt(p, FLEE);
  }
  // The first time a new kind of creature shows up (and Mimo doesn't know its name yet), a quick
  // moment teaches the name with its article: you copy it, then teach it to Mimo, like a lesson.
  async function meetKinds() {
    const met = new Set();
    for (const f of G.foes) {
      if (!NEW_KINDS.includes(f.species) || met.has(f.species) || f.shy || knows('n.' + f.species) || (f.spec && f.spec.shadow && !f.lit)) continue;     // (a shadow doesn't show what it is: the Gray Marsh)
      met.add(f.species);
      await meetKind(f);
    }
    if (met.size) { ST.shot('wide'); refreshLabels(); }
  }
  async function meetKind(f) {
    const id = 'n.' + f.species, S = G.L.species[f.species], the = theWord(f.species), fem = S.g === 'f';
    ST.shot('focus', A.mimo, f, { up: f.floating ? 0.55 : 0.2 });
    turnTo(A.mimo, yawTo(A.mimo, f.x, f.z), 0.2);
    setMood(A.mimo, 'confused', 2.2);
    say(A.mimo, G.lang === 'es' ? '¿…?' : '…?', { cls: 'mimo', dur: 1.4 });
    await wait(0.35);
    // it shows itself off: a hop (or, for a moth, a flutter; an armadillo uncurls to have a look at you; a frog croaks first)
    setMood(f, 'go', 0.9);
    if (f.species === 'armadillo') await tween(f, { curl: 0 }, 0.45, 'io');
    if (f.species === 'frog') { f.croak = 1.4; emit('croak'); say(f, line('croak')[0], { cls: 'foe small', en: line('croak')[1], dur: 1.4 }); await wait(0.55); }
    if (f.species === 'bat') { emit('screech'); say(f, line('screech')[0], { cls: 'foe small', en: line('screech')[1], dur: 1.4 }); await wait(0.55); }
    if (f.species === 'bee') { emit('buzz'); say(f, line('beeBuzz')[0], { cls: 'foe small', en: line('beeBuzz')[1], dur: 1.2 }); await wait(0.5); }
    await squash(f, 1.2, 0.84, 0.07);
    await arcTo(f, f.hx, f.baseY || 0, f.hz, 0.36, 0.45);
    squash(f, 1.18, 0.86, 0.06);
    await wait(0.25);
    await coachSay(G.L.meet(f.species), { who: A.coach.hidden ? 'New creature' : G.coachName, look: f });
    const art = the.split(' ')[0];
    // with a der-word the one you act on changes (den roten Käfer); die and das stay (die rote Motte, das rote Gürteltier)
    const deEx = S.g === 'f' ? 'die rote' : S.g === 'n' ? 'das rote' : 'den roten';
    const genderTip = G.lang === 'de' ? `«${art}» = a ${art}-word${fem ? ' (feminine)' : S.g === 'n' ? ' (neuter)' : ''}: «${deEx} ${S.w}».` : `«${art}»: it’s ${fem ? 'feminine' : 'masculine'}, so «${art} ${S.w} ${adjShow('red', S.g)}».`;
    // (zh / ja have no articles: the hint gives the zh measure word, or says a ja name is in katakana)
    await askOrFlee('echo', { answer: the, id, hint: G.L.meetTip ? G.L.meetTip(f.species) : `A new creature: «${the}» (the ${S.en}). Copy it with the article · ${genderTip}` });
    if (!A.coach.hidden) await coachSay('teachWord');
    UI.tip(teachTip());
    ST.shot('party');
    const typed = await askOrFlee('teach', { id, expect: S.w });
    UI.tip(null);
    await mimoLearn(id, typeof typed === 'string' ? typed : null);
    if (f.species === 'armadillo') {           // …and rolls back up into its armored ball
      ST.shot('focus', A.mimo, f, { up: 0.2 });
      setMood(f, 'go', 0.8);
      await tween(f, { curl: 1 }, 0.4, 'io');
      squashFoe(f, 1.2, 0.8);
      ST.S.fx.puff(f.x, 0.05, f.z, 5, 0.16);
      await wait(0.35);
    }
  }
  // Mimo learns «empuja» in the overworld before the first armadillo; if it hasn't yet when a fight meets
  // one, the Coach (on the field for it, see begin) teaches it the usual way: echo, teach, then a command.
  const pushLessonDue = () => !knows('v.push') && G.foes.some(f => f.species === 'armadillo' && !f.shy && f.alive);
  async function lessonPush() {
    const f = G.foes.find(x => x.species === 'armadillo' && !x.shy && x.alive);
    UI.rung('Lesson · <b>push</b>');
    if (A.coach.hidden) await coachIn();
    ST.shot('focus', A.coach, f);
    await teachWord('v.push', { demo: 'push', intro: 'watchPush', echoKey: 'echoPush' });
    ST.shot('wide');
    await coachSay(G.L.sayEx(pushExample(f)), { look: f });
    UI.rung(null);
  }
  // Where-words (DESIGN.md 14.5): when two or more look the same and your level asks you to say who (tier 2 and up),
  // the Coach hops in and teaches the ones Mimo doesn't know yet: left and right, and the middle when three look alike.
  function posKeysDue() {
    if (G.tier < 2 && (G.needFloor || 1) < 2) return [];   // (practice at colors, positions or mixed asks for it at any level)
    const foes = targetable(), keys = new Set();
    for (const f of foes) { if (f.shy) continue; const k = posNeeded(f, foes); if (k) keys.add(k); }
    return P.POS_KEYS.filter(k => keys.has(k) && !knows('p.' + k));
  }
  async function lessonPositions(keys) {
    const foes = targetable(), twins = P.order(foes.filter(f => !f.shy && posNeeded(f, foes)));
    UI.rung('Lesson · <b>where</b>');
    if (A.coach.hidden) await coachIn();
    ST.shot('wide');
    await coachSay(twins.length >= 3 ? 'posIntro' : 'posIntro2', { look: twins[Math.floor(twins.length / 2)] });
    for (const k of keys) {
      const f = twins.find(x => posNeeded(x, foes) === k) || twins[0];
      ST.shot('wide');
      await showSpot(f, k);
      await teachWord('p.' + k, { intro: k === 'left' ? 'posLeft' : k === 'middle' ? 'posMiddle' : 'posRight', look: f, teachKey: 'teachWord' });
    }
    ST.shot('wide');
    const ex = posExample();
    if (ex) await coachSay(G.L.sayEx(ex), { look: twins[0] });
    if (G.foes.filter(f => f.species === 'frog' && f.alive && !f.shy).length >= 2) await coachSay('frogsHop');
    UI.rung(null);
  }
  // the one at that spot hops and sparkles, with the word over it
  async function showSpot(f, k) {
    setMood(f, 'go', 0.9);
    const top = ST.worldOf(f, 'top'), w = showWord('p.' + k);
    ST.S.fx.sparkle(top.x, top.y, top.z, 12, ['#fff3a0', '#7ff7ea']);
    UI.pop(top.clone().add(new THREE.Vector3(0, 0.35, 0)), k === 'left' ? '◀ ' + w : k === 'right' ? w + ' ▶' : '● ' + w, G.t, { color: '#86f2e8', size: 30, rise: 0.5, life: 2.2 });
    await squash(f, 1.2, 0.82, 0.07);
    await arcTo(f, f.hx, f.baseY || 0, f.hz, 0.4, 0.55);
    squash(f, 1.2, 0.84, 0.06);
    if (f.species === 'frog') { f.croak = 0.8; ST.perchDip(f.hx, f.hz); }
  }
  async function battleMain() {
    await intro();
    await meetKinds();
    if (pushLessonDue()) await lessonPush();
    const pk = posKeysDue();
    if (pk.length) await lessonPositions(pk);
    await beesAnnounce();                      // (picky bees buzz what they like)
    setupScaffolds();
    if (G.foes.some(f => f.shy)) { const shy = G.foes.find(f => f.shy); say(shy, '…', { cls: 'foe', dur: 1.5 }); }
    return fightLoop({});
  }
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  // A color word shown on one of them («Este grano es blanco: «blanco». Escribe «blanco».»): copy it, then teach it to Mimo.
  // (with no coach on the field the box says «New word»)
  async function teachColor(key, f) {
    const id = 'a.' + key;
    ST.shot('focus', A.mimo, f, { up: 0.2 });
    setMood(f, 'go', 0.8); squash(f, 1.15, 0.86, 0.07);
    await coachSay(G.L.colorIs(key, f.species), { who: A.coach.hidden ? 'New word' : G.coachName, look: f });
    await askOrFlee('echo', { answer: showWord(id), id });
    if (!A.coach.hidden) await coachSay('teachColor');
    UI.tip(teachTip());
    ST.shot('party');
    const typed = await askOrFlee('teach', { id, expect: showWord(id) });
    UI.tip(null);
    await mimoLearn(id, typeof typed === 'string' ? typed : null);
  }

  // ------------------------------------------------------------ practice in a training yard (no stakes)
  // BATTLE.start({ practice: true, focus, coach: { name: 'Bruno' } }), with no foes: straw dummies on posts, with colored
  // scarves, picked for the focus and your level (practiceFoes):
  //   'verbs'      one sturdy dummy: change the action every time (a verb is enough for an S)
  //   'colors'     two scarves (three from tier 2, one of them big at tier 3): say which one, whatever your level
  //   'positions'  two or three that look the same: say where (the coach teaches left / middle / right first)
  //   'mixed'      two alike and one other: actions, colors and places together
  // They never hurt. Every other turn one swings, slowly and plainly (arms up: it'll go high, duck ↓; arms down: low,
  // jump ↑), with the coach calling it; a missed dodge costs nothing. The coach cheers each command and puts the why of
  // anything under an S in the tip box. No coins, no losing, nothing out of the bag. All down → a card with the grades,
  // Again (new dummies, same focus) or Done. It resolves { outcome: 'done', grades, rounds, focus, stats }.
  const PRACTICE_COLORS = ['red', 'blue', 'green', 'yellow', 'white'];
  // n scarf colors: ones Mimo knows first; a new one when there aren't enough (now and then one anyway)
  function practiceColors(n) {
    const known = shuffle(PRACTICE_COLORS.filter(c => knows('a.' + c))), fresh = shuffle(PRACTICE_COLORS.filter(c => !knows('a.' + c)));
    const out = known.slice(0, n);
    while (out.length < n && fresh.length) out.push(fresh.shift());
    if (fresh.length && known.length >= n && n > 1 && Math.random() < 0.25) out[out.length - 1] = fresh[0];
    return shuffle(out);
  }
  function practiceFoes(focus, tier) {
    const d = (color, size = 'small', hp) => ({ kind: 'dummy', color, size, hp: hp || (size === 'big' ? 8 : 6) });
    if (focus === 'verbs') return [d(practiceColors(1)[0], 'small', 10)];
    if (focus === 'colors') return practiceColors(tier >= 2 ? 3 : 2).map((c, i) => d(c, tier >= 3 && i === 1 ? 'big' : 'small'));
    if (focus === 'positions') { const c = practiceColors(1)[0]; return Array.from({ length: tier >= 2 ? 3 : 2 }, () => d(c)); }
    const [a, b] = practiceColors(2);
    return shuffle([d(a), d(a), d(b, tier >= 3 ? 'big' : 'small')]);
  }
  // what this round needs that Mimo doesn't know yet: two actions to switch between, the scarf colors, the where-words
  async function practiceLessons() {
    if (!knows('v.jump')) await teachWord('v.jump', { demo: 'jump', intro: 'watchJump', echoKey: 'echoJump' });
    if (attackVerbs().length < 2 && !knows('v.hit')) await teachWord('v.hit', { demo: 'hit', intro: 'newHit', echoKey: 'echoHit' });
    if (G.focus === 'verbs') return;
    for (const f of G.foes) if (f.alive && !knows('a.' + f.color)) await teachColor(f.color, f);
    const pk = posKeysDue();
    if (pk.length) await lessonPositions(pk);
  }
  async function practiceMain() {
    if (_.tac && _.tac.lesson && /^tac:/.test(G.focus || '')) return _.tac.lesson();     // (a battle skill's lesson: battle/tactics.js)
    G.winLine = null;
    await intro();                                      // the dummies drop onto their spots
    ST.shot('coach');
    await coachSay('pHello');
    await meetKinds();                                  // «el muñeco», the first time
    await practiceLessons();
    ST.shot('coach');
    await coachSay({ verbs: 'pVerbs', colors: 'pColors', positions: 'pPositions', mixed: 'pMixed' }[G.focus]);
    await coachSay('pDodge');
    for (;;) {
      setupScaffolds();
      G.roundLog0 = G.stats.gradeLog.length;
      await fightLoop({});
      await practiceCheer();
      if (!(await practiceCard())) break;
      G.round++;
      await newPracticeRound();
    }
    ST.shot('coach');
    await coachSay('pDone');
    return 'done';
  }
  // After every command the coach says how it went, in the tip box (his corner of the screen): «¡Perfecto!» (S),
  // «¡Muy bien!» (A, B) or «¡Casi! Otra vez.» (C, D), and for anything under an S the why: what slipped, the sentence
  // that would have been an S, and the rule. (An S gets a cheer too.)
  function practiceFeedback(r) {
    if (!r || !r.grade || r.repeat || r.eat) return;
    const g = r.grade.letter, [t, en] = line(g === 'S' ? 'pGreat' : g === 'A' || g === 'B' ? 'pGood' : 'pFix');
    const head = `<b>${UI.esc(G.coachName)}:</b> «${UI.esc(t)}» <i>${UI.esc(en)}</i>`;
    emit('feedback', { grade: g });
    tween(A.coach, { point: 1 }, 0.15).then(() => wait(0.5)).then(() => tween(A.coach, { point: 0 }, 0.3));
    if (g === 'S') { tween(A.coach, { cheer: 1 }, 0.2, 'back').then(() => wait(0.6)).then(() => tween(A.coach, { cheer: 0 }, 0.3)); UI.tip(head); return; }
    const W = G.L.why || {}, cl = r.kind === 'command' ? r.clauses : [];
    const better = r.recast ? r.canon : (cl.find(c => c.suggest) || {}).suggest || null;
    const why = r.recast ? whyOf({ kind: 'grammar', errors: [...new Set((r.errors || []).map(e => e.kind).concat(r.fixes || []))], about: nounsOf(r) }) : [];
    if (cl.some(c => c.ambiguous && !c.ambiguous.untaught) && W.which) why.push(UI.esc(W.which));
    else if (cl.some(c => c.need && c.said === 1 && c.said < c.need)) why.push(G.L.tips.target);
    UI.tip(`${head}<br><span class="gc g${g}">${g}</span> ${UI.esc(r.grade.reason)}${better ? ` · for an S: <b>«${UI.esc(better)}»</b>` : ''}${why.length ? '<br>' + why.slice(0, 2).join(' ') : ''}`);
  }
  async function practiceFoePhase() {
    if (G.turn % 2 === 0) return;                       // every other turn
    const list = targetable().filter(f => f.species === 'dummy' && !f.hidden);
    if (!list.length) return;
    await wait(0.8);                                    // (a beat, so the grade and the coach's word land first)
    await dummySwing(list[Math.floor(Math.random() * list.length)]);
  }
  // A dummy's swing: it shouts the usual telegraph (the coach voices it, pointing), shows it plainly (its arms go up for
  // a high swing, down for a low one), bounces over on its post and spins. (tests: G.auto.swing = 'high' | 'low')
  async function dummySwing(f) {
    const toMimo = Math.random() < 0.5, tgt = toMimo ? A.mimo : A.you;
    const high = G.auto && G.auto.swing ? G.auto.swing === 'high' : Math.random() < 0.5;
    const [txt, en] = G.L.shout(G.tier, toMimo, high);
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.15 });
    say(f, txt, { cls: 'foe shout', en, dur: readTime(txt) + 2.6 });
    tween(A.coach, { point: 1 }, 0.15).then(() => wait(0.9)).then(() => tween(A.coach, { point: 0 }, 0.3));
    emit('swing', { text: txt, high });
    dodgeHint(true);
    setMood(f, 'go', 4);
    f.swing = f.swing || 0;
    await tween(f, { swing: high ? 1 : -1 }, 0.5, 'io');
    await wait(readTime(txt) + 0.4);
    const x0 = f.x, z0 = f.z, ex = tgt.x + 1.0, ez = tgt.z + 0.05;
    const T = G.t + 1.2, key = high ? 'ArrowDown' : 'ArrowUp';
    const tp = timingWindow(T, key, () => ST.worldOf(tgt, 'mid'), { onPress: code => dodgeMove(tgt, code) });
    for (let i = 1; i <= 3; i++) {
      await arcTo(f, lerp(x0, ex, i / 3), 0, lerp(z0, ez, i / 3), 0.28, 0.32);
      squash(f, 1.15, 0.86, 0.04);
      ST.S.fx.puff(f.x, 0, f.z, 2, 0.1);
    }
    emit('whoosh');
    f.spinV = (f.spinV || 0) + 16;
    ST.S.fx.puff(f.x, 0.7, f.z, 5, 0.12, '#e8cf78');
    const grade = await tp;
    dodgeResult(f, tgt, grade, 0);
    tween(f, { swing: 0 }, 0.35, 'io');
    await wait(0.2);
    await hopHome(f, 0.5, 0.45);
    setMood(f, 'idle');
    if (f.hp <= 0) { await defeat(f); return; }
    refreshLabels();
  }
  // a dummy's KO: a big spin, straw everywhere, and over it goes (it stays lying there till the next round)
  async function topple(f) {
    f.alive = false;
    UI.labelRemove(f); UI.tagRemove(`part:${f.id}:`); UI.tagRemove(`pos:${f.id}`);
    G.stats.beaten++;
    emit('ko');
    setMood(f, 'hurt');
    const p = ST.worldOf(f, 'mid'), s = Math.random() < 0.5 ? 1 : -1;
    f.spinV = (f.spinV || 0) + s * 22;
    ST.S.fx.puff(p.x, p.y, p.z, 12, 0.22, '#e8cf78');
    ST.S.fx.sparkle(p.x, p.y + 0.3, p.z, 14, [UI.COL[f.color] || '#ffffff', '#fff3a0']);
    ST.star(p, '#ffffff', 1.2); ST.shake(0.35, 0.4);
    UI.pop(ST.worldOf(f, 'top'), 'KO!', G.t, { color: '#ffffff', size: 40 });
    emit('straw');
    await wait(0.45);
    f.spinV = 0;                                        // (it settles facing front, then falls)
    await wait(0.25);
    await tween(f, { tilt: s * 1.45 }, 0.36, 'in');
    ST.S.fx.puff(f.x, 0.05, f.z, 8, 0.2, '#e8cf78');
    ST.shake(0.25, 0.2);
    f.gone = true;
    await wait(0.2);
  }
  async function practiceCheer() {
    emit('round-done');
    UI.promptHide(); UI.dodge(null); UI.tagRemove(''); UI.frames([]);
    G.glow = null;
    ST.shot('win');
    setMood(A.mimo, 'happy', 3); setMood(A.you, 'happy', 3);
    tween(A.coach, { cheer: 1 }, 0.25, 'back');
    for (let i = 0; i < 2; i++) { await squash(A.mimo, 1.25, 0.76, 0.06); await arcTo(A.mimo, A.mimo.hx, 0, A.mimo.hz, 0.42, 0.85); }
    squash(A.mimo, 1.2, 0.8, 0.06);
    const [t, en] = line('pWin');
    say(A.coach, t, { cls: 'coach', en, dur: 2.6 });
    await wait(1.6);
    tween(A.coach, { cheer: 0 }, 0.3);
  }
  // The card after a round: this round's grades (and the session's, from round 2), Again or Done.
  // Enter / the Again button = another round; Esc / the Done button = done. (tests: G.auto.practiceRounds, default 1)
  function practiceCard() {
    const s = G.stats, log = s.gradeLog.slice(G.roundLog0 || 0);
    const grades = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    log.forEach(x => grades[x.grade]++);
    const avg = log.length ? log.reduce((a, x) => a + GRADES[x.grade].score, 0) / log.length : 0;
    const bg = log.length ? ['D', 'C', 'B', 'A', 'S'][clamp(Math.floor(avg + 0.4), 0, 4)] : null;
    const b = log.map((x, i) => ({ x, i })).sort((p, q) => (GRADES[q.x.grade].score - GRADES[p.x.grade].score) || (q.x.said - p.x.said) || (q.x.words - p.x.words) || (q.i - p.i))[0];
    const focusEN = { verbs: 'actions', colors: 'colors', positions: 'where', mixed: 'everything' }[G.focus];
    const session = G.round > 1 ? `<div class="sub"><span class="lbl">This session</span> ${['S', 'A', 'B', 'C', 'D'].filter(k => s.grades[k]).map(k => `<span class="gc g${k}">${k}<small>×${s.grades[k]}</small></span>`).join('')}</div>` : '';
    const [t] = line('pWin');
    UI.result(`<div class="p-focus">Practice · ${focusEN} · round ${G.round}</div><h2>All down!</h2><div class="sub">${UI.esc(G.coachName)}: «${UI.esc(t)}»</div>`
      + (bg ? gradesHTML({ grades, battleGrade: bg, best: b ? { text: b.x.text, grade: b.x.grade } : null }, 'round') : '') + session
      + '<div class="bt-pbtns"><button class="bt-again">Again ⏎</button><button class="bt-done">Done ⎋</button></div><div class="next">New dummies, same practice · or done for today</div>');
    emit('practice-card', { round: G.round });
    G.resultButtons = true;
    const box = UI.U.e.result;
    return new Promise(res => {
      const pick = again => { if (!G.resultNext) return; G.resultNext = null; G.resultDone = null; G.resultButtons = false; UI.result(null); emit(again ? 'again' : 'done'); res(again); };
      G.resultNext = () => pick(true);
      G.resultDone = () => pick(false);
      const a = box.querySelector('.bt-again'), d = box.querySelector('.bt-done');
      if (a) a.onclick = ev => { ev.stopPropagation(); pick(true); };
      if (d) d.onclick = ev => { ev.stopPropagation(); pick(false); };
      if (G.auto && G.auto.dialog) wait(0.5).then(() => { if (G.resultNext) pick(G.round < (G.auto.practiceRounds || 1)); });
    });
  }
  // Again: the old dummies are cleared away and new ones for the same focus drop in (Mimo learns anything new they need)
  async function newPracticeRound() {
    UI.tip(null); UI.tagRemove('');
    for (const f of G.foes) { UI.labelRemove(f); ST.S.scene.remove(f.h.root, f.shadow); }
    G.foes.length = 0;                                  // (the stage's list: new ones go into it)
    const specs = practiceFoes(G.focus, G.tier).map(normFoe);
    ST.addFoes(specs, ST.rowSpots(specs.length)).forEach(f => { f.id = G.nextId++; f.hp = f.maxHp = f.spec.hp; f.hidden = true; });
    G.lastKey = null; G.glow = null;
    ST.shot('coach');
    await coachSay('pRound');
    ST.shot('wide');
    await foesEnter();
    await practiceLessons();
  }
  // leaving the yard before the card (Esc): the coach waves you off; nothing lost
  async function practiceBye() {
    G.confirmOpen = false; UI.confirm(false);
    UI.promptHide(); UI.dodge(null); UI.tip(null); UI.tagRemove(''); UI.rung(null); UI.frames([]); UI.result(null);
    G.foes.forEach(f => UI.labelRemove(f));
    ST.shot('coach');
    const [t, en] = line('pDone');
    say(A.coach, t, { cls: 'coach', en, dur: 2.4 });
    tween(A.coach, { cheer: 1 }, 0.25, 'back');
    emit('done');
    await wait(1.6);
  }

  // ------------------------------------------------------------ the Corn Society (a boss in a hall under the corn maze)
  // BATTLE.start({ boss: true, place: { biome: 'cellar' } }). A secret society of corn people hides down here from the
  // Hush; Colonel Cob takes you for the Hush's spies. His husk cape is closed: hits bounce off it (c.bounce). He calls a
  // squad of kernel soldiers in corn colors (yellow, white, red, blue: the first squad always brings white; from tier 2
  // two of them look alike, so you say where). Once the squad is down he throws the cape open and attacks with popcorn
  // bursts (↑ / ↓): for two of your turns he can be hit (c.open: ×1.5), then he closes it and calls the next squad.
  // Phase 1 can't take him below half his hearts (hurtFoe); at half the floor heats up (uHeat), and from then on every
  // squad pops into popcorn as it arrives («el grano» → «la palomita»: the gender changes), and popcorn swaps spots after
  // every turn like the frogs. At 0 he gives up («¡Me rindo!»), waving a white flag, and his soldiers with him.
  // (tests: G.auto.burst = 'high' | 'low')
  const SQUAD_COLORS = ['yellow', 'white', 'red', 'blue'];
  function squadSpecs() {
    const n = G.tier >= 2 ? 3 : 2, first = !G.boss.squads;
    const cs = shuffle(SQUAD_COLORS).slice(0, n);
    if (n === 3) cs[2] = cs[1];                         // two look alike: say where
    if (first && !cs.includes('white')) cs[0] = 'white';
    const odd = n === 3 ? cs[0] : null;
    return shuffle(cs).map(c => normFoe({ kind: 'kernel', color: c, size: G.tier >= 3 && c === odd ? 'big' : 'small' }, 0));
  }
  function bossSay(key, dur = 2.4, cls = 'foe shout') { const [t, en] = line(key); say(G.boss.f, t, { cls, en, dur }); }
  async function bossMain() {
    const f = G.boss.f;
    G.winLine = null;
    await intro({ foes: false });
    // whispers in the dark, and Mimo wonders…
    ST.shot('wide');
    setMood(A.mimo, 'confused', 1.6);
    say(A.mimo, G.lang === 'es' ? '¿…?' : '…?', { cls: 'mimo', dur: 1.4 });
    await wait(1.0);
    // …then the colonel marches out from his throne: «¡Alto! ¡Silencio! ¡Ustedes son del Hush!»
    await colonelStep(f);
    bossSay('bossIntro', 2.8);
    emit('boss');
    await wait(2.3);
    bossSay('bossName', 2.8);
    await wait(2.3);
    refreshLabels();
    await meetKinds();                                  // «el coronel»
    // his first squad (soldiers passed in opts.foes march out as that squad)
    const pre = G.foes.filter(x => x !== f && x.alive);
    if (pre.length) {
      G.boss.squads = 1; emit('march');
      await Promise.all(pre.map((x, i) => wait(i * 0.3).then(() => { x.x = f.x + 1.1; x.z = f.z - 0.4; return marchIn(x); })));
      refreshLabels();
    } else await callSquad(f);
    await meetKinds();                                  // «el grano»
    await teachSquadColors();                           // (white, and any other scarf color Mimo doesn't know yet)
    const pk = posKeysDue();
    if (pk.length) await lessonPositions(pk);
    setupScaffolds();
    return fightLoop({});
  }
  // three heavy steps from his throne to his spot
  async function colonelStep(f) {
    ST.shot('focus', A.mimo, f, { up: 0.6, dist: 9 });
    setMood(f, 'go', 2);
    const x0 = f.x, z0 = f.z;
    for (let i = 1; i <= 3; i++) {
      await arcTo(f, lerp(x0, f.hx, i / 3), 0, lerp(z0, f.hz, i / 3), 0.32, 0.25);
      squash(f, 1.12, 0.88, 0.05); ST.shake(0.3, 0.25); ST.S.fx.puff(f.x, 0.05, f.z, 5, 0.2, '#c9a77a');
      emit('stomp');
      await wait(0.12);
    }
    await turnTo(f, f.baseYaw, 0.2);
  }
  // the fallen ones of earlier squads leave the hall (so the list doesn't grow all fight)
  function pruneGone() {
    for (let i = G.foes.length - 1; i >= 0; i--) {
      const x = G.foes[i];
      if (x.gone && x !== G.boss.f) { ST.S.scene.remove(x.h.root, x.shadow); UI.labelRemove(x); UI.tagRemove(`pos:${x.id}`); G.foes.splice(i, 1); }
    }
  }
  // «¡Soldados, a formar!»: a new squad marches out from behind him into the row (on the hot floor, they pop)
  async function callSquad(f) {
    const B_ = G.boss;
    pruneGone();
    ST.shot('wide');
    setMood(f, 'go', 1.4);
    bossSay('bossCall', 2.2);
    squash(f, 1.08, 0.94, 0.08);
    await wait(0.7);
    const specs = squadSpecs(), added = ST.addFoes(specs, ST.rowSpots(specs.length));
    B_.squads++;
    added.forEach(x => { x.id = G.nextId++; x.hp = x.maxHp = x.spec.hp; x.x = f.x + 1.1; x.z = f.z - 0.4; x.hidden = true; });
    // the hot floor (phase 2) glows around the colonel and his row
    const all = [f, ...added];
    ST.S.arena.uni.uStainC.value.set(all.reduce((a, x) => a + x.hx, 0) / all.length, all.reduce((a, x) => a + x.hz, 0) / all.length);
    emit('march');
    await Promise.all(added.map((x, i) => wait(i * 0.3).then(() => marchIn(x))));
    if (B_.phase >= 2) await popSquad(added);
    await teachSquadColors();
    refreshLabels();
  }
  // the soldiers' colors Mimo doesn't know yet, one lesson each (as practice does): a squad can bring any of
  // SQUAD_COLORS, and the corn maze passes its own guards in, so «el grano amarillo» has to mean something to Mimo
  async function teachSquadColors() {
    const done = new Set();
    for (const x of G.foes) {
      if (!x.alive || x === G.boss.f || done.has(x.color)) continue;
      done.add(x.color);
      if (!knows('a.' + x.color)) await teachColor(x.color, x);
    }
  }
  async function marchIn(x) {
    x.hidden = false;
    setMood(x, 'go', 2.4);
    turnTo(x, yawTo(x, x.hx, x.hz), 0.1);
    const x0 = x.x, z0 = x.z, d = Math.hypot(x.hx - x0, x.hz - z0), steps = Math.max(3, Math.round(d * 2));
    await along(0.5 + d * 0.16, u => { x.x = lerp(x0, x.hx, u); x.z = lerp(z0, x.hz, u); x.y = Math.abs(Math.sin(u * Math.PI * steps)) * 0.09; }, 'io');
    x.y = 0;
    await turnTo(x, x.baseYaw, 0.18);
    squash(x, 1.15, 0.86, 0.05);
    ST.S.fx.puff(x.x, 0, x.z, 3, 0.12, '#c9a77a');
  }
  // the floor is hot: each kernel shivers and pops into popcorn («¡Pop!»), then Mimo meets «la palomita»
  async function popSquad(list) {
    const pops = list.filter(x => x.alive && !x.gone && x.species === 'kernel');
    if (!pops.length) return;
    ST.shot('wide');
    for (const x of pops) {
      setMood(x, 'hurt', 0.6);
      await along(0.32, u => { x.sx = 1 + Math.sin(u * 40) * 0.06; x.sy = 1 - Math.sin(u * 40) * 0.05; });
      const p = ST.worldOf(x, 'mid');
      ST.reskin(x, 'popcorn');
      x.sx = 0.5; x.sy = 1.5;
      tween(x, { sx: 1, sy: 1 }, 0.35, 'back');
      ST.popBurst(p, 10);
      ST.shake(0.25, 0.2);
      emit('pop');
      const [t, en] = line('pop');
      say(x, t, { cls: 'foe small', en, dur: 1.0 });
      await arcTo(x, x.hx, 0, x.hz, 0.4, 0.8);
      squash(x, 1.2, 0.82, 0.05);
      await wait(0.08);
    }
    G.boss.popped += pops.length;
    refreshLabels();
    await meetKinds();                                  // «la palomita»
  }
  async function cornFoePhase() {
    const B_ = G.boss, f = B_.f;
    if (!f || !f.alive) return;
    const squad = G.foes.filter(x => x !== f && x.alive && !x.gone && !x.calmed);
    if (f.capeOpen) {
      // open: another burst, until two of your turns are up (or, in phase 1, he's down to half: the floor heats up)
      const half = f.hp <= Math.ceil(f.maxHp / 2);
      if (B_.openTurns > 0 && !(B_.phase === 1 && half)) { B_.openTurns--; await colonelBurst(f); return; }
      await capeClose(f);
      if (B_.phase === 1 && half) await heatUp(f);
      await callSquad(f);
      setupScaffolds();
      return;
    }
    if (!squad.length) { await capeOpen(f); await colonelBurst(f); return; }
    // the squad attacks (two at most)
    const attackers = squad.length > 2 ? shuffle(squad).slice(0, 2) : squad;
    for (const x of attackers) {
      await foeAttack(x);
      if (G.hearts <= 0 || allDone()) return;
      await wait(0.12);
    }
    // the last soldier fell to a counter: he throws the cape open now (his burst comes next time), so your turn has a target
    if (f.alive && !G.foes.some(x => x !== f && x.alive && !x.gone && !x.calmed)) await capeOpen(f);
  }
  // «¡Basta! ¡Ahora peleo yo!»: the husk cape swings open like a peeled ear of corn (his medal shows)
  async function capeOpen(f) {
    const B_ = G.boss;
    ST.shot('focus', A.mimo, f, { up: 0.5, dist: 8.5 });
    setMood(f, 'go', 1.8);
    bossSay('bossOpen', 2.4);
    await wait(0.55);
    emit('peel');
    f.cape = 1; f.capeOpen = true; f.noAuto = false;
    ST.S.fx.puff(f.x, 1.3, f.z + 0.3, 8, 0.2, '#d9c98a');
    await squash(f, 1.12, 0.9, 0.1);
    B_.openTurns = 1; B_.opened = (B_.opened || 0) + 1;
    refreshLabels();
    setupScaffolds();
    await wait(0.35);
  }
  // «¡A cubierto! ¡Más soldados!»
  async function capeClose(f) {
    ST.shot('focus', A.mimo, f, { up: 0.5, dist: 8.5 });
    setMood(f, 'go', 1.2);
    bossSay('bossClose', 2.2);
    await wait(0.45);
    emit('cape');
    f.cape = 0; f.capeOpen = false; f.noAuto = true;
    await squash(f, 0.92, 1.08, 0.1);
    refreshLabels();
    await wait(0.3);
  }
  // «¡Fuego! ¡El piso está muy caliente!»: phase 2
  async function heatUp(f) {
    G.boss.phase = 2;
    ST.shot('wide');
    bossSay('bossHeat', 2.8);
    emit('heat');
    ST.shake(0.25, 1.2);
    const u = ST.S.arena.uni.uHeat;
    if (u) await tween(u, { value: 1 }, 1.4, 'io'); else await wait(1.0);
    await wait(0.5);
  }
  // his attack, cape open: a shouted telegraph like any foe's, then a burst of popcorn from his hands, flying in at
  // head height (high: duck ↓) or skimming the floor (low: jump ↑). Hot popcorn in phase 2 takes two hearts.
  async function colonelBurst(f) {
    if (!f.alive) return;
    const toMimo = Math.random() < 0.5, tgt = toMimo ? A.mimo : A.you;
    const high = G.auto && G.auto.burst ? G.auto.burst === 'high' : Math.random() < 0.5;
    const [txt, en] = G.L.shout(G.tier, toMimo, high);
    setMood(f, 'go');
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.5 });
    say(f, txt, { cls: 'foe shout', en, dur: readTime(txt) + 1.6 });
    emit('shout', { text: txt, high, foe: f, boss: true });
    dodgeHint(true);
    await wait(readTime(txt));
    emit('windup', { foe: f, high, boss: true });
    turnTo(f, yawTo(f, tgt.x, tgt.z), 0.2);
    await tween(f, { sx: 1.08, sy: 0.92, lean: -0.14 }, 0.3, 'io');      // he winds up…
    const T = G.t + 0.7, key = high ? 'ArrowDown' : 'ArrowUp';
    const tp = timingWindow(T, key, () => ST.worldOf(tgt, 'mid'), { onPress: code => dodgeMove(tgt, code) });
    await wait(0.34);
    emit('burst');                                                          // …and the popcorn flies
    tween(f, { sx: 0.94, sy: 1.08, lean: 0.14 }, 0.1);
    const from = ST.worldOf(f, 'hands'), headY = tgt.kind === 'you' ? 1.15 : 0.55;
    ST.popBurst(from, 6);
    ST.spray(from, new THREE.Vector3(tgt.x + 0.1, high ? headY + 0.2 : 0.16, tgt.z), 0.36, high, { popcorn: true });
    const grade = await tp;
    dodgeResult(f, tgt, grade, G.boss.phase >= 2 ? 2 : 1, { puff: [tgt.x, high ? headY : 0.3, tgt.z, '#fff3dc'] });
    await tween(f, { sx: 1, sy: 1, lean: 0 }, 0.25, 'back');
    turnTo(f, f.baseYaw, 0.3);
    setMood(f, 'idle');
    if (f.hp <= 0) { await defeat(f); return; }
    refreshLabels();
    await wait(0.2);
  }
  // a hit on the closed cape: BOUNCE!, no damage (the grade still counts), and the first time he gloats about it
  function bounceOff(c, p) {
    const f = c.target;
    setMood(f, 'happy', 0.9); setMood(A.mimo, 'confused', 1.2);
    G.hitstop = 0.05; ST.shake(0.25, 0.25);
    ST.S.fx.puff(p.x, p.y, p.z, 6, 0.16, '#d8c27a');
    UI.pop(p.clone().add(new THREE.Vector3(0.45, 0.35, 0)), 'BOUNCE!', G.t, { color: '#f1e3b0', size: 36, sub: 'the cape is closed', dx: 0.25 });
    showGrade(f);
    squashFoe(f, 1.06, 0.96);
    tween(A.mimo, { lean: -0.5 }, 0.08).then(() => tween(A.mimo, { lean: 0 }, 0.3, 'back'));
    G.stats.bounced = (G.stats.bounced || 0) + 1;
    emit('bounce');
    if (!G.boss.bounceTold) { G.boss.bounceTold = true; wait(0.5).then(() => { if (G.running && f.alive) bossSay('bossBounce', 2.2, 'foe'); }); }
    UI.tip(G.L.tips.boss);
  }
  // «¡Me rindo! ¡Me rindo!»: he slumps, a white flag comes out, his soldiers lower their spears
  async function surrender(f) {
    f.alive = false; f.calmed = true; f.hp = 0; f.noAuto = false;
    UI.labelRemove(f); UI.tagRemove(`pos:${f.id}`);
    G.stats.beaten++; earn(COINS_BOSS);
    for (const x of G.foes) if (x !== f && x.alive && !x.gone) { x.alive = false; x.calmed = true; UI.labelRemove(x); UI.tagRemove(`pos:${x.id}`); setMood(x, 'happy', 6); }
    emit('surrender');
    ST.shot('focus', A.mimo, f, { up: 0.6, dist: 8.5 });
    setMood(f, 'sad', 3);
    f.surrender = f.surrender || 0;
    await tween(f, { surrender: 1 }, 0.7, 'out');
    bossSay('bossGiveUp', 2.8);
    await wait(1.6);
  }
  async function runBattle(token) {
    let outcome;
    try {
      const L = { verbs: lessonVerbs, targets: lessonTargets, parts: lessonParts }[G.tutorial];
      outcome = await (L ? L() : G.plug && G.plug.main ? G.plug.main(kit()) : G.practice ? practiceMain() : G.boss ? bossMain() : G.arma ? armaMain() : battleMain());
    } catch (e) {
      if (e !== FLEE) console.error('[battle]', e);
      outcome = 'flee';
    }
    if (G.run !== token) return;
    // practice has no stakes: leaving is just being done for today
    if (G.practice) {
      try { if (outcome !== 'done') await practiceBye(); } catch (e) { console.error('[battle]', e); }
      if (G.run === token) end('done');
      return;
    }
    try {
      if (G.plug && G.plug.end) await G.plug.end(kit(), outcome);     // (a plug-in boss ends its own way: the hooded figure, on white)
      else {
        if (outcome === 'win') await winScene();
        else if (outcome === 'lose') await loseScene();
        else await fleeScene();
        if (outcome !== 'flee') await showResult(outcome);
      }
    } catch (e) { console.error('[battle]', e); }
    if (G.run === token) end(outcome);
  }
  function end(outcome) {
    const res = results(outcome);
    if (_.RW && _.RW.settle && !G.practice && !G.settled) try { G.settled = _.RW.settle(outcome, G) || true; } catch (e) { console.error('[battle] rewards', e); }     // (fled: the bestiary still notes who you met)
    G.running = false; G.pending = null; G.timing = null; G.coachNext = null; G.resultNext = null; G.resultDone = null; G.resultButtons = false; G.run = null;
    G.tweens = []; G.waits = [];
    removeEventListener('keydown', onKey, true);
    UI.unmount();
    if (typeof Input !== 'undefined') Input.typing = false;
    ST.teardown();
    G.lastResult = res;
    const r = G.resolve; G.resolve = null;
    if (r) r(res);
  }

  // ------------------------------------------------------------ the Great Mill's giant armadillo (a boss: DESIGN.md 16)
  // BATTLE.start({ boss: 'armadillo' }) (mill.js). It's curled around the bell's frame at the top of the mill: a giant ball that
  // shrugs off hits (⅓) and is too heavy to push over (c.heavy: it only rocks)… until it has rolled at you. Every attack is shouted
  // first, in the language, with where it comes from (the dodge words: «por arriba» / «por abajo», at tier 3 the head and the
  // feet); after it, it sits there dizzy for your next turn («mareado»): that's when «¡Empuja al armadillo!» flips it onto its
  // back (belly ×2, head and tail out). It rolls back up after a round, and comes straight at you again.
  //   phase 1 (its hearts down to 60%): one roll (low: jump ↑) or one bounce (high: duck ↓)
  //   phase 2 (60%): «¡Calladitos! ¡Ayúdenme!»: a red and a blue Hushling drop out of the bell («el rojo», «el azul»)
  //   phase 3 (25%): angry («enojado»): two moves in one shout («¡Primero por abajo… y luego por arriba!»), two dodges
  // Its hearts can't drop below a phase's floor before that phase begins (hurtFoe), like the colonel's. At 0 the Hush leaves it:
  // it rolls upright, thanks you, and frees two words. Everything it asks for is taught by then: «empuja» (the farmer, or the
  // Coach here), «el armadillo» (meetKinds), the dodge words (the first fights), red and blue (Bruno's colors lesson).
  // Tests: G.auto.burst 'high' | 'low' picks its move.
  const ARMA_SPEC = { kind: 'armadillo', color: 'yellow', size: 'big', giant: 2.3, hp: 26, boss: 'armadillo' };
  const ARMA = { p2: 0.6, p3: 0.25 };
  function armaFloor() { const A_ = G.arma, f = A_.f; return A_.phase === 1 ? Math.ceil(f.maxHp * ARMA.p2) : A_.phase === 2 ? Math.ceil(f.maxHp * ARMA.p3) : 0; }
  function armaSetup() {
    const f = G.foes.find(x => x.species === 'armadillo' && x.spec && x.spec.giant) || G.foes.find(x => x.species === 'armadillo');
    if (!f) return;
    G.arma = { f, phase: 1, dizzyTold: 0, heavyTold: false };
    f.isBoss = true; f.dizzy = 0;
  }
  function armaSay(key, dur = 2.4, cls = 'foe shout boss') { const [t, en] = line(key); say(G.arma.f, t, { cls, en, dur }); }
  async function armaMain() {
    const A_ = G.arma, f = A_.f;
    G.winLine = null;
    f.x = f.hx; f.z = f.hz; f.hidden = false;           // (it's there already: no hopping in)
    await intro({ foes: false });
    const others = G.foes.filter(x => x !== f);         // (any helpers passed in opts.foes hop in as usual)
    if (others.length) await Promise.all(others.map((x, i) => wait(i * 0.16).then(() => hopIn(x))));
    refreshLabels();
    // it peeks out of its ball, wakes up grumpy and tells you whose bell this is
    ST.shot('focus', A.mimo, f, { up: 0.9, dist: 11 });
    setMood(f, 'go', 3);
    await tween(f, { curl: 0.3 }, 0.5, 'io');
    armaSay('armaWake', 3.0); emit('boss', { foe: f });
    await wait(2.7);
    armaSay('armaName', 3.0);
    ST.shake(0.4, 0.6); emit('stomp', { foe: f });
    await wait(2.7);
    await tween(f, { curl: 1 }, 0.4, 'io');
    squashFoe(f, 1.15, 0.85); ST.S.fx.puff(f.x, 0.05, f.z, 8, 0.3);
    await meetKinds();                                  // «el armadillo», if Mimo doesn't know it yet
    if (pushLessonDue()) await lessonPush();
    setupScaffolds();
    if (G.L.tips.armaBoss) { G.baseTip = G.L.tips.armaBoss; UI.tip(G.baseTip); }
    return fightLoop({});
  }
  async function armaFoePhase() {
    const A_ = G.arma, f = A_.f;
    if (f.alive && A_.phase === 1 && f.hp <= Math.ceil(f.maxHp * ARMA.p2)) await armaCall(f);
    else if (f.alive && A_.phase === 2 && f.hp <= Math.ceil(f.maxHp * ARMA.p3)) await armaAngry(f);
    // its helpers go first (two at most)
    const helpers = G.foes.filter(x => x !== f && x.alive && !x.calmed && !x.shy && !x.gone);
    for (const x of helpers.slice(0, 2)) { await foeAttack(x); if (G.hearts <= 0 || allDone()) return; await wait(0.12); }
    if (!f.alive || f.gone) return;
    // on its back it wriggles this round; the next it rolls back up, and comes straight at you
    if (f.flipped) {
      f.flipped--;
      if (f.flipped) { const top = ST.worldOf(f, 'top'); UI.pop(top.clone().add(new THREE.Vector3(0, -0.25, 0)), '✦ ✦ ✦', G.t, { color: '#fff3a0', size: 26, rise: 0.35, life: 1.1 }); ST.star(top, '#fff3a0', 0.6); await wait(0.6); return; }
      await rollBack(f);
    }
    if (f.dizzy > 0) { f.dizzy = 0; refreshLabels(); armaSay('armaShake', 1.8, 'foe'); await wait(1.0); }
    await armaAttack(f);
  }
  // phase 2: two Hushlings drop out of the bell above, in the colors Bruno taught first
  async function armaCall(f) {
    G.arma.phase = 2;
    ST.shot('focus', A.mimo, f, { up: 0.9, dist: 11 });
    setMood(f, 'go', 1.6);
    armaSay('armaCall', 2.6); emit('boss-phase', { phase: 2, foe: f });
    ST.shake(0.35, 0.5);
    await wait(1.2);
    const specs = ['red', 'blue'].map(c => normFoe({ kind: 'hushling', color: c, size: 'small', hp: 4 }, 0));
    const added = ST.addFoes(specs, ST.rowSpots(2));
    added.forEach(x => { x.id = G.nextId++; x.hp = x.maxHp = x.spec.hp; x.x = x.hx; x.z = x.hz; x.hidden = true; });
    ST.shot('wide');
    await Promise.all(added.map((x, i) => wait(i * 0.3).then(() => dropIn(x))));
    updateStain(); refreshLabels();
    for (const x of added) if (!knows('a.' + x.color)) await teachColor(x.color, x);
    setupScaffolds();
    await wait(0.3);
  }
  // a Hushling falls in from above with a thud
  async function dropIn(x) {
    x.y = 5; x.hidden = false; setMood(x, 'go', 1.2);
    await tween(x, { y: x.baseY || 0 }, 0.45, 'in');
    squash(x, 1.3, 0.7, 0.06); ST.S.fx.puff(x.x, 0, x.z, 6, 0.2); ST.shake(0.25, 0.2);
    emit('drop', { foe: x });
  }
  // phase 3: angry («¡Ahora sí estoy enojado!»): two moves a turn
  async function armaAngry(f) {
    G.arma.phase = 3;
    ST.shot('focus', A.mimo, f, { up: 0.9, dist: 10 });
    setMood(f, 'go', 1.8);
    f.states.add('angry');
    armaSay('armaAngry', 2.6); emit('boss-phase', { phase: 3, foe: f });
    ST.shake(0.5, 0.8); ST.S.fx.puff(f.x, 0.1, f.z, 14, 0.4);
    await squash(f, 1.2, 0.8, 0.1);
    refreshLabels();
    await wait(1.4);
  }
  // its attack: shouted first (one move, or two in phase 3), then a roll along the ground or a bounce at your head, then dizzy
  async function armaAttack(f) {
    const A_ = G.arma, two = A_.phase >= 3;
    if (_.armaTeach) await _.armaTeach(f, two);         // (battle/foelines.js: its single, then its double shout, taught the first time; P6c)
    const first = G.auto && G.auto.burst ? G.auto.burst === 'high' : Math.random() < 0.45, moves = two ? [first, !first] : [first];
    const toMimo = Math.random() < 0.5, tgt = toMimo ? A.mimo : A.you;
    const [txt, en] = G.L.armaShout ? G.L.armaShout(G.tier, moves) : G.L.shout(G.tier, toMimo, first);
    setMood(f, 'go');
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.7 });
    say(f, txt, { cls: 'foe shout boss', en, dur: readTime(txt) + 2.4 });
    emit('shout', { text: txt, high: first, foe: f, boss: true });
    dodgeHint(true);
    await wait(readTime(txt) + (two ? 0.5 : 0.15));
    for (let i = 0; i < moves.length; i++) {
      emit('windup', { foe: f, high: moves[i], boss: true });
      await armaRoll(f, tgt, moves[i]);
      if (G.hearts <= 0) return;
      if (i + 1 < moves.length) { dodgeHint(true); await wait(0.2); }
    }
    // it crashes into the bell's frame: dizzy, for your next turn
    f.dizzy = 1;
    setMood(f, 'hurt', 1.6);
    const top = ST.worldOf(f, 'top');
    UI.pop(top, '★ ★ ★', G.t, { color: '#fff3a0', size: 30, rise: 0.4, life: 1.4 }); ST.star(top, '#fff3a0', 0.9);
    emit('dazed', { foe: f });
    armaSay('armaDizzy', 2.0, 'foe');
    refreshLabels();
    await wait(1.0);
    if (A_.dizzyTold < 2 && knows('v.push')) { A_.dizzyTold++; mimoLine('armaPush', 2.4); await wait(0.8); }
  }
  // one roll: it rocks back, rolls at you along the ground (low: jump ↑) or leaps at your head at the end (high: duck ↓)
  async function armaRoll(f, tgt, high) {
    const headY = tgt.kind === 'you' ? 1.15 : 0.55;
    f.rolling = true;
    turnTo(f, yawTo(f, tgt.x, tgt.z), 0.15);
    const s0 = f.spin || 0;
    await along(0.22, u => { f.spin = s0 - Math.sin(Math.PI * u) * 0.5; });
    const T = G.t + 0.8, key = high ? 'ArrowDown' : 'ArrowUp';
    const tp = timingWindow(T, key, () => ST.worldOf(tgt, 'mid'), { onPress: code => dodgeMove(tgt, code) });
    emit('roll', { foe: f, boss: true });
    const x0 = f.x, z0 = f.z, R = _.M.AR * f.h.scale, s1 = f.spin || 0, ex = tgt.x + 1.25, ez = tgt.z + 0.05;
    // (the same roll both ways until the last part, so the shout is what tells you which key to press)
    await along(0.8, u => {
      const e = u * 0.55 + u * u * 0.45;
      f.x = lerp(x0, ex, e); f.z = lerp(z0, ez, e);
      f.spin = s1 + Math.hypot(f.x - x0, f.z - z0) / R;
      f.y = high && u > 0.55 ? Math.sin(((u - 0.55) / 0.45) * Math.PI * 0.5) * Math.max(0.6, headY) : Math.abs(Math.sin(u * Math.PI * 5)) * 0.05;
    });
    const grade = await tp;
    dodgeResult(f, tgt, grade, 1, {});
    const bx = f.x, by = f.y, s2 = f.spin;
    await along(0.3, u => { f.x = bx + u * 0.9; f.y = by * (1 - u) + Math.sin(Math.PI * u) * 0.4; f.spin = s2 - (u * 0.9) / R; });
    f.y = 0;
    ST.shake(0.3, 0.3); ST.S.fx.puff(f.x, 0.05, f.z, 6, 0.25);
    await rollTo(f, f.hx, f.hz, 0.7);
    turnTo(f, f.baseYaw, 0.2);
    setMood(f, 'idle');
  }
  // a push while it isn't dizzy: it only rocks («¡Uf! ¡Pesa mucho!»)
  async function armaHeavy(f) {
    const s0 = f.spin || 0;
    await along(0.45, u => { f.spin = s0 + Math.sin(u * Math.PI * 2) * 0.14; });
    f.spin = s0;
    mimoLine('armaHeavy', 2.2);
    if (G.L.tips.armaBoss) UI.tip(G.L.tips.armaBoss);
    await wait(0.4);
  }
  // down to 0: the Hush leaves it. It rolls upright, the gray drains away, its helpers run off, and two words fly free
  async function armaDown(f) {
    f.alive = false; f.calmed = true; f.hp = 0; f.dizzy = 0;
    UI.labelRemove(f); UI.tagRemove(`pos:${f.id}`); UI.tagRemove(`part:${f.id}:`);
    G.stats.beaten++; earn(COINS_BOSS);
    for (const x of G.foes) if (x !== f && x.alive && !x.gone) { x.alive = false; x.calmed = true; UI.labelRemove(x); UI.tagRemove(`pos:${x.id}`); setMood(x, 'happy', 6); }
    emit('ko', { foe: f, boss: true });
    ST.shot('focus', A.mimo, f, { up: 0.9, dist: 10 });
    setMood(f, 'hurt', 1.2);
    armaSay('armaGiveUp', 2.8, 'foe');
    tween(ST.S.arena.uni.uStain, { value: 0 }, 1.6, 'io');
    const p = ST.worldOf(f, 'mid');
    ST.S.fx.puff(p.x, p.y, p.z, 26, 0.55, '#a59cc4'); ST.star(p, '#ffffff', 2.2); ST.shake(0.5, 0.6);
    await wait(0.6);
    await tween(f, { flip: 0, curl: 0, y: 0 }, 0.7, 'io');
    f.flipped = 0; f.rolling = false;
    setMood(f, 'happy', 8);
    await squash(f, 1.15, 0.88, 0.1);
    const n = 2 + (G.perks && G.perks.hunter ? 2 : 0);
    for (let k = 0; k < n; k++) freeWord(f, k * 0.9);
    await wait(1.0 + n * 0.9);
  }

  // ------------------------------------------------------------ freed words (battle/rewards.js picks them)
  // A Hush creature beaten lets go of a word it stole: its picture and the word in the language fly up out of it, and it's said
  // aloud. It counts as seen, not taught (LEX.expose, DICT.met(…, 'heard')); the card and the journal keep it.
  function freeWord(f, delay = 0) {
    if (!_.RW || !_.RW.pick || G.practice || CORN.includes(f.species) || f.species === 'dummy') return;
    let w = null;
    try { w = _.RW.pick(f, G); } catch (e) { console.warn('[battle] freed word', e); }
    if (!w) return;
    G.freed.push(w);
    const p = ST.worldOf(f, 'top');
    wait(0.35 + delay).then(() => {
      if (!G.running) return;
      if (UI.freed) UI.freed(p.clone().add(new THREE.Vector3(0, 0.2, 0)), w, G.t);
      emit('freed', { id: w.id });
      if (_.RW.say) try { _.RW.say(w); } catch (e) { /* (no voice) */ }
    });
  }
  // Mimo's level went up (shown before the card): a glow, hops, «LEVEL UP!», and the new hearts
  async function levelUpScene(rw) {
    const M = A.mimo;
    ST.shot('party');
    await wait(0.3);
    const top = ST.worldOf(M, 'top');
    emit('levelup', { lvl: rw.lvlAfter });
    setMood(M, 'happy', 3.5);
    M.glow = 1; tween(M, { glow: 0 }, 2.6);
    ST.S.fx.sparkle(top.x, top.y, top.z, 30, ['#ffd166', '#fff3a0', '#7ff7ea']); ST.star(top, '#ffd166', 1.4);
    UI.pop(top.clone().add(new THREE.Vector3(0, 0.55, 0)), 'LEVEL UP!', G.t, { color: '#ffd166', size: 48, rise: 0.7, life: 2.4, sub: `${G.name} · Lv ${rw.lvlAfter}` });
    for (let i = 0; i < 2; i++) { await squash(M, 1.25, 0.76, 0.06); await arcTo(M, M.hx, 0, M.hz, 0.38, 1.0); }
    squash(M, 1.2, 0.8, 0.06);
    mimoLine('levelUp', 2.2);
    // (P6b, hearts carry over between fights, js/hearts.js: a level-up never refills them; it gives 1 ♥ back for each level, and a
    // new heart's slot comes in empty: the card says so)
    const ups = Math.max(1, (rw.levelUps && rw.levelUps.length) || 1), h0 = G.hearts;
    if (rw.heartsAfter > G.maxHearts) G.maxHearts = rw.heartsAfter;
    G.hearts = Math.min(G.maxHearts, G.hearts + ups); G.lvHealed = (G.lvHealed || 0) + ups;
    UI.hearts(G.hearts, G.maxHearts, G.name, 'heal');
    if (G.hearts > h0) UI.pop(top.clone().add(new THREE.Vector3(0.6, 0.1, 0)), `+${G.hearts - h0} ♥`, G.t, { color: '#9df0b4', size: 32, rise: 0.5, life: 1.6 });
    await wait(1.5);
  }

  // ------------------------------------------------------------ the Quarry Caves (region 3): echo bats, and Mimo's song
  // Echo bats remember what you said last (the giant one, your last two commands): say it again and they echo it right back
  // at you (it hurts, no dodging, no grade). Mimo's song («canta / canta / sing») reaches every foe at once with one timing
  // press: a little for each, more for Hushlings (they're made of the Hush), echo bats get dizzy and sit the next round out
  // (foePhase), and sleepers wake up. In the cave arena (stage.js buildCave) the crystals flare with it.
  const batsHere = () => G.foes.filter(f => f.species === 'bat' && f.alive && !f.gone && !f.calmed);
  function echoes(key) {
    const bats = batsHere(); if (!bats.length || !key) return false;
    const mem = bats.some(f => f.spec && f.spec.giant) ? 2 : 1;
    return (G.keyLog || []).slice(-mem).includes(key);
  }
  async function echoBack(r) {
    const bats = batsHere(), f = bats.find(b => b.spec && b.spec.giant) || bats[0], s = G.stats;
    s.echoed = (s.echoed || 0) + 1;
    setMood(f, 'go', 1.4);
    ST.shot('action', f, A.mimo, { yaw: 0.04 });
    const words = String(r.raw || '').replace(/[!¡?¿.]+/g, '').trim();
    say(f, `«${words}»… «${words}»…`, { cls: 'foe shout', en: line('echoBack')[1], dur: 2.3 });
    emit('echo');
    await wait(0.8);
    await tween(f, { sx: 1.3, sy: 0.72 }, 0.12);
    const tgt = Math.random() < 0.5 ? A.mimo : A.you, dmg = f.spec && f.spec.giant ? 2 : 1;
    ST.ring(f, '#c9b8ff', 2.6);
    G.hearts = Math.max(0, G.hearts - dmg); UI.hearts(G.hearts, G.maxHearts, G.name, true);
    tgt.flash = 0.25; setMood(tgt, 'hurt', 0.8);
    UI.pop(ST.worldOf(f, 'top'), 'ECHO!', G.t, { color: '#c9b8ff', size: 36 });
    UI.pop(ST.worldOf(tgt, 'top'), `-${dmg} ♥`, G.t, { color: '#ff9b88', size: 34 });
    ST.star(ST.worldOf(tgt, 'mid'), '#c9b8ff', 0.8); ST.shake(0.55, 0.4);
    emit('hurt', { hearts: G.hearts });
    tween(f, { sx: 1, sy: 1 }, 0.3, 'back');
    setMood(A.mimo, 'sad', 1.6);
    await wait(0.6);
    sideLine('copyCat', 2.0);
    if (!G.echoTold && G.L.tips.bat) { G.echoTold = true; UI.tip(fill(G.L.tips.bat)); }
    await wait(1.0);
  }
  async function actSing(c) {
    const M = A.mimo, foes = targetable().filter(f => !f.shy);
    setMood(M, 'happy', 2.2);
    ST.shot('wide');
    const [t0, en0] = line('singing'); say(M, t0, { cls: 'mimo', en: en0, dur: 1.8 });
    emit('sing');
    if (ST.S.arena && ST.S.arena.flash) ST.S.arena.flash();
    const T = G.t + 0.75, gp = timingWindow(T, 'Space', () => ST.worldOf(M, 'top'));
    for (let i = 0; i < 6; i++) { ST.note(ST.worldOf(M, 'top').add(new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.15, 0))); await wait(0.12); }
    squash(M, 1.2, 0.82, 0.08);
    const grade = await gp;
    let first = true;
    for (const f of foes) {
      if (!f.alive || f.gone) continue;
      const p = ST.worldOf(f, 'mid');
      const base = f.species === 'hushling' || f.species === 'hushbig' ? 2 : 1;      // (the Hush's own creatures hate a voice)
      const cc = Object.assign({}, c, { target: f, crit: false, weakHit: false, sneak: false, armored: false, curled: false, belly: false, open: false, bounce: false, flip: false, partKey: null });
      if (!first) G.badgePending = null;
      await land(cc, base, grade, p, false, { knock: 0.1 });
      first = false;
      if (f.alive && !f.gone && f.species === 'bat') { f.dazed = 1; const [t, en] = line('dazed', f); say(f, t, { cls: 'foe small', en, dur: 1.5 }); emit('dazed'); }
      await wait(0.1);
    }
    setMood(M, 'idle');
  }

  // ------------------------------------------------------------ the Bloom Gardens (region 4): picky bees, and Mimo's climb
  // Each picky bee wants one thing (f.likes: a GARDENS.likes thing: rose, sunflower, tulip, lavender, honey; from the spec, or
  // picked when the fight starts, different for each bee) and buzzes it as it comes in («¡Me gustan las rosas!»); a bubble over
  // its head shows it after that. A sentence that names one of those things is said to the bees, not to Mimo (beeLike): the
  // bee it's for (a color names it; else the one that wants that thing) calms down and flies off happy if it's what it likes,
  // and counts as beaten; the wrong thing makes it angry (it stings for two). Graded S–D on the likes grammar (gardens.js
  // GARDENS.likes.grade, to: 'you'). The Queen Bee (spec.queen) isn't calmed: soothed, she sits the next round out (f.dazed)
  // and then wants something else. Climb («trepa / sobe / kletter») takes no target: a vine shoots up by one (a flier
  // first), Mimo scrambles up it and drops on it from above (a jump's damage): a flier is knocked down for a turn.
  const BEE_LIKES = ['rose', 'sunflower', 'tulip', 'lavender', 'honey'];
  const beesHere = () => G.foes.filter(f => f.species === 'bee' && f.alive && !f.gone && !f.calmed);
  const likeIcon = k => (typeof GARDENS !== 'undefined' && GARDENS.likes && GARDENS.likes.THINGS[k] ? GARDENS.likes.THINGS[k].icon : 'flower');
  function beeSetup() {
    const used = new Set(G.foes.filter(f => f.species === 'bee' && f.spec && f.spec.likes).map(f => f.spec.likes));
    for (const f of G.foes) {
      if (f.species !== 'bee') continue;
      let k = f.spec && f.spec.likes;
      if (!k) { const free = BEE_LIKES.filter(x => !used.has(x)); k = (free.length ? free : BEE_LIKES)[Math.floor(Math.random() * (free.length || BEE_LIKES.length))]; used.add(k); }
      f.likes = k; f.likeShown = false;
      if (f.spec && f.spec.queen && f.h && f.h.addCrown) f.h.addCrown();      // (the Queen Bee)
    }
  }
  // as they come in, each bee buzzes what it likes (and the first time, the tip says what to do about it)
  async function beesAnnounce() {
    const bees = beesHere(); if (!bees.length) return;
    for (const f of bees) {
      ST.shot('focus', A.mimo, f, { up: 0.5 });
      setMood(f, 'go', 1.2); emit('buzz');
      const [t, en] = _.beeWants ? _.beeWants(G.lang, f.likes) : ['Bzz!', 'Bzz!'];
      say(f, t, { cls: 'foe', en, dur: 2.6 });
      f.likeShown = true; if (f.h && f.h.setLike) f.h.setLike(likeIcon(f.likes));
      await squash(f, 1.18, 0.86, 0.08);
      await wait(1.5);
    }
    ST.shot('wide');
    if (G.L.tips.bee && !G.beeTipShown) { G.beeTipShown = true; UI.tip(fill(G.L.tips.bee)); }
  }
  // a sentence about what someone likes, said to the bees: → a 'like' result for perform, or null (peek: for the preview)
  function beeLike(text) {
    const bees = beesHere(); if (!bees.length || typeof GARDENS === 'undefined' || !GARDENS.likes) return null;
    const lang = G.lang, g0 = GARDENS.likes.grade(text, lang, { to: 'you' });
    if (!g0.thing) return null;
    // who it's for: a color names one («Abeja roja, te gustan…»); else the one that wants that thing; else the first
    let f = null;
    if (!G.L.cjk) {
      const I = P.indexLang(G.L), cols = P.tokenize(text).map(t => P.look(I.adjs, t.n)).filter(Boolean).map(a => a.key);
      const named = bees.filter(b => cols.includes(b.color));
      if (named.length === 1) f = named[0];
    }
    f = f || bees.find(b => b.likes === g0.thing) || bees[0];
    const g = GARDENS.likes.grade(text, lang, { to: 'you', thing: f.likes });
    const right = g.thing === f.likes && !g.neg;
    const grade = { letter: g.letter || 'C', mult: (GRADES[g.letter] || GRADES.C).mult, reason: g.reason || '', slips: g.slips.length };
    const words = [], T = GARDENS.likes.THINGS[g.thing];
    if (T && hasLEX() && LEX.item(T.id)) words.push(T.id);
    return { ok: true, kind: 'like', raw: text, target: f, right, grade, canon: GARDENS.likes.model(f.likes, lang, { to: 'you' }), slipKinds: g.slips.map(s => s.kind).concat(g.soft.map(s => s.kind)),
      recast: right && g.letter !== 'S', words, patterns: ['like'], errors: [], fixes: [], clauses: [], untaught: [], thing: g.thing };
  }
  function likePreview(r) {
    const f = r.target, who = foeName(f);
    return `<b>${UI.esc(G.name)} understood:</b> tell ${UI.esc(who)} it likes ${UI.esc((GARDENS.likes.THINGS[r.thing] || {}).en || r.thing)}${r.right ? ' <span class="bonus">it calms down</span>' : ' <span class="warn">· that’s not what it wants: it’ll get angry!</span>'} ${r.right ? gradePill(r.grade) : ''}`;
  }
  async function doLike(r) {
    const f = r.target, s = G.stats, T = typeof GARDENS !== 'undefined' && GARDENS.likes ? GARDENS.likes.THINGS[f.likes] : null;
    ST.shot('action', A.you, f, { yaw: 0.05, up: 0.3 });
    if (r.recast) { say(A.mimo, P.recastHTML(r.canon, r.raw, UI.esc), { html: true, cls: 'mimo', dur: 2.6 }); s.recasts++; noteMistake({ kind: 'grammar', typed: r.raw, right: r.canon, errors: r.slipKinds, grade: r.grade.letter }); }
    await wait(0.9);
    if (!r.right) {
      // the wrong thing: it gets angry (its stings take two hearts now)
      setMood(f, 'go', 1.4); f.states.add('angry'); emit('buzz');
      const [t, en] = line('beeAngry'); say(f, t, { cls: 'foe shout', en, dur: 2.2 });
      ST.ring(f, '#ff8a6a', 2.4); squash(f, 1.25, 0.82, 0.08);
      UI.pop(ST.worldOf(f, 'top'), 'ANGRY!', G.t, { color: '#ff8a6a', size: 32 });
      refreshLabels();
      await wait(1.3);
      if (G.L.tips.bee) UI.tip(fill(G.L.tips.bee));
      return;
    }
    countGrade(r); G.badgePending = r.grade; showGrade(f, { right: true });
    f.states.delete('angry');
    const [tc, enc] = line(T && T.count ? 'beeCalmPl' : 'beeCalm');
    if (f.spec && f.spec.queen) {
      // the Queen: soothed for a round (she doesn't sting), then she wants something else
      f.dazed = 1; setMood(f, 'happy', 2);
      say(f, tc, { cls: 'foe', en: enc, dur: 2.2 }); ST.note(ST.worldOf(f, 'top')); emit('sing');
      UI.pop(ST.worldOf(f, 'top'), 'SOOTHED', G.t, { color: '#ffd6e2', size: 30 });
      await wait(1.6);
      f.likes = BEE_LIKES.filter(k => k !== f.likes)[Math.floor(Math.random() * 4)];
      if (f.h && f.h.setLike) f.h.setLike(null);
      await wait(0.4);
      const [tw, enw] = _.beeWants ? _.beeWants(G.lang, f.likes) : ['Bzz!', 'Bzz!'];
      say(f, tw, { cls: 'foe', en: enw, dur: 2.6 }); emit('buzz');
      if (f.h && f.h.setLike) f.h.setLike(likeIcon(f.likes));
      await wait(1.6);
      return;
    }
    // calmed: it hums happily, and flies off (it counts as beaten)
    say(f, tc, { cls: 'foe', en: enc, dur: 2.0 });
    f.calmed = true; f.alive = false; s.befriended++; s.beaten++; earn(COINS_FOE);
    UI.labelRemove(f); emit('befriend');
    setMood(f, 'happy'); tween(f, { tint: 1 }, 1.2, 'io');
    const p = ST.worldOf(f, 'top');
    ST.S.fx.sparkle(p.x, p.y, p.z, 22, ['#ffd166', '#ff9bb3', '#fff3a0']); ST.note(p);
    if (f.h && f.h.setLike) f.h.setLike(null);
    updateStain();
    await wait(1.1);
    const [tb, enb] = line('beeBye'); say(f, tb, { cls: 'foe small', en: enb, dur: 1.6 });
    await arcTo(f, f.x + 2.6, (f.baseY || 1) + 2.4, f.z - 2.2, 0.9, 0.8);
    f.hidden = true; f.gone = true;
    await wait(0.2);
  }
  // the autopilot's sentence for a bee: what it likes, the right way («¡Te gustan las rosas!»), now and then with its color
  function beeAuto(f) {
    if (typeof GARDENS === 'undefined' || !GARDENS.likes) return null;
    return GARDENS.likes.model(f.likes, G.lang, { to: 'you' });
  }
  // a vine for Mimo to climb: a green stalk with leaves, shooting up out of the ground
  function vineProp() {
    const g = new THREE.Group(), stalk = TK.part(new THREE.CylinderGeometry(0.05, 0.08, 2.6, 7), '#4f9a45', [0, 1.3, 0], null, { ink: 0.015 });
    g.add(stalk);
    for (let i = 0; i < 6; i++) { const a = i * 2.4; g.add(TK.part(TK.G.sphere, i % 2 ? '#5fae4f' : '#478c3e', [Math.cos(a) * 0.16, 0.35 + i * 0.38, Math.sin(a) * 0.16], [0.17, 0.05, 0.1], { rot: [0, -a, 0.5], ink: 0.008 })); }
    g.add(TK.part(TK.G.sphere, '#ff8fb1', [0.05, 2.6, 0], [0.12, 0.1, 0.12], { ink: 0.01 }));
    return g;
  }
  async function actClimb(c) {
    const M = A.mimo, pool = targetable().filter(x => !x.shy && !x.noAuto);
    const f = pool.find(x => x.floating && !x.down && x === c.target) || pool.find(x => x.floating && !x.down) || c.target;
    if (!f) return;
    c.target = f;
    setMood(M, 'go', 2.5);
    const [t0, en0] = line('climbing'); say(M, t0, { cls: 'mimo', en: en0, dur: 1.6 });
    ST.shot('action', M, f, { yaw: -0.06, up: 0.5 });
    // the vine shoots up beside it; Mimo hops to its foot and scrambles up
    const vx = f.x - 1.0, vz = f.z + 0.4;
    const vine = ST.prop(vineProp()); vine.position.set(vx, 0, vz); vine.scale.set(1, 0.02, 1);
    ST.S.fx.puff(vx, 0.05, vz, 6, 0.18, '#a8d08a');
    emit('climb');
    await tween(vine.scale, { y: 1 }, 0.32, 'out');
    turnTo(M, yawTo(M, vx, vz), 0.1);
    await arcTo(M, vx - 0.28, 0, vz + 0.12, 0.34, 0.5);
    const top = Math.max(1.7, (f.baseY || 0) + 1.2);
    await along(0.55, u => { M.y = u * top; M.x = vx - 0.28 + Math.sin(u * 22) * 0.04; M.lean = -0.4; });
    M.lean = 0;
    // …and drops onto it from above (a press as it lands)
    const p = ST.worldOf(f, 'top'), T = G.t + 0.42, gp = gradeFor(f, T, 'top');
    const [t1, en1] = line('fromAbove'); say(M, t1, { cls: 'mimo', en: en1, dur: 1.2 });
    await arcTo(M, p.x - 0.05, p.y, p.z, 0.42, 0.7);
    M.sx = 1.35; M.sy = 0.66; squashFoe(f, 1.3, 0.62);
    const grade = await gp;
    await land(c, 2, grade, p);
    if (f.alive && !f.gone && f.floating && !f.down) await knockDown(f);
    tween(M, { sx: 1, sy: 1 }, 0.2, 'back');
    tween(vine.scale, { y: 0.02 }, 0.3, 'in').then(() => ST.dropProp(vine));
    await hopHome(M, 1.4, 0.55);
    setMood(M, 'idle');
  }

  // ------------------------------------------------------------ the Frost Peaks (region 5): snowballs, and Mimo's blow
  // A snowball grows a size every round nobody hits it (f.snow: 0 small, 1 big, 2 huge; a giant up to 3): more hearts, a
  // bigger body (models.js poses it by f.growK), and a huge one's hits take two hearts. Any hit (a PERFECT counter too) knocks the fresh snow off
  // for that round (hurtFoe marks f.hitTurn). Mimo's blow («sopla / sopra / puste») is one gust over the whole field with a
  // timing press: a little for everyone, snowballs lose a size, and fliers are blown down for a round (knockDown).
  // Its size is a word you can aim with: a grown one is «grande», «la bola grande» / «den großen Schneeball».
  function snowSet(f, stage, instant) {
    const max = f.spec && f.spec.giant ? 3 : 2;
    f.snow = clamp(stage, 0, max);
    f.size = f.snow >= 1 ? 'big' : 'small';
    f.growK = 1 + f.snow * 0.3;
    if (instant) f.growS = f.growK;
  }
  async function snowGrow() {
    const list = G.foes.filter(f => f.species === 'snowball' && f.alive && !f.gone && !f.calmed);
    let any = false;
    for (const f of list) {
      if (f.hitTurn === G.turn || f.blownTurn === G.turn) continue;
      if (f.snow >= (f.spec && f.spec.giant ? 3 : 2)) continue;
      if (!any) { ST.shot('wide'); any = true; await wait(0.25); }
      snowSet(f, f.snow + 1);
      const add = f.spec && f.spec.giant ? 4 : 3; f.maxHp += add; f.hp += add;
      emit('grow'); squash(f, 1.25, 0.82, 0.12);
      const p = ST.worldOf(f, 'top'), [t, en] = line('grew', f);
      UI.pop(p, t, G.t, { color: '#e6f4fb', size: 26, rise: 0.4, life: 1.2 }); say(f, t, { cls: 'foe small', en, dur: 1.2 });
      ST.S.fx.puff(p.x, p.y - 0.3, p.z, 8, 0.25, '#f4f8fb');
      await wait(0.4);
    }
    if (any) { refreshLabels(); if (!G.growTold && G.L.tips.snowball) { G.growTold = true; UI.tip(fill(G.L.tips.snowball)); } await wait(0.3); }
  }
  async function actBlow(c) {
    const M = A.mimo, foes = targetable().filter(f => !f.shy);
    setMood(M, 'perk', 1.8);
    ST.shot('wide');
    const [t0, en0] = line('blowing'); say(M, t0, { cls: 'mimo', en: en0, dur: 1.6 });
    emit('blow');
    const T = G.t + 0.7, gp = timingWindow(T, 'Space', () => ST.worldOf(M, 'top'));
    await tween(M, { sx: 1.28, sy: 0.86 }, 0.4, 'out');        // it breathes in, puffed up…
    const grade = await gp;
    tween(M, { sx: 0.84, sy: 1.12, lean: 0.3 }, 0.1).then(() => tween(M, { sx: 1, sy: 1, lean: 0 }, 0.35, 'back'));     // …and blows
    { const p = ST.worldOf(M, 'mid'); for (let i = 0; i < 9; i++) ST.S.fx.puff(p.x + 0.4 + i * 0.55, p.y + (Math.random() - 0.4) * 0.5, p.z + (Math.random() - 0.5) * 1.4, 2, 0.18 + i * 0.03, '#f4f8fb', 0.25); }
    let first = true;
    for (const f of foes) {
      if (!f.alive || f.gone) continue;
      const p = ST.worldOf(f, 'mid');
      const cc = Object.assign({}, c, { target: f, crit: false, weakHit: false, sneak: false, armored: false, curled: false, belly: false, open: false, bounce: false, flip: false, partKey: null });
      if (!first) G.badgePending = null;
      await land(cc, 1, grade, p, false, { knock: 0.6 });
      first = false;
      if (!f.alive || f.gone) continue;
      if (f.species === 'snowball') {
        f.blownTurn = G.turn;
        if (f.snow > 0) { snowSet(f, f.snow - 1); emit('shrink'); const [t, en] = line('shrunk', f); say(f, t, { cls: 'foe small', en, dur: 1.4 }); }
      } else if (f.floating && !f.down) await knockDown(f);
      await wait(0.08);
    }
    refreshLabels();
    setMood(M, 'idle');
  }
  // «la bola de nieve» / «a bola de neve» read as «la bola» / «a bola» (the parser's words are one token each)
  { const parse0 = P.parse; P.parse = (text, ctx) => parse0(String(text).replace(/\b(bolas?|bolitas?)\s+de\s+(nieve|neve)\b/gi, '$1'), ctx); }

  // ------------------------------------------------------------ Port Brisa (region 6): crabs, and Mimo's call
  // A crab walks sideways, shell and claws always to the front: a hit from the front clangs off (clangOff). Say where,
  // «¡Golpea al cangrejo por detrás!» / «Bate no caranguejo por trás!» / «Schlag die Krabbe von hinten!» / «从后面打螃蟹！» /
  // «後ろからカニを叩いて！», and Mimo scuttles round and lands it ×2 (judge: c.behind). The parser knows nothing of the phrase:
  // it's taken out before it reads the command, and put back in the canon (and in every example said to a crab, P.sayAction).
  // Call («llama / chama / ruf», 叫, 呼んで; no target): the gulls dive at everyone, a peck each, and fliers fall.
  const BEHIND = {
    es: ['por detrás', 'por detras', 'por atrás', 'por atras', 'desde atrás', 'desde atras', 'de atrás', 'de atras'],
    pt: ['por trás', 'por tras', 'de trás', 'de tras', 'pelas costas', 'por detrás', 'por detras'],
    de: ['von hinten'],
    zh: ['从后面', '从背后', '从后边', 'cóng hòu miàn', 'cóng hòumiàn', 'cong hou mian', 'cong houmian', 'conghoumian'],
    ja: ['後ろから', 'うしろから', '後ろ から', 'うしろ から', 'ushiro kara', 'ushirokara'],
  };
  const BEHIND_SHOW = { es: 'por detrás', pt: 'por trás', de: 'von hinten', zh: '[从|cóng] [后面|hòu miàn]', ja: '[後|うし]ろ から' };
  function stripBehind(text) {
    const s = String(text), low = s.toLowerCase(), list = (BEHIND[G.lang] || []).slice().sort((a, b) => b.length - a.length);
    for (const w of list) {
      const i = low.indexOf(w); if (i < 0) continue;
      const j = i + w.length, latin = /[a-z]/.test(w[0]);
      if (latin && ((i > 0 && /[a-zà-ÿ]/.test(low[i - 1])) || (j < low.length && /[a-zà-ÿ]/.test(low[j])))) continue;     // (whole words only)
      const rest = (s.slice(0, i) + ' ' + s.slice(j)).replace(/([¡¿])\s*,\s*/g, '$1').replace(/\s+([,!?.！？。、])/g, '$1').replace(/,\s*([!?.])/g, '$1').replace(/^[\s,、]+/, '').replace(/\s{2,}/g, ' ').trim();
      return { behind: true, rest: rest || s };
    }
    return { behind: false, rest: s };
  }
  function addBehind(L, s) {
    const lang = (L && L.code) || G.lang, w = BEHIND_SHOW[lang]; if (!w || !s) return s;
    if ((BEHIND[lang] || []).some(x => String(s).toLowerCase().includes(x)) || String(s).includes(w)) return s;
    if (lang === 'zh' || lang === 'ja') return w + ' ' + s;                         // («从后面 打 螃蟹！», «後ろから カニ を 叩いて！»)
    return String(s).replace(/\s*([!?.！？。]*)\s*$/, ` ${w}$1`);                   // («¡Golpea al cangrejo por detrás!»)
  }
  if (typeof PORT !== 'undefined') {       // (parked until port.js is loaded: without it, commands read exactly as before)
    const parse0 = P.parse;
    P.parse = (text, ctx) => {
      const b = stripBehind(text);
      if (!b.behind) return parse0(text, ctx);
      const r = parse0(b.rest, ctx);
      if (r) { r.behind = true; if (r.ok) { r.raw = String(text); if (r.canon) r.canon = addBehind((ctx && ctx.L) || G.L, r.canon); } }
      return r;
    };
    const say0 = P.sayAction;
    P.sayAction = (L, verb, f, o) => { const s = say0(L, verb, f, o); return f && f.species === 'crab' ? addBehind(L, s) : s; };
  }
  function clangOff(c, p) {
    const f = c.target;
    setMood(f, 'happy', 0.9); setMood(A.mimo, 'confused', 1.2);
    G.hitstop = 0.05; ST.shake(0.22, 0.25);
    ST.S.fx.puff(p.x, p.y, p.z, 5, 0.14, '#e8d6c0');
    UI.pop(p.clone().add(new THREE.Vector3(0.45, 0.35, 0)), 'CLANG!', G.t, { color: '#f4dcc4', size: 36, sub: 'from behind!', dx: 0.25 });
    showGrade(f);
    squashFoe(f, 1.05, 0.97);
    tween(A.mimo, { lean: -0.5 }, 0.08).then(() => tween(A.mimo, { lean: 0 }, 0.3, 'back'));
    G.stats.clanged = (G.stats.clanged || 0) + 1;
    emit('clang');
    const [t, en] = line('crabClang'); say(f, t, { cls: 'foe', en, dur: 1.8 });
    if (G.L.tips.crab) UI.tip(G.L.tips.crab);
  }
  // the gulls: little white birds diving out of the sky at each foe in turn, and away
  function gull() {
    const g = new THREE.Group(), white = TK.toon('#ffffff', { rim: 0.2 }), gray = TK.toon('#c9d0d8', { rim: 0.1 });
    const body = new THREE.Mesh(TK.G.sphere, white); body.scale.set(0.11, 0.09, 0.2); g.add(body);
    const head = new THREE.Mesh(TK.G.sphere, white); head.scale.setScalar(0.07); head.position.set(0, 0.05, 0.17); g.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.08, 5), TK.toon('#f2b84a', { rim: 0 })); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.04, 0.26); g.add(beak);
    for (const s of [-1, 1]) { const w = new THREE.Mesh(TK.G.box, gray); w.scale.set(0.4, 0.015, 0.13); w.position.set(s * 0.24, 0.03, 0); w.rotation.z = s * 0.35; g.add(w); }
    return g;
  }
  async function actCall(c) {
    const M = A.mimo, foes = targetable().filter(f => !f.shy);
    setMood(M, 'perk', 1.8);
    ST.shot('wide');
    const [t0, en0] = line('calling'); say(M, t0, { cls: 'mimo', en: en0, dur: 1.6 });
    emit('call');
    const T = G.t + 0.7, gp = timingWindow(T, 'Space', () => ST.worldOf(M, 'top'));
    await tween(M, { sx: 0.88, sy: 1.2 }, 0.4, 'out');                 // it fills up with air… and calls
    const grade = await gp;
    tween(M, { sx: 1, sy: 1 }, 0.35, 'back');
    let first = true;
    for (const f of foes) {
      if (!f.alive || f.gone) continue;
      const p = ST.worldOf(f, 'mid'), g = ST.prop(gull());
      g.position.set(p.x - 2.6, p.y + 3.4, p.z + 1.2); g.lookAt(p.x, p.y, p.z);
      await tween(g.position, { x: p.x - 0.1, y: p.y + 0.2, z: p.z }, 0.32, 'in');
      const cc = Object.assign({}, c, { target: f, crit: false, weakHit: false, sneak: false, armored: false, curled: false, belly: false, open: false, bounce: false, flip: false, clang: false, behind: false, partKey: null });
      if (!first) G.badgePending = null;
      await land(cc, 1, grade, p, false, { knock: 0.3 });
      first = false;
      tween(g.position, { x: p.x + 2.8, y: p.y + 3.0, z: p.z - 1.4 }, 0.45, 'out').then(() => ST.dropProp(g));
      if (f.alive && !f.gone && f.floating && !f.down) await knockDown(f);
      // (Port Brisa) a crab turns round to snap at the gulls: its back is to you for your next hit (the judge reads f.turned), and
      // it sits the foes' round out; foePhase turns it back the round after
      if (f.alive && !f.gone && f.species === 'crab' && !(f.turned > 0)) { f.turned = 2; f.yaw0 = f.yaw; turnTo(f, f.yaw + Math.PI, 0.3); UI.pop(ST.worldOf(f, 'top'), '↺', G.t, { color: '#fff3a0', size: 30, rise: 0.4, life: 1.2 }); }
      await wait(0.06);
    }
    refreshLabels();
    setMood(M, 'idle');
  }

  // ------------------------------------------------------------ the contract
  B.start = function (opts = {}) {
    if (G.running) end('flee');
    if (!opts.renderer) throw new Error('BATTLE.start needs opts.renderer');
    return new Promise(resolve => {
      G.resolve = resolve;
      begin(opts);
      const token = (G.run = {});
      runBattle(token);
    });
  };
  B.update = function (dt, input) {
    if (!G.running) return;
    dt = Math.min(0.05, Math.max(0, dt || 0));
    const inp = input || {};
    if (G.confirmOpen) { if (inp.interact) confirmFlee(true); else if (inp.cancel) confirmFlee(false); }
    else if (G.timing) {
      if (inp.jumpPressed || inp.interact) pressTiming('Space');
      else if (inp.up) pressTiming('ArrowUp');
      else if (inp.down) pressTiming('ArrowDown');
    } else if ((inp.interact || inp.jumpPressed) && G.coachNext) G.coachNext();
    else if ((inp.interact || inp.jumpPressed) && G.resultNext) G.resultNext();     // (the practice card: Again)
    else if (inp.cancel && G.resultDone) G.resultDone();                            // (the practice card: Done)
    else if (inp.cancel && G.pending) { G.confirmOpen = true; UI.confirm(true); }
    let gdt = dt;
    if (G.hitstop > 0) { G.hitstop -= dt; gdt = 0; }
    tick(gdt);
    // idle flavor: Hushlings shush while you think (the Corn Society whispers «Psst…»; straw dummies keep quiet)
    if (G.pending && G.pending.kind === 'command' && G.t > G.nextShh) {
      const f = targetable().filter(x => !x.shy && !x.states.has('asleep') && x.species !== 'dummy');
      if (f.length) { const x = f[Math.floor(Math.random() * f.length)]; say(x, CORN.includes(x.species) ? line('psst')[0] : 'Shh…', { cls: 'foe small', dur: 1.4 }); }
      G.nextShh = G.t + 6 + Math.random() * 5;
    }
    ST.update(gdt, G.t);
    ST.cameraStep(dt, G.renderer);
    UI.sync(G.t);
    if (UI.U.root) UI.U.root.classList.toggle('busy', !!G.timing || (!G.pending && !G.coachNext && !G.resultNext));
  };
  B.render = function () { if (G.renderer && ST.S.scene) ST.render(G.renderer); };
  B.isRunning = () => G.running;
  B.abort = () => { if (G.running) end('flee'); };
  // The boss contract (DESIGN.md 16, for the music): while a boss fight runs, what it was started with (opts.boss: true or an id
  // like 'armadillo'), or the id worked out from its foes ('hill', 'frog', 'bat', 'bee', 'snowman'); null otherwise.
  // bossOf(opts): the same for a fight that hasn't started yet (main.js picks the song before BATTLE.start).
  B.boss = () => (G.running && G.bossId ? G.bossId : null);
  B.bossOf = opts => bossIdOf(opts || {}) || null;
  // what battle/tactics.js (the battle skills: tells, descriptions, combos, talking them down, team orders) builds on
  _.flow = { G, A, ST, UI, P, emit, wait, tween, along, arcTo, squash, turnTo, yawTo, setMood, say, line, readTime, coachSay, mimoLine, sideLine, ask, askOrFlee, perform,
    judge, gradeOf, targetable, ctx, knows, showWord, theWord, uniqueDesc, descOpts, needOf, attackVerbs, knownVerbs, hurtAmount, hurtFoe, land, defeat, knockDown, refreshLabels,
    timingWindow, dodgeResult, dodgeMove, dodgeHint, showGrade, squashFoe, hopHome, intro, foesEnter, practiceFeedback, practiceCheer, practiceCard, practiceBye, setupScaffolds, meetKinds,
    normFoe, earn, allDone, updateStain, noteMistake, foodThe, refreshBag, bagFoods, mimoReact, strawHit, topple, MOVES, COINS_FOE, GRADES, FLEE, shuffle, foePhase, frameUse, renderFrames,
    learnPop, countGrade, recordWords, facing, hesitate, teachWord };
  // for tests and tools
  _.api = {
    G, A, submit, press: pressTiming, next: () => { if (G.coachNext) G.coachNext(); else if (G.resultNext) G.resultNext(); }, knows, judge, ctx, targetable,
    autoCommand, uniqueDesc, descOpts, maxRung, needOf, showWord, gradeOf, GRADES, theWord, results,
    eatSentence, pushExample, bestFood, bagFoods, attackVerbs, COINS,
    // where they stand: the word that tells a look-alike apart, the words the Coach would teach now, an example, the swap
    posNeeded, posKeysDue, posExample, frogsHop, order: P.order,
    // practice (the dummies a focus would get now) and the Corn Society (open / close the cape, call a squad, heat the floor)
    practiceFoes, capeOpen: () => G.boss && capeOpen(G.boss.f), capeClose: () => G.boss && capeClose(G.boss.f), callSquad: () => G.boss && callSquad(G.boss.f),
    heatUp: () => G.boss && heatUp(G.boss.f),
    // the Great Mill's armadillo (its state, and its floors) and the boss contract
    arma: () => G.arma, armaFloor: () => (G.arma ? armaFloor() : 0), bossIdOf, bossKindOf, freeWord,
    // the grade a typed command would get right now, without sending it: { letter, mult, reason, slips } or the parse failure
    grade: text => { const r = P.parse(text, ctx()); if (!r.ok) return { fail: r.reason, word: r.word }; judge(r); return Object.assign({ canon: r.canon }, r.grade); },
  };

  // the position word that picks f out of the ones in `list` a description ({ adjs, noun }) fits, the way the parser
  // picks (null when the description already picks f alone)
  function posFor(f, o, list, foes) {
    const group = list.filter(x => (!o.noun || x.species === f.species) && (o.adjs || []).every(k => P.hasTrait(x, k)));
    if (group.length < 2) return null;
    return ['left', 'right', 'middle'].find(k => knows('p.' + k) && P.posPick(group, k, foes) === f) || null;
  }
  // the autopilot for tests: a fluent command at the current demand, varied so it never repeats
  function autoCommand() {
    const keyOf = s => P.tokenize(s).map(t => t.n).join(' '), parses = s => !!beeLike(s) || P.parse(s, ctx()).ok;     // (a picky bee's sentence isn't a command)
    let s = autoCommand1(0);
    for (let k = 1; k < 7 && (keyOf(s) === G.lastKey || echoes(keyOf(s)) || !parses(s)); k++) s = autoCommand1(k);     // (never what an echo bat remembers)
    // nothing Mimo knows picks one out: a bare verb, and Mimo picks
    if (!parses(s)) { const vs = attackVerbs(), v = vs.includes('jump') ? 'jump' : vs[0] || 'jump'; s = P.wrapS(G.L, showWord('v.' + v)); }
    return s;
  }
  function autoCommand1(bump) {
    const L = G.L, foes = targetable();
    // hurt, with food in the bag: eat something (now and then with «un / una», «ein»)
    if (G.auto && G.auto.eat !== false && knows('v.eat') && G.hearts <= G.maxHearts - (G.auto.eatAt || 2) && bagFoods().length && bump < 2)
      return eatSentence(bestFood(), { indef: (G.turn + bump) % 2 === 1 });
    const shy = foes.find(f => f.shy);
    if (shy && G.auto && G.auto.talk !== false) return L.autoTalk[Math.min(shy.calm, L.autoTalk.length - 1)];
    // picky bees (the Bloom Gardens): tell one what it likes, every other turn (G.auto.like: false never, 'always' every turn)
    const bee = foes.find(f => f.species === 'bee' && f.likes && !(f.spec && f.spec.queen && f.dazed));
    if (bee && G.auto && G.auto.like !== false && bump < 2 && (G.auto.like === 'always' || (G.turn + bump) % 2 === 1)) { const s = beeAuto(bee); if (s) return s; }
    const all = foes.filter(f => !f.shy), open = all.filter(f => !f.noAuto);
    const fight = open.length ? open : all;             // (not the colonel behind his closed cape: it would bounce off)
    if (!fight.length) return L.autoTalk[0];
    // an armadillo on its back first (its belly takes ×2), the colonel with his cape open, else the one with the gold word
    // (the giant armadillo: push it when it's dizzy, else its helpers first)
    const arma = G.arma && G.arma.f.alive && fight.includes(G.arma.f) ? G.arma.f : null;
    const f = fight.find(x => x.flipped) || (arma && arma.dizzy > 0 ? arma : null) || (arma ? fight.find(x => x !== arma) || arma : null)
      || fight.find(x => x.species === 'colonel') || (G.glow && fight.includes(G.glow.foe) ? G.glow.foe : fight[0]);
    const verbs = attackVerbs();
    let verb = verbs[(G.turn + (G.autoSalt || 0) + bump) % verbs.length];
    if (verb === 'sing' || verb === 'climb' || verb === 'blow' || verb === 'call' || verb === 'light' || verb === 'dig') return P.wrapS(L, showWord('v.' + verb));     // (a song, a climb, a call, a light, a dig: no target: «¡Canta!», «¡Trepa!», «¡Llama!», «¡Ilumina!», «¡Cava!»)
    // armadillos: push a rolled-up one over, then hit or jump on it; on anything else a push is only a light shove
    if (f.species === 'armadillo') {
      if (!f.flipped && verbs.includes('push') && !(f.isBoss && !(f.dizzy > 0))) verb = 'push';
      else if (verb === 'push') verb = verbs.find(v => v === 'hit' || v === 'jump') || verb;
    } else if (verb === 'push') verb = verbs.find(v => v === 'hit' || v === 'jump') || verbs.find(v => v !== 'push') || verb;
    const o = {};
    // a floating moth: hit its wings (it falls) if Mimo knows the word, else jump
    if (f.floating && (verb === 'hit' || verb === 'push')) { if (verb === 'hit' && f.parts.includes('wing') && knows('n.wing')) { o.part = 'wing'; o.partPl = true; } else verb = 'jump'; }
    const need = needOf(f), soft = softParts(f), canPart = verb !== 'push';   // (a push moves the whole creature)
    // look-alikes: where it stands («la rana de la izquierda»; now and then with its color too, «la rana roja de la
    // izquierda»; in German now as an adjective, «den linken Frosch», now after the noun, «den Frosch links»)
    const turnK = G.turn + bump + (G.autoSalt || 0), prefer = turnK % 3 === 2 ? 'color' : null;
    o.posStyle = turnK % 2 ? 'adv' : 'adj';
    if (canPart && !o.part && f.species === 'hushbig' && (need >= 3 || f.weakShown)) o.part = f.weakShown ? f.weak : f.parts.find(p => knows('n.' + p));
    else if (canPart && !o.part && f.species === 'beetle' && soft.length) o.part = f.weakShown ? f.weak : soft[0];   // never the hard shell
    else if (!o.part && (need >= 2 || all.length > 1)) { const d = uniqueDesc(f, foes, { prefer }); if (d) Object.assign(o, descOpts(d)); }
    if (G.glow && G.glow.foe === f) {
      if (canPart && G.glow.part && !(f.species === 'beetle' && G.glow.part === 'shell')) { o.part = G.glow.part; o.partPl = G.glow.part === 'wing'; }
      else if (G.glow.id === 'n.' + f.species && !o.part) { const d = descOpts(uniqueDesc(f, foes) || []); o.adjs = d.adjs; o.noun = true; o.pos = d.pos; }
      else if (G.glow.id.startsWith('a.') && !o.part) {
        const k = G.glow.id.slice(2), d = descOpts(uniqueDesc(f, foes) || []);
        if (foes.filter(x => P.hasTrait(x, k)).length === 1) { o.adjs = [k]; o.noun = false; o.pos = null; }
        else { o.adjs = [...new Set(d.adjs.concat([k]))]; if (d.noun) o.noun = true; o.pos = d.pos; }
      } else if (G.glow.id.startsWith('p.') && !o.part && !o.pos) Object.assign(o, descOpts(uniqueDesc(f, foes) || []));
    }
    // a part that several of them have: say whose («la cabeza del escarabajo azul», «dem blauen Käfer auf den Kopf»,
    // «la cabeza del escarabajo de la izquierda»)
    if (o.part && foes.filter(x => x.parts && x.parts.includes(o.part)).length > 1) {
      const d = descOpts(uniqueDesc(f, foes) || [f.color]);
      o.owner = d.adjs; o.ownerNoun = d.noun || (knows('n.' + f.species) && bump % 2 === 0);
      o.ownerPos = d.pos ? posFor(f, { adjs: o.owner, noun: o.ownerNoun }, foes.filter(x => x.parts && x.parts.includes(o.part)), foes) : null;
    }
    // now and then the creature's name with its color, so the agreement gets practice («la polilla roja»)
    if (!o.part && o.adjs && o.adjs.length && !o.noun && knows('n.' + f.species) && (G.turn + bump) % 2 === 0) o.noun = true;
    // the words above may have changed who else fits the description: the position is counted among those
    if (o.part) o.pos = null; else if (o.pos) o.pos = posFor(f, o, foes, foes);
    if (G.lang === 'es' && f.states.has('asleep') && knows('a.asleep') && !o.part && verb !== 'push') return P.sayAction(L, 'hit', f, { rel: { adj: { key: 'asleep' } } });
    if (G.lang === 'pt' && verbs.includes('throw') && (f.floating || o.part === 'shell' || (f.species === 'beetle' && !o.part))) return P.sayAction(L, 'throw', f, Object.assign(o, { obj: f.floating ? 'light' : 'heavy' }));
    if (G.lang === 'de' && verbs.includes('attack') && G.turn % 2 === 0 && verb !== 'push') return P.sayAction(L, 'attack', f, Object.assign(o, { adv: ['jetzt'], instr: ST.S.stones.length > 0, ownerStyle: 'gen' }));
    if (verb === 'throw') return P.sayAction(L, 'throw', f, Object.assign(o, { obj: 'light' }));
    if (verb === 'attack') return P.sayAction(L, 'attack', f, o);
    return P.sayAction(L, verb, f, o);
  }
})();
