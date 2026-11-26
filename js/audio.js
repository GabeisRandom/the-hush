'use strict';
// Sound for the game, all synthesized (works offline): footsteps, Mimo, talk blips (and the flat,
// breathy ones of hushed people), the train, wind and birds (the birds go silent in the Hush), and
// songs: the title, the area themes (forest, village, Molinar, the lake, the Great Mill; the Quarry Caves' camp and mine,
// the old lighthouse, the Bloom Gardens and the greenhouse, the Frost Peaks and the Ice Clock Tower, the script school),
// the old tower's theme for the cutaways, and a battle theme and a boss theme for each language. M toggles the music.
//
// The Hush in the music: Sound.hush (0..1, set every frame by main.js) muffles the music, makes it
// quieter and farther away, and slows it down (to 0.78x at full hush), smoothly.
// Battles: Sound.setSong('battle') plays the theme of Sound.lang ('es' | 'pt' | 'de' | 'zh' | 'ja'), or the old
// funk theme if no language is set; boss fights play 'boss_' + the language (main.js asks for it while BATTLE.boss()
// is on). 'school' plays its zh or ja version by Sound.lang.
// For phonk.js (Kauã, Portuguese games; the blocks marked PHONK): the songs 'phonk_leak' and 'phonk', Sound.phonkMix,
// Sound.ctx / Sound.out, Sound.deck(name, dest, o) (a second song player into your own bus), Sound.duck(id, k, ttl)
// (dips the area's music), the effects quack / bigbell / piui / croak / gears / sheepbell / chop / rec / scratch.

const Sound = (() => {
  let ac = null, LIVE = null, out, sfx, music, mdim, hushLP, amb, verbIn, echoIn, echoDelay, echoRet, noiseBuf, pulseW, color, pulse8;
  let musicOn = true, birdsLevel = 0, step = 0, next = 0, lastT = 0;
  let song = null, pend = null, want = null, lang = null, swapT = 0, songVol = 0.3;
  let hush = 0, hushT = 0, hushSent = -1, tk = 1, echoBase = 0.33, verbBase = 0.1;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  // ------------------------------------------------------------ the mixer
  // music → color (a song's own tone: S.tone, a lowpass in Hz, open when unset) → mdim (the Hush dims it) → hushLP (the Hush
  // muffles it) → out; music → verbIn → reverb → hushLP; leads also feed echoIn → a tempo-synced echo → back into music
  function build(c) {
    const G = { c }, gn = (v, to) => { const g = c.createGain(); g.gain.value = v; if (to) g.connect(to); return g; };
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(c.destination);
    G.out = gn(0.85, comp);
    G.hushLP = c.createBiquadFilter(); G.hushLP.type = 'lowpass'; G.hushLP.frequency.value = 18000; G.hushLP.connect(G.out);
    G.sfx = gn(0.9, G.out); G.mdim = gn(1, G.hushLP); G.amb = gn(0.55, G.hushLP);
    G.color = c.createBiquadFilter(); G.color.type = 'lowpass'; G.color.frequency.value = c.sampleRate * 0.45; G.color.Q.value = 0.6; G.color.connect(G.mdim);
    G.music = gn(0, G.color);
    const conv = c.createConvolver(); conv.buffer = verbIR(c, 1.8); conv.connect(G.hushLP);
    G.verbIn = gn(0.1, conv); G.music.connect(G.verbIn);
    G.echoIn = gn(1); G.echoDelay = c.createDelay(2); G.echoDelay.delayTime.value = 0.33;
    const elp = c.createBiquadFilter(); elp.type = 'lowpass'; elp.frequency.value = 2600;
    const efb = gn(0.32, G.echoDelay); G.echoRet = gn(0, G.music);
    G.echoIn.connect(G.echoDelay); G.echoDelay.connect(elp); elp.connect(efb); elp.connect(G.echoRet);
    G.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = G.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // a 25% pulse wave (the robot arps and the bright leads)
    const n = 40, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) re[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * 0.25);
    G.pulseW = c.createPeriodicWave(re, im);
    // a 12.5% pulse (thin and nasal: the chiptune voice)
    const re8 = new Float32Array(n), im8 = new Float32Array(n); for (let k = 1; k < n; k++) re8[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * 0.125);
    G.pulse8 = c.createPeriodicWave(re8, im8);
    return G;
  }
  // a soft room: decaying noise that gets darker as it fades
  function verbIR(c, sec) {
    const n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0; for (let i = 0; i < n; i++) { const k = i / n; lp += (Math.random() * 2 - 1 - lp) * (0.85 - 0.7 * k); d[i] = lp * Math.pow(1 - k, 2.4) * 0.5; } }
    return b;
  }
  function use(G) { G = G || {}; ({ out, sfx, music, mdim, hushLP, amb, verbIn, echoIn, echoDelay, echoRet, noiseBuf, pulseW, color, pulse8 } = G); }
  function start() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC(); LIVE = build(ac); use(LIVE);
    wind(); birds();
    next = lastT = ac.currentTime + 0.1; setInterval(schedule, 25);
    if (hushT) applyHush();
    if (want) setSong(want, true);
  }
  // (P6d, the music glitch) A hidden window (minimized, or covered by another window) pauses all sound cleanly, and it picks
  // up exactly where it was when the window comes back: the audio clock stops while it's paused, so no notes pile up and
  // none are skipped (throttled timers can't starve it). Closing or reloading the window fades the sound out in a few ms
  // instead of cutting it off mid-note; fadeOut(sec) is for leaving on purpose (the journal's Quit to title).
  const OUT_LEVEL = 0.85;      // (build()'s master level)
  let paused = false, pauseT = 0;
  function master(v, sec) { if (!ac || !LIVE || ac.state === 'closed') return; const g = LIVE.out.gain, t = ac.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + sec); }
  function onVisible() {
    if (!ac || ac.state === 'closed') return;
    clearTimeout(pauseT);
    if (document.hidden) {
      if (ac.state !== 'running') return;
      paused = true; master(0, 0.06);
      pauseT = setTimeout(() => { if (paused && document.hidden && ac.state === 'running') ac.suspend(); }, 90);
    } else if (paused) {
      paused = false;
      const up = () => master(OUT_LEVEL, 0.15);
      if (ac.state === 'suspended') ac.resume().then(up, up); else up();
    }
  }
  document.addEventListener('visibilitychange', onVisible);
  function fadeOut(sec = 0.3) { master(0, Math.max(0.01, sec)); }
  addEventListener('beforeunload', () => fadeOut(0.03));
  addEventListener('pagehide', () => fadeOut(0.02));
  addEventListener('pageshow', e => { if (e.persisted && ac && !document.hidden) { if (ac.state === 'suspended') ac.resume(); master(OUT_LEVEL, 0.15); } });
  function env(g, t, peak, a, d) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(type, f0, f1, t, dur, peak, dest = sfx, a = 0.005) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, peak, a, dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + dur + 0.05); return o;
  }
  function noise(t, dur, peak, type, f, q = 1, dest = sfx, a = 0.003) {
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    env(g, t, peak, a, dur); s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + a + dur + 0.05); return fl;
  }
  function osc(type, f, t, end, dest, det = 0) {
    const o = ac.createOscillator(); if (type === 'pulse') o.setPeriodicWave(pulseW); else if (type === 'pulse8') o.setPeriodicWave(pulse8); else o.type = type;
    o.frequency.value = f; if (det) o.detune.value = det; o.connect(dest); o.start(t); o.stop(end); return o;
  }
  function filt(type, f, q, dest) { const b = ac.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; if (dest) b.connect(dest); return b; }
  function wind() {
    const s = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
    s.buffer = noiseBuf; s.loop = true; lp.type = 'lowpass'; lp.frequency.value = 420;
    g.gain.value = 0.05; lfo.frequency.value = 0.07; lg.gain.value = 0.035; lfo.connect(lg); lg.connect(g.gain);
    s.connect(lp); lp.connect(g); g.connect(amb); s.start(); lfo.start();
  }
  function birds() {
    if (birdsLevel > 0.05 && Math.random() < birdsLevel) {
      const t = ac.currentTime + 0.05, n = 2 + ((Math.random() * 4) | 0), base = 2400 + Math.random() * 1600;
      const pan = ac.createStereoPanner ? ac.createStereoPanner() : null, dest = pan || amb;
      if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; pan.connect(amb); }
      for (let i = 0; i < n; i++) tone('sine', base * (1 + Math.random() * 0.25), base * 0.7, t + i * (0.09 + Math.random() * 0.05), 0.07, 0.025 * birdsLevel, dest, 0.004);
    }
    setTimeout(birds, 1500 + Math.random() * 4500);
  }

  // ------------------------------------------------------------ writing music down
  // note names → midi ('C4' = 60, 'F#5', 'Bb3'); N('A2 G3 C4') → [45, 55, 60]
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const nn = s => { const m = /^([A-G])([#b]?)(-?\d)$/.exec(s); if (!m) throw new Error('bad note ' + s); return 12 * (+m[3] + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); };
  const N = s => s.trim().split(/\s+/).map(nn);
  // a melody: 'E5/2 G5 A5/3 r/2' (length in sixteenths after the slash; it carries over) → by step: [midi, length]
  function mel(str, at = 0, into = []) {
    let p = at, len = 2;
    for (const tok of str.split(/[\s|]+/)) { if (!tok) continue; const [n, l] = tok.split('/'); if (l) len = +l; if (n !== 'r') into[p] = [nn(n), len]; p += len; }
    return into;
  }
  // a rhythm: 'x..o..x.' → a level per sixteenth (x 1, o 0.6, - 0.3, 1–9 tenths… well, ninths)
  const pat = s => Array.from(s.replace(/[\s|]/g, ''), c => c === 'x' ? 1 : c === 'o' ? 0.6 : c === '-' ? 0.3 : c === '.' ? 0 : (+c) / 9);
  // chords: 'A2: G3 C4 E4 B4' → [bass, voicing…]
  const CH = s => s.split(',').map(c => { const [b, v] = c.split(':'); return [nn(b.trim()), ...N(v)]; });

  // ------------------------------------------------------------ instruments (all play into the music bus)
  // drums
  function kick(t, v = 1) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.13); env(g, t, 0.75 * v, 0.003, 0.27); o.connect(g); g.connect(music); o.start(t); o.stop(t + 0.35); }
  function kick808(t, v = 1, len = 0.45) { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.07); env(g, t, 0.8 * v, 0.002, len); o.connect(g); g.connect(music); o.start(t); o.stop(t + len + 0.05); }
  function snare(t, v) { noise(t, 0.16, 0.42 * v, 'highpass', 1100, 0.7, music); tone('triangle', 200, 170, t, 0.09, 0.22 * v, music); }
  function hat(t, v, open) { noise(t, open ? 0.2 : 0.035, 0.11 * v, 'highpass', 7600, 0.8, music, 0.002); }
  function clap(t, v) { [0, 0.012, 0.024].forEach(d => noise(t + d, 0.06, 0.16 * v, 'bandpass', 1300, 1.2, music, 0.001)); }
  function crash(t, v = 1) { noise(t, 1.4, 0.07 * v, 'highpass', 5200, 0.6, music, 0.002); }
  function rim(t, v = 1) { tone('triangle', 1750, 1500, t, 0.025, 0.08 * v, music, 0.001); noise(t, 0.02, 0.08 * v, 'bandpass', 3200, 2, music, 0.001); }
  function shaker(t, v = 1) { noise(t, 0.045, 0.06 * v, 'bandpass', 7200, 1.3, music, 0.012); }
  function brush(t, v = 1, len = 0.18) { noise(t, len, 0.05 * v, 'bandpass', 4200, 0.6, music, 0.04); }
  function tom(t, f, v = 1) { tone('sine', f * 1.6, f, t, 0.22, 0.22 * v, music, 0.002); }
  function zap(t, v = 1, f0 = 2400, f1 = 140) { tone('sine', f0, f1, t, 0.1, 0.07 * v, music, 0.001); }
  // latin percussion
  const CONGA = { hi: [330, 0.2, 0.13], lo: [225, 0.24, 0.14], slap: [360, 0.06, 0.12], mute: [300, 0.05, 0.08], heel: [190, 0.05, 0.08] };
  function conga(t, kind, v = 1) {
    const [f, d, p] = CONGA[kind]; tone('sine', f * 1.3, f, t, d, p * v, music, 0.002);
    if (kind === 'slap' || kind === 'mute') noise(t, 0.03, 0.09 * v, 'bandpass', 1800, 1.5, music, 0.001);
  }
  function timbale(t, hi, v = 1) { const f = hi ? 640 : 470; tone('triangle', f * 1.08, f, t, 0.22, 0.08 * v, music, 0.001); tone('sine', f * 2.3, f * 2.2, t, 0.12, 0.03 * v, music, 0.001); noise(t, 0.07, 0.07 * v, 'bandpass', 3000, 1.2, music, 0.001); }
  function shell(t, v = 1) { noise(t, 0.025, 0.08 * v, 'bandpass', 2600, 3, music, 0.001); tone('triangle', 1300, 1200, t, 0.02, 0.025 * v, music, 0.001); }   // cáscara: sticks on the timbale's shell
  function cowbell(t, v = 1, lo) { const bp = filt('bandpass', lo ? 1900 : 2600, 2.5), g = ac.createGain(), k = lo ? 0.75 : 1; env(g, t, 0.075 * v, 0.002, 0.13); bp.connect(g); g.connect(music); osc('square', 587 * k, t, t + 0.2, bp); osc('square', 845 * k, t, t + 0.2, bp); }
  function clave(t, v = 1) { tone('sine', 2500, 2450, t, 0.05, 0.07 * v, music, 0.001); }
  // a scrape (güiro, or a ratchet being wound): noise chopped by a fast square
  function scrape(t, len, v = 1, f = 3600, rate = 55) {
    const s = ac.createBufferSource(), bp = filt('bandpass', f, 1.6), am = ac.createGain(), lg = ac.createGain(), lfo = ac.createOscillator(), g = ac.createGain();
    s.buffer = noiseBuf; am.gain.value = 0.5; lg.gain.value = 0.5; lfo.type = 'square'; lfo.frequency.value = rate; lfo.connect(lg); lg.connect(am.gain);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07 * v, t + len * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + len);
    s.connect(bp); bp.connect(am); am.connect(g); g.connect(music); s.start(t, Math.random()); s.stop(t + len + 0.02); lfo.start(t); lfo.stop(t + len + 0.02);
  }
  // brazilian percussion
  function surdo(t, open, v = 1) { tone('sine', open ? 80 : 95, open ? 55 : 70, t, open ? 0.5 : 0.11, 0.34 * v, music, 0.004); noise(t, 0.03, 0.05 * v, 'lowpass', 900, 0.7, music, 0.002); }
  function tamborim(t, v = 1) { tone('triangle', 820, 700, t, 0.035, 0.07 * v, music, 0.001); noise(t, 0.03, 0.07 * v, 'highpass', 3000, 0.8, music, 0.001); }
  function agogo(t, hi, v = 1) { const f = hi ? 1180 : 880; tone('sine', f, f, t, 0.16, 0.05 * v, music, 0.001); tone('sine', f * 2.7, f * 2.7, t, 0.05, 0.014 * v, music, 0.001); }
  // the cuíca: a squeaky glide through a vowel-ish filter (up: "oo-WEE", down: "WEE-oo")
  function cuica(t, up, v = 1, len = 0.18) {
    const o = ac.createOscillator(), bp = filt('bandpass', 600, 3), g = ac.createGain(), a = up ? 330 : 760, b = up ? 780 : 360; o.type = 'triangle';
    o.frequency.setValueAtTime(a, t); o.frequency.exponentialRampToValueAtTime(b, t + len * 0.8);
    bp.frequency.setValueAtTime(a * 1.5, t); bp.frequency.exponentialRampToValueAtTime(b * 1.5, t + len * 0.8);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.2 * v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(bp); bp.connect(g); g.connect(music); o.start(t); o.stop(t + len + 0.05);
  }
  // the samba whistle (apito): a pea whistle's trill
  function apito(t, len, v = 1) {
    const o = ac.createOscillator(), fm = ac.createOscillator(), fg = ac.createGain(), g = ac.createGain();
    o.frequency.value = 2900; fm.frequency.value = 36; fg.gain.value = 240; fm.connect(fg); fg.connect(o.frequency);
    env(g, t, 0.035 * v, 0.008, len); o.connect(g); g.connect(music); o.start(t); fm.start(t); o.stop(t + len + 0.1); fm.stop(t + len + 0.1);
  }
  // clockwork
  function woodblock(t, hi, v = 1) { const f = hi ? 1250 : 880; tone('sine', f, f * 0.96, t, 0.05, 0.08 * v, music, 0.001); noise(t, 0.012, 0.04 * v, 'bandpass', f * 2, 3, music, 0.001); }
  // lo-fi: vinyl crackle, and a drop of water
  function crackle(t, s16, k = 1) { if (Math.random() < 0.4 * k) noise(t + Math.random() * s16, 0.002, 0.012 + Math.random() * 0.03, 'highpass', 3000, 0.7, music, 0.0005); }
  function drop(t, v = 1) { const f = 700 + Math.random() * 500; tone('sine', f, f * 2.1, t, 0.07, 0.03 * v, music, 0.002); }
  // a riser: noise that swells and brightens into the next downbeat
  function swell(t, len, v = 1) {
    const s = ac.createBufferSource(), bp = filt('bandpass', 800, 0.8), g = ac.createGain(); s.buffer = noiseBuf; s.loop = true;
    bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(6000, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05 * v, t + len); g.gain.linearRampToValueAtTime(0.0001, t + len + 0.03);
    s.connect(bp); bp.connect(g); g.connect(music); s.start(t, Math.random()); s.stop(t + len + 0.05);
  }

  // basses
  function bass(m, t, v, len = 0.3) {
    const f = mtof(m), o = ac.createOscillator(), sub = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; sub.type = 'sine'; sub.frequency.value = f; lp.type = 'lowpass'; lp.Q.value = 4;
    lp.frequency.setValueAtTime(380, t); lp.frequency.linearRampToValueAtTime(900 + 500 * v, t + 0.02); lp.frequency.exponentialRampToValueAtTime(360, t + 0.22);
    env(g, t, 0.22 * v, 0.005, len); o.connect(lp); sub.connect(lp); lp.connect(g); g.connect(music); o.start(t); sub.start(t); o.stop(t + len + 0.1); sub.stop(t + len + 0.1);
  }
  function bass2(m, t) { tone('sine', mtof(m), mtof(m), t, 2.2, 0.12, music, 0.4); }
  function slap(m, t, v) { bass(m, t, v); noise(t, 0.02, 0.06 * v, 'bandpass', 2400, 2, music, 0.001); }
  // a round upright (bossa, salsa's tumbao)
  function upright(m, t, v = 1, len = 0.5) {
    const f = mtof(m), lp = filt('lowpass', 1300, 0.8), g = ac.createGain(), end = t + len + 0.1;
    lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(420, t + 0.15);
    env(g, t, 0.28 * v, 0.008, len); lp.connect(g); g.connect(music); osc('triangle', f, t, end, lp); osc('sine', f, t, end, lp);
  }
  // a fat synth bass (electro, funk)
  function synbass(m, t, len, v = 1) {
    const f = mtof(m), lp = filt('lowpass', 300, 7), g = ac.createGain(), end = t + len + 0.1;
    lp.frequency.setValueAtTime(260, t); lp.frequency.linearRampToValueAtTime(1100 + 1300 * v, t + 0.012); lp.frequency.exponentialRampToValueAtTime(320, t + 0.17);
    env(g, t, 0.17 * v, 0.004, len); lp.connect(g); g.connect(music); osc('sawtooth', f, t, end, lp, -6); osc('square', f, t, end, lp, 6); osc('sine', f, t, end, g);
  }
  // an 808 bass: a sine that drops into the note
  function sub808(m, t, len, v = 1) { const f = mtof(m), o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(f * 1.5, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05); env(g, t, 0.34 * v, 0.004, len); o.connect(g); g.connect(music); o.start(t); o.stop(t + len + 0.05); }
  // the oom-pah tuba (or, with to, a cheeky trombone slide)
  function tuba(m, t, len, v = 1, to) {
    const f = mtof(m), lp = filt('lowpass', 250, 1.5), g = ac.createGain(), end = t + len + 0.12;
    lp.frequency.setValueAtTime(250, t); lp.frequency.linearRampToValueAtTime(950, t + 0.04); lp.frequency.exponentialRampToValueAtTime(420, t + Math.max(0.06, len));
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.15 * v, t + 0.025); g.gain.setValueAtTime(0.13 * v, t + Math.max(0.03, len - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.08);
    lp.connect(g); g.connect(music);
    [osc('sawtooth', f, t, end, lp), osc('sine', f, t, end, lp)].forEach(o => { if (to) { o.frequency.setValueAtTime(f, t + len * 0.25); o.frequency.exponentialRampToValueAtTime(mtof(to), t + len); } });
  }

  // keys, strings, mallets
  function keys(m, t, len, v) {
    const f = mtof(m), g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045 * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.02 * v, t + len); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.25);
    [[1, 1], [2, 0.18], [6.98, 0.05]].forEach(([k, a]) => { const o = ac.createOscillator(), og = ac.createGain(); o.frequency.value = f * k; og.gain.value = a; o.connect(og); og.connect(lp); o.start(t); o.stop(t + len + 0.3); });
    lp.connect(g); g.connect(music);
  }
  // an FM electric piano (a Rhodes' bark on the attack, warm after)
  function epiano(m, t, len, v = 1, bright = 1) {
    const f = mtof(m), c = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain(), end = t + len + 0.4;
    c.frequency.value = f; mo.frequency.value = f; mg.gain.setValueAtTime(f * 1.5 * bright, t); mg.gain.exponentialRampToValueAtTime(f * 0.1, t + 0.35); mo.connect(mg); mg.connect(c.frequency);
    const pk = 0.036 * v; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pk, t + 0.004); g.gain.exponentialRampToValueAtTime(pk * 0.45, t + Math.max(0.05, len)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.35);
    c.connect(g); g.connect(music); c.start(t); mo.start(t); c.stop(end); mo.stop(end);
  }
  // a plucked string: nylon guitar (bright ~1) or cavaquinho (bright ~2, short)
  function string(m, t, v = 1, len = 0.5, bright = 1) {
    const f = mtof(m), lp = filt('lowpass', 3000, 1.2), g = ac.createGain(), end = t + len + 0.05;
    lp.frequency.setValueAtTime(Math.min(9000, f * 5 * bright), t); lp.frequency.exponentialRampToValueAtTime(Math.max(220, f * 1.3), t + 0.1 + len * 0.3);
    env(g, t, 0.045 * v, 0.002, len); lp.connect(g); g.connect(music); osc('sawtooth', f, t, end, lp); osc('triangle', f, t, end, lp, 4);
  }
  // a strum: the notes a few ms apart (down or up)
  function strum(notes, t, v, len, bright, up) { const n = notes.length; for (let k = 0; k < n; k++) string(notes[up ? n - 1 - k : k], t + k * 0.011, v * (up ? 0.75 : 1), len, bright); }
  function vibes(m, t, v = 1, len = 0.9) { tone('sine', mtof(m), mtof(m), t, len, 0.05 * v, music, 0.004); tone('sine', mtof(m) * 4, mtof(m) * 4, t, 0.25, 0.008 * v, music, 0.002); }
  function marimba(m, t, v = 1) { const f = mtof(m); tone('sine', f, f, t, 0.45, 0.075 * v, music, 0.002); tone('sine', f * 4, f * 4, t, 0.05, 0.02 * v, music, 0.001); }
  function glock(m, t, v = 1) { const f = mtof(m); tone('sine', f, f, t, 0.8, 0.045 * v, music, 0.001); tone('sine', f * 2.76, f * 2.76, t, 0.18, 0.014 * v, music, 0.001); }
  function pluck(m, t, v) { tone('sine', mtof(m), mtof(m), t, 1.1, 0.06 * v, music, 0.003); tone('sine', mtof(m) * 3, mtof(m) * 3, t, 0.15, 0.012 * v, music, 0.002); }
  function pad(m, t, len, type = 'triangle', cut = 1400, peak = 0.03) {
    const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + Math.min(0.9, len * 0.35)); g.gain.linearRampToValueAtTime(0.0001, t + len);
    [-6, 6].forEach(cents => { const o = ac.createOscillator(); o.type = type; o.frequency.value = mtof(m); o.detune.value = cents; o.connect(lp); o.start(t); o.stop(t + len + 0.1); });
    lp.connect(g); g.connect(music);
  }
  // an arpeggiator blip (the robot sequencer)
  function arp(m, t, v = 1, len = 0.1) { const f = mtof(m), lp = filt('lowpass', 3600, 3), g = ac.createGain(); lp.frequency.setValueAtTime(1200 + 3200 * v, t); lp.frequency.exponentialRampToValueAtTime(600, t + len); env(g, t, 0.03 * v, 0.002, len); lp.connect(g); g.connect(music); osc('pulse', f, t, t + len + 0.05, lp); }
  // a robot voice: a buzz through two vowel filters, gliding from one vowel to another
  const VOW = { a: [800, 1150], o: [500, 850], u: [325, 700], e: [450, 1900], i: [300, 2300] };
  function vox(m, t, len, v = 1, from = 'a', to = 'o') {
    const g = ac.createGain(), A = VOW[from], B = VOW[to], src = ac.createOscillator();
    src.type = 'sawtooth'; src.frequency.value = mtof(m); src.start(t); src.stop(t + len + 0.1);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22 * v, t + 0.02); g.gain.setValueAtTime(0.2 * v, t + Math.max(0.03, len - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.06);
    for (let k = 0; k < 2; k++) { const bp = filt('bandpass', A[k], 8, g); bp.frequency.setValueAtTime(A[k], t); bp.frequency.linearRampToValueAtTime(B[k], t + len * 0.8); src.connect(bp); }
    g.connect(music);
  }
  // brass
  function horn(m, t, v, len = 0.17) {
    const f = mtof(m), lp = ac.createBiquadFilter(), g = ac.createGain();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(2800, t + 0.03); lp.frequency.exponentialRampToValueAtTime(900, t + Math.max(0.18, len));
    env(g, t, 0.035 * v, 0.01, len);
    [-5, 5].forEach(c => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = c; o.connect(lp); o.start(t); o.stop(t + len + 0.13); });
    lp.connect(g); g.connect(music);
  }
  function clav(m, t, v = 1) {
    const f = mtof(m), o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain();
    o.type = 'square'; o.frequency.value = f; bp.type = 'bandpass'; bp.Q.value = 3;
    bp.frequency.setValueAtTime(1800, t); bp.frequency.exponentialRampToValueAtTime(700, t + 0.08);
    env(g, t, 0.025 * v, 0.003, 0.07); o.connect(bp); bp.connect(g); g.connect(music); o.start(t); o.stop(t + 0.12);
  }
  // leads: [oscillator type, frequency ratio, detune, level], the filter's [start, attack peak, settle],
  // vibrato depth, level, attack, plus a trumpet's scoop up into the note, a flute's breath, a whistle's glide
  const LEADS = {
    saw:       { o: [['sawtooth', 1, -7, 0.5], ['sawtooth', 1, 7, 0.5], ['square', 0.5, 0, 0.35]], lp: [900, 3600, 1700], q: 2, vib: 0.012, g: 0.05, a: 0.012 },
    square:    { o: [['pulse', 1, 0, 0.55], ['square', 2, 3, 0.1]], lp: [1400, 5200, 2600], q: 1, vib: 0.01, g: 0.05, a: 0.006 },
    trumpet:   { o: [['sawtooth', 1, -4, 0.5], ['sawtooth', 1, 5, 0.45]], lp: [450, 3000, 1500], q: 1.6, vib: 0.01, g: 0.055, a: 0.03, scoop: -70 },
    flute:     { o: [['sine', 1, 0, 0.9], ['triangle', 2, 0, 0.06]], lp: [2400, 3200, 2400], q: 0.7, vib: 0.009, g: 0.07, a: 0.05, breath: 0.02 },
    whistle:   { o: [['sine', 1, 0, 1]], lp: [6000, 6000, 6000], q: 0.5, vib: 0.016, g: 0.05, a: 0.02, glide: 0.05 },
    accordion: { o: [['sawtooth', 1, -13, 0.35], ['sawtooth', 1, 13, 0.35], ['square', 1, 0, 0.25]], lp: [1600, 2600, 2100], q: 1, vib: 0, g: 0.042, a: 0.02 },
    robo:      { o: [['pulse', 1, 0, 0.5], ['sawtooth', 1, 8, 0.3]], lp: [700, 3200, 1300], q: 5, vib: 0, g: 0.045, a: 0.004, glide: 0.03 },
  };
  let lastLead = 0, lastLeadT = -9;
  function lead(m, t, dur, kind = 'saw', v = 1) {
    if (hush > 0.5 && Math.random() < (hush - 0.5) * 0.5) return;   // the Hush swallows a few notes
    const L = LEADS[kind] || LEADS.saw, f = mtof(m), lp = ac.createBiquadFilter(), g = ac.createGain(), vib = ac.createOscillator(), vg = ac.createGain();
    lp.type = 'lowpass'; lp.Q.value = L.q; lp.frequency.setValueAtTime(L.lp[0], t); lp.frequency.linearRampToValueAtTime(L.lp[1], t + 0.03); lp.frequency.exponentialRampToValueAtTime(L.lp[2], t + Math.max(0.12, dur));
    const end = t + Math.max(0.08, dur * 0.92), pk = L.g * v * (1 - 0.4 * hush);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pk, t + L.a); g.gain.setValueAtTime(pk * 0.84, Math.max(t + L.a, end - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.07);
    vib.frequency.value = 5.5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(dur > 0.3 ? f * L.vib : 0, t + Math.min(dur, 0.35)); vib.connect(vg);
    const from = L.glide && t - lastLeadT < 0.6 ? lastLead : 0; lastLead = f; lastLeadT = end;
    for (const [type, k, c, a] of L.o) {
      const o = ac.createOscillator(), og = ac.createGain(); if (type === 'pulse') o.setPeriodicWave(pulseW); else if (type === 'pulse8') o.setPeriodicWave(pulse8); else o.type = type;
      if (from) { o.frequency.setValueAtTime(from * k, t); o.frequency.exponentialRampToValueAtTime(f * k, t + L.glide); } else o.frequency.value = f * k;
      if (L.scoop) { o.detune.setValueAtTime(c + L.scoop, t); o.detune.linearRampToValueAtTime(c, t + 0.07); } else o.detune.value = c;
      og.gain.value = a; vg.connect(o.frequency); o.connect(og); og.connect(lp); o.start(t); o.stop(end + 0.1);
    }
    if (L.breath) noise(t, Math.min(dur, 0.25), L.breath * v, 'bandpass', Math.min(f * 2, 8000), 1.2, lp, 0.03);
    vib.start(t); vib.stop(end + 0.1);
    lp.connect(g); g.connect(music); g.connect(echoIn);
  }

  // ------------------------------------------------------------ songs
  // A song: { bpm, len (sixteenths), from (where the loop restarts, after an intro), swing (how late the
  // offbeat sixteenths are), vol, verb (reverb send), echo (echo level) and echoSteps, play(i, t, s16) }.
  // play gets the sixteenth's length too, which grows when the Hush slows the music down.
  // the battle theme's chords [bass root, voicing…] (two bars each; the last two are one bar each)
  const BATTLE_CHORDS = [
    [40, 55, 59, 62, 66], [45, 55, 61, 66, 71], [36, 64, 67, 71, 74], [47, 57, 63, 66, 74],    // A: Em9 A13 Cmaj9 B7#9
    [45, 55, 59, 60, 64], [38, 54, 60, 64, 71], [43, 59, 62, 66, 69], [42, 57, 60, 64], [47, 57, 63, 66],   // B: Am9 D13 Gmaj9 F#ø B7
  ];
  // the battle theme's lead: [bar, sixteenth, midi note, length in sixteenths]
  const BATTLE_LEAD = (() => {
    const N = [
      [0, 0, 76, 2], [0, 3, 79, 1], [0, 4, 81, 2], [0, 6, 83, 3], [0, 10, 81, 1], [0, 11, 79, 1], [0, 12, 76, 2], [0, 14, 74, 2],
      [1, 0, 76, 6], [1, 8, 71, 1], [1, 10, 74, 2], [1, 12, 76, 4],
      [2, 0, 76, 2], [2, 3, 79, 1], [2, 4, 81, 2], [2, 6, 85, 3], [2, 10, 83, 1], [2, 11, 81, 1], [2, 12, 78, 2], [2, 14, 76, 2],
      [3, 0, 78, 6], [3, 8, 81, 2], [3, 10, 83, 2], [3, 12, 85, 4],
      [4, 0, 86, 3], [4, 3, 83, 1], [4, 4, 79, 2], [4, 6, 76, 2], [4, 8, 79, 2], [4, 10, 83, 2], [4, 12, 86, 2], [4, 14, 88, 2],
      [5, 0, 86, 4], [5, 4, 83, 2], [5, 6, 79, 2], [5, 8, 76, 8],
      [6, 0, 75, 2], [6, 2, 78, 2], [6, 4, 81, 2], [6, 6, 83, 2], [6, 8, 86, 3], [6, 11, 83, 1], [6, 12, 81, 2], [6, 14, 78, 2],
      [7, 0, 75, 8],
      [8, 0, 81, 1], [8, 2, 81, 1], [8, 3, 83, 1], [8, 4, 84, 2], [8, 6, 83, 1], [8, 7, 81, 1], [8, 8, 79, 2], [8, 10, 76, 2], [8, 12, 79, 1], [8, 13, 81, 3],
      [9, 0, 83, 2], [9, 2, 81, 2], [9, 4, 79, 2], [9, 6, 76, 2], [9, 8, 74, 4], [9, 12, 76, 4],
      [10, 0, 81, 1], [10, 2, 81, 1], [10, 3, 83, 1], [10, 4, 84, 2], [10, 6, 86, 2], [10, 8, 84, 1], [10, 9, 83, 1], [10, 10, 81, 2], [10, 12, 78, 2], [10, 14, 81, 2],
      [11, 0, 86, 6], [11, 8, 84, 2], [11, 10, 83, 2], [11, 12, 81, 4],
      [12, 0, 83, 2], [12, 2, 86, 2], [12, 4, 90, 2], [12, 6, 88, 2], [12, 8, 86, 2], [12, 10, 83, 2], [12, 12, 81, 2], [12, 14, 79, 2],
      [13, 0, 78, 4], [13, 4, 79, 2], [13, 6, 81, 2], [13, 8, 83, 8],
      [14, 0, 81, 2], [14, 2, 84, 2], [14, 4, 88, 2], [14, 6, 86, 2], [14, 8, 84, 2], [14, 10, 81, 2], [14, 12, 78, 4],
      [15, 0, 87, 2], [15, 2, 83, 2], [15, 4, 81, 2], [15, 6, 78, 2], [15, 8, 75, 4],
    ];
    const out = []; N.forEach(([b, s, m, l]) => { out[b * 16 + s] = [m, l]; }); return out;
  })();
  const VILLAGE = { CH: [[53, 57, 60, 64, 67], [52, 55, 59, 62], [50, 53, 57, 60, 64], [53, 59, 62, 65]], RT: [41, 40, 38, 43],
    SN: { 4: 1, 12: 1, 7: 0.18, 14: 0.22 }, BS: { 0: [0, 1], 3: [0, 0.35], 6: [12, 0.7], 8: [0, 0.9], 10: [7, 0.7], 11: [0, 0.35], 14: ['A', 0.6] },
    ST: { 0: [0.55, 0.9], 7: [0.12, 0.6], 10: [0.12, 0.55], 14: [0.1, 0.4] },
    MEL: { 32: 76, 35: 79, 38: 81, 40: 79, 42: 76, 44: 74, 46: 76, 48: 72, 56: 74, 59: 76, 62: 74, 96: 76, 99: 79, 102: 81, 104: 84, 106: 81, 108: 79, 110: 76, 112: 79, 120: 76, 122: 74, 124: 72 } };
  const FOREST = { PAD: [[57, 64, 67, 71], [53, 60, 64, 69], [48, 55, 64, 67], [55, 62, 66, 69]], PL: [69, 72, 76, 74, 71, 67, 64, 69] };
  const BATTLE_DR = { SN: { 4: 1, 12: 1, 7: 0.16, 10: 0.14, 15: 0.22 },
    BS0: { 0: [0, 1], 2: [0, 0.45], 3: [12, 0.8], 6: [0, 0.7], 7: [7, 0.6], 8: [10, 0.75], 10: [12, 0.8], 11: [0, 0.5], 14: [7, 0.7], 15: [10, 0.6] },
    BS1: { 0: [0, 1], 3: [12, 0.8], 4: [0, 0.5], 6: [3, 0.7], 7: [5, 0.75], 8: [7, 0.9], 10: [10, 0.7], 11: [12, 0.8], 13: [10, 0.6], 14: [7, 0.7], 15: [5, 0.6] } };
  const SONGS = {
    // a mellow funk loop for the village (96 bpm)
    village: { bpm: 96, len: 128, play(i, t) {
      const V = VILLAGE, bar = Math.floor(i / 16) % 4, s = i % 16, ch = V.CH[bar], root = V.RT[bar];
      if (s === 0 || s === 6 || s === 8 || s === 11) kick(t);
      if (V.SN[s]) snare(t, V.SN[s]);
      hat(t, s % 4 === 2 ? 0.55 : s % 2 ? 0.22 : 0.35, s === 15 && bar === 3);
      if (V.BS[s]) { const [n, v] = V.BS[s]; bass(n === 'A' ? V.RT[(bar + 1) % 4] - 1 : root + n, t, v); }
      if (V.ST[s]) ch.forEach(m => keys(m, t, V.ST[s][0], V.ST[s][1]));
      if (V.MEL[i]) vibes(V.MEL[i], t);
    } },
    // the Quiet Forest: slow, airy, a little lonely (72 bpm, no drums)
    forest: { bpm: 72, len: 128, verb: 0.25, play(i, t) {
      const F = FOREST, bar = Math.floor(i / 16) % 4, s = i % 16;
      if (s === 0) F.PAD[bar].forEach(m => pad(m, t, 2.6));
      if (s % 6 === 0 || s === 9) pluck(F.PL[(i * 7 + bar * 3) % F.PL.length] + (s === 9 ? 12 : 0), t, s === 9 ? 0.5 : 0.8);
      if (s === 0) bass2(F.PAD[bar][0] - 12, t);
    } },
    // battles without a language: an upbeat funk theme (136 bpm, 16 bars): slap bass, brass stabs, clav,
    // a lead with a hook (A: Em9 A13 Cmaj9 B7#9, B: Am9 D13 Gmaj9 F#ø B7), and drum fills into each section
    battle: { bpm: 136, len: 256, vol: 0.4, verb: 0.06, play(i, t, s16) {
      const bar = Math.floor(i / 16), s = i % 16, two = Math.floor(bar / 2);
      const CH = BATTLE_CHORDS[bar < 14 ? two : bar === 14 ? 7 : 8], RT = CH[0];
      const B = bar >= 8, fill = (bar === 7 || bar === 15) && s >= 12;
      if (!fill) {
        if (s === 0 || s === 6 || s === 8 || s === 11 || (B && s === 14)) kick(t);
        if (BATTLE_DR.SN[s]) snare(t, BATTLE_DR.SN[s]);
        if (B && (s === 4 || s === 12)) clap(t, 0.8);
        hat(t, s % 4 === 2 ? 0.7 : s % 2 ? 0.28 : 0.45, s === 14);
      } else { snare(t, 0.45 + (s - 12) * 0.18); if (s === 12) kick(t); }
      if (s === 0 && (bar === 0 || bar === 8)) crash(t);
      const BS = bar % 2 === 0 ? BATTLE_DR.BS0 : BATTLE_DR.BS1;
      if (BS[s] && !(fill && s > 12)) slap(RT + BS[s][0], t, BS[s][1]);
      if ((s === 0 && bar % 2 === 0) || s === 14 || (B && s === 7)) for (let k = 1; k < CH.length; k++) horn(CH[k] + 12, t, s === 0 ? 0.9 : 0.6);
      if (s % 2 === 1 && !fill) clav(CH[1 + ((s >> 1) % 3)] + 12, t);
      const n = BATTLE_LEAD[i];
      if (n) lead(n[0], t, n[1] * s16);
    } },
    // the title (and the train ride at the start): a warm, dusty boom-bap groove (88 bpm), a little
    // mysterious. A music box plays the hook first, and its last line goes missing (the Hush swallowed
    // it); then the beat drops and a flute sings it over a Rhodes. In bar 4 the drums stop where the
    // words go missing. A: Gm9 C13 Fmaj9 Dm9 Gm9 C13 Bbmaj7 A7b9, B: Bbmaj9 A7b9 Dm9 Dm9/C Bbmaj9 Em7b5 A7sus A7b9
    title: { bpm: 88, len: 320, from: 64, swing: 0.3, vol: 0.34, verb: 0.2, echo: 0.22, echoSteps: 3,
      D: (() => {
        const C = CH('G2: F3 Bb3 D4 A4, C2: E3 Bb3 D4 A4, F2: E3 A3 C4 G4, D2: F3 C4 E4 A4, G2: F3 Bb3 D4 A4, C2: E3 Bb3 D4 A4, Bb1: D3 A3 C4 E4, A1: G3 C#4 F4 Bb4,' +
          'Bb1: D3 A3 C4 F4, A1: G3 C#4 F4 Bb4, D2: F3 C4 E4 A4, C2: F3 A3 D4 E4, Bb1: D3 A3 C4 F4, E2: G3 Bb3 D4 A4, A1: G3 B3 D4 E4, A1: G3 C#4 F4 Bb4');
        const box = mel('r/2 D6/1 F6 A6/3 G6/1 F6/2 G6 A6/4 | C7/3 A6/1 G6/2 E6 F6/6 r/2 | r/2 C6/1 D6 E6/3 F6/1 G6/2 A6 E6/4');
        const L = mel('r/2 D5/1 F5 A5/3 G5/1 F5/2 G5 A5/4 | C6/3 A5/1 G5/2 E5 F5/6 r/2 | r/2 C5/1 D5 E5/3 F5/1 G5/2 A5 E5/4 | r/16 |' +
          'r/2 D5/1 F5 A5/3 G5/1 F5/2 G5 Bb5/4 | C6/3 Bb5/1 A5/2 G5 A5/6 r/2 | r/2 F5/1 E5 D5/3 C5/1 D5/2 E5 F5/4 | E5/3 C#5/1 Bb4/2 G4 A4/8 |' +
          'F5/4 A5 C6/6 r/2 | Bb5/3 A5/1 G5/2 F5 E5/8 | r/2 A4/1 C5 E5/3 F5/1 E5/2 D5 A5/4 | G5/3 F5/1 E5/2 D5 E5/8 |' +
          'F5/4 A5 D6/6 r/2 | C6/3 Bb5/1 A5/2 G5 Bb5/8 | A5/4 G5/2 E5 D5/8 | C#5/4 E5/2 G5 Bb5/4 A5');
        return { C, box, L, K0: pat('x......x..x.....'), K1: pat('x.x.......x..x..'), INTRO: [0, 1, 2, 14] };
      })(),
      play(i, t, s16) {
        const D = this.D;
        crackle(t, s16);
        if (i < 64) {   // the intro: Rhodes, bass and the music box, no beat; the last bar is the missing line
          const bar = i >> 4, s = i & 15, C = D.C[D.INTRO[bar]];
          if (s === 0) { for (let k = 1; k < C.length; k++) epiano(C[k], t, 14 * s16, 0.6); upright(C[0], t, 0.6, 12 * s16); }
          const n = D.box[i]; if (n) pluck(n[0], t, 0.5);
          if (bar === 3 && s === 0) swell(t, 16 * s16, 0.8);
          return;
        }
        const j = i - 64, bar = j >> 4, s = j & 15, C = D.C[bar], R = C[0], nR = D.C[(bar + 1) & 15][0];
        const hole = bar === 3 && s >= 8;     // the line the Hush swallowed: all but the Rhodes stops
        if (!hole) {
          if ((bar & 1 ? D.K1 : D.K0)[s]) kick(t, 0.9);
          if (s === 4 || s === 12) snare(t, 0.75);
          if (bar >= 8 && (s === 7 || s === 15)) rim(t, 0.35);
          if (!(s & 1)) hat(t, s & 2 ? 0.55 : 0.32); else if (s === 3 || s === 11 || s === 15) hat(t, 0.15);
          if (s === 0 && (bar === 0 || bar === 8)) crash(t, 0.45);
          if (s === 0) upright(R, t, 1, 5 * s16);
          else if (s === 7) upright(R + 12, t, 0.4, s16);
          else if (s === 10) upright(R + 7, t, 0.75, 3 * s16);
          else if (s === 14) upright(nR + (nR > R ? -1 : 1), t, 0.6, 2 * s16);
        } else if (s === 14 || s === 15) snare(t, s === 14 ? 0.25 : 0.45);
        if (s === 0) for (let k = 1; k < C.length; k++) epiano(C[k], t, (bar === 3 ? 14 : 6) * s16, 0.75);
        else if (bar !== 3 && s === 6) for (let k = 2; k < C.length; k++) epiano(C[k], t, 2 * s16, 0.32);
        else if (bar !== 3 && s === 10) for (let k = 1; k < C.length; k++) epiano(C[k], t, 4 * s16, 0.45);
        if (bar >= 8 && s === 0) for (let k = 1; k < C.length; k++) pad(C[k], t, 16 * s16, 'triangle', 1200, 0.016);
        const n = D.L[j]; if (n) lead(n[0], t, n[1] * s16, 'flute', 0.9);
      } },
    // (the Spanish, Portuguese and German battle themes are with the other battle and boss themes, further down)
    // Molinar, the town of mills: a bright, bouncy market groove (112 bpm, swung): a whistled tune, a marimba
    // that turns round and round like the sails, clav chops on the offbeats, a bouncy bass.
    // A: F6 Bbmaj9 Am7 Dm9 Gm9 C9 F6 C7, B: Bbmaj9 Bbm6 Am7 D7 Gm9 C9 F6 C7
    molinar: { bpm: 112, len: 256, swing: 0.22, vol: 0.3, verb: 0.12, echo: 0.14, echoSteps: 3,
      D: (() => {
        const C = CH('F2: F3 A3 C4 D4, Bb1: D3 F3 A3 C4, A1: E3 G3 C4 E4, D2: F3 A3 C4 E4, G1: F3 A3 Bb3 D4, C2: E3 G3 Bb3 D4, F2: F3 A3 C4 D4, C2: E3 G3 Bb3 C4,' +
          'Bb1: D3 F3 A3 C4, Bb1: Db3 F3 G3 Bb3, A1: E3 G3 C4 E4, D2: F#3 A3 C4 D4, G1: F3 A3 Bb3 D4, C2: E3 G3 Bb3 D4, F2: F3 A3 C4 D4, C2: E3 G3 Bb3 C4');
        const L = mel('C5/2 F5 A5/3 G5/1 F5/2 D5 C5/4 | D5/2 F5 A5/3 Bb5/1 A5/2 F5 D5/4 | C5/2 E5 G5/3 A5/1 G5/2 E5 C5/4 | D5/3 E5/1 F5/2 A5 C6/8 |' +
          'Bb5/3 A5/1 G5/2 F5 D5 F5 G5/4 | E5/2 G5 Bb5 D6 C6/8 | A5/2 F5 C5 F5 A5 C6 D6/4 | C6/4 Bb5 G5 E5 |' +
          'F5/4 D5/2 F5 A5/4 C6 | Db6/4 C6/2 Bb5 G5/8 | C6/2 A5 E5 G5 A5/8 | F#5/2 A5 C6 D6 C6 A5 F#5/4 |' +
          'G5/2 Bb5 D6 F6 E6 D6 Bb5/4 | C6/3 D6/1 C6/2 Bb5 G5 E5 G5/4 | A5/2 C6 D6 F6 D6 C6 A5/4 | G5/2 E5 C5 E5 G5 Bb5 r/4');
        return { C, L, MV: C.map(c => c.slice(1).map(m => m + 12)), MI: [0, 1, 2, 0, 1, 2, 3, 2, 0, 1, 2, 0, 1, 2, 3, 2], MA: pat('x..x..x.x..x..x.'),
          K0: pat('x.....x.x.......'), K1: pat('x.....x.x.....x.'),
          BS: { 0: [0, 1, 2], 3: [12, 0.5, 1], 6: [7, 0.7, 2], 8: [0, 0.85, 2], 11: [12, 0.55, 1], 14: [99, 0.6, 2] } };
      })(),
      play(i, t, s16) {
        const D = this.D, bar = i >> 4, s = i & 15, B = bar >= 8, C = D.C[bar], R = C[0], nR = D.C[(bar + 1) & 15][0];
        if ((bar & 1 ? D.K1 : D.K0)[s]) kick(t, 0.75);
        if (s === 4 || s === 12) { snare(t, 0.45); if (B) clap(t, 0.5); }
        if (s === 10) rim(t, 0.4);
        if (!(s & 1)) shaker(t, s & 2 ? 0.9 : 0.5);
        if (s === 14) hat(t, 0.4, true);
        if (s === 0 && (bar === 0 || bar === 8)) crash(t, 0.4);
        const b = D.BS[s]; if (b) bass(b[0] > 50 ? nR + b[0] - 100 : R + b[0], t, b[1], b[2] * s16);
        if (B || !(s & 1)) marimba(D.MV[bar][D.MI[s]], t, D.MA[s] ? 0.8 : 0.4);
        if ((s & 3) === 2) { clav(C[2] + 12, t, 0.8); clav(C[3] + 12, t, 0.8); }
        if (s === 0) for (let k = 1; k < C.length; k++) epiano(C[k], t, 8 * s16, 0.35);
        const n = D.L[i]; if (n) lead(n[0], t, n[1] * s16, 'whistle', 0.9);
      } },
    // the village on the Mirror Lake: a chill bossa (84 bpm): nylon guitar, rim clicks in the bossa clave,
    // brushes, an upright bass, a soft flute, and now and then a drop of water.
    // A: Dmaj9 E9 Em9 Eb7#11 Dmaj9 E9 Em9 A13, B: Gmaj9 C9 F#m9 B7b9 Em9 A13 Dmaj9 A7sus
    lake: { bpm: 84, len: 256, swing: 0.12, vol: 0.3, verb: 0.25, echo: 0.26, echoSteps: 3,
      D: (() => {
        const C = CH('D2: F#3 A3 C#4 E4, E2: G#3 B3 D4 F#4, E2: G3 B3 D4 F#4, Eb2: G3 Db4 F4 A4, D2: F#3 A3 C#4 E4, E2: G#3 B3 D4 F#4, E2: G3 B3 D4 F#4, A1: G3 B3 C#4 F#4,' +
          'G2: F#3 A3 B3 D4, C2: E3 G3 Bb3 D4, F#2: E3 A3 C#4 G#4, B1: A3 C4 D#4 F#4, E2: G3 B3 D4 F#4, A1: G3 B3 C#4 F#4, D2: F#3 A3 C#4 E4, A1: G3 B3 D4 E4');
        const L = mel('F#5/6 E5/2 F#5/6 A5/2 | G#5/6 F#5/2 E5/8 | G5/6 F#5/2 G5/6 B5/2 | A5/6 G5/2 F5/8 |' +
          'F#5/4 A5 C#6/6 B5/2 | B5/6 G#5/2 F#5/8 | E5/2 F#5 G5 B5 D6/6 C#6/2 | C#6/4 B5 A5/8 |' +
          'B5/6 A5/2 B5/6 D6/2 | E6/6 D6/2 Bb5/8 | A5/6 G#5/2 A5/6 C#6/2 | D#6/6 C6/2 B5/8 |' +
          'G5/4 B5 D6 F#6 | E6/6 C#6/2 B5/8 | A5/4 F#5 E5/8 | D5/6 E5/2 r/8');
        return { C, L, GT: pat('x..x..x...x..x..'), RIM: pat('x..x..x...x..x..'), K: pat('x.....x.x.....x.'),
          BS: { 0: [0, 1, 6], 6: [7, 0.6, 2], 8: [7, 0.85, 6], 14: [99, 0.6, 2] } };
      })(),
      play(i, t, s16) {
        const D = this.D, bar = i >> 4, s = i & 15, B = bar >= 8, C = D.C[bar], R = C[0], nR = D.C[(bar + 1) & 15][0];
        crackle(t, s16, 0.5);
        if (D.K[s]) kick(t, 0.4);
        if (D.RIM[(s + (bar & 1) * 8) & 15]) rim(t, 0.4);
        if (s === 4 || s === 12) brush(t, 0.8, 0.25); else shaker(t, s & 1 ? 0.2 : 0.3);
        const b = D.BS[s]; if (b) upright(b[0] > 50 ? nR + b[0] - 100 : R + b[0], t, b[1], b[2] * s16);
        if (D.GT[s]) for (let k = 1; k < C.length; k++) string(C[k], t + (k - 1) * 0.012, 0.55, 0.35, 1);
        if (B && s === 0) for (let k = 1; k < C.length; k++) epiano(C[k] + 12, t, 12 * s16, 0.25);
        if (Math.random() < 0.05) drop(t, 0.7);
        const n = D.L[i]; if (n) lead(n[0], t, n[1] * s16, 'flute', 0.85);
      } },
    // the Great Mill's rooms: a busy clockwork groove (116 bpm): tick-tock woodblocks, a plucked gear figure
    // in 3+3+2, a staccato synth bass, a sneaky lead, and a ratchet winding up every four bars.
    // A: Dm9 Dm9 Bbmaj7 A7#9 Dm9 Dm9 Gm9 A7b9, B: Gm9 C13 Fmaj9 Bbmaj7 Em7b5 A7 Dm9 A7#9
    mill: { bpm: 116, len: 256, swing: 0.08, vol: 0.3, verb: 0.12, echo: 0.12, echoSteps: 3,
      D: (() => {
        const C = CH('D2: F3 A3 C4 E4, D2: F3 A3 C4 E4, Bb1: D3 F3 A3 C4, A1: G3 C#4 E4 C5, D2: F3 A3 C4 E4, D2: F3 A3 C4 E4, G1: F3 A3 Bb3 D4, A1: G3 C#4 E4 Bb4,' +
          'G1: F3 A3 Bb3 D4, C2: E3 Bb3 D4 A4, F2: E3 A3 C4 G4, Bb1: D3 F3 A3 C4, E2: D3 G3 Bb3 D4, A1: G3 C#4 E4 A4, D2: F3 A3 C4 E4, A1: G3 C#4 E4 C5');
        const L = mel('D5/1 r F5 r A5 r G5 F5 E5/2 F5 D5/4 | A4/1 r C5 r E5 r F5 E5 D5/2 C5 A4/4 | Bb4/1 r D5 r F5 r A5 G5 F5/2 D5 F5/4 | E5/1 r G5 r C6 r Bb5 A5 G5/2 E5 C#5/4 |' +
          'D6/1 r C6 r A5 r F5 G5 A5/2 C6 D6/4 | E6/1 r D6 r C6 r A5 C6 D6/2 E6 F6/4 | D6/2 Bb5 G5 A5 Bb5 D6 F6/4 | E6/2 C#6 Bb5 G5 E5 C#5 A4/4 |' +
          'Bb5/4 A5 G5 F5 | E5/3 F5/1 G5/2 A5 Bb5/8 | A5/4 G5 F5 E5 | D5/3 E5/1 F5/2 A5 D6/8 |' +
          'G5/4 Bb5 D6 C6 | C#6/3 D6/1 E6/2 G6 F6/8 | F6/2 E6 D6 A5 C6 A5 F5/4 | E5/2 G5 C6 C#6 r/8');
        return { C, L, GI: [0, 1, 2, 0, 1, 2, 3, 2, 1, 0, 1, 2, 1, 0, 3, 1], GA: pat('x..x..x.x..x..x.'), K: pat('x..x....x.x.....'),
          BS: { 0: [0, 1, 1], 2: [0, 0.6, 1], 3: [12, 0.7, 1], 6: [7, 0.8, 1], 8: [0, 0.9, 1], 10: [10, 0.6, 1], 11: [12, 0.7, 1], 14: [99, 0.7, 2] } };
      })(),
      play(i, t, s16) {
        const D = this.D, bar = i >> 4, s = i & 15, B = bar >= 8, C = D.C[bar], R = C[0], nR = D.C[(bar + 1) & 15][0];
        if (!(s & 1)) woodblock(t, !(s & 2), s & 2 ? 0.45 : 0.6);
        if (D.K[s]) kick(t, 0.8);
        if (s === 4 || s === 12) snare(t, 0.55);
        if (s & 1) hat(t, 0.18);
        if ((bar & 3) === 3 && s === 12) scrape(t, 4 * s16, 0.7, 2000, 26);
        if (s === 0 && (bar === 0 || bar === 8)) crash(t, 0.4);
        const b = D.BS[s]; if (b) synbass(b[0] > 50 ? nR + b[0] - 100 : R + b[0], t, b[2] * s16 * 0.8, b[1] * 0.85);
        string(C[1 + D.GI[s]] + 12, t, D.GA[s] ? 0.7 : 0.4, 0.12, 1.6);
        if (B && s === 0) for (let k = 1; k < C.length; k++) pad(C[k], t, 16 * s16, 'sawtooth', 1100, 0.01);
        const n = D.L[i]; if (n) lead(n[0], t, n[1] * s16 * 0.75, 'square', 0.7);
      } },
  };

  // ============================================================ PHONK (additive, for phonk.js: Kauã, «DJ Lagoa», Portuguese games)
  // Kauã's beat: original Brazilian phonk (130 bpm, F# minor, i i VI v). A pitched 808-style cowbell riff in a 2-1-2-1 funk
  // rhythm, a distorted 808 that slides between its notes under a 3-3-4-3-3 kick, a crunchy Memphis clap on 2 and 4, hats
  // with rolls, and a vocal-chop stab ("ey!"). The sounds you record for him around the land join as layers
  // (Sound.phonkMix, all off until you bring them): quack (the pond's ducks, as a chop), bell (Alba's tower bell, a low
  // bong), whistle (the train's «piuí», the funk whistle fill), croak (the river's frogs, under the offbeats), gears (the
  // Great Mill's gears, ratchet rolls), sheep (the bell sheep's cowbell, an offbeat clank).
  //   phonk_leak: his work-in-progress loop (4 bars). phonk.js plays it on a deck into a thin, crunchy "headphone leak" bus.
  //   phonk:      the finished beat (a one-bar intro, then 8 bars on a loop): the rap battle and the finished track.
  let phonkMix = {};
  const CRUNCH = (() => { const n = 2048, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(x * 2.8) / Math.tanh(2.8); } return c; })();
  // a soft clipper in front of dest (drive: how hard it's pushed)
  function crunch(dest, drive = 1) { const g = ac.createGain(), w = ac.createWaveShaper(); g.gain.value = drive; w.curve = CRUNCH; w.oversample = '2x'; g.connect(w); w.connect(dest); return g; }
  function kickP(t, v = 1) {         // a punchy, slightly driven kick with a click
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.055); o.frequency.exponentialRampToValueAtTime(43, t + 0.28);
    env(g, t, 0.5 * v, 0.002, 0.26); o.connect(crunch(g, 1.7)); g.connect(music); o.start(t); o.stop(t + 0.36);
    noise(t, 0.01, 0.1 * v, 'highpass', 2800, 0.7, music, 0.0008);
  }
  function clapM(t, v = 1) {         // a crunchy Memphis clap
    [0, 0.008, 0.017].forEach(k => noise(t + k, 0.045, 0.16 * v, 'bandpass', 1450, 1.3, music, 0.001));
    noise(t + 0.026, 0.19, 0.1 * v, 'bandpass', 1850, 0.9, music, 0.002);
    tone('triangle', 240, 175, t, 0.06, 0.07 * v, music, 0.001);
  }
  function hatRoll(t, s16, v = 1, n = 3) { for (let k = 0; k < n; k++) hat(t + k * s16 / n, v * (0.5 + 0.5 * k / n)); }
  function cowP(m, t, v = 1, len = 0.2) {      // the 808 cowbell, pitched (two square waves 1 : 1.48 through a bandpass)
    const f = mtof(m), bp = filt('bandpass', f * 2, 1.3), g = ac.createGain(), end = t + len + 0.05;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.11 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.045 * v, t + 0.035); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    bp.connect(g); g.connect(music); osc('square', f, t, end, bp); osc('square', f * 1.4823, t, end, bp);
  }
  function slide808(m, t, len, v = 1, from) {   // a distorted 808: punches into its note, or slides there from the last one
    const f = mtof(m), o = ac.createOscillator(), g = ac.createGain(), lp = filt('lowpass', 950, 0.7), end = t + len + 0.15;
    if (from) { o.frequency.setValueAtTime(mtof(from), t); o.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.11, len * 0.5)); }
    else { o.frequency.setValueAtTime(f * 2.3, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.04); }
    const pk = 0.15 * v; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pk, t + 0.004); g.gain.setValueAtTime(pk * 0.75, t + Math.max(0.02, len - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.12);
    o.connect(crunch(lp, 2.4)); lp.connect(g); g.connect(music); o.start(t); o.stop(end);
  }
  // the recorded sounds (in the beat, and as effects: Sound.play('quack'), 'bigbell', 'piui', 'croak', 'gears', 'sheepbell')
  function quackS(t, m = 62, v = 1) {
    const f = mtof(m), o = ac.createOscillator(), b1 = filt('bandpass', 1100, 4), b2 = filt('bandpass', 2500, 5), g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.15, t); o.frequency.linearRampToValueAtTime(f, t + 0.035); o.frequency.exponentialRampToValueAtTime(f * 0.8, t + 0.15);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9 * v, t + 0.01); g.gain.setValueAtTime(0.75 * v, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    o.connect(b1); o.connect(b2); b1.connect(g); b2.connect(g); g.connect(music); o.start(t); o.stop(t + 0.2);
  }
  function bellS(m, t, v = 1) {      // a church bell: hum, prime, tierce, quint, nominal…
    const f = mtof(m);
    [[0.5, 0.07, 3.2], [1, 0.09, 2.6], [1.19, 0.04, 1.8], [1.5, 0.035, 1.6], [2, 0.05, 1.4], [2.74, 0.025, 0.9], [4.1, 0.012, 0.5]]
      .forEach(([k, a, d]) => tone('sine', f * k, f * k * 0.997, t, d, a * v, music, 0.003));
    noise(t, 0.035, 0.05 * v, 'bandpass', Math.min(8000, f * 6), 2, music, 0.001);
  }
  function whistleS(t, len = 0.6, v = 1) {      // a steam whistle's chord: «piu-í!» (it dips, then rises)
    [[660, 1], [830, 0.8], [988, 0.55]].forEach(([f, a]) => {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle';
      o.frequency.setValueAtTime(f * 0.95, t); o.frequency.linearRampToValueAtTime(f, t + 0.05);
      o.frequency.setValueAtTime(f, t + len * 0.42); o.frequency.linearRampToValueAtTime(f * 0.92, t + len * 0.52); o.frequency.linearRampToValueAtTime(f * 1.07, t + len * 0.72);
      const pk = 0.05 * a * v; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pk, t + 0.04); g.gain.setValueAtTime(pk * 0.9, t + Math.max(0.06, len - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.1);
      o.connect(g); g.connect(music); o.start(t); o.stop(t + len + 0.15);
    });
    noise(t, len, 0.03 * v, 'bandpass', 1900, 2, music, 0.03);
  }
  function croakS(t, m = 45, v = 1) {      // a frog: «cro-ac», a buzzy throat chopped by a fast square
    const f = mtof(m);
    for (let k = 0; k < 2; k++) {
      const t1 = t + k * 0.1, o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), vca = ac.createGain(), bp = filt('bandpass', 480 + k * 160, 2), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f * (k ? 1.15 : 1), t1); o.frequency.exponentialRampToValueAtTime(f * 0.86, t1 + 0.085);
      lfo.type = 'square'; lfo.frequency.value = 42; lg.gain.value = 0.5; vca.gain.value = 0.5; lfo.connect(lg); lg.connect(vca.gain);
      g.gain.setValueAtTime(0.0001, t1); g.gain.linearRampToValueAtTime(0.9 * v, t1 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.095);
      o.connect(vca); vca.connect(bp); bp.connect(g); g.connect(music); o.start(t1); lfo.start(t1); o.stop(t1 + 0.13); lfo.stop(t1 + 0.13);
    }
  }
  function gearsS(t, len = 0.24, v = 1) {     // big wooden gears: a ratchet, and the clack as a tooth drops
    const s = ac.createBufferSource(), bp = filt('bandpass', 2400, 2.2), am = ac.createGain(), lg = ac.createGain(), lfo = ac.createOscillator(), g = ac.createGain();
    s.buffer = noiseBuf; am.gain.value = 0.5; lg.gain.value = 0.5; lfo.type = 'square'; lfo.frequency.value = 36; lfo.connect(lg); lg.connect(am.gain);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12 * v, t + 0.008); g.gain.setValueAtTime(0.1 * v, t + len * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.connect(bp); bp.connect(am); am.connect(g); g.connect(music); s.start(t, Math.random()); s.stop(t + len + 0.05); lfo.start(t); lfo.stop(t + len + 0.05);
    tone('triangle', 1000, 820, t + len * 0.95, 0.035, 0.07 * v, music, 0.001);
  }
  function sheepS(t, v = 1) {       // a sheep's cowbell, swinging: «dlang-dlang»
    [0, 0.085].forEach((k, i) => {
      const t1 = t + k, bp = filt('bandpass', 2100, 1.6), g = ac.createGain(), a = (i ? 0.55 : 1) * v;
      g.gain.setValueAtTime(0.0001, t1); g.gain.linearRampToValueAtTime(0.085 * a, t1 + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.3);
      bp.connect(g); g.connect(music); osc('square', 548, t1, t1 + 0.33, bp, 7); osc('square', 815, t1, t1 + 0.33, bp, -9);
    });
  }
  const PHONK_D = (() => {
    // the cowbell riff, four bars (F#m F#m D C#m), every bar the same 2-1-2-1-2-1-2-1-2-2 rhythm
    const COW = mel('F#5/2 F#5/1 C#5/2 C#5/1 E5/2 F#5/1 E5/2 C#5/1 B4/2 C#5/2 | A4/2 A4/1 C#5/2 A4/1 B4/2 C#5/1 B4/2 A4/1 G#4/2 F#4/2 |' +
      'F#5/2 F#5/1 D5/2 D5/1 E5/2 F#5/1 E5/2 D5/1 C#5/2 D5/2 | G#4/2 G#4/1 C#5/2 G#4/1 B4/2 C#5/1 B4/2 G#4/1 F#4/2 G#4/2');
    // the 808 under the kicks: [step, midi, length in sixteenths, slide from the note before]
    const BASS = [
      [[0, 30, 3], [3, 30, 3], [6, 30, 4], [10, 42, 3, 1], [13, 30, 3, 1]],
      [[0, 30, 3], [3, 30, 3], [6, 30, 4], [10, 42, 3, 1], [13, 33, 3, 1]],
      [[0, 38, 3, 1], [3, 38, 3], [6, 38, 4], [10, 45, 3, 1], [13, 38, 3, 1]],
      [[0, 37, 3], [3, 37, 3], [6, 37, 4], [10, 40, 3, 1], [13, 37, 2, 1], [15, 30, 1, 1]],
    ].map(bar => { const o = {}; bar.forEach(([s, m, l, sl]) => { o[s] = [m, l, sl]; }); return o; });
    return { COW, BASS, K: pat('x..x..x...x..x..'), last: 0 };
  })();
  // one sixteenth: bar 0–3 of the riff, step s 0–15; alt: the second half of the full beat (the riff answered an octave
  // up, more hat rolls)
  function phonkStep(bar, s, t, s16, alt) {
    const D = PHONK_D, M = phonkMix;
    if (D.K[s]) kickP(t, s === 0 ? 1 : 0.85);
    if (s === 4 || s === 12) clapM(t, 1);
    if (bar === 3 && s === 15) clapM(t, 0.45);
    if ((bar === 3 && s >= 12) || (alt && bar === 1 && s >= 14)) hatRoll(t, s16, 0.6, 3);
    else if (!(s & 1)) hat(t, s & 2 ? 0.55 : 0.32); else if (alt) hat(t, 0.16);
    if (bar === 1 && s === 14) hat(t, 0.4, true);
    const b = D.BASS[bar][s]; if (b) { slide808(b[0], t, b[1] * s16, 1, b[2] ? D.last : 0); D.last = b[0]; }
    const n = D.COW[bar * 16 + s];
    if (n) cowP(n[0] + (alt && (bar === 1 || bar === 3) && s < 8 ? 12 : 0), t, s % 4 === 0 ? 1 : 0.8, Math.min(0.24, n[1] * s16 + 0.06));
    if ((bar === 1 || bar === 3) && s === 7) vox(61, t, 0.12, 0.55, 'a', 'e');          // the vocal-chop stab: "ey!"
    // the sounds from around the land
    if (M.bell && s === 0 && bar === 0) bellS(42, t, 0.9);
    if (M.quack && ((s === 14 && (bar === 0 || bar === 2)) || (bar === 3 && (s === 6 || s === 7)))) quackS(t, bar === 3 ? (s === 6 ? 66 : 69) : 64, 0.9);
    if (M.whistle && bar === 3 && s === 8) whistleS(t, 7 * s16, 0.8);
    if (M.croak && (s === 7 || s === 15) && !(bar === 3 && s === 15)) croakS(t, s === 7 ? 45 : 42, 0.7);
    if (M.gears && (s === 2 || s === 10)) gearsS(t, s16 * 0.9, 0.6);
    if (M.sheep && (s & 3) === 2) sheepS(t, s === 6 || s === 14 ? 0.7 : 0.45);
  }
  function phonkIntro(i, t, s16) {   // the riff's first bar on its own, a riser, two kicks
    const n = PHONK_D.COW[i]; if (n) cowP(n[0], t, 0.9, Math.min(0.24, n[1] * s16 + 0.06));
    if (i === 0) swell(t, 16 * s16, 0.9);
    if (i === 12 || i === 14) kickP(t, 0.8);
    if (i === 15) clapM(t, 0.6);
    if (phonkMix.whistle && i === 8) whistleS(t, 0.4, 0.7);
  }
  Object.assign(SONGS, {
    phonk_leak: { bpm: 130, len: 64, swing: 0.04, vol: 0.4, verb: 0.04, play(i, t, s16) { phonkStep(i >> 4, i & 15, t, s16, false); } },
    phonk: { bpm: 130, len: 144, from: 16, swing: 0.04, vol: 0.36, verb: 0.05, play(i, t, s16) {
      if (i < 16) { phonkIntro(i, t, s16); return; }
      const j = i - 16, bar = j >> 4; phonkStep(bar & 3, j & 15, t, s16, bar >= 4);
    } },
  });
  // ============================================================ (end of PHONK's songs)
  // (the old lighthouse, the Bloom Gardens and the greenhouse: their songs are with the other new areas' songs, further down)
  const volOf = name => (SONGS[name] && SONGS[name].vol) || songVol;
  const swingOf = S => S.swing !== undefined ? S.swing : 0.18;

  // ------------------------------------------------------------ playing songs
  // 'battle' means this language's battle theme
  const resolve = name => name === 'battle' && lang && SONGS['battle_' + lang] ? 'battle_' + lang : name;
  // (P6d, the music glitch) Where a song was when another took over: an area song you come back to within RESUME seconds
  // (a house, a shop, a short scene) picks up on the beat where it was instead of starting over; fight songs and the title
  // always start from the top.
  const RESUME = 25, SEEN = {}, fresh = n => !n || /^(battle|boss|title)/.test(n);
  function setSong(name, force) {
    const r = resolve(name || null);
    if (r === pend && !force) return;
    want = name || null; pend = r;
    if (!ac) return;      // start() picks it up
    clearTimeout(swapT);
    if (r && r === song && SONGS[r] && !force) {     // back to the song that never stopped (there and back before the swap): just bring it back up
      music.gain.cancelScheduledValues(ac.currentTime);
      music.gain.setTargetAtTime(musicOn ? volOf(r) : 0, ac.currentTime, 0.25);
      return;
    }
    music.gain.cancelScheduledValues(ac.currentTime);
    music.gain.setTargetAtTime(0, ac.currentTime, 0.25);
    // the old song fades out (it keeps playing meanwhile), then the new one starts on its first beat
    swapT = setTimeout(() => {
      if (pend !== r) return;
      if (song && SONGS[song] && !fresh(song)) SEEN[song] = { step, t: ac.currentTime };
      const back = r && SEEN[r] && !fresh(r) && ac.currentTime - SEEN[r].t < RESUME ? SEEN[r].step : 0;
      song = r; step = back - back % 4; next = Math.max(next, ac.currentTime + 0.06);
      hush = hushT; tk = 1 - 0.22 * hush;     // a new song starts at the right tempo (no glide)
      const S = SONGS[r] || {};
      verbBase = S.verb !== undefined ? S.verb : 0.1;
      echoBase = (S.echoSteps || 3) * 15 / (S.bpm || 120);
      echoDelay.delayTime.setValueAtTime(echoBase / tk, ac.currentTime);
      echoRet.gain.setTargetAtTime(S.echo || 0, ac.currentTime, 0.1);
      color.frequency.setTargetAtTime(S.tone || ac.sampleRate * 0.45, ac.currentTime, 0.05);     // (the old song has faded out by now)
      hushSent = -1; applyHush();
      music.gain.cancelScheduledValues(ac.currentTime);
      music.gain.setTargetAtTime(musicOn && r && SONGS[r] ? volOf(r) : 0, ac.currentTime, 0.35);
    }, song && SONGS[song] ? 650 : 40);
  }
  // the Hush: muffled, dimmer and farther away (more reverb), and slower (the tempo glides in schedule())
  function applyHush() {
    if (!ac) return;
    const n = ac.currentTime, h = hushT; hushSent = h;
    hushLP.frequency.setTargetAtTime(lerp(18000, 650, h), n, 0.3);
    mdim.gain.setTargetAtTime(1 - 0.45 * h, n, 0.4);
    verbIn.gain.setTargetAtTime(verbBase + 0.22 * h, n, 0.4);
  }
  function advance(S) { step++; if (step >= S.len) step = S.from || 0; }
  function schedule() {
    if (!ac) return;
    const now = ac.currentTime, dt = Math.min(0.5, Math.max(0, now - lastT)); lastT = now;
    hush += (hushT - hush) * (1 - Math.exp(-dt / 0.35));
    const tk0 = tk; tk += (1 - 0.22 * hush - tk) * (1 - Math.exp(-dt / 0.6));
    if (Math.abs(tk - tk0) > 1e-4) echoDelay.delayTime.setTargetAtTime(echoBase / tk, now, 0.3);
    const S = song && SONGS[song];
    if (!S || !musicOn) { next = now + 0.05; return; }
    // (how far ahead notes are handed to the audio clock: a hitch on the main thread shorter than this, a window opening or
    // closing, a room being built, can't make the music drop notes. It was 0.15 s, which any hitch over ~130 ms broke. P6d)
    const s16 = 60 / (S.bpm * tk) / 4, ahead = document.hidden ? 1.2 : 0.35, sw = swingOf(S);
    // after a stall (a background tab), skip ahead instead of playing every missed note at once
    if (next < now - 0.02) { const lag = Math.ceil((now - next) / s16); for (let k = 0; k < lag; k++) advance(S); next += lag * s16; }
    while (next < now + ahead) { S.play(step, next + (step % 2 ? s16 * sw : 0), s16); next += s16; advance(S); }
  }

  // ------------------------------------------------------------ effects
  const VOICE = { rosa: 260, kid: 520, baker: 200, mimo: 1000 };
  const fx = {
    step(run, path, wet) { const t = ac.currentTime; if (wet) { noise(t, 0.12, 0.12, 'bandpass', 600 + Math.random() * 300, 1.5); return; } noise(t, run ? 0.07 : 0.05, run ? 0.16 : 0.11, 'bandpass', (path ? 850 : 1500) * (0.85 + Math.random() * 0.3), 1.2); },
    wood() { const t = ac.currentTime; tone('triangle', 180 + Math.random() * 40, 150, t, 0.06, 0.08); },
    jump() { const t = ac.currentTime; tone('sine', 300, 560, t, 0.11, 0.1); noise(t, 0.12, 0.05, 'bandpass', 900, 0.8); },
    land(hard) { const t = ac.currentTime, v = Math.min(1, hard / 14); tone('sine', 150, 55, t, 0.13, 0.2 * v + 0.05); noise(t, 0.09, 0.08 * v + 0.03, 'lowpass', 500); },
    pip() { const t = ac.currentTime; tone('sine', 1000 + Math.random() * 200, 760, t, 0.05, 0.035); },
    chirp() { const t = ac.currentTime, k = 0.9 + Math.random() * 0.25; tone('sine', 880 * k, 1350 * k, t, 0.08, 0.07); tone('sine', 1150 * k, 1700 * k, t + 0.09, 0.08, 0.06); },
    babble() { const t = ac.currentTime; for (let i = 0; i < 4; i++) { const f = 700 + Math.random() * 700; tone('sine', f, f * 1.25, t + i * 0.085, 0.06, 0.05); } },
    whimper() { const t = ac.currentTime; tone('sine', 900, 600, t, 0.3, 0.04); },
    // a talk blip; o.monotone (a hushed person) gives the flat, breathy one
    blip(who, o) { if (o && o.monotone) return fx.hushblip(who); const t = ac.currentTime, f = VOICE[who] || 320; tone('triangle', f * (0.9 + Math.random() * 0.3), f, t, 0.04, 0.05); },
    // a hushed person's blip: one flat, low pitch (no lilt), mostly breath, and now and then a syllable
    // that doesn't come out at all
    hushblip(who) {
      if (Math.random() < 0.22) return;
      const t = ac.currentTime, f = (VOICE[who] || 320) * 0.6;
      tone('sine', f, f, t, 0.03, 0.026, sfx, 0.006);
      noise(t + 0.004, 0.05, 0.03, 'bandpass', 700 + f * 2, 1.6, sfx, 0.012);
    },
    learned() { const t = ac.currentTime; [1047, 1319, 1568, 2093].forEach((f, i) => { tone('sine', f, f, t + i * 0.07, 0.7, 0.07); tone('sine', f * 2, f * 2, t + i * 0.07, 0.2, 0.012); }); },
    review() { const t = ac.currentTime; [1319, 1760].forEach((f, i) => tone('sine', f, f, t + i * 0.08, 0.4, 0.05)); },
    chest() { const t = ac.currentTime; [523, 659, 784, 1047].forEach((f, i) => tone('square', f, f, t + i * 0.09, i === 3 ? 0.6 : 0.08, 0.035)); noise(t + 0.3, 0.6, 0.05, 'highpass', 6000); },
    wrong() { const t = ac.currentTime; tone('sine', 330, 300, t, 0.1, 0.06); tone('sine', 290, 260, t + 0.12, 0.14, 0.06); },
    poof() { const t = ac.currentTime; const f = noise(t, 0.22, 0.08, 'bandpass', 600, 1.5); f.frequency.exponentialRampToValueAtTime(2400, t + 0.2); },
    click() { const t = ac.currentTime; tone('triangle', 1400, 1100, t, 0.03, 0.04); },
    page() { const t = ac.currentTime; noise(t, 0.18, 0.07, 'bandpass', 3200, 0.7); noise(t + 0.1, 0.12, 0.05, 'bandpass', 4200, 0.7); },
    crack() { const t = ac.currentTime; noise(t, 0.05, 0.2, 'highpass', 2500, 1); tone('triangle', 900, 500, t, 0.05, 0.05); },
    hatch() { const t = ac.currentTime; noise(t, 0.12, 0.2, 'highpass', 2000); [784, 988, 1175, 1568].forEach((f, i) => tone('sine', f, f, t + 0.1 + i * 0.06, 0.6, 0.06)); },
    whistle() { const t = ac.currentTime; [0, 0.5].forEach(d => { tone('sine', 660, 660, t + d, 0.4, 0.06, sfx, 0.05); tone('sine', 830, 830, t + d, 0.4, 0.05, sfx, 0.05); }); noise(t, 0.9, 0.04, 'bandpass', 1800, 2); },
    chug() { const t = ac.currentTime; noise(t, 0.08, 0.08, 'bandpass', 400, 1); },
    bell() { const t = ac.currentTime; [523, 1046, 1568, 2093].forEach((f, i) => tone('sine', f, f, t, 2.5 - i * 0.4, 0.05 / (i + 1), sfx, 0.002)); },
    // battles
    hit() { const t = ac.currentTime; tone('sine', 180, 60, t, 0.14, 0.28); noise(t, 0.07, 0.14, 'bandpass', 1400, 0.9); },
    perfect() { const t = ac.currentTime; [1319, 1976, 2637].forEach((f, i) => tone('triangle', f, f, t + i * 0.04, 0.35, 0.05)); noise(t, 0.25, 0.04, 'highpass', 7000); },
    whiff() { const t = ac.currentTime; const f = noise(t, 0.16, 0.06, 'bandpass', 1800, 2); f.frequency.exponentialRampToValueAtTime(500, t + 0.15); },
    swoosh() { const t = ac.currentTime; const f = noise(t, 0.35, 0.08, 'bandpass', 400, 1.2); f.frequency.exponentialRampToValueAtTime(3200, t + 0.32); },
    hurt() { const t = ac.currentTime; tone('square', 220, 110, t, 0.18, 0.05); noise(t, 0.12, 0.1, 'lowpass', 700); },
    shout() { const t = ac.currentTime; for (let i = 0; i < 3; i++) tone('triangle', 170 + Math.random() * 60, 140, t + i * 0.07, 0.05, 0.05); },
    type() { const t = ac.currentTime; tone('triangle', 1700 + Math.random() * 300, 1500, t, 0.015, 0.015); },
    fanfare() { const t = ac.currentTime; [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [988, 0.6], [1047, 0.72]].forEach(([f, d], i) => { tone('square', f, f, t + d, i === 5 ? 0.7 : 0.11, 0.035); tone('sine', f / 2, f / 2, t + d, 0.14, 0.04); }); },
    lose() { const t = ac.currentTime; [523, 466, 415, 349].forEach((f, i) => tone('triangle', f, f, t + i * 0.2, 0.3, 0.05)); },
  };

  // ============================================================ PHONK, part 2 (additive, for phonk.js)
  // The recorded sounds as effects (the instruments above, played into the sfx bus), the recorder's beep, a record scratch
  // and the vocal-chop stab.
  const toSfx = fn => { const keep = music; music = sfx; try { fn(ac.currentTime); } finally { music = keep; } };
  Object.assign(fx, {
    quack() { toSfx(t => { quackS(t, 64, 1); quackS(t + 0.2, 62, 0.85); quackS(t + 0.38, 65, 0.9); }); },
    bigbell() { toSfx(t => bellS(54, t, 1.1)); },
    piui() { toSfx(t => whistleS(t, 1.0, 1.3)); },
    croak() { toSfx(t => { croakS(t, 43, 1); croakS(t + 0.42, 45, 0.85); croakS(t + 0.7, 41, 0.7); }); },
    gears() { toSfx(t => { for (let k = 0; k < 4; k++) gearsS(t + k * 0.3, 0.22, 1); }); },
    sheepbell() { toSfx(t => { sheepS(t, 1); sheepS(t + 0.42, 0.75); sheepS(t + 0.7, 0.5); }); },
    chop() { toSfx(t => vox(61, t, 0.13, 0.75, 'a', 'e')); },
    rec() { const t = ac.currentTime; tone('sine', 1320, 1320, t, 0.05, 0.045); tone('sine', 1760, 1760, t + 0.07, 0.07, 0.045); },
    scratch() {
      const t = ac.currentTime, s = ac.createBufferSource(), bp = filt('bandpass', 700, 3), g = ac.createGain(); s.buffer = noiseBuf;
      bp.frequency.setValueAtTime(700, t); [[0.07, 2600], [0.15, 650], [0.23, 2300], [0.3, 900]].forEach(([d, f]) => bp.frequency.linearRampToValueAtTime(f, t + d));
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18, t + 0.01); g.gain.setValueAtTime(0.15, t + 0.26); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      s.connect(bp); bp.connect(g); g.connect(sfx); s.start(t, Math.random()); s.stop(t + 0.34);
    },
  });
  // ============================================================ the Quarry Caves (additive, for caves.js, mine.js and the echo bats)
  Object.assign(fx, {
    // Mimo singing: a little five-note tune with a wobble
    sing() { const t = ac.currentTime; [1047, 1175, 1319, 1175, 1568].forEach((f, i) => { tone('sine', f, f * 1.01, t + i * 0.13, 0.16, 0.06, sfx, 0.01); tone('triangle', f * 2, f * 2, t + i * 0.13, 0.08, 0.012, sfx, 0.005); }); },
    // Pío the canary: a quick trill, up and down
    canary() { const t = ac.currentTime; for (let i = 0; i < 11; i++) { const f = 2600 + Math.sin(i * 0.9) * 700 + i * 40; tone('sine', f, f * 1.18, t + i * 0.065, 0.05, 0.035, sfx, 0.004); } },
    // crystals waking: a shimmer of high bells
    chime() { const t = ac.currentTime; [2093, 2637, 3136, 4186, 3520].forEach((f, i) => tone('sine', f, f, t + i * 0.09, 1.3 - i * 0.12, 0.03, sfx, 0.003)); },
    // the mine's gong: a deep metallic hum with clanging partials and a soft hit
    gong() { const t = ac.currentTime; [[98, 0.16, 4.2], [227, 0.08, 3.4], [363, 0.05, 2.6], [485, 0.04, 2.2], [666, 0.025, 1.6], [902, 0.015, 1.1]].forEach(([f, v, d]) => tone('sine', f * 1.02, f, t, d, v, sfx, 0.006)); noise(t, 0.12, 0.12, 'lowpass', 900, 0.8); },
    // an echo bat: three quick squeaks, high and thin
    screech() { const t = ac.currentTime; for (let i = 0; i < 3; i++) tone('square', 3400 + i * 300, 5200, t + i * 0.07, 0.045, 0.012, sfx, 0.002); },
    // your own command thrown back at you: the same blip, three times, fainter each time
    echo() { const t = ac.currentTime; for (let i = 0; i < 4; i++) { tone('triangle', 520, 470, t + i * 0.16, 0.12, 0.06 * Math.pow(0.55, i), sfx, 0.004); noise(t + i * 0.16, 0.08, 0.03 * Math.pow(0.55, i), 'bandpass', 1500, 1.4); } },
  });
  // ============================================================ the Bloom Gardens (additive, for gardens.js, greenhouse.js and the picky bees)
  Object.assign(fx, {
    // a picky bee: a buzzy wobble, a sawtooth hum going round
    buzz() { const t = ac.currentTime; for (let i = 0; i < 2; i++) { tone('sawtooth', 230 + i * 6, 250 + i * 8, t + i * 0.02, 0.42, 0.018, sfx, 0.02); } noise(t, 0.4, 0.02, 'bandpass', 900, 3, sfx, 0.02); },
    // Mimo climbing: little scrabbling taps, rising
    climb() { const t = ac.currentTime; for (let i = 0; i < 6; i++) { tone('triangle', 420 + i * 70, 380 + i * 70, t + i * 0.07, 0.04, 0.035, sfx, 0.003); noise(t + i * 0.07, 0.03, 0.03, 'bandpass', 2400, 2, sfx, 0.002); } },
    // a sting: a sharp little zap
    sting() { const t = ac.currentTime; tone('square', 1800, 600, t, 0.08, 0.03, sfx, 0.002); noise(t, 0.06, 0.05, 'highpass', 3000, 1, sfx, 0.002); },
  });
  // ============================================================ the Frost Peaks (additive, for peaks.js, icetower.js and the snowballs)
  Object.assign(fx, {
    // Mimo blowing: a breathy gust that swells and fades
    blow() { const t = ac.currentTime; const f = noise(t, 0.75, 0.11, 'bandpass', 420, 0.7, sfx, 0.12); f.frequency.exponentialRampToValueAtTime(1500, t + 0.3); f.frequency.exponentialRampToValueAtTime(520, t + 0.8); noise(t + 0.05, 0.6, 0.05, 'lowpass', 260, 0.7, sfx, 0.1); },
    // a clock: tick… tock
    tick() { const t = ac.currentTime; tone('sine', 1900, 1800, t, 0.03, 0.05, sfx, 0.001); noise(t, 0.015, 0.05, 'bandpass', 3800, 3); },
    // a clock set going: its hands whirr round, a click, a little chime
    clockset() { const t = ac.currentTime; for (let i = 0; i < 9; i++) noise(t + i * 0.05, 0.02, 0.05, 'bandpass', 2400 + i * 150, 4); tone('sine', 1568, 1568, t + 0.5, 0.8, 0.04, sfx, 0.003); tone('sine', 2093, 2093, t + 0.62, 0.9, 0.035, sfx, 0.003); },
    // snow: a crunch (a hit), a snowball packing on more snow (grow) or losing it (shrink)
    crunch() { const t = ac.currentTime; noise(t, 0.12, 0.14, 'bandpass', 1100, 0.9); noise(t + 0.03, 0.09, 0.08, 'highpass', 3200, 0.8); },
    grow() { const t = ac.currentTime; const f = noise(t, 0.45, 0.1, 'bandpass', 300, 1.2, sfx, 0.05); f.frequency.exponentialRampToValueAtTime(900, t + 0.4); tone('triangle', 140, 220, t, 0.4, 0.06, sfx, 0.03); },
    shrink() { const t = ac.currentTime; const f = noise(t, 0.4, 0.09, 'bandpass', 1200, 1.2, sfx, 0.02); f.frequency.exponentialRampToValueAtTime(350, t + 0.38); tone('triangle', 260, 150, t, 0.35, 0.05, sfx, 0.02); },
    snowroll() { const t = ac.currentTime; const f = noise(t, 0.7, 0.1, 'lowpass', 300, 0.8, sfx, 0.08); f.frequency.exponentialRampToValueAtTime(700, t + 0.6); },
  });
  // ============================================================ the new areas' songs (2026-11-11)
  // The Quarry Caves' camp ('quarry') and mine ('mine'), the old lighthouse ('isle'), the Bloom Gardens ('gardens') and the
  // great greenhouse ('greenhouse'), the Frost Peaks ('peaks') and the Ice Clock Tower ('icetower'), the old tower in the
  // cutaways ('oldtower') and the script school ('school': its zh or ja version by Sound.lang). Funk for the busy places,
  // jazzy lo-fi for the calm ones; every tune is original. (The first Chinese and Japanese battle themes were here too; their
  // instruments below stay in the kit. The battle themes now live with the boss themes, further down.)
  // ------------------------------------------------------------ their instruments
  // work: a hammer on an anvil (a clang of inharmonic partials over a knock), a pick chipping rock, a shovel into gravel,
  // a funk guitar's muted scratch ("chk")
  function anvil(t, v = 1, f = 1180) {
    [[1, 0.05, 0.45], [2.76, 0.028, 0.26], [5.4, 0.014, 0.12]].forEach(([k, a, d]) => tone('sine', f * k, f * k * 0.997, t, d, a * v, music, 0.001));
    noise(t, 0.035, 0.1 * v, 'bandpass', 2300, 1.2, music, 0.001);
  }
  function chip(t, v = 1) { tone('triangle', 3000, 2750, t, 0.028, 0.045 * v, music, 0.001); noise(t, 0.022, 0.06 * v, 'bandpass', 4300, 3, music, 0.001); }
  function shovel(t, len, v = 1) { const f = noise(t, len, 0.06 * v, 'bandpass', 1100, 0.9, music, len * 0.5); f.frequency.setValueAtTime(1000, t); f.frequency.linearRampToValueAtTime(2600, t + len); }
  function chk(t, v = 1) { noise(t, 0.028, 0.05 * v, 'bandpass', 2200, 1.6, music, 0.001); }
  // Pío the canary, in the tune: a trill between two notes (n chirps, each a little upward flick)
  function canary(m, m2, t, n, v = 1, gap = 0.048) { for (let k = 0; k < n; k++) { const f = mtof(k & 1 ? m2 : m); tone('sine', f * 0.93, f * 1.03, t + k * gap, 0.032, 0.026 * v, music, 0.003); } }
  // the cave: a drip (a blip that rises: "plip") and an echo bat's sonar ping, both thrown back by the song's echo
  function drip(m, t, v = 1) { const f = mtof(m), o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.8, t + 0.05); env(g, t, 0.04 * v, 0.002, 0.055); o.connect(g); g.connect(music); g.connect(echoIn); o.start(t); o.stop(t + 0.1); }
  function sonar(m, t, v = 1) { const f = mtof(m), o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(f * 1.05, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.015); env(g, t, 0.03 * v, 0.002, 0.08); o.connect(g); g.connect(music); g.connect(echoIn); o.start(t); o.stop(t + 0.12); }
  // the sea: a wave (noise that swells and brightens, then draws back), the lighthouse's beam going round (a soft octave
  // that glows up through a filter and fades as it sweeps past) and a foghorn far off
  function wave(t, len, v = 1) {
    const s = ac.createBufferSource(), lp = filt('lowpass', 260, 0.5), g = ac.createGain(); s.buffer = noiseBuf; s.loop = true;
    lp.frequency.setValueAtTime(240, t); lp.frequency.linearRampToValueAtTime(1300, t + len * 0.42); lp.frequency.exponentialRampToValueAtTime(200, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.055 * v, t + len * 0.42); g.gain.linearRampToValueAtTime(0.0001, t + len);
    s.connect(lp); lp.connect(g); g.connect(music); s.start(t, Math.random()); s.stop(t + len + 0.05);
  }
  function beam(m, t, len, v = 1) {
    const f = mtof(m), lp = filt('lowpass', 300, 2), g = ac.createGain(), mid = t + len * 0.5, end = t + len + 0.1;
    lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(2400, mid); lp.frequency.linearRampToValueAtTime(300, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.02 * v, mid); g.gain.linearRampToValueAtTime(0.0001, t + len);
    lp.connect(g); g.connect(music); osc('sawtooth', f, t, end, lp, -6); osc('sawtooth', f * 2, t, end, lp, 6);
  }
  function foghorn(m, t, len, v = 1) {
    const f = mtof(m), lp = filt('lowpass', 260, 1.5), g = ac.createGain(), end = t + len + 0.1;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.08 * v, t + 0.45); g.gain.linearRampToValueAtTime(0.065 * v, t + len * 0.75); g.gain.linearRampToValueAtTime(0.0001, t + len);
    lp.connect(g); g.connect(music); osc('sawtooth', f, t, end, lp); osc('sawtooth', f * 1.005, t, end, lp);
  }
  // the garden: a bee (a buzzy saw that wobbles fast, zipping from one note to the next); a glass bell (FM at an
  // inharmonic 1 : 3.5, bright on the strike, then a long glassy ring)
  function bee(m, to, t, len, v = 1) {
    const f = mtof(m), o = ac.createOscillator(), w = ac.createOscillator(), wg = ac.createGain(), lp = filt('lowpass', 1700, 5), g = ac.createGain(), end = t + len + 0.08, pk = 0.026 * v;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); if (to !== m) o.frequency.exponentialRampToValueAtTime(mtof(to), t + len * 0.85);
    w.type = 'triangle'; w.frequency.value = 23; wg.gain.value = f * 0.035; w.connect(wg); wg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pk, t + 0.02); g.gain.setValueAtTime(pk, t + Math.max(0.03, len - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.06);
    o.connect(lp); lp.connect(g); g.connect(music); o.start(t); w.start(t); o.stop(end); w.stop(end);
  }
  function glass(m, t, v = 1, len = 1.5) {
    const f = mtof(m), c = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain(), end = t + len + 0.1;
    c.frequency.value = f; mo.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 1.8, t); mg.gain.exponentialRampToValueAtTime(f * 0.08, t + len * 0.6);
    mo.connect(mg); mg.connect(c.frequency); env(g, t, 0.035 * v, 0.002, len); c.connect(g); g.connect(music); c.start(t); mo.start(t); c.stop(end); mo.stop(end);
  }
  // winter: sleigh bells (a shake of bright jingles) and a clock's tick (hi) or tock (lo)
  function jingle(t, v = 1, len = 0.08) {
    noise(t, len, 0.045 * v, 'bandpass', 7600, 2.2, music, 0.003); noise(t + 0.014, len * 0.8, 0.03 * v, 'bandpass', 5400, 2.8, music, 0.002);
    tone('sine', 5120, 5040, t, len * 0.6, 0.007 * v, music, 0.001);
  }
  function tick(t, hi = true, v = 1) { const f = hi ? 2050 : 1450; tone('sine', f, f * 0.94, t, 0.022, 0.045 * v, music, 0.0008); noise(t, 0.01, 0.045 * v, 'bandpass', hi ? 4300 : 3100, 3, music, 0.0005); }
  // an FM lead (the bright, brassy kind from 90s game music): a sine whose 1 : 1 modulator swells on the attack, vibrato
  // on long notes, a quick slide from a note just before
  let lastFm = 0, lastFmT = -9;
  function fmlead(m, t, dur, v = 1, idx = 2) {
    if (hush > 0.5 && Math.random() < (hush - 0.5) * 0.5) return;
    const f = mtof(m), c = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain(), vib = ac.createOscillator(), vg = ac.createGain();
    const end = t + Math.max(0.08, dur * 0.9), pk = 0.042 * v * (1 - 0.4 * hush), from = t - lastFmT < 0.12 ? lastFm : 0; lastFm = f; lastFmT = end;
    [c, mo].forEach(o => { if (from && from !== f) { o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.025); } else o.frequency.value = f; });
    mg.gain.setValueAtTime(f * idx * 0.5, t); mg.gain.linearRampToValueAtTime(f * idx, t + 0.02); mg.gain.exponentialRampToValueAtTime(f * idx * 0.3, t + Math.max(0.12, dur));
    vib.frequency.value = 5.6; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(dur > 0.3 ? f * 0.009 : 0, t + Math.min(dur, 0.4));
    vib.connect(vg); vg.connect(c.frequency); vg.connect(mo.frequency); mo.connect(mg); mg.connect(c.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pk, t + 0.006); g.gain.linearRampToValueAtTime(pk * 0.8, Math.max(t + 0.04, end - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.06);
    c.connect(g); g.connect(music); g.connect(echoIn);
    [c, mo, vib].forEach(o => { o.start(t); o.stop(end + 0.1); });
  }
  // China: a guzheng (a bright, slightly metallic pluck, bent down into its note; rou: the left hand's wobble after it),
  // its sweep up the strings, and the opera gongs (the little one bends up, "jiang!", the big one down, "wang")
  function zheng(m, t, v = 1, len = 0.8, rou = 0) {
    const f = mtof(m), L = Math.max(0.2, len), lp = filt('lowpass', 4000, 1.4), g = ac.createGain(), end = t + L + 0.05;
    const os = [osc('sawtooth', f, t, end, lp), osc('triangle', f * 2, t, end, lp, 4)];
    os.forEach((o, k) => { const F = f * (k + 1); o.frequency.setValueAtTime(F * 1.012, t); o.frequency.exponentialRampToValueAtTime(F, t + 0.06); });
    if (rou) { const w = ac.createOscillator(), wg = ac.createGain(); w.frequency.value = 5.2; wg.gain.setValueAtTime(0, t); wg.gain.linearRampToValueAtTime(f * 0.012 * rou, t + 0.3); w.connect(wg); os.forEach(o => wg.connect(o.frequency)); w.start(t); w.stop(end); }
    lp.frequency.setValueAtTime(Math.min(9000, f * 7), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.6), t + 0.07 + L * 0.35);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.042 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.014 * v, t + 0.12); g.gain.exponentialRampToValueAtTime(0.0001, t + L);
    lp.connect(g); g.connect(music);
  }
  function gliss(notes, t, v = 1, gap = 0.024) { notes.forEach((m, k) => zheng(m, t + k * gap, v * (0.55 + 0.45 * k / notes.length), 0.45)); }
  function luo(t, up, v = 1) {
    const f = up ? 560 : 250;
    tone('triangle', f, f * (up ? 1.22 : 0.84), t, up ? 0.5 : 1.1, 0.07 * v, music, 0.002);
    tone('sine', f * 2.43, f * 2.43 * (up ? 1.18 : 0.86), t, up ? 0.35 : 0.8, 0.028 * v, music, 0.002);
    noise(t, 0.08, 0.06 * v, 'bandpass', up ? 3200 : 1700, 1.2, music, 0.001);
  }
  // Japan: a koto (a hard, bright plectrum attack, a nasal ring that dies fast; press: the string pushed up after the
  // pluck) and a shamisen (the bachi's sharp strike, a buzzy twang of two strings a hair apart, dipping into its pitch)
  function koto(m, t, v = 1, len = 0.7, press = 0) {
    const f = mtof(m), L = Math.max(0.2, len), lp = filt('lowpass', 4000, 3.2), g = ac.createGain(), end = t + L + 0.05;
    const os = [osc('sawtooth', f, t, end, lp), osc('triangle', f, t, end, lp, -5)];
    if (press) os.forEach(o => { o.frequency.setValueAtTime(f, t + 0.14); o.frequency.linearRampToValueAtTime(f * Math.pow(2, press / 12), t + 0.24); });
    lp.frequency.setValueAtTime(Math.min(9000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2), t + 0.04 + L * 0.25);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.045 * v, t + 0.0015); g.gain.exponentialRampToValueAtTime(0.012 * v, t + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + L);
    lp.connect(g); g.connect(music);
  }
  function shami(m, t, v = 1, len = 0.26) {
    const f = mtof(m), L = Math.max(0.12, len), bp = filt('bandpass', f * 4, 2.2), g = ac.createGain(), end = t + L + 0.05;
    [1, 1.007].forEach(k => { const o = osc('sawtooth', f * k, t, end, bp); o.frequency.setValueAtTime(f * k * 1.025, t); o.frequency.exponentialRampToValueAtTime(f * k, t + 0.025); });
    bp.frequency.setValueAtTime(Math.min(8000, f * 7), t); bp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 2.4), t + L * 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.1 * v, t + 0.0015); g.gain.exponentialRampToValueAtTime(0.025 * v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + L);
    bp.connect(g); g.connect(music); noise(t, 0.01, 0.05 * v, 'highpass', 2600, 0.8, music, 0.0005);
  }
  // the old tower: a music box (a tine's pure ring, the comb's high "tink", the click of the pin; flat: how far out of tune
  // this worn tine has sagged, in semitones)
  function mbox(m, t, v = 1, flat = 0, len = 2) {
    const f = mtof(m) * Math.pow(2, -flat / 12);
    tone('sine', f, f * 0.998, t, len, 0.045 * v, music, 0.002);
    tone('sine', f * 6.27, f * 6.25, t, 0.12, 0.006 * v, music, 0.001);
    noise(t, 0.006, 0.012 * v, 'highpass', 5000, 0.7, music, 0.0005);
  }
  // ------------------------------------------------------------ each song's own drum kit
  // the camp (a work song): a stomp on a wooden floor, one person's handclap, a thimble on a washboard
  function stomp(t, v = 1) { tone('sine', 115, 46, t, 0.16, 0.5 * v, music, 0.002); noise(t, 0.05, 0.12 * v, 'lowpass', 420, 0.8, music, 0.001); noise(t, 0.025, 0.06 * v, 'bandpass', 950, 2, music, 0.001); }
  function hclap(t, v = 1) { [0, 0.009, 0.021].forEach((d, k) => noise(t + d, k === 2 ? 0.09 : 0.02, 0.15 * v, 'bandpass', 1050 + k * 120, 1.1, music, 0.001)); }
  function board(t, v = 1, len = 0.06) { scrape(t, len, 0.9 * v, 3400, 90); }
  // the mine: a deep soft thud, a struck pipe (low metal, a long inharmonic ring), a chain's rattle, a little clink of metal
  function thud(t, v = 1) { tone('sine', 72, 36, t, 0.55, 0.6 * v, music, 0.004); noise(t, 0.04, 0.05 * v, 'lowpass', 250, 0.7, music, 0.002); }
  function pipe(t, f = 420, v = 1) {
    [[1, 0.045, 0.9], [2.76, 0.03, 0.6], [5.4, 0.016, 0.35], [8.93, 0.008, 0.2]].forEach(([k, a, d]) => tone('sine', f * k, f * k * 0.996, t, d, a * v, music, 0.001));
    noise(t, 0.02, 0.07 * v, 'bandpass', f * 3, 2, music, 0.001);
  }
  function chain(t, v = 1) { for (let k = 0; k < 5; k++) noise(t + k * 0.022 + Math.random() * 0.01, 0.018, 0.03 * v * (1 - k * 0.15), 'bandpass', 4200 + Math.random() * 2500, 4, music, 0.001); }
  function clink(t, v = 1) { noise(t, 0.02, 0.04 * v, 'bandpass', 6800, 6, music, 0.0005); tone('sine', 5200, 5150, t, 0.03, 0.008 * v, music, 0.0005); }
  // the lighthouse (dub): a round deep kick, a sidestick ("the one drop": the two together on beat three), a soft dub hat
  function dubkick(t, v = 1) { tone('sine', 92, 40, t, 0.42, 0.62 * v, music, 0.003); }
  function sidestick(t, v = 1) { tone('triangle', 1020, 900, t, 0.035, 0.09 * v, music, 0.001); noise(t, 0.03, 0.08 * v, 'bandpass', 2100, 2.2, music, 0.001); }
  function dubhat(t, v = 1, open) { noise(t, open ? 0.24 : 0.03, 0.07 * v, 'bandpass', 9000, 1, music, 0.002); }
  // the gardens (Motown): a tight pop kick, a stack of claps, a tambourine (a hit, or a shake)
  function popkick(t, v = 1) { tone('sine', 165, 58, t, 0.14, 0.6 * v, music, 0.002); noise(t, 0.008, 0.05 * v, 'highpass', 2000, 0.7, music, 0.0005); }
  function claps(t, v = 1) { [0, 0.006, 0.015, 0.027].forEach((d, k) => noise(t + d, k === 3 ? 0.11 : 0.025, 0.12 * v, 'bandpass', 1400 + (k & 1) * 500, 1.3, music, 0.001)); }
  function tamb(t, v = 1, hit) {
    noise(t, hit ? 0.14 : 0.05, (hit ? 0.06 : 0.035) * v, 'bandpass', 8200, 1.8, music, 0.002); noise(t + 0.006, hit ? 0.1 : 0.04, (hit ? 0.04 : 0.02) * v, 'bandpass', 10000, 2, music, 0.002);
    if (hit) tone('triangle', 420, 380, t, 0.04, 0.03 * v, music, 0.001);
  }
  // the greenhouse (a jazz waltz): a soft felt kick, a brush swirling round the snare head (brush() is the tap)
  function feltkick(t, v = 1) { tone('sine', 82, 48, t, 0.3, 0.45 * v, music, 0.008); }
  function swirl(t, len, v = 1) {
    const s = ac.createBufferSource(), bp = filt('bandpass', 3000, 0.7), g = ac.createGain(); s.buffer = noiseBuf; s.loop = true;
    bp.frequency.setValueAtTime(2400, t); bp.frequency.linearRampToValueAtTime(4200, t + len * 0.5); bp.frequency.linearRampToValueAtTime(2600, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03 * v, t + len * 0.3); g.gain.linearRampToValueAtTime(0.012 * v, t + len * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + len);
    s.connect(bp); bp.connect(g); g.connect(music); s.start(t, Math.random()); s.stop(t + len + 0.05);
  }
  // the peaks (jazz): a ride cymbal's "ding", the hi-hat's foot ("chick"), a bass drum feathered on every beat
  function ride(t, v = 1) {
    [[3150, 0.012, 0.9], [4370, 0.009, 0.7], [5890, 0.006, 0.5]].forEach(([f, a, d]) => tone('sine', f, f * 0.995, t, d, a * v, music, 0.001));
    noise(t, 0.35, 0.025 * v, 'highpass', 6500, 0.8, music, 0.002);
  }
  function hatfoot(t, v = 1) { noise(t, 0.03, 0.06 * v, 'bandpass', 5200, 1.5, music, 0.003); }
  function feather(t, v = 1) { tone('sine', 66, 50, t, 0.18, 0.25 * v, music, 0.006); }
  // the ice tower (chiptune): the triangle channel's kick, the noise channel's hats ("tss") and snare ("kssh")
  function chipkick(t, v = 1) { tone('triangle', 240, 50, t, 0.09, 0.32 * v, music, 0.001); }
  function chipnoise(t, v = 1, len = 0.03, f = 9000) { noise(t, len, 0.07 * v, 'highpass', f, 0.5, music, 0.0005); }
  // the Chinese battle: the tanggu (a big drum, boomy) and the naobo (cymbals clashed: "chang!"); the bangzi is woodblock()
  function tanggu(t, v = 1) { tone('sine', 128, 66, t, 0.42, 0.55 * v, music, 0.002); tone('triangle', 190, 120, t, 0.12, 0.12 * v, music, 0.001); noise(t, 0.05, 0.08 * v, 'lowpass', 700, 0.8, music, 0.001); }
  function naobo(t, v = 1, len = 0.35) { noise(t, len, 0.12 * v, 'bandpass', 4600, 0.9, music, 0.001); noise(t, len * 0.6, 0.08 * v, 'bandpass', 2300, 1.6, music, 0.001); tone('sine', 1430, 1400, t, len * 0.8, 0.02 * v, music, 0.001); }
  // the Japanese battle (an 80s drum machine): a clicky kick, a snare in a gated room (it rings, then shuts), a Simmons tom
  function linnkick(t, v = 1) { tone('sine', 190, 48, t, 0.2, 0.7 * v, music, 0.001); noise(t, 0.006, 0.12 * v, 'highpass', 3000, 0.7, music, 0.0003); }
  function gatesnare(t, v = 1) {
    tone('triangle', 230, 180, t, 0.07, 0.25 * v, music, 0.001);
    const s = ac.createBufferSource(), bp = filt('bandpass', 2200, 0.6), g = ac.createGain(); s.buffer = noiseBuf;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.2 * v, t + 0.003); g.gain.linearRampToValueAtTime(0.14 * v, t + 0.18); g.gain.linearRampToValueAtTime(0.0001, t + 0.21);
    s.connect(bp); bp.connect(g); g.connect(music); s.start(t, Math.random()); s.stop(t + 0.25);
  }
  function simtom(t, f, v = 1) { tone('sine', f * 1.9, f, t, 0.3, 0.3 * v, music, 0.001); noise(t, 0.02, 0.06 * v, 'bandpass', 1600, 1, music, 0.0005); }
  // the school (lo-fi): a dusty kick and snare (soft, a little crushed, the highs rolled off), a dark little hat
  function dustkick(t, v = 1) {
    const o = ac.createOscillator(), g = ac.createGain(), lp = filt('lowpass', 900, 0.7); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    env(g, t, 0.55 * v, 0.003, 0.3); o.connect(crunch(lp, 1.6)); lp.connect(g); g.connect(music); o.start(t); o.stop(t + 0.36);
  }
  function dustsnare(t, v = 1) { noise(t, 0.14, 0.2 * v, 'bandpass', 1600, 0.9, music, 0.002); tone('triangle', 190, 160, t, 0.06, 0.12 * v, music, 0.001); noise(t, 0.03, 0.08 * v, 'lowpass', 3500, 0.7, music, 0.001); }
  function dusthat(t, v = 1) { noise(t, 0.025, 0.07 * v, 'bandpass', 6000, 1.2, music, 0.002); }
  // ------------------------------------------------------------ each song's own bass
  // the camp's washtub bass: a thumpy pluck that blooms up into its note
  function tub(m, t, len = 0.3, v = 1) {
    const f = mtof(m), lp = filt('lowpass', 700, 0.8), g = ac.createGain(), end = t + len + 0.1;
    [osc('triangle', f, t, end, lp), osc('sine', f, t, end, lp)].forEach(o => { o.frequency.setValueAtTime(f * 0.94, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05); });
    env(g, t, 0.3 * v, 0.004, len); lp.connect(g); g.connect(music);
  }
  // the mine's sub: a pure, deep sine (a quiet octave above it, so small speakers hear it) sliding from the note before
  let lastSub = 0;
  function subglide(m, t, len, v = 1) {
    const f = mtof(m), g = ac.createGain(), g2 = ac.createGain(), end = t + len + 0.1, os = [osc('sine', f, t, end, g), osc('sine', f * 2, t, end, g2)];
    if (lastSub) os.forEach((o, k) => { o.frequency.setValueAtTime(lastSub * (k + 1), t); o.frequency.exponentialRampToValueAtTime(f * (k + 1), t + 0.08); }); lastSub = f;
    g2.gain.value = 0.25; g2.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.2 * v, t + 0.02); g.gain.linearRampToValueAtTime(0.18 * v, t + Math.max(0.03, len - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.06);
    g.connect(music);
  }
  // the lighthouse's dub bass: round and deep, a soft thump on the front
  function dub(m, t, len, v = 1) {
    const f = mtof(m), lp = filt('lowpass', 520, 1), g = ac.createGain(), end = t + len + 0.1;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.18 * v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.11 * v, t + Math.max(0.05, len * 0.6)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05);
    lp.connect(g); g.connect(music); osc('triangle', f, t, end, lp); osc('sine', f, t, end, g);
  }
  // the gardens' finger bass (Motown): warm, round, a little bounce on each note
  function fbass(m, t, len, v = 1) {
    const f = mtof(m), lp = filt('lowpass', 900, 1.2), g = ac.createGain(), end = t + len + 0.08;
    lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.12);
    env(g, t, 0.24 * v, 0.003, len); lp.connect(g); g.connect(music); osc('sawtooth', f, t, end, lp); osc('triangle', f, t, end, lp);
  }
  // the greenhouse's fretless: a soft round note that slides a little into place
  function fretless(m, t, len, v = 1) {
    const f = mtof(m), lp = filt('lowpass', 650, 1.5), g = ac.createGain(), end = t + len + 0.1;
    [osc('triangle', f, t, end, lp), osc('sine', f, t, end, lp)].forEach(o => { o.frequency.setValueAtTime(f * 0.97, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.09); });
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.26 * v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    lp.connect(g); g.connect(music);
  }
  // pizzicato (the peaks): a plucked string, woody and quick; low, it's the walking upright, high, the violins
  function pizz(m, t, v = 1, len) {
    const f = mtof(m), lo = f < 200, L = len || (lo ? 0.45 : 0.22), lp = filt('lowpass', 2000, 1), g = ac.createGain(), end = t + L + 0.05;
    lp.frequency.setValueAtTime(Math.min(8000, f * 6), t); lp.frequency.exponentialRampToValueAtTime(Math.max(250, f * 1.5), t + L * 0.5);
    env(g, t, (lo ? 0.3 : 0.06) * v, 0.003, L); lp.connect(g); g.connect(music);
    const o = osc('triangle', f, t, end, lp); o.frequency.setValueAtTime(f * 1.012, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    if (!lo) osc('sawtooth', f, t, end, lp, 5);
  }
  // the ice tower's triangle bass (the 8-bit kind): a bare triangle, gated
  function tribass(m, t, len, v = 1) {
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.28 * v, t + 0.003); g.gain.setValueAtTime(0.28 * v, t + Math.max(0.01, len - 0.01)); g.gain.linearRampToValueAtTime(0.0001, t + len);
    g.connect(music); osc('triangle', mtof(m), t, t + len + 0.02, g);
  }
  // the Chinese battle's wah bass: a saw through a filter that opens and closes on every note ("wow")
  function wahbass(m, t, len, v = 1) {
    const f = mtof(m), lp = filt('lowpass', 300, 6), g = ac.createGain(), end = t + len + 0.08;
    lp.frequency.setValueAtTime(280, t); lp.frequency.exponentialRampToValueAtTime(300 + 1400 * v, t + Math.min(0.09, len * 0.4)); lp.frequency.exponentialRampToValueAtTime(320, t + Math.max(0.12, len));
    env(g, t, 0.2 * v, 0.004, len); lp.connect(g); g.connect(music); osc('sawtooth', f, t, end, lp); osc('sine', f, t, end, g);
  }
  // the Japanese battle's chopper bass (80s slap): thumbed and bright; pop: a popped high note that snaps
  function chopper(m, t, len, v = 1, pop) {
    const f = mtof(m), lp = filt('lowpass', 900, 2), g = ac.createGain(), end = t + len + 0.06;
    lp.frequency.setValueAtTime(pop ? 4200 : 2400, t); lp.frequency.exponentialRampToValueAtTime(pop ? 900 : 600, t + 0.08);
    env(g, t, (pop ? 0.17 : 0.22) * v, 0.002, len); lp.connect(g); g.connect(music); osc('sawtooth', f, t, end, lp); osc('square', f, t, end, lp, 4); osc('sine', f, t, end, g);
    noise(t, 0.012, (pop ? 0.08 : 0.04) * v, 'bandpass', pop ? 3200 : 1500, 2, music, 0.0005);
  }
  // the school's round synth bass (lo-fi): a soft triangle through a low filter
  function roundbass(m, t, len, v = 1) { const f = mtof(m), lp = filt('lowpass', 380, 0.8), g = ac.createGain(), end = t + len + 0.1; env(g, t, 0.34 * v, 0.012, len); lp.connect(g); g.connect(music); osc('triangle', f, t, end, lp); osc('sine', f, t, end, lp); }
  // ------------------------------------------------------------ each song's own chords and leads
  // the camp: a banjo (bright, twangy, quick) and the harmonica's chugged chords (its lead is LEADS.harp)
  function banjo(m, t, v = 1) {
    const f = mtof(m), bp = filt('bandpass', f * 3, 1.1), g = ac.createGain(), end = t + 0.3;
    bp.frequency.setValueAtTime(Math.min(8000, f * 6), t); bp.frequency.exponentialRampToValueAtTime(Math.max(600, f * 2), t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09 * v, t + 0.001); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    bp.connect(g); g.connect(music); osc('sawtooth', f, t, end, bp); osc('square', f * 1.003, t, end, bp); noise(t, 0.008, 0.03 * v, 'highpass', 4000, 0.7, music, 0.0004);
  }
  function harpchord(notes, t, len, v = 1) {
    const bp = filt('bandpass', 1500, 0.9), g = ac.createGain(), end = t + len + 0.06;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03 * v, t + 0.025); g.gain.linearRampToValueAtTime(0.02 * v, t + len * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + len);
    bp.connect(g); g.connect(music); notes.forEach(m => osc('pulse', mtof(m), t, end, bp)); noise(t, len * 0.8, 0.012 * v, 'bandpass', 2400, 1, music, 0.02);
  }
  // the mine: a dark pad (detuned saws through a filter that slowly breathes open and shut) and a tremolo guitar (a twangy
  // note pulsing like an old amp in a western, into the echo)
  function darkpad(m, t, len, v = 1) {
    const f = mtof(m), lp = filt('lowpass', 500, 2), g = ac.createGain(), end = t + len + 0.2;
    lp.frequency.setValueAtTime(380, t); lp.frequency.linearRampToValueAtTime(1100, t + len * 0.5); lp.frequency.linearRampToValueAtTime(420, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022 * v, t + Math.min(1.2, len * 0.4)); g.gain.linearRampToValueAtTime(0.0001, t + len);
    lp.connect(g); g.connect(music); osc('sawtooth', f, t, end, lp, -9); osc('sawtooth', f, t, end, lp, 9);
  }
  function tremgtr(m, t, dur, v = 1) {
    if (hush > 0.5 && Math.random() < (hush - 0.5) * 0.5) return;
    const f = mtof(m), lp = filt('lowpass', 2200, 1.4), am = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain(), end = t + dur + 0.3;
    lp.frequency.setValueAtTime(3200, t); lp.frequency.exponentialRampToValueAtTime(1500, t + 0.25);
    am.gain.value = 0.6; lfo.frequency.value = 6.5; lg.gain.value = 0.4; lfo.connect(lg); lg.connect(am.gain);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.03 * v, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    osc('sawtooth', f, t, end, lp); osc('triangle', f * 2, t, end, lp, 3); lp.connect(am); am.connect(g); g.connect(music); g.connect(echoIn); lfo.start(t); lfo.stop(end);
  }
  // the lighthouse: a reggae skank (a short muted chop), an organ's bubble (three drawbars), a vibraphone with its motor
  // turning (LEADS.melodica is the dub melodica)
  function skank(notes, t, v = 1) { notes.forEach((m, k) => { const f = mtof(m), bp = filt('bandpass', f * 2.5, 1.2), g = ac.createGain(), s = t + k * 0.006; env(g, s, 0.035 * v, 0.002, 0.07); bp.connect(g); g.connect(music); osc('sawtooth', f, s, s + 0.12, bp); }); }
  function organ(m, t, len, v = 1) {
    const f = mtof(m), g = ac.createGain(), end = t + len + 0.03;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022 * v, t + 0.01); g.gain.setValueAtTime(0.022 * v, t + Math.max(0.012, len - 0.02)); g.gain.linearRampToValueAtTime(0.0001, t + len);
    g.connect(music); [[1, 1], [2, 0.5], [3, 0.35]].forEach(([k, a]) => { const og = ac.createGain(); og.gain.value = a; og.connect(g); osc('sine', f * k, t, end, og); });
  }
  function vibe(m, t, len = 1.2, v = 1) {
    const f = mtof(m), g = ac.createGain(), am = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(), end = t + len + 0.1;
    am.gain.value = 0.75; lfo.frequency.value = 5; lg.gain.value = 0.25; lfo.connect(lg); lg.connect(am.gain);
    env(g, t, 0.05 * v, 0.003, len); am.connect(g); g.connect(music); g.connect(echoIn); osc('sine', f, t, end, am); tone('sine', f * 4, f * 4, t, 0.15, 0.007 * v, music, 0.001); lfo.start(t); lfo.stop(end);
  }
  // the gardens: a ukulele strum (four bright nylon strings) and a steel pan (its note, octave and twelfth, struck)
  function ukeS(m, t, v = 1) { const f = mtof(m), lp = filt('lowpass', 4000, 2), g = ac.createGain(), end = t + 0.4; lp.frequency.setValueAtTime(Math.min(9000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 2), t + 0.15); env(g, t, 0.032 * v, 0.002, 0.32); lp.connect(g); g.connect(music); osc('triangle', f, t, end, lp); osc('square', f, t, end, lp, 6); }
  function uke(notes, t, v = 1, up) { const n = notes.length; for (let k = 0; k < n; k++) ukeS(notes[up ? n - 1 - k : k], t + k * 0.013, (up ? 0.65 : 1) * v); }
  function pan(m, t, v = 1, len = 0.9) {
    const f = mtof(m);
    tone('sine', f, f, t, len, 0.05 * v, music, 0.006); tone('sine', f * 2.01, f * 2.01, t, len * 0.55, 0.028 * v, music, 0.004); tone('sine', f * 2.98, f * 2.98, t, len * 0.3, 0.014 * v, music, 0.003);
    noise(t, 0.012, 0.02 * v, 'bandpass', Math.min(9000, f * 4), 2, music, 0.001);
  }
  // the greenhouse: a kalimba (a thumb-plucked tine: its note, a quick high partial, a little buzz) and a warm string pad
  function kalimba(m, t, v = 1, len = 1.1) { const f = mtof(m); tone('sine', f, f, t, len, 0.05 * v, music, 0.002); tone('sine', f * 5.95, f * 5.9, t, 0.06, 0.016 * v, music, 0.001); noise(t, 0.04, 0.012 * v, 'bandpass', f * 2, 6, music, 0.002); }
  function warmpad(m, t, len, v = 1) {
    const f = mtof(m), lp = filt('lowpass', 1300, 0.7), g = ac.createGain(), end = t + len + 0.3;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.014 * v, t + Math.min(1.5, len * 0.4)); g.gain.setValueAtTime(0.014 * v, t + len * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + len + 0.25);
    lp.connect(g); g.connect(music); [-8, 0, 8].forEach(c => osc('sawtooth', f, t, end, lp, c));
  }
  // the peaks: a celesta (a soft bell-piano: its note, a quiet octave, a felt "tock") and handbells
  function celesta(m, t, v = 1, len = 0.9) { const f = mtof(m); tone('sine', f, f, t, len, 0.045 * v, music, 0.002); tone('sine', f * 2, f * 2, t, len * 0.35, 0.016 * v, music, 0.001); noise(t, 0.015, 0.012 * v, 'lowpass', 1500, 0.7, music, 0.001); }
  function handbell(m, t, v = 1) { const f = mtof(m); tone('sine', f, f, t, 2.2, 0.035 * v, music, 0.002); tone('sine', f * 3.01, f * 3.0, t, 1.2, 0.014 * v, music, 0.002); tone('sine', f * 5.2, f * 5.2, t, 0.3, 0.005 * v, music, 0.001); }
  // the ice tower: a bare chip note (the 12.5% pulse unless told otherwise, gated, no filter; LEADS.chip is its lead)
  function chipnote(m, t, len, v = 1, wave = 'pulse8') { const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.035 * v, t + 0.002); g.gain.setValueAtTime(0.035 * v, t + Math.max(0.003, len - 0.008)); g.gain.linearRampToValueAtTime(0.0001, t + len); g.connect(music); osc(wave, mtof(m), t, t + len + 0.01, g); }
  // the Chinese battle: a pipa (a bright plucked lute; trem: its fast tremolo, re-plucked 16 times a second) and a wah
  // guitar's chop
  function pipa(m, t, v = 1, len = 0.2, trem = false) {
    const f = mtof(m), bp = filt('bandpass', f * 3.5, 1.3), g = ac.createGain(), end = t + len + 0.1;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07 * v, t + 0.0015);
    if (trem) { g.gain.linearRampToValueAtTime(0.05 * v, t + len * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.05); } else g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.12, len));
    let into = g;
    if (trem) { const am = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(); am.gain.value = 0.5; lfo.type = 'sawtooth'; lfo.frequency.value = 16; lg.gain.value = -0.5; lfo.connect(lg); lg.connect(am.gain); am.connect(g); into = am; lfo.start(t); lfo.stop(end); }
    bp.connect(into); g.connect(music); osc('sawtooth', f, t, end, bp); osc('square', f * 1.004, t, end, bp);
  }
  function wahgtr(notes, t, v = 1, len = 0.14) {
    const bp = filt('bandpass', 500, 4), g = ac.createGain(), end = t + len + 0.05;
    bp.frequency.setValueAtTime(450, t); bp.frequency.exponentialRampToValueAtTime(2400, t + len * 0.6); bp.frequency.exponentialRampToValueAtTime(900, t + len);
    env(g, t, 0.05 * v, 0.003, len); bp.connect(g); g.connect(music); notes.forEach((m, k) => osc('sawtooth', mtof(m), t + k * 0.004, end, bp));
  }
  // the Japanese battle: an 80s poly-synth brass stab (detuned saws, the filter swelling open; LEADS.sax is its sax)
  function polybrass(notes, t, len, v = 1) {
    const lp = filt('lowpass', 600, 1.5), g = ac.createGain(), end = t + len + 0.1;
    lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(3200, t + 0.05); lp.frequency.exponentialRampToValueAtTime(1300, t + Math.max(0.1, len));
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.022 * v, t + 0.02); g.gain.linearRampToValueAtTime(0.02 * v, t + Math.max(0.03, len - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.06);
    lp.connect(g); g.connect(music); notes.forEach(m => { osc('sawtooth', mtof(m), t, end, lp, -7); osc('sawtooth', mtof(m), t, end, lp, 7); });
  }
  // the school: a felt piano (soft hammers, the highs dulled: lo-fi)
  function felt(m, t, len, v = 1) {
    const f = mtof(m), lp = filt('lowpass', Math.min(2500, f * 4), 0.7), g = ac.createGain(), end = t + len + 0.5;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.04 * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.015 * v, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.45);
    lp.connect(g); g.connect(music); osc('triangle', f, t, end, lp); osc('sine', f * 2, t, end, lp, 3); noise(t, 0.02, 0.008 * v, 'lowpass', 1200, 0.7, music, 0.002);
  }
  // the new leads: a muted trumpet, a flugelhorn, an erhu (bowed, sliding, a deep vibrato), a dizi (a bright flute with
  // its buzz), a shakuhachi (breathy, bending up into its notes)
  Object.assign(LEADS, {
    mute:   { o: [['sawtooth', 1, -4, 0.5], ['sawtooth', 1, 4, 0.4]], lp: [500, 1800, 1050], q: 3, vib: 0.008, g: 0.05, a: 0.03, scoop: -50 },
    flugel: { o: [['sawtooth', 1, -4, 0.42], ['triangle', 1, 4, 0.55]], lp: [420, 1800, 1100], q: 1, vib: 0.01, g: 0.06, a: 0.035, scoop: -40 },
    erhu:   { o: [['sawtooth', 1, -3, 0.5], ['sawtooth', 1, 4, 0.4], ['triangle', 2, 0, 0.08]], lp: [800, 2700, 1900], q: 3.2, vib: 0.022, g: 0.048, a: 0.06, scoop: -60, glide: 0.09 },
    dizi:   { o: [['sine', 1, 0, 0.75], ['sawtooth', 1, 0, 0.06], ['triangle', 2, 0, 0.1]], lp: [2600, 5000, 3300], q: 1.2, vib: 0.014, g: 0.062, a: 0.03, breath: 0.03, scoop: -45 },
    shaku:  { o: [['sine', 1, 0, 0.85], ['triangle', 1, 0, 0.2]], lp: [1400, 2300, 1500], q: 0.8, vib: 0.012, g: 0.07, a: 0.09, breath: 0.06, scoop: -110 },
    // a blues harmonica (reedy, breathy, bending up into its notes), a dub melodica (a reed, plainer), a recorder (sweet, a
    // breathy chiff), the chip lead (the thin 12.5% pulse, no filter), a city-pop sax (scooped, breathy, a vocal peak)
    harp:     { o: [['pulse', 1, 0, 0.6], ['sawtooth', 1, 6, 0.25]], lp: [900, 2600, 1500], q: 2.5, vib: 0.018, g: 0.055, a: 0.02, breath: 0.035, scoop: -90 },
    melodica: { o: [['pulse', 1, 0, 0.5], ['sawtooth', 1, 7, 0.3]], lp: [1200, 2400, 1800], q: 1.2, vib: 0.006, g: 0.045, a: 0.025, breath: 0.02 },
    recorder: { o: [['triangle', 1, 0, 0.8], ['sine', 2, 0, 0.12], ['sine', 3, 0, 0.06]], lp: [3000, 4500, 3200], q: 0.7, vib: 0.004, g: 0.065, a: 0.015, breath: 0.04 },
    chip:     { o: [['pulse8', 1, 0, 0.7]], lp: [12000, 12000, 12000], q: 0.5, vib: 0.012, g: 0.038, a: 0.002 },
    sax:      { o: [['sawtooth', 1, 0, 0.55], ['square', 1, 5, 0.25]], lp: [700, 2600, 1600], q: 2.2, vib: 0.014, g: 0.055, a: 0.035, breath: 0.03, scoop: -60 },
  });
  // ------------------------------------------------------------ the songs: each with its own groove and meter, its own instruments,
  // its own written bass line, form, key and mix (S.tone: a song's own tone filter; see the mixer)
  // The miners' camp (caves.js): a work-song shuffle (12/8, a shuffle at 100, E blues). No drum kit: a stomp on the boards on
  // one and three, a handclap on two and four, a thimble on a washboard, the hammer ringing on the anvil, a pick chipping;
  // a washtub bass walking the boogie, a banjo rolling, a blues harmonica singing the tune and Pío the canary trilling back
  // between its lines. Dry and close. A one-bar stomp-clap intro, then a 12-bar blues twice round (E7 E7 E7 E7 A7 A7 E7 E7
  // B7 A7 E7 B7): first the harmonica sings; then the banjo takes the tune over the harmonica's chugging "train" chords.
  // (Its grid is triplets: 12 steps a bar; bpm 75 here = a shuffle at 100.)
  SONGS.quarry = { bpm: 75, len: 300, from: 12, swing: 0, vol: 0.32, verb: 0.04, echo: 0, echoSteps: 3,
    D: (() => {
      const E7 = 'E2: G#3 B3 D4', A7 = 'A1: G3 C#4 E4', B7 = 'B1: A3 D#4 F#4';
      const C = CH([E7, E7, E7, E7, A7, A7, E7, E7, B7, A7, E7, B7].join(','));
      // the harmonica's tune (the first time round) and the banjo's (the second); 12 steps a bar, '/2 /1' a shuffled pair
      const H = mel('B4/2 D5/1 E5/3 G5/2 G#5/1 E5/3 | D5/2 B4/1 E5/9 | r/12 | r/9 B4/2 D5/1 |' +
        'E5/2 G5/1 A5/3 C6/2 C#6/1 A5/3 | G5/2 E5/1 A5/9 | r/12 | r/9 G#5/2 A5/1 |' +
        'B5/3 A5/2 F#5/1 D#5/3 F#5/3 | A5/3 G5/2 E5/1 C#5/3 E5/3 | G5/2 G#5/1 E5/9 | r/6 F#5/2 A5/1 B5/3');
      const BJ = mel('E5/1 G#5/1 B5/1 E6/2 D6/1 B5/2 G#5/1 B5/3 | D6/2 B5/1 G#5/2 E5/1 G5/2 G#5/1 B5/3 | E6/3 r/9 | r/6 B5/2 D6/1 E6/3 |' +
        'A5/1 C#6/1 E6/1 A6/2 G6/1 E6/2 C#6/1 E6/3 | G6/2 E6/1 C#6/2 A5/1 C6/2 C#6/1 E6/3 | B5/3 r/9 | r/6 G#5/2 A5/1 B5/3 |' +
        'B5/1 D#6/1 F#6/1 A6/3 F#6/2 D#6/1 B5/3 | A5/1 C#6/1 E6/1 G6/3 E6/2 C#6/1 A5/3 | G#5/2 B5/1 E6/9 | D#6/2 F#6/1 A6/3 F#6/2 D#6/1 B5/3');
      // Pío's answers by bar of the chorus: [step, note, other note, chirps]; BIRD2 joins the second time round
      const BIRD = { 2: [[1, 97, 100, 7], [6, 93, 97, 2], [9, 100, 105, 2]], 6: [[1, 100, 102, 7], [6, 97, 100, 2], [9, 105, 100, 2]], 10: [[6, 97, 100, 6]] };
      const BIRD2 = { 3: [[0, 100, 102, 9], [6, 97, 100, 3]], 7: [[0, 102, 105, 9], [6, 100, 97, 3]] };
      return { C, H, BJ, BIRD, BIRD2,
        // the washtub's boogie in shuffled eighths: [step, interval, level]
        TUB: [[0, 0, 1], [2, 0, 0.45], [3, 4, 0.8], [5, 7, 0.6], [6, 9, 0.9], [8, 7, 0.5], [9, 10, 0.8], [11, 9, 0.55]],
        ROLL: [0, 2, 3, 5, 6, 8, 9, 11], RI: [1, 2, 3, 2, 1, 3, 2, 3] };
    })(),
    play(i, t, s16) {
      const D = this.D;
      if (i < 12) {   // the intro: the stomp-clap alone, the harmonica's train chord coming in
        if (!(i % 6)) stomp(t, 0.9); if (i % 6 === 3) hclap(t, 0.9); if (i % 3 !== 1) board(t, i % 3 ? 0.4 : 0.7);
        if (i === 6) harpchord([56, 59, 62], t, 5 * s16, 0.8);
        if (i === 11) tub(40, t, s16, 0.5);
        return;
      }
      const j = i - 12, bar = (j / 12) | 0, s = j % 12, b = bar % 12, two = bar >= 12, C = D.C[b], R = C[0];
      if (s === 0 || s === 6) stomp(t, s ? 0.8 : 1);
      if (s === 3 || s === 9) hclap(t, s === 9 ? 1 : 0.85);
      if (s % 3 !== 1) board(t, s % 3 ? 0.45 : 0.75);
      if (s === 9 && (two || (b & 1))) anvil(t, 0.7);
      if (two && s === 5) chip(t, 0.6);
      if (s === 0 && b === 0) shovel(t, 4 * s16, 0.6);
      for (const [st, iv, v] of D.TUB) if (st === s) tub(R + iv, t, (st % 3 === 2 ? 1 : 2) * s16, v);
      const r = D.ROLL.indexOf(s);
      if (r >= 0) { if (two) harpchord(C.slice(1).map(m => m + 12), t, (s % 3 === 2 ? 1 : 1.6) * s16, s % 3 ? 0.55 : 0.9); else banjo(C[D.RI[r]] + 12, t, s % 3 ? 0.3 : 0.45); }
      const n = (two ? D.BJ : D.H)[j % 144];
      if (n) {
        if (!two) lead(n[0], t, n[1] * s16, 'harp', 0.95);
        else { banjo(n[0], t, 0.95); for (let k = 1; k < n[1] / 2; k++) banjo(n[0], t + 2 * k * s16, 0.5 - 0.06 * k); }   // (a banjo holds a long note by rolling it)
      }
      for (const Bd of [D.BIRD[b], two && D.BIRD2[b]]) if (Bd) for (const [st, m, m2, k] of Bd) if (st === s) canary(m, m2, t, k, 0.9);
    } };
  // Inside the mine (mine.js): dark trip-hop (90 bpm, half-time: the snare is a struck pipe on beat three; C# minor). A deep
  // sub bass sliding between its notes, a soft thud of a kick, clinks and chains of metal, drips falling in time, echo bats'
  // sonar in the B half, a dark pad breathing in and out, and a twangy tremolo guitar (a western down a mine shaft) whose
  // notes the tunnels throw back. Wet and far. Intro 2 bars (the sub and the drips) · A 8 · B 8.
  // A: C#m9 C#m9 Amaj7 Amaj7 F#m9 F#m9 Dmaj7#11 G#7b9 · B: Amaj7 G#m7 F#m9 E/G# Amaj7 G#m7 Dmaj7#11 G#7b9
  SONGS.mine = { bpm: 90, len: 288, from: 32, swing: 0.12, vol: 0.25, verb: 0.32, echo: 0.42, echoSteps: 6, tone: 5200,
    D: (() => {
      const Cm = 'C#2: E3 G#3 B3 D#4', A = 'A1: E3 G#3 C#4', F = 'F#1: A3 C#4 E4 G#4', Dl = 'D2: F#3 A3 C#4 G#4', G7 = 'G#1: F#3 C4 D#4 A4', Gm = 'G#1: F#3 B3 D#4', EG = 'G#1: E3 G#3 B3';
      const C = CH([Cm, Cm, Cm, Cm, A, A, F, F, Dl, G7, A, Gm, F, EG, A, Gm, Dl, G7].join(','));
      const SUB = mel('C#2/16 | C#2/12 G#1/4 |' +
        'C#2/10 E2/2 F#2/4 | G#1/8 B1/4 C#2/4 | A1/12 C#2/2 B1/2 | A1/8 E1/4 G#1/4 | F#1/10 A1/2 C#2/4 | E2/8 C#2/4 A1/4 | D2/12 C#2/2 D2/2 | G#1/8 A1/2 G#1/2 G1/2 G#1/2 |' +
        'A1/8 C#2/4 E2/4 | G#1/8 B1/4 D#2/4 | F#1/8 A1/4 C#2/4 | G#1/8 E2/4 B1/4 | A1/12 B1/2 C#2/2 | G#1/12 F#1/2 G#1/2 | D2/16 | G#1/8 r/4 G#1/2 G#1/2');
      const L = mel('r/16 | r/16 |' +
        'r/4 G#4/2 C#5/2 E5/6 D#5/2 | C#5/12 r/4 | r/4 E5/2 A5/2 G#5/6 E5/2 | C#5/8 B4/4 C#5/4 | r/4 A4/2 C#5/2 F#5/6 E5/2 | G#5/8 E5/4 C#5/4 | D5/6 E5/2 F#5/4 G#5/4 | A5/6 G#5/2 F#5/4 C5/4 |' +
        'E5/6 G#5/2 C#6/8 | B5/6 A#5/2 F#5/8 | A5/6 C#6/2 G#5/8 | B5/8 E5/8 | C#6/4 B5/4 G#5/4 E5/4 | D#5/6 F#5/2 B5/8 | A5/4 G#5/4 F#5/4 D5/4 | C5/6 D#5/2 F#5/4 A5/4');
      return { C, L, SUB, K0: pat('x.........x.....'), K1: pat('x......x..x.....'),
        DRIP: [[3, 92], [7, 85], [11, 95], [13, 88]], DRIP2: [[1, 97], [6, 90], [10, 88], [15, 92]], PENT: [85, 88, 90, 92, 95, 97] };
    })(),
    play(i, t, s16) {
      const D = this.D, bar = i >> 4, s = i & 15, B = bar >= 10, intro = bar < 2, C = D.C[bar];
      if (!intro) {
        if ((bar & 1 ? D.K1 : D.K0)[s]) thud(t, 0.9);
        if (s === 8) { pipe(t, 420, 0.9); noise(t, 0.12, 0.08, 'bandpass', 1800, 0.8, music, 0.002); }
        if (!(s & 1)) clink(t, s & 2 ? 0.8 : 0.4);
        if ((bar & 1) && s === 13) chain(t, 0.8);
      }
      if (s === 0) for (let k = 1; k < C.length; k++) darkpad(C[k], t, 18 * s16, 0.9);     // (it swells every bar: breathing)
      const sb = D.SUB[i]; if (sb) subglide(sb[0], t, sb[1] * s16 * 0.95, 1);
      for (const [st, m] of (bar & 1 ? D.DRIP2 : D.DRIP)) if (st === s) drip(m, t, intro ? 0.9 : 0.7);
      if (Math.random() < 0.03) drip(D.PENT[(Math.random() * 6) | 0], t, 0.35);
      if (B && (bar & 1) && (s === 4 || s === 5)) sonar(s === 4 ? 100 : 95, t, 0.9);
      const n = D.L[i]; if (n) tremgtr(n[0], t, n[1] * s16, 0.9);
    } };
  // Inside the old lighthouse (isle.js): dub (68 bpm, the reggae "one drop": kick and sidestick together on beat three
  // only; G dorian). A deep round dub bass, a nylon skank on two and four, an organ bubbling on the offbeats, a melodica
  // singing the tune (the B half: a vibraphone), dub echoes thrown off it, the sea washing in, the lighthouse's beam sweeping
  // past once a bar, a foghorn far off. Misty. A 8 · B 8 · a 4-bar dub break (drums, bass and echoes alone).
  // A: Gm7 C9 Gm7 C9 Gm7 C9 Ebmaj7 D7 · B: Cm9 F13 Bbmaj7 Ebmaj7 Am7b5 D7b9 Gm7 D7#9 · break: Gm7 Gm7 C9 C9
  SONGS.isle = { bpm: 68, len: 320, swing: 0.22, vol: 0.26, verb: 0.18, echo: 0.44, echoSteps: 3, tone: 5600,
    D: (() => {
      const Gm = 'G2: Bb3 D4 F4', C9 = 'C2: E3 Bb3 D4', Eb = 'Eb2: G3 Bb3 D4', D7 = 'D2: F#3 A3 C4';
      const C = CH([Gm, C9, Gm, C9, Gm, C9, Eb, D7, 'C2: Eb3 G3 Bb3 D4', 'F1: Eb3 A3 D4', 'Bb1: A3 D4 F4', Eb, 'A1: G3 C4 Eb4', 'D2: F#3 C4 Eb4', Gm, 'D2: F#3 C4 F4', Gm, Gm, C9, C9].join(','));
      const BASS = mel('G1/6 r/2 Bb1/2 D2/2 F2/2 D2/2 | C2/6 r/2 E2/2 G2/2 Bb1/4 | G1/6 r/2 D2/2 G2/2 F2/2 D2/2 | C2/4 r/4 G1/2 C2/2 Bb1/2 A1/2 |' +
        'G1/6 r/2 Bb1/2 D2/2 F2/2 D2/2 | C2/6 r/2 E2/2 G2/2 Bb2/2 G2/2 | Eb2/6 r/2 G2/2 Bb2/2 D2/4 | D2/6 r/2 F#1/2 A1/2 C2/2 D2/2 |' +
        'C2/6 r/2 Eb2/2 G2/2 Bb1/4 | F1/6 r/2 A1/2 C2/2 Eb2/4 | Bb1/6 r/2 D2/2 F2/2 A1/4 | Eb2/6 r/2 G2/2 Bb2/2 G2/4 |' +
        'A1/6 r/2 C2/2 Eb2/2 G2/4 | D2/6 r/2 F#2/2 A2/2 C2/4 | G1/6 r/2 Bb1/2 D2/2 F2/4 | D2/8 A1/4 F#1/4 |' +
        'G1/6 r/2 G1/2 Bb1/2 D2/4 | G1/16 | C2/6 r/2 C2/2 E2/2 G2/4 | C2/8 Bb1/4 A1/4');
      const L = mel('r/4 D5/2 F5/2 G5/6 F5/2 | E5/6 D5/2 C5/8 | r/4 Bb5/2 A5/2 G5/4 F5/4 | G5/12 r/4 |' +
        'r/4 D6/2 C6/2 Bb5/6 A5/2 | G5/6 E5/2 D5/8 | r/4 G5/2 Bb5/2 D6/6 C6/2 | A5/8 F#5/4 D5/4 |' +
        'G5/6 Bb5/2 D6/8 | C6/6 A5/2 D6/8 | F5/6 A5/2 D6/8 | Bb5/6 G5/2 D5/8 |' +
        'C6/6 Eb6/2 G5/8 | F#5/6 A5/2 Eb6/8 | D6/6 Bb5/2 G5/8 | F6/6 C6/2 A5/8 |' +
        'r/4 D5/2 r/10 | r/16 | r/4 G5/2 r/10 | r/16');
      return { C, BASS, L };
    })(),
    play(i, t, s16) {
      const D = this.D, bar = i >> 4, s = i & 15, B = bar >= 8 && bar < 16, brk = bar >= 16, C = D.C[bar];
      if (s === 8) { dubkick(t, 1); sidestick(t, 0.9); }          // the one drop
      if (!(s & 1)) dubhat(t, s & 2 ? 0.55 : 0.3, s === 14 && (bar & 1) === 1);
      if (brk && s === 12 && (bar & 1)) sidestick(t, 0.5);
      if (!brk && (s === 4 || s === 12)) skank(C.slice(1).map(m => m + 12), t, 0.9);
      if (!brk && (s & 3) >= 2) for (let k = 1; k < C.length; k++) organ(C[k], t, s16 * 0.9, s & 1 ? 0.55 : 0.8);
      if (s === 0 && !(bar & 1)) wave(t, 30 * s16, 0.9);
      if (s === 0) beam(50, t, 13 * s16, 0.8);                    // (D: it sits in every chord here)
      if (s === 0 && (bar === 0 || bar === 16)) foghorn(43, t, 12 * s16, 0.7);
      const b = D.BASS[i]; if (b) dub(b[0], t, b[1] * s16 * 0.95, 1);
      const n = D.L[i]; if (n) { if (B) vibe(n[0], t, Math.max(0.8, n[1] * s16 * 1.2), 1); else lead(n[0], t, n[1] * s16, 'melodica', 0.85); }
      if (Math.random() < 0.035) drop(t, 0.5);
    } };
  // The Bloom Gardens (gardens.js): sunny Motown-style pop-funk (126 bpm, straight eighths, Bb major). A tight pop kick, a
  // stack of claps and a tambourine on two and four, a bouncing finger bass with little chromatic steps, a ukulele strumming,
  // a recorder singing the verse, a steel pan joining it for the chorus, and a picky bee zipping through the gaps (then a
  // whole bee break). Bright and dry. Intro 2 (the ukulele) · verse 8 · chorus 8 · bee break 2.
  // Verse: Bb6 Gm7 Cm7 F9 Bb6 Gm7 Eb6 F9 · chorus: Ebmaj7 D7 Gm7 C9 Cm7 F9 Bb6 F7sus · break: Bb6 F7sus
  SONGS.gardens = { bpm: 126, len: 320, from: 32, swing: 0.04, vol: 0.36, verb: 0.07, echo: 0.06, echoSteps: 3,
    D: (() => {
      const Bb = 'Bb1: D4 F4 G4 Bb4', Gm = 'G1: D4 F4 G4 Bb4', Cm = 'C2: Eb4 G4 Bb4 C5', F9 = 'F1: Eb4 G4 A4 C5', Fs = 'F1: Eb4 F4 Bb4 C5';
      const C = CH([Bb, F9, Bb, Gm, Cm, F9, Bb, Gm, 'Eb2: Eb4 G4 Bb4 C5', F9, 'Eb2: Eb4 G4 Bb4 D5', 'D2: D4 F#4 A4 C5', Gm, 'C2: E4 G4 Bb4 D5', Cm, F9, Bb, Fs, Bb, Fs].join(','));
      const BASS = mel('Bb1/2 r/2 Bb1/2 D2/2 F2/2 r/2 F2/2 A1/2 | F2/2 r/2 F2/2 A2/2 C3/2 r/2 E2/2 A1/2 |' +
        'Bb1/2 r/2 Bb1/2 D2/2 F2/2 G2/2 F2/2 D2/2 | G1/2 r/2 G1/2 Bb1/2 D2/2 F2/2 D2/2 Bb1/2 | C2/2 r/2 C2/2 Eb2/2 G2/2 Bb2/2 G2/2 E2/2 | F2/2 r/2 F2/2 A2/2 C3/2 A2/2 F2/2 B1/2 |' +
        'Bb1/2 r/2 Bb1/2 D2/2 F2/2 G2/2 F2/2 D2/2 | G1/2 r/2 G1/2 Bb1/2 D2/2 F2/2 D2/2 Bb1/2 | Eb2/2 r/2 Eb2/2 G2/2 Bb2/2 C3/2 Bb2/2 G2/2 | F2/2 r/2 F2/2 A2/2 C3/2 A2/2 F2/2 E2/2 |' +
        'Eb2/2 r/2 Eb2/2 G2/2 Bb2/2 G2/2 Eb2/2 C#2/2 | D2/2 r/2 D2/2 F#2/2 A2/2 C3/2 A2/2 F#2/2 | G1/2 r/2 G1/2 Bb1/2 D2/2 F2/2 D2/2 B1/2 | C2/2 r/2 C2/2 E2/2 G2/2 Bb2/2 G2/2 Eb2/2 |' +
        'C2/2 r/2 C2/2 Eb2/2 G2/2 Bb2/2 G2/2 E2/2 | F2/2 r/2 F2/2 A2/2 C3/2 A2/2 F2/2 A1/2 | Bb1/2 r/2 Bb1/2 D2/2 F2/2 G2/2 F2/2 D2/2 | F2/4 C2/2 Eb2/2 F2/4 A1/4 |' +
        'Bb1/4 r/4 Bb1/2 r/6 | F2/4 r/4 F2/2 Eb2/2 E2/2 A1/2');
      const L = mel('r/16 | r/16 |' +
        'r/2 F5/2 G5/2 Bb5/2 D6/4 C6/2 Bb5/2 | G5/4 F5/2 D5/2 F5/8 | r/2 G5/2 Bb5/2 C6/2 Eb6/4 D6/2 C6/2 | A5/4 G5/2 F5/2 r/8 |' +
        'r/2 F5/2 G5/2 Bb5/2 D6/4 F6/2 D6/2 | F6/4 D6/2 Bb5/2 G5/8 | r/2 G5/2 Bb5/2 C6/2 Eb6/4 G6/2 F6/2 | Eb6/4 C6/2 A5/2 r/8 |' +
        'Bb5/3 G5/1 Bb5/2 D6/2 r/2 C6/2 Bb5/2 G5/2 | A5/3 F#5/1 A5/2 C6/2 r/2 A5/2 F#5/4 | Bb5/3 G5/1 Bb5/2 D6/2 r/2 F6/2 D6/2 Bb5/2 | C6/3 Bb5/1 G5/2 E5/2 r/2 G5/2 Bb5/4 |' +
        'Eb6/3 D6/1 C6/2 Bb5/2 r/2 G5/2 Bb5/2 C6/2 | D6/3 C6/1 A5/2 F5/2 r/2 G5/2 A5/4 | Bb5/2 D6/2 F6/2 G6/2 F6/4 D6/4 | Eb6/4 C6/4 r/8 |' +
        'r/16 | r/16');
      // the bee, by bar: [step, from, to, sixteenths] (the last two bars are its own break)
      const BEE = { 5: [[8, 72, 79, 2], [10, 79, 77, 1], [11, 77, 81, 1], [12, 81, 79, 2], [14, 84, 82, 2]], 9: [[8, 79, 84, 2], [10, 84, 81, 1], [11, 82, 79, 1], [12, 77, 79, 2], [14, 82, 72, 2]],
        17: [[8, 84, 79, 2], [10, 77, 82, 2], [12, 84, 86, 2], [14, 87, 84, 2]],
        18: [[0, 70, 82, 4], [4, 82, 77, 2], [6, 79, 84, 2], [8, 86, 74, 4], [12, 77, 81, 2], [14, 82, 86, 2]],
        19: [[0, 87, 84, 2], [2, 82, 79, 2], [4, 77, 84, 3], [7, 86, 89, 1], [8, 89, 77, 6], [14, 81, 82, 2]] };
      return { C, BASS, L, BEE, K0: pat('x.......x.......'), K1: pat('x.......x.....x.'), UKE: { 0: 0, 4: 0, 6: 1, 10: 1, 12: 0, 14: 1 } };
    })(),
    play(i, t, s16) {
      const D = this.D, bar = i >> 4, s = i & 15, intro = bar < 2, chorus = bar >= 10 && bar < 18, C = D.C[bar];
      if (!intro) {
        if ((bar & 1 ? D.K1 : D.K0)[s]) popkick(t, 0.9);
        if (s === 4 || s === 12) { claps(t, chorus ? 1 : 0.8); tamb(t, 0.9, true); }
      }
      if ((s & 3) === 2) tamb(t, intro ? 0.5 : 0.8); else if ((s & 1) && !intro) tamb(t, 0.35);
      const u = D.UKE[s]; if (u !== undefined) uke(C.slice(1), t, u ? 0.7 : 1, !!u);
      const b = D.BASS[i]; if (b && bar >= 1) fbass(b[0], t, b[1] * s16 * 0.9, 1);
      const n = D.L[i]; if (n) { lead(n[0], t, n[1] * s16, 'recorder', 0.85); if (chorus) pan(n[0], t, 0.9, Math.max(0.5, n[1] * s16 * 1.4)); }
      const z = D.BEE[bar]; if (z) for (const [st, a, e, l] of z) if (st === s) bee(a, e, t, l * s16, 0.9);
    } };
  // Inside the great greenhouse (greenhouse.js): a lush jazz waltz (3/4 at 116, swung; Db major). A soft felt kick on one,
  // a brush swirling round the snare with taps on two and three, a fretless bass sliding into each bar, warm string pads,
  // a kalimba singing the tune and rippling in between, drips and the misters' hiss. Wet and close, the highs softened.
  // AABA, 8 bars each: A: Dbmaj9 Bbm9 Ebm9 Ab13 Dbmaj9 Gbmaj7#11 Ebm9 Ab7sus (the second A ends Ab7) · B: Gbmaj9 Fm7 Ebm9
  // Dbmaj9 Cm7b5 F7b9 Bbm9 Ab7sus. (Its grid is triplets: 9 steps a bar; bpm 87 here = 116 in 3/4.)
  SONGS.greenhouse = { bpm: 87, len: 288, swing: 0, vol: 0.34, verb: 0.3, echo: 0.12, echoSteps: 3, tone: 9000,
    D: (() => {
      const Db = 'Db2: F3 Ab3 C4 Eb4', Bbm = 'Bb1: Db3 F3 Ab3 C4', Ebm = 'Eb2: Gb3 Bb3 Db4 F4', Ab13 = 'Ab1: Gb3 C4 F4', Gb = 'Gb1: F3 Bb3 C4 Db4', Abs = 'Ab1: Gb3 Db4 Eb4', Ab7 = 'Ab1: Gb3 C4 Eb4';
      const A1 = [Db, Bbm, Ebm, Ab13, Db, Gb, Ebm, Abs], A2 = [Db, Bbm, Ebm, Ab13, Db, Gb, Ebm, Ab7];
      const C = CH([...A1, ...A2, 'Gb1: F3 Bb3 Db4 Ab4', 'F1: Eb3 Ab3 C4', Ebm, Db, 'C2: Eb3 Gb3 Bb3', 'F1: Eb3 A3 Gb4', Bbm, Abs, ...A2].join(','));
      const bA1 = 'Db2/6 Ab1/3 | Bb1/6 F2/3 | Eb2/6 Bb1/3 | Ab1/6 Eb2/3 | Db2/6 Ab1/3 | Gb1/6 Db2/3 | Eb2/6 Bb1/3 | Ab1/6 Ab1/3 |';
      const bA2 = 'Db2/6 Ab1/3 | Bb1/6 F2/3 | Eb2/6 Bb1/3 | Ab1/6 Eb2/3 | Db2/6 Ab1/3 | Gb1/6 Db2/3 | Eb2/6 Bb1/3 | Ab1/6 C2/3 |';
      const BASS = mel(bA1 + bA2 + 'Gb1/6 Db2/3 | F2/6 C2/3 | Eb2/6 Bb1/3 | Db2/6 Ab1/3 | C2/6 Gb1/3 | F2/6 C2/3 | Bb1/6 F2/3 | Ab1/6 Eb2/3 |' + bA2);
      const mA = 'Ab5/3 F5/2 Ab5/1 C6/3 | Db6/6 C6/3 | Bb5/3 Gb5/2 Bb5/1 Db6/3 | F6/6 Eb6/3 | C6/3 Ab5/2 F5/1 Eb5/3 | F5/2 Gb5/1 Bb5/3 C6/3 |';
      const L = mel(mA + 'Db6/3 Bb5/2 Gb5/1 F5/3 | Eb5/9 |' + mA + 'Db6/3 Bb5/2 Gb5/1 F5/3 | C5/3 Eb5/3 Ab5/3 |' +
        'Db6/3 F6/3 Ab6/3 | Ab6/6 Eb6/3 | Gb6/3 F6/2 Db6/1 Bb5/3 | C6/6 Ab5/3 | Gb5/3 Bb5/2 Eb6/1 Gb6/3 | A5/3 Eb6/2 Gb6/1 F6/3 | Db6/6 C6/3 | Bb5/3 Ab5/3 Gb5/3 |' +
        mA + 'Db6/3 Bb5/2 Gb5/1 F5/3 | C5/3 Eb5/3 Ab5/3');
      return { C, BASS, L };
    })(),
    play(i, t, s16) {
      const D = this.D, bar = (i / 9) | 0, s = i % 9, B = bar >= 16 && bar < 24, C = D.C[bar];
      if (s === 0) { feltkick(t, 0.9); swirl(t, 9 * s16, 0.9); for (let k = 1; k < C.length; k++) warmpad(C[k], t, 10 * s16, B ? 1.1 : 0.9); }
      if (s === 3 || s === 6) brush(t, s === 3 ? 0.9 : 0.6, 0.12);
      if (s === 0 && bar % 8 === 0) noise(t, 7 * s16, 0.02, 'highpass', 5200, 0.7, music, 2 * s16);      // the misters: psshh
      const b = D.BASS[i]; if (b) fretless(b[0], t, b[1] * s16, 1);
      const n = D.L[i]; if (n) kalimba(n[0], t, 1, Math.max(0.6, n[1] * s16 * 1.5));
      else if (s === 5 || s === 8) kalimba(C[1 + ((bar + s) % (C.length - 1))] + 12, t, 0.32, 0.6);    // (the ripple in between)
      if (Math.random() < 0.06) drop(t, 0.55);
    } };
  // Escarcha and the Frost Pass (peaks.js): cozy jazz swing (150 bpm, a ride cymbal's "ding, ding-a ding"; Eb major). The
  // hi-hat's foot and sleigh bells on two and four, a bass drum feathered on every beat, a pizzicato upright walking, the
  // violins plucking the chords in the Charleston rhythm, a celesta singing the tune, handbells ringing over the bridge.
  // A medium room. Intro 2 (sleigh bells, handbells) · AABA, 8 bars each: A: Ebmaj7 Cm7 Fm7 Bb7 Gm7 C7b9 Fm7 Bb7 (the
  // second A ends Bb7 Eb6) · B: Abmaj7 Abm6 Gm7 C7 Fm7 Bb7 Ebmaj7 Bb7sus. The first A walks in two, then it all walks in four.
  // (Its grid is triplets: 12 steps a bar; bpm 112.5 here = a swing at 150.)
  SONGS.peaks = { bpm: 112.5, len: 408, from: 24, swing: 0, vol: 0.62, verb: 0.14, echo: 0, echoSteps: 3, tone: 11000,
    D: (() => {
      const Eb = 'Eb2: G3 Bb3 D4', Cm = 'C2: Eb3 G3 Bb3', Fm = 'F2: Ab3 C4 Eb4', Bb7 = 'Bb1: Ab3 D4 F4', Gm = 'G1: F3 Bb3 D4', C7b9 = 'C2: E3 Bb3 Db4', Bbs = 'Bb1: Ab3 Eb4 F4';
      const A1 = [Eb, Cm, Fm, Bb7, Gm, C7b9, Fm, Bb7], A2 = [Eb, Cm, Fm, Bb7, Gm, C7b9, Bb7, 'Eb2: G3 Bb3 C4'];
      const C = CH([Eb, Bbs, ...A1, ...A2, 'Ab1: G3 C4 Eb4', 'Ab1: F3 B3 Eb4', Gm, 'C2: E3 Bb3 D4', Fm, Bb7, Eb, Bbs, ...A1].join(','));
      const wA = 'Eb2/3 F2/3 G2/3 Bb2/3 | C3/3 Bb2/3 G2/3 Eb2/3 | F2/3 G2/3 Ab2/3 A2/3 | Bb2/3 Ab2/3 F2/3 D2/3 | G2/3 F2/3 D2/3 Bb1/3 | C2/3 E2/3 G2/3 Bb2/3 |';
      const BASS = mel('r/12 | r/12 |' + 'Eb2/6 Bb1/6 | C2/6 G1/6 | F2/6 C2/6 | Bb1/6 D2/6 | G1/6 D2/6 | C2/6 E2/6 | F2/6 C2/6 | Bb1/6 D2/6 |' +
        wA + 'Bb1/3 D2/3 F2/3 D2/3 | Eb2/3 G2/3 Bb2/3 G2/3 |' +
        'Ab2/3 G2/3 Eb2/3 C2/3 | Ab2/3 F2/3 Eb2/3 B1/3 | Bb1/3 D2/3 F2/3 G2/3 | C2/3 E2/3 G2/3 Bb2/3 | F2/3 Ab2/3 C3/3 B2/3 | Bb2/3 F2/3 D2/3 F2/3 | Eb2/3 G2/3 Bb2/3 C3/3 | Bb2/3 Ab2/3 F2/3 D2/3 |' +
        wA + 'F2/3 Ab2/3 C3/3 B2/3 | Bb2/3 F2/3 D2/3 Bb1/3');
      const mA = 'G5/2 Bb5/1 D6/3 C6/2 Bb5/1 G5/3 | Bb5/6 G5/3 Eb5/3 | Ab5/2 C6/1 Eb6/3 D6/2 C6/1 Ab5/3 | G5/9 r/3 | Bb5/2 D6/1 F6/3 D6/2 C6/1 Bb5/3 | Db6/6 Bb5/3 G5/3 |';
      const L = mel('r/12 | r/6 Bb4/2 C5/1 D5/3 |' + mA + 'Ab5/2 G5/1 F5/3 Eb5/3 C5/3 | D5/9 r/3 |' + mA + 'F5/2 Ab5/1 D6/3 C6/2 Ab5/1 F5/3 | Eb5/9 r/3 |' +
        'C6/3 Eb6/3 G6/6 | F6/3 Eb6/3 B5/6 | Bb5/3 D6/3 F6/6 | E6/3 D6/3 Bb5/6 | Ab5/2 C6/1 Eb6/3 F6/6 | D6/2 C6/1 Bb5/3 Ab5/6 | G5/3 Bb5/3 D6/6 | Eb6/9 r/3 |' +
        mA + 'Ab5/2 G5/1 F5/3 Eb5/3 C5/3 | D5/9 r/3');
      return { C, BASS, L, RIDE: { 0: 1, 3: 0.8, 5: 0.5, 6: 1, 9: 0.8, 11: 0.5 } };
    })(),
    play(i, t, s16) {
      const D = this.D, bar = (i / 12) | 0, s = i % 12, intro = bar < 2, B = bar >= 18 && bar < 26, C = D.C[bar];
      if (intro) {
        if (s === 3 || s === 9) jingle(t, 0.9); else if (s % 3 === 2) jingle(t, 0.35, 0.05);
        if (s === 0) handbell(bar ? 70 : 75, t, 0.8);
      } else {
        const r = D.RIDE[s]; if (r) ride(t, r);
        if (s === 3 || s === 9) { hatfoot(t, 0.9); jingle(t, 0.8); }
        if (!(s % 3)) feather(t, 0.6);
        if (s === 11 && (bar & 1)) brush(t, 0.5, 0.06);
        if (s === 0 || s === 5) for (let k = 1; k < C.length; k++) pizz(C[k] + 12, t, s ? 0.55 : 0.75);    // (the Charleston: one, and the "and" of two)
        if (B && s === 0) handbell(C[1] + 24, t, 0.6);
      }
      const b = D.BASS[i]; if (b) pizz(b[0], t, 1, Math.min(0.5, b[1] * s16 * 1.1));
      const n = D.L[i]; if (n) celesta(n[0], t, 1, Math.max(0.5, n[1] * s16 * 1.4));
    } };
  // Inside the Ice Clock Tower (icetower.js): a chiptune drive (168 bpm, dead straight; A minor): an 8-bit band and a clock.
  // The noise channel's hats and snare, the triangle's kick and its octave-jumping bass, thin 12.5% pulse arpeggios rippling
  // in sixteenths, a chip lead with vibrato, the clock blipping tick and tock on every beat. Eight bars wind the tension up
  // (the bass climbs E F F# G# at the end), then it strikes NOON: A major, real bells ringing out over the chips. Dry, with
  // a short chip echo. Intro 2 (the clock and the arps) · A 8 (A minor) · noon 8 (A major).
  // A: Am Am F G Am Am Dm/F E7 · noon: A C#m D E F#m D Bm7 E7sus
  SONGS.icetower = { bpm: 168, len: 288, from: 32, swing: 0, vol: 0.2, verb: 0.04, echo: 0.18, echoSteps: 3,
    D: (() => {
      // the arps' chord tones by bar (intro 2, A 8, noon 8)
      const Am = [57, 60, 64, 69], F = [53, 57, 60, 65], G = [55, 59, 62, 67], Df = [53, 57, 62, 65], E7 = [52, 56, 59, 62],
        A = [57, 61, 64, 69], Csm = [56, 61, 64, 68], Dj = [54, 57, 62, 66], E = [56, 59, 64, 68], Fsm = [57, 61, 66, 69], Bm = [54, 57, 62, 64], Es = [57, 59, 62, 64];
      const AR = [Am, Am, Am, Am, F, G, Am, Am, Df, E7, A, Csm, Dj, E, Fsm, Dj, Bm, Es];
      const BASS = mel('r/16 | A1/8 r/8 |' +
        'A1/2 A2/2 A1/2 A2/2 A1/2 A2/2 E2/2 G2/2 | A1/2 A2/2 A1/2 A2/2 C2/2 C3/2 B1/2 B2/2 | F1/2 F2/2 F1/2 F2/2 F1/2 F2/2 C2/2 E2/2 | G1/2 G2/2 G1/2 G2/2 G1/2 G2/2 D2/2 F#2/2 |' +
        'A1/2 A2/2 A1/2 A2/2 A1/2 A2/2 E2/2 G2/2 | A1/2 A2/2 A1/2 A2/2 C2/2 C3/2 D2/2 D3/2 | F1/2 F2/2 F1/2 F2/2 D2/2 D3/2 D2/2 D3/2 | E1/2 E2/2 F1/2 F2/2 F#1/2 F#2/2 G#1/2 G#2/2 |' +
        'A1/2 A2/2 A1/2 A2/2 A1/2 A2/2 G#1/2 G#2/2 | C#2/2 C#3/2 C#2/2 C#3/2 C#2/2 C#3/2 B1/2 B2/2 | D2/2 D3/2 D2/2 D3/2 D2/2 D3/2 C#2/2 C#3/2 | E1/2 E2/2 E1/2 E2/2 E1/2 E2/2 D2/2 D3/2 |' +
        'F#1/2 F#2/2 F#1/2 F#2/2 F#1/2 F#2/2 E1/2 E2/2 | D2/2 D3/2 D2/2 D3/2 D2/2 D3/2 E2/2 E3/2 | B1/2 B2/2 B1/2 B2/2 B1/2 B2/2 A1/2 A2/2 | E1/2 E2/2 E1/2 E2/2 E1/2 E2/2 G#1/2 B1/2');
      const L = mel('r/16 | r/16 |' +
        'E5/2 A5/2 C6/2 B5/2 A5/2 E5/2 G5/4 | A5/3 G5/1 E5/2 C5/2 D5/4 E5/4 | F5/2 A5/2 C6/2 E6/2 D6/2 C6/2 A5/4 | B5/3 A5/1 G5/2 D5/2 G5/4 B5/4 |' +
        'E6/2 D6/2 C6/2 B5/2 A5/2 B5/2 C6/4 | D6/3 C6/1 B5/2 A5/2 G5/4 E5/4 | F5/2 A5/2 D6/2 F6/2 E6/2 D6/2 A5/4 | G#5/2 B5/2 D6/2 E6/2 F6/2 E6/2 D6/2 B5/2 |' +
        'C#6/4 E6/4 A6/8 | G#6/3 E6/1 C#6/4 B5/4 C#6/4 | D6/2 F#6/2 A6/4 F#6/4 E6/4 | E6/3 D6/1 B5/4 G#5/4 B5/4 |' +
        'A5/2 C#6/2 F#6/4 E6/4 C#6/4 | D6/2 E6/2 F#6/4 A6/4 F#6/4 | F#6/3 E6/1 D6/4 B5/4 D6/4 | E6/4 D6/4 B5/4 r/4');
      return { AR, BASS, L, ARP: [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 3, 2] };
    })(),
    play(i, t, s16) {
      const D = this.D, bar = i >> 4, s = i & 15, intro = bar < 2, noon = bar >= 10, ch = D.AR[bar];
      if (bar === 10 && s === 0) { bellS(45, t, 0.6); [81, 85, 88].forEach((m, k) => glass(m, t + k * 0.03, 0.8, 2.4)); }     // NOON: the bells
      if (noon && bar !== 10 && s === 0 && !(bar & 1)) glass(ch[3] + 12, t, 0.35, 1.4);
      if (!(s & 3) && !(bar === 10 && s < 8)) chipnote(s & 4 ? 88 : 96, t, 0.03, 0.9, 'square');     // the clock: tick, tock (it holds its breath at noon)
      if (!intro) {
        if (s === 0 || s === 6 || s === 8 || (s === 14 && (bar & 1))) chipkick(t, 1);
        if (s === 4 || s === 12) chipnoise(t, 1, 0.12, 2200);
        if (s & 1) chipnoise(t, s & 2 ? 0.5 : 0.8, 0.025, 9000);
      }
      if (!intro || bar === 1 || s >= 8) chipnote(ch[D.ARP[s]] + 12, t, s16 * 0.9, noon ? 0.75 : 0.6);
      const b = D.BASS[i]; if (b) tribass(b[0], t, b[1] * s16 * 0.92, 1);
      const n = D.L[i]; if (n) lead(n[0], t, n[1] * s16, 'chip', 0.95);
    } };
  // The old tower (the cutaways 'open' and 'end'; main.js cutaway()): the Hush itself, and nothing but a music box (60 bpm,
  // no drums, no band; D minor). It tries to play the title's hook: its worn tines sag flat, notes go missing where the Hush
  // ate them, and in the third bar the box stops dead and a stopped clock gives one tick into the silence (about ten seconds
  // in: under the 'end' cutaway's "a stopped clock gave a single tick"). The box's own low tines give the chords (G C F D,
  // Bb A). Then it tries again, slower and flatter as its spring runs down, and gives up. Very wet and far, highs muffled.
  SONGS.oldtower = { bpm: 60, len: 128, swing: 0, vol: 1.4, verb: 0.42, echo: 0.3, echoSteps: 4, tone: 4200,
    D: (() => {
      // [step, note, how flat (semitones), level]: the tune (the gaps are what the Hush ate: C7 at step 16, and G6 A6 E6
      // after step 39, where the box stops), and the low tines under it ([notes], how flat)
      const BOX = {};
      [[2, 86, 0, 0.9], [3, 89, 0, 0.8], [4, 93, 0.05, 1], [7, 91, 0, 0.7], [8, 89, 0.15, 0.8], [10, 91, 0, 0.8], [12, 93, 0.1, 1],
        [19, 93, 0.1, 0.8], [20, 91, 0.15, 0.75], [22, 88, 0.2, 0.8], [24, 89, 0.4, 0.9],
        [34, 84, 0.1, 0.8], [35, 86, 0.15, 0.75], [36, 88, 0.2, 0.85], [39, 89, 0.3, 0.7],
        [66, 86, 0.1, 0.75], [70, 89, 0.25, 0.7], [74, 93, 0.35, 0.65], [82, 91, 0.5, 0.55], [87, 89, 0.65, 0.45], [100, 88, 0.85, 0.35]]
        .forEach(([s, m, fl, v]) => { BOX[s] = [m, fl, v]; });
      const LOW = { 0: [[55, 62], 0], 16: [[60, 64], 0.05], 32: [[53, 60], 0.1], 48: [[50, 57], 0.15], 64: [[58, 62], 0.2], 96: [[57, 64], 0.5] };
      return { BOX, LOW, TICK: 42 };
    })(),
    play(i, t, s16) {
      const D = this.D, lo = D.LOW[i];
      if (lo) lo[0].forEach((m, k) => mbox(m, t + k * 0.03, 0.55, lo[1], 2.6));
      const b = D.BOX[i]; if (b) mbox(b[0], t + (Math.sin(i * 7.3) + 1) * 0.008, b[2], b[1], 2.2);
      if (i === D.TICK) tick(t, true, 1.3);
    } };
  // (the Chinese and Japanese battle themes are with the other battle and boss themes, further down)
  // The script school (school.js; zh and ja games): lo-fi hip-hop (74 bpm, a lazy boom-bap swing): a dusty kick and snare
  // with the highs rolled off, vinyl crackle, a round synth bass, a felt piano; the second time round the plucked strings
  // take the tune. zh, Teacher Lin's room (D major pentatonic): a C-pop progression (Dmaj9 A/C# Bm9 F#m7 Gmaj9 D/F# Em9
  // A7sus), a guzheng and a dizi-like flute. ja, Mori-sensei's terakoya (C major): the J-pop "royal road" (Fmaj9 G13 Em7 Am9
  // Dm9 G13 Cmaj9 E7sus4b9), a koto and a breathy shakuhachi-like flute. Sound.lang picks one (zh unless it's ja). Dusty
  // and close. Intro 2 (the felt piano alone) · A 8 (the flute) · A' 8 (the strings).
  SONGS.school = { bpm: 74, len: 288, from: 32, swing: 0.32, vol: 0.25, verb: 0.1, echo: 0.16, echoSteps: 3, tone: 3600,
    D: {
      zh: { C: CH('D2: F#3 A3 C#4 E4, C#2: A3 C#4 E4, B1: D3 F#3 A3 C#4, F#1: A3 C#4 E4, G1: F#3 A3 B3 D4, F#1: A3 D4 F#4, E2: G3 B3 D4 F#4, A1: G3 D4 E4'),
        BASS: mel('D2/6 r/2 D2/2 A1/2 D2/4 | C#2/6 r/2 C#2/2 A1/2 C#2/4 | B1/6 r/2 B1/2 F#1/2 B1/4 | F#1/6 r/2 F#1/2 A1/2 C#2/4 | G1/6 r/2 G1/2 D2/2 G1/4 | F#1/6 r/2 F#1/2 A1/2 D2/4 | E2/6 r/2 E2/2 B1/2 E2/4 | A1/6 r/2 A1/2 E2/2 G2/4'),
        L: mel('r/2 A5/2 B5/2 D6/2 E6/6 D6/2 | B5/4 A5/2 F#5/2 E5/8 | r/2 F#5/2 A5/2 B5/2 D6/4 B5/4 | A5/4 F#5/4 E5/8 | r/2 D5/2 E5/2 F#5/2 A5/6 B5/2 | A5/4 F#5/2 E5/2 D5/8 | r/2 E5/2 F#5/2 A5/2 B5/4 D6/2 B5/2 | A5/8 r/8'),
        lead: 'dizi', down: 12 },
      ja: { C: CH('F2: E3 A3 C4 G4, G1: F3 B3 E4 A4, E2: G3 B3 D4, A1: G3 B3 C4 E4, D2: F3 A3 C4 E4, G1: F3 B3 E4 A4, C2: E3 G3 B3 D4, E2: A3 D4 F4 B4'),
        BASS: mel('F1/6 r/2 F1/2 C2/2 F2/4 | G1/6 r/2 G1/2 D2/2 G2/4 | E1/6 r/2 E2/2 B1/2 E2/4 | A1/6 r/2 A1/2 E2/2 G2/4 | D2/6 r/2 D2/2 A1/2 D2/4 | G1/6 r/2 G1/2 D2/2 F2/4 | C2/6 r/2 C2/2 G1/2 C2/4 | E1/6 r/2 E2/2 B1/2 D2/4'),
        L: mel('A5/6 G5/2 E5/8 | D5/4 E5/4 G5/8 | B5/6 A5/2 G5/4 E5/4 | C5/4 B4/4 A4/8 | C6/6 A5/2 F5/8 | E5/4 G5/4 A5/8 | B5/6 G5/2 E5/4 D5/4 | E5/8 r/8'),
        lead: 'shaku', down: 0 },
      K0: pat('x......x..x.....'), K1: pat('x.........x..x..') },
    play(i, t, s16) {
      const D = this.D, V = lang === 'ja' ? D.ja : D.zh, ja = V === D.ja, bar = i >> 4, s = i & 15, intro = bar < 2;
      const ci = intro ? 6 + bar : (bar - 2) & 7, C = V.C[ci], two = bar >= 10, j = ci * 16 + s;
      const pl = (m, len, v) => ja ? koto(m, t, v, len, len > 0.6 && !two ? 1 : 0) : zheng(m, t, v, len, len > 0.6 ? 1 : 0);
      crackle(t, s16, 0.8);
      if (s === 0) for (let k = 1; k < C.length; k++) felt(C[k], t, 8 * s16, 0.8);
      else if (s === 10 && !intro) for (let k = 2; k < C.length; k++) felt(C[k], t, 3 * s16, 0.45);
      if (intro) return;
      if ((bar & 1 ? D.K1 : D.K0)[s]) dustkick(t, 0.9);
      if (s === 4 || s === 12) dustsnare(t, 0.8);
      if (!(s & 1)) dusthat(t, s & 2 ? 0.6 : 0.35);
      const b = V.BASS[j]; if (b) roundbass(b[0], t, b[1] * s16 * 0.9, 1);
      const n = V.L[j];
      if (!two) {      // the strings roll gently under the flute
        if (!(s & 3)) pl(C[1 + (s >> 2) % (C.length - 1)] + 12, 0.45, 0.35);
        if (n) lead(n[0], t, n[1] * s16, V.lead, 0.8);
      } else {         // the strings sing it
        if (s === 0 || s === 8) pl(C[1 + (s >> 3)] + 12, 0.9, 0.3);
        if (n) pl(n[0] - V.down, Math.max(0.4, n[1] * s16), 0.85);
      }
    } };
  // (end of the new areas' songs)

  // ============================================================ the battle and boss themes (2026-11-15)
  // After the playtest's "Add better fighting music and boss themes" (DESIGN 16): a new battle theme for each language
  // ('battle_es' … 'battle_ja', what 'battle' plays) and a boss theme for each ('boss_es' … 'boss_ja'; main.js plays it while
  // BATTLE.boss() says a boss fight is on). Each has its own groove, tempo, kit, bass, lead and hook. The battle themes state
  // their hook in the first bar and drive (fills into every section); the bosses open with a build, hit a drop, and loop back
  // round through a breakdown, a second build and the drop again. Funky, never phonk or orchestral; every tune is original.
  // ------------------------------------------------------------ helpers
  // a periodic wave from harmonic levels (the 1st harmonic first), made once per audio context: one oscillator for a drawbar
  // organ, a reed, a piano's string… instead of a stack of sines
  const PWAVES = new WeakMap();
  function pwave(name, amps) {
    let m = PWAVES.get(ac); if (!m) PWAVES.set(ac, m = {});
    if (!m[name]) { const re = new Float32Array(amps.length + 1), im = new Float32Array(amps.length + 1); amps.forEach((a, k) => { im[k + 1] = a; }); m[name] = ac.createPeriodicWave(re, im); }
    return m[name];
  }
  function posc(name, amps, f, t, end, dest, det = 0) { const o = ac.createOscillator(); o.setPeriodicWave(pwave(name, amps)); o.frequency.value = f; if (det) o.detune.value = det; o.connect(dest); o.start(t); o.stop(end); return o; }
  // ------------------------------------------------------------ the Spanish battle's instruments (Latin rock-funk)
  // a tight funk kick with a click; a rimshot snare that cracks (and its rim pings); a Hammond organ (drawbars 16' 8' 5⅓' 4'
  // 2⅔' 2' as one wave a half note down, the key click, the Leslie's swirl); a growly electric bass; and the overdriven
  // guitar that leads (it sustains, bends up into its long notes, and its vibrato opens up late)
  function funkkick(t, v = 1) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.055);
    env(g, t, 0.62 * v, 0.002, 0.19); o.connect(g); g.connect(music); o.start(t); o.stop(t + 0.25);
    noise(t, 0.008, 0.11 * v, 'highpass', 3200, 0.7, music, 0.0005);
  }
  function rimcrack(t, v = 1) {
    noise(t, 0.13, 0.28 * v, 'bandpass', 1900, 0.8, music, 0.001); noise(t, 0.035, 0.12 * v, 'highpass', 6500, 0.7, music, 0.0005);
    tone('triangle', 245, 196, t, 0.05, 0.2 * v, music, 0.001); tone('sine', 910, 890, t, 0.07, 0.035 * v, music, 0.0005);
  }
  const DRAWBARS = [0.55, 1, 0.5, 0.45, 0, 0.22, 0, 0.12];
  function hammond(notes, t, len, v = 1, leslie = 6.6) {
    const g = ac.createGain(), am = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(), dg = ac.createGain(), end = t + len + 0.08, lp = filt('lowpass', 3800, 0.6, am);
    am.gain.value = 0.8; lfo.frequency.value = leslie; lg.gain.value = 0.2; dg.gain.value = 14; lfo.connect(lg); lg.connect(am.gain); lfo.connect(dg); lfo.start(t); lfo.stop(end);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.02 * v, t + 0.005); g.gain.setValueAtTime(0.02 * v, t + Math.max(0.01, len - 0.03)); g.gain.linearRampToValueAtTime(0.0001, t + len + 0.03);
    am.connect(g); g.connect(music);
    notes.forEach(m => dg.connect(posc('drawbar', DRAWBARS, mtof(m) / 2, t, end, lp).detune));
    noise(t, 0.01, 0.025 * v, 'bandpass', 2400, 1.4, music, 0.0005);
  }
  function rockbass(m, t, len, v = 1) {
    const f = mtof(m), g = ac.createGain(), lp = filt('lowpass', 600, 1.2, g), end = t + len + 0.08;
    lp.frequency.setValueAtTime(1500, t); lp.frequency.exponentialRampToValueAtTime(520, t + 0.1);
    env(g, t, 0.17 * v, 0.004, len); g.connect(music);
    osc('sawtooth', f, t, end, crunch(lp, 1.6)); osc('sine', f, t, end, g);
  }
  function odgtr(m, t, dur, v = 1, bend = 0) {
    const f = mtof(m), d = Math.max(0.08, dur), dec = Math.min(0.25, d * 0.7), rel = d + 0.1, end = t + rel + 0.05;
    const g = ac.createGain(), cab = filt('lowpass', 2700, 1.1, g), mid = filt('peaking', 1250, 1.1, cab), drive = crunch(mid, 3.4), vib = ac.createOscillator(), vg = ac.createGain();
    mid.gain.value = 6;
    vib.frequency.value = 5.6; vg.gain.setValueAtTime(0, t); vg.gain.setValueAtTime(0, t + Math.min(0.22, d * 0.4)); vg.gain.linearRampToValueAtTime(d > 0.3 ? 28 : 0, t + Math.min(d, 0.55)); vib.connect(vg); vib.start(t); vib.stop(end);
    [[1, -6, 0.5], [1, 7, 0.35], [2, 0, 0.12]].forEach(([k, c, a]) => {
      const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sawtooth'; og.gain.value = a; o.detune.value = c; vg.connect(o.detune);
      if (bend) { const lo = f * k * Math.pow(2, -bend / 12); o.frequency.setValueAtTime(lo, t); o.frequency.setValueAtTime(lo, t + 0.04); o.frequency.exponentialRampToValueAtTime(f * k, t + 0.13); } else o.frequency.value = f * k;
      o.connect(og); og.connect(drive); o.start(t); o.stop(end);
    });
    const pk = 0.034 * v; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pk, t + 0.004); g.gain.exponentialRampToValueAtTime(pk * 0.62, t + dec); g.gain.setValueAtTime(pk * 0.62, t + Math.max(dec + 0.005, d)); g.gain.exponentialRampToValueAtTime(0.0001, t + rel);
    g.connect(music); g.connect(echoIn);
  }
  // The Spanish battle: Latin rock-funk (148 bpm, F# dorian), a desert-saloon showdown. The overdriven guitar states the hook
  // at once (a tresillo "da… da… da-da" up the scale, then a run down through the dorian D#) over a Hammond, a growly bass
  // and a funk kit with a cracking rimshot; the cowbell and the congas' tumbao keep time in the verse, and the kit goes four on
  // the floor for the chorus. Count-in 1 (a timbale roll) · A 8 (the riff; the organ doubles it an octave down the second
  // time) · B 8 (the chorus: the guitar sings and bends) · a 4-bar break (the guitar trades licks with the timbales over a
  // cáscara, then it and the bass climb back in together). A: F#m9 B13 F#m9 B13 F#m9 B13 Dmaj9 C#7#9 · B: Dmaj9 E6/9 F#m9
  // F#m9 Dmaj9 E6/9 C#7#9 C#7#9 · break: F#m9 F#m9 F#m9 C#7#9 (written a step down, in E, and moved up as it's read)
  SONGS.battle_es = { bpm: 148, len: 336, from: 16, swing: 0.04, vol: 0.55, verb: 0.08, echo: 0.12, echoSteps: 3,
    D: (() => {
      const Em = 'E2: G3 B3 D4 F#4', A13 = 'A1: G3 C#4 F#4 B4', Cj = 'C2: E3 G3 B3 D4', B7 = 'B1: A3 D#4 D5', D69 = 'D2: F#3 B3 E4 A4';
      const C = CH([Em, A13, Em, A13, Em, A13, Cj, B7, Cj, D69, Em, Em, Cj, D69, B7, B7, Em, Em, Em, B7].join(','));
      const riff = 'E5/3 G5/3 A5/2 B5/2 D6/2 B5/4 | C#6/2 B5/1 A5/1 G5/2 E5/2 F#5/4 r/4 | ';
      const L = mel(riff + 'E5/3 G5/3 A5/2 B5/2 D6/2 B5/4 | C#6/2 B5/1 A5/1 G5/2 A5/2 B5/8 | ' + riff +
        'E6/3 D6/3 B5/2 G5/2 A5/2 B5/4 | D6/2 C6/1 B5/1 A5/2 G5/2 F#5/2 D#5/2 F#5/4 | ' +
        'E5/2 G5/2 C6/6 B5/2 G5/4 | F#5/2 A5/2 D6/6 E6/2 D6/4 | E6/8 D6/2 B5/2 G5/2 A5/2 | B5/12 r/4 | ' +
        'E5/2 G5/2 C6/6 B5/2 C6/4 | D6/2 E6/2 F#6/4 E6/2 D6/2 A5/4 | F#5/4 A5/4 B5/4 D#6/4 | F#6/8 E6/2 D#6/2 B5/2 A5/2 | ' +
        'E6/2 D6/1 B5/1 A5/2 B5/2 r/8 | r/16 | G5/1 A5/1 B5/2 D6/2 E6/2 r/8 | r/8 B4/1 B4/1 B4/1 B4/1 C5/1 C#5/1 D5/1 D#5/1');
      const bE = 'E2/3 E2/1 r/2 B1/2 D2/1 E2/3 G2/2 A2/2 | ', bA = 'A1/3 A1/1 r/2 E2/2 G2/1 A2/3 C#2/2 D2/2 | ';
      const bC = 'C2/3 C2/1 r/2 G2/2 C3/2 G2/2 E2/2 G2/2 | ', bD = 'D2/3 D2/1 r/2 A2/2 D3/2 A2/2 F#2/2 A2/2 | ';
      const bBrk = 'E2/2 r/1 E2/1 G2/1 A2/2 B2/1 r/2 D3/1 B2/2 A2/1 G2/2 | ';
      const BASS = mel(bE + bA + bE + bA + bE + bA + 'C2/3 C2/1 r/2 G2/2 B2/1 C3/3 G2/2 E2/2 | B1/3 B1/1 r/2 F#2/2 A2/1 B2/3 A2/2 F#2/2 | ' +
        bC + bD + 'E2/3 E2/1 r/2 B2/2 E3/2 B2/2 G2/2 B2/2 | E2/3 E2/1 r/2 B1/2 D2/2 E2/2 F#2/2 G2/2 | ' + bC + bD +
        'B1/3 B1/1 r/2 F#2/2 B2/2 A2/2 F#2/2 D#2/2 | B1/2 B1/2 B1/2 B1/2 A1/2 B1/2 D2/2 D#2/2 | ' +
        bBrk + 'E2/2 r/1 E2/1 G2/1 A2/2 B2/1 r/2 A2/1 G2/2 E2/1 D2/2 | ' + bBrk + 'B1/2 r/2 B1/2 r/2 B1/1 B1/1 B1/1 B1/1 C2/1 C#2/1 D2/1 D#2/1');
      const up = a => a.map(n => [n[0] + 2, n[1]]);          // (written in E, played a step up in F#: E is lu_campana's key)
      return { C: C.map(c => c.map(m => m + 2)), L: up(L), BASS: up(BASS), KA: pat('x.....x..x....x.'), CASC: pat('x.xx.x.xx.x.xx.x'), TIMB: pat('x.xxx.x.x.xxx.xx'),
        TUMB: ['heel', 0, 'mute', 0, 'slap', 0, 'mute', 0, 'heel', 0, 'mute', 0, 'hi', 0, 'lo', 'lo'] };
    })(),
    play(i, t, s16) {
      const D = this.D;
      if (i < 16) {   // count-in: a timbale roll swelling up, then the band's first hit (the guitar bends up into its E)
        if (i < 12) timbale(t, i & 1, 0.3 + i * 0.05);
        if (i === 12) { funkkick(t, 1); crash(t, 0.6); hammond(D.C[0].slice(1), t, 3 * s16, 0.9); odgtr(66, t, 3.5 * s16, 0.8, 2); }
        if (i === 14) { funkkick(t, 0.9); rimcrack(t, 0.6); }
        if (i === 15) conga(t, 'lo', 1);
        return;
      }
      const j = i - 16, bar = j >> 4, s = j & 15, B = bar >= 8 && bar < 16, brk = bar >= 16, vo = D.C[bar].slice(1);
      const fill = (bar === 7 && s >= 12) || ((bar === 15 || bar === 19) && s >= 8);
      if (fill) { timbale(t, s & 1, 0.5 + (s - 8) * 0.05); if (s === 8 || s === 12) funkkick(t, 0.8); if (s === 15) rimcrack(t, 0.8); }
      else if (brk) {          // the break: the kit only marks it; a cáscara, the congas, and the timbales answering the guitar
        if (s === 0 || s === 10) funkkick(t, 0.9);
        if (s === 12) rimcrack(t, 0.5);
        if (!(s & 1) && D.CASC[(bar & 1) * 8 + (s >> 1)]) shell(t, 0.85);
        const cg = D.TUMB[s]; if (cg) conga(t, cg, 0.95);
        if ((bar === 16 && s >= 8 && D.TIMB[s]) || (bar === 17 && D.TIMB[s]) || (bar === 18 && s >= 8 && D.TIMB[s])) timbale(t, s & 2, 0.45 + (s & 7) * 0.04);
      } else if (!B) {         // the verse: the cowbell keeps time, a tumbao on the congas
        if (D.KA[s]) funkkick(t, s ? 0.85 : 1);
        if (s === 4 || s === 12) rimcrack(t, 0.9); else if (s === 7 || s === 15) rimcrack(t, 0.1);
        if (!(s & 3)) cowbell(t, s & 4 ? 0.4 : 0.65, !(s & 4));
        shaker(t, s & 1 ? 0.3 : 0.55);
        const cg = D.TUMB[s]; if (cg) conga(t, cg, cg === 'hi' || cg === 'lo' ? 0.9 : 0.5);
      } else {                 // the chorus: four on the floor, open hats on the offbeats, the bell on the "and"s
        if (!(s & 3)) funkkick(t, 1);
        if (s === 4 || s === 12) rimcrack(t, 1);
        if ((s & 3) === 2) { hat(t, 0.55, true); cowbell(t, 0.35); } else if (s & 1) hat(t, 0.2);
        const cg = D.TUMB[s]; if (cg === 'hi' || cg === 'lo' || cg === 'slap') conga(t, cg, 0.8);
      }
      if (s === 0 && (bar === 0 || bar === 8 || bar === 16)) crash(t, 0.7);
      const b = D.BASS[j]; if (b) rockbass(b[0], t, b[1] * s16 * 0.92, 1);
      // the organ: chords and stabs in the verse (lighter while it doubles the riff), held chords in the chorus, stabs in the break
      if (!fill) {
        if (B) { if (s === 0) hammond(vo, t, 15 * s16, 0.8); }
        else if (brk) { if (s === 0 || s === 6) hammond(vo, t, 1.5 * s16, 0.9); }
        else if (s === 0) hammond(vo, t, 6 * s16, bar >= 4 ? 0.55 : 0.8);
        else if (bar < 4 && (s === 10 || s === 14)) hammond(vo, t, 2 * s16, 0.7);
      }
      const n = D.L[j];
      if (n) {
        odgtr(n[0], t, n[1] * s16, 0.95, n[1] >= 6 ? 2 : 0);
        if (!B && !brk && bar >= 4 && bar < 7) hammond([n[0] - 12], t, n[1] * s16 * 0.9, 0.75);    // the organ joins the riff
      }
    } };
  // ------------------------------------------------------------ the Spanish boss's instruments (salsa dura)
  // a bright piano for the montuno (two strings a hair apart, the hammer's knock, the tone darkening as it rings); bongós
  // (hi, lo, a fingertip, a slap) and the bongocero's hand bell (mouth: the low open clang, neck: the high one); the baby
  // bass (deep and round, a thump on the front); and the horn section: a lead trumpet that screams and a broad trombone
  const PIANO = [1, 0.62, 0.42, 0.3, 0.2, 0.14, 0.1, 0.07, 0.05, 0.035];
  function piano(m, t, len = 0.3, v = 1) {
    const f = mtof(m), g = ac.createGain(), lp = filt('lowpass', Math.min(10000, f * 10), 0.5, g), L = Math.max(0.13, len), end = t + L + 0.3;
    lp.frequency.setValueAtTime(Math.min(10000, f * 10), t); lp.frequency.exponentialRampToValueAtTime(Math.max(600, f * 2.5), t + 0.35);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.012 * v, t + 0.12); g.gain.setValueAtTime(0.012 * v, t + L); g.gain.exponentialRampToValueAtTime(0.0001, t + L + 0.2);
    g.connect(music); posc('piano', PIANO, f, t, end, lp, 3);
    noise(t, 0.012, 0.02 * v, 'bandpass', Math.min(8000, f * 3), 1.2, music, 0.0005);
  }
  // a horn section on one hit (trumpets and trombones together: a saw each, one brassy filter, one envelope, every note
  // scooping up into its pitch); far lighter than a lead() per horn
  function brass(notes, t, len, v = 1, bright = 1) {
    const L = Math.max(0.06, len), g = ac.createGain(), lp = filt('lowpass', 600, 1.4, g), end = t + L + 0.12;
    lp.frequency.setValueAtTime(500, t); lp.frequency.linearRampToValueAtTime(3600 * bright, t + 0.025); lp.frequency.exponentialRampToValueAtTime(1500 * bright, t + Math.max(0.1, L));
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03 * v, t + 0.012); g.gain.setValueAtTime(0.026 * v, t + Math.max(0.02, L - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, t + L + 0.08);
    g.connect(music); g.connect(echoIn);
    notes.forEach((m, k) => { const c = k & 1 ? 6 : -6, o = osc('sawtooth', mtof(m), t, end, lp, c); o.detune.setValueAtTime(c - 45, t); o.detune.linearRampToValueAtTime(c, t + 0.05); });
  }
  const BONGO = { hi: [610, 0.09, 0.11], lo: [420, 0.12, 0.12], tip: [580, 0.03, 0.045], slap: [640, 0.045, 0.09] };
  function bongo(t, kind, v = 1) {
    const [f, d, p] = BONGO[kind] || BONGO.hi; tone('sine', f * 1.25, f, t, d, p * v, music, 0.001);
    noise(t, kind === 'slap' ? 0.04 : 0.014, (kind === 'slap' ? 0.1 : 0.035) * v, 'bandpass', kind === 'slap' ? 2200 : 3600, 1.3, music, 0.0005);
  }
  function campana(t, mouth, v = 1) {
    const f = mouth ? 560 : 820;
    tone('triangle', f, f * 0.995, t, 0.3, 0.05 * v, music, 0.0008); tone('triangle', f * 2.4, f * 2.38, t, 0.12, 0.018 * v, music, 0.0008);
    noise(t, 0.01, 0.05 * v, 'bandpass', 3800, 2, music, 0.0005);
  }
  function babybass(m, t, len, v = 1) {
    const f = mtof(m), g = ac.createGain(), lp = filt('lowpass', 420, 0.9, g), L = Math.max(0.27, len), end = t + L + 0.15;
    lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(380, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.13 * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.075 * v, t + 0.25); g.gain.setValueAtTime(0.075 * v, t + L); g.gain.exponentialRampToValueAtTime(0.0001, t + L + 0.1);
    g.connect(music); osc('triangle', f, t, end, lp); osc('sine', f, t, end, lp); noise(t, 0.03, 0.03 * v, 'lowpass', 300, 0.7, music, 0.002);
  }
  Object.assign(LEADS, {
    tptlead: { o: [['sawtooth', 1, -6, 0.5], ['sawtooth', 1, 6, 0.45], ['square', 1, 0, 0.12]], lp: [700, 5200, 2600], q: 1.8, vib: 0.008, g: 0.05, a: 0.014, scoop: -60 },
    bone:    { o: [['sawtooth', 1, -4, 0.55], ['sawtooth', 1, 5, 0.4], ['sine', 0.5, 0, 0.15]], lp: [320, 2000, 1050], q: 1.3, vib: 0.006, g: 0.062, a: 0.03, scoop: -45 },
  });
  // The Spanish boss: salsa dura (196 in cut time: the grid's sixteenths are its eighths, so a 16-step bar here is one turn
  // of the 3-2 son clave, two bars of salsa; B minor). No drum kit: timbales, congas, bongós, güiro, the clave, a baby bass,
  // a piano montuno and a horn section. The build is the montuno: the piano alone on the clave, then the congas and the bass,
  // then the cáscara, the güiro and the bongós with a shout, then the horns hit the F#7 louder on every beat over a timbale
  // roll, a stop… and the drop is the mambo: the trumpets' hook ("ba-ba BAM ba-BAM-ba", in thirds, the trombones an octave
  // down) with the bongocero on his bell. Then the coro (the trumpets sing, the trombone answers), a descarga breakdown
  // (congas, bongós, the bass), a second build, and the mambo again with the trombones' moña riff against it.
  // Turns of the clave: build 4 · mambo 4 · coro 4 · breakdown 2 · build 2 · mambo 4 (the loop starts at the coro).
  // By bar of salsa: build and mambo Bm7 E9 Bm7 E9 Gmaj7 F#7 Bm7 F#7 · coro Em7 A7 Dmaj7 Gmaj7 C#m7b5 F#7 Bm7 F#7 ·
  // breakdown Bm7 E9 Bm7 E9 · build Gmaj7 F#7 Gmaj7 F#7
  SONGS.boss_es = { bpm: 98, len: 320, from: 128, swing: 0.03, vol: 0.52, verb: 0.1, echo: 0.04, echoSteps: 3,
    D: (() => {
      const Bm = 'B1: A3 B3 D4 F#4', E9 = 'E2: G#3 B3 D4 F#4', Gj = 'G1: F#3 B3 D4 G4', F7 = 'F#1: E3 A#3 C#4 E4', Em = 'E2: G3 B3 D4 E4', A7 = 'A1: G3 C#4 E4 A4', Dj = 'D2: F#3 A3 C#4 D4', Cs = 'C#2: G3 B3 E4 G4';
      const M = [Bm, E9, Bm, E9, Gj, F7, Bm, F7];
      const C = CH([...M, ...M, Em, A7, Dj, Gj, Cs, F7, Bm, F7, Bm, E9, Bm, E9, Gj, F7, Gj, F7, ...M].join(','));     // by bar of salsa (8 steps)
      const HOOK = mel('B5/1 B5/1 D6/2 B5/1 A5/2 F#5/1 | G#5/1 G#5/1 B5/2 G#5/1 F#5/2 E5/1 | B5/1 B5/1 D6/2 E6/1 F#6/2 E6/1 | D6/1 C#6/1 B5/2 G#5/1 B5/3 | ' +
        'D6/1 D6/1 F#6/2 D6/1 B5/2 A5/1 | A#5/1 A#5/1 C#6/2 E6/1 C#6/3 | B5/2 r/1 F#6/1 E6/1 D6/1 C#6/1 B5/1 | A#5/2 C#6/2 E6/2 F#6/2');
      const MONA = mel('r/2 F#4/1 A4/1 B4/1 A4/1 F#4/2 | r/2 E4/1 G#4/1 B4/1 G#4/1 E4/2 | r/2 F#4/1 A4/1 B4/1 D5/1 B4/2 | r/2 E4/1 G#4/1 B4/1 D5/1 B4/2 | ' +
        'r/2 D4/1 F#4/1 G4/1 B4/1 D5/2 | r/2 C#4/1 E4/1 F#4/1 A#4/1 C#5/2 | r/2 D4/1 F#4/1 B4/1 D5/1 F#5/2 | r/2 C#4/1 E4/1 F#4/1 A#4/1 C#5/2');
      const CORO = mel('G5/3 F#5/1 E5/2 B5/2 | A5/4 r/4 | F#5/3 E5/1 D5/2 A5/2 | B5/4 r/4 | E5/3 D5/1 C#5/2 G5/2 | F#5/4 r/4 | D6/3 C#6/1 B5/2 F#5/2 | A#5/4 r/4');
      const PREG = mel('r/8 | r/4 E4/1 G4/1 A4/2 | r/8 | r/4 F#4/1 A4/1 B4/2 | r/8 | r/4 E4/1 F#4/1 A#4/2 | r/8 | r/4 C#4/1 E4/1 F#4/2');
      // a horn's partner a third or so below: the nearest chord tone at least a minor third down
      const harm = (m, ch) => { let best = -99; for (const x of ch.slice(1)) for (const o of [-12, 0, 12, 24]) { const c = x + o; if (m - c >= 3 && c > best) best = c; } return best > 0 ? best : m - 3; };
      return { C, HOOK, MONA, CORO, PREG, harm, CLAVE: pat('x..x..x...x.x...'), CASC: pat('x.xx.x.xx.x.xx.x'), BELL: pat('x.x.xx.xx.xx.x.x'),
        MON3: [1, 0, 1, 1, 0, 1, 0, 1], MON2: [0, 1, 0, 1, 1, 0, 1, 0], TUMB: ['heel', 'mute', 'slap', 'mute', 'heel', 'mute', 'hi', 'lo'],
        MART: ['hi', 'tip', 'hi', 'tip', 'hi', 'tip', 'hi', 'lo'] };
    })(),
    play(i, t, s16) {
      const D = this.D, cyc = i >> 4, s = i & 15, h = s & 7, bar = i >> 3, C = D.C[bar], nC = D.C[(bar + 1) % 40];
      const build = cyc < 4 || cyc === 14 || cyc === 15, mambo = (cyc >= 4 && cyc < 8) || cyc >= 16, coro = cyc >= 8 && cyc < 12, down = cyc === 12 || cyc === 13;
      const k = cyc < 4 ? cyc : build ? cyc - 12 : 4;          // how far into a build (0–3; the second one starts at 2), else 4
      if ((cyc === 3 || cyc === 15) && s >= 14) { if (s === 14) { timbale(t, true, 1); timbale(t, false, 0.9); kick(t, 0.9); } return; }   // the stop
      if (s === 0 && (cyc === 4 || cyc === 16)) { crash(t, 0.9); kick(t, 1); timbale(t, true, 1); timbale(t + s16 * 0.5, false, 0.9); }   // the drop
      if (s === 0 && cyc === 8) crash(t, 0.55);
      if (D.CLAVE[s]) clave(t, 0.85);
      // the timbalero: a roll into every drop, the mambo bell (and the bass drum on the clave's bombo) in the mambo, the cáscara
      if (k === 3 && s >= 8) { timbale(t, s & 1, 0.45 + (s - 8) * 0.07); timbale(t + s16 / 2, !(s & 1), 0.4 + (s - 8) * 0.07); }
      else if (mambo) { if (D.BELL[s]) cowbell(t, s === 0 || s === 8 ? 0.75 : 0.5); if (s === 3 || s === 11) kick(t, 0.55); }
      else if ((build && k >= 2) || coro || down) { if (D.CASC[s]) shell(t, down ? 0.6 : 0.8); }
      // the congas' tumbao; the bongós' martillo (a solo in the breakdown), or their bell in the mambo; the güiro; maracas in the coro
      const grow = build ? 0.45 + 0.15 * k : 1;                            // (the build's congas and bass grow into the drop)
      if (k >= 1) { const cg = D.TUMB[h]; conga(t, cg, (cg === 'hi' || cg === 'lo' ? 0.95 : cg === 'slap' ? 0.8 : 0.5) * grow); }
      if (mambo) { if (!(s & 1)) campana(t, !(s & 3), !(s & 3) ? 0.9 : 0.6); }
      else if ((build && k >= 2) || coro || down) { bongo(t, down && (s === 5 || s === 13) ? 'slap' : D.MART[h], down ? 1 : 0.8); if (down && (s & 1) && Math.random() < 0.35) bongo(t + s16 / 2, 'tip', 0.6); }
      if ((build && k >= 2) || coro || mambo) { if (!(s & 1)) scrape(t, 1.3 * s16, 0.6, 3400, 60); else noise(t, 0.03, 0.03, 'bandpass', 3400, 1.6, music, 0.004); }
      if (coro) shaker(t, s & 1 ? 0.4 : 0.7);
      // the baby bass: the anticipated tumbao (the next chord's root on the "and" of 2, its fifth on 4), a downbeat in the mambo
      if (k >= 1) {
        const nr = nC[0] + (nC[0] < 40 ? 12 : 0);
        if (h === 3) babybass(nr, t, 3 * s16, 0.95 * grow);
        else if (h === 6) babybass(nr + 7 > 52 ? nr - 5 : nr + 7, t, 2 * s16, 0.8 * grow);
        else if (mambo && h === 0 && !(bar & 1)) babybass(C[0] + (C[0] < 40 ? 12 : 0), t, 2 * s16, 0.9);
      }
      // the piano's montuno: octaves on the clave's syncopations, walking round the chord (sparse in the breakdown)
      if ((!down || h === 0 || h === 5) && (s < 8 ? D.MON3 : D.MON2)[h]) {
        const v = C.slice(1), m = v[(h + (s >> 3)) % v.length], pv = mambo ? 0.42 : 0.6;
        piano(m, t, s16 * 0.9, pv); piano(m + 12, t, s16 * 0.9, pv * 0.9);
      }
      // the horns: the build's hits (louder each beat), the mambo's hook (and the moña against it the second time), the coro
      if (k === 3 && s >= 8 && !(s & 1)) brass([C[0] + 24, ...C.slice(1).map(m => m + 12)], t, s16 * 0.8, 0.45 + (s - 8) * 0.1, 0.7 + (s - 8) * 0.06);
      if (mambo) {
        const n = D.HOOK[(i - (cyc >= 16 ? 256 : 64)) % 64];
        if (n) { const L = n[1] * s16 * 0.85; brass(cyc < 16 ? [n[0], D.harm(n[0], C), n[0] - 12] : [n[0], D.harm(n[0], C)], t, L, 1.15, 1.1); }
        const mo = cyc >= 16 && D.MONA[(i - 256) % 64]; if (mo) brass([mo[0], mo[0] - 12], t, mo[1] * s16 * 0.85, 0.9, 0.55);
      }
      if (coro) {
        const c = D.CORO[(i - 128) % 64]; if (c) { lead(c[0], t, c[1] * s16 * 0.95, 'tptlead', 0.6); lead(D.harm(c[0], C), t, c[1] * s16 * 0.95, 'tptlead', 0.45); }
        const p = D.PREG[(i - 128) % 64]; if (p) lead(p[0], t, p[1] * s16 * 0.9, 'bone', 0.85);
      }
      if (k === 2 && (s === 6 || s === 14)) vox(66, t, 0.12, 0.5, 'e', 'a');     // the band shouts: "¡eh!"
    } };
  // ------------------------------------------------------------ the Portuguese battle's instruments (baião-funk)
  // the zabumba (the felt beater's boom on top; stick: the bacalhau's thin "tchak" on the bottom head); the triangle (open
  // it rings, closed the hand chokes it); a backbeat that cracks (a snare and a clap stacked); a thumbed bass (muted, boxy,
  // punchy); the sanfona's chords (bellows pushing the reeds) and, in LEADS, the sanfona's right hand and the pífano (a cane
  // fife: breathy, a wide wobble, scooping up)
  function zabumba(t, v = 1, stick) {
    if (stick) { noise(t, 0.022, 0.09 * v, 'bandpass', 2300, 2, music, 0.0005); tone('triangle', 540, 470, t, 0.03, 0.04 * v, music, 0.0005); return; }
    tone('sine', 112, 60, t, 0.3, 0.5 * v, music, 0.002); noise(t, 0.035, 0.08 * v, 'lowpass', 600, 0.8, music, 0.001);
  }
  function triangle(t, v = 1, open) {
    const d = open ? 0.3 : 0.05;
    tone('sine', 2140, 2140, t, d, 0.012 * v, music, 0.0005); tone('sine', 4970, 4970, t, d * 0.8, 0.011 * v, music, 0.0005); tone('sine', 7680, 7680, t, d * 0.6, 0.007 * v, music, 0.0005);
    noise(t, 0.008, 0.03 * v, 'highpass', 6000, 0.7, music, 0.0003);
  }
  function stacksnare(t, v = 1) { noise(t, 0.1, 0.24 * v, 'bandpass', 1500, 0.9, music, 0.001); tone('triangle', 230, 185, t, 0.05, 0.16 * v, music, 0.001); [0.008, 0.018].forEach(d => noise(t + d, 0.04, 0.1 * v, 'bandpass', 1250, 1.3, music, 0.001)); }
  function thumbbass(m, t, len, v = 1) {
    const f = mtof(m), g = ac.createGain(), lp = filt('lowpass', 500, 1.6, g), end = t + len + 0.06;
    lp.frequency.setValueAtTime(1100, t); lp.frequency.exponentialRampToValueAtTime(420, t + 0.06);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16 * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.075 * v, t + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.12, len));
    g.connect(music); osc('square', f, t, end, lp); osc('sine', f, t, end, g);
  }
  const REED = [1, 0.7, 0.55, 0.45, 0.38, 0.3, 0.24, 0.2, 0.16, 0.12, 0.09, 0.07];
  function accchord(notes, t, len, v = 1) {
    const g = ac.createGain(), lp = filt('lowpass', 2300, 0.8, g), end = t + len + 0.06;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.014 * v, t + 0.012); g.gain.setValueAtTime(0.013 * v, t + Math.max(0.015, len - 0.02)); g.gain.linearRampToValueAtTime(0.0001, t + len + 0.04);
    g.connect(music); notes.forEach((m, k) => posc('reed', REED, mtof(m), t, end, lp, k & 1 ? 9 : -9));
  }
  Object.assign(LEADS, {
    sanfona: { o: [['sawtooth', 1, -9, 0.4], ['sawtooth', 1, 8, 0.35], ['square', 2, 0, 0.08]], lp: [1500, 3200, 2400], q: 1.1, vib: 0.004, g: 0.046, a: 0.012 },
    pife:    { o: [['sine', 1, 0, 0.8], ['triangle', 2, 0, 0.1], ['sawtooth', 1, 0, 0.04]], lp: [3500, 6000, 4500], q: 0.8, vib: 0.024, g: 0.05, a: 0.02, breath: 0.05, scoop: -35 },
  });
  // The Portuguese battle: baião-funk (144 bpm, D in the northeastern mode, Mixolydian with a raised fourth: the G# and the C
  // give it its tang). The forró trio leads: the sanfona plays the hook (two quick pick-ups, a leap down, then up the scale
  // through the G#: "ta-ta TA… ta-TA-ta-ta"), the zabumba thumps the baião ("boom . . bum") with the bacalhau ticking the
  // offbeats, the triangle rings on every "and", over a thumbed bass and a cracking backbeat. B turns to B minor and the
  // pífano takes the tune, high and wobbly; then the hook comes back with the pífano a third above the sanfona.
  // Count-in 1 (the triangle alone, the zabumba calling) · A 8 · B 8 · A' 8. A: D7 D7 C7 D7 D7 D7 G7 A7 · B: Bm7 Bm7 Em7 F#7
  // Bm7 Bm7 G7 A7 · A' as A
  SONGS.battle_pt = { bpm: 144, len: 400, from: 16, swing: 0.06, vol: 0.46, verb: 0.08, echo: 0.06, echoSteps: 3,
    D: (() => {
      const D7 = 'D2: F#3 A3 C4', C7 = 'C2: E3 G3 Bb3', G7 = 'G1: F3 B3 D4', A7 = 'A1: G3 C#4 E4', Bm = 'B1: A3 D4 F#4', Em = 'E2: G3 B3 D4', F7 = 'F#1: E3 A#3 C#4';
      const A = [D7, D7, C7, D7, D7, D7, G7, A7];
      const C = CH([...A, Bm, Bm, Em, F7, Bm, Bm, G7, A7, ...A].join(','));
      const h1 = 'A5/2 A5/1 F#5/2 A5/1 G#5/2 A5/2 B5/2 C6/2 A5/2 | F#5/3 E5/3 D5/2 r/2 D5/1 E5/1 F#5/2 G#5/2 | ';
      const hook = h1 + 'G5/2 G5/1 E5/2 G5/1 F#5/2 G5/2 A5/2 Bb5/2 G5/2 | A5/4 F#5/2 D5/2 r/8 | ' + h1 +
        'B5/2 B5/1 G5/2 B5/1 A5/2 B5/2 C6/2 D6/2 B5/2 | C#6/3 B5/3 A5/2 G5/2 E5/2 C#5/2 E5/2 | ';
      const L = mel(hook + 'r/16 | r/16 | r/16 | r/16 | r/16 | r/16 | r/16 | r/16 | ' + hook);
      const P = mel('r/16 | r/16 | r/16 | r/8 D6/1 E6/1 F#6/2 A6/4 | r/16 | r/16 | r/16 | r/16 | ' +
        'F#6/3 D6/3 B5/2 C#6/3 D6/3 E6/2 | F#6/6 E6/2 D6/4 C#6/4 | G6/3 E6/3 B5/2 C#6/3 D6/3 E6/2 | F#6/6 E6/2 C#6/4 A#5/4 | ' +
        'B5/2 D6/2 F#6/2 B6/2 A6/3 F#6/3 D6/2 | E6/3 F#6/3 D6/2 B5/8 | D6/3 B5/3 G5/2 F5/3 G5/3 B5/2 | C#6/4 E6/4 G6/4 A6/4');
      // the pífano's harmony in A': a third above the sanfona in D (G#, Bb and C# take the nearest third)
      const SC = [2, 4, 6, 7, 9, 11, 0], third = m => { const k = SC.indexOf(m % 12); return k < 0 ? m + (m % 12 === 10 ? 4 : 3) : m + ((SC[(k + 2) % 7] - SC[k] + 12) % 12); };
      return { C, L, P, third, ZL0: pat('x..o....x..o....'), ZL1: pat('x..o....x..o..o.'), ZH: pat('..x...x...x...x.'),
        // the bass: [step, interval ('a': a half step under the next chord's root), sixteenths, level]
        BL: [[0, 0, 3, 1], [3, 7, 3, 0.75], [6, 12, 2, 0.85], [8, 0, 3, 0.95], [11, 7, 3, 0.75], [14, 'a', 2, 0.8]] };
    })(),
    play(i, t, s16) {
      const D = this.D;
      if (i < 16) {   // count-in: the triangle alone, the zabumba calling, the sanfona's bellows opening on D7
        triangle(t, 0.4 + i * 0.04, (i & 3) === 2);
        if (i === 8) accchord(D.C[0].slice(1).map(m => m + 12), t, 8 * s16, 0.9);
        if (i === 8 || i === 12 || i === 14) zabumba(t, i === 8 ? 0.8 : 1); if (i === 15) zabumba(t, 1, true);
        return;
      }
      const j = i - 16, bar = j >> 4, s = j & 15, B = bar >= 8 && bar < 16, C = D.C[bar], R = C[0] < 33 ? C[0] + 12 : C[0], nR = D.C[(bar + 1) % 24][0];
      const fill = (bar & 7) === 7 && s >= 12;
      if (fill) { zabumba(t, 0.65 + (s - 12) * 0.1); if (s & 1) stacksnare(t, 0.35 + (s - 12) * 0.1); }
      else {
        if ((bar & 1 ? D.ZL1 : D.ZL0)[s]) zabumba(t, s === 0 || s === 8 ? 1 : 0.7);
        if (D.ZH[s]) zabumba(t, 0.8, true);
        if (s === 4 || s === 12) stacksnare(t, 0.85); else if (s === 15 && (bar & 1)) stacksnare(t, 0.2);
      }
      triangle(t, (s & 3) === 0 ? 0.9 : (s & 3) === 2 ? 0.75 : 0.4, (s & 3) === 2);
      if (s === 0 && (bar === 0 || bar === 8 || bar === 16)) crash(t, 0.6);
      for (const [st, iv, l, v] of D.BL) if (st === s && !(fill && s > 12)) thumbbass(iv === 'a' ? (nR === C[0] ? R - 2 : (nR < 33 ? nR + 12 : nR) - 1) : R + iv, t, l * s16 * 0.9, v);
      // the sanfona's left hand: short chords on the offbeats (held chords in B), louder and longer as a section ends
      const vo = C.slice(1).map(m => m + 12);
      if (!B) { if ((s & 3) === 2 && !fill) accchord(vo, t, 1.3 * s16, 0.85); }
      else if (s === 0) accchord(vo, t, 3 * s16, 1); else if (s === 10) accchord(vo, t, 2 * s16, 0.8);
      const n = D.L[j]; if (n) lead(n[0], t, n[1] * s16 * 0.92, 'sanfona', 1);
      const p = D.P[j]; if (p) { lead(p[0], t, p[1] * s16 * 0.92, 'pife', 0.95); if (B && bar >= 12) lead(p[0] - 12, t, p[1] * s16 * 0.9, 'sanfona', 0.6); }
      if (n && bar >= 16) lead(D.third(n[0]), t, n[1] * s16 * 0.9, 'pife', 0.6);
    } };
  // ------------------------------------------------------------ the Portuguese boss's instruments (capoeira, then maracatu)
  // the berimbau (a steel string on a bow with a gourd: dong, the open string; ding, the stone pressed on it; chi, the stone
  // just touching, a buzz; the caxixi rattles with every stroke); the pandeiro (tum: the thumb, tak: the slap, both with its
  // jingles); the atabaque (open, bass, slap); the alfaia (the maracatu's big rope drum hit with a stick; rim: the hoop); the
  // gonguê (a big flat iron bell, two tones); the caixa (a snare with long wires, for rolls); the agbê (a gourd in a net of
  // beads); a fat breakbeat snare; a fuzz bass; and, in LEADS, the rabeca (a raspy country fiddle)
  function berimbau(t, kind, v = 1) {
    noise(t + 0.005, 0.04, 0.035 * v, 'bandpass', 5200, 1.2, music, 0.006);       // the caxixi
    const f = mtof(kind === 'ding' ? 45 : 43);
    if (kind === 'chi') { noise(t, 0.035, 0.07 * v, 'bandpass', 2600, 3, music, 0.0005); tone('sawtooth', f * 2, f * 1.96, t, 0.04, 0.02 * v, music, 0.001); return; }
    const bp = filt('bandpass', f * 6, 4), g = ac.createGain(), end = t + 0.8;
    bp.frequency.setValueAtTime(f * 7, t); bp.frequency.exponentialRampToValueAtTime(f * (kind === 'dong' ? 2.6 : 3.2), t + 0.35);
    env(g, t, 0.3 * v, 0.002, 0.7); bp.connect(g); g.connect(music);
    const o = osc('sawtooth', f * 1.01, t, end, bp); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
  }
  function pandeiro(t, kind, v = 1) {
    noise(t, 0.05, 0.05 * v, 'bandpass', 7200, 1.5, music, 0.002); noise(t + 0.02, 0.04, 0.03 * v, 'bandpass', 8600, 2, music, 0.002);
    if (kind === 'tum') tone('sine', 200, 165, t, 0.12, 0.13 * v, music, 0.002);
    else if (kind === 'tak') { noise(t, 0.05, 0.12 * v, 'bandpass', 1800, 1, music, 0.001); tone('triangle', 330, 290, t, 0.03, 0.05 * v, music, 0.001); }
  }
  function atabaque(t, kind, v = 1) {
    if (kind === 'slap') { noise(t, 0.05, 0.12 * v, 'bandpass', 1500, 1.2, music, 0.001); tone('sine', 260, 230, t, 0.06, 0.07 * v, music, 0.001); return; }
    const f = kind === 'bass' ? 92 : 182; tone('sine', f * 1.3, f, t, kind === 'bass' ? 0.32 : 0.24, 0.2 * v, music, 0.002);
  }
  function alfaia(t, v = 1, rim) {
    if (rim) { tone('triangle', 920, 820, t, 0.03, 0.06 * v, music, 0.0005); noise(t, 0.02, 0.07 * v, 'bandpass', 2600, 2, music, 0.0005); return; }
    tone('sine', 82, 46, t, 0.55, 0.46 * v, music, 0.002); tone('triangle', 240, 196, t, 0.05, 0.1 * v, music, 0.001); noise(t, 0.025, 0.1 * v, 'bandpass', 1100, 1, music, 0.001);
  }
  function gongue(t, hi, v = 1) { const f = hi ? 430 : 290; tone('triangle', f, f * 0.996, t, 0.45, 0.05 * v, music, 0.001); tone('triangle', f * 2.93, f * 2.9, t, 0.16, 0.018 * v, music, 0.001); noise(t, 0.012, 0.05 * v, 'bandpass', 2400, 2, music, 0.0005); }
  function caixa(t, v = 1) { noise(t, 0.15, 0.16 * v, 'bandpass', 2800, 0.7, music, 0.001); tone('triangle', 300, 262, t, 0.035, 0.08 * v, music, 0.001); }
  function agbe(t, v = 1) { noise(t, 0.07, 0.05 * v, 'bandpass', 4300, 0.9, music, 0.015); }
  function brsnare(t, v = 1) { noise(t, 0.2, 0.26 * v, 'bandpass', 1150, 0.6, music, 0.001); noise(t, 0.07, 0.12 * v, 'highpass', 4200, 0.7, music, 0.0005); tone('triangle', 195, 158, t, 0.08, 0.22 * v, music, 0.001); }
  function fuzzbass(m, t, len, v = 1) {
    const f = mtof(m), g = ac.createGain(), lp = filt('lowpass', 1700, 1, g), end = t + len + 0.08, fz = crunch(lp, 4.5);
    env(g, t, 0.075 * v, 0.004, Math.max(0.1, len)); g.connect(music);
    osc('sawtooth', f, t, end, fz); osc('square', f * 2, t, end, fz, 5); osc('sine', f, t, end, g);
  }
  Object.assign(LEADS, {
    rabeca: { o: [['sawtooth', 1, -5, 0.5], ['sawtooth', 1, 6, 0.38], ['square', 1, 0, 0.1]], lp: [1500, 4200, 3000], q: 2, vib: 0.014, g: 0.046, a: 0.04, breath: 0.04, scoop: -30 },
  });
  // The Portuguese boss: a capoeira roda that turns into a maracatu storm (108 bpm, G minor; the mangue beat's mix of
  // Pernambuco drums, funk and rock). The build is the roda: the berimbau's toque alone ("dong, chi-chi, ding… dong"), then
  // the pandeiro and the agogô, then the atabaque and the call «Iê!», then the alfaias rolling in, the caixa's roll and a
  // riser, a hit… and the drop: the alfaias' heavy baque, the gonguê's iron bell, the caixa's sixteenths and a fat breakbeat
  // snare, the agbê, under a fuzz bass riff that climbs chromatically (G… Bb C Db D) with the rabeca doubling it two octaves
  // up and shouts of «Ê!». B: the rabeca sings, a drone on its open D. Then the roda alone again (the breakdown), a second
  // build, and the drop with everything. Build 4 · drop 8 · B 8 · roda 4 · build 2 · drop 8 (the loop starts at B).
  // The riff's harmony: Gm, with an Eb–D turnaround every fourth bar.
  SONGS.boss_pt = { bpm: 108, len: 544, from: 192, swing: 0.06, vol: 0.52, verb: 0.12, echo: 0.08, echoSteps: 3,
    D: (() => {
      const ra = 'G1/3 G1/1 r/2 Bb1/2 C2/2 Db2/1 D2/3 F2/2 | ', rb = 'G1/3 G1/1 r/2 Bb1/2 C2/2 Bb1/1 G1/3 F1/2 | ', rd = 'Eb2/3 Eb2/1 r/2 D2/2 C2/2 Bb1/1 A1/3 D2/2 | ';
      const RIFF = mel(ra + rb + ra + rd);          // four bars, round and round
      const SONG = mel('D5/6 C5/2 Bb4/4 A4/2 Bb4/2 | G4/8 r/4 D4/2 G4/2 | Bb4/3 C5/3 D5/2 F5/4 E5/2 D5/2 | Eb5/6 D5/2 C5/4 A4/4 | ' +
        'G5/6 F5/2 D5/4 C5/2 D5/2 | Bb4/8 r/4 G4/2 Bb4/2 | C5/3 D5/3 F5/2 G5/4 F5/2 E5/2 | G5/4 F5/2 Eb5/2 D5/8');
      return { RIFF, SONG, BER: { 0: 'dong', 2: 'chi', 3: 'chi', 4: 'ding', 7: 'dong', 8: 'chi', 10: 'chi', 11: 'chi', 12: 'ding', 14: 'dong' },
        PAN: { 0: 'tum', 2: 'jing', 4: 'tak', 6: 'jing', 7: 'tum', 8: 'tum', 10: 'jing', 12: 'tak', 14: 'jing', 15: 'tum' },
        ATA: { 0: 'bass', 3: 'open', 4: 'open', 8: 'bass', 10: 'slap', 11: 'open', 12: 'open' }, AGO: { 0: 1, 2: 0, 3: 0, 6: 1, 8: 1, 10: 0, 12: 0, 13: 1 },
        ALF: pat('x..o..x.x.o..x.o'), GON: pat('x.x..x.x..x.x.x.') };
    })(),
    play(i, t, s16) {
      const D = this.D, bar = i >> 4, s = i & 15;
      const drop = (bar >= 4 && bar < 12) || bar >= 26, B = bar >= 12 && bar < 20, roda = bar < 4 || (bar >= 20 && bar < 24), build = bar === 3 || bar === 24 || bar === 25;
      const k = bar < 3 ? bar : 3;                 // the first build's layers
      if ((bar === 3 || bar === 25) && s >= 14) { if (s === 14) { alfaia(t, 1); alfaia(t, 0.9, true); gongue(t, false, 1); brsnare(t, 0.9); } return; }   // the hit, then a breath
      if (s === 0 && (bar === 4 || bar === 26)) { crash(t, 0.8); alfaia(t, 1.1); }
      // the roda: the berimbau always, the pandeiro, the agogô, the atabaque as it fills up (the berimbau rests in B)
      const ber = D.BER[s]; if (ber && !B) berimbau(t, ber, drop ? 0.75 : bar < 2 ? 1.7 : 1.1);
      if (roda || build) {
        const pn = bar >= 1 && D.PAN[s]; if (pn) pandeiro(t, pn, 1.2);
        if (bar >= 1 && D.AGO[s] !== undefined) agogo(t, D.AGO[s] === 1, 0.9);
        const at = bar >= 2 && D.ATA[s]; if (at) atabaque(t, at, 1.1);
      }
      if ((bar === 2 || bar === 20 || bar === 24) && s === 0) vox(74, t, 0.5, 0.6, 'i', 'e');        // «Iê!»
      // the builds: the alfaias roll in, louder, faster; the caixa's roll; a riser
      if (build) {
        const dense = bar === 25 || (bar === 3 && s >= 8) ? 1 : 2;
        if (!(s % dense)) { alfaia(t, 0.45 + s * 0.035); if (bar === 25 || s >= 8) alfaia(t + s16 / 2, 0.3 + s * 0.03, true); }
        caixa(t, 0.25 + s * 0.04); caixa(t + s16 / 2, 0.2 + s * 0.035);
        if (s === 0) swell(t, 14 * s16, 1);
      }
      // the drop and B: the maracatu (alfaias, gonguê, caixa, agbê) with a breakbeat snare on 2 and 4
      if (drop || B) {
        if (D.ALF[s]) alfaia(t, D.ALF[s] >= 1 ? 1 : 0.7);
        if (s === 6 || s === 14) alfaia(t, 0.5, true);
        if (D.GON[s]) gongue(t, !(s === 0 || s === 8), drop ? 0.9 : 0.7);
        caixa(t, s === 4 || s === 12 ? 0.5 : (s & 3) === 0 ? 0.32 : 0.18);
        if (s === 4 || s === 12) brsnare(t, 1);
        agbe(t, s & 2 ? 0.9 : 0.5);
        const r = D.RIFF[(i - (bar >= 26 ? 416 : 64)) % 64];
        if (r) { fuzzbass(r[0], t, r[1] * s16 * 0.9, 1); if (drop) lead(r[0] + 24, t, r[1] * s16 * 0.85, 'rabeca', 0.75); }
        if (drop && s === 12 && (bar & 1)) vox(70, t, 0.16, 0.55, 'e', 'e');                        // «Ê!»
      }
      if (B) {
        const n = D.SONG[(i - 192) % 128];
        if (n) { lead(n[0], t, n[1] * s16 * 0.95, 'rabeca', 1); if (n[1] >= 6) lead(62, t, n[1] * s16 * 0.9, 'rabeca', 0.35); }
      }
      if (bar >= 20 && bar < 24 && s === 0 && !(bar & 1)) atabaque(t, 'bass', 1.1);
    } };
  // ------------------------------------------------------------ the German battle's instruments (motorik / Neue Deutsche Welle)
  // a motorik kit (a round dry kick, a tight papery snare, crisp hats); a picked bass (bright on the attack, driving eighths);
  // a combo organ (a reedy, buzzy portable organ with its vibrato on, chopped short); and, in LEADS, a Moog-style lead (fat
  // saws over a square an octave down, a resonant filter that snaps open and shut, a little glide)
  function motokick(t, v = 1) { tone('sine', 118, 50, t, 0.16, 0.6 * v, music, 0.002); noise(t, 0.012, 0.05 * v, 'lowpass', 900, 0.7, music, 0.001); }
  function motosnare(t, v = 1) { noise(t, 0.09, 0.22 * v, 'bandpass', 1750, 1.3, music, 0.001); tone('triangle', 215, 190, t, 0.04, 0.12 * v, music, 0.001); }
  function motohat(t, v = 1, open) { noise(t, open ? 0.14 : 0.025, 0.07 * v, 'highpass', 8800, 0.8, music, 0.001); }
  function pickbass(m, t, len, v = 1) {
    const f = mtof(m), g = ac.createGain(), lp = filt('lowpass', 2400, 1.8, g), L = Math.max(0.11, len), end = t + L + 0.08;
    lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(550, t + 0.07);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.13 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.07 * v, t + 0.1); g.gain.setValueAtTime(0.07 * v, t + L); g.gain.exponentialRampToValueAtTime(0.0001, t + L + 0.04);
    g.connect(music); osc('sawtooth', f, t, end, lp); osc('sine', f, t, end, g);
    noise(t, 0.006, 0.04 * v, 'highpass', 2500, 0.7, music, 0.0003);
  }
  const COMBO = [1, 0.15, 0.6, 0.1, 0.42, 0.07, 0.3, 0.05, 0.2];
  function combo(notes, t, len, v = 1) {
    const g = ac.createGain(), end = t + len + 0.05, vib = ac.createOscillator(), vg = ac.createGain();
    vib.frequency.value = 6.8; vg.gain.value = 9; vib.connect(vg); vib.start(t); vib.stop(end);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.016 * v, t + 0.004); g.gain.setValueAtTime(0.015 * v, t + Math.max(0.006, len - 0.015)); g.gain.linearRampToValueAtTime(0.0001, t + len);
    g.connect(music); notes.forEach(m => vg.connect(posc('combo', COMBO, mtof(m), t, end, g).detune));
  }
  Object.assign(LEADS, {
    moog: { o: [['sawtooth', 1, -5, 0.5], ['sawtooth', 1, 5, 0.45], ['square', 0.5, 0, 0.3]], lp: [300, 4200, 900], q: 6, vib: 0.006, g: 0.05, a: 0.006, glide: 0.035 },
  });
  // The German battle: motorik drive (154 bpm, D minor; Krautrock's autobahn beat with the Neue Deutsche Welle's punch). The
  // kick on one and three, the snare on two and four, eighth-note hats that never let up, a picked bass hammering eighths
  // with octave jumps, a combo organ chopping the offbeats, and a Moog-style lead with the hook: up the D minor chord in
  // eighths, a snap back down, and the same shape up a step each time the chords move. A' adds a glockenspiel answering in
  // the gaps and a busier kick; B lifts to F major, half time for four bars, then drives back in with a snare build.
  // Count-in 1 (four stick clicks, the Moog sliding up) · A 8 · A' 8 · B 8. A: Dm Dm Bb C Dm Dm Gm A7 · A' as A ·
  // B: F C Dm Bb F C Bb A7
  SONGS.battle_de = { bpm: 154, len: 400, from: 16, swing: 0, vol: 0.52, verb: 0.06, echo: 0.14, echoSteps: 3,
    D: (() => {
      const Dm = 'D2: F3 A3 D4', Bb = 'Bb1: F3 Bb3 D4', Cc = 'C2: E3 G3 C4', Gm = 'G1: G3 Bb3 D4', A7 = 'A1: G3 C#4 E4', Ff = 'F2: F3 A3 C4';
      const A = [Dm, Dm, Bb, Cc, Dm, Dm, Gm, A7];
      const C = CH([...A, ...A, Ff, Cc, Dm, Bb, Ff, Cc, Bb, A7].join(','));
      const h2 = 'D5/2 F5/2 A5/2 D6/2 C6/1 A5/1 r/2 G5/2 A5/2 | F5/3 E5/3 D5/2 r/4 A4/2 C5/2 | ';
      const hook = h2 + 'D5/2 F5/2 Bb5/2 D6/2 C6/1 Bb5/1 r/2 A5/2 Bb5/2 | G5/3 F5/3 E5/2 r/4 E5/2 F5/2 | ' + h2 +
        'G5/2 Bb5/2 D6/2 G6/2 F6/1 D6/1 r/2 C6/2 Bb5/2 | A5/3 C#6/3 E6/2 G6/4 E6/2 C#6/2 | ';
      const L = mel(hook + hook + 'A5/6 C6/2 F6/8 | E6/6 D6/2 C6/8 | D6/4 F6/4 A6/4 G6/2 F6/2 | F6/8 D6/4 Bb5/4 | ' +
        'A5/2 C6/2 F6/4 G6/2 A6/2 G6/2 F6/2 | E6/4 G6/4 C6/8 | D6/4 C6/2 Bb5/2 A5/4 G5/4 | C#6/8 E6/4 A5/4');
      const g2 = 'r/8 A6/2 D7/2 C7/2 A6/2 | F6/4 r/4 E6/2 F6/2 A6/4 | ';
      const GL = mel('r/16 | '.repeat(8) + g2 + 'r/8 Bb6/2 D7/2 C7/2 Bb6/2 | G6/4 r/4 E6/2 G6/2 C7/4 | ' + g2 + 'r/8 G6/2 Bb6/2 D7/2 G7/2 | E7/4 C#7/4 A6/8');
      return { C, L, GL, K0: pat('x.......x.....x.'), K1: pat('x.....x.x.....x.'), TOM: { 12: 196, 13: 165, 14: 147, 15: 123 } };
    })(),
    play(i, t, s16) {
      const D = this.D;
      if (i < 16) {   // count-in: four stick clicks ("eins, zwei, drei, vier"), the Moog sliding up an octave into the hook
        if (!(i & 3)) rim(t, 0.7 + i * 0.02);
        if (i === 12) { lead(50, t, s16 * 1.5, 'moog', 0.7); lead(62, t + s16 * 2, s16 * 1.5, 'moog', 0.8); }
        if (i === 14) motokick(t, 0.8);
        return;
      }
      const j = i - 16, bar = j >> 4, s = j & 15, A2 = bar >= 8 && bar < 16, B = bar >= 16, half = bar >= 16 && bar < 20, C = D.C[bar];
      const R = C[0] < 33 ? C[0] + 12 : C[0], nR0 = D.C[(bar + 1) % 24][0], nR = nR0 < 33 ? nR0 + 12 : nR0;
      const fill = (bar === 7 || bar === 15) && s >= 12, roll = bar === 23 && s >= 8;
      if (fill) { if (bar === 7) tom(t, D.TOM[s], 0.9); else motosnare(t, 0.4 + (s - 12) * 0.15); if (s === 12) motokick(t, 0.9); }
      else if (half) {          // B's first half: half time, the hats on the beat, the organ held
        if (s === 0 || s === 10) motokick(t, 1); if (s === 8) motosnare(t, 1);
        if (!(s & 3)) motohat(t, 0.6, s === 12);
      } else {
        if ((A2 || B ? D.K1 : D.K0)[s]) motokick(t, s === 0 ? 1 : 0.85);
        if (roll) motosnare(t, 0.3 + (s - 8) * 0.08); else if (s === 4 || s === 12) motosnare(t, 1);
        if (A2 || B) motohat(t, s & 1 ? 0.35 : 0.8, s === 14 && (bar & 1)); else if (!(s & 1)) motohat(t, s & 2 ? 0.85 : 0.6, s === 14 && (bar & 3) === 3);
      }
      if (s === 0 && (bar === 0 || bar === 8 || bar === 16 || bar === 20)) crash(t, 0.65);
      // the picked bass: eighths, an octave up on the "and"s of one and three, the last one leading to the next chord (B's first half: halves)
      if (half) { if (s === 0) pickbass(R, t, 7 * s16, 1); else if (s === 8) pickbass(R + 7, t, 7 * s16, 0.9); }
      else if (!(s & 1) && !(fill && s > 12)) pickbass(s === 14 ? (nR === R ? R + 10 - 12 : nR - 1) : R + (s === 2 || s === 10 ? 12 : 0), t, s16 * 1.7, s === 0 ? 1 : 0.8);
      // the combo organ: chopped offbeats, held chords in B's first half
      if (half) { if (s === 0) combo(C.slice(1).map(m => m + 12), t, 15 * s16, 0.9); }
      else if ((s & 3) === 2 && !fill) combo(C.slice(1).map(m => m + 12), t, s16 * 0.8, 0.85);
      const n = D.L[j]; if (n) lead(n[0], t, n[1] * s16 * 0.9, 'moog', 0.95);
      const g = D.GL[j]; if (g) glock(g[0], t, 0.9);
    } };
  // ------------------------------------------------------------ the German boss's instruments (acid techno)
  // a 909-style kit (a kick that punches then booms, a clap of three bursts and a tail, a metallic open hat from six square
  // waves, crisp closed hats); the 303-style acid bass (one saw through a squelchy resonant filter: an accent opens it wider
  // and plays louder, a slide glides into the note without a new pluck; cut: how far the filter is open, 0..1); a rave stab
  // (a chord of detuned saws over squares an octave down); the Kling Klang clank (struck sheet metal); and, in LEADS, a big
  // detuned rave lead that scoops up into its notes
  function k909(t, v = 1) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(230, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.07); o.frequency.exponentialRampToValueAtTime(44, t + 0.4);
    env(g, t, 0.6 * v, 0.002, 0.42); o.connect(crunch(g, 1.3)); g.connect(music); o.start(t); o.stop(t + 0.48);
    noise(t, 0.006, 0.12 * v, 'highpass', 2500, 0.7, music, 0.0004);
  }
  function cl909(t, v = 1) { [0, 0.011, 0.022].forEach(d => noise(t + d, 0.012, 0.15 * v, 'bandpass', 1150, 1.4, music, 0.0005)); noise(t + 0.033, 0.16, 0.13 * v, 'bandpass', 1250, 1.1, music, 0.001); }
  const METAL = [205.3, 304.4, 369.6, 522.7, 540, 800];
  function oh909(t, v = 1) {
    const g = ac.createGain(), bp = filt('bandpass', 9500, 0.9, g), hp = filt('highpass', 7000, 0.7, bp), end = t + 0.34;
    env(g, t, 0.05 * v, 0.001, 0.26); g.connect(music);
    METAL.forEach(f => osc('square', f * 1.7, t, end, hp));
  }
  function ch909(t, v = 1) { noise(t, 0.03, 0.06 * v, 'highpass', 9000, 0.8, music, 0.0005); }
  let lastAcid = 0;
  function acid(m, t, len, v = 1, acc = 0, slide = 0, cut = 1) {
    const f = mtof(m), o = ac.createOscillator(), f1 = filt('lowpass', 400, 11), f2 = filt('lowpass', 400, 1), g = ac.createGain(), end = t + len + 0.08;
    o.type = 'sawtooth';
    if (slide && lastAcid) { o.frequency.setValueAtTime(lastAcid, t); o.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.06, len * 0.6)); } else o.frequency.value = f;
    lastAcid = f;
    const base = 160 + 480 * cut, peak = base + (700 + 2300 * acc) * cut;
    [f1, f2].forEach(fl => { fl.frequency.setValueAtTime(slide ? base + (peak - base) * 0.4 : peak, t); fl.frequency.exponentialRampToValueAtTime(base, t + 0.12 + 0.1 * acc); });
    const pk = (0.05 + 0.03 * acc) * v;
    g.gain.setValueAtTime(slide ? pk * 0.9 : 0.0001, t); if (!slide) g.gain.linearRampToValueAtTime(pk, t + 0.003); g.gain.setValueAtTime(pk * 0.85, t + Math.max(0.005, len - 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.04);
    o.connect(f1); f1.connect(f2); f2.connect(g); g.connect(music); o.start(t); o.stop(end);
  }
  function stab(notes, t, len, v = 1, cut = 1) {
    const g = ac.createGain(), lp = filt('lowpass', 2400 * cut, 2, g), end = t + len + 0.1;
    lp.frequency.setValueAtTime(3800 * cut + 200, t); lp.frequency.exponentialRampToValueAtTime(900 * cut + 200, t + Math.max(0.08, len));
    env(g, t, 0.02 * v, 0.003, len); g.connect(music); g.connect(echoIn);
    notes.forEach((m, k) => { osc('sawtooth', mtof(m), t, end, lp, -9 + k * 6); osc('square', mtof(m) / 2, t, end, lp, 4); });
  }
  function clank(t, v = 1) { [[1, 0.04, 0.3], [2.43, 0.025, 0.18], [3.9, 0.015, 0.1]].forEach(([k, a, d]) => tone('triangle', 610 * k, 600 * k, t, d, a * v, music, 0.0005)); noise(t, 0.03, 0.08 * v, 'bandpass', 3000, 1.5, music, 0.0005); }
  Object.assign(LEADS, {
    rave: { o: [['sawtooth', 1, -14, 0.4], ['sawtooth', 1, 14, 0.4], ['sawtooth', 0.5, 0, 0.3], ['square', 2, 7, 0.08]], lp: [1200, 3400, 2000], q: 1, vib: 0.01, g: 0.04, a: 0.04, scoop: -70 },
  });
  // The German boss: acid techno (140 bpm, A Phrygian: A minor with a dark Bb), the Berlin warehouse. A 909-style kit four
  // on the floor, a clap on two and four, open hats on the offbeats; the hook is the 303-style acid line ("A, A, up an
  // octave, A, G!…" sliding and squelching); rave stabs on its accents, a clank of sheet metal. The build: the kick and the
  // acid with its filter shut, opening bar by bar; then the claps roll faster (quarters, eighths, sixteenths, thirty-seconds)
  // under a riser while the kick fades and drops out for the last bar, a breath… the drop. B: a big rave lead sings over it. A breakdown (held
  // stabs, the acid low and slow, no kick), a second build, the drop with everything.
  // Bars: build 8 (4 with the kick, 4 rolling) · drop 8 · B 8 · breakdown 4 · build 4 · drop 8 (the loop starts at B).
  SONGS.boss_de = { bpm: 140, len: 640, from: 256, swing: 0.02, vol: 0.46, verb: 0.07, echo: 0.16, echoSteps: 3,
    D: (() => {
      // the acid line: note, ! an accent, ~ a slide, . a rest; two bars
      const parse = s => s.trim().split(/\s+/).map(x => x === '.' ? null : [nn(x.replace(/[!~]/g, '')), x.includes('!') ? 1 : 0, x.includes('~') ? 1 : 0]);
      const AC = [parse('A1! . A2~ A1 G2! . C3~ A1 A1! E2 A2~ . Bb1! A1 E3!~ D3'), parse('A1! . A2~ A1 G2! . C3~ A1 A1! E2 A2~ . C2! A1 G2~ Bb2!')];
      const AC2 = [parse('A1! A2 . A1 C3!~ A1 . A2 G2! . E2~ A1 Bb1! . A2~ C3'), parse('A1! A2 . A1 C3!~ A1 . A2 E3! D3~ C3 A2 G2! . E2~ G2')];
      const LEAD = mel('A5/4 C6/4 E6/6 D6/2 | C6/4 B5/4 A5/8 | G5/4 A5/4 Bb5/6 A5/2 | G5/4 E5/4 A5/8 | A5/4 C6/4 E6/6 D6/2 | C6/4 B5/4 A5/8 | G5/4 A5/4 Bb5/6 A5/2 | G5/4 Bb5/4 A5/8');
      return { AC, AC2, LEAD, Am: N('A3 C4 E4 G4'), Bb: N('Bb3 D4 F4 A4'), ST: pat('...x......x.....') };
    })(),
    play(i, t, s16) {
      const D = this.D, bar = i >> 4, s = i & 15;
      const intro = bar < 4, roll = (bar >= 4 && bar < 8) || (bar >= 28 && bar < 32), drop = (bar >= 8 && bar < 16) || bar >= 32, B = bar >= 16 && bar < 24, down = bar >= 24 && bar < 28;
      const rb = bar < 8 ? bar - 4 : bar - 28;          // which bar of a roll (0–3)
      if (roll && rb === 3 && s >= 12) return;           // the breath before the drop
      if (s === 0 && (bar === 8 || bar === 32)) { crash(t, 1); stab(D.Am, t, 4 * s16, 1.2); }
      if (s === 0 && bar === 16) crash(t, 0.6);
      // the kick: four on the floor (softer in the intro and the roll; not in the breakdown, nor the last bar of a roll)
      if (!(s & 3) && !down && !(roll && rb === 3)) k909(t, intro ? 0.6 + bar * 0.06 : roll ? (rb === 2 ? 0.55 : 0.8) : 1);
      // claps: on two and four (from the intro's third bar), or rolling ever faster into the drop
      if (roll) { const every = [4, 2, 1, 1][rb]; if (!(s % every)) { cl909(t, 0.35 + (rb * 16 + s) * 0.012); if (rb === 3) cl909(t + s16 / 2, 0.4 + s * 0.03); } }
      else if ((s === 4 || s === 12) && !(intro && bar < 2)) cl909(t, down ? 0.7 : intro ? 0.6 : 1);
      else if (s === 15 && (bar & 1) && (drop || B)) cl909(t, 0.4);
      // hats: closed sixteenths, open on the offbeats once it's going
      if (!down) { if (!intro || bar >= 2) ch909(t, s & 1 ? 0.4 : 0.7); if ((s & 3) === 2 && (drop || B)) oh909(t, 0.9); }
      if ((drop || B) && s === 14 && (bar & 1)) clank(t, 0.9);
      if (roll && rb >= 2 && s === 0) swell(t, (rb === 2 ? 28 : 12) * s16, 2.4);
      // the acid line: its filter opens through the intro and the rolls; low and slow in the breakdown
      const ac2 = B || bar >= 36, pat2 = (ac2 ? D.AC2 : D.AC)[bar & 1], a = pat2[s];
      const cut = intro ? 0.12 + bar * 0.1 : roll ? 0.5 + (rb * 16 + s) / 64 * 0.5 : down ? 0.25 : 1;
      if (a && !(down && (s & 1))) acid(a[0], t, s16 * (a[2] ? 1.1 : 0.85), down ? 1.3 : intro ? 0.8 : roll && rb >= 2 ? 1.35 : 1, down ? 0 : a[1], a[2], cut);
      // the stabs: on the acid's syncopations (Bb on the fourth bar's turnaround); held and dark in the breakdown
      if ((drop || B) && D.ST[s]) stab((bar & 3) === 3 && s === 10 ? D.Bb : D.Am, t, 1.5 * s16, 0.9);
      if (down && s === 0) stab(bar & 1 ? D.Bb : D.Am, t, 15 * s16, 1.6, 0.5);
      // the rave lead: B, and the last drop (doubled an octave down)
      if (B || bar >= 32) { const n = D.LEAD[(i - (B ? 256 : 512)) % 128]; if (n) { lead(n[0], t, n[1] * s16 * 0.95, 'rave', 0.9); if (bar >= 32) lead(n[0] - 12, t, n[1] * s16 * 0.95, 'rave', 0.5); } }
    } };
  // ------------------------------------------------------------ the Chinese battle's instruments (yangqin and sheng funk)
  // the yangqin (a hammered dulcimer: two strings to a note struck with bamboo hammers, a bright metallic ring; trem: the
  // hammers' fast tremolo on a long note); the sheng (a mouth organ of reeds, played in chords: reedy, breathy, swelling a
  // little); an FM bass (the 16-bit console kind: a bright pluck that mellows); and a tight funk kit (a short punchy kick, a
  // high piccolo snare, crisp hats) with the bangu's dry "da!" (the opera's little drum)
  const YANG = [1, 0.5, 0.42, 0.2, 0.16, 0.08, 0.06, 0.04];
  function yangqin(m, t, v = 1, len = 0.6, trem = false) {
    const f = mtof(m), L = Math.max(0.25, len), g = ac.createGain(), lp = filt('lowpass', Math.min(9000, f * 8), 0.7, g), end = t + L + 0.3;
    lp.frequency.setValueAtTime(Math.min(10000, f * 10), t); lp.frequency.exponentialRampToValueAtTime(Math.max(900, f * 3), t + 0.25);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.04 * v, t + 0.0015);
    if (trem) { const dt = 1 / 15; g.gain.exponentialRampToValueAtTime(0.014 * v, t + dt * 0.9); for (let k = 1; k * dt < L; k++) { const tk = t + k * dt; g.gain.setValueAtTime(0.024 * v, tk); g.gain.exponentialRampToValueAtTime(0.012 * v, tk + dt * 0.9); } }
    else g.gain.exponentialRampToValueAtTime(0.015 * v, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + L + 0.25);
    g.connect(music); posc('yang', YANG, f, t, end, lp, -4); posc('yang', YANG, f, t, end, lp, 5);
    noise(t, 0.006, 0.03 * v, 'highpass', 5000, 0.7, music, 0.0003);
  }
  const SHENG = [1, 0.35, 0.5, 0.2, 0.32, 0.12, 0.2, 0.08, 0.12];
  function sheng(notes, t, len, v = 1) {
    const g = ac.createGain(), lp = filt('lowpass', 2600, 0.9, g), end = t + len + 0.1;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.012 * v, t + 0.03); g.gain.linearRampToValueAtTime(0.016 * v, t + Math.max(0.035, len * 0.8)); g.gain.linearRampToValueAtTime(0.0001, t + len + 0.06);
    g.connect(music); notes.forEach((m, k) => posc('sheng', SHENG, mtof(m), t, end, lp, k * 3 - 3));
    noise(t, Math.min(len, 0.15), 0.012 * v, 'bandpass', 2000, 1, music, 0.02);
  }
  function fmbass(m, t, len, v = 1) {
    const f = mtof(m), c = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain(), L = Math.max(0.08, len), end = t + L + 0.06;
    c.frequency.value = f; mo.frequency.value = f; mg.gain.setValueAtTime(f * 3.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.4, t + 0.12);
    mo.connect(mg); mg.connect(c.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.2 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.11 * v, t + 0.08); g.gain.setValueAtTime(0.11 * v, t + L); g.gain.exponentialRampToValueAtTime(0.0001, t + L + 0.04);
    c.connect(g); g.connect(music); c.start(t); mo.start(t); c.stop(end); mo.stop(end);
  }
  function zkick(t, v = 1) { tone('sine', 150, 48, t, 0.2, 0.62 * v, music, 0.0015); noise(t, 0.008, 0.08 * v, 'highpass', 3000, 0.7, music, 0.0004); }
  function picsnare(t, v = 1) { noise(t, 0.08, 0.2 * v, 'bandpass', 3200, 0.9, music, 0.0008); tone('triangle', 330, 300, t, 0.04, 0.12 * v, music, 0.0008); }
  function bangu(t, v = 1) { tone('sine', 1650, 1450, t, 0.025, 0.07 * v, music, 0.0005); noise(t, 0.015, 0.06 * v, 'bandpass', 3800, 2.5, music, 0.0004); }
  function zhat(t, v = 1, open) { noise(t, open ? 0.16 : 0.028, 0.065 * v, 'highpass', 8200, 0.9, music, 0.0008); }
  // The Chinese battle: yangqin-and-sheng funk (166 bpm, G minor pentatonic), a fast martial-arts chase. The hammered
  // dulcimer has the hook: quick pentatonic runs up and over ("di-di DA, di-di DA-di-di-da") then a ringing tremolo, the
  // same run lifted onto each new chord; the sheng punches chords in fourths like a horn section and sings B in long notes;
  // an FM bass pops underneath (16-bit console funk), the bangu cracks on the offbeats, a little gong cries "jiang!" at the
  // end of each phrase and the big one opens each part. Count-in 1 (the bangu rolling, a run up the dulcimer) · A 8 · B 8 ·
  // A' 8 (the sheng doubling the hook in fourths) · a 4-bar half-time drum break. A: Gm7 Gm7 Ebmaj7 F Gm7 Gm7 Cm7 D7 ·
  // B: Ebmaj7 F Dm7 Gm7 Ebmaj7 F Am7b5 D7 · A' as A · break: Gm7 Gm7 Gm7 D7
  SONGS.battle_zh = { bpm: 166, len: 464, from: 16, swing: 0.03, vol: 0.5, verb: 0.07, echo: 0.1, echoSteps: 3,
    D: (() => {
      // each chord: [bass root, its third, its seventh (intervals)], and the sheng's voicing in fourths
      const CHD = { Gm: [31, 3, 10, N('D4 G4 C5')], Eb: [39, 4, 11, N('D4 G4 Bb4')], F: [29, 4, 10, N('C4 F4 A4')], Cm: [36, 3, 10, N('Eb4 G4 C5')], D7: [38, 4, 10, N('C4 F#4 A4')],
        Dm: [38, 3, 10, N('C4 F4 A4')], Am: [33, 3, 10, N('Eb4 G4 C5')] };
      const A = ['Gm', 'Gm', 'Eb', 'F', 'Gm', 'Gm', 'Cm', 'D7'];
      const PROG = [...A, 'Eb', 'F', 'Dm', 'Gm', 'Eb', 'F', 'Am', 'D7', ...A, 'Gm', 'Gm', 'Gm', 'D7'].map(k => CHD[k]);
      const y2 = 'D5/1 F5/1 G5/2 Bb5/1 C6/1 D6/2 C6/1 Bb5/1 G5/2 F5/2 G5/2 | D6/4 C6/2 Bb5/2 G5/4 r/4 | ';
      const hook = y2 + 'Bb5/1 C6/1 D6/2 F6/1 G6/1 F6/2 D6/1 C6/1 Bb5/2 G5/2 Bb5/2 | C6/4 A5/2 F5/2 G5/4 A5/4 | ' + y2 +
        'G5/1 Bb5/1 C6/2 Eb6/1 F6/1 G6/2 F6/1 Eb6/1 C6/2 Bb5/2 C6/2 | D6/2 F#6/2 A6/2 C7/2 A6/2 F#6/2 D6/4 | ';
      const L = mel(hook + 'r/16 | '.repeat(8) + hook + 'r/16 | r/16 | G5/16 | r/8 D6/4 G6/4');
      const S = mel('r/16 | '.repeat(8) + 'G5/6 F5/2 D5/4 Bb4/4 | C5/6 D5/2 F5/8 | A5/6 G5/2 F5/4 D5/4 | G5/12 r/4 | Bb5/6 C6/2 D6/4 Bb5/4 | C6/6 A5/2 F5/8 | Eb6/4 D6/4 C6/4 A5/4 | F#5/8 A5/4 D6/4');
      // the bass's bar: [step, interval ('3': this chord's third an octave up, '7': its seventh), sixteenths, level]
      const BT = [[0, 0, 2, 1], [2, 12, 1, 0.7], [3, 0, 1, 0.8], [6, '7', 1, 0.75], [7, 12, 1, 0.8], [8, '3', 2, 0.9], [10, 0, 1, 0.75], [12, 7, 2, 0.85], [14, '7', 2, 0.8]];
      return { PROG, L, S, BT, K0: pat('x.....x...x.....'), K1: pat('x.....x...x..x..'), BG: pat('...x.......x..x.'), STAB: pat('..x....x..x.....') };
    })(),
    play(i, t, s16) {
      const D = this.D;
      if (i < 16) {   // count-in: the bangu rolling faster, then the big gong and a run up the dulcimer
        if (i < 12 && (i >= 6 || !(i & 1))) bangu(t, 0.5 + i * 0.04);
        if (i === 12) { luo(t, false, 0.9); zkick(t, 1); [55, 58, 60, 62, 65, 67, 70, 74].forEach((m, k) => yangqin(m, t + k * 0.035, 0.5 + k * 0.05, 0.3)); }
        if (i === 14) zkick(t, 0.9); if (i === 15) picsnare(t, 0.8);
        return;
      }
      const j = i - 16, bar = j >> 4, s = j & 15, B = bar >= 8 && bar < 16, A2 = bar >= 16 && bar < 24, brk = bar >= 24, P = D.PROG[bar];
      const R = P[0] < 33 ? P[0] + 12 : P[0];
      const fill = (bar === 7 || bar === 15 || bar === 23) && s >= 12;
      if (fill) { zkick(t, s === 12 ? 1 : 0); picsnare(t, 0.5 + (s - 12) * 0.15); if (s === 14) bangu(t, 1); }
      else if (brk) {          // the break: half time, toms of bangu and gongs, the bass alone with the drums
        if (s === 0 || s === 10) zkick(t, 1); if (s === 8) picsnare(t, 1); if (!(s & 3)) zhat(t, 0.5);
        if (s === 6 || s === 7 || s === 14) bangu(t, 0.9); if (s === 0 && !(bar & 1)) luo(t, false, 0.7); if (s === 12 && (bar & 1)) luo(t, true, 0.8);
      } else {
        if ((bar & 1 ? D.K1 : D.K0)[s]) zkick(t, s ? 0.85 : 1);
        if (s === 4 || s === 12) picsnare(t, 1); else if (s === 7 || s === 9 || s === 15) picsnare(t, 0.13);
        if (B) zhat(t, (s & 3) === 2 ? 0.8 : 0.3, (s & 3) === 2); else zhat(t, s & 1 ? 0.35 : s & 2 ? 0.85 : 0.6, s === 14 && (bar & 1));
        if (!B && D.BG[s]) bangu(t, 0.75);
        if (s === 12 && (bar & 3) === 3) luo(t, true, 0.7);          // the little gong: "jiang!"
      }
      if (s === 0 && (bar === 0 || bar === 8 || bar === 16)) { luo(t, false, 0.75); crash(t, 0.45); }
      // the FM bass
      for (const [st, iv, l, v] of D.BT) if (st === s && !(fill && s > 12)) fmbass(R + (iv === '3' ? 12 + P[1] : iv === '7' ? P[2] : iv), t, l * s16 * 0.9, v);
      // the sheng: chords in fourths punching the syncopations (A), its melody in fourths (B), a swell into the loop (the break)
      if (!B && !brk && !fill && D.STAB[s]) sheng(P[3], t, s16 * 1.2, s === 2 ? 1 : 0.8);
      const sm = D.S[j]; if (sm) sheng([sm[0], sm[0] - 5], t, sm[1] * s16 * 0.95, 1.1);
      if (brk && bar === 27 && s === 0) sheng(D.PROG[0][3], t, 15 * s16, 1.2);
      // the yangqin: the hook (ringing tremolo on its long notes), arpeggios under B, the sheng doubling it in A'
      const n = D.L[j];
      if (n) { yangqin(n[0], t, 1, n[1] * s16 * 1.2, n[1] >= 4); if (A2 && n[1] >= 2) sheng([n[0] - 12, n[0] - 17], t, n[1] * s16 * 0.9, 0.55); }
      if (B && !(s & 1)) { const ch = P[3]; yangqin(ch[(s >> 1) % ch.length] + 12, t, 0.4, 0.3); }
    } };
  // ------------------------------------------------------------ the Chinese boss's instruments (Peking opera martial, then funk-rock)
  // the opera's band: the ban (wooden clappers: a sharp "ka"), the bangu (from the battle theme), the big and little gongs
  // (luo) and the cymbals (naobo); a big rock kit for the drop (a kick that booms, a snare that slams in a room); a fat synth
  // bass (a pulse and a sine under a filter that goes "bwow"); and, in LEADS, the jinghu (the opera's high fiddle: thin,
  // piercing, sliding, a quick narrow vibrato)
  function ban(t, v = 1) { tone('triangle', 2400, 2100, t, 0.018, 0.06 * v, music, 0.0004); noise(t, 0.012, 0.08 * v, 'bandpass', 3000, 3, music, 0.0004); }
  function bigkick(t, v = 1) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.09);
    env(g, t, 0.62 * v, 0.002, 0.36); o.connect(crunch(g, 1.5)); g.connect(music); o.start(t); o.stop(t + 0.42);
    noise(t, 0.01, 0.1 * v, 'highpass', 2800, 0.7, music, 0.0005);
  }
  function slam(t, v = 1) { noise(t, 0.28, 0.25 * v, 'bandpass', 1000, 0.5, music, 0.001); noise(t, 0.1, 0.12 * v, 'highpass', 5000, 0.7, music, 0.0005); tone('triangle', 180, 140, t, 0.1, 0.2 * v, music, 0.001); }
  function junobass(m, t, len, v = 1) {
    const f = mtof(m), g = ac.createGain(), lp = filt('lowpass', 300, 4, g), L = Math.max(0.08, len), end = t + L + 0.08;
    lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(1900, t + 0.015); lp.frequency.exponentialRampToValueAtTime(420, t + 0.16);
    env(g, t, 0.15 * v, 0.003, L); g.connect(music); osc('pulse', f, t, end, lp); osc('sine', f, t, end, lp);
  }
  Object.assign(LEADS, {
    jinghu: { o: [['sawtooth', 1, 0, 0.55], ['pulse', 1, 4, 0.3], ['sawtooth', 2, -3, 0.1]], lp: [2000, 6500, 4200], q: 3, vib: 0.016, g: 0.04, a: 0.025, scoop: -90, glide: 0.05 },
  });
  // The Chinese boss: a Peking-opera fight scene that drops into funk-rock (176 bpm, D minor pentatonic). The build is the
  // opera's percussion and its fiddle: the big gong and the clappers, the bangu speeding up, the jinghu's quick sliding
  // phrase; then 急急风, "the rapid wind" (the roll the opera plays for chases and fights): the bangu in a continuous roll,
  // the cymbals on every beat, the gongs crossing; a kick rising under it, a riser, a breath… the drop: a big kick and a
  // slamming snare, a fat bass riff, the jinghu screaming the hook ("la-do-RE do-la, sol-la-DO"), the cymbals and the
  // little gong punctuating. B is call and response: the jinghu sings two bars, the opera band answers two. A breakdown
  // (the gongs alone, the fiddle in long notes), the rapid wind again, the drop. Bars: build 8 · drop 8 · B 8 ·
  // breakdown 4 · build 4 · drop 8 (the loop starts at B). Chords: Dm Dm Bb C Dm Dm Bb C (round and round).
  SONGS.boss_zh = { bpm: 176, len: 640, from: 256, swing: 0, vol: 0.45, verb: 0.08, echo: 0.1, echoSteps: 3,
    D: (() => {
      const h3 = 'A5/2 C6/1 D6/1 C6/2 A5/2 G5/2 A5/2 C6/4 | D6/2 F6/2 D6/2 C6/2 A5/4 G5/2 F5/2 | G5/2 A5/1 C6/1 A5/2 G5/2 F5/2 G5/2 A5/4 | ';
      const HOOK = mel(h3 + 'D5/4 F5/2 G5/2 A5/8 | ' + h3 + 'C6/2 D6/2 F6/2 G6/2 A6/8');
      const CALL = mel('D6/1 F6/1 G6/2 A6/4 G6/2 F6/2 D6/4 | C6/2 D6/2 F6/2 D6/2 C6/2 A5/2 G5/4 | r/16 | r/16 | ' +
        'A5/1 C6/1 D6/2 F6/4 D6/2 C6/2 A5/4 | G5/2 A5/2 C6/2 A5/2 G5/2 F5/2 D5/4 | r/16 | r/16');
      // the jinghu's phrase in the build (the opera's 过门, a fiddle interlude), and its long notes in the breakdown
      const GM = mel('r/16 | r/16 | A5/1 C6/1 A5/1 G5/1 A5/2 C6/2 D6/4 C6/2 A5/2 | G5/1 A5/1 G5/1 F5/1 D5/4 F5/2 G5/2 A5/4 | ' +
        'D6/2 D6/2 C6/2 A5/2 D6/2 D6/2 C6/2 A5/2 | F6/2 F6/2 D6/2 C6/2 F6/2 F6/2 D6/2 C6/2 | A6/4 G6/4 F6/4 D6/4 | A6/16');
      const SLOW = mel('D6/16 | C6/8 A5/8 | F6/16 | G6/8 A6/8');
      const riff = (r, a, b, c, d) => `${r}/2 ${r}/1 ${r}/1 r/2 ${a}/2 ${b}/2 r/2 ${c}/1 ${d}/1 ${c}/2 | `;
      const dm = riff('D2', 'F2', 'G2', 'A2', 'C3'), BASS = mel(dm + dm + riff('Bb1', 'D2', 'F2', 'G2', 'A2') + riff('C2', 'E2', 'G2', 'A2', 'Bb2'));
      // the opera band's answer (two bars): C all together ("cang!"), c the cymbals, t the little gong, r the bangu rolling
      const ANS = { 0: 'C', 4: 'c', 8: 'ct', 10: 'c', 12: 'C', 16: 't', 18: 't', 20: 'C', 24: 'r', 25: 'r', 26: 'r', 27: 'r', 28: 'C' };
      return { HOOK, CALL, GM, SLOW, BASS, ANS, K0: pat('x.....x.x.....x.'), K1: pat('x.x...x.x..x....') };
    })(),
    play(i, t, s16) {
      const D = this.D, bar = i >> 4, s = i & 15;
      const build = bar < 8 || (bar >= 28 && bar < 32), wind = (bar >= 4 && bar < 8) || (bar >= 28 && bar < 32), drop = (bar >= 8 && bar < 16) || bar >= 32;
      const B = bar >= 16 && bar < 24, down = bar >= 24 && bar < 28, wb = bar < 8 ? bar - 4 : bar - 28;        // which bar of the rapid wind (0–3)
      const cang = (v, big) => { naobo(t, v, 0.3); if (big) luo(t, false, v); bangu(t, v); };
      if (wind && wb === 3 && s >= 14) { if (s === 14) { cang(1, true); bigkick(t, 1); } return; }          // "cang!", then a breath
      if (s === 0 && (bar === 8 || bar === 32)) { naobo(t, 1, 0.6); luo(t, false, 1); bigkick(t, 1.1); }
      if (build && !wind) {          // the opera's opening: the big drum and the big gong, the clappers on the beat, the bangu speeding up
        if (s === 0) luo(t, false, 1.2); if (!(s & 3)) ban(t, s ? 1 : 1.4);
        if (s === 0 || s === 8 || (bar >= 2 && s === 14)) tanggu(t, 0.7 + bar * 0.08);
        const dens = bar === 0 ? 8 : bar === 1 ? 4 : 2; if (!(s % dens) || (bar >= 2 && s >= 12)) bangu(t, 0.9 + bar * 0.1);
        if (s === 12 && (bar & 1)) cang(1, true); else if (s === 4 && bar >= 1) naobo(t, 0.6, 0.2);
      }
      if (wind) {                    // 急急风: the bangu's roll, cymbals on every beat, the gongs crossing, a kick rising underneath
        bangu(t, 0.55 + (wb * 16 + s) * 0.006); if (wb === 3) bangu(t + s16 / 2, 0.5 + s * 0.02);
        if (!(s & 3)) naobo(t, 0.55 + wb * 0.1, 0.15); if (s === 0 || s === 8) luo(t, false, 0.7); if ((s & 3) === 2) luo(t, true, 0.35 + wb * 0.08);
        if (wb < 2 && !(s & 3)) tanggu(t, 0.75 + wb * 0.15 + s * 0.01);          // (the big drum carries it until the kick comes in)
        if (wb >= 2 && (wb === 3 || !(s & 1))) bigkick(t, 0.35 + (wb - 2) * 0.25 + s * 0.015);
        if (wb >= 2 && s === 0) swell(t, (wb === 2 ? 30 : 14) * s16, 1.1);
        if (wb === 3 && s >= 8) slam(t, 0.3 + (s - 8) * 0.1);
      }
      if (drop || B) {               // the drop: a big kick, a slam on two and four, eighth hats, the gongs punctuating
        if ((bar & 1 ? D.K1 : D.K0)[s]) bigkick(t, s ? 0.85 : 1);
        if (s === 4 || s === 12) slam(t, 1); else if (s === 15 && (bar & 1)) slam(t, 0.2);
        if (!(s & 1)) zhat(t, s & 2 ? 0.8 : 0.5, s === 14);
        if (s === 0 && !(bar & 1) && bar !== 8 && bar !== 32) naobo(t, 0.7, 0.35);
        if (s === 14 && (bar & 1)) luo(t, true, 0.6);
        if (s === 15) bangu(t, 0.7);
        const b = D.BASS[(i - (bar >= 32 ? 512 : 128)) % 64]; if (b) junobass(b[0], t, b[1] * s16 * 0.9, 1);
      }
      if (down) {                    // the breakdown: the gongs alone, slowly; a low drone; the fiddle's long notes
        if (s === 0) { luo(t, false, 1.1); tanggu(t, 0.8); } if (s === 6 || s === 10) luo(t, true, 0.6); if (s === 12) ban(t, 1); if (s === 14 || s === 15) bangu(t, 0.8);
        if (s === 0) junobass(38, t, 15 * s16, 0.9);
        const n = D.SLOW[(i - 384) % 64]; if (n) lead(n[0], t, n[1] * s16 * 0.95, 'jinghu', 1);
      }
      // the jinghu: its phrases in the build, the hook in the drops, call and response in B (the band answers)
      if (build && bar < 8) { const n = D.GM[i]; if (n) lead(n[0], t, n[1] * s16 * 0.92, 'jinghu', 0.9); }
      if (bar >= 28 && bar < 32) { const n = D.GM[i - 448 + 64]; if (n) lead(n[0], t, n[1] * s16 * 0.92, 'jinghu', 0.9); }
      if (drop) { const n = D.HOOK[(i - (bar >= 32 ? 512 : 128)) % 128]; if (n) lead(n[0], t, n[1] * s16 * 0.92, 'jinghu', 1); }
      if (B) {
        const n = D.CALL[(i - 256) % 128]; if (n) lead(n[0], t, n[1] * s16 * 0.92, 'jinghu', 1);
        const a = ((bar - 16) & 3) >= 2 && D.ANS[(i - 256) % 32];
        if (a) { if (a === 'C') cang(1, true); else if (a === 'c') naobo(t, 0.8, 0.25); else if (a === 'ct') { naobo(t, 0.8, 0.25); luo(t, true, 0.7); } else if (a === 't') luo(t, true, 0.75); else bangu(t, 0.9); }
      }
    } };
  // ------------------------------------------------------------ the Japanese battle's instruments (80s J-fusion)
  // an FM electric piano (the 80s bell-and-bark kind: a quick bright "ding" on top of a warm tone); a clean chorus guitar
  // (two strings a hair apart, chopped short or strummed); a slap bass (thumb: a deep thwack; pop: a bright snapped octave);
  // a fusion kit (a deep tight kick, a crisp snare that takes ghost notes, a splash for the unison hits; Simmons toms for
  // the fills); and, in LEADS, the EWI (the wind synth of Japanese fusion: smooth, breathy, gliding)
  function dxpiano(m, t, len, v = 1) {
    const f = mtof(m), c = ac.createOscillator(), m1 = ac.createOscillator(), m2 = ac.createOscillator(), g1 = ac.createGain(), g2 = ac.createGain(), g = ac.createGain(), L = Math.max(0.2, len), end = t + L + 0.5;
    c.frequency.value = f; m1.frequency.value = f * 14; m2.frequency.value = f;
    g1.gain.setValueAtTime(f * 1.1, t); g1.gain.exponentialRampToValueAtTime(f * 0.01, t + 0.06); g2.gain.setValueAtTime(f * 0.9, t); g2.gain.exponentialRampToValueAtTime(f * 0.15, t + 0.6);
    m1.connect(g1); m2.connect(g2); g1.connect(c.frequency); g2.connect(c.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.012 * v, t + 0.5); g.gain.setValueAtTime(0.012 * v, t + Math.max(0.51, L)); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.51, L) + 0.4);
    c.connect(g); g.connect(music); [c, m1, m2].forEach(o => { o.start(t); o.stop(end); });
  }
  function chorusgtr(notes, t, len, v = 1) {
    const g = ac.createGain(), bp = filt('bandpass', 1500, 0.6, g), lp = filt('lowpass', 3600, 0.7, bp), end = t + len + 0.06;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.014 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.006 * v, t + Math.max(0.01, len * 0.6)); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.03);
    g.connect(music); notes.forEach((m, k) => { osc('sawtooth', mtof(m), t + k * 0.004, end, lp, -8); osc('sawtooth', mtof(m), t + k * 0.004, end, lp, 9); });
  }
  function fslap(m, t, len, v = 1, pop) {
    const f = mtof(m), g = ac.createGain(), lp = filt('lowpass', 900, pop ? 3 : 1.5, g), L = Math.max(0.06, len), end = t + L + 0.06;
    lp.frequency.setValueAtTime(pop ? 5200 : 3000, t); lp.frequency.exponentialRampToValueAtTime(pop ? 1100 : 650, t + (pop ? 0.05 : 0.08));
    env(g, t, (pop ? 0.13 : 0.17) * v, 0.002, L); g.connect(music);
    const o = osc('sawtooth', f, t, end, lp); o.detune.setValueAtTime(30, t); o.detune.exponentialRampToValueAtTime(1, t + 0.04); osc('sine', f, t, end, g);
    noise(t, 0.012, (pop ? 0.09 : 0.06) * v, 'bandpass', pop ? 3500 : 1300, 2, music, 0.0004);
  }
  function fkick(t, v = 1) { tone('sine', 135, 45, t, 0.22, 0.62 * v, music, 0.0015); noise(t, 0.006, 0.07 * v, 'highpass', 3500, 0.7, music, 0.0003); }
  function fsnare(t, v = 1) { noise(t, 0.12, 0.24 * v, 'bandpass', 2200, 0.9, music, 0.0008); noise(t, 0.04, 0.08 * v, 'highpass', 7000, 0.7, music, 0.0005); tone('triangle', 250, 215, t, 0.05, 0.14 * v, music, 0.0008); }
  function splash(t, v = 1) { noise(t, 0.45, 0.07 * v, 'highpass', 6500, 0.6, music, 0.001); noise(t, 0.2, 0.04 * v, 'bandpass', 9500, 1.4, music, 0.001); }
  Object.assign(LEADS, {
    ewi: { o: [['sawtooth', 1, 0, 0.32], ['square', 1, 6, 0.28], ['sine', 1, 0, 0.45]], lp: [900, 3600, 2600], q: 1.4, vib: 0.016, g: 0.056, a: 0.028, breath: 0.03, glide: 0.035 },
  });
  // The Japanese battle: 80s J-fusion (158 bpm, F minor / Ab major), the kind of band that played on every 80s game and TV
  // show in Japan. The EWI (a wind synth) has the hook, a quick climb and a fall over the "Marunouchi" progression (IVmaj7,
  // III7, vim7: Dbmaj7 C7 Fm7) that city pop and J-pop love; a slap bass popping octaves; a clean chorus guitar chopping
  // sixteenths; an FM e-piano; a crisp fusion kit with ghost notes. B (the chorus) soars higher. Then the kime: the whole
  // band in unison on a sixteenth-note line with stops (splash! silence!), and the slap bass leads back in.
  // Count-in 1 (three unison hits, a slap pickup) · A 8 · B 8 · kime 4. A: Dbmaj9 C7b9 Fm9 Ebm9–Ab13 Dbmaj9 C7b9 Fm9 Bb13 ·
  // B: Bbm9 Eb9 Abmaj9 Dbmaj9 Gm7b5 C7b9 Fm9 C7b9 · kime: Fm9 Fm9 Dbmaj9 C7b9
  SONGS.battle_ja = { bpm: 158, len: 336, from: 16, swing: 0.05, vol: 0.56, verb: 0.1, echo: 0.12, echoSteps: 3,
    D: (() => {
      const Db = 'Db2: F3 Ab3 C4 Eb4', C7 = 'C2: E3 Bb3 Db4 G4', Fm = 'F2: Ab3 C4 Eb4 G4', Ebm = 'Eb2: Gb3 Bb3 Db4 F4', Ab7 = 'Ab1: Gb3 C4 F4', Bb7 = 'Bb1: Ab3 D4 G4';
      const Bbm = 'Bb1: Ab3 Db4 F4 C5', Eb7 = 'Eb2: G3 Db4 F4', Abj = 'Ab1: G3 C4 Eb4 Bb4', Gm = 'G1: F3 Bb3 Db4';
      const C = CH([Db, C7, Fm, Ebm, Db, C7, Fm, Bb7, Bbm, Eb7, Abj, Db, Gm, C7, Fm, C7, Fm, Fm, Db, C7].join(','));
      const AB7 = CH(Ab7)[0];                     // the second half of bar 4 (Ebm9 → Ab13)
      const e1 = 'C6/2 Eb6/1 F6/1 Ab6/2 G6/2 F6/2 Eb6/2 C6/4 | ';
      const L = mel(e1 + 'Bb5/2 C6/1 E6/1 G6/2 F6/2 E6/2 C6/2 Bb5/4 | Ab5/3 C6/3 Eb6/2 F6/4 Eb6/2 C6/2 | Db6/2 Bb5/2 Gb5/2 Bb5/2 C6/2 Eb6/2 Gb6/4 | ' +
        e1 + 'Bb5/2 C6/1 E6/1 G6/2 Bb6/2 G6/2 E6/2 C6/4 | F6/6 Eb6/2 C6/4 Ab5/4 | Ab5/2 Bb5/2 D6/2 F6/2 Ab6/4 r/4 | ' +
        'Db6/4 F6/4 Ab6/6 G6/2 | G6/4 F6/2 Eb6/2 Db6/8 | C6/4 Eb6/4 G6/6 Ab6/2 | F6/8 Eb6/4 C6/4 | Bb5/4 Db6/4 F6/6 E6/2 | G6/4 E6/2 Db6/2 C6/8 | Ab6/4 G6/4 F6/4 Eb6/4 | E6/6 G6/2 Bb6/8 | ' +
        'F5/1 Ab5/1 C6/1 Eb6/1 F6/2 r/2 F6/1 Eb6/1 C6/1 Ab5/1 F5/2 r/2 | F5/1 Ab5/1 C6/1 Eb6/1 G6/2 r/2 F6/2 r/2 Eb6/2 r/2 | ' +
        'Db6/1 F6/1 Ab6/1 C7/1 Ab6/2 r/2 F6/1 Ab6/1 F6/1 Db6/1 C6/2 r/2 | C6/2 r/2 C6/2 r/2 C6/1 Db6/1 E6/1 G6/1 Bb6/4');
      // the slap bass's bar: [step, interval, thumb (0) or pop (1)]
      const SL = [[0, 0, 0], [3, 12, 1], [4, 0, 0], [6, 12, 1], [7, 0, 0], [8, 0, 0], [10, 12, 1], [11, 10, 1], [12, 0, 0], [14, 7, 0], [15, 12, 1]];
      return { C, AB7, L, SL, KA: pat('x.....x...x..x..'), KB: pat('x.....x.x.....x.'), TOM: [220, 185, 156, 131] };
    })(),
    play(i, t, s16) {
      const D = this.D;
      if (i < 16) {   // count-in: three unison hits ("ta, ta, TA!") with the splash, then the slap bass picks up
        if (i === 0 || i === 3 || i === 6) { fkick(t, 1); fsnare(t, i === 6 ? 1 : 0.7); chorusgtr(D.C[0].slice(1).map(m => m + 12), t, s16 * (i === 6 ? 3 : 1), 1); if (i === 6) splash(t, 1); }
        if (i >= 12) fslap([41, 44, 48, 51][i - 12], t, s16 * 0.9, 0.9, i & 1);
        return;
      }
      const j = i - 16, bar = j >> 4, s = j & 15, B = bar >= 8 && bar < 16, K = bar >= 16;
      const C = bar === 3 && s >= 8 ? D.AB7 : D.C[bar], R = C[0] < 33 ? C[0] + 12 : C[0], vo = C.slice(1);
      const n = D.L[j], fill = (bar === 7 && s >= 12) || (bar === 15 && s >= 8);
      if (fill) { simtom(t, D.TOM[(s - (bar === 7 ? 12 : 8)) % 4], 0.9); if (s === 12 || s === 8) fkick(t, 0.9); }
      else if (K) {            // the kime: the kit plays the line's accents with the band, and stops when it stops
        if (n) { if (n[1] >= 2) { fkick(t, 1); fsnare(t, 0.9); if (s === 4 || s === 8 || (bar === 19 && s === 12)) splash(t, 0.8); } else hat(t, 0.5); }
      } else {
        if ((B ? D.KB : D.KA)[s]) fkick(t, s ? 0.85 : 1);
        if (s === 4 || s === 12) fsnare(t, 1); else if (s === 2 || s === 7 || s === 9 || s === 15) fsnare(t, 0.12);
        hat(t, s & 1 ? 0.25 : s & 2 ? 0.6 : 0.45, (s === 6 || s === 14) && B);
        if (B && !(s & 3)) ride(t, 0.6);
      }
      if (s === 0 && (bar === 0 || bar === 8)) crash(t, 0.6);
      // the slap bass (in the kime it doubles the line two octaves down)
      if (K) { if (n) fslap(n[0] - (n[0] >= 84 ? 36 : 24), t, n[1] * s16 * 0.8, 1, true); }
      else if (!fill || s < 12) for (const [st, iv, p] of D.SL) if (st === s) fslap(R + iv, t, s16 * (p ? 0.8 : 1.6), p ? 0.85 : 1, p);
      // the guitar chops the "e"s and "a"s in A, strums on the beats in B; the e-piano holds the chords
      if (!K && !fill) {
        if (!B) { if (s & 1) chorusgtr(vo.map(m => m + 12), t, s16 * 0.5, s === 7 || s === 15 ? 0.8 : 0.5); }
        else if (s === 0 || s === 6 || s === 10) chorusgtr(vo.map(m => m + 12), t, s16 * (s ? 2.5 : 5), 0.9);
        if (s === 0 || (bar === 3 && s === 8)) vo.forEach((m, k) => dxpiano(m + 12, t + k * 0.006, 7 * s16, 0.7));
      }
      if (K && n && n[1] >= 2) chorusgtr(vo.map(m => m + 12), t, n[1] * s16 * 0.7, 1);
      if (n) lead(n[0], t, n[1] * s16 * (K ? 0.75 : 0.92), 'ewi', 0.95);
    } };
  // ------------------------------------------------------------ the Japanese boss's instruments (Tsugaru shamisen, taiko, rock)
  // the Tsugaru shamisen (the thick-necked one, played hard: the bachi strikes the string and the skin together, two
  // strings buzz against the neck, the sawari's sizzle; trem: its fast tremolo); the taiko (the big ōdaiko, the tight
  // shime-daiko); a rock kit (a heavy kick, a china cymbal; the gated snare is the 80s one above); and a reese bass (two
  // saws beating against each other over a sub)
  function tsugaru(m, t, v = 1, len = 0.3, trem = false) {
    const f = mtof(m), L = Math.max(0.12, len), g = ac.createGain(), bp = filt('bandpass', f * 3, 1.4, g), end = t + L + 0.1;
    bp.frequency.setValueAtTime(Math.min(9000, f * 6), t); bp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 2.4), t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.11 * v, t + 0.0015);
    if (trem) { const dt = 1 / 16; g.gain.exponentialRampToValueAtTime(0.03 * v, t + dt * 0.9); for (let k = 1; k * dt < L; k++) { const tk = t + k * dt; g.gain.setValueAtTime(0.07 * v, tk); g.gain.exponentialRampToValueAtTime(0.025 * v, tk + dt * 0.9); } }
    else g.gain.exponentialRampToValueAtTime(0.03 * v, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + L + 0.06); g.connect(music);
    [1, 1.006].forEach(k => { const o = osc('sawtooth', f * k, t, end, bp); o.frequency.setValueAtTime(f * k * 1.02, t); o.frequency.exponentialRampToValueAtTime(f * k, t + 0.02); });
    noise(t, 0.05, 0.03 * v, 'bandpass', 3200, 5, music, 0.001);                                      // the sawari's sizzle
    noise(t, 0.012, 0.07 * v, 'bandpass', 1700, 1.5, music, 0.0004); tone('sine', 190, 130, t, 0.04, 0.05 * v, music, 0.001);   // the bachi on the skin
  }
  function odaiko(t, v = 1, len = 1.1) { tone('sine', 64, 38, t, len, 0.4 * v, music, 0.003); tone('triangle', 135, 92, t, 0.12, 0.12 * v, music, 0.002); noise(t, 0.07, 0.08 * v, 'lowpass', 700, 0.8, music, 0.002); }
  function shime(t, v = 1) { tone('sine', 560, 505, t, 0.05, 0.09 * v, music, 0.0008); noise(t, 0.025, 0.06 * v, 'bandpass', 3000, 2, music, 0.0005); }
  function rkick(t, v = 1) { tone('sine', 145, 44, t, 0.26, 0.64 * v, music, 0.0015); noise(t, 0.01, 0.1 * v, 'highpass', 3000, 0.7, music, 0.0005); tone('triangle', 260, 120, t, 0.03, 0.08 * v, music, 0.001); }
  function china(t, v = 1) { noise(t, 0.55, 0.08 * v, 'bandpass', 3600, 0.6, music, 0.001); noise(t, 0.3, 0.05 * v, 'highpass', 7500, 0.7, music, 0.001); }
  function reese(m, t, len, v = 1) {
    const f = mtof(m), g = ac.createGain(), lp = filt('lowpass', 900, 1.2, g), L = Math.max(0.1, len), end = t + L + 0.08;
    lp.frequency.setValueAtTime(1300, t); lp.frequency.exponentialRampToValueAtTime(520, t + Math.min(0.5, L));
    env(g, t, 0.07 * v, 0.006, L); g.connect(music);
    osc('sawtooth', f, t, end, lp, -14); osc('sawtooth', f, t, end, lp, 14); osc('sine', f, t, end, g);
  }
  // The Japanese boss: Tsugaru shamisen and taiko that break into rock (186 bpm, the In scale on C: C Db F G Ab, the dark
  // pentatonic of old Japan; written on E below and moved down as it's read). The build is a taiko stage: the ōdaiko's
  // booms, the shime-daiko ticking, the shamisen's tremolo growing on low C; its call (sharp, percussive, the bachi slapping
  // the skin), the shout «よーっ!»; the drums trading, then all of them rolling faster under a riser and the tremolo
  // climbing C Db F G, «はっ!», a breath… the drop: a rock kit hammering, the ōdaiko on every downbeat and the shime in
  // sixteenths, a reese bass, and the shamisen's hook ("C-C G C, Db! C Ab-G F G…", hard and fast). B goes half time with
  // the shamisen in tremolo over long notes. A taiko breakdown, a second build, the drop again (the china cymbal now).
  // Bars: build 8 · drop 8 · B 8 · taiko 4 · build 4 · drop 8 (the loop starts at B). The riff's harmony: C5, with Db5 (the
  // Phrygian step) every fourth bar.
  SONGS.boss_ja = { bpm: 186, len: 640, from: 256, swing: 0, vol: 0.42, verb: 0.1, echo: 0.08, echoSteps: 3,
    D: (() => {
      const t1 = 'E5/1 E5/1 B4/1 E5/1 F5/2 E5/2 C5/1 B4/1 A4/2 B4/4 | ', t2 = 'E5/1 E5/1 B4/1 E5/1 F5/2 A5/2 B5/4 A5/2 F5/2 | ';
      const HOOK = mel(t1 + t2 + t1 + 'C6/2 B5/2 A5/2 F5/2 E5/8 | ' + t1 + t2 + t1 + 'E5/1 F5/1 A5/1 B5/1 C6/1 B5/1 A5/1 F5/1 E5/8');
      const SONG = mel('B5/8 A5/4 F5/4 | E5/12 r/4 | A5/8 B5/4 C6/4 | B5/8 r/4 E5/2 F5/2 | B5/8 C6/4 E6/4 | F6/8 E6/4 C6/4 | B5/6 A5/2 F5/4 A5/4 | B5/16');
      // the build's call (bars 2–3) and the climb (bars 6–7)
      const CALL = mel('r/16 | r/16 | E4/1 E4/1 B3/1 E4/1 F4/2 E4/2 C4/2 B3/2 E4/4 | E4/1 F4/1 A4/1 B4/1 C5/2 B4/2 A4/2 F4/2 E4/4 | r/16 | r/16 | E4/4 F4/4 A4/4 B4/4 | C5/4 E5/4 F5/4 B5/4');
      const rf = (r, o, a, b, c) => `${r}/2 ${r}/1 ${r}/1 r/2 ${o}/2 ${a}/2 ${b}/2 ${a}/2 ${c}/2 | `, e = rf('E1', 'E2', 'B1', 'C2', 'A1');
      const BASS = mel(e + e + e + rf('F1', 'F2', 'C2', 'B1', 'A1'));
      const dn = a => a.map(n => [n[0] - 4, n[1]]);          // (written on E, played on C: E with its F is lu_campana's)
      return { HOOK: dn(HOOK), SONG: dn(SONG), CALL: dn(CALL), BASS: dn(BASS), ODK: [pat('x..x..x.x.......'), pat('x.x.xxx.....x.x.')], K0: pat('x..x..x.x..x..x.'), SH: pat('x.oxx.oxx.oxx.ox') };
    })(),
    play(i, t, s16) {
      const D = this.D, bar = i >> 4, s = i & 15;
      const build = bar < 8 || (bar >= 28 && bar < 32), drop = (bar >= 8 && bar < 16) || bar >= 32, B = bar >= 16 && bar < 24, taiko = bar >= 24 && bar < 28;
      const bb = bar < 8 ? bar : bar - 24;                // the build's bar (0–7; the second build is bars 4–7 of it)
      if (build && bb === 7 && s >= 14) { if (s === 14) { odaiko(t, 1.1); rkick(t, 1); china(t, 0.8); vox(67, t, 0.14, 0.75, 'a', 'a'); } return; }   // «はっ!», then a breath
      if (s === 0 && (bar === 8 || bar === 32)) { crash(t, 1); china(t, 0.7); odaiko(t, 1.2); }
      if (build) {
        // the taiko: booms on one and three, the shime ticking, trading in bars 4–5, all rolling in 6–7
        if (bb < 4) { if (s === 0 || (s === 8 && bb >= 1)) odaiko(t, 0.8 + bb * 0.1); if (!(s & 1)) shime(t, s & 2 ? 0.35 : 0.6); }
        else if (bb < 6) { if (D.ODK[bb & 1][s]) odaiko(t, 0.8, 0.45); shime(t, (s & 3) === 0 ? 0.9 : 0.5); }
        else { const r = bb === 7 ? 1 : 2; if (!(s % r)) odaiko(t, 0.65 + (bb - 6) * 0.15 + s * 0.012, 0.24); shime(t, 0.75 + s * 0.02); shime(t + s16 / 2, 0.5 + s * 0.02); if (s === 0) swell(t, (bb === 6 ? 30 : 14) * s16, 1.8); }
        // the shamisen: a tremolo growing on low E, the call, the climb
        if (bb < 2 && s === 0) tsugaru(48, t, 0.5 + bb * 0.2, 15 * s16, true);
        const c = D.CALL[bb * 16 + s]; if (c) tsugaru(c[0], t, 0.95, c[1] * s16 * 0.9, c[1] >= 4 && bb >= 6);
        if (bb === 2 && s === 0) vox(64, t, 0.35, 0.6, 'o', 'o');                       // «よーっ!»
      }
      if (drop) {
        if (D.K0[s]) rkick(t, s ? 0.85 : 1);
        if (s === 4 || s === 12) gatesnare(t, 1);
        if (!(s & 1)) hat(t, s & 2 ? 0.7 : 0.45);
        if (s === 0) odaiko(t, 0.9); if (D.SH[s]) shime(t, D.SH[s] * 0.7);
        if (bar >= 32 && s === 8 && (bar & 1)) china(t, 0.6);
        const n = D.HOOK[(i - (bar >= 32 ? 512 : 128)) % 128]; if (n) { tsugaru(n[0], t, 1, n[1] * s16 * 0.95, n[1] >= 8); if (bar >= 32) tsugaru(n[0] - 12, t, 0.5, n[1] * s16 * 0.9, n[1] >= 8); }
      }
      if (B) {                   // half time: the kick and the snare spread out, the ōdaiko on one and three, the shamisen in tremolo
        if (s === 0 || s === 10) rkick(t, 1); if (s === 8) gatesnare(t, 1);
        if (!(s & 3)) hat(t, 0.6, s === 12); if (s === 0 || s === 8) odaiko(t, 0.8, 0.6);
        const n = D.SONG[(i - 256) % 128]; if (n) tsugaru(n[0], t, 0.9, n[1] * s16 * 0.95, n[1] >= 4);
        if (s === 4 && ((bar - 16) & 3) === 3) vox(64, t, 0.3, 0.5, 'o', 'o');
      }
      if (taiko) {               // the taiko alone, trading, with shouts
        if (D.ODK[bar & 1][s]) odaiko(t, 0.85, 0.5); shime(t, (s & 3) === 0 ? 0.9 : 0.45);
        if (s === 0 && !(bar & 1)) vox(67, t, 0.12, 0.6, 'a', 'a');
        if ((bar & 1) && s >= 8 && !(s & 1)) tsugaru(48, t, 0.6, s16, false);
      }
      if (drop || B) { const b = D.BASS[(i - (bar >= 32 ? 512 : 128)) % 64]; if (b) reese(b[0] + 12, t, b[1] * s16 * 0.9, B && b[1] < 2 ? 0.6 : 1); }
    } };
  // (end of the battle and boss themes)
  // A second song player (a "deck"): plays a song from SONGS on its own clock, alongside the area's music, into a bus you own
  // (its instruments play into `dest` instead of the music bus). Step `from` plays at d.t0 (AudioContext time), then a
  // sixteenth every d.s16 (beat = 4 sixteenths); it loops like a song (from S.from) unless o.loop is false.
  //   const d = Sound.deck('phonk', myBus, { at: Sound.ctx.currentTime + 0.5, bpm: 120, from: 0 });  …  d.stop()
  function deck(name, dest, o = {}) {
    const S = SONGS[name]; if (!ac || !S || !dest) return null;
    const s16 = 60 / (o.bpm || S.bpm) / 4, sw = swingOf(S);
    const d = { name, s16, beat: s16 * 4, bar: s16 * 16, t0: Math.max(o.at || 0, ac.currentTime + 0.02), step: o.from || 0, live: true, timer: 0 };
    let next = d.t0;
    const adv = () => { if (++d.step >= S.len) { d.step = S.from || 0; if (o.loop === false) d.live = false; } };
    function pump() {
      if (!d.live) { clearInterval(d.timer); return; }
      const now = ac.currentTime, ahead = document.hidden ? 1.2 : 0.2;
      // after a stall (a background tab), skip ahead on the grid instead of playing every missed note at once
      if (next < now - 0.05) { const lag = Math.ceil((now - next) / s16); for (let k = 0; k < lag && d.live; k++) adv(); next += lag * s16; }
      const keep = [music, echoIn]; music = dest; echoIn = dest;
      try { while (d.live && next < now + ahead) { S.play(d.step, next + (d.step % 2 ? s16 * sw : 0), s16); next += s16; adv(); } }
      catch (e) { console.warn('[Sound.deck]', name, e); d.live = false; }
      finally { music = keep[0]; echoIn = keep[1]; }
    }
    d.stop = () => { d.live = false; clearInterval(d.timer); };
    d.timer = setInterval(pump, 25); pump();
    return d;
  }
  // Ducking: dip the area's music (not the effects, not a deck) to k (0..1). Several callers multiply. A duck lasts `ttl`
  // seconds unless it's asked for again (call it every frame), so a module that stops being updated (a fight starts)
  // never leaves the music dipped. duck(id) or duck(id, 1) lets go. (The gain goes in between the Hush dimmer and the
  // Hush muffler the first time it's needed.)
  let duckG = null, duckTimer = 0, duckK = 1;
  const ducks = {};
  function duckApply() {
    if (!ac || !LIVE) return;
    if (!duckG) { duckG = ac.createGain(); LIVE.mdim.disconnect(); LIVE.mdim.connect(duckG); duckG.connect(LIVE.hushLP); }
    const now = performance.now(); let k = 1;
    for (const id of Object.keys(ducks)) { if (ducks[id].until < now) delete ducks[id]; else k *= ducks[id].k; }
    if (Math.abs(k - duckK) > 0.004) { duckK = k; duckG.gain.setTargetAtTime(k, ac.currentTime, 0.12); }
    if (!Object.keys(ducks).length && duckTimer) { clearInterval(duckTimer); duckTimer = 0; }
  }
  function duck(id, k = 1, ttl = 0.6) {
    if (!ac) return;
    if (k >= 0.999) delete ducks[id]; else ducks[id] = { k: Math.max(0, Math.min(1, k)), until: performance.now() + ttl * 1000 };
    duckApply();
    if (!duckTimer && Object.keys(ducks).length) duckTimer = setInterval(duckApply, 100);
  }
  // tests: like render(), but the song plays through chain(c, input) → its last node (a module's own bus, e.g. phonk.js's
  // headphone leak), with Sound.phonkMix as given in o.mix
  async function renderVia(name, sec = 6, chain, o = {}) {
    const S = SONGS[name], OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!S || !OAC) return null;
    const sr = o.rate || 22050, c = new OAC(2, Math.ceil(sr * (sec + 1.5)), sr), keep = { ac, mix: phonkMix }, G = build(c);
    ac = c; use(G);
    const inp = c.createGain(), tail = chain ? chain(c, inp) : inp; tail.connect(G.out);
    music = inp; echoIn = inp; if (o.mix) phonkMix = Object.assign({}, o.mix);
    const s16 = 60 / (o.bpm || S.bpm) / 4, sw = swingOf(S); let t = 0.05, st = o.from || 0, steps = 0;
    try { while (t < sec) { S.play(st, t + (st % 2 ? s16 * sw : 0), s16); t += s16; steps++; st++; if (st >= S.len) st = S.from || 0; } }
    finally { ac = keep.ac; use(LIVE); phonkMix = keep.mix; }
    const buf = await c.startRendering(); let peak = 0, sum = 0, nan = 0, n = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) { const x = d[i]; if (x !== x) { nan++; continue; } const a = Math.abs(x); if (a > peak) peak = a; sum += x * x; n++; } }
    return { name, sec, steps, peak: +peak.toFixed(3), rms: +Math.sqrt(sum / Math.max(1, n)).toFixed(4), nan };
  }
  // ============================================================ (end of PHONK, part 2)

  // ------------------------------------------------------------ tests
  // play every step of a song once into a muted bus (checks it runs without errors)
  function testSong(name) {
    if (!ac || !SONGS[name]) return 'no audio';
    const S = SONGS[name], s16 = 60 / S.bpm / 4, t0 = ac.currentTime + 0.05, keep = [music, echoIn], mute = ac.createGain();
    mute.gain.value = 0; music = echoIn = mute;
    try { for (let i = 0; i < S.len; i++) S.play(i, t0 + i * s16 * 0.01, s16); } finally { music = keep[0]; echoIn = keep[1]; }
    return S.len;
  }
  // render a few seconds of a song offline (no speakers) and measure it: { peak, rms, nan, notes } (o.buffer: the AudioBuffer
  // too, as .buf, e.g. to save a preview)
  async function render(name, sec = 6, o = {}) {
    const S = SONGS[name], OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!S || !OAC) return null;
    const sr = o.rate || 22050, c = new OAC(2, Math.ceil(sr * (sec + 1.5)), sr), keep = { ac, hush, tk, lastLead, lastLeadT, lastFm, lastFmT }, G = build(c), h = o.hush || 0;
    ac = c; use(G); hush = h; tk = 1 - 0.22 * h;
    G.music.gain.value = volOf(name); G.verbIn.gain.value = (S.verb !== undefined ? S.verb : 0.1) + 0.22 * h; G.echoRet.gain.value = S.echo || 0;
    G.echoDelay.delayTime.value = (S.echoSteps || 3) * 15 / S.bpm / tk; G.hushLP.frequency.value = lerp(18000, 650, h); G.mdim.gain.value = 1 - 0.45 * h;
    G.color.frequency.value = S.tone || sr * 0.45;
    const s16 = 60 / (S.bpm * tk) / 4, sw = swingOf(S); let t = 0.05, st = o.from || 0, steps = 0;
    try { while (t < sec) { S.play(st, t + (st % 2 ? s16 * sw : 0), s16); t += s16; steps++; st++; if (st >= S.len) st = S.from || 0; } }
    finally { ac = keep.ac; use(LIVE); hush = keep.hush; tk = keep.tk; lastLead = keep.lastLead; lastLeadT = keep.lastLeadT; lastFm = keep.lastFm; lastFmT = keep.lastFmT; }
    const buf = await c.startRendering(); let peak = 0, sum = 0, nan = 0, n = 0;
    for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < d.length; i++) { const x = d[i]; if (x !== x) { nan++; continue; } const a = Math.abs(x); if (a > peak) peak = a; sum += x * x; n++; } }
    return { name, sec, steps, peak: +peak.toFixed(3), rms: +Math.sqrt(sum / Math.max(1, n)).toFixed(4), nan, buf: o.buffer ? buf : undefined };
  }

  // ------------------------------------------------------------ songs from other files: Sound.addSong(name, def) and Sound.kit
  // A song is { bpm, len, from?, swing?, vol?, verb?, echo?, echoSteps?, play(i, t, s16) } (see "songs" above). Its play()
  // schedules step i at time t with Sound.kit's instruments, which only work inside play() (the scheduler, a deck or a test
  // render points them at the right bus). The kit is stable: things get added to it, never renamed or removed.
  //   const K = Sound.kit, TUNE = K.mel('E5/2 G5 A5/4 …');
  //   Sound.addSong('arcade', { bpm: 128, len: 64, play(i, t, s16) { if (i % 4 === 0) K.kick(t); const n = TUNE[i % 64]; if (n) K.lead(n[0], t, n[1] * s16, 'square'); } });
  //   Sound.setSong('arcade');
  const KIT = {
    // writing music down: mtof(midi) → Hz, nn('C4') → 60, N('A2 C3') → [45, 48], mel('E5/2 G5 r/2…') → by step [midi, length],
    // pat('x..o') → levels by step, CH('A2: G3 C4 E4, …') → [[bass, voicing…], …]
    mtof, nn, N, mel, pat, CH,
    // drums and percussion
    kick, kick808, snare, hat, clap, crash, rim, shaker, brush, tom, zap, conga, timbale, shell, cowbell, clave, scrape, surdo, tamborim,
    agogo, cuica, apito, woodblock, crackle, drop, swell,
    // basses, keys, strings, mallets, pads, voices, brass
    bass, bass2, slap, upright, synbass, sub808, tuba, keys, epiano, string, strum, vibes, marimba, glock, pluck, pad, arp, vox, horn, clav,
    // leads: lead(midi, t, seconds, kind, level) with kind a LEADS name (saw square trumpet flute whistle accordion robo mute flugel
    // erhu dizi shaku harp melodica recorder chip sax, or your own patch added to LEADS); fmlead(midi, t, seconds, level, index)
    lead, LEADS, fmlead,
    // the new areas' instruments
    anvil, chip, shovel, chk, canary, drip, sonar, wave, beam, foghorn, bee, glass, jingle, tick, zheng, gliss, luo, koto, shami, mbox, bell: bellS,
    // (2026-11-12) each new song's own kit, bass and voices; a song may also set tone: Hz (its own lowpass on the music)
    stomp, hclap, board, thud, pipe, chain, clink, dubkick, sidestick, dubhat, popkick, claps, tamb, feltkick, swirl, ride, hatfoot, feather,
    chipkick, chipnoise, tanggu, naobo, linnkick, gatesnare, simtom, dustkick, dustsnare, dusthat,
    tub, subglide, dub, fbass, fretless, pizz, tribass, wahbass, chopper, roundbass,
    banjo, harpchord, darkpad, tremgtr, skank, organ, vibe, ukeS, uke, pan, kalimba, warmpad, celesta, handbell, chipnote, pipa, wahgtr, polybrass, felt,
    // (2026-11-15) the battle and boss themes' instruments: pwave(name, harmonic levels) / posc(…) make one-oscillator timbres;
    // es: funkkick rimcrack hammond rockbass odgtr · piano brass bongo campana babybass; pt: zabumba triangle stacksnare
    // thumbbass accchord · berimbau pandeiro atabaque alfaia gongue caixa agbe brsnare fuzzbass; de: motokick motosnare motohat
    // pickbass combo · k909 cl909 oh909 ch909 acid stab clank; zh: yangqin sheng fmbass zkick picsnare bangu zhat · ban
    // bigkick slam junobass; ja: dxpiano chorusgtr fslap fkick fsnare splash · tsugaru odaiko shime rkick china reese.
    // New LEADS: tptlead bone sanfona pife rabeca moog rave jinghu ewi
    pwave, posc, funkkick, rimcrack, hammond, rockbass, odgtr, piano, brass, bongo, campana, babybass,
    zabumba, triangle, stacksnare, thumbbass, accchord, berimbau, pandeiro, atabaque, alfaia, gongue, caixa, agbe, brsnare, fuzzbass,
    motokick, motosnare, motohat, pickbass, combo, k909, cl909, oh909, ch909, acid, stab, clank,
    yangqin, sheng, fmbass, zkick, picsnare, bangu, zhat, ban, bigkick, slam, junobass,
    dxpiano, chorusgtr, fslap, fkick, fsnare, splash, tsugaru, odaiko, shime, rkick, china, reese,
  };
  function addSong(name, def) { if (!name || !def || typeof def.play !== 'function') return false; SONGS[name] = def; return true; }

  return {
    start, setSong, addSong,
    get kit() { return KIT; },
    play(name, ...args) { if (ac && fx[name]) fx[name](...args); },
    _testSong: testSong,
    _song: name => SONGS[name],      // (tests: a song's data, e.g. its chords and tune)
    _testAll() { const r = {}; for (const k of Object.keys(SONGS)) { try { r[k] = testSong(k); } catch (e) { r[k] = 'ERROR ' + e.message; } } return r; },
    _render: render,
    get songs() { return Object.keys(SONGS); },
    get song() { return song; },
    get tempo() { return tk; },
    get step() { return step; },
    get lang() { return lang; },
    // the language you're learning: 'battle' plays its battle theme (switches right away if one is playing)
    set lang(v) { lang = v || null; if (want === 'battle') setSong('battle'); },
    get music() { return musicOn; },
    set music(v) { musicOn = v; if (music) music.gain.setTargetAtTime(v && song && SONGS[song] ? volOf(song) : 0, ac.currentTime, 0.2); },
    set birds(v) { birdsLevel = v; },
    get hush() { return hushT; },
    set hush(h) { hushT = Math.max(0, Math.min(1, +h || 0)); if (ac && Math.abs(hushT - hushSent) > 0.004) applyHush(); },
    // (additive, for phonk.js) the audio context (null until the first key or click) and the master bus, for modules with
    // sounds of their own; a second song player; ducking the area's music; which recorded sounds are in Kauã's beat
    get ctx() { return ac; },
    get out() { return LIVE ? LIVE.out : null; },
    deck, duck,
    // (P6d) fade every sound out over sec seconds before leaving the page (the journal's Quit to title); paused: whether a
    // hidden window has the sound paused right now
    fadeOut, get paused() { return paused; },
    get phonkMix() { return Object.assign({}, phonkMix); },
    set phonkMix(m) { phonkMix = Object.assign({}, m || {}); },
    _renderVia: renderVia,
    say(text, lang) {
      if (!window.speechSynthesis) return false;
      const want = { es: ['es-MX', 'es-US', 'es'], pt: ['pt-BR', 'pt'], de: ['de-DE', 'de'], zh: ['zh-CN', 'cmn', 'zh-TW'], ja: ['ja-JP', 'ja'] }[lang] || [lang];   // (zh: Mandarin voices only, never zh-HK's Cantonese)
      const voices = speechSynthesis.getVoices(); let v = null;
      for (const w of want) { v = voices.find(x => x.lang.replace('_', '-').startsWith(w)); if (v) break; }
      if (!v) return false;
      const u = new SpeechSynthesisUtterance(text.replace(/[{}]/g, '')); u.voice = v; u.lang = v.lang; u.rate = 0.92;
      speechSynthesis.cancel(); speechSynthesis.speak(u); return true;
    },
  };
})();
