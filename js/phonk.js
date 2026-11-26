'use strict';
// Kauã, «DJ Lagoa» (Portuguese games only; DESIGN.md 14.7): a Brazilian teen on a red plastic crate on the east bank of
// Alba's duck pond, in a yellow number-10 jersey and big headphones, nodding to his phonk with his eyes shut. You hear his
// beat leaking out of the headphones (thin, crunchy, louder as you get close, panned to where he is; the area's music
// dips a little) and you see it too: rings and notes coming off the ear cups. Chill, funny, a bit too cool, secretly sweet.
//
// His side story, five chapters gated by the story (game/SIDES.md; 2026-11-13). Chapters 1–3 are his first quest, «O beat
// do DJ Lagoa», spread out; 4 and 5 are in baile.js (plugged in with PHONK.use):
//   1. «E aí, DJ Lagoa?» (after Rosa's welcome). Meet him: he can't hear you over his beat, so Mimo dances in front of him.
//      He greets you the Brazilian way («E aí?» «Suave!»), says the Hush made town too quiet for him, and lends you his
//      recorder. Record the ducks on the pond (they're shy: tell Mimo «Pula!») and Alba's tower bell (tell Mimo «Joga!»: a
//      pebble, DONG); bring them back («Irado!», «Da hora!»).
//   2. «Sons da estrada» (after the big Hushling on the hill). Three more sounds out in the land, each marked by a ♪ (the
//      train's whistle at the station, the bell sheep at the farm in the Windmill Hills, the frogs in the Reed River's
//      reeds; the Great Mill's gears once the mill turns again). He reacts to each with slang you say back, then builds
//      the beat layer by layer with your sounds in it (the ducks as a vocal chop, the bell as a bong, the train as the funk
//      whistle…).
//   3. «A batalha» (after the first bell: the Great Mill turns again). A rap battle: the beat plays, he raps two lines, you
//      finish the second with a Portuguese word that rhymes and fits, typed, with Enter right on the ★ beat. Graded S–D on
//      the word and the timing. Treino (4 rounds, with options), then for real (6 rounds, the rhyme ending shown). Easy
//      mode: the beat waits for you. Then «Lagoa sem Silêncio» plays, his track with your words in it (said by a pt-BR
//      voice if one is installed), Mimo gets headphones of its own (a cosmetic), and you get his mixtape (a key item).
//   4. «Rimas da quebrada» and 5. «O Baile da Lagoa»: see baile.js.
//   His menu: the next chapter (or "later: after …"), rematches and a Final (140 bpm, no hints), the tracks, slang
//   practice, Mimo's headphones (and, after chapter 5, its microphone) on or off.
// A save from before the chapters keeps what it had reached open (state.phonk.open), whatever the story's at.
// 19 phrases (LEX kind 'phrase', region 'Brasil', ids ph.br_*), 5 words (w.duck, w.headphones, w.music, w.sheep, w.bell),
// 2 key items (k.recorder, k.mixtape). Progress lives in state.phonk; the cosmetic in state.flags.mimoPhones.
//
// One global, PHONK:
//   PHONK.init(game)                     after main has built the world: the quest (into QUESTS.LIST), Mimo's headphones
//   PHONK.build(scene, { terrainAt }) →  { colliders: [] (he's a live person, not a fixed solid), group, people: [Kauã]
//                                         (a live array, empty outside Portuguese games), update(dt, t, you | null) }
//                                         update runs the leak, his animation and the overlays: call it every explore frame
//                                         (it hides itself; no need to hide group by distance)
//   PHONK.interactables()             →  [{ x, z, r, label, run }]: Kauã ('Talk') and the sample spots ('Record' / 'Look')
//   PHONK.busy                            true while one of its overlays (the batalha, the track…) is up: the world's
//                                         input is paused (it sets sim.lock and Input.typing itself, too)
// Needs THREE, core.js, toonkit.js, lexicon.js, words.js, lines.js, icons.js and audio.js at load; STORY, UI, QUESTS and
// WORLD at run time. Its audio (the songs 'phonk_leak' and 'phonk', Sound.deck, Sound.duck…) is in audio.js (PHONK blocks).

const PHONK = (() => {
  const { part } = TK, GEO = TK.G;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  let G = null;                                   // the game (main.js)
  const isPT = () => !!(G && G.state && G.state.lang === 'pt');
  const indoors = () => !!(G && G.indoors && G.indoors());
  const mimoName = () => (G && G.state && G.state.mimoName) || 'Mimo';
  function S() {
    const s = G.state, p = s.phonk || (s.phonk = {}); p.samples = p.samples || {}; p.heard = p.heard || {}; p.best = p.best || {}; p.paid = p.paid || {};
    // (the chapters, 2026-11-13) a save from before them keeps whatever it had reached open, wherever the story is: open
    // is the highest chapter that's never locked for it
    if (!p.v) {
      p.v = 2;
      const far = OUT.some(k => k !== 'bell' && p.samples[k]);
      p.open = p.won || p.built ? 3 : !p.met ? 0 : far ? 2 : 1;
      if (p.met && p.heard.ducks && p.heard.bell) p.ch1 = true;
      if (p.open >= 2) p.c2s = true;
      if (p.won) p.c3s = true;
    }
    return p;
  }
  const TEST = { gameClock: false };              // tests: drive the batalha's clock by frames even when audio runs
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ================================================================ where things are
  const SEAT = { x: 16.6, z: -180.2 };                           // his crate, on the east bank of the pond's east lobe (town.js pond.B)
  const FACE = Math.atan2(12.2 - SEAT.x, -179.6 - SEAT.z);       // looking out over the water
  const DANCE_AT = { x: 17.7, z: -179.1 };                       // where Mimo dances to his beat
  const YOU_AT = { x: 19.5, z: -179.7 };                         // where you stand for a batalha (he's on your left, Mimo in between)
  // the sounds he needs: where to record them, the effect, his reaction's slang, the beat's layer (audio.js phonkMix)
  const SAMPLES = {
    ducks: { at: { x: 12.6, z: -175.4 }, r: 2.4, fx: 'quack', phrase: 'ph.br_irado', layer: 'quack', icon: 'duck', pt: 'os patos', en: 'the ducks', where: 'on Alba’s pond' },
    bell: { at: { x: -23.3, z: -166.2 }, r: 2.4, fx: 'bigbell', phrase: 'ph.br_dahora', layer: 'bell', icon: 'bell', pt: 'o sino da torre', en: 'the tower’s bell', where: 'Alba’s bell tower' },
    train: { at: { x: 5.2, z: 65.2 }, r: 2.6, fx: 'piui', phrase: 'ph.br_partiu', layer: 'whistle', icon: 'train', pt: 'o apito do trem', en: 'the train’s whistle', where: 'the station' },
    sheep: { at: { x: 102.3, z: -156.6 }, r: 2.8, fx: 'sheepbell', phrase: 'ph.br_top', layer: 'sheep', icon: 'sheep', pt: 'o chocalho da ovelha', en: 'the sheep’s cowbell', where: 'the farm in the Windmill Hills' },
    frogs: { at: { x: -114.6, z: -163 }, r: 2.8, fx: 'croak', phrase: 'ph.br_po', layer: 'croak', icon: 'ph_frog', pt: 'os sapos', en: 'the frogs', where: 'the reeds by the Reed River' },
    gears: { at: { x: 245.5, z: -165.8 }, r: 2.8, fx: 'gears', phrase: 'ph.br_firmeza', layer: 'gears', icon: 'ph_gears', pt: 'as engrenagens do moinho', en: 'the Great Mill’s gears', where: 'the Great Mill in Molinar' },
  };
  const ORDER = ['ducks', 'bell', 'train', 'sheep', 'frogs', 'gears'], OUT = ORDER.slice(1);
  const available = k => k !== 'gears' || !!(G && G.state.flags.millFree);
  const outCount = st => OUT.filter(k => st.samples && st.samples[k]).length;
  const mixNow = () => { const st = S(), m = {}; ORDER.forEach(k => { if (st.samples[k]) m[SAMPLES[k].layer] = 1; }); return m; };
  // ================================================================ the five chapters (game/SIDES.md): each opens with the story; a save
  // from before them keeps what it had reached open (S().open)
  const flags = () => (G && G.state && G.state.flags) || {};
  const CH = [
    { n: 1, title: 'E aí, DJ Lagoa?', sub: 'meet Kauã; record the ducks and the tower bell', gate: f => !!f.rosa, wait: 'after Rosa’s welcome' },
    { n: 2, title: 'Sons da estrada', sub: 'record sounds out in the land; build the beat', gate: f => !!f.boss, wait: 'after the big Hushling on the hill' },
    { n: 3, title: 'A batalha', sub: 'a rhyme battle on his beat; your words in his track', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell' },
    { n: 4, title: 'Rimas da quebrada', sub: 'ask Alba’s people, then rhyme their verses on the beat', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell' },
    { n: 5, title: 'O Baile da Lagoa', sub: 'run the sound, MC the baile, drive off the Hush', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell' },
  ];
  const chOpen = n => !!(CH[n - 1] && CH[n - 1].gate(flags())) || (S().open || 0) >= n;
  const chDone = (st, n) => n === 1 ? !!(st.ch1 || st.built) : n === 2 ? !!st.built : n === 3 ? !!st.won : n === 4 ? !!st.c4 : n === 5 ? !!st.c5 : false;
  // the ducks and the bell are chapter 1's; the rest once chapter 2 has sent you out (or an old save had got that far)
  const canRecord = (st, k) => !!st.recorder && (k === 'ducks' || k === 'bell' || !!st.c2s || (st.open || 0) >= 2 || !!st.built);
  // chapters 4 and 5 (baile.js), plugged in with PHONK.use(): { build, update, interactables, talk, chapter(n), menuItems,
  // menuPick, show, musicOn, beat, questSteps, questStory, phraseIds }
  let EXT = null;
  const ext = (k, ...a) => { try { return EXT && typeof EXT[k] === 'function' ? EXT[k](...a) : undefined; } catch (e) { console.error('[phonk ext]', k, e); return undefined; } };
  // Kauã himself, as a person (STORY.sayInline puts his bubble over him; main adds his solid and his dot on the mini-map)
  const KAUA = { id: 'kaua', name: 'Kauã', x: SEAT.x, z: SEAT.z, y: 0.25, top: 1.72, r: 0.5, story: true, talking: false };
  const people = [];

  // ================================================================ words, phrases, icons (registered at load)
  const NEW_WORDS = [
    { id: 'w.duck', kind: 'word', es: 'pato', pt: 'pato', de: 'Ente', en: 'duck', g: { es: 'm', pt: 'm', de: 'f' }, pl: { es: 'patos', pt: 'patos', de: 'Enten' }, icon: 'duck' },
    { id: 'w.headphones', kind: 'word', es: 'audífono', pt: 'fone', de: 'Kopfhörer', en: 'headphones', enPl: 'headphones', g: { es: 'm', pt: 'm', de: 'm' },
      pl: { es: 'audífonos', pt: 'fones', de: 'Kopfhörer' }, icon: 'headphones', alt: { es: ['audífonos', 'auricular', 'auriculares'], pt: ['fones', 'fone de ouvido', 'fones de ouvido', 'headphone'], de: ['Kopfhoerer'] } },
    { id: 'w.music', kind: 'word', es: 'música', pt: 'música', de: 'Musik', en: 'music', enPl: 'music', g: { es: 'f', pt: 'f', de: 'f' }, icon: 'music' },
    { id: 'w.sheep', kind: 'word', es: 'oveja', pt: 'ovelha', de: 'Schaf', en: 'sheep', enPl: 'sheep', g: { es: 'f', pt: 'f', de: 'n' }, pl: { es: 'ovejas', pt: 'ovelhas', de: 'Schafe' }, icon: 'sheep' },
    { id: 'w.bell', kind: 'word', es: 'campana', pt: 'sino', de: 'Glocke', en: 'bell', g: { es: 'f', pt: 'm', de: 'f' }, pl: { es: 'campanas', pt: 'sinos', de: 'Glocken' }, icon: 'bell' },
    // key items (not words to teach)
    { id: 'k.recorder', kind: 'key', es: 'grabadora', pt: 'gravador', de: 'Aufnahmegerät', en: 'Kauã’s recorder', g: { es: 'f', pt: 'm', de: 'n' }, icon: 'ph_recorder' },
    { id: 'k.mixtape', kind: 'key', es: 'casete', pt: 'fita', de: 'Kassette', en: 'DJ Lagoa’s mixtape', g: { es: 'm', pt: 'f', de: 'f' }, icon: 'ph_tape' },
  ];
  // Brazilian slang and everyday expressions, as really said (the journal's Phrasebook lists the ones you've been taught)
  const P = (id, pt, en, note, register, alt) => ({ id: 'ph.br_' + id, kind: 'phrase', pt, en, note, region: 'Brasil', register, icon: 'ph_slang', alt: alt ? { pt: alt } : undefined });
  const PHRASES = [
    P('eai', 'E aí?', 'What’s up?', 'The everyday hello among friends. Answer «Suave!» or «Beleza!».', 'casual', ['eai', 'iai', 'e ai mano']),
    P('suave', 'Suave!', 'All chill! / All good!', 'The answer to «E aí?» or «Tudo bem?». As a question, «Tá suave?» = you good?', 'slang', ['tá suave', 'tô suave', 'tudo suave', 'suave na nave']),
    P('beleza', 'Beleza!', 'All good! / Cool! / Deal!', 'Hello, answer and "deal" in one word. «Beleza?» asks how you are.', 'casual', ['tudo beleza', 'blz']),
    P('deboa', 'De boa.', 'No worries / I’m good', '«Tô de boa» = I’m relaxed. «De boa!» = no problem!', 'slang', ['tô de boa', 'to de boa', 'de boas']),
    P('mano', 'mano', 'bro, dude', 'Calling a friend (São Paulo). For a girl: «mana».', 'slang', ['mana']),
    P('vei', 'véi', 'dude (from «velho», old man)', 'Like «mano», but from Brasília and Goiás: «Pô, véi!»', 'slang', ['véio', 'velho']),
    P('taligado', 'Tá ligado?', 'You know? / Get it?', 'Tacked onto a sentence to check you’re following (to a girl, often «Tá ligada?»). The answer: «Tô ligado!»', 'slang', ['ta ligado', 'tá ligada']),
    P('toligado', 'Tô ligado!', 'I know! / I get it!', 'The answer to «Tá ligado?» (a girl says «Tô ligada!»).', 'slang', ['to ligado', 'tô ligada', 'tô ligadão']),
    P('seliga', 'Se liga!', 'Check it out! / Listen up!', 'To get someone’s attention, or to warn them: «Se liga no som!»', 'slang', ['se liga só']),
    P('dahora', 'Da hora!', 'Awesome! / Cool!', 'São Paulo slang for anything great: «Que beat da hora!»', 'slang', ['dahora', 'muito da hora']),
    P('irado', 'Irado!', 'Awesome! (literally “furious”)', 'From Rio, now everywhere: «Ficou irado!» = it turned out awesome.', 'slang', ['ficou irado', 'muito irado']),
    P('top', 'Top!', 'Great! / The best!', 'Borrowed from English: «Top demais!» = really great.', 'casual', ['top demais', 'muito top']),
    P('firmeza', 'Firmeza!', 'Solid! / Deal! / All good?', 'Agreeing, or as a greeting: «Firmeza, mano?» (São Paulo).', 'slang', ['firmeza total']),
    P('partiu', 'Partiu!', 'Let’s go! / Off we go!', 'Before going somewhere: «Partiu lagoa?» = to the pond? (Also «Bora!»)', 'slang', ['bora', 'partiu mano']),
    P('mo', 'mó', 'super, really (short for «maior»)', 'Before a word, to make it bigger: «mó calor» (so hot), «mó irado» (super awesome).', 'slang', ['maior']),
    P('bagulho', 'bagulho', 'thing, stuff', 'A very informal “thing”: «Que bagulho é esse?» = what’s this thing? «O bagulho é doido» = it’s wild.', 'slang'),
    P('po', 'Pô!', 'Aw, man! / Come on!', 'Surprise, complaint or emphasis (Rio): «Pô, que demais!»', 'casual', ['pô mano', 'pô véi']),
    P('valeu', 'Valeu!', 'Thanks! / Cheers!', 'The casual thank-you. Also a goodbye.', 'casual', ['valeu mano', 'vlw']),
    P('tamojunto', 'Tamo junto!', 'I’ve got your back! / We’re in this together', 'Short for «estamos juntos». To friends, to say thanks or bye.', 'slang', ['tamo junto', 'tamos juntos', 'estamos juntos', 'tmj']),
  ];
  if (typeof LEX !== 'undefined') LEX.register(NEW_WORDS.concat(PHRASES).filter(w => !LEX.item(w.id)));
  if (typeof WORDS !== 'undefined' && Array.isArray(WORDS)) NEW_WORDS.filter(w => w.kind === 'word').forEach(w => { if (!WORDS.some(x => x.id === w.id)) WORDS.push(LEX.item(w.id)); });
  if (typeof ICONS !== 'undefined' && ICONS.add) {
    const add = (k, fn) => { if (!ICONS.keys.includes(k)) ICONS.add(k, fn); };
    add('ph_slang', (c, p, h) => {        // a green speech bubble with a yellow «!?»
      h.shape(c, p, cc => { cc.moveTo(-30, -24); cc.quadraticCurveTo(-30, -34, -20, -34); cc.lineTo(24, -34); cc.quadraticCurveTo(34, -34, 34, -24); cc.lineTo(34, 8); cc.quadraticCurveTo(34, 18, 24, 18);
        cc.lineTo(-6, 18); cc.lineTo(-20, 32); cc.lineTo(-16, 18); cc.lineTo(-20, 18); cc.quadraticCurveTo(-30, 18, -30, 8); cc.closePath(); }, '#2fae63');
      if (p) { c.font = '900 30px Bahnschrift, "Segoe UI", sans-serif'; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = h.INK; c.fillStyle = '#ffd23f'; c.strokeText('!?', 2, 3); c.fillText('!?', 2, 3); }
    });
    add('headphones', (c, p, h) => {
      h.shape(c, p, cc => { cc.arc(0, 6, 31, Math.PI, 0); cc.lineTo(25, 6); cc.arc(0, 6, 25, 0, Math.PI, true); cc.closePath(); }, '#2b2235');
      h.shape(c, p, h.rr(-40, -2, 17, 32, 7), '#2b2235'); h.shape(c, p, h.rr(23, -2, 17, 32, 7), '#2b2235');
      if (p) { h.shape(c, 1, h.rr(-36, 3, 9, 22, 4), '#4cff8a', 1.4); h.shape(c, 1, h.rr(27, 3, 9, 22, 4), '#4cff8a', 1.4); }
    });
    add('music', (c, p, h) => {          // two eighth notes
      h.shape(c, p, h.poly([[-8, 18], [-8, -24], [30, -33], [30, 10], [26, 10], [26, -26], [-4, -18], [-4, 18]]), '#c2412f');
      h.shape(c, p, h.ell(-16, 20, 12, 9, -0.35), '#c2412f'); h.shape(c, p, h.ell(18, 12, 12, 9, -0.35), '#c2412f');
    });
    add('duck', (c, p, h) => {
      if (p) { c.beginPath(); c.moveTo(-38, 28); c.quadraticCurveTo(0, 20, 38, 28); c.strokeStyle = '#4aa8d8'; c.lineWidth = 3; c.stroke(); }
      h.shape(c, p, h.ell(6, 10, 28, 16), '#fdf8ee'); h.shape(c, p, h.ell(-15, -12, 13, 13), '#fdf8ee');
      h.shape(c, p, h.poly([[-26, -13], [-42, -8], [-26, -4]]), '#f2a33a'); h.shape(c, p, h.ell(12, 6, 13, 7, -0.25), '#ece4cf');
      if (p) h.dot(c, -18, -15, 2.5, h.INK);
    });
    add('sheep', (c, p, h) => {
      [[-12, 2], [2, -6], [16, 2], [2, 12], [-4, 0], [10, 0]].forEach(([x, y]) => h.shape(c, p, h.ell(x, y, 15, 13), '#fbf8f2'));
      h.shape(c, p, h.rr(-10, 18, 6, 14, 2), '#3a3040'); h.shape(c, p, h.rr(10, 18, 6, 14, 2), '#3a3040');
      h.shape(c, p, h.ell(-26, -4, 10, 12, 0.3), '#3a3040');
      h.shape(c, p, h.poly([[-24, 8], [-14, 8], [-12, 19], [-26, 19]]), '#f2c14e');      // the cowbell round its neck
      if (p) h.dot(c, -29, -6, 2, '#fffaf0');
    });
    add('bell', (c, p, h) => {
      h.shape(c, p, h.rr(-5, -38, 10, 10, 3), '#8a5f2a');
      h.shape(c, p, cc => { cc.moveTo(-26, 20); cc.bezierCurveTo(-24, -6, -18, -30, 0, -30); cc.bezierCurveTo(18, -30, 24, -6, 26, 20); cc.closePath(); }, '#e6b13e');
      h.shape(c, p, h.ell(0, 30, 7, 6), '#8a5f2a'); h.shape(c, p, h.rr(-31, 17, 62, 9, 4), '#c9922a');
      if (p) h.dot(c, -10, -12, 4, 'rgba(255,255,255,0.6)');
    });
    add('ph_recorder', (c, p, h) => {
      h.shape(c, p, h.rr(-20, -32, 40, 64, 8), '#3a3448'); h.shape(c, p, h.rr(-14, -26, 28, 20, 4), '#7ff7ea'); h.shape(c, p, h.ell(0, 14, 9, 9), '#d64b3c');
      if (p) { c.fillStyle = h.INK; c.font = '900 10px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.fillText('REC', 0, -12); }
    });
    add('ph_tape', (c, p, h) => {         // a cassette
      h.shape(c, p, h.rr(-38, -24, 76, 48, 6), '#2fae63'); h.shape(c, p, h.rr(-30, -18, 60, 17, 3), '#ffd23f');
      h.shape(c, p, h.ell(-14, 11, 8, 8), '#fffaf0'); h.shape(c, p, h.ell(14, 11, 8, 8), '#fffaf0');
      if (p) { h.dot(c, -14, 11, 3, h.INK); h.dot(c, 14, 11, 3, h.INK); c.fillStyle = h.INK; c.font = '900 10px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.fillText('DJ LAGOA', 0, -6); }
    });
    add('ph_frog', (c, p, h) => {
      h.shape(c, p, h.ell(0, 10, 32, 20), '#5aa84a'); h.shape(c, p, h.ell(-15, -12, 11, 11), '#5aa84a'); h.shape(c, p, h.ell(15, -12, 11, 11), '#5aa84a');
      if (p) { [-15, 15].forEach(x => { h.dot(c, x, -12, 6, '#fffaf0'); h.dot(c, x + 1, -12, 3, h.INK); }); c.beginPath(); c.arc(0, 6, 16, 0.25, Math.PI - 0.25); c.strokeStyle = h.INK; c.lineWidth = 2; c.stroke(); }
    });
    add('ph_gears', (c, p, h) => {
      h.shape(c, p, cc => { for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = i % 2 ? 26 : 34, a2 = a + TAU / 48; if (i) cc.lineTo(Math.cos(a) * r, Math.sin(a) * r); else cc.moveTo(Math.cos(a) * r, Math.sin(a) * r); cc.lineTo(Math.cos(a2) * r, Math.sin(a2) * r); } cc.closePath(); }, '#b07a48');
      h.shape(c, p, h.ell(0, 0, 10, 10), '#fffaf0');
    });
  }

  // ================================================================ everything he says (lines.js's format: pt [simpler, richer] by LEX.tier(),
  // and the English for the weave). Slang stays as it's really said, «in quotes» with the English after it. {mimo} is Mimo's
  // name, {n} a count. Never the player's gender in the Portuguese.
  const LT = {
    'phonk.meet.whoa': {
      pt: ['Opa! Que bagulho é esse?', 'Opa, opa! Que bagulho é esse? Ele tá dançando o meu beat!'],
      en: ['Whoa! «Que bagulho é esse?» (what’s this thing?)', 'Whoa, whoa! «Que bagulho é esse?» (what’s this thing?) It’s dancing to my beat!'] },
    'phonk.meet.name': {
      pt: ['E aí? Eu sou o Kauã. Mas pode me chamar de DJ Lagoa.', 'E aí? Eu sou o Kauã. Mas aqui na lagoa todo mundo me chama de DJ Lagoa. Fica mais estiloso, né?'],
      en: ['«E aí?» (what’s up?) I’m Kauã. But you can call me DJ Lagoa: DJ Pond.', '«E aí?» (what’s up?) I’m Kauã. But round this pond, everyone calls me DJ Lagoa: DJ Pond. Way more stylish, right?'] },
    'phonk.meet.suave': {
      pt: ['Suave! E vocês, tudo suave?', 'Suave, suave. E vocês dois, tudo suave?'],
      en: ['«Suave!» (all chill!) You two good?', '«Suave, suave.» (chill, chill.) And you two, all good?'] },
    'phonk.meet.beat': {
      pt: ['Tô fazendo um beat de phonk, tá ligado? Mas tá faltando alguma coisa.', 'Tô fazendo um beat de phonk, tá ligado? Mas tá faltando alguma coisa… tá mó vazio.'],
      en: ['I’m making a phonk beat, «tá ligado?» (you know?) But something’s missing.', 'I’m making a phonk beat, «tá ligado?» (you know?) But something’s missing… it’s «mó» (super) empty.'] },
    'phonk.meet.hush': {
      pt: ['Desde que o Silêncio chegou, a cidade ficou quieta demais. Eu não aguento silêncio!', 'Desde que o Silêncio chegou, a cidade ficou quieta demais. Eu não aguento silêncio, véi. Por isso o meu {w.headphones} tá sempre no talo.'],
      en: ['Since the Hush came, town got way too quiet. I can’t stand silence!', 'Since the Hush came, town got way too quiet. I can’t stand silence, «véi» (dude). That’s why my {w.headphones} are always cranked all the way up.'] },
    'phonk.meet.ask': {
      pt: ['Se liga: cê me ajuda? Grava uns sons pra mim.', 'Se liga: cê me ajuda? Grava uns sons por aí pra mim. Sons de verdade, do mundo, pro meu beat!'],
      en: ['«Se liga» (listen up): will you help? Record some sounds for me.', '«Se liga» (listen up): will you help me out? Record some sounds out there for me. Real sounds, from the world, for my beat!'] },
    'phonk.meet.recorder': {
      pt: ['Toma o meu gravador. É só chegar perto do som e gravar.', 'Toma, o meu gravador. É só chegar perto de um som e apertar o botão vermelho. Fácil!'],
      en: ['Here’s my recorder. Just get close to a sound and record.', 'Here, take my recorder. Just get close to a sound and press the red button. Easy!'] },
    'phonk.meet.ducks': {
      pt: ['Começa pelos {w.duck:pl}, ali na {w.water}. Mas eles são tímidos.', 'Começa pelos {w.duck:pl}, ali na {w.water}. Mas eles são tímidos… manda o {mimo} pular perto deles!'],
      en: ['Start with the {w.duck:pl}, over on the {w.water}. But they’re shy.', 'Start with the {w.duck:pl}, over on the {w.water}. But they’re shy… tell {mimo} to jump in near them!'] },
    'phonk.meet.where': {
      pt: ['Depois: o {w.bell} da torre, o {w.train}, a ovelha da fazenda, os sapos do rio…', 'Depois: o {w.bell} da torre aqui de Alba, o apito do {w.train} na estação, a ovelha com chocalho na fazenda, os sapos do rio… e o Grande Moinho, se ele voltar a girar.'],
      en: ['Then: the tower’s {w.bell}, the {w.train}, the sheep at the farm, the frogs by the river…', 'Then: the {w.bell} in Alba’s tower, the {w.train}’s whistle at the station, the sheep with the cowbell at the farm, the frogs by the river… and the Great Mill, if it ever turns again.'] },
    'phonk.meet.four': {
      pt: ['Me traz quatro sons e a gente faz um beat irado. Partiu?', 'Me traz quatro sons e a gente faz o beat mais irado da cidade. Partiu?'],
      en: ['Bring me four sounds and we’ll make an «irado» (awesome) beat. «Partiu?» (let’s go?)', 'Bring me four sounds and we’ll make the most «irado» (awesome) beat in town. «Partiu?» (let’s go?)'] },
    'phonk.again.ducks': {
      pt: ['E os {w.duck:pl}? Ali na {w.water}, mano!', 'E os {w.duck:pl}, mano? Tão ali na {w.water}. Manda o {mimo} pular!'],
      en: ['What about the {w.duck:pl}? Right there on the {w.water}, «mano» (bro)!', 'What about the {w.duck:pl}, «mano» (bro)? They’re right there on the {w.water}. Tell {mimo} to jump!'] },
    'phonk.again.more': {
      pt: ['Faltam {n} sons. Cê consegue!', 'Ainda faltam {n} sons, véi. Cê consegue! O {w.bell}, o {w.train}, a ovelha, os sapos…'],
      en: ['{n} more sounds to go. You can do it!', 'Still {n} sounds to go, «véi» (dude). You can do it! The {w.bell}, the {w.train}, the sheep, the frogs…'] },
    // what he says about each sound you bring (and the slang you say back)
    'phonk.got.ducks': { pt: ['Um {w.duck} no beat? Irado!', 'Haha! Um {w.duck} no beat? Ficou irado!'], en: ['A {w.duck} in the beat? «Irado!» (awesome!)', 'Haha! A {w.duck} in the beat? It’s «irado!» (awesome!)'] },
    'phonk.got.bell': { pt: ['O {w.bell} da torre? Da hora!', 'O {w.bell} da torre? Ele não tocava há semanas… Da hora!'], en: ['The tower’s {w.bell}? «Da hora!» (awesome!)', 'The tower’s {w.bell}? It hadn’t rung in weeks… «Da hora!» (awesome!)'] },
    'phonk.got.train': { pt: ['O {w.train}! Piuí! Partiu!', 'O apito do {w.train}! Piuí! No funk a gente ama um apito. Partiu, partiu!'], en: ['The {w.train}! «Piuí!» (choo-choo!) «Partiu!» (let’s go!)', 'The {w.train}’s whistle! «Piuí!» In funk we love a whistle. «Partiu, partiu!» (let’s go!)'] },
    'phonk.got.sheep': { pt: ['Um chocalho de {w.sheep}! É o cowbell perfeito. Top!', 'Um chocalho de {w.sheep}! No phonk o cowbell é tudo, e esse é perfeito. Top demais!'], en: ['A {w.sheep}’s cowbell! The perfect cowbell. «Top!» (great!)', 'A {w.sheep}’s cowbell! In phonk the cowbell is everything, and this one’s perfect. «Top demais!» (so great!)'] },
    'phonk.got.frogs': { pt: ['Pô, véi, que sapo grave!', 'Pô, véi! Que sapo grave! Parece um 808!'], en: ['«Pô, véi!» (man, dude!) What a deep frog!', '«Pô, véi!» (man, dude!) What a deep frog! It sounds like an 808!'] },
    'phonk.got.gears': { pt: ['As engrenagens do moinho! Firmeza!', 'As engrenagens do Grande Moinho! Tique, taque, clac… Firmeza!'], en: ['The mill’s gears! «Firmeza!» (solid!)', 'The Great Mill’s gears! Tick, tack, clack… «Firmeza!» (solid!)'] },
    'phonk.got.listen': { pt: ['Deixa eu ouvir…'], en: ['Let me hear it…'] },
    // the beat comes together
    'phonk.build.start': { pt: ['Quatro sons! Bora montar o beat.', 'Quatro sons! Agora bora montar o beat. Escuta só…'], en: ['Four sounds! Let’s build the beat.', 'Four sounds! Now let’s build the beat. Just listen…'] },
    'phonk.build.done': {
      pt: ['Ficou irado! Mas falta uma coisa: a letra.', 'Ficou mó irado! Mas ainda falta uma coisa: a letra. Um beat sem letra é mó triste.'],
      en: ['It’s «irado!» (awesome!) But one thing’s missing: the lyrics.', 'It’s «mó irado!» (super awesome!) But one thing’s still missing: the lyrics. A beat without words is «mó» (super) sad.'] },
    'phonk.build.battle': {
      pt: ['Bora fazer uma batalha? Eu canto, e você completa com uma palavra que rima. Tá ligado?', 'Bora fazer uma batalha de rima? Eu canto o verso, e você completa com a palavra que rima. No ritmo! Tá ligado?'],
      en: ['How about a «batalha» (rap battle)? I rap, you finish with a word that rhymes. «Tá ligado?» (got it?)', 'How about a rhyme «batalha» (rap battle)? I rap the line, you finish it with the word that rhymes. On the beat! «Tá ligado?» (got it?)'] },
    'phonk.bat.next': { pt: ['Mandou bem! Agora é pra valer.', 'Mandou bem no treino! Agora é pra valer, tá ligado?'], en: ['Nice one! Now it’s for real.', 'Nice one in practice! Now it’s for real, «tá ligado?» (you know?)'] },
    'phonk.bat.won': { pt: ['Que batalha! Mandou muito bem!', 'Que batalha, mano! Cê mandou muito bem. A nossa faixa tá pronta!'], en: ['What a battle! You killed it!', 'What a battle, «mano» (bro)! You killed it. Our track is done!'] },
    'phonk.bat.quit': { pt: ['De boa, depois a gente continua.', 'De boa, mano. Depois a gente continua. Eu tô sempre aqui.'], en: ['«De boa» (no worries), we’ll pick it up later.', '«De boa, mano.» (no worries, bro.) We’ll pick it up later. I’m always here.'] },
    // the track, and his thanks
    'phonk.track.intro': {
      pt: ['Escuta a nossa faixa: «Lagoa sem Silêncio»!', 'Escuta só a nossa faixa: «Lagoa sem Silêncio». DJ Lagoa, com você e o {mimo}!'],
      en: ['Listen to our track: «Lagoa sem Silêncio», Pond Without Silence!', 'Just listen to our track: «Lagoa sem Silêncio», Pond Without Silence. DJ Lagoa, featuring you and {mimo}!'] },
    'phonk.track.gift': { pt: ['Toma: um {w.headphones} pro {mimo}. Presente!', 'Toma, pro {mimo}: um {w.headphones} igualzinho ao meu. Presente do DJ Lagoa!'], en: ['Here, {w.headphones} for {mimo}. A gift!', 'Here, {mimo} gets {w.headphones} just like mine. A gift from DJ Lagoa!'] },
    'phonk.track.tape': { pt: ['E a fita com a nossa música, pra ouvir na estrada.', 'E a fita com a nossa música, pra ouvir na estrada. Cuida bem dela, hein?'], en: ['And the tape with our song, for the road.', 'And the tape with our song, for the road. Take good care of it, okay?'] },
    'phonk.track.sweet': {
      pt: ['Sabe… antes de vocês, eu ficava aqui sozinho.', 'Sabe… antes de vocês, eu ficava aqui sozinho o dia inteiro, de fone. Agora eu tenho uma galera. Tamo junto!'],
      en: ['You know… before you two came, I sat here alone.', 'You know… before you two came, I sat here alone all day, «fone» on. Now I’ve got a crew. «Tamo junto!» (I’ve got your back!)'] },
    'phonk.after': { pt: ['E aí, galera! Bora uma batalha?', 'E aí, galera! Bora mais uma batalha, ou só um papo?'], en: ['«E aí»! (hey!) Up for a battle?', '«E aí», you two! Another battle, or just a chat?'] },
    'phonk.after.bye': { pt: ['Valeu! Tamo junto.', 'Valeu, mano! Tamo junto, sempre.'], en: ['«Valeu!» (cheers!) «Tamo junto.»', '«Valeu, mano!» (cheers, bro!) «Tamo junto», always.'] },
    'phonk.drill.start': { pt: ['Bora treinar umas gírias?', 'Bora treinar umas gírias? Eu falo em inglês, e você responde em brasileiro.'], en: ['Want to practice some slang?', 'Want to practice some slang? I say it in English, and you answer in Brazilian.'] },
    'phonk.drill.end': { pt: ['Mandou bem! Já fala que nem gente daqui.', 'Mandou bem! Daqui a pouco cê vira paulista, carioca e brasiliense ao mesmo tempo.'], en: ['Nice! You already talk like people from here.', 'Nice! Soon you’ll be from São Paulo, Rio and Brasília all at once.'] },
    // ---- the chapters (2026-11-13)
    'phonk.menu': { pt: ['E aí! Tudo suave?', 'E aí! Tudo suave? Senta aí, o beat tá rolando.'], en: ['«E aí»! (hey!) All chill?', '«E aí»! (hey!) All chill? Have a seat, the beat’s rolling.'] },
    'phonk.wait1': { pt: ['E aí! Tô no meu beat agora… depois a gente conversa.', 'E aí! Tô no meu beat agora, tá ligado? Depois a gente troca uma ideia.'], en: ['Hey! I’m in my beat right now… we’ll talk later.', 'Hey! I’m deep in my beat right now, «tá ligado?» (you know?) We’ll have a chat later.'] },
    'phonk.c1.where': {
      pt: ['Depois, o {w.bell} da torre. Esse é difícil: fica lá no alto!', 'Depois, o {w.bell} da torre aqui de Alba. Esse é difícil, véi: fica lá no alto, ninguém alcança!'],
      en: ['Then the tower’s {w.bell}. That one’s hard: it’s way up high!', 'Then the {w.bell} in Alba’s tower. That one’s tricky, «véi» (dude): it’s way up high, nobody can reach it!'] },
    'phonk.c1.two': {
      pt: ['Dois sons: os {w.duck:pl} e o {w.bell}. Partiu?', 'Me traz esses dois sons, e a gente começa o beat mais irado da cidade. Partiu?'],
      en: ['Two sounds: the {w.duck:pl} and the {w.bell}. «Partiu?» (let’s go?)', 'Bring me those two sounds, and we’ll start the most «irado» (awesome) beat in town. «Partiu?» (let’s go?)'] },
    'phonk.again.bell': {
      pt: ['E o {w.bell} da torre? Manda o {mimo} jogar uma pedrinha!', 'E o {w.bell} lá da torre, mano? É alto demais… mas o {mimo} pode jogar uma pedrinha nele!'],
      en: ['What about the tower’s {w.bell}? Tell {mimo} to throw a pebble!', 'What about the {w.bell} up in the tower, «mano» (bro)? It’s way too high… but {mimo} can throw a pebble at it!'] },
    'phonk.c1.end': {
      pt: ['Pato e sino! O beat tá nascendo… mas ainda tá magrinho.', 'Pato e sino! O beat tá nascendo, véi… mas ainda tá magrinho. Preciso de mais sons lá de fora.'],
      en: ['Duck and bell! The beat’s being born… but it’s still skinny.', 'Duck and bell! The beat’s being born, «véi» (dude)… but it’s still skinny. I need more sounds from out there.'] },
    'phonk.c1.hill': {
      pt: ['Mas tem um caladão lá no morro. Quando ele sumir, a gente continua.', 'Mas tem um caladão gigante lá no morro, e eu não vou lá nem pensar. Quando ele sumir, volta aqui, beleza?'],
      en: ['But there’s a big Hushling up on the hill. When it’s gone, we’ll keep going.', 'But there’s a giant Hushling up on the hill, and I’m not going up there, no way. When it’s gone, come back, «beleza?» (deal?)'] },
    'phonk.c2.start': {
      pt: ['O caladão do morro já era! Agora dá pra sair de Alba.', 'O caladão do morro já era, véi! Cê viu? Agora dá pra sair de Alba sem medo.'],
      en: ['The big Hushling on the hill is history! Now we can get out of Alba.', 'The big Hushling on the hill is history, «véi» (dude)! You saw it? Now we can leave Alba without being scared.'] },
    'phonk.c2.list': {
      pt: ['Me traz mais três sons: o apito do {w.train}, a ovelha da fazenda, os sapos do rio…', 'Me traz mais três sons lá de fora: o apito do {w.train} na estação, a ovelha com chocalho lá na fazenda, os sapos lá do rio…'],
      en: ['Bring me three more sounds: the {w.train}’s whistle, the sheep at the farm, the frogs by the river…', 'Bring me three more sounds from out there: the {w.train}’s whistle at the station, the sheep with the cowbell out at the farm, the frogs down by the river…'] },
    'phonk.c2.go': { pt: ['Partiu! O {mimo} já tá pronto.', 'Partiu! Olha o {mimo}: já tá dançando de animação.'], en: ['«Partiu!» (let’s go!) {mimo}’s ready.', '«Partiu!» (let’s go!) Look at {mimo}: already dancing with excitement.'] },
    'phonk.c2.end': {
      pt: ['Agora falta a letra. E pra letra, eu quero uma batalha!', 'Agora só falta a letra, e pra letra eu quero uma batalha de rima, valendo!'],
      en: ['Now the lyrics are missing. And for the lyrics, I want a battle!', 'Now only the lyrics are missing, and for those I want a rhyme battle, for real!'] },
    'phonk.c2.mill': {
      pt: ['Mas o Grande Moinho tá parado… Quando ele voltar a girar, volta aqui!', 'Mas antes… o Grande Moinho tá parado, e eu quero o som dele também. Quando ele voltar a girar, volta aqui: aí é batalha!'],
      en: ['But the Great Mill has stopped… When it turns again, come back!', 'But first… the Great Mill has stopped, and I want its sound too. When it turns again, come back: then it’s battle time!'] },
    'phonk.c3.start': {
      pt: ['O moinho voltou a girar! Agora sim: batalha!', 'Cê ouviu? O Grande Moinho voltou a girar! Agora sim, mano: bora pra batalha!'],
      en: ['The mill’s turning again! Now we’re talking: battle!', 'You hear that? The Great Mill is turning again! Now we’re talking, «mano» (bro): let’s battle!'] },
    'phonk.c3.end': {
      pt: ['Já pensou se a cidade inteira dançasse junto?', 'Sabe o que eu tô pensando? Um dia a cidade inteira vai dançar junto, aqui na lagoa. Mas ainda não… o Silêncio tá forte demais.'],
      en: ['Imagine if the whole town danced together?', 'You know what I’m thinking? One day the whole town’s going to dance together, right here at the pond. But not yet… the Hush is still too strong.'] },
    'phonk.wait4': {
      pt: ['Tô com uma ideia… mas o Silêncio ainda tá forte. Quando tocar mais um sino, eu te conto!', 'Tô com uma ideia na cabeça, véi… mas o Silêncio ainda tá forte. Quando tocar mais um sino, eu te conto, tá ligado?'],
      en: ['I’ve got an idea… but the Hush is still strong. When another bell rings, I’ll tell you!', 'I’ve got an idea in my head, «véi» (dude)… but the Hush is still strong. When another bell rings, I’ll tell you, «tá ligado?» (you know?)'] },
    'phonk.wait5': {
      pt: ['A letra tá pronta. Quando mais um sino tocar, é baile!', 'A letra tá pronta, o beat tá pronto… Quando mais um sino tocar, aí é baile, tá ligado?'],
      en: ['The lyrics are ready. When one more bell rings, it’s baile time!', 'The lyrics are ready, the beat is ready… When one more bell rings, then it’s baile time, «tá ligado?» (you know?)'] },
  };
  if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v;
  // your own lines and thoughts (English, with the words woven in)
  const YOU = {
    leak: 'Is that… music? It’s leaking out of somebody’s {w.headphones}!',
    meet: 'He’s nodding along with his eyes shut… he can’t hear me over that beat.',
    mimo: 'That’s {mimo}! It loves your {w.music}.',
    sure: 'Sure! Sounds from all over the land… we’re on it.',
    ducksShy: 'The {w.duck:pl} paddle away from me. They’re shy…',
    bellHigh: 'The old {w.bell}, way up in the {w.tower}. Too high to reach… but not too high to hit with a pebble!',
    trainGone: 'No {w.train} right now. It comes back to the station now and then: I’ll wait for it here.',
    sheep: 'One of the {w.sheep} has a little cowbell round its neck. Dlang, dlang!',
    frogs: 'Frogs, croaking somewhere in the reeds. Shh…',
    gearsHushed: 'The Great Mill is silent. The Hush stopped its gears… nothing to record yet.',
    gears: 'Tick, tack, clack… the Great Mill’s gears, turning again.',
    four: 'That’s four sounds! Back to Kauã, at Alba’s pond.',
    two: 'The {w.duck:pl} and the {w.bell}! Back to Kauã, at the pond.',
    bellNext: 'Got the {w.duck:pl}! Now the old {w.bell} up in Alba’s {w.tower}…',
    ducksNext: 'The {w.bell} rang! Now the shy {w.duck:pl} on the pond…',
  };
  const fill = (s, vars = {}) => String(s).replace(/\{mimo\}/g, () => mimoName()).replace(/\{n\}/g, () => vars.n !== undefined ? vars.n : '');
  // a line for the player's level (as lines.js picks them): the Portuguese, its English, and the English to weave
  function lineOf(key, vars) {
    const L = LT[key] || (typeof LINES !== 'undefined' && LINES[key] && LINES[key].pt ? LINES[key] : null); if (!L) return { text: key, en: key, weave: key };
    const tier = typeof LEX !== 'undefined' ? LEX.tier() : 1, arr = L.pt, i = Math.min(arr.length, Math.max(1, tier)) - 1, en = L.en || [''];
    return { text: fill(arr[i], vars), en: fill(en[Math.min(en.length - 1, i)], vars), weave: fill(en[en.length - 1], vars) };
  }

  // ================================================================ the batalha's verses: two lines each, the last word missing
  // a: the first line · b: the second, ending in the gap · best: the words that rhyme and fit · suf: rhyme endings (any word
  // ending like that counts as a rhyme) · fits: words that fit but don't rhyme · opts: three to pick from (Treino, easy) ·
  // cue: the word it rhymes with · en: the lines in English · gloss: what the missing word means
  const R = (a, b, best, suf, cue, en, gloss, o = {}) => ({ a, b, best, suf, cue, en, gloss, fits: o.fits || [], opts: o.opts || null });
  const LEVELS = {
    1: { name: 'Treino', sub: 'warm-up · 4 rounds · with options', bpm: 120, en: 'full', help: 'opts', rounds: [
      R('E aí, galera, chegou o DJ Lagoa,', 'o beat tá pesado, mas a vibe é ___', ['boa'], ['oa'], 'lagoa', ['Hey, everyone, DJ Pond is here,', 'the beat is heavy, but the vibe is ___'], 'good', { opts: ['boa', 'fria', 'rua'], fits: ['legal', 'top', 'ótima', 'linda', 'massa'] }),
      R('{mimo} dança no grave, {mimo} dança no som,', 'pequeno no tamanho, mas o passinho é ___', ['bom'], ['om'], 'som', ['{mimo} dances to the bass, {mimo} dances to the sound,', 'small in size, but its little dance step is ___'], 'good', { opts: ['bom', 'mau', 'sol'], fits: ['top', 'lindo', 'legal', 'demais'] }),
      R('O trem apitou: piuí, piuí!', 'o beat tá na rua, e a gente tá ___', ['aqui'], ['i'], 'piui', ['The train whistled: «piuí, piuí!»,', 'the beat is out on the street, and we are ___'], 'here', { opts: ['aqui', 'casa', 'mar'], fits: ['juntos', 'felizes', 'prontos'] }),
      R('Mó calor, mó sol, o céu todo azul,', 'o som tá irado de norte a ___', ['sul'], ['ul'], 'azul', ['Super hot, super sunny, the sky all blue,', 'the sound is awesome from north to ___'], 'south', { opts: ['sul', 'leste', 'mar'] }),
    ] },
    2: { name: 'Valendo', sub: 'for real · 6 rounds · the rhyme ending shown', bpm: 130, en: 'gap', help: 'suffix', rounds: [
      R('Cheguei no beat, cheguei no grave,', '{mimo} no flow, e tá tudo ___', ['suave'], ['ave'], 'grave', ['I came in on the beat, I came in on the bass,', '{mimo} in the flow, and everything’s ___'], 'chill', { fits: ['bem', 'certo', 'beleza', 'top', 'de boa'] }),
      R('Se liga, mano, presta atenção:', 'o grave tá batendo no meu ___', ['coração'], ['ão'], 'atenção', ['Listen up, bro, pay attention:', 'the bass is pounding in my ___'], 'heart', { fits: ['peito'] }),
      R('Na lagoa eu tô de boa,', 'o pato canta, e o sino ___', ['soa', 'ecoa'], ['oa'], 'boa', ['At the pond I’m chilling,', 'the duck sings, and the bell ___'], 'rings out', { fits: ['toca', 'bate', 'canta'] }),
      R('Quem fala errado não precisa parar:', 'errando e falando, cê vai ___', ['acertar', 'melhorar', 'arrasar'], ['ar'], 'parar', ['Whoever speaks wrong doesn’t need to stop:', 'making mistakes and talking, you’re going to ___'], 'get it right', { fits: ['aprender', 'crescer', 'conseguir'] }),
      R('Firmeza, véi, é o som do Brasil,', 'o beat mais top que alguém já ___', ['ouviu', 'viu'], ['iu', 'il'], 'brasil', ['Solid, dude, it’s the sound of Brazil,', 'the topmost beat that anyone ever ___'], 'heard', { fits: ['fez'] }),
      R('O Silêncio veio, mas ninguém se cala,', 'o funk tá na rua, o funk tá na ___', ['fala', 'sala'], ['ala'], 'cala', ['The Hush came, but nobody goes quiet,', 'funk is out on the street, funk is in our ___'], 'speech', { fits: ['boca', 'voz', 'casa'] }),
    ] },
    3: { name: 'Final', sub: '140 bpm · 6 rounds · no hints', bpm: 140, en: 'off', help: 'none', rounds: [
      R('Tamo junto, {mimo}, tamo junto, parceiro,', 'a gente fala alto o dia ___', ['inteiro'], ['eiro'], 'parceiro', ['We’re in this together, {mimo}, together, partner,', 'we speak up all day ___'], 'long', { fits: ['todo'] }),
      R('O bagulho é doido, o grave é pesado,', 'quem não fala nada acaba ___', ['calado'], ['ado', 'ada'], 'pesado', ['Things are wild, the bass is heavy,', 'whoever says nothing ends up ___'], 'silent', { fits: ['sozinho', 'triste', 'quieto'] }),
      R('Da hora, da hora, o sapo pulou,', 'caiu na lagoa, e o pato ___', ['voou', 'nadou', 'gritou', 'dançou'], ['ou'], 'pulou', ['Awesome, awesome, the frog jumped,', 'it fell into the pond, and the duck ___'], 'flew off', { fits: ['fugiu', 'riu'] }),
      R('Pô, Kauã, cê é muito irado,', 'o seu beat é top, e o meu verso é ___', ['afiado', 'pesado'], ['ado'], 'irado', ['Man, Kauã, you’re so awesome,', 'your beat is top, and my verse is ___'], 'sharp', { fits: ['bom', 'forte', 'top', 'lindo'] }),
      R('E aí, Alba? Partiu, beleza?', 'o Silêncio vai embora, isso é ___', ['certeza', 'firmeza'], ['eza'], 'beleza', ['What’s up, Alba? Let’s go, all good?', 'the Hush is going away, that’s for ___'], 'sure', { fits: ['verdade'] }),
      R('Valeu, galera, valeu, valeu,', 'o beat é do {mimo}, e o verso é ___', ['meu', 'seu', 'teu'], ['eu'], 'valeu', ['Thanks, everyone, thanks, thanks,', 'the beat is {mimo}’s, and the verse is ___'], 'mine', { fits: ['nosso', 'nossa'] }),
    ] },
  };
  const GRADES = 'SABCD';
  const gradeOf = total => total >= 8.5 ? 'S' : total >= 7 ? 'A' : total >= 5 ? 'B' : total >= 3 ? 'C' : 'D';
  const COINS = { S: 30, A: 22, B: 15, C: 10, D: 5 }, LV_COINS = { 1: 0.5, 2: 1, 3: 1.4 };
  const WORD_FB = { best: ['RIMOU E ENCAIXOU!', 'rhymes and fits'], close: ['QUASE!', 'one letter off'], rhyme: ['RIMOU!', 'it rhymes'], fits: ['ENCAIXOU', 'fits, but doesn’t rhyme'],
    repeat: ['REPETIU, VÉI!', 'that’s the same word, dude'], miss: ['NÃO RIMOU…', 'doesn’t rhyme'], none: ['PÔ, CADÊ?', 'where’s your word?'] };
  // the last word you typed, as you typed it (accents and all), without punctuation
  const cleanWord = text => { const t = String(text || '').trim().split(/\s+/).pop() || ''; return t.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, ''); };
  // How well a word finishes a verse: best (rhymes and fits) 3 · one letter off a best 2 · rhymes 2 · fits without a rhyme 1.5 ·
  // the cue word again 1 · anything else 0. Each hint takes half a point off.
  function judgeWord(def, text, hints = 0) {
    const raw = norm(text), toks = raw ? raw.split(' ') : [], last = toks[toks.length - 1] || '';
    let r = null;
    if (!last) r = { kind: 'none', score: 0, show: '' };
    else {
      const best = def.best.map(w => ({ w, n: norm(w) }));
      const hit = best.find(o => o.n === last || o.n === raw);
      if (hit) r = { kind: 'best', score: 3, show: hit.w };
      else { const near = best.find(o => o.n.length >= 4 && lev(last, o.n) === 1); if (near) r = { kind: 'close', score: 2, show: near.w }; }
      if (!r && last === norm(def.cue)) r = { kind: 'repeat', score: 1, show: cleanWord(text) };
      if (!r && last.length >= 3 && def.suf.some(s => last.endsWith(norm(s)))) r = { kind: 'rhyme', score: 2, show: cleanWord(text) };
      if (!r && def.fits.some(f => norm(f) === last || norm(f) === raw)) r = { kind: 'fits', score: 1.5, show: cleanWord(text) };
      if (!r) r = { kind: 'miss', score: 0, show: cleanWord(text) };
    }
    r.score = Math.max(0, r.score - 0.5 * hints);
    return r;
  }
  // Timing (seconds off the ★ beat): within 0.1 perfect, 0.2 good, 0.4 on time; outside that, early or late
  function timingOf(d) {
    const a = Math.abs(d);
    if (a <= 0.1) return { kind: 'perfect', score: 3, label: 'PERFEITO!', en: 'perfect timing', d };
    if (a <= 0.2) return { kind: 'good', score: 2, label: 'BOA!', en: 'good timing', d };
    if (a <= 0.4) return { kind: 'ok', score: 1, label: 'NO TEMPO', en: 'on time', d };
    return d < 0 ? { kind: 'early', score: 0.5, label: 'ADIANTADO', en: 'too early', d } : { kind: 'late', score: 0.5, label: 'ATRASADO', en: 'too late', d };
  }
  // Is this one of the phrase's accepted forms (accents, case and punctuation don't matter: «tá ligado?» = "ta ligado"),
  // or does the sentence contain one ("Suave, mano!")?
  function phraseIn(id, text) {
    if (!LEX.item(id)) return false;
    const was = LEX.lang; LEX.lang = 'pt';
    try {
      if (LEX.check(id, text).ok) return true;
      const n = ' ' + norm(text) + ' ';
      return LEX.accepted(id).some(a => { const m = norm(a); return m && n.includes(' ' + m + ' '); });
    } finally { LEX.lang = was; }
  }

  // ================================================================ the model: Kauã on his red crate (toon parts, like actors.js)
  const C = { skin: '#9c6644', hair: '#1d1512', bleach: '#f3dd8c', jersey: '#ffd23f', trim: '#169b52', shorts: '#26336a', sock: '#fbf8f2', shoe: '#f6f2ea',
    sole: '#3ee07a', phones: '#25212d', ring: '#4cff8a', crate: '#d8402f', crateD: '#9c2a1e', phone: '#2b2235' };
  const lathe = (pts, n = 18) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
  const NUM_TEX = TK.canvasTex(64, 64, c => { c.font = '900 40px Bahnschrift, "Segoe UI", sans-serif'; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = '#fffaf0'; c.fillStyle = C.trim; c.strokeText('10', 32, 46); c.fillText('10', 32, 46); });
  const noteTex = ch => TK.canvasTex(64, 64, c => { c.font = '900 50px "Segoe UI Symbol", "Segoe UI", sans-serif'; c.textAlign = 'center'; c.lineWidth = 7; c.strokeStyle = '#fffaf0'; c.fillStyle = '#21a493'; c.strokeText(ch, 30, 50); c.fillText(ch, 30, 50); });
  const NOTE1 = noteTex('♪'), NOTE2 = noteTex('♫');
  const WAVE_GEO = new THREE.RingGeometry(0.15, 0.178, 28);
  function eye(parent, x, y, z, sx, sy) {
    const e = new THREE.Group(); e.position.set(x, y, z); parent.add(e);
    e.add(part(GEO.sphere, '#2b2235', null, [sx, sy, sx * 0.62], { ink: 0, rim: 0 }));
    const hl = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#ffffff' })); hl.scale.setScalar(sx * 0.42); hl.position.set(sx * 0.32, sy * 0.38, sx * 0.55); e.add(hl);
    return e;
  }
  function buildKaua(group) {
    const root = new THREE.Group(); root.name = 'phonk-kaua'; group.add(root);
    const K = { root };
    // the crate (a red plastic «engradado»), its slots dark
    root.add(part(GEO.box, C.crate, [0, 0.2, -0.04], [0.62, 0.4, 0.5], { ink: 0.012 }));
    [-0.17, 0, 0.17].forEach(x => { root.add(part(GEO.box, C.crateD, [x, 0.25, 0.212], [0.11, 0.17, 0.02], { ink: 0 })); root.add(part(GEO.box, C.crateD, [x, 0.25, -0.292], [0.11, 0.17, 0.02], { ink: 0 })); });
    [-1, 1].forEach(s => root.add(part(GEO.box, C.crateD, [s * 0.312, 0.25, -0.04], [0.02, 0.17, 0.32], { ink: 0 })));
    const body = new THREE.Group(); body.position.y = 0.42; root.add(body); K.body = body;
    // legs (shorts, long socks, chunky white sneakers with neon soles): sitting, the hips turn the thighs forward
    K.legs = [-1, 1].map(s => {
      const hip = new THREE.Group(); hip.position.set(s * 0.13, 0.05, 0); body.add(hip);
      hip.add(part(GEO.cyl, C.shorts, [0, -0.14, 0], [0.115, 0.3, 0.115]));
      const knee = new THREE.Group(); knee.position.set(0, -0.28, 0); hip.add(knee);
      knee.add(part(GEO.cyl, C.skin, [0, -0.12, 0], [0.065, 0.24, 0.065]));
      knee.add(part(GEO.cyl, C.sock, [0, -0.29, 0], [0.072, 0.12, 0.072], { ink: 0.008 }));
      knee.add(part(GEO.sphere, C.shoe, [0, -0.38, 0.06], [0.1, 0.075, 0.165]));
      knee.add(part(GEO.cyl, C.sole, [0, -0.43, 0.06], [0.1, 0.03, 0.165], { ink: 0.006 }));
      return { hip, knee };
    });
    // the yellow jersey with a green collar and hem, the 10 on the back, a thin gold chain
    const torso = new THREE.Group(); torso.position.y = 0.04; body.add(torso); K.torso = torso;
    torso.add(part(lathe([[0, 0], [0.29, 0.02], [0.31, 0.14], [0.29, 0.4], [0.25, 0.56], [0.13, 0.62], [0, 0.63]]), C.jersey));
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.028, 8, 20), TK.toon(C.trim)); collar.rotation.x = Math.PI / 2; collar.position.y = 0.6; torso.add(collar);
    torso.add(part(GEO.cyl, C.trim, [0, 0.035, 0], [0.297, 0.045, 0.297], { ink: 0 }));
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: NUM_TEX, transparent: true, depthWrite: false }));
    num.position.set(0, 0.33, -0.302); num.rotation.y = Math.PI; torso.add(num);
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.011, 6, 24), TK.toon('#f2c14e', { rim: 0.6 })); chain.position.set(0, 0.54, 0.05); chain.rotation.x = Math.PI / 2 + 0.4; torso.add(chain);
    K.arms = [-1, 1].map(s => {
      const sh = new THREE.Group(); sh.position.set(s * 0.27, 0.52, 0.02); torso.add(sh);
      sh.add(part(GEO.cyl, C.jersey, [0, -0.09, 0], [0.085, 0.18, 0.085]));
      sh.add(part(GEO.cyl, C.trim, [0, -0.18, 0], [0.088, 0.025, 0.088], { ink: 0 }));
      const el = new THREE.Group(); el.position.set(0, -0.2, 0); sh.add(el);
      el.add(part(GEO.cyl, C.skin, [0, -0.1, 0], [0.058, 0.2, 0.058]));
      el.add(part(GEO.sphere, C.skin, [0, -0.22, 0], [0.065, 0.06, 0.065]));
      return { sh, el, s };
    });
    // his phone (the beat's on it), held at his chest, the screen glowing up at him
    const phone = new THREE.Group(); phone.position.set(0, 0.4, 0.31); torso.add(phone); K.phone = phone;
    phone.add(part(GEO.box, C.phone, [0, 0, 0], [0.11, 0.19, 0.018], { ink: 0.006 }));
    K.screen = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: '#7ff7ea' })); K.screen.scale.set(0.092, 0.165, 0.004); K.screen.position.z = 0.0105; phone.add(K.screen);
    phone.rotation.x = -1.3;
    // the head: a fade with a bleached top, a little smirk
    const neck = new THREE.Group(); neck.position.y = 0.6; torso.add(neck);
    const head = new THREE.Group(); neck.add(head); K.head = head;
    head.add(part(GEO.cyl, C.skin, [0, 0.03, 0], [0.09, 0.1, 0.09], { ink: 0.01 }));
    head.add(part(GEO.sphere, C.skin, [0, 0.27, 0], [0.31, 0.3, 0.29]));
    head.add(part(new THREE.SphereGeometry(1, 20, 12, 0, TAU, 0, Math.PI * 0.45), C.hair, [0, 0.29, -0.015], [0.32, 0.31, 0.31], { rot: [-0.3, 0, 0] }));
    head.add(part(new THREE.SphereGeometry(1, 18, 8, 0, TAU, 0, Math.PI * 0.32), C.bleach, [0, 0.355, 0.01], [0.285, 0.27, 0.272], { rot: [-0.18, 0, 0], ink: 0.012 }));
    [-1, 1].forEach(s => head.add(part(GEO.sphere, C.skin, [s * 0.3, 0.26, -0.01], [0.05, 0.07, 0.045])));
    K.eyesOpen = [-1, 1].map(s => eye(head, s * 0.11, 0.28, 0.255, 0.045, 0.062));
    K.eyesShut = [-1, 1].map(s => { const e = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: '#2b2235' })); e.position.set(s * 0.11, 0.265, 0.272); head.add(e); return e; });
    [-1, 1].forEach(s => { const b = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: C.hair })); b.scale.set(0.095, 0.02, 0.02); b.position.set(s * 0.11, 0.37, 0.268); b.rotation.z = s * -0.14; head.add(b); });
    [-1, 1].forEach(s => { const b = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#ff8c9a', transparent: true, opacity: 0.35 })); b.scale.set(0.05, 0.028, 0.015); b.position.set(s * 0.18, 0.18, 0.255); head.add(b); });
    K.mouth = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#2b2235' })); K.mouth.scale.set(0.045, 0.012, 0.01); K.mouth.position.set(0.025, 0.155, 0.283); K.mouth.rotation.z = 0.12; head.add(K.mouth);
    // the big headphones: on his head while he listens, down round his neck when he talks
    const ph = new THREE.Group(); head.add(ph); K.phones = ph;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.032, 8, 26, Math.PI), TK.toon(C.phones)); band.position.y = 0.27; ph.add(band); band.add(new THREE.Mesh(band.geometry, TK.outlineMat(0.012)));
    K.cups = [-1, 1].map(s => {
      const cup = new THREE.Group(); cup.position.set(s * 0.36, 0.27, 0); ph.add(cup);
      cup.add(part(GEO.cyl, C.phones, [0, 0, 0], [0.135, 0.1, 0.135], { rot: [0, 0, Math.PI / 2], ink: 0.012 }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 20), new THREE.MeshBasicMaterial({ color: C.ring })); ring.position.x = s * 0.052; ring.rotation.y = Math.PI / 2; cup.add(ring);
      return cup;
    });
    // the beat coming off the cups: rings that spread and fade on every beat, and notes floating up
    K.waves = [];
    K.cups.forEach((cup, i) => { for (let k = 0; k < 2; k++) { const w = new THREE.Mesh(WAVE_GEO, new THREE.MeshBasicMaterial({ color: C.ring, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); w.rotation.y = Math.PI / 2; cup.add(w); K.waves.push({ m: w, s: i ? 1 : -1, t: 1 }); } });
    K.notes = [0, 1, 2, 3, 4, 5].map(i => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: i % 2 ? NOTE2 : NOTE1, transparent: true, opacity: 0, depthWrite: false })); sp.scale.setScalar(0.34); group.add(sp); return { sp, t: 9, vx: 0, vz: 0 }; });
    root.traverse(o => { if (o.isMesh && o.material && !o.material.transparent && o.material.type !== 'MeshBasicMaterial') o.castShadow = true; });
    return K;
  }
  // Mimo's own headphones (the reward): teal band behind the ears, yellow cups, green rings
  function buildMimoPhones(body) {
    const g = new THREE.Group(); g.name = 'phonk-mimo-phones'; body.add(g);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.026, 8, 24, Math.PI), TK.toon('#2fd0c2')); band.position.set(0, 0.36, -0.1); band.rotation.x = -0.32; g.add(band); band.add(new THREE.Mesh(band.geometry, TK.outlineMat(0.01)));
    [-1, 1].forEach(s => {
      g.add(part(GEO.cyl, '#ffd23f', [s * 0.335, 0.36, -0.06], [0.1, 0.075, 0.1], { rot: [0, 0, Math.PI / 2], ink: 0.01 }));
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.014, 6, 16), new THREE.MeshBasicMaterial({ color: '#2fae63' })); r.position.set(s * 0.375, 0.36, -0.06); r.rotation.y = Math.PI / 2; g.add(r);
    });
    g.visible = false;
    return g;
  }
  // a floating ♪ over each sound still to record
  function buildMarkers(scene) {
    const g = new THREE.Group(); g.name = 'phonk-markers'; scene.add(g);
    const list = ORDER.map(k => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: NOTE1, transparent: true, depthWrite: false })); sp.scale.setScalar(0.9); sp.visible = false; g.add(sp); return { k, sp }; });
    return { g, list };
  }

  // ================================================================ the sound: his beat leaking out of the headphones, and his speaker for the batalha
  // the leak: highpassed (no bass gets out of headphones), a nasal honk, a little crunch, dull on top; louder as you get
  // close, panned to where he is. The batalha and the track play on "his speaker" (clean, full) instead.
  function makeLeak(ac, inp) {
    const hp = ac.createBiquadFilter(), pk = ac.createBiquadFilter(), drive = ac.createGain(), ws = ac.createWaveShaper(), lp = ac.createBiquadFilter(), vol = ac.createGain();
    hp.type = 'highpass'; hp.frequency.value = 600; hp.Q.value = 0.9;
    pk.type = 'peaking'; pk.frequency.value = 2500; pk.Q.value = 1.2; pk.gain.value = 7;
    drive.gain.value = 3; const n = 1024, cv = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; cv[i] = Math.tanh(x * 1.8); } ws.curve = cv; ws.oversample = '2x';
    lp.type = 'lowpass'; lp.frequency.value = 5200; lp.Q.value = 0.7;
    vol.gain.value = 0;
    inp.connect(hp); hp.connect(pk); pk.connect(drive); drive.connect(ws); ws.connect(lp); lp.connect(vol);
    let tail = vol, pan = null;
    if (ac.createStereoPanner) { pan = ac.createStereoPanner(); vol.connect(pan); tail = pan; }
    return { inp, hp, lp, vol, pan, tail };
  }
  const AUD = { leak: null, deck: null, box: null, on: false, vol: -1, hpF: -1, panV: 9, duck: 1, lastUpd: 0, beatT0: 0 };
  function leakBus() {
    if (AUD.leak) return AUD.leak;
    const ac = Sound.ctx; if (!ac || !Sound.out) return null;
    AUD.leak = makeLeak(ac, ac.createGain()); AUD.leak.tail.connect(Sound.out);
    return AUD.leak;
  }
  function boxBus() {
    if (AUD.box) return AUD.box;
    const ac = Sound.ctx; if (!ac || !Sound.out) return null;
    const inp = ac.createGain(), hp = ac.createBiquadFilter(), vol = ac.createGain();
    hp.type = 'highpass'; hp.frequency.value = 32; vol.gain.value = 0.36;          // (the 'phonk' song's own level)
    inp.connect(hp); hp.connect(vol); vol.connect(Sound.out);
    return (AUD.box = { inp, vol });
  }
  function startLeak() {
    const L = leakBus(); if (!L || AUD.deck) return;
    Sound.phonkMix = mixNow();
    AUD.deck = Sound.deck('phonk_leak', L.inp, { at: Sound.ctx.currentTime + 0.05 });
  }
  function stopLeak() {
    if (AUD.deck) { AUD.deck.stop(); AUD.deck = null; }
    if (AUD.leak) { AUD.leak.vol.gain.setTargetAtTime(0, Sound.ctx.currentTime, 0.05); AUD.vol = 0; }
    Sound.duck('phonk', 1);
  }
  // per frame: is the leak on, how loud, which way, and how much the area's music dips
  function updateLeak(Y, on) {
    const ac = Sound.ctx; AUD.lastUpd = performance.now();
    if (!ac || !Sound.out) return;
    const d = Y ? Math.hypot(Y.x - KAUA.x, Y.z - KAUA.z) : 1e9, busy = BAT.on || TRK.on || DESK.on || !!ext('musicOn');
    const want = on && !busy && Sound.music !== false && d < (AUD.deck ? 40 : 32);
    if (want && !AUD.deck) startLeak();
    if (!want) { if (AUD.deck) stopLeak(); if (!busy) Sound.duck('phonk', 1); AUD.on = false; return; }
    AUD.on = true;
    const L = AUD.leak, now = ac.currentTime, talk = KA.phones;              // round his neck (he's talking): louder and fuller
    const near = clamp(1 - (d - 1.2) / 24, 0, 1), vol = (0.22 + 0.12 * talk) * near * near;
    if (Math.abs(vol - AUD.vol) > 0.003) { AUD.vol = vol; L.vol.gain.setTargetAtTime(vol, now, 0.08); }
    const hpF = 600 - 300 * talk; if (Math.abs(hpF - AUD.hpF) > 5) { AUD.hpF = hpF; L.hp.frequency.setTargetAtTime(hpF, now, 0.15); L.lp.frequency.setTargetAtTime(5200 + 2600 * talk, now, 0.15); }
    if (L.pan && Y) {
      const b = G.cam.basis(), dx = KAUA.x - Y.x, dz = KAUA.z - Y.z, len = Math.hypot(dx, dz) || 1, side = clamp((dx * b.rx + dz * b.rz) / len * 0.7, -0.7, 0.7) * clamp(d / 3, 0, 1);
      if (Math.abs(side - AUD.panV) > 0.02) { AUD.panV = side; L.pan.pan.setTargetAtTime(side, now, 0.1); }
    }
    // the area's music dips as you get close (more while he's talking)
    Sound.duck('phonk', 1 - (0.36 + 0.14 * talk) * clamp(1 - (d - 3) / 11, 0, 1), 0.5);
  }
  // if update stops being called (a fight, a cutaway), the leak goes quiet, and after a while stops
  function watchdog() {
    if (!AUD.deck || !Sound.ctx) return;
    const idle = performance.now() - AUD.lastUpd;
    if (idle > 450 && AUD.vol !== 0) { AUD.leak.vol.gain.setTargetAtTime(0, Sound.ctx.currentTime, 0.08); AUD.vol = 0; }
    if (idle > 4000) stopLeak();
  }
  // where we are in the beat, in beats (for his nodding, the waves and Mimo's dance)
  function beatNow(t) {
    const C0 = BAT.on ? BAT.C : TRK.on ? TRK.C : DESK.on ? DESK.C : null;
    if (C0) return clockNow(C0) / C0.beat;
    const xb = ext('beat', t); if (typeof xb === 'number') return xb;          // (the baile's beat, baile.js)
    const ac = Sound.ctx;
    if (AUD.deck && ac) return (ac.currentTime - AUD.deck.t0 - Math.min(0.2, ac.outputLatency || 0)) / AUD.deck.beat;
    return t * 130 / 60;
  }
  const canSay = () => !!(window.speechSynthesis && speechSynthesis.getVoices().some(v => /^pt/i.test(v.lang.replace('_', '-'))));

  // ================================================================ song clocks (the batalha, the track, the mixing desk): AudioContext time
  // when audio runs (with his speaker's deck locked to it), otherwise game time from update(dt) (tests, no sound)
  function clockNew(song, bpm, o = {}) {
    const ac = Sound.ctx, lead = o.lead !== undefined ? o.lead : 0.5;
    const C0 = { bpm, beat: 60 / bpm, clock: -lead, audio: false, t0: 0, lat: 0, deck: null };
    if (ac && ac.state === 'running' && Sound.out && !TEST.gameClock && boxBus()) {
      C0.audio = true; C0.lat = Math.min(0.2, ac.outputLatency || ac.baseLatency || 0); C0.t0 = ac.currentTime + lead;
      C0.deck = Sound.deck(song, AUD.box.inp, { at: C0.t0, bpm, from: o.from || 0 });
    }
    return C0;
  }
  const clockNow = C0 => (C0.audio && Sound.ctx ? Sound.ctx.currentTime - C0.t0 - C0.lat : C0.clock);
  const clockEnd = C0 => { if (C0 && C0.deck) { C0.deck.stop(); C0.deck = null; } };

  // ================================================================ the overlay (paper card at the bottom, the game's look)
  const CSS = `
  #pk-ui { position: fixed; z-index: 10; left: 50%; bottom: 20px; transform: translateX(-50%); width: min(780px, calc(100vw - 28px)); box-sizing: border-box; background: #fffaf0; color: #2b2235;
    border: 3px solid #2b2235; border-radius: 20px; box-shadow: 0 0 0 6px #fff, 0 12px 0 5px rgba(43,34,53,.18); padding: 12px 18px 12px; font: 15px/1.35 "Segoe UI", system-ui, sans-serif; }
  #pk-ui .pk-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  #pk-ui .pk-tag { font: 800 11px "Segoe UI", sans-serif; letter-spacing: .1em; text-transform: uppercase; opacity: .6; }
  #pk-ui .pk-title { font: 900 21px Bahnschrift, "Segoe UI", sans-serif; }
  #pk-ui .pk-round { font: 800 13px "Segoe UI", sans-serif; opacity: .65; }
  #pk-ui .pk-sp { flex: 1; }
  #pk-ui .pk-btn { border: 2px solid #2b2235; border-radius: 10px; background: transparent; color: #2b2235; font: 800 12px "Segoe UI", sans-serif; padding: 3px 9px; cursor: pointer; }
  #pk-ui .pk-btn.on { background: #2b2235; color: #fffaf0; }
  #pk-ui .pk-beats { display: flex; gap: 4px; margin: 9px 0 8px; }
  #pk-ui .pk-beats i { flex: 1; height: 12px; border-radius: 99px; background: rgba(43,34,53,.12); position: relative; }
  #pk-ui .pk-beats i:nth-child(4n+1) { margin-left: 8px; } #pk-ui .pk-beats i:first-child { margin-left: 0; }
  #pk-ui .pk-beats i.past { background: rgba(33,164,147,.4); }
  #pk-ui .pk-beats i.now { background: #21a493; box-shadow: 0 0 0 2px #21a493; }
  #pk-ui .pk-beats i.tgt { background: #ffcf3f; box-shadow: 0 0 0 2px #2b2235; }
  #pk-ui .pk-beats i.tgt::after { content: "★"; position: absolute; left: 50%; top: -15px; transform: translateX(-50%); font: 900 13px "Segoe UI Symbol", sans-serif; color: #c2412f; }
  #pk-ui .pk-beats i.tgt.now { background: #c2412f; }
  #pk-ui .pk-who { font: 800 12px "Segoe UI", sans-serif; letter-spacing: .06em; text-transform: uppercase; color: #8a4f80; display: flex; justify-content: space-between; }
  #pk-ui .pk-line { font: 700 25px/1.28 Bahnschrift, "Segoe UI", sans-serif; min-height: 32px; }
  #pk-ui .pk-line span { opacity: .4; } #pk-ui .pk-line span.on { opacity: 1; }
  #pk-ui .pk-gap { display: inline-block; min-width: 4.6em; padding: 0 4px; border-bottom: 4px solid #c2412f; color: #c2412f; text-align: center; opacity: 1 !important; }
  #pk-ui .pk-gap.typing { color: rgba(194,65,47,.55); }
  #pk-ui .pk-gap.done { border-bottom-color: #21a493; color: #137267; }
  #pk-ui .pk-gap.bad { border-bottom-color: #8a849a; color: #6b6577; }
  #pk-ui .pk-en { font-size: 14px; font-style: italic; opacity: .72; margin-top: 3px; min-height: 19px; }
  #pk-ui .pk-help { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-height: 26px; margin: 6px 0 7px; font-size: 14px; }
  #pk-ui .pk-chip { font: 800 16px Bahnschrift, "Segoe UI", sans-serif; color: #c2412f; background: #fff; border: 2px solid #2b2235; border-radius: 99px; padding: 0 10px; }
  #pk-ui form { display: flex; gap: 8px; align-items: center; margin: 0; }
  #pk-ui input { flex: 1; min-width: 0; font: 600 22px "Segoe UI", sans-serif; padding: 6px 10px; border: 2.5px solid #2b2235; border-radius: 10px; outline: none; background: #fff; color: #2b2235; }
  #pk-ui input:focus { box-shadow: 0 0 0 3px rgba(33,164,147,.35); } #pk-ui input:disabled { opacity: .55; }
  #pk-ui .pk-go { border: 2.5px solid #2b2235; border-radius: 10px; background: #2b2235; color: #fffaf0; font-weight: 800; padding: 7px 14px; cursor: pointer; }
  #pk-ui .pk-turn { font: 900 22px Bahnschrift, "Segoe UI", sans-serif; color: #21a493; min-width: 150px; text-align: right; white-space: nowrap; }
  #pk-ui .pk-turn.now { color: #c2412f; }
  #pk-ui .pk-fb { display: flex; gap: 12px; align-items: center; justify-content: center; min-height: 44px; margin-top: 6px; }
  #pk-ui .pk-fb b { font: 900 21px Bahnschrift, "Segoe UI", sans-serif; } #pk-ui .pk-fb small { display: block; font-size: 12px; opacity: .65; }
  #pk-ui .pk-grade { display: inline-grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; border: 3px solid #2b2235; font: 900 25px Bahnschrift, "Segoe UI", sans-serif; flex: none; }
  #pk-ui .pk-g-S { background: #ffcf3f; } #pk-ui .pk-g-A { background: #7fe0b0; } #pk-ui .pk-g-B { background: #9cc8ff; } #pk-ui .pk-g-C { background: #f2d3a6; } #pk-ui .pk-g-D { background: #e4e2e8; }
  #pk-ui .pk-keys { font-size: 12px; opacity: .62; margin-top: 7px; }
  #pk-ui kbd { font: 700 11px "Segoe UI", sans-serif; border: 1.5px solid #2b2235; border-radius: 5px; padding: 0 4px; background: #fff; }
  #pk-ui .pk-rows { display: grid; grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 8px; margin-top: 10px; }
  #pk-ui .pk-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 12px; background: #fff; border: 2px solid rgba(43,34,53,.15); opacity: .4; }
  #pk-ui .pk-row.on { opacity: 1; border-color: #21a493; box-shadow: 0 3px 0 rgba(33,164,147,.25); }
  #pk-ui .pk-row canvas { width: 40px; height: 40px; flex: none; } #pk-ui .pk-row b { display: block; font-size: 14px; } #pk-ui .pk-row span { font-size: 12px; opacity: .7; }
  #pk-ui .pk-rec { display: flex; align-items: center; gap: 14px; }
  #pk-ui .pk-rec canvas.pic { width: 64px; height: 64px; flex: none; }
  #pk-ui .pk-dot { display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: #c2412f; margin-right: 6px; vertical-align: -1px; }
  #pk-ui .pk-dot.off { opacity: .2; }
  #pk-ui canvas.pk-wave { width: 230px; height: 46px; background: #fff; border-radius: 10px; border: 2px dashed rgba(43,34,53,.3); flex: none; }
  #pk-ui .pk-big { font: 900 30px Bahnschrift, "Segoe UI", sans-serif; color: #c2412f; }
  #pk-ui .pk-lyric { font: 700 22px/1.4 Bahnschrift, "Segoe UI", sans-serif; min-height: 64px; margin-top: 8px; }
  #pk-ui .pk-lyric div { opacity: .35; } #pk-ui .pk-lyric div.on { opacity: 1; }
  #pk-ui .pk-lyric b { color: #c2412f; } #pk-ui .pk-lyric b.k { color: #8a849a; font-weight: 700; }
  #pk-ui .pk-res { display: grid; grid-template-columns: 1fr auto auto auto; gap: 3px 12px; align-items: center; margin-top: 8px; font-size: 14px; }
  #pk-ui .pk-res .pk-w { font: 800 16px Bahnschrift, "Segoe UI", sans-serif; color: #c2412f; } #pk-ui .pk-res .t { opacity: .7; font-size: 12px; }
  #pk-ui .pk-res .pk-grade { width: 26px; height: 26px; font-size: 15px; border-width: 2px; border-radius: 8px; }
  #pk-ui .pk-sum { display: flex; align-items: center; gap: 14px; margin-top: 6px; }
  #pk-ui .pk-sum .pk-grade { width: 64px; height: 64px; font-size: 40px; border-radius: 16px; }
  `;
  let ui = null, MODE = null;                       // MODE: 'bat' | 'result' | 'track' | 'rec' | 'desk'
  const UIR = {};                                   // refs into the overlay
  function root() {
    if (ui) return ui;
    const st = document.createElement('style'); st.id = 'pk-css'; st.textContent = CSS; document.head.appendChild(st);
    ui = document.createElement('div'); ui.id = 'pk-ui'; ui.className = 'hidden'; document.body.appendChild(ui);
    addEventListener('keydown', onKey, true);
    return ui;
  }
  function setMode(m) {
    MODE = m;
    if (!m) { if (ui) { ui.classList.add('hidden'); ui.innerHTML = ''; } for (const k of Object.keys(UIR)) delete UIR[k]; Input.typing = false; if (G) G.sim.lock = 0; return; }
    root().classList.remove('hidden');
    Input.typing = true;                            // the game ignores its keys while an overlay is up
    if (G) G.sim.lock = 1;
  }
  const stopEv = e => { e.preventDefault(); e.stopPropagation(); };
  function onKey(e) {
    if (!MODE) return;
    if (MODE === 'bat') {
      if (e.code === 'Escape') { stopEv(e); batQuit(); }
      else if (e.code === 'Tab') { stopEv(e); batHint(); }
      else if (e.code === 'F2') { stopEv(e); BAT.showEn = !BAT.showEn; }
      else if (UIR.input && document.activeElement !== UIR.input && e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) UIR.input.focus();
    } else if (MODE === 'result') {
      if (['Enter', 'NumpadEnter', 'KeyE', 'Space'].includes(e.code)) { stopEv(e); if (RES.ready) RES.done(false); }
      else if (e.code === 'KeyR') { stopEv(e); if (RES.ready) RES.done(true); }
      else if (e.code === 'Escape') { stopEv(e); RES.done(false); }
    } else if (MODE === 'track') {
      if (e.code === 'Escape') { stopEv(e); TRK.skip = true; }
    }
  }
  const iconCanvas = (key, size = 64, cls = '') => `<canvas width="${size}" height="${size}" class="${cls}" data-pk-icon="${key}"></canvas>`;
  const drawIcons = el => el.querySelectorAll('canvas[data-pk-icon]').forEach(cv => ICONS.draw(cv, cv.dataset.pkIcon));

  // ---------------------------------------------------------------- the recorder (REC: a sound being caught)
  const REC = { on: false };
  const WAVES = { quack: [0.05, 0.5, 0.2, 0.9, 0.3, 0.9], bigbell: [0.05, 1, 0.9, 0.8, 0.65, 0.5, 0.4, 0.3, 0.22], piui: [0.05, 0.9, 1, 1, 0.6, 1, 0.9, 0.3],
    croak: [0.05, 0.8, 0.2, 0.9, 0.3, 0.7], gears: [0.05, 0.7, 0.3, 0.7, 0.3, 0.7, 0.3, 0.7], sheepbell: [0.05, 0.9, 0.4, 0.7, 0.3, 0.5, 0.2] };
  function recCard(key) {
    const sp = SAMPLES[key];
    return new Promise(resolve => {
      Object.assign(REC, { on: true, key, t: 0, played: false, saved: false, resolve, bars: [] });
      setMode('rec');
      ui.innerHTML = `<div class="pk-rec">${iconCanvas(sp.icon, 96, 'pic')}<div style="flex:1"><div class="pk-tag"><span class="pk-dot"></span>REC · Kauã’s recorder</div>`
        + `<div class="pk-big">${esc(cap(sp.pt))}</div><div style="font-size:14px;opacity:.7">${esc(sp.en)}</div></div><canvas class="pk-wave" width="230" height="46"></canvas></div>`;
      drawIcons(ui); UIR.dot = ui.querySelector('.pk-dot'); UIR.wave = ui.querySelector('canvas.pk-wave'); UIR.tag = ui.querySelector('.pk-tag');
      Sound.play('rec');
    });
  }
  function recTick(dt) {
    if (!REC.on) return;
    REC.t += dt;
    if (!REC.played && REC.t > 0.35) { REC.played = true; Sound.play(SAMPLES[REC.key].fx); }
    if (UIR.dot) UIR.dot.classList.toggle('off', !REC.saved && REC.t % 0.8 > 0.45);
    // the level meter: the sound's shape, wobbling
    const cv = UIR.wave;
    if (cv) {
      const c = cv.getContext('2d'), env = WAVES[SAMPLES[REC.key].fx] || [0.5], k = clamp((REC.t - 0.35) / 1.4, 0, 1);
      if (REC.t > 0.35 && REC.t < 1.9) REC.bars.push(env[Math.min(env.length - 1, Math.floor(k * env.length))] * (0.55 + Math.random() * 0.45));
      while (REC.bars.length > 46) REC.bars.shift();
      c.clearRect(0, 0, cv.width, cv.height); c.fillStyle = REC.saved ? '#21a493' : '#c2412f';
      REC.bars.forEach((v, i) => { const h = Math.max(2, v * 38); c.fillRect(4 + i * 4.9, 23 - h / 2, 3, h); });
    }
    if (!REC.saved && REC.t > 2.0) { REC.saved = true; Sound.play('learned'); if (UIR.tag) UIR.tag.innerHTML = '✓ Gravado! · recorded'; }
    if (REC.t > 2.7) { REC.on = false; setMode(null); REC.resolve(); }
  }

  // ---------------------------------------------------------------- the mixing desk: the beat comes together, one sound per bar
  const DESK = { on: false };
  function playDesk(layers) {
    return new Promise(resolve => {
      Object.assign(DESK, { on: true, resolve, layers, shown: -1, C: clockNew('phonk', 130, { lead: 0.3, from: 16 }) });
      Sound.phonkMix = {};
      setMode('desk');
      const rows = layers.map((k, i) => k === 'base'
        ? `<div class="pk-row" data-i="${i}">${iconCanvas('music', 64)}<div><b>808 + bateria + cowbell</b><span>Kauã’s beat: the 808, the drums, the cowbell riff</span></div></div>`
        : `<div class="pk-row" data-i="${i}">${iconCanvas(SAMPLES[k].icon, 64)}<div><b>${esc(cap(SAMPLES[k].pt))}</b><span>${esc(SAMPLES[k].en)}</span></div></div>`).join('');
      ui.innerHTML = `<div class="pk-top"><span class="pk-tag">DJ Lagoa · montando o beat</span><b class="pk-title">Building the beat</b><span class="pk-sp"></span><span class="pk-round">your sounds, one by one</span></div><div class="pk-rows">${rows}</div>`;
      drawIcons(ui); UIR.rows = [...ui.querySelectorAll('.pk-row')];
    });
  }
  function deskTick(dt) {
    if (!DESK.on) return;
    if (!DESK.C.audio) DESK.C.clock += dt;
    const bars = clockNow(DESK.C) / (DESK.C.beat * 4), n = DESK.layers.length;
    const k = bars < 0 ? -1 : bars < 2 ? 0 : Math.min(n - 1, Math.floor(bars - 1));      // the base for two bars, then a sound per bar
    while (DESK.shown < k) {
      DESK.shown++;
      const key = DESK.layers[DESK.shown];
      if (key !== 'base') { const m = Sound.phonkMix; m[SAMPLES[key].layer] = 1; Sound.phonkMix = m; }
      if (UIR.rows && UIR.rows[DESK.shown]) UIR.rows[DESK.shown].classList.add('on');
      if (DESK.shown > 0) { G.sim.mimo.happy = 0.4; KA.cheer = 0.6; }
    }
    if (bars >= n + 2.5) { DESK.on = false; clockEnd(DESK.C); setMode(null); DESK.resolve(); }
  }

  // ---------------------------------------------------------------- the batalha
  const BAT = { on: false, showEn: false };
  const RES = { ready: false, done: () => {} };
  function playLevel(level, easy) {
    return new Promise(resolve => {
      const L = LEVELS[level];
      // (showEn: the verse's English starts hidden on every level, EN or F2 shows it: DESIGN.md 17.3; L.en still says how much it shows)
      Object.assign(BAT, { on: true, level, L, easy: !!easy, i: -1, R: null, res: [], phase: 'intro', first: 8, resolve, hints: 0, showEn: false, b: -9, drawn: '' });
      BAT.C = clockNew('phonk', L.bpm, { lead: 0.6 });
      Sound.phonkMix = mixNow();
      batUI(); setMode('bat');
      setTimeout(() => { if (UIR.input) UIR.input.focus(); }, 30);
    });
  }
  function batUI() {
    root();
    const L = BAT.L;
    ui.innerHTML = `<div class="pk-top"><span class="pk-tag">Batalha de rima · DJ Lagoa</span><b class="pk-title">${esc(L.name)}</b><span class="pk-round"></span><span class="pk-sp"></span>`
      + `<button class="pk-btn" data-act="en" type="button" title="English (F2)">EN</button><button class="pk-btn" data-act="quit" type="button">Stop (Esc)</button></div>`
      + `<div class="pk-beats">${'<i></i>'.repeat(16)}</div>`
      + `<div class="pk-who"><span>Kauã 🎤</span><span class="pk-mode">${BAT.easy ? 'easy: the beat waits for you' : 'Enter on the ★ beat'}</span></div>`
      + `<div class="pk-line pk-l1"></div><div class="pk-line pk-l2"></div><div class="pk-en"></div><div class="pk-help"></div>`
      + `<form class="pk-form" autocomplete="off"><input class="pk-in" spellcheck="false" placeholder="your word…"><button class="pk-go" type="submit" title="Enter">Enter</button><span class="pk-turn"></span></form>`
      + `<div class="pk-fb"></div><div class="pk-keys"><kbd>Enter</kbd> on the ★ beat · <kbd>Tab</kbd> a hint (costs half a point) · <kbd>F2</kbd> English · <kbd>Esc</kbd> stop</div>`;
    Object.assign(UIR, { beats: [...ui.querySelectorAll('.pk-beats i')], l1: ui.querySelector('.pk-l1'), l2: ui.querySelector('.pk-l2'), en: ui.querySelector('.pk-en'), help: ui.querySelector('.pk-help'),
      input: ui.querySelector('.pk-in'), turn: ui.querySelector('.pk-turn'), fb: ui.querySelector('.pk-fb'), round: ui.querySelector('.pk-round'), enBtn: ui.querySelector('[data-act="en"]') });
    ui.querySelector('form').addEventListener('submit', e => { e.preventDefault(); if (BAT.on) submit(UIR.input.value); });
    ui.querySelector('[data-act="quit"]').onclick = () => batQuit();
    UIR.enBtn.onclick = () => { BAT.showEn = !BAT.showEn; UIR.input.focus(); };
    UIR.input.addEventListener('keydown', e => { if (e.code === 'Enter' || e.code === 'NumpadEnter') return; e.stopPropagation(); });
    UIR.input.addEventListener('input', () => { BAT.drawn = ''; });
    lineDOM(0);
  }
  // the verse's words as spans (lit up karaoke-style as he raps them), the gap at the end of line 2
  function lineDOM(i) {
    const def = BAT.L.rounds[i];
    const a = fill(def.a).split(' '), b = fill(def.b).replace(/\s*_+\s*$/, '').split(' ');
    UIR.l1.innerHTML = a.map(w => `<span>${esc(w)}</span>`).join(' ');
    UIR.l2.innerHTML = b.map(w => `<span>${esc(w)}</span>`).join(' ') + ' <span class="pk-gap">&nbsp;</span>';
    UIR.w1 = [...UIR.l1.querySelectorAll('span')]; UIR.w2 = [...UIR.l2.querySelectorAll('span:not(.pk-gap)')]; UIR.gap = UIR.l2.querySelector('.pk-gap');
    const L = BAT.L;
    let help = '';
    if (L.help === 'opts' || (BAT.easy && def.opts)) help = 'Pick one and type it: ' + (def.opts || def.best.slice(0, 3)).map(o => `<span class="pk-chip">${esc(o)}</span>`).join(' ');
    else if (L.help === 'suffix' || BAT.easy) help = `Rima com «${esc(def.cue === 'piui' ? 'piuí' : def.cue)}»: <span class="pk-chip">-${esc(def.suf[0])}</span>`;
    else help = '<span style="opacity:.6">No hints this time… (Tab if you need one)</span>';
    UIR.help.innerHTML = help; UIR.helpBase = help;
    UIR.round.textContent = `${i + 1} / ${BAT.L.rounds.length}`;
  }
  function startRound(i, rs) {
    const def = BAT.L.rounds[i];
    BAT.i = i; BAT.phase = 'round'; BAT.hints = 0;
    BAT.R = { i, def, rs, done: false, dropped: false, land: rs + 12, next: rs + 16 };
    lineDOM(i);
    UIR.input.value = ''; UIR.input.disabled = false; UIR.fb.innerHTML = ''; BAT.drawn = '';
    if (MODE === 'bat') UIR.input.focus();
  }
  function batHint() {
    const R = BAT.R; if (!BAT.on || !R || R.done) return;
    BAT.hints = Math.min(3, BAT.hints + 1);
    // one hint: the first letter · two: and the last · three: every other letter
    const w = R.def.best[0], shown = [...w].map((ch, i) => (i === 0 || (BAT.hints >= 2 && i === w.length - 1) || (BAT.hints >= 3 && i % 2 === 0) ? ch : '_')).join(' ');
    UIR.help.innerHTML = UIR.helpBase + ` <span class="pk-chip" title="a hint">${esc(shown)}</span>`;
    Sound.play('click'); UIR.input.focus();
  }
  // You pressed Enter (or the round ran out): judge the word, and the timing against the ★ beat
  function submit(text, at, auto) {
    const R = BAT.R; if (!BAT.on || BAT.phase !== 'round' || !R || R.done) return false;
    text = String(text || '').trim();
    if (!text && !auto) return false;
    const C0 = BAT.C, now = at !== undefined ? at : clockNow(C0), b = now / C0.beat, T = (R.rs + 12) * C0.beat;
    const W = judgeWord(R.def, text, BAT.hints);
    let tm;
    if (!text) tm = { kind: 'miss', score: 0, label: 'TEMPO!', en: 'time’s up', d: 0 };
    else if (BAT.easy) { tm = { kind: 'easy', score: 2, label: '', en: '', d: 0 }; R.land = b <= R.rs + 12.25 ? R.rs + 12 : Math.ceil((b + 0.25) / 4) * 4; R.next = R.land + 4; }
    else tm = timingOf(now - T);
    Object.assign(R, { done: true, text, W, tm, total: W.score * 2 + tm.score, pressed: b, auto: !!auto });
    R.grade = gradeOf(R.total);
    BAT.res.push(R);
    UIR.input.disabled = true;
    const ok = ['best', 'close', 'rhyme', 'fits', 'repeat'].includes(W.kind);
    UIR.gap.textContent = W.show || '…'; UIR.gap.className = 'pk-gap ' + (ok ? 'done' : 'bad');
    const [wl, we] = WORD_FB[W.kind];
    UIR.fb.innerHTML = `<span class="pk-grade pk-g-${R.grade}">${R.grade}</span><div><b>${esc(wl)}</b><small>${esc(we)}${W.kind === 'close' ? ` · «${esc(W.show)}»` : ''}</small></div>`
      + (tm.label ? `<div><b>${esc(tm.label)}</b><small>${esc(tm.en)}${tm.kind !== 'miss' && !BAT.easy ? ` · ${tm.d >= 0 ? '+' : '−'}${Math.round(Math.abs(tm.d) * 1000)} ms` : ''}</small></div>` : '');
    if (b >= R.land) drop(R);
    return true;
  }
  // the word lands on the beat: a sound, Mimo and Kauã react, and a pt-BR voice says it (if there is one)
  function drop(R) {
    R.dropped = true;
    const g = R.grade, M = G.sim.mimo;
    Sound.play(g === 'S' ? 'perfect' : g === 'A' ? 'chop' : g === 'B' ? 'review' : g === 'C' ? 'click' : 'scratch');
    if (['best', 'close', 'rhyme'].includes(R.W.kind)) Sound.say(R.W.show, 'pt');
    if (g === 'S' || g === 'A') { M.happy = 0.6; G.w3d.fx.sparkle(M.x, M.ry + 0.8, M.z, g === 'S' ? 14 : 7); KA.cheer = 1; }
    else if (g === 'D') { M.sad = 1.2; KA.facepalm = 1; }
  }
  function batTick(dt) {
    if (!BAT.on) return;
    if (!BAT.C.audio) BAT.C.clock += dt;
    const b = clockNow(BAT.C) / BAT.C.beat; BAT.b = b;
    if (BAT.phase === 'intro') { if (b >= BAT.first) startRound(0, BAT.first); }
    if (BAT.phase === 'round') {
      const R = BAT.R, rel = b - R.rs;
      if (!R.done && !BAT.easy && rel >= 14) submit(UIR.input.value, undefined, true);      // too late: whatever's typed, or nothing
      if (R.done && !R.dropped && b >= R.land) drop(R);
      if (R.done && b >= R.next) { if (BAT.i + 1 < BAT.L.rounds.length) startRound(BAT.i + 1, R.next); else { BAT.phase = 'outro'; BAT.outroAt = R.next; } }
    }
    if (BAT.phase === 'outro' && b >= BAT.outroAt + 2) { batFinish(); return; }
    batDraw(b);
  }
  function batDraw(b) {
    const R = BAT.R, intro = BAT.phase === 'intro', outro = BAT.phase === 'outro';
    const rs = intro ? BAT.first - 16 : outro ? BAT.outroAt - 16 : R.rs, rel = b - rs, cur = Math.floor(rel);
    const typed = UIR.input ? UIR.input.value.trim() : '';
    const key = [Math.floor(b * 4), BAT.phase, BAT.i, R && R.done, typed, BAT.showEn].join('|');
    if (key === BAT.drawn) return; BAT.drawn = key;
    UIR.beats.forEach((el, k) => { el.className = (k < cur ? 'past' : k === cur ? 'now' : '') + (k === 12 && !intro && !outro ? ' tgt' : ''); });
    if (intro) {
      // the intro and a get-ready bar: the first verse is already up to read
      const left = Math.ceil(BAT.first - b);
      UIR.turn.textContent = b < 0 ? '' : left <= 4 ? `PREPARA… ${left}` : 'PREPARA…'; UIR.turn.className = 'pk-turn';
    } else if (!outro) {
      const n1 = UIR.w1.length, n2 = UIR.w2.length;
      UIR.w1.forEach((w, k) => w.classList.toggle('on', rel >= k * 3.5 / n1));
      UIR.w2.forEach((w, k) => w.classList.toggle('on', rel >= 4 + k * 3.5 / n2));
      if (!R.done) { UIR.gap.textContent = typed || ' '; UIR.gap.className = 'pk-gap' + (typed ? ' typing' : ''); }
      let turn = '', now = false;
      if (R.done) turn = R.dropped ? '' : '…';
      else if (rel < 8) turn = 'Kauã 🎤';
      else if (rel < 12) turn = `SUA VEZ! ${12 - cur}`;
      else if (rel < 13) { turn = BAT.easy ? 'SUA VEZ! ⏎' : 'AGORA! ⏎'; now = true; }
      else turn = BAT.easy ? 'o beat espera ✓' : 'RÁPIDO!';
      UIR.turn.textContent = turn; UIR.turn.className = 'pk-turn' + (now ? ' now' : '');
    } else { UIR.turn.textContent = 'FIM!'; UIR.turn.className = 'pk-turn'; }
    // the English, only on request (EN or F2, every level): the verse with the answer's gloss (Treino), with a gap (Valendo, Final)
    const def = (R || {}).def || BAT.L.rounds[0], mode = BAT.L.en;
    if (BAT.showEn && !outro) {
      const gl = mode === 'full' || (R && R.done) ? ` (${def.gloss})` : '';
      UIR.en.textContent = fill(def.en[0]) + ' ' + fill(def.en[1]).replace('___', '___' + gl);
    } else UIR.en.textContent = '';
    UIR.enBtn.classList.toggle('on', !!BAT.showEn);
  }
  function batQuit() {
    if (!BAT.on) return;
    BAT.on = false; clockEnd(BAT.C); setMode(null);
    const r = BAT.resolve; BAT.resolve = null; if (r) r({ quit: true });
  }
  function batFinish() {
    const res = BAT.res, avg = res.reduce((a, r) => a + r.total, 0) / Math.max(1, res.length), grade = gradeOf(avg), st = S(), L = BAT.level;
    BAT.on = false; BAT.phase = 'done'; clockEnd(BAT.C);
    const better = !st.best[L] || GRADES.indexOf(grade) < GRADES.indexOf(st.best[L]);
    if (better) st.best[L] = grade;
    if (L === 2) st.words2 = res.map(r => (['best', 'close', 'rhyme', 'fits', 'repeat'].includes(r.W.kind) ? r.W.show : null));
    const want = Math.round(COINS[grade] * LV_COINS[L]), got = Math.max(0, want - (st.paid[L] || 0));
    if (got) { G.state.coins = (G.state.coins || 0) + got; st.paid[L] = want; }
    G.save();
    showResults({ level: L, grade, avg, res, got, better });
  }
  function showResults(o) {
    setMode('result');
    const rows = o.res.map(r => `<span>${esc(fill(r.def.b).replace(/\s*_+\s*$/, ''))} <span class="pk-w">${esc(r.W.show || '—')}</span></span><span class="t">${esc(WORD_FB[r.W.kind][0])}</span><span class="t">${esc(r.tm.label || (BAT.easy ? 'easy' : ''))}</span><span class="pk-grade pk-g-${r.grade}">${r.grade}</span>`).join('');
    const msg = { S: 'Brabo demais! (Too good!)', A: 'Mandou muito bem! (You killed it!)', B: 'Mandou bem! (Nice!)', C: 'Tá chegando lá! (Getting there!)', D: 'Bora de novo? (Again?)' }[o.grade];
    ui.innerHTML = `<div class="pk-top"><span class="pk-tag">Batalha de rima · ${esc(LEVELS[o.level].name)}</span><span class="pk-sp"></span>${o.got ? `<span class="pk-round">🪙 +${o.got}</span>` : ''}</div>`
      + `<div class="pk-sum"><span class="pk-grade pk-g-${o.grade}">${o.grade}</span><div><div class="pk-big" style="font-size:26px">${esc(msg)}</div><div style="font-size:13px;opacity:.7">${o.better ? 'Your best on this level so far!' : `Your best: ${esc(S().best[o.level] || o.grade)}`}${BAT.easy ? ' · easy mode' : ''}</div></div></div>`
      + `<div class="pk-res">${rows}</div><div class="pk-keys"><kbd>Enter</kbd> continue · <kbd>R</kbd> again</div>`;
    RES.ready = false; RES.t = 0.7;
    RES.done = again => { if (MODE !== 'result') return; setMode(null); const r = BAT.resolve; BAT.resolve = null; if (r) r({ grade: o.grade, avg: o.avg, again: !!again, res: o.res }); };
    Sound.play(o.grade === 'S' || o.grade === 'A' ? 'fanfare' : 'review');
  }
  // one level, as many times as you like (R on the results)
  async function runLevel(level, easy) {
    for (;;) {
      stage(true);
      const r = await playLevel(level, easy);
      if (r.quit || !r.again) { stage(false); return r; }
    }
  }

  // ---------------------------------------------------------------- the track: «Lagoa sem Silêncio», with your words in it
  const TRK = { on: false };
  function playTrack() {
    return new Promise(resolve => {
      const st = S(), rounds = LEVELS[2].rounds;
      Object.assign(TRK, { on: true, resolve, rounds, words: st.words2 || [], i: -2, said: -1, skip: false, voice: canSay(), C: clockNew('phonk', 130, { lead: 0.6 }) });
      Sound.phonkMix = mixNow();
      setMode('track');
      ui.innerHTML = `<div class="pk-top"><span class="pk-tag">DJ Lagoa feat. você &amp; ${esc(mimoName())}</span><b class="pk-title">«Lagoa sem Silêncio»</b><span class="pk-sp"></span><button class="pk-btn" type="button" data-act="skip">Skip (Esc)</button></div>`
        + `<div class="pk-lyric"></div><div class="pk-keys">${TRK.voice ? 'Your words, in a Brazilian voice' : 'Your words in red (no Portuguese voice is installed on this PC)'}</div>`;
      UIR.lyric = ui.querySelector('.pk-lyric'); ui.querySelector('[data-act="skip"]').onclick = () => { TRK.skip = true; };
    });
  }
  function trackTick(dt) {
    if (!TRK.on) return;
    if (!TRK.C.audio) TRK.C.clock += dt;
    const b = clockNow(TRK.C) / TRK.C.beat, n = TRK.rounds.length, i = b < 4 ? -1 : Math.floor((b - 4) / 8), rel = b - 4 - i * 8;
    if (i !== TRK.i) {
      TRK.i = i;
      if (i < 0) UIR.lyric.innerHTML = `<div class="on" style="text-align:center">DJ Lagoa · feat. você &amp; ${esc(mimoName())}</div>`;
      else if (i < n) {
        const def = TRK.rounds[i], w = TRK.words[i], word = w ? `<b>${esc(w)}</b>` : `<b class="k">${esc(def.best[0])}</b>`;
        UIR.lyric.innerHTML = `<div class="on">${esc(fill(def.a))}</div><div>${esc(fill(def.b).replace(/\s*_+\s*$/, ''))} ${word}</div>`;
      } else UIR.lyric.innerHTML = `<div class="on" style="text-align:center">Valeu, galera! 🎧</div>`;
    }
    if (i >= 0 && i < n) {
      const rows = UIR.lyric.querySelectorAll('div'); if (rows[1]) rows[1].classList.toggle('on', rel >= 4);
      if (rel >= 7 && TRK.said < i) { TRK.said = i; const w = TRK.words[i]; if (w) { if (TRK.voice) Sound.say(w, 'pt'); Sound.play('chop'); } G.sim.mimo.happy = 0.4; KA.cheer = 0.7; }
    }
    if (TRK.skip || b >= 4 + n * 8 + 4) { TRK.on = false; clockEnd(TRK.C); setMode(null); TRK.resolve(); }
  }

  // ================================================================ build: Kauã on the pond's bank, and the ♪ markers
  let model = null, group = null, markers = null, mimoPhones = null;
  const KA = { stand: 0, phones: 0, yaw: FACE, notice: 0, cheer: 0, facepalm: 0, rap: 0, lastBeat: -1, noteI: 0, waveI: 0, blink: 2.5, look: 0 };
  function build(scene, env = {}) {
    const gy = env.terrainAt || (() => 0.25);
    group = new THREE.Group(); group.name = 'phonk'; scene.add(group);
    model = buildKaua(group);
    KAUA.y = gy(SEAT.x, SEAT.z);
    model.root.position.set(SEAT.x, KAUA.y, SEAT.z); model.root.rotation.y = FACE;
    markers = buildMarkers(scene);
    markers.list.forEach(m => { const a = SAMPLES[m.k].at; m.y = gy(a.x, a.z); });
    group.visible = false;
    if (EXT && EXT.build) { try { EXT.build(scene, env); } catch (e) { console.error('[phonk ext] build', e); } }
    return { colliders: [], group, people, update, landmarks: { seat: { ...SEAT }, dance: { ...DANCE_AT }, samples: Object.fromEntries(ORDER.map(k => [k, { ...SAMPLES[k].at }])) } };
  }
  function update(dt, t, you) {
    if (!G || !model) return;
    // the overlays run on (a recording out at the station, the batalha…)
    recTick(dt); deskTick(dt); batTick(dt); trackTick(dt);
    if (MODE === 'result' && !RES.ready && (RES.t -= dt) <= 0) RES.ready = true;
    const on = isPT() && !indoors(), Y = you;
    if (on && !people.length) people.push(KAUA); else if (!on && people.length) people.length = 0;
    const d = Y ? Math.hypot(Y.x - KAUA.x, Y.z - KAUA.z) : 1e9;
    group.visible = on && d < 160;
    updateLeak(Y, on);
    updateMarkers(t, Y, on);
    if (mimoPhones) mimoPhones.visible = on && !!G.state.flags.mimoPhones && S().phonesOn !== false && !G.sim.mimo.hidden;
    if (EXT && EXT.update) { try { EXT.update(dt, t, Y); } catch (e) { console.error('[phonk ext] update', e); EXT.update = null; } }
    if (!group.visible) { if (DANCE.on) danceOff(); return; }
    const beat = beatNow(t), playing = AUD.on || BAT.on || TRK.on || DESK.on || !!ext('musicOn');
    animKaua(dt, t, beat, Y, playing);
    updateDance(dt, beat, Y, playing);
    triggers(Y, d);
  }
  function updateMarkers(t, Y, on) {
    const st = on && G.state.flags.hatched ? S() : null;
    markers.list.forEach((m, i) => {
      const a = SAMPLES[m.k].at, vis = !!st && canRecord(st, m.k) && !st.samples[m.k] && available(m.k) && !!Y && Math.hypot(Y.x - a.x, Y.z - a.z) < 75;
      m.sp.visible = vis;
      if (vis) { m.sp.position.set(a.x, m.y + 2.3 + Math.sin(t * 2.2 + i) * 0.18, a.z); m.sp.material.rotation = Math.sin(t * 1.7 + i) * 0.15; }
    });
  }
  function animKaua(dt, t, beatF, Y, playing) {
    const K = model, talking = !!KAUA.talking, show = BAT.on || TRK.on || DESK.on || MODE === 'result' || !!ext('show');
    const near = !!Y && Math.hypot(Y.x - KAUA.x, Y.z - KAUA.z) < 4.2;
    KA.notice = Math.max(0, KA.notice - dt); KA.cheer = Math.max(0, KA.cheer - dt); KA.facepalm = Math.max(0, KA.facepalm - dt);
    KA.stand = damp(KA.stand, show ? 1 : 0, 4, dt);
    KA.phones = damp(KA.phones, talking || show || KA.notice > 0 ? 1 : 0, 6, dt);
    const st = KA.stand, sit = 1 - st;
    K.body.position.y = lerp(0.42, 1.075, st);            // (standing: up on his crate, like a stage)
    const ph = beatF - Math.floor(beatF), pulse = Math.exp(-ph * 7), half = Math.floor(beatF) % 2 === 0;
    K.legs.forEach((L, i) => { L.hip.rotation.x = -Math.PI / 2 * sit; L.knee.rotation.x = Math.PI / 2 * sit - (i && playing && !talking ? 0.2 * pulse * sit : 0); });
    // turn on the crate: the pond, or you
    const look = (talking || near || show || KA.notice > 0) && Y ? Math.atan2(Y.x - KAUA.x, Y.z - KAUA.z) : FACE;
    KA.yaw = dampAngle(KA.yaw, look, 3.5, dt);
    K.body.rotation.y = clamp(angDiff(FACE, KA.yaw), -1.7, 1.7);
    // groove: the head nods on the beat (harder on 1 and 3), the shoulders bounce; standing, he bounces on his knees
    const groove = playing && !talking ? 1 : 0.15;
    K.head.rotation.x = 0.05 + groove * 0.17 * pulse * (half ? 1 : 0.6) + (talking ? Math.sin(t * 4.5) * 0.04 : 0) - KA.facepalm * 0.2;
    K.head.rotation.z = talking ? Math.sin(t * 1.7) * 0.06 : 0;
    K.torso.rotation.x = groove * 0.05 * pulse + (st > 0.5 ? 0.04 : 0);
    if (st > 0.5) K.body.position.y -= 0.035 * pulse * groove;
    // eyes: shut tight, vibing; open when he talks, notices you, or is on stage
    const open = talking || show || KA.notice > 0 || (near && !playing);
    if ((KA.blink -= dt) < 0) KA.blink = 2.4 + Math.random() * 2.5;
    K.eyesOpen.forEach(e => { e.visible = open; e.scale.y = KA.blink < 0.12 ? 0.15 : 1; });
    K.eyesShut.forEach(e => { e.visible = !open; });
    const rapping = BAT.on && BAT.phase === 'round' && BAT.R && (BAT.b - BAT.R.rs) < 8;
    K.mouth.scale.y = talking || rapping || (TRK.on && TRK.i >= 0) ? 0.012 + Math.abs(Math.sin(t * 15)) * 0.035 : 0.012;
    // the headphones: on his head, or slid down round his neck
    // (round his neck: tipped back so the band lies behind his neck and the cups rest by his collar)
    const pk = KA.phones; K.phones.position.set(0, -0.081 * pk, 0.271 * pk); K.phones.rotation.x = -1.3 * pk; K.phones.scale.setScalar(1 - 0.15 * pk);
    // arms: the phone at his chest (sitting); a rapper's hand riding the beat (standing); pointing at you for your turn; a cheer
    const yourTurn = BAT.on && BAT.phase === 'round' && BAT.R && !BAT.R.done && (BAT.b - BAT.R.rs) >= 8;
    K.arms.forEach(({ sh, el, s }) => {
      let x, out, e;          // x: the shoulder swings forward (negative), out: away from the body (negative: across it), e: the elbow bends forward
      if (st > 0.5) {
        if (KA.cheer > 0 && s > 0) { x = -2.7; out = 0.3; e = -0.3; }
        else if (KA.facepalm > 0 && s > 0) { x = -2.1; out = -0.45; e = -1.7; }
        else if (s > 0 && yourTurn) { x = -1.45; out = 0; e = 0; }
        else if (s > 0) { x = -1.15 + 0.25 * pulse; out = 0.15; e = -0.75; }
        else { x = 0.05; out = 0.12; e = -0.15; }
      } else if (talking) { x = -0.55 + (s > 0 ? Math.sin(t * 3) * 0.15 : 0); out = 0.05; e = -0.75; }
      else { x = -0.35; out = -0.7; e = -1.25; }
      sh.rotation.x = damp(sh.rotation.x, x, 10, dt); sh.rotation.z = damp(sh.rotation.z, s * out, 10, dt); el.rotation.x = damp(el.rotation.x, e, 10, dt);
    });
    K.phone.visible = st < 0.5 && !talking;
    K.screen.material.color.setHSL(0.47 + 0.08 * Math.sin(t * 0.7), 0.85, 0.62 + 0.18 * pulse * groove);
    KAUA.top = lerp(1.72, 2.42, st);
    // the beat, coming off the cups: a ring on every beat, a note every other one
    const bi = Math.floor(beatF);
    if (bi !== KA.lastBeat) {
      KA.lastBeat = bi;
      if (playing && pk < 0.6) { const w = K.waves[KA.waveI++ % K.waves.length]; w.t = 0; const w2 = K.waves[KA.waveI++ % K.waves.length]; w2.t = 0; }
      if (playing && bi % 2 === 0) {
        const n = K.notes[KA.noteI++ % K.notes.length]; K.head.getWorldPosition(n.sp.position); n.sp.position.y += 0.75; n.sp.position.x += (Math.random() - 0.5) * 0.5;
        n.t = 0; n.vx = (Math.random() - 0.5) * 0.5; n.vz = (Math.random() - 0.5) * 0.5;
      }
    }
    K.waves.forEach(w => { w.t += dt / 0.55; const k = Math.min(1, w.t); w.m.scale.setScalar(1 + k * 2.3); w.m.position.x = w.s * (0.06 + k * 0.14); w.m.material.opacity = w.t < 1 ? 0.55 * (1 - k) : 0; });
    K.notes.forEach(n => { n.t += dt; const k = n.t / 2.2; if (k >= 1) { n.sp.material.opacity = 0; return; } n.sp.position.y += dt * 0.55; n.sp.position.x += n.vx * dt; n.sp.position.z += n.vz * dt; n.sp.material.opacity = 0.9 * Math.min(1, n.t * 4) * (1 - k); });
  }
  // Mimo dances to the beat when you stand still near him (and always on stage): a hop every other beat, a sway
  const DANCE = { on: false, last: -1 };
  function danceOff() { DANCE.on = false; const M = G.sim.mimo; if (M.station && Math.abs(M.station.x - DANCE_AT.x) < 1e-6 && Math.abs(M.station.z - DANCE_AT.z) < 1e-6) G.sim.mimoGo(null, null); }
  function updateDance(dt, beatF, Y, playing) {
    const M = G.sim.mimo, stage0 = BAT.on || TRK.on || DESK.on || MODE === 'result' || !!ext('show');
    const can = !M.hidden && !!Y && playing && (stage0 || (Math.hypot(Y.x - KAUA.x, Y.z - KAUA.z) < 6.5 && Y.still > 0.8 && !STORY.busy && !STORY.line && !G.state.teaching));
    if (can && !DANCE.on) { DANCE.on = true; G.sim.mimoGo(DANCE_AT, { x: KAUA.x, z: KAUA.z }); }
    else if (!can && DANCE.on) danceOff();
    if (!DANCE.on) return;
    const bi = Math.floor(beatF);
    if (bi !== DANCE.last && bi % 2 === 0) { DANCE.last = bi; if (!M.hop && Math.hypot(M.x - DANCE_AT.x, M.z - DANCE_AT.z) < 0.7) M.hop = { x0: M.x, z0: M.z, x1: M.x, z1: M.z, y0: M.y, y1: M.y, t: 0, dur: 0.32, h: 0.22 }; }
    const b = G.cast && G.cast.mimo; if (b) b.body.rotation.z = Math.sin(beatF * Math.PI) * 0.16;
  }
  // first time near: you hear it; then Mimo wants to know what «música» is
  function triggers(Y, d) {
    if (!Y || !G.state.flags.hatched || MODE) return;
    const st = S(), free = !STORY.busy && !STORY.line && !G.state.teaching && !G.journalOpen;
    if (!free) return;
    if (!st.leakHeard && d < 15 && AUD.on) { st.leakHeard = true; STORY.think(YOU.leak, 5); G.sim.mimo.perk = 1; G.sim.mimo.ears.forEach(e => { e.v += 8; }); return; }
    if (st.leakHeard && !st.musicAsked && d < 6.5 && Y.still > 1.2 && AUD.on && !LEX.taught('w.music') && LEX.mayIntroduce()) {
      st.musicAsked = true;
      STORY.run(() => STORY.teachWord('w.music', { spot: DANCE_AT, look: { x: KAUA.x, z: KAUA.z } }));
    }
  }
  // a shot for the overlays: you, Mimo and Kauã in the top half of the screen (the card covers the bottom)
  function stage(on) {
    const Y = G.sim.you;
    if (on) {
      Y.x = YOU_AT.x; Y.z = YOU_AT.z; Y.yaw = Math.atan2(KAUA.x - Y.x, KAUA.z - Y.z); Y.vx = Y.vz = 0;
      Y.y = Y.ry = WORLD.groundAt(Y.x, Y.z);
      // from the south, looking north over the three of them (he's on the left, you on the right, Mimo in front): low, so
      // they sit in the top half of the screen, above the card
      G.cam.override = { pos: V3(19.9, KAUA.y + 2.5, -172.5), look: V3(17.8, KAUA.y - 0.3, -179.6), dur: 0.9 };
    } else G.cam.override = null;
  }
  // a two-shot from the side of the line between you and him (the side away from the pond), wherever you walked up from
  function twoShot() {
    const Y = G.sim.you, dx = KAUA.x - Y.x, dz = KAUA.z - Y.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
    const mx = (KAUA.x + Y.x) / 2, mz = (KAUA.z + Y.z) / 2, d = 3.4 + L * 0.5;
    let nx = -uz, nz = ux;
    if (Math.hypot(mx + nx * d - 12.2, mz + nz * d + 179.6) < Math.hypot(mx - nx * d - 12.2, mz - nz * d + 179.6)) { nx = -nx; nz = -nz; }
    G.cam.override = { pos: V3(mx + nx * d - ux * 0.8, KAUA.y + 1.9, mz + nz * d - uz * 0.8), look: V3(mx + ux * 0.4, KAUA.y + 0.8, mz + uz * 0.4), dur: 1.0 };
  }

  // ================================================================ talking (STORY scenes)
  const lock = on => { if (G) G.sim.lock = on ? 1 : 0; };
  // He says a line (his bubble over him, through the weave, waiting for E)
  // (full: the richer English to mix from, the later chapters; STORY.sayInline mixes every line, the English on request)
  function speak(key, vars, full) {
    const L = lineOf(key, vars), W = LEX.weave();
    KAUA.lines = { en: full ? L.en : (L.weave || L.en), pt: L.text };
    return STORY.sayInline(KAUA, !!full);
  }
  // You say a phrase back to him (echo: the model's shown), or come up with it (recall: only the English). Typed, in the
  // "tell Mimo" box. o.accept: other phrase ids that count too (the one you used is the one that's practised).
  async function sayBack(id, o = {}) {
    const it = LEX.item(id); if (!it) return { ok: false };
    const model0 = o.model || it.pt;
    for (let tries = 0; tries < 3; tries++) {
      const showModel = !o.recall || tries > 0;
      const r = await UI.command({ name: 'Kauã', icon: 'ph_slang', verbs: [], model: model0, modelEn: it.en,
        title: o.title || (o.recall ? `Kauã: “${it.en}”… how do Brazilians say it?` : `Say it like Kauã: «${model0}»`),
        hint: showModel ? `«${model0}» = ${it.en} · ${it.note}` : `(${it.en}) · ? if you forgot`,
        placeholder: showModel ? model0 : 'say it in Portuguese…' });
      if (!r || r.cancelled) return { ok: false, cancelled: true };
      const used = [id].concat(o.accept || []).find(a => phraseIn(a, r.text));
      if (used) {
        LEX.attempt(used, { ok: true, hints: tries ? 1 : 0, ms: r.ms, mode: o.recall ? 'review' : 'echo' });
        Sound.play('review'); KA.cheer = 0.8; G.sim.mimo.happy = 0.5;
        UI.toast(`«${LEX.item(used).pt}» ✓ ${tries ? 'Got it!' : o.recall ? 'From memory!' : 'Kauã gives you a fist bump.'}`);
        return { ok: true, id: used };
      }
      Sound.play('wrong');
      if (o.recall && tries === 0) LEX.attempt(id, { ok: false, ms: r.ms, mode: 'review' });
      STORY.think(`Not quite… he said «${model0}». Once more!`, 3);
    }
    LEX.learnt(id);           // shown three times: it's in the Phrasebook now, and comes back soon
    return { ok: false };
  }
  // Talking moves his story on: the chapter that's open and not done yet, or a reminder of what's left; otherwise his menu
  // (the next chapter or "later: …", rematches, tracks, slang practice, Mimo's cosmetics)
  async function talk() {
    const st = S();
    lock(true);
    try {
      if (!st.met) { if (chOpen(1)) await meetScene(); else { await speak('phonk.wait1'); await menu(true); } }
      else if (ORDER.some(k => st.samples[k] && !st.heard[k])) await deliverScene();
      else if (!chDone(st, 1)) await speak(!st.samples.ducks ? 'phonk.again.ducks' : 'phonk.again.bell');
      else if (!st.built) {
        if (!chOpen(2)) await menu();
        else if (!st.c2s) await ch2Start();
        else if (outCount(st) < 4) await speak('phonk.again.more', { n: 4 - outCount(st) });
        else await buildScene();
      }
      else if (!st.won) { if (chOpen(3)) await ch3Run(); else await menu(); }
      else if (await ext('talk')) { /* a later chapter, halfway through (baile.js) */ }
      else await menu();
    } finally { lock(false); G.cam.override = null; KAUA.talking = false; G.save(); }
  }
  // chapter 1 ends when the ducks and the bell are in: the beat's born, but it needs the land's sounds (chapter 2)
  async function ch1End() {
    const st = S();
    await speak('phonk.c1.end');
    st.ch1 = true; G.save(); Sound.phonkMix = mixNow();
    if (st.c2s) { if (outCount(st) >= 4) await buildScene(); else await speak('phonk.again.more', { n: 4 - outCount(st) }); }     // (an old save, already out recording)
    else if (chOpen(2)) await ch2Start(); else await speak('phonk.c1.hill');
  }
  async function ch2Start() {
    const st = S();
    twoShot();
    await speak('phonk.c2.start');
    await speak('phonk.c2.list');
    st.c2s = true; G.save();
    await speak('phonk.c2.go');
    UI.toast('Chapter 2: «Sons da estrada». A ♪ floats over each sound to record.');
  }
  async function ch3Run() {
    const st = S();
    if (!st.c3s) { st.c3s = true; if ((flags().bells || 0) >= 1) await speak('phonk.c3.start'); }     // (an old save may get here before the mill turns)
    await speak('phonk.build.battle');
    await battleFlow();
  }
  async function meetScene() {
    const st = S(), M = G.sim.mimo;
    twoShot();
    await STORY.you(YOU.meet);
    // Mimo dances right in front of him until he opens his eyes
    G.sim.mimoGo(DANCE_AT, { x: KAUA.x, z: KAUA.z });
    await STORY.wait(0.9);
    for (let k = 0; k < 4; k++) { M.hop = { x0: M.x, z0: M.z, x1: M.x, z1: M.z, y0: M.y, y1: M.y, t: 0, dur: 0.34, h: 0.5 }; Sound.play('chirp'); await STORY.wait(0.46); }
    KA.notice = 30; Sound.play('scratch');
    await STORY.wait(0.6);
    await speak('phonk.meet.whoa');
    await STORY.you(YOU.mimo);
    await speak('phonk.meet.name');
    await sayBack('ph.br_eai', { title: 'Greet him back the same way: «E aí?»' });
    await speak('phonk.meet.suave');
    await sayBack('ph.br_suave', { title: 'Answer him: «Suave!» (all chill!)', accept: ['ph.br_beleza', 'ph.br_deboa', 'ph.br_firmeza'] });
    await speak('phonk.meet.beat');
    await sayBack('ph.br_taligado', { title: 'He keeps saying «Tá ligado?» (you know?). Try it!' });
    await speak('phonk.meet.hush');
    await speak('phonk.meet.ask');
    await STORY.you(YOU.sure);
    await speak('phonk.meet.recorder');
    st.met = true; st.recorder = true; G.state.bag = G.state.bag || {}; G.state.bag['k.recorder'] = 1; G.save();
    Sound.play('chest');
    await UI.card(`<canvas width="140" height="140"></canvas><div class="tag">Key item</div><div class="big">gravador</div><div class="sub">Kauã’s recorder: press E by a sound to record it · <b>E</b></div>`, { kind: 'reveal', icon: 'ph_recorder', say: 'gravador' });
    await speak('phonk.meet.ducks');
    await speak('phonk.c1.where');
    await speak('phonk.c1.two');
    KA.notice = 0; G.sim.mimoGo(null, null);
  }
  // he listens to what you brought, reacts with slang, and you say it back; four sounds and he builds the beat
  async function deliverScene() {
    const st = S();
    for (const k of ORDER) {
      if (!st.samples[k] || st.heard[k]) continue;
      await speak('phonk.got.listen');
      KA.notice = 3; Sound.play(SAMPLES[k].fx);
      await STORY.wait(1.3);
      await speak('phonk.got.' + k);
      const ph = SAMPLES[k].phrase, it = LEX.item(ph);
      if (it) await sayBack(ph, { title: `Say it like Kauã: «${it.pt}»` });
      st.heard[k] = true; G.save();
    }
    if (!st.ch1 && !st.built && st.heard.ducks && st.heard.bell) await ch1End();
    else if (!chDone(st, 1)) await speak(!st.samples.ducks ? 'phonk.again.ducks' : 'phonk.again.bell');
    else if (st.built) return;
    else if (!chOpen(2) && !st.c2s) await speak('phonk.c1.hill');
    else if (!st.c2s) await ch2Start();
    else if (outCount(st) >= 4) await buildScene();
    else await speak('phonk.again.more', { n: 4 - outCount(st) });
  }
  // the end of chapter 2: the beat, built layer by layer; then the batalha (chapter 3), now or once the mill turns again
  async function buildScene() {
    const st = S();
    await speak('phonk.build.start');
    stage(true);
    await playDesk(['base'].concat(ORDER.filter(k => st.samples[k])));
    stage(false);
    st.built = true; G.save();
    await speak('phonk.build.done');
    await sayBack('ph.br_mo', { title: 'Make it bigger, his way: «Mó irado!» (super awesome!)', model: 'Mó irado!' });
    await speak('phonk.c2.end');
    if (chOpen(3)) await ch3Run(); else await speak('phonk.c2.mill');
  }
  async function howTo() {
    await UI.card(`<div class="tag">Batalha de rima · how it works</div><div class="big" style="font-size:30px">Rhyme on the beat!</div>`
      + `<div style="text-align:left;font-size:15px;line-height:1.45;margin:8px 4px 4px">1. Kauã raps two lines. The last word is missing.<br>2. Type a Portuguese word that <b>rhymes</b> (and fits!).<br>3. Press <b>Enter right on the ★ beat</b>: the dots count you in.<br>Perfect timing + a word that rhymes and fits = <b>S</b>. In easy mode the beat waits for you.</div><div class="sub">E</div>`, { kind: '' });
    await sayBack('ph.br_toligado', { title: 'He asks «Tá ligado?» (you know?). Answer: «Tô ligado!» (I know!)' });
  }
  async function askEasy() {
    const v = await UI.choose('How do you want to play the batalha?', [
      { label: 'On the beat', sub: 'type your word, then press Enter right on the ★ beat', value: 'normal' },
      { label: 'Easy: the beat waits for you', sub: 'no rush: type, press Enter, and your word drops on the next beat', value: 'easy' },
    ]);
    if (v === null) return null;
    S().easy = v === 'easy';
    return v === 'easy';
  }
  // the first time: how it works, the Treino, then for real; win and the track plays, then his gifts
  async function battleFlow() {
    const st = S();
    if (!st.howTo) { await howTo(); st.howTo = true; }
    const easy = await askEasy();
    if (easy === null) { await speak('phonk.bat.quit'); return; }
    if (!st.best[1]) {
      const r1 = await runLevel(1, easy);
      if (r1.quit) { await speak('phonk.bat.quit'); return; }
      await speak('phonk.bat.next');
    }
    const r2 = await runLevel(2, easy);
    if (r2.quit) { await speak('phonk.bat.quit'); return; }
    st.won = true; G.save();
    await speak('phonk.bat.won');
    await speak('phonk.track.intro');
    stage(true); await playTrack(); stage(false);
    await rewards();
  }
  async function rewards() {
    const st = S(), M = G.sim.mimo;
    await speak('phonk.track.gift');
    G.state.flags.mimoPhones = true; st.phonesOn = true; M.happy = 1.5; Sound.play('chest');
    G.w3d.fx.sparkle(M.x, M.ry + 0.9, M.z, 16);
    await UI.card(`<canvas width="140" height="140"></canvas><div class="tag">For ${esc(mimoName())}</div><div class="big">${esc(LEX.form('w.headphones', { article: true }) || 'o fone')}</div><div class="sub">DJ Lagoa’s headphones (you can take them off in his menu) · <b>E</b></div>`,
      { kind: 'reveal', icon: 'headphones', say: 'fone' });
    if (!LEX.taught('w.headphones') && LEX.mayIntroduce()) await STORY.teachWord('w.headphones', { look: { x: KAUA.x, z: KAUA.z } });
    await speak('phonk.track.tape');
    G.state.bag = G.state.bag || {}; G.state.bag['k.mixtape'] = 1; Sound.play('learned');
    await UI.card(`<canvas width="140" height="140"></canvas><div class="tag">Key item</div><div class="big">a fita</div><div class="sub">DJ Lagoa’s mixtape: «Lagoa sem Silêncio» · <b>E</b></div>`, { kind: 'reveal', icon: 'ph_tape', say: 'a fita' });
    await sayBack('ph.br_valeu', { title: 'Thank him the Brazilian way: «Valeu!»' });
    await speak('phonk.track.sweet');
    await sayBack('ph.br_tamojunto', { title: 'Say it back: «Tamo junto!» (I’ve got your back!)' });
    G.save();
    await speak('phonk.c3.end');
  }
  // his menu: the next chapter (or when it opens), and everything to do again
  async function menu(quiet) {
    const st = S(), mimo = mimoName(), best = n => (st.best[n] ? ` · your best: ${st.best[n]}` : ''), opts = [];
    const next = CH.find(c => !chDone(st, c.n));
    if (next) {
      if (!chOpen(next.n)) opts.push({ label: `Chapter ${next.n}: ${next.title}`, sub: `later: ${next.wait}`, value: 'wait' });
      else if (next.n >= 4 && EXT && EXT.chapter) opts.push({ label: `Chapter ${next.n}: ${next.title}`, sub: next.sub, value: 'next' });
    }
    if (st.won) {
      opts.push({ label: 'Batalha: Treino', sub: '4 rounds, with options' + best(1), value: 'b1' });
      opts.push({ label: 'Batalha: Valendo', sub: '6 rounds, the rhyme ending shown' + best(2), value: 'b2' });
      if (st.best[2]) opts.push({ label: 'Batalha: Final', sub: '140 bpm, 6 rounds, no hints' + best(3), value: 'b3' });
      opts.push({ label: 'Listen to «Lagoa sem Silêncio»', sub: 'our track, with your words in it', value: 'track' });
    }
    const more = ext('menuItems'); if (Array.isArray(more)) opts.push(...more);
    if (st.met) opts.push({ label: 'Practice slang', sub: 'he says it in English, you say it like a Brazilian', value: 'drill' });
    if (G.state.flags.mimoPhones) opts.push({ label: st.phonesOn === false ? `Put ${mimo}’s headphones on` : `Take ${mimo}’s headphones off`, value: 'phones' });
    if (!opts.length) return;
    if (!quiet) await speak(st.won ? 'phonk.after' : 'phonk.menu');
    const v = await UI.choose('Kauã (DJ Lagoa)', opts);
    if (!v) { if (st.met) await speak('phonk.after.bye'); return; }
    if (v === 'next') return ext('chapter', next.n);
    if (v === 'wait') return speak({ 1: 'phonk.wait1', 2: 'phonk.c1.hill', 3: 'phonk.c2.mill', 4: 'phonk.wait4', 5: 'phonk.wait5' }[next.n]);
    if (typeof v === 'string' && v.startsWith('x:')) return ext('menuPick', v);
    if (v[0] === 'b') {
      const easy = await askEasy(); if (easy === null) return;
      const r = await runLevel(+v[1], easy);
      await speak(r.quit ? 'phonk.bat.quit' : 'phonk.after.bye');
    } else if (v === 'track') { stage(true); await playTrack(); stage(false); await speak('phonk.after.bye'); }
    else if (v === 'drill') await drill();
    else if (v === 'phones') { st.phonesOn = st.phonesOn === false; G.sim.mimo.happy = 0.8; UI.toast(st.phonesOn ? `${mimo} puts the headphones back on.` : `${mimo} takes the headphones off.`); }
  }
  // slang practice: phrases you haven't been taught first (shown, then typed), then ones that are due, then any (from memory)
  const afterMenu = () => menu();       // (its old name: tests)
  async function drill() {
    await speak('phonk.drill.start');
    const more = ext('phraseIds'), was = LEX.lang;
    const ids = PHRASES.map(p => p.id).concat(Array.isArray(more) ? more.filter(id => LEX.item(id) && LEX.taught(id)) : []);
    LEX.lang = 'pt';
    let fresh, due, known;
    try { fresh = ids.filter(id => !LEX.taught(id)); const d = new Set(LEX.due(40)); due = ids.filter(id => LEX.taught(id) && d.has(id)); known = ids.filter(id => LEX.taught(id) && !d.has(id)); } finally { LEX.lang = was; }
    const f = shuffle(fresh.slice()), pick = f.slice(0, 2).concat(shuffle(due), shuffle(known), f.slice(2)).slice(0, 5);
    for (const id of pick) {
      const r = await sayBack(id, LEX.taught(id) ? { recall: true } : { title: `New one: «${LEX.item(id).pt}» (${LEX.item(id).en})` });
      if (r.cancelled) return;
    }
    await speak('phonk.drill.end');
  }

  // ================================================================ recording the sounds
  async function record(k) {
    const st = S(), sp = SAMPLES[k];
    lock(true);
    try {
      if (k === 'ducks' && !(await mimoSplash())) return;
      if (k === 'bell' && !(await mimoPebble())) return;
      if (k === 'train' && !(G.w3d.train && G.w3d.train.here)) { STORY.think(YOU.trainGone, 4); return; }
      if (k === 'gears' && !available('gears')) { STORY.think(YOU.gearsHushed, 4.5); return; }
      if (k === 'sheep') STORY.think(YOU.sheep, 3);
      if (k === 'frogs') STORY.think(YOU.frogs, 3);
      if (k === 'gears') STORY.think(YOU.gears, 3);
      await recCard(k);
      st.samples[k] = true; G.save();
      const n = outCount(st), ch1 = !chDone(st, 1) && !st.c2s;
      UI.toast(ch1 ? `Recorded: ${sp.en}! ${st.samples.ducks && st.samples.bell ? 'Back to Kauã.' : k === 'ducks' ? 'Now the tower’s bell.' : 'Now the ducks.'}` : k === 'ducks' ? `Recorded: ${sp.en}!` : `Recorded: ${sp.en} (${Math.min(4, n)}/4)`);
      // a new word, if Mimo's curious
      const word = { ducks: 'w.duck', bell: 'w.bell', sheep: 'w.sheep' }[k];
      if (word && !LEX.taught(word) && LEX.mayIntroduce()) { await STORY.wait(0.6); await STORY.teachWord(word, { look: k === 'bell' ? { x: -26, z: -166 } : sp.at }); }
      else if (ch1) STORY.think(st.samples.ducks && st.samples.bell ? YOU.two : k === 'ducks' ? YOU.bellNext : YOU.ducksNext, 4);
      else if (n === 4 && k !== 'ducks') STORY.think(YOU.four, 4);
    } finally { lock(false); }
  }
  // the ducks are shy: Mimo has to jump in near them («Pula!»)
  async function mimoSplash() {
    const M = G.sim.mimo, sp = SAMPLES.ducks.at, edge = { x: 12.4, z: -176.2 };
    const r = await UI.command({ name: mimoName(), icon: 'duck', title: `The ducks are shy. What should ${mimoName()} do?`, hint: 'Kauã said: make it jump in near them!', verbs: ['v.jump', 'v.swim', 'v.hit', 'v.throw', 'v.push', 'v.eat'], answer: 'v.jump' });
    if (!r || r.cancelled) { STORY.think(YOU.ducksShy, 3); return false; }
    if (r.verb === 'v.jump' || r.verb === 'v.swim') {
      learnUse(r.verb, r.ms);
      G.sim.mimoGo(edge, { x: 12.2, z: -179.6 }); await STORY.wait(0.8);
      M.hop = { x0: M.x, z0: M.z, x1: M.x, z1: M.z - 0.3, y0: M.y, y1: M.y, t: 0, dur: 0.45, h: 0.9 }; Sound.play('chirp');
      await STORY.wait(0.5); Sound.play('poof'); G.w3d.fx.puff(edge.x, WORLD.terrainAt(edge.x, edge.z) + 0.05, edge.z - 0.6, 10, 0.25, '#bfe6f2');
      G.sim.mimoGo(null, null); await STORY.wait(0.2);
      return true;
    }
    const what = { 'v.hit': `${mimoName()} punches the air. The ducks look unimpressed.`, 'v.throw': `${mimoName()} throws a pebble… plop! The ducks just paddle away.`, 'v.push': `${mimoName()} pushes… nothing. The ducks stare.`, 'v.eat': `${mimoName()} looks for a snack. The ducks look for one too.` }[r.verb]
      || `${mimoName()} tilts its head. Kauã said: jump in near them!`;
    STORY.think(what, 4); return false;
  }
  // the bell's too high: Mimo throws a pebble at it («Joga!»)
  async function mimoPebble() {
    const M = G.sim.mimo, bell = V3(-26, 10.6, -166);
    const r = await UI.command({ name: mimoName(), icon: 'bell', title: `The bell is way up in the tower. What should ${mimoName()} do?`, hint: 'Too high to reach… but a pebble could hit it!', verbs: ['v.throw', 'v.jump', 'v.hit', 'v.push', 'v.swim', 'v.eat'], answer: 'v.throw' });
    if (!r || r.cancelled) { STORY.think(YOU.bellHigh, 4); return false; }
    if (r.verb === 'v.throw') {
      learnUse(r.verb, r.ms);
      G.sim.mimoGo({ x: -23.6, z: -165.2 }, { x: bell.x, z: bell.z }); await STORY.wait(0.7);
      const peb = part(GEO.ico1, '#a3a196', [M.x, M.ry + 0.5, M.z], [0.09, 0.09, 0.09], { ink: 0.01 }); group.parent.add(peb);
      const from = peb.position.clone(); Sound.play('whiff');
      await STORY.tween(0.75, k => { peb.position.lerpVectors(from, bell, k); peb.position.y += Math.sin(k * Math.PI) * 3; });
      peb.parent.remove(peb); Sound.play('bigbell'); G.w3d.fx.sparkle(bell.x, bell.y, bell.z, 12);
      G.sim.mimoGo(null, null); M.happy = 1;
      await STORY.wait(0.3);
      return true;
    }
    const what = { 'v.jump': `${mimoName()} jumps as high as it can… the bell is way too high!`, 'v.hit': `${mimoName()} hits the tower wall. Ow! Stone is hard.`, 'v.push': `${mimoName()} pushes the tower. The tower wins.` }[r.verb]
      || `${mimoName()} looks up at the bell, then at you. Maybe a pebble?`;
    STORY.think(what, 4); return false;
  }
  function learnUse(id, ms) {
    if (!LEX.item(id)) return;
    const first = !LEX.taught(id);
    LEX.attempt(id, { ok: true, ms: ms || 4000, mode: first ? 'teach' : 'command' });
    G.sim.mimoSay((LEX.form(id) || '') + '!', 1.6);
    if (first) UI.toast(`${mimoName()} learned «${LEX.form(id)}»`);
  }
  function lookSpot(k) {
    if (k === 'train') STORY.think(YOU.trainGone, 4);
    else if (k === 'gears') STORY.think(YOU.gearsHushed, 4.5);
    return Promise.resolve();
  }
  function interactables() {
    if (!G || !isPT() || indoors() || !G.state.flags.hatched) return [];
    const st = S(), list = ext('busyNow') ? [] : [{ x: KAUA.x, z: KAUA.z, r: 2.6, label: 'Talk', run: talk }];
    const more = ext('interactables'); if (Array.isArray(more)) list.push(...more);
    if (st.recorder) for (const k of ORDER) {
      if (st.samples[k] || !canRecord(st, k)) continue;
      const sp = SAMPLES[k], ready = k === 'train' ? !!(G.w3d.train && G.w3d.train.here) : available(k);
      list.push({ x: sp.at.x, z: sp.at.z, r: sp.r, label: ready ? 'Record' : 'Look', run: () => (ready ? record(k) : lookSpot(k)) });
    }
    return list;
  }

  // ================================================================ the quest (a quests.js LIST entry: only in Portuguese games)
  function quest() {
    const st = s => s.phonk || {}, smp = s => st(s).samples || {}, outN = s => OUT.filter(k => smp(s)[k]).length;
    const nextSpot = () => {
      const s = G.state, Y = G.sim.you, list = OUT.filter(k => !smp(s)[k] && available(k) && canRecord(st(s), k)).map(k => SAMPLES[k].at);
      return list.sort((a, b) => Math.hypot(a.x - Y.x, a.z - Y.z) - Math.hypot(b.x - Y.x, b.z - Y.z))[0] || SEAT;
    };
    // a step's text says when its chapter opens, until it has
    const later = (n, text) => ({ get text() { return chOpen(n) ? text : `${text} (${CH[n - 1].wait})`; } });
    const steps = [
      Object.assign(later(1, 'Record the {w.duck:pl} and the tower’s {w.bell} for Kauã'), { word: 'w.duck',
        why: 'Kauã lent you his recorder. The {w.duck:pl} on the pond are shy: tell {mimo} to jump in near them. The {w.bell} is way up in Alba’s tower: maybe a pebble?',
        done: s => !!(st(s).ch1 || st(s).built) || !!(smp(s).ducks && smp(s).bell && st(s).heard && st(s).heard.ducks && st(s).heard.bell),
        target: () => { const m = smp(G.state); return !m.ducks ? SAMPLES.ducks.at : !m.bell ? SAMPLES.bell.at : SEAT; }, hint: '{mimo} points at the {w.duck:pl} on the pond. They’re shy…' }),
      Object.assign(later(2, 'Record sounds out in the land ({n}/4)'), { n: s => Math.min(4, outN(s)),
        why: 'Three more: the {w.train}’s whistle at the station, the bell {w.sheep} at the farm in the Windmill Hills, the frogs in the Reed River’s reeds (or the Great Mill’s gears, once it turns). A ♪ floats over each one.',
        done: s => outN(s) >= 4 || !!st(s).built, target: nextSpot, hint: '{mimo}’s ears twitch. A sound for the beat, that way!' }),
      { text: 'Bring the sounds back to Kauã', why: 'He’s waiting at Alba’s pond, nodding to his beat.', done: s => !!st(s).built, target: () => SEAT, hint: '{mimo} bops its head. Back to the pond!' },
      Object.assign(later(3, 'Win the batalha with DJ Lagoa'), { why: 'A rap battle: he raps, you finish each verse with a Portuguese word that rhymes, right on the beat.',
        done: s => !!st(s).won, target: () => SEAT, hint: '{mimo} is already dancing. Kauã’s waiting at the pond!' }),
    ];
    const more = ext('questSteps', later); if (Array.isArray(more)) steps.push(...more);
    const story = [
      { when: s => !!st(s).met, text: 'By Alba’s duck pond sits Kauã, a Brazilian teen who calls himself DJ Lagoa. Since the Hush came, he can’t stand the quiet, so his phonk is always loud in his {w.headphones}. He lent you his recorder: his beat needs real sounds from around the land.' },
      { when: s => !!st(s).built, text: 'With the sounds you recorded, he built the beat one layer at a time. Then it needed words…' },
      { when: s => !!st(s).won, text: 'You won the batalha: he rapped, you rhymed, right on the beat. Your words are in his track, «Lagoa sem Silêncio», and {mimo} got {w.headphones} of its own. «Tamo junto!»' },
    ];
    const more2 = ext('questStory'); if (Array.isArray(more2)) story.push(...more2);
    return { id: 'phonk', kind: 'side', title: 'DJ Lagoa’s beat', giver: 'Kauã (DJ Lagoa), by Alba’s duck pond', started: s => s.lang === 'pt' && !!st(s).met, steps, story };
  }

  return {
    init(game) {
      G = game;
      if (EXT && EXT.init) { try { EXT.init(game); } catch (e) { console.error('[phonk ext] init', e); } }
      if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'phonk')) QUESTS.LIST.push(quest());
      if (G.cast && G.cast.mimo && G.cast.mimo.body && !mimoPhones) mimoPhones = buildMimoPhones(G.cast.mimo.body);
      setInterval(watchdog, 300);
      root();
    },
    build, interactables, quest,
    get busy() { return !!MODE; },
    // the later chapters (baile.js) plug in here, and use his voice, his stage and his state through api
    use(x) { EXT = x || null; },
    api: { S: () => S(), KAUA, KA, SEAT, FACE, DANCE_AT, YOU_AT, CH, speak, sayBack, lineOf, stage, twoShot, lock, chOpen, chDone, mimoName, menu: q => menu(q), isPT, indoors, get model() { return model; } },
    // tests and tools
    _: {
      SEAT, FACE, DANCE_AT, YOU_AT, SAMPLES, ORDER, LEVELS, PHRASES, NEW_WORDS, LT, YOU, KAUA, BAT, TRK, DESK, REC, RES, AUD, KA, TEST, people,
      S: () => S(), lineOf, judgeWord, timingOf, gradeOf, phraseIn, speak, sayBack, talk, record, meetScene, deliverScene, buildScene, battleFlow, rewards, afterMenu, menu, drill,
      CH, chOpen, chDone, canRecord, ch1End, ch2Start, ch3Run, get EXT() { return EXT; },
      playLevel, runLevel, playTrack, playDesk, submit: (text, at) => submit(text, at), stage, makeLeak, mixNow, beatNow,
      clockNow: () => (BAT.on ? clockNow(BAT.C) : TRK.on ? clockNow(TRK.C) : DESK.on ? clockNow(DESK.C) : null),
      target: () => (BAT.R ? (BAT.R.rs + 12) * BAT.C.beat : null),
      get mode() { return MODE; }, get model() { return model; }, get group() { return group; }, get markers() { return markers; }, get mimoPhones() { return mimoPhones; },
    },
  };
})();
