'use strict';
// Port Brisa's two songs (region 6; REGIONS.md 8: each its own, distinct from every other song in the game), added through
// Sound.addSong with Sound.kit's instruments. port.js's songAt asks for them: 'port' in the city, on the bay and on the road's
// last stretch; 'seafort' inside the sea fort (port_fort.js).
//   'port'    «Brisa Highlife»: a West African highlife harbor groove, 112 bpm, B♭ mixolydian. Two clean guitars interlock
//             (a picked ostinato high, a marimba counter-line low), a melodic finger bass, an agogô bell pattern with congas,
//             shaker and open hats, horn stabs at the end of each phrase; in the second half a flute hook answers the horns.
//             Waves wash in every four bars, and gulls cry over the top.
//   'seafort' «The Old Fort»: sea-noir funk in 7/8 (2+2+3), 120 bpm, G phrygian. An upright bass ostinato in seven, low toms
//             rolling like waves, rim and kick on the groups, a rope's creak, harp chords over a cold pad, a pennywhistle hook,
//             and the harbor bell tolling at the top of every phrase.
// PORTMUSIC._preview(name, sec) renders a WAV (tests: POSTed to the dev server's /shot, saved as .png: rename it to .wav).
const PORTMUSIC = (() => {
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return { songs: [] };
  const K = Sound.kit;

  // ---------------------------------------------------------------- «Brisa Highlife» (the city)
  {
    // chords by bar (root, and whether it's the B section): A | A | A | A' (x2), then B: E♭ F B♭ A♭ (x2)
    const BB = 46, AB = 44, EB = 39, F = 41;
    const ROOT = [BB, BB, AB, EB, BB, BB, AB, EB, EB, F, BB, AB, EB, F, BB, BB];
    const triad = r => [r + 12, r + 16, r + 19];          // (major: the mixolydian's I, ♭VII and IV are all major)
    // the bass: root, root, fifth, octave, sixth, fifth, third (a highlife walk), lengths in sixteenths
    const BASS = [[0, 0, 3, 1], [3, 0, 2, 0.7], [6, 7, 2, 0.8], [8, 12, 2, 0.9], [10, 9, 2, 0.75], [12, 7, 2, 0.8], [14, 4, 2, 0.7]];
    // guitar 1: a picked 16th ostinato over the chord (indices into [root+12, third, fifth, octave])
    const G1 = [[0, 3], [2, 2], [3, 1], [5, 2], [6, 3], [8, 2], [10, 1], [11, 2], [13, 3], [14, 1]];
    // the agogô (h: high bell, l: low), the congas
    const AGO = { 0: 1, 2: 1, 4: 0, 7: 1, 9: 1, 12: 0, 14: 1 }, CON = { 3: 'slap', 6: 'lo', 7: 'lo', 11: 'slap', 14: 'hi', 15: 'hi' };
    // the flute hook (B section, two bars a phrase; B♭ major pentatonic with the ♭7)
    const HOOK = K.mel('F5/2 G5/2 Bb5/4 Ab5/2 G5/2 F5/4 | D5/4 F5/2 G5/2 F5/8 | Eb5/2 F5/2 G5/4 Bb5/2 C6/2 Bb5/4 | G5/4 F5/4 D5/8 |'
      + ' F5/2 G5/2 Bb5/4 C6/2 D6/2 C6/4 | Bb5/4 Ab5/2 G5/2 F5/8 | Eb5/2 D5/2 Eb5/4 F5/2 G5/2 Ab5/4 | Bb5/16');
    Sound.addSong('port', { bpm: 112, len: 256, swing: 0.05, vol: 0.36, verb: 0.12, echo: 0.07, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, r = ROOT[bar], Bsec = bar >= 8, tri = triad(r), tones = [r + 12, r + 16, r + 19, r + 24];
      // drums and percussion
      if (st === 0 || st === 7 || st === 10 || (Bsec && st === 13)) K.funkkick(t, st ? 0.7 : 0.95);
      if (st === 4 || st === 12) K.sidestick(t, 0.9);
      if (Bsec && st === 12 && (bar & 1)) K.snare(t, 0.35);
      K.hat(t, st % 4 === 2 ? 0.55 : 0.2, st % 4 === 2);
      K.shaker(t, st % 2 ? 0.55 : 0.85);
      if (AGO[st] !== undefined) K.agogo(t, !!AGO[st], 0.85);
      if (CON[st]) K.conga(t, CON[st], 0.8);
      // the finger bass
      for (const [at, iv, len, v] of BASS) if (st === at) K.fbass(r + iv, t, len * s16 * 0.92, v);
      // the guitars: the picked ostinato, and the marimba's offbeat thirds
      for (const [at, k] of G1) if (st === at) K.pluck(tones[k], t, 0.9);
      if (st % 4 === 1) K.marimba(tri[st === 5 || st === 13 ? 1 : 2] - 12, t, 0.75);
      // horn stabs at the end of each two bars; in the B section, a riff on 1 and the "and" of 2
      if (!Bsec && (bar & 1) && (st === 10 || st === 14)) K.brass(tri, t, s16 * (st === 14 ? 1.6 : 0.9), 0.8);
      if (Bsec && (st === 0 || st === 6)) K.brass(tri.map(m => m + 12), t, s16 * (st ? 1.2 : 2.6), 0.6);
      if (Bsec) { const n = HOOK[(bar - 8) * 16 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'flute', 0.9); }
      // the harbor: a wave every four bars, gulls now and then
      if (st === 0 && bar % 4 === 0) K.wave(t, 2.6, 0.55);
      if (bar % 4 === 2 && (st === 8 || st === 9)) K.drop(t, 0.7);
      if (i % 128 === 0) K.crash(t, 0.6);
    } });
  }

  // ---------------------------------------------------------------- «The Old Fort» (inside the sea fort), in 7/8: 14 sixteenths a bar
  {
    const G2 = 43, AB2 = 44, BB2 = 46, F2 = 41, D2 = 38, EB2 = 39, C3 = 48;
    // the upright's ostinato: [step, note, length, level]; the second bar of each pair ends lower
    const BASS_A = [[0, G2, 3, 1], [4, G2, 2, 0.7], [6, BB2, 2, 0.8], [8, AB2, 3, 0.9], [11, G2, 1, 0.6], [12, F2, 2, 0.75]];
    const BASS_B = [[0, G2, 3, 1], [4, G2, 2, 0.7], [6, BB2, 2, 0.8], [8, C3, 2, 0.85], [10, AB2, 2, 0.75], [12, D2, 2, 0.9]];
    const CHORD = [[55, 58, 62], [56, 60, 63], [55, 58, 62], [53, 56, 60]];     // Gm · A♭ · Gm · Fm (phrygian)
    // the pennywhistle hook, 14 steps a bar, four bars a phrase (G phrygian: G A♭ B♭ C D E♭ F)
    const W = (s) => K.mel(s);
    const HOOK = W('G5/2 Ab5/2 Bb5/3 Ab5/1 G5/2 F5/4 | Eb5/4 F5/2 G5/8 | D6/2 C6/2 Bb5/3 C6/1 Ab5/2 G5/4 | F5/2 Eb5/2 F5/2 G5/8 |');
    Sound.addSong('seafort', { bpm: 120, len: 224, swing: 0, vol: 0.3, verb: 0.2, echo: 0.12, echoSteps: 3, tone: 7200, play(i, t, s16) {
      const bar = Math.floor(i / 14), st = i % 14, half = bar >= 8, ch = CHORD[(bar >> 1) & 3];
      // the groups (2+2+3): kick on the ones, rim on the twos, low toms rolling in on the three
      if (st === 0 || st === 8) K.kick(t, st ? 0.75 : 0.95);
      if (st === 4 || st === 11) K.rim(t, 0.85);
      if (st === 6 || st === 12 || (st === 13 && bar % 2)) K.tom(t, st === 13 ? 70 : st === 12 ? 82 : 96, 0.7);
      if (st % 2 === 0) K.hat(t, st === 8 ? 0.35 : 0.18, false);
      if (half && st % 2 === 1) K.shaker(t, 0.4);
      if (st === 2 && bar % 2 === 0) K.scrape(t, 0.5, 0.35, 900, 18);      // (a rope creaking on its cleat)
      // the upright bass in seven
      for (const [at, m, len, v] of (bar % 2 ? BASS_B : BASS_A)) if (st === at) K.upright(m, t, v, len * s16 * 0.95);
      // harp chords over a cold pad
      if (st === 0) K.harpchord(ch, t, s16 * 6, 0.7);
      if (st === 8 && half) K.harpchord(ch.map(m => m + 12), t, s16 * 4, 0.45);
      if (st === 0 && bar % 4 === 0) K.darkpad(G2 + 12, t, s16 * 14 * 4, 0.8);
      // the pennywhistle: bars 4–7 and 12–15
      if ((bar & 7) >= 4) { const n = HOOK[((bar & 7) - 4) * 14 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.92, 'whistle', 0.85); }
      // the harbor bell at the top of each phrase; the sea against the walls
      if (st === 0 && bar % 4 === 0) K.bell(55, t, 0.55);
      if (st === 7 && bar % 4 === 2) K.wave(t, 2.2, 0.45);
    } });
  }

  // ---------------------------------------------------------------- previews (tests): a WAV of the first `sec` seconds
  function wav(buf) {
    const ch = buf.numberOfChannels, sr = buf.sampleRate, n = buf.length, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const w = (o, s) => { for (let k = 0; k < s.length; k++) out.setUint8(o + k, s.charCodeAt(k)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
    out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
    const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    let o = 44; for (let k = 0; k < n; k++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][k])); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
    return new Blob([out.buffer], { type: 'audio/wav' });
  }
  async function _preview(name, sec = 26) {
    const r = await Sound._render(name, sec, { buffer: true, rate: 44100 }); if (!r || !r.buf) return null;
    const blob = wav(r.buf), url = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
    const resp = await fetch('/shot', { method: 'POST', body: JSON.stringify({ name: 'music_' + name, data: url }) });
    return { name, sec: r.sec, peak: r.peak, rms: r.rms, nan: r.nan, saved: await resp.text() };
  }
  return { songs: ['port', 'seafort'], _preview };
})();
