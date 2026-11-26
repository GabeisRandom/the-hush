'use strict';
// Port Brisa's time songs (DESIGN.md 20.1b "T4a"): each world's area, its dungeon and its boss. Never phonk or orchestral; none shares
// its meter, groove, tempo, bass or lead with another song in the game (today's port is a highlife at 112 with interlocking guitars and
// a flute; today's sea fort a 7/8 sea-noir funk; its crab a surf rock).
//   'pb_past', "Every Ship That Came In" (the port long ago): rocksteady lo-fi at 74 in Bb. A one-drop (kick and rim on beat three),
//     an organ skanking on the off-beats, a round fretless bass, vinyl crackle, a steel-pan hook, a far foghorn every eight bars.
//   'pb_past_ship', "Below Deck" (aboard La Golondrina): 12/8 shanty-funk at 92 in D dorian. Stomps and hand claps on the big beats,
//     an accordion pumping chords, a tuba bass, creaking boards, a tenor-sax hook that answers itself.
//   'boss_pb_octopus', "Octopus Boogaloo": Latin boogaloo at 116 in G minor. A piano montuno, timbales and a cowbell, congas, a
//     tumbao bass, short brass stabs, the piano's hook doubled by the brass at the turnaround.
//   'pb_future', "Empty Harbor" (the port tomorrow): dub at 66 in E minor that fills in as people wake (PT_FUT.k()): waves and a
//     foghorn and a lonely kalimba first; then the dub kick, the hats, a deep bass and an echoing skank; healed, a muted trumpet and
//     the steel pan come home.
//   'pb_future_office', "Signal Lost" (the harbor office tomorrow): 11/8 (3+3+3+2) at 104 in B minor. Morse-code ticks, sonar pings,
//     a fretless bass in the odd bar, Rhodes chords, rim clicks.
//   'boss_pb_albatross', "Wings Over the Breakwater": UK-garage two-step at 134 in A minor. A skippy kick, snares on two and four,
//     shuffled hats, a sub bass, stabs, chopped vowel vocals and a bright pluck arpeggio.
const PTMUSIC = (() => {
  const out = { songs: [], shanty: () => { try { Sound.play('learned'); } catch (e) { /* */ } } };
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return out;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);
  const add = (name, def) => { if (has(name)) return; try { Sound.addSong(name, def); out.songs.push(name); } catch (e) { console.error('[port music] ' + name, e); } };

  // ---------------------------------------------------------------- 'pb_past': Every Ship That Came In (rocksteady lo-fi, 74, Bb)
  {
    const CH = K.CH('Bb1: D4 F4 A4, Bb1: D4 F4 A4, Eb2: G3 Bb3 D4, F2: A3 C4 Eb4, G1: Bb3 D4 F4, Eb2: G3 Bb3 D4, C2: Eb4 G4 Bb4, F2: A3 C4 Eb4');
    const HOOK = K.mel('F5/2 D5/2 F5/2 G5/4 F5/2 | D5/2 C5/2 Bb4/8 r/4 | Eb5/2 G5/2 Bb5/4 A5/2 G5/2 | F5/12 r/4', 0);
    const BASS = [0, 7, 12, 10];
    add('pb_past', { bpm: 74, len: 128, swing: 0.06, vol: 0.3, verb: 0.2, echo: 0.14, echoSteps: 3, tone: 6200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      K.crackle(t, s16, 0.9);
      if (st === 8) { K.kick(t, 0.75); K.rim(t, 0.7); }
      if (st % 2 === 0) K.hat(t, st % 4 === 2 ? 0.28 : 0.14);
      if (st === 4 || st === 12) K.skank(ch.slice(1), t, 0.85);
      if (st === 6 || st === 14) K.organ(ch[1] + 12, t, s16 * 1.2, 0.25);
      if (st % 4 === 0) K.fretless(ch[0] + BASS[(st >> 2) & 3], t, s16 * 3.4, 0.8);
      const n = HOOK[i % 64]; if (n && (bar & 4)) K.pan(n[0], t, 0.55, n[1] * s16 * 1.1);
      if (st === 0 && (bar & 7) === 3) K.foghorn(40, t, 2.4, 0.25);
    } });
  }
  // ---------------------------------------------------------------- 'pb_past_ship': Below Deck (12/8 = 24 sixteenths, 92, D dorian)
  {
    const CH = K.CH('D2: F3 A3 C4, D2: F3 A3 C4, G1: B3 D4 F4, C2: E3 G3 Bb3, D2: F3 A3 C4, F1: A3 C4 E4, G1: B3 D4 F4, A1: C#4 E4 G4');
    const SAX = K.mel('A4/2 C5/2 D5/2 E5/6 D5/4 C5/2 A4/6 | G4/4 A4/2 C5/6 D5/12 | F5/2 E5/2 D5/2 C5/6 A4/4 C5/2 D5/6 | E5/12 D5/12', 0);
    add('pb_past_ship', { bpm: 92, len: 192, swing: 0, vol: 0.32, verb: 0.18, echo: 0.08, echoSteps: 3, tone: 6800, play(i, t, s16) {
      const bar = Math.floor(i / 24), st = i % 24, ch = CH[bar & 7];
      if (st === 0 || st === 12) K.stomp(t, st === 0 ? 0.95 : 0.75);
      if (st === 6 || st === 18) K.claps(t, 0.7);
      if (st % 4 === 2 && Math.random() < 0.5) K.board(t, 0.25);
      if (st % 6 === 0) K.accchord(ch.slice(1), t, s16 * 2.4, st % 12 === 0 ? 0.6 : 0.4);
      if (st === 0 || st === 12) K.tub(ch[0] + 12, t, s16 * 4, 0.85); else if (st === 8 || st === 20) K.tub(ch[0] + 19, t, s16 * 2, 0.5);
      const n = SAX[i % 192]; if (n && bar >= 2) K.lead(n[0], t, n[1] * s16 * 0.9, 'sax', 0.5);
    } });
  }
  // ---------------------------------------------------------------- 'boss_pb_octopus': Octopus Boogaloo (Latin boogaloo, 116, G minor)
  {
    const CH = K.CH('G1: Bb3 D4 F4, C2: Eb4 G4 Bb4, D2: F#3 A3 C4, G1: Bb3 D4 F4, Eb2: G3 Bb3 D4, C2: Eb4 G4 Bb4, D2: F#3 A3 C4, D2: F#3 A3 C4');
    const MONT = [0, 3, 5, 6, 8, 11, 13, 14];          // (the montuno's off-beat pushes)
    const HOOK = K.mel('D5/2 Bb4/2 G4/2 Bb4/2 D5/4 F5/4 | Eb5/2 D5/2 C5/2 Bb4/2 A4/8 | D5/2 F5/2 G5/4 F5/2 D5/2 Bb4/4 | A4/4 F#4/4 G4/8', 0);
    add('boss_pb_octopus', { bpm: 116, len: 128, swing: 0.04, vol: 0.42, verb: 0.14, echo: 0.08, echoSteps: 3, tone: 8200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      if (st === 0 || st === 10) K.kick(t, 0.85);
      if (st === 4 || st === 12) K.timbale(t, st === 12, 0.8);
      if (st % 2 === 0) K.shell(t, 0.5);
      if (st === 3 || st === 10) K.cowbell(t, 0.7, st === 10);
      if (st === 6 || st === 14) K.conga(t, 'hi', 0.8); else if (st === 7 || st === 15) K.conga(t, 'lo', 0.7); else if (st === 12) K.conga(t, 'slap', 0.7);
      if (MONT.includes(st)) K.piano(ch[1 + (st % 3)] + 12, t, s16 * 0.9, 0.55);
      if (st === 3 || st === 6 || st === 12) K.babybass(ch[0] + (st === 12 ? 7 : 0), t, s16 * 2.4, 0.85);
      if ((st === 2 || st === 10) && (bar & 1)) K.brass(ch.slice(1).map(m => m + 12), t, s16 * 1.1, 0.5);
      const n = HOOK[i % 64]; if (n && bar >= 2) { K.lead(n[0], t, n[1] * s16 * 0.85, 'tptlead', 0.42); if ((bar & 7) >= 6) K.piano(n[0], t, n[1] * s16, 0.4); }
    } });
  }
  // ---------------------------------------------------------------- 'pb_future': Empty Harbor (dub, 66, E minor; fills in as people wake)
  {
    const CH = K.CH('E2: G3 B3 D4, E2: G3 B3 D4, C2: E3 G3 B3, D2: F#3 A3 C4, E2: G3 B3 D4, A1: C4 E4 G4, B1: D#4 F#4 A4, B1: D#4 F#4 A4');
    const KAL = K.mel('B4/4 E5/4 G5/4 F#5/4 | E5/8 B4/8 | A4/4 D5/4 F#5/4 E5/4 | D#5/16', 0);
    const MUTE = K.mel('r/16 | E5/4 G5/4 B5/6 A5/2 | G5/8 E5/8 | r/16 | D5/4 F#5/4 A5/6 G5/2 | F#5/8 D#5/8', 0);
    const kNow = () => { try { return typeof PT_FUT !== 'undefined' && PT_FUT ? PT_FUT.k() : 0.2; } catch (e) { return 0.2; } };
    add('pb_future', { bpm: 66, len: 128, swing: 0.1, vol: 0.3, verb: 0.32, echo: 0.24, echoSteps: 3, tone: 5600, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7], k = kNow();
      K.crackle(t, s16, 1.1);
      if (st === 0 && (bar & 1) === 0) K.wave(t, s16 * 24, 0.6);
      if (st === 8 && (bar & 7) === 5) K.foghorn(38, t, 2.8, 0.3);
      const n = KAL[i % 64]; if (n) K.kalimba(n[0], t, 0.55 * (1 - k * 0.4), n[1] * s16 * 1.2);
      if (k > 0.4) { if (st === 8) K.dubkick(t, 0.8); if (st % 4 === 2) K.dubhat(t, 0.5, st === 14); if (st === 4 || st === 12) K.skank(ch.slice(1), t, 0.6); if (st === 0 || st === 6 || st === 10) K.dub(ch[0] + (st === 10 ? 7 : 0), t, s16 * 3, 0.8); }
      if (k > 0.85) { const m = MUTE[i % 128]; if (m) K.lead(m[0], t, m[1] * s16 * 0.95, 'mute', 0.42); if (st === 6 && (bar & 1)) K.pan(ch[2] + 12, t, 0.4, s16 * 2); }
    } });
  }
  // ---------------------------------------------------------------- 'pb_future_office': Signal Lost (11/8 = 22 sixteenths, 104, B minor)
  {
    const CH = K.CH('B1: D4 F#4 A4, B1: D4 F#4 A4, G1: B3 D4 F#4, A1: C#4 E4 G4, E2: G3 B3 D4, F#1: A#3 C#4 E4, G1: B3 D4 F#4, F#1: A#3 C#4 E4');
    const MORSE = [1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0];      // (a ship's call sign, over and over)
    const GROUPS = { 0: 0, 6: 7, 12: 10, 18: 5 };                                        // (3+3+3+2 eighths: the bass on each group)
    add('pb_future_office', { bpm: 104, len: 176, swing: 0, vol: 0.3, verb: 0.22, echo: 0.16, echoSteps: 3, tone: 6600, play(i, t, s16) {
      const bar = Math.floor(i / 22), st = i % 22, ch = CH[bar & 7];
      if (MORSE[st]) K.tick(t, st % 3 === 0, 0.55);
      if (st === 0) K.kick(t, 0.7); if (st === 12) K.rim(t, 0.8); if (st === 18) K.rim(t, 0.5);
      const g = GROUPS[st]; if (g !== undefined) K.fretless(ch[0] + g, t, s16 * 4.5, 0.75);
      if (st === 0 || st === 12) ch.slice(1).forEach((m, j) => K.epiano(m, t + j * 0.02, s16 * 5, 0.38));
      if (st === 6 && (bar & 1)) K.sonar(ch[1] + 24, t, 0.6);
      if (st === 20 && (bar & 3) === 3) K.sonar(ch[3] + 24, t, 0.5);
    } });
  }
  // ---------------------------------------------------------------- 'boss_pb_albatross': Wings Over the Breakwater (two-step, 134, A minor)
  {
    const CH = K.CH('A1: C4 E4 G4, F1: A3 C4 E4, C2: E3 G3 B3, G1: B3 D4 F4, A1: C4 E4 G4, D2: F3 A3 C4, E2: G#3 B3 D4, E2: G#3 B3 D4');
    const KICK = { 0: 1, 7: 0.7, 10: 0.85 }, VOX = ['a', 'o', 'e', 'o'];
    add('boss_pb_albatross', { bpm: 134, len: 128, swing: 0.16, vol: 0.42, verb: 0.14, echo: 0.1, echoSteps: 3, tone: 8800, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 7];
      const kk = KICK[st]; if (kk) K.kick(t, kk);
      if (st === 4 || st === 12) { K.snare(t, 0.8); K.clap(t, 0.5); }
      if (st % 2 === 1 || st === 6 || st === 14) K.hat(t, st % 4 === 3 ? 0.35 : 0.2, st === 14);
      if (st === 0 || st === 10) K.sub808(ch[0] + 12, t, s16 * (st === 0 ? 5 : 3), 0.85);
      if ((st === 3 || st === 11) && (bar & 1)) K.stab(ch.slice(1), t, s16 * 1.2, 0.45);
      if ((st === 6 || st === 14) && bar >= 2) K.vox(ch[1 + (bar & 1)] + 12, t, s16 * 1.4, 0.5, VOX[bar & 3], VOX[(bar + 1) & 3]);
      if (bar >= 4 && st % 2 === 0) K.pluck(ch[1 + ((st >> 1) % 3)] + 24, t, 0.45);
    } });
  }
  return out;
})();
