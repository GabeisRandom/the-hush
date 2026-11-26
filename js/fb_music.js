'use strict';
// The final battle's suite, «Toda voz cuenta» (FB1; DESIGN.md 21.11). Reworked after the user's first listen ("doesn't feel intense
// enough… like I'm fighting something much stronger than me… but we persevere"): dramatic game-rock, original throughout (the games
// the user named set the intensity only). Never phonk, never film-score orchestra; the funk lives on as rhythm (syncopated bass, horn
// hits). Two motifs at war in every song:
//   the Hush's motif   down, chromatic, unstoppable: E D♯ D C♯ C B B♭… (choir, church organ, brass in octaves)
//   the heroes' motif  up: our own concert's hook, «Toda voz cuenta» (past_music.js 'past_fest'), at half speed. In the top's first
//                      phase it's buried and choked off after three notes; each phase it fights a phrase further; in the fury it
//                      gets all the way to its last note and is crushed; at the core's finisher it takes over, in D major.
// Every song follows FBM.state, so the game drives the layers and the sections:
//   'boss_fb_top'  «Nobody Hears You» (168, E phrygian): the top of the Old Tower. A lap: a wall (three huge unison hits on E, B♭
//                  and F, a silence with one tick of the clock, then the riff slams in) · A 8, relentless (the chromatic riff on a
//                  distorted bass and an overdriven guitar, double-kick runs, the Hush's motif on the choir) · B 8, desperate (the
//                  heroes' motif tries, and the Hush's stabs cut it off) · K 4, a half-time breakdown (the cracked bell, the
//                  heartbeat, the church organ) · U 4, a build (double kick, a snare roll, the heroes' first notes climbing) · A…
//                  state.top: 'today' · 'yesterday' (a church organ, crackle, the masks' «HA!» at the cuts) · 'tomorrow' (acid
//                  arpeggios, the clock ticking twice as fast); a change lands on the next bar line after a fill.
//   'boss_fb_fury' «All Three Hours» (176): the fury. Everything at once, the double kick never stops, and the key rises a
//                  semitone every loop (six times, then the wall again).
//   'fb_rage'      «Shh» (168): three giant stomps on a cluster (E, F, B♭, B), the band collapsing (a bass sliding down to
//                  nothing, a reversed swell into one last choked slam), then the dread: a low organ cluster, a heartbeat, a far
//                  choir, the cracked bell (it loops).
//   'fb_realm'     «Inside the Silence» (84, D): state.trial picks the color, state.prog (0…1) how far it has got. 0 the walk
//                  (downtempo jazz) · 1 «Sin voz» (dread: a low organ cluster on D and E♭, a heartbeat, a far choir on a diminished
//                  chord, creaks, the old tower's music box sagging; one more phrase of it for every page read, and the cluster
//                  resolves at the end) · 5 the descent to the core (dread rising: a clock ticking faster, the Hush's motif on the
//                  low organ, the heartbeat quickening, a choir climbing). (Its old trial colors 2–4 are the fallback for the songs below.)
//   'fb_t2'        «El espejo» (116, D minor → D major): crystal-rock. Glass arpeggios and a ticking mirror over a heartbeat kick,
//                  a sub and hats; each crack (state.prog
//                  sixths) shatters a glass cluster and adds the band: half-time drums and a sub, then full time, a chopper bass and a
//                  choir, then guitars, horns and crashes. The motif plays upside down on the vibes until it rights itself on the
//                  trumpet; at the end, in D major, in octaves with the flugelhorn under it.
//   'fb_t3'        «La risa» (108 shuffle, F): the concert's band, out of tune and mocking (falling «ha-ha-ha» chops, a muted trumpet
//                  half a step flat), coming back in tune with each truth: the horn section, claps, a sax under the motif; at the end
//                  the same band, warm, the hall laughing with him.
//   'fb_t4'        «Sus palabras» (88, D): gospel-rock that builds with each word given back: the organ comping and a humming
//                  choir over a bass, a kick and a tambourine; the
//                  drums, the bass and the claps; the horns and the choir singing out; the motif whole, trumpets in octaves.
//   'boss_fb_core' «Every Voice» (172, B phrygian): the core. A wall · A 8 (the core's riff) · B 8 (the Hush's motif on everything;
//                  the heroes manage one note and are crushed) · K · U. Once state.elio: the heroes' motif comes in strong in B,
//                  and a bridge (R 8) has the trumpet and Elio's flugelhorn trading it. state.fin: a bar's roll, then «Toda voz
//                  cuenta» in D major, 16 bars (half time, then full speed), the bell and the choir (its full-speed half again
//                  until state.end). state.end (the finisher has landed; the user's pick, "end on a bang"): one last full-speed
//                  run of the motif (8 bars, the whole band, the horns in octaves), a two-bar roll with a rising swell, three
//                  huge hits on D (the last the biggest) and a hard stop: silence. FBM._.core.hitAt[2] is the last hit's time on
//                  Sound.ctx's clock: the core shatters on it, and Elio's voice comes back in the silence.
// Previews: await FBM._.render(name, seconds, [[step, { state }], …]) → { buf, … }; FBM._.save(buf, 'fb1_name') posts a WAV to the dev
// server's /shot (it lands as fb1_name.png: rename it to .wav).
const FBM = (() => {
  const state = { top: 'today', trial: 0, prog: 0, elio: false, fin: false, end: false };
  const api = { state, _: {} };
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return api;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);
  // a bass line with popped notes: 'E2/2 ^E3/1 r/1 …' (^ a pop; length in sixteenths, carried over) → by step [midi, length, pop]
  function bl(str, at = 0, into = []) {
    let p = at, len = 2;
    for (let tok of str.split(/[\s|]+/)) {
      if (!tok) continue;
      let pop = false; if (tok[0] === '^') { pop = true; tok = tok.slice(1); }
      const [n, l] = tok.split('/'); if (l) len = +l;
      if (n !== 'r') into[p] = [K.nn(n), len, pop];
      p += len;
    }
    return into;
  }
  const M = (s, at = 0, into) => K.mel(s, at, into);
  const form = list => [].concat(...list.map(([s, n]) => Array.from({ length: n }, (_, k) => [s, k])));
  function dia(m, steps, scale) {
    const pc = ((m % 12) + 12) % 12; let i = scale.indexOf(pc), o = Math.floor(m / 12);
    if (i < 0) return m + (steps < 0 ? -3 : 3);
    i += steps; while (i < 0) { i += scale.length; o--; } while (i >= scale.length) { i -= scale.length; o++; }
    let n = o * 12 + scale[i]; if (steps < 0 && n >= m) n -= 12; if (steps > 0 && n <= m) n += 12;
    return n;
  }
  // a conductor: counts bars from the scheduler's steps (and copes with skipped steps after a stall)
  function conductor() {
    return { abs: -1, last: -1, bar: -1, start(i) { return this.last < 0 || i <= this.last; }, step(i) { this.last = i; const ab = i >> 4; if (ab === this.abs) return 0; const n = this.abs < 0 ? 1 : ab - this.abs; this.abs = ab; return n; } };
  }
  // ---------------------------------------------------------------- the heavy kit and the voices the fights share
  const H = {
    kick: (t, v = 1) => K.bigkick(t, v),
    dk: (t, v = 0.7) => K.rkick(t, v),
    snare: (t, v = 1) => { K.slam(t, v); K.fsnare(t, v * 0.55); },
    choir: (notes, t, len, v = 0.16, a = 'a', b = 'a') => notes.forEach((m, k) => K.vox(m, t + k * 0.004, len, v, a, b)),
    stab: (notes, t, len, v = 1) => { K.brass(notes, t, len, v, 1.35); K.stab(notes.map(m => m - 12), t, len, v * 0.8, 0.9); },
    pipe: (notes, t, len, v = 1) => notes.forEach(m => { K.organ(m, t, len, v); K.organ(m + 12, t, len, v * 0.5); }),
    bass: (m, t, len, v = 1) => { K.fuzzbass(m, t, len, v); if (len > 0.3) K.reese(m - 12, t, len, v * 0.6); },
    gtr: (m, t, len, v = 0.8) => K.odgtr(m, t, len, v, 0),
    // the Hush cutting the heroes off: a cluster on the choir and the horns, the china, a kick that hits like a door
    cut: (r, t, s16, v = 1) => { H.kick(t, v); K.china(t, 0.9 * v); K.odaiko(t, 0.7 * v); H.stab([r + 24, r + 25, r + 30], t, s16 * 3, 1.1 * v); H.choir([r + 12, r + 13, r + 18], t, s16 * 4, 0.22 * v, 'a', 'o'); K.sub808(r - 12, t, s16 * 4, 0.8 * v); },
  };
  // the heroes' motif («Toda voz cuenta» at half speed: 112 steps, G major's notes) and the Hush's (64 steps), written in E's world
  const HERO = M('D5/4 E5/4 G5/8 A5/4 B5/4 A5/4 G5/4 E5/8 D5/16 G5/4 A5/4 B5/8 D6/4 B5/4 A5/4 G5/4 A5/24');
  const HUSH = M('E5/8 D#5/8 D5/8 C#5/8 C5/8 B4/8 A#4/12 B4/4');
  // a motif note at step q, cut off at `cut` (its length shortened so it stops there): [midi, length] or null
  const heroAt = (q, cut = 999) => { const n = HERO[q]; return n && q < cut ? [n[0], Math.min(n[1], cut - q)] : null; };

  // ================================================================ 'boss_fb_top': Nobody Hears You (168, E phrygian)
  if (!has('boss_fb_top')) {
    const RA = 'E2/1 r/1 E2/1 E3/1 r/1 E2/1 F2/1 r/1 E2/1 r/1 G2/1 F#2/1 r/1 F2/1 E2/1 r/1';
    const RB = 'E2/1 r/1 E2/1 E3/1 r/1 E2/1 F2/1 r/1 E2/1 r/1 A#2/1 A2/1 r/1 G#2/1 G2/1 F2/1';
    const RC = 'G2/1 r/1 G2/1 G3/1 r/1 G2/1 G#2/1 r/1 G2/1 r/1 A#2/1 A2/1 r/1 G#2/1 G2/1 r/1';
    const RD = 'C3/1 r/1 C3/1 B2/1 r/1 A#2/1 r/1 A2/1 r/1 G#2/1 r/1 G2/1 F#2/1 F2/1 E2/1 D#2/1';
    const RIFF = { W: bl(['r/16', 'r/16', RA, RB].join(' | ')), A: bl([RA, RB, RA, RC, RA, RB, RC, RD].join(' | ')) };
    const AROOT = [0, 0, 0, 3, 0, 0, 3, 8], BROOT = [0, 0, -4, -4, -7, -7, -5, -5];
    const FORM = form([['W', 4], ['A', 8], ['B', 8], ['K', 4], ['U', 4]]), LOOP = 4;
    // where each band lets the heroes' motif get to before the Hush cuts it: [the step in B where a try starts, how far it gets]
    const TRIES = { today: [[0, 16], [64, 8]], yesterday: [[0, 28], [64, 36]], tomorrow: [[0, 88]] };
    const LEAD = { today: ['tptlead', 0.5], yesterday: ['mute', 0.72], tomorrow: ['rave', 0.7] };
    const cd = Object.assign(conductor(), { ph: 'today', pend: null, wait: 0, from: 16, hit: false });
    const bandOf = () => (TRIES[state.top] ? state.top : 'today');
    const E2 = 40;
    function drumsA(ph, k, st, t, s16) {
      if (st === 0 || st === 3 || st === 6 || st === 10) H.kick(t, st ? 0.85 : 1);
      if (k & 1 ? st >= 12 : st >= 8 && st < 12) H.dk(t, 0.55 + 0.04 * (st & 3));
      if (st === 4 || st === 12) H.snare(t, 1); else if (st === 7 || st === 15) K.fsnare(t, 0.16);
      K.ch909(t, st % 4 === 2 ? 0.7 : st & 1 ? 0.3 : 0.45); if (k >= 4 && !(st & 3)) K.ride(t, 0.4);
      if (st === 0 && (k === 0 || k === 4)) K.crash(t, 0.9);
      if (k === 7 && st >= 12) K.simtom(t, [260, 210, 170, 135][st - 12], 0.9);
      if (ph === 'yesterday') K.crackle(t, s16, 1);
      if (ph === 'tomorrow' && st % 2 === 0) K.tick(t, st % 4 === 0, 0.45);
    }
    function play(i, t, s16) {
      if (cd.start(i)) { cd.abs = -1; cd.bar = -1; cd.ph = bandOf(); cd.pend = null; cd.wait = 0; cd.hit = false; }
      const nb = cd.step(i), st = i & 15;
      if (nb) {
        for (let q = 0; q < nb; q++) { cd.bar++; if (cd.bar >= FORM.length) cd.bar = LOOP; }
        cd.hit = false;
        if (cd.pend) { if (cd.wait > 0) cd.wait--; else { cd.ph = cd.pend; cd.pend = null; cd.bar = LOOP; cd.hit = true; cd.from = 16; } }
      }
      const want = bandOf();
      if (want !== cd.ph && !cd.pend) { cd.pend = want; cd.wait = st > 8 ? 1 : 0; cd.from = st > 8 ? 8 : st; }
      if (cd.pend === cd.ph) cd.pend = null;
      const ph = cd.ph, [sec, k] = FORM[cd.bar], filling = !!cd.pend && !cd.wait && st >= cd.from;
      if (filling) {        // a fill into the next band: the snare climbing, toms, a brass fall
        const u = (st - cd.from) / Math.max(1, 15 - cd.from);
        H.snare(t, 0.35 + 0.65 * u); if (st % 2 === 0) H.dk(t, 0.7);
        if (st >= 12) K.simtom(t, [260, 210, 170, 135][st - 12], 1);
        if (st === 12) H.stab([E2 + 24, E2 + 30, E2 + 36], t, s16 * 2, 1);
        return;
      }
      if (cd.hit && st === 0) { H.cut(E2, t, s16, 1); K.crash(t, 1); }
      // ---- W: the wall
      if (sec === 'W') {
        if (k === 0) {
          const h = { 0: 0, 6: 6, 12: 1 }[st];
          if (h !== undefined) { const r = E2 + h; H.kick(t, 1); K.odaiko(t, 1); K.china(t, 0.9); if (!st) K.crash(t, 1); K.sub808(r - 12, t, s16 * 5, 1); H.bass(r, t, s16 * 5, 1); H.stab([r + 24, r + 31, r + 36], t, s16 * 4, 1.15); H.choir([r + 12, r + 19, r + 24], t, s16 * 5, 0.22, 'a', 'o'); K.hammond([r + 12, r + 13, r + 19], t, s16 * 5, 0.8, 7); }
          return;
        }
        if (k === 1) { if (st === 8) K.tick(t, true, 1); return; }
        const b = RIFF.W[k * 16 + st]; if (b) { H.bass(b[0], t, s16 * 0.9, 1); if (st === 0 || st === 3 || st === 6) H.gtr(b[0] + 12, t, s16 * 0.8, 0.75); }
        if (st === 0 && k === 2) { K.crash(t, 1); H.kick(t, 1); }
        if (k === 2 && st > 0) H.dk(t, 0.6); if (k === 3) { if (st < 8) H.dk(t, 0.65); else { H.snare(t, 0.4 + 0.08 * (st - 8)); } }
        return;
      }
      // ---- A: relentless; the Hush's motif on the choir and the organ, stabs on the riff's corners
      if (sec === 'A') {
        drumsA(ph, k, st, t, s16);
        const b = RIFF.A[k * 16 + st]; if (b) { H.bass(b[0], t, s16 * 0.9, 1); if (st === 0 || st === 3 || st === 6) H.gtr(b[0] + 12, t, s16 * 0.8, 0.7); }
        const r = E2 + AROOT[k];
        if (st === 0 && !(k & 1)) H.stab([r + 24, r + 25, r + 31], t, s16 * 1.5, 0.9);
        if ((k === 3 || k === 7) && st === 12) H.stab([E2 + 18, E2 + 24, E2 + 30], t, s16 * 3, 1);
        const hm = HUSH[(k & 3) * 16 + st];
        if (hm) { H.choir([hm[0] - 12, hm[0] - 5], t, hm[1] * s16, 0.11, 'o', 'o'); if (ph === 'yesterday') H.pipe([hm[0] - 12], t, hm[1] * s16 * 0.95, 0.8); }
        if (st === 0) K.hammond([r + 12, r + 13, r + 19], t, s16 * 15, 0.55, 6.6);
        if (ph === 'tomorrow') K.acid([r + 24, r + 27, r + 31, r + 34][st & 3] + (st & 8 ? 12 : 0), t, s16 * 0.8, 0.5, st % 4 === 0 ? 1 : 0, st & 1);
        return;
      }
      // ---- B: desperate: the heroes' motif tries and the Hush cuts it off; the Hush's motif answers
      if (sec === 'B') {
        const q = k * 16 + st, r = E2 + BROOT[k];
        if (st === 0 || st === 3 || st === 10) H.kick(t, 0.9); if ((k & 1) && st >= 12) H.dk(t, 0.6);
        if (st === 4 || st === 12) H.snare(t, 0.95);
        if (!(st & 1)) K.ch909(t, st % 4 === 2 ? 0.6 : 0.38);
        if (ph === 'yesterday') K.crackle(t, s16, 1); if (ph === 'tomorrow' && st % 4 === 0) K.tick(t, st % 8 === 0, 0.5);
        const pulse = { 0: [0, 6], 6: [0, 2], 8: [1, 4], 12: [0, 4] }[st]; if (pulse) H.bass(r + pulse[0], t, pulse[1] * s16 * 0.92, 0.95);
        if (st === 0) K.hammond([r + 12, r + 13, r + 19], t, s16 * 15, 0.45, 1.4);
        const [inst, lv] = LEAD[ph];
        let cutNow = false, inTry = false;
        for (const [s0, cut] of TRIES[ph]) {
          if (q >= s0 && q < s0 + cut) { inTry = true; const n = heroAt(q - s0, cut); if (n) K.lead(n[0], t, n[1] * s16 * 0.95, inst, lv); if (ph === 'tomorrow' && n) K.fmlead(n[0] - 12, t, n[1] * s16 * 0.9, 0.35, 2); }
          if (q === s0 + cut) cutNow = true;
        }
        if (cutNow) { H.cut(r, t, s16, 1); if (ph === 'yesterday') { for (let j = 0; j < 3; j++) K.vox(r + 31 - j * 2, t + (j + 1) * s16, s16 * 0.6, 0.2, 'a', 'a'); } }
        // the Hush's answer (its motif on the choir), whenever the heroes aren't trying
        if (!inTry) { const hm = HUSH[q % 64]; if (hm) { H.choir([hm[0] - 12, hm[0] - 5, hm[0]], t, hm[1] * s16, 0.12, 'a', 'o'); if (ph === 'yesterday') H.pipe([hm[0] - 12], t, hm[1] * s16, 0.9); } }
        if (k === 7 && st >= 8) K.simtom(t, [300, 260, 220, 190, 165, 145, 125, 110][st - 8], 0.85);
        return;
      }
      // ---- K: the breakdown: half time, the cracked bell, the heartbeat, the Hush's motif on the church organ
      if (sec === 'K') {
        if (st === 0) K.kick808(t, 0.95, 0.6); if (st === 3) K.kick808(t, 0.6, 0.45);
        if (st === 8) H.snare(t, 0.7);
        if (st === 0 && !(k & 1)) { K.bell(40 - 0.35, t, 0.6); H.choir(k < 2 ? [52, 55, 59] : [48, 52, 55], t, s16 * 30, 0.1, 'o', 'u'); K.fuzzbass(k < 2 ? 28 : 24, t, s16 * 30, 0.9); K.sub808(k < 2 ? 28 : 24, t, s16 * 8, 0.8); }
        const hm = HUSH[k * 16 + st]; if (hm) H.pipe([hm[0] - 12], t, hm[1] * s16 * 0.95, 1.1);
        if (ph === 'yesterday') K.crackle(t, s16, 1);
        return;
      }
      // ---- U: the build: the double kick, a snare roll, the heroes' first notes climbing (and stabbed back each time)
      if (sec === 'U') {
        H.dk(t, 0.45 + 0.03 * (k * 16 + st) / 4);
        if (k < 2 ? st % 4 === 0 : st % 2 === 0 || k === 3) H.snare(t, 0.3 + 0.012 * (k * 16 + st));
        if (k === 0 && st === 0) K.swell(t, s16 * 64, 1.2);
        if (st === 0) H.bass(E2, t, s16 * 7, 0.9); if (st === 8) H.bass(E2 + 1, t, s16 * 7, 0.9);
        const climb = [[62, 64, 67], [62, 64, 67, 69], [64, 67, 69, 71], [67, 69, 71, 74]][k], j = st >> 1;
        if (st < 8 && !(st & 1) && climb[j] !== undefined) K.lead(climb[j], t, s16 * 1.8, LEAD[ph][0], 0.6 + 0.1 * k);
        if (st === 8) H.stab([E2 + 24, E2 + 30], t, s16 * 2, 0.8 + 0.06 * k);
        if (k === 3 && st >= 12) K.simtom(t, [260, 210, 170, 135][st - 12], 1);
      }
    }
    Sound.addSong('boss_fb_top', { bpm: 168, len: 16 * 4096, from: 0, swing: 0, vol: 0.44, verb: 0.1, echo: 0.08, echoSteps: 3, play });
    api._.top = { cd, FORM };
  }

  // ================================================================ 'boss_fb_fury': All Three Hours (176): everything, the key rising
  if (!has('boss_fb_fury')) {
    const RA = 'E2/1 r/1 E2/1 E3/1 r/1 E2/1 F2/1 r/1 E2/1 r/1 G2/1 F#2/1 r/1 F2/1 E2/1 r/1';
    const RB = 'E2/1 E2/1 r/1 E3/1 E2/1 r/1 F2/1 E2/1 r/1 A#2/1 A2/1 r/1 G#2/1 G2/1 F2/1 E2/1';
    const RC = 'G2/1 r/1 G2/1 G3/1 r/1 G2/1 G#2/1 r/1 G2/1 r/1 A#2/1 A2/1 r/1 G#2/1 G2/1 r/1';
    const RD = 'C3/1 C3/1 B2/1 r/1 A#2/1 A2/1 r/1 G#2/1 G2/1 r/1 F#2/1 F2/1 r/1 E2/1 D#2/1 D2/1';
    const RIFF = bl([RA, RB, RA, RC, RA, RB, RC, RD].join(' | '));
    const AROOT = [0, 0, 0, 3, 0, 0, 3, 8], BROOT = [0, 0, -4, -4, -7, -7, -5, -5];
    const FORM = form([['W', 2], ['A', 8], ['B', 8], ['R', 2]]), LOOP = 2;
    const cd = Object.assign(conductor(), { lap: 0 });
    Sound.addSong('boss_fb_fury', { bpm: 176, len: 16 * 4096, from: 0, swing: 0, vol: 0.42, verb: 0.1, echo: 0.08, echoSteps: 3, play(i, t, s16) {
      if (cd.start(i)) { cd.abs = -1; cd.bar = -1; cd.lap = 0; }
      const nb = cd.step(i), st = i & 15;
      for (let q = 0; q < nb; q++) { cd.bar++; if (cd.bar >= FORM.length) { cd.lap++; cd.bar = cd.lap % 6 === 0 ? 0 : LOOP; } }
      const tr = cd.lap % 6, E2 = 40 + tr, [sec, k] = FORM[cd.bar];
      if (sec === 'W') {
        if (k === 0) { const h = { 0: 0, 4: 6, 8: 1, 12: 0 }[st]; if (h !== undefined) { const r = E2 + h; H.kick(t, 1); K.odaiko(t, 1); K.china(t, 0.9); K.sub808(r - 12, t, s16 * 3, 1); H.bass(r, t, s16 * 3, 1); H.stab([r + 24, r + 31, r + 36], t, s16 * 3, 1.15); H.choir([r + 12, r + 19, r + 24], t, s16 * 3, 0.22, 'a', 'o'); } return; }
        if (st === 0 || st === 3) K.kick808(t, st ? 0.6 : 1, 0.5);
        if (st >= 8) H.snare(t, 0.4 + 0.07 * (st - 8));
        return;
      }
      // the drums: the double kick never stops; snare on two and four; the china on every bar
      if ((st & 1) || ((k & 1) && st >= 8)) H.dk(t, 0.62); if (st % 4 === 0) H.kick(t, st === 0 || st === 8 ? 1 : 0.8);
      if (st === 4 || st === 12) H.snare(t, 1); K.ch909(t, st & 1 ? 0.35 : 0.6);
      if (st === 0) { K.china(t, 0.7); if (!(k & 1)) K.crash(t, 0.9); }
      if (sec === 'R') {       // the rise: up a semitone, the horns climbing chromatically into it
        H.snare(t, 0.4 + 0.035 * (k * 16 + st)); if (st >= 12 && k === 1) K.simtom(t, [280, 230, 190, 150][st - 12], 1);
        if (st % 4 === 0) { const up = k * 4 + (st >> 2); H.stab([E2 + 24 + up, E2 + 31 + up], t, s16 * 3, 0.9); }
        if (k === 0 && st === 0) K.swell(t, s16 * 32, 1.3);
        return;
      }
      const r = E2 + (sec === 'A' ? AROOT[k] : BROOT[k]);
      if (sec === 'A') {
        const b = RIFF[k * 16 + st]; if (b) { H.bass(b[0] + tr, t, s16 * 0.9, 1); if (st === 0 || st === 3 || st === 6 || st === 10) H.gtr(b[0] + tr + 12, t, s16 * 0.8, 0.75); }
        const hm = HUSH[(k & 3) * 16 + st];
        if (hm) { const m = hm[0] + tr; H.choir([m - 12, m - 5, m], t, hm[1] * s16, 0.15, 'a', 'o'); H.pipe([m - 12], t, hm[1] * s16, 0.9); K.brass([m - 12, m], t, hm[1] * s16 * 0.9, 0.55, 1.2); }
        if (st === 0) K.hammond([r + 12, r + 13, r + 19], t, s16 * 15, 0.6, 7.2);
        if (st === 8 && (k & 1)) H.stab([r + 24, r + 25, r + 30], t, s16 * 2, 1);
        return;
      }
      // B: the heroes all at once (trumpet, flugelhorn, sax) get to the very last note… and are crushed
      const q = k * 16 + st, pulse = { 0: [0, 3], 3: [0, 3], 6: [0, 2], 8: [1, 3], 11: [0, 3], 14: [0, 2] }[st];
      if (pulse) H.bass(r + pulse[0], t, pulse[1] * s16 * 0.9, 1);
      if (st === 0) K.hammond([r + 12, r + 19, r + 24], t, s16 * 15, 0.5, 6.8);
      const n = heroAt(q, 90);
      if (n) { const m = n[0] + tr, d = n[1] * s16 * 0.95; K.lead(m, t, d, 'tptlead', 0.95); K.lead(m - 12, t, d, 'flugel', 0.75); }
      if (q === 90) { H.cut(r, t, s16, 1.2); K.crash(t, 1); }
      if (q > 92) { const hm = HUSH[(q - 92) % 64]; if (hm) { const m = hm[0] + tr; H.choir([m - 12, m - 5, m], t, hm[1] * s16, 0.17, 'a', 'o'); H.pipe([m - 12], t, hm[1] * s16, 1); } }
    } });
    api._.fury = { cd };
  }

  // ================================================================ 'fb_rage': Shh (168): three giant stomps, the collapse, the dread
  if (!has('fb_rage')) {
    const CL = [40, 41, 46, 47];
    Sound.addSong('fb_rage', { bpm: 168, len: 112, from: 48, swing: 0, vol: 0.5, verb: 0.26, echo: 0.12, echoSteps: 6, play(i, t, s16) {
      if (i < 48) {
        const stomp = { 0: [0, 1], 5: [-1, 0.85], 10: [-2, 0.7] }[i];
        if (stomp) {
          const [d, v] = stomp;
          H.kick(t, v); K.odaiko(t, v, 1.6); K.china(t, v); K.slam(t, v); if (i === 0) { K.crash(t, 1); K.sub808(28, t, 2.6, 1); }
          H.bass(28 + d, t, s16 * 4, v); H.stab(CL.map(m => m + 12 + d), t, s16 * 4, 1.15 * v); H.choir(CL.map(m => m + d), t, s16 * 5, 0.24 * v, 'a', 'o');
          K.hammond(CL.map(m => m + d), t, s16 * 5, 0.9 * v, 7.5);
        }
        if (i === 16) K.tuba(40, t, s16 * 26, 1, 16);
        if (i === 16) K.swell(t, s16 * 16, 1.3);
        if (i === 32) { H.kick(t, 1); K.china(t, 1); H.stab(CL.map(m => m + 12), t, s16 * 0.6, 1.2); }
        if (i === 40) K.brush(t, 0.9, s16 * 7);
        return;
      }
      const j = i - 48, st = j & 15;
      if (st === 0) K.kick808(t, 0.9, 0.55); else if (st === 3) K.kick808(t, 0.55, 0.4);
      if (j === 0) { H.pipe([28, 29, 35], t, s16 * 64, 0.75); K.darkpad(40, t, s16 * 64, 0.7); }
      if (j === 0 || j === 32) H.choir([40, 43, 46], t, s16 * 30, 0.06, 'u', 'o');
      if (j === 16) K.bell(40 - 0.4, t, 0.35);
      if (st === 8) K.brush(t, 0.3, s16 * 6);
      if (j === 48) K.mbox(64, t, 0.3, 0.7, 2.5);
    } });
  }

  // ================================================================ 'fb_realm': Inside the Silence (84, D; each trial its color)
  if (!has('fb_realm')) {
    const Dm9 = 'D2: F3 A3 C4 E4', G13 = 'G1: F3 B3 E4', Bbj = 'Bb1: D4 F4 A4', C69 = 'C2: E4 A4 D5', Am7 = 'A1: G3 C4 E4', A7s9 = 'A1: C#4 G4 C5';
    const Gm9 = 'G1: Bb3 D4 F4 A4', C13 = 'C2: Bb3 E4 A4', Fj9 = 'F1: A3 C4 E4 G4', Eh7 = 'E2: D4 G4 Bb4', A7b9 = 'A1: C#4 G4 Bb4';
    const WALK = K.CH([Dm9, G13, Dm9, G13, Bbj, C69, Am7, A7s9, Gm9, C13, Fj9, Bbj, Eh7, A7b9, Dm9, Dm9].join(','));
    const FEST = K.CH('F2: A3 C4 E4, G1: B3 D4 F4, E2: G#3 D4 F4, A1: C4 E4 G4, C2: E3 G3 B3 D4, A1: C4 E4 G4, F2: A3 C4 E4, G1: B3 D4 F4');
    const THEME = M('r/4 A4/2 C5/2 D5/4 E5/4 | F5/6 E5/2 D5/4 C5/4 | D5/8 r/4 A4/2 C5/2 | D5/12 r/4 | F5/4 E5/2 D5/2 C5/4 A4/4 | G4/4 A4/2 C5/2 E5/8 | D5/6 C5/2 A4/4 G4/4 | A4/16 | '
      + 'G5/4 F5/2 D5/2 Bb4/4 A4/4 | C5/6 Bb4/2 A4/4 G4/4 | A4/4 C5/2 E5/2 G5/8 | F5/8 D5/8 | E5/4 D5/2 Bb4/2 G4/8 | C#5/4 E5/4 G5/4 Bb5/4 | A5/8 F5/4 E5/4 | D5/16');
    const MOTIF = M('G4/2 A4/2 C5/4 D5/2 E5/2 D5/2 C5/2 A4/4 G4/8 C5/2 D5/2 E5/4 G5/2 E5/2 D5/2 C5/2 D5/12');
    M('G4/2 A4/2 C5/4 D5/2 E5/2 D5/2 C5/2 A4/4 G4/8 A4/2 C5/2 D5/4 E5/2 D5/2 C5/16', 64, MOTIF);
    const MIRROR = M('G4/2 F4/2 D4/4 C4/2 B3/2 C4/2 D4/2 F4/4 G4/8 D4/2 C4/2 B3/4 G3/2 B3/2 C4/2 D4/2 C4/12');
    const cd = Object.assign(conductor(), { tri: 0, pend: null });
    const triOf = () => Math.max(0, Math.min(5, state.trial | 0));
    function laughR(t, s16, top, n, v, vw) { for (let j = 0; j < n; j++) K.vox(top - j * 2, t + j * s16, s16 * 0.6, v * (1 - j * 0.12), vw, vw); }
    Sound.addSong('fb_realm', { bpm: 84, len: 16 * 4096, from: 0, swing: 0, vol: 0.4, verb: 0.24, echo: 0.14, echoSteps: 3, play(i, t0, s16) {
      if (cd.start(i)) { cd.abs = -1; cd.bar = -1; cd.tri = triOf(); cd.pend = null; }
      const nb = cd.step(i), st = i & 15;
      if (nb) { cd.bar += nb; if (cd.pend !== null) { cd.tri = cd.pend; cd.pend = null; cd.bar = 0; } }
      if (triOf() !== cd.tri && cd.pend === null) { cd.pend = triOf(); if (st < 12) K.swell(t0, s16 * (16 - st), 0.6); }
      const tri = cd.tri, p = Math.max(0, Math.min(1, +state.prog || 0)), fest = tri === 3 || tri === 4;
      const bar = cd.bar % 16, b8 = cd.bar % 8, ch = fest ? FEST[b8] : WALK[bar], vo = ch.slice(1), r = ch[0];
      const sw = tri === 3 ? 0.3 : tri === 4 ? 0.12 : tri === 1 || tri === 5 ? 0 : 0.22, t = t0 + (st & 1 ? s16 * sw : 0);
      // ---- 1 «Sin voz» and 5 (the descent to the core): dread
      if (tri === 1 || tri === 5) {
        const down = tri === 5, res = !down && p >= 0.75;
        if (st === 0) K.kick808(t, down ? 0.7 : 0.55, 0.5); if (st === 3) K.kick808(t, down ? 0.45 : 0.35, 0.4);
        if (down && (st === 8 || st === 11)) K.kick808(t, st === 8 ? 0.6 : 0.4, 0.4);
        if (st === 0 && !(cd.bar & 1)) { H.pipe(res ? [38, 45] : [38, 39], t, s16 * 32, down ? 0.75 : 0.6); K.darkpad(res ? 50 : 51, t, s16 * 32, 0.5); }
        if (st === 0 && cd.bar % 4 === 0) H.choir(res ? [50, 53, 57] : down ? [50 + (cd.bar >> 2) % 4, 53 + (cd.bar >> 2) % 4, 56 + (cd.bar >> 2) % 4] : [50, 53, 56], t, s16 * 60, down ? 0.08 : 0.06, 'u', 'o');
        if (cd.bar % 4 === 1 && st === 8) K.scrape(t, 0.35, 0.28, 900, 16);
        if (st === 0 && cd.bar % 2 === 1) K.swell(t, s16 * 30, 0.22);
        if (down) {
          if (cd.bar % 8 < 4 ? st % 4 === 0 : st % 2 === 0) K.tick(t, st % 8 === 0, 0.55);
          const hm = HUSH[(cd.bar % 4) * 16 + st]; if (hm) H.pipe([hm[0] - 26], t, hm[1] * s16, 0.8);
          if (st === 0 && cd.bar % 8 === 0) K.bell(38 - 0.4, t, 0.4);
          return;
        }
        // the music box: one more two-bar phrase for each page read (prog 0, .25, .5, .75, 1), less and less flat
        const ph = (cd.bar % 8) >> 1, open = Math.round(p * 4), n = THEME[(cd.bar % 8) * 16 + st];
        if (ph < open && n) K.mbox(n[0] + 12, t, 0.75, 0.6 * (1 - p), Math.min(2.5, n[1] * s16 * 1.4));
        if (p >= 1 && st === 0) vo.forEach((m, j) => K.epiano(m, t + j * 0.012, s16 * 6, 0.4));
        return;
      }
      if (tri === 0 || tri === 2) {
        if (st === 0 || st === 10 || (st === 7 && (bar & 1))) K.dustkick(t, st === 0 ? 0.9 : 0.6);
        if (st === 4 || st === 12) K.sidestick(t, 0.55);
        if (!(st & 1)) K.brush(t, st % 4 === 2 ? 0.55 : 0.35, s16 * 1.4);
        K.crackle(t, s16, 0.35);
        const nx = WALK[(bar + 1) % 16][0];
        if (st === 0) K.upright(r, t, 1, s16 * 4); else if (st === 6) K.upright(r + 7, t, 0.75, s16 * 3); else if (st === 10) K.upright(r + 12, t, 0.7, s16 * 2); else if (st === 14) K.upright(nx - 1, t, 0.6, s16 * 2);
        if (tri === 0) {
          if (st === 0) vo.forEach((m, j) => K.epiano(m, t + j * 0.012, s16 * 6, 0.7)); if (st === 7) vo.forEach((m, j) => K.epiano(m, t + j * 0.01, s16 * 5, 0.45));
          const n = THEME[(cd.bar % 16) * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, cd.bar % 32 >= 24 ? 'flugel' : 'mute', 0.72);
          return;
        }
        if (st === 0) K.glass(vo[vo.length - 1] + 12, t, 0.45, 2.2);
        const q = (cd.bar % 8) * 16 + st, up = p >= 1 || (p >= 0.5 && cd.bar % 16 < 8), n = (up ? MOTIF : MIRROR)[q % 128];
        if (n) { K.vibe(n[0] + 12, t, n[1] * s16 * 1.2, 0.85); if (p >= 1) K.lead(n[0] + 12, t, n[1] * s16 * 0.95, 'flugel', 0.45); }
        if (p >= 1 && st === 0) K.warmpad(r + 12, t, s16 * 15, 0.7);
        return;
      }
      if (tri === 3) {
        const det = -0.45 * (1 - p);
        if (st === 0 || st === 10 || (st === 3 && b8 === 2)) K.kick(t, st === 0 ? 0.85 : 0.65);
        if (st === 4 || st === 12) { K.claps(t, 0.6); K.tamb(t, 0.6, true); } else if (!(st & 1)) K.tamb(t, 0.3);
        K.crackle(t, s16, 0.9);
        const off = { 0: [0, 1.6, 1], 3: [12, 1.2, 0.7], 6: [7, 1.6, 0.85], 8: [0, 1.6, 0.9], 11: [12, 1.2, 0.7], 14: [10, 1.2, 0.75] }[st];
        if (off) K.roundbass(r + off[0] + det, t, s16 * off[1], off[2]);
        if (st % 4 === 2) K.hammond(vo.map(m => m + det), t, s16 * 1.4, 0.5);
        if (st === 6 || st === 14) K.brass(vo.map(m => m + 12 + det), t, s16 * (st === 14 ? 1.6 : 0.9), 0.45, 0.9);
        const n = MOTIF[(cd.bar % 8) * 16 + st]; if (n) K.lead(n[0] + 12 + det, t, n[1] * s16 * 0.95, p >= 1 ? 'trumpet' : 'mute', 0.75);
        const mock = p < 1 && (st === 8 || st === 12) && (b8 % (p < 0.5 ? 1 : 2) === 0);
        if (mock) laughR(t, s16, vo[vo.length - 1] + 24 - Math.round(4 * p), st === 8 ? 3 : 2, 0.5 - 0.25 * p, p < 0.5 ? 'a' : 'e');
        if (p >= 1 && b8 === 7 && st === 8) { laughR(t, s16 * 1.6, vo[vo.length - 1] + 12, 4, 0.3, 'o'); for (let j = 0; j < 6; j++) K.hclap(t + s16 * (j * 0.7 + Math.random() * 0.3), 0.35); }
        return;
      }
      // 4: an organ and gospel claps, a layer for each word given back (prog: 0, 1/3, 2/3, 1)
      const w = Math.round(p * 3), nxr = FEST[(b8 + 1) % 8][0];
      if (st === 0) K.hammond(vo, t, s16 * 15, 0.6, w >= 2 ? 6.6 : 1.2);
      if (st === 0) K.roundbass(r, t, s16 * 5, 1); else if (st === 6) K.roundbass(r + 7, t, s16 * 2, 0.7); else if (st === 8) K.roundbass(r, t, s16 * 3, 0.85); else if (st === 12) K.roundbass(r + 12, t, s16 * 2, 0.7); else if (st === 14) K.roundbass(nxr - 1, t, s16 * 2, 0.6);
      if (w >= 1) { if (st === 0 || st === 10) K.dustkick(t, 0.85); if (st === 4 || st === 12) { K.hclap(t, 0.8); K.claps(t, 0.4); } if (!(st & 1)) K.tamb(t, st % 4 === 2 ? 0.5 : 0.3); }
      if (w >= 2 && st === 0) { K.brass(vo.map(m => m + 12), t, s16 * 15, 0.4, 0.8); K.vox(vo[vo.length - 1] + 12, t, s16 * 15, 0.15, 'o', 'a'); }
      if (w >= 3) { const n = MOTIF[(cd.bar % 8) * 16 + st]; if (n && cd.bar % 8 < 4) K.lead(n[0] + 12, t, n[1] * s16 * 0.95, 'flugel', 0.85); }
    } });
    api._.realm = { cd };
  }

  // ================================================================ the three middle trials, each a song of its own (the user's quality
  // bar after «Every Voice»: full band, real builds, nothing softened). state.prog (0…1) adds the layers.
  const MOTIFD = M('A4/2 B4/2 D5/4 E5/2 F#5/2 E5/2 D5/2 B4/4 A4/8 D5/2 E5/2 F#5/4 A5/2 F#5/2 E5/2 D5/2 E5/12 '
    + 'A4/2 B4/2 D5/4 E5/2 F#5/2 E5/2 D5/2 B4/4 A4/8 B4/2 D5/2 E5/4 F#5/2 E5/2 D5/16');          // (the heroes' motif at full speed, in D)
  const MIRD = M('A4/2 G4/2 E4/4 D4/2 C4/2 D4/2 E4/2 G4/4 A4/8 E4/2 D4/2 C4/4 A3/2 C4/2 D4/2 E4/2 D4/12 '
    + 'A4/2 G4/2 E4/4 D4/2 C4/2 D4/2 E4/2 G4/4 A4/8 G4/2 E4/2 D4/4 C4/2 D4/2 E4/16');            // (upside down: what the reflection plays)
  // ---------------------------------------------------------------- 'fb_t2' «El espejo» (116, D minor → D major): crystal-rock
  if (!has('fb_t2')) {
    const CH2 = K.CH('D2: F3 A3 D4 E4, A#1: D4 F4 A4, F2: A3 C4 F4, C2: E3 G3 C4 D4, G1: A#3 D4 G4, A#1: D4 F4 A4, A1: D4 E4 A4, A1: C#4 E4 G4');
    const CH2M = K.CH('D2: F#3 A3 D4 E4, G1: B3 D4 G4, B1: D4 F#4 A4, A1: C#4 E4 A4, G1: B3 D4 G4, E2: G#3 B3 D4, A1: D4 E4 A4, A1: C#4 E4 G4');     // (the end: major)
    const cd = Object.assign(conductor(), { bar: -1, p: 0, crack: -1 });
    Sound.addSong('fb_t2', { bpm: 116, len: 16 * 4096, from: 0, swing: 0, vol: 0.42, verb: 0.2, echo: 0.12, echoSteps: 3, play(i, t, s16) {
      if (cd.start(i)) { cd.abs = -1; cd.bar = -1; cd.p = +state.prog || 0; cd.crack = -1; }
      const nb = cd.step(i), st = i & 15; if (nb) cd.bar += nb;
      const p = Math.max(0, Math.min(1, +state.prog || 0)), L = Math.round(p * 6), maj = p >= 1, b8 = ((cd.bar % 8) + 8) % 8;
      const ch = (maj ? CH2M : CH2)[b8], vo = ch.slice(1), r = ch[0];
      // a crack: the moment prog goes up, glass shatters (a minor-second cluster, a slam, a china)
      if (p > cd.p + 0.01) { cd.p = p; cd.crack = i; }
      if (cd.crack === i) { K.glass(86, t, 0.9, 1.6); K.glass(87, t + 0.01, 0.8, 1.4); K.glass(93, t + 0.02, 0.6, 1.1); H.snare(t, 0.9); K.china(t, 0.9); K.crash(t, 0.7); H.kick(t, 1); }
      // glass arpeggios, always (sixteenths over the chord, two octaves)
      const arp = vo.concat(vo.map(m => m + 12)); K.glass(arp[(st * 3 + (b8 & 1)) % arp.length] + 12, t, 0.22 + 0.12 * (st % 4 === 0), 0.5);
      if (st % 4 === 0) K.tick(t, st === 0, 0.35);
      if (st === 0 && b8 % 4 === 0) K.swell(t, s16 * 60, 0.35 + 0.4 * p);
      // L ≥ 1: half-time drums and the sub; L ≥ 3: full time, the chopper bass, the choir; L ≥ 5: the band
      if (L >= 1) {
        const full = L >= 3;
        if (st === 0 || st === 10 || (full && st === 6 && (b8 & 1))) H.kick(t, st ? 0.85 : 1);
        if (full ? st === 4 || st === 12 : st === 8) H.snare(t, 0.95); else if (full && (st === 7 || st === 15)) K.fsnare(t, 0.14);
        K.ch909(t, st % 4 === 2 ? 0.6 : st & 1 ? 0.22 : 0.38);
        if (st === 0) K.sub808(r - 12, t, s16 * (full ? 6 : 14), 0.8);
        if (full && !(st & 1)) K.chopper(r + (st % 4 === 2 ? 12 : 0), t, s16 * 1.5, 0.95, st % 4 === 2);
        if (full && st === 0) H.choir([vo[1], vo[2] + 12], t, s16 * 15.5, 0.11, 'o', 'a');
        if (b8 === 7 && st >= 12) K.simtom(t, [260, 210, 170, 135][st - 12], 0.85);
      } else {
        if (st === 0) { K.darkpad(r + 12, t, s16 * 15, 1.2); H.choir([vo[0], vo[1]], t, s16 * 15.5, 0.12, 'u', 'o'); K.sub808(r - 12, t, s16 * 14, 0.6); }
        if (st === 0 || st === 10) K.kick808(t, st ? 0.45 : 0.6, 0.5);
        if (!(st & 1)) K.ch909(t, st % 4 === 2 ? 0.35 : 0.2);
      }
      if (L >= 5) {
        if (st === 0 || st === 3 || st === 8) H.gtr(r + 24, t, s16 * 0.9, 0.55);
        if (st === 0 && !(b8 & 1)) { K.crash(t, 0.75); H.stab([vo[0] + 12, vo[1] + 12, vo[2] + 12], t, s16 * 1.2, 0.8); }
        if (st === 10) K.brass(vo.map(m => m + 12), t, s16 * 1.4, 0.6, 1.2);
      }
      // the motif: upside down on the vibes and the glass (your reflection's), until it rights itself (L ≥ 4): the trumpet, then octaves
      const q = b8 * 16 + st, up = L >= 4, n = (up ? MOTIFD : MIRD)[q % 128];
      if (n) {
        const d = n[1] * s16 * 0.95;
        if (!up) { K.vibe(n[0], t, d * 1.2, 0.8); K.glass(n[0] + 12, t, 0.35, Math.min(1.2, d * 1.5)); }
        else { K.lead(n[0], t, d, 'tptlead', 0.9); if (L >= 5) K.lead(n[0] + 12, t, d, 'tptlead', 0.4); if (maj) K.lead(dia(n[0], -2, [1, 2, 4, 6, 7, 9, 11]), t, d, 'flugel', 0.7); }
      }
    } });
  }
  // ---------------------------------------------------------------- 'fb_t3' «La risa» (108 shuffle, F): the concert's band, out of tune and
  // mocking, coming back in tune with each truth told; at the end the same band, warm, the hall laughing with him
  if (!has('fb_t3')) {
    const CH3 = K.CH('F2: A3 C4 E4, G1: B3 D4 F4, E2: G#3 D4 F4, A1: C4 E4 G4, D2: F#3 C4 E4, G1: B3 D4 F4, C2: E3 A#3 D4, C2: E3 G3 B3 D4');
    const MOT3 = M('C5/2 D5/2 F5/4 G5/2 A5/2 G5/2 F5/2 D5/4 C5/8 F5/2 G5/2 A5/4 C6/2 A5/2 G5/2 F5/2 G5/12 '
      + 'C5/2 D5/2 F5/4 G5/2 A5/2 G5/2 F5/2 D5/4 C5/8 D5/2 F5/2 G5/4 A5/2 G5/2 F5/16');          // (the motif in F)
    const cd = Object.assign(conductor(), { bar: -1 });
    const laugh = (t, s16, top, n, v, vw, step = 2) => { for (let j = 0; j < n; j++) K.vox(top - j * step, t + j * s16, s16 * 0.6, v * (1 - j * 0.1), vw, vw); };
    Sound.addSong('fb_t3', { bpm: 108, len: 16 * 4096, from: 0, swing: 0.3, vol: 0.42, verb: 0.16, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      if (cd.start(i)) { cd.abs = -1; cd.bar = -1; }
      const nb = cd.step(i), st = i & 15; if (nb) cd.bar += nb;
      const p = Math.max(0, Math.min(1, +state.prog || 0)), L = Math.round(p * 6), warm = p >= 1, b8 = ((cd.bar % 8) + 8) % 8;
      const ch = CH3[b8], vo = ch.slice(1), r = ch[0], det = -0.5 * (1 - p), nx = CH3[(b8 + 1) % 8][0];
      // the shuffle: ride, a kick that drives, the backbeat with a rimshot crack; the fills
      if (st === 0 || st === 6 || st === 10) H.kick(t, st ? 0.75 : 0.95);
      if (st === 4 || st === 12) { H.snare(t, 0.85); if (L >= 2) K.claps(t, 0.45); }
      if (!(st & 1)) K.ride(t, st % 4 === 0 ? 0.55 : 0.35);
      if (L >= 1 && !(st & 1)) K.tamb(t, st % 4 === 2 ? 0.45 : 0.25, st % 8 === 4);
      if (b8 === 7 && st >= 8) K.simtom(t, [300, 260, 220, 190, 165, 145, 125, 110][st - 8], 0.85);
      if (st === 0 && b8 === 0) K.crash(t, 0.7);
      // the walking bass, the organ comping on the off-beats (the out-of-tune ones drift)
      const wk = { 0: r, 4: r + 7, 8: r + 12, 12: nx - 1 }[st]; if (wk !== undefined) K.roundbass(wk + det, t, s16 * 3.6, 0.95);
      if (st % 4 === 2) K.hammond(vo.map(m => m + det), t, s16 * 1.4, 0.5 + 0.1 * L / 6, warm ? 6.6 : 1.2);
      // the horn section: stabs from L 1, the whole section on the pushes from L 3
      if (L >= 1 && (st === 14 || st === 6)) K.brass(vo.map(m => m + 12 + det), t, s16 * (st === 14 ? 1.6 : 0.9), 0.5, 1.0);
      if (L >= 3 && st === 0 && (b8 & 1)) { K.brass(vo.map(m => m + 12), t, s16 * 3.5, 0.65, 1.25); K.brass(vo.map(m => m + 24), t, s16 * 3.5, 0.35, 1.3); }
      // the motif: a muted trumpet out of tune (the mockery's), in tune with each truth; a sax under it from L 4; warm at the end
      const n = MOT3[b8 * 16 + st];
      if (n) { const d = n[1] * s16 * 0.95; K.lead(n[0] + det, t, d, warm ? 'tptlead' : L >= 3 ? 'trumpet' : 'mute', 0.8); if (L >= 4) K.lead(dia(n[0], -2, [0, 2, 4, 5, 7, 9, 11]) - 12, t, d, 'sax', 0.5); if (warm) K.lead(n[0] - 12, t, d, 'bone', 0.45); }
      // the laughter: mocking «ha-ha-ha» falling by semitones (fewer as you go); at the end, warm laughter and clapping
      if (!warm && (st === 8 || st === 12) && b8 % (L < 3 ? 1 : 2) === 0) laugh(t, s16, vo[vo.length - 1] + 24 - L, st === 8 ? 3 : 2, 0.5 - 0.06 * L, L < 3 ? 'a' : 'e', 1);
      if (warm && b8 === 7 && st === 8) { laugh(t, s16 * 1.4, vo[vo.length - 1] + 12, 4, 0.32, 'o', 3); for (let j = 0; j < 8; j++) K.hclap(t + s16 * (j * 0.6 + Math.random() * 0.3), 0.35); }
    } });
  }
  // ---------------------------------------------------------------- 'fb_t4' «Sus palabras» (88, D): gospel-rock that builds with each word
  // given back (prog 0, ⅓, ⅔, 1): the organ and a choir humming; the drums, the bass and the claps; the horns and the choir singing; the
  // heroes' motif in octaves on top
  if (!has('fb_t4')) {
    const CH4 = K.CH('D2: F#3 A3 D4, G1: B3 D4 G4, B1: D4 F#4 A4, A1: C#4 E4 A4, G1: B3 D4 E4, D2: F#3 A3 D4, E2: G#3 B3 D4, A1: C#4 E4 G4');
    const cd = Object.assign(conductor(), { bar: -1 });
    Sound.addSong('fb_t4', { bpm: 88, len: 16 * 4096, from: 0, swing: 0.18, vol: 0.42, verb: 0.24, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      if (cd.start(i)) { cd.abs = -1; cd.bar = -1; }
      const nb = cd.step(i), st = i & 15; if (nb) cd.bar += nb;
      const p = Math.max(0, Math.min(1, +state.prog || 0)), w = Math.round(p * 3), b8 = ((cd.bar % 8) + 8) % 8;
      const ch = CH4[b8], vo = ch.slice(1), r = ch[0], nx = CH4[(b8 + 1) % 8][0];
      // the organ (its Leslie speeds up as he finds his words) and the choir humming
      if (st === 0) {
        K.hammond(vo, t, s16 * 15, w < 1 ? 2.0 : 0.85, w >= 2 ? 6.8 : 1.4); K.hammond([r + 12], t, s16 * 15, w < 1 ? 1.4 : 0.6, w >= 2 ? 6.8 : 1.4);
        H.choir([vo[0] + 12, vo[1] + 12, vo[2] + 12], t, s16 * 15.5, 0.18 + 0.03 * w, 'u', w >= 2 ? 'o' : 'u');
        if (w < 2) { K.warmpad(r + 24, t, s16 * 15.5, 1.6); K.darkpad(r + 12, t, s16 * 15.5, 1.0); }
      }
      if (w < 1 && (st === 0 || st === 8)) K.kick808(t, st ? 0.35 : 0.5, 0.5);
      if (st === 8 && w < 1) K.hammond(vo.map(m => m + 12), t, s16 * 6, 1.0, 1.4);
      if (w < 1 && (st === 6 || st === 14)) K.hammond(vo.map(m => m + 12), t, s16 * 1.3, 1.1, 1.4);
      if (w < 1 && st % 4 === 2) K.tamb(t, 0.4);
      if (st === 4 || st === 12) K.tamb(t, 0.45, true);
      // 1: the drums, the bass, the claps
      if (w >= 1) {
        if (st === 0 || st === 10 || (st === 7 && (b8 & 1))) H.kick(t, st ? 0.8 : 1);
        if (st === 4 || st === 12) { H.snare(t, 0.9); K.hclap(t, 0.7); K.claps(t, 0.45); }
        K.ch909(t, st % 4 === 2 ? 0.5 : st & 1 ? 0.18 : 0.32);
        const bl0 = { 0: [r, 5], 6: [r + 7, 2], 8: [r, 3], 12: [r + 12, 2], 14: [nx - 1, 2] }[st]; if (bl0) K.roundbass(bl0[0], t, s16 * bl0[1], 1);
        if (b8 === 7 && st >= 12) K.simtom(t, [260, 210, 170, 135][st - 12], 0.85);
      } else if (st === 0 || st === 8) K.roundbass(r, t, s16 * 7.5, 0.75);
      // 2: the horns, the choir singing out, a crash every other bar
      if (w >= 2) {
        if (st === 0) { K.brass(vo.map(m => m + 12), t, s16 * 6, 0.5, 1.05); if (!(b8 & 1)) K.crash(t, 0.6); }
        if (st === 10 || st === 14) H.choir([vo[1] + 12, vo[2] + 12], t, s16 * 1.4, 0.16, 'a', 'a');
      }
      // the motif: fragments on a far flugelhorn (his voice, trapped) until the last word; then whole, trumpets in octaves, the flugel
      // a third under, everything in
      const q = b8 * 16 + st, n = MOTIFD[q % 128];
      if (n) {
        const d = n[1] * s16 * 0.95;
        if (w < 3) { if (q % 64 < 16 + 16 * w) K.lead(n[0] - 12, t, d, 'flugel', 0.55 + 0.1 * w); }
        else { K.lead(n[0], t, d, 'tptlead', 1); K.lead(n[0] - 12, t, d, 'tptlead', 0.45); K.lead(dia(n[0], -2, [1, 2, 4, 6, 7, 9, 11]), t, d, 'flugel', 0.75); }
      }
      if (w >= 3) { if (st % 2 === 1) H.dk(t, 0.35); if (st === 0) { K.crash(t, 0.8); K.bell(r + 24, t, 0.35); } }
    } });
  }

  // ================================================================ 'boss_fb_core': Every Voice (172, B phrygian) and the finisher
  if (!has('boss_fb_core')) {
    const CR1 = 'B1/1 r/1 B1/1 r/1 B2/1 B1/1 r/1 C2/1 r/1 B1/1 r/1 D2/1 C#2/1 r/1 C2/1 B1/1';
    const CR2 = 'B1/1 r/1 B1/1 r/1 B2/1 B1/1 r/1 C2/1 r/1 B1/1 r/1 F2/1 E2/1 r/1 D2/1 C2/1';
    const CR3 = 'G1/1 r/1 G1/1 r/1 G2/1 G1/1 r/1 G#1/1 r/1 G1/1 r/1 A#1/1 A1/1 r/1 G#1/1 G1/1';
    const CR4 = 'F#1/1 r/1 F#1/1 F#2/1 r/1 F#1/1 G1/1 r/1 F#1/1 r/1 C2/1 B1/1 A#1/1 A1/1 G#1/1 G1/1';
    const RIFF = { W: bl(['r/16', 'r/16', CR1, CR2].join(' | ')), A: bl([CR1, CR2, CR1, CR3, CR1, CR2, CR3, CR4].join(' | ')) };
    const AROOT = [0, 0, 0, -4, 0, 0, -4, -5], BROOT = [0, 0, -4, -4, -7, -7, -5, -5], RROOT = [-4, -5, -7, -5, -4, -2, 0, -5];
    const B1 = 35, DMAJ = [1, 2, 4, 6, 7, 9, 11];
    const HUSHB = M('B4/8 A#4/8 A4/8 G#4/8 G4/8 F#4/8 F4/12 F#4/4');
    // the heroes' motif in D major (the finisher's key) and an octave down for B; the finisher's at half speed again (16 bars)
    const HEROD = []; HERO.forEach((n, q) => { if (n) HEROD[q] = [n[0] - 5, n[1]]; });
    const FIN = M('A5/4 B5/4 D6/8 E6/4 F#6/4 E6/4 D6/4 B5/8 A5/16 D6/4 E6/4 F#6/8 A6/4 F#6/4 E6/4 D6/4 E6/24 r/16 '
      + 'A5/4 B5/4 D6/8 E6/4 F#6/4 E6/4 D6/4 B5/8 A5/16 B5/4 D6/4 E6/8 F#6/4 E6/4 D6/32 r/16');
    const FCH = K.CH(['G2: B3 D4 G4', 'G2: B3 D4 G4', 'A1: C#4 E4 A4', 'A1: C#4 E4 A4', 'F#2: A#3 E4 F#4', 'F#2: A#3 E4 F#4', 'B1: D4 F#4 B4', 'B1: D4 F#4 B4',
      'D2: F#3 A3 D4', 'D2: F#3 A3 D4', 'B1: D4 F#4 B4', 'B1: D4 F#4 B4', 'G2: B3 D4 G4', 'G2: B3 D4 G4', 'E2: G#3 D4 E4', 'A1: C#4 G4 A4'].join(','));
    // the ending (the user's pick: "end on a bang"): the motif once more at full speed (8 bars, under the same chords), a roll
    const RUN = M('A5/2 B5/2 D6/4 E6/2 F#6/2 E6/2 D6/2 B5/4 A5/8 D6/2 E6/2 F#6/4 A6/2 F#6/2 E6/2 D6/2 E6/20 '
      + 'A5/2 B5/2 D6/4 E6/2 F#6/2 E6/2 D6/2 B5/4 A5/8 B5/2 D6/2 E6/4 F#6/2 E6/2 D6/24');
    const BASE = form([['W', 4], ['A', 8], ['B', 8], ['K', 4], ['U', 4]]), WITH = form([['A', 8], ['B', 8], ['R', 8], ['K', 2], ['U', 2]]);
    const FINF = form([['FU', 1], ['F', 16]]), ENDF = form([['G', 8], ['RL', 2], ['X', 2]]), TAIL = form([['Z', 1]]);
    const cd = Object.assign(conductor(), { list: BASE, pos: -1, hold: false });
    const core = { cd, hitAt: [] };
    const where = () => cd.list[cd.pos] || ['Z', 0];
    function nextBar() {
      cd.pos++;
      if (cd.list === FINF) {
        // the finisher's 16 bars, then the ending once the game says so (state.end); till then F's full-speed half again
        if (cd.pos >= FINF.length) { if (state.end) { cd.list = ENDF; cd.pos = 0; } else { cd.pos = 9; cd.hold = true; } }
        else if (state.end && (cd.pos === 9 || cd.pos === 13)) { cd.list = ENDF; cd.pos = 0; }      // (the finisher landed early: on to the ending at the next half-phrase)
      } else if (cd.list === ENDF) { if (cd.pos >= ENDF.length) { cd.list = TAIL; cd.pos = 0; } }
      else if (cd.list === TAIL) cd.pos = 0;
      else if (cd.pos >= cd.list.length) { cd.list = state.elio ? WITH : BASE; cd.pos = cd.list === BASE ? 4 : 0; }
      if (state.fin && cd.list !== FINF && cd.list !== ENDF && cd.list !== TAIL) { cd.list = FINF; cd.pos = 0; cd.hold = false; }
    }
    Sound.addSong('boss_fb_core', { bpm: 172, len: 16 * 4096, from: 0, swing: 0, vol: 0.44, verb: 0.1, echo: 0.08, echoSteps: 3, play(i, t, s16) {
      if (cd.start(i)) { cd.abs = -1; cd.list = state.fin ? FINF : BASE; cd.pos = -1; cd.hold = false; core.hitAt = []; }
      const nb = cd.step(i), st = i & 15;
      for (let q = 0; q < nb; q++) nextBar();
      const [sec, k] = where(), elio = !!state.elio;
      // ---- the wall: the heart's three slams (B, F the tritone, C the minor second), a heartbeat in the silence, the riff
      if (sec === 'W') {
        if (k === 0) { const h = { 0: 0, 6: 6, 12: 1 }[st]; if (h !== undefined) { const r = B1 + h; H.kick(t, 1); K.odaiko(t, 1); K.china(t, 0.9); if (!st) K.crash(t, 1); K.sub808(r - 12, t, s16 * 5, 1); H.bass(r + 12, t, s16 * 5, 1); H.stab([r + 24, r + 31, r + 36], t, s16 * 4, 1.15); H.choir([r + 12, r + 19, r + 24], t, s16 * 5, 0.22, 'a', 'o'); } return; }
        if (k === 1) { if (st === 0) K.kick808(t, 1, 0.6); if (st === 3) K.kick808(t, 0.6, 0.45); if (st === 8) K.glass(83, t, 0.3, 2.2); return; }
        const b = RIFF.W[k * 16 + st]; if (b) { H.bass(b[0] + 12, t, s16 * 0.9, 1); if (st < 8) H.gtr(b[0] + 24, t, s16 * 0.8, 0.75); }
        if (st === 0 && k === 2) { K.crash(t, 1); H.kick(t, 1); } if (k === 2 && st) H.dk(t, 0.6); if (k === 3) { if (st < 8) H.dk(t, 0.65); else H.snare(t, 0.4 + 0.08 * (st - 8)); }
        return;
      }
      // ---- the drums (the fights' sections)
      const drums = sec === 'A' || sec === 'B' || sec === 'R';
      if (drums) {
        if (st === 0 || st === 3 || st === 6 || st === 10) H.kick(t, st ? 0.85 : 1);
        if ((k & 1) ? st >= 12 : st >= 8 && st < 12) H.dk(t, 0.6);
        if (sec === 'R' ? st === 8 : st === 4 || st === 12) H.snare(t, 1); else if (st === 7 || st === 15) K.fsnare(t, 0.16);
        K.ch909(t, st % 4 === 2 ? 0.7 : st & 1 ? 0.3 : 0.45);
        if (st === 0 && (k === 0 || k === 4)) K.crash(t, 0.9);
      }
      if (sec === 'A') {
        const b = RIFF.A[k * 16 + st]; if (b) { H.bass(b[0] + 12, t, s16 * 0.9, 1); if (st === 0 || st === 4 || st === 7) H.gtr(b[0] + 24, t, s16 * 0.8, 0.7); }
        const r = B1 + 12 + AROOT[k];
        if (st === 0 && !(k & 1)) H.stab([r + 12, r + 13, r + 19], t, s16 * 1.5, 0.9);
        if (st === 0) K.hammond([r, r + 1, r + 7], t, s16 * 15, 0.55, 6.8);
        const hm = HUSHB[(k & 3) * 16 + st]; if (hm) H.choir([hm[0] - 12, hm[0] - 5], t, hm[1] * s16, elio ? 0.08 : 0.12, 'o', 'o');
        if (elio && st === 0 && (k & 1)) K.lead(B1 + 34, t, s16 * 6, 'flugel', 0.6);
        return;
      }
      if (sec === 'B') {
        const q = k * 16 + st, r = B1 + 12 + BROOT[k];
        const pulse = { 0: [0, 6], 6: [0, 2], 8: [1, 4], 12: [0, 4] }[st]; if (pulse) H.bass(r + pulse[0], t, pulse[1] * s16 * 0.92, 0.95);
        if (st === 0) K.hammond([r + 12, r + 13, r + 19], t, s16 * 15, 0.45, 1.4);
        if (!elio) {
          // the Hush on everything; the heroes manage one note, and are crushed
          const hm = HUSHB[q % 64]; if (hm) { H.choir([hm[0] - 12, hm[0] - 5, hm[0]], t, hm[1] * s16, 0.15, 'a', 'o'); H.pipe([hm[0] - 12], t, hm[1] * s16, 1); }
          if ((k & 1) && st === 0) K.lead(69, t, s16 * 2, 'flugel', 0.45);
          if ((k & 1) && st === 3) H.cut(r, t, s16, 0.9);
        } else {
          // Elio's voice is in: the heroes' motif, strong, the trumpet and his flugelhorn in octaves
          const n = HEROD[q]; if (n) { K.lead(n[0] + 12, t, n[1] * s16 * 0.95, 'tptlead', 0.9); K.lead(n[0], t, n[1] * s16 * 0.95, 'flugel', 0.9); }
          const hm = HUSHB[q % 64]; if (hm) H.choir([hm[0] - 24], t, hm[1] * s16, 0.07, 'o', 'o');
        }
        if (k === 7 && st >= 8) K.simtom(t, [300, 260, 220, 190, 165, 145, 125, 110][st - 8], 0.85);
        return;
      }
      if (sec === 'R') {
        const r = B1 + 12 + RROOT[k];
        if (st === 0) { H.bass(r, t, s16 * 6, 1); K.hammond([r + 12, r + 16, r + 19], t, s16 * 15, 0.5, 6.6); K.warmpad(r + 24, t, s16 * 15, 0.6); }
        if (st === 8) H.bass(r, t, s16 * 6, 0.9);
        const q = k * 16 + st, n = HEROD[(q + 56) % 112];
        if (n) { if ((k >> 1) & 1) K.lead(n[0] + 12, t, n[1] * s16 * 0.95, 'tptlead', 0.85); else K.lead(n[0], t, n[1] * s16 * 0.95, 'flugel', 1); }
        return;
      }
      if (sec === 'K') {
        if (st === 0) K.kick808(t, 0.95, 0.6); if (st === 3) K.kick808(t, 0.6, 0.45); if (st === 8) H.snare(t, 0.7);
        if (st === 0 && !(k & 1)) { K.bell(35 - 0.35, t, 0.6); H.choir([47, 50, 54], t, s16 * 30, 0.1, 'o', 'u'); K.fuzzbass(35, t, s16 * 30, 0.9); }
        const hm = HUSHB[k * 16 + st]; if (hm) H.pipe([hm[0] - 12], t, hm[1] * s16 * 0.95, 1.1);
        if (elio && st === 8 && (k & 1)) K.lead(66, t, s16 * 8, 'flugel', 0.8);
        return;
      }
      if (sec === 'U') {
        H.dk(t, 0.45 + 0.03 * (k * 16 + st) / 4);
        if (k < 2 ? st % 4 === 0 : st % 2 === 0 || k === 3) H.snare(t, 0.3 + 0.012 * (k * 16 + st));
        if (k === 0 && st === 0) K.swell(t, s16 * 16 * (elio ? 2 : 4), 1.2);
        if (st === 0) H.bass(B1 + 12, t, s16 * 7, 0.9);
        if (elio && st < 8 && !(st & 1)) { const climb = [69, 71, 74, 76][st >> 1]; K.lead(climb + (k & 1) * 2, t, s16 * 1.8, 'flugel', 0.8); }
        if (k === (elio ? 1 : 3) && st >= 12) K.simtom(t, [260, 210, 170, 135][st - 12], 1);
        return;
      }
      // ---- the finisher: a bar's roll, then «Toda voz cuenta», triumphant, in D major
      if (sec === 'FU') {
        H.snare(t, 0.35 + 0.04 * st); H.dk(t, 0.5 + 0.03 * st);
        if (st >= 12) K.simtom(t, [280, 230, 190, 150][st - 12], 1);
        if (st === 0) { K.swell(t, s16 * 16, 1.3); K.crash(t, 0.7); H.stab([57, 61, 64, 69], t, s16 * 15, 0.9); }
        return;
      }
      if (sec === 'F') {
        const ch = FCH[k], vo = ch.slice(1), r = ch[0], full = k >= 8;
        if (!full) { if (st === 0 || st === 10) H.kick(t, 1); if (st === 8) H.snare(t, 1); if (!(st & 1)) K.ride(t, 0.5); if (st === 0) K.crash(t, 0.85); }
        else { if (st % 4 === 0) H.kick(t, 1); if (st % 2 === 1) H.dk(t, 0.45); if (st === 4 || st === 12) { H.snare(t, 1); K.claps(t, 0.5); } K.hat(t, st % 4 === 2 ? 0.55 : 0.25, st % 4 === 2); if (st === 0 && !(k & 1)) { K.crash(t, 1); K.china(t, 0.5); } }
        if (st === 0 && !(k & 1)) { K.bell(r + 24, t, 0.55); H.choir([vo[vo.length - 1], vo[vo.length - 2] + 12], t, s16 * 30, 0.14, 'a', 'o'); K.hammond(vo, t, s16 * 30, 0.6, 7.4); }
        if (st === 0 || st === 8) K.brass(vo.map(m => m + 12).concat(vo.map(m => m + 24)), t, s16 * 1.4, 0.75, 1.3);
        if (st === 0) K.chopper(r, t, s16 * 3, 1); if (st === 4 || st === 12) K.chopper(r + 12, t, s16 * 2, 0.9, true); if (st === 8) K.chopper(r + 7, t, s16 * 3, 0.95);
        if (st === 0) K.sub808(r - 12, t, s16 * 4, 0.7);
        if ((k & 3) === 3 && st >= 12) K.simtom(t, [260, 210, 170, 135][st - 12], 0.9);
        const n = FIN[k * 16 + st];
        if (n) { const d = n[1] * s16; K.lead(n[0], t, d * 0.95, 'tptlead', 1); K.lead(dia(n[0], -2, DMAJ), t, d * 0.95, 'flugel', 0.8); K.lead(n[0] - 12, t, d * 0.9, 'bone', 0.55); }
        return;
      }
      // ---- the ending: one last full-speed run of the motif with everything (the horns in octaves, the bell, the choir)
      if (sec === 'G') {
        const q = k * 16 + st, ch = FCH[q >> 3], vo = ch.slice(1), r = ch[0];
        if (st % 4 === 0) H.kick(t, 1); else if (st & 1) H.dk(t, 0.5);
        if (st === 4 || st === 12) { H.snare(t, 1); K.claps(t, 0.55); }
        K.hat(t, st % 4 === 2 ? 0.6 : 0.3, st % 4 === 2);
        if (st === 0) { K.crash(t, 1); if (!(k & 1)) K.china(t, 0.55); K.bell(r + 24, t, 0.5); }
        if (k === 7 && st >= 8) K.simtom(t, [300, 260, 220, 190, 165, 145, 125, 110][st - 8], 0.9);
        if (!(st & 1)) { K.chopper(r + (st % 4 === 2 ? 12 : 0), t, s16 * 1.6, 1, st % 4 === 2); H.gtr(r + 24, t, s16 * 0.9, 0.5); }
        if (st % 8 === 0) {
          K.sub808(r - 12, t, s16 * 6, 0.8); K.hammond(vo, t, s16 * 7.6, 0.6, 7.4);
          H.choir([vo[vo.length - 1], vo[vo.length - 2] + 12, vo[0] + 12], t, s16 * 7.8, 0.16, 'a', 'o');
          K.brass(vo.map(m => m + 12).concat(vo.map(m => m + 24)), t, s16 * 1.2, 0.8, 1.35);
        }
        const n = RUN[q];
        if (n) { const d = n[1] * s16 * 0.95; K.lead(n[0], t, d, 'tptlead', 1); K.lead(n[0] + 12, t, d, 'tptlead', 0.45); K.lead(dia(n[0], -2, DMAJ), t, d, 'flugel', 0.75); K.lead(n[0] - 12, t, d, 'bone', 0.6); }
        return;
      }
      // ---- a two-bar roll on A7 (the snare climbing, thirty-seconds at the end), a rising swell, the horns and the choir climbing
      if (sec === 'RL') {
        const u = (k * 16 + st) / 32;
        H.snare(t, 0.35 + 0.65 * u); if (k === 1 && st >= 8) H.snare(t + s16 * 0.5, 0.3 + 0.65 * u);
        H.dk(t, 0.45 + 0.4 * u);
        if (k === 0 && st === 0) { K.swell(t, s16 * 32, 1.5); K.crash(t, 0.8); K.sub808(21, t, s16 * 30, 0.7); H.bass(45, t, s16 * 30, 0.9); K.hammond([55, 61, 64, 67], t, s16 * 31, 0.65, 7.4); }
        if (st % 4 === 0) {
          const b = k * 4 + (st >> 2), up = [69, 73, 76, 79, 81, 85, 88, 91][b];
          K.brass([up - 12, up], t, s16 * 3.6, 0.45 + 0.5 * u, 1.2 + 0.3 * u);
          H.choir([up - 12, up - 24 + 7], t, s16 * 3.8, 0.1 + 0.1 * u, 'a', 'a');
        }
        if (k === 1 && st >= 12) K.simtom(t, [260, 210, 170, 135][st - 12], 1);
        return;
      }
      // ---- three huge hits on D (the band, the choir, the bells, the cymbals), the last the biggest; then a hard stop
      if (sec === 'X') {
        const which = k === 0 && st === 0 ? 1 : k === 0 && st === 8 ? 2 : k === 1 && st === 0 ? 3 : 0;
        if (!which) return;
        core.hitAt[which - 1] = t;
        const big = which === 3, v = big ? 1.25 : which === 2 ? 1.12 : 1, L = s16 * (big ? 9 : 4);
        H.kick(t, 1); K.odaiko(t, v, big ? 1.2 : 0.8); K.crash(t, v); K.china(t, 0.8 * v);
        K.sub808(26, t, L, v); K.chopper(38, t, L * 0.8, v); H.bass(38, t, L * 0.9, v);
        K.brass([62, 66, 69, 74, 78, 81, 86], t, L, 1.1 * v, 1.4); K.hammond([50, 57, 62, 66, 69], t, L, 0.7 * v, 7.4);
        H.choir([62, 66, 69, 74], t, L, 0.18 * v, 'a', 'a');
        K.glass(74, t, 0.9 * v, big ? 1.0 : 0.6); K.glass(86, t, 0.5 * v, big ? 0.8 : 0.5); K.glock(86, t, v); K.celesta(74, t, v, big ? 1.0 : 0.6);
        H.gtr(50, t, L * 0.9, 0.8); H.gtr(57, t, L * 0.9, 0.6);
        K.lead(74, t, L * 0.95, 'tptlead', 1); K.lead(86, t, L * 0.95, 'tptlead', 0.5); K.lead(62, t, L * 0.9, 'bone', 0.7);
        if (big) { H.snare(t, 1); K.claps(t, 0.7); H.dk(t + s16 * 0.5, 0.8); K.crash(t + 0.012, 0.8); K.lead(69, t, L * 0.95, 'flugel', 0.8); }
        return;
      }
      // ---- 'Z': silence (the game brings Elio's voice in here)
    } });
    api._.core = core;
  }

  // ---------------------------------------------------------------- previews: a song rendered offline while the state changes on
  // cue (plan: [[step, { state changes }], …]); the AudioBuffer as a WAV posted to the dev server
  api._.render = async (name, sec = 30, plan = [], o = {}) => {
    const S = Sound._song(name); if (!S) return null;
    const keep = Object.assign({}, state);
    Object.assign(state, o.state || {});
    Sound.addSong('fb_preview', Object.assign({}, S, { play(i, t, s16) { for (const [at, ch] of plan) if (i === at) Object.assign(state, ch); return S.play.call(S, i, t, s16); } }));
    try { return await Sound._render('fb_preview', sec, { buffer: true, rate: o.rate || 44100 }); }
    finally { Object.keys(state).forEach(k => { state[k] = keep[k]; }); }
  };
  api._.wav = buf => {
    const n = buf.length, nc = buf.numberOfChannels, sr = buf.sampleRate, out = new DataView(new ArrayBuffer(44 + n * nc * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + n * nc * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, nc, true);
    out.setUint32(24, sr, true); out.setUint32(28, sr * nc * 2, true); out.setUint16(32, nc * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * nc * 2, true);
    const ch = Array.from({ length: nc }, (_, c) => buf.getChannelData(c)); let p = 44;
    for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) { const x = Math.max(-1, Math.min(1, ch[c][i] || 0)); out.setInt16(p, x < 0 ? x * 0x8000 : x * 0x7fff, true); p += 2; }
    return new Uint8Array(out.buffer);
  };
  api._.save = async (buf, name) => {
    const bytes = api._.wav(buf); let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    const r = await fetch('/shot', { method: 'POST', body: JSON.stringify({ name, data: 'data:audio/wav;base64,' + btoa(s) }) });
    return r.json();
  };
  return api;
})();
