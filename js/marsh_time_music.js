'use strict';
// The Gray Marsh's time songs (game/TIME.md §25 "The Gray Marsh (T4c)"): each world's area, its dungeon and its boss. Never phonk or
// orchestral; every melody and riff here is the game's own. Today's marsh is a slow 12/8 swamp shuffle (kalimba, frog croaks, a breathy
// wind-synth hook) and the drowned chapel a 5/4 organ with a ghost choir; these share none of that.
//   'mh_past', "Lanterns on the Water" (Candil long ago): neo-soul hip-hop at 90 in D♭ with a loose, late-swung beat. Wurlitzer-like
//     electric-piano sevenths, an upright bass, a celesta hook like lanterns knocking together, vinyl crackle; a low gray pad creeps in
//     under the second half and never quite leaves.
//   'mh_past_house', "Up the Lantern Stair" (the Lantern House): 10/8 (3+3+2+2) at 108 in G minor. A vibraphone ostinato that keeps
//     climbing, clavinet stabs on the 2s, hand claps, a shaker like a wick fizzing.
//   'boss_mh_moth', "Moth to a Flame" (the Lantern Moth): Afrobeat-funk at 116 in A dorian. A 12/8 bell pattern over a straight four,
//     shekere, two guitars locked against each other, a busy bass, a baritone-sax riff, and a flute that flutters like wings.
//   'mh_future', "If the Stone Could Sing" (the marsh tomorrow): a drumless slide-guitar lo-fi at 64 in E that fills in as people wake
//     (MHMUSIC.wake(): MH_FUT's share of the stone people back): a tremolo guitar and a vibraphone alone at first; then a round bass;
//     then a soft boom-bap; then an organ under it all; freed, a celesta on top.
//   'mh_future_chapel', "Petrified Hymn" (the Stone Chapel): 13/8 (3+3+3+2+2) at 120 in C minor. A stone xylophone (marimba and glock
//     doubled, short and bright), a low drone, a breakbeat that stutters and skips like something stuck.
//   'boss_mh_gargoyle', "Heavy as Stone" (the Stone Gargoyle): New Orleans second-line brass funk at 100 in B♭. A sousaphone bass, a
//     snare that rolls, a bass drum on the and-of-two, trombone smears and a trumpet answer, cowbell, a whole street waking up.
const MHMUSIC = (() => {
  const out = { songs: [], wake: () => (typeof MH_FUT !== 'undefined' && MH_FUT && MH_FUT.wakeShare ? MH_FUT.wakeShare() : 0) };
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return out;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);
  const add = (name, def) => { if (has(name)) return; try { Sound.addSong(name, def); out.songs.push(name); } catch (e) { console.error('[marsh music] ' + name, e); } };
  const lag = s16 => (Math.random() - 0.5) * s16 * 0.12;          // (a beat played a little late, a little loose)

  // ---------------------------------------------------------------- 'mh_past': Lanterns on the Water (neo-soul hip-hop, 90, D♭)
  {
    const CH = K.CH('Db2: F3 Ab3 C4 Eb4, C2: Eb3 G3 Bb3 D4, Bb1: Db4 F4 Ab4 C5, Gb1: Bb3 Db4 F4 Ab4, Db2: F3 Ab3 C4 Eb4, Ab1: C4 Eb4 G4 Bb4, Gb1: Bb3 Db4 F4 Ab4, Ab1: C4 Eb4 Gb4 Bb4');
    const HOOK = K.mel('Ab5/2 F5/1 Eb5/1 F5/4 r/2 Db5/2 Eb5/2 F5/2 | Ab5/1 Bb5/1 Ab5/2 F5/4 Eb5/4 Db5/4 | Bb4/2 Db5/2 Eb5/4 F5/2 Eb5/2 Db5/4 | C5/2 Db5/2 Ab4/12', 0);
    add('mh_past', { bpm: 90, len: 128, swing: 0.16, vol: 0.3, verb: 0.24, echo: 0.14, echoSteps: 3, tone: 5400, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      K.crackle(t, s16, 0.7);
      if (st === 0 || st === 7 || (st === 10 && (bar & 1))) K.dustkick(t + lag(s16), st === 0 ? 0.95 : 0.6);
      if (st === 4 || st === 12) K.dustsnare(t + s16 * 0.08, 0.7);
      if (st % 2 === 0) K.dusthat(t + lag(s16), st % 4 === 2 ? 0.65 : 0.4); if (st === 15 && (bar & 3) === 3) K.dusthat(t, 0.5);
      if (st === 0) K.epiano(ch[1], t, s16 * 6, 0.5); if (st === 0 || st === 9) for (const m of ch.slice(2)) K.epiano(m, t + 0.014, s16 * (st ? 5 : 8), 0.32);
      if (st === 0 || st === 6 || st === 11) K.upright(ch[0] + 12 + (st === 11 ? 7 : 0), t, 0.75, s16 * 3);
      const n = HOOK[i % 64]; if (n && (bar & 7) >= 2) K.celesta(n[0], t, 0.55, n[1] * s16 * 1.2);
      if (st === 0 && (bar & 7) >= 4) K.darkpad(ch[0] + 24, t, s16 * 15, 0.18);
    } });
  }
  // ---------------------------------------------------------------- 'mh_past_house': Up the Lantern Stair (10/8 = 20 sixteenths, 108, G minor)
  {
    const CH = K.CH('G2: Bb3 D4 F4, Eb2: G3 Bb3 D4, C2: Eb3 G3 Bb3, D2: F#3 A3 C4');
    const OST = [0, 3, 7, 10, 12, 10, 7, 5, 3, 7];
    add('mh_past_house', { bpm: 108, len: 160, swing: 0, vol: 0.31, verb: 0.2, echo: 0.1, echoSteps: 2, tone: 6400, play(i, t, s16) {
      const bar = Math.floor(i / 20), st = i % 20, ch = CH[bar & 3];
      if (st === 0 || st === 6) K.feltkick(t, st ? 0.55 : 0.85); if (st === 12 || st === 16) K.hclap(t, 0.5);
      if (st % 2 === 1) K.shaker(t, 0.4);
      if (st % 2 === 0) K.vibes(ch[0] + 24 + OST[(st >> 1) % 10] + (bar & 4 ? 12 : 0), t, 0.55, s16 * 1.6);
      if (st === 12 || st === 16) K.clav(ch[1] + 12, t, 0.45);
      if (st === 0) K.roundbass(ch[0] + 12, t, s16 * 5, 0.7); if (st === 6) K.roundbass(ch[0] + 19, t, s16 * 3, 0.5); if (st === 16) K.roundbass(ch[0] + 22, t, s16 * 2, 0.5);
      if (st === 0 && (bar & 1) === 0) for (const m of ch.slice(1)) K.warmpad(m, t, s16 * 36, 0.14);
    } });
  }
  // ---------------------------------------------------------------- 'boss_mh_moth': Moth to a Flame (Afrobeat-funk, 116, A dorian)
  {
    const CH = K.CH('A1: C4 E4 G4, A1: C4 E4 G4, D2: F#3 A3 C4, A1: C4 E4 G4, A1: C4 E4 G4, G1: B3 D4 F#4, D2: F#3 A3 C4, E2: G3 B3 D4');
    const BELL = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0];          // (a 12/8 bell laid over sixteenths: it pulls against the four)
    const SAX = K.mel('A3/2 r/1 C4/1 D4/2 E4/2 r/2 G3/1 A3/1 r/4 | A3/2 r/1 C4/1 D4/2 G4/2 E4/4 r/4', 0);
    const FLUTE = K.mel('E6/1 F#6/1 E6/1 F#6/1 E6/2 D6/2 B5/4 r/4 | A5/1 B5/1 A5/1 B5/1 D6/2 E6/2 A5/8', 0);
    const BASS = [0, 0, 12, 0, 7, 0, 10, 12, 0, 0, 12, 7, 5, 7, 10, 7];
    add('boss_mh_moth', { bpm: 116, len: 128, swing: 0.06, vol: 0.34, verb: 0.14, echo: 0.06, echoSteps: 3, tone: 7800, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      if (st % 4 === 0) K.kick(t, st === 0 ? 0.9 : 0.7); if (st === 4 || st === 12) K.snare(t, 0.55); if (st === 14 && (bar & 1)) K.snare(t, 0.3);
      if (st % 2 === 1) K.hat(t, 0.3, st === 7);
      if (BELL[st]) K.cowbell(t, 0.42, !(st & 2)); K.agbe(t, st % 4 === 2 ? 0.75 : 0.4);
      if (st % 4 === 1 || st % 4 === 3) K.skank(ch.slice(1), t, 0.6);
      if (st === 2 || st === 6 || st === 10 || st === 14) K.chorusgtr([ch[1] + 12, ch[2] + 12], t, s16 * 0.8, 0.35);
      if (BASS[st] !== undefined && (st % 2 === 0 || st === 7 || st === 15)) K.roundbass(ch[0] + 12 + BASS[st], t, s16 * 1.4, 0.75);
      const sx = SAX[i % 32]; if (sx && (bar & 3) < 2) K.lead(sx[0] - 12, t, sx[1] * s16 * 0.95, 'sax', 0.5);
      const fn = FLUTE[i % 32]; if (fn && (bar & 3) >= 2) K.lead(fn[0], t, fn[1] * s16 * 0.9, 'flute', 0.38);
    } });
  }
  // ---------------------------------------------------------------- 'mh_future': If the Stone Could Sing (drumless slide-guitar lo-fi, 64, E)
  {
    const CH = K.CH('E2: G#3 B3 D#4, C#2: E3 G#3 B3, A1: C#4 E4 G#4, B1: D#4 F#4 A4');
    const MEL = K.mel('B4/4 G#4/2 F#4/2 E4/8 | C#5/4 B4/2 G#4/2 B4/8 | A4/4 G#4/2 E4/2 C#4/8 | D#4/4 E4/2 F#4/2 B3/8', 0);
    add('mh_future', { bpm: 64, len: 128, swing: 0.1, vol: 0.3, verb: 0.34, echo: 0.2, echoSteps: 4, tone: 4800, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3], w = out.wake(), freed = w >= 0.99;
      if (st === 0 || st === 8) K.tremgtr(ch[1] + 12, t, s16 * 7, 0.42); if (st === 4 || st === 12) K.tremgtr(ch[2] + 12, t, s16 * 3, 0.3);
      const n = MEL[i % 64]; if (n) K.vibe(n[0], t, n[1] * s16 * 1.3, 0.5);
      if (w >= 0.25 && (st === 0 || st === 10)) K.roundbass(ch[0] + 12, t, s16 * (st ? 4 : 8), 0.6);
      if (w >= 0.5) { if (st === 0 || st === 9) K.dustkick(t, 0.6); if (st === 4 || st === 12) K.dustsnare(t, 0.45); if (st % 2 === 0) K.dusthat(t, 0.3); }
      if (w >= 0.75 && st === 0) K.organ(ch[1], t, s16 * 15, 0.16);
      if (freed && st % 4 === 2) K.celesta(ch[1 + (st >> 2) % 3] + 24, t, 0.4, s16 * 3);
      if (!freed && st === 0 && (bar & 3) === 3) K.swell(t, s16 * 10, 0.4);
    } });
  }
  // ---------------------------------------------------------------- 'mh_future_chapel': Petrified Hymn (13/8 = 26 sixteenths, 120, C minor)
  {
    const CH = K.CH('C2: Eb3 G3 Bb3, Ab1: C3 Eb3 G3, F1: Ab3 C4 Eb4, G1: B3 D4 F4');
    const ST = [0, 3, 7, 0, 3, 7, 0, 3, 8, 7, 3, 10, 7];
    add('mh_future_chapel', { bpm: 120, len: 208, swing: 0, vol: 0.3, verb: 0.3, echo: 0.12, echoSteps: 3, tone: 6000, play(i, t, s16) {
      const bar = Math.floor(i / 26), st = i % 26, ch = CH[bar & 3];
      if (st % 2 === 0) { const m = ch[0] + 24 + ST[(st >> 1) % 13]; K.marimba(m, t, 0.5); K.glock(m + 12, t, 0.18); }
      if (st === 0) K.darkpad(ch[0] + 12, t, s16 * 25, 0.22);
      if (st === 0 || st === 6 || st === 12) K.dustkick(t, st ? 0.6 : 0.85); if (st === 18 || st === 22) K.dustsnare(t, 0.55);
      if (st === 23 && (bar & 1)) K.dustsnare(t, 0.3); if ((st === 9 || st === 21) && Math.random() < 0.6) K.dustkick(t, 0.45);
      if (st % 2 === 1 && st !== 19) K.dusthat(t, 0.32);
      if (st === 0 || st === 18) K.fretless(ch[0] + 12, t, s16 * (st ? 7 : 16), 0.6);
    } });
  }
  // ---------------------------------------------------------------- 'boss_mh_gargoyle': Heavy as Stone (second-line brass funk, 100, B♭)
  {
    const CH = K.CH('Bb1: D3 F3 Ab3, Bb1: D3 F3 Ab3, Eb2: G3 Bb3 Db4, Bb1: D3 F3 Ab3, F1: A3 C4 Eb4, Eb2: G3 Bb3 Db4, Bb1: D3 F3 Ab3, F1: A3 C4 Eb4');
    const SOUSA = [0, null, null, 0, 4, null, 5, null, 7, null, 7, 9, 10, null, 7, 5];
    const BONE = K.mel('F4/2 r/2 Ab4/1 G4/1 F4/2 D4/4 r/4 | Bb4/2 Ab4/2 F4/4 r/8', 0);
    const TPT = K.mel('r/8 D5/1 F5/1 G5/2 F5/2 D5/2 | r/8 F5/2 D5/1 C5/1 Bb4/4', 0);
    add('boss_mh_gargoyle', { bpm: 100, len: 128, swing: 0.18, vol: 0.34, verb: 0.12, echo: 0.05, echoSteps: 2, tone: 7600, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      if (st === 0 || st === 6 || st === 10) K.bigkick ? K.bigkick(t, st ? 0.6 : 0.85) : K.kick(t, st ? 0.6 : 0.85);
      if (st === 4 || st === 12) K.snare(t, 0.7); if (st === 14 || st === 15 || (st === 11 && (bar & 1))) K.snare(t, 0.28);
      if (st % 2 === 0) K.ride(t, st % 4 === 0 ? 0.5 : 0.3); if (st === 2 || st === 10) K.cowbell(t, 0.35, true);
      const s = SOUSA[st]; if (s !== null && s !== undefined) K.tuba(ch[0] + 12 + s, t, s16 * 1.6, 0.8);
      const b = BONE[i % 32]; if (b && (bar & 1) === 0) K.lead(b[0], t, b[1] * s16 * 1.05, 'bone', 0.5);
      const p = TPT[i % 32]; if (p && (bar & 1)) K.lead(p[0], t, p[1] * s16, 'tptlead', 0.42);
      if (st === 0 && (bar & 3) === 3) K.brass(ch.slice(1).map(m => m + 12), t, s16 * 3, 0.3);
    } });
  }
  return out;
})();
