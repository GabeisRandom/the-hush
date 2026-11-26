'use strict';
// The Mirror Lake's six time songs (DESIGN.md 18.10 "T2a"): each world's area, grotto and boss. Funky game music and lo-fi, never
// phonk or orchestral; none shares its meter, groove, tempo, bass or lead with another song in the game.
//   'lk_past', "Low Winter Shore" (the lake, long ago): a lo-fi bossa at 86 in F. A felt kick and rim clicks on the bossa clave,
//     a shaker, an upright bass on root and fifth, vibraphone chords, a breathy flute tune, drips from the reeds, a slow wave.
//   'lk_past_grot', "Frog Hollow" (the frogs' grotto): a croaky dorian funk at 102 in D. Kick and sidestick, bongos, a woodblock,
//     a slap bass riff, a clav on the off-beats, a muted-trumpet hook in the second half, cave drips.
//   'boss_lk_king', "Long Live the Frog King" (young and vain): a disco strut at 124 in B♭ mixolydian. Four on the floor, open
//     hats, claps, an octave disco bass, royal brass fanfares, a swaggering trumpet lead, a croak at the turn.
//   'lk_future', "Still Water" (the lake, tomorrow): lo-fi at 76 in E minor. A felt piano and a round bass over the crackle, sonar
//     pings, a slow wave, a foghorn while it's gray; as Remanso wakes (LK_FUT.k()) dub drums come in, then a flugelhorn tune.
//   'lk_future_grot', "Drowned Grotto": a slow 5/4 at 92 in C♯ minor. 808 booms, drips, a tremolo guitar, a dark pad, sonar, and
//     a harp phrase in the second half.
//   'boss_lk_toad', "Gray Predictions" (the Gray Toad): a heavy funk at 96 in G minor. A funk kick and rim cracks, a chopper bass
//     riff, organ stabs on the off-beats, a robot lead croaking its predictions, bongo croaks at the turns.
(() => {
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);

  // ---------------------------------------------------------------- 'lk_past': Low Winter Shore (lo-fi bossa)
  if (!has('lk_past')) {
    const CH = K.CH('F2: A3 C4 E4 G4, D2: F3 A3 C4 E4, G1: F3 A3 Bb3 D4, C2: E3 Bb3 D4 G4, Bb1: A3 D4 F4 C5, A1: G3 C#4 E4 B4, D2: F3 A3 C4 E4, C2: E3 Bb3 D4 A4');
    const TUNE = K.mel('r/4 C5/2 D5/2 E5/6 C5/2 | A4/8 r/4 G4/2 A4/2 | Bb4/4 A4/2 G4/2 F4/6 D4/2 | E4/12 r/4 | r/2 F5/2 E5/2 D5/2 C5/6 A4/2 | B4/4 C#5/4 E5/8 | D5/6 C5/2 A4/4 F4/4 | G4/10 r/6', 0);
    const CLAVE = [[0, 3, 6, 10, 12], [2, 6, 10, 13]];
    Sound.addSong('lk_past', { bpm: 86, len: 128, swing: 0.1, vol: 0.3, verb: 0.24, echo: 0.12, echoSteps: 3, tone: 6200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      K.crackle(t, s16, 0.9);
      // the bossa: a felt kick on one and the and-of-two, rim clicks on the clave, a shaker on the sixteenths, a brush swish
      if (st === 0 || st === 6 || st === 8 || st === 14) K.feltkick(t, st === 0 || st === 8 ? 0.8 : 0.5);
      if (CLAVE[bar & 1].includes(st)) K.rim(t, 0.55);
      K.shaker(t, st % 4 === 2 ? 0.7 : 0.35);
      if (st === 4 || st === 12) K.brush(t, 0.6, 0.14);
      // the upright: root, fifth, root, fifth
      if (st === 0 || st === 8) K.upright(ch[0], t, 0.85, s16 * 5);
      if (st === 6 || st === 14) K.upright(ch[0] + 7, t, 0.6, s16 * 2);
      // vibraphone chords, a lazy comp; the flute's tune
      if (st === 0 || st === 10) ch.slice(1).forEach((m, j) => K.vibe(m + 12, t + j * 0.012, s16 * (st === 0 ? 9 : 6), st === 0 ? 0.55 : 0.4));
      const n = TUNE[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.92, 'flute', 0.55);
      // the shore: drips from the reeds, a slow wave every four bars
      if (st === 11 && (bar & 1)) K.drip(ch[2] + 24, t, 0.5);
      if ((bar & 3) === 0 && st === 8) K.wave(t, s16 * 24, 0.6);
    } });
  }

  // ---------------------------------------------------------------- 'lk_past_grot': Frog Hollow (croaky dorian funk)
  if (!has('lk_past_grot')) {
    const CH = K.CH('D2: F3 A3 C4 E4, D2: F3 A3 C4 E4, G2: F3 A3 B3 E4, G2: F3 A3 B3 E4, D2: F3 A3 C4 E4, D2: F3 A3 C4 E4, A1: G3 C4 E4 G4, C2: E3 G3 Bb3 D4');
    const RIFF = { 0: 0, 3: 12, 6: 0, 8: 3, 10: 5, 13: 7, 14: 10 };
    const HOOK = K.mel('r/64 A4/2 C5/2 D5/4 r/2 F5/2 E5/2 D5/2 | C5/4 A4/4 r/8 | A4/2 C5/2 D5/2 E5/2 G5/4 F5/2 E5/2 | D5/8 r/8', 0);
    Sound.addSong('lk_past_grot', { bpm: 102, len: 128, swing: 0.1, vol: 0.34, verb: 0.2, echo: 0.14, echoSteps: 3, tone: 7000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      if (st === 0 || st === 6 || st === 10) K.kick(t, st === 0 ? 0.9 : 0.65);
      if (st === 4 || st === 12) K.sidestick(t, 0.85);
      // the frogs: bongos high and low, a woodblock, a low "croak" at each bar's end
      if (st === 2 || st === 7 || st === 11 || st === 14) K.bongo(t, 'hi', 0.6); else if (st === 3) K.bongo(t, 'tip', 0.5);
      if (st === 15) K.bongo(t, 'lo', bar & 1 ? 0.9 : 0.6);
      if (st % 4 === 1) K.woodblock(t, st === 9, 0.3);
      // the slap riff on the chord's root, the clav off the beat
      const off = RIFF[st]; if (off !== undefined) K.slap(ch[0] + off, t, st === 0 ? 0.95 : 0.7);
      if (st % 4 === 2) ch.slice(-2).forEach((m, j) => K.clav(m, t + j * 0.006, 0.45));
      // the muted trumpet's hook (bars five to eight), cave drips
      const n = HOOK[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.85, 'mute', 0.6);
      if (st === 5 && (bar & 1)) K.drip(ch[3] + 12, t, 0.6);
    } });
  }

  // ---------------------------------------------------------------- 'boss_lk_king': Long Live the Frog King (disco strut)
  if (!has('boss_lk_king')) {
    const CH = K.CH('Bb1: D3 F3 Ab3 C4, Bb1: D3 F3 Ab3 C4, Eb2: G3 Bb3 Db4 F4, Eb2: G3 Bb3 Db4 F4, Bb1: D3 F3 Ab3 C4, Ab1: C3 Eb3 G3 Bb3, F2: A3 C4 Eb4 G4, F2: A3 Eb4 G4 C5');
    const LEAD = K.mel('r/32 F5/2 F5/2 Bb5/4 Ab5/2 F5/2 Eb5/4 | F5/12 r/4 | F5/2 G5/2 Ab5/2 Bb5/2 C6/4 Bb5/4 | Ab5/2 G5/2 F5/4 Eb5/4 D5/4 | C5/2 D5/2 Eb5/2 F5/2 G5/4 Eb5/4 | F5/16', 0);
    Sound.addSong('boss_lk_king', { bpm: 124, len: 128, swing: 0.02, vol: 0.42, verb: 0.12, echo: 0.08, echoSteps: 3, tone: 8200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      // four on the floor, claps on two and four, hats (open on the off-beats), a low cowbell
      if (st % 4 === 0) K.kick(t, st === 0 ? 1 : 0.85);
      if (st === 4 || st === 12) K.claps(t, 0.8);
      if (st % 4 === 2) K.hat(t, 0.55, true); else K.hat(t, st % 2 ? 0.3 : 0.4);
      if (st === 3 || st === 11) K.cowbell(t, 0.35, true);
      // the octave disco bass
      if (st % 2 === 0) K.synbass(ch[0] + (st % 4 === 2 ? 12 : 0), t, s16 * 1.4, 0.85);
      // royal fanfares: the brass on even bars' downbeats and a stab at the turn
      if ((st === 0 && !(bar & 1)) || st === 14) K.polybrass(ch.slice(1).map(m => m + 12), t, s16 * (st === 0 ? 3 : 1.2), st === 0 ? 0.6 : 0.45);
      // the king's swagger (trumpet), a croak at the end of the loop
      const n = LEAD[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.88, 'tptlead', 0.55);
      if (bar === 7 && st === 12) { K.bongo(t, 'lo', 1); K.swell(t, s16 * 4, 0.5); }
    } });
  }

  // ---------------------------------------------------------------- 'lk_future': Still Water (lo-fi; it wakes as Remanso does)
  if (!has('lk_future')) {
    const CH = K.CH('E2: G3 B3 D4 F#4, C2: E3 G3 B3 D4, A1: G3 C4 E4 B4, B1: D#3 F#3 A3 C#4, E2: G3 B3 D4 F#4, C2: E3 G3 B3 D4, A1: G3 C4 E4 G4, B1: A3 D#4 F#4 B4');
    const TUNE = K.mel('B4/4 G4/2 A4/2 B4/4 D5/4 | E5/8 D5/4 B4/4 | C5/4 B4/2 A4/2 G4/4 E4/4 | F#4/12 r/4 | B4/4 G4/2 A4/2 B4/4 D5/4 | E5/6 F#5/2 G5/8 | F#5/4 E5/2 D5/2 B4/4 A4/4 | B4/12 r/4', 0);
    const kNow = () => { try { return typeof LK_FUT !== 'undefined' && LK_FUT ? LK_FUT.k() : 0.2; } catch (e) { return 0.2; } };
    Sound.addSong('lk_future', { bpm: 76, len: 128, swing: 0.16, vol: 0.3, verb: 0.28, echo: 0.16, echoSteps: 3, tone: 5200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7], k = kNow();
      K.crackle(t, s16, 1.1);
      // always: the felt piano, lazy on one and the and-of-three; the round bass; the lake's depth (sonar), a slow wave
      if (st === 0 || st === 9) ch.slice(1).forEach((m, j) => K.felt(m, t + j * 0.02, s16 * (st === 0 ? 8 : 6), st === 0 ? 0.6 : 0.45));
      if (st === 0) K.roundbass(ch[0], t, s16 * 6, 0.85); else if (st === 10) K.roundbass(ch[0] + 7, t, s16 * 4, 0.6);
      if (st === 0 && (bar & 3) === 0) K.sonar(ch[1] + 24, t, 0.5);
      if (st === 8 && (bar & 3) === 2) K.wave(t, s16 * 20, 0.5);
      // gray: a far foghorn, music-box glints
      if (k < 0.5) { if (bar === 0 && st === 0) K.foghorn(40, t, s16 * 24, 0.5); if (st % 6 === 3) K.celesta(ch[1 + (st % 4)] + 24, t, 0.35, 1.2); }
      // waking: the dub drums
      if (k > 0.4) {
        if (st === 0 || st === 7) K.dubkick(t, st === 0 ? 0.85 : 0.6);
        if (st === 8) K.rim(t, 0.7);
        if (st % 2 === 0) K.dubhat(t, st % 4 === 2 ? 0.6 : 0.35, st === 14);
      }
      // healed: the flugelhorn's tune
      if (k > 0.78) { const n = TUNE[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'flugel', 0.5); }
    } });
  }

  // ---------------------------------------------------------------- 'lk_future_grot': Drowned Grotto (5/4: 20 steps a bar)
  if (!has('lk_future_grot')) {
    const CH = K.CH('C#2: E3 G#3 B3 D#4, C#2: E3 G#3 B3 D#4, A1: E3 G#3 C#4 E4, A1: E3 G#3 C#4 E4, F#1: E3 A3 C#4 E4, F#1: E3 A3 C#4 E4, G#1: C4 D#4 F#4 G#4, G#1: C4 D#4 F#4 B4');
    const HARP = K.mel('r/80 G#4/4 B4/4 C#5/4 E5/8 | D#5/12 B4/8 | C#5/4 E5/4 G#5/8 F#5/4 | E5/16 r/4', 0);
    Sound.addSong('lk_future_grot', { bpm: 92, len: 160, swing: 0, vol: 0.34, verb: 0.3, echo: 0.2, echoSteps: 3, tone: 4200, play(i, t, s16) {
      const bar = Math.floor(i / 20), st = i % 20, ch = CH[bar & 7];
      // 808 booms (3 + 2), a muffled snare, drips
      if (st === 0 || st === 12) K.kick808(t, st === 0 ? 0.9 : 0.7, 0.6);
      if (st === 8 || st === 16) K.snare(t, 0.35);
      if (st % 4 === 2) K.dubhat(t, 0.3);
      if (st === 7 || (st === 17 && (bar & 1))) K.drip(ch[1 + (bar % 3)] + 24, t, 0.55);
      // the tremolo guitar's arpeggio, a dark pad, a sonar ping each bar
      if (st % 4 === 0) K.tremgtr(ch[1 + ((st >> 2) % 4)], t, s16 * 3.5, 0.5);
      if (st === 0) { K.darkpad(ch[0] + 12, t, s16 * 19, 0.4); K.sonar(ch[2] + 24, t, 0.35); }
      if (st === 0 || st === 12) K.sub808(ch[0], t, s16 * 6, 0.7);
      // the harp (bars five to eight)
      const n = HARP[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.9, 'harp', 0.55);
    } });
  }

  // ---------------------------------------------------------------- 'boss_lk_toad': Gray Predictions (heavy funk, G minor)
  if (!has('boss_lk_toad')) {
    const CH = K.CH('G1: Bb3 D4 F4, G1: Bb3 D4 F4, Eb2: G3 Bb3 D4, D2: F#3 A3 C4, G1: Bb3 D4 F4, C2: Eb3 G3 Bb3, Eb2: G3 Bb3 D4, D2: F#3 A3 C4 Eb4');
    const BASS = { 0: 0, 2: 12, 3: 0, 6: 3, 7: 5, 8: 0, 10: 10, 11: 12, 14: 7 };
    const ROBO = K.mel('r/64 G5/2 Bb5/2 A5/2 G5/2 F5/4 D5/4 | G5/8 r/8 | Bb5/2 C6/2 D6/4 C6/2 Bb5/2 A5/4 | G5/12 r/4', 0);
    Sound.addSong('boss_lk_toad', { bpm: 96, len: 128, swing: 0.06, vol: 0.44, verb: 0.12, echo: 0.1, echoSteps: 3, tone: 7000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      if (st === 0 || st === 3 || st === 8 || st === 10) K.funkkick(t, st === 0 ? 1 : 0.75);
      if (st === 4 || st === 12) K.rimcrack(t, 0.85);
      K.hat(t, st % 2 ? 0.25 : 0.4, st === 14);
      // the chopper bass riff, organ stabs on the off-beats
      const off = BASS[st]; if (off !== undefined) K.chopper(ch[0] + off, t, s16 * 1.3, 0.9, st === 2 || st === 11);
      if (st === 6 || st === 14) K.hammond(ch.slice(1).map(m => m + 12), t, s16 * 1.1, 0.5);
      // the toad's predictions (a robot lead), croaks at the turns
      const n = ROBO[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.85, 'robo', 0.5);
      if ((bar & 1) && (st === 7 || st === 15)) K.bongo(t, 'lo', 0.85);
    } });
  }
})();
