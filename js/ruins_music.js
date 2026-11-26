'use strict';
// The Sunken Ruins' two songs (region 7; RUINS.songAt picks them: 'ruins' in the canyon, 'ruins_temple' inside the temple).
//   'ruins', "Red Canyon Groove": 94 bpm, lightly swung, D minor (Dorian). A dusty boom-bap kick and snare under hand drums
//     (congas, a shaker, a clave in the B part), a fretless bass sliding round Dm9 · G9 · B♭maj7 · A7sus, wah-guitar chops on the
//     off-beats, and a whistled tune like wind over the mesas; the B part trades it for a kalimba. 16 bars (≈41 s): A (groove),
//     A + the whistle, B (new chords, the kalimba, the clave), A' (the whistle's answer), a conga fill closing each half.
//   'ruins_temple', "Under the Sand": 78 bpm, swung, F♯ minor. Lo-fi under stone: a dusty kick and snare, a rim and a tambourine,
//     a sub bass gliding under dark pads (F♯m9 · Dmaj9 · Bm9 · C♯7), handbells ringing a slow tune into the echo, water dripping,
//     a shakuhachi-like flute in the middle part, and a celesta run at the end of each phrase. 16 bars (≈49 s).
// Neither phonk nor orchestral: funky game music for the canyon, lo-fi hip-hop for the temple.
(() => {
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);

  // ---------------------------------------------------------------- 'ruins': the canyon
  if (!has('ruins')) {
    const A = K.CH('D2: F3 A3 C4 E4, G2: F3 A3 B3 E4, Bb1: D3 F3 A3 C4, A1: G3 C4 D4 E4');
    const Bc = K.CH('G2: F3 Bb3 D4, A1: G3 C#4 E4, D2: F3 A3 C4, F2: E3 A3 C4');
    const MEL = K.mel('A4/2 C5 D5/4 F5/2 E5 D5/4 | r/2 C5 A4/2 G4/4 A4/6 | D5/2 F5 G5/4 A5/2 G5 F5 E5 | E5/8 r/8', 64);
    K.mel('A5/2 G5 F5/4 E5/2 D5 C5/4 | D5/4 A4/4 C5/2 D5/6 | F5/2 E5 D5 C5 A4/4 G4/2 A4/2 | D5/12 r/4', 192, MEL);
    const CONGA = ['lo', null, null, 'hi', null, null, 'hi', 'mute', null, null, 'lo', 'hi', null, null, 'slap', null];
    Sound.addSong('ruins', { bpm: 94, len: 256, swing: 0.1, vol: 0.34, verb: 0.14, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, b4 = bar & 3, B = bar >= 8 && bar < 12, ch = (B ? Bc : A)[b4], fill = (bar === 7 || bar === 15) && st >= 12;
      // drums: a dusty boom-bap, the hand drums over it
      if (!fill) {
        if (st === 0 || st === 10 || (st === 6 && bar & 1) || (st === 13 && b4 === 3)) K.dustkick(t, st === 0 ? 1 : 0.7);
        if (st === 4 || st === 12) { K.dustsnare(t, 0.85); if (B) K.clap(t, 0.35); }
        if (st % 4 === 2) K.dusthat(t, 0.9); else if (st % 2 === 0) K.dusthat(t, 0.45);
      } else { K.conga(t, st % 2 ? 'hi' : 'lo', 0.9); if (st === 15) K.conga(t + s16 * 0.5, 'slap', 0.8); }
      K.shaker(t, st % 4 === 2 ? 0.55 : 0.3);
      const cg = CONGA[st]; if (cg && !fill && bar >= 2) K.conga(t, cg, cg === 'slap' ? 0.8 : 0.65);
      if (B && (st === 0 || st === 3 || st === 6 || st === 10 || st === 12)) K.clave(t, 0.5);
      K.crackle(t, s16, 0.4);
      // bass: a fretless line round the chord
      const r = ch[0];
      if (st === 0) K.fretless(r, t, s16 * 3, 1);
      else if (st === 3) K.fretless(r + 12, t, s16 * 1.2, 0.7);
      else if (st === 6) K.fretless(r + 7, t, s16 * 1.5, 0.8);
      else if (st === 8 && !fill) K.fretless(r, t, s16 * 2, 0.85);
      else if (st === 11) K.fretless(r + 10, t, s16 * 1.2, 0.7);
      else if (st === 14) K.fretless(r + 12, t, s16 * 1.4, 0.75);
      // wah chops on the off-beats; a warm Rhodes on the one in the B part
      if ((st === 2 || st === 6 || st === 10 || st === 14) && bar >= 1) K.wahgtr(ch.slice(1).map(m => m + 12), t, st === 10 ? 0.9 : 0.65, s16 * 0.9);
      if (B && st === 0) ch.slice(1).forEach(m => K.epiano(m, t, s16 * 10, 0.42, 0.8));
      // the whistle (A, A'), the kalimba (B)
      const n = MEL[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'whistle', 0.85);
      if (B && st % 2 === 0) { const tones = ch.slice(1), m = tones[((st >> 1) + b4) % tones.length] + 12; K.kalimba(m, t, st % 4 === 0 ? 0.75 : 0.5, 0.6); }
      if (bar === 15 && st === 0) K.swirl(t, s16 * 14, 0.5);
    } });
  }

  // ---------------------------------------------------------------- 'ruins_temple': the sunken temple
  if (!has('ruins_temple')) {
    const C = K.CH('F#1: A3 C#4 E4 G#4, D2: F#3 A3 C#4 E4, B1: A3 D4 F#4 C#5, C#2: B3 F4 G#4');
    const BELL = K.mel('F#5/4 A5/2 G#5/2 E5/8 | C#5/4 E5/4 F#5/8 | A5/4 B5/2 A5/2 G#5/4 E5/4 | F#5/16', 64);
    K.mel('C#6/4 B5/2 A5/2 F#5/8 | E5/4 F#5/4 A5/8 | G#5/4 F#5/4 E5/4 C#5/4 | F#5/16', 192, BELL);
    const FLUTE = K.mel('C#5/6 B4/2 A4/8 | F#4/4 A4/4 B4/8 | C#5/4 E5/4 D5/4 C#5/4 | B4/12 r/4', 128);
    const DRIP = [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0];
    Sound.addSong('ruins_temple', { bpm: 78, len: 256, swing: 0.2, vol: 0.32, verb: 0.24, echo: 0.16, echoSteps: 4, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, b4 = bar & 3, ch = C[b4], mid = bar >= 8 && bar < 12, intro = bar < 2;
      // drums: soft and dusty, the snare comes in after the intro
      if (st === 0 || st === 10 || (st === 7 && bar & 1)) K.dustkick(t, st === 0 ? 0.9 : 0.6);
      if (!intro && (st === 4 || st === 12)) K.dustsnare(t, 0.7);
      if (st % 2 === 0) K.dusthat(t, st % 4 === 2 ? 0.7 : 0.35);
      if (st === 15 && b4 === 3) K.rim(t, 0.6);
      if (st === 8 && !intro) K.tamb(t, 0.6, b4 === 1);
      K.crackle(t, s16, 0.8);
      // the sub under the pads
      if (st === 0) K.subglide(ch[0], t, s16 * 7, 0.9);
      else if (st === 10) K.subglide(ch[0] + 7, t, s16 * 4, 0.7);
      if (st === 0) ch.slice(1).forEach(m => K.darkpad(m, t, s16 * 16, 1));
      // water dripping in the dark (higher in the middle part)
      if (DRIP[st] && (bar & 1)) K.drip((mid ? 96 : 91) + ((bar * 5 + st) % 5) * 2, t, 0.7);
      // the handbells' tune; the flute in the middle; a celesta run to close each phrase
      const n = BELL[i]; if (n) K.handbell(n[0], t, 0.9);
      const f = FLUTE[i]; if (f) K.lead(f[0], t, f[1] * s16 * 0.95, 'shaku', 0.75);
      if (b4 === 3 && st >= 10 && st % 2 === 0) K.celesta(ch[1 + ((st - 10) >> 1) % (ch.length - 1)] + 24, t, 0.55, 0.8);
      if (intro && st === 0) K.handbell(ch[1] + 12, t, 0.5);
    } });
  }
})();
