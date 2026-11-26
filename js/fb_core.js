'use strict';
// The final battle, part 3 (FB1; DESIGN.md 21.11): the heart of the Hush («el corazón del Silencio»), a plug-in boss on battle/flow.js
// (BATTLE._.plugins.fb_core) in its own arena (_.arenaBuilders.fb_core: its paper island in the gray, eighteen dark lanterns round
// the edge, one for each of his words). A great ball of fog plates with a small warm light inside: his voice. Just you and {mimo}.
// The same arc as the top:
//   A  overwhelming     its plates turn your hits aside (×0.1) and its vines lash in threes; after two turns Elio's voice finds you
//                       from inside the light («¿Viniste hasta aquí dentro… por mí?» «¡Estoy aquí!…»): the music's heroes come in, and
//                       the hits land
//   B  it takes words   after your command it pulls your verb into itself and heals; Elio catches it inside and throws it back
//                       («¡No! ¡Esa palabra es tuya! ¡Toma!»): that verb hits ×2 from then on (ELIO'S WORD)
//   C  the duo finisher at the bottom of its last bar: «Esta vez… hablo yo también. Empieza tú… y yo termino.» You start a chain
//                       (moves joined with «y»: ×1, ×1.5, ×2 as always), and his voice finishes it: «…¡porque toda voz cuenta!» (DUO
//                       ×2.5). It cracks («Las palabras… duelen…» / «A veces duelen. Pero el silencio duele más.») while the music
//                       runs its ending (one last run of the motif, a roll, three hits on D), and it shatters on the last hit
//                       (FBM._.core.hitAt[2] on Sound.ctx's clock); white, silence, and fb_realm.js's aftermath.
// Knock-downs as at the top: no game over; its phase starts again with full hearts, gentler after two (+2 hearts, Elio whispers
// where every blow will come). State: G.state.fb.core = { phase 'A' | 'B' | 'C', elio, won, downs: { A, B } }.
//   FBCORE.fight() → 'win' | 'flee' · FBCORE.busy · tests: FBCORE._.t.fight(phase)
const FBCORE = (() => {
  const BT = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = BT && BT._;
  if (!_ || typeof FBTXT === 'undefined' || typeof FBBOSS === 'undefined') return null;
  let GAME = null, busy = false, FX = null;
  const X = () => FBTXT;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const TAU2 = Math.PI * 2;
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
  const flash = k => FBBOSS._.flash(k);
  const XF = () => _.flow, TAC = () => _.tac;
  const pw = () => Math.max(1, +((XF() && XF().G.power) || 1));
  const BAR = { A: 14, B: 16 }, GIANT = 2.3, HOME = { x: 5.4, z: -6.2 };
  function st() {
    const S = FBBOSS.st();
    if (!S.core) S.core = { phase: 'A', downs: {} };
    if (!S.core.downs) S.core.downs = {};
    return S.core;
  }
  const save = () => { try { if (GAME && GAME.save) GAME.save(); } catch (e) { /* */ } };

  // ------------------------------------------------------------ the heart: fog plates on a ball (they spread as it cracks), the warm
  // light inside (his voice: it never flashes), two long vines that lash, smaller ones holding it down
  const tmat = (c, o = {}) => new THREE.MeshToonMaterial(Object.assign({ color: new THREE.Color(c), gradientMap: TK.grad }, o));
  const glow = (color, s, o = 0.5) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); sp.userData.noFlash = true; return sp; };
  function lashVine(len, col) {
    const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push(V(Math.sin(u * 5) * 0.12 * u, u * len, Math.cos(u * 4) * 0.1 * u)); }
    const g = new THREE.Group(), curve = new THREE.CatmullRomCurve3(pts);
    g.add(TK.part(new THREE.TubeGeometry(curve, 24, 0.13, 6, false), null, null, null, { mat: tmat(col), ink: 0.014 }));
    for (let i = 1; i <= 5; i++) { const p = curve.getPointAt(i / 6); g.add(TK.part(new THREE.ConeGeometry(0.1, 0.36, 5), null, [p.x + 0.12, p.y, p.z], null, { mat: tmat('#5e5878'), ink: 0.006, rot: [0, 0, -1.2 + (i % 2) * 2.4] })); }
    return g;
  }
  function coreModel() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const pm = tmat('#77708f'), plates = [];
    for (let j = 0; j < 30; j++) {
      const y = 1 - (j + 0.5) / 30 * 2, rr = Math.sqrt(1 - y * y), a = j * 2.399963, dir = V(Math.cos(a) * rr, y, Math.sin(a) * rr);
      const p = TK.part(TK.G.sphere, null, null, [0.55, 0.55, 0.17], { mat: pm, ink: 0.016 });
      p.position.copy(dir).multiplyScalar(1.3).add(V(0, 1.75, 0)); p.lookAt(V(0, 1.75, 0)); body.add(p);
      plates.push({ p, dir, ph: j * 0.7 });
    }
    // the light inside: his voice (a small warm sphere and its glow; never flashes)
    const heart = new THREE.Mesh(TK.G.sphere, new THREE.MeshBasicMaterial({ color: '#ffe2a8' })); heart.scale.setScalar(0.32); heart.position.y = 1.75; heart.userData.noFlash = true; body.add(heart);
    const hg = glow('#ffcf86', 2.6, 0.6); hg.position.y = 1.75; hg.material.depthTest = false; body.add(hg);      // (its light leaks through the plates)
    // the two lashing vines hang off the root (they don't turn with the plates): at rest they droop out to the sides
    const lashes = [-1, 1].map(s => { const v = lashVine(3.6, '#6e6788'); v.position.set(s * 1.1, 1.0, 0.5); root.add(v); v.userData.s = s; return v; });
    const roots = [];
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU2 + 0.4; const v = FBBOSS._.vineMesh([[Math.cos(a) * 2.0, -0.6, Math.sin(a) * 2.0], [Math.cos(a + 0.3) * 1.6, 0.3, Math.sin(a + 0.3) * 1.6], [Math.cos(a + 0.5) * 1.3, 1.0, Math.sin(a + 0.5) * 1.3]], 0.08, '#6e6788', 3); body.add(v); roots.push(v); }
    const puffs = [];
    for (let i = 0; i < 10; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: FBBOSS._.fogTex(), transparent: true, opacity: 0.4, depthWrite: false })); sp.userData.noFlash = true; sp.scale.setScalar(0.9 + (i % 3) * 0.3); root.add(sp); puffs.push({ sp, a: i / 10 * TAU2, y: 0.6 + (i % 4) * 0.7, ph: i }); }
    const anchors = {};
    [['top', [0, 3.3, 0.9]], ['mid', [0, 1.75, 1.35]], ['head', [0, 2.6, 1.1]], ['face', [0, 1.9, 1.4]], ['feet', [0, 0.1, 1.0]]].forEach(([n, p]) => { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); anchors[n] = o; });
    return { root, body, plates, heart, hg, lashes, roots, puffs, anchors, kind: 'fb_core', scale: 1, radius: 1.6, height: 3.4, parts: [], labelH: 3.8, hover: 0.4, L: {} };
  }
  const _d = new THREE.Vector3(), _e = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
  function poseCore(h, F, t, dt) {
    const fx = FX && FX.f === F ? FX : null, P = F.fbPose || {}, crack = fx ? fx.crack || 0 : 0, light = fx ? fx.light || 0 : 0, beat = 1 + Math.sin(t * (1.6 + crack * 4)) * (0.03 + crack * 0.04);
    h.body.position.y = Math.sin(t * 1.1) * 0.08; h.body.rotation.y += (dt || 0.016) * (0.12 + crack * 0.4);
    h.plates.forEach(o => { const out = 1.3 + crack * 0.55 + Math.sin(t * 2 + o.ph) * 0.03 + (P.gather || 0) * -0.12; o.p.position.copy(o.dir).multiplyScalar(out * beat).add(V(0, 1.75, 0)); o.p.scale.set(0.62 * (F.sx || 1), 0.62 * (F.sy || 1), 0.17); });
    h.heart.scale.setScalar(0.3 + light * 0.12 + crack * 0.25); h.hg.material.opacity = Math.min(0.8, 0.3 + light * 0.12 + crack * 0.35 + Math.sin(t * 3) * 0.04); h.hg.scale.setScalar(2.0 + light * 0.6 + crack * 2.6);
    h.lashes.forEach((v, i) => {
      const s = v.userData.s, hi = i === 0 ? P.lashHi || 0 : 0, lo = i === 1 ? P.lashLo || 0 : 0, k = Math.max(hi, lo), sw = Math.sin(t * 1.1 + i * 2) * 0.12;
      _d.set(s * 0.9 + sw, -0.55 + Math.sin(t * 0.8 + i) * 0.1, 0.25);
      if (k > 0) _e.set(s * 0.22, hi ? 0.06 : -0.34, 1).normalize(), _d.normalize().lerp(_e, k);
      v.quaternion.setFromUnitVectors(_up, _d.normalize()); v.scale.setScalar(1 + k * 0.85);
    });
    h.puffs.forEach(p => { const a = p.a + t * 0.3; p.sp.position.set(Math.sin(a) * 2.2, p.y + Math.sin(t * 0.8 + p.ph) * 0.2, Math.cos(a) * 1.6); p.sp.material.opacity = 0.35 * (1 - crack * 0.6); });
  }

  // ------------------------------------------------------------ the battle's hooks
  function species(on) {
    const T = X().SPECIES.fb_core || {};
    for (const [lg, sp] of Object.entries(T)) { const Lg = _.LANGS && _.LANGS[lg]; if (!Lg || !Lg.species) continue; if (on) Lg.species.fb_core = Object.assign({}, sp); else delete Lg.species.fb_core; delete Lg.I; delete Lg.CJ; }
  }
  function hook() {
    try { if (typeof BOSS_MUSIC !== 'undefined' && BOSS_MUSIC.SONG && !BOSS_MUSIC.SONG.fb_core) BOSS_MUSIC.SONG.fb_core = 'boss_fb_core'; } catch (e) { /* */ }
    const M = _.M;
    if (M && !M.fbcHooked) {
      M.fbcHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (String(k || '') === 'fb_core' ? 'fb_core' : k0(k));
      M.build = o => (o && o.kind === 'fb_core' ? coreModel() : b0(o));
      M.pose = (h, F, t, dt) => (h && h.kind === 'fb_core' ? poseCore(h, F, t, dt) : p0(h, F, t, dt));
      M.brighten = (h, k) => (h && h.kind === 'fb_core' ? undefined : br0(h, k));
    }
    const U = _.UI;
    if (U && U.label && !U.fbcHooked) { U.fbcHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && f.species === 'fb_core' ? coreLabel(f) : html); }; }
    if (_.UI && _.UI.ICON && !_.UI.ICON.fb_core) _.UI.ICON.fb_core = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#77708f" stroke="#2b2235" stroke-width="3"/><path d="M14 26 L50 38 M18 44 L46 20" stroke="#5e5878" stroke-width="4"/><circle cx="32" cy="32" r="7" fill="#ffe2a8" stroke="#2b2235" stroke-width="2"/></svg>';
    try { if (typeof BFX !== 'undefined' && BFX.VOICES && !BFX.VOICES.fb_core) BFX.VOICES.fb_core = { m: 34, vow: ['o', 'u', 'o'], len: 0.24, gap: 0.09 }; } catch (e) { /* */ }
    _.plugins = _.plugins || {}; _.plugins.fb_core = PLUG;
    _.arenaBuilders = _.arenaBuilders || {}; if (!_.arenaBuilders.fb_core) _.arenaBuilders.fb_core = K => buildArena(K);
  }
  function coreLabel(f) {
    const l = lang(), N = nameOf('core', l), name = isC(l) && typeof CJK !== 'undefined' ? CJK.html(N, { lang: l }) : esc(N);
    const ph = FX ? FX.phase : 'A', left = ph === 'A' ? 2 : ph === 'B' ? 1 : 0, pct = Math.round(100 * f.hp / Math.max(1, f.maxHp));
    const stack = `<span class="fb-stack">${[0, 1, 2].map(i => `<i class="${i < left ? 'on' : i === left ? 'cur' : ''}"></i>`).join('')}</span>`;
    const gift = FX && FX.gift ? ` <span class="bt-chip">✦ ${esc(FX.giftWord || '')} ×2</span>` : '';
    return `<div class="bt-chips"><span class="bt-chip name">${name}</span>${stack}${gift}</div><div class="bt-hpbar"><i style="width:${pct}%"></i><span>${f.hp}</span></div>`;
  }

  // ------------------------------------------------------------ the arena: its island in the gray (stage.js _.arenaBuilders.fb_core)
  let ARENA = null;
  function buildArena(K) {
    const { merge, M4 } = TK, Gx = TK.G;
    const P = { fog: '#2c2838', hemiSky: '#a49cc8', hemiGround: '#3a3046', sun: '#e0d8f4', hemiI: 0.5, sunI: 0.52 };
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(P.fog, 22, 80); scene.background = new THREE.Color(P.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) } };
    const hemi = new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI); scene.add(hemi);
    const sun = new THREE.DirectionalLight(P.sun, P.sunI); sun.position.set(-8, 16, 9); sun.target.position.set(1, 0, -2);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    const warm = new THREE.PointLight('#ffcf86', 0.5, 18, 1.8); warm.position.set(HOME.x, 4.4, HOME.z); scene.add(warm);
    // the sky: the void's gray-violet, darker below
    const skyTex = TK.canvasTex(8, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#15131d'); g.addColorStop(0.45, '#3b3648'); g.addColorStop(0.56, '#4a4458'); g.addColorStop(1, '#0f0e15'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(90, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })));
    // the island: a torn paper disc and its layers under it
    const disc = (r, h, seed, n = 48) => { const g = new THREE.CylinderGeometry(r, r * 0.92, h, n, 1), p = g.attributes.position, Rr = rng(seed), jag = Array.from({ length: n + 1 }, () => 1 + (Rr() - 0.5) * 0.07); for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z); if (d < 1e-3) continue; let a = Math.atan2(z, x); if (a < 0) a += TAU2; const k = jag[Math.round(a / TAU2 * n) % n]; p.setX(i, x * k); p.setZ(i, z * k); } g.computeVertexNormals(); return g; };
    const pcs = [{ geo: disc(13, 0.5, 71), m: M4(1, -0.25, -2, 1), color: '#aaa2b8' }, { geo: disc(10, 0.5, 72, 30), m: M4(1, -0.85, -2, 1), color: '#8f8799' }, { geo: disc(6.5, 0.5, 73, 24), m: M4(1, -1.5, -2, 1), color: '#787081' }];
    const Rr = rng(9091);
    for (let k = 0; k < 22; k++) { const x = -8 + Rr() * 18, z = -10 + Rr() * 14; if (Math.hypot(x - 1, z + 2) > 11.5 || (Math.abs(x - 1) < 6 && Math.abs(z) < 3)) continue; pcs.push({ geo: Gx.box, m: M4(x, 0.012, z, 0.4, 0.01, 0.52, Rr() * 3), color: '#e6e0ea' }); }
    const floor = new THREE.Mesh(merge(pcs), TK.toon('#ffffff', { vc: 1, rim: 0.12 })); floor.receiveShadow = true; scene.add(floor);
    // eighteen dark paper lanterns round the edge, one for each of his words (they light when the heart breaks)
    const lan = [];
    for (let k = 0; k < 18; k++) {
      const a = Math.PI * 0.62 + k / 17 * Math.PI * 1.76, x = 1 + Math.cos(a) * 11.6, z = -2 - Math.sin(a) * 9.4; if (z > 4.5) continue;
      const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
      g.add(TK.part(Gx.cyl, '#5c4f62', [0, 0.9, 0], [0.05, 1.8, 0.05], { ink: 0.006 }));
      const m = tmat('#7a748a'); g.add(TK.part(Gx.sphere, null, [0, 2.0, 0], [0.26, 0.32, 0.26], { mat: m, ink: 0.01 }));
      const gl = glow('#ffd08a', 1.4, 0); gl.position.y = 2.0; g.add(gl);
      lan.push({ g, m, gl, on: 0, k: 0, ph: k });
    }
    // paper scraps drifting
    const NS = 60, scraps = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshToonMaterial({ color: '#d0cad8', gradientMap: TK.grad, side: THREE.DoubleSide }), NS), sd = [];
    for (let i = 0; i < NS; i++) sd.push({ x: -22 + Rr() * 44, y: -8 + Rr() * 22, z: -30 + Rr() * 34, s: 0.6 + Rr(), v: 0.2 + Rr() * 0.4, w: (Rr() - 0.5) * 0.8, r: Rr() * 6 });
    scene.add(scraps);
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    function update(t, dt, stainC) {
      uni.uTime.value = t;
      sd.forEach((s, i) => { s.y -= s.v * dt; if (s.y < -10) s.y = 14; e.set(s.r + t * s.w, s.r * 0.5 + t * 0.3 * s.w, 0); q.setFromEuler(e); pv.set(s.x + Math.sin(t * 0.3 + i) * 0.6, s.y, s.z); sv.setScalar(s.s); mtx.compose(pv, q, sv); scraps.setMatrixAt(i, mtx); });
      scraps.instanceMatrix.needsUpdate = true;
      lan.forEach(L => { L.k = damp(L.k, L.on, 2.5, dt); L.gl.material.opacity = L.k * (0.6 + 0.1 * Math.sin(t * 4 + L.ph)); L.m.color.set(L.k > 0.5 ? '#f5dca8' : '#7a748a'); L.m.emissive = L.m.emissive || new THREE.Color(); L.m.emissive.setRGB(0.5 * L.k, 0.32 * L.k, 0.1 * L.k); });
      warm.intensity = 0.4 + 0.12 * Math.sin(t * 1.6) + (FX ? (FX.light || 0) * 0.4 + (FX.crack || 0) * 1.2 : 0);
    }
    ARENA = { scene, sun, uni, update, P, lan };
    return ARENA;
  }

  // ------------------------------------------------------------ the fight
  const sayF = (K, who, key, dur, cls, tab = 'FIGHT') => { const [t, en] = line(key, tab); K.say(who, t, { cls, en, dur }); return t; };
  const hushSay = (K, key, dur = 3.0) => sayF(K, FX.f, key, dur, 'foe shout boss hush');
  // Elio's voice from the light inside: whole in the language (EN on request), at the heart's middle, under its label
  function elioAt(K) {
    const p = K.ST.worldOf(FX.f, 'mid'); FX.elioSt = FX.elioSt || { kind: 'elio', x: 0, y: 0, z: 0, hidden: false, talk: 0 };
    return Object.assign(FX.elioSt, { x: p.x, y: p.y - 0.9, z: p.z + 0.4 });
  }
  const elioSay = (K, key, dur = 3.0, tab = 'FIGHT') => sayF(K, elioAt(K), key, dur, 'foe elio', tab);
  let shot0 = null;
  function camOn(ST) {
    if (shot0) return; shot0 = ST.shot;
    ST.shot = (name, a, b, o = {}) => {
      const f = FX && FX.f, fov = k => { try { ST.S.cam.goal.fov = k; } catch (e) { /* */ } };
      if (!f) return shot0(name, a, b, o);
      if (name === 'wide') { shot0('focus', { x: 0.8, z: -1.8 }, null, { up: 2.4, dist: 19, pitch: 0.14, yaw: -0.16, k: o.k }); fov(44); return; }
      if ((name === 'focus' || name === 'action') && (a === f || b === f)) { shot0(name, a, b, Object.assign({}, o, { up: (o.up || 0) + 1.4, dist: Math.max(o.dist || 0, 14) })); fov(40); return; }
      return shot0(name, a, b, o);
    };
  }
  function camOff(ST) { if (shot0) { ST.shot = shot0; shot0 = null; } }
  // its blows: a taunt, its fog gathering, then n lashes in a row (high: duck; low: jump), each dodged out loud
  async function coreAttack(K, n = 1, dmg = 1) {
    const { G: BG, A, ST } = K, f = FX.f, P = f.fbPose;
    if (!f.alive || BG.hearts <= 0) return;
    const tgt = Math.random() < 0.5 ? A.mimo : A.you;
    ST.shot('focus', A.mimo, f, { up: 1.2, dist: 14 });
    sayF(K, f, ['h.t1', 'h.t2', 'h.t3', 'h.t4', 'h.t5', 'h.t6'][FX.taunt++ % 6], 2.2, 'foe hush');
    await K.tween(P, { gather: 1 }, 0.9, 'io');
    const seq = []; for (let i = 0; i < n; i++) seq.push(i === 0 ? Math.random() < 0.5 : !seq[i - 1]);
    const dw = BG.L && BG.L.dodgeWords ? BG.L.dodgeWords(BG.tier) : null, wd = h => (dw && (h ? dw.high : dw.low)) || (h ? '↑' : '↓');
    const [cry, cryEn] = line(seq[0] ? 'h.shut' : 'h.shh'), where = seq.map(wd).join(' … '), whereP = plainT(where), cryP = plainT(cry), enW = seq.map(h => (h ? 'up high' : 'down low')).join(', then ');
    if (FX.elio && (FX.gentle || FX.phase !== 'A')) { K.say(elioAt(K), line('e.where')[0].replace('{where}', where), { cls: 'foe small elio', en: enW, dur: 2.4 }); await K.wait(0.9); }
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.8 });
    K.say(f, `${cry} ${where}`, { cls: 'foe shout boss hush', en: `${cryEn} (${enW})`, dur: K.readTime(cryP + whereP) + 1.6 + n * 0.8 });
    K.emit('shout', { text: cryP, high: seq[0], foe: f, boss: true }); K.dodgeHint(true);
    await K.wait(K.readTime(cryP + whereP) + 0.25);
    for (let i = 0; i < n; i++) {
      const high = seq[i];
      K.emit('windup', { foe: f, high, boss: true });
      await K.tween(P, high ? { lashHi: 0.35 } : { lashLo: 0.35 }, 0.2, 'out');
      const tp = K.timingWindow(BG.t + 0.65, high ? 'ArrowDown' : 'ArrowUp', () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
      await K.tween(P, high ? { lashHi: 1 } : { lashLo: 1 }, 0.45, 'in');
      const grade = await tp;
      const ok = K.dodgeResult(f, tgt, grade, dmg, { puff: [tgt.x + 0.4, high ? 1.2 : 0.1, tgt.z, '#b9aee6'] });
      if (!ok) { flash(0.75); BG.hitstop = 0.16; ST.shake(1.3, 1.0); snd('crunch'); } else { flash(0.22); ST.shake(0.6, 0.4); snd('swoosh'); }
      await K.tween(P, { lashHi: 0, lashLo: 0 }, 0.25, 'io');
      if (BG.hearts <= 0) break;
      if (i < n - 1) await K.wait(0.15);
    }
    await K.tween(P, { gather: 0 }, 0.3);
  }
  function prePerform(r) {
    if (!r || !r.clauses) return;
    for (const c of r.clauses) {
      if (!c.target) continue;
      if (FX.hopeless) { c.tacMult = (c.tacMult || 1) * 0.1; c.tacSub = 'IT TURNS ASIDE'; continue; }
      if (FX.gift && (c.verb === FX.gift || c.baseVerb === FX.gift)) { c.tacMult = (c.tacMult || 1) * 2; c.tacSub = 'ELIO’S WORD ×2'; }
    }
  }
  // Elio's voice finds you (A's third turn)
  async function elioJoins(K) {
    const { ST, A } = K, f = FX.f, S = st();
    FX.hopeless = false; FX.elio = true; S.elio = true; save();
    ST.shot('focus', A.mimo, f, { up: 1.0, dist: 13 });
    await K.tween(FX, { light: 1 }, 0.9, 'out'); flash(0.35); snd('chime');
    elioSay(K, 'e.near', 3.2, 'SCENE'); await K.wait(2.8);
    elioSay(K, 'e.here', 3.2); await K.wait(1.2);
    try { FBM.state.elio = true; } catch (e) { /* */ }
    await K.wait(1.8);
    try { K.UI.tip('Elio’s voice is with you: the hits get through now!'); } catch (e) { /* */ }
    ST.shot('wide');
  }
  // B: it pulls your verb into itself and heals; Elio catches it inside and throws it back (×2 from then on)
  async function steal(K, r) {
    const c = r && r.clauses && r.clauses.find(k => k.verb); if (!c) return;
    const { G: BG, A, ST, UI } = K, f = FX.f, verb = c.baseVerb || c.verb, word = plainT(K.showWord('v.' + verb));
    ST.shot('focus', A.mimo, f, { up: 1.0, dist: 13 });
    hushSay(K, 'c.steal', 2.6);
    UI.pop(ST.worldOf(A.mimo, 'top'), word, BG.t, { color: '#b9aee6', size: 30, sub: 'TAKEN' }); snd('swoosh');
    await K.tween(FX, { light: 0.3 }, 0.6);
    const heal = Math.round(3 * pw()); f.hp = Math.min(f.maxHp, f.hp + heal); K.refreshLabels();
    UI.pop(ST.worldOf(f, 'top'), `+${heal}`, BG.t, { color: '#9fe0b0', size: 30 });
    await K.wait(1.4);
    await K.tween(FX, { light: 1.2 }, 0.4, 'out'); flash(0.3); snd('chime');
    elioSay(K, 'e.catch', 2.8); await K.wait(1.4);
    UI.pop(ST.worldOf(A.mimo, 'top'), word, BG.t, { color: '#ffd34d', size: 36, sub: 'ELIO’S WORD ×2' });
    FX.gift = verb; FX.giftWord = word; K.refreshLabels();
    try { UI.tip(`Elio threw your word back: «${esc(word)}» hits ×2 now.`); } catch (e) { /* */ }
    await K.wait(1.2);
    ST.shot('wide');
  }
  async function toB(K) {
    const { ST } = K, f = FX.f, S = st();
    FX.phase = 'B'; FX.turnB = 0; S.phase = 'B'; save();
    f.hp = f.maxHp = Math.round(BAR.B * pw()); K.refreshLabels();
    ST.shot('focus', K.A.mimo, f, { up: 1.2, dist: 14 });
    hushSay(K, 'c.hurt', 2.4); ST.shake(1.0, 0.8); snd('crack'); flash(0.5);
    await K.tween(FX, { crack: 0.3 }, 0.8, 'out');
    await K.wait(1.6);
    ST.shot('wide');
  }
  // the music's clock: true once the ending's k-th hit has sounded (no music running: after a fixed while)
  function hitDone(k) { try { const h = FBM._.core.hitAt, ac = Sound.ctx && Sound.ctx.currentTime; return !!(h && h[k] && ac && ac >= h[k] - 0.01); } catch (e) { return false; } }
  // C: the duo finisher, then the ending (it cracks while the music runs its ending; it shatters on the last hit)
  async function finisher(K) {
    const { G: BG, A, ST, UI } = K, f = FX.f, S = st();
    FX.phase = 'C'; S.phase = 'C'; save(); K.refreshLabels();
    try { Object.assign(FBM.state, { elio: true, fin: true, end: false }); FBM._.core.hitAt = []; } catch (e) { /* */ }
    ST.shot('focus', A.mimo, f, { up: 1.0, dist: 13 });
    await K.tween(FX, { light: 1.6 }, 0.8, 'out');
    elioSay(K, 'e.join', 4.6); await K.wait(4.7);      // (the tip waits for his bubble to fade)
    try { UI.tip(X().you('duo', lang())); } catch (e) { /* */ }
    try { UI.rung(`The duo finisher: <b>a long chain, moves joined with ${X().JOIN[lang()] || '«y»'}</b>… and Elio finishes it.`); } catch (e) { /* */ }
    ST.shot('wide');
    const r = await K.askOrFlee('command');
    prePerform(r);
    if (r && r.clauses) r.clauses.forEach(c => { c.tacSub = c.tacSub || 'DUO'; });
    await K.perform(r);
    // his voice finishes it
    ST.shot('focus', A.mimo, f, { up: 1.0, dist: 12 });
    await K.tween(FX, { light: 2.2 }, 0.5, 'out'); flash(0.6);
    const fin = elioSay(K, 'e.finish', 3.4);
    try { FBM.state.end = true; } catch (e) { /* */ }
    for (const s0 of [A.you, A.mimo]) { ST.ring(s0, '#ffd34d', 3.4); ST.S.fx.sparkle(s0.x, 1.2, s0.z, 18, ['#ffd34d', '#fff3a0', '#ffffff']); }
    ST.shake(1.2, 0.9); snd('chest'); K.emit('crit');
    UI.pop(ST.worldOf(f, 'top'), 'DUO ×2.5', BG.t, { color: '#ffd34d', size: 44, sub: plainT(fin) });
    f.flash = 0.3; f.hp = 1; K.refreshLabels();
    await K.wait(2.6);
    // it cracks: the words hurt, the silence hurts more
    await K.tween(FX, { crack: 0.55 }, 1.0, 'out'); snd('crack');
    hushSay(K, 'c.break', 3.2); await K.wait(3.2);
    elioSay(K, 'e.answer', 3.6); await K.wait(3.4);
    ST.shot('focus', A.mimo, f, { up: 1.4, dist: 15 });
    // the ending: wait for the music's three hits (each cracks it further; the last breaks it); with no music, a fixed while
    const t0 = BG.t, LIM = 22, crackTo = [0.75, 0.9];
    let seen = 0;
    for (;;) {
      const tl = BG.t - t0, noMusic = !(typeof Sound !== 'undefined' && Sound.ctx && Sound.ctx.state === 'running');
      const k = seen;
      if (k < 2 && (hitDone(k) || (noMusic && tl > 3 + k * 0.7) || tl > LIM + k * 0.7)) { seen++; flash(0.5); ST.shake(1.2, 0.9); K.tween(FX, { crack: crackTo[k] }, 0.25, 'out'); continue; }
      if (k === 2 && (hitDone(2) || (noMusic && tl > 4.4) || tl > LIM + 1.4)) break;
      if (FX.crack < 0.7 && tl > 1) FX.crack = Math.min(0.7, FX.crack + 0.0015);
      await K.wait(0.02);
    }
    // the last hit: it shatters; white; silence
    flash(1); snd('crack'); ST.shake(1.6, 1.2);
    FX.crack = 1; f.hp = 0; f.alive = false; f.hidden = true; K.UI.labelRemove(f);
    for (let i = 0; i < 4; i++) ST.S.fx.sparkle(f.x + (i - 1.5) * 0.8, 2.6 + (i % 2), f.z, 18, ['#ffd98a', '#ffffff', '#fff3c8']);
    if (ARENA) ARENA.lan.forEach((L, i) => setTimeout(() => { L.on = 1; }, 120 + i * 60));
    S.won = true; save();
    try { if (typeof FBREALM !== 'undefined' && FBREALM) await FBREALM.whiteOn(500); } catch (e) { /* */ }
    return 'win';
  }
  async function downBeat(K) {
    const { A, ST } = K;
    ST.shot('party'); K.setMood(A.mimo, 'hurt', 2.4); K.setMood(A.you, 'hurt', 2.4); flash(0.5);
    hushSay(K, 'h.down', 2.6); await K.wait(1.8);
    if (FX.elio) { elioSay(K, 'e.5', 2.4); await K.wait(1.8); }
  }
  async function foesTurn(K) {
    const ph = FX.phase;
    if (FX.hopeless) { await coreAttack(K, 3, 2); return; }
    await coreAttack(K, ph === 'B' ? (FX.turn % 2 ? 3 : 2) : 2, ph === 'B' ? 2 : 1);
  }
  const PLUG = {
    setup(K) {
      const { G: BG, A, ST } = K, f = BG.foes.find(x => x.species === 'fb_core'); if (!f) { FX = null; return; }
      const S = st(), ph = S.phase === 'B' ? 'B' : 'A';
      FBBOSS._.css();
      FX = { f, phase: ph, turn: 0, taunt: 0, light: S.elio ? 1 : 0, crack: ph === 'B' ? 0.3 : 0, elio: !!S.elio, hopeless: ph === 'A' && !S.elio, gift: null, giftWord: '', gentle: (S.downs[ph] || 0) >= 2, lockHp: 0, turnB: 0 };
      f.isBoss = true; f.fbPose = { lashHi: 0, lashLo: 0, gather: 0 };
      f.hx = HOME.x; f.hz = HOME.z; f.x = f.hx; f.z = f.hz; f.baseYaw = f.yaw = Math.atan2(-2.5 - HOME.x, 0.6 - HOME.z);
      f.hp = f.maxHp = Math.round(BAR[ph] * pw()); FX.lockHp = f.hp;
      BG.tier = 3;
      if (FX.gentle) { BG.maxHearts += 2; BG.hearts = BG.maxHearts; try { K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); } catch (e) { /* */ } }
      if (A.coach) A.coach.hidden = true;
      try { Object.assign(FBM.state, { elio: !!S.elio, fin: false, end: false }); } catch (e) { /* */ }
      camOn(ST);
    },
    floor: f => (f && FX && f === FX.f ? Math.max(1, FX.hopeless ? FX.lockHp : 0) : 0),
    async main(K) {
      const { G: BG, ST } = K; if (!FX) return 'flee';
      const f = FX.f, S = st(), T = () => TAC();
      BG.winLine = null; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels(); K.emit('boss', { foe: f });
      ST.shot('focus', K.A.mimo, f, { up: 1.2, dist: 14 });
      if (FX.phase === 'A' && !(S.downs.A || 0) && !S.elio) { hushSay(K, 'c.open', 3.0); await K.wait(2.6); }
      else if ((S.downs[FX.phase] || 0) > 0) { elioSay(K, 'e.5', 2.4); await K.wait(1.8); try { K.UI.tip(X().YOU.down); } catch (e) { /* */ } }
      ST.shot('wide');
      for (;;) {
        BG.turn++; FX.turn++; if (FX.phase === 'B') FX.turnB++; K.refreshLabels();
        if (T() && T().turn) { try { await T().turn(); } catch (e) { console.error('[fb core] tac turn', e); } }
        if (FX.phase === 'A' && FX.hopeless && FX.turn >= 3) await elioJoins(K);
        const r = await K.askOrFlee('command');
        prePerform(r);
        await K.perform(r);
        if (FX.phase === 'B' && (FX.turnB === 1 || FX.turnB % 3 === 1)) await steal(K, r);
        if (f.hp <= 1 && !FX.hopeless) {
          if (FX.phase === 'A') { await toB(K); continue; }
          return await finisher(K);
        }
        const h0 = BG.hearts;
        await foesTurn(K);
        if (BG.hearts <= 0) { await downBeat(K); return 'lose'; }
        if (h0 > BG.hearts && FX.elio && Math.random() < 0.4) { elioSay(K, 'e.4', 2.2); }
        if (T() && T().afterFoes) { try { await T().afterFoes(); } catch (e) { console.error('[fb core] tac after', e); } }
        ST.shot('wide');
      }
    },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene();
      camOff(K.ST);
      FX = null;
    },
  };

  // ------------------------------------------------------------ from the realm: the fight, again after a knock-down, until it breaks
  async function fight(o = {}) {
    if (busy) return null;
    busy = true;
    const S = st();
    try {
      for (;;) {
        try { if (typeof HEARTS !== 'undefined') HEARTS.full(); } catch (e) { /* */ }
        try { FIN.songOverride = 'boss_fb_core'; } catch (e) { /* */ }
        species(true);
        let r = null;
        try { r = await GAME.fight({ boss: 'fb_core', foes: [{ kind: 'fb_core', color: 'white', size: 'big', giant: GIANT, hp: BAR[S.phase === 'B' ? 'B' : 'A'], floating: true }], place: { biome: 'fb_core', x: 60, z: -428 } }); }
        finally { species(false); }
        if (S.won) return 'win';
        if (r && r.outcome === 'lose') { const ph = S.phase === 'B' ? 'B' : 'A'; S.downs[ph] = (S.downs[ph] || 0) + 1; save(); continue; }
        try { FIN.songOverride = 'fb_realm'; } catch (e) { /* */ }
        return 'flee';
      }
    } finally { busy = false; }
  }
  function init(game) { GAME = game; }
  if (typeof STORY !== 'undefined' && STORY.init && !STORY.init._fbc) {
    const i0 = STORY.init;
    STORY.init = function (game) { const v = i0.apply(this, arguments); try { init(game); } catch (e) { console.error('[fb core] init', e); } return v; };
    STORY.init._fbc = true;
  }
  const api = {
    init, fight, st, BAR,
    get busy() { return busy; }, get FX() { return FX; }, get ARENA() { return ARENA; },
    _: { coreModel, species, t: { async fight(ph = 'A', o = {}) { const S = st(); S.phase = ph; if (o.elio !== undefined) S.elio = !!o.elio; S.won = false; return fight(); } } },
  };
  try { hook(); } catch (e) { console.error('[fb core] battle hooks', e); }
  return api;
})();
