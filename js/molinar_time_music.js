'use strict';
// Molinar's six time songs (DESIGN.md 18.6 "T1c"): each world's area, dungeon and boss. Never phonk or orchestral; none shares its
// meter, groove, tempo, bass or lead with another song in the game.
//   'mol_past', "Flour and Sunlight" (Molinar, long ago): a lo-fi waltz in 3/4 at 98, D major. Brushes and a soft felt kick on the
//     one, crackle, a plucked (pizzicato) bass on the downbeats, an e-piano's two soft chords on beats two and three, a breathy
//     melodica tune, celesta glints at the turns. Dmaj7 · Bm7 · Em9 · A7sus, then Gmaj7 · F♯m7 · Em7 · A13 (a borrowed Gm6).
//   'mol_past_mill', "Raise the Sails" (the Great Mill being built): a work-song funk at 104, G mixolydian. The builders' hammer is
//     the backbeat (an anvil on two and four), a saw scrapes, woodblock sixteenths, a slap bass riff, a clav comping off the beat,
//     horn stabs, and a whistled hook in the second half.
//   'boss_mol_armadillo', "Roly-Poly Rumble" (the first armadillo): a silly cartoon swing at 150, F major. Tuba oom-pah, bongos and
//     a cowbell, claps on two and four, a slide-whistle lead tumbling up and down, a «bo-bom!» vox at the turns.
//   'mol_future', "Still Sails" (Molinar, tomorrow): Nujabes-style lo-fi at 72 in A minor, half-time. A music box over a dark pad and
//     a fretless bass; as the town wakes (MOL_FUT.k()), the dusty drums come in, and once it's healed, a soft sax line.
//   'mol_future_mill', "Clogged Gears" (the silent Great Mill): a limping 7/8 at 112, E minor. Clock ticks, a dragging chain, metal
//     clanks on the bar, a wah bass that stumbles, short stabs, a low drone.
//   'boss_mol_miller', "The Gray Miller Grinds": a dark funk at 138, E phrygian. Tight kick and snare, a chicken-scratch wah guitar,
//     a synth bass in E with the flat second, gray brass stabs, a moog lead, and the millstone grinding on the off-beats.
(() => {
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);

  // ---------------------------------------------------------------- 'mol_past': Flour and Sunlight (3/4: 12 steps a bar)
  if (!has('mol_past')) {
    const A = K.CH('D2: F#3 A3 C#4 E4, B1: D3 F#3 A3 C#4, E2: G3 B3 D4 F#4, A1: D3 E3 G3 B3, D2: F#3 A3 C#4 E4, F#2: E3 A3 C#4 E4, G1: F#3 B3 D4 A4, A1: C#3 E3 G3 B3');
    const B = K.CH('G1: F#3 B3 D4 A4, F#2: E3 A3 C#4 E4, E2: D3 G3 B3 D4, A1: C#3 G3 B3 F#4, B1: D3 F#3 A3 C#4, E2: G3 B3 D4 F#4, G1: Bb3 D4 E4 G4, A1: D3 E3 G3 B3');
    const TUNE = K.mel('A4/4 F#4/2 A4/2 D5/4 | C#5/6 B4/2 A4/4 | G4/4 B4/4 F#5/4 | E5/8 r/4 | A4/4 F#4/2 A4/2 D5/4 | E5/6 C#5/2 A4/4 | B4/4 D5/4 F#5/4 | E5/10 r/2', 0);
    K.mel('D5/4 B4/4 G4/4 | A4/6 C#5/2 E5/4 | G5/4 F#5/2 E5/2 D5/4 | C#5/8 B4/2 A4/2 | F#4/4 B4/4 D5/4 | F#5/6 E5/2 B4/4 | Bb4/4 D5/4 E5/4 | A4/10 r/2', 96, TUNE);
    Sound.addSong('mol_past', { bpm: 98, len: 192, swing: 0.12, vol: 0.3, verb: 0.22, echo: 0.1, echoSteps: 3, tone: 6800, play(i, t, s16) {
      const bar = Math.floor(i / 12), st = i % 12, b8 = bar & 7, ch = (bar >= 8 ? B : A)[b8], intro = bar < 1;
      // the waltz: a felt kick on the one, brushes on two and three, a ghost brush between
      if (st === 0) K.feltkick(t, b8 === 0 ? 0.9 : 0.7);
      if (st === 4 || st === 8) K.brush(t, st === 4 ? 0.9 : 0.75, 0.16); else if (st === 10) K.brush(t, 0.35, 0.08);
      K.crackle(t, s16, 0.8);
      // the plucked bass: the root on the one, a fifth or a passing note before the next bar
      if (st === 0) K.pizz(ch[0], t, 0.95, s16 * 4);
      if (st === 8 && (bar & 1)) K.pizz(ch[0] + 7, t, 0.6, s16 * 3);
      // the e-piano: two soft chords, on two and three
      if ((st === 4 || st === 8) && !intro) ch.slice(1).forEach((m, k) => K.epiano(m, t + k * 0.008, s16 * 3.2, st === 4 ? 0.42 : 0.34, 0.7));
      if (intro && st === 0) ch.slice(1).forEach((m, k) => K.epiano(m, t + k * 0.04, s16 * 11, 0.5, 0.6));
      // the melodica's tune (after the first bar), and celesta glints at every fourth bar's turn
      if (!intro) { const n = TUNE[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.92, 'melodica', 0.66); }
      if ((b8 === 3 || b8 === 7) && st >= 6 && st % 2 === 0) K.celesta(ch[1 + ((st >> 1) % 4)] + 24, t, 0.5, 0.8);
    } });
  }

  // ---------------------------------------------------------------- 'mol_past_mill': Raise the Sails (work-song funk)
  if (!has('mol_past_mill')) {
    const CH = K.CH('G2: B3 D4 F4, G2: B3 D4 F4, C3: E3 Bb3 D4, C3: E3 Bb3 D4, G2: B3 D4 F4, G2: B3 D4 F4, D2: F#3 C4 F4, C3: E3 Bb3 D4');
    const RIFF = { 0: 0, 3: 0, 6: 3, 8: 5, 10: 0, 13: -2, 14: 0 };
    const HOOK = K.mel('r/64 D5/2 F5/2 G5/4 F5/2 D5/2 | C5/4 D5/4 r/8 | D5/2 F5/2 G5/2 A5/2 Bb5/4 A5/2 G5/2 | F5/4 D5/8 r/4', 0);
    Sound.addSong('mol_past_mill', { bpm: 104, len: 128, swing: 0.08, vol: 0.34, verb: 0.12, echo: 0.06, echoSteps: 3, tone: 7600, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      // the builders' rhythm: kick, the hammer on the backbeat, woodblock sixteenths, a saw stroke every other bar
      if (st === 0 || st === 7 || st === 10) K.kick(t, st === 0 ? 0.95 : 0.7);
      if (st === 4 || st === 12) { K.anvil(t, 0.55, 1240); K.sidestick(t, 0.8); }
      if (st % 2 === 1) K.woodblock(t, st % 4 === 1, 0.35);
      if (st === 14 && (bar & 1)) K.board(t, 0.8, 0.12);
      if (st % 4 === 2) K.hat(t, 0.45);
      // the slap bass riff on the chord's root
      const off = RIFF[st]; if (off !== undefined) K.slap(ch[0] + off, t, st === 0 ? 1 : 0.75);
      // the clav off the beat, horn stabs at the end of every second bar
      if (st === 2 || st === 7 || st === 11 || st === 15) ch.slice(1).forEach((m, k) => K.clav(m, t + k * 0.004, 0.5));
      if ((bar & 1) && st === 12) K.brass(ch.slice(1).map(m => m + 12), t, s16 * 1.4, 0.55, 1.0);
      // the whistled hook, second half
      const n = HOOK[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.9, 'whistle', 0.55);
    } });
  }

  // ---------------------------------------------------------------- 'boss_mol_armadillo': Roly-Poly Rumble (cartoon swing)
  if (!has('boss_mol_armadillo')) {
    const CH = K.CH('F2: A3 C4 F4, F2: A3 C4 F4, Bb1: D4 F4 Bb4, C2: E4 G4 Bb4, F2: A3 C4 F4, D2: F#3 C4 D4, G1: Bb3 D4 F4, C2: E4 G4 Bb4');
    const TUNE = K.mel('F5/2 A5/2 C6/2 A5/2 F5/2 r/2 C5/4 | D5/2 F5/2 Bb5/4 A5/2 G5/2 E5/4 | F5/2 A5/2 C6/2 F6/2 E6/2 D6/2 C6/4 | Bb5/2 A5/2 G5/2 E5/2 C5/8', 0);
    K.mel('C6/2 A5/2 F5/2 A5/2 C6/2 r/2 F6/4 | D6/2 C6/2 Bb5/4 G5/4 E5/4 | F5/2 G5/2 A5/2 Bb5/2 C6/2 D6/2 E6/4 | F6/4 C6/4 F5/8', 64, TUNE);
    Sound.addSong('boss_mol_armadillo', { bpm: 150, len: 128, swing: 0.3, vol: 0.42, verb: 0.1, echo: 0.05, echoSteps: 3, tone: 8200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      // the oom-pah: the tuba's root on one and three, the fifth between; claps on two and four
      if (st === 0 || st === 8) K.tub(ch[0], t, s16 * 2.4, 0.95);
      if (st === 4 || st === 12) { K.tub(ch[0] + 7, t, s16 * 1.6, 0.7); K.claps(t, 0.7); }
      if (st === 0) K.kick(t, 0.85);
      // bongos and a cowbell, tumbling
      if (st % 2 === 1) K.bongo(t, st % 4 === 1 ? 'hi' : 'lo', 0.55);
      if (st === 6 || st === 14) K.cowbell(t, 0.55, st === 14);
      if (st % 4 === 2) K.hat(t, 0.35);
      // the e-piano's chord off the beat, a «bo-bom!» at the turn of every four bars
      if (st === 4 || st === 12) ch.slice(1).forEach(m => K.keys(m, t, s16 * 1.2, 0.35));
      if ((bar & 3) === 3 && (st === 12 || st === 14)) K.vox(ch[0] + 24 - (st === 14 ? 5 : 0), t, s16 * 1.6, 0.6, 'o', 'o');
      const n = TUNE[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.85, 'whistle', 0.62);
    } });
  }

  // ---------------------------------------------------------------- 'mol_future': Still Sails (lo-fi; the drums come back as the town wakes)
  if (!has('mol_future')) {
    const CH = K.CH('A1: G3 C4 E4 B4, F1: E3 A3 C4 G4, D2: F3 A3 C4 E4, E1: D3 G#3 B3 E4, A1: G3 C4 E4 B4, F1: E3 A3 C4 G4, G1: F3 A3 C4 D4, E1: D3 G#3 B3 F4');
    const BOX = K.mel('E5/4 C5/4 B4/4 A4/4 | C5/8 B4/4 G4/4 | A4/4 C5/4 E5/4 D5/4 | B4/12 r/4 | E5/4 C5/4 B4/4 A4/4 | C5/8 E5/4 G5/4 | F5/4 E5/4 D5/4 B4/4 | A4/12 r/4', 0);
    const SAX = K.mel('r/8 E5/4 G5/4 | A5/6 G5/2 E5/8 | r/4 D5/4 E5/2 G5/2 A5/4 | G#5/12 r/4 | r/8 E5/4 G5/4 | C6/6 B5/2 A5/8 | r/4 G5/4 A5/2 B5/2 C6/4 | A5/12 r/4', 0);
    const kNow = () => { try { return typeof MOL_FUT !== 'undefined' && MOL_FUT ? MOL_FUT.k() : 0.2; } catch (e) { return 0.2; } };
    Sound.addSong('mol_future', { bpm: 72, len: 128, swing: 0.18, vol: 0.3, verb: 0.26, echo: 0.14, echoSteps: 3, tone: 5600, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7], k = kNow();
      K.crackle(t, s16, 1.0);
      // the dark pad and the fretless, always; the music box's tune over them
      if (st === 0) { ch.slice(1).forEach((m, j) => K.darkpad(m, t + j * 0.01, s16 * 15, 0.5)); K.fretless(ch[0], t, s16 * 6, 0.85); }
      if (st === 10) K.fretless(ch[0] + (bar & 1 ? 7 : 12), t, s16 * 4, 0.55);
      const n = BOX[i]; if (n) K.mbox(n[0] + 12, t, 0.75, 0, n[1] * s16 * 1.4);
      // as the town wakes: the dusty half-time drums
      if (k > 0.4) {
        if (st === 0 || st === 7 || (st === 10 && (bar & 1))) K.dustkick(t, st === 0 ? 0.85 : 0.6);
        if (st === 8) K.dustsnare(t, 0.7);
        if (st % 2 === 0) K.dusthat(t, st % 4 === 2 ? 0.6 : 0.35);
      }
      // healed: a soft sax answers the music box
      if (k > 0.78) { const s = SAX[i]; if (s) K.lead(s[0] - 12, t, s[1] * s16 * 0.95, 'sax', 0.5); }
    } });
  }

  // ---------------------------------------------------------------- 'mol_future_mill': Clogged Gears (7/8: 14 steps a bar)
  if (!has('mol_future_mill')) {
    const CH = K.CH('E2: G3 B3 D4 F#4, C2: E3 G3 B3 D4, A1: C3 E3 G3 B3, B1: D#3 F#3 A3 C4');
    const WAH = { 0: 0, 3: 0, 6: 3, 8: 0, 11: -2 };
    Sound.addSong('mol_future_mill', { bpm: 112, len: 112, swing: 0, vol: 0.34, verb: 0.14, echo: 0.12, echoSteps: 2, tone: 6400, play(i, t, s16) {
      const bar = Math.floor(i / 14), st = i % 14, ch = CH[bar & 3];
      // the clockwork: ticks on the even steps, a clank on the bar, the chain dragging, a limp kick and snare
      if (st % 2 === 0) K.tick(t, st % 4 === 0, 0.55);
      if (st === 0) K.clank(t, 0.6);
      if (st === 6) K.chain(t, 0.7);
      if (st === 0 || st === 6 || st === 10) K.fkick(t, st === 0 ? 0.85 : 0.65);
      if (st === 4 || st === 11) K.fsnare(t, 0.55);
      // the stumbling wah bass, short stabs, a low drone
      const off = WAH[st]; if (off !== undefined) K.wahbass(ch[0] + off, t, s16 * 1.6, 0.8);
      if (st === 2 || st === 9) K.stab(ch.slice(1), t, s16 * 0.8, 0.4, 0.8);
      if (st === 0) K.darkpad(ch[0] + 12, t, s16 * 13, 0.35);
      if (bar === 7 && st === 12) K.swirl(t, s16 * 2, 0.3);
    } });
  }

  // ---------------------------------------------------------------- 'boss_mol_miller': The Gray Miller Grinds (dark funk, E phrygian)
  if (!has('boss_mol_miller')) {
    const CH = K.CH('E2: G3 B3 E4, E2: G3 B3 E4, F2: A3 C4 F4, E2: G3 B3 D4, C2: E3 G3 C4, D2: F3 A3 D4, F2: A3 C4 E4, E2: G#3 B3 D4');
    const BASS = { 0: 0, 3: 0, 5: 12, 7: 1, 8: 0, 10: 3, 11: 1, 14: 0 };
    const MOOG = K.mel('r/64 E5/4 F5/2 G5/2 B5/4 A5/2 G5/2 | F5/4 E5/4 r/8 | E5/2 G5/2 B5/2 C6/2 B5/4 A5/2 G5/2 | F5/6 E5/10', 0);
    Sound.addSong('boss_mol_miller', { bpm: 138, len: 128, swing: 0.04, vol: 0.44, verb: 0.1, echo: 0.08, echoSteps: 3, tone: 7400, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      if (st === 0 || st === 3 || st === 8 || st === 11) K.fkick(t, st === 0 ? 1 : 0.75);
      if (st === 4 || st === 12) K.fsnare(t, 0.85);
      if (st % 2 === 1) K.hat(t, 0.35);
      // the millstone grinding on the off-beats, a scratch guitar on the sixteenths
      if (st % 4 === 2) K.scrape(t, s16 * 1.2, 0.35, 2600, 70);
      if (st % 2 === 0 && st !== 0) K.wahgtr(ch.slice(1), t, 0.38, s16 * 0.6);
      const off = BASS[st]; if (off !== undefined) K.synbass(ch[0] + off, t, s16 * 1.4, 0.9);
      if ((bar & 1) && (st === 6 || st === 14)) K.polybrass(ch.slice(1).map(m => m + 12), t, s16 * 1.2, 0.55);
      const n = MOOG[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.9, 'moog', 0.6);
    } });
  }
})();
