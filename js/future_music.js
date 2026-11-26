'use strict';
// The Future's two songs (FUTURE.song() picks them: 'future' in gray Alba; 'future_bell' once the Great Silence is out of the
// bell tower, until the bell rings).
//   'future', "Tomorrow, Unwritten": 86 bpm, half-time trip-hop funk in B♭ minor (B♭m9 · G♭maj7 · E♭m9 · F7♭9). A soft felt kick
//     and a brushed half-time snare, a wah bass that skips and stops, muted clav chops, a slow tick-tock of woodblocks (the
//     clock), a low warm pad, and a glassy FM-bell tune with notes missing: the Hush swallows them. As you speak and color
//     comes back to Alba (FUTURE's k), the missing notes come back too, and the hats join in. 16 bars (≈45 s).
//   'future_bell', "The Silence Comes Down": 128 bpm, straight funk-rock in D minor (Dm · B♭ · Gm · A7). A tremolo guitar riff,
//     a slapped chopper bass in octaves, a tight kick and clap, and the cracked bell tolling its three notes out of tune every
//     two bars; in the middle a brassy FM lead answers the bell, then a breakdown of bell and swell. 16 bars (≈30 s).
// Neither phonk nor orchestral: eerie, sparse funk for the gray town; tense funk-rock under the Silence.
(() => {
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);
  // how much color is back in tomorrow's Alba (0.12 … 1); previews use their own
  let previewK = null;
  const colorK = () => (previewK !== null ? previewK : typeof FUTURE !== 'undefined' && FUTURE.inside && FUTURE._.S ? (FUTURE._.S().k || 0.12) : 0.5);

  // ---------------------------------------------------------------- 'future': the gray town
  if (!has('future')) {
    const C = K.CH('Bb1: Db3 F3 Ab3 C4, Gb1: F3 Bb3 Db4, Eb2: Gb3 Bb3 Db4 F4, F1: Eb3 A3 Gb4');
    // the tune: glassy, high, leaving room; the second half answers higher
    const MEL = K.mel('r/4 F5/2 Db5/2 C5/4 Ab4/4 | Bb4/6 r/2 Db5/4 E5/4 | F5/2 Gb5/2 F5/4 Db5/4 Bb4/4 | C5/12 r/4', 64);
    K.mel('r/4 Ab5/2 Gb5/2 F5/4 Db5/4 | Eb5/6 r/2 F5/4 A5/4 | Bb5/2 Ab5/2 Gb5/4 F5/4 Db5/4 | E5/8 F5/8', 192, MEL);
    // which notes the Hush has eaten (a fixed pattern, so the tune always has the same holes) and which come back first
    const EAT = MEL.map((n, i) => (n ? ((i * 37 + 11) % 100) / 100 : 0));
    const BASS = [[0, 4, 1], [3, 1.2, 0.7], [6, 1.4, 0.8], [10, 2.5, 0.9], [14, 1, 0.6]];     // [step, length, level]: it skips, then waits
    Sound.addSong('future', { bpm: 86, len: 256, swing: 0.18, vol: 0.42, verb: 0.2, echo: 0.18, echoSteps: 3, tone: 7200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, b4 = bar & 3, ch = C[b4], k = colorK(), intro = bar < 2, brk = bar === 12 || bar === 13;
      // drums: a felt kick, a brushed half-time snare on three; hats only once some color is back
      if (!brk) {
        if (st === 0 || st === 7 || (st === 10 && !intro)) K.feltkick(t, st === 0 ? 1 : 0.7);
        if (st === 8 && !intro) { K.brush(t, 1.4, 0.32); K.clap(t, 0.22); }
        if (st === 15 && b4 === 3) K.brush(t, 0.8, 0.12);
        if (k > 0.3 && st % 2 === 0) K.hat(t, st % 4 === 2 ? 0.28 * k : 0.14 * k);
      }
      // the clock: tick (high) and tock (low) on the beats, louder in the intro and the break
      if (st % 4 === 0) K.woodblock(t, (st >> 2) % 2 === 0, intro || brk ? 0.9 : 0.45);
      // the bass: skips, stops; the Hush holds some notes back until color returns
      for (const [s, len, v] of BASS) if (st === s && !brk && !(intro && s > 0)) { if (s === 3 && k < 0.25) continue; K.wahbass(ch[0] + (s === 6 ? 12 : s === 14 ? 7 : 0), t, len * s16, v); }
      // clav chops on the off-beats, muted and few
      if (!intro && !brk && (st === 2 || st === 11 || (st === 14 && b4 % 2 === 1))) K.clav(ch[1 + (st % (ch.length - 1))] + 12, t, 0.55);
      if (!intro && !brk && st === 6 && k > 0.45) K.clav(ch[ch.length - 1] + 12, t, 0.4);
      // the pad underneath, and a swell into each four bars
      if (st === 0) ch.slice(1).forEach(m => K.warmpad(m, t, s16 * 16, brk ? 0.9 : 0.55));
      if (b4 === 3 && st === 8) K.swell(t, s16 * 8, 0.5);
      // the glass tune, with holes in it (fewer as color comes back)
      const n = MEL[i]; if (n && !intro && EAT[i] < 0.45 + k * 0.6) K.glass(n[0], t, 0.85, Math.max(0.5, n[1] * s16 * 1.4));
      if (brk && st % 4 === 0) K.glass(ch[1 + ((st >> 2) % (ch.length - 1))] + 24, t, 0.4, 1.4);
      if (st === 0 && Math.random() < 0.3) K.crackle(t, s16, 0.3);
    } });
  }

  // ---------------------------------------------------------------- 'future_bell': under the Great Silence
  if (!has('future_bell')) {
    const C = K.CH('D2: F3 A3 D4, Bb1: F3 Bb3 D4, G1: G3 Bb3 D4, A1: G3 C#4 E4');
    const RIFF = [0, 0, 12, 0, 10, 0, 7, 0, 0, 0, 12, 0, 15, 12, 10, 7];          // the tremolo guitar's riff, over each chord's root
    const LEAD = K.mel('A5/4 G5/2 F5/2 E5/4 D5/4 | F5/6 E5/2 D5/4 A4/4 | Bb5/4 A5/2 G5/2 F5/4 E5/4 | E5/12 r/4', 128);
    const BELL = [62, 61, 57];         // D, C♯, A: the cracked bell's three notes
    Sound.addSong('future_bell', { bpm: 128, len: 256, swing: 0, vol: 0.33, verb: 0.16, echo: 0.12, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, b4 = bar & 3, ch = C[b4], mid = bar >= 8 && bar < 12, brk = bar === 12 || bar === 13;
      // drums: tight, straight; the break drops them
      if (!brk) {
        if (st === 0 || st === 6 || st === 10 || (st === 14 && b4 === 3)) K.kick(t, st === 0 ? 1 : 0.8);
        if (st === 4 || st === 12) { K.snare(t, 0.8); K.clap(t, 0.45); }
        K.hat(t, st % 2 ? 0.25 : 0.5, st === 14);
        if (st === 0 && bar % 4 === 0) K.crash(t, 0.4);
      }
      // the chopper bass: octaves, slapped and popped
      if (!brk && (st % 4 === 0 || st === 3 || st === 11)) K.chopper(ch[0] + (st % 8 === 4 ? 12 : 0), t, s16 * 1.6, 0.9, st % 8 === 4);
      // the tremolo guitar's riff (A and the end), chords in the middle
      if (!mid && !brk && st % 2 === 0) K.tremgtr(ch[0] + 24 + RIFF[st], t, s16 * 1.8, 0.7);
      if (mid && st % 8 === 0) ch.slice(1).forEach(m => K.tremgtr(m + 12, t, s16 * 7, 0.5));
      // the cracked bell: its three notes every two bars, each struck with a twin a little out of tune
      if (bar % 2 === 0 && (st === 0 || st === 3 || st === 6)) { const m = BELL[st / 3]; K.bell(m, t, 0.7); K.bell(m + 0.37, t + 0.012, 0.45); }
      if (brk && st % 4 === 0) { K.bell(BELL[(st >> 2) % 3] - 12, t, 0.8); K.bell(BELL[(st >> 2) % 3] - 11.6, t + 0.01, 0.5); }
      if (brk && st === 0 && bar === 12) K.swell(t, s16 * 30, 0.8);
      // the FM lead answers the bell in the middle
      const n = LEAD[i]; if (n && mid) K.fmlead(n[0], t, n[1] * s16 * 0.95, 0.85, 3);
    } });
  }

  // previews (tests): FUTURE_MUSIC.render(name, sec, k) → the audio buffer
  window.FUTURE_MUSIC = { setPreviewK(k) { previewK = k; }, colorK };
})();
