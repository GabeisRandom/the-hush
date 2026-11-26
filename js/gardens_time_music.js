'use strict';
// The Bloom Gardens' time songs (DESIGN.md 20 "T3a"): each world's area, its greenhouse and its boss. Never phonk or orchestral; none
// shares its meter, groove, tempo, bass or lead with another song in the game (today's gardens are a sunny funk-pop at 112 with slap
// bass, clav and a flute; today's greenhouse a 3/4 jazz waltz; the queen bee an Afrobeat).
//   'gd_past', "Summer of Then" (the gardens long ago): sunshine lo-fi soul at 88 in F. A felt kick and a sidestick, vinyl crackle,
//     a ukulele strumming the off-beats, vibraphone chords, a round warm bass walking, and a whistled tune in the second half.
//   'gd_past_house', "The New Glasshouse": 9/8 (2+2+2+3) at 100 in A dorian. A marimba ostinato in the uneven bar, celesta sparkles,
//     a pizzicato bass, a handbell on every bar, a soft shaker, water drips.
//   'boss_gd_bloom', "Petal Fuzz": garage psych-funk at 124 in E minor. A backbeat with a tambourine on the eighths, a fuzz bass riff,
//     organ stabs, a wah guitar, a Moog lead that bends like a stem in the wind.
//   'gd_future', "A Music Box in the Rain": 6/8 lo-fi at 70 in A minor. A music box that plays flat while the gardens are gray and
//     comes into tune as people wake (GD_FUT.k()), a felt piano, rain crackle; brushes and an upright come in, then a harp and a
//     breathy wind-synth line once it's healed.
//   'gd_future_house', "Mind Your Manners": chamber funk at 96 in D minor. A clavinet riff, pizzicato strings, a woodblock and a
//     sidestick, a round bass, a polite little melodica tune.
//   'boss_gd_thorn', "Thorn Warden": jungle at 172 in F minor. A chopped break, a growling reese bass, a china cymbal, rave stabs, a
//     rave lead in the second half.
const GDMUSIC = (() => {
  const out = { songs: [] };
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return out;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);
  const add = (name, def) => { if (has(name)) return; try { Sound.addSong(name, def); out.songs.push(name); } catch (e) { console.error('[gardens music] ' + name, e); } };

  // ---------------------------------------------------------------- 'gd_past': Summer of Then (sunshine lo-fi soul, 88, F)
  {
    const CH = K.CH('F2: A3 C4 E4, D2: F3 A3 C4, G1: F3 Bb3 D4, C2: E3 G3 Bb3, F2: A3 C4 E4, A1: G3 C#4 E4, Bb1: A3 D4 F4, C2: Bb3 E4 G4');
    const TUNE = K.mel('C5/2 F5/2 A5/4 G5/2 F5/2 | D5/4 F5/4 G5/8 | A5/2 Bb5/2 A5/2 G5/2 F5/4 E5/4 | G5/12 r/4', 128);
    K.mel('A5/2 G5/2 F5/4 D5/4 C5/4 | F5/2 G5/2 A5/12 | Bb5/2 A5/2 G5/4 E5/4 C5/4 | F5/12 r/4', 192, TUNE);
    const WALK = [0, 2, 4, 7];
    add('gd_past', { bpm: 88, len: 256, swing: 0.12, vol: 0.3, verb: 0.22, echo: 0.1, echoSteps: 3, tone: 6400, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      K.crackle(t, s16, 0.8);
      if (st === 0 || st === 7 || st === 10) K.feltkick(t, st === 0 ? 0.9 : 0.55);
      if (st === 4 || st === 12) K.sidestick(t, 0.6);
      if (st % 4 === 2) K.uke(ch.slice(1).map(m => m + 12), t, 0.7, st === 6 || st === 14);
      if (st === 0 || st === 8) ch.slice(1).forEach((m, k) => K.vibe(m + 12, t + k * 0.012, s16 * 7, 0.45));
      if (st % 4 === 0) K.roundbass(ch[0] + WALK[(st >> 2) & 3] * (bar & 1), t, s16 * 3.4, 0.85);
      const n = TUNE[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.9, 'whistle', 0.5);
    } });
  }
  // ---------------------------------------------------------------- 'gd_past_house': The New Glasshouse (9/8 = 18 sixteenths, 100, A dorian)
  {
    const CH = K.CH('A1: C4 E4 G4, A1: C4 E4 G4, D2: F#3 A3 C4, D2: F#3 A3 C4, G1: B3 D4 F#4, C2: E3 G3 B3, F#1: E3 A3 C4, E2: D4 G4 B4');
    const OST = { 0: 0, 4: 7, 8: 12, 12: 10, 15: 7 };          // (the bar's groups: 4 + 4 + 4 + 6)
    add('gd_past_house', { bpm: 100, len: 144, swing: 0, vol: 0.3, verb: 0.3, echo: 0.16, echoSteps: 3, tone: 6000, play(i, t, s16) {
      const bar = Math.floor(i / 18), st = i % 18, ch = CH[bar & 7];
      if (st === 0) { K.handbell(ch[0] + 36, t, 0.7); K.pizz(ch[0] + 12, t, 0.9, s16 * 3); }
      if (st === 8 || st === 12) K.pizz(ch[0] + 19, t, 0.6, s16 * 2);
      const o = OST[st]; if (o !== undefined) K.marimba(ch[0] + 24 + o, t, 0.75);
      if (st % 2 === 1) K.shaker(t, 0.35);
      if (st === 4 || st === 8 || st === 12) K.marimba(ch[1 + (st / 4 - 1) % (ch.length - 1)] + 12, t, 0.45);
      if (st === 15 && (bar & 1)) ch.slice(1).forEach((m, k) => K.celesta(m + 24, t + k * 0.05, 0.5, 1.0));
      if (Math.random() < 0.05) K.drip(86 + ((Math.random() * 6) | 0), t, 0.5);
    } });
  }
  // ---------------------------------------------------------------- 'boss_gd_bloom': Petal Fuzz (garage psych-funk, 124, E minor)
  {
    const CH = K.CH('E2: G3 B3 D4, E2: G3 B3 D4, A1: G3 C4 E4, B1: F#3 A3 D#4, E2: G3 B3 D4, G1: F#3 B3 D4, C2: E3 G3 B3, B1: F#3 A3 D#4');
    const RIFF = { 0: 0, 3: 0, 6: 3, 7: 5, 10: 7, 12: 10, 14: 12 };
    const HOOK = K.mel('B4/2 D5/2 E5/4 G5/2 E5/2 | D5/2 B4/2 A4/4 B4/8 | E5/2 G5/2 A5/4 B5/2 A5/2 | G5/4 E5/4 D5/8', 0);
    add('boss_gd_bloom', { bpm: 124, len: 128, swing: 0.08, vol: 0.42, verb: 0.14, echo: 0.12, echoSteps: 3, tone: 8200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      if (st === 0 || st === 10 || (st === 7 && (bar & 1))) K.kick(t, st === 0 ? 1 : 0.7);
      if (st === 4 || st === 12) K.snare(t, 0.85);
      if (st % 2 === 0) K.tamb(t, st % 4 === 0 ? 0.7 : 0.45);
      const o = RIFF[st]; if (o !== undefined) K.fuzzbass(ch[0] + o, t, s16 * 1.4, st === 0 ? 0.9 : 0.7);
      if (st === 2 || st === 11) K.hammond(ch.slice(1), t, s16 * 1.5, 0.42);
      if (st === 8 && (bar & 1)) K.wahgtr(ch.slice(1).map(m => m + 12), t, 0.6, 0.2);
      const n = HOOK[i % 64]; if (n && bar >= 2) K.lead(n[0], t, n[1] * s16 * 0.9, 'moog', 0.55);
    } });
  }
  // ---------------------------------------------------------------- 'gd_future': A Music Box in the Rain (6/8 = 12 sixteenths, 70, A minor)
  {
    const CH = K.CH('A1: C4 E4 G4, F1: A3 C4 E4, C2: E3 G3 B3, G1: B3 D4 F4, A1: C4 E4 G4, D2: F3 A3 C4, E2: G#3 B3 D4, E2: G#3 B3 D4');
    const BOX = K.mel('E5/2 A5/2 B5/2 C6/4 B5/2 | A5/4 E5/2 G5/6 | F5/2 A5/2 C6/2 E6/4 D6/2 | B5/12 | C6/2 B5/2 A5/2 E5/4 C5/2 | D5/4 E5/2 F5/6 | E5/2 G#5/2 B5/2 D6/4 C6/2 | B5/12', 0);
    const AIR = K.mel('r/12 | A4/6 C5/6 | E5/8 D5/4 | B4/12 | r/12 | C5/6 E5/6 | G#5/8 F5/4 | E5/12', 0);
    const kNow = () => { try { return typeof GD_FUT !== 'undefined' && GD_FUT ? GD_FUT.k() : 0.2; } catch (e) { return 0.2; } };
    add('gd_future', { bpm: 70, len: 96, swing: 0.1, vol: 0.3, verb: 0.3, echo: 0.18, echoSteps: 3, tone: 5600, play(i, t, s16) {
      const bar = Math.floor(i / 12), st = i % 12, ch = CH[bar & 7], k = kNow();
      K.crackle(t, s16, 1.2);
      const n = BOX[i % 96]; if (n) K.mbox(n[0], t, 0.7, Math.max(0, 0.6 * (1 - k * 1.25)), n[1] * s16 * 1.6);
      if (st === 0) ch.slice(1).forEach((m, j) => K.felt(m, t + j * 0.02, s16 * 10, 0.5));
      if (st === 0 || st === 6) K.felt(ch[0] + 12, t, s16 * 5, 0.45);
      if (k > 0.4) { if (st === 0 || st === 6) K.feltkick(t, 0.55); if (st === 3 || st === 9) K.brush(t, 0.8, 0.2); if (st % 3 === 0) K.upright(ch[0] + (st === 6 ? 7 : 0), t, 0.7, s16 * 2.6); }
      if (k > 0.8) { if (st === 9 && (bar & 1)) K.harpchord(ch.slice(1).map(m => m + 12), t, s16 * 3, 0.5); const a = AIR[i % 96]; if (a) K.lead(a[0], t, a[1] * s16 * 0.95, 'ewi', 0.42); }
    } });
  }
  // ---------------------------------------------------------------- 'gd_future_house': Mind Your Manners (chamber funk, 96, D minor)
  {
    const CH = K.CH('D2: F3 A3 C4, D2: F3 A3 C4, G1: Bb3 D4 F4, A1: G3 C#4 E4, D2: F3 A3 C4, Bb1: A3 D4 F4, E2: G3 Bb3 D4, A1: G3 C#4 E4');
    const CLAV = { 0: 0, 2: 12, 3: 10, 6: 7, 8: 0, 10: 12, 13: 15, 14: 12 };
    const TUNE = K.mel('A4/2 D5/2 F5/2 E5/2 D5/4 A4/4 | Bb4/2 D5/2 G5/4 F5/4 E5/4 | F5/2 E5/2 D5/2 C#5/2 D5/4 F5/4 | E5/12 r/4', 0);
    add('gd_future_house', { bpm: 96, len: 128, swing: 0.1, vol: 0.32, verb: 0.2, echo: 0.1, echoSteps: 3, tone: 7000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      if (st === 0 || st === 9) K.kick(t, st === 0 ? 0.8 : 0.5);
      if (st === 4 || st === 12) K.sidestick(t, 0.7);
      if (st % 4 === 2) K.woodblock(t, st === 6 || st === 14, 0.6);
      const o = CLAV[st]; if (o !== undefined) K.clav(ch[0] + 24 + o, t, 0.6);
      if (st === 0 || st === 8) K.roundbass(ch[0], t, s16 * 3, 0.8);
      if (st === 6 || st === 14) ch.slice(1).forEach((m, j) => K.pizz(m, t + j * 0.015, 0.55, s16));
      const n = TUNE[i % 64]; if (n && (bar & 4)) K.lead(n[0], t, n[1] * s16 * 0.9, 'melodica', 0.45);
    } });
  }
  // ---------------------------------------------------------------- 'boss_gd_thorn': Thorn Warden (jungle, 172, F minor)
  {
    const CH = K.CH('F1: Ab3 C4 Eb4, F1: Ab3 C4 Eb4, Db2: F3 Ab3 C4, Eb2: G3 Bb3 Db4, F1: Ab3 C4 Eb4, Bb1: Db4 F4 Ab4, C2: E3 G3 Bb3, C2: E3 G3 Bb3');
    const BREAK = { 0: 'k', 4: 's', 7: 'g', 10: 'k', 11: 'k', 12: 's', 14: 'g', 15: 's' };
    const RAVE = K.mel('C5/2 Eb5/2 F5/4 Ab5/2 G5/2 | F5/4 Eb5/4 C5/8 | Db5/2 F5/2 Ab5/4 Bb5/2 Ab5/2 | G5/4 E5/4 C5/8', 0);
    add('boss_gd_thorn', { bpm: 172, len: 128, swing: 0, vol: 0.42, verb: 0.12, echo: 0.1, echoSteps: 2, tone: 8600, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7], b = BREAK[st];
      if (b === 'k') K.rkick(t, 0.95); else if (b === 's') K.fsnare(t, 0.9); else if (b === 'g') K.fsnare(t, 0.3);
      if (st % 2 === 1) K.hat(t, 0.32);
      if (st === 0 && !(bar & 3)) K.china(t, 0.7);
      if (st === 0 || st === 6 || st === 10) K.reese(ch[0] + 12, t, s16 * (st === 0 ? 5 : 3), 0.85);
      if ((st === 2 || st === 13) && (bar & 1)) K.stab(ch.slice(1), t, s16 * 1.2, 0.5);
      const n = RAVE[i % 64]; if (n && bar >= 4) K.lead(n[0], t, n[1] * s16 * 0.85, 'rave', 0.5);
    } });
  }
  return out;
})();
