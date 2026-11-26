'use strict';
// Chapter 4's finale's songs (finale.js / finale_stage.js / finale_credits.js pick them). Funky and warm, never phonk or epic
// orchestral; every melody is the game's own. They bring back the concert's «Toda voz cuenta» (past_music.js 'past_fest': its trumpet
// hook and the eight bells' carillon) and the Old Tower's music box (oldtower_boss.js 'ot_climb', sagging flat in 'boss_hooded').
//   'fin_rise', "The Rise" (the climb): lo-fi soul at 80 in D dorian. The tower's music box, in tune at last, over dusty drums, felt
//     piano and an upright; the key goes up a step every two bars, like the bell marks lighting on the way up.
//   'fin_clock', "Eight O'Clock" (the great clock set to eight, the wings): neo-soul at 72 in F. A Rhodes, brushed drums, a warm pad,
//     the music box's tune played straight by a flugelhorn; a tick and a bell at the turn.
//   'fin_speech', "Toda voz cuenta (otra vez)" (the speech): 96 in G, one groove in three times. Long ago, an old soul record (crackle,
//     Hammond, a round bass, the trumpet hook); today, Rhodes lo-fi funk (clean drums, a wah guitar, the hook on flugelhorn); tomorrow,
//     future funk (synth bass, claps, the hook on celesta and glockenspiel: tomorrow's glass-bell tune, whole). It follows FINSTAGE.act().
//   'fin_bells', "Every Bell" (the laugh, the bells, the curtain call): funk at 112 in G. Horns, claps, a tambourine, slap bass, a choir
//     pad; the trumpet hook answered by the glockenspiel and the music box; all the valley's bells on the turns.
//   'fin_credits', "Paper Lanterns" (the credits): Nujabes-style lo-fi hip-hop at 88 in C. Felt piano ninths, an upright, a breathy
//     flute singing the motif slowed and swung; one bell at the end of each round.
//   'fin_silence': the held breath after the slip (a far tick, nothing else).
const FINMUSIC = (() => {
  const TITLES = { fin_rise: 'The Rise', fin_clock: 'Eight O’Clock', fin_speech: 'Toda voz cuenta (otra vez)', fin_bells: 'Every Bell', fin_credits: 'Paper Lanterns' };
  const out = { TITLES, songs: [] };
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return out;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);
  const add = (name, def) => { if (has(name)) return; try { Sound.addSong(name, def); out.songs.push(name); } catch (e) { console.error('[finale music] ' + name, e); } };
  // the concert's hook (G major), and the tower's music box re-barred in 4/4 (D dorian): both the game's own
  const HOOK_G = K.mel('D5/2 E5/2 G5/4 A5/2 B5/2 | A5/2 G5/2 E5/4 D5/8 | G5/2 A5/2 B5/4 D6/2 B5/2 | A5/2 G5/2 A5/12', 0);
  const BOX_D = K.mel('D6/2 F6/2 A6/4 G6/2 F6/2 E6/4 | D6/2 C6/2 A5/8 r/4 | D6/2 F6/2 A6/4 C7/2 A6/2 G6/4 | F6/4 E6/4 D6/8', 0);
  const BELLS = [67, 71, 74, 79, 74, 71, 67, 62];          // (the carillon: G B D G D B G D)

  // ---------------------------------------------------------------- 'fin_rise': The Rise (lo-fi soul, 80, D dorian, rising)
  {
    const CH = K.CH('D2: F3 A3 C4 E4, A#1: D3 F3 A3 D4, G1: F3 A#3 D4 A4, A1: G3 C4 D4 E4');
    const UP = [0, 0, 2, 2, 3, 3, 5, 5];
    add('fin_rise', { bpm: 80, len: 128, swing: 0.12, vol: 0.32, verb: 0.24, echo: 0.14, echoSteps: 3, tone: 6200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, up = UP[bar & 7], ch = CH[bar & 3];
      K.crackle(t, s16, 0.7);
      if (st === 0 || st === 10 || (st === 7 && (bar & 1))) K.dustkick(t, st === 0 ? 0.85 : 0.55);
      if (bar >= 1 && (st === 4 || st === 12)) K.dustsnare(t, 0.6);
      if (st % 2 === 0) K.dusthat(t, st % 4 === 2 ? 0.6 : 0.35);
      if (st === 0) ch.slice(1).forEach((m, k) => K.felt(m + up, t + k * 0.012, s16 * 7, 0.5));
      if (st === 8) ch.slice(1).forEach((m, k) => K.felt(m + up + 12, t + k * 0.01, s16 * 5, 0.28));
      if (st % 4 === 0) K.upright(ch[0] + up + 12 + [0, 7, 12, 10][(st >> 2) & 3], t, 0.75, s16 * 3.2);
      const n = BOX_D[(i % 64)]; if (n) K.mbox(n[0] + up - 12, t, 0.75, 0, n[1] * s16 * 1.6);
      if (st === 0 && (bar & 1) === 0) K.bell(62 + up, t, 0.22);
    } });
  }
  // ---------------------------------------------------------------- 'fin_clock': Eight O'Clock (neo-soul, 72, F)
  {
    const CH = K.CH('A#1: D4 F4 A4 C5, A1: C4 E4 G4 B4, G1: A#3 D4 F4 A4, C2: A#3 D4 E4 A4');
    const TUNE = K.mel('F5/2 A5/2 C6/4 A#5/2 A5/2 G5/4 | F5/2 E5/2 C5/8 r/4 | F5/2 A5/2 C6/4 D6/2 C6/2 A#5/4 | A5/4 G5/4 F5/8', 0);
    add('fin_clock', { bpm: 72, len: 128, swing: 0.16, vol: 0.3, verb: 0.28, echo: 0.12, echoSteps: 3, tone: 6800, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3], sec = bar >= 4;
      if (st === 0 || st === 9) K.dustkick(t, st === 0 ? 0.8 : 0.5);
      if (st === 4 || st === 12) K.dustsnare(t, 0.45);
      if (st % 2 === 0) K.dusthat(t, 0.3);
      if (st % 2 === 0) K.tick(t, st % 4 === 0, 0.35);
      if (st === 0) ch.slice(1).forEach((m, k) => K.epiano(m, t + k * 0.015, s16 * 7, 0.55));
      if (st === 10) ch.slice(1).forEach((m, k) => K.epiano(m, t + k * 0.01, s16 * 4, 0.32));
      if (st === 0 && (bar & 1) === 0) ch.slice(1).forEach(m => K.warmpad(m - 12, t, s16 * 30, 0.16));
      if (st === 0) K.upright(ch[0] + 12, t, 0.8, s16 * 5); if (st === 7) K.upright(ch[0] + 19, t, 0.5, s16 * 2); if (st === 12) K.upright(ch[0] + 24, t, 0.45, s16 * 3);
      const n = TUNE[i % 64];
      if (n && !sec) K.mbox(n[0], t, 0.6, 0, n[1] * s16 * 1.4);
      if (n && sec) K.lead(n[0] - 12, t, n[1] * s16 * 0.95, 'flugel', 0.55);
      if (bar === 7 && st === 12) K.bell(65, t, 0.35);
    } });
  }
  // ---------------------------------------------------------------- 'fin_speech': Toda voz cuenta (otra vez) (96, G; three times)
  {
    const CH = K.CH('G2: B3 D4 G4, E2: B3 E4 G4, C2: C4 E4 G4, D2: A3 D4 F#4');
    const actNow = () => { try { const a = typeof FINSTAGE !== 'undefined' && FINSTAGE ? FINSTAGE.act() : null; return a === 'past' || a === 'future' || a === 'now' ? a : a === 'all' ? 'all' : 'now'; } catch (e) { return 'now'; } };
    add('fin_speech', { bpm: 96, len: 128, swing: 0.2, vol: 0.24, verb: 0.18, echo: 0.08, echoSteps: 3, tone: 6400, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3], a = actNow(), hook = (bar & 7) >= 4;
      const n = HOOK_G[i % 64];
      if (a === 'past') {            // an old soul record
        K.crackle(t, s16, 1);
        if (st === 0 || st === 10) K.kick(t, 0.6); if (st === 4 || st === 12) { K.claps(t, 0.45); K.tamb(t, 0.5, true); } else if (st % 2 === 0) K.tamb(t, 0.2);
        if (st % 4 === 2) K.hammond(ch.slice(1), t, s16 * 1.4, 0.38);
        if (st === 0) K.roundbass(ch[0], t, s16 * 1.6, 0.8); if (st === 6) K.roundbass(ch[0] + 7, t, s16 * 1.4, 0.6); if (st === 8) K.roundbass(ch[0] + 12, t, s16 * 1.2, 0.55);
        if (n && hook) K.lead(n[0], t, n[1] * s16 * 0.95, 'trumpet', 0.5);
      } else if (a === 'future') {   // future funk
        if (st === 0 || st === 7 || st === 10) K.kick(t, 0.65); if (st === 4 || st === 12) K.claps(t, 0.5); if (st % 2 === 1) K.hat(t, 0.3);
        if (st === 0 || st === 3 || st === 8 || st === 11) K.synbass(ch[0] + (st === 3 || st === 11 ? 12 : 0), t, s16 * 1.3, 0.55);
        if (st === 0) ch.slice(1).forEach(m => K.warmpad(m, t, s16 * 15, 0.18));
        if (n) { K.celesta(n[0] + 12, t, 0.5, n[1] * s16 * 1.2); if (hook) K.glock(n[0] + 12, t, 0.45); }
      } else {                       // today: Rhodes lo-fi funk (and all three at the end: everything at once)
        if (st === 0 || st === 10) K.kick(t, 0.6); if (st === 4 || st === 12) K.snare(t, 0.4); if (st % 2 === 0) K.hat(t, st % 4 === 2 ? 0.35 : 0.2);
        if (st === 0) ch.slice(1).forEach((m, k) => K.epiano(m, t + k * 0.012, s16 * 6, 0.45)); if (st === 9) ch.slice(1).forEach(m => K.epiano(m, t, s16 * 3, 0.25));
        if (st % 4 === 2) K.wahgtr(ch.slice(1).map(m => m + 12), t, 0.35);
        if (st === 0 || st === 6) K.fslap(ch[0] + 12 + (st ? 7 : 0), t, s16 * 1.3, 0.55);
        if (n && hook) K.lead(n[0], t, n[1] * s16 * 0.95, 'flugel', 0.45);
        if (a === 'all') { if (st % 4 === 2) K.hammond(ch.slice(1), t, s16 * 1.2, 0.25); if (n) K.glock(n[0] + 12, t, 0.3); }
      }
      if (st === 0 && (bar & 7) === 0) K.bell(67, t, 0.25);
    } });
  }
  // ---------------------------------------------------------------- 'fin_bells': Every Bell (funk, 112, G)
  {
    const CH = K.CH('G2: B3 D4 F#4 A4, C2: C4 E4 G4 B4, A1: C4 E4 G4 B4, D2: A3 C4 F#4 B4');
    add('fin_bells', { bpm: 112, len: 256, swing: 0.06, vol: 0.32, verb: 0.16, echo: 0.06, echoSteps: 3, tone: 8000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, b8 = bar & 7, ch = CH[bar & 3], half = bar >= 8;
      if (st === 0 || st === 6 || st === 10) K.funkkick(t, st === 0 ? 0.9 : 0.7);
      if (st === 4 || st === 12) { K.claps(t, 0.75); K.snare(t, 0.35); }
      if (st % 2 === 0) K.tamb(t, st % 4 === 0 ? 0.45 : 0.25); if (st % 2 === 1) K.hat(t, 0.25);
      if ([0, 3, 6, 8, 11, 14].includes(st)) K.fslap(ch[0] + 12 + (st === 11 ? 12 : st === 6 ? 7 : 0), t, s16 * 1.2, 0.65, st === 11);
      if ((st === 6 || st === 14) && bar >= 1) K.brass(ch.slice(1).map(m => m + 12), t, s16 * (st === 14 ? 1.8 : 0.9), 0.5, 1.1);
      if (st === 0 && (bar & 1) === 0) K.vox(ch[1] + 12, t, s16 * 28, 0.35, 'a', 'o');
      const n = HOOK_G[i % 64];
      if (n && !half) K.lead(n[0], t, n[1] * s16 * 0.95, 'trumpet', 0.6);
      if (n && half) { K.glock(n[0] + 12, t, 0.6); const b = BOX_D[i % 64]; if (b && (bar & 1)) K.mbox(b[0] - 7, t, 0.5, 0, b[1] * s16); }
      if (b8 === 7 && st % 2 === 0) K.bell(BELLS[(st >> 1) & 7], t, 0.5);
    } });
  }
  // ---------------------------------------------------------------- 'fin_credits': Paper Lanterns (lo-fi hip-hop, 88, C)
  {
    const CH = K.CH('C2: E3 G3 B3 D4, B1: D3 F#3 A3 C4, A1: C4 E4 G4 B4, D2: C4 F#4 A4 E5');
    const FL = K.mel('r/8 G5/3 A5/1 B5/4 | A5/3 G5/1 E5/4 D5/8 | r/8 G5/3 A5/1 B5/3 D6/1 | B5/3 A5/1 G5/4 A5/8', 0);
    add('fin_credits', { bpm: 88, len: 128, swing: 0.22, vol: 0.3, verb: 0.22, echo: 0.12, echoSteps: 3, tone: 6000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3];
      K.crackle(t, s16, 0.9);
      if (st === 0 || st === 10 || (st === 7 && (bar & 1) === 1)) K.dustkick(t, st === 0 ? 0.9 : 0.6);
      if (st === 4 || st === 12) K.dustsnare(t, 0.7);
      if (st % 2 === 0) K.dusthat(t, st % 4 === 2 ? 0.7 : 0.4); else if (st === 15) K.dusthat(t, 0.3);
      if (st === 0) ch.slice(1).forEach((m, k) => K.felt(m, t + k * 0.012, s16 * 6, 0.55));
      if (st === 7) ch.slice(1).forEach((m, k) => K.felt(m + 12, t + k * 0.01, s16 * 4, 0.3));
      if (st === 0) K.upright(ch[0] + 12, t, 0.9, s16 * 4); else if (st === 6) K.upright(ch[0] + 19, t, 0.65, s16 * 3); else if (st === 10) K.upright(ch[0] + 24, t, 0.6, s16 * 2);
      const n = FL[i % 64]; if (n && bar >= 2) K.lead(n[0], t, n[1] * s16 * 1.05, 'flute', 0.5);
      if (bar === 7 && st === 8) K.bell(72, t, 0.4);
    } });
  }
  // ---------------------------------------------------------------- 'fin_silence': the held breath (a far tick, once a bar)
  add('fin_silence', { bpm: 60, len: 16, vol: 0.2, play(i, t) { if (i === 0) K.tick(t, false, 0.25); } });
  return out;
})();
