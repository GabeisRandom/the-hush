'use strict';
// The Frost Peaks' time songs (DESIGN.md 20 "T3b"): each world's area, dungeon and boss, and the little tune of young Tobías's cuckoo
// clock. Never phonk or orchestral; none shares its meter, groove, tempo, bass or lead with another song in the game (today's
// Escarcha is cozy-cold funk at 98 with sleigh bells and a flugelhorn; the Ice Clock Tower is clockwork funk at 120 with an FM lead).
//   'pk_past', "The Clockmaker's Winter" (Escarcha long ago): swung lo-fi jazz at 76 in B♭. A felt kick and brushes, crackle, a round
//     walking bass, felt-piano chords pushed late, a woodblock tick-tock in the off-beats, and in the second half a music-box melody.
//   'pk_past_cave', "White Hollow" (the ice cave): ice-dub at 70 in E minor. A dub kick, a side-stick drowned in echo, a sliding sub
//     bass, glass pings, the wind swelling every other bar, drips, sparse vibraphone.
//   'boss_pk_owl', "Eye of the Storm" (the Blizzard Owl): 7/8 funk at 150 in C♯ minor. Slap bass, wah chops, rimshots, a shakuhachi
//     hooting a falling third like an owl, a storm swell every fourth bar.
//   'pk_future', "Stopped Clocks" (Escarcha tomorrow): lo-fi at 66 in A minor. A clock that skips its ticks, pizzicato bass, celesta;
//     as the village wakes (PK_FUT.k()) the ticks steady, dusty drums come in, and once it's free a melodica sings.
//   'pk_future_tower', "The Frozen Escapement" (tomorrow's tower): 9/8 (2+2+2+3) at 112 in F minor. Woodblocks in the escapement's
//     limp, a clank on each bar, a filtered bass, combo-organ chords, glass, a breathy EWI line.
//   'boss_pk_cuckoo', "Cuckoo o'Clock" (the Gray Cuckoo): oompah-funk at 160 in G. A tuba-ish «oom» and a skank «pah», funk drums,
//     clavinet sixteenths, an accordion tune, a whistled «cu-cú» falling third every two bars, cowbell.
//   'pk_cuckoo' (a deck jingle): the cuckoo clock's own tune on a music box, then «cu-cú» · 'pk_cucu': a single «cu-cú».
//   PKMUSIC.play(name, sec): a jingle on its own deck, the area's music dipped under it · PKMUSIC.cuckoo(): one «cu-cú»
const PKMUSIC = (() => {
  const out = { play: () => false, stop: () => {}, cuckoo: () => {} };
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return out;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);

  // ---------------------------------------------------------------- 'pk_past': The Clockmaker's Winter (swung lo-fi jazz, 76)
  if (!has('pk_past')) {
    const CH = K.CH('Bb1: D3 F3 A3 C4, G1: F3 Bb3 D4, Eb2: G3 Bb3 D4, F1: Eb3 A3 C4, D2: F3 A3 C4, G1: F3 Bb3 D4 A4, C2: E3 G3 Bb3 D4, F1: Eb3 G3 A3 C4');
    const MB = K.mel('r/8 F5/2 G5/2 A5/2 Bb5/2 | C6/4 A5/4 F5/8 | r/4 D6/2 C6/2 Bb5/4 A5/4 | G5/12 r/4', 64);
    const WALK = [0, 2, 4, 7];
    Sound.addSong('pk_past', { bpm: 76, len: 128, swing: 0.2, vol: 0.3, verb: 0.22, echo: 0.1, echoSteps: 3, tone: 6000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      K.crackle(t, s16, 0.8);
      if (st === 0 || st === 10) K.feltkick(t, st === 0 ? 0.85 : 0.55);
      if (st === 4 || st === 12) K.brush(t, 0.85, 0.2); else if (st % 4 === 2) K.brush(t, 0.3, 0.06);
      // the clock in the groove: tick … tock, on the off-beats
      if (st % 4 === 2) K.woodblock(t, (st >> 2) % 2 === 0, 0.55);
      if (st % 4 === 0) K.roundbass(ch[0] + WALK[(st >> 2) & 3], t, s16 * 3.4, 0.8);
      if (st === 5 || st === 13) ch.slice(1).forEach((m, k) => K.felt(m, t + k * 0.015, s16 * 4, 0.42));
      const n = MB[i]; if (n) K.mbox(n[0], t, 0.8, 0, n[1] * s16 * 1.6);
      if (st === 14 && (bar & 3) === 1) K.celesta(ch[1] + 24, t, 0.5, 0.8);
    } });
  }

  // ---------------------------------------------------------------- 'pk_past_cave': White Hollow (ice-dub, 70)
  if (!has('pk_past_cave')) {
    const CH = K.CH('E2: G3 B3 D4 F#4, C2: E3 G3 B3, A1: G3 B3 C4 E4, B1: A3 D#4 F#4');
    Sound.addSong('pk_past_cave', { bpm: 70, len: 128, swing: 0.08, vol: 0.32, verb: 0.34, echo: 0.36, echoSteps: 3, tone: 5200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[(bar >> 1) & 3];
      if (st === 0 || st === 10) K.dubkick(t, st === 0 ? 0.9 : 0.6);
      if (st === 8) K.sidestick(t, 0.8);
      if (st % 4 === 2) K.dubhat(t, 0.45, st === 14);
      if (st === 0) K.subglide(ch[0], t, s16 * 7, 0.8); if (st === 11) K.subglide(ch[0] + 7, t, s16 * 3, 0.5);
      if (st === 6 || (st === 13 && (bar & 1))) K.glass(ch[1 + (bar % (ch.length - 1))] + 24, t, 0.5, 1.4);
      if (st === 0 && (bar & 1) === 0) K.swell(t, s16 * 14, 0.5);
      if (st === 4 && (bar & 3) === 2) ch.slice(1).forEach((m, k) => K.vibe(m + 12, t + k * 0.02, s16 * 6, 0.35));
      if (Math.random() < 0.06) K.drip(86 + ((Math.random() * 7) | 0), t, 0.6);
    } });
  }

  // ---------------------------------------------------------------- 'boss_pk_owl': Eye of the Storm (7/8 funk, 150: 14 steps a bar)
  if (!has('boss_pk_owl')) {
    const CH = K.CH('C#2: E3 G#3 B3, C#2: E3 G#3 B3, A1: C#3 E3 G#3, B1: D#3 F#3 A3, C#2: E3 G#3 B3, F#1: A3 C#4 E4, G#1: B3 D#4 F#4, G#1: B3 C4 F#4');
    const SL = { 0: 0, 3: 0, 4: 12, 6: 10, 8: 7, 10: 0, 12: 3 };
    const HOO = { 0: [80, 3], 4: [77, 5], 28: [83, 3], 32: [80, 5] };       // (the owl's call: a falling third, twice, every other bar)
    Sound.addSong('boss_pk_owl', { bpm: 150, len: 112, swing: 0, vol: 0.42, verb: 0.16, echo: 0.12, echoSteps: 3, tone: 8200, play(i, t, s16) {
      const bar = Math.floor(i / 14), st = i % 14, ch = CH[bar & 7];
      if (st === 0 || st === 6 || st === 10) K.funkkick(t, st === 0 ? 1 : 0.75);
      if (st === 4 || st === 12) K.rimcrack(t, 0.75);
      K.hat(t, st % 2 ? 0.22 : 0.38);
      const o = SL[st]; if (o !== undefined) K.slap(ch[0] + o, t, st === 0 ? 1 : 0.7);
      if (st === 2 || st === 7 || st === 11) K.wahgtr(ch.slice(1).map(m => m + 12), t, 0.6, s16 * 0.9);
      const h = HOO[i % 56]; if (h && (bar & 1) === 0) K.lead(h[0] - 12, t, h[1] * s16 * 0.9, 'shaku', 0.6);
      if (st === 0 && (bar & 3) === 3) { K.swell(t, s16 * 12, 0.7); K.crash(t, 0.6); }
    } });
  }

  // ---------------------------------------------------------------- 'pk_future': Stopped Clocks (lo-fi, 66; the clock steadies as Escarcha wakes)
  if (!has('pk_future')) {
    const CH = K.CH('A1: C4 E4 G4 B4, F1: A3 C4 E4 G4, D2: F3 A3 C4 E4, E1: G#3 B3 D4 F4');
    const CEL = K.mel('E5/4 C5/4 B4/4 A4/4 | G4/8 A4/4 C5/4 | D5/4 C5/4 A4/4 E4/4 | E4/12 r/4', 0);
    const MEL = K.mel('r/8 A4/2 C5/2 E5/4 | D5/6 C5/2 A4/8 | r/4 G4/4 A4/2 C5/2 B4/4 | A4/12 r/4', 64);
    const kNow = () => { try { return typeof PK_FUT !== 'undefined' && PK_FUT && PK_FUT.k ? PK_FUT.k() : 0.2; } catch (e) { return 0.2; } };
    Sound.addSong('pk_future', { bpm: 66, len: 128, swing: 0.12, vol: 0.3, verb: 0.3, echo: 0.14, echoSteps: 3, tone: 5000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[(bar >> 1) & 3], k = kNow();
      K.crackle(t, s16, 1.1);
      // a stopped clock that tries to start: few ticks while it's gray, steady ones once it wakes
      if (st % 4 === 0 && (k > 0.5 || ((i * 7 + bar) % 5) < 2)) K.tick(t, (st >> 2) % 2 === 0, 0.5);
      if (st === 0) { ch.slice(1).forEach((m, j) => K.vibe(m, t + j * 0.02, s16 * 14, 0.32)); K.pizz(ch[0], t, 0.8); }
      if (st === 10) K.pizz(ch[0] + 7, t, 0.55);
      const n = CEL[i % 64]; if (n) K.celesta(n[0], t, 0.6, n[1] * s16 * 1.4);
      if (k > 0.45) {
        if (st === 0 || (st === 9 && (bar & 1))) K.dustkick(t, st === 0 ? 0.8 : 0.55);
        if (st === 8) K.dustsnare(t, 0.6);
        if (st % 2 === 0) K.dusthat(t, st % 4 === 2 ? 0.5 : 0.28);
      }
      if (k > 0.8) { const h = MEL[i]; if (h) K.lead(h[0], t, h[1] * s16 * 0.95, 'melodica', 0.5); }
    } });
  }

  // ---------------------------------------------------------------- 'pk_future_tower': The Frozen Escapement (9/8, 2+2+2+3, 112: 18 steps)
  if (!has('pk_future_tower')) {
    const CH = K.CH('F1: Ab3 C4 Eb4, Db2: F3 Ab3 C4, Bb1: Db4 F4 Ab4, C2: E3 G3 Bb3');
    const PULSE = [0, 4, 8, 12];                // (the escapement's limp: long, long, long, longer)
    const EWI = K.mel('r/18 | C5/4 Ab4/4 F4/4 G4/6 | r/18 | Eb5/4 Db5/4 C5/4 Bb4/6', 0);
    Sound.addSong('pk_future_tower', { bpm: 112, len: 144, swing: 0, vol: 0.32, verb: 0.24, echo: 0.12, echoSteps: 2, tone: 6400, play(i, t, s16) {
      const bar = Math.floor(i / 18), st = i % 18, ch = CH[bar & 3];
      if (PULSE.includes(st)) K.woodblock(t, st === 0 || st === 8, 0.7);
      if (st === 0) { K.clank(t, 0.5); K.dustkick(t, 0.75); }
      if (st === 12) K.dustsnare(t, 0.45);
      if (st % 2 === 1) K.tick(t, false, 0.25);
      if (st === 0 || st === 8) K.fbass(ch[0], t, s16 * 3.5, 0.75); if (st === 12) K.fbass(ch[0] + 7, t, s16 * 5, 0.6);
      if (st === 4 || st === 14) ch.slice(1).forEach((m, k) => K.organ(m, t + k * 0.01, s16 * 1.6, 0.4));
      if (st === 16 && (bar & 1)) K.glass(ch[2] + 24, t, 0.45, 1.2);
      const n = EWI[i % 72]; if (n) K.lead(n[0], t, n[1] * s16 * 0.9, 'ewi', 0.45);
    } });
  }

  // ---------------------------------------------------------------- 'boss_pk_cuckoo': Cuckoo o'Clock (oompah-funk, 160)
  if (!has('boss_pk_cuckoo')) {
    const CH = K.CH('G1: B3 D4 G4, D2: A3 C4 F#4, G1: B3 D4 G4, C2: C4 E4 G4, G1: B3 D4 G4, E1: B3 E4 G4, A1: C4 E4 A4, D2: C4 F#4 A4');
    const ACC = K.mel('G4/2 B4/2 D5/2 B4/2 | C5/2 A4/2 F#4/4 | G4/2 B4/2 D5/2 G5/2 | E5/4 D5/4 | C5/2 E5/2 G5/2 E5/2 | D5/2 B4/2 G4/4 | A4/2 C5/2 E5/2 D5/2 | C5/4 A4/4', 0);
    Sound.addSong('boss_pk_cuckoo', { bpm: 160, len: 128, swing: 0.04, vol: 0.42, verb: 0.12, echo: 0.06, echoSteps: 2, tone: 8600, play(i, t, s16) {
      const bar = i >> 3, st = i & 7, ch = CH[bar & 7];
      if (st === 0) K.tub(ch[0], t, s16 * 1.8, 0.95); if (st === 4) K.tub(ch[0] + 7, t, s16 * 1.8, 0.8);
      if (st === 2 || st === 6) K.skank(ch.slice(1), t, 0.9);
      if (st === 0 || (st === 5 && (bar & 1))) K.funkkick(t, st === 0 ? 1 : 0.7);
      if (st === 4) K.snare(t, 0.8);
      if (st % 2 === 1) K.clav(ch[1 + (st % 3)] + 12, t, 0.5);
      if (st === 6 && (bar & 1)) K.cowbell(t, 0.45, true);
      const n = ACC[i % 64]; if (n) K.lead(n[0], t, n[1] * s16 * 0.85, 'accordion', 0.5);
      // «cu-cú», every two bars
      if ((bar & 1) === 1 && st === 0) { K.lead(91, t, s16 * 1.2, 'whistle', 0.55); K.lead(88, t + s16 * 2, s16 * 1.8, 'whistle', 0.5); }
    } });
  }

  // ---------------------------------------------------------------- the cuckoo clock's own tune (a music box, then «cu-cú») and a single «cu-cú»
  if (!has('pk_cuckoo')) {
    const TUNE = K.mel('G5/2 B5/2 D6/4 B5/2 G5/2 | A5/2 C6/2 E6/4 D6/4 | G5/2 B5/2 D6/2 G6/2 F#6/2 E6/2 | D6/8 r/8', 0);
    Sound.addSong('pk_cuckoo', { bpm: 108, len: 64, swing: 0, vol: 0.3, verb: 0.24, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      const n = TUNE[i]; if (n) K.mbox(n[0], t, 0.9, 0, n[1] * s16 * 1.5);
      if (i === 52) { K.lead(91, t, s16 * 1.4, 'flute', 0.6); K.lead(88, t + s16 * 2.4, s16 * 2, 'flute', 0.55); }
      if (i === 58) { K.lead(91, t, s16 * 1.4, 'flute', 0.5); K.lead(88, t + s16 * 2.4, s16 * 2, 'flute', 0.45); }
    } });
  }
  if (!has('pk_cucu')) Sound.addSong('pk_cucu', { bpm: 120, len: 8, swing: 0, vol: 0.32, verb: 0.2, play(i, t, s16) { if (i === 0) { K.lead(91, t, s16 * 1.4, 'flute', 0.6); K.lead(88, t + s16 * 2.4, s16 * 2, 'flute', 0.55); } } });

  // ---------------------------------------------------------------- a jingle on its own deck, the area's music dipped under it
  let live = null, timer = 0;
  function stop() { try { if (live) live.stop(); } catch (e) { /* */ } live = null; clearTimeout(timer); try { Sound.duck('pk', 1); } catch (e) { /* */ } }
  function play(name, sec = 6) {
    if (!has(name) || !Sound.deck || !Sound.ctx || !Sound.out) return false;
    stop();
    try { live = Sound.deck(name, Sound.out, { loop: false }); } catch (e) { live = null; }
    if (!live) return false;
    try { Sound.duck('pk', 0.25, sec + 0.5); } catch (e) { /* */ }
    timer = setTimeout(stop, sec * 1000);
    return true;
  }
  let cu = null;
  function cuckoo() {
    if (!has('pk_cucu') || !Sound.deck || !Sound.ctx || !Sound.out) return false;
    try { if (cu) cu.stop(); } catch (e) { /* */ }
    try { cu = Sound.deck('pk_cucu', Sound.out, { loop: false }); setTimeout(() => { try { if (cu) cu.stop(); } catch (e) { /* */ } cu = null; }, 1400); } catch (e) { cu = null; }
    return !!cu;
  }
  return { play, stop, cuckoo };
})();
