'use strict';
// The final battle, part 1 (FB1; DESIGN.md 21.11): the top of the Old Tower. The Hush wears Elio like a coat, «el Silencio»: huge
// (and bigger each phase), with its goons, four stacked bars of fog, its own arena (stage.js _.arenaBuilders.fb_top: the Clock Room at
// night, Noa pounding the great clock's glass). A plug-in boss on battle/flow.js (BATTLE._.plugins.fb_vessel); its words in fb_text.js
// (FBTXT); its songs in fb_music.js ('boss_fb_top', then 'boss_fb_fury'). After the user's first listen ("much stronger than me… but
// we persevere"):
//   A hopeless opening   for your first three turns every hit barely scratches (it doesn't even flinch), and its blows hit hard.
//                        Then the turning point: Noa cracks the clock's glass («¡No te calles! ¡HABLA!»), a seam of light opens in
//                        its fog, Elio whispers, Bruno bursts up the stair: the hits get through, and team orders are on.
//   Phase 1 «Hoy»        three hushed hoods shield it (fb_hood: a red, a blue, a yellow, one of them big, their leader 👑: when it
//                        falls, the rest run). Say which one: «la roja», «la grande»
//   Phase 2 «Ayer»       its walls blow out into a storm; the clock runs backward (sepia, the Past's rules): the concert's laughing
//                        masks (a slip makes them laugh: hits at half; a «y» chain next turn breaks the laugh: ×1.5)
//   Phase 3 «Mañana»     the tower top crumbles; the clock runs forward (silver, the Future's rules): paper echoes of three of
//                        Chapter 4's tomorrow bosses (registered only while this fight runs): plans, glimpses, predictions, traps
//   Phase 4 «La furia»   the floor falls away: you fight on floating gears round the cracked clock; the hand jumps each turn and
//                        your command goes in the time it shows; its blows come in threes
//   Its blows            a taunt (in the language) and a slow wind-up, then one, two or three blows in a row, each dodged out loud;
//                        a white impact frame, hitstop, a shake. Two actions a turn from phase 3
//   «¡VOZ!»              a meter that fills as you take hits, dodge perfectly, land S and A sentences, and every time you're knocked
//                        down (+50%). Full: your next command is «¡VOZ!» (a «y» chain: ×3; one move: ×2)
//   The vines            at the fury's end it roars «¡BASTA!», fog vines wrap Bruno, Mimo and you, the command box gags (anything
//                        typed comes out «…»), Mimo's voice sinks, Elio whispers «…no te calles…», and the gray swallows the screen
// Hits land on the Hush's fog only (Elio's figure inside never flashes); his faint voice breaks through (warm bubbles). Knock-downs: no
// game over; the phase starts again with full hearts and a louder voice, gentler after two (+2 hearts).
// State: G.state.fb = { stage: 'top' | 'realm' | 'done', phase 1–4, turned, voice, downs: { 1: n… } } (fb_realm.js keeps the rest).
//   FBBOSS.top() (the opening, then the fights until you're absorbed; false if you ran) · FBBOSS.st() · FBBOSS.init(game)
//   Tests: FBBOSS._.t.fight(phase) · _.t.fastGag
const FBBOSS = (() => {
  const BT = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = BT && BT._;
  const X = () => FBTXT;
  let GAME = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const lang = () => (GAME && GAME.state && GAME.state.lang) || (typeof LEX !== 'undefined' && LEX.lang) || 'es';
  const isC = l => (l || lang()) === 'zh' || (l || lang()) === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const mimoName = () => (GAME && GAME.state && GAME.state.mimoName) || 'Mimo';
  const fillM = (t, l = lang()) => String(t || '').replace(/\{mimo\}/g, isC(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName());
  const plainT = (s, l = lang()) => (isC(l) && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: l }) : String(s || ''));
  const pick = (T, l = lang()) => (T ? T[l] || T.es || T.en || '' : '');
  const line = (key, tab = 'FIGHT', l = lang()) => { const T = X()[tab][key] || {}; return [fillM(pick(T, l), l), fillM(T.en || '', 'en')]; };
  const nameOf = (k, l = lang()) => pick(X().NAMES[k], l);
  const TAU2 = Math.PI * 2;

  // ------------------------------------------------------------ the save's part
  function st() {
    const s = GAME && GAME.state; if (!s) return { downs: {} };
    if (!s.fb) s.fb = { stage: 'top', phase: 1, downs: {} };
    if (!s.fb.downs) s.fb.downs = {};
    return s.fb;
  }
  const save = () => { try { if (GAME && GAME.save) GAME.save(); } catch (e) { /* */ } };

  // ------------------------------------------------------------ the look: bubbles for the Hush's doubled voice and Elio's faint one,
  // the phases' tints, the hour card, the voice meter, the impact frame, the gag, the gray that swallows the screen
  function css() {
    if (document.getElementById('fb-css')) return;
    const s = document.createElement('style'); s.id = 'fb-css';
    s.textContent = `#battle-ui .bt-bubble.hush { background: #3a3550; color: #e9e4ff; border-color: #15121f; box-shadow: 0 0 0 4px #8d84b8, 0 6px 0 rgba(20,16,30,.35); letter-spacing: .02em; }
#battle-ui .bt-bubble.hush.shout { background: #2c2840; color: #f3efff; }
#battle-ui .bt-bubble.hush::after { background: #3a3550; border-color: #15121f; }
#battle-ui .bt-bubble.elio { background: #fff3dc; color: #a2562c; font-style: italic; font-weight: 700; font-size: 16px; padding: 3px 10px; border-width: 2px; border-color: #d99a5b; opacity: .92; }
#battle-ui .bt-bubble.elio::after { border-color: #d99a5b; }
#battle-ui .bt-bubble.noa { background: #e6f7f3; color: #1f6f63; }
#battle-ui .bt-bubble.voz { background: #ffd34d; color: #2b2235; font-size: 34px; border-width: 5px; }
.fb-stack { display: inline-flex; gap: 3px; margin-left: 6px; vertical-align: middle; }
.fb-stack i { display: inline-block; width: 12px; height: 12px; border: 2px solid #2b2235; border-radius: 3px; background: #4a4560; }
.fb-stack i.on { background: #b9aee6; } .fb-stack i.cur { background: #f1ecff; box-shadow: 0 0 6px #fff; }
#fb-hour { position: fixed; left: 50%; top: 16%; transform: translate(-50%, -50%) scale(.6); z-index: 47; pointer-events: none; opacity: 0; font: italic 900 clamp(44px, 8vw, 96px) Georgia, "Yu Mincho", "Microsoft YaHei", serif; color: #fff3d0; -webkit-text-stroke: 3px #2b2235; text-shadow: 0 6px 0 rgba(0,0,0,.35); transition: opacity .25s, transform .35s cubic-bezier(.2,1.6,.4,1); }
#fb-hour.on { opacity: 1; transform: translate(-50%, -50%) scale(1); }
#fb-hour small { display: block; text-align: center; font: 700 16px "Segoe UI", sans-serif; -webkit-text-stroke: 0; color: #f4ecdc; text-shadow: 0 2px 0 #000; }
#fb-voice { position: fixed; left: 18px; bottom: 142px; z-index: 46; pointer-events: none; display: flex; align-items: center; gap: 8px; font: 900 15px "Segoe UI", sans-serif; color: #fff3d0; text-shadow: 0 2px 0 #000; }
#fb-voice .bar { width: min(260px, 40vw); height: 14px; border: 3px solid #2b2235; border-radius: 9px; background: #3a3550; overflow: hidden; box-shadow: 0 3px 0 rgba(0,0,0,.3); }
#fb-voice .bar i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #ffb347, #ffd34d, #fff3a0); transition: width .5s; }
#fb-voice.full .bar { box-shadow: 0 0 14px #ffd34d, 0 3px 0 rgba(0,0,0,.3); animation: fbPulse .6s ease-in-out infinite alternate; }
#fb-voice.full .lbl { color: #ffd34d; }
@keyframes fbPulse { to { transform: scale(1.06); } }
#fb-flash { position: fixed; inset: 0; z-index: 48; pointer-events: none; background: #fff; opacity: 0; }
#fb-tint { position: fixed; inset: 0; z-index: 39; pointer-events: none; opacity: 0; transition: opacity .8s; }
#fb-gray { position: fixed; inset: 0; z-index: 61; pointer-events: none; opacity: 0; background: radial-gradient(circle at 50% 45%, rgba(120,116,138,.65) 0%, rgba(60,56,74,.96) 55%, #262333 100%); }
#fb-gray .swirl { position: absolute; left: 50%; top: 50%; width: 220vmax; height: 220vmax; margin: -110vmax 0 0 -110vmax; border-radius: 50%; opacity: .55;
  background: repeating-conic-gradient(from 0deg, rgba(200,196,220,.18) 0deg 12deg, rgba(40,36,54,.0) 12deg 30deg); animation: fbSpin 7s linear infinite; }
@keyframes fbSpin { to { transform: rotate(360deg); } }
#fb-gag { position: fixed; left: 50%; bottom: 8vh; transform: translateX(-50%); z-index: 60; width: min(640px, 86vw); padding: 12px 16px; border-radius: 16px; background: #fffaf0; border: 3px solid #2b2235;
  box-shadow: 0 6px 0 rgba(43,34,53,.25); display: flex; align-items: center; gap: 10px; transition: width 1.2s, padding 1.2s, opacity .6s, filter 1s; font: 800 20px "Segoe UI", sans-serif; color: #2b2235; overflow: visible; }
#fb-gag .lbl { flex: none; color: #6b6275; font-size: 14px; }
#fb-gag input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font: 800 22px "Segoe UI", sans-serif; color: #2b2235; caret-color: #2b2235; }
#fb-gag svg { position: absolute; inset: -6px; width: calc(100% + 12px); height: calc(100% + 12px); pointer-events: none; }
#fb-gag svg path { fill: none; stroke: #6e6788; stroke-width: 7; stroke-linecap: round; stroke-dasharray: 900; stroke-dashoffset: 900; transition: stroke-dashoffset 2.4s ease-in; }
#fb-gag svg path.on { stroke-dashoffset: 0; }
#fb-gag.small { width: 58px; padding: 12px 10px; }
#fb-gag.gray { filter: grayscale(1) brightness(.85); }
#fb-gag .cap { position: absolute; left: 0; right: 0; top: -34px; text-align: center; color: #f4ecdc; font: italic 700 16px "Segoe UI", sans-serif; text-shadow: 0 2px 0 #000; }`;
    document.head.appendChild(s);
  }
  const TINTS = { today: '', yesterday: 'sepia(0.5) saturate(1.12) contrast(1.04)', tomorrow: 'saturate(0.62) hue-rotate(-12deg) brightness(1.06) contrast(1.06)', fury: 'saturate(1.25) contrast(1.14) hue-rotate(-6deg)', gray: 'grayscale(0.85) brightness(0.8)' };
  // (a battle keeps the canvas's own filter off: index.html's «body.in-battle #gl { filter: none !important }». So the tint is a layer
  // between the canvas and the battle's UI that filters what's behind it)
  let tintNow = '';
  function tint(k) {
    css(); tintNow = TINTS[k] || '';
    let el = document.getElementById('fb-tint'); if (!el) { el = document.createElement('div'); el.id = 'fb-tint'; document.body.appendChild(el); }
    el.style.backdropFilter = tintNow || 'none'; el.style.webkitBackdropFilter = tintNow || 'none';
    el.style.opacity = tintNow ? '1' : '0';
  }
  function untint() { tintNow = ''; const el = document.getElementById('fb-tint'); if (el) el.remove(); }
  function hourCard(text, sub) {
    css();
    let el = document.getElementById('fb-hour'); if (!el) { el = document.createElement('div'); el.id = 'fb-hour'; document.body.appendChild(el); }
    el.innerHTML = `${isC() && typeof CJK !== 'undefined' ? CJK.html(text, { lang: lang() }) : esc(text)}${sub ? `<small>${esc(sub)}</small>` : ''}`;
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 1900);
  }
  function grayOn(ms = 1200) {
    css();
    let el = document.getElementById('fb-gray');
    if (!el) { el = document.createElement('div'); el.id = 'fb-gray'; el.innerHTML = '<div class="swirl"></div>'; document.body.appendChild(el); }
    el.style.transition = `opacity ${ms}ms ease-in`; void el.offsetWidth; el.style.opacity = '1';
    return new Promise(r => setTimeout(r, ms));
  }
  function grayOff(ms = 1400) { const el = document.getElementById('fb-gray'); if (!el) return Promise.resolve(); el.style.transition = `opacity ${ms}ms ease-out`; el.style.opacity = '0'; return new Promise(r => setTimeout(() => { el.remove(); r(); }, ms)); }
  // a white impact frame
  function flash(k = 0.7) {
    css(); let el = document.getElementById('fb-flash'); if (!el) { el = document.createElement('div'); el.id = 'fb-flash'; document.body.appendChild(el); }
    el.style.transition = 'none'; el.style.opacity = String(k); clearTimeout(el._t); el._t = setTimeout(() => { el.style.transition = 'opacity .18s'; el.style.opacity = '0'; }, 70);
  }
  // the voice meter («¡VOZ!»): over the fight, while it runs
  function voiceUI() {
    css();
    let el = document.getElementById('fb-voice');
    if (!FX) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'fb-voice'; el.innerHTML = `<span class="lbl"></span><div class="bar"><i></i></div>`; document.body.appendChild(el); }
    el.querySelector('.lbl').textContent = plainT(line('v.shout')[0]).replace(/[¡!！]/g, '');
    el.querySelector('i').style.width = Math.round(100 * FX.voice) + '%';
    const p = document.querySelector('#battle-ui .bt-prompt'), r = p && !p.hidden ? p.getBoundingClientRect() : null;     // (just over the command box)
    if (r && r.height > 0) el.style.bottom = Math.round(innerHeight - r.top + 8) + 'px';
    el.classList.toggle('full', !!FX.voiceReady);
  }

  // ------------------------------------------------------------ the models
  const tmat = (c, o = {}) => new THREE.MeshToonMaterial(Object.assign({ color: new THREE.Color(c), gradientMap: TK.grad }, o));
  const lathe = (pts, n = 24, a0, al) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n, a0, al);
  const glow = (color, s, o = 0.5, add = true) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending })); sp.scale.setScalar(s); return sp; };
  const anchorsOf = (body, list) => { const a = {}; for (const [n, p] of list) { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); a[n] = o; } return a; };
  const noFlash = obj => obj.traverse(o => { if (o.isMesh || o.isSprite) o.userData.noFlash = true; });
  let FOGTEX = null;
  const fogTex = () => FOGTEX || (FOGTEX = TK.canvasTex(64, 64, c => { const g = c.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(196,190,214,0.9)'); g.addColorStop(1, 'rgba(196,190,214,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }));
  function vineMesh(pts, r, col, thorns = 6) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => V(...p))), g = new THREE.Group();
    g.add(TK.part(new THREE.TubeGeometry(curve, 28, r, 6, false), null, null, null, { mat: tmat(col), ink: 0.012 }));
    for (let i = 1; i <= thorns; i++) {
      const u = i / (thorns + 1), p = curve.getPointAt(u), tg = curve.getTangentAt(u), side = V(-tg.z, 0.3, tg.x).normalize().multiplyScalar(i % 2 ? 1 : -1);
      const th = TK.part(new THREE.ConeGeometry(r * 0.8, r * 3.2, 5), null, [p.x + side.x * r, p.y + side.y * r, p.z + side.z * r], null, { mat: tmat('#5e5878'), ink: 0.006 });
      th.quaternion.setFromUnitVectors(V(0, 1, 0), side); g.add(th);
    }
    return g;
  }
  // the vessel: Elio's hooded figure (OLDBOSS.figure), floating, head bowed, inside a great mantle of fog (a hood with cold eyes, two fog
  // hands, vines from the floor, fog drifting round; the seam of light that opens at the turning point). The mantle is the Hush; he
  // never flashes. Built at its own size; the battle makes it a giant (spec.giant) and it grows with each phase.
  function vesselModel() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    let E = null;
    try { E = OLDBOSS.figure(); E.root.scale.setScalar(1.08); E.root.position.set(0, 0.5, 0.35); body.add(E.root); Object.assign(E.S, { open: 0, eyes: 0.15, raise: 0, reach: 0, float: 0, look: 0 }); noFlash(E.root); } catch (e) { E = null; }
    const mantle = new THREE.Group(); body.add(mantle);
    const mm = tmat('#8a84a2', { transparent: true, opacity: 0.94, side: THREE.DoubleSide });
    const prof = [[0.35, 0], [1.55, 0.02], [1.78, 0.45], [1.7, 1.3], [1.48, 2.3], [1.2, 3.05], [0.88, 3.6], [0.5, 4.0], [0.16, 4.22], [0, 4.26]];
    const cg = lathe(prof, 34, 0.95, TAU2 - 1.9), cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i), k = 1 + Math.sin(Math.atan2(x, z) * 6 + y * 1.3) * 0.06 * (1 - y / 4.3); cp.setX(i, x * k); cp.setZ(i, z * k); }
    cg.computeVertexNormals();
    mantle.add(TK.part(cg, null, null, null, { mat: mm, ink: 0.02 }));
    const hollow = new THREE.Mesh(TK.G.sphere, new THREE.MeshBasicMaterial({ color: '#0c0912' })); hollow.scale.set(0.62, 0.5, 0.22); hollow.position.set(0, 3.55, 0.78); mantle.add(hollow);
    const eyes = [-1, 1].map(s => { const e = new THREE.Group(); e.position.set(s * 0.24, 3.62, 0.98); mantle.add(e); const m = new THREE.Mesh(TK.G.sphere, new THREE.MeshBasicMaterial({ color: '#e8f0ff' })); m.scale.set(0.07, 0.1, 0.03); e.add(m); const gl = glow('#9fc4ff', 0.55, 0.7); gl.position.z = 0.02; e.add(gl); e.userData.gl = gl; return e; });
    // the seam of light (hidden until the turning point): a jagged glowing line down the mantle's front
    const seam = new THREE.Group(); seam.position.set(0, 2.2, 1.55); mantle.add(seam);
    const seamTex = TK.canvasTex(64, 256, (c, w, h) => { c.strokeStyle = '#fff6d8'; c.lineWidth = 9; c.lineJoin = 'round'; c.shadowColor = '#ffd98a'; c.shadowBlur = 18; c.beginPath(); c.moveTo(w / 2, 6); for (let y = 6; y < h - 6; y += 22) c.lineTo(w / 2 + ((y / 22) % 2 ? 12 : -10), y); c.lineTo(w / 2, h - 6); c.stroke(); });
    const seamM = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.4), new THREE.MeshBasicMaterial({ map: seamTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); seam.add(seamM);
    const seamG = glow('#ffd98a', 2.4, 0); seam.add(seamG);
    noFlash(seam);
    const hands = [-1, 1].map(s => {
      const h = new THREE.Group(); h.position.set(s * 2.05, 1.9, 0.7); body.add(h);
      h.add(TK.part(TK.G.sphere, null, [0, 0, 0], [0.42, 0.36, 0.3], { mat: mm, ink: 0.014 }));
      for (let j = 0; j < 4; j++) h.add(TK.part(TK.G.sphere, null, [s * -0.05 + (j - 1.5) * 0.17, -0.42, 0.12], [0.085, 0.24, 0.085], { mat: mm, ink: 0.01, rot: [0.2, 0, (j - 1.5) * 0.12] }));
      h.add(TK.part(TK.G.sphere, null, [s * -0.36, -0.08, 0.14], [0.09, 0.2, 0.09], { mat: mm, ink: 0.01, rot: [0, 0, s * 0.9] }));
      h.userData.home = h.position.clone(); h.userData.s = s; return h;
    });
    const vines = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU2 + 0.4, r0 = 2.3, r1 = 1.55; const v = vineMesh([[Math.sin(a) * r0, -0.1, Math.cos(a) * r0], [Math.sin(a + 0.5) * (r1 + 0.3), 0.7, Math.cos(a + 0.5) * (r1 + 0.3)], [Math.sin(a + 1.1) * r1, 1.6, Math.cos(a + 1.1) * r1], [Math.sin(a + 1.6) * (r1 - 0.2), 2.4, Math.cos(a + 1.6) * (r1 - 0.2)]], 0.07, i % 2 ? '#6e6788' : '#7a7494', 4); body.add(v); vines.push(v); }
    const puffs = [];
    for (let i = 0; i < 14; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex(), transparent: true, opacity: 0.5, depthWrite: false })); sp.userData.noFlash = true; sp.scale.setScalar(1.1 + (i % 4) * 0.35); root.add(sp); puffs.push({ sp, a: i / 14 * TAU2, y: 0.3 + (i % 5) * 0.8, r: 1.9 + (i % 3) * 0.35, ph: i * 0.9 }); }
    const gl = glow('#b9aee6', 6.5, 0.18); gl.position.y = 2.2; root.add(gl);
    const anchors = anchorsOf(body, [['top', [0, 2.2, 1.45]], ['mid', [0, 1.5, 1.5]], ['head', [0, 3.5, 1.0]], ['face', [0, 3.6, 1.15]], ['feet', [0, 0.05, 1.1]], ['hand', [2.05, 1.9, 0.9]]]);
    return { root, body, E, mantle, mm, hollow, eyes, seamM, seamG, hands, vines, puffs, gl, anchors, kind: 'fb_vessel', scale: 1, radius: 1.9, height: 4.4, parts: [], labelH: 4.75, hover: 0, L: {} };
  }
  function poseVessel(h, F, t, dt) {
    const fx = FX && FX.f === F ? FX : null, k = fx ? Math.max(0.15, F.hp / Math.max(1, F.maxHp)) : 1, rage = fx ? fx.rage || 0 : 0, P = F.fbPose || {};
    const sc = (0.86 + 0.14 * k) * (1 + rage * 0.18 + (P.gather || 0) * 0.08), br = 1 + Math.sin(t * 1.3) * 0.02;
    h.mantle.scale.set(sc * (F.sx || 1), sc * br * (F.sy || 1), sc * (F.sx || 1));
    h.mm.opacity = Math.min(0.96, 0.7 + 0.26 * k + rage * 0.3);
    h.mm.color.set('#8a84a2').lerp(new THREE.Color('#3a3550'), Math.min(1, rage * 0.9 + (P.gather || 0) * 0.35));
    h.body.position.y = Math.sin(t * 1.1) * 0.06; h.body.rotation.x = (F.lean || 0) * 0.3 - (P.gather || 0) * 0.08;
    h.eyes.forEach(e => { const r = 1 + rage * 1.4 + (P.gather || 0) * 0.8; e.userData.gl.scale.setScalar(0.55 * r); e.userData.gl.material.color.set(rage > 0.3 || P.gather > 0.5 ? '#c9a0ff' : '#9fc4ff'); e.scale.y = (t % 5.1) < 0.12 ? 0.2 : 1; });
    const sm = F.fbSeam || 0; h.seamM.material.opacity = sm * (0.75 + 0.25 * Math.sin(t * 5)); h.seamG.material.opacity = sm * (0.45 + 0.15 * Math.sin(t * 3)); h.seamM.scale.y = 0.2 + 0.8 * sm;
    if (h.E) { const S = h.E.S; S.eyes += ((fx && fx.voiceT > t ? 0.8 : 0.12) - S.eyes) * Math.min(1, (dt || 0.016) * 3); S.look = Math.sin(t * 0.4) * 0.12; S.lean = 0.12; h.E.pose(dt || 0.016, t); }
    h.hands.forEach((hd, i) => {
      const s = hd.userData.s, home = hd.userData.home, lift = i === 1 ? P.lift || 0 : 0, hit = i === 1 ? P.hit || 0 : 0, sweep = i === 0 ? P.sweep || 0 : 0, g = P.gather || 0;
      hd.position.set(home.x + Math.sin(t * 0.9 + i) * 0.1 - s * sweep * 1.4 + s * g * 0.4, home.y + Math.sin(t * 1.3 + i * 2) * 0.12 + lift * 1.8 - hit * 2.2 - sweep * 1.6 + g * 0.6, home.z + sweep * 1.4 + hit * 1.6 - g * 0.6);
      hd.rotation.z = s * (0.3 + Math.sin(t * 1.1 + i) * 0.08) - s * lift * 0.8; hd.rotation.x = sweep * 0.9 + hit * 0.6;
    });
    h.vines.forEach((v, i) => { v.rotation.y = Math.sin(t * 0.6 + i) * 0.05; v.scale.setScalar(1 + rage * 0.25 + Math.sin(t * 2 + i) * 0.02); });
    h.puffs.forEach(p => { const a = p.a + t * 0.25 * (p.ph % 2 ? 1 : -1); p.sp.position.set(Math.sin(a) * p.r * sc, p.y + Math.sin(t * 0.7 + p.ph) * 0.2, Math.cos(a) * p.r * sc * 0.7); p.sp.material.opacity = (0.3 + 0.2 * k) * (0.8 + 0.2 * Math.sin(t + p.ph)) + rage * 0.2; });
    h.gl.material.opacity = 0.14 + 0.06 * Math.sin(t * 1.7) + rage * 0.2 + (P.gather || 0) * 0.2;
  }
  // a hushed hood: its cloth in a faded color (red, blue, yellow: the label says which), the big one a head taller
  const HOODCOL = { red: ['#b0707a', '#7e4a54'], blue: ['#6f84b8', '#4a5a86'], yellow: ['#bba862', '#857640'], green: ['#73a273', '#4d744d'], white: ['#7a7494', '#5f5a76'] };
  function hoodModel(o = {}) {
    const root = new THREE.Group(), sizer = new THREE.Group(), body = new THREE.Group(); root.add(sizer); sizer.add(body);
    const k = o.size === 'big' ? 1.4 : 1; sizer.scale.setScalar(k);
    const [c0, c1] = HOODCOL[o.color] || HOODCOL.white, M = tmat(c0), D = tmat(c1);
    const prof = [[0.05, 0], [0.26, 0.04], [0.34, 0.3], [0.36, 0.6], [0.31, 0.86], [0.24, 1.02], [0.12, 1.12], [0, 1.15]];
    const g = lathe(prof, 22), gp = g.attributes.position;
    for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), y = gp.getY(i), z = gp.getZ(i), a = Math.atan2(x, z), k = 1 + (y < 0.3 ? Math.sin(a * 5) * 0.12 * (1 - y / 0.3) : 0); gp.setX(i, x * k); gp.setZ(i, z * k); gp.setY(i, y < 0.06 ? y - Math.abs(Math.sin(a * 5)) * 0.12 : y); }
    g.computeVertexNormals();
    body.add(TK.part(g, null, null, null, { mat: M, ink: 0.014 }));
    body.add(TK.part(new THREE.ConeGeometry(0.09, 0.26, 10), null, [0, 1.2, -0.16], null, { mat: M, ink: 0.01, rot: [-1.2, 0, 0] }));
    const hole = new THREE.Mesh(TK.G.sphere, new THREE.MeshBasicMaterial({ color: '#0c0912' })); hole.scale.set(0.2, 0.18, 0.12); hole.position.set(0, 0.9, 0.26); body.add(hole);
    const eyes = [-1, 1].map(s => { const m = new THREE.Mesh(TK.G.sphere, new THREE.MeshBasicMaterial({ color: '#e8f0ff' })); m.scale.set(0.032, 0.045, 0.02); m.position.set(s * 0.07, 0.92, 0.36); body.add(m); return m; });
    body.add(TK.part(TK.G.sphere, null, [0.26, 0.48, 0.24], [0.07, 0.07, 0.07], { mat: D, ink: 0.008 }));
    const lan = new THREE.Group(); lan.position.set(0.3, 0.3, 0.3); body.add(lan);
    lan.add(TK.part(TK.G.box, null, [0, 0, 0], [0.13, 0.17, 0.13], { mat: tmat('#9a96aa', { emissive: new THREE.Color('#2a2838') }), ink: 0.008 }));
    lan.add(TK.part(TK.G.box, null, [0, 0.11, 0], [0.16, 0.035, 0.16], { mat: D, ink: 0.006 }));
    const lg = glow('#c8c4e0', 0.6, 0.35); lan.add(lg);
    const wisps = []; for (let i = 0; i < 3; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: fogTex(), transparent: true, opacity: 0.45, depthWrite: false })); sp.scale.setScalar(0.5); root.add(sp); wisps.push(sp); }
    const anchors = anchorsOf(body, [['top', [0, 1.3, 0]], ['mid', [0, 0.62, 0.3]], ['head', [0, 0.95, 0.25]], ['face', [0, 0.92, 0.36]], ['feet', [0, 0.02, 0]]]);
    return { root, body, eyes, lan, lg, wisps, anchors, kind: 'fb_hood', scale: 1, radius: 0.42 * k, height: 1.25 * k, parts: [], labelH: 1.55 * k, hover: 0.55, L: {} };
  }
  function poseHood(h, F, t) {
    h.body.scale.set(F.sx || 1, F.sy || 1, F.sx || 1); h.body.rotation.x = F.lean || 0; h.body.rotation.z = Math.sin(t * 1.7 + (F.seed || 0)) * 0.05;
    h.lan.rotation.z = Math.sin(t * 2.3 + (F.seed || 0)) * 0.25; h.lg.material.opacity = 0.25 + 0.15 * Math.sin(t * 3 + (F.seed || 0));
    h.eyes.forEach(e => { e.scale.y = (t + (F.seed || 0)) % 4.3 < 0.12 ? 0.008 : 0.045; });
    h.wisps.forEach((w, i) => { const a = t * 1.2 + i * 2.1, u = (t * 0.6 + i * 0.33) % 1; w.position.set(Math.sin(a) * 0.25, 0.05 - u * 0.3, Math.cos(a) * 0.2); w.material.opacity = 0.35 * (1 - u); });
  }
  const MASKTEX = {};
  function maskTex(col) {
    return MASKTEX[col] || (MASKTEX[col] = TK.canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = col; c.fillRect(0, 0, w, h);
      const g = c.createRadialGradient(w * 0.42, h * 0.36, 10, w / 2, h / 2, w * 0.62); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.18)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#2b2235'; c.lineWidth = 12; c.lineCap = 'round'; c.fillStyle = '#2b2235';
      for (const s of [-1, 1]) { c.beginPath(); c.arc(w / 2 + s * 52, h * 0.42, 26, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
      c.beginPath(); c.moveTo(w * 0.24, h * 0.6); c.quadraticCurveTo(w / 2, h * 0.98, w * 0.76, h * 0.6); c.quadraticCurveTo(w / 2, h * 0.72, w * 0.24, h * 0.6); c.fill();
      for (const s of [-1, 1]) { c.fillStyle = 'rgba(255,120,140,0.45)'; c.beginPath(); c.arc(w / 2 + s * 74, h * 0.62, 18, 0, TAU2); c.fill(); }
    }));
  }
  const MCOL = { red: '#d8544a', yellow: '#e8b93a', blue: '#4f7fd0', green: '#5fae4f', white: '#e8e4dc' };
  // a theater mask from the old concert, as big as a person's torso, its face to the front (+z)
  function maskModel(o) {
    const root = new THREE.Group(), sizer = new THREE.Group(), body = new THREE.Group(); root.add(sizer); sizer.add(body);
    const K = 1.55; sizer.scale.setScalar(K);
    const col = MCOL[o && o.color] || MCOL.red;
    const face = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18, -Math.PI / 2, Math.PI, 0, Math.PI), tmat('#ffffff', { map: maskTex(col) }));
    face.scale.set(0.26, 0.6, 0.5); face.position.y = 0.75; face.rotation.y = Math.PI / 2; body.add(face);
    face.add(new THREE.Mesh(face.geometry, TK.outlineMat(0.03)));
    const ribbons = [-1, 1].map(s => { const r = TK.part(TK.G.box, null, [s * 0.46, 0.8, -0.1], [0.06, 0.42, 0.02], { mat: tmat(col), ink: 0.006, rot: [0, 0, s * 0.5] }); body.add(r); return r; });
    const anchors = anchorsOf(body, [['top', [0, 1.45, 0]], ['mid', [0, 0.75, 0.25]], ['head', [0, 0.85, 0.2]], ['face', [0, 0.8, 0.3]], ['feet', [0, 0.1, 0]]]);
    return { root, body, face, ribbons, anchors, kind: 'fb_mask', scale: 1, radius: 0.5 * K, height: 1.3 * K, parts: [], labelH: 1.65 * K, hover: 0.7, L: {} };
  }
  function poseMask(h, F, t) {
    const laugh = FX && FX.laughing ? 1 : 0, sd = F.seed || 0;
    h.body.scale.set(F.sx || 1, F.sy || 1, F.sx || 1);
    h.body.rotation.z = Math.sin(t * (laugh ? 22 : 1.3) + sd) * (laugh ? 0.14 : 0.06);
    h.body.rotation.x = (F.lean || 0) + Math.sin(t * 0.9 + sd) * 0.05;
    h.face.position.y = 0.75 + (laugh ? Math.abs(Math.sin(t * 18 + sd)) * 0.05 : 0);
    h.ribbons.forEach((r, i) => { r.rotation.z = (i ? -1 : 1) * (0.5 + Math.sin(t * 2.2 + sd + i) * 0.2); });
  }
  const ECHO = {
    fb_echo_alb: { draw(c, w, h) { c.beginPath(); c.moveTo(w * 0.5, h * 0.36); c.quadraticCurveTo(w * 0.3, h * 0.2, w * 0.02, h * 0.34); c.quadraticCurveTo(w * 0.28, h * 0.42, w * 0.38, h * 0.52); c.quadraticCurveTo(w * 0.44, h * 0.7, w * 0.5, h * 0.74); c.quadraticCurveTo(w * 0.56, h * 0.7, w * 0.62, h * 0.52); c.quadraticCurveTo(w * 0.72, h * 0.42, w * 0.98, h * 0.34); c.quadraticCurveTo(w * 0.7, h * 0.2, w * 0.5, h * 0.36); c.closePath(); }, eye: [0.5, 0.4], size: [2.6, 1.6] },
    fb_echo_mor: { draw(c, w, h) { c.beginPath(); c.moveTo(w * 0.3, h * 0.96); c.bezierCurveTo(w * 0.1, h * 0.7, w * 0.62, h * 0.62, w * 0.42, h * 0.4); c.bezierCurveTo(w * 0.3, h * 0.24, w * 0.46, h * 0.06, w * 0.66, h * 0.1); c.lineTo(w * 0.82, h * 0.2); c.lineTo(w * 0.62, h * 0.22); c.lineTo(w * 0.78, h * 0.3); c.bezierCurveTo(w * 0.62, h * 0.32, w * 0.6, h * 0.42, w * 0.62, h * 0.48); c.bezierCurveTo(w * 0.8, h * 0.7, w * 0.34, h * 0.74, w * 0.46, h * 0.96); c.closePath(); }, eye: [0.62, 0.15], size: [1.5, 2.4] },
    fb_echo_war: { draw(c, w, h) { c.beginPath(); const n = 18; for (let i = 0; i <= n; i++) { const a = i / n * TAU2, r = (i % 2 ? 0.34 : 0.44) * w; c.lineTo(w / 2 + Math.cos(a) * r, h * 0.52 + Math.sin(a) * r * 0.9); } c.closePath(); }, eye: [0.5, 0.46], size: [2.2, 2.2] },
  };
  const ECHOTEX = {};
  function echoTex(kind) {
    return ECHOTEX[kind] || (ECHOTEX[kind] = TK.canvasTex(256, 256, (c, w, h) => {
      const E = ECHO[kind]; E.draw(c, w, h);
      c.fillStyle = '#c9c5d4'; c.fill(); c.save(); c.clip();
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(${150 + (i % 5) * 10},${148 + (i % 4) * 9},${170 + (i % 3) * 8},0.25)`; c.fillRect((i * 53) % w, (i * 37) % h, 30, 6); }
      c.restore(); c.lineWidth = 9; c.strokeStyle = '#2b2235'; c.lineJoin = 'round'; c.stroke();
      const [ex, ey] = E.eye; c.fillStyle = '#2b2235'; c.beginPath(); c.arc(w * ex - 12, h * ey, 8, 0, TAU2); c.arc(w * ex + 12, h * ey, 8, 0, TAU2); c.fill();
      c.fillStyle = '#eef4ff'; c.beginPath(); c.arc(w * ex - 10, h * ey - 2, 3, 0, TAU2); c.arc(w * ex + 14, h * ey - 2, 3, 0, TAU2); c.fill();
    }));
  }
  function echoModel(kind) {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const E = ECHO[kind], [sw, sh] = E.size;
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshToonMaterial({ map: echoTex(kind), gradientMap: TK.grad, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
    sheet.position.y = sh / 2 + 0.1; body.add(sheet);
    const gl = glow('#d8d4ec', Math.max(sw, sh) * 1.2, 0.18); gl.position.y = sh / 2; root.add(gl);
    const anchors = anchorsOf(body, [['top', [0, sh + 0.35, 0]], ['mid', [0, sh * 0.55, 0.2]], ['head', [0, sh * 0.75, 0.15]], ['face', [0, sh * 0.72, 0.25]], ['feet', [0, 0.05, 0]]]);
    return { root, body, sheet, gl, anchors, kind, scale: 1, radius: Math.max(sw, sh) * 0.35, height: sh + 0.2, parts: [], labelH: sh + 0.55, hover: 0.55, L: {} };
  }
  function poseEcho(h, F, t) {
    const sd = F.seed || 0;
    h.body.scale.set(F.sx || 1, F.sy || 1, 1);
    h.body.rotation.y = Math.sin(t * 0.7 + sd) * 0.35 + (F.flip || 0) * Math.PI;
    h.body.rotation.z = Math.sin(t * 1.1 + sd) * 0.06 + (F.lean || 0) * 0.3;
    h.gl.material.opacity = 0.14 + 0.06 * Math.sin(t * 2 + sd);
  }
  const ECHO_KINDS = Object.keys(ECHO), KINDS = ['fb_vessel', 'fb_hood', 'fb_mask', ...ECHO_KINDS];
  const ECHO_SRC = { fb_echo_alb: () => (typeof PTFTXT !== 'undefined' ? PTFTXT.SPECIES : null), fb_echo_mor: () => (typeof RUFTXT !== 'undefined' ? RUFTXT.SPECIES : null), fb_echo_war: () => (typeof GFTXT !== 'undefined' ? GFTXT.SPECIES : null) };
  const ECHO_EN = { fb_echo_alb: 'echo of the Gray Albatross', fb_echo_mor: 'echo of the Gray Moray', fb_echo_war: 'echo of the Thorn Warden' };
  // the echoes' words are the bosses' own: registered only while this fight runs (so «el albatros» means the Port's own elsewhere)
  function echoSpecies(on) {
    if (!_ || !_.LANGS) return;
    for (const k of ECHO_KINDS) {
      const src = ECHO_SRC[k]();
      for (const Lg of Object.values(_.LANGS)) {
        if (!Lg || !Lg.species) continue;
        const lg = Lg.code || Object.keys(_.LANGS).find(x => _.LANGS[x] === Lg);
        if (on && src && src[lg]) Lg.species[k] = Object.assign({}, src[lg], { en: ECHO_EN[k] });
        else if (!on) delete Lg.species[k];
        delete Lg.I; delete Lg.CJ;
      }
    }
  }

  // ------------------------------------------------------------ the battle's hooks: species, models, labels, the bestiary, voices,
  // the song (the top's, then the fury's), the arena, the plug-in
  function hook() {
    try {
      if (typeof BOSS_MUSIC !== 'undefined' && BOSS_MUSIC.SONG && !Object.getOwnPropertyDescriptor(BOSS_MUSIC.SONG, 'fb_vessel')) Object.defineProperty(BOSS_MUSIC.SONG, 'fb_vessel', { get: () => ((st().phase || 1) >= 4 ? 'boss_fb_fury' : 'boss_fb_top'), enumerable: true, configurable: true });
    } catch (e) { /* */ }
    if (!_) return;
    for (const [id, table] of Object.entries(X().SPECIES)) if (id !== 'fb_core') for (const [lg, sp] of Object.entries(table)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species[id]) { Lg.species[id] = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
    const M = _.M;
    if (M && !M.fbHooked) {
      M.fbHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (KINDS.includes(String(k || '')) ? String(k) : k0(k));
      M.build = o => (o && o.kind === 'fb_vessel' ? vesselModel() : o && o.kind === 'fb_hood' ? hoodModel(o) :o && o.kind === 'fb_mask' ? maskModel(o) : o && ECHO[o.kind] ? echoModel(o.kind) : b0(o));
      M.pose = (h, F, t, dt) => (h && h.kind === 'fb_vessel' ? poseVessel(h, F, t, dt) : h && h.kind === 'fb_hood' ? poseHood(h, F, t, dt) : h && h.kind === 'fb_mask' ? poseMask(h, F, t, dt) : h && ECHO[h.kind] ? poseEcho(h, F, t, dt) : p0(h, F, t, dt));
      M.brighten = (h, k) => (h && KINDS.includes(h.kind) ? undefined : br0(h, k));
    }
    const U = _.UI;
    if (U && U.label && !U.fbHooked) { U.fbHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && f.species === 'fb_vessel' ? vesselLabel(f) : f && f.spec && f.spec.fbLead && f.alive ? html + ' <span class="bt-chip">👑</span>' : html); }; }
    if (_.RW && _.RW.LORE) for (const [k, T0] of Object.entries(X().LORE)) { const key = k === 'fb_vessel' || k === 'fb_core' ? 'boss:' + k : k; if (!_.RW.LORE[key]) _.RW.LORE[key] = ['es', 'pt', 'de', 'zh', 'ja'].map(l => T0[l] || T0.es).concat([T0.en]); }
    if (_.RW && _.RW.KIND_EN) Object.assign(_.RW.KIND_EN, { fb_vessel: 'the Hush', fb_hood: 'hushed hood', fb_mask: 'laughing mask', fb_core: 'the heart of the Hush' }, ECHO_EN);
    if (_.UI && _.UI.ICON) {
      if (!_.UI.ICON.fb_vessel) _.UI.ICON.fb_vessel = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 4 C14 10 8 26 9 40 L5 60 L59 60 L55 40 C56 26 50 10 32 4 Z" fill="#8a84a2" stroke="#2b2235" stroke-width="3"/><ellipse cx="32" cy="24" rx="11" ry="8" fill="#0c0912"/><circle cx="27" cy="24" r="2.4" fill="#cfe0ff"/><circle cx="37" cy="24" r="2.4" fill="#cfe0ff"/><path d="M22 60 C24 46 40 46 42 60" fill="#6f6987" stroke="#2b2235" stroke-width="2.5"/></svg>';
      if (!_.UI.ICON.fb_hood) _.UI.ICON.fb_hood = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 6 C18 12 14 26 16 40 L12 56 L20 50 L26 58 L32 50 L38 58 L44 50 L52 56 L48 40 C50 26 46 12 32 6 Z" fill="#7a7494" stroke="#2b2235" stroke-width="3" stroke-linejoin="round"/><ellipse cx="32" cy="28" rx="9" ry="8" fill="#0c0912"/><circle cx="29" cy="28" r="2" fill="#eef4ff"/><circle cx="35" cy="28" r="2" fill="#eef4ff"/></svg>';
      if (!_.UI.ICON.fb_mask) _.UI.ICON.fb_mask = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M10 14 C24 8 40 8 54 14 C56 36 46 56 32 58 C18 56 8 36 10 14 Z" fill="#e8b93a" stroke="#2b2235" stroke-width="3"/><path d="M18 26 q6 -6 12 0 M34 26 q6 -6 12 0" fill="none" stroke="#2b2235" stroke-width="3.5" stroke-linecap="round"/><path d="M20 36 Q32 54 44 36 Q32 42 20 36 Z" fill="#2b2235"/></svg>';
      for (const k of ECHO_KINDS) if (!_.UI.ICON[k]) _.UI.ICON[k] = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="10" y="10" width="44" height="44" rx="6" fill="#c9c5d4" stroke="#2b2235" stroke-width="3" transform="rotate(-8 32 32)"/><circle cx="27" cy="30" r="3" fill="#2b2235"/><circle cx="37" cy="30" r="3" fill="#2b2235"/></svg>';
    }
    try { if (typeof BFX !== 'undefined' && BFX.VOICES) { if (!BFX.VOICES.fb_vessel) BFX.VOICES.fb_vessel = { m: 38, vow: ['o', 'u', 'o'], len: 0.2, gap: 0.08 }; if (!BFX.VOICES.fb_hood) BFX.VOICES.fb_hood = { m: 58, vow: ['u', 'u'], len: 0.1, gap: 0.06 }; if (!BFX.VOICES.fb_mask) BFX.VOICES.fb_mask = { m: 74, vow: ['a', 'a', 'a'], len: 0.07, gap: 0.03 }; } } catch (e) { /* (no battle sounds) */ }
    _.plugins = _.plugins || {}; _.plugins.fb_vessel = PLUG;
    _.arenaBuilders = _.arenaBuilders || {}; if (!_.arenaBuilders.fb_top) _.arenaBuilders.fb_top = K => buildTop(K);
  }
  // its label: its name, four stacked bars (one per phase: the ones still under this one, this one), the bar itself
  function vesselLabel(f) {
    const l = lang(), N = nameOf('vessel', l), name = isC(l) && typeof CJK !== 'undefined' ? CJK.html(N, { lang: l }) : esc(N);
    const ph = FX ? FX.phase : 1, left = 4 - ph, pct = Math.round(100 * f.hp / Math.max(1, f.maxHp));
    const stack = `<span class="fb-stack">${Array.from({ length: 4 }, (_x, i) => `<i class="${i < left ? 'on' : i === left ? 'cur' : ''}"></i>`).join('')}</span>`;
    const shield = FX && FX.wallUp ? ' <span class="bt-chip">🛡</span>' : '';
    return `<div class="bt-chips"><span class="bt-chip name">${name}</span>${stack}${shield}</div><div class="bt-hpbar"><i style="width:${pct}%"></i><span>${f.hp}</span></div>`;
  }

  // ------------------------------------------------------------ the arena: the Clock Room at night, wide (stage.js _.arenaBuilders.fb_top)
  // An inner floor of old planks, an outer ring in twelve pieces, the curved wall behind in eight sections with timber ribs, the great
  // clock high on it (Noa in its face; its glass cracks), gears, the cracked bell, a window full of night. Its set pieces, driven by
  // ARENA.anim (0…1 each; setPhase puts them where a phase starts): blow (the wall flies out), storm (the sky beyond, rain, lightning),
  // crumble (the outer ring falls away), gears (the inner floor drops, floating gears rise under everyone), crack (the clock's glass).
  let ARENA = null;
  function stainMat(uni) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    m.onBeforeCompile = sh => {
      sh.uniforms.uStain = uni.uStain; sh.uniforms.uStainC = uni.uStainC;
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uStain; uniform vec2 uStainC; varying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hk = uStain * (1.0 - smoothstep(1.5, 9.5, distance(vWPos.xz, uStainC))) * (0.8 + 0.2 * sin(vWPos.x * 1.7 + vWPos.z * 1.3));\n' +
        'vec3 hg = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.97, 0.92, 1.16) + vec3(0.07, 0.06, 0.1);\ndiffuseColor.rgb = mix(diffuseColor.rgb, hg, hk * 0.72);');
    };
    m.customProgramCacheKey = () => 'fb-top-floor';
    return m;
  }
  function gearPieces(r, col, col2) {
    const G = TK.G, M4 = TK.M4, k = [];
    k.push({ geo: G.cyl, m: M4(0, 0, 0, r, 0.36, r), color: col });
    const n = Math.max(10, Math.round(r * 5));
    for (let i = 0; i < n; i++) { const a = i / n * TAU2; k.push({ geo: G.box, m: M4(Math.sin(a) * r, 0, Math.cos(a) * r, r * 0.2, 0.34, r * 0.24, a), color: col }); }
    k.push({ geo: G.cyl, m: M4(0, 0.2, 0, r * 0.24, 0.12, r * 0.24), color: col2 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU2; k.push({ geo: G.box, m: M4(Math.sin(a) * r * 0.55, 0.2, Math.cos(a) * r * 0.55, r * 0.5, 0.06, 0.14, a), color: col2 }); }
    return k;
  }
  function buildTop(K) {
    const { merge, M4, toon } = TK, G = TK.G, FN = 22, FF = 90;
    const P = { fog: '#1d1a2b', storm: '#2a2838', hemiSky: '#9aa2d8', hemiGround: '#3a2c2a', sun: '#c9d6ff', hemiI: 0.62, sunI: 0.62 };
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(P.fog, FN, FF); scene.background = new THREE.Color(P.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) } };
    const hemi = new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI); scene.add(hemi);
    const sun = new THREE.DirectionalLight(P.sun, P.sunI); sun.position.set(-9, 17, 8); sun.target.position.set(1, 0, -2);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    const warm = new THREE.PointLight('#ffd49a', 0.6, 30, 1.6); warm.position.set(2.0, 6.0, -12.6); scene.add(warm);
    const R = rng(9301), CX = 1.0, CZ = -1.0, RIN = 9.6, ROUT = 15.0;
    const fmat = stainMat(uni), pmat = toon('#ffffff', { vc: 1, rim: 0.15 });
    const cA = new THREE.Color('#6b4c34'), cB = new THREE.Color('#82603f'), cc = new THREE.Color();
    // the inner floor (it drops away in the fury)
    const inner = [];
    for (let x = -18; x < 20; x += 1.2) for (let z = -16; z < 16; z += 3.4) { const px = x + 0.6, pz = z + 1.7 + ((Math.round(x / 1.2) % 2) * 0.8), d = Math.hypot(px - CX, pz - CZ); if (d > RIN) continue; inner.push({ geo: G.box, m: M4(px, -0.1, pz, 1.16, 0.2, 3.36), color: '#' + cc.copy(cA).lerp(cB, R()).getHexString() }); }
    const innerM = new THREE.Mesh(merge(inner), fmat); innerM.receiveShadow = true; scene.add(innerM);
    // the outer ring: twelve pieces (they fall away when the tower top crumbles)
    const ring = [];
    for (let s = 0; s < 12; s++) {
      const a0 = s / 12 * TAU2, a1 = (s + 1) / 12 * TAU2, pcs = [], am = (a0 + a1) / 2;
      for (let x = -18; x < 20; x += 1.2) for (let z = -18; z < 18; z += 3.4) { const px = x + 0.6, pz = z + 1.7 + ((Math.round(x / 1.2) % 2) * 0.8), d = Math.hypot(px - CX, pz - CZ); let a = Math.atan2(px - CX, pz - CZ); if (a < 0) a += TAU2; if (d <= RIN || d > ROUT || a < a0 || a >= a1) continue; pcs.push({ geo: G.box, m: M4(px - CX, -0.1, pz - CZ, 1.16, 0.2, 3.36), color: '#' + cc.copy(cA).lerp(cB, R()).getHexString() }); }
      for (let i = 0; i < 4; i++) { const a = a0 + (i + 0.5) / 4 * (a1 - a0); pcs.push({ geo: G.box, m: M4(Math.sin(a) * (ROUT + 0.4), -0.05, Math.cos(a) * (ROUT + 0.4), 2.3, 0.3, 1.6, a), color: i % 2 ? '#5d5668' : '#686172' }); }
      if (!pcs.length) continue;
      const m = new THREE.Mesh(merge(pcs), fmat); m.position.set(CX, 0, CZ); m.receiveShadow = true; scene.add(m);
      ring.push({ m, a: am, spin: (R() - 0.5) * 2, delay: R() * 0.35 });
    }
    // the wall: eight sections of stone courses with timber ribs (they blow outward), and the beam along its top
    const walls = [];
    for (let s = 0; s < 8; s++) {
      const a0 = Math.PI * 0.5 + s / 8 * Math.PI, a1 = Math.PI * 0.5 + (s + 1) / 8 * Math.PI, am = (a0 + a1) / 2, pcs = [];
      for (let i = 0; i < 4; i++) {
        const a = a0 + (i + 0.5) / 4 * (a1 - a0), x = Math.sin(a) * 16.2, z = Math.cos(a) * 16.2;
        for (let k = 0; k < 7; k++) pcs.push({ geo: G.box, m: M4(x, 0.7 + k * 1.4, z, 2.1, 1.36, 0.9, a), color: (i + k) % 2 ? '#4e4858' : '#575062' });
        if (i === 1) pcs.push({ geo: G.box, m: M4(Math.sin(a) * 15.6, 4.9, Math.cos(a) * 15.6, 0.5, 9.8, 0.5, a), color: '#4a3a2c' });
        pcs.push({ geo: G.box, m: M4(Math.sin(a) * 15.5, 9.9, Math.cos(a) * 15.5, 2.2, 0.45, 0.6, a), color: '#3f3026' });
      }
      const m = new THREE.Mesh(merge(pcs), pmat); m.position.set(CX, 0, CZ); m.castShadow = m.receiveShadow = true; scene.add(m);
      walls.push({ m, a: am, spin: (R() - 0.5) * 1.6, up: 2 + R() * 4, delay: Math.abs(s - 3.5) * 0.06 });
    }
    // the window full of night (in the wall's left part: it goes with it)
    const winTex = TK.canvasTex(64, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0d1236'); gr.addColorStop(1, '#3d4c8c'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#fff6dc'; for (let i = 0; i < 18; i++) c.fillRect((i * 37) % w, (i * 53) % (h * 0.7), 1.5, 1.5); c.fillStyle = '#f4f0dc'; c.beginPath(); c.arc(w * 0.7, h * 0.22, 9, 0, TAU2); c.fill(); c.fillStyle = '#2a2440'; c.fillRect(w / 2 - 2, 0, 4, h); c.fillRect(0, h * 0.45, w, 4); });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.2), new THREE.MeshBasicMaterial({ map: winTex }));
    { const a = Math.PI * 0.69; win.position.set(Math.sin(a) * 15.6, 5.2, Math.cos(a) * 15.6); win.rotation.y = a + Math.PI; walls[1].m.add(win); }
    // the cracked bell lying on its side, a stool, loose pages (on the inner floor)
    const pr = [];
    pr.push({ geo: G.cyl, m: M4(-6.6, 0.4, -5.6, 0.35, 0.8, 0.35), color: '#6a4c36' });
    for (let i = 0; i < 16; i++) { const x = -8 + R() * 16, z = -7 + R() * 12; if (Math.hypot(x - CX, z - CZ) > RIN - 0.5 || (Math.abs(x - 1) < 6 && Math.abs(z) < 3.5)) continue; pr.push({ geo: G.box, m: M4(x, 0.02, z, 0.36, 0.01, 0.48, R() * 3), color: '#efe6cf' }); }
    const props = new THREE.Mesh(merge(pr), pmat); props.castShadow = props.receiveShadow = true; innerM.add(props); props.position.set(0, 0.1, 0);
    const bell = TK.part(lathe([[0, 0], [1.2, 0], [1.15, 0.1], [0.99, 0.3], [0.79, 0.6], [0.67, 0.95], [0.61, 1.3], [0.57, 1.62], [0.49, 1.84], [0.33, 1.93], [0, 1.96]], 26), null, null, null, { mat: tmat('#a07246', { side: THREE.DoubleSide }), ink: 0.025 });
    bell.rotation.set(0, 0.7, 1.85); bell.position.set(-8.2, 1.15, -5.0); bell.scale.setScalar(1.15); innerM.add(bell);
    // the great clock, Noa in its face, and its crack
    let clock = null; const CKX = CX + 1.2, CKY = 6.2, CKZ = CZ - 15.4;
    try { clock = OLDBOSS.clockFace({ r: 3.0 }); clock.g.position.set(CKX, CKY, CKZ); clock.g.rotation.y = -0.06; scene.add(clock.g); } catch (e) { clock = null; }
    const crackTex = TK.canvasTex(256, 256, (c, w, h) => { c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 3; c.lineCap = 'round'; const R2 = rng(77); for (let k = 0; k < 9; k++) { let x = w / 2 + (R2() - 0.5) * 30, y = h / 2 + (R2() - 0.5) * 30; const a = k / 9 * TAU2; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 6; j++) { x += Math.cos(a + (R2() - 0.5)) * 22; y += Math.sin(a + (R2() - 0.5)) * 22; c.lineTo(x, y); } c.stroke(); } });
    const crack = new THREE.Mesh(new THREE.CircleGeometry(3.0, 40), new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, opacity: 0, depthWrite: false }));
    crack.position.set(CKX, CKY, CKZ + 0.34); crack.rotation.y = -0.06; scene.add(crack);
    // the gears round the clock (slow; they spin the way the clock runs)
    const gears = [];
    [[-6.2, 7.6, 1.7, 0.05], [8.6, 7.0, 2.1, -0.04], [-7.6, 3.4, 1.1, -0.07], [9.8, 3.0, 1.3, 0.06]].forEach(([dx, y, r, sp]) => {
      const gg = new THREE.Group(); gg.position.set(CX + dx, y, CZ - 15.0 + Math.abs(dx) * 0.06); gg.rotation.x = Math.PI / 2; scene.add(gg);
      gg.add(new THREE.Mesh(merge(gearPieces(r, '#a87b3e', '#5a4026')), toon('#ffffff', { vc: 1, rim: 0.1 }))); gears.push({ g: gg, sp });
    });
    // the fury: floating gears to stand on (under the party, the front, the Hush) and smaller ones drifting by
    const plat = [];
    [[-3.6, 0.4, 3.2], [3.0, 0.0, 3.0], [6.8, -7.2, 3.4], [-9.5, -6.5, 1.6], [11.5, 3.5, 1.4], [-1.0, -9.5, 1.2], [12.0, -9.0, 1.8]].forEach(([x, z, r], i) => {
      const gg = new THREE.Group(); scene.add(gg); gg.position.set(x, -16, z); gg.visible = false;
      const m = new THREE.Mesh(merge(gearPieces(r, i < 3 ? '#b5863f' : '#9a6f36', '#5a4026')), toon('#ffffff', { vc: 1, rim: 0.15 })); m.position.y = -0.18; m.castShadow = m.receiveShadow = true; gg.add(m);
      plat.push({ g: gg, y0: i < 3 ? 0 : -1.5 + (i % 3) * 1.6, sp: (i % 2 ? 1 : -1) * (0.05 + i * 0.01), bob: i * 1.3, delay: i * 0.08 });
    });
    // the storm beyond the broken wall: a dark sky, rain, lightning
    const skyTex = TK.canvasTex(8, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0e0c16'); g.addColorStop(0.45, '#2a2738'); g.addColorStop(0.62, '#4a4458'); g.addColorStop(1, '#1a1824'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 24, 14), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, color: '#ffffff' })); sky.visible = false; scene.add(sky);
    const NR = 520, rp = new Float32Array(NR * 6);
    for (let i = 0; i < NR; i++) { const x = -30 + R() * 60, y = R() * 30, z = -40 + R() * 50; rp.set([x, y, z, x - 0.25, y - 1.4, z + 0.1], i * 6); }
    const rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
    const rain = new THREE.LineSegments(rgeo, new THREE.LineBasicMaterial({ color: '#b8bfd8', transparent: true, opacity: 0.45, fog: false })); rain.visible = false; scene.add(rain);
    // gray wisps round the foes (the Hush)
    const wisps = [];
    for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#b9aee6', transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(0.26); scene.add(s); const a = R() * TAU2, d = 1.4 + R() * 3.6; wisps.push({ s, ph: R() * TAU2, sp: 0.35 + R() * 0.4, ox: Math.cos(a) * d, oz: Math.sin(a) * d * 0.8 - 0.6 }); }
    const anim = { blow: 0, storm: 0, crumble: 0, gears: 0, crack: 0 };
    let bolt = 3, boltK = 0;
    const fogA = new THREE.Color(P.fog), fogB = new THREE.Color(P.storm);
    function apply(t) {
      const b = anim.blow, cr = anim.crumble, ge = anim.gears;
      walls.forEach(w => { const u = Math.max(0, Math.min(1, (b - w.delay) / (1 - w.delay))); w.m.visible = u < 0.995; if (!w.m.visible) return; const d = u * u * 34; w.m.position.set(CX + Math.sin(w.a) * d, w.up * u * 3 - u * u * u * 26, CZ + Math.cos(w.a) * d); w.m.rotation.set(-u * w.spin * 0.8, 0, u * w.spin); });
      ring.forEach(p => { const u = Math.max(0, Math.min(1, (cr - p.delay) / (1 - p.delay))); p.m.visible = u < 0.995; if (!p.m.visible) return; p.m.position.set(CX + Math.sin(p.a) * u * 5, -u * u * 46, CZ + Math.cos(p.a) * u * 5); p.m.rotation.set(Math.cos(p.a) * u * p.spin, 0, -Math.sin(p.a) * u * p.spin); });
      innerM.visible = ge < 0.995; innerM.position.y = -ge * ge * 50; innerM.rotation.z = ge * 0.15;
      plat.forEach(p => { const u = Math.max(0, Math.min(1, (ge - p.delay) / (1 - p.delay))); p.g.visible = u > 0.002; const e = u * u * (3 - 2 * u); p.g.position.y = -16 + (p.y0 + 16) * e + Math.sin(t * 0.9 + p.bob) * 0.06 * e; });
      sky.visible = rain.visible = anim.storm > 0.01; rain.material.opacity = 0.45 * anim.storm;
      crack.material.opacity = anim.crack;
      scene.fog.color.copy(fogA).lerp(fogB, anim.storm); scene.background = scene.fog.color;
      clock && (clock.g.visible = true);
    }
    function setPhase(ph, turned) { Object.assign(anim, { blow: ph >= 2 ? 1 : 0, storm: ph >= 2 ? 1 : 0, crumble: ph >= 3 ? 1 : 0, gears: ph >= 4 ? 1 : 0, crack: ph >= 4 ? 1 : ph >= 2 || turned ? 0.45 : 0 }); if (clock) { clock.spin = ph === 2 ? -0.35 : ph === 3 ? 0.35 : 0; clock.beat = 1; clock.glow = 0; } ARENA.gearK = ph === 2 ? -3 : ph === 3 ? 3 : ph === 4 ? 5 : 1; apply(0); }
    function update(t, dt, stainC) {
      uni.uTime.value = t;
      apply(t);
      gears.forEach(g => { g.g.rotation.y += dt * g.sp * (ARENA && ARENA.gearK || 1); });
      plat.forEach(p => { if (p.g.visible) p.g.rotation.y += dt * p.sp; });
      if (clock) clock.update(dt, t);
      warm.intensity = 0.5 + 0.1 * Math.sin(t * 1.3);
      if (anim.storm > 0.01) {
        const a = rgeo.attributes.position.array;
        for (let i = 0; i < NR; i++) { const o = i * 6; a[o + 1] -= dt * 22; a[o + 4] -= dt * 22; a[o] -= dt * 4; a[o + 3] -= dt * 4; if (a[o + 4] < -8) { const x = -30 + Math.random() * 60, z = -40 + Math.random() * 50; a[o] = x; a[o + 1] = 30; a[o + 2] = z; a[o + 3] = x - 0.25; a[o + 4] = 28.6; a[o + 5] = z + 0.1; } }
        rgeo.attributes.position.needsUpdate = true;
        bolt -= dt; if (bolt <= 0) { boltK = 1; bolt = 2.5 + Math.random() * 5; try { if (FX) Sound.play('thunder'); } catch (e) { /* */ } }
      }
      boltK = Math.max(0, boltK - dt * 4.5);
      const fl = boltK > 0.6 || (boltK > 0.15 && boltK < 0.35) ? 1 : 0;
      hemi.intensity = P.hemiI + fl * 1.1 * anim.storm; sky.material.color.setScalar(1 + fl * 1.4);
      for (const w of wisps) { const k = ((t * w.sp * 0.25 + w.ph / TAU2) % 1); w.s.position.set(stainC.x + w.ox + Math.sin(t + w.ph) * 0.3, k * 3.6, stainC.y + w.oz + Math.cos(t * 0.8 + w.ph) * 0.3); w.s.material.opacity = Math.sin(k * Math.PI) * 0.34 * uni.uStain.value; }
    }
    ARENA = { scene, sun, uni, update, P, clock, gears, anim, setPhase, apply, gearK: 1, noaAt: { x: CKX, y: CKY - 1.6, z: CKZ + 0.6 } };
    return ARENA;
  }

  // ------------------------------------------------------------ the fight: a plug-in boss on battle/flow.js (BATTLE._.plugins.fb_vessel)
  let FX = null;
  const XF = () => (_ && _.flow) || null, TAC = () => (_ && _.tac) || null;
  const pw = () => Math.max(1, +((XF() && XF().G.power) || 1));
  // its four bars of fog (one per phase; it can't fall below 1 until the phase is over), how big it is each phase, the bands and realms
  const BAR = { 1: 12, 2: 14, 3: 16, 4: 18 }, GROW = { 1: 2.2, 2: 2.45, 3: 2.7, 4: 3.0 }, HOME = { x: 6.9, z: -7.4 };
  const BAND = { 1: 'today', 2: 'yesterday', 3: 'tomorrow', 4: 'fury' }, REALM = { 1: null, 2: 'past', 3: 'future', 4: null };
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [b[i], b[j]] = [b[j], b[i]]; } return b; };
  function goonSpecs(ph) {
    // three hoods anyone can tell apart (a red, a blue, a yellow; one of them big: their leader, 👑); in any order
    if (ph === 1) { const lead = (Math.random() * 3) | 0; return shuffle(['red', 'blue', 'yellow'].map((c, i) => ({ kind: 'fb_hood', color: c, size: i === lead ? 'big' : 'small', hp: i === lead ? 8 : 6, floating: true, fbLead: i === lead }))); }
    if (ph === 2) return ['red', 'yellow', 'blue'].map(c => ({ kind: 'fb_mask', color: c, size: 'small', hp: 7, floating: true }));
    if (ph === 3) return ECHO_KINDS.map(k => ({ kind: k, color: 'white', size: 'small', hp: 8, floating: true }));
    return [];
  }
  const specsFor = ph => [{ kind: 'fb_vessel', color: 'white', size: 'big', giant: GROW[ph], hp: BAR[ph] }].concat(goonSpecs(ph));
  const goonsOf = () => (FX ? XF().G.foes.filter(g => g !== FX.f && g.alive && !g.gone && !g.calmed) : []);
  const goonsUp = () => goonsOf().length > 0;
  const wall = () => { FX.wallUp = goonsUp(); if (FX.wallUp) FX.lockHp = FX.f.hp; return FX.wallUp; };
  const sayF = (K, who, key, dur, cls, tab = 'FIGHT') => { const [t, en] = line(key, tab); K.say(who, t, { cls, en, dur }); return t; };
  const noaSay = (K, key, dur = 3.4) => { if (!FX || !FX.noaSt) return; const C = ARENA && ARENA.clock; if (C) { C.beat = 1.8; C.glow = 0.3; setTimeout(() => { if (C && FX) { C.beat = 1; C.glow = 0; } }, dur * 900); } sayF(K, FX.noaSt, key, dur, 'coach noa'); };
  const hushSay = (K, key, dur = 3.0, shout = true) => sayF(K, FX.f, key, dur, shout ? 'foe shout boss hush' : 'foe hush');
  // Elio's own voice, from inside the fog: whole in the language (EN on request, like everyone's), from the Hush's chest, under its
  // label and clear of the tip box
  function elioAt(K) {
    const p = K.ST.worldOf(FX.f, 'mid'); FX.elioSt = FX.elioSt || { kind: 'elio', x: 0, y: 0, z: 0, hidden: false, talk: 0 };
    return Object.assign(FX.elioSt, { x: p.x, y: p.y - 0.6, z: p.z + 0.4 });
  }
  function elioVoice(K, key) {
    if (!FX) return;
    const left = ['e.1', 'e.2', 'e.3', 'e.4'].filter(k => !FX.told[k]), k = key || left[0]; if (!k) return;
    FX.told[k] = true; FX.voiceT = K.G.t + 2.8;
    sayF(K, elioAt(K), k, 2.8, 'foe small elio');
  }
  const playBand = ph => { try { if (typeof FBM !== 'undefined') FBM.state.top = BAND[ph] || 'today'; if (ph >= 4) Sound.setSong('boss_fb_fury'); } catch (e) { /* */ } };
  function setRealm(K, realm, tb) { const o = K.G.opts || (K.G.opts = {}); o.realm = realm || undefined; o.tb = tb || undefined; }
  function realmRung(K) {
    const TB = _ && _.tense, realm = TB && TB.realm(); if (!realm) return;
    const stage = realm === 'past' ? 'pret' : 'fut', x = XF();
    try { x.G.frames.push({ text: TB.frame(stage), pat: realm }); x.renderFrames(); } catch (e) { /* (no frames here) */ }
    try { const f = K.targetable().find(k => !k.shy && k !== FX.f) || FX.f, m = TB.modelFor(f, K.knows('v.jump') ? 'jump' : 'hit', stage); K.UI.rung(`${realm === 'past' ? 'The Past · tell it as a memory' : 'The Future · say what will happen'}: <b>«${esc(plainT(m))}»</b>`); } catch (e) { /* */ }
  }
  // the camera, pulled back while this fight runs (the Hush is huge): the wide shot frames it all, a shot on the Hush backs off
  let shot0 = null;
  const CAMW = { 1: [3.0, 21], 2: [3.8, 24], 3: [4.2, 26], 4: [4.6, 28] };     // (the wide shot per phase: how high it looks, how far back)
  function camOn(ST) {
    if (shot0) return; shot0 = ST.shot;
    ST.shot = (name, a, b, o = {}) => {
      const f = FX && FX.f, ph = FX ? FX.phase : 1;
      if (!f) return shot0(name, a, b, o);
      const fov = k => { try { ST.S.cam.goal.fov = k; } catch (e) { /* */ } };
      if (name === 'wide') { const [up, dist] = CAMW[ph] || CAMW[1]; shot0('focus', { x: 0.6, z: -2.0 }, null, { up, dist, pitch: 0.13, yaw: -0.16, k: o.k }); fov(44); return; }
      if ((name === 'focus' || name === 'action') && (a === f || b === f)) { shot0(name, a, b, Object.assign({}, o, { up: (o.up || 0) + 2.0 + 0.3 * (ph - 1), dist: Math.max(o.dist || 0, 15 + ph) })); fov(40); return; }
      return shot0(name, a, b, o);
    };
  }
  function camOff(ST) { if (shot0) { ST.shot = shot0; shot0 = null; } }
  // the voice meter
  function voiceAdd(K, d) {
    if (!FX || d <= 0) return;
    FX.voice = Math.min(1, FX.voice + d); st().voice = FX.voice;
    if (FX.voice >= 1 && !FX.voiceReady && !FX.hopeless) { FX.voiceReady = true; voiceUI(); noaSay(K, 'n.voice', 3.6); try { K.UI.tip(X().you('voice', lang())); } catch (e) { /* */ } snd('chest'); }
    voiceUI();
  }
  async function voiceBlast(K) {
    const { A, ST } = K;
    ST.shot('party'); flash(0.5);
    sayF(K, A.you, 'v.shout', 1.8, 'you voz'); sayF(K, A.mimo, 'v.shout', 1.8, 'mimo voz');
    for (const s of [A.you, A.mimo]) { ST.ring(s, '#ffd34d', 3.2); ST.S.fx.sparkle(s.x, 1.2, s.z, 18, ['#ffd34d', '#fff3a0', '#ffffff']); }
    ST.shake(0.8, 0.6); snd('chest'); K.emit('crit');
    await K.wait(1.1);
  }
  // the goons come in: from above, one after another (the fallen ones of the wave before leave the floor)
  async function goonsIn(K, ph, already) {
    const x = XF(), { G: BG, ST } = K;
    for (let i = BG.foes.length - 1; i >= 0; i--) { const g = BG.foes[i]; if (g !== FX.f && (!g.alive || g.gone)) { try { ST.S.scene.remove(g.h.root, g.shadow); } catch (e) { /* */ } K.UI.labelRemove(g); BG.foes.splice(i, 1); } }
    let list = already;
    if (!list) {
      const specs = goonSpecs(ph).map((s, i) => x.normFoe(s, i));
      list = ST.addFoes(specs, ST.rowSpots(specs.length));
      list.forEach(g => { g.id = BG.nextId++; g.hp = g.maxHp = Math.round(g.spec.hp * pw()); g.x = g.hx; g.z = g.hz; g.tbPlan = null; g.tbPredict = null; g.tbTrap = null; g.tbSlept = 0; g.tbHigh = null; });
    }
    list.forEach(g => { g.seed = Math.random() * 6; g.hidden = true; g.x = g.hx; g.z = g.hz; g.y = 7; });
    // (they float at three heights, the front one lowest, so their labels don't pile up under the wide camera: each label at least
    // 0.85 over the one in front of it, whatever their sizes; the big one's head is higher)
    let top = -Infinity;
    list.slice().sort((a, b) => b.hz - a.hz).forEach((g, i) => {
      if (!g.floating) return;
      const lh = (g.h.scale || 1) * (g.h.labelH || 0.98);
      let y = (g.hover || 0.55) + i * 0.85;
      if (y + lh < top + 0.85) y = top + 0.85 - lh;
      g.baseY = y; top = y + lh;
    });
    ST.shot('wide');
    await Promise.all(list.map((g, i) => K.wait(i * 0.28).then(async () => {
      g.hidden = false; K.setMood(g, 'go', 1.2);
      await K.tween(g, { y: g.baseY || 0 }, 0.5, 'in');
      K.squash(g, 1.25, 0.75, 0.06); ST.S.fx.puff(g.x, 0.1, g.z, 6, 0.22, '#b9aee6'); ST.shake(0.2, 0.15); snd('swoosh');
    })));
    try { x.updateStain(); } catch (e) { /* */ }
    wall(); K.refreshLabels();
  }
  // a hit on the Hush while its goons stand: it bounces off their shield (no damage; the grade still shows)
  async function bounce(c) {
    const x = XF(), { G: BG, A, ST, UI } = x, f = c.target, M = A.mimo, p = ST.worldOf(f, 'mid');
    x.setMood(M, 'go'); ST.shot('action', M, f, { yaw: -0.1, up: 0.6 });
    x.turnTo(M, x.yawTo(M, p.x, p.z), 0.1);
    await x.arcTo(M, lerp(M.x, p.x, 0.45), 1.4, lerp(M.z, p.z, 0.45), 0.4, 1.2);
    ST.ring({ x: lerp(M.x, p.x, 0.6), z: lerp(M.z, p.z, 0.6) }, '#b9aee6', 3.2); ST.S.fx.puff(M.x, 1.2, M.z, 10, 0.3, '#b9aee6'); ST.shake(0.3, 0.3); x.emit('block', { foe: f, kind: 'shell' });
    UI.pop(ST.worldOf(M, 'top').add(V(0.6, 0.6, 0)), 'BLOCKED', BG.t, { color: '#d9d1e2', size: 36, sub: FX.phase === 2 ? 'the masks circle it' : FX.phase === 3 ? 'its echoes guard it' : 'its hoods shield it', dx: 0.25 });
    x.showGrade(f);
    BG.stats.bounced = (BG.stats.bounced || 0) + 1;
    await x.hopHome(M, 1.2, 0.5); x.setMood(M, 'confused', 1.0);
    if (!FX.told.wall) { FX.told.wall = true; hushSay(x, 'h.wall', 2.6); await x.wait(1.8); }
  }
  // its blows: a taunt and a slow wind-up (its fog gathers), then n blows in a row (high: duck; low: jump), each dodged out loud;
  // each one that lands: a white frame, hitstop, a big shake
  async function vesselAttack(K, n = 1, dmg = 1) {
    const { G: BG, A, ST } = K, f = FX.f, P = f.fbPose;
    if (!f.alive || BG.hearts <= 0) return;
    const tgt = Math.random() < 0.5 ? A.mimo : A.you;
    const tk = ['h.t1', 'h.t2', 'h.t3', 'h.t4', 'h.t5', 'h.t6'][FX.taunt++ % 6];
    ST.shot('focus', A.mimo, f, { up: 1.6, dist: 16 });
    hushSay(K, tk, 2.4, false); K.setMood(f, 'go', 2);
    await K.tween(P, { gather: 1 }, 1.0, 'io');
    const seq = []; for (let i = 0; i < n; i++) seq.push(i === 0 ? (f.tbHigh != null ? f.tbHigh : Math.random() < 0.5) : !seq[i - 1]);
    const dw = BG.L && BG.L.dodgeWords ? BG.L.dodgeWords(BG.tier) : null, wd = h => (dw && (h ? dw.high : dw.low)) || (h ? '↑' : '↓');
    const [cry, cryEn] = line(seq[0] ? 'h.shut' : 'h.shh'), where = seq.map(wd).join(' … '), whereP = plainT(where), cryP = plainT(cry);
    if (FX.phase >= 3 || FX.gentle) { FX.voiceT = BG.t + 2.4; K.say(elioAt(K), line('e.where')[0].replace('{where}', where), { cls: 'foe small elio', en: seq.map(h => (h ? 'up high' : 'down low')).join(', then '), dur: 2.4 }); await K.wait(0.9); }
    ST.shot('action', f, tgt, { yaw: 0.04, up: 1.0 });
    K.say(f, `${cry} ${where}`, { cls: 'foe shout boss hush', en: `${cryEn} (${seq.map(h => (h ? 'up high' : 'down low')).join(', then ')})`, dur: K.readTime(cryP + whereP) + 1.6 + n * 0.8 });
    K.emit('shout', { text: cryP, high: seq[0], foe: f, boss: true }); K.dodgeHint(true);
    await K.wait(K.readTime(cryP + whereP) + 0.25);
    for (let i = 0; i < n; i++) {
      const high = seq[i];
      K.emit('windup', { foe: f, high, boss: true });
      await K.tween(P, high ? { lift: 1, gather: 0.3 } : { sweep: 0.35, gather: 0.3 }, 0.22, 'out');
      const tp = K.timingWindow(BG.t + 0.7, high ? 'ArrowDown' : 'ArrowUp', () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
      if (high) await K.tween(P, { lift: 0.2, hit: 1 }, 0.45, 'in'); else await K.tween(P, { sweep: 1 }, 0.5, 'in');
      const grade = await tp, c0 = BG.stats.counters || 0;
      const ok = K.dodgeResult(f, tgt, grade, dmg, { puff: [tgt.x + 0.4, high ? 1.2 : 0.1, tgt.z, '#b9aee6'] });
      if (!ok) { flash(0.75); BG.hitstop = 0.16; ST.shake(1.3, 1.0); snd('crunch'); } else { flash(0.25); ST.shake(0.6, 0.4); snd('swoosh'); }
      if ((BG.stats.counters || 0) > c0) voiceAdd(K, 0.1);
      await K.tween(P, { lift: 0, hit: 0, sweep: 0 }, 0.25, 'io');
      if (BG.hearts <= 0) break;
      if (i < n - 1) await K.wait(0.15);
    }
    await K.tween(P, { gather: 0 }, 0.3);
    await K.wait(0.2);
  }
  // the foes' turn: one goon (the time realm's planned or trapped ones first) and the Hush (every turn alone; every other turn with its
  // goons up); from phase 3 the Hush acts twice
  async function foesTurn(K) {
    const { G: BG } = K, f = FX.f, T = TAC(), ph = FX.phase;
    const goons = goonsOf().filter(g => !g.shy && !g.down && !(g.dazed > 0) && !g.tacDazed);
    if (goons.length) {
      let list = shuffle(goons).slice(0, 1);
      if (T && T.attackers) { try { list = await T.attackers(list); } catch (e) { console.error('[fb] attackers', e); } }
      for (const g of list.slice(0, 2)) { await K.foeAttack(g); if (BG.hearts <= 0) return; await K.wait(0.12); }
    }
    if (!f.alive) return;
    if (FX.hopeless) { await vesselAttack(K, 1, 2); return; }
    if (!goons.length || FX.turn % 2 === 0) await vesselAttack(K, ph >= 4 ? 3 : ph >= 2 ? 2 : 1, ph >= 3 ? 2 : 1);
    if (BG.hearts > 0 && ph >= 3 && (ph >= 4 ? FX.turn % 2 === 1 : !goons.length && FX.turn % 2 === 1)) await vesselAttack(K, 1, 2);
  }
  async function laugh(K) {
    const masks = goonsOf().filter(g => g.species === 'fb_mask'); if (!masks.length) return;
    FX.laughing = true; FX.laughShield = true;
    masks.forEach((g, i) => setTimeout(() => { if (FX) sayF(K, g, 'mk.laugh', 1.6, 'foe small'); }, i * 160));
    snd('babble'); await K.wait(1.4); FX.laughing = false;
    if (!FX.told.laugh) { FX.told.laugh = true; noaSay(K, 'n.laugh', 4.2); await K.wait(2.2); }
  }
  function prePerform(r) {
    if (!r || !r.clauses || !r.clauses.length) return;
    const chain = r.clauses.length >= 2;
    for (const c of r.clauses) {
      const t = c.target; if (!t) continue;
      if (t === FX.f && FX.wallUp) { c.tacRun = bounce; continue; }
      if (FX.hopeless) { c.tacMult = (c.tacMult || 1) * 0.1; c.tacSub = 'BARELY A SCRATCH'; continue; }
      if (FX.voiceReady) { const m = chain ? 3 : 2; c.tacMult = (c.tacMult || 1) * m; c.tacSub = `${plainT(line('v.shout')[0])} ×${m}`; FX.voiceFire = true; continue; }
      if (FX.phase === 2 && FX.laughShield && t.species === 'fb_mask') { c.tacMult = (c.tacMult || 1) * (chain ? 1.5 : 0.5); c.tacSub = chain ? 'LAUGH BROKEN ×1.5' : 'LAUGHING ½'; }
    }
    if (FX.phase === 2 && FX.laughShield) { FX.laughBroke = chain; FX.laughShield = false; }
  }
  async function afterPerform(K, r) {
    const L0 = r && r.grade && r.grade.letter;
    if (FX.voiceFire) { FX.voiceFire = false; FX.voiceReady = false; FX.voice = 0; st().voice = 0; voiceUI(); }
    else voiceAdd(K, L0 === 'S' ? 0.08 : L0 === 'A' ? 0.05 : 0.02);
    if (FX.hopeless && !FX.told.flinch) { FX.told.flinch = true; hushSay(K, 'h.flinch', 2.4, false); try { K.UI.tip(X().YOU.flinch); } catch (e) { /* */ } await K.wait(1.4); }
    if (FX.phase === 2) {
      if (FX.laughBroke) { FX.laughBroke = false; goonsOf().filter(g => g.species === 'fb_mask').forEach(g => sayF(K, g, 'mk.broken', 1.4, 'foe small')); await K.wait(0.6); }
      if (L0 && 'BCD'.includes(L0)) await laugh(K);
    }
    if (FX.turn > 1 && !FX.hopeless && Math.random() < 0.25) elioVoice(K);
  }
  // the big hood (their leader) falls: the other hoods run off (beaten, all the same)
  async function leadDown(K) {
    if (!FX || FX.leadGone) return;
    const lead = K.G.foes.find(g => g.spec && g.spec.fbLead); if (!lead || lead.alive) return;
    FX.leadGone = true;
    const rest = goonsOf().filter(g => g.species === 'fb_hood'); if (!rest.length) return;
    await K.wait(0.3);
    sayF(K, rest[0], 'hd.flee', 2.0, 'foe small'); await K.wait(0.7);
    for (const g of rest) { g.alive = false; g.gone = true; K.UI.labelRemove(g); K.G.stats.beaten++; K.earn(2); }
    await Promise.all(rest.map(async (g, i) => { await K.wait(i * 0.12); for (let n = 0; n < 3; n++) await K.arcTo(g, g.x + 2.6, g.baseY || 0, g.z + 0.3, 0.26, 0.4); g.hidden = true; }));
    try { XF().updateStain(); } catch (e) { /* */ }
  }
  async function masksSwap(K) {
    const list = goonsOf().filter(g => g.species === 'fb_mask' && !g.states.has('asleep')); if (list.length < 2) return;
    K.UI.tagRemove('pos:');
    const pads = list.map(g => ({ hx: g.hx, hz: g.hz })), n = list.length, shift = n === 2 || Math.random() < 0.5 ? 1 : n - 1;
    await Promise.all(list.map((g, i) => K.wait(i * 0.1).then(async () => { const p = pads[(i + shift) % n]; await K.arcTo(g, p.hx, g.baseY || 0, p.hz, 0.6, 0.8 + i * 0.3); g.hx = p.hx; g.hz = p.hz; })));
    K.refreshLabels();
  }
  async function spinClock(K, dir, n = 10) {
    const C = ARENA && ARENA.clock; if (!C) return;
    for (let i = 0; i < n; i++) { C.spin = dir * (0.6 + i * 0.9); snd('tick'); K.ST.shake(0.08 + i * 0.025, 0.06); await K.wait(Math.max(0.1, 0.32 - i * 0.022)); }
    C.spin = dir * 0.35; if (ARENA) ARENA.gearK = dir * 3;
  }
  async function brunoIn(K) {
    const { A, ST } = K, C = A.coach; if (!C || !C.hidden) return;
    C.hidden = false; const hx = C.hx, hz = C.hz; C.x = hx - 6; C.z = hz + 1.2;
    ST.shot('focus', A.you, C, { up: 0.6, dist: 9 });
    await K.arcTo(C, hx - 2.8, 0, hz + 0.6, 0.42, 1.4); await K.arcTo(C, hx, 0, hz, 0.38, 1.0);
    K.squash(C, 1.2, 0.8, 0.07); ST.S.fx.puff(C.x, 0, C.z, 6, 0.2);
    sayF(K, C, 'b.in', 2.6, 'coach'); await K.wait(2.3);
    sayF(K, C, 'b.team', 3.4, 'coach'); await K.wait(2.0);
  }
  // the vessel grows (each phase); its reach and its label grow with it
  async function grow(K, ph) {
    const f = FX.f, h = f.h, k0 = h.scale, k1 = GROW[ph]; if (Math.abs(k1 - k0) < 0.01) return;
    await K.along(1.1, u => { const k = k0 + (k1 - k0) * (u * u * (3 - 2 * u)); h.root.scale.setScalar(k); h.scale = k; f.radius = 1.9 * k; f.height = 4.4 * k; }, 'lin');
    K.ST.shake(0.6, 0.5); K.refreshLabels();
  }
  // the turning point (once, in phase 1's fourth turn): Noa cracks the glass, a seam of light opens in its fog, Elio's whisper, Bruno
  async function turningPoint(K) {
    const { A, ST } = K, f = FX.f;
    FX.hopeless = false; st().turned = true; save();
    ST.shot('focus', A.you, FX.noaSt, { up: 3.0, dist: 18 });
    if (ARENA) { K.tween(ARENA.anim, { crack: 0.45 }, 0.25); if (ARENA.clock) { ARENA.clock.beat = 2.6; ARENA.clock.glow = 0.7; } }
    snd('crack'); ST.shake(0.7, 0.5); flash(0.35);
    noaSay(K, 'n.crack', 3.6); await K.wait(3.0);
    ST.shot('focus', A.mimo, f, { up: 1.4, dist: 15 });
    f.fbSeam = 0; await K.tween(f, { fbSeam: 1 }, 0.9, 'out'); flash(0.3); snd('chime');
    hushSay(K, 'h.seam', 2.4); await K.wait(2.0);
    elioVoice(K, 'e.4'); await K.wait(1.6);
    await brunoIn(K);
    voiceAdd(K, 0.3);
    try { K.UI.tip(X().YOU.seam); } catch (e) { /* */ }
    ST.shot('wide');
  }
  // a phase's opening: the first time (its goons come in), or a restart after a knock-down (with everyone urging you on)
  async function phaseStart(K, restart) {
    const { A, ST } = K, f = FX.f, ph = FX.phase, goons = K.G.foes.filter(g => g !== f);
    ST.shot('focus', A.mimo, f, { up: 1.2, dist: 16 });
    hushSay(K, ['', 'h.hoods', 'h.masks', 'h.echoes', 'h.fury'][ph], 3.0); await K.wait(2.6);
    if (goons.length) await goonsIn(K, ph, goons);
    if (restart && (st().downs[ph] || 0) > 0) {
      noaSay(K, 'n.down', 2.6); await K.wait(1.8);
      if (!A.coach.hidden) { sayF(K, A.coach, 'b.up', 2.2, 'coach'); await K.wait(1.6); }
      elioVoice(K, 'e.5'); FX.told['e.5'] = true; await K.wait(1.4);
      try { K.UI.tip(X().YOU.down); } catch (e) { /* */ }
      if (FX.gentle) { noaSay(K, 'n.gentle', 3.0); await K.wait(2.4); }
    }
    noaSay(K, ['', 'n.p1', 'n.p2', 'n.p3', 'n.p4'][ph], 4.4); await K.wait(3.2);
    if (ph === 1 && goons.some(g => g.spec && g.spec.fbLead && g.alive)) { noaSay(K, 'n.big', 3.0); await K.wait(2.2); }
    if (ph === 2 || ph === 3) realmRung(K);
    ST.shot('wide');
  }
  // into the next phase, in the middle of the fight, with its set piece
  async function toPhase(K, ph) {
    const { A, ST } = K, f = FX.f, S = st();
    FX.phase = ph; FX.openTold = false; FX.laughShield = false; S.phase = ph; save();
    f.hp = f.maxHp = Math.round(BAR[ph] * pw()); K.refreshLabels();
    ST.shot('focus', A.mimo, f, { up: 1.4, dist: 17 });
    K.setMood(f, 'go', 2);
    if (ph === 2) {
      hushSay(K, 'h.walls', 2.8); await K.wait(1.6);
      snd('crack'); flash(0.6); ST.shake(1.6, 1.2);
      ST.shot('wide'); await K.tween(ARENA.anim, { blow: 1, storm: 1, crack: Math.max(0.45, ARENA.anim.crack) }, 1.8, 'in');
      await grow(K, 2);
      hushSay(K, 'h.wind', 3.4); await K.wait(3.0);
      await spinClock(K, -1); playBand(2); tint('yesterday'); setRealm(K, 'past');
      sayF(K, A.mimo, 'm.notfall', 2.4, 'mimo'); await K.wait(2.0);
      ST.shot('focus', A.mimo, f, { up: 1.2, dist: 16 }); hushSay(K, 'h.masks', 3.0); await K.wait(2.6);
    } else if (ph === 3) {
      hushSay(K, 'h.crumble', 3.0); await K.wait(2.2);
      snd('crunch'); flash(0.5);
      ST.shot('wide'); const sh = setInterval(() => { try { ST.shake(0.5, 0.3); } catch (e) { /* */ } }, 220);
      try { await K.tween(ARENA.anim, { crumble: 1 }, 2.4, 'in'); } finally { clearInterval(sh); }
      await grow(K, 3);
      hushSay(K, 'h.forward', 3.2); await K.wait(2.8);
      await spinClock(K, 1); playBand(3); tint('tomorrow'); setRealm(K, 'future');
      hushSay(K, 'h.echoes', 3.0); await K.wait(2.6);
    } else {
      hushSay(K, 'h.fury', 3.2); ST.shake(0.9, 0.7); await K.wait(2.6);
      playBand(4); tint('fury'); setRealm(K, null, { noQueue: true, noGlimpse: true });
      snd('crack'); flash(0.7);
      ST.shot('wide'); await K.tween(ARENA.anim, { gears: 1, crack: 1 }, 2.6, 'io');
      await grow(K, 4);
    }
    if (ph < 4) await goonsIn(K, ph);
    noaSay(K, ['', 'n.p1', 'n.p2', 'n.p3', 'n.p4'][ph], 4.4); await K.wait(3.2);
    if (ph === 2 || ph === 3) realmRung(K);
    ST.shot('wide');
  }
  const HOURS = ['past', null, 'future'];
  async function furyHour(K) {
    const prev = FX.hourI === undefined ? -1 : FX.hourI;
    FX.hourI = prev < 0 ? 0 : (prev + 1 + (Math.random() < 0.35 ? 1 : 0)) % 3;
    const h = HOURS[FX.hourI];
    setRealm(K, h, { noQueue: true, noGlimpse: true });
    tint(h === 'past' ? 'yesterday' : h === 'future' ? 'tomorrow' : 'fury');
    await spinClock(K, h === 'past' ? -1 : 1, 5);
    if (ARENA && ARENA.clock && !h) { ARENA.clock.spin = 0; ARENA.clock.time = 12; }
    hourCard(nameOf(h === 'past' ? 'past' : h === 'future' ? 'future' : 'today'), h === 'past' ? 'Tell it in the past' : h === 'future' ? 'Say what will happen' : 'Say it now');
    if (h) realmRung(K); else try { K.UI.rung('Today · a plain command: <b>«' + esc(plainT(_.P.sayAction(K.G.L, K.knows('v.hit') ? 'hit' : 'jump', FX.f, {}))) + '»</b>'); } catch (e) { /* */ }
    await K.wait(0.6);
  }
  async function downBeat(K) {
    const { A, ST } = K;
    ST.shot('party'); K.setMood(A.mimo, 'hurt', 2.4); K.setMood(A.you, 'hurt', 2.4); flash(0.5);
    hushSay(K, 'h.down', 2.6, false); await K.wait(1.8);
    noaSay(K, 'n.down', 2.6); await K.wait(1.8);
  }
  // the vines, the gag, and the gray (the end of the top: you're absorbed into the Hush)
  function wrapVine(stA) {
    const g = new THREE.Group(), H = stA.kind === 'mimo' ? 0.95 : stA.kind === 'coach' ? 2.0 : 1.75, pts = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16, a = u * TAU2 * 2.4 + 0.6, r = (stA.kind === 'mimo' ? 0.42 : 0.5) - u * 0.12; pts.push(V(stA.x + Math.sin(a) * r, u * H, stA.z + Math.cos(a) * r)); }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.065, 6, false), mesh = new THREE.Mesh(geo, tmat('#6e6788'));
    g.add(mesh); const total = geo.index ? geo.index.count : geo.attributes.position.count; geo.setDrawRange(0, 0);
    return { g, grow: u => { const n = Math.floor(total * Math.min(1, u)); geo.setDrawRange(0, n - (n % 3)); } };
  }
  function gag(K) {
    return new Promise(res => {
      css();
      const old = document.getElementById('fb-gag'); if (old) old.remove();
      const el = document.createElement('div'); el.id = 'fb-gag';
      el.innerHTML = `<span class="lbl">${esc(mimoName())} ›</span><input autocomplete="off" spellcheck="false" placeholder="…"><svg viewBox="0 0 100 24" preserveAspectRatio="none"><path d="M-2,22 C10,2 18,26 30,9 S50,1 58,16 S80,24 102,4"/><path d="M-2,3 C14,20 26,0 40,13 S64,24 74,6 S92,1 102,19"/></svg><div class="cap"></div>`;
      document.body.appendChild(el);
      const inp = el.querySelector('input'), cap = el.querySelector('.cap'), paths = [...el.querySelectorAll('path')], A = K.A;
      cap.textContent = X().YOU.gag;
      let tries = 0, over = false;
      const sayMimo = n => { K.say(A.mimo, n === 1 ? '¡…!' : '…', { cls: 'mimo', dur: 1.6 }); snd('whimper'); try { Sound.hush = Math.min(1, 0.45 * n); } catch (e) { /* */ } };
      const said = () => { tries++; K.say(A.you, '…', { cls: 'you', dur: 1.4 }); inp.value = ''; if (tries === 1) { paths[0].classList.add('on'); sayMimo(1); } else if (tries === 2) { paths[1].classList.add('on'); sayMimo(2); el.classList.add('gray'); } else finish(); };
      inp.addEventListener('input', () => { const n = inp.value.length; inp.value = '…'.repeat(Math.min(8, Math.max(1, Math.ceil(n / 2)))); });
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'NumpadEnter') { e.preventDefault(); if (!over) said(); } }, true);
      function finish() {
        if (over) return; over = true;
        el.classList.add('small', 'gray'); inp.blur(); cap.textContent = '';
        try { Sound.hush = 1; } catch (e) { /* */ }
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => { el.remove(); res(tries); }, 650); }, api._.t.fastGag ? 50 : 2200);
      }
      setTimeout(() => { if (!over) inp.focus(); }, 60);
      setTimeout(() => { if (!over && tries < 1) said(); }, 6500);
      setTimeout(() => { if (!over && tries < 2) said(); }, 11000);
      setTimeout(() => finish(), 15500);
      if (api._.t.fastGag) setTimeout(() => finish(), 300);
    });
  }
  async function rage(K) {
    const { G: BG, A, ST } = K, f = FX.f;
    try { if (typeof FIN !== 'undefined') FIN.songOverride = 'fb_rage'; Sound.setSong('fb_rage'); } catch (e) { /* */ }
    ST.shot('focus', A.mimo, f, { up: 1.6, dist: 17 });
    K.setMood(f, 'go', 4);
    await K.tween(FX, { rage: 1 }, 1.1, 'io');
    hushSay(K, 'h.basta', 2.4); ST.shake(1.6, 1.2); snd('crack'); flash(0.8);
    tint('gray');
    { const vm = document.getElementById('fb-voice'); if (vm) { vm.style.transition = 'opacity .6s'; vm.style.opacity = '0'; } }     // (its voice is the first thing it takes)
    try { K.UI.rung(''); } catch (e) { /* */ }
    await K.wait(1.8);
    const vines = [A.coach, A.mimo, A.you].filter(a => a && !a.hidden).map(a => { const v = wrapVine(a); ST.prop(v.g); return v; });
    ST.shot('party');
    for (const v of vines) { snd('swoosh'); await K.along(0.8, u => v.grow(u)); }
    K.setMood(A.mimo, 'scared', 6); K.setMood(A.you, 'hurt', 6);
    try { K.UI.tip(X().YOU.vines); } catch (e) { /* */ }
    await gag(K);
    FX.voiceT = BG.t + 3;
    sayF(K, A.you, 'e.last', 3.4, 'foe small elio');
    await K.wait(2.6);
    await grayOn(1800);
    const S = st(); S.stage = 'realm'; S.phase = 4; save();
  }

  const PLUG = {
    setup(K) {
      const { G: BG, A, ST } = K, f = BG.foes.find(x => x.species === 'fb_vessel'); if (!f) { FX = null; return; }
      const S = st(), ph = Math.max(1, Math.min(4, S.phase || 1));
      css(); if (document.getElementById('fb-gray')) grayOff(700);
      FX = { f, phase: ph, turn: 0, wallUp: true, lockHp: f.hp, laughing: false, laughShield: false, rage: 0, voiceT: 0, gentle: (S.downs[ph] || 0) >= 2, told: {}, noaSt: null, taunt: 0,
        hopeless: ph === 1 && !S.turned, voice: Math.max(0, Math.min(1, +S.voice || 0)), voiceReady: false, voiceFire: false };
      f.isBoss = true; f.fbPose = { lift: 0, hit: 0, sweep: 0, gather: 0 }; f.fbSeam = S.turned ? 1 : 0;
      // (its bars and its goons grow with Mimo's power, so a strong Mimo's fight lasts as long as anyone's)
      BG.foes.forEach(g => { g.hp = g.maxHp = Math.round((g === f ? BAR[ph] : g.maxHp) * pw()); }); FX.lockHp = f.hp;
      f.hx = HOME.x; f.hz = HOME.z; f.x = f.hx; f.z = f.hz; f.baseYaw = f.yaw = Math.atan2(-2.5 - HOME.x, 0.6 - HOME.z);
      BG.tier = 3;
      if (FX.gentle) { BG.maxHearts += 2; BG.hearts = BG.maxHearts; try { K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); } catch (e) { /* */ } }
      if (FX.voice >= 1) FX.voiceReady = true;
      const na = (ARENA && ARENA.noaAt) || { x: 2.2, y: 4.6, z: -15.8 };
      FX.noaSt = { kind: 'noa', x: na.x, y: na.y, z: na.z, talk: 0, flash: 0 };
      if (A.coach) A.coach.hidden = !S.turned;
      if (ARENA) ARENA.setPhase(ph, !!S.turned);
      setRealm(K, REALM[ph], ph === 4 ? { noQueue: true, noGlimpse: true } : null);
      playBand(ph); tint(BAND[ph]);
      camOn(ST); voiceUI();
    },
    // (while its goons stand, nothing gets through, a perfect dodge's counter neither: its bar stays where it was)
    floor: f => (f && FX && f === FX.f ? Math.max(FX.phase >= 4 ? 2 : 1, FX.wallUp || FX.hopeless ? FX.lockHp || 0 : 0) : 0),
    async main(K) {
      const { G: BG, ST } = K; if (!FX) return 'flee';
      const f = FX.f, T = () => TAC();
      BG.winLine = null; f.hidden = false;
      BG.foes.forEach(g => { if (g !== f) g.hidden = true; });
      await K.intro({ foes: false });
      K.refreshLabels(); K.emit('boss', { foe: f });
      await phaseStart(K, st().phase > 1 || (st().downs[FX.phase] || 0) > 0);
      for (;;) {
        BG.turn++; FX.turn++; K.refreshLabels();
        if (FX.phase === 4) await furyHour(K);
        if (T() && T().turn) { try { await T().turn(); } catch (e) { console.error('[fb] tac turn', e); } }
        if (await checkPhase(K)) { if (FX.raged) return 'win'; continue; }
        wall(); K.refreshLabels(); voiceUI();
        if (FX.voiceReady) { try { K.UI.tip(X().you('voice', lang())); } catch (e) { /* */ } }
        const r = await K.askOrFlee('command');
        prePerform(r);
        if (FX.voiceFire && r && r.clauses && r.clauses.length) await voiceBlast(K);
        await K.perform(r);
        await afterPerform(K, r);
        await leadDown(K);
        if (await checkPhase(K)) { if (FX.raged) return 'win'; continue; }
        const h0 = BG.hearts;
        await foesTurn(K);
        if (h0 > BG.hearts) voiceAdd(K, 0.12 * (h0 - Math.max(0, BG.hearts)));
        if (BG.hearts <= 0) { await downBeat(K); return 'lose'; }
        await leadDown(K);
        if (T() && T().afterFoes) { try { await T().afterFoes(); } catch (e) { console.error('[fb] tac after', e); } }
        if (FX.hopeless && FX.turn >= 3) await turningPoint(K);
        if (FX.phase === 2 && FX.turn % 2 === 0) await masksSwap(K);
        ST.shot('wide');
      }
    },
    async end(K, outcome) {
      // (the meter and the tint go first: a flee's scene, or a fight cut short, never leaves them on screen)
      const keep = FX; FX = null; voiceUI(); untint();
      try { Sound.hush = 0; } catch (e) { /* */ }
      if (outcome === 'flee') { try { await K.fleeScene(); } catch (e) { /* */ } }
      else if (outcome === 'lose') await grayOn(700);
      camOff(K.ST);
      if (keep && keep.elioSt) keep.elioSt.hidden = true;
    },
  };
  // the goons are down: the Hush can be hit; at the bottom of its bar, the next phase (or, at the last, the rage)
  async function checkPhase(K) {
    const f = FX.f;
    if (goonsUp() || FX.hopeless) return false;
    if (!FX.openTold && FX.phase < 4) { FX.openTold = true; FX.wallUp = false; K.refreshLabels(); noaSay(K, 'n.open', 2.6); await K.wait(1.2); }
    if (f.hp > (FX.phase >= 4 ? 2 : 1)) return false;
    if (FX.phase < 4) { await toPhase(K, FX.phase + 1); return true; }
    await rage(K); FX.raged = true; return true;
  }

  // ------------------------------------------------------------ the top's flow (explore mode): the opening in the Clock Room, then the
  // fights (a knock-down starts its phase again with full hearts and a louder voice; fleeing leaves you by the clock, and «Face the
  // Hush» resumes), until you're absorbed
  let busy = false;
  const speaker = (id, name, x, y, z, top) => ({ id, name, x, y, z, top, talking: false });
  async function opening() {
    const G = GAME, sim = G.sim, room = OLDTOWER._.rooms[8]; if (!room) return;
    const R = room.R, F = room.fig, Y0 = 300, C = room.clock;
    sim.lock = 1;
    try {
      G.cam.override = { pos: V(R.x - 1.6, Y0 + 2.6, R.z + 6.4), look: V(R.x + 0.1, Y0 + 2.6, R.z - 5.6), dur: 1.0 };
      await STORY.wait(1.0);
      if (C) { C.beat = 2.2; C.glow = 0.35; }
      await FIN.say(speaker('fb-noa', FIN.nameOf('noa'), R.x, Y0 + 1.4, R.z - 6.0, 1.4), X().SCENE['n.careful']);
      if (C) { C.beat = 1; C.glow = 0; }
      if (F) {
        G.cam.override = { pos: V(R.x + 2.4, Y0 + 2.3, R.z + 1.4), look: V(F.root.position.x, Y0 + 1.6, F.root.position.z), dur: 0.9 };
        snd('tick'); await STORY.wait(0.6);
        await STORY.tween(1.3, k => { const e = k * k * (3 - 2 * k); F.root.rotation.y = lerp(Math.PI, 0.2, e); F.S.open = 1 - e; });
        F.S.eyes = 2.0; snd('tick');
        const fp = speaker('fb-hush', nameOf('vessel'), F.root.position.x, Y0, F.root.position.z, 2.0);
        await FIN.say(fp, X().FIGHT['h.open1']);
        await FIN.say(fp, X().FIGHT['h.open2']);
        FIN.think(X().YOU.top, 5);
        await FIN.say(Object.assign({}, fp, { name: FIN.nameOf('elio') }), X().FIGHT['e.1']);
        // the fog rises off him: the mist round his feet climbs and swells, the room shakes
        snd('crack');
        await STORY.tween(1.6, k => { (room.mist || []).forEach((m, i) => { m.sp.position.y = Y0 + 0.25 + k * (1.5 + (i % 3)); m.sp.scale.setScalar((1.6 + (i % 3) * 0.5) * (1 + k * 2.5)); m.sp.material.opacity = 0.3 + 0.3 * k; }); F.S.float = 0.08 + k * 0.7; F.S.eyes = 2 + k; });
        await FIN.say(fp, X().FIGHT['h.hoods']);
        try { sim.mimoSay('!!', 1.4); } catch (e) { /* */ } snd('chirp');
      }
    } finally { G.cam.override = null; sim.lock = 0; }
  }
  // the fights, phase after phase; true once you're absorbed (the realm comes next), false if you ran
  async function top() {
    const S = st(); if (S.stage === 'realm' || S.stage === 'done') return true;
    const room = OLDTOWER._.rooms[8];
    busy = true; S.fled = false;
    try {
      if (!S.opened) { await opening(); S.opened = true; save(); }
      for (;;) {
        try { if (typeof HEARTS !== 'undefined') HEARTS.full(); } catch (e) { /* */ }
        try { FIN.songOverride = S.phase >= 4 ? 'boss_fb_fury' : 'boss_fb_top'; FBM.state.top = BAND[S.phase] || 'today'; } catch (e) { /* */ }
        echoSpecies(true);
        let r = null;
        try { r = await GAME.fight({ boss: 'fb_vessel', foes: specsFor(S.phase || 1), place: { biome: 'fb_top', x: room ? room.R.x : 260, z: room ? room.R.z : -390 }, coach: { ally: true, name: 'Bruno' } }); }
        finally { echoSpecies(false); }
        if (S.stage === 'realm') return true;
        if (r && r.outcome === 'lose') { S.downs[S.phase] = (S.downs[S.phase] || 0) + 1; S.voice = Math.min(1, (+S.voice || 0) + 0.5); save(); continue; }
        S.fled = true; save(); await grayOff(300);
        try { FIN.songOverride = null; } catch (e) { /* */ }
        FIN.think('The Hush waits by the great clock… Catch your breath, then face it again.', 5);
        return false;
      }
    } finally { busy = false; }
  }
  // the Clock Room during the finale: «Face the Hush» after you ran; on later visits (the finale done) Elio is free, the clock empty
  const finTop = () => { const f = GAME && GAME.state && GAME.state.ch4 && GAME.state.ch4.fin; return !!(f && f.rose); };
  const finDone = () => { const f = GAME && GAME.state && GAME.state.ch4 && GAME.state.ch4.fin; return !!(f && f.top); };
  function init(game) {
    GAME = game; css();
    if (typeof OLDBOSS !== 'undefined' && !OLDBOSS._fb) {
      OLDBOSS._fb = true;
      const busy0 = OLDBOSS.busy; OLDBOSS.busy = () => !!(busy || (busy0 && busy0()) || (typeof FBREALM !== 'undefined' && FBREALM.busy && FBREALM.busy()));
      const ti0 = OLDBOSS.topInteractables;
      OLDBOSS.topInteractables = (G, room) => {
        if (!finTop()) return ti0(G, room);
        const S = st();
        if (busy || finDone() || S.stage !== 'top' || !S.fled || !room.fig) return [];
        return [{ x: room.fig.root.position.x, z: room.fig.root.position.z + 1.8, y: 300, r: 2.8, label: 'Face the Hush', run: () => (typeof FBREALM !== 'undefined' ? FBREALM.resume() : top()) }];
      };
      const tt0 = OLDBOSS.topTarget;
      OLDBOSS.topTarget = (G, room) => (finTop() ? (!finDone() && room.fig && room.fig.root.visible ? { x: room.fig.root.position.x, z: room.fig.root.position.z + 1.6, hint: '{mimo} growls at the Hush by the great clock.' } : null) : tt0(G, room));
      const up0 = OLDBOSS.updateTop;
      OLDBOSS.updateTop = (room, dt, t) => {
        up0(room, dt, t);
        if (finDone() && !(typeof FIN !== 'undefined' && FIN.clockOn)) { if (room.fig) room.fig.root.visible = false; (room.mist || []).forEach(m => { m.sp.visible = false; }); if (room.clock && room.clock.noa) { room.clock.noa.g.visible = false; room.clock.glass.material.opacity = 0; room.clock.nglow.material.opacity = 0; } }
      };
    }
  }
  if (typeof STORY !== 'undefined' && STORY.init && !STORY.init._fb) {
    const i0 = STORY.init;
    STORY.init = function (game) { const v = i0.apply(this, arguments); try { init(game); } catch (e) { console.error('[fb] init', e); } return v; };
    STORY.init._fb = true;
  }

  const api = {
    init, top, st, specsFor, BAR, GROW,
    get busy() { return busy; }, get FX() { return FX; }, get ARENA() { return ARENA; },
    _: { echoSpecies, grayOn, grayOff, flash, voiceUI, tint, untint, css, hourCard, maskModel, poseMask, vineMesh, glow, tmat, fogTex,
      t: {
        fastGag: false,
        // straight into a phase's fight (o.turned: past the hopeless opening; o.voice: the meter)
        async fight(ph = 1, o = {}) {
          const S = st(); S.phase = ph; S.stage = 'top'; if (o.turned !== undefined) S.turned = !!o.turned; if (o.voice !== undefined) S.voice = o.voice;
          echoSpecies(true);
          try { return await GAME.fight({ boss: 'fb_vessel', foes: specsFor(ph), place: { biome: 'fb_top', x: 260, z: -390 }, coach: { ally: true, name: 'Bruno' } }); }
          finally { echoSpecies(false); }
        },
        // the tests' autopilot (window.__g.go steps the game): every command answered (in a time realm, its model sentence; o.cmd(api)
        // for your own), every dodge perfect; until o.until(api) or sec seconds of real time. toCmd: on to the next command prompt
        async drive(sec = 30, o = {}) {
          const B = BT._.api, t0 = performance.now(), sent = [], G = B.G;
          const plain = s => (isC(G.lang) && typeof CJK !== 'undefined' ? CJK.plain(String(s), { lang: G.lang }) : String(s));
          while (performance.now() - t0 < sec * 1000) {
            if (!G.running && !document.body.classList.contains('in-battle')) return { done: true, sent };
            if (G.running && !G.auto) G.auto = { timing: 'perfect', dodge: o.dodge || 'perfect', dialog: true };
            const pd = G.pending;
            if (pd && pd.kind === 'command') {
              let t; const realm = _.tense && _.tense.realm();
              try { if (o.cmd) t = o.cmd(B); else if (realm) { const f = B.targetable().find(x => x.species !== 'fb_vessel' && x.species !== 'fb_core') || B.targetable()[0]; t = _.tense.modelFor(f, 'hit', realm === 'past' ? 'pret' : 'fut'); } else t = B.autoCommand(); } catch (e) { t = B.autoCommand(); }
              t = plain(t); sent.push(t); B.submit(t);
            } else if (pd && pd.kind === 'teach') B.submit(LEX.form(pd.id));
            else if (pd && pd.kind === 'echo') B.submit(pd.answer || '');
            if (o.until && o.until(B)) return { until: true, sent };
            await window.__g.go(0.25);
          }
          return { done: false, sent: sent.slice(-6), foes: G.foes.map(f => [f.species, f.hp, f.alive]), hearts: G.hearts, turn: G.turn };
        },
        async toCmd(sec = 25) {
          const G = BT._.api.G, t0 = performance.now();
          while (performance.now() - t0 < sec * 1000) {
            if (!G.running) { await new Promise(r => setTimeout(r, 150)); continue; }     // (the fight hasn't started yet: the wipe into it runs in real time)
            await window.__g.go(0.5); if (G.pending && G.pending.kind === 'command') return true;
          }
          return false;
        },
      } },
  };
  try { hook(); } catch (e) { console.error('[fb] battle hooks', e); }
  return api;
})();
