'use strict';
// The final battle, part 2 (FB1; DESIGN.md 21.11): inside the Hush. After the vines, just you and {mimo} in a gray void of floating
// paper memories (sepia for long ago, silver for tomorrow): an island for each trial, each getting its color back as you pass it, a
// paper bridge unfolding to the next. Then the descent to its heart (fb_core.js) and, back in the Clock Room, the aftermath, handed
// over to T4d's clock (FIN.bossSlot's next).
//   T1 «Sin voz»       Lantern Night's jetty in the fog. No voice, no command box: four pages (Elio's note, the lamplighter's, Ramiro's,
//                      a page of his speech) say which lantern is his; you read, walk there and press E. A wrong one: the fog takes you
//                      back to the shore. His lantern lit: your voices come back.
//   T2 «El espejo»     the Mirror Lake as a standing mirror; your gray reflection says six things wrong, the way you tend to (picked
//                      from your save: the Chapter 4 rungs where your echoes graded lowest, a word Mimo keeps missing, the slips your
//                      fights showed most; a standard B2 set fills the rest), and you say each right (FIN.ask: the frame, the chips,
//                      «?»). Each one cracks the mirror; at the end the reflection, in color: «Me equivoqué… y no pasó nada».
//   T3 «La risa»       the theater that night: the laughing masks lower one by one, and the person behind each says why they laughed;
//                      you tell the boy (little Elio, curled up on the stage) what each really said, in reported speech. Then, apart,
//                      the other laugh: Lantern Night, ten years later, Ramiro and the frog, on Candil's little jetty.
//   T4 «Sus palabras»  a stair of three islands, his eighteen words as gray lanterns: on each, his trapped voice says an old line, and you
//                      give him back his own words (T4d's FIN.giveBack g1–g3). Each island's lanterns light.
//   then the descent to the heart of the Hush (the core's fight: fb_core.js), the aftermath in the Clock Room, and next({ elio, noa,
//   bruno }).
// Rooms at y 300 over (60, −320), about 26 × 145 (SIDES.md registry). State: G.state.fb.realm = { trial 1–6, woke, cards, t1: { read,
// wrong }, t2: { items, done, grades }, t3: { heard, told, why }, t4: { g1, g2, g3 } }; G.state.fb.slips (the fights' tally).
// Checkpoints: every trial (a load puts you outside the tower; up again, you're back on that trial's island).
//   FBREALM.run() (the seam) · resume() · enter() · leave() · update(dt, t) · interactables() · target() · song() · inside · OUTSIDE
const FBREALM = (() => {
  if (typeof FIN === 'undefined' || typeof FBTXT === 'undefined' || typeof FBBOSS === 'undefined' || typeof THREE === 'undefined') return null;
  const Y0 = 300, R = { x: 60, z: -320 };
  let G = null, B = null, inside = false, busy = false, NEXT = null;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const X = () => FBTXT;
  const TAU2 = Math.PI * 2;
  const lang = () => (G && G.state && G.state.lang) || 'es';
  const isC = l => (l || lang()) === 'zh' || (l || lang()) === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const wait = s => STORY.wait(s);
  const tween = (s, fn) => STORY.tween(s, fn);
  const pick = (T, l = lang()) => (T ? T[l] || T.es || T.en || '' : '');
  const plainT = (s, l = lang()) => FIN.plainT(s, l);
  const mimoName = () => (G && G.state && G.state.mimoName) || 'Mimo';
  const fillM = (t, l = lang()) => FIN.fillMimo(t, l);
  // Elio's own lines: whole in the language at any weave, the English behind EN (as in the fights)
  const sayElio = (p, T) => { if (!p || !T) return Promise.resolve(); const l = lang(); p.lines = { en: fillM(T.en || '', 'en'), [l]: fillM(pick(T, l), l) }; return STORY.sayInline(p, 'tl'); };
  // the same for the lines a trial asks you to work with: the mirror's slip (T2) and what each mask really said (T3)
  const sayTL = sayElio;
  const sm = k => k * k * (3 - 2 * k);
  const st = () => FBBOSS.st();
  const RS = () => {
    const S = st();
    if (!S.realm) S.realm = { trial: 1 };
    const r = S.realm;
    r.t1 = r.t1 || { read: {} }; r.t1.read = r.t1.read || {};
    r.t2 = r.t2 || { done: 0 }; r.t3 = r.t3 || { heard: {}, told: {} }; r.t3.heard = r.t3.heard || {}; r.t3.told = r.t3.told || {};
    r.t4 = r.t4 || {}; r.cards = r.cards || {};
    return r;
  };
  const trial = () => RS().trial || 1;
  const save = () => { try { G.save(); } catch (e) { /* */ } };
  const lock = on => FIN.lock(on);
  const think = (s, d) => FIN.think(s, d);
  // (a trial's end stamps the quest tracker, «Task complete» for 4 s at the top middle: what's said next waits for it to go)
  const stampClear = async (cap = 4.5) => { try { QUESTS.tick(); } catch (e) { /* */ } for (let t = 0; t < cap && document.querySelector('#qstamp.on'); t += 0.2) await wait(0.2); };
  const shot = (p, l, dur = 0.9) => { G.cam.override = { pos: V(R.x + p[0], Y0 + p[1], R.z + p[2]), look: V(R.x + l[0], Y0 + l[1], R.z + l[2]), dur }; };
  const nameOf = k => plainT(pick(X().NAMES[k]));

  // ------------------------------------------------------------ the layout (the room's own coordinates: x across, z forward is −z)
  // look: how an island is drawn until its trial is passed (sepia for long ago, silver for tomorrow, gray)
  const ISLES = {
    wake: { x: 0, z: 30, r: 5.2, y: 0, look: 'gray', n: 1 },
    t1: { x: 0, z: 15.4, r: 4.6, y: 0, look: 'past', n: 1 },
    t2: { x: 0, z: -22, r: 7.2, y: 0, look: 'future', n: 2 },
    t3: { x: 0, z: -50, r: 8.4, y: 0, look: 'past', n: 3 },
    t3j: { x: 11.4, z: -50, r: 3.2, y: 0, look: 'past', n: 3 },
    g1: { x: -7, z: -71, r: 3.6, y: -1.6, look: 'past', n: 4 },
    g2: { x: 6, z: -81, r: 3.6, y: -3.2, look: 'gray', n: 4 },
    g3: { x: -5, z: -91, r: 3.6, y: -4.8, look: 'future', n: 4 },
    core: { x: 0, z: -108, r: 7.5, y: -7, look: 'gray', n: 5 },
  };
  // the ways between them (a paper strip from a to b, w wide; the jetty is one too), there once open() says so
  const WAYS = [
    { id: 'w0', a: [0, 25.0, 0], b: [0, 19.8, 0], w: 2.2, open: () => true },
    { id: 'jetty', a: [0, 11.6, 0], b: [0, -6.2, 0], w: 3.6, open: () => true, jetty: true },
    { id: 'w1', a: [0, -6.2, 0], b: [0, -14.9, 0], w: 2.2, open: () => trial() > 1 },
    { id: 'w2', a: [0, -29.1, 0], b: [0, -41.7, 0], w: 2.2, open: () => trial() > 2 },
    { id: 'w3', a: [-2.4, -57.8, 0], b: [-6.0, -67.6, -1.6], w: 2.2, open: () => trial() > 3 },
    { id: 'w4', a: [-4.4, -73.2, -1.6], b: [3.3, -78.9, -3.2], w: 2.0, open: () => !!RS().t4.g1 },
    { id: 'w5', a: [4.2, -83.8, -3.2], b: [-2.6, -88.9, -4.8], w: 2.0, open: () => !!RS().t4.g2 },
    { id: 'w6', a: [-3.8, -94.2, -4.8], b: [-1.2, -100.8, -7], w: 2.4, open: () => trial() > 4 },
  ];
  // things you can't walk through (x0, x1, z0, z1): the stage, the benches, the mirror's frame
  const BLOCK = [[-4.7, 4.7, -57.7, -54.3], [-3.9, 3.9, -47.5, -46.6], [-3.9, 3.9, -45.0, -44.1], [-3.9, 3.9, -42.5, -41.6], [-2.9, 2.9, -22.35, -21.65]];
  // where a load (or a return) puts you, by trial
  const SPAWN = { 1: [0, 31.2, Math.PI, 0], 2: [0, -15.6, Math.PI, 0], 3: [0, -42.6, Math.PI, 0], 4: [-6.4, -68.6, Math.PI, -1.6], 5: [-1.4, -100.4, Math.PI, -7], 6: [-1.4, -100.4, Math.PI, -7] };
  // Lantern Night's lanterns on the jetty (the children's on the left, x < 0; the grown-ups' on the right): which is his?
  const LANTERNS = [
    { id: 'l1', x: -1.75, z: 7.6, round: 1, star: 1, lit: 0, big: 0 },
    { id: 'l2', x: -1.75, z: 3.4, round: 1, star: 0, lit: 1, big: 0 },
    { id: 'l3', x: -1.75, z: -0.8, round: 0, star: 1, lit: 1, big: 0 },
    { id: 'l4', x: -1.75, z: -4.6, round: 1, star: 1, lit: 1, big: 1 },
    { id: 'l5', x: 1.75, z: 7.6, round: 1, star: 0, lit: 1, big: 1 },
    { id: 'l6', x: 1.75, z: 2.0, round: 1, star: 1, lit: 1, big: 0 },
    { id: 'l7', x: 1.75, z: -0.2, round: 1, star: 1, lit: 0, big: 0 },
    { id: 'l8', x: 1.75, z: -3.0, round: 0, star: 1, lit: 0, big: 0 },
    { id: 'l9', x: 1.75, z: -4.4, round: 1, star: 1, lit: 1, big: 1 },
    { id: 'l10', x: 1.75, z: -5.6, round: 1, star: 1, lit: 0, big: 0, his: true },
  ];
  const PAGESAT = [[-1.95, 9.8], [1.95, 5.2], [-1.95, 1.0], [1.95, -2.0]];
  // the theater: who sits where behind which mask (row 0 is the front), and the jetty's
  const SEATS = { rosita: { x: -2.4, z: -47.05, row: 0 }, nacho: { x: 1.6, z: -47.05, row: 0 }, felix: { x: -0.6, z: -44.55, row: 1 }, aurora: { x: -3.9, z: -52.6, row: -1, stand: true }, ramiro: { x: 12.3, z: -49.0, row: -1, stand: true, jetty: true } };
  const PLOOK = {
    rosita: { kid: true, skin: '#efc29a', hair: '#8a4a2a', hairdo: 'braids', ribbon: '#e2453a', dress: '#e07a4f', apron: '#fbf6ee', prop: 'lantern', h: 0.76, seat: true },
    nacho: { kid: true, skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#3f7fc9', vest: '#e8d4b0', h: 0.8, seat: true },
    felix: { skin: '#a8714a', hair: '#1f1a18', dress: '#2b2235', vest: '#7a4fa0', hat: 'beret', hatColor: '#7a4fa0', h: 1.06, seat: true },
    aurora: { skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'bun', dress: '#5c4a7a', shawl: '#e8b83e', prop: 'baton', h: 1.05 },
    ramiro: { kid: true, skin: '#d9a27a', hair: '#3a2b26', hairdo: 'short', dress: '#8a5a4a', h: 0.72 },
    boy: { kid: true, skin: '#d9a87e', hair: '#2b211d', hairdo: 'short', dress: '#5c6fa8', vest: '#d8c39a', h: 0.76, seat: true, capOn: true },
    young: { skin: '#d9a87e', hair: '#2b211d', hairdo: 'short', dress: '#6f6987', vest: '#8f88a6', h: 1.0 },
  };
  // his eighteen words, six to an island
  const WORDISLE = { g1: ['alba', 'molinar', 'lake'], g2: ['quarry', 'gardens', 'peaks'], g3: ['port', 'ruins', 'marsh'] };

  // ------------------------------------------------------------ paper, gray until it's given back (each island has its own uniforms)
  const LOOKS = { gray: [0.98, 0.98, 1.02], past: [1.16, 0.98, 0.74], future: [0.86, 0.97, 1.16] };
  let PAPER = null;
  const paperTex = () => PAPER || (PAPER = TK.canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#f6f1e6'; c.fillRect(0, 0, w, h); const Rr = rng(77);
    for (let i = 0; i < 260; i++) { c.strokeStyle = `rgba(120,108,92,${0.03 + Rr() * 0.06})`; c.lineWidth = 0.5 + Rr(); const x = Rr() * w, y = Rr() * h, a = Rr() * Math.PI; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * (3 + Rr() * 9), y + Math.sin(a) * (3 + Rr() * 9)); c.stroke(); }
  }));
  function paperMat(uni, o = {}) {
    const vc = o.vc !== false;
    const m = new THREE.MeshToonMaterial({ color: new THREE.Color(o.color || '#ffffff'), vertexColors: vc, gradientMap: TK.grad, map: o.map || null, transparent: !!o.transparent, opacity: o.opacity == null ? 1 : o.opacity,
      side: o.side || THREE.FrontSide, emissive: new THREE.Color(o.emissive || '#000000') });
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = uni.uGray; sh.uniforms.uTint = uni.uTint;
      sh.fragmentShader = 'uniform float uGray; uniform vec3 uTint;\n' + sh.fragmentShader.replace('#include <color_fragment>',
        '#include <color_fragment>\n{ float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lum) * uTint * 0.9, uGray); }');
    };
    m.customProgramCacheKey = () => 'fbr-paper' + (o.map ? 'm' : '') + (vc ? 'v' : '');
    return m;
  }
  const uniOf = look => ({ uGray: { value: 0.9 }, uTint: { value: new THREE.Vector3(...(LOOKS[look] || LOOKS.gray)) }, want: 0.9 });
  // a torn-edged paper disc (an island's top)
  function discGeo(r, h, seed, n = 44) {
    const g = new THREE.CylinderGeometry(r, r * 0.92, h, n, 1, false), p = g.attributes.position, Rr = rng(seed);
    const jag = Array.from({ length: n + 1 }, () => 1 + (Rr() - 0.5) * 0.08);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z); if (d < 1e-3) continue; let a = Math.atan2(z, x); if (a < 0) a += TAU2; const k = jag[Math.round(a / TAU2 * n) % n]; p.setX(i, x * k); p.setZ(i, z * k); }
    g.computeVertexNormals(); return g;
  }
  const glow = (color, s, o = 0.5) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); return sp; };

  // ------------------------------------------------------------ building it all (once)
  function build() {
    if (B) return B;
    const scene = G.w3d.scene, root = new THREE.Group(); root.position.set(R.x, Y0, R.z); root.visible = false; scene.add(root);
    B = { root, isles: {}, ways: {}, lanterns: [], pages: [], people: {}, masks: {}, rows: [], gifts: {}, anim: [], t: 0, fogK: 0 };
    // the void: a sky of gray-violet (darker below), paper scraps drifting, far memories
    const skyTex = TK.canvasTex(8, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#15131d'); g.addColorStop(0.42, '#3b3648'); g.addColorStop(0.55, '#4a4458'); g.addColorStop(1, '#0f0e15'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
    sky.position.set(0, 0, -40); root.add(sky); B.sky = sky;
    const NS = 110, scraps = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.42, 0.56), new THREE.MeshToonMaterial({ map: paperTex(), gradientMap: TK.grad, side: THREE.DoubleSide, color: '#d8d2c6' }), NS);
    const Rr = rng(4411); B.scrapD = [];
    for (let i = 0; i < NS; i++) B.scrapD.push({ x: -30 + Rr() * 60, y: -22 + Rr() * 38, z: -125 + Rr() * 165, s: 0.6 + Rr() * 1.1, rx: Rr() * 6, ry: Rr() * 6, v: 0.15 + Rr() * 0.35, w: (Rr() - 0.5) * 0.8 });
    root.add(scraps); B.scraps = scraps;
    // far memories: paper cut-outs of the valley (a bell tower, a windmill, a lighthouse, a clock, houses), sepia and silver
    const MEM = [['bell', -34, 6, 0, '#c9a77a'], ['mill', 36, 2, -20, '#a9b8cc'], ['light', -38, 0, -55, '#c9a77a'], ['clock', 34, 8, -70, '#a9b8cc'], ['houses', -32, -4, -95, '#c9a77a'], ['bell', 38, -6, -112, '#a9b8cc'], ['clock', -10, 18, -135, '#b8b0c8']];
    const memTex = {};
    const drawMem = (kind, c, w, h) => {
      c.fillStyle = '#ffffff'; c.beginPath();
      if (kind === 'bell') { c.rect(w * 0.38, h * 0.35, w * 0.24, h * 0.62); c.moveTo(w * 0.32, h * 0.36); c.lineTo(w * 0.5, h * 0.06); c.lineTo(w * 0.68, h * 0.36); }
      else if (kind === 'mill') { c.moveTo(w * 0.4, h * 0.97); c.lineTo(w * 0.44, h * 0.45); c.lineTo(w * 0.56, h * 0.45); c.lineTo(w * 0.6, h * 0.97); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; c.moveTo(w * 0.5, h * 0.42); c.lineTo(w * 0.5 + Math.cos(a) * w * 0.36, h * 0.42 + Math.sin(a) * h * 0.36); c.lineTo(w * 0.5 + Math.cos(a + 0.18) * w * 0.36, h * 0.42 + Math.sin(a + 0.18) * h * 0.36); c.lineTo(w * 0.5, h * 0.42); } }
      else if (kind === 'light') { c.moveTo(w * 0.4, h * 0.97); c.lineTo(w * 0.45, h * 0.2); c.lineTo(w * 0.55, h * 0.2); c.lineTo(w * 0.6, h * 0.97); c.rect(w * 0.42, h * 0.08, w * 0.16, h * 0.12); }
      else if (kind === 'clock') { c.arc(w * 0.5, h * 0.5, w * 0.42, 0, TAU2); }
      else { for (let k = 0; k < 4; k++) { const x0 = w * (0.06 + k * 0.23); c.moveTo(x0, h * 0.97); c.lineTo(x0, h * 0.55); c.lineTo(x0 + w * 0.1, h * (0.35 + (k % 2) * 0.08)); c.lineTo(x0 + w * 0.2, h * 0.55); c.lineTo(x0 + w * 0.2, h * 0.97); } }
      c.fill();
      if (kind === 'clock') { c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 10; c.beginPath(); c.moveTo(w * 0.5, h * 0.5); c.lineTo(w * 0.5, h * 0.2); c.moveTo(w * 0.5, h * 0.5); c.lineTo(w * 0.72, h * 0.58); c.stroke(); }
    };
    B.mems = MEM.map(([kind, x, y, z, col], i) => {
      const tex = memTex[kind] || (memTex[kind] = TK.canvasTex(256, 256, (c, w, h) => drawMem(kind, c, w, h)));
      const m = new THREE.Mesh(new THREE.PlaneGeometry(13, 13), new THREE.MeshBasicMaterial({ map: tex, color: col, transparent: true, opacity: 0.55, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: false }));
      m.position.set(x, y, z); m.rotation.y = x < 0 ? 0.7 : -0.7; root.add(m); return { m, ph: i * 1.3, y };
    });
    // the islands
    for (const [id, I] of Object.entries(ISLES)) B.isles[id] = isle(id, I);
    buildWays(); buildWake(); buildT1(); buildT2(); buildT3(); buildT4(); buildCore();
    // the ground you walk on (inside: the islands and the open ways; a step off is pushed back, so no one falls)
    WORLD.addPlatforms([{ box: [R.x - 40, R.x + 40, R.z - 125, R.z + 45], top: Y0, fn: (x, z) => (inside ? Y0 + heightAt(x - R.x, z - R.z) : null) }]);
    return B;
  }
  function isle(id, I) {
    const uni = uniOf(I.look), g = new THREE.Group(); g.position.set(I.x, I.y, I.z); B.root.add(g);
    const top = { wake: '#e9e4da', t1: '#e2cfa4', t2: '#d9e3ec', t3: '#d9c3a0', t3j: '#cdb08a', g1: '#e4d5b8', g2: '#e0dad0', g3: '#d8e0ea', core: '#cfc8d6' }[id] || '#e9e4da';
    const mat = paperMat(uni, { map: paperTex() }), seed = id.length * 97 + Math.round(I.r * 13);
    const pcs = [{ geo: discGeo(I.r, 0.5, seed), m: TK.M4(0, -0.25, 0, 1, 1, 1), color: top }];
    // under it, paper layers, smaller and darker, and a few hanging strips
    [[0.82, -0.75, '#bdb5a8'], [0.56, -1.35, '#9f978c'], [0.3, -2.05, '#857d74']].forEach(([k, y, c], j) => pcs.push({ geo: discGeo(I.r * k, 0.5, seed + j + 1, 24), m: TK.M4(0, y, 0, 1, 1, 1), color: c }));
    const Rr = rng(seed + 9);
    for (let j = 0; j < 7; j++) { const a = Rr() * TAU2, d = I.r * (0.3 + Rr() * 0.5); pcs.push({ geo: Gx().box, m: TK.M4(Math.cos(a) * d, -1.2 - Rr() * 1.2, Math.sin(a) * d, 0.18, 1.2 + Rr() * 1.4, 0.02, a), color: '#a8a096' }); }
    const mesh = TK.part(TK.merge(pcs), null, null, null, { mat, ink: 0.03 }); mesh.receiveShadow = true; g.add(mesh);
    return { id, I, g, uni, mat };
  }
  const Gx = () => TK.G;
  // a person drawn in an island's paper (gray until the island is given back)
  function person(id, look, isleId, at) {
    const U = B.isles[isleId].uni, P = FIN.person(id, Object.assign({}, look, { mat: paperMat(U) }), B.root, at);
    P.isle = isleId; return P;
  }
  // a paper strip between two islands (or the jetty's planks): it unfolds when its way opens
  function buildWays() {
    for (const W of WAYS) {
      const [ax, az, ay] = W.a, [bx, bz, by] = W.b, len = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az), pitch = Math.atan2(by - ay, len);
      const g = new THREE.Group(); g.position.set(ax, ay, az); g.rotation.order = 'YXZ'; g.rotation.y = yaw; g.rotation.x = -pitch; B.root.add(g);
      const L2 = Math.hypot(len, by - ay), inner = new THREE.Group(); g.add(inner);
      const uni = W.jetty ? B.isles.t1.uni : uniOf('gray'), pcs = [];
      if (W.jetty) {
        for (let k = 0; k < Math.floor(L2 / 0.55); k++) pcs.push({ geo: Gx().box, m: TK.M4(0, -0.1, 0.3 + k * 0.55, W.w, 0.18, 0.5), color: k % 2 ? '#8a6a48' : '#7a5c3e' });
        for (let k = 0; k <= Math.floor(L2 / 2.2); k++) for (const s of [-1, 1]) pcs.push({ geo: Gx().cyl, m: TK.M4(s * (W.w / 2 + 0.05), -0.2, 0.3 + k * 2.2, 0.11, 1.5, 0.11), color: '#5c4630' });
      } else {
        pcs.push({ geo: Gx().box, m: TK.M4(0, -0.08, L2 / 2, W.w, 0.16, L2), color: '#e6dfd2' });
        for (let k = 0; k < Math.floor(L2 / 0.9); k++) pcs.push({ geo: Gx().box, m: TK.M4(0, 0.005, 0.45 + k * 0.9, W.w * 0.96, 0.01, 0.04), color: '#c8c0b2' });
        for (const s of [-1, 1]) pcs.push({ geo: Gx().box, m: TK.M4(s * W.w / 2, 0.06, L2 / 2, 0.06, 0.12, L2), color: '#b8afa2' });
      }
      const mesh = TK.part(TK.merge(pcs), null, null, null, { mat: paperMat(uni, { map: paperTex() }), ink: 0.02 }); inner.add(mesh);
      B.ways[W.id] = { W, g, inner, uni, k: W.open() ? 1 : 0 };
      inner.scale.z = B.ways[W.id].k; g.visible = B.ways[W.id].k > 0.01;
    }
  }
  function openWay(id) {
    const w = B && B.ways[id]; if (!w || w.k >= 1) return Promise.resolve();
    w.g.visible = true; snd('page');
    return tween(1.4, k => { w.k = sm(k); w.inner.scale.z = Math.max(0.001, w.k); }).then(() => { w.k = 1; w.inner.scale.z = 1; snd('chime'); });
  }
  // ---- the island where you wake: nothing but a few scraps and the shape where you lay
  function buildWake() {
    const I = B.isles.wake, Rr = rng(31), pcs = [];
    for (let k = 0; k < 9; k++) { const a = Rr() * TAU2, d = 1 + Rr() * 3.6; pcs.push({ geo: Gx().box, m: TK.M4(Math.cos(a) * d, 0.012, Math.sin(a) * d, 0.42, 0.01, 0.56, Rr() * 3), color: '#f1ece2' }); }
    I.g.add(TK.part(TK.merge(pcs), null, null, null, { mat: paperMat(I.uni, { map: paperTex() }), ink: 0.006 }));
  }
  // ---- T1: Lantern Night's shore and jetty; the water; the boats (green and blue keep their color: the pages talk about them);
  // the lanterns; the four pages on the posts
  function buildT1() {
    const I = B.isles.t1, J = new THREE.Group(); B.root.add(J); B.t1 = { J };
    // (the water fades out into the fog at its edge: a lake with no shore, hanging in the gray)
    const waterTex = TK.canvasTex(128, 128, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.62, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(40,44,60,0.25)'; c.lineWidth = 1.5; for (let r = 10; r < 60; r += 7) { c.beginPath(); c.arc(w / 2, h / 2, r, 0, TAU2); c.stroke(); } });
    const water = new THREE.Mesh(new THREE.CircleGeometry(15, 48), new THREE.MeshBasicMaterial({ color: '#4b5264', map: waterTex, transparent: true, depthWrite: false }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, -0.6, 3); J.add(water); B.t1.water = water;
    // reeds on the shore
    const Rr = rng(55), pcs = [];
    for (let k = 0; k < 14; k++) {
      const a = Rr() * TAU2, d = 3.3 + Rr() * 1.0, x = Math.cos(a) * d, z = Math.sin(a) * d;
      if (Math.abs(x) < 2.4 && z < 0) continue;      // (not in front of the jetty)
      for (let j = 0; j < 3; j++) { const h = 0.45 + Rr() * 0.4; pcs.push({ geo: Gx().cone, m: TK.M4(x + (j - 1) * 0.08, h / 2, z + (Rr() - 0.5) * 0.12, 0.025, h, 0.025, 0, (Rr() - 0.5) * 0.3, (j - 1) * 0.18), color: j === 1 ? '#7d8a55' : '#8f9a62' }); }
    }
    I.g.add(TK.part(TK.merge(pcs), null, null, null, { mat: paperMat(I.uni), ink: 0.005 }));
    // the boats (kept in color) and Ramiro's frog in the green one
    const boat = (col, x, z) => {
      const g = new THREE.Group(); g.position.set(x, -0.5, z); J.add(g);
      const hull = new THREE.LatheGeometry([[0, 0], [0.5, 0.02], [0.62, 0.2], [0.66, 0.38]].map(([a, b]) => new THREE.Vector2(a, b)), 14);
      const m = TK.part(hull, col, [0, 0, 0], [1, 1, 2.4], { ink: 0.02, rim: 0.1 }); g.add(m);
      g.add(TK.part(Gx().box, '#6a5038', [0, 0.25, 0], [1.1, 0.06, 0.24], { ink: 0.01 }));
      return g;
    };
    B.t1.blue = boat('#4f7fd0', 4.3, 0.9); B.t1.green = boat('#4f9a5a', 4.3, -4.4);
    const frog = new THREE.Group(); frog.position.set(0, 0.32, -0.5); B.t1.green.add(frog);
    frog.add(TK.part(Gx().sphere, '#6fae4f', [0, 0.14, 0], [0.22, 0.16, 0.26], { ink: 0.012 }));
    for (const s of [-1, 1]) { frog.add(TK.part(Gx().sphere, '#6fae4f', [s * 0.1, 0.3, 0.12], [0.07, 0.07, 0.07], { ink: 0.008 })); frog.add(TK.part(Gx().sphere, '#2b2235', [s * 0.1, 0.31, 0.18], [0.03, 0.03, 0.02], { ink: 0 })); }
    // lanterns floating on the water (the others' wishes, lit)
    B.t1.floaters = [];
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU2 + 0.3, d = 7 + (k % 3) * 2.2, gl = glow('#ffd08a', 1.2, 0.5); gl.position.set(Math.cos(a) * d, -0.3, 3 + Math.sin(a) * d * 0.8); J.add(gl); const b = TK.part(Gx().box, '#e8c98a', [gl.position.x, -0.42, gl.position.z], [0.22, 0.18, 0.22], { ink: 0.008 }); J.add(b); B.t1.floaters.push({ gl, b, ph: k }); }
    // the jetty's lanterns
    const starTex = TK.canvasTex(64, 64, (c, w, h) => { c.fillStyle = '#d2453a'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 26; c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); } c.closePath(); c.fill(); });
    for (const Ln of LANTERNS) {
      const g = new THREE.Group(); g.position.set(Ln.x, 0, Ln.z); J.add(g);
      const s = Ln.big ? 1.35 : 0.9, side = Ln.x < 0 ? 1 : -1;
      g.add(TK.part(Gx().cyl, '#5c4630', [0, 0.45, 0], [0.04, 0.9, 0.04], { ink: 0.008 }));
      const lit = !!Ln.lit, body = new THREE.Group(); body.position.y = 0.9 + 0.2 * s; g.add(body);
      const mat = new THREE.MeshToonMaterial({ color: lit ? '#f5dca8' : '#8c867c', gradientMap: TK.grad, emissive: new THREE.Color(lit ? '#7a4a14' : '#000000') });
      body.add(TK.part(Ln.round ? Gx().sphere : Gx().box, null, [0, 0, 0], Ln.round ? [0.2 * s, 0.24 * s, 0.2 * s] : [0.34 * s, 0.4 * s, 0.34 * s], { mat, ink: 0.012 }));
      body.add(TK.part(Gx().cyl, '#3a2c20', [0, 0.27 * s, 0], [0.08 * s, 0.05, 0.08 * s], { ink: 0.006 }));
      if (Ln.star) { const st0 = new THREE.Mesh(new THREE.PlaneGeometry(0.18 * s, 0.18 * s), new THREE.MeshBasicMaterial({ map: starTex, transparent: true, alphaTest: 0.4 })); st0.position.set(side * (Ln.round ? 0.205 : 0.175) * s, 0, 0); st0.rotation.y = side * Math.PI / 2; body.add(st0); }
      const gl = glow('#ffcf7a', 1.3 * s, lit ? 0.55 : 0); body.add(gl);
      B.lanterns.push(Object.assign({ g, body, mat, gl, on: lit ? 1 : 0 }, Ln));
    }
    // the pages, pinned to the posts (they glow a little until they're read)
    const pageTex = TK.canvasTex(64, 80, (c, w, h) => { c.fillStyle = '#fbf6ea'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(60,50,70,0.55)'; c.lineWidth = 2; for (let y = 14; y < h - 8; y += 9) { c.beginPath(); c.moveTo(8, y); c.lineTo(w - 8 - ((y * 7) % 15), y); c.stroke(); } });
    PAGESAT.forEach(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); J.add(g);
      g.add(TK.part(Gx().cyl, '#5c4630', [0, 0.6, 0], [0.07, 1.2, 0.07], { ink: 0.008 }));
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshToonMaterial({ map: pageTex, gradientMap: TK.grad, side: THREE.DoubleSide }));
      sheet.position.set(x < 0 ? 0.09 : -0.09, 1.0, 0); sheet.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(sheet);
      const gl = glow('#fff3c8', 0.9, 0.35); gl.position.copy(sheet.position); g.add(gl);
      B.pages.push({ i, g, sheet, gl, x, z });
    });
  }
  // ---- T2: the Mirror Lake stood up as a mirror; the frame, the glass, six cracks; behind the glass, your gray reflection
  function buildT2() {
    const I = B.isles.t2, g = new THREE.Group(); g.position.set(0, 0, 0); I.g.add(g); B.t2 = { g };
    // the lake frozen at its feet (ice), and the frame
    const ice = new THREE.Mesh(new THREE.CircleGeometry(4.4, 40), new THREE.MeshToonMaterial({ color: '#c9d8e6', gradientMap: TK.grad, transparent: true, opacity: 0.85 }));
    ice.rotation.x = -Math.PI / 2; ice.position.y = 0.012; g.add(ice);
    const frameM = paperMat(I.uni, { vc: false, color: '#b8c4d4' });
    const frame = TK.part(new THREE.TorusGeometry(1, 0.06, 8, 56), null, [0, 2.35, 0], [2.6, 2.1, 1.6], { mat: frameM, ink: 0.01 }); g.add(frame);
    for (const s of [-1, 1]) g.add(TK.part(Gx().cyl, null, [s * 2.2, 0.55, 0], [0.09, 1.1, 0.09], { mat: frameM, ink: 0.01 }));
    const glass = new THREE.Mesh(new THREE.CircleGeometry(1, 56), new THREE.MeshBasicMaterial({ color: '#d6e2f0', transparent: true, opacity: 0.34, depthWrite: false, side: THREE.DoubleSide }));
    glass.scale.set(2.55, 2.05, 1); glass.position.set(0, 2.35, 0); g.add(glass); B.t2.glass = glass;
    const shine = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3.0), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }));
    shine.position.set(-0.8, 2.35, 0.02); shine.rotation.z = -0.5; g.add(shine); B.t2.shine = shine;
    // six cracks, each from its own spot
    B.t2.cracks = [];
    for (let k = 0; k < 6; k++) {
      const tex = TK.canvasTex(256, 256, (c, w, h) => { const Rr = rng(300 + k * 17); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineCap = 'round'; const ox = w * (0.25 + Rr() * 0.5), oy = h * (0.25 + Rr() * 0.5); for (let j = 0; j < 7; j++) { let x = ox, y = oy; const a = j / 7 * TAU2 + Rr(); c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y); for (let q = 0; q < 6; q++) { x += Math.cos(a + (Rr() - 0.5) * 0.9) * 16; y += Math.sin(a + (Rr() - 0.5) * 0.9) * 16; c.lineTo(x, y); } c.stroke(); } });
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
      m.scale.set(2.55, 2.05, 1); m.position.set(0, 2.35, 0.01 + k * 0.002); g.add(m); B.t2.cracks.push(m);
    }
    // your reflection: your own figure, gray (its color comes back with each thing said right)
    const h = ACTORS.hero(); G.w3d.scene.add(h.root); h.root.visible = false;      // (in the scene itself: animateHero places it in world coordinates)
    const mats = [];
    h.root.traverse(o => { if (!o.isMesh || !o.material || o.material.side === THREE.BackSide || !o.material.color) return; o.material = o.material.clone(); const c0 = o.material.color.clone(), l = c0.r * 0.3 + c0.g * 0.59 + c0.b * 0.11; mats.push({ m: o.material, c0, g: new THREE.Color(l * 0.92, l * 0.95, l * 1.04) }); });
    B.refl = { h, mats, k: 0, want: 0, S: { x: 0, ry: 0, z: 0, yaw: 0, speed: 0, phase: 0, onGround: true, land: 1, vy: 0, still: 0 }, api: { id: 'fb-refl', name: '', x: 0, y: Y0, z: 0, top: 1.95, talking: false } };
  }
  // ---- T3: the theater that night (the stage, the curtains, three rows of benches, the masks, the people behind them, the boy on the
  // stage) and Candil's little jetty with the frog, ten years later
  function buildT3() {
    const I = B.isles.t3, J = B.isles.t3j, g = I.g, pcs = [];
    // the stage (its front at z −54.3), the arch, the curtains
    pcs.push({ geo: Gx().box, m: TK.M4(0, 0.5, -6.0, 9.2, 1.0, 3.4), color: '#7a5a3c' });
    for (let k = 0; k < 16; k++) pcs.push({ geo: Gx().box, m: TK.M4(-4.3 + k * 0.575, 1.005, -6.0, 0.55, 0.01, 3.3), color: k % 2 ? '#8e6a46' : '#86623f' });
    for (const s of [-1, 1]) { pcs.push({ geo: Gx().box, m: TK.M4(s * 4.75, 2.4, -7.4, 0.5, 4.8, 0.5), color: '#5a3f2a' }); pcs.push({ geo: Gx().box, m: TK.M4(s * 3.75, 2.6, -7.2, 1.6, 4.0, 0.12), color: '#a8423a' }); }
    pcs.push({ geo: Gx().box, m: TK.M4(0, 4.95, -7.4, 10.0, 0.6, 0.6), color: '#5a3f2a' });
    pcs.push({ geo: Gx().box, m: TK.M4(0, 4.4, -7.25, 9.0, 0.8, 0.12), color: '#a8423a' });
    // the benches (three rows, facing the stage)
    [3.0, 5.45, 7.95].forEach(dz => { pcs.push({ geo: Gx().box, m: TK.M4(0, 0.42, dz, 7.6, 0.1, 0.55), color: '#6a4c34' }); pcs.push({ geo: Gx().box, m: TK.M4(0, 0.75, dz + 0.28, 7.6, 0.55, 0.08), color: '#6a4c34' }); for (const s of [-1, 1]) pcs.push({ geo: Gx().box, m: TK.M4(s * 3.6, 0.2, dz, 0.1, 0.4, 0.5), color: '#5a3f2a' }); });
    g.add(TK.part(TK.merge(pcs), null, null, null, { mat: paperMat(I.uni, { map: paperTex() }), ink: 0.02 }));
    // each row's warm light (it comes on when that row's truth is told)
    [-47.05, -44.55, -42.05].forEach((z, r) => { const gl = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 1.6), new THREE.MeshBasicMaterial({ color: '#ffcf86', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); gl.rotation.x = -Math.PI / 2; gl.position.set(0, 0.03, z - ISLES.t3.z); g.add(gl); B.rows.push({ gl, k: 0, want: 0 }); });
    // the people and their masks
    for (const [id, s] of Object.entries(SEATS)) {
      const isleId = s.jetty ? 't3j' : 't3', base = ISLES[isleId], sy = PLOOK[id].seat ? 0.36 * (PLOOK[id].h || 1) : 0;
      const P = person(id, PLOOK[id], isleId, { x: s.x, y: base.y + sy, z: s.z, yaw: s.jetty ? -Math.PI / 2 : Math.PI });
      P.api.name = plainT(pick((X().MASKS.find(m => m.id === id) || {}).name || { en: id })); B.people[id] = P;
      const mk = FBBOSS._.maskModel({ color: 'white' }); mk.root.scale.setScalar(0.82); B.root.add(mk.root);
      const top = (P.api.top || 1.3) + base.y + sy;
      // (the masks turn round to laugh at whoever comes in: their faces to you)
      B.masks[id] = { mk, x: s.x, z: s.z, y: top - 0.55, lift: RS().t3.heard[id] ? 1 : 0, yaw: s.jetty ? -Math.PI / 2 : 0, ph: id.length };
    }
    // the boy on the stage (little Elio, curled up), and young Elio on the jetty
    const boy = person('boy', PLOOK.boy, 't3', { x: 0.4, y: 1.0 + 0.3, z: -55.6, yaw: 0 }); boy.api.name = FIN.nameOf('elio'); boy.bow = true; B.people.boy = boy;
    const young = person('young', PLOOK.young, 't3j', { x: 10.6, y: 0, z: -51.4, yaw: 0.6 }); young.api.name = FIN.nameOf('elio'); B.people.young = young;
    // Candil's little jetty: planks, two posts, a lantern, the frog
    const jp = [];
    for (let k = 0; k < 6; k++) jp.push({ geo: Gx().box, m: TK.M4(-1.0 + k * 0.45, 0.02, 0, 0.42, 0.06, 2.4), color: k % 2 ? '#8a6a48' : '#7a5c3e' });
    for (const s of [-1, 1]) jp.push({ geo: Gx().cyl, m: TK.M4(1.6, 0.4, s * 1.1, 0.09, 0.8, 0.09), color: '#5c4630' });
    J.g.add(TK.part(TK.merge(jp), null, null, null, { mat: paperMat(J.uni), ink: 0.01 }));
    const frog = new THREE.Group(); frog.position.set(1.6, 0.82, 1.1); J.g.add(frog); B.frog = frog;
    frog.add(TK.part(Gx().sphere, '#6fae4f', [0, 0.14, 0], [0.24, 0.17, 0.28], { ink: 0.012 }));
    for (const s of [-1, 1]) { frog.add(TK.part(Gx().sphere, '#6fae4f', [s * 0.11, 0.31, 0.12], [0.075, 0.075, 0.075], { ink: 0.008 })); frog.add(TK.part(Gx().sphere, '#2b2235', [s * 0.11, 0.32, 0.18], [0.03, 0.03, 0.02], { ink: 0 })); }
  }
  // ---- T4: three islands of his words (six gray paper lanterns each, his word written on it), and his trapped voice in the middle
  let LGEO = null;
  const LANTERN_GEO = () => LGEO || (LGEO = new THREE.LatheGeometry([[0.2, -0.33], [0.3, -0.27], [0.37, -0.12], [0.39, 0], [0.37, 0.12], [0.3, 0.27], [0.2, 0.33]].map(([a, b]) => new THREE.Vector2(a, b)), 24));
  function buildT4() {
    for (const gId of ['g1', 'g2', 'g3']) {
      const I = B.isles[gId], l = lang(), lanterns = [];
      const keys = WORDISLE[gId].flatMap(r => [r + '.past', r + '.future']);
      keys.forEach((k, j) => {
        const a = j / 6 * TAU2 + 0.5, x = Math.cos(a) * 2.55, z = Math.sin(a) * 2.55, g = new THREE.Group(); g.position.set(x, 0, z); I.g.add(g);
        g.add(TK.part(Gx().cyl, null, [0, 0.8, 0], [0.04, 1.6, 0.04], { mat: paperMat(I.uni, { vc: false, color: '#6a5a48' }), ink: 0.006 }));
        const word = plainT(pick(FIN.echo(k) || {}, l), l) || '…';
        const tex = TK.canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#f3ead6'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a2e40'; c.textAlign = 'center'; c.textBaseline = 'middle'; let fs = 44; c.font = `700 ${fs}px Georgia, "Yu Mincho", "Microsoft YaHei", serif`; while (c.measureText(word).width > w - 20 && fs > 14) { fs -= 2; c.font = `700 ${fs}px Georgia, "Yu Mincho", "Microsoft YaHei", serif`; } c.fillText(word, w / 2, h / 2); });
        const mat = paperMat(I.uni, { vc: false, map: tex, emissive: '#000000' });
        const body = new THREE.Mesh(LANTERN_GEO(), mat); body.position.y = 1.9; g.add(body);      // (a round paper lantern, his word round its middle)
        body.add(new THREE.Mesh(body.geometry, TK.outlineMat(0.01)));
        g.add(TK.part(Gx().cyl, '#3a2c20', [0, 2.24, 0], [0.36, 0.05, 0.36], { ink: 0.006 })); g.add(TK.part(Gx().cyl, '#3a2c20', [0, 1.57, 0], [0.36, 0.05, 0.36], { ink: 0.006 }));
        const gl = glow('#ffd08a', 1.5, 0); gl.position.y = 1.9; g.add(gl);
        body.rotation.y = -a + Math.PI / 2;
        lanterns.push({ g, body, mat, gl, on: RS().t4[gId] ? 1 : 0, k });
      });
      // his trapped voice: a small gray flame of fog
      const v = new THREE.Group(); v.position.set(0, 0.9, 0); I.g.add(v);
      const fog = []; for (let j = 0; j < 6; j++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: FBBOSS._.fogTex(), transparent: true, opacity: 0.55, depthWrite: false })); sp.scale.setScalar(0.7); v.add(sp); fog.push(sp); }
      const core = glow('#d8d2ec', 1.2, 0.5); v.add(core);
      const api = { id: 'fb-' + gId, name: FIN.nameOf('elio'), x: R.x + I.I.x, y: Y0 + I.I.y + 0.6, z: R.z + I.I.z, top: 1.2, talking: false };
      B.gifts[gId] = { I, lanterns, v, fog, core, api, warm: RS().t4[gId] ? 1 : 0 };
    }
  }
  // ---- the heart of the Hush: a great ball of fog plates over its island, a small warm light inside, vines down to the paper
  function buildCore() {
    const I = B.isles.core, g = new THREE.Group(); g.position.set(0, 4.6, 0); I.g.add(g);
    const mat = new THREE.MeshToonMaterial({ color: '#6e6788', gradientMap: TK.grad }), plates = [];
    for (let j = 0; j < 34; j++) {
      const y = 1 - (j + 0.5) / 34 * 2, rr = Math.sqrt(1 - y * y), a = j * 2.399963;
      const p = TK.part(Gx().sphere, null, [Math.cos(a) * rr * 2.9, y * 2.9, Math.sin(a) * rr * 2.9], [0.95, 0.95, 0.28], { mat, ink: 0.02 });
      p.lookAt(0, 0, 0); g.add(p); plates.push({ p, a, y, rr });
    }
    const heart = glow('#ffcf86', 2.6, 0.7); heart.material.depthTest = false; g.add(heart);      // (his voice, glowing through the plates)
    const lt = new THREE.PointLight('#ffcf86', 0.8, 14, 1.6); g.add(lt);
    for (let j = 0; j < 6; j++) { const a = j / 6 * TAU2 + 0.3, v = FBBOSS._.vineMesh([[Math.cos(a) * 6.4, 0, Math.sin(a) * 6.4], [Math.cos(a + 0.3) * 4.6, 1.6, Math.sin(a + 0.3) * 4.6], [Math.cos(a + 0.55) * 3.4, 3.4, Math.sin(a + 0.55) * 3.4], [Math.cos(a + 0.7) * 2.4, 4.6, Math.sin(a + 0.7) * 2.4]], 0.12, '#6e6788', 5); I.g.add(v); }
    B.core = { g, plates, heart, lt, I };
  }

  // ------------------------------------------------------------ walking: the islands and the open ways (and what's in the way)
  function onSeg(W, x, z) {
    const [ax, az, ay] = W.a, [bx, bz, by] = W.b, dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), px = ax + dx * t, pz = az + dz * t;
    return { d: Math.hypot(x - px, z - pz), t, px, pz, y: ay + (by - ay) * t };
  }
  const wayOpen = W => (B && B.ways[W.id] ? B.ways[W.id].k > 0.98 : W.open());
  function heightAt(x, z) {
    for (const W of WAYS) if (wayOpen(W)) { const s = onSeg(W, x, z); if (s.d < W.w / 2 + 0.2) return s.y; }
    let best = null, bd = 1e9;
    for (const I of Object.values(ISLES)) { const d = Math.hypot(x - I.x, z - I.z) - I.r; if (d < bd) { bd = d; best = I; } }
    return best ? best.y : 0;
  }
  // the nearest spot you can stand on (r: your size)
  function clampWalk(x, z, r = 0.35) {
    let ok = false;
    for (const I of Object.values(ISLES)) if (Math.hypot(x - I.x, z - I.z) <= I.r - r) { ok = true; break; }
    if (!ok) for (const W of WAYS) if (wayOpen(W) && onSeg(W, x, z).d <= W.w / 2 - r * 0.6) { ok = true; break; }
    if (!ok) {
      let bx = x, bz = z, bd = 1e9;
      for (const I of Object.values(ISLES)) { const d = Math.hypot(x - I.x, z - I.z) || 1e-4, k = (I.r - r) / d, px = I.x + (x - I.x) * k, pz = I.z + (z - I.z) * k, dd = Math.hypot(px - x, pz - z); if (dd < bd) { bd = dd; bx = px; bz = pz; } }
      for (const W of WAYS) {
        if (!wayOpen(W)) continue;
        const s = onSeg(W, x, z), lim = W.w / 2 - r * 0.6, k = s.d > 1e-4 ? Math.min(1, lim / s.d) : 0, px = s.px + (x - s.px) * k, pz = s.pz + (z - s.pz) * k, dd = Math.hypot(px - x, pz - z);
        if (dd < bd) { bd = dd; bx = px; bz = pz; }
      }
      x = bx; z = bz;
    }
    for (const [x0, x1, z0, z1] of BLOCK) {
      if (x > x0 - r && x < x1 + r && z > z0 - r && z < z1 + r) {
        const L = [x - (x0 - r), (x1 + r) - x, z - (z0 - r), (z1 + r) - z], m = Math.min(...L), i = L.indexOf(m);
        if (i === 0) x = x0 - r; else if (i === 1) x = x1 + r; else if (i === 2) z = z0 - r; else z = z1 + r;
      }
    }
    return [x, z];
  }
  function teleport(x, z, yaw, y = 0) {
    const Y = G.sim.you, Mm = G.sim.mimo;
    Y.x = R.x + x; Y.z = R.z + z; Y.yaw = yaw; if ('y' in Y) Y.y = Y0 + y;
    Mm.x = Y.x + 1.0; Mm.z = Y.z + 0.6; if ('y' in Mm) Mm.y = Y0 + y; Mm.hidden = false; Mm.wander = null; Mm.station = null; Mm.look = null;
    G.sim.snap(); G.cam.snap(yaw, 0.42, 7.5);
  }

  // ------------------------------------------------------------ in and out
  // in: from the Clock Room (o.from 'top': the gray is up; the first time you wake), or up the tower after a load (o.from 'climb')
  async function enter(o = {}) {
    build();
    try { if (typeof OLDTOWER !== 'undefined' && OLDTOWER.inside) OLDTOWER._.leaveQuiet(); } catch (e) { console.error('[fb realm] leave tower', e); }
    inside = true; B.root.visible = true;
    G.w3d.setInterior({ fog: '#433e52', near: 16, far: 72 });      // (the fog is the sky's own gray at the horizon: far things dissolve into it)
    try { if (typeof TIME !== 'undefined' && TIME.look && TIME.look.on) TIME.look.off(); } catch (e) { /* */ }
    refresh();
    const S = RS(), sp = SPAWN[Math.min(6, trial())] || SPAWN[1];
    teleport(sp[0], sp[1], sp[2], sp[3]);
    try { FIN.songOverride = S.woke ? 'fb_realm' : 'fb_rage'; } catch (e) { /* */ }
    save();
  }
  function leave() {
    if (B) B.root.visible = false;
    inside = false; G.w3d.setInterior(null); G.cam.override = null;
    if (B && B.refl) B.refl.h.root.visible = false;
  }
  // put everything where the save says (lanterns lit, ways open, masks lifted, colors back)
  function refresh() {
    const S = RS(), tr = trial();
    for (const [id, w] of Object.entries(B.ways)) { w.k = w.W.open() ? 1 : 0; w.inner.scale.z = Math.max(0.001, w.k); w.g.visible = w.k > 0.01; }
    for (const [id, I] of Object.entries(B.isles)) { I.uni.want = I.I.n < tr ? 0 : 0.9; if (id === 't3' && S.t3.why) I.uni.want = 0; if (id === 't3j' && S.t3.told.ramiro) I.uni.want = 0; if (/^g\d$/.test(id) && S.t4[id]) I.uni.want = 0; I.uni.uGray.value = I.uni.want; }
    for (const Ln of B.lanterns) { const lit = Ln.lit || (Ln.his && tr > 1); Ln.on = lit ? 1 : 0; }
    B.pages.forEach(p => { p.read = !!S.t1.read[p.i]; });
    for (const [id, M] of Object.entries(B.masks)) M.lift = S.t3.heard[id] ? 1 : 0;
    const told = S.t3.told; B.rows.forEach((r, i) => { r.want = Object.entries(SEATS).some(([id, s]) => s.row === i && told[id]) ? 1 : 0; r.k = r.want; });
    B.refl.want = tr > 2 ? 1 : (S.t2.done || 0) / 6; B.refl.k = B.refl.want;
    B.t2.cracks.forEach((c, i) => { c.material.opacity = i < (S.t2.done || 0) ? 0.85 : 0; });
    B.t2.glass.visible = tr <= 2; B.t2.cracks.forEach(c => { c.visible = tr <= 2; });
    for (const [gId, Gf] of Object.entries(B.gifts)) { Gf.warm = S.t4[gId] ? 1 : 0; Gf.lanterns.forEach(L => { L.on = Gf.warm; }); }
    B.fogK = tr > 1 ? 1 : 0;
  }

  // ------------------------------------------------------------ every frame (in here)
  function update(dt, t) {
    if (!inside || !B) return;
    B.t += dt;
    if (G.sim.lock && !STORY.busy && !busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    G.fx.birds = 0;
    const Y = G.sim.you, Mm = G.sim.mimo, yx = Y.x - R.x, yz = Y.z - R.z;
    // keep you (and {mimo}) on the paper
    { const [x, z] = clampWalk(yx, yz, 0.36); Y.x = R.x + x; Y.z = R.z + z; }
    { const [x, z] = clampWalk(Mm.x - R.x, Mm.z - R.z, 0.3); Mm.x = R.x + x; Mm.z = R.z + z; }
    const S = RS(), tr = trial();
    // the islands' color, the rows' warmth, the lanterns
    for (const I of Object.values(B.isles)) I.uni.uGray.value = damp(I.uni.uGray.value, I.uni.want, 1.2, dt);
    for (const w of Object.values(B.ways)) if (!w.W.jetty) w.uni.uGray.value = damp(w.uni.uGray.value, 0.55, 1, dt);
    B.rows.forEach(r => { r.k = damp(r.k, r.want, 2, dt); r.gl.material.opacity = r.k * (0.22 + 0.05 * Math.sin(t * 2 + r.k)); });
    for (const Ln of B.lanterns) { Ln.k = damp(Ln.k || 0, Ln.on, 3, dt); Ln.gl.material.opacity = Ln.k * (0.5 + 0.08 * Math.sin(t * 5 + Ln.z)); Ln.mat.emissive.setRGB(0.48 * Ln.k, 0.29 * Ln.k, 0.08 * Ln.k); Ln.mat.color.set(Ln.k > 0.5 ? '#f5dca8' : '#8c867c'); Ln.body.rotation.z = Math.sin(t * 1.4 + Ln.z) * 0.04; }
    B.pages.forEach(p => { p.gl.material.opacity = (p.read ? 0.05 : 0.32) + 0.1 * Math.sin(t * 3 + p.i); p.sheet.rotation.z = Math.sin(t * 2.1 + p.i) * 0.05; });
    B.t1.floaters.forEach(f => { f.gl.position.y = -0.3 + Math.sin(t * 0.8 + f.ph) * 0.05; f.b.position.y = -0.42 + Math.sin(t * 0.8 + f.ph) * 0.05; f.gl.material.opacity = 0.42 + 0.1 * Math.sin(t * 2 + f.ph); });
    B.t1.green.rotation.z = Math.sin(t * 0.9) * 0.04; B.t1.blue.rotation.z = Math.sin(t * 0.8 + 1) * 0.04;
    // the scraps drifting, the far memories
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pv = new THREE.Vector3(), sv = new THREE.Vector3();
    B.scrapD.forEach((s, i) => { s.y -= s.v * dt; if (s.y < -24) s.y = 16; e.set(s.rx + t * s.w, s.ry + t * 0.3 * s.w, 0); q.setFromEuler(e); pv.set(s.x + Math.sin(t * 0.3 + i) * 0.6, s.y, s.z); sv.setScalar(s.s); mtx.compose(pv, q, sv); B.scraps.setMatrixAt(i, mtx); });
    B.scraps.instanceMatrix.needsUpdate = true;
    B.mems.forEach(m => { m.m.position.y = m.y + Math.sin(t * 0.15 + m.ph) * 1.2; });
    // the masks laugh until they're heard; then they lift away
    for (const [id, M] of Object.entries(B.masks)) {
      const heard = M.lift > 0.001, k = sm(Math.min(1, M.lift));
      M.mk.root.position.set(M.x, M.y + k * 2.6 + (heard ? 0 : Math.abs(Math.sin(t * 9 + M.ph)) * 0.05), M.z + (M.yaw === 0 ? 0.3 : 0));      // (in the realm's own coordinates)
      M.mk.root.rotation.set(-k * 1.2, M.yaw, (heard ? 0 : Math.sin(t * 14 + M.ph) * 0.1));
      M.mk.root.visible = k < 0.99; M.mk.face.material.opacity = 1;
    }
    // the people: a little bob as they talk; the boy's head down until he's told
    for (const P of Object.values(B.people)) {
      const a = P.api, talk = a.talking ? Math.abs(Math.sin(t * 12 + P.ph)) * 0.04 : 0;
      P.body.position.y = talk; P.body.rotation.z = Math.sin(t * 1.2 + P.ph) * 0.02;
      if (P.bow !== undefined) P.body.rotation.x = damp(P.body.rotation.x, P.bow ? 0.45 : 0, 3, dt);
    }
    if (B.frog) { const hp = (t * 0.6) % 3; B.frog.position.y = 0.82 + (hp < 0.4 ? Math.sin(hp / 0.4 * Math.PI) * 0.35 : 0); }
    // T4: the lanterns of his words; his voice
    for (const Gf of Object.values(B.gifts)) {
      Gf.lanterns.forEach((L, j) => { L.kk = damp(L.kk || 0, L.on, 2, dt); L.gl.material.opacity = L.kk * (0.55 + 0.1 * Math.sin(t * 3 + j)); L.mat.emissive.setRGB(0.5 * L.kk, 0.32 * L.kk, 0.1 * L.kk); L.g.rotation.y = Math.sin(t * 0.7 + j) * 0.08; });
      Gf.fog.forEach((sp, j) => { const a = t * 1.3 + j * 1.05; sp.position.set(Math.sin(a) * 0.22, Math.sin(t * 2 + j) * 0.18 + j * 0.08, Math.cos(a) * 0.22); sp.material.opacity = (0.5 - 0.3 * Gf.warm) * (0.8 + 0.2 * Math.sin(t + j)); });
      Gf.core.material.color.set(Gf.warm > 0.5 ? '#ffd08a' : '#d8d2ec'); Gf.core.material.opacity = 0.45 + 0.15 * Math.sin(t * 2.4);
    }
    // the heart: it breathes; closer, it beats
    if (B.core) { const d = Math.hypot(yx - ISLES.core.x, yz - ISLES.core.z), k = Math.max(0, 1 - d / 40), b = 1 + Math.sin(t * (1.2 + k * 3)) * 0.03 * (1 + k); B.core.g.scale.setScalar(b); B.core.g.rotation.y += dt * 0.1; B.core.heart.material.opacity = 0.5 + 0.25 * Math.sin(t * (1.2 + k * 3)); }
    // your reflection, behind the glass, while you stand before it
    reflect(dt, t, yx, yz);
    // the fog: thick on Lantern Night's jetty until his lantern is lit
    const onT1 = yz > -8 && tr <= 1;
    B.fogK = damp(B.fogK, onT1 ? 0 : 1, 0.8, dt);
    const fg = G.w3d.scene.fog; if (fg) { fg.near = lerp(4, 16, B.fogK); fg.far = lerp(24, 72, B.fogK); }
    // the music
    music(yx, yz);
    // a trial's card, the first time you set foot on its island
    if (!busy && !STORY.busy) cards(yx, yz);
  }
  function reflect(dt, t, yx, yz) {
    const Rf = B.refl, h = Rf.h, Y = G.sim.you, mz = ISLES.t2.z;
    Rf.k = damp(Rf.k, Rf.want, 1.5, dt);
    Rf.mats.forEach(o => { o.m.color.copy(o.g).lerp(o.c0, Rf.k); });
    const front = yz > mz + 0.4 && yz < mz + 9 && Math.abs(yx) < 3.2 && trial() <= 2;
    h.root.visible = front;
    if (!front) return;
    const Sx = Rf.S;
    Object.assign(Sx, { x: Y.x, z: R.z + 2 * mz - yz, ry: Y.ry !== undefined ? Y.ry : Y0, yaw: Math.PI - Y.yaw, speed: Y.speed || 0, phase: Y.phase || 0, onGround: Y.onGround !== false, land: Y.land === undefined ? 1 : Y.land, vy: Y.vy || 0, still: Y.still || 0 });
    try { ACTORS.animateHero(h, Sx, dt, t); } catch (e) { h.root.position.set(Sx.x, Sx.ry, Sx.z); h.root.rotation.y = Sx.yaw; }
    Object.assign(Rf.api, { x: Sx.x, y: Sx.ry, z: Sx.z });
  }
  // ---- the music: «Inside the Silence» follows the trial (FBM.state.trial / prog); the drone until you wake; the core's own fight
  function music(yx, yz) {
    if (typeof FBM === 'undefined') return;
    if (typeof FBCORE !== 'undefined' && FBCORE.busy) return;
    const S = RS(), tr = trial(), own = { 2: 'fb_t2', 3: 'fb_t3', 4: 'fb_t4' }[tr];      // (the middle trials have songs of their own)
    try { FIN.songOverride = !S.woke ? 'fb_rage' : own && Sound.songs && Sound.songs.includes(own) ? own : 'fb_realm'; } catch (e) { /* */ }
    let p = 0;
    if (tr === 1) p = Math.min(1, Object.keys(S.t1.read).length / 4 * 0.8);
    else if (tr === 2) p = (S.t2.done || 0) / 6;
    else if (tr === 3) p = (Object.keys(S.t3.told).length + (S.t3.why ? 1 : 0)) / 6;
    else if (tr === 4) p = ['g1', 'g2', 'g3'].filter(g => S.t4[g]).length / 3;
    else p = Math.max(0, Math.min(1, 1 - (Math.hypot(yx - ISLES.core.x, yz - ISLES.core.z) - 6) / 30));
    FBM.state.trial = Math.min(5, tr); FBM.state.prog = p;
  }
  // ---- a trial's card on its island the first time (title in the language, what to do in English)
  function cards(yx, yz) {
    const S = RS(), tr = trial(), on = id => { const I = ISLES[id]; return Math.hypot(yx - I.x, yz - I.z) < I.r - 0.6; };
    const show = (key, card, thought) => { if (S.cards[key]) return; S.cards[key] = true; save(); STORY.run(async () => { await UI.chapter(plainT(pick(card.title)), card.sub); if (thought) { await stampClear(); think(thought, 6); } }); };
    if (tr === 1 && S.woke && (on('t1') || (yz < 12 && yz > -7))) show('t1', X().CARDS.t1, X().YOU.t1);
    else if (tr === 2 && on('t2')) show('t2', X().CARDS.t2, X().YOU.t2);
    else if (tr === 3 && on('t3')) show('t3', X().CARDS.t3, X().YOU.t3);
    else if (tr === 4 && on('g1')) show('t4', X().CARDS.t4, X().YOU.t4);
    else if (tr === 5 && on('core')) show('core', X().CARDS.core, X().YOU.core);
  }

  // ------------------------------------------------------------ what you can press E on in here
  function interactables() {
    if (!inside || !B || busy) return [];
    const S = RS(), tr = trial(), out = [], W = (x, z, y, r, label, run) => out.push({ x: R.x + x, z: R.z + z, y: Y0 + y, r, label, run });
    if (tr === 1 && S.woke) {
      B.pages.forEach(p => W(p.x * 0.75, p.z, 0, 1.4, S.t1.read[p.i] ? 'Read the page again' : 'Read the page', () => readPage(p.i)));
      B.lanterns.forEach(Ln => W(Ln.x * 0.8, Ln.z, 0, 0.95, Ln.lit ? 'Look at the lantern' : 'Light this lantern', () => chooseLantern(Ln)));
    }
    if (tr === 2) W(0, ISLES.t2.z + 2.6, 0, 2.4, 'Speak to your reflection', mirror);
    if (tr === 3) {
      for (const [id, s] of Object.entries(SEATS)) {
        if (S.t3.heard[id]) continue;
        if (s.jetty && !S.t3.why) continue;
        W(s.x, s.z + (s.jetty ? 0 : 1.2), 0, 1.7, 'Listen to the laugh', () => listen(id));
      }
      const theater = ['rosita', 'nacho', 'felix', 'aurora'];
      if (!S.t3.why && theater.every(id => S.t3.told[id])) W(0.4, -53.6, 0, 2.2, 'Talk to the boy', boyTalk);
    }
    if (tr === 4) for (const gId of ['g1', 'g2', 'g3']) { const I = ISLES[gId], prev = gId === 'g1' || S.t4[gId === 'g2' ? 'g1' : 'g2']; if (!S.t4[gId] && prev) W(I.x, I.z + 1.0, I.y, 1.8, 'Listen to his voice', () => gift(gId)); }
    if (tr === 5) W(ISLES.core.x, ISLES.core.z + 2.4, ISLES.core.y, 3.0, 'Face the heart of the Hush', core);
    return out;
  }
  // where {mimo} points (the quest arrow)
  function target() {
    if (!inside) return null;
    const S = RS(), tr = trial(), T = (x, z, hint) => ({ x: R.x + x, z: R.z + z, hint });
    if (!S.woke) return null;
    if (tr === 1) { const p = B.pages.find(p0 => !S.t1.read[p0.i]); if (p) return T(p.x, p.z, '{mimo} points at a page pinned to a post on the jetty.'); return T(0, -2, '{mimo} looks along the lanterns on the jetty. Which one is his?'); }
    if (tr === 2) return T(0, ISLES.t2.z + 2.6, '{mimo} stares at the mirror. Someone is standing in it.');
    if (tr === 3) {
      const id = ['rosita', 'nacho', 'felix', 'aurora'].find(k => !S.t3.heard[k]); if (id) return T(SEATS[id].x, SEATS[id].z + 1.2, '{mimo} flattens its ears at the laughing masks.');
      if (!S.t3.why) return T(0.4, -53.6, '{mimo} looks at the boy on the stage.');
      return T(SEATS.ramiro.x, SEATS.ramiro.z, '{mimo} hears another laugh, on the little jetty.');
    }
    if (tr === 4) { const g = ['g1', 'g2', 'g3'].find(k => !S.t4[k]); if (g) return T(ISLES[g].x, ISLES[g].z, '{mimo} follows the gray lanterns down.'); }
    if (tr === 5) return T(ISLES.core.x, ISLES.core.z + 2.4, '{mimo} growls at the heart of the Hush.');
    return null;
  }
  const song = () => null;      // (FIN.songOverride carries it)
  const areaAt = () => (inside ? { id: 'fb-realm', name: 'Inside the Hush', color: '#8d84b8' } : null);

  // ------------------------------------------------------------ T1 «Sin voz»: the pages, the lanterns
  async function readPage(i) {
    const P = X().PAGES[i], l = lang(), who = plainT(pick(P.who, l), l), text = fillM(pick(P.text, l), l), en = P.text.en;
    const body = isC(l) ? FIN.tHTML(text, l) : esc(text);
    snd('page');
    await UI.card(`<div class="tag">${esc(who)}</div><div class="caption">${body}</div><div class="row"><button data-act="say" data-text="${esc(isC(l) ? text : plainT(text, l))}">🔊</button><button data-act="en">EN</button></div><div class="en">${esc(en)}</div><div class="sub">E to close</div>`, { kind: 'page' });
    const S = RS(), first = !S.t1.read[i]; S.t1.read[i] = true; save();
    const n = Object.keys(S.t1.read).length;
    if (first && n === 1) think('A page from that night… There are more on the posts. Read them all, then find his lantern.', 6);
    else if (first && n === 4) think('All four pages. Now: which lantern is his?', 5);
    try { G.sim.mimoSay('…', 1.2); } catch (e) { /* */ }
  }
  async function chooseLantern(Ln) {
    const S = RS();
    if (Object.keys(S.t1.read).length < 4) { think('Read the pages first: four of them, pinned to the jetty’s posts.', 4.5); return; }
    if (!Ln.his) {
      busy = true; lock(true);
      try {
        snd('wrong'); try { G.sim.mimo.tiltT = 1.4; } catch (e) { /* */ }
        await FBBOSS._.grayOn(700);
        teleport(0, 13.2, Math.PI, 0);
        await FBBOSS._.grayOff(900);
        think(X().YOU.t1wrong, 5);
        S.t1.wrong = (S.t1.wrong || 0) + 1; save();
      } finally { lock(false); busy = false; }
      return;
    }
    busy = true; lock(true);
    try {
      shot([Ln.x - 2.6, 1.9, Ln.z + 3.2], [Ln.x, 1.1, Ln.z], 0.9); await wait(0.9);
      snd('chime'); Ln.on = 1; G.w3d.fx.sparkle(R.x + Ln.x, Y0 + 1.1, R.z + Ln.z, 18, ['#ffd98a', '#fff3c8']);
      await wait(1.2); think(X().YOU.t1light, 4.5); await wait(1.6);
      // the fog lifts; the jetty's color comes back; your voices
      RS().trial = 2; save();
      B.isles.t1.uni.want = 0; B.isles.wake.uni.want = 0;
      shot([4.5, 3.2, 12], [0, 0.6, -2], 1.6); await wait(1.8);
      await stampClear();
      await FIN.you(X().YOU.voiceBack);
      try { G.sim.mimoSay('!!', 1.4); } catch (e) { /* */ } snd('chirp');
      G.cam.override = null;
      await openWay('w1');
    } finally { lock(false); busy = false; }
  }

  // ------------------------------------------------------------ T2 «El espejo»: six things your reflection says wrong
  const RANK = { S: 5, A: 4, B: 3, C: 2, D: 1 };
  const hasTask = T => { const l = lang(); return !!(T && T.want && T.want[l] && T.frame && T.frame[l] !== undefined && T.model && T.model[l]); };
  // a word {mimo} keeps missing (the most misses and hints, seen at least once)
  function weakWord() {
    try {
      const l = lang(); let best = null, bs = 1;
      for (const id of LEX.ids()) {
        if (!/^w\./.test(id)) continue; const it = LEX.item(id); if (!it || !it.en || (!isC(l) && !it[l])) continue;
        const s = LEX.st(id); if (!s || !s.seen) continue; const sc = (s.bad || 0) * 2 + (s.hints || 0);
        if (sc > bs) { bs = sc; best = id; }
      }
      return best;
    } catch (e) { return null; }
  }
  function pickItems() {
    const out = [], E = (G.state.ch4 && G.state.ch4.echoes) || {}, RU = X().RUNGS, SL = X().SLIPS;
    const graded = Object.keys(RU).filter(k => hasTask(RU[k]) && E[k]).sort((a, b) => (RANK[E[a]] || 0) - (RANK[E[b]] || 0));
    for (const k of graded.filter(k0 => (RANK[E[k0]] || 5) <= 3).slice(0, 3)) out.push({ kind: 'rung', key: k });
    const w = weakWord(); if (w) out.push({ kind: 'word', id: w });
    const tally = st().slips || {};
    for (const k of Object.keys(tally).filter(k0 => SL[k0] && hasTask(SL[k0]) && tally[k0] > 0).sort((a, b) => tally[b] - tally[a]).slice(0, 2)) out.push({ kind: 'slip', key: k });
    // (a standard B2 set fills the rest: the hardest rungs first)
    for (const k of ['marsh.future', 'ruins.future', 'peaks.past', 'ruins.past', 'port.future', 'quarry.past', 'gardens.future', 'lake.future', 'port.past', 'marsh.past']) {
      if (out.length >= 6) break; if (hasTask(RU[k]) && !out.some(o => o.key === k)) out.push({ kind: 'rung', key: k });
    }
    return out.slice(0, 6);
  }
  // the task for an item (a word: the template, filled in with the word)
  function taskOf(it) {
    if (it.kind === 'rung') return X().local(X().RUNGS[it.key], lang());
    if (it.kind === 'slip') return X().local(X().SLIPS[it.key], lang());
    const l = lang(), w = it.id && LEX.item(it.id);
    if (!w) return null;
    const form = isC(l) ? LEX.src(it.id) : LEX.form(it.id), withArt = isC(l) ? form : LEX.form(it.id, { article: true });
    const Tw = X().TASKS.word, en = w.en || '';
    return Object.assign({}, Tw, { title: String(Tw.title || '').replace('{en}', en), frame: { [l]: '___' }, chips: { [l]: [] }, model: { en, [l]: withArt },
      want: { [l]: withArt !== form ? [form, withArt] : [form] }, refl: { en: String(X().SCENE['refl.forgot'].en).replace('{en}', en), [l]: String(pick(X().SCENE['refl.forgot'], l)).replace('{en}', en) }, lex: it.id });
  }
  async function mirror() {
    const S = RS(), T2 = S.t2;
    if (!T2.items || !T2.items.length) { T2.items = pickItems(); save(); }
    const items = T2.items, Rf = B.refl;
    busy = true; lock(true);
    try {
      Rf.api.name = nameOf('refl');
      shot([1.6, 2.0, ISLES.t2.z + 6.2], [0, 1.6, ISLES.t2.z - 0.6], 0.9); await wait(0.8);
      if (!T2.done) await FIN.say(Rf.api, X().SCENE['refl.hi']);
      for (let i = T2.done || 0; i < items.length; i++) {
        const T = taskOf(items[i]); if (!T) { T2.done = i + 1; continue; }
        await sayTL(Rf.api, T.refl);              // (your own slip said back to you: in the language at any weave, so you can see what to fix)
        G.cam.override = null;
        const r = await FIN.ask(T, { icon: 'star', title: `${items[i].kind === 'word' ? '' : 'Say it right · '}${T.title || X().rungOf(T, lang())}` });
        T2.done = i + 1; T2.grades = T2.grades || []; T2.grades[i] = r.letter; save();
        // the crack; a little of its color back
        snd('crack'); const c = B.t2.cracks[i]; if (c) tween(0.5, k => { c.material.opacity = 0.85 * k; });
        Rf.want = (i + 1) / items.length; G.w3d.fx.sparkle(R.x, Y0 + 2.4, R.z + ISLES.t2.z + 0.2, 10, ['#e8f0ff', '#ffffff']);
        if (T.lex) { try { LEX.attempt(T.lex, { ok: r.letter === 'S' || r.letter === 'A', hints: r.letter === 'D' ? 3 : 0, ms: 6000, mode: 'review' }); } catch (e) { /* */ } }
        shot([1.6, 2.0, ISLES.t2.z + 6.2], [0, 1.6, ISLES.t2.z - 0.6], 0.6); await wait(0.6);
        if (i < items.length - 1) await FIN.say(Rf.api, X().SCENE['refl.again']);
      }
      Rf.want = 1; await wait(0.8);
      await FIN.say(Rf.api, X().SCENE['refl.end']);
      await FIN.say(Rf.api, X().SCENE['refl.bye']);
      // the mirror breaks into light; the island's color comes back
      snd('crack'); FBBOSS._.flash(0.5);
      for (let k = 0; k < 3; k++) G.w3d.fx.sparkle(R.x + (k - 1) * 1.2, Y0 + 2.3, R.z + ISLES.t2.z, 14, ['#e8f0ff', '#ffffff', '#cfe0ff']);
      B.t2.glass.visible = false; B.t2.cracks.forEach(c0 => { c0.visible = false; }); B.refl.h.root.visible = false;
      RS().trial = 3; save(); B.isles.t2.uni.want = 0;
      G.cam.override = null;
      await openWay('w2');
    } finally { lock(false); busy = false; G.cam.override = null; }
  }

  // ------------------------------------------------------------ T3 «La risa»: listen, then tell the boy
  async function listen(id) {
    const S = RS(), M = X().MASKS.find(m => m.id === id), P = B.people[id], mk = B.masks[id], s = SEATS[id];
    if (!M || !P || !mk) return;
    busy = true; lock(true);
    try {
      const base = ISLES[s.jetty ? 't3j' : 't3'], side = s.x < 0 ? -1 : 1;
      // (everyone in the hall faces the stage: from in front of them, a little to the side, so you see the face under the mask and no
      // one stands in the way; the back row's from between the two kids in the front row)
      const at = s.jetty ? [s.x - 3.2, 1.9, s.z + 1.4] : s.stand ? [s.x - 2.2, 1.9, s.z - 2.0] : s.row === 1 ? [s.x + 0.3, 2.5, s.z - 3.0] : [s.x + side * 1.2, 2.0, s.z - 2.8];
      shot([at[0], at[1] + base.y, at[2]], [s.x, (s.stand || s.jetty ? 1.2 : 1.05) + base.y, s.z], 0.8); await wait(0.8);
      if (!S.t3.first) { S.t3.first = true; think(X().YOU.t3listen, 5); await wait(1.2); }
      snd('page'); await tween(1.0, k => { mk.lift = k; });
      S.t3.heard[id] = true; save();
      await sayTL(P.api, X().saidOf(M, lang()));      // (what they really said is what you report: in the language at any weave)
      G.cam.override = null;
      const T = X().local(M.task, lang()), r = await FIN.ask(T, { icon: 'star', title: T.title || 'Tell him what they said' });
      S.t3.told[id] = r.letter; save();
      snd('chime');
      if (s.row >= 0) B.rows[s.row].want = 1;
      if (!s.jetty) { const n = ['rosita', 'nacho', 'felix', 'aurora'].filter(k => S.t3.told[k]).length; B.isles.t3.uni.want = 0.9 - 0.18 * n; if (n === 4) think('Everyone told. Now the boy on the stage.', 4); }
      else await youngElio();
    } finally { lock(false); busy = false; G.cam.override = null; }
  }
  async function boyTalk() {
    const S = RS(), boy = B.people.boy;
    busy = true; lock(true);
    try {
      shot([2.6, 2.4, -50.6], [0.4, 1.6, -55.6], 0.9); await wait(0.8);
      await FIN.say(boy.api, X().SCENE['boy.ask']);
      G.cam.override = null;
      const Tw = X().local(X().TASKS.why, lang()), r = await FIN.ask(Tw, { icon: 'star', title: Tw.title });
      S.t3.why = r.letter; save();
      boy.bow = false; if (boy.grin) boy.grin.visible = true;
      shot([2.6, 2.4, -50.6], [0.4, 1.6, -55.6], 0.6); await wait(0.6);
      await FIN.say(boy.api, X().SCENE['boy.smile']);
      B.isles.t3.uni.want = 0; snd('chime');
      await wait(0.6);
      think(X().YOU.t3jetty, 5.5);
    } finally { lock(false); busy = false; G.cam.override = null; }
  }
  async function youngElio() {
    const y = B.people.young;
    shot([8.4, 1.8, -47.6], [11.0, 1.2, -50.6], 0.8); await wait(0.7);
    await sayElio(y.api, X().SCENE['elio.young']);
    if (y.grin) y.grin.visible = true;
    B.isles.t3j.uni.want = 0; snd('chime');
    RS().trial = 4; save();
    G.cam.override = null;
    await openWay('w3');
  }

  // ------------------------------------------------------------ T4 «Sus palabras»: give him back his words (T4d's gifts, used as is)
  async function gift(gId) {
    const S = RS(), Gf = B.gifts[gId];
    busy = true; lock(true);
    try {
      const I = ISLES[gId];
      shot([I.x + 3.2, I.y + 2.2, I.z + 4.0], [I.x, I.y + 1.2, I.z], 0.9); await wait(0.8);
      const r = await FIN.giveBack(gId, { who: Gf.api, pickTitle: 'Which of his words answers that?', onGiven: async () => { Gf.warm = 1; Gf.lanterns.forEach((L, j) => setTimeout(() => { L.on = 1; snd('chime'); }, j * 180)); B.isles[gId].uni.want = 0; } });
      S.t4[gId] = (r && r.letter) || 'B'; save();
      G.cam.override = null;
      if (gId === 'g3') { S.trial = 5; save(); await openWay('w6'); await stampClear(); think('The way goes down… to the heart of the Hush.', 5); }
      else await openWay(gId === 'g1' ? 'w4' : 'w5');
    } finally { lock(false); busy = false; G.cam.override = null; }
  }

  // ------------------------------------------------------------ the heart (fb_core.js): its fight, then the aftermath
  async function core() {
    if (typeof FBCORE === 'undefined' || !FBCORE) { await aftermath(); return; }
    const r = await FBCORE.fight();
    if (r === 'win') await aftermath();
  }

  // ------------------------------------------------------------ the aftermath, in the Clock Room: the gray drains off him, Noa comes out
  // of the clock, your words fly back to {mimo}, Bruno thaws; then T4d's clock at eight (next)
  const mine = [];
  async function aftermath() {
    const S = st(); S.stage = 'done'; S.done = true; RS().trial = 6; save();
    busy = true; lock(true);
    let handed = false;
    try {
      leave();
      OLDTOWER._.enterAt(8);      // (it builds the tower's rooms the first time)
      const room = OLDTOWER._.rooms[8];
      const Rr = room.R, C = room.clock, F = room.fig;
      if (F) F.root.visible = false;
      (room.mist || []).forEach(m => { m.sp.visible = false; });
      const fx = F ? F.root.position.x : Rr.x + 0.5, fz = F ? F.root.position.z : Rr.z - 3.4;
      const E = FIN.person('elio', FIN.ELIO_LOOK, room.g, { x: fx, y: Y0, z: fz, yaw: 0.2 }); E.api.name = FIN.nameOf('elio'); mine.push(E);
      const Bp = FIN.person('bruno', FIN.BRUNO_LOOK, room.g, { x: Rr.x + 2.3, y: Y0, z: Rr.z - 3.6, yaw: -0.4 }); Bp.api.name = FIN.nameOf('bruno'); mine.push(Bp);
      // (both still gray from the Hush: Elio's drains off him as his voice comes back, Bruno's last, when he thaws)
      const grayM = new THREE.MeshToonMaterial({ color: '#8a8698', gradientMap: TK.grad }), keep = [], keepE = [];
      const grayOut = (P, into) => P.g.traverse(o => { if (o.isMesh && o.material && o.material.side !== THREE.BackSide && o.material.type !== 'MeshBasicMaterial') { into.push([o, o.material]); o.material = grayM; } });
      grayOut(Bp, keep); grayOut(E, keepE); if (E.grin) E.grin.visible = false;
      const Y = G.sim.you; Y.x = Rr.x - 0.8; Y.z = Rr.z + 0.6; Y.yaw = Math.PI; G.sim.mimo.x = Rr.x + 0.4; G.sim.mimo.z = Rr.z + 0.9; G.sim.snap();
      FIN.shot(V(Rr.x + 3.0, Y0 + 2.0, Rr.z + 2.4), V(Rr.x + 0.2, Y0 + 1.5, Rr.z - 3.6), 0.1);
      // (the silence after the core's last hit: the song has stopped; we come out of the white)
      await whiteOff(1600);
      await wait(0.8);
      // the gray drains off him, and his voice: he smiles (the grin over his beard)
      keepE.forEach(([o, m]) => { o.material = m; }); if (E.grin) E.grin.visible = true;
      for (let i = 0; i < 3; i++) G.w3d.fx.sparkle(fx, Y0 + 0.6 + i * 0.5, fz, 10, ['#ffd98a', '#fff3c8', '#ffffff']); snd('chime');
      await wait(0.6);
      await sayElio(E.api, FINTXT.LINES['elio.voice']);
      // the glass melts, and Noa steps out
      let N = null;
      if (C) {
        await tween(1.4, k => { C.glass.material.opacity = (1 - k) * 0.5; C.nglow.material.opacity = 1 - k; });
        if (C.noa) C.noa.g.visible = false;
      }
      N = FIN.person('noa', FIN.NOA_LOOK, room.g, { x: Rr.x - 0.7, y: Y0, z: Rr.z - 4.0, yaw: 0.4 }); N.api.name = FIN.nameOf('noa'); mine.push(N);
      G.w3d.fx.sparkle(Rr.x - 0.7, Y0 + 1.2, Rr.z - 4.0, 16, ['#8fe8b8', '#fff3c8']); snd('chime');
      await FIN.say(N.api, FINTXT.LINES['noa.free']);
      await sayElio(E.api, FINTXT.LINES['elio.book']);
      await FIN.say(N.api, FINTXT.LINES['noa.book']);
      // your words fly out of the notebook, back to {mimo}
      think((FINTXT.YOU && FINTXT.YOU.wordsBack) || X().YOU.wordsBack, 5);
      for (let i = 0; i < 14; i++) { const k = i / 13, x = lerp(Rr.x - 0.5, G.sim.mimo.x, k), z = lerp(Rr.z - 3.8, G.sim.mimo.z, k); G.w3d.fx.sparkle(x, Y0 + 1.2 + Math.sin(k * Math.PI) * 1.2, z, 3, ['#ffd98a', '#9db8ff', '#8fe8b8']); if (i % 3 === 0) snd('chime'); await wait(0.1); }
      try { G.sim.mimoSay('!!', 1.4); } catch (e) { /* */ } snd('chirp');
      await wait(0.8);
      // Bruno thaws
      keep.forEach(([o, m]) => { o.material = m; }); G.w3d.fx.sparkle(Rr.x + 2.3, Y0 + 1.3, Rr.z - 3.6, 12, ['#ffffff', '#cfe0ff']); snd('crack');
      await FIN.say(Bp.api, X().SCENE['b.thaw']);
      try { FIN.songOverride = null; } catch (e) { /* */ }
      try { if (typeof FBM !== 'undefined') Object.assign(FBM.state, { elio: false, fin: false, end: false, trial: 0, prog: 0 }); } catch (e) { /* */ }
      lock(false); busy = false; handed = true;
      const next = NEXT || (o => FIN.won(o));
      await next({ elio: E, noa: N, bruno: Bp });
    } catch (e) {
      console.error('[fb realm] aftermath', e);
      // (a scene that broke never leaves you stuck: out of the white, and on to the clock)
      if (!handed) { handed = true; lock(false); busy = false; try { await whiteOff(400); FIN.songOverride = null; await (NEXT || (o => FIN.won(o)))({}); } catch (e2) { console.error('[fb realm] aftermath, next', e2); } }
    }
    finally {
      mine.splice(0).forEach(P => { if (P.g.parent) P.g.parent.remove(P.g); });
      if (!handed) { lock(false); busy = false; }
      try { FIN.songOverride = null; } catch (e) { /* */ }
    }
  }
  // a white screen of our own (the core's last hit ends in white; fb_core.js turns it on)
  function whiteOn(ms = 300) {
    let el = document.getElementById('fbr-white');
    if (!el) { el = document.createElement('div'); el.id = 'fbr-white'; el.style.cssText = 'position:fixed;inset:0;z-index:62;pointer-events:none;background:#fffaf0;opacity:0'; document.body.appendChild(el); }
    el.style.transition = `opacity ${ms}ms ease-out`; void el.offsetWidth; el.style.opacity = '1';
    return new Promise(r => setTimeout(r, ms));
  }
  function whiteOff(ms = 1200) {
    const el = document.getElementById('fbr-white'); if (!el) return Promise.resolve();
    el.style.transition = `opacity ${ms}ms ease-in`; el.style.opacity = '0';
    return new Promise(r => setTimeout(() => { el.remove(); r(); }, ms));
  }

  // ------------------------------------------------------------ the seam (FIN.bossSlot): the top, then in here
  async function run() {
    const S = st();
    if (S.stage === 'done') { const next = NEXT || (o => FIN.won(o)); return next({}); }
    if (S.stage !== 'realm') { const ok = await FBBOSS.top(); if (!ok) return; }
    await enter({ from: 'top' });
    if (!RS().woke) await wake();
    else { try { if (document.getElementById('fb-gray')) await FBBOSS._.grayOff(900); } catch (e) { /* */ } }
  }
  // «Face the Hush» after you ran from the top (its E already runs inside STORY.run)
  const resume = () => run();
  async function wake() {
    busy = true; lock(true);
    try {
      const sp = SPAWN[1]; teleport(sp[0], sp[1], sp[2], sp[3]);
      shot([1.6, 1.6, 33.6], [0, 0.6, 29.0], 0.1);
      try { G.sim.mimo.tiltT = 2; } catch (e) { /* */ }
      if (document.getElementById('fb-gray')) await FBBOSS._.grayOff(2600);
      await wait(0.6);
      await stampClear();
      await FIN.you(X().YOU.wake);
      try { G.sim.mimoSay('…', 1.6); } catch (e) { /* */ }
      await wait(1.2);
      G.cam.override = null;
      RS().woke = true; save();
      try { FIN.songOverride = 'fb_realm'; } catch (e) { /* */ }
      await UI.chapter(plainT(pick(X().CARDS.realm)), 'No voice. No sound. Find your way through.');
    } finally { lock(false); busy = false; G.cam.override = null; }
  }

  // ------------------------------------------------------------ the fights' slips (T2's tally: kinds of mistakes, per language)
  const SLIPKIND = { es: { gender: 'gender', article: 'gender', stressedA: 'gender', serestar: 'serestar', prep: 'prep', ending: 'ending', verbform: 'ending' },
    pt: { gender: 'gender', article: 'gender', prep: 'prep', ending: 'ending', verbform: 'ending', serestar: 'serestar' },
    de: { gender: 'gender', article: 'gender', case: 'case', prep: 'prep', ending: 'ending', verbform: 'ending' },
    zh: { measure: 'measure', order: 'order', particle: 'particle', yong: 'particle', deP: 'particle' },
    ja: { particle: 'particle', teForm: 'teForm', verbform: 'teForm', order: 'particle' } };
  function tally() {
    try {
      const M = (BATTLE._.api.G.mistakes || []), map = SLIPKIND[lang()] || {}, S = st(), T = S.slips || (S.slips = {});
      for (const m of M) for (const k of new Set([m.kind].concat(m.errors || []))) { const s = map[k]; if (s) T[s] = (T[s] || 0) + (m.times || 1); }
    } catch (e) { /* */ }
  }
  function hookBattle() {
    if (typeof BATTLE === 'undefined' || !BATTLE.start || BATTLE.start._fbr) return;
    const s0 = BATTLE.start;
    BATTLE.start = function () { const p = s0.apply(this, arguments); try { Promise.resolve(p).then(() => tally(), () => {}); } catch (e) { /* */ } return p; };
    BATTLE.start._fbr = true;
  }

  // ------------------------------------------------------------ the quest's steps, the story's line, T4d's hooks
  function hookFinale() {
    FIN.bossSlot = async next => { NEXT = next; return run(); };
    FIN.bossDone = s => !!(s && s.fb && s.fb.stage === 'done');
    if (typeof CH4 !== 'undefined' && CH4.FINALE && !CH4.FINALE.some(s0 => s0.fin === 'fb.top')) {
      const i = CH4.FINALE.findIndex(s0 => s0.fin === 'climb');
      const towerT = () => { try { if (OLDTOWER.inside) return OLDTOWER.target(); return Object.assign(OLDTOWER.doorSpot(), { hint: '{mimo} looks up at the Old Tower’s door.' }); } catch (e) { return null; } };
      // (one step for the top, one for each trial, one for the heart: the tracker moves on as each ends. The heart's ends with T4d's
      // 'top' when won() runs, so its one stamp comes then and never over the aftermath's silence and Elio's first words)
      const tr0 = s => (s && s.fb && s.fb.realm && s.fb.realm.trial) || 1, doneAll = s => !!(s && s.fb && s.fb.stage === 'done');
      const inT = () => (inside ? target() : towerT());
      const steps = [
        { fin: 'fb.top', text: 'The top of the Old Tower: the Hush', why: 'The Hush is wearing Elio like a coat, up by the great clock. Fight it: every hit lands on its fog, never on him.',
          done: s => !!(s.fb && s.fb.stage && s.fb.stage !== 'top'), target: () => towerT(), hint: '{mimo} looks up at the Old Tower.' },
        { fin: 'fb.t1', text: 'Inside the Hush: no voice', why: 'The Hush swallowed you and {mimo}. No voice, no sound: on Lantern Night’s jetty, four pages say which lantern is his. Read them, then light it.',
          done: s => doneAll(s) || tr0(s) > 1, target: inT, hint: '{mimo} looks around the gray.' },
        { fin: 'fb.t2', text: 'Inside the Hush: the mirror', why: 'Your gray reflection says things wrong, the way you tend to. Say each one right.',
          done: s => doneAll(s) || tr0(s) > 2, target: inT, hint: '{mimo} stares at the mirror.' },
        { fin: 'fb.t3', text: 'Inside the Hush: the laugh', why: 'The theater, that night. Listen to each laughing mask, then tell the boy on the stage what they really said.',
          done: s => doneAll(s) || tr0(s) > 3, target: inT, hint: '{mimo} flattens its ears at the masks.' },
        { fin: 'fb.t4', text: 'Inside the Hush: his words', why: 'His words hang like gray lanterns. On each island his trapped voice says an old line: give him back his own words.',
          done: s => doneAll(s) || tr0(s) > 4, target: inT, hint: '{mimo} follows the gray lanterns down.' },
        { fin: 'fb.core', text: 'The heart of the Hush', why: 'At the bottom of the silence, a small warm light: his voice. Break the heart around it, together.',
          done: s => doneAll(s) && !!(s.ch4 && s.ch4.fin && s.ch4.fin.top), target: inT, hint: '{mimo} growls at the heart of the Hush.' },
      ];
      steps.forEach(s0 => { s0._fdone = s0.done; });
      const climb = CH4.FINALE[i];
      CH4.FINALE.splice(i + 1, 0, ...steps);
      // (if the main quest already took the finale's steps, ours go in after the climb there too)
      try { const main = QUESTS.LIST.find(q => q.id === 'main'), k = main ? main.steps.indexOf(climb) : -1; if (k >= 0 && !main.steps.some(s0 => s0.fin === 'fb.top')) main.steps.splice(k + 1, 0, ...steps); } catch (e) { /* */ }
    }
    if (typeof CH4 !== 'undefined' && CH4.FINALE_STORY) {
      const L0 = CH4.FINALE_STORY.find(x => /three of his own words/.test(x.text));
      const mineL = { when: s => !!(s.fb && s.fb.stage === 'done'), text: 'At the top of the Old Tower the Hush fought you through Elio, and when you wouldn’t go quiet, it swallowed you. Inside its silence you read your way through the fog, faced your own mistakes, heard why they had really laughed, and gave Elio back his words. Then, together, you broke its heart: his voice came back, and Noa stepped out of the great clock.' };
      if (L0) Object.assign(L0, mineL); else CH4.FINALE_STORY.unshift(mineL);
    }
  }
  // tests: ?fin=top | t1 | t2 | t3 | t4 | core seeds a save that reached the finale (FIN's own setup, the climb done) and puts you at
  // the tower's door (top) or in here at that trial, so the quest tracker shows the real steps
  const SEED = (typeof location !== 'undefined' && (location.search.match(/[?&]fin=(top|t1|t2|t3|t4|core)\b/) || [])[1]) || null;
  function seed(which) {
    try {
      FIN._.t.setup(); FIN._.t.at('top');
      if (which === 'top') { FIN._.t.near('door'); save(); return; }
      api._.t.at({ t1: 1, t2: 2, t3: 3, t4: 4, core: 5 }[which] || 1).then(() => { try { QUESTS.tick(); } catch (e) { /* */ } });
    } catch (e) { console.error('[fb realm] seed', e); }
  }
  function init(game) {
    G = game;
    hookFinale(); hookBattle();
    if (SEED && !init.seeded) { init.seeded = true; let done = false; STORY.extra = STORY.extra || []; STORY.extra.push({ tick() { if (done) return; done = true; seed(SEED); } }); }
  }
  if (typeof STORY !== 'undefined' && STORY.init && !STORY.init._fbr) {
    const i0 = STORY.init;
    STORY.init = function (game) { const v = i0.apply(this, arguments); try { init(game); } catch (e) { console.error('[fb realm] init', e); } return v; };
    STORY.init._fbr = true;
  }

  const api = {
    init, run, resume, enter, leave, update, interactables, target, song, areaAt, R, Y0, aftermath, whiteOn, whiteOff,
    get OUTSIDE() { return (typeof OLDTOWER !== 'undefined' && OLDTOWER.OUTSIDE) || { x: 14, z: -395, yaw: Math.PI }; },
    busy: () => busy || !!(typeof FBCORE !== 'undefined' && FBCORE && FBCORE.busy),
    get B() { return B; },
    _: { ISLES, WAYS, LANTERNS, SEATS, RS, pickItems, taskOf, clampWalk, heightAt, refresh, openWay, teleport, tally, wake, readPage, chooseLantern, mirror, listen, boyTalk, gift, core,
      t: {
        // straight into the realm at a trial (tests): o.t2 / t3 / t4 fill in what's before
        async at(tr = 1, o = {}) {
          const S = st(); S.stage = 'realm'; S.phase = 4; const r = RS(); r.trial = tr; r.woke = true;
          if (tr > 1) { r.t1.read = { 0: true, 1: true, 2: true, 3: true }; }
          if (tr > 3) { r.t3.why = 'S'; ['rosita', 'nacho', 'felix', 'aurora', 'ramiro'].forEach(k => { r.t3.heard[k] = true; r.t3.told[k] = 'S'; }); }
          if (tr > 4) { r.t4 = { g1: 'S', g2: 'S', g3: 'S' }; }
          await enter({ from: 'test' });
          if (B) refresh();
          return trial();
        },
      } },
  };
  Object.defineProperty(api, 'inside', { get: () => inside, configurable: true });
  return api;
})();
