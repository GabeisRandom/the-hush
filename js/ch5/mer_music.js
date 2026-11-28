'use strict';
// Chapter 5, «Meridiana» (CH5-W1): the city's songs, each its own instruments, groove, tempo, key and form (the variety lesson). Funky
// game music and hip-hop, never phonk, never film orchestra; every melody is the game's own.
//   'mer_train'  «Window Seat» (the ride home): a city-pop ballad at 92 in E♭: Rhodes sevenths, a chorus guitar's arpeggios, a fretless bass,
//                brushes and a rim, a soprano sax singing the hook; a glockenspiel answers as the city comes up.
//   'mer_centro' «Noon Avenue» (Barrio del Faro): city pop / boogie at 112 in D: a Linn kick on every beat, a gated snare, a DX piano's bell
//                chords, a Juno bass bouncing octaves, synth-brass stabs, the chorus guitar chopping offbeats, a square-wave hook.
//   'mer_home'   «The Flat Upstairs» (home): warm acoustic soul at 76 in F: an upright piano, a kalimba tune, a baby bass, brushes, a shaker.
//   'mer_uni'    «Office Hours» (Ciudad Universitaria): jazzy boom-bap at 90 in A minor: a swung kit, a walking upright, a vibraphone hook,
//                record scratches on the turnarounds, a muted-trumpet answer.
//   'mer_market' «Harbor Haggle» (Mercado del Puerto): horn-section funk at 116 in G mixolydian: congas, a timbale, a cowbell, a clav riff,
//                a slap bass, a brass section's riff, the sax calling like a vendor.
//   'mer_battle' «Talk Over» (the noise's fights): hip-hop / funk-rock at 152 in E minor: a 909 kick, claps, a chopper bass, overdriven power
//                chords, chopped vowel stabs, zaps: everyone shouting at once.
//   'mer_boss'   «Feedback» (el Megáfono, el Gran Pregón): 160 in F♯ phrygian: a reese bass, double-time hats, a choir's stabs, the overdriven
//                guitar, the Noon Avenue hook bent out of shape and fighting back; the key steps up each loop.
const MERMUSIC = (() => {
  const TITLES = { mer_train: 'Window Seat', mer_centro: 'Noon Avenue', mer_home: 'The Flat Upstairs', mer_uni: 'Office Hours', mer_market: 'Harbor Haggle', mer_battle: 'Talk Over', mer_boss: 'Feedback' };
  const out = { TITLES, songs: [] };
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return out;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);
  const add = (name, def) => { if (has(name)) return; try { Sound.addSong(name, def); out.songs.push(name); } catch (e) { console.error('[mer music] ' + name, e); } };
  const safe = (fn, ...a) => { try { fn(...a); } catch (e) { /* (an instrument this build doesn't have) */ } };
  const CG = (t, k, v) => safe(K.conga, t, k, v);
  // the city's hook (D major), shared by Noon Avenue and Feedback (bent there)
  const HOOK = K.mel('F#5/2 A5/2 B5/2 A5/2 F#5/4 E5/4 | D5/2 E5/2 F#5/2 A5/6 r/4 | B5/2 A5/2 F#5/2 E5/2 D5/4 B4/4 | D5/2 E5/2 D5/12', 0);
  // ---------------------------------------------------------------- «Window Seat»
  {
    const CH = K.CH('Eb2: G3 Bb3 D4 F4, C2: G3 Bb3 Eb4 F4, Ab1: G3 C4 Eb4 F4, Bb1: Ab3 C4 D4 F4');
    const SAX = K.mel('Bb4/4 C5/2 Eb5/2 F5/6 Eb5/2 | G5/4 F5/2 Eb5/2 C5/8 | Ab4/4 Bb4/2 C5/2 Eb5/4 F5/4 | G5/2 F5/2 Eb5/12', 0);
    add('mer_train', { bpm: 92, len: 128, swing: 0.1, vol: 0.34, verb: 0.26, echo: 0.12, echoSteps: 3, tone: 7200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3], b8 = bar & 7;
      if (st === 0 || st === 10) K.kick(t, 0.5); if (st === 4 || st === 12) K.rim(t, 0.6); if (st % 2 === 0) K.brush(t, st % 4 === 2 ? 0.8 : 0.5, 0.12);
      if (st === 0) ch.slice(1).forEach((m, k) => K.epiano(m, t + k * 0.014, s16 * 7, 0.5)); if (st === 8) ch.slice(1).forEach((m, k) => K.epiano(m + 12, t + k * 0.01, s16 * 4, 0.22));
      if (st % 4 === 2) safe(K.chorusgtr, [ch[1 + ((st >> 2) % 4)] + 12], t, s16 * 2, 0.35);
      if (st === 0) K.fretless(ch[0] + 12, t, s16 * 6, 0.7); if (st === 7) K.fretless(ch[0] + 19, t, s16 * 2, 0.5); if (st === 10) K.fretless(ch[0] + 24, t, s16 * 4, 0.5);
      const n = SAX[i % 64]; if (n && b8 >= 2) K.lead(n[0], t, n[1] * s16 * 0.95, 'sax', 0.42);
      if (b8 >= 6 && st % 4 === 0) K.glock(ch[1 + ((st >> 2) & 3)] + 24, t, 0.3);
    } });
  }
  // ---------------------------------------------------------------- «Noon Avenue»
  {
    const CH = K.CH('D2: F#3 A3 C#4 E4, B1: F#3 A3 D4 E4, G1: F#3 B3 D4 E4, A1: G3 C#4 E4 F#4');
    add('mer_centro', { bpm: 112, len: 256, swing: 0.04, vol: 0.33, verb: 0.18, echo: 0.08, echoSteps: 3, tone: 8200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3], b16 = bar & 15;
      if (st % 4 === 0) K.linnkick(t, 0.8); if (st === 4 || st === 12) K.gatesnare(t, 0.7); if (st % 2 === 1) K.hat(t, 0.32, st === 15);
      if (st % 4 === 2) K.shaker(t, 0.5);
      if ([0, 3, 6, 8, 11, 14].includes(st)) K.junobass(ch[0] + 12 + (st % 6 === 3 ? 12 : 0), t, s16 * 1.4, 0.62);
      if (st === 0) ch.slice(1).forEach((m, k) => K.dxpiano(m + 12, t + k * 0.01, s16 * 3, 0.32));
      if (st === 6 || st === 14) safe(K.chorusgtr, ch.slice(1).map(m => m + 12), t, s16 * 0.9, 0.42);
      if ((st === 10 && (bar & 1)) || st === 2) K.polybrass(ch.slice(1).map(m => m + 12), t, s16 * 1.2, 0.36);
      const n = HOOK[i % 64]; if (n && b16 >= 4) K.lead(n[0], t, n[1] * s16 * 0.9, 'square', 0.32);
      if (b16 === 15 && st >= 8 && st % 2 === 0) K.tom(t, 0.5);
    } });
  }
  // ---------------------------------------------------------------- «The Flat Upstairs»
  {
    const CH = K.CH('F2: A3 C4 E4 G4, D2: A3 C4 F4 G4, Bb1: A3 D4 F4 G4, C2: Bb3 D4 E4 G4');
    const KAL = K.mel('C6/2 A5/2 G5/2 F5/2 G5/4 r/4 | A5/2 C6/2 D6/2 C6/2 A5/8 | G5/2 F5/2 D5/2 F5/2 G5/4 A5/4 | F5/16', 0);
    add('mer_home', { bpm: 76, len: 128, swing: 0.18, vol: 0.34, verb: 0.24, echo: 0.1, echoSteps: 3, tone: 6600, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3];
      if (st === 0 || st === 9) K.feltkick ? safe(K.feltkick, t, 0.55) : K.kick(t, 0.4); if (st === 4 || st === 12) K.brush(t, 0.9, 0.2); if (st % 2 === 0) K.shaker(t, 0.32);
      if (st === 0 || st === 6) ch.slice(1).forEach((m, k) => K.piano(m, t + k * 0.02, s16 * (st ? 4 : 6), 0.42));
      if (st === 0) safe(K.babybass, ch[0] + 12, t, s16 * 5, 0.7); if (st === 10) safe(K.babybass, ch[0] + 19, t, s16 * 3, 0.5);
      const n = KAL[i % 64]; if (n) safe(K.kalimba, n[0] - 12, t, 0.5);
    } });
  }
  // ---------------------------------------------------------------- «Office Hours»
  {
    const CH = K.CH('A1: G3 C4 E4 B4, D2: F3 A3 C4 E4, G1: F3 B3 D4 E4, E2: D4 G#3 B3 F4');
    const VIB = K.mel('E5/3 G5/1 A5/4 C6/2 B5/2 A5/4 | G5/3 E5/1 D5/4 E5/8 | C5/3 D5/1 E5/4 G5/2 A5/2 B5/4 | A5/12 r/4', 0);
    const WALK = [[0, 3, 5, 7], [0, 2, 3, 5], [0, 4, 7, 9], [0, 3, 6, -1]];
    add('mer_uni', { bpm: 90, len: 128, swing: 0.28, vol: 0.3, verb: 0.2, echo: 0.1, echoSteps: 3, tone: 7000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3], b8 = bar & 7;
      if (st === 0 || st === 10 || (st === 7 && (bar & 1))) K.kick(t, 0.75); if (st === 4 || st === 12) K.snare(t, 0.55); if (st % 2 === 0) K.hat(t, st % 4 === 2 ? 0.42 : 0.24);
      if (st % 4 === 0) K.upright(ch[0] + 12 + WALK[bar & 3][st >> 2], t, 0.8, s16 * 3.2);
      if (st === 2 || st === 11) ch.slice(1).forEach((m, k) => K.epiano(m, t + k * 0.012, s16 * 2.5, 0.3, 0.6));
      const n = VIB[i % 64]; if (n) K.vibes(n[0], t, 0.55, n[1] * s16 * 1.4);
      if (b8 === 7 && (st === 12 || st === 14)) K.scrape(t, s16 * 1.6, 0.7, 3200, 70);
      if (b8 === 3 && st === 12) K.lead(69, t, s16 * 3, 'mute', 0.35);
    } });
  }
  // ---------------------------------------------------------------- «Harbor Haggle»
  {
    const CH = K.CH('G2: B3 D4 F4, C3: E4 G4 Bb4, G2: B3 D4 F4, D3: F#4 A4 C5');
    const RIFF = [67, 0, 70, 0, 72, 0, 70, 67, 0, 65, 0, 67, 0, 0, 62, 65];
    const CALL = K.mel('D5/2 G5/2 F5/2 D5/2 C5/4 D5/4 | r/8 G5/2 F5/2 D5/4 | F5/2 G5/2 Bb5/2 G5/2 F5/4 D5/4 | C5/2 D5/2 r/12', 0);
    add('mer_market', { bpm: 116, len: 256, swing: 0.06, vol: 0.37, verb: 0.14, echo: 0.06, echoSteps: 3, tone: 8400, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3], b16 = bar & 15;
      if (st === 0 || st === 7 || st === 10) K.funkkick(t, 0.8); if (st === 4 || st === 12) K.fsnare(t, 0.65); if (st % 2 === 1) K.hat(t, 0.24);
      if (st % 4 === 2) K.cowbell(t, 0.35, st === 10);
      CG(t, ['open', 'slap', 'mute', 'open'][st & 3], st % 2 ? 0.45 : 0.6);
      if (b16 % 4 === 3 && st >= 12) K.timbale(t, st % 2 === 0, 0.7);
      const r = RIFF[st]; if (r) K.clav(r - (bar & 2 ? 5 : 0), t, 0.5);
      if ([0, 3, 6, 10, 13].includes(st)) K.fslap(ch[0] + (st === 10 ? 12 : 0), t, s16 * 1.2, 0.65, st === 13);
      if ((st === 6 || st === 14) && (bar & 1)) K.brass(ch.slice(1).map(m => m + 12), t, s16 * (st === 14 ? 2 : 1), 0.5, 1.1);
      const n = CALL[i % 64]; if (n && b16 >= 8) K.lead(n[0], t, n[1] * s16 * 0.9, 'sax', 0.45);
    } });
  }
  // ---------------------------------------------------------------- «Talk Over»
  {
    const CH = K.CH('E2: G3 B3 D4, C2: G3 C4 E4, D2: F#3 A3 D4, B1: F#3 B3 D4');
    const VOW = ['a', 'e', 'o', 'a'];
    add('mer_battle', { bpm: 152, len: 256, swing: 0, vol: 0.3, verb: 0.12, echo: 0.06, echoSteps: 2, tone: 9000, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, ch = CH[bar & 3], b16 = bar & 15;
      if (st === 0 || st === 6 || st === 10 || (st === 13 && (bar & 1))) K.k909(t, 0.85); if (st === 4 || st === 12) { K.cl909(t, 0.7); K.gatesnare(t, 0.45); }
      K.ch909(t, st % 2 ? 0.35 : 0.2); if (st === 2 && (bar & 3) === 3) K.oh909(t, 0.4);
      if ([0, 3, 6, 8, 10, 14].includes(st)) K.chopper(ch[0] + 12 + (st === 14 ? 12 : st === 10 ? 7 : 0), t, s16 * 1.1, 0.7, st === 14);
      if (st === 0 || st === 8) K.odgtr(ch[0] + 24, t, s16 * (st ? 3 : 5), 0.4); if (st === 0) K.odgtr(ch[0] + 31, t, s16 * 5, 0.32);
      if (b16 >= 4 && (st === 6 || st === 14)) K.vox(ch[1] + 12, t, s16 * 0.7, 0.4, VOW[(bar + st) & 3], 'a');
      if (b16 >= 8 && st % 8 === 3) K.stab(ch.slice(1).map(m => m + 12), t, s16 * 0.8, 0.45);
      if (b16 === 15 && st === 8) K.zap(t, 0.5, 3000, 200);
      if (st === 0 && (bar & 7) === 0) K.crash(t, 0.6);
    } });
  }
  // ---------------------------------------------------------------- «Feedback»
  {
    const CH = K.CH('F#1: A3 C#4 E4, G1: B3 D4 F#4, E1: G3 B3 E4, F#1: A#3 C#4 F#4');
    add('mer_boss', { bpm: 160, len: 256, swing: 0, vol: 0.31, verb: 0.14, echo: 0.08, echoSteps: 2, tone: 9200, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, up = (bar >> 3) & 1 ? 2 : 0, ch = CH[bar & 3].map(m => m + up), b16 = bar & 15;
      if (st % 4 === 0 || st === 14) K.kick(t, 0.9); if (st === 4 || st === 12) { K.snare(t, 0.7); K.claps(t, 0.5); } K.hat(t, st % 2 ? 0.3 : 0.18);
      if (st % 2 === 0) K.reese(ch[0] + 12, t, s16 * 1.8, 0.55);
      if (st === 0 || st === 3 || st === 6) K.odgtr(ch[0] + 24, t, s16 * 2.4, 0.42);
      if (st === 0 && (bar & 1) === 0) K.vox(ch[1] + 12, t, s16 * 6, 0.32, 'o', 'a');
      if (st === 8 || st === 11) K.stab(ch.slice(1).map(m => m + 12), t, s16, 0.4);
      const n = HOOK[i % 64]; if (n && b16 >= 8) K.lead(n[0] - 4 + up + (st % 8 === 7 ? 1 : 0), t, n[1] * s16 * 0.8, 'moog', 0.38);
      if (b16 === 7 && st === 12) K.zap(t, 0.6, 4200, 120);
      if (st === 0 && (bar & 3) === 0) K.crash(t, 0.55);
    } });
  }
  // previews (the dev server's /shot saves them as .png: rename to .wav)
  out.render = async (name, sec = 26) => {
    const r = await Sound._render(name, sec, { buffer: true, rate: 44100 }); if (!r || !r.buf) return null;     // ({ peak, rms, nan, buf })
    const saved = typeof FBM !== 'undefined' && FBM._ && FBM._.save ? await FBM._.save(r.buf, 'ch5_music_' + name) : null;
    return { saved, sec: +r.buf.duration.toFixed(1), peak: r.peak, rms: r.rms, nan: r.nan };
  };
  return out;
})();
