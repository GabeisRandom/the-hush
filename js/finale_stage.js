'use strict';
// The old theater's stage in all three times at once (Chapter 4's finale, «Toda voz cuenta»; finale.js FIN is the rest). A room at
// y 300, in a slot of its own (SIDES.md: (−190, 300, −380), 24 × 28), entered backstage after the great clock strikes eight (or by
// today's theater doors after a load). TIME.world() stays 'now' and TIME's look is off in here: each time lives in its own seats.
//   the room      Aurora's theater: red seats, the clock-and-eight-bells emblem, the prompter's shell on the apron, a red curtain,
//                 painted flats on a fly bar (one per place, in each time's colors), footlights; three tears in TIME's crack look
//                 (gold, teal, violet) meeting over the proscenium
//   the seats     long ago (left, sepia: the concert's crowd, Aurora, Félix at the piano, young Rosita and her lantern, Elio's dad
//                 young), today (middle: Doña Rosa, the Candil twins, one from each region, Elio's dad old: the DAD block), tomorrow
//                 (right, silver-blue: Sami, the kids grown up…); each block's crowd is one merged mesh, lit when its act is spoken
//   the speech    you're his prompter: three acts (FINTXT.SPEECH), his 18 echoes, the pages he loses, the eight bridges you whisper
//   the laugh     the same slip, forty years later: he catches it himself and grins first, {mimo} goes hunting for it, Sami giggles,
//                 the whole theater laughs with him, and he keeps on talking
//   the after     the valley's bells (each place's triptych losing its gray), the curtain call, four short scenes, the times parting,
//                 then the credits (finale_credits.js)
// FINSTAGE.enter(o) · wings() · speech() · aftermath() · leave() · update(dt, t) · interactables() · target() · song() · inside · OUTSIDE
const FINSTAGE = (() => {
  if (typeof FIN === 'undefined' || typeof FINTXT === 'undefined') return null;
  const Y0 = 300, R = { x: -190, z: -380 };
  let G = null, built = false, inside = false, B = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const X = () => FINTXT;
  const lang = () => (G && G.state && G.state.lang) || 'es';
  const isCl = l => l === 'zh' || l === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const wait = s => STORY.wait(s);
  const tween = (s, fn) => STORY.tween(s, fn);
  const pick = (T, l = lang()) => (T ? T[l] || T.es || T.en || '' : '');
  const at = (x, z) => ({ x: R.x + x, z: R.z + z });          // (the room's own coordinates: x across, z from the stage (−) to the back (+))
  const shot = (p, l, dur = 0.9) => { G.cam.override = { pos: V(R.x + p[0], Y0 + p[1], R.z + p[2]), look: V(R.x + l[0], Y0 + l[1], R.z + l[2]), dur }; };
  const STAGE_Y = Y0 + 1.1, FRONT = -5.6, ARCH = -7.4, BACK = -13;
  const MARK = { x: 0, z: -9.6 }, BOX = { x: 0, z: -6.55 }, SHELL = { x: 0, z: -6.1 }, WINGS = { x: -6.2, z: -6.6 };
  const OUTSIDE = { x: -13.5, z: -231.4, yaw: Math.PI };

  // ------------------------------------------------------------ small things: words floating up over someone, laughter, applause
  function css() {
    if (document.getElementById('fins-css')) return;
    const s = document.createElement('style'); s.id = 'fins-css';
    s.textContent = `.fins-float { position: fixed; z-index: 12; pointer-events: none; font: 800 22px Bahnschrift, "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif; color: #fffaf0; text-shadow: 0 2px 0 #2b2235, 0 0 10px rgba(43,34,53,.6);
  transform: translate(-50%, -100%); transition: transform 1.5s ease-out, opacity 1.5s ease-in; white-space: nowrap; }
.fins-float.small { font-size: 16px; } .fins-float.gold { color: #ffd98a; } .fins-float.gray { color: #c9c4d6; }
#fins-act { position: fixed; left: 50%; top: 18%; transform: translate(-50%, -50%); z-index: 13; pointer-events: none; text-align: center; opacity: 0; transition: opacity .8s; }
#fins-act.on { opacity: 1; } #fins-act .n { font: 800 16px Bahnschrift, "Segoe UI", sans-serif; letter-spacing: .3em; color: #ffd98a; text-shadow: 0 2px 0 #2b2235; }
#fins-act .t { font: italic 700 44px Georgia, "Yu Mincho", "Microsoft YaHei", serif; color: #fffaf0; text-shadow: 0 3px 0 #2b2235, 0 0 18px rgba(43,34,53,.6); }
#fins-act .s { font: 700 14px Bahnschrift, "Segoe UI", sans-serif; color: #fffaf0; opacity: .85; text-shadow: 0 1px 0 #2b2235; }
body.in-battle #fins-act { display: none; }`;
    document.head.appendChild(s);
  }
  function screenOf(x, y, z) { const v = new THREE.Vector3(x, y, z).project(G.w3d.camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, on: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 }; }
  function floatText(text, x, y, z, o = {}) {
    css(); const p = screenOf(x, y, z); if (!p.on) return;
    const el = document.createElement('div'); el.className = 'fins-float' + (o.small ? ' small' : '') + (o.gold ? ' gold' : '') + (o.gray ? ' gray' : '');
    el.innerHTML = isCl(lang()) && typeof CJK !== 'undefined' && /\[/.test(text) ? CJK.html(text, { lang: lang() }) : esc(text);
    el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = `translate(-50%, -${150 + Math.random() * 80}%) rotate(${(Math.random() - 0.5) * 14}deg)`; el.style.opacity = '0'; });
    setTimeout(() => el.remove(), 1700);
  }
  const floatOver = (P, text, o) => { if (P) floatText(text, P.api.x, P.api.y + P.api.top + 0.2, P.api.z, o); };
  let NOISE = null;
  function laughSfx(n = 1, pitch = 1) {
    const ac = Sound.ctx, out = Sound.out; if (!ac || !out || !Sound.music) return;
    for (let v = 0; v < n; v++) {
      const t0 = ac.currentTime + v * 0.08 + Math.random() * 0.35, f0 = (170 + Math.random() * 170) * pitch, syl = 4 + ((Math.random() * 3) | 0);
      for (let i = 0; i < syl; i++) {
        const t = t0 + i * (0.12 + Math.random() * 0.03), o = ac.createOscillator(), bp = ac.createBiquadFilter(), g = ac.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(f0 * (1.18 - i * 0.05), t); o.frequency.exponentialRampToValueAtTime(f0 * (0.96 - i * 0.05), t + 0.09);
        bp.type = 'bandpass'; bp.frequency.value = 800 + Math.random() * 400; bp.Q.value = 2.6;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.014); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
        o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.13);
      }
    }
  }
  function clapSfx(n = 30, sec = 2) {
    const ac = Sound.ctx, out = Sound.out; if (!ac || !out || !Sound.music) return;
    if (!NOISE) { NOISE = ac.createBuffer(1, ac.sampleRate * 0.2, ac.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.02)); }
    for (let i = 0; i < n; i++) { const t = ac.currentTime + Math.random() * sec, s = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = NOISE; bp.type = 'bandpass'; bp.frequency.value = 1100 + Math.random() * 900; bp.Q.value = 1.2; g.gain.value = 0.06 + Math.random() * 0.05; s.connect(bp); bp.connect(g); g.connect(out); s.start(t); }
  }
  // the act's card: «el Ayer», its number and its English
  async function actCard(n, w) {
    css();
    let el = document.getElementById('fins-act'); if (!el) { el = document.createElement('div'); el.id = 'fins-act'; document.body.appendChild(el); }
    const l = lang(), RL = TIME.RULES[w], nm = RL.name[l] || RL.name.en;
    el.innerHTML = `<div class="n">${['I', 'II', 'III'][n - 1]}</div><div class="t">«${isCl(l) && typeof CJK !== 'undefined' ? CJK.html(nm, { lang: l }) : esc(nm)}»</div><div class="s">${esc(RL.title)}</div>`;
    el.classList.add('on'); await wait(2.6); el.classList.remove('on'); await wait(0.4);
  }

  // ------------------------------------------------------------ materials: the theater's red damask, its boards, the carpet; each
  // block of seats gets its own toon material, so its act can light it (the color scales: 0.42 dim … 1 lit)
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const damask = tex(128, 128, c => { c.fillStyle = '#6e2630'; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(232,184,62,0.2)'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.beginPath(); c.ellipse(x * 32 + (y % 2) * 16 + 8, y * 32 + 16, 5, 9, 0, 0, TAU); c.fill(); } c.fillStyle = '#3e2222'; c.fillRect(0, 104, 128, 24); c.fillStyle = '#c9a26a'; c.fillRect(0, 100, 128, 4); }, 6, 1.6);
    const boards = tex(256, 256, c => { c.fillStyle = '#7a5236'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { c.fillStyle = ['#8a6040', '#7f5838', '#946a48', '#744e32'][i % 4]; c.fillRect(i * 32 + 1, 0, 30, 256); const off = (i * 97) % 256; c.fillStyle = '#4a3020'; c.fillRect(i * 32, off, 32, 2); } }, 4, 2);
    const carpet = tex(128, 128, c => { c.fillStyle = '#5a1e26'; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(255,210,140,0.08)'; for (let i = 0; i < 40; i++) c.fillRect((i * 37) % 128, (i * 53) % 128, 3, 3); }, 6, 6);
    const curtain = tex(256, 128, c => { const g = c.createLinearGradient(0, 0, 256, 0); for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, i % 2 ? '#a11d2c' : '#c9343f'); c.fillStyle = g; c.fillRect(0, 0, 256, 128); c.fillStyle = '#e8b83e'; c.fillRect(0, 118, 256, 10); }, 2, 1);
    const block = () => new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    MAT = {
      wall: new THREE.MeshToonMaterial({ map: damask, gradientMap: TK.grad, side: THREE.DoubleSide }),
      boards: new THREE.MeshToonMaterial({ map: boards, gradientMap: TK.grad }),
      carpet: new THREE.MeshToonMaterial({ map: carpet, gradientMap: TK.grad }),
      curtain: new THREE.MeshToonMaterial({ map: curtain, gradientMap: TK.grad, side: THREE.DoubleSide }),
      dark: new THREE.MeshBasicMaterial({ color: '#120d18' }),
      ceil: new THREE.MeshToonMaterial({ color: '#2a1a22', gradientMap: TK.grad, side: THREE.DoubleSide }),
      past: block(), now: block(), future: block(),
    };
    return MAT;
  }

  // ------------------------------------------------------------ the painted flats (a theater's backdrop: one per place, in a time's
  // colors; the valley's triptychs at the end). Paper-theater shapes, flat colors, one ink line.
  const PAL = {
    past: { sky0: '#f3dcae', sky1: '#d9a86c', hill: '#c09060', ground: '#b5875a', wall: '#e8cfa0', roof: '#a8603a', water: '#a9b8a0', leaf: '#9a9a56', accent: '#c9783a', light: '#fff0c8' },
    now: { sky0: '#a9d8f5', sky1: '#e8f6ff', hill: '#7fae6a', ground: '#8fbf6f', wall: '#f4ead6', roof: '#c9553f', water: '#5fa8d0', leaf: '#4f9a4a', accent: '#e8b83e', light: '#ffffff' },
    future: { sky0: '#c3cff5', sky1: '#eef1ff', hill: '#8fb0b8', ground: '#9cc2b4', wall: '#e8ecf6', roof: '#6f7fb8', water: '#78b4e0', leaf: '#6fae8f', accent: '#9db8ff', light: '#f4f7ff' },
  };
  const INK = '#2b2235';
  function paintPlace(c, x, y, w, h, place, world, gray = 0) {
    const P = PAL[world] || PAL.now;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    const sg = c.createLinearGradient(0, y, 0, y + h); sg.addColorStop(0, P.sky0); sg.addColorStop(1, P.sky1); c.fillStyle = sg; c.fillRect(x, y, w, h);
    const gy = y + h * 0.7, line = () => { c.strokeStyle = INK; c.lineWidth = Math.max(1.5, w * 0.004); c.stroke(); };
    const hill = (cx, r, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x + w * cx, gy + h * 0.06, w * r, h * 0.3, 0, Math.PI, TAU); c.fill(); line(); };
    hill(0.2, 0.32, P.hill); hill(0.78, 0.36, P.hill);
    c.fillStyle = P.ground; c.fillRect(x, gy, w, h - (gy - y)); c.beginPath(); c.moveTo(x, gy); c.lineTo(x + w, gy); line();
    const house = (cx, bw, bh, col, roof) => { const X0 = x + w * cx - w * bw / 2, Y1 = gy, Y0b = gy - h * bh; c.fillStyle = col; c.beginPath(); c.rect(X0, Y0b, w * bw, h * bh); c.fill(); line(); c.fillStyle = roof; c.beginPath(); c.moveTo(X0 - w * 0.01, Y0b); c.lineTo(X0 + w * bw / 2, Y0b - h * bh * 0.5); c.lineTo(X0 + w * bw + w * 0.01, Y0b); c.closePath(); c.fill(); line(); c.fillStyle = '#3a2a30'; c.fillRect(X0 + w * bw * 0.4, Y1 - h * bh * 0.45, w * bw * 0.2, h * bh * 0.45); };
    const tri = (cx, bw, bh, col, snow) => { c.fillStyle = col; c.beginPath(); c.moveTo(x + w * (cx - bw / 2), gy); c.lineTo(x + w * cx, gy - h * bh); c.lineTo(x + w * (cx + bw / 2), gy); c.closePath(); c.fill(); line(); if (snow) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + w * (cx - bw * 0.14), gy - h * bh * 0.72); c.lineTo(x + w * cx, gy - h * bh); c.lineTo(x + w * (cx + bw * 0.14), gy - h * bh * 0.72); c.closePath(); c.fill(); } };
    const water = (y0, y1) => { c.fillStyle = P.water; c.fillRect(x, y + h * y0, w, h * (y1 - y0)); c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(x + w * (0.08 + i * 0.16), y + h * (y0 + 0.06)); c.lineTo(x + w * (0.14 + i * 0.16), y + h * (y0 + 0.06)); c.stroke(); } };
    const lamp = (cx, cy, r, col) => { const g = c.createRadialGradient(x + w * cx, y + h * cy, 0, x + w * cx, y + h * cy, w * r * 3); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x + w * cx, y + h * cy, w * r * 3, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.ellipse(x + w * cx, y + h * cy, w * r * 0.7, w * r, 0, 0, TAU); c.fill(); line(); };
    switch (place) {
      case 'alba': {
        house(0.18, 0.12, 0.2, P.wall, P.roof); house(0.82, 0.13, 0.22, P.wall, P.roof); house(0.67, 0.1, 0.16, P.wall, P.roof);
        c.fillStyle = P.wall; c.beginPath(); c.rect(x + w * 0.44, gy - h * 0.55, w * 0.12, h * 0.55); c.fill(); line();
        c.fillStyle = P.roof; c.beginPath(); c.moveTo(x + w * 0.42, gy - h * 0.55); c.lineTo(x + w * 0.5, gy - h * 0.7); c.lineTo(x + w * 0.58, gy - h * 0.55); c.closePath(); c.fill(); line();
        c.fillStyle = P.accent; c.beginPath(); c.arc(x + w * 0.5, gy - h * 0.44, w * 0.025, Math.PI, TAU); c.fill(); line();
        c.fillStyle = P.water; c.beginPath(); c.ellipse(x + w * 0.3, gy + h * 0.12, w * 0.07, h * 0.04, 0, 0, TAU); c.fill(); line();
        for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? P.accent : P.roof; c.beginPath(); c.moveTo(x + w * (0.05 + i * 0.1), y + h * 0.12); c.lineTo(x + w * (0.1 + i * 0.1), y + h * 0.2); c.lineTo(x + w * (0.15 + i * 0.1), y + h * 0.12); c.fill(); }
        break;
      }
      case 'molinar': {
        for (const [cx, s] of [[0.3, 1], [0.68, 0.8]]) {
          c.fillStyle = P.wall; c.beginPath(); c.moveTo(x + w * (cx - 0.05 * s), gy); c.lineTo(x + w * (cx - 0.03 * s), gy - h * 0.38 * s); c.lineTo(x + w * (cx + 0.03 * s), gy - h * 0.38 * s); c.lineTo(x + w * (cx + 0.05 * s), gy); c.closePath(); c.fill(); line();
          const hx = x + w * cx, hy = gy - h * 0.38 * s;
          for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; c.fillStyle = P.light; c.save(); c.translate(hx, hy); c.rotate(a); c.beginPath(); c.rect(-w * 0.008, 0, w * 0.016 + w * 0.02, h * 0.22 * s); c.fill(); line(); c.restore(); }
        }
        for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? P.accent : P.leaf; c.fillRect(x + w * (i * 0.2), gy + h * 0.08, w * 0.2, h * 0.08); }
        break;
      }
      case 'lake': {
        water(0.6, 0.9);
        c.fillStyle = P.ground; c.beginPath(); c.ellipse(x + w * 0.62, y + h * 0.62, w * 0.12, h * 0.06, 0, Math.PI, TAU); c.fill(); line();
        c.fillStyle = P.leaf; c.beginPath(); c.arc(x + w * 0.62, y + h * 0.5, w * 0.035, 0, TAU); c.fill(); line();
        c.fillStyle = P.accent; c.fillRect(x + w * 0.1, y + h * 0.6, w * 0.22, h * 0.025); c.fillStyle = P.roof; c.beginPath(); c.ellipse(x + w * 0.4, y + h * 0.72, w * 0.05, h * 0.02, 0, 0, Math.PI); c.fill(); line();
        break;
      }
      case 'quarry': {
        c.fillStyle = P.hill; c.beginPath(); c.moveTo(x, gy); c.lineTo(x + w * 0.1, y + h * 0.2); c.lineTo(x + w * 0.62, y + h * 0.16); c.lineTo(x + w * 0.7, gy); c.closePath(); c.fill(); line();
        c.fillStyle = '#2a2230'; c.beginPath(); c.ellipse(x + w * 0.36, gy, w * 0.09, h * 0.2, 0, Math.PI, TAU); c.fill();
        for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#9ff3ff' : P.accent; c.beginPath(); const cx = x + w * (0.12 + i * 0.09), cy = y + h * (0.32 + (i % 3) * 0.08); c.moveTo(cx, cy - h * 0.05); c.lineTo(cx + w * 0.015, cy); c.lineTo(cx, cy + h * 0.05); c.lineTo(cx - w * 0.015, cy); c.closePath(); c.fill(); line(); }
        c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(x + w * 0.82, y + h * 0.34, w * 0.018, 0, TAU); c.fill(); line();
        break;
      }
      case 'gardens': {
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(x + w * 0.5, gy, w * 0.22, h * 0.42, 0, Math.PI, TAU); c.fill(); line();
        for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(x + w * (0.28 + i * 0.088), gy); c.quadraticCurveTo(x + w * 0.5, gy - h * 0.6, x + w * (0.72 - i * 0.088), gy); c.strokeStyle = 'rgba(43,34,53,0.35)'; c.lineWidth = 1.5; c.stroke(); }
        for (let i = 0; i < 14; i++) { c.fillStyle = ['#e2453a', '#ffd84a', '#e07ab0', '#ffffff'][i % 4]; c.beginPath(); c.arc(x + w * (0.04 + i * 0.07), gy + h * (0.08 + (i % 3) * 0.05), w * 0.012, 0, TAU); c.fill(); }
        break;
      }
      case 'peaks': {
        tri(0.25, 0.42, 0.62, P.hill, true); tri(0.62, 0.5, 0.78, P.hill, true); tri(0.88, 0.32, 0.5, P.hill, true);
        house(0.4, 0.07, 0.14, P.wall, P.roof); c.fillStyle = P.wall; c.fillRect(x + w * 0.52, gy - h * 0.3, w * 0.05, h * 0.3); c.strokeStyle = INK; c.strokeRect(x + w * 0.52, gy - h * 0.3, w * 0.05, h * 0.3);
        c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(x + w * 0.545, gy - h * 0.24, w * 0.016, 0, TAU); c.fill(); line();
        c.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 30; i++) c.fillRect(x + ((i * 97) % 100) / 100 * w, y + ((i * 61) % 70) / 100 * h, 3, 3);
        break;
      }
      case 'port': {
        water(0.62, 1.0);
        c.fillStyle = P.wall; c.fillRect(x, y + h * 0.42, w * 0.32, h * 0.2); c.strokeStyle = INK; c.strokeRect(x, y + h * 0.42, w * 0.32, h * 0.2);
        c.fillStyle = P.wall; c.fillRect(x + w * 0.85, y + h * 0.3, w * 0.04, h * 0.32); c.strokeRect(x + w * 0.85, y + h * 0.3, w * 0.04, h * 0.32); lamp(0.87, 0.28, 0.012, P.light);
        c.fillStyle = P.roof; c.beginPath(); c.moveTo(x + w * 0.45, y + h * 0.66); c.lineTo(x + w * 0.68, y + h * 0.66); c.lineTo(x + w * 0.64, y + h * 0.74); c.lineTo(x + w * 0.49, y + h * 0.74); c.closePath(); c.fill(); line();
        c.fillStyle = P.light; c.beginPath(); c.moveTo(x + w * 0.56, y + h * 0.3); c.lineTo(x + w * 0.56, y + h * 0.64); c.lineTo(x + w * 0.47, y + h * 0.64); c.closePath(); c.fill(); line(); c.beginPath(); c.moveTo(x + w * 0.575, y + h * 0.34); c.lineTo(x + w * 0.575, y + h * 0.64); c.lineTo(x + w * 0.66, y + h * 0.64); c.closePath(); c.fill(); line();
        break;
      }
      case 'ruins': {
        c.fillStyle = world === 'past' ? P.leaf : P.hill; c.fillRect(x, y + h * 0.3, w * 0.14, h * 0.4); c.fillRect(x + w * 0.86, y + h * 0.3, w * 0.14, h * 0.4);
        if (world === 'future') water(0.58, 1.0); else if (world === 'past') water(0.78, 0.86);
        for (let i = 0; i < 4; i++) { c.fillStyle = P.wall; const bw = 0.3 - i * 0.06; c.fillRect(x + w * (0.5 - bw / 2), gy - h * (0.07 * (i + 1)), w * bw, h * 0.07); c.strokeStyle = INK; c.strokeRect(x + w * (0.5 - bw / 2), gy - h * (0.07 * (i + 1)), w * bw, h * 0.07); }
        if (world === 'past') for (const cx of [0.22, 0.78]) { c.strokeStyle = '#7a5a30'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + w * cx, gy); c.lineTo(x + w * cx, gy - h * 0.3); c.stroke(); c.fillStyle = P.leaf; c.beginPath(); c.ellipse(x + w * cx, gy - h * 0.32, w * 0.05, h * 0.05, 0, 0, TAU); c.fill(); }
        break;
      }
      case 'marsh': {
        water(0.6, 1.0);
        c.fillStyle = '#5a5070'; c.fillRect(x + w * 0.78, y + h * 0.12, w * 0.07, h * 0.5); c.strokeStyle = INK; c.strokeRect(x + w * 0.78, y + h * 0.12, w * 0.07, h * 0.5);
        c.fillStyle = '#efe4c8'; c.beginPath(); c.arc(x + w * 0.815, y + h * 0.2, w * 0.02, 0, TAU); c.fill(); line();
        for (let i = 0; i < 7; i++) lamp(0.1 + i * 0.1, 0.56 + (i % 2) * 0.08, 0.01, i % 2 ? '#ffd98a' : '#ffe6a8');
        c.strokeStyle = P.leaf; c.lineWidth = 3; for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(x + w * (0.02 + i * 0.03), y + h * 0.7); c.lineTo(x + w * (0.02 + i * 0.03) + 4, y + h * 0.55); c.stroke(); }
        break;
      }
      default: break;
    }
    if (gray > 0) { c.fillStyle = `rgba(150,146,162,${0.82 * gray})`; c.fillRect(x, y, w, h); }
    if (world === 'past') { c.fillStyle = 'rgba(160,110,50,0.12)'; c.fillRect(x, y, w, h); }
    c.restore();
    c.strokeStyle = INK; c.lineWidth = Math.max(2, w * 0.006); c.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }
  // a flat: one place in one time (the whole backdrop), or the triptych (long ago · today · tomorrow, gray k)
  const FLATS = {};
  function flatTex(place, world, gray = 0) {
    const key = place + ':' + world + ':' + gray; if (FLATS[key]) return FLATS[key];
    const t = TK.canvasTex(1024, 420, (c, w, h) => {
      c.fillStyle = '#1c1420'; c.fillRect(0, 0, w, h);
      if (world === 'tri') { const pw = (w - 24) / 3; ['past', 'now', 'future'].forEach((wd, i) => paintPlace(c, 6 + i * (pw + 6), 6, pw, h - 12, place, wd, gray)); }
      else paintPlace(c, 0, 0, w, h, place, world, gray);
    });
    return (FLATS[key] = t);
  }

  // ------------------------------------------------------------ three tears over the proscenium (TIME's crack look: time.js's
  // shader, the same torn shape with its ragged ink rim), where the three times meet
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const FS = `uniform float uT; uniform vec3 uA; uniform vec3 uB; uniform float uK; varying vec2 vUv;
    void main(){
      vec2 p = vUv * 2.0 - 1.0;
      float pinch = 1.0 - 0.62 * p.y * p.y;
      vec2 q = vec2(p.x / max(pinch, 0.06), p.y);
      float r = length(q), a = atan(q.y, q.x);
      float edge = 0.82 + 0.04 * sin(a * 7.0 + uT * 1.3) + 0.03 * sin(a * 13.0 - uT * 2.1) + 0.018 * sin(a * 23.0 + uT * 3.3);
      float m = 1.0 - smoothstep(edge - 0.035, edge, r);
      float ink = smoothstep(edge - 0.13, edge - 0.07, r);
      float sw = smoothstep(0.25, 0.75, 0.5 + 0.5 * sin(a * 2.0 + r * 11.0 - uT * 2.2));
      vec3 col = mix(uB, uA, sw);
      col = mix(col, vec3(1.0, 0.99, 0.94), (1.0 - smoothstep(0.0, 0.34, r)) * 0.9);
      col = mix(col, vec3(0.17, 0.13, 0.21), ink);
      gl_FragColor = vec4(col, m * uK);
    }`;
  function tear(cA, cB) {
    const mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color(cA) }, uB: { value: new THREE.Color(cB) }, uK: { value: 0.9 } } });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.7), mat); m.renderOrder = 4; return m;
  }

  // ------------------------------------------------------------ the room (built the first time you come in)
  function emblemTex() {
    return TK.canvasTex(256, 128, (c, w, h) => {
      c.fillStyle = '#3a1820'; c.fillRect(0, 0, w, h); c.strokeStyle = '#e8b83e'; c.lineWidth = 4; c.strokeRect(4, 4, w - 8, h - 8);
      const cx = w / 2, cy = h / 2;
      c.fillStyle = '#efe4c8'; c.beginPath(); c.arc(cx, cy, 30, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - 20); c.moveTo(cx, cy); c.lineTo(cx + 13, cy + 8); c.stroke();
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, bx = cx + Math.sin(a) * 50, by = cy - Math.cos(a) * 42; c.fillStyle = '#e8b83e'; c.beginPath(); c.moveTo(bx - 6, by + 5); c.quadraticCurveTo(bx - 6, by - 8, bx, by - 8); c.quadraticCurveTo(bx + 6, by - 8, bx + 6, by + 5); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); }
    });
  }
  function build() {
    if (built) return B;
    built = true; css();
    const M = mats(), scene = G.w3d.scene, g = new THREE.Group(); g.name = 'fin-stage'; g.visible = false; scene.add(g);
    B = { g, people: {}, blocks: {}, haze: {}, motes: {}, tears: [], foot: [], lamps: [] };
    const plane = (w, h, mat, x, y, z, ry = 0, rx = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(R.x + x, y, R.z + z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; g.add(m); return m; };
    // the floor (carpet), the stage (boards), the walls (damask), the ceiling
    plane(22, 18.6, M.carpet, 0, Y0 + 0.01, 3.7, 0, -Math.PI / 2);
    plane(18, 7.4, M.boards, 0, STAGE_Y, -9.3, 0, -Math.PI / 2);
    plane(22, 9, M.wall, 0, Y0 + 4.5, 13, Math.PI); plane(26, 9, M.wall, -11, Y0 + 4.5, 0, Math.PI / 2); plane(26, 9, M.wall, 11, Y0 + 4.5, 0, -Math.PI / 2);
    plane(22, 9, M.dark, 0, Y0 + 4.5, -13);
    plane(22, 26, M.ceil, 0, Y0 + 9, 0, 0, Math.PI / 2);
    const k = FIN.Kit();
    // the stage's front: a dark-red face with a gold edge; the proscenium: two pillars, the beam, the valance
    k.box(R.x, Y0 + 0.55, R.z + FRONT, 18, 1.1, 0.12, '#5a1c24', { ink: 0.01 }).box(R.x, STAGE_Y + 0.01, R.z + FRONT + 0.04, 18.1, 0.06, 0.16, '#e8b83e', { ink: 0 });
    for (const s of [-1, 1]) { k.box(R.x + s * 8.4, Y0 + 3.9, R.z + ARCH, 1.4, 7.8, 0.7, '#6e2630', { ink: 0.02 }); k.box(R.x + s * 7.72, Y0 + 3.9, R.z + ARCH + 0.36, 0.08, 7.8, 0.08, '#e8b83e', { ink: 0 }); }
    k.box(R.x, STAGE_Y + 6.7, R.z + ARCH, 18.2, 1.4, 0.7, '#6e2630', { ink: 0.02 }).box(R.x, STAGE_Y + 6.0, R.z + ARCH + 0.36, 15.4, 0.08, 0.08, '#e8b83e', { ink: 0 });
    // the wings: dark legs either side, a border above the backdrop
    for (const s of [-1, 1]) for (const z of [-8.6, -10.6, -12.2]) k.box(R.x + s * 8.4, STAGE_Y + 3.0, R.z + z, 1.6, 6.0, 0.14, '#241a26', { ink: 0.01 });
    k.box(R.x, STAGE_Y + 6.3, R.z - 11.4, 17, 0.9, 0.14, '#241a26', { ink: 0.01 });
    // the prompter's shell on the apron (a half dome, open upstage), the music stand at his mark
    k.add(FIN.KG.half, R.x + SHELL.x, STAGE_Y, R.z + SHELL.z, 0.66, 0.62, 0.62, '#7a2630', { rx: Math.PI / 2, ink: 0.02 });
    k.add(FIN.KG.torus, R.x + SHELL.x, STAGE_Y, R.z + SHELL.z - 0.01, 0.66, 0.62, 0.3, '#e8b83e', { ink: 0 });
    k.rod([R.x + MARK.x + 0.55, STAGE_Y, R.z + MARK.z + 0.55], [R.x + MARK.x + 0.55, STAGE_Y + 1.05, R.z + MARK.z + 0.55], 0.025, '#2b2235', 0.006);
    k.box(R.x + MARK.x + 0.55, STAGE_Y + 1.12, R.z + MARK.z + 0.62, 0.46, 0.32, 0.03, '#2b2235', { rx: -0.5, ink: 0.006 });
    // Félix's piano, on the floor at the front left (the past's: it's drawn warm)
    const pc = FIN.TINT.past;
    k.box(R.x - 8.2, Y0 + 0.55, R.z - 4.3, 1.9, 1.1, 0.75, pc('#2b2025'), { ink: 0.02 }).box(R.x - 8.2, Y0 + 1.12, R.z - 4.05, 1.86, 0.05, 0.3, pc('#f4efe0'), { ink: 0.004 });
    // the back wall's doors and the side lamps
    for (const s of [-1, 1]) k.box(R.x + s * 5, Y0 + 1.3, R.z + 12.9, 1.6, 2.6, 0.1, '#2a1a1e', { ink: 0.01 });
    k.build(g);
    // the seats: three blocks of five rows of four, each block in its time's colors and its own material
    const BLOCKS = { past: [-9.4, -8.2, -7.0, -5.8], now: [-1.8, -0.6, 0.6, 1.8], future: [5.8, 7.0, 8.2, 9.4] };
    B.ROWS = [-3.6, -2.0, -0.4, 1.2, 2.8]; B.BLOCKS = BLOCKS;
    for (const [w, xs] of Object.entries(BLOCKS)) {
      const sk = FIN.Kit(), tint = FIN.TINT[w];
      for (const z of B.ROWS) for (const x of xs) {
        sk.at(TK.M4(R.x + x, Y0, R.z + z, 1, 1, 1, Math.PI), tint);
        sk.box(0, 0.42, 0, 0.84, 0.12, 0.7, '#a8303c', { ink: 0.01 }).box(0, 0.78, -0.4, 0.84, 0.7, 0.1, '#a8303c', { ink: 0.01 }).box(0, 0.2, 0, 0.7, 0.4, 0.5, '#4a2a26', { ink: 0 });
      }
      sk.at(null, null); sk.build(g, { mat: M[w] });
    }
    // the backdrop: two flats (one fades in over the other), on the fly bar
    B.flatA = plane(15.2, 6.24, new THREE.MeshBasicMaterial({ map: flatTex('alba', 'now') }), 0, STAGE_Y + 3.12, -12.8);
    B.flatB = plane(15.2, 6.24, new THREE.MeshBasicMaterial({ map: flatTex('alba', 'now'), transparent: true, opacity: 0 }), 0, STAGE_Y + 3.12, -12.75);
    // the emblem (the clock and its eight bells, as over today's door) on the stage's front
    plane(1.7, 0.85, new THREE.MeshBasicMaterial({ map: emblemTex() }), 0, Y0 + 0.55, FRONT + 0.08);
    // the curtain: two halves that gather at the pillars; its valance
    B.curtains = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 6.0), M.curtain); m.position.set(R.x + s * 4.1, STAGE_Y + 3.0, R.z + ARCH - 0.32); g.add(m); m.userData.s = s; return m; });
    B.curtainK = 0;
    plane(15.6, 0.7, M.curtain, 0, STAGE_Y + 5.75, ARCH - 0.28);
    // footlights, the chandelier
    for (let i = -3; i <= 3; i++) { const s = FIN.glow('#ffd28a', 1.4, 0.45); s.position.set(R.x + i * 2.3, STAGE_Y + 0.18, R.z + FRONT - 0.08); g.add(s); B.foot.push(s); }
    B.chand = FIN.glow('#fff0c8', 5.5, 0.35); B.chand.position.set(R.x, Y0 + 8.1, R.z + 3.5); g.add(B.chand);
    // the spot on his mark (a soft cone of light), and his red cap on the boards where it fell
    B.spot = new THREE.Mesh(new THREE.ConeGeometry(1.5, 6.2, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#fff3d0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    B.spot.position.set(R.x + MARK.x, STAGE_Y + 3.1, R.z + MARK.z); g.add(B.spot);
    const ck = FIN.Kit(); ck.add(FIN.KG.half, 0, 0, 0, 0.15, 0.11, 0.15, '#d23a32', { ink: 0.006 }).box(0, 0.01, 0.17, 0.18, 0.02, 0.14, '#d23a32', { ink: 0 });
    B.cap = new THREE.Group(); ck.build(B.cap); B.cap.position.set(R.x + MARK.x + 0.95, STAGE_Y, R.z + MARK.z + 0.5); B.cap.rotation.y = 0.7; g.add(B.cap);
    // each time's haze over its seats, its motes (long ago gold, tomorrow blue), and the three tears over the arch
    const HZ = { past: ['#e8b070', -7.6], now: ['#fff4dc', 0], future: ['#a8c0ff', 7.6] };
    for (const [w, [col, x]] of Object.entries(HZ)) {
      const h = FIN.glow(col, 9, 0.1, THREE.NormalBlending); h.scale.set(7, 5, 1); h.position.set(R.x + x, Y0 + 2.6, R.z - 0.4); g.add(h); B.haze[w] = h;
      if (w === 'now') continue;
      const n = 40, pos = new Float32Array(n * 3), seeds = [];
      for (let i = 0; i < n; i++) seeds.push({ x: x + (Math.random() - 0.5) * 6, z: -0.4 + (Math.random() - 0.5) * 8, y: Math.random() * 5, v: 0.2 + Math.random() * 0.3 });
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: TK.sparkTex, color: w === 'past' ? '#ffd98a' : '#bcd0ff', size: 0.16, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
      pts.frustumCulled = false; g.add(pts); B.motes[w] = { pts, pos, seeds };
    }
    // (a seam across the proscenium: long ago's tear, today's, tomorrow's, end to end where the times meet)
    [['#ffd166', '#a8683a'], ['#8fe8b8', '#2f9a8a'], ['#9db8ff', '#7a4fd8']].forEach(([a, b], i) => {
      const t = tear(a, b); t.position.set(R.x + (i - 1) * 4.6, STAGE_Y + 6.68, R.z + ARCH + 0.42); t.rotation.z = Math.PI / 2; t.scale.setScalar(0.62); g.add(t); B.tears.push(t);
    });
    B.tearGlow = FIN.glow('#fff3c8', 6, 0.3); B.tearGlow.scale.set(14, 3, 1); B.tearGlow.position.set(R.x, STAGE_Y + 6.68, R.z + ARCH + 0.5); g.add(B.tearGlow);
    // over each block, its time: a banner with its name («el Ayer», «el Hoy», «el Mañana»), and a shaft of its light
    B.banners = {};
    for (const [w, [col, x]] of Object.entries(HZ)) {
      const ban = new THREE.Group(); ban.position.set(R.x + x * 0.86, Y0 + 6.2, R.z - 1.2); g.add(ban);
      for (const s of [0, 1]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.98), new THREE.MeshBasicMaterial({ transparent: true })); m.rotation.y = s ? Math.PI : 0; m.position.z = s ? -0.01 : 0.01; ban.add(m); }
      const rk = FIN.Kit(); rk.rod([-1.6, 0.56, 0], [1.6, 0.56, 0], 0.04, '#3a2a20', 0.006); for (const sx of [-1.4, 1.4]) rk.rod([sx, 0.56, 0], [sx * 0.4, 2.7, 0], 0.012, '#2b2235', 0); rk.build(ban, { shadow: false });
      B.banners[w] = { g: ban, key: '' };
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 3.4, 8.2, 20, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.06, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      shaft.position.set(R.x + x, Y0 + 4.4, R.z - 0.4); g.add(shaft); B.haze[w + 'Shaft'] = shaft;
    }
    paintBanners();
    // the floor you can walk on (the stage and the apron; the stalls are for the audience) and the walls
    WORLD.addPlatforms([{ box: [R.x - 9, R.x + 9, R.z - 13, R.z + FRONT], top: STAGE_Y }, { box: [R.x - 11, R.x + 11, R.z + FRONT, R.z + 13], top: Y0 }]);
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z + FRONT + 0.2, hw: 9.2, hd: 0.25, rot: 0 }, { obox: 1, x: R.x, z: R.z - 13.2, hw: 11, hd: 0.3, rot: 0 },
      { obox: 1, x: R.x - 9.3, z: R.z - 9.3, hw: 0.3, hd: 4, rot: 0 }, { obox: 1, x: R.x + 9.3, z: R.z - 9.3, hw: 0.3, hd: 4, rot: 0 }]);
    buildPeople();
    return B;
  }
  // the banners' names, in the language you're learning (repainted if it changes)
  function paintBanners() {
    if (!B || !B.banners) return;
    const l = lang(), COL = { past: ['#b9772f', '#fff2d0'], now: ['#2f8a7e', '#ffffff'], future: ['#6656c0', '#f2f0ff'] };
    for (const [w, Bn] of Object.entries(B.banners)) {
      if (Bn.key === l) continue; Bn.key = l;
      const RL = TIME.RULES[w], nm = FIN.plainT(RL.name[l] || RL.name.en, l), [bg, fg] = COL[w];
      const tex = TK.canvasTex(512, 156, (c, W0, H0) => {
        c.fillStyle = bg; c.beginPath(); c.moveTo(0, 0); c.lineTo(W0, 0); c.lineTo(W0, H0 - 30); c.lineTo(W0 / 2, H0); c.lineTo(0, H0 - 30); c.closePath(); c.fill();
        c.strokeStyle = '#2b2235'; c.lineWidth = 6; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(0, 0, W0, 10);
        c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `italic 700 ${nm.length > 12 ? 50 : 62}px Georgia, "Yu Mincho", "Microsoft YaHei", serif`; c.fillText('«' + nm + '»', W0 / 2, 64);
      });
      Bn.g.children.forEach(m => { if (m.isMesh && m.material && m.material.map !== undefined && m.geometry.type === 'PlaneGeometry') { m.material.map = tex; m.material.needsUpdate = true; } });
    }
  }
  // the backdrop: a new flat, faded in over the old one (k: seconds)
  async function flat(place, world, sec = 0.8, gray = 0) {
    if (!B) return;
    const tex = flatTex(place, world, gray);
    if (B.flatA.material.map === tex && B.flatB.material.opacity < 0.01) return;
    B.flatB.material.map = tex; B.flatB.material.needsUpdate = true; B.flatB.material.opacity = 0;
    await tween(sec, k => { B.flatB.material.opacity = k; });
    B.flatA.material.map = tex; B.flatA.material.needsUpdate = true; B.flatB.material.opacity = 0;
  }
  const PLACE = k => String(k).split('.')[0];
  const WORLD_OF = k => (/\.past$/.test(k) ? 'past' : /\.future$/.test(k) ? 'future' : 'now');
  // which act is lit (its seats, its haze): 'past' | 'now' | 'future' | 'all' | null (the house dark)
  let lit = null, litK = { past: 0.5, now: 0.5, future: 0.5 };
  function light(w) { lit = w; }
  function curtain(open, sec = 2.2) { const k0 = B.curtainK, k1 = open ? 1 : 0; if (sec <= 0 || FIN.fast()) { B.curtainK = k1; return Promise.resolve(); } snd('swoosh'); return tween(sec, k => { B.curtainK = lerp(k0, k1, k * k * (3 - 2 * k)); }); }

  // ------------------------------------------------------------ the people: three audiences in their seats (merged crowds, one per
  // time), the named ones who act (people of their own), Elio and Noa
  const L0 = (o) => Object.assign({ seat: true }, o);
  const LOOKS = {
    // long ago: the concert's night (they're drawn sepia)
    aurora: { skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'bun', dress: '#5c4a7a', shawl: '#e8b83e', prop: 'baton', h: 1.05 },
    felix: { skin: '#a8714a', hair: '#1f1a18', dress: '#2b2235', vest: '#7a4fa0', hat: 'beret', hatColor: '#7a4fa0', h: 1.06 },
    rosita: { kid: true, skin: '#efc29a', hair: '#8a4a2a', hairdo: 'braids', ribbon: '#e2453a', dress: '#e07a4f', apron: '#fbf6ee', prop: 'lantern', h: 0.76 },
    dadThen: { skin: '#d9a87e', hair: '#2b211d', hairdo: 'short', dress: '#5c6fa8', vest: '#d8c39a', stache: true, hair2: '#2b211d', h: 1.04 },
    // today
    rosa: { skin: '#efc29a', hair: '#f4f1ea', hairdo: 'bun', dress: '#8a4f7d', apron: '#fbf6ee', glasses: true, hat: 'straw', hatColor: '#e05a4b', h: 1.0 },
    ramiro: { skin: '#d9a27a', hair: '#3a2b26', hairdo: 'short', dress: '#8a5a4a', hat: 'flat', hatColor: '#5a6f4a', h: 1.02 },
    // tomorrow
    sami: { kid: true, skin: '#d9a87e', hair: '#2b211d', hairdo: 'tails', dress: '#3e8f8a', ribbon: '#ffd84a', h: 0.74 },
  };
  // the crowds (everyone else, by block: a look each, the seats they take)
  const CROWDS = {
    past: [
      { skin: '#e6b48c', hair: '#e8e4dc', hairdo: 'bald', beard: true, stache: true, dress: '#4f5f7a', vest: '#8a6a4a', hat: 'flat', hatColor: '#3d3a48' },
      { kid: true, skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#3f7fc9', vest: '#e8d4b0', h: 0.8 },
      { kid: true, skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'tails', dress: '#e8a0b8', ribbon: '#ffffff', h: 0.7 },
      { skin: '#f0c7a0', hair: '#5a3a26', hairdo: 'bun', dress: '#e8d4b0', apron: '#ffffff', hat: 'scarf', hatColor: '#d0663f' },
      { skin: '#c98e62', hair: '#2e2420', dress: '#3d5fa1', hat: 'straw', hatColor: '#3f7fc9', stache: true, hair2: '#2e2420' },
      { skin: '#a8714a', hair: '#1f1a18', dress: '#7a4fa0', shawl: '#e8b83e', hairdo: 'bun' },
      { skin: '#efc29a', hair: '#e8e4dc', hairdo: 'bun', dress: '#5c4a7a', glasses: true, shawl: '#c9443a' },
      { skin: '#dcae86', hair: '#4a3020', dress: '#6f8a4a', vest: '#a8784e', hat: 'flat' },
      { skin: '#e6b48c', hair: '#8a6a4a', hairdo: 'tails', dress: '#3e8f8a', apron: '#fdf8ee' },
      { skin: '#f0c7a0', hair: '#c9873a', dress: '#e2453a', hairdo: 'bun' },
      { skin: '#c98e62', hair: '#2b211d', dress: '#5a5a7a', glasses: true, vest: '#8a6a4a' },
      { skin: '#e6b48c', hair: '#3a2b26', dress: '#c9443a', hat: 'cap', hatColor: '#3d5fa1' },
      { kid: true, skin: '#d9a87e', hair: '#2b211d', dress: '#ffd84a', h: 0.68 },
      { skin: '#f0c7a0', hair: '#6b3b25', dress: '#8a5f3e', hairdo: 'braids', ribbon: '#e8b83e' },
    ],
    now: [
      { skin: '#c98e62', hair: '#2e2420', dress: '#7a5a8a', hat: 'flat', hatColor: '#3d3a48', wide: 1.1, h: 1.06 },
      { skin: '#e6b48c', hair: '#3a2b26', dress: '#f2e6d0', apron: '#ffffff', hat: 'scarf', hatColor: '#fffaf0', wide: 1.1 },
      { skin: '#d9a27a', hair: '#3a2b26', dress: '#8a5a4a', hat: 'flat', hatColor: '#5a6f4a' },
      { skin: '#e6b48c', hair: '#2b211d', dress: '#2f3a4a', vest: '#e8b83e', prop: 'lantern' },
      { skin: '#f0c7a0', hair: '#8a4a2a', hairdo: 'tails', dress: '#c9553f', apron: '#fdf8ee' },
      { kid: true, skin: '#f0c7a0', hair: '#6b3b25', dress: '#e0743c', hat: 'cap', hatColor: '#3f7fc9', h: 0.76 },
      { skin: '#efc29a', hair: '#e8c57a', hairdo: 'bun', dress: '#6fae4f', hat: 'straw', hatColor: '#e05a4b' },
      { kid: true, skin: '#e6b48c', hair: '#3a2a24', hairdo: 'tails', dress: '#e8a0b8', h: 0.72 },
      { skin: '#a8714a', hair: '#1f1a18', dress: '#2f5f8a', hat: 'cap', hatColor: '#2b3a5a', beard: true, hair2: '#1f1a18' },
      { skin: '#e6b48c', hair: '#4a3020', dress: '#a8784e', hat: 'straw', hatColor: '#8a5f3e', glasses: true },
      { skin: '#f0c7a0', hair: '#2b211d', hairdo: 'bun', dress: '#7a4fa0', glasses: true },
      { kid: true, skin: '#d9a87e', hair: '#2b211d', dress: '#5fae4f', h: 0.74 },
      { skin: '#c98e62', hair: '#e8e4dc', hairdo: 'bald', dress: '#5a6a7a', beard: true, hair2: '#e8e4dc' },
      { skin: '#efc29a', hair: '#c9873a', dress: '#3e8f8a', hairdo: 'tails', ribbon: '#ffd84a' },
    ],
    future: [
      { skin: '#e6b48c', hair: '#3a2b26', dress: '#3f7fc9', vest: '#e8d4b0' },
      { skin: '#f0c7a0', hair: '#6b3b25', dress: '#e0743c', hat: 'cap', hatColor: '#3f7fc9' },
      { skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'bun', dress: '#8a5ab0', shawl: '#c9b3f0', glasses: true },
      { skin: '#c98e62', hair: '#2e2420', dress: '#2f5f8a', hat: 'flat', hatColor: '#e8b83e' },
      { skin: '#efc29a', hair: '#8a4a2a', hairdo: 'tails', dress: '#e07ab0', hat: 'beret', hatColor: '#c9443a' },
      { skin: '#d9a87e', hair: '#2b211d', hairdo: 'braids', dress: '#4f9a6a', prop: 'lantern' },
      { skin: '#e6b48c', hair: '#2b211d', dress: '#3a6a8a', hat: 'cap', hatColor: '#e8e4dc' },
      { skin: '#a8714a', hair: '#e8e4dc', hairdo: 'bun', dress: '#5c4a7a', glasses: true },
      { kid: true, skin: '#f0c7a0', hair: '#c9873a', dress: '#9db8ff', h: 0.7 },
      { skin: '#dcae86', hair: '#e8e4dc', hairdo: 'bald', dress: '#4f5f7a', stache: true, hair2: '#e8e4dc' },
      { skin: '#f0c7a0', hair: '#3a2a24', dress: '#2f8f8a', hairdo: 'tails' },
      { kid: true, skin: '#c98e62', hair: '#2e2420', dress: '#ffd84a', hat: 'cap', hatColor: '#3f7fc9', h: 0.74 },
    ],
  };
  // who sits where (block, row, seat): the named ones; the crowds take the rest of the front three rows and a few further back
  const SEATS = { felix: null, rosita: ['past', 0, 2], dadThen: ['past', 0, 3], rosa: ['now', 0, 1], dad: ['now', 0, 0], bruno: ['now', 0, 2], ramiro: ['now', 1, 2], sami: ['future', 0, 0] };
  const seatPos = (w, r, i) => ({ x: B.BLOCKS[w][i], z: B.ROWS[r] });
  const seatedY = h => Y0 + 0.42 + 0.36 * h;
  function buildPeople() {
    const M = mats(), g = B.g, taken = {};
    for (const [id, s] of Object.entries(SEATS)) if (s) taken[s.join(':')] = id;
    // the named ones (each its own: they stand, wave, walk); in their block's material, in their time's colors
    const named = (id, look, w, pos, seated, y0) => {
      const o = Object.assign({}, look, { seat: !!seated, mat: M[w], tint: FIN.TINT[w] });
      const h = o.h || (o.kid ? 0.78 : 1), y = seated ? seatedY(h) : y0 !== undefined ? y0 : Y0;
      const P = FIN.person(id, o, g, { x: R.x + pos.x, y, z: R.z + pos.z, yaw: Math.PI }); P.w = w; P.seated = !!seated; P.home = { x: P.api.x, y, z: P.api.z, yaw: Math.PI };
      B.people[id] = P; return P;
    };
    named('rosita', L0(LOOKS.rosita), 'past', seatPos('past', 0, 2), true);
    named('dadThen', L0(LOOKS.dadThen), 'past', seatPos('past', 0, 3), true);
    named('rosa', L0(LOOKS.rosa), 'now', seatPos('now', 0, 1), true);
    named('ramiro', L0(LOOKS.ramiro), 'now', seatPos('now', 1, 2), true);
    named('bruno', L0(FIN.BRUNO_LOOK), 'now', seatPos('now', 0, 2), true);          // (he came down from the top with you)
    named('sami', L0(LOOKS.sami), 'future', seatPos('future', 0, 0), true);
    if (X().DAD.on) named('dad', Object.assign({}, X().DAD.look), 'now', seatPos('now', 0, 0), true);
    // Aurora stands on the apron's left (the choir's director, long ago's), Félix at the piano below her
    named('aurora', LOOKS.aurora, 'past', { x: -5.3, z: -6.2 }, false, STAGE_Y);
    const fx = named('felix', L0(LOOKS.felix), 'past', { x: -8.2, z: -3.5 }, true); fx.api.yaw = Math.PI; fx.g.rotation.y = Math.PI;
    // the crowds: one merged mesh each, everyone seated, facing the stage
    for (const w of ['past', 'now', 'future']) {
      const k = FIN.Kit(), looks = CROWDS[w]; let n = 0;
      for (let r = 0; r < B.ROWS.length; r++) for (let i = 0; i < 4; i++) {
        if (taken[[w, r, i].join(':')]) continue;
        if (r >= 3 && (r + i) % 2) continue;                 // (the back rows a little emptier)
        const o = L0(looks[(n * 5 + r * 3 + i) % looks.length]), h = o.h || (o.kid ? 0.78 : 1), p = seatPos(w, r, i); n++;
        k.at(TK.M4(R.x + p.x, seatedY(h), R.z + p.z, h, h, h, Math.PI), FIN.TINT[w]);
        FIN.drawPerson(k, o);
      }
      k.at(null, null);
      const meshes = k.build(g, { mat: M[w] }); B.blocks[w] = { meshes, n };
    }
    // Elio and Noa (today's colors: they're here now)
    const E = B.people.elio = FIN.person('elio', Object.assign({}, FIN.ELIO_LOOK, { capOn: false, grin: true }), g, { x: R.x + WINGS.x - 1.0, y: STAGE_Y, z: R.z + WINGS.z - 0.4, yaw: Math.PI / 2 });
    E.home = { x: E.api.x, y: STAGE_Y, z: E.api.z, yaw: Math.PI / 2 };
    B.people.noa = FIN.person('noa', FIN.NOA_LOOK, g, { x: R.x + WINGS.x - 1.5, y: STAGE_Y, z: R.z + WINGS.z + 0.5, yaw: Math.PI / 2 });
    // a frog (for Ramiro's scene: Lantern Night's frog, forty years on, hopping onto the stage)
    const fk = FIN.Kit(); fk.add(FIN.KG.sphere, 0, 0.12, 0, 0.18, 0.12, 0.2, '#5fae4f', { ink: 0.01 }); for (const s of [-1, 1]) { fk.add(FIN.KG.sphere, s * 0.08, 0.24, 0.1, 0.06, 0.06, 0.06, '#ffffff', { ink: 0.005 }); fk.add(FIN.KG.ball6, s * 0.08, 0.25, 0.15, 0.025, 0.025, 0.02, '#2b2235', { ink: 0 }); fk.add(FIN.KG.sphere, s * 0.14, 0.05, 0.06, 0.07, 0.04, 0.1, '#4f9a3f', { ink: 0.005 }); }
    B.frog = new THREE.Group(); fk.build(B.frog); B.frog.visible = false; g.add(B.frog);
  }
  const P = id => (B && B.people[id]) || null;
  const nameAll = () => {
    const l = lang();
    for (const [id, Pp] of Object.entries(B.people)) Pp.api.name = id === 'dad' ? FIN.plainT(pick(X().DAD.name, l), l) : id === 'dadThen' ? FIN.nameOf('dadThen') : FIN.nameOf(id);
  };
  // stand up / sit down (a named one), and walk somewhere (x, z: the room's own; y: the floor they end on)
  function stand(Pp, on) { if (!Pp || !Pp.seated) return; Pp.up = on; }
  async function walk(Pp, x, z, sec = 1.4, y) {
    if (!Pp) return; const a = Pp.api, x0 = a.x, z0 = a.z, y0 = a.y, x1 = R.x + x, z1 = R.z + z, y1 = y !== undefined ? y : a.y;
    Pp.up = false; Pp.seated = false; Pp.walking = true;
    const yaw = Math.atan2(x1 - x0, z1 - z0);
    await tween(sec, k => { const e = k * k * (3 - 2 * k); FIN.place(Pp, lerp(x0, x1, e), lerp(z0, z1, e), yaw, lerp(y0, y1, e) + Math.sin(k * Math.PI * Math.max(1, Math.round(sec * 3))) * 0.04); });
    Pp.walking = false;
  }
  const face = (Pp, x, z) => { if (Pp) FIN.faceTo(Pp, R.x + x, R.z + z); };

  // ------------------------------------------------------------ the scenes
  let mode = null;                 // the music: 'wings' · 'speech' · 'silence' · 'bells' (song())
  let wantPick = null;             // (tests: the page he needs right now)
  const lock = on => FIN.lock(on);
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
  function putYou(x, z, yaw) {
    const Y = G.sim.you, Mm = G.sim.mimo;
    Y.x = R.x + x; Y.z = R.z + z; Y.yaw = yaw; Mm.x = Y.x + 0.9; Mm.z = Y.z + 0.25; Mm.hidden = false; Mm.wander = null; Mm.station = null; Mm.look = null;
    G.sim.snap(); G.cam.snap(yaw, 0.42, 6.5);
  }
  // in: backstage (o.from: 'tower' after the clock, 'door' from today's theater). The save keeps today's forecourt (OUTSIDE).
  async function enter(o = {}) {
    build(); nameAll();
    const S0 = FIN.st(), E = P('elio'), N = P('noa');
    inside = true; B.g.visible = true;
    G.w3d.setInterior({ fog: '#150f1a', near: 22, far: 80 });
    try { if (TIME.look && TIME.look.on) TIME.look.off(); } catch (e) { /* */ }
    B.curtainK = 0; light(null);
    if (S0.wings) { FIN.place(E, R.x + MARK.x, R.z + MARK.z, 0, STAGE_Y); if (E.cap) E.cap.visible = true; B.cap.visible = false; }
    else { FIN.place(E, E.home.x, E.home.z, E.home.yaw, STAGE_Y); if (E.cap) E.cap.visible = false; B.cap.visible = true; }
    if (E.grin) E.grin.visible = !!S0.speech;          // (his grin comes with the laugh)
    FIN.place(N, R.x + WINGS.x - 1.5, R.z + WINGS.z + 0.5, Math.PI / 2, STAGE_Y);
    for (const Pp of Object.values(B.people)) if (Pp.home && Pp.id !== 'elio') { FIN.place(Pp, Pp.home.x, Pp.home.z, Pp.home.yaw, Pp.home.y); Pp.up = false; Pp.fade = 1; }
    for (const w of ['past', 'future']) { const m = mats()[w]; if (m.transparent) { m.transparent = false; m.opacity = 1; m.needsUpdate = true; } }
    putYou(WINGS.x, WINGS.z, -Math.PI / 2);
    mode = 'wings';
    G.save();
  }
  async function leave(o = {}) {
    if (!o.quiet) await UI.fade(1, 420);
    if (B) B.g.visible = false; inside = false; mode = null; G.w3d.setInterior(null); G.cam.override = null;
    const Y = G.sim.you; Y.x = OUTSIDE.x; Y.z = OUTSIDE.z + 1.2; Y.yaw = OUTSIDE.yaw; G.sim.mimo.x = Y.x + 1.0; G.sim.mimo.z = Y.z + 0.6; G.sim.mimo.station = null; G.sim.mimo.look = null; G.sim.snap(); G.cam.snap(Y.yaw, 0.28, 8.5);
    if (!o.quiet) await UI.fade(0, 420);
    G.save();
  }
  // the wings: his hands shake; Noa; his red cap, still where it fell forty years ago
  async function wings() {
    if (!inside) return;
    const S0 = FIN.st(); if (S0.speech) return;
    const E = P('elio'), N = P('noa');
    lock(true);
    try {
      if (!S0.wings) {
        shot([WINGS.x + 1.7, 2.8, WINGS.z + 2.4], [WINGS.x - 1.2, 2.3, WINGS.z - 0.2], 0.01);
        await wait(0.7);
        face(E, WINGS.x, WINGS.z); face(N, WINGS.x, WINGS.z);
        await FIN.say(E.api, X().LINES['elio.hands']);
        await FIN.say(N.api, X().LINES['noa.wings']);
        // he goes behind the curtain, to his mark… and there it is
        shot([4.2, 2.9, -8.0], [MARK.x + 0.5, 1.6, MARK.z + 0.1], 0.9);
        await walk(E, -7.0, -8.6, 0.9, STAGE_Y); await walk(E, MARK.x + 0.3, MARK.z + 0.1, 1.6, STAGE_Y);
        face(E, MARK.x + 0.95, MARK.z + 0.5);
        await tween(0.5, k => { E.body.rotation.x = 0.45 * k; });
        B.cap.visible = false; if (E.cap) E.cap.visible = true; snd('chime'); G.w3d.fx.sparkle(E.api.x, STAGE_Y + 1.6, E.api.z, 10, ['#ff9a8a', '#ffd98a']);
        await tween(0.5, k => { E.body.rotation.x = 0.45 * (1 - k); });
        await FIN.say(E.api, X().LINES['elio.cap']);
        FIN.place(E, R.x + MARK.x, R.z + MARK.z, 0, STAGE_Y);
        S0.wings = true; G.save();
      }
    } catch (e) { console.error('[finale] wings', e); }
    finally { lock(false); }
    FIN.think(X().YOU.wings, 6);
  }
  // camera shots on him: from the stalls, from the side, from the shell (they take turns)
  let shotN = 0;
  function elioShot() {
    const n = shotN++ % 3;
    if (n === 0) shot([1.4, 2.4, -3.2], [MARK.x, 2.3, MARK.z], 0.8);
    else if (n === 1) shot([-3.4, 2.7, MARK.z + 2.8], [MARK.x, 2.3, MARK.z], 0.8);
    else shot([1.4, 3.0, BOX.z + 2.0], [MARK.x, 2.4, MARK.z], 0.8);
  }
  const fromShell = () => shot([1.4, 3.1, BOX.z + 2.1], [MARK.x - 0.1, 2.0, MARK.z], 0.7);
  // he loses his place: «…», a breath of gray at his feet, he looks down at the shell
  async function falter() {
    const E = P('elio');
    floatOver(E, '…', { gray: true });
    G.w3d.fx.puff(E.api.x, STAGE_Y + 0.1, E.api.z, 6, 0.3, '#9c98ad', 0.4);
    fromShell();
    await tween(0.4, k => { E.body.rotation.x = 0.18 * k; });
    await wait(0.5);
    E.body.rotation.x = 0;
  }
  const ACTN = { past: 1, now: 2, future: 3 };
  async function step(it) {
    const S0 = FIN.st(), E = P('elio');
    if (it.act) {
      S0.act = Math.max(S0.act || 1, ACTN[it.act]); G.save();
      light(it.act);
      shot([0, 5.2, 12.2], [0, 2.2, -6], 0.8);
      await actCard(ACTN[it.act], it.act);
      await flat('alba', it.act, 0.8);
      return;
    }
    if (it.echo) { await flat(PLACE(it.echo), WORLD_OF(it.echo), 0.7); elioShot(); await FIN.demo(E.api, FIN.echo(it.echo)); await beat(it.beat); return; }
    if (it.pick) { await pickPage(it); return; }
    if (it.bridge) { await bridge(it.bridge); return; }
    if (it.line) { elioShot(); await FIN.say(E.api, X().LINES[it.line]); await beat(it.beat); return; }
    if (it.laugh) { await laugh(); return; }
    if (it.thanks) { await thanks(); return; }
  }
  // a page he's lost: which memory comes next? (his places and seasons under each line; a wrong one, he says so, gently)
  async function pickPage(it) {
    const E = P('elio'), l = lang();
    await falter();
    for (;;) {
      const opts = shuffle([it.pick, ...it.among]).map(k => ({ label: FIN.plainT(pick(FIN.echo(k) || {}, l), l), sub: X().TAGS[k], value: k }));
      wantPick = it.pick;
      const v = await UI.choose('He’s lost his place. Which memory comes next?', opts);
      if (v === it.pick) break;
      snd('wrong'); G.sim.mimo.tiltT = 1.4;
      if (v) await FIN.say(E.api, X().LINES[/\.future$/.test(v) ? 'elio.notyet' : 'elio.later']);
      else FIN.think('He’s waiting for the next page. Each line shows its place and its season.', 4);
    }
    wantPick = null; snd('page');
    await flat(PLACE(it.pick), WORLD_OF(it.pick), 0.6);
    elioShot();
    await FIN.demo(E.api, FIN.echo(it.pick));
  }
  // a bridge: you whisper it from the shell (the help ladder on the box: the frame, the chips, «?»), and he says it aloud
  async function bridge(b) {
    const S0 = FIN.st(), E = P('elio'), T = X().TASKS[b];
    await falter();
    if (!S0.bridges[b]) {
      const r = await FIN.ask(T, { title: T.title });
      S0.bridges[b] = r.letter; S0.lines[b] = r.text; G.save();
    }
    elioShot();
    await FIN.demo(E.api, T.model);
  }
  // the moments in the seats
  async function beat(kind) {
    if (!kind) return;
    if (kind === 'papa') { const d = P('dadThen'); shot([-7.0, 2.2, -5.6], [-6.4, 1.2, -3.6], 0.7); if (d) { d.hop = 0.5; G.w3d.fx.sparkle(d.api.x, d.api.y + 1.4, d.api.z, 8, ['#ffd98a', '#fff3c8']); } floatOver(d, '♥', { gold: true }); await wait(1.4); if (d) d.hop = 0; return; }
    if (kind === 'lantern') { const r = P('ramiro'); shot([0.6, 2.7, -5.0], [0.6, 1.3, -2.0], 0.7); if (r) r.bow = 1; await wait(1.8); if (r) r.bow = 0; return; }
    if (kind === 'today') { shot([-2.1, 3.0, -7.1], [-0.6, 1.2, -3.4], 0.7); for (const id of ['rosa', 'dad', 'bruno']) { const q = P(id); if (q) q.hop = 0.45; } await wait(1.4); for (const id of ['rosa', 'dad', 'bruno']) { const q = P(id); if (q) q.hop = 0; } return; }
    if (kind === 'dad') {
      // «Dad, next time I'll tell you where I am»: both of his dads stand, the one of then and the one of today
      const d0 = P('dadThen'), d1 = P('dad');
      shot([-4.0, 2.4, -6.2], [-3.6, 1.4, -3.6], 0.8);
      stand(d0, true); stand(d1, true);
      if (d1 && X().DAD.on) await FIN.say(d1.api, X().DAD.lines['dad.stand']); else await wait(1.4);
      await wait(0.6); stand(d0, false); stand(d1, false);
      return;
    }
    if (kind === 'bells') {
      light('all'); mode = 'bells';
      shot([0, 5.2, 12.2], [0, 2.2, -6], 0.9);
      for (let i = 0; i < 8; i++) { snd('bell'); await wait(0.34); }
      snd('bigbell'); clapSfx(90, 4.5); laughSfx(2, 1.1);
      for (const Pp of Object.values(B.people)) if (Pp.w) { Pp.hop = 0.5; stand(Pp, true); }
      for (let i = 0; i < 14; i++) { const w = ['past', 'now', 'future'][i % 3], xs = B.BLOCKS[w]; floatText(i % 4 ? '♪' : '¡!', R.x + xs[i % 4], Y0 + 2.2, R.z + B.ROWS[i % 3], { small: true, gold: w === 'past' }); await wait(0.12); }
      await wait(1.2);
    }
  }
  // the laugh: the same slip, forty years later. He catches it himself and grins first; the old fear flickers at his feet, but he's
  // smiling; {mimo} goes hunting for it; Sami giggles; then the whole theater laughs with him, in all three times. Never before he smiles.
  async function laugh() {
    const S0 = FIN.st(), E = P('elio'), sim = G.sim, M = sim.mimo, l = lang(), Sl = X().SLIP[l] || X().SLIP.es;
    S0.act = 4; G.save();
    // he turns to thank them… and it slips out
    face(E, -1.8, -3.6);
    shot([0.8, 2.3, -4.6], [MARK.x, 2.4, MARK.z], 0.8);
    await FIN.demo(E.api, { en: Sl.en, [l]: Sl.slip });
    // a beat: the music stops; nobody moves
    mode = 'silence'; light(null);
    floatOver(E, '!', {}); await wait(1.2);
    // he heard it himself… and grins, first
    shot([-0.9, 2.55, MARK.z + 2.2], [MARK.x, 2.4, MARK.z], 0.6);
    await wait(0.5);
    if (E.grin) E.grin.visible = true; E.smile = 1;
    FIN.think(X().YOU.smile, 4.5);
    await wait(1.0);
    // the old fear flickers at his feet (the gray, the cold light), but he keeps smiling
    const fog = [];
    for (let i = 0; i < 6; i++) { const sp = FIN.glow('#8f8ca0', 0.8 + (i % 3) * 0.3, 0.5, THREE.NormalBlending); sp.position.set(E.api.x + (Math.random() - 0.5) * 0.9, STAGE_Y + 0.25, E.api.z + (Math.random() - 0.5) * 0.9); B.g.add(sp); fog.push(sp); }
    snd('tick'); B.spotDim = 0.4;
    await tween(1.2, k => { fog.forEach((sp, i) => { sp.position.y = STAGE_Y + 0.25 + k * (0.3 + i * 0.05); sp.material.opacity = 0.5 * Math.sin(k * Math.PI); }); });
    // {mimo} pops out of the shell, hunting for it
    // (from above his bubble's height, and off to the side, so the bubble sits on him and not on Elio behind)
    shot([3.4, 3.6, -3.4], [1.5, 1.3, -8.0], 0.6);
    sim.mimoGo({ x: R.x + 2.7, z: R.z - 7.5 }, { x: R.x + 3.8, z: R.z - 8.6 }); sim.mimoSay(Sl.mimo, 3); M.tiltT = 2.2; snd('chirp');
    await wait(1.3);
    shot([-3.4, 3.6, -3.4], [-1.5, 1.3, -8.0], 0.5);
    sim.mimoGo({ x: R.x - 2.7, z: R.z - 7.5 }, { x: R.x - 3.8, z: R.z - 8.6 }); sim.mimoSay(Sl.mimo, 2.4); M.tiltT = 2.0; snd('chirp');
    await wait(1.3);
    // Sami giggles first…
    const sa = P('sami');
    shot([5.2, 2.0, -5.6], [5.8, 1.1, -3.6], 0.6);
    floatOver(sa, Sl.giggle, { small: true }); laughSfx(1, 1.7); if (sa) sa.hop = 0.6;
    await wait(1.2);
    // …then the whole theater, with him: he laughs too, and the gray at his feet blows away
    mode = 'bells'; light('all'); B.spotDim = 1;
    shot([0, 5.2, 12.2], [0, 2.2, -6], 0.7);
    laughSfx(10, 1); E.hop = 0.6;
    fog.forEach(sp => B.g.remove(sp));
    G.w3d.fx.puff(E.api.x, STAGE_Y + 0.2, E.api.z, 12, 0.35, '#e8e4f0', 1.2);
    for (let i = 0; i < 16; i++) { const w = ['past', 'now', 'future'][i % 3], xs = B.BLOCKS[w]; floatText(Sl.laughs[i % Sl.laughs.length], R.x + xs[(i * 3) % 4], Y0 + 2.0, R.z + B.ROWS[(i * 2) % 4], { small: i % 2 === 1, gold: w === 'past' }); if (i % 4 === 0) laughSfx(3, 0.9 + Math.random() * 0.3); await wait(0.14); }
    floatOver(E, Sl.laughs[0], { gold: true });
    if (sa) sa.hop = 0; E.hop = 0;
    face(E, 0, 4);
    elioShot();
    await FIN.say(E.api, { en: Sl.jokeEn, [l]: Sl.joke });
    M.station = null; sim.mimoGo({ x: R.x + BOX.x + 0.85, z: R.z + BOX.z + 0.15 }, { x: R.x + MARK.x, z: R.z + MARK.z });
  }
  // he says the word right this time; his dad's answer (DAD block)
  async function thanks() {
    const E = P('elio'), l = lang(), Sl = X().SLIP[l] || X().SLIP.es;
    elioShot();
    await FIN.demo(E.api, { en: Sl.rightEn, [l]: Sl.right });
    const d = P('dad');
    if (d && X().DAD.on) { shot([-1.0, 2.0, -5.6], [-1.8, 1.2, -3.6], 0.7); d.hop = 0.5; await FIN.say(d.api, X().DAD.lines['dad.laugh']); d.hop = 0; }
    face(E, 0, 4);
  }
  // the speech (E in the prompter's box): from the start of the act you're in; the bridges you've whispered stay whispered
  async function speech() {
    const S0 = FIN.st(); if (S0.speech) return aftermath();
    const E = P('elio'), sim = G.sim;
    lock(true);
    try {
      S0.bridges = S0.bridges || {}; S0.lines = S0.lines || {};
      putYou(BOX.x, BOX.z, Math.PI);
      sim.mimoGo({ x: R.x + BOX.x + 0.85, z: R.z + BOX.z + 0.15 }, { x: R.x + MARK.x, z: R.z + MARK.z });
      FIN.place(E, R.x + MARK.x, R.z + MARK.z, 0, STAGE_Y); if (E.cap) E.cap.visible = true; B.cap.visible = false; if (E.grin) E.grin.visible = (S0.act || 1) >= 4;
      mode = 'speech';
      const start = S0.act || 1;
      if (!S0.opened) {
        shot([0, 4.8, 11.5], [0, 2.6, -8], 0.01);
        await wait(0.8);
        await curtain(true, 2.6);
        light('all');
        await wait(1.0);
        // Aurora, on time this time
        const A = P('aurora'); face(A, -2, 6);
        shot([-1.4, 2.8, -2.6], [-5.3, 2.5, -6.2], 0.9);
        await wait(0.6);
        await FIN.say(A.api, X().LINES['aurora.hush']);
        light(null); face(A, 0, -9.6);
        // Félix plays the first notes; he steps into the light
        const fx = P('felix'); if (fx) fx.hop = 0.25;
        shot([1.4, 2.4, -3.2], [MARK.x, 2.3, MARK.z], 0.9);
        await wait(1.2); if (fx) fx.hop = 0;
        await FIN.say(E.api, X().LINES['elio.open']);
        S0.opened = true; G.save();
      } else await curtain(true, 0);
      const SP = X().SPEECH;
      const from = start >= 4 ? SP.findIndex(it => it.laugh) : SP.findIndex(it => it.act === ['past', 'now', 'future'][start - 1]);
      for (let i = Math.max(0, from); i < SP.length; i++) await step(SP[i]);
      S0.speech = true; S0.letter = FIN.avg(Object.values(S0.bridges)); G.save();
      try { if (typeof QUESTS !== 'undefined' && QUESTS.tick) QUESTS.tick(); } catch (e) { /* */ }
      try { TIME.refresh(); } catch (e) { /* */ }
    } catch (e) { console.error('[finale] speech', e); }
    finally { lock(false); }
    if (FIN.st().speech) await aftermath();
  }

  // ------------------------------------------------------------ afterwards: the valley's bells (E skips the montage), the curtain call,
  // four short scenes, the times parting, the credits, and Alba
  let skipK = null;
  const skipping = () => !!(skipK && skipK.on);
  function skipOn(on) {
    if (on && !skipK) { skipK = { on: false, f: e => { if (['KeyE', 'Enter', 'Space', 'Escape'].includes(e.code) && !STORY.line && !document.querySelector('#card:not(.hidden)')) { skipK.on = true; } } }; addEventListener('keydown', skipK.f, true); }
    if (!on && skipK) { removeEventListener('keydown', skipK.f, true); skipK = null; }
  }
  async function valley() {
    shot([0, 3.5, -3.6], [0, 4.1, -12.5], 0.9);
    B.tearsOpen = 1;
    skipOn(true);
    try {
      for (const r of (typeof CH4 !== 'undefined' ? CH4.ORDER : ['alba'])) {
        if (skipping()) break;
        await flat(r, 'tri', 0.35, 1);
        FIN.think(r === 'alba' ? 'Alba: long ago, today, tomorrow.' : `${(CH4.NAMES[r] || r).replace(/^the /, 'The ')}: long ago, today, tomorrow.`, 2.2);
        snd('bell'); await flat(r, 'tri', 1.0, 0);
        await wait(0.7);
      }
    } finally { skipOn(false); }
    snd('bigbell');
    await flat('alba', 'tri', 0.6, 0);
    B.tearsOpen = 0;
  }
  async function curtainCall() {
    const S0 = FIN.st(), letter = S0.letter || FIN.avg(Object.values(S0.bridges || {}));
    light('all'); clapSfx(120, 5);
    shot([0, 5.2, 12.2], [0, 2.2, -6], 0.8);
    for (const Pp of Object.values(B.people)) if (Pp.w) { stand(Pp, true); Pp.hop = 0.4; }
    for (let i = 0; i < 12; i++) { const w = ['past', 'now', 'future'][i % 3]; floatText(i % 3 ? '¡!' : '♪', R.x + B.BLOCKS[w][i % 4], Y0 + 2.4, R.z + B.ROWS[i % 2], { gold: w === 'past' }); await wait(0.15); }
    const E = P('elio'); E.hop = 0.5; G.sim.mimo.happy = 4;
    const gr = Object.entries(S0.bridges || {}).map(([k, v]) => `<span class="g">${esc(v)}</span>`).join(' ');
    await UI.card(`<div class="tag">Curtain call</div><div class="big">${esc(letter)}</div><div class="sub" style="font-size:16px;margin:4px 0">${esc(X().BOW[letter] || X().BOW.A)}</div>`
      + `<div class="sub" style="opacity:.8">Your eight whispers: ${gr}</div><div class="sub">E</div>`, { kind: 'fin-card' });
    for (const Pp of Object.values(B.people)) if (Pp.w) { Pp.hop = 0; stand(Pp, false); }
    E.hop = 0;
  }
  // he comes down off the stage, to the front row
  async function comeDown() { const E = P('elio'); await walk(E, -0.4, FRONT - 0.3, 0.9, STAGE_Y); await walk(E, -0.4, -4.75, 0.6, Y0 + 0.02); }
  const floorY = Pp => (Pp.o && Pp.o.seat ? Y0 + 0.36 * Pp.h : Y0);
  async function dadScene() {
    const E = P('elio'), d = X().DAD.on ? P('dad') : P('dadThen'); if (!d) return;
    shot([1.6, 2.6, -6.2], [-1.0, 1.2, -4.2], 0.9);
    await walk(d, -1.2, -4.0, 1.0, floorY(d)); face(d, E.api.x - R.x, E.api.z - R.z); face(E, d.api.x - R.x, d.api.z - R.z);
    await FIN.say(d.api, X().DAD.lines['dad.heard']);
    await FIN.say(E.api, X().DAD.lines['elio.dad']);
    await walk(E, -0.8, -4.35, 0.4, Y0 + 0.02);
    G.w3d.fx.sparkle((E.api.x + d.api.x) / 2, Y0 + 1.6, (E.api.z + d.api.z) / 2, 16, ['#ff9aa6', '#ffd98a']); snd('learned');
    const d0 = P('dadThen'); if (d0 && d0 !== d) { d0.hop = 0.4; G.w3d.fx.sparkle(d0.api.x, d0.api.y + 1.3, d0.api.z, 8, ['#ffd98a']); }
    await wait(1.4); if (d0) d0.hop = 0;
  }
  async function rosaScene() {
    const E = P('elio'), r = P('rosa'); if (!r) return;
    const T = typeof TIME !== 'undefined' ? TIME.state('alba', 'past') : {}, yours = T && T.letterText;
    await walk(r, 0.4, -3.9, 1.0, floorY(r)); face(r, E.api.x - R.x, E.api.z - R.z); face(E, r.api.x - R.x, r.api.z - R.z);
    shot([2.2, 2.6, -6.3], [0.0, 1.2, -4.2], 0.8);
    await FIN.say(r.api, X().LINES['rosa.letter']);
    snd('page');
    await FIN.demo(E.api, X().LINES['elio.letter']);
    if (yours) { const L2 = X().LINES['elio.letter2'], T2 = {}; for (const [k, v] of Object.entries(L2)) T2[k] = String(v).replace('{you}', yours); await FIN.say(E.api, T2); }
    await FIN.say(E.api, X().LINES['elio.rosa']);
    const ro = P('rosita'); if (ro) { shot([-6.4, 2.0, -5.6], [-7.0, 1.2, -3.6], 0.7); ro.hop = 0.4; ro.glowK = 1; await wait(1.6); ro.hop = 0; }
  }
  async function ramiroScene() {
    const E = P('elio'), rm = P('ramiro'); if (!rm) return;
    await walk(rm, 1.4, -4.1, 1.1, floorY(rm)); face(rm, E.api.x - R.x, E.api.z - R.z); face(E, rm.api.x - R.x, rm.api.z - R.z);
    shot([3.2, 2.0, -3.0], [0.6, 1.2, -4.4], 0.8);
    await FIN.say(rm.api, X().LINES['ramiro.sorry']);
    const note = typeof TIME !== 'undefined' && TIME.flag('past', 'mhNote');
    await FIN.say(E.api, X().LINES[note ? 'elio.note' : 'elio.nonote']);
    // and a frog hops in between them, as it did on Lantern Night: this time they both laugh
    const fr = B.frog; fr.visible = true; const x0 = R.x + 3.4, z0 = R.z - 4.8, x1 = (E.api.x + rm.api.x) / 2, z1 = (E.api.z + rm.api.z) / 2 + 0.2;
    shot([3.2, 1.6, -3.0], [x1 - R.x, 0.35, z1 - R.z], 0.6);
    await tween(1.4, k => { fr.position.set(lerp(x0, x1, k), Y0 + Math.abs(Math.sin(k * Math.PI * 4)) * 0.35, lerp(z0, z1, k)); fr.rotation.y = Math.atan2(x1 - x0, z1 - z0); });
    snd('chirp'); floatText({ es: '¡croac!', pt: 'croac!', de: 'quak!', zh: '[呱|guā] ！', ja: 'ケロ ！' }[lang()] || 'ribbit!', fr.position.x, Y0 + 0.6, fr.position.z, { small: true });
    await wait(0.6);
    laughSfx(2, 1.05); E.hop = 0.5; rm.hop = 0.5;
    floatOver(E, (X().SLIP[lang()] || X().SLIP.es).laughs[1], { gold: true }); floatOver(rm, (X().SLIP[lang()] || X().SLIP.es).laughs[0], {});
    await wait(1.5); E.hop = 0; rm.hop = 0;
    await tween(0.9, k => { fr.position.set(lerp(x1, x1 + 3, k), Y0 + Math.abs(Math.sin(k * Math.PI * 3)) * 0.3, lerp(z1, z1 + 2, k)); });
    fr.visible = false;
  }
  async function noaScene() {
    const N = P('noa'), Y = G.sim.you;
    await walk(N, BOX.x - 1.2, BOX.z - 0.2, 1.4, STAGE_Y); face(N, BOX.x, BOX.z);
    shot([BOX.x + 1.8, 2.6, BOX.z - 1.6], [BOX.x - 0.6, 2.0, BOX.z], 0.8);
    await FIN.say(N.api, X().LINES['noa.you1']);
    await FIN.say(N.api, X().LINES['noa.you2']);
    await FIN.you('And I kept all of yours.');
    const M = G.sim.mimo; G.sim.mimoGo({ x: N.api.x + 0.5, z: N.api.z + 0.3 }, { x: N.api.x, z: N.api.z }); M.happy = 4; snd('chirp');
    await wait(1.0); G.w3d.fx.sparkle(N.api.x, STAGE_Y + 1.0, N.api.z, 14, ['#ff9aa6', '#ffd98a', '#8fe8b8']); snd('learned');
    await wait(0.8);
  }
  // the times part: long ago and tomorrow wave goodbye and fade; today stays
  async function parting() {
    shot([0, 5.2, 12.2], [0, 2.2, -5], 0.9);
    const A = P('aurora'), ro = P('rosita'), sa = P('sami');
    if (A) { face(A, 0, 6); A.hop = 0.3; await FIN.say(A.api, X().LINES['aurora.bye']); A.hop = 0; }
    if (ro) { ro.hop = 0.4; await FIN.say(ro.api, X().LINES['rosita.bye']); ro.hop = 0; }
    if (sa) { sa.hop = 0.4; await FIN.say(sa.api, X().LINES['sami.bye']); sa.hop = 0; }
    const M = mats(); M.past.transparent = M.future.transparent = true; M.past.needsUpdate = M.future.needsUpdate = true;
    // (their ink outlines go first: a shared opaque material, they'd stay as dark shapes)
    for (const w of ['past', 'future']) (B.blocks[w].meshes || []).forEach((m, i) => { if (i > 0) m.visible = false; });
    for (const Pp of Object.values(B.people)) if (Pp.w === 'past' || Pp.w === 'future') { Pp.fadeOut = true; Pp.body.children.forEach(m => { if (m.isMesh && m.material && m.material.side === THREE.BackSide) m.visible = false; }); }
    snd('swoosh');
    await tween(2.4, k => { M.past.opacity = M.future.opacity = 1 - k; B.haze.past.material.opacity = B.haze.future.material.opacity = 0.2 * (1 - k); B.tears.forEach((t, i) => { if (i !== 1) t.material.uniforms.uK.value = 0.9 * (1 - k); }); });
    for (const w of ['past', 'future']) { (B.blocks[w].meshes || []).forEach(m => { m.visible = false; }); if (B.motes[w]) B.motes[w].pts.visible = false; }
    for (const Pp of Object.values(B.people)) if (Pp.fadeOut) Pp.g.visible = false;
    await wait(0.8);
  }
  async function aftermath() {
    const S0 = FIN.st();
    lock(true); mode = 'bells';
    try {
      if (!S0.after) {
        await valley();
        await curtainCall();
        await comeDown();
        await dadScene();
        await rosaScene();
        await ramiroScene();
        await noaScene();
        await parting();
        S0.after = true; G.save();
      }
      if (typeof FINCRED !== 'undefined' && FINCRED && FINCRED.roll) await FINCRED.roll();
      S0.credits = true; G.save();
      await leave({ quiet: false });
      // (the parted times come back for the next time anyone's in here)
      for (const w of ['past', 'future']) { (B.blocks[w].meshes || []).forEach(m => { m.visible = true; }); if (B.motes[w]) B.motes[w].pts.visible = true; }
      for (const Pp of Object.values(B.people)) { Pp.g.visible = true; Pp.fadeOut = false; Pp.body.children.forEach(m => { m.visible = m === Pp.grin ? m.visible : true; }); }
      { const M = mats(); for (const w of ['past', 'future']) { M[w].transparent = false; M[w].opacity = 1; M[w].needsUpdate = true; } }
      B.tears.forEach(t => { t.material.uniforms.uK.value = 0.9; });
      FIN.think('Alba, the next morning. The valley is yours.', 6);
    } catch (e) { console.error('[finale] aftermath', e); }
    finally { lock(false); mode = null; }
  }

  // ------------------------------------------------------------ every frame while you're in here (main.js: the room's update)
  function update(dt, t) {
    if (!inside || !B) return;
    if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    G.fx.birds = 0;
    const K = B.curtainK;
    B.curtains.forEach(m => { const s = m.userData.s; m.position.x = R.x + s * lerp(4.1, 7.75, K); m.scale.x = lerp(1, 0.14, K); });
    const open = B.tearsOpen || 0;
    B.tears.forEach((tr, i) => { tr.material.uniforms.uT.value = t + i * 1.7; const s = damp(tr.scale.x, 0.62 * (1 + 0.4 * open), 2, dt); tr.scale.setScalar(s); });
    B.tearGlow.material.opacity = 0.32 + 0.08 * Math.sin(t * 1.7) + 0.35 * open;
    const M = mats();
    for (const w of ['past', 'now', 'future']) {
      const want = lit === 'all' || lit === w ? 1 : lit ? 0.52 : 0.66;
      litK[w] = damp(litK[w], want, 2.5, dt); M[w].color.setScalar(litK[w]);
      const gone = M[w].transparent && M[w].opacity < 0.99, h = B.haze[w], sh = B.haze[w + 'Shaft'], k2 = Math.max(0, litK[w] - 0.5) * 2;
      if (h && !gone) h.material.opacity = (w === 'now' ? 0.03 : 0.08) + 0.16 * k2;
      if (sh) { sh.visible = !gone; sh.material.opacity = 0.03 + 0.09 * k2; }
      const bn = B.banners && B.banners[w]; if (bn) bn.g.visible = !gone;
    }
    if (B.banners && Object.values(B.banners).some(b => b.key !== lang())) paintBanners();
    for (const Mt of Object.values(B.motes)) {
      if (!Mt.pts.visible) continue;
      Mt.seeds.forEach((s, i) => { s.y = (s.y + s.v * dt) % 5; Mt.pos[i * 3] = R.x + s.x + Math.sin(t * 0.5 + i) * 0.2; Mt.pos[i * 3 + 1] = Y0 + 0.6 + s.y; Mt.pos[i * 3 + 2] = R.z + s.z; });
      Mt.pts.geometry.attributes.position.needsUpdate = true;
    }
    B.foot.forEach((s, i) => { s.material.opacity = (0.36 + 0.06 * Math.sin(t * 3.1 + i)) * (0.4 + 0.6 * K); });
    const spotWant = (K > 0.5 ? 0.13 : 0) * (B.spotDim === undefined ? 1 : B.spotDim);
    B.spot.material.opacity = damp(B.spot.material.opacity, spotWant, 3, dt);
    for (const Pp of Object.values(B.people)) {
      if (!Pp.g.visible) continue;
      const a = Pp.api, hop = Pp.hop ? Math.abs(Math.sin(t * 6 + Pp.ph)) * 0.2 * Pp.hop : 0, talk = a.talking ? Math.abs(Math.sin(t * 12 + Pp.ph)) * 0.05 : 0;
      Pp.upK = damp(Pp.upK || 0, Pp.up ? 1 : 0, 6, dt);
      Pp.body.position.y = hop + talk + Pp.upK * 0.26;
      Pp.body.rotation.z = Math.sin(t * 1.2 + Pp.ph) * 0.03;
      if (Pp.bow !== undefined) Pp.body.rotation.x = damp(Pp.body.rotation.x, Pp.bow ? 0.32 : 0, 4, dt);
      if (Pp.glowK) {
        if (!Pp.lamp) { Pp.lamp = FIN.glow('#ffd98a', 1.2, 0); Pp.lamp.position.set(0.33, 0.5, 0.25); Pp.g.add(Pp.lamp); }
        Pp.glowK = Math.max(0, Pp.glowK - dt * 0.3); Pp.lamp.material.opacity = Pp.glowK * (0.7 + 0.2 * Math.sin(t * 5));
      }
    }
  }
  // what you can press E on in here
  function interactables() {
    if (!inside || !B) return [];
    const S0 = FIN.st(), out = [], E = P('elio');
    if (!S0.wings && E) out.push({ x: E.api.x, z: E.api.z, y: STAGE_Y, r: 2.4, label: 'Talk', run: wings });
    if (S0.wings && !S0.speech) out.push({ x: R.x + BOX.x, z: R.z + BOX.z, y: STAGE_Y, r: 1.5, label: 'Into the prompter’s box', run: speech });
    if (!S0.speech) out.push({ x: R.x - 8.1, z: R.z - 6.3, y: STAGE_Y, r: 1.1, label: 'Go out', run: () => leave() });
    return out;
  }
  function target() {
    const S0 = FIN.st(), E = P('elio');
    if (!S0.wings && E) return { x: E.api.x, z: E.api.z, hint: '{mimo} looks at Elio, in the wings.' };
    if (!S0.speech) return { x: R.x + BOX.x, z: R.z + BOX.z, hint: '{mimo} points at the prompter’s shell, at the front of the stage.' };
    return null;
  }
  // the music in here (FIN.song asks): the wings', the speech's (it follows the act), the silence after the slip, the bells'
  const has = n => typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(n);
  function song() {
    if (!inside) return null;
    const m = mode === 'speech' ? 'fin_speech' : mode === 'silence' ? 'fin_silence' : mode === 'bells' ? 'fin_bells' : 'fin_clock';
    return has(m) ? m : null;
  }
  const areaAt = () => (inside ? { id: 'fin-stage', name: 'The old theater · all three times', color: '#c9443a' } : null);
  function init(game) { G = game; }

  const api = { init, enter, leave, wings, speech, aftermath, update, interactables, target, song, areaAt, R, OUTSIDE, Y0,
    act: () => lit, get mode() { return mode; },
    _: { build, get B() { return B; }, flat, flatTex, paintPlace, light, curtain, step, beat, laugh, thanks, valley, curtainCall, dadScene, rosaScene, ramiroScene, noaScene, parting, putYou, P, floatText, laughSfx, clapSfx,
      get wantPick() { return wantPick; }, skip() { if (skipK) skipK.on = true; }, MARK, BOX, WINGS } };
  Object.defineProperty(api, 'inside', { get: () => inside, configurable: true });
  return api;
})();
