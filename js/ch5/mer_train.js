'use strict';
// Chapter 5, «Meridiana» (CH5-W1): the way there and back. Alba's station after the ending: the ticket office open at last (its clock,
// stopped at eight, ticks again), Don Anselmo at the window (a formal talk: MERTXT 'ticket'), Noa waiting on the platform, the train
// called in, «Board». The ride home is the opening's carriage again (INTERLUDE.addBeat 'meridiana'): Noa across from you, {mimo}
// asleep in the old egg basket, signs you can read now, the conductor (a formal talk), the announcement (listening: which side do the
// doors open?), the coast, the city at noon, the little station of the opening. From Barrio del Faro's station the train goes back
// (beat 'alba', short), any time.
//   MTRAIN.ride()  Alba → Meridiana · MTRAIN.back()  Meridiana → Alba · MTRAIN.PROVIDER (Alba's station: STORY.extra)
const MTRAIN = (() => {
  if (typeof MER === 'undefined' || !MER || typeof INTERLUDE === 'undefined' || !INTERLUDE.addBeat) return null;
  let G = null, clerk = null, noaP = null, busy = false;
  const X = () => MERTXT, lang = () => MER.lang(), plainT = s => MER.plainT(s);
  const S = () => MER.S();
  const H = () => WORLD.L.stationHouse;
  const WIN = () => ({ x: H().x + 0.4, z: H().z + H().d / 2 + 0.9 });       // (story.js's «Look» at the locked station house: the same spot, ours wins the tie)
  const snd = k => { try { Sound.play(k); } catch (e) { /* */ } };
  // ------------------------------------------------------------ Alba's station: the clerk at the window, Noa on the platform
  function cast() {
    if (clerk || !G || typeof FIN === 'undefined') return;
    const scene = G.w3d.scene, h = H(), gy = WORLD.groundAt(h.x, h.z + h.d / 2 + 0.3);
    clerk = FIN.person('clerk', X().CAST.clerk.look, scene, { x: h.x + 0.4, y: gy, z: h.z + h.d / 2 - 0.35, yaw: 0 });
    Object.defineProperty(clerk.api, 'name', { get: () => plainT(X().name('clerk', lang())), set() {}, configurable: true }); clerk.api.look = X().CAST.clerk.look;
    clerk.g.visible = false;
    noaP = FIN.person('noa', X().CAST.noa.look, scene, { x: 4.6, y: WORLD.groundAt(4.6, 62.8, 5), z: 62.8, yaw: -2.2 });
    Object.defineProperty(noaP.api, 'name', { get: () => plainT(X().name('noa', lang())), set() {}, configurable: true }); noaP.api.look = X().CAST.noa.look;
    noaP.g.visible = false; noaP.solid = { x: 1e5, z: 1e5, r: 0.4 }; WORLD.extra.push(noaP.solid);
  }
  const open = () => !!(G && G.state.ch5 && G.state.ch5.news);
  const outAlba = () => G && !(G.indoors && G.indoors()) && !(typeof TIME !== 'undefined' && TIME.world && TIME.world() !== 'now');
  const PROVIDER = {
    interactables() {
      if (!G || !open() || !outAlba() || MER.inside) return [];
      const out = [], w = WIN(), st = S();
      out.push({ x: w.x, z: w.z, r: 2.2, label: 'Talk', run: () => ticketTalk() });
      const tr = G.w3d.train;
      if (st.tix && tr.here) out.push({ x: tr.car.x, z: 65.6, r: 3.2, label: st.arrived ? 'Board: to Meridiana' : 'Board the train to Meridiana', run: () => ride() });
      if (!st.tix && tr.here) out.push({ x: tr.car.x, z: 65.6, r: 3.2, label: 'Board', run: async () => { MER.think('think.board', 4); } });
      return out;
    },
    tick(dt) {
      if (!G) return;
      cast();
      const on = open() && outAlba() && !MER.inside, near = on && G.sim.you.z > 30;
      if (clerk) clerk.g.visible = !!near;
      const st = S(), noaHere = on && near && !st.arrived;
      if (noaP) { noaP.g.visible = !!noaHere; noaP.solid.x = noaHere ? noaP.api.x : 1e5; noaP.solid.z = noaHere ? noaP.api.z : 1e5; }
      // (the post-game Noa by the duck pond waits at the station instead, until you've gone together)
      try { if (open() && !st.arrived && FIN._ && FIN._.buildPost) { const P0 = FIN._.buildPost(); if (P0.noa) { P0.noa.g.visible = false; if (P0.noa.solid) { P0.noa.solid.x = 1e5; P0.noa.solid.z = 1e5; } } } } catch (e) { /* */ }
      // the train comes in when you've got tickets and you're on the platform
      const tr = G.w3d.train;
      if (st.tix && near && G.sim.you.z > 52 && tr.mode === 'gone' && !tr._merCalled) { tr._merCalled = true; tr.gone(1.5); setTimeout(() => { tr._merCalled = false; }, 8000); }
    },
  };
  // the ticket office: Don Anselmo (formal); the tickets are paid by the university's letter
  async function ticketTalk() {
    if (busy) return; busy = true;
    try {
      const st = S();
      if (st.tix && !st.arrived) { MER.think('think.tickets', 4); return; }
      MER.lock(true);
      G.cam.override = { pos: new THREE.Vector3(clerk.api.x + 3.2, clerk.api.y + 2.2, clerk.api.z + 4.6), look: new THREE.Vector3(clerk.api.x, clerk.api.y + 1.3, clerk.api.z), dur: 0.8 };
      if (!st.tix) {
        const r = await MER.talk('ticket', clerk);
        MER.lock(false);
        if (r && !r.quit) { st.tix = true; (st.grades = st.grades || {}).ticket = r.grades; MER.save(); MER.think('think.tickets', 5); try { QUESTS.tick(); } catch (e) { /* */ } }
      } else {
        MER.lock(false);
        await MER.say(clerk, 'ticket.when.r');
      }
    } finally { MER.lock(false); busy = false; }
  }
  // ------------------------------------------------------------ the carriage, again: Noa across from you, Mimo in the basket, readable signs
  let EXTRA = null;
  function extras(K) {
    if (EXTRA) return EXTRA;
    const car = K.CMP.car, out = K.CMP.scene.userData.under;
    const noa = FIN.person('noa', Object.assign({}, X().CAST.noa.look, { seat: true }), car, { x: 1.18, y: 0.5, z: -0.55, yaw: -Math.PI / 2 });
    let mimo = null; try { mimo = ACTORS.mimo(); mimo.root.scale.setScalar(0.42); mimo.root.position.set(0, 0.16, 0); mimo.root.rotation.y = 0.6; K.KIT.basket.add(mimo.root); } catch (e) { mimo = null; }
    const plaque = (k, w, h, o) => { const m = MERB.sign(plainT(X().line(k, lang()).t), w, h, Object.assign({ px: 512 }, o)); car.add(m); return m; };
    const exitS = plaque('ride.sign1', 0.62, 0.2, { bg: '#2f8f4a', fg: '#ffffff' }); exitS.position.set(-1.22, 2.28, -1.17);
    const led = plaque('ride.sign2', 1.3, 0.18, { bg: '#1b1a22', fg: '#ffcf5a', edge: '#1b1a22' }); led.position.set(1.57, 2.35, 0.2); led.rotation.y = -Math.PI / 2;
    // outside: the coast and the city at noon, coming up on the horizon (shown only in this beat)
    const city = new THREE.Group(); out.add(city); city.visible = false;
    const seaM = new THREE.Mesh(new THREE.PlaneGeometry(900, 260).rotateX(-Math.PI / 2), new THREE.MeshToonMaterial({ color: '#5aa3c6', gradientMap: TK.grad })); seaM.position.set(0, -1.05, -260); city.add(seaM);
    MERB.skyline(city, { a0: -Math.PI * 0.72, arc: Math.PI * 0.44, r0: 170, r1: 90, n: 46, seed: 12, hmax: 60 });
    EXTRA = { noa, mimo, exitS, led, city };
    return EXTRA;
  }
  function setExtras(K, on) {
    const E = extras(K);
    E.noa.g.visible = on; E.exitS.visible = on; E.led.visible = on; E.city.visible = on;
    if (K.CMP.front) K.CMP.front.visible = !on;          // (the corridor wall: our shots look in from behind it)
    if (E.mimo) E.mimo.root.visible = on;
    const egg = K.KIT.egg; if (egg) egg.root.visible = !on;
  }
  // the beat: shots on the opening's timeline; two pauses (the conductor, the announcement) hand the screen to the game
  INTERLUDE.addBeat('meridiana', K => {
    let t0 = 0;
    const sitK = (o = {}) => K.seat(Object.assign({ look: 0.55, kick: 0.6 }, o));
    return [
      { id: 'seat', scene: 'cmp', dur: 4.8, capAt: 0.4, fadeIn: 0.6,
        enter() { setExtras(K, true); sitK(); K.CMP.front.visible = false; K.CMP.mood(0, true); try { if (Sound.songs.includes('mer_train')) Sound.setSong('mer_train'); } catch (e) { /* */ } },
        frame(lt, dt) { Object.assign(K.HP, { look: 0.55 + Math.sin(lt * 1.2) * 0.12, kick: 0.6 }); K.poseHero(dt, K.S.clock); EXTRA.noa.body.rotation.z = Math.sin(lt * 1.4) * 0.03; K.dolly([0.45, 1.5, 3.0], [0.3, 1.42, 2.6], [0.1, 1.1, -1.0], [0.0, 1.08, -0.9], 42, K.ease(lt / 4.8)); } },
      { id: 'mimo', scene: 'cmp', dur: 4.2, capAt: 0.3,
        enter() { sitK({ look: -0.75, pitch: 0.3, kick: 0.3 }); },
        frame(lt, dt) { K.poseHero(dt, K.S.clock); if (EXTRA.mimo) EXTRA.mimo.root.position.y = 0.16 + Math.abs(Math.sin(lt * 1.1)) * 0.01; K.camAt(K.mix3([-0.1, 1.2, 1.15], [-0.25, 1.15, 1.05], K.ease(lt / 4.2)), [-1.1, 0.86, 0.18], 38); } },
      { id: 'signs', scene: 'cmp', dur: 4.4, capAt: 0.4,
        enter() { sitK({ look: 0.9, pitch: -0.05 }); },
        frame(lt, dt) { K.poseHero(dt, K.S.clock); const k = K.span(lt, 1.8, 2.6); K.camAt(K.mix3([-0.6, 2.1, 0.4], [0.6, 2.2, 0.3], k), K.mix3([-1.22, 2.28, -1.17], [1.57, 2.35, 0.2], k), 34); } },
      { id: 'conductor', scene: 'cmp', dur: 2.0, pause: 'conductor',
        enter() { sitK({ look: 0.3 }); },
        frame(lt, dt) { K.poseHero(dt, K.S.clock); K.camAt([0.9, 1.6, 2.2], [-0.2, 1.1, -0.6], 44); } },
      { id: 'window', scene: 'cmp', dur: 6.0, capAt: 0.6,
        enter() { sitK({ look: 1.05, pitch: 0.04 }); t0 = 0; K.CMP.mood(0, true); },
        frame(lt, dt) { K.poseHero(dt, K.S.clock); EXTRA.city.position.x = 120 - lt * 22; K.dolly([-0.5, 1.6, 0.45], [-0.46, 1.55, 0.05], [-0.12, 1.28, -3.2], [-0.1, 1.26, -3.2], 46, K.ease(lt / 6)); } },
      { id: 'announce', scene: 'cmp', dur: 2.0, pause: 'announce',
        enter() { sitK({ look: 0.2 }); },
        frame(lt, dt) { K.poseHero(dt, K.S.clock); EXTRA.city.position.x = -12; K.camAt([1.3, 1.4, 0.1], [0.1, 1.2, -1.0], 46); } },
      { id: 'arrive', scene: 'sta', dur: 4.6, capAt: 0.4, fadeIn: 0.8, fadeOut: 0.6,
        enter() { setExtras(K, false); K.kitTo('sta'); K.STA.reset(); Object.assign(K.HP, { x: 2.4, y: 0.7, z: 2.6, yaw: Math.PI / 2 + 0.3, speed: 0, phase: 0, sit: 0, arms: 'rest', read: 0, look: 0.3, pitch: 0, worry: 0, kick: 0, lids: 0, lean: 0, glum: 0 }); },
        frame(lt, dt) { const k = K.ease(lt / 4.6); Object.assign(K.HP, { x: 2.4 + k * 2.2, speed: lt < 3 ? 2.6 : 0, phase: lt * 6 }); K.poseHero(dt, K.S.clock); K.camAt([lerp(-4, -2, k), 3.0, 11.0], [2.8, 1.9, 2.2], 34); },
        exit() { K.kitTo('cmp'); } },
    ];
  }, X().RIDE.concat(['Meridiana. Barrio del Faro. Home.']));
  // the short way back to Alba (and to Meridiana again, once you've been): the carriage, the window, the platform
  INTERLUDE.addBeat('meridiana2', K => [
    { id: 'seat', scene: 'cmp', dur: 5.0, capAt: 0.5, fadeIn: 0.6, fadeOut: 0.8,
      enter() { setExtras(K, true); K.seat({ look: 0.9, kick: 0.5 }); K.CMP.front.visible = false; K.CMP.mood(0, true); EXTRA.city.visible = !!K.S._toCity; try { if (Sound.songs.includes('mer_train')) Sound.setSong('mer_train'); } catch (e) { /* */ } },
      frame(lt, dt) { K.poseHero(dt, K.S.clock); if (EXTRA.city.visible) EXTRA.city.position.x = 40 - lt * 10; K.dolly([0.45, 1.5, 3.0], [-0.4, 1.55, 0.2], [0.1, 1.1, -1.0], [-0.1, 1.26, -3.2], 42, K.ease(lt / 5)); },
      exit() { setExtras(K, false); } },
  ], ['Back on the line.', 'The valley and the city: one train between them.']);
  // ------------------------------------------------------------ riding
  async function ride() {
    if (busy) return; busy = true;
    const st = S();
    try {
      MER.lock(true);
      snd('whistle');
      const first = !st.arrived;
      if (first) {
        await G.cutaway('meridiana', null, { onPause: async what => {
          if (what === 'conductor') { const P = conductorP(); const r = await MER.talk('conductor', P); (st.grades = st.grades || {}).conductor = r && r.grades; }
          if (what === 'announce') await announce();
        } });
      } else {
        INTERLUDE._.S._toCity = true;
        await G.cutaway('meridiana2', ['Back on the line.', 'Meridiana again.']);
      }
      try { G.w3d.train.gone(90); } catch (e) { /* */ }
      st.rode = true;
      MER.go('centro', 'platform', { quiet: true });
      if (first) { st.arrived = true; }
      MER.save();
      await UI.fade(0, 600);
      try { QUESTS.tick(); } catch (e) { /* */ }
    } finally { MER.lock(false); busy = false; }
  }
  async function back() {
    if (busy) return; busy = true;
    try {
      MER.lock(true);
      snd('whistle');
      INTERLUDE._.S._toCity = false;
      await G.cutaway('meridiana2', ['Back on the line.', 'Alba, the valley, the duck pond. Home, too.']);
      MER.leave('alba');
      try { G.w3d.train.gone(60); } catch (e) { /* */ }
      await UI.fade(0, 600);
    } finally { MER.lock(false); busy = false; }
  }
  // the conductor, during the pause (a person drawn in the talk panel only)
  function conductorP() { return { api: { name: plainT(X().name('conductor', lang())), x: 0, y: 0, z: 0, top: 1.8 }, look: X().CAST.conductor.look }; }
  // the announcement: a card you can hear (🔊), then which side the doors open on (listening)
  async function announce() {
    const l = lang(), A = X().line('ride.ann', l), q = X().line('ride.q', l);
    try { UI.speak(MER.plainT(A.t)); } catch (e) { /* */ }
    await MER.card({ tag: { en: 'The announcement', es: 'El aviso', pt: 'O aviso', de: 'Die Durchsage', zh: '[广播|guǎng bō]', ja: 'アナウンス' }, [l]: A.t, en: A.en });
    const opts = [['ride.qL', 'L'], ['ride.qR', 'R'], ['ride.qB', 'B']].map(([k, v]) => ({ label: plainT(X().line(k, l).t) || X().line(k, l).en, value: v }));
    const pick = await UI.choose(plainT(q.t) || q.en, opts);
    try { DICT.log('listen', 3, pick === 'L' ? 1 : 0); } catch (e) { /* */ }
    // (a cutaway's pause: the game's clock stands still, so a toast and a real-time beat, never STORY.wait)
    try { UI.toast(X().en(pick === 'L' ? 'think.rideOK' : 'think.rideNo', l)); } catch (e) { /* */ }
    await new Promise(r => setTimeout(r, 400));
  }
  function init(game) {
    G = game;
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
  }
  MER.INITS.push(init);
  // the station in Meridiana: the way back (its ticket office: the scenes add the Talk; this is the train)
  MER.items('centro', () => (MER.S().arrived ? [{ x: 1, z: -24.6, r: 1.8, label: 'Take the train to Alba', run: () => back() }] : []));
  return { ride, back, ticketTalk, PROVIDER, get clerk() { return clerk; }, get noa() { return noaP; }, _: { extras, announce } };
})();
