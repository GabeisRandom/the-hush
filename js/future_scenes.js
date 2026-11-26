'use strict';
// The Future's story, in scenes (DESIGN.md 17.2b; game/REGIONS.md): the arrival, Noa's echo and Nico (the future, shown before
// it's asked), the three promises, the report, Bruno's yard (future commands in battle, battle idea G: opts.realm 'future'),
// the wish at the bell tower's door (the conditional), the trap, the Great Silence, the bell rung all together, Noa's pointer
// to the source of the Hush, home, «Continuará…». With future.js (FUTURE, the place) and future_text.js (FTXT, the words).
//   FSCN.arrive · noa · promise(id) · chat(id) · look(id) · banner · door · silence · ring · end · resumed · soonCard · tick
//   Test hooks: FSCN._.t: go(step) (puts the save at a step: 'start' 'plaza' 'woke' 'rep' 'yard' 'door' 'boss' 'rang'), win()
const FSCN = (() => {
  let G = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const X = () => FUTURE._, S = () => X().S(), B = () => X().B();
  const lang = () => (G && G.state && G.state.lang) || 'es';
  const isC = () => lang() === 'zh' || lang() === 'ja';
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const lock = on => { G.sim.lock = on ? 1 : 0; if (!on) G.cam.override = null; };
  const name = () => G.state.mimoName || 'Mimo';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // {mimo} in a line: the player's name for it (zh / ja: 米莫 / ミモ while it's still called Mimo)
  const fillMimo = (t, l = lang()) => { const n = name(); return String(t || '').replace(/\{mimo\}/g, (l === 'zh' || l === 'ja') && n === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : n); };
  const plain = s => FTXT.plain(fillMimo(s));
  const P = id => B().byId[id];

  // ------------------------------------------------------------ saying things
  // a mixed line (the weave), over someone: p = a person from future.js, or Noa's echo
  function say(p, key) {
    const T = FTXT.ML[key]; if (!p || !T) return Promise.resolve();
    p.lines = { en: String(T.en || '').replace(/\{mimo\}/g, name()), [lang()]: fillMimo(T[lang()] || '') };
    return STORY.sayInline(p);
  }
  // a demonstration: whole in the language, the shown words glossed (FTXT.DEMO / MARKS)
  function demo(p, key) {
    const D = FTXT.DEMO[key]; if (!p || !D) return Promise.resolve();
    const T = { en: String((D.en || [''])[0]).replace(/\{mimo\}/g, name()) }; ['es', 'pt', 'de', 'zh', 'ja'].forEach(l => { T[l] = fillMimo((D[l] || [''])[0], l); });
    return STORY.demoLine(p, T, FTXT.MARKS[key]);
  }
  // a frozen person's surviving words, flat and slow
  function hushed(p, id) { const H = FTXT.HUSH[id]; return STORY.sayHushed(p, H[lang()] || '', H.en, { key: 'fut.hush.' + id }); }
  const shot = (pos, look, dur = 0.9) => { G.cam.override = { pos, look, dur }; };
  const at = (p, dy = 1.2) => V(p.x, (p.y || 0) + dy, p.z);
  // a two-shot from your side: the camera between you and them, a little up and off to one side
  function frame2(p, side = 1, dist = 4.4) {
    const Y = G.sim.you, dx = p.x - Y.x, dz = p.z - Y.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
    const cx = (p.x + Y.x) / 2 - ux * dist * 0.55 + uz * side * 2.2, cz = (p.z + Y.z) / 2 - uz * dist * 0.55 - ux * side * 2.2;
    shot(V(cx, (p.y || 0) + 2.4, cz), V((p.x + Y.x) / 2, (p.y || 0) + 1.25, (p.z + Y.z) / 2));
  }

  // ------------------------------------------------------------ the pattern cards (a page of the pattern notebook)
  async function card(kind) {
    const C = FTXT.CARD[kind] && FTXT.CARD[kind][lang()]; if (!C) return;
    const show = s => (isC() && typeof CJK !== 'undefined' ? CJK.html(s, { lang: lang(), ruby: 'always' }) : esc(s));
    const rows = C.rows.map(([t, en]) => `<tr><td style="text-align:left;padding:3px 10px;font-weight:800;font-size:18px">${show(t)}</td><td style="text-align:left;padding:3px 6px;font-size:13px;opacity:.75">${esc(en)}</td></tr>`).join('');
    await UI.card(`<div class="tag">${kind === 'future' ? 'Tomorrow’s words' : 'Wishes and traps'} · your pattern notebook</div><div class="big" style="font-size:24px">${show(C.title)}</div>`
      + `<table style="margin:8px auto 4px;border-collapse:collapse">${rows}</table><div class="sub" style="font-size:13px;opacity:.85;max-width:380px;margin:4px auto 0">${esc(C.note)}</div><div class="sub">E to close</div>`);
    const st = S(); st.cards = st.cards || {}; st.cards[kind] = true;
  }

  // ------------------------------------------------------------ the arrival: the gate, the gray, Noa's echo
  async function arrive() {
    const s = S(), N = B().noa, M = G.sim.mimo;
    lock(true);
    try {
      M.scared = 3; snd('whimper');
      await UI.chapter(FTXT.plain(FTXT.pick(FTXT.NAMES.future)), 'Chapter 3 · Alba, if nobody speaks up');
      shot(V(-8.2, 3.2, -106.5), V(-9.5, 2.6, -128), 1.2);
      await wait(1.4);
      await STORY.you('Alba…? But everything’s gray. And so quiet. No birds, no bell… nobody.');
      M.tiltT = 1.6;
      // she comes out of the gray: pale gold, older
      X().placeNoa({ x: -7.4, z: -115.6, yaw: 0.2 }); N.show = true; snd('chime');
      G.w3d.fx.sparkle(N.x, (N.y || 0) + 1.2, N.z, 18, ['#ffe2a8', '#fff3d0']);
      shot(V(-5.0, 2.4, -110.8), V(-7.4, 1.6, -115.6), 1.0);
      await wait(0.6);
      await say(N, 'f.arr1');
      await STORY.you('Noa?! But… you’re trapped in the {w.clock}, at the top of the {w.tower}!');
      await say(N, 'f.arr3');
      await say(N, 'f.arr4');
      await say(N, 'f.arr5');
      s.arrived = true; G.save();
      X().placeNoa(X().noaSpot());
      G.w3d.fx.sparkle(N.x, (N.y || 0) + 1.2, N.z, 12, ['#ffe2a8', '#fff3d0']);
    } finally { M.scared = 0; lock(false); }
    STORY.think('Noa’s echo floats off toward the plaza. Follow her!', 4.5);
  }
  async function resumed() { STORY.think('Back in tomorrow… Alba is still gray. Let’s keep going.', 4); }

  // ------------------------------------------------------------ the plaza: Nico, and what Noa shows you
  async function plaza() {
    const s = S(), N = B().noa, nico = P('nico'), M = G.sim.mimo;
    lock(true);
    try {
      shot(V(-12.6, 2.6, -136.8), V(-8.6, 1.2, -142.6), 1.0);
      await wait(0.9);
      await say(N, 'f.pl1');
      M.scared = 2;
      await hushed(nico, 'nico');
      shot(V(-10.8, 2.2, -139.0), V(-8.0, 1.2, -143.0), 0.8);
      await demo(N, 'fut.demo.nico');
      // the promise reaches him: his color comes back, he blinks, he stands up straight
      snd('learned'); G.w3d.fx.sparkle(nico.x, nico.y + 1.2, nico.z, 22, ['#ffd166', '#fff3a0', '#9ff5e8']);
      X().setColor(nico, 1); nico.pose = 'idle'; nico.wave = 2.2;
      await wait(1.2);
      await say(nico, 'f.nico.wake');
      s.woke.nico = 'S'; G.save();
      shot(V(-12.4, 2.4, -137.0), V(-10.4, 1.4, -140.4), 0.8);
      await say(N, 'f.pl2');
      await say(N, 'f.pl3');
      await card('future');
      await say(N, 'f.pl4');
      s.demo = true; G.save();
    } finally { M.scared = 0; lock(false); }
  }

  // ------------------------------------------------------------ talking to Noa's echo: the plaza, the reports, the end
  async function noa() {
    const s = S(), N = B().noa;
    if (!s.demo) return plaza();
    if (QUESTS.reportDue && QUESTS.reportDue('noa_f') && !s.rep) return report();
    if (s.rang && !s.end) return end();
    lock(true); try { frame2(N); await say(N, 'f.noa.chat'); } finally { lock(false); }      // (after Chapter 3, through a time crack: her word for you)
  }
  async function report() {
    const s = S(), N = B().noa;
    lock(true);
    try { frame2(N); await say(N, 'f.rep1'); await say(N, 'f.rep2'); s.rep = true; G.save(); X().placeNoa(X().noaSpot()); } finally { lock(false); }
    STORY.think('Bruno’s yard is by the bell tower, west of the plaza.', 4);
  }

  // ------------------------------------------------------------ the tasks: one box, graded S–D (FTXT.grade), "?" shows a model
  const frameOf = kind => plain(FTXT.pick(FTXT.FRAME[kind]));
  const modelOf = T => (isC() ? fillMimo(T[lang()]) : fillMimo(T[lang()] || T.es));
  const IFW = { es: 'si', pt: 'se', de: 'wenn', zh: '如果', ja: '〜たら' };
  function graded(g, model) {
    UI.toast(`${g.letter} · ${g.reason}${g.tip ? ' · ' + g.tip : ''}`.replace(/\{mimo\}/g, name()));      // (g.tip: an accent tip, P6a)
    snd(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    if (g.letter !== 'S' && model) setTimeout(() => STORY.think(`«${plain(model)}»`, 3.5), 300);
  }
  function missed(g, who, kind) {
    snd('wrong'); G.sim.mimoSay('…?', 1.4);
    const fr = frameOf(kind), nm = who || 'Nobody';
    const msg = {
      today: who ? `${nm} stirs… but «${g.heard || '…'}» is today. Tomorrow needs tomorrow’s words: ${fr} (? shows an example)`
        : `«${g.heard || '…'}» is today. A plan needs tomorrow’s words: ${fr} (? shows an example)`,
      wrongverb: `${nm} looks at you… that’s a tomorrow, but not theirs. Listen to what they mumble. (? shows an example)`,
      present: `That’s a «want», for now. A wish is what you WOULD like: ${fr} (? shows an example)`,
      nosi: `That’s a plan, not a trap. A trap starts with «${IFW[lang()]}» (if): ${fr}`,
      nofuture: `If it comes down… then what WILL {mimo} do? ${fr}`,
      nothing: kind === 'future' ? `${nm} doesn’t move. A promise about tomorrow: ${fr} (? shows an example)` : `Nothing happens. ${fr} (? shows an example)`,
    }[g.kind] || `Nothing happens. ${fr}`;
    STORY.think(msg.replace(/\{mimo\}/g, name()), 6.5);
  }
  const ICON = { rosa: 'apple', tito: 'star', marta: 'bread', bruno: 'jump' };
  // a promise to someone frozen: their surviving words first (the verb, the thing), then the box
  async function promise(id) {
    const s = S(), p = P(id), T = FTXT.TASK[id];
    if (X().woken(id)) return chat(id);
    lock(true); try { frame2(p, -1); await hushed(p, id); } finally { lock(false); }
    const r = await UI.command({ name: name(), icon: ICON[id] || 'star', title: `${p.name}, ${T.doing}. Promise ${id === 'tito' || id === 'bruno' ? 'him' : 'her'} a tomorrow!`, verbs: [], placeholder: 'promise them a tomorrow…',
      hint: `${frameOf('future')} (? shows an example)`, model: modelOf(T.model), modelEn: T.model.en });
    if (!r || r.cancelled) return;
    const g = FTXT.grade.future(r.text, id, lang());
    if (!g.ok) return missed(g, p.name, 'future');
    graded(g, T.model[lang()]);
    await wake(p, id, g);
  }
  async function wake(p, id, g) {
    const s = S();
    lock(true);
    try {
      frame2(p, 1, 3.8);
      snd('learned'); G.w3d.fx.sparkle(p.x, p.y + 1.3, p.z, 24, ['#ffd166', '#fff3a0', '#9ff5e8']);
      X().setColor(p, 1); p.pose = 'idle'; p.wave = 2.4; if (id === 'tito') p.strum = 1;
      await wait(1.3);
      s.woke[id] = g.letter; G.save();
      await say(p, 'f.' + id + '.wake');
      if (id === 'bruno') { await yardDemo(); return; }
      const n = ['rosa', 'tito', 'marta'].filter(X().woken).length;
      if (n >= 3) { await wait(0.3); STORY.think('Three voices back! Noa’s echo is waiting by the fountain.', 4.5); }
      else UI.toast(`Woken: ${n}/3`);
    } finally { lock(false); }
  }
  async function chat(id) {
    const s = S(), p = P(id);
    if (id === 'bruno' && !s.yard) return yardFight();
    lock(true); try { frame2(p); await say(p, id === 'bruno' ? 'f.b.chat' : 'f.' + id + '.chat'); } finally { lock(false); }
  }
  async function look(id) {
    const p = P(id);
    lock(true); try { frame2(p, -1); await hushed(p, id); } finally { lock(false); }
    STORY.think(id === 'bruno' ? 'Bruno, frozen mid-swing in his yard. Noa’s echo will know what to do.' : `${p.name}, gray and still. Talk to Noa’s echo first.`, 4.5);
  }
  async function banner() {
    const l = lang();
    if (typeof SIGNS !== 'undefined' && SIGNS.read) return SIGNS.read({ tag: 'A faded banner over the plaza', lines: [{ text: plain(FTXT.pick(FTXT.NAMES.fest, l)), en: 'The Festival of Voices' }, { text: plain(FTXT.pick(FTXT.NAMES.motto, l)), en: 'Every voice counts' }] });
    STORY.think(`«${plain(FTXT.pick(FTXT.NAMES.motto, l))}»`, 4);
  }

  // ------------------------------------------------------------ Bruno's yard: future commands, predictions, then a real fight
  async function yardDemo() {
    const bruno = P('bruno'), M = G.sim.mimo, dum = { x: -27.8, z: -157.0 };
    shot(V(-21.6, 2.6, -154.0), V(-26.8, 1.0, -156.6), 0.9);
    // a dummy stood back up, and the demonstration
    await demo(bruno, 'fut.demo.jump');
    G.sim.mimoGo({ x: dum.x + 2.2, z: dum.z + 0.6 }, dum); await wait(0.8);
    G.sim.mimoSay('…', 1.0); await wait(1.0);           // it waits: the future comes next turn
    M.station = null; M.hop = { x0: M.x, z0: M.z, x1: dum.x + 0.5, z1: dum.z, y0: M.y, y1: M.y, t: 0, dur: 0.55, h: 1.8 };
    await wait(0.55); snd('land', 16); snd('crack'); G.w3d.fx.puff(dum.x, X().gy(dum.x, dum.z) + 0.3, dum.z, 14, 0.4, '#d8b878'); G.w3d.fx.sparkle(dum.x, X().gy(dum.x, dum.z) + 1.0, dum.z, 16);
    UI.toast('×2 · the future, stronger!');
    await wait(0.6); G.sim.mimoGo(null, null);
    await say(bruno, 'f.b2');
    // the time battles' own lesson (battle/timebattle.js, skill Gf: the future and the prediction), with Bruno; else his own
    const TB = typeof BATTLE !== 'undefined' && BATTLE._ && BATTLE._.tense;
    lock(false);
    if (TB && TB.lesson && !(TB.learned && TB.learned('Gf'))) {
      try { await TB.lesson('Gf', { game: G, by: { x: bruno.x, y: bruno.y, z: bruno.z, top: bruno.top, name: bruno.name }, coach: 'Bruno', place: { biome: 'future', x: -21, z: -152 } }); } catch (e) { console.error('[future] lesson', e); }
    } else { lock(true); await demo(bruno, 'fut.demo.predict'); lock(false); }
    lock(true); try { frame2(bruno); await say(bruno, 'f.b.go'); } finally { lock(false); }
    await yardFight();
  }
  async function yardFight() {
    const s = S(), bruno = P('bruno');
    const r = await G.fight({ realm: 'future', foes: [{ kind: 'hushling', color: 'blue', size: 'small' }, { kind: 'hushling', color: 'red', size: 'small' }, { kind: 'moth', color: 'yellow', size: 'small' }],
      place: { biome: 'future', x: -21, z: -152 } });
    lock(true);
    try {
      frame2(bruno);
      if (r && r.outcome === 'win') { await say(bruno, 'f.b.won'); s.yard = true; G.save(); gather(); X().placeNoa(X().noaSpot()); STORY.think('The bell tower is right there. Noa’s echo is waiting by its door.', 4.5); }
      else await say(bruno, 'f.b.lost');
    } finally { lock(false); }
  }
  // after the yard: everyone you woke walks over to the bell tower (they're there for the door, the fight and the bell)
  const GATHER = { rosa: { x: -21.6, z: -161.2, yaw: -1.9 }, marta: { x: -22.9, z: -159.2, yaw: -2.4 }, tito: { x: -29.8, z: -159.4, yaw: 2.4 }, nico: { x: -31.0, z: -161.6, yaw: 1.9 }, bruno: { x: -28.4, z: -157.9, yaw: 2.8 } };
  function gather() { for (const [id, g] of Object.entries(GATHER)) { const p = P(id); if (!p || !X().woken(id)) continue; p.x = g.x; p.z = g.z; p.yaw = g.yaw; p.y = X().gy(g.x, g.z); } }

  // ------------------------------------------------------------ the bell tower's door: a wish (the conditional)
  async function door() {
    const s = S(), N = B().noa, rosa = P('rosa');
    if (!s.yard) { STORY.think('The bell tower’s door is sealed with gray Hush, thick as felt. Something has to come first… Bruno’s yard?', 5); return; }
    if (!s.cond) {
      lock(true);
      try {
        const d = X().doorAt(); shot(V(d.x + 4.2, 2.8, d.z + 6.2), V(d.x, 1.6, d.z), 1.0);
        await wait(0.8);
        await say(N, 'f.c1');
        frame2(rosa, 1, 4);
        await demo(rosa, 'fut.demo.wish');
        await say(N, 'f.c2');
        await card('cond');
        s.cond = true; G.save();
      } finally { lock(false); }
    }
    const r = await UI.command({ name: name(), icon: 'bell', title: 'The bell tower’s door, sealed with gray Hush. It swallows promises… Tell it what you WOULD like!', verbs: [], placeholder: 'a wish…',
      hint: `${frameOf('wish')} (? shows an example)`, model: modelOf(FTXT.MODEL.wish), modelEn: FTXT.MODEL.wish.en });
    if (!r || r.cancelled) return;
    const g = FTXT.grade.wish(r.text, lang());
    if (!g.ok) return missed(g, null, 'wish');
    graded(g, FTXT.MODEL.wish[lang()]);
    lock(true);
    try {
      const d = X().doorAt(), seal = B().seal;
      shot(V(d.x + 3.6, 2.6, d.z + 5.4), V(d.x, 1.6, d.z), 0.8);
      snd('crack'); await tween(1.4, k => { seal.children.forEach((sp, i) => { sp.material.opacity = 0.95 * (1 - k); sp.position.y += 0.01 * (i % 3); }); });
      seal.visible = false; snd('wood'); snd('chime');
      s.door = true; G.save();
      await say(B().noa, 'f.door.open');
      // the Great Silence pours out of the belfry
      const Sl = B().sil, tw = X().tower(); Sl.g.visible = true; Sl.rise = 0; Sl.riseT = 1; s.out = true; G.save();
      shot(V(tw.x + 9, 6.5, tw.z + 15), V(tw.x, 9.5, tw.z), 1.2);
      snd('boss'); G.sim.mimo.scared = 3;
      await wait(2.2);
      await say(B().noa, 'f.s1');
      frame2(P('bruno'), -1, 4);
      await demo(P('bruno'), 'fut.demo.trap');
    } finally { G.sim.mimo.scared = 0; lock(false); }
    STORY.think('Set the trap (E), right under the tower.', 4);
  }

  // ------------------------------------------------------------ the Great Silence: the trap, then the fight (a boss: opts.boss)
  async function silence() {
    const s = S();
    if (!s.trap) {
      const r = await UI.command({ name: name(), icon: 'jump', title: `The Great Silence hovers over the tower, ready to come down on you. Set a trap for ${name()}!`, verbs: [], placeholder: 'if it…, then…',
        hint: `${frameOf('trap')} (? shows an example)`, model: modelOf(FTXT.MODEL.trap), modelEn: FTXT.MODEL.trap.en.replace(/\{mimo\}/g, name()) });
      if (!r || r.cancelled) return;
      const g = FTXT.grade.trap(r.text, lang());
      if (!g.ok) return missed(g, null, 'trap');
      graded(g, FTXT.MODEL.trap[lang()]);
      s.trap = g.letter; G.save();
      // (you've set a trap right once: traps work in the fights from here on, battle/timebattle.js's skill Gc)
      try { const TB = BATTLE._.tense; if (TB && TB.learn && TB.learned && !TB.learned('Gc')) TB.learn('Gc'); } catch (e) { /* */ }
    }
    lock(true);
    let hit = 0;
    try {
      const Sl = B().sil, M = G.sim.mimo, tw = X().tower(), Y = G.sim.you;
      shot(V(Y.x + 5, 3.2, Y.z + 6), V(tw.x, 6, tw.z), 0.8);
      await say(B().noa, 'f.s2');
      // it comes down… and the trap springs: Mimo meets it in the air
      snd('boss'); await tween(0.7, k => { Sl.riseT = 1 - k * 0.8; });
      M.station = null; M.hop = { x0: M.x, z0: M.z, x1: M.x - 0.5, z1: M.z - 1.5, y0: M.y, y1: M.y, t: 0, dur: 0.7, h: 3.2 };
      await wait(0.4); snd('crack'); snd('land', 18); G.w3d.fx.sparkle(M.x, 4, M.z - 1.2, 26, ['#ffd166', '#fff3a0']);
      hit = { S: 8, A: 6, B: 4, C: 3 }[s.trap] || 2;
      UI.toast(`TRAP! ×2 · the Silence starts weaker (−${hit})`);
      await wait(0.8); Sl.riseT = 1;
    } finally { lock(false); }
    const tw = X().tower();
    const r = await G.fight({ boss: 'silence', realm: 'future', foes: [{ kind: 'hushling_big', color: 'white', size: 'big', giant: 2.2, hp: Math.max(14, 30 - hit) }, { kind: 'hushling', color: 'red', size: 'small' }, { kind: 'moth', color: 'blue', size: 'small' }],
      place: { biome: 'future', x: tw.x, z: tw.z + 6 } });
    lock(true);
    try {
      if (r && r.outcome === 'win') {
        const Sl = B().sil; shot(V(tw.x + 8, 6, tw.z + 13), V(tw.x, 9, tw.z), 1.0);
        snd('poof'); await tween(1.8, k => { Sl.g.scale.setScalar(Math.max(0.01, 1 - k)); Sl.fog.forEach(f => { f.sp.material.opacity = 0.55 * (1 - k); }); });
        Sl.g.visible = false; s.boss = true; G.save();
        await say(B().noa, 'f.s3');
        STORY.think('Everyone’s gathering under the bell. Say it with them (E)!', 4.5);
      } else await say(B().noa, 'f.s.lost');
    } finally { lock(false); }
  }

  // ------------------------------------------------------------ the bell, all together: the plan («¡Vamos a tocar la campana!»)
  async function ring() {
    const s = S(), N = B().noa, rosa = P('rosa'), tw = X().tower();
    if (!s.ringDemo) {
      lock(true);
      try { shot(V(tw.x + 6, 4.2, tw.z + 11), V(tw.x, 6.5, tw.z), 1.0); await wait(0.8); await say(rosa, 'f.f1'); frame2(N); await demo(N, 'fut.demo.ring'); s.ringDemo = true; G.save(); } finally { lock(false); }
    }
    const r = await UI.command({ name: name(), icon: 'bell', title: `Everyone’s here: Rosa, Tito, Marta, Bruno, Nico, ${name()}… Say the plan, all together!`, verbs: [], placeholder: 'all together…',
      hint: `${frameOf('ring')} (? shows an example)`, model: modelOf(FTXT.MODEL.ring), modelEn: FTXT.MODEL.ring.en });
    if (!r || r.cancelled) return;
    const g = FTXT.grade.ring(r.text, lang());
    if (!g.ok) return missed(g, null, 'ring');
    graded(g, FTXT.MODEL.ring[lang()]);
    lock(true);
    try {
      const Bl = B().bell, bAt = X().bellAt();
      ['rosa', 'tito', 'marta', 'bruno', 'nico'].forEach(id => { const p = P(id); if (p) p.wave = 2.5; });
      shot(V(tw.x + 5, bAt.y - 2, tw.z + 10), V(bAt.x, bAt.y - 0.6, bAt.z), 1.0);
      await wait(1.0);
      snd('bigbell'); Bl.swing = 1; Bl.crack.visible = false; Bl.mat.color.set('#e2b44a'); Bl.mat.emissive.set('#3a2a08');
      G.w3d.fx.sparkle(bAt.x, bAt.y - 0.5, bAt.z, 30, ['#ffd166', '#fff3a0']);
      s.rang = true; G.save();
      if (B().crowd) B().crowd.kT = 1;
      // the other seven answer from far away
      for (let i = 0; i < 7; i++) { await wait(0.45); snd('bell'); }
      shot(V(-10, 7, -128), V(-10, 2, -150), 1.6);
      await wait(1.8);
      frame2(P('tito')); await say(P('tito'), 'f.f3');
      frame2(P('marta')); await say(P('marta'), 'f.f4');
      frame2(P('nico')); await say(P('nico'), 'f.f5');
      frame2(P('bruno')); await say(P('bruno'), 'f.f6');
    } finally { lock(false); }
  }

  // ------------------------------------------------------------ the end: Noa's pointer to the source; home; «Continuará…»
  function sketch() {
    // her drawing: a small hooded child under the festival's banner, the crowd laughing, a speech bubble scribbled out
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 210; const c = cv.getContext('2d');
    c.fillStyle = '#f6efdc'; c.fillRect(0, 0, 300, 210); c.strokeStyle = '#4a3f55'; c.lineWidth = 2.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(20, 30); c.quadraticCurveTo(150, 52, 280, 30); c.stroke();
    for (let i = 0; i < 9; i++) { const x = 34 + i * 28, y = 30 + Math.sin((i + 0.5) / 9 * Math.PI) * 20; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8, y + 14); c.lineTo(x + 16, y); c.stroke(); }
    c.beginPath(); c.arc(150, 120, 15, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(134, 116); c.quadraticCurveTo(150, 92, 166, 116); c.stroke();
    c.beginPath(); c.moveTo(140, 135); c.lineTo(128, 190); c.lineTo(172, 190); c.lineTo(160, 135); c.stroke();
    c.beginPath(); c.ellipse(205, 92, 32, 18, 0, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(186, 104); c.lineTo(170, 112); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.moveTo(184, 84); c.lineTo(226, 100); c.moveTo(184, 100); c.lineTo(226, 84); c.stroke();
    c.lineWidth = 1.6; [[60, 150], [90, 160], [230, 158], [258, 150]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 10, 0, TAU); c.stroke(); c.beginPath(); c.arc(x, y + 2, 5, 0.2, Math.PI - 0.2); c.stroke(); c.font = '12px Georgia'; c.fillStyle = '#4a3f55'; c.fillText('ja', x - 6, y - 16); });
    return cv.toDataURL();
  }
  async function end() {
    const s = S(), N = B().noa, l = lang();
    if (s.end) return;
    lock(true);
    try {
      frame2(N);
      await say(N, 'f.e1');
      await say(N, 'f.e2');
      await UI.card(`<div class="tag">Noa’s notebook</div><img src="${sketch()}" style="width:300px;border-radius:6px;display:block;margin:6px auto"><div class="caption">«${esc(plain(FTXT.pick(FTXT.NAMES.motto, l)))}…»</div><div class="sub">E to close</div>`);
      await say(N, 'f.e3');
      await say(N, 'f.e4');
      // the tower's clock wakes, its hands run backward: the way home
      const tw = X().tower(), cy = X().gy(tw.x, tw.z) + 6.6, cz = tw.z + tw.w / 2 + 0.25;
      shot(V(tw.x + 2.5, cy - 1.5, cz + 7), V(tw.x, cy, cz), 1.0);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff1c2', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      gl.position.set(tw.x, cy, cz); gl.scale.setScalar(2.4); B().root.add(gl);
      snd('tick'); await tween(2.0, k => { gl.material.opacity = k; gl.scale.setScalar(2.4 + k * 6); gl.material.rotation = -k * 9; });
      s.end = true; G.state.flags.futureDone = true; G.save();
      B().root.remove(gl);
      await FUTURE.leave();
      await home();
    } finally { lock(false); }
  }
  // today's Alba again, loud; then «Continuará…» and Chapter 4's card
  async function home() {
    const M = G.sim.mimo, l = lang();
    lock(true);
    try {
      M.happy = 2; snd('chirp');
      await STORY.you('We’re back… Today. Listen to it, {mimo}: Alba is loud again.');
      await STORY.you('Noa is still up in the {w.clock}. And now I know who to talk to.');
      snd('page');
      await UI.card(`<div class="big">${esc(plain(FTXT.pick(FTXT.NAMES.cont, l)))}</div>${l !== 'en' ? '<div class="en show" style="opacity:.7">To be continued…</div>' : ''}<div class="sub" style="font-size:15px;margin-top:8px">Chapter 4 · The source of the Hush · coming soon<br><small>Your game is saved. The Old Tower is waiting, and so is Noa.</small></div><div class="sub">E to close</div>`);
    } finally { lock(false); }
    STORY.think('Alba, today. Everyone’s still here: go and say hello!', 5);
  }
  async function soonCard() {
    await UI.card(`<div class="tag">Chapter 4</div><div class="big" style="font-size:28px">The source of the Hush</div><div class="sub" style="font-size:14px;opacity:.85;max-width:340px;margin:6px auto 0">Coming soon! You changed tomorrow; Noa is still in the great clock. Until then, the present is yours: Alba and everyone you’ve met are waiting.</div><div class="sub">E to close</div>`);
  }

  // ------------------------------------------------------------ per frame in the realm: the plaza scene starts as you reach Noa
  function tick() {
    const s = S(); if (!s.arrived || s.demo || STORY.busy || STORY.line) return;
    const N = B().noa, Y = G.sim.you;
    if (Math.hypot(Y.x - N.x, Y.z - N.z) < 4.2) STORY.run(plaza);
  }
  function init(game) { G = game; }

  // ------------------------------------------------------------ test hooks: put the save at a step, and go in
  // 'start' (the arrival plays with o.scene) · 'plaza' (Noa at the fountain) · 'woke' (the promises) · 'rep' (the report) ·
  // 'yard' (Bruno, frozen: promise, then his fight) · 'door' (the wish) · 'boss' (trap set: face it) · 'ring' (the bell) · 'end'
  const STEPS = ['start', 'plaza', 'woke', 'rep', 'yard', 'door', 'boss', 'ring', 'end'];
  async function go(step = 'start', o = {}) {
    const f = G.state.flags; f.hatched = true; f.towerLost = true; f.pastDone = true; f.bells = Math.max(8, f.bells || 0); f.oldDoor = true;
    ['rosa', 'guide', 'escort', 'escorted', 'boss', 'ch1', 'z_exit', 'z_guide', 'z_hushwave', 'z_gate'].forEach(k => { f[k] = true; });     // (tests: the prologue's scenes are long done)
    const st = G.state.future = { woke: {} }, i = STEPS.indexOf(step);
    if (i >= 1) { st.arrived = true; }
    if (i >= 2) { st.demo = true; st.woke.nico = 'S'; st.cards = { future: true }; }
    if (i >= 3) { st.woke.rosa = st.woke.tito = st.woke.marta = 'S'; }
    if (i >= 5) { st.rep = true; st.woke.bruno = 'S'; st.yard = true; }
    if (i >= 6) { st.cond = true; st.door = true; st.out = true; st.trap = 'S'; }
    if (i >= 7) { st.boss = true; }
    if (i >= 8) { st.ringDemo = true; st.rang = true; }
    if (i === 4) st.rep = true;
    delete f.futureDone;
    // (tests only: the main quest's earlier steps count as done, so the tracker shows the Future's)
    const main = QUESTS.LIST.find(q => q.id === 'main');
    if (main) main.steps.forEach(s => { if (!s.future && !s._t) { const d0 = s.done; s._t = true; s.done = x => !!(x.flags && x.flags.futureTest) || d0(x); } });
    f.futureTest = true;
    if (FUTURE.inside) { X().applyState(); return; }
    await FUTURE.enter({ quick: true, scene: !!o.scene });
  }
  return { init, arrive, resumed, plaza, noa, report, promise, wake, chat, look, banner, yardDemo, yardFight, door, silence, ring, end, home, soonCard, tick, gather,
    _: { say, demo, hushed, card, graded, missed, fillMimo, t: { go, STEPS } } };
})();
