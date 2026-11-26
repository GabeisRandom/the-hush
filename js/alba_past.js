'use strict';
// Alba long ago, after Chapter 2 (DESIGN.md 18.6 "T1a"; game/TIME.md): Chapter 4's opening and Alba's Past as a world of its own.
// The words are alba_past_text.js (APTXT); the dungeon and the homes of then alba_past_stage.js (APSTAGE); the boss
// alba_past_boss.js (APBOSS); the songs alba_past_music.js.
//   Chapter 4's opening (CH4.OPENING): after the cracks' first scene, Noa's voice comes through the duck pond's three-way crack:
//   Elio's voice broke into echoes; in Alba, one is under the old theater's stage long ago, one in tomorrow's theater.
//   The main path (CH4.steps('alba', 'past')): 1 ask the people of then about the night of the concert (Félix, Clara, Mateo,
//   Elena: each a memory, then a question: «subió», «tenía miedo», «corrió», «llegaron») · 2 Aurora's key · 3 under the stage,
//   four memories (the imperfect sets the scene, the preterite replays the deed) · 4 the Prompter · 5 Elio's echo · 6 💬 Noa.
//   The people of then are the cemetery's past era alive (cemetery.js builds them; CEMETERY.pastTalk gives them lines of their
//   own here, and their Talk carries who: 'past:<id>' for the talk hooks), plus young Marta, young Hugo and Tomi in the homes.
//   Side quests: «Félix's lost page» (cross-time: framed in the library's window today and tomorrow), «Young Rosa's letter»
//   (cross-time: delivered to Doña Rosa today, forty years late), «The choir's robes», «Brave mistakes», «Bread for Pilar»;
//   small tasks: young Tina's voice, young Marta's dough.
// State: TIME.state('alba', 'past') (asked, key, r0m…r3p, boss, report, roomSeen, words, slates…); TIME.flag('past', 'felixPage'
// | 'letter' | 'robes' | 'mistakes' | 'bread'), ('now', 'pageSeen' | 'letterRead'); TIME.seen('ch4.open'). Tests: ALBA_PAST._.t.
const ALBA_PAST = (() => {
  if (typeof TIME === 'undefined' || typeof APTXT === 'undefined') return null;
  const X = APTXT, A = TIME.API, V = A.V, gy = A.gy;
  let G = null;
  const lang = () => A.lang();
  const isC = l => l === 'zh' || l === 'ja';
  const AP = () => TIME.state('alba', 'past');
  const plain = (s, l = lang()) => X.plainOf(s, l);
  const esc = s => A.esc(s);
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const mimoName = () => (G && G.state.mimoName) || 'Mimo';
  const fillMimo = (t, l = lang()) => { const n = mimoName(); return String(t || '').replace(/\{mimo\}/g, isC(l) && n === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : n); };
  const enOf = (T, l = lang()) => String((T && (T['en_' + l] || T.en)) || '');
  const fillEn = s => String(s || '').replace(/\{mimo\}/g, mimoName());
  const lock = on => { G.sim.lock = on ? 1 : 0; if (!on) G.cam.override = null; };
  const shot = (pos, look, dur = 0.9) => { G.cam.override = { pos, look, dur }; };
  const down = (letter, n) => 'SABCD'[Math.max(0, Math.min(4, 'SABCD'.indexOf(letter) + n))];
  const castName = id => plain((X.CAST[id] || {})[lang()] || (X.CAST[id] || {}).en || id);
  const ch4On = () => !!(G && TIME.open('alba'));
  const opened = () => !!TIME.seen('ch4.open');
  const solved = () => { try { if (typeof BFX !== 'undefined' && BFX.solved) BFX.solved(); else snd('chest'); } catch (e) { /* */ } };
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; snd('chest'); UI.toast(`${why} · 🪙 +${n}`); };

  // ------------------------------------------------------------ saying things (mixed through the weave; demonstrations whole)
  function sayT(p, T) { if (!p || !T) return Promise.resolve(); const l = lang(); p.lines = { en: fillEn(enOf(T, l)), [l]: fillMimo(T[l] || '', l) }; return STORY.sayInline(p); }
  const say = (p, key) => sayT(p, X.LINES[key]);
  function demoT(p, T, marks) { if (!p || !T) return Promise.resolve(); const l = lang(), T2 = { en: fillEn(enOf(T, l)) }; for (const x of X.LANGS) T2[x] = fillMimo(T[x] || '', x); return STORY.demoLine(p, T2, marks); }
  const demo = (p, key) => demoT(p, X.DEMO[key], X.MARKS[key]);
  // the people of then (cemetery.js's past era), as speakers
  const cemP = id => { try { const B = CEMETERY._.built, E = B && B.eras.past; return (E && E.people.find(q => q.def.id === id)) || null; } catch (e) { return null; } };
  const who = id => { const P = cemP(id); if (!P) return null; P.api.name = castName(id); return P.api; };
  const pastP = id => (typeof PAST !== 'undefined' && PAST._ && PAST._.W.people[id]) || null;
  // a two-shot from your side
  function frame2(p, side = 1, dist = 4.4) {
    const Y = G.sim.you, dx = p.x - Y.x, dz = p.z - Y.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, y = p.y !== undefined ? p.y : gy(p.x, p.z);
    shot(V((p.x + Y.x) / 2 - ux * dist * 0.55 + uz * side * 2.2, y + 2.4, (p.z + Y.z) / 2 - uz * dist * 0.55 - ux * side * 2.2), V((p.x + Y.x) / 2, y + 1.25, (p.z + Y.z) / 2));
  }
  function frameOn(x, y, z, back = 4.2) { const Y = G.sim.you, dx = Y.x - x, dz = Y.z - z, d = Math.hypot(dx, dz) || 1; shot(V(x + dx / d * back + dz / d * 1.4, y + 2.2, z + dz / d * back - dx / d * 1.4), V(x, y + 1.0, z)); }

  // ------------------------------------------------------------ what you say, graded S–D (one letter down per miss; «?» counts as two)
  async function ask(T0, o = {}) {
    const l = lang(); if (!T0) return null;
    const frame = plain(fillMimo((T0.frame || {})[l] || '', l), l), chips = ((T0.chips || {})[l] || []).map(([w, e]) => `${plain(w, l)} (${e})`).join(' · ');
    const modelRaw = fillMimo((T0.model || {})[l] || '', l), model = plain(modelRaw, l);
    let misses = 0;
    for (;;) {
      const r = await UI.command({ name: mimoName(), icon: o.icon || 'star', title: fillEn(o.title || T0.title || ''), verbs: [], model: modelRaw, modelEn: fillEn(enOf(T0.model, l)), placeholder: `«${frame}»`,
        hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}.${o.hint ? ' ' + o.hint : ''} Stuck? ? shows the whole sentence.` });
      if (!r || r.cancelled) return null;
      const h = document.getElementById('command-hint'), peeked = !!(h && /^Try/.test(h.textContent || ''));
      const g = X.grade(T0, r.text, l, mimoName());
      if (g.ok) {
        const letter = down(g.letter, misses + (peeked ? 2 : 0)), why = g.kind === 'right' && g.letter === 'S' && (misses || peeked) ? (peeked ? 'Right, with the example' : 'Right, on another try') : g.why;
        UI.toast(`${letter} · ${why}${g.tip ? ' · ' + g.tip : ''}`); snd(letter === 'S' ? 'chest' : 'review');      // (g.tip: an accent tip, P6a)
        if (o.id) TIME.grade('alba.' + o.id, letter);
        return { letter, text: r.text };
      }
      misses++; snd('wrong'); G.sim.mimo.tiltT = 1.4;
      STORY.think(g.kind === 'pres' || g.kind === 'lie' || g.kind === 'wrong' ? g.why : misses >= 2 ? `Like this: «${model}»` : `Not quite… «${frame}»${chips ? ' · ' + chips : ''}`, 6.5);
    }
  }
  // a pattern card (APTXT.CARDS), once
  async function card(id, again) {
    const S = AP(), C = X.CARDS[id], l = lang(), c = C && C[l]; if (!c || (S.cards && S.cards[id] && !again)) return;
    (S.cards || (S.cards = {}))[id] = true;
    const ex = (c.ex || []).map(([w, e]) => `<b>${isC(l) && typeof CJK !== 'undefined' ? CJK.html(w, { lang: l, ruby: 'always' }) : esc(w)}</b><span>${esc(e)}</span>`).join('');
    await UI.card(`<div class="tag">${esc(C.tag)}</div>${ex ? `<div class="ex">${ex}</div>` : ''}<div class="note">${esc(c.note)}</div><div class="sub">E</div>`, { kind: 'past-card' });
  }
  // a thing to Look at: its word in the language (glossed, said aloud), what it is
  function look(key) {
    const L0 = X.LOOKS[key]; if (!L0) return;
    const l = lang(), w = plain(L0.w[l] || L0.w.en, l);
    (AP().words || (AP().words = {}))[key] = 1;
    let extra = '';
    if (key === 'doornote') extra = ` «${plain(X.NAMES.closed[l], l)}»`;
    STORY.think(`«${w}» (${L0.w.en}). ${L0.t}${extra}`, 6);
    try { UI.speak(UI.sayText(L0.w[l] || '')); } catch (e) { /* (no voice on this computer) */ }
  }

  // ------------------------------------------------------------ Noa, through the duck pond's crack (the opening, the report)
  const CRACK = () => TIME.CRACKS['alba.pond'];
  let FLARE = null;
  function flare(on) {
    const c = CRACK(); if (!c || !G) return;
    if (!FLARE) { FLARE = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#bfe8ff', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); FLARE.scale.set(4.2, 5.4, 1); G.w3d.scene.add(FLARE); }
    FLARE.position.set(c.x, gy(c.x, c.z) + 1.5, c.z); FLARE.userData.on = on;
    if (on) { G.w3d.fx.sparkle(c.x, gy(c.x, c.z) + 1.6, c.z, 22, ['#bfe8ff', '#ffe6a8', '#ffffff']); snd('chime'); }
  }
  const noa = () => { const c = CRACK(); return { id: 'noa', name: castName('noa'), x: c.x, y: gy(c.x, c.z) + 0.6, z: c.z, top: 1.5, talking: false }; };
  function lookCrack() { const c = CRACK(), Y = G.sim.you, cy = gy(c.x, c.z), dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1; shot(V(Y.x + dx / d * 2.6 + dz / d * 1.6, cy + 2.2, Y.z + dz / d * 2.6 - dx / d * 1.6), V(c.x, cy + 1.4, c.z), 1.0); }
  async function openingScene() {
    if (TIME.seen('ch4.open')) return;
    lock(true);
    try {
      G.sim.mimo.tiltT = 1.6; flare(true); lookCrack(); await wait(1.1);
      await STORY.you('That voice… it’s coming out of the crack!');
      const N = noa();
      await say(N, 'open.hear');
      await STORY.you('Noa! Are you all right?');
      await say(N, 'open.broke');
      await say(N, 'open.two');
      await say(N, 'open.go');
      await STORY.you('Under the stage, long ago… Let’s go, {mimo}.');
      TIME.seen('ch4.open', true); G.save();
    } finally { flare(false); lock(false); }
    await UI.chapter('Elio’s words', `Chapter 4 · «${plain(X.NAMES.ch4[lang()])}»`);
    STORY.think('The Past is through this crack, or the one in Bruno’s yard. The Old Quarter is north of the plaza.', 6);
  }
  // her line with the echo quoted, in each language
  function heardT() {
    const E = X.ECHO, l = lang();
    return { en: `I heard it! «${E.en[l] || E.en.es}» That’s how he wanted to say it that night.`, es: `¡Lo oí! «${E.es}» Así quería decirlo esa noche.`, pt: `Eu ouvi! «${E.pt}» Era assim que ele queria dizer naquela noite.`,
      de: `Ich habe es gehört! „${E.de}“ So wollte er es an dem Abend sagen.`, zh: `[我|wǒ] [听到|tīng dào] [了|le] ！ “ ${E.zh} ” [那天|nà tiān] [晚上|wǎn shang] [他|tā] [就是|jiù shì] [想|xiǎng] [这样|zhè yàng] [说|shuō] 。`,
      ja: `[聞|き]こえた ！ 「 ${E.ja} 」 あの [夜|よる] 、 そう [言|い]いたかった ん だ ね 。` };
  }
  const reportDue = () => typeof CH4 !== 'undefined' && !!CH4.got('alba', 'past') && !AP().report;
  async function reportScene() {
    if (!reportDue()) return;
    lock(true);
    try {
      flare(true); lookCrack(); await wait(1.0);
      const N = noa();
      await sayT(N, heardT());
      await say(N, 'report.next');
      await STORY.you('Tomorrow’s theater… We’ll find it, Noa.');
      AP().report = true; G.save();
    } finally { flare(false); lock(false); }
  }
  // near the pond's crack: the opening (once), the report (when it's due)
  let trigT = 0;
  function triggers(dt) {
    if (!G || !ch4On() || !TIME.seen('alba.cracks')) return;
    if (!(!TIME.seen('ch4.open') || reportDue())) { trigT = 0; return; }
    if (STORY.busy || STORY.line || G.sim.lock || G.journalOpen || G.state.teaching || document.body.classList.contains('in-battle') || document.body.classList.contains('on-title') || TIME.busy) { trigT = 0; return; }
    const room = G.indoorMod && G.indoorMod();
    if (room && room !== TIME && !(typeof PAST !== 'undefined' && room === PAST) && !(typeof FUTURE !== 'undefined' && room === FUTURE)) { trigT = 0; return; }
    const c = CRACK(), w = TIME.world(); if (!c || (w !== 'now' && TIME.regionNow() !== 'alba')) { trigT = 0; return; }
    const Y = G.sim.you; if (Math.hypot(Y.x - c.x, Y.z - c.z) > 5.5) { trigT = 0; return; }
    if ((trigT += dt) < 0.7) return; trigT = 0;
    STORY.run(!TIME.seen('ch4.open') ? openingScene : reportScene);
  }

  // ------------------------------------------------------------ step 1: the people of then, about that night
  const MEM = { felix: ['mem.felix', 'ask.felix', 'felix.after'], clara: ['mem.clara', 'ask.clara', 'clara.after'], mateo: ['mem.mateo', 'ask.mateo', 'mateo.after'], elena: ['mem.elena', 'ask.elena', 'elena.after'] };
  const asked = () => AP().asked || (AP().asked = {});
  const askedN = () => Object.keys(MEM).filter(k => asked()[k]).length;
  async function memScene(id) {
    const p = who(id); if (!p) return;
    const [dk, tk, ak] = MEM[id];
    lock(true);
    try { frame2(p); await wait(0.4); await demo(p, dk); } finally { lock(false); }
    const r = await ask(X.TASKS[tk], { icon: 'star', id: tk });
    if (!r) { STORY.think(`${castName(id)} is still waiting for your answer.`, 4); return; }
    lock(true); try { frame2(p); await say(p, ak); } finally { lock(false); }
    asked()[id] = r.letter; G.save();
    if (askedN() >= 4) STORY.think('They all remember it a little differently… but they all say Aurora locked the theater that night. She’s by its door.', 7);
    else { const NM = { felix: 'Félix', clara: 'Clara', mateo: 'Mateo', elena: 'Elena' }, left = Object.keys(MEM).filter(k => !asked()[k]).map(k => NM[k]); STORY.think(`More of the people of then remember that night: ${left.join(', ')}.`, 4.5); }
  }

  // ------------------------------------------------------------ step 2: Aurora's key
  function giveKey() { const bag = G.state.bag || (G.state.bag = {}); bag['k.theaterKey'] = 1; try { LEX.expose('k.theaterKey'); } catch (e) { /* */ } }
  async function keyCard() {
    const l = lang(), N = X.NAMES.key, cj = isC(l) && typeof CJK !== 'undefined';
    snd('chest');
    await UI.card(`<canvas width="140" height="140"></canvas><div class="tag">Key item</div><div class="big">${cj ? CJK.html(N[l], { lang: l }) : esc(N[l])}</div><div class="sub">Aurora’s key to the old theater · <b>E</b></div>`, { kind: 'reveal', icon: 'ap_key', say: plain(N[l]) });
  }
  async function keyScene() {
    const p = who('aurora'); if (!p) return;
    lock(true); try { frame2(p); await wait(0.3); await demo(p, 'aurora.locked'); await say(p, 'aurora.whisper'); await say(p, 'aurora.ask'); } finally { lock(false); }
    const r = await ask(X.TASKS.key, { icon: 'star', id: 'key' });
    if (!r) { STORY.think('Aurora is waiting to hear what you know about that night.', 4); return; }
    lock(true);
    try {
      frame2(p); await say(p, 'aurora.key');
      AP().key = r.letter; giveKey(); TIME.refresh(); G.save();
      await keyCard();
      await say(p, 'aurora.after');
    } finally { lock(false); }
    STORY.think('The theater’s door, right behind Aurora. Down under the stage…', 5);
  }
  async function doorLook() {
    look('padlock');
    await wait(0.2);
    if (opened() && !AP().key) STORY.think(`Locked. «${plain(X.NAMES.closed[lang()])}», in Aurora’s handwriting. Aurora has the key.`, 5);
  }

  // ------------------------------------------------------------ under the stage: the memories, the scenes and the deeds
  const GHOST = ['lorenzo', 'clara', 'pilar', 'aurora'];
  const MEMKEY = ['r1.mem', 'r2.mem', 'r3.mem', 'r4.aurora'];
  const RT = { 0: { s: 'r1.scene', d: 'r1.deed' }, 1: { s: 'r2.scene', d: 'r2.deed' }, 2: { s: 'r3.scene', d: 'r3.deed' } };
  const rooms = () => APSTAGE._.rooms;
  function memFlash() {
    let el = document.getElementById('past-mem');
    if (!el) { el = document.createElement('div'); el.id = 'past-mem'; el.style.cssText = 'position:fixed;inset:0;z-index:7;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center, rgba(255,226,170,0.15) 25%, rgba(170,110,40,0.5) 100%);transition:opacity .22s'; document.body.appendChild(el); }
    el.style.opacity = '1'; setTimeout(() => { el.style.opacity = '0'; }, 520); snd('tick');
  }
  async function memory(i) {
    const room = rooms()[i], P = room && room.ghost; if (!P) return;
    P.api.name = castName(GHOST[i]);
    lock(true);
    try { memFlash(); frameOn(P.api.x, P.api.y, P.api.z); await wait(0.5); await demo(P.api, MEMKEY[i]); } finally { lock(false); }
    AP()['r' + i + 'm'] = true; G.save();
  }
  async function roomTask(i, part) {
    const key = RT[i][part];
    if (part === 's' && i === 0) await card('under');
    const r = await ask(X.TASKS[key], { icon: part === 's' ? 'star' : i === 2 ? 'star' : i === 0 ? 'push' : 'blow', id: key, hint: part === 's' ? 'How it was: the scene.' : i === 2 ? 'Replay what he did.' : `In the Past, ${mimoName()} only moves in memories.` });
    if (!r) return;
    lock(true);
    try { if (part === 's') await sceneFx(i); else await deedFx(i); } catch (e) { console.error('[alba past] room fx', e); } finally { lock(false); }
    AP()['r' + i + part] = r.letter; APSTAGE.apply(); G.save();
    if (part === 's') STORY.think(i === 2 ? 'Now replay what happened that night. Elio…' : `Now the deed: tell ${mimoName()} what it did, as a memory.`, 5);
    else { solved(); STORY.think(i === 2 ? 'The low door is open: the prompter’s box is through there.' : 'The way on is open!', 4.5); }
  }
  async function sceneFx(i) {
    const room = rooms()[i], R = room.R; memFlash(); snd('chime');
    if (i === 0) { frameOn(room.lamp.x, 300, room.lamp.z); await tween(1.0, k => { room.lampGlow.material.opacity = 0.7 * k; }); APSTAGE.setFog('warm'); G.w3d.fx.sparkle(room.lamp.x, 302.6, room.lamp.z, 14, ['#ffd166', '#fff3a0']); await wait(0.6); }
    if (i === 1) { frameOn(R.x - 2.9, 300, R.z - 3.4); const c0 = new THREE.Color('#8f8a86'), c1 = new THREE.Color('#c43c3c'); await tween(1.2, k => { room.robeMat.color.copy(c0).lerp(c1, k); }); G.w3d.fx.sparkle(R.x - 2.9, 301.6, R.z - 3.4, 18, ['#ff8f7a', '#ffd166']); await wait(0.5); }
    if (i === 2) { frameOn(R.x - 0.5, 301, R.z - R.hd + 1); snd('wood'); await tween(1.0, k => { room.trap.rotation.x = -1.5 * k; room.trapLight.material.opacity = 0.22 * k; }); await wait(0.6); }
  }
  async function deedFx(i) {
    const room = rooms()[i], R = room.R, sim = G.sim, M = sim.mimo;
    if (i === 0) {
      frameOn(R.x + 4.0, 300, R.z - 4.2);
      sim.mimoGo({ x: R.x + 3.2, z: R.z - 4.0 }, { x: R.x + 4.6, z: R.z - 4.8 }); await wait(0.9);
      M.hop = { t: 0 }; snd('land', 8); memFlash();
      const x0 = room.moon.position.x; await tween(1.0, k => { room.moon.position.x = lerp(x0, R.x + 2.2, k); });
      sim.mimoGo(null, null);
    }
    if (i === 1) {
      frameOn(R.x + 4.2, 300, R.z - 4.4);
      sim.mimoGo({ x: R.x + 3.4, z: R.z - 3.6 }, { x: R.x + 4.6, z: R.z - 5.0 }); await wait(0.9);
      snd('blow'); memFlash();
      const D = room.dust.map(s => ({ s, p0: s.position.clone(), o0: s.material.opacity }));
      await tween(1.2, k => D.forEach(({ s, p0, o0 }, j) => { s.position.set(p0.x + k * (2 + (j % 3)), p0.y + k * 1.2, p0.z - k * 0.6); s.material.opacity = o0 * (1 - k); }));
      D.forEach(({ s, o0 }) => { s.visible = false; s.material.opacity = o0; });
      sim.mimoGo(null, null);
    }
    if (i === 2) {
      const E = room.elio, top = R.z - R.hd + 0.7; E.api.name = castName('elio'); E.g.visible = true; E.lockYaw = true;
      frameOn(R.x + 1.5, 300, R.z - 3.2); memFlash();
      E.g.position.set(R.x - 0.5, 303.3, top); E.g.rotation.y = Math.PI;
      await tween(1.4, k => { E.g.position.y = 303.3 - 3.3 * k; });
      await tween(1.3, k => { E.g.position.x = lerp(R.x - 0.5, R.x + 4.6, k); E.g.position.z = lerp(top, R.z - R.hd + 0.6, k); E.g.rotation.y = Math.PI / 2; });
      snd('wood'); await tween(0.8, k => { room.door.rotation.y = -1.4 * k; });
      await tween(0.6, k => { E.body.children.forEach(m => { if (m.material && m.material.transparent) m.material.opacity = 0.55 * (1 - k); }); });
      E.g.visible = false; E.lockYaw = false;
    }
  }
  // the prompter's box: the whisper's lie, Aurora's memory corrects it; then yours; then the Prompter itself
  async function promptScene() {
    const room = rooms()[3], P = room.ghost, R = room.R; if (!P) return;
    P.api.name = castName('aurora');
    lock(true);
    try {
      frameOn(R.x, 300, R.z - 3.4, 5.4); await wait(0.6);
      const pr = { id: 'prompter', name: castName('prompter'), x: R.x, y: 300.8, z: R.z - 3.4, top: 2.4, talking: false };
      snd('swoosh'); await demoT(pr, { en: 'The curtain was closed…', es: 'La cortina estaba cerrada…', pt: 'A cortina estava fechada…', de: 'Der Vorhang war zu …', zh: '[幕布|mù bù] [是|shì] [关|guān] [着|zhe] [的|de] …', ja: '[幕|まく] は [閉|し]まって いた …' },
        { es: [['cerrada', 'closed']], pt: [['fechada', 'closed']], de: [['zu', 'closed']], zh: [['[关|guān] [着|zhe]', 'closed']], ja: [['[閉|し]まって いた', 'was closed']] });
      memFlash(); frameOn(P.api.x, P.api.y, P.api.z); await wait(0.3);
      await demo(P.api, 'r4.aurora');
      if (room.boss) { room.boss.masks[0].visible = false; snd('crack'); G.w3d.fx.sparkle(R.x, 301.4, R.z - 3.4, 12, ['#efe9dc', '#ffffff']); await wait(0.5); room.boss.masks[0].visible = true; }
    } finally { lock(false); }
    AP().r3m = true; G.save();
    await card('fix');
    STORY.think('It whispers on: «… the theater was empty…». Correct it!', 5);
  }
  async function practice() {
    const room = rooms()[3], R = room.R;
    const r = await ask(X.TASKS['r4.fix'], { icon: 'star', id: 'r4.fix', title: X.TASKS['r4.fix'].title });
    if (!r) return;
    lock(true);
    try { frameOn(R.x, 300, R.z - 3.4, 5.4); snd('crack'); memFlash(); G.w3d.fx.sparkle(R.x, 301.4, R.z - 3.4, 18, ['#efe9dc', '#c9c4dc']); await wait(1.0); }
    finally { lock(false); }
    AP().r3p = r.letter; G.save();
    STORY.think('The gray figure in the shell turns its masks toward you. It won’t let its lies go so easily…', 5);
  }
  async function bossScene() {
    if (typeof APBOSS === 'undefined') return;
    const res = await APBOSS.fight();
    if (res && res.outcome === 'win') { AP().boss = res.grade || 'B'; TIME.grade('alba.prompter', AP().boss); APSTAGE.apply(); G.save(); await echoScene(); }
    else STORY.think('The whisper goes on in the prompter’s box… face it again when you’re ready.', 5);
  }
  const echoT = () => { const E = X.ECHO, l = lang(); return { en: E.en[l] || E.en.es, es: E.es, pt: E.pt, de: E.de, zh: E.zh, ja: E.ja }; };
  async function echoScene() {
    if (typeof CH4 === 'undefined' || CH4.got('alba', 'past')) return;
    const room = rooms()[3], e = room.echo, R = room.R;
    lock(true);
    try {
      APSTAGE.apply(); frameOn(e.position.x, 300.2, e.position.z, 3.6); await wait(1.0);
      await STORY.you('A small warm light… and a voice in it. It’s Elio’s. As a boy.');
      snd('learned'); G.w3d.fx.sparkle(e.position.x, e.position.y, e.position.z, 22, ['#ffe2a0', '#ff8f7a', '#ffffff']);
      const p = { id: 'elio', name: castName('elio'), x: e.position.x, y: 300.5, z: e.position.z, top: 1.3, talking: false };
      await demoT(p, echoT(), X.MARKS.echo);
      await STORY.you('The line he got wrong at the concert… said right, this time.');
    } finally { lock(false); }
    await CH4.give('alba', 'past', AP().boss || 'B');
    APSTAGE.apply();
    STORY.think('Let’s tell Noa. She hears every crack: the duck pond’s.', 5.5);
  }
  // the first time in a room (APSTAGE calls it after the room's card)
  async function arrived(id) {
    if (id === 'props') { STORY.think('Under the stage. Dust, old props… and a memory of that night, waiting.', 4); await wait(0.8); await memory(0); await card('under'); STORY.think('First set the scene, how it was: the lamp.', 4.5); }
    if (id === 'costumes') { await memory(1); STORY.think('How were the robes that night? Then the dust…', 4.5); }
    if (id === 'lift') { await memory(2); STORY.think('How was the trapdoor that night? Then: what did Elio do?', 4.5); }
    if (id === 'box') await promptScene();
    if (id === 'bakery') { const P = rooms()[4].marta; if (P) { P.api.name = castName('marta'); await sayT(P.api, X.CHAT.marta[0]); } }
    if (id === 'school') STORY.think('Julián’s pupils, writing about yesterday… and one empty desk, by the window.', 5);
  }
  // E in the rooms (APSTAGE asks): the memories, the scenes, the deeds, the ways on, the page, the Prompter, the echo; the homes' people
  function roomItems(id, room, add0) {
    const S = AP(), R = room.R, out = [], tell = `Tell ${mimoName()}`;
    const push = (x, z, r, label, run, extra) => out.push(Object.assign({ x, z, y: 300, r, label, run }, extra || {}));
    const ghost = i => { const P = room.ghost; if (P) push(P.api.x, P.api.z, 1.5, 'Remember', () => memory(i)); };
    if (id === 'props') {
      ghost(0);
      if (S.r0m && !S.r0s) push(room.lamp.x, room.lamp.z + 0.8, 1.9, 'Set the scene', () => roomTask(0, 's'), { hides: 'lamp' });
      else if (S.r0s && !S.r0d) push(R.x + 3.0, R.z - 3.6, 2.0, tell, () => roomTask(0, 'd'), { hides: 'moon' });
      if (S.r0d) push(R.x + 4.6, R.z - 5.0, 1.5, 'Go on: the costume racks', () => APSTAGE.go(1));
    }
    if (id === 'costumes') {
      ghost(1);
      if (S.r1m && !S.r1s) push(R.x - 2.9, R.z - 2.5, 2.0, 'Set the scene', () => roomTask(1, 's'), { hides: 'robes' });
      else if (S.r1s && !S.r1d) push(R.x + 3.4, R.z - 3.6, 2.0, tell, () => roomTask(1, 'd'));
      if (S.r1d) push(R.x + 4.6, R.z - 5.0, 1.5, 'Go on: the trapdoor lift', () => APSTAGE.go(2));
      const pf = TIME.flag('past', 'felixPage');
      if (!pf || pf === 'asked') push(R.x + 1.8, R.z - 2.9, 1.4, 'Look in the trunk', findPage, { hides: 'trunk' });
    }
    if (id === 'lift') {
      ghost(2);
      if (S.r2m && !S.r2s) push(R.x - 0.5, R.z - 3.0, 2.0, 'Set the scene', () => roomTask(2, 's'), { hides: 'trapdoor' });
      else if (S.r2s && !S.r2d) push(R.x - 0.5, R.z - 2.0, 2.2, 'Replay the memory', () => roomTask(2, 'd'), { hides: 'lift' });
      if (S.r2d) push(R.x + 4.6, R.z - R.hd + 0.9, 1.4, 'Go on: the prompter’s box', () => APSTAGE.go(3));
    }
    if (id === 'box') {
      ghost(3);
      if (!S.r3m) push(R.x, R.z - 1.8, 2.4, 'Listen', promptScene);
      else if (!S.r3p) push(R.x, R.z - 1.8, 2.4, 'Correct the whisper', practice, { hides: 'shell' });
      else if (!S.boss) push(R.x, R.z - 1.8, 2.4, 'Face the Prompter', bossScene, { hides: 'shell' });
      else if (typeof CH4 !== 'undefined' && !CH4.got('alba', 'past')) push(R.x, R.z - 2.0, 2.4, 'The echo', echoScene, { hides: 'shell' });
    }
    if (id === 'bakery') { const P = room.marta; if (P) push(P.api.x, P.api.z + 0.9, 1.6, 'Talk', () => martaTalk(P), { who: 'past:marta', p: P.api }); }
    if (id === 'school') {
      for (const [k, P] of [['hugo', room.hugo], ['tomi', room.tomi]]) if (P) push(P.api.x, P.api.z + 0.7, 1.0, 'Talk', () => kidTalk(k, P), { who: 'past:' + k, p: P.api });
      const mf = TIME.flag('past', 'mistakes'), sl = S.slates || {};
      if (mf === 'asked') for (const k of ['hugo', 'tomi', 'pili']) if (!sl[k]) { const s = room.slates[k]; push(s.x, s.z - 0.6, 0.9, 'Correct the slate', () => slate(k)); }
    }
    return out;
  }
  // where the compass points inside
  function roomTarget(id, room) {
    const S = AP(), R = room.R, at = (x, z, hint) => ({ x, z, hint });
    if (id === 'props') return !S.r0s ? at(room.lamp.x, room.lamp.z, '{mimo} looks up at the dark lamp.') : !S.r0d ? at(R.x + 4.6, R.z - 4.8, '{mimo} sniffs the big painted moon.') : at(R.x + 4.6, R.z - 5, '{mimo} points through the doorway.');
    if (id === 'costumes') return !S.r1s ? at(R.x - 2.9, R.z - 3.4, '{mimo} tugs at a gray robe.') : !S.r1d ? at(R.x + 4.6, R.z - 4.8, '{mimo} sneezes at the dust.') : at(R.x + 4.6, R.z - 5, '{mimo} points through the doorway.');
    if (id === 'lift') return !S.r2s ? at(R.x - 0.5, R.z - R.hd + 0.6, '{mimo} looks up the ladder.') : !S.r2d ? at(R.x - 0.5, R.z - 2.0, '{mimo} stares at the ladder: somebody came down it.') : at(R.x + 4.6, R.z - R.hd + 0.5, '{mimo} points at the low door.');
    if (id === 'box') return at(R.x, R.z - 3.4, '{mimo}’s ears go flat. Something whispers in the shell.');
    return null;
  }
  // the page in the trunk (Félix's)
  async function findPage() {
    const f = TIME.flag('past', 'felixPage');
    if (f && f !== 'asked') { look('trunk'); return; }
    lock(true);
    try {
      const room = rooms()[1]; frameOn(room.R.x + 1.8, 300, room.R.z - 3.8, 3.2); await wait(0.5);
      snd('page'); G.w3d.fx.sparkle(room.R.x + 1.8, 301, room.R.z - 3.8, 12, ['#fff1c0', '#ffd166']);
      TIME.flag('past', 'felixPage', 'found'); APSTAGE.apply(); G.save();
      STORY.think(f === 'asked' ? 'A page of music, signed «F. B.»: the last page of Félix’s song! Back to Félix, by the theater.' : 'A page of music, signed «F. B.», under the costumes. Someone must be missing it…', 6);
      await wait(0.6);
    } finally { lock(false); }
  }

  // ------------------------------------------------------------ the side quests and the small tasks
  // «Félix's lost page»: he asks (after his memory); you find it in the trunk under the stage; you tell him where it was
  async function felixPage() {
    const p = who('felix'), f = TIME.flag('past', 'felixPage'); if (!p) return;
    if (f === 'given') { lock(true); try { frame2(p); await say(p, 'felix.again'); } finally { lock(false); } return; }
    if (f !== 'found') {
      lock(true); try { frame2(p); await say(p, 'felix.page'); } finally { lock(false); }
      if (!f) { TIME.flag('past', 'felixPage', 'asked'); G.save(); }
      STORY.think('His last page… somewhere under the stage. Aurora has the theater’s key.', 5); return;
    }
    lock(true); try { frame2(p); await say(p, 'felix.where'); } finally { lock(false); }
    const r = await ask(X.TASKS.page, { icon: 'star', id: 'page' });
    if (!r) { STORY.think('Félix is waiting to hear where his page was.', 4); return; }
    lock(true);
    try {
      frame2(p); G.w3d.fx.sparkle(p.x, p.y + 1.4, p.z, 18, ['#c9a2ff', '#fff1c0']); snd('learned');
      await say(p, 'felix.thanks');
      TIME.flag('past', 'felixPage', 'given'); TIME.refresh(); G.save();
    } finally { lock(false); }
    coins(10, 'Félix’s page');
    STORY.think('A page framed in the library, about forty years ago… Is it still there today?', 6);
  }
  // «Young Rosa's letter»: she writes to Elio (you give her one more kind thing, in the past); Mateo keeps it; today, Doña Rosa gets it
  function letterCard(you) {
    const l = lang(), cj = isC(l) && typeof CJK !== 'undefined';
    const T = { es: ['Querido Elio:', 'Esa noche fuiste muy valiente. Yo no me reí.', 'Mi nueva amistad dice:', 'Vuelve pronto. Tu amiga, Rosita'],
      pt: ['Querido Elio,', 'Naquela noite você foi muito corajoso. Eu não ri.', 'A minha nova amizade diz:', 'Volta logo. Sua amiga, Rosinha'],
      de: ['Lieber Elio,', 'an dem Abend warst du sehr mutig. Ich habe nicht gelacht.', 'Jemand Neues sagt:', 'Komm bald wieder. Deine Rosi'],
      zh: ['[亲爱|qīn ài] [的|de] [艾利欧|Ài lì ōu] ：', '[那天|nà tiān] [晚上|wǎn shang] [你|nǐ] [很|hěn] [勇敢|yǒng gǎn] 。 [我|wǒ] [没有|méi yǒu] [笑|xiào] 。', '[我|wǒ] [的|de] [新|xīn] [朋友|péng you] [说|shuō] ：', '[快|kuài] [回来|huí lái] [吧|ba] 。 [你|nǐ] [的|de] [朋友|péng you] ， [小|Xiǎo] [罗莎|Luó shā]'],
      ja: ['エリオ くん へ', 'あの [夜|よる] の エリオ くん は 、 とても [勇敢|ゆうかん] だった 。 わたし は [笑|わら]わなかった よ 。', '[新|あたら]しい [友|とも]だち が [言|い]って た ：', 'また [会|あ]おう ね 。 ロサ より'] }[l] || [];
    const en = ['Dear Elio,', 'That night you were very brave. I didn’t laugh.', 'My new friend says:', 'Come back soon. Your friend, young Rosa'];
    const line = s => (cj ? CJK.html(s, { lang: l }) : esc(s));
    return UI.card(`<div class="tag">Young Rosa’s letter</div><div class="cem-song" style="text-align:left;max-width:440px;margin:6px auto;font:italic 600 17px Georgia,serif;line-height:1.5">${T.map((s, i) => (i === 3 ? `«${esc(you)}»<br>` : '') + line(s)).join('<br>')}</div>`
      + `<details style="font-size:13px;opacity:.85"><summary>EN</summary>${en.map(esc).join('<br>')}</details><div class="sub">E</div>`, { kind: 'page cem-doc' });
  }
  async function rositaLetter() {
    const P = pastP('rosita'); if (!P) return; const p = P.api; p.name = castName('rosita');
    const f = TIME.flag('past', 'letter');
    if (f === 'written' || f === 'posted') { lock(true); try { frame2(p); await say(p, 'rosita.wait'); } finally { lock(false); } return; }
    lock(true); try { frame2(p); await say(p, 'rosita.ask'); await demo(p, 'letter.demo'); await say(p, 'rosita.more'); } finally { lock(false); }
    if (!f) { TIME.flag('past', 'letter', 'asked'); G.save(); }
    const r = await ask(X.TASKS.letter, { icon: 'letter', id: 'letter' });
    if (!r) { STORY.think('Young Rosa is waiting, her pencil ready.', 4); return; }
    AP().letterText = r.text;
    await letterCard(r.text);
    lock(true); try { frame2(p); await say(p, 'rosita.post'); } finally { lock(false); }
    TIME.flag('past', 'letter', 'written'); G.save();
  }
  async function mateoLetter() {
    const p = who('mateo'); if (!p) return;
    lock(true); try { frame2(p); await say(p, 'mateo.letter'); } finally { lock(false); }
    const r = await ask(X.TASKS.mateo, { icon: 'letter', id: 'mateo' });
    if (!r) { STORY.think('Mateo turns the letter over in his hands, waiting.', 4); return; }
    lock(true); try { frame2(p); await say(p, 'mateo.keep'); snd('page'); TIME.flag('past', 'letter', 'posted'); TIME.refresh(); G.save(); } finally { lock(false); }
    coins(6, 'The letter is posted');
    STORY.think('A letter waiting in a drawer, about forty years ago… Has anyone ever opened that drawer?', 6);
  }
  async function rosaLetter() {
    const n = G.sim.npc('rosa'); if (!n) return;
    const NM = { es: 'Doña Rosa', pt: 'Dona Rosa', de: 'Rosa', zh: '[罗莎|Luó shā] [奶奶|nǎi nai]', ja: 'ロサ さん' };
    const p = { id: 'rosa', name: plain(NM[lang()] || 'Rosa'), x: n.x, y: n.y, z: n.z, top: 1.9 };
    lock(true); try { n.talking = true; frame2(p); await say(p, 'rosa.letter'); } finally { n.talking = false; lock(false); }
    if (!TIME.flag('now', 'letterRead')) { TIME.flag('now', 'letterRead', true); G.save(); }
  }
  async function futureRosaLetter(it) {
    const p = it && it.p; if (!p) return;
    lock(true); try { frame2(p); await say(p, 'frosa.letter'); } finally { lock(false); }
  }
  // «The choir's robes» (Clara): how they were, three times
  async function claraRobes() {
    const p = who('clara'); if (!p) return;
    if (TIME.flag('past', 'robes') === 'done') { lock(true); try { frame2(p); await sayT(p, X.CHAT.clara[1]); } finally { lock(false); } return; }
    lock(true); try { frame2(p); await say(p, 'clara.ask'); } finally { lock(false); }
    if (!TIME.flag('past', 'robes')) { TIME.flag('past', 'robes', 'asked'); G.save(); }
    await card('robes');
    const S = AP(), done = S.robes || (S.robes = {});
    for (const k of ['robe.color', 'robe.collar', 'robe.size']) {
      if (done[k]) continue;
      const r = await ask(X.TASKS[k], { icon: 'star', id: k });
      if (!r) { STORY.think('Clara is waiting, her needle ready.', 4); return; }
      done[k] = r.letter; G.save();
    }
    lock(true); try { frame2(p); snd('learned'); await say(p, 'clara.thanks'); TIME.flag('past', 'robes', 'done'); G.save(); } finally { lock(false); }
    coins(8, 'Clara’s robes');
  }
  // «Brave mistakes» (Julián): he asks; you correct three slates in the schoolroom; he gives you a gold star
  async function julianMistakes() {
    const p = who('julian'); if (!p) return;
    const f = TIME.flag('past', 'mistakes'), sl = AP().slates || {}, n = ['hugo', 'tomi', 'pili'].filter(k => sl[k]).length;
    if (f === 'done') { lock(true); try { frame2(p); await sayT(p, X.CHAT.julian[1]); } finally { lock(false); } return; }
    if (f === 'asked' && n >= 3) {
      lock(true); try { frame2(p); snd('learned'); await say(p, 'julian.thanks'); TIME.flag('past', 'mistakes', 'done'); G.save(); } finally { lock(false); }
      coins(8, `${plain(X.NAMES.star[lang()])}`); return;
    }
    lock(true); try { frame2(p); await say(p, 'julian.ask'); } finally { lock(false); }
    if (!f) { TIME.flag('past', 'mistakes', 'asked'); G.save(); }
    STORY.think(n ? `${3 - n} more slates in the schoolroom.` : 'The schoolroom’s door is right behind Julián.', 4.5);
  }
  async function slate(k) {
    await card('board');
    const r = await ask(X.TASKS['slate.' + k], { icon: 'chalk', id: 'slate.' + k });
    if (!r) return;
    const S = AP(); (S.slates || (S.slates = {}))[k] = r.letter; G.save();
    const P = rooms()[5] && rooms()[5][k];
    if (P) { P.api.name = castName(k); snd('pip'); G.w3d.fx.sparkle(P.api.x, 301.0, P.api.z, 8, ['#fff3a0']); }
    const n = ['hugo', 'tomi', 'pili'].filter(x => S.slates[x]).length;
    STORY.think(n >= 3 ? 'All three slates, fixed! Tell Julián, outside.' : `${3 - n} more to go.`, 4);
  }
  async function kidTalk(k, P) { P.api.name = castName(k); const S = AP(), key = 'kid_' + k, i = (S[key] = (S[key] || 0) + 1); return sayT(P.api, X.CHAT[k][(i - 1) % X.CHAT[k].length]); }
  // «Bread for Pilar» (Elena): you carry it to Pilar, who asks who baked it
  async function elenaBread() {
    const p = who('elena'); if (!p) return; const f = TIME.flag('past', 'bread');
    if (f === 'done') { lock(true); try { frame2(p); await sayT(p, X.CHAT.elena[1]); } finally { lock(false); } return; }
    lock(true); try { frame2(p); await say(p, 'elena.bread'); } finally { lock(false); }
    if (!f) { TIME.flag('past', 'bread', 'carrying'); G.save(); UI.toast('🍞 Elena’s warm bread, for Pilar'); }
  }
  async function pilarBread() {
    const p = who('pilar'); if (!p) return;
    lock(true); try { frame2(p); await say(p, 'pilar.bread'); } finally { lock(false); }
    const r = await ask(X.TASKS.bread, { icon: 'bread', id: 'bread' });
    if (!r) { STORY.think('Pilar holds the warm bread, waiting.', 4); return; }
    lock(true); try { frame2(p); await say(p, 'pilar.thanks'); TIME.flag('past', 'bread', 'done'); G.save(); } finally { lock(false); }
    coins(5, 'Bread for Pilar');
  }
  // young Tina's voice; young Marta's dough (the bakery)
  async function tinaVoice() {
    const p = who('tina'); if (!p) return;
    if (AP().tina) { lock(true); try { frame2(p); await say(p, 'tina.thanks'); } finally { lock(false); } return; }
    lock(true); try { frame2(p); await say(p, 'tina.ask'); } finally { lock(false); }
    const r = await ask(X.TASKS.tina, { icon: 'musician', id: 'tina' });
    if (!r) { STORY.think('Young Tina is waiting, very quietly.', 4); return; }
    lock(true); try { frame2(p); snd('sing'); await say(p, 'tina.thanks'); AP().tina = r.letter; G.save(); } finally { lock(false); }
  }
  async function martaTalk(P) {
    P.api.name = castName('marta');
    if (AP().marta) { const i = (AP().kid_marta = (AP().kid_marta || 0) + 1); return sayT(P.api, X.CHAT.marta[i % X.CHAT.marta.length]); }
    lock(true); try { frameOn(P.api.x, 300, P.api.z, 3.4); await say(P.api, 'marta.ask'); } finally { lock(false); }
    const r = await ask(X.TASKS.marta, { icon: 'bread', id: 'marta' });
    if (!r) return;
    lock(true); try { await say(P.api, 'marta.thanks'); } finally { lock(false); }
    AP().marta = r.letter;
    const bag = G.state.bag || (G.state.bag = {}); if (typeof SHOP !== 'undefined' && SHOP.ITEMS && SHOP.ITEMS.some(it => it.id === 'w.bread')) { bag['w.bread'] = (bag['w.bread'] || 0) + 1; UI.toast('🍞 young Marta gave you a warm roll'); }
    G.save();
  }

  // ------------------------------------------------------------ the people of then: their own lines after the concert (in turn), and
  // what each one has for you (STORY.talkHooks; cemetery.js's past era gives their Talk who: 'past:<id>')
  const CHAT_IDS = ['elena', 'julian', 'felix', 'clara', 'mateo', 'aurora', 'pilar', 'tina'];
  function pastTalk(id, api) {
    if (!ch4On() || !CHAT_IDS.includes(id)) return null;
    const S = AP(), key = 'chat_' + id, i = (S[key] = (S[key] || 0) + 1), list = X.CHAT[id];
    api.name = castName(id);
    return sayT(api, list[(i - 1) % list.length]);
  }
  const step = () => { const m = typeof QUESTS !== 'undefined' && QUESTS._ && QUESTS._.mainQ && QUESTS._.mainQ(); const st = m && QUESTS.current(m); return st && st.ch4 === 'alba' && st.ch4w === 'past' ? st : null; };
  const stepIs = k => { const st = step(); return !!(st && st.apKey === k); };
  function talkItems(it) {
    if (!it || !G || !ch4On()) return null;
    const w = TIME.world(), out = [], f = (ww, k) => TIME.flag(ww, k);
    if (w === 'past' && /^past:/.test(it.who || '')) {
      const id = it.who.slice(5);
      if (MEM[id] && opened() && !asked()[id]) out.push({ label: 'That night', sub: '★ main', run: () => memScene(id) });
      if (id === 'aurora' && opened() && askedN() >= 4 && !AP().key) out.push({ label: 'The theater’s key', sub: '★ main', run: keyScene });
      if (id === 'felix' && asked().felix && f('past', 'felixPage') !== 'given') out.push({ label: 'Your lost page', sub: '◆ side quest', run: felixPage });
      if (id === 'clara' && asked().clara && f('past', 'robes') !== 'done') out.push({ label: 'The choir’s robes', sub: '◆ side quest', run: claraRobes });
      if (id === 'mateo' && f('past', 'letter') === 'written') out.push({ label: 'Young Rosa’s letter', sub: '◆ side quest', run: mateoLetter });
      if (id === 'julian' && f('past', 'mistakes') !== 'done') out.push({ label: 'Brave mistakes', sub: '◆ side quest', run: julianMistakes });
      if (id === 'elena' && asked().elena && !f('past', 'bread')) out.push({ label: 'Bread for Pilar', sub: '◆ side quest', run: elenaBread });
      if (id === 'pilar' && f('past', 'bread') === 'carrying') out.push({ label: 'Elena’s bread', sub: '◆ side quest', run: pilarBread });
      if (id === 'tina' && opened() && !AP().tina) out.push({ label: 'Singing again', run: tinaVoice });
      if (id === 'rosita' && asked().mateo && f('past', 'letter') !== 'posted') out.push({ label: 'A letter for Elio', sub: f('past', 'letter') === 'written' ? '' : '◆ side quest', run: rositaLetter });
    }
    if (w === 'now' && it.who === 'rosa' && f('past', 'letter') === 'posted') out.push({ label: 'The old letter', sub: f('now', 'letterRead') ? '' : '◆ side quest', run: rosaLetter });
    if (w === 'future' && it.who === 'future:rosa' && f('past', 'letter') === 'posted') out.push({ label: 'The letter for Elio', run: () => futureRosaLetter(it) });
    return out.length ? out : null;
  }

  // ------------------------------------------------------------ the world: the locked theater (the Past), Félix's framed page (today and
  // tomorrow, in the library's window), Rosa's old letter (today), the doors of then
  const HALL = () => (typeof CEMETERY !== 'undefined' && CEMETERY._ && CEMETERY._.HALL) || { x: -13.5, z: -241, d: 12.5, y0: 0.7 };
  function noteTex() {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const c = cv.getContext('2d'), l = lang();
    c.fillStyle = '#8a5f3e'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#7a5236'; for (let i = 0; i < 4; i++) c.fillRect(0, i * 24 + 22, 256, 2);
    c.fillStyle = '#f4efe0'; c.fillRect(30, 14, 196, 68); c.strokeStyle = '#2b2235'; c.lineWidth = 2; c.strokeRect(30, 14, 196, 68);
    c.fillStyle = '#2b2235'; c.textAlign = 'center'; c.textBaseline = 'middle'; const t = plain(X.NAMES.closed[l], l);
    let fs = 34; const font = isC(l) ? '"Yu Gothic UI","Microsoft YaHei",sans-serif' : '"Segoe Print","Comic Sans MS",cursive';
    c.font = `800 ${fs}px ${font}`; while (c.measureText(t).width > 180 && fs > 14) { fs -= 2; c.font = `800 ${fs}px ${font}`; } c.fillText(t, 128, 50);
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; return tx;
  }
  function makeLock() {
    const H = HALL(), g = new THREE.Group(), y0 = H.y0 + 0.55, z = H.z + H.d / 2 + 0.06, x = H.x; g.name = 'alba-past-theater-lock';
    const k = PAST.API.Kit(), KG = PAST.API.KG;
    const left = new THREE.Group(), right = new THREE.Group(); left.position.set(x - 1.3, y0, z); right.position.set(x + 1.3, y0, z); g.add(left, right);
    const lk = PAST.API.Kit(); lk.box(0.65, 1.38, 0, 1.3, 2.76, 0.08, '#7a3a2a', { ink: 0.014 }).box(0.65, 2.0, 0.05, 0.86, 0.6, 0.02, '#8a4a36', { ink: 0 }).box(0.65, 0.75, 0.05, 0.86, 0.8, 0.02, '#8a4a36', { ink: 0 }); lk.build(left);
    const rk = PAST.API.Kit(); rk.box(-0.65, 1.38, 0, 1.3, 2.76, 0.08, '#7a3a2a', { ink: 0.014 }).box(-0.65, 2.0, 0.05, 0.86, 0.6, 0.02, '#8a4a36', { ink: 0 }).box(-0.65, 0.75, 0.05, 0.86, 0.8, 0.02, '#8a4a36', { ink: 0 }); rk.build(right);
    // the fanlight above the doors boarded up (no glow from the hall any more), the chain and the padlock (gone once Aurora's key opens it)
    const fk = PAST.API.Kit(); fk.box(x, y0 + 3.1, z - 0.01, 2.62, 0.7, 0.06, '#5a3a28', { ink: 0.012 }); fk.build(g);
    const chain = new THREE.Group(); g.add(chain); k.rod([x - 0.6, y0 + 1.3, z + 0.08], [x + 0.6, y0 + 1.3, z + 0.08], 0.03, '#6b6f78', 0.004).box(x, y0 + 1.14, z + 0.12, 0.22, 0.26, 0.08, '#c9a24a', { ink: 0.006 }).add(KG.torus, x, y0 + 1.32, z + 0.12, 0.08, 0.08, 0.08, '#c9a24a', { ink: 0 }); k.build(chain);
    const note = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.42), new THREE.MeshLambertMaterial({ map: noteTex() })); note.position.set(x + 0.62, y0 + 1.95, z + 0.07); g.add(note);
    const plank = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.84), new THREE.MeshLambertMaterial({ map: noteTex() })); plank.position.set(x, y0 + 3.78, z + 0.18); g.add(plank);
    let lang0 = lang(), open0 = null;
    return { obj: g, update() {
      const open = !!AP().key;
      if (open !== open0) { open0 = open; chain.visible = !open; left.rotation.y = open ? -1.1 : 0; note.visible = !open; }
      if (lang() !== lang0) { lang0 = lang(); note.material.map = plank.material.map = noteTex(); note.material.needsUpdate = plank.material.needsUpdate = true; }
    } };
  }
  // the library's window today (house 12, the north street): where it is, from interiors.js's doors
  function libDoor() {
    try { const D = typeof INTERIORS !== 'undefined' && INTERIORS.doors ? INTERIORS.doors(G) : []; const d = D.find(q => q.id === 'alba-house-12'); if (d) return d; } catch (e) { /* */ }
    return { x: -7.7, z: -160.8, yaw: -Math.PI / 2 };
  }
  function pageFramePos() { const d = libDoor(), yaw = d.yaw !== undefined ? d.yaw : -Math.PI / 2, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw); return { x: d.x + rx * 1.35 + fx * 0.12, z: d.z + rz * 1.35 + fz * 0.12, yaw, lx: d.x + rx * 1.35 + fx * 1.2, lz: d.z + rz * 1.35 + fz * 1.2 }; }
  function pageTex(old) {
    const cv = document.createElement('canvas'); cv.width = 192; cv.height = 256; const c = cv.getContext('2d'), l = lang();
    c.fillStyle = old ? '#d9c8a0' : '#efe2bd'; c.fillRect(0, 0, 192, 256);
    c.strokeStyle = '#4a3424'; c.lineWidth = 1.2; for (let s = 0; s < 5; s++) for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(16, 60 + s * 38 + i * 5); c.lineTo(176, 60 + s * 38 + i * 5); c.stroke(); }
    c.fillStyle = '#2b2235'; let seed = 3; const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let s = 0; s < 5; s++) for (let i = 0; i < 9; i++) { const x = 28 + i * 16, y = 60 + s * 38 + Math.floor(R() * 5) * 2.5; c.beginPath(); c.ellipse(x, y, 4, 3, -0.4, 0, TAU); c.fill(); c.fillRect(x + 3, y - 14, 1.2, 14); }
    c.font = 'italic 700 15px Georgia, "Yu Mincho", "Microsoft YaHei", serif'; c.textAlign = 'center'; c.fillText(plain(X.NAMES.song[l], l), 96, 32); c.font = 'italic 12px Georgia, serif'; c.fillText('F. B.', 160, 246);
    const tx = new THREE.CanvasTexture(cv); tx.anisotropy = 4; return tx;
  }
  function makeFrame(kind) {
    const P = pageFramePos(), g = new THREE.Group(); g.name = 'alba-past-page-' + kind;
    const y = gy(P.x, P.z) + 1.55; g.position.set(P.x, y, P.z); g.rotation.y = P.yaw;
    const k = PAST.API.Kit(); k.box(0, 0, -0.03, 0.62, 0.8, 0.05, kind === 'future' ? '#6b5a4a' : '#8a5f3e', { ink: 0.01 }); k.build(g);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.66), new THREE.MeshLambertMaterial({ map: pageTex(kind === 'future') })); m.position.z = 0.0; g.add(m);
    let l0 = lang();
    return { obj: g, update() { if (lang() !== l0) { l0 = lang(); m.material.map = pageTex(kind === 'future'); m.material.needsUpdate = true; } } };
  }
  async function pageLook(kind) {
    const l = lang(), title = plain(X.NAMES.song[l], l);
    if (kind === 'future') STORY.think(`The same framed page in the library’s window, faded: «${title}» · F. Bravo. Someone still dusts the frame.`, 6);
    else { STORY.think(`In the library’s window, a page of music, yellow with age: «${title}» · F. Bravo. A note under it: «Found under the old theater’s stage».`, 6.5); if (!TIME.flag('now', 'pageSeen')) { TIME.flag('now', 'pageSeen', true); G.save(); } }
  }
  // Rosa's letter, today: an old envelope on her stall (she has it now)
  function rosaSpot() { const n = G && G.sim.npc('rosa'); const L0 = typeof TOWN !== 'undefined' && TOWN.landmarks && (TOWN.landmarks.rosaStall || TOWN.landmarks.stall); return L0 ? { x: L0.x, z: L0.z } : n ? { x: n.home ? n.home.x : n.x, z: n.home ? n.home.z : n.z } : { x: -16.9, z: -133.0 }; }
  function makeEnvelope() {
    const p = rosaSpot(), g = new THREE.Group(); g.name = 'alba-now-letter';
    const k = PAST.API.Kit(); k.box(0, 0, 0, 0.34, 0.02, 0.22, '#e9dcb8', { ink: 0.006 }).box(0, 0.012, 0, 0.12, 0.012, 0.08, '#c9443a', { ink: 0 }); k.build(g);
    const off = { x: p.x + 0.9, z: p.z + 0.6 }; g.position.set(off.x, gy(off.x, off.z) + 0.95, off.z); g.rotation.y = 0.4;
    const gl = PAST.API.glow('#fff1c0', 0.7, 0.3); gl.position.y = 0.1; g.add(gl);
    return { obj: g, update(dt, t) { gl.material.opacity = TIME.flag('now', 'letterRead') ? 0 : 0.22 + 0.12 * Math.sin(t * 3); } };
  }

  // ------------------------------------------------------------ init: the hooks, the effects, the spots (main.js, after TIME.init)
  function init(game) {
    G = game;
    if (typeof APSTAGE !== 'undefined' && APSTAGE.init) APSTAGE.init(game);
    if (typeof CEMETERY !== 'undefined') CEMETERY.pastTalk = (id, api) => pastTalk(id, api);
    if (typeof STORY !== 'undefined' && STORY.talkHooks && !STORY.talkHooks.includes(talkItems)) STORY.talkHooks.push(talkItems);
    try { if (typeof APBOSS !== 'undefined') APBOSS.hook(); } catch (e) { console.error('[alba past] boss hooks', e); }
    // (zh / ja: every word here into the dictionary, so a kanji or hanzi answer typed with the OS IME reads right: CJK.canon)
    if (typeof CJK !== 'undefined' && CJK.addSource) { try { for (const T of [X.CAST, X.TASKS, X.WHISPERS, X.DEMO, X.LINES, X.CHAT, X.LOOKS, X.EXTRA, X.NAMES]) CJK.addSource(T); } catch (e) { console.error('[alba past] cjk sources', e); } }
    addTab();
  }
  TIME.effect('alba.theaterLock', { region: 'alba', when: () => ch4On(), show: { past: () => makeLock() } });
  TIME.effect('alba.felixPage', { region: 'alba', when: () => TIME.flag('past', 'felixPage') === 'given',
    show: { now: () => makeFrame('now'), future: () => makeFrame('future') },
    act: { now: () => { const P = pageFramePos(); return { x: P.lx, z: P.lz, r: 1.4, label: 'Look', run: () => pageLook('now') }; }, future: () => { const P = pageFramePos(); return { x: P.lx, z: P.lz, r: 1.4, label: 'Look', run: () => pageLook('future') }; } } });
  TIME.effect('alba.rosaLetter', { region: 'alba', when: () => TIME.flag('past', 'letter') === 'posted', show: { now: () => makeEnvelope() } });
  TIME.spot('alba.theaterDoor', { region: 'alba', world: 'past', x: -13.5, z: -233.9, r: 1.4, label: () => (AP().key ? 'Go down under the stage' : 'Look'), when: () => ch4On(),
    run: () => (AP().key && typeof APSTAGE !== 'undefined' ? APSTAGE.enter('under') : doorLook()) });
  TIME.spot('alba.bakeryDoor', { region: 'alba', world: 'past', x: -17.1, z: -213.8, r: 1.2, label: 'Go in', when: () => ch4On(), run: () => APSTAGE.enter('bakery') });
  TIME.spot('alba.schoolDoor', { region: 'alba', world: 'past', x: -4.3, z: -205.3, r: 1.2, label: 'Go in', when: () => ch4On(), run: () => APSTAGE.enter('school') });

  // ------------------------------------------------------------ every frame (main.js, after TIME.late): Noa at the crack; the rooms'
  // own light over the Past's; the crack's flare
  function late(dt) {
    if (!G || !G.state) return;
    try { triggers(dt); } catch (e) { console.error('[alba past] triggers', e); }
    if (typeof APSTAGE !== 'undefined' && APSTAGE.inside) APSTAGE.look();
    if (FLARE) { const want = FLARE.userData.on ? 0.55 + 0.1 * Math.sin(G.w3d.time.value * 4) : 0; FLARE.material.opacity = damp(FLARE.material.opacity, want, 3, dt); FLARE.visible = FLARE.material.opacity > 0.01; }
  }

  // ------------------------------------------------------------ the journal: "Words of then"
  function wordsHTML() {
    const l = lang(), S = AP(), seen = S.words || {}, cj = isC(l) && typeof CJK !== 'undefined';
    const row = w => `<li${w.look && !seen[w.k] ? ' style="opacity:.5"' : ''}><b>${cj ? CJK.html(w[l] || '', { lang: l }) : esc(w[l] || '')}</b> <span class="en">${esc(w.en)}</span>${w.look && seen[w.k] ? ' ✓' : ''}</li>`;
    const looks = X.WORDS.filter(w => w.look), rest = X.WORDS.filter(w => !w.look);
    return `<div class="mt"><h4 class="ph-h">Words of then <small>${X.WORDS.length}</small></h4><p class="note">Alba, long ago: the things you can look at (✓ once you have), and the words the people of then use when they tell you about that night.</p>`
      + `<ul class="ch4-words" style="columns:2;font-size:14px">${looks.map(row).join('')}</ul><h4 class="ph-h" style="margin-top:10px">From the memories</h4><ul class="ch4-words" style="columns:2;font-size:14px">${rest.map(row).join('')}</ul></div>`;
  }
  function addTab() {
    if (typeof UI === 'undefined') return;
    UI.journalTabs = UI.journalTabs || [];
    if (UI.journalTabs.some(t => t.id === 'ap-words')) return;
    UI.journalTabs.push({ id: 'ap-words', label: () => (G && opened() ? 'Words of then' : null), html: () => wordsHTML(), wire() { /* */ } });
  }

  return { init, late, look, arrived, roomItems, roomTarget, talkItems, pastTalk, ask, card,
    _: { openingScene, reportScene, memScene, keyScene, memory, roomTask, promptScene, practice, bossScene, echoScene, felixPage, rositaLetter, mateoLetter, rosaLetter, claraRobes, julianMistakes, slate, elenaBread, pilarBread, tinaVoice, martaTalk,
      who, cemP, AP, askedN, reportDue, heardT, MEM, pageFramePos, rosaSpot, libDoor } };
})();

// ============================================================ Chapter 4's steps for Alba's Past (CH4.steps, its opening, Elio's echo,
// the story log), the side quests (QUESTS.LIST), the theater's key (LEX), and the test hooks (ALBA_PAST._.t)
(() => {
  if (typeof TIME === 'undefined' || !ALBA_PAST || typeof CH4 === 'undefined' || typeof QUESTS === 'undefined') return;
  const X = APTXT, AP0 = ALBA_PAST._;
  const G = () => TIME.API.G;
  const APs = s => (s && s.worlds && s.worlds.r && s.worlds.r.alba && s.worlds.r.alba.past) || {};
  const wf = (s, w, k) => (s && s.worlds && s.worlds.flags && s.worlds.flags[w] ? s.worlds.flags[w][k] : undefined);
  const seen = (s, k) => !!(s && s.worlds && s.worlds.seen && s.worlds.seen[k]);
  const got = s => !!(s && s.ch4 && s.ch4.echoes && s.ch4.echoes['alba.past']);
  const C = () => TIME.CRACKS;
  const at = (o, hint) => (o ? { x: o.x, z: o.z, hint } : null);
  const four = ['felix', 'clara', 'mateo', 'elena'];
  // where the compass points: someone of then (in the Past), else the nearest crack that leads there
  function nearCrack(ids) { const g = G(), Y = g && g.sim.you; if (!Y) return C()[ids[0]]; return ids.map(id => C()[id]).filter(Boolean).sort((a, b) => Math.hypot(a.x - Y.x, a.z - Y.z) - Math.hypot(b.x - Y.x, b.z - Y.z))[0]; }
  const via = (want, fn) => {
    const w = TIME.world();
    if (w === want) return fn();
    if (want === 'past') return w === 'future' ? at(C()['alba.pond'], '{mimo} looks at the time crack by the duck pond: the Past is through there.') : at(nearCrack(['alba.yard', 'alba.pond']), '{mimo} looks at a time crack: the Past is through there.');
    return at(nearCrack(['alba.yard', 'alba.pond']), '{mimo} looks at a time crack: today is through there.');
  };
  const person = (id, hint) => { const P = AP0.cemP(id); return P ? { x: P.api.x, z: P.api.z, hint } : { x: -10, z: -215, hint: '{mimo} points north: the Old Quarter.' }; };
  function askTarget() {
    const S = AP0.AP(), g = G(), Y = g.sim.you, left = four.filter(k => !(S.asked || {})[k]).map(k => person(k, '{mimo} points at someone of then who remembers that night.'));
    return left.sort((a, b) => Math.hypot(a.x - Y.x, a.z - Y.z) - Math.hypot(b.x - Y.x, b.z - Y.z))[0] || null;
  }
  const underTarget = () => (typeof APSTAGE !== 'undefined' && APSTAGE.inside ? APSTAGE.target() : { x: -13.5, z: -233.9, hint: '{mimo} points at the theater’s door.' });
  const STEPS = [
    { apKey: 'ask', text: 'In the Past: ask the people of then about the night of the concert ({n}/4)', n: s => four.filter(k => (APs(s).asked || {})[k]).length,
      why: 'Noa: «Ask the people of then about the night of the concert.» Step into the Past through a time crack (Bruno’s yard, or the duck pond). In the Old Quarter, north of the plaza, Félix the pianist, Clara the seamstress, Mateo the postman and Elena the baker all remember it.',
      done: s => four.every(k => (APs(s).asked || {})[k]), target: () => via('past', askTarget), hint: '{mimo} points north, toward the Old Quarter.' },
    { apKey: 'key', text: 'Get the theater’s key from Aurora, by the old theater',
      why: 'They all say it: after that night, Aurora locked the theater. She stands by its door, in the Old Quarter, long ago. Tell her what you know about that night.',
      done: s => !!APs(s).key, target: () => via('past', () => person('aurora', '{mimo} points at Aurora, by the theater’s door.')), hint: '{mimo} points at the old theater.' },
    { apKey: 'under', text: 'Under the stage: follow the memories of that night ({n}/4)', n: s => ['r0d', 'r1d', 'r2d', 'r3p'].filter(k => APs(s)[k]).length,
      why: 'Aurora’s key opens the old theater. Under its stage, each room keeps a memory of that night: first set the scene, how it was (the imperfect), then replay what happened (the preterite).',
      done: s => !!APs(s).r3p, target: () => via('past', underTarget), hint: '{mimo} points at the theater’s door.' },
    { apKey: 'boss', text: 'The prompter’s box: correct the Prompter’s lies',
      why: 'Something gray sits in the prompter’s box and whispers lies about that night. Say how it really was, in the past: «No, …». Every lie you correct cracks one of its masks.',
      done: s => !!APs(s).boss, target: () => via('past', underTarget), hint: '{mimo}’s ears go flat. Something whispers under the stage.' },
    { apKey: 'echo', text: 'Free Elio’s echo', why: 'The Prompter’s shell is open. A small warm light is left in it: an echo of Elio’s voice.',
      done: s => got(s), target: () => via('past', underTarget), hint: '{mimo} points at the warm light in the shell.' },
    { apKey: 'report', report: 'noa', text: '💬 Report to Noa at the duck pond’s time crack', why: 'Noa hears every crack. Tell her what you found under the stage: go to the duck pond’s crack, in any time.',
      done: s => !!APs(s).report, target: () => at(C()['alba.pond'], '{mimo} looks at the time crack by the duck pond.'), hint: '{mimo} looks toward the duck pond.' },
  ];
  CH4.steps('alba', 'past', STEPS);
  CH4.OPENING = { text: 'Chapter 4: Elio’s words. Listen at the duck pond’s time crack', why: 'The time cracks are open, and something whispers in the one by the duck pond, where all three times meet. Noa?',
    done: s => seen(s, 'ch4.open'), target: () => at(C()['alba.pond'], '{mimo}’s ears twitch toward the duck pond’s crack. A voice?'), hint: '{mimo}’s ears twitch toward the duck pond’s crack. A voice?' };
  const W = { es: X.ECHO.es, pt: X.ECHO.pt, de: X.ECHO.de, zh: X.ECHO.zh, ja: X.ECHO.ja, where: 'Alba, long ago' };
  Object.defineProperty(W, 'en', { get: () => { const g = G(), l = (g && g.state && g.state.lang) || 'es'; return X.ECHO.en[l] || X.ECHO.en.es; }, enumerable: true });
  CH4.word('alba', 'past', W);
  CH4.story('alba', [
    { when: s => seen(s, 'ch4.open'), text: 'Noa spoke through the duck pond’s time crack: when the theater laughed, Elio’s voice broke into echoes, scattered through every place’s yesterday and tomorrow. In Alba, one is under the old theater’s stage, long ago, and one is in tomorrow’s theater.' },
    { when: s => four.every(k => (APs(s).asked || {})[k]), text: 'The people of then remembered that night: Elio went up on the stage, scared, and said one word wrong, and the whole town laughed. He ran off into the night, and the next day he was gone. His dad is still looking for him.' },
    { when: s => !!APs(s).key, text: 'Aurora had locked the theater that night. She gave you its key: «If the whisper lies to you, tell it how it really was.»' },
    { when: s => got(s), text: 'Under the stage, the Prompter whispered lies about that night, and you told it how it really was. Its masks cracked, and Elio’s echo was free: the line he got wrong at the concert, said right.' },
    { when: s => !!APs(s).report, text: 'Noa heard it through the crack. The other echo is waiting in tomorrow’s theater.' },
  ]);

  // ------------------------------------------------------------ the side quests (they never take the main quest's place)
  const past = (want, fn) => () => via(want, fn);
  const add = q => { if (!QUESTS.LIST.some(x => x.id === q.id)) QUESTS.LIST.push(q); };
  add({ id: 'ap.page', kind: 'side', title: 'Félix’s lost page', giver: 'Félix, the theater’s pianist (Alba, long ago)', started: s => !!wf(s, 'past', 'felixPage'),
    steps: [
      { text: 'Under the stage, find Félix’s lost page', why: 'Félix lost the last page of his song the night of the concert. He thinks it stayed under the stage: the costume racks?', done: s => ['found', 'given'].includes(wf(s, 'past', 'felixPage')), target: past('past', underTarget), hint: '{mimo} sniffs: old paper, under the stage.' },
      { text: 'Give Félix his page: tell him where it was', why: 'Félix is by the theater. Tell him where his page was, as it was: «Estaba en el baúl».', done: s => wf(s, 'past', 'felixPage') === 'given', target: past('past', () => person('felix', '{mimo} points at Félix.')), hint: '{mimo} points at Félix, by the theater.' },
      { text: 'Today: look in the library’s window, on the north street', why: 'Félix framed his page and gave it to the library, about forty years ago. Step back to today and look.', done: s => !!wf(s, 'now', 'pageSeen'), target: () => via('now', () => { const P = AP0.pageFramePos(); return { x: P.lx, z: P.lz, hint: '{mimo} points at the library’s window.' }; }), hint: '{mimo} points toward the library.' },
    ] });
  add({ id: 'ap.letter', kind: 'side', title: 'Young Rosa’s letter', giver: 'young Rosa, by her apple stall (Alba, long ago)', started: s => !!wf(s, 'past', 'letter'),
    steps: [
      { text: 'Help young Rosa write to Elio', why: 'Elio is gone, and young Rosa wants to tell him she didn’t laugh. Give her one more kind thing about him, in the past.', done: s => ['written', 'posted'].includes(wf(s, 'past', 'letter')), target: past('past', () => { const P = typeof PAST !== 'undefined' && PAST._ && PAST._.W.people.rosita; return P ? { x: P.api.x, z: P.api.z, hint: '{mimo} points at young Rosa.' } : null; }), hint: '{mimo} points at the apple stall.' },
      { text: 'Take young Rosa’s letter to Mateo, the postman', why: 'Mateo carries every letter in the valley. He’s in the Old Quarter.', done: s => wf(s, 'past', 'letter') === 'posted', target: past('past', () => person('mateo', '{mimo} points at Mateo.')), hint: '{mimo} points at the postman.' },
      { text: 'Today: Doña Rosa has a visitor… forty years late', why: 'Nobody knew where Elio was, so the letter waited in a drawer. Step back to today and talk to Doña Rosa.', done: s => !!wf(s, 'now', 'letterRead'), target: () => via('now', () => { const n = G() && G().sim.npc('rosa'); return n ? { x: n.x, z: n.z, hint: '{mimo} points at Doña Rosa.' } : null; }), hint: '{mimo} points toward Doña Rosa.' },
    ] });
  add({ id: 'ap.robes', kind: 'side', title: 'The choir’s robes', giver: 'Clara, the seamstress (Alba, long ago)', started: s => !!wf(s, 'past', 'robes'),
    steps: [{ text: 'Tell Clara how the choir’s robes were ({n}/3)', n: s => Object.keys(APs(s).robes || {}).length, why: 'Clara lost her pattern. You saw the robes at the concert, and under the stage: tell her how they were (the imperfect: «eran», «tenían»).', done: s => wf(s, 'past', 'robes') === 'done', target: past('past', () => person('clara', '{mimo} points at Clara.')), hint: '{mimo} points at Clara, sewing.' }] });
  add({ id: 'ap.mistakes', kind: 'side', title: 'Brave mistakes', giver: 'Julián, the schoolteacher (Alba, long ago)', started: s => !!wf(s, 'past', 'mistakes'),
    steps: [
      { text: 'In the schoolroom, correct the pupils’ slates ({n}/3)', n: s => ['hugo', 'tomi', 'pili'].filter(k => (APs(s).slates || {})[k]).length, why: 'They wrote about yesterday, in the present. It already happened: write it in the past.', done: s => ['hugo', 'tomi', 'pili'].every(k => (APs(s).slates || {})[k]), target: past('past', () => (typeof APSTAGE !== 'undefined' && APSTAGE.inside ? null : { x: -4.3, z: -205.3, hint: '{mimo} points at the schoolroom’s door.' })), hint: '{mimo} points at the schoolroom.' },
      { text: 'Tell Julián the slates are done', why: 'Julián is by the schoolroom’s door.', done: s => wf(s, 'past', 'mistakes') === 'done', target: past('past', () => person('julian', '{mimo} points at Julián.')), hint: '{mimo} points at Julián.' },
    ] });
  add({ id: 'ap.bread', kind: 'side', title: 'Bread for Pilar', giver: 'Elena, the baker (Alba, long ago)', started: s => !!wf(s, 'past', 'bread'),
    steps: [{ text: 'Take Elena’s bread to Pilar, by the theater', why: 'Pilar rings the theater’s bell, or she did. Elena baked her a loaf this morning.', done: s => wf(s, 'past', 'bread') === 'done', target: past('past', () => person('pilar', '{mimo} points at Pilar.')), hint: '{mimo} sniffs the warm bread.' }] });

  // ------------------------------------------------------------ the theater's key (a key item) and its little picture
  if (typeof LEX !== 'undefined' && !LEX.item('k.theaterKey')) LEX.register([{ kind: 'key', id: 'k.theaterKey', es: 'llave del teatro', pt: 'chave do teatro', de: 'Theaterschlüssel', en: 'theater key', g: { es: 'f', pt: 'f', de: 'm' }, icon: 'ap_key', zh: '[剧院|jù yuàn] [的|de] [钥匙|yào shi]', ja: '[劇場|げきじょう] の [鍵|かぎ]' }]);
  if (typeof ICONS !== 'undefined' && ICONS.add) ICONS.add('ap_key', (c, p, h) => {
    h.shape(c, p, h.ell(-16, -14, 15, 15), '#c9a24a'); h.shape(c, p, h.rr(-6, -18, 44, 9, 3), '#c9a24a'); h.shape(c, p, h.rr(24, -10, 7, 14, 2), '#c9a24a'); h.shape(c, p, h.rr(34, -10, 6, 10, 2), '#c9a24a');
    if (p) { c.beginPath(); c.arc(-16, -14, 6, 0, TAU); c.fillStyle = '#fffaf0'; c.fill(); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke(); }
  });

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the test save slot)
  // setup(o): TIME_ALBA's setup (the save just after Chapter 3, the cracks open), my steps measured for real, and my progress at
  //   o.at: 'start' (Noa's scene to come) · 'open' · 'asked' · 'key' · 'r0' · 'r1' · 'r2' · 'r3' (the box, before the practice) ·
  //   'boss' (the practice done) · 'echo' (the boss won) · 'report' (the echo freed) · 'done'
  // near(id): stand by someone or something ('pond', 'yard', the people's ids, 'door', 'bakery', 'school', 'rosita', 'rosa', 'library')
  const ORIG = new Map(); for (const st of STEPS) ORIG.set(st, st.done); ORIG.set(CH4.OPENING, CH4.OPENING.done);
  const ATS = ['start', 'open', 'asked', 'key', 'r0', 'r1', 'r2', 'r3', 'boss', 'echo', 'report', 'done'];
  function setup(o = {}) {
    const w = TIME_ALBA._.t.setup(o.seen === false ? { seen: false } : {});
    for (const [st, d] of ORIG) { st.done = d; st._tt = true; }
    const main = QUESTS.LIST.find(q => q.id === 'main'), op = main && main.steps.find(x => x.ch4 === 'open');      // (chapter4.js copies the opening into the main quest)
    if (op) { op.done = ORIG.get(CH4.OPENING); op._tt = true; }
    const S = TIME.state('alba', 'past'), k = Math.max(0, ATS.indexOf(o.at || 'start')), g = G();
    for (const key of Object.keys(S)) delete S[key];
    TIME.seen('ch4.open', k >= 1);
    if (k >= 2) S.asked = { felix: 'S', clara: 'S', mateo: 'S', elena: 'S' };
    if (k >= 3) { S.key = 'S'; g.state.bag = g.state.bag || {}; g.state.bag['k.theaterKey'] = 1; }
    // ('r0': the key, the prop room still to see · 'r1': the prop room done, the costume racks to see · … · 'r3': the box to see)
    if (k >= 5) Object.assign(S, { r0m: true, r0s: 'S', r0d: 'S', roomSeen: { props: true }, cards: { under: true } });
    if (k >= 6) Object.assign(S, { r1m: true, r1s: 'S', r1d: 'S', roomSeen: { props: true, costumes: true } });
    if (k >= 7) Object.assign(S, { r2m: true, r2s: 'S', r2d: 'S', roomSeen: { props: true, costumes: true, lift: true } });
    if (k >= 8) Object.assign(S, { r3m: true, r3p: 'S', roomSeen: { props: true, costumes: true, lift: true, box: true }, cards: { under: true, fix: true } });
    if (k >= 9) S.boss = 'S';
    if (typeof CH4 !== 'undefined') { const st = CH4._.st(); delete st.echoes['alba.past']; if (k >= 10) st.echoes['alba.past'] = 'S'; }
    if (k >= 11) S.report = true;
    const F = TIME._.W().flags;
    if (o.flags !== false) for (const f of ['felixPage', 'letter', 'robes', 'mistakes', 'bread']) delete F.past[f];
    for (const f of ['pageSeen', 'letterRead']) delete F.now[f];
    if (typeof APSTAGE !== 'undefined') { APSTAGE._.FAST.on = o.fast !== false; if (APSTAGE._.built) APSTAGE.apply(); }
    TIME.refresh();
    return { world: w, at: ATS[k] };
  }
  function near(id) {
    const g = G(), Y = g.sim.you; let p = null, yaw;
    const c = C()[{ pond: 'alba.pond', yard: 'alba.yard', street: 'alba.street' }[id]];
    if (c) p = { x: c.x + 1.4, z: c.z + 1.4 };
    else if (id === 'door') p = { x: -13.5, z: -233.0 };
    else if (id === 'bakery') p = { x: -16.6, z: -213.8 };
    else if (id === 'school') p = { x: -4.9, z: -205.3 };
    else if (id === 'library') { const P = AP0.pageFramePos(); p = { x: P.lx, z: P.lz }; }
    else if (id === 'rosita') { const P = typeof PAST !== 'undefined' && PAST._ && PAST._.W.people.rosita; if (P) p = { x: P.api.x + 1.4, z: P.api.z + 1.0 }; }
    else if (id === 'rosa') { const n = g.sim.npc('rosa'); if (n) p = { x: n.x + 1.3, z: n.z + 1.0 }; }
    else { const P = AP0.cemP(id); if (P) { const a = P.api; p = { x: a.x + 1.2, z: a.z + 1.2 }; } }
    if (!p) return null;
    Y.x = p.x; Y.z = p.z; if (yaw !== undefined) Y.yaw = yaw; g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
    return p;
  }
  // every zh / ja string, the built ones too (Noa's line with the echo in it)
  function check() {
    const out = X.check();
    if (typeof CJK !== 'undefined' && CJK.validate) { const g = G(), l0 = g.state.lang; for (const l of ['zh', 'ja']) { g.state.lang = l; const T = AP0.heardT(); const p = CJK.validate(T[l], l); if (p.length) out.push(`noa heard (${l}): ${p.join('; ')}`); } g.state.lang = l0; }
    return out;
  }
  // a hidden tab's scene driver (tests): plays a scene on, pressing E through its lines and cards, typing the answers in turn into
  // the ask box; the toasts (the grades) are kept in t.toasts. → the lines it saw
  const toasts = [];
  if (typeof UI !== 'undefined' && UI.toast && !UI.toast._ap) { const t0 = UI.toast; UI.toast = function (m, ...a) { toasts.push(String(m)); if (toasts.length > 60) toasts.shift(); return t0.call(this, m, ...a); }; UI.toast._ap = true; }
  async function drive(answers = [], maxSec = 28) {
    const log = [], T0 = performance.now(); let ai = 0, idle = 0;
    while (performance.now() - T0 < maxSec * 1000) {
      await window.__g.go(0.25);
      const box = document.getElementById('command');
      if (box && !box.classList.contains('hidden')) {
        if (ai >= answers.length) { log.push('[box waiting] ' + document.getElementById('command-title').textContent.slice(0, 90)); break; }
        const a = answers[ai++]; log.push('> ' + a); document.getElementById('command-input').value = a; document.getElementById('command-form').requestSubmit(); idle = 0; continue;
      }
      const L = STORY.line; if (L) { const txt = (L.name || '') + ': ' + (L.text || (L.parts || []).map(p => p.s).join('')).slice(0, 120); if (log[log.length - 1] !== txt) log.push(txt); window.__g.press(); idle = 0; continue; }
      const card = document.getElementById('card');
      if (card && !card.classList.contains('hidden')) { const t = '[card] ' + card.textContent.replace(/\s+/g, ' ').slice(0, 90); if (log[log.length - 1] !== t) log.push(t); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true })); await new Promise(r => setTimeout(r, 30)); continue; }
      if (STORY.busy || (typeof APSTAGE !== 'undefined' && APSTAGE.busy)) { if (++idle % 6 === 0) window.__g.press(); continue; }
      log.done = true; break;
    }
    return log;
  }
  // (a scene, then the next one only when it has finished: the hidden tab's timers are slow)
  async function settle(maxSec = 25) { const T0 = performance.now(); while (performance.now() - T0 < maxSec * 1000) { const l = await drive([], 4); if (l.done) return true; } return false; }
  ALBA_PAST._.t = { setup, near, check, drive, settle, toasts, STEPS, ATS, grade: (key, text, l) => X.grade(X.TASKS[key] || (X.WHISPERS[key] || {}).task, text, l || G().state.lang) };
})();
