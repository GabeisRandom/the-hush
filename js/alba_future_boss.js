'use strict';
// The Laughing Gallery («la Galería que se ríe», «a Galeria que Ri», «die Lachende Galerie», 大笑的看台, 笑う客席): Alba tomorrow's
// boss, on the old theater's stage (DESIGN.md 18.6 "T1b"; game/TIME.md §9). A plug-in on battle/flow.js (BATTLE._.plugins.gallery)
// fought through TIME.fight, so the Future's tense rules hold (battle/timebattle.js: a command told as a plan lands next turn).
//   What the Hush became in there: empty seats, gray, rising row on row, a big laughing mask over them and three small masks
//   going round. Each small mask breaks to one of tomorrow's skills, the way the theater's rooms taught them:
//     1 a plan («{mimo} golpeará la máscara»): it lands at the start of your next turn, after the Gallery has laughed;
//     2 a prediction: a mask rises or ducks; say where the laugh will come from («¡Se reirá por arriba!») and it misses,
//       and Mimo counters (said wrong: it comes from the other side);
//     3 a trap («Si bajan, {mimo} las golpeará»): the masks swoop, and it springs.
//   The present only gets "that's today"; a plain hit doesn't crack them. With the masks gone the seats are just afraid of an
//   audience: don't hit them; promise what the audience will do («Escucharemos»), and the gray lets go (red velvet comes back).
//   Its laugh never takes your last heart; you can always run (and come back).
//   ALBA_FUT_BOSS.fight() → { outcome, letter, misses } · .hook() · .model()
const ALBA_FUT_BOSS = (() => {
  const X = () => AFTXT;
  const BTX = () => (typeof BATTLE !== 'undefined' && BATTLE._) || null;
  const G = () => (typeof TIME !== 'undefined' && TIME.API ? TIME.API.G : null);
  const lang = () => { const g = G(); return (g && g.state && g.state.lang) || 'es'; };
  const isC = l => l === 'zh' || l === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const plain = (s, l = lang()) => (isC(l) && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: l }) : String(s || ''));
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const playSong = n => { try { if (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(n)) Sound.setSong(n); } catch (e) { /* */ } };
  const mimoName = () => { const g = G(); return (g && g.state && g.state.mimoName) || 'Mimo'; };
  const fillMimo = (s, l = lang()) => String(s || '').replace(/\{mimo\}/g, isC(l) && mimoName() === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : mimoName());
  const fillEn = s => String(s || '').replace(/\{mimo\}/g, mimoName());
  const down = (letter, n) => 'SABCD'[Math.max(0, Math.min(4, 'SABCD'.indexOf(letter || 'B') + n))];
  const MASKS = 3, ORDER = ['plan', 'pred', 'trap'];
  const TASK = { plan: ['f.hit', 'f.jump', 'f.push'], pred: ['b.pred'], trap: ['l.trap1', 'l.trap2'], promise: ['g.promise'] };
  const HA = { es: 'JA', pt: 'HA', de: 'HA', zh: '哈哈', ja: 'ハハ' };
  let FX = null, worryTex = null;

  // ------------------------------------------------------------ the figure: a bank of gray seats, a big laughing mask, three small ones
  const laughFace = () => (typeof ALBA_FUT !== 'undefined' && ALBA_FUT && ALBA_FUT._.laughFace ? ALBA_FUT._.laughFace() : null);
  function worryFace() {
    return worryTex || (worryTex = TK.canvasTex(128, 128, c => {
      c.fillStyle = '#e9e6ef'; c.beginPath(); c.ellipse(64, 64, 54, 60, 0, 0, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = '#2b2235'; c.stroke();
      c.lineWidth = 5; c.beginPath(); c.moveTo(28, 40); c.lineTo(52, 32); c.moveTo(76, 32); c.lineTo(100, 40); c.stroke();          // (brows up)
      c.fillStyle = '#2b2235'; for (const x of [42, 86]) { c.beginPath(); c.arc(x, 54, 7, 0, TAU); c.fill(); }
      c.beginPath(); c.moveTo(44, 96); c.quadraticCurveTo(54, 86, 64, 96); c.quadraticCurveTo(74, 106, 84, 96); c.stroke();      // (a wobbly mouth)
    }));
  }
  function model() {
    const A = PAST.API, root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const bank = (cush, back) => {
      const k = A.Kit();
      for (let r = 0; r < 3; r++) {
        const y = 0.3 + r * 0.42, z = 0.55 - r * 0.6;
        k.box(0, y / 2 - 0.02, z, 2.1, y, 0.62, '#3a3442', { ink: 0.012 });                                         // (the riser)
        for (let c = -1; c <= 1; c++) k.box(c * 0.66, y + 0.08, z + 0.06, 0.56, 0.14, 0.48, cush, { ink: 0.01 }).box(c * 0.66, y + 0.36, z - 0.2, 0.56, 0.48, 0.09, back, { ink: 0.01 });
      }
      return k;
    };
    const grayG = new THREE.Group(), redG = new THREE.Group(); body.add(grayG, redG);
    bank('#8d8aa0', '#7a7790').build(grayG); bank('#b8343e', '#962a33').build(redG); redG.visible = false;
    const lf = laughFace();
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.36), new THREE.MeshBasicMaterial({ map: lf, transparent: true, side: THREE.DoubleSide })); face.position.set(0, 2.3, 0.1); body.add(face);
    const small = new THREE.MeshBasicMaterial({ map: lf, transparent: true, side: THREE.DoubleSide });
    const masks = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.62), small); m.userData.a = i / 3 * TAU; body.add(m); return m; });
    const gl = A.glow('#c9c4dc', 3.4, 0.3); gl.position.y = 1.2; body.add(gl);
    const warm = A.glow('#ffd9a0', 3.6, 0); warm.position.y = 1.0; body.add(warm);
    const anchors = {};
    [['top', [0, 3.0, 0]], ['mid', [0, 1.0, 0.5]], ['head', [0, 2.2, 0.4]], ['face', [0, 2.3, 0.5]], ['book', [0, 1.2, 0.6]], ['feet', [0, 0.05, 0]]].forEach(([n, p]) => { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); anchors[n] = o; });
    const s = 1.15; root.scale.setScalar(s);
    return { root, body, grayG, redG, face, masks, gl, warm, anchors, kind: 'gallery', scale: s, radius: 1.3 * s, height: 3.0 * s, parts: [], labelH: 3.4, hover: 0, L: { laugh: 0, show: 0, showK: 0, swoop: 0, warm: 0, worried: false } };
  }
  function pose(h, F, t, dt) {
    const L0 = h.L, d = dt || 0.016, hits = FX ? FX.hits : 0, ph2 = !!(FX && FX.phase === 2), done = !!(FX && FX.done);
    L0.laugh = Math.max(0, L0.laugh - d * 1.4); L0.swoop = Math.max(0, L0.swoop - d * 1.6);
    L0.showK = damp(L0.showK, L0.show, 6, d); L0.warm = damp(L0.warm, done ? 1 : 0, 1.3, d);
    h.body.position.y = Math.sin(t * 1.3) * 0.05 + L0.laugh * Math.abs(Math.sin(t * 22)) * 0.1;
    const shiver = ph2 && !done ? 0.03 : 0; h.grayG.position.x = shiver * Math.sin(t * 43); h.grayG.position.z = shiver * Math.cos(t * 37);
    if (ph2 !== L0.worried) { L0.worried = ph2; h.face.material.map = ph2 ? worryFace() : laughFace(); h.face.material.needsUpdate = true; }
    h.face.position.y = 2.3 + Math.sin(t * 1.6) * 0.06 - L0.warm * 0.4; h.face.rotation.z = Math.sin(t * 5.5) * 0.07 * (1 + L0.laugh * 2.5);
    h.face.material.opacity = 1 - L0.warm; h.face.visible = L0.warm < 0.98;
    h.redG.visible = L0.warm > 0.5; h.grayG.visible = !h.redG.visible;
    h.masks.forEach((m, i) => {
      m.visible = i >= hits && !ph2;
      const a = m.userData.a + t * 0.6, nx = i === hits ? L0.showK : 0;                 // (the next one shows its move: up, or down)
      m.position.set(Math.sin(a) * 1.45, 1.45 + Math.sin(t * 2 + i) * 0.16 + nx * 0.75 - L0.swoop * 1.0, Math.cos(a) * 1.45 + 0.2 + L0.swoop * 1.2);
      m.rotation.set(0, Math.sin(a) * 0.5, Math.sin(t * 8 + i) * 0.1 * (1 + L0.laugh * 2));
      const sc = 1 + Math.abs(nx) * 0.25; m.scale.set(nx < 0 ? sc * 1.1 : 1, nx < 0 ? 0.8 : sc, 1);
    });
    h.gl.material.opacity = 0.3 * (1 - L0.warm) + (ph2 ? 0.15 : 0);
    h.warm.material.opacity = 0.55 * L0.warm;
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }
  function label() {
    const l = lang(), N = X().NAMES.gallery, left = FX ? Math.max(0, MASKS - FX.hits) : MASKS;
    return `<div class="bt-chips"><span class="bt-chip name">${isC(l) && typeof CJK !== 'undefined' ? CJK.html(N[l], { lang: l }) : esc(N[l] || N.en)}</span></div><div class="bt-hpbar"><i style="width:${Math.round(100 * left / MASKS)}%"></i><span>${FX && FX.phase === 2 ? '…' : '🎭 ' + left}</span></div>`;
  }
  // a word as a sprite (the laugh flying at you)
  function wordSprite(text) {
    const cv = document.createElement('canvas'), c = cv.getContext('2d'), font = '900 64px "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif';
    c.font = font; cv.width = Math.min(1024, Math.ceil(c.measureText(text).width) + 56); cv.height = 104;
    c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 14; c.strokeStyle = '#d9cff5'; c.strokeText(text, cv.width / 2, 54); c.fillStyle = '#3a3448'; c.fillText(text, cv.width / 2, 54);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false, depthWrite: false }));
    sp.scale.set(0.55 * cv.width / cv.height, 0.55, 1); sp.renderOrder = 12; return sp;
  }
  function laughSfx(n = 3) { try { if (typeof ALBA_FUT_HALL !== 'undefined' && ALBA_FUT_HALL._ && ALBA_FUT_HALL._.laughSfx) ALBA_FUT_HALL._.laughSfx(n, 0.9); } catch (e) { /* */ } }

  // ------------------------------------------------------------ the arena (stage.js _.arenaBuilders.gallery): the stage tomorrow,
  // looking out at the house. The boards (gray with dust), the stage's edge and its footlights, and past them the seats rising
  // row on row to the back wall, gray, laughing masks over them; gray drapes either side. The floor takes the Hush's gray round
  // the foes (uStain), as every arena's does.
  function boardsMat(uni) {
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', vertexColors: true, gradientMap: TK.grad });
    m.onBeforeCompile = sh => {
      sh.uniforms.uStain = uni.uStain; sh.uniforms.uStainC = uni.uStainC;
      sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform float uStain; uniform vec2 uStainC; varying vec3 vWPos;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hk = uStain * (1.0 - smoothstep(1.5, 8.0, distance(vWPos.xz, uStainC)));\n' +
        'vec3 hg = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.95, 0.93, 1.12) + vec3(0.05, 0.05, 0.08);\ndiffuseColor.rgb = mix(diffuseColor.rgb, hg, hk * 0.6);');
    };
    m.customProgramCacheKey = () => 'af-gallery-floor';
    return m;
  }
  function buildGallery() {
    const P = { fog: '#2b2833', hemiSky: '#ddd6ee', hemiGround: '#3a3040', sun: '#ece4ff', hemiI: 0.66, sunI: 0.56 };
    const { merge, M4, toon, glowTex } = TK, GG = TK.G;
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(P.fog, 26, 66); scene.background = new THREE.Color(P.fog);
    const uni = { uTime: { value: 0 }, uStain: { value: 1 }, uStainC: { value: new THREE.Vector2(3, 0) } };
    scene.add(new THREE.HemisphereLight(P.hemiSky, P.hemiGround, P.hemiI));
    const sun = new THREE.DirectionalLight(P.sun, P.sunI);
    sun.position.set(3, 15, 9); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);
    let seed = 2077; const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // the boards, to the stage's edge at z −5.6; past it, a step down to the stalls
    const geo = new THREE.PlaneGeometry(90, 90, 90, 90); geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color(), WA = new THREE.Color('#9a8a80'), WB = new THREE.Color('#8a7b74'), D = new THREE.Color('#2a2630');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, z < -5.6 ? -1.5 : 0);
      if (z >= -5.6 && Math.abs(x) < 15.5) c.copy(WA).lerp(WB, 0.5 + 0.5 * Math.sin(x * 0.9 + z * 0.13)); else c.copy(D);
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const floor = new THREE.Mesh(geo, boardsMat(uni)); floor.receiveShadow = true; scene.add(floor);
    const pcs = [], add = (g, x, y, z, sx, sy, sz, color, ry = 0, rx = 0, rz = 0) => pcs.push({ geo: g, m: M4(x, y, z, sx, sy, sz, ry, rx, rz), color });
    for (let z = -5.4; z < 9; z += 0.7) add(GG.box, 0, 0.006, z, 31, 0.012, 0.035, '#6a5c56');                     // the joins between the boards
    add(GG.box, 0, -0.75, -5.7, 31, 1.5, 0.26, '#4a3a34'); add(GG.box, 0, 0.02, -5.6, 31, 0.06, 0.12, '#b8a46a');      // the stage's edge, its faded gilt
    for (let i = -5; i <= 5; i++) add(GG.cyl, i * 2.4, 0.12, -5.15, 0.22, 0.24, 0.22, '#3b2a22');                     // the footlights' hoods
    // the house: seven rows of seats rising to the back wall
    for (let r = 0; r < 7; r++) {
      const z = -7.6 - r * 1.5, y = -1.5 + r * 0.62, h = y + 2.2;
      add(GG.box, 0, y - h / 2, z, 32, h, 1.5, '#2e2a34');
      for (let s = 0; s < 21; s++) {
        const x = -14 + s * 1.4 + (r % 2) * 0.35;
        add(GG.box, x, y + 0.22, z + 0.1, 0.9, 0.44, 0.7, '#45404f'); add(GG.box, x, y + 0.48, z + 0.14, 1.0, 0.14, 0.78, '#8d8aa0');
        add(GG.box, x, y + 0.86, z - 0.3, 1.0, 0.72, 0.12, '#7a7790');
      }
    }
    add(GG.box, 0, 5, -19.2, 36, 14, 0.6, '#3a3542');                                                              // the back wall
    for (const s of [-1, 1]) { add(GG.box, s * 9, 5.6, -17.6, 9, 0.8, 0.5, '#8f8578'); add(GG.box, s * 9, 5.1, -17.9, 9, 0.3, 1.2, '#4a4252'); }    // the balcony fronts
    for (const s of [-1, 1]) for (let k = 0; k < 14; k++) add(GG.cyl, s * (16 + (k % 2) * 0.16), 5, -18 + k * 1.9, 0.42, 10, 0.62, k % 2 ? '#6e5a66' : '#7d6874');   // gray-red drapes
    for (let i = 0; i <= 30; i++) add(GG.cyl, -15 + i, 5, 9.6 + (i % 2) * 0.18, 0.62, 10, 0.42, i % 2 ? '#6e5a66' : '#7d6874');                                    // the curtain behind you
    const props = new THREE.Mesh(merge(pcs), toon('#ffffff', { vc: 1, rim: 0.1 })); props.castShadow = props.receiveShadow = true; scene.add(props);
    // the masks over the seats (one mesh: the quads merged)
    const quads = [];
    for (let i = 0; i < 16; i++) { const r = i % 7, x = -13 + R() * 26, q = new THREE.PlaneGeometry(0.9, 1.0); q.translate(x, -1.5 + r * 0.62 + 1.9 + R() * 0.8, -7.6 - r * 1.5 + 0.2); quads.push(q.toNonIndexed()); }
    const mg = new THREE.BufferGeometry();
    ['position', 'uv'].forEach(a => { const n = quads.reduce((s, q) => s + q.attributes[a].array.length, 0), arr = new Float32Array(n); let o = 0; quads.forEach(q => { arr.set(q.attributes[a].array, o); o += q.attributes[a].array.length; }); mg.setAttribute(a, new THREE.BufferAttribute(arr, a === 'uv' ? 2 : 3)); });
    const masks = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ map: laughFace(), transparent: true, side: THREE.DoubleSide, fog: true })); scene.add(masks);
    // light: the footlights, a cold spot over the fight, dust in it
    const glow = (color, s, o) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: o, depthWrite: false })); sp.scale.setScalar(s); scene.add(sp); return sp; };
    const foot = []; for (let i = -5; i <= 5; i++) { const g = glow('#ffd28a', 1.3, 0.5); g.position.set(i * 2.4, 0.4, -5.0); foot.push(g); }
    glow('#e8e0ff', 10, 0.22).position.set(3.4, 4.6, -3.6);
    const motes = []; for (let i = 0; i < 16; i++) { const s = glow('#e6e0f0', 0.16, 0); motes.push({ s, x: -11 + R() * 22, z: -8 + R() * 12, y: 0.6 + R() * 5, ph: R() * 6.283, sp: 0.15 + R() * 0.3 }); }
    function update(t) {
      uni.uTime.value = t;
      foot.forEach((g, i) => { g.material.opacity = 0.45 + 0.07 * Math.sin(t * 3.1 + i * 1.7); });
      masks.position.y = Math.sin(t * 1.3) * 0.08; masks.visible = !(FX && FX.done);
      for (const m of motes) { m.s.position.set(m.x + Math.sin(t * m.sp + m.ph) * 1.1, m.y + Math.sin(t * m.sp * 0.7 + m.ph) * 0.5, m.z); m.s.material.opacity = 0.26 + 0.16 * Math.sin(t * 1.1 + m.ph); }
    }
    return { scene, sun, uni, update, P, gallery: true };
  }

  // ------------------------------------------------------------ the fight
  const line = (key, l = lang()) => { const L0 = X().FIGHT[key]; return [fillMimo(L0[l] || L0.en, l), fillEn(L0.en)]; };
  function coach(K, key, dur = 3.2) { const [t, en] = line(key); K.say(FX.coachSt, t, { cls: 'coach', en, dur }); }
  function coachEn(K, text, dur = 3.4) { K.say(FX.coachSt, text, { cls: 'coach', dur }); }
  function bossSay(K, key, dur = 2.4, cls = 'foe shout boss') { const [t, en] = line(key); K.say(FX.f, t, { cls, en, dur }); }
  const pop = (st, text, o) => { try { const H = BTX() && BTX().tac && BTX().tac.h; if (H && H.pop) H.pop(st, text, o); } catch (e) { /* */ } };
  const ring = (K, st, color, s) => { try { if (K.ST.ring) K.ST.ring(st, color, s); } catch (e) { /* */ } };
  const IFW = { es: 'si', pt: 'se', de: 'wenn', zh: '如果', ja: '…たら' };
  function missHint(g) {
    switch (g && g.kind) {
      case 'nodir': return 'From where? Up high or down low: watch the mask, then say it.';
      case 'nosi': return `A trap starts with «${IFW[lang()] || 'if'}» (if): if they come down… then what will happen.`;
      case 'nofuture': return 'If that happens… then what WILL happen? Say it in tomorrow’s words.';
      case 'wrongverb': return 'That’s a tomorrow, but not this one. Look at the frame in the box.';
      case 'positive': return 'That’s just what it’s afraid of! Promise what the audience will do.';
      default: return null;
    }
  }
  // the box: this mask's task (AFTXT.grade) is a «move»; something close is a miss with a hint; anything else goes on as a command
  async function askTask(K, which) {
    const _ = BTX(), Pp = _ && _.P; if (!Pp) return null;
    const l = lang(), keys = TASK[which], T0 = X().TASKS[keys[0]], parse0 = Pp.parse, dir = which === 'pred' && FX.glimpse ? (FX.glimpse.high ? 'up' : 'down') : null;
    Pp.parse = function (text, ctx) {
      let near = null;
      for (const k of keys) {
        const g = X().grade(k, text, l, dir ? { dir } : {});
        if (g.ok) return { ok: true, kind: 'af:' + which, raw: text, grade: g, clauses: [] };
        if (g.kind && g.kind !== 'nothing' && !near) near = g;
      }
      if (near) return { ok: true, kind: 'af:miss', raw: text, grade: near, clauses: [] };
      return parse0.call(this, text, ctx);
    };
    try {
      const M0 = dir === 'down' && T0.modelDown ? T0.modelDown : T0.model;
      const frame = plain(fillMimo((T0.frame || {})[l] || '', l)), chips = ((T0.chips || {})[l] || []).map(([w, e]) => `${plain(w)} (${e})`).join(' · ');
      const model = plain(fillMimo((M0 || {})[l] || '', l));
      return await K.askOrFlee('command', { hint: FX.miss >= 2 ? `Like this: «${model}»` : `«${frame}»${chips ? ' · ___ = ' + chips : ''}` });
    } finally { Pp.parse = parse0; }
  }
  // a mask cracks: its letter (down one per miss on it, two at most), the star, the crack
  async function crack(K, letter0, why) {
    const { ST } = K, f = FX.f, letter = down(letter0, Math.min(2, FX.miss));
    FX.grades.push(letter); FX.hits++; FX.miss = 0;
    UI.toast(`${letter} · ${why}`);
    snd('crack'); ST.shake(0.25, 0.3); ST.star(ST.worldOf(f, 'head'), '#e9e6ef', 1.3); K.emit('knockdown'); K.refreshLabels();
    if (f.h && f.h.L) { f.h.L.laugh = 0; f.h.L.show = 0; }
    bossSay(K, 'crack', 2.0, 'foe boss'); await K.wait(1.3);
  }
  // Mimo leaps at the mask and back
  async function leap(K) {
    const M = K.A.mimo, f = FX.f, x0 = M.x, y0 = M.y || 0, z0 = M.z;
    K.emit('jump'); await K.arcTo(M, f.x - 1.0, 1.6, f.z + 0.9, 0.42, 1.0);
    return async () => { await K.arcTo(M, x0, y0, z0, 0.42, 0.8); };
  }
  // its laugh, flying at you or Mimo: up high or down low (o.high: the way its mask showed; o.foreseen: you said it right, so
  // it whiffs: a perfect dodge by itself)
  async function laughAttack(K, o = {}) {
    const { G: BG, A: AC, ST } = K, f = FX.f;
    if (BG.hearts <= 1 && !o.foreseen) { bossSay(K, 'laugh', 1.6, 'foe'); laughSfx(2); await K.wait(1.2); return; }
    const high = o.high !== undefined && o.high !== null ? o.high : Math.random() < 0.5, tgt = Math.random() < 0.5 ? AC.mimo : AC.you, l = lang();
    const dw = BG.L && BG.L.dodgeWords ? BG.L.dodgeWords(BG.tier) : null, ha = HA[l] || 'HA', where = (dw && (high ? dw.high : dw.low)) || (high ? '↑' : '↓');
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.7 });
    if (f.h && f.h.L) f.h.L.laugh = 1; laughSfx(3);
    const [lt, len] = line('laugh');
    K.say(f, `${plain(lt)} … ${where}`, { cls: 'foe shout boss', en: `${len}… ${high ? 'up high' : 'down low'}`, dur: K.readTime(ha + where) + 2.0 });
    K.emit('shout', { text: ha, high, foe: f, boss: true }); K.dodgeHint(true);
    await K.wait(K.readTime(ha + where) + 0.15);
    K.emit('windup', { foe: f, high, boss: true });
    const auto0 = BG.auto;
    if (o.foreseen) BG.auto = Object.assign({}, auto0 || {}, { dodge: 'perfect' });
    let grade = 'miss';
    try {
      const Tm = BG.t + 0.8, key = high ? 'ArrowDown' : 'ArrowUp';
      const tp = K.timingWindow(Tm, key, () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
      const spr = wordSprite(ha), a = ST.worldOf(f, 'face'), b = ST.worldOf(tgt, high ? 'top' : 'feet');
      ST.prop(spr); spr.position.copy(a);
      await K.along(0.8, u => { spr.position.lerpVectors(a, b, u * 1.06); spr.position.y += Math.sin(u * Math.PI) * (high ? 0.45 : 0.12); spr.material.rotation = Math.sin(u * 12) * 0.15; });
      grade = await tp;
      ST.dropProp(spr);
    } finally { BG.auto = auto0; }
    K.dodgeResult(f, tgt, grade, 1, {});
    if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
    if (f.h && f.h.L) f.h.L.show = 0;
    await K.wait(0.4);
  }
  // the next mask shows its move (the prediction's turn): it rises up high or ducks down low
  async function glimpse(K) {
    const { ST, A: AC } = K, f = FX.f, high = Math.random() < 0.5;
    FX.glimpse = { high };
    ST.shot('action', f, AC.mimo, { yaw: 0.05, up: 0.4 });
    f.flash = 0.25; ring(K, f, '#7ff7ea', 1.4); pop(f, '⟳', { color: '#7ff7ea', size: 34, rise: 0.4, life: 1.2 });
    if (f.h && f.h.L) f.h.L.show = high ? 1 : -1;
    snd('tick'); await K.wait(1.1);
    if (!FX.predTold) { FX.predTold = true; coach(K, 'glimpse', 3.8); await K.wait(2.2); }
    ST.shot('wide');
  }
  // a plan from last turn lands: Mimo leaps, the mask cracks
  async function landPlan(K) {
    const { A: AC, ST } = K, f = FX.f, p = FX.planDue; FX.planDue = null;
    ST.shot('action', AC.mimo, f, { yaw: -0.05, up: 0.4 });
    pop(AC.mimo, '⏳ → !', { color: '#7ff7ea', size: 30, life: 1.0 });
    await K.wait(0.5);
    const back = await leap(K);
    await crack(K, p.letter, p.why);
    await back();
    ST.shot('wide');
  }
  // the masks gone: just seats, trembling
  async function toPhase2(K) {
    const { A: AC, ST } = K, f = FX.f;
    FX.phase = 2; FX.miss = 0; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); ST.shake(0.4, 0.4); snd('crack');
    await K.wait(1.4);
    coach(K, 'phase2', 5.4); await K.wait(4.0);
  }
  // the promise: «Escucharemos». The seats listen back; the gray lets go
  async function promised(K, r) {
    const { A: AC, ST } = K, f = FX.f, letter = down(r.grade.letter, Math.min(2, FX.miss));
    FX.grades.push(letter);
    UI.toast(`${letter} · A promise`);
    K.say(AC.you, r.raw, { cls: 'you', dur: 2.4 }); await K.wait(1.6);
    ST.shot('focus', AC.you, f, { up: 0.7, dist: 8 });
    bossSay(K, 'listen', 3.2, 'foe boss'); await K.wait(2.6);
    coach(K, 'yes', 3.6);
    snd('chime'); ST.shot('focus', AC.mimo, f, { up: 0.8, dist: 9 });
    FX.done = true; K.refreshLabels();
    await K.wait(2.4);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.9);
  }
  const PLUG = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'gallery'); if (!f) { FX = null; return; }
      FX = { f, hits: 0, phase: 1, miss: 0, misses: 0, turn: 0, grades: [], planDue: null, glimpse: null, done: false, coachSt: { kind: 'tadeo', x: -5.2, y: 1.7, z: -1.4, talk: 0, flash: 0 } };
      f.isBoss = true;
      playSong('af_gallery');
    },
    floor: f => (f && f.species === 'gallery' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FX) return 'flee';
      const f = FX.f, TAC = BTX() && BTX().tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 11 });
      K.emit('boss', { foe: f }); laughSfx(5); if (f.h && f.h.L) f.h.L.laugh = 1;
      bossSay(K, 'laugh', 2.4); await K.wait(2.4);
      bossSay(K, 'taunt', 4.0, 'foe boss'); await K.wait(3.6);
      coach(K, 'intro', 6.0); await K.wait(4.4);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[gallery] tac turn', e); } }       // (the realm's own plans land; its first-turn tip)
        if (FX.phase === 1 && FX.planDue) { await landPlan(K); if (FX.hits >= MASKS) { await toPhase2(K); continue; } }
        if (FX.phase === 2) {
          const r = await askTask(K, 'promise');
          FX.turn++;
          if (!r || r.flee || r === K.FLEE) return 'flee';
          if (r.kind === 'af:promise') { await promised(K, r); return 'win'; }
          FX.miss++; FX.misses++; snd('wrong');
          if (r.kind === 'af:miss') { K.say(AC.you, r.raw, { cls: 'you', dur: 1.8 }); await K.wait(1.0); if (r.grade.kind === 'today') coach(K, 'now', 3.0); else coachEn(K, missHint(r.grade) || 'Promise what the audience will do.'); }
          else { coach(K, 'nohit', 3.2); K.setMood(AC.mimo, 'sad', 1.6); }
          await K.wait(1.8);
          continue;
        }
        const cur = ORDER[Math.min(FX.hits, MASKS - 1)];
        if (cur === 'plan' && !FX.planTold) { FX.planTold = true; coach(K, 'askPlan', 4.4); await K.wait(2.6); }
        if (cur === 'pred') await glimpse(K); else FX.glimpse = null;
        if (cur === 'trap' && !FX.trapTold) { FX.trapTold = true; coach(K, 'askTrap', 5.0); await K.wait(3.0); }
        const r = await askTask(K, cur);
        FX.turn++;
        if (!r || r.flee || r === K.FLEE) return 'flee';
        if (r.kind === 'af:plan') {
          // a plan: it waits for your next turn (the Gallery laughs first)
          K.say(AC.you, r.raw, { cls: 'you', dur: 2.0 }); await K.wait(0.8);
          FX.planDue = { letter: r.grade.letter, why: /tomorrow’s words/.test(r.grade.reason || '') ? 'A plan, and it landed!' : r.grade.reason };
          pop(f, '⏳', { color: '#7ff7ea', size: 34, rise: 0.4, life: 1.2 }); ring(K, f, '#7ff7ea', 1.4); K.setMood(AC.mimo, 'perk', 1.2);
          const [pt, pen] = line('plan'); K.say(AC.mimo, pt, { cls: 'mimo', en: pen, dur: 2.4 }); await K.wait(1.6);
          await laughAttack(K, {});
        } else if (r.kind === 'af:pred') {
          K.say(AC.you, r.raw, { cls: 'you', dur: 2.0 }); await K.wait(0.8);
          const high = FX.glimpse ? FX.glimpse.high : true;
          if (r.grade.wrongDir) {
            FX.miss++; FX.misses++;
            await laughAttack(K, { high });
            coach(K, 'other', 3.4); await K.wait(1.8);
          } else {
            pop(f, high ? '⤒' : '⤓', { color: '#7ff7ea', size: 40, rise: 0.4, life: 1.2 }); ring(K, f, '#7ff7ea', 1.6);
            const [kt, ken] = line('knew'); K.say(AC.mimo, kt, { cls: 'mimo', en: ken, dur: 2.0 });
            await laughAttack(K, { high, foreseen: true });
            pop(f, 'FORESEEN!', { color: '#7ff7ea', size: 34, dy: 0.5 }); K.emit('counter');
            const back = await leap(K); await crack(K, r.grade.letter, 'You saw it coming!'); await back();
          }
          FX.glimpse = null;
        } else if (r.kind === 'af:trap') {
          // the trap: set, then the masks swoop… and it springs
          K.say(AC.you, r.raw, { cls: 'you', dur: 2.0 }); await K.wait(0.8);
          pop(f, '⚠', { color: '#ffb347', size: 38, rise: 0.3, life: 1.4 }); ring(K, f, '#ffb347', 1.8);
          const [tt, ten] = line('trap'); K.say(AC.mimo, tt, { cls: 'mimo', en: ten, dur: 2.2 }); await K.wait(1.4);
          ST.shot('action', f, AC.mimo, { yaw: 0.04, up: 0.6 });
          if (f.h && f.h.L) { f.h.L.laugh = 1; f.h.L.swoop = 1.4; } laughSfx(4); bossSay(K, 'laugh', 1.4); await K.wait(0.7);
          const [st0, sen] = line('sprung'); K.say(AC.mimo, st0, { cls: 'mimo', en: sen, dur: 1.6 }); K.emit('counter');
          pop(f, 'TRAP!', { color: '#ffb347', size: 36, dy: 0.5 });
          const back = await leap(K); await crack(K, r.grade.letter, r.grade.letter === 'S' ? 'Trap!' : r.grade.reason || 'Trap!'); await back();
        } else if (r.kind === 'af:miss') {
          FX.miss++; FX.misses++; snd('wrong');
          K.say(AC.you, r.raw, { cls: 'you', dur: 1.8 }); await K.wait(1.0);
          if (r.grade.kind === 'today') coach(K, 'now', 3.0); else coachEn(K, missHint(r.grade) || 'Not quite… look at the frame in the box.');
          await K.wait(1.6);
          await laughAttack(K, { high: FX.glimpse ? FX.glimpse.high : undefined });
          FX.glimpse = null;
        } else {
          // a plain command: the realm's rules run it (a plan waits; the present confuses Mimo), but the masks hold
          const wrongT = !!(r && r.clauses && r.clauses.some(c => c.tbWrong));
          await K.perform(r);
          FX.miss++; FX.misses++;
          coach(K, wrongT ? 'now' : 'cmd', 3.4); await K.wait(1.8);
          await laughAttack(K, { high: FX.glimpse ? FX.glimpse.high : undefined });
          FX.glimpse = null;
        }
        if (FX.phase === 1 && FX.hits >= MASKS) { await toPhase2(K); continue; }
        if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[gallery] tac after', e); } }
      }
    },
    async foePhase(K) { if (FX && FX.phase === 1) await laughAttack(K, {}); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  // the bestiary, the species' names, the model, the label, the arena, the plug-in (BATTLE._ hooks, once)
  let hooked = false;
  function hook() {
    const _ = BTX(); if (!_ || hooked) return !!hooked; hooked = true;
    for (const [lg, sp] of Object.entries(X().SPECIES)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species.gallery) { Lg.species.gallery = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
    const M = _.M;
    if (M && !M.galleryHooked) {
      M.galleryHooked = true; const b0 = M.build, p0 = M.pose, br0 = M.brighten, k0 = M.kindOf;
      M.kindOf = k => (String(k || '') === 'gallery' ? 'gallery' : k0(k));
      M.build = o => (o && o.kind === 'gallery' ? model() : b0(o));
      M.pose = (h, F, t, dt) => (h && h.kind === 'gallery' ? pose(h, F, t, dt) : p0(h, F, t, dt));
      M.brighten = (h, k) => (h && h.kind === 'gallery' ? undefined : br0(h, k));
    }
    const U = _.UI; if (U && U.label && !U.galleryHooked) { U.galleryHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && f.species === 'gallery' ? label() : html); }; }
    if (_.RW && _.RW.LORE && !_.RW.LORE['boss:gallery']) _.RW.LORE['boss:gallery'] = X().LORE.slice();
    if (_.RW && _.RW.KIND_EN) _.RW.KIND_EN.gallery = 'the Laughing Gallery';
    if (_.UI && _.UI.ICON && !_.UI.ICON.gallery) _.UI.ICON.gallery = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="40" width="48" height="16" rx="3" fill="#8d8aa0" stroke="#2b2235" stroke-width="3"/><rect x="12" y="30" width="40" height="12" rx="3" fill="#7a7790" stroke="#2b2235" stroke-width="2.5"/><ellipse cx="32" cy="20" rx="13" ry="14" fill="#f6f2ea" stroke="#2b2235" stroke-width="2.5"/><path d="M24 22 Q32 34 40 22 Q32 26 24 22Z" fill="#2b2235"/><path d="M25 15 q3 -4 6 0 M33 15 q3 -4 6 0" stroke="#2b2235" stroke-width="2" fill="none"/></svg>';
    _.plugins = _.plugins || {}; _.plugins.gallery = PLUG;
    _.arenaBuilders = _.arenaBuilders || {}; if (!_.arenaBuilders.gallery) _.arenaBuilders.gallery = () => buildGallery();
    try { if (typeof BFX !== 'undefined' && BFX.VOICES && !BFX.VOICES.gallery) BFX.VOICES.gallery = { m: 60, vow: ['a', 'o', 'a'], len: 0.1, gap: 0.04 }; } catch (e) { /* (no battle sounds) */ }
    return true;
  }
  // the fight, on the stage tomorrow (this file's arena), through TIME.fight: the Future's tense rules
  async function fight() {
    hook();
    const H = (typeof CEMETERY !== 'undefined' && CEMETERY._ && CEMETERY._.HALL) || { x: -13.5, z: -241 };
    const run = typeof TIME !== 'undefined' && TIME.fight ? TIME.fight : o => G().fight(o);
    const r = await run({ boss: 'gallery', foes: [{ kind: 'gallery', color: 'white', size: 'big', giant: 1, hp: 30 }], place: { biome: 'gallery', x: H.x, z: H.z }, tb: { scene: () => false, noGlimpse: true } });
    const gs = FX ? FX.grades : [], worst = gs.reduce((a, g) => Math.max(a, 'SABCD'.indexOf(g)), 0);
    const letter = !gs.length ? 'C' : 'SABCD'[Math.min(4, worst + (FX && FX.misses > 4 ? 1 : 0))];
    return Object.assign({}, r || {}, { letter, grade: letter, misses: FX ? FX.misses : 0 });
  }
  return { fight, model, hook, ORDER, MASKS, PLUG, get FX() { return FX; } };
})();
