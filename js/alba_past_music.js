'use strict';
// Alba long ago, after Chapter 2: three songs of its own (alba_past_stage.js plays them: APSTAGE.song()).
//   'ap_under', «Under the Stage»: the dungeon under the old theater. A dusty lo-fi WALTZ (3/4) at 84, A minor: a music box
//     plays the concert's tune half-remembered (Am9 · Fmaj7 · Dm9 · E7♭9), pizzicato bass on the one, brushes on two and three,
//     a muted trumpet answering in the middle part, and an old pocket watch ticking at every fourth bar. 16 bars.
//   'ap_prompter', «The Prompter's Box»: the boss. Whisper funk at 116, D minor (Dm7 · B♭maj7 · Gm7 · A7♯9): a syncopated
//     wah bass, a clav on the sixteenths' off-beats, a gated snare with ghost rims, a «shhh» swell every two bars, a tick-tock
//     woodblock (Aurora's stopped watch), horn stabs on the turnarounds and a breathy wind-synth hook. 16 bars.
//   'ap_then', «Kitchen Radio»: the bakery and the schoolroom of then. A lo-fi bossa at 104, G major (Gmaj7 · Em9 · Am9 · D13):
//     a rim click on the 3-2 clave, a shaker, a fretless bass on one and the and of two, nylon plucks comping off the beat, a
//     melodica tune and vibes in the middle, and a little radio crackle. 16 bars.
// Never phonk or orchestral; none of them shares its meter or groove, tempo, key, bass or lead with any other song in the game.
(() => {
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);

  // ---------------------------------------------------------------- 'ap_under': Under the Stage (3/4: 12 steps a bar)
  if (!has('ap_under')) {
    const A = K.CH('A1: G3 B3 C4 E4, F1: E3 A3 C4 E4, D2: F3 A3 C4 E4, E1: G#3 B3 D4 F4');
    const B = K.CH('C2: E3 G3 B3 D4, G1: E3 G3 B3 D4, F1: E3 A3 C4 E4, E1: G#3 B3 D4 F4');
    const BOX = K.mel('E5/3 A5/3 C6/6 | B5/3 A5/3 E5/6 | F5/3 A5/3 D6/4 C6/2 | B5/6 G#5/6 | E5/3 A5/3 C6/3 E6/3 | D6/4 C6/2 A5/6 | F5/3 E5/3 D5/3 F5/3 | E5/12', 0);
    K.mel('E5/3 A5/3 C6/6 | B5/3 A5/3 E5/6 | F5/3 E5/3 D5/3 B4/3 | A4/12', 144, BOX);
    const MUTE = K.mel('G5/4 E5/2 C5/6 | D5/4 E5/2 G5/6 | A5/4 G5/2 F5/3 E5/3 | D5/6 G#4/6', 96);
    Sound.addSong('ap_under', { bpm: 84, len: 192, swing: 0.1, vol: 0.5, verb: 0.24, echo: 0.14, echoSteps: 3, tone: 5600, play(i, t, s16) {
      const bar = Math.floor(i / 12), st = i % 12, b4 = bar & 3, mid = bar >= 8 && bar < 12, ch = (mid ? B : A)[b4];
      // brushes on two and three, a soft dusty kick on the one; the watch ticks at every fourth bar
      if (st === 0) K.dustkick(t, bar ? 0.55 : 0.35);
      if (st === 4 || st === 8) K.brush(t, st === 4 ? 0.7 : 0.55, 0.22);
      if (st === 10) K.brush(t, 0.3, 0.12);
      if (b4 === 3 && st % 4 === 0) K.tick(t, st === 0, 0.35);
      K.crackle(t, s16, 1.1);
      // the pizzicato bass: the root on one, the fifth on three
      if (st === 0) K.pizz(ch[0], t, 1, s16 * 5);
      if (st === 8) K.pizz(ch[0] + 7, t, 0.6, s16 * 3);
      // the harp: the chord rolled on the one, a softer echo of it on three
      if (st === 0 && bar > 0) K.harpchord(ch.slice(1), t, s16 * 10, 0.5);
      if (st === 8 && !mid) K.harpchord(ch.slice(2).map(m => m + 12), t, s16 * 4, 0.22);
      if (bar === 0 && st === 0) K.harpchord(ch.slice(1), t, s16 * 12, 0.7);
      // the music box (the A parts), the muted trumpet (the middle)
      if (!mid) { const n = BOX[i]; if (n) K.mbox(n[0], t, 0.8, 0, n[1] * s16 * 1.1); }
      else { const n = MUTE[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.92, 'mute', 0.62); }
      if (bar === 15 && st === 6) K.swirl(t, s16 * 6, 0.25);
    } });
  }

  // ---------------------------------------------------------------- 'ap_prompter': The Prompter's Box (the boss)
  if (!has('ap_prompter')) {
    const A = K.CH('D2: C4 F4 A4, D2: C4 F4 A4, Bb1: D4 F4 A4, A1: C#4 G4 C5');
    const A2 = K.CH('D2: C4 F4 A4, D2: C4 F4 A4, G1: Bb3 D4 F4, A1: C#4 G4 C5');
    const B = K.CH('G1: Bb3 D4 F4, G1: Bb3 D4 F4, Bb1: D4 F4 A4, A1: C#4 G4 C5');
    const HOOK = K.mel('D5/2 F5/2 G5/2 A5/4 r/2 C6/2 | A5/2 G5/2 F5/4 D5/4 r/4 | D5/2 F5/2 G5/2 A5/2 C6/2 D6/4 r/2 | C#6/4 A5/4 E5/8', 64);
    K.mel('D5/2 F5/2 G5/2 A5/4 r/2 C6/2 | A5/2 G5/2 F5/4 D5/4 r/4 | F5/2 G5/2 A5/2 C6/2 D6/2 F6/4 r/2 | E6/4 C#6/4 A5/8', 192, HOOK);
    const BASS = [[0, 0, 2.2], [3, 12, 1], [6, 0, 1.6], [8, 10, 1.4], [10, 0, 1.2], [11, 7, 0.9], [14, 12, 1.2]];
    Sound.addSong('ap_prompter', { bpm: 116, len: 256, swing: 0.08, vol: 0.34, verb: 0.1, echo: 0.08, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, b4 = bar & 3, mid = bar >= 8 && bar < 12, ch = (mid ? B : bar & 4 ? A2 : A)[b4], turn = b4 === 3;
      // drums: a syncopated kick, a gated snare on two and four, ghost rims, sixteenth hats leaning on the off-beats
      if (st === 0 || st === 6 || st === 10 || (st === 15 && turn)) K.funkkick(t, st === 0 ? 1 : 0.75);
      if (st === 4 || st === 12) K.gatesnare(t, 0.85);
      if (st === 7 || st === 13) K.rim(t, 0.28);
      K.hat(t, st % 2 ? 0.4 : 0.22, st === 14 && turn);
      // Aurora's stopped watch: tick… tock…
      if (st === 0 || st === 8) K.woodblock(t, st === 0, 0.35);
      // the «shhh»: a breathy swell into every other bar
      if (st === 12 && bar % 2 === 1) K.swirl(t, s16 * 4, 0.45);
      // the wah bass
      for (const [s, iv, len] of BASS) if (st === s) K.wahbass(ch[0] + iv, t, s16 * len, s ? 0.8 : 1);
      // the clav on the sixteenths' off-beats
      if (st === 2 || st === 5 || st === 9 || st === 13) ch.slice(1).forEach((m, k) => K.clav(m + (st === 9 ? 12 : 0), t + k * 0.004, st === 2 ? 0.7 : 0.5));
      // horn stabs on the turnarounds
      if (turn && (st === 10 || st === 14)) K.brass(ch.slice(1).map(m => m + 12), t, s16 * (st === 14 ? 1.8 : 0.8), 0.6, 1.1);
      // the wind-synth hook (the second and fourth quarters), a dark pad under the middle
      const n = HOOK[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.92, 'ewi', 0.72);
      if (mid && st === 0) K.darkpad(ch[0] + 24, t, s16 * 15, 0.5);
    } });
  }

  // ---------------------------------------------------------------- 'ap_then': Kitchen Radio (the interiors of then)
  if (!has('ap_then')) {
    const A = K.CH('G1: B3 D4 F#4, E2: G3 B3 D4 F#4, A1: G3 B3 C4 E4, D2: C4 F#4 B4');
    const B = K.CH('C2: E4 G4 B4, B1: D#4 F#4 A4, E2: G3 B3 D4, D2: C4 F#4 A4');
    const TUNE = K.mel('r/4 B4/2 D5/2 F#5/4 E5/4 | D5/6 B4/2 A4/8 | r/4 C5/2 E5/2 G5/4 F#5/2 E5/2 | F#5/16', 0);
    K.mel('r/4 B4/2 D5/2 F#5/4 A5/4 | G5/6 E5/2 D5/8 | r/4 C5/2 E5/2 A5/4 G5/2 F#5/2 | G5/16', 64, TUNE);
    K.mel('r/4 B4/2 D5/2 F#5/4 E5/4 | D5/6 B4/2 A4/8 | r/4 C5/2 E5/2 G5/4 F#5/2 A5/2 | G5/16', 192, TUNE);
    const CLAVE = [[0, 6, 12], [4, 10]];
    const VIB = [0, 2, 1, 3, 1, 2, 0, 3];
    Sound.addSong('ap_then', { bpm: 104, len: 256, swing: 0.04, vol: 0.3, verb: 0.16, echo: 0.1, echoSteps: 3, tone: 6400, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, b4 = bar & 3, mid = bar >= 8 && bar < 12, ch = (mid ? B : A)[b4];
      // the bossa: a soft kick, the rim on the 3-2 clave, a shaker in eighths
      if (st === 0 || st === 8) K.dustkick(t, 0.5);
      if (st === 6 || st === 14) K.dustkick(t, 0.28);
      if (CLAVE[bar & 1].includes(st)) K.rim(t, 0.55);
      if (st % 2 === 0) K.shaker(t, st % 4 === 0 ? 0.5 : 0.3);
      K.crackle(t, s16, 0.55);
      // the fretless bass: one, the and of two, three, the and of four
      if (st === 0) K.fretless(ch[0], t, s16 * 5, 0.9);
      if (st === 6) K.fretless(ch[0] + 7, t, s16 * 2, 0.7);
      if (st === 8) K.fretless(ch[0], t, s16 * 5, 0.8);
      if (st === 14) K.fretless(ch[0] + 7, t, s16 * 2, 0.6);
      // nylon plucks comping off the beat
      if (st === 0 || st === 3 || st === 6 || st === 10 || st === 12) ch.slice(1).forEach((m, k) => K.pluck(m, t + k * 0.012, st === 0 ? 0.55 : 0.38));
      // the melodica (the A parts), vibes in the middle
      if (!mid) { const n = TUNE[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'melodica', 0.62); }
      else if (st % 2 === 0) { const tones = ch.slice(1), m = tones[VIB[(st >> 1) % 8] % tones.length] + 12; K.vibes(m, t, st % 4 === 0 ? 0.8 : 0.5, s16 * 3); }
    } });
  }
})();
