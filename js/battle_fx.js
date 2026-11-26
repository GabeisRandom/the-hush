'use strict';
// The battle's sounds (DESIGN.md 16: "Make enemies make a noise or smth when they speak/attack, battle felt really quiet").
// battle/flow.js calls BATTLE._.fx.voice(actor, text, o, G) for each line a foe (or Mimo) says, and BATTLE._.fx.on(event, G) for
// every battle event (main.js still plays its own SFX for them; these are layered on top):
//   voices   each kind has its own: a hushling mumbles in soft vowels with a breath, a moth flutters high, a beetle clicks, an
//            armadillo snorts and grunts, a frog croaks, a bat squeaks, a bee buzzes, a snowball crunches, the corn soldiers chirp,
//            the colonel barks. A syllable a word; a shout is louder, and its last syllable goes up. A boss (a giant one, the big
//            Hushling, the colonel) is an octave lower and slower, with a growl and a low horn under it. Mimo chirps or babbles.
//   moves    a wind-up before a foe attacks (rising for a high attack, falling for a low one), impacts (heavier for a bigger hit, a
//            crack for a strong one), blocks (a hard shell or a ball: a clonk; a repeated command: wooden knocks; the colonel's cape
//            and a crab's shell: a clang), dodges (a whoosh; a PERFECT one sparkles), getting hit, a KO (a deflating squeak), a
//            freed word (a chime), a level-up (a jingle), a boss's new phase (a stomp and a horn), dizzy stars, a boss's roll
//   puzzles  BFX.solved(): the chime when a puzzle's done (mill.js's floors)
// Kit instruments (Sound.kit) only play inside a song's step, so each sound is queued and played by a one-step deck (Sound.deck)
// into this file's own bus on Sound.out: nothing here touches audio.js or the music. BFX.preview() renders a demo of every sound
// offline (tests: { peak, rms }, and a WAV for listening).
const BFX = (() => {
  const SONG = 'fx_battle';           // (not music: a one-step player for these sounds; it does nothing when anything else calls it)
  const LEVEL = 0.55;
  let bus = null, pumping = false;
  const Q = [];
  const hasSound = () => typeof Sound !== 'undefined' && Sound.addSong && Sound.deck;
  if (hasSound()) Sound.addSong(SONG, { bpm: 240, len: 1, vol: 0.0001, play(i, t) { if (!pumping) return; const job = Q.shift(); if (job) try { job(t, Sound.kit); } catch (e) { console.warn('[bfx]', e); } } });
  function run(job) {
    if (!hasSound() || !Sound.ctx || !Sound.out || BFX.muted) return false;
    if (!bus || bus.context !== Sound.ctx) { bus = Sound.ctx.createGain(); bus.gain.value = LEVEL; bus.connect(Sound.out); }
    Q.length = 0; Q.push(job); pumping = true;
    try { Sound.deck(SONG, bus, { loop: false }); } catch (e) { console.warn('[bfx]', e); } finally { pumping = false; Q.length = 0; }
    return true;
  }
  const play = name => { if (typeof Sound !== 'undefined' && Sound.play && !BFX.muted) Sound.play(name); };
  const hash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const rnd = k => { const x = Math.sin(k * 12.9898) * 43758.5453; return x - Math.floor(x); };
  // a syllable a word: es / pt / de by spaces, zh / ja by the notation's tokens (punctuation aside)
  const syllables = text => Math.max(1, Math.min(6, String(text).replace(/\[[^\]|]+\|([^\]]+)\]/g, '$1').split(/[\s、。！？，!?¡¿.,…]+/).filter(Boolean).length));

  // ------------------------------------------------------------ voices: [base midi, vowels, syllable length, gap, a layer]
  const VOICES = {
    hushling: { m: 69, vow: ['u', 'o', 'u', 'e'], len: 0.085, gap: 0.03, layer: 'breath' },
    hushbig: { m: 60, vow: ['o', 'u', 'a'], len: 0.12, gap: 0.035, layer: 'breath' },
    moth: { m: 81, vow: ['i', 'e', 'i'], len: 0.055, gap: 0.03, layer: 'flutter' },
    beetle: { m: 62, vow: ['o', 'a'], len: 0.07, gap: 0.035, layer: 'click' },
    armadillo: { m: 57, vow: ['o', 'u', 'o', 'a'], len: 0.1, gap: 0.03, layer: 'snort' },
    frog: { m: 50, vow: ['o', 'a'], len: 0.11, gap: 0.04, layer: 'croak' },
    bat: { m: 88, vow: ['i', 'e'], len: 0.045, gap: 0.02, layer: 'squeak' },
    bee: { m: 74, vow: ['u', 'i'], len: 0.08, gap: 0.02, layer: 'buzz' },
    snowball: { m: 72, vow: ['o', 'u', 'o'], len: 0.08, gap: 0.03, layer: 'crunch' },
    kernel: { m: 79, vow: ['a', 'e', 'i'], len: 0.055, gap: 0.025, layer: 'chirp' },
    popcorn: { m: 84, vow: ['o', 'a'], len: 0.05, gap: 0.02, layer: 'pop' },
    colonel: { m: 55, vow: ['a', 'o', 'a', 'e'], len: 0.11, gap: 0.03, layer: 'bark' },
    crab: { m: 66, vow: ['a', 'e'], len: 0.06, gap: 0.03, layer: 'clack' },
  };
  function layer(kind, t, len, K, v) {
    switch (kind) {
      case 'breath': K.brush(t, 0.7 * v, len + 0.04); break;
      case 'flutter': K.shaker(t, 0.9 * v); K.shaker(t + len * 0.5, 0.7 * v); break;
      case 'click': K.woodblock(t, true, 0.7 * v); K.chk(t + 0.02, v); break;
      case 'snort': K.scrape(t, len + 0.05, 0.9 * v, 900, 38); break;
      case 'croak': K.scrape(t, len + 0.06, 1.1 * v, 420, 32); break;
      case 'squeak': K.zap(t, 0.6 * v, 4400, 2600); break;
      case 'buzz': K.bee(74, 76, t, len + 0.05, 0.9 * v); break;
      case 'crunch': K.chk(t, 1.2 * v); K.chk(t + 0.03, 0.8 * v); break;
      case 'chirp': K.drop(t, 1.4 * v); break;
      case 'pop': K.popkick(t, 0.35 * v); break;
      case 'bark': K.tom(t, 150, 0.8 * v); break;
      case 'clack': K.clave(t, 0.8 * v); break;
    }
  }
  const isBoss = st => !!(st && (st.isBoss || (st.spec && (st.spec.giant || st.spec.queen)) || st.species === 'colonel' || st.species === 'hushbig'));
  function voice(st, text, o = {}) {
    if (!st) return;
    if (st.kind === 'mimo') { play(syllables(text) > 2 ? 'babble' : 'chirp'); return; }
    const V = VOICES[st.species]; if (!V) return;
    const boss = isBoss(st), shout = /shout/.test(o.cls || ''), n = syllables(text), seed = hash(text);
    run((t, K) => {
      const base = V.m - (st.size === 'big' && !boss ? 3 : 0) - (boss ? 12 : 0), v = (shout ? 1 : 0.65) * (boss ? 1.25 : 1);
      let at = t;
      for (let i = 0; i < n; i++) {
        const last = i === n - 1, m = base + Math.round((rnd(seed + i) - 0.5) * 7) + (shout && last ? 5 : 0);
        const len = V.len * (boss ? 1.5 : 1) * (shout && last ? 1.9 : 1);
        K.vox(m, at, len, v, V.vow[(seed + i) % V.vow.length], V.vow[(seed + i + 1) % V.vow.length]);
        layer(V.layer, at, len, K, v);
        at += len + V.gap * (boss ? 1.4 : 1);
      }
      if (boss) { K.sub808(base - 12, t, Math.min(1.4, at - t + 0.15), shout ? 0.9 : 0.55); if (shout) K.foghorn(base - 12, t, Math.min(1.6, at - t + 0.35), 0.7); }
    });
  }

  // ------------------------------------------------------------ the moves
  const SOUNDS = {
    // before a foe attacks: a rising swell, and a little glide up (a high attack) or down (a low one); a boss rumbles under it
    windup: (t, K, o) => { const len = o.boss ? 0.55 : 0.32; K.swell(t, len, o.boss ? 1.5 : 0.9); K.cuica(t + len * 0.25, !!o.high, o.boss ? 1.3 : 0.9, len * 0.75); if (o.boss) K.tub(36, t, len + 0.2, 0.7); },
    // a hit lands: a thud and a knock, heavier for a bigger hit; a strong one (crit, weak spot, belly) cracks too
    impact: (t, K, o) => { const v = Math.min(1.5, 0.55 + (o.d || 1) * 0.16); K.thud(t, 0.7 * v); K.chk(t, 1.3 * v); if (o.strong || (o.d || 1) >= 4) { K.popkick(t, 0.8); K.claps(t + 0.01, 0.7); } },
    // you or Mimo get hit
    hurt: (t, K) => { K.dubkick(t, 0.85); K.chk(t, 1.4); K.scrape(t + 0.01, 0.09, 0.8, 1600, 70); },
    // a hard shell or a ball: a dull clonk · a repeated command: two wooden knocks · a cape or a crab's shell: a clang
    shell: (t, K) => { K.anvil(t, 0.55, 760); K.woodblock(t, false, 0.9); },
    wood: (t, K) => { K.woodblock(t, true, 1); K.woodblock(t + 0.11, false, 0.9); },
    metal: (t, K) => { K.anvil(t, 0.9, 1320); K.chk(t, 1); },
    // a dodge: a whoosh; a PERFECT one with a glint
    dodge: (t, K, o) => { K.swell(t, 0.16, 1.1); if (o.perfect) { K.glock(96, t + 0.06, 0.8); K.glock(103, t + 0.12, 0.6); } },
    // a KO: a little deflating squeak (a boss: a long one, and a soft thump)
    ko: (t, K, o) => { K.cuica(t, false, o.boss ? 1.4 : 1, o.boss ? 0.7 : 0.32); if (o.boss) K.thud(t + 0.3, 1); },
    // a freed word: a little rising chime
    freed: (t, K) => { [84, 88, 91, 96].forEach((m, i) => K.celesta(m, t + i * 0.07, 0.9, 0.7)); },
    // Mimo's level-up: a jingle
    levelup: (t, K) => { [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => K.chipnote(m, t + i * 0.085, i === 6 ? 0.45 : 0.08, 1.1)); K.glock(96, t + 0.6, 1); },
    // a boss's new phase: a stomp and a low horn
    phase: (t, K) => { K.stomp(t, 1.3); K.stomp(t + 0.18, 1); K.foghorn(43, t + 0.05, 1.2, 0.9); },
    // dizzy stars
    dizzy: (t, K) => { [91, 95, 91, 95].forEach((m, i) => K.chipnote(m, t + i * 0.11, 0.07, 0.8)); },
    // the giant armadillo rolling at you
    rumble: (t, K) => { K.tub(33, t, 0.85, 0.8); K.scrape(t, 0.8, 0.5, 260, 24); },
    // a Hushling dropping in
    thud: (t, K) => { K.thud(t, 0.9); K.chk(t, 0.8); },
    // a puzzle solved (mill.js: a floor's way up opens): a bright rising arpeggio and a bell
    solved: (t, K) => { [72, 76, 79, 84, 88].forEach((m, i) => K.glock(m, t + i * 0.08, 1.2)); K.vibes(84, t + 0.42, 1, 1.2); K.celesta(96, t + 0.42, 0.8, 1.2); },
  };
  const fx = (name, o = {}) => run((t, K) => SOUNDS[name](t, K, o));
  function on(e) {
    if (!e) return;
    switch (e.type) {
      case 'windup': fx('windup', { high: !!e.high, boss: !!e.boss || isBoss(e.foe) }); break;
      case 'hit': fx('impact', { d: e.damage || 1, strong: !!e.strong }); break;
      case 'hurt': fx('hurt'); break;
      case 'block': fx('shell'); break;
      case 'blocked': fx('wood'); break;
      case 'bounce': case 'clang': fx('metal'); break;
      case 'dodge': fx('dodge', { perfect: !!e.perfect }); break;
      case 'ko': fx('ko', { boss: !!e.boss }); if (!e.boss) play('poof'); break;
      case 'freed': fx('freed'); break;
      case 'levelup': fx('levelup'); play('learned'); break;
      case 'boss-phase': fx('phase'); break;
      case 'dazed': fx('dizzy'); break;
      case 'roll': if (e.boss) fx('rumble'); break;
      case 'drop': if (e.foe) fx('thud'); break;
    }
  }
  // Tests and listening: every sound one after another, rendered offline (Sound._render: { peak, rms, nan, buf })
  async function preview(o = {}) {
    if (!hasSound() || !Sound._render) return null;
    const list = o.only ? [].concat(o.only) : Object.keys(SOUNDS);
    const voices = o.voices === false ? [] : Object.keys(VOICES);
    const steps = [];
    list.forEach(n => steps.push(['fx', n])); voices.forEach(k => { steps.push(['voice', k, false]); steps.push(['voice', k, true]); });
    steps.push(['voice', 'armadillo', true, true]);
    const name = 'fx_preview';
    Sound.addSong(name, { bpm: 15, swing: 0, len: steps.length, from: 0, play(i, t) {     // (one sound a second)
      const s = steps[i]; if (!s) return; const K = Sound.kit;
      if (s[0] === 'fx') SOUNDS[s[1]](t, K, { high: true, boss: s[1] === 'windup', d: 3, strong: true, perfect: true });
      else { const V = VOICES[s[1]], boss = !!s[3], base = V.m - (boss ? 12 : 0); let at = t; for (let k = 0; k < 4; k++) { const len = V.len * (boss ? 1.5 : 1); K.vox(base + (k % 3) * 2, at, len, s[2] ? 1 : 0.65, V.vow[k % V.vow.length], V.vow[(k + 1) % V.vow.length]); layer(V.layer, at, len, K, 1); at += len + V.gap; } if (boss) K.sub808(base - 12, t, 0.6, 0.9); }
    } });
    return Sound._render(name, Math.min(60, steps.length + 1), { buffer: !!o.buffer, rate: o.rate || 22050 });
  }
  return { voice, on, fx, solved: () => fx('solved'), preview, SOUNDS, VOICES, muted: false };
})();
if (typeof BATTLE !== 'undefined' && BATTLE._) BATTLE._.fx = BFX;
