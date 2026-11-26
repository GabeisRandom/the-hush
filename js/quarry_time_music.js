'use strict';
// The Quarry Caves' time songs (DESIGN.md 18.10 "T2b"): each world's area, dungeon and boss, and the miners' song you help write
// long ago (sung by the camp, and whistled by Pío today). Never phonk or orchestral; none shares its meter, groove, tempo, bass or
// lead with another song in the game (today's camp is a 12/8 funk-blues shuffle with an anvil and a whistled tune).
//   'qr_past', "Every Day, Every Shift" (the camp long ago): lo-fi soul at 82 in E♭. A felt kick and brushes, crackle, an upright
//     bass walking, Rhodes chords pushed off the beat, a hummed choir pad (the miners), pick chinks on the off-eighths, and in the
//     second half the miners' tune on a recorder.
//   'qr_past_deep', "The Old Deep Gallery": a 6/8 groove at 102 in C♯ dorian. A dusty kick on the ones, a shaker, a fretless
//     ostinato, kalimba arpeggios, drips and sonar pings in the dark, a low warm pad.
//   'boss_qr_echo', "Grandma Echo's Call": swing funk at 134 in G minor. Slap bass, organ stabs, bongos and a cowbell, a trumpet
//     call answered a beat later, an octave up and softer, by a flute: the echo.
//   'qr_future', "Empty Camp": half-time lo-fi at 64 in B♭ minor. Kalimba over a dark pad and a fretless; as the camp wakes
//     (QR_FUT.k()) dusty drums come in, and once it's healed, a flugelhorn line.
//   'qr_future_deep', "Guessing in the Dark": 5/4 at 106 in F♯ minor. Clock ticks, sub pulses on the guesses, glass pings,
//     a tremolo guitar, a clank on every bar, a swirl every fourth.
//   'boss_qr_mole', "Whack the Gray Mole": a breakbeat at 146 in D minor. Kick and snare, a shovel scraping on the off-beats,
//     a chopper bass, brass stabs, a chiptune lead that pops up and ducks like the mole.
//   'qr_minersong' (a deck jingle): the miners' song, hummed by a choir with stomps and claps · 'qr_pio': Pío's whistle of it.
//   QRMUSIC.play(name, sec): a jingle on its own deck, the area's music dipped under it.
const QRMUSIC = (() => {
  const out = { play: () => false, stop: () => {} };
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return out;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);
  // the miners' tune (in D: transposed where it's quoted), 4 bars of 16 steps
  const TUNE_D = 'A4/2 A4/2 D5/4 C#5/2 B4/2 A4/4 | F#4/2 A4/2 B4/4 A4/4 F#4/4 | G4/2 G4/2 B4/4 A4/2 G4/2 F#4/4 | E4/4 F#4/2 E4/2 D4/8';

  // ---------------------------------------------------------------- 'qr_past': Every Day, Every Shift (lo-fi soul, 82)
  if (!has('qr_past')) {
    const CH = K.CH('Eb2: G3 Bb3 D4, C2: Eb3 G3 Bb3 D4, Ab1: G3 C4 Eb4, Bb1: Ab3 D4 G4, G1: F3 Bb3 D4, C2: Eb3 G3 Bb3, F1: Ab3 C4 Eb4 G4, Bb1: Ab3 C4 Eb4');
    const TUNE = K.mel('Bb4/2 Bb4/2 Eb5/4 D5/2 C5/2 Bb4/4 | G4/2 Bb4/2 C5/4 Bb4/4 G4/4 | Ab4/2 Ab4/2 C5/4 Bb4/2 Ab4/2 G4/4 | F4/4 G4/2 F4/2 Eb4/8', 128);
    K.mel('Bb4/2 Bb4/2 Eb5/4 D5/2 C5/2 Bb4/4 | G4/2 Bb4/2 C5/4 Bb4/4 G4/4 | Ab4/2 Ab4/2 C5/4 Bb4/2 Ab4/2 G4/4 | F4/4 G4/2 F4/2 Eb4/8', 192, TUNE);
    const WALK = [0, 4, 7, 9];
    Sound.addSong('qr_past', { bpm: 82, len: 256, swing: 0.16, vol: 0.3, verb: 0.2, echo: 0.1, echoSteps: 3, tone: 6200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      K.crackle(t, s16, 0.9);
      if (st === 0 || st === 10) K.feltkick(t, st === 0 ? 0.9 : 0.6);
      if (st === 4 || st === 12) K.brush(t, 0.9, 0.18); else if (st % 4 === 2) K.brush(t, 0.35, 0.07);
      // the pick chinks, off the eighths (the miners at work)
      if (st % 4 === 2 && (bar & 1)) K.clink(t, 0.5);
      // the walking upright
      if (st % 4 === 0) K.upright(ch[0] + WALK[(st >> 2) & 3] * (bar & 1 ? 1 : 0) + (st === 12 && !(bar & 1) ? 7 : 0), t, 0.85, s16 * 3.5);
      // Rhodes, pushed off the beat; the hummed choir on each bar
      if (st === 3 || st === 11) ch.slice(1).forEach((m, k) => K.epiano(m, t + k * 0.01, s16 * 3, 0.36, 0.7));
      if (st === 0) K.vox(ch[1] + 12, t, s16 * 14, 0.22, 'o', 'u');
      const n = TUNE[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.9, 'recorder', 0.6);
    } });
  }

  // ---------------------------------------------------------------- 'qr_past_deep': The Old Deep Gallery (6/8: 12 steps a bar)
  if (!has('qr_past_deep')) {
    const CH = K.CH('C#2: E3 G#3 B3 D#4, C#2: E3 G#3 B3 D#4, F#1: E3 A3 C#4 D#4, F#1: E3 A3 C#4 D#4, A1: G#3 C#4 E4, B1: A3 C#4 D#4 F#4, C#2: E3 G#3 B3 D#4, G#1: F#3 C4 D#4');
    const OST = { 0: 0, 3: 7, 5: 10, 6: 12, 9: 7, 11: 3 };
    Sound.addSong('qr_past_deep', { bpm: 102, len: 96, swing: 0, vol: 0.3, verb: 0.3, echo: 0.18, echoSteps: 3, tone: 5600, play(i, t, s16) {
      const bar = Math.floor(i / 12), st = i % 12, ch = CH[bar & 7];
      if (st === 0 || st === 6) K.dustkick(t, st === 0 ? 0.9 : 0.6);
      if (st === 3 || st === 9) K.dustsnare(t, 0.35);
      if (st % 2 === 1) K.shaker(t, 0.5);
      const o = OST[st]; if (o !== undefined) K.fretless(ch[0] + o, t, s16 * 2.2, 0.75);
      if (st % 3 === 0) K.kalimba(ch[1 + (st / 3) % (ch.length - 1)] + 12, t, 0.55, 0.9);     // (a three-note chord wraps round)
      if (Math.random() < 0.08) K.drip(84 + ((Math.random() * 8) | 0), t, 0.7);
      if (st === 0 && (bar & 1)) K.sonar(ch[0] + 36, t, 0.8);
      if (st === 0 && !(bar & 1)) K.warmpad(ch[0] + 12, t, s16 * 22, 0.3);
    } });
  }

  // ---------------------------------------------------------------- 'boss_qr_echo': Grandma Echo's Call (swing funk, 134)
  if (!has('boss_qr_echo')) {
    const CH = K.CH('G2: Bb3 D4 F4, G2: Bb3 D4 F4, C2: Eb3 G3 Bb3, D2: F#3 C4 Eb4, G2: Bb3 D4 F4, Eb2: G3 Db4 F4, A1: G3 C4 Eb4, D2: F#3 C4 Eb4');
    const CALL = K.mel('G5/2 Bb5/2 C6/4 r/8 | D6/2 C6/2 Bb5/4 r/8 | G5/2 F5/2 G5/4 r/8 | D5/2 F5/2 G5/4 r/8', 0);
    const SL = { 0: 0, 3: 0, 6: 12, 8: 0, 10: 10, 11: 12, 14: 7 };
    Sound.addSong('boss_qr_echo', { bpm: 134, len: 128, swing: 0.24, vol: 0.42, verb: 0.16, echo: 0.2, echoSteps: 4, tone: 8000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      if (st === 0 || st === 7 || st === 10) K.kick(t, st === 0 ? 1 : 0.7);
      if (st === 4 || st === 12) K.snare(t, 0.8);
      if (st % 2 === 0) K.hat(t, st % 4 === 2 ? 0.5 : 0.3);
      if (st % 2 === 1) K.bongo(t, st % 4 === 1 ? 'hi' : 'lo', 0.45);
      if (st === 6 || st === 14) K.cowbell(t, 0.5, st === 14);
      const o = SL[st]; if (o !== undefined) K.slap(ch[0] + o, t, st === 0 ? 1 : 0.75);
      if (st === 2 || st === 10) K.hammond(ch.slice(1), t, s16 * 1.4, 0.4);
      // the call, and its echo a beat later, an octave up, softer
      const n = CALL[(i % 64)]; if (n) K.lead(n[0] - 12, t, n[1] * s16 * 0.9, 'trumpet', 0.6);
      const e = CALL[((i - 4) % 64 + 64) % 64]; if (e) K.lead(e[0], t, e[1] * s16 * 0.8, 'flute', 0.35);
    } });
  }

  // ---------------------------------------------------------------- 'qr_future': Empty Camp (half-time lo-fi; the drums come back)
  if (!has('qr_future')) {
    const CH = K.CH('Bb1: Ab3 Db4 F4 C5, Gb1: F3 Bb3 Db4, Eb2: Gb3 Bb3 Db4 F4, F1: Eb3 Ab3 Bb3 C4, Bb1: Ab3 Db4 F4 C5, Gb1: F3 Bb3 Db4, Db2: F3 Ab3 C4, F1: Eb3 A3 C4');
    const KAL = K.mel('F5/4 Db5/4 C5/4 Ab4/4 | Bb4/8 Db5/4 F5/4 | Gb5/4 F5/4 Db5/4 Bb4/4 | C5/12 r/4', 0);
    const HORN = K.mel('r/8 F4/4 Ab4/4 | Bb4/6 Ab4/2 F4/8 | r/4 Db5/4 C5/2 Bb4/2 Ab4/4 | A4/12 r/4', 64);
    const kNow = () => { try { return typeof QR_FUT !== 'undefined' && QR_FUT ? QR_FUT.k() : 0.2; } catch (e) { return 0.2; } };
    Sound.addSong('qr_future', { bpm: 64, len: 128, swing: 0.14, vol: 0.3, verb: 0.28, echo: 0.16, echoSteps: 3, tone: 5200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7], k = kNow();
      K.crackle(t, s16, 1.1);
      if (st === 0) { ch.slice(1).forEach((m, j) => K.darkpad(m, t + j * 0.012, s16 * 15, 0.45)); K.fretless(ch[0], t, s16 * 7, 0.8); }
      if (st === 11) K.fretless(ch[0] + 7, t, s16 * 3, 0.5);
      const n = KAL[i % 64]; if (n) K.kalimba(n[0], t, 0.7, n[1] * s16 * 1.3);
      if (k > 0.4) {
        if (st === 0 || (st === 9 && (bar & 1))) K.dustkick(t, st === 0 ? 0.8 : 0.55);
        if (st === 8) K.dustsnare(t, 0.65);
        if (st % 2 === 0) K.dusthat(t, st % 4 === 2 ? 0.55 : 0.3);
      }
      if (k > 0.78) { const h = HORN[i]; if (h) K.lead(h[0], t, h[1] * s16 * 0.95, 'flugel', 0.5); if ((bar & 3) === 3 && st === 12) K.canary(95, 98, t, 6, 0.6); }
    } });
  }

  // ---------------------------------------------------------------- 'qr_future_deep': Guessing in the Dark (5/4: 20 steps a bar)
  if (!has('qr_future_deep')) {
    const CH = K.CH('F#1: A3 C#4 E4, D2: F#3 A3 C#4, B1: D4 F#4 A4, C#2: F3 G#3 B3');
    Sound.addSong('qr_future_deep', { bpm: 106, len: 160, swing: 0, vol: 0.32, verb: 0.24, echo: 0.14, echoSteps: 2, tone: 5800, play(i, t, s16) {
      const bar = Math.floor(i / 20), st = i % 20, ch = CH[bar & 3];
      if (st % 2 === 0) K.tick(t, st % 4 === 0, 0.45);
      if (st === 0) K.clank(t, 0.55);
      if (st === 0 || st === 12) K.sub808(ch[0] + 12, t, s16 * 3, 0.8);
      if (st === 8 || st === 16) K.dustsnare(t, 0.45);
      if (st === 6 || st === 14) K.glass(ch[1] + 24, t, 0.5, 1.2);
      if (st === 4) K.tremgtr(ch[1] + 12, t, s16 * 6, 0.35);
      if (st === 0) K.darkpad(ch[0] + 24, t, s16 * 19, 0.3);
      if ((bar & 3) === 3 && st === 16) K.swirl(t, s16 * 3, 0.3);
    } });
  }

  // ---------------------------------------------------------------- 'boss_qr_mole': Whack the Gray Mole (breakbeat, 146)
  if (!has('boss_qr_mole')) {
    const CH = K.CH('D2: F3 A3 C4, D2: F3 A3 C4, Bb1: D4 F4 A4, C2: E3 G3 Bb3, D2: F3 A3 C4, G1: F3 Bb3 D4, A1: E3 G3 C#4, A1: E3 G3 C#4');
    const POP = K.mel('D6/2 r/2 F6/2 r/2 A6/2 G6/2 F6/4 | E6/2 r/2 D6/2 r/2 C6/4 A5/4 | D6/2 F6/2 G6/2 A6/2 C7/2 A6/2 G6/4 | F6/2 E6/2 D6/4 r/8', 0);
    const CB = { 0: 0, 3: 0, 6: 12, 7: 10, 10: 0, 12: 3, 14: 5 };
    Sound.addSong('boss_qr_mole', { bpm: 146, len: 128, swing: 0.06, vol: 0.42, verb: 0.1, echo: 0.06, echoSteps: 3, tone: 8400, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      if (st === 0 || st === 6 || st === 10) K.kick(t, st === 0 ? 1 : 0.75);
      if (st === 4 || st === 12 || (st === 15 && (bar & 1))) K.snare(t, st === 15 ? 0.45 : 0.85);
      if (st % 2 === 1) K.hat(t, 0.35);
      if (st % 4 === 2) K.shovel(t, s16 * 0.9, 0.5);
      const o = CB[st]; if (o !== undefined) K.chopper(ch[0] + o, t, s16 * 1.2, st === 0 ? 0.9 : 0.7);
      if ((bar & 1) && (st === 8 || st === 14)) K.polybrass(ch.slice(1).map(m => m + 12), t, s16 * 1.1, 0.5);
      const n = POP[i % 64]; if (n) K.lead(n[0] - 12, t, n[1] * s16 * 0.8, 'chip', 0.5);
    } });
  }

  // ---------------------------------------------------------------- the miners' song (a jingle): a hummed choir, stomps, claps
  if (!has('qr_minersong')) {
    const TUNE = K.mel(TUNE_D, 0);
    const CH = K.CH('D2: F#3 A3 D4, G1: G3 B3 D4, G1: G3 B3 D4, A1: E3 A3 C#4');
    Sound.addSong('qr_minersong', { bpm: 96, len: 64, swing: 0.1, vol: 0.34, verb: 0.24, echo: 0.12, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3];
      if (st === 0 || st === 8) K.stomp(t, 0.8);
      if (st === 4 || st === 12) K.hclap(t, 0.6);
      if (st === 6 || st === 14) K.clink(t, 0.6);
      if (st === 0) K.upright(ch[0], t, 0.8, s16 * 7);
      const n = TUNE[i]; if (n) { K.vox(n[0] - 12, t, n[1] * s16 * 0.95, 0.5, 'a', 'o'); K.vox(n[0] - 24, t, n[1] * s16 * 0.95, 0.32, 'o', 'o'); }
    } });
  }
  // ---------------------------------------------------------------- Pío's whistle of it (a canary's trills on the tune)
  if (!has('qr_pio')) {
    const TUNE = K.mel(TUNE_D, 0);
    Sound.addSong('qr_pio', { bpm: 112, len: 64, swing: 0.08, vol: 0.32, verb: 0.2, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      const n = TUNE[i]; if (n) K.canary(n[0] + 24, n[0] + 26, t, Math.max(2, n[1]), 0.9, s16 / 2);
    } });
  }

  // ---------------------------------------------------------------- a jingle on its own deck, the area's music dipped under it
  let live = null, timer = 0;
  function stop() { try { if (live) live.stop(); } catch (e) { /* */ } live = null; clearTimeout(timer); try { Sound.duck('qr', 1); } catch (e) { /* */ } }
  function play(name, sec = 8) {
    if (name === 'qr_chorus') name = 'qr_minersong';
    if (!has(name) || !Sound.deck || !Sound.ctx || !Sound.out) return false;
    stop();
    try { live = Sound.deck(name, Sound.out, { loop: false }); } catch (e) { live = null; }
    if (!live) return false;
    try { Sound.duck('qr', 0.25, sec + 0.5); } catch (e) { /* */ }
    timer = setTimeout(stop, sec * 1000);
    return true;
  }
  return { play, stop, TUNE_D };
})();
