'use strict';
// The Past's two songs (past.js / past_scenes.js pick them: PAST.song()).
//   'past', "Yesterday's Plaza": 86 bpm, swung, F major. Nujabes-style lo-fi: a dusty kick and snare, brushed hats and vinyl
//     crackle under a felt piano that pushes its chords off the beat (B♭maj9 · Am9 · Gm9 · C13sus), an upright bass walking
//     round them, and a breathy flute tune; the middle part (Dm9 · G13 · Cmaj9 · A7♭9) trades the flute for vibes. 16 bars.
//   'past_fest', "Toda voz cuenta": 108 bpm, a hard shuffle, G major. The festival, as an old soul record (a lowpass on it, and
//     crackle): claps and a tambourine on two and four, a Hammond on the off-beats, a round bass bouncing in octaves, a horn
//     section's stabs, a trumpet hook in the second half, and a glockenspiel ringing the eight bells' carillon at every turn.
// Never phonk or orchestral; neither shares its groove, tempo, key, bass or lead with any other song in the game.
(() => {
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);

  // ---------------------------------------------------------------- 'past': Yesterday's Plaza
  if (!has('past')) {
    const A = K.CH('Bb1: D4 F4 A4 C5, A1: C4 E4 G4 B4, G1: Bb3 D4 F4 A4, C2: Bb3 D4 E4 A4');
    const B = K.CH('D2: F3 C4 E4 A4, G1: F3 B3 E4 A4, C2: E3 B3 D4 G4, A1: G3 C#4 F4 Bb4');
    const FLUTE = K.mel('r/8 A5/2 G5/2 F5/4 | D5/4 F5/2 A5/2 C6/6 r/2 | Bb5/2 A5/2 G5/4 F5/2 E5/2 | F5/12 r/4', 0);
    K.mel('r/8 C6/2 Bb5/2 A5/4 | G5/4 A5/2 Bb5/2 D6/6 r/2 | C6/2 Bb5/2 A5/4 G5/2 E5/2 | F5/16', 64, FLUTE);
    K.mel('r/8 A5/2 G5/2 F5/4 | D5/4 F5/2 A5/2 C6/6 r/2 | Bb5/2 A5/2 G5/4 F5/2 G5/2 | A5/8 G5/4 F5/4', 192, FLUTE);
    const VIB = [0, 2, 1, 3, 2, 1, 3, 0];
    Sound.addSong('past', { bpm: 86, len: 256, swing: 0.24, vol: 0.32, verb: 0.2, echo: 0.12, echoSteps: 3, tone: 7200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, b4 = bar & 3, mid = bar >= 8 && bar < 12, ch = (mid ? B : A)[b4], intro = bar < 1;
      // drums: soft and dusty; the snare waits out the first bar
      if (st === 0 || st === 10 || (st === 7 && b4 === 1) || (st === 13 && b4 === 3)) K.dustkick(t, st === 0 ? 0.95 : 0.6);
      if (!intro && (st === 4 || st === 12)) K.dustsnare(t, 0.72);
      if (st % 2 === 0) K.dusthat(t, st % 4 === 2 ? 0.75 : 0.4); else if (st === 15) K.dusthat(t, 0.3);
      if (st === 14 && b4 === 3 && !intro) K.rim(t, 0.5);
      K.crackle(t, s16, 0.9);
      // the upright: root, fifth, a walk back up to the next chord
      const r = ch[0];
      if (st === 0) K.upright(r, t, 1, s16 * 4);
      else if (st === 6) K.upright(r + 7, t, 0.75, s16 * 3);
      else if (st === 10) K.upright(r + 12, t, 0.7, s16 * 2);
      else if (st === 14) K.upright(((mid ? B : A)[(b4 + 1) & 3][0]) - 1, t, 0.6, s16 * 2);
      // the felt piano: the chord on the one, pushed again just before beat three
      if (st === 0 && !intro) ch.slice(1).forEach((m, k) => K.felt(m, t + k * 0.012, s16 * 6, 0.62));
      if (st === 7) ch.slice(1).forEach((m, k) => K.felt(m + (k === 3 ? 0 : 12) - 12, t + k * 0.01, s16 * 5, 0.46));
      if (intro && st === 0) ch.slice(1).forEach((m, k) => K.felt(m, t + k * 0.05, s16 * 14, 0.7));
      // the flute (A parts), the vibes (the middle)
      if (!mid) { const n = FLUTE[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'flute', 0.72); }
      else if (st % 2 === 0) { const tones = ch.slice(1), m = tones[VIB[(st >> 1) % 8] % tones.length] + 12; K.vibes(m, t, st % 4 === 0 ? 0.9 : 0.55, s16 * 3); }
      if (bar === 15 && st === 8) K.swirl(t, s16 * 8, 0.35);
    } });
  }

  // ---------------------------------------------------------------- 'past_fest': Toda voz cuenta (the Festival of Voices)
  if (!has('past_fest')) {
    const A = K.CH('G2: B3 D4 G4, E2: B3 E4 G4, C2: C4 E4 G4, D2: A3 D4 F#4');
    const B = K.CH('C2: C4 E4 G4, D2: A3 D4 F#4, B1: B3 D#4 F#4, E2: B3 E4 G4');
    const TURN = K.CH('A1: C#4 E4 G4, D2: C4 D4 F#4');
    // the carillon: the eight bells of the valley, one after another
    const BELLS = K.mel('G6/2 B6/2 D7/2 G6/2 D7/2 B6/2 G6/2 D6/2', 0);
    const HOOK = K.mel('D5/2 E5/2 G5/4 A5/2 B5/2 | A5/2 G5/2 E5/4 D5/8 | G5/2 A5/2 B5/4 D6/2 B5/2 | A5/2 G5/2 A5/12', 128);
    K.mel('D5/2 E5/2 G5/4 A5/2 B5/2 | A5/2 G5/2 E5/4 D5/8 | E5/2 G5/2 A5/4 B5/2 A5/2 | G5/16', 192, HOOK);
    Sound.addSong('past_fest', { bpm: 108, len: 256, swing: 0.32, vol: 0.34, verb: 0.12, echo: 0.06, echoSteps: 3, tone: 5200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, b4 = bar & 3, half = bar >= 8, turn = bar === 7 || bar === 15;
      const ch = turn && st >= 8 ? TURN[1] : turn ? TURN[0] : (half && bar < 12 ? B : A)[b4];
      // drums: a shuffle (kick on one and the and of three), claps and a tambourine on two and four
      if (st === 0 || st === 10 || (st === 3 && b4 === 2)) K.kick(t, st === 0 ? 0.9 : 0.7);
      if (st === 4 || st === 12) { K.claps(t, 0.8); K.tamb(t, 0.8, true); }
      else if (st % 2 === 0) K.tamb(t, 0.35);
      if (st % 4 === 2) K.hat(t, 0.5);
      K.crackle(t, s16, 0.7);
      // the round bass, in octaves
      const r = ch[0];
      if (st === 0) K.roundbass(r, t, s16 * 1.6, 1);
      else if (st === 3) K.roundbass(r + 12, t, s16 * 1.2, 0.7);
      else if (st === 6) K.roundbass(r + 7, t, s16 * 1.6, 0.85);
      else if (st === 8) K.roundbass(r, t, s16 * 1.6, 0.9);
      else if (st === 11) K.roundbass(r + 12, t, s16 * 1.2, 0.7);
      else if (st === 14) K.roundbass(r + 10, t, s16 * 1.2, 0.75);
      // the Hammond on the off-beats; the horns' stabs (the and of two, and four)
      if (st % 4 === 2 && bar >= 1) K.hammond(ch.slice(1), t, s16 * 1.4, 0.55);
      if ((st === 6 || st === 14) && bar >= 2) K.brass(ch.slice(1).map(m => m + 12), t, s16 * (st === 14 ? 1.6 : 0.9), 0.55, 1.1);
      // the trumpet hook (the second half); the carillon at the top of every four bars and on the turns
      const n = HOOK[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'trumpet', 0.7);
      if ((b4 === 0 && st < 16 && bar % 8 === 0) || (turn && st >= 0)) { const bn = BELLS[st]; if (bn) K.glock(bn[0], t, 0.85); }
      if (bar === 0 && st === 0) K.bell(67, t, 0.5);
    } });
  }
})();
