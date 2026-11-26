'use strict';
// The Sunken Ruins' time songs (DESIGN.md 20.1b "next, the Sunken Ruins"; game/TIME.md "The Sunken Ruins (T4b)"): each world's area,
// its dungeon and its boss. Never phonk or orchestral; every melody and riff here is the game's own. Today's ruins are a dusty boom-bap
// at 94 (congas, fretless, wah guitar, a whistled tune, kalimba) and the temple a lo-fi at 78 (handbells, drips, a breathy flute); these
// share none of that.
//   'ru_past', "Riverbank, Long Ago" (the green canyon): jazzy lo-fi hip-hop at 86 in A minor. A dusty swung beat, felt-piano ninth
//     chords, a walking upright, vinyl crackle, a wooden flute's hook in the second half, a shaker like water over stones.
//   'ru_past_temple', "The Door Stood Open" (the temple, first opened): 6/8 at 96 in D dorian. Hand drums and a low clay-pot drum, a
//     marimba ostinato, a low hummed pad, water dripping somewhere.
//   'boss_ru_parrot', "Say It Again" (the Clay Parrot): go-go funk at 112 in E minor. Congas, cowbell and timbales over a pocket beat, a
//     clavinet calls a short phrase and a muted trumpet answers it… one note wrong, every time.
//   'ru_future', "High Tide Camp" (the canyon tomorrow): trip-hop at 76 in E minor that fills in as people wake (RU_FUT.k()): waves, a
//     sub and a lonely vibraphone first; then the dusty half-time break, quiet; then the hats, the full break and a muted horn.
//   'ru_future_temple', "Ebb and Flow" (the sunken temple): 7/8 (14 sixteenths) at 104 in F# minor. Marimba and water drops, a pad that
//     swells and sinks every two bars like the tide, fretless bass, rim clicks, a far sonar ping.
//   'boss_ru_moray', "Moray Bounce" (the Gray Moray): half-time trap-funk at 140 in G minor. 808 kicks and sliding 808 bass, claps on the
//     half-time backbeat, rolling hats, a robotic talkbox-like lead, a slap-bass riff.
const RUMUSIC = (() => {
  const out = { songs: [] };
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return out;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);
  const add = (name, def) => { if (has(name)) return; try { Sound.addSong(name, def); out.songs.push(name); } catch (e) { console.error('[ruins music] ' + name, e); } };

  // ---------------------------------------------------------------- 'ru_past': Riverbank, Long Ago (jazzy lo-fi hip-hop, 86, A minor)
  {
    const CH = K.CH('A1: C4 E4 G4 B4, D2: F3 A3 C4 E4, G1: B3 E4 F4 A4, C2: E3 G3 B3 D4, F1: A3 C4 E4 G4, B1: D4 F4 A4 C5, E2: G#3 B3 D4 F4, A1: C4 E4 G4 B4');
    const HOOK = K.mel('E5/2 G5/2 A5/3 G5/1 E5/4 r/4 | D5/2 E5/2 C5/4 A4/6 r/2 | G5/2 A5/2 C6/3 B5/1 A5/4 G5/4 | E5/2 D5/2 E5/12', 0);
    const WALK = [0, 3, 7, 10];
    add('ru_past', { bpm: 86, len: 128, swing: 0.11, vol: 0.3, verb: 0.2, echo: 0.12, echoSteps: 3, tone: 5600, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      K.crackle(t, s16, 0.8);
      if (st === 0 || st === 10 || (st === 7 && (bar & 1))) K.dustkick(t, st === 0 ? 0.9 : 0.6);
      if (st === 4 || st === 12) K.dustsnare(t, 0.75);
      if (st % 2 === 0) K.dusthat(t, st % 4 === 2 ? 0.7 : 0.45);
      if (st % 4 === 3) K.shaker(t, 0.5);
      if (st === 0) K.felt(ch[1], t, s16 * 7, 0.55); if (st === 0 || st === 6) for (const m of ch.slice(2)) K.felt(m, t + 0.012, s16 * (st ? 5 : 7), 0.35);
      if (st % 4 === 0) K.upright(ch[0] + 12 + WALK[(st >> 2) & 3], t, 0.8, s16 * 3.2);
      const n = HOOK[i % 64]; if (n && (bar & 7) >= 4) K.lead(n[0], t, n[1] * s16 * 1.05, 'flute', 0.45);
    } });
  }
  // ---------------------------------------------------------------- 'ru_past_temple': The Door Stood Open (6/8 = 12 sixteenths, 96, D dorian)
  {
    const CH = K.CH('D2: F3 A3 C4, D2: F3 A3 C4, C2: E3 G3 B3, G1: B3 D4 F4, D2: F3 A3 C4, F1: A3 C4 E4, C2: E3 G3 B3, A1: C4 E4 G4');
    const OST = [0, 3, 7, 10, 7, 3];
    add('ru_past_temple', { bpm: 96, len: 96, swing: 0, vol: 0.32, verb: 0.3, echo: 0.16, echoSteps: 4, tone: 5200, play(i, t, s16) {
      const bar = Math.floor(i / 12), st = i % 12, ch = CH[bar & 7];
      if (st === 0) K.tom(t, 70, 0.9); if (st === 6) K.tom(t, 92, 0.6);
      if (st === 2 || st === 8) K.conga(t, 'lo', 0.55); if (st === 4 || st === 10) K.conga(t, 'slap', 0.4); if (st === 5 || st === 11) K.bongo(t, 'hi', 0.35);
      if (st % 2 === 0) K.marimba(ch[0] + 24 + OST[(st >> 1) % 6], t, 0.5);
      if (st === 0 && (bar & 1) === 0) for (const m of ch.slice(1)) K.warmpad(m - 12, t, s16 * 22, 0.22);
      if (st === 0) K.fretless(ch[0] + 12, t, s16 * 5, 0.7); if (st === 9) K.fretless(ch[0] + 19, t, s16 * 2, 0.45);
      if (Math.random() < 0.06) K.drip(84 + Math.floor(Math.random() * 7), t, 0.5);
    } });
  }
  // ---------------------------------------------------------------- 'boss_ru_parrot': Say It Again (go-go funk, 112, E minor)
  {
    const CH = K.CH('E2: G3 B3 D4, E2: G3 B3 D4, A1: C4 E4 G4, B1: D#4 F#4 A4');
    const CALL = K.mel('E5/1 G5/1 A5/2 G5/1 E5/1 D5/2 E5/4', 0);       // (the clav's phrase, bars 1 and 3)
    const ANSW = K.mel('E5/1 G5/1 A5/2 G5/1 F5/1 D5/2 E5/4', 0);       // (the trumpet's answer: one note wrong, F for E)
    add('boss_ru_parrot', { bpm: 112, len: 128, swing: 0.08, vol: 0.34, verb: 0.12, echo: 0.06, echoSteps: 2, tone: 8000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3];
      if (st === 0 || st === 6 || st === 10) K.kick(t, st === 0 ? 0.9 : 0.65);
      if (st === 4 || st === 12) K.snare(t, 0.7);
      if (st % 2 === 0) K.hat(t, 0.25);
      if ([0, 3, 6, 8, 11, 14].includes(st)) K.conga(t, st % 3 === 0 ? 'hi' : 'slap', 0.5);
      if (st % 4 === 2) K.cowbell(t, 0.55, st === 6); if (st === 14) K.timbale(t, true, 0.5);
      if (st % 4 === 0 || st === 7) K.fslap(ch[0] + (st === 7 ? 19 : 12), t, s16 * 1.4, 0.7, st === 7);
      const n0 = bar & 1 ? ANSW[st] : CALL[st];
      if (n0 && (bar & 1) === 0) K.clav(n0[0], t, 0.6);
      if (n0 && (bar & 1) === 1) K.lead(n0[0], t, n0[1] * s16 * 0.9, 'mute', 0.5);
      if (st === 0 && (bar & 3) === 3) K.stab(ch.slice(1), t, s16 * 2, 0.45);
    } });
  }
  // ---------------------------------------------------------------- 'ru_future': High Tide Camp (trip-hop, 76, E minor; fills in as people wake)
  {
    const CH = K.CH('E1: G3 B3 D4 F#4, C2: E3 G3 B3 D4, A1: C4 E4 G4 B4, B1: D#4 F#4 A4 C5');
    const VIB = K.mel('B4/4 D5/2 E5/2 G5/8 | F#5/4 E5/4 D5/8 | B4/4 G4/4 A4/2 B4/6 | r/16', 0);
    const HORN = K.mel('E5/6 G5/2 F#5/4 E5/4 | D5/8 B4/8', 0);
    const kk = () => { try { return typeof RU_FUT !== 'undefined' && RU_FUT && RU_FUT.k ? RU_FUT.k() : 0.5; } catch (e) { return 0.5; } };
    add('ru_future', { bpm: 76, len: 128, swing: 0.06, vol: 0.3, verb: 0.26, echo: 0.2, echoSteps: 3, tone: 5000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3], k = kk();
      if (st === 0 && (bar & 1) === 0) K.wave(t, s16 * 28, 0.5);
      if (st === 0) K.sub808(ch[0] + 12, t, s16 * 10, 0.55);
      const v = VIB[i % 64]; if (v) K.vibes(v[0], t, 0.5, v[1] * s16 * 1.2);
      if (k > 0.3) { if (st === 0 || st === 9) K.dustkick(t, 0.45 + k * 0.4); if (st === 8) K.dustsnare(t, 0.3 + k * 0.45); }
      if (k > 0.55 && st % 2 === 0) K.dusthat(t, st % 4 === 2 ? 0.55 : 0.35);
      if (k > 0.55 && st === 0) for (const m of ch.slice(1)) K.epiano(m, t, s16 * 7, 0.22, 0.6);
      const h = HORN[i % 32]; if (h && k > 0.85 && (bar & 3) >= 2) K.lead(h[0], t, h[1] * s16, 'mute', 0.4);
    } });
  }
  // ---------------------------------------------------------------- 'ru_future_temple': Ebb and Flow (7/8 = 14 sixteenths, 104, F# minor)
  {
    const CH = K.CH('F#1: A3 C#4 E4, D2: F#3 A3 C#4, E2: G#3 B3 D4, C#2: E#3 G#3 B3');
    const DROPS = [0, 7, 12, 10, 7, 3, 5];
    add('ru_future_temple', { bpm: 104, len: 112, swing: 0, vol: 0.31, verb: 0.3, echo: 0.18, echoSteps: 3, tone: 5600, play(i, t, s16) {
      const bar = Math.floor(i / 14), st = i % 14, ch = CH[bar & 3];
      if (st === 0 || st === 6 || st === 10) K.feather(t, st === 0 ? 1 : 0.7);
      if ([3, 8, 12].includes(st)) K.rim(t, 0.5);
      if (st % 2 === 0) K.marimba(ch[0] + 24 + DROPS[(st >> 1) % 7], t, 0.45);
      if (st % 4 === 1) K.drip(ch[1] + 24, t, 0.35);
      if (st === 0 && (bar & 1) === 0) { K.swell(t, s16 * 26, 0.5); for (const m of ch.slice(1)) K.warmpad(m, t, s16 * 26, 0.18); }
      if (st === 0 || st === 6) K.fretless(ch[0] + 12 + (st ? 7 : 0), t, s16 * 4, 0.7);
      if (st === 7 && (bar & 3) === 3) K.sonar(ch[0] + 36, t, 0.4);
    } });
  }
  // ---------------------------------------------------------------- 'boss_ru_moray': Moray Bounce (half-time trap-funk, 140, G minor)
  {
    const CH = K.CH('G1: Bb3 D4 F4, Eb2: G3 Bb3 D4, C2: Eb4 G4 Bb4, D2: F#3 A3 C4');
    const LEAD = K.mel('G5/2 Bb5/2 C6/2 D6/4 C6/2 Bb5/2 r/2 | A5/2 G5/2 F5/2 G5/8 r/2 | D6/2 C6/2 Bb5/2 C6/4 Bb5/2 G5/4 | F#5/4 G5/12', 0);
    const SLAP = K.mel('G3/1 r/1 G3/1 Bb3/1 r/2 D4/1 C4/1 r/2 G3/2 F3/2 G3/2', 0);
    add('boss_ru_moray', { bpm: 140, len: 128, swing: 0.04, vol: 0.34, verb: 0.1, echo: 0.06, echoSteps: 2, tone: 8600, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3];
      if (st === 0 || st === 3 || (st === 10 && (bar & 1))) K.kick808(t, 0.9, s16 * 4);
      if (st === 8) K.clap(t, 0.8);
      if (st % 2 === 0) K.hat(t, 0.3); else if ((bar & 1) && st > 11) K.hat(t, 0.22);
      if (st === 0) K.subglide(ch[0] + 12, t, s16 * 6, 0.7); if (st === 11) K.subglide(ch[0] + 15, t, s16 * 3, 0.5);
      const sl = SLAP[st]; if (sl && (bar & 3) === 2) K.fslap(sl[0] - 12, t, s16, 0.6, st === 6);
      const n = LEAD[i % 64]; if (n && (bar & 7) >= 2) K.lead(n[0], t, n[1] * s16 * 0.9, 'robo', 0.4);
      if (st === 0 && (bar & 1) === 0) K.stab(ch.slice(1), t, s16 * 1.5, 0.35);
    } });
  }
  return out;
})();
