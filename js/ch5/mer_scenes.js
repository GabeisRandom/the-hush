'use strict';
// Chapter 5, «Meridiana», wave 1 (CH5-W1): the story, the people on the pads, the main quest's steps and the side quests.
//   Alba: Noa's news by the duck pond (after the credits) → the ticket office (mer_train.js) → the train home.
//   Barrio del Faro: the noise at the station; Noa can't make herself heard, so you do the talking; Ollie on the corner; the first
//   bullicios (the rule, taught before any boss); home (Mom, Dad, Ollie: whole English); Don Celestino's pet shop; the tram.
//   Ciudad Universitaria: Student Services (take a number, enroll Noa in «usted»), the transcript at the library (the Murmullos, Rocío,
//   the envelope), the passive to explain it, the welcome lecture and el Megáfono, Noa's welcome talk (you give it). Side: Iván's
//   notebook (the passive), tutoring Iván (a process in order).
//   Mercado del Puerto: Dad's kettle (you translate for him, formally), el Gran Pregón. Side: the fish quarrel (say what each one
//   means), Lupita's scale. Home: what the family says.
// State (G.state.ch5): news, tix, arrived, arrSeen, street, noise1, home, card, stopsOpen, uniArr, uni { called, enroll1, lib, env,
// enrolled, meg, talk }, home2, mk { kettle, boss, fish, scale }, home3, pet, ivan, tutor, noaWith, dadWith.
const MERS = (() => {
  if (typeof MER === 'undefined' || !MER || typeof DIN === 'undefined' || !DIN) return null;
  let G = null;
  const X = () => MERTXT, S = () => MER.S(), lang = () => MER.lang(), plainT = s => MER.plainT(s);
  const uni = () => (S().uni = S().uni || {}), mk = () => (S().mk = S().mk || {});
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const snd = k => { try { Sound.play(k); } catch (e) { /* */ } };
  const tickQ = () => { try { QUESTS.tick(); } catch (e) { /* */ } };
  const coins = n => { G.state.coins = (G.state.coins || 0) + n; try { UI.toast(`+${n} 🪙`); } catch (e) { /* */ } };
  const run = fn => STORY.run(async () => { try { await fn(); } catch (e) { console.error('[mer scenes]', e); } finally { MER.lock(false); } });
  // ------------------------------------------------------------ the people on each pad (made when the pad is built; shown by the story)
  const P = {};
  const who = (k, pad, at, o) => { const key = pad + ':' + (o && o.key || k); return (P[key] = P[key] || MER.person(k, pad, at, o)); };
  function cast(pad) {
    const b = MER.built(pad); if (!b) return;
    const sp = b.spots, st = S(), u = uni(), m = mk();
    if (pad === 'centro') {
      const ol = who('ollie', 'centro', { x: 2.4, z: 6.2, yaw: Math.PI }); MER.show(ol, !!st.arrSeen && !st.home);
      const ce = who('celes', 'centro', { x: sp.pet.x - 1.2, z: sp.pet.z + 0.4, yaw: Math.PI / 2 }); ce.story = true; MER.show(ce, !!st.home);
      ['a', 'b', 'c', 'd'].forEach((k, i) => { const p = who('noa', 'centro', { x: -8 + (i % 2) * 3.2, z: -16 + (i >> 1) * 2.6, yaw: i }, { key: 'crowd' + k, look: CROWD[i] }); p.crowd = i; p.still = true; Object.defineProperty(p.api, 'name', { get: () => '…', configurable: true }); });
    }
    if (pad === 'casa') {
      for (const k of ['mom', 'dad', 'ollie']) { const p = who(k, 'casa', sp[k]); p.story = true; MER.show(p, true); }
      const dd = P['casa:dad']; MER.show(dd, !st.dadWith || !!st.home3);
    }
    if (pad === 'uni') {
      const o = who('ortega', 'uni', sp.ortega); o.story = true; MER.show(o, !!u.called);
      const ib = who('ibarra', 'uni', { x: sp.stage.x, z: sp.stage.z, yaw: Math.PI }); ib.story = true; MER.show(ib, true);
      const ro = who('rocio', 'uni', sp.rocio); ro.story = true; MER.show(ro, !!u.lib);
      const iv = who('ivan', 'uni', sp.ivan); iv.story = true; MER.show(iv, !!u.enroll1);
    }
    if (pad === 'puerto') {
      who('ramon', 'puerto', sp.ramon).story = true; who('mari', 'puerto', sp.mari).story = true; who('lupita', 'puerto', sp.lupita).story = true;
      const pi = who('pilar', 'puerto', { x: sp.mari.x + 1.6, z: sp.mari.z + 1.4, yaw: -2.2 }); MER.show(pi, !m.fish);
    }
  }
  const CROWD = [{ skin: '#d9a87e', hair: '#2e2420', hairdo: 'short', dress: '#c9443a', vest: '#e8dcc0', h: 1.02 }, { skin: '#f0c9a2', hair: '#8a4a2a', hairdo: 'bun', dress: '#3f7fc4', h: 0.96 },
    { skin: '#c98e62', hair: '#1f1a18', hairdo: 'tails', dress: '#f2c94c', vest: '#5a7fb8', h: 0.94 }, { skin: '#e9c3a6', hair: '#cfc8c0', hairdo: 'bald', dress: '#5f7f4a', h: 1.0, hat: 'flat', hatColor: '#5f4a3a' }];
  // ------------------------------------------------------------ Noa (and Dad) walking with you in the city
  let fol = {};
  function follower(k, on, dt, t) {
    const pad = MER.cur; if (!pad) return;
    let F = fol[k];
    if (!on) { if (F && F.p) MER.show(F.p, false); return; }
    if (!F || F.pad !== pad) {
      const Y = G.sim.you, p0 = MER.PADS[pad];
      const p = who(k, pad, { x: Y.x - p0.x + 1.2, z: Y.z - p0.z + 1.2, yaw: Y.yaw }, { key: 'with-' + k }); p.story = true;
      MER.show(p, true); F = fol[k] = { p, pad, v: 0, side: k === 'dad' ? -1 : 1 };
    }
    const Y = G.sim.you, a = F.p.api, side = F.side;
    const tx = Y.x - Math.sin(Y.yaw) * 1.7 + Math.cos(Y.yaw) * 1.1 * side, tz = Y.z - Math.cos(Y.yaw) * 1.7 - Math.sin(Y.yaw) * 1.1 * side;
    const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz);
    if (d > 12) { MER.place(F.p, { x: tx - MER.PADS[pad].x, z: tz - MER.PADS[pad].z }); return; }
    if (d > 0.35 && !a.talking) {
      const sp = Math.min(6.5, d * 2.4), nx = a.x + dx / d * sp * dt, nz = a.z + dz / d * sp * dt;
      MER.place(F.p, { x: nx - MER.PADS[pad].x, z: nz - MER.PADS[pad].z });
      F.p.g.rotation.y = dampAngle(F.p.g.rotation.y, Math.atan2(dx, dz), 8, dt);
      F.p.body.position.y = Math.abs(Math.sin(t * 9)) * 0.05;
    }
  }
  const noa = () => { const F = fol.noa; return F && F.pad === MER.cur ? F.p : null; };
  const dad = () => { const F = fol.dad; return F && F.pad === MER.cur ? F.p : null; };
  // ------------------------------------------------------------ the main quest's steps (after the finale's last: «The valley is yours»)
  const st = s => s.ch5 || {};
  const U2 = s => st(s).uni || {}, M2 = s => st(s).mk || {};
  // a target on a pad (pad coordinates): there when you're on it; otherwise the tram stop (or the door, at home); from Alba, the train
  function T(pad, x, z, hint) {
    return () => {
      if (!MER.inside) { if (!st(G.state).tix) return null; const tr = G.w3d.train; return { x: tr.here ? tr.car.x : 2.2, z: 64.5, hint: '{mimo} looks down the line. Meridiana is that way, by train.' }; }
      const cur = MER.cur, b = MER.BUILT[cur], p0 = MER.PADS[cur];
      if (cur === pad) return { x: p0.x + x, z: p0.z + z, hint: X().q(hint, lang()) };
      if (cur === 'casa') return { x: p0.x + b.spots.door.x, z: p0.z + b.spots.door.z, hint: '{mimo} waits by the front door.' };
      if (pad === 'casa' && cur === 'centro') return { x: p0.x + b.spots.home.x, z: p0.z + b.spots.home.z, hint: '{mimo} trots to the green door: number 12.' };
      const s0 = b.spots.stop; return { x: p0.x + s0.x, z: p0.z + s0.z, hint: '{mimo} hops onto the tram platform.' };
    };
  }
  const noaPond = () => { try { const N = FIN._.buildPost().noa; return { x: N.api.x, z: N.api.z, hint: '{mimo} points to the duck pond. Noa is waving a letter!' }; } catch (e) { return { x: 7.2, z: -172.4 }; } };
  const STEPS = [
    { c5: 'news', text: 'Noa has news: find her by the duck pond', why: 'Noa is by the duck pond, waving an envelope. Something has happened.', done: s => !!st(s).news, target: noaPond, hint: '{mimo} points to the duck pond. Noa is waving!' },
    { c5: 'tix', text: 'Get the tickets at Alba’s station (speak formally)', why: 'The University of Meridiana paid for two train tickets. Exchange the letter for them at the ticket office: the clerk says «{usted}», so you do too.', done: s => !!st(s).tix,
      target: () => { const H = WORLD.L.stationHouse; return { x: H.x + 0.4, z: H.z + H.d / 2 + 0.9, hint: '{mimo} runs down the road south, to the station. The ticket office is open!' }; } },
    { c5: 'train', text: 'Take the train to Meridiana with Noa', why: 'Noa is waiting on the platform. Meridiana: your hometown, and her new university.', done: s => !!st(s).arrived, target: () => ({ x: G.w3d.train.here ? G.w3d.train.car.x : 2.2, z: 64.5, hint: '{mimo} bounces on the platform. The train!' }) },
    { c5: 'street', text: 'Your old street: {street}', why: 'Home is down {street}, south of the station’s plaza. In this noise, nobody hears Noa: you’ll have to do the talking.', done: s => !!st(s).street, target: T('centro', 0, 3, '{mimo} trots down {street}.') },
    { c5: 'noise1', text: 'The {dins} on {street}: say it another way', why: 'Ollie’s trick: {dins} shout back whatever they hear. Never the same words twice: another verb, another way to say which one, {askEx}.', done: s => !!st(s).noise1, target: T('centro', 0, 6, '{mimo} growls at the {dins}.') },
    { c5: 'home', text: 'Go home: {home}, the green door', why: 'Your family is waiting. Mom, Dad and Ollie: home speaks English.', done: s => !!st(s).home, target: T('casa', 0, 0, '{mimo} trots to the green door: number 12.') },
    { c5: 'tram', text: 'Take the tram to {uni} with Noa', why: 'Line 2 leaves from the stop by the station. Ollie’s old card needs a top-up at the machine first.', done: s => !!st(s).uniArr, target: () => { const t = T('centro', 26, -11, '{mimo} hops to the tram stop.')(); if (MER.cur === 'centro' && !st(G.state).card) { const p0 = MER.PADS.centro, b = MER.BUILT.centro; return { x: p0.x + b.spots.machine.x, z: p0.z + b.spots.machine.z, hint: '{mimo} sniffs the card machine.' }; } return t; } },
    { c5: 'enroll', text: 'Student Services: take a number and enroll Noa (use «{usted}»)', why: 'Noa freezes at counters. You grew up with this city’s offices all around you: take a number, wait for your window, and do the talking. Formally.', done: s => !!U2(s).enroll1, target: () => T('uni', U2(G.state).called ? -23 : -21.6, U2(G.state).called ? -6 : 8.4, '{mimo} points at Student Services’ arcade.')() },
    { c5: 'transcript', text: 'Find Noa’s transcript at the library', why: 'It was sent on Monday but never reached Student Services. The internal mail goes to the library.', done: s => !!U2(s).env, target: T('uni', 18.4, -9.2, '{mimo} points at the library’s steps.') },
    { c5: 'report', text: 'Tell Student Services what happened to the transcript', why: 'Back to window three: explain what happened, in the passive ({passiveEx}).', done: s => !!U2(s).enrolled, target: T('uni', -23, -6, '{mimo} points back at Student Services.') },
    { c5: 'lecture', text: 'The welcome lecture at the open-air theater', why: 'Professor Ibarra’s welcome lecture is at noon, in the open-air theater. Find a seat.', done: s => !!U2(s).meg, target: T('uni', -21, 16.4, '{mimo} points at the open-air theater.') },
    { c5: 'talk', text: 'Introduce Noa to the new students', why: 'Noa froze. You know her, and now you know the words: introduce her, in three or four sentences.', done: s => !!U2(s).talk, target: T('uni', -21, 16.4, '{mimo} looks at the stage.') },
    { c5: 'home2', text: 'Go home and tell your family', why: 'Noa is enrolled. Your family wants to hear everything (and Dad is still thinking about his kettle).', done: s => !!st(s).home2, target: T('casa', 0, 0, '{mimo} heads for home.') },
    { c5: 'kettle', text: '{puerto}: return Dad’s kettle (speak formally)', why: 'Dad has the kettle and the receipt. You translate: his English to {ramon}, {ramon}’s {langName} to him. Politely, with the conditional.', done: s => !!M2(s).kettle, target: T('puerto', -8.2, -8, '{mimo} points at the stall with the blue awning.') },
    { c5: 'pregon', text: 'The market’s noise: {preg}', why: 'Every price in the market shouted at once, piled into a tower. Say it another way.', done: s => !!M2(s).boss, target: T('puerto', -2, 0, '{mimo} growls at the middle of the hall.') },
    { c5: 'home3', text: 'Home: tell your family how it went', why: 'Dad has a new kettle, and the market is listening again. Mom wants to talk to you.', done: s => !!st(s).home3, target: T('casa', 0, 0, '{mimo} heads for home.') },
    { c5: 'more', text: 'Meridiana is yours (for now)', why: 'Noa is enrolled, Dad has his kettle, and the noise is quieter on your street, at the university and at the market. More of the city opens soon: the hospital, the newsroom, the rooftop gardens and city hall. Until then: ride the tram, help people, and listen.', done: () => false, target: () => null, hint: '{mimo} looks out over the city.' },
  ];
  STEPS.forEach(s0 => { s0._fdone = s0.done; });
  const STORY_L = [
    { when: s => !!st(s).arrived, text: 'After the speech, Noa got into the University of Meridiana, and you went with her, by train: back to the city where you grew up and never really listened. Your family still lives there, in a bubble of English.' },
    { when: s => !!U2(s).talk, text: 'At the university you enrolled Noa in your most formal voice, tracked down her lost transcript, quieted {meg}, and introduced her to everyone. In Alba she spoke for you. Here, you spoke for her.' },
    { when: s => !!st(s).home3, text: 'At the harbor market you translated for Dad and got his kettle exchanged, and the market’s noise came down. Mom asked you to help them learn more than «{hola}».' },
  ];
  const SIDES = [
    { id: 'mer.pet', kind: 'side', title: 'The old pet shop', giver: '{celes}, Meridiana', started: s => !!st(s).home,
      steps: [{ text: 'Visit {pet} on {street}', why: 'The pet shop where you bought Mimo’s egg is still there.', done: s => !!st(s).pet, target: T('centro', -7.4, -4.0, '{mimo} sniffs at the pet shop’s door.') }] },
    { id: 'mer.notebook', kind: 'side', title: '{ivan}’s lost notebook', giver: '{ivan}, Meridiana', started: s => !!st(s).ivan,
      steps: [{ text: 'Find {ivan}’s green lab notebook', why: 'He has an exam tomorrow. Did someone leave it at the café?', done: s => ['found', 'done'].includes(st(s).ivan), target: T('uni', 20, 17, '{mimo} sniffs the café’s tables.') },
        { text: 'Tell {ivan} where it was found (the passive)', why: '{foundEx}', done: s => st(s).ivan === 'done', target: T('uni', 18.2, -23.6, '{mimo} points at the science building.') }] },
    { id: 'mer.tutor', kind: 'side', title: 'Tutoring {ivan}', giver: '{ivan}, Meridiana', started: s => st(s).ivan === 'done',
      steps: [{ text: 'Explain the echo experiment to {ivan}, step by step', why: '{seqEx}.', done: s => !!st(s).tutor, target: T('uni', 18.2, -23.6, '{mimo} points at the science building.') }] },
    { id: 'mer.fish', kind: 'side', title: 'Fish and patience', giver: '{mari}, Meridiana', started: s => !!M2(s).kettle,
      steps: [{ text: 'Help {mari} and {pilar} hear each other', why: 'Both talk at once. Tell each one what the other means, in other words.', done: s => !!M2(s).fish, target: T('puerto', -8.4, 6, '{mimo} looks at the fish stall.') }] },
    { id: 'mer.scale', kind: 'side', title: '{lupita}’s scale', giver: '{lupita}, Meridiana', started: s => !!M2(s).kettle,
      steps: [{ text: 'Buy a kilo of mangoes at {lupita}’s stall', why: 'Her scale looks a little generous… to her.', done: s => !!M2(s).scale, target: T('puerto', 4.3, -6, '{mimo} sniffs the mangoes.') }] },
  ];
  // (their words in the save's language: a slot in a text makes it a getter, MERTXT.q at the moment it's shown)
  const SLOT = /\{(?!mimo\})[A-Za-z]+(?::[A-Za-z0-9.]+)?\}/;
  const slots = (o, ...fs) => { for (const f of fs) { const raw = o[f]; if (typeof raw === 'string' && SLOT.test(raw)) Object.defineProperty(o, f, { get: () => X().q(raw, lang()), enumerable: true, configurable: true }); } return o; };
  STEPS.forEach(s0 => slots(s0, 'text', 'why', 'hint')); STORY_L.forEach(s0 => slots(s0, 'text'));
  SIDES.forEach(sd => { slots(sd, 'title', 'giver'); sd.steps.forEach(s0 => slots(s0, 'text', 'why')); });
  function hookQuests() {
    if (typeof FIN === 'undefined' || !FIN.STEPS) return;
    const end = FIN.STEPS.find(s0 => s0.fin === 'end');
    if (end && !end._mer) { end._mer = true; const d0 = end.done; end.done = s => !!d0(s) || !!(s.ch4 && s.ch4.fin && s.ch4.fin.credits); end._fdone = end.done; }
    if (typeof CH4 !== 'undefined' && CH4.FINALE && !CH4.FINALE.some(s0 => s0.c5)) { CH4.FINALE.push(...STEPS); if (CH4.FINALE_STORY) CH4.FINALE_STORY.push(...STORY_L); }
    try { const main = QUESTS.LIST.find(q => q.id === 'main'); if (main && end && main.steps.includes(end) && !main.steps.some(s0 => s0.c5)) { main.steps.splice(main.steps.indexOf(end) + 1, 0, ...STEPS); main.story.push(...STORY_L); } } catch (e) { /* */ }
    try {
      const main = QUESTS.LIST.find(q => q.id === 'main');
      if (main && !main._mer) { main._mer = true; const t0 = main.title; Object.defineProperty(main, 'title', { get: () => (G && G.state && G.state.ch4 && G.state.ch4.fin && G.state.ch4.fin.credits ? 'Meridiana' : t0), set() {}, configurable: true }); }
      for (const q of SIDES) if (!QUESTS.LIST.some(x => x.id === q.id)) QUESTS.LIST.push(q);
    } catch (e) { console.error('[mer] quests', e); }
  }
  hookQuests();
  // ------------------------------------------------------------ Alba: Noa's news by the duck pond
  async function newsScene() {
    const N = FIN._.buildPost().noa; if (!N) return;
    MER.lock(true);
    G.cam.override = { pos: V(N.api.x + 3.6, N.api.y + 2.2, N.api.z + 3.4), look: V(N.api.x, N.api.y + 1.15, N.api.z), dur: 0.9 };
    await MER.say(N, 'news.call'); await MER.say(N, 'news.1');
    await MER.card(X().CARDS.letter);
    await MER.say(N, 'news.2'); await MER.say(N, 'news.3');
    await MER.you('you.news1'); await MER.say(N, 'news.4'); await MER.you('you.news2'); await MER.say(N, 'news.5');
    S().news = true; MER.save(); MER.lock(false); tickQ();
    MER.think('think.news', 6);
  }
  const ALBA = {
    tick() {
      if (!G || MER.inside || S().news || !(G.state.ch4 && G.state.ch4.fin && G.state.ch4.fin.credits) || STORY.busy) return;
      if (typeof TIME !== 'undefined' && TIME.world && TIME.world() !== 'now') return;
      let N = null; try { N = FIN._.buildPost().noa; } catch (e) { return; }
      if (N && N.g.visible && Math.hypot(G.sim.you.x - N.api.x, G.sim.you.z - N.api.z) < 6) run(newsScene);
    },
  };
  // ------------------------------------------------------------ Barrio del Faro: the arrival, Ollie, the first bullicios
  async function arrival() {
    S().arrSeen = true; S().noaWith = true; MER.save();
    cast('centro');
    MER.lock(true);
    MER.shot([6, 4.2, -18], [0, 1.4, -24], 1.0);
    await MER.wait(0.4);
    const C = ['a', 'b', 'c'].map(k => P['centro:crowd' + k]);
    for (let i = 0; i < 3; i++) if (C[i]) await MER.say(C[i], 'crowd.' + (i + 1));
    const N = noa() || who('noa', 'centro', { x: 2.4, z: -24.5, yaw: Math.PI });
    await MER.say(N, 'arr.1'); await MER.say(N, 'arr.2');
    MER.think('think.arr', 6); await MER.wait(1.2);
    await MER.say(N, 'arr.3');
    MER.lock(false); tickQ();
  }
  async function ollieScene() {
    const ol = P['centro:ollie']; if (!ol) return;
    MER.lock(true);
    MER.show(ol, true); MER.place(ol, { x: 2.0, z: 6.4, yaw: Math.PI });
    MER.shot([7, 3.4, 0.5], [1, 1.2, 5.2], 0.9);
    await MER.say(ol, 'ollie.hey');
    await MER.talk('ollie', ol);
    await MER.fam(ol, 'ollie.en1'); await MER.fam(ol, 'ollie.en2');
    const N = noa(); if (N) await MER.say(N, 'noa.ollie');
    S().street = true; MER.save(); tickQ();
    MER.shot([5, 3.8, -2], [0, 1, 7.5], 0.8);
    await MER.fam(ol, 'ollie.din1'); if (N) await MER.say(N, 'noa.din'); await MER.fam(ol, 'ollie.din2');
    MER.lock(false);
    const r = await DIN.battle('faro');
    if (r && r.outcome === 'win') { S().noise1 = true; MER.save(); tickQ(); MER.lock(true); await MER.fam(ol, 'ollie.won'); MER.lock(false); }
    else MER.think('think.din', 5);
  }
  DIN.group('faro', { pad: 'centro', x: 0, z: 9, story: true, hp: 6, foes: [{ color: 'red' }, { color: 'blue' }], show: s => !!s.street && !s.noise1 });
  DIN.group('plaza', { pad: 'centro', x: -8, z: -15, foes: [{ color: 'yellow' }, { color: 'green' }, { color: 'red' }], show: s => !!s.home });
  DIN.group('quad', { pad: 'uni', x: -12, z: -4, foes: [{ color: 'blue' }, { color: 'yellow' }], show: s => !!s.uniArr });
  DIN.group('library', { pad: 'uni', x: 16.4, z: -9.4, story: true, hp: 5, foes: [{ color: 'white' }, { color: 'white' }, { color: 'blue' }], show: s => !!(s.uni && s.uni.enroll1 && !s.uni.lib) });
  DIN.group('quay', { pad: 'puerto', x: -20, z: 24, foes: [{ color: 'green' }, { color: 'red' }], show: s => !!s.home2 });
  DIN.group('office', { pad: 'puerto', x: 24, z: -12, foes: [{ color: 'yellow' }, { color: 'blue' }, { color: 'white' }], show: s => !!(s.mk && s.mk.kettle) });
  // ------------------------------------------------------------ home: the family (whole English)
  async function homeScene() {
    cast('casa');
    const m = P['casa:mom'], d = P['casa:dad'], o = P['casa:ollie'], b = MER.BUILT.casa;
    const n = who('noa', 'casa', b.spots.noa); n.story = true; MER.show(n, true);
    MER.lock(true);
    MER.shot([0.5, 3.2, 6.2], [0, 1.0, -0.4], 0.9);
    await MER.fam(m, 'home.mom1'); await MER.fam(m, 'home.mom2'); await MER.fam(d, 'home.dad1'); await MER.fam(o, 'home.ollie1');
    await MER.fam(d, 'home.dad2'); await MER.fam(d, 'home.dad3'); await MER.fam(m, 'home.mom3'); await MER.you('you.home');
    await MER.fam(n, 'home.noa1'); await MER.fam(m, 'home.mom4'); await MER.fam(d, 'home.dad4');
    await UI.fade(1, 700);
    await MER.card({ tag: { en: 'That night' }, en: X().L['home.night'].en, es: X().L['home.night'].en, pt: X().L['home.night'].en, de: X().L['home.night'].en, zh: X().L['home.night'].en, ja: X().L['home.night'].en });
    await UI.fade(0, 700);
    await MER.fam(o, 'home.ollie2');
    MER.show(n, false);
    S().home = true; (S().stopsOpen = S().stopsOpen || {}).uni = true; MER.save(); tickQ();
    MER.lock(false);
  }
  async function home2Scene() {
    cast('casa');
    const m = P['casa:mom'], d = P['casa:dad'], o = P['casa:ollie'], b = MER.BUILT.casa, n = who('noa', 'casa', b.spots.noa); MER.show(n, true);
    MER.lock(true); MER.shot([0.5, 3.2, 6.2], [0, 1.0, -0.4], 0.9);
    await MER.fam(m, 'home2.mom'); await MER.fam(n, 'home2.noa'); await MER.fam(d, 'home2.dad'); await MER.fam(o, 'home2.ollie');
    MER.show(n, false);
    S().home2 = true; S().noaWith = false; S().dadWith = true; (S().stopsOpen = S().stopsOpen || {}).puerto = true; MER.save(); tickQ();
    MER.lock(false);
  }
  async function home3Scene() {
    cast('casa');
    const m = P['casa:mom'], d = P['casa:dad'], o = P['casa:ollie'];
    MER.show(d, true);
    MER.lock(true); MER.shot([0.5, 3.2, 6.2], [0, 1.0, -0.4], 0.9);
    await MER.fam(m, 'home3.mom'); await MER.fam(d, 'home3.dad'); await MER.fam(m, 'home3.mom2'); await MER.fam(o, 'home3.ollie'); await MER.you('home3.you');
    S().home3 = true; S().dadWith = false; MER.save(); tickQ();
    MER.lock(false);
  }
  const CHAT = { mom: ['home.chat.mom', 'home.chat.mom2'], dad: ['home.chat.dad', 'home.chat.dad2'], ollie: ['home.chat.ollie', 'home.chat.ollie2'] };
  const chatN = {};
  async function homeChat(k) { const p = P['casa:' + k]; if (!p) return; MER.lock(true); const L0 = CHAT[k]; await MER.fam(p, L0[(chatN[k] = (chatN[k] || 0) + 1) % L0.length]); MER.lock(false); }
  // ------------------------------------------------------------ the pet shop: Don Celestino and the blue egg
  async function petScene() {
    const c = P['centro:celes']; if (!c) return;
    MER.lock(true); MER.shot([-3, 2.6, -6.5], [-7.4, 1.2, -4.0], 0.9);
    if (!S().pet) {
      await MER.say(c, 'cel.1');
      try { snd('chirp'); G.sim.mimoSay('!!', 1.4); } catch (e) { /* */ }
      MER.think('think.cel', 5); await MER.wait(0.8);
      await MER.talk('celes', c);
      await MER.say(c, 'cel.2'); await MER.you('you.cel'); await MER.say(c, 'cel.3'); await MER.say(c, 'cel.4'); await MER.say(c, 'cel.5');
      S().pet = true; coins(5); MER.save(); tickQ();
    } else await MER.say(c, 'cel.chat');
    MER.lock(false);
  }
  // ------------------------------------------------------------ the tram's card machine (read its menu)
  async function machine() {
    const l = lang(), L = k => { const x = X().line(k, l); return plainT(x.t) || x.en; };
    for (;;) {
      const v = await UI.choose(L('tram.m.title'), [{ label: L('tram.m.buy'), value: 'buy' }, { label: L('tram.m.top'), value: 'top' }, { label: L('tram.m.bal'), value: 'bal' }]);
      if (v === null) return false;
      if (v === 'top') { S().card = true; MER.save(); try { UI.toast('🎫 ' + L('tram.m.ok')); } catch (e) { /* */ } snd('chime'); try { DICT.log('read', 3, 1); } catch (e) { /* */ } return true; }
      if (v === 'bal') { try { UI.toast(L('tram.m.bal0')); } catch (e) { /* */ } continue; }
      MER.think('think.tramBuy', 4); await MER.wait(0.3);
    }
  }
  async function takeTram() { if (!S().card) { if (!(await machine())) return; } await MER.tram.ride(); }
  // ------------------------------------------------------------ the university
  async function uniArrive() {
    S().uniArr = true; MER.save(); tickQ();
    const N = noa(); if (!N) return;
    MER.lock(true); MER.shot([4, 4.5, 24], [0, 8, -20], 1.0);
    await MER.say(N, 'uni.arr1'); await MER.say(N, 'uni.arr2');
    MER.lock(false);
  }
  async function takeNumber() {
    const u = uni(); if (u.called) return;
    MER.lock(true);
    await MER.card(X().CARDS.turnTicket);
    const b = MER.BUILT.uni, p0 = MER.PADS.uni, sp = { api: { x: p0.x - 24.6, y: p0.y + 3.6, z: p0.z - 9, top: 0.2, name: plainT(X().name('speaker', lang())) } };
    snd('chime');
    try { UI.speak(plainT(X().line('uni.turn', lang()).t)); } catch (e) { /* */ }
    await MER.say(sp, 'uni.turn', { whole: true });
    const q = X().line('uni.turnQ', lang()), v = await UI.choose(plainT(q.t) || q.en, [1, 2, 3, 4].map(n => ({ label: String(n), value: n })));
    try { DICT.log('listen', 3, v === 3 ? 1 : 0); } catch (e) { /* */ }
    MER.think(v === 3 ? 'think.turn' : 'think.turnNo', 5);
    u.called = true; MER.save(); cast('uni');
    MER.lock(false);
  }
  async function ortegaTalk() {
    const u = uni(), o = P['uni:ortega']; if (!o) return;
    MER.lock(true); MER.shot([-19, 2.6, -3.5], [-25.2, 1.4, -6], 0.8);
    if (!u.enroll1) { const r = await MER.talk('enroll', o); if (r && !r.quit) { u.enroll1 = true; MER.save(); tickQ(); cast('uni'); } }
    else if (u.env && !u.enrolled) {
      const r = await MER.talk('report', o);
      if (r && !r.quit) { u.enrolled = true; MER.save(); tickQ(); const N = noa(); if (N) await MER.say(N, 'noa.enrolled'); }
    } else await MER.say(o, u.enrolled ? 'report.what.r' : 'enroll.miss.r');
    MER.lock(false);
  }
  async function cartScene() {
    const u = uni(); if (u.lib) return;
    MER.think('think.din', 4);
    const r = await DIN.battle('library');
    if (r && r.outcome === 'win') { u.lib = true; MER.save(); cast('uni'); }
  }
  async function rocioTalk() {
    const u = uni(), ro = P['uni:rocio']; if (!ro) return;
    MER.lock(true); MER.shot([16.5, 2.6, -6], [20.6, 1.3, -12.4], 0.8);
    if (!u.env) { const r = await MER.talk('rocio', ro); if (r && !r.quit) { await MER.card(X().CARDS.envelope); u.env = true; MER.save(); tickQ(); } }
    else await MER.say(ro, 'rocio.env.r');
    MER.lock(false);
  }
  // the welcome lecture, el Megáfono, and Noa's welcome talk (you give it)
  async function lecture() {
    const u = uni(), ib = P['uni:ibarra'], b = MER.BUILT.uni, TH = b.spots.theater; if (!ib) return;
    MER.lock(true);
    if (!u.meg) {
      MER.shot([TH.x + 4, 3.0, TH.z + 3], [TH.x, 1.6, TH.z - 5.4], 1.0);
      for (const k of ['ibarra.1', 'ibarra.2', 'ibarra.3', 'ibarra.4']) await MER.say(ib, k);
      b.crowd[2].on = 1; snd('wrong');
      const p0 = MER.PADS.uni, mg = { api: { x: p0.x + TH.x, y: p0.y + 2.8, z: p0.z + TH.z - 1, top: 0.4, name: plainT(X().pick(X().NAMES.meg, lang())) } };
      await MER.say(mg, 'meg.1', { whole: true });
      MER.lock(false);
      const r = await DIN.fight([{ kind: 'din_meg', color: 'white', size: 'big', hp: 22 }, { kind: 'din', color: 'red', hp: 5 }, { kind: 'din', color: 'yellow', hp: 5 }], { boss: 'din_meg' });
      MER.lock(true);
      if (!r || r.outcome !== 'win') { MER.think('think.din', 5); MER.lock(false); return; }
      b.crowd[2].on = 0; u.meg = true; MER.save(); tickQ();
      MER.shot([TH.x + 4, 3.0, TH.z + 3], [TH.x, 1.6, TH.z - 5.4], 0.9);
      await MER.say(ib, 'ibarra.5');
    }
    if (!u.talk) {
      await MER.say(ib, 'ibarra.6');
      const N = noa(); if (N) await MER.say(N, 'noa.freeze');
      MER.think('think.talk', 5); await MER.wait(0.6);
      const letter = await speech();
      u.talk = letter || 'C'; MER.save(); tickQ();
      snd('chest');
      if (N) await MER.say(N, 'noa.thanks');
    }
    MER.lock(false);
  }
  // the short talk: four points, each a TALK want, graded like a writing task (EXAM.grade.write); the frame, the model on «?»
  async function speech() {
    const l = lang(), pts = X().TALKPTS[l] || X().TALKPTS.es, fr = X().line('talk.frame', l), md = X().line('talk.model', l);
    let tries = 0;
    for (;;) {
      const r = await UI.command({ name: G.state.mimoName || 'Mimo', icon: 'star', title: 'Introduce Noa to everyone (three or four sentences)', verbs: [], model: md.t, modelEn: md.en, placeholder: plainT(fr.t), hint: 'Who she is · where she’s from · what she’ll study, and why · what you ask of them' });
      if (!r || r.cancelled) { MER.think('think.talk', 4); await MER.wait(0.3); continue; }
      let g = null; try { g = EXAM.grade.write(r.text, { points: pts.map(p => ({ want: p.want })), min: 14, max: 80 }, 4, l); } catch (e) { console.error('[mer] speech', e); }
      const met = g ? g.points.filter(Boolean).length : 4, k = g ? g.score / g.max : 0.9;
      const letter = k >= 0.85 ? 'S' : k >= 0.7 ? 'A' : k >= 0.55 ? 'B' : k >= 0.4 ? 'C' : 'D';
      try { DICT.log('write', 4, k); } catch (e) { /* */ }
      if (met >= 3 || tries >= 2) { try { UI.toast(`${tries >= 2 && met < 3 ? 'D' : letter} · your welcome talk${g && g.tips && g.tips[0] ? ' · ' + g.tips[0] : ''}`); } catch (e) { /* */ } return tries >= 2 && met < 3 ? 'D' : letter; }
      tries++;
      const miss = pts.filter((p, i) => g && !g.points[i]).map(p => p.en).join(', ');
      STORY.think(`Almost: say ${miss}. (? shows a whole model.)`, 6); await MER.wait(0.4);
    }
  }
  // Iván: his notebook, then tutoring
  async function ivanTalk() {
    const iv = P['uni:ivan']; if (!iv) return;
    const s = S();
    MER.lock(true); MER.shot([21.5, 2.4, -20.5], [18.2, 1.2, -24.6], 0.8);
    if (!s.ivan) { await MER.say(iv, 'ivan.lost'); s.ivan = 'asked'; MER.save(); }
    else if (s.ivan === 'asked') await MER.say(iv, 'ivan.lost');
    else if (s.ivan === 'found') { const r = await MER.talk('ivan', iv); if (r && !r.quit) { s.ivan = 'done'; coins(10); MER.save(); } }
    else if (!s.tutor) { await MER.say(iv, 'ivan.ask'); const r = await MER.talk('tutor', iv); if (r && !r.quit) { s.tutor = true; coins(15); MER.save(); } }
    else await MER.say(iv, 'tutor.how.r');
    tickQ(); MER.lock(false);
  }
  // ------------------------------------------------------------ the harbor market: Dad's kettle, el Gran Pregón, the fish quarrel, the scale
  async function kettle() {
    const m = mk(), ra = P['puerto:ramon'], D = dad() || P['puerto:with-dad']; if (!ra) return;
    MER.lock(true); MER.shot([-5.5, 2.6, -4.5], [-8.6, 1.3, -8], 0.8);
    if (!m.kettle) {
      if (D) await MER.fam(D, 'mk.dad1');
      await MER.say(ra, 'ramon.call');
      if (D) await MER.fam(D, 'mk.dad.k1');
      let r = await MER.talk('kettle', ra, { only: ['what'] }); if (!r || r.quit) { MER.lock(false); return; }
      r = await MER.talk('kettle', ra, { only: ['insist'] }); if (!r || r.quit) { MER.lock(false); return; }
      if (D) await MER.fam(D, 'mk.dad.k2');
      r = await MER.talk('kettle', ra, { only: ['pref'] }); if (!r || r.quit) { MER.lock(false); return; }
      if (D) await MER.fam(D, 'mk.dad.done');
      m.kettle = true; MER.save(); tickQ();
      MER.lock(false);
      await pregon();
      return;
    }
    if (!m.boss) { MER.lock(false); await pregon(); return; }
    await MER.say(ra, 'kettle.pref.r');
    MER.lock(false);
  }
  async function pregon() {
    const m = mk(), b = MER.BUILT.puerto, p0 = MER.PADS.puerto; if (m.boss) return;
    MER.lock(true);
    b.crowd[0].on = 1; MER.shot([6, 5, 8], [-2, 3, 0], 0.9); snd('wrong');
    const pg = { api: { x: p0.x - 2, y: p0.y + 3.2, z: p0.z, top: 0.4, name: plainT(X().pick(X().NAMES.preg, lang())) } };
    await MER.say(pg, 'preg.1', { whole: true });
    MER.lock(false);
    const r = await DIN.fight([{ kind: 'din_preg', color: 'yellow', size: 'big', hp: 24 }, { kind: 'din', color: 'green', hp: 5 }, { kind: 'din', color: 'red', hp: 5 }], { boss: 'din_preg' });
    if (!r || r.outcome !== 'win') { MER.think('think.din', 5); return; }
    m.boss = true; b.crowd[0].on = 0.15; MER.save(); tickQ();
    MER.lock(true);
    const ra = P['puerto:ramon'], D = dad();
    if (ra) await MER.say(ra, 'mk.after');
    if (D) await MER.fam(D, 'mk.dad.after');
    MER.lock(false);
  }
  async function fish() {
    const m = mk(), ma = P['puerto:mari'], pi = P['puerto:pilar']; if (!ma) return;
    MER.lock(true); MER.shot([-5.5, 2.6, 9.5], [-9.2, 1.3, 6.6], 0.8);
    if (!m.fish && pi) {
      await MER.say(pi, 'fish.pil'); await MER.say(ma, 'fish.mar');
      const r = await MER.talk('fish', ma);
      if (r && !r.quit) { m.fish = true; coins(12); MER.save(); MER.show(pi, false); tickQ(); }
    } else await MER.say(ma, 'fish.p.r');
    MER.lock(false);
  }
  async function scale() {
    const m = mk(), lu = P['puerto:lupita']; if (!lu) return;
    MER.lock(true); MER.shot([2.6, 2.6, -2.5], [5.6, 1.3, -6], 0.8);
    if (!m.scale) { const r = await MER.talk('scale', lu); if (r && !r.quit) { m.scale = true; coins(8); MER.save(); tickQ(); } }
    else await MER.say(lu, 'scale.kilo.r');
    MER.lock(false);
  }
  // ------------------------------------------------------------ what you can press E on, per pad
  MER.items('centro', () => {
    const s = S(), b = MER.BUILT.centro, sp = b.spots, out = [];
    out.push({ x: sp.home.x, z: sp.home.z, r: 1.7, label: 'Go in: Calle del Faro 12', run: () => run(goHome) });
    out.push({ x: sp.machine.x, z: sp.machine.z, r: 1.6, label: 'Use the card machine', run: () => run(machine) });
    if (s.home) out.push({ x: sp.stop.x, z: sp.stop.z, r: 2.4, label: 'Take the tram (line 2)', run: () => run(takeTram) });
    const ce = P['centro:celes']; if (ce && ce.g.visible) out.push({ x: ce.api.x - MER.PADS.centro.x, z: ce.api.z - MER.PADS.centro.z, r: 2.0, label: 'Talk', run: () => run(petScene) });
    if (s.street && !s.noise1) out.push({ x: 0, z: 7.5, r: 3.2, label: 'Face the bullicios', run: () => run(ollieFight) });
    for (const k of ['a', 'b', 'c', 'd']) { const p = P['centro:crowd' + k]; if (p) out.push({ x: p.api.x - MER.PADS.centro.x, z: p.api.z - MER.PADS.centro.z, r: 1.4, label: 'Talk', run: () => run(() => crowdTalk(p)) }); }
    return out;
  });
  async function ollieFight() { const r = await DIN.battle('faro'); if (r && r.outcome === 'win') { S().noise1 = true; MER.save(); tickQ(); const ol = P['centro:ollie']; if (ol) { MER.lock(true); await MER.fam(ol, 'ollie.won'); MER.lock(false); } } }
  async function crowdTalk(p) { MER.lock(true); await MER.say(p, 'crowd.' + (4 + ((p.crowd || 0) % 3))); MER.lock(false); }
  async function goHome() {
    await UI.fade(1, 380); MER.go('casa', 'door'); cast('casa'); await UI.fade(0, 380);
    const s = S();
    if (!s.home && s.noise1) await homeScene();
    else if (s.home && U2(G.state).talk && !s.home2) await home2Scene();
    else if (s.home2 && M2(G.state).boss && !s.home3) await home3Scene();
  }
  MER.items('casa', () => {
    const b = MER.BUILT.casa, out = [{ x: b.spots.door.x, z: b.spots.door.z, r: 1.6, label: 'Go out to Calle del Faro', run: () => run(async () => { await UI.fade(1, 380); MER.go('centro', 'home'); await UI.fade(0, 380); }) }];
    for (const k of ['mom', 'dad', 'ollie']) { const p = P['casa:' + k]; if (p && p.g.visible) out.push({ x: p.api.x - MER.PADS.casa.x, z: p.api.z - MER.PADS.casa.z, r: 1.6, label: 'Talk', run: () => run(() => homeChat(k)) }); }
    return out;
  });
  MER.items('uni', () => {
    const u = uni(), b = MER.BUILT.uni, sp = b.spots, out = [], p0 = MER.PADS.uni, at = p => ({ x: p.api.x - p0.x, z: p.api.z - p0.z });
    out.push({ x: sp.stop.x, z: sp.stop.z, r: 2.4, label: 'Take the tram (line 2)', run: () => run(takeTram) });
    if (!u.called) out.push({ x: sp.machine.x, z: sp.machine.z, r: 1.6, label: 'Take a number', run: () => run(takeNumber) });
    const o = P['uni:ortega']; if (o && o.g.visible) out.push(Object.assign(at(o), { x: sp.win[2].x, z: sp.win[2].z, r: 1.8, label: 'Talk (window 3)', run: () => run(ortegaTalk) }));
    if (u.enroll1 && !u.lib) out.push({ x: sp.cart.x, z: sp.cart.z, r: 2.6, label: 'The mail cart', run: () => run(cartScene) });
    const ro = P['uni:rocio']; if (ro && ro.g.visible) out.push(Object.assign(at(ro), { r: 1.8, label: 'Talk', run: () => run(rocioTalk) }));
    if (u.enrolled && (!u.meg || !u.talk)) out.push({ x: sp.seat.x, z: sp.seat.z, r: 2.4, label: u.meg ? 'Back to the stage' : 'Sit for the welcome lecture', run: () => run(lecture) });
    const iv = P['uni:ivan']; if (iv && iv.g.visible) out.push(Object.assign(at(iv), { r: 1.8, label: 'Talk', run: () => run(ivanTalk) }));
    if (S().ivan === 'asked') out.push({ x: sp.notebook.x, z: sp.notebook.z, r: 1.6, label: 'A green notebook', run: () => run(async () => { S().ivan = 'found'; MER.save(); snd('chime'); STORY.think('Iván’s lab notebook! Someone left it on a café table.', 5); tickQ(); }) });
    return out;
  });
  MER.items('puerto', () => {
    const m = mk(), b = MER.BUILT.puerto, sp = b.spots, out = [], p0 = MER.PADS.puerto, at = p => ({ x: p.api.x - p0.x, z: p.api.z - p0.z });
    out.push({ x: sp.stop.x, z: sp.stop.z, r: 2.4, label: 'Take the tram (line 2)', run: () => run(takeTram) });
    const ra = P['puerto:ramon']; if (ra) out.push(Object.assign(at(ra), { r: 3.4, label: 'Talk', run: () => run(kettle) }));
    const ma = P['puerto:mari']; if (ma && m.kettle) out.push(Object.assign(at(ma), { r: 3.4, label: m.fish ? 'Talk' : 'Listen to the quarrel', run: () => run(fish) }));
    const lu = P['puerto:lupita']; if (lu && m.kettle) out.push(Object.assign(at(lu), { r: 3.4, label: 'Talk', run: () => run(scale) }));
    if (m.kettle && !m.boss) out.push({ x: sp.center.x, z: sp.center.z, r: 3.0, label: 'Face el Gran Pregón', run: () => run(pregon) });
    return out;
  });
  // ------------------------------------------------------------ every frame in the city: who's where, first visits, the followers
  let wasPad = null;
  MER.tick((dt, t, pad) => {
    const s = S();
    if (pad !== wasPad) { wasPad = pad; cast(pad); fol = {}; }
    follower('noa', !!s.noaWith && pad !== 'casa', dt, t);
    follower('dad', !!s.dadWith && pad === 'puerto', dt, t);
    if (STORY.busy || MER.busy || G.state.teaching) return;
    const Y = G.sim.you, p0 = MER.PADS[pad], lx = Y.x - p0.x, lz = Y.z - p0.z;
    if (pad === 'centro' && s.arrived && !s.arrSeen) run(arrival);
    else if (pad === 'centro' && s.arrSeen && !s.street && Math.hypot(lx - 1, lz - 3) < 6) run(ollieScene);
    else if (pad === 'uni' && !s.uniArr) run(uniArrive);
  });
  function init(game) {
    G = game;
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(ALBA)) STORY.extra.push(ALBA); }
    hookQuests();
    try { if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['ヘレン', 'マーティン', 'オリー']); } catch (e) { /* */ }
  }
  MER.INITS.push(init);
  // ------------------------------------------------------------ test seeds (?ch5=…): a save at the end of the finale, then further on
  MER.seed = which => {
    try { FIN._.t.setup(); FIN._.t.at('done'); } catch (e) { console.error('[mer] seed: finale', e); }
    G.state.fb = Object.assign(G.state.fb || {}, { stage: 'done', phase: 4 });            // (FB1's steps: the final battle won)
    try { TIME._.fast.on = false; } catch (e) { /* */ }
    // (a finished game's Mimo knows a fight's basics: the verbs, the colors, the sizes, the places in a row)
    try { for (const id of ['v.hit', 'v.jump', 'v.push', 'a.red', 'a.blue', 'a.green', 'a.yellow', 'a.white', 'a.big', 'a.small', 'p.left', 'p.right', 'p.middle']) if (LEX.item(id) && !LEX.taught(id)) LEX.learnt(id); } catch (e) { /* */ }
    const s = S(); for (const k of Object.keys(s)) delete s[k]; s.v = 1;
    const order = ['start', 'news', 'tix', 'city', 'street', 'home', 'uni', 'enroll', 'lecture', 'market', 'done'], i = order.indexOf(which);
    if (i >= 1) s.news = true;
    if (i >= 2) s.tix = true;
    if (i >= 3) { s.arrived = true; s.rode = true; }
    if (i >= 4) { s.arrSeen = true; s.noaWith = true; s.street = true; }
    if (i >= 5) { s.noise1 = true; s.home = true; s.stopsOpen = { uni: true }; s.card = true; }
    if (i >= 6) { s.uniArr = true; }
    if (i >= 7) { s.uni = { called: true, enroll1: true, lib: true, env: true }; }
    if (i >= 8) { s.uni.enrolled = true; s.uni.meg = true; s.uni.talk = 'A'; s.home2 = true; s.noaWith = false; s.dadWith = true; s.stopsOpen.puerto = true; }
    if (i >= 10) { s.mk = { kettle: true, boss: true }; s.home3 = true; s.dadWith = false; }
    MER.save();
    const at = { city: ['centro', 'platform'], street: ['centro', { x: 0, z: -2, yaw: Math.PI }], home: ['centro', 'home'], uni: ['uni', 'stop'], enroll: ['uni', { x: -21, z: -6, yaw: -Math.PI / 2 }], lecture: ['uni', 'seat'], market: ['puerto', 'stop'], done: ['centro', 'home'] }[which];
    if (at) MER.go(at[0], at[1]);
    else if (which === 'start') { try { const N = FIN._.buildPost().noa; G.sim.you.x = N.api.x - 9; G.sim.you.z = N.api.z + 9; G.sim.snap(); } catch (e) { /* */ } }
    else if (which === 'tix' || which === 'news') { const H = WORLD.L.stationHouse; G.sim.you.x = H.x + 1; G.sim.you.z = H.z + 5.5; G.sim.you.yaw = Math.PI; G.sim.snap(); G.cam.snap(Math.PI, 0.28, 8.5); }
    tickQ();
    return which;
  };
  return { STEPS, SIDES, STORY_L, P, cast, newsScene, arrival, ollieScene, homeScene, home2Scene, home3Scene, petScene, machine, takeTram, takeNumber, ortegaTalk, cartScene, rocioTalk, lecture, speech, ivanTalk, kettle, pregon, fish, scale, goHome, noa, dad, ALBA };
})();
