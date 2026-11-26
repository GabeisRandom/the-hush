'use strict';
// The Past's story, tasks and fights (past.js is the place; past_text.js the words). DESIGN.md 13.2, 17.2b; game/REGIONS.md.
// The main path (flags):
//   pastIn      the arrival: the eight bells at dawn, Noa's echo from inside the great clock («Aquí todo ya pasó»)
//   pastBell    the bell tower: the helper and the old bell ringer show the preterite («Subí… toqué» / «subió… tocó»);
//               the shy child missed it: tell who rang the bell («Nacho tocó la campana»)
//   pastApples  young Rosa drops her apples; in the Past Mimo only moves in memories: «Mimo saltó / nadó / empujó» (3)
//   pastEcho    the Hush's shadows came through the clock with you: the first time battle (battle/timebattle.js's G,
//               BATTLE._.tense: its 'Gp' lesson with Noa as the coach, then a real fight, realm 'past')
//   pastNames   the Festival of Voices: everyone says their name; the shy child whispers and the old bell ringer rings the bell
//               just for them (the B1 books' scene); Elio's turn; yours. Then tell Noa what happened («dijo», «tocó»)
//   pastElio    Elio at the duck pond, practicing his thank-you; how it was when he came («no conocía a nadie, tenía miedo»):
//               the imperfect, and you tell him how it was for you
//   pastScene   how it was: three memories for Noa (the plaza, the bell, the people), the imperfect (de: the Präteritum of a
//               story, zh: 以前…, ja: ～ていました); the sun goes down
//   (the gate)  at the north street the shadows come back: 'Gi', the scene in a memory («El rojo estaba dormido»), and a fight
//   pastBoss    eight o'clock, the concert in the theater: Elio says one word wrong, the whole town laughs, he runs, his red cap
//               left on the stage; the Hush is born: the boss, the Echo of the Laughter (a plug-in fight: masks you break with
//               memories, then the boy at its heart: you don't hit him, you say how he was: «Elio tenía miedo»)
//   pastReport  report to young Rosa outside: what happened (preterite) and how he was (imperfect; zh: 没)
//   pastDone    the Future's door: FUTURE.enter() (future.js), else a "coming soon" card
// State: state.past (past.js) { apples: {}, scene: {}, grades: {}, bellSeen, applesSeen, namesSeen, elioSeen, gate }.
const PAST_SC = (() => {
  let A = null;
  const G = () => A.G;
  const l = () => A.lang();
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const P = id => A.W.people[id];
  const N = () => A.W.noa;
  const st = () => A.S();
  const fl = () => A.F();
  const snd = (...a) => A.snd(...a);
  const cast = id => PTXT.pick(PTXT.CAST[id], l());
  const TBf = () => (typeof BATTLE !== 'undefined' && BATTLE._ && BATTLE._.tense) || null;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cam = (pos, look, dur = 0.9) => { G().cam.override = { pos: A.V(...pos), look: A.V(...look), dur }; };
  const camOff = () => { G().cam.override = null; };
  const lock = on => { G().sim.lock = on ? 1 : 0; };
  const mimoName = () => G().state.mimoName || 'Mimo';
  let W_song = null;           // (a scene's own song: the festival's, while the names and the concert play)

  // ------------------------------------------------------------ saying things
  // who says it: a person of then (named in the language), or Noa's echo (she shows while she speaks)
  function who(id) {
    if (id === 'noa') { const n = N(); if (!n) return null; n.on = true; n.api.name = cast('noa'); return n.api; }
    const p = P(id); if (!p) return null; if (PTXT.CAST[id]) p.api.name = cast(id); return p.api;
  }
  const tab = key => { const T = PTXT.LINES[key]; return T ? Object.assign({}, T, { en: PTXT.en(T, l()) }) : null; };
  // a demonstration (whole in the language, the shown words glossed: STORY.demoLine), or the weave's mix (STORY.sayInline)
  function demo(id, key) { const p = who(id), T = tab(key); if (!p || !T) return Promise.resolve(); if (!T[l()]) return say(id, key); return STORY.demoLine(p, T, PTXT.MARKS[key]); }
  function say(id, key) { const p = who(id), T = tab(key); if (!p || !T) return Promise.resolve(); p.lines = { en: T.en, [l()]: T[l()] || '' }; return STORY.sayInline(p); }
  const you = s => STORY.you(PTXT.fill(s, l()));
  const think = (s, d) => STORY.think(PTXT.fill(s, l()), d);
  // a title for the ask box: English, the slots plain ({w.bell} → bell, {mimo} → the name)
  const plainEn = s => PTXT.fill(String(s || ''), l()).replace(/\{mimo\}/g, mimoName()).replace(/\{(w\.[a-z_]+)(:pl)?\}/g, (m, id, pl) => { const it = typeof LEX !== 'undefined' && LEX.item(id); const w = (it && it.en) || id.slice(2); return pl ? w + 's' : w; });
  const plainT = s => (A.isC() && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: l() }) : String(s || '').replace(/\{mimo\}/g, mimoName()));

  // ------------------------------------------------------------ a little screen work: the memory's flash, words floating up, laughter
  function memFlash() {
    let el = document.getElementById('past-mem');
    if (!el) { el = document.createElement('div'); el.id = 'past-mem'; el.style.cssText = 'position:fixed;inset:0;z-index:7;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center, rgba(255,226,170,0.15) 25%, rgba(170,110,40,0.5) 100%);transition:opacity .22s'; document.body.appendChild(el); }
    el.style.opacity = '1'; setTimeout(() => { el.style.opacity = '0'; }, 520); snd('tick');
  }
  function css() {
    if (document.getElementById('past-css')) return;
    const s = document.createElement('style'); s.id = 'past-css';
    s.textContent = `.past-float { position: fixed; z-index: 8; pointer-events: none; transform: translate(-50%, -50%); font: 800 20px Bahnschrift, "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif; color: #fffaf0;
  text-shadow: 0 2px 0 #2b2235, 0 0 6px rgba(43,34,53,.7); white-space: nowrap; transition: transform 1.6s ease-out, opacity 1.6s ease-in; }
.past-float.small { font-size: 15px; } .past-float.gray { color: #d6d2e2; }
.card.past-card .ex { display: grid; grid-template-columns: auto auto; gap: 4px 14px; justify-content: center; margin: 10px 0 6px; font-size: 18px; }
.card.past-card .ex b { color: #b05a1e; } .card.past-card .note { max-width: 420px; margin: 6px auto 0; font-size: 14px; line-height: 1.45; }
.card.past-card .tag { color: #b05a1e; } .card.past-page { background: #f6ead0; } .card.past-page .mem { font: italic 600 19px Georgia, "Yu Mincho", serif; margin: 8px 0; color: #4a3424; }`;
    document.head.appendChild(s);
  }
  function screenOf(x, y, z) { const v = A.V(x, y, z).project(G().w3d.camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, on: v.z < 1 }; }
  function floatText(text, x, y, z, o = {}) {
    css();
    const p = screenOf(x, y, z); if (!p.on) return;
    const el = document.createElement('div'); el.className = 'past-float' + (o.small ? ' small' : '') + (o.gray ? ' gray' : '');
    el.innerHTML = A.isC() && typeof CJK !== 'undefined' ? CJK.html(text, { lang: l() }) : esc(text);
    el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = `translate(-50%, -${150 + Math.random() * 80}%) rotate(${(Math.random() - 0.5) * 14}deg)`; el.style.opacity = '0'; });
    setTimeout(() => el.remove(), 1700);
  }
  // laughter (a few voices of "ha-ha-ha", formant-filtered) and applause, made on the spot (audio.js has neither)
  function laughSfx(n = 1, pitch = 1) {
    const ac = Sound.ctx, out = Sound.out; if (!ac || !out || !Sound.music) return;
    for (let v = 0; v < n; v++) {
      const t0 = ac.currentTime + v * 0.09 + Math.random() * 0.35, f0 = (170 + Math.random() * 170) * pitch, syl = 4 + ((Math.random() * 3) | 0);
      for (let i = 0; i < syl; i++) {
        const t = t0 + i * (0.12 + Math.random() * 0.03), o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * (1.18 - i * 0.05), t); o.frequency.exponentialRampToValueAtTime(f0 * (0.96 - i * 0.05), t + 0.09);
        bp.type = 'bandpass'; bp.frequency.value = 800 + Math.random() * 400; bp.Q.value = 2.6;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.014); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
        o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.13);
      }
    }
  }
  let NOISE = null;
  function clapSfx(n = 30, sec = 2) {
    const ac = Sound.ctx, out = Sound.out; if (!ac || !out || !Sound.music) return;
    if (!NOISE) { NOISE = ac.createBuffer(1, ac.sampleRate * 0.2, ac.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.02)); }
    for (let i = 0; i < n; i++) {
      const t = ac.currentTime + Math.random() * sec, s = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = NOISE; bp.type = 'bandpass'; bp.frequency.value = 1100 + Math.random() * 900; bp.Q.value = 1.2; g.gain.value = 0.06 + Math.random() * 0.05;
      s.connect(bp); bp.connect(g); g.connect(out); s.start(t);
    }
  }

  // ------------------------------------------------------------ the pattern cards (a grammar point, as a move you unlock)
  const EN_PAST = { 'v.jump': 'jump → jumped', 'v.swim': 'swim → swam', 'v.push': 'push → pushed', 'v.hit': 'hit → hit', 'v.throw': 'throw → threw', 'v.eat': 'eat → ate', 'v.sing': 'sing → sang',
    'v.climb': 'climb → climbed', 'v.blow': 'blow → blew', 'v.call': 'call → called', 'v.dig': 'dig → dug', 'v.light': 'light up → lit up' };
  async function card(id) {
    css();
    const C = PTXT.CARDS[id], lg = l(), c = C && C[lg]; if (!c) return;
    const ex = (c.ex || []).map(([w, e]) => `<b>${A.isC() && typeof CJK !== 'undefined' ? CJK.html(w, { lang: lg, ruby: 'always' }) : esc(w)}</b><span>${esc(e)}</span>`).join('');
    let list = '';
    if (id === 'memory') {     // Mimo's own verbs, the way it knows them now → told as a memory
      const rows = Object.keys(PTXT.PV).filter(v => typeof LEX !== 'undefined' && LEX.item(v) && LEX.taught(v)).slice(0, 8)
        .map(v => `<b>${A.isC() && typeof CJK !== 'undefined' ? CJK.html(LEX.src(v), { lang: lg }) : esc(LEX.form(v))} → ${A.isC() && typeof CJK !== 'undefined' ? CJK.html(PTXT.pvShow(v, lg), { lang: lg }) : esc(PTXT.pvShow(v, lg))}</b><span>${esc(EN_PAST[v] || '')}</span>`);
      list = rows.join('');
    }
    await UI.card(`<div class="tag">${esc(plainEn(C.tag))}</div>${ex || list ? `<div class="ex">${ex}${list}</div>` : ''}<div class="note">${esc(plainEn(c.note))}</div><div class="sub">E</div>`, { kind: 'past-card' });
  }

  // ------------------------------------------------------------ grading what you type (TASKS: want / alt / other / pres / more)
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const fold = (s, lg) => { let t = nrm(s); if (lg === 'de') t = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'); return t; };
  const words = (s, lg) => ' ' + fold(s, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  function has(text, item, lg) {
    if (Array.isArray(item)) return item.every(x => has(text, x, lg));
    if (lg === 'zh' || lg === 'ja') return typeof CJK !== 'undefined' && !!CJK.contains(text, item, lg);
    return words(text, lg).includes(' ' + fold(item, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ');
  }
  // the item typed with its accents (es / pt / de)
  const accented = (text, item, lg) => { if (lg === 'zh' || lg === 'ja' || Array.isArray(item)) return true; const t = ' ' + String(text).toLowerCase().replace(/[¡!¿?.,;:«»"“”()]/g, ' ').replace(/\s+/g, ' ') + ' '; return t.includes(' ' + String(item).toLowerCase() + ' '); };
  const firstOf = (list, text, lg) => ((list && list[lg]) || []).find(x => has(text, x, lg));
  const showForm = x => (Array.isArray(x) ? x.join(' … ') : x);
  function grade(T, text, lg, tries) {
    const model = plainT((T.model || {})[lg] || '').replace(/\s*[.。]\s*$/, ''), tip = k => String(((PTXT.TIP[k] || {})[lg]) || '').replace('{form}', model);
    // (P6a, accents.js: an accent missing costs nothing, a tip shows it; unless what you typed is another form the task tells
    // apart, «salto» for «saltó»: then the A stays, and why says why)
    const w = firstOf(T.want, text, lg);
    if (w) {
      const more = !(T.more && T.more[lg] && T.more[lg].length) || T.more[lg].some(x => has(text, x, lg));
      const others = ['alt', 'other', 'pres'].flatMap(k => ((T[k] || {})[lg] || []).flat());
      const ac = typeof ACCENTS !== 'undefined' ? ACCENTS.judge(text, w, lg, { others }) : { keep: !accented(text, w, lg), why: `Accent: «${plainT(showForm(w))}»`, tip: '' };
      const g = Math.min(3, (!ac.keep && more ? 0 : 1) + Math.min(2, tries));
      return { ok: true, letter: 'SABC'[g], why: ac.keep ? ac.why : !more ? `Right! The whole sentence for an S: «${model}»` : tries ? 'Right, on another try' : 'Just right!', tip: ac.tip || '' };
    }
    const a = firstOf(T.alt, text, lg); if (a) return { ok: true, letter: tries ? 'B' : 'A', why: tip('alt') || 'Right!' };
    const o = firstOf(T.other, text, lg); if (o) return { ok: true, letter: 'B', why: tip('other') || `«${model}»` };
    const p = firstOf(T.pres, text, lg); if (p) return { ok: false, kind: 'pres', why: (T.tips && T.tips[lg]) || tip('pres') };
    return { ok: false, kind: 'none' };
  }
  // one task, asked until it's said (or you close the box): the frame and the chips on the box, the model on «?»
  async function ask(id, o = {}) {
    const T = PTXT.TASKS[id], lg = l(); if (!T) return null;
    const frame = plainT((T.frame || {})[lg] || ''), chips = ((T.chips || {})[lg] || []).map(([w, e]) => `${plainT(w)} (${e})`).join(' · ');
    const modelRaw = String((T.model || {})[lg] || '').replace(/\{mimo\}/g, mimoName()), model = plainT(modelRaw);
    let tries = 0;
    for (;;) {
      const r = await UI.command({ name: mimoName(), icon: o.icon || 'star', title: plainEn(T.title), verbs: [], model: modelRaw, modelEn: PTXT.en(T.model, lg), placeholder: `«${frame}»`,
        hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}. Stuck? ? shows the whole sentence.` });
      if (!r || r.cancelled) return null;
      const h = document.getElementById('command-hint'), peeked = !!(h && /^Try/.test(h.textContent || ''));
      const g = grade(T, r.text, lg, peeked ? 2 : tries);
      if (g.ok) { (st().grades || (st().grades = {}))[id] = g.letter; UI.toast(`${g.letter} · ${g.why}${g.tip ? ' · ' + g.tip : ''}`); snd(g.letter === 'S' ? 'chest' : 'review'); g.text = r.text; return g; }
      tries++; snd('wrong');
      if (o.onMiss) { try { await o.onMiss(g, tries); } catch (e) { /* */ } }
      think(g.kind === 'pres' ? g.why : tries >= 2 ? `Like this: «${model}»` : `Not quite… «${frame}»${chips ? ' · ' + chips : ''}`, 6.5);
    }
  }
  // Mimo, told as a memory: { ok, verb (the id it heard), tense ('past' | 'pres' | 'impf'), named (Mimo said) }
  // (P6a: an accent missing costs nothing, acc stays true with a tip; only another form as typed, «salto» for «saltó», is acc: false)
  const accOf = (text, f, lg) => { if (typeof ACCENTS === 'undefined') return { acc: accented(text, f, lg) }; const j = ACCENTS.judge(text, f, lg); return { acc: !j.keep, why: j.why, tip: j.tip }; };
  function readMemory(text, lg) {
    const named = has(text, lg === 'zh' ? '[米莫|Mǐ mò]' : lg === 'ja' ? 'ミモ' : 'mimo', lg) || words(text, lg).includes(' ' + fold(mimoName(), lg) + ' ');
    for (const [id, P0] of Object.entries(PTXT.PV)) {
      for (const f of P0[lg] || []) if (has(text, f, lg)) return Object.assign({ verb: id, tense: 'past', named, form: f }, accOf(text, f, lg));
      if (lg === 'de') for (const f of P0.de2 || []) if (has(text, f, lg)) return Object.assign({ verb: id, tense: 'past', named, form: f, prat: true }, accOf(text, f, lg));
    }
    const TB = TBf();
    if (TB && TB.read) { try { const r = TB.read(text, lg); if (r && r.verb) return { verb: 'v.' + r.verb, tense: r.tense === 'pret' || r.tense === 'perf' ? 'past' : r.tense || 'pres', named }; } catch (e) { /* */ } }
    if (typeof LEX !== 'undefined') for (const id of Object.keys(PTXT.PV)) if (LEX.item(id) && LEX.heard(id, text)) return { verb: id, tense: 'pres', named };
    return { verb: null, tense: null, named };
  }

  // ------------------------------------------------------------ where everyone is, as the day goes on
  const at = (P0, x, z, yaw) => { if (P0) { A.place(P0, x, z, yaw); A.show(P0, true); } };
  // after Chapter 2 (flags.pastDone) the Past is a world you come back to through the time cracks (time.js): an ordinary day of
  // then, the town getting ready for its festival, by daylight. Elio isn't here (Chapter 4 is his story); time_alba.js moves
  // the people its cross-time puzzles need.
  const free = () => !!fl().pastDone;
  function freeStage() {
    const W = A.W, Ro = P('rosita');
    at(P('ringer'), A.SP.ringer.x, A.SP.ringer.z, 0); at(P('helper'), A.SP.helper.x, A.SP.helper.z, 0.25); at(P('shy'), A.SP.shy.x, A.SP.shy.z, -2.6);
    at(Ro, A.SP.rosita.x, A.SP.rosita.z, 2.4); if (Ro && Ro.lantern) Ro.lantern.visible = false;
    A.show(P('elio'), false);
    for (const P0 of Object.values(W.people)) { if (/^(crowd|band|dancer)/.test(P0.id)) A.show(P0, true); if (/^(aud|choir|aurora|felix)/.test(P0.id)) A.show(P0, false); }
    if (W.apples) W.apples.forEach(a => { a.g.visible = false; });
    if (W.door) W.door.g.visible = false;
  }
  function stage() {
    if (!A || !A.W.root) return;
    if (free()) { freeStage(); return; }
    const f = fl(), s = st(), W = A.W;
    const R = P('ringer'), H = P('helper'), Y = P('shy'), Ro = P('rosita'), E = P('elio'), night = !!f.pastScene;
    // the bell ringer and his helper: at the tower, then in the plaza for the names; at night, at the concert
    if (!f.pastBell) { at(R, A.SP.ringer.x, A.SP.ringer.z, 0); at(H, A.SP.helper.x, A.SP.helper.z, 0.25); }
    else { at(R, -11.6, -141.8, 2.9); at(H, -9.6, -141.4, -2.9); }
    if (night) { A.show(R, false); A.show(H, false); }
    // the shy child: out of sight until the bell scene, then near the ringer (in the plaza once the bell's told)
    if (!s.bellSeen) A.show(Y, false); else if (!f.pastBell) at(Y, A.SP.shy.x, A.SP.shy.z, -2.6); else at(Y, -12.8, -140.6, 2.7);
    if (night) A.show(Y, false);
    // young Rosa at her family's apple stall; after the concert, outside the theater with a lantern
    if (!f.pastBoss) at(Ro, A.SP.rosita.x, A.SP.rosita.z, 2.4); else if (!f.pastReport) at(Ro, A.SP.report.x, A.SP.report.z, -0.5); else A.show(Ro, false);
    if (night && !f.pastBoss) A.show(Ro, false);
    if (Ro && Ro.lantern) Ro.lantern.visible = !!f.pastBoss && !f.pastReport;
    // Elio by the pond all day; at night he's at the theater (and after, gone)
    if (!night) at(E, A.SP.elio.x, A.SP.elio.z, Math.atan2(A.SP.pond.x - A.SP.elio.x, A.SP.pond.z - A.SP.elio.z)); else A.show(E, false);
    // the crowd, the band and the dancers: in the plaza until the evening (then they're at the theater)
    for (const P0 of Object.values(W.people)) if (/^(crowd|band|dancer)/.test(P0.id)) A.show(P0, !night || (!!f.pastReport && /^crowd[0-4]$/.test(P0.id)));
    // the apples still to find, Rosa's cart
    if (W.apples) W.apples.forEach((a, i) => { a.g.visible = !!s.applesSeen && !(s.apples || {})[A.SP.apples[i].id] && !f.pastApples; });
    if (W.door) W.door.g.visible = !!f.pastReport;
  }

  // ------------------------------------------------------------ the props: Rosa's apples and cart, the Future's door
  function build() {
    const W = A.W, K = A.KG;
    // three apples (on the stall's awning, floating in the fountain, under the cart) and the little handcart
    W.apples = A.SP.apples.map(a => {
      const g = new THREE.Group(), k = A.Kit();
      k.add(K.sphere, 0, 0.13, 0, 0.14, 0.13, 0.14, '#d8402f', { ink: 0.01 }).add(K.cyl6, 0, 0.29, 0, 0.012, 0.08, 0.012, '#5a3a24', { ink: 0 }).add(K.sphere, 0.05, 0.3, 0, 0.06, 0.02, 0.035, '#5fae4f', { ink: 0.004, rz: 0.4 });
      k.build(g, { shadow: false }); const gl = A.glow('#ffd36a', 0.9, 0.35); gl.position.y = 0.15; g.add(gl);
      g.position.set(a.x, a.y + (a.id === 'cart' ? 0 : A.gy(a.x, a.z) - 0.25), a.z); g.visible = false; W.root.add(g);
      return { g, gl, home: g.position.clone() };
    });
    const c = A.SP.cart, cg = new THREE.Group(), ck = A.Kit();
    ck.box(0, 0.55, 0, 1.1, 0.08, 0.7, '#a8784e').box(0, 0.7, 0.36, 1.1, 0.26, 0.05, '#8a5f3e').box(0, 0.7, -0.36, 1.1, 0.26, 0.05, '#8a5f3e').box(0.56, 0.7, 0, 0.05, 0.26, 0.72, '#8a5f3e');
    for (const s of [-1, 1]) ck.add(K.torus, -0.2, 0.3, s * 0.42, 0.28, 0.28, 0.28, '#5a3a24', { ry: 0, ink: 0.01 });
    ck.rod([-0.55, 0.62, 0.3], [-1.3, 0.5, 0.3], 0.03, '#8a5f3e').rod([-0.55, 0.62, -0.3], [-1.3, 0.5, -0.3], 0.03, '#8a5f3e');
    for (let i = 0; i < 6; i++) ck.add(K.sphere, -0.3 + (i % 3) * 0.28, 0.72, (i > 2 ? 0.14 : -0.14), 0.12, 0.11, 0.12, '#d8402f', { ink: 0.008 });
    ck.build(cg); cg.position.set(c.x, A.gy(c.x, c.z), c.z); cg.rotation.y = 0.5; W.root.add(cg); W.cart = { g: cg, home: cg.position.clone() };
    W.solids.push(W.cartSolid = { x: c.x, z: c.z, r: 0.7 });
    // young Rosa's lantern (after the concert, outside the theater)
    const Ro = A.W.people.rosita; if (Ro) { const lg = A.glow('#ffcf6a', 1.6, 0.8); lg.position.set(0.35, 0.55, 0.3); Ro.g.add(lg); Ro.lantern = lg; lg.visible = false; }
    // the Future's door, in the theater's forecourt: a frame of old stone, and in it a cold blue tear whose clock runs forward
    const D = { x: -6.6, z: -228.6 }, dg = new THREE.Group(), dk = A.Kit(), dy = A.gy(D.x, D.z);
    for (const s of [-1, 1]) dk.box(s * 1.05, 1.5, 0, 0.42, 3.0, 0.42, '#b9b2c8', { ink: 0.014 });
    dk.box(0, 3.15, 0, 2.6, 0.4, 0.5, '#a39cb4', { ink: 0.014 }).add(K.cyl, 0, 3.55, 0, 0.42, 0.12, 0.42, '#8fa8d8', { rx: Math.PI / 2, ink: 0.01 });
    dk.build(dg);
    const sw = TK.canvasTex(128, 128, (cx, w, h) => {
      const gr = cx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(235,245,255,1)'); gr.addColorStop(0.35, 'rgba(140,180,255,0.9)'); gr.addColorStop(0.75, 'rgba(70,80,170,0.55)'); gr.addColorStop(1, 'rgba(20,20,60,0)');
      cx.fillStyle = gr; cx.fillRect(0, 0, w, h); cx.strokeStyle = 'rgba(255,255,255,0.8)'; cx.lineWidth = 2;
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; cx.beginPath(); cx.moveTo(w / 2 + Math.sin(a) * 36, h / 2 - Math.cos(a) * 36); cx.lineTo(w / 2 + Math.sin(a) * 44, h / 2 - Math.cos(a) * 44); cx.stroke(); }
      cx.lineWidth = 3; cx.beginPath(); cx.moveTo(w / 2, h / 2); cx.lineTo(w / 2, h / 2 - 30); cx.stroke(); cx.beginPath(); cx.moveTo(w / 2, h / 2); cx.lineTo(w / 2 + 20, h / 2); cx.stroke();
    });
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.7), new THREE.MeshBasicMaterial({ map: sw, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    sm.position.set(0, 1.5, 0); dg.add(sm);
    const dgl = A.glow('#9fc0ff', 4.2, 0.55); dgl.position.set(0, 1.6, 0.2); dg.add(dgl);
    dg.position.set(D.x, dy, D.z); dg.rotation.y = -Math.PI / 2; dg.visible = false; W.root.add(dg);
    W.door = { g: dg, swirl: sm, gl: dgl, at: { x: D.x - 1.4, z: D.z } };
  }

  // ------------------------------------------------------------ the arrival: the eight bells at dawn, Noa's echo
  async function arrival() {
    lock(true);
    const Yu = G().sim.you, n = N(), bt = (typeof TOWN !== 'undefined' && TOWN.landmarks.bellTower) || { x: -26, z: -166 };
    if (n) { n.on = false; n.hold = { x: Yu.x + 1.5, z: Yu.z - 1.6 }; }
    stage();
    cam([Yu.x + 3.2, A.gy(Yu.x, Yu.z) + 2.6, Yu.z + 6.8], [bt.x, A.gy(bt.x, bt.z) + 9.6, bt.z], 1.3);
    await wait(1.2);
    // Alba's bell first, then the valley's seven answering from far away, one by one
    for (let i = 0; i < 8; i++) { snd(i ? 'bell' : 'bigbell'); if (!i) G().w3d.fx.sparkle(bt.x, A.gy(bt.x, bt.z) + 10.4, bt.z + 0.6, 22, ['#ffd166', '#fff3a0']); await wait(i ? 0.42 : 1.2); }
    await you('All eight {w.bell:pl}, ringing at dawn… And Alba… everything is golden.');
    if (n) n.on = true; snd('chime');
    cam([Yu.x - 2.2, A.gy(Yu.x, Yu.z) + 2.0, Yu.z + 4.6], [Yu.x + 1.5, A.gy(Yu.x, Yu.z) + 1.3, Yu.z - 1.6], 1.0);
    await say('noa', 'pa.noa.hear');
    await you('Noa! Is that really you?');
    await say('noa', 'pa.noa.alba');
    await say('noa', 'pa.noa.rule');
    await say('noa', 'pa.noa.him');
    await you('The hooded figure… lived here? As a kid?');
    camOff(); if (n) n.hold = null;
    fl().pastIn = true; lock(false);
    await UI.chapter('The Past', `Chapter 2 · «${PTXT.pick(PTXT.NAMES.past, l())}»`);
    G().save();
    await bellScene();
  }

  // ------------------------------------------------------------ the bell tower: «subí… toqué» / «subió… tocó»
  async function bellScene() {
    if (st().bellSeen) return;
    lock(true); st().bellSeen = true;
    const H = P('helper'), R = P('ringer'), Y = P('shy'), bt = (typeof TOWN !== 'undefined' && TOWN.landmarks.bellTower) || { x: -26, z: -166 };
    cam([-21.4, A.gy(-21.4, -155) + 2.4, -155.2], [-26, A.gy(-26, -163) + 1.4, -163.2], 1.0);
    // the helper bursts out of the tower's door, counting the last steps
    A.place(H, bt.x, bt.z + 2.15, 0); A.show(H, true);
    await tween(0.9, k => { A.place(H, lerp(bt.x, A.SP.helper.x, k), lerp(bt.z + 2.15, A.SP.helper.z, k), 0); });
    await demo('helper', 'pa.help.demo');
    await demo('ringer', 'pa.ring.demo');
    await demo('ringer', 'pa.ring.polish');
    await card('told');
    // the shy child runs up, too late
    A.place(Y, -20.4, -151.6, -2.4); A.show(Y, true);
    await tween(1.0, k => A.place(Y, lerp(-20.4, A.SP.shy.x, k), lerp(-151.6, A.SP.shy.z, k), -2.6));
    await say('shy', 'pa.shy.ask');
    camOff(); lock(false);
    await bellTask();
  }
  async function bellTask() {
    const g = await ask('bell', { icon: 'bell', onMiss: async (g0) => { if (g0.kind === 'pres') { G().sim.mimo.tiltT = 1.4; } } });
    if (!g) { think('{shy} is still waiting to hear who rang the {w.bell}.', 4.5); return; }
    await say('shy', 'pa.shy.thanks');
    await say('ringer', 'pa.ring.fest');
    fl().pastBell = true; G().save();
    think('Young Rosa’s apple stall is in the plaza. Something’s happening there…', 5);
  }

  // ------------------------------------------------------------ the apples: Mimo, in memories («Mimo saltó / nadó / empujó»)
  async function applesIntro() {
    lock(true); st().applesSeen = true;
    const Ro = P('rosita'), W = A.W;
    cam([-13.2, A.gy(-13, -136) + 2.2, -136.4], [-17.6, A.gy(-17.6, -132) + 1.0, -132.2], 0.9);
    // she trips: the apples fly off to the awning, the fountain, under the cart
    snd('land', 6); if (Ro) Ro.hop = 1;
    W.apples.forEach((a, i) => { a.g.visible = true; const p0 = A.V(Ro ? Ro.api.x : -17, A.gy(-17, -133) + 0.8, Ro ? Ro.api.z : -133), p1 = a.home.clone(); tween(0.7 + i * 0.15, k => { a.g.position.lerpVectors(p0, p1, k); a.g.position.y += Math.sin(k * Math.PI) * 1.4; }); });
    await wait(1.1); if (Ro) Ro.hop = 0;
    await demo('rosita', 'pa.rosa.fall');
    await demo('noa', 'pa.noa.memory');
    await card('memory');
    camOff(); lock(false);
    think('Three {w.apple:pl}: on the stall’s awning, in the fountain, under the cart. Tell {mimo} as a memory.', 6);
  }
  const APPLE_EN = { 'v.jump': 'jumped', 'v.swim': 'swam', 'v.push': 'pushed (the cart)' };
  const APPLE_TITLE = ['An {w.apple} landed on the stall’s awning, up high. Tell {mimo} what it did, as a memory.', 'An {w.apple} is floating in the fountain. Tell {mimo} what it did, as a memory.', 'An {w.apple} rolled under the cart. Tell {mimo} what it did, as a memory.'];
  async function appleTask(i) {
    const a = A.SP.apples[i], lg = l(), want = a.verb, past = PTXT.pvShow(want, lg), name = mimoName();
    const subj = lg === 'pt' ? 'O ' + name : lg === 'zh' ? '[米莫|Mǐ mò]' : lg === 'ja' ? 'ミモ が' : name;
    const frame = plainT(lg === 'de' ? `${subj} ___` : `${subj} ___`), chip = plainT(past);
    const model = plainT(lg === 'de' ? `${subj} ${past}.` : lg === 'zh' || lg === 'ja' ? `${subj} ${past} 。` : `${subj} ${past}.`);
    let tries = 0;
    for (;;) {
      const r = await UI.command({ name, icon: (want || '').slice(2), title: plainEn(APPLE_TITLE[i]), verbs: [], model: lg === 'zh' || lg === 'ja' ? `${subj} ${past} 。` : model, modelEn: `${name} ${APPLE_EN[want]}.`, placeholder: `«${frame}»`,
        hint: `«${frame}» · ___ = ${chip} (${APPLE_EN[want]}). In the Past, ${name} only moves in memories.` });
      if (!r || r.cancelled) return;
      const h = document.getElementById('command-hint'), peeked = !!(h && /^Try/.test(h.textContent || ''));
      const m = readMemory(r.text, lg);
      if (m.verb === want && m.tense === 'past') {
        const letter = 'SABC'[Math.min(3, (m.named && m.acc !== false && !m.prat ? 0 : 1) + Math.min(2, peeked ? 2 : tries))];
        UI.toast(`${letter} · ${!m.named ? `Say who did it: «${model}»` : m.acc === false ? (m.why || `Accent: «${chip}»`) : m.prat ? 'Right! In speech: «' + chip + '»' : 'A memory, told just right!'}${m.tip ? ' · ' + m.tip : ''}`);
        if (typeof LEX !== 'undefined' && LEX.item(want)) LEX.attempt(want, { ok: true, hints: 0, ms: r.ms || 3000, mode: 'command' });
        (st().grades || (st().grades = {}))['apple' + i] = letter;
        await appleDone(i);
        return;
      }
      tries++;
      if (m.verb === want && m.tense !== 'past') { memFlash(); G().sim.mimo.tiltT = 1.6; G().sim.mimoSay('…?', 1.4); snd('wrong'); think(`{mimo} flickers like an old film… «${plainT(r.text).slice(0, 24)}» is now. Here it’s a memory: «${model}»`, 6.5); continue; }
      if (m.verb && m.tense === 'past') { memFlash(); snd('pip'); think(`{mimo} did that, in the memory… but the {w.apple} is still there. «${frame}» (${chip})`, 6); continue; }
      snd('wrong'); G().sim.mimo.tiltT = 1.4; think(tries >= 2 ? `Like this: «${model}»` : `Tell it like Noa did: «${frame}» · ${chip}`, 6);
    }
  }
  async function appleDone(i) {
    const W = A.W, a = W.apples[i], sp = A.SP.apples[i], sim = G().sim, M = sim.mimo;
    lock(true); memFlash();
    if (i === 0) { sim.mimoGo({ x: sp.at.x + 0.4, z: sp.at.z - 1.6 }, sp); await wait(0.7); M.hop = { t: 0 }; snd('jump'); await wait(0.35); const p0 = a.g.position.clone(); await tween(0.6, k => { a.g.position.set(p0.x, lerp(p0.y, A.gy(p0.x, p0.z) + 0.1, k * k), p0.z + k * 0.9); }); snd('land', 5); }
    if (i === 1) { sim.mimoGo({ x: sp.x - 0.6, z: sp.z + 0.6 }, sp); await wait(0.9); snd('splash'); G().w3d.fx.puff(sp.x, A.gy(sp.x, sp.z) + 0.5, sp.z, 10, 0.2, '#cfeaf2'); await wait(0.6); }
    if (i === 2) { sim.mimoGo({ x: sp.at.x, z: sp.at.z }, W.cart.g.position); await wait(0.8); snd('land', 9); const c0 = W.cart.g.position.clone(); await tween(0.8, k => { W.cart.g.position.set(c0.x - 1.3 * k, c0.y, c0.z - 0.5 * k); }); W.cartSolid.x = W.cart.g.position.x; W.cartSolid.z = W.cart.g.position.z; }
    a.g.visible = false; G().w3d.fx.sparkle(a.g.position.x, a.g.position.y + 0.3, a.g.position.z, 12, ['#ffd166', '#ff8f6a']); snd('learned');
    (st().apples || (st().apples = {}))[sp.id] = true;
    sim.mimoGo(null, null);
    await say('rosita', ['pa.rosa.jump', 'pa.rosa.swim', 'pa.rosa.push'][i]);
    lock(false);
    if (Object.keys(st().apples).length >= 3) await applesAll();
    else G().save();
  }
  async function applesAll() {
    lock(true);
    await say('rosita', 'pa.rosa.thanks');
    // (the shop's apple, 'w.apple': the same food the bag, the fights and E's deals («te doy una manzana») use)
    const bag = G().state.bag || (G().state.bag = {}); const appleId = typeof SHOP !== 'undefined' && SHOP.ITEMS && SHOP.ITEMS.some(it => it.id === 'w.apple') ? 'w.apple' : null;
    if (appleId) { bag[appleId] = (bag[appleId] || 0) + 1; UI.toast('🍎 young Rosa gave you an apple'); }
    await say('rosita', 'pa.rosa.elio');
    fl().pastApples = true; stage(); lock(false); G().save();
    await echoFight();
  }

  // ------------------------------------------------------------ the shadows from the clock: the first time fight (G)
  const SEPIA = 'sepia(0.42) saturate(1.18) contrast(1.03)';
  async function pastFight(opts) {
    const cv = document.getElementById('gl'), tick = setInterval(() => { if (cv && document.body.classList.contains('in-battle')) cv.style.filter = SEPIA; }, 120);
    try { return await G().fight(Object.assign({ realm: 'past' }, opts)); } finally { clearInterval(tick); if (cv) cv.style.filter = ''; }
  }
  async function echoFight() {
    lock(true);
    const p = { x: -10.2, z: -139.4 }, g0 = A.gy(p.x, p.z);
    cam([p.x + 3.6, g0 + 2.6, p.z + 6.4], [p.x, g0 + 0.8, p.z - 1.0], 0.9);
    for (let i = 0; i < 3; i++) { G().w3d.fx.puff(p.x + (i - 1) * 1.4, g0 + 0.4, p.z - 1.2, 14, 0.4, '#8f8ca0'); await wait(0.25); }
    snd('screech'); G().sim.mimo.scared = 2;
    await say('noa', 'pa.noa.echoes');
    camOff(); lock(false);
    const TB = TBf();
    if (TB && TB.lesson && TB.learned && !TB.learned('Gp')) { try { await TB.lesson('Gp', { by: who('noa'), coach: cast('noa'), place: p, game: G() }); } catch (e) { console.error('[past] Gp lesson', e); } }
    const r = await pastFight({ foes: [{ kind: 'hushling', color: 'blue', size: 'small' }, { kind: 'moth', color: 'red', size: 'small' }], place: p });
    if (r && r.outcome === 'win') { fl().pastEcho = true; stage(); G().save(); think('Gone, like smoke. Everyone’s gathering round the fountain: the names!', 5); }
    else think('The shadows are still by the fountain… catch your breath, then face them again.', 5);
  }

  // ------------------------------------------------------------ the Festival of Voices: the names
  async function namesScene() {
    if (st().namesSeen && !fl().pastNames) return namesTasks();
    lock(true); st().namesSeen = true; stage();
    W_song = 'past_fest';
    const R = P('ringer'), Y = P('shy'), E = P('elio'), F0 = A.SP.fountain, g0 = A.gy(F0.x, F0.z);
    cam([F0.x + 5.6, g0 + 3.4, F0.z + 9.6], [F0.x - 0.6, g0 + 1.2, F0.z + 3.6], 1.0);
    if (R) R.o.prop = 'bell';
    await say('ringer', 'pa.ring.open');
    // the names, called out: the children shout, the grandparents sing (the crowd round the fountain)
    const sh = PTXT.SHOUTS[l()] || PTXT.SHOUTS.es;
    for (let i = 0; i < sh.length; i++) { const c = P('crowd' + [2, 5, 8][i]); if (c) { c.hop = 1; floatText(sh[i], c.api.x, c.api.y + 1.6, c.api.z); } snd(i === 2 ? 'sing' : 'chirp'); clapSfx(10, 0.8); await wait(1.1); if (c) c.hop = 0; }
    // the shy one's turn: so quiet (pt: Benedito stutters, and gets there); the bell, just for them
    A.place(Y, F0.x - 1.6, F0.z + 5.2, Math.PI); cam([F0.x - 1.0, g0 + 1.4, F0.z + 8.4], [F0.x - 1.6, g0 + 0.9, F0.z + 5.2], 0.8);
    await wait(0.6);
    await demo('shy', 'pa.shy.name');
    await wait(0.8);
    for (let i = 0; i < (l() === 'pt' ? 3 : 1); i++) { snd('bell'); G().w3d.fx.sparkle(R ? R.api.x : F0.x, (R ? R.api.y : g0) + 1.3, R ? R.api.z : F0.z + 4, 10, ['#ffd166', '#fff3a0']); await wait(0.6); }
    await demo('ringer', 'pa.ring.forher');
    clapSfx(40, 2);
    // Elio's turn: quiet, but clear; young Rosa whistles
    A.place(E, F0.x + 1.4, F0.z + 5.4, Math.PI); A.show(E, true);
    cam([F0.x + 2.4, g0 + 1.5, F0.z + 8.6], [F0.x + 1.4, g0 + 0.9, F0.z + 5.4], 0.8);
    await wait(0.5);
    await demo('elio', 'pa.elio.name');
    clapSfx(30, 1.6); snd('chirp');
    // yours: the bell rings for you too
    cam([F0.x - 2.6, g0 + 2.2, F0.z + 9.6], [F0.x, g0 + 1.0, F0.z + 6.6], 0.8);
    await say('ringer', 'pa.ring.you');
    lock(false);
    const r = await UI.command({ name: mimoName(), icon: 'star', title: 'Your turn: say your name, out loud. (Anything you like. Every voice counts.)', verbs: [], placeholder: 'your name…' });
    lock(true);
    if (r && !r.cancelled && r.text) floatText(r.text, G().sim.you.x, A.gy(G().sim.you.x, G().sim.you.z) + 2.3, G().sim.you.z);
    snd('bell'); clapSfx(40, 2);
    G().sim.mimoSay('♪ ' + mimoName() + '! ♪', 2); snd('chirp');
    await wait(1.4);
    // back to the plaza; Elio goes off to practice (by the pond); Noa wants to remember it
    A.show(E, false);
    camOff(); W_song = null; lock(false);
    await say('noa', 'pa.noa.notebook');
    await namesTasks();
  }
  async function namesTasks() {
    if (!st().names1) { const g = await ask('names1', { icon: 'star' }); if (!g) { think('Noa’s echo is waiting to hear what happened at the names.', 4); return; } st().names1 = true; G().save(); }
    if (!st().names2) { const g = await ask('names2', { icon: 'bell' }); if (!g) { think('Noa’s echo is waiting: what did the bell ringer do?', 4); return; } st().names2 = true; }
    fl().pastNames = true; stage(); G().save();
    think('Elio went off to practice his words for tonight: by the duck pond, someone said.', 5.5);
  }

  // ------------------------------------------------------------ Elio by the duck pond: how it was when he came (the imperfect)
  async function elioScene() {
    if (st().elioSeen && !fl().pastElio) return elioTask();
    lock(true); st().elioSeen = true;
    const E = P('elio'), e = E.api, Yu = G().sim.you;
    A.faceTo(E, A.SP.pond.x, A.SP.pond.z);
    cam([e.x - 3.2, e.y + 1.7, e.z + 3.0], [e.x + 0.4, e.y + 0.9, e.z - 0.6], 0.9);
    await demo('elio', 'pa.elio.practice');
    A.faceTo(E, Yu.x, Yu.z); snd('pip');
    await say('elio', 'pa.elio.heard');
    await demo('elio', 'pa.elio.story');
    if (l() === 'zh') { await demo('elio', 'pa.elio.guo'); lock(false); const g = await ask('guo', { icon: 'bell' }); lock(true); st().guo = !!g; }
    await card('was');
    await say('elio', 'pa.elio.you');
    camOff(); lock(false);
    await elioTask();
  }
  async function elioTask() {
    if (l() === 'zh' && !st().guo) { const g0 = await ask('guo', { icon: 'bell' }); if (!g0) return; st().guo = true; }
    const g = await ask('elio', { icon: 'star' });
    if (!g) { think('Elio is still waiting to hear how it was for you.', 4); return; }
    lock(true);
    await say('elio', 'pa.elio.same');
    await say('elio', 'pa.elio.cap');
    fl().pastElio = true; stage(); lock(false); G().save();
    think('Noa’s echo wants to remember all of this. Three places round the plaza glow softly.', 5.5);
  }

  // ------------------------------------------------------------ how it was: three memories for Noa (then the sun goes down)
  async function memoryTask(i) {
    const sp = A.SP.scenes[i], key = ['pa.noa.s1', 'pa.noa.s2', 'pa.noa.s3'][i], id = ['scene1', 'scene2', 'scene3'][i], Yu = G().sim.you;
    lock(true);
    if (!st().remember) { st().remember = true; await say('noa', 'pa.noa.remember'); }
    cam([Yu.x + (Yu.x - sp.look.x) * 0.15, A.gy(Yu.x, Yu.z) + 1.9, Yu.z + (Yu.z - sp.look.z) * 0.15 + 0.4], [sp.look.x, sp.look.y, sp.look.z], 0.9);
    await demo('noa', key);
    lock(false);
    const g = await ask(id, { icon: 'star' });
    camOff();
    if (!g) return;
    (st().scene || (st().scene = {}))[sp.id] = true; (st().sceneText || (st().sceneText = {}))[sp.id] = g.text;
    memFlash(); snd('page');
    if (Object.keys(st().scene).length >= 3) await sceneAll(); else G().save();
  }
  // a page for Noa's new notebook: what you said, in your own words
  async function sceneAll() {
    css();
    const T = st().sceneText || {}, rows = ['s1', 's2', 's3'].map(k => T[k]).filter(Boolean).map(t => `<div class="mem">«${esc(t)}»</div>`).join('');
    await UI.card(`<div class="tag">Noa’s new notebook · ${esc(PTXT.pick(PTXT.NAMES.alba, l()))}</div>${rows}<div class="sub">E</div>`, { kind: 'past-page' });
    lock(true);
    await say('noa', 'pa.noa.thanks6');
    fl().pastScene = true; stage(); lock(false); G().save();
    think('The sun is going down. The concert is at eight, at the old theater, north of the plaza.', 6);
  }

  // ------------------------------------------------------------ the north gate at dusk: the shadows again ('Gi': the scene in a memory)
  const GATE = { x: -10, z: -191.4 };
  async function gateFight() {
    if (st().gate) return;
    lock(true); st().gateSeen = true;
    const g0 = A.gy(GATE.x, GATE.z);
    cam([GATE.x + 3.2, g0 + 2.4, GATE.z + 6.4], [GATE.x, g0 + 0.9, GATE.z - 0.6], 0.8);
    for (let i = 0; i < 3; i++) { G().w3d.fx.puff(GATE.x + (i - 1) * 1.3, g0 + 0.4, GATE.z - 0.8, 14, 0.4, '#8f8ca0'); await wait(0.22); }
    snd('screech'); G().sim.mimo.scared = 2;
    await say('noa', 'pa.noa.echoes');
    camOff(); lock(false);
    const TB = TBf();
    if (TB && TB.lesson && TB.learned && !TB.learned('Gi')) { try { await TB.lesson('Gi', { by: who('noa'), coach: cast('noa'), place: GATE, game: G() }); } catch (e) { console.error('[past] Gi lesson', e); } }
    const r = await pastFight({ foes: [{ kind: 'moth', color: 'green', size: 'small' }, { kind: 'beetle', color: 'blue', size: 'small' }, { kind: 'hushling', color: 'red', size: 'small' }], place: GATE });
    if (r && r.outcome === 'win') { st().gate = true; G().save(); think('The way to the theater is clear. Eight o’clock is near.', 4.5); }
    else think('The shadows still block the north street… face them again when you’re ready.', 5);
  }

  // ------------------------------------------------------------ eight o'clock: the concert in the theater
  function hall() {
    const H = (typeof CEMETERY !== 'undefined' && CEMETERY._ && CEMETERY._.HALL) || { x: -13.5, z: -241, w: 14, d: 12.5, y0: 0.6 };
    const y0 = H.y0 !== undefined ? H.y0 : A.gy(H.x, H.z), sz = -H.d / 2 + 1.6;
    return { x: H.x, z: H.z, y0, floor: y0 + 0.55, SY: y0 + 1.45, sz, stand: { x: H.x, z: H.z + sz + 0.5 } };
  }
  let CON = null;     // the concert's people and lights (built the first time)
  function buildConcert() {
    if (CON) return CON;
    const H = hall(), W = A.W, out = { people: [], glows: [] };
    const seat = (id, look, x, z) => { const h = look.h || (look.kid ? 0.78 : 1); const p = A.person(id, Object.assign({ seat: true }, look), { x, z, yaw: Math.PI }); A.place(p, x, z, Math.PI, H.floor + 0.42 + 0.36 * h); out.people.push(p); return p; };
    // the audience in the red chairs (rows z +3.9 … −1.5, columns x −4.5 … +4.5 round the hall's middle)
    const spots = [[0, 1], [0, 3], [1, 0], [1, 2], [1, 4], [1, 5], [2, 1], [2, 3], [3, 0], [3, 2], [3, 5], [4, 1], [4, 4]];
    spots.forEach(([r, c], i) => seat('aud' + i, A.CROWD[i % A.CROWD.length], H.x - 4.5 + c * 1.8, H.z + 3.9 - r * 1.35));
    // the choir in their red robes (Clara sewed them, a little too big), young Rosa among them
    const robe = '#c43c3c';
    [[-2.4, A.LOOKS.rosita], [-1.2, { kid: true, skin: '#efc29a', hair: '#6b3b25', hairdo: 'tails', h: 0.8 }], [1.2, { kid: true, skin: '#c98e62', hair: '#2b211d', h: 0.78 }], [2.4, { kid: true, skin: '#f0c7a0', hair: '#c9873a', hairdo: 'bun', h: 0.76 }]]
      .forEach(([dx, look], i) => { const p = A.person('choir' + i, Object.assign({}, look, { robe, apron: null, vest: null, ribbon: look.ribbon }), { x: H.x + dx, z: H.z + H.sz - 0.75, yaw: 0 }); A.place(p, H.x + dx, H.z + H.sz - 0.75, 0, H.SY); out.people.push(p); });
    // Aurora conducting, Félix at the piano (the cemetery's people of then, as they looked)
    const au = A.person('aurora', { skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'bun', dress: '#5c4a7a', shawl: '#e8b83e', prop: 'baton', h: 1.05 }, { x: H.x - 2.0, z: H.z + H.sz + 2.1, yaw: Math.PI });
    A.place(au, H.x - 2.0, H.z + H.sz + 2.1, Math.PI, H.floor); out.people.push(au); au.api.name = cast('aurora');
    const fx = A.person('felix', { seat: true, skin: '#a8714a', hair: '#1f1a18', dress: '#2b2235', vest: '#7a4fa0', hat: 'beret', hatColor: '#7a4fa0', h: 1.06 }, { x: H.x - 3.6, z: H.z + H.sz + 0.6, yaw: Math.PI });
    A.place(fx, H.x - 3.6, H.z + H.sz + 0.6, Math.PI, H.SY + 0.4); out.people.push(fx);
    // the stage's lights: footlights, a spot on the music stand
    for (let i = -2; i <= 2; i++) { const g = A.glow('#ffd28a', 1.6, 0.5); g.position.set(H.x + i * 2.2, H.SY + 0.25, H.z + H.sz + 1.35); W.root.add(g); out.glows.push(g); }
    const spot = A.glow('#fff1c8', 3.6, 0.5); spot.position.set(H.stand.x, H.SY + 2.6, H.stand.z); W.root.add(spot); out.spot = spot;
    // Elio's red cap, where it fell (it's still there today: cemetery.js draws it on the dusty stage)
    const cg = new THREE.Group(), ck = A.Kit(); ck.add(A.KG.half, 0, 0, 0, 0.14, 0.11, 0.14, '#c9443a', { ink: 0.006 }).box(0, 0.01, 0.17, 0.18, 0.02, 0.14, '#c9443a', { ink: 0 }); ck.build(cg);
    cg.position.set(H.stand.x + 0.7, H.SY, H.stand.z + 0.55); cg.visible = false; W.root.add(cg); out.cap = cg;
    // the gray that rises from the stage
    out.mist = [0, 1, 2, 3, 4, 5].map(i => { const s = A.glow('#8f8ca0', 2.2, 0); s.material.blending = THREE.NormalBlending; s.position.set(H.stand.x + (i - 2.5) * 0.9, H.SY + 0.6 + (i % 2) * 0.5, H.stand.z - 0.4); W.root.add(s); return s; });
    out.all = () => out.people.map(p => p.g).concat(out.glows, [out.spot]);
    out.show = on => { out.people.forEach(p => A.show(p, on)); out.glows.forEach(g => { g.visible = on; }); out.spot.visible = on; };
    out.show(false);
    return (CON = out);
  }
  async function concert() {
    if (fl().pastBoss) return;
    if (st().concertFought) return bossRound();
    lock(true); A.busy = true;
    try {
      const H = hall(), C = buildConcert(), E = P('elio'), Yu = G().sim.you;
      const au = P('aurora');
      // at the door: Aurora waves you in (outside, then the hall)
      await A.veil(true, 500);
      A.setTod(2); C.show(true); C.cap.visible = false; C.mist.forEach(s => { s.material.opacity = 0; s.scale.setScalar(2.2); });
      A.place(E, H.x - 5.4, H.z + H.sz - 0.2, Math.PI / 2, H.SY); A.show(E, true);
      cam([H.x + 2.0, H.floor + 3.0, H.z + 5.4], [H.x, H.floor + 1.7, H.z + H.sz], 0.01);
      await wait(0.2); await A.veil(false, 700);
      await say('aurora', 'pa.aurora.door');
      // the choir sings (the festival's song); the notes float up
      W_song = 'past_fest';
      cam([H.x + 1.6, H.SY + 1.2, H.z + 0.6], [H.x, H.SY + 0.9, H.z + H.sz - 0.6], 1.2);
      for (let i = 0; i < 10; i++) { const p = P('choir' + (i % 4)); if (p) floatText(i % 3 ? '♪' : '♫', p.api.x, p.api.y + 1.3, p.api.z, { small: true }); await wait(0.55); }
      clapSfx(60, 2.4); await wait(1.4);
      cam([H.x - 0.4, H.floor + 1.9, H.z + H.sz + 4.4], [H.x - 2.0, H.floor + 1.4, H.z + H.sz + 2.1], 0.8);
      await say('aurora', 'pa.aurora.intro');
      // Elio walks out to the music stand, in his red cap
      W_song = 'past_silence';
      cam([H.x + 2.6, H.SY + 1.4, H.z + H.sz + 4.2], [H.x - 1.6, H.SY + 0.8, H.z + H.sz + 0.2], 0.8);
      const ex = H.stand.x + 0.6, ez = H.stand.z + 0.35;     // (beside the music stand: where his cap will fall, and lie still today)
      await tween(2.2, k => A.place(E, lerp(H.x - 5.4, ex, k), lerp(H.z + H.sz - 0.2, ez, k), lerp(Math.PI / 2, 0, Math.min(1, k * 1.6)), H.SY));
      cam([H.x + 1.0, H.SY + 1.25, H.stand.z + 2.6], [ex - 0.3, H.SY + 0.95, ez], 0.8);
      await wait(1.0);
      // one word wrong
      await demo('elio', 'pa.elio.stage');
      // a voice in the crowd, then the whole theater
      const v = P('aud3'), w0 = P('aud7');
      cam([H.x + 0.6, H.SY + 1.4, H.z + H.sz + 1.6], [H.x, H.floor + 1.0, H.z + 1.6], 0.6);
      if (v) { floatText(PTXT.pick(PTXT.LINES['pa.crowd.joke'], l()), v.api.x, v.api.y + 1.4, v.api.z); laughSfx(1, 0.9); v.hop = 0.6; }
      await wait(1.2);
      const L = PTXT.LAUGHS[l()] || PTXT.LAUGHS.es;
      for (let i = 0; i < 16; i++) { const p = P('aud' + ((i * 5) % 13)); if (p) { floatText(PTXT.pick({ [l()]: L[i % L.length] }, l()), p.api.x, p.api.y + 1.3, p.api.z, { small: i % 2 === 1 }); p.hop = 0.5; } if (i % 3 === 0) laughSfx(3, 0.9 + Math.random() * 0.3); await wait(0.16); }
      if (w0) w0.hop = 0;
      // Elio, frozen; he opens his mouth, and nothing comes out
      cam([H.x + 0.9, H.SY + 1.15, H.stand.z + 1.7], [ex - 0.1, H.SY + 0.95, ez], 0.5);
      await wait(0.8); floatText('…', E.api.x, E.api.y + 1.3, E.api.z, { gray: true }); await wait(1.4);
      Object.values(A.W.people).forEach(p => { if (/^aud/.test(p.id)) p.hop = 0; });
      await say('aurora', 'pa.aurora.stop');
      // he runs; the cap falls
      snd('swoosh'); C.cap.visible = true;
      await tween(1.1, k => A.place(E, lerp(ex, H.x + 6.2, k), lerp(ez, H.z + H.sz + 1.0, k), Math.PI / 2, H.SY));
      A.show(E, false); snd('wood'); await wait(0.6);
      cam([H.x - 0.6, H.floor + 1.9, H.z + H.sz + 3.6], [H.x - 2.0, H.floor + 1.3, H.z + H.sz + 2.1], 0.6);
      snd('tick'); await wait(0.5); snd('tick'); await wait(0.9);
      think('Aurora looks down at her pocket watch. It has stopped. Eight o’clock.', 5); await wait(2.6);
      // the gray rises from the stage; the light goes cold
      A.setTod(3); snd('screech');
      cam([H.x + 1.6, H.SY + 1.6, H.stand.z + 4.2], [H.stand.x, H.SY + 1.2, H.stand.z], 0.8);
      for (let i = 0; i < 30; i++) { C.mist.forEach((s, j) => { s.material.opacity = Math.min(0.75, i / 30 + j * 0.02); s.scale.setScalar(2.2 + i * 0.06); }); await wait(0.05); }
      await say('noa', 'pa.noa.born');
      st().concertFought = true; G().save();
    } catch (e) { console.error('[past] concert', e); }
    finally { W_song = null; lock(false); A.busy = false; }
    await bossRound();
  }
  // the fight, and what comes after it (or, if you ran: the laughter still fills the theater)
  async function bossRound() {
    const r = await bossFight();
    if (r && r.outcome === 'win') { await afterBoss(); return; }
    think('The laughter still fills the theater… face it again when you’re ready (Go in).', 5);
  }
  async function afterBoss() {
    const H = hall(), C = buildConcert();
    lock(true); A.busy = true;
    try {
      C.show(false); C.mist.forEach(s => { s.material.opacity = 0; }); C.cap.visible = true; C.spot.visible = true;
      A.setTod(3);
      cam([H.x + 1.4, H.SY + 1.5, H.stand.z + 3.0], [H.stand.x + 0.5, H.SY + 0.3, H.stand.z + 0.6], 0.01);
      await wait(1.0);
      await demo('noa', 'pa.noa.retell');
      await say('noa', 'pa.noa.who');
      await you('Elio… The hooded figure was Elio. And his red cap is still on that stage today.');
      fl().pastBoss = true; G().save();
      await A.veil(true, 600);
      C.cap.visible = false; C.spot.visible = false; camOff(); A.setTod(null);
      A.teleport(-11.8, -231.4, 0.3); stage();
      await wait(0.2); await A.veil(false, 700);
    } catch (e) { console.error('[past] after', e); }
    finally { lock(false); A.busy = false; }
    think('Someone’s out here with a lantern, looking for someone…', 4.5);
  }

  // ------------------------------------------------------------ the report: young Rosa, outside, with her lantern
  async function report() {
    const Ro = P('rosita'); if (!Ro) return;
    lock(true);
    cam([Ro.api.x + 2.2, Ro.api.y + 1.5, Ro.api.z + 3.2], [Ro.api.x, Ro.api.y + 0.9, Ro.api.z], 0.8);
    await say('rosita', 'pa.rosa.where');
    lock(false);
    const g1 = await ask('report1', { icon: 'star' }); if (!g1) { camOff(); return; }
    lock(true); await say('rosita', 'pa.rosa.how'); lock(false);
    const g2 = await ask('report2', { icon: 'star' }); if (!g2) { camOff(); return; }
    lock(true);
    await say('rosita', 'pa.rosa.promise');
    // she runs off up the old north road with her lantern, calling his name
    const x0 = Ro.api.x, z0 = Ro.api.z;
    await tween(1.8, k => A.place(Ro, lerp(x0, 3.0, k), lerp(z0, -240.0, k), Math.atan2(3.0 - x0, -240.0 - z0)));
    A.show(Ro, false);
    camOff();
    await say('noa', 'pa.noa.understand');
    fl().pastReport = true; stage(); G().save();
    // the great clock opens another door
    const D = A.W.door; if (D) { D.g.visible = true; snd('bigbell'); G().w3d.fx.sparkle(D.g.position.x, D.g.position.y + 1.6, D.g.position.z, 26, ['#bcd4ff', '#ffffff']); cam([D.at.x - 3.4, A.gy(D.at.x, D.at.z) + 2.0, D.at.z + 3.6], [D.g.position.x, D.g.position.y + 1.6, D.g.position.z], 0.9); }
    await wait(0.8);
    await demo('noa', 'pa.noa.future');
    camOff(); lock(false);
  }

  // ------------------------------------------------------------ the Future's door (future.js; or, until it's there, a card)
  async function future() {
    fl().pastDone = true; G().save();
    if (typeof FUTURE !== 'undefined' && FUTURE.enter) { await FUTURE.enter({ from: 'past' }); return; }
    await UI.card(`<div class="tag">Chapter 3</div><div class="big" style="font-size:30px">The Future</div><div class="caption">«${esc(PTXT.pick(PTXT.NAMES.future, l()))}»</div>`
      + `<div class="sub" style="font-size:14px;opacity:.8;max-width:340px;margin:6px auto 0">The Future is coming soon! Your game is saved here. The little tear by the bell tower leads home to the present.</div><div class="sub">E to close</div>`);
  }

  // ------------------------------------------------------------ small talk with the people of then (mixed, like anyone's)
  function chat(P0) { const T = PTXT.CHAT && PTXT.CHAT[(P0.id.length * 7 + P0.id.charCodeAt(P0.id.length - 1)) % PTXT.CHAT.length]; if (!T) return; P0.api.name = ''; P0.api.lines = { en: PTXT.en(T, l()), [l()]: T[l()] || '' }; return STORY.sayInline(P0.api); }
  // (the world you come back to: the named ones keep their names, and nobody talks about tonight's concert any more)
  function freeChat(P0) {
    const pool = (PTXT.CHAT || []).filter((T, i) => i !== 1); if (!pool.length) return;
    const T = pool[(P0.id.length * 7 + P0.id.charCodeAt(P0.id.length - 1)) % pool.length];
    P0.api.name = PTXT.CAST[P0.id] ? cast(P0.id) : ''; P0.api.lines = { en: PTXT.en(T, l()), [l()]: T[l()] || '' };
    return STORY.sayInline(P0.api);
  }

  // ------------------------------------------------------------ the boss: the Echo of the Laughter (a plug-in on battle/flow.js)
  // A gray cloud with three laughing masks round it, born of the town's laughter; inside it, curled up, the boy. Phase 1: break
  // the masks with commands told as memories (BATTLE._.tense marks each clause's tense: the past cracks a mask, the present only
  // half lands, and the mask laughs on). Its laugh flies at you or Mimo («¡JA!»… por arriba / por abajo: dodge). Phase 2: the
  // masks are gone and the boy is there, gray but for his red cap. Don't hit him: say how he was («Elio tenía miedo»); the gray
  // lets go, and the memory rests. (Never lost by hearts: it doesn't laugh at your last one.)
  const SPECIES = { es: { w: 'risa', pl: 'risas', g: 'f', en: 'laughter' }, pt: { w: 'risada', pl: 'risadas', g: 'f', en: 'laughter' }, de: { w: 'Gelächter', pl: 'Gelächter', gen: 'Gelächters', g: 'n', en: 'laughter' },
    zh: { w: '[笑声|xiào shēng]', en: 'laughter', g: 'm', cl: '个', cls: ['个', '阵'] }, ja: { w: '[笑|わら]い[声|ごえ]', en: 'laughter', g: 'm' } };
  const MASKS = 3;
  let FX = null, maskTex = null;
  const BTX = () => (typeof BATTLE !== 'undefined' && BATTLE._) || null;
  const fightLine = key => { const T = PTXT.FIGHT[key]; const lg = l(); return [String(T[lg] || T.en).replace(/\{mimo\}/g, mimoName()), PTXT.fill(T.en, lg).replace(/\{mimo\}/g, mimoName())]; };
  function laughFace() {
    return maskTex || (maskTex = TK.canvasTex(128, 128, (c, w, h) => {
      c.fillStyle = '#f6f2ea'; c.beginPath(); c.ellipse(64, 64, 54, 60, 0, 0, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = '#2b2235'; c.stroke();
      c.lineWidth = 6; for (const x of [42, 86]) { c.beginPath(); c.arc(x, 52, 11, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      c.fillStyle = '#2b2235'; c.beginPath(); c.moveTo(30, 74); c.quadraticCurveTo(64, 126, 98, 74); c.quadraticCurveTo(64, 92, 30, 74); c.fill();
      c.fillStyle = '#c9443a'; c.beginPath(); c.ellipse(64, 98, 14, 7, 0, 0, TAU); c.fill();
    }));
  }
  function bossModel() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const k = A.Kit();
    [[0, 1.0, 0, 0.95], [0.62, 1.28, 0.1, 0.62], [-0.62, 1.22, -0.1, 0.68], [0.2, 1.78, -0.2, 0.58], [-0.34, 0.55, 0.22, 0.62], [0.42, 0.6, -0.2, 0.52], [0, 2.1, 0.05, 0.4]]
      .forEach(([x, y, z, r]) => k.add(A.KG.sphere, x, y, z, r, r * 0.92, r, '#8d8aa0', { ink: 0.02 }));
    const cloud = new THREE.Group(); body.add(cloud);
    const cmat = TK.toon('#ffffff', { vc: 1, rim: 0.45 }).clone(); cmat.transparent = true; k.build(cloud, { mat: cmat });
    // the masks: laughing faces going round
    const face = new THREE.MeshBasicMaterial({ map: laughFace(), transparent: true, side: THREE.DoubleSide });
    const masks = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.68), face); m.userData.a = i / 3 * TAU; body.add(m); return m; });
    // the boy at its heart: Elio, curled up, gray but for his red cap (hidden until the masks are gone)
    const look = Object.assign({}, A.LOOKS.elio, { seat: true, skin: '#a8a4b4', hair: '#5a5668', dress: '#7c7890', vest: '#8f8aa0', hatColor: '#d23a32' });
    const boy = new THREE.Group(), bk = A.personKit(look).k; bk.build(boy); boy.scale.setScalar(0.62); boy.position.set(0, 0.62, 0.1); boy.rotation.x = 0.25; boy.visible = false; body.add(boy);
    const gl = A.glow('#c9c4dc', 3.2, 0.35); gl.position.y = 1.1; body.add(gl);
    const anchors = {};
    [['top', [0, 2.7, 0]], ['mid', [0, 1.1, 0.4]], ['head', [0, 1.7, 0.5]], ['face', [0, 1.5, 0.7]], ['book', [0, 1.2, 0.6]], ['feet', [0, 0.05, 0]]].forEach(([n, p]) => { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); anchors[n] = o; });
    const s = 1.15; root.scale.setScalar(s);
    return { root, body, cloud, cmat, masks, boy, gl, anchors, kind: 'laughter', scale: s, radius: 1.0 * s, height: 2.6 * s, parts: [], labelH: 3.1, hover: 0, L: { broken: 0, k: 1, phase: 1, laugh: 0 } };
  }
  function bossPose(h, F, t, dt) {
    const L0 = h.L, ph2 = FX && FX.phase === 2;
    L0.k = damp(L0.k, ph2 ? 0.35 : 1, 1.5, dt || 0.016); L0.laugh = Math.max(0, L0.laugh - (dt || 0.016) * 1.5);
    h.body.position.y = Math.sin(t * 1.3) * 0.08 + L0.laugh * Math.abs(Math.sin(t * 22)) * 0.12;
    h.cloud.scale.setScalar(0.85 + 0.15 * L0.k + Math.sin(t * 2.1) * 0.02);
    h.cmat.opacity = 0.35 + 0.65 * L0.k;
    h.masks.forEach((m, i) => { m.visible = i >= (FX ? FX.hits : 0) && !ph2; const a = m.userData.a + t * 0.7; m.position.set(Math.sin(a) * 1.35, 1.25 + Math.sin(t * 2 + i) * 0.2, Math.cos(a) * 1.35); m.lookAt(m.position.x * 3, m.position.y, m.position.z * 3 + 4); m.rotation.z = Math.sin(t * 9 + i) * 0.12 * (1 + L0.laugh * 2); });
    h.boy.visible = ph2;
    if (ph2) h.boy.position.y = 0.62 + Math.sin(t * 1.1) * 0.03;
    h.gl.material.opacity = ph2 ? 0.55 : 0.35;
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }
  function bossLabel(f) {
    const lg = l(), sp = SPECIES[lg] || SPECIES.es, name = PTXT.pick(PTXT.NAMES.boss, lg);
    const left = FX ? Math.max(0, MASKS - FX.hits) : MASKS;
    return `<div class="bt-chips"><span class="bt-chip name">${A.isC() && typeof CJK !== 'undefined' ? CJK.html(PTXT.NAMES.boss[lg], { lang: lg }) : esc(name)}</span></div><div class="bt-hpbar"><i style="width:${Math.round(100 * left / MASKS)}%"></i><span>${FX && FX.phase === 2 ? '…' : '🎭 ' + left}</span></div>`;
  }
  // a word as a sprite (the laugh flying at you)
  function wordSprite(text) {
    const cv = document.createElement('canvas'), c = cv.getContext('2d'), font = '900 64px "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif';
    c.font = font; cv.width = Math.min(1024, Math.ceil(c.measureText(text).width) + 56); cv.height = 104;
    c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 14; c.strokeStyle = '#d9cff5'; c.strokeText(text, cv.width / 2, 54); c.fillStyle = '#3a3448'; c.fillText(text, cv.width / 2, 54);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false, depthWrite: false }));
    sp.scale.set(0.55 * cv.width / cv.height, 0.55, 1); sp.renderOrder = 12; return sp;
  }
  // the arena (stage.js _.arenaBuilders.theater): the theater's stage that night, as a memory. Boards, red curtains behind and
  // either side, the choir's risers left empty, Félix's piano, the music stand, footlights along the edge, warm dust in the air;
  // nothing stands between the camera and the fight. The floor takes the Hush's gray round the foes (uStain), as every arena's does.
  function theaterFloor(uni) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    m.onBeforeCompile = sh => {
      sh.uniforms.uStain = uni.uStain; sh.uniforms.uStainC = uni.uStainC;
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uStain; uniform vec2 uStainC; varying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hk = uStain * (1.0 - smoothstep(1.5, 8.0, distance(vWPos.xz, uStainC)));\n' +
        'vec3 hg = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.95, 0.93, 1.12) + vec3(0.05, 0.05, 0.08);\ndiffuseColor.rgb = mix(diffuseColor.rgb, hg, hk * 0.6);');
    };
    m.customProgramCacheKey = () => 'past-theater-floor';
    return m;
  }
  function buildTheater(K) {
    const P = { fog: '#2a1d18', hemiSky: '#ffe2b8', hemiGround: '#4a2e24', sun: '#ffd9a0', hemiI: 0.64, sunI: 0.6 };
    const { merge, M4, toon, glowTex } = TK, GG = TK.G;
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(P.fog, 24, 62); scene.background = new THREE.Color(P.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) } };
    scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI));
    const sun = new THREE.DirectionalLight(P.sun, P.sunI);
    sun.position.set(3, 15, 9); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    let seed = 1907; const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // the boards (the stage's edge at z 6.5, a step down to the dark hall)
    const geo = new THREE.PlaneGeometry(90, 90, 90, 90); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), WA = new THREE.Color('#a8784e'), WB = new THREE.Color('#956842'), D = new THREE.Color('#3a2620');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, z > 6.6 ? -1.2 : 0);
      if (z < 6.6 && Math.abs(x) < 14.5) c.copy(WA).lerp(WB, 0.5 + 0.5 * Math.sin(x * 0.9 + z * 0.13)); else c.copy(D);
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const floor = new THREE.Mesh(geo, theaterFloor(uni)); floor.receiveShadow = true; scene.add(floor);
    const pcs = [], add = (g, x, y, z, sx, sy, sz, color, ry = 0, rx = 0, rz = 0) => pcs.push({ geo: g, m: M4(x, y, z, sx, sy, sz, ry, rx, rz), color });
    for (let z = -9; z < 6.4; z += 0.7) add(GG.box, 0, 0.006, z, 28.6, 0.012, 0.035, '#6e4a30');          // the joins between the boards
    for (let i = 0; i <= 30; i++) add(GG.cyl, -15 + i, 5, -9.6 + (i % 2) * 0.18, 0.62, 10, 0.42, i % 2 ? '#a32c29' : '#bf3633');      // the back curtain
    for (const s of [-1, 1]) for (let k = 0; k < 9; k++) add(GG.cyl, s * (13.8 + (k % 2) * 0.16), 5, -8.2 + k * 1.1, 0.42, 10, 0.62, k % 2 ? '#a32c29' : '#bf3633');     // the wings
    add(GG.box, 0, 9.7, -9.1, 31, 1.8, 0.7, '#c43c3c'); add(GG.box, 0, 8.76, -8.74, 31, 0.2, 0.08, '#e8b83e');       // the valance, its gold trim
    add(GG.box, 0, -0.6, 6.62, 29, 1.2, 0.24, '#5a3a28'); add(GG.box, 0, 0.02, 6.5, 29, 0.06, 0.12, '#e8b83e');      // the stage's edge
    for (let i = -5; i <= 5; i++) add(GG.cyl, i * 2.4, 0.12, 6.08, 0.22, 0.24, 0.22, '#3b2a22');                      // the footlights' hoods
    add(GG.box, 0, 0.18, -7.5, 11, 0.36, 1.0, '#8a5f3e'); add(GG.box, 0, 0.42, -8.4, 11, 0.84, 0.9, '#7d5537');        // the choir's risers, empty now
    add(GG.box, -8.8, 0.75, -6.4, 2.2, 1.5, 0.8, '#2b2235'); add(GG.box, -8.8, 1.52, -6.4, 2.26, 0.06, 0.86, '#3a3045');   // Félix's piano
    add(GG.box, -8.8, 0.98, -5.94, 2.0, 0.06, 0.3, '#f4f1e6'); add(GG.box, -8.8, 0.25, -5.2, 1.0, 0.5, 0.4, '#5a3a28');
    add(GG.cyl, 0.9, 0.62, -5.4, 0.035, 1.24, 0.035, '#2f3440'); add(GG.cyl, 0.9, 0.02, -5.4, 0.3, 0.04, 0.3, '#2f3440');   // the music stand
    add(GG.box, 0.9, 1.3, -5.36, 0.62, 0.42, 0.03, '#2f3440', 0, -0.45); add(GG.box, 0.9, 1.31, -5.33, 0.52, 0.34, 0.012, '#f4efe0', 0, -0.45);
    const props = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.1 })); props.castShadow = props.receiveShadow = true; scene.add(props);
    // light: the footlights, a spot on the curtain behind the fight, dust drifting in it
    const glow = (color, s, o) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: o, depthWrite: false })); sp.scale.setScalar(s); scene.add(sp); return sp; };
    const foot = []; for (let i = -5; i <= 5; i++) { const g = glow('#ffd28a', 1.3, 0.55); g.position.set(i * 2.4, 0.4, 6.0); foot.push(g); }
    glow('#fff1c8', 10, 0.3).position.set(3.4, 4.4, -9.2);
    const motes = []; for (let i = 0; i < 18; i++) { const s = glow('#ffe6b0', 0.16, 0); motes.push({ s, x: -11 + R() * 22, z: -8 + R() * 10, y: 0.6 + R() * 5, ph: R() * 6.283, sp: 0.15 + R() * 0.3 }); }
    function update(t) {
      uni.uTime.value = t;
      foot.forEach((g, i) => { g.material.opacity = 0.5 + 0.06 * Math.sin(t * 3.1 + i * 1.7); });
      for (const m of motes) { m.s.position.set(m.x + Math.sin(t * m.sp + m.ph) * 1.1, m.y + Math.sin(t * m.sp * 0.7 + m.ph) * 0.5, m.z); m.s.material.opacity = 0.3 + 0.18 * Math.sin(t * 1.1 + m.ph); }
    }
    return { scene, sun, uni, update, P, theater: true };
  }
  function bossSay(K, st0, key, dur, cls = 'foe shout boss') { const [t, en] = fightLine(key); K.say(st0, t, { cls, en, dur }); }
  function coach(K, key, dur = 3.2) { const [t, en] = fightLine(key); K.say(FX.noaSt, t, { cls: 'coach', en, dur }); }
  const isPastCmd = r => !!(r && r.clauses && r.clauses.some(c => c.tb && (c.tb.tense === 'pret' || c.tb.tense === 'impf')));
  const PLUG = {
    setup(K) {
      const { G: BG, ST } = K, f = BG.foes.find(x => x.species === 'laughter'); if (!f) { FX = null; return; }
      FX = { f, hits: 0, phase: 1, turn: 0, noaSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true;
    },
    floor: f => (f && f.species === 'laughter' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FX) return 'flee';
      const f = FX.f, TAC = BTX() && BTX().tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 11 });
      bossSay(K, f, 'laugh', 2.6); K.emit('boss', { foe: f }); laughSfx(5, 0.8); if (f.h && f.h.L) f.h.L.laugh = 1;
      await K.wait(2.6);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FX.phase === 1) {
          if (FX.turn === 0) { coach(K, 'masks'); await K.wait(2.4); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[past] tac turn', e); } }
          const r = await K.askOrFlee('command');
          const past = isPastCmd(r);
          await K.perform(r);
          FX.turn++;
          if (past) { FX.hits++; ST.star(ST.worldOf(f, 'head'), '#f6f2ea', 1.2); K.emit('knockdown'); K.refreshLabels(); }
          else { coach(K, 'now', 2.6); await K.wait(1.4); }
          if (FX.hits >= MASKS) { await toPhase2(K); continue; }
          await laughAttack(K);
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[past] tac after', e); } }
        } else {
          const r = await memoryAsk(K);
          if (r && r.kind === 'memory') { await understood(K, r); return 'win'; }
          coach(K, 'nohit', 2.2); K.setMood(AC.mimo, 'sad', 1.6); await K.wait(1.6);
        }
      }
    },
    async foePhase(K) { if (FX && FX.phase === 1) await laughAttack(K); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  // its laugh, flying at you or Mimo: where it's coming from (your own dodge words), then «¡JA!»; dodge it
  async function laughAttack(K) {
    const { G: BG, A: AC, ST } = K, f = FX.f;
    if (BG.hearts <= 1) { const [t, en] = fightLine('laugh'); K.say(f, t, { cls: 'foe', en, dur: 1.6 }); await K.wait(1.2); return; }
    const high = Math.random() < 0.5, tgt = Math.random() < 0.5 ? AC.mimo : AC.you, lg = l();
    const dw = BG.L && BG.L.dodgeWords ? BG.L.dodgeWords(BG.tier) : null, ha = (PTXT.LAUGHS[lg] || PTXT.LAUGHS.es)[0];
    const haTxt = A.isC() && typeof CJK !== 'undefined' ? CJK.plain(ha, { lang: lg }) : ha, where = (dw && (high ? dw.high : dw.low)) || (high ? '↑' : '↓');
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.7 });
    if (f.h && f.h.L) f.h.L.laugh = 1; laughSfx(3, 0.85);
    K.say(f, `${haTxt} … ${where}`, { cls: 'foe shout boss', en: `${ha}… ${high ? 'up high' : 'down low'}`, dur: K.readTime(haTxt + where) + 2.0 });
    K.emit('shout', { text: haTxt, high, foe: f, boss: true }); K.dodgeHint(true);
    await K.wait(K.readTime(haTxt + where) + 0.15);
    K.emit('windup', { foe: f, high, boss: true });
    const Tm = BG.t + 0.8, key = high ? 'ArrowDown' : 'ArrowUp';
    const tp = K.timingWindow(Tm, key, () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
    const spr = wordSprite(haTxt.replace(/[!！…]/g, '').trim() || 'JA'), a = ST.worldOf(f, 'face'), b = ST.worldOf(tgt, high ? 'top' : 'feet');
    ST.prop(spr); spr.position.copy(a);
    await K.along(0.8, u => { spr.position.lerpVectors(a, b, u * 1.06); spr.position.y += Math.sin(u * Math.PI) * (high ? 0.45 : 0.12); spr.material.rotation = Math.sin(u * 12) * 0.15; });
    const grade = await tp;
    ST.dropProp(spr);
    K.dodgeResult(f, tgt, grade, 1, {});
    if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
    await K.wait(0.4);
  }
  // the masks are gone: the boy, curled up in the gray
  async function toPhase2(K) {
    const { A: AC, ST } = K, f = FX.f;
    FX.phase = 2; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 });
    ST.shake(0.4, 0.4); snd('crack');
    await K.wait(1.4);
    coach(K, 'child', 4.2);
    await K.wait(3.6);
  }
  // phase 2's box: a sentence about how he was (the imperfect) is "a memory understood"; a command is just a hit (refused)
  async function memoryAsk(K) {
    const _ = BTX(), Pp = _ && _.P; if (!Pp) return null;
    const parse0 = Pp.parse, T = PTXT.TASKS.boss, lg = l();
    Pp.parse = function (text, ctx) { const g = grade(T, text, lg, 0); if (g.ok) return { ok: true, kind: 'memory', raw: text, grade: g, clauses: [] }; return parse0.call(this, text, ctx); };
    try {
      const frame = plainT((T.frame || {})[lg] || ''), chips = ((T.chips || {})[lg] || []).map(([w, e]) => `${plainT(w)} (${e})`).join(' · ');
      return await K.askOrFlee('command', { hint: `«${frame}» · ___ = ${chips}` });
    } finally { Pp.parse = parse0; }
  }
  async function understood(K, r) {
    const { A: AC, ST } = K, f = FX.f;
    UI.toast(`${r.grade.letter} · A memory, understood`);
    K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 });
    await K.wait(1.6);
    const [t, en] = fightLine('yes'); K.say(FX.noaSt, t, { cls: 'coach', en, dur: 3.4 });
    snd('chime'); ST.shot('focus', AC.mimo, f, { up: 0.8, dist: 9 });
    if (f.h) { const h = f.h; await K.along(1.8, u => { h.cmat.opacity = 0.35 * (1 - u); h.gl.material.opacity = 0.55 + u; h.boy.position.y = 0.62 + u * 0.5; }); }
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(1.0);
  }
  let hooked = false;
  function hookBoss() {
    const _ = BTX(); if (!_ || hooked) return; hooked = true;
    for (const [lg, sp] of Object.entries(SPECIES)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species.laughter) { Lg.species.laughter = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
    const M = _.M;
    if (M && !M.laughterHooked) {
      M.laughterHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (String(k || '') === 'laughter' ? 'laughter' : k0(k));
      M.build = o => (o && o.kind === 'laughter' ? bossModel() : b0(o));
      M.pose = (h, F, t, dt) => (h && h.kind === 'laughter' ? bossPose(h, F, t, dt) : p0(h, F, t, dt));
      M.brighten = (h, k) => (h && h.kind === 'laughter' ? undefined : br0(h, k));
    }
    const U = _.UI; if (U && U.label && !U.laughterHooked) { U.laughterHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && f.species === 'laughter' ? bossLabel(f) : html); }; }
    if (_.RW && _.RW.LORE && !_.RW.LORE['boss:laughter']) _.RW.LORE['boss:laughter'] = ['Nació de una risa. Dentro, un niño callado.', 'Nasceu de uma risada. Dentro, um menino calado.', 'Aus einem Lachen geboren. Darin ein stiller Junge.',
      '[它|tā] [从|cóng] [笑声|xiào shēng] [里|lǐ] [出生|chū shēng] 。 [里面|lǐ miàn] [有|yǒu] [一个|yī gè] [不|bù] [说话|shuō huà] [的|de] [孩子|hái zi] 。', '[笑|わら]い[声|ごえ] から [生|う]まれた 。 [中|なか] に は 、 [黙|だま]った [子|こ]ども 。', 'Born of a laugh. Inside it, a silent boy.'];
    if (_.RW && _.RW.KIND_EN) _.RW.KIND_EN.laughter = 'the Echo of the Laughter';
    if (_.UI && _.UI.ICON && !_.UI.ICON.laughter) _.UI.ICON.laughter = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="34" r="24" fill="#8d8aa0" stroke="#2b2235" stroke-width="3"/><ellipse cx="32" cy="30" rx="12" ry="13" fill="#f6f2ea" stroke="#2b2235" stroke-width="2.5"/><path d="M24 34 Q32 46 40 34 Q32 38 24 34Z" fill="#2b2235"/><path d="M25 26 q3 -4 6 0 M33 26 q3 -4 6 0" stroke="#2b2235" stroke-width="2" fill="none"/></svg>';
    _.plugins = _.plugins || {}; _.plugins.laughter = PLUG;
    _.arenaBuilders = _.arenaBuilders || {}; if (!_.arenaBuilders.theater) _.arenaBuilders.theater = K => buildTheater(K);
    try { if (typeof BFX !== 'undefined' && BFX.VOICES && !BFX.VOICES.laughter) BFX.VOICES.laughter = { m: 64, vow: ['a', 'a', 'a'], len: 0.1, gap: 0.04 }; } catch (e) { /* (no battle sounds) */ }
  }
  async function bossFight() {
    hookBoss();
    const H = hall();
    return pastFight({ boss: 'laughter', foes: [{ kind: 'laughter', color: 'white', size: 'big', giant: 1, hp: 30 }], place: { biome: 'theater', x: H.x, z: H.z }, tb: { scene: () => false, noGlimpse: true, noQueue: true } });
  }

  // ------------------------------------------------------------ what you can press E on, and where the compass points
  function interactables() {
    const out = [], f = fl(), s = st();
    const add = (x, z, r, label, run, y) => out.push({ x, z, r, label, run, y });
    const p = id => (P(id) && P(id).g.visible ? P(id).api : null);
    if (!f.pastIn) return out;
    // the world you come back to: everyone of then has a word for you (who: for STORY.talkHooks, where time_alba.js adds its puzzles)
    if (free()) {
      for (const P0 of Object.values(A.W.people)) if (P0.g.visible && /^(crowd|band|dancer|ringer|helper|shy|rosita)/.test(P0.id)) out.push({ x: P0.api.x, z: P0.api.z, r: /^(crowd|band|dancer)/.test(P0.id) ? 1.9 : 2.4, label: 'Talk', who: 'past:' + P0.id, p: P0.api, run: () => freeChat(P0) });
      return out;
    }
    if (!f.pastBell) { const Y = p('shy'), R = p('ringer'); if (s.bellSeen && Y) add(Y.x, Y.z, 2.4, 'Tell', bellTask); else if (R) add(R.x, R.z, 2.8, 'Talk', bellScene); }
    else if (!f.pastApples) {
      const Ro = p('rosita'); if (Ro && !s.applesSeen) add(Ro.x, Ro.z, 2.6, 'Talk', applesIntro);
      if (s.applesSeen) A.SP.apples.forEach((a, i) => { if (!(s.apples || {})[a.id]) add(a.at.x, a.at.z, 2.3, `Tell ${mimoName()}`, () => appleTask(i)); });
    }
    else if (!f.pastEcho) add(-10.2, -139.4, 3.4, 'Face the shadows', echoFight);
    else if (!f.pastNames) { const R = p('ringer'); if (R) add(R.x, R.z, 3.0, s.namesSeen ? 'Tell Noa' : 'Talk', namesScene); }
    else if (!f.pastElio) { const E = p('elio'); if (E) add(E.x, E.z, 2.6, 'Talk', elioScene); }
    else if (!f.pastScene) A.SP.scenes.forEach((sp, i) => { if (!(s.scene || {})[sp.id]) add(sp.x, sp.z, 2.4, 'Remember', () => memoryTask(i)); });
    else if (!f.pastBoss) { if (!s.gate) add(GATE.x, GATE.z + 1.2, 3.2, 'Face the shadows', gateFight); else add(A.SP.theater.x, A.SP.theater.z, 2.8, 'Go in', concert, hall().y0 + 0.2); }
    else if (!f.pastReport) { const Ro = p('rosita'); if (Ro) add(Ro.x, Ro.z, 2.6, 'Report', report); }
    else if (A.W.door) add(A.W.door.at.x, A.W.door.at.z, 2.8, 'Go through the Future’s door', future);
    // small talk with the people of then (the plaza's crowd, the band, the dancing kids)
    for (const P0 of Object.values(A.W.people)) if (/^(crowd|band|dancer)/.test(P0.id) && P0.g.visible) add(P0.api.x, P0.api.z, 1.9, 'Talk', () => chat(P0));
    return out;
  }
  function target() {
    const f = fl(), s = st(), p = id => (P(id) && P(id).g.visible ? P(id).api : null), at0 = (o, hint) => (o ? { x: o.x, z: o.z, hint } : null);
    if (free()) return null;          // (the world you come back to: the quests point the way, time.js)
    if (!f.pastBell) return at0(s.bellSeen ? p('shy') : p('ringer'), '{mimo} looks up at the bell tower.');
    if (!f.pastApples) { if (!s.applesSeen) return at0(p('rosita'), '{mimo} points at a girl by the apple stall.'); const i = A.SP.apples.findIndex(a => !(s.apples || {})[a.id]); return i >= 0 ? at0(A.SP.apples[i].at, '{mimo} sniffs: an {w.apple}!') : null; }
    if (!f.pastEcho) return { x: -10.2, z: -139.4, hint: '{mimo}’s ears go flat. Shadows, by the fountain!' };
    if (!f.pastNames) return at0(p('ringer'), '{mimo} looks at the crowd round the fountain. The names!');
    if (!f.pastElio) return at0(p('elio'), '{mimo} points toward the duck pond. A boy in a red cap!');
    if (!f.pastScene) { const sp = A.SP.scenes.find(x => !(s.scene || {})[x.id]); return sp ? { x: sp.x, z: sp.z, hint: '{mimo} looks around: Noa wants to remember this.' } : null; }
    if (!f.pastBoss) return s.gate ? { x: A.SP.theater.x, z: A.SP.theater.z, hint: '{mimo} points north: the theater, lit up for the concert.' } : { x: GATE.x, z: GATE.z, hint: '{mimo} points up the north street, toward the theater.' };
    if (!f.pastReport) return at0(p('rosita'), '{mimo} points at a girl with a lantern.');
    return A.W.door ? { x: A.W.door.at.x, z: A.W.door.at.z, hint: '{mimo} stares at the cold blue door.' } : null;
  }
  const song = () => (W_song || (Sound.songs && Sound.songs.includes('past') ? 'past' : null));
  // where to stand when you come in (or load a save made here): where the story is
  function spawn() {
    const f = fl();
    if (free()) return (typeof TIME !== 'undefined' && TIME.savedAt && TIME.savedAt('past')) || A.SP.arrive;     // (a save made here, after Chapter 2: where you were)
    if (!f.pastIn || !f.pastBell) return A.SP.arrive;
    if (f.pastBoss) return { x: -11.8, z: -231.4, yaw: 0.3 };
    if (f.pastScene) return { x: -10, z: -179.5, yaw: Math.PI };
    return { x: -12.4, z: -137.8, yaw: Math.PI * 0.95 };
  }
  function update(A0, dt, t) {
    const f = fl(), s = st(), Yu = G().sim.you, W = A.W;
    if (!STORY.busy && !STORY.line && !A.busy && !G().sim.lock) {
      if (f.pastIn && !s.bellSeen && Math.hypot(Yu.x - A.SP.ringer.x, Yu.z - A.SP.ringer.z) < 7) STORY.run(bellScene);
      else if (f.pastScene && !f.pastBoss && !s.gate && !s.gateSeen && Math.hypot(Yu.x - GATE.x, Yu.z - GATE.z) < 5.5) STORY.run(gateFight);
    }
    if (W.apples) W.apples.forEach((a, i) => { if (a.g.visible && A.SP.apples[i].id === 'fountain') a.g.position.y = a.home.y + Math.sin(t * 2.2) * 0.05; if (a.g.visible) a.gl.material.opacity = 0.3 + 0.15 * Math.sin(t * 3 + i); });
    if (W.door && W.door.g.visible) { W.door.swirl.material.rotation = 0; W.door.swirl.rotation.z = t * 0.8; W.door.gl.material.opacity = 0.45 + 0.15 * Math.sin(t * 1.9); }
    if (CON && CON.glows) CON.glows.forEach((g, i) => { if (g.visible) g.material.opacity = 0.42 + 0.08 * Math.sin(t * 3 + i); });
  }
  function onInside(A0, on) {
    if (on) stage();
    else { W_song = null; A.setTod(null); if (CON) { CON.show(false); CON.cap.visible = false; CON.mist.forEach(m => { m.material.opacity = 0; }); } if (N()) N().on = false; }
    if (on && N()) N().on = !!fl().pastIn && !free();      // (after Chapter 2 her echo only shows when she speaks: at the memory's edge)
  }
  function init(A0) { A = A0; css(); try { hookBoss(); } catch (e) { console.error('[past] boss hooks', e); } }

  // ------------------------------------------------------------ test hooks: put the save at a step (es: everything before it done)
  const ORDER = ['pastIn', 'pastBell', 'pastApples', 'pastEcho', 'pastNames', 'pastElio', 'pastScene', 'gate', 'pastBoss', 'pastReport'];
  function go(step) {
    const g = G(), f = g.state.flags, s = st();
    Object.assign(f, { hatched: true, towerLost: true, oldDoor: true, bells: Math.max(8, f.bells || 0) });
    const k = ORDER.indexOf(step);
    ORDER.forEach((key, i) => { const on = k < 0 ? false : i < k; if (key === 'gate') s.gate = on; else f[key] = on; });
    if (k > 1) Object.assign(s, { bellSeen: true }); if (k > 2) Object.assign(s, { applesSeen: true, apples: { awning: true, fountain: true, cart: true } });
    if (k > 4) Object.assign(s, { namesSeen: true, names1: true, names2: true }); if (k > 5) s.elioSeen = true; if (k > 6) Object.assign(s, { remember: true, scene: { s1: true, s2: true, s3: true } });
    if (k > 8) s.concertFought = true;
    stage();
  }

  return { init, build, arrival, interactables, target, song, update, spawn, onInside, stage,
    _: { ask, grade, readMemory, card, bellScene, bellTask, applesIntro, appleTask, echoFight, namesScene, namesTasks, elioScene, elioTask, memoryTask, gateFight, concert, bossFight, afterBoss, report, future, hookBoss, PLUG, hall, buildConcert, go,
      get FX() { return FX; }, get song() { return W_song; } } };
})();

// ============================================================ the main quest's steps for the Past (a wrap of QUESTS.init, the way
// oldtower.js adds its steps): they take the place of the Old Tower's "Into the Past (coming soon!)". (future.js's own wrap runs
// after this one and adds the Future's steps at the end; its first step follows "Through the Future's door".)
(() => {
  if (typeof QUESTS === 'undefined') return;
  const init0 = QUESTS.init;
  QUESTS.init = function (game) { init0.call(this, game); try { addPast(game); } catch (e) { console.error('[quests: past]', e); } };
  function addPast(G) {
    const main = QUESTS.LIST.find(q => q.id === 'main'); if (!main || main.steps.some(s => s.past)) return;
    const fs = s => s.past || {}, n3 = o => Object.keys(o || {}).length;
    const tg = () => (typeof PAST !== 'undefined' && PAST.inside ? PAST.target() : typeof OLDTOWER !== 'undefined' && OLDTOWER.tearSpot ? OLDTOWER.tearSpot() : null);
    const shy = () => { const l = G.state.lang || 'es'; return PTXT.fill('{shy}', l); };
    const steps = [
      { past: true, text: 'Into the Past: step through the tear in the tower’s door',
        why: 'The hooded figure wound the great {w.clock} backward and flung you and {mimo} at yesterday. The tear in the old {w.tower}’s door leads there. Noa is still trapped in the {w.clock}.',
        done: s => !!s.flags.pastIn, target: tg, hint: '{mimo} looks at the tear in time, in the old {w.tower}’s door.' },
      { past: true, get text() { return `Alba, long ago: tell ${shy()} who rang the {w.bell}`; },
        why: 'It’s the morning of the Festival of Voices, many years ago. Someone just rang the {w.bell}. In the Past, everything is told as it happened: «tocó», he rang it.',
        done: s => !!s.flags.pastBell, target: tg, hint: '{mimo} looks up at the bell tower.' },
      { past: true, text: 'Help young Rosa gather her {w.apple:pl}: tell {mimo} as a memory ({n}/3)', n: s => Math.min(3, n3(fs(s).apples)),
        why: 'Young Rosa dropped her {w.apple:pl}. Here {mimo} only moves in memories: tell it what it did, «{mimo} saltó».',
        done: s => !!s.flags.pastApples, target: tg, hint: '{mimo} sniffs: {w.apple:pl}!' },
      { past: true, text: 'Shadows came through the {w.clock} with you: fight them as memories',
        why: 'The Hush’s shadows followed you into yesterday. In a fight here, every command is a memory too: «{mimo} saltó sobre el rojo».',
        done: s => !!s.flags.pastEcho, target: tg, hint: '{mimo}’s ears go flat. Shadows, by the fountain!' },
      { past: true, text: 'The Festival of Voices: the names in the plaza',
        why: 'Everyone says their name out loud, in front of the whole town. «Toda voz cuenta»: every voice counts. Then help Noa remember what happened.',
        done: s => !!s.flags.pastNames, target: tg, hint: '{mimo} looks at the crowd round the fountain.' },
      { past: true, text: 'Find Elio, the new boy, by the duck pond',
        why: 'A boy who came to Alba this winter is practicing what he’ll say tonight, at the concert. Like you, he once knew nobody here.',
        done: s => !!s.flags.pastElio, target: tg, hint: '{mimo} points toward the duck pond. A boy in a red cap!' },
      { past: true, text: 'Remember the festival for Noa: how was it? ({n}/3)', n: s => Math.min(3, n3(fs(s).scene)),
        why: 'In the present, all of this is gray and silent. Tell Noa how it was: the plaza, the {w.bell}, the people. How things were is the imperfect: «estaba», «brillaba», «cantaba».',
        done: s => !!s.flags.pastScene, target: tg, hint: '{mimo} looks around: Noa wants to remember this.' },
      { past: true, text: 'Eight o’clock: the concert at the old theater',
        why: 'The spring concert is at eight, in the Old Quarter’s theater, and Elio will speak. The north street leads there.',
        done: s => !!s.flags.pastBoss, target: tg, hint: '{mimo} points north, toward the theater.' },
      { past: true, report: 'rosita', text: '💬 Report to young Rosa outside the theater',
        why: 'Young Rosa was singing in the choir and didn’t see what happened. Tell her: what happened, and how Elio was.',
        done: s => !!s.flags.pastReport, target: tg, hint: '{mimo} points at a girl with a lantern.' },
      { past: true, pastFuture: true, text: 'Through the Future’s door',
        why: 'You couldn’t change the past, but now you understand it. The great {w.clock} opened another door: the Future, what will happen if nobody speaks.',
        done: s => !!(s.flags.futureIn || s.flags.futureDone || (s.future && s.future.arrived)), target: tg, hint: '{mimo} stares at the cold blue door.' },
    ];
    const k = main.steps.findIndex(s => s.oldtower && /into the past/i.test(String(s.text || '')));
    if (k >= 0) main.steps.splice(k, 1, ...steps); else main.steps.push(...steps);
    main.story.push(
      { when: s => !!s.flags.pastIn, text: 'The great {w.clock} threw you into yesterday: Alba, long ago, on the morning of the last Festival of Voices. From inside the {w.clock}, Noa’s echo found you there.' },
      { when: s => !!s.flags.pastElio, text: 'You met Elio, a boy new in Alba. When he came, he knew nobody and was scared, like you once. Tonight he would thank the town in its own language.' },
      { when: s => !!s.flags.pastBoss, text: 'At the concert, Elio said one word wrong, and the whole town laughed. He ran off into the night, his red cap left on the stage, and never spoke again. In that silence, the Hush was born. The hooded figure is Elio.' },
      { when: s => !!s.flags.pastReport, text: 'Young Rosa didn’t laugh. She went to look for him with her lantern. You couldn’t change what happened, but now you understand it. The {w.clock} opened another door: the Future.' });
  }
})();
