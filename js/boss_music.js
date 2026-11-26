'use strict';
// The bosses' own themes, the tough-fight rule, and which song each boss fight plays (P6d, playtest 6: "can you maybe add
// unique boss themes? maybe play the current boss themes for each language when you're in a tough battle like if your low
// health or versing a lot of enemies at once").
//
//   BOSS_MUSIC.songFor(boss, lang)  a boss fight's song: the boss's own (SONG below), else 'boss_<lang>', else null. boss is what
//                                   BATTLE.boss() / BATTLE.bossOf(opts) say: an id, true (the corn maze's colonel) or { kind }.
//   BOSS_MUSIC.tough()              while an ordinary fight runs (never a boss, never practice): 'low' when Mimo is down to 30%
//                                   of the hearts or less, 'many' with 3 or more foes standing at once, else null. main.js asks
//                                   every frame; the first time it's tough, the fight switches to 'boss_<lang>' and stays there
//                                   to the end. (Foes have no level, so "a foe well above Mimo's level" can't be told.)
//
// Twelve new songs, one for each boss that only had the generic 'boss_<lang>' (so that one is free for tough fights). Each is
// its own style, never phonk or orchestral, and each builds up, drops, breaks down, builds and drops again: bars build 4 ·
// A (the drop, the hook) 8 · B 4 · breakdown 2 · build 2, and the loop starts at A.
//   'boss_hill'      the big Hushling on the hill (Chapter 1) · «The Big One»: 16-bit FM boss funk, 152, C minor. A warning siren
//                    (a tritone back and forth), an FM bass bouncing octaves, a Linn kick and a gated snare, FM stabs, the FM lead.
//   'boss_colonel'   Colonel Cob (the corn maze) · «Atten-hut!»: drumline funk, 131, B♭ mixolydian. The snare line's cadences, quads
//                    and bass drums, a sousaphone riff, brass hits, the hook on piccolo and trumpets in octaves, «Hut!».
//   'boss_armadillo' the giant armadillo (the Great Mill) · «Mill Stomp»: blues-rock stomp, 122, E. A boot and claps, a fuzz bass
//                    and guitar riff with a blue B♭, power chords, a blues harmonica, an anvil, the mill's gears ticking.
//   'boss_frog'      the giant frog (Lighthouse Island) · «Bayou Hopper»: zydeco, 141, G. A rubboard scraping, the two-step, an
//                    accordion's tune and chank, a bouncing bass, a Cajun fiddle in B, «ribbit» at the turns.
//   'boss_bat'       the giant echo bat (the mine) · «Echoes in the Dark»: gothic organ rock, 157, C♯ harmonic minor. Sonar pings
//                    that echo back, a driving bass with chromatic climbs, organ stabs, a saw lead drowned in its own echo.
//   'boss_bee'       the queen bee (the greenhouse) · «Queen of the Hive»: Afrobeat, 119, A dorian. Interlocking guitars, a shekere
//                    and a bell, a hypnotic bass, the horns' riff; in B the queen herself, buzzing glides.
//   'boss_snowman'   the giant snowball (the Ice Clock Tower) · «Snowball Ska»: ska-punk, 164, F. The clock ticking, sleigh bells,
//                    the skank on every off-beat, a walking bass, trumpet and trombone, a glockenspiel; B goes punk.
//   'boss_crab'      the giant crab (the sea fort) · «Pinch and Run»: surf rock, 170, A minor. Waves, a tom roll, a glissando, the
//                    tremolo guitar's tune (picked on every sixteenth), a honking sax in B.
//   'boss_worm'      the giant worm (the sunken temple) · «Under the Dunes»: desert blues in 12/8 (♩. 101), E minor. A rumble
//                    under the sand, a heavy kick and claps, shaker triplets, a hypnotic riff, a bending lead, a chant answered.
//   'boss_shade'     the Shade (the drowned chapel) · «Light It Up»: a gospel praise break, 147, B♭ minor to D♭. The choir hums
//                    in the dark, then the shout: a busy kick, ghost notes, the organ's stabs and lead, «Hey!»; B is the light.
//   'boss_laughter'  the Laughter (Chapter 2, the Past's theater) · «Who's Laughing Now?»: new jack swing, 101, F♯ minor. The
//                    audience's «ha ha ha», a Linn kick and a gated snare on swung sixteenths, synth bass, brass stabs, an FM
//                    keyboard's hook.
//   'boss_silence'   the Great Silence (Chapter 3, the Future) · «The Great Silence»: darksynth, 114, D♯ minor. A cold arpeggio,
//                    gated drums, driving bass; the Silence swallows the end of every second bar until the drop's second half.
// Bosses that already had their own: the hooded figure ('boss_hooded'), the time worlds' ('boss_mol_*', 'boss_lk_*', 'boss_qr_*',
// 'af_gallery'), and the Prompter's 'ap_prompter' (written for it, now routed to it).
const BOSS_MUSIC = (() => {
  const SONG = {
    hill: 'boss_hill', corn: 'boss_colonel', colonel: 'boss_colonel', armadillo: 'boss_armadillo', frog: 'boss_frog', bat: 'boss_bat',
    bee: 'boss_bee', snowman: 'boss_snowman', crab: 'boss_crab', worm: 'boss_worm', shade: 'boss_shade', laughter: 'boss_laughter',
    silence: 'boss_silence', hooded: 'boss_hooded', prompter: 'ap_prompter', gallery: 'af_gallery',
    armadillo_young: 'boss_mol_armadillo', gray_miller: 'boss_mol_miller', frog_king: 'boss_lk_king', gray_toad: 'boss_lk_toad',
    echo_grandma: 'boss_qr_echo', gray_mole: 'boss_qr_mole',
  };
  const idOf = b => (b === true ? 'corn' : b && typeof b === 'object' ? String(b.kind || b.id || '') : String(b || ''));
  const has = n => typeof Sound !== 'undefined' && !!Sound.songs && Sound.songs.includes(n);
  function songFor(boss, lang) {
    if (!boss) return null;
    const s = SONG[idOf(boss)];
    if (s && has(s)) return s;
    return has('boss_' + lang) ? 'boss_' + lang : null;
  }
  const LOW = 0.3, MANY = 3;
  function tough() {
    try {
      const G = typeof BATTLE !== 'undefined' && BATTLE._ && BATTLE._.api && BATTLE._.api.G;
      if (!G || !G.running || G.practice || G.bossId) return null;
      if (G.maxHearts > 0 && G.hearts > 0 && G.hearts / G.maxHearts <= LOW + 1e-9) return 'low';
      if ((G.foes || []).filter(f => f && f.alive && !f.gone).length >= MANY) return 'many';
    } catch (e) { /* (no battle) */ }
    return null;
  }
  return { SONG, songFor, tough, LOW, MANY, idOf };
})();

(() => {
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
  const K = Sound.kit;
  const has = n => (Sound.songs || []).includes(n);
  const add = (name, make) => { if (has(name)) return; try { Sound.addSong(name, make()); } catch (e) { console.error('[boss music] ' + name, e); } };
  // a song's sections by bar: 'IIIIAAAAAAAABBBBRRUU' → for each bar [its letter, its place in that section]
  // (I the build at the start, A the drop with the hook, B, R the breakdown, U the build back into the drop)
  const plan = s => Array.from(s, (c, b) => { let a = b; while (a > 0 && s[a - 1] === c) a--; return [c, b - a]; });
  const LAYOUT = 'IIIIAAAAAAAABBBBRRUU';
  // the drop's crash: on A's first and fifth bars, and B's first
  const crashOn = (sec, k) => (sec === 'A' && (k === 0 || k === 4)) || (sec === 'B' && k === 0);

  // ---------------------------------------------------------------- 'boss_hill': The Big One (16-bit FM boss funk, 152, C minor)
  add('boss_hill', () => {
    const P = plan(LAYOUT);
    const A = K.CH('C2: Eb4 G4 Bb4, C2: Eb4 G4 Bb4, Ab1: C4 Eb4 G4, Bb1: D4 F4 Ab4, C2: Eb4 G4 Bb4, C2: Eb4 G4 Bb4, F1: Ab3 C4 Eb4, G1: B3 D4 F4');
    const B = K.CH('Eb2: G3 Bb3 D4, Bb1: D4 F4 Ab4, Ab1: C4 Eb4 G4, G1: B3 D4 F4');
    const HOOK = K.mel('G5/2 C6/2 Eb6/2 D6/2 C6/4 G5/4 | Bb5/2 C6/2 D6/4 Bb5/2 G5/6 | Ab5/2 C6/2 Eb6/2 F6/2 Eb6/4 C6/4 | D6/3 Eb6/3 D6/2 Bb5/8 | '
      + 'G5/2 C6/2 Eb6/2 D6/2 C6/4 G6/4 | F6/2 Eb6/2 D6/4 C6/2 Bb5/6 | Ab5/2 C6/2 F6/4 Eb6/2 D6/2 C6/4 | B5/4 D6/4 G6/8');
    const SING = K.mel('G6/8 F6/4 Eb6/4 | D6/8 Bb5/8 | C6/4 Eb6/4 Ab6/8 | G6/12 r/4');
    const BASS = { 0: 0, 2: 12, 3: 0, 6: 12, 8: 0, 10: 12, 11: 10, 14: 7 }, KICK = K.pat('x..x..x...x..x..');
    return { bpm: 152, len: 320, from: 64, swing: 0.02, vol: 0.43, verb: 0.08, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, [sec, k] = P[bar];
      const ch = sec === 'B' ? B[k] : sec === 'A' ? A[k] : sec === 'U' ? A[7] : A[k & 1];
      // the drums: a Linn kick and a big gated snare; B in half time; the builds: a kick on every beat and a snare roll
      if (sec === 'A') { if (KICK[st]) K.linnkick(t, st === 0 ? 1 : 0.8); if (st === 4 || st === 12) K.gatesnare(t, 0.9); }
      if (sec === 'A' || sec === 'R' || (sec === 'I' && bar >= 2)) K.hat(t, st & 1 ? 0.26 : 0.44);
      if (sec === 'B') { if (st === 0 || st === 10) K.linnkick(t, 0.9); if (st === 8) K.gatesnare(t, 1); if (!(st & 1)) K.hat(t, 0.4); }
      if (sec === 'I' || sec === 'U') {
        if (!(st & 3)) K.linnkick(t, 0.85);
        if (bar === 3 || bar === 19) { if (st >= 8 || !(st & 1)) K.snare(t, 0.25 + 0.04 * st); } else if (sec === 'U' && !(st & 1)) K.snare(t, 0.3 + 0.03 * st);
        if (st === 0 && (bar === 2 || bar === 18)) K.swell(t, s16 * 32, 0.8);
      }
      if (st === 0 && crashOn(sec, k)) K.crash(t, 0.8);
      // the warning siren before it shows up (and again into each drop)
      if ((bar < 2 || bar === 19) && !(st & 3)) K.fmlead(st & 4 ? 66 : 72, t, s16 * 3.6, 0.55, 3);
      // the FM bass bouncing octaves (held notes in B)
      if (bar >= 2 && sec !== 'B') { const o = BASS[st]; if (o !== undefined) K.fmbass(ch[0] + o, t, s16 * 1.3, st === 0 ? 1 : 0.8); }
      if (sec === 'B' && (st === 0 || st === 6 || st === 8 || st === 14)) K.fmbass(ch[0] + (st === 6 || st === 14 ? 12 : 0), t, s16 * 1.8, 0.85);
      // stabs off the beat; arpeggios under B and the breakdown
      if (sec === 'A' && (st === 6 || st === 14)) K.stab(ch.slice(1), t, s16 * 1.1, 0.7, 1.2);
      if (sec === 'B' || sec === 'R') K.arp(ch[1 + (st % 3)] + 12, t, 0.5, s16 * 0.9);
      // the hook (A) and the high tune (B) on the FM lead
      if (sec === 'A') { const n = HOOK[k * 16 + st]; if (n) K.fmlead(n[0], t, n[1] * s16 * 0.92, 0.8, 2.2); }
      if (sec === 'B') { const n = SING[k * 16 + st]; if (n) K.fmlead(n[0], t, n[1] * s16 * 0.95, 0.75, 1.4); }
    } };
  });

  // ---------------------------------------------------------------- 'boss_colonel': Atten-hut! (drumline funk, 131, B♭ mixolydian)
  add('boss_colonel', () => {
    const P = plan(LAYOUT);
    const A = K.CH('Bb1: D4 F4 Ab4, Bb1: D4 F4 Ab4, Eb2: G3 Bb3 Db4, Bb1: D4 F4 Ab4, F1: A3 C4 Eb4, Eb2: G3 Bb3 Db4, Bb1: D4 F4 Ab4, F1: A3 C4 Eb4');
    const HOOK = K.mel('F5/2 F5/2 Bb5/3 Ab5/1 F5/2 D5/2 F5/4 | Ab5/2 Bb5/2 r/2 Bb5/2 Ab5/2 F5/2 D5/4 | G5/2 G5/2 Eb6/3 Db6/1 Bb5/2 G5/2 Bb5/4 | Db6/2 D6/2 r/2 D6/2 C6/2 Bb5/2 F5/4 | '
      + 'C6/2 C6/2 F6/3 Eb6/1 C6/2 A5/2 C6/4 | Bb5/2 G5/2 r/2 Eb6/2 Db6/2 Bb5/2 G5/4 | F5/2 Bb5/2 D6/2 F6/2 r/2 F6/2 F6/4 | Eb6/2 C6/2 A5/2 F5/2 r/8');
    const TUBA = { 0: 0, 3: 0, 5: 3, 6: 4, 8: 7, 11: 10, 12: 12, 14: 10 };
    // the snare line's cadences (x accent, o tap, - ghost) and the quads (three tuned drums) answering
    const SN = K.pat('x.o-o.x-o.o-x.oo'), SN2 = K.pat('x-o-x-o-x-o-xxxx'), QUAD = { 2: 196, 3: 165, 10: 147, 11: 123, 13: 165 };
    return { bpm: 131, len: 320, from: 64, swing: 0.06, vol: 0.39, verb: 0.1, echo: 0.04, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, [sec, k] = P[bar];
      const ch = sec === 'U' ? A[7] : A[sec === 'A' ? k : sec === 'B' ? [0, 0, 2, 4][k] : k & 1];
      // the snare line: the cadence (the build's last three bars and the drop), the drumline's feature in B, rolls into each drop
      if ((sec === 'A' || (sec === 'I' && bar >= 1)) && bar !== 3) { const v = (bar & 1 ? SN2 : SN)[st]; if (v) K.stacksnare(t, 0.3 + 0.55 * v); }
      if (sec === 'B') {
        if (k & 1) { const f = QUAD[st]; if (f) K.simtom(t, f, 0.8); if (st >= 12) K.stacksnare(t, 0.6); }
        else { const v = SN[st]; if (v) K.stacksnare(t, 0.3 + 0.55 * v); if (QUAD[st]) K.simtom(t, QUAD[st] * 0.75, 0.7); }
      }
      if (sec === 'U' || bar === 3) { K.stacksnare(t, 0.25 + 0.04 * st + (bar & 1 ? 0.15 : 0)); if (bar === 19 || bar === 3) K.stacksnare(t + s16 / 2, 0.2 + 0.03 * st); if (st === 0 && (bar === 3 || bar === 18)) K.swell(t, s16 * (bar === 3 ? 16 : 32), 0.7); }
      // the bass drums on the beats (and the march's push on the "and" of four); cymbals on the hits
      if ((sec === 'A' || sec === 'B') && (st === 0 || st === 4 || st === 8 || st === 12 || st === 14)) K.kick(t, st === 0 ? 1 : 0.75);
      if (sec === 'I' && bar >= 2 && !(st & 3)) K.kick(t, 0.8);
      if (sec === 'R' && (st === 0 || st === 8)) K.kick(t, 0.7);
      if (sec === 'R' && !(st & 1)) K.hat(t, st & 2 ? 0.3 : 0.45);
      if (st === 0 && crashOn(sec, k)) K.crash(t, 0.85);
      if (sec === 'A' && st === 10 && (k & 1)) K.splash(t, 0.6);
      // the sousaphone's riff; the brass section's hits; the piccolo and the trumpets play the hook in octaves
      if ((sec !== 'I' || bar >= 2) && sec !== 'U') { const o = TUBA[st]; if (o !== undefined) K.tub(ch[0] + o, t, s16 * 1.4, st === 0 ? 1 : 0.8); }
      if (sec === 'A' && (st === 7 || st === 10) && (k & 1)) K.polybrass(ch.slice(1).map(m => m + 12), t, s16 * 1.2, 0.6);
      if (sec === 'B' && (st === 0 || st === 3 || st === 6)) K.brass(ch.slice(1), t, s16 * (st === 6 ? 4 : 1.5), 0.7);
      if (sec === 'A') { const n = HOOK[k * 16 + st]; if (n) { K.lead(n[0] + 12, t, n[1] * s16 * 0.85, 'pife', 0.45); K.lead(n[0], t, n[1] * s16 * 0.85, 'tptlead', 0.62); } }
      // «Hut!» on the turns
      if ((bar === 3 && (st === 8 || st === 12)) || (sec === 'A' && (k === 3 || k === 7) && st === 12)) K.vox(58, t, s16 * 1.2, 0.7, 'a', 'u');
    } };
  });

  // ---------------------------------------------------------------- 'boss_armadillo': Mill Stomp (blues-rock stomp, 122, E)
  add('boss_armadillo', () => {
    const P = plan(LAYOUT);
    const A = K.CH('E2: G#3 D4 E4, E2: G#3 D4 E4, A1: G3 C#4 E4, E2: G#3 D4 E4, B1: A3 D#4 F#4, A1: G3 C#4 E4, E2: G#3 D4 E4, B1: A3 D#4 F#4');
    const B = K.CH('A1: G3 C#4 E4, A1: G3 C#4 E4, E2: G#3 D4 E4, B1: A3 D#4 F#4');
    const HARP = K.mel('B4/2 D5/2 E5/4 G5/2 E5/2 D5/4 | E5/3 D5/1 B4/4 A4/2 G4/2 E4/4 | A4/2 C5/2 E5/4 G5/2 A5/2 G5/4 | E5/6 D5/2 E5/8 | '
      + 'F#5/2 A5/2 B5/4 A5/2 F#5/2 D#5/4 | E5/2 G5/2 A5/4 G5/2 E5/2 C#5/4 | B4/2 D5/2 E5/4 G5/2 B5/2 G5/4 | F#5/4 A5/4 B5/8');
    const BLUE = K.mel('A5/6 G5/2 E5/8 | A5/4 C6/4 B5/2 A5/2 G5/4 | E5/6 G5/2 B5/8 | A5/4 F#5/4 D#5/8');
    // the riff (bass and guitar together; [from the chord's root, length]): the root, a quick third and back, the fourth, the
    // blue fifth bending up and falling back, the third, the root… the seventh below, the root
    const RIFF = { 0: [0, 2], 2: [3, 1], 3: [0, 1], 4: [5, 2], 6: [6, 1], 7: [5, 1], 8: [3, 2], 10: [0, 2], 12: [-2, 2], 14: [0, 2] };
    return { bpm: 122, len: 320, from: 64, swing: 0.1, vol: 0.58, verb: 0.1, echo: 0.04, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, [sec, k] = P[bar];
      const ch = sec === 'B' ? B[k] : sec === 'A' ? A[k] : sec === 'U' ? A[7] : A[0];
      // the stomp and the claps (a boot on one and the "and" of two, hands on two and four), the kit under them in the drops
      if (sec !== 'U' || st < 12) { if (st === 0 || st === 6 || (st === 10 && sec !== 'I')) K.stomp(t, st === 0 ? 1 : 0.8); if (st === 4 || st === 12) K.hclap(t, 0.9); }
      if (sec === 'A' || sec === 'B') { if (st === 0 || st === 6 || st === 10) K.kick(t, 0.6); if (st === 4 || st === 12) K.snare(t, 0.55); if (!(st & 1)) K.hat(t, st & 2 ? 0.3 : 0.45); }
      if (sec === 'U') { if (st % 2 === 0) K.snare(t, 0.3 + 0.04 * st + (k ? 0.15 : 0)); if (k && st >= 8) K.snare(t + s16 / 2, 0.4); if (st === 0 && !k) K.swell(t, s16 * 32, 0.8); }
      if (bar === 3 && st === 0) K.swell(t, s16 * 16, 0.6);
      if (st === 0 && crashOn(sec, k)) K.crash(t, 0.7);
      // the mill: an anvil on four every other bar, the gears ticking in the breakdown
      if (sec === 'A' && (k & 1) && st === 12) K.anvil(t, 0.4, 1180);
      if (sec === 'R' && !(st & 1)) K.tick(t, !(st & 3), 0.5);
      // the riff on the fuzz bass and the guitar (from the build's third bar), following the chord's root
      if (bar >= 2 && sec !== 'U') { const r = RIFF[st]; if (r) { const m = ch[0] + r[0]; K.fuzzbass(m, t, r[1] * s16 * 0.9, 0.8); if (sec !== 'R') K.odgtr(m + 12, t, r[1] * s16 * 0.85, 0.45, st === 6 ? 1 : 0); } }
      // power chords on the off-beats in B
      if (sec === 'B' && (st === 2 || st === 10)) [0, 7, 12].forEach(o => K.odgtr(ch[0] + 12 + o, t, s16 * 1.6, 0.32));
      // the blues harmonica
      if (sec === 'A') { const n = HARP[k * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.9, 'harp', 0.7); }
      if (sec === 'B') { const n = BLUE[k * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.9, 'harp', 0.65); }
    } };
  });

  // ---------------------------------------------------------------- 'boss_frog': Bayou Hopper (zydeco, 141, G)
  add('boss_frog', () => {
    const P = plan(LAYOUT);
    const A = K.CH('G1: B3 D4 F4, G1: B3 D4 F4, C2: E4 G4 Bb4, G1: B3 D4 F4, D2: F#3 A3 C4, C2: E4 G4 Bb4, G1: B3 D4 F4, D2: F#3 A3 C4');
    const B = K.CH('C2: E4 G4 Bb4, C2: E4 G4 Bb4, G1: B3 D4 F4, D2: F#3 A3 C4');
    const BOX = K.mel('D5/1 E5/1 G5/2 G5/2 A5/2 G5/2 E5/2 D5/2 B4/2 | D5/2 G5/2 Bb5/1 B5/3 A5/2 G5/2 E5/4 | E5/1 F5/1 G5/2 C6/2 Bb5/2 G5/2 E5/2 C5/4 | D5/2 B4/2 G4/4 r/2 D5/2 G5/4 | '
      + 'F#5/2 A5/2 C6/2 A5/2 F#5/2 D5/2 F#5/4 | G5/2 E5/2 C5/2 E5/2 Bb5/4 G5/4 | B4/2 D5/2 G5/2 B5/2 A5/2 G5/2 E5/2 D5/2 | C5/2 C#5/2 D5/4 r/8');
    const FID = K.mel('G5/4 E5/2 G5/2 C6/4 Bb5/4 | A5/2 G5/2 E5/2 C5/2 E5/8 | D5/4 G5/4 B5/4 D6/4 | C6/2 A5/2 F#5/2 D5/2 A5/8');
    const BS = { 0: 0, 4: 7, 6: 9, 8: 12, 10: 10, 12: 7, 14: 4 };
    return { bpm: 141, len: 320, from: 64, swing: 0.12, vol: 0.36, verb: 0.09, echo: 0.04, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, [sec, k] = P[bar];
      const ch = sec === 'B' ? B[k] : sec === 'A' ? A[k] : sec === 'U' ? A[7] : A[0];
      // the rubboard scraping sixteenths, leaning on the off-beats
      if (sec !== 'U' || k === 0) K.scrape(t, s16 * 0.7, st % 4 === 2 ? 0.55 : 0.3, 5400, 110);
      // the two-step: kick on one and three (and a push before three), snare on two and four
      if (sec === 'A' || sec === 'B' || (sec === 'I' && bar >= 2)) { if (st === 0 || st === 8 || st === 7) K.kick(t, st === 7 ? 0.6 : 0.95); if (st === 4 || st === 12) K.snare(t, 0.6); if (st % 4 === 2) K.hat(t, 0.4, st === 14); }
      if (sec === 'U') { if (!(st & 1)) K.snare(t, 0.3 + 0.04 * st + (k ? 0.12 : 0)); if (k && (st & 1)) K.snare(t, 0.3); if (st === 0 && !k) K.swell(t, s16 * 32, 0.75); }
      if (st === 0 && crashOn(sec, k)) K.crash(t, 0.7);
      // the bass bouncing (root, fifth, sixth, octave…); the accordion's chords chanking on the off-beats
      if (bar >= 2 && sec !== 'U') { const o = BS[st]; if (o !== undefined) K.roundbass(ch[0] + 12 + o, t, s16 * 1.5, 0.9); }
      if ((sec === 'A' || sec === 'B' || sec === 'R') && st % 4 === 2) K.accchord(ch.slice(1), t, s16 * 1.2, 0.6);
      // the accordion's tune; the fiddle takes B
      if (sec === 'A') { const n = BOX[k * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.92, 'accordion', 0.8); }
      if (sec === 'B') { const n = FID[k * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'rabeca', 0.7); }
      // ribbit! at the turns
      if ((bar === 1 || (sec === 'A' && (k === 3 || k === 7)) || sec === 'R') && (st === 12 || st === 14)) K.vox(st === 12 ? 40 : 43, t, 0.07, 0.55, 'u', 'o');
    } };
  });

  // ---------------------------------------------------------------- 'boss_bat': Echoes in the Dark (gothic organ rock, 157, C♯ minor)
  add('boss_bat', () => {
    const P = plan(LAYOUT);
    const A = K.CH('C#2: E3 G#3 C#4, C#2: E3 G#3 C#4, A1: E3 A3 C#4, B1: D#3 F#3 B3, C#2: E3 G#3 C#4, C#2: E3 G#3 C#4, F#1: F#3 A3 C#4, G#1: G#3 B#3 D#4');
    const B = K.CH('A1: E3 A3 C#4, B1: D#3 F#3 B3, C#2: E3 G#3 C#4, G#1: G#3 B#3 D#4');
    const HOOK = K.mel('C#5/2 E5/2 G#5/2 C#6/2 B#5/2 C#6/2 G#5/4 | A5/2 G#5/2 F#5/2 E5/2 D#5/2 E5/2 C#5/4 | E5/2 A5/2 C#6/2 E6/2 D6/2 C#6/2 A5/4 | B5/3 A5/1 G#5/2 F#5/2 D#5/8 | '
      + 'C#5/2 E5/2 G#5/2 C#6/2 E6/2 D#6/2 C#6/4 | G#5/2 B5/2 E6/2 D#6/2 C#6/2 B5/2 G#5/4 | F#5/2 A5/2 C#6/2 F#6/2 E6/2 C#6/2 A5/4 | G#5/4 B#5/4 D#6/4 G#6/4');
    const LONG = K.mel('E6/8 C#6/8 | D#6/8 F#6/8 | G#6/12 E6/4 | D#6/16');
    return { bpm: 157, len: 320, from: 64, swing: 0, vol: 0.53, verb: 0.16, echo: 0.3, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, [sec, k] = P[bar];
      const ch = sec === 'B' ? B[k] : sec === 'A' ? A[k] : sec === 'U' ? A[7] : A[0];
      // in the dark: sonar pings (they come back as the song's echo), a low drone; then the drums
      if (sec === 'I' && st % 8 === 0) K.sonar(bar & 1 ? 85 : 88, t, 0.6);
      if ((sec === 'I' || sec === 'R') && st === 0) K.darkpad(ch[0] + 12, t, s16 * 15, 0.5);
      if (sec === 'A' || (sec === 'I' && bar >= 2)) { if (st === 0 || st === 3 || st === 8 || st === 11 || (st === 14 && (bar & 1))) K.rkick(t, st === 0 ? 1 : 0.75); if (st === 4 || st === 12) K.fsnare(t, 0.9); K.hat(t, st & 1 ? 0.25 : 0.42); }
      if (sec === 'B') { if (st === 0 || st === 8 || st === 10) K.rkick(t, 0.85); if (st === 4 || st === 12) K.fsnare(t, 0.8); if (!(st & 1)) K.ride(t, 0.5); }
      if (sec === 'U') { if (!(st & 1) || k) K.fsnare(t, 0.25 + 0.04 * st); if (st === 0 && !k) K.swell(t, s16 * 32, 0.8); if (!(st & 3)) K.rkick(t, 0.8); }
      if (st === 0 && crashOn(sec, k)) K.china(t, 0.7);
      // the bass: driving eighths, climbing a half step into the next bar
      if (sec === 'A' || sec === 'B' || (sec === 'I' && bar >= 2)) { if (!(st & 1)) K.rockbass(ch[0] + (st === 14 ? -1 : st === 12 && (bar & 1) ? -2 : 0), t, s16 * 1.7, st % 8 === 0 ? 1 : 0.8); }
      // the organ: stabs off the beat (A), held chords (B, the breakdown)
      if (sec === 'A' && (st === 6 || st === 14)) K.hammond(ch.slice(1).map(m => m + 12), t, s16 * 1.4, 0.7);
      if ((sec === 'B' || sec === 'R') && st === 0) K.hammond(ch.slice(1).map(m => m + 12), t, s16 * 15.5, 0.6, 1.2);
      // the lead, echoing round the cave: the hook (A), long notes (B)
      if (sec === 'A') { const n = HOOK[k * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.9, 'saw', 0.62); }
      if (sec === 'B') { const n = LONG[k * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'saw', 0.55); }
    } };
  });

  // ---------------------------------------------------------------- 'boss_bee': Queen of the Hive (Afrobeat, 119, A dorian)
  add('boss_bee', () => {
    const P = plan(LAYOUT);
    const [Am, D9] = K.CH('A1: G3 C4 E4, D2: F#3 C4 E4'), A = [Am, Am, D9, D9, Am, Am, D9, D9];
    const B = K.CH('F1: E3 A3 C4, E2: D3 G3 B3, D2: C3 F3 A3, E2: D3 G#3 B3');
    const HORN = K.mel('A4/2 C5/2 D5/2 E5/2 r/2 G5/2 E5/4 | D5/2 C5/2 A4/4 r/4 G4/2 A4/2 | A4/2 C5/2 D5/2 F#5/2 r/2 A5/2 F#5/4 | E5/2 D5/2 C5/4 r/4 D5/2 E5/2 | '
      + 'A5/2 G5/2 E5/2 D5/2 r/2 C5/2 D5/4 | E5/2 G5/2 A5/4 r/4 C6/2 A5/2 | B5/2 A5/2 F#5/2 D5/2 r/2 E5/2 F#5/4 | A5/4 G5/2 E5/2 D5/8');
    const KICK = K.pat('x.....x...x..x..'), GHOST = K.pat('..-.x.-.-.-.x.-.'), BELL = K.pat('x.x.xx.x.x.xx.x.'), GTR = K.pat('.x.x.x.xx.x.x.x.');
    const BASS = { 0: 0, 3: 0, 5: 3, 7: 5, 9: 7, 11: 10, 12: 7, 14: 5 };     // (round and round: the root, the minor third, the fourth, the fifth, the seventh)
    return { bpm: 119, len: 320, from: 64, swing: 0.08, vol: 0.59, verb: 0.1, echo: 0.06, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, [sec, k] = P[bar];
      const ch = sec === 'B' ? B[k] : sec === 'A' ? A[k] : sec === 'U' ? B[3] : A[k & 1 ? 2 : 0];
      // the hive waking: buzzes gliding, the shekere and the bell; then the drums
      if (sec === 'I' && st % 8 === 4) K.bee(69 + (bar & 1) * 3, 66 + bar, t, s16 * 3.5, 0.6);
      if (sec !== 'U' || k === 0) { if (!(st & 1)) K.agbe(t, st % 4 === 0 ? 0.8 : 0.5); if (BELL[st]) K.cowbell(t, 0.45, !(st & 2)); }
      if (sec === 'A' || sec === 'B' || (sec === 'I' && bar >= 2)) {
        if (KICK[st]) K.funkkick(t, st === 0 ? 1 : 0.8);
        const g = GHOST[st]; if (g) K.snare(t, g === 1 ? 0.7 : 0.18);
        K.hat(t, st === 6 || st === 14 ? 0.5 : st & 1 ? 0.2 : 0.35, st === 6 || st === 14);
      }
      if (sec === 'U') { if (!(st & 1) || k) K.snare(t, 0.25 + 0.04 * st); if (st === 0 && !k) K.swell(t, s16 * 32, 0.7); if (st % 4 === 0) K.funkkick(t, 0.8); }
      if (st === 0 && crashOn(sec, k)) K.crash(t, 0.6);
      // the bass's loop; two guitars locking together (a muted chop, and a single-note line)
      if (bar >= 2 && sec !== 'U') { const o = BASS[st]; if (o !== undefined) K.fbass(ch[0] + 12 + o, t, s16 * 1.3, 0.85); }
      if ((sec !== 'I' || bar >= 1) && sec !== 'U' && GTR[st]) K.chorusgtr(ch.slice(1).map(m => m + 12), t, s16 * 0.5, 0.8);
      if ((sec === 'A' || sec === 'R') && st % 4 === 3) K.clav(ch[1 + ((st >> 2) % 3)] + 12, t, 0.7);
      // the horns' riff (trumpet and sax an octave apart); in B, the queen herself: buzzing glides
      if (sec === 'A') { const n = HORN[k * 16 + st]; if (n) { K.lead(n[0] + 12, t, n[1] * s16 * 0.8, 'tptlead', 0.55); K.lead(n[0], t, n[1] * s16 * 0.8, 'sax', 0.55); } }
      if (sec === 'B' && st % 4 === 0) { const c = ch.slice(1); K.bee(c[(st >> 2) % c.length] + 24, c[((st >> 2) + 1) % c.length] + 24, t, s16 * 3.6, 0.8); }
    } };
  });

  // ---------------------------------------------------------------- 'boss_snowman': Snowball Ska (ska-punk, 164, F)
  add('boss_snowman', () => {
    const P = plan(LAYOUT);
    const A = K.CH('F2: A3 C4 F4, D2: A3 D4 F4, Bb1: Bb3 D4 F4, C2: Bb3 E4 G4, F2: A3 C4 F4, D2: A3 D4 F4, G1: Bb3 D4 F4, C2: Bb3 E4 G4');
    const B = K.CH('Bb1: Bb3 D4 F4, C2: Bb3 E4 G4, A1: A3 C#4 E4, D2: A3 D4 F4');
    const HORN = K.mel('C5/2 F5/2 A5/2 C6/2 A5/4 F5/4 | D5/2 F5/2 A5/2 D6/2 C6/4 A5/4 | Bb4/2 D5/2 F5/2 Bb5/2 A5/2 G5/2 F5/4 | E5/4 G5/4 C6/8 | '
      + 'C6/2 A5/2 F5/2 A5/2 C6/2 D6/2 C6/4 | A5/2 F5/2 D5/2 F5/2 A5/2 Bb5/2 A5/4 | G5/2 Bb5/2 D6/4 C6/2 Bb5/2 G5/4 | E5/2 G5/2 Bb5/2 C6/2 r/8');
    const PUNK = K.mel('F5/4 G5/4 A5/8 | G5/4 A5/4 Bb5/4 C6/4 | C#6/4 E6/4 A5/8 | D6/16');
    const WALK = [0, 4, 7, 9];
    return { bpm: 164, len: 320, from: 64, swing: 0, vol: 0.35, verb: 0.08, echo: 0.04, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, [sec, k] = P[bar];
      const ch = sec === 'B' ? B[k] : sec === 'A' ? A[k] : sec === 'U' ? A[7] : A[0];
      // the ice tower's clock ticking, sleigh bells, then the band
      if (sec === 'I' && bar < 2 && !(st & 3)) K.tick(t, !(st & 4), 0.6);
      if (sec !== 'U') { if (st % 4 === 2) K.jingle(t, 0.7, 0.09); else if (sec === 'B' && !(st & 1)) K.jingle(t, 0.35, 0.06); }
      // ska: kick on one and three, snare on two and four, the skank on every off-beat; B goes punk (four on the floor)
      if (sec === 'A' || (sec === 'I' && bar >= 2)) { if (st === 0 || st === 8 || (st === 10 && (bar & 1))) K.kick(t, 0.9); if (st === 4 || st === 12) K.snare(t, 0.7); if (!(st & 1)) K.hat(t, st & 2 ? 0.45 : 0.25); }
      if (sec === 'B') { if (!(st & 3)) K.kick(t, 0.95); if (st === 4 || st === 12) K.snare(t, 0.8); if (!(st & 1)) K.hat(t, 0.4, st % 4 === 2); }
      if (sec === 'U') { if (!(st & 1) || k) K.snare(t, 0.25 + 0.04 * st); if (st === 0 && !k) K.swell(t, s16 * 32, 0.75); }
      if (sec === 'R' && st === 0) K.kick(t, 0.7);
      if (st === 0 && crashOn(sec, k)) K.crash(t, 0.75);
      if ((sec === 'A' || sec === 'R' || (sec === 'I' && bar >= 2)) && st % 4 === 2) K.skank(ch.slice(1).map(m => m + 12), t, 0.9);
      // the walking bass (quarters up the chord); punk eighths and power chords in B
      if (sec === 'A' || sec === 'R' || (sec === 'I' && bar >= 2)) { if (!(st & 3)) K.roundbass(ch[0] + 12 + WALK[st >> 2], t, s16 * 3.4, 0.9); }
      if (sec === 'B' && !(st & 1)) K.rockbass(ch[0], t, s16 * 1.7, 0.85);
      if (sec === 'B' && (st === 0 || st === 6 || st === 10)) [0, 7, 12].forEach(o => K.odgtr(ch[0] + 12 + o, t, s16 * (st === 0 ? 5.5 : 3.5), 0.3));
      // the horns (trumpet, the trombone an octave down); the glockenspiel joins the second time round; the celesta in the breakdown
      if (sec === 'A') { const n = HORN[k * 16 + st]; if (n) { K.lead(n[0], t, n[1] * s16 * 0.85, 'tptlead', 0.62); K.lead(n[0] - 12, t, n[1] * s16 * 0.85, 'bone', 0.5); if (k >= 4) K.glock(n[0] + 12, t, 0.6); } }
      if (sec === 'B') { const n = PUNK[k * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.92, 'tptlead', 0.6); }
      if (sec === 'R' && st % 4 === 0) K.celesta(ch[1 + (st >> 2) % 3] + 24, t, 0.6, 0.8);
    } };
  });

  // ---------------------------------------------------------------- 'boss_crab': Pinch and Run (surf rock, 170, A minor)
  add('boss_crab', () => {
    const P = plan(LAYOUT);
    const A = K.CH('A1: A3 C4 E4, A1: A3 C4 E4, F1: A3 C4 F4, G1: B3 D4 G4, A1: A3 C4 E4, A1: A3 C4 E4, D2: A3 D4 F4, E2: G#3 B3 E4');
    const B = K.CH('D2: A3 D4 F4, A1: A3 C4 E4, F1: A3 C4 F4, E2: G#3 B3 E4');
    // the tremolo guitar's tune (each note picked again on every sixteenth), and the sax honking in B
    const TREM = K.mel('A4/4 C5/4 E5/4 A5/4 | G5/4 F5/2 E5/2 D5/4 C5/4 | C5/4 F5/4 A5/4 C6/4 | B5/4 A5/2 G5/2 D5/8 | '
      + 'A5/4 G5/2 A5/2 C6/4 B5/4 | A5/4 E5/4 C5/4 A4/4 | D5/4 F5/4 A5/4 D6/4 | E6/6 D6/2 B5/4 G#5/4');
    const SAX = K.mel('A4/2 A4/2 r/2 C5/2 D5/4 F5/4 | E5/6 C5/2 A4/8 | A4/2 C5/2 r/2 F5/2 E5/4 C5/4 | B4/4 D5/4 E5/8');
    const noteAt = (M, at) => { for (let j = at; j >= Math.max(0, at - 8); j--) if (M[j]) return j + M[j][1] > at ? M[j] : null; return null; };
    return { bpm: 170, len: 320, from: 64, swing: 0, vol: 0.45, verb: 0.2, echo: 0.06, echoSteps: 2, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, [sec, k] = P[bar];
      const ch = sec === 'B' ? B[k] : sec === 'A' ? A[k] : sec === 'U' ? A[7] : A[0];
      // waves, then the surf drummer's tom roll, a glissando down the neck into the drop
      if (sec === 'I' && bar < 2 && st === 0) K.wave(t, s16 * 14, 0.8);
      if (sec === 'I' && bar >= 2) { if (!(st & 1)) K.simtom(t, [196, 165, 147, 123][(st >> 2) & 3] * (bar === 3 ? 1 : 0.85), bar === 3 ? 0.9 : 0.75); if (bar === 3 && st === 12) K.gliss([76, 74, 71, 69, 67, 64, 62, 60, 57, 55, 52], t, 0.6, 0.02); }
      if (sec === 'A' || sec === 'B') { if (st === 0 || st === 8 || (st === 6 && sec === 'A')) K.kick(t, 0.9); if (st === 4 || st === 12) K.snare(t, 0.75); if (!(st & 1)) K.ride(t, st & 2 ? 0.35 : 0.55); if (sec === 'A' && st >= 14 && (k & 1)) K.simtom(t, st === 14 ? 147 : 123, 0.7); }
      if (sec === 'U') { if (!(st & 1)) K.simtom(t, 196 - st * 5, 0.7); if (k) K.snare(t, 0.3 + 0.04 * st); if (st === 0 && !k) K.swell(t, s16 * 32, 0.7); }
      if (st === 0 && crashOn(sec, k)) K.crash(t, 0.75);
      // the bass in eighths; chord chops on two and four; the tremolo tune
      if (sec === 'A' || sec === 'B' || sec === 'R') { if (!(st & 1)) K.rockbass(ch[0] + (st === 6 || st === 14 ? 7 : 0), t, s16 * 1.6, st === 0 ? 1 : 0.8); }
      if (sec === 'A' && (st === 4 || st === 12)) ch.slice(1).forEach(m => K.odgtr(m, t, s16 * 0.7, 0.26));
      if (sec === 'A') { const n = noteAt(TREM, k * 16 + st); if (n) K.tremgtr(n[0], t, s16 * 0.9, 0.85); }
      if (sec === 'B') { const n = SAX[k * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.88, 'sax', 0.7); if (st % 4 === 0) K.tremgtr(ch[1] + 12, t, s16 * 3.5, 0.4); }
      if (sec === 'R' && !(st & 1)) K.tremgtr(ch[1 + (st >> 1) % 3] + 12, t, s16 * 0.9, 0.5);
    } };
  });

  // ---------------------------------------------------------------- 'boss_worm': Under the Dunes (desert blues, 12/8: 12 steps a bar)
  add('boss_worm', () => {
    const P = plan(LAYOUT);
    const A = K.CH('E2: G3 B3 E4, E2: G3 B3 E4, G1: G3 B3 D4, D2: F#3 A3 D4, E2: G3 B3 E4, E2: G3 B3 E4, C2: G3 C4 E4, B1: F#3 A3 D#4');
    const B = K.CH('A1: G3 C4 E4, A1: G3 C4 E4, E2: G3 B3 E4, B1: F#3 A3 D#4');
    const HOOK = K.mel('E5/3 G5/3 A5/2 B5/1 A5/3 | G5/2 E5/1 D5/3 E5/6 | G5/3 B5/3 D6/3 B5/3 | A5/2 F#5/1 D5/3 A4/6 | '
      + 'E5/3 G5/3 B5/2 C6/1 B5/3 | A5/2 G5/1 E5/3 D5/6 | E5/3 G5/3 C6/3 B5/3 | B5/2 A5/1 F#5/3 D#5/6');
    // the chant in B (the guitar answers each call)
    const CALL = K.mel('B4/3 B4/3 A4/3 G4/3 | A4/6 r/6 | E4/3 G4/3 B4/3 A4/3 | F#4/6 r/6');
    const RIFF = { 0: 0, 2: 3, 3: 0, 5: 5, 6: 7, 8: 5, 9: 3, 11: -2 };     // (the open string, the minor third, the fourth, the fifth)
    return { bpm: 76, len: 240, from: 48, swing: 0, vol: 0.62, verb: 0.14, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      const bar = Math.floor(i / 12), st = i % 12, [sec, k] = P[bar], beat = st % 3 === 0;
      const ch = sec === 'B' ? B[k] : sec === 'A' ? A[k] : sec === 'U' ? A[7] : A[0];
      // the sand shifting: a low rumble, the worm moving under it
      if ((sec === 'I' || sec === 'R') && st === 0) K.reese(ch[0] - 12 + (bar & 1 ? 3 : 0), t, s16 * 11, 0.7);
      // the camp's drums: a heavy kick on one and the "and" of three, claps on two and four, the shaker's triplets, a hand drum
      if (bar >= 1 && sec !== 'U') {
        if (st === 0 || st === 7 || (st === 10 && sec !== 'R')) K.kick(t, st === 0 ? 1 : 0.75);
        if (st === 3 || st === 9) K.claps(t, 0.8);
        K.shaker(t, beat ? 0.7 : 0.4);
        if (st === 5 || st === 11) K.conga(t, st === 5 ? 'hi' : 'slap', 0.6);
      }
      if (sec === 'U') { K.conga(t, beat ? 'slap' : 'hi', 0.5 + 0.03 * st); if (beat) K.kick(t, 0.8); if (st === 0 && !k) K.swell(t, s16 * 24, 0.7); }
      if (st === 0 && sec === 'A' && (k === 0 || k === 4)) K.crash(t, 0.6);
      // the riff: a fuzz bass and the rhythm guitar together (from the build's third bar)
      if (bar >= 2 && sec !== 'U') { const o = RIFF[st]; if (o !== undefined) { K.fuzzbass(ch[0] + o, t, s16 * 1.3, 0.8); if (sec === 'A' || sec === 'I') K.odgtr(ch[0] + 24 + o, t, s16 * 1.2, 0.3, o === 3 ? 1 : 0); } }
      // the lead guitar bending into its notes; in B the chant, and the guitar answering it
      if (sec === 'A') { const n = HOOK[k * 12 + st]; if (n) K.odgtr(n[0], t, n[1] * s16 * 0.95, 0.55, n[1] >= 3 ? 1 : 0); }
      if (sec === 'B') { const n = CALL[k * 12 + st]; if (n) { K.vox(n[0], t, n[1] * s16 * 0.9, 0.7, 'a', 'o'); K.odgtr(n[0] + 12, t + s16 * 6, n[1] * s16 * 0.9, 0.35, 1); } }
    } };
  });

  // ---------------------------------------------------------------- 'boss_shade': Light It Up (gospel praise break, 147, B♭ minor → D♭)
  add('boss_shade', () => {
    const P = plan(LAYOUT);
    const A = K.CH('Bb1: Db4 F4 Ab4, Bb1: Db4 F4 Ab4, Eb2: Db4 G4 Bb4, Eb2: Db4 G4 Bb4, Bb1: Db4 F4 Ab4, Bb1: Db4 F4 Ab4, Gb1: Db4 F4 Bb4, F1: Eb4 A4 C5');
    const B = K.CH('Gb1: Db4 F4 Bb4, Ab1: C4 Eb4 Gb4, Db2: C4 F4 Ab4, Db2: C4 F4 Ab4');
    const SHOUT = K.mel('F5/2 Ab5/2 Bb5/2 Db6/2 Bb5/2 Ab5/2 F5/4 | Eb5/2 F5/2 Ab5/4 G5/2 Eb5/2 Db5/4 | F5/2 Ab5/2 Bb5/2 Db6/2 Eb6/2 F6/2 Db6/4 | Eb6/3 Db6/1 Bb5/4 G5/4 Bb5/4 | '
      + 'Bb5/2 Db6/2 F6/2 Eb6/2 Db6/2 Bb5/2 Ab5/4 | G5/2 Bb5/2 Db6/4 Eb6/2 Db6/2 Bb5/4 | F5/2 Ab5/2 Bb5/2 Db6/2 F6/4 Eb6/4 | Db6/2 Bb5/2 A5/2 C6/2 F6/8');
    const LIGHT = K.mel('F5/4 Ab5/4 Db6/8 | Eb6/4 C6/4 Ab5/8 | F6/6 Eb6/2 C6/4 Ab5/4 | Db6/16');
    const KICK = K.pat('x..x..x.x.x..x..'), GHOST = K.pat('-.-.x.--.-.-x.-.');
    return { bpm: 147, len: 320, from: 64, swing: 0.04, vol: 0.46, verb: 0.16, echo: 0.04, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, [sec, k] = P[bar];
      const ch = sec === 'B' ? B[k] : sec === 'A' ? A[k] : sec === 'U' ? A[7] : A[k & 1 ? 2 : 0];
      // the drowned chapel: the choir hums in the dark and the organ swells (the build, the breakdown); in B the choir opens up
      if ((sec === 'I' || sec === 'R' || sec === 'B') && (st === 0 || (sec === 'B' && st === 8))) ch.slice(1).forEach((m, j) => K.vox(m, t + j * 0.01, s16 * (sec === 'B' ? 7.5 : 15.5), 0.45, 'u', sec === 'B' ? 'a' : 'o'));
      if ((sec === 'I' || sec === 'R') && st === 0) K.hammond(ch.slice(1), t, s16 * 15.5, 0.55, 1.4);
      if (((sec === 'I' && bar >= 2) || sec === 'A' || sec === 'B' || sec === 'R') && (st === 4 || st === 12)) K.claps(t, 0.75);
      // the praise break: a busy kick, ghost notes around two and four, sixteenth hats, tom runs at the turns
      if (sec === 'A' || bar === 3) {
        if (KICK[st]) K.funkkick(t, st === 0 ? 1 : 0.8);
        const g = GHOST[st]; if (g) K.snare(t, g === 1 ? 0.85 : 0.15);
        K.hat(t, st & 1 ? 0.22 : 0.4);
        if (sec === 'A' && (k === 3 || k === 7) && st >= 12) K.simtom(t, [220, 185, 156, 131][st - 12], 0.8);
      }
      if (sec === 'B') { if (st === 0 || st === 10) K.funkkick(t, 0.9); if (st === 4 || st === 12) K.snare(t, 0.7); if (!(st & 1)) K.ride(t, 0.45); }
      if (sec === 'U') { if (!(st & 1) || k) K.snare(t, 0.25 + 0.045 * st); if (st % 4 === 0) K.funkkick(t, 0.9); if (st === 0 && !k) K.swell(t, s16 * 32, 0.8); if (k && st === 14) K.vox(70, t, s16 * 1.5, 0.8, 'e', 'i'); }
      if (st === 0 && crashOn(sec, k)) K.crash(t, 0.8);
      // the bass: octaves and runs
      if (sec === 'A' || sec === 'B' || (sec === 'I' && bar >= 2)) { if (st === 0 || st === 3 || st === 6 || st === 8 || st === 10 || st === 13) K.synbass(ch[0] + (st === 3 || st === 13 ? 12 : st === 10 ? 10 : 0), t, s16 * 1.5, 0.9); }
      // the organ: the shout's stabs (A), held chords with the choir (B)
      if (sec === 'A' && (st === 2 || st === 6 || st === 11 || st === 14)) K.hammond(ch.slice(1).map(m => m + 12), t, s16 * 0.9, 0.65);
      if (sec === 'B' && st === 0) K.hammond(ch.slice(1).map(m => m + 12), t, s16 * 15.5, 0.6, 6.6);
      // the shout on the organ's lead, the light's tune on a flugelhorn; «Hey!» on the drop's downbeats
      if (sec === 'A') { const n = SHOUT[k * 16 + st]; if (n) K.hammond([n[0]], t, n[1] * s16 * 0.88, 1.1, 6.6); }
      if (sec === 'B') { const n = LIGHT[k * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'flugel', 0.7); }
      if (sec === 'A' && (k === 0 || k === 4) && st === 0) K.vox(65, t, s16 * 1.5, 0.75, 'e', 'i');
    } };
  });

  // ---------------------------------------------------------------- 'boss_laughter': Who's Laughing Now? (new jack swing, 101, F♯ minor)
  add('boss_laughter', () => {
    const P = plan(LAYOUT);
    const A = K.CH('F#1: E3 A3 C#4 G#4, F#1: E3 A3 C#4 G#4, D2: F#3 A3 C#4 E4, C#2: E#3 B3 E4 G#4, B1: D3 F#3 A3 C#4, E2: D3 G#3 B3 F#4, A1: G#3 C#4 E4 B4, C#2: E#3 B3 D4 G#4');
    const B = K.CH('D2: F#3 A3 C#4 E4, E2: D3 G#3 B3 F#4, C#2: E#3 B3 E4 G#4, F#1: E3 A3 C#4 G#4');
    const HOOK = K.mel('C#6/2 A5/2 F#5/2 E5/2 F#5/2 r/2 A5/2 B5/2 | C#6/2 E6/2 C#6/2 B5/2 A5/4 r/4 | D6/2 C#6/2 A5/2 F#5/2 A5/2 r/2 C#6/2 D6/2 | G#5/2 B5/2 D#6/2 E6/2 r/8 | '
      + 'B5/2 A5/2 F#5/2 D5/2 C#5/2 r/2 D5/2 F#5/2 | G#5/2 B5/2 D6/2 E6/2 F#6/4 r/4 | E6/2 C#6/2 A5/2 G#5/2 A5/2 r/2 C#6/2 E6/2 | E#6/2 D#6/2 C#6/2 B5/2 G#5/8');
    // the laugh: «ha ha ha», stepping down (the Hush's audience, mocking you)
    const HA = [76, 75, 73, 71, 69], KICK = K.pat('x.....x.x.x...x.'), SNR = K.pat('....x.......x..x');
    return { bpm: 101, len: 320, from: 64, swing: 0.22, vol: 0.59, verb: 0.12, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, [sec, k] = P[bar];
      const ch = sec === 'B' ? B[k] : sec === 'A' ? A[k] : sec === 'U' ? A[7] : A[0];
      const laugh = (down, n) => { for (let j = 0; j < n; j++) K.vox(HA[j % HA.length] - down, t + j * s16 * 0.66, s16 * 0.45, 0.6, 'a', 'a'); };
      // the theater: the laughter breaks out, then the beat
      if (sec === 'I' && st === 0) laugh(bar & 1 ? 2 : 0, 5);
      if (sec === 'I' && bar >= 2 && st === 0) ch.slice(1).forEach(m => K.warmpad(m, t, s16 * 15, 0.5));
      // new jack swing: a Linn kick, the big gated snare (with a pick-up at the bar's end), swung sixteenths on the hat
      if (sec === 'A' || sec === 'B' || (sec === 'I' && bar >= 2)) { if (KICK[st]) K.linnkick(t, st === 0 ? 1 : 0.85); if (SNR[st]) K.gatesnare(t, st === 15 ? 0.5 : 0.95); K.hat(t, st & 1 ? 0.25 : 0.42); if (st % 4 === 2) K.shaker(t, 0.6); }
      if (sec === 'U') { if (!(st & 1) || k) K.gatesnare(t, 0.2 + 0.04 * st); if (st === 0 && !k) K.swell(t, s16 * 32, 0.75); if (k && st === 8) laugh(-3, 6); }
      if (st === 0 && sec === 'A' && (k === 0 || k === 4)) K.crash(t, 0.7);
      // the synth bass, syncopated; brass stabs on the pushes; a pad under B
      if (sec === 'A' || sec === 'B' || sec === 'R' || (sec === 'I' && bar >= 2)) { if (st === 0 || st === 3 || st === 6 || st === 10 || st === 11) K.junobass(ch[0] + 12 + (st === 11 ? 7 : st === 6 ? 12 : 0), t, s16 * (st === 0 ? 2.5 : 1.2), 0.85); }
      if (sec === 'A' && (st === 3 || st === 10)) K.polybrass(ch.slice(2).map(m => m + 12), t, s16 * 0.9, 0.7);
      if (sec === 'B' && st === 0) ch.slice(1).forEach(m => K.warmpad(m + 12, t, s16 * 15, 0.5));
      // the hook on a bright FM keyboard; in B the hook's start, an octave down, and the laughter answering
      if (sec === 'A') { const n = HOOK[k * 16 + st]; if (n) K.dxpiano(n[0], t, n[1] * s16 * 0.9, 0.85); }
      if (sec === 'B') { const n = HOOK[(k & 1) * 16 + st]; if (n && st < 8) K.dxpiano(n[0] - 12, t, n[1] * s16 * 0.9, 0.8); if (st === 10) laugh(k, 4); }
      if (sec === 'R' && (st === 0 || st === 8)) laugh(4 + (st >> 3), 3);
    } };
  });

  // ---------------------------------------------------------------- 'boss_silence': The Great Silence (darksynth, 114, D♯ minor)
  add('boss_silence', () => {
    const P = plan(LAYOUT);
    const A = K.CH('D#2: F#3 A#3 C#4, D#2: F#3 A#3 C#4, B1: F#3 A#3 D#4, C#2: F3 G#3 C#4, D#2: F#3 A#3 C#4, D#2: F#3 A#3 C#4, G#1: F#3 B3 D#4, A#1: G#3 D4 F4');
    const B = K.CH('B1: F#3 A#3 D#4, C#2: F3 G#3 C#4, D#2: F#3 A#3 C#4, A#1: G#3 D4 F4');
    const HOOK = K.mel('D#5/4 F#5/2 A#5/2 G#5/4 F#5/4 | F#5/2 G#5/2 A#5/4 C#6/4 A#5/4 | B5/4 A#5/2 F#5/2 D#5/4 F#5/4 | F5/4 G#5/4 C#6/8 | '
      + 'D#6/4 C#6/2 A#5/2 G#5/4 F#5/4 | G#5/2 A#5/2 C#6/4 D#6/4 F#6/4 | F#6/4 D#6/2 B5/2 G#5/4 D#5/4 | D5/4 F5/4 G#5/4 A#5/4');
    const HIGH = K.mel('A#5/8 D#6/8 | C#6/8 G#5/8 | F#6/12 F6/4 | F6/16');
    // the Great Silence swallows the end of the drop's second and fourth bars (a whoosh, then nothing); from its fifth bar on,
    // the silences are gone
    const hushed = (sec, k) => sec === 'A' && (k & 1) && k < 4;
    return { bpm: 114, len: 320, from: 64, swing: 0, vol: 0.51, verb: 0.14, echo: 0.16, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, [sec, k] = P[bar];
      const ch = sec === 'B' ? B[k] : sec === 'A' ? A[k] : sec === 'U' ? A[7] : A[0];
      if (hushed(sec, k) && st >= 12) { if (st === 12) K.swirl(t, s16 * 4, 0.35); return; }
      // the gray future: a cold pad and the arpeggio ticking alone, then the drums
      if ((sec === 'I' || sec === 'R') && st === 0) ch.slice(1).forEach(m => K.darkpad(m + 12, t, s16 * 15.5, 0.45));
      if (sec !== 'U' || k === 0) K.arp(ch[1 + (st % 3)] + (st & 4 ? 24 : 12), t, sec === 'I' && bar < 2 ? 0.35 : 0.55, s16 * 0.8);
      if (sec === 'A' || sec === 'B' || (sec === 'I' && bar >= 2)) {
        if (st === 0 || st === 8 || (st === 7 && sec === 'A') || (st === 14 && (bar & 1))) K.linnkick(t, st === 0 ? 1 : 0.8);
        if (st === 4 || st === 12) K.gatesnare(t, 0.9);
        if (!(st & 1)) K.hat(t, st & 2 ? 0.4 : 0.25, sec === 'B' && st % 4 === 2);
      }
      if (sec === 'U') { if (!(st & 1) || k) K.gatesnare(t, 0.2 + 0.045 * st); if (st % 4 === 0) K.linnkick(t, 0.85); if (st === 0 && !k) K.swell(t, s16 * 32, 0.8); }
      if (st === 0 && crashOn(sec, k)) K.crash(t, 0.75);
      // the bass: driving eighths, an octave up on the off-beats; stabs
      if (sec === 'A' || sec === 'B' || (sec === 'I' && bar >= 2)) { if (!(st & 1)) K.synbass(ch[0] + (st % 4 === 2 ? 12 : 0), t, s16 * 1.5, st === 0 ? 1 : 0.8); }
      if (sec === 'A' && (st === 6 || st === 14)) K.stab(ch.slice(1).map(m => m + 12), t, s16 * 1.2, 0.6, 0.9);
      // the lead (a resonant robot voice): the hook (cut short where the Silence swallows it), long high notes in B
      if (sec === 'A') { const n = HOOK[k * 16 + st]; if (n) K.lead(n[0], t, (hushed(sec, k) ? Math.min(n[1], 12 - st) : n[1]) * s16 * 0.9, 'robo', 0.62); }
      if (sec === 'B') { const n = HIGH[k * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'robo', 0.55); }
    } };
  });
})();
