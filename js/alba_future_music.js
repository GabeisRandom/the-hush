'use strict';
// Alba tomorrow's two songs (Round T1b; ALBA_FUT_HALL.song() and ALBA_FUT_BOSS pick them):
//   'af_theater', "The House Lights Are Out": the old theater, tomorrow (its four rooms, before the Gallery is beaten). 84 bpm
//     lo-fi hip-hop, swung, in D minor (Dm9 · G13 · Cmaj9 · Fmaj9 · Bø · E7♭9 · Am9 · A7♭9): a dusty kick and a laid-back snare,
//     vinyl crackle, a Rhodes on the off-beats, a round bass that walks into each bar, and a breathy flute that answers itself
//     (bars 4–7, then 12–15). In bars 3 and 11 the masks get a word in: three little vibraphone «ha»s, falling. 16 bars (≈46 s).
//   'af_gallery', "The Laughing Gallery": the boss. 108 bpm acid-jazz funk in E dorian (Em9 · A13 · C9 · B7♯9): a punchy kick,
//     a cracking rimshot, sixteenth hats and a tambourine, a chopper bass in octaves, wah-guitar chops, and the hook: three brass
//     stabs falling a half step each, the Gallery laughing (bars 3, 7, 15). A sax answers in bars 4–7 and 12–15; bars 8–11 break
//     down to organ and the stabs. 16 bars (≈36 s).
// Neither phonk nor orchestral: a warm, dusty loop for the gray rooms; tense, bright funk for the fight.
(() => {
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);

  // ---------------------------------------------------------------- 'af_theater': the gray rooms
  if (!has('af_theater')) {
    const C = K.CH('D2: F3 A3 C4 E4, G1: F3 B3 E4, C2: E3 G3 B3 D4, F2: E3 A3 C4 G4, B1: A3 D4 F4, E2: G#3 D4 F4, A1: G3 C4 E4 B4, A1: G3 C#4 F4 Bb4');
    const FL = K.mel('r/2 A5/2 C6/2 D6/4 C6/2 A5/4 | F5/6 E5/2 D5/4 E5/4 | r/2 G5/2 B5/2 D6/4 E6/2 D6/4 | C6/8 A5/4 G5/4', 64);
    K.mel('r/2 F5/2 A5/2 D6/4 C6/2 A5/4 | G#5/6 F5/2 D5/4 B4/4 | r/2 C6/2 B5/2 A5/4 G5/2 E5/4 | C#6/8 A5/8', 192, FL);
    const HA = [84, 81, 77];          // the masks' «ha, ha, ha» (C6, A5, F5)
    Sound.addSong('af_theater', { bpm: 84, len: 256, swing: 0.22, vol: 0.4, verb: 0.24, echo: 0.16, echoSteps: 3, tone: 6400, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = C[bar & 7], intro = bar < 2, brk = bar === 8;
      // the drums: dusty, laid back; none in the intro, no kick in the breath at bar 8
      if (!intro) {
        if (!brk && (st === 0 || st === 10 || (st === 7 && bar % 2 === 1))) K.dustkick(t, st === 0 ? 1 : 0.75);
        if (st === 4 || st === 12) K.dustsnare(t, brk ? 0.5 : 0.9);
        if (st === 15 && bar % 2 === 1) K.rim(t, 0.35);
      }
      if (st % 2 === 0) K.dusthat(t, st % 4 === 2 ? 0.9 : 0.55);
      K.crackle(t, s16, 0.6);
      // the Rhodes: a chord on the one, a ghost before three, another on the and of three
      if (st === 0) K.epiano(ch[1], t, s16 * 5, 0.42), ch.slice(2).forEach(m => K.epiano(m, t + 0.012, s16 * 5, 0.36, 0.8));
      if (st === 10 && !intro) ch.slice(1).forEach(m => K.epiano(m + (m < 60 ? 12 : 0), t, s16 * 4, 0.3, 0.7));
      if (st === 7 && bar % 2 === 0 && !intro) K.epiano(ch[ch.length - 1], t, s16 * 1.5, 0.2, 0.6);
      // the bass: the root, its fifth, a walk into the next bar
      if (!intro) {
        if (st === 0) K.roundbass(ch[0], t, s16 * 3, 0.9);
        if (st === 6) K.roundbass(ch[0] + 7, t, s16 * 1.5, 0.6);
        if (st === 8 && !brk) K.roundbass(ch[0] + 12, t, s16 * 2, 0.55);
        if (st === 14) { const nx = C[(bar + 1) & 7][0]; K.roundbass(nx + (nx > ch[0] ? -1 : 1), t, s16 * 1.8, 0.6); }
      }
      // the flute's tune, and a soft swell under the turn
      const n = FL[i]; if (n) K.lead(n[0], t, Math.max(0.12, n[1] * s16 * 0.92), 'flute', 0.5);
      if (st === 0 && (bar === 7 || bar === 15)) K.swell(t, s16 * 16, 0.35);
      // the masks laugh (bars 3 and 11): three little vibraphone «ha»s, falling
      if ((bar === 3 || bar === 11) && st >= 12 && st <= 14) K.vibes(HA[st - 12], t, 0.9, 0.35);
    } });
  }

  // ---------------------------------------------------------------- 'af_gallery': the boss
  if (!has('af_gallery')) {
    const Em9 = 'E2: D3 G3 B3 F#4', A13 = 'A1: G3 C#4 F#4', C9 = 'C2: E3 Bb3 D4', B7 = 'B1: D#3 A3 D4';
    const C = K.CH([Em9, Em9, A13, A13, Em9, Em9, C9, B7, 'G1: F#3 B3 D4', 'F#1: E3 A3 C#4', Em9, B7, Em9, A13, C9, B7].join(','));
    const SAX = K.mel('E5/2 G5/2 A5/2 B5/4 D6/2 B5/2 A5/2 | G5/6 E5/2 r/8 | r/2 E5/2 G5/2 Bb5/4 A5/2 G5/4 | F#5/8 D#5/4 B4/4', 64);
    K.mel('B5/2 A5/2 G5/2 E5/2 D5/2 E5/2 G5/4 | F#5/6 E5/2 C#5/4 r/4 | D6/2 C6/2 Bb5/2 G5/2 E5/4 G5/4 | F#5/12 r/4', 192, SAX);
    const LAUGH = [[71, 74, 78], [70, 73, 77], [69, 72, 76]];          // three stabs, each a half step down: «ha… ha… ha»
    const BASS = [[0, 0, 2, 1], [3, 12, 1, 0.7, true], [6, 0, 1.5, 0.85], [7, 10, 1, 0.6], [10, 0, 1.5, 0.9], [11, 7, 1, 0.6], [14, 12, 1, 0.75, true]];
    Sound.addSong('af_gallery', { bpm: 108, len: 256, swing: 0.08, vol: 0.36, verb: 0.16, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = C[bar], brk = bar >= 8 && bar < 12, hook = bar === 3 || bar === 7 || bar === 15 || bar === 11;
      // the drums: punchy and tight; the break keeps only the rimshot and the tambourine
      if (!brk) {
        if (st === 0 || st === 6 || st === 10 || (st === 3 && bar % 2 === 1)) K.funkkick(t, st === 0 ? 1 : 0.78);
        K.hat(t, st % 4 === 2 ? 0.42 : st % 2 ? 0.16 : 0.28, st === 14 && bar % 2 === 1);
        if (st === 0 && (bar === 0 || bar === 12)) K.crash(t, 0.45);
      }
      if (st === 4 || st === 12) K.rimcrack(t, brk ? 0.6 : 0.9);
      if (st % 4 === 2) K.tamb(t, 0.5, st === 14);
      // the chopper bass, in octaves (out for the break's first half)
      if (!(brk && bar < 10)) for (const [s, iv, len, v, pop] of BASS) if (st === s) K.chopper(ch[0] + iv, t, s16 * len, v, !!pop);
      // the wah guitar: chops on the off-beats
      if (!brk && (st === 2 || st === 6 || st === 9 || st === 14)) K.wahgtr(ch.slice(1).map(m => m + 12), t, st === 9 ? 0.45 : 0.7, 0.12);
      // the organ in the break
      if (brk && st === 0) K.hammond(ch.slice(1).map(m => m + 12), t, s16 * 15, 0.5);
      // the Gallery laughs: three brass stabs, falling
      if (hook && (st === 8 || st === 10 || st === 12)) K.polybrass(LAUGH[(st - 8) / 2], t, s16 * 1.4, 0.75);
      if (!brk && !hook && st === 0 && bar % 2 === 0) K.polybrass(ch.slice(1).map(m => m + 12), t, s16 * 0.8, 0.45);
      // the sax answers
      const n = SAX[i]; if (n) K.lead(n[0], t, Math.max(0.1, n[1] * s16 * 0.9), 'sax', 0.62);
      if (bar === 11 && st === 0) K.swell(t, s16 * 16, 0.6);
    } });
  }
})();
